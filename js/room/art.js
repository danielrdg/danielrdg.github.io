import { SCENE, OBJECTS } from './layout.js';

const W = SCENE.w;
const H = SCENE.h;
const R = Object.fromEntries(OBJECTS.map((o) => [o.id, o.rect]));

const C = {
  ink: '#140b08',
  lacDeep: '#220b08',
  lacDark: '#2d0f0c',
  lac: '#3a130f',
  lacLight: '#4e1c15',
  lattice: '#6b3d1a',
  goldDeep: '#5c3d17',
  goldDark: '#8a6122',
  gold: '#d9a441',
  brass: '#f0c870',
  light: '#ffd45c',
  cream: '#f3e6cf',
  creamDark: '#c9b89a',
  creamDeep: '#8f7d63',
  mute: '#a88a6a',
  muteDark: '#6e5640',
  pink: '#ff5fa2',
  pinkDark: '#a8336a',
  pinkLight: '#ffc2dc',
  mint: '#5fd39a',
  mintDark: '#2f7a58',
  mintLight: '#c8f5dc',
  blue: '#5b9cf5',
  blueDark: '#2a4a80',
  blueLight: '#bcd6ff',
  night: '#0d1424',
  nightDeep: '#080c17',
  nightHaze: '#1d1f3a',
  red: '#c0281f',
  redDark: '#8c1a14',
  velvet: '#7a1f18',
  velvetLight: '#9e2c20',
  velvetDark: '#4a120e',
  wood: '#5a2a16',
  woodDark: '#3a1a0e',
  woodLight: '#7a3e1e',
  woodRed: '#5a1a12',
  floor: '#2a130b',
  floorLight: '#341a0f',
  slate: '#1c2822',
  slateLight: '#27362d',
  orange: '#ff8a3a',
};


function px(ctx, x, y, w, h, c, a = 1) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(W, Math.round(x + w));
  const y1 = Math.min(H, Math.round(y + h));
  if (x1 <= x0 || y1 <= y0 || !(a > 0)) return;
  ctx.globalAlpha = a > 1 ? 1 : a;
  ctx.fillStyle = c;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}

const hline = (ctx, x, y, w, c, a) => px(ctx, x, y, w, 1, c, a);
const vline = (ctx, x, y, h, c, a) => px(ctx, x, y, 1, h, c, a);

function frame(ctx, x, y, w, h, c, a) {
  hline(ctx, x, y, w, c, a);
  hline(ctx, x, y + h - 1, w, c, a);
  vline(ctx, x, y + 1, h - 2, c, a);
  vline(ctx, x + w - 1, y + 1, h - 2, c, a);
}

function dither(ctx, x, y, w, h, c, a = 1, phase = 0) {
  for (let j = 0; j < h; j++) {
    for (let i = (j + phase) & 1; i < w; i += 2) px(ctx, x + i, y + j, 1, 1, c, a);
  }
}

function ellipse(ctx, cx, cy, rx, ry, c, a) {
  if (rx < 1 || ry < 1) return px(ctx, cx, cy, 1, 1, c, a);
  for (let dy = -ry; dy <= ry; dy++) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    px(ctx, cx - half, cy + dy, half * 2 + 1, 1, c, a);
  }
}

function glow(ctx, cx, cy, rx, ry, c, a, steps = 4) {
  for (let i = 0; i < steps; i++) {
    const k = 1 - i / steps;
    ellipse(ctx, Math.round(cx), Math.round(cy), Math.round(rx * k), Math.round(ry * k), c, a);
  }
}

function sprite(ctx, x, y, rows, map, a = 1) {
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      let n = 1;
      while (i + n < row.length && row[i + n] === ch) n++;
      const c = map[ch];
      if (c) px(ctx, x + i, y + j, n, 1, c, a);
      i += n;
    }
  }
}

function hash(n) {
  let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const FONT3 = {
  A: ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'],
  C: ['.XX', 'X..', 'X..', 'X..', '.XX'],
  E: ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
  I: ['XXX', '.X.', '.X.', '.X.', 'XXX'],
  L: ['X..', 'X..', 'X..', 'X..', 'XXX'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
  N: ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X'],
  P: ['XX.', 'X.X', 'XX.', 'X..', 'X..'],
  R: ['XX.', 'X.X', 'XX.', 'X.X', 'X.X'],
  S: ['.XX', 'X..', '.X.', '..X', 'XX.'],
  T: ['XXX', '.X.', '.X.', '.X.', '.X.'],
  U: ['X.X', 'X.X', 'X.X', 'X.X', 'XXX'],
  X: ['X.X', 'X.X', '.X.', 'X.X', 'X.X'],
};

function text3(ctx, x, y, str, c, a = 1) {
  let cx = x;
  for (const ch of str) {
    if (ch === ' ') { cx += 3; continue; }
    const g = FONT3[ch === 'Î' ? 'I' : ch];
    if (!g) continue;
    sprite(ctx, cx, y, g, { X: c }, a);
    if (ch === 'Î') {
      px(ctx, cx + 1, y - 3, 1, 1, c, a);
      px(ctx, cx, y - 2, 1, 1, c, a);
      px(ctx, cx + 2, y - 2, 1, 1, c, a);
    }
    cx += g[0].length + 1;
  }
}

const text3Width = (str) =>
  [...str].reduce((s, ch) => s + (ch === ' ' ? 3 : (FONT3[ch === 'Î' ? 'I' : ch]?.[0].length ?? 0) + 1), -1);


const FLOOR_Y = 116;
const COUNTER = { x: 121, y: 98, w: 132, front: 102, bottom: 132 };
const WINDOWS = [
  { x: 63, y: 22, w: 28, h: 44, seed: 11 },
  { x: 234, y: 26, w: 18, h: 40, seed: 29 },
];
const LANTERNS = [
  { x: 57, top: 12, phase: 0.0, speed: 1.05 },
  { x: 136, top: 9, phase: 2.1, speed: 0.93 },
  { x: 240, top: 7, phase: 4.0, speed: 1.17 },
];
const SHELF = { x: 178, y: 29, w: 50, h: 56, planks: [46, 64, 82] };
const CUP = { x: 205, y: 89 };
const CANDLE = { x: 66, wick: 138 };
const BEAM = { top: 12, bottom: 110, l0: 66, r0: 72, l1: 12, r1: 62 };

function panes(win) {
  const mx = win.x + Math.floor(win.w / 2);
  const my = win.y + Math.floor(win.h * 0.42);
  return [
    { x: win.x, y: win.y, w: mx - win.x, h: my - win.y },
    { x: mx + 1, y: win.y, w: win.x + win.w - mx - 1, h: my - win.y },
    { x: win.x, y: my + 1, w: mx - win.x, h: win.y + win.h - my - 1 },
    { x: mx + 1, y: my + 1, w: win.x + win.w - mx - 1, h: win.y + win.h - my - 1 },
  ];
}

function beamSpan(y) {
  const k = (y - BEAM.top) / (BEAM.bottom - BEAM.top);
  return [Math.round(BEAM.l0 + (BEAM.l1 - BEAM.l0) * k), Math.round(BEAM.r0 + (BEAM.r1 - BEAM.r0) * k)];
}


const NEON_GLYPHS = [
  ['.....', '.....', '.....', 'XX.X.', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X', 'X.X.X'],
  ['....', '....', '....', 'XXX.', '...X', '.XXX', 'X..X', 'X..X', '.XXX'],
  ['.X.', 'X.X', '...', '.X.', '.X.', '.X.', '.X.', '.X.', '.X.'],
  ['...', '.X.', '.X.', 'XXX', '.X.', '.X.', '.X.', '.X.', '..X'],
  ['....', '....', '....', 'X.XX', 'XX..', 'X...', 'X...', 'X...', 'X...'],
  ['....', '....', '....', '.XX.', 'X..X', 'XXXX', 'X...', 'X..X', '.XX.'],
];
const NEON_SCALE = 2;
const NEON_PLATE = { x: 152, y: 5, w: 68, h: 22 };

const NEON = (() => {
  const cells = NEON_GLYPHS.reduce((s, g) => s + g[0].length, 0) + NEON_GLYPHS.length - 1;
  const x0 = NEON_PLATE.x + Math.floor((NEON_PLATE.w - cells * NEON_SCALE) / 2);
  const y0 = NEON_PLATE.y + 2;
  const core = new Set();
  const letters = [];
  let gx = 0;
  for (const g of NEON_GLYPHS) {
    const lx = x0 + gx * NEON_SCALE;
    letters.push({ x: lx - 2, y: y0 - 1, w: g[0].length * NEON_SCALE + 4, h: g.length * NEON_SCALE + 2 });
    g.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch !== 'X') return;
      for (let dy = 0; dy < NEON_SCALE; dy++) {
        for (let dx = 0; dx < NEON_SCALE; dx++) core.add(`${lx + i * NEON_SCALE + dx},${y0 + j * NEON_SCALE + dy}`);
      }
    }));
    gx += g[0].length + 1;
  }
  const near = new Set();
  const far = new Set();
  for (const key of core) {
    const [x, y] = key.split(',').map(Number);
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const k = `${x + dx},${y + dy}`;
        if (core.has(k)) continue;
        const d = Math.abs(dx) + Math.abs(dy);
        if (Math.max(Math.abs(dx), Math.abs(dy)) <= 1) near.add(k);
        else if (d <= 3) far.add(k);
      }
    }
  }
  for (const k of near) far.delete(k);
  const toList = (s) => [...s].map((k) => k.split(',').map(Number));
  const coreList = toList(core).map(([x, y]) => [x, y, !core.has(`${x - 1},${y}`) || !core.has(`${x},${y - 1}`)]);
  return { core: coreList, near: toList(near), far: toList(far), letters };
})();

