import { SCENE, OBJECTS } from './layout.js';
import { drawStatic, drawAmbient, drawHighlight } from './art.js';

const FRAME_MS = 1000 / 30;
const STILL_T = 600;

function makeLayer() {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(SCENE.w, SCENE.h);
  const c = document.createElement('canvas');
  c.width = SCENE.w;
  c.height = SCENE.h;
  return c;
}

export function createRoomRenderer(canvas, { reducedMotion = false } = {}) {
  canvas.width = SCENE.w;
  canvas.height = SCENE.h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let layer = null;
  let highlight = null;
  let started = false;
  let rafId = 0;
  let last = -Infinity;
  let lastT = STILL_T;
  let destroyed = false;

  function staticLayer() {
    if (!layer) {
      layer = makeLayer();
      const lctx = layer.getContext('2d');
      drawStatic(lctx);
    }
    return layer;
  }

  function paint(t) {
    lastT = t;
    ctx.globalAlpha = 1;
    ctx.drawImage(staticLayer(), 0, 0);
    drawAmbient(ctx, t);
    if (highlight) drawHighlight(ctx, highlight, t);
  }

  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (now - last < FRAME_MS - 2) return;
    last = now;
    paint(now);
  }

  function schedule() {
    if (destroyed || rafId || !started || reducedMotion || document.hidden) return;
    last = -Infinity;
    rafId = requestAnimationFrame(tick);
  }

  function unschedule() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function onVisibility() {
    if (document.hidden) unschedule();
    else schedule();
  }

  document.addEventListener('visibilitychange', onVisibility);

  function renderOnce() {
    if (destroyed) return;
    paint(reducedMotion ? STILL_T : lastT);
  }

  return {
    start() {
      if (destroyed) return;
      if (reducedMotion) {
        renderOnce();
        return;
      }
      started = true;
      schedule();
    },
    stop() {
      started = false;
      unschedule();
    },
    isRunning: () => rafId !== 0,
    setHighlight(id) {
      if (destroyed) return;
      highlight = (id && OBJECTS.find((o) => o.id === id)) || null;
      if (!rafId) renderOnce();
    },
    renderOnce,
    destroy() {
      destroyed = true;
      started = false;
      unschedule();
      document.removeEventListener('visibilitychange', onVisibility);
      layer = null;
    },
  };
}
