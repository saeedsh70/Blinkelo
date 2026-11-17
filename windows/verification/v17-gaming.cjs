'use strict';
// 1.7.0: gaming mode - game detection, metrics, sessions, optimizer/restore, helper protocol, strings, settings.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '..');
const G = require(path.join(root, 'src/main/gaming.js'));
const { DEFAULTS, deepMerge } = require(path.join(root, 'src/main/settings.js'));
const { strings } = require(path.join(root, 'src/shared/strings.js'));

const tick = () => new Promise((r) => setImmediate(r));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // ---------------------------------------------------------------- classify
  const cfg = DEFAULTS.gaming;
  const fg = (p, extra = {}) => ({ pid: 10, path: p, title: 'x', cls: 'UnrealWindow', fs: false, d3dfs: false, ...extra });
  assert.equal(G.exeName('C:\\Games\\Elden Ring\\Game\\eldenring.exe'), 'eldenring');
  assert.equal(G.classify(fg('D:\\SteamLibrary\\steamapps\\common\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe'), cfg).why, 'library');
  assert.equal(G.classify(fg('C:\\XboxGames\\Forza Horizon 5\\Content\\ForzaHorizon5.exe'), cfg).game, true);
  assert.equal(G.classify(fg('C:\\Riot Games\\Riot Client\\RiotClientServices.exe'), cfg).game, false, 'launcher inside a library folder');
  assert.equal(G.classify(fg('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', { fs: true }), cfg, 60).game, false, 'browser fullscreen video');
  assert.equal(G.classify(fg('C:\\Program Files\\VideoLAN\\VLC\\vlc.exe', { fs: true, d3dfs: true }), cfg).game, false, 'player');
  assert.equal(G.classify(fg('E:\\Indie\\hollow_knight.exe', { fs: true }), cfg, 144).why, 'frames');
  assert.equal(G.classify(fg('E:\\Indie\\hollow_knight.exe', { fs: true }), cfg, 3).game, false, 'not presenting');
  assert.equal(G.classify(fg('E:\\Indie\\hollow_knight.exe', { fs: true }), cfg, 3).candidate, true);
  assert.equal(G.classify(fg('E:\\Old\\game.exe', { d3dfs: true }), cfg).why, 'exclusive');
  assert.equal(G.classify(fg('E:\\Emu\\retroarch.exe'), { ...cfg, games: ['RetroArch.exe'] }).why, 'list');
  assert.equal(G.classify(fg('D:\\steamapps\\common\\Tool\\tool.exe'), { ...cfg, ignore: ['tool'] }).game, false);
  assert.equal(G.classify(fg('C:\\Windows\\System32\\mmc.exe', { fs: true }), cfg, 60).game, false);
  assert.equal(G.classify(fg('C:\\x\\a.exe', { cls: 'Progman', fs: true }), cfg, 60).game, false);
  assert.deepEqual(G.cleanList(['A.EXE', 'a', ' C:\\x\\B.exe ', '', null]), ['a', 'b']);

  // ---------------------------------------------------------------- metrics merge
  const m = G.mergeMetrics({ fps: 143.6, low1: 97.2, ft: 6.96, src: 'etw', gpu: 40, gpuTemp: 66, gpuTempSrc: 'lhm', cpuTemp: 61.4, cpuTempSrc: 'hwinfo', vram: 3e9, vramTotal: 8e9, ping: -2 },
    { cpu: 33.3, ram: 61.2, ramUsed: 1, ramTotal: 2, gpu: 97, gpuTemp: 71, vramUsed: 6e9, vramTotal: 8.5e9, gpuPower: 120 }, { has: true, percent: 80, plugged: false });
  assert.equal(m.fps, 144); assert.equal(m.low1, 97); assert.equal(m.ft, 7);
  assert.equal(m.gpu, 97, 'nvidia-smi wins for usage'); assert.equal(m.gpuTemp, 71); assert.equal(m.gpuTempSrc, 'nvidia');
  assert.equal(m.vram, 6e9); assert.equal(m.cpuTemp, 61); assert.equal(m.cpuTempSrc, 'hwinfo'); assert.equal(m.ping, -1);
  assert.deepEqual(m.battery, { percent: 80, plugged: false });
  const m2 = G.mergeMetrics({ fps: -1, gpu: 12, gpuTemp: 55, gpuTempSrc: 'lhm', vram: 1e9 }, { cpu: 5, gpu: null, gpuTemp: null });
  assert.equal(m2.fps, null); assert.equal(m2.gpu, 12, 'PDH when there is no nvidia-smi'); assert.equal(m2.gpuTempSrc, 'lhm'); assert.equal(m2.ping, null);

  // ---------------------------------------------------------------- session summary
  const s = G.newSession({ name: 'g', pid: 5 }, 1000);
  G.accumulate(s, { fps: 100, cpu: 40, gpu: 90, cpuTemp: 70, gpuTemp: 75, ram: 50, savg: null, slow1: null });
  G.accumulate(s, { fps: 120, cpu: 60, gpu: 98, cpuTemp: 80, gpuTemp: 72, ram: 55, savg: 112, slow1: 70 });
  const sum = G.summarize(s, 1000 + 125000);
  assert.deepEqual([sum.dur, sum.avgFps, sum.low1, sum.avgCpu, sum.avgGpu, sum.maxCpuTemp, sum.maxGpuTemp, sum.maxRam], [125, 112, 70, 50, 94, 80, 75, 55]);

  // ---------------------------------------------------------------- the manager with a fake helper
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaming-'));
  const sent = [];
  const reg = {};
  const fakeExec = (file, args, opts, cb) => {
    if (typeof opts === 'function') { cb = opts; opts = {}; }
    if (file === 'reg.exe') {
      const key = `${args[1]}|${args[3]}`;
      if (args[0] === 'query') { if (key in reg) cb(null, `  ${args[3]}    REG_DWORD    0x${reg[key].toString(16)}\r\n`); else cb(new Error('none')); }
      else if (args[0] === 'add') { reg[key] = Number(args[7]); cb(null, ''); }
      else if (args[0] === 'delete') { delete reg[key]; cb(null, ''); }
      return;
    }
    cb(null, '');
  };
  reg['HKCU\\Software\\Microsoft\\GameBar|AutoGameModeEnabled'] = 0;
  const prio = {};
  const opened = [];
  let gm;
  const helper = {
    send(cmd, ...args) {
      sent.push([cmd, ...args]);
      const id = args[0];
      // answer the request/response commands like native/Game.cs does
      if (cmd === 'game.power') setImmediate(() => gm.onHelper(args[1] === 'perf'
        ? { type: 'game.result', id, op: 'power', ok: true, mode: 'high', prevScheme: '381b4222-f694-41f0-9685-ff5bb260df2e', prevOverlay: '' }
        : { type: 'game.result', id, op: 'powerRestore', ok: true, scheme: args[2].split('|')[0] }));
      if (cmd === 'game.trim') setImmediate(() => gm.onHelper({ type: 'game.result', id, op: 'trim', ok: true, count: 31, freed: 900e6 }));
      if (cmd === 'game.procs') setImmediate(() => gm.onHelper({ type: 'game.procs', id, list: [{ pid: 200, name: 'Discord', path: 'C:\\D\\Discord.exe', mem: 4e8 }, { pid: 201, name: 'Discord', path: 'C:\\D\\Discord.exe', mem: 1e8 }, { pid: 300, name: 'chrome', path: 'C:\\c.exe', mem: 2e9 }] }));
      if (cmd === 'game.close') setImmediate(() => gm.onHelper({ type: 'game.result', id, op: 'close', ok: true, closed: args[1].split(',').map(Number), failed: [] }));
      return true;
    },
  };
  gm = new G.Gaming({
    helper, dir, log: () => {}, platform: 'win32', execFile: fakeExec, ownPids: () => [1, 2], awayMs: 0,
    sysStats: async () => ({ cpu: 30, ram: 50, gpu: 95, gpuTemp: 70 }),
    setPriority: (pid, p) => { prio[pid] = p; }, getPriority: (pid) => prio[pid] || 0, openPath: (p) => opened.push(p),
  });
  const events = { hud: [], quiet: [], summary: [] };
  gm.on('hud', (v) => events.hud.push(v));
  gm.on('quiet', (v) => events.quiet.push(v));
  gm.on('summary', (v) => events.summary.push(v));
  gm.configure(deepMerge(DEFAULTS, { gaming: { closeList: ['discord'], optimize: { dvr: true } } }).gaming);
  const last = (cmd) => [...sent].reverse().find((x) => x[0] === cmd);
  assert.deepEqual(last('game.watch'), ['game.watch', '1'], 'auto detection watches the foreground');
  assert.deepEqual(last('game.fps'), ['game.fps', '1']);
  assert.deepEqual(last('game.metrics'), ['game.metrics', '0'], 'no sensor sampling while idle');

  // optimize before the game starts
  await gm.command('optimize');
  const steps = Object.fromEntries(gm.opt.steps.map((x) => [x.key, x.status]));
  assert.deepEqual(steps, { power: 'ok', gameMode: 'ok', close: 'ok', memory: 'ok', priority: 'later', dvr: 'ok' }); // 1.7.4: RivaTuner is only started for the "in-game" engine
  assert.equal(gm.opt.closed, 1, 'one app (two Discord processes)');
  assert.equal(gm.opt.freed, 900e6);
  assert.equal(reg['HKCU\\Software\\Microsoft\\GameBar|AutoGameModeEnabled'], 1);
  assert.equal(reg['HKCU\\System\\GameConfigStore|GameDVR_Enabled'], 0);
  const closeCmd = last('game.close');
  assert.equal(closeCmd[2], '200,201'); assert.equal(closeCmd[3], '0');
  assert(gm.manual && gm.active, 'optimizing turns gaming mode on');
  assert.deepEqual(last('game.metrics'), ['game.metrics', '1']);
  assert.deepEqual(last('game.ping'), ['game.ping', '8.8.8.8']);
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'gaming-restore.json'), 'utf8'));
  assert.equal(saved.power.scheme, '381b4222-f694-41f0-9685-ff5bb260df2e');
  assert.deepEqual(saved.closed, [{ name: 'Discord', path: 'C:\\D\\Discord.exe' }]);
  assert.equal(saved.gameMode, 0); assert.deepEqual(saved.dvr, [null, null]);

  // a game comes to the front: needs two ticks (splash screens), then the bar shows and priority is applied
  const game = { type: 'game.fg', pid: 777, path: 'D:\\steamapps\\common\\Game\\game.exe', title: 'My Game', cls: 'UnityWndClass', fs: true, d3dfs: false };
  gm.onHelper(game);
  assert.equal(gm.session, null);
  gm.onHelper({ type: 'game.metrics', pid: 777, fg: 777, fps: 120, src: 'etw' });
  assert(gm.session && gm.session.pid === 777);
  assert.deepEqual(last('game.track'), ['game.track', '777']);
  assert.equal(prio[777], -7, 'above normal');
  assert.deepEqual(events.hud, [true]); assert.deepEqual(events.quiet, [true]);
  for (let i = 0; i < 3; i++) { gm.onHelper({ type: 'game.metrics', pid: 777, fg: 777, fps: 100 + i * 20, src: 'etw', cpuTemp: 70 + i, savg: 118, slow1: 77 }); await wait(5); }
  assert(gm.session.n >= 3);
  // alt-tab to the desktop: bar and quiet mode go away, the session stays
  gm.onHelper({ type: 'game.fg', pid: 4, path: 'C:\\Windows\\explorer.exe', title: '', cls: 'Progman', fs: false });
  assert.equal(gm.hudVisible, false); assert.equal(gm.quiet, false); assert(gm.session);
  gm.onHelper({ ...game, type: 'game.fg' });
  assert.equal(gm.hudVisible, true);
  // the hotkey hides it, a new session resets that
  gm.toggleHud(); assert.equal(gm.hudVisible, false);
  gm.toggleHud(); assert.equal(gm.hudVisible, true);

  // the game exits: summary (needs >= 60 s), restore (power, registry, reopen apps), bar off
  gm.session.start -= 600000;
  gm.onHelper({ type: 'game.exit', pid: 777 });
  await wait(20);
  assert.equal(gm.session, null);
  assert.equal(events.summary.length, 1); assert.equal(events.summary[0].avgFps, 118); assert.equal(events.summary[0].low1, 77);
  assert.equal(gm.sessions.length, 1);
  assert(fs.existsSync(path.join(dir, 'gaming-sessions.json')));
  assert.equal(fs.existsSync(path.join(dir, 'gaming-restore.json')), false, 'restore info removed');
  assert.deepEqual(last('game.power').slice(2), ['restore', '381b4222-f694-41f0-9685-ff5bb260df2e|']);
  assert.equal(reg['HKCU\\Software\\Microsoft\\GameBar|AutoGameModeEnabled'], 0);
  assert.equal('HKCU\\System\\GameConfigStore|GameDVR_Enabled' in reg, false, 'absent value deleted again');
  assert.deepEqual(opened, ['C:\\D\\Discord.exe']);
  assert.equal(gm.hudVisible, false); assert.equal(gm.manual, false);
  assert.deepEqual(last('game.track'), ['game.track', '0']);

  // not a game: a fullscreen app that doesn't present frames becomes a candidate, "yes" goes to the list
  gm.onHelper({ type: 'game.fg', pid: 900, path: 'E:\\x\\emu.exe', title: 'Emu', cls: 'SDL_app', fs: true });
  gm.onHelper({ type: 'game.metrics', pid: 900, fg: 900, fps: 0, src: 'etw' });
  assert.deepEqual(gm.candidate, { name: 'emu', title: 'Emu' });
  assert.deepEqual(await gm.command('markGame', { name: 'emu' }), { list: 'games', name: 'emu' });

  // disabling everything stops the helper side
  gm.configure({ ...gm.cfg, enabled: false });
  assert.deepEqual(last('game.watch'), ['game.watch', '0']);
  assert.deepEqual(last('game.fps'), ['game.fps', '0']);

  // a crash during a game: the next start restores what was changed
  fs.writeFileSync(path.join(dir, 'gaming-restore.json'), JSON.stringify({ power: { scheme: 'aaaaaaaa-0000-0000-0000-000000000000', overlay: '' } }));
  sent.length = 0;
  const gm2 = new G.Gaming({ helper, dir, log: () => {}, platform: 'win32', execFile: fakeExec });
  gm = gm2;
  gm2.configure(DEFAULTS.gaming);
  gm2.onHelperReady();
  await wait(20);
  assert(sent.some((x) => x[0] === 'game.power' && x[2] === 'restore'));
  assert.equal(fs.existsSync(path.join(dir, 'gaming-restore.json')), false);
  gm2.dispose();
  fs.rmSync(dir, { recursive: true, force: true });

  // ---------------------------------------------------------------- settings + strings
  assert.equal(DEFAULTS.gaming.hud.hotkey, 'Control+Shift+G');
  const merged = deepMerge(DEFAULTS, { gaming: { hud: { opacity: '55', metrics: ['fps'] }, optimize: { priority: 'high' } } });
  assert.equal(merged.gaming.hud.opacity, 55); assert.deepEqual(merged.gaming.hud.metrics, ['fps']); assert.equal(merged.gaming.optimize.memory, true);
  const src = fs.readFileSync(path.join(root, 'src/shared/strings.js'), 'utf8');
  const keys = [...src.matchAll(/^ {2}([A-Za-z_0-9]+): \[/gm)].map((x) => x[1]);
  assert.equal(new Set(keys).size, keys.length, 'unique string keys');
  for (const lang of ['en', 'ar', 'tr', 'es', 'ru', 'zh']) {
    const S = strings(lang);
    for (const k of ['gaming', 'gmTitle', 'gmOptimize', 'gmBar', 'gamingNav', 'gamingText', 'gx_fps', 'gx_cpuTemp', 'gmStep_power', 'gmS_power', 'gmSessionEnded', 't_gaming']) assert(S[k] && S[k] !== k, `${lang}.${k}`);
  }
  const gameCs = fs.readFileSync(path.join(root, 'native/Game.cs'), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  for (const bad of ['$"', '?.', 'nameof(', '=> ', 'out var ']) assert(!gameCs.includes(bad), `Game.cs must stay C# 5 (${bad})`);
  const ps = fs.readFileSync(path.join(root, 'native/helper.ps1'), 'utf8');
  assert(ps.includes("Import-NativeModule 'island-game' 'Game.cs'") && ps.includes('[IslandGame.Game]::Command'));

  console.log('v1.7 gaming checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
