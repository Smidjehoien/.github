'use strict';

/* SPDX-License-Identifier: MPL-2.0 */

// Tests for the inline `actions/github-script` logic embedded in
// `.github/workflows/cla-mark.yml`, focused on the behavior added/changed
// in this PR: the `cover_invited` input and the `hasPendingInvite()` helper
// used to treat users with a pending repo/org invitation as CLA-covered.
//
// The workflow has no build step and no npm dependencies (see
// `.github/copilot-instructions.md`), so these tests use only Node's
// built-in `node:test` runner and `vm` module. The inline script is
// extracted verbatim from the YAML block scalar and executed inside a
// sandboxed `vm` context with mocked `context`, `github`, and
// `@actions/core` objects that mirror what `actions/github-script@v7`
// injects at runtime.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const WORKFLOW_PATH = path.join(__dirname, '..', '.github', 'workflows', 'cla-mark.yml');
const WORKFLOW_SOURCE = fs.readFileSync(WORKFLOW_PATH, 'utf8');

/**
 * Extracts the dedented body of the `script: |` block scalar from the
 * workflow YAML so it can be executed directly as JavaScript in a `vm`
 * sandbox. This avoids depending on a YAML parser (none is available in
 * this repo) while remaining robust to reformatting/reindentation.
 */
function extractInlineScript(ymlText) {
  const lines = ymlText.split('\n');
  const scriptLineIdx = lines.findIndex((line) => line.trim() === 'script: |');
  assert.notEqual(scriptLineIdx, -1, 'expected to find a "script: |" block in cla-mark.yml');

  const baseIndent = lines[scriptLineIdx].match(/^ */)[0].length;
  const collected = [];
  for (let i = scriptLineIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      collected.push('');
      continue;
    }
    const indent = line.match(/^ */)[0].length;
    if (indent <= baseIndent) break;
    collected.push(line);
  }
  while (collected.length && collected[collected.length - 1] === '') collected.pop();

  const nonBlank = collected.filter((line) => line !== '');
  assert.ok(nonBlank.length > 0, 'expected non-empty script block');
  const minIndent = Math.min(...nonBlank.map((line) => line.match(/^ */)[0].length));

  return collected.map((line) => (line === '' ? '' : line.slice(minIndent))).join('\n');
}

const SCRIPT_SRC = extractInlineScript(WORKFLOW_SOURCE);

// Values that cross the vm sandbox boundary (arrays/objects created while
// executing the sandboxed script) belong to a different Realm than this
// test file, which makes them fail Node's `assert.deepStrictEqual` even
// when structurally identical. Round-tripping through JSON reconstructs
// them using this Realm's built-ins so they can be compared normally.
function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

// Mirrors the `default:` values declared for these inputs in the
// `workflow_call` section of cla-mark.yml, since that default-filling is
// normally performed by the GitHub Actions runtime before the script's
// `core.getInput`/`core.getBooleanInput` calls ever run.
const INPUT_DEFAULTS = {
  label_covered: 'CLA: covered',
  label_review: 'CLA: review',
  allowlist_users: '',
  cover_org_members: true,
  create_missing_labels: false,
  cover_collaborators: false,
  cover_invited: false,
};

function createMockCore(inputs = {}) {
  const logs = { info: [], warning: [], setFailed: [] };
  const summary = {
    headings: [],
    tables: [],
    written: false,
  };
  const summaryApi = {
    addHeading(text) {
      summary.headings.push(text);
      return summaryApi;
    },
    addTable(rows) {
      summary.tables.push(toPlain(rows));
      return summaryApi;
    },
    write() {
      summary.written = true;
      return summaryApi;
    },
  };

  const core = {
    getInput(name) {
      const v = name in inputs ? inputs[name] : INPUT_DEFAULTS[name];
      return v === undefined || v === null ? '' : String(v);
    },
    getBooleanInput(name) {
      const v = name in inputs ? inputs[name] : INPUT_DEFAULTS[name];
      if (typeof v === 'boolean') return v;
      return String(v).toLowerCase() === 'true';
    },
    info(msg) {
      logs.info.push(msg);
    },
    warning(msg) {
      logs.warning.push(msg);
    },
    setFailed(msg) {
      logs.setFailed.push(msg);
    },
    summary: summaryApi,
  };

  return { core, logs, summary };
}

