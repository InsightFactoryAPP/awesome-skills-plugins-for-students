import assert from 'node:assert/strict';
import test from 'node:test';

import { findDuplicateUrls } from './audit-duplicate-urls.mjs';

function buildReadme(entries) {
  return ['# Awesome Skills', '', ...entries, ''].join('\n');
}

test('reports no duplicates when every URL is unique', () => {
  const readme = buildReadme([
    '- **[author/skill-one](https://github.com/author/skill-one)** - Does one thing.',
    '- **[author/skill-two](https://github.com/author/skill-two)** - Does another thing.',
  ]);
  assert.deepEqual(findDuplicateUrls(readme), []);
});

test('detects a URL repeated across two bullets', () => {
  const readme = buildReadme([
    '- **[author/skill-one](https://github.com/author/dup)** - First mention.',
    '- **[author/skill-two](https://github.com/author/dup)** - Second mention.',
  ]);
  const duplicates = findDuplicateUrls(readme);

  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].url, 'https://github.com/author/dup');
  assert.equal(duplicates[0].occurrences.length, 2);
  assert.equal(duplicates[0].occurrences[0].name, 'author/skill-one');
  assert.equal(duplicates[0].occurrences[1].name, 'author/skill-two');
});

test('records the correct line number for each occurrence', () => {
  const readme = buildReadme([
    'not a bullet',
    '- **[author/skill-one](https://github.com/author/dup)** - First mention.',
    '',
    '- **[author/skill-two](https://github.com/author/dup)** - Second mention.',
  ]);
  const [duplicate] = findDuplicateUrls(readme);

  assert.equal(duplicate.occurrences[0].line, 4);
  assert.equal(duplicate.occurrences[1].line, 6);
});

test('normalizes a trailing slash before comparing URLs', () => {
  const readme = buildReadme([
    '- **[author/skill-one](https://github.com/author/dup)** - First mention.',
    '- **[author/skill-two](https://github.com/author/dup/)** - Second mention, trailing slash.',
  ]);
  const duplicates = findDuplicateUrls(readme);

  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].url, 'https://github.com/author/dup');
});

test('sorts the most-repeated URL first', () => {
  const readme = buildReadme([
    '- **[author/a1](https://github.com/author/twice)** - A.',
    '- **[author/a2](https://github.com/author/twice)** - B.',
    '- **[author/b1](https://github.com/author/thrice)** - C.',
    '- **[author/b2](https://github.com/author/thrice)** - D.',
    '- **[author/b3](https://github.com/author/thrice)** - E.',
  ]);
  const duplicates = findDuplicateUrls(readme);

  assert.equal(duplicates.length, 2);
  assert.equal(duplicates[0].url, 'https://github.com/author/thrice');
  assert.equal(duplicates[0].occurrences.length, 3);
  assert.equal(duplicates[1].url, 'https://github.com/author/twice');
});

test('ignores non-entry lines entirely', () => {
  const readme = buildReadme([
    '## A heading',
    '',
    'Some prose that mentions (https://github.com/author/dup) but is not a bullet.',
    '- **[author/skill-one](https://github.com/author/dup)** - Real entry.',
  ]);
  assert.deepEqual(findDuplicateUrls(readme), []);
});

test('accepts the real README.md without throwing', () => {
  assert.doesNotThrow(() => {
    findDuplicateUrls('- **[a/b](https://github.com/a/b)** - Fine.');
  });
});
