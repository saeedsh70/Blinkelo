'use strict';
// Installed games for the Gaming tab: Steam, Epic, GOG, Ubisoft Connect, games played before and games the user added.
// Registry values come from the native helper (game.lib); this module reads the launchers' own files.
const fs = require('fs');
const path = require('path'); // win32 on Windows; posix only in the tests

const STEAM_SKIP = new Set(['228980', '1070560', '1391110', '1628350', '1493710', '250820', '1826330', '2180100', '1161040', '1113280', '323910']);
const STEAM_SKIP_RE = /(steamworks common|redistributable|proton|steam linux runtime|steamvr|soundtrack|dedicated server|sdk$)/i;
const EXE_SKIP_RE = /(unins|crash|report|setup|install|redist|dxsetup|launcher|helper|update|anticheat|beservice|be_launcher|prereq|dotnet|vc_?redist|cefprocess|webhelper|uploader|benchmark|config|settings|editor|server|touchup|cleanup)/i;

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function readText(f) {
  try { return await fs.promises.readFile(f, 'utf8'); } catch (_) { return null; }
}
async function exists(f) {
  try { await fs.promises.access(f); return true; } catch (_) { return false; }
}
async function listDir(d) {
  try { return await fs.promises.readdir(d, { withFileTypes: true }); } catch (_) { return []; }
}

// Valve KeyValues: only the flat "key" "value" pairs are needed
function vdfPairs(text) {
  const out = [];
  const re = /"([^"\\]*(?:\\.[^"\\]*)*)"\s+"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let m;
  while ((m = re.exec(text || ''))) out.push([m[1].toLowerCase(), m[2].replace(/\\\\/g, '\\')]);
  return out;
}
function vdfFirst(text, key) {
  const hit = vdfPairs(text).find(([k]) => k === key);
  return hit ? hit[1] : '';
}

// "C:\x\game.exe",0  ->  C:\x\game.exe
function iconPath(v) {
  return String(v || '').trim().replace(/^"([^"]+)".*$/, '$1').replace(/,\s*-?\d+$/, '').trim();
}

// the likeliest game executable inside an install folder
async function findExe(dir, name, depth = 3) {
  const want = norm(name);
  const folder = norm(path.basename(dir));
  let best = null;
  let seen = 0;
  async function walk(d, level) {
    if (level > depth || seen > 600) return;
    for (const e of await listDir(d)) {
      if (++seen > 600) return;
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!/^(_commonredist|redist|redistributables|directx|vcredist|support|__installer|installers?|tools?|docs?|engine\\extras)$/i.test(e.name)) await walk(full, level + 1);
      } else if (/\.exe$/i.test(e.name) && !EXE_SKIP_RE.test(e.name)) {
        let size = 0;
        try { size = (await fs.promises.stat(full)).size; } catch (_) { /* ignore */ }
        const base = norm(e.name.replace(/\.exe$/i, ''));
        let score = Math.log10(size + 1) - level * 0.8;
        if (base && (want.includes(base) || base.includes(want) || folder.includes(base) || base.includes(folder))) score += 4;
        if (/shipping|win64|x64|dx12|dx11|vulkan/i.test(e.name)) score += 1;
        if (!best || score > best.score) best = { file: full, score };
      }
    }
  }
  await walk(dir, 0);
  return best ? best.file : '';
}