export function neonFlicker(tMs) {
  const P = 4300;
  const k = Math.floor(tMs / P);
  const start = 700 + Math.floor(hash(k * 7 + 1) * (P - 1600));
  const local = tMs - k * P - start;
  const letter = Math.floor(hash(k * 7 + 3) * NEON_GLYPHS.length);
  if (hash(k * 7 + 2) < 0.2 || local < 0) return { dim: 0, letter };
  if (local < 70) return { dim: 0.7, letter };
  if (hash(k * 7 + 4) > 0.45 && local >= 170 && local < 230) return { dim: 0.45, letter };
  return { dim: 0, letter };
}

function drawNeon(ctx) {
  const p = NEON_PLATE;
  glow(ctx, p.x + p.w / 2, p.y + p.h / 2, 58, 22, C.pink, 0.035, 4);
  vline(ctx, p.x + 8, 4, p.y - 4, C.goldDeep);
  vline(ctx, p.x + p.w - 9, 4, p.y - 4, C.goldDeep);
  px(ctx, p.x - 1, p.y - 1, p.w + 2, p.h + 2, C.ink);
  px(ctx, p.x, p.y, p.w, p.h, '#1a0a0b');
  frame(ctx, p.x, p.y, p.w, p.h, C.goldDeep);
  hline(ctx, p.x + 1, p.y, p.w - 2, C.goldDark);
  for (const [x, y] of [[p.x + 2, p.y + 2], [p.x + p.w - 3, p.y + 2], [p.x + 2, p.y + p.h - 3], [p.x + p.w - 3, p.y + p.h - 3]]) {
    px(ctx, x, y, 1, 1, C.goldDark);
  }
  for (const [x, y] of NEON.far) px(ctx, x, y, 1, 1, C.pink, 0.16);
  for (const [x, y] of NEON.near) px(ctx, x, y, 1, 1, C.pink, 0.5);
  for (const [x, y, lit] of NEON.core) px(ctx, x, y, 1, 1, lit ? '#ffe3f0' : '#ff8cc2');
}


function drawWall(ctx) {
  px(ctx, 0, 0, W, FLOOR_Y, C.lac);
  const step = 24;
  for (let x = 12; x < W; x += step) {
    vline(ctx, x, 0, 88, C.lattice);
    vline(ctx, x + 1, 0, 88, C.lacDeep, 0.6);
  }
  for (let y = 18; y < 88; y += step) {
    hline(ctx, 0, y, W, C.lattice);
    hline(ctx, 0, y + 1, W, C.lacDeep, 0.6);
  }
  for (let x = 12; x < W; x += step) {
    for (let y = 18; y < 88; y += step) {
      for (const [dx, dy] of [[-2, -2], [1, -2], [-2, 1], [1, 1]]) {
        px(ctx, x + dx, y + dy, 2, 2, C.goldDark);
        px(ctx, x + dx + (dx < 0 ? 0 : 1), y + dy + (dy < 0 ? 0 : 1), 1, 1, C.gold);
      }
    }
  }
  [0.55, 0.42, 0.3, 0.2, 0.12, 0.06].forEach((a, i) => px(ctx, 0, i * 7, W, 7, C.ink, a));
  px(ctx, 0, 0, W, 3, C.ink);
  hline(ctx, 0, 3, W, C.goldDeep);
  hline(ctx, 0, 4, W, C.ink, 0.5);

  hline(ctx, 0, 87, W, C.ink, 0.6);
  hline(ctx, 0, 88, W, C.goldDark);
  hline(ctx, 0, 89, W, C.gold, 0.7);
  hline(ctx, 0, 90, W, C.goldDeep);
  px(ctx, 0, 91, W, 22, C.lacDark);
  for (let x = 4; x < W; x += 22) {
    frame(ctx, x, 94, 18, 16, C.goldDeep, 0.8);
    hline(ctx, x + 1, 95, 16, C.lac, 0.7);
  }
  px(ctx, 0, 113, W, 3, C.ink);
  hline(ctx, 0, 113, W, C.woodDark);
}

function drawFloor(ctx) {
  px(ctx, 0, FLOOR_Y, W, H - FLOOR_Y, C.floor);
  const bands = [116, 118, 121, 125, 130, 136, 143, 151, 160, 170, 181];
  for (let i = 0; i < bands.length - 1; i++) {
    const y = bands[i];
    const h = bands[i + 1] - y;
    px(ctx, 0, y, W, h, i % 2 ? C.floor : C.floorLight);
    hline(ctx, 0, y, W, C.ink, 0.7);
    let x = Math.floor(hash(i * 13) * 40) - 20;
    while (x < W) {
      vline(ctx, x, y + 1, h - 1, C.ink, 0.55);
      x += 34 + Math.floor(hash(i * 13 + x) * 30);
    }
    for (let g = 0; g < 6; g++) {
      const gx = Math.floor(hash(i * 97 + g) * W);
      const gy = y + 1 + Math.floor(hash(i * 97 + g + 50) * Math.max(1, h - 1));
      hline(ctx, gx, gy, 3 + Math.floor(hash(g + i) * 8), C.woodLight, 0.35);
    }
  }
}


