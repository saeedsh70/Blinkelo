'use strict';
// Gaming mode: notices games, runs the one-click optimizer (and undoes it), keeps the in-game bar's numbers
// and remembers every play session. Native work (FPS via ETW, sensors, power plan, memory trim, closing apps)
// lives in native/Game.cs; this module decides what to do and when.
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const IS_WIN = process.platform === 'win32';
const gamelib = require('./gamelib');
const { writeJson } = require('./jsonfile');

// ------------------------------------------------------------------ what is (not) a game
const NON_GAMES = new Set([
  // shell, system, tools
  'explorer', 'searchapp', 'searchhost', 'startmenuexperiencehost', 'shellexperiencehost', 'applicationframehost', 'systemsettings',
  'taskmgr', 'mmc', 'cmd', 'powershell', 'pwsh', 'windowsterminal', 'conhost', 'notepad', 'notepad++', 'mspaint', 'snippingtool',
  'screenclippinghost', 'lockapp', 'logonui', 'dwm', 'rundll32', 'dllhost', 'msiexec', 'consent', 'textinputhost', 'phoneexperiencehost',
  'blinkelo', 'dynamic island', 'electron',
  // browsers
  'chrome', 'msedge', 'firefox', 'opera', 'opera_gx', 'brave', 'vivaldi', 'yandex', 'iexplore', 'arc', 'thorium', 'librewolf', 'waterfox',
  // media
  'vlc', 'potplayermini64', 'potplayermini', 'potplayer', 'mpc-hc64', 'mpc-hc', 'mpc-be64', 'mpc-be', 'kmplayer', 'kmplayer64x', 'gom',
  'mpv', 'smplayer', 'wmplayer', 'video.ui', 'microsoft.media.player', 'spotify', 'aimp', 'foobar2000', 'itunes', 'musicbee', 'stremio',
  // work / creative
  'code', 'devenv', 'rider64', 'idea64', 'pycharm64', 'studio64', 'winword', 'excel', 'powerpnt', 'outlook', 'onenote', 'acrord32',
  'acrobat', 'photoshop', 'illustrator', 'afterfx', 'premiere pro', 'adobe premiere pro', 'resolve', 'blender', 'obs64', 'obs32',
  'unity', 'unityhub', 'unrealeditor', 'ue4editor', 'godot', 'figma', 'notion', 'obsidian', 'slack', 'teams', 'ms-teams', 'zoom',
  'discord', 'telegram', 'whatsapp', 'skype', 'signal',
  // launchers / helpers
  'steam', 'steamwebhelper', 'epicgameslauncher', 'epicwebhelper', 'galaxyclient', 'galaxyclient helper', 'goggalaxy', 'upc', 'ubisoftconnect',
  'uplaywebcore', 'eadesktop', 'eabackgroundservice', 'origin', 'battle.net', 'agent', 'riotclientservices', 'riotclientux', 'riotclientuxrender',
  'xboxpcapp', 'xboxapp', 'gamebar', 'gamebarftserver', 'gamingservices', 'playnite.desktopapp', 'playnite.fullscreenapp', 'heroic',
  'rockstarservice', 'socialclubhelper', 'launcher', 'msiafterburner', 'rtss', 'hwinfo64', 'librehardwaremonitor', 'nvidia app',
  'nvcontainer', 'nvidia share', 'radeonsoftware', 'amdrsserv', 'vgtray', 'vgc', 'faceitclient',
]);
const NON_GAME_RE = /(launcher|crash|report|updater|update|setup|install|unins|helper|service|anticheat|redist|dxsetup|bootstrap|webview)/i;
const SHELL_CLASSES = new Set(['Progman', 'WorkerW', 'Shell_TrayWnd', 'Shell_SecondaryTrayWnd', 'Windows.UI.Core.CoreWindow', 'XamlExplorerHostIslandWindow', 'TopLevelWindowForOverflowXamlIsland', 'ConsoleWindowClass', 'CASCADIA_HOSTING_WINDOW_CLASS']);
const LIB_RE = /\\(steamapps\\common|epic games|gog galaxy\\games|gog games|xboxgames|riot games|ubisoft game launcher\\games|ea games|origin games|electronic arts|battle\.net\\games|rockstar games|amazon games\\library|itch\\apps|wargaming\.net|games)\\/i;

function exeName(p) {
  const base = String(p || '').trim().split(/[\\/]/).pop() || '';
  return base.replace(/\.exe$/i, '').toLowerCase();
}

function cleanList(list) {
  return [...new Set((Array.isArray(list) ? list : []).map((x) => exeName(String(x || '')).trim()).filter(Boolean))].slice(0, 200);
}

// fg: { pid, path, title, cls, fs, d3dfs }; fps: frames per second the foreground process presents (or -1/null)
function classify(fg, cfg = {}, fps = null, libDirs = []) {
  if (!fg || !fg.pid) return { game: false, why: 'none' };
  const name = exeName(fg.path);
  const games = cleanList(cfg.games);
  const ignore = cleanList(cfg.ignore);
  if (name && games.includes(name)) return { game: true, why: 'list', name };
  if (name && ignore.includes(name)) return { game: false, why: 'ignored', name };
  if (SHELL_CLASSES.has(fg.cls)) return { game: false, why: 'shell', name };
  if (name && (NON_GAMES.has(name) || NON_GAME_RE.test(name))) return { game: false, why: 'app', name };
  const p = String(fg.path || '');
  if (/^[a-z]:\\windows\\/i.test(p)) return { game: false, why: 'system', name };
  const presenting = Number(fps) || 0;
  const lp = p.toLowerCase();
  if (p && (LIB_RE.test(p) || libDirs.some((d) => lp.startsWith(d)))) return { game: true, why: 'library', name };
  if (fg.d3dfs) return { game: true, why: 'exclusive', name };
  if (fg.fs && presenting >= 25) return { game: true, why: 'frames', name };
  return { game: false, why: fg.fs ? 'maybe' : 'window', name, candidate: !!fg.fs };
}

// ------------------------------------------------------------------ numbers for the bar
function round(v, d = 0) { return Number.isFinite(v) ? Number(v.toFixed(d)) : null; }
function val(v) { return v === null || v === undefined || !Number.isFinite(Number(v)) || Number(v) < 0 ? null : Number(v); }

