import { t } from './copy.js';

const LANES = [
  { agent: 'planner', model: 'haiku', key: 'run.planner', start: 0 },
  { agent: 'builder', model: 'sonnet', key: 'run.builder', start: 500 },
  { agent: 'reviewer', model: 'opus', key: 'run.reviewer', start: 1000 },
];
const CHAR_MS = 24;
const LINE_PAUSE_MS = 140;
const DONE_HOLD_MS = 800;
const COLLAPSE_MS = 450;
const TICK_MS = 40;
const SKIP_EVENTS = ['keydown', 'pointerdown', 'wheel', 'touchstart'];
const RELEASE_EVENTS = ['pointerup', 'pointercancel', 'touchend', 'touchcancel'];
const RELEASE_MS = 350;
const GESTURE_MAX_MS = 4000;

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Each lane types its lines one after another; returns [{ line, at, end }].
function schedule(lines, start) {
  let at = start;
  return lines.map((line) => {
    const slot = { line, at, end: at + line.length * CHAR_MS };
    at = slot.end + LINE_PAUSE_MS;
    return slot;
  });
}

function fmt(ms) {
  const s = Math.min(ms, 99999) / 1000;
  return `00:${s.toFixed(1).padStart(4, '0')}`;
}

export function initRun({ reducedMotion, getLang, storage, note }) {
  const root = document.getElementById('run');
  const status = document.getElementById('status');
  if (!root) return { replay() {} };

  let gen = 0;
  let timers = [];
  let playing = false;
  let current = null;
  let stopGestureWait = null;

  const chips = () => (status ? [...status.querySelectorAll('.agent-chip[data-agent]')] : []);

  function clearTimers() {
    for (const id of timers) { clearTimeout(id); clearInterval(id); }
    timers = [];
  }

  function remember() {
    try { if (storage) storage.setItem('run.seen', '1'); } catch { /* memory only */ }
  }

  function markComplete() {
    if (!status) return;
    status.classList.remove('status--running');
    for (const chip of chips()) chip.classList.remove('agent-chip--pending');
  }

  function removeSkipListeners() {
    for (const type of SKIP_EVENTS) window.removeEventListener(type, onSkip, true);
  }

  function hideBand() {
    root.hidden = true;
    root.classList.remove('run--collapsed');
    root.setAttribute('aria-hidden', 'true');
    root.replaceChildren();
  }

  function collapse(myGen) {
    if (myGen !== gen) return;
    if (reducedMotion) {
      hideBand();
      return;
    }
    root.classList.add('run--collapsed');
    timers.push(setTimeout(() => { if (myGen === gen) hideBand(); }, COLLAPSE_MS + 50));
  }

  function finishText() {
    if (!current) return;
    for (const view of current.views) {
      for (const slot of view.slots) {
        slot.p.textContent = slot.line;
        slot.p.classList.remove('run-line--typing');
      }
    }
    current.clock.textContent = fmt(current.typedEnd);
    current.done.hidden = false;
  }

  function cancelGestureWait() {
    if (stopGestureWait) stopGestureWait();
    stopGestureWait = null;
  }

  // Removing the in-flow band mid-press would move the page under the pointer,
  // so the band stays put until the click lands (or the press is abandoned).
  function collapseAfterGesture(myGen) {
    let settled = false;
    const go = (instant) => {
      if (settled) return;
      settled = true;
      cancelGestureWait();
      timers.push(setTimeout(() => {
        if (myGen !== gen) return;
        if (instant) hideBand();
        else collapse(myGen);
      }, 0));
    };
    const onClick = (e) => go(!!(e.target instanceof Element && e.target.closest('.run-skip')));
    const onRelease = () => { timers.push(setTimeout(() => go(false), RELEASE_MS)); };
    window.addEventListener('click', onClick, true);
    for (const type of RELEASE_EVENTS) window.addEventListener(type, onRelease, { capture: true, passive: true });
    stopGestureWait = () => {
      window.removeEventListener('click', onClick, true);
      for (const type of RELEASE_EVENTS) window.removeEventListener(type, onRelease, true);
    };
    timers.push(setTimeout(() => go(false), GESTURE_MAX_MS));
  }

  // mode: 'instant' hides now, 'animate' collapses now, 'gesture' waits for the press to finish.
  function end(myGen, mode) {
    if (myGen !== gen || !playing) return;
    playing = false;
    clearTimers();
    removeSkipListeners();
    remember();
    markComplete();
    if (mode === 'instant') {
      hideBand();
      return;
    }
    finishText();
    if (mode === 'gesture') collapseAfterGesture(myGen);
    else collapse(myGen);
  }

  function onSkip(e) {
    const type = e && e.type;
    if (type === 'pointerdown' || type === 'touchstart') end(gen, 'gesture');
    else if (type === 'wheel') end(gen, 'animate');
    else end(gen, 'instant');
  }

  function build(lang) {
    const inner = el('div', 'run-inner');
    const band = el('div', 'run-band');
    const head = el('div', 'run-head');
    const deco = el('div', 'run-deco');
    deco.setAttribute('aria-hidden', 'true');

    const title = el('p', 'run-title');
    title.append(el('span', 'run-dot'), el('span', 'run-cmd', t(lang, 'run.header')));
    const clock = el('span', 'run-clock', fmt(0));
    const done = el('span', 'run-done', `✓ ${t(lang, 'run.done')}`);
    done.hidden = true;
    const meta = el('p', 'run-meta');
    meta.append(done, clock);

    const lanes = el('div', 'run-lanes');
    const views = LANES.map((lane) => {
      const lines = [].concat(t(lang, lane.key));
      const box = el('div', 'run-lane');
      box.dataset.agent = lane.agent;
      box.append(el('p', 'run-lane-name', `◆ ${lane.agent} · ${lane.model}`));
      const slots = schedule(lines, lane.start).map((slot) => {
        const p = el('p', 'run-line');
        box.append(p);
        return { ...slot, p };
      });
      lanes.append(box);
      return { agent: lane.agent, slots, end: slots[slots.length - 1].end, finished: false };
    });

    head.append(title, meta);
    deco.append(head, lanes);

    const skip = el('button', 'run-skip', t(lang, 'run.skip'));
    skip.type = 'button';
    skip.addEventListener('click', onSkip);

    band.append(deco, skip);
    inner.append(band);
    root.replaceChildren(inner);
    return { views, clock, done };
  }

  function play() {
    const myGen = ++gen;
    clearTimers();
    removeSkipListeners();
    cancelGestureWait();
    playing = true;

    const lang = getLang();
    const { views, clock, done } = build(lang);
    root.removeAttribute('aria-hidden');
    root.classList.remove('run--collapsed');
    root.hidden = false;
    if (status) status.classList.add('status--running');
    for (const chip of chips()) chip.classList.add('agent-chip--pending');

    const typedEnd = Math.max(...views.map((v) => v.end));
    current = { views, clock, done, typedEnd };
    const t0 = performance.now();

    const tick = () => {
      if (myGen !== gen) return;
      try {
        const now = performance.now() - t0;
        const time = fmt(Math.min(now, typedEnd));
        if (clock.textContent !== time) clock.textContent = time;
        for (const view of views) {
          for (const slot of view.slots) {
            const n = Math.max(0, Math.min(slot.line.length, Math.floor((now - slot.at) / CHAR_MS)));
            const typing = now >= slot.at && now < slot.end;
            if (slot.p.textContent !== slot.line.slice(0, n)) slot.p.textContent = slot.line.slice(0, n);
            slot.p.classList.toggle('run-line--typing', typing);
          }
          if (!view.finished && now >= view.end) {
            view.finished = true;
            const chip = status && status.querySelector(`.agent-chip[data-agent="${view.agent}"]`);
            if (chip) chip.classList.remove('agent-chip--pending');
          }
        }
        if (now >= typedEnd) {
          clearTimers();
          done.hidden = false;
          markComplete();
          timers.push(setTimeout(() => end(myGen, 'animate'), DONE_HOLD_MS));
        }
      } catch (err) {
        console.warn('[run]', err);
        end(myGen, 'instant');
      }
    };

    timers.push(setInterval(tick, TICK_MS));
    // Next tick: the Enter or click that started a replay must not also skip it.
    timers.push(setTimeout(() => {
      if (myGen !== gen || !playing) return;
      for (const type of SKIP_EVENTS) window.addEventListener(type, onSkip, { capture: true, passive: true });
    }, 0));
    tick();
  }

  function seen() {
    try { return !!storage && storage.getItem('run.seen') === '1'; } catch { return false; }
  }

  if (!reducedMotion && !seen()) {
    play();
  } else {
    hideBand();
  }

  return {
    replay() {
      if (reducedMotion) {
        gen++;
        playing = false;
        clearTimers();
        removeSkipListeners();
        cancelGestureWait();
        hideBand();
        markComplete();
        if (typeof note === 'function') note(t(getLang(), 'run.reduced'));
        return;
      }
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch { /* ignore */ }
      play();
    },
  };
}
