'use strict';
// 1.8.0: gaming on the phone (Island Link 1.0.5+) and the gaming guide.
//  - live numbers go only to phones whose hello lists "game"; every 2 s, every second while a phone has the game page open
//  - the game icon is sent once per session and phone; a summary packet at the end of a session
//  - the phone can ask for the library and start a game, optimize / undo, toggle the PC bar
//  - KDE Connect identity carries the new packet types; the PC's hello lists "game"
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { EventEmitter } = require('events');
const root = path.resolve(__dirname, '..');
const { PhoneLink } = require(path.join(root, 'src/main/phonelink.js'));
const { strings } = require(path.join(root, 'src/shared/strings.js'));
const tick = () => new Promise((r) => setImmediate(r));

(async () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-'));
  const out = [];
  const kde = new EventEmitter();
  let phones = ['phoneA'];
  kde.islandPhones = (feature) => (feature === 'game' ? phones : []);
  kde.sendTo = (id, type, body) => { out.push({ id, type, body }); return true; };
  kde.sendIsland = () => 0;
  const logs = [];
  const pl = new PhoneLink({ kde, settings: { data: { phone: {} } }, toIsland: () => {}, timerFile: path.join(work, 't.json'), log: (...a) => logs.push(a.join(' ')) });

  let st = { enabled: true, active: false, optimized: false, hud: false, fullscreen: false, game: null, metrics: null,
    sessions: [{ id: 'g1', name: 'witcher3', title: 'The Witcher 3', dur: 322, avgFps: 58, low1: 41, maxCpuTemp: 88, maxGpuTemp: 71, end: 5 }] };
  const commands = [];
  let iconCalls = 0;
  pl.setGaming({
    state: () => st,
    command: async (name, args) => { commands.push([name, args]); return name === 'launch' ? { ok: true, name: 'The Witcher 3' } : {}; },
    library: async () => [{ id: 'gog:1', name: 'The Witcher 3', source: 'gog', icon: 'data:image/png;base64,AAA', hidden: false }, { id: 'steam:2', name: 'Hidden', source: 'steam', icon: null, hidden: true }],
    sessionIcon: async () => { iconCalls += 1; return 'data:image/png;base64,ICON'; },
    temp: () => 'c',
  });
  const game = () => out.filter((p) => p.type === 'island.game');

  // idle state: sent once when it changes, with recent sessions, no metrics
  pl.gameState(st);
  await tick();
  assert.equal(game().length, 1);
  let b = game()[0].body;
  assert.deepEqual([b.kind, b.state, b.game, b.m], ['live', 'idle', null, null]);
  assert.equal(b.sessions[0].name, 'The Witcher 3');
  pl.gameState({ ...st });
  await tick();
  assert.equal(game().length, 1, 'unchanged state is not sent again');

  // a game starts: icon once, then metrics every ~2 s
  st = { ...st, active: true, game: { id: 'g2', name: 'witcher3', title: 'The Witcher 3', start: Date.now(), front: true }, fullscreen: true,
    metrics: { fps: 59.6, low1: 41, ft: 16.78, cpu: 29, cpuTemp: 91, gpu: 13, gpuTemp: 59, gpuPower: 120.4, ram: 54, ramUsed: 8.6e9, ramTotal: 17.1e9, vram: 0.8e9, vramTotal: 8.5e9, ping: 191, fpsSrc: 'etw' } };
  pl.gameState(st);
  await tick(); await tick();
  b = game().pop().body;
  assert.equal(b.state, 'playing');
  assert.equal(b.icon, 'data:image/png;base64,ICON', 'first packet of a session carries the icon');
  assert.deepEqual([b.m.fps, b.m.ft, b.m.gpuPower, b.m.ramUsed, b.m.vramTotal, b.m.ping, b.m.src], [60, 16.8, 120, 8, 7.9, 191, 'etw']);
  assert.equal(b.fullscreen, true);
  assert.equal(b.sessions, undefined, 'no session list while playing');
  const n0 = game().length;
  pl.gameMetrics();
  await tick();
  assert.equal(game().length, n0, 'throttled (2 s without an open page)');
  pl.gameSentAt -= 2000;
  pl.gameMetrics();
  await tick(); await tick();
  assert.equal(game().length, n0 + 1);
  assert.equal(game().pop().body.icon, undefined, 'icon only once per session');
  assert.equal(iconCalls, 1);

  // the phone opens the game page: immediate full state with icon, then 1 s updates
  kde.emit('gameRequest', { deviceId: 'phoneA', deviceName: 'S22', body: { action: 'subscribe', full: true } });
  await tick(); await tick();
  b = game().pop().body;
  assert.equal(b.icon, 'data:image/png;base64,ICON');
  pl.gameSentAt = Date.now() - 950;
  pl.gameMetrics();
  await tick(); await tick();
  assert.equal(game().pop().body.state, 'playing', 'faster while subscribed');

  // library (hidden games left out) and commands
  kde.emit('gameRequest', { deviceId: 'phoneA', deviceName: 'S22', body: { action: 'library' } });
  await tick(); await tick();
  b = game().pop().body;
  assert.equal(b.kind, 'library');
  assert.deepEqual(b.games.map((g) => g.id), ['gog:1']);
  kde.emit('gameRequest', { deviceId: 'phoneA', deviceName: 'S22', body: { action: 'launch', id: 'gog:1' } });
  await tick(); await tick(); await tick();
  assert.deepEqual(commands.pop(), ['launch', { id: 'gog:1' }]);
  assert(game().some((p) => p.body.kind === 'launch' && p.body.ok && p.body.name === 'The Witcher 3'));
  for (const a of ['optimize', 'restore', 'hud']) {
    kde.emit('gameRequest', { deviceId: 'phoneA', deviceName: 'S22', body: { action: a } });
    await tick(); await tick();
    assert.deepEqual(commands.pop(), [a, {}]);
  }
  kde.emit('gameRequest', { deviceId: 'phoneA', deviceName: 'S22', body: { action: 'toggle', on: false } });
  await tick(); await tick();
  assert.deepEqual(commands.pop(), ['toggle', { on: false }]);
  const before = commands.length;
  kde.emit('gameRequest', { deviceId: 'phoneA', deviceName: 'S22', body: { action: 'shutdown' } });
  await tick();
  assert.equal(commands.length, before, 'unknown actions are ignored');
  assert(logs.some((x) => /^phone game command optimize from S22/.test(x)));

  // summary at the end of a session
  await pl.gameSummary({ id: 'g2', name: 'witcher3', title: 'The Witcher 3', dur: 3725, avgFps: 58, low1: 40, avgCpu: 31, avgGpu: 90, maxCpuTemp: 92, maxGpuTemp: 74, maxRam: 61, start: 1, end: 2, path: 'C:\\g.exe' });
  b = game().pop().body;
  assert.deepEqual([b.kind, b.summary.name, b.summary.dur, b.summary.maxGpuTemp], ['summary', 'The Witcher 3', 3725, 74]);
  assert(b.icon);

  // phones without the feature get nothing
  phones = [];
  const n1 = game().length;
  pl.gameState({ ...st, optimized: true });
  await tick();
  assert.equal(game().length, n1);
  // link down forgets the subscription
  kde.emit('linkDown', { id: 'phoneA' });
  assert.equal(pl.gameSubs.has('phoneA'), false);
  pl.dispose();

  // ---------------------------------------------------------------- protocol / wiring guards
  const kd = fs.readFileSync(path.join(root, 'src/main/kdeconnect.js'), 'utf8');
  assert(/'island\.game\.request',\n\];/.test(kd) && /'island\.game',\n\];/.test(kd), 'capabilities');
  assert(/'transfer-ack', 'game'\]/.test(kd), 'the PC hello lists "game"');
  assert(/case 'island\.game\.request': this\.emit\('gameRequest'/.test(kd));
  const main = fs.readFileSync(path.join(root, 'src/main/main.js'), 'utf8');
  assert(/phoneLink\.setGaming\(\{/.test(main) && /phoneLink\.gameState\(st\)/.test(main) && /phoneLink\.gameMetrics\(\)/.test(main) && /phoneLink\.gameSummary\(rec\)/.test(main));
  // guide strings, settings card, island hint, bundles
  for (const lang of ['en', 'ar', 'tr', 'es', 'ru', 'zh']) {
    const S = strings(lang);
    for (const k of ['gmGuideTitle', 'gmGuide1', 'gmGuide2', 'gmGuide3', 'gmGuideWhyTitle', 'gmGuideWhy', 'gmGuideNowFs', 'gmGuideNowOk', 'gmFsHint', 'gmGuideBtn']) assert(S[k] && S[k] !== k, `${lang}.${k}`);
    assert(/Borderless/.test(S.gmGuide1), `${lang}: names Borderless`);
  }
  assert(/anti-cheat/i.test(strings('en').gmGuideWhy) && /BattlEye/.test(strings('ar').gmGuideWhy));
  const set = fs.readFileSync(path.join(root, 'src/renderer/settings/settings.src.js'), 'utf8');
  assert(/function gmGuideHtml\(\)/.test(set) && /\$\{G\.enabled \? gmGuideHtml\(\) : ''\}/.test(set));
  assert(/gmFsHint/.test(fs.readFileSync(path.join(root, 'src/renderer/island/views.js'), 'utf8')));
  assert(/gmGuideWhy/.test(fs.readFileSync(path.join(root, 'src/renderer/settings/settings.js'), 'utf8')), 'settings bundle rebuilt');
  assert(/gmFsHint/.test(fs.readFileSync(path.join(root, 'src/renderer/island/island.bundle.js'), 'utf8')), 'island bundle rebuilt');
  fs.rmSync(work, { recursive: true, force: true });
  console.log('v1.8.0 phone gaming checks passed (live / icon / summary / library / commands, capabilities, guide)');
})().catch((e) => { console.error(e); process.exit(1); });
