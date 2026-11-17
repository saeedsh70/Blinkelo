'use strict';
// Subtitle finder: notices the video playing in a desktop player, searches subtitle sources in the user's
// languages, downloads the best match into the chosen folder (converted to UTF-8) so it can be
// dragged from the island onto the player.
//
// Sources: SubDL (free API key), OpenSubtitles.com (free consumer API key, optional login for a bigger quota),
// Podnapisi (no key). Everything network-related goes through the injected fetch (Electron net.fetch in the app,
// so the system proxy / VPN settings apply; a mock in the tests).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { EventEmitter } = require('events');

// ------------------------------------------------------------------ languages
const { LANGS } = require('../shared/sub-langs');
const { writeJson } = require('./jsonfile');
const LANG_BY_CODE = new Map(LANGS.map((l) => [l.code, l]));
function langInfo(code) { return LANG_BY_CODE.get(String(code || '').toLowerCase()) || null; }

// maps a provider's language label back to one of our codes
function langFrom(provider, value, fallback) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return fallback;
  for (const l of LANGS) {
    if (provider === 'subdl' && (l.subdl.toLowerCase() === v || l.english.toLowerCase() === v)) return l.code;
    if (provider === 'opensubtitles' && l.os === v) return l.code;
    if (provider === 'podnapisi' && l.pod === v) return l.code;
  }
  if (v === 'pb' || v.includes('brazil')) return 'pt-br';
  const short = v.split(/[-_]/)[0];
  return LANG_BY_CODE.has(short) ? short : fallback;
}

// ------------------------------------------------------------------ names
const VIDEO_EXT = /\.(mkv|mp4|avi|mov|wmv|webm|flv|m4v|mpe?g|ts|m2ts|mts|3gp|vob|ogv|rmvb|divx)$/i;
const AUDIO_EXT = /\.(mp3|flac|wav|m4a|aac|ogg|opus|wma|ape|alac|aiff?|mka)$/i;
const SUB_EXT = /\.(srt|ass|ssa|vtt|sub|smi|sbv)$/i;
const VIDEO_HINT = /\b(480p|576p|720p|1080p|2160p|4k|x264|x265|h\.?264|h\.?265|hevc|bluray|blu-ray|brrip|bdrip|web-?dl|webrip|hdtv|dvdrip|hdrip|remux|s\d{1,2}e\d{1,3})\b/i;
const VIDEO_PLAYERS = /^(potplayer|mpc-|kmplayer|gom|mpv|smplayer|wmplayer|vlc)/i;
const VIDEO_ONLY_PLAYERS = /^(potplayer|mpc-|kmplayer|gom|mpv|smplayer)/i;
const BROWSERS = /(chrome|msedge|edge|firefox|opera|brave|vivaldi|yandex|browser|arc\.|zen)/i;
const QUALITY_TAG = /\b(480p|576p|720p|1080p|2160p|4k|uhd|bluray|blu-ray|bdrip|brrip|web-?dl|webrip|web|hdtv|dvdrip|dvdscr|hdrip|hdcam|remux|x264|x265|h\.?264|h\.?265|hevc|avc|xvid|10bit|hdr|hdr10|dv|proper|repack|extended|unrated|remastered|imax|internal|amzn|nf|dsnp|hmax|atvp|hulu|multi|dual|subbed|dubbed)\b/i;

function stripExt(name) {
  const s = String(name || '');
  return VIDEO_EXT.test(s) || AUDIO_EXT.test(s) ? s.replace(/\.[^.]+$/, '') : s;
}

