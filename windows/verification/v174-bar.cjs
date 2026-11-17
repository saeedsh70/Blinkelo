'use strict';
// 1.7.4: the island's own bar is the default over every game; RivaTuner is no longer needed in "auto".
//  - "Direct3D full screen" alone (fullscreen optimizations) keeps the window bar
//  - only real exclusive ownership of the display (xfs) switches to the RivaTuner text, with the window bar as fallback
//  - the optimizer starts RivaTuner only for the "in-game" engine
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.resolve(__dirname, '..');
const G = require(path.join(root, 'src/main/gaming.js'));
const { DEFAULTS } = require(path.join(root, 'src/main/settings.js'));
const { strings } = require(path.join(root, 'src/shared/strings.js'));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const sent = [];
  const logs = [];
  const shell = [];
  let gm;
  const helper = { send(cmd, ...a) {
    sent.push([cmd, ...a]);
    if (cmd === 'game.lib') setImmediate(() => gm.onHelper({ type: 'game.lib', id: a[0], steam: '', gog: [], ubi: [], uninstall: [], rtss: rtssDir, programData: os.tmpdir() }));
    else if (['game.power', 'game.trim', 'game.procs', 'game.close'].includes(cmd)) setImmediate(() => gm.onHelper({ type: cmd === 'game.procs' ? 'game.procs' : 'game.result', id: a[0], ok: true, mode: 'already', list: [] }));
    return true;
  } };
  const rtssDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtss-'));
  fs.writeFileSync(path.join(rtssDir, 'RTSS.exe'), 'x');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bar-'));
  gm = new G.Gaming({ helper, dir, platform: 'win32', log: (...a) => logs.push(a.join(' ')), openShell: (p) => shell.push(p),
    execFile: (f, a, o, cb) => (typeof o === 'function' ? o : cb)(new Error('no reg')), sysStats: async () => ({}) });
  const win = [];
  gm.on('hud', (v) => win.push(v));
  gm.configure(JSON.parse(JSON.stringify(DEFAULTS.gaming)));
  assert.equal(gm.osdEngine(), 'auto');
  await gm.refreshLibrary(true);
  assert.equal(gm.rtssExe, path.join(rtssDir, 'RTSS.exe'), 'RivaTuner is installed on this PC');

  // optimizing in "auto" does not start RivaTuner, even though it is installed
  await gm.command('optimize');
  assert(!gm.opt.steps.some((s) => s.key === 'rtss'));
  assert.deepEqual(shell, []);

  // a game in "fullscreen" as Windows reports it (d3dfs) but without exclusive ownership: the island's own bar
  const fg = { type: 'game.fg', pid: 7, path: 'C:\\Games\\The Witcher 3 - Wild Hunt\\bin\\x64\\witcher3.exe', title: 'The Witcher 3', cls: 'W2ViewportClass', fs: true, d3dfs: true, xfs: false };
  gm.onHelper(fg);
  gm.onHelper({ type: 'game.metrics', pid: 7, fg: 7, fps: 60, src: 'etw' });
  gm.onHelper({ type: 'game.metrics', pid: 7, fg: 7, fps: 60, src: 'etw' });
  await wait(10);
  assert(gm.session, 'session started');
  assert.deepEqual(win, [true], 'window bar shown');
  assert.equal(gm.osdOn, false);
  assert(!sent.some((x) => x[0] === 'game.osd' && x[1]), 'nothing is sent to RivaTuner');
  assert.equal(gm.publicState().exclusive, false);
  assert(logs.some((x) => /^game started witcher3 .*fs=1 d3dfs=1 exclusive=0/.test(x)), 'the display mode is logged with the session');
  assert(logs.some((x) => /^game bar window fs=1 d3dfs=1 exclusive=0/.test(x)), 'the bar engine is logged');

  // the game really owns the display: RivaTuner is tried; it is not running -> the window bar stays as the fallback
  gm.onHelper({ ...fg, xfs: true });
  assert.equal(gm.osdOn, true);
  assert.deepEqual(win, [true, false]);
  gm.onHelper({ type: 'game.osd', ok: false });
  assert.deepEqual(win, [true, false, true]);
  assert.equal(gm.publicState().osd, 'missing');
  assert.equal(gm.publicState().exclusive, true);
  // RivaTuner is started by the user later: the in-game text takes over
  gm.onHelper({ type: 'game.osd', ok: true });
  assert.deepEqual(win, [true, false, true, false]);
  assert(logs.some((x) => /^game bar rivatuner .*exclusive=1/.test(x)));
  // back to a composed mode
  gm.onHelper({ ...fg, xfs: false });
  assert.equal(gm.osdOn, false);
  assert.deepEqual(win, [true, false, true, false, true]);

  // "in-game" engine: the optimizer may start RivaTuner
  await gm.command('restore');
  gm.configure({ ...gm.cfg, hud: { ...gm.cfg.hud, engine: 'rtss' } });
  await gm.command('optimize');
  assert(gm.opt.steps.some((s) => s.key === 'rtss' && s.status === 'ok'));
  assert.deepEqual(shell, [path.join(rtssDir, 'RTSS.exe')]);
  gm.dispose();

  // ---------------------------------------------------------------- source guards / strings
  const cs = fs.readFileSync(path.join(root, 'native/Game.cs'), 'utf8');
  assert(/D3DKMTCheckExclusiveOwnership\(\);/.test(cs));
  assert(/bool xfs = q == 3 && Exclusive\(\);/.test(cs));
  assert(/\.B\("xfs", xfs\)/.test(cs));
  const main = fs.readFileSync(path.join(root, 'src/main/main.js'), 'utf8');
  assert(/gamebarTopTimer = setInterval\(raiseGamebar, 2000\)/.test(main), 'the bar is kept above the game');
  for (const lang of ['en', 'ar', 'tr', 'es', 'ru', 'zh']) {
    const S = strings(lang);
    assert(/Borderless/.test(S.gmRtssMissing), `${lang}: the exclusive-fullscreen hint names the fix`);
    assert(S.gmEngHint && S.gmEngHint.includes('RivaTuner'));
  }
  for (const b of ['src/renderer/island/island.bundle.js', 'src/renderer/settings/settings.js']) {
    assert(/gmRtssMissing: \[[^\n]*Borderless to see the bar/.test(fs.readFileSync(path.join(root, b), 'utf8')), `${b} was rebuilt`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(rtssDir, { recursive: true, force: true });
  console.log('v1.7.4 bar checks passed (own bar by default, RivaTuner only for real exclusive fullscreen or by choice)');
})().catch((e) => { console.error(e); process.exit(1); });
