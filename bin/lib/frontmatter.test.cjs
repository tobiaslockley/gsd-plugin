'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { extractFrontmatter } = require('./frontmatter.cjs');

test('extractFrontmatter: returns scalars from leading block', () => {
  const input = '---\nkey: value\nnum: 42\n---\n\nbody';
  assert.deepEqual(extractFrontmatter(input), { key: 'value', num: '42' });
});

test('extractFrontmatter: ignores thematic breaks in body', () => {
  const input = [
    '---',
    'real_frontmatter: top',
    '---',
    '',
    '# Heading',
    '',
    'Some prose.',
    '',
    '---',
    '',
    'A thematic break.',
    '',
    '---',
    '',
    'More prose.',
    '',
  ].join('\n');

  assert.deepEqual(extractFrontmatter(input), { real_frontmatter: 'top' });
});

test('extractFrontmatter: returns empty object when no leading frontmatter', () => {
  const input = '# heading\n\n---\n\nbody split\n\n---\n';
  assert.deepEqual(extractFrontmatter(input), {});
});

test('extractFrontmatter: handles nested objects', () => {
  const input = '---\nprogress:\n  percent: 42\n  stage: mid\n---\n';
  const fm = extractFrontmatter(input);
  assert.ok(fm.progress);
  assert.equal(fm.progress.percent, '42');
  assert.equal(fm.progress.stage, 'mid');
});
