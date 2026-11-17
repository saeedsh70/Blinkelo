'use strict';
// 1.5.0: deck keys, editable home layout, string table.
const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '..');
const deck = require(path.join(root, 'src/main/deck.js'));
const HL = require(path.join(root, 'src/shared/home-layout.js'));
const DM = require(path.join(root, 'src/shared/deck-meta.js'));
const fs = require('fs');

// deck: validation
assert.equal(deck.sanitizeKey({ kind: 'file', name: 'x', target: 'c:\\x.exe' }), null);
assert.equal(deck.sanitizeKey({ kind: 'hotkey', name: 'a', vk: 0, mods: 1 }), null);
assert.equal(deck.sanitizeKey({ kind: 'hotkey', name: 'a', vk: 83, mods: 99 }), null);
assert.equal(deck.sanitizeKey({ kind: 'media', name: 'a', target: 'eject' }), null);
assert.equal(deck.sanitizeKey({ kind: 'action', name: 'a', target: 'settings' }), null);
assert.equal(deck.sanitizeKey({ kind: 'command', name: 'a', target: 'a\nb' }), null);
const hk = deck.sanitizeKey({ kind: 'hotkey', name: ' Save ', vk: 83, mods: 5, target: 'Ctrl+Shift+S', color: '#FF0000', glyph: '../x', size: '9x9' });
assert.deepEqual(hk, { name: 'Save', kind: 'hotkey', target: 'Ctrl+Shift+S', color: '#ff0000', glyph: '', size: '1x1', vk: 83, mods: 5 });
assert.deepEqual(deck.sanitizePatch({ name: '  ', color: 'red', size: '2x2', kind: 'command', target: 'x' }), { color: '', size: '2x2' });

// deck: running keys
const sent = []; const spawned = []; const acts = []; const launched = [];
const ctx = { isWin: true, helper: { send: (...a) => { sent.push(a); return true; } }, action: (n) => { acts.push(n); return true; },
  spawn: (...a) => { spawned.push(a); return { unref() {} }; }, launch: (k) => { launched.push(k.id); return true; } };
assert(deck.run({ kind: 'hotkey', vk: 83, mods: 5 }, ctx)); assert.deepEqual(sent.pop(), ['input.key', 'vk', 83, 5]);
assert(deck.run({ kind: 'media', target: 'volup' }, ctx)); assert.deepEqual(sent.pop(), ['volume.delta', '0.05']);
assert(deck.run({ kind: 'media', target: 'next' }, ctx)); assert.deepEqual(sent.pop(), ['media.next']);
assert(deck.run({ kind: 'text', target: 'hi' }, ctx)); assert.deepEqual(sent.pop(), ['input.key', 'text', 'hi', 0]);
assert(deck.run({ kind: 'action', target: 'lock' }, ctx)); assert.deepEqual(acts, ['lock']);
assert.equal(deck.run({ kind: 'action', target: 'settings' }, ctx), false);
assert(deck.run({ kind: 'command', target: 'notepad.exe' }, ctx)); assert.deepEqual(spawned[0].slice(0, 2), ['cmd.exe', ['/d', '/s', '/c', 'notepad.exe']]);
assert.equal(deck.run({ kind: 'command', target: 'x' }, { ...ctx, isWin: false }), false);
assert(deck.run({ id: 'a1', kind: 'file', target: 'c:\\x.exe' }, ctx)); assert.deepEqual(launched, ['a1']);
assert.equal(deck.run({ kind: 'hotkey', vk: 83 }, { ...ctx, helper: null }), false);
assert.deepEqual(deck.publicKey({ id: 'k', name: 'n', kind: 'hotkey', target: 'Ctrl+S', vk: 83, mods: 1 }), { id: 'k', name: 'n', kind: 'hotkey', color: '', glyph: '', size: '1x1', hint: 'Ctrl+S' });
assert.equal(deck.publicKey({ id: 'k', name: 'n', kind: 'command', target: 'secret.exe' }).hint, '');

// home layout
const def = HL.normalize(null);
assert.equal(def.length, 5);
assert.equal(HL.addTile(def, 'weather'), null);                       // default layout is full
assert.deepEqual(HL.normalize({ custom: true, layout: [] }), []);     // the user may empty the home tab
assert.equal(HL.normalize({ custom: true, layout: [{ t: 'clock', x: 0, y: 0, w: 3, h: 5 }, { t: 'sys', x: 1, y: 1, w: 4, h: 2 }, { t: 'nope', x: 9, y: 0, w: 2, h: 2 }, { t: 'media', x: 10, y: 0, w: 5, h: 6 }] }).length, 1);
const sw = HL.moveTile(def, 'sys', 8, 4);
assert(sw.ok && sw.swap === 'widgets');
assert.equal(HL.moveTile(def, 'clock', 3, 0).ok, false);
assert.equal(HL.resizeTile(def, 'sys', 2, 2).ok, false);              // below the minimum
const freed = HL.resizeTile(def, 'media', 4, 3).list;
const withWx = HL.addTile(freed, 'weather');
assert(withWx && withWx.every((a, i) => withWx.every((b, j) => i === j || !HL.overlaps(a, b))));
assert.deepEqual(HL.rectPx({ x: 11, y: 5, w: 1, h: 1 }), { x: 583, y: 190, w: 45, h: 30 });
assert.deepEqual(DM.deckGrid('m'), { rows: 3, cols: 8, unit: 62.66 });

// strings: unique keys, one entry per language
const src = fs.readFileSync(path.join(root, 'src/shared/strings.js'), 'utf8');
const body = src.slice(src.indexOf('const T = {'), src.indexOf('\n};\n'));
const keys = [...body.matchAll(/^  ([A-Za-z_0-9]+): \[/gm)].map((m) => m[1]);
assert.equal(new Set(keys).size, keys.length);
const T = new Function(`${body}\n}; return T;`)();
for (const [k, v] of Object.entries(T)) assert(Array.isArray(v) && v.length === 6, `strings.${k}`);
const { DEFAULTS, deepMerge } = require(path.join(root, 'src/main/settings.js'));
assert.equal(DEFAULTS.transparency, 0);
assert.equal(deepMerge(DEFAULTS, { transparency: '40' }).transparency, 40);
assert.equal(deepMerge(DEFAULTS, { transparency: 'x' }).transparency, 0);
console.log('PASS v1.5 checks (deck validation + execution, home layout, strings)');
