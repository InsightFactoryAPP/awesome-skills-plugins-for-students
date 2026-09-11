import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { validateCompatPathsVerified } from './check-compat-paths-verified.mjs';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const rawJson = readFileSync(new URL('../data/compat-paths-verified.json', import.meta.url), 'utf8');

// A minimal fixture README with a Compatibility Paths section, used for the
// failure cases below so editing the real table never breaks this suite.
const fixtureReadme = [
  '# Awesome Skills',
  '',
  '## Compatibility Paths',
  '',
  '| Tool | Docs |',
  '| --- | --- |',
  '| Claude Code | [Skills docs](https://example.com/a) |',
  '| Cursor | [Cursor rules](https://example.com/b) |',
  '',
  '## Security Notice',
  '',
].join('\n');

test('accepts the real data/compat-paths-verified.json against the real README', () => {
  assert.deepEqual(validateCompatPathsVerified(readme, rawJson), []);
});

test('accepts a well-formed data file matching the fixture table', () => {
  const data = JSON.stringify({
    'https://example.com/a': '2026-01-01',
    'https://example.com/b': '2026-01-01',
  });
  assert.deepEqual(validateCompatPathsVerified(fixtureReadme, data), []);
});

test('rejects invalid JSON', () => {
  const errors = validateCompatPathsVerified(fixtureReadme, '{ not json');
  assert(errors.some((e) => e.includes('is not valid JSON')));
});

test('rejects a URL not in the Compatibility Paths section', () => {
  const data = JSON.stringify({
    'https://example.com/a': '2026-01-01',
    'https://example.com/b': '2026-01-01',
    'https://example.com/gone': '2026-01-01',
  });
  const errors = validateCompatPathsVerified(fixtureReadme, data);
  assert(errors.some((e) => e.includes("doesn't match a doc link")));
});

test('rejects a missing URL from the Compatibility Paths section', () => {
  const data = JSON.stringify({ 'https://example.com/a': '2026-01-01' });
  const errors = validateCompatPathsVerified(fixtureReadme, data);
  assert(errors.some((e) => e.includes('Missing an entry for a doc link')));
});

test('rejects a non-ISO date', () => {
  const data = JSON.stringify({
    'https://example.com/a': '01/01/2026',
    'https://example.com/b': '2026-01-01',
  });
  const errors = validateCompatPathsVerified(fixtureReadme, data);
  assert(errors.some((e) => e.includes('must be an ISO date')));
});

test('rejects a future date', () => {
  const data = JSON.stringify({
    'https://example.com/a': '2099-01-01',
    'https://example.com/b': '2026-01-01',
  });
  const errors = validateCompatPathsVerified(fixtureReadme, data);
  assert(errors.some((e) => e.includes('is in the future')));
});

test('rejects unsorted keys', () => {
  const data = JSON.stringify({
    'https://example.com/b': '2026-01-01',
    'https://example.com/a': '2026-01-01',
  });
  const errors = validateCompatPathsVerified(fixtureReadme, data);
  assert(errors.some((e) => e.includes('sorted alphabetically')));
});
