// Blinkelo island controller: state -> presentation -> springs + content transitions.
import { Spring, Animator, SPRINGS } from './spring.js';
import { VIEWS, HOME, DECK, tileStyle } from './views.js';
import { createI18n } from './i18n.js';
import { extractColors, clamp, throttle, chime } from './util.js';
import { createDemoBridge, demoPayload } from './demo.js';
import { currentYm, shiftYm, isoOf, ymOfIso } from './calendar.js';
import { faceHtml, createBlinker, reducedMotion } from '../shared/blink.js';

const bridge = window.island || createDemoBridge();
const IS_DEMO = !window.island;

// ------------------------------------------------------------------ state
const state = {
  settings: {
    language: 'en', style: 'floating', scale: 1, topOffset: 8, glow: true, edgeLight: true,
    idleClock: false, hideInFullscreen: true, respectDnd: true, sound: true, movable: true, minimized: false,
    modules: { media: true, visualizer: true, notifications: true, phoneCalls: true, volumeHud: true, battery: true, capsLock: true, numLock: false, clipboard: true, privacy: true, stats: true, shelf: true, timer: true, weather: true },
    notifications: { duration: 5, blocked: [], showBody: true }, media: { pausedTimeout: 25, compactInfo: true },
    blink: { hello: true, peeks: false, events: true },
  },
  hover: false,
  everHovered: false,
  expanded: null,           // 'media' | 'notification' | 'timer' | 'callActive' | 'dashboard' | 'subs'
  expandedNotif: null,
  notifStatus: null,
  pinned: false,
  homeEdit: false,          // the home tab is in layout-edit mode (keeps the dashboard open)
  homeNew: null,            // tile that was just added (pops in once)
  homeNoRoom: false,
  sliderDrag: false,
  moving: false,
  inputFocused: false,
  tab: 'home',
  pcMedia: null,
  phoneMedia: null,
  winMedia: null,           // desktop players without Windows media controls (VLC 3, PotPlayer, MPC...)
  media: null,              // the active one of the two
  mediaLastPlaying: 0,
  seekPreview: null,
  meter: { p: 0, l: 0, r: 0, at: 0 },
  volume: { level: 0.5, muted: false },
  volumeKnown: false,
  battery: null,
  keys: null,
  privacy: { mic: [], cam: [], loc: [] },
  privacyKnown: false,
  fullscreen: false,
  quiet: false,
  transient: null,
  notifQueue: [],
  notifHistory: [],
  recentKeys: new Map(),
  call: null,
  pair: null,
  timer: null,
  sharedTimers: [],
  findPc: null,             // { name } while a phone is ringing this PC
  timerDone: null,
  stats: null,
  net: null,
  shelf: [],
  clipHistory: [],
  shortcuts: [],
  weather: null,
  widgets: { crypto: null, news: null },
  tasks: [],
  planner: null,            // { cal, ym, sel } (built lazily from the settings)
  phone: { me: null, devices: [] },
  dragOver: false,
  outDrag: false,           // a file is being dragged out of the island (shelf item, subtitle)
  subs: null,               // subtitle finder state from main
  gaming: null,             // gaming mode state from main
  gameLib: null,            // installed games (with icons) for the gaming tab
  gameLibVer: -1,
};

const i18n = createI18n(() => state.settings);
const ctx = { i: i18n, st: state, get s() { return state.settings; } };

// ------------------------------------------------------------------ DOM + springs
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const els = {
  glow: $('glow'), mainShadow: $('mainShadow'), bubbleShadow: $('bubbleShadow'), goo: $('gooLayer'),
  mainFill: $('mainFill'), bubbleFill: $('bubbleFill'), mainClip: $('mainClip'), bubbleClip: $('bubbleClip'),
  mainHost: $('mainHost'), bubbleHost: $('bubbleHost'), edge: $('edge'), wrap: $('islandWrap'),
  bkFace: $('bkFace'), bkLash: $('bkLash'),
};

const geo = {
  w: new Spring(124), h: new Spring(30), r: new Spring(15),
  bs: new Spring(0, SPRINGS.bubble), bx: new Spring(-24, SPRINGS.bubble),
  glow: new Spring(0, SPRINGS.soft),
};
const animator = new Animator(onFrame);
animator.add(...Object.values(geo));

const GLOW_W = 400; // #glow base size in island.css
const GLOW_H = 160;
const GLOW_PAD_X = 58;
const GLOW_PAD_Y = 42;

const slots = {
  main: { key: null, el: null, view: null, data: null },
  bubble: { key: null, el: null, view: null, data: null },
};
let currentMain = 'idle';
let currentBubble = null;
let lastRectsJson = '';
let lastRects = [];

function scale() { return clamp(Number(state.settings.scale) || 1, 0.7, 1.5); }
function topOffset() { return state.settings.style === 'notch' && !state.settings.position ? 0 : clamp(Number(state.settings.topOffset) || 0, 0, 80); }

// onFrame runs on every animator kick (the 250 ms ticker kicks it too). Writing an inline style, even with the same
// value, invalidates style and makes Chromium produce a new frame for this always-on-top window, so only changed
// values are written: a resting island then causes no style work, paint or compositor frame.
// Only these geometry properties go through the cache; nothing else writes them.
const styleCache = new WeakMap();
function setStyle(el, prop, value) {
  let c = styleCache.get(el);
  if (!c) { c = {}; styleCache.set(el, c); }
  if (c[prop] === value) return;
  c[prop] = value;
  el.style[prop] = value;
}

function placeBox(el, x, y, w, hh, r, notch) {
  setStyle(el, 'transform', `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`);
  setStyle(el, 'width', `${Math.max(0, w).toFixed(2)}px`);
  setStyle(el, 'height', `${Math.max(0, hh).toFixed(2)}px`);
  setStyle(el, 'borderRadius', notch ? `0 0 ${r.toFixed(2)}px ${r.toFixed(2)}px` : `${r.toFixed(2)}px`);
}

function layout(values) {
  const S = scale();
  const W = stage.clientWidth || window.innerWidth;
  const w = values.w * S;
  const hh = values.h * S;
  const r = Math.min(values.r * S, hh / 2, w / 2);
  const bs = Math.max(0, values.bs * S);
  const gap = values.bx * S;
  const shift = Math.max(0, (bs + gap) / 2);
  const top = topOffset();
  const left = (W - w) / 2 - shift;
  return { w, h: hh, r, bs, gap, top, left, bLeft: left + w + gap, bTop: top + (hh - bs) / 2 };
}

function isNotch() { return state.settings.style === 'notch' && !state.settings.position; }

function onFrame(dt, now) {
  const notch = isNotch();
  const L = layout({ w: geo.w.value, h: geo.h.value, r: geo.r.value, bs: geo.bs.value, bx: geo.bx.value });
  placeBox(els.mainFill, L.left, L.top, L.w, L.h, L.r, notch);
  placeBox(els.mainClip, L.left, L.top, L.w, L.h, L.r, notch);
  placeBox(els.mainShadow, L.left, L.top, L.w, L.h, L.r, notch);
  const bVisible = L.bs > 0.6;
  for (const el of [els.bubbleFill, els.bubbleClip, els.bubbleShadow]) {
    setStyle(el, 'display', bVisible ? 'block' : 'none');
    if (bVisible) placeBox(el, L.bLeft, L.bTop, L.bs, L.bs, L.bs / 2, false);
  }
  els.goo.classList.toggle('goo-on', !(geo.bs.resting && geo.bx.resting));

  const gw = L.w + (bVisible ? L.bs + L.gap : 0);
  const peak = state.meter && now - state.meter.at < 400 ? state.meter.p : 0;
  const breathe = 1 + Math.min(peak, 1) * 0.08;
  // the glow box hugs the island with a fixed margin; its gradients reach 0 inside the box, so no hard edges
  const S = scale();
  const bw = gw + GLOW_PAD_X * 2 * S;
  const bh = L.h + GLOW_PAD_Y * 2 * S;
  setStyle(els.glow, 'transform', `translate3d(${(L.left + gw / 2).toFixed(1)}px, ${(L.top + L.h / 2).toFixed(1)}px, 0) translate(-50%, -50%) scale(${(bw / GLOW_W * breathe).toFixed(3)}, ${(bh / GLOW_H * breathe).toFixed(3)})`);
  setStyle(els.glow, 'opacity', String(clamp(geo.glow.value, 0, 1)));

  vizFrame(now);
}

// ------------------------------------------------------------------ media (PC + phone)
function isLive(m) {
  if (!m || !state.settings.modules.media) return false;
  if (m.status === 'playing' || m.status === 'changing') return true;
  if (m.status === 'paused' || m.status === 'stopped') return Date.now() - (m.lastPlayingAt || 0) < state.settings.media.pausedTimeout * 1000;
  return false;
}

function winMediaDuplicate() {
  const w = state.winMedia;
  const p = state.pcMedia;
  if (!w || !p) return false;
  const exe = String(w.source || '').toLowerCase().replace(/\.exe$/, '').replace(/64x?$/, '');
  return !!exe && String(p.source || '').toLowerCase().includes(exe);
}

function pickMedia() {
  const list = [state.pcMedia, state.phoneMedia, winMediaDuplicate() ? null : state.winMedia].filter(Boolean);
  let m = null;
  const playing = list.filter((x) => x.status === 'playing');
  const pool = playing.length ? playing : list;
  for (const x of pool) if (!m || (x.lastPlayingAt || 0) > (m.lastPlayingAt || 0)) m = x;
  state.media = m;
  if (m && m.status === 'playing') state.mediaLastPlaying = Date.now();
}

function mediaIsLive() { return isLive(state.media); }

// ------------------------------------------------------------------ subtitles
function isVideoMedia(m) { return !!(m && !m.phone && (m.video || m.kind === 'video')); }
function subsOn() { return !!(state.subs && state.subs.enabled && state.subs.video); }
function subsForMedia() { return subsOn() && isVideoMedia(state.media); }
function subsBubbleOn() {
  return subsForMedia() && mediaIsLive() && ['searching', 'downloading', 'ready', 'found'].includes(state.subs.status);
}

// ------------------------------------------------------------------ presentation
function phoneDevice() {
  const list = (state.phone && state.phone.devices) || [];
  return list.find((d) => d.paired && d.connected) || null;
}

function dashData() {
  return {
    tab: state.tab, pinned: state.pinned, media: state.media, seekPreview: state.seekPreview, stats: state.stats, net: state.net, battery: state.battery,
    notifHistory: state.notifHistory, shelf: state.shelf, clipHistory: state.clipHistory, shortcuts: state.shortcuts, weather: state.weather,
    phoneDevice: phoneDevice(), widgets: state.widgets, widgetActive: widgetActive(), widgetsCfg: widgetsCfg(), tasks: state.tasks,
    sharedTimers: state.sharedTimers,
    planner: plannerState(),
    home: state.settings.home, homeEdit: state.homeEdit, homeNew: state.homeNew, homeNoRoom: state.homeNoRoom,
    deckSize: (state.settings.deck && state.settings.deck.size) || 'm',
    gaming: state.gaming, gameLib: state.gameLib ? state.gameLib.filter((x) => !x.hidden) : null, gmNote: state.gamingNote && state.gamingNote.until > Date.now() ? state.gamingNote : null, gmTemp: gmCfg().temp, gmHotkey: (gmCfg().hud || {}).hotkey || '', gmSteps: gmSteps(),
  };
}

function gmCfg() { return state.settings.gaming || {}; }
// what "Optimize" will do with the current settings (shown greyed before the first press)
function gmSteps() {
  const g = gmCfg();
  const o = g.optimize || { power: true, gameMode: true, memory: true, priority: 'above' };
  const out = [];
  if (o.power) out.push('power');
  if (o.gameMode) out.push('gameMode');
  if (o.closeApps && (g.closeList || []).length) out.push('close');
  if (o.memory) out.push('memory');
  if (o.priority && o.priority !== 'normal') out.push('priority');
  if (o.dvr) out.push('dvr');
  return out;
}

function widgetsCfg() {
  const w = state.settings.widgets || {};
  return { ...w, module: state.settings.modules.widgets !== false };
}
function widgetActive() { return (state.settings.widgets && state.settings.widgets.active) || 'crypto'; }

function plannerState() {
  if (!state.planner) {
    const today = isoOf(new Date());
    state.planner = { ym: currentYm(), sel: today };
  }
  return state.planner;
}

// ------------------------------------------------------------------ home layout editing
let homeHintTimer = null;
let pinnedBeforeEdit = false;
function setHomeEdit(on) {
  if (on === state.homeEdit) return;
  state.homeEdit = on;
  state.homeNoRoom = false;
  if (on) { pinnedBeforeEdit = state.pinned; state.pinned = true; } else state.pinned = pinnedBeforeEdit;
}
function saveHome(layout) {
  saveSettings({ home: { layout, custom: true } });
}

// Drag a tile to move it, or its corner handle to resize it. The tile follows the pointer freely while a ghost
// shows the grid cell it will snap to (red when the spot is taken).
function startTileDrag(e, tile, resize) {
  const type = tile.dataset.tile;
  const layout = HOME.normalize(state.settings.home);
  const item = layout.find((r) => r.t === type);
  if (!item) return;
  e.preventDefault();
  const G = HOME.GRID;
  const stepX = G.cw + G.gap;
  const stepY = G.rh + G.gap;
  const sc = scale();
  const rtl = i18n.dir() === 'rtl';
  const base = HOME.rectPx(item);
  const min = HOME.WIDGETS[type].min;
  const home = tile.parentElement;
  const ghost = document.createElement('div');
  ghost.className = 'h-ghost';
  ghost.style.cssText = tileStyle(item);
  home.insertBefore(ghost, home.firstChild);
  tile.classList.add('dragging');
  state.sliderDrag = true;
  syncInteractive(true);
  try { tile.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  let result = { ok: true, list: layout };
  let changed = false;
  const move = (ev) => {
    const sdx = (ev.clientX - e.clientX) / sc;
    const dy = (ev.clientY - e.clientY) / sc;
    const dx = rtl ? -sdx : sdx;
    let target;
    if (resize) {
      const w = clamp(Math.round((base.w + G.gap + dx) / stepX), min[0], G.cols - item.x);
      const h = clamp(Math.round((base.h + G.gap + dy) / stepY), min[1], G.rows - item.y);
      target = { ...item, w, h };
      tile.style.width = `${Math.max(min[0] * stepX - G.gap, base.w + dx)}px`;
      tile.style.height = `${Math.max(min[1] * stepY - G.gap, base.h + dy)}px`;
      result = HOME.resizeTile(layout, type, w, h);
    } else {
      const x = clamp(Math.round((base.x + dx) / stepX), 0, G.cols - item.w);
      const y = clamp(Math.round((base.y + dy) / stepY), 0, G.rows - item.h);
      target = { ...item, x, y };
      tile.style.transform = `translate(${sdx}px, ${dy}px)`;
      result = HOME.moveTile(layout, type, x, y);
    }
    changed = target.x !== item.x || target.y !== item.y || target.w !== item.w || target.h !== item.h;
    ghost.style.cssText = tileStyle(target);
    ghost.classList.toggle('bad', !result.ok);
    syncInteractive();
  };
  const up = () => {
    tile.removeEventListener('pointermove', move);
    tile.removeEventListener('pointerup', up);
    tile.removeEventListener('pointercancel', up);
    tile.removeEventListener('lostpointercapture', up);
    tile.classList.remove('dragging');
    ghost.remove();
    const commit = result.ok && changed;
    // glide every affected tile to its final cell, then store the layout
    for (const r of (commit ? result.list : layout)) {
      const el = home.querySelector(`.h-tile[data-tile="${r.t}"]`);
      if (el) { el.style.cssText = tileStyle(r); }
    }
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 80);
    state.sliderDrag = false;
    syncInteractive();
    if (commit) setTimeout(() => { saveHome(result.list); present(); }, 300);
  };
  tile.addEventListener('pointermove', move);
  tile.addEventListener('pointerup', up);
  tile.addEventListener('pointercancel', up);
  tile.addEventListener('lostpointercapture', up);
}