// raw: helper game.metrics; sys: main-process stats (cpu %, ram, nvidia-smi values); battery: helper battery
function mergeMetrics(raw = {}, sys = {}, battery = null) {
  const nv = sys && sys.gpu !== null && sys.gpu !== undefined;
  const m = {
    fps: val(raw.fps), low1: val(raw.low1), ft: val(raw.ft), fpsSrc: raw.src || '', api: raw.api || '',
    cpu: val(sys.cpu), ram: val(sys.ram), ramUsed: val(sys.ramUsed), ramTotal: val(sys.ramTotal),
    gpu: nv ? val(sys.gpu) : val(raw.gpu),
    gpuTemp: val(sys.gpuTemp) !== null && sys.gpuTemp > 0 ? val(sys.gpuTemp) : val(raw.gpuTemp),
    gpuTempSrc: val(sys.gpuTemp) !== null && sys.gpuTemp > 0 ? 'nvidia' : raw.gpuTempSrc || '',
    cpuTemp: val(raw.cpuTemp), cpuTempSrc: raw.cpuTempSrc || '',
    vram: val(sys.vramUsed) !== null ? val(sys.vramUsed) : val(raw.vram),
    vramTotal: val(sys.vramTotal) !== null ? val(sys.vramTotal) : val(raw.vramTotal),
    gpuPower: val(sys.gpuPower),
    ping: raw.ping === undefined || raw.ping === null ? null : Number(raw.ping) >= 0 ? Number(raw.ping) : -1,
    battery: battery && battery.has ? { percent: battery.percent, plugged: !!battery.plugged } : null,
    savg: val(raw.savg), slow1: val(raw.slow1),
  };
  for (const k of ['fps', 'low1', 'cpu', 'ram', 'gpu', 'gpuTemp', 'cpuTemp', 'savg', 'slow1']) m[k] = round(m[k], 0);
  if (m.ft !== null) m.ft = round(m.ft, 1);
  return m;
}

// ------------------------------------------------------------------ RivaTuner OSD text (exclusive fullscreen)
// RTSS hypertext: <C=RRGGBB>text<C>. Digits are always Latin.
const OSD_COL = { dim: '8E99A8', val: 'FFFFFF', good: '34D399', warn: 'FBBF24', bad: 'FB7185', sep: '4B5563', acc: '60A5FA' };
function osdText(m = {}, cfg = {}) {
  const want = (cfg.hud && Array.isArray(cfg.hud.metrics)) ? cfg.hud.metrics : [];
  const on = (k) => want.includes(k);
  const has = (v) => v !== null && v !== undefined && Number.isFinite(Number(v));
  const c = (col, s) => `<C=${OSD_COL[col] || col}>${s}<C>`;
  const lab = (s) => c('dim', s);
  const v = (x, col = 'val') => (has(x) || typeof x === 'string' ? c(col, x) : c('dim', '-'));
  const tcol = (t, w, b) => (!has(t) ? 'val' : t >= b ? 'bad' : t >= w ? 'warn' : 'val');
  const fcol = (f) => (!has(f) ? 'val' : f < 30 ? 'bad' : f < 55 ? 'warn' : 'good');
  const temp = (t) => (has(t) ? `${Math.round(cfg.temp === 'f' ? t * 9 / 5 + 32 : t)}${cfg.temp === 'f' ? '°F' : '°'}` : null);
  const gb = (b) => { const g = b / 1073741824; return Math.abs(g - Math.round(g)) < 0.05 ? String(Math.round(g)) : g.toFixed(g >= 10 ? 0 : 1); };
  const segs = [];
  const done = new Set();
  for (const k of want) {
    if (k === 'fps') segs.push(`${lab('FPS')} ${m.fpsSrc ? v(m.fps, fcol(m.fps)) : v(null)}`);
    else if (k === 'low1' && m.fpsSrc) segs.push(`${lab('1%')} ${v(m.low1, fcol(m.low1))}`);
    else if (k === 'ft' && m.fpsSrc && has(m.ft)) segs.push(`${lab('FT')} ${v(m.ft.toFixed(1))}${lab('ms')}`);
    else if ((k === 'cpu' || k === 'cpuTemp') && !done.has('cpu')) {
      done.add('cpu');
      const parts = [];
      if (on('cpu')) parts.push(`${v(has(m.cpu) ? `${m.cpu}%` : null)}`);
      if (on('cpuTemp')) parts.push(v(temp(m.cpuTemp), tcol(m.cpuTemp, 80, 90)));
      segs.push(`${lab('CPU')} ${parts.join(' ')}`);
    } else if ((k === 'gpu' || k === 'gpuTemp' || k === 'power') && !done.has('gpu')) {
      done.add('gpu');
      const parts = [];
      if (on('gpu')) parts.push(v(has(m.gpu) ? `${m.gpu}%` : null));
      if (on('gpuTemp')) parts.push(v(temp(m.gpuTemp), tcol(m.gpuTemp, 78, 86)));
      if (on('power') && has(m.gpuPower)) parts.push(v(`${Math.round(m.gpuPower)}W`));
      segs.push(`${lab('GPU')} ${parts.join(' ')}`);
    } else if (k === 'vram') segs.push(`${lab('VRAM')} ${has(m.vram) ? v(`${gb(m.vram)}${has(m.vramTotal) && m.vramTotal > 0 ? `/${gb(m.vramTotal)}` : ''}G`) : v(null)}`);
    else if (k === 'ram') segs.push(`${lab('RAM')} ${v(has(m.ram) ? `${m.ram}%` : null, m.ram >= 95 ? 'bad' : m.ram >= 88 ? 'warn' : 'val')}`);
    else if (k === 'ping' && m.ping !== undefined && m.ping !== null) segs.push(`${lab('PING')} ${m.ping < 0 ? c('bad', 'x') : v(`${m.ping}ms`, m.ping >= 120 ? 'bad' : m.ping >= 70 ? 'warn' : 'val')}`);
    else if (k === 'clock') { const d = new Date(); segs.push(v(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)); }
    else if (k === 'time' && m.session && m.session.start) {
      const sec = Math.max(0, Math.floor((Date.now() - m.session.start) / 1000));
      const h = Math.floor(sec / 3600); const mm = Math.floor((sec % 3600) / 60);
      segs.push(`${lab('PLAY')} ${v(h ? `${h}:${String(mm).padStart(2, '0')}` : `${mm}m`)}`);
    } else if (k === 'battery' && m.battery && !m.battery.plugged) segs.push(`${lab('BAT')} ${v(`${m.battery.percent}%`, m.battery.percent <= 15 ? 'bad' : m.battery.percent <= 30 ? 'warn' : 'val')}`);
  }
  return segs.join(c('sep', '  |  ')).slice(0, 4000);
}

