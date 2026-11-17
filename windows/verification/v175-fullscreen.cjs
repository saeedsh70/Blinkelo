'use strict';
// 1.7.5: real "Full Screen" games.
//  - Windows reports Direct3D full screen (d3dfs) and RivaTuner is running -> the text inside the game ("auto"),
//    because a window can't be seen over a game that owns the display and that can't be detected reliably
//  - RivaTuner closes -> the island's window bar again; "window" engine always keeps the window bar
//  - the game losing the foreground for a moment no longer makes the bar flicker (grace period)
//  - foreground changes during a session are logged; the helper probes RivaTuner every tick
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-'));
  const gm = new G.Gaming({ helper: { send: (...a) => { sent.push(a); return true; } }, dir, platform: 'win32', awayMs: 60,
    log: (...a) => logs.push(a.join(' ')), execFile: (f, a, o, cb) => (typeof o === 'function' ? o : cb)(new Error('no')), sysStats: async () => ({}) });
  const hud = [];
  const quiet = [];
  gm.on('hud', (v) => hud.push(v));
  gm.on('quiet', (v) => quiet.push(v));
  gm.configure(JSON.parse(JSON.stringify(DEFAULTS.gaming)));
  const w3 = { type: 'game.fg', pid: 33, path: 'C:\\Games\\The Witcher 3 - Wild Hunt\\bin\\x64\\witcher3.exe', title: 'The Witcher 3', cls: 'W2ViewportClass', fs: true, d3dfs: true, xfs: false };
  const tickM = (rtss) => gm.onHelper({ type: 'game.metrics', pid: 33, fg: 33, fps: 60, src: 'etw', rtss });
  const osdSent = () => sent.filter((x) => x[0] === 'game.osd');

  // real Full Screen, RivaTuner not running: the island's bar (nothing else could be shown)
  gm.onHelper(w3); tickM(false); tickM(false);
  await wait(5);
  assert(gm.session, 'session');
  assert.deepEqual(hud, [true]);
  assert.equal(gm.osdOn, false);
  assert.equal(gm.publicState().fullscreen, true);

  // RivaTuner starts: the text moves inside the game
  tickM(true);
  await wait(5);
  assert.equal(gm.osdOn, true);
  assert.deepEqual(hud, [true, false]);
  assert(osdSent().pop()[1].includes('FPS'));
  assert(logs.includes('rivatuner running'));
  // RivaTuner closes: back to the island's bar, the RivaTuner slot is released
  tickM(false);
  await wait(5);
  assert.equal(gm.osdOn, false);
  assert.deepEqual(osdSent().pop(), ['game.osd', '']);
  assert.deepEqual(hud, [true, false, true]);

  // "window" engine: never RivaTuner, even in Full Screen with RivaTuner running
  gm.configure({ ...gm.cfg, hud: { ...gm.cfg.hud, engine: 'window' } });
  tickM(true);
  await wait(5);
  assert.equal(gm.osdOn, false);
  gm.configure({ ...gm.cfg, hud: { ...gm.cfg.hud, engine: 'auto' } });
  assert.equal(gm.osdOn, true, 'auto again');
  tickM(false);
  await wait(5);

  // the foreground leaves the game for a moment: no flicker
  const before = [hud.length, quiet.length];
  const other = { type: 'game.fg', pid: 9, path: 'C:\\Windows\\explorer.exe', title: '', cls: 'Shell_TrayWnd', fs: true, d3dfs: true };
  gm.onHelper(other);
  assert.equal(gm.hudVisible, true, 'still shown during the grace period');
  gm.onHelper(w3);
  await wait(100);
  assert.deepEqual([hud.length, quiet.length], before, 'no hide/show for a blip');
  assert(logs.some((x) => /^game fg other 9 explorer cls=Shell_TrayWnd/.test(x)), 'foreground changes are logged');
  // a real alt-tab: after the grace period the bar and quiet mode follow
  gm.onHelper(other);
  await wait(100);
  assert.equal(gm.hudVisible, false);
  assert.equal(gm.quiet, false);
  assert(gm.session, 'the session stays');
  gm.onHelper(w3);
  assert.equal(gm.hudVisible, true, 'back at once');
  // the game exits during a grace period: nothing fires afterwards
  gm.onHelper(other);
  gm.onHelper({ type: 'game.exit', pid: 33 });
  await wait(100);
  assert.equal(gm.session, null);
  gm.dispose();

  // ---------------------------------------------------------------- native / strings / bundles
  const cs = fs.readFileSync(path.join(root, 'native/Game.cs'), 'utf8');
  assert(/public static bool Probe\(\)/.test(cs));
  assert(/bool rtssUp = Rtss\.Probe\(\);/.test(cs) && /\.B\("rtss", rtssUp\)/.test(cs), 'RivaTuner is reported every tick');
  assert(/exclusive fullscreen check unavailable/.test(cs), 'a failing exclusive check is logged');
  for (const lang of ['en', 'ar', 'tr', 'es', 'ru', 'zh']) assert(/Borderless/.test(strings(lang).gmEngHint), lang);
  for (const b of ['src/renderer/island/island.bundle.js', 'src/renderer/settings/settings.js']) {
    assert(/gmEngHint: \[[^\n]*No window can be seen over a game in real Full Screen/.test(fs.readFileSync(path.join(root, b), 'utf8')), `${b} rebuilt`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('v1.7.5 fullscreen checks passed (RivaTuner in real Full Screen, window bar otherwise, no flicker, logging)');
})().catch((e) => { console.error(e); process.exit(1); });
