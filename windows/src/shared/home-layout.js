// Home tab layout: tiles on a fixed 12 x 6 grid that fills the dashboard body (628 x 220 px).
// Pure functions shared by the island renderer and the tests (CommonJS like strings.js).
const GRID = { cols: 12, rows: 6, cw: 45, rh: 30, gap: 8 };

// icon, minimum size [w, h] and the size a newly added tile gets
const WIDGETS = {
  clock: { icon: 'alarm-clock', min: [2, 2], def: [3, 5] },
  quick: { icon: 'rocket', min: [2, 1], def: [3, 1] },
  media: { icon: 'music', min: [4, 2], def: [5, 6] },
  sys: { icon: 'cpu', min: [3, 2], def: [4, 2] },
  widgets: { icon: 'layout-grid', min: [3, 3], def: [4, 4] },
  crypto: { icon: 'bitcoin', min: [3, 2], def: [4, 4] },
  news: { icon: 'newspaper', min: [3, 2], def: [4, 4] },
  clocks: { icon: 'globe', min: [3, 2], def: [4, 4] },
  weather: { icon: 'cloud-sun', min: [2, 2], def: [3, 3] },
  tasks: { icon: 'list-checks', min: [3, 2], def: [4, 3] },
};

const DEFAULT = [
  { t: 'clock', x: 0, y: 0, w: 3, h: 5 },
  { t: 'quick', x: 0, y: 5, w: 3, h: 1 },
  { t: 'media', x: 3, y: 0, w: 5, h: 6 },
  { t: 'sys', x: 8, y: 0, w: 4, h: 2 },
  { t: 'widgets', x: 8, y: 2, w: 4, h: 4 },
];

const int = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN);
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inBounds = (r) => r.x >= 0 && r.y >= 0 && r.w >= 1 && r.h >= 1 && r.x + r.w <= GRID.cols && r.y + r.h <= GRID.rows;
const bigEnough = (r) => { const m = WIDGETS[r.t].min; return r.w >= m[0] && r.h >= m[1]; };
const free = (list, r, ignore = []) => inBounds(r) && !list.some((o) => !ignore.includes(o.t) && overlaps(o, r));

// Saved settings -> a valid list (unknown, duplicate, out-of-range and overlapping tiles are dropped).
function normalize(home) {
  if (!home || !home.custom || !Array.isArray(home.layout)) return DEFAULT.map((r) => ({ ...r }));
  const out = [];
  for (const raw of home.layout) {
    if (!raw || !WIDGETS[raw.t] || out.some((o) => o.t === raw.t)) continue;
    const r = { t: raw.t, x: int(raw.x), y: int(raw.y), w: int(raw.w), h: int(raw.h) };
    if ([r.x, r.y, r.w, r.h].some(Number.isNaN) || !bigEnough(r) || !free(out, r)) continue;
    out.push(r);
  }
  return out;
}

// First free spot (reading order) for a w x h tile, or null.
function findSpot(list, w, h) {
  for (let y = 0; y + h <= GRID.rows; y += 1) {
    for (let x = 0; x + w <= GRID.cols; x += 1) {
      if (free(list, { x, y, w, h })) return { x, y };
    }
  }
  return null;
}

// Adds a tile at its default size, shrinking toward the minimum until it fits. Returns the new list or null.
function addTile(list, type) {
  const meta = WIDGETS[type];
  if (!meta || list.some((o) => o.t === type)) return null;
  const sizes = [];
  for (let h = meta.def[1]; h >= meta.min[1]; h -= 1) {
    for (let w = meta.def[0]; w >= meta.min[0]; w -= 1) sizes.push([w, h]);
  }
  sizes.sort((a, b) => b[0] * b[1] - a[0] * a[1]);
  for (const [w, h] of sizes) {
    const spot = findSpot(list, w, h);
    if (spot) return [...list, { t: type, ...spot, w, h }];
  }
  return null;
}

// Moves a tile. A tile dropped onto exactly one other tile swaps places with it when both fit.
function moveTile(list, type, x, y) {
  const a = list.find((o) => o.t === type);
  if (!a) return { ok: false, list };
  const target = { ...a, x, y };
  if (!inBounds(target)) return { ok: false, list };
  const hit = list.filter((o) => o.t !== type && overlaps(o, target));
  if (!hit.length) return { ok: true, list: list.map((o) => (o.t === type ? target : o)) };
  if (hit.length === 1) {
    const b = hit[0];
    const moved = { ...b, x: a.x, y: a.y };
    const others = list.filter((o) => o.t !== a.t && o.t !== b.t);
    if (free(others, moved) && !overlaps(moved, target)) {
      return { ok: true, swap: b.t, list: list.map((o) => (o.t === a.t ? target : o.t === b.t ? moved : o)) };
    }
  }
  return { ok: false, list };
}

function resizeTile(list, type, w, h) {
  const a = list.find((o) => o.t === type);
  if (!a) return { ok: false, list };
  const target = { ...a, w, h };
  if (!bigEnough(target) || !free(list, target, [type])) return { ok: false, list };
  return { ok: true, list: list.map((o) => (o.t === type ? target : o)) };
}

const removeTile = (list, type) => list.filter((o) => o.t !== type);
const missing = (list) => Object.keys(WIDGETS).filter((k) => !list.some((o) => o.t === k));

// Pixel box of a grid rect inside the dashboard body (x is the inline-start offset, so RTL mirrors by itself).
function rectPx(r) {
  const sx = GRID.cw + GRID.gap;
  const sy = GRID.rh + GRID.gap;
  return { x: r.x * sx, y: r.y * sy, w: r.w * sx - GRID.gap, h: r.h * sy - GRID.gap };
}

module.exports = { GRID, WIDGETS, DEFAULT, normalize, findSpot, addTile, moveTile, resizeTile, removeTile, missing, rectPx, overlaps };