const RTSS_DEFAULT = ['C:\\Program Files (x86)\\RivaTuner Statistics Server\\RTSS.exe', 'C:\\Program Files\\RivaTuner Statistics Server\\RTSS.exe'];

// ------------------------------------------------------------------ session bookkeeping
function newSession(game, now = Date.now()) {
  return {
    id: `g${now.toString(36)}`, name: game.name, title: game.title || '', path: game.path || '', pid: game.pid, start: now,
    n: 0, fpsSum: 0, fpsN: 0, cpuSum: 0, gpuSum: 0, gpuN: 0, maxCpuTemp: null, maxGpuTemp: null, maxRam: null, savg: null, slow1: null,
  };
}

function accumulate(s, m) {
  if (!s || !m) return s;
  s.n += 1;
  if (m.fps !== null && m.fps > 0) { s.fpsSum += m.fps; s.fpsN += 1; }
  if (m.cpu !== null) s.cpuSum += m.cpu;
  if (m.gpu !== null) { s.gpuSum += m.gpu; s.gpuN += 1; }
  if (m.cpuTemp !== null) s.maxCpuTemp = Math.max(s.maxCpuTemp || 0, m.cpuTemp);
  if (m.gpuTemp !== null) s.maxGpuTemp = Math.max(s.maxGpuTemp || 0, m.gpuTemp);
  if (m.ram !== null) s.maxRam = Math.max(s.maxRam || 0, m.ram);
  if (m.savg !== null) s.savg = m.savg;
  if (m.slow1 !== null) s.slow1 = m.slow1;
  return s;
}

function summarize(s, now = Date.now()) {
  return {
    id: s.id, name: s.name, title: s.title, path: s.path || '', start: s.start, end: now, dur: Math.max(0, Math.round((now - s.start) / 1000)),
    avgFps: s.savg !== null ? s.savg : s.fpsN ? Math.round(s.fpsSum / s.fpsN) : null,
    low1: s.slow1,
    avgCpu: s.n ? Math.round(s.cpuSum / s.n) : null,
    avgGpu: s.gpuN ? Math.round(s.gpuSum / s.gpuN) : null,
    maxCpuTemp: s.maxCpuTemp, maxGpuTemp: s.maxGpuTemp, maxRam: s.maxRam,
  };
}

// ------------------------------------------------------------------ registry (HKCU only, through reg.exe)
function regRead(exec, key, name) {
  return new Promise((resolve) => {
    exec('reg.exe', ['query', key, '/v', name], (err, out) => {
      if (err || !out) { resolve(null); return; }
      const m = String(out).match(/REG_DWORD\s+0x([0-9a-f]+)/i);
      resolve(m ? parseInt(m[1], 16) : null);
    });
  });
}
function regWrite(exec, key, name, value) {
  return new Promise((resolve) => {
    const args = value === null ? ['delete', key, '/v', name, '/f'] : ['add', key, '/v', name, '/t', 'REG_DWORD', '/d', String(value), '/f'];
    exec('reg.exe', args, (err) => resolve(!err));
  });
}
const GAMEMODE = ['HKCU\\Software\\Microsoft\\GameBar', 'AutoGameModeEnabled'];
const DVR = [['HKCU\\System\\GameConfigStore', 'GameDVR_Enabled'], ['HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR', 'AppCaptureEnabled']];

const PRIORITY = { normal: 0, above: -7, high: -14 }; // os.setPriority values (PRIORITY_ABOVE_NORMAL / PRIORITY_HIGH)

// ------------------------------------------------------------------ manager
class Gaming extends EventEmitter {
  constructor({ helper, dir, log, sysStats, ownPids, execFile, setPriority, getPriority, openPath, openShell, launch, platform, awayMs } = {}) {
    super();
    this.helper = helper;
    this.dir = dir;
    this.log = log || (() => {});
    this.sysStats = sysStats || (() => Promise.resolve({}));
    this.ownPids = ownPids || (() => [process.pid]);
    this.exec = execFile || require('child_process').execFile;
    this.setPriority = setPriority || ((pid, p) => require('os').setPriority(pid, p));
    this.getPriority = getPriority || ((pid) => require('os').getPriority(pid));
    this.openPath = openPath || (() => {});
    this.openShell = openShell || this.openPath;   // ShellExecute (UAC-aware) for RivaTuner
    this.launcher = launch || (() => Promise.resolve(false));
    this.library = [];
    this.libDirs = [];
    this.libAt = 0;
    this.libBusy = null;
    this.libVer = 0;
    this.rtssExe = '';
    this.osdOn = false;            // our text is being sent to RivaTuner
    this.osdOk = null;            // RivaTuner accepted it (null = not known yet)
    this.windowHud = false;       // the window bar is shown
    this.launching = null;
    this.win = (platform || process.platform) === 'win32';
    this.cfg = null;
    this.manual = false;          // the user switched gaming mode on
    this.session = null;          // the running game
    this.fg = null;               // foreground window from the helper
    this.fgGame = false;          // the session's game is in front
    this.candidate = null;        // a fullscreen app that may be a game ({ name, title })
    this.streak = { key: '', n: 0 };
    this.raw = {};
    this.metrics = null;
    this.battery = null;
    this.etw = 'off';
    this.access = null;
    this.panelOpen = false;
    this.probe = false;           // the settings page wants live sensor info
    this.userHud = null;          // null = automatic, true = forced on, false = hidden by the user
    this.hudVisible = false;
    this.quiet = false;
    this.opt = { running: false, steps: [], at: 0, freed: 0, closed: 0, mode: '' };
    this.restoreInfo = this.readJson('gaming-restore.json', null);
    this.sessions = this.readJson('gaming-sessions.json', []);
    if (!Array.isArray(this.sessions)) this.sessions = [];
    this.pending = new Map();
    this.seq = 0;
    this.sent = {};
    this.metricsBusy = false;
    this.stateTimer = null;
    // the game must be out of the foreground this long before the bar / quiet mode follow (a fullscreen game can
    // lose the foreground for a split second, which made the bar flicker)
    this.awayMs = Number.isFinite(awayMs) ? awayMs : 1500;
    this.awayTimer = null;
    this.fgLogN = 0;
  }

