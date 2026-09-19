#!/usr/bin/env node
// Reports every URL used more than once across README.md, regardless of section.
// This is a maintainer-facing audit, not a lint check: cross-section duplicates are
// often intentional (e.g. Physics & Maths Tutor serves both A-Level and IGCSE), so
// this script always exits 0 and never fails CI.

import { readFileSync } from 'node:fs';

function normalize(url) {
  return url.replace(/\/$/, '');
}

/**
 * Find every URL used more than once in a README.md-shaped bullet list.
 *
 * @param {string} readme
 * @returns {Array<{ url: string, occurrences: Array<{ name: string, line: number }> }>}
 *   duplicate URLs, most-repeated first, in the shape the CLI report walks.
 */
export function findDuplicateUrls(readme) {
  const lines = readme.split('\n');
  const byUrl = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const item = line.match(/^- \*\*\[(.+?)\]\((.+?)\)\*\*/);
    if (!item) continue;
    const [, name, rawUrl] = item;
    const url = normalize(rawUrl);
    if (!byUrl.has(url)) byUrl.set(url, []);
    byUrl.get(url).push({ name, line: i + 1 });
  }

  return [...byUrl.entries()]
    .filter(([, occurrences]) => occurrences.length > 1)
    .map(([url, occurrences]) => ({ url, occurrences }))
    .sort((a, b) => b.occurrences.length - a.occurrences.length);
}

// --- CLI runner ---
const isMain = process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url;
if (isMain) {
  const README_PATH = new URL('../README.md', import.meta.url);
  const readme = readFileSync(README_PATH, 'utf8');
  const duplicates = findDuplicateUrls(readme);

  if (!duplicates.length) {
    console.log('No URL is used more than once in README.md.');
    process.exit(0);
  }

  console.log(`${duplicates.length} URL(s) used more than once in README.md:\n`);
  for (const { url, occurrences } of duplicates) {
    console.log(`  ${url}  (${occurrences.length}x)`);
    for (const { name, line } of occurrences) {
      console.log(`    README.md:${line}  ${name}`);
    }
    console.log('');
  }

  process.exit(0);
}
