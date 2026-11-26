import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE, OBJECTS } from '../js/room/layout.js';
import { fitScale, toScreen } from '../js/room/geometry.js';
import { COPY } from '../js/copy.js';

test('OBJECTS keep the Tab order', () => {
  assert.deepEqual(
    OBJECTS.map((o) => o.id),
    ['chalkboard', 'menu', 'poster', 'tray', 'diploma', 'jukebox', 'door', 'bell'],
  );
});

test('SCENE and OBJECTS are frozen', () => {
  assert.deepEqual(SCENE, { w: 320, h: 180 });
  assert.ok(Object.isFrozen(SCENE) && Object.isFrozen(OBJECTS));
});

test('every rect is integer, positive and inside the scene', () => {
  for (const { id, rect: r } of OBJECTS) {
    for (const k of ['x', 'y', 'w', 'h']) assert.ok(Number.isInteger(r[k]), `${id}.${k}`);
    assert.ok(r.w > 0 && r.h > 0, `${id} size`);
    assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= SCENE.w && r.y + r.h <= SCENE.h, `${id} bounds`);
  }
});

test('no two rects overlap', () => {
  for (let i = 0; i < OBJECTS.length; i++) {
    for (let j = i + 1; j < OBJECTS.length; j++) {
      const a = OBJECTS[i].rect;
      const b = OBJECTS[j].rect;
      const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
      assert.ok(apart, `${OBJECTS[i].id} overlaps ${OBJECTS[j].id}`);
    }
  }
});

test('each section appears exactly once; bell has none', () => {
  const sections = ['ai', 'experience', 'building', 'academic', 'education', 'skills', 'contact'];
  const got = OBJECTS.map((o) => o.section).filter((s) => s !== null);
  assert.deepEqual([...got].sort(), [...sections].sort());
  assert.equal(OBJECTS.find((o) => o.id === 'bell').section, null);
});

test('every labelKey and the room keys exist in en and pt', () => {
  const keys = [...OBJECTS.map((o) => o.labelKey), 'room.enter', 'room.hint', 'room.close'];
  for (const lang of ['en', 'pt']) {
    for (const k of keys) assert.ok(typeof COPY[lang][k] === 'string' && COPY[lang][k].length > 0, `${lang} ${k}`);
  }
});

test('fitScale', () => {
  assert.deepEqual(fitScale(1280, 720), { scale: 4, w: 1280, h: 720, left: 0, top: 0 });
  assert.deepEqual(fitScale(1000, 700), { scale: 3, w: 960, h: 540, left: 20, top: 80 });
  const m = fitScale(375, 600);
  assert.equal(m.scale, 1);
  assert.equal(m.w, 320);
  assert.equal(m.left, 27);
  const s = fitScale(200, 100);
  assert.equal(s.scale, 1);
  assert.equal(s.left, -60);
});

test('toScreen maps scene rects to css px', () => {
  assert.deepEqual(
    toScreen({ x: 10, y: 20, w: 30, h: 40 }, { scale: 3, left: 5, top: 7 }),
    { left: 35, top: 67, width: 90, height: 120 },
  );
});
