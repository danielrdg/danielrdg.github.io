import { SCENE } from './layout.js';

export function fitScale(availW, availH, minScale = 1) {
  const scale = Math.max(minScale, Math.floor(Math.min(availW / SCENE.w, availH / SCENE.h)));
  const w = SCENE.w * scale;
  const h = SCENE.h * scale;
  return { scale, w, h, left: Math.floor((availW - w) / 2), top: Math.floor((availH - h) / 2) };
}

export function toScreen(rect, fit) {
  return {
    left: fit.left + rect.x * fit.scale,
    top: fit.top + rect.y * fit.scale,
    width: rect.w * fit.scale,
    height: rect.h * fit.scale,
  };
}
