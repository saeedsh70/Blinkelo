// Bridge to the Android side (window.IslandNative). In a desktop browser a mock is used for previews.

const real = typeof window !== 'undefined' && window.IslandNative;
export const isMock = !real;

let listener = () => {};
export function onNativeEvent(fn) { listener = fn; }

export function call(method, args = {}) {
  if (real) {
    try {
      const r = JSON.parse(real.call(method, JSON.stringify(args)));
      if (!r.ok) console.warn('native', method, r.error);
      return r.ok ? r.result : null;
    } catch (e) {
      console.warn('native call failed', method, e);
      return null;
    }
  }
  return mock(method, args);
}

export function send(type, body = {}, deviceId) {
  return call('send', { type, body, ...(deviceId ? { deviceId } : {}) });
}

// ---------------------------------------------------------------------------------------------- mock
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const mockLang = params.get('lang') || 'en';
const mockConnected = params.get('offline') !== '1';
const now = Date.now();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = iso(new Date());
const tomorrow = iso(new Date(now + 86400000));

const svgIcon = (bg, txt) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect rx="12" width="48" height="48" fill="${bg}"/><text x="24" y="31" font-size="20" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold">${txt}</text></svg>`)}`;
const art = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff375f"/><stop offset="1" stop-color="#5e5ce6"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><circle cx="100" cy="100" r="46" fill="none" stroke="white" stroke-width="10" opacity=".85"/><circle cx="100" cy="100" r="10" fill="white"/></svg>')}`;

const M = {
  settings: {
    language: mockLang, deviceName: '', bluetooth: true, startOnBoot: true, onboarded: params.get('onboard') !== '1',
    notifications: { mirror: true, blocked: [] }, pcNotifications: true, clipboard: { receive: true },
    media: { mirror: true, pcNotification: true }, calls: true, sms: true,
    touchpad: { sensitivity: 1, scroll: 1, natural: false, haptics: true }, planner: { calendar: 'auto' },
  },
  devices: mockConnected ? [
    { id: 'pc1', name: 'My-PC', type: 'desktop', paired: true, pairState: 'paired', verifyKey: '', connected: true, wifi: true, bluetooth: true, address: '192.168.1.24' },
    { id: 'pc2', name: 'Office-Laptop', type: 'laptop', paired: false, pairState: 'none', verifyKey: '', connected: true, wifi: true, bluetooth: false, address: '192.168.1.40' },
  ] : [],
  tasks: [
    { id: 't1', title: 'Design team meeting', date: today, time: '10:30', done: false, color: 'blue', created: now - 5e6, updated: now - 5e6 },
    { id: 't2', title: 'Buy a birthday gift', date: today, time: null, done: true, color: 'pink', created: now - 4e6, updated: now - 4e6 },
    { id: 't3', title: 'Renew the domain', date: today, time: '18:00', done: false, color: 'orange', created: now - 3e6, updated: now - 3e6 },
    { id: 't4', title: 'Workout', date: tomorrow, time: '07:00', done: false, color: 'green', created: now - 2e6, updated: now - 2e6 },
  ],
  timers: [{ id: 'tm1', label: 'Tea', duration: 300000, endsAt: now + 184000, origin: 'pc', remaining: 184000 }],
  received: [
    { name: 'report-q3.pdf', uri: 'content://x/1', mime: 'application/pdf', size: 2400000, from: 'My-PC', time: now - 600000 },
    { name: 'PC-20261108-131210.jpg', uri: 'content://x/2', mime: 'image/jpeg', size: 380000, from: 'My-PC', time: now - 3600000 },
    { name: 'notes.txt', uri: 'content://x/3', mime: 'text/plain', size: 1200, from: 'My-PC', time: now - 86400000 },
  ],
};

