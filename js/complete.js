import { resolve, list } from './fs.js';

export const COMPLETIONS = [
  'help', 'whoami', 'ls', 'cd', 'pwd', 'cat', 'contact', 'cv',
  'lang pt', 'lang en', 'replay', 'clear', 'hint',
];

const PATH_COMMANDS = new Set(['cd', 'ls', 'cat']);

function commonPrefix(list) {
  let prefix = list[0];
  for (const s of list.slice(1)) {
    let i = 0;
    while (i < prefix.length && prefix[i] === s[i]) i++;
    prefix = prefix.slice(0, i);
  }
  return prefix;
}

function pathCandidates(verb, arg, cwd) {
  const cut = arg.lastIndexOf('/') + 1;
  const base = arg.slice(0, cut);
  const partial = arg.slice(cut);
  const dir = base ? resolve(cwd, base) : { path: Array.isArray(cwd) ? cwd : [] };
  const entries = dir.path && list(dir.path);
  if (!entries) return [];
  const matches = entries.filter((e) => e.startsWith(partial));
  const dirs = matches.filter((e) => e.endsWith('/'));
  const files = matches.filter((e) => !e.endsWith('/'));
  const picked = verb === 'cd' ? dirs : verb === 'cat' && files.length ? files : matches;
  return picked.map((e) => `${verb} ${base}${e}`);
}

export function complete(input, cwd = []) {
  if (typeof input !== 'string') return { value: '', candidates: [] };
  const norm = input.trimStart().replace(/\s+/g, ' ').toLowerCase();
  if (!norm.trim()) return { value: input, candidates: [] };

  const space = norm.indexOf(' ');
  const verb = space === -1 ? norm : norm.slice(0, space);
  if (space !== -1 && PATH_COMMANDS.has(verb)) {
    const arg = norm.slice(space + 1);
    if (arg.includes(' ')) return { value: input, candidates: [] };
    const candidates = pathCandidates(verb, arg, cwd);
    if (candidates.length === 0) return { value: input, candidates: [] };
    return { value: commonPrefix(candidates), candidates };
  }

  const candidates = COMPLETIONS.filter((c) => c.startsWith(norm));
  if (candidates.length === 0) return { value: input, candidates: [] };
  if (candidates.length === 1 && candidates[0] !== norm && PATH_COMMANDS.has(candidates[0])) {
    const next = complete(`${candidates[0]} `, cwd);
    return next.candidates.length ? next : { value: `${candidates[0]} `, candidates };
  }
  return { value: commonPrefix(candidates), candidates };
}

export function tabAction(input, lastListedFor, cwd = []) {
  const { value, candidates } = complete(input, cwd);
  if (candidates.length === 0) return { kind: 'pass' };
  if (value !== input) return { kind: 'complete', value, candidates };
  if (candidates.length > 1 && lastListedFor !== input) return { kind: 'list', candidates };
  return { kind: 'pass' };
}
