import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const privateBans = (process.env.PRIVATE_BANS || '').split(',').map((s) => s.trim()).filter(Boolean);

test('has the facts from the CV', () => {
  const facts = [
    'Daniel Rodrigues', 'Software Engineer I', 'May 2026', 'Mar 2025', '50%',
    'IACC', 'Histotéria', '2022–2026', 'PUCRS',
    'github.com/danielrdg/maitre', 'github.com/danielrdg/elysium',
    'linkedin.com/in/danielrdgg', 'mailto:dani.araujo2002@gmail.com',
  ];
  for (const fact of facts) {
    assert.ok(html.includes(fact), `missing: ${fact}`);
  }
});

test('leaks nothing private', () => {
  assert.doesNotMatch(html, /\(?\b51\)?\s?9\d{4}-?\d{4}/);
  assert.doesNotMatch(html, /@aegro\.io/);
  for (const banned of ['.pdf', 'merged']) {
    assert.ok(!html.includes(banned), `leaked: ${banned}`);
  }
});

test('leaks none of the private bans', { skip: privateBans.length ? false : 'PRIVATE_BANS not set' }, () => {
  for (const [i, banned] of privateBans.entries()) {
    assert.ok(!html.includes(banned), `leaked PRIVATE_BANS[${i}]`);
  }
});

test('every translatable node has a key', () => {
  const keys = [...html.matchAll(/data-i18n="([^"]*)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 0, 'expected data-i18n keys');
  const seen = new Set();
  for (const key of keys) {
    assert.match(key, /^[a-z0-9]+(\.[a-z0-9-]+)+$/, `bad key: ${key}`);
    assert.ok(!seen.has(key), `duplicate key: ${key}`);
    seen.add(key);
  }
});

test('meta and og tags', () => {
  for (const needle of ['<html lang="en"', 'og:title', 'og:description', 'og:image', 'twitter:card', 'rel="icon"']) {
    assert.ok(html.includes(needle), `missing: ${needle}`);
  }
});