// "Breaking.Bad.S05E14.Ozymandias.1080p.BluRay.x264-DEMAND.mkv" -> { title: 'Breaking Bad', season: 5, episode: 14, ... }
function parseRelease(name) {
  const raw = stripExt(String(name || '').trim());
  let norm = raw.replace(/^\s*\[[^\]]{1,40}\]\s*/, ''); // fansub group prefix
  norm = norm.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
  let season = null; let episode = null; let year = null;
  let cut = norm.length;
  const se = norm.match(/\bS(\d{1,2})\s?E(\d{1,3})\b/i) || norm.match(/\b(\d{1,2})x(\d{2,3})\b/) || norm.match(/\bSeason\s*(\d{1,2})\W{0,3}Episode\s*(\d{1,3})\b/i);
  if (se) { season = Number(se[1]); episode = Number(se[2]); cut = Math.min(cut, se.index); }
  const years = [...norm.matchAll(/(?:^|[\s([])((?:19|20)\d{2})(?=$|[\s)\]])/g)].filter((m) => m.index > 0);
  if (years.length) {
    const y = years[0];
    year = Number(y[1]);
    cut = Math.min(cut, y.index);
  }
  const tag = norm.match(QUALITY_TAG);
  if (tag && tag.index > 0) cut = Math.min(cut, tag.index);
  let title = norm.slice(0, cut).replace(/[\s\-–—([{]+$/, '').replace(/^[\s\-–—]+/, '').trim();
  if (!title) title = norm.split(' ').slice(0, 4).join(' ');
  const groupMatch = raw.match(/-([A-Za-z0-9]{2,20})(?:\[[^\]]*\])?\s*$/);
  return {
    title,
    year,
    season,
    episode,
    kind: season !== null ? 'episode' : 'movie',
    tokens: releaseTokens(raw),
    group: groupMatch ? groupMatch[1].toLowerCase() : '',
  };
}

function releaseTokens(name) {
  return String(name || '').toLowerCase()
    .replace(/web[-. ]?dl/g, 'webdl')
    .replace(/blu[-. ]?ray/g, 'bluray')
    .replace(/h[. ]?26([45])/g, 'h26$1')
    .replace(/dd[p+]?5[. ]1/g, 'dd51')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const CATS = {
  source: { w: 14, miss: 6, list: ['bluray', 'bdrip', 'brrip', 'webdl', 'webrip', 'web', 'hdtv', 'dvdrip', 'hdrip', 'remux', 'hdcam', 'cam', 'dvdscr'] },
  res: { w: 5, miss: 0, list: ['480p', '576p', '720p', '1080p', '2160p', '4k'] },
  codec: { w: 4, miss: 0, list: ['x264', 'x265', 'h264', 'h265', 'hevc', 'avc', 'xvid', '10bit'] },
  service: { w: 6, miss: 0, list: ['amzn', 'nf', 'dsnp', 'hmax', 'atvp', 'hulu', 'pcok', 'itunes', 'max'] },
  edition: { w: 3, miss: 0, list: ['extended', 'remastered', 'unrated', 'directors', 'imax', 'proper', 'repack', 'internal'] },
};
const SOURCE_FAMILY = { bluray: 'bd', bdrip: 'bd', brrip: 'bd', remux: 'bd', webdl: 'web', webrip: 'web', web: 'web', hdtv: 'tv', dvdrip: 'dvd', dvdscr: 'dvd', hdrip: 'rip', hdcam: 'cam', cam: 'cam' };

// how well a subtitle release name matches the video's release name (0..~45)
function releaseSimilarity(video, subName) {
  if (!video || !video.tokens || !video.tokens.length) return 0;
  const vt = new Set(video.tokens);
  const st = new Set(releaseTokens(subName));
  let s = 0;
  if (video.group && st.has(video.group)) s += 20;
  for (const cat of Object.values(CATS)) {
    const v = cat.list.filter((x) => vt.has(x));
    const u = cat.list.filter((x) => st.has(x));
    if (!v.length || !u.length) continue;
    if (v.some((x) => u.includes(x))) s += cat.w;
    else if (cat === CATS.source && v.some((x) => u.some((y) => SOURCE_FAMILY[x] === SOURCE_FAMILY[y]))) s += cat.w / 2;
    else s -= cat.miss;
  }
  return Math.max(-10, Math.min(45, s));
}

// score of one search result for the playing video; null = wrong episode (dropped)
function scoreItem(it, q, opts = {}) {
  let s = 0;
  if (it.hash) s += 60;
  if (q.kind === 'episode') {
    if (it.season != null && q.season != null && Number(it.season) !== q.season) return null;
    if (it.episode != null && q.episode != null && Number(it.episode) > 0 && Number(it.episode) !== q.episode && !it.full) return null;
    const r = parseRelease(it.name);
    if (r.season !== null && q.season !== null && r.season !== q.season) return null;
    if (r.episode !== null && q.episode !== null && r.episode !== q.episode && !it.full) return null;
    if (it.full) s -= 8;
  } else if (q.year) {
    const r = parseRelease(it.name);
    const y = it.year || r.year;
    if (y && Math.abs(y - q.year) > 1) s -= 15;
  }
  s += releaseSimilarity(q, it.name);
  s += Math.min(10, Math.log10((Number(it.downloads) || 0) + 1) * 2.5);
  if (it.hi) s += opts.hi === 'prefer' ? 4 : opts.hi === 'avoid' ? -6 : 0;
  return Math.round(s * 10) / 10;
}

function rank(items, q, opts = {}) {
  const seen = new Map();
  for (const it of items) {
    const k = `${it.provider}|${releaseTokens(it.name).join('.')}|${it.hi ? 1 : 0}`;
    const prev = seen.get(k);
    if (!prev || (Number(it.downloads) || 0) > (Number(prev.downloads) || 0) || (it.hash && !prev.hash)) seen.set(k, it);
  }
  return [...seen.values()]
    .map((it) => ({ ...it, score: scoreItem(it, q, opts) }))
    .filter((it) => it.score !== null)
    .sort((a, b) => b.score - a.score || (Number(b.downloads) || 0) - (Number(a.downloads) || 0));
}

function safeName(name) {
  const s = String(name || 'subtitle')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 140);
  return /^(con|prn|aux|nul|com\d|lpt\d)$/i.test(s) || !s ? 'subtitle' : s;
}

// ------------------------------------------------------------------ archives + text
function isZip(buf) { return buf && buf.length > 22 && buf.readUInt32LE(0) === 0x04034b50; }

// minimal ZIP reader (stored + deflate), enough for subtitle archives
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('bad zip');
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let n = 0; n < count && n < 400; n++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) break;
    const flags = buf.readUInt16LE(off + 8);
    const method = buf.readUInt16LE(off + 10);
    const csize = buf.readUInt32LE(off + 20);
    const usize = buf.readUInt32LE(off + 24);
    const nlen = buf.readUInt16LE(off + 28);
    const xlen = buf.readUInt16LE(off + 30);
    const clen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const nameBuf = buf.subarray(off + 46, off + 46 + nlen);
    const name = (flags & 0x800) ? nameBuf.toString('utf8') : decodeName(nameBuf);
    off += 46 + nlen + xlen + clen;
    if (name.endsWith('/') || usize > 25 * 1024 * 1024 || (flags & 1)) continue;
    if (lho + 30 > buf.length || buf.readUInt32LE(lho) !== 0x04034b50) continue;
    const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(start, start + csize);
    let data = null;
    try {
      if (method === 0) data = Buffer.from(raw);
      else if (method === 8) data = zlib.inflateRawSync(raw, { maxOutputLength: 32 * 1024 * 1024 });
    } catch (_) { data = null; }
    if (data) out.push({ name, data });
  }
  return out;
}

