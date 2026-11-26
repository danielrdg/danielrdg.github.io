import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TREE, resolve, list, nodeAt, pathLabel, wrap } from '../js/fs.js';
import { COPY } from '../js/copy.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function files(node = TREE, out = []) {
  for (const child of Object.values(node.entries)) {
    if (child.kind === 'dir') files(child, out);
    else out.push(child);
  }
  return out;
}

test('resolve: home, parent, nested and trailing slash', () => {
  assert.deepEqual(resolve([], '~'), { path: [] });
  assert.deepEqual(resolve(['projects'], '~'), { path: [] });
  assert.deepEqual(resolve(['projects'], '~/academic'), { path: ['academic'] });
  assert.deepEqual(resolve(['projects'], '..'), { path: [] });
  assert.deepEqual(resolve(['projects'], '.'), { path: ['projects'] });
  assert.deepEqual(resolve([], 'projects/maitre.txt'), { path: ['projects', 'maitre.txt'] });
  assert.deepEqual(resolve([], 'projects/'), { path: ['projects'] });
  assert.deepEqual(resolve([], './projects//'), { path: ['projects'] });
  assert.deepEqual(resolve(['projects'], '../academic/iacc.txt'), { path: ['academic', 'iacc.txt'] });
});

test('resolve: outside, notfound, notdir', () => {
  assert.deepEqual(resolve([], '..'), { error: 'outside' });
  assert.deepEqual(resolve(['projects'], '../..'), { error: 'outside' });
  assert.deepEqual(resolve([], '/etc'), { error: 'outside' });
  assert.deepEqual(resolve([], '/'), { error: 'outside' });
  assert.deepEqual(resolve([], 'nope'), { error: 'notfound' });
  assert.deepEqual(resolve([], '~nope'), { error: 'notfound' });
  assert.deepEqual(resolve([], 'constructor'), { error: 'notfound' });
  assert.deepEqual(resolve([], 'about.txt/'), { error: 'notdir' });
  assert.deepEqual(resolve([], 'about.txt/x'), { error: 'notdir' });
});

test('resolve tolerates a bad cwd', () => {
  assert.deepEqual(resolve(['nope'], 'projects'), { path: ['projects'] });
  assert.deepEqual(resolve(undefined, 'projects'), { path: ['projects'] });
});

test('list: dirs first, then files, in tree order', () => {
  assert.deepEqual(list([]), ['experience/', 'projects/', 'academic/', 'about.txt', 'secrets.env']);
  assert.deepEqual(list(['experience']), ['aegro-engineer.txt', 'aegro-intern.txt']);
  assert.deepEqual(list(['projects']), [
    'maitre.txt', 'elysium.txt', 'issue-to-pr.txt', 'cockpit.txt', 'long-shift.txt',
    'spec-driven.txt', 'error-janitor.txt', 'support-copilots.txt', 'pr-risk-triage.txt',
  ]);
  assert.deepEqual(list(['academic']), ['iacc.txt', 'histoteria.txt']);
  assert.equal(list(['about.txt']), null);
  assert.equal(list(['nope']), null);
});

test('static ls copy agrees with the tree', () => {
  for (const lang of ['en', 'pt']) assert.equal(COPY[lang]['cmd.ls'], list([]).join('  '));
});

test('nodeAt and pathLabel', () => {
  assert.equal(nodeAt([]), TREE);
  assert.equal(nodeAt(['projects']).kind, 'dir');
  assert.deepEqual(nodeAt(['about.txt']), { kind: 'file', copy: 'cmd.about' });
  assert.deepEqual(nodeAt(['secrets.env']), { kind: 'file', egg: 'secrets' });
  assert.equal(nodeAt(['nope']), null);
  assert.equal(pathLabel([]), '~');
  assert.equal(pathLabel(['projects']), '~/projects');
});

test('every selector is non-empty, unique, and an id found exactly once in index.html', () => {
  const selectors = files().filter((f) => 'selector' in f).map((f) => f.selector);
  assert.equal(selectors.length, 13);
  assert.equal(new Set(selectors).size, selectors.length);
  for (const sel of selectors) {
    assert.match(sel, /^#[a-z][a-z0-9-]*$/, sel);
    const hits = html.split(`id="${sel.slice(1)}"`).length - 1;
    assert.equal(hits, 1, sel);
  }
});

test('wrap keeps words whole within the width', () => {
  assert.deepEqual(wrap('  a   b\n c  ', 72), ['a b c']);
  const lines = wrap('word '.repeat(40), 20);
  assert.ok(lines.length > 1 && lines.every((l) => l.length <= 20));
  assert.deepEqual(wrap('x'.repeat(30), 10), ['x'.repeat(30)]);
  assert.deepEqual(wrap('', 72), []);
});