async function steamGames(steamPath, uninstall) {
  if (!steamPath) return [];
  const root = path.normalize(steamPath);
  const libs = new Set([root.toLowerCase()]);
  const libList = [root];
  const vdf = await readText(path.join(root, 'steamapps', 'libraryfolders.vdf'));
  for (const [k, v] of vdfPairs(vdf)) {
    if (k !== 'path') continue;
    const p = path.normalize(v);
    if (!libs.has(p.toLowerCase())) { libs.add(p.toLowerCase()); libList.push(p); }
  }
  const out = [];
  for (const lib of libList) {
    const apps = path.join(lib, 'steamapps');
    for (const e of await listDir(apps)) {
      const m = /^appmanifest_(\d+)\.acf$/i.exec(e.name);
      if (!m) continue;
      const acf = await readText(path.join(apps, e.name));
      if (!acf) continue;
      const appid = vdfFirst(acf, 'appid') || m[1];
      const name = vdfFirst(acf, 'name');
      const installdir = vdfFirst(acf, 'installdir');
      const flags = Number(vdfFirst(acf, 'stateflags')) || 0;
      if (!name || !installdir || STEAM_SKIP.has(appid) || STEAM_SKIP_RE.test(name) || !(flags & 4)) continue;
      const dir = path.join(apps, 'common', installdir);
      if (!(await exists(dir))) continue;
      const un = uninstall.get(`steam app ${appid}`);
      let icon = un && iconPath(un.icon);
      if (icon && !(await exists(icon))) icon = '';
      const cache = path.join(root, 'appcache', 'librarycache');
      const covers = [path.join(cache, `${appid}_library_600x900.jpg`), path.join(cache, appid, 'library_600x900.jpg'), path.join(cache, `${appid}_header.jpg`), path.join(cache, appid, 'header.jpg')];
      let cover = '';
      for (const c of covers) if (await exists(c)) { cover = c; break; }
      out.push({ id: `steam:${appid}`, name, source: 'steam', dir, icon, cover, exe: '', launch: { kind: 'url', target: `steam://rungameid/${appid}` } });
    }
  }
  return out;
}

async function epicGames(programData) {
  const dir = path.join(programData || 'C:\\ProgramData', 'Epic', 'EpicGamesLauncher', 'Data', 'Manifests');
  const out = [];
  for (const e of await listDir(dir)) {
    if (!/\.item$/i.test(e.name)) continue;
    let j;
    try { j = JSON.parse(await readText(path.join(dir, e.name))); } catch (_) { continue; }
    if (!j || j.bIsIncompleteInstall || !j.InstallLocation || !j.DisplayName) continue;
    const cats = Array.isArray(j.AppCategories) ? j.AppCategories.map((c) => String(c).toLowerCase()) : [];
    if (cats.length && !cats.includes('games')) continue;
    if (j.MainGameAppName && j.MainGameAppName !== j.AppName) continue; // DLC
    const exe = j.LaunchExecutable ? path.join(j.InstallLocation, j.LaunchExecutable) : '';
    const target = `com.epicgames.launcher://apps/${encodeURIComponent(j.CatalogNamespace || '')}%3A${encodeURIComponent(j.CatalogItemId || '')}%3A${encodeURIComponent(j.AppName || '')}?action=launch&silent=true`;
    out.push({ id: `epic:${j.AppName}`, name: j.DisplayName, source: 'epic', dir: path.normalize(j.InstallLocation), icon: exe, cover: '', exe, launch: { kind: 'url', target } });
  }
  return out;
}

async function gogGames(list) {
  const out = [];
  for (const g of list || []) {
    if (!g.exe || !g.name || g.dlc) continue;
    if (!(await exists(g.exe))) continue;
    const dir = g.path ? path.normalize(g.path) : path.dirname(g.exe);
    const ico = path.join(dir, `goggame-${g.id}.ico`);
    // start it the way its own shortcut does: in the working folder the installer registered, else beside the
    // executable (never simply the install root: games that load files relative to their folder do not start there)
    let cwd = g.workingDir ? path.normalize(g.workingDir) : '';
    if (!cwd || !(await exists(cwd))) cwd = path.dirname(g.exe);
    out.push({ id: `gog:${g.id}`, name: g.name, source: 'gog', dir, icon: (await exists(ico)) ? ico : g.exe, cover: '', exe: g.exe, launch: { kind: 'exe', target: g.exe, args: g.args || '', cwd } });
  }
  return out;
}

async function ubisoftGames(list, uninstall) {
  const out = [];
  for (const u of list || []) {
    if (!u.dir) continue;
    const dir = path.normalize(u.dir).replace(/[\\/]+$/, '');
    if (!(await exists(dir))) continue;
    const un = uninstall.get(`uplay install ${u.id}`);
    const name = (un && un.name) || path.basename(dir);
    let icon = un && iconPath(un.icon);
    if (!icon || !(await exists(icon))) icon = await findExe(dir, name, 2);
    out.push({ id: `ubi:${u.id}`, name, source: 'ubisoft', dir, icon, cover: '', exe: '', launch: { kind: 'url', target: `uplay://launch/${u.id}/0` } });
  }
  return out;
}