  // ---------------------------------------------------------------- persistence
  readJson(name, fallback) {
    try { return JSON.parse(fs.readFileSync(path.join(this.dir, name), 'utf8')); } catch (_) { return fallback; }
  }

  writeJson(name, value) {
    try {
      const f = path.join(this.dir, name);
      if (value === null) { fs.rmSync(f, { force: true }); return; }
      writeJson(f, value, { space: 1 }); // atomic: the optimizer's undo list must survive a crash
    } catch (e) { this.log('gaming save failed', e.message); }
  }

  // ---------------------------------------------------------------- configuration / helper control
  configure(cfg) {
    const prev = this.cfg;
    this.cfg = JSON.parse(JSON.stringify(cfg || {}));
    if (!this.cfg.enabled) {
      if (this.session) this.endSession('disabled');
      this.manual = false;
      this.userHud = null;
    }
    if (prev && prev.enabled && !this.cfg.enabled && this.restoreInfo) this.restore().catch(() => {});
    this.sync();
    this.update();
  }

  get active() { return !!(this.cfg && this.cfg.enabled && (this.manual || this.session)); }

  wants() {
    const c = this.cfg || {};
    const on = !!c.enabled;
    const watch = on && (c.auto || this.manual || this.userHud === true || this.panelOpen || this.probe || !!this.session);
    const metrics = watch && (this.active || this.userHud === true || this.panelOpen || this.probe);
    const hudMetrics = (c.hud && Array.isArray(c.hud.metrics)) ? c.hud.metrics : [];
    const ping = metrics && (hudMetrics.includes('ping') || this.panelOpen) ? String(c.pingHost || '').trim() : '';
    return { watch, metrics, fps: watch && c.fps !== false, ping };
  }

  // tell the helper what to run; only sends what changed
  sync(force = false) {
    if (!this.helper) return;
    const w = this.wants();
    const send = (cmd, v) => {
      const s = String(v);
      if (!force && this.sent[cmd] === s) return;
      this.sent[cmd] = s;
      this.helper.send(cmd, s);
    };
    send('game.watch', w.watch ? '1' : '0');
    send('game.fps', w.fps ? '1' : '0');
    send('game.metrics', w.metrics ? '1' : '0');
    send('game.ping', w.ping);
    send('game.track', this.session ? this.session.pid : 0);
    if (!w.watch) { this.metrics = null; this.fg = null; this.fgGame = false; }
  }

  onHelperReady() {
    this.sent = {};
    this.sync(true);
    if (this.helper) this.helper.send('game.access');
    if (this.cfg && this.cfg.enabled) setTimeout(() => this.refreshLibrary().catch(() => {}), 4000);
    // the app stopped in the middle of a game last time: put the power plan etc. back
    if (this.restoreInfo && !this.session && !this.opt.running && !this.restoredAtStart) {
      this.restoredAtStart = true;
      this.restore({ reopen: false }).catch(() => {});
    }
  }

  // ---------------------------------------------------------------- helper messages
  onHelper(msg) {
    switch (msg.type) {
      case 'game.fg': this.onForeground(msg); break;
      case 'game.metrics': this.onMetrics(msg); break;
      case 'game.exit': if (this.session && Number(msg.pid) === this.session.pid) this.endSession('exit'); break;
      case 'game.etw': this.etw = msg.state || 'off'; this.update(); break;
      case 'game.access': this.access = { admin: !!msg.admin, perfLog: !!msg.perfLog, x64: msg.x64 !== false }; this.etw = msg.etw || this.etw; this.update(); break;
      case 'game.osd': this.osdOk = !!msg.ok; this.update(); break;
      case 'game.result': case 'game.procs': case 'game.lib': {
        const p = this.pending.get(msg.id);
        if (p) { this.pending.delete(msg.id); clearTimeout(p.timer); p.resolve(msg); }
        break;
      }
      case 'game.unavailable': this.etw = 'unavailable'; this.update(); break;
      case 'battery': this.battery = msg; break;
      default: break;
    }
  }

  request(cmd, ...args) {
    if (!this.helper) return Promise.resolve(null);
    const id = `r${++this.seq}`;
    return new Promise((resolve) => {
      const timer = setTimeout(() => { this.pending.delete(id); resolve(null); }, 20000);
      this.pending.set(id, { resolve, timer });
      if (!this.helper.send(cmd, id, ...args)) { clearTimeout(timer); this.pending.delete(id); resolve(null); }
    });
  }

  onForeground(msg) {
    this.fg = { pid: Number(msg.pid) || 0, path: msg.path || '', title: msg.title || '', cls: msg.cls || '', fs: !!msg.fs, d3dfs: !!msg.d3dfs, xfs: !!msg.xfs };
    const s = this.session;
    if (s && this.fg.pid === s.pid) s.disp = { d3dfs: this.fg.d3dfs, xfs: this.fg.xfs };
    if (s && this.fgLogN < 40) {
      this.fgLogN += 1;
      this.log('game fg', this.fg.pid === s.pid ? 'game' : 'other', this.fg.pid, exeName(this.fg.path) || '-', `cls=${this.fg.cls || '-'}`, this.fgFlags());
    }
    this.evaluate(null);
    this.update(); // fullscreen switches the bar to RivaTuner
  }

