'use strict';
const {
  app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, globalShortcut,
  shell, clipboard, systemPreferences, powerMonitor, ClipboardItem, dialog, net, desktopCapturer, safeStorage,
} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { Settings } = require('./settings');
const { writeJson } = require('./jsonfile');
const { GpuStats } = require('./gpustats');
const { HelperBridge } = require('./helper');
const { KdeConnect } = require('./kdeconnect');
const { Weather, searchCity } = require('./weather');
const { Widgets, COINS, FEEDS, defaultFeeds } = require('./widgets');
const { Tasks } = require('./tasks');
const { PhoneLink } = require('./phonelink');
const apps = require('./apps');
const deck = require('./deck');
const { Backdrop } = require('./backdrop');
const { SubtitleFinder, LANGS: SUB_LANGS } = require('./subtitles');
const { Gaming, exeName: gameExeName } = require('./gaming');
const { strings, LANGS } = require('../shared/strings');

// Keep the transparent overlay rendering even when Windows thinks it is "occluded".
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

const ROOT = path.join(__dirname, '..', '..');
const ASSETS = path.join(ROOT, 'assets');
// Large enough that the soft glow around the expanded island never reaches the window edges.
const WIN_W = 1000;
const WIN_H = 560;
const IS_WIN = process.platform === 'win32';
const PHONE_LINK_AUMID = 'Microsoft.YourPhone_8wekyb3d8bbwe!App';

app.setAppUserModelId('com.saeedsh.blinkelo');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// ------------------------------------------------------------------ rebrand: Dynamic Island -> Blinkelo (2.0)
// The profile folder follows the product name (%APPDATA%\Blinkelo). On the first Blinkelo start the old
// "Dynamic Island" profile is copied over (settings, phone pairing identity + trusted phones, tasks, timers, shelf,
// encrypted passwords via "Local State"), so nothing has to be set up or paired again. It is a copy, never a move:
// the old folder stays as it was. Browser caches, logs and the native build cache are not worth copying.
const LEGACY_PROFILES = ['Dynamic Island'];
const MIGRATE_SKIP = new Set(['Cache', 'Code Cache', 'GPUCache', 'DawnCache', 'DawnGraphiteCache', 'DawnWebGPUCache', 'GrShaderCache',
  'ShaderCache', 'Crashpad', 'blob_storage', 'Shared Dictionary', 'logs', 'native-cache', 'lockfile', 'SingletonLock', 'SingletonCookie',
  'SingletonSocket']);
function copyProfileTree(src, dst, res, depth) {
  if (depth > 8) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    if (depth === 0 && MIGRATE_SKIP.has(ent.name)) continue;
    const from = path.join(src, ent.name);
    const to = path.join(dst, ent.name);
    try {
      if (ent.isDirectory()) copyProfileTree(from, to, res, depth + 1);
      else if (ent.isFile() && !fs.existsSync(to)) { fs.copyFileSync(from, to); res.files += 1; }
    } catch (_) { res.failed += 1; }
  }
}
function migrateLegacyProfile() {
  try {
    const target = app.getPath('userData');
    if (fs.existsSync(path.join(target, 'settings.json'))) return null;
    for (const name of LEGACY_PROFILES) {
      const src = path.join(app.getPath('appData'), name);
      if (path.resolve(src).toLowerCase() === path.resolve(target).toLowerCase()) continue;
      if (!fs.existsSync(path.join(src, 'settings.json'))) continue;
      const res = { from: src, files: 0, failed: 0 };
      copyProfileTree(src, target, res, 0);
      try {
        fs.writeFileSync(path.join(target, 'migrated-from.json'), JSON.stringify({ ...res, at: new Date().toISOString() }, null, 2));
      } catch (_) { /* informational only */ }
      return res;
    }
  } catch (_) { /* never block the start */ }
  return null;
}
const profileMigration = migrateLegacyProfile();

let settings;
let helper;
let kde = null;
let phoneLink = null;
let weather = null;
let islandWin = null;
let settingsWin = null;
let tray = null;
let logFile = '';
let islandRects = [];
let interactiveUntil = 0;
let lastDiagLog = 0;
let lastInside = null;
let fsBusy = false;
let attentionUntil = 0;
let attentionTimer = null;
let statsTimer = null;
let lastCpu = null;
let gpuPath = null;
let gpuStats = null;
let registeredShortcut = null;
const iconCache = new Map();
let clipHistory = [];
let shelf = [];
let lastClipText = '';
let helperAccent = null;
let drag = null;
let dragTimer = null;
let lastWeather = null;
let widgets = null;
let lastWidgets = { crypto: null, news: null };
let tasks = null;
let backdrop = null;
let backdropTimer = null;
let lastPhoneDevices = null;
let subs = null;
let subsDragIcon = null;
let subsSnap = null;
let gaming = null;
let gamebarWin = null;
let gamebarSize = { w: 520, h: 34 };
let gamingHotkey = null;
let lastFsMsg = null;
const extraStatus = {};

// ------------------------------------------------------------------ logging
function log(...parts) {
  const line = `[${new Date().toISOString()}] ${parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ')}\n`;
  try { fs.appendFileSync(logFile, line); } catch (_) { /* ignore */ }
  if (!app.isPackaged) process.stdout.write(line);
}
process.on('uncaughtException', (e) => log('uncaught', e && e.stack ? e.stack : String(e)));
process.on('unhandledRejection', (e) => log('unhandled', e && e.stack ? e.stack : String(e)));

// ------------------------------------------------------------------ helpers
function send(win, channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}
function toIsland(channel, payload) { send(islandWin, channel, payload); }
function toAll(channel, payload) { send(islandWin, channel, payload); send(settingsWin, channel, payload); }
function S() { return strings(settings.data.language); }

// The helper reports the fullscreen window's monitor (physical pixels). Only hide when it is the island's display.
function fullscreenOnIslandDisplay(msg) {
  if (!msg.mw || !msg.mh) return true;
  try {
    const target = currentIslandDisplay();
    const raw = { x: msg.mx, y: msg.my, width: msg.mw, height: msg.mh };
    const candidates = [raw];
    if (IS_WIN && typeof screen.screenToDipRect === 'function') {
      try { candidates.unshift(screen.screenToDipRect(null, raw)); } catch (_) { /* ignore */ }
    }
    return candidates.some((r) => screen.getDisplayMatching(r).id === target.id);
  } catch (_) {
    return true;
  }
}

function currentIslandDisplay() {
  if (islandWin && !islandWin.isDestroyed()) return screen.getDisplayMatching(islandWin.getBounds());
  return targetDisplay();
}

function targetDisplay() {
  const s = settings.data;
  const want = s.movable && s.position && s.position.display ? s.position.display : s.display;
  if (want && want !== 'primary') {
    const d = screen.getAllDisplays().find((x) => String(x.id) === String(want));
    if (d) return d;
  }
  return screen.getPrimaryDisplay();
}

function topOf(d) {
  // if the taskbar sits at the top of the screen, start below it
  return d.workArea && d.workArea.y > d.bounds.y ? d.workArea.y : d.bounds.y;
}

function clampPosition(d, x, y) {
  const b = d.bounds;
  const margin = b.width > 760 ? 340 : b.width / 2;
  const cx = Math.min(Math.max(x + WIN_W / 2, b.x + margin), b.x + b.width - margin);
  const ny = Math.min(Math.max(y, topOf(d)), b.y + b.height - 180);
  return { x: Math.round(cx - WIN_W / 2), y: Math.round(ny) };
}

function homePosition(d) {
  return { x: Math.round(d.bounds.x + (d.bounds.width - WIN_W) / 2), y: topOf(d) };
}

function positionIsland() {
  if (!islandWin || islandWin.isDestroyed() || drag) return;
  const d = targetDisplay();
  let pos = homePosition(d);
  const p = settings.data.position;
  if (settings.data.movable && p && Number.isFinite(p.fx)) {
    pos = clampPosition(d, d.bounds.x + p.fx * d.bounds.width - WIN_W / 2, d.bounds.y + (Number(p.dy) || 0));
  }
  islandWin.setBounds({ x: pos.x, y: pos.y, width: WIN_W, height: WIN_H });
  lastInside = null;
}

function accentColor() {
  if (settings.data.accent && settings.data.accent !== 'auto') return settings.data.accent;
  if (helperAccent) return helperAccent;
  try {
    const c = IS_WIN ? systemPreferences.getAccentColor() : null;
    if (typeof c === 'string' && /^[0-9a-f]{6}/i.test(c)) return `#${c.slice(0, 6)}`;
  } catch (_) { /* ignore */ }
  return '#0a84ff';
}

