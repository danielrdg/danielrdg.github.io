import { test } from 'node:test';
import assert from 'node:assert/strict';
import { complete, tabAction, COMPLETIONS } from '../js/complete.js';
import { runCommand } from '../js/commands.js';
import { t } from '../js/copy.js';

const none = (input) => ({ value: input, candidates: [] });

test('single match completes to the full command', () => {
  assert.deepEqual(complete('he'), { value: 'help', candidates: ['help'] });
  assert.deepEqual(complete('  HE'), { value: 'help', candidates: ['help'] });
  assert.deepEqual(complete('co'), { value: 'contact', candidates: ['contact'] });
  assert.deepEqual(complete('cat a'), { value: 'cat about.txt', candidates: ['cat about.txt'] });
  assert.deepEqual(complete('lang p'), { value: 'lang pt', candidates: ['lang pt'] });
});

test('several matches return the common prefix and all candidates in order', () => {
  assert.deepEqual(complete('c'), {
    value: 'c',
    candidates: ['cd', 'cat', 'contact', 'cv', 'clear'],
  });
  assert.deepEqual(complete('cat '), { value: 'cat ', candidates: ['cat about.txt', 'cat secrets.env'] });
  assert.deepEqual(complete('lang '), { value: 'lang ', candidates: ['lang pt', 'lang en'] });
  assert.deepEqual(complete('ca'), { value: 'cat ', candidates: ['cat about.txt', 'cat secrets.env'] });
});

test('whitespace is normalized', () => {
  assert.deepEqual(complete('cat   '), { value: 'cat ', candidates: ['cat about.txt', 'cat secrets.env'] });
});

test('eggs and unknown input are not completed', () => {
  assert.deepEqual(complete('/lo'), none('/lo'));
  assert.deepEqual(complete('sudo'), none('sudo'));
  assert.deepEqual(complete('rm'), none('rm'));
  assert.deepEqual(complete('xyz'), none('xyz'));
  assert.deepEqual(complete(''), none(''));
  assert.deepEqual(complete('   '), none('   '));
});

test('never throws on non-strings', () => {
  for (const v of [undefined, null, 1, {}, [], () => {}, Symbol('x')]) {
    assert.deepEqual(complete(v), { value: '', candidates: [] });
  }
});

test('vocabulary is exactly the public commands', () => {
  assert.deepEqual(COMPLETIONS, [
    'help', 'whoami', 'ls', 'cd', 'pwd', 'cat', 'contact', 'cv',
    'lang pt', 'lang en', 'replay', 'clear', 'hint',
  ]);
});

test('every completion is a real command', () => {
  for (const entry of COMPLETIONS) {
    const res = runCommand(entry, { lang: 'en', found: [] });
    const notFound = { lines: t('en', 'cmd.notfound', { input: entry }).split('\n') };
    assert.notDeepEqual(res.lines, notFound.lines, entry);
  }
});

test('tabAction never traps focus', () => {
  for (const c of COMPLETIONS) assert.equal(tabAction(c, null).kind, 'pass', c);
  assert.equal(tabAction('', null).kind, 'pass');
  assert.equal(tabAction('/lo', null).kind, 'pass');
  assert.equal(tabAction('xyz', null).kind, 'pass');
  assert.equal(tabAction(5, null).kind, 'pass');
});

test('tabAction completes, lists once, then passes', () => {
  assert.deepEqual(tabAction('he', null), { kind: 'complete', value: 'help', candidates: ['help'] });
  assert.equal(tabAction('ca', null).kind, 'complete');
  const list = tabAction('c', null);
  assert.equal(list.kind, 'list');
  assert.equal(list.candidates.length, 5);
  assert.equal(tabAction('c', 'c').kind, 'pass');
  assert.equal(tabAction('c', 'cat ').kind, 'list');
});

test('path completion against the cwd', () => {
  assert.deepEqual(complete('cd ex'), { value: 'cd experience/', candidates: ['cd experience/'] });
  assert.deepEqual(complete('cat ma', ['projects']), { value: 'cat maitre.txt', candidates: ['cat maitre.txt'] });
  assert.deepEqual(complete('cat projects/ma'), { value: 'cat projects/maitre.txt', candidates: ['cat projects/maitre.txt'] });
  assert.deepEqual(complete('cat pro'), { value: 'cat projects/', candidates: ['cat projects/'] });
  assert.deepEqual(complete('cat s'), { value: 'cat secrets.env', candidates: ['cat secrets.env'] });
  assert.deepEqual(complete('cd ../ac', ['projects']), { value: 'cd ../academic/', candidates: ['cd ../academic/'] });
  assert.deepEqual(complete('ls a', ['academic']), { value: 'ls a', candidates: [] });
  assert.deepEqual(complete('cd '), { value: 'cd ', candidates: ['cd experience/', 'cd projects/', 'cd academic/'] });
  assert.deepEqual(complete('cd a'), { value: 'cd academic/', candidates: ['cd academic/'] });
  assert.deepEqual(complete('ls '), {
    value: 'ls ',
    candidates: ['ls experience/', 'ls projects/', 'ls academic/', 'ls about.txt', 'ls secrets.env'],
  });
  assert.deepEqual(complete('cat a', ['academic']), { value: 'cat a', candidates: [] });
  assert.deepEqual(complete('cat i', ['academic']), { value: 'cat iacc.txt', candidates: ['cat iacc.txt'] });
});

test('path completion ignores bad paths and extra args', () => {
  assert.deepEqual(complete('cd /e'), none('cd /e'));
  assert.deepEqual(complete('cd ../x'), none('cd ../x'));
  assert.deepEqual(complete('cat about.txt/x'), none('cat about.txt/x'));
  assert.deepEqual(complete('cd zz'), none('cd zz'));
  assert.deepEqual(complete('cat a b'), none('cat a b'));
  assert.deepEqual(complete('cd ex', 'garbage'), complete('cd ex'));
});

test('command names complete with a trailing space for path commands', () => {
  assert.deepEqual(complete('p'), { value: 'pwd', candidates: ['pwd'] });
  assert.deepEqual(complete('cd'), { value: 'cd', candidates: ['cd'] });
  assert.equal(tabAction('cd', null).kind, 'pass');
  assert.equal(tabAction('cat', null).kind, 'pass');
});

test('tabAction uses the cwd and still lists once', () => {
  assert.deepEqual(tabAction('cat ma', null, ['projects']), { kind: 'complete', value: 'cat maitre.txt', candidates: ['cat maitre.txt'] });
  assert.equal(tabAction('cat ma', null).kind, 'pass');
  assert.equal(tabAction('cd ', null).kind, 'list');
  assert.equal(tabAction('cd ', 'cd ').kind, 'pass');
  assert.equal(tabAction('cd experience/', null).kind, 'pass');
});