function decodeName(b) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (_) { return b.toString('latin1'); }
}

// picks the subtitle file out of an archive: the right episode of a season pack, else the best release match
function pickFromArchive(files, q, depth = 0) {
  const subs = files.filter((f) => SUB_EXT.test(f.name) && f.data.length > 20);
  if (!subs.length) {
    const nested = files.find((f) => isZip(f.data));
    return nested && depth < 2 ? pickFromArchive(unzip(nested.data), q, depth + 1) : null;
  }
  if (subs.length === 1) return subs[0];
  let pool = subs;
  if (q && q.kind === 'episode' && q.episode !== null) {
    const ep = subs.filter((f) => {
      const r = parseRelease(path.basename(f.name));
      if (r.episode !== null) return r.episode === q.episode && (r.season === null || r.season === q.season);
      return new RegExp(`(^|[^0-9])e?0*${q.episode}([^0-9]|$)`, 'i').test(path.basename(f.name).replace(SUB_EXT, ''));
    });
    if (ep.length) pool = ep;
  }
  const extRank = (n) => { const e = (n.match(SUB_EXT) || ['', ''])[1].toLowerCase(); return { srt: 3, ass: 2, ssa: 2, vtt: 1 }[e] || 0; };
  return pool
    .map((f) => ({ f, s: releaseSimilarity(q, path.basename(f.name)) * 10 + extRank(f.name) + Math.min(f.data.length / 1e6, 1) }))
    .sort((a, b) => b.s - a.s)[0].f;
}

// decodes whatever encoding the subtitle came in (UTF-8/16 or an old Windows code page for its language)
function decodeSubtitle(buf, lang) {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return { text: buf.subarray(3).toString('utf8'), enc: 'utf-8' };
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return { text: new TextDecoder('utf-16le').decode(buf.subarray(2)), enc: 'utf-16le' };
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) return { text: new TextDecoder('utf-16be').decode(buf.subarray(2)), enc: 'utf-16be' };
  // UTF-16 without a BOM: every other byte is zero in the ASCII parts
  const probe = buf.subarray(0, Math.min(buf.length, 400));
  let zOdd = 0; let zEven = 0;
  for (let i = 0; i < probe.length; i++) if (probe[i] === 0) { if (i % 2) zOdd++; else zEven++; }
  if (zOdd > probe.length / 5 && zEven < 3) return { text: new TextDecoder('utf-16le').decode(buf), enc: 'utf-16le' };
  if (zEven > probe.length / 5 && zOdd < 3) return { text: new TextDecoder('utf-16be').decode(buf), enc: 'utf-16be' };
  try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(buf), enc: 'utf-8' }; } catch (_) { /* legacy code page */ }
  const info = langInfo(lang);
  const enc = (info && info.enc) || 'windows-1252';
  try { return { text: new TextDecoder(enc).decode(buf), enc }; } catch (_) { return { text: buf.toString('latin1'), enc: 'latin1' }; }
}

// returns UTF-8 (with BOM, which every Windows player understands)
function fixSubtitle(buf, lang) {
  const { text, enc } = decodeSubtitle(buf, lang);
  let out = text.replace(/\u0000/g, '');
  return { data: Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(out, 'utf8')]), enc, converted: enc !== 'utf-8' };
}

// OpenSubtitles "moviehash": file size + 64-bit sums of the first and last 64 KiB
async function movieHash(file) {
  const fh = await fs.promises.open(file, 'r');
  try {
    const { size } = await fh.stat();
    const chunk = 65536;
    if (size < chunk * 2) return null;
    const a = Buffer.alloc(chunk);
    const b = Buffer.alloc(chunk);
    await fh.read(a, 0, chunk, 0);
    await fh.read(b, 0, chunk, size - chunk);
    let h = BigInt(size);
    const mask = (1n << 64n) - 1n;
    for (const part of [a, b]) for (let i = 0; i < chunk; i += 8) h = (h + part.readBigUInt64LE(i)) & mask;
    return { hash: h.toString(16).padStart(16, '0'), size };
  } finally {
    await fh.close();
  }
}

// ------------------------------------------------------------------ HTTP
function httpError(message, code, status) {
  const e = new Error(message);
  e.code = code;
  if (status) e.status = status;
  return e;
}

function classify(e) {
  if (!e) return 'other';
  if (e.code && ['key', 'quota', 'net', 'other'].includes(e.code)) return e.code;
  if (e.status === 401 || e.status === 403) return 'key';
  if (e.status === 406 || e.status === 429) return 'quota';
  return 'other';
}

async function http(fetchImpl, url, { method = 'GET', headers = {}, body, timeout = 15000, type = 'json' } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    let res;
    try {
      res = await fetchImpl(url, { method, headers, body, signal: ac.signal, redirect: 'follow' });
    } catch (e) {
      throw httpError(e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || 'network error', 'net');
    }
    if (!res.ok) {
      let text = '';
      try { text = (await res.text()).slice(0, 400); } catch (_) { /* ignore */ }
      const code = res.status === 401 || res.status === 403 ? 'key' : res.status === 406 || res.status === 429 ? 'quota' : 'other';
      const e = httpError(`HTTP ${res.status}${text ? `: ${text.replace(/\s+/g, ' ').slice(0, 160)}` : ''}`, code, res.status);
      e.body = text;
      throw e;
    }
    if (type === 'json') return await res.json();
    if (type === 'text') return await res.text();
    const ab = await res.arrayBuffer();
    if (ab.byteLength > 30 * 1024 * 1024) throw httpError('file too large', 'other');
    return Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }
}

