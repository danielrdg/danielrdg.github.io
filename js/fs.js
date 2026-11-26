const file = (source) => Object.freeze({ kind: 'file', ...source });
const dir = (entries) => Object.freeze({ kind: 'dir', entries: Object.freeze(entries) });

export const TREE = dir({
  'about.txt': file({ copy: 'cmd.about' }),
  'secrets.env': file({ egg: 'secrets' }),
  experience: dir({
    'aegro-engineer.txt': file({ selector: '#fs-aegro-engineer' }),
    'aegro-intern.txt': file({ selector: '#fs-aegro-intern' }),
  }),
  projects: dir({
    'maitre.txt': file({ selector: '#fs-maitre' }),
    'elysium.txt': file({ selector: '#fs-elysium' }),
    'issue-to-pr.txt': file({ selector: '#fs-issue-to-pr' }),
    'cockpit.txt': file({ selector: '#fs-cockpit' }),
    'long-shift.txt': file({ selector: '#fs-long-shift' }),
    'spec-driven.txt': file({ selector: '#fs-spec-driven' }),
    'error-janitor.txt': file({ selector: '#fs-error-janitor' }),
    'support-copilots.txt': file({ selector: '#fs-support-copilots' }),
    'pr-risk-triage.txt': file({ selector: '#fs-pr-risk-triage' }),
  }),
  academic: dir({
    'iacc.txt': file({ selector: '#fs-iacc' }),
    'histoteria.txt': file({ selector: '#fs-histoteria' }),
  }),
});

const child = (node, name) => (node && node.kind === 'dir' && Object.hasOwn(node.entries, name) ? node.entries[name] : null);

export function nodeAt(path) {
  if (!Array.isArray(path)) return null;
  let node = TREE;
  for (const name of path) {
    node = child(node, name);
    if (!node) return null;
  }
  return node;
}

export function resolve(cwd, arg) {
  const raw = typeof arg === 'string' ? arg : '';
  if (raw.startsWith('/')) return { error: 'outside' };
  let rest = raw;
  let path;
  if (raw === '~' || raw.startsWith('~/')) {
    path = [];
    rest = raw.slice(1);
  } else {
    const start = nodeAt(cwd);
    path = start && start.kind === 'dir' ? [...cwd] : [];
  }
  let node = nodeAt(path);
  for (const seg of rest.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (node.kind !== 'dir') return { error: 'notdir' };
    if (seg === '..') {
      if (path.length === 0) return { error: 'outside' };
      path.pop();
      node = nodeAt(path);
      continue;
    }
    const next = child(node, seg);
    if (!next) return { error: 'notfound' };
    path.push(seg);
    node = next;
  }
  if (rest.endsWith('/') && node.kind !== 'dir') return { error: 'notdir' };
  return { path };
}

export function list(path) {
  const node = nodeAt(path);
  if (!node || node.kind !== 'dir') return null;
  const entries = Object.entries(node.entries);
  return [
    ...entries.filter(([, n]) => n.kind === 'dir').map(([name]) => `${name}/`),
    ...entries.filter(([, n]) => n.kind !== 'dir').map(([name]) => name),
  ];
}

export function pathLabel(path) {
  return Array.isArray(path) && path.length ? `~/${path.join('/')}` : '~';
}

export function wrap(text, width = 72) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