function drawWindow(ctx, win) {
  const { x, y, w, h, seed } = win;
  px(ctx, x - 3, y - 3, w + 6, h + 6, C.ink);
  px(ctx, x - 2, y - 2, w + 4, h + 4, C.woodLight);
  frame(ctx, x - 1, y - 1, w + 2, h + 2, C.goldDark);
  hline(ctx, x - 2, y - 2, w + 4, C.gold, 0.6);

  const rows = [[C.nightDeep, 0], [C.night, 0.3], ['#141c33', 0.6], [C.nightHaze, 0.8]];
  rows.forEach(([c, k], i) => {
    const y0 = y + Math.round(h * k);
    const y1 = i + 1 < rows.length ? y + Math.round(h * rows[i + 1][1]) : y + h;
    px(ctx, x, y0, w, y1 - y0, c);
    if (i > 0) dither(ctx, x, y0 - 2, w, 2, c, 1, i);
  });
  for (let i = 0; i < 6; i++) {
    px(ctx, x + Math.floor(hash(seed + i * 3) * w), y + 1 + Math.floor(hash(seed + i * 5) * h * 0.3), 1, 1, C.cream, 0.35);
  }
  let bx = x;
  let b = 0;
  while (bx < x + w) {
    const bw = Math.min(4 + Math.floor(hash(seed * 7 + b) * 6), x + w - bx);
    const bh = Math.floor(h * (0.25 + hash(seed * 11 + b) * 0.35));
    const by = y + h - bh;
    px(ctx, bx, by, bw, bh, '#0a0f1d');
    hline(ctx, bx, by, bw, '#1a2340');
    for (let wy = by + 2; wy < y + h - 1; wy += 3) {
      for (let wx = bx + 1; wx < bx + bw - 1; wx += 2) {
        const r = hash(seed * 31 + wx * 7 + wy * 13);
        if (r < 0.32) px(ctx, wx, wy, 1, 1, r < 0.08 ? C.pink : r < 0.14 ? C.blueLight : C.light, 0.75);
      }
    }
    bx += bw + (hash(seed + b * 17) < 0.3 ? 1 : 0);
    b++;
  }
  const bokeh = [C.light, C.pink, C.blue, C.light, C.mint, C.orange];
  for (let i = 0; i < 6; i++) {
    const cx = x + 2 + Math.floor(hash(seed * 3 + i * 41) * (w - 4));
    const cy = y + Math.floor(h * (0.35 + hash(seed * 5 + i * 43) * 0.5));
    const c = bokeh[(seed + i) % bokeh.length];
    ellipse(ctx, cx, cy, 2, 2, c, 0.18);
    ellipse(ctx, cx, cy, 1, 1, c, 0.25);
    px(ctx, cx, cy, 1, 1, c, 0.5);
  }
  for (let i = 0; i < h; i += 1) {
    const rx = x + Math.round(w * 0.65) - Math.round(i * 0.5);
    if (rx >= x && rx < x + w) px(ctx, rx, y + i, 2, 1, C.cream, 0.05);
  }

  const mx = x + Math.floor(w / 2);
  const my = y + Math.floor(h * 0.42);
  vline(ctx, mx, y, h, C.woodLight);
  hline(ctx, x, my, w, C.woodLight);
  px(ctx, mx, my, 1, 1, C.gold);
  vline(ctx, mx + 1, y, h, C.ink, 0.35);
  hline(ctx, x, my + 1, w, C.ink, 0.35);

  px(ctx, x - 4, y + h + 3, w + 8, 1, C.gold);
  px(ctx, x - 4, y + h + 4, w + 8, 2, C.woodLight);
  hline(ctx, x - 4, y + h + 6, w + 8, C.ink, 0.8);
  hline(ctx, x - 3, y + h + 7, w + 6, C.ink, 0.35);
}


function drawStage(ctx) {
  const cx = [C.velvetDark, C.velvet, C.velvetLight, C.velvet, C.velvetDark, C.velvet, C.velvetLight, C.velvetLight, C.velvet, C.velvetDark, C.ink];
  for (let y = 4; y < 126; y++) {
    const flare = y < 72 ? 0 : Math.min(4, Math.floor((y - 72) / 10));
    const tie = y >= 66 && y < 76 ? -1 - Math.min(y - 66, 75 - y) / 3 : 0;
    const width = cx.length + flare + Math.round(tie);
    for (let i = 0; i < width; i++) {
      const src = Math.floor((i * cx.length) / width);
      px(ctx, i, y, 1, 1, cx[src]);
    }
  }
  sprite(ctx, 0, 67, ['GGGGGGGG', 'gGGGGGGGG', '.gggggggg'], { G: C.gold, g: C.goldDark });
  sprite(ctx, 7, 70, ['.g.', '.G.', 'GgG', 'GgG', 'g.g'], { G: C.gold, g: C.goldDark });

  px(ctx, 0, 4, 78, 6, C.velvet);
  hline(ctx, 0, 4, 78, C.velvetDark);
  hline(ctx, 0, 6, 78, C.velvetLight, 0.6);
  for (let x = 0; x < 78; x += 8) {
    sprite(ctx, x, 10, ['VVVVVVVV', '.VVVVVV.', '..vvvv..'], { V: C.velvet, v: C.velvetDark });
    px(ctx, x + 3, 13, 2, 1, C.gold);
    px(ctx, x + 3, 14, 2, 1, C.goldDark);
  }
  hline(ctx, 0, 10, 78, C.gold);
  hline(ctx, 0, 9, 78, C.goldDark);

  sprite(ctx, 66, 14, ['.kkkk.', 'kgGGgk', 'kgggGk', '.kkkk.', '..yy..'], { k: C.ink, g: C.goldDeep, G: C.goldDark, y: C.light });

  px(ctx, 0, 109, 76, 4, C.woodLight);
  hline(ctx, 0, 109, 76, C.brass, 0.5);
  for (let x = 6; x < 76; x += 11) vline(ctx, x, 110, 3, C.wood);
  hline(ctx, 0, 113, 76, C.gold);
  px(ctx, 0, 114, 76, 12, C.lacDark);
  hline(ctx, 0, 125, 76, C.goldDeep);
  for (let x = 5; x < 72; x += 9) {
    px(ctx, x, 116, 3, 2, C.light);
    px(ctx, x + 1, 116, 1, 1, C.cream);
    px(ctx, x - 1, 115, 5, 4, C.light, 0.15);
    px(ctx, x, 118, 3, 1, C.goldDeep);
  }
  for (let x = 2; x < 76; x += 10) frame(ctx, x, 120, 8, 4, C.lac);
  vline(ctx, 76, 109, 17, C.ink);
  px(ctx, 0, 126, 78, 2, C.ink, 0.5);

  vline(ctx, 69, 84, 24, C.goldDark);
  vline(ctx, 70, 84, 24, C.ink, 0.4);
  sprite(ctx, 67, 107, ['.kkk.', 'kkkkk'], { k: C.ink });
  sprite(ctx, 68, 79, ['.mm.', 'mMmm', 'mmmm', '.kk.', '..g.'], { m: C.muteDark, M: C.cream, k: C.ink, g: C.goldDark });
}

function drawPoster(ctx) {
  const { x, y, w, h } = R.poster;
  px(ctx, x + 2, y + h, w - 1, 1, C.ink, 0.5);
  px(ctx, x + w, y + 2, 1, h - 1, C.ink, 0.5);
  frame(ctx, x, y, w, h, C.ink);
  frame(ctx, x + 1, y + 1, w - 2, h - 2, C.gold);
  hline(ctx, x + 1, y + 1, w - 2, C.brass);
  frame(ctx, x + 2, y + 2, w - 4, h - 4, C.goldDeep);
  const px0 = x + 3;
  const py0 = y + 3;
  const pw = w - 6;
  const ph = h - 6;
  px(ctx, px0, py0, pw, ph, C.cream);
  dither(ctx, px0, py0 + ph - 2, pw, 2, C.creamDark);
  dither(ctx, px0 + pw - 2, py0, 2, ph, C.creamDark, 1, 1);
  px(ctx, px0, py0, pw, 2, C.pink);
  const title = 'MAÎTRE';
  const tw = text3Width(title);
  text3(ctx, px0 + Math.floor((pw - tw) / 2), py0 + 6, title, C.lac);
  const cx = px0 + Math.floor(pw / 2);
  const cy = py0 + 22;
  ellipse(ctx, cx, cy, 10, 10, C.pinkLight);
  ellipse(ctx, cx, cy, 7, 7, C.pink, 0.55);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    px(ctx, cx + Math.round(Math.cos(a) * 12), cy + Math.round(Math.sin(a) * 12), 1, 1, C.pink, 0.7);
  }
  vline(ctx, cx, py0 + 10, 3, C.ink);
  sprite(ctx, cx - 4, py0 + 13, [
    '..gGGg...',
    '.rRRRRr..',
    'rRRYYRRr.',
    'rROYYORr.',
    'rROYYORr.',
    'rROYYORr.',
    'rRRYYRRr.',
    '.rRRRRr..',
    '..gGGg...',
    '...rr....',
    '...r.r...',
  ], { g: C.goldDark, G: C.gold, r: C.redDark, R: C.red, O: C.orange, Y: C.light });
  hline(ctx, px0 + 4, py0 + ph - 9, pw - 8, C.pinkDark);
  hline(ctx, px0 + 6, py0 + ph - 6, pw - 12, C.mute);
  hline(ctx, px0 + 8, py0 + ph - 4, pw - 16, C.mute, 0.7);
  px(ctx, x + Math.floor(w / 2) - 1, y - 2, 2, 1, C.goldDark);
  px(ctx, x + Math.floor(w / 2) - 1, y - 1, 2, 1, C.ink);
}


