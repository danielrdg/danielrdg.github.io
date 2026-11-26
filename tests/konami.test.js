import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKonami } from '../js/konami.js';

const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
const run = (keys) => {
  let n = 0;
  const feed = createKonami(() => { n++; });
  keys.forEach(feed);
  return n;
};

test('exact sequence fires once', () => assert.equal(run(SEQ), 1));
test('uppercase letters fire', () => assert.equal(run([...SEQ.slice(0, 8), 'B', 'A']), 1));
test('extra leading ArrowUp still fires', () => assert.equal(run(['ArrowUp', ...SEQ]), 1));
test('broken sequence does not fire', () => {
  assert.equal(run([...SEQ.slice(0, 5), 'x', ...SEQ.slice(6)]), 0);
  assert.equal(run(SEQ.slice(0, 9)), 0);
});
test('fires once per full sequence', () => assert.equal(run([...SEQ, ...SEQ]), 2));
test('ignores non-string keys', () => assert.equal(run([undefined, null, ...SEQ]), 1));
