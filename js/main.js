import { safe } from './safe.js';
import { resolveLang } from './i18n.js';
import { applyLang, getLang } from './i18n-dom.js';
import { t } from './copy.js';
import { createEggTracker } from './eggs.js';
import { initRun } from './run.js';
import { initPrompt } from './prompt.js';
import { initLounge } from './lounge.js';
import { initEggsDom } from './eggs-dom.js';

const reducedMotion = safe('motion', () => matchMedia('(prefers-reduced-motion: reduce)').matches) || false;

function safeStorage() {
  let ls = null;
  try {
    ls = window.localStorage;
    if (!ls) return null;
  } catch {
    return null;
  }
  return {
    getItem(key) {
      try { return ls.getItem(key); } catch { return null; }
    },
    setItem(key, value) {
      try { ls.setItem(key, value); } catch { /* memory only */ }
    },
  };
}

const storage = safe('storage', safeStorage) || null;

const byId = (id) => document.getElementById(id);
const on = (id, type, fn) => {
  const node = byId(id);
  if (node) node.addEventListener(type, fn);
};

const site = {
  tracker: null,
  lounge: { on() {}, off() {}, isOn() { return false; }, ring() {} },
  prompt: { print() {}, clear() {} },
  announceEgg(id) {
    if (!site.tracker || !site.tracker.find(id)) return;
    site.prompt.print([t(getLang(), 'egg.found', { n: String(site.tracker.count()), total: '9' })]);
  },
};
safe('boot.site', () => { window.__site = site; });

safe('boot.lang', () => applyLang(resolveLang(location.search, storage && storage.getItem('lang'))));
safe('boot.lang-switch', () => {
  on('lang-en', 'click', () => applyLang('en'));
  on('lang-pt', 'click', () => applyLang('pt'));
});

site.tracker = safe('boot.tracker', () => createEggTracker(storage)) || safe('boot.tracker.memory', () => createEggTracker(null)) || null;

const run = safe('boot.run', () => initRun({
  reducedMotion,
  getLang,
  storage,
  note: (line) => site.prompt.print([line]),
}));
safe('boot.replay', () => on('replay-btn', 'click', () => safe('replay', () => run && run.replay())));

safe('boot.prompt', () => {
  const prompt = initPrompt({
    tracker: site.tracker,
    getLang,
    effects: {
      'lounge-on': () => window.__site.lounge.on(),
      'lounge-off': () => window.__site.lounge.off(),
      print: () => setTimeout(() => window.print(), 50),
      replay: () => run && run.replay(),
      'lang-pt': () => applyLang('pt'),
      'lang-en': () => applyLang('en'),
      clear: () => site.prompt.clear(),
      contact: () => {
        const contact = byId('contact');
        if (!contact) return;
        contact.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        const link = contact.querySelector('a[href]');
        if (link) link.focus({ preventScroll: true });
      },
    },
  });
  if (prompt) site.prompt = prompt;
});

safe('boot.lounge', () => {
  const lounge = initLounge({
    announceEgg: (id) => site.announceEgg(id),
    print: (lines) => site.prompt.print(lines),
    getLang,
  });
  if (lounge) site.lounge = lounge;
});

safe('boot.eggs', () => initEggsDom({ reducedMotion, getLang }));

safe('boot.status-h', () => {
  const status = byId('status');
  if (!status || typeof ResizeObserver !== 'function') return;
  const sync = () => safe('status-h', () => document.documentElement.style.setProperty('--status-h', `${status.offsetHeight}px`));
  new ResizeObserver(sync).observe(status);
  sync();
});

safe('boot.cv', () => on('cv-btn', 'click', () => window.print()));
