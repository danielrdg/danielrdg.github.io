import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COPY, t } from '../js/copy.js';

const REQUIRED = [
  'run.planner', 'run.builder', 'run.reviewer', 'run.header', 'run.skip', 'run.done',
  'cmd.help', 'cmd.whoami', 'cmd.ls', 'cmd.about', 'cmd.contact', 'cmd.cv', 'cmd.lang', 'cmd.replay', 'cmd.notfound',
  'egg.approval', 'egg.sudo', 'egg.secrets', 'egg.nitpick', 'egg.konami', 'egg.janitor', 'egg.night', 'egg.bell', 'egg.lounge', 'egg.found',
  'hint.lounge', 'hint.approval', 'hint.sudo', 'hint.secrets', 'hint.nitpick', 'hint.konami', 'hint.janitor', 'hint.night', 'hint.bell', 'hint.all',
  'console.signature',
];

test('en and pt have the same keys', () => {
  assert.deepEqual(Object.keys(COPY.en).sort(), Object.keys(COPY.pt).sort());
});

test('every required key exists', () => {
  for (const lang of ['en', 'pt']) {
    for (const k of REQUIRED) {
      assert.ok(k in COPY[lang], `${lang} missing ${k}`);
      const v = COPY[lang][k];
      assert.ok(typeof v === 'string' ? v.length > 0 : Array.isArray(v) && v.length > 0, `${lang} empty ${k}`);
    }
  }
});

test('run logs are arrays of 2-3 lines; nitpick has at least 5', () => {
  for (const lang of ['en', 'pt']) {
    for (const k of ['run.planner', 'run.builder', 'run.reviewer']) {
      assert.ok(Array.isArray(COPY[lang][k]));
      assert.ok(COPY[lang][k].length >= 2 && COPY[lang][k].length <= 3, `${lang} ${k}`);
    }
    assert.ok(COPY[lang]['egg.nitpick'].length >= 5);
  }
});

test('t interpolates placeholders', () => {
  const s = t('pt', 'egg.found', { n: '3', total: '9' });
  assert.ok(s.includes('3') && s.includes('9'));
  assert.ok(t('en', 'cmd.notfound', { input: 'zzz' }).includes('zzz'));
});

test('t falls back to the key', () => {
  assert.equal(t('pt', 'nope'), 'nope');
  assert.equal(t('xx', 'nope'), 'nope');
});

test('help lists plain commands only, no egg commands, no phone/pdf', () => {
  for (const lang of ['en', 'pt']) {
    const help = [].concat(COPY[lang]['cmd.help']).join('\n');
    assert.ok(!/sudo|rm -rf|konami|secrets|\/lounge/i.test(help));
    const all = JSON.stringify(COPY[lang]);
    assert.ok(!/\.pdf/i.test(all));
    assert.ok(!/\+?\d{2}\s?\d{4,5}-?\d{4}/.test(all));
  }
});

test('contact has the three channels', () => {
  const c = [].concat(COPY.en['cmd.contact']).join('\n');
  assert.ok(c.includes('dani.araujo2002@gmail.com'));
  assert.ok(c.includes('linkedin.com/in/danielrdgg'));
  assert.ok(c.includes('github.com/danielrdg'));
});

test('console signature is at most 10 lines and nudges ring()', () => {
  for (const lang of ['en', 'pt']) {
    const sig = COPY[lang]['console.signature'];
    assert.ok(sig.split('\n').length <= 10);
    assert.ok(sig.includes('ring()'));
  }
});
