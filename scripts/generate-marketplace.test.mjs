import assert from 'node:assert/strict';
import test from 'node:test';

import { sourceFor, slugify } from './generate-marketplace.mjs';

test('an officialskills.sh URL resolves to the vendor repo + skills path', () => {
  const source = sourceFor('https://officialskills.sh/anthropics/skills/pdf');
  assert.deepEqual(source, {
    source: 'git-subdir',
    url: 'https://github.com/anthropics/skills.git',
    path: 'skills/pdf',
  });
});

test('an openai officialskills.sh URL resolves under the .curated path prefix', () => {
  const source = sourceFor('https://officialskills.sh/openai/skills/jupyter-notebook');
  assert.deepEqual(source, {
    source: 'git-subdir',
    url: 'https://github.com/openai/skills.git',
    path: 'skills/.curated/jupyter-notebook',
  });
});

test('a folder-name override (hugging-face-datasets) is applied', () => {
  const source = sourceFor('https://officialskills.sh/huggingface/skills/hugging-face-datasets');
  assert.deepEqual(source, {
    source: 'git-subdir',
    url: 'https://github.com/huggingface/skills.git',
    path: 'skills/huggingface-datasets',
  });
});

test('a github.com/.../tree/<ref>/<path> monorepo URL resolves correctly', () => {
  const source = sourceFor(
    'https://github.com/mattpocock/skills/tree/main/skills/diagnosing-bugs'
  );
  assert.deepEqual(source, {
    source: 'git-subdir',
    url: 'https://github.com/mattpocock/skills.git',
    path: 'skills/diagnosing-bugs',
    ref: 'main',
  });
});

test('a plain repo-root URL resolves correctly', () => {
  const source = sourceFor('https://github.com/author/skill-name');
  assert.deepEqual(source, { source: 'url', url: 'https://github.com/author/skill-name.git' });
});

test('a plain repo-root URL with a trailing slash resolves the same way', () => {
  const source = sourceFor('https://github.com/author/skill-name/');
  assert.deepEqual(source, { source: 'url', url: 'https://github.com/author/skill-name.git' });
});

test('an unknown officialskills.sh vendor throws', () => {
  assert.throws(
    () => sourceFor('https://officialskills.sh/notreal/skills/some-skill'),
    /No known repo mapping for officialskills\.sh vendor "notreal"/
  );
});

test('an unrecognized URL shape throws', () => {
  assert.throws(
    () => sourceFor('https://example.com/not-a-github-url'),
    /Don't know how to derive a plugin source for URL/
  );
});

test('slugify lowercases and hyphenates a display name', () => {
  assert.equal(slugify('author/Skill Name'), 'author-skill-name');
});

test('slugify strips leading and trailing separators', () => {
  assert.equal(slugify('  Weird -- Name!! '), 'weird-name');
});
