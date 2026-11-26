import { runCommand } from './commands.js';
import { tabAction } from './complete.js';
import { t } from './copy.js';
import { safe } from './safe.js';
import { pathLabel, fileLines } from './fs.js';

const ECHO_MAX = 60;
const LOG_MAX = 50;

export function initPrompt({ tracker, getLang, effects = {} }) {
  const form = document.getElementById('prompt');
  const input = document.getElementById('prompt-input');
  const log = document.getElementById('prompt-log');
  const toggle = document.getElementById('prompt-toggle');
  const counter = document.getElementById('egg-count');
  const psLabel = form ? form.querySelector('.prompt-ps') : null;
  let cwd = [];

  const ps = () => `daniel@portfolio:${pathLabel(cwd)}$`;

  function setCwd(next) {
    cwd = next;
    if (psLabel) psLabel.textContent = ps();
  }

  function append(text, cls) {
    if (!log) return;
    const line = document.createElement('div');
    line.className = cls || 'prompt-out';
    line.textContent = String(text);
    log.append(line);
    while (log.childElementCount > LOG_MAX) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }

  function print(lines) {
    for (const text of [].concat(lines)) append(text);
  }

  function clear() {
    if (log) log.replaceChildren();
  }

  function effect(name) {
    const fn = effects[name];
    if (typeof fn === 'function') safe(`prompt.effect.${name}`, fn);
  }

  function submit(raw) {
    const echo = raw.trim();
    append(`${ps()} ${echo.length > ECHO_MAX ? `${echo.slice(0, ECHO_MAX)}…` : echo}`, 'prompt-echo');

    const found = tracker && typeof tracker.found === 'function' ? tracker.found() : [];
    const res = runCommand(raw, { lang: getLang(), found, cwd });

    if (res.effect === 'lang-pt' || res.effect === 'lang-en') {
      effect(res.effect);
      print([t(getLang(), 'cmd.lang')]);
    } else if (res.effect === 'clear') {
      clear();
    } else if (res.effect === 'cd') {
      setCwd(res.cwd);
    } else if (res.effect === 'cat') {
      const el = res.file && res.file.selector ? document.querySelector(res.file.selector) : null;
      const lines = fileLines(el).map((l) => l || ' ');
      print(lines.length ? lines : [t(getLang(), 'fs.notfound', { cmd: 'cat', path: raw.trim().split(/\s+/).pop().slice(0, 60) })]);
    } else {
      print(res.lines);
      if (res.effect) effect(res.effect);
    }

    if (res.egg) {
      const site = window.__site;
      if (site && typeof site.announceEgg === 'function') safe('prompt.egg', () => site.announceEgg(res.egg));
    }
  }

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value;
      input.value = '';
      safe('prompt.submit', () => submit(raw));
    });
  }

  if (input) {
    let lastListedFor = null;
    input.addEventListener('input', () => { lastListedFor = null; });
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || e.isComposing) return;
      safe('prompt.complete', () => {
        const action = tabAction(input.value, lastListedFor, cwd);
        if (action.kind === 'pass') return;
        e.preventDefault();
        if (action.kind === 'complete') {
          input.value = action.value;
          input.setSelectionRange(action.value.length, action.value.length);
        } else {
          lastListedFor = input.value;
          print(action.candidates.join('  '));
        }
      });
    });
  }

  if (toggle && form) {
    const sheetOpen = () => form.classList.contains('prompt--open') && toggle.getClientRects().length > 0;
    const setOpen = (open) => {
      form.classList.toggle('prompt--open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open && input) input.focus();
      else toggle.focus();
    };
    toggle.addEventListener('click', () => safe('prompt.toggle', () => setOpen(!form.classList.contains('prompt--open'))));
    // Capture phase so one Esc closes the sheet without also leaving the lounge.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !sheetOpen()) return;
      e.stopPropagation();
      safe('prompt.esc', () => setOpen(false));
    }, true);
  }

  function renderCount() {
    if (counter && tracker) counter.textContent = `${tracker.count()}/${tracker.total || 9}`;
  }
  renderCount();
  if (tracker && typeof tracker.onChange === 'function') tracker.onChange(() => safe('prompt.count', renderCount));

  return { print, clear };
}