function openShellApp(aumid) {
  if (!IS_WIN || !aumid || /["<>|]/.test(aumid)) return false;
  spawn('explorer.exe', [`shell:AppsFolder\\${aumid}`], { detached: true, stdio: 'ignore' }).unref();
  return true;
}

function updateVisibility() {
  if (!islandWin || islandWin.isDestroyed()) return;
  const attention = Date.now() < attentionUntil;
  const hideForFs = settings.data.hideInFullscreen && fsBusy && !attention;
  const g = settings.data.gaming || {};
  const hideForGame = !!gaming && !attention && (gaming.quiet || (gaming.hudVisible && (g.hud || {}).position === 'center'));
  const shouldHide = (settings.data.hidden && !attention) || hideForFs || hideForGame;
  if (shouldHide && islandWin.isVisible()) {
    islandWin.hide();
    lastInside = null;
  } else if (!shouldHide && !islandWin.isVisible()) {
    islandWin.showInactive();
    islandWin.setAlwaysOnTop(true, 'screen-saver');
    islandWin.setIgnoreMouseEvents(true, { forward: true });
    lastInside = null;
  }
  updateTrayMenu();
}

// ------------------------------------------------------------------ island window
function createIsland() {
  islandWin = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    // Windows: a non-focusable Chromium window answers WM_MOUSEACTIVATE with MA_NOACTIVATEANDEAT, which silently
    // eats every left button-down (right-click still works because the context menu fires on button-up).
    // So the window stays activatable and WS_EX_NOACTIVATE is added natively instead: clicks arrive, focus is not stolen.
    focusable: IS_WIN,
    show: false,
    type: IS_WIN ? 'toolbar' : undefined,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'island-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });
  islandWin.setAlwaysOnTop(true, 'screen-saver');
  islandWin.setIgnoreMouseEvents(true, { forward: true });
  if (IS_WIN) islandWin.setSkipTaskbar(true);
  positionIsland();
  islandWin.loadFile(path.join(ROOT, 'src', 'renderer', 'island', 'index.html'));
  islandWin.once('ready-to-show', () => {
    if (!settings.data.hidden) islandWin.showInactive();
    updateVisibility();
  });
  islandWin.webContents.on('render-process-gone', (_e, details) => {
    log('island renderer gone', details);
    setTimeout(() => { if (islandWin && !islandWin.isDestroyed()) islandWin.reload(); }, 1000);
  });
  islandWin.webContents.on('did-finish-load', () => {
    lastInside = null;
    interactiveUntil = 0;
    if (lastWeather) toIsland('weather', lastWeather);
    if (kde && lastPhoneDevices) toIsland('phone', { type: 'devices', ...lastPhoneDevices });
  });
  islandWin.on('closed', () => { islandWin = null; });

  // Click-through outside the island shape: poll the cursor against the rects the renderer reports.
  setInterval(pollCursor, 20);
  // Re-assert topmost (other topmost windows can cover us).
  setInterval(() => {
    if (islandWin && !islandWin.isDestroyed() && islandWin.isVisible() && !drag) {
      islandWin.setAlwaysOnTop(true, 'screen-saver');
      if (IS_WIN) islandWin.moveTop();
      applyNoActivate();
    }
  }, 4000);
}

// ------------------------------------------------------------------ Windows: clickable without stealing focus
const WS_EX_NOACTIVATE = 0x08000000;
let islandTyping = false;
function islandHwnd() {
  try {
    const b = islandWin.getNativeWindowHandle();
    return b.length >= 8 ? b.readBigUInt64LE(0).toString() : String(b.readUInt32LE(0));
  } catch (_) {
    return '';
  }
}
function applyNoActivate() {
  if (!IS_WIN || !helper || !islandWin || islandWin.isDestroyed()) return;
  const h = islandHwnd();
  if (!h) return;
  if (islandTyping) helper.send('win.exstyle', h, 0, WS_EX_NOACTIVATE);
  else helper.send('win.exstyle', h, WS_EX_NOACTIVATE, 0);
}

function insideIsland() {
  const p = screen.getCursorScreenPoint();
  const b = islandWin.getBounds();
  const x = p.x - b.x;
  const y = p.y - b.y;
  const pad = 3;
  return islandRects.some((r) => x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad);
}

function setInside(inside) {
  if (inside === lastInside) return;
  lastInside = inside;
  if (inside) islandWin.setIgnoreMouseEvents(false);
  else islandWin.setIgnoreMouseEvents(true, { forward: true });
  toIsland('hover', inside);
}

function pollCursor() {
  if (!islandWin || islandWin.isDestroyed() || !islandWin.isVisible()) return;
  const locked = drag || Date.now() < interactiveUntil;
  setInside(locked || insideIsland());
}

// ------------------------------------------------------------------ drag to move
function startDrag() {
  if (!settings.data.movable || !islandWin || drag) return;
  const c = screen.getCursorScreenPoint();
  const [x, y] = islandWin.getPosition();
  drag = { cx: c.x, cy: c.y, x, y };
  clearInterval(dragTimer);
  dragTimer = setInterval(dragStep, 12);
}

function dragStep() {
  if (!drag || !islandWin || islandWin.isDestroyed()) return;
  const c = screen.getCursorScreenPoint();
  const d = screen.getDisplayNearestPoint(c);
  let nx = drag.x + (c.x - drag.cx);
  let ny = drag.y + (c.y - drag.cy);
  // magnetic center line and top edge
  const home = homePosition(d);
  if (Math.abs(nx - home.x) < 30) nx = home.x;
  if (Math.abs(ny - home.y) < 18) ny = home.y;
  const p = clampPosition(d, nx, ny);
  islandWin.setPosition(p.x, p.y);
}

function endDrag() {
  if (!drag) return;
  clearInterval(dragTimer);
  dragStep();
  drag = null;
  const [x, y] = islandWin.getPosition();
  const d = screen.getDisplayMatching(islandWin.getBounds());
  const home = homePosition(d);
  if (x === home.x && y === home.y) settings.set({ position: null, display: String(d.id) === String(screen.getPrimaryDisplay().id) ? 'primary' : String(d.id) });
  else settings.set({ position: { fx: (x + WIN_W / 2 - d.bounds.x) / d.bounds.width, dy: y - d.bounds.y, display: String(d.id) } });
}

// ------------------------------------------------------------------ settings window
function attachWebsiteInputMenu(win) {
  const contents = win.webContents;
  contents.on('context-menu', async (_event, params) => {
    if (!params.isEditable || !Number.isFinite(params.x) || !Number.isFinite(params.y)) return;
    try {
      const websiteField = await contents.executeJavaScript(`Boolean(document.elementFromPoint(${params.x}, ${params.y})?.matches('#webForm input[name="name"], #webForm input[name="url"]'))`);
      if (!websiteField || win.isDestroyed() || contents.isDestroyed()) return;
      const flags = params.editFlags;
      Menu.buildFromTemplate([
        { role: 'undo', enabled: flags.canUndo },
        { role: 'redo', enabled: flags.canRedo },
        { type: 'separator' },
        { role: 'cut', enabled: flags.canCut },
        { role: 'copy', enabled: flags.canCopy },
        { role: 'paste', enabled: flags.canPaste },
        { type: 'separator' },
        { role: 'selectAll', enabled: flags.canSelectAll },
      ]).popup({ window: win, ...(params.frame ? { frame: params.frame } : {}) });
    } catch (_) { /* the settings window may have closed */ }
  });
}

function openSettings(tab) {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    if (tab) send(settingsWin, 'settings:tab', tab);
    return;
  }
  const opts = {
    width: 980,
    height: 700,
    minWidth: 780,
    minHeight: 540,
    show: false,
    title: 'Blinkelo',
    icon: path.join(ASSETS, 'icon.png'),
    backgroundColor: '#00000000',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'settings-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  };
  if (IS_WIN) {
    Object.assign(opts, {
      titleBarStyle: 'hidden',
      titleBarOverlay: { color: '#00000000', symbolColor: '#ffffff', height: 44 },
      backgroundMaterial: 'acrylic',
    });
  } else {
    opts.backgroundColor = '#141418';
  }
  settingsWin = new BrowserWindow(opts);
  settingsWin.removeMenu();
  attachWebsiteInputMenu(settingsWin);
  settingsWin.loadFile(path.join(ROOT, 'src', 'renderer', 'settings', 'index.html'), tab ? { hash: tab } : undefined);
  settingsWin.once('ready-to-show', () => settingsWin.show());
  settingsWin.on('closed', () => { settingsWin = null; });
}

// ------------------------------------------------------------------ tray
function trayImage() {
  const img = nativeImage.createFromPath(path.join(ASSETS, 'tray.png'));
  return img.isEmpty() ? nativeImage.createFromPath(path.join(ASSETS, 'icon.png')).resize({ width: 16 }) : img;
}

function createTray() {
  tray = new Tray(trayImage());
  tray.setToolTip('Blinkelo');
  tray.on('click', () => openSettings());
  updateTrayMenu();
}

// Blinkelo: the tray icon blinks when something new arrives and winks once at start-up (frames tray-*.png).
const trayFrames = new Map();
let trayAnimUntil = 0;
let trayAnimTimers = [];
function trayFrame(name) {
  if (!trayFrames.has(name)) {
    const img = nativeImage.createFromPath(path.join(ASSETS, `tray-${name}.png`));
    trayFrames.set(name, img.isEmpty() ? null : img);
  }
  return trayFrames.get(name);
}
function trayAnimate(seq) {
  if (!tray || tray.isDestroyed()) return;
  const now = Date.now();
  if (now < trayAnimUntil) return;
  trayAnimUntil = now + seq[seq.length - 1][1] + 450;
  trayAnimTimers.forEach(clearTimeout);
  trayAnimTimers = seq.map(([name, at]) => setTimeout(() => {
    try {
      if (!tray || tray.isDestroyed()) return;
      const img = name ? trayFrame(name) : trayImage();
      if (img) tray.setImage(img);
    } catch (_) { /* cosmetic */ }
  }, at));
}
function blinkPref(key) { return !(settings && settings.data.blink && settings.data.blink[key] === false); }
function trayBlink() {
  if (blinkPref('events')) trayAnimate([['half', 0], ['closed', 55], ['half', 135], [null, 195]]);
}
function trayHello() {
  if (blinkPref('hello')) trayAnimate([['half', 0], ['closed', 55], ['half', 135], [null, 195], ['wink', 560], [null, 1380]]);
}

function updateTrayMenu() {
  if (!tray) return;
  const t = S();
  const demo = (k) => () => toIsland('demo', k);
  const menu = Menu.buildFromTemplate([
    { label: t.settings, click: () => openSettings() },
    { label: settings.data.hidden ? t.showIsland : t.hideIsland, click: () => settings.set({ hidden: !settings.data.hidden }) },
    { label: settings.data.minimized ? t.restore : t.minimize, click: () => settings.set({ minimized: !settings.data.minimized }) },
    { label: t.resetPosition, click: () => settings.set({ position: null }) },
    {
      label: t.trayTry,
      submenu: [
        { label: t.t_blink, click: () => { trayHello(); toIsland('demo', 'blink'); } },
        { type: 'separator' },
        { label: t.t_music, click: demo('music') },
        { label: t.t_video, click: demo('video') },
        { label: t.t_message, click: demo('message') },
        { label: t.t_call, click: demo('call') },
        { label: t.t_timer, click: demo('timer') },
        { label: t.t_charging, click: demo('charging') },
        { label: t.t_volume, click: demo('volume') },
        { label: t.t_weather, click: demo('weather') },
        { label: t.t_pair, click: demo('pair') },
        { label: t.t_dashboard, click: demo('dashboard') },
      ],
    },
    {
      label: `${t.language} · ${LANGS.find((l) => l.code === settings.data.language).name}`,
      submenu: LANGS.map((l) => ({ label: l.name, type: 'radio', checked: settings.data.language === l.code, click: () => setLanguage(l.code) })),
    },
    { type: 'separator' },
    { label: t.restartHelper, click: () => helper.restart() },
    { label: t.trayLogs, click: () => shell.openPath(path.dirname(logFile)) },
    { type: 'separator' },
    { label: t.quit, click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
}

function setLanguage(code) {
  settings.set({ language: code });
}

// ------------------------------------------------------------------ shortcut & login item
function applyShortcut() {
  try {
    if (registeredShortcut) globalShortcut.unregister(registeredShortcut);
    registeredShortcut = null;
    const sc = settings.data.shortcut;
    if (sc && globalShortcut.register(sc, () => toIsland('toggleDashboard'))) registeredShortcut = sc;
    else if (sc) log('shortcut registration failed', sc);
  } catch (e) {
    log('shortcut error', e.message);
  }
}

function applyLoginItem() {
  if (!IS_WIN) return;
  try {
    const args = app.isPackaged ? [] : [app.getAppPath()];
    app.setLoginItemSettings({ openAtLogin: !!settings.data.startWithWindows, path: process.execPath, args });
  } catch (e) {
    log('login item error', e.message);
  }
}

// ------------------------------------------------------------------ clipboard (Electron 45 async API)
async function readClipboardItem() {
  let items = [];
  try { items = await clipboard.read(); } catch (e) { log('clipboard read failed', e.message); return null; }
  const types = items.flatMap((it) => it.types || []);
  const pick = async (mime) => {
    for (const it of items) {
      if ((it.types || []).includes(mime)) {
        try { return await it.getType(mime); } catch (_) { return null; }
      }
    }
    return null;
  };
  const imgType = types.find((t) => t.startsWith('image/'));
  if (imgType) {
    const blob = await pick(imgType);
    if (blob && typeof blob.arrayBuffer === 'function') {
      const buf = Buffer.from(await blob.arrayBuffer());
      const img = nativeImage.createFromBuffer(buf);
      if (!img.isEmpty()) {
        const size = img.getSize();
        const thumb = img.resize(size.width > size.height ? { width: 200 } : { height: 120 });
        return { kind: 'image', text: `${size.width}×${size.height}`, thumb: thumb.toDataURL(), png: buf, mime: imgType };
      }
    }
  }
  if (types.includes('text/uri-list')) {
    const blob = await pick('text/uri-list');
    const txt = blob && typeof blob.text === 'function' ? await blob.text() : '';
    const first = txt.split(/\r?\n/).find((l) => l && !l.startsWith('#'));
    if (first && first.startsWith('file:')) {
      try { return { kind: 'file', text: decodeURIComponent(new URL(first).pathname).replace(/^\/([A-Za-z]:)/, '$1').replace(/\//g, '\\') }; } catch (_) { /* fall through */ }
    }
  }
  let text = '';
  try { text = await clipboard.readText(); } catch (_) { text = ''; }
  if (text && text.trim()) return { kind: 'text', text };
  return null;
}

let clipBusy = false;
function clipImageFromFile(file) {
  try {
    const buf = fs.readFileSync(file);
    const img = nativeImage.createFromBuffer(buf);
    if (img.isEmpty()) return null;
    const size = img.getSize();
    const thumb = img.resize(size.width > size.height ? { width: 220, quality: 'good' } : { height: 132, quality: 'good' });
    return { kind: 'image', text: `${size.width}×${size.height}`, thumb: thumb.toDataURL(), png: buf, mime: 'image/png' };
  } catch (e) {
    log('clipboard image read failed', e.message);
    return null;
  }
}

async function onClipboardChanged(sensitive, msg = {}) {
  if (!settings.data.modules.clipboard || clipBusy) return;
  if (sensitive) {
    toIsland('clipboard', { item: { kind: 'secret', text: '', time: Date.now() }, history: publicClipHistory() });
    return;
  }
  clipBusy = true;
  try {
    // Windows: the helper already saved an image copy (Electron's async read misses plain bitmaps)
    let item = msg.image ? clipImageFromFile(msg.image) : null;
    if (!item && IS_WIN && msg.hasText === true) {
      let text = '';
      try { text = await clipboard.readText(); } catch (_) { text = ''; }
      if (text && text.trim()) item = { kind: 'text', text };
    }
    if (!item) item = await readClipboardItem();
    if (!item) return;
    if (item.kind === 'text' && Buffer.byteLength(item.text, 'utf8') > 1024 * 1024) {
      log('clipboard exceeds 1 MiB history/sync limit');
      toIsland('clipboard', { item: { kind: 'error', text: '', time: Date.now() }, history: publicClipHistory() });
      return;
    }
    if (item.kind === 'text') {
      if (item.text === lastClipText) return;
      lastClipText = item.text;
    }
    if (item.kind === 'image' && clipHistory[0] && clipHistory[0].kind === 'image' && clipHistory[0].png && item.png && clipHistory[0].png.equals(item.png)) return;
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, time: Date.now(), ...item };
    clipHistory = [entry, ...clipHistory.filter((c) => !(c.kind === 'text' && c.text === entry.text))].slice(0, 15);
    toIsland('clipboard', { item: publicClip(entry), history: publicClipHistory() });
    if (phoneLink) phoneLink.pcClipboard(entry);
  } catch (e) {
    log('clipboard error', e.message);
  } finally {
    clipBusy = false;
  }
}

async function writeClipboardEntry(c) {
  if (c.kind === 'image' && c.png) {
    await clipboard.write([new ClipboardItem({ [c.mime || 'image/png']: new Blob([c.png], { type: c.mime || 'image/png' }) })]);
  } else {
    await clipboard.writeText(c.text);
    lastClipText = c.text;
  }
}

function publicClip(c) { return { id: c.id, kind: c.kind, text: c.text ? c.text.slice(0, 2000) : '', thumb: c.thumb || null, time: c.time }; }
function publicClipHistory() { return clipHistory.map(publicClip); }

function startClipboardPollingFallback() {
  clipboard.readText().then((t) => { lastClipText = t; }).catch(() => {});
  setInterval(async () => {
    try {
      const t = await clipboard.readText();
      if (t && t !== lastClipText) onClipboardChanged(false);
    } catch (_) { /* ignore */ }
  }, 900);
}

// ------------------------------------------------------------------ stats
function cpuSnapshot() {
  let idle = 0; let total = 0;
  for (const c of os.cpus()) {
    for (const k of Object.keys(c.times)) total += c.times[k];
    idle += c.times.idle;
  }
  return { idle, total };
}

function findNvidiaSmi() {
  if (!IS_WIN) return null;
  const candidates = [
    path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'nvidia-smi.exe'),
    'C:\\Program Files\\NVIDIA Corporation\\NVSMI\\nvidia-smi.exe',
  ];
  return candidates.find((p) => { try { return fs.existsSync(p); } catch (_) { return false; } }) || null;
}

function readStats() {
  const snap = cpuSnapshot();
  let cpu = 0;
  if (lastCpu) {
    const dt = snap.total - lastCpu.total;
    const di = snap.idle - lastCpu.idle;
    cpu = dt > 0 ? Math.max(0, Math.min(100, 100 * (1 - di / dt))) : 0;
  }
  lastCpu = snap;
  const total = os.totalmem();
  const free = os.freemem();
  const stats = { cpu, ram: 100 * (1 - free / total), ramUsed: total - free, ramTotal: total, gpu: null, gpuTemp: null };
  // NVIDIA numbers come from one long-running nvidia-smi (gpustats.js), not one process per sample
  const g = gpuStats ? gpuStats.read() : null;
  if (g) Object.assign(stats, g);
  return Promise.resolve(stats);
}

// One CPU sample source for both the island and phones (the CPU delta needs a shared baseline).
let statsCache = null;
function statsShared() {
  if (statsCache && Date.now() - statsCache.at < 1500) return statsCache.p;
  if (!lastCpu) lastCpu = cpuSnapshot();
  const p = readStats();
  statsCache = { at: Date.now(), p };
  return p;
}

function sampleStats() {
  statsShared().then((stats) => toIsland('stats', stats)).catch(() => {});
}

function setStatsSubscribed(on) {
  if (on && !statsTimer) {
    lastCpu = cpuSnapshot();
    if (gpuStats) gpuStats.read(); // start nvidia-smi now so the first sample has GPU numbers
    setTimeout(sampleStats, 350);
    statsTimer = setInterval(sampleStats, 2000);
  } else if (!on && statsTimer) {
    clearInterval(statsTimer);
    statsTimer = null;
  }
}

// ------------------------------------------------------------------ file shelf
function shelfFile() { return path.join(app.getPath('userData'), 'shelf.json'); }

function loadShelf() {
  try {
    shelf = JSON.parse(fs.readFileSync(shelfFile(), 'utf8')).filter((s) => s && s.path && fs.existsSync(s.path));
  } catch (_) { shelf = []; }
}

function addShelfPaths(paths) {
  for (const p of (paths || []).slice(0, 30)) {
    if (!p || shelf.some((s) => s.path === p)) continue;
    try {
      const st = fs.statSync(p);
      shelf.unshift({ path: p, name: path.basename(p), addedAt: Date.now(), size: st.size, isDir: st.isDirectory() });
    } catch (_) { /* ignore missing */ }
  }
  shelf = shelf.slice(0, 40);
  saveShelf();
}

function saveShelf() {
  try { writeJson(shelfFile(), shelf.map(({ path: p, name, addedAt, size, isDir }) => ({ path: p, name, addedAt, size, isDir }))); } catch (_) { /* ignore */ }
}

// Icons come from the shell through the helper (IShellItemImageFactory, then the system image list):
// real exe icons, .lnk icons, Store apps, thumbnails. Store apps also have a manifest-logo fallback.
// Only helper/manifest results are written to the disk cache; misses are retried after a while.
const ICON_VER = 'v3';
const ICON_MISS_RETRY = 60 * 1000;
const pendingIcons = new Map();
const iconMiss = new Map();
const iconInflight = new Map();
let iconDiskCache = null;
let iconSaveTimer = null;
function iconCacheFile() { return path.join(app.getPath('userData'), 'icon-cache.json'); }
function diskIcons() {
  if (iconDiskCache) return iconDiskCache;
  try { iconDiskCache = JSON.parse(fs.readFileSync(iconCacheFile(), 'utf8')) || {}; } catch (_) { iconDiskCache = {}; }
  // drop entries from older versions (v1.3.0 could store Chromium's generic shortcut icon)
  for (const k of Object.keys(iconDiskCache)) if (!k.startsWith(`${ICON_VER}:`) && !k.startsWith('site:')) delete iconDiskCache[k];
  return iconDiskCache;
}
function rememberIcon(key, url) {
  iconCache.set(key, url);
  if (!url) return;
  const d = diskIcons();
  d[key] = url;
  const keys = Object.keys(d);
  if (keys.length > 300) for (const k of keys.slice(0, keys.length - 300)) delete d[k];
  clearTimeout(iconSaveTimer);
  iconSaveTimer = setTimeout(() => { try { writeJson(iconCacheFile(), d, { fsync: false }); } catch (_) { /* ignore */ } }, 1500);
}
function helperReady() { return IS_WIN && helper && helper.ready; }
function helperIcon(target, size, mode) {
  if (!helperReady()) return Promise.resolve(null);
  const id = crypto.randomUUID();
  return new Promise((resolve) => {
    // the first Store-app lookup can take a while (the shell enumerates the Apps folder)
    const timer = setTimeout(() => { pendingIcons.delete(id); log('icon timeout', target); resolve(null); }, 25000);
    pendingIcons.set(id, (data) => { clearTimeout(timer); resolve(data || null); });
    if (!helper.send('icon.get', id, target, size, mode)) { clearTimeout(timer); pendingIcons.delete(id); resolve(null); }
  });
}
function cachedIcon(key, persist) {
  if (iconCache.has(key)) return { hit: true, url: iconCache.get(key) };
  if (persist && diskIcons()[key]) { iconCache.set(key, diskIcons()[key]); return { hit: true, url: diskIcons()[key] }; }
  const missAt = iconMiss.get(key);
  if (missAt && Date.now() - missAt < ICON_MISS_RETRY) return { hit: true, url: null };
  return { hit: false };
}
function onceInflight(key, fn) {
  if (iconInflight.has(key)) return iconInflight.get(key);
  const pr = fn().finally(() => iconInflight.delete(key));
  iconInflight.set(key, pr);
  return pr;
}
// Chromium's getFileIcon only knows real icons for exe/dll/ico; for other files it returns the generic
// icon of the file type (fine for a PDF, wrong for a shortcut), so it is never used for .lnk/.url/shell: paths.
async function chromiumIcon(target, size) {
  if (/^shell:/i.test(target) || /\.(lnk|url)$/i.test(target) || !fs.existsSync(target)) return null;
  try {
    const img = await app.getFileIcon(target, { size: size > 32 ? 'large' : 'normal' });
    return img && !img.isEmpty() ? img.toDataURL() : null;
  } catch (_) { return null; }
}
async function shellIcon(target, { size = 48, mode = 'icon', persist = true } = {}) {
  if (!target) return null;
  const key = `${ICON_VER}:${mode}:${size}:${target}`;
  const c = cachedIcon(key, persist);
  if (c.hit) return c.url;
  return onceInflight(key, async () => {
    const ready = helperReady();
    const url = ready ? await helperIcon(target, size, mode) : null;
    if (url) {
      iconMiss.delete(key);
      if (persist) rememberIcon(key, url); else iconCache.set(key, url);
      return url;
    }
    if (ready) iconMiss.set(key, Date.now());
    return chromiumIcon(target, size); // not cached: the helper gets another chance later
  });
}
async function fileIcon(p) { return shellIcon(p, { size: 32, mode: 'icon' }); }

async function appxIcon(aumid) {
  const key = `${ICON_VER}:appx:${aumid}`;
  const c = cachedIcon(key, true);
  if (c.hit) return c.url;
  return onceInflight(key, async () => {
    let url = null;
    try {
      const file = await apps.appxLogo(aumid);
      if (file) {
        const img = nativeImage.createFromPath(file);
        if (!img.isEmpty()) url = img.resize({ width: 48, height: 48, quality: 'best' }).toDataURL();
      }
    } catch (e) { log('appx logo failed', aumid, e.message); }
    if (url) rememberIcon(key, url); else iconMiss.set(key, Date.now());
    return url;
  });
}

// Use the site's declared icon as well as conventional favicon paths, without loading its scripts.
function websiteRenderer(fn, ...args) {
  if (!islandWin || islandWin.isDestroyed() || islandWin.webContents.isDestroyed()) return Promise.reject(new Error('Island not ready'));
  return islandWin.webContents.executeJavaScript(`(${fn.toString()})(...${JSON.stringify(args)})`);
}

async function websiteResource(url, maxBytes = 2 * 1024 * 1024) {
  if (url.startsWith('data:')) {
    const comma = url.indexOf(',');
    const metadata = url.slice(5, comma).split(';');
    if (comma < 0 || !/^image\/[a-z0-9.+-]+$/i.test(metadata[0])) throw new Error('Unsupported website icon data');
    const buffer = metadata.includes('base64') ? Buffer.from(url.slice(comma + 1), 'base64') : Buffer.from(decodeURIComponent(url.slice(comma + 1)));
    if (buffer.length > maxBytes) throw new Error('Website icon resource too large');
    return { url, type: metadata[0], buffer };
  }
  if (!/^https?:$/.test(new URL(url).protocol)) throw new Error('Unsupported website icon URL');
  // ClientRequest exposes the final redirect URL, needed for relative icon links.
  return new Promise((resolve, reject) => {
    const request = net.request({ url, redirect: 'manual' });
    let settled = false, redirects = 0;
    const finish = (error, resource) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) { request.abort(); reject(error); } else resolve(resource);
    };
    const timer = setTimeout(() => finish(new Error('Website icon request timed out')), 4500);
    request.setHeader('User-Agent', 'Mozilla/5.0 Blinkelo');
    request.on('error', (error) => finish(error));
    request.on('redirect', (_status, _method, nextUrl) => {
      if (settled) return;
      if (++redirects > 5 || !/^https?:$/.test(new URL(nextUrl).protocol)) { finish(new Error('Unsupported website icon redirect')); return; }
      url = nextUrl;
      request.followRedirect();
    });
    request.on('response', (response) => {
      if (settled) return;
      if (response.statusCode < 200 || response.statusCode >= 300) { finish(new Error('Website icon unavailable')); return; }
      const chunks = [];
      let length = 0;
      response.on('data', (chunk) => {
        if (settled) return;
        length += chunk.length;
        if (length > maxBytes) { finish(new Error('Website icon resource too large')); return; }
        chunks.push(chunk);
      });
      response.on('error', (error) => finish(error));
      response.on('aborted', () => finish(new Error('Website icon response aborted')));
      response.on('end', () => finish(null, { url, type: String(response.headers['content-type'] || ''), buffer: Buffer.concat(chunks) }));
    });
    request.end();
  });
}

async function websiteImage(resource) {
  const img = nativeImage.createFromBuffer(resource.buffer);
  if (!img.isEmpty()) return img.resize({ width: 48, height: 48, quality: 'best' }).toDataURL();
  // Chromium can decode ICO, SVG and WebP icons that NativeImage does not support.
  let mime = resource.type.split(';')[0].trim().toLowerCase();
  if (!/^image\/[a-z0-9.+-]+$/.test(mime)) mime = /<svg[\s>]/i.test(resource.buffer.toString('utf8', 0, 1024)) ? 'image/svg+xml' : 'image/x-icon';
  const dataUrl = `data:${mime};base64,${resource.buffer.toString('base64')}`;
  return websiteRenderer(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 48;
    const factor = Math.min(48 / image.naturalWidth, 48 / image.naturalHeight);
    const w = image.naturalWidth * factor, h = image.naturalHeight * factor;
    canvas.getContext('2d').drawImage(image, (48 - w) / 2, (48 - h) / 2, w, h);
    return canvas.toDataURL('image/png');
  }, dataUrl);
}

async function siteIcon(url) {
  let host = '';
  try { const parsed = new URL(url); if (!/^https?:$/.test(parsed.protocol)) return null; host = parsed.origin; } catch (_) { return null; }
  const key = `site:${host}`;
  const cached = cachedIcon(key, true);
  if (cached.hit) return cached.url;
  return onceInflight(key, async () => {
    let candidates = [];
    let base = host;
    try {
      const page = await websiteResource(url, 1024 * 1024);
      base = new URL(page.url).origin;
      candidates = await websiteRenderer((html, pageUrl) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        let baseUrl = pageUrl;
        try { const href = doc.querySelector('base[href]')?.getAttribute('href'); if (href) baseUrl = new URL(href, pageUrl).href; } catch (_) { /* use page URL */ }
        return [...doc.querySelectorAll('link[rel][href]')].filter((link) =>
          link.rel.toLowerCase().split(/\s+/).some((rel) => ['icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'].includes(rel)))
          .flatMap((link) => { try { const u = new URL(link.getAttribute('href'), baseUrl); return /^(https?:|data:)$/i.test(u.protocol) ? [u.href] : []; } catch (_) { return []; } }).slice(0, 6);
      }, page.buffer.toString('utf8'), page.url);
    } catch (_) { /* still try conventional paths when the page cannot be read */ }
    candidates = [...new Set([...candidates, ...['/apple-touch-icon.png', '/apple-touch-icon-precomposed.png', '/favicon.png', '/favicon.ico'].map((p) => base + p)])];
    try {
      const data = await Promise.any(candidates.map(async (candidate) => websiteImage(await websiteResource(candidate))));
      iconMiss.delete(key);
      rememberIcon(key, data);
      return data;
    } catch (_) {
      iconMiss.set(key, Date.now()); // transient failures must not cache a missing logo forever
      return null;
    }
  });
}

const expandEnv = (p) => String(p || '').replace(/%([^%]+)%/g, (m, n) => (process.env[n] !== undefined ? process.env[n] : m));
function readLink(file) {
  if (!IS_WIN || !/\.lnk$/i.test(file || '')) return {};
  try { return shell.readShortcutLink(file) || {}; } catch (_) { return {}; }
}

async function shortcutIcon(s) {
  if (deck.KEY_KINDS.includes(s.kind)) return null;
  if (s.kind === 'url') return siteIcon(s.target);
  if (s.kind === 'aumid') {
    if (/^[a-z]:\\/i.test(s.target)) return shellIcon(s.target, { size: 48 });
    return (await shellIcon(`shell:AppsFolder\\${s.target}`, { size: 48 })) || appxIcon(s.target);
  }
  // .lnk first through the shell (it honours the shortcut's own icon), then its icon file, then the target
  const tries = [];
  const add = (p) => { if (p && !tries.includes(p)) tries.push(p); };
  const link = readLink(s.target);
  if (/\.lnk$/i.test(s.target)) add(s.target);
  const ic = expandEnv(link.icon);
  if (ic && fs.existsSync(ic)) add(ic);
  add(s.iconPath);
  add(expandEnv(link.target));
  add(s.target);
  for (const p of tries) {
    const url = await shellIcon(p, { size: 48 });
    if (url) return url;
  }
  if (link.appUserModelId) return (await shellIcon(`shell:AppsFolder\\${link.appUserModelId}`, { size: 48 })) || appxIcon(link.appUserModelId);
  return null;
}

async function shelfPublic() {
  const out = [];
  for (const s of shelf) out.push({ ...s, icon: await shellIcon(s.path, { size: 64, mode: 'thumb', persist: false }) });
  return out;
}

// ------------------------------------------------------------------ app shortcuts
async function shortcutsPublic() {
  const out = [];
  const list = settings.data.shortcuts || [];
  const icons = await Promise.all(list.map((s) => shortcutIcon(s).catch(() => null)));
  list.forEach((s, i) => out.push({ ...s, icon: icons[i] }));
  return out;
}

function addShortcut(item) {
  if (!item || !item.target || !item.name) return false;
  const list = settings.data.shortcuts || [];
  if (list.some((s) => s.target === item.target)) return false;
  const entry = {
    id: crypto.randomUUID(), name: String(item.name).slice(0, 60), kind: item.kind || 'file', target: String(item.target),
    iconPath: item.iconPath || '',
  };
  settings.set({ shortcuts: [...list, entry].slice(0, deck.MAX_KEYS) });
  return true;
}

// deck keys that are not app launchers (hotkey, media, action, command, text)
function addDeckKey(item) {
  const key = deck.sanitizeKey(item);
  if (!key) return false;
  const list = settings.data.shortcuts || [];
  if (list.length >= deck.MAX_KEYS) return false;
  settings.set({ shortcuts: [...list, { id: crypto.randomUUID(), ...key }] });
  return true;
}

function updateDeckKey(id, patch) {
  const list = settings.data.shortcuts || [];
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) return false;
  const next = list.slice();
  next[i] = { ...list[i], ...deck.sanitizePatch(patch) };
  settings.set({ shortcuts: next });
  return true;
}

function runDeckKey(id) {
  const s = (settings.data.shortcuts || []).find((x) => x.id === id);
  if (!s) return false;
  return deck.run(s, { launch: apps.launch, helper, action: (name) => runAction(name), spawn, isWin: IS_WIN });
}

// ------------------------------------------------------------------ frosted-glass backdrop (blurred wallpaper)
function backdropUrl() { return settings.data.theme === 'glass' && backdrop ? backdrop.url : null; }
function updateBackdrop(force = false) {
  clearInterval(backdropTimer);
  backdropTimer = null;
  if (settings.data.theme !== 'glass') { if (force) toAll('backdrop', null); return; }
  if (!backdrop) backdrop = new Backdrop(nativeImage, log);
  if (backdrop.refresh() || force) toAll('backdrop', backdrop.url);
  // the wallpaper can change at any time (slideshow, theme switch): a cheap stat() notices it
  backdropTimer = setInterval(() => { if (backdrop.refresh()) toAll('backdrop', backdrop.url); }, 30000);
}

let shortcutRetryTimer = null;
let shortcutRetries = 0;
async function broadcastShortcuts() {
  const list = await shortcutsPublic();
  toAll('shortcuts', list);
  if (phoneLink) phoneLink.appsChanged();
  // Retry missing website logos too (network access may not have been ready on the first attempt).
  const missing = list.filter((s) => !s.icon && !deck.KEY_KINDS.includes(s.kind));
  const retryReady = helperReady() || missing.some((s) => s.kind === 'url');
  if (!missing.length) shortcutRetries = 0;
  if (missing.length && retryReady && shortcutRetries < 2 && !shortcutRetryTimer) {
    shortcutRetries += 1;
    shortcutRetryTimer = setTimeout(() => { shortcutRetryTimer = null; broadcastShortcuts(); }, ICON_MISS_RETRY + 5000);
  }
  if (missing.length && retryReady && shortcutRetries >= 2) log('shortcut icons missing', missing.map((s) => `${s.kind}:${s.target}`).join(' | '));
}

// ------------------------------------------------------------------ phone (KDE Connect + Blinkelo Link)
function phoneDownloadDir() {
  const d = settings.data.phone.downloadDir;
  return d && path.isAbsolute(d) ? d : path.join(app.getPath('downloads'), 'Blinkelo');
}

async function captureScreen() {
  const disp = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const w = Math.round(disp.size.width * disp.scaleFactor);
  const h = Math.round(disp.size.height * disp.scaleFactor);
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: w, height: h } });
  const src = sources.find((x) => String(x.display_id) === String(disp.id)) || sources[0];
  if (!src || src.thumbnail.isEmpty()) return null;
  const size = src.thumbnail.getSize();
  return { jpeg: src.thumbnail.toJPEG(82), w: size.width, h: size.height };
}

