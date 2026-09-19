import assert from 'node:assert/strict';
import test from 'node:test';

import { formatEntry, TAG_EMOJI } from './generate-readme.mjs';

function goodEntry(overrides = {}) {
  return {
    name: 'author/skill',
    url: 'https://github.com/author/skill',
    description: 'Does one thing well.',
    marker: null,
    ...overrides,
  };
}

test('each of the 5 tags renders its correct glyph', () => {
  for (const [tag, glyph] of Object.entries(TAG_EMOJI)) {
    const line = formatEntry(goodEntry({ tag }));
    assert.equal(
      line,
      `- **[author/skill](https://github.com/author/skill)** - Does one thing well (${glyph} ${tag}).`
    );
  }
});

test('an entry with both a marker and a tag renders both, correctly positioned', () => {
  const line = formatEntry(
    goodEntry({ marker: 'requires-key', tag: 'Research', description: 'Searches papers.' })
  );
  assert.equal(
    line,
    '- **[author/skill](https://github.com/author/skill)** - 🔑 Searches papers (🔎 Research).'
  );
});

test('a marker-only entry (no tag) keeps the marker prefix with no trailing parenthetical', () => {
  const line = formatEntry(goodEntry({ marker: 'external-service' }));
  assert.equal(
    line,
    '- **[author/skill](https://github.com/author/skill)** - 🌐 Does one thing well.'
  );
});

test('a skill entry (no tag) renders with no trailing parenthetical at all', () => {
  const line = formatEntry(goodEntry());
  assert.equal(
    line,
    '- **[author/skill](https://github.com/author/skill)** - Does one thing well.'
  );
});

test('a tagged entry strips the original trailing period before appending the glyph suffix', () => {
  const line = formatEntry(goodEntry({ tag: 'Career', description: 'Tailors resumes.' }));
  assert.equal(line.includes('resumes (💼 Career).'), true);
  assert.equal(line.includes('resumes. ('), false);
});