function saveSettings(patch) {
  // optimistic local update, main merges and broadcasts the result
  state.settings = { ...state.settings, ...patch };
  bridge.invoke('settings:set', patch).catch(() => {});
}

function expandedView(name) {
  switch (name) {
    case 'dashboard': return ['dashboard', dashData()];
    case 'media': return state.media ? ['mediaExpanded', { media: state.media, volume: state.volume, seekPreview: state.seekPreview, cc: subsForMedia() }] : null;
    case 'subs': return subsOn() ? ['subsPanel', { subs: state.subs }] : null;
    case 'notification': return state.expandedNotif ? ['notificationExpanded', { n: state.expandedNotif, status: state.notifStatus && state.notifStatus.text, statusOk: state.notifStatus && state.notifStatus.ok }] : null;
    case 'timer': return state.timer ? ['timerExpanded', { timer: state.timer }] : null;
    case 'callActive': return state.call && state.call.state === 'active' ? ['callActiveExpanded', { call: state.call }] : null;
    default: return null;
  }
}

function transientView(tr) {
  const hover = state.hover;
  switch (tr.kind) {
    case 'notification': return ['notification', { n: tr.data, queue: state.notifQueue.length, hover }];
    case 'volume': return ['volume', { volume: state.volume }];
    case 'battery': return state.battery ? ['battery', { battery: state.battery, kind: tr.data.kind }] : null;
    case 'keys': return ['keys', tr.data];
    case 'copied': return ['copied', tr.data];
    case 'privacy': return ['privacy', tr.data];
    case 'message': return ['message', tr.data];
    case 'track': return state.media ? ['track', { media: state.media }] : null;
    case 'received': return ['received', tr.data];
    case 'transfer': return ['transfer', tr.data];
    case 'subsReady': return state.subs && state.subs.file ? ['subsReady', { file: state.subs.file }] : null;
    case 'gameSummary': return ['gameSummary', tr.data];
    case 'gameLaunch': return ['gameLaunch', tr.data];
    default: return null;
  }
}

function liveActivity() {
  if (state.call && state.call.state === 'active' && !state.call.hidden) return 'call';
  if (state.timer && state.settings.modules.timer) return 'timer';
  if (mediaIsLive() && state.media.status === 'playing') return 'media';
  return '';
}

function computePresentation() {
  const st = state;
  const s = st.settings;
  const hover = st.hover;
  if (st.dragOver && !st.outDrag && s.modules.shelf) return { main: ['drop', { apps: st.expanded === 'dashboard' && st.tab === 'apps' }] };
  if (st.call && st.call.state === 'incoming') return { main: ['call', { call: st.call }] };
  if (st.pair) return { main: ['pair', { pair: st.pair }] };
  if (st.findPc) return { main: ['findPc', st.findPc] };
  if (st.timerDone) return { main: ['timerDone', st.timerDone] };
  if (st.transient && (st.transient.kind === 'message' || st.transient.kind === 'received')) return { main: transientView(st.transient) };
  if (st.expanded) {
    const ex = expandedView(st.expanded);
    if (ex) return { main: ex };
    st.expanded = null;
  }
  if (st.transient) {
    const tv = transientView(st.transient);
    if (tv) return { main: tv };
  }
  if (s.minimized && !hover && !st.moving) return { main: ['handle', { activity: liveActivity() }] };
  const live = [];
  if (st.call && st.call.state === 'active' && !st.call.hidden) live.push(['callActive', { call: st.call, hover }]);
  if (st.timer && s.modules.timer) live.push(['timer', { timer: st.timer, hover }]);
  if (mediaIsLive()) live.push(['media', { media: st.media, hover, info: !s.media || s.media.compactInfo !== false }]);
  if (live.length) {
    let bubble = null;
    if (live.length > 1) {
      const second = live[1][0];
      if (second === 'timer') bubble = ['timerMini', { timer: st.timer }];
      else if (second === 'media') bubble = ['mediaMini', { media: st.media }];
    }
    if (!bubble && subsBubbleOn()) bubble = ['subsMini', { subs: st.subs }];
    return { main: live[0], bubble };
  }
  return { main: ['idle', { hover, privacy: st.privacy, weather: s.modules.weather ? st.weather : null }] };
}

let presentQueued = false;
function present() {
  if (presentQueued) return;
  presentQueued = true;
  queueMicrotask(() => { presentQueued = false; presentNow(); });
}

function presentNow() {
  const p = computePresentation();
  const [mainName, mainData] = p.main;
  const view = VIEWS[mainName];
  const size = view.size(mainData, ctx);
  const target = { w: size.w, h: size.h, r: size.r === undefined ? size.h / 2 : size.r };
  if (isNotch()) target.r = Math.min(target.r, 30);

  if ((peek.busy || peek.booting) && (mainName !== 'idle' || state.hover || state.moving)) cancelPeek();
  setSlot('main', view, mainData, target);
  if (view.autoHeight && slots.main.measuredH) target.h = slots.main.measuredH;
  if (BLINK_VIEWS.has(mainName)) maybeBlink(mainName);

  const growing = target.w * target.h > geo.w.target * geo.h.target + 1;
  const opts = growing ? SPRINGS.expand : SPRINGS.collapse;
  if (target.w !== geo.w.target || target.h !== geo.h.target || target.r !== geo.r.target) {
    geo.w.to(target.w, opts);
    geo.h.to(target.h, opts);
    geo.r.to(target.r, opts);
  }

  const bubbleOn = !!p.bubble;
  geo.bs.to(bubbleOn ? 32 : 0, SPRINGS.bubble);
  geo.bx.to(bubbleOn ? 8 : -24, SPRINGS.bubble);

  setSlot('bubble', p.bubble ? VIEWS[p.bubble[0]] : null, p.bubble ? p.bubble[1] : null, { w: 32, h: 32 });
  currentMain = mainName;
  currentBubble = p.bubble ? p.bubble[0] : null;

  updateGlow();
  updateMeterSubscription();
  sendRects(target, bubbleOn);
  if (document.body.dataset.view !== mainName) document.body.dataset.view = mainName; // unchanged: no style invalidation
  syncGamingPanel();
  animator.kick();
}

// ------------------------------------------------------------------ Blinkelo: the island's eyes
// 1) Wake-up hello at start and short "peeks" while idle: two eyes open in the empty pill, glance, blink or wink,
//    and close again. The pill squints along with them (spring impulses), so the whole island feels alive.
// 2) Every new thing (notification, message, call, file, song...) arrives with a blink: the content closes to a
//    glowing lash line and opens on the new view (blink-reveal, CSS in island.css).
els.bkFace.innerHTML = faceHtml('asleep');
const islandFace = createBlinker(els.bkFace.firstElementChild, { onMove: faceMoved });
// booting: the island starts with its content hidden (body.bk-boot.bk-peek) so the hello is the first thing seen
const peek = { busy: false, booting: true, kind: '', token: 0, timer: null, helloQueued: false };

function blinkCfg() { return state.settings.blink || {}; }

function faceMoved(kind) {
  if (kind === 'blink' || kind === 'blink2') { geo.h.impulse(-110); geo.w.impulse(80); }
  else if (kind === 'wink') { geo.h.impulse(-70); geo.w.impulse(150); }
  else if (kind === 'wake') { geo.h.impulse(150); geo.w.impulse(190); }
  else return;
  animator.kick();
}

function canPeek(kind, force = false) {
  const s = state.settings;
  if (currentMain !== 'idle' || state.hover || state.moving || state.dragOver || state.fullscreen || state.quiet || s.hidden || document.hidden) return false;
  if (force) return true;
  if (reducedMotion()) return false;
  return kind === 'hello' ? blinkCfg().hello !== false : blinkCfg().peeks === true;
}

function endBoot() {
  if (!peek.booting) return;
  peek.booting = false;
  document.body.classList.remove('bk-boot');
  if (!peek.busy) document.body.classList.remove('bk-peek');
}

async function runPeek(kind = 'random', force = false) {
  if (peek.busy || !canPeek(kind, force)) { if (kind === 'hello') endBoot(); return false; }
  peek.busy = true;
  peek.kind = kind;
  const token = ++peek.token;
  const live = () => token === peek.token;
  const fromBoot = peek.booting;
  document.body.classList.add('bk-peek');
  if (fromBoot) { peek.booting = false; document.body.classList.remove('bk-boot'); }
  const f = islandFace;
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  try {
    if (!fromBoot) await pause(160); // let the clock / dots fade out first
    if (!live()) return false;
    await f.wake();
    const steps = [];
    if (kind === 'hello') steps.push(() => pause(140), () => f.look(-1), () => f.look(1), () => pause(90), () => f.blink(), () => pause(200), () => f.wink(), () => pause(260));
    else {
      const r = Math.random();
      if (r < 0.42) steps.push(() => pause(380), () => f.blink(), () => pause(650));
      else if (r < 0.66) steps.push(() => pause(240), () => f.blink2(), () => pause(520));
      else if (r < 0.86) steps.push(() => pause(200), () => f.look(Math.random() < 0.5 ? -1 : 1), () => f.blink(), () => pause(300));
      else steps.push(() => pause(300), () => f.wink(), () => pause(320));
    }
    for (const step of steps) {
      if (!live()) return false;
      await step();
    }
    return live();
  } finally {
    if (live()) endPeek(false);
  }
}

// eyes close first, then the clock / dots come back (an interruption skips straight to the content)
function endPeek(immediate) {
  peek.busy = false;
  islandFace.sleep();
  const token = peek.token;
  if (immediate) document.body.classList.remove('bk-peek');
  else setTimeout(() => { if (token === peek.token && !peek.busy) document.body.classList.remove('bk-peek'); }, 190);
}

function cancelPeek() {
  peek.token += 1;
  peek.booting = false;
  document.body.classList.remove('bk-boot');
  endPeek(true);
}

function schedulePeek(ms) {
  clearTimeout(peek.timer);
  peek.timer = setTimeout(async () => {
    if (blinkCfg().peeks !== true) { schedulePeek(30000); return; } // off by default: just check again later
    const shown = await runPeek('random');
    // roughly once or twice a minute and a half; retry sooner when the island was busy
    schedulePeek(shown ? 55000 + Math.random() * 85000 : 15000 + Math.random() * 10000);
  }, ms);
}

function queueHello() {
  if (peek.helloQueued) return;
  peek.helloQueued = true;
  setTimeout(async () => {
    const shown = await runPeek('hello');
    schedulePeek(shown ? 50000 + Math.random() * 40000 : 12000);
  }, 450);
}

// what counts as "a new thing" for a blink, and which colour its lash line gets
const BLINK_VIEWS = new Set(['notification', 'message', 'received', 'track', 'call', 'pair', 'findPc', 'timerDone', 'gameSummary', 'gameLaunch', 'subsReady']);
const LASH = { call: 'var(--green)', pair: 'var(--green)', findPc: 'var(--red)', timerDone: 'var(--orange)', gameSummary: 'var(--purple)', gameLaunch: 'var(--purple)', subsReady: 'var(--green)' };
const blinkedObjs = new WeakSet();
const blinkedIds = [];
let revealTimer = null;

function blinkSubject(name) {
  switch (name) {
    case 'call': return state.call ? `call:${state.call.id}` : null;
    case 'pair': return state.pair ? `pair:${state.pair.id}` : null;
    case 'findPc': return state.findPc;
    case 'timerDone': return state.timerDone;
    // notification, message, received, track, game*, subsReady come in as transients; a transient of the same kind
    // is reused for the next one, so its data object is what identifies "a new thing"
    default: return state.transient && state.transient.data && typeof state.transient.data === 'object' ? state.transient.data : null;
  }
}

function maybeBlink(name) {
  const subj = blinkSubject(name);
  if (!subj) return;
  if (typeof subj === 'string') {
    if (blinkedIds.includes(subj)) return;
    blinkedIds.push(subj);
    if (blinkedIds.length > 40) blinkedIds.shift();
  } else if (typeof subj === 'object') {
    if (blinkedObjs.has(subj)) return;
    blinkedObjs.add(subj);
  } else return;
  islandBlink(lashColor(name));
}

function lashColor(name) {
  if (LASH[name]) return LASH[name];
  const d = state.transient && state.transient.data;
  if (name === 'notification' && d && d.app && d.app.phone) return 'var(--green)';
  if (name === 'received') return 'var(--green)';
  if (name === 'message' && d && d.tone) return { green: 'var(--green)', red: 'var(--red)', orange: 'var(--orange)', blue: 'var(--accent)' }[d.tone] || 'var(--accent)';
  return 'var(--accent)';
}

function islandBlink(color) {
  if (blinkCfg().events === false || reducedMotion()) return;
  const c = els.mainClip;
  c.style.setProperty('--bk-lash', color || 'var(--accent)');
  c.classList.remove('bk-reveal');
  void c.offsetWidth;
  c.classList.add('bk-reveal');
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => c.classList.remove('bk-reveal'), 640);
}

document.addEventListener('visibilitychange', () => { if (document.hidden && peek.busy) cancelPeek(); });