async function notifAppIcon(app) {
  if (!app) return null;
  if (app.exe) { const u = await shellIcon(app.exe, { size: 48 }); if (u) return u; }
  if (app.aumid && app.aumid.includes('!')) return (await shellIcon(`shell:AppsFolder\\${app.aumid}`, { size: 48 })) || appxIcon(app.aumid);
  return null;
}

function setAttention(ms) {
  clearTimeout(attentionTimer);
  const duration = Math.max(0, Math.min(Number(ms) || 0, 120000));
  attentionUntil = duration > 0 ? Math.max(attentionUntil, Date.now() + duration) : 0;
  if (duration > 0) attentionTimer = setTimeout(() => { attentionUntil = 0; attentionTimer = null; updateVisibility(); }, attentionUntil - Date.now());
  updateVisibility();
}

function startPhone() {
  if (kde || !settings.data.phone.enabled) return;
  kde = new KdeConnect({ dir: path.join(app.getPath('userData'), 'kdeconnect'), log, downloadDir: phoneDownloadDir });
  kde.btSend = (addr, line) => !!(helper && helper.send('bt.send', addr, line));
  kde.btDisconnect = (addr) => { if (helper) helper.send('bt.close', addr); };
  kde.on('status', (st) => { extraStatus.phone = { ...st, at: Date.now() }; send(settingsWin, 'status', statusPayload()); });
  kde.on('devices', (d) => {
    lastPhoneDevices = d;
    toAll('phone', { type: 'devices', ...d });
  });
  for (const ev of ['media', 'notification', 'notificationRemoved', 'telephony', 'ping']) {
    kde.on(ev, (payload) => {
      if (ev === 'telephony' && !payload.isCancel && payload.event === 'ringing' && settings.data.callsOverFullscreen) {
        setAttention(60000);
      }
      if (ev === 'notification' || (ev === 'telephony' && !payload.isCancel && payload.event === 'ringing')) trayBlink();
      toIsland('phone', { type: ev, ...payload });
    });
  }
  for (const ev of ['pairRequest', 'paired', 'unpaired', 'pairRejected', 'pairTimeout', 'pairFailed']) {
    kde.on(ev, (payload) => {
      if (ev === 'pairRequest') { setAttention(25000); trayBlink(); }
      toAll('phone', { type: ev, ...payload });
    });
  }
  phoneLink = new PhoneLink({
    kde,
    helper,
    settings,
    tasks,
    log,
    toIsland,
    attention: setAttention,
    appVersion: app.getVersion(),
    timerFile: path.join(app.getPath('userData'), 'shared-timers.json'),
    readStats: statsShared,
    shortcuts: shortcutsPublic,
    launchShortcut: (id) => runDeckKey(id),
    setClipboardText: (text) => { try { clipboard.writeText(String(text)); } catch (e) { log('clipboard write failed', e.message); } },
    setClipboardImage: (buf) => {
      const img = nativeImage.createFromBuffer(buf);
      if (!img.isEmpty()) clipboard.writeImage(img);
    },
    addToShelf: (paths) => { addShelfPaths(paths); toIsland('shelfChanged', true); },
    appIcon: notifAppIcon,
    capture: captureScreen,
    openUrl: (url) => shell.openExternal(url),
  });
  phoneLink.setGaming({
    state: () => (gaming ? gaming.publicState() : null),
    command: (name, args) => gamingCommand(name, args || {}),
    library: () => (gaming ? gamingLibrary(false) : []),
    sessionIcon: (rec) => gamingSessionIcon(rec),
    temp: () => (settings.data.gaming || {}).temp || 'c',
  });
  kde.start(os.hostname());
}