  // decide whether the foreground app is a game (needs to hold for two ticks so splash screens don't count)
  evaluate(fgFps) {
    const c = this.cfg || {};
    const fg = this.fg;
    if (this.session) {
      const front = !!fg && fg.pid === this.session.pid;
      if (front) {
        this.clearAway();
        if (!this.fgGame) { this.fgGame = true; this.update(); }
        return;
      }
      if (this.fgGame) {
        if (this.awayMs > 0) {
          if (!this.awayTimer) {
            this.awayTimer = setTimeout(() => {
              this.awayTimer = null;
              if (!this.session || (this.fg && this.fg.pid === this.session.pid)) return;
              this.fgGame = false;
              this.update();
              this.evaluate(null);
            }, this.awayMs);
          }
          return;
        }
        this.fgGame = false;
        this.update();
      }
      if (!fg) return;
    }
    if (!c.enabled || !fg) return;
    const r = classify(fg, c, fgFps, this.libDirs);
    const key = `${fg.pid}:${r.game}`;
    this.streak = this.streak.key === key ? { key, n: this.streak.n + 1 } : { key, n: 1 };
    if (!r.game) {
      // a fullscreen app that might be a game: the island offers "treat as a game"
      const cand = r.candidate && r.name ? { name: r.name, title: fg.title } : (this.candidate && !fg.fs ? this.candidate : null);
      if (JSON.stringify(cand) !== JSON.stringify(this.candidate)) { this.candidate = cand; this.update(); }
      return;
    }
    if (this.session && this.session.pid === fg.pid) return;
    const need = r.why === 'frames' ? 3 : r.why === 'list' ? 1 : 2;
    if (this.streak.n < need) return;
    if (!(c.auto || this.manual)) { this.candidate = { name: r.name || '', title: fg.title, game: true }; this.update(); return; }
    this.startSession({ pid: fg.pid, name: r.name || fg.title || 'game', title: fg.title, path: fg.path, why: r.why });
  }

  async onMetrics(msg) {
    const rtssWas = !!(this.raw && this.raw.rtss);
    this.raw = msg;
    if (!!msg.rtss !== rtssWas) { this.log('rivatuner', msg.rtss ? 'running' : 'not running'); this.update(); }
    if (msg.etw) this.etw = msg.etw;
    const fgFps = Number(msg.pid) === Number(msg.fg) ? msg.fps : null;
    this.evaluate(fgFps);
    if (this.metricsBusy) return;
    this.metricsBusy = true;
    let sys = {};
    try { sys = (this.wants().metrics ? await this.sysStats() : {}) || {}; } catch (_) { sys = {}; }
    this.metricsBusy = false;
    this.metrics = mergeMetrics(msg, sys, this.battery);
    if (this.session && this.fgGame) accumulate(this.session, this.metrics);
    if (this.osdOn && this.helper) this.helper.send('game.osd', osdText(this.publicMetrics(), this.cfg || {}) || ' ');
    this.emit('metrics', this.publicMetrics());
    if (this.panelOpen || this.probe) this.emitState();
  }

  publicMetrics() {
    return { ...(this.metrics || {}), session: this.session ? { name: this.session.name, start: this.session.start } : null };
  }

  // ---------------------------------------------------------------- sessions
  startSession(game) {
    if (this.session) this.endSession('switch');
    this.session = newSession(game);
    this.session.disp = { d3dfs: !!(this.fg && this.fg.d3dfs), xfs: !!(this.fg && this.fg.xfs) };
    this.fgLogN = 0;
    this.clearAway();
    this.fgGame = true;
    this.candidate = null;
    this.userHud = null;
    this.log('game started', game.name, game.why, this.fgFlags());
    this.sync();
    this.emit('session', { start: true, name: game.name });
    if (this.restoreInfo && this.restoreInfo.priorityPending) this.applyPriority().catch(() => {});
    else if (this.cfg.autoOptimize && !this.opt.running) this.optimize().catch(() => {});
    this.update();
  }

  endSession(why) {
    const s = this.session;
    if (!s) return;
    this.session = null;
    this.clearAway();
    this.fgGame = false;
    this.userHud = null;
    const rec = summarize(s);
    this.log('game ended', s.name, why, `${rec.dur}s`);
    if (rec.dur >= 60) {
      this.sessions.unshift(rec);
      this.sessions = this.sessions.slice(0, 30);
      this.writeJson('gaming-sessions.json', this.sessions);
      if (why === 'exit') this.emit('summary', rec);
      if (rec.path && !this.library.some((g) => g.exe && g.exe.toLowerCase() === rec.path.toLowerCase())) setTimeout(() => this.refreshLibrary(true).catch(() => {}), 1500);
    }
    this.sync();
    if (why === 'exit' && this.cfg && this.cfg.restoreOnExit && this.restoreInfo) {
      this.restore().catch(() => {});
      this.manual = false;
    }
    this.update();
  }

  // ---------------------------------------------------------------- optimizer
  setStep(key, status, detail = '') {
    const st = this.opt.steps.find((x) => x.key === key);
    if (st) { st.status = status; st.detail = detail; }
    this.emitState();
  }

  saveRestore() { this.writeJson('gaming-restore.json', this.restoreInfo); }

  async applyPriority() {
    const lvl = (this.cfg.optimize || {}).priority;
    if (!this.session || !lvl || lvl === 'normal' || !(lvl in PRIORITY)) return 'skip';
    const pid = this.session.pid;
    let prev = 0;
    try { prev = this.getPriority(pid); } catch (_) { /* ignore */ }
    try {
      this.setPriority(pid, PRIORITY[lvl]);
      if (this.restoreInfo) { this.restoreInfo.priority = { pid, prev }; this.restoreInfo.priorityPending = false; this.saveRestore(); }
      return 'ok';
    } catch (e) {
      this.log('priority failed', e.message);
      return 'fail';
    }
  }

