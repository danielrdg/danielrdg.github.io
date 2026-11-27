import { t } from './copy.js';
import { safe } from './safe.js';
import { onLangChange } from './i18n-dom.js';
import { OBJECTS } from './room/layout.js';
import { fitScale, toScreen } from './room/geometry.js';
import { createRoomRenderer } from './room/renderer.js';

const BELL_MS = 900;
const LIST_BELOW_W = 720;
const MIN_TARGET = 44;
const SIDE_LIST_W = 300;
const TAG_GAP = 8;

const CRT_MS = 340;
const LINE_MS = 200;
const BLACK_MS = 140;
const BUZZ_MS = 300;
const FADE_MS = 260;
const ENTRY_MS = CRT_MS + LINE_MS + BLACK_MS + BUZZ_MS + FADE_MS;
const EXIT_MS = 240;

const el = (tag, cls, attrs = {}) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

function splitLabel(text) {
  const i = text.indexOf(': ');
  return i < 0 ? ['', text] : [text.slice(0, i), text.slice(i + 2)];
}

export function initLounge({ announceEgg, print, getLang }) {
  const root = document.documentElement;
  const lightSwitch = document.getElementById('light-switch');
  const lightsOn = document.getElementById('lights-on');
  const bell = document.getElementById('bell');
  const motionQuery = safe('lounge.motion', () => matchMedia('(prefers-reduced-motion: reduce)')) || null;
  const reduced = () => !!(motionQuery && motionQuery.matches);

  let active = false;
  let enteredBySwitch = false;
  let bellTimer = 0;
  let savedScroll = 0;
  let inerted = [];

  let ui = null;
  let renderer = null;
  let card = null;
  let listMode = null;
  let hovered = null;
  let focused = null;
  let layoutFrame = 0;
  let phase = { anims: [], timer: 0 };

  const say = (key) => safe(`lounge.print.${key}`, () => print([t(getLang(), key)]));
  const visible = (node) => !!node && node.getClientRects().length > 0;

  function syncSwitch() {
    if (lightSwitch) lightSwitch.setAttribute('aria-pressed', String(active));
  }

  function stopBell() {
    clearTimeout(bellTimer);
    if (bell) bell.classList.remove('bell--ringing');
  }

  /* building */

  function fillLabel(target, key) {
    const [name, rest] = splitLabel(t(getLang(), key));
    const a = el('span', 'room-label-name');
    const b = el('span', 'room-label-text');
    a.textContent = name;
    b.textContent = rest;
    target.replaceChildren(a, b);
  }

  function build() {
    if (ui) return ui;
    const room = el('div', '', { id: 'room' });
    room.hidden = true;

    const scene = el('div', 'room-scene');
    const stage = el('div', 'room-stage');
    const canvas = el('canvas', '', { id: 'room-canvas', 'aria-hidden': 'true' });
    const dark = el('div', 'room-dark', { 'aria-hidden': 'true' });
    const spots = el('div', 'room-spots');
    const tag = el('div', 'room-tag', { 'aria-hidden': 'true' });
    tag.hidden = true;
    const hint = el('p', 'room-hint');
    const list = el('div', 'room-list', { id: 'room-list' });

    const hotspots = new Map();
    const listButtons = new Map();
    for (const obj of OBJECTS) {
      const spot = el('button', 'room-hotspot', { type: 'button', 'data-obj': obj.id });
      spot.addEventListener('click', () => safe('lounge.hotspot', () => activate(obj)));
      spot.addEventListener('pointerenter', () => safe('lounge.hover', () => { hovered = obj.id; refreshHighlight(); }));
      spot.addEventListener('pointerleave', () => safe('lounge.unhover', () => { if (hovered === obj.id) hovered = null; refreshHighlight(); }));
      spot.addEventListener('focus', () => safe('lounge.focus', () => { focused = obj.id; refreshHighlight(); }));
      spot.addEventListener('blur', () => safe('lounge.blur', () => { if (focused === obj.id) focused = null; refreshHighlight(); }));
      spots.append(spot);
      hotspots.set(obj.id, spot);

      const item = el('button', 'room-list-btn', { type: 'button', 'data-obj': obj.id });
      item.addEventListener('click', () => safe('lounge.list', () => activate(obj)));
      item.addEventListener('pointerenter', () => safe('lounge.list.hover', () => { hovered = obj.id; refreshHighlight(); }));
      item.addEventListener('pointerleave', () => safe('lounge.list.unhover', () => { if (hovered === obj.id) hovered = null; refreshHighlight(); }));
      item.addEventListener('focus', () => safe('lounge.list.focus', () => { focused = obj.id; refreshHighlight(); }));
      item.addEventListener('blur', () => safe('lounge.list.blur', () => { if (focused === obj.id) focused = null; refreshHighlight(); }));
      list.append(item);
      listButtons.set(obj.id, item);
    }

    stage.append(canvas, dark, spots, tag);
    scene.append(stage, list, hint);

    const backdrop = el('div', 'room-backdrop');
    backdrop.hidden = true;
    backdrop.addEventListener('click', () => safe('lounge.backdrop', () => closeCard(true)));

    const dialog = el('div', '', { id: 'room-card', role: 'dialog', 'aria-modal': 'true' });
    dialog.hidden = true;
    const close = el('button', 'room-card-close', { type: 'button' });
    close.textContent = '✕';
    close.addEventListener('click', () => safe('lounge.card.close', () => closeCard(true)));
    const body = el('div', 'room-card-body');
    dialog.append(close, body);

    const fx = el('div', 'room-fx', { 'aria-hidden': 'true' });
    const glare = el('div', 'room-glare');
    const shutTop = el('div', 'room-shutter room-shutter--top');
    const shutBottom = el('div', 'room-shutter room-shutter--bottom');
    const line = el('div', 'room-line');
    fx.append(glare, shutTop, shutBottom, line);

    room.append(scene, backdrop, dialog, fx);
    const status = document.getElementById('status');
    if (status && status.parentNode) status.after(room);
    else document.body.append(room);

    ui = { room, scene, stage, canvas, dark, spots, tag, hint, list, hotspots, listButtons, backdrop, dialog, close, body, fx, glare, shutTop, shutBottom, line };
    relabel();

    renderer = createRoomRenderer(canvas, { reducedMotion: reduced() });

    const prompt = document.getElementById('prompt');
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(() => scheduleLayout());
      ro.observe(room);
      ro.observe(scene);
      if (prompt) ro.observe(prompt);
    }
    window.addEventListener('resize', scheduleLayout);
    return ui;
  }

  function relabel() {
    if (!ui) return;
    const lang = getLang();
    for (const obj of OBJECTS) {
      const label = t(lang, obj.labelKey);
      ui.hotspots.get(obj.id).setAttribute('aria-label', label);
      fillLabel(ui.listButtons.get(obj.id), obj.labelKey);
    }
    ui.close.setAttribute('aria-label', t(lang, 'room.close'));
    ui.hint.textContent = t(lang, 'room.hint');
    const shown = hovered || focused;
    if (shown && !ui.tag.hidden) showTag(shown);
  }

  /* layout */

  function scheduleLayout() {
    if (layoutFrame || !ui || ui.room.hidden) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      safe('lounge.layout', layout);
    });
  }

  function promptLineHeight() {
    const prompt = document.getElementById('prompt');
    if (!visible(prompt)) return 0;
    const log = document.getElementById('prompt-log');
    return prompt.offsetHeight - (log ? log.offsetHeight : 0);
  }

  function layout() {
    if (!ui || ui.room.hidden) return;
    const { room, stage, canvas, dark } = ui;
    const narrow = window.innerWidth < LIST_BELOW_W;
    room.style.bottom = `${narrow ? 0 : promptLineHeight()}px`;

    const pad = narrow ? 16 : 24;
    const hintH = 28;
    const availW = Math.max(0, ui.scene.clientWidth - pad * 2);
    const availH = Math.max(0, room.clientHeight - pad * 2 - hintH);
    let fit = fitScale(availW, availH, 1);
    const nextList = narrow || fit.scale < 2;
    const side = nextList && availW - fit.w >= SIDE_LIST_W;
    if (nextList) fit = { ...fit, left: side ? 0 : fit.left, top: 0 };
    room.classList.toggle('room--side', side);

    if (nextList !== listMode) {
      listMode = nextList;
      room.classList.toggle('room--list', listMode);
      ui.spots.hidden = listMode;
      ui.list.hidden = !listMode;
    }

    stage.style.width = `${side ? fit.w : availW}px`;
    stage.style.height = `${listMode ? fit.h : availH}px`;
    for (const node of [canvas, dark]) {
      node.style.left = `${fit.left}px`;
      node.style.top = `${fit.top}px`;
      node.style.width = `${fit.w}px`;
      node.style.height = `${fit.h}px`;
    }

    const min = listMode ? 0 : MIN_TARGET;
    for (const obj of OBJECTS) {
      const r = toScreen(obj.rect, fit);
      const w = Math.max(r.width, min);
      const h = Math.max(r.height, min);
      const spot = ui.hotspots.get(obj.id);
      spot.style.left = `${Math.round(r.left - (w - r.width) / 2)}px`;
      spot.style.top = `${Math.round(r.top - (h - r.height) / 2)}px`;
      spot.style.width = `${w}px`;
      spot.style.height = `${h}px`;
    }
    ui.hint.style.top = listMode ? '' : `${pad + fit.top + fit.h + 16}px`;
    ui.fit = fit;
    const shown = hovered || focused;
    if (shown && !ui.tag.hidden) showTag(shown);
  }

  /* highlight and tag */

  function refreshHighlight() {
    if (!ui) return;
    const id = hovered || focused;
    if (renderer) renderer.setHighlight(id);
    if (id) showTag(id);
    else ui.tag.hidden = true;
  }

  function showTag(id) {
    const obj = OBJECTS.find((o) => o.id === id);
    if (!obj || !ui.fit) return;
    const { tag, stage } = ui;
    fillLabel(tag, obj.labelKey);
    tag.hidden = false;
    const r = toScreen(obj.rect, ui.fit);
    const tw = tag.offsetWidth;
    const th = tag.offsetHeight;
    const cx = r.left + r.width / 2;
    let left = Math.round(cx - tw / 2);
    left = Math.max(4, Math.min(left, stage.clientWidth - tw - 4));
    let top = Math.round(r.top - th - TAG_GAP);
    const below = top < ui.fit.top + 2;
    if (below) top = Math.round(r.top + r.height + TAG_GAP);
    tag.classList.toggle('room-tag--below', below);
    tag.style.left = `${left}px`;
    tag.style.top = `${top}px`;
    tag.style.setProperty('--notch', `${Math.round(Math.max(10, Math.min(tw - 10, cx - left)))}px`);
  }

  /* cards */

  function activate(obj) {
    if (!active) return;
    if (!obj.section) {
      ring();
      return;
    }
    openCard(obj);
  }

  function openCard(obj) {
    const section = document.getElementById(obj.section);
    if (!section || !ui) return;
    if (card) closeCard(false);
    card = { obj, section, parent: section.parentNode, next: section.nextSibling };
    const heading = section.querySelector('h2');
    const labelId = section.getAttribute('aria-labelledby') || (heading && heading.id) || '';
    if (labelId) ui.dialog.setAttribute('aria-labelledby', labelId);
    else ui.dialog.removeAttribute('aria-labelledby');
    ui.body.append(section);
    ui.body.scrollTop = 0;
    ui.scene.inert = true;
    ui.backdrop.hidden = false;
    ui.dialog.hidden = false;
    ui.close.focus({ preventScroll: true });
  }

  function returnTarget(id) {
    if (!ui) return null;
    const node = listMode ? ui.listButtons.get(id) : ui.hotspots.get(id);
    return visible(node) ? node : null;
  }

  function closeCard(restoreFocus) {
    if (!card) return;
    const { obj, section, parent, next } = card;
    card = null;
    if (next && next.parentNode === parent) parent.insertBefore(section, next);
    else if (parent) parent.append(section);
    if (ui) {
      ui.dialog.hidden = true;
      ui.backdrop.hidden = true;
      ui.dialog.removeAttribute('aria-labelledby');
      ui.scene.inert = false;
    }
    if (restoreFocus) {
      const target = returnTarget(obj.id);
      if (target) target.focus({ preventScroll: true });
    }
  }

  /* page behind the room */

  function setPageInert(on) {
    if (on) {
      inerted = ['top', 'run'].map((id) => document.getElementById(id))
        .concat(document.querySelector('body > footer'))
        .filter((node) => node && !node.inert);
      for (const node of inerted) node.inert = true;
    } else {
      for (const node of inerted) node.inert = false;
      inerted = [];
    }
  }

  /* transitions */

  function cancelPhase() {
    clearTimeout(phase.timer);
    for (const a of phase.anims) safe('lounge.anim.cancel', () => a.cancel());
    phase = { anims: [], timer: 0 };
    if (ui) ui.room.classList.remove('room--entering', 'room--leaving');
  }

  function animate(node, frames, opts) {
    if (!node || typeof node.animate !== 'function') return;
    phase.anims.push(node.animate(frames, { fill: 'both', ...opts }));
  }

  function playEntry() {
    cancelPhase();
    if (reduced() || typeof ui.room.animate !== 'function') return;
    const { room, scene, dark, fx, glare, shutTop, shutBottom, line } = ui;
    room.classList.add('room--entering');
    const at = (ms) => ms / ENTRY_MS;
    const blackAt = CRT_MS + LINE_MS;
    const neonAt = blackAt + BLACK_MS;
    const fadeAt = neonAt + BUZZ_MS;

    animate(room, [
      { backgroundColor: 'rgba(0,0,0,0)', offset: 0 },
      { backgroundColor: 'rgba(0,0,0,0)', offset: at(blackAt - 1) },
      { backgroundColor: '#000', offset: at(blackAt) },
      { backgroundColor: '#000', offset: 1 },
    ], { duration: ENTRY_MS, fill: 'none' });

    animate(fx, [
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: at(blackAt) },
      { opacity: 0, offset: at(blackAt) },
      { opacity: 0, offset: 1 },
    ], { duration: ENTRY_MS });

    animate(glare, [
      { opacity: 0, offset: 0 },
      { opacity: 0.3, offset: 0.6 },
      { opacity: 0.6, offset: 0.999 },
      { opacity: 0, offset: 1 },
    ], { duration: CRT_MS, easing: 'ease-in' });

    for (const shutter of [shutTop, shutBottom]) {
      animate(shutter, [
        { transform: 'scaleY(0)' },
        { transform: 'scaleY(1)' },
      ], { duration: CRT_MS, easing: 'cubic-bezier(.55,0,.85,.35)' });
    }

    animate(line, [
      { opacity: 0, transform: 'scaleX(1) scaleY(6)', offset: 0 },
      { opacity: 0, transform: 'scaleX(1) scaleY(6)', offset: at(CRT_MS - 60) },
      { opacity: 1, transform: 'scaleX(1) scaleY(1)', offset: at(CRT_MS), easing: 'cubic-bezier(.7,0,.9,.5)' },
      { opacity: 1, transform: 'scaleX(.008) scaleY(1)', offset: at(CRT_MS + LINE_MS * 0.7) },
      { opacity: 0, transform: 'scaleX(.004) scaleY(.6)', offset: at(blackAt) },
      { opacity: 0, transform: 'scaleX(0)', offset: 1 },
    ], { duration: ENTRY_MS });

    const s = (o, v) => ({ opacity: v, offset: at(neonAt + BUZZ_MS * o), easing: 'steps(1, end)' });
    animate(scene, [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: at(neonAt), easing: 'steps(1, end)' },
      s(0.06, 0.55), s(0.14, 0), s(0.3, 0.8), s(0.38, 0.1), s(0.5, 0.35), s(0.58, 1), s(0.7, 0.55),
      { opacity: 1, offset: at(fadeAt) },
      { opacity: 1, offset: 1 },
    ], { duration: ENTRY_MS });

    animate(dark, [
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: at(fadeAt) },
      { opacity: 0, offset: 1, easing: 'ease-out' },
    ], { duration: ENTRY_MS, easing: 'ease-out' });

    phase.timer = setTimeout(() => safe('lounge.entry.done', cancelPhase), ENTRY_MS + 30);
  }

  function hideRoom() {
    if (!ui) return;
    ui.room.hidden = true;
    ui.tag.hidden = true;
  }

  function playExit() {
    const entering = !!ui && ui.room.classList.contains('room--entering');
    cancelPhase();
    if (!ui) return;
    if (entering || reduced() || typeof ui.room.animate !== 'function') {
      hideRoom();
      return;
    }
    ui.room.classList.add('room--leaving');
    animate(ui.room, [{ opacity: 1 }, { opacity: 0 }], { duration: EXIT_MS, easing: 'ease-in' });
    phase.timer = setTimeout(() => safe('lounge.exit.done', () => {
      cancelPhase();
      hideRoom();
    }), EXIT_MS);
  }

  /* scroll lock */

  function lockScroll() {
    savedScroll = window.scrollY;
    root.classList.add('room-lock');
  }

  function unlockScroll() {
    root.classList.remove('room-lock');
    if (Math.abs(window.scrollY - savedScroll) > 1) window.scrollTo(0, savedScroll);
  }

  /* enter and leave */

  function enter(source) {
    if (active) return;
    active = true;
    enteredBySwitch = source === 'switch';
    root.classList.add('lounge');
    syncSwitch();
    safe('lounge.room', () => {
      build();
      cancelPhase();
      lockScroll();
      setPageInert(true);
      ui.room.hidden = false;
      layout();
      renderer.start();
      playEntry();
    });
    if (enteredBySwitch) say('egg.lounge');
    safe('lounge.announce', () => announceEgg('lounge'));
    if (enteredBySwitch && lightsOn) lightsOn.focus({ preventScroll: true });
  }

  function fallbackFocus() {
    const input = document.getElementById('prompt-input');
    if (visible(input)) return input.focus({ preventScroll: true });
    const heading = document.querySelector('main h1, main h2');
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      return heading.focus({ preventScroll: true });
    }
    if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
  }

  function leave(source) {
    if (!active) return;
    const focusedEl = document.activeElement;
    const focusWasHidden = !!focusedEl && (focusedEl === lightsOn || focusedEl === bell || (!!ui && ui.room.contains(focusedEl)));
    active = false;
    safe('lounge.card.restore', () => closeCard(false));
    safe('lounge.room.off', () => {
      hovered = null;
      focused = null;
      if (renderer) {
        renderer.stop();
        renderer.setHighlight(null);
      }
      setPageInert(false);
      unlockScroll();
      playExit();
    });
    root.classList.remove('lounge');
    syncSwitch();
    stopBell();
    if (source === 'switch' || (focusWasHidden && enteredBySwitch)) {
      if (lightSwitch) lightSwitch.focus({ preventScroll: true });
    } else if (focusWasHidden) {
      fallbackFocus();
    }
    enteredBySwitch = false;
  }

  function ring() {
    say('egg.bell');
    safe('lounge.bell.announce', () => announceEgg('bell'));
    if (!active || !bell) return;
    stopBell();
    void bell.offsetWidth;
    bell.classList.add('bell--ringing');
    bellTimer = setTimeout(stopBell, BELL_MS);
  }

  function onMotionChange() {
    if (!ui) return;
    if (renderer) renderer.destroy();
    renderer = createRoomRenderer(ui.canvas, { reducedMotion: reduced() });
    renderer.setHighlight(hovered || focused);
    if (active) renderer.start();
    if (reduced()) cancelPhase();
    if (!active) hideRoom();
  }

  syncSwitch();
  if (lightSwitch) lightSwitch.addEventListener('click', () => safe('lounge.switch', () => (active ? leave('switch') : enter('switch'))));
  if (lightsOn) lightsOn.addEventListener('click', () => safe('lounge.lights-on', () => leave('lights-on')));
  if (bell) {
    bell.addEventListener('click', () => safe('lounge.bell', ring));
    bell.addEventListener('animationend', () => safe('lounge.bell.end', stopBell));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (card) {
      e.preventDefault();
      safe('lounge.card.esc', () => closeCard(true));
    } else if (active) {
      safe('lounge.esc', () => leave('esc'));
    }
  });
  window.addEventListener('beforeprint', () => safe('lounge.beforeprint', () => closeCard(false)));
  onLangChange(() => safe('lounge.lang', relabel));
  if (motionQuery && typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', () => safe('lounge.motion.change', onMotionChange));
  }

  return {
    on: () => enter('api'),
    off: () => leave('api'),
    isOn: () => active,
    ring,
  };
}
