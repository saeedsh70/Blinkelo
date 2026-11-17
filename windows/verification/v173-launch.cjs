'use strict';
// 1.7.3: starting a game from the Gaming tab.
//  - a GOG game that was played before starts with the executable that really ran (the registered one may be a
//    pre-launcher stub); the registered entry is the fallback
//  - GOG games start in their registered working folder, else beside the executable (not in the install root)
//  - a process that ends almost at once without the game coming up makes the next entry start
//  - every attempt is logged with target, folder and pid
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '..');
const lib = require(path.join(root, 'src/main/gamelib.js'));
const G = require(path.join(root, 'src/main/gaming.js'));
const tick = () => new Promise((r) => setImmediate(r));

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'launch-'));
  const put = (f) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, 'x'); return f; };
  const w3 = path.join(tmp, 'GOG Games', 'The Witcher 3');
  const stub = put(path.join(w3, 'REDprelauncher.exe'));
  const game = put(path.join(w3, 'bin', 'x64', 'witcher3.exe'));
  const cp = path.join(tmp, 'GOG Games', 'Cyberpunk');
  const cpExe = put(path.join(cp, 'bin', 'x64', 'Cyberpunk2077.exe'));
  const old = path.join(tmp, 'GOG Games', 'Gothic');
  const oldExe = put(path.join(old, 'system', 'Gothic.exe'));
  const reg = {
    steam: '', programData: path.join(tmp, 'pd'), ubi: [], uninstall: [], rtss: '',
    gog: [
      { id: '1', name: 'The Witcher 3: Wild Hunt', exe: stub, path: w3, args: '', workingDir: w3 },
      { id: '2', name: 'Cyberpunk 2077', exe: cpExe, path: cp, args: '--launcher-skip', workingDir: '' },
      { id: '3', name: 'Gothic', exe: oldExe, path: old, args: '', workingDir: path.join(old, 'system') },
    ],
  };
  const sessions = [
    { name: 'witcher3', title: 'The Witcher 3', path: game, end: 9000 },
    { name: 'witcher3', title: 'The Witcher 3', path: path.join(w3, 'bin', 'x64_dx12', 'witcher3.exe'), end: 100 }, // older, file gone
    { name: 'cyberpunk2077', title: 'Cyberpunk 2077', path: cpExe, end: 5000 },
  ];
  const games = await lib.scan({ reg, sessions, custom: [] });
  const by = Object.fromEntries(games.map((g) => [g.id, g]));

  // played before: the real executable first, the registered entry as the fallback
  assert.deepEqual(by['gog:1'].launch, { kind: 'exe', target: game, args: '', cwd: path.dirname(game), why: 'played' });
  assert.deepEqual(by['gog:1'].fallback, { kind: 'exe', target: stub, args: '', cwd: w3 });
  assert.equal(by['gog:1'].playedExe, undefined, 'no scratch fields left on the entry');
  // played with the registered executable itself: nothing changes, arguments are kept
  assert.equal(by['gog:2'].launch.target, cpExe);
  assert.equal(by['gog:2'].launch.args, '--launcher-skip');
  assert.equal(by['gog:2'].fallback, undefined);
  assert.equal(by['gog:2'].launch.cwd, path.dirname(cpExe), 'no registered working folder: beside the executable, not the install root');
  // never played: registered entry with its registered working folder
  assert.equal(by['gog:3'].launch.target, oldExe);
  assert.equal(by['gog:3'].launch.cwd, path.join(old, 'system'));
  assert.equal(by['gog:3'].fallback, undefined);

  // ---------------------------------------------------------------- manager
  const make = (launcher) => {
    const logs = [];
    const gm = new G.Gaming({ helper: { send: () => true }, dir: fs.mkdtempSync(path.join(os.tmpdir(), 'gm-')), platform: 'linux',
      log: (...a) => logs.push(a.join(' ')), launch: launcher });
    gm.configure({ enabled: true, optimizeOnLaunch: false, hud: { metrics: [] }, optimize: {} });
    gm.library = games;
    return { gm, logs };
  };

  // 1) the played executable ends at once with an error and no game appears -> the registered launcher is started
  {
    const calls = [];
    let end;
    const { gm, logs } = make(async (l) => { calls.push(l); return calls.length === 1 ? { ok: true, pid: 11, exited: new Promise((r) => { end = r; }) } : { ok: true, pid: 12, exited: Promise.resolve(null) }; });
    const r = await gm.command('launch', { id: 'gog:1' });
    assert.deepEqual(r, { ok: true, name: 'The Witcher 3: Wild Hunt' });
    assert.equal(calls.length, 1);
    assert(logs.some((x) => x.includes(game) && x.includes('[played]') && x.includes('pid=11') && x.includes(`cwd=${path.dirname(game)}`)), 'the attempt is logged with target, folder and pid');
    end({ code: 1, ms: 300 });
    await tick(); await tick();
    assert.equal(calls.length, 2);
    assert.equal(calls[1].target, stub);
    assert(logs.some((x) => /process ended/.test(x) && /300 ms, code 1/.test(x)));
    gm.dispose();
  }

  // 2) it ends quickly but the game is in front (a launcher that hands over): nothing else is started
  {
    const calls = [];
    let end;
    const { gm } = make(async (l) => { calls.push(l); return { ok: true, pid: 21, exited: new Promise((r) => { end = r; }) }; });
    await gm.command('launch', { id: 'gog:1' });
    gm.fg = { pid: 99, path: path.join(w3, 'bin', 'x64_dx12', 'witcher3.exe'), title: 'The Witcher 3', cls: 'W', fs: true, d3dfs: false };
    end({ code: 0, ms: 2000 });
    await tick(); await tick();
    assert.equal(calls.length, 1);
    gm.dispose();
  }

  // 3) the first entry cannot be started at all -> the fallback right away; a plain true/false launcher still works
  {
    const calls = [];
    const { gm } = make(async (l) => { calls.push(l); return calls.length > 1; });
    const r = await gm.command('launch', { id: 'gog:1' });
    assert.equal(r.ok, true);
    assert.deepEqual(calls.map((c) => c.target), [game, stub]);
    gm.dispose();
  }

  // 4) only one entry and it ends with an error: one more try through the shell; a clean exit is left alone
  {
    const calls = [];
    const ends = [];
    const { gm } = make(async (l) => { calls.push(l); return { ok: true, pid: 31, exited: new Promise((r) => ends.push(r)) }; });
    await gm.command('launch', { id: 'gog:3' });
    ends[0]({ code: 3221225781, ms: 150 }); // 0xC0000135: a DLL was not found
    await tick(); await tick();
    assert.equal(calls.length, 2);
    assert.deepEqual([calls[1].kind, calls[1].target, calls[1].why], ['open', oldExe, 'shell']);
    ends[1]({ code: 1, ms: 100 });
    await tick(); await tick();
    assert.equal(calls.length, 2, 'the shell try is the last one');
    gm.dispose();

    const calls2 = [];
    let end2;
    const b = make(async (l) => { calls2.push(l); return { ok: true, pid: 41, exited: new Promise((r) => { end2 = r; }) }; });
    await b.gm.command('launch', { id: 'gog:3' });
    end2({ code: 0, ms: 900 });
    await tick(); await tick();
    assert.equal(calls2.length, 1, 'a launcher that hands over and exits cleanly is not started twice');
    b.gm.dispose();
  }

  // 5) nothing could be started
  {
    const { gm } = make(async () => false);
    assert.equal((await gm.command('launch', { id: 'gog:1' })).ok, false);
    gm.dispose();
  }

  // ---------------------------------------------------------------- source guards
  const main = fs.readFileSync(path.join(root, 'src/main/main.js'), 'utf8');
  assert(/env: launchEnv\(\)/.test(main), 'games do not inherit the Chromium / Electron environment');
  assert(/resolve\(\{ ok: true, pid: child\.pid, exited \}\)/.test(main));
  assert(/S\("workingDir", Str\(k, "workingDir"\)\)/.test(fs.readFileSync(path.join(root, 'native/Game.cs'), 'utf8')), 'the GOG working folder is read');

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('v1.7.3 launch checks passed (played executable first, working folder, fallback on a quick exit, logging)');
})().catch((e) => { console.error(e); process.exit(1); });