function drawDiploma(ctx) {
  const { x, y, w, h } = R.diploma;
  const nail = x + Math.floor(w / 2);
  px(ctx, nail, y - 4, 1, 1, C.gold);
  px(ctx, nail - 1, y - 3, 1, 1, C.goldDeep);
  px(ctx, nail + 1, y - 3, 1, 1, C.goldDeep);
  px(ctx, nail - 3, y - 2, 2, 1, C.goldDeep);
  px(ctx, nail + 2, y - 2, 2, 1, C.goldDeep);
  px(ctx, x + 2, y + h, w - 1, 1, C.ink, 0.5);
  px(ctx, x + w, y + 2, 1, h - 1, C.ink, 0.5);
  frame(ctx, x, y, w, h, C.ink);
  frame(ctx, x + 1, y + 1, w - 2, h - 2, C.woodLight);
  frame(ctx, x + 2, y + 2, w - 4, h - 4, C.gold);
  hline(ctx, x + 1, y + 1, w - 2, C.wood);
  const px0 = x + 3;
  const py0 = y + 3;
  const pw = w - 6;
  const ph = h - 6;
  px(ctx, px0, py0, pw, ph, C.cream);
  frame(ctx, px0 + 1, py0 + 1, pw - 2, ph - 2, C.creamDark);
  hline(ctx, px0 + 5, py0 + 3, pw - 10, C.lac);
  hline(ctx, px0 + 4, py0 + 6, pw - 8, C.mute);
  hline(ctx, px0 + 5, py0 + 8, pw - 10, C.mute);
  sprite(ctx, px0 + 3, py0 + ph - 4, ['.ii.i', 'i..i.'], { i: C.ink });
  sprite(ctx, px0 + pw - 7, py0 + ph - 6, ['.rr.', 'rRRr', 'rRRr', '.rr.', 'p..p', 'p..p'], { r: C.redDark, R: C.red, p: C.pink });
}

function drawChalkboard(ctx) {
  const { x, y, w, h } = R.chalkboard;
  px(ctx, x + 2, y + h, w - 1, 1, C.ink, 0.5);
  px(ctx, x + w, y + 2, 1, h - 3, C.ink, 0.5);
  frame(ctx, x, y, w, h - 3, C.ink);
  px(ctx, x + 1, y + 1, w - 2, h - 5, C.woodLight);
  hline(ctx, x + 1, y + 1, w - 2, C.mute, 0.6);
  vline(ctx, x + 1, y + 1, h - 5, C.mute, 0.35);
  hline(ctx, x + 1, y + h - 5, w - 2, C.wood);
  const sx = x + 3;
  const sy = y + 3;
  const sw = w - 6;
  const sh = h - 9;
  frame(ctx, sx - 1, sy - 1, sw + 2, sh + 2, C.woodDark);
  px(ctx, sx, sy, sw, sh, C.slate);
  for (let i = 0; i < 18; i++) {
    const ux = sx + Math.floor(hash(i * 17 + 3) * (sw - 6));
    const uy = sy + Math.floor(hash(i * 19 + 5) * (sh - 3));
    dither(ctx, ux, uy, 4 + Math.floor(hash(i) * 5), 2, C.slateLight, 1, i);
  }
  const chalk = C.cream;
  const title = 'SPECIALS';
  text3(ctx, sx + Math.floor((sw - text3Width(title)) / 2), sy + 2, title, chalk, 0.9);
  hline(ctx, sx + 5, sy + 8, sw - 10, C.pink, 0.75);
  const lines = [[0, 22], [1, 16], [0, 19], [1, 13]];
  lines.forEach(([style, len], i) => {
    const ly = sy + 11 + i * 4;
    px(ctx, sx + 2, ly, 1, 1, style ? C.mint : C.light, 0.9);
    let cx = sx + 5;
    let k = 0;
    while (cx < sx + 5 + len) {
      const seg = 2 + Math.floor(hash(i * 31 + k) * 4);
      hline(ctx, cx, ly, Math.min(seg, sx + 5 + len - cx), chalk, 0.72);
      if (hash(i * 7 + k) < 0.4) px(ctx, cx + 1, ly - 1, 1, 1, chalk, 0.5);
      cx += seg + 1;
      k++;
    }
    for (let d = 0; d < 3; d++) px(ctx, sx + sw - 9 + d * 2, ly, 1, 1, chalk, 0.4);
    px(ctx, sx + sw - 3, ly - 1, 1, 2, C.light, 0.8);
  });
  sprite(ctx, sx + sw - 8, sy + sh - 6, ['..x..', 'xxxxx', '.xxx.', 'x...x'], { x: C.light }, 0.85);
  hline(ctx, sx + 2, sy + sh - 2, 8, C.pink, 0.5);
  px(ctx, sx + 10, sy + sh - 3, 1, 1, C.pink, 0.5);

  const ly = y + h - 4;
  px(ctx, x - 1, ly, w + 2, 2, C.woodLight);
  hline(ctx, x - 1, ly, w + 2, C.mute, 0.6);
  hline(ctx, x - 1, ly + 2, w + 2, C.ink);
  hline(ctx, x, ly + 3, w, C.ink, 0.4);
  px(ctx, x + 6, ly - 1, 4, 1, C.cream);
  px(ctx, x + 12, ly - 1, 3, 1, C.pink);
  px(ctx, x + w - 10, ly - 1, 5, 1, C.slateLight);

  hline(ctx, x + 2, 71, w - 4, C.goldDark);
  hline(ctx, x + 2, 72, w - 4, C.ink, 0.5);
  for (let i = 0; i < 6; i++) {
    const gx = x + 4 + i * 7;
    sprite(ctx, gx, 73, ['ggg', '.g.', '.g.', 'gHg', 'g.g', '.g.'], { g: C.creamDark, H: C.cream }, 0.7);
  }
}

const BOTTLE_TINTS = {
  green: [C.mintDark, '#3fa877', C.mintLight],
  amber: ['#8a4a12', '#d98a2b', C.light],
  rose: [C.pinkDark, C.pink, C.pinkLight],
  blue: [C.blueDark, C.blue, C.blueLight],
  clear: ['#6e6a60', '#b8b09c', C.cream],
  wine: ['#2e0b10', '#5e1820', '#b04050'],
  rum: ['#2a160c', '#5a3018', '#c08a4a'],
};

const BOTTLES = (() => {
  const plan = [
    ['green', 6, 10, 5, 'g'], ['amber', 5, 7, 3, 'k'], ['clear', 4, 8, 4, 'g'], ['wine', 5, 9, 5, 'k'],
    ['rose', 4, 6, 3, 'g'], ['blue', 6, 8, 4, 'g'], ['rum', 5, 7, 4, 'k'],
    ['amber', 6, 6, 2, 'g'], ['wine', 4, 9, 5, 'g'], ['green', 5, 7, 4, 'k'], ['clear', 6, 9, 3, 'g'],
    ['rose', 5, 8, 4, 'g'], ['rum', 4, 6, 3, 'k'], ['blue', 5, 10, 4, 'g'],
    ['clear', 5, 7, 4, 'k'], ['amber', 4, 9, 4, 'g'], ['green', 6, 8, 3, 'g'], ['rose', 4, 7, 4, 'k'],
    ['wine', 6, 6, 4, 'g'], ['blue', 4, 8, 3, 'g'], ['rum', 5, 9, 5, 'g'],
  ];
  const out = [];
  let i = 0;
  for (const plank of SHELF.planks) {
    let x = SHELF.x + 3;
    while (x < SHELF.x + SHELF.w - 6 && i < plan.length) {
      const [tint, w, body, neck, cap] = plan[i];
      if (x + w > SHELF.x + SHELF.w - 2) break;
      out.push({ x, base: plank - 1, tint, w, body, neck, cap });
      x += w + 1 + (hash(i * 5) < 0.3 ? 1 : 0);
      i++;
    }
  }
  return out;
})();