function xmlText(block, tag) {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').trim();
}

// ------------------------------------------------------------------ providers
const PROVIDERS = {
  subdl: {
    id: 'subdl',
    name: 'SubDL',
    needsKey: true,
    usable: (cfg) => !!(cfg.on && String(cfg.key || '').trim()),
    async search(q, lang, ctx) {
      const L = langInfo(lang) || { subdl: String(lang).toUpperCase() };
      const p = new URLSearchParams({ api_key: String(ctx.cfg.key).trim(), film_name: q.title, languages: L.subdl, subs_per_page: '30' });
      if (q.kind === 'episode') {
        p.set('type', 'tv');
        if (q.season !== null) p.set('season_number', String(q.season));
        if (q.episode !== null) p.set('episode_number', String(q.episode));
      } else {
        p.set('type', 'movie');
        if (q.year) p.set('year', String(q.year));
      }
      const j = await http(ctx.fetch, `https://api.subdl.com/api/v1/subtitles?${p}`, { headers: { Accept: 'application/json', 'User-Agent': ctx.ua } });
      if (!j || j.status === false) {
        const msg = String((j && (j.error || j.message)) || '');
        if (/api.?key|unauthori|invalid key/i.test(msg)) throw httpError(msg || 'invalid API key', 'key');
        if (/limit|too many/i.test(msg)) throw httpError(msg, 'quota');
        return []; // "can't find movie or tv"
      }
      const year = j.results && j.results[0] && j.results[0].year ? Number(j.results[0].year) : null;
      return (j.subtitles || []).filter((s) => s && s.url).map((s) => ({
        provider: 'subdl',
        id: `subdl:${s.url}`,
        url: s.url,
        name: String(s.release_name || s.name || '').trim() || q.title,
        lang: langFrom('subdl', s.language || s.lang, lang),
        hi: !!s.hi,
        downloads: Number(s.downloads) || 0,
        season: s.season != null && s.season !== '' ? Number(s.season) : null,
        episode: s.episode != null && s.episode !== '' ? Number(s.episode) : null,
        full: !!s.full_season,
        author: s.author || '',
        year,
      }));
    },
    async download(it, ctx) {
      const u = String(it.url);
      const rel = u.startsWith('/') ? u : `/subtitle/${u}`;
      const data = await http(ctx.fetch, `https://dl.subdl.com${rel}`, { type: 'buffer', timeout: 30000, headers: { 'User-Agent': ctx.ua } });
      return { data, name: path.basename(rel) };
    },
  },

  opensubtitles: {
    id: 'opensubtitles',
    name: 'OpenSubtitles',
    needsKey: true,
    usable: (cfg) => !!(cfg.on && String(cfg.key || '').trim()),
    headers(ctx, json = false) {
      const h = { 'Api-Key': String(ctx.cfg.key).trim(), 'User-Agent': ctx.ua, Accept: 'application/json' };
      if (json) h['Content-Type'] = 'application/json';
      return h;
    },
    async search(q, lang, ctx) {
      const L = langInfo(lang) || { os: String(lang).toLowerCase() };
      // the API wants alphabetically sorted, lower-case parameters (anything else costs a redirect)
      const params = { languages: L.os, query: q.title.toLowerCase() };
      if (q.kind === 'episode') {
        params.type = 'episode';
        if (q.season !== null) params.season_number = String(q.season);
        if (q.episode !== null) params.episode_number = String(q.episode);
      } else {
        params.type = 'movie';
        if (q.year) params.year = String(q.year);
      }
      if (q.hash) params.moviehash = q.hash;
      const qs = Object.keys(params).sort().map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`).join('&');
      const j = await http(ctx.fetch, `https://api.opensubtitles.com/api/v1/subtitles?${qs}`, { headers: this.headers(ctx) });
      return ((j && j.data) || []).map((d) => {
        const a = (d && d.attributes) || {};
        const f = (a.files || [])[0];
        if (!f || !f.file_id) return null;
        const fd = a.feature_details || {};
        return {
          provider: 'opensubtitles',
          id: `os:${f.file_id}`,
          fileId: f.file_id,
          name: String(a.release || f.file_name || q.title).trim(),
          lang: langFrom('opensubtitles', a.language, lang),
          hi: !!a.hearing_impaired,
          downloads: Number(a.download_count) || 0,
          hash: !!a.moviehash_match,
          season: fd.season_number != null ? Number(fd.season_number) : null,
          episode: fd.episode_number != null ? Number(fd.episode_number) : null,
          year: fd.year ? Number(fd.year) : null,
          fileName: f.file_name || '',
        };
      }).filter(Boolean);
    },
    async login(ctx) {
      const user = String(ctx.cfg.user || '').trim();
      const pass = ctx.password ? ctx.password() : '';
      if (!user || !pass) return null;
      const st = ctx.state;
      if (st.osToken && st.osUser === user && Date.now() < st.osTokenUntil) return st.osToken;
      const j = await http(ctx.fetch, 'https://api.opensubtitles.com/api/v1/login', {
        method: 'POST', headers: this.headers(ctx, true), body: JSON.stringify({ username: user, password: pass }),
      });
      if (!j || !j.token) throw httpError('login failed', 'key');
      st.osToken = j.token;
      st.osUser = user;
      st.osBase = j.base_url && /^[a-z0-9.-]+$/i.test(j.base_url) ? `https://${j.base_url}/api/v1` : 'https://api.opensubtitles.com/api/v1';
      st.osTokenUntil = Date.now() + 20 * 3600 * 1000;
      return st.osToken;
    },
    async download(it, ctx) {
      let token = null;
      try { token = await this.login(ctx); } catch (e) { ctx.log('opensubtitles login failed', e.message); }
      const base = token && ctx.state.osBase ? ctx.state.osBase : 'https://api.opensubtitles.com/api/v1';
      const headers = this.headers(ctx, true);
      if (token) headers.Authorization = `Bearer ${token}`;
      const j = await http(ctx.fetch, `${base}/download`, { method: 'POST', headers, body: JSON.stringify({ file_id: it.fileId }) });
      if (!j || !j.link) throw httpError((j && j.message) || 'no download link', /limit|quota|allowed/i.test((j && j.message) || '') ? 'quota' : 'other');
      const data = await http(ctx.fetch, j.link, { type: 'buffer', timeout: 30000, headers: { 'User-Agent': ctx.ua } });
      return { data, name: j.file_name || it.fileName || `${it.fileId}.srt` };
    },
  },

  podnapisi: {
    id: 'podnapisi',
    name: 'Podnapisi',
    needsKey: false,
    usable: (cfg) => !!cfg.on,
    async search(q, lang, ctx) {
      const L = langInfo(lang) || { pod: String(lang).toLowerCase() };
      const p = new URLSearchParams({ sXML: '1', sL: L.pod, sK: q.title });
      if (q.kind === 'episode') {
        if (q.season !== null) p.set('sTS', String(q.season));
        if (q.episode !== null) p.set('sTE', String(q.episode));
      } else if (q.year) p.set('sY', String(q.year));
      const xml = await http(ctx.fetch, `https://www.podnapisi.net/subtitles/search/old?${p}`, { type: 'text', headers: { 'User-Agent': ctx.ua, Accept: 'application/xml,text/xml' } });
      const out = [];
      for (const m of String(xml || '').matchAll(/<subtitle>([\s\S]*?)<\/subtitle>/g)) {
        const b = m[1];
        const pid = xmlText(b, 'pid');
        if (!pid || !/^[\w-]+$/.test(pid)) continue;
        const releases = [...b.matchAll(/<release>([\s\S]*?)<\/release>/g)].map((r) => r[1].trim()).filter(Boolean);
        const flags = xmlText(b, 'flags');
        out.push({
          provider: 'podnapisi',
          id: `pod:${pid}`,
          pid,
          name: (releases[0] || xmlText(b, 'title') || q.title).replace(/&amp;/g, '&'),
          lang: langFrom('podnapisi', xmlText(b, 'language'), lang),
          hi: /n/.test(flags),
          downloads: Number(xmlText(b, 'downloads')) || 0,
          season: xmlText(b, 'tvSeason') ? Number(xmlText(b, 'tvSeason')) : null,
          episode: xmlText(b, 'tvEpisode') ? Number(xmlText(b, 'tvEpisode')) : null,
          year: Number(xmlText(b, 'year')) || null,
        });
      }
      return out;
    },
    async download(it, ctx) {
      const data = await http(ctx.fetch, `https://www.podnapisi.net/subtitles/${encodeURIComponent(it.pid)}/download?container=zip`, { type: 'buffer', timeout: 30000, headers: { 'User-Agent': ctx.ua } });
      return { data, name: `${it.pid}.zip` };
    },
  },
};
const PROVIDER_ORDER = ['subdl', 'opensubtitles', 'podnapisi'];

