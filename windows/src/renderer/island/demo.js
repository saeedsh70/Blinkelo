// Demo data + a mock bridge so the island can run in a plain browser (preview) or be demoed from the tray.
const TRACKS = [
  { title: 'Midnight Drive', artist: 'Neon Coast', album: 'Afterglow', hues: [330, 265], duration: 214 },
  { title: 'Golden Hour', artist: 'Aria Vale', album: 'Light', hues: [28, 350], duration: 248 },
  { title: 'Ocean Lights', artist: 'Lumen', album: 'Tides', hues: [190, 230], duration: 187 },
];
let trackIndex = 0;

function makeArt(hues, seed) {
  const c = document.createElement('canvas');
  c.width = 300; c.height = 300;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 300, 300);
  grad.addColorStop(0, `hsl(${hues[0]} 85% 58%)`);
  grad.addColorStop(1, `hsl(${hues[1]} 80% 30%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 300, 300);
  for (let i = 0; i < 7; i++) {
    const x = (Math.sin(seed * 13 + i * 2.1) * 0.5 + 0.5) * 300;
    const y = (Math.cos(seed * 7 + i * 1.3) * 0.5 + 0.5) * 300;
    const r = 30 + ((i * 37 + seed * 11) % 90);
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, `hsla(${(hues[i % 2] + i * 20) % 360} 95% 70% / .55)`);
    rg.addColorStop(1, 'hsla(0 0% 100% / 0)');
    g.fillStyle = rg;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = 'rgba(255,255,255,.35)';
  g.lineWidth = 6;
  g.beginPath(); g.arc(150, 150, 70, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.beginPath(); g.arc(150, 150, 12, 0, Math.PI * 2); g.fill();
  return c.toDataURL('image/jpeg', 0.9);
}

function makeAvatar(name, hue) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 128, 128);
  grad.addColorStop(0, `hsl(${hue} 70% 62%)`);
  grad.addColorStop(1, `hsl(${(hue + 40) % 360} 70% 42%)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(255,255,255,.92)';
  g.beginPath(); g.arc(64, 50, 22, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(64, 118, 42, 34, 0, Math.PI, 0); g.fill();
  return c.toDataURL('image/png');
}

const SAMPLES = {
  en: { name: 'Sarah', full: 'Sarah Miller', msg: 'Hey! Coffee at 8 tonight? ☕️', mobile: 'Mobile', city: 'London' },
  ar: { name: 'سارة', full: 'سارة أحمد', msg: 'مرحبًا! قهوة الساعة ٨ الليلة؟ ☕️', mobile: 'جوال', city: 'دبي' },
  tr: { name: 'Selin', full: 'Selin Yılmaz', msg: 'Selam! Bu akşam 8\'de kahve? ☕️', mobile: 'Mobil', city: 'İstanbul' },
  es: { name: 'Lucía', full: 'Lucía García', msg: '¡Hola! ¿Café esta noche a las 8? ☕️', mobile: 'Móvil', city: 'Madrid' },
  ru: { name: 'Аня', full: 'Анна Смирнова', msg: 'Привет! Кофе сегодня в 8? ☕️', mobile: 'Мобильный', city: 'Москва' },
  zh: { name: '小雨', full: '王小雨', msg: '嗨！今晚八点喝咖啡吗？☕️', mobile: '手机', city: '上海' },
};

function sample(lang) { return SAMPLES[lang] || SAMPLES.en; }

function demoWeather(lang) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hourly = [];
  const codes = [1, 1, 2, 2, 3, 3, 61, 61, 2, 1, 0, 0];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    d.setMinutes(0, 0, 0);
    const hr = d.getHours();
    hourly.push({ time: `${iso(d)}T${pad(hr)}:00`, temp: 18 - Math.abs(14 - hr) * 0.6 + Math.sin(i) * 0.8, code: codes[i], isDay: hr >= 6 && hr < 18 });
  }
  const daily = [];
  const dc = [1, 61, 3, 0, 2, 95];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    daily.push({ date: iso(d), code: dc[i], max: 21 - i + (i % 2) * 3, min: 11 - (i % 3), pop: [5, 70, 30, 0, 10, 80][i], sunrise: null, sunset: null });
  }
  const hr = now.getHours();
  return {
    city: sample(lang).city, country: '', unit: 'c', updatedAt: Date.now(),
    current: { temp: 17.6, feels: 16.2, humidity: 48, wind: 12, code: 1, isDay: hr >= 6 && hr < 18 },
    hourly, daily,
  };
}

