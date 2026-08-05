'use strict';

/**
 * Unit tests for the `cover_invited` feature added to
 * `.github/workflows/cla-mark.yml`.
 *
 * The workflow's logic lives inline in an `actions/github-script` step, so
 * these tests extract that script's source directly from the YAML file and
 * execute it in a sandboxed VM with mocked `core`/`github`/`context`
 * globals (see `tests/helpers/github-script-harness.js`). This lets us
 * exercise the real, unmodified script rather than a reimplementation of
 * it.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  extractScriptBlock,
  runGithubScript,
  createMockCore,
  createMockGithub,
} = require('./helpers/github-script-harness');

const WORKFLOW_PATH = path.join(__dirname, '..', '.github', 'workflows', 'cla-mark.yml');
const workflowSource = fs.readFileSync(WORKFLOW_PATH, 'utf8');
const scriptSrc = extractScriptBlock(workflowSource, 'Evaluate and label PR');

const DEFAULT_INPUTS = {
  label_covered: 'CLA: covered',
  label_review: 'CLA: review',
  allowlist_users: '',
};

const DEFAULT_BOOLEAN_INPUTS = {
  cover_org_members: true,
  cover_collaborators: false,
  cover_invited: false,
  create_missing_labels: false,
};

function buildContext({ login = 'someuser', association = 'NONE', number = 42 } = {}) {
  return {
    repo: { owner: 'acme', repo: 'widgets' },
    payload: {
      pull_request: {
        number,
        user: login === null ? null : { login },
        author_association: association,
      },
    },
  };
}

async function runScript({
  inputs = {},
  booleanInputs = {},
  githubOpts = {},
  contextOpts = {},
} = {}) {
  const core = createMockCore({
    inputs: { ...DEFAULT_INPUTS, ...inputs },
    booleanInputs: { ...DEFAULT_BOOLEAN_INPUTS, ...booleanInputs },
  });
  const github = createMockGithub(githubOpts);
  const context = buildContext(contextOpts);

  await runGithubScript(scriptSrc, {
    github,
    context,
    modules: { '@actions/core': core },
  });

  return { core, github, context };
}

describe('extractScriptBlock (harness sanity)', () => {
  it('extracts the full script for the labeling step', () => {
    assert.match(scriptSrc, /hasPendingInvite/);
    assert.match(scriptSrc, /coverInvited/);
    assert.equal(scriptSrc.split('\n')[0], "const core = require('@actions/core');");
  });

  it('dedents the extracted script so key top-level statements start at column 0', () => {
    const expectedTopLevelLines = [
      'const pr = context.payload.pull_request;',
      "const isInvited = coverInvited && await hasPendingInvite(prAuthor);",
      'const covered = isAllowlistedAuthor || isOrgMemberAuthor || isCollaborator || isInvited;',
      'core.summary',
    ];
    for (const expected of expectedTopLevelLines) {
      assert.ok(
        scriptSrc.split('\n').includes(expected),
        `expected line ${JSON.stringify(expected)} to appear at column 0 after dedenting`
      );
    }
  });
});

describe('workflow_call input: cover_invited', () => {
  it('is declared with required:false, default:false, type:boolean', () => {
    const match = workflowSource.match(
      /cover_invited:\s*\n\s*description:\s*"([^"]*)"\s*\n\s*required:\s*(\w+)\s*\n\s*default:\s*(\w+)\s*\n\s*type:\s*(\w+)/
    );
    assert.ok(match, 'cover_invited input block should exist in workflow_call.inputs');
    const [, description, required, defaultValue, type] = match;
    assert.match(description, /pending repo\/org invitation/i);
    assert.equal(required, 'false');
    assert.equal(defaultValue, 'false');
    assert.equal(type, 'boolean');
  });
});

describe('cover_invited disabled (default)', () => {
  it('never queries invitations and does not cover the author', async () => {
    const { core, github } = await runScript({
      booleanInputs: { cover_invited: false },
    });

    assert.equal(github.__calls.listInvitations, 0, 'repo invitations should not be queried');
    assert.equal(github.__calls.listPendingInvitations, 0, 'org invitations should not be queried');
    assert.deepEqual(github.__calls.addLabels, ['CLA: review']);
    assert.match(core.__state.infos.at(-1), /invited=false/);
    assert.match(core.__state.infos.at(-1), /covered=false/);
  });

  it('short-circuits hasPendingInvite via && even if invitations would otherwise match', async () => {
    const { github } = await runScript({
      booleanInputs: { cover_invited: false },
      githubOpts: {
        repoInvitations: [{ invitee: { login: 'someuser' } }],
      },
    });
    assert.equal(github.__calls.listInvitations, 0);
  });
});

describe('cover_invited enabled: repo invitation match', () => {
  it('covers the author when a matching repo invitation exists', async () => {
    const { core, github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'SomeUser' },
      githubOpts: {
        repoInvitations: [{ invitee: { login: 'someuser' } }],
      },
    });

    assert.equal(github.__calls.listInvitations, 1);
    assert.deepEqual(github.__calls.addLabels, ['CLA: covered']);
    assert.match(core.__state.infos.at(-1), /invited=true/);
    assert.match(core.__state.infos.at(-1), /covered=true/);
  });

  it('matches case-insensitively', async () => {
    const { github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'MixedCase' },
      githubOpts: {
        repoInvitations: [{ invitee: { login: 'mixedcase' } }],
      },
    });
    assert.deepEqual(github.__calls.addLabels, ['CLA: covered']);
  });

  it('does not fall through to the org invitation check once a repo match is found', async () => {
    const { github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'someuser' },
      githubOpts: {
        repoInvitations: [{ invitee: { login: 'someuser' } }],
      },
    });
    assert.equal(github.__calls.listPendingInvitations, 0);
  });

  it('tolerates invitation entries with a missing invitee (no crash, no match)', async () => {
    const { github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'someuser' },
      githubOpts: {
        repoInvitations: [{ invitee: null }, {}],
        orgInvitations: [],
      },
    });
    assert.deepEqual(github.__calls.addLabels, ['CLA: review']);
  });
});

describe('cover_invited enabled: org invitation match', () => {
  it('covers the author when no repo invite matches but an org invite does', async () => {
    const { core, github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'orguser' },
      githubOpts: {
        repoInvitations: [{ invitee: { login: 'someoneelse' } }],
        orgInvitations: [{ login: 'orguser' }],
      },
    });

    assert.equal(github.__calls.listInvitations, 1);
    assert.equal(github.__calls.listPendingInvitations, 1);
    assert.deepEqual(github.__calls.addLabels, ['CLA: covered']);
    assert.match(core.__state.infos.at(-1), /invited=true/);
  });

  it('matches org invitations case-insensitively', async () => {
    const { github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'OrgUser' },
      githubOpts: {
        orgInvitations: [{ login: 'orguser' }],
      },
    });
    assert.deepEqual(github.__calls.addLabels, ['CLA: covered']);
  });
});

describe('cover_invited enabled: no matching invitation', () => {
  it('leaves the author uncovered when neither repo nor org invites match', async () => {
    const { core, github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'nobody' },
      githubOpts: {
        repoInvitations: [{ invitee: { login: 'someoneelse' } }],
        orgInvitations: [{ login: 'anotherperson' }],
      },
    });

    assert.deepEqual(github.__calls.addLabels, ['CLA: review']);
    assert.match(core.__state.infos.at(-1), /invited=false/);
    assert.match(core.__state.infos.at(-1), /covered=false/);
  });

  it('treats an empty/author-less login as not invited without calling the API', async () => {
    const { github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: null },
    });

    assert.equal(github.__calls.listInvitations, 0);
    assert.equal(github.__calls.listPendingInvitations, 0);
    assert.deepEqual(github.__calls.addLabels, ['CLA: review']);
  });
});

describe('cover_invited enabled: API error handling', () => {
  it('logs a warning and falls through to the org check when repo invitations fail', async () => {
    const repoErr = new Error('Resource not accessible by integration');
    repoErr.status = 403;

    const { core, github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'orguser' },
      githubOpts: {
        repoInvitationsError: repoErr,
        orgInvitations: [{ login: 'orguser' }],
      },
    });

    assert.ok(
      core.__state.warnings.some((w) => /Could not list repo invitations/.test(w)),
      'expected a warning about the repo invitations failure'
    );
    assert.equal(github.__calls.listPendingInvitations, 1);
    assert.deepEqual(github.__calls.addLabels, ['CLA: covered']);
  });

  it('logs info (not a warning) and treats the author as not invited when org invitations fail (e.g. user-owned repo)', async () => {
    const orgErr = new Error('Not Found');
    orgErr.status = 404;

    const { core, github } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'someuser' },
      githubOpts: {
        repoInvitations: [],
        orgInvitationsError: orgErr,
      },
    });

    assert.ok(
      core.__state.infos.some((msg) => /Skipping org invitation check/.test(msg)),
      'expected an info log about skipping the org invitation check'
    );
    assert.equal(core.__state.warnings.length, 0, 'org invitation failures should not warn');
    assert.deepEqual(github.__calls.addLabels, ['CLA: review']);
  });

  it('still covers the author if both invitation checks error but another coverage rule applies', async () => {
    const err = new Error('boom');
    const { github } = await runScript({
      inputs: { allowlist_users: 'someuser' },
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'someuser' },
      githubOpts: {
        repoInvitationsError: err,
        orgInvitationsError: err,
      },
    });
    assert.deepEqual(github.__calls.addLabels, ['CLA: covered']);
  });
});

describe('cover_invited combined with the summary report', () => {
  it('adds "Treat invited users as covered" and "Pending invite found" rows to the summary table', async () => {
    const { core } = await runScript({
      booleanInputs: { cover_invited: true },
      contextOpts: { login: 'someuser' },
      githubOpts: {
        repoInvitations: [{ invitee: { login: 'someuser' } }],
      },
    });

    const rows = core.__state.summaryRows.at(-1);
    assert.ok(rows, 'expected a summary table to have been written');

    const coveredRow = rows.find((r) => r[0] === 'Treat invited users as covered');
    const pendingRow = rows.find((r) => r[0] === 'Pending invite found');
    assert.ok(coveredRow, 'expected a "Treat invited users as covered" row');
    assert.ok(pendingRow, 'expected a "Pending invite found" row');
    assert.equal(coveredRow[1], 'true');
    assert.equal(pendingRow[1], 'true');
  });

  it('reports "false" for both new rows when cover_invited is disabled', async () => {
    const { core } = await runScript({
      booleanInputs: { cover_invited: false },
    });

    const rows = core.__state.summaryRows.at(-1);
    const coveredRow = rows.find((r) => r[0] === 'Treat invited users as covered');
    const pendingRow = rows.find((r) => r[0] === 'Pending invite found');
    assert.ok(coveredRow);
    assert.ok(pendingRow);
    assert.equal(coveredRow[1], 'false');
    assert.equal(pendingRow[1], 'false');
  });
});

describe('covered = ... || isInvited (OR composition)', () => {
  it('is covered via invitation alone, with every other coverage rule false', async () => {
    const { github } = await runScript({
      inputs: { allowlist_users: '' },
      booleanInputs: {
        cover_org_members: false,
        cover_collaborators: false,
        cover_invited: true,
      },
      contextOpts: { login: 'invitee', association: 'NONE' },
      githubOpts: {
        repoInvitations: [{ invitee: { login: 'invitee' } }],
      },
    });
    assert.deepEqual(github.__calls.addLabels, ['CLA: covered']);
  });

  it('is not covered when invitation checking is enabled but no other rule matches and no invite is found', async () => {
    const { github } = await runScript({
      booleanInputs: {
        cover_org_members: false,
        cover_collaborators: false,
        cover_invited: true,
      },
      contextOpts: { login: 'invitee', association: 'NONE' },
      githubOpts: { repoInvitations: [], orgInvitations: [] },
    });
    assert.deepEqual(github.__calls.addLabels, ['CLA: review']);
  });
});