function createMockGithub({
  repoInvites,
  repoInvitesError,
  orgInvites,
  orgInvitesError,
} = {}) {
  const calls = {
    listInvitations: [],
    listPendingInvitations: [],
    getLabel: [],
    createLabel: [],
    removeLabel: [],
    addLabels: [],
  };

  const listInvitations = async (params) => {
    calls.listInvitations.push(toPlain(params));
    if (repoInvitesError) throw repoInvitesError;
    return repoInvites || [];
  };

  const listPendingInvitations = async (params) => {
    calls.listPendingInvitations.push(toPlain(params));
    if (orgInvitesError) throw orgInvitesError;
    return orgInvites || [];
  };

  // Real @octokit `paginate` accepts a request function and params and
  // returns the concatenated results across pages. Our mock functions
  // already return a full array, so a single invocation is sufficient to
  // faithfully exercise the calling code.
  const paginate = async (fn, params) => fn(params);

  const github = {
    paginate,
    rest: {
      repos: { listInvitations },
      orgs: { listPendingInvitations },
      issues: {
        async getLabel(params) {
          calls.getLabel.push(toPlain(params));
          const err = new Error('Not Found');
          err.status = 404;
          throw err;
        },
        async createLabel(params) {
          calls.createLabel.push(toPlain(params));
          return {};
        },
        async removeLabel(params) {
          calls.removeLabel.push(toPlain(params));
          const err = new Error('Not Found');
          err.status = 404;
          throw err;
        },
        async addLabels(params) {
          calls.addLabels.push(toPlain(params));
          return {};
        },
      },
    },
  };

  return { github, calls };
}

function createMockContext({
  owner = 'acme',
  repo = 'widgets',
  prNumber = 42,
  login = 'octocat',
  association = 'NONE',
  noPullRequest = false,
} = {}) {
  return {
    repo: { owner, repo },
    payload: {
      pull_request: noPullRequest
        ? undefined
        : {
            number: prNumber,
            user: login ? { login } : null,
            author_association: association,
          },
    },
  };
}

async function runClaMarkScript({ inputs, context, github }) {
  const { core, logs, summary } = createMockCore(inputs);

  function fakeRequire(moduleName) {
    if (moduleName === '@actions/core') return core;
    throw new Error(`Unexpected require() in inline script: ${moduleName}`);
  }

  const sandbox = { require: fakeRequire, context, github };
  vm.createContext(sandbox);

  const wrapped = `(async () => {\n${SCRIPT_SRC}\n})()`;
  const script = new vm.Script(wrapped, { filename: 'cla-mark-inline.js' });
  await script.runInContext(sandbox);

  return { logs, summary };
}

describe('.github/workflows/cla-mark.yml — workflow_call inputs', () => {
  it('declares a cover_invited boolean input defaulting to false', () => {
    const inputsSection = WORKFLOW_SOURCE.slice(
      WORKFLOW_SOURCE.indexOf('inputs:'),
      WORKFLOW_SOURCE.indexOf('jobs:')
    );
    const match = inputsSection.match(
      /cover_invited:\s*\n\s*description:[^\n]*\n\s*required:\s*false\s*\n\s*default:\s*false\s*\n\s*type:\s*boolean/
    );
    assert.ok(match, 'expected cover_invited to be declared as an optional boolean defaulting to false');
  });
});

