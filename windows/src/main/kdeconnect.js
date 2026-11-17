'use strict';
// Phone link: KDE Connect protocol v8 (LAN: UDP discovery + TLS) plus the Blinkelo Link extensions
// ("island.*" packets) and a Bluetooth RFCOMM transport (the native helper owns the socket).
// Works with the official KDE Connect Android app (media, notifications, calls, battery, find phone)
// and unlocks the full feature set with the Blinkelo Link app: remote input, PC media/volume/power,
// apps, screenshots, file/clipboard sharing, shared planner, timers, camera and PC notifications.
const dgram = require('dgram');
const net = require('net');
const tls = require('tls');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { Transform, Writable } = require('stream');
const { pipeline } = require('stream/promises');
const { readJson, writeJson, isObject } = require('./jsonfile');

const UDP_PORT = 1716;
const MIN_PORT = 1716;
const MAX_PORT = 1764;
const PAYLOAD_MIN_PORT = 1739;
const PAYLOAD_MAX_PORT = 1764;
const PROTOCOL_VERSION = 8;
const MAX_IDENTITY = 8192;
const MAX_PAYLOAD = 12 * 1024 * 1024;   // in-memory payloads (icons, album art, clipboard images)
const MAX_FILE = 4 * 1024 * 1024 * 1024; // shared files are streamed to disk
const BT_CHUNK = 48 * 1024;
const BT_WINDOW = 384 * 1024;   // bytes allowed in flight towards the radio
const BT_MAX_PAYLOAD = 150 * 1024 * 1024;
const BT_MAX_PENDING = 4;
const TRANSFER_IDLE = 30000;
const DEVICE_ID_RE = /^[a-zA-Z0-9_-]{32,38}$/;

const INCOMING = [
  'island.transfer.result',
  'kdeconnect.ping', 'kdeconnect.notification', 'kdeconnect.mpris', 'kdeconnect.telephony', 'kdeconnect.battery',
  'kdeconnect.findmyphone.request', 'kdeconnect.clipboard', 'kdeconnect.clipboard.connect', 'kdeconnect.share.request',
  'kdeconnect.mousepad.request', 'kdeconnect.presenter', 'kdeconnect.systemvolume.request', 'kdeconnect.runcommand.request',
  'island.hello', 'island.sysinfo.request', 'island.apps.request', 'island.apps.launch', 'island.screenshot.request',
  'island.media.request', 'island.tasks', 'island.timer', 'island.clipboard.image', 'island.findpc',
  'island.game.request',
];
const OUTGOING = [
  'island.transfer.result',
  'kdeconnect.ping', 'kdeconnect.notification.request', 'kdeconnect.notification.reply', 'kdeconnect.notification.action',
  'kdeconnect.mpris.request', 'kdeconnect.telephony.request_mute', 'kdeconnect.findmyphone.request', 'kdeconnect.battery.request',
  'kdeconnect.clipboard', 'kdeconnect.share.request', 'kdeconnect.sms.request', 'kdeconnect.systemvolume', 'kdeconnect.runcommand',
  'island.hello', 'island.sysinfo', 'island.apps', 'island.screenshot', 'island.media', 'island.tasks', 'island.timer',
  'island.camera.request', 'island.pcnotify', 'island.clipboard.image', 'island.findpc.state',
  'island.game',
];

function sanitizeName(name) {
  return String(name || '').replace(/["',;:.!?()[\]<>]/g, '').trim().slice(0, 32);
}

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function validSize(size, max) { return Number.isSafeInteger(size) && size >= 0 && size <= max; }
function payloadPeer(sock, link) {
  const peer = sock.getPeerCertificate();
  if (!peer || !peer.raw || sha256(peer.raw) !== link.info.certSha256) throw new Error('payload certificate mismatch');
}
function btTranscript(sender, receiver, senderNonce, receiverNonce, senderFp, receiverFp) {
  return Buffer.from(['island.bt.auth.v2', sender, receiver, senderNonce, receiverNonce, senderFp, receiverFp, ''].join('\n'));
}
function btSessionKey(seed, context) { return crypto.createHash('sha256').update(seed).update(context).digest(); }
function btIv(seq) { const iv = Buffer.alloc(12); iv.writeBigUInt64BE(BigInt(seq), 4); return iv; }
function byteCounter(size, onProgress) {
  let got = 0;
  return new Transform({
    transform(chunk, _encoding, callback) {
      got += chunk.length;
      if (got > size) { callback(new Error('payload exceeds declared size')); return; }
      if (onProgress) onProgress(got, size);
      callback(null, chunk);
    },
    flush(callback) { callback(got === size ? null : new Error('incomplete payload')); },
  });
}

let lastId = 0;
function nextId() { lastId = Math.max(lastId + 1, Date.now()); return lastId; }

function packet(type, body = {}, extra = {}) {
  return `${JSON.stringify({ id: nextId(), type, body, ...extra })}\n`;
}

// Reads one newline-terminated line from a stream, with a size cap and timeout.
function readLine(sock, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const cleanup = () => {
      clearTimeout(timer);
      sock.pause();
      sock.removeListener('data', onData);
      sock.removeListener('error', onErr);
      sock.removeListener('close', onClose);
    };
    const onData = (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const idx = buf.indexOf(10);
      if (idx >= 0) {
        cleanup();
        const rest = buf.subarray(idx + 1);
        if (rest.length) sock.unshift(rest);
        resolve(buf.subarray(0, idx).toString('utf8'));
      } else if (buf.length > MAX_IDENTITY) {
        cleanup();
        reject(new Error('identity too large'));
      }
    };
    const onErr = (e) => { cleanup(); reject(e); };
    const onClose = () => { cleanup(); reject(new Error('closed')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, timeoutMs);
    sock.on('data', onData);
    sock.once('error', onErr);
    sock.once('close', onClose);
    sock.resume();
  });
}

function parseIdentity(line) {
  let p;
  try { p = JSON.parse(line); } catch (_) { return null; }
  if (!p || p.type !== 'kdeconnect.identity' || !p.body) return null;
  if (!DEVICE_ID_RE.test(String(p.body.deviceId || ''))) return null;
  return p.body;
}

function certCN(peer) {
  if (!peer) return '';
  const cn = peer.subject && peer.subject.CN;
  return Array.isArray(cn) ? cn[0] : (cn || '');
}

function safeName(n) {
  let s = String(n || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
  if (!s || s === '.' || s === '..') s = 'file';
  return s.slice(-150);
}

// A free file name in dir. `taken` holds names already promised to downloads that are still running: the file
// only appears when a download completes, so without it two same-name files arriving together got the same
// path and the second one replaced the first.
function uniquePath(dir, name, taken = new Set()) {
  const free = (p) => !taken.has(pathKey(p)) && !fs.existsSync(p);
  let p = path.join(dir, name);
  if (free(p)) return p;
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length);
  for (let i = 2; i < 1000; i += 1) {
    p = path.join(dir, `${stem} (${i})${ext}`);
    if (free(p)) return p;
  }
  return path.join(dir, `${stem}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}${ext}`);
}
// Windows file names are case-insensitive
function pathKey(p) { return process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p); }

// ------------------------------------------------------------------------------------------------ links
class Link extends EventEmitter {
  constructor(kc, sock, info, address) {
    super();
    this.kc = kc;
    this.sock = sock;
    this.info = info;
    this.address = address;
    this.bluetooth = false;
    this.buf = '';
    this.closed = false;
    this.payloadCancels = new Set();
    sock.setEncoding('utf8');
    sock.on('data', (d) => this.onData(d));
    sock.resume();
    sock.on('close', () => this.close());
    sock.on('error', (e) => { this.kc.log(`link error ${info.deviceName}: ${e.message}`); this.close(); });
    try { sock.setKeepAlive(true, 30000); } catch (_) { /* ignore */ }
  }

  onData(d) {
    this.buf += d;
    if (this.buf.length > 32 * 1024 * 1024) { this.close(); return; }
    let idx;
    while ((idx = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, idx).trim();
      this.buf = this.buf.slice(idx + 1);
      if (!line) continue;
      let p;
      try { p = JSON.parse(line); } catch (_) { continue; }
      this.emit('packet', p);
    }
  }

  send(type, body = {}) {
    if (this.closed) return false;
    try { this.sock.write(packet(type, body)); return true; } catch (_) { return false; }
  }