function stopPhone() {
  if (!kde) return;
  if (phoneLink) { phoneLink.dispose(); phoneLink.removeAllListeners(); phoneLink = null; }
  if (helper) helper.send('bt.closeAll');
  kde.stop();
  kde.removeAllListeners();
  kde = null;
  lastPhoneDevices = null;
  extraStatus.phone = { ok: false, detail: 'off', at: Date.now() };
  toAll('phone', { type: 'devices', me: null, devices: [] });
  toIsland('phone', { type: 'media', present: false });
}

async function phoneCommand(name, a = {}) {
  if (!kde) return false;
  switch (name) {
    case 'media': return kde.mediaAction(a.action, a.arg);
    case 'notifAction': return kde.notificationAction(a.deviceId, a.id, a.action);
    case 'notifReply': return kde.notificationReply(a.deviceId, a.replyId, a.message);
    case 'notifDismiss': return kde.notificationDismiss(a.deviceId, a.id);
    case 'find': return kde.findPhone(a.deviceId);
    case 'mute': return kde.muteRinger(a.deviceId);
    case 'ping': return kde.ping(a.deviceId);
    case 'pair': return kde.requestPair(a.id);
    case 'unpair': return kde.unpair(a.id);
    case 'accept': return kde.acceptPair(a.id);
    case 'reject': return kde.rejectPair(a.id);
    case 'refresh': kde.broadcast(); return true;
    case 'connectIp': return kde.connectIp(String(a.ip || '').trim());
    case 'camera': return kde.cameraRequest(a.deviceId);
    case 'stopFindPc': return phoneLink ? phoneLink.stopFindPc() : false;
    case 'btScan': return phoneLink ? phoneLink.btScan() : false;
    case 'timer': return phoneLink ? phoneLink.timerFromIsland(a) : false;
    case 'timers': return phoneLink ? [...phoneLink.timers.values()] : [];
    case 'sendClipboard': {
      if (!phoneLink) return false;
      let item = clipHistory[0] || null;
      if (!item) { try { const t = await clipboard.readText(); if (t) item = { kind: 'text', text: t }; } catch (_) { item = null; } }
      return phoneLink.sendClipboardNow(item);
    }
    case 'sendFiles': {
      if (!phoneLink) return false;
      const paths = (Array.isArray(a.paths) ? a.paths : []).filter((p) => typeof p === 'string' && (shelf.some((x) => x.path === p) || a.picked));
      return phoneLink.sendFiles(paths, a.deviceId);
    }
    case 'pickAndSend': {
      if (!phoneLink) return false;
      const parent = a.from === 'settings' && settingsWin && !settingsWin.isDestroyed() ? settingsWin : undefined;
      const r = await dialog.showOpenDialog(parent, { properties: ['openFile', 'multiSelections'] });
      if (r.canceled || !r.filePaths.length) return false;
      return phoneLink.sendFiles(r.filePaths, a.deviceId);
    }
    case 'openDownloads': {
      const d = phoneDownloadDir();
      try { fs.mkdirSync(d, { recursive: true }); } catch (_) { /* ignore */ }
      return shell.openPath(d);
    }
    case 'pickDownloadDir': {
      const parent = settingsWin && !settingsWin.isDestroyed() ? settingsWin : undefined;
      const r = await dialog.showOpenDialog(parent, { properties: ['openDirectory', 'createDirectory'], defaultPath: phoneDownloadDir() });
      if (r.canceled || !r.filePaths[0]) return false;
      settings.set({ phone: { downloadDir: r.filePaths[0] } });
      return r.filePaths[0];
    }
    case 'openReceived': {
      // only files that arrived from the phone (they are on the shelf) may be opened from here
      if (typeof a.path !== 'string' || !shelf.some((x) => x.path === a.path)) return false;
      if (a.reveal) { shell.showItemInFolder(a.path); return true; }
      return shell.openPath(a.path);
    }
    case 'downloadDir': return phoneDownloadDir();
    default: return false;
  }
}

