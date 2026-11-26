import { t } from './copy.js';
import { nextHintKey } from './eggs.js';

const ECHO_MAX = 60;
const APPROVAL_PREFIXES = ['rm -rf', 'git push --force', 'git push -f', 'drop table'];

const PLAIN = {
  help: { key: 'cmd.help' },
  whoami: { key: 'cmd.whoami' },
  ls: { key: 'cmd.ls' },
  'cat about.txt': { key: 'cmd.about' },
  contact: { key: 'cmd.contact', effect: 'contact' },
  cv: { key: 'cmd.cv', effect: 'print' },
  'lang pt': { key: 'cmd.lang', effect: 'lang-pt' },
  'lang en': { key: 'cmd.lang', effect: 'lang-en' },
  replay: { key: 'cmd.replay', effect: 'replay' },
  '/lounge': { key: 'egg.lounge', effect: 'lounge-on', egg: 'lounge' },
  'sudo hire daniel': { key: 'egg.sudo', effect: 'contact', egg: 'sudo' },
  'cat secrets.env': { key: 'egg.secrets', egg: 'secrets' },
};

const toLines = (v) => [v].flat().flatMap((s) => String(s).split('\n'));

function result(lines, effect, egg) {
  const out = { lines };
  if (effect) out.effect = effect;
  if (egg) out.egg = egg;
  return out;
}

export function runCommand(raw, ctx) {
  if (typeof raw !== 'string') return { lines: [] };
  const lang = ctx && ctx.lang === 'pt' ? 'pt' : 'en';
  const found = ctx && Array.isArray(ctx.found) ? ctx.found : [];
  const trimmed = raw.trim();
  if (!trimmed) return { lines: [] };
  const norm = trimmed.replace(/\s+/g, ' ').toLowerCase();

  if (norm === 'clear') return result([], 'clear');
  if (norm === '/office' || norm === 'exit') return result([], 'lounge-off');
  if (norm === 'hint') return result(toLines(t(lang, nextHintKey(found))));
  if (APPROVAL_PREFIXES.some((p) => norm.startsWith(p))) return result(toLines(t(lang, 'egg.approval')), undefined, 'approval');

  const cmd = Object.hasOwn(PLAIN, norm) ? PLAIN[norm] : null;
  if (cmd) return result(toLines(t(lang, cmd.key)), cmd.effect, cmd.egg);

  const input = trimmed.length > ECHO_MAX ? `${trimmed.slice(0, ECHO_MAX)}…` : trimmed;
  return result(toLines(t(lang, 'cmd.notfound', { input })));
}