function drawBottle(ctx, b) {
  const [dark, mid, lite] = BOTTLE_TINTS[b.tint];
  const top = b.base - b.body + 1;
  px(ctx, b.x - 1, top, b.w + 2, b.body, C.ink, 0.6);
  px(ctx, b.x, top, b.w, b.body, mid);
  vline(ctx, b.x + b.w - 1, top, b.body, dark);
  vline(ctx, b.x, top + 1, b.body - 1, dark, 0.5);
  vline(ctx, b.x + 1, top + 1, b.body - 3, lite, 0.85);
  hline(ctx, b.x + 1, top, b.w - 2, mid);
  px(ctx, b.x, top, 1, 1, C.ink, 0.6);
  px(ctx, b.x + b.w - 1, top, 1, 1, C.ink, 0.6);
  if (b.body >= 7) {
    px(ctx, b.x, top + Math.floor(b.body / 2) - 1, b.w, 3, C.cream);
    hline(ctx, b.x, top + Math.floor(b.body / 2), b.w, b.tint === 'rose' ? C.lac : C.pink, 0.7);
    vline(ctx, b.x + b.w - 1, top + Math.floor(b.body / 2) - 1, 3, C.creamDark);
  }
  const nx = b.x + Math.floor((b.w - 2) / 2);
  px(ctx, nx, top - b.neck, 2, b.neck, dark);
  px(ctx, nx, top - b.neck, 1, b.neck, mid);
  px(ctx, nx, top - b.neck - 1, 2, 2, b.cap === 'g' ? C.gold : C.ink);
  if (b.cap === 'g') px(ctx, nx, top - b.neck - 1, 1, 1, C.brass);
}

function drawShelves(ctx) {
  const s = SHELF;
  px(ctx, s.x - 2, s.y - 2, s.w + 4, s.h + 15, C.ink);
  frame(ctx, s.x - 1, s.y - 1, s.w + 2, s.h + 13, C.goldDark);
  px(ctx, s.x, s.y, s.w, s.h + 11, '#1d1414');
  for (let i = 0; i < 3; i++) {
    const ox = s.x + 8 + i * 17;
    for (let j = 0; j < s.h + 11; j++) {
      const rx = ox + Math.floor(j * 0.4);
      if (rx < s.x + s.w - 1) px(ctx, rx, s.y + j, 2, 1, C.cream, 0.05);
    }
  }
  for (const b of BOTTLES) drawBottle(ctx, b);
  for (const y of s.planks) {
    hline(ctx, s.x, y, s.w, C.brass);
    hline(ctx, s.x, y + 1, s.w, C.woodLight);
    hline(ctx, s.x, y + 2, s.w, C.ink, 0.6);
  }
  px(ctx, s.x, 85, s.w, 13, C.wood);
  hline(ctx, s.x, 85, s.w, C.woodLight);
  for (let x = s.x + 2; x < s.x + s.w - 2; x += 16) {
    frame(ctx, x, 87, 14, 10, C.woodDark);
    px(ctx, x + 6, 91, 2, 1, C.gold);
  }

  px(ctx, 125, 77, s.x - 125 - 2, 21, C.wood);
  hline(ctx, 125, 77, s.x - 127, C.woodLight);
  hline(ctx, 125, 78, s.x - 127, C.gold, 0.5);
  vline(ctx, 124, 77, 21, C.ink);
  for (let x = 128; x < s.x - 6; x += 16) {
    frame(ctx, x, 81, 13, 16, C.woodDark);
    px(ctx, x + 6, 88, 1, 2, C.gold);
  }
}


function drawCounter(ctx) {
  const { x, y, w, front, bottom } = COUNTER;
  px(ctx, x - 1, y - 1, w + 2, bottom - y + 2, C.ink);
  hline(ctx, x, y, w, C.brass);
  px(ctx, x, y + 1, w, 2, C.woodLight);
  for (let i = 0; i < 12; i++) {
    const gx = x + Math.floor(hash(i * 3 + 400) * (w - 10));
    hline(ctx, gx, y + 1 + (i & 1), 4 + Math.floor(hash(i) * 8), C.wood, 0.7);
  }
  hline(ctx, x, y + 3, w, C.woodDark);
  px(ctx, x + 1, front, w - 2, bottom - front, C.woodRed);
  hline(ctx, x + 1, front, w - 2, C.lacLight);
  hline(ctx, x + 1, front + 1, w - 2, C.ink, 0.35);
  const panelW = 24;
  for (let px0 = x + 5; px0 + panelW <= x + w - 3; px0 += panelW + 3) {
    frame(ctx, px0, front + 4, panelW, 16, C.goldDeep);
    hline(ctx, px0 + 1, front + 5, panelW - 2, C.gold, 0.35);
    px(ctx, px0 + 1, front + 6, panelW - 2, 13, C.lac, 0.55);
    for (let g = 0; g < 4; g++) {
      const gy = front + 7 + g * 3;
      let gx = px0 + 2 + Math.floor(hash(px0 + g) * 4);
      while (gx < px0 + panelW - 3) {
        const len = 3 + Math.floor(hash(gx * 7 + g) * 6);
        hline(ctx, gx, gy + (hash(gx + g) < 0.3 ? 1 : 0), Math.min(len, px0 + panelW - 2 - gx), C.lacDark, 0.8);
        gx += len + 2;
      }
    }
  }
  px(ctx, x + 1, bottom - 5, w - 2, 5, C.lacDeep);
  hline(ctx, x + 1, bottom - 5, w - 2, C.goldDeep);
  for (let bx = x + 8; bx < x + w - 4; bx += 21) {
    vline(ctx, bx, bottom - 9, 4, C.goldDark);
  }
  hline(ctx, x - 2, bottom - 10, w + 4, C.brass);
  hline(ctx, x - 2, bottom - 9, w + 4, C.goldDark);
  hline(ctx, x - 2, bottom - 8, w + 4, C.ink, 0.5);
  px(ctx, x - 1, bottom + 1, w + 2, 2, C.ink, 0.5);
}

function drawTray(ctx) {
  const { x, y, w, h } = R.tray;
  const base = y + h - 3;
  px(ctx, x, base, w, 3, C.woodLight);
  hline(ctx, x, base, w, C.brass);
  hline(ctx, x + 1, base + 2, w - 2, C.wood);
  vline(ctx, x, base, 3, C.ink);
  vline(ctx, x + w - 1, base, 3, C.ink);
  const liquids = [['#d98a2b', C.light], [C.pink, C.pinkLight], [C.mint, C.mintLight]];
  const glass = ['g....g', 'g....g', 'gLLLHg', 'gLLLLg', '.gLLg.', '..gg..', '..ss..', '..ss..', '.ssss.'];
  liquids.forEach(([liq, hi], i) => {
    const gx = x + 3 + i * 9;
    sprite(ctx, gx, base - glass.length, glass, { g: C.creamDark, s: C.creamDark, L: liq, H: hi });
    px(ctx, gx + 1, base - glass.length, 1, 2, C.cream, 0.6);
  });
}

function drawBell(ctx) {
  const { x, y } = R.bell;
  sprite(ctx, x, y, [
    '......kkk......',
    '......kGk......',
    '.......k.......',
    '.....oooo......',
    '....oLLGGo.....',
    '...oLLGGGGo....',
    '..oLGGGGGGdo...',
    '..oLGGGGGGdo...',
    '.oLGGGGGGGGdo..',
    '.oGGGGGGGGGdo..',
    'oddddddddddddo.',
    'bBBBBBBBBBBBBBb',
    'kkkkkkkkkkkkkkk',
  ], { k: C.ink, o: C.ink, G: C.gold, L: C.brass, d: C.goldDark, b: '#3a2418', B: '#5a3a26' });
}

