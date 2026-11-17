'use strict';
// Support / donation entry points: one place for the links, every string in all languages, wired into settings and tray.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const LINKS = require('../src/shared/links');
const { strings, LANGS } = require('../src/shared/strings');
let n = 0;
const ok = (name, fn) => { fn(); n++; console.log(`ok - ${name}`); };

ok('links point to the public repository', () => {
  assert.strictEqual(LINKS.REPO, 'https://github.com/saeedsh70/Blinkelo');
  for (const k of ['DONATE', 'ISSUES', 'RELEASES']) assert.ok(LINKS[k].startsWith(`${LINKS.REPO}/`), k);
  assert.ok(LINKS.DONATE.endsWith('/DONATE.md'));
});

ok('support strings exist in every language', () => {
  for (const { code } of LANGS) {
    const s = strings(code);
    for (const k of ['support', 'supportTitle', 'supportText', 'donateCrypto', 'starGithub', 'reportBug', 'supportFree']) {
      assert.ok(typeof s[k] === 'string' && s[k].trim() && s[k] !== k, `${code}.${k}`);
    }
  }
});

ok('settings has a Support page, About links to it, links go through openUrl', () => {
  const src = read('src/renderer/settings/settings.src.js');
  assert.ok(src.includes("['support', 'heart'], ['about', 'flag']"));
  assert.ok(/support\(\) \{[\s\S]*LINKS\.DONATE[\s\S]*LINKS\.REPO[\s\S]*LINKS\.ISSUES/.test(src));
  assert.ok(src.includes('data-go="support"'));
  const bundle = read('src/renderer/settings/settings.js');
  assert.ok(bundle.includes(LINKS.DONATE.replace(LINKS.REPO, '')) && bundle.includes(LINKS.REPO), 'bundle rebuilt');
  assert.ok(/case 'openUrl': if \(typeof arg === 'string' && \/\^\(https\?/.test(read('src/main/main.js')), 'openUrl only allows web links');
});

ok('tray menu opens the donation page', () => {
  const main = read('src/main/main.js');
  assert.ok(main.includes("require('../shared/links')"));
  assert.ok(main.includes('shell.openExternal(LINKS.DONATE)'));
});

ok('no stale project links in the island demos', () => {
  for (const f of ['src/renderer/island/island.js', 'src/renderer/island/demo.js', 'src/renderer/island/island.bundle.js']) {
    assert.ok(!/github\.com\/SaeedSH/.test(read(f)), f);
  }
});

console.log(`support links checks: ${n} passed`);
