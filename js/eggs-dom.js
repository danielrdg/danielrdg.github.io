import { t } from './copy.js';
import { isNight, passiveEggPrints } from './eggs.js';
import { createKonami } from './konami.js';
import { onLangChange } from './i18n-dom.js';
import { safe } from './safe.js';

const NITPICK_CLICKS = 5;
const NITPICK_WINDOW_MS = 3000;
const SWARM_SIZE = 24;
const SWARM_MS = 6000;
const IDLE_MS = 60000;
const SWEEP_MAX_MS = 6000;
const NIGHT_CHECK_MS = 10 * 60 * 1000;
const SWARM_COLORS = ['blue', 'gold', 'pink', 'mint'];
const IDLE_EVENTS = ['keydown', 'pointerdown', 'scroll', 'wheel', 'touchstart'];

const site = () => window.__site || {};
const say = (lines) => safe('eggs.print', () => site().prompt.print(lines));
const announce = (id) => safe(`eggs.announce.${id}`, () => site().announceEgg(id));

function isTypingTarget(el) {
  if (!el || el.nodeType !== 1) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

function layer(status, kind) {
  const el = document.createElement('div');
  el.className = `egg-layer egg-layer--${kind}`;
  el.setAttribute('aria-hidden', 'true');
  status.append(el);
  return el;
}

function initNitpick({ getLang }) {
  const chip = document.querySelector('#status .agent-chip[data-agent="reviewer"]');
  if (!chip) return;
  let clicks = [];
  let armed = false;
  let next = 0;

  const nit = () => {
    const lines = t(getLang(), 'egg.nitpick');
    say([lines[next % lines.length]]);
    next += 1;
  };

  chip.addEventListener('click', () => safe('eggs.nitpick', () => {
    if (armed) return nit();
    const now = Date.now();
    clicks = clicks.filter((at) => now - at < NITPICK_WINDOW_MS);
    clicks.push(now);
    if (clicks.length < NITPICK_CLICKS) return;
    armed = true;
    nit();
    announce('nitpick');
  }));
}

function initKonami({ reducedMotion, getLang }) {
  const status = document.getElementById('status');
  let swarm = null;

  function spawn() {
    if (!status || swarm) return;
    swarm = layer(status, 'swarm');
    if (reducedMotion) swarm.classList.add('egg-layer--still');
    for (let i = 0; i < SWARM_SIZE; i += 1) {
      const agent = document.createElement('span');
      agent.className = `egg-agent egg-agent--${SWARM_COLORS[i % SWARM_COLORS.length]}`;
      agent.style.animationDelay = `${-((i * 137) % 900)}ms`;
      swarm.append(agent);
    }
    setTimeout(() => safe('eggs.konami.end', () => {
      if (swarm) swarm.remove();
      swarm = null;
    }), SWARM_MS);
  }

  const feed = createKonami(() => safe('eggs.konami.match', () => {
    spawn();
    say([t(getLang(), 'egg.konami')]);
    announce('konami');
  }));

  document.addEventListener('keydown', (e) => safe('eggs.konami.key', () => {
    if (isTypingTarget(e.target)) return;
    feed(e.key);
  }));
}

function initJanitor({ reducedMotion, getLang }) {
  const status = document.getElementById('status');
  if (!status) return;
  let timer = 0;
  let done = false;

  function stop() {
    clearTimeout(timer);
    for (const type of IDLE_EVENTS) window.removeEventListener(type, reset, true);
    document.removeEventListener('visibilitychange', reset);
  }

  function sweep() {
    const lane = layer(status, 'sweep');
    const broom = document.createElement('span');
    broom.className = 'egg-broom';
    lane.append(broom);
    const end = () => safe('eggs.janitor.end', () => lane.remove());
    broom.addEventListener('animationend', end);
    setTimeout(end, SWEEP_MAX_MS);
  }

  function fire() {
    if (done) return;
    if (document.hidden) return reset();
    done = true;
    stop();
    const tracker = site().tracker;
    const firstFind = !!tracker && !tracker.has('janitor');
    if (!reducedMotion) safe('eggs.janitor.sweep', sweep);
    if (passiveEggPrints('janitor', { firstFind, reducedMotion })) say([t(getLang(), 'egg.janitor')]);
    announce('janitor');
  }

  function reset() {
    if (done) return;
    clearTimeout(timer);
    timer = setTimeout(() => safe('eggs.janitor.fire', fire), IDLE_MS);
  }

  const options = { capture: true, passive: true };
  for (const type of IDLE_EVENTS) window.addEventListener(type, reset, options);
  document.addEventListener('visibilitychange', reset);
  reset();
}

function initNight({ getLang }) {
  const status = document.getElementById('status');
  const reviewer = status && status.querySelector('.agent-chip[data-agent="reviewer"]');
  if (!status) return;
  let chip = null;
  let announced = false;

  function label() {
    if (!chip) return;
    const note = t(getLang(), 'egg.night');
    chip.title = note;
    chip.setAttribute('aria-label', `long-shift: ${note}`);
  }

  function show() {
    chip = document.createElement('button');
    chip.type = 'button';
    chip.id = 'long-shift';
    chip.className = 'agent-chip agent-chip--night';
    chip.append('long-shift ');
    const moon = document.createElement('span');
    moon.setAttribute('aria-hidden', 'true');
    moon.textContent = '☾';
    chip.append(moon);
    label();
    chip.addEventListener('click', () => safe('eggs.night.click', () => say([t(getLang(), 'egg.night')])));
    if (reviewer) reviewer.after(chip);
    else (status.querySelector('.status-run') || status).append(chip);
  }

  function check() {
    const night = isNight(new Date());
    if (night && !chip) {
      show();
      if (!announced) {
        announced = true;
        announce('night');
      }
    } else if (!night && chip) {
      chip.remove();
      chip = null;
    }
  }

  onLangChange(() => safe('eggs.night.lang', label));
  check();
  setInterval(() => safe('eggs.night.check', check), NIGHT_CHECK_MS);
}

function initConsole({ getLang }) {
  safe('eggs.console.signature', () => {
    console.log(`%c${t(getLang(), 'console.signature')}`, 'color:#d9a441;background:#140b08;font-family:monospace;font-size:12px;line-height:1.25;padding:8px 12px');
  });
  window.ring = () => safe('eggs.console.ring', () => {
    site().lounge.ring();
    return t(getLang(), 'egg.bell');
  });
}

export function initEggsDom({ reducedMotion, getLang }) {
  const opts = { reducedMotion: !!reducedMotion, getLang };
  safe('eggs.nitpick.init', () => initNitpick(opts));
  safe('eggs.konami.init', () => initKonami(opts));
  safe('eggs.janitor.init', () => initJanitor(opts));
  safe('eggs.night.init', () => initNight(opts));
  safe('eggs.console.init', () => initConsole(opts));
}