const mockCache = () => ({
  hello: { app: 'Blinkelo', version: '1.0.0', platform: 'windows', features: ['mousepad', 'runcommand', 'sysinfo', 'apps', 'screenshot', 'pcmedia', 'tasks', 'timers', 'game'] },
  sysinfo: { cpu: 23, ram: 61, ramUsed: 9.8, ramTotal: 16, gpu: 12, gpuTemp: 48, netDown: 2.4e6, netUp: 180e3, battery: null, charging: false, hostname: 'My-PC', uptime: 18300, volume: 64, muted: false },
  pcmedia: { present: true, title: 'Midnight City', artist: 'M83', status: 'playing', position: 72, duration: 243, canSeek: true, source: 'Spotify', art, receivedAt: Date.now() },
  apps: { apps: [
    { id: 'a1', name: 'Chrome', icon: svgIcon('#4285F4', 'C') }, { id: 'a2', name: 'VS Code', icon: svgIcon('#0078D4', '</>') },
    { id: 'a3', name: 'Spotify', icon: svgIcon('#1DB954', 'S') }, { id: 'a4', name: 'Telegram', icon: svgIcon('#2AABEE', 'T') },
    { id: 'a5', name: 'Photoshop', icon: svgIcon('#001E36', 'Ps') }, { id: 'a6', name: 'Explorer', icon: svgIcon('#F5B400', 'E') },
    { id: 'a7', name: 'Word', icon: svgIcon('#185ABD', 'W') }, { id: 'a8', name: 'Steam', icon: svgIcon('#1b2838', 'St') },
    { id: 'k1', name: 'Play / Pause', kind: 'media', glyph: '', color: '', size: '2x1' }, { id: 'k2', name: 'Next', kind: 'media', glyph: 'skip-forward', color: '', size: '1x1' },
    { id: 'k3', name: 'Mute', kind: 'media', glyph: 'volume-x', color: '#ff9f0a', size: '1x1' }, { id: 'k4', name: 'Save all', kind: 'hotkey', hint: 'Ctrl+Shift+S', size: '2x1' },
    { id: 'k5', name: 'Screenshot', kind: 'action', glyph: 'scan', size: '1x1' }, { id: 'k6', name: 'Lock', kind: 'action', glyph: 'lock', color: '#ff453a', size: '1x1' },
    { id: 'k7', name: 'Build', kind: 'command', glyph: 'rocket', size: '2x2' }, { id: 'k8', name: 'Signature', kind: 'text', glyph: 'send', color: '#64d2ff', size: '1x1' },
  ] },
  volume: { sinkList: [{ name: 'default', description: 'Speakers (Realtek)', muted: false, volume: 64, maxVolume: 100, enabled: true }] },
  commands: { commands: [
    { key: 'island.lock', name: 'Lock' }, { key: 'island.sleep', name: 'Sleep' }, { key: 'island.monitoroff', name: 'Screen off' },
    { key: 'island.restart', name: 'Restart' }, { key: 'island.shutdown', name: 'Shut down' }, { key: 'island.signout', name: 'Sign out' },
    { key: 'c1', name: 'Open Downloads', command: 'explorer shell:Downloads' },
  ] },
  tasks: M.tasks, timers: M.timers, received: M.received,
});

function mockState() {
  const active = M.devices.find((d) => d.paired && d.connected) || null;
  return {
    ready: true, service: true, me: { id: 'phone', name: 'Galaxy S24', port: 1716 }, devices: M.devices, active,
    pc: active ? mockCache().hello : {}, bluetooth: { available: true, permission: true, enabled: true, setting: M.settings.bluetooth, listening: true, error: '' },
    ips: ['192.168.1.31'], settings: M.settings, lang: M.settings.language, version: '1.0.0',
    permissions: { notifications: true, notificationAccess: true, phone: true, contacts: false, sms: false, bluetooth: true, battery: false, exactAlarm: true, storage: true, fullScreen: true },
    cache: active ? mockCache() : { tasks: M.tasks, timers: M.timers, received: M.received },
  };
}

function emitLater(name, data, ms = 300) { setTimeout(() => listener(name, data), ms); }
// game preview (?game=idle for no running game)
function pngIcon(c1, c2, txt) {
  if (typeof document === 'undefined') return '';
  const cv = document.createElement('canvas'); cv.width = cv.height = 64;
  const x = cv.getContext('2d'); const g = x.createLinearGradient(0, 0, 64, 64);
  g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  x.fillStyle = '#fff'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 32, 34);
  return cv.toDataURL('image/png');
}
const mockGameStart = now - 2537000;
let gameTimer = null; let gameTick = 0;
function mockGame() {
  gameTick += 1;
  if (params.get('game') === 'idle') {
    return { v: 1, kind: 'live', state: 'idle', enabled: true, optimized: false, hud: false, temp: 'c', game: null, m: null, sessions: [
      { id: 's1', name: 'The Witcher 3: Wild Hunt', dur: 5470, avgFps: 58, low1: 41, maxCpuTemp: 88, maxGpuTemp: 71, end: now - 3600e3 },
      { id: 's2', name: 'ELDEN RING', dur: 2710, avgFps: 60, low1: 52, maxCpuTemp: 79, maxGpuTemp: 74, end: now - 86400e3 },
      { id: 's3', name: 'Counter-Strike 2', dur: 1880, avgFps: 212, low1: 141, maxCpuTemp: 84, maxGpuTemp: 66, end: now - 2 * 86400e3 }] };
  }
  const fps = Math.round(58 + Math.sin(gameTick / 3) * 6 + (gameTick % 17 === 0 ? -24 : 0));
  return { v: 1, kind: 'live', state: 'playing', enabled: true, active: true, optimized: true, hud: true, fullscreen: true, temp: 'c',
    game: { id: 'g9', name: 'witcher3', title: 'The Witcher 3: Wild Hunt', start: mockGameStart, front: true },
    m: { fps, low1: 41, ft: Math.round(10000 / Math.max(fps, 1)) / 10, cpu: 29 + (gameTick % 5), cpuTemp: 91, gpu: 82, gpuTemp: 71, gpuPower: 118, ram: 54, ramUsed: 8.6, ramTotal: 16, vram: 5.9, vramTotal: 8, ping: 48, src: 'etw' } };
}

