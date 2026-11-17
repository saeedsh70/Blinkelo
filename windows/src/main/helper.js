'use strict';
// Bridge to the native Windows helper (Windows PowerShell 5.1 + runtime-compiled C#).
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { EventEmitter } = require('events');

const LOG_MAX = 2 * 1024 * 1024;          // helper.log is rotated to helper.log.old at this size
const CRASH_WINDOW_MS = 2 * 60 * 1000;    // this many unexpected exits ...
const CRASH_LIMIT = 5;                    // ... inside this window count as a crash loop
const STABLE_MS = 10 * 60 * 1000;         // a helper that ran this long was healthy: forget earlier crashes
const CRASH_PAUSES = [5 * 60 * 1000, 15 * 60 * 1000, 60 * 60 * 1000]; // rest before the next try, longer each time

class HelperBridge extends EventEmitter {
  constructor({ scriptPath, cacheDir, logFile }) {
    super();
    this.scriptPath = scriptPath;
    this.cacheDir = cacheDir;
    this.logFile = logFile;
    this.proc = null;
    this.buffer = '';
    this.restarts = 0;
    this.stopped = false;
    this.status = {};       // module -> { ok, detail, at }
    this.ready = false;
    this.restartTimer = null;
    this.logBytes = null;   // size of helper.log (read once, then counted)
    this.retiring = null;   // the process stop() asked to exit (its exit is not a crash)
    this.startedAt = 0;
    this.crashes = [];      // times of recent unexpected exits
    this.loopLevel = 0;     // how many crash-loop pauses in a row
  }

  log(line) {
    const text = `[${new Date().toISOString()}] ${line}\n`;
    try {
      if (this.logBytes === null) {
        try { this.logBytes = fs.statSync(this.logFile).size; } catch (_) { this.logBytes = 0; }
      }
      // a crashing helper writes a stack trace per restart: keep the file bounded (one previous file is kept)
      if (this.logBytes + text.length > LOG_MAX) {
        try { fs.renameSync(this.logFile, `${this.logFile}.old`); } catch (_) {
          try { fs.truncateSync(this.logFile, 0); } catch (__) { /* ignore */ }
        }
        this.logBytes = 0;
      }
      fs.appendFileSync(this.logFile, text);
      this.logBytes += Buffer.byteLength(text);
    } catch (_) { /* ignore */ }
  }

  start() {
    if (this.proc) return;
    if (this.restartTimer) { clearTimeout(this.restartTimer); this.restartTimer = null; }
    if (process.platform !== 'win32') {
      this.setStatus('core', false, 'native helper only runs on Windows');
      return;
    }
    this.stopped = false;
    const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    const args = ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', this.scriptPath, '-CacheDir', this.cacheDir];
    this.log(`starting helper: ${ps} ${args.join(' ')}`);
    let proc;
    try {
      proc = spawn(ps, args, { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      this.setStatus('core', false, `spawn failed: ${e.message}`);
      this.scheduleRestart();
      return;
    }
    this.proc = proc;
    this.ready = false;
    this.buffer = '';
    this.startedAt = Date.now();
    // a write that races with the helper closing must end up in the log, not as an uncaught exception
    if (proc.stdin && typeof proc.stdin.on === 'function') proc.stdin.on('error', (e) => this.log(`stdin error: ${e.message}`));
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => { if (this.proc === proc && !this.stopped) this.onData(chunk); });
    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk) => this.log(`stderr: ${chunk.trim().slice(0, 4000)}`));
    proc.on('error', (e) => {
      if (this.proc !== proc || this.stopped) return;
      this.log(`helper error: ${e.message}`);
      this.setStatus('core', false, e.message);
      if (!proc.pid) {
        this.proc = null; this.ready = false;
        if (!this.stopped) this.scheduleRestart();
      }
    });
    proc.on('exit', (code) => {
      this.log(`helper exited with code ${code}`);
      if (this.proc !== proc) return;
      this.proc = null;
      this.ready = false;
      const deliberate = this.retiring === proc;
      if (deliberate) this.retiring = null;
      this.emit('exit', code);
      if (this.stopped) return;
      if (!deliberate && this.noteCrash()) return; // crash loop: resting, the next try is already scheduled
      this.scheduleRestart();
    });
  }

  // A helper that dies right after every start (for example a native crash on the same request each time) must not
  // be restarted every few seconds for hours. After CRASH_LIMIT quick exits it rests, longer each time; a helper
  // that stays up for STABLE_MS, or a manual restart, clears the count. Returns true when a rest was scheduled.
  noteCrash() {
    const now = Date.now();
    if (this.startedAt && now - this.startedAt > STABLE_MS) { this.crashes = []; this.loopLevel = 0; }
    this.crashes = this.crashes.filter((t) => now - t < CRASH_WINDOW_MS);
    this.crashes.push(now);
    if (this.crashes.length < CRASH_LIMIT) return false;
    const pause = CRASH_PAUSES[Math.min(this.loopLevel, CRASH_PAUSES.length - 1)];
    this.loopLevel += 1;
    this.crashes = [];
    this.setStatus('core', false, `native helper keeps crashing; next try in ${Math.round(pause / 60000)} min`);
    this.emit('crashloop', { pause, level: this.loopLevel });
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => { this.restartTimer = null; this.start(); }, pause);
    return true;
  }

  scheduleRestart() {
    if (this.stopped || this.restartTimer) return;
    this.restarts += 1;
    const delay = Math.min(30000, 1500 * Math.pow(1.7, Math.min(this.restarts, 8)));
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      this.start();
    }, delay);
  }

  restart() {
    this.restarts = 0;
    this.crashes = [];
    this.loopLevel = 0;
    this.stop();
    this.stopped = false;
    this.restartTimer = setTimeout(() => { this.restartTimer = null; this.start(); }, 400);
  }

  stop() {
    this.stopped = true;
    this.ready = false;
    if (this.restartTimer) { clearTimeout(this.restartTimer); this.restartTimer = null; }
    if (this.proc) {
      this.retiring = this.proc;
      try { this.proc.stdin.end(); } catch (_) { /* ignore */ }
      const p = this.proc;
      setTimeout(() => { try { p.kill(); } catch (_) { /* ignore */ } }, 800);
      // Keep ownership until exit. A new helper must never overlap a retiring process.
    }
  }

  onData(chunk) {
    this.buffer += chunk;
    let idx;
    while ((idx = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, idx).trim();
      this.buffer = this.buffer.slice(idx + 1);
      if (!line) continue;
      if (line[0] !== '{') { this.log(`non-json: ${line.slice(0, 300)}`); continue; }
      let msg;
      try { msg = JSON.parse(line); } catch (e) { this.log(`bad json: ${line.slice(0, 300)}`); continue; }
      this.handle(msg);
    }
    if (this.buffer.length > 8 * 1024 * 1024) this.buffer = '';
  }

  handle(msg) {
    switch (msg.type) {
      case 'status':
        this.setStatus(msg.module, msg.ok, msg.detail);
        break;
      case 'log':
        this.log(`${msg.level}: ${msg.msg}`);
        break;
      case 'ready':
        this.ready = true;
        this.restarts = 0;
        this.send('sys.refresh');
        this.send('media.refresh');
        break;
      default:
        break;
    }
    this.emit('message', msg);
  }

  setStatus(module, ok, detail) {
    this.status[module] = { ok: !!ok, detail: detail || '', at: Date.now() };
    this.log(`status ${module}: ${ok ? 'ok' : 'FAIL'} ${detail || ''}`);
    this.emit('status', this.status);
  }

  send(name, ...args) {
    const stdin = this.proc && this.proc.stdin;
    // after stop() the pipe is ended but the process is kept until it exits: nothing may be written to it any more
    if (!stdin || stdin.destroyed || stdin.writableEnded || this.retiring === this.proc) return false;
    const enc = args.map((a) => Buffer.from(String(a === undefined || a === null ? '' : a), 'utf8').toString('base64'));
    try {
      stdin.write([name, ...enc].join('\t') + '\n');
      return true;
    } catch (e) {
      this.log(`send failed: ${e.message}`);
      return false;
    }
  }
}

module.exports = { HelperBridge };
