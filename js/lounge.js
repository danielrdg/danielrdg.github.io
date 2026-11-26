import { t } from './copy.js';
import { safe } from './safe.js';

const BELL_MS = 900;

export function initLounge({ announceEgg, print, getLang }) {
  const root = document.documentElement;
  const lightSwitch = document.getElementById('light-switch');
  const lightsOn = document.getElementById('lights-on');
  const bell = document.getElementById('bell');
  let active = false;
  let enteredBySwitch = false;
  let bellTimer = 0;

  const say = (key) => safe(`lounge.print.${key}`, () => print([t(getLang(), key)]));
  const visible = (el) => !!el && el.getClientRects().length > 0;

  function syncSwitch() {
    if (lightSwitch) lightSwitch.setAttribute('aria-pressed', String(active));
  }

  function stopBell() {
    clearTimeout(bellTimer);
    if (bell) bell.classList.remove('bell--ringing');
  }

  function enter(source) {
    if (active) return;
    active = true;
    enteredBySwitch = source === 'switch';
    root.classList.add('lounge');
    syncSwitch();
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
    const focused = document.activeElement;
    const focusWasHidden = !!focused && (focused === lightsOn || focused === bell);
    active = false;
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

  syncSwitch();
  if (lightSwitch) lightSwitch.addEventListener('click', () => safe('lounge.switch', () => (active ? leave('switch') : enter('switch'))));
  if (lightsOn) lightsOn.addEventListener('click', () => safe('lounge.lights-on', () => leave('lights-on')));
  if (bell) {
    bell.addEventListener('click', () => safe('lounge.bell', ring));
    bell.addEventListener('animationend', () => safe('lounge.bell.end', stopBell));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && active) safe('lounge.esc', () => leave('esc'));
  });

  return {
    on: () => enter('api'),
    off: () => leave('api'),
    isOn: () => active,
    ring,
  };
}