  async optimize() {
    if (this.opt.running || !this.cfg || !this.cfg.enabled) return this.opt;
    const o = this.cfg.optimize || {};
    const steps = [];
    if (o.power) steps.push('power');
    if (o.gameMode) steps.push('gameMode');
    if (o.closeApps && cleanList(this.cfg.closeList).length) steps.push('close');
    if (o.memory) steps.push('memory');
    if (o.priority && o.priority !== 'normal') steps.push('priority');
    if (o.dvr) steps.push('dvr');
    // RivaTuner is only started when the user chose the in-game text; "auto" never depends on it
    if (this.osdEngine() === 'rtss') steps.push('rtss');
    this.opt = { running: true, steps: steps.map((key) => ({ key, status: 'wait', detail: '' })), at: Date.now(), freed: 0, closed: 0, mode: '' };
    this.manual = true;
    this.sync();
    const info = this.restoreInfo || { at: Date.now() };
    this.restoreInfo = info;
    this.emitState();
    for (const key of steps) {
      this.setStep(key, 'run');
      try {
        if (!this.win) { this.setStep(key, 'skip', 'windows'); continue; }
        if (key === 'power') {
          const r = await this.request('game.power', 'perf');
          if (r && r.ok) {
            if (r.mode !== 'already' && !info.power) info.power = { scheme: r.prevScheme || '', overlay: r.prevOverlay || '' };
            this.opt.mode = r.mode;
            this.setStep(key, r.mode === 'already' ? 'skip' : 'ok', r.mode);
          } else this.setStep(key, 'fail');
        } else if (key === 'gameMode') {
          const v = await regRead(this.exec, ...GAMEMODE);
          if (v === 0) {
            const ok = await regWrite(this.exec, ...GAMEMODE, 1);
            if (ok && info.gameMode === undefined) info.gameMode = 0;
            this.setStep(key, ok ? 'ok' : 'fail');
          } else this.setStep(key, 'skip', 'already');
        } else if (key === 'close') {
          const names = cleanList(this.cfg.closeList);
          const list = await this.request('game.procs');
          const own = new Set(this.ownPids());
          const hits = ((list && list.list) || []).filter((p) => names.includes(String(p.name || '').toLowerCase()) && !own.has(p.pid) && (!this.session || p.pid !== this.session.pid));
          if (!hits.length) { this.setStep(key, 'skip', 'none'); continue; }
          const r = await this.request('game.close', hits.map((p) => p.pid).join(','), this.cfg.forceClose ? '1' : '0');
          const closed = new Set(((r && r.closed) || []).map(Number));
          const done = hits.filter((p) => closed.has(p.pid));
          // remember one entry per executable so the apps can be started again afterwards
          const seen = new Set((info.closed || []).map((x) => x.path.toLowerCase()));
          info.closed = (info.closed || []).concat(done.filter((p) => p.path && !seen.has(p.path.toLowerCase()) && seen.add(p.path.toLowerCase())).map((p) => ({ name: p.name, path: p.path })));
          this.opt.closed = new Set(done.map((p) => p.name.toLowerCase())).size;
          this.setStep(key, done.length ? 'ok' : 'fail', String(this.opt.closed));
        } else if (key === 'memory') {
          const ex = [...this.ownPids(), this.session ? this.session.pid : 0].filter(Boolean).join(',');
          const r = await this.request('game.trim', ex);
          this.opt.freed = r ? Number(r.freed) || 0 : 0;
          this.setStep(key, r && r.ok ? 'ok' : 'fail', String(this.opt.freed));
        } else if (key === 'priority') {
          if (this.session) this.setStep(key, await this.applyPriority());
          else { info.priorityPending = true; this.setStep(key, 'later'); }
        } else if (key === 'rtss') {
          // RivaTuner draws the bar inside exclusive-fullscreen games
          if (this.raw && this.raw.rtss) this.setStep(key, 'skip', 'already');
          else if (!this.rtssExe) this.setStep(key, 'skip', 'missing');
          else { this.openShell(this.rtssExe); this.setStep(key, 'ok', 'started'); }
        } else if (key === 'dvr') {
          const prev = await Promise.all(DVR.map(([k, n]) => regRead(this.exec, k, n)));
          if (prev.every((v) => v === 0)) { this.setStep(key, 'skip', 'already'); continue; }
          const ok = (await Promise.all(DVR.map(([k, n]) => regWrite(this.exec, k, n, 0)))).every(Boolean);
          if (ok && !info.dvr) info.dvr = prev;
          this.setStep(key, ok ? 'ok' : 'fail');
        }
      } catch (e) {
        this.log('optimize step failed', key, e.message);
        this.setStep(key, 'fail');
      }
      this.saveRestore();
    }
    this.opt.running = false;
    this.opt.at = Date.now();
    this.saveRestore();
    this.update();
    return this.opt;
  }

  async restore({ reopen = true } = {}) {
    const info = this.restoreInfo;
    if (!info) return false;
    // The file is only removed once the undo has really finished: if the app is closed half-way (quit, crash),
    // the next start finds it and restores again (restoring twice is harmless).
    this.restoreInfo = null;
    const tasks = [];
    if (this.win && info.power) tasks.push(this.request('game.power', 'restore', `${info.power.scheme}|${info.power.overlay}`));
    if (this.win && info.gameMode !== undefined) tasks.push(regWrite(this.exec, ...GAMEMODE, info.gameMode));
    if (this.win && Array.isArray(info.dvr)) DVR.forEach(([k, n], i) => tasks.push(regWrite(this.exec, k, n, info.dvr[i] === null ? null : info.dvr[i])));
    if (info.priority && this.session && this.session.pid === info.priority.pid) {
      try { this.setPriority(info.priority.pid, info.priority.prev || 0); } catch (_) { /* ignore */ }
    }
    await Promise.all(tasks);
    this.saveRestore();
    if (reopen && this.cfg && this.cfg.reopen && Array.isArray(info.closed)) {
      for (const app of info.closed.slice(0, 20)) {
        try { this.openPath(app.path); } catch (_) { /* ignore */ }
      }
    }
    this.opt = { running: false, steps: [], at: 0, freed: 0, closed: 0, mode: '' };
    this.log('gaming optimizations restored');
    this.update();
    return true;
  }

