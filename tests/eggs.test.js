import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EGG_IDS, createEggTracker, nextHintKey, isNight, passiveEggPrints } from '../js/eggs.js';

const mapStorage = (m = new Map()) => ({
  getItem: (k) => (m.has(k) ? m.get(k) : null),
  setItem: (k, v) => { m.set(k, String(v)); },
});

test('EGG_IDS has nine frozen ids', () => {
  assert.equal(EGG_IDS.length, 9);
  assert.ok(Object.isFrozen(EGG_IDS));
});

test('find is true once, then false', () => {
  const tr = createEggTracker(null);
  assert.equal(tr.find('konami'), true);
  assert.equal(tr.find('konami'), false);
  assert.equal(tr.has('konami'), true);
  assert.equal(tr.count(), 1);
  assert.equal(tr.total, 9);
  assert.deepEqual(tr.found(), ['konami']);
});

test('unknown ids are rejected', () => {
  const tr = createEggTracker(null);
  assert.equal(tr.find('bogus'), false);
  assert.equal(tr.count(), 0);
});

test('persists across trackers sharing storage', () => {
  const m = new Map();
  createEggTracker(mapStorage(m)).find('sudo');
  assert.equal(m.get('eggs.v1'), '["sudo"]');
  const b = createEggTracker(mapStorage(m));
  assert.equal(b.has('sudo'), true);
  assert.equal(b.find('sudo'), false);
});

test('throwing storage still counts in memory', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  const tr = createEggTracker(bad);
  assert.equal(tr.find('bell'), true);
  assert.equal(tr.count(), 1);
});

test('corrupt or foreign storage content is ignored', () => {
  assert.equal(createEggTracker(mapStorage(new Map([['eggs.v1', '{oops']]))).count(), 0);
  assert.equal(createEggTracker(mapStorage(new Map([['eggs.v1', '{"a":1}']]))).count(), 0);
  const tr = createEggTracker(mapStorage(new Map([['eggs.v1', '["night","zzz","night"]']])));
  assert.deepEqual(tr.found(), ['night']);
});

test('onChange fires with the count on new finds only', () => {
  const tr = createEggTracker(null);
  const seen = [];
  tr.onChange((n) => seen.push(n));
  tr.find('lounge'); tr.find('lounge'); tr.find('nope'); tr.find('bell');
  assert.deepEqual(seen, [1, 2]);
});

test('a throwing onChange callback does not break find', () => {
  const tr = createEggTracker(null);
  tr.onChange(() => { throw new Error('x'); });
  assert.equal(tr.find('lounge'), true);
});

test('nextHintKey', () => {
  assert.equal(nextHintKey([]), 'hint.lounge');
  assert.equal(nextHintKey(['lounge', 'sudo']), 'hint.approval');
  assert.equal(nextHintKey([...EGG_IDS]), 'hint.all');
});

test('isNight', () => {
  assert.equal(isNight(new Date(2026, 0, 1, 23)), true);
  assert.equal(isNight(new Date(2026, 0, 1, 5, 59)), true);
  assert.equal(isNight(new Date(2026, 0, 1, 6)), false);
  assert.equal(isNight(new Date(2026, 0, 1, 21, 59)), false);
  assert.equal(isNight(new Date(2026, 0, 1, 22)), true);
});

test('passive eggs never print, except the reduced-motion janitor on first find', () => {
  for (const firstFind of [true, false]) {
    for (const reducedMotion of [true, false]) {
      assert.equal(passiveEggPrints('night', { firstFind, reducedMotion }), false);
      assert.equal(passiveEggPrints('janitor', { firstFind, reducedMotion }), firstFind && reducedMotion);
    }
  }
  assert.equal(passiveEggPrints('konami', { firstFind: false, reducedMotion: false }), true);
});
