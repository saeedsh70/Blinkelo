'use strict';
// Crash-safe JSON files: settings, the PC identity, paired devices and the planner survive a damaged file
// (a crash or power cut in the middle of a write), and a damaged file never replaces a good backup.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { writeJson, readJson } = require('../src/main/jsonfile');
const { Settings, DEFAULTS } = require('../src/main/settings');
const { Tasks } = require('../src/main/tasks');
const { KdeConnect } = require('../src/main/kdeconnect');

const work = fs.mkdtempSync(path.join(os.tmpdir(), 'blinkelo-json-'));
const passed = [];
const check = (name, fn) => { fn(); passed.push(name); };
const json = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const POWER_CUT = '\0'.repeat(64); // what an interrupted write can leave behind

try {
  check('atomic write round trip, no temp file left', () => {
    const f = path.join(work, 'nested', 'x.json');
    writeJson(f, { a: 1 });
    assert.deepEqual(readJson(f), { value: { a: 1 }, from: 'file' });
    assert(!fs.existsSync(`${f}.tmp`));
    writeJson(f, { a: 2 }, { fsync: false });
    assert.deepEqual(json(f), { a: 2 });
  });

  check('backup keeps the previous good version only', () => {
    const f = path.join(work, 'b.json');
    writeJson(f, { v: 1 }, { backup: true });
    assert(!fs.existsSync(`${f}.bak`), 'nothing to back up on the first write');
    writeJson(f, { v: 2 }, { backup: true });
    assert.deepEqual(json(`${f}.bak`), { v: 1 });
    fs.writeFileSync(f, '{"v":');
    writeJson(f, { v: 3 }, { backup: true });
    assert.deepEqual(json(`${f}.bak`), { v: 1 }, 'a damaged file never replaces a good backup');
    assert.deepEqual(json(f), { v: 3 });
  });

  check('missing file vs damaged file', () => {
    const f = path.join(work, 'c.json');
    assert.deepEqual(readJson(f, { backup: true }), { value: undefined, from: null, damaged: false });
    fs.writeFileSync(f, POWER_CUT);
    const r = readJson(f, { backup: true });
    assert.equal(r.from, null);
    assert.equal(r.damaged, true);
    assert(fs.existsSync(`${f}.broken`), 'the damaged file is kept for manual recovery');
  });

  check('settings: damaged file is restored from the backup', () => {
    const dir = path.join(work, 'settings');
    const first = new Settings(dir);
    assert.equal(first.loadedFrom, null, 'first run');
    first.set({ language: 'ar' });
    first.set({ style: 'notch' });
    const file = path.join(dir, 'settings.json');
    fs.writeFileSync(file, POWER_CUT);
    const restored = new Settings(dir);
    assert.equal(restored.damaged, true);
    assert.equal(restored.loadedFrom, 'backup');
    assert.equal(restored.data.language, 'ar', 'the backup is one change behind');
    assert.equal(restored.data.style, DEFAULTS.style);
    assert(fs.existsSync(`${file}.broken`));
    restored.set({ style: 'notch' });
    const again = new Settings(dir);
    assert.equal(again.loadedFrom, 'file');
    assert.equal(again.damaged, false);
    assert.equal(again.data.style, 'notch');
  });

  check('settings: unusable content without a backup falls back to defaults', () => {
    for (const content of ['null', '[1,2]', '"text"', '']) {
      const dir = path.join(work, `settings-${passed.length}-${content.length}-${Math.random().toString(36).slice(2, 6)}`);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'settings.json'), content);
      const s = new Settings(dir);
      assert.equal(s.damaged, true, `damaged: ${JSON.stringify(content)}`);
      assert.equal(s.data.language, DEFAULTS.language);
      assert.equal(typeof s.get(), 'object');
    }
  });

  check('planner: damaged tasks.json is restored from the backup', () => {
    const dir = path.join(work, 'tasks');
    fs.mkdirSync(dir, { recursive: true });
    const logs = [];
    const t1 = new Tasks(dir, (m) => logs.push(m));
    t1.add({ title: 'first', date: '2026-11-17' });
    t1.add({ title: 'second', date: '2026-11-18' });
    fs.writeFileSync(path.join(dir, 'tasks.json'), POWER_CUT);
    const t2 = new Tasks(dir, (m) => logs.push(m));
    assert.deepEqual(t2.all().map((t) => t.title), ['first']);
    assert(logs.some((m) => /restored from backup/.test(m)));
  });

  check('PC identity and paired devices survive a damaged file', () => {
    const dir = path.join(work, 'kdeconnect');
    const logs = [];
    const k1 = new KdeConnect({ dir, log: (m) => logs.push(m) });
    k1.loadIdentity();
    const idFile = path.join(dir, 'identity.json');
    assert(fs.existsSync(`${idFile}.bak`), 'a new identity is written twice');
    const phoneA = 'a'.repeat(32);
    const phoneB = 'b'.repeat(32);
    k1.trusted[phoneA] = { name: 'Phone A', type: 'phone', certSha256: '00' };
    k1.saveTrusted();
    k1.trusted[phoneB] = { name: 'Phone B', type: 'phone', certSha256: '11' };
    k1.saveTrusted();

    fs.writeFileSync(idFile, POWER_CUT);
    fs.writeFileSync(path.join(dir, 'trusted.json'), '{"broken": ');
    const k2 = new KdeConnect({ dir, log: (m) => logs.push(m) });
    k2.loadIdentity();
    assert.equal(k2.deviceId, k1.deviceId, 'same identity: phones stay paired');
    assert.equal(k2.certPem, k1.certPem);
    assert.equal(json(idFile).deviceId, k1.deviceId, 'identity.json repaired from the backup');
    assert.deepEqual(Object.keys(k2.trusted), [phoneA], 'paired devices from the backup (one change behind)');
    assert(fs.existsSync(`${idFile}.broken`));
    assert(logs.some((m) => /identity\.json was damaged/.test(m)));

    fs.rmSync(`${idFile}.bak`);
    const k3 = new KdeConnect({ dir, log: () => {} });
    k3.loadIdentity();
    assert.equal(k3.deviceId, k1.deviceId);
    assert.equal(json(`${idFile}.bak`).deviceId, k1.deviceId, 'existing installs get an identity backup on start');
  });

  console.log(`PASS json safety: ${passed.length} checks (${passed.join('; ')})`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