// ------------------------------------------------------------------ what is playing
function appLabel(source) {
  const s = String(source || '');
  if (/zunevideo/i.test(s)) return 'Films & TV';
  if (/zunemusic/i.test(s)) return 'Media Player';
  const base = s.split(/[\\/!]/).filter(Boolean).pop() || s;
  return base.replace(/\.exe$/i, '').replace(/_[a-z0-9]{13}$/i, '');
}

function normKey(s) { return stripExt(String(s || '')).toLowerCase().replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim(); }

// a video from the desktop-player scanner (window title + resolved file path)
function videoFromPlayer(p) {
  if (!p || !p.present) return null;
  const exe = String(p.exe || '').toLowerCase().replace(/\.exe$/, '');
  if (!VIDEO_PLAYERS.test(exe)) return null;
  const raw = String(p.raw || p.title || '').trim();
  const file = String(p.path || '');
  if (!raw && !file) return null;
  if (AUDIO_EXT.test(file) || AUDIO_EXT.test(raw)) return null;
  const evidence = VIDEO_EXT.test(file) || VIDEO_EXT.test(raw) || VIDEO_HINT.test(raw) || VIDEO_ONLY_PLAYERS.test(exe);
  if (!evidence) return null;
  const name = file ? path.win32.basename(file) : raw;
  return { key: `${exe.replace(/64x?$|mini/g, '')}|${normKey(name)}`, raw: name, title: String(p.title || raw), path: file, app: p.app || appLabel(exe), source: 'player' };
}

// a video from Windows media controls (Films & TV, Media Player, VLC 4...) - not browsers: nothing can be dropped there
function videoFromSmtc(m) {
  if (!m || !m.present || m.kind !== 'video') return null;
  const src = String(m.source || '');
  if (BROWSERS.test(src)) return null;
  const raw = String(m.title || '').trim();
  if (!raw) return null;
  return { key: `smtc|${normKey(src)}|${normKey(raw)}`, raw, title: raw, path: '', app: appLabel(src), source: 'smtc' };
}