export function demoPayload(kind, step = 0, lang = 'en') {
  const sm = sample(lang);
  if (kind === 'music') {
    trackIndex = (trackIndex + step + TRACKS.length) % TRACKS.length;
    const t = TRACKS[trackIndex];
    return {
      type: 'media', present: true, title: t.title, artist: t.artist, album: t.album, status: 'playing',
      source: 'Spotify.exe', position: 37, duration: t.duration, canPlay: true, canPause: true, canNext: true, canPrev: true,
      canSeek: true, artKey: `demo-${trackIndex}`, art: makeArt(t.hues, trackIndex + 1),
    };
  }
  if (kind === 'message') {
    return {
      type: 'toast', id: `demo-msg-${Date.now()}`, time: Date.now(),
      app: { aumid: 'Microsoft.YourPhone_8wekyb3d8bbwe!App', name: 'Phone Link', phone: true },
      texts: [sm.name, sm.msg], attribution: 'WhatsApp', header: '',
      images: [], actions: [{ content: 'Send', inputId: 'reply' }, { content: 'Mark as read' }],
      inputs: [{ id: 'reply', type: 'text', placeholder: '' }], avatarData: makeAvatar(sm.name, 330),
    };
  }
  if (kind === 'call') {
    return {
      type: 'toast', id: `demo-call-${Date.now()}`, time: Date.now(), call: true, scenario: 'incomingCall',
      app: { aumid: 'Microsoft.YourPhone_8wekyb3d8bbwe!App', name: 'Phone Link', phone: true },
      texts: [sm.full, sm.mobile], images: [],
      actions: [{ content: 'Accept', style: 'Success' }, { content: 'Decline', style: 'Critical' }], inputs: [],
      avatarData: makeAvatar(sm.full, 200),
    };
  }
  if (kind === 'weather') return demoWeather(lang);
  return {};
}

const DEMO_APPS = [
  { id: 'a1', name: 'Visual Studio Code', kind: 'file', icon: null },
  { id: 'a2', name: 'Telegram', kind: 'file', icon: null },
  { id: 'a3', name: 'Photoshop', kind: 'file', icon: null },
  { id: 'a4', name: 'GitHub', kind: 'url', icon: null },
  { id: 'a5', name: 'Spotify', kind: 'aumid', icon: null },
  { id: 'a6', name: 'Figma', kind: 'file', icon: null },
  { id: 'k1', name: 'Play / Pause', kind: 'media', target: 'toggle', size: '2x1' },
  { id: 'k2', name: 'Next', kind: 'media', target: 'next' },
  { id: 'k3', name: 'Mute', kind: 'media', target: 'mute', color: '#ff9f0a' },
  { id: 'k4', name: 'Save all', kind: 'hotkey', target: 'Ctrl+Shift+S', vk: 83, mods: 5 },
  { id: 'k5', name: 'Screenshot', kind: 'action', target: 'screenshot' },
  { id: 'k6', name: 'Lock', kind: 'action', target: 'lock', color: '#ff453a' },
  { id: 'k7', name: 'Build', kind: 'command', target: 'npm run build', glyph: 'rocket' },
  { id: 'k8', name: 'Signature', kind: 'text', target: 'Best regards', glyph: 'send', color: '#64d2ff' },
];
const DEMO_PHONE = {
  me: { id: 'pc', name: 'My PC', port: 1716, ips: ['192.168.1.20'] },
  devices: [{ id: 'p1', name: 'Galaxy S24', type: 'phone', connected: true, paired: true, pairState: 'paired', battery: 76, charging: false, wifi: true, bluetooth: false, island: { app: 'Blinkelo Link', version: '1.0.0' } }],
};

function demoWidgets(lang) {
  const now = Date.now();
  return {
    crypto: { currency: 'USD', source: 'CoinGecko', items: [{ sym: 'BTC', price: 68012.4, change: 2.14 }, { sym: 'ETH', price: 3187.2, change: -0.86 }, { sym: 'USDT', price: 1.0001, change: 0.01 }, { sym: 'TON', price: 4.42, change: 4.7 }], updatedAt: now },
    news: {
      items: [
        ['Next-gen laptop chips focus on on-device AI', 'The Verge'],
        ['Gold climbs to a three-month high', 'BBC World'],
        ['What is new in the latest Windows 11 update', 'The Verge'],
        ['Volleyball team prepares for the world championship', 'BBC World'],
      ].map(([title, feed], i) => ({ title, feed, link: 'https://example.com/', time: now - (i + 1) * 23 * 60000 })),
      updatedAt: now,
    },
  };
}