function drawCup(ctx) {
  const { x, y } = CUP;
  sprite(ctx, x, y, [
    'occcccco...',
    'ocKKKKKco..',
    'ocCCCCCcoo.',
    'ocCCCCCc.o.',
    'ocCCCCCc.o.',
    '.ocCCCco.o.',
    '..occco....',
    'sssssssss..',
    '.SSSSSSS...',
  ], { o: C.ink, c: C.creamDark, C: C.cream, K: '#3a1a0e', s: C.cream, S: C.creamDark });
  px(ctx, x + 2, y + 2, 1, 3, '#ffffff', 0.7);
}

function drawStools(ctx) {
  for (const sx of [148, 190, 232]) {
    const top = 112;
    px(ctx, sx - 7, 142, 14, 2, C.ink, 0.45);
    sprite(ctx, sx - 6, top, [
      '..oooooooo..',
      '.oRRRRRRRRo.',
      'oRrrRRRRRRro',
      'GGGGGGGGGGGG',
      '.dddddddddd.',
    ], { o: C.ink, R: C.red, r: '#e0503a', G: C.gold, d: C.goldDeep });
    px(ctx, sx - 1, top + 5, 2, 23, C.goldDark);
    vline(ctx, sx - 1, top + 5, 23, C.brass, 0.7);
    hline(ctx, sx - 4, top + 19, 8, C.gold);
    hline(ctx, sx - 4, top + 20, 8, C.goldDeep);
    sprite(ctx, sx - 5, top + 28, ['..gggggg..', 'gGGGGGGGGg', '.kkkkkkkk.'], { g: C.goldDark, G: C.gold, k: C.ink });
  }
}


function drawJukebox(ctx) {
  const { x, y, w, h } = R.jukebox;
  const insets = [11, 8, 6, 5, 4, 3, 2, 2, 1, 1, 1, 0];
  const rowInset = (j) => (j < insets.length ? insets[j] : 0);
  px(ctx, x + 2, y + h, w - 2, 2, C.ink, 0.5);
  for (let j = 0; j < h; j++) {
    const ins = rowInset(j);
    px(ctx, x + ins, y + j, w - ins * 2, 1, C.ink);
    if (j > 0 && j < h - 1) {
      const ii = ins + 1;
      px(ctx, x + ii, y + j, w - ii * 2, 1, '#6a2a18');
      px(ctx, x + ii, y + j, 2, 1, '#8a3a20');
      px(ctx, x + w - ii - 2, y + j, 2, 1, C.woodRed);
    }
  }
  for (const [p, i] of JUKE_ARCH) px(ctx, p[0], p[1], 1, 1, i % 2 ? C.pinkDark : '#7a2a4a');
  sprite(ctx, x + w / 2 - 3, y + 1, ['..GG..', '.GLLG.', 'GG..GG'], { G: C.gold, L: C.brass });

  const wx = x + 9;
  const wy = y + 9;
  const ww = w - 18;
  px(ctx, wx - 1, wy - 1, ww + 2, 17, C.goldDark);
  px(ctx, wx, wy, ww, 15, C.ink);
  hline(ctx, wx, wy, ww, '#2a1a1a');
  ellipse(ctx, wx + ww / 2, wy + 10, 6, 2, '#2a2422');
  hline(ctx, wx + ww / 2 - 5, wy + 10, 11, '#3a3330');
  px(ctx, wx + ww / 2 - 1, wy + 10, 3, 1, C.pink);
  vline(ctx, wx + ww - 3, wy + 3, 6, C.gold);
  px(ctx, wx + ww - 5, wy + 8, 3, 1, C.gold);
  px(ctx, wx + 1, wy + 1, 1, 4, C.cream, 0.2);

  const ty = y + 26;
  px(ctx, x + 7, ty, w - 14, 5, C.goldDark);
  px(ctx, x + 8, ty + 1, w - 16, 3, C.cream);
  for (let i = 0; i < 4; i++) {
    hline(ctx, x + 9 + i * 4, ty + 2, 3, C.lac, 0.7);
  }
  for (let i = 0; i < 8; i++) px(ctx, x + 8 + i * 2, ty + 6, 1, 1, i % 2 ? C.gold : C.cream);

  const gy = y + 34;
  px(ctx, x + 7, gy, w - 14, 15, C.goldDark);
  px(ctx, x + 8, gy + 1, w - 16, 13, C.lacDeep);
  for (let j = 0; j < 13; j++) {
    for (let i = 0; i < w - 16; i++) {
      if ((i + j) % 4 === 0 || (i - j + 64) % 4 === 0) px(ctx, x + 8 + i, gy + 1 + j, 1, 1, C.goldDeep);
    }
  }
  sprite(ctx, x + w / 2 - 2, gy + 5, ['.GG.', 'GLLG', 'GLLG', '.GG.'], { G: C.gold, L: C.light });

  vline(ctx, x + 6, y + 9, 41, C.gold, 0.6);
  vline(ctx, x + w - 7, y + 9, 41, C.gold, 0.6);
  px(ctx, x + 2, y + 50, w - 4, 6, C.woodDark);
  hline(ctx, x + 2, y + 50, w - 4, C.gold);
  hline(ctx, x + 2, y + 51, w - 4, C.goldDeep);
  px(ctx, x + 3, y + h - 2, 4, 2, C.ink);
  px(ctx, x + w - 7, y + h - 2, 4, 2, C.ink);
}

const JUKE_ARCH = (() => {
  const { x, y, w } = R.jukebox;
  const pts = [];
  const cx = x + w / 2;
  const rx = w / 2 - 3;
  const top = y + 3;
  const ry = 12;
  const left = [];
  const right = [];
  for (let j = 0; j <= ry; j++) {
    const dy = ry - j;
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    left.push([Math.floor(cx) - half, top + j]);
    left.push([Math.floor(cx) - half + 1, top + j]);
    right.push([Math.ceil(cx) - 1 + half, top + j]);
    right.push([Math.ceil(cx) - 2 + half, top + j]);
  }
  for (let j = top + ry + 1; j < y + 48; j++) {
    left.push([x + 3, j], [x + 4, j]);
    right.push([x + w - 4, j], [x + w - 5, j]);
  }
  const seen = new Set();
  const add = (p) => {
    const k = `${p[0]},${p[1]}`;
    if (!seen.has(k)) { seen.add(k); pts.push(p); }
  };
  left.forEach(add);
  right.forEach(add);
  return pts.map((p) => {
    const s = Math.abs(p[1] - (y + 48)) + Math.abs(p[0] - cx) * 0.5;
    return [p, Math.floor(s / 4)];
  });
})();