// ------------------------------------------------------------------ subtitles
function subsDefaultDir() { return path.join(app.getPath('downloads'), 'Subtitles'); }

// the OpenSubtitles password is kept encrypted with the Windows user's key (DPAPI via safeStorage)
const subsSecret = {
  encrypt(text) {
    try { if (safeStorage.isEncryptionAvailable()) return `ss:${safeStorage.encryptString(String(text)).toString('base64')}`; } catch (_) { /* fall back */ }
    return `b64:${Buffer.from(String(text), 'utf8').toString('base64')}`;
  },
  decrypt(value) {
    const v = String(value || '');
    try {
      if (v.startsWith('ss:')) return safeStorage.decryptString(Buffer.from(v.slice(3), 'base64'));
      if (v.startsWith('b64:')) return Buffer.from(v.slice(4), 'base64').toString('utf8');
    } catch (e) { log('subtitle password decrypt failed', e.message); }
    return '';
  },
};

function startSubtitles() {
  subs = new SubtitleFinder({
    settings,
    log,
    fetch: (url, opts) => net.fetch(url, opts),
    defaultDir: subsDefaultDir,
    indexFile: path.join(app.getPath('userData'), 'subtitles-index.json'),
    version: app.getVersion(),
    secret: subsSecret,
  });
  subsSnap = subs.snapshot();
  subs.on('state', (st) => toAll('subs', st));
  subs.on('ready', ({ file, auto }) => {
    subsDragIcon = null;
    app.getFileIcon(subs.currentFile() || file.path || '', { size: 'normal' }).then((img) => { if (img && !img.isEmpty()) subsDragIcon = img; }).catch(() => {});
    // most people watch full screen: show the island for a moment so the subtitle can be dragged onto the player
    if (auto) setAttention(9000);
  });
}

async function subsCommand(name, a = {}) {
  if (!subs) return null;
  switch (name) {
    case 'state': return subs.publicState();
    case 'search':
      subs.search({ lang: typeof a.lang === 'string' ? a.lang : null, query: typeof a.query === 'string' ? a.query.slice(0, 120) : '', pick: typeof a.lang === 'string' && !a.query })
        .catch((e) => log('subtitle search failed', e.message));
      return true;
    case 'choose': return subs.choose(String(a.id || ''));
    case 'reveal': {
      const f = subs.currentFile();
      if (f) shell.showItemInFolder(f);
      return !!f;
    }
    case 'openDir': {
      const d = subs.dir();
      try { fs.mkdirSync(d, { recursive: true }); } catch (_) { /* ignore */ }
      return shell.openPath(d);
    }
    case 'dir': return subs.dir();
    case 'pickDir': {
      const parent = settingsWin && !settingsWin.isDestroyed() ? settingsWin : undefined;
      const r = await dialog.showOpenDialog(parent, { properties: ['openDirectory', 'createDirectory'], defaultPath: subs.dir() });
      if (r.canceled || !r.filePaths[0]) return false;
      settings.set({ subtitles: { dir: r.filePaths[0] } });
      return r.filePaths[0];
    }
    case 'resetDir': settings.set({ subtitles: { dir: '' } }); return subs.dir();
    case 'test': return subs.test(String(a.provider || ''));
    case 'login': {
      const v = subs.setPassword(a.user, a.pass);
      settings.set({ subtitles: { providers: { opensubtitles: v } } });
      return true;
    }
    case 'langs': return SUB_LANGS.map((l) => ({ code: l.code, name: l.name, english: l.english }));
    default: return null;
  }
}

// ------------------------------------------------------------------ weather
function configureWeather() {
  if (!weather) return;
  const w = settings.data.weather;
  weather.configure({ city: w.city, unit: w.unit, enabled: w.enabled && settings.data.modules.weather });
}

