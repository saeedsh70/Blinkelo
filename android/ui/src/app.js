import { icon } from './icons.js';
import { STRINGS, LANGS, RTL } from './strings.js';
import { call, send, onNativeEvent, isMock } from './native.js';
import { monthGrid, currentYm, shiftYm, isoOf, dateOfIso } from './calendar.js';
import { Touchpad } from './touchpad.js';
import DM from './deck-meta.js';
import { DECK_ICONS } from './deck-icons.js';
import { faceHtml, createBlinker, followPointer } from './blink.js';

// ============================================================================================ state
const S = {
  st: {},            // native state (devices, active, settings, permissions, ...)
  cache: {},         // last value of live events (sysinfo, pcmedia, apps, volume, commands, tasks, timers, received, ...)
  route: 'home',
  hidden: false,     // the app is off screen (MainActivity onStop): the page is unmounted, see __island.visible
  stack: [],
  transfers: {},
  planner: { ym: null, sel: null },
  sheet: null,
  findPc: false,
  shotLoading: false,
  appsQuery: '',
  onboardStep: 0,
  notifApps: null,
  presenter: { started: 0 },
  keyboard: false,
  game: { hist: [], histId: '', icons: {}, libLoading: false, launching: '' },
};

const $ = (sel, root = document) => root.querySelector(sel);
const app = () => $('#app');

// ============================================================================================ i18n
function lang() {
  const l = (S.st.settings && S.st.settings.language) || S.st.lang || 'en';
  if (l === 'auto') return S.st.lang && LANGS.includes(S.st.lang) ? S.st.lang : 'en';
  return LANGS.includes(l) ? l : 'en';
}
function t(key, vars) {
  const row = STRINGS[key];
  let s = row ? (row[LANGS.indexOf(lang())] || row[0]) : key;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}