// ------------------------------------------------------------------ finder
class SubtitleFinder extends EventEmitter {
  constructor(opts) {
    super();
    this.settings = opts.settings;
    this.log = opts.log || (() => {});
    this.fetch = opts.fetch;
    this.defaultDir = opts.defaultDir;
    this.indexFile = opts.indexFile || '';
    this.secret = opts.secret || { encrypt: (s) => s, decrypt: (s) => s };
    this.ua = `Blinkelo v${opts.version || '2.0'}`;
    this.debounceMs = opts.debounceMs === undefined ? 1500 : opts.debounceMs;
    this.graceMs = opts.graceMs === undefined ? 6000 : opts.graceMs;
    this.player = null;
    this.smtc = null;
    this.video = null;
    this.parsed = null;
    this.pendingKey = null;
    this.pendingTimer = null;
    this.goneTimer = null;
    this.token = 0;
    this.reset();
    this.http = {};          // provider session state (OpenSubtitles token)
    this.hashCache = new Map();
    this.index = {};
    try { if (this.indexFile) this.index = JSON.parse(fs.readFileSync(this.indexFile, 'utf8')) || {}; } catch (_) { this.index = {}; }
  }

  reset() {
    this.lang = null;
    this.query = null;
    this.results = [];
    this.selected = null;
    this.file = null;
    this.searching = false;
    this.searched = false;
    this.downloading = null;
    this.error = null;
    this.fallback = null;
    this.failed = [];
  }

  cfg() { return (this.settings && this.settings.data && this.settings.data.subtitles) || {}; }
  // up to three languages in order of preference; none chosen = the island's language, then English
  langs() {
    const list = (Array.isArray(this.cfg().languages) ? this.cfg().languages : []).filter((c) => LANG_BY_CODE.has(c));
    if (list.length) return [...new Set(list)].slice(0, 3);
    const ui = this.settings && this.settings.data ? this.settings.data.language : 'en';
    return [...new Set([LANG_BY_CODE.has(ui) ? ui : 'en', 'en'])];
  }
  dir() {
    const d = this.cfg().dir;
    return d && path.isAbsolute(d) ? d : this.defaultDir();
  }
  providerCfg(id) { return ((this.cfg().providers || {})[id]) || {}; }
  usableProviders() { return PROVIDER_ORDER.filter((id) => PROVIDERS[id].usable(this.providerCfg(id))); }

  ctxFor(id) {
    const cfg = this.providerCfg(id);
    return {
      fetch: this.fetch,
      ua: this.ua,
      cfg,
      log: this.log,
      state: this.http,
      password: () => (cfg.passEnc ? this.secret.decrypt(cfg.passEnc) : ''),
    };
  }

  // ---------------------------------------------------------------- input from the native helper
  onHelper(msg) {
    if (!msg) return;
    if (msg.type === 'player') this.player = msg.present ? msg : null;
    else if (msg.type === 'media') this.smtc = msg.present ? msg : null;
    else return;
    this.consider(videoFromPlayer(this.player) || videoFromSmtc(this.smtc));
  }

  consider(v) {
    const curKey = this.video ? this.video.key : null;
    if (!v) {
      clearTimeout(this.pendingTimer);
      this.pendingKey = null;
      if (this.video && !this.goneTimer) {
        this.goneTimer = setTimeout(() => { this.goneTimer = null; this.setVideo(null); }, this.graceMs);
      }
      return;
    }
    clearTimeout(this.goneTimer);
    this.goneTimer = null;
    if (v.key === curKey) {
      // same video: pick up a file path that was resolved later
      if (v.path && !this.video.path) this.video.path = v.path;
      return;
    }
    if (v.key === this.pendingKey) { this.pendingVideo = v; return; }
    clearTimeout(this.pendingTimer);
    this.pendingKey = v.key;
    this.pendingVideo = v;
    this.pendingTimer = setTimeout(() => {
      this.pendingKey = null;
      this.setVideo(this.pendingVideo);
    }, this.debounceMs);
  }

  setVideo(v) {
    this.token += 1;
    this.video = v ? { ...v } : null;
    this.parsed = v ? parseRelease(v.raw || v.title) : null;
    this.reset();
    if (v) {
      this.lang = this.langs()[0];
      const cached = this.cachedFile(this.lang);
      if (cached) { this.file = cached; this.selected = cached.id; }
    }
    this.emitState();
    if (v && this.file && this.cfg().enabled !== false) this.emit('ready', { file: this.file, auto: true, video: this.video, cached: true });
    const cfg = this.cfg();
    if (v && cfg.enabled !== false && cfg.auto !== false) this.search({ auto: true }).catch((e) => this.log('subtitle search failed', e.stack || e.message));
  }

  cachedFile(lang) {
    if (!this.video) return null;
    const hit = this.index[`${this.video.key}|${lang}`];
    if (!hit || !hit.path) return null;
    try { if (!fs.statSync(hit.path).isFile()) return null; } catch (_) { return null; }
    return { ...hit, cached: true };
  }

  saveIndex(lang, file) {
    if (!this.video || !this.indexFile) return;
    this.index[`${this.video.key}|${lang}`] = { path: file.path, name: file.name, id: file.id, provider: file.provider, lang, at: Date.now() };
    const keys = Object.keys(this.index);
    if (keys.length > 400) {
      keys.sort((a, b) => (this.index[a].at || 0) - (this.index[b].at || 0)).slice(0, keys.length - 300).forEach((k) => delete this.index[k]);
    }
    try {
      writeJson(this.indexFile, this.index, { fsync: false }); // a cache: atomic is enough
    } catch (e) { this.log('subtitle index save failed', e.message); }
  }

