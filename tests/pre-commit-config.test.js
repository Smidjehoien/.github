'use strict';

/* SPDX-License-Identifier: MPL-2.0 */

// Tests for the newly-added `.pre-commit-config.yaml` placeholder file.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', '.pre-commit-config.yaml');

describe('.pre-commit-config.yaml', () => {
  it('exists at the repository root', () => {
    assert.ok(fs.existsSync(CONFIG_PATH), 'expected .pre-commit-config.yaml to exist');
  });

  it('declares an empty repos list', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    assert.equal(content.trim(), 'repos: []');
  });

  it('contains exactly one non-blank line (a minimal placeholder, not a full config)', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const nonBlankLines = content.split('\n').filter((line) => line.trim() !== '');
    assert.equal(nonBlankLines.length, 1);
  });

  it('does not use tabs for indentation (YAML requires spaces)', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    assert.ok(!content.includes('\t'), 'expected no tab characters in the YAML file');
  });
});