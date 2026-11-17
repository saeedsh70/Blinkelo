'use strict';
// User app shortcuts: list installed apps (Start menu + Store apps), resolve icons and launch.
const { app, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

const IS_WIN = process.platform === 'win32';
const JUNK = /uninstall|remove|readme|help|documentation|manual|website|license|changelog|release notes|what's new|support|faq|\bdocs?\b/i;
let cache = null;
let cacheAt = 0;
const iconCache = new Map();

function startMenuDirs() {
  const dirs = [];
  if (process.env.ProgramData) dirs.push(path.join(process.env.ProgramData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'));
  if (process.env.APPDATA) dirs.push(path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs'));
  return dirs;
}

function walk(dir, depth, out) {
  if (depth > 4) return;
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1, out);
    else if (/\.(lnk|url)$/i.test(e.name)) out.push(p);
  }
}

function getStartApps() {
  return new Promise((resolve) => {
    if (!IS_WIN) { resolve([]); return; }
    const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    execFile(ps, ['-NoProfile', '-NonInteractive', '-Command',
      '[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Compress'],
    { windowsHide: true, timeout: 15000, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' }, (err, out) => {
      if (err || !out) { resolve([]); return; }
      try {
        const j = JSON.parse(out.trim());
        resolve((Array.isArray(j) ? j : [j]).filter((x) => x && x.Name && x.AppID));
      } catch (_) { resolve([]); }
    });
  });
}

async function listInstalled(force = false) {
  if (!force && cache && Date.now() - cacheAt < 5 * 60 * 1000) return cache;
  const files = [];
  for (const d of startMenuDirs()) walk(d, 0, files);
  const byName = new Map();
  for (const f of files) {
    const name = path.basename(f).replace(/\.(lnk|url)$/i, '');
    if (JUNK.test(name) || byName.has(name.toLowerCase())) continue;
    let target = '';
    if (IS_WIN && /\.lnk$/i.test(f)) {
      try { target = shell.readShortcutLink(f).target || ''; } catch (_) { target = ''; }
    }
    byName.set(name.toLowerCase(), { name, kind: 'file', target: f, iconPath: target && fs.existsSync(target) ? target : f });
  }
  for (const s of await getStartApps()) {
    const key = String(s.Name).toLowerCase();
    if (byName.has(key) || JUNK.test(s.Name)) continue;
    const id = String(s.AppID);
    // Win32 apps registered by path come back as a path; Store apps as PackageFamily!App
    if (/^[a-z]:\\/i.test(id) || /\{[0-9A-F-]+\}\\/i.test(id)) {
      byName.set(key, { name: s.Name, kind: 'aumid', target: id, iconPath: /^[a-z]:\\/i.test(id) ? id : '' });
    } else {
      byName.set(key, { name: s.Name, kind: 'aumid', target: id, iconPath: '' });
    }
  }
  cache = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  cacheAt = Date.now();
  return cache;
}

async function iconFor(item) {
  const p = item && (item.iconPath || (item.kind === 'file' ? item.target : ''));
  if (!p) return null;
  if (iconCache.has(p)) return iconCache.get(p);
  let url = null;
  try {
    const img = await app.getFileIcon(p, { size: 'large' });
    url = img && !img.isEmpty() ? img.toDataURL() : null;
  } catch (_) { url = null; }
  iconCache.set(p, url);
  return url;
}

// ---------------------------------------------------------------- Store app logos
// Fallback when the shell cannot render a packaged app's icon: read the logo straight from its AppxManifest.
let appxIndex = null;
let appxIndexAt = 0;
function appxPackages() {
  if (appxIndex && Date.now() - appxIndexAt < 10 * 60 * 1000) return appxIndex;
  appxIndexAt = Date.now();
  appxIndex = new Promise((resolve) => {
    if (!IS_WIN) { resolve(new Map()); return; }
    const ps = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    execFile(ps, ['-NoProfile', '-NonInteractive', '-Command',
      '[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-AppxPackage | Select-Object PackageFamilyName, InstallLocation | ConvertTo-Json -Compress'],
    { windowsHide: true, timeout: 25000, maxBuffer: 32 * 1024 * 1024, encoding: 'utf8' }, (err, out) => {
      const map = new Map();
      try {
        const j = JSON.parse(String(out || '').trim() || '[]');
        for (const p of (Array.isArray(j) ? j : [j])) {
          if (!p || !p.PackageFamilyName || !p.InstallLocation) continue;
          const k = String(p.PackageFamilyName).toLowerCase();
          if (!map.has(k)) map.set(k, []);
          map.get(k).push(String(p.InstallLocation));
        }
      } catch (_) { /* leave empty */ }
      if (!map.size) appxIndexAt = 0; // try again next time
      resolve(map);
    });
  });
  return appxIndex;
}

const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function manifestLogos(dir, appId) {
  let xml = '';
  try { xml = fs.readFileSync(path.join(dir, 'AppxManifest.xml'), 'utf8'); } catch (_) { return []; }
  const blocks = xml.split(/<Application\b/).slice(1);
  if (!blocks.length) return [];
  const block = blocks.find((b) => new RegExp(`\\bId="${escRe(appId)}"`).test(b.slice(0, b.indexOf('>')))) || blocks[0];
  const ve = (block.match(/<[\w:]*VisualElements\b[^>]*>/) || [''])[0];
  const out = [];
  for (const attr of ['Square44x44Logo', 'Square150x150Logo', 'Logo']) {
    const m = ve.match(new RegExp(`\\b${attr}="([^"]+)"`));
    if (m) out.push(m[1]);
  }
  const pkgLogo = xml.match(/<Properties>[\s\S]*?<Logo>([^<]+)<\/Logo>/);
  if (pkgLogo) out.push(pkgLogo[1]);
  return out;
}

// "Assets\Square44x44Logo.png" is a resource name: the files on disk carry qualifiers
// (Square44x44Logo.targetsize-48_altform-unplated.png, .scale-200.png, scale-200\Square44x44Logo.png ...)
function resolveLogo(dir, rel) {
  const full = path.join(dir, rel);
  const folder = path.dirname(full);
  const ext = path.extname(full).toLowerCase();
  const base = path.basename(full, path.extname(full)).toLowerCase();
  const found = [];
  const scan = (d, qualDir) => {
    let names = [];
    try { names = fs.readdirSync(d); } catch (_) { return; }
    for (const n of names) {
      const low = n.toLowerCase();
      if (!low.endsWith(ext)) continue;
      if (low === base + ext) found.push({ file: path.join(d, n), q: qualDir });
      else if (low.startsWith(`${base}.`)) found.push({ file: path.join(d, n), q: low.slice(base.length + 1, -ext.length) });
    }
  };
  scan(folder, '');
  try {
    for (const sub of fs.readdirSync(folder)) {
      if (/^(scale|targetsize)-\d+$/i.test(sub)) scan(path.join(folder, sub), sub.toLowerCase());
    }
  } catch (_) { /* ignore */ }
  const score = ({ q }) => {
    if (/contrast-(black|white)|altform-lightunplated/.test(q)) return -1;
    const ts = q.match(/targetsize-(\d+)/);
    if (ts) {
      const n = Number(ts[1]);
      return (/altform-unplated/.test(q) ? 400 : 300) - Math.abs(n - 64) / 4 - (n < 48 ? 60 : 0);
    }
    const sc = q.match(/scale-(\d+)/);
    if (sc) return 200 - Math.abs(Number(sc[1]) - 200) / 10;
    return 100;
  };
  found.sort((a, b) => score(b) - score(a));
  const best = found.find((f) => score(f) >= 0);
  return best ? best.file : null;
}

async function appxLogo(aumid) {
  if (!IS_WIN || !aumid || !aumid.includes('!')) return null;
  const [family, appId] = aumid.split('!');
  const dirs = (await appxPackages()).get(family.toLowerCase()) || [];
  for (const dir of dirs) {
    for (const rel of manifestLogos(dir, appId)) {
      const f = resolveLogo(dir, rel);
      if (f) return f;
    }
  }
  return null;
}

function launch(item) {
  if (!item || !item.target) return false;
  try {
    if (item.kind === 'url') {
      if (!/^https?:\/\//i.test(item.target)) return false;
      shell.openExternal(item.target);
    } else if (item.kind === 'aumid') {
      if (!IS_WIN || /["<>|]/.test(item.target)) return false;
      spawn('explorer.exe', [`shell:AppsFolder\\${item.target}`], { detached: true, stdio: 'ignore' }).unref();
    } else {
      shell.openPath(item.target);
    }
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = { listInstalled, iconFor, launch, appxLogo, resolveLogo, manifestLogos };