// reg: the helper's game.lib message; sessions: play history; custom: settings.gaming.library
async function scan({ reg = null, sessions = [], custom = [] } = {}) {
  const uninstall = new Map();
  for (const u of (reg && reg.uninstall) || []) uninstall.set(String(u.key).toLowerCase(), u);
  const groups = await Promise.all([
    steamGames(reg && reg.steam, uninstall).catch(() => []),
    epicGames(reg && reg.programData).catch(() => []),
    gogGames(reg && reg.gog).catch(() => []),
    ubisoftGames(reg && reg.ubi, uninstall).catch(() => []),
  ]);
  const games = groups.flat();
  // Steam / Ubisoft entries without an icon file: use the main executable
  await Promise.all(games.filter((g) => !g.icon && g.dir).map(async (g) => { g.exe = await findExe(g.dir, g.name); g.icon = g.exe; }));
  const dirs = games.map((g) => g.dir.toLowerCase() + path.sep);
  const inLib = (p) => { const l = String(p || '').toLowerCase(); return dirs.find((d) => l.startsWith(d)); };

  // games played before (Riot, Battle.net, EA, Xbox, emulators ...) that no launcher listed
  const played = new Map();
  for (const s of sessions || []) {
    if (!s.path) continue;
    const dir = inLib(s.path);
    if (dir) {
      const g = games.find((x) => x.dir.toLowerCase() + path.sep === dir);
      if (g && !(g.played > s.end)) g.played = s.end;
      if (g && !(g.playedExeAt > s.end)) { g.playedExe = s.path; g.playedExeAt = s.end; }
      continue;
    }
    const key = s.path.toLowerCase();
    if (played.has(key)) { if (s.end > played.get(key).played) played.get(key).played = s.end; continue; }
    if (!(await exists(s.path))) continue;
    played.set(key, { id: `exe:${key}`, name: s.title || s.name, source: 'played', dir: path.dirname(s.path), icon: s.path, cover: '', exe: s.path, played: s.end, launch: { kind: 'exe', target: s.path, args: '', cwd: path.dirname(s.path) } });
  }
  for (const c of custom || []) {
    if (!c || !c.path) continue;
    const key = String(c.path).toLowerCase();
    const isExe = /\.exe$/i.test(c.path);
    const prev = played.get(key);
    played.set(key, {
      id: `exe:${key}`, name: c.name || path.basename(c.path).replace(/\.(exe|lnk|url)$/i, ''), source: 'custom', dir: path.dirname(c.path), icon: c.path, cover: '', exe: isExe ? c.path : '',
      played: prev ? prev.played : 0, launch: isExe ? { kind: 'exe', target: c.path, args: '', cwd: path.dirname(c.path) } : { kind: 'open', target: c.path },
    });
  }
  // A GOG game that was already played on this PC is started with the executable that really ran. What the installer
  // registers is often only a stub (a pre-launcher that wants to download a launcher first), while the game itself
  // is DRM-free and starts directly. The registered entry stays as the fallback.
  for (const g of games) {
    const exe = g.playedExe;
    delete g.playedExe;
    delete g.playedExeAt;
    if (g.source !== 'gog' || !exe || !g.launch || exe.toLowerCase() === String(g.launch.target).toLowerCase()) continue;
    if (!/\.exe$/i.test(exe) || !(await exists(exe))) continue;
    g.fallback = g.launch;
    g.launch = { kind: 'exe', target: exe, args: '', cwd: path.dirname(exe), why: 'played' };
  }
  const all = [...games, ...played.values()];
  const seen = new Set();
  const unique = all.filter((g) => (seen.has(g.id) ? false : seen.add(g.id)));
  unique.sort((a, b) => (b.played || 0) - (a.played || 0) || a.name.localeCompare(b.name));
  return unique;
}

module.exports = { scan, vdfPairs, vdfFirst, iconPath, findExe, steamGames, epicGames, gogGames, ubisoftGames };