function drawDoor(ctx) {
  const { x, y, w, h } = R.door;
  px(ctx, x, y, w, h, C.ink);
  px(ctx, x + 1, y + 1, w - 2, h - 1, C.woodLight);
  vline(ctx, x + 2, y + 2, h - 2, C.gold, 0.5);
  vline(ctx, x + w - 3, y + 2, h - 2, C.goldDeep);
  const lx = x + 3;
  const ly = y + 3;
  const lw = w - 6;
  const lh = h - 3;
  px(ctx, lx, ly, lw, lh, '#2a120b');
  vline(ctx, lx, ly, lh, C.ink, 0.6);
  hline(ctx, lx, ly, lw, C.ink, 0.6);
  const ox = lx + Math.floor(lw / 2);
  const oy = ly + 12;
  ellipse(ctx, ox, oy, 6, 6, C.ink);
  ellipse(ctx, ox, oy, 5, 5, C.gold);
  ellipse(ctx, ox, oy, 4, 4, C.night);
  px(ctx, ox - 2, oy + 1, 5, 3, C.nightHaze);
  px(ctx, ox + 1, oy - 1, 1, 1, C.light, 0.8);
  ellipse(ctx, ox + 1, oy - 1, 1, 1, C.light, 0.2);
  px(ctx, ox - 2, oy - 3, 1, 2, C.cream, 0.35);
  frame(ctx, lx + 2, ly + 24, lw - 4, 26, C.goldDeep);
  hline(ctx, lx + 3, ly + 25, lw - 6, C.woodLight, 0.4);
  frame(ctx, lx + 2, ly + 53, lw - 4, 14, C.goldDeep);
  hline(ctx, lx + 3, ly + 54, lw - 6, C.woodLight, 0.4);
  px(ctx, lx + lw - 4, ly + 37, 2, 9, C.ink);
  vline(ctx, lx + lw - 4, ly + 38, 7, C.gold);
  px(ctx, lx + lw - 4, ly + 38, 1, 2, C.brass);
  px(ctx, lx + 1, y + h - 5, lw - 2, 4, C.goldDark);
  hline(ctx, lx + 1, y + h - 5, lw - 2, C.brass);
  hline(ctx, x + 3, y + h - 1, w - 6, C.light, 0.6);
  ellipse(ctx, x + w / 2, y + h + 1, 14, 1, C.light, 0.12);

  const sw = text3Width('EXIT') + 4;
  const sx = x + Math.floor((w - sw) / 2);
  const sy = y - 10;
  glow(ctx, sx + sw / 2, sy + 4, 18, 9, C.mint, 0.04, 3);
  px(ctx, sx - 1, sy - 1, sw + 2, 9, C.ink);
  px(ctx, sx, sy, sw, 7, '#0c1a14');
  frame(ctx, sx, sy, sw, 7, C.mintDark);
  text3(ctx, sx + 2, sy + 1, 'EXIT', C.mintLight);
  px(ctx, sx + 1, sy + 1, sw - 2, 5, C.mint, 0.15);
  vline(ctx, sx + 3, sy - 3, 2, C.goldDeep);
  vline(ctx, sx + sw - 4, sy - 3, 2, C.goldDeep);
}


function drawTable(ctx) {
  const m = R.menu;
  ellipse(ctx, 53, 172, 18, 2, C.ink, 0.5);
  sprite(ctx, 24, 146, [
    '......wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww......',
    '..WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW..',
    'oGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGo',
    '.ddddddddddddddddddddddddddddddddddddddddddddddddddd..',
    '....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk....',
  ], { w: C.woodLight, W: C.wood, G: C.gold, o: C.ink, d: C.goldDeep, k: C.ink });
  hline(ctx, 32, 146, 36, C.light, 0.25);
  px(ctx, 50, 151, 5, 17, C.woodDark);
  vline(ctx, 51, 151, 17, C.woodLight);
  vline(ctx, 54, 151, 17, C.ink, 0.6);
  sprite(ctx, 40, 167, ['......gGGGGg......', '..gggGGGGGGGGggg..', 'kkkkkkkkkkkkkkkkkk'], { g: C.goldDeep, G: C.goldDark, k: C.ink });

  const cx = m.x + 2;
  const cy = m.y + 3;
  const cw = m.w - 4;
  const ch = m.h - 5;
  sprite(ctx, cx + cw - 1, cy + 1, ['d.', 'dd', 'dd', 'dd', 'dd', 'dd', 'dd', 'dd', 'dd', 'dd', 'dd', 'dd', 'dd', 'dd', 'd.'], { d: C.creamDeep });
  px(ctx, cx - 1, cy - 1, cw + 1, ch + 2, C.ink);
  px(ctx, cx, cy, cw - 1, ch, C.cream);
  frame(ctx, cx + 1, cy + 1, cw - 3, ch - 2, C.gold);
  text3(ctx, cx + Math.floor((cw - 1 - text3Width('MENU')) / 2), cy + 3, 'MENU', C.pinkDark);
  for (let i = 0; i < 3; i++) {
    const ly = cy + 10 + i * 2;
    hline(ctx, cx + 3, ly, 8 - (i % 2) * 2, C.muteDark);
    for (let d = 0; d < 3; d++) px(ctx, cx + 13 + d * 2, ly, 1, 1, C.mute);
  }
  hline(ctx, cx, cy + ch - 1, cw - 1, C.creamDark);

  const k = CANDLE;
  sprite(ctx, k.x - 3, k.wick + 1, [
    '.aCCCa.',
    'aACCCAa',
    'aACCCAa',
    'aACcCAa',
    'aAAAAAa',
    'aaaaaaa',
    '.kkkkk.',
  ], { a: '#8a4a12', A: '#d98a2b', C: C.cream, c: C.creamDark, k: C.ink }, 1);
  px(ctx, k.x, k.wick, 1, 1, C.ink);
}


function drawLighting(ctx) {
  glow(ctx, 188, 52, 78, 40, C.light, 0.028, 5);
  glow(ctx, 188, 150, 92, 16, C.light, 0.035, 5);
  glow(ctx, 40, 112, 34, 5, C.light, 0.05, 3);
  glow(ctx, 300, 120, 20, 4, C.light, 0.04, 3);
  for (let y = BEAM.top; y < BEAM.bottom; y++) {
    const [l, r] = beamSpan(y);
    px(ctx, l, y, r - l + 1, 1, C.light, 0.05);
    const inset = Math.floor((r - l) / 4);
    px(ctx, l + inset, y, r - l + 1 - inset * 2, 1, C.cream, 0.035);
  }
  px(ctx, 293, 119, 24, 3, C.lacDark);
  frame(ctx, 293, 119, 24, 3, C.goldDeep);
  for (let i = 0; i < 4; i++) {
    hline(ctx, 259 + i, 120 + i * 2, 26 - i * 2, [C.pink, C.mint, C.light, C.blue][i], 0.08);
  }
  for (const [x0, y0, w0, h0] of [[0, 126, 78, 3], [121, 133, 132, 2], [255, 118, 34, 2], [291, 118, 28, 2]]) {
    px(ctx, x0, y0, w0, h0, C.ink, 0.35);
  }
}

function drawVignette(ctx) {
  for (let k = 1; k <= 6; k++) {
    const tx = k * 6;
    const ty = k * 4;
    px(ctx, 0, 0, tx, H, C.ink, 0.07);
    px(ctx, W - tx, 0, tx, H, C.ink, 0.07);
    px(ctx, tx, 0, W - tx * 2, ty, C.ink, 0.05);
    px(ctx, tx, H - ty, W - tx * 2, ty, C.ink, 0.07);
  }
  for (let k = 1; k <= 4; k++) px(ctx, 0, H - k * 6, W, k * 6, C.ink, 0.05);
}


export function drawStatic(ctx) {
  drawWall(ctx);
  drawFloor(ctx);
  drawNeon(ctx);
  WINDOWS.forEach((w) => drawWindow(ctx, w));
  drawStage(ctx);
  drawPoster(ctx);
  drawDiploma(ctx);
  drawShelves(ctx);
  drawChalkboard(ctx);
  drawJukebox(ctx);
  drawDoor(ctx);
  drawCounter(ctx);
  drawTray(ctx);
  drawBell(ctx);
  drawCup(ctx);
  drawStools(ctx);
  drawTable(ctx);
  drawLighting(ctx);
  drawVignette(ctx);
  ctx.globalAlpha = 1;
}


function drawRain(ctx, t) {
  for (const win of WINDOWS) {
    const ps = panes(win);
    const n = Math.round((win.w * win.h) / 34);
    for (let i = 0; i < n; i++) {
      const s = win.seed * 1000 + i;
      const x = win.x + Math.floor(hash(s) * win.w);
      const speed = 38 + hash(s + 1) * 70;
      const len = 2 + Math.floor(hash(s + 2) * 3);
      const span = win.h + len;
      const y = win.y - len + ((hash(s + 3) * span + (t / 1000) * speed) % span);
      const a = 0.25 + hash(s + 4) * 0.35;
      for (const p of ps) {
        if (x < p.x || x >= p.x + p.w) continue;
        const y0 = Math.max(Math.floor(y), p.y);
        const y1 = Math.min(Math.floor(y) + len, p.y + p.h);
        if (y1 <= y0) continue;
        px(ctx, x, y0, 1, y1 - y0, C.blueLight, a);
        if (Math.floor(y) + len - 1 < p.y + p.h) px(ctx, x, Math.floor(y) + len - 1, 1, 1, '#ffffff', a * 0.6);
      }
    }
  }
}