  async videoHash() {
    const p = this.video && this.video.path;
    if (!p) return null;
    if (this.hashCache.has(p)) return this.hashCache.get(p);
    let h = null;
    try { h = await movieHash(p); } catch (_) { h = null; }
    if (this.hashCache.size > 50) this.hashCache.clear();
    this.hashCache.set(p, h);
    return h;
  }

  // ---------------------------------------------------------------- search + download
  async searchOne(ids, q, lang) {
    const failed = [];
    const lists = await Promise.all(ids.map(async (id) => {
      try { return await PROVIDERS[id].search(q, lang, this.ctxFor(id)); } catch (e) {
        this.log(`subtitles: ${id} search failed`, e.message);
        failed.push({ provider: id, code: classify(e) });
        return [];
      }
    }));
    return { items: lists.flat(), failed };
  }

  // auto: started by a new video (falls back to the next language, downloads the best match)
  // pick: the user switched language - download the best match if nothing is saved for it yet
  async search({ lang = null, query = '', auto = false, pick = false } = {}) {
    const cfg = this.cfg();
    if (cfg.enabled === false || !this.video) { this.emitState(); return false; }
    const token = ++this.token;
    const langs = this.langs();
    const want = lang && LANG_BY_CODE.has(lang) ? lang : (this.lang || langs[0]);
    if (want !== this.lang) {
      this.lang = want;
      const cached = this.cachedFile(want);
      this.file = cached;
      this.selected = cached ? cached.id : null;
    }
    const base = String(query || '').trim() ? parseRelease(query) : this.parsed;
    const q = { ...base, tokens: this.parsed.tokens, group: this.parsed.group };
    if (String(query || '').trim()) {
      // a typed title keeps the episode numbers of the file unless it names its own
      if (q.season === null && this.parsed.season !== null) { q.season = this.parsed.season; q.episode = this.parsed.episode; q.kind = 'episode'; }
    }
    this.query = { title: q.title, year: q.year, season: q.season, episode: q.episode, manual: !!String(query || '').trim() };
    const ids = this.usableProviders();
    this.results = [];
    this.error = null;
    this.fallback = null;
    this.failed = [];
    if (!ids.length) { this.searched = true; this.emitState(); return false; }
    this.searching = true;
    this.emitState();
    const h = await this.videoHash();
    if (token !== this.token) return false;
    if (h) q.hash = h.hash;
    const opts = { hi: cfg.hi || 'avoid' };
    let { items, failed } = await this.searchOne(ids, q, want);
    if (token !== this.token) return false;
    let ranked = rank(items, q, opts);
    let used = want;
    if (!ranked.length && auto && !lang) {
      for (const other of langs.filter((x) => x !== want)) {
        const r = await this.searchOne(ids, q, other);
        if (token !== this.token) return false;
        const rr = rank(r.items, q, opts);
        failed = failed.concat(r.failed);
        if (rr.length) { ranked = rr; used = other; this.fallback = { from: want, to: other }; break; }
      }
    }
    if (used !== this.lang) {
      this.lang = used;
      const cached = this.cachedFile(used);
      if (cached) { this.file = cached; this.selected = cached.id; }
    }
    this.searching = false;
    this.searched = true;
    this.results = ranked.slice(0, 20);
    this.failed = failed;
    if (!ranked.length && failed.length) {
      const codes = failed.map((f) => f.code);
      this.error = { code: codes.includes('key') ? 'key' : codes.includes('quota') ? 'quota' : codes.includes('net') ? 'net' : 'other', provider: failed[0].provider };
    }
    this.emitState();
    if (ranked.length && !this.file && cfg.autoDownload !== false && (auto || pick)) await this.fetchFile(ranked.slice(0, 3), token, auto);
    return ranked.length > 0;
  }

  async choose(id) {
    const it = this.results.find((r) => r.id === id);
    if (!it) return false;
    if (this.file && this.file.id === id) return true;
    return this.fetchFile([it], this.token, false);
  }

  async fetchFile(cands, token, auto) {
    const cfg = this.cfg();
    let lastErr = null;
    for (const it of cands) {
      this.downloading = it.id;
      this.error = null;
      this.emitState();
      try {
        const got = await PROVIDERS[it.provider].download(it, this.ctxFor(it.provider));
        if (token !== this.token) return false;
        const q = { ...this.parsed, season: this.query ? this.query.season : this.parsed.season, episode: this.query ? this.query.episode : this.parsed.episode };
        const picked = isZip(got.data) ? pickFromArchive(unzip(got.data), q) : { name: got.name, data: got.data };
        if (!picked) throw httpError('no subtitle file in the archive', 'other');
        const ext = ((picked.name.match(SUB_EXT) || [])[1] || 'srt').toLowerCase();
        const lang = it.lang || this.lang;
        let data = picked.data;
        let converted = false;
        if (cfg.fixEncoding !== false && ext !== 'sub') {
          const fixed = fixSubtitle(picked.data, lang);
          data = fixed.data;
          converted = fixed.converted;
        }
        const base = safeName(this.video.path ? path.win32.basename(this.video.path).replace(/\.[^.]+$/, '') : stripExt(this.video.raw || this.video.title));
        const dir = this.dir();
        await fs.promises.mkdir(dir, { recursive: true });
        const target = path.join(dir, `${base}.${lang}.${ext}`);
        await fs.promises.writeFile(target, data);
        if (cfg.nextToVideo && this.video.path) {
          const beside = path.join(path.dirname(this.video.path), `${path.basename(this.video.path).replace(/\.[^.]+$/, '')}.${lang}.${ext}`);
          try { await fs.promises.writeFile(beside, data); } catch (e) { this.log('subtitle copy beside the video failed', e.message); }
        }
        this.file = { path: target, name: path.basename(target), id: it.id, provider: it.provider, lang, release: it.name, converted };
        this.selected = it.id;
        this.downloading = null;
        this.saveIndex(lang, this.file);
        this.emitState();
        this.emit('ready', { file: this.file, auto, video: this.video });
        return true;
      } catch (e) {
        lastErr = e;
        this.log(`subtitles: ${it.provider} download failed`, e.message);
        if (token !== this.token) return false;
      }
    }
    this.downloading = null;
    this.error = { code: classify(lastErr), provider: cands[0] && cands[0].provider, download: true };
    this.emitState();
    return false;
  }