// main samples sensors more often while the gaming tab is visible
let gamingPanelSent = false;
function syncGamingPanel() {
  const want = state.expanded === 'dashboard' && state.tab === 'gaming';
  if (want === gamingPanelSent) return;
  gamingPanelSent = want;
  bridge.invoke('gaming:cmd', 'panel', { open: want }).catch(() => {});
}

function gamingCommand(name, args = {}) {
  return bridge.invoke('gaming:cmd', name, args).then((g) => { if (g && typeof g === 'object' && 'enabled' in g) { state.gaming = g; present(); } return g; }).catch(() => null);
}

function loadGameLib(refresh) {
  state.gameLibStale = false;
  return bridge.invoke('gaming:cmd', 'library', { refresh }).then((lib) => {
    if (Array.isArray(lib)) { state.gameLib = lib; if (state.expanded === 'dashboard' && state.tab === 'gaming') present(); }
  }).catch(() => {});
}

function onGaming(g) {
  if (g && typeof g.libVer === 'number' && g.libVer !== state.gameLibVer) {
    state.gameLibVer = g.libVer;
    if (state.gameLib) { state.gameLibStale = true; if (state.expanded === 'dashboard' && state.tab === 'gaming') loadGameLib(false); }
  }
  state.gaming = g || null;
  if (state.expanded === 'dashboard' && state.tab === 'gaming') present();
}

