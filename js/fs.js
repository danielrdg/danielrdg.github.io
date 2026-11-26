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

const BLOCKS = new Set(['H3', 'H4', 'P', 'LI', 'DT', 'DD']);
const META = ['tl-date', 'feature-tag'];

const squash = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

function blocks(node, out = []) {
  for (const kid of Array.from(node.children || [])) {
    if (BLOCKS.has(String(kid.tagName).toUpperCase())) out.push(kid);
    else blocks(kid, out);
  }
  return out;
}

export function fileLines(el) {
  if (!el) return [];
  const head = [];
  const meta = [];
  const body = [];
  for (const b of blocks(el)) {
    const text = squash(b.textContent);
    if (!text) continue;
    const tag = String(b.tagName).toUpperCase();
    const cls = String(b.className || '').split(/\s+/);
    if (tag === 'H3' || tag === 'H4' || tag === 'DT') head.push(text);
    else if (META.some((m) => cls.includes(m))) meta.push(text);
    else body.push(tag === 'LI' ? `• ${text}` : text);
  }
  if (!head.length && !meta.length && !body.length) {
    const text = squash(el.textContent);
    return text && !blocks(el).length ? [text] : [];
  }
  const top = [...head, ...meta];
  return top.length && body.length ? [...top, '', ...body] : [...top, ...body];
}
