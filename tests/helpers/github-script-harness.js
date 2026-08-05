'use strict';

/**
 * Test harness for unit-testing the inline `actions/github-script` code
 * embedded in `.github/workflows/*.yml` files, without a full YAML parser
 * and without any third-party npm dependencies.
 *
 * `extractScriptBlock` pulls the literal contents of a `script: |` block
 * scalar out of a workflow YAML source string. `runGithubScript` then
 * executes that source inside a fresh `vm` context, wiring up mocked
 * `require`, `github`, and `context` globals the same way the real
 * `actions/github-script` action does at runtime.
 */

const vm = require('node:vm');

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} yamlSource Full text of a workflow YAML file.
 * @param {string} [stepName] Optional `- name:` value used to scope the
 *   search, in case a file contains more than one `script:` block.
 * @returns {string} The dedented JavaScript source of the script block.
 */
function extractScriptBlock(yamlSource, stepName) {
  const lines = yamlSource.split('\n');

  let searchStart = 0;
  if (stepName) {
    const stepRe = new RegExp(`^\\s*-\\s*name:\\s*${escapeRegExp(stepName)}\\s*$`);
    const idx = lines.findIndex((line) => stepRe.test(line));
    if (idx === -1) {
      throw new Error(`Could not find a step named "${stepName}" in YAML source`);
    }
    searchStart = idx;
  }

  const scriptKeyRe = /^(\s*)script:\s*\|-?\s*$/;
  let scriptLineIdx = -1;
  let keyIndent = 0;
  for (let i = searchStart; i < lines.length; i++) {
    const match = scriptKeyRe.exec(lines[i]);
    if (match) {
      scriptLineIdx = i;
      keyIndent = match[1].length;
      break;
    }
  }
  if (scriptLineIdx === -1) {
    throw new Error('Could not find a `script: |` block in YAML source');
  }

  const collected = [];
  for (let i = scriptLineIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      collected.push('');
      continue;
    }
    const indent = line.match(/^\s*/)[0].length;
    if (indent <= keyIndent) break;
    collected.push(line);
  }

  while (collected.length && collected[collected.length - 1] === '') {
    collected.pop();
  }

  const nonBlank = collected.filter((line) => line.trim() !== '');
  const minIndent = nonBlank.length
    ? Math.min(...nonBlank.map((line) => line.match(/^\s*/)[0].length))
    : 0;

  return collected.map((line) => (line === '' ? '' : line.slice(minIndent))).join('\n');
}

/**
 * Executes extracted github-script source in a sandboxed VM context.
 *
 * @param {string} scriptSrc JS source, as returned by `extractScriptBlock`.
 * @param {object} opts
 * @param {object} opts.github Mock `github` (octokit) client.
 * @param {object} opts.context Mock `context` object.
 * @param {object} [opts.modules] Map of module name -> mock export, used to
 *   satisfy `require(...)` calls made inside the script (e.g. the script's
 *   own `const core = require('@actions/core')`).
 */
async function runGithubScript(scriptSrc, { github, context, modules = {} } = {}) {
  const sandbox = {
    console,
    github,
    context,
    require(name) {
      if (Object.prototype.hasOwnProperty.call(modules, name)) {
        return modules[name];
      }
      throw new Error(`Unmocked module requested in sandbox: ${name}`);
    },
  };
  const vmContext = vm.createContext(sandbox);
  const wrapped = `(async () => {\n${scriptSrc}\n})()`;
  const script = new vm.Script(wrapped, { filename: 'github-script.js' });
  return script.runInContext(vmContext);
}

/**
 * Creates a mock of the `@actions/core` module surface used by the
 * cla-mark.yml script.
 */
function createMockCore({ inputs = {}, booleanInputs = {} } = {}) {
  const state = {
    infos: [],
    warnings: [],
    failedMessage: null,
    summaryRows: [],
    summaryLists: [],
  };
  const summary = {
    addHeading() {
      return summary;
    },
    addTable(rows) {
      state.summaryRows.push(rows);
      return summary;
    },
    addList(items) {
      state.summaryLists.push(items);
      return summary;
    },
    write: async () => summary,
  };
  return {
    getInput: (name) => (name in inputs ? inputs[name] : ''),
    getBooleanInput: (name) => Boolean(booleanInputs[name]),
    info: (msg) => state.infos.push(msg),
    warning: (msg) => state.warnings.push(msg),
    setFailed: (msg) => {
      state.failedMessage = msg;
    },
    summary,
    __state: state,
  };
}

/**
 * Creates a mock of the `github` (octokit) client surface used by the
 * cla-mark.yml script, including the repo/org invitation endpoints and
 * `github.paginate` helper added by this PR.
 */
function createMockGithub({
  repoInvitations = [],
  orgInvitations = [],
  repoInvitationsError = null,
  orgInvitationsError = null,
  existingLabels = new Set(),
} = {}) {
  const calls = {
    listInvitations: 0,
    listPendingInvitations: 0,
    getLabel: [],
    createLabel: [],
    removeLabel: [],
    addLabels: [],
  };

  const rest = {
    issues: {
      getLabel: async ({ name }) => {
        calls.getLabel.push(name);
        if (existingLabels.has(name)) return { data: { name } };
        const err = new Error('Not Found');
        err.status = 404;
        throw err;
      },
      createLabel: async ({ name, color, description }) => {
        calls.createLabel.push({ name, color, description });
        existingLabels.add(name);
        return { data: { name } };
      },
      removeLabel: async ({ name }) => {
        calls.removeLabel.push(name);
        return {};
      },
      addLabels: async ({ labels }) => {
        calls.addLabels.push(...labels);
        return { data: [] };
      },
    },
    repos: {
      listInvitations: async () => {
        calls.listInvitations += 1;
        if (repoInvitationsError) throw repoInvitationsError;
        return { data: repoInvitations };
      },
    },
    orgs: {
      listPendingInvitations: async () => {
        calls.listPendingInvitations += 1;
        if (orgInvitationsError) throw orgInvitationsError;
        return { data: orgInvitations };
      },
    },
  };

  return {
    rest,
    paginate: async (fn, params) => {
      const res = await fn(params);
      return res.data;
    },
    __calls: calls,
  };
}

module.exports = {
  extractScriptBlock,
  runGithubScript,
  createMockCore,
  createMockGithub,
};