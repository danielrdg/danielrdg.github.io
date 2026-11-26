import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE, OBJECTS } from '../js/room/layout.js';
import { drawStatic, drawAmbient, drawHighlight, neonFlicker, candleFrame } from '../js/room/art.js';
import { createRoomRenderer } from '../js/room/renderer.js';

function fakeCtx() {
  const calls = [];
  const state = { fillStyle: '#000', globalAlpha: 1, imageSmoothingEnabled: true };
  const api = {
    fillRect: (...a) => calls.push(['fillRect', ...a]),
    drawImage: (...a) => calls.push(['drawImage', ...a]),
  };
  const ctx = new Proxy(state, {
    get(target, key) {
      if (key in api) return api[key];
      if (key in target) return target[key];
      throw new Error(`unexpected ctx.${String(key)}`);
    },
    set(target, key, value) {
      if (!(key in target)) throw new Error(`unexpected ctx.${String(key)} =`);
      if (key === 'globalAlpha') assert.ok(value >= 0 && value <= 1, `alpha ${value}`);
      target[key] = value;
      return true;
    },
  });
  return { ctx, calls };
}

function assertInScene(calls, label) {
  for (const [op, x, y, w, h] of calls) {
    if (op !== 'fillRect') continue;
    for (const v of [x, y, w, h]) assert.ok(Number.isInteger(v), `${label}: non-integer ${[x, y, w, h]}`);
    assert.ok(w > 0 && h > 0, `${label}: empty rect ${[x, y, w, h]}`);
    assert.ok(x >= 0 && y >= 0 && x + w <= SCENE.w && y + h <= SCENE.h, `${label}: out of scene ${[x, y, w, h]}`);
  }
}

test('drawStatic paints in-scene integer rects only', () => {
  const { ctx, calls } = fakeCtx();
  drawStatic(ctx);
  assert.ok(calls.length > 500);
  assertInScene(calls, 'static');
  assert.equal(ctx.globalAlpha, 1);
});

test('drawAmbient stays in the scene across many timestamps', () => {
  for (let t = 0; t < 60000; t += 377) {
    const { ctx, calls } = fakeCtx();
    drawAmbient(ctx, t);
    assert.ok(calls.length > 0);
    assertInScene(calls, `ambient t=${t}`);
    assert.equal(ctx.globalAlpha, 1);
  }
});

test('drawHighlight outlines every object inside the scene', () => {
  for (const obj of OBJECTS) {
    for (let t = 0; t < 3000; t += 250) {
      const { ctx, calls } = fakeCtx();
      drawHighlight(ctx, obj, t);
      assert.ok(calls.length >= 4, obj.id);
      assertInScene(calls, `highlight ${obj.id}`);
    }
  }
});

test('neon flicker never exceeds 3 flashes per second', () => {
  let prev = false;
  const offs = [];
  for (let t = 0; t <= 300000; t += 10) {
    const off = neonFlicker(t).dim > 0;
    if (off && !prev) offs.push(t);
    prev = off;
  }
  assert.ok(offs.length > 10, 'flicker happens');
  for (let i = 3; i < offs.length; i++) assert.ok(offs[i] - offs[i - 3] > 1000, `burst at ${offs[i]}`);
  assert.equal(neonFlicker(0).dim, 0);
  assert.equal(neonFlicker(600).dim, 0, 'reduced-motion still frame shows the neon lit');
});

test('candle flicker changes at most 3 times per second', () => {
  const changes = [];
  let prev = JSON.stringify(candleFrame(0));
  for (let t = 0; t <= 120000; t += 10) {
    const cur = JSON.stringify(candleFrame(t));
    if (cur !== prev) changes.push(t);
    prev = cur;
  }
  assert.ok(changes.length > 10);
  for (let i = 3; i < changes.length; i++) assert.ok(changes[i] - changes[i - 3] > 1000, `burst at ${changes[i]}`);
});

