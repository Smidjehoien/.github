'use strict';

/**
 * Tests for the newly added `.pre-commit-config.yaml` placeholder file.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const CONFIG_PATH = path.join(__dirname, '..', '.pre-commit-config.yaml');

describe('.pre-commit-config.yaml', () => {
  it('exists at the repository root', () => {
    assert.ok(fs.existsSync(CONFIG_PATH), `Expected ${CONFIG_PATH} to exist`);
  });

  it('declares an empty repos list', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    assert.match(content.trim(), /^repos:\s*\[\]$/);
  });

  it('contains no top-level keys other than "repos"', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const topLevelKeys = content
      .split('\n')
      .filter((line) => /^[A-Za-z_][\w-]*:/.test(line))
      .map((line) => line.split(':')[0].trim());
    assert.deepEqual(topLevelKeys, ['repos']);
  });

  it('does not define any hook repositories (intentionally empty placeholder)', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    assert.doesNotMatch(content, /-\s*repo:/);
  });

  it('ends with a trailing newline and has no trailing whitespace on any line', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    assert.ok(content.endsWith('\n'), 'file should end with a trailing newline');
    for (const line of content.split('\n')) {
      assert.equal(line, line.replace(/[ \t]+$/, ''), `unexpected trailing whitespace: ${JSON.stringify(line)}`);
    }
  });

  it('is a single-line file (just the empty repos declaration)', () => {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    const nonEmptyLines = content.split('\n').filter((line) => line.trim() !== '');
    assert.equal(nonEmptyLines.length, 1);
  });
});