function setSlot(slotName, view, data, size) {
  const slot = slots[slotName];
  const host = slotName === 'main' ? els.mainHost : els.bubbleHost;
  const key = view ? view.key(data, ctx) : null;
  if (key && key === slot.key) {
    slot.data = data;
    if (view.update) view.update(slot.el, data, ctx);
    if (slot.el) { slot.el.style.width = `${size.w}px`; if (!view.autoHeight) slot.el.style.height = `${size.h}px`; }
    return;
  }
  const old = slot.el;
  if (old) {
    old.style.pointerEvents = 'none';
    old.classList.add('leaving');
    const a = old.animate(
      [{ opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }, { opacity: 0, filter: 'blur(7px)', transform: 'scale(0.94)' }],
      { duration: 170, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' },
    );
    a.onfinish = () => old.remove();
  }
  slot.key = key;
  slot.view = view;
  slot.data = data;
  slot.el = null;
  slot.measuredH = 0;
  if (!view) return;
  const el = view.render(data, ctx);
  el.classList.add('view', `v-${view.name}`);
  el.style.width = `${size.w}px`;
  el.style.height = `${size.h}px`;
  host.appendChild(el);
  if (view.update) view.update(el, data, ctx);
  if (view.autoHeight) {
    el.style.height = 'auto';
    slot.measuredH = Math.ceil(el.offsetHeight);
    el.style.height = `${slot.measuredH}px`;
  }
  el.animate(
    [{ opacity: 0, filter: 'blur(9px)', transform: 'scale(0.9)' }, { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' }],
    { duration: 430, delay: old ? 90 : 40, easing: 'cubic-bezier(.2,.9,.25,1.08)', fill: 'backwards' },
  );
  el.querySelectorAll('[data-s]').forEach((c, idx) => {
    c.animate(
      [{ opacity: 0, transform: 'translateY(8px) scale(.98)' }, { opacity: 1, transform: 'none' }],
      { duration: 420, delay: 150 + idx * 45, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' },
    );
  });
  slot.el = el;
  requestAnimationFrame(() => setupMarquees(el));
}

function setupMarquees(root) {
  root.querySelectorAll('.marquee').forEach((m) => {
    const span = m.firstElementChild;
    if (!span) return;
    const rtl = getComputedStyle(span).direction === 'rtl' || /^[^A-Za-z0-9]*[\u0590-\u08FF]/.test(span.textContent || '');
    m.classList.toggle('rtl', rtl);
    const over = span.scrollWidth - m.clientWidth;
    if (over > 4) {
      m.classList.add('scroll');
      m.style.setProperty('--mq', `${rtl ? over + 16 : -over - 16}px`);
      m.style.setProperty('--mqd', `${Math.max(6, over / 22)}s`);
    } else m.classList.remove('scroll');
  });
}

function sendRects(target, bubbleOn) {
  const L = layout({ w: target.w, h: Math.max(target.h, 10), r: target.r, bs: bubbleOn ? 32 : 0, bx: bubbleOn ? 8 : -24 });
  // a minimized handle is tiny: give it a comfortable hit area
  const padY = currentMain === 'handle' ? 8 : 0;
  const rects = [{ x: Math.round(L.left), y: Math.round(L.top), w: Math.round(L.w), h: Math.round(L.h + padY) }];
  if (bubbleOn) rects.push({ x: Math.round(L.bLeft), y: Math.round(L.bTop), w: Math.round(L.bs), h: Math.round(L.bs) });
  lastRects = rects;
  const json = JSON.stringify(rects);
  if (json !== lastRectsJson) {
    lastRectsJson = json;
    bridge.setRects(rects);
  }
}

// ------------------------------------------------------------------ glow / edge light / effects
function updateGlow() {
  const s = state.settings;
  let target = 0;
  let c1 = null; let c2 = null;
  if (s.glow) {
    if ((state.call && state.call.state === 'incoming') || currentMain === 'pair') { target = 0.75; c1 = 'var(--green)'; c2 = 'hsl(150 80% 45%)'; }
    else if (currentMain === 'timerDone') { target = 0.7; c1 = 'var(--orange)'; c2 = 'hsl(20 95% 55%)'; }
    else if (['media', 'mediaExpanded', 'track'].includes(currentMain) && state.media && state.media.status === 'playing') {
      target = currentMain === 'media' ? 0.5 : 0.8;
      c1 = (state.media.colors && state.media.colors.c1) || 'var(--accent)';
      c2 = (state.media.colors && state.media.colors.c2) || 'var(--purple)';
    } else if (currentMain === 'dashboard') { target = 0.35; c1 = 'var(--accent)'; c2 = 'var(--purple)'; }
  }
  if (c1) { els.glow.style.setProperty('--g1', c1); els.glow.style.setProperty('--g2', c2); }
  const mc = state.media && state.media.colors;
  document.documentElement.style.setProperty('--m1', mc ? mc.c1 : '#ffffff');
  document.documentElement.style.setProperty('--m2', mc ? mc.c2 : 'rgba(255,255,255,.7)');
  geo.glow.to(target, SPRINGS.soft);
}

function edge(color, loop = false) {
  if (!state.settings.edgeLight) return;
  const e = els.edge;
  e.style.setProperty('--edge', color);
  e.classList.remove('run', 'loop');
  void e.offsetWidth;
  e.classList.add(loop ? 'loop' : 'run');
}
function stopEdge() { els.edge.classList.remove('run', 'loop'); }

function bump(strength = 1) {
  geo.w.impulse(260 * strength);
  geo.h.impulse(60 * strength);
  animator.kick();
}

function shake() {
  els.wrap.animate(
    [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }],
    { duration: 520, easing: 'ease-out' },
  );
}

// ------------------------------------------------------------------ visualizer
const vizState = new WeakMap();
let meterSubscribed = false;

function wantsMeter() {
  return state.settings.modules.visualizer && state.media && state.media.status === 'playing'
    && ['media', 'mediaExpanded', 'track', 'mediaMini', 'dashboard', 'handle'].some((v) => v === currentMain || v === currentBubble);
}

function updateMeterSubscription() {
  const want = wantsMeter() || (state.call && state.call.state === 'active' && !state.call.hidden);
  if (want !== meterSubscribed) {
    meterSubscribed = want;
    bridge.helper('audio.meter', want && !(state.media && state.media.phone) ? '1' : '0');
    if (want) animator.hold('viz'); else animator.release('viz');
  }
}

function vizFrame(now) {
  if (!meterSubscribed) return;
  const bars = stage.querySelectorAll('.viz');
  if (!bars.length) return;
  const t = now / 1000;
  const fresh = now - state.meter.at < 600 && !(state.media && state.media.phone);
  const playing = state.media && state.media.status === 'playing';
  let base;
  if (fresh) base = clamp(Math.pow(state.meter.p, 0.7) * 1.25, 0, 1);
  else base = playing ? 0.45 + 0.22 * Math.sin(t * 2.3) + 0.12 * Math.sin(t * 5.7) : 0.12;
  bars.forEach((v) => {
    let vs = vizState.get(v);
    const kids = v.children;
    if (!vs || vs.length !== kids.length) {
      vs = Array.from(kids, (_, i) => ({ cur: 0.2, phase: i * 1.7 + Math.random(), speed: 5 + Math.random() * 4 }));
      vizState.set(v, vs);
    }
    const green = v.classList.contains('viz-green');
    for (let i = 0; i < kids.length; i++) {
      const b = vs[i];
      const center = 1 - Math.abs(i - (kids.length - 1) / 2) / kids.length;
      const wobble = 0.55 + 0.45 * Math.sin(t * b.speed + b.phase) * Math.sin(t * (b.speed * 0.37) + b.phase * 2);
      let target = green && !playing ? 0.3 + 0.35 * Math.abs(Math.sin(t * b.speed * 0.6 + b.phase)) : base * (0.45 + 0.55 * wobble) * (0.75 + 0.35 * center);
      target = clamp(target, 0.12, 1);
      b.cur += (target - b.cur) * (target > b.cur ? 0.45 : 0.18);
      kids[i].style.transform = `scaleY(${b.cur.toFixed(3)})`;
    }
  });
}

// ------------------------------------------------------------------ interactive lock (keeps the window clickable while dragging/typing)
let interactiveSent = false;
let interactiveRenewAt = 0;
function syncInteractive(force = false) {
  const want = state.sliderDrag || state.inputFocused || state.dragOver || state.moving;
  const now = Date.now();
  if (want !== interactiveSent || (want && (force || now > interactiveRenewAt))) {
    interactiveSent = want;
    interactiveRenewAt = now + 1000;
    bridge.setInteractive(want);
  }
}

// ------------------------------------------------------------------ transients
let transientTimer = null;
let transientSeq = 0;
const PRIORITY = { notification: 3, received: 2, transfer: 2, battery: 2, volume: 2, keys: 2, privacy: 2, message: 2, subsReady: 2, gameSummary: 2, gameLaunch: 2, copied: 1, track: 1 };

function showTransient(kind, data, ms) {
  const cur = state.transient;
  if (state.expanded) {
    if (kind === 'notification') {
      if (state.pinned || state.sliderDrag || state.inputFocused) { state.notifQueue.push(data); present(); return; }
      collapse(false);
    } else if (kind === 'volume' && state.expanded === 'media') {
      present();
      return;
    } else if (kind !== 'message' && kind !== 'received') {
      return; // the user is looking at an expanded view; don't interrupt it with minor HUDs
    }
  }
  if (cur && cur.kind === 'notification' && kind !== 'notification') {
    if (PRIORITY[kind] < 2) return;
    state.notifQueue.unshift(cur.data);
  }
  if (cur && cur.kind === kind && kind !== 'notification') {
    cur.data = data;
    cur.until = Date.now() + ms;
    scheduleTransientEnd();
    present();
    return;
  }
  transientSeq += 1;
  state.transient = { kind, data, until: Date.now() + ms, id: transientSeq };
  scheduleTransientEnd();
  present();
}

function scheduleTransientEnd() {
  clearTimeout(transientTimer);
  if (!state.transient) return;
  transientTimer = setTimeout(checkTransient, Math.max(60, state.transient.until - Date.now()));
}

function checkTransient() {
  const tr = state.transient;
  if (!tr) return;
  if ((state.hover && tr.kind !== 'track' && tr.kind !== 'message') || state.sliderDrag) { tr.until = Date.now() + 1300; scheduleTransientEnd(); return; }
  if (Date.now() < tr.until - 20) { scheduleTransientEnd(); return; }
  endTransient();
}

function endTransient() {
  state.transient = null;
  clearTimeout(transientTimer);
  if (state.notifQueue.length && !state.expanded) {
    const n = state.notifQueue.shift();
    showTransient('notification', n, notifMs());
    bump(0.6);
    return;
  }
  present();
}

function notifMs() { return clamp(Number(state.settings.notifications.duration) || 5, 2, 30) * 1000; }
function say(text, iconName = 'sparkles', tone = '', ms = 2400) {
  showTransient('message', { id: `${Date.now()}${Math.random()}`, icon: iconName, text, tone }, ms);
}

// ------------------------------------------------------------------ expand / collapse
let collapseTimer = null;
let shortcutTimer = null;

function expand(name) {
  if (name === 'notification' && state.transient && state.transient.kind === 'notification') {
    state.expandedNotif = state.transient.data;
    state.notifStatus = null;
    state.transient = null;
    clearTimeout(transientTimer);
  }
  state.expanded = name;
  if (name === 'dashboard') {
    bridge.stats(true);
    refreshTabData(state.tab);
  }
  present();
}

function collapse(showQueued = true) {
  clearTimeout(collapseTimer);
  clearTimeout(shortcutTimer);
  if (state.expanded === 'dashboard') bridge.stats(false);
  state.expanded = null;
  state.expandedNotif = null;
  state.notifStatus = null;
  state.seekPreview = null;
  state.pinned = false;
  state.homeEdit = false;
  state.homeNoRoom = false;
  if (state.inputFocused) {
    state.inputFocused = false;
    const f = stage.querySelector('input:focus');
    if (f) f.blur();
    bridge.setFocus(false);
  }
  syncInteractive();
  if (showQueued && !state.transient && state.notifQueue.length) {
    const n = state.notifQueue.shift();
    showTransient('notification', n, notifMs());
    return;
  }
  present();
}

function setHover(v) {
  if (state.hover === v) return;
  state.hover = v;
  if (v && ((state.transient && state.transient.kind === 'subsReady') || state.expanded === 'subs')) bridge.attention(20000);
  if (v) {
    state.everHovered = true;
    clearTimeout(collapseTimer);
    clearTimeout(shortcutTimer);
  } else if (state.expanded && !state.pinned) {
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(() => {
      if (!state.hover && !state.sliderDrag && !state.inputFocused && !state.pinned && !state.moving) collapse();
    }, 700);
  }
  present();
}

function openDashboard(viaShortcut = false, tab = null) {
  if (tab) state.tab = tab;
  expand('dashboard');
  if (viaShortcut) {
    state.everHovered = false;
    clearTimeout(shortcutTimer);
    shortcutTimer = setTimeout(() => { if (!state.everHovered && state.expanded === 'dashboard' && !state.pinned) collapse(); }, 9000);
  }
}

function refreshTabData(tab) {
  if (tab === 'alerts') bridge.helper('notif.recent', '30');
  if (tab === 'shelf') bridge.invoke('shelf:get').then((s) => { state.shelf = s || []; present(); }).catch(() => {});
  if (tab === 'clipboard') bridge.invoke('clipboard:history').then((c) => { state.clipHistory = c || []; present(); }).catch(() => {});
  if (tab === 'apps') bridge.invoke('shortcuts:get').then((s) => { state.shortcuts = s || []; present(); }).catch(() => {});
  if (tab === 'planner') bridge.invoke('tasks:get').then((t) => { state.tasks = t || []; present(); }).catch(() => {});
  if (tab === 'gaming') {
    bridge.invoke('gaming:get').then((g) => { if (g) { state.gaming = g; present(); } }).catch(() => {});
    if (!state.gameLib || state.gameLibStale) loadGameLib(false);
  }
}

// ------------------------------------------------------------------ media handling
function mergeMedia(prev, msg, isPhone) {
  if (!msg.present) return null;
  const sameTrack = prev && prev.artKey === msg.artKey;
  const m = { ...msg, receivedAt: Date.now(), demo: msg.demo || false, phone: isPhone };
  if (msg.kind === 'video') m.video = true;
  if (Object.prototype.hasOwnProperty.call(msg, 'art')) {
    m.art = msg.art || (sameTrack ? prev.art : null);
    m.colors = sameTrack && prev.colors && !msg.art ? prev.colors : null;
    if (msg.art && !(sameTrack && prev.art === msg.art && prev.colors)) {
      extractColors(msg.art).then((c) => {
        const cur = isPhone ? state.phoneMedia : state.pcMedia;
        if (cur && cur.artKey === m.artKey) { cur.colors = c; present(); }
      });
    } else if (sameTrack && prev.art === msg.art) m.colors = prev.colors;
  } else if (sameTrack) {
    m.art = prev.art;
    m.colors = prev.colors;
  } else {
    m.art = null;
    m.colors = null;
  }
  m.lastPlayingAt = m.status === 'playing' ? Date.now() : (prev && prev.lastPlayingAt) || 0;
  return m;
}

function onMedia(msg, isPhone = false) {
  const prevActive = state.media;
  const prev = isPhone ? state.phoneMedia : state.pcMedia;
  const m = mergeMedia(prev, msg, isPhone);
  if (isPhone) state.phoneMedia = m; else state.pcMedia = m;
  pickMedia();
  if (!state.media && state.expanded === 'media') state.expanded = null;
  const cur = state.media;
  const trackChanged = cur && prevActive && cur === m && prevActive.title !== cur.title && cur.title && cur.status === 'playing';
  const startedPlaying = cur && cur === m && (!prev || prev.status !== 'playing') && cur.status === 'playing';
  if (trackChanged && !state.expanded && !state.transient && state.settings.modules.media) showTransient('track', {}, 3200);
  else if (startedPlaying && currentMain === 'idle') bump(0.4);
  present();
}

function mediaCommand(cmd) {
  const m = state.media;
  if (!m) return;
  const optimisticToggle = () => {
    m.position += m.status === 'playing' ? (Date.now() - m.receivedAt) / 1000 : 0;
    m.receivedAt = Date.now();
    m.status = m.status === 'playing' ? 'paused' : 'playing';
    if (m.status === 'playing') { m.lastPlayingAt = Date.now(); state.mediaLastPlaying = Date.now(); }
  };
  if (m.demo) {
    if (cmd === 'media.toggle') optimisticToggle();
    else if (cmd === 'media.next' || cmd === 'media.prev') { onMedia({ ...demoPayload('music', cmd === 'media.next' ? 1 : -1), demo: true }); return; }
    present();
    return;
  }
  if (cmd === 'media.toggle') { optimisticToggle(); present(); }
  if (m.phone) {
    const map = { 'media.toggle': 'PlayPause', 'media.next': 'Next', 'media.prev': 'Previous', 'media.play': 'Play', 'media.pause': 'Pause' };
    if (map[cmd]) bridge.phone('media', { action: map[cmd] });
  } else if (m.win) {
    const map = { 'media.toggle': 'play', 'media.play': 'play', 'media.pause': 'play', 'media.next': 'next', 'media.prev': 'prev' };
    if (map[cmd]) bridge.helper('keys.media', map[cmd]);
  } else {
    bridge.helper(cmd);
  }
}

function seekMedia(sec) {
  const m = state.media;
  if (!m) return;
  m.position = sec;
  m.receivedAt = Date.now();
  if (m.demo) return;
  if (m.phone) bridge.phone('media', { action: 'seek', arg: sec });
  else if (!m.win) bridge.helper('media.seek', String(sec));
}

// desktop players that only expose their window title
const VIDEO_PLAYERS = /^(potplayer|mpc-|kmplayer|gom|mpv|smplayer)/i;
const AUDIO_PLAYERS = /^(winamp|foobar2000|aimp|musicbee)/i;
const VIDEO_HINT = /\b(480p|720p|1080p|2160p|4k|x264|x265|h\.?264|h\.?265|hevc|bluray|blu-ray|web-?dl|webrip|hdtv|dvdrip|s\d{1,2}e\d{1,3})\b/i;

function onPlayer(msg) {
  if (!msg.present) {
    state.winMedia = null;
    pickMedia();
    if (!state.media && state.expanded === 'media') state.expanded = null;
    present();
    return;
  }
  const prev = state.winMedia;
  const exe = String(msg.exe || '');
  let title = String(msg.title || '').trim();
  if (!/\s/.test(title) && (title.match(/\./g) || []).length >= 2) title = title.replace(/\./g, ' ');
  const video = VIDEO_PLAYERS.test(exe) || VIDEO_HINT.test(title);
  let artist = '';
  const dash = title.indexOf(' - ');
  if (!video && dash > 0 && (AUDIO_PLAYERS.test(exe) || /^vlc/i.test(exe))) {
    artist = title.slice(0, dash).trim();
    title = title.slice(dash + 3).trim();
  }
  const playing = !!msg.playing;
  const key = `win:${exe}:${msg.title}`;
  const now = Date.now();
  state.winMedia = {
    present: true, win: true, video, title, artist, album: '', status: playing ? 'playing' : 'paused', source: exe, player: msg.app,
    position: 0, duration: 0, canPlay: true, canPause: true, canNext: true, canPrev: true, canSeek: false,
    artKey: key, art: null, colors: null, receivedAt: now,
    lastPlayingAt: playing ? now : (prev && prev.artKey === key ? prev.lastPlayingAt : 0),
  };
  const before = state.media;
  pickMedia();
  const cur = state.media;
  if (cur === state.winMedia && playing && (!before || before.artKey !== key) && !state.expanded && !state.transient && state.settings.modules.media) {
    showTransient('track', {}, 3200);
  }
  present();
}

// ------------------------------------------------------------------ notifications
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function dedupeKey(n) { return `${n.title}|${n.body}`.toLowerCase().replace(/\s+/g, ' ').trim(); }
function isDuplicate(n) {
  const key = dedupeKey(n);
  const now = Date.now();
  for (const [k, ts] of state.recentKeys) if (now - ts > 20000) state.recentKeys.delete(k);
  if (state.recentKeys.has(key)) return true;
  state.recentKeys.set(key, now);
  return false;
}

function toNotif(msg) {
  const texts = msg.texts || [];
  const app = msg.app || { name: 'Windows' };
  let title = texts[0] || msg.header || app.name;
  let body = texts.slice(1).join('\n');
  if (!body && texts.length === 1 && msg.header) { body = title; title = msg.header; }
  let attribution = msg.attribution || '';
  if (app.phone && !attribution && msg.header) attribution = msg.header;
  return {
    id: `${msg.id}:${msg.time || 0}`, toastId: String(msg.id), source: 'toast', time: msg.time || Date.now(), app, appName: app.phone ? 'Phone Link' : (app.name || 'Windows'),
    attribution, title, body, actions: msg.actions || [], inputs: msg.inputs || [], images: msg.images || [], launch: msg.launch,
    avatar: msg.avatarData || null, appIcon: null, demo: !!msg.demo,
  };
}

function kdeNotif(p) {
  return {
    id: `kde:${p.deviceId}:${p.id}`, source: 'kde', kdeId: p.id, deviceId: p.deviceId, time: p.time || Date.now(),
    app: { name: p.appName, phone: true, kde: true }, appName: p.appName, attribution: `${p.appName} · ${p.deviceName}`,
    title: p.title || p.appName, body: p.text || '', actions: (p.actions || []).map((a) => ({ content: a })),
    inputs: p.replyId ? [{ id: 'reply', type: 'text', placeholder: '' }] : [], replyId: p.replyId, clearable: p.clearable,
    avatar: p.icon || null, appIcon: null, demo: !!p.demo,
  };
}

async function resolveNotifImages(n) {
  try {
    const imgs = n.images || [];
    const logo = imgs.find((i) => i.placement === 'appLogoOverride') || imgs.find((i) => !i.placement);
    if (!n.avatar && logo) {
      if (logo.path) n.avatar = await bridge.invoke('image:data', logo.path);
      else if (/^(https?:|data:image)/i.test(logo.src || '')) n.avatar = logo.src;
    }
    if (!n.avatar && n.app && n.app.exe) n.appIcon = await bridge.invoke('icon:forExe', n.app.exe);
  } catch (_) { /* best effort */ }
  return n;
}

function notifPrefs() { return state.settings.notifications || {}; }
// live = it just arrived (always listed); replays from the database or a reconnecting phone obey "clear all"
function addHistory(n, live = true) {
  if (state.notifHistory.some((x) => x.id === n.id)) return;
  const prefs = notifPrefs();
  if ((prefs.dismissed || []).includes(n.id)) return;
  if (!live && n.time && n.time <= (prefs.clearedAt || 0)) return;
  state.notifHistory = [n, ...state.notifHistory].sort((a, b) => b.time - a.time).slice(0, 60);
}

function clearAlerts() {
  const newest = state.notifHistory.reduce((m, n) => Math.max(m, n.time || 0), 0);
  const at = Math.max(Date.now(), newest) + 1;
  state.notifHistory = [];
  saveSettings({ notifications: { ...notifPrefs(), clearedAt: at, dismissed: [] } });
  present();
}

function dismissAlert(id) {
  state.notifHistory = state.notifHistory.filter((n) => n.id !== id);
  const list = [id, ...(notifPrefs().dismissed || []).filter((x) => x !== id)].slice(0, 300);
  saveSettings({ notifications: { ...notifPrefs(), dismissed: list } });
  present();
}

function canShowNotification(n) {
  const s = state.settings;
  if (!s.modules.notifications) return false;
  if ((s.notifications.blocked || []).some((b) => b && (b === n.appName || b === n.app.name))) return false;
  if (s.respectDnd && state.quiet) return false;
  if (state.fullscreen && s.hideInFullscreen) return false;
  return true;
}

function presentNotification(n) {
  const cur = state.transient;
  if (cur && cur.kind === 'notification') {
    state.notifQueue.push(n);
    bump(0.5);
    present();
  } else {
    showTransient('notification', n, notifMs());
    bump(0.8);
    edge(n.app && n.app.phone ? 'var(--green)' : 'var(--accent)');
  }
}

async function onToast(msg) {
  if (msg.call) { onCallToast(msg); return; }
  const n = toNotif(msg);
  addHistory(n);
  if (!canShowNotification(n) || isDuplicate(n)) { present(); return; }
  await Promise.race([resolveNotifImages(n), sleep(300)]);
  presentNotification(n);
  if (!n.avatar && !n.appIcon) resolveNotifImages(n).then(() => present());
}

function onToastHistory(items) {
  for (const it of items || []) {
    if (it.call) continue;
    const n = toNotif(it);
    if (!state.notifHistory.some((x) => x.id === n.id)) {
      addHistory(n, false);
      if (state.notifHistory.some((x) => x.id === n.id)) resolveNotifImages(n).then(() => present());
    }
  }
  present();
}

function openNotifApp(n) {
  if (!n || n.source === 'kde') return;
  if (n.app && n.app.phone) bridge.invoke('action', 'phonelink');
  else if (n.app && n.app.aumid) bridge.invoke('action', 'openApp', n.app.aumid);
}

// ------------------------------------------------------------------ UI Automation requests (Phone Link toasts)
const pendingUia = new Map();
function uia(kind, label, cb, demo = false) {
  const id = `u${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  pendingUia.set(id, cb);
  if (demo || IS_DEMO) { setTimeout(() => onUia({ id, ok: true, detail: 'demo' }), 650); return; }
  bridge.helper('uia.invoke', id, kind, label || '');
  setTimeout(() => { if (pendingUia.has(id)) onUia({ id, ok: false, detail: 'timeout' }); }, 6000);
}
function uiaReply(text, sendLabel, cb, demo = false) {
  const id = `r${Date.now()}`;
  pendingUia.set(id, cb);
  if (demo || IS_DEMO) { setTimeout(() => onUia({ id, ok: true, detail: 'demo' }), 500); return; }
  bridge.helper('uia.reply', id, text, sendLabel || '');
  setTimeout(() => { if (pendingUia.has(id)) onUia({ id, ok: false, detail: 'timeout' }); }, 6000);
}
function onUia(msg) {
  const cb = pendingUia.get(msg.id);
  if (!cb) return;
  pendingUia.delete(msg.id);
  cb(!!msg.ok, msg.detail || '');
}

// ------------------------------------------------------------------ calls
let callTimeout = null;
let demoCallTimer = null;

function pickAction(actions, kind) {
  const list = actions || [];
  const words = kind === 'accept' ? /accept|answer/i : /decline|reject|ignore/i;
  return list.find((a) => (kind === 'accept' ? /success/i : /critical/i).test(a.style || ''))
    || list.find((a) => words.test(`${a.content} ${a.args}`))
    || list[kind === 'accept' ? 0 : 1] || null;
}

function startCall(call) {
  state.call = call;
  state.expanded = null;
  if (state.settings.callsOverFullscreen !== false) bridge.attention(60000, 'call');
  edge('var(--green)', true);
  clearTimeout(callTimeout);
  callTimeout = setTimeout(() => { if (state.call === call && call.state === 'incoming') endCall(); }, 60000);
  present();
}

function onCallToast(msg) {
  if (!state.settings.modules.phoneCalls) return;
  const texts = msg.texts || [];
  const app = msg.app || {};
  const call = {
    id: String(msg.id), source: 'toast', toastId: msg.id, state: 'incoming', name: texts[0] || '', subtitle: texts[1] || '',
    phone: !!app.phone, appName: app.name || '', avatar: msg.avatarData || null,
    accept: pickAction(msg.actions, 'accept'), decline: pickAction(msg.actions, 'decline'),
    startedAt: 0, pending: null, error: false, removed: false, demo: !!msg.demo, hidden: false,
  };
  const imgs = msg.images || [];
  const logo = imgs.find((i) => i.placement === 'appLogoOverride') || imgs[0];
  if (!call.avatar && logo && logo.path) {
    bridge.invoke('image:data', logo.path).then((d) => { if (state.call === call && d) { call.avatar = d; present(); } }).catch(() => {});
  }
  startCall(call);
}

function onTelephony(p) {
  if (!state.settings.modules.phoneCalls) return;
  const c = state.call;
  if (p.isCancel) {
    if (c && c.source === 'kde') endCall();
    return;
  }
  if (p.event === 'ringing') {
    if (c && c.source === 'toast') return; // Phone Link shows the same call with an answer button
    startCall({
      id: `kde-${p.deviceId}-${p.phoneNumber || p.contactName}`, source: 'kde', deviceId: p.deviceId, state: 'incoming',
      name: p.contactName || p.phoneNumber, subtitle: p.phoneNumber && p.phoneNumber !== p.contactName ? p.phoneNumber : '',
      phone: true, avatar: p.thumbnail || null, startedAt: 0, demo: !!p.demo, hidden: false,
    });
  } else if (p.event === 'talking') {
    if (c && c.source === 'toast') return;
    if (c && c.source === 'kde') { c.state = 'active'; c.startedAt = c.startedAt || Date.now(); stopEdge(); bridge.attention(0); present(); }
    else {
      state.call = { id: `kde-${p.deviceId}-talk`, source: 'kde', deviceId: p.deviceId, state: 'active', name: p.contactName, phone: true, avatar: p.thumbnail, startedAt: Date.now(), hidden: false };
      present();
    }
  } else if (p.event === 'missedCall') {
    if (c && c.source === 'kde') endCall();
    const n = kdeNotif({ deviceId: p.deviceId, deviceName: p.deviceName, id: `missed-${Date.now()}`, appName: state.settings.language ? i18n.t('missedCall') : 'Missed call', title: p.contactName || p.phoneNumber, text: i18n.t('missedCall'), icon: p.thumbnail });
    addHistory(n);
    if (canShowNotification(n)) presentNotification(n);
  }
}

function endCall() {
  clearTimeout(callTimeout);
  clearTimeout(demoCallTimer);
  state.call = null;
  stopEdge();
  bridge.attention(0);
  if (state.expanded === 'callActive') state.expanded = null;
  present();
}

function onToastRemoved(id) {
  const c = state.call;
  if (!c || c.source !== 'toast' || String(c.toastId) !== String(id)) return;
  if (c.pending) { c.removed = true; return; }
  if (c.state === 'incoming') endCall();
}

function callAction(kind) {
  const c = state.call;
  if (!c) return;
  if (kind === 'dismiss') { endCall(); return; }
  if (kind === 'mute') {
    c.muted = true;
    if (!c.demo) bridge.phone('mute', { deviceId: c.deviceId });
    present();
    return;
  }
  if (kind === 'hide') { c.hidden = true; collapse(); return; }
  if (kind === 'accept' || kind === 'decline') {
    if (c.pending) return;
    c.pending = kind;
    c.error = false;
    present();
    const act = kind === 'accept' ? c.accept : c.decline;
    uia(kind, act && act.content, (ok) => {
      if (state.call !== c) return;
      c.pending = null;
      if (ok) {
        if (kind === 'accept') {
          c.state = 'active';
          c.startedAt = Date.now();
          stopEdge();
          bridge.attention(0);
          bump(0.6);
          if (c.demo) { clearTimeout(demoCallTimer); demoCallTimer = setTimeout(() => { if (state.call === c) endCall(); }, 20000); }
          present();
        } else {
          endCall();
        }
      } else if (c.removed) {
        endCall();
      } else {
        c.error = true;
        bridge.invoke('action', 'phonelink');
        shake();
        present();
        // never leave a call view stuck on screen
        setTimeout(() => { if (state.call === c && c.state === 'incoming') endCall(); }, 8000);
      }
    }, c.demo);
  } else if (kind === 'end') {
    uia('end', '', (ok) => {
      if (!ok && !c.demo) bridge.invoke('action', 'phonelink');
      endCall();
    }, c.demo);
  }
}

// ------------------------------------------------------------------ phone (KDE Connect)
function onPhone(p) {
  switch (p.type) {
    case 'devices': {
      const prev = phoneDevice();
      state.phone = { me: p.me, devices: p.devices || [] };
      const now = phoneDevice();
      if (prev && now && prev.id === now.id && prev.battery > 15 && now.battery !== null && now.battery <= 15 && !now.charging) {
        say(i18n.t('phoneBatteryLow', { p: i18n.num(now.battery) }), 'battery-low', 'red', 3500);
      }
      if (state.pair && !(p.devices || []).some((d) => d.id === state.pair.id && d.pairState === 'requestedByPeer')) {
        if (!state.pair.demo) { state.pair = null; bridge.attention(0); }
      }
      if (state.expanded === 'dashboard') present();
      break;
    }
    case 'media': onMedia(p, true); break;
    case 'notification': {
      const n = kdeNotif(p);
      addHistory(n, !p.silent);
      if (p.silent || !canShowNotification(n) || isDuplicate(n)) { present(); return; }
      presentNotification(n);
      break;
    }
    case 'notificationRemoved': {
      const id = `kde:${p.deviceId}:${p.id}`;
      state.notifQueue = state.notifQueue.filter((n) => n.id !== id);
      if (state.transient && state.transient.kind === 'notification' && state.transient.data.id === id) endTransient();
      break;
    }
    case 'telephony': onTelephony(p); break;
    case 'pairRequest':
      state.pair = { id: p.id, name: p.name, verifyKey: p.verifyKey, demo: !!p.demo };
      bridge.attention(25000);
      edge('var(--green)', true);
      present();
      break;
    case 'paired':
      if (state.pair && state.pair.id === p.id) state.pair = null;
      stopEdge();
      say(i18n.t('pairAccepted', { name: p.name }), 'blinkelo', 'green', 2800);
      break;
    case 'pairRejected': case 'pairTimeout': case 'pairFailed':
      if (state.pair && state.pair.id === p.id) { state.pair = null; stopEdge(); present(); }
      break;
    case 'ping':
      say(i18n.t('pingFrom', { name: p.name }), 'bell-ring', '', 2600);
      break;
    case 'findPc': onFindPc(p); break;
    case 'timer': onPhoneTimer(p); break;
    case 'timerList': state.sharedTimers = p.timers || []; present(); break;
    case 'received': onReceived(p); break;
    case 'transfer': onTransfer(p); break;
    case 'clipboard':
      say(i18n.t(p.kind === 'image' ? 'clipImageFromPhone' : 'clipFromPhone', { name: p.name || '' }), 'clipboard-check', 'green', 2200);
      break;
    case 'bluetooth':
      if (p.up) say(i18n.t('btConnected', { name: p.name || '' }), 'bluetooth', 'blue', 2600);
      break;
    case 'power':
      say(i18n.t(p.what === 'restart' ? 'pcRestarting' : 'pcShuttingDown', { name: p.name || '' }), 'power', 'red', 4800);
      break;
    case 'command':
      say(i18n.t('ranCommand', { name: p.name || '' }), 'zap', '', 2600);
      break;
    default: break;
  }
}

// ------------------------------------------------------------------ Blinkelo Link extras
let findTimer = null;
let findStopTimer = null;
function onFindPc(p) {
  clearTimeout(findTimer);
  clearTimeout(findStopTimer);
  if (!p.ringing) {
    state.findPc = null;
    stopEdge();
    present();
    return;
  }
  state.findPc = { name: p.name || '' };
  if (state.expanded) collapse(false);
  edge('var(--red)', true);
  present();
  setTimeout(shake, 200);
  const ring = () => {
    if (!state.findPc) return;
    chime('find');
    findTimer = setTimeout(ring, 1500);
  };
  ring();
  findStopTimer = setTimeout(() => { if (state.findPc) bridge.phone('stopFindPc'); }, 90000);
}

function onPhoneTimer(p) {
  if (p.state === 'running') {
    const sec = Math.max(1, Math.round((Number(p.remaining) || 0) / 1000));
    const tm = state.timer;
    if (!tm || tm.syncId === p.id || tm.kind === 'stopwatch' || !tm.running) {
      startTimer(sec, { syncId: p.id, label: p.label || '', origin: 'phone', duration: Math.round((Number(p.duration) || 0) / 1000) || sec });
      if (!tm || tm.syncId !== p.id) say(i18n.t('timerFromPhone', { name: p.from || '' }), 'smartphone', 'orange', 2200);
    } else {
      say(i18n.t('timerFromPhone', { name: p.from || '' }), 'smartphone', 'orange', 2600);
    }
    return;
  }
  // cancelled (or finished) on the phone
  if (state.timer && state.timer.syncId === p.id) {
    if (p.state === 'done') { timerFinished(); return; }
    state.timer = null;
    if (state.expanded === 'timer') state.expanded = null;
    present();
  } else if (p.state === 'done') {
    say(p.label || i18n.t('timer'), 'timer', 'orange', 4000);
    if (state.settings.sound) chime('timer');
  }
}

function timerSync(op) {
  const tm = state.timer;
  if (!tm || tm.kind !== 'timer' || !tm.syncId) return;
  bridge.phone('timer', { op, timer: { syncId: tm.syncId, label: tm.label || '', origin: tm.origin || 'pc', duration: tm.duration, endsAt: tm.endsAt } }).catch(() => {});
}

function onReceived(p) {
  if (p.kind === 'file') bridge.invoke('shelf:get').then((s) => { state.shelf = s || []; if (state.expanded === 'dashboard') present(); }).catch(() => {});
  if (state.expanded === 'dashboard' && state.tab === 'shelf' && p.kind === 'file') { present(); return; }
  if (state.expanded && state.expanded !== 'dashboard') collapse(false);
  showTransient('received', { ...p, id: `${Date.now()}` }, p.kind === 'file' ? 9000 : 6000);
  bump(0.5);
  if (state.settings.sound) chime('msg');
}

function onTransfer(p) {
  if (p.state === 'failed') { say(i18n.t('transferFailed', { name: p.name || '' }), 'triangle-alert', 'red', 3200); return; }
  if (p.state === 'done') {
    if (p.dir === 'out') say(i18n.t('sentToPhone', { name: p.name || '' }), 'check', 'green', 2200);
    else if (state.transient && state.transient.kind === 'transfer') endTransient();
    return;
  }
  const total = Number(p.total) || 0;
  // tiny files finish before a progress bar would even be readable
  if (total && total < 400 * 1024 && p.dir === 'in') return;
  showTransient('transfer', { ...p, total, done: Number(p.done) || 0 }, 4000);
}

function pairAction(accept) {
  const pr = state.pair;
  if (!pr) return;
  state.pair = null;
  stopEdge();
  bridge.attention(0);
  if (pr.demo) {
    if (accept) say(i18n.t('pairAccepted', { name: pr.name }), 'blinkelo', 'green', 2800); else present();
    return;
  }
  bridge.phone(accept ? 'accept' : 'reject', { id: pr.id });
  present();
}

// ------------------------------------------------------------------ timer
let ticker = null;
let chimeTimer = null;
let chimeCount = 0;

function startTimer(sec, opts = {}) {
  sec = clamp(Math.round(sec), 1, opts.syncId ? 365 * 86400 : 60 * 600);
  state.timer = {
    kind: 'timer', duration: opts.duration || sec, remaining: sec, endsAt: Date.now() + sec * 1000, running: true,
    syncId: opts.syncId || `pc-${Date.now().toString(36)}`, label: opts.label || '', origin: opts.origin || 'pc',
  };
  state.timerDone = null;
  stopChime();
  if (state.expanded === 'dashboard') collapse(false);
  if (state.timer.origin !== 'phone') timerSync('start');
  bump(0.5);
  present();
}

function startStopwatch() {
  state.timer = { kind: 'stopwatch', startedAt: Date.now(), accum: 0, running: true };
  state.timerDone = null;
  if (state.expanded === 'dashboard') collapse(false);
  bump(0.5);
  present();
}

function timerAction(act, arg) {
  const tm = state.timer;
  const now = Date.now();
  switch (act) {
    case 'timer.selectShared': {
      const selected = state.sharedTimers.find((t) => t.id === arg);
      if (selected) startTimer(Math.max(1, (selected.endsAt - now) / 1000), {syncId:selected.id,label:selected.label,origin:'phone',duration:selected.duration/1000});
      return;
    }
    case 'timer.cancelShared':
      bridge.phone('timer', {op:'stop',timer:{syncId:arg}}).catch(() => {});
      if (tm?.syncId === arg) state.timer = null;
      present(); return;
    case 'timer.start': startTimer(Number(arg) || 60); return;
    case 'stopwatch.start': startStopwatch(); return;
    case 'timer.toggle':
      if (!tm) return;
      if (tm.running) {
        if (tm.kind === 'timer') { tm.remaining = Math.max(0, (tm.endsAt - now) / 1000); timerSync('pause'); }
        else tm.accum += (now - tm.startedAt) / 1000;
        tm.running = false;
      } else {
        if (tm.kind === 'timer') { tm.endsAt = now + tm.remaining * 1000; tm.running = true; timerSync('start'); }
        else tm.startedAt = now;
        tm.running = true;
      }
      break;
    case 'timer.add':
      if (!tm || tm.kind !== 'timer') return;
      tm.duration += 60;
      if (tm.running) { tm.endsAt += 60000; timerSync('start'); } else tm.remaining += 60;
      bump(0.3);
      break;
    case 'timer.reset':
      if (!tm) return;
      tm.accum = 0; tm.startedAt = now;
      break;
    case 'timer.stop':
      timerSync('stop');
      state.timer = null;
      if (state.expanded === 'timer') state.expanded = null;
      break;
    case 'timer.again': {
      const d = state.timerDone ? state.timerDone.duration : 60;
      state.timerDone = null;
      stopChime();
      stopEdge();
      startTimer(d);
      return;
    }
    case 'timer.dismiss':
      state.timerDone = null;
      stopChime();
      stopEdge();
      bridge.attention(0);
      break;
    default: break;
  }
  present();
}

function timerFinished() {
  timerSync('done');
  const d = state.timer.duration;
  const label = state.timer.label || '';
  state.timer = null;
  if (state.expanded === 'timer' || state.expanded === 'dashboard') state.expanded = null;
  state.timerDone = { duration: d, label };
  bridge.attention(60000);
  edge('var(--orange)', true);
  present();
  setTimeout(shake, 250);
  chimeCount = 0;
  const ring = () => {
    if (!state.timerDone || chimeCount >= 8) return;
    chimeCount += 1;
    if (state.settings.sound) chime('timer');
    chimeTimer = setTimeout(ring, 2600);
  };
  ring();
  setTimeout(() => { if (state.timerDone && state.timerDone.duration === d) timerAction('timer.dismiss'); }, 60000);
}

function stopChime() { clearTimeout(chimeTimer); chimeTimer = null; }

function tick() {
  const tm = state.timer;
  if (tm && tm.kind === 'timer' && tm.running && Date.now() >= tm.endsAt) { timerFinished(); return; }
  // self-heal: an input that vanished with its view must not keep the window in interactive mode
  if (state.inputFocused && !stage.querySelector('input:focus')) {
    state.inputFocused = false;
    bridge.setFocus(false);
  }
  syncInteractive();
  if (!state.sliderDrag) present();
}

// ------------------------------------------------------------------ interaction (clicks, sliders, forms, drag & drop, move)
function currentNotif() { return state.expandedNotif; }

function doAction(act, arg, el) {
  if (act.startsWith('media.')) { mediaCommand(act); return; }
  if (act.startsWith('timer.') || act === 'stopwatch.start') { timerAction(act, arg); return; }
  switch (act) {
    case 'volume.toggleMute':
      state.volume.muted = !state.volume.muted;
      bridge.helper('volume.toggleMute');
      present();
      break;
    case 'dashboard': openDashboard(); break;
    case 'tab':
      if (state.homeEdit && arg !== 'home') setHomeEdit(false);
      state.tab = arg;
      if (state.expanded !== 'dashboard') expand('dashboard');
      refreshTabData(arg);
      present();
      break;
    case 'pin': state.pinned = !state.pinned; present(); break;
    case 'subs.open': if (subsOn()) { expand('subs'); bridge.attention(20000); } break;
    case 'subs.close': collapse(); break;
    case 'subs.lang': subsCommand('search', { lang: arg }); break;
    case 'subs.choose': subsCommand('choose', { id: arg }); break;
    case 'subs.retry': subsCommand('search', {}); break;
    case 'subs.reveal': subsCommand('reveal'); break;
    case 'subs.settings':
      bridge.invoke('action', 'settings', 'subtitles').catch(() => {});
      collapse();
      break;
    case 'minimize':
      collapse();
      bridge.invoke('action', 'minimize').catch(() => {});
      break;
    case 'action':
      bridge.invoke('action', arg, el && el.dataset.arg2).catch(() => {});
      if (arg !== 'phonelink' || state.expanded === 'dashboard') collapse();
      break;
    case 'app.launch': {
      bridge.invoke('shortcuts:launch', arg).catch(() => {});
      // keys that act on the current app (shortcut, media, typing...) keep the deck open so they can be pressed again
      const key = state.shortcuts.find((x) => x.id === arg);
      const stay = key && ['hotkey', 'media', 'text', 'command'].includes(key.kind);
      const cls = stay ? 'fired' : 'flash';
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      if (stay) setTimeout(() => el.classList.remove(cls), 520);
      else setTimeout(() => collapse(), 260);
      break;
    }
    case 'home.edit': if (state.tab !== 'home') state.tab = 'home'; setHomeEdit(true); present(); break;
    case 'home.done': setHomeEdit(false); present(); break;
    case 'home.reset': saveSettings({ home: { layout: [], custom: false } }); present(); break;
    case 'home.remove': saveHome(HOME.removeTile(HOME.normalize(state.settings.home), arg)); present(); break;
    case 'home.add': {
      const next = HOME.addTile(HOME.normalize(state.settings.home), arg);
      clearTimeout(homeHintTimer);
      if (next) {
        state.homeNoRoom = false;
        state.homeNew = arg;
        saveHome(next);
        homeHintTimer = setTimeout(() => { state.homeNew = null; }, 600);
      } else {
        state.homeNoRoom = true;
        homeHintTimer = setTimeout(() => { state.homeNoRoom = false; present(); }, 2600);
      }
      present();
      break;
    }
    case 'phone.find': {
      const dev = phoneDevice();
      if (dev) { bridge.phone('find', { deviceId: dev.id }); say(i18n.t('phoneRinging'), 'bell-ring', 'green', 2400); }
      break;
    }
    case 'phone.clip': {
      const dev = phoneDevice();
      if (!dev) break;
      bridge.phone('sendClipboard', { deviceId: dev.id }).then((ok) => say(i18n.t(ok ? 'clipSentToPhone' : 'actionFailed'), ok ? 'clipboard-check' : 'triangle-alert', ok ? 'green' : 'red', 2200)).catch(() => {});
      break;
    }
    case 'phone.camera': {
      const dev = phoneDevice();
      if (!dev) break;
      bridge.phone('camera', { deviceId: dev.id });
      say(i18n.t('cameraAsked', { name: dev.name }), 'camera', 'blue', 3000);
      break;
    }
    case 'phone.sendFile': {
      const dev = phoneDevice();
      if (dev) bridge.phone('pickAndSend', { deviceId: dev.id }).catch(() => {});
      break;
    }
    case 'shelf.toPhone': {
      const dev = phoneDevice();
      if (dev && arg) bridge.phone('sendFiles', { deviceId: dev.id, paths: [arg] }).catch(() => {});
      break;
    }
    case 'findpc.stop':
      bridge.phone('stopFindPc');
      state.findPc = null;
      clearTimeout(findTimer);
      stopEdge();
      present();
      break;
    case 'recv.open': case 'recv.show': {
      const tr = state.transient;
      const d = tr && tr.kind === 'received' ? tr.data : null;
      if (d && d.path) bridge.phone('openReceived', { path: d.path, reveal: act === 'recv.show' });
      else if (d && d.url) bridge.invoke('action', 'openUrl', d.url).catch(() => {});
      endTransient();
      break;
    }
    case 'recv.close': endTransient(); break;
    case 'gsum.close': endTransient(); break;
    case 'game.launch': {
      const g = (state.gameLib || []).find((x) => x.id === arg);
      if (!g || (state.gaming && state.gaming.launching)) break;
      if (state.gaming) state.gaming = { ...state.gaming, launching: g.id };
      present();
      bridge.invoke('gaming:cmd', 'launch', { id: g.id }).then((r) => {
        if (state.gaming) state.gaming = { ...state.gaming, launching: null };
        collapse();
        showTransient('gameLaunch', { id: g.id, name: g.name, icon: g.icon, ok: !!(r && r.ok) }, r && r.ok ? 4500 : 6000);
      }).catch(() => { if (state.gaming) state.gaming = { ...state.gaming, launching: null }; present(); });
      break;
    }
    case 'game.add':
      bridge.invoke('gaming:cmd', 'addGame', {}).then((lib) => { if (Array.isArray(lib)) { state.gameLib = lib; present(); } }).catch(() => {});
      break;
    case 'game.toggle': gamingCommand('toggle'); break;
    case 'game.optimize': gamingCommand('optimize'); break;
    case 'game.restore': gamingCommand('restore'); break;
    case 'game.hud': gamingCommand('hud'); break;
    case 'game.end': gamingCommand('end'); break;
    case 'game.mark': gamingCommand('markGame', { name: arg }); break;
    case 'game.allowFps':
      el.classList.add('busy');
      bridge.invoke('gaming:cmd', 'allowFps', {}).then((r) => {
        el.classList.remove('busy');
        state.gamingNote = { ok: !!(r && r.ok), key: r && r.ok ? 'gmSignOut' : 'gmAllowFail', until: Date.now() + 15000 };
        present();
        setTimeout(present, 15100);
      }).catch(() => el.classList.remove('busy'));
      break;
    case 'game.settings':
      bridge.invoke('action', 'settings', 'gaming').catch(() => {});
      collapse();
      break;
    case 'notif.open': openNotifApp(currentNotif()); collapse(); break;
    case 'notif.dismiss': collapse(); break;
    case 'notif.phoneDismiss': {
      const n = currentNotif();
      if (n && n.source === 'kde' && !n.demo) bridge.phone('notifDismiss', { deviceId: n.deviceId, id: n.kdeId });
      collapse();
      break;
    }
    case 'notif.action': {
      const n = currentNotif();
      const acts = (n && n.actions ? n.actions : []).filter((a) => !a.inputId && a.content && a.placement !== 'contextMenu');
      const a = acts[Number(arg)];
      if (!a) return;
      el.classList.add('busy');
      const done = (ok) => {
        state.notifStatus = { ok, text: ok ? i18n.t('actionDone') : i18n.t('actionFailed') };
        present();
        if (ok) setTimeout(() => { if (state.expandedNotif === n) collapse(); }, 1100);
        else openNotifApp(n);
      };
      if (n.source === 'kde') {
        if (!n.demo) bridge.phone('notifAction', { deviceId: n.deviceId, id: n.kdeId, action: a.content });
        done(true);
      } else uia('button', a.content, done, n.demo);
      break;
    }
    case 'call.accept': callAction('accept'); break;
    case 'call.decline': callAction('decline'); break;
    case 'call.end': callAction('end'); break;
    case 'call.hide': callAction('hide'); break;
    case 'call.mute': callAction('mute'); break;
    case 'call.dismiss': callAction('dismiss'); break;
    case 'pair.accept': pairAction(true); break;
    case 'pair.reject': pairAction(false); break;
    case 'alerts.clear': clearAlerts(); break;
    case 'alerts.dismiss': dismissAlert(arg); break;
    case 'widget':
      saveSettings({ widgets: { ...(state.settings.widgets || {}), active: arg } });
      present();
      break;
    case 'widget.refresh': bridge.invoke('widgets:refresh', arg).catch(() => {}); break;
    case 'openUrl':
      if (/^https?:\/\//i.test(arg || '')) bridge.invoke('action', 'openUrl', arg).catch(() => {});
      el.classList.add('flash');
      break;
    case 'cal.prev': case 'cal.next': {
      const pl = plannerState();
      pl.ym = shiftYm(pl.ym, act === 'cal.next' ? 1 : -1);
      present();
      break;
    }
    case 'cal.today': {
      const pl = plannerState();
      pl.sel = isoOf(new Date());
      pl.ym = currentYm();
      present();
      break;
    }
    case 'cal.pick': {
      const pl = plannerState();
      pl.sel = arg;
      pl.ym = ymOfIso(arg);
      present();
      break;
    }
    case 'task.toggle': {
      const tk = state.tasks.find((x) => x.id === arg);
      if (!tk) return;
      tk.done = !tk.done;
      present();
      bridge.invoke('tasks:update', arg, { done: tk.done }).catch(() => {});
      if (tk.done && state.settings.sound) chime('done');
      break;
    }
    case 'task.remove':
      state.tasks = state.tasks.filter((x) => x.id !== arg);
      present();
      bridge.invoke('tasks:remove', arg).catch(() => {});
      break;
    case 'alerts.open': {
      const n = state.notifHistory.find((x) => x.id === arg);
      if (n) { state.expandedNotif = n; state.notifStatus = null; state.expanded = 'notification'; bridge.stats(false); present(); }
      break;
    }
    case 'shelf.open': bridge.invoke('shelf:open', arg); break;
    case 'shelf.remove': bridge.invoke('shelf:remove', arg).then((s) => { state.shelf = s || []; present(); }); break;
    case 'shelf.clear': bridge.invoke('shelf:clear').then(() => { state.shelf = []; present(); }); break;
    case 'clip.copy':
      bridge.invoke('clipboard:write', arg).then(() => {
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 500);
      });
      break;
    case 'clip.clear': bridge.invoke('clipboard:clear').then(() => { state.clipHistory = []; present(); }); break;
    default: break;
  }
}

function onIslandClick() {
  switch (currentMain) {
    case 'idle': case 'handle':
      if (state.settings.minimized && currentMain === 'handle') { setHover(true); return; }
      openDashboard();
      break;
    case 'media': case 'track': expand('media'); break;
    case 'timer': expand('timer'); break;
    case 'callActive': expand('callActive'); break;
    case 'notification': expand('notification'); break;
    case 'subsReady': endTransient(); expand('subs'); break;
    case 'volume': case 'keys': case 'battery': case 'copied': case 'message': case 'privacy':
      endTransient(); break;
    default: break;
  }
}

function onBubbleClick() {
  if (currentBubble === 'timerMini') expand('timer');
  else if (currentBubble === 'mediaMini') expand('media');
  else if (currentBubble === 'subsMini') expand('subs');
}

let suppressClick = false;
let handledOnUpAt = 0;

function activate(target, e) {
  const actEl = target.closest('[data-act]');
  if (actEl && !actEl.disabled) {
    if (actEl.closest('.leaving')) return;
    if (e) e.stopPropagation();
    doAction(actEl.dataset.act, actEl.dataset.arg, actEl);
    return;
  }
  if (target.closest('input, form, .slider, .prog')) return;
  if (target.closest('#mainClip')) onIslandClick();
  else if (target.closest('#bubbleClip')) onBubbleClick();
}

stage.addEventListener('click', (e) => {
  if (suppressClick) { suppressClick = false; e.stopPropagation(); return; }
  if (Date.now() - handledOnUpAt < 400) return; // already handled by the release fallback below
  activate(e.target, e);
});

// Safety net for Windows: if the system swallowed the button-down (no pointerdown/mousedown reached us),
// a left release on the island still works as a click. Normal clicks never take this path.
let lastDownAt = 0;
let upOnlyCount = 0;
document.addEventListener('pointerdown', () => { lastDownAt = Date.now(); }, true);
document.addEventListener('mousedown', () => { lastDownAt = Date.now(); }, true);
document.addEventListener('mouseup', (e) => {
  if (e.button !== 0 || Date.now() - lastDownAt < 2000) return;
  if (!e.target.closest || !e.target.closest('#mainClip, #bubbleClip')) return;
  upOnlyCount += 1;
  if (bridge.diag) bridge.diag({ kind: 'release-without-press', view: currentMain, count: upOnlyCount });
  handledOnUpAt = Date.now();
  const input = e.target.closest('input');
  if (input) {
    state.inputFocused = true;
    syncInteractive(true);
    bridge.setFocus(true);
    setTimeout(() => input.focus(), 80);
    return;
  }
  const sl = e.target.closest('[data-slider]');
  if (sl) {
    const r = sl.getBoundingClientRect();
    const p = clamp((e.clientX - r.left) / r.width, 0, 1);
    if (sl.dataset.slider === 'volume') { state.volume.level = p; bridge.helper('volume.set', String(p)); present(); }
    else if (state.media && state.media.duration && state.media.canSeek !== false) seekMedia(p * state.media.duration);
    return;
  }
  activate(e.target, null);
}, true);

stage.addEventListener('auxclick', (e) => {
  if (e.button === 1 && state.media) { e.preventDefault(); mediaCommand('media.toggle'); }
});

stage.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (state.call && state.call.state === 'incoming') { callAction(state.call.source === 'kde' ? 'dismiss' : 'decline'); return; }
  if (state.timerDone) { timerAction('timer.dismiss'); return; }
  if (state.expanded === 'dashboard') collapse(); else openDashboard();
});

const wheelVolume = throttle((delta) => bridge.helper('volume.delta', String(delta)), 40);
stage.addEventListener('wheel', (e) => {
  // real scrolling lists keep the wheel; a scrolling song / video title (.marquee.scroll) does not
  if (e.target.closest('.scroll:not(.marquee)')) return;
  if (!state.settings.modules.volumeHud) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.04 : -0.04;
  state.volume.level = clamp(state.volume.level + delta, 0, 1);
  if (delta > 0) state.volume.muted = false;
  wheelVolume(delta);
  if (state.expanded === 'media') present();
  else if (!state.expanded) showTransient('volume', {}, 1600);
}, { passive: false });

// fast hover: forwarded mouse moves (while the window is click-through) tell main to become clickable at once
const hitIfInside = throttle((x, y) => {
  if (state.hover) return;
  if (lastRects.some((r) => x >= r.x - 2 && x <= r.x + r.w + 2 && y >= r.y - 2 && y <= r.y + r.h + 2)) bridge.hit();
}, 25);
document.addEventListener('mousemove', (e) => hitIfInside(e.clientX, e.clientY));

// sliders, inputs and drag-to-move all start here
const setVolumeThrottled = throttle((v) => bridge.helper('volume.set', String(v)), 50);
stage.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const input = e.target.closest('input');
  if (input) {
    state.inputFocused = true;
    syncInteractive(true);
    bridge.setFocus(true);
    setTimeout(() => input.focus(), 60);
    return;
  }
  const tile = state.homeEdit ? e.target.closest('.h-tile') : null;
  if (tile) {
    if (!e.target.closest('[data-act]')) startTileDrag(e, tile, !!e.target.closest('.h-resize'));
    return;
  }
  const sl = e.target.closest('[data-slider]');
  if (sl) { startSlider(e, sl); return; }
  // drag to move the island (not on buttons, lists or files)
  if (state.settings.movable && e.target.closest('#mainClip, #bubbleClip') && !e.target.closest('button, [data-act], [data-drag], [data-subdrag], .scroll:not(.marquee), form, a')) {
    startMovePending(e);
  }
});

function startSlider(e, sl) {
  const kind = sl.dataset.slider;
  if (kind === 'seek' && (!state.media || !state.media.duration)) return;
  e.preventDefault();
  e.stopPropagation();
  sl.setPointerCapture(e.pointerId);
  state.sliderDrag = true;
  syncInteractive(true);
  sl.classList.add('dragging');
  const apply = (ev) => {
    const r = sl.getBoundingClientRect();
    const p = clamp((ev.clientX - r.left) / r.width, 0, 1);
    if (kind === 'volume') {
      state.volume.level = p;
      state.volume.muted = p === 0 ? state.volume.muted : false;
      setVolumeThrottled(p);
      if (state.transient && state.transient.kind === 'volume') state.transient.until = Date.now() + 1800;
    } else {
      state.seekPreview = p * state.media.duration;
    }
    presentNow();
  };
  apply(e);
  const move = (ev) => apply(ev);
  const up = () => {
    sl.removeEventListener('pointermove', move);
    sl.removeEventListener('pointerup', up);
    sl.removeEventListener('pointercancel', up);
    sl.removeEventListener('lostpointercapture', up);
    sl.classList.remove('dragging');
    state.sliderDrag = false;
    syncInteractive();
    if (kind === 'seek' && state.seekPreview !== null && state.media) {
      const sec = state.seekPreview;
      state.seekPreview = null;
      seekMedia(sec);
    }
    if (kind === 'volume') setVolumeThrottled(state.volume.level);
    present();
  };
  sl.addEventListener('pointermove', move);
  sl.addEventListener('pointerup', up);
  sl.addEventListener('pointercancel', up);
  sl.addEventListener('lostpointercapture', up);
}

function startMovePending(e) {
  const target = e.target.closest('#mainClip, #bubbleClip');
  const sx = e.screenX; const sy = e.screenY;
  let moving = false;
  try { target.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  const move = (ev) => {
    if (!moving && Math.hypot(ev.screenX - sx, ev.screenY - sy) > 6) {
      moving = true;
      state.moving = true;
      syncInteractive(true);
      document.body.classList.add('moving');
      bridge.drag('start');
    }
  };
  const up = () => {
    target.removeEventListener('pointermove', move);
    target.removeEventListener('pointerup', up);
    target.removeEventListener('pointercancel', up);
    target.removeEventListener('lostpointercapture', up);
    if (moving) {
      bridge.drag('end');
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 80);
      state.moving = false;
      document.body.classList.remove('moving');
      syncInteractive();
      present();
    }
  };
  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', up);
  target.addEventListener('pointercancel', up);
  target.addEventListener('lostpointercapture', up);
}

stage.addEventListener('focusin', (e) => {
  if (e.target.matches('input')) { state.inputFocused = true; syncInteractive(true); }
});
stage.addEventListener('focusout', (e) => {
  if (e.target.matches('input')) {
    setTimeout(() => {
      if (!stage.querySelector('input:focus')) {
        state.inputFocused = false;
        syncInteractive();
        bridge.setFocus(false);
        if (!state.hover && state.expanded && !state.pinned) collapse();
      }
    }, 150);
  }
});

stage.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  if (form.dataset.form === 'timer') {
    const min = Number(form.elements.min.value);
    if (min > 0) startTimer(min * 60);
    bridge.setFocus(false);
  } else if (form.dataset.form === 'task') {
    const title = form.elements.title.value.trim();
    if (!title) return;
    const time = form.elements.time.value || null;
    const pl = plannerState();
    bridge.invoke('tasks:add', { title, date: pl.sel, time }).then((tk) => {
      if (tk && !state.tasks.some((x) => x.id === tk.id)) { state.tasks = [...state.tasks, tk]; present(); }
    }).catch(() => {});
    form.elements.title.value = '';
    form.elements.time.value = '';
    setTimeout(() => { const i = stage.querySelector('form[data-form="task"] input[name="title"]'); if (i) i.focus(); }, 60);
  } else if (form.dataset.form === 'subs') {
    const q = form.elements.q.value.trim();
    if (q) subsCommand('search', { query: q });
    const f = form.elements.q;
    if (f) f.blur();
    bridge.setFocus(false);
  } else if (form.dataset.form === 'reply') {
    const n = currentNotif();
    const text = form.elements.reply.value.trim();
    if (!text || !n) return;
    form.classList.add('busy');
    const done = (ok) => {
      state.notifStatus = { ok, text: ok ? i18n.t('sent') : i18n.t('replyFailed') };
      if (!ok) openNotifApp(n);
      present();
      if (ok) setTimeout(() => { if (state.expandedNotif === n) collapse(); }, 1200);
    };
    if (n.source === 'kde') {
      if (!n.demo) bridge.phone('notifReply', { deviceId: n.deviceId, replyId: n.replyId, message: text }).then((r) => done(!!r)).catch(() => done(false));
      else done(true);
    } else {
      const input = (n.inputs || []).find((i) => i.type !== 'selection');
      const sendAct = input ? (n.actions || []).find((a) => a.inputId === input.id) : null;
      uiaReply(text, sendAct && sendAct.content, done, n.demo);
    }
  }
});

stage.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { bridge.setFocus(false); collapse(); }
});

// drag files out of the island: shelf items, and the subtitle onto a video player
let outDragTimer = null;
function beginOutDrag() {
  state.outDrag = true;
  clearTimeout(outDragTimer);
  outDragTimer = setTimeout(() => { state.outDrag = false; }, 20000);
}
function endOutDrag() {
  clearTimeout(outDragTimer);
  if (!state.outDrag) return;
  state.outDrag = false;
  state.dragOver = false;
  syncInteractive();
  present();
}
stage.addEventListener('dragstart', (e) => {
  const sd = e.target.closest('[data-subdrag]');
  if (sd) {
    e.preventDefault();
    if (!state.subs || !state.subs.file) return;
    beginOutDrag();
    if (state.subs.demo || !bridge.subsDrag) { setTimeout(endOutDrag, 300); return; }
    bridge.subsDrag();
    return;
  }
  const f = e.target.closest('[data-drag]');
  if (!f) return;
  e.preventDefault();
  beginOutDrag();
  bridge.startDrag(f.dataset.drag);
});
bridge.on('dragDone', () => {
  const wasSub = state.transient && state.transient.kind === 'subsReady';
  endOutDrag();
  if (wasSub) endTransient();
});
// fallback when no "done" arrives: the first plain mouse move after the drop
document.addEventListener('pointermove', (e) => { if (state.outDrag && e.buttons === 0) setTimeout(() => { if (state.outDrag) endOutDrag(); }, 600); }, true);

// drop files onto the island
let dragTimer = null;
function hasFiles(e) { return e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files'); }
window.addEventListener('dragover', (e) => {
  if (state.outDrag) { e.preventDefault(); e.dataTransfer.dropEffect = 'none'; return; } // our own file passing over the island
  if (!hasFiles(e) || !state.settings.modules.shelf) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  if (!state.dragOver) { state.dragOver = true; syncInteractive(true); present(); }
  clearTimeout(dragTimer);
  dragTimer = setTimeout(() => { state.dragOver = false; syncInteractive(); present(); }, 220);
});
window.addEventListener('drop', async (e) => {
  if (!hasFiles(e)) return;
  e.preventDefault();
  if (state.outDrag) return;
  clearTimeout(dragTimer);
  const toApps = state.expanded === 'dashboard' && state.tab === 'apps';
  state.dragOver = false;
  syncInteractive();
  const paths = Array.from(e.dataTransfer.files).map((f) => bridge.pathForFile(f)).filter(Boolean);
  if (!paths.length) { present(); return; }
  if (toApps) {
    await bridge.invoke('shortcuts:addPaths', paths).catch(() => 0);
    refreshTabData('apps');
    return;
  }
  state.shelf = (await bridge.invoke('shelf:add', paths)) || state.shelf;
  say(i18n.t('added', { n: i18n.num(paths.length) }), 'folder-open', '', 2200);
  edge('var(--accent)');
});

// browser preview: DOM hover stands in for the main-process cursor polling
if (IS_DEMO) {
  for (const el of [els.mainClip, els.bubbleClip]) {
    el.addEventListener('mouseenter', () => setHover(true));
    el.addEventListener('mouseleave', (e) => {
      if (e.relatedTarget && (els.mainClip.contains(e.relatedTarget) || els.bubbleClip.contains(e.relatedTarget))) return;
      setHover(false);
    });
  }
}

// ------------------------------------------------------------------ helper / main-process events
function onHelper(msg) {
  switch (msg.type) {
    case 'media': onMedia(msg, false); break;
    case 'player': onPlayer(msg); break;
    case 'meter': state.meter = { p: msg.p, l: msg.l, r: msg.r, at: performance.now() }; break;
    case 'volume': {
      const prev = state.volume;
      const changed = !state.volumeKnown || Math.abs(prev.level - msg.level) > 0.003 || prev.muted !== msg.muted;
      const wasKnown = state.volumeKnown;
      state.volume = { level: msg.level, muted: msg.muted };
      state.volumeKnown = true;
      if (wasKnown && changed && !msg.initial && state.settings.modules.volumeHud && !state.sliderDrag) showTransient('volume', {}, 1700);
      else present();
      break;
    }
    case 'battery': {
      const prev = state.battery;
      state.battery = msg;
      if (prev && msg.has && state.settings.modules.battery) {
        if (prev.plugged !== msg.plugged) {
          showTransient('battery', { kind: 'plug' }, 3200);
          if (msg.plugged) edge('var(--green)');
        } else if (!msg.plugged && ((prev.percent > 20 && msg.percent <= 20) || (prev.percent > 10 && msg.percent <= 10))) {
          showTransient('battery', { kind: 'low' }, 4500);
          edge('var(--red)');
        }
      }
      break;
    }
    case 'keys':
      if (!msg.initial && msg.changed) {
        const which = msg.changed;
        if ((which === 'caps' && state.settings.modules.capsLock) || (which === 'num' && state.settings.modules.numLock)) {
          showTransient('keys', { which, on: which === 'caps' ? msg.caps : msg.num }, 1500);
        }
      }
      state.keys = msg;
      break;
    case 'privacy': {
      const prev = state.privacy;
      state.privacy = { mic: msg.mic || [], cam: msg.cam || [], loc: msg.loc || [] };
      if (state.privacyKnown && state.settings.modules.privacy) {
        const newMic = state.privacy.mic.find((a) => !prev.mic.includes(a));
        const newCam = state.privacy.cam.find((a) => !prev.cam.includes(a));
        if (newCam) showTransient('privacy', { kind: 'cam', app: newCam }, 2600);
        else if (newMic) showTransient('privacy', { kind: 'mic', app: newMic }, 2600);
      }
      state.privacyKnown = true;
      present();
      break;
    }
    case 'fullscreen': state.fullscreen = !!msg.busy; state.quiet = !!msg.quiet; break;
    case 'net': state.net = { down: msg.down, up: msg.up }; if (state.expanded === 'dashboard') present(); break;
    case 'toast': onToast(msg); break;
    case 'toastRemoved': onToastRemoved(msg.id); break;
    case 'toastHistory': onToastHistory(msg.items); break;
    case 'uia': onUia(msg); break;
    default: break;
  }
}

let lastVisualSig = '';
function applySettings(s) {
  if (!s) return;
  state.settings = { ...state.settings, ...s, modules: { ...state.settings.modules, ...(s.modules || {}) } };
  document.documentElement.lang = i18n.lang();
  document.body.classList.toggle('notch', isNotch());
  document.body.classList.toggle('no-glow', !state.settings.glow);
  document.body.classList.toggle('theme-glass', state.settings.theme === 'glass');
  document.body.classList.toggle('moved', !!state.settings.position);
  document.body.dataset.lang = i18n.lang();
  document.documentElement.style.setProperty('--s', String(scale()));
  document.documentElement.style.setProperty('--tp', String(clamp(Number(state.settings.transparency) || 0, 0, 90) / 100));
  // only rebuild the views when something they render changed (not for e.g. a widget switch)
  const ss = state.settings;
  const sig = JSON.stringify([ss.language, ss.style, ss.scale, ss.topOffset, ss.idleClock, ss.modules, ss.media, ss.notifications]);
  if (sig !== lastVisualSig) {
    lastVisualSig = sig;
    slots.main.key = null;
    slots.bubble.key = null;
  }
  lastRectsJson = '';
  if (!state.settings.modules.visualizer) bridge.helper('audio.meter', '0');
  if (peek.busy && peek.kind === 'random' && blinkCfg().peeks !== true) cancelPeek();
  queueHello();
  present();
}

// frosted glass: main sends a tiny pre-blurred wallpaper; it is stretched to the screen size and anchored to the
// island's top-centre, so it lines up with the desktop behind an island in its usual place.
function applyBackdrop(url) {
  const st = document.documentElement.style;
  if (url) {
    st.setProperty('--glass-img', `url("${url}")`);
    st.setProperty('--glass-w', `${Math.max(window.screen.width || 0, 800)}px`);
    st.setProperty('--glass-h', `${Math.max(window.screen.height || 0, 500)}px`);
  } else {
    st.removeProperty('--glass-img');
    st.removeProperty('--glass-w');
    st.removeProperty('--glass-h');
  }
}

function applyAccent(color) {
  if (color) document.documentElement.style.setProperty('--accent', color);
}

// ------------------------------------------------------------------ demo scenarios (tray "Try it" menu, settings "Try it" + browser preview)
function runDemo(kind) {
  const p = demoPayload(kind, 0, i18n.lang());
  switch (kind) {
    case 'blink':
      if (currentMain === 'idle' && !state.hover) { cancelPeek(); runPeek('hello', true); }
      else say(i18n.t('blinkHi'), 'blinkelo', '', 2800);
      break;
    case 'music': onMedia({ ...p, demo: true }, false); break;
    case 'video':
      onPlayer({ type: 'player', present: true, app: 'VLC', exe: 'vlc.exe', title: 'Interstellar.2014.1080p.BluRay', playing: true });
      clearTimeout(demoVideoTimer);
      demoVideoTimer = setTimeout(() => onPlayer({ type: 'player', present: false }), 30000);
      break;
    case 'message': onToast({ ...p, demo: true }); break;
    case 'call':
      onCallToast({ ...p, demo: true });
      clearTimeout(demoCallTimer);
      demoCallTimer = setTimeout(() => { if (state.call && state.call.demo && state.call.state === 'incoming') endCall(); }, 25000);
      break;
    case 'timer': startTimer(12); break;
    case 'stopwatch': startStopwatch(); break;
    case 'charging':
      state.battery = { has: true, plugged: false, charging: false, percent: 64 };
      onHelper({ type: 'battery', has: true, plugged: true, charging: true, percent: 64 });
      break;
    case 'volume':
      state.volumeKnown = true;
      onHelper({ type: 'volume', level: clamp(state.volume.level + 0.12 > 1 ? 0.3 : state.volume.level + 0.12, 0, 1), muted: false });
      break;
    case 'caps': onHelper({ type: 'keys', caps: !(state.keys && state.keys.caps), num: true, changed: 'caps' }); break;
    case 'copied': onClipboard({ item: { id: `d${Date.now()}`, kind: 'text', text: 'https://github.com/SaeedSH/blinkelo', time: Date.now() }, history: state.clipHistory }); break;
    case 'privacy':
      state.privacyKnown = true;
      onHelper({ type: 'privacy', mic: ['Zoom'], cam: [], loc: [] });
      setTimeout(() => onHelper({ type: 'privacy', mic: [], cam: [], loc: [] }), 9000);
      break;
    case 'weather':
      if (!state.weather || !state.weather.current) state.weather = { ...p, demo: true };
      openDashboard(false, 'weather');
      break;
    case 'pair':
      onPhone({ type: 'pairRequest', id: 'demo-phone', name: 'Galaxy S24', verifyKey: '7F3A9C21', demo: true });
      setTimeout(() => { if (state.pair && state.pair.demo) { state.pair = null; stopEdge(); bridge.attention(0); present(); } }, 25000);
      break;
    case 'dashboard': openDashboard(); break;
    case 'reminder': {
      const now = new Date();
      onReminder({ id: `demo${now.getTime()}`, title: i18n.t('t_reminder'), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` });
      break;
    }
    case 'planner': openDashboard(false, 'planner'); break;
    case 'findpc': onFindPc({ ringing: true, name: 'Galaxy S24' }); break;
    case 'subs': startDemoSubs(); break;
    case 'gaming': showTransient('gameSummary', { id: `demo${Date.now()}`, name: 'cyberpunk2077', title: 'Cyberpunk 2077', dur: 5412, avgFps: 118, low1: 74, maxCpuTemp: 78, maxGpuTemp: 83, temp: gmCfg().temp }, 12000); bump(0.6); edge('var(--purple)'); break;
    case 'received': onReceived({ type: 'received', kind: 'file', file: 'IMG_20261108_142233.jpg', size: 3481221, image: true, name: 'Galaxy S24', path: '' }); break;
    case 'receivedLink': onReceived({ type: 'received', kind: 'url', url: 'https://github.com/SaeedSH/blinkelo', opened: true, name: 'Galaxy S24' }); break;
    case 'transfer': onTransfer({ dir: 'out', tid: 'demo', name: 'Presentation-final.pptx', done: 6200000, total: 9800000, state: 'active' }); break;
    case 'phoneTimer': onPhoneTimer({ state: 'running', id: 'tm-demo', label: 'Tea', duration: 300000, remaining: 184000, from: 'Galaxy S24' }); break;
    default: break;
  }
}

