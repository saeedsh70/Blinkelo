'use strict';
// Crash-safe JSON files.
// A plain writeFileSync truncates the file first: a crash, power cut or full disk in the middle leaves an empty or
// half-written file, and the next start silently falls back to defaults (settings, phone pairing, planner...).
// Here a file is written to "<file>.tmp", flushed to disk, then renamed over the real one, so readers only ever
// see the old or the new version. Important files also keep the previous good version as "<file>.bak" and are
// read back from it when the main file is missing or damaged. A damaged file is kept as "<file>.broken".
const fs = require('fs');
const path = require('path');

function sleepSync(ms) {
  try { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); } catch (_) { /* ignore */ }
}

function writeFileAtomic(file, text, { fsync = true } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  const data = Buffer.from(String(text), 'utf8');
  const fd = fs.openSync(tmp, 'w');
  try {
    let off = 0;
    while (off < data.length) off += fs.writeSync(fd, data, off, data.length - off);
    if (fsync) fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  // On Windows an antivirus scanner or the search indexer can hold the target for a moment.
  for (let attempt = 0; ; attempt += 1) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (e) {
      if (attempt >= 4 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) {
        try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
        throw e;
      }
      sleepSync(25 * (attempt + 1));
    }
  }
}

function parseFile(file, valid) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (valid && !valid(value)) throw new Error('unexpected content');
  return value;
}

// The current file becomes the backup, but only if it is valid: a damaged file never replaces a good backup.
function keepBackup(file, valid) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (_) { return; }
  try {
    const value = JSON.parse(text);
    if (valid && !valid(value)) return;
  } catch (_) { return; }
  try { writeFileAtomic(`${file}.bak`, text); } catch (_) { /* the main write still happens */ }
}

/**
 * Writes JSON atomically. Options: space (JSON indentation), backup (keep the previous good version as .bak),
 * valid (what counts as a good previous version), fsync (false for caches that can be rebuilt).
 * Throws when the file cannot be written; callers log it.
 */
function writeJson(file, value, { space, backup = false, valid, fsync = true } = {}) {
  const text = JSON.stringify(value, null, space);
  if (backup) keepBackup(file, valid);
  writeFileAtomic(file, text, { fsync });
}

/**
 * Reads JSON. Returns { value, from }: from = 'file' | 'backup' | null (nothing usable, value undefined).
 * With backup, a missing or damaged file is read from .bak; a damaged main file is copied to .broken first.
 */
function readJson(file, { backup = false, valid } = {}) {
  let damaged = false;
  try {
    return { value: parseFile(file, valid), from: 'file' };
  } catch (e) {
    damaged = e.code !== 'ENOENT';
  }
  if (damaged) {
    try { fs.copyFileSync(file, `${file}.broken`); } catch (_) { /* ignore */ }
  }
  if (backup) {
    try { return { value: parseFile(`${file}.bak`, valid), from: 'backup', damaged }; } catch (_) { /* no usable backup */ }
  }
  return { value: undefined, from: null, damaged };
}

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

module.exports = { writeFileAtomic, writeJson, readJson, isObject };
