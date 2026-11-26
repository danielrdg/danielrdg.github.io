import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCommand } from '../js/commands.js';
import { t } from '../js/copy.js';

const ctx = (lang = 'en', found = []) => ({ lang, found });
const flat = (v) => [v].flat().flatMap((s) => s.split('\n'));
const run = (raw, c = ctx()) => runCommand(raw, c);

test('plain commands return their copy with no effect', () => {
  for (const [input, key] of [['help', 'cmd.help'], ['whoami', 'cmd.whoami'], ['ls', 'cmd.ls'], ['cat about.txt', 'cmd.about']]) {
    assert.deepEqual(run(input), { lines: flat(t('en', key)) }, input);
  }
});

test('effects', () => {
  assert.deepEqual(run('contact'), { lines: flat(t('en', 'cmd.contact')), effect: 'contact' });
  assert.deepEqual(run('cv'), { lines: flat(t('en', 'cmd.cv')), effect: 'print' });
  assert.deepEqual(run('lang pt'), { lines: flat(t('en', 'cmd.lang')), effect: 'lang-pt' });
  assert.deepEqual(run('lang en'), { lines: flat(t('en', 'cmd.lang')), effect: 'lang-en' });
  assert.deepEqual(run('replay'), { lines: flat(t('en', 'cmd.replay')), effect: 'replay' });
  assert.deepEqual(run('clear'), { lines: [], effect: 'clear' });
});

test('hint follows found eggs', () => {
  assert.deepEqual(run('hint'), { lines: [t('en', 'hint.lounge')] });
  assert.deepEqual(run('hint', ctx('en', ['lounge'])), { lines: [t('en', 'hint.approval')] });
});

test('lounge on/off', () => {
  assert.deepEqual(run('/lounge'), { lines: flat(t('en', 'egg.lounge')), effect: 'lounge-on', egg: 'lounge' });
  assert.deepEqual(run('/office'), { lines: [], effect: 'lounge-off' });
  assert.deepEqual(run('exit'), { lines: [], effect: 'lounge-off' });
});

test('approval egg prefixes', () => {
  for (const i of ['rm -rf /', 'rm -rf ~', 'RM  -RF  /', 'git push --force', 'git push -f origin main', 'drop table users']) {
    assert.deepEqual(run(i), { lines: flat(t('en', 'egg.approval')), egg: 'approval' }, i);
  }
});

test('sudo and secrets eggs', () => {
  assert.deepEqual(run('sudo hire daniel'), { lines: flat(t('en', 'egg.sudo')), effect: 'contact', egg: 'sudo' });
  const s = run('cat secrets.env');
  assert.equal(s.egg, 'secrets');
  assert.equal(s.effect, undefined);
  assert.deepEqual(s.lines, flat(t('en', 'egg.secrets')));
  assert.ok(s.lines.length > 1);
});

test('normalization: trim, case, inner whitespace', () => {
  assert.deepEqual(run('  HELP  '), run('help'));
  assert.deepEqual(run('Cat   About.TXT'), run('cat about.txt'));
});

test('empty input', () => {
  assert.deepEqual(run('   '), { lines: [] });
  assert.deepEqual(run(''), { lines: [] });
  assert.deepEqual(run(42), { lines: [] });
  assert.deepEqual(run(undefined), { lines: [] });
});

test('not found echoes raw trimmed text', () => {
  const x = '<img src=x onerror=alert(1)>';
  const r = run(`  ${x}  `);
  assert.equal(r.lines.length, 1);
  assert.ok(r.lines[0].includes(x));
  assert.equal(r.egg, undefined);
  assert.equal(r.effect, undefined);
  assert.ok(run('FooBar').lines[0].includes('FooBar'));
});

test('not found truncates to 60 chars plus ellipsis', () => {
  const r = run('a'.repeat(5000));
  assert.equal(r.lines[0], t('en', 'cmd.notfound', { input: 'a'.repeat(60) + '…' }));
  const exact = run('b'.repeat(60));
  assert.ok(!exact.lines[0].includes('…'));
});

test('lang with other argument is not found', () => {
  assert.ok(run('lang xx').lines[0].includes('lang xx'));
  assert.equal(run('lang xx').effect, undefined);
});

test('PT copy and lines are flat plain strings', () => {
  assert.deepEqual(run('help', ctx('pt')).lines, flat(t('pt', 'cmd.help')));
  assert.notDeepEqual(run('help', ctx('pt')).lines, run('help').lines);
  for (const i of ['help', 'contact', 'cat secrets.env', '/lounge', 'zzz']) {
    const { lines } = run(i);
    assert.ok(Array.isArray(lines) && lines.every((l) => typeof l === 'string' && !l.includes('\n')), i);
  }
});