function setupDom({ hidden = false } = {}) {
  const listeners = new Map();
  let nextId = 1;
  const pending = new Map();
  const saved = {
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
  };
  const canvas = () => {
    const c = { width: 0, height: 0, ctx: fakeCtx() };
    c.getContext = () => c.ctx.ctx;
    return c;
  };
  globalThis.document = {
    hidden,
    createElement: (tag) => (assert.equal(tag, 'canvas'), canvas()),
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type, fn) => listeners.get(type) === fn && listeners.delete(type),
  };
  globalThis.requestAnimationFrame = (fn) => (pending.set(nextId, fn), nextId++);
  globalThis.cancelAnimationFrame = (id) => pending.delete(id);
  return {
    canvas,
    pending,
    listeners,
    setHidden(v) {
      globalThis.document.hidden = v;
      listeners.get('visibilitychange')?.();
    },
    flush(t) {
      const fns = [...pending.values()];
      pending.clear();
      for (const fn of fns) fn(t);
    },
    restore() {
      Object.assign(globalThis, saved);
    },
  };
}

test('renderer sizes the backing store and renders under reduced motion without looping', () => {
  const dom = setupDom();
  try {
    const canvas = dom.canvas();
    const r = createRoomRenderer(canvas, { reducedMotion: true });
    assert.equal(canvas.width, 320);
    assert.equal(canvas.height, 180);
    r.start();
    assert.equal(r.isRunning(), false);
    assert.equal(dom.pending.size, 0);
    const drawn = canvas.ctx.calls.filter((c) => c[0] === 'drawImage').length;
    assert.ok(drawn >= 1, 'one static frame');
    r.setHighlight('door');
    assert.ok(canvas.ctx.calls.filter((c) => c[0] === 'drawImage').length > drawn, 'highlight re-renders');
    r.destroy();
  } finally {
    dom.restore();
  }
});

test('renderer loops, pauses while hidden and resumes only if started', () => {
  const dom = setupDom();
  try {
    const canvas = dom.canvas();
    const r = createRoomRenderer(canvas, { reducedMotion: false });
    assert.equal(r.isRunning(), false);
    dom.setHidden(true);
    dom.setHidden(false);
    assert.equal(r.isRunning(), false, 'not started, stays idle');
    assert.equal(dom.pending.size, 0);

    r.start();
    assert.equal(r.isRunning(), true);
    dom.flush(16);
    dom.flush(60);
    assert.ok(canvas.ctx.calls.some((c) => c[0] === 'drawImage'));
    assert.equal(dom.pending.size, 1);

    dom.setHidden(true);
    assert.equal(r.isRunning(), false);
    assert.equal(dom.pending.size, 0);
    dom.setHidden(false);
    assert.equal(r.isRunning(), true);
    assert.equal(dom.pending.size, 1);

    r.stop();
    assert.equal(r.isRunning(), false);
    assert.equal(dom.pending.size, 0);
    dom.setHidden(true);
    dom.setHidden(false);
    assert.equal(r.isRunning(), false, 'stopped, stays idle');

    r.start();
    r.destroy();
    assert.equal(r.isRunning(), false);
    assert.equal(dom.pending.size, 0);
    assert.equal(dom.listeners.size, 0);
  } finally {
    dom.restore();
  }
});

test('start while hidden schedules nothing until visible', () => {
  const dom = setupDom({ hidden: true });
  try {
    const r = createRoomRenderer(dom.canvas(), {});
    r.start();
    assert.equal(r.isRunning(), false);
    assert.equal(dom.pending.size, 0);
    dom.setHidden(false);
    assert.equal(r.isRunning(), true);
    r.destroy();
  } finally {
    dom.restore();
  }
});

test('renderer throttles to about 30 fps', () => {
  const dom = setupDom();
  try {
    const canvas = dom.canvas();
    const r = createRoomRenderer(canvas, {});
    r.start();
    const frames = () => canvas.ctx.calls.filter((c) => c[0] === 'drawImage').length;
    for (let t = 0; t <= 1000; t += 1000 / 60) dom.flush(t);
    assert.ok(frames() >= 25 && frames() <= 33, `frames ${frames()}`);
    r.destroy();
  } finally {
    dom.restore();
  }
});
