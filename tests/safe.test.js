import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safe } from '../js/safe.js';

test('safe returns the value of fn', () => {
  assert.equal(safe('x', () => 2), 2);
});

test('safe swallows errors and returns undefined', () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    assert.equal(safe('x', () => { throw new Error('boom'); }), undefined);
  } finally {
    console.warn = warn;
  }
});
