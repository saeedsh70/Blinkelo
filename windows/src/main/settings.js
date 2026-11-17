'use strict';
const path = require('path');
const { EventEmitter } = require('events');
const { LANGS } = require('../shared/strings');
const { readJson, writeJson, isObject } = require('./jsonfile');

const SUPPORTED_LANGS = LANGS.map((l) => l.code);

const DEFAULTS = {
  onboarded: false,
  language: 'en',            // en | ar | tr | es | ru | zh
  style: 'floating',         // 'floating' | 'notch'
  theme: 'dark',             // 'dark' (classic black) | 'glass' (frosted glass)
  transparency: 0,           // 0-90 %: how much of what is behind the island shows through its body
  scale: 1,
  topOffset: 8,
  display: 'primary',        // 'primary' | display id
  accent: 'auto',            // 'auto' (Windows accent) | '#rrggbb'
  glow: true,
  edgeLight: true,
  blink: { hello: true, peeks: false, events: true }, // Blinkelo: hello at start, eyes peeking out while idle (off), a blink for every new thing
  idleClock: false,
  hideInFullscreen: true,
  callsOverFullscreen: true,
  respectDnd: true,
  startWithWindows: false,
  shortcut: 'Control+Alt+Space',
  sound: true,
  movable: true,
  position: null,            // { fx, dy, display } when the user dragged the island
  minimized: false,
  hidden: false,
  weather: { enabled: true, city: null, unit: 'c' },
  phone: {
    enabled: true,
    bluetooth: true,           // reach Blinkelo Link phones over Bluetooth when Wi-Fi can't
    remoteInput: true,         // phone touchpad / keyboard / presenter may move the mouse and type
    clipboard: true,           // shared clipboard (text)
    clipboardImages: true,     // ... and pictures
    forwardNotifications: true, // Windows notifications appear on the phone
    openLinks: true,           // links shared from the phone open in the browser
    cameraToClipboard: true,   // photos taken with "phone camera" are also copied
    downloadDir: '',           // '' = Downloads\Blinkelo
    commands: [],              // custom commands the phone can run: { id, name, command }
  },
  shortcuts: [],             // deck keys: apps, files, sites + hotkey / media / action / command / text keys
  deck: { size: 'm' },       // key size in the island's Apps tab: s | m | l
  home: { layout: [], custom: false }, // home tab tiles: [{ t, x, y, w, h }] on a 12x6 grid; custom = use saved layout
  modules: {
    media: true,
    visualizer: true,
    notifications: true,
    phoneCalls: true,
    volumeHud: true,
    battery: true,
    capsLock: true,
    numLock: false,
    clipboard: true,
    privacy: true,
    stats: true,
    shelf: true,
    timer: true,
    weather: true,
    widgets: true,
  },
  notifications: {
    duration: 5,
    blocked: [],
    showBody: true,
    clearedAt: 0,            // "clear all" in the dashboard hides everything that arrived before this
    dismissed: [],           // ids removed one by one
  },
  widgets: {
    active: 'crypto',        // which widget the home tab shows: crypto | news | clocks
    crypto: { enabled: true, coins: ['BTC', 'ETH', 'USDT', 'TON'] },
    news: { enabled: true, feeds: [], custom: [] },   // empty feeds = defaults for the language
    clocks: { enabled: true, zones: ['Europe/London', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo'] },
  },
  media: {
    pausedTimeout: 25,
    compactInfo: true,
  },
  subtitles: {
    enabled: true,
    languages: [],           // up to 3 codes in order of preference; [] = the island's language, then English
    auto: true,              // search as soon as a video starts in a desktop player
    autoDownload: true,      // ... and download the best match
    dir: '',                 // '' = Downloads\Subtitles
    nextToVideo: false,      // also save a copy beside the video file (players load it on their own)
    fixEncoding: true,       // convert to UTF-8 so old legacy-encoded files don't turn into gibberish
    hi: 'avoid',             // hearing-impaired subtitles: avoid | any | prefer
    providers: {
      subdl: { on: true, key: '' },
      opensubtitles: { on: true, key: '', user: '', passEnc: '' },
      podnapisi: { on: true },
    },
  },
  gaming: {
    enabled: true,            // gaming mode features at all
    auto: true,               // notice games on its own and start gaming mode
    autoOptimize: false,      // run the optimizer as soon as a game starts
    restoreOnExit: true,      // undo the optimizations when the game closes
    quiet: true,              // while playing: keep the island out of the way and pause widget downloads (calls still come through)
    fps: true,                // frame counter (ETW; RivaTuner shared memory as a fallback)
    temp: 'c',                // c | f
    pingHost: '8.8.8.8',
    hud: {
      enabled: true,
      show: 'game',           // game = only over a game | always = whenever gaming mode is on
      position: 'center',     // left | center | right
      size: 'm',              // s | m | l
      opacity: 88,            // %
      metrics: ['fps', 'low1', 'cpu', 'cpuTemp', 'gpu', 'gpuTemp', 'vram', 'ram', 'ping', 'clock'],
      hotkey: 'Control+Shift+G',
      engine: 'auto',         // auto = window bar, RivaTuner OSD in exclusive fullscreen | window | rtss
    },
    optimizeOnLaunch: true,   // starting a game from the island runs the optimizer first
    library: [],              // games added by hand: [{ name, path }]
    hidden: [],               // library ids not shown in the island
    optimize: {
      power: true,            // High performance plan (or the "Best performance" power mode)
      gameMode: true,         // make sure Windows Game Mode is on
      memory: true,           // trim the memory of idle background apps
      priority: 'above',      // game process priority: normal | above | high
      closeApps: true,        // close the apps in closeList
      dvr: false,             // turn off Xbox Game Bar background recording
    },
    closeList: [],            // exe names (lowercase, without .exe)
    forceClose: false,        // end apps that ignore the close request
    reopen: true,             // start the closed apps again after the game
    games: [],                // always a game (exe names)
    ignore: [],               // never a game
  },
};

function deepMerge(base, extra) {
  if (Array.isArray(base)) return Array.isArray(extra) ? extra.slice() : base.slice();
  if (base && typeof base === 'object' && extra === null) return null;
  if (base && typeof base === 'object') {
    const out = {};
    for (const k of Object.keys(base)) {
      out[k] = extra && Object.prototype.hasOwnProperty.call(extra, k) ? deepMerge(base[k], extra[k]) : deepMerge(base[k], undefined);
    }
    return out;
  }
  if (extra === undefined || extra === null) return base;
  if (typeof base === 'number') return Number.isFinite(Number(extra)) ? Number(extra) : base;
  if (typeof base === 'boolean') return Boolean(extra);
  return typeof extra === typeof base ? extra : base;
}

class Settings extends EventEmitter {
  constructor(dir) {
    super();
    this.file = path.join(dir, 'settings.json');
    this.data = deepMerge(DEFAULTS, {});
    // nothing usable = first run; a damaged file is read from settings.json.bak (and kept as settings.json.broken)
    const { value, from, damaged } = readJson(this.file, { backup: true, valid: isObject });
    if (value !== undefined) this.data = deepMerge(DEFAULTS, value);
    this.loadedFrom = from;      // 'file' | 'backup' | null
    this.damaged = !!damaged;    // the main file existed but could not be read
    this.normalize();
  }

  // an unsupported language falls back to the default
  normalize() {
    if (!SUPPORTED_LANGS.includes(this.data.language)) this.data.language = DEFAULTS.language;
  }

  get() { return JSON.parse(JSON.stringify(this.data)); }

  set(patch) {
    this.data = deepMerge(DEFAULTS, deepMerge(this.data, patch || {}));
    this.normalize();
    this.save();
    this.emit('change', this.get());
    return this.get();
  }

  reset() {
    this.data = deepMerge(DEFAULTS, {});
    this.save();
    this.emit('change', this.get());
  }

  save() {
    try {
      writeJson(this.file, this.data, { space: 2, backup: true, valid: isObject });
    } catch (e) {
      console.error('settings save failed', e);
    }
  }
}

module.exports = { Settings, DEFAULTS, deepMerge };