let sysTimer = null;
function mock(method, a) {
  switch (method) {
    case 'state': return mockState();
    case 'send': {
      if (a.type === 'island.sysinfo.request' && a.body.subscribe && !sysTimer) {
        sysTimer = setInterval(() => {
          const s = mockCache().sysinfo;
          s.cpu = Math.round(15 + Math.random() * 30); s.netDown = Math.random() * 5e6; s.netUp = Math.random() * 4e5;
          listener('sysinfo', s);
        }, 2000);
      }
      if (a.type === 'island.game.request') {
        const act = a.body.action;
        if (act === 'subscribe') {
          if (!gameTimer) {
            listener('gameicon', { id: 'g9', icon: pngIcon('#7f1d1d', '#0f172a', 'W3') });
            for (let i = 0; i < 60; i++) listener('game', mockGame());
            gameTimer = setInterval(() => listener('game', mockGame()), 1000);
          }
        } else if (act === 'library') {
          emitLater('gamelib', { v: 1, kind: 'library', games: [
            { id: 'gog:1', name: 'The Witcher 3: Wild Hunt', source: 'gog', icon: pngIcon('#7f1d1d', '#0f172a', 'W3') },
            { id: 'steam:2', name: 'ELDEN RING', source: 'steam', icon: pngIcon('#a16207', '#1c1917', 'ER') },
            { id: 'steam:3', name: 'Counter-Strike 2', source: 'steam', icon: pngIcon('#ea580c', '#111827', 'CS') },
            { id: 'epic:4', name: 'Fortnite', source: 'epic', icon: pngIcon('#7c3aed', '#0ea5e9', 'F') },
            { id: 'exe:5', name: 'Cyberpunk 2077', source: 'gog', icon: pngIcon('#facc15', '#0f172a', 'CP') },
            { id: 'exe:6', name: 'VALORANT', source: 'played', icon: pngIcon('#ef4444', '#111827', 'V') }] }, 500);
        } else if (act === 'launch') emitLater('gamelaunch', { ok: true, name: 'ELDEN RING' }, 1500);
        return true;
      }
      if (a.type === 'island.screenshot.request') emitLater('screenshot', { uri: art, name: 'PC.jpg', w: 1920, h: 1080 }, 900);
      return true;
    }
    case 'setSettings': {
      const merge = (x, y) => { for (const k of Object.keys(y)) { if (y[k] && typeof y[k] === 'object' && !Array.isArray(y[k])) x[k] = merge({ ...(x[k] || {}) }, y[k]); else x[k] = y[k]; } return x; };
      M.settings = merge({ ...M.settings }, a.patch || {});
      return M.settings;
    }
    case 'tasks': return M.tasks;
    case 'taskAdd': {
      const t = { id: `t${Date.now()}`, title: a.task.title, date: a.task.date, time: a.task.time || null, done: false, color: a.task.color || 'blue', created: Date.now(), updated: Date.now() };
      M.tasks.push(t); emitLater('tasks', M.tasks, 10); return t;
    }
    case 'taskUpdate': { const t = M.tasks.find((x) => x.id === a.id); if (t) Object.assign(t, a.patch); emitLater('tasks', M.tasks, 10); return t; }
    case 'taskRemove': M.tasks = M.tasks.filter((x) => x.id !== a.id); emitLater('tasks', M.tasks, 10); return true;
    case 'tasksClearDone': M.tasks = M.tasks.filter((x) => !x.done || (a.date && x.date !== a.date)); emitLater('tasks', M.tasks, 10); return true;
    case 'timers': return M.timers;
    case 'timerStart': { const t = { id: `tm${Date.now()}`, label: a.label, duration: a.ms, endsAt: Date.now() + a.ms, origin: 'phone', remaining: a.ms }; M.timers.push(t); emitLater('timers', M.timers, 10); return t; }
    case 'timerCancel': M.timers = M.timers.filter((x) => x.id !== a.id); emitLater('timers', M.timers, 10); return true;
    case 'received': return M.received;
    case 'notifApps': return [{ pkg: 'org.telegram.messenger', name: 'Telegram', blocked: false }, { pkg: 'com.whatsapp', name: 'WhatsApp', blocked: false }, { pkg: 'com.instagram.android', name: 'Instagram', blocked: true }, { pkg: 'com.google.android.gm', name: 'Gmail', blocked: false }];
    case 'pair': { const d = M.devices.find((x) => x.id === a.id); if (d) { d.pairState = 'requested'; d.verifyKey = 'D6A46E54'; emitLater('devices', mockState(), 10); } return true; }
    case 'permissions': return mockState().permissions;
    default: return true;
  }
}
