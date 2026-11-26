export const COMPLETIONS = [
  'help', 'whoami', 'ls', 'cat about.txt', 'cat secrets.env', 'contact', 'cv',
  'lang pt', 'lang en', 'replay', 'clear', 'hint',
];

function commonPrefix(list) {
  let prefix = list[0];
  for (const s of list.slice(1)) {
    let i = 0;
    while (i < prefix.length && prefix[i] === s[i]) i++;
    prefix = prefix.slice(0, i);
  }
  return prefix;
}

export function complete(input) {
  if (typeof input !== 'string') return { value: '', candidates: [] };
  const norm = input.trimStart().replace(/\s+/g, ' ').toLowerCase();
  if (!norm.trim()) return { value: input, candidates: [] };
  const candidates = COMPLETIONS.filter((c) => c.startsWith(norm));
  if (candidates.length === 0) return { value: input, candidates: [] };
  return { value: commonPrefix(candidates), candidates };
}

export function tabAction(input, lastListedFor) {
  const { value, candidates } = complete(input);
  if (candidates.length === 0) return { kind: 'pass' };
  if (value !== input) return { kind: 'complete', value, candidates };
  if (candidates.length > 1 && lastListedFor !== input) return { kind: 'list', candidates };
  return { kind: 'pass' };
}
