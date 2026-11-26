import { PT } from './i18n.js';
import { safe } from './safe.js';

const listeners = [];
const attrCache = new WeakMap();
let current = null;
let enTitle = null;
let enDescription = null;

function validLang(lang) {
  return lang === 'pt' ? 'pt' : 'en';
}

function setText(el, lang) {
  if (!el.hasAttribute('data-i18n-en')) el.setAttribute('data-i18n-en', el.textContent);
  const value = lang === 'pt' ? PT[el.getAttribute('data-i18n')] : el.getAttribute('data-i18n-en');
  if (typeof value === 'string' && value) el.textContent = value;
}

function setAttrs(el, lang) {
  let cache = attrCache.get(el);
  if (!cache) {
    cache = {};
    attrCache.set(el, cache);
  }
  for (const pair of el.getAttribute('data-i18n-attr').split(';')) {
    const i = pair.indexOf(':');
    if (i < 1) continue;
    const attr = pair.slice(0, i).trim();
    const key = pair.slice(i + 1).trim();
    if (!(attr in cache)) cache[attr] = el.getAttribute(attr);
    const value = lang === 'pt' ? PT[key] : cache[attr];
    if (typeof value === 'string' && value) el.setAttribute(attr, value);
  }
}

export function applyLang(lang) {
  lang = validLang(lang);
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="description"]');
  if (enTitle === null) {
    enTitle = document.title;
    enDescription = meta ? meta.getAttribute('content') : null;
  }

  for (const el of document.querySelectorAll('[data-i18n]')) safe('i18n.text', () => setText(el, lang));
  for (const el of document.querySelectorAll('[data-i18n-attr]')) safe('i18n.attr', () => setAttrs(el, lang));

  safe('i18n.root', () => {
    root.lang = lang === 'pt' ? 'pt-BR' : 'en';
    root.dataset.lang = lang;
  });
  safe('i18n.title', () => {
    document.title = lang === 'pt' ? (PT['meta.title'] || enTitle) : enTitle;
  });
  safe('i18n.meta', () => {
    const description = lang === 'pt' ? PT['meta.description'] : enDescription;
    if (meta && description) meta.setAttribute('content', description);
  });
  safe('i18n.store', () => localStorage.setItem('lang', lang));
  safe('i18n.pressed', () => {
    const en = document.getElementById('lang-en');
    const pt = document.getElementById('lang-pt');
    if (en) en.setAttribute('aria-pressed', String(lang === 'en'));
    if (pt) pt.setAttribute('aria-pressed', String(lang === 'pt'));
  });

  current = lang;
  for (const cb of listeners.slice()) safe('i18n.listener', () => cb(lang));
}

export function getLang() {
  if (current) return current;
  return safe('i18n.getLang', () => validLang(document.documentElement.dataset.lang)) || 'en';
}

export function onLangChange(cb) {
  if (typeof cb === 'function') listeners.push(cb);
}