// ------------------------------------------------------------------ helper messages
const PHONE_HELPER_TYPES = new Set(['media', 'player', 'volume', 'net', 'battery', 'toast', 'toastRemoved', 'bt']);
function onHelperMessage(msg) {
  if (phoneLink && PHONE_HELPER_TYPES.has(msg.type)) {
    try { phoneLink.onHelper(msg); } catch (e) { log('phone helper message failed', e.stack || e.message); }
  }
  if (subs && (msg.type === 'player' || msg.type === 'media')) {
    try { subs.onHelper(msg); } catch (e) { log('subtitle helper message failed', e.stack || e.message); }
  }
  if (msg.type === 'bt') return;
  if (gaming && (msg.type === 'battery' || (typeof msg.type === 'string' && msg.type.startsWith('game.')))) {
    try { gaming.onHelper(msg); } catch (e) { log('gaming helper message failed', e.stack || e.message); }
    if (msg.type !== 'battery') return;
  }
  switch (msg.type) {
    case 'fullscreen':
      lastFsMsg = msg.busy ? msg : null;
      fsBusy = !!msg.busy && fullscreenOnIslandDisplay(msg);
      msg.busy = fsBusy;
      updateVisibility();
      break;
    case 'clipboard':
      onClipboardChanged(!!msg.sensitive, msg);
      return;
    case 'icon': {
      const cb = pendingIcons.get(msg.id);
      if (cb) { pendingIcons.delete(msg.id); cb(msg.data); }
      return;
    }
    case 'accent':
      if (typeof msg.color === 'string' && /^#[0-9a-f]{6}$/i.test(msg.color)) {
        helperAccent = msg.color;
        toIsland('accent', accentColor());
      }
      return;
    case 'toast':
      if (msg.call && settings.data.callsOverFullscreen) {
        setAttention(60000);
      }
      trayBlink();
      break;
    case 'ready':
      applyNoActivate();
      if (gaming) gaming.onHelperReady();
      if (phoneLink) { phoneLink.btWant = null; phoneLink.updateBluetooth(); }
      shortcutRetries = 0;
      iconMiss.clear();
      setTimeout(() => { broadcastShortcuts().catch(() => {}); }, 400); // icons now come from the shell
      break;
    case 'winstyle':
      log('island window ex-style', `${(msg.before >>> 0).toString(16)} -> ${(msg.after >>> 0).toString(16)}`);
      return;
    default:
      break;
  }
  toIsland('helper', msg);
}

function statusPayload() {
  return {
    helper: { ...helper.status, ...extraStatus },
    helperReady: helper.ready,
    platform: process.platform,
    version: app.getVersion(),
    electron: process.versions.electron,
    userData: app.getPath('userData'),
    gpu: !!gpuPath,
  };
}