  // ---------------------------------------------------------------- settings helpers
  async test(id) {
    const P = PROVIDERS[id];
    if (!P) return { ok: false, code: 'other' };
    const cfg = { ...this.providerCfg(id), on: true };
    if (!P.usable(cfg)) return { ok: false, code: 'key' };
    const ctx = { ...this.ctxFor(id), cfg };
    try {
      const items = await P.search({ title: 'Inception', year: 2010, season: null, episode: null, kind: 'movie', tokens: [], group: '' }, 'en', ctx);
      let login = null;
      if (id === 'opensubtitles' && cfg.user && cfg.passEnc) {
        this.http.osToken = null;
        try { login = !!(await P.login(ctx)); } catch (e) { login = false; }
      }
      return { ok: true, count: items.length, login };
    } catch (e) {
      return { ok: false, code: classify(e), detail: String(e.message || '').slice(0, 120) };
    }
  }

  setPassword(user, pass) {
    const enc = pass ? this.secret.encrypt(String(pass)) : '';
    this.http.osToken = null;
    return { user: String(user || '').trim().slice(0, 80), passEnc: enc };
  }

  currentFile() {
    if (!this.file || !this.file.path) return null;
    try { return fs.statSync(this.file.path).isFile() ? this.file.path : null; } catch (_) { return null; }
  }

  status() {
    const cfg = this.cfg();
    if (cfg.enabled === false) return 'off';
    if (!this.video) return 'idle';
    if (this.downloading) return 'downloading';
    if (this.file) return 'ready';
    if (this.searching) return 'searching';
    if (!this.usableProviders().length) return 'nokey';
    if (this.error && !this.results.length) return 'error';
    if (this.results.length) return 'found';
    return this.searched ? 'empty' : 'idle';
  }

  publicState() {
    const v = this.video;
    return {
      status: this.status(),
      enabled: this.cfg().enabled !== false,
      video: v ? {
        key: v.key, title: this.parsed ? this.parsed.title : v.title, raw: v.raw, app: v.app, hasPath: !!v.path,
        season: this.parsed ? this.parsed.season : null, episode: this.parsed ? this.parsed.episode : null, year: this.parsed ? this.parsed.year : null,
      } : null,
      lang: this.lang,
      langs: this.langs(),
      query: this.query,
      searching: this.searching,
      downloading: this.downloading,
      results: this.results.map((r) => ({
        id: r.id, provider: r.provider, name: r.name, lang: r.lang, hi: !!r.hi, downloads: r.downloads || 0, score: r.score, hash: !!r.hash, full: !!r.full,
      })),
      selected: this.selected,
      file: this.file ? { name: this.file.name, lang: this.file.lang, provider: this.file.provider, release: this.file.release || '', cached: !!this.file.cached, converted: !!this.file.converted } : null,
      error: this.error,
      fallback: this.fallback,
      providers: this.usableProviders(),
    };
  }

  emitState() { this.emit('state', this.publicState()); }

  // settings window changed something: search again when it changes the answer (languages, sources, on/off)
  settingsChanged(prevLangs, prevProviders, prevEnabled) {
    const langs = this.langs();
    const langsChanged = JSON.stringify(prevLangs) !== JSON.stringify(langs);
    const provChanged = JSON.stringify(prevProviders) !== JSON.stringify(this.usableProviders());
    const enabled = this.cfg().enabled !== false;
    if (this.video && enabled && (langsChanged || provChanged || !prevEnabled)) {
      if (langsChanged && !langs.includes(this.lang)) { this.lang = langs[0]; this.file = this.cachedFile(this.lang); this.selected = this.file ? this.file.id : null; }
      this.search({ auto: true }).catch((e) => this.log('subtitle search failed', e.message));
      return;
    }
    this.emitState();
  }

  snapshot() { return [this.langs(), this.usableProviders(), this.cfg().enabled !== false]; }

  dispose() {
    clearTimeout(this.pendingTimer);
    clearTimeout(this.goneTimer);
    this.removeAllListeners();
  }
}

module.exports = {
  SubtitleFinder,
  LANGS,
  PROVIDERS,
  langInfo,
  langFrom,
  parseRelease,
  releaseTokens,
  releaseSimilarity,
  scoreItem,
  rank,
  unzip,
  isZip,
  pickFromArchive,
  decodeSubtitle,
  fixSubtitle,
  movieHash,
  safeName,
  videoFromPlayer,
  videoFromSmtc,
  classify,
};