  // ---------------------------------------------------------------- commands from the UI
  async command(name, a = {}) {
    switch (name) {
      case 'state': return this.publicState();
      case 'toggle': {
        const on = typeof a.on === 'boolean' ? a.on : !this.manual;
        this.manual = on;
        if (!on) {
          this.userHud = null;
          if (this.restoreInfo && !this.session) await this.restore();
        }
        this.sync();
        this.update();
        return this.publicState();
      }
      case 'optimize': await this.optimize(); return this.publicState();
      case 'restore': await this.restore(); return this.publicState();
      case 'hud': this.toggleHud(); return this.publicState();
      case 'panel': this.panelOpen = !!a.open; this.sync(); this.emitState(); return this.publicState();
      case 'probe': this.probe = !!a.on; this.sync(); if (this.probe && this.helper) this.helper.send('game.access'); return this.publicState();
      case 'markGame': case 'ignoreGame': {
        const n = exeName(String(a.name || ''));
        if (!n) return null;
        return { list: name === 'markGame' ? 'games' : 'ignore', name: n };
      }
      case 'end': if (this.session) this.endSession('user'); return this.publicState();
      case 'library': await this.refreshLibrary(!!a.refresh); return this.publicLibrary();
      case 'launch': return this.launch(String(a.id || ''));
      case 'procs': { const r = await this.request('game.procs'); return r ? r.list || [] : []; }
      case 'access': if (this.helper) this.helper.send('game.access'); return this.access;
      case 'allowFps': return this.allowFps();
      case 'clearSessions': this.sessions = []; this.writeJson('gaming-sessions.json', []); this.update(); return true;
      default: return null;
    }
  }

  // the hotkey / button flips what is shown now; matching the automatic choice again hands control back to it
  toggleHud() {
    const want = !this.hudVisible;
    this.userHud = want === this.autoHud() ? null : want;
    this.sync();
    this.update();
  }

  autoHud() {
    const c = this.cfg || {};
    const hud = c.hud || {};
    return !!(c.enabled && hud.enabled && ((this.session && this.fgGame) || (hud.show === 'always' && this.active)));
  }

