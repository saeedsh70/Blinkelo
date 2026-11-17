'use strict';
// Planner tasks: stored as JSON in userData, with time-based reminders. The list is shared with the
// Blinkelo Link phone app: every change carries an `updated` stamp, deletions leave tombstones, and both
// sides merge last-writer-wins per task.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLORS = ['blue', 'green', 'orange', 'red', 'purple', 'pink', 'teal'];
const TOMBSTONE_KEEP = 30 * 86400000;

class Tasks extends EventEmitter {
  constructor(dir, log) {
    super();
    this.file = path.join(dir, 'tasks.json');
    this.log = log || (() => {});
    this.list = [];
    this.tombstones = {};
    this.timer = null;
    this.load();
  }

  load() {
    try {
      const j = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      const arr = Array.isArray(j) ? j : (j && Array.isArray(j.tasks) ? j.tasks : []);
      this.list = arr.filter((t) => t && t.id && ISO.test(t.date));
      for (const t of this.list) if (!t.updated) t.updated = t.created || Date.now();
      this.tombstones = (j && !Array.isArray(j) && j.tombstones && typeof j.tombstones === 'object') ? j.tombstones : {};
    } catch (_) {
      this.list = [];
      this.tombstones = {};
    }
  }

  save() {
    const cutoff = Date.now() - TOMBSTONE_KEEP;
    for (const [id, at] of Object.entries(this.tombstones)) if (at < cutoff) delete this.tombstones[id];
    try {
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ tasks: this.list, tombstones: this.tombstones }, null, 1));
      fs.renameSync(tmp, this.file);
    } catch (e) {
      this.log('tasks save failed', e.message);
    }
    this.emit('change', this.all());
  }

  all() {
    return this.list.slice().sort((a, b) => (a.date === b.date ? (a.time || '99:99').localeCompare(b.time || '99:99') || a.created - b.created : a.date.localeCompare(b.date)));
  }

  snapshot() {
    return { op: 'sync', tasks: this.list.map((t) => ({ ...t })), tombstones: { ...this.tombstones } };
  }

  local(t) { this.emit('sync', { op: 'upsert', task: { ...t } }); }

  add(input) {
    const title = String((input && input.title) || '').trim().slice(0, 200);
    if (!title || !ISO.test(input.date)) return null;
    const now = Date.now();
    const t = {
      id: crypto.randomUUID(), title, date: input.date, time: TIME.test(input.time || '') ? input.time : null,
      done: false, color: COLORS.includes(input.color) ? input.color : 'blue',
      created: now, updated: now, reminded: false,
    };
    this.list.push(t);
    if (this.list.length > 2000) this.list = this.list.slice(-2000);
    this.save();
    this.local(t);
    return t;
  }

  update(id, patch) {
    const t = this.list.find((x) => x.id === id);
    if (!t || !patch) return false;
    if (typeof patch.title === 'string' && patch.title.trim()) t.title = patch.title.trim().slice(0, 200);
    if (typeof patch.done === 'boolean') t.done = patch.done;
    if (patch.date && ISO.test(patch.date)) { t.date = patch.date; t.reminded = false; }
    if (patch.time === null || TIME.test(patch.time || '')) { t.time = patch.time || null; t.reminded = false; }
    if (patch.color && COLORS.includes(patch.color)) t.color = patch.color;
    t.updated = Date.now();
    this.save();
    this.local(t);
    return true;
  }

  remove(id) {
    const n = this.list.length;
    this.list = this.list.filter((t) => t.id !== id);
    if (this.list.length === n) return false;
    const at = Date.now();
    this.tombstones[id] = at;
    this.save();
    this.emit('sync', { op: 'remove', id, at });
    return true;
  }

  clearDone() {
    for (const t of this.list.filter((x) => x.done)) this.remove(t.id);
  }

  // ---------------------------------------------------------------- merging changes from the phone
  applyRemote(b) {
    if (!b || typeof b !== 'object') return false;
    let dirty = false;
    if (b.op === 'sync') {
      const ts = b.tombstones && typeof b.tombstones === 'object' ? b.tombstones : {};
      for (const [id, at] of Object.entries(ts)) dirty = this.remoteRemove(id, Number(at) || 0) || dirty;
      for (const t of Array.isArray(b.tasks) ? b.tasks : []) dirty = this.remoteUpsert(t) || dirty;
    } else if (b.op === 'upsert') {
      dirty = this.remoteUpsert(b.task);
    } else if (b.op === 'remove') {
      dirty = this.remoteRemove(String(b.id || ''), Number(b.at) || Date.now());
    }
    if (dirty) this.save();
    return dirty;
  }

  remoteUpsert(r) {
    if (!r || !r.id || !ISO.test(r.date || '')) return false;
    const title = String(r.title || '').trim().slice(0, 200);
    if (!title) return false;
    const ru = Number(r.updated || r.created) || 0;
    if (this.tombstones[r.id] && this.tombstones[r.id] >= ru) return false;
    const local = this.list.find((x) => x.id === r.id);
    if (local && (local.updated || local.created || 0) >= ru) return false;
    const t = {
      id: String(r.id), title, date: r.date, time: TIME.test(r.time || '') ? r.time : null, done: !!r.done,
      color: COLORS.includes(r.color) ? r.color : 'blue', created: Number(r.created) || ru, updated: ru,
      reminded: !!(local && local.reminded && local.date === r.date && local.time === (r.time || null)),
    };
    if (local) Object.assign(local, t); else this.list.push(t);
    delete this.tombstones[t.id];
    return true;
  }

  remoteRemove(id, at) {
    if (!id || typeof id !== 'string' || id.length > 128 || !Number.isSafeInteger(at) || at <= 0) return false;
    const local = this.list.find((x) => x.id === id);
    if (local && (local.updated || 0) > at) return false;
    const changed = !Object.hasOwn(this.tombstones, id) || this.tombstones[id] < at;
    if (changed) Object.defineProperty(this.tombstones, id, { value: at, enumerable: true, configurable: true, writable: true });
    if (!local) return changed;
    this.list = this.list.filter((x) => x.id !== id);
    return true;
  }

  // reminders: a task with a time fires once, up to 10 minutes late (e.g. after sleep)
  startReminders() {
    clearInterval(this.timer);
    this.timer = setInterval(() => this.check(), 20 * 1000);
    setTimeout(() => this.check(), 3000);
  }

  check() {
    const now = Date.now();
    let changed = false;
    for (const t of this.list) {
      if (t.done || t.reminded || !t.time) continue;
      const [y, m, d] = t.date.split('-').map(Number);
      const [hh, mm] = t.time.split(':').map(Number);
      const at = new Date(y, m - 1, d, hh, mm).getTime();
      if (now >= at) {
        t.reminded = true;
        changed = true;
        if (now - at < 10 * 60 * 1000) this.emit('reminder', t);
      }
    }
    if (changed) this.save();
  }
}

module.exports = { Tasks };
