'use strict';
// Builds a portable Windows release: dist/Blinkelo-<version>-win-x64/ (Blinkelo.exe + resources/app) and a .zip of it.
//
//   npm run package                          uses node_modules/electron/dist (a full `npm ci` downloads it)
//   npm run package -- --electron <folder>   uses another unpacked Electron of the same version
//
// Only what the app needs at run time goes into resources/app: src, native, assets, package.json, README, LICENSE and
// the production dependencies. The exe gets the Blinkelo icon and version info (rcedit, a dev dependency).
const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const electronDir = path.resolve(arg('--electron') || path.join(root, 'node_modules', 'electron', 'dist'));
const outRoot = path.resolve(arg('--out') || path.join(root, 'dist'));
const name = `Blinkelo-${pkg.version}-win-x64`;
const outDir = path.join(outRoot, name);
const fail = (msg) => { console.error(`package: ${msg}`); process.exit(1); };

if (process.platform !== 'win32') fail('Windows only (Blinkelo.exe and rcedit are Windows programs)');
const exeIn = ['electron.exe', 'Blinkelo.exe'].map((f) => path.join(electronDir, f)).find((f) => fs.existsSync(f));
if (!exeIn) fail(`no Electron in ${electronDir} (run a full "npm ci", or pass --electron <folder>)`);
const wanted = String((pkg.devDependencies || {}).electron || '').replace(/^[^0-9]*/, '');
let found = '';
try { found = fs.readFileSync(path.join(electronDir, 'version'), 'utf8').trim(); } catch (_) { /* older layouts */ }
if (wanted && found && found !== wanted) fail(`Electron ${found} in ${electronDir}, package.json wants ${wanted}`);

fs.rmSync(outDir, { recursive: true, force: true });
fs.rmSync(`${outDir}.zip`, { force: true });
fs.mkdirSync(outDir, { recursive: true });

// 1) Electron runtime, without its resources folder (default_app.asar or an installed app)
for (const entry of fs.readdirSync(electronDir)) {
  if (entry === 'resources') continue;
  const target = entry === path.basename(exeIn) ? 'Blinkelo.exe' : entry;
  fs.cpSync(path.join(electronDir, entry), path.join(outDir, target), { recursive: true });
}

// Chromium's own UI strings (context menus, dialogs): keep only the app's languages, the rest fall back to en-US
const KEEP_LOCALES = /^(en-US|en-GB|ar|tr|es|es-419|ru|zh-CN|zh-TW)\.pak$/;
const locales = path.join(outDir, 'locales');
if (fs.existsSync(locales)) for (const f of fs.readdirSync(locales)) if (!KEEP_LOCALES.test(f)) fs.rmSync(path.join(locales, f));

// 2) the app
const app = path.join(outDir, 'resources', 'app');
fs.mkdirSync(app, { recursive: true });
for (const item of ['src', 'native', 'assets', 'package.json', 'README.md']) fs.cpSync(path.join(root, item), path.join(app, item), { recursive: true });
const license = [path.join(root, 'LICENSE'), path.join(root, '..', 'LICENSE')].find((f) => fs.existsSync(f));
if (license) fs.copyFileSync(license, path.join(app, 'LICENSE'));

// 3) production dependencies only, as npm resolved them (no electron, esbuild, rcedit)
const listed = execSync('npm ls --omit=dev --all --parseable', { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/).map((s) => s.trim()).filter((p) => p && path.resolve(p) !== root);
for (const dir of listed) {
  const rel = path.relative(root, dir);
  if (!rel.startsWith('node_modules')) continue;
  fs.cpSync(dir, path.join(app, rel), { recursive: true, filter: (src) => !src.slice(dir.length).includes(`${path.sep}node_modules${path.sep}`) });
}

// 4) icon and version info of the exe
const exe = path.join(outDir, 'Blinkelo.exe');
try {
  const rcedit = path.join(path.dirname(require.resolve('rcedit/package.json', { paths: [root] })), 'bin', 'rcedit-x64.exe');
  execFileSync(rcedit, [exe,
    '--set-icon', path.join(root, 'assets', 'icon.ico'),
    '--set-file-version', pkg.version, '--set-product-version', pkg.version,
    '--set-version-string', 'ProductName', pkg.productName || 'Blinkelo',
    '--set-version-string', 'FileDescription', pkg.productName || 'Blinkelo',
    '--set-version-string', 'OriginalFilename', 'Blinkelo.exe',
    '--set-version-string', 'LegalCopyright', `${pkg.author || ''} (MIT)`.trim()]);
} catch (e) {
  console.warn(`package: icon/version info not set (${e.message.split('\n')[0]}); run "npm ci" to get rcedit`);
}

// 5) zip
const zip = `${outDir}.zip`;
execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
  `Compress-Archive -Path '${outDir.replace(/'/g, "''")}' -DestinationPath '${zip.replace(/'/g, "''")}' -CompressionLevel Optimal`], { stdio: 'inherit' });

const size = (p) => { let n = 0; for (const e of fs.readdirSync(p, { withFileTypes: true })) n += e.isDirectory() ? size(path.join(p, e.name)) : fs.statSync(path.join(p, e.name)).size; return n; };
console.log(`package: ${path.relative(root, outDir)} (${(size(outDir) / 1048576).toFixed(0)} MB), ${path.relative(root, zip)} (${(fs.statSync(zip).size / 1048576).toFixed(0)} MB)`);
console.log(`package: Electron ${found || '?'}, ${listed.filter((d) => d.includes('node_modules')).length} production packages`);