let demoVideoTimer = null;

// ------------------------------------------------------------------ subtitles (state from main)
function onSubs(st) {
  const prev = state.subs;
  state.subs = st || null;
  if (!st || !st.video) {
    if (state.expanded === 'subs') state.expanded = null;
    if (state.transient && state.transient.kind === 'subsReady') state.transient = null;
    present();
    return;
  }
  const videoChanged = !prev || !prev.video || prev.video.key !== st.video.key;
  const fresh = st.file && st.status === 'ready' && (videoChanged || !prev.file || prev.file.name !== st.file.name);
  if (fresh && state.expanded !== 'subs' && !state.call) {
    showTransient('subsReady', {}, 8000);
    bump(0.5);
    edge('var(--accent)');
  }
  present();
}

function subsCommand(name, args = {}) {
  const st = state.subs;
  if (st && st.demo) { demoSubs(name, args); return; }
  if (bridge.subs) bridge.subs(name, args).catch(() => {});
}

const DEMO_SUBS = [
  { id: 'd1', provider: 'subdl', name: 'Interstellar.2014.1080p.BluRay.x264-SPARKS', lang: 'en', hi: false, downloads: 18200, score: 52, hash: false },
  { id: 'd2', provider: 'opensubtitles', name: 'Interstellar.2014.IMAX.1080p.BluRay', lang: 'en', hi: false, downloads: 9400, score: 40, hash: true },
  { id: 'd3', provider: 'subdl', name: 'Interstellar.2014.720p.WEB-DL.H264', lang: 'en', hi: false, downloads: 5100, score: 31, hash: false },
  { id: 'd4', provider: 'podnapisi', name: 'Interstellar 2014 BRRip', lang: 'en', hi: true, downloads: 820, score: 22, hash: false },
];
let demoSubsTimers = [];
function demoSubsFile(id, lang) {
  const r = DEMO_SUBS.find((x) => x.id === id) || DEMO_SUBS[0];
  return { name: `Interstellar.2014.1080p.BluRay.x264.${lang}.srt`, lang, provider: r.provider, release: r.name, converted: true };
}
function demoSubs(name, args) {
  const st = { ...state.subs };
  if (name === 'choose' && args.id) {
    onSubs({ ...st, status: 'downloading', downloading: args.id });
    demoSubsTimers.push(setTimeout(() => onSubs({ ...st, status: 'ready', downloading: null, selected: args.id, file: demoSubsFile(args.id, st.lang) }), 700));
  } else if (name === 'search') {
    const lang = args.lang || st.lang;
    const results = DEMO_SUBS.map((r) => ({ ...r, lang }));
    onSubs({ ...st, lang, status: st.file && lang === st.lang ? 'ready' : 'searching', searching: true, results: [], query: args.query ? { title: args.query, manual: true } : st.query });
    demoSubsTimers.push(setTimeout(() => onSubs({ ...state.subs, searching: false, results, status: 'ready', selected: 'd1', file: demoSubsFile('d1', lang) }), 900));
  }
}
function startDemoSubs() {
  demoSubsTimers.forEach(clearTimeout);
  demoSubsTimers = [];
  const langs = [i18n.lang(), 'en'].filter((x, i, a) => a.indexOf(x) === i);
  const v = { key: 'demo|interstellar', title: 'Interstellar', raw: 'Interstellar.2014.1080p.BluRay.x264.mkv', app: 'VLC', hasPath: true, season: null, episode: null, year: 2014 };
  const base = { demo: true, enabled: true, video: v, lang: langs[0], langs, query: { title: 'Interstellar', year: 2014 }, results: [], selected: null, file: null, error: null, fallback: null, searching: false, downloading: null, providers: ['subdl', 'opensubtitles', 'podnapisi'] };
  onPlayer({ type: 'player', present: true, app: 'VLC', exe: 'vlc.exe', title: 'Interstellar.2014.1080p.BluRay', playing: true });
  onSubs({ ...base, status: 'searching', searching: true });
  const results = DEMO_SUBS.map((r) => ({ ...r, lang: langs[0] }));
  demoSubsTimers.push(setTimeout(() => onSubs({ ...base, status: 'downloading', downloading: 'd1', results }), 1500));
  demoSubsTimers.push(setTimeout(() => onSubs({ ...base, status: 'ready', results, selected: 'd1', file: demoSubsFile('d1', langs[0]) }), 2700));
  clearTimeout(demoVideoTimer);
  demoVideoTimer = setTimeout(() => { onPlayer({ type: 'player', present: false }); onSubs(null); }, 45000);
}