describe('cla-mark inline script — cover_invited / hasPendingInvite', () => {
  it('does not query repo or org invitations when cover_invited is false (default)', async () => {
    const context = createMockContext({ login: 'octocat', association: 'NONE' });
    const { github, calls } = createMockGithub({
      repoInvites: [{ invitee: { login: 'octocat' } }],
    });

    const { summary } = await runClaMarkScript({
      inputs: { cover_invited: false },
      context,
      github,
    });

    assert.equal(calls.listInvitations.length, 0);
    assert.equal(calls.listPendingInvitations.length, 0);

    const [row] = summary.tables[0].filter((r) => r[0] === 'Pending invite found');
    assert.deepEqual(row, ['Pending invite found', 'false']);
    assert.deepEqual(calls.addLabels[0].labels, ['CLA: review']);
  });

  it('covers the author when a matching pending repo invitation exists', async () => {
    const context = createMockContext({ owner: 'acme', repo: 'widgets', login: 'octocat' });
    const { github, calls } = createMockGithub({
      repoInvites: [{ invitee: { login: 'octocat' } }],
      orgInvites: [],
    });

    const { summary } = await runClaMarkScript({
      inputs: { cover_invited: true },
      context,
      github,
    });

    assert.deepEqual(calls.addLabels[0].labels, ['CLA: covered']);
    assert.deepEqual(calls.listInvitations[0], { owner: 'acme', repo: 'widgets', per_page: 100 });
    // Repo invite matched first, so the org invitation lookup should be skipped.
    assert.equal(calls.listPendingInvitations.length, 0);

    const rows = Object.fromEntries(summary.tables[0].filter((r) => Array.isArray(r) && r.length === 2));
    assert.equal(rows['Treat invited users as covered'], 'true');
    assert.equal(rows['Pending invite found'], 'true');
    assert.equal(rows['Result'], 'CLA: covered');
  });

  it('covers the author via a pending org invitation when no repo invite matches', async () => {
    const context = createMockContext({ owner: 'acme', login: 'octocat' });
    const { github, calls } = createMockGithub({
      repoInvites: [{ invitee: { login: 'someone-else' } }],
      orgInvites: [{ login: 'octocat' }],
    });

    const { summary } = await runClaMarkScript({
      inputs: { cover_invited: true },
      context,
      github,
    });

    assert.deepEqual(calls.listPendingInvitations[0], { org: 'acme', per_page: 100 });
    assert.deepEqual(calls.addLabels[0].labels, ['CLA: covered']);
    const rows = Object.fromEntries(summary.tables[0].filter((r) => Array.isArray(r) && r.length === 2));
    assert.equal(rows['Pending invite found'], 'true');
  });

  it('does not cover the author when cover_invited is true but no invitation matches', async () => {
    const context = createMockContext({ login: 'octocat' });
    const { github, calls } = createMockGithub({ repoInvites: [], orgInvites: [] });

    const { summary } = await runClaMarkScript({
      inputs: { cover_invited: true },
      context,
      github,
    });

    assert.deepEqual(calls.addLabels[0].labels, ['CLA: review']);
    const rows = Object.fromEntries(summary.tables[0].filter((r) => Array.isArray(r) && r.length === 2));
    assert.equal(rows['Pending invite found'], 'false');
  });

  it('matches invited logins case-insensitively', async () => {
    const context = createMockContext({ login: 'OctoCat' });
    const { github } = createMockGithub({
      repoInvites: [{ invitee: { login: 'octocat' } }],
    });

    const { summary } = await runClaMarkScript({
      inputs: { cover_invited: true },
      context,
      github,
    });

    const rows = Object.fromEntries(summary.tables[0].filter((r) => Array.isArray(r) && r.length === 2));
    assert.equal(rows['Pending invite found'], 'true');
  });

  it('falls back to the org invitation check and warns when the repo invitation lookup fails', async () => {
    const context = createMockContext({ login: 'octocat' });
    const { github, calls } = createMockGithub({
      repoInvitesError: new Error('API rate limit exceeded'),
      orgInvites: [{ login: 'octocat' }],
    });

    const { logs, summary } = await runClaMarkScript({
      inputs: { cover_invited: true },
      context,
      github,
    });

    assert.equal(calls.listPendingInvitations.length, 1);
    assert.ok(
      logs.warning.some((m) => m.includes('Could not list repo invitations: API rate limit exceeded'))
    );
    const rows = Object.fromEntries(summary.tables[0].filter((r) => Array.isArray(r) && r.length === 2));
    assert.equal(rows['Pending invite found'], 'true');
  });

  it('returns false without throwing when both repo and org invitation lookups fail', async () => {
    const context = createMockContext({ login: 'octocat' });
    const { github } = createMockGithub({
      repoInvitesError: new Error('repo boom'),
      orgInvitesError: new Error('org boom'),
    });

    const { logs, summary } = await runClaMarkScript({
      inputs: { cover_invited: true },
      context,
      github,
    });

    assert.ok(logs.warning.some((m) => m.includes('Could not list repo invitations: repo boom')));
    assert.ok(logs.info.some((m) => m.includes('Skipping org invitation check: org boom')));
    const rows = Object.fromEntries(summary.tables[0].filter((r) => Array.isArray(r) && r.length === 2));
    assert.equal(rows['Pending invite found'], 'false');
  });

  it('skips invitation lookups entirely when the PR author login is empty', async () => {
    const context = createMockContext({ login: null });
    const { github, calls } = createMockGithub({
      repoInvites: [{ invitee: { login: 'octocat' } }],
      orgInvites: [{ login: 'octocat' }],
    });

    const { summary } = await runClaMarkScript({
      inputs: { cover_invited: true },
      context,
      github,
    });

    assert.equal(calls.listInvitations.length, 0);
    assert.equal(calls.listPendingInvitations.length, 0);
    const rows = Object.fromEntries(summary.tables[0].filter((r) => Array.isArray(r) && r.length === 2));
    assert.equal(rows['Pending invite found'], 'false');
  });

  it('still covers the author via pre-existing rules when cover_invited is true but no invite matches', async () => {
    // Regression check: adding the isInvited OR-operand must not break the
    // pre-existing allowlist/org-member/collaborator coverage logic.
    const context = createMockContext({ login: 'trusted-dev', association: 'MEMBER' });
    const { github } = createMockGithub({ repoInvites: [], orgInvites: [] });

    const { summary } = await runClaMarkScript({
      inputs: { cover_invited: true, cover_org_members: true },
      context,
      github,
    });

    const rows = Object.fromEntries(summary.tables[0].filter((r) => Array.isArray(r) && r.length === 2));
    assert.equal(rows['Pending invite found'], 'false');
    assert.equal(rows['Result'], 'CLA: covered');
  });

  it('bails out early via core.setFailed and performs no GitHub API calls when there is no pull_request payload', async () => {
    const context = createMockContext({ noPullRequest: true });
    const { github, calls } = createMockGithub({
      repoInvites: [{ invitee: { login: 'octocat' } }],
    });

    const { logs, summary } = await runClaMarkScript({
      inputs: { cover_invited: true },
      context,
      github,
    });

    assert.equal(logs.setFailed.length, 1);
    assert.match(logs.setFailed[0], /must be triggered from a pull_request/);
    assert.equal(calls.listInvitations.length, 0);
    assert.equal(calls.addLabels.length, 0);
    assert.equal(summary.written, false);
  });
});