'use strict';
// PC side of the Blinkelo Link features. Everything a paired phone can ask this PC for (remote mouse and
// keyboard, media, volume, power, apps, screenshots, files, clipboard, the shared planner and timers,
// "find my PC") and everything the PC pushes to the phone (live stats, now playing, PC notifications).
// The KDE Connect protocol itself lives in kdeconnect.js; this module only speaks packets.
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { EventEmitter } = require('events');
const { publicKey } = require('./deck');
const { writeJson } = require('./jsonfile');

const BUILTIN_COMMANDS = {
  'island.lock': 'Lock', 'island.sleep': 'Sleep', 'island.monitoroff': 'Screen off',
  'island.restart': 'Restart', 'island.shutdown': 'Shut down', 'island.signout': 'Sign out',
};
const SKIP_NOTIF_APPS = /phone ?link|your ?phone|kde ?connect|island link|blinkelo|dynamic island/i;
const MAX_CLIP_IMAGE = 8 * 1024 * 1024;

class PhoneLink extends EventEmitter {
  /**
   * @param {object} o
   *  kde, helper, settings, tasks, log, toIsland(channel, payload), attention(ms),
   *  readStats(): Promise<stats>, shortcuts(): Promise<list>, launchShortcut(id),
   *  setClipboardText(text), setClipboardImage(buf), addToShelf(paths), appIcon(app): Promise<dataUrl|null>,
   *  capture(): Promise<{jpeg, w, h}|null>, openUrl(url), appVersion
   */
  constructor(o) {
    super();
    Object.assign(this, o);
    this.kde.appVersion = o.appVersion;
    this.pc = { media: null, player: null, volume: null, net: { down: 0, up: 0 }, battery: null };
    this.sysSubs = new Map();     // deviceId -> expiresAt
    this.gaming = null;           // { state(), command(name, args), library(), sessionIcon(), temp() } from main
    this.gameSubs = new Map();    // phones with the game page open: deviceId -> expiresAt (faster updates)
    this.gameIconSent = new Map(); // deviceId -> session id whose icon that phone already has
    this.gameSig = '';
    this.gameSentAt = 0;
    this.sysTimer = null;
    this.mediaKey = '';
    this.mediaSentAt = 0;
    this.artSent = null;
    this.lastArt = null;
    this.lastMediaBody = null;
    this.volTimer = null;
    this.lastVolSent = '';
    this.timer = null;            // PC timer state shared with phones { id, label, duration, endsAt, running }
    this.findPc = null;
    this.fromPhoneText = '';
    this.fromPhoneImageSize = -1;
    this.btWant = null;
    this.btEnabled = null;
    this.btScanUntil = 0;
    this.btScanTimer = null;
    this.notifIds = new Set();
    this.timers = new Map();
    this.timerTombstones = {};
    if (this.timerFile) {
      try {
        const saved = JSON.parse(fs.readFileSync(this.timerFile,'utf8'));
        for (const t of saved.timers || []) if (t && typeof t.id === 'string' && Number.isFinite(t.endsAt) && Number.isFinite(t.updated)) this.timers.set(t.id,t);
        this.timerTombstones = saved.tombstones && typeof saved.tombstones === 'object' ? saved.tombstones : {};
      } catch (_) {}
    }
    this.timer = this.timers.values().next().value || null;
    this.sharedTimerTick = setInterval(() => this.expireTimers(),1000);
    this.sharedTimerTick.unref();
    this.bind();
  }

  get opts() { return this.settings.data.phone || {}; }

  // ---------------------------------------------------------------- wiring
  bind() {
    const k = this.kde;
    k.on('phoneHello', (e) => this.onHello(e));
    k.on('linkUp', () => this.updateBluetooth());
    k.on('linkDown', (e) => this.onLinkDown(e));
    k.on('devices', () => this.updateBluetooth());
    k.on('input', (e) => this.onInput(e.body || {}));
    k.on('presenter', (e) => this.onPresenter(e.body || {}));
    k.on('volumeRequest', (e) => this.onVolumeRequest(e));
    k.on('runcommand', (e) => this.onRunCommand(e));
    k.on('sysinfoRequest', (e) => this.onSysinfoRequest(e));
    k.on('appsRequest', (e) => this.sendApps(e.deviceId));
    k.on('appsLaunch', (e) => { if (e.id) this.launchShortcut(e.id); });
    k.on('screenshotRequest', (e) => this.sendScreenshot(e.deviceId));
    k.on('mediaRequest', (e) => this.onMediaRequest(e.body || {}));
    k.on('tasks', (e) => { if (this.tasks) this.tasks.applyRemote(e.body); });
    k.on('timer', (e) => this.onPhoneTimer(e));
    k.on('findPc', (e) => this.onFindPc(e));
    k.on('gameRequest', (e) => { this.onGameRequest(e).catch((err) => this.log('phone game request failed', err.message)); });
    k.on('clipboard', (e) => this.onPhoneClipboard(e));
    k.on('clipboardImage', (e) => this.onPhoneClipboardImage(e));
    k.on('share', (e) => this.onShare(e));
    k.on('shareProgress', (e) => this.toIsland('phone', { type: 'transfer', dir: 'in', ...e }));
    k.on('btLinkUp', (e) => this.toIsland('phone', { type: 'bluetooth', up: true, name: e.name }));
    k.on('btLinkDown', (e) => this.toIsland('phone', { type: 'bluetooth', up: false, name: e.name }));
    if (this.tasks) {
      this.onTaskSync = (op) => this.kde.sendIsland('island.tasks', op);
      this.tasks.on('sync', this.onTaskSync);
    }
  }

  dispose() {
    clearInterval(this.sharedTimerTick);
    clearInterval(this.sysTimer);
    clearTimeout(this.volTimer);
    clearTimeout(this.btScanTimer);
    if (this.tasks && this.onTaskSync) this.tasks.removeListener('sync', this.onTaskSync);
    if (this.helper) this.helper.send('bt.want', '0');
  }

  onHello(e) {
    // a phone running Blinkelo Link: bring it up to date with everything shared
    if (this.tasks) this.kde.sendTo(e.deviceId, 'island.tasks', this.tasks.snapshot());
    this.sendTimerTo(e.deviceId);
    this.sendVolume(e.deviceId, true);
    if (this.lastMediaBody) this.kde.sendTo(e.deviceId, 'island.media', { ...this.mediaBody(true) });
    if (this.findPc) this.kde.sendTo(e.deviceId, 'island.findpc.state', { ringing: true });
    if (this.gaming && e.island && (e.island.features || []).includes('game')) {
      this.gameIconSent.delete(e.deviceId);
      this.sendGameTo(e.deviceId).catch(() => {});
    }
    this.updateBluetooth();
  }

  onLinkDown(e) {
    this.sysSubs.delete(e.id);
    this.gameSubs.delete(e.id);
    this.gameIconSent.delete(e.id);
    if (this.findPc && this.findPc.deviceId === e.id) this.stopFindPc();
    this.updateBluetooth();
  }

  // Bluetooth: the helper looks for paired phones only while no Blinkelo Link phone is reachable over Wi-Fi.
  updateBluetooth() {
    if (!this.helper) return;
    const enabled = this.opts.bluetooth !== false;
    let lan = false;
    let islandPaired = false;
    for (const d of this.kde.deviceList()) {
      if (!d.paired || !d.island) continue;
      islandPaired = true;
      if (d.wifi || d.bluetooth) lan = true; // already reachable: no need to scan
    }
    const scanning = Date.now() < this.btScanUntil;
    const want = enabled && ((islandPaired && !lan) || scanning);
    if (want !== this.btWant) {
      this.btWant = want;
      this.helper.send('bt.want', want ? '1' : '0');
    }
    if (!enabled && this.btEnabled !== false) this.helper.send('bt.closeAll');
    this.btEnabled = enabled;
  }

  /** First contact over Bluetooth (no Wi-Fi): look for phones paired in Windows for two minutes. */
  btScan() {
    if (!this.helper || this.opts.bluetooth === false) return false;
    this.btScanUntil = Date.now() + 120000;
    this.btWant = null;
    this.updateBluetooth();
    clearTimeout(this.btScanTimer);
    this.btScanTimer = setTimeout(() => this.updateBluetooth(), 121000);
    return true;
  }