function drawLanterns(ctx, t) {
  const s = t / 1000;
  for (const L of LANTERNS) {
    const dx = Math.round(Math.sin(s * L.speed + L.phase) * 1.6);
    const breathe = Math.sin(s * 1.7 + L.phase);
    const cx = L.x + dx;
    glow(ctx, cx, L.top + 7, 24 + Math.round(breathe), 20 + Math.round(breathe), C.light, 0.04 + breathe * 0.008, 5);
    glow(ctx, cx, L.top + 7, 9, 10, C.orange, 0.09 + breathe * 0.02, 3);
    const len = L.top - 4;
    for (let j = 0; j < len; j++) {
      vline(ctx, L.x + Math.round((dx * j) / len), 4 + j, 1, C.goldDeep);
    }
    sprite(ctx, cx - 3, L.top, [
      '..GGG..',
      '.gGLGg.',
      '.rRRRr.',
      'rRROYRr',
      'rROYYOr',
      'rROYYOr',
      'rROYYOr',
      'rRROYRr',
      '.rRRRr.',
      '.gGGGg.',
      '..GGG..',
      '...R...',
      '...R...',
      '..RrR..',
      '..R.R..',
    ], { G: C.gold, g: C.goldDark, L: C.brass, r: C.redDark, R: C.red, O: C.orange, Y: C.light });
    px(ctx, cx - 1, L.top + 4, 1, 3, C.cream, 0.25 + breathe * 0.1);
  }
}

function drawNeonFlicker(ctx, t) {
  const { dim, letter } = neonFlicker(t);
  if (!dim) return;
  const b = NEON.letters[letter];
  px(ctx, b.x, b.y, b.w, b.h, '#1a0a0b', dim);
}

function drawJukeboxLights(ctx, t) {
  const step = Math.floor(t / 420);
  const cols = [C.pink, C.light, C.mint, C.blue];
  for (const [[x, y], i] of JUKE_ARCH) {
    const c = cols[(i + step) % cols.length];
    px(ctx, x, y, 1, 1, c, (i + step) % 2 ? 0.55 : 0.9);
  }
  const { x, y, w } = R.jukebox;
  const ang = (t / 1000) * Math.PI * 2 * 0.75;
  const rx = x + 9 + (w - 18) / 2;
  px(ctx, Math.round(rx + Math.cos(ang) * 5), Math.round(y + 19 + Math.sin(ang) * 1.5), 1, 1, C.cream, 0.7);
  const pulse = 0.5 + 0.5 * Math.sin(t / 700);
  glow(ctx, x + w / 2, y + 14, 22, 18, C.pink, 0.02 + pulse * 0.012, 3);

  const NOTE = ['..XX', '..X.', '..X.', 'XXX.', 'XX..'];
  const period = 3600;
  for (let k = 0; k < 3; k++) {
    const tt = t + k * 1200;
    const n = Math.floor(tt / period);
    const p = (tt % period) / period;
    const nx = x + 6 + Math.floor(hash(n * 3 + k) * (w - 14)) + Math.round(Math.sin(p * 5 + k) * 2);
    const ny = y - 6 - Math.round(p * 22);
    const a = Math.min(1, p / 0.15) * Math.min(1, (1 - p) / 0.45) * 0.85;
    sprite(ctx, nx, ny, NOTE, { X: cols[(n + k) % 3 === 1 ? 2 : (n + k) % 3 === 2 ? 1 : 0] }, a);
  }
}

const FLAMES = [
  ['.y.', '.Y.', 'yWY', 'YWY', 'OWO', '.b.'],
  ['y..', '.Y.', 'YWy', 'YWY', 'OWO', '.b.'],
  ['...', '.y.', '.Yy', 'YWY', 'OWO', '.b.'],
];

export function candleFrame(tMs) {
  const n = Math.floor(Math.max(0, tMs) / 360);
  const r = hash(n * 13 + 5);
  return { frame: r < 0.55 ? 0 : r < 0.8 ? 1 : 2, glow: 0.045 + hash(n * 13 + 9) * 0.015 };
}

function drawCandle(ctx, t) {
  const { frame: f, glow: a } = candleFrame(t);
  const k = CANDLE;
  glow(ctx, k.x, k.wick - 3, 16, 12, C.light, a, 4);
  sprite(ctx, k.x - 1, k.wick - 6, FLAMES[f], { y: C.light, Y: '#ffb347', W: '#fff4d6', O: C.orange, b: C.blue });
}

function drawSteam(ctx, t) {
  const s = t / 1000;
  for (let k = 0; k < 2; k++) {
    for (let j = 0; j < 9; j++) {
      const v = (j / 9 + s * 0.28 + k * 0.5) % 1;
      const y = CUP.y - 2 - Math.round(v * 18);
      const x = CUP.x + 3 + k * 2 + Math.round(Math.sin(v * 6 + s * 0.9 + k * 3) * (0.5 + v * 2.2));
      px(ctx, x, y, 1, 2, C.cream, 0.6 * Math.sin(Math.PI * v) * (1 - v * 0.5));
    }
  }
}

function drawDust(ctx, t) {
  const s = t / 1000;
  const range = BEAM.bottom - BEAM.top - 8;
  for (let i = 0; i < 16; i++) {
    const speed = 1.2 + hash(i * 3 + 2) * 2.2;
    const off = (hash(i * 3 + 3) * range + s * speed) % range;
    const y = BEAM.top + 4 + Math.floor(off);
    const [l, r] = beamSpan(y);
    const u = 0.15 + hash(i * 3 + 1) * 0.7;
    const x = Math.round(l + (r - l) * u + Math.sin(s * 0.6 + i) * 1.5);
    const edge = Math.min(1, off / 10, (range - off) / 10);
    const a = (0.25 + 0.35 * (0.5 + 0.5 * Math.sin(s * 1.3 + i * 2))) * edge;
    px(ctx, x, y, 1, 1, C.cream, a);
  }
}

function drawGlints(ctx, t) {
  const P = 2700;
  const n = Math.floor(t / P);
  const p = (t % P) / 700;
  if (p >= 1) return;
  const b = BOTTLES[Math.floor(hash(n * 11 + 1) * BOTTLES.length)];
  const a = Math.sin(Math.PI * p);
  const gx = b.x + 1;
  const gy = b.base - b.body + 2;
  px(ctx, gx, gy, 1, 1, '#ffffff', a);
  px(ctx, gx - 1, gy, 3, 1, C.cream, a * 0.5);
  px(ctx, gx, gy - 1, 1, 3, C.cream, a * 0.5);
}

export function drawAmbient(ctx, tMs) {
  const t = Math.max(0, tMs);
  drawRain(ctx, t);
  drawGlints(ctx, t);
  drawJukeboxLights(ctx, t);
  drawNeonFlicker(ctx, t);
  drawCandle(ctx, t);
  drawSteam(ctx, t);
  drawDust(ctx, t);
  drawLanterns(ctx, t);
  ctx.globalAlpha = 1;
}


export function drawHighlight(ctx, obj, tMs) {
  const { x, y, w, h } = obj.rect;
  const p = 0.5 + 0.5 * Math.sin((Math.max(0, tMs) / 1000) * Math.PI * 1.6);
  px(ctx, x, y, w, h, C.light, 0.05 + p * 0.05);
  frame(ctx, x - 2, y - 2, w + 4, h + 4, C.light, 0.15 + p * 0.15);
  frame(ctx, x - 1, y - 1, w + 2, h + 2, C.light, 0.7 + p * 0.3);
  for (const [cx, cy, sx, sy] of [[x - 1, y - 1, 1, 1], [x + w, y - 1, -1, 1], [x - 1, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    px(ctx, Math.min(cx, cx + sx * 2), cy, 3, 1, C.cream, 0.9);
    px(ctx, cx, Math.min(cy, cy + sy * 2), 1, 3, C.cream, 0.9);
  }
  ctx.globalAlpha = 1;
}
