'use strict';

/* SPDX-License-Identifier: MPL-2.0 */

// Tests for the `cover_invited` documentation added to
// `.github/copilot-instructions.md` in this PR.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DOC_PATH = path.join(__dirname, '..', '.github', 'copilot-instructions.md');
const DOC_SOURCE = fs.readFileSync(DOC_PATH, 'utf8');

describe('.github/copilot-instructions.md — cover_invited documentation', () => {
  it('documents the cover_invited input with its default value', () => {
    assert.match(
      DOC_SOURCE,
      /`cover_invited`: Treat users with a pending repo\/org invitation as covered \(default: false\)/
    );
  });

  it('lists cover_invited between cover_collaborators and create_missing_labels, matching cla-mark.yml input order', () => {
    const collaboratorsIdx = DOC_SOURCE.indexOf('`cover_collaborators`');
    const invitedIdx = DOC_SOURCE.indexOf('`cover_invited`');
    const createMissingIdx = DOC_SOURCE.indexOf('`create_missing_labels`');

    assert.ok(collaboratorsIdx !== -1, 'expected cover_collaborators to be documented');
    assert.ok(invitedIdx !== -1, 'expected cover_invited to be documented');
    assert.ok(createMissingIdx !== -1, 'expected create_missing_labels to be documented');

    assert.ok(collaboratorsIdx < invitedIdx, 'cover_invited should be documented after cover_collaborators');
    assert.ok(invitedIdx < createMissingIdx, 'cover_invited should be documented before create_missing_labels');
  });

  it('only documents cover_invited once', () => {
    const occurrences = DOC_SOURCE.split('`cover_invited`').length - 1;
    assert.equal(occurrences, 1);
  });
});