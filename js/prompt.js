import { runCommand } from './commands.js';
import { complete } from './complete.js';
import { t } from './copy.js';
import { safe } from './safe.js';

const PS = 'daniel@portfolio:~$';
const ECHO_MAX = 60;
const LOG_MAX = 50;

export function initPrompt({ tracker, getLang, effects = {} }) {
  const form = document.getElementById('prompt');
  const input = document.getElementById('prompt-input');
  const log = document.getElementById('prompt-log');
  const toggle = document.getElementById('prompt-toggle');
  const counter = document.getElementById('egg-count');

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
    append(`${PS} ${echo.length > ECHO_MAX ? `${echo.slice(0, ECHO_MAX)}…` : echo}`, 'prompt-echo');

    const found = tracker && typeof tracker.found === 'function' ? tracker.found() : [];
    const res = runCommand(raw, { lang: getLang(), found });

    if (res.effect === 'lang-pt' || res.effect === 'lang-en') {
      effect(res.effect);
      print([t(getLang(), 'cmd.lang')]);
    } else if (res.effect === 'clear') {
      clear();
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
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;
      safe('prompt.complete', () => {
        const { value, candidates } = complete(input.value);
        if (candidates.length === 0) return;
        e.preventDefault();
        if (value !== input.value) {
          input.value = value;
          input.setSelectionRange(value.length, value.length);
        } else if (candidates.length > 1) {
          print(candidates.join('  '));
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
