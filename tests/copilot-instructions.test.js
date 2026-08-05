'use strict';

/**
 * Tests for the `cover_invited` documentation added to
 * `.github/copilot-instructions.md`, verifying it stays in sync with the
 * corresponding `workflow_call` input in `.github/workflows/cla-mark.yml`.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DOC_PATH = path.join(__dirname, '..', '.github', 'copilot-instructions.md');
const WORKFLOW_PATH = path.join(__dirname, '..', '.github', 'workflows', 'cla-mark.yml');

const doc = fs.readFileSync(DOC_PATH, 'utf8');
const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8');

describe('.github/copilot-instructions.md: cover_invited entry', () => {
  it('documents the cover_invited input with its default value', () => {
    assert.match(
      doc,
      /`cover_invited`: Treat users with a pending repo\/org invitation as covered \(default: false\)/
    );
  });

  it('lists cover_invited inside the Key Workflow "Inputs" section', () => {
    const inputsSection = doc.match(/\*\*Inputs\*\*[\s\S]*?(?=\n---)/);
    assert.ok(inputsSection, 'Expected an **Inputs** section before the next `---` divider');
    assert.match(inputsSection[0], /cover_invited/);
  });

  it('appears immediately after cover_collaborators and before create_missing_labels (matches workflow input order)', () => {
    const collabIdx = doc.indexOf('`cover_collaborators`');
    const invitedIdx = doc.indexOf('`cover_invited`');
    const createMissingIdx = doc.indexOf('`create_missing_labels`');
    assert.ok(collabIdx !== -1 && invitedIdx !== -1 && createMissingIdx !== -1);
    assert.ok(collabIdx < invitedIdx, 'cover_invited should be documented after cover_collaborators');
    assert.ok(invitedIdx < createMissingIdx, 'cover_invited should be documented before create_missing_labels');
  });

  it('documents the same default value as the workflow_call input declaration', () => {
    const workflowMatch = workflow.match(
      /cover_invited:\s*\n\s*description:.*\n\s*required:\s*false\s*\n\s*default:\s*(\w+)\s*\n\s*type:\s*boolean/
    );
    assert.ok(workflowMatch, 'Expected to find the cover_invited input block in cla-mark.yml');

    const docMatch = doc.match(/`cover_invited`:.*\(default:\s*(\w+)\)/);
    assert.ok(docMatch, 'Expected the doc to state a default value for cover_invited');

    assert.equal(docMatch[1], workflowMatch[1]);
  });

  it('mentions cover_invited exactly once (no stale duplicate entries)', () => {
    const occurrences = doc.match(/cover_invited/g) || [];
    assert.equal(occurrences.length, 1);
  });
});