  // Payload: we listen on a free port, the receiver connects as TLS client and reads the bytes.
  sendWithPayload(type, body, source, onProgress) {
    return new Promise((resolve) => {
      if (this.closed || !this.kc.isTrustedLink(this) || !validSize(source.size, MAX_FILE)) { resolve(false); return; }
      const size = source.size;
      let port = PAYLOAD_MIN_PORT;
      let done = false;
      let active = null, stream = null;
      const finish = (ok) => {
        if (done) return;
        done = true; clearTimeout(timer); clearTimeout(idle);
        this.payloadCancels.delete(cancel);
        try { server.close(); } catch (_) { /* ignore */ }
        if (!ok) { if (active) active.destroy(); if (stream) stream.destroy(); }
        resolve(ok);
      };
      const cancel = () => finish(false);
      let idle = null;
      const bump = () => { clearTimeout(idle); idle = setTimeout(cancel, TRANSFER_IDLE); };
      const server = tls.createServer({ ...this.kc.tlsOptions(), requestCert: true, handshakeTimeout: 10000 }, (s) => {
        try { payloadPeer(s, this); } catch (_) { s.destroy(); return; }
        if (done || active || !this.kc.isTrustedLink(this)) { s.destroy(); return; }
        active = s; server.close(); bump();
        try { stream = source.open(); } catch (_) { finish(false); return; }
        pipeline(stream, byteCounter(size, (got, total) => { bump(); if (onProgress) onProgress(got, total); }), s)
          .then(() => finish(true), () => finish(false));
      });
      const timer = setTimeout(cancel, 5 * 60000);
      this.payloadCancels.add(cancel);
      bump();
      server.on('tlsClientError', () => {});
      const tryListen = () => {
        server.once('error', (e) => {
          if (['EADDRINUSE','EACCES'].includes(e.code) && port !== 0) {
            if (port < PAYLOAD_MAX_PORT) { port += 1; tryListen(); }
            else if (this.info.islandPortFallback) { port = 0; tryListen(); }
            else finish(false);
          } else finish(false);
        });
        server.listen(port, '0.0.0.0', () => {
          server.removeAllListeners('error');
          server.on('error', () => finish(false));
          try {
            this.sock.write(packet(type, body, { payloadSize: size, payloadTransferInfo: { port: server.address().port } }));
          } catch (_) { finish(false); }
        });
      };
      tryListen();
    });
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    for (const cancel of [...this.payloadCancels]) cancel();
    try { this.sock.destroy(); } catch (_) { /* ignore */ }
    this.emit('close');
  }
}

// Bluetooth link: lines go through the native helper (which owns the RFCOMM socket). Payloads are
// carried inline as base64 "island.chunk" packets.
class BtLink extends EventEmitter {
  constructor(kc, addr, info) {
    super();
    this.kc = kc;
    this.addr = addr;
    this.address = 'bluetooth';
    this.info = info;
    this.bluetooth = true;
    this.closed = false;
    this.pending = new Map();
    this.queued = 0;
    this.written = 0;
    this.waiters = [];
    this.receivedFiles = new Set();
    this.receivedExpiry = new Map();
    this.outgoing = new Set();
    this.sendSequence = 0;
    this.receiveSequence = 0;
  }

  receiveWireLine(text) {
    if (this.closed) return;
    try {
      if (Buffer.byteLength(text) > 6 * 1024 * 1024) throw new Error('Bluetooth frame too large');
      const frame = JSON.parse(text), body = frame.body || {};
      if (frame.type !== 'island.bt.frame' || !Number.isSafeInteger(body.seq) || body.seq !== this.receiveSequence
          || typeof body.data !== 'string' || !this.info.btReceiveKey) throw new Error('invalid Bluetooth frame');
      const data = Buffer.from(body.data, 'base64');
      if (data.length < 16 || data.length > 4 * 1024 * 1024 + 16) throw new Error('invalid Bluetooth ciphertext');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.info.btReceiveKey, btIv(body.seq));
      decipher.setAAD(this.info.btReceiveContext); decipher.setAuthTag(data.subarray(-16));
      const plain = Buffer.concat([decipher.update(data.subarray(0, -16)), decipher.final()]);
      this.receiveSequence += 1;
      this.line(plain.toString('utf8'));
    } catch (_) { this.close(); }
  }

  line(text) {
    if (this.closed || Buffer.byteLength(text) > 4 * 1024 * 1024) return;
    let p;
    try { p = JSON.parse(text); } catch (_) { return; }
    if (!p || !p.type) return;
    // Pairing is the only operation allowed before trust. Do this before allocating payload storage.
    if (!this.kc.isTrustedLink(this)) {
      if (p.type === 'kdeconnect.pair') this.emit('packet', p);
      return;
    }
    if (p.type === 'island.chunk') { this.onChunk(p.body || {}); return; }
    const tid = p.payloadTransferInfo && p.payloadTransferInfo.bt;
    if (tid !== undefined) {
      const size = p.payloadSize;
      if (typeof tid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(tid) || !validSize(size, BT_MAX_PAYLOAD)) return;
      this.dropPending(tid);
      let reserved = [...this.pending.values()].reduce((n, item) => n + item.size, 0);
      for (const file of this.receivedFiles) {
        try { reserved += fs.statSync(file).size; } catch (_) { this.releasePayloadFile(file); }
      }
      if (this.pending.size + this.receivedFiles.size >= BT_MAX_PENDING || reserved + size > BT_MAX_PAYLOAD) return;
      const pd = { p, size, got: 0, seq: 0, parts: [], file: null, fd: null };
      const memory = [...this.pending.values()].filter((item) => item.fd === null).reduce((n, item) => n + item.size, 0);
      if (size + memory > MAX_PAYLOAD) {
        pd.file = path.join(os.tmpdir(), `island-bt-${crypto.randomUUID()}.part`);
        try { pd.fd = fs.openSync(pd.file, 'wx'); } catch (_) { return; }
      }
      this.pending.set(tid, pd);
      pd.deadline = setTimeout(() => this.dropPending(tid), 5 * 60000);
      pd.idle = setTimeout(() => this.dropPending(tid), TRANSFER_IDLE);
      return;
    }
    this.emit('packet', p);
  }

  onChunk(b) {
    const pd = this.pending.get(b.tid);
    if (!pd) return;
    if (!Number.isSafeInteger(b.seq) || b.seq !== pd.seq || typeof b.data !== 'string'
        || b.data.length > Math.ceil(BT_CHUNK / 3) * 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b.data)) {
      this.dropPending(b.tid); return;
    }
    pd.seq += 1;
    const data = Buffer.from(b.data, 'base64');
    if (data.length > BT_CHUNK || data.length + pd.got > pd.size || (b.last && data.length + pd.got !== pd.size)) {
      this.dropPending(b.tid); return;
    }
    try { if (pd.fd !== null) fs.writeSync(pd.fd, data); else pd.parts.push(data); }
    catch (_) { this.dropPending(b.tid); return; }
    clearTimeout(pd.idle); pd.idle = setTimeout(() => this.dropPending(b.tid), TRANSFER_IDLE);
    pd.got += data.length;
    if (pd.onProgress) pd.onProgress(pd.got, pd.size);
    if (b.last || pd.got >= pd.size) {
      this.pending.delete(b.tid);
      clearTimeout(pd.idle); clearTimeout(pd.deadline);
      if (pd.fd !== null) {
        try { fs.closeSync(pd.fd); } catch (_) { try { fs.unlinkSync(pd.file); } catch (_) {} return; }
        pd.p._payloadFile = pd.file; this.receivedFiles.add(pd.file);
        this.receivedExpiry.set(pd.file, setTimeout(() => this.releasePayloadFile(pd.file), 5 * 60000));
      } else pd.p._payload = Buffer.concat(pd.parts);
      this.emit('packet', pd.p);
    }
  }

  dropPending(tid) {
    const pd = this.pending.get(tid);
    if (!pd) return;
    this.pending.delete(tid);
    clearTimeout(pd.idle); clearTimeout(pd.deadline);
    if (pd.fd !== null) { try { fs.closeSync(pd.fd); } catch (_) {} }
    if (pd.file) { try { fs.unlinkSync(pd.file); } catch (_) {} }
  }

  releasePayloadFile(file) {
    clearTimeout(this.receivedExpiry.get(file)); this.receivedExpiry.delete(file);
    if (this.receivedFiles.delete(file)) { try { fs.unlinkSync(file); } catch (_) {} }
  }

  rawSend(text) {
    if (this.closed) return false;
    let line;
    try {
      if (!this.info.btSendKey || !Number.isSafeInteger(this.sendSequence) || Buffer.byteLength(text) > 4 * 1024 * 1024) throw new Error('invalid Bluetooth session');
      const seq = this.sendSequence++;
      const cipher = crypto.createCipheriv('aes-256-gcm', this.info.btSendKey, btIv(seq));
      cipher.setAAD(this.info.btSendContext);
      const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final(), cipher.getAuthTag()]);
      line = packet('island.bt.frame', {seq, data:data.toString('base64')}).trim();
    } catch (_) { this.close(); return false; }
    if (!this.kc.btSend(this.addr, line)) { this.close(); return false; }
    this.queued += Buffer.byteLength(line) + 1;
    return true;
  }

  // the helper reports how many bytes reached the radio; payloads wait while too much is in flight
  onSent(total) {
    this.written = total;
    if (this.queued - this.written < BT_WINDOW) {
      const w = this.waiters;
      this.waiters = [];
      for (const fn of w) fn();
    }
  }

  drain() {
    if (this.closed || this.queued - this.written < BT_WINDOW) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(() => { this.close(); resolve(); }, TRANSFER_IDLE);
      this.waiters.push(() => { clearTimeout(timer); resolve(); });
    });
  }

  send(type, body = {}) { return this.rawSend(packet(type, body)); }

  async sendWithPayload(type, body, source, onProgress) {
    const tid = crypto.randomBytes(6).toString('hex');
    const size = source.size;
    const peerLimit = this.info.maxBluetoothPayload || BT_MAX_PAYLOAD;
    if (!this.kc.isTrustedLink(this) || !validSize(size, Math.min(peerLimit, BT_MAX_PAYLOAD))) return false;
    if (!this.rawSend(packet(type, body, { payloadSize: size, payloadTransferInfo: { bt: tid } }))) return false;
    let stream;
    let seq = 0;
    let sent = 0;
    let carry = Buffer.alloc(0);
    const emit = (part, last) => {
      if (sent + part.length > size) throw new Error('payload size changed');
      sent += part.length;
      if (!this.rawSend(packet('island.chunk', { tid, seq: seq++, data: part.toString('base64'), last }))) throw new Error('Bluetooth send failed');
      if (onProgress) onProgress(sent, size);
    };
    try {
      stream = source.open({ highWaterMark: BT_CHUNK }); this.outgoing.add(stream);
      for await (const c of stream) {
        carry = carry.length ? Buffer.concat([carry, c]) : c;
        while (carry.length > BT_CHUNK) {
          emit(carry.subarray(0, BT_CHUNK), false);
          carry = carry.subarray(BT_CHUNK);
          await this.drain();
          if (this.closed) return false;
        }
      }
      if (sent + carry.length !== size) throw new Error('incomplete payload');
      if (carry.length || size === 0) emit(carry, true);
      else if (seq > 0) this.rawSend(packet('island.chunk', { tid, seq: seq++, data: '', last: true }));
      return !this.closed;
    } catch (_) {
      this.close();
      return false;
    } finally {
      if (stream) { this.outgoing.delete(stream); stream.destroy(); }
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    for (const tid of [...this.pending.keys()]) this.dropPending(tid);
    for (const fn of this.waiters) fn();
    this.waiters = [];
    for (const stream of this.outgoing) stream.destroy();
    for (const file of [...this.receivedFiles]) this.releasePayloadFile(file);
    this.kc.btDisconnect(this.addr);
    this.emit('close');
  }
}

// ------------------------------------------------------------------------------------------------ main class
class KdeConnect extends EventEmitter {
  constructor({ dir, log, downloadDir }) {
    super();
    this.dir = dir;
    this.log = log || (() => {});
    this.downloadDir = downloadDir || (() => path.join(os.homedir(), 'Downloads', 'Blinkelo'));
    this.incomingPaths = new Set(); // destinations of downloads in progress (pathKey), see uniquePath
    this.links = new Map();         // deviceId -> LAN Link
    this.btLinks = new Map();       // deviceId -> BtLink
    this.btPending = new Map();     // bt address -> { buf, timer }
    this.devices = new Map();       // deviceId -> { id, name, type, address, connected, paired, pairState, battery, charging, verifyKey, island }
    this.trusted = {};              // deviceId -> { name, type, certSha256, certPem, protocolVersion }
    this.lastConnect = new Map();
    this.players = new Map();       // deviceId|player -> state
    this.iconCache = new Map();     // payloadHash -> dataURL
    this.artCache = new Map();      // albumArtUrl -> dataURL
    this.pairTimers = new Map();
    this.pairStamps = new Map();
    this.transferAcks = new Map();
    this.btSend = () => false;      // set by main: (addr, line) => helper.send('bt.send', ...)
    this.btDisconnect = () => {};
    this.started = false;
  }

  // ---------------------------------------------------------------- identity & certificate
  loadIdentity() {
    fs.mkdirSync(this.dir, { recursive: true });
    const idFile = path.join(this.dir, 'identity.json');
    // Losing the identity breaks every pairing (phones refuse a changed certificate), so it is kept twice and a
    // damaged identity.json is restored from identity.json.bak.
    const wellFormed = (j) => {
      if (!isObject(j) || !DEVICE_ID_RE.test(String(j.deviceId || '')) || typeof j.certPem !== 'string' || typeof j.keyPem !== 'string') return false;
      try { return new crypto.X509Certificate(j.certPem).subject.includes(`CN=${j.deviceId}`); } catch (_) { return false; }
    };
    const saved = readJson(idFile, { backup: true, valid: wellFormed });
    if (saved.damaged) this.log(`kdeconnect: identity.json was damaged (kept as .broken)${saved.from === 'backup' ? ', restored from backup' : ''}`);
    const j = saved.value;
    if (j && new Date(new crypto.X509Certificate(j.certPem).validTo) > new Date()) {
      Object.assign(this, { deviceId: j.deviceId, certPem: j.certPem, keyPem: j.keyPem });
      try {
        if (saved.from === 'backup') writeJson(idFile, j);
        if (!fs.existsSync(`${idFile}.bak`)) writeJson(`${idFile}.bak`, j);
      } catch (e) { this.log(`kdeconnect: identity backup failed ${e.message}`); }
    }
    if (!this.deviceId) {
      const forge = require('node-forge');
      this.deviceId = crypto.randomUUID().replace(/-/g, '');
      const { privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
      });
      const key = forge.pki.privateKeyFromPem(privateKey);
      const cert = forge.pki.createCertificate();
      cert.publicKey = forge.pki.setRsaPublicKey(key.n, key.e);
      cert.serialNumber = '01';
      const now = new Date();
      cert.validity.notBefore = new Date(now.getTime() - 365 * 864e5);
      cert.validity.notAfter = new Date(now.getTime() + 10 * 365 * 864e5);
      const attrs = [{ name: 'commonName', value: this.deviceId }, { name: 'organizationName', value: 'KDE' }, { shortName: 'OU', value: 'KDE Connect' }];
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.sign(key, forge.md.sha256.create());
      this.certPem = forge.pki.certificateToPem(cert);
      this.keyPem = privateKey;
      const identity = { deviceId: this.deviceId, certPem: this.certPem, keyPem: this.keyPem };
      writeJson(idFile, identity);
      try { writeJson(`${idFile}.bak`, identity); } catch (e) { this.log(`kdeconnect: identity backup failed ${e.message}`); }
      this.log(`kdeconnect: generated identity ${this.deviceId}`);
    }
    const x509 = new crypto.X509Certificate(this.certPem);
    this.ownSpki = x509.publicKey.export({ type: 'spki', format: 'der' });
    this.ownCertDer = x509.raw;
    const trusted = readJson(path.join(this.dir, 'trusted.json'), { backup: true, valid: isObject });
    if (trusted.damaged) this.log(`kdeconnect: trusted.json was damaged (kept as .broken)${trusted.from === 'backup' ? ', restored from backup' : ', paired devices lost'}`);
    this.trusted = trusted.value || {};
    for (const [id, t] of Object.entries(this.trusted)) {
      this.devices.set(id, { id, name: t.name, type: t.type, connected: false, paired: true, pairState: 'paired', island: t.island || null });
    }
  }

  saveTrusted() {
    try { writeJson(path.join(this.dir, 'trusted.json'), this.trusted, { space: 2, backup: true, valid: isObject }); } catch (e) { this.log(`kdeconnect: save trusted failed ${e.message}`); }
  }

  get deviceName() {
    return sanitizeName(this.nameOverride || os.hostname()) || 'Windows PC';
  }

  identityBody(extra = {}) {
    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      deviceType: 'desktop',
      protocolVersion: PROTOCOL_VERSION,
      incomingCapabilities: INCOMING,
      outgoingCapabilities: OUTGOING,
      islandPortFallback: 1,
      maxBluetoothPayload: BT_MAX_PAYLOAD,
      ...extra,
    };
  }

  tlsOptions() {
    return { key: this.keyPem, cert: this.certPem, minVersion: 'TLSv1.2', rejectUnauthorized: false };
  }

  // ---------------------------------------------------------------- lifecycle
  start(name) {
    if (this.started) return;
    this.started = true;
    this.nameOverride = name;
    try { this.loadIdentity(); } catch (e) { this.log(`kdeconnect: identity failed ${e.stack || e}`); this.started = false; return; }
    this.startTcp(MIN_PORT);
    this.startUdp();
    this.broadcastTimer = setInterval(() => this.broadcast(), 60000);
    this.emitDevices();
  }

  stop() {
    this.started = false;
    clearInterval(this.broadcastTimer);
    for (const id of this.pairTimers.keys()) this.clearPairTimer(id);
    for (const [addr, pending] of this.btPending) { clearTimeout(pending.timer); this.btDisconnect(addr); }
    this.btPending.clear();
    for (const pending of this.transferAcks.values()) pending.finish(false);
    for (const l of this.links.values()) l.close();
    for (const l of this.btLinks.values()) l.close();
    try { if (this.server) this.server.close(); } catch (_) { /* ignore */ }
    try { if (this.udp) this.udp.close(); } catch (_) { /* ignore */ }
    try { if (this.bonjour) this.bonjour.destroy(); } catch (_) { /* ignore */ }
    this.server = null; this.udp = null; this.bonjour = null;
  }

  startTcp(port) {
    const server = net.createServer((sock) => this.onIncomingTcp(sock).catch((e) => {
      this.log(`kdeconnect: incoming failed ${e.message}`);
      sock.destroy();
    }));
    server.on('error', (e) => {
      if (['EADDRINUSE','EACCES'].includes(e.code) && port !== 0) {
        this.startTcp(port < MAX_PORT ? port + 1 : 0); return;
      }
      this.log(`kdeconnect: tcp server error ${e.message}`);
      this.emit('status', { ok: false, detail: `TCP: ${e.message}` });
    });
    server.listen(port, '0.0.0.0', () => {
      this.server = server;
      this.tcpPort = server.address().port;
      this.log(`kdeconnect: listening on tcp ${port}, id ${this.deviceId}`);
      this.emit('status', { ok: true, detail: `TCP ${port}` });
      this.broadcast();
      this.startMdns();
    });
  }

  startUdp() {
    const udp = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    udp.on('error', (e) => { this.log(`kdeconnect: udp error ${e.message}`); });
    udp.on('message', (msg, rinfo) => this.onUdp(msg, rinfo));
    udp.bind(UDP_PORT, () => {
      try { udp.setBroadcast(true); } catch (_) { /* ignore */ }
      this.udp = udp;
      this.broadcast();
    });
  }

  startMdns() {
    try {
      const { Bonjour } = require('bonjour-service');
      this.bonjour = new Bonjour(undefined, (err) => this.log(`kdeconnect: mdns ${err && err.message}`));
      this.bonjour.publish({
        name: this.deviceId, type: 'kdeconnect', protocol: 'udp', port: this.tcpPort,
        txt: { id: this.deviceId, name: this.deviceName, type: 'desktop', protocol: String(PROTOCOL_VERSION) },
      });
      this.bonjour.find({ type: 'kdeconnect', protocol: 'udp' }, (svc) => {
        const id = svc && svc.txt && svc.txt.id;
        if (!id || id === this.deviceId || this.links.has(id)) return;
        const addrs = (svc.addresses || []).filter((a) => net.isIPv4(a));
        if (addrs.length) this.sendIdentityTo(addrs);
      });
    } catch (e) {
      this.log(`kdeconnect: mdns unavailable ${e.message}`);
    }
  }

  broadcastAddresses() {
    const out = new Set(['255.255.255.255']);
    for (const list of Object.values(os.networkInterfaces())) {
      for (const a of list || []) {
        if (a.family !== 'IPv4' || a.internal || !a.netmask) continue;
        const ip = a.address.split('.').map(Number);
        const mask = a.netmask.split('.').map(Number);
        out.add(ip.map((b, i) => (b | (~mask[i] & 255))).join('.'));
      }
    }
    return [...out];
  }

  sendIdentityTo(addresses) {
    if (!this.udp || !this.tcpPort) return;
    const data = Buffer.from(packet('kdeconnect.identity', this.identityBody({ tcpPort: this.tcpPort })));
    for (const addr of addresses) {
      this.udp.send(data, UDP_PORT, addr, (err) => { if (err) this.log(`kdeconnect: udp send ${addr} ${err.message}`); });
    }
  }

  broadcast() { this.sendIdentityTo(this.broadcastAddresses()); }

  // Add a phone manually by IP (when broadcasts are blocked on the network)
  connectIp(ip) {
    if (!net.isIPv4(ip)) return false;
    this.sendIdentityTo([ip]);
    return true;
  }

  rateLimited(key) {
    const now = Date.now();
    const last = this.lastConnect.get(key) || 0;
    if (now - last < 1500) return true;
    this.lastConnect.set(key, now);
    return false;
  }

  // ---------------------------------------------------------------- connection setup (LAN)
  onUdp(msg, rinfo) {
    const id = parseIdentity(msg.toString('utf8'));
    if (!id || id.deviceId === this.deviceId) return;
    const port = Number(id.tcpPort);
    if (!Number.isInteger(port) || port < (id.islandPortFallback === 1 ? 1024 : MIN_PORT) || port > (id.islandPortFallback === 1 ? 65535 : MAX_PORT)) return;
    if ((Number(id.protocolVersion) || 0) < 7) return;
    const existing = this.links.get(id.deviceId);
    if (existing && !existing.closed) return;
    if (this.rateLimited(id.deviceId)) return;
    this.connectTo(rinfo.address, port, id).catch((e) => this.log(`kdeconnect: connect ${rinfo.address}:${port} failed ${e.message}`));
  }

  // We discovered them: TCP connect, send identity, then act as TLS *server*.
  async connectTo(address, port, theirUdpIdentity) {
    const sock = net.connect({ host: address, port });
    await new Promise((res, rej) => { sock.once('connect', res); sock.once('error', rej); setTimeout(() => rej(new Error('connect timeout')), 6000); });
    sock.setNoDelay(true);
    const pv = Math.min(PROTOCOL_VERSION, Number(theirUdpIdentity.protocolVersion) || PROTOCOL_VERSION);
    sock.write(packet('kdeconnect.identity', this.identityBody({
      targetDeviceId: theirUdpIdentity.deviceId, targetProtocolVersion: Number(theirUdpIdentity.protocolVersion) || PROTOCOL_VERSION,
      protocolVersion: pv,
    })));
    const trusted = this.trusted[theirUdpIdentity.deviceId];
    const tsock = new tls.TLSSocket(sock, {
      isServer: true,
      secureContext: tls.createSecureContext(this.tlsOptions()),
      requestCert: true,
      rejectUnauthorized: false,
    });
    await new Promise((res, rej) => {
      tsock.once('secure', res);
      tsock.once('error', rej);
      setTimeout(() => rej(new Error('tls timeout')), 10000);
    });
    await this.finishHandshake(tsock, theirUdpIdentity, address, pv, trusted);
  }

  // They discovered us: read their identity, then act as TLS *client*.
  async onIncomingTcp(sock) {
    const address = (sock.remoteAddress || '').replace(/^::ffff:/, '');
    sock.setNoDelay(true);
    const line = await readLine(sock, 6000);
    const id = parseIdentity(line);
    if (!id || id.deviceId === this.deviceId) throw new Error('invalid identity');
    if (id.targetDeviceId && id.targetDeviceId !== this.deviceId) throw new Error('not for me');
    const pv = Number(id.protocolVersion) || 7;
    if (pv < 7) throw new Error('old protocol');
    if (this.rateLimited(`tcp:${id.deviceId}`)) throw new Error('rate limited');
    const trusted = this.trusted[id.deviceId];
    sock.pause();
    const tsock = tls.connect({ socket: sock, ...this.tlsOptions() });
    await new Promise((res, rej) => {
      tsock.once('secureConnect', res);
      tsock.once('error', rej);
      setTimeout(() => rej(new Error('tls timeout')), 10000);
    });
    await this.finishHandshake(tsock, id, address, Math.min(pv, PROTOCOL_VERSION), trusted);
  }

  async finishHandshake(tsock, plainIdentity, address, pv, trusted) {
    const peer = tsock.getPeerCertificate(true);
    if (!peer || !peer.raw) { tsock.destroy(); throw new Error('no peer certificate'); }
    const cn = certCN(peer);
    if (cn && cn !== plainIdentity.deviceId) { tsock.destroy(); throw new Error(`cert CN ${cn} != ${plainIdentity.deviceId}`); }
    const fp = sha256(peer.raw);
    if (trusted && trusted.certSha256 && trusted.certSha256 !== fp) {
      tsock.destroy();
      throw new Error('certificate of a paired device changed — refusing');
    }
    let identity = plainIdentity;
    if (pv >= 8) {
      tsock.write(packet('kdeconnect.identity', this.identityBody({ protocolVersion: pv })));
      const line = await readLine(tsock, 8000);
      const secure = parseIdentity(line);
      if (!secure || secure.deviceId !== plainIdentity.deviceId) { tsock.destroy(); throw new Error('secure identity mismatch'); }
      if ((Number(secure.protocolVersion) || 0) !== pv) { tsock.destroy(); throw new Error('protocol changed during handshake'); }
      identity = secure;
    }
    const info = this.makeInfo(identity, pv, peer.raw, fp);
    this.addLink(new Link(this, tsock, info, address));
  }

  makeInfo(identity, pv, certRaw, fp) {
    return {
      deviceId: identity.deviceId,
      deviceName: sanitizeName(identity.deviceName) || 'Phone',
      deviceType: identity.deviceType || 'phone',
      protocolVersion: pv,
      incoming: identity.incomingCapabilities || [],
      outgoing: identity.outgoingCapabilities || [],
      islandPortFallback: identity.islandPortFallback === 1,
      maxBluetoothPayload: validSize(identity.maxBluetoothPayload, BT_MAX_PAYLOAD) && identity.maxBluetoothPayload > 0 ? identity.maxBluetoothPayload : BT_MAX_PAYLOAD,
      certRaw,
      certSha256: fp,
    };
  }

  // ---------------------------------------------------------------- Bluetooth (helper owns the socket)
  btOpened(addr, name) {
    const previous = this.btPending.get(addr);
    if (previous) clearTimeout(previous.timer);
    if (this.btPending.size >= 8 && !previous) { this.btDisconnect(addr); return; }
    const st = { nonce: crypto.randomBytes(32).toString('hex'), timer: setTimeout(() => {
      this.log(`kdeconnect: bluetooth ${addr} authentication timeout`); this.btDisconnect(addr); this.btPending.delete(addr);
    }, 12000), name };
    this.btPending.set(addr, st);
    const body = this.identityBody({ bluetooth: true, certificate: this.ownCertDer.toString('base64'), btAuth: 2, nonce: st.nonce });
    this.btSend(addr, packet('kdeconnect.identity', body).trim());
  }

  btLine(addr, line) {
    for (const l of this.btLinks.values()) if (l.addr === addr && !l.closed) { l.receiveWireLine(line); return; }
    const st = this.btPending.get(addr);
    if (!st) return;
    try {
      if (Buffer.byteLength(line) > MAX_IDENTITY) throw new Error('bluetooth handshake too large');
      if (st.info) {
        const p = JSON.parse(line);
        const signature = p.body && p.body.signature;
        const encryptedKey = p.body && p.body.key;
        const transcript = btTranscript(st.info.deviceId, this.deviceId, st.peerNonce, st.nonce, st.info.certSha256, sha256(this.ownCertDer));
        if (p.type !== 'island.bt.auth' || typeof signature !== 'string' || signature.length > 1024
            || typeof encryptedKey !== 'string' || encryptedKey.length > 1024) throw new Error('bluetooth proof rejected');
        const sealed = Buffer.from(encryptedKey, 'base64');
        if (!crypto.verify('RSA-SHA256', Buffer.concat([transcript, sealed]), st.key, Buffer.from(signature, 'base64'))) throw new Error('bluetooth proof rejected');
        const seed = crypto.privateDecrypt({key:this.keyPem,oaepHash:'sha256',padding:crypto.constants.RSA_PKCS1_OAEP_PADDING},sealed);
        if (seed.length !== 32) throw new Error('invalid Bluetooth session key');
        st.info.btReceiveKey = btSessionKey(seed, transcript); st.info.btReceiveContext = transcript;
        clearTimeout(st.timer); this.btPending.delete(addr);
        st.info.btAuthenticated = true;
        this.addLink(new BtLink(this, addr, st.info));
        return;
      }
      const id = parseIdentity(line);
      if (!id || id.deviceId === this.deviceId) throw new Error('bad identity');
      if (id.btAuth !== 2 || !/^[a-f0-9]{64}$/.test(id.nonce || '')) throw new Error('Bluetooth authentication requires updated Blinkelo Link');
      const der = Buffer.from(String(id.certificate || ''), 'base64');
      if (!der.length) throw new Error('no certificate');
      const x = new crypto.X509Certificate(der);
      const cn = (x.subject.match(/CN=([^\n,]+)/) || [])[1] || '';
      if (cn !== id.deviceId) throw new Error('certificate CN mismatch');
      const fp = sha256(der);
      const trusted = this.trusted[id.deviceId];
      if (trusted && trusted.certSha256 && trusted.certSha256 !== fp) throw new Error('certificate of a paired device changed');
      st.info = this.makeInfo(id, Math.min(PROTOCOL_VERSION, Number(id.protocolVersion) || PROTOCOL_VERSION), der, fp);
      st.key = x.publicKey; st.peerNonce = id.nonce;
      const transcript = btTranscript(this.deviceId, id.deviceId, st.nonce, id.nonce, sha256(this.ownCertDer), fp);
      const seed = crypto.randomBytes(32);
      const sealed = crypto.publicEncrypt({key:x.publicKey,oaepHash:'sha256',padding:crypto.constants.RSA_PKCS1_OAEP_PADDING},seed);
      st.info.btSendKey = btSessionKey(seed,transcript); st.info.btSendContext = transcript;
      this.btSend(addr, packet('island.bt.auth', {key:sealed.toString('base64'),signature:crypto.sign('RSA-SHA256',Buffer.concat([transcript,sealed]),this.keyPem).toString('base64')}).trim());
    } catch (e) {
      clearTimeout(st.timer); this.btPending.delete(addr);
      this.log(`kdeconnect: bluetooth handshake ${addr} failed: ${e.message}`);
      this.btDisconnect(addr);
    }
  }

  btSent(addr, total) {
    for (const l of this.btLinks.values()) if (l.addr === addr && !l.closed) l.onSent(total);
  }

  btClosed(addr) {
    const st = this.btPending.get(addr);
    if (st) { clearTimeout(st.timer); this.btPending.delete(addr); }
    for (const l of this.btLinks.values()) if (l.addr === addr) l.close();
  }

  /** Paired devices with a Bluetooth address we could reconnect to (used by the helper loop). */
  btWanted() {
    return Object.values(this.trusted).some((t) => t && t.island);
  }

  // ---------------------------------------------------------------- links
  linkFor(deviceId) {
    const lan = this.links.get(deviceId);
    if (lan && !lan.closed) return lan;
    const bt = this.btLinks.get(deviceId);
    if (bt && !bt.closed) return bt;
    return null;
  }

  isTrustedLink(link) {
    const t = this.trusted[link.info.deviceId];
    return !link.closed && !!t && t.certSha256 === link.info.certSha256
      && (link.bluetooth ? this.btLinks : this.links).get(link.info.deviceId) === link;
  }

  addLink(link) {
    const info = link.info;
    const map = link.bluetooth ? this.btLinks : this.links;
    const trusted = this.trusted[info.deviceId];
    const connected = [this.links.get(info.deviceId), this.btLinks.get(info.deviceId)].filter((l) => l && !l.closed);
    if ((link.bluetooth && (!info.btAuthenticated || !info.btSendKey || !info.btReceiveKey)) || (trusted && trusted.certSha256 !== info.certSha256)
        || connected.some((l) => l.info.certSha256 !== info.certSha256)) { link.close(); return; }
    const old = map.get(info.deviceId);
    const wasConnected = !!this.linkFor(info.deviceId);
    map.set(info.deviceId, link);
    const before = this.devices.get(info.deviceId);
    if (before && before.pairLink === old) {
      this.clearPairTimer(info.deviceId); before.pairLink = null; before.verifyKey = ''; before.pairState = before.paired ? 'paired' : 'none';
    }
    if (old && !old.closed && old !== link) old.close();
    const dev = this.devices.get(info.deviceId) || { id: info.deviceId };
    Object.assign(dev, {
      name: info.deviceName, type: info.deviceType, connected: true,
      paired: !!this.trusted[info.deviceId], pairState: this.trusted[info.deviceId] ? 'paired' : (dev.pairState === 'requested' ? 'requested' : 'none'),
    });
    if (!link.bluetooth) dev.address = link.address;
    this.devices.set(info.deviceId, dev);
    this.log(`kdeconnect: linked ${info.deviceName} via ${link.bluetooth ? 'bluetooth' : link.address} v${info.protocolVersion} paired=${dev.paired}`);
    link.on('packet', (p) => {
      try { this.onPacket(link, p); } catch (e) { this.log(`kdeconnect: packet error ${e.stack || e}`); }
    });
    link.on('close', () => {
      const pending = this.devices.get(info.deviceId);
      if (pending && pending.pairLink === link) {
        this.clearPairTimer(info.deviceId); pending.pairLink = null; pending.verifyKey = ''; pending.pairState = pending.paired ? 'paired' : 'none';
      }
      if (map.get(info.deviceId) !== link) return;
      map.delete(info.deviceId);
      const stillUp = this.linkFor(info.deviceId);
      const d = this.devices.get(info.deviceId);
      if (!stillUp) {
        for (const pending of this.transferAcks.values()) if (pending.deviceId === info.deviceId) pending.finish(false);
        if (d) { d.connected = false; if (!d.paired) this.devices.delete(info.deviceId); }
        for (const k of [...this.players.keys()]) if (k.startsWith(`${info.deviceId}|`)) this.players.delete(k);
        this.emitMedia();
        this.emit('linkDown', { id: info.deviceId, name: info.deviceName });
      }
      if (link.bluetooth) this.emit('btLinkDown', { id: info.deviceId, name: info.deviceName, paired: !!(d && d.paired) });
      this.emitDevices();
    });
    if (this.trusted[info.deviceId]) {
      Object.assign(this.trusted[info.deviceId], { name: info.deviceName, type: info.deviceType, protocolVersion: info.protocolVersion });
      this.saveTrusted();
      if (!wasConnected) this.onPairedLinkReady(link);
    }
    if (link.bluetooth) this.emit('btLinkUp', { id: info.deviceId, name: info.deviceName });
    this.emitDevices();
  }

  onPairedLinkReady(link) {
    link.send('kdeconnect.notification.request', { request: true });
    link.send('kdeconnect.mpris.request', { requestPlayerList: true });
    link.send('kdeconnect.battery.request', { request: true });
    this.emit('linkUp', { id: link.info.deviceId, name: link.info.deviceName });
  }

  // ---------------------------------------------------------------- pairing
  verificationKey(link, timestamp) {
    try {
      const theirs = new crypto.X509Certificate(link.info.certRaw).publicKey.export({ type: 'spki', format: 'der' });
      const a = this.ownSpki; const b = theirs;
      const concat = Buffer.compare(a, b) < 0 ? Buffer.concat([b, a]) : Buffer.concat([a, b]);
      return sha256(Buffer.concat([concat, Buffer.from(String(timestamp))])).slice(0, 8).toUpperCase();
    } catch (_) { return ''; }
  }

  requestPair(deviceId) {
    const link = this.linkFor(deviceId);
    const dev = this.devices.get(deviceId);
    if (!link || !dev || dev.paired) return false;
    const ts = Math.floor(Date.now() / 1000);
    this.pairStamps.set(deviceId, ts);
    dev.pairState = 'requested';
    dev.pairLink = link;
    dev.verifyKey = this.verificationKey(link, ts);
    if (!link.send('kdeconnect.pair', { pair: true, timestamp: ts })) {
      dev.pairLink = null; dev.pairState = 'none'; dev.verifyKey = ''; return false;
    }
    this.setPairTimer(deviceId, 30000);
    this.emitDevices();
    return true;
  }

  acceptPair(deviceId) {
    const dev = this.devices.get(deviceId);
    const link = dev && dev.pairLink;
    if (!link || link.closed || !dev || dev.pairState !== 'requestedByPeer') return false;
    if (!link.send('kdeconnect.pair', { pair: true })) return false;
    this.markPaired(link);
    return true;
  }

  rejectPair(deviceId) {
    const dev = this.devices.get(deviceId);
    const link = (dev && dev.pairLink) || this.linkFor(deviceId);
    if (link) link.send('kdeconnect.pair', { pair: false });
    if (dev) { dev.pairState = dev.paired ? 'paired' : 'none'; dev.verifyKey = ''; dev.pairLink = null; }
    this.clearPairTimer(deviceId);
    this.emitDevices();
    return true;
  }

  unpair(deviceId) {
    const link = this.linkFor(deviceId);
    if (link) link.send('kdeconnect.pair', { pair: false });
    delete this.trusted[deviceId];
    for (const pending of this.transferAcks.values()) if (pending.deviceId === deviceId) pending.finish(false);
    this.clearPairTimer(deviceId);
    this.saveTrusted();
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.paired = false; dev.pairState = 'none'; dev.battery = undefined; dev.verifyKey = ''; dev.pairLink = null;
      if (!dev.connected) this.devices.delete(deviceId);
    }
    for (const k of [...this.players.keys()]) if (k.startsWith(`${deviceId}|`)) this.players.delete(k);
    for (const l of [this.links.get(deviceId), this.btLinks.get(deviceId)]) if (l) {
      if (l.payloadCancels) for (const cancel of [...l.payloadCancels]) cancel();
      if (l.pending) for (const tid of [...l.pending.keys()]) l.dropPending(tid);
      if (l.outgoing) for (const stream of l.outgoing) stream.destroy();
    }
    this.emitMedia();
    this.emitDevices();
    return true;
  }

  markPaired(link) {
    const id = link.info.deviceId;
    if (link.closed || (this.links.get(id) !== link && this.btLinks.get(id) !== link)) return;
    this.clearPairTimer(id);
    const dev = this.devices.get(id);
    this.trusted[id] = {
      name: link.info.deviceName, type: link.info.deviceType, certSha256: link.info.certSha256,
      certPem: new crypto.X509Certificate(link.info.certRaw).toString(), protocolVersion: link.info.protocolVersion,
      island: (dev && dev.island) || null,
    };
    this.saveTrusted();
    if (dev) { dev.paired = true; dev.pairState = 'paired'; dev.verifyKey = ''; dev.pairLink = null; }
    this.emit('paired', { id, name: link.info.deviceName });
    this.emitDevices();
    this.onPairedLinkReady(link);
  }

  setPairTimer(deviceId, ms) {
    this.clearPairTimer(deviceId);
    this.pairTimers.set(deviceId, setTimeout(() => {
      const dev = this.devices.get(deviceId);
      if (dev && (dev.pairState === 'requested' || dev.pairState === 'requestedByPeer')) {
        dev.pairState = dev.paired ? 'paired' : 'none'; dev.pairLink = null;
        dev.verifyKey = '';
        this.emit('pairTimeout', { id: deviceId, name: dev.name });
        this.emitDevices();
      }
    }, ms));
  }

  clearPairTimer(deviceId) {
    clearTimeout(this.pairTimers.get(deviceId));
    this.pairTimers.delete(deviceId);
  }

  onPair(link, body) {
    const id = link.info.deviceId;
    const dev = this.devices.get(id);
    if (!dev) return;
    if (link.closed || (this.links.get(id) !== link && this.btLinks.get(id) !== link)) return;
    if (body.pair) {
      if (dev.pairState === 'requested' && dev.pairLink === link) { this.markPaired(link); return; }
      const ts = Number(body.timestamp);
      if (link.info.protocolVersion >= 8) {
        const now = Date.now() / 1000;
        if (!Number.isSafeInteger(ts) || Math.abs(now - ts) > 1800) {
          link.send('kdeconnect.pair', { pair: false });
          this.emit('pairFailed', { id, name: dev.name, reason: 'clock' });
          return;
        }
      }
      if (dev.paired) { delete this.trusted[id]; this.saveTrusted(); dev.paired = false; }
      dev.pairState = 'requestedByPeer';
      dev.pairLink = link;
      dev.verifyKey = this.verificationKey(link, Number.isFinite(ts) ? ts : '');
      this.setPairTimer(id, 25000);
      this.emit('pairRequest', { id, name: dev.name, verifyKey: dev.verifyKey });
      this.emitDevices();
    } else {
      const wasPaired = dev.paired;
      this.clearPairTimer(id);
      if (wasPaired) {
        delete this.trusted[id];
        this.saveTrusted();
        for (const pending of this.transferAcks.values()) if (pending.deviceId === id) pending.finish(false);
        for (const l of [this.links.get(id), this.btLinks.get(id)]) if (l) {
          if (l.payloadCancels) for (const cancel of [...l.payloadCancels]) cancel();
          if (l.pending) for (const tid of [...l.pending.keys()]) l.dropPending(tid);
          if (l.outgoing) for (const stream of l.outgoing) stream.destroy();
        }
      }
      dev.paired = false;
      dev.pairState = 'none';
      dev.verifyKey = '';
      dev.pairLink = null;
      this.emit(wasPaired ? 'unpaired' : 'pairRejected', { id, name: dev.name });
      this.emitDevices();
    }
  }

  // ---------------------------------------------------------------- packets
  onPacket(link, p) {
    const id = link.info.deviceId;
    if (p.type === 'kdeconnect.pair') { this.onPair(link, p.body || {}); return; }
    if (!this.isTrustedLink(link)) { this.discardPayload(link, p); return; } // unpaired or replaced connections may only pair
    const body = p.body || {};
    const from = { deviceId: id, deviceName: link.info.deviceName };
    switch (p.type) {
      case 'island.transfer.result': {
        const pending = this.transferAcks.get(String(body.id || ''));
        if (pending && pending.deviceId === id) pending.receive(body.ok === true);
        break;
      }
      case 'kdeconnect.mpris': this.onMpris(link, p, body); break;
      case 'kdeconnect.notification': this.onNotification(link, p, body); break;
      case 'kdeconnect.telephony': this.onTelephony(link, body); break;
      case 'kdeconnect.battery': {
        const dev = this.devices.get(id);
        if (dev) {
          dev.battery = Number(body.currentCharge);
          dev.charging = !!body.isCharging;
          this.emitDevices();
        }
        if (Number(body.thresholdEvent) === 1) this.emit('batteryLow', { ...from, charge: Number(body.currentCharge) });
        break;
      }
      case 'kdeconnect.ping':
        this.emit('ping', { id, name: link.info.deviceName, message: body.message || '' });
        break;
      case 'island.hello': {
        const dev = this.devices.get(id);
        const island = { app: String(body.app || ''), version: String(body.version || ''), platform: String(body.platform || ''),
          model: String(body.model || ''), features: Array.isArray(body.features) ? body.features.map(String) : [] };
        if (dev) dev.island = island;
        if (this.trusted[id]) { this.trusted[id].island = island; this.saveTrusted(); }
        link.send('island.hello', { app: 'Blinkelo', version: this.appVersion || '', platform: 'windows', hostname: os.hostname(),
          features: ['mousepad', 'presenter', 'runcommand', 'systemvolume', 'sysinfo', 'apps', 'screenshot', 'pcmedia', 'tasks', 'timers', 'camera', 'pcnotify', 'findpc', 'clipboard', 'clipboard-image', 'share', 'bluetooth', 'transfer-ack', 'game'], maxBluetoothPayload: BT_MAX_PAYLOAD });
        this.emit('phoneHello', { ...from, island });
        this.emitDevices();
        break;
      }
      case 'kdeconnect.mousepad.request': this.emit('input', { ...from, body }); break;
      case 'kdeconnect.presenter': this.emit('presenter', { ...from, body }); break;
      case 'kdeconnect.systemvolume.request': this.emit('volumeRequest', { ...from, body }); break;
      case 'kdeconnect.runcommand.request': this.emit('runcommand', { ...from, body }); break;
      case 'island.sysinfo.request': this.emit('sysinfoRequest', { ...from, subscribe: body.subscribe !== false }); break;
      case 'island.apps.request': this.emit('appsRequest', { ...from, body }); break;
      case 'island.apps.launch': this.emit('appsLaunch', { ...from, id: String(body.id || '') }); break;
      case 'island.screenshot.request': this.emit('screenshotRequest', { ...from, body }); break;
      case 'island.media.request': this.emit('mediaRequest', { ...from, body }); break;
      case 'island.tasks': this.emit('tasks', { ...from, body }); break;
      case 'island.timer': this.emit('timer', { ...from, body }); break;
      case 'island.findpc': this.emit('findPc', { ...from, ringing: body.action !== 'stop' }); break;
      case 'island.game.request': this.emit('gameRequest', { ...from, body }); break;
      case 'kdeconnect.findmyphone.request': this.emit('findPc', { ...from, ringing: true }); break;
      case 'kdeconnect.clipboard':
      case 'kdeconnect.clipboard.connect':
        if (typeof body.content === 'string' && body.content) this.emit('clipboard', { ...from, text: body.content });
        break;
      case 'island.clipboard.image': this.onClipboardImage(link, p); break;
      case 'kdeconnect.share.request': this.onShare(link, p, body); break;
      default: this.discardPayload(link, p); break;
    }
  }

  discardPayload(link, p) {
    if (p._payloadFile && link.receivedFiles?.has(p._payloadFile)) link.releasePayloadFile(p._payloadFile);
  }

  // Separate payload sockets must prove the same identity as the paired control channel.
  async receivePayload(link, p, destination, onProgress) {
    const size = p.payloadSize;
    const port = p.payloadTransferInfo && p.payloadTransferInfo.port;
    if (!this.isTrustedLink(link) || !validSize(size, destination ? MAX_FILE : MAX_PAYLOAD)
        || !Number.isInteger(port) || port < (link.info.islandPortFallback ? 1024 : PAYLOAD_MIN_PORT)
        || port > (link.info.islandPortFallback ? 65535 : PAYLOAD_MAX_PORT) || link.bluetooth) return destination ? false : null;
    let socket, idle, output, partial;
    const chunks = [];
    const cancel = () => { if (socket) socket.destroy(new Error('payload cancelled')); };
    const bump = () => { clearTimeout(idle); idle = setTimeout(cancel, TRANSFER_IDLE); };
    try {
      socket = tls.connect({ host: link.address, port, ...this.tlsOptions() });
      link.payloadCancels.add(cancel);
      bump();
      await new Promise((resolve, reject) => {
        socket.once('secureConnect', () => {
          try { payloadPeer(socket, link); if (!this.isTrustedLink(link)) throw new Error('unpaired'); resolve(); }
          catch (error) { reject(error); }
        });
        socket.once('error', reject);
        socket.once('close', () => reject(new Error('payload closed before authentication')));
      });
      if (destination) {
        partial = destination + '.part-' + crypto.randomUUID();
        output = fs.createWriteStream(partial, { flags: 'wx' });
      } else {
        output = new Writable({ write(chunk, _encoding, done) { chunks.push(chunk); done(); } });
      }
      await pipeline(socket, byteCounter(size, (got, total) => { bump(); if (onProgress) onProgress(got, total); }), output);
      if (!this.isTrustedLink(link)) throw new Error('unpaired during transfer');
      if (destination) { await fs.promises.rename(partial, destination); partial = null; return true; }
      return Buffer.concat(chunks, size);
    } catch (error) {
      this.log('kdeconnect: payload ' + error.message);
      return destination ? false : null;
    } finally {
      clearTimeout(idle); link.payloadCancels.delete(cancel);
      if (socket) socket.destroy();
      if (output) output.destroy();
      if (partial) { try { await fs.promises.unlink(partial); } catch (_) {} }
    }
  }

  // Buffered Bluetooth payloads are accepted only from this link's bounded assembler.
  async fetchPayload(link, p) {
    if (!this.isTrustedLink(link) || !validSize(p.payloadSize, MAX_PAYLOAD)) { this.discardPayload(link, p); return null; }
    if (Buffer.isBuffer(p._payload)) return p._payload.length === p.payloadSize ? p._payload : null;
    if (p._payloadFile && link.receivedFiles && link.receivedFiles.has(p._payloadFile)) {
      try {
        if ((await fs.promises.stat(p._payloadFile)).size !== p.payloadSize) return null;
        return await fs.promises.readFile(p._payloadFile);
      } catch (_) { return null; }
      finally { link.releasePayloadFile(p._payloadFile); }
    }
    return this.receivePayload(link, p);
  }

  async fetchPayloadToFile(link, p, file, onProgress) {
    if (!this.isTrustedLink(link) || !validSize(p.payloadSize, MAX_FILE)) { this.discardPayload(link, p); return false; }
    if (Buffer.isBuffer(p._payload) || p._payloadFile) {
      let partial;
      try {
        if (p._payloadFile && (!link.receivedFiles || !link.receivedFiles.has(p._payloadFile))) return false;
        const actual = Buffer.isBuffer(p._payload) ? p._payload.length : (await fs.promises.stat(p._payloadFile)).size;
        if (actual !== p.payloadSize) return false;
        partial = file + '.part-' + crypto.randomUUID();
        if (Buffer.isBuffer(p._payload)) await fs.promises.writeFile(partial, p._payload, { flag: 'wx' });
        else await fs.promises.copyFile(p._payloadFile, partial, fs.constants.COPYFILE_EXCL);
        if (!this.isTrustedLink(link)) throw new Error('unpaired during transfer');
        await fs.promises.rename(partial, file); partial = null;
        if (onProgress) onProgress(p.payloadSize, p.payloadSize);
        return true;
      } catch (error) { this.log('kdeconnect: save ' + error.message); return false; }
      finally {
        if (partial) { try { await fs.promises.unlink(partial); } catch (_) {} }
        this.discardPayload(link, p);
      }
    }
    return this.receivePayload(link, p, file, onProgress);
  }

  imageDataUrl(buf, fallbackMime = 'image/png') {
    if (!buf || !buf.length) return null;
    let mime = fallbackMime;
    if (buf[0] === 0xff && buf[1] === 0xd8) mime = 'image/jpeg';
    else if (buf[0] === 0x89 && buf[1] === 0x50) mime = 'image/png';
    else if (buf.slice(0, 4).toString() === 'RIFF') mime = 'image/webp';
    return `data:${mime};base64,${buf.toString('base64')}`;
  }

  async onShare(link, p, body) {
    const from = { deviceId: link.info.deviceId, deviceName: link.info.deviceName };
    if (body.url) { this.emit('share', { ...from, kind: 'url', url: String(body.url) }); return; }
    if (body.text && !(Number(p.payloadSize) > 0)) { this.emit('share', { ...from, kind: 'text', text: String(body.text) }); return; }
    if (!(Number(p.payloadSize) >= 0) || (!p.payloadTransferInfo && !p._payload && !p._payloadFile)) return;
    const dir = this.downloadDir();
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) { /* ignore */ }
    const name = safeName(body.filename || 'file');
    const file = uniquePath(dir, name, this.incomingPaths);
    const key = pathKey(file);
    this.incomingPaths.add(key);
    const tid = crypto.randomBytes(4).toString('hex');
    const size = Number(p.payloadSize) || 0;
    const camera = !!(body.island && body.island.camera);
    this.emit('shareProgress', { ...from, tid, name, done: 0, total: size, state: 'active' });
    let last = 0;
    let ok = false;
    try {
      ok = await this.fetchPayloadToFile(link, p, file, (got, total) => {
        const now = Date.now();
        if (now - last > 250 || got >= total) { last = now; this.emit('shareProgress', { ...from, tid, name, done: got, total, state: 'active' }); }
      });
    } finally {
      this.incomingPaths.delete(key);
    }
    if (typeof body.transferId === 'string' && body.transferId.length <= 128) link.send('island.transfer.result', { id: body.transferId, ok });
    this.emit('shareProgress', { ...from, tid, name, state: ok ? 'done' : 'failed' });
    if (ok) this.emit('share', { ...from, kind: 'file', path: file, name: path.basename(file), size, camera });
  }

  async onClipboardImage(link, p) {
    const data = await this.fetchPayload(link, p);
    if (data && data.length) this.emit('clipboardImage', { deviceId: link.info.deviceId, deviceName: link.info.deviceName, data });
  }

  async onMpris(link, p, body) {
    const id = link.info.deviceId;
    if (Array.isArray(body.playerList)) {
      const names = body.playerList.map(String);
      for (const k of [...this.players.keys()]) {
        const [dev, name] = k.split('|');
        if (dev === id && !names.includes(name)) this.players.delete(k);
      }
      for (const name of names) link.send('kdeconnect.mpris.request', { player: name, requestNowPlaying: true, requestVolume: true });
      this.supportsArt = body.supportAlbumArtPayload !== false;
      this.emitMedia();
      return;
    }
    if (!body.player) return;
    const key = `${id}|${body.player}`;
    if (body.transferringAlbumArt) {
      const data = await this.fetchPayload(link, p);
      const url = this.imageDataUrl(data, 'image/jpeg');
      if (url && body.albumArtUrl) {
        this.artCache.set(body.albumArtUrl, url);
        if (this.artCache.size > 30) this.artCache.delete(this.artCache.keys().next().value);
        this.emitMedia();
      }
      return;
    }
    const prev = this.players.get(key) || {};
    const st = { ...prev, deviceId: id, deviceName: link.info.deviceName, player: body.player, updatedAt: Date.now() };
    const fields = ['title', 'artist', 'album', 'isPlaying', 'pos', 'length', 'canPlay', 'canPause', 'canGoNext', 'canGoPrevious', 'canSeek', 'albumArtUrl', 'volume'];
    for (const f of fields) if (body[f] !== undefined) st[f] = body[f];
    if (!st.title && body.nowPlaying) st.title = body.nowPlaying;
    if (st.isPlaying && !prev.isPlaying) st.startedAt = Date.now();
    this.players.set(key, st);
    if (st.albumArtUrl && !this.artCache.has(st.albumArtUrl) && st.albumArtUrl !== prev.requestedArt) {
      st.requestedArt = st.albumArtUrl;
      link.send('kdeconnect.mpris.request', { player: body.player, albumArtUrl: st.albumArtUrl });
    }
    this.emitMedia();
  }

  currentPlayer() {
    let best = null;
    for (const st of this.players.values()) {
      if (!st.title && !st.isPlaying) continue;
      if (!best) { best = st; continue; }
      if (st.isPlaying && !best.isPlaying) best = st;
      else if (st.isPlaying === best.isPlaying && (st.startedAt || st.updatedAt) > (best.startedAt || best.updatedAt)) best = st;
    }
    return best;
  }

  emitMedia() {
    const st = this.currentPlayer();
    if (!st) { this.emit('media', { present: false }); return; }
    const art = st.albumArtUrl ? this.artCache.get(st.albumArtUrl) || null : null;
    this.emit('media', {
      present: true,
      title: st.title || '', artist: st.artist || '', album: st.album || '',
      status: st.isPlaying ? 'playing' : 'paused',
      source: `${st.player} · ${st.deviceName}`, player: st.player, deviceId: st.deviceId,
      position: (Number(st.pos) || 0) / 1000 + (st.isPlaying ? (Date.now() - st.updatedAt) / 1000 : 0),
      duration: (Number(st.length) || 0) / 1000,
      canPlay: st.canPlay !== false, canPause: st.canPause !== false, canNext: st.canGoNext !== false, canPrev: st.canGoPrevious !== false,
      canSeek: !!st.canSeek,
      artKey: `phone:${st.deviceId}:${st.player}:${st.title}:${st.artist}:${art ? 1 : 0}`,
      art,
    });
  }

  mediaAction(action, arg) {
    const st = this.currentPlayer();
    if (!st) return false;
    const link = this.linkFor(st.deviceId);
    if (!link) return false;
    if (action === 'seek') link.send('kdeconnect.mpris.request', { player: st.player, SetPosition: Math.round(Number(arg) * 1000) });
    else link.send('kdeconnect.mpris.request', { player: st.player, action });
    return true;
  }

  async onNotification(link, p, body) {
    const id = link.info.deviceId;
    if (body.isCancel) { this.emit('notificationRemoved', { deviceId: id, id: String(body.id) }); return; }
    let icon = null;
    if (body.payloadHash && this.iconCache.has(body.payloadHash)) icon = this.iconCache.get(body.payloadHash);
    else if (p.payloadSize > 0) {
      const data = await this.fetchPayload(link, p);
      icon = this.imageDataUrl(data);
      if (icon && body.payloadHash) {
        this.iconCache.set(body.payloadHash, icon);
        if (this.iconCache.size > 120) this.iconCache.delete(this.iconCache.keys().next().value);
      }
    }
    this.emit('notification', {
      deviceId: id, deviceName: link.info.deviceName, id: String(body.id), appName: body.appName || link.info.deviceName,
      title: body.title || '', text: body.text || body.ticker || '', time: Number(body.time) || Date.now(),
      silent: !!body.silent, actions: Array.isArray(body.actions) ? body.actions.map(String) : [],
      replyId: body.requestReplyId || null, clearable: body.isClearable !== false, icon,
    });
  }

  onTelephony(link, body) {
    const isCancel = body.isCancel === true || body.isCancel === 'true';
    let thumb = null;
    if (body.phoneThumbnail) thumb = `data:image/jpeg;base64,${String(body.phoneThumbnail).replace(/\s+/g, '')}`;
    this.emit('telephony', {
      deviceId: link.info.deviceId, deviceName: link.info.deviceName, event: body.event || '', isCancel,
      contactName: body.contactName || body.phoneNumber || '', phoneNumber: body.phoneNumber || '', thumbnail: thumb,
    });
  }

  // ---------------------------------------------------------------- outgoing commands
  firstPairedLink() {
    for (const [id, l] of this.links) if (this.trusted[id] && !l.closed) return l;
    for (const [id, l] of this.btLinks) if (this.trusted[id] && !l.closed) return l;
    return null;
  }

  resolveLink(deviceId) {
    const link = deviceId ? this.linkFor(deviceId) : this.firstPairedLink();
    if (!link || !this.trusted[link.info.deviceId]) return null;
    return link;
  }

  sendTo(deviceId, type, body) {
    const link = this.resolveLink(deviceId);
    return link ? link.send(type, body) : false;
  }

  /** Sends to every paired, connected device (each over its best link). */
  sendAll(type, body, filter) {
    let n = 0;
    for (const id of Object.keys(this.trusted)) {
      if (filter && !filter(id)) continue;
      const l = this.linkFor(id);
      if (l && l.send(type, body)) n += 1;
    }
    return n;
  }

  /** Blinkelo Link phones only (they understand island.* packets). */
  sendIsland(type, body) {
    return this.sendAll(type, body, (id) => !!(this.devices.get(id) && this.devices.get(id).island));
  }

  /** Paired, reachable Blinkelo Link phones (optionally only those whose hello lists a feature). */
  islandPhones(feature) {
    const out = [];
    for (const id of Object.keys(this.trusted)) {
      const d = this.devices.get(id);
      if (!d || !d.island || !this.linkFor(id)) continue;
      if (feature && !(d.island.features || []).includes(feature)) continue;
      out.push(id);
    }
    return out;
  }

  hasIslandPhone() {
    for (const id of Object.keys(this.trusted)) {
      const d = this.devices.get(id);
      if (d && d.island && this.linkFor(id)) return true;
    }
    return false;
  }

  async sendPayload(deviceId, type, body, source, onProgress) {
    const link = this.resolveLink(deviceId);
    if (!link) return false;
    const dev = this.devices.get(link.info.deviceId);
    if (type !== 'kdeconnect.share.request' || !dev?.island?.features?.includes('transfer-ack'))
      return link.sendWithPayload(type, body, source, onProgress);
    const id = crypto.randomUUID();
    let resolveAck, timer;
    const acknowledgement = new Promise((resolve) => { resolveAck = resolve; });
    const pending = { deviceId: link.info.deviceId, sent: false, received: undefined,
      receive: (ok) => { pending.received = ok; if (pending.sent) pending.finish(ok); }, finish: (ok) => {
      if (!this.transferAcks.delete(id)) return;
      clearTimeout(timer); resolveAck(ok === true);
    } };
    this.transferAcks.set(id, pending);
    timer = setTimeout(() => pending.finish(false), 10 * 60000);
    try {
      const sent = await link.sendWithPayload(type, { ...body, transferId: id }, source, onProgress);
      if (!sent) pending.finish(false);
      else {
        pending.sent = true;
        if (pending.received !== undefined) pending.finish(pending.received);
        else if (this.transferAcks.has(id)) { clearTimeout(timer); timer = setTimeout(() => pending.finish(false), TRANSFER_IDLE); }
      }
      return await acknowledgement;
    } catch (_) { pending.finish(false); return false; }
  }

  static bufferSource(buf) {
    const { Readable } = require('stream');
    return { size: buf.length, open: () => Readable.from([buf]) };
  }

  static fileSource(file) {
    const size = fs.statSync(file).size;
    return { size, open: (opts) => fs.createReadStream(file, opts) };
  }

  shareFile(deviceId, file, onProgress) {
    let src;
    try { src = KdeConnect.fileSource(file); } catch (_) { return Promise.resolve(false); }
    const body = { filename: path.basename(file), numberOfFiles: 1, totalPayloadSize: src.size, lastModified: Date.now() };
    return this.sendPayload(deviceId, 'kdeconnect.share.request', body, src, onProgress);
  }

  shareText(deviceId, text) { return this.sendTo(deviceId, 'kdeconnect.share.request', { text: String(text) }); }
  shareUrl(deviceId, url) { return this.sendTo(deviceId, 'kdeconnect.share.request', { url: String(url) }); }
  sendClipboard(text) { return this.sendAll('kdeconnect.clipboard', { content: String(text) }); }
  sendClipboardImage(png) {
    const link = this.firstPairedLink();
    if (!link || !(this.devices.get(link.info.deviceId) || {}).island) return Promise.resolve(false);
    return link.sendWithPayload('island.clipboard.image', {}, KdeConnect.bufferSource(png));
  }

  notificationAction(deviceId, id, action) { return this.sendTo(deviceId, 'kdeconnect.notification.action', { key: id, action }); }
  notificationReply(deviceId, replyId, message) { return this.sendTo(deviceId, 'kdeconnect.notification.reply', { requestReplyId: replyId, message }); }
  notificationDismiss(deviceId, id) { return this.sendTo(deviceId, 'kdeconnect.notification.request', { cancel: id }); }
  findPhone(deviceId) { return this.sendTo(deviceId, 'kdeconnect.findmyphone.request', {}); }
  muteRinger(deviceId) { return this.sendTo(deviceId, 'kdeconnect.telephony.request_mute', {}); }
  ping(deviceId) { return this.sendTo(deviceId, 'kdeconnect.ping', { message: 'Blinkelo 😉' }); }
  sendSms(deviceId, number, message) { return this.sendTo(deviceId, 'kdeconnect.sms.request', { sendSms: true, phoneNumber: String(number), messageBody: String(message) }); }
  cameraRequest(deviceId) { return this.sendTo(deviceId, 'island.camera.request', { mode: 'photo' }); }

  // ---------------------------------------------------------------- state for UI
  deviceList() {
    return [...this.devices.values()].map((d) => {
      const lan = this.links.get(d.id);
      const bt = this.btLinks.get(d.id);
      return {
        id: d.id, name: d.name, type: d.type, address: d.address || '', connected: !!(lan || bt), paired: !!d.paired,
        pairState: d.pairState || 'none', verifyKey: d.verifyKey || '',
        battery: Number.isFinite(d.battery) ? d.battery : null, charging: !!d.charging,
        wifi: !!(lan && !lan.closed), bluetooth: !!(bt && !bt.closed),
        island: d.island || null,
      };
    });
  }

  emitDevices() {
    this.emit('devices', { me: { id: this.deviceId, name: this.deviceName, port: this.tcpPort || null, ips: this.localIps() }, devices: this.deviceList() });
  }

  localIps() {
    const out = [];
    for (const list of Object.values(os.networkInterfaces())) {
      for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
    return out;
  }
}

module.exports = { KdeConnect, sanitizeName, parseIdentity };
