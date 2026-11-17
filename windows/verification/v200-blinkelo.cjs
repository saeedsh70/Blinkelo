// 2.0.0 Blinkelo: rebrand, profile migration from "Dynamic Island", blink kit wiring.
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
function check(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }

check('package identity', () => {
  const pj = JSON.parse(read('package.json'));
  assert.strictEqual(pj.productName, 'Blinkelo');
  assert.strictEqual(pj.name, 'blinkelo');
  assert.match(pj.version, /^2\./);
  assert.match(read('src/main/main.js'), /setAppUserModelId\('com\.saeedsh\.blinkelo'\)/);
});

check('no old product name left in user-facing text', () => {
  const { strings, LANGS } = require('../src/shared/strings.js');
  for (const l of LANGS) {
    const t = strings(l.code || l);
    for (const [k, v] of Object.entries(t)) {
      assert(!/Dynamic Island|灵动岛|Island Link/.test(String(v)), `${l.code || l}.${k}: ${v}`);
    }
    for (const k of ['blinkHello', 'blinkHelloHint', 'blinkIdle', 'blinkIdleHint', 'blinkEvents', 'blinkEventsHint', 'blinkHi', 'blinkTagline', 't_blink']) assert(t[k], `${l.code || l}.${k}`);
  }
  for (const rel of ['src/renderer/island/index.html', 'src/renderer/settings/index.html', 'src/renderer/settings/settings.src.js']) {
    assert(!/Dynamic Island/.test(read(rel)), rel);
  }
  assert.match(read('src/main/kdeconnect.js'), /app: 'Blinkelo'/);
});

check('blink settings default on', () => {
  const { DEFAULTS, deepMerge } = require('../src/main/settings.js');
  assert.deepStrictEqual(DEFAULTS.blink, { hello: true, peeks: false, events: true });
  // a 2.0.0 settings file still carrying the old always-on `idle` key gets the new default: peeks off
  const merged = deepMerge(DEFAULTS, { blink: { idle: true, events: false } });
  assert.deepStrictEqual(merged.blink, { hello: true, peeks: false, events: false });
});

check('first start copies the Dynamic Island profile, once, without touching it', () => {
  const src = read('src/main/main.js');
  const start = src.indexOf('const LEGACY_PROFILES');
  const end = src.indexOf('const profileMigration');
  assert(start > 0 && end > start, 'migration block');
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'blinkelo-mig-'));
  const appData = path.join(base, 'Roaming');
  const oldDir = path.join(appData, 'Dynamic Island');
  const newDir = path.join(appData, 'Blinkelo');
  fs.mkdirSync(path.join(oldDir, 'kdeconnect'), { recursive: true });
  fs.mkdirSync(path.join(oldDir, 'Cache'), { recursive: true });
  fs.mkdirSync(path.join(oldDir, 'logs'), { recursive: true });
  fs.writeFileSync(path.join(oldDir, 'settings.json'), '{"language":"en"}');
  fs.writeFileSync(path.join(oldDir, 'Local State'), '{"os_crypt":{}}');
  fs.writeFileSync(path.join(oldDir, 'kdeconnect', 'key.pem'), 'KEY');
  fs.writeFileSync(path.join(oldDir, 'kdeconnect', 'trusted.json'), '{}');
  fs.writeFileSync(path.join(oldDir, 'Cache', 'big.bin'), 'x');
  fs.writeFileSync(path.join(oldDir, 'logs', 'main.log'), 'x');
  fs.mkdirSync(newDir, { recursive: true });
  fs.writeFileSync(path.join(newDir, 'lockfile'), ''); // the single-instance lock is already there
  const app = { getPath: (k) => (k === 'userData' ? newDir : appData) };
  // eslint-disable-next-line no-new-func
  const run = new Function('app', 'fs', 'path', `${src.slice(start, end)}; return migrateLegacyProfile();`);
  const res = run(app, fs, path);
  assert(res && res.failed === 0, JSON.stringify(res));
  assert.strictEqual(fs.readFileSync(path.join(newDir, 'settings.json'), 'utf8'), '{"language":"en"}');
  assert.strictEqual(fs.readFileSync(path.join(newDir, 'kdeconnect', 'key.pem'), 'utf8'), 'KEY');
  assert(fs.existsSync(path.join(newDir, 'Local State')));
  assert(!fs.existsSync(path.join(newDir, 'Cache')));
  assert(!fs.existsSync(path.join(newDir, 'logs')));
  assert(fs.existsSync(path.join(newDir, 'migrated-from.json')));
  assert(fs.existsSync(path.join(oldDir, 'settings.json')), 'old profile untouched');
  // second start: Blinkelo already has its own settings -> nothing happens
  fs.writeFileSync(path.join(newDir, 'settings.json'), '{"language":"ar"}');
  assert.strictEqual(run(app, fs, path), null);
  assert.strictEqual(fs.readFileSync(path.join(newDir, 'settings.json'), 'utf8'), '{"language":"ar"}');
  fs.rmSync(base, { recursive: true, force: true });
});

check('blink kit: JS timings match the CSS keyframes', () => {
  const js = read('src/renderer/shared/blink.js');
  const css = read('src/renderer/shared/blink.css');
  const ms = JSON.parse(js.match(/BLINK_MS = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));
  const pairs = { blink: 'bk-blink', blink2: 'bk-blink2', wink: 'bk-wink-face', look: 'bk-look', wake: 'bk-wake', sleep: 'bk-sleep' };
  for (const [k, name] of Object.entries(pairs)) {
    assert(new RegExp(`animation: ${name} ${ms[k]}ms`).test(css), `${name} ${ms[k]}ms`);
  }
});

check('island + settings are wired to the kit', () => {
  const html = read('src/renderer/island/index.html');
  assert(/<body class="bk-boot bk-peek">/.test(html), 'hello is the first thing shown');
  assert(/id="bkFace"/.test(html) && /id="bkLash"/.test(html) && /shared\/blink\.css/.test(html));
  assert(/shared\/blink\.css/.test(read('src/renderer/settings/index.html')));
  const css = read('src/renderer/island/island.css');
  assert(/#mainClip\.bk-reveal #mainHost/.test(css) && /body\.bk-peek #bkFace/.test(css));
  const bundle = read('src/renderer/island/island.bundle.js');
  assert(/bk-reveal/.test(bundle) && /bk-peek/.test(bundle) && /function faceHtml/.test(bundle), 'island bundle rebuilt');
  assert(/function createBlinker/.test(read('src/renderer/settings/settings.js')), 'settings bundle rebuilt');
  for (const f of ['tray.png', 'tray@2x.png', 'tray-half.png', 'tray-closed.png', 'tray-wink.png', 'tray-wink@2x.png', 'icon.ico', 'icon.png']) {
    assert(fs.statSync(path.join(ROOT, 'assets', f)).size > 200, f);
  }
});

check('drag and wheel volume work over a scrolling song title', () => {
  const js = read('src/renderer/island/island.js');
  assert(/\.scroll:not\(\.marquee\)/.test(js), 'marquee titles must not block drag-to-move');
  assert(/addEventListener\('wheel', \(e\) => \{[^]*?closest\('\.scroll:not\(\.marquee\)'\)/.test(js), 'marquee titles must not block wheel volume');
  assert(!/closest\('\.scroll'\)/.test(js), 'no bare .scroll filter left');
});

console.log(`v2.0.0 Blinkelo checks: ${passed} passed`);
