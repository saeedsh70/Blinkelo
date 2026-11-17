'use strict';
// 1.7.1: game library (Steam / Epic / GOG / played / added), launching from the island, RivaTuner OSD for exclusive fullscreen.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '..');
const lib = require(path.join(root, 'src/main/gamelib.js'));
const G = require(path.join(root, 'src/main/gaming.js'));
const { DEFAULTS, deepMerge } = require(path.join(root, 'src/main/settings.js'));
const { strings } = require(path.join(root, 'src/shared/strings.js'));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const put = (f, data = '') => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };

(async () => {
  // ---------------------------------------------------------------- parsers
  const vdf = '"libraryfolders"\n{\n\t"0"\n\t{\n\t\t"path"\t\t"C:\\\\Program Files (x86)\\\\Steam"\n\t}\n\t"1"\n\t{\n\t\t"path"\t\t"D:\\\\SteamLibrary"\n\t}\n}';
  assert.deepEqual(lib.vdfPairs(vdf).filter(([k]) => k === 'path').map(([, v]) => v), ['C:\\Program Files (x86)\\Steam', 'D:\\SteamLibrary']);
  assert.equal(lib.iconPath('"C:\\Games\\x.exe",0'), 'C:\\Games\\x.exe');
  assert.equal(lib.iconPath('C:\\Steam\\steam\\games\\abc.ico'), 'C:\\Steam\\steam\\games\\abc.ico');

  // ---------------------------------------------------------------- a fake PC
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gamelib-'));
  const steam = path.join(tmp, 'Steam');
  const lib2 = path.join(tmp, 'SteamLibrary');
  put(path.join(steam, 'steamapps', 'libraryfolders.vdf'), `"libraryfolders"{"0"{"path" "${steam.replace(/\\/g, '\\\\')}"} "1"{"path" "${lib2.replace(/\\/g, '\\\\')}"}}`);
  const acf = (id, name, dir, flags = 4) => `"AppState"\n{\n\t"appid"\t\t"${id}"\n\t"name"\t\t"${name}"\n\t"StateFlags"\t\t"${flags}"\n\t"installdir"\t\t"${dir}"\n}`;
  put(path.join(steam, 'steamapps', 'appmanifest_1091500.acf'), acf('1091500', 'Cyberpunk 2077', 'Cyberpunk 2077'));
  put(path.join(steam, 'steamapps', 'common', 'Cyberpunk 2077', 'bin', 'x64', 'Cyberpunk2077.exe'), Buffer.alloc(90000));
  put(path.join(steam, 'steamapps', 'common', 'Cyberpunk 2077', 'bin', 'x64', 'CrashReporter.exe'), Buffer.alloc(200000));
  put(path.join(steam, 'steamapps', 'appmanifest_228980.acf'), acf('228980', 'Steamworks Common Redistributables', 'Steamworks Shared'));
  put(path.join(steam, 'steamapps', 'common', 'Steamworks Shared', 'x.exe'), 'x');
  put(path.join(lib2, 'steamapps', 'appmanifest_1245620.acf'), acf('1245620', 'ELDEN RING', 'ELDEN RING'));
  put(path.join(lib2, 'steamapps', 'common', 'ELDEN RING', 'Game', 'eldenring.exe'), Buffer.alloc(50000));
  put(path.join(lib2, 'steamapps', 'appmanifest_570.acf'), acf('570', 'Dota 2', 'dota 2 beta', 2)); // still downloading
  put(path.join(lib2, 'steamapps', 'common', 'dota 2 beta', 'dota2.exe'), 'x');
  const eldenIco = path.join(steam, 'steam', 'games', 'elden.ico');
  put(eldenIco, 'ico');
  put(path.join(steam, 'appcache', 'librarycache', '1091500_library_600x900.jpg'), 'jpg');
  const pd = path.join(tmp, 'ProgramData');
  const fnDir = path.join(tmp, 'Epic Games', 'Fortnite');
  put(path.join(fnDir, 'FortniteGame', 'Binaries', 'Win64', 'FortniteClient-Win64-Shipping.exe'), 'x');
  put(path.join(pd, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests', 'A.item'), JSON.stringify({ DisplayName: 'Fortnite', InstallLocation: fnDir, LaunchExecutable: 'FortniteGame/Binaries/Win64/FortniteClient-Win64-Shipping.exe', CatalogNamespace: 'fn', CatalogItemId: '4fe7', AppName: 'Fortnite', AppCategories: ['public', 'games', 'applications'] }));
  put(path.join(pd, 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests', 'B.item'), JSON.stringify({ DisplayName: 'Unreal Engine', InstallLocation: fnDir, AppName: 'UE_5', AppCategories: ['engines'] }));
  // the folder name must not match gaming.js LIB_RE ("GOG Games" does), or the "no library dirs" check below cannot pass on Windows
  const gogExe = path.join(tmp, 'GOGLib', 'Witcher 3', 'bin', 'x64', 'witcher3.exe');
  put(gogExe, 'x');
  const valo = path.join(tmp, 'Riot Games', 'VALORANT', 'live', 'VALORANT.exe');
  put(valo, 'x');
  const retro = path.join(tmp, 'Emu', 'retroarch.exe');
  put(retro, 'x');
  const reg = {
    steam, programData: pd,
    gog: [{ id: '1207664663', name: 'The Witcher 3', exe: gogExe, path: path.join(tmp, 'GOGLib', 'Witcher 3'), args: '' }, { id: '9', name: 'DLC', exe: gogExe, path: '', dlc: '1207664663' }],
    ubi: [], uninstall: [{ key: 'Steam App 1245620', name: 'ELDEN RING', icon: `"${eldenIco}",0`, loc: '' }], rtss: '',
  };
  const sessions = [
    { name: 'eldenring', title: 'ELDEN RING', path: path.join(lib2, 'steamapps', 'common', 'ELDEN RING', 'Game', 'eldenring.exe'), end: 5000 },
    { name: 'valorant', title: 'VALORANT', path: valo, end: 9000 },
    { name: 'gone', title: 'Old', path: path.join(tmp, 'nope.exe'), end: 1 },
  ];
  const games = await lib.scan({ reg, sessions, custom: [{ name: 'RetroArch', path: retro }] });
  const by = Object.fromEntries(games.map((g) => [g.name, g]));
  assert.deepEqual(Object.keys(by).sort(), ['Cyberpunk 2077', 'ELDEN RING', 'Fortnite', 'RetroArch', 'The Witcher 3', 'VALORANT']);
  assert.equal(games[0].name, 'VALORANT', 'most recently played first');
  assert.equal(games[1].name, 'ELDEN RING');
  assert.equal(by['ELDEN RING'].icon, eldenIco, 'Steam uninstall icon');
  assert.equal(by['ELDEN RING'].launch.target, 'steam://rungameid/1245620');
  assert(by['Cyberpunk 2077'].icon.endsWith('Cyberpunk2077.exe'), 'game exe, not the crash reporter');
  assert(by['Cyberpunk 2077'].cover.endsWith('1091500_library_600x900.jpg'));
  assert.equal(by.Fortnite.launch.target, 'com.epicgames.launcher://apps/fn%3A4fe7%3AFortnite?action=launch&silent=true');
  assert.deepEqual([by['The Witcher 3'].source, by['The Witcher 3'].launch.kind, by['The Witcher 3'].launch.target], ['gog', 'exe', gogExe]);
  assert.deepEqual([by.VALORANT.source, by.VALORANT.launch.target], ['played', valo]);
  assert.equal(by.RetroArch.source, 'custom');

  // ---------------------------------------------------------------- detection by library folder
  const dirs = games.filter((g) => !['custom', 'played'].includes(g.source)).map((g) => g.dir.toLowerCase() + path.sep);
  const w3 = { pid: 1, path: gogExe, title: 'The Witcher 3', cls: 'W', fs: false };
  assert.equal(G.classify(w3, DEFAULTS.gaming, null, dirs).why, 'library');
  assert.equal(G.classify(w3, DEFAULTS.gaming, null, []).game, false);

  // ---------------------------------------------------------------- RivaTuner text
  const txt = G.osdText({ fps: 61, low1: 28, fpsSrc: 'etw', cpu: 40, cpuTemp: 91, gpu: 99, gpuTemp: 70, vram: 6e9, vramTotal: 8 * 1073741824, ram: 50, ping: -1 },
    { hud: { metrics: ['fps', 'low1', 'cpu', 'cpuTemp', 'gpu', 'gpuTemp', 'vram', 'ram', 'ping'] }, temp: 'c' });
  assert(txt.includes('<C=34D399>61<C>') && txt.includes('<C=FB7185>28<C>'), 'fps colours');
  assert(txt.includes('<C=FB7185>91°<C>'), 'hot CPU in red');
  assert(txt.includes('5.6/8G') && txt.includes('<C=FB7185>x<C>'));
  assert(!/[\u06F0-\u06F9]/.test(G.osdText({ fps: 60, fpsSrc: 'etw' }, { hud: { metrics: ['fps'] } })), 'Latin digits only');
  assert(G.osdText({ cpuTemp: 50 }, { hud: { metrics: ['cpuTemp'] }, temp: 'f' }).includes('122°F'));

  // ---------------------------------------------------------------- manager: library, launch, OSD switch-over
  const rtssDir = path.join(tmp, 'RTSS');
  put(path.join(rtssDir, 'RTSS.exe'), 'x');
  const sent = [];
  const shellOpened = [];
  const launched = [];
  let gm;
  const helper = {
    send(cmd, ...args) {
      sent.push([cmd, ...args]);
      const id = args[0];
      const reply = (m) => setImmediate(() => gm.onHelper(m));
      if (cmd === 'game.lib') reply({ type: 'game.lib', id, ...reg, rtss: rtssDir });
      if (cmd === 'game.power') reply({ type: 'game.result', id, ok: true, mode: 'already' });
      if (cmd === 'game.trim') reply({ type: 'game.result', id, ok: true, freed: 1 });
      return true;
    },
  };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaming-'));
  gm = new G.Gaming({
    helper, dir, log: () => {}, platform: 'win32', execFile: (f, a, o, cb) => (typeof o === 'function' ? o : cb)(new Error('no reg')),
    sysStats: async () => ({}), openShell: (p) => shellOpened.push(p), launch: async (l) => { launched.push(l); return true; },
  });
  const winEvents = [];
  gm.on('hud', (v) => winEvents.push(v));
  gm.configure(deepMerge(DEFAULTS, { gaming: { hidden: ['steam:1091500'] } }).gaming);
  const pub = await gm.command('library', {});
  assert.equal(pub.length, 4, 'played/custom only come from history and settings');
  assert.equal(pub.find((g) => g.id === 'steam:1091500').hidden, true);
  assert.equal(gm.rtssExe, path.join(rtssDir, 'RTSS.exe'));
  assert(gm.libDirs.length >= 4);

  // launching optimizes first (RivaTuner is started only for the "in-game" engine), then starts the game
  gm.configure({ ...gm.cfg, hud: { ...gm.cfg.hud, engine: 'rtss' } });
  const r = await gm.command('launch', { id: 'steam:1245620' });
  assert.deepEqual(r, { ok: true, name: 'ELDEN RING' });
  assert.equal(launched[0].target, 'steam://rungameid/1245620');
  assert.deepEqual(shellOpened, [path.join(rtssDir, 'RTSS.exe')]);
  assert(gm.opt.steps.some((x) => x.key === 'rtss' && x.status === 'ok'));
  assert(gm.manual, 'launching turns gaming mode on');
  await gm.command('launch', { id: 'gog:1207664663' });
  assert.equal(launched[1].kind, 'exe');
  assert.equal(shellOpened.length, 1, 'no second optimize while the first is still applied');
  gm.configure({ ...gm.cfg, hud: { ...gm.cfg.hud, engine: 'auto' } });

  // the game shows up borderless: window bar; then switches to exclusive fullscreen: RivaTuner
  const fg = { type: 'game.fg', pid: 50, path: by['ELDEN RING'].icon.replace(/steam.games.elden\.ico$/, ''), title: 'ELDEN RING', cls: 'E', fs: true, d3dfs: false };
  fg.path = path.join(lib2, 'steamapps', 'common', 'ELDEN RING', 'Game', 'eldenring.exe');
  gm.onHelper(fg);
  gm.onHelper({ type: 'game.metrics', pid: 50, fg: 50, fps: 60, src: 'etw', rtss: true });
  await wait(10);
  assert(gm.session && gm.session.pid === 50, 'detected through the library folder');
  assert.deepEqual(winEvents, [true], 'window bar while borderless');
  const before = sent.length;
  gm.onHelper({ ...fg, d3dfs: true });
  assert.equal(gm.osdOn, true, 'Direct3D full screen and RivaTuner is running: text inside the game');
  assert.deepEqual(winEvents, [true, false], 'window bar hidden, RivaTuner draws inside the game');
  const osdCmd = sent.slice(before).find((x) => x[0] === 'game.osd');
  assert(osdCmd && osdCmd[1].includes('FPS'), 'text sent to RivaTuner');
  gm.onHelper({ type: 'game.metrics', pid: 50, fg: 50, fps: 144, src: 'etw', rtss: true }); // the helper reports RivaTuner every tick
  await wait(10);
  assert(sent.filter((x) => x[0] === 'game.osd').pop()[1].includes('144'), 'updated every tick');
  assert.equal(gm.publicState().osd, 'on');
  gm.onHelper({ type: 'game.osd', ok: false }); // RivaTuner closed
  assert.deepEqual(winEvents, [true, false, true], 'window bar back as a fallback');
  assert.equal(gm.publicState().osd, 'missing');
  assert.equal(gm.publicState().fullscreen, true);
  gm.onHelper({ ...fg, d3dfs: false });
  assert.deepEqual(sent.filter((x) => x[0] === 'game.osd').pop(), ['game.osd', ''], 'OSD slot released');
  assert.equal(gm.osdOn, false);
  // "In-game" engine: RivaTuner even when borderless
  gm.configure({ ...gm.cfg, hud: { ...gm.cfg.hud, engine: 'rtss' } });
  assert.equal(gm.osdOn, true);
  gm.configure({ ...gm.cfg, hud: { ...gm.cfg.hud, engine: 'window' } });
  assert.equal(gm.osdOn, false);
  gm.dispose();
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.rmSync(dir, { recursive: true, force: true });

  // ---------------------------------------------------------------- settings / strings / native
  assert.equal(DEFAULTS.gaming.hud.engine, 'auto');
  assert.equal(DEFAULTS.gaming.optimizeOnLaunch, true);
  for (const lang of ['en', 'ar', 'tr', 'es', 'ru', 'zh']) {
    const S = strings(lang);
    for (const k of ['gmLibEmpty', 'gmAddGame', 'gmLaunching', 'gmBarRtss', 'gmRtssMissing', 'gmEngine', 'gmRtssHint', 'gmLibrary', 'gmSrc_played', 'gmStep_rtss', 'gmS_rtss']) assert(S[k] && S[k] !== k, `${lang}.${k}`);
  }
  const cs = fs.readFileSync(path.join(root, 'native/Game.cs'), 'utf8');
  assert(cs.includes('"RTSSSharedMemoryV2"') && cs.includes('case "game.osd"') && cs.includes('case "game.lib"'));
  assert(cs.includes('WriteAnsi(new IntPtr(e.ToInt64() + 512), text, 4096)'), 'szOSDEx at offset 512');
  console.log('v1.7.1 library + RivaTuner overlay checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