const LOCALE = { en: 'en-US', ar: 'ar-EG', tr: 'tr-TR', es: 'es-ES', ru: 'ru-RU', zh: 'zh-CN' };
function num(n, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '–';
  return new Intl.NumberFormat(LOCALE[lang()], { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}
function esc(s) {
  return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function bytes(n) {
  if (!(n >= 0)) return '–';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i += 1; }
  return `${num(v, v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
function rate(n) { return `${bytes(n)}/s`; }
function clock(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = sec % 60;
  const two = (x) => num(x).padStart(2, num(0));
  return h ? `${num(h)}:${two(m)}:${two(s)}` : `${num(m)}:${two(s)}`;
}
function ago(ms) {
  const d = Math.max(0, Date.now() - ms) / 1000;
  if (d < 60) return t('justNow');
  if (d < 3600) return t('minAgo', { n: num(Math.floor(d / 60)) });
  if (d < 86400) return t('hourAgo', { n: num(Math.floor(d / 3600)) });
  return fmtDate(new Date(ms), { month: 'short', day: 'numeric' });
}
function fmtDate(d, opts) {
  try {
    return new Intl.DateTimeFormat(`${LOCALE[lang()]}-u-ca-gregory`, opts).format(d);
  } catch (_) {
    return d.toLocaleDateString();
  }
}

// ============================================================================================ native
function haptic(ms = 12, amp = 80) { call('vibrate', { ms, amp }); }
function connected() { return !!(S.st.active && S.st.active.connected); }
function pcName() { return S.st.active ? S.st.active.name : ''; }
function islandPc() { return !!(S.st.pc && S.st.pc.app); }
function mouse(body) { send('kdeconnect.mousepad.request', body); }
function setSettings(patch) {
  const out = call('setSettings', { patch });
  if (out) S.st.settings = out;
  return out;
}

function refreshState() {
  const st = call('state') || {};
  if (!st.active || !st.active.connected || S.st.active?.id !== st.active.id) {
    for (const key of ['sysinfo', 'apps', 'volume', 'commands', 'hello', 'screenshot', 'pcmedia', 'game', 'gamelib', 'gameicon', 'gamesummary']) delete S.cache[key];
  }
  S.st = st;
  if (st.cache) Object.assign(S.cache, st.cache);
  document.documentElement.lang = lang();
  document.documentElement.dir = RTL.includes(lang()) ? 'rtl' : 'ltr';
}

onNativeEvent((name, data) => window.__island.event(name, data));

window.__island = {
  event(name, data) {
    switch (name) {
      case 'devices': {
        const wasConnected = connected();
        const previousId = S.st.active && S.st.active.id;
        S.st = { ...S.st, ...data };
        if (previousId !== (S.st.active && S.st.active.id) || !connected()) {
          for (const key of ['sysinfo', 'apps', 'volume', 'commands', 'hello', 'screenshot', 'pcmedia', 'game', 'gamelib', 'gameicon', 'gamesummary']) delete S.cache[key];
          S.shotLoading = false; S.findPc = false;
        }
        if (!connected()) delete S.cache.sysinfo;
        if (wasConnected !== connected() || previousId !== (S.st.active && S.st.active.id)) {
          unmountRoute();
          render();
          mountRoute();
        } else softRender(['header', 'home', 'devices']);
        break;
      }
      case 'sysinfo': S.cache.sysinfo = data; live('sysinfo'); break;
      case 'pcmedia': S.cache.pcmedia = data; live('pcmedia'); break;
      case 'apps': S.cache.apps = data; softRender(['apps']); break;
      case 'volume': S.cache.volume = data; live('volume'); break;
      case 'commands': S.cache.commands = data; softRender(['power']); break;
      case 'hello': S.cache.hello = data; S.st.pc = data; softRender(['home']); break;
      case 'tasks': S.cache.tasks = data; softRender(['planner', 'home']); break;
      case 'timers': S.cache.timers = data; softRender(['timers', 'home']); break;
      case 'received': S.cache.received = data; softRender(['files']); break;
      case 'transfer': onTransfer(data); break;
      case 'screenshot': S.cache.screenshot = data; S.shotLoading = false; softRender(['screenshot']); if (data && data.uri && S.route !== 'screenshot') toast(t('shotReady'), { act: 'go', arg: 'screenshot', label: t('view') }); break;
      case 'permissions': S.st.permissions = data; softRender(['permissions', 'settings', 'onboard']); break;
      case 'pairRequest': openPairSheet(data); break;
      case 'pairResult':
        if (S.sheet === 'pair') closeSheet();
        if (data.ok) toast(t('pairedWith', { name: data.name }));
        else if (data.reason === 'rejected') toast(t('pairRejected'));
        else if (data.reason === 'timeout') toast(t('pairTimeout'));
        else if (data.reason === 'clock') toast(t('pairClock'));
        refreshState();
        softRender(['devices', 'home', 'header']);
        break;
      case 'cameraRequest': openSheet('camera', `<div class="sheet-icon blue">${icon('camera', 30)}</div><h3>${esc(t('photoRequest', { pc: data.from }))}</h3>
        <div class="sheet-actions"><button class="btn ghost" data-act="sheet.close">${t('later')}</button><button class="btn primary" data-act="photo" data-arg="${esc(data.deviceId || '')}">${t('takePhoto')}</button></div>`); break;
      case 'clipboard': toast(data.image ? t('clipImageFromPc') : t('clipFromPc')); break;
      case 'link': toast(t('linkFromPc'), { act: 'openUrl', arg: data.url, label: t('open') }); break;
      case 'ping': toast(`👋 ${data.from}`); break;
      case 'findpc': S.findPc = !!data.ringing; softRender(['home']); break;
      case 'game': onGame(data); break;
      case 'gameicon': if (data && data.id) { S.game.icons[data.id] = data.icon; S.cache.gameicon = data; live('game'); } break;
      case 'gamelib': S.cache.gamelib = data; S.game.libLoading = false; softRender(['game']); break;
      case 'gamesummary': S.cache.gamesummary = data; softRender(['game', 'home']); break;
      case 'gamelaunch':
        S.game.launching = '';
        if (!data.ok) toast(t('gm_launchFail'));
        softRender(['game']);
        break;
      default: break;
    }
  },
  insets(top, right, bottom, left, ime) {
    const r = document.documentElement.style;
    r.setProperty('--sat', `${top}px`); r.setProperty('--sar', `${right}px`);
    r.setProperty('--sab', `${bottom}px`); r.setProperty('--sal', `${left}px`);
    r.setProperty('--ime', `${ime}px`);
    document.body.classList.toggle('ime-open', ime > 0);
  },
  route(r) { if (ROUTES[r]) go(r); },
  back() { return back(); },
  // Called by MainActivity when the app leaves / returns to the screen. Leaving unmounts the page, which ends its
  // live subscriptions (PC stats every 2 s, game numbers) instead of renewing them forever in the background.
  // Returning pulls the cached state the app skipped meanwhile and mounts the page again.
  visible(on) {
    if (S.hidden === !on) return;
    S.hidden = !on;
    if (!on) { unmountRoute(); return; }
    refreshState();
    softRender(['header', S.route]);
    mountRoute();
  },
  volumeKey(dir) {
    if (S.route === 'presenter') presenterKey(dir === 'down' ? 'next' : 'prev');
    else if (S.route === 'remote' || S.route === 'media') send('kdeconnect.mousepad.request', { vk: dir === 'up' ? 0xAF : 0xAE });
  },
};

// ============================================================================================ routing
const TABS = [
  ['home', 'home'], ['remote', 'mouse-pointer-2'], ['files', 'file-up'], ['planner', 'calendar-check'], ['settings', 'settings'],
];
const ROUTES = {
  home: { tab: 'home', render: homePage, mount: mountHome, unmount: unmountHome },
  remote: { tab: 'remote', render: remotePage, mount: mountRemote, unmount: unmountRemote, bare: true },
  files: { tab: 'files', render: filesPage },
  planner: { tab: 'planner', render: plannerPage },
  settings: { tab: 'settings', render: settingsPage },
  media: { parent: 'home', render: mediaPage, mount: mountTicker, unmount: unmountTicker },
  apps: { parent: 'home', render: appsPage, mount: () => send('island.apps.request', {}) },
  power: { parent: 'home', render: powerPage, mount: () => send('kdeconnect.runcommand.request', { requestCommandList: true }) },
  presenter: { parent: 'home', render: presenterPage, mount: mountPresenter, unmount: unmountPresenter },
  game: { parent: 'home', render: gamePage, mount: mountGame, unmount: unmountGame },
  timers: { parent: 'home', render: timersPage, mount: mountTicker, unmount: unmountTicker },
  devices: { parent: 'home', render: devicesPage, mount: () => call('refresh') },
  screenshot: { parent: 'home', render: screenshotPage },
  keyboard: { parent: 'remote', render: keyboardPage, mount: mountKeyboard },
  permissions: { parent: 'settings', render: permissionsPage, mount: () => { S.st.permissions = call('permissions') || S.st.permissions; } },
  notifapps: { parent: 'settings', render: notifAppsPage, mount: () => { S.notifApps = call('notifApps') || []; softRender(['notifapps']); } },
  about: { parent: 'settings', render: aboutPage },
  support: { parent: 'settings', render: supportPage },
};

// A page is mounted at most once, and never while the app is off screen (MainActivity may route on a notification
// tap before it reports being visible again); visible(true) mounts it then.
let mountedRoute = null;
function mountRoute() {
  if (S.hidden || mountedRoute === S.route) return;
  mountedRoute = S.route;
  const r = ROUTES[S.route];
  if (r && r.mount) r.mount();
}
function unmountRoute() {
  if (mountedRoute === null) return;
  const r = ROUTES[mountedRoute];
  mountedRoute = null;
  if (r && r.unmount) r.unmount();
}

function go(route, { replace = false } = {}) {
  if (!ROUTES[route]) return;
  unmountRoute();
  if (ROUTES[route].tab) S.stack = [];
  else if (!replace && S.route !== route) S.stack.push(S.route);
  S.route = route;
  render();
  mountRoute();
  const main = $('#main');
  if (main) main.scrollTop = 0;
}

function back() {
  if (S.sheet) { closeSheet(); return true; }
  if (S.stack.length) {
    const prev = S.stack.pop();
    unmountRoute();
    S.route = prev;
    render();
    mountRoute();
    return true;
  }
  if (S.route !== 'home') { go('home'); return true; }
  return false;
}

// ============================================================================================ rendering
function render() {
  const root = app();
  if (!root) return;
  if (S.st.settings && S.st.settings.onboarded === false) { root.innerHTML = onboardPage(); wireFaces(); return; }
  const r = ROUTES[S.route];
  const activeTab = r.tab || ROUTES[r.parent].tab || r.parent;
  root.innerHTML = `
    ${r.bare ? '' : `<header class="top" data-part="header">${headerHtml()}</header>`}
    <main id="main" class="page page-${S.route}${r.bare ? ' bare' : ''}" data-part="${S.route}">${r.render()}</main>
    <nav class="tabs">${TABS.map(([k, ic]) => `<button class="tab ${activeTab === k ? 'on' : ''}" data-act="go" data-arg="${k}">${icon(ic, 22, activeTab === k ? 2.3 : 1.9)}<span>${t(`tab_${k}`)}</span></button>`).join('')}</nav>
    <div id="sheet" class="${S.sheet ? 'open' : ''}"></div>
    <div id="toast"></div>`;
  if (S.sheetHtml) $('#sheet').innerHTML = `<div class="sheet-scrim" data-act="sheet.close"></div><div class="sheet-card">${S.sheetHtml}</div>`;
  if (S.route === 'apps') fitDeck();
  wireFaces();
}

/** Re-render only some parts if they are on screen (keeps scroll position and inputs in other parts). */
function softRender(parts) {
  if (S.st.settings && S.st.settings.onboarded === false) { if (parts.includes('onboard')) render(); return; }
  for (const p of parts) {
    if (p === 'header') { const h = $('[data-part="header"]'); if (h) h.innerHTML = headerHtml(); continue; }
    if (p !== S.route) continue;
    const el = $(`[data-part="${p}"]`);
    if (!el) continue;
    if (p === 'remote') { live('remote'); continue; }
    const focused = document.activeElement && el.contains(document.activeElement) && document.activeElement.matches('input,textarea');
    if (focused) continue; // don't wipe what the user is typing
    const top = el.scrollTop;
    el.innerHTML = ROUTES[p].render();
    el.scrollTop = top;
    if (p === 'apps') fitDeck();
    wireFaces();
  }
}

// ============================================================================================ Blinkelo faces
// The header face sleeps (eyes shut) while no PC is connected and wakes with a wink the moment one connects.
// The logo on About / onboarding says hello the first time it shows, follows your finger and winks when tapped.
let faces = [];
let faceWasOn = null;
const facesGreeted = new Set();
function wireFaces() {
  faces.forEach((f) => { f.destroy(); if (f.unfollow) f.unfollow(); });
  faces = [];
  const on = connected();
  document.querySelectorAll('.bk[data-face]').forEach((el) => {
    const f = createBlinker(el, { gap: [2800, 7000] });
    faces.push(f);
    if (el.dataset.face === 'status') {
      el.classList.toggle('dozing', !on);
      if (on && faceWasOn === false) f.wake().then(() => f.wink()).then(() => f.start());
      else if (on) f.start();
      return;
    }
    const area = el.closest('.bk-logo');
    if (area) {
      area.onclick = () => { if (!f.busy) f.wink(); };
      f.unfollow = followPointer(el, area, 1);
    }
    const key = `${S.route}:${el.dataset.face}`;
    if (!facesGreeted.has(key)) { facesGreeted.add(key); f.hello().then(() => f.start()); } else f.start();
  });
  faceWasOn = on;
}

function live(kind) {
  if (kind === 'sysinfo') document.querySelectorAll('[data-live="sysinfo"]').forEach((el) => { el.innerHTML = statsHtml(); });
  if (kind === 'pcmedia') {
    document.querySelectorAll('[data-live="nowplaying"]').forEach((el) => { el.innerHTML = nowPlayingMini(); });
    if (S.route === 'media') softRender(['media']);
  }
  if (kind === 'volume') document.querySelectorAll('[data-live="volume"]').forEach((el) => { el.innerHTML = volumeHtml(); });
  if (kind === 'remote') { const s = $('.pad-status'); if (s) s.innerHTML = padStatus(); }
  if (kind === 'game') {
    document.querySelectorAll('[data-live="game"]').forEach((el) => { el.innerHTML = gameLiveHtml(); });
    document.querySelectorAll('[data-live="gamemini"]').forEach((el) => { el.innerHTML = gameMini(); });
  }
}

function headerHtml() {
  const r = ROUTES[S.route];
  if (r.tab) {
    if (S.route === 'home') return '';
    return `<h1 class="title">${t(`tab_${S.route}`)}</h1>`;
  }
  return `<button class="hbtn" aria-label="${t('control_back')}" data-act="back">${icon('chevron-left', 24, 2.2, 'flip')}</button><h2 class="subtitle">${t(`page_${S.route}`)}</h2>`;
}

// ============================================================================================ toast & sheet
let toastTimer = 0;
function toast(text, opt = {}) {
  const el = $('#toast');
  if (!el) return;
  el.innerHTML = `<div class="toast-in">${esc(text)}${opt.act ? `<button data-act="${opt.act}" data-arg="${esc(opt.arg || '')}">${esc(opt.label || '')}</button>` : ''}</div>`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), opt.act ? 5000 : 2600);
}

function openSheet(kind, html) {
  S.sheet = kind;
  S.sheetHtml = html;
  const el = $('#sheet');
  if (!el) return;
  el.innerHTML = `<div class="sheet-scrim" data-act="sheet.close"></div><div class="sheet-card">${html}</div>`;
  requestAnimationFrame(() => el.classList.add('open'));
}
function closeSheet() {
  S.sheet = null;
  S.sheetHtml = null;
  const el = $('#sheet');
  if (el) { el.classList.remove('open'); setTimeout(() => { if (!S.sheet) el.innerHTML = ''; }, 260); }
}

// ============================================================================================ home
function pcCard() {
  const a = S.st.active;
  if (!a) {
    const anyPaired = (S.st.devices || []).some((d) => d.paired);
    return `<button class="pc-card off" data-act="go" data-arg="devices">
      <div class="pc-ic">${icon('laptop', 28)}</div>
      <div class="pc-main"><div class="pc-name">${t(anyPaired ? 'pcOffline' : 'noPc')}</div><div class="pc-sub">${t(anyPaired ? 'pcOfflineHint' : 'noPcHint')}</div></div>
      ${icon('chevron-right', 20, 2, 'flip dim')}</button>`;
  }
  const via = [a.wifi ? `<span class="chip">${icon('wifi', 13)} ${t('wifi')}</span>` : '', a.bluetooth ? `<span class="chip">${icon('bluetooth', 13)} ${t('bluetooth')}</span>` : ''].join('');
  const si = S.cache.sysinfo;
  const bat = si && si.battery !== null && si.battery !== undefined ? `<span class="chip">${icon(si.charging ? 'battery-charging' : 'battery', 13)} ${num(si.battery)}%</span>` : '';
  return `<button class="pc-card" data-act="go" data-arg="devices">
    <div class="pc-ic on">${icon(a.type === 'laptop' ? 'laptop' : 'monitor', 28)}<i class="dot"></i></div>
    <div class="pc-main"><div class="pc-name">${esc(a.name)}</div><div class="pc-chips">${via}${bat}</div></div>
    ${icon('chevron-right', 20, 2, 'flip dim')}</button>`;
}

const QUICK = [
  ['remote', 'mouse-pointer-2', 'qa_touchpad', 'go', 'blue'],
  ['media', 'music', 'qa_media', 'go', 'pink'],
  ['apps', 'layout-grid', 'qa_apps', 'go', 'indigo'],
  ['sendFiles', 'file-up', 'qa_files', 'pick', 'teal'],
  ['presenter', 'presentation', 'qa_presenter', 'go', 'orange'],
  ['screenshot', 'monitor-up', 'qa_screenshot', 'go', 'purple'],
  ['clip', 'clipboard-copy', 'qa_clipboard', 'clip', 'green'],
  ['photo', 'camera', 'qa_camera', 'photo', 'yellow'],
  ['findpc', 'radar', 'qa_findpc', 'findpc', 'red'],
  ['lock', 'lock', 'qa_lock', 'lock', 'gray'],
  ['power', 'power', 'qa_power', 'go', 'red'],
  ['timers', 'timer', 'qa_timers', 'go', 'orange'],
];

function homePage() {
  const on = connected();
  const tiles = QUICK.map(([arg, ic, label, act, color]) => {
    const a = act === 'go' ? `data-act="go" data-arg="${arg}"` : `data-act="${act}"`;
    const ring = arg === 'findpc' && S.findPc ? ' ringing' : '';
    return `<button class="qa ${color}${ring}" ${a} ${on ? '' : 'disabled'}><span class="qa-ic">${icon(ic, 22)}</span><span class="qa-l">${t(label)}</span></button>`;
  }).join('');
  return `
    <div class="hello"><div class="hello-l"><span class="bk-pill hello-face">${faceHtml('', 'status')}</span><div class="hello-t">${t('appName')}</div></div><button class="hbtn" aria-label="${t('page_devices')}" data-act="go" data-arg="devices">${icon('smartphone', 20)}</button></div>
    ${pcCard()}
    ${on ? `<div data-live="nowplaying">${nowPlayingMini()}</div>` : ''}
    ${on && pcHasGame() ? `<div data-live="gamemini">${gameMini()}</div>` : ''}
    <section class="card pad"><div class="qa-grid">${tiles}</div>${on ? '' : `<p class="hint center">${t('connectFirst')}</p>`}</section>
    ${on ? `<section class="card pad stats-card" data-live="sysinfo">${statsHtml()}</section>` : ''}
    ${timersMini()}
    ${todayCard()}`;
}

function mountHome() {
  subscribeStats(true);
}
function unmountHome() { subscribeStats(false); }

let statsTimer = 0;
function subscribeStats(on) {
  clearInterval(statsTimer);
  if (on && connected()) {
    send('island.sysinfo.request', { subscribe: true });
    statsTimer = setInterval(() => { if (connected()) send('island.sysinfo.request', { subscribe: true }); }, 10000);
  } else if (!on) {
    send('island.sysinfo.request', { subscribe: false });
  }
}

function ring(value, label, color, sub) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const c = 2 * Math.PI * 22;
  return `<div class="ring ${color}"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" class="track"/><circle cx="26" cy="26" r="22" class="bar" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v / 100)}"/></svg>
    <div class="ring-v">${value === null || value === undefined ? '–' : num(v)}<small>%</small></div><div class="ring-l">${label}</div>${sub ? `<div class="ring-s">${sub}</div>` : ''}</div>`;
}

function statsHtml() {
  const s = S.cache.sysinfo;
  if (!s) return `<div class="stats-wait">${icon('loader-circle', 18, 2, 'spin')} ${t('waitingStats')}</div>`;
  const ram = s.ramTotal ? `${num(s.ramUsed, 1)}/${num(s.ramTotal)} GB` : '';
  return `<div class="stats-head"><span>${icon('gauge', 16)} ${t('pcStatus')}</span>${s.uptime ? `<span class="dim small">${t('uptime')} ${clock(s.uptime)}</span>` : ''}</div>
    <div class="rings">${ring(s.cpu, 'CPU', 'blue')}${ring(s.ram, 'RAM', 'purple', ram)}${s.gpu !== null && s.gpu !== undefined ? ring(s.gpu, 'GPU', 'green', s.gpuTemp ? `${num(s.gpuTemp)}°` : '') : ''}</div>
    <div class="net"><span>${icon('arrow-down', 14)} ${rate(s.netDown)}</span><span>${icon('arrow-up', 14)} ${rate(s.netUp)}</span></div>`;
}

function mediaPosition(m) {
  if (!m) return 0;
  let p = Number(m.position) || 0;
  if (m.status === 'playing' && m.receivedAt) p += (Date.now() - m.receivedAt) / 1000;
  return Math.min(p, Number(m.duration) || p);
}

function nowPlayingMini() {
  const m = S.cache.pcmedia;
  if (!m || !m.present) return '';
  const playing = m.status === 'playing';
  return `<section class="card np" data-act="go" data-arg="media">
    <div class="np-art">${m.art ? `<img src="${esc(m.art)}" alt="">` : icon('music', 22)}</div>
    <div class="np-main"><div class="np-t">${esc(m.title || t('unknownTrack'))}</div><div class="np-a">${esc(m.artist || m.source || '')}</div></div>
    <button class="ib" aria-label="${t('control_playPause')}" data-act="media" data-arg="playpause">${icon(playing ? 'pause' : 'play', 22)}</button>
    <button class="ib" aria-label="${t('control_next')}" data-act="media" data-arg="next">${icon('skip-forward', 20)}</button></section>`;
}

function todayCard() {
  const tasks = (S.cache.tasks || []).filter((x) => x.date === isoOf(new Date()));
  const left = tasks.filter((x) => !x.done).length;
  const rows = tasks.slice(0, 4).map(taskRow).join('');
  return `<section class="card pad">
    <div class="card-head"><span>${icon('calendar-check', 17)} ${t('today')} · ${esc(fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }))}</span><button class="link" data-act="go" data-arg="planner">${t('seeAll')}</button></div>
    ${rows ? `<div class="tasks">${rows}</div>` : `<p class="hint">${t('noTasksToday')}</p>`}
    ${tasks.length ? `<div class="dim small">${left ? t('tasksLeft', { n: num(left) }) : t('allDone')}</div>` : ''}</section>`;
}

function timersMini() {
  const list = S.cache.timers || [];
  if (!list.length) return '';
  return `<section class="card pad" data-act="go" data-arg="timers"><div class="card-head"><span>${icon('timer', 17)} ${t('page_timers')}</span></div>
    ${list.map((x) => `<div class="timer-row"><span>${esc(x.label || t('timer'))}${x.origin === 'pc' ? ` <span class="chip xs">${icon('monitor', 11)} PC</span>` : ''}</span><b data-ends="${x.endsAt || Date.now() + (x.remaining || 0)}">${clock(((x.endsAt || 0) - Date.now()) / 1000)}</b></div>`).join('')}</section>`;
}

// ============================================================================================ remote (touchpad)
let pad = null;
function padStatus() {
  return connected() ? `<span class="live-dot"></span>${esc(pcName())}` : `<span class="dim">${t('notConnected')}</span>`;
}
function remotePage() {
  return `<div class="remote">
    <div class="pad-top"><div class="pad-status">${padStatus()}</div>
      <div class="pad-tools"><button class="ib sm" aria-label="${t('page_keyboard')}" data-act="go" data-arg="keyboard">${icon('keyboard', 20)}</button></div></div>
    <div class="touchpad" id="touchpad"><div class="pad-hint">${icon('hand', 26, 1.6)}<span>${t('padHint')}</span></div><i class="ripple"></i></div>
    <div class="mbtns"><button class="mb" aria-label="${t('control_singleclick')}" data-act="click" data-arg="singleclick"></button><button class="mb mid" aria-label="${t('control_middleclick')}" data-act="click" data-arg="middleclick"></button><button class="mb" aria-label="${t('control_rightclick')}" data-act="click" data-arg="rightclick"></button></div>
    <div class="keys-row">
      ${[['esc', 'Esc'], ['tab', '⇥'], ['left', '←'], ['up', '↑'], ['down', '↓'], ['right', '→'], ['enter', '⏎'], ['backspace', '⌫']].map(([k, l]) => `<button class="key" data-act="key" data-arg="${k}">${l}</button>`).join('')}
    </div>
    <div class="keys-row">
      ${[['volDown', icon('volume-1', 18)], ['mute', icon('volume-x', 18)], ['volUp', icon('volume-2', 18)], ['playPause', icon('play', 16) + icon('pause', 16)], ['desktop', icon('monitor', 18)], ['taskview', icon('layout-grid', 18)], ['alttab', 'Alt⇥']].map(([k, l]) => `<button class="key" aria-label="${t(STRINGS['control_' + k] ? 'control_' + k : 'k_' + k)}" data-act="combo" data-arg="${k}">${l}</button>`).join('')}
    </div></div>`;
}
function mountRemote() {
  const el = $('#touchpad');
  if (!el) return;
  pad = new Touchpad(el, {
    send: (b) => mouse(b),
    haptic: (ms) => haptic(ms),
    settings: () => (S.st.settings && S.st.settings.touchpad) || {},
  });
  call('keepScreenOn', { on: true });
  call('volumeKeys', { mode: 'volume' });
}
function unmountRemote() {
  if (pad) pad.destroy();
  pad = null;
  call('keepScreenOn', { on: false });
  call('volumeKeys', { mode: 'off' });
}

const KEYS = { backspace: 1, tab: 2, left: 4, up: 5, right: 6, down: 7, pgup: 8, pgdn: 9, home: 10, end: 11, enter: 12, del: 13, esc: 14, print: 15 };
for (let i = 1; i <= 12; i += 1) KEYS[`f${i}`] = 20 + i;
const COMBOS = {
  volUp: { vk: 0xAF }, volDown: { vk: 0xAE }, mute: { vk: 0xAD }, playPause: { vk: 0xB3 }, next: { vk: 0xB0 }, prev: { vk: 0xB1 },
  desktop: { key: 'd', super: true }, taskview: { specialKey: 2, super: true }, alttab: { specialKey: 2, alt: true }, win: { vk: 0x5B },
  copy: { key: 'c', ctrl: true }, paste: { key: 'v', ctrl: true }, cut: { key: 'x', ctrl: true }, undo: { key: 'z', ctrl: true },
  redo: { key: 'y', ctrl: true }, selectAll: { key: 'a', ctrl: true }, save: { key: 's', ctrl: true }, find: { key: 'f', ctrl: true },
  close: { specialKey: 24, alt: true }, newTab: { key: 't', ctrl: true }, closeTab: { key: 'w', ctrl: true }, refresh: { specialKey: 25 },
  explorer: { key: 'e', super: true }, lockKey: { key: 'l', super: true }, screenshotKey: { key: 's', super: true, shift: true },
  zoomIn: { key: '+', ctrl: true }, zoomOut: { key: '-', ctrl: true }, fullscreen: { specialKey: 31 },
};

// ============================================================================================ keyboard
function keyboardPage() {
  const shortcuts = ['copy', 'paste', 'cut', 'undo', 'redo', 'selectAll', 'save', 'find', 'newTab', 'closeTab', 'refresh', 'close', 'explorer', 'lockKey', 'screenshotKey', 'zoomIn', 'zoomOut', 'fullscreen', 'win'];
  const fkeys = Array.from({ length: 12 }, (_, i) => `f${i + 1}`);
  return `<section class="card pad">
      <div class="card-head"><span>${icon('keyboard', 17)} ${t('liveTyping')}</span></div>
      <input id="kbLive" class="kb-live" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="${t('typeHere')}" value=" ">
      <p class="hint">${t('liveTypingHint')}</p>
    </section>
    <section class="card pad">
      <div class="card-head"><span>${icon('type', 17)} ${t('sendText')}</span></div>
      <textarea id="kbText" rows="3" placeholder="${t('sendTextPh')}"></textarea>
      <div class="row-end"><button class="btn primary sm" data-act="kb.send">${icon('send', 16)} ${t('send')}</button></div>
    </section>
    <section class="card pad"><div class="card-head"><span>${icon('command', 17)} ${t('shortcuts')}</span></div>
      <div class="chips-grid">${shortcuts.map((k) => `<button class="kchip" aria-label="${t(STRINGS['control_' + k] ? 'control_' + k : 'k_' + k)}" data-act="combo" data-arg="${k}">${t(`k_${k}`)}</button>`).join('')}</div></section>
    <section class="card pad"><div class="card-head"><span>${icon('keyboard', 17)} ${t('keys')}</span></div>
      <div class="chips-grid keys">${['esc', 'tab', 'enter', 'backspace', 'del', 'home', 'end', 'pgup', 'pgdn', 'up', 'down', 'left', 'right', 'print'].map((k) => `<button class="kchip" data-act="key" data-arg="${k}">${t(`key_${k}`)}</button>`).join('')}
      ${fkeys.map((k) => `<button class="kchip" data-act="key" data-arg="${k}">${k.toUpperCase()}</button>`).join('')}</div></section>`;
}

function mountKeyboard() {
  const inp = $('#kbLive');
  if (!inp) return;
  const SENT = ' ';
  let composing = false;
  const resetValue = () => { inp.value = SENT; try { inp.setSelectionRange(1, 1); } catch (_) { /* ignore */ } };
  inp.addEventListener('compositionstart', () => { composing = true; });
  inp.addEventListener('compositionend', (e) => {
    composing = false;
    if (e.data) mouse({ key: e.data });
    resetValue();
  });
  inp.addEventListener('beforeinput', (e) => {
    if (e.inputType === 'deleteContentBackward' && !composing) { e.preventDefault(); mouse({ specialKey: KEYS.backspace }); resetValue(); haptic(6); }
    else if ((e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') && !composing) { e.preventDefault(); mouse({ specialKey: KEYS.enter }); resetValue(); }
  });
  inp.addEventListener('input', (e) => {
    if (composing || e.isComposing) return;
    const v = inp.value;
    if (v.length < SENT.length) { mouse({ specialKey: KEYS.backspace }); resetValue(); return; }
    const added = v.startsWith(SENT) ? v.slice(SENT.length) : v;
    if (added) mouse({ key: added });
    resetValue();
  });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); mouse({ specialKey: KEYS.enter }); }
  });
  setTimeout(() => { inp.focus(); resetValue(); }, 200);
}

// ============================================================================================ media
let ticker = 0;
function mountTicker() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    document.querySelectorAll('[data-ends]').forEach((el) => { el.textContent = clock((Number(el.dataset.ends) - Date.now()) / 1000); });
    const m = S.cache.pcmedia;
    if (S.route === 'media' && m && m.present) {
      const p = mediaPosition(m);
      const bar = $('#seek');
      if (bar && !bar.matches(':active')) bar.value = String(p);
      const cur = $('#posCur');
      if (cur) cur.textContent = clock(p);
    }
  }, 1000);
}
function unmountTicker() { clearInterval(ticker); }

function volumeHtml() {
  const sinks = (S.cache.volume && S.cache.volume.sinkList) || [];
  const s = sinks.find((x) => x.enabled !== false) || sinks[0];
  if (!s) return `<p class="hint">${t('noVolume')}</p>`;
  const max = Number(s.maxVolume) || 100;
  return `<div class="vol"><button class="ib" aria-label="${t('control_mute')}" data-act="vol.mute" data-arg="${esc(s.name)}">${icon(s.muted ? 'volume-x' : 'volume-2', 22)}</button>
    <input type="range" min="0" max="${max}" value="${Number(s.volume) || 0}" data-vol="${esc(s.name)}" class="slider">
    <span class="vol-v">${num(Math.round((Number(s.volume) || 0) * 100 / max))}</span></div>
    <div class="dim small center">${esc(s.description || s.name)}</div>`;
}

function mediaPage() {
  const m = S.cache.pcmedia;
  if (!connected()) return emptyState('wifi-off', t('notConnected'), t('connectFirst'));
  const vol = `<section class="card pad"><div class="card-head"><span>${icon('volume-2', 17)} ${t('pcVolume')}</span></div><div data-live="volume">${volumeHtml()}</div></section>`;
  if (!m || !m.present) {
    return `${emptyState('music', t('nothingPlaying'), t('nothingPlayingHint'))}
      <section class="card pad"><div class="media-keys">${['prev', 'playPause', 'next'].map((k) => `<button class="ib lg" aria-label="${t(STRINGS['control_' + k] ? 'control_' + k : 'k_' + k)}" data-act="combo" data-arg="${k}">${icon(k === 'prev' ? 'skip-back' : k === 'next' ? 'skip-forward' : 'play', 26)}</button>`).join('')}</div></section>${vol}`;
  }
  const playing = m.status === 'playing';
  const pos = mediaPosition(m);
  return `<section class="media-hero">
      <div class="big-art">${m.art ? `<img src="${esc(m.art)}" alt="">` : icon('music', 56, 1.5)}</div>
      <div class="mh-t">${esc(m.title || t('unknownTrack'))}</div>
      <div class="mh-a">${esc(m.artist || '')}</div>
      <div class="mh-s">${icon('monitor', 13)} ${esc(m.source || pcName())}</div>
      ${m.duration ? `<div class="seek"><input id="seek" type="range" class="slider" min="0" max="${Number(m.duration) || 0}" step="1" value="${pos}" ${m.canSeek ? '' : 'disabled'}>
        <div class="seek-t"><span id="posCur">${clock(pos)}</span><span>${clock(m.duration)}</span></div></div>` : ''}
      <div class="media-ctrl">
        <button class="ib lg" aria-label="${t('control_prev')}" data-act="media" data-arg="prev">${icon('skip-back', 30)}</button>
        <button class="play-btn" aria-label="${t('control_playPause')}" data-act="media" data-arg="playpause">${icon(playing ? 'pause' : 'play', 34)}</button>
        <button class="ib lg" aria-label="${t('control_next')}" data-act="media" data-arg="next">${icon('skip-forward', 30)}</button>
      </div></section>${vol}`;
}

// ============================================================================================ apps -> deck
// The PC's deck keys drawn as a Stream Deck style board. The key size (columns) and per-key sizes chosen with a
// long press are remembered on this phone; everything else comes from the PC.
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* storage unavailable */ } },
};
function deckCols() { return Math.min(6, Math.max(2, Math.round(Number(store.get('deck.cols', 4))) || 4)); }
function deckSizes() { const m = store.get('deck.sizes', {}); return m && typeof m === 'object' ? m : {}; }
function glyphSvg(name) {
  const body = DECK_ICONS[name];
  return body ? `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>` : '';
}
function deckKeySize(a, sizes) {
  const own = sizes[a.id];
  return DM.SIZES.includes(own) ? own : DM.keyLook(a).size;
}
function deckKeyHtml(a, sizes, q) {
  const look = DM.keyLook(a);
  const [w, h] = deckKeySize(a, sizes).split('x').map(Number);
  const face = a.icon ? `<img src="${esc(a.icon)}" alt="">` : (glyphSvg(look.glyph) || `<b>${esc(String(a.name || '?').trim().slice(0, 1))}</b>`);
  const hidden = q && !String(a.name).toLowerCase().includes(q);
  return `<button class="dkey app${w > 1 ? ' w2' : ''}${h > 1 ? ' h2' : ''}${look.color ? ' tint' : ''}" data-act="launch" data-arg="${esc(a.id)}" data-kind="${esc(a.kind || 'file')}" aria-label="${esc(a.name)}" style="${look.color ? `--kc:${look.color};` : ''}${hidden ? 'display:none' : ''}">
    <span class="dkey-face">${face}</span><span class="dkey-label">${esc(a.name)}</span>${a.hint ? `<span class="dkey-hint" dir="ltr">${esc(a.hint)}</span>` : ''}</button>`;
}
function appsPage() {
  if (!connected()) return emptyState('wifi-off', t('notConnected'), t('connectFirst'));
  const list = (S.cache.apps && S.cache.apps.apps) || [];
  const q = S.appsQuery.trim().toLowerCase();
  const cols = deckCols();
  const sizes = deckSizes();
  const pc = (S.cache.sysinfo && S.cache.sysinfo.hostname) || (S.st.active && S.st.active.name) || 'PC';
  return `<div class="deck-bar">
      <div class="search"><input id="appsQ" placeholder="${t('searchApps')}" value="${esc(S.appsQuery)}">${icon('refresh-cw', 18, 2, 'dim')}</div>
      <label class="deck-size"><i class="dz dz-s"></i><input type="range" id="deckCols" min="2" max="6" step="1" value="${8 - cols}" aria-label="${t('deckKeySize')}"><i class="dz dz-l"></i></label>
    </div>
    ${!list.length ? emptyState('layout-grid', t('noApps'), t('noAppsHint')) : `<section class="deck-case">
      <div class="deck-top"><span class="deck-led"></span><b>ISLAND DECK</b><span class="deck-pc" dir="auto">${esc(pc)}</span></div>
      <div class="deck-grid apps" data-cols="${cols}" style="--cols:${cols}">${list.map((a) => deckKeyHtml(a, sizes, q)).join('')}</div>
    </section>
    <p class="deck-tip">${t('deckTip')}</p>`}`;
}
// key edge length from the real width of the board (keys stay square at every column count)
function fitDeck() {
  const g = $('.deck-grid');
  if (!g) return;
  const cols = deckCols();
  const gap = cols >= 6 ? 6 : cols >= 5 ? 8 : cols >= 4 ? 9 : 11;
  const u = (g.clientWidth - (cols + 1) * gap) / cols;
  g.dataset.cols = String(cols);
  g.style.setProperty('--cols', String(cols));
  g.style.setProperty('--gap', `${gap}px`);
  if (u > 10) g.style.setProperty('--u', `${Math.floor(u * 10) / 10}px`);
}
window.addEventListener('resize', fitDeck);
function openKeySheet(id) {
  const a = ((S.cache.apps && S.cache.apps.apps) || []).find((x) => x.id === id);
  if (!a) return;
  const cur = deckKeySize(a, deckSizes());
  openSheet('key', `<h3>${esc(a.name)}</h3>
    <p class="hint center">${t('deckKeySize')}</p>
    <div class="size-opts">${DM.SIZES.map((z) => `<button class="size-opt ${cur === z ? 'on' : ''}" data-act="deck.size" data-arg="${esc(id)}|${z}"><i class="szb szb-${z}"></i><span dir="ltr">${z.replace('x', '×')}</span></button>`).join('')}</div>
    <div class="sheet-actions"><button class="btn ghost" data-act="deck.size" data-arg="${esc(id)}|">${t('deckSizeReset')}</button><button class="btn primary" data-act="sheet.close">${t('deckDone')}</button></div>`);
}
// long press on a key -> size sheet (the click that follows the release is swallowed)
let deckPress = null;
let deckHeld = false;
document.addEventListener('pointerdown', (e) => {
  const k = e.target.closest ? e.target.closest('.dkey') : null;
  deckHeld = false;
  if (deckPress) clearTimeout(deckPress.timer);
  if (!k) { deckPress = null; return; }
  deckPress = { x: e.clientX, y: e.clientY, timer: setTimeout(() => { deckHeld = true; haptic(26, 140); openKeySheet(k.dataset.arg); }, 520) };
}, true);
document.addEventListener('pointermove', (e) => {
  if (deckPress && Math.hypot(e.clientX - deckPress.x, e.clientY - deckPress.y) > 12) { clearTimeout(deckPress.timer); deckPress = null; }
}, true);
for (const ev of ['pointerup', 'pointercancel']) document.addEventListener(ev, () => { if (deckPress) clearTimeout(deckPress.timer); deckPress = null; }, true);
document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('.dkey')) e.preventDefault(); });

// ============================================================================================ power
const POWER = [
  ['island.lock', 'lock', 'cmd_lock', 'blue'], ['island.sleep', 'moon', 'cmd_sleep', 'indigo'], ['island.monitoroff', 'monitor-off', 'cmd_monitoroff', 'gray'],
  ['island.restart', 'rotate-ccw', 'cmd_restart', 'orange'], ['island.shutdown', 'power', 'cmd_shutdown', 'red'], ['island.signout', 'log-out', 'cmd_signout', 'purple'],
];
const CONFIRM = ['island.restart', 'island.shutdown', 'island.signout'];
function powerPage() {
  if (!connected()) return emptyState('wifi-off', t('notConnected'), t('connectFirst'));
  const cmds = (S.cache.commands && S.cache.commands.commands) || [];
  const keys = new Set(cmds.map((c) => c.key));
  const builtin = POWER.filter(([k]) => keys.has(k) || islandPc());
  const custom = cmds.filter((c) => !String(c.key).startsWith('island.'));
  return `${builtin.length ? `<div class="power-grid">${builtin.map(([k, ic, label, color]) => `<button class="pw ${color}" data-act="cmd" data-arg="${k}"><span class="pw-ic">${icon(ic, 26)}</span><span>${t(label)}</span></button>`).join('')}</div>` : ''}
    <section class="card pad"><div class="card-head"><span>${icon('terminal', 17)} ${t('customCommands')}</span></div>
      ${custom.length ? custom.map((c) => `<button class="list-row" data-act="cmd" data-arg="${esc(c.key)}"><span class="lr-ic">${icon('zap', 18)}</span><span class="lr-main"><b>${esc(c.name)}</b><small dir="ltr">${esc(c.command || '')}</small></span>${icon('play', 16, 2, 'dim')}</button>`).join('') : `<p class="hint">${t('noCustomCommands')}</p>`}
    </section>`;
}

// ============================================================================================ presenter
let presTimer = 0;
function presenterPage() {
  const el = S.presenter.started ? Math.floor((Date.now() - S.presenter.started) / 1000) : 0;
  return `<div class="presenter">
    <div class="pres-top"><button class="chip-btn" data-act="pres" data-arg="start">${icon('play', 15)} ${t('startShow')}</button>
      <div class="pres-clock" data-act="pres" data-arg="reset">${icon('clock', 15)} <span id="presClock">${clock(el)}</span></div>
      <button class="chip-btn" data-act="pres" data-arg="end">${icon('square', 14)} ${t('endShow')}</button></div>
    <button class="pres-next" data-act="pres" data-arg="next">${icon('chevron-right', 64, 1.6, 'flip')}<span>${t('nextSlide')}</span></button>
    <div class="pres-row"><button class="pres-prev" data-act="pres" data-arg="prev">${icon('chevron-left', 34, 1.8, 'flip')}<span>${t('prevSlide')}</span></button>
      <button class="pres-black" data-act="pres" data-arg="black">${icon('moon-star', 26, 1.8)}<span>${t('blackScreen')}</span></button></div>
    <p class="hint center">${t('presHint')}</p></div>`;
}
function mountPresenter() {
  call('keepScreenOn', { on: true });
  call('volumeKeys', { mode: 'slides' });
  clearInterval(presTimer);
  presTimer = setInterval(() => {
    const c = $('#presClock');
    if (c && S.presenter.started) c.textContent = clock((Date.now() - S.presenter.started) / 1000);
  }, 1000);
}
function unmountPresenter() {
  call('keepScreenOn', { on: false });
  call('volumeKeys', { mode: 'off' });
  clearInterval(presTimer);
}
function presenterKey(what) {
  haptic(what === 'next' ? 20 : 14);
  if (what === 'next') mouse({ specialKey: KEYS.right });
  else if (what === 'prev') mouse({ specialKey: KEYS.left });
  else if (what === 'start') { mouse({ specialKey: KEYS.f5 }); if (!S.presenter.started) S.presenter.started = Date.now(); }
  else if (what === 'end') mouse({ specialKey: KEYS.esc });
  else if (what === 'black') mouse({ key: 'b' });
  else if (what === 'reset') { S.presenter.started = Date.now(); const c = $('#presClock'); if (c) c.textContent = clock(0); }
}

// ============================================================================================ screenshot
function screenshotPage() {
  const s = S.cache.screenshot;
  return `<section class="card pad center-col">
      <button class="btn primary wide" data-act="shot" ${connected() ? '' : 'disabled'}>${icon(S.shotLoading ? 'loader-circle' : 'monitor-up', 18, 2, S.shotLoading ? 'spin' : '')} ${t(S.shotLoading ? 'capturing' : 'takeScreenshot')}</button>
      <p class="hint">${t('screenshotHint')}</p></section>
    ${s && s.uri ? `<section class="card shot"><img src="${esc(s.uri)}" alt="">
      <div class="shot-actions"><button class="btn ghost sm" data-act="openUri" data-arg="${esc(s.uri)}" data-mime="image/jpeg">${icon('external-link', 16)} ${t('open')}</button>
      <button class="btn ghost sm" data-act="shareUri" data-arg="${esc(s.uri)}" data-mime="image/jpeg">${icon('share-2', 16)} ${t('share')}</button></div></section>` : ''}
    ${s && s.error ? `<p class="hint center">${t('screenshotFailed')}</p>` : ''}`;
}

// ============================================================================================ timers
const PRESETS = [1, 3, 5, 10, 15, 25, 30, 45, 60];
function timersPage() {
  const list = S.cache.timers || [];
  return `${list.length ? `<section class="card pad">${list.map((x) => `<div class="timer-big">
      <div><div class="tb-l">${esc(x.label || t('timer'))}</div><div class="dim small">${x.origin === 'pc' ? `${icon('monitor', 12)} ${esc(pcName() || 'PC')}` : `${icon('smartphone', 12)} ${t('thisPhone')}`}</div></div>
      <b class="tb-v" data-ends="${x.endsAt || Date.now() + (x.remaining || 0)}">${clock(((x.endsAt || 0) - Date.now()) / 1000)}</b>
      <button class="ib" aria-label="${t('cancel')}" data-act="timer.cancel" data-arg="${esc(x.id)}">${icon('x', 18)}</button></div>`).join('')}</section>` : ''}
    <section class="card pad"><div class="card-head"><span>${icon('hourglass', 17)} ${t('newTimer')}</span></div>
      <div class="presets">${PRESETS.map((m) => `<button class="preset" data-act="timer.start" data-arg="${m}">${num(m)}<small>${t('min')}</small></button>`).join('')}</div>
      <div class="timer-form"><input id="tmMin" type="number" inputmode="numeric" min="1" max="600" placeholder="${t('minutes')}"><input id="tmLabel" placeholder="${t('timerLabel')}"><button class="btn primary sm" aria-label="${t('control_startTimer')}" data-act="timer.custom">${icon('play', 16)}</button></div>
      <p class="hint">${t('timersHint')}</p></section>`;
}

// ============================================================================================ files
function onTransfer(d) {
  if (d.state === 'done' || d.state === 'failed') {
    delete S.transfers[d.id];
    if (d.state === 'done' && d.dir === 'in') toast(t('received', { name: d.name }), d.uri ? { act: 'openUri', arg: d.uri, label: t('open') } : {});
  } else {
    S.transfers[d.id] = d;
  }
  if (S.route === 'files') {
    const el = $('#transfers');
    if (el) el.innerHTML = transfersHtml(); else softRender(['files']);
  }
}
function transfersHtml() {
  const list = Object.values(S.transfers);
  if (!list.length) return '';
  return `<section class="card pad"><div class="card-head"><span>${icon('arrow-up-down', 17)} ${t('transfers')}</span></div>
    ${list.map((x) => { const pct = x.total ? Math.round((x.done || 0) * 100 / x.total) : 0; return `<div class="xfer"><div class="xfer-h"><span>${icon(x.dir === 'in' ? 'download' : 'file-up', 15)} ${esc(x.name)}</span><span class="dim small">${num(pct)}%</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`; }).join('')}</section>`;
}
function mimeIcon(m) {
  m = String(m || '');
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('audio/')) return 'music';
  if (m.startsWith('video/')) return 'monitor';
  if (m.includes('pdf') || m.startsWith('text/')) return 'file';
  return 'file';
}
function filesPage() {
  const on = connected();
  const rec = S.cache.received || [];
  return `<div class="send-grid">
      <button class="send-btn teal" data-act="pick" ${on ? '' : 'disabled'}>${icon('file-up', 26)}<b>${t('sendFiles')}</b><small>${t('sendFilesHint')}</small></button>
      <button class="send-btn yellow" data-act="photo" ${on ? '' : 'disabled'}>${icon('camera', 26)}<b>${t('takePhoto')}</b><small>${t('takePhotoHint')}</small></button>
      <button class="send-btn green" data-act="clip" ${on ? '' : 'disabled'}>${icon('clipboard-copy', 26)}<b>${t('sendClipboard')}</b><small>${t('sendClipboardHint')}</small></button>
      <button class="send-btn blue" data-act="textSheet" ${on ? '' : 'disabled'}>${icon('link', 26)}<b>${t('sendTextLink')}</b><small>${t('sendTextLinkHint')}</small></button>
    </div>
    ${on ? '' : `<p class="hint center">${t('connectFirst')}</p>`}
    <div id="transfers">${transfersHtml()}</div>
    <section class="card pad"><div class="card-head"><span>${icon('hard-drive-download', 17)} ${t('receivedFiles')}</span></div>
      ${rec.length ? rec.map((r) => `<div class="list-row"><button class="lr-open" data-act="openUri" data-arg="${esc(r.uri)}" data-mime="${esc(r.mime)}"><span class="lr-ic">${icon(mimeIcon(r.mime), 18)}</span>
        <span class="lr-main"><b dir="auto">${esc(r.name)}</b><small><bdi>${bytes(r.size)}</bdi> · <bdi>${esc(r.from || '')}</bdi> · <bdi>${ago(r.time)}</bdi></small></span></button>
        <button class="ib sm" aria-label="${t('share')}: ${esc(r.name)}" data-act="shareUri" data-arg="${esc(r.uri)}" data-mime="${esc(r.mime)}">${icon('share-2', 17)}</button></div>`).join('') : `<p class="hint">${t('noReceived')}</p>`}
      <p class="hint small">${t('receivedWhere')}</p></section>`;
}
function openTextSheet() {
  openSheet('text', `<h3>${t('sendTextLink')}</h3><textarea id="shareText" rows="4" placeholder="${t('sendTextLinkPh')}"></textarea>
    <div class="sheet-actions"><button class="btn ghost" data-act="sheet.close">${t('cancel')}</button><button class="btn primary" data-act="text.send">${icon('send', 16)} ${t('send')}</button></div>`);
  setTimeout(() => { const el = $('#shareText'); if (el) el.focus(); }, 250);
}

// ============================================================================================ planner
const COLORS = ['blue', 'green', 'orange', 'pink', 'purple', 'teal'];
function taskRow(x) {
  return `<div class="task ${x.done ? 'done' : ''} c-${esc(x.color || 'blue')}">
    <button class="tcheck" aria-label="${t('control_toggleTask')}: ${esc(x.title)}" aria-pressed="${x.done ? 'true' : 'false'}" data-act="task.toggle" data-arg="${esc(x.id)}">${x.done ? icon('check', 14, 3) : ''}</button>
    <span class="ttitle" dir="auto">${esc(x.title)}</span>${x.time ? `<span class="ttime">${esc(x.time.replace(/\d/g, (d) => num(Number(d))))}</span>` : ''}
    <button class="tdel" aria-label="${t('control_remove')}: ${esc(x.title)}" data-act="task.remove" data-arg="${esc(x.id)}">${icon('x', 14)}</button></div>`;
}
function weekStart() { return lang() === 'ar' ? 6 : (lang() === 'en' ? 0 : 1); }
function plannerPage() {
  if (!S.planner.ym) S.planner.ym = currentYm();
  if (!S.planner.sel) S.planner.sel = isoOf(new Date());
  const ym = S.planner.ym;
  const cells = monthGrid(ym, weekStart());
  const todayIso = isoOf(new Date());
  const tasks = S.cache.tasks || [];
  const byDay = {};
  for (const x of tasks) (byDay[x.date] = byDay[x.date] || []).push(x);
  const first = cells.find((c) => c.inMonth);
  const monthTitle = fmtDate(dateOfIso(first.iso), { month: 'long', year: 'numeric' });
  const wd = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(2024, 0, 7 + ((weekStart() + i) % 7), 12); // 2024-01-07 is a Sunday
    wd.push(fmtDate(d, { weekday: 'narrow' }));
  }
  const grid = cells.map((c) => {
    const list = byDay[c.iso] || [];
    const dots = list.slice(0, 3).map((x) => `<i class="cdot c-${esc(x.color || 'blue')} ${x.done ? 'done' : ''}"></i>`).join('');
    const holiday = c.dow === 0;
    return `<button class="cday ${c.inMonth ? '' : 'out'} ${c.iso === todayIso ? 'today' : ''} ${c.iso === S.planner.sel ? 'sel' : ''} ${holiday ? 'hol' : ''}" data-act="cal.pick" data-arg="${c.iso}">
      <span class="cd-m">${num(c.g)}</span><span class="cdots">${dots}</span></button>`;
  }).join('');
  const sel = S.planner.sel;
  const dayTasks = (byDay[sel] || []).slice().sort((a, b) => String(a.time || '99').localeCompare(String(b.time || '99')));
  const selDate = dateOfIso(sel);
  const left = dayTasks.filter((x) => !x.done).length;
  return `<section class="card pad cal">
      <div class="cal-head"><button class="ib sm" aria-label="${t('control_previousMonth')}" data-act="cal.prev">${icon('chevron-left', 20, 2, 'flip')}</button>
        <div class="cal-title"><b>${esc(monthTitle)}</b></div>
        <button class="ib sm" aria-label="${t('control_nextMonth')}" data-act="cal.next">${icon('chevron-right', 20, 2, 'flip')}</button></div>
      <div class="cal-wd">${wd.map((w) => `<span>${esc(w)}</span>`).join('')}</div>
      <div class="cal-grid">${grid}</div>
      <div class="row-center"><button class="link" data-act="cal.today">${t('goToday')}</button></div></section>
    <section class="card pad">
      <div class="card-head"><span>${esc(fmtDate(selDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}</span>
        ${dayTasks.some((x) => x.done) ? `<button class="link" data-act="task.clearDone">${t('clearDone')}</button>` : ''}</div>
      ${dayTasks.length ? `<div class="tasks">${dayTasks.map(taskRow).join('')}</div>` : `<p class="hint">${t('noTasks')}</p>`}
      ${dayTasks.length ? `<div class="dim small">${left ? t('tasksLeft', { n: num(left) }) : t('allDone')}</div>` : ''}
      <form class="task-add" data-form="task">
        <input id="taskTitle" name="title" placeholder="${t('taskPlaceholder')}" autocomplete="off" dir="auto">
        <input id="taskTime" name="time" type="time" title="${t('timeOpt')}">
        <button class="btn primary sm" aria-label="${t('control_addTask')}" type="submit">${icon('plus', 18)}</button>
      </form>
      <div class="colors">${COLORS.map((c) => `<button class="color c-${c} ${(S.planner.color || 'blue') === c ? 'on' : ''}" aria-label="${t('control_color')}: ${esc(c)}" aria-pressed="${(S.planner.color || 'blue') === c ? 'true' : 'false'}" data-act="task.color" data-arg="${c}"></button>`).join('')}</div>
      <p class="hint small">${t('plannerSync')}</p></section>`;
}

// ============================================================================================ devices & pairing
function devicesPage() {
  const list = S.st.devices || [];
  const paired = list.filter((d) => d.paired);
  const others = list.filter((d) => !d.paired);
  const bt = S.st.bluetooth || {};
  const row = (d) => {
    const status = d.connected ? [d.wifi ? `${icon('wifi', 12)} ${t('wifi')}` : '', d.bluetooth ? `${icon('bluetooth', 12)} ${t('bluetooth')}` : ''].filter(Boolean).join(' · ') : t('offline');
    let action = '';
    if (d.pairState === 'requested') action = `<span class="code">${esc(d.verifyKey)}</span>`;
    else if (d.pairState === 'requestedByPeer') action = `<button class="btn primary sm" data-act="pairSheet" data-arg="${esc(d.id)}">${t('respond')}</button>`;
    else if (d.paired) action = `${S.st.active && S.st.active.id === d.id ? `<span class="badge">${t('activePc')}</span>` : `<button class="btn primary sm" data-act="selectDevice" data-arg="${esc(d.id)}">${t('selectPc')}</button>`}<button class="btn ghost sm" data-act="unpair" data-arg="${esc(d.id)}">${t('unpair')}</button>`;
    else action = `<button class="btn primary sm" data-act="pair" data-arg="${esc(d.id)}">${t('pair')}</button>`;
    return `<div class="dev ${d.connected ? 'on' : ''}"><span class="dev-ic">${icon(d.type === 'laptop' ? 'laptop' : (d.type === 'phone' ? 'smartphone' : 'monitor'), 22)}</span>
      <span class="dev-main"><b>${esc(d.name)}</b><small>${status}${d.address && d.wifi ? ` · <span dir="ltr">${esc(d.address)}</span>` : ''}</small></span>${action}</div>
      ${d.pairState === 'requested' ? `<p class="hint pair-hint">${t('confirmOnPc', { code: d.verifyKey })}</p>` : ''}`;
  };
  return `<section class="card pad"><div class="card-head"><span>${icon('smartphone', 17)} ${t('thisPhone')}</span><button class="link" data-act="refresh">${icon('refresh-cw', 15)} ${t('search')}</button></div>
      <div class="me"><b>${esc((S.st.me && S.st.me.name) || '')}</b><small dir="ltr">${esc((S.st.ips || []).join(' · '))}</small></div></section>
    ${paired.length ? `<section class="card pad"><div class="card-head"><span>${icon('shield-check', 17)} ${t('pairedPcs')}</span></div>${paired.map(row).join('')}</section>` : ''}
    <section class="card pad"><div class="card-head"><span>${icon('wifi', 17)} ${t('availablePcs')}</span></div>
      ${others.length ? others.map(row).join('') : `<div class="searching">${icon('loader-circle', 18, 2, 'spin')} ${t('searching')}</div>`}
      <p class="hint">${t('devicesHint')}</p></section>
    <section class="card pad"><div class="card-head"><span>${icon('link', 17)} ${t('addByIp')}</span></div>
      <form class="ip-form" data-form="ip"><input id="ipAddr" name="ip" inputmode="decimal" placeholder="192.168.1.10" dir="ltr"><button class="btn primary sm" type="submit">${t('connect')}</button></form>
      <p class="hint small">${t('addByIpHint')}</p></section>
    <section class="card pad"><div class="card-head"><span>${icon('bluetooth', 17)} ${t('bluetooth')}</span>
        <label class="switch"><input type="checkbox" data-set="bluetooth" ${S.st.settings && S.st.settings.bluetooth ? 'checked' : ''}><i></i></label></div>
      <div class="bt-state ${bt.listening ? 'ok' : ''}">${icon(bt.listening ? 'bluetooth' : 'bluetooth-off', 16)} ${t(bt.listening ? 'btReady' : (!bt.permission ? 'btNoPerm' : (!bt.enabled ? 'btOff' : 'btWaiting')))}
        ${!bt.permission ? `<button class="link" data-act="perm" data-arg="bluetooth">${t('grant')}</button>` : ''}</div>
      <p class="hint">${t('btHint')}</p></section>`;
}

function openPairSheet(d) {
  openSheet('pair', `<div class="sheet-icon blue">${icon('shield-check', 30)}</div>
    <h3>${esc(t('pairRequestFrom', { name: d.name }))}</h3>
    <p class="hint center">${t('pairCompare')}</p>
    <div class="big-code">${esc(d.verifyKey || '—')}</div>
    <div class="sheet-actions"><button class="btn ghost" data-act="rejectPair" data-arg="${esc(d.id)}">${t('reject')}</button><button class="btn primary" data-act="acceptPair" data-arg="${esc(d.id)}">${t('accept')}</button></div>`);
}

// ============================================================================================ gaming (PC games, Blinkelo / Dynamic Island 1.8+)
const GAME_HIST = 90;
function pcHasGame() { const f = S.st.pc && S.st.pc.features; return Array.isArray(f) && f.includes('game'); }
function pctSign() { return '%'; }
function safeImg(src) { return typeof src === 'string' && /^data:image\/(png|jpeg|webp|gif|x-icon|bmp);base64,[A-Za-z0-9+/=]+$/.test(src) ? src : ''; }
function gameIconSrc(id) {
  if (!id) return '';
  if (S.game.icons[id]) return safeImg(S.game.icons[id]);
  const c = S.cache.gameicon;
  return c && c.id === id ? safeImg(c.icon) : '';
}
function gameArt(src, size) {
  return `<span class="gm-art" style="width:${size}px;height:${size}px">${src ? `<img src="${esc(src)}" alt="">` : icon('gamepad-2', Math.round(size * 0.5))}</span>`;
}
function fpsCls(v) { return v === null || v === undefined ? '' : v < 30 ? 'bad' : v < 55 ? 'warn' : 'good'; }
function tempCls(v, warn, bad) { return v === null || v === undefined ? '' : v >= bad ? 'bad' : v >= warn ? 'warn' : ''; }
function tempTxt(c, unit) {
  if (c === null || c === undefined) return '';
  return unit === 'f' ? `${num(Math.round(c * 9 / 5 + 32))}°F` : `${num(c)}°`;
}
function durTxt(sec) {
  sec = Math.max(0, Number(sec) || 0);
  const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60);
  return h ? t('gm_hm', { h: num(h), m: num(m) }) : t('gm_m', { m: num(Math.max(1, m)) });
}

function onGame(d) {
  const prev = S.cache.game;
  S.cache.game = d;
  const g = d && d.game;
  if (g && g.id !== S.game.histId) { S.game.hist = []; S.game.histId = g.id; }
  if (g && d.m && Number.isFinite(d.m.fps) && d.m.fps >= 0) {
    S.game.hist.push(d.m.fps);
    if (S.game.hist.length > GAME_HIST) S.game.hist.shift();
  }
  const changed = !prev || prev.state !== d.state || (prev.game && prev.game.id) !== (g && g.id) || prev.enabled !== d.enabled;
  if (changed) softRender(['game', 'home']); else live('game');
}

let gameTimer = 0;
function mountGame() {
  if (!connected() || !pcHasGame()) return;
  send('island.game.request', { action: 'subscribe', full: true });
  if (!S.cache.gamelib) { S.game.libLoading = true; send('island.game.request', { action: 'library' }); }
  clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    if (connected()) send('island.game.request', { action: 'subscribe' });
    live('game'); // the play clock
  }, 10000);
}
function unmountGame() {
  clearInterval(gameTimer);
  gameTimer = 0;
  if (connected() && pcHasGame()) send('island.game.request', { action: 'unsubscribe' });
}

// ---------------------------------------------------------------- pieces
function arcSvg(pct, color) {
  const v = Math.max(0, Math.min(100, Number(pct) || 0));
  const L = Math.PI * 40;
  return `<svg class="gm-arc ${color}" viewBox="0 0 100 56"><path class="trk" d="M10 50 A40 40 0 0 1 90 50"/><path class="val" d="M10 50 A40 40 0 0 1 90 50" stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${(L * (1 - v / 100)).toFixed(1)}"/></svg>`;
}
function gauge(label, ic, color, pct, sub, badge) {
  return `<div class="card gm-g ${color}">
    <div class="gm-g-h">${icon(ic, 15)}<span>${label}</span>${badge || ''}</div>
    <div class="gm-g-arc">${arcSvg(pct, color)}<div class="gm-g-v">${pct === null || pct === undefined ? '–' : num(pct)}<small>${pctSign()}</small></div></div>
    <div class="gm-g-s">${sub}</div></div>`;
}
function tempChip(c, warn, bad, unit) {
  if (c === null || c === undefined) return `<span class="gm-t dim">${icon('thermometer', 12)} ${t('gm_noSensor')}</span>`;
  return `<span class="gm-t ${tempCls(c, warn, bad)}">${icon('thermometer', 12)} ${tempTxt(c, unit)}</span>`;
}
function memSub(used, total) {
  if (used === null || used === undefined) return '<span class="gm-t dim">–</span>';
  return `<span class="gm-t" dir="ltr">${num(used, used < 10 ? 1 : 0)}${total ? ` / ${num(total, total < 10 ? 1 : 0)}` : ''} GB</span>`;
}
function sparkHtml(cls) {
  const h = S.game.hist;
  if (h.length < 2) return `<div class="gm-spark ${cls} empty"><span>${t('gm_trend')}</span></div>`;
  const W = 300; const H = 64;
  const hi = Math.max(...h); const lo = Math.min(...h);
  const top = Math.max(60, hi) * 1.12;
  const slots = Math.max(30, h.length); // the first half minute already spans the full width
  const step = W / (slots - 1);
  const pts = h.map((v, i) => [W - (h.length - 1 - i) * step, H - 2 - (v / top) * (H - 4)]);
  const line = `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')}`;
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z`;
  return `<div class="gm-spark ${cls}" dir="ltr">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><linearGradient id="gmg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".42"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
    <path d="${area}" fill="url(#gmg)"/><path d="${line}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
    <div class="gm-spark-l"><span>${t('gm_trend')}</span><span>${t('gm_minmax', { a: num(lo), b: num(hi) })}</span></div></div>`;
}

// ---------------------------------------------------------------- home card
function gameMini() {
  const d = S.cache.game;
  const g = d && d.game;
  if (!g) {
    return `<button class="card gm-mini idle" data-act="go" data-arg="game">
      <span class="gm-mini-ic">${icon('gamepad-2', 22)}</span>
      <span class="gm-mini-main"><b>${t('gm_title')}</b><small>${t('gm_open')}</small></span>${icon('chevron-right', 20, 2, 'flip dim')}</button>`;
  }
  const m = d.m || {};
  const fc = fpsCls(m.fps);
  return `<button class="card gm-mini on ${fc}" data-act="go" data-arg="game">
    ${gameArt(gameIconSrc(g.id), 44)}
    <span class="gm-mini-main"><b dir="auto">${esc(g.title || g.name)}</b><small><span class="gm-dot"></span>${t('gm_live')} · ${clock((Date.now() - g.start) / 1000)}</small></span>
    <span class="gm-mini-temps"><span class="${tempCls(m.cpuTemp, 80, 90)}">CPU ${m.cpuTemp === null || m.cpuTemp === undefined ? '–' : tempTxt(m.cpuTemp, d.temp)}</span><span class="${tempCls(m.gpuTemp, 78, 86)}">GPU ${m.gpuTemp === null || m.gpuTemp === undefined ? '–' : tempTxt(m.gpuTemp, d.temp)}</span></span>
    <span class="gm-mini-fps ${fc}">${m.fps === null || m.fps === undefined ? '–' : num(m.fps)}<small>FPS</small></span></button>`;
}

// ---------------------------------------------------------------- page
function gamePage() {
  if (!connected()) return emptyState('wifi-off', t('notConnected'), t('connectFirst'));
  if (!pcHasGame()) return emptyState('gamepad-2', t('gm_title'), t('gm_needPc'));
  const d = S.cache.game;
  const playing = !!(d && d.game);
  const set = (S.st.settings && S.st.settings.gaming) || {};
  return `<div data-live="game">${gameLiveHtml()}</div>
    ${playing ? '' : `${summaryCard()}${libraryCard()}${recentCard()}`}
    <section class="card">
      ${setRow('bell', t('gm_notif'), t('gm_notifHint'), sw('gaming.notification', set.notification !== false))}
      ${setRow('trophy', t('gm_summaryNotif'), '', sw('gaming.summary', set.summary !== false))}
    </section>`;
}

function gameLiveHtml() {
  const d = S.cache.game;
  if (!d) return `<div class="stats-wait">${icon('loader-circle', 18, 2, 'spin')} ${t('gm_loading')}</div>`;
  const g = d.game;
  if (!g) {
    return `<section class="card gm-idle">
      <div class="gm-idle-ic">${icon('gamepad-2', 34)}</div>
      <b>${t(d.enabled === false ? 'gm_off' : 'gm_noGame')}</b>
      <p class="hint center">${t('gm_noGameHint')}</p>
      ${d.optimized ? `<button class="btn sm ghost" data-act="game.cmd" data-arg="restore">${icon('undo-2', 16)} ${t('gm_undo')}</button>` : ''}
    </section>`;
  }
  const m = d.m || {};
  const fc = fpsCls(m.fps);
  const hasFps = m.fps !== null && m.fps !== undefined;
  const ping = m.ping === null || m.ping === undefined ? '' : `<span class="chip">${icon('signal', 13)} ${t('gm_ping')} ${m.ping < 0 ? t('gm_noNet') : `<bdi dir="ltr">${num(m.ping)} ms</bdi>`}</span>`;
  return `<section class="card gm-hero ${fc}">
      <div class="gm-top">${gameArt(gameIconSrc(g.id), 52)}
        <div class="gm-name"><b dir="auto">${esc(g.title || g.name)}</b><span class="gm-live"><span class="gm-dot"></span>${t('gm_live')} · ${clock((Date.now() - g.start) / 1000)}</span></div>
        ${d.fullscreen ? `<span class="chip xs">${t('gm_fullscreen')}</span>` : ''}</div>
      ${hasFps ? `<div class="gm-fps">
        <div class="gm-fps-main"><span class="gm-fps-v ${fc}">${num(m.fps)}</span><span class="gm-fps-u">FPS</span></div>
        <div class="gm-fps-side">
          <div><b class="${fpsCls(m.low1)}">${m.low1 === null || m.low1 === undefined ? '–' : num(m.low1)}</b><small>${t('gm_low')}</small></div>
          <div><b>${m.ft === null || m.ft === undefined ? '–' : num(m.ft, 1)}</b><small>${t('gm_frameMs')}</small></div></div></div>
      ${sparkHtml(fc)}` : `<p class="hint">${icon('info', 14)} ${t('gm_noFps')}</p>`}
    </section>
    <div class="gm-gauges">
      ${gauge('CPU', 'cpu', 'blue', m.cpu, tempChip(m.cpuTemp, 80, 90, d.temp))}
      ${gauge('GPU', 'gpu', 'green', m.gpu, tempChip(m.gpuTemp, 78, 86, d.temp), m.gpuPower === null || m.gpuPower === undefined ? '' : `<small dir="ltr">${num(m.gpuPower)} W</small>`)}
      ${gauge('RAM', 'memory-stick', 'purple', m.ram, memSub(m.ramUsed, m.ramTotal))}
      ${gauge('VRAM', 'layers', 'orange', m.vram !== null && m.vram !== undefined && m.vramTotal ? Math.round(m.vram * 100 / m.vramTotal) : null, memSub(m.vram, m.vramTotal))}
    </div>
    ${ping || m.src ? `<div class="gm-chips">${ping}${m.src ? `<span class="chip">${icon('activity', 13)} ${t('gm_src')}: ${esc(m.src.toUpperCase())}</span>` : ''}</div>` : ''}
    <div class="gm-ctl">
      <button class="gm-btn ${d.optimized ? 'on' : ''}" data-act="game.cmd" data-arg="${d.optimized ? 'restore' : 'optimize'}">${icon(d.optimized ? 'undo-2' : 'rocket', 19)}<span>${t(d.optimized ? 'gm_undo' : 'gm_optimize')}</span></button>
      <button class="gm-btn ${d.hud ? 'on' : ''}" data-act="game.cmd" data-arg="hud">${icon(d.hud ? 'eye' : 'eye-off', 19)}<span>${t('gm_pcBar')}</span></button>
    </div>`;
}

function summaryCard() {
  const b = S.cache.gamesummary;
  const s = b && b.summary;
  if (!s) return '';
  const unit = b.temp;
  const cell = (label, value, cls = '') => `<div class="gm-cell"><b class="${cls}">${value}</b><small>${label}</small></div>`;
  const has = (v) => v !== null && v !== undefined;
  return `<section class="card gm-sum">
    <div class="gm-sum-h">${gameArt(gameIconSrc(s.id), 40)}<div class="gm-sum-t"><small>${t('gm_lastSession')}</small><b dir="auto">${esc(s.name)}</b></div>${s.end ? `<span class="dim small">${ago(s.end)}</span>` : ''}</div>
    <div class="gm-sum-grid">
      ${cell(t('gm_duration'), durTxt(s.dur))}
      ${cell(t('gm_avgFps'), has(s.avgFps) ? num(s.avgFps) : '–', fpsCls(s.avgFps))}
      ${cell(t('gm_low'), has(s.low1) ? num(s.low1) : '–', fpsCls(s.low1))}
      ${cell(t('gm_cpuMax'), has(s.maxCpuTemp) ? tempTxt(s.maxCpuTemp, unit) : '–', tempCls(s.maxCpuTemp, 80, 90))}
      ${cell(t('gm_gpuMax'), has(s.maxGpuTemp) ? tempTxt(s.maxGpuTemp, unit) : '–', tempCls(s.maxGpuTemp, 78, 86))}
      ${cell(t('gm_gpuAvg'), has(s.avgGpu) ? `${num(s.avgGpu)}${pctSign()}` : '–')}
    </div></section>`;
}

function libraryCard() {
  const lib = S.cache.gamelib;
  const games = (lib && lib.games) || [];
  let body;
  if (!lib) body = `<div class="stats-wait">${icon('loader-circle', 18, 2, 'spin')} ${t('gm_loading')}</div>`;
  else if (!games.length) body = `<p class="hint">${t('gm_libEmpty')}</p>`;
  else {
    body = `<div class="gm-lib">${games.map((g) => {
      const busy = S.game.launching === g.id;
      return `<button class="gm-tile ${busy ? 'busy' : ''}" data-act="game.launch" data-arg="${esc(g.id)}" ${S.game.launching && !busy ? 'disabled' : ''}>
        ${gameArt(safeImg(g.icon), 58)}${busy ? `<span class="gm-tile-spin">${icon('loader-circle', 22, 2.2, 'spin')}</span>` : ''}
        <span class="gm-tile-n" dir="auto">${esc(g.name)}</span></button>`;
    }).join('')}</div><p class="hint small">${t('gm_tapToStart')}</p>`;
  }
  return `<section class="card pad">
    <div class="card-head"><span>${icon('layout-grid', 17)} ${t('gm_library')}</span><button class="ib" aria-label="${t('gm_library')}" data-act="game.lib">${icon('refresh-cw', 17, 2, S.game.libLoading ? 'spin' : '')}</button></div>
    ${body}</section>`;
}

function recentCard() {
  const list = ((S.cache.game && S.cache.game.sessions) || []).filter((s) => s && s.name);
  if (!list.length) return '';
  return `<section class="card pad">
    <div class="card-head"><span>${icon('history', 17)} ${t('gm_recent')}</span></div>
    <div class="gm-recent">${list.map((s) => `<div class="gm-rrow">
      <div class="gm-rmain"><b dir="auto">${esc(s.name)}</b><small>${durTxt(s.dur)}${s.end ? ` · ${ago(s.end)}` : ''}</small></div>
      <div class="gm-rfps ${fpsCls(s.avgFps)}">${s.avgFps === null || s.avgFps === undefined ? '–' : num(s.avgFps)}<small>FPS</small></div></div>`).join('')}</div></section>`;
}

// ============================================================================================ settings
function sw(path, on) { return `<label class="switch"><input type="checkbox" data-set="${path}" ${on ? 'checked' : ''}><i></i></label>`; }
function setRow(ic, title, sub, control, act) {
  return `<div class="set-row" ${act ? `data-act="${act.split(':')[0]}" data-arg="${act.split(':')[1] || ''}"` : ''}><span class="sr-ic">${icon(ic, 18)}</span><span class="sr-main"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span>${control || (act ? icon('chevron-right', 18, 2, 'flip dim') : '')}</div>`;
}
function settingsPage() {
  const s = S.st.settings || {};
  const tp = s.touchpad || {};
  const perms = S.st.permissions || {};
  const missing = Object.keys(PERMS).filter((k) => perms[k] === false).length;
  const langs = [['auto', t('langAuto')], ['en', 'English'], ['ar', 'العربية'], ['tr', 'Türkçe'], ['es', 'Español'], ['ru', 'Русский'], ['zh', '中文']];
  return `<section class="card list">
      ${setRow('shield-check', t('page_permissions'), missing ? t('permsMissing', { n: num(missing) }) : t('permsOk'), missing ? `<span class="badge">${num(missing)}</span>` : icon('circle-check', 18, 2, 'ok'), 'go:permissions')}
      ${setRow('laptop', t('page_devices'), esc(pcName() || t('noPcShort')), '', 'go:devices')}
    </section>
    <h4 class="sec">${t('secConnection')}</h4>
    <section class="card list">
      <div class="set-row"><span class="sr-ic">${icon('smartphone', 18)}</span><span class="sr-main"><b>${t('deviceName')}</b><input class="inline-input" id="devName" value="${esc(s.deviceName || '')}" placeholder="${esc((S.st.me && S.st.me.name) || '')}"></span></div>
      ${setRow('bluetooth', t('bluetooth'), t('btShort'), sw('bluetooth', s.bluetooth))}
      ${setRow('rocket', t('startOnBoot'), t('startOnBootHint'), sw('startOnBoot', s.startOnBoot))}
    </section>
    <h4 class="sec">${t('secFeatures')}</h4>
    <section class="card list">
      ${setRow('bell', t('mirrorNotifs'), t('mirrorNotifsHint'), sw('notifications.mirror', s.notifications && s.notifications.mirror))}
      ${setRow('sliders-horizontal', t('page_notifapps'), t('notifAppsHint'), '', 'go:notifapps')}
      ${setRow('phone', t('calls'), t('callsHint'), sw('calls', s.calls))}
      ${setRow('message-square', t('sms'), t('smsHint'), sw('sms', s.sms))}
      ${setRow('music', t('phoneMedia'), t('phoneMediaHint'), sw('media.mirror', s.media && s.media.mirror))}
      ${setRow('monitor', t('pcMediaNotif'), t('pcMediaNotifHint'), sw('media.pcNotification', s.media && s.media.pcNotification))}
      ${setRow('bell-ring', t('pcNotifs'), t('pcNotifsHint'), sw('pcNotifications', s.pcNotifications))}
      ${setRow('clipboard-paste', t('clipReceive'), t('clipReceiveHint'), sw('clipboard.receive', s.clipboard && s.clipboard.receive))}
    </section>
    <h4 class="sec">${t('secTouchpad')}</h4>
    <section class="card list">
      <div class="set-row col"><div class="sr-top"><span class="sr-ic">${icon('mouse-pointer-2', 18)}</span><b>${t('sensitivity')}</b><span class="dim">${num(tp.sensitivity || 1, 1)}×</span></div>
        <input type="range" class="slider" min="0.4" max="3" step="0.1" value="${tp.sensitivity || 1}" data-set-num="touchpad.sensitivity"></div>
      <div class="set-row col"><div class="sr-top"><span class="sr-ic">${icon('move-vertical', 18)}</span><b>${t('scrollSpeed')}</b><span class="dim">${num(tp.scroll || 1, 1)}×</span></div>
        <input type="range" class="slider" min="0.3" max="3" step="0.1" value="${tp.scroll || 1}" data-set-num="touchpad.scroll"></div>
      ${setRow('arrow-up-down', t('naturalScroll'), t('naturalScrollHint'), sw('touchpad.natural', tp.natural))}
      ${setRow('zap', t('haptics'), '', sw('touchpad.haptics', tp.haptics !== false))}
    </section>
    <h4 class="sec">${t('secLanguage')}</h4>
    <section class="card pad"><div class="langs">${langs.map(([k, n]) => `<button class="lang ${(s.language || 'auto') === k ? 'on' : ''}" data-act="lang" data-arg="${k}">${esc(n)}</button>`).join('')}</div></section>
    <section class="card list">${setRow('heart', t('page_support'), t('supportSub'), '', 'go:support')}
      ${setRow('info', t('page_about'), `${t('appName')} ${esc(S.st.version || '')}`, '', 'go:about')}</section>`;
}

const PERMS = {
  notifications: ['bell', 'perm_notifications'],
  notificationAccess: ['message-square', 'perm_notificationAccess'],
  phone: ['phone', 'perm_phone'],
  contacts: ['contact', 'perm_contacts'],
  sms: ['send', 'perm_sms'],
  bluetooth: ['bluetooth', 'perm_bluetooth'],
  battery: ['battery-charging', 'perm_battery'],
  exactAlarm: ['alarm-clock', 'perm_exactAlarm'],
  fullScreen: ['maximize', 'perm_fullScreen'],
  storage: ['folder-open', 'perm_storage'],
};
function permissionsPage() {
  const p = S.st.permissions || {};
  return `<p class="hint">${t('permsIntro')}</p><section class="card list">${Object.entries(PERMS).filter(([k]) => p[k] !== undefined).map(([k, [ic, label]]) => `
    <div class="set-row"><span class="sr-ic ${p[k] ? 'ok' : ''}">${icon(ic, 18)}</span><span class="sr-main"><b>${t(label)}</b><small>${t(`${label}_d`)}</small></span>
      ${p[k] ? icon('circle-check', 20, 2, 'ok') : `<button class="btn primary sm" data-act="perm" data-arg="${k}">${t('grant')}</button>`}</div>`).join('')}</section>
    <div class="row-center"><button class="link" data-act="perm" data-arg="appSettings">${t('openAppSettings')}</button></div>`;
}

function notifAppsPage() {
  const list = S.notifApps;
  if (!list) return `<div class="searching">${icon('loader-circle', 18, 2, 'spin')}</div>`;
  if (!list.length) return emptyState('bell', t('noNotifApps'), t('noNotifAppsHint'));
  return `<p class="hint">${t('notifAppsIntro')}</p><section class="card list">${list.sort((a, b) => a.name.localeCompare(b.name)).map((a) => `<div class="set-row"><span class="sr-ic">${icon('app-window', 18)}</span><span class="sr-main"><b dir="auto">${esc(a.name)}</b><small dir="ltr">${esc(a.pkg)}</small></span>
    <label class="switch"><input type="checkbox" data-notifapp="${esc(a.pkg)}" ${a.blocked ? '' : 'checked'}><i></i></label></div>`).join('')}</section>`;
}

function aboutPage() {
  return `<section class="card pad center-col about">
      <div class="logo bk-logo">${logoSvg()}</div><h2>${t('appName')}</h2><div class="dim">${esc(S.st.version || '')} · SaeedSH</div>
      <p class="hint center">${t('aboutText')}</p>
      <button class="btn ghost sm" data-act="go" data-arg="support">${icon('heart', 16)} ${t('page_support')}</button></section>
    <section class="card list">
      ${setRow('monitor', t('pcApp'), S.st.pc && S.st.pc.app ? `${esc(S.st.pc.app)} ${esc(S.st.pc.version || '')}` : t('pcAppUnknown'))}
      ${setRow('shield-check', t('security'), t('securityText'))}
      ${setRow('globe', t('protocol'), t('protocolText'))}
    </section>
    <div class="row-center"><button class="link danger" data-act="stopService">${t('stopService')}</button></div>`;
}

// project links (the native side only opens http(s) links, see Bridge "openUrl")
const REPO_URL = 'https://github.com/saeedsh70/Blinkelo';
const LINKS = { donate: `${REPO_URL}/blob/main/DONATE.md`, repo: REPO_URL, issues: `${REPO_URL}/issues/new/choose` };

function supportPage() {
  return `<section class="card pad center-col support-hero">
      <span class="support-heart">${icon('heart', 44, 2)}</span>
      <h2>${t('page_support')}</h2>
      <p class="hint center">${t('supportText')}</p>
      <button class="btn primary wide" data-act="openUrl" data-arg="${LINKS.donate}">${icon('heart', 18, 2.2)} ${t('donateCrypto')}</button>
      <div class="dim small" dir="ltr">BTC · USDT (TRC20, BEP20) · SOL</div></section>
    <p class="hint">${t('supportFree')}</p>
    <section class="card list">
      <div class="set-row" data-act="openUrl" data-arg="${LINKS.repo}"><span class="sr-ic">${icon('star', 18)}</span><span class="sr-main"><b>${t('starGithub')}</b></span>${icon('external-link', 16, 2, 'dim')}</div>
      <div class="set-row" data-act="openUrl" data-arg="${LINKS.issues}"><span class="sr-ic">${icon('bug', 18)}</span><span class="sr-main"><b>${t('reportBug')}</b></span>${icon('external-link', 16, 2, 'dim')}</div>
    </section>`;
}

function emptyState(ic, title, hint) {
  return `<div class="empty">${icon(ic, 40, 1.5)}<b>${esc(title)}</b>${hint ? `<span>${esc(hint)}</span>` : ''}</div>`;
}

// the app icon, alive: dark tile, black pill, two eyes (see blink.js)
function logoSvg() {
  return `<span class="bk-pill">${faceHtml('', 'logo')}</span>`;
}

// ============================================================================================ onboarding
function onboardPage() {
  const step = S.onboardStep;
  const s = S.st.settings || {};
  const perms = S.st.permissions || {};
  const langs = [['en', 'English'], ['ar', 'العربية'], ['tr', 'Türkçe'], ['es', 'Español'], ['ru', 'Русский'], ['zh', '中文']];
  const dots = `<div class="ob-dots">${[0, 1, 2].map((i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>`;
  if (step === 0) {
    return `<div class="onboard"><div class="ob-hero"><div class="logo glow bk-logo">${logoSvg()}</div><h1>${t('appName')}</h1><p>${t('obTagline')}</p></div>
      <div class="langs">${langs.map(([k, n]) => `<button class="lang ${lang() === k ? 'on' : ''}" data-act="lang" data-arg="${k}">${n}</button>`).join('')}</div>
      ${dots}<button class="btn primary wide" data-act="ob.next">${t('next')}</button></div>`;
  }
  if (step === 1) {
    const items = ['notifications', 'notificationAccess', 'phone', 'bluetooth', 'battery'].filter((k) => perms[k] !== undefined);
    return `<div class="onboard"><h2>${t('obPermsTitle')}</h2><p class="hint">${t('obPermsText')}</p>
      <section class="card list">${items.map((k) => `<div class="set-row"><span class="sr-ic ${perms[k] ? 'ok' : ''}">${icon(PERMS[k][0], 18)}</span><span class="sr-main"><b>${t(PERMS[k][1])}</b><small>${t(`${PERMS[k][1]}_d`)}</small></span>
        ${perms[k] ? icon('circle-check', 20, 2, 'ok') : `<button class="btn primary sm" data-act="perm" data-arg="${k}">${t('grant')}</button>`}</div>`).join('')}</section>
      ${dots}<button class="btn primary wide" data-act="ob.next">${t('next')}</button></div>`;
  }
  return `<div class="onboard"><div class="ob-hero sm"><div class="pc-art">${icon('laptop', 54, 1.4)}<span class="link-anim"></span>${icon('smartphone', 40, 1.4)}</div></div>
    <h2>${t('obPcTitle')}</h2>
    <ol class="ob-steps"><li>${t('obPc1')}</li><li>${t('obPc2')}</li><li>${t('obPc3')}</li></ol>
    ${dots}<button class="btn primary wide" data-act="ob.done">${t('obStart')}</button></div>`;
}

// ============================================================================================ actions
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const act = el.dataset.act;
  const arg = el.dataset.arg;
  if (el.tagName === 'FORM') return;
  switch (act) {
    case 'go': go(arg); break;
    case 'back': back(); break;
    case 'sheet.close': closeSheet(); break;
    case 'game.cmd':
      if (['optimize', 'restore', 'hud'].includes(arg)) { send('island.game.request', { action: arg }); haptic(14); }
      break;
    case 'game.launch': {
      const g = ((S.cache.gamelib && S.cache.gamelib.games) || []).find((x) => x.id === arg);
      if (!g || S.game.launching) break;
      S.game.launching = arg;
      send('island.game.request', { action: 'launch', id: arg });
      haptic(16);
      toast(t('gm_starting', { name: g.name }));
      softRender(['game']);
      setTimeout(() => { if (S.game.launching === arg) { S.game.launching = ''; softRender(['game']); } }, 15000);
      break;
    }
    case 'game.lib': S.game.libLoading = true; send('island.game.request', { action: 'library' }); softRender(['game']); break;
    case 'refresh': call('refresh'); toast(t('searching')); break;
    case 'pair': call('pair', { id: arg }); haptic(); break;
    case 'unpair': if (confirm(t('unpairConfirm'))) call('unpair', { id: arg }); break;
    case 'acceptPair': call('acceptPair', { id: arg }); closeSheet(); break;
    case 'rejectPair': call('rejectPair', { id: arg }); closeSheet(); break;
    case 'pairSheet': { const d = (S.st.devices || []).find((x) => x.id === arg); if (d) openPairSheet(d); break; }
    case 'perm': call('permission', { kind: arg }); break;
    case 'lang': setSettings({ language: arg }); refreshState(); render(); break;
    case 'click': mouse({ [arg]: true }); haptic(10); break;
    case 'key': mouse({ specialKey: KEYS[arg] }); haptic(8); break;
    case 'combo': if (COMBOS[arg]) { mouse(COMBOS[arg]); haptic(10); } break;
    case 'media': send('island.media.request', { action: arg }); haptic(10);
      if (arg === 'playpause' && S.cache.pcmedia) { S.cache.pcmedia.status = S.cache.pcmedia.status === 'playing' ? 'paused' : 'playing'; live('pcmedia'); }
      break;
    case 'vol.mute': { const s = ((S.cache.volume && S.cache.volume.sinkList) || []).find((x) => x.name === arg); if (s) { s.muted = !s.muted; send('kdeconnect.systemvolume.request', { name: arg, muted: s.muted }); live('volume'); } break; }
    case 'launch':
      if (deckHeld) { deckHeld = false; break; } // that press opened the size sheet
      send('island.apps.launch', { id: arg });
      haptic(14);
      el.classList.remove('fired');
      void el.offsetWidth;
      el.classList.add('fired');
      if (!DM.KEY_KINDS.includes(el.dataset.kind)) toast(t('launching'));
      break;
    case 'deck.size': {
      const [id, size] = String(arg).split('|');
      const sizes = deckSizes();
      if (DM.SIZES.includes(size)) sizes[id] = size; else delete sizes[id];
      store.set('deck.sizes', sizes);
      haptic(10);
      closeSheet();
      softRender(['apps']);
      break;
    }
    case 'cmd':
      if (CONFIRM.includes(arg)) {
        const p = POWER.find((x) => x[0] === arg);
        openSheet('confirm', `<div class="sheet-icon red">${icon(p ? p[1] : 'power', 30)}</div><h3>${esc(t('confirmPower', { what: t(p ? p[2] : 'cmd_shutdown'), pc: pcName() }))}</h3>
          <div class="sheet-actions"><button class="btn ghost" data-act="sheet.close">${t('cancel')}</button><button class="btn danger" data-act="cmd.do" data-arg="${arg}" data-peer="${esc(S.st.active?.id || '')}">${t(p ? p[2] : 'cmd_shutdown')}</button></div>`);
      } else { send('kdeconnect.runcommand.request', { key: arg }); haptic(14); toast(t('done')); }
      break;
    case 'cmd.do': {
      const ok = el.dataset.peer && send('kdeconnect.runcommand.request', { key: arg }, el.dataset.peer);
      closeSheet(); haptic(20); toast(t(ok ? 'done' : 'connectFirst')); break;
    }
    case 'lock': send('kdeconnect.runcommand.request', { key: 'island.lock' }); haptic(16); toast(t('pcLocked')); break;
    case 'findpc':
      S.findPc = !S.findPc;
      send('island.findpc', { action: S.findPc ? 'start' : 'stop' });
      haptic(20);
      softRender(['home']);
      if (S.findPc) toast(t('findPcRinging'), { act: 'findpc', label: t('stop') });
      break;
    case 'pick': call('pickFiles'); break;
    case 'photo': closeSheet(); call('takePhoto', arg ? { deviceId: arg } : {}); break;
    case 'clip': call('sendClipboard'); break;
    case 'textSheet': openTextSheet(); break;
    case 'text.send': {
      const v = ($('#shareText') || {}).value || '';
      const txt = v.trim();
      if (!txt) break;
      if (/^https?:\/\/\S+$/i.test(txt)) call('sendUrl', { url: txt }); else call('sendText', { text: txt });
      closeSheet(); toast(t('sentTo', { pc: pcName() }));
      break;
    }
    case 'kb.send': { const ta = $('#kbText'); if (ta && ta.value) { mouse({ key: ta.value }); ta.value = ''; haptic(12); toast(t('sentTo', { pc: pcName() })); } break; }
    case 'shot': S.shotLoading = true; send('island.screenshot.request', {}); softRender(['screenshot']); setTimeout(() => { if (S.shotLoading) { S.shotLoading = false; softRender(['screenshot']); toast(t('screenshotFailed')); } }, 20000); break;
    case 'openUri': call('openUri', { uri: arg, mime: el.dataset.mime || '' }); break;
    case 'shareUri': call('shareUri', { uri: arg, mime: el.dataset.mime || '*/*' }); break;
    case 'openUrl': call('openUrl', { url: arg }); break;
    case 'pres': presenterKey(arg); break;
    case 'timer.start': call('timerStart', { ms: Number(arg) * 60000, label: '' }); haptic(); toast(t('timerStarted')); break;
    case 'timer.custom': {
      const m = Number(($('#tmMin') || {}).value);
      if (!(m > 0)) break;
      call('timerStart', { ms: m * 60000, label: (($('#tmLabel') || {}).value || '').trim() });
      haptic(); toast(t('timerStarted'));
      break;
    }
    case 'timer.cancel': call('timerCancel', { id: arg }); break;
    case 'task.toggle': { const x = (S.cache.tasks || []).find((y) => y.id === arg); if (x) { call('taskUpdate', { id: arg, patch: { done: !x.done } }); haptic(x.done ? 8 : 18); } break; }
    case 'task.remove': call('taskRemove', { id: arg }); break;
    case 'task.clearDone': call('tasksClearDone', { date: S.planner.sel }); break;
    case 'task.color': S.planner.color = arg; document.querySelectorAll('.color').forEach((c) => c.classList.toggle('on', c.dataset.arg === arg)); break;
    case 'cal.prev': S.planner.ym = shiftYm(S.planner.ym, -1); softRender(['planner']); break;
    case 'cal.next': S.planner.ym = shiftYm(S.planner.ym, 1); softRender(['planner']); break;
    case 'cal.today': S.planner.ym = currentYm(); S.planner.sel = isoOf(new Date()); softRender(['planner']); break;
    case 'cal.pick': S.planner.sel = arg; softRender(['planner']); break;
    case 'selectDevice': if (call('selectDevice', { id: arg })) {
      for (const key of ['sysinfo', 'apps', 'volume', 'commands', 'hello', 'screenshot', 'pcmedia', 'game', 'gamelib', 'gameicon', 'gamesummary']) delete S.cache[key];
      refreshState(); render();
    } break;
    case 'stopService': call('stopService'); toast(t('serviceStopped')); break;
    case 'ob.next': S.onboardStep += 1; render(); break;
    case 'ob.done': call('onboarded'); S.st.settings.onboarded = true; setTimeout(() => { refreshState(); go(connected() ? 'home' : 'devices'); }, 400); break;
    default: break;
  }
});

document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'task') {
    const title = (f.elements.title.value || '').trim();
    if (!title) return;
    call('taskAdd', { task: { title, date: S.planner.sel || isoOf(new Date()), time: f.elements.time.value || null, color: S.planner.color || 'blue' } });
    f.elements.title.value = '';
    f.elements.time.value = '';
    haptic(14);
  } else if (f.dataset.form === 'ip') {
    const ip = (f.elements.ip.value || '').trim();
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) || ip.split('.').some((n) => Number(n) > 255)) { toast(t('badIp')); return; }
    call('connectIp', { ip });
    toast(t('connecting'));
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.set) {
    const path = el.dataset.set.split('.');
    const patch = {};
    let cur = patch;
    path.forEach((k, i) => { if (i === path.length - 1) cur[k] = el.checked; else { cur[k] = {}; cur = cur[k]; } });
    setSettings(patch);
    if (el.dataset.set === 'bluetooth') setTimeout(() => { refreshState(); softRender(['devices']); }, 800);
  } else if (el.dataset.setNum) {
    const [a, b] = el.dataset.setNum.split('.');
    setSettings({ [a]: { [b]: Number(el.value) } });
    softRender(['settings']);
  } else if (el.dataset.notifapp) {
    call('setNotifBlocked', { pkg: el.dataset.notifapp, blocked: !el.checked });
  } else if (el.id === 'devName') {
    setSettings({ deviceName: el.value.trim() });
  } else if (el.id === 'seek') {
    send('island.media.request', { action: 'seek', position: Number(el.value) });
    if (S.cache.pcmedia) { S.cache.pcmedia.position = Number(el.value); S.cache.pcmedia.receivedAt = Date.now(); }
  }
});

let volTimer = 0;
document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.vol) {
    clearTimeout(volTimer);
    const name = el.dataset.vol;
    const v = Number(el.value);
    const s = ((S.cache.volume && S.cache.volume.sinkList) || []).find((x) => x.name === name);
    if (s) s.volume = v;
    const lbl = el.parentElement.querySelector('.vol-v');
    if (lbl && s) lbl.textContent = num(Math.round(v * 100 / (Number(s.maxVolume) || 100)));
    volTimer = setTimeout(() => send('kdeconnect.systemvolume.request', { name, volume: v }), 60);
  } else if (el.id === 'deckCols') {
    const cols = Math.min(6, Math.max(2, 8 - Number(el.value)));
    if (cols !== deckCols()) { store.set('deck.cols', cols); haptic(6); fitDeck(); }
  } else if (el.id === 'appsQ') {
    S.appsQuery = el.value;
    const list = $('.apps');
    if (list) {
      const q = el.value.trim().toLowerCase();
      list.querySelectorAll('.app').forEach((b) => { b.style.display = !q || b.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    }
  }
});

// ============================================================================================ boot
function boot() {
  refreshState();
  if (isMock) {
    document.body.classList.add('mock');
    const p = new URLSearchParams(location.search);
    if (p.get('route') && ROUTES[p.get('route')]) S.route = p.get('route');
  }
  render();
  mountRoute();
  setInterval(() => {
    if (S.route === 'home') document.querySelectorAll('[data-ends]').forEach((el) => { el.textContent = clock((Number(el.dataset.ends) - Date.now()) / 1000); });
  }, 1000);
}
boot();
