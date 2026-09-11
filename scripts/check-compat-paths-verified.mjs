#!/usr/bin/env node
// Validates data/compat-paths-verified.json against README.md's Compatibility
// Paths table and the convention documented in CONTRIBUTING.md ("The
// Compatibility Paths table's doc links"):
//   - the file is valid JSON: a flat object mapping doc URL -> ISO date
//   - its keys are exactly the five doc URLs referenced in the README's
//     Compatibility Paths section (no missing URL, no stale/typo'd extra key)
//   - every value matches YYYY-MM-DD and isn't in the future
//   - keys are sorted alphabetically
//
// This only checks the file's shape. It cannot check that a doc page's
// *content* still matches the feature the table claims -- that stays a
// human judgment call, same as CONTRIBUTING.md says.

import { readFileSync } from 'node:fs';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SECTION_HEADING = '## Compatibility Paths';

/**
 * @param {string} readme contents of README.md
 * @returns {string[]} every https:// URL linked from the Compatibility Paths
 *   section (the table's Docs column plus the plugin-docs paragraph below it)
 */
function extractCompatPathUrls(readme) {
  const start = readme.indexOf(SECTION_HEADING);
  if (start === -1) return [];
  const rest = readme.slice(start + SECTION_HEADING.length);
  const nextHeading = rest.indexOf('\n## ');
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);

  const urls = [];
  for (const m of section.matchAll(/\]\((https:\/\/[^)]+)\)/g)) {
    urls.push(m[1]);
  }
  return urls;
}

/**
 * @param {string} readme contents of README.md
 * @param {string} rawJson contents of data/compat-paths-verified.json
 * @returns {string[]} human-readable validation errors
 */
export function validateCompatPathsVerified(readme, rawJson) {
  let data;
  try {
    data = JSON.parse(rawJson);
  } catch (e) {
    return [`data/compat-paths-verified.json is not valid JSON: ${e.message}`];
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return ['data/compat-paths-verified.json must be a flat JSON object of "url": "YYYY-MM-DD" pairs.'];
  }

  const errors = [];
  const keys = Object.keys(data);
  const tableUrls = new Set(extractCompatPathUrls(readme));

  if (tableUrls.size === 0) {
    errors.push(
      `data/compat-paths-verified.json  Could not find a "${SECTION_HEADING}" section with any doc links in README.md.`
    );
    return errors;
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const key of keys) {
    if (!tableUrls.has(key)) {
      errors.push(
        `data/compat-paths-verified.json  URL doesn't match a doc link in README.md's Compatibility Paths section (typo, or it was removed): ${key}`
      );
    }

    const value = data[key];
    if (typeof value !== 'string' || !DATE_RE.test(value)) {
      errors.push(
        `data/compat-paths-verified.json  Value for "${key}" must be an ISO date (YYYY-MM-DD), got: ${JSON.stringify(value)}`
      );
      continue;
    }
    if (value > today) {
      errors.push(`data/compat-paths-verified.json  Date for "${key}" is in the future: ${value}`);
    }
  }

  for (const url of tableUrls) {
    if (!keys.includes(url)) {
      errors.push(
        `data/compat-paths-verified.json  Missing an entry for a doc link in README.md's Compatibility Paths section: ${url}`
      );
    }
  }

  const sorted = [...keys].sort();
  if (JSON.stringify(sorted) !== JSON.stringify(keys)) {
    errors.push(
      `data/compat-paths-verified.json  Keys must be sorted alphabetically.\n` +
        `    got:  ${keys.join(', ')}\n` +
        `    want: ${sorted.join(', ')}`
    );
  }

  return errors;
}

// --- CLI runner ---
const isMain = process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url;
if (isMain) {
  const README_PATH = new URL('../README.md', import.meta.url);
  const DATA_PATH = new URL('../data/compat-paths-verified.json', import.meta.url);
  const readme = readFileSync(README_PATH, 'utf8');
  const rawJson = readFileSync(DATA_PATH, 'utf8');

  const errors = validateCompatPathsVerified(readme, rawJson);

  if (errors.length) {
    console.error(`✖ ${errors.length} issue(s) found:\n`);
    for (const e of errors) console.error(`  ${e}\n`);
    process.exit(1);
  } else {
    console.log(
      '✔ data/compat-paths-verified.json is valid JSON, alphabetically sorted, and its keys exactly match README.md\'s Compatibility Paths doc links.'
    );
  }
}