// ------------------------------------------------------------------ IPC
function registerIpc() {
  ipcMain.handle('settings:get', () => settings.get());
  ipcMain.handle('settings:set', (_e, patch) => settings.set(patch));
  ipcMain.handle('settings:reset', () => { settings.reset(); return settings.get(); });
  ipcMain.handle('settings:language', (_e, code) => { setLanguage(code); return settings.get(); });
  ipcMain.handle('status:get', () => statusPayload());
  ipcMain.handle('displays:get', () => {
    const primary = screen.getPrimaryDisplay().id;
    return screen.getAllDisplays().map((d, i) => ({ id: String(d.id), label: d.label || `Display ${i + 1}`, primary: d.id === primary, size: `${d.size.width}×${d.size.height}` }));
  });
  ipcMain.handle('accent:get', () => accentColor());
  ipcMain.handle('icon:forExe', async (_e, p) => (p && typeof p === 'string' && fs.existsSync(p) ? fileIcon(p) : null));
  ipcMain.handle('image:data', async (_e, p) => {
    if (!p || typeof p !== 'string' || /\.(exe|dll|bat|cmd|ps1|txt|json|js|lnk)$/i.test(p)) return null;
    try {
      const st = fs.statSync(p);
      if (!st.isFile() || st.size > 10 * 1024 * 1024) return null;
      let img = nativeImage.createFromPath(p);
      if (img.isEmpty()) img = nativeImage.createFromBuffer(fs.readFileSync(p));
      if (img.isEmpty()) return null;
      const s = img.getSize();
      if (s.width > 160) img = img.resize({ width: 160 });
      return img.toDataURL();
    } catch (_) { return null; }
  });

  // shelf
  ipcMain.handle('shelf:get', () => shelfPublic());
  ipcMain.handle('shelf:add', async (_e, paths) => {
    addShelfPaths(paths);
    return shelfPublic();
  });
  ipcMain.handle('shelf:remove', (_e, p) => { shelf = shelf.filter((s) => s.path !== p); saveShelf(); return shelfPublic(); });
  ipcMain.handle('shelf:clear', () => { shelf = []; saveShelf(); return []; });
  ipcMain.handle('shelf:open', (_e, p) => (shelf.some((s) => s.path === p) ? shell.openPath(p) : null));
  ipcMain.handle('shelf:reveal', (_e, p) => { if (shelf.some((s) => s.path === p)) shell.showItemInFolder(p); });
  ipcMain.on('shelf:drag', (e, p) => {
    if (!shelf.some((s) => s.path === p)) return;
    const cached = iconCache.get(p);
    let icon = cached ? nativeImage.createFromDataURL(cached) : null;
    if (!icon || icon.isEmpty()) icon = nativeImage.createFromPath(path.join(ASSETS, 'icon.png')).resize({ width: 32 });
    try { e.sender.startDrag({ file: p, icon }); } catch (err) { log('drag failed', err.message); }
    e.reply('dragDone', { ok: true });
  });

  // subtitles: the file is always the finder's current one, never a path from the renderer
  ipcMain.handle('gaming:get', () => (gaming ? gaming.publicState() : null));
  ipcMain.handle('gaming:cmd', (_e, name, args) => gamingCommand(String(name || ''), args || {}));
  ipcMain.on('gamebar:size', (_e, w, h) => {
    const nw = Math.round(Math.min(Math.max(Number(w) || 0, 60), 2400));
    const nh = Math.round(Math.min(Math.max(Number(h) || 0, 16), 120));
    if (nw === gamebarSize.w && nh === gamebarSize.h) return;
    gamebarSize = { w: nw, h: nh };
    placeGamebar();
  });
  ipcMain.handle('subs:get', () => (subs ? subs.publicState() : null));
  ipcMain.handle('subs:cmd', (_e, name, args) => subsCommand(String(name || ''), args || {}));
  ipcMain.on('subs:drag', (e) => {
    const file = subs && subs.currentFile();
    if (!file) { e.reply('dragDone', { ok: false }); return; }
    let icon = subsDragIcon && !subsDragIcon.isEmpty() ? subsDragIcon : null;
    if (!icon) icon = nativeImage.createFromPath(path.join(ASSETS, 'icon.png')).resize({ width: 32 });
    try { e.sender.startDrag({ file, icon }); } catch (err) { log('subtitle drag failed', err.message); }
    e.reply('dragDone', { ok: true });
  });

  // clipboard
  ipcMain.handle('clipboard:history', () => publicClipHistory());
  ipcMain.handle('clipboard:write', async (_e, id) => {
    const c = clipHistory.find((x) => x.id === id);
    if (!c) return false;
    try { await writeClipboardEntry(c); return true; } catch (e) { log('clipboard write failed', e.message); return false; }
  });
  ipcMain.handle('clipboard:clear', () => { clipHistory = []; return []; });

  // shortcuts
  ipcMain.handle('shortcuts:get', () => shortcutsPublic());
  ipcMain.handle('shortcuts:installed', async (_e, force) => (await apps.listInstalled(!!force)).map((a) => ({ name: a.name, kind: a.kind, target: a.target, iconPath: a.iconPath })));
  ipcMain.handle('shortcuts:icon', (_e, item) => (item ? shortcutIcon(item).catch(() => null) : null));
  ipcMain.handle('shortcuts:add', async (_e, item) => { const ok = addShortcut(item); return ok; });
  ipcMain.handle('shortcuts:remove', (_e, id) => { settings.set({ shortcuts: (settings.data.shortcuts || []).filter((s) => s.id !== id) }); return true; });
  ipcMain.handle('shortcuts:move', (_e, id, dir) => {
    const list = [...(settings.data.shortcuts || [])];
    const i = list.findIndex((s) => s.id === id);
    const j = i + (dir < 0 ? -1 : 1);
    if (i < 0 || j < 0 || j >= list.length) return false;
    [list[i], list[j]] = [list[j], list[i]];
    settings.set({ shortcuts: list });
    return true;
  });
  ipcMain.handle('shortcuts:launch', (_e, id) => runDeckKey(id));
  ipcMain.handle('shortcuts:addKey', (_e, item) => addDeckKey(item));
  ipcMain.handle('shortcuts:update', (_e, id, patch) => updateDeckKey(id, patch));
  ipcMain.handle('backdrop:get', () => backdropUrl());
  ipcMain.handle('shortcuts:browse', async () => {
    const parent = settingsWin && !settingsWin.isDestroyed() ? settingsWin : undefined;
    const r = await dialog.showOpenDialog(parent, {
      properties: ['openFile'],
      filters: [{ name: 'Apps', extensions: ['exe', 'lnk', 'url', 'bat', 'cmd', 'msc', 'appref-ms'] }, { name: '*', extensions: ['*'] }],
    });
    if (r.canceled || !r.filePaths[0]) return false;
    const f = r.filePaths[0];
    return addShortcut({ name: path.basename(f).replace(/\.(exe|lnk|url|bat|cmd|msc)$/i, ''), kind: 'file', target: f, iconPath: f });
  });
  ipcMain.handle('shortcuts:addPaths', (_e, paths) => {
    let n = 0;
    for (const f of (paths || []).slice(0, 10)) {
      if (f && fs.existsSync(f) && addShortcut({ name: path.basename(f).replace(/\.(exe|lnk|url)$/i, ''), kind: 'file', target: f, iconPath: f })) n += 1;
    }
    return n;
  });

  // widgets
  ipcMain.handle('widgets:get', () => lastWidgets);
  ipcMain.handle('widgets:refresh', (_e, kind) => { if (widgets) widgets.refresh(kind === 'crypto' || kind === 'news' ? kind : undefined); return true; });
  ipcMain.handle('widgets:catalog', () => ({
    coins: Object.entries(COINS).map(([sym, c]) => ({ sym, name: c.name })),
    feeds: FEEDS.map((f) => ({ id: f.id, name: f.name, url: f.url, lang: f.lang })),
    defaultFeeds: defaultFeeds(settings.data.language),
  }));
  ipcMain.handle('widgets:testFeed', async (_e, url) => {
    try {
      if (!/^https?:\/\//i.test(url || '')) return { ok: false };
      const res = await net.fetch(url, { headers: { 'User-Agent': `Blinkelo/${app.getVersion()}` } });
      const txt = await res.text();
      const { parseFeed } = require('./widgets');
      const items = parseFeed(txt, { id: 'test', name: 'test' });
      const title = (txt.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
      return { ok: items.length > 0, count: items.length, title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim().slice(0, 60) };
    } catch (e) { return { ok: false, error: e.message }; }
  });

  // planner
  ipcMain.handle('tasks:get', () => (tasks ? tasks.all() : []));
  ipcMain.handle('tasks:add', (_e, t) => (tasks ? tasks.add(t) : null));
  ipcMain.handle('tasks:update', (_e, id, patch) => (tasks ? tasks.update(id, patch) : false));
  ipcMain.handle('tasks:remove', (_e, id) => (tasks ? tasks.remove(id) : false));
  ipcMain.handle('tasks:clearDone', () => { if (tasks) tasks.clearDone(); return true; });

  // weather
  ipcMain.handle('weather:search', async (_e, q) => {
    try { return await searchCity(q, settings.data.language); } catch (e) { log('city search failed', e.message); return { error: e.message }; }
  });
  ipcMain.handle('weather:get', () => lastWeather);
  ipcMain.handle('weather:refresh', () => { if (weather) weather.refresh(); return true; });

  // phone
  ipcMain.handle('phone:get', () => lastPhoneDevices || { me: null, devices: [] });
  ipcMain.handle('phone:cmd', (_e, name, args) => phoneCommand(name, args || {}));

  // island geometry / interaction
  ipcMain.on('island:rects', (_e, rects) => {
    if (Array.isArray(rects)) islandRects = rects.filter((r) => r && Number.isFinite(r.x) && Number.isFinite(r.w));
  });
  ipcMain.on('island:interactive', (_e, on) => { interactiveUntil = on ? Date.now() + 2500 : 0; });
  ipcMain.on('island:hit', () => {
    // fast path: the renderer saw a forwarded mouse move over the island
    if (islandWin && !islandWin.isDestroyed() && islandWin.isVisible() && insideIsland()) setInside(true);
  });
  ipcMain.on('island:drag', (_e, phase) => { if (phase === 'start') startDrag(); else endDrag(); });
  ipcMain.on('island:focus', (_e, on) => {
    if (!islandWin || islandWin.isDestroyed()) return;
    if (IS_WIN) {
      // never toggle focusable on Windows (see createIsland); only lift WS_EX_NOACTIVATE while typing
      // (no blur() afterwards: Chromium would hand focus to whatever window is next in z-order, often the taskbar)
      islandTyping = !!on;
      applyNoActivate();
      if (on) setTimeout(() => { if (islandWin && !islandWin.isDestroyed()) islandWin.focus(); }, 40);
      return;
    }
    islandWin.setFocusable(!!on);
    if (on) islandWin.focus();
  });
  ipcMain.on('island:diag', (_e, info) => {
    const now = Date.now();
    if (now - lastDiagLog < 3000) return;
    lastDiagLog = now;
    log('island input', JSON.stringify(info).slice(0, 300));
  });
  ipcMain.on('island:attention', (_e, ms, kind) => {
    if (kind === 'call' && settings.data.callsOverFullscreen === false) return;
    setAttention(ms);
  });
  ipcMain.on('island:stats', (_e, on) => setStatsSubscribed(!!on && settings.data.modules.stats));
  ipcMain.on('helper:send', (_e, name, args) => {
    const allowed = /^(keys\.media|media\.(toggle|play|pause|next|prev|seek|refresh)|volume\.(set|delta|mute|toggleMute)|audio\.meter|uia\.(invoke|reply)|notif\.recent|sys\.refresh)$/;
    if (typeof name === 'string' && allowed.test(name)) helper.send(name, ...(Array.isArray(args) ? args : []));
  });
  ipcMain.handle('action', (_e, name, arg) => runAction(name, arg));
  ipcMain.on('log', (_e, ...parts) => log('[renderer]', ...parts));

  // settings window
  ipcMain.handle('test', (_e, kind) => { toIsland('demo', kind); return true; });
  ipcMain.handle('helper:restart', () => { helper.restart(); return true; });
  ipcMain.handle('logs:open', () => shell.openPath(path.dirname(logFile)));
  ipcMain.handle('app:quit', () => app.quit());
}

function runAction(name, arg) {
  switch (name) {
    case 'screenshot': return shell.openExternal('ms-screenclip:');
    case 'lock': if (IS_WIN) spawn('rundll32.exe', ['user32.dll,LockWorkStation'], { detached: true, stdio: 'ignore' }).unref(); return true;
    case 'phonelink': return openShellApp(PHONE_LINK_AUMID);
    case 'explorer': if (IS_WIN) spawn('explorer.exe', [], { detached: true, stdio: 'ignore' }).unref(); return true;
    case 'calc': if (IS_WIN) spawn('calc.exe', [], { detached: true, stdio: 'ignore' }).unref(); return true;
    case 'taskmgr': if (IS_WIN) spawn('taskmgr.exe', [], { detached: true, stdio: 'ignore' }).unref(); return true;
    case 'winsettings': return shell.openExternal('ms-settings:');
    case 'focus': return shell.openExternal('ms-settings:quiethours');
    case 'settings': openSettings(arg); return true;
    case 'openApp': return openShellApp(arg);
    case 'openUrl': if (typeof arg === 'string' && /^(https?:\/\/|ms-settings:)/.test(arg)) return shell.openExternal(arg); return false;
    case 'minimize': settings.set({ minimized: !settings.data.minimized }); return true;
    case 'hide': settings.set({ hidden: true }); return true;
    default: return false;
  }
}

// ------------------------------------------------------------------ gaming mode
function gamingOwnPids() {
  const pids = new Set([process.pid]);
  try { for (const m of app.getAppMetrics()) pids.add(m.pid); } catch (_) { /* ignore */ }
  if (helper && helper.proc && helper.proc.pid) pids.add(helper.proc.pid);
  return [...pids];
}

function startGaming() {
  gaming = new Gaming({
    helper,
    dir: app.getPath('userData'),
    log,
    sysStats: () => statsShared(),
    ownPids: gamingOwnPids,
    openPath: (p) => { if (typeof p === 'string' && /\.exe$/i.test(p) && fs.existsSync(p)) spawn(p, [], { detached: true, stdio: 'ignore', cwd: path.dirname(p) }).unref(); },
    openShell: (p) => { if (typeof p === 'string' && fs.existsSync(p)) shell.openPath(p).catch(() => {}); },
    launch: launchGame,
  });
  gaming.on('library', (ver) => toAll('gamingLibrary', ver));
  gaming.on('state', (st) => { toAll('gaming', st); if (phoneLink) phoneLink.gameState(st); });
  gaming.on('metrics', (m) => { send(gamebarWin, 'gamebar:data', m); if (phoneLink) phoneLink.gameMetrics(); });
  gaming.on('hud', (on) => { showGamebar(on); updateVisibility(); });
  gaming.on('quiet', (on) => { if (widgets) widgets.setPaused(on); updateVisibility(); });
  gaming.on('summary', (rec) => { toIsland('gameSummary', rec); if (phoneLink) phoneLink.gameSummary(rec).catch(() => {}); });
  gaming.configure(settings.data.gaming);
  applyGamingHotkey();
}

// split "a b" "c" into arguments (launcher command lines from GOG)
function splitArgs(str) {
  const out = [];
  String(str || '').replace(/"([^"]*)"|(\S+)/g, (_m, q, w) => { out.push(q !== undefined ? q : w); return ''; });
  return out;
}

const GAME_URL_RE = /^(steam|com\.epicgames\.launcher|uplay|goggalaxy):\/\//i;
const QUICK_EXIT_MS = 10000;
// Games must not inherit this app's Chromium / Electron variables (crash-reporter pipe etc.): launchers that are
// built on Chromium themselves pick them up.
function launchEnv() {
  const env = { ...process.env };
  for (const k of Object.keys(env)) if (/^(CHROME_|ELECTRON_)/i.test(k)) delete env[k];
  return env;
}
function launchGame(l) {
  return new Promise((resolve) => {
    if (!l || !l.target) { resolve(false); return; }
    if (l.kind === 'url') {
      if (!GAME_URL_RE.test(l.target)) { resolve(false); return; }
      shell.openExternal(l.target).then(() => resolve(true), () => resolve(false));
      return;
    }
    if (!fs.existsSync(l.target)) { resolve(false); return; }
    if (l.kind === 'open' || !/\.exe$/i.test(l.target)) { shell.openPath(l.target).then((err) => resolve(!err), () => resolve(false)); return; }
    try {
      const started = Date.now();
      const child = spawn(l.target, splitArgs(l.args), { cwd: l.cwd && fs.existsSync(l.cwd) ? l.cwd : path.dirname(l.target), env: launchEnv(), detached: true, stdio: 'ignore', windowsHide: false });
      // games that ask for administrator rights can't be spawned directly: let the shell show the UAC prompt
      child.once('error', () => { shell.openPath(l.target).then((err) => resolve(!err), () => resolve(false)); });
      child.once('spawn', () => {
        // lets gaming mode notice a process that ends almost at once (a launcher stub, or a game that could not start)
        const exited = new Promise((done) => {
          const timer = setTimeout(() => done(null), QUICK_EXIT_MS);
          child.once('exit', (code) => { clearTimeout(timer); done({ code, ms: Date.now() - started }); });
        });
        child.unref();
        resolve({ ok: true, pid: child.pid, exited });
      });
    } catch (_) {
      shell.openPath(l.target).then((err) => resolve(!err), () => resolve(false));
    }
  });
}

const gameIcons = new Map();
async function gameIcon(g) {
  const key = `${g.id}|${g.icon}|${g.cover}`;
  if (gameIcons.has(key)) return gameIcons.get(key);
  let url = null;
  if (g.icon) url = await shellIcon(g.icon, { size: 64 }).catch(() => null);
  if (!url && g.cover && fs.existsSync(g.cover)) {
    try {
      const img = nativeImage.createFromPath(g.cover);
      if (!img.isEmpty()) {
        const { width, height } = img.getSize();
        const side = Math.min(width, height);
        url = img.crop({ x: Math.round((width - side) / 2), y: Math.round((height - side) / 3), width: side, height: side }).resize({ width: 64, height: 64, quality: 'best' }).toDataURL();
      }
    } catch (_) { /* ignore */ }
  }
  gameIcons.set(key, url);
  return url;
}

// icon of the running game (or of a finished session) for the phone: library icon first, else the exe's own icon
async function gamingSessionIcon(rec) {
  const s = rec || (gaming && gaming.session);
  if (!s || !s.path) return null;
  const p = String(s.path).toLowerCase();
  const g = ((gaming && gaming.library) || []).find((x) => x.dir && p.startsWith(String(x.dir).toLowerCase() + path.sep));
  if (g) return gameIcon(g);
  return shellIcon(s.path, { size: 64 }).catch(() => null);
}

async function gamingLibrary(refresh) {
  const list = await gaming.command('library', { refresh });
  const out = [];
  for (const g of list || []) out.push({ id: g.id, name: g.name, source: g.source, played: g.played, hidden: g.hidden, icon: await gameIcon(g) });
  return out;
}

async function gamingCommand(name, a) {
  if (!gaming) return null;
  if (name === 'library') return gamingLibrary(!!a.refresh);
  if (name === 'hideGame' || name === 'unhideGame') {
    const id = String(a.id || '');
    const hidden = (settings.data.gaming.hidden || []).filter((x) => x !== id);
    if (name === 'hideGame') hidden.push(id);
    settings.set({ gaming: { hidden } });
    return gamingLibrary(false);
  }
  if (name === 'addGame') {
    const owner = settingsWin && !settingsWin.isDestroyed() && settingsWin.isVisible() ? settingsWin : undefined;
    const r = await dialog.showOpenDialog(owner, { properties: ['openFile'], filters: [{ name: 'Games', extensions: ['exe', 'lnk', 'url'] }] });
    if (r.canceled || !r.filePaths[0]) return null;
    const p = r.filePaths[0];
    const lib = (settings.data.gaming.library || []).filter((x) => String(x.path).toLowerCase() !== p.toLowerCase());
    lib.push({ name: path.basename(p).replace(/\.(exe|lnk|url)$/i, ''), path: p });
    settings.set({ gaming: { library: lib.slice(-100) } });
    await gaming.refreshLibrary(true);
    return gamingLibrary(false);
  }
  if (name === 'removeCustom') {
    const id = String(a.id || '');
    settings.set({ gaming: { library: (settings.data.gaming.library || []).filter((x) => `exe:${String(x.path).toLowerCase()}` !== id) } });
    await gaming.refreshLibrary(true);
    return gamingLibrary(false);
  }
  if (name === 'markGame' || name === 'ignoreGame') {
    const r = await gaming.command(name, a);
    if (!r) return null;
    const g = settings.data.gaming;
    const other = r.list === 'games' ? 'ignore' : 'games';
    settings.set({ gaming: { [r.list]: [...new Set([...(g[r.list] || []), r.name])], [other]: (g[other] || []).filter((x) => gameExeName(x) !== r.name) } });
    return gaming.publicState();
  }
  if (name === 'removeGame') {
    const n = gameExeName(String(a.name || ''));
    const g = settings.data.gaming;
    settings.set({ gaming: { games: (g.games || []).filter((x) => gameExeName(x) !== n), ignore: (g.ignore || []).filter((x) => gameExeName(x) !== n) } });
    return gaming.publicState();
  }
  if (name === 'settings') { openSettings('gaming'); return true; }
  return gaming.command(name, a);
}

function applyGamingHotkey() {
  try {
    if (gamingHotkey) globalShortcut.unregister(gamingHotkey);
    gamingHotkey = null;
    const g = settings.data.gaming || {};
    const hk = g.enabled && g.hud ? g.hud.hotkey : '';
    if (!hk || hk === settings.data.shortcut) return;
    if (globalShortcut.register(hk, () => { if (gaming) gaming.toggleHud(); })) gamingHotkey = hk;
    else log('gaming hotkey registration failed', hk);
  } catch (e) {
    log('gaming hotkey error', e.message);
  }
}

function gamebarDisplay() {
  if (lastFsMsg && lastFsMsg.mw) {
    try {
      let r = { x: lastFsMsg.mx, y: lastFsMsg.my, width: lastFsMsg.mw, height: lastFsMsg.mh };
      if (IS_WIN && typeof screen.screenToDipRect === 'function') r = screen.screenToDipRect(null, r);
      return screen.getDisplayMatching(r);
    } catch (_) { /* ignore */ }
  }
  return targetDisplay();
}

function placeGamebar() {
  if (!gamebarWin || gamebarWin.isDestroyed()) return;
  const d = gamebarDisplay();
  const b = d.bounds;
  const pos = ((settings.data.gaming || {}).hud || {}).position || 'center';
  const { w, h } = gamebarSize;
  const x = pos === 'left' ? b.x + 10 : pos === 'right' ? b.x + b.width - w - 10 : b.x + Math.round((b.width - w) / 2);
  gamebarWin.setBounds({ x: Math.round(x), y: b.y, width: w, height: h });
}

function gamebarConfig() {
  const g = settings.data.gaming || {};
  return { hud: g.hud, temp: g.temp, language: settings.data.language, accent: accentColor() };
}

function createGamebar() {
  gamebarWin = new BrowserWindow({
    width: gamebarSize.w,
    height: gamebarSize.h,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false,
    alwaysOnTop: true,
    backgroundColor: '#00000000',
    title: 'Blinkelo - game bar',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'gamebar-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  gamebarWin.setIgnoreMouseEvents(true);
  gamebarWin.setAlwaysOnTop(true, 'screen-saver');
  gamebarWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  gamebarWin.loadFile(path.join(__dirname, '..', 'renderer', 'gamebar', 'gamebar.html'));
  gamebarWin.webContents.on('did-finish-load', () => {
    send(gamebarWin, 'gamebar:config', gamebarConfig());
    if (gaming && gaming.metrics) send(gamebarWin, 'gamebar:data', gaming.publicMetrics());
  });
  gamebarWin.on('closed', () => { gamebarWin = null; });
}

// A fullscreen game that becomes active (or makes itself topmost) can end up above the bar: put it back on top
// every two seconds while it is shown. Never activates the bar, so the game keeps the keyboard.
let gamebarTopTimer = null;
function raiseGamebar() {
  if (!gamebarWin || gamebarWin.isDestroyed() || !gamebarWin.isVisible()) return;
  gamebarWin.setAlwaysOnTop(true, 'screen-saver');
  if (IS_WIN) gamebarWin.moveTop();
}
function showGamebar(on) {
  if (on) {
    if (!gamebarWin || gamebarWin.isDestroyed()) createGamebar();
    placeGamebar();
    send(gamebarWin, 'gamebar:config', gamebarConfig());
    if (!gamebarWin.isVisible()) gamebarWin.showInactive();
    gamebarWin.setAlwaysOnTop(true, 'screen-saver');
    gamebarWin.moveTop();
    if (!gamebarTopTimer) gamebarTopTimer = setInterval(raiseGamebar, 2000);
  } else {
    clearInterval(gamebarTopTimer);
    gamebarTopTimer = null;
    if (gamebarWin && !gamebarWin.isDestroyed() && gamebarWin.isVisible()) gamebarWin.hide();
  }
}

// ------------------------------------------------------------------ widgets
function configureWidgets() {
  if (widgets) widgets.configure(settings.data.widgets || {}, settings.data.language);
}

// ------------------------------------------------------------------ app lifecycle
app.on('second-instance', () => openSettings());

app.whenReady().then(() => {
  const logDir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  logFile = path.join(logDir, 'main.log');
  try { if (fs.existsSync(logFile) && fs.statSync(logFile).size > 2 * 1024 * 1024) fs.renameSync(logFile, `${logFile}.old`); } catch (_) { /* ignore */ }
  log(`starting v${app.getVersion()} electron ${process.versions.electron} on ${process.platform} ${os.release()}`);
  if (profileMigration) log(`profile copied from ${profileMigration.from}: ${profileMigration.files} files, ${profileMigration.failed} failed`);

  settings = new Settings(app.getPath('userData'));
  if (settings.damaged) log(`settings.json was damaged (kept as settings.json.broken); ${settings.loadedFrom === 'backup' ? 'restored from settings.json.bak' : 'no backup, using defaults'}`);
  gpuPath = findNvidiaSmi();
  gpuStats = gpuPath ? new GpuStats({ exe: gpuPath, spawn, log }) : null;
  loadShelf();
  registerIpc();
  createIsland();
  createTray();
  setTimeout(trayHello, 1700);
  applyShortcut();
  applyLoginItem();

  helper = new HelperBridge({
    scriptPath: path.join(ROOT, 'native', 'helper.ps1'),
    cacheDir: path.join(app.getPath('userData'), 'native-cache'),
    logFile: path.join(logDir, 'helper.log'),
  });
  helper.on('message', onHelperMessage);
  helper.on('status', () => send(settingsWin, 'status', statusPayload()));
  helper.start();
  if (!IS_WIN) startClipboardPollingFallback();

  weather = new Weather(log);
  weather.on('update', (d) => { lastWeather = d; toAll('weather', d); });
  weather.on('status', (st) => { extraStatus.weather = { ...st, at: Date.now() }; send(settingsWin, 'status', statusPayload()); });
  configureWeather();

  widgets = new Widgets(log);
  widgets.on('update', (d) => { lastWidgets = d; toAll('widgets', d); });
  configureWidgets();

  tasks = new Tasks(app.getPath('userData'), log);
  tasks.on('change', (list) => toAll('tasks', list));
  tasks.on('reminder', (t) => {
    toIsland('reminder', t);
    setAttention(20000);
    trayBlink();
  });
  tasks.startReminders();

  try { startPhone(); } catch (e) { log('phone start failed', e.stack || e.message); }
  try { startSubtitles(); } catch (e) { log('subtitles start failed', e.stack || e.message); }
  try { startGaming(); } catch (e) { log('gaming start failed', e.stack || e.message); }

  let prev = settings.get();
  settings.on('change', (s) => {
    toAll('settings', s);
    toIsland('accent', accentColor());
    if (JSON.stringify(prev.position) !== JSON.stringify(s.position) || prev.movable !== s.movable || prev.display !== s.display) positionIsland();
    if (prev.shortcut !== s.shortcut) applyShortcut();
    if (prev.startWithWindows !== s.startWithWindows) applyLoginItem();
    if (JSON.stringify(prev.weather) !== JSON.stringify(s.weather) || prev.modules.weather !== s.modules.weather) configureWeather();
    if (prev.phone.enabled !== s.phone.enabled) { if (s.phone.enabled) startPhone(); else stopPhone(); }
    if (prev.phone.bluetooth !== s.phone.bluetooth && phoneLink) phoneLink.updateBluetooth();
    if (JSON.stringify(prev.shortcuts) !== JSON.stringify(s.shortcuts)) broadcastShortcuts();
    if (prev.theme !== s.theme) updateBackdrop(true);
    if (JSON.stringify(prev.widgets) !== JSON.stringify(s.widgets) || prev.language !== s.language) configureWidgets();
    if (subs && (JSON.stringify(prev.subtitles) !== JSON.stringify(s.subtitles) || prev.language !== s.language)) {
      const [langs, providers, enabled] = subsSnap || subs.snapshot();
      subs.settingsChanged(langs, providers, enabled);
      subsSnap = subs.snapshot();
    }
    if (gaming && JSON.stringify(prev.gaming) !== JSON.stringify(s.gaming)) {
      gaming.configure(s.gaming);
      if (JSON.stringify(prev.gaming.hidden) !== JSON.stringify(s.gaming.hidden)) toAll('gamingLibrary', gaming.libVer);
      if (JSON.stringify(prev.gaming.hud) !== JSON.stringify(s.gaming.hud) || prev.gaming.temp !== s.gaming.temp) { placeGamebar(); send(gamebarWin, 'gamebar:config', gamebarConfig()); }
    }
    if (prev.language !== s.language) send(gamebarWin, 'gamebar:config', gamebarConfig());
    if (JSON.stringify(prev.gaming.hud.hotkey) !== JSON.stringify(s.gaming.hud.hotkey) || prev.gaming.enabled !== s.gaming.enabled || prev.shortcut !== s.shortcut) applyGamingHotkey();
    prev = s;
    updateVisibility();
    updateTrayMenu();
  });

  if (IS_WIN) systemPreferences.on('accent-color-changed', () => toIsland('accent', accentColor()));
  updateBackdrop();
  screen.on('display-metrics-changed', () => { positionIsland(); placeGamebar(); });
  screen.on('display-added', positionIsland);
  screen.on('display-removed', positionIsland);
  powerMonitor.on('resume', () => {
    positionIsland();
    helper.send('sys.refresh');
    helper.send('media.refresh');
    if (kde) kde.broadcast();
    if (weather) weather.refresh();
    if (widgets) widgets.refresh();
  });

  if (!settings.data.onboarded) setTimeout(() => openSettings('onboarding'), 900);
});

app.on('window-all-closed', (e) => e.preventDefault());

// Quitting while the gaming optimizations are applied: put the power plan, Game Mode and recording settings back
// first, while the helper is still running. Bounded, so a stuck helper can never keep the app from closing; whatever
// did not finish is completed at the next start (the restore file is kept until the undo is done).
// (Windows does not send before-quit on shutdown / sign-out: that case is also handled at the next start.)
let quitRestore = 'idle'; // idle | running | done
app.on('before-quit', (e) => {
  if (quitRestore !== 'idle' || !gaming || !gaming.restoreInfo) return;
  e.preventDefault();
  quitRestore = 'running';
  const finish = () => {
    if (quitRestore === 'done') return;
    quitRestore = 'done';
    clearTimeout(timer);
    app.quit();
  };
  const timer = setTimeout(finish, 2500);
  gaming.shutdown().catch((err) => log('gaming restore on quit failed', err && err.message)).then(finish);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (subs) subs.dispose();
  if (gaming) gaming.dispose();
  if (gpuStats) gpuStats.stop();
  // the phone link first: closing a Bluetooth link still talks to the helper
  if (kde) kde.stop();
  if (helper) helper.stop();
});
