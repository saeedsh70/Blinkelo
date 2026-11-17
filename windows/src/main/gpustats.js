'use strict';
// NVIDIA GPU numbers (usage, temperature, VRAM, power) for the island's monitor and for phones.
// Starting nvidia-smi for every sample cost about 60 ms of process start-up every 2 s and woke the GPU each time.
// Instead one nvidia-smi runs in loop mode while someone reads the numbers; it is stopped once nobody has asked
// for `idleMs`, and an nvidia-smi that keeps dying right after start is retried only after a pause.

const FIELDS = 'index,utilization.gpu,temperature.gpu,name,memory.used,memory.total,power.draw';

const num = (v) => {
  const s = String(v === undefined ? '' : v).trim();
  return s !== '' && Number.isFinite(Number(s)) ? Number(s) : null;
};

// One CSV line of the query above → { index, stats } (null for anything else, e.g. an error message)
function parseLine(line) {
  const parts = String(line || '').split(',').map((s) => s.trim());
  if (parts.length < 7) return null;
  const [index, u, t, name, mu, mt, pw] = parts;
  if (num(index) === null) return null;
  const stats = { gpu: num(u), gpuTemp: num(t), gpuName: name };
  if (num(mu) !== null && num(mt)) { stats.vramUsed = num(mu) * 1048576; stats.vramTotal = num(mt) * 1048576; }
  if (num(pw) !== null) stats.gpuPower = num(pw);
  return { index: num(index), stats };
}

class GpuStats {
  constructor({ exe, spawn, log = () => {}, intervalMs = 2000, idleMs = 10000, retryMs = 30000, now = Date.now,
    setInterval: setIntervalFn = setInterval, clearInterval: clearIntervalFn = clearInterval } = {}) {
    Object.assign(this, { exe, spawnFn: spawn, log, intervalMs, idleMs, retryMs, now, setIntervalFn, clearIntervalFn });
    this.child = null;
    this.latest = null;     // { at, stats } of GPU 0
    this.lastRead = 0;
    this.retryAt = 0;
    this.watch = null;
  }

  /** Latest numbers of the first NVIDIA GPU, or null (none yet, stale, or no nvidia-smi). Keeps the sampler running. */
  read() {
    this.lastRead = this.now();
    this.ensure();
    const s = this.latest;
    return s && this.now() - s.at <= this.intervalMs * 3 ? { ...s.stats } : null;
  }

  ensure() {
    if (!this.exe || this.child || this.now() < this.retryAt) return;
    let child;
    try {
      child = this.spawnFn(this.exe, [`--query-gpu=${FIELDS}`, '--format=csv,noheader,nounits', '-lms', String(this.intervalMs)],
        { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    } catch (e) {
      this.log('nvidia-smi start failed', e.message);
      this.retryAt = this.now() + this.retryMs;
      return;
    }
    const startedAt = this.now();
    this.child = child;
    let buf = '';
    if (child.stdout) {
      if (child.stdout.setEncoding) child.stdout.setEncoding('utf8');
      child.stdout.on('data', (d) => {
        buf += d;
        if (buf.length > 65536) buf = buf.slice(-4096);
        let i;
        while ((i = buf.indexOf('\n')) >= 0) {
          const r = parseLine(buf.slice(0, i));
          buf = buf.slice(i + 1);
          if (r && r.index === 0 && this.child === child) this.latest = { at: this.now(), stats: r.stats };
        }
      });
    }
    const gone = (why) => {
      if (this.child !== child) return;
      this.child = null;
      this.latest = null;
      this.stopWatch();
      if (this.now() - startedAt < 5000) {
        this.retryAt = this.now() + this.retryMs;
        this.log('nvidia-smi stopped right after start', why);
      }
    };
    child.on('error', (e) => gone(e && e.message));
    child.on('exit', (code) => gone(`exit ${code}`));
    // stop when nobody asked for the numbers for a while
    this.watch = this.setIntervalFn(() => { if (this.now() - this.lastRead > this.idleMs) this.stop(); }, Math.max(1000, this.idleMs / 2));
    if (this.watch && this.watch.unref) this.watch.unref();
  }

  stopWatch() {
    if (this.watch) { this.clearIntervalFn(this.watch); this.watch = null; }
  }

  stop() {
    const child = this.child;
    this.child = null;
    this.latest = null;
    this.stopWatch();
    if (child) { try { child.kill(); } catch (_) { /* already gone */ } }
  }
}

module.exports = { GpuStats, parseLine, FIELDS };