  // ---------------------------------------------------------------- helper messages (PC state)
  onHelper(msg) {
    switch (msg.type) {
      case 'media':
        this.pc.media = msg.present ? msg : null;
        this.pushMedia();
        break;
      case 'player':
        this.pc.player = msg.present ? msg : null;
        if (!this.pc.media) this.pushMedia();
        break;
      case 'volume':
        this.pc.volume = { level: Number(msg.level) || 0, muted: !!msg.muted };
        clearTimeout(this.volTimer);
        this.volTimer = setTimeout(() => this.sendVolume(null, false), 120);
        break;
      case 'net':
        this.pc.net = { down: Number(msg.down) || 0, up: Number(msg.up) || 0 };
        break;
      case 'battery':
        this.pc.battery = msg.has ? { percent: Number(msg.percent), charging: !!msg.charging || !!msg.plugged } : null;
        break;
      case 'toast':
        this.forwardNotification(msg);
        break;
      case 'toastRemoved':
        if (this.notifIds.has(String(msg.id))) {
          this.notifIds.delete(String(msg.id));
          this.kde.sendIsland('island.pcnotify', { id: `w${msg.id}`, cancel: true });
        }
        break;
      case 'bt':
        if (msg.ev === 'open') this.kde.btOpened(msg.addr, msg.name);
        else if (msg.ev === 'line') this.kde.btLine(msg.addr, msg.data);
        else if (msg.ev === 'sent') this.kde.btSent(msg.addr, Number(msg.total) || 0);
        else if (msg.ev === 'close') this.kde.btClosed(msg.addr);
        break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- remote input
  onInput(b) {
    if (this.opts.remoteInput === false || !this.helper) return;
    const mods = (b.ctrl ? 1 : 0) | (b.alt ? 2 : 0) | (b.shift ? 4 : 0) | (b.super ? 8 : 0);
    const h = this.helper;
    if (b.singleclick) h.send('input.mouse', 'left', 0, 0);
    else if (b.doubleclick) h.send('input.mouse', 'double', 0, 0);
    else if (b.rightclick) h.send('input.mouse', 'right', 0, 0);
    else if (b.middleclick) h.send('input.mouse', 'middle', 0, 0);
    else if (b.singlehold) h.send('input.mouse', 'hold', 0, 0);
    else if (b.singlerelease) h.send('input.mouse', 'release', 0, 0);
    else if (b.scroll) h.send('input.mouse', 'scroll', Number(b.dx) || 0, Number(b.dy) || 0);
    else if (b.vk) h.send('input.key', 'vk', Number(b.vk) | 0, mods);
    else if (b.specialKey) h.send('input.key', 'special', Number(b.specialKey) | 0, mods);
    else if (typeof b.key === 'string' && b.key) h.send('input.key', 'text', b.key, mods);
    else if (b.dx !== undefined || b.dy !== undefined) h.send('input.mouse', 'move', Number(b.dx) || 0, Number(b.dy) || 0);
  }

  onPresenter(b) {
    // official KDE Connect presenter: pointer motion as small fractions
    if (this.opts.remoteInput === false || !this.helper || b.stop) return;
    const dx = Number(b.dx) || 0;
    const dy = Number(b.dy) || 0;
    if (dx || dy) this.helper.send('input.mouse', 'move', dx * 1000, dy * 1000);
  }

  // ---------------------------------------------------------------- volume
  sinkList() {
    const v = this.pc.volume || { level: 0.5, muted: false };
    return [{ name: 'default', description: os.hostname(), muted: v.muted, volume: Math.round(v.level * 100), maxVolume: 100, enabled: true }];
  }

  sendVolume(deviceId, full) {
    if (!this.pc.volume) return;
    const v = this.pc.volume;
    const key = `${Math.round(v.level * 100)}|${v.muted}`;
    if (!full && key === this.lastVolSent) return;
    this.lastVolSent = key;
    const body = full ? { sinkList: this.sinkList() } : { name: 'default', volume: Math.round(v.level * 100), muted: v.muted };
    if (deviceId) this.kde.sendTo(deviceId, 'kdeconnect.systemvolume', body);
    else this.kde.sendAll('kdeconnect.systemvolume', body);
  }

  onVolumeRequest(e) {
    const b = e.body || {};
    if (b.requestSinks) { this.sendVolume(e.deviceId, true); return; }
    if (!this.helper) return;
    if (b.volume !== undefined) this.helper.send('volume.set', Math.max(0, Math.min(100, Number(b.volume) || 0)) / 100);
    if (b.muted !== undefined) this.helper.send('volume.mute', b.muted ? '1' : '0');
  }

  // ---------------------------------------------------------------- commands (power + custom)
  commands() {
    const out = {};
    for (const [key, name] of Object.entries(BUILTIN_COMMANDS)) out[key] = { name, command: '' };
    for (const c of this.opts.commands || []) {
      if (c && c.id && c.name && c.command) out[c.id] = { name: String(c.name), command: String(c.command) };
    }
    return out;
  }

  onRunCommand(e) {
    const b = e.body || {};
    if (b.requestCommandList) {
      this.kde.sendTo(e.deviceId, 'kdeconnect.runcommand', { commandList: JSON.stringify(this.commands()), canAddCommand: false });
      return;
    }
    const key = String(b.key || '');
    if (!key) return;
    const win = process.platform === 'win32';
    const detached = (cmd, args) => { if (win) spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).unref(); };
    this.log('phone command', key, 'from', e.deviceName);
    switch (key) {
      case 'island.lock':
        if (this.helper && this.helper.ready) this.helper.send('power.lock');
        else detached('rundll32.exe', ['user32.dll,LockWorkStation']);
        return;
      case 'island.sleep': if (this.helper) this.helper.send('power.sleep'); return;
      case 'island.monitoroff': if (this.helper) this.helper.send('power.monitoroff'); return;
      case 'island.restart':
        this.toIsland('phone', { type: 'power', what: 'restart', name: e.deviceName });
        detached('shutdown.exe', ['/r', '/t', '5']);
        return;
      case 'island.shutdown':
        this.toIsland('phone', { type: 'power', what: 'shutdown', name: e.deviceName });
        detached('shutdown.exe', ['/s', '/t', '5']);
        return;
      case 'island.signout': detached('shutdown.exe', ['/l']); return;
      default: {
        const c = (this.opts.commands || []).find((x) => x && x.id === key);
        if (!c || !c.command) return;
        detached(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', c.command]);
        this.toIsland('phone', { type: 'command', name: c.name, from: e.deviceName });
      }
    }
  }

  // ---------------------------------------------------------------- live stats
  onSysinfoRequest(e) {
    if (e.subscribe) this.sysSubs.set(e.deviceId, Date.now() + 25000);
    else this.sysSubs.delete(e.deviceId);
    if (this.sysSubs.size && !this.sysTimer) {
      this.sendSysinfo();
      this.sysTimer = setInterval(() => this.sendSysinfo(), 2000);
    } else if (!this.sysSubs.size && this.sysTimer) {
      clearInterval(this.sysTimer);
      this.sysTimer = null;
    }
  }

  async sendSysinfo() {
    const now = Date.now();
    for (const [id, exp] of this.sysSubs) if (exp < now) this.sysSubs.delete(id);
    if (!this.sysSubs.size) { clearInterval(this.sysTimer); this.sysTimer = null; return; }
    let s = {};
    try { s = (await this.readStats()) || {}; } catch (_) { s = {}; }
    const gb = (b) => Math.round((Number(b) || 0) / 1073741824 * 10) / 10;
    const v = this.pc.volume;
    const body = {
      cpu: Math.round(Number(s.cpu) || 0), ram: Math.round(Number(s.ram) || 0), ramUsed: gb(s.ramUsed), ramTotal: Math.round(gb(s.ramTotal)),
      gpu: s.gpu === null || s.gpu === undefined ? null : Math.round(s.gpu), gpuTemp: s.gpuTemp || null, gpuName: s.gpuName || '',
      netDown: this.pc.net.down, netUp: this.pc.net.up,
      battery: this.pc.battery ? Math.round(this.pc.battery.percent) : null, charging: this.pc.battery ? this.pc.battery.charging : false,
      hostname: os.hostname(), uptime: Math.round(os.uptime()),
      volume: v ? Math.round(v.level * 100) : null, muted: v ? v.muted : false,
    };
    for (const id of this.sysSubs.keys()) this.kde.sendTo(id, 'island.sysinfo', body);
  }

  // ---------------------------------------------------------------- gaming on the phone (Blinkelo Link 1.0.5+)
  // Live numbers while a game runs (every 2 s, every second while the phone shows its game page), the library
  // to start games from the phone, and a summary when a session ends. Only phones that list "game" get them.
  setGaming(api) { this.gaming = api || null; }

  gameBody(st, kind = 'live') {
    const n = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)));
    const gb = (b) => (b === null || b === undefined || !Number.isFinite(Number(b)) ? null : Math.round(Number(b) / 1073741824 * 10) / 10);
    const g = st && st.game;
    const m = (st && st.metrics) || {};
    return {
      v: 1, kind, state: g ? 'playing' : 'idle', at: Date.now(),
      enabled: !!(st && st.enabled), active: !!(st && st.active), optimized: !!(st && st.optimized), hud: !!(st && st.hud),
      fullscreen: !!(st && st.fullscreen), temp: (this.gaming && this.gaming.temp && this.gaming.temp()) === 'f' ? 'f' : 'c',
      game: g ? { id: String(g.id || ''), name: String(g.name || ''), title: String(g.title || ''), start: Number(g.start) || 0, front: !!g.front } : null,
      m: g ? {
        fps: n(m.fps), low1: n(m.low1), ft: Number.isFinite(Number(m.ft)) && m.ft !== null ? Math.round(m.ft * 10) / 10 : null,
        cpu: n(m.cpu), cpuTemp: n(m.cpuTemp), gpu: n(m.gpu), gpuTemp: n(m.gpuTemp), gpuPower: n(m.gpuPower),
        ram: n(m.ram), ramUsed: gb(m.ramUsed), ramTotal: gb(m.ramTotal), vram: gb(m.vram), vramTotal: gb(m.vramTotal),
        ping: m.ping === undefined ? null : m.ping, src: String(m.fpsSrc || ''),
      } : null,
      sessions: g ? undefined : ((st && st.sessions) || []).slice(0, 6).map((s) => ({
        id: s.id, name: s.title || s.name, dur: s.dur, avgFps: s.avgFps, low1: s.low1, maxCpuTemp: s.maxCpuTemp, maxGpuTemp: s.maxGpuTemp, end: s.end,
      })),
    };
  }

  // gaming 'state' events: send at once when something the phone shows changed
  gameState(st) {
    if (!this.gaming || !st) return;
    const g = st.game;
    const sig = JSON.stringify([g && g.id, g && g.front, st.enabled, st.active, st.optimized, st.hud, st.fullscreen, ((st.sessions || [])[0] || {}).id]);
    if (sig === this.gameSig) return;
    this.gameSig = sig;
    this.pushGame(st, true).catch(() => {});
  }

  // gaming 'metrics' events (once a second while a game runs)
  gameMetrics() {
    if (!this.gaming) return;
    const st = this.gaming.state();
    if (st && st.game) this.pushGame(st, false).catch(() => {});
  }

  async gameSummary(rec) {
    if (!this.gaming || !rec) return;
    const ids = this.kde.islandPhones('game');
    if (!ids.length) return;
    let icon = null;
    try { icon = await this.gaming.sessionIcon(rec); } catch (_) { icon = null; }
    const body = { v: 1, kind: 'summary', at: Date.now(), temp: this.gameBody(null).temp,
      summary: { id: rec.id, name: rec.title || rec.name, dur: rec.dur, avgFps: rec.avgFps, low1: rec.low1, avgCpu: rec.avgCpu, avgGpu: rec.avgGpu,
        maxCpuTemp: rec.maxCpuTemp, maxGpuTemp: rec.maxGpuTemp, maxRam: rec.maxRam, start: rec.start, end: rec.end }, icon: icon || undefined };
    for (const id of ids) this.kde.sendTo(id, 'island.game', body);
  }

  async pushGame(st, force) {
    const now = Date.now();
    for (const [id, exp] of this.gameSubs) if (exp < now) this.gameSubs.delete(id);
    if (!force && now - this.gameSentAt < (this.gameSubs.size ? 900 : 1900)) return;
    const ids = this.kde.islandPhones('game');
    if (!ids.length) return;
    this.gameSentAt = now;
    const body = this.gameBody(st);
    const sid = body.game ? body.game.id : '';
    let icon = null;
    if (sid && ids.some((id) => this.gameIconSent.get(id) !== sid)) {
      try { icon = await this.gaming.sessionIcon(); } catch (_) { icon = null; }
    }
    for (const id of ids) {
      const withIcon = !!(icon && this.gameIconSent.get(id) !== sid);
      if (withIcon) this.gameIconSent.set(id, sid);
      this.kde.sendTo(id, 'island.game', withIcon ? { ...body, icon } : body);
    }
  }

  async sendGameTo(deviceId) {
    if (!this.gaming) return;
    const body = this.gameBody(this.gaming.state());
    if (body.game) {
      let icon = null;
      try { icon = await this.gaming.sessionIcon(); } catch (_) { icon = null; }
      if (icon) { body.icon = icon; this.gameIconSent.set(deviceId, body.game.id); }
    }
    this.kde.sendTo(deviceId, 'island.game', body);
  }

  async onGameRequest(e) {
    if (!this.gaming) return;
    const b = e.body || {};
    const id = e.deviceId;
    const action = String(b.action || '');
    switch (action) {
      case 'subscribe':
        this.gameSubs.set(id, Date.now() + 25000);
        if (b.full) this.gameIconSent.delete(id);
        await this.sendGameTo(id);
        return;
      case 'unsubscribe': this.gameSubs.delete(id); return;
      case 'library': {
        let list = [];
        try { list = (await this.gaming.library()) || []; } catch (_) { list = []; }
        const games = list.filter((g) => !g.hidden).slice(0, 40).map((g) => ({ id: g.id, name: g.name, source: g.source, icon: g.icon || undefined }));
        this.kde.sendTo(id, 'island.game', { v: 1, kind: 'library', at: Date.now(), games });
        return;
      }
      case 'launch': case 'optimize': case 'restore': case 'hud': case 'toggle': {
        this.log('phone game command', action, 'from', e.deviceName);
        const args = action === 'launch' ? { id: String(b.id || '').slice(0, 300) } : action === 'toggle' && typeof b.on === 'boolean' ? { on: b.on } : {};
        let r = null;
        try { r = await this.gaming.command(action, args); } catch (err) { this.log('phone game command failed', err.message); }
        if (action === 'launch') this.kde.sendTo(id, 'island.game', { v: 1, kind: 'launch', at: Date.now(), ok: !!(r && r.ok), name: (r && r.name) || '' });
        await this.sendGameTo(id);
        return;
      }
      default: return;
    }
  }

  // ---------------------------------------------------------------- apps
  async sendApps(deviceId) {
    let list = [];
    try { list = await this.shortcuts(); } catch (_) { list = []; }
    // "deck: 1" tells Blinkelo Link 1.0.4+ that keys carry kind / color / glyph / size
    const apps = list.map((s) => ({ ...publicKey(s), icon: s.icon || null }));
    if (!this.appSubs) this.appSubs = new Set();
    this.appSubs.add(deviceId);
    if (this.kde.sendTo(deviceId, 'island.apps', { deck: 1, apps }) === false) this.appSubs.delete(deviceId);
  }

  // the deck was edited on the PC: refresh every phone that has it open
  appsChanged() {
    if (!this.appSubs || !this.appSubs.size) return;
    clearTimeout(this.appsTimer);
    this.appsTimer = setTimeout(() => {
      for (const id of [...this.appSubs]) {
        this.sendApps(id).catch(() => {});
      }
    }, 600);
  }

  // ---------------------------------------------------------------- screenshot
  async sendScreenshot(deviceId) {
    let shot = null;
    try { shot = await this.capture(); } catch (e) { this.log('screenshot failed', e.message); }
    if (!shot || !shot.jpeg) { this.kde.sendTo(deviceId, 'island.screenshot', { error: true }); return; }
    const { KdeConnect } = require('./kdeconnect');
    const ok = await this.kde.sendPayload(deviceId, 'island.screenshot', { w: shot.w, h: shot.h }, KdeConnect.bufferSource(shot.jpeg));
    if (!ok) this.log('screenshot send failed');
  }

  // ---------------------------------------------------------------- PC media → phone
  currentMedia() {
    const m = this.pc.media;
    if (m && m.present) return m;
    const p = this.pc.player;
    if (p && p.present) {
      return { present: true, title: p.title, artist: '', album: '', status: p.playing ? 'playing' : 'paused', source: p.app,
        position: 0, duration: 0, canPlay: true, canPause: true, canNext: true, canPrev: true, canSeek: false, artKey: `player:${p.title}`, art: null };
    }
    return null;
  }

  mediaBody(withArt) {
    const m = this.currentMedia();
    if (!m) return { present: false };
    const source = String(m.source || '').replace(/^.*[\\!]/, '').replace(/\.exe$/i, '').replace(/_[a-z0-9]{13}$/i, '');
    const body = {
      present: true, title: m.title || '', artist: m.artist || '', album: m.album || '', status: m.status === 'playing' ? 'playing' : 'paused',
      source: source || 'PC', position: Number(m.position) || 0, duration: Number(m.duration) || 0,
      canPlay: m.canPlay !== false, canPause: m.canPause !== false, canNext: !!m.canNext, canPrev: !!m.canPrev, canSeek: !!m.canSeek,
      artKey: m.artKey || `${m.title}|${m.artist}`,
    };
    if (withArt && this.lastArt && this.lastArt.key === body.artKey) body.art = this.lastArt.url;
    return body;
  }

  pushMedia() {
    const m = this.currentMedia();
    // the helper attaches art only when it changes: remember the latest picture per track
    if (m && m.art !== undefined && m.artKey) {
      if (m.art) this.lastArt = { key: m.artKey, url: m.art };
      else if (!this.lastArt || this.lastArt.key !== m.artKey) this.lastArt = { key: m.artKey, url: '' };
    }
    const body = this.mediaBody(false);
    if (!this.kde.hasIslandPhone()) { this.lastMediaBody = body; this.mediaKey = ''; this.artSent = null; return; }
    const key = JSON.stringify([body.present, body.title, body.artist, body.status, Math.round(body.duration), body.canNext, body.canPrev, body.source]);
    const now = Date.now();
    const prev = this.lastMediaBody;
    let jump = false;
    if (prev && prev.present && body.present && key === this.mediaKey) {
      const expected = prev.position + (prev.status === 'playing' ? (now - this.mediaSentAt) / 1000 : 0);
      jump = Math.abs(expected - body.position) > 3;
    }
    const art = this.lastArt && this.lastArt.key === body.artKey ? this.lastArt.url : '';
    const sent = this.artSent || { key: '', url: '' };
    const needArt = !!art && (sent.key !== body.artKey || sent.url !== art);
    if (key === this.mediaKey && !jump && !needArt) return;
    if (needArt) { body.art = art; this.artSent = { key: body.artKey, url: art }; }
    else if (sent.key === body.artKey) body.keepArt = true;
    else this.artSent = { key: body.artKey, url: '' };
    this.mediaKey = key;
    this.mediaSentAt = now;
    this.lastMediaBody = body;
    this.kde.sendIsland('island.media', body);
  }

  onMediaRequest(b) {
    if (!this.helper) return;
    const smtc = !!(this.pc.media && this.pc.media.present);
    const action = String(b.action || '');
    if (!smtc) {
      const map = { playpause: 'toggle', play: 'toggle', pause: 'toggle', next: 'next', prev: 'prev', previous: 'prev' };
      if (map[action]) this.helper.send('keys.media', map[action] === 'toggle' ? 'playpause' : map[action]);
      return;
    }
    switch (action) {
      case 'playpause': this.helper.send('media.toggle'); break;
      case 'play': this.helper.send('media.play'); break;
      case 'pause': this.helper.send('media.pause'); break;
      case 'next': this.helper.send('media.next'); break;
      case 'prev': case 'previous': this.helper.send('media.prev'); break;
      case 'seek': this.helper.send('media.seek', Math.max(0, Number(b.position) || 0)); break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- shared timers
  saveTimers() {
    const cutoff = Date.now() - 30 * 86400000;
    for (const [id, at] of Object.entries(this.timerTombstones)) if (at < cutoff) delete this.timerTombstones[id];
    if (this.timerFile) {
      try {
        writeJson(this.timerFile, {timers: [...this.timers.values()], tombstones: this.timerTombstones});
      } catch (error) { if (this.log) this.log('timer save failed ' + error.message); }
    }
    this.toIsland('phone', {type: 'timerList', timers: [...this.timers.values()]});
  }

  timerFromIsland(a) {
    const tm = a && a.timer;
    const id = tm && tm.syncId;
    if (!id || String(id).length > 128) return false;
    const updated = Math.max(Date.now(), (this.timerTombstones[id] || 0) + 1, (this.timers.get(id)?.updated || 0) + 1);
    if (a.op === 'start') {
      const duration = Math.round(Number(tm.duration) * 1000);
      if (!Number.isFinite(tm.endsAt) || !Number.isFinite(duration) || duration <= 0 || duration > 365 * 86400000) return false;
      this.timer = {id, label: tm.label || '', duration, endsAt: tm.endsAt, origin: tm.origin || 'pc', updated};
      this.timers.set(id, this.timer); delete this.timerTombstones[id];
      this.sendTimer('running');
    } else if (['stop','pause','done'].includes(a.op)) {
      const removed = this.timers.get(id);
      this.timers.delete(id); this.timerTombstones[id] = updated;
      this.kde.sendIsland('island.timer', {id, state: a.op === 'done' ? 'done' : 'cancel', updated});
      if (this.timer?.id === id) {
        this.timer = null;
        const next = this.timers.values().next().value;
        if (next) {
          this.timer = next;
          this.toIsland('phone', {type:'timer', ...this.timerBody('running')});
        }
      }
    }
    this.saveTimers();
    return true;
  }

  timerBody(state, timer = this.timer) {
    return {id: timer.id, label: timer.label, duration: timer.duration,
      remaining: Math.max(0, timer.endsAt - Date.now()), state, origin: timer.origin, updated: timer.updated};
  }

  sendTimer(state) {
    if (this.timer) this.kde.sendIsland('island.timer', this.timerBody(state));
  }

  sendTimerTo(deviceId) {
    for (const [id, updated] of Object.entries(this.timerTombstones)) this.kde.sendTo(deviceId, 'island.timer', {id, state:'cancel', updated});
    for (const timer of this.timers.values()) if (timer.endsAt > Date.now())
      this.kde.sendTo(deviceId, 'island.timer', this.timerBody('running', timer));
    this.saveTimers();
  }

  expireTimers() {
    for (const [id, timer] of this.timers) {
      if (timer.endsAt > Date.now()) continue;
      this.timers.delete(id); const updated = Math.max(Date.now(), timer.updated + 1);
      this.timerTombstones[id] = updated;
      this.kde.sendIsland('island.timer', {id, state:'done', updated});
      this.toIsland('phone', {type:'timer', id, state:'done', label:timer.label, duration:timer.duration});
      if (this.timer?.id === id) this.timer = null;
      this.saveTimers();
    }
  }

  onPhoneTimer(e) {
    const b = e.body || {}, id = String(b.id || ''), state = String(b.state || 'running');
    if (!id || id.length > 128 || !['running','cancel','done'].includes(state)) return;
    const updated = Number.isSafeInteger(b.updated) && b.updated > 0 ? b.updated : Date.now();
    const existing = this.timers.get(id);
    if ((this.timerTombstones[id] || 0) >= updated || (existing?.updated || 0) > updated) return;
    if (state === 'running') {
      const remaining = Number(b.remaining), duration = Number(b.duration) || remaining;
      if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 365 * 86400000 || this.timers.size >= 100 && !existing) return;
      if (existing?.updated === updated) return;
      const timer = {id, label:String(b.label || ''), duration, endsAt:Date.now() + remaining, origin:b.origin || 'phone', updated};
      this.timers.set(id,timer); delete this.timerTombstones[id];
      if (!this.timer || this.timer.id === id) this.timer = timer;
      this.toIsland('phone',{type:'timer', ...this.timerBody('running',timer),from:e.deviceName});
    } else {
      this.timers.delete(id); this.timerTombstones[id] = updated;
      if (this.timer?.id === id) this.timer = null;
      if (existing) this.toIsland('phone',{type:'timer',state,id,label:existing.label,duration:existing.duration});
    }
    this.saveTimers();
  }

  // ---------------------------------------------------------------- find my PC
  onFindPc(e) {
    if (e.ringing) {
      this.findPc = { deviceId: e.deviceId, name: e.deviceName, at: Date.now() };
      this.attention(90000);
      this.toIsland('phone', { type: 'findPc', ringing: true, name: e.deviceName });
      this.kde.sendTo(e.deviceId, 'island.findpc.state', { ringing: true });
    } else {
      this.stopFindPc();
    }
  }

  stopFindPc() {
    const f = this.findPc;
    this.findPc = null;
    this.toIsland('phone', { type: 'findPc', ringing: false });
    this.attention(0);
    if (f) this.kde.sendTo(f.deviceId, 'island.findpc.state', { ringing: false });
    return true;
  }

  // ---------------------------------------------------------------- clipboard
  onPhoneClipboard(e) {
    if (this.opts.clipboard === false) return;
    const text = String(e.text || '');
    if (!text) return;
    this.fromPhoneText = text;
    this.setClipboardText(text);
    this.toIsland('phone', { type: 'clipboard', kind: 'text', name: e.deviceName, text: text.slice(0, 120) });
  }

  onPhoneClipboardImage(e) {
    if (this.opts.clipboard === false || !e.data) return;
    this.fromPhoneImageSize = e.data.length;
    this.setClipboardImage(e.data);
    this.toIsland('phone', { type: 'clipboard', kind: 'image', name: e.deviceName });
  }

  /** PC clipboard changed (from main's clipboard watcher). */
  pcClipboard(item) {
    if (this.opts.clipboard === false || !item) return;
    if (item.kind === 'text') {
      if (!item.text || item.text === this.fromPhoneText) return;
      this.fromPhoneText = '';
      this.kde.sendClipboard(item.text);
    } else if (item.kind === 'image' && item.png && this.opts.clipboardImages !== false) {
      if (item.png.length === this.fromPhoneImageSize) { this.fromPhoneImageSize = -1; return; }
      if (item.png.length > MAX_CLIP_IMAGE) return;
      this.kde.sendClipboardImage(item.png).catch(() => {});
    }
  }

  // ---------------------------------------------------------------- shares from the phone
  onShare(e) {
    if (e.kind === 'url') {
      const url = String(e.url || '');
      const web = /^https?:\/\//i.test(url);
      if (web && this.opts.openLinks !== false) this.openUrl(url);
      this.toIsland('phone', { type: 'received', kind: 'url', url, opened: web && this.opts.openLinks !== false, name: e.deviceName });
      return;
    }
    if (e.kind === 'text') {
      this.fromPhoneText = e.text;
      this.setClipboardText(e.text);
      this.toIsland('phone', { type: 'received', kind: 'text', text: String(e.text).slice(0, 300), name: e.deviceName });
      return;
    }
    if (e.kind === 'file') {
      this.addToShelf([e.path]);
      const image = /\.(jpe?g|png|gif|webp|bmp|heic)$/i.test(e.path);
      if (e.camera && image && this.opts.cameraToClipboard !== false) {
        try { this.setClipboardImage(fs.readFileSync(e.path)); } catch (_) { /* ignore */ }
      }
      this.toIsland('phone', { type: 'received', kind: 'file', path: e.path, file: e.name, size: e.size, image, camera: !!e.camera, name: e.deviceName });
    }
  }

  // ---------------------------------------------------------------- PC → phone actions (from the island / settings)
  async sendFiles(paths, deviceId) {
    const files = (paths || []).filter((p) => { try { return fs.statSync(p).isFile(); } catch (_) { return false; } }).slice(0, 20);
    if (!files.length) return false;
    let okAll = true;
    for (const f of files) {
      const name = path.basename(f);
      const tid = `out-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      let last = 0;
      this.toIsland('phone', { type: 'transfer', dir: 'out', tid, name, done: 0, total: 1, state: 'active' });
      // eslint-disable-next-line no-await-in-loop
      const ok = await this.kde.shareFile(deviceId, f, (done, total) => {
        const now = Date.now();
        if (now - last > 250 || done >= total) { last = now; this.toIsland('phone', { type: 'transfer', dir: 'out', tid, name, done, total, state: 'active' }); }
      });
      this.toIsland('phone', { type: 'transfer', dir: 'out', tid, name, state: ok ? 'done' : 'failed' });
      okAll = okAll && ok;
    }
    return okAll;
  }

  async sendClipboardNow(item) {
    if (!item) return false;
    if (item.kind === 'image' && item.png) return this.kde.sendClipboardImage(item.png);
    if (item.text) return this.kde.sendClipboard(item.text) > 0;
    return false;
  }

  // ---------------------------------------------------------------- PC notifications → phone
  async forwardNotification(msg) {
    if (this.opts.forwardNotifications === false || !this.kde.hasIslandPhone()) return;
    const app = msg.app || {};
    if (app.phone || SKIP_NOTIF_APPS.test(`${app.name || ''} ${app.aumid || ''}`)) return;
    if (msg.call) return;
    const texts = Array.isArray(msg.texts) ? msg.texts.filter(Boolean) : [];
    if (!texts.length) return;
    const blocked = (this.settings.data.notifications && this.settings.data.notifications.blocked) || [];
    if (blocked.some((b) => b && (b === app.aumid || b === app.name))) return;
    let icon = null;
    try { icon = await this.appIcon(app); } catch (_) { icon = null; }
    const id = String(msg.id);
    this.notifIds.add(id);
    if (this.notifIds.size > 200) this.notifIds.delete(this.notifIds.values().next().value);
    this.kde.sendIsland('island.pcnotify', {
      id: `w${id}`, app: app.name || 'Windows', title: texts[0], text: texts.slice(1).join('\n'), time: Number(msg.time) || Date.now(), icon,
    });
  }
}

module.exports = { PhoneLink, BUILTIN_COMMANDS };