test('never throws, tolerates missing ctx', () => {
  assert.doesNotThrow(() => runCommand('help'));
  assert.doesNotThrow(() => runCommand('hint', {}));
  assert.deepEqual(runCommand('help').lines, run('help').lines);
});

const at = (cwd, lang = 'en') => ({ lang, found: [], cwd });

test('cd returns the new cwd as an effect', () => {
  assert.deepEqual(run('cd projects'), { lines: [], effect: 'cd', cwd: ['projects'] });
  assert.deepEqual(run('cd projects/'), { lines: [], effect: 'cd', cwd: ['projects'] });
  assert.deepEqual(run('cd ..', at(['projects'])), { lines: [], effect: 'cd', cwd: [] });
  assert.deepEqual(run('cd', at(['projects'])), { lines: [], effect: 'cd', cwd: [] });
  assert.deepEqual(run('cd ~', at(['academic'])), { lines: [], effect: 'cd', cwd: [] });
  assert.deepEqual(run('CD  Academic', at([])), { lines: [], effect: 'cd', cwd: ['academic'] });
});

test('cd errors print a line and never move', () => {
  const nf = run('cd nope');
  assert.deepEqual(nf, { lines: [t('en', 'fs.notfound', { cmd: 'cd', path: 'nope' })] });
  assert.deepEqual(run('cd about.txt'), { lines: [t('en', 'fs.notdir', { cmd: 'cd', path: 'about.txt' })] });
  assert.deepEqual(run('cd a b'), { lines: [t('en', 'fs.toomany', { cmd: 'cd' })] });
});

test('cd outside the home tells the joke, which is not an egg', () => {
  for (const arg of ['/', '/etc', '..', '../..']) {
    const r = run(`cd ${arg}`);
    assert.deepEqual(r, { lines: [t('en', 'fs.outside')] }, arg);
    assert.equal(r.egg, undefined);
  }
  assert.deepEqual(run('cd /', ctx('pt')).lines, [t('pt', 'fs.outside')]);
  assert.notEqual(t('pt', 'fs.outside'), t('en', 'fs.outside'));
});

test('pwd', () => {
  assert.deepEqual(run('pwd'), { lines: ['/home/guest'] });
  assert.deepEqual(run('pwd', at(['projects'])), { lines: ['/home/guest/projects'] });
});

test('ls lists the cwd or the given dir', () => {
  assert.deepEqual(run('ls', at(['academic'])), { lines: ['iacc.txt  histoteria.txt'] });
  assert.deepEqual(run('ls academic'), { lines: ['iacc.txt  histoteria.txt'] });
  assert.deepEqual(run('ls ..', at(['academic'])), run('ls'));
  assert.deepEqual(run('ls about.txt'), { lines: ['about.txt'] });
  assert.deepEqual(run('ls nope'), { lines: [t('en', 'fs.notfound', { cmd: 'ls', path: 'nope' })] });
  assert.deepEqual(run('ls /'), { lines: [t('en', 'fs.outside')] });
});

test('cat on a selector file returns the cat effect with the node', () => {
  const r = run('cat maitre.txt', at(['projects']));
  assert.deepEqual(r.lines, []);
  assert.equal(r.effect, 'cat');
  assert.equal(r.file.selector, '#fs-maitre');
  assert.equal(r.egg, undefined);
  assert.deepEqual(run('cat projects/maitre.txt'), r);
  assert.deepEqual(run('cat ~/academic/iacc.txt', at(['projects'])).file.selector, '#fs-iacc');
});

test('cat copy files keep their old output, from anywhere by path', () => {
  assert.deepEqual(run('cat ~/about.txt', at(['projects'])), run('cat about.txt'));
  assert.deepEqual(run('cat about.txt', ctx('pt')), { lines: flat(t('pt', 'cmd.about')) });
  const s = run('cat ../secrets.env', at(['projects']));
  assert.deepEqual(s, { lines: flat(t('en', 'egg.secrets')), egg: 'secrets' });
});

test('cat errors', () => {
  assert.deepEqual(run('cat projects'), { lines: [t('en', 'fs.isdir', { cmd: 'cat', path: 'projects' })] });
  assert.deepEqual(run('cat about.txt', at(['projects'])), { lines: [t('en', 'fs.notfound', { cmd: 'cat', path: 'about.txt' })] });
  assert.deepEqual(run('cat'), { lines: [t('en', 'fs.missing', { cmd: 'cat' })] });
  assert.deepEqual(run('cat /etc/passwd'), { lines: [t('en', 'fs.outside')] });
  assert.equal(run('cat /etc/passwd').egg, undefined);
});

test('fs errors truncate a long path', () => {
  const r = run(`cd ${'z'.repeat(500)}`);
  assert.equal(r.lines[0], t('en', 'fs.notfound', { cmd: 'cd', path: `${'z'.repeat(60)}…` }));
});
