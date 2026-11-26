import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PT, resolveLang } from '../js/i18n.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const privateBans = (process.env.PRIVATE_BANS || '').split(',').map((s) => s.trim()).filter(Boolean);

const textKeys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]);
const attrKeys = [...html.matchAll(/data-i18n-attr="([^"]+)"/g)]
  .flatMap((m) => m[1].split(';').map((pair) => pair.slice(pair.indexOf(':') + 1)));
const htmlKeys = new Set([...textKeys, ...attrKeys]);

test('every data-i18n key has a PT string', () => {
  const missing = textKeys.filter((k) => !(k in PT));
  assert.deepEqual(missing, []);
});

test('every data-i18n-attr key is well formed and has a PT string', () => {
  assert.ok(attrKeys.length > 0, 'expected data-i18n-attr keys');
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(';')) {
      assert.match(pair, /^[a-z-]+:[a-z0-9]+(\.[a-z0-9-]+)+$/, `bad pair: ${pair}`);
    }
  }
  assert.deepEqual(attrKeys.filter((k) => !(k in PT)), []);
});

test('no orphan PT keys', () => {
  const orphans = Object.keys(PT).filter((k) => !k.startsWith('meta.') && !htmlKeys.has(k));
  assert.deepEqual(orphans, []);
});

test('meta strings exist', () => {
  assert.ok(PT['meta.title']);
  assert.ok(PT['meta.description']);
});

test('no empty PT strings', () => {
  const empty = Object.entries(PT).filter(([, v]) => typeof v !== 'string' || !v.trim()).map(([k]) => k);
  assert.deepEqual(empty, []);
});

test('PT never leaks private data', () => {
  const all = Object.values(PT).join('\n');
  assert.doesNotMatch(all, /@aegro\.io|\.pdf|\b9\d{4}-?\d{4}/);
});

test('PT leaks none of the private bans', { skip: privateBans.length ? false : 'PRIVATE_BANS not set' }, () => {
  const all = Object.values(PT).join('\n');
  for (const [i, banned] of privateBans.entries()) {
    assert.ok(!all.includes(banned), `leaked PRIVATE_BANS[${i}]`);
  }
});

test('resolveLang', () => {
  assert.equal(resolveLang('?lang=pt', null), 'pt');
  assert.equal(resolveLang('', 'pt'), 'pt');
  assert.equal(resolveLang('?lang=en', 'pt'), 'en');
  assert.equal(resolveLang('?lang=xx', null), 'en');
  assert.equal(resolveLang('', null), 'en');
  assert.equal(resolveLang('', 'garbage'), 'en');
  assert.equal(resolveLang(undefined, undefined), 'en');
});
