'use strict';
// 1.7.2: fixes from the 1.7.1 review.
//  W1 nothing is written to the helper after stop() (was an uncaught "write after end" on every quit)
//  W2 the RivaTuner overlay always answers the first update, so the window bar comes back when RTSS is missing
//  W3 gaming sensors use a monotonic clock instead of Environment.TickCount
//  W4 quitting while optimized restores the power plan / registry; the restore file survives an interrupted undo
//  W5 helper.log is rotated and a crash-looping helper is rested instead of restarted for ever
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { EventEmitter } = require('events');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const tick = () => new Promise((r) => setImmediate(r));

function loadHelper({ fsMock, clock }) {
  const module = { exports: {} };
  const timers = [];
  const children = [];
  const spawn = () => {
    const p = new EventEmitter();
    p.pid = 1000 + children.length;
    p.stdout = new EventEmitter(); p.stdout.setEncoding = () => {};
    p.stderr = new EventEmitter(); p.stderr.setEncoding = () => {};
    p.stdin = new EventEmitter();
    Object.assign(p.stdin, { written: [], destroyed: false, writableEnded: false,
      write(s) { if (this.writableEnded) throw new Error('write after end'); this.written.push(s); return true; },
      end() { this.writableEnded = true; } });
    p.kill = () => {};
    children.push(p);
    return p;
  };
  class FakeDate extends Date { static now() { return clock.now; } }
  const box = {
    module, exports: module.exports, console, Buffer,
    require: (n) => (n === 'child_process' ? { spawn } : n === 'fs' ? fsMock : require(n)),
    process: { platform: 'win32', env: { SystemRoot: 'C:\\Windows' } },
    Date: FakeDate,
    setTimeout: (fn, ms) => { const t = { fn, ms, cancelled: false }; timers.push(t); return t; },
    clearTimeout: (t) => { if (t) t.cancelled = true; },
  };
  vm.runInNewContext(read('src/main/helper.js'), box, { filename: 'helper.js' });
  const pending = () => timers.filter((t) => !t.cancelled && !t.done);
  const fire = (t) => { t.done = true; t.fn(); };
  return { HelperBridge: module.exports.HelperBridge, children, timers, pending, fire };
}

