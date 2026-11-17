'use strict';
// GPU numbers come from one nvidia-smi in loop mode (not one process per sample), which stops when unused.
const assert = require('assert');
const { EventEmitter } = require('events');
const { GpuStats, parseLine } = require('../src/main/gpustats');

let clock = 1000000;
const now = () => clock;
const intervals = [];
const fakeSetInterval = (fn, ms) => { const t = { fn, ms, cleared: false }; intervals.push(t); return t; };
const fakeClearInterval = (t) => { if (t) t.cleared = true; };
const tick = (ms) => { clock += ms; for (const t of intervals) if (!t.cleared) t.fn(); };
const spawned = [];
function fakeSpawn(exe, args) {
  const p = new EventEmitter();
  p.stdout = new EventEmitter();
  p.stdout.setEncoding = () => {};
  p.killed = false;
  p.kill = () => { p.killed = true; };
  p.args = args;
  spawned.push(p);
  return p;
}
const make = (extra = {}) => new GpuStats({ exe: 'nvidia-smi.exe', spawn: fakeSpawn, now, setInterval: fakeSetInterval, clearInterval: fakeClearInterval, ...extra });
const checks = [];
const check = (name, fn) => { fn(); checks.push(name); };

check('parses a query line', () => {
  const r = parseLine('0, 37, 52, NVIDIA GeForce RTX 3060, 1024, 12288, 21.5');
  assert.deepEqual(r, { index: 0, stats: { gpu: 37, gpuTemp: 52, gpuName: 'NVIDIA GeForce RTX 3060', vramUsed: 1024 * 1048576, vramTotal: 12288 * 1048576, gpuPower: 21.5 } });
  assert.equal(parseLine('0, 5, 40, Laptop GPU, 300, 4096, [N/A]').stats.gpuPower, undefined, 'power not available');
  assert.equal(parseLine('Failed to initialize NVML: Driver/library version mismatch'), null);
  assert.equal(parseLine(''), null);
});

check('one process in loop mode, GPU 0 only', () => {
  spawned.length = 0;
  const g = make();
  assert.equal(g.read(), null, 'nothing before the first line');
  assert.equal(spawned.length, 1);
  assert(spawned[0].args.includes('-lms') && spawned[0].args.includes('2000'));
  spawned[0].stdout.emit('data', '0, 10, 45, GPU A, 100, 1000, 30\n1, 99, 80, GPU B, 900, 1000, 200\n');
  assert.equal(g.read().gpu, 10, 'the first GPU, like before');
  spawned[0].stdout.emit('data', '0, 2');
  spawned[0].stdout.emit('data', '0, 46, GPU A, 100, 1000, 30\n');
  assert.equal(g.read().gpu, 20, 'lines split across chunks');
  for (let i = 0; i < 5; i += 1) { tick(2000); g.read(); }
  assert.equal(spawned.length, 1, 'no new process per sample');
  g.stop();
});

check('stale numbers are not shown', () => {
  spawned.length = 0;
  const g = make();
  g.read();
  spawned[0].stdout.emit('data', '0, 10, 45, GPU A, 100, 1000, 30\n');
  clock += 7000;
  assert.equal(g.read(), null, 'older than three intervals');
  g.stop();
});

check('stops when nobody reads, restarts on the next read', () => {
  spawned.length = 0;
  const g = make();
  g.read();
  tick(6000);
  assert.equal(spawned[0].killed, false);
  tick(6000);
  assert.equal(spawned[0].killed, true, 'stopped after 10 s without reads');
  assert.equal(g.child, null);
  g.read();
  assert.equal(spawned.length, 2, 'started again when needed');
  g.stop();
  assert.equal(spawned[1].killed, true, 'stop() kills it (app quit)');
});

check('a crashing nvidia-smi is retried only after a pause', () => {
  spawned.length = 0;
  const logs = [];
  const g = make({ log: (...a) => logs.push(a.join(' ')) });
  g.read();
  clock += 500;
  spawned[0].emit('exit', 1);
  g.read();
  assert.equal(spawned.length, 1, 'no immediate respawn');
  clock += 31000;
  g.read();
  assert.equal(spawned.length, 2, 'retried after 30 s');
  assert(logs.some((l) => /right after start/.test(l)));
  spawned[1].emit('error', new Error('ENOENT'));
  g.read();
  assert.equal(spawned.length, 2);
});

check('no nvidia-smi: never spawns', () => {
  spawned.length = 0;
  const g = make({ exe: null });
  assert.equal(g.read(), null);
  assert.equal(spawned.length, 0);
});

console.log(`PASS gpu stats: ${checks.length} checks (${checks.join('; ')})`);
