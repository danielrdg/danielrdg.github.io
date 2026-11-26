export const EGG_IDS = Object.freeze(['lounge', 'approval', 'sudo', 'secrets', 'nitpick', 'konami', 'janitor', 'night', 'bell']);

const KEY = 'eggs.v1';

function load(storage) {
  try {
    const raw = storage && storage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return EGG_IDS.filter((id) => arr.includes(id));
  } catch {
    return [];
  }
}

export function createEggTracker(storage) {
  const found = new Set(load(storage));
  const listeners = [];
  return {
    total: EGG_IDS.length,
    find(id) {
      if (!EGG_IDS.includes(id) || found.has(id)) return false;
      found.add(id);
      try {
        if (storage) storage.setItem(KEY, JSON.stringify(EGG_IDS.filter((e) => found.has(e))));
      } catch { /* memory only */ }
      for (const cb of listeners) {
        try { cb(found.size); } catch { /* one listener never breaks another */ }
      }
      return true;
    },
    has: (id) => found.has(id),
    count: () => found.size,
    found: () => EGG_IDS.filter((id) => found.has(id)),
    onChange(cb) { listeners.push(cb); },
  };
}

export function nextHintKey(found) {
  const next = EGG_IDS.find((id) => !found.includes(id));
  return next ? `hint.${next}` : 'hint.all';
}

export function isNight(date) {
  const h = date.getHours();
  return h >= 22 || h < 6;
}

export const PASSIVE_EGGS = Object.freeze(['janitor', 'night']);

// Passive eggs fire without user input, so they stay out of the prompt log.
// Exception: with reduced motion the janitor has no sweep, so its line prints once, on first find.
export function passiveEggPrints(id, { firstFind, reducedMotion }) {
  if (!PASSIVE_EGGS.includes(id)) return true;
  return id === 'janitor' && !!reducedMotion && !!firstFind;
}