(async () => {
  // ---------------------------------------------------------------- W1: no writes after stop()
  {
    const clock = { now: 1e6 };
    const H = loadHelper({ fsMock: { appendFileSync() {}, statSync() { return { size: 0 }; } }, clock });
    const h = new H.HelperBridge({ scriptPath: 'h.ps1', cacheDir: 'c', logFile: 'helper.log' });
    h.start();
    const p = H.children[0];
    assert.equal(p.stdin.listenerCount('error'), 1, 'stdin errors are handled');
    assert.equal(h.send('bt.close', 'aa'), true);
    assert.equal(p.stdin.written.length, 1);
    h.stop();
    assert.equal(p.stdin.writableEnded, true);
    assert.equal(h.send('bt.close', 'aa'), false, 'send after stop() is refused');
    assert.equal(h.send('game.osd', ''), false);
    assert.equal(p.stdin.written.length, 1, 'nothing reached the ended pipe');
    p.stdin.emit('error', new Error('EPIPE')); // must not throw

    // the order at quit: the phone link (which still sends bt.close) before the helper
    const main = read('src/main/main.js');
    const quit = main.slice(main.indexOf("app.on('will-quit'"));
    assert(quit.indexOf('kde.stop()') > 0 && quit.indexOf('kde.stop()') < quit.indexOf('helper.stop()'), 'kde stops before the helper');
    assert(main.includes("app.on('before-quit'") && main.includes('gaming.shutdown()'), 'quit restores gaming optimizations');
  }

  // ---------------------------------------------------------------- W5: log rotation
  {
    const clock = { now: 1e6 };
    const calls = [];
    let size = 13 * 1024 * 1024; // the 13 MB file found on a real PC
    const fsMock = {
      statSync() { calls.push('stat'); return { size }; },
      renameSync(a, b) { calls.push(`rename ${a} -> ${b}`); size = 0; },
      appendFileSync(f, text) { calls.push('append'); size += Buffer.byteLength(text); },
    };
    const H = loadHelper({ fsMock, clock });
    const h = new H.HelperBridge({ scriptPath: 'h.ps1', cacheDir: 'c', logFile: 'helper.log' });
    h.log('first line');
    assert.deepEqual(calls, ['stat', 'rename helper.log -> helper.log.old', 'append'], 'an oversized log is rotated before the first write');
    for (let i = 0; i < 30000; i++) h.log('x'.repeat(100)); // ~3.9 MB of text
    assert.equal(calls.filter((c) => c === 'stat').length, 1, 'the size is read once');
    assert.equal(calls.filter((c) => c.startsWith('rename')).length, 2, 'rotated again at 2 MB');
    assert(size <= 2 * 1024 * 1024, 'the file never grows past the limit');
  }

  // ---------------------------------------------------------------- W5: crash loop
  {
    const clock = { now: 1e6 };
    const H = loadHelper({ fsMock: { appendFileSync() {}, statSync() { return { size: 0 }; } }, clock });
    const h = new H.HelperBridge({ scriptPath: 'h.ps1', cacheDir: 'c', logFile: 'helper.log' });
    const loops = [];
    h.on('crashloop', (x) => loops.push(x));
    const crashOnce = () => {
      const p = H.children[H.children.length - 1];
      h.handle({ type: 'ready' });          // it came up ...
      clock.now += 3000;
      p.emit('exit', -1073741819);          // ... and died (access violation)
    };
    const nextStart = () => { const t = H.pending().pop(); H.fire(t); return t.ms; };
    h.start();
    for (let i = 0; i < 4; i++) { crashOnce(); assert(nextStart() < 5000, 'quick restart while it is not a loop yet'); }
    assert.equal(H.children.length, 5);
    crashOnce(); // fifth exit inside two minutes
    assert.equal(loops.length, 1);
    assert.equal(h.status.core.ok, false);
    assert(/keeps crashing/.test(h.status.core.detail));
    assert.equal(H.pending().length, 1);
    assert.equal(H.pending()[0].ms, 5 * 60 * 1000, 'rests five minutes');
    assert.equal(H.children.length, 5, 'no new process during the rest');
    clock.now += 5 * 60 * 1000; nextStart();
    for (let i = 0; i < 4; i++) { crashOnce(); nextStart(); }
    crashOnce();
    assert.equal(H.pending()[0].ms, 15 * 60 * 1000, 'the second rest is longer');
    // a manual restart clears everything
    h.restart();
    assert.equal(h.crashes.length, 0); assert.equal(h.loopLevel, 0);
    // a deliberate restart is not a crash
    H.pending().forEach((t) => H.fire(t));
    const before = H.children.length;
    for (let i = 0; i < 8; i++) {
      h.restart();
      H.children[H.children.length - 1].emit('exit', 0);
      H.pending().forEach((t) => H.fire(t));
    }
    assert.equal(loops.length, 2, 'eight manual restarts are not a crash loop');
    assert(H.children.length > before);
    // a helper that ran for a long time and then dies starts counting from zero
    h.crashes = [clock.now - 1000, clock.now - 900, clock.now - 800, clock.now - 700];
    clock.now += 11 * 60 * 1000;
    H.children[H.children.length - 1].emit('exit', 1);
    assert.equal(loops.length, 2);
    assert.equal(h.crashes.length, 1);
  }

  // ---------------------------------------------------------------- W4: quit restores, file kept until done
  {
    const G = require(path.join(root, 'src/main/gaming.js'));
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gaming-quit-'));
    const file = path.join(dir, 'gaming-restore.json');
    fs.writeFileSync(file, JSON.stringify({ at: 1, power: { scheme: 'aaaaaaaa-0000-0000-0000-000000000000', overlay: '' }, gameMode: 0, closed: [{ name: 'discord', path: 'C:\\d.exe' }] }));
    const sent = [];
    const reg = [];
    let answerPower = null;
    let gm;
    const helper = { send(cmd, ...a) { sent.push([cmd, ...a]); if (cmd === 'game.power') answerPower = () => gm.onHelper({ type: 'game.result', id: a[0], ok: true }); return true; } };
    const opened = [];
    gm = new G.Gaming({ helper, dir, platform: 'win32', openPath: (p) => opened.push(p),
      execFile: (f, args, cb) => { reg.push(args.join(' ')); cb(null, ''); } });
    gm.configure({ enabled: true, reopen: true, hud: { metrics: [] }, optimize: {} });
    assert(gm.restoreInfo, 'optimizations are applied');
    const done = gm.shutdown();
    await tick();
    assert(sent.some((x) => x[0] === 'game.power' && x[2] === 'restore' && x[3] === 'aaaaaaaa-0000-0000-0000-000000000000|'), 'power plan restore requested');
    assert(reg.some((r) => /AutoGameModeEnabled/.test(r) && / 0 /.test(r)), 'Game Mode put back');
    assert.equal(fs.existsSync(file), true, 'the restore file stays while the undo is running (an interrupted quit is finished at the next start)');
    answerPower();
    assert.equal(await done, true);
    assert.equal(fs.existsSync(file), false, 'removed once the undo finished');
    assert.deepEqual(opened, [], 'closed apps are not started again when the app quits');
    assert.equal(await gm.shutdown(), false, 'nothing left to undo');
    gm.dispose();
    fs.rmSync(dir, { recursive: true, force: true });
  }

  // ---------------------------------------------------------------- W2 / W3: native source guards (compiled and run on Windows)
  {
    const cs = read('native/Game.cs');
    const code = cs.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    assert(!/Environment\.TickCount/.test(code), 'Game.cs must use Clock.Ms (TickCount is negative after 24.9 days of uptime)');
    assert(/static class Clock[\s\S]{0,200}Stopwatch\.StartNew\(\)/.test(code));
    assert.equal((code.match(/Clock\.Ms/g) || []).length, 3);
    assert(!/_osdShown/.test(code));
    assert(/_osdState = -1;/.test(code), 'unknown at start');
    assert(/Osd\.Release\(\); _osdState = -1;/.test(code), 'unknown again after the overlay is released');
    assert(/if \(state != _osdState\)/.test(code), 'the first answer after a switch-on is always sent');
  }

  console.log('v1.7.2 fix checks passed (helper pipe, log rotation, crash loop, quit restore, native guards)');
})().catch((e) => { console.error(e); process.exit(1); });