  // Adds this Windows user to "Performance Log Users" (needs one UAC prompt; takes effect after signing in again).
  allowFps() {
    if (!this.win) return Promise.resolve({ ok: false, error: 'windows' });
    const os = require('os');
    const user = `${process.env.USERDOMAIN || os.hostname()}\\${os.userInfo().username}`.replace(/'/g, "''");
    const inner = `$ErrorActionPreference='Stop'
try { Add-LocalGroupMember -SID 'S-1-5-32-559' -Member '${user}'; exit 0 }
catch [Microsoft.PowerShell.Commands.MemberExistsException] { exit 0 }
catch {
  $g = (New-Object System.Security.Principal.SecurityIdentifier 'S-1-5-32-559').Translate([System.Security.Principal.NTAccount]).Value.Split('\\')[-1]
  & net.exe localgroup "$g" '${user}' /add
  if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 2) { exit 0 } else { exit 5 }
}`;
    const b64 = Buffer.from(inner, 'utf16le').toString('base64');
    const outer = `try { $p = Start-Process -FilePath powershell.exe -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ArgumentList '-NoProfile','-NonInteractive','-EncodedCommand','${b64}'; exit $p.ExitCode } catch { exit 1223 }`;
    return new Promise((resolve) => {
      this.exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', outer], { windowsHide: true, timeout: 120000 }, (err) => {
        const code = err ? (typeof err.code === 'number' ? err.code : 1) : 0;
        resolve(code === 0 ? { ok: true, signOut: true } : { ok: false, error: code === 1223 ? 'cancelled' : 'failed' });
      });
    });
  }

  osdEngine() {
    const e = ((this.cfg || {}).hud || {}).engine;
    return e === 'window' || e === 'rtss' ? e : 'auto';
  }

  // ---------------------------------------------------------------- game library
  async refreshLibrary(force = false) {
    if (this.libBusy) return this.libBusy;
    if (!force && Date.now() - this.libAt < 10 * 60000 && this.libAt) return this.library;
    this.libBusy = (async () => {
      const reg = this.win ? await this.request('game.lib') : null;
      if (reg && reg.rtss) this.rtssExe = require('path').join(reg.rtss, 'RTSS.exe');
      if (reg && !this.rtssExe) {
        const u = (reg.uninstall || []).find((x) => String(x.key).toLowerCase() === 'rtss');
        if (u && u.loc) this.rtssExe = require('path').join(u.loc, 'RTSS.exe');
      }
      if (this.win && (!this.rtssExe || !fs.existsSync(this.rtssExe))) this.rtssExe = RTSS_DEFAULT.find((f) => fs.existsSync(f)) || '';
      const c = this.cfg || {};
      let list = [];
      try { list = await gamelib.scan({ reg, sessions: this.sessions, custom: c.library || [] }); } catch (e) { this.log('library scan failed', e.message); }
      this.library = list;
      this.libDirs = list.filter((g) => g.source !== 'custom' && g.source !== 'played' && g.dir).map((g) => g.dir.toLowerCase() + require('path').sep);
      this.libAt = Date.now();
      this.libVer += 1;
      this.log('game library', list.length, 'games');
      this.emit('library', this.libVer);
      this.emitState();
      return list;
    })().finally(() => { this.libBusy = null; });
    return this.libBusy;
  }

  publicLibrary() {
    const hidden = new Set(((this.cfg || {}).hidden || []).map(String));
    return this.library.map((g) => ({ id: g.id, name: g.name, source: g.source, played: g.played || 0, hidden: hidden.has(g.id), icon: g.icon, cover: g.cover }));
  }

  async launch(id) {
    const g = this.library.find((x) => x.id === id);
    if (!g || !this.cfg || !this.cfg.enabled) return { ok: false };
    this.launching = { id, at: Date.now() };
    this.manual = true;
    this.sync();
    this.update();
    if (this.cfg.optimizeOnLaunch !== false && !this.restoreInfo && !this.opt.running) await this.optimize();
    const ok = await this.tryLaunch(g, [g.launch, g.fallback].filter(Boolean), 0);
    setTimeout(() => { if (this.launching && this.launching.id === id) { this.launching = null; this.emitState(); } }, 12000);
    this.emitState();
    return { ok, name: g.name };
  }

  // Starts plan[i]; when that cannot be started, or its process ends almost at once without the game coming up,
  // the next entry is tried. The launcher answers true/false or { ok, pid, exited } where `exited` resolves to
  // { code, ms } if the process ended within the first seconds (null when it kept running).
  async tryLaunch(g, plan, i) {
    const l = plan[i];
    if (!l) return false;
    let r = false;
    try { r = await this.launcher(l); } catch (e) { this.log('launch failed', g.name, e.message); }
    const ok = r === true || !!(r && r.ok);
    this.log('launch', g.name, l.kind, ok ? 'ok' : 'failed', `[${l.why || g.source}]`, `${l.target}${l.args ? ` ${l.args}` : ''}`,
      l.cwd ? `cwd=${l.cwd}` : '', r && r.pid ? `pid=${r.pid}` : '');
    if (!ok) return this.tryLaunch(g, plan, i + 1);
    if (r && r.exited && typeof r.exited.then === 'function') {
      r.exited.then((ex) => {
        if (!ex) return;
        const up = !!this.session || this.inGameDir(g, this.fg && this.fg.path);
        this.log('launch: process ended', g.name, `after ${ex.ms} ms, code ${ex.code}`, up ? '(the game is running)' : '');
        if (up || !this.launching || this.launching.id !== g.id) return;
        let next = plan.slice(i + 1);
        // nothing else to try and it reported an error: once more through the Windows shell, like a double-click
        if (!next.length && ex.code !== 0 && l.kind === 'exe') next = [{ kind: 'open', target: l.target, why: 'shell' }];
        if (next.length) this.tryLaunch(g, next, 0).catch(() => {});
      }).catch(() => {});
    }
    return true;
  }

  clearAway() {
    if (this.awayTimer) { clearTimeout(this.awayTimer); this.awayTimer = null; }
  }

  fgFlags() {
    const f = this.fg || {};
    return `fs=${f.fs ? 1 : 0} d3dfs=${f.d3dfs ? 1 : 0} exclusive=${f.xfs ? 1 : 0}`;
  }

  inGameDir(g, p) {
    const dir = g && g.dir ? String(g.dir).toLowerCase() : '';
    return !!dir && String(p || '').toLowerCase().startsWith(dir + require('path').sep);
  }

  // ---------------------------------------------------------------- derived state
  update() {
    const c = this.cfg || {};
    const auto = this.autoHud();
    const visible = !!c.enabled && (this.userHud === true || (this.userHud !== false && auto));
    if (visible !== this.hudVisible) this.hudVisible = visible;
    // The island's own bar is the default. A game in real "Full Screen" (Windows reports Direct3D full screen, d3dfs)
    // may own the display so that no window can be seen over it, and that can't be told reliably from outside the
    // game. So in "auto": d3dfs + RivaTuner running -> RivaTuner draws the text inside the game; exclusive ownership
    // detected (xfs) -> RivaTuner is tried even when it is not known to run; otherwise the window bar.
    // "window" always uses the window bar, "rtss" always RivaTuner. Borderless games always get the window bar.
    const eng = this.osdEngine();
    const disp = this.session && this.fgGame ? this.session.disp || {} : {};
    const rtssUp = !!(this.raw && this.raw.rtss);
    const osd = visible && eng !== 'window' && (eng === 'rtss' || !!disp.xfs || (!!disp.d3dfs && rtssUp));
    if (osd !== this.osdOn) {
      this.osdOn = osd;
      this.osdOk = null;
      if (this.helper) this.helper.send('game.osd', osd ? osdText(this.publicMetrics(), c) || ' ' : '');
    }
    const win = visible && !(osd && this.osdOk !== false);
    if (win !== this.windowHud) { this.windowHud = win; this.emit('hud', win); }
    const mode = !visible ? 'off' : win ? 'window' : 'rivatuner';
    if (mode !== this.barMode) { this.barMode = mode; this.log('game bar', mode, this.fgFlags()); }
    const quiet = !!(c.enabled && c.quiet && this.session && this.fgGame);
    if (quiet !== this.quiet) { this.quiet = quiet; this.emit('quiet', quiet); }
    this.emitState();
  }

  emitState() {
    if (this.stateTimer) return;
    this.stateTimer = setTimeout(() => { this.stateTimer = null; this.emit('state', this.publicState()); }, 60);
  }

  publicState() {
    const c = this.cfg || {};
    return {
      enabled: !!c.enabled,
      manual: this.manual,
      active: this.active,
      game: this.session ? { id: this.session.id, name: this.session.name, title: this.session.title, start: this.session.start, front: this.fgGame } : null,
      candidate: this.candidate,
      metrics: this.metrics ? this.publicMetrics() : null,
      opt: { running: this.opt.running, steps: this.opt.steps, at: this.opt.at, freed: this.opt.freed, closed: this.opt.closed, mode: this.opt.mode },
      optimized: !!this.restoreInfo,
      hud: this.hudVisible,
      osd: this.osdOn ? (this.osdOk === false ? 'missing' : 'on') : 'off',
      exclusive: !!(this.session && this.fgGame && this.session.disp && this.session.disp.xfs),
      fullscreen: !!(this.session && this.fgGame && this.session.disp && this.session.disp.d3dfs),
      rtss: { installed: !!this.rtssExe, running: !!(this.raw && this.raw.rtss) },
      libVer: this.libVer,
      launching: this.launching ? this.launching.id : null,
      fps: { etw: this.etw, access: this.access, rtss: !!(this.raw && this.raw.rtss) },
      sessions: this.sessions.slice(0, 10),
    };
  }

  // The app is quitting: undo the optimizations now (the closed apps are not started again).
  async shutdown() {
    if (!this.restoreInfo) return false;
    const ok = await this.restore({ reopen: false });
    this.log('gaming optimizations restored on quit');
    return ok;
  }

  dispose() {
    this.clearAway();
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.resolve(null); }
    this.pending.clear();
    clearTimeout(this.stateTimer);
    if (this.helper) {
      if (this.osdOn) this.helper.send('game.osd', '');
      this.helper.send('game.watch', '0');
      this.helper.send('game.fps', '0');
    }
  }
}

module.exports = { Gaming, classify, exeName, cleanList, mergeMetrics, newSession, accumulate, summarize, osdText, NON_GAMES };