function onClipboard(payload) {
  if (payload.history) state.clipHistory = payload.history;
  if (payload.item && state.settings.modules.clipboard) showTransient('copied', { item: payload.item }, 1900);
  else present();
}

// ------------------------------------------------------------------ boot
bridge.on('helper', onHelper);
bridge.on('hover', setHover);
bridge.on('settings', applySettings);
bridge.on('accent', applyAccent);
bridge.on('backdrop', applyBackdrop);
bridge.invoke('backdrop:get').then(applyBackdrop).catch(() => {});
bridge.on('clipboard', onClipboard);
bridge.phone('timers').then((timers) => { state.sharedTimers = timers || []; present(); }).catch(() => {});
bridge.on('stats', (s) => { state.stats = s; if (state.expanded === 'dashboard') present(); });
bridge.on('demo', runDemo);
bridge.on('toggleDashboard', () => { if (state.expanded === 'dashboard') collapse(); else openDashboard(true); });
bridge.on('phone', onPhone);
bridge.on('weather', (w) => { state.weather = w; present(); });
bridge.on('shortcuts', (s) => { state.shortcuts = s || []; present(); });
bridge.on('widgets', (w) => { state.widgets = w || { crypto: null, news: null }; if (state.expanded === 'dashboard') present(); });
bridge.on('tasks', (t) => { state.tasks = t || []; if (state.expanded === 'dashboard') present(); });
bridge.on('reminder', onReminder);
bridge.on('subs', onSubs);
bridge.on('gaming', onGaming);
bridge.on('gamingLibrary', () => {
  state.gameLibStale = true;
  if (state.expanded === 'dashboard' && state.tab === 'gaming') loadGameLib(false);
});
// the game strip scrolls sideways with the mouse wheel
document.addEventListener('wheel', (e) => {
  const lib = e.target.closest && e.target.closest('[data-gm-lib]');
  if (!lib || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  lib.scrollLeft += (getComputedStyle(lib).direction === 'rtl' ? -1 : 1) * e.deltaY;
  e.preventDefault();
}, { passive: false });
bridge.on('gameSummary', (rec) => {
  if (!rec) return;
  showTransient('gameSummary', { ...rec, temp: gmCfg().temp }, 12000);
  bump(0.6);
  edge('var(--purple)');
});
if (!IS_DEMO) bridge.invoke('subs:get').then((st) => { if (st) onSubs(st); }).catch(() => {});
bridge.on('shelfChanged', () => { if (state.expanded === 'dashboard' && state.tab === 'shelf') refreshTabData('shelf'); });

function onReminder(tk) {
  if (!tk) return;
  const when = tk.time ? `${i18n.digits(tk.time)} · ` : '';
  showTransient('message', { id: `rem-${tk.id}`, icon: 'alarm-clock', text: `${when}${tk.title}`, tone: 'orange' }, 7000);
  bump(0.9);
  edge('var(--orange)');
  if (state.settings.sound) chime('timer');
}

Promise.all([
  bridge.invoke('settings:get').catch(() => null),
  bridge.invoke('accent:get').catch(() => null),
  bridge.invoke('shelf:get').catch(() => []),
  bridge.invoke('clipboard:history').catch(() => []),
  bridge.invoke('shortcuts:get').catch(() => []),
  bridge.invoke('weather:get').catch(() => null),
  bridge.invoke('phone:get').catch(() => null),
  bridge.invoke('widgets:get').catch(() => null),
  bridge.invoke('tasks:get').catch(() => []),
]).then(([s, accent, shelf, clips, shortcuts, weather, phone, widgets, tasks]) => {
  if (widgets) state.widgets = widgets;
  state.tasks = tasks || [];
  if (s) applySettings(s);
  applyAccent(accent);
  state.shelf = shelf || [];
  state.clipHistory = clips || [];
  state.shortcuts = shortcuts || [];
  if (weather) state.weather = weather;
  if (phone) state.phone = { me: phone.me, devices: phone.devices || [] };
  present();
});

ticker = setInterval(tick, 250);
window.addEventListener('resize', () => { lastRectsJson = ''; present(); });
presentNow();

// handy for the browser preview / debugging
window.__island = { state, runDemo, expand, collapse, setHover, present: presentNow, openDashboard, applySettings, startTimer, onPhone };
