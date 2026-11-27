import { t } from './copy.js';
import { nextHintKey } from './eggs.js';
import { resolve, list, nodeAt, pathLabel } from './fs.js';

const ECHO_MAX = 60;
const APPROVAL_PREFIXES = ['rm -rf', 'git push --force', 'git push -f', 'drop table'];

const PLAIN = {
  help: { key: 'cmd.help' },
  whoami: { key: 'cmd.whoami' },
  contact: { key: 'cmd.contact', effect: 'contact' },
  cv: { key: 'cmd.cv', effect: 'print' },
  'lang pt': { key: 'cmd.lang', effect: 'lang-pt' },
  'lang en': { key: 'cmd.lang', effect: 'lang-en' },
  replay: { key: 'cmd.replay', effect: 'replay' },
  '/lounge': { key: 'egg.lounge', effect: 'lounge-on', egg: 'lounge' },
  'sudo hire daniel': { key: 'egg.sudo', effect: 'contact', egg: 'sudo' },
};

const FS_COMMANDS = new Set(['cd', 'ls', 'cat', 'pwd']);

const clip = (s) => (s.length > ECHO_MAX ? `${s.slice(0, ECHO_MAX)}…` : s);

const toLines = (v) => [v].flat().flatMap((s) => String(s).split('\n'));

function result(lines, effect, egg) {
  const out = { lines };
  if (effect) out.effect = effect;
  if (egg) out.egg = egg;
  return out;
}

function fsError(lang, error, cmd, arg) {
  if (error === 'outside') return result([t(lang, 'fs.outside')]);
  return result([t(lang, `fs.${error}`, { cmd, path: clip(arg) })]);
}

function runFs(verb, args, cwd, lang) {
  if (verb === 'pwd') return result([`/home/guest${pathLabel(cwd).slice(1)}`]);
  if (args.length > 1) return result([t(lang, 'fs.toomany', { cmd: verb })]);
  const [arg] = args;
  if (verb === 'cat' && arg === undefined) return result([t(lang, 'fs.missing', { cmd: verb })]);

  const target = arg === undefined ? (verb === 'cd' ? { path: [] } : { path: cwd }) : resolve(cwd, arg);
  if (target.error) return fsError(lang, target.error, verb, arg);
  const node = nodeAt(target.path);

  if (verb === 'cd') {
    if (node.kind !== 'dir') return fsError(lang, 'notdir', verb, arg);
    return { lines: [], effect: 'cd', cwd: target.path };
  }
  if (verb === 'ls') return result(node.kind === 'dir' ? [list(target.path).join('  ')] : [target.path.at(-1)]);

  if (node.kind === 'dir') return fsError(lang, 'isdir', verb, arg);
  if (node.egg) return result(toLines(t(lang, `egg.${node.egg}`)), undefined, node.egg);
  if (node.copy) return result(toLines(t(lang, node.copy)));
  return { lines: [], effect: 'cat', file: node };
}

export function runCommand(raw, ctx) {
  if (typeof raw !== 'string') return { lines: [] };
  const lang = ctx && ctx.lang === 'pt' ? 'pt' : 'en';
  const found = ctx && Array.isArray(ctx.found) ? ctx.found : [];
  const cwd = ctx && Array.isArray(ctx.cwd) && nodeAt(ctx.cwd)?.kind === 'dir' ? ctx.cwd : [];
  const trimmed = raw.trim();
  if (!trimmed) return { lines: [] };
  const norm = trimmed.replace(/\s+/g, ' ').toLowerCase();

  if (norm === 'clear') return result([], 'clear');
  if (norm === '/office' || norm === 'exit') return result([], 'lounge-off');
  if (norm === 'hint') return result(toLines(t(lang, nextHintKey(found))));
  if (APPROVAL_PREFIXES.some((p) => norm.startsWith(p))) return result(toLines(t(lang, 'egg.approval')), undefined, 'approval');

  const [verb, ...args] = norm.split(' ');
  if (FS_COMMANDS.has(verb)) return runFs(verb, args, cwd, lang);

  const cmd = Object.hasOwn(PLAIN, norm) ? PLAIN[norm] : null;
  if (cmd) return result(toLines(t(lang, cmd.key)), cmd.effect, cmd.egg);

  return result(toLines(t(lang, 'cmd.notfound', { input: clip(trimmed) })));
}