export function createDemoBridge() {
  const listeners = {};
  const emit = (ch, payload) => (listeners[ch] || []).forEach((cb) => cb(payload));
  const params = new URLSearchParams(location.search);
  let statsTimer = null;
  // ?lang=ar&theme=glass&deck=l let the browser preview show the optional looks
  const settings = {};
  if (params.get('lang')) settings.language = params.get('lang');
  if (params.get('theme')) settings.theme = params.get('theme');
  if (params.get('deck')) settings.deck = { size: params.get('deck') };
  if (params.get('tp')) settings.transparency = Number(params.get('tp'));
  const shelf = [
    { path: 'C:\\Users\\me\\Desktop\\Report.pdf', name: 'Report.pdf', isDir: false },
    { path: 'C:\\Users\\me\\Pictures\\cover.png', name: 'cover.png', isDir: false },
    { path: 'C:\\Projects\\island', name: 'island', isDir: true },
  ];
  const clips = [
    { id: 'c1', kind: 'text', text: 'https://github.com/SaeedSH', time: Date.now() - 60000 },
    { id: 'c2', kind: 'text', text: 'Meeting tomorrow at 10 am', time: Date.now() - 600000 },
  ];
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = new Date();
  let tasks = [
    { id: 't1', title: 'Project team meeting', date: iso(today), time: '10:30', done: false, color: 'blue', created: 1 },
    { id: 't2', title: 'Send the weekly report', date: iso(today), time: null, done: true, color: 'green', created: 2 },
    { id: 't3', title: 'Buy a birthday gift', date: iso(today), time: '18:00', done: false, color: 'orange', created: 3 },
    { id: 't4', title: 'Dentist', date: iso(new Date(today.getTime() + 2 * 86400000)), time: '16:00', done: false, color: 'red', created: 4 },
    { id: 't5', title: 'Renew subscription', date: iso(new Date(today.getTime() - 3 * 86400000)), time: null, done: true, color: 'blue', created: 5 },
  ];
  // gaming mode simulation (?gaming=playing | denied | ask | off)
  const gmode = params.get('gaming') || '';
  const gm = {
    enabled: gmode !== 'off', manual: gmode === 'playing', active: gmode === 'playing',
    game: gmode === 'playing' ? { name: 'cyberpunk2077', title: 'Cyberpunk 2077', start: Date.now() - 2280000, front: true } : null,
    candidate: gmode === 'ask' ? { name: 'witcher3', title: 'The Witcher 3' } : null,
    metrics: null, opt: { running: false, steps: [], at: 0, freed: 0, closed: 0, mode: '' }, optimized: false, hud: gmode === 'playing',
    fps: { etw: gmode === 'denied' ? 'denied' : 'ok', access: null, rtss: false },
    sessions: [{ id: 's1', name: 'eldenring', title: 'ELDEN RING', dur: 4325, avgFps: 96, low1: 61, maxCpuTemp: 74, maxGpuTemp: 79 }],
  };
  const gmTick = () => {
    const r = (a, b) => Math.round(a + Math.random() * (b - a));
    gm.metrics = { fps: gm.game ? r(128, 146) : r(58, 62), low1: gm.game ? 97 : 55, ft: 7.1, fpsSrc: 'etw', cpu: r(31, 44), cpuTemp: r(61, 66), gpu: gm.game ? r(94, 99) : r(6, 14), gpuTemp: gm.game ? r(70, 73) : 48, ram: 61, ramUsed: 19.6e9, ramTotal: 32e9, vram: (gm.game ? 6.1 : 1.4) * 1073741824, vramTotal: 8 * 1073741824, ping: r(21, 29) };
    emit('gaming', JSON.parse(JSON.stringify(gm)));
  };
  setInterval(gmTick, 1000);
  setTimeout(gmTick, 50);
  const gmIcon = (letter, c1, c2) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='64' height='64' rx='14' fill='url(#g)'/><text x='32' y='43' font-family='Arial' font-weight='700' font-size='30' fill='white' text-anchor='middle'>${letter}</text></svg>`)}`;
  const gmLib = [['Cyberpunk 2077', 'C', '#fde047', '#ca8a04'], ['ELDEN RING', 'E', '#a8a29e', '#44403c'], ['Counter-Strike 2', 'CS', '#f59e0b', '#1e293b'], ['Forza Horizon 5', 'F', '#ec4899', '#7c3aed'], ['The Witcher 3', 'W', '#ef4444', '#450a0a'], ['Hades II', 'H', '#22c55e', '#14532d'], ['Baldur’s Gate 3', 'B', '#a855f7', '#1e1b4b'], ['Red Dead Redemption 2', 'R', '#dc2626', '#111827'], ['Hollow Knight', 'K', '#60a5fa', '#0f172a']]
    .map(([name, l, a, b], i) => ({ id: `demo:${i}`, name, source: i % 3 ? 'steam' : 'epic', played: 0, hidden: false, icon: gmIcon(l, a, b) }));
  const gmCmd = (name, a) => {
    if (name === 'library') return new Promise((res) => setTimeout(() => res(params.get('nolib') ? [] : gmLib), 350));
    if (name === 'launch') return new Promise((res) => { gm.launching = a.id; setTimeout(() => { gm.launching = null; res({ ok: true }); }, 1800); });
    if (name === 'toggle') { gm.manual = !gm.manual; gm.active = gm.manual || !!gm.game; }
    if (name === 'hud') gm.hud = !gm.hud;
    if (name === 'restore') { gm.optimized = false; gm.opt = { running: false, steps: [], at: 0, freed: 0, closed: 0, mode: '' }; }
    if (name === 'markGame') gm.candidate = null;
    if (name === 'optimize') {
      const keys = ['power', 'gameMode', 'close', 'memory', 'priority'];
      gm.manual = true; gm.active = true;
      gm.opt = { running: true, steps: keys.map((key) => ({ key, status: 'wait' })), at: Date.now(), freed: 0, closed: 0, mode: '' };
      keys.forEach((k, i) => {
        setTimeout(() => { gm.opt.steps[i].status = 'run'; emit('gaming', JSON.parse(JSON.stringify(gm))); }, 120 + i * 520);
        setTimeout(() => { gm.opt.steps[i].status = k === 'priority' && !gm.game ? 'later' : k === 'gameMode' ? 'skip' : 'ok'; if (k === 'gameMode') gm.opt.steps[i].detail = 'already'; emit('gaming', JSON.parse(JSON.stringify(gm))); }, 520 + i * 520);
      });
      setTimeout(() => { gm.opt.running = false; gm.optimized = true; gm.opt.freed = 1.32e9; gm.opt.closed = 2; emit('gaming', JSON.parse(JSON.stringify(gm))); }, 300 + keys.length * 520);
    }
    if (name === 'allowFps') return new Promise((res) => setTimeout(() => res({ ok: true, signOut: true }), 700));
    setTimeout(gmTick, 0);
    return Promise.resolve(JSON.parse(JSON.stringify(gm)));
  };
  const bridge = {
    platform: 'demo',
    on(ch, cb) { (listeners[ch] = listeners[ch] || []).push(cb); return () => {}; },
    helper(name, ...args) { if (params.has('debug')) console.log('[helper]', name, args); },
    invoke(name, arg) {
      switch (name) {
        case 'settings:get': return Promise.resolve(Object.keys(settings).length ? settings : null);
        case 'accent:get': return Promise.resolve('#0a84ff');
        case 'shelf:get': return Promise.resolve(shelf);
        case 'shelf:add': return Promise.resolve(shelf);
        case 'clipboard:history': return Promise.resolve(clips);
        case 'shortcuts:get': return Promise.resolve(params.has('apps') ? DEMO_APPS : []);
        case 'weather:get': return Promise.resolve(params.has('wx') ? demoWeather(params.get('lang') || 'en') : null);
        case 'phone:get': return Promise.resolve(params.has('phone') ? DEMO_PHONE : null);
        case 'widgets:get': return Promise.resolve(demoWidgets(params.get('lang') || 'en'));
        case 'tasks:get': return Promise.resolve(tasks);
        case 'tasks:add': { const t = { id: `t${Date.now()}`, done: false, color: 'blue', created: Date.now(), ...arg }; tasks.push(t); return Promise.resolve(t); }
        case 'tasks:update': return Promise.resolve(true);
        case 'tasks:remove': tasks = tasks.filter((x) => x.id !== arg); return Promise.resolve(true);
        case 'settings:set': return Promise.resolve(null);
        case 'gaming:get': return Promise.resolve(JSON.parse(JSON.stringify(gm)));
        case 'gaming:cmd': return gmCmd(arg, arguments[2] || {});
        default: return Promise.resolve(null);
      }
    },
    setRects() {},
    setInteractive() {},
    setFocus() {},
    attention() {},
    stats(on) {
      clearInterval(statsTimer);
      if (!on) return;
      const send = () => emit('stats', { cpu: 18 + Math.random() * 20, ram: 54 + Math.random() * 4, ramUsed: 17.4e9, ramTotal: 32e9, gpu: 9 + Math.random() * 10, gpuTemp: 47 });
      send();
      statsTimer = setInterval(send, 2000);
    },
    startDrag() {},
    phone(name, args) { if (params.has('debug')) console.log('[phone]', name, args); return Promise.resolve(true); },
    hit() {},
    drag() {},
    pathForFile(f) { return f.name; },
    log(...a) { console.log(...a); },
  };
  window.__demo = { emit, run: (k) => emit('demo', k), hover: (v) => emit('hover', v) };
  setTimeout(() => emit('helper', { type: 'net', down: 2.4e6, up: 310e3 }), 100);
  setTimeout(() => emit('helper', { type: 'battery', has: true, plugged: true, charging: true, percent: 82 }), 100);
  return bridge;
}
