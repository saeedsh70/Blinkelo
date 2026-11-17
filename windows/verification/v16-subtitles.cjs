'use strict';
// 1.6.0: subtitle finder - release parsing, ranking, archives, encodings, providers (mocked network), finder flow.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const root = path.resolve(__dirname, '..');
const S = require(path.join(root, 'src/main/subtitles.js'));
const { DEFAULTS, deepMerge } = require(path.join(root, 'src/main/settings.js'));

// ---------------------------------------------------------------- tiny zip writer for the fixtures
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
}
function makeZip(files) {
  const locals = []; const centrals = []; let off = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data);
    const comp = zlib.deflateRawSync(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(crc32(data), 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
    locals.push(lh, name, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(crc32(data), 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(off, 42);
    centrals.push(ch, name);
    off += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, end]);
}

// ---------------------------------------------------------------- release names
let r = S.parseRelease('Breaking.Bad.S05E14.Ozymandias.1080p.BluRay.x264-DEMAND.mkv');
assert.equal(r.title, 'Breaking Bad'); assert.equal(r.season, 5); assert.equal(r.episode, 14); assert.equal(r.kind, 'episode'); assert.equal(r.group, 'demand');
r = S.parseRelease('Interstellar.2014.1080p.BluRay.x265-RARBG');
assert.equal(r.title, 'Interstellar'); assert.equal(r.year, 2014); assert.equal(r.kind, 'movie');
r = S.parseRelease('2012 (2009) 720p');
assert.equal(r.title, '2012'); assert.equal(r.year, 2009);
r = S.parseRelease('[SubsPlease] Frieren 2x05 (1080p)');
assert.equal(r.title, 'Frieren'); assert.equal(r.season, 2); assert.equal(r.episode, 5);
r = S.parseRelease('The Office US - Season 3 Episode 7.mp4');
assert.equal(r.title, 'The Office US'); assert.equal(r.season, 3); assert.equal(r.episode, 7);
r = S.parseRelease('Dune Part Two');
assert.equal(r.title, 'Dune Part Two'); assert.equal(r.year, null);

// ---------------------------------------------------------------- ranking
const q = S.parseRelease('Breaking.Bad.S05E14.1080p.BluRay.x264-DEMAND');
const items = [
  { provider: 'subdl', id: 'a', name: 'Breaking.Bad.S05E14.720p.HDTV.x264-EVOLVE', downloads: 9000 },
  { provider: 'subdl', id: 'b', name: 'Breaking.Bad.S05E14.1080p.BluRay.x264-DEMAND', downloads: 10 },
  { provider: 'subdl', id: 'c', name: 'Breaking.Bad.S05E13.1080p.BluRay.x264-DEMAND', downloads: 50000 },
  { provider: 'opensubtitles', id: 'd', name: 'whatever', hash: true, downloads: 3 },
  { provider: 'subdl', id: 'e', name: 'Breaking Bad Season 5 complete', season: 5, episode: 0, full: true },
  { provider: 'subdl', id: 'f', name: 'Breaking.Bad.S05E14.1080p.BluRay.x264-DEMAND', downloads: 5, hi: true },
];
const ranked = S.rank(items, q, { hi: 'avoid' });
assert.deepEqual(ranked.map((x) => x.id).slice(0, 2), ['d', 'b'], 'hash match first, then the exact release');
assert(!ranked.some((x) => x.id === 'c'), 'wrong episode dropped');
assert(ranked.findIndex((x) => x.id === 'f') > ranked.findIndex((x) => x.id === 'b'), 'hearing-impaired copy ranks lower');
assert(ranked.some((x) => x.id === 'e'), 'season pack kept');
assert(S.releaseSimilarity(q, 'Breaking.Bad.S05E14.1080p.WEB-DL') < S.releaseSimilarity(q, 'Breaking.Bad.S05E14.1080p.BRRip'));
const movieQ = S.parseRelease('Dune.2021.2160p');
assert(S.scoreItem({ name: 'Dune.1984.DVDRip' }, movieQ) < S.scoreItem({ name: 'Dune.2021.WEB' }, movieQ));

// ---------------------------------------------------------------- archives
const srt = '1\r\n00:00:01,000 --> 00:00:02,000\r\nسلام\r\n';
const pack = makeZip([
  { name: 'Show.S01E01.srt', data: '1\n00:00:01,000 --> 00:00:02,000\nE1\n' },
  { name: 'Show.S01E02.srt', data: '1\n00:00:01,000 --> 00:00:02,000\nE2\n' },
  { name: 'readme.txt', data: 'hello' },
  { name: 'folder/', data: '' },
]);
assert(S.isZip(pack));
const files = S.unzip(pack);
assert.equal(files.length, 3);
const ep2 = S.pickFromArchive(files, { kind: 'episode', season: 1, episode: 2, tokens: [], group: '' });
assert.equal(ep2.name, 'Show.S01E02.srt');
assert.equal(S.pickFromArchive([{ name: 'a.txt', data: Buffer.from('x') }], {}), null);
const nested = makeZip([{ name: 'inner.zip', data: makeZip([{ name: 'x.ass', data: '[Script Info]\nTitle: x\n' }]) }]);
assert.equal(S.pickFromArchive(S.unzip(nested), {}).name, 'x.ass');

// ---------------------------------------------------------------- encodings
const cp1256 = Buffer.from([0xdf, 0xed, 0xdd, 0x20, 0xcd, 0xc7, 0xe1, 0xdf]); // "كيف حالك" in Windows-1256 (Arabic kaf/yeh)
const fixed = S.fixSubtitle(cp1256, 'ar');
assert.deepEqual([...fixed.data.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
assert.equal(fixed.data.subarray(3).toString('utf8'), 'كيف حالك');
assert.equal(fixed.converted, true);
const u8 = S.fixSubtitle(Buffer.from(srt, 'utf8'), 'ar');
assert.equal(u8.converted, false);
assert.equal(u8.data.subarray(3).toString('utf8'), srt);
const u16 = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('Hello', 'utf16le')]);
assert.equal(S.decodeSubtitle(u16, 'en').text, 'Hello');
assert.equal(S.decodeSubtitle(Buffer.from('Hello there friend', 'utf16le'), 'en').text, 'Hello there friend');
assert.equal(S.decodeSubtitle(Buffer.from([0xcf, 0xf0, 0xe8]), 'ru').text, 'При');
assert.equal(S.safeName('a<b>:c?.'), 'a b c');
assert.equal(S.safeName('CON'), 'subtitle');
assert.equal(S.langFrom('subdl', 'AR', 'en'), 'ar');
assert.equal(S.langFrom('subdl', 'arabic', 'en'), 'ar');
assert.equal(S.langFrom('opensubtitles', 'pt-br', 'en'), 'pt-br');
assert.equal(S.langFrom('podnapisi', '', 'de'), 'de');

// ---------------------------------------------------------------- what counts as a video
assert.equal(S.videoFromPlayer({ present: true, exe: 'vlc.exe', app: 'VLC', title: 'Song', raw: 'Artist - Song.mp3' }), null);
assert.equal(S.videoFromPlayer({ present: true, exe: 'vlc.exe', app: 'VLC', title: 'Artist - Song', raw: 'Artist - Song' }), null);
assert.equal(S.videoFromPlayer({ present: true, exe: 'aimp.exe', title: 'x', raw: 'x.mkv' }), null);
const pv = S.videoFromPlayer({ present: true, exe: 'PotPlayerMini64.exe', app: 'PotPlayer', title: 'Interstellar 2014', raw: 'Interstellar.2014.1080p.mkv', path: 'D:\\Movies\\Interstellar.2014.1080p.mkv' });
assert.equal(pv.path, 'D:\\Movies\\Interstellar.2014.1080p.mkv');
assert.equal(pv.raw, 'Interstellar.2014.1080p.mkv');
assert(S.videoFromPlayer({ present: true, exe: 'vlc.exe', title: 'x', raw: 'Movie.2020.720p.WEB' }));
assert(S.videoFromSmtc({ present: true, kind: 'video', source: 'Microsoft.ZuneVideo_8wekyb3d8bbwe!Microsoft.ZuneVideo', title: 'Dune.2021' }));
assert.equal(S.videoFromSmtc({ present: true, kind: 'video', source: 'chrome.exe', title: 'YouTube' }), null);
assert.equal(S.videoFromSmtc({ present: true, kind: 'music', source: 'Spotify.exe', title: 'x' }), null);

// ---------------------------------------------------------------- moviehash (OpenSubtitles algorithm)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'subs-'));
const vid = path.join(tmp, 'Show.S01E02.1080p.WEB-DL.mkv');
const big = Buffer.alloc(200000);
for (let i = 0; i < big.length; i++) big[i] = i % 251;
fs.writeFileSync(vid, big);

(async () => {
  const h = await S.movieHash(vid);
  // reference: size + sum of 64-bit words of the first and last 64 KiB
  let ref = BigInt(big.length);
  for (const off of [0, big.length - 65536]) for (let i = 0; i < 65536; i += 8) ref = (ref + big.readBigUInt64LE(off + i)) & ((1n << 64n) - 1n);
  assert.equal(h.hash, ref.toString(16).padStart(16, '0'));
  assert.equal(await S.movieHash(path.join(tmp, 'nope.mkv')).catch(() => 'err'), 'err');

  // ---------------------------------------------------------------- providers + finder with a mocked network
  const calls = [];
  const cp1256Srt = Buffer.concat([Buffer.from('1\r\n00:00:01,000 --> 00:00:02,000\r\n'), cp1256, Buffer.from('\r\n')]);
  const ok = (body, type = 'json') => ({ ok: true, status: 200, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)), arrayBuffer: async () => { const b = Buffer.isBuffer(body) ? body : Buffer.from(String(body)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); } });
  const fail = (status) => ({ ok: false, status, json: async () => ({}), text: async () => 'nope', arrayBuffer: async () => new ArrayBuffer(0) });
  let osDownloadStatus = 200;
  const fetchMock = async (url, opts = {}) => {
    calls.push({ url, opts });
    const u = new URL(url);
    if (u.host === 'api.subdl.com') {
      if (u.searchParams.get('api_key') === 'bad') return ok({ status: false, error: 'API key is invalid' });
      if (u.searchParams.get('languages') === 'AR') return ok({ status: false, error: "can't find movie or tv" });
      return ok({ status: true, results: [{ name: 'Show', year: 2020 }], subtitles: [
        { release_name: 'Show.S01E02.1080p.WEB-DL-GRP', lang: 'english', language: 'EN', url: '/subtitle/1-2.zip', season: 1, episode: 2, hi: false },
        { release_name: 'Show.S01E03.1080p.WEB-DL-GRP', lang: 'english', language: 'EN', url: '/subtitle/1-3.zip', season: 1, episode: 3 },
      ] });
    }
    if (u.host === 'dl.subdl.com') return ok(makeZip([{ name: 'Show.S01E02.srt', data: cp1256Srt }]), 'buffer');
    if (u.host === 'api.opensubtitles.com' && u.pathname.endsWith('/subtitles')) {
      assert.equal(opts.headers['Api-Key'], 'oskey');
      assert(/^Blinkelo v/.test(opts.headers['User-Agent']));
      const keys = [...u.searchParams.keys()];
      assert.deepEqual(keys, [...keys].sort(), 'OpenSubtitles parameters are sorted');
      return ok({ data: [{ attributes: { language: u.searchParams.get('languages'), release: 'Show.S01E02.720p.HDTV', download_count: 100, hearing_impaired: false, moviehash_match: !!u.searchParams.get('moviehash'), files: [{ file_id: 77, file_name: 'Show.S01E02.srt' }], feature_details: { season_number: 1, episode_number: 2 } } }] });
    }
    if (u.host === 'api.opensubtitles.com' && u.pathname.endsWith('/download')) {
      if (osDownloadStatus !== 200) return fail(osDownloadStatus);
      assert.deepEqual(JSON.parse(opts.body), { file_id: 77 });
      return ok({ link: 'https://dl.opensubtitles.example/f.srt', file_name: 'Show.S01E02.srt', remaining: 4 });
    }
    if (u.host === 'dl.opensubtitles.example') return ok(Buffer.from('1\n00:00:01,000 --> 00:00:02,000\nhash hit\n'), 'buffer');
    if (u.host === 'www.podnapisi.net' && u.pathname.endsWith('/search/old')) {
      return ok(`<?xml version="1.0"?><results><subtitle><pid>AbC1</pid><title>Show</title><language>${u.searchParams.get('sL')}</language><releases><release>Show.S01E02.HDTV-LOL</release></releases><flags>n</flags><downloads>5</downloads><tvSeason>1</tvSeason><tvEpisode>2</tvEpisode></subtitle></results>`, 'text');
    }
    if (u.host === 'www.podnapisi.net') return ok(makeZip([{ name: 'p.srt', data: '1\n00:00:01,000 --> 00:00:02,000\npodnapisi\n' }]), 'buffer');
    return fail(404);
  };

  const settings = { data: deepMerge(DEFAULTS, { language: 'ar', subtitles: { languages: ['ar', 'en'], providers: { subdl: { key: 'k' }, opensubtitles: { key: '' }, podnapisi: { on: false } } } }) };
  const outDir = path.join(tmp, 'out');
  const finder = new S.SubtitleFinder({ settings, fetch: fetchMock, defaultDir: () => outDir, indexFile: path.join(tmp, 'index.json'), version: '1.6.0', debounceMs: 0, graceMs: 0 });
  const states = [];
  const ready = [];
  finder.on('state', (st) => states.push(st));
  finder.on('ready', (x) => ready.push(x));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const until = async (fn, ms = 2000) => { const t0 = Date.now(); while (!fn()) { if (Date.now() - t0 > ms) throw new Error('timeout'); await wait(5); } };

  // music in VLC is ignored
  finder.onHelper({ type: 'player', present: true, exe: 'vlc.exe', app: 'VLC', title: 'Song', raw: 'Song.mp3' });
  await wait(20);
  assert.equal(finder.video, null);

  // a video starts: Arabic finds nothing on SubDL -> falls back to English, downloads the right episode, fixes the encoding
  finder.onHelper({ type: 'player', present: true, exe: 'mpc-hc64.exe', app: 'MPC-HC', title: 'Show S01E02 1080p WEB-DL', raw: 'Show.S01E02.1080p.WEB-DL-GRP.mkv', path: vid });
  await until(() => ready.length === 1);
  let st = finder.publicState();
  assert.equal(st.status, 'ready');
  assert.equal(st.video.season, 1);
  assert.deepEqual(st.fallback, { from: 'ar', to: 'en' });
  assert.equal(st.lang, 'en');
  assert.equal(st.results.length, 1, 'the S01E03 subtitle is not offered');
  const saved = path.join(outDir, 'Show.S01E02.1080p.WEB-DL.en.srt');
  assert.equal(finder.currentFile(), saved);
  const savedText = fs.readFileSync(saved);
  assert.deepEqual([...savedText.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(finder.publicState().file.converted, true); // legacy code page -> UTF-8
  assert(states.some((x) => x.status === 'searching'));
  assert(states.some((x) => x.status === 'downloading'));
  const subdlCall = calls.find((c) => c.url.includes('api.subdl.com'));
  const sp = new URL(subdlCall.url).searchParams;
  assert.equal(sp.get('type'), 'tv'); assert.equal(sp.get('season_number'), '1'); assert.equal(sp.get('episode_number'), '2'); assert.equal(sp.get('film_name'), 'Show');

  // the same video again later: the saved file is offered at once and nothing is downloaded twice
  finder.onHelper({ type: 'player', present: false });
  await until(() => finder.video === null);
  const dlBefore = calls.filter((c) => c.url.includes('dl.subdl.com')).length;
  finder.onHelper({ type: 'player', present: true, exe: 'mpc-hc64.exe', app: 'MPC-HC', title: 'Show S01E02 1080p WEB-DL', raw: 'Show.S01E02.1080p.WEB-DL-GRP.mkv', path: vid });
  await until(() => finder.video && !finder.searching && finder.searched);
  assert.equal(finder.publicState().status, 'ready');
  assert.equal(finder.publicState().file.cached, true);
  assert.equal(calls.filter((c) => c.url.includes('dl.subdl.com')).length, dlBefore);

  // OpenSubtitles with the file hash ranks first; choosing it downloads it
  settings.data.subtitles.providers.opensubtitles.key = 'oskey';
  await finder.search({ lang: 'en' });
  st = finder.publicState();
  assert.equal(st.results[0].provider, 'opensubtitles');
  assert.equal(st.results[0].hash, true);
  assert(new URL(calls.filter((c) => c.url.includes('opensubtitles.com/api/v1/subtitles')).pop().url).searchParams.get('moviehash'));
  assert(await finder.choose(st.results[0].id));
  assert.equal(fs.readFileSync(finder.currentFile(), 'utf8').replace(/^\ufeff/, '').includes('hash hit'), true);

  // download quota reached -> error code for the island
  osDownloadStatus = 406;
  finder.file = null; finder.selected = null;
  assert.equal(await finder.choose(st.results[0].id), false);
  assert.equal(finder.publicState().error.code, 'quota');
  osDownloadStatus = 200;

  // manual search keeps the episode numbers
  await finder.search({ query: 'Show (2020)', lang: 'en' });
  assert.equal(finder.publicState().query.season, 1);
  assert.equal(finder.publicState().query.manual, true);

  // no usable source -> "nokey"; a bad key -> error "key"
  settings.data.subtitles.providers = { subdl: { on: true, key: '' }, opensubtitles: { on: false, key: '' }, podnapisi: { on: false } };
  finder.file = null;
  await finder.search({ lang: 'en' });
  assert.equal(finder.publicState().status, 'nokey');
  settings.data.subtitles.providers.subdl.key = 'bad';
  await finder.search({ lang: 'en' });
  assert.equal(finder.publicState().status, 'error');
  assert.equal(finder.publicState().error.code, 'key');
  assert.deepEqual(await finder.test('subdl'), { ok: false, code: 'key', detail: 'API key is invalid' });

  // Podnapisi needs no key
  settings.data.subtitles.providers = { subdl: { on: false }, opensubtitles: { on: false }, podnapisi: { on: true } };
  await finder.search({ lang: 'en' });
  st = finder.publicState();
  assert.equal(st.results[0].provider, 'podnapisi');
  assert.equal(st.results[0].hi, true);
  const t = await finder.test('podnapisi');
  assert.equal(t.ok, true);
  // switching language from the island downloads the best match when nothing is saved for it
  finder.file = null;
  await finder.search({ lang: 'en', pick: true });
  assert.equal(finder.publicState().status, 'ready');
  assert.equal(finder.publicState().file.provider, 'podnapisi');

  // languages: none chosen = island language + English; folder
  settings.data.subtitles.languages = [];
  assert.deepEqual(finder.langs(), ['ar', 'en']);
  settings.data.language = 'en';
  assert.deepEqual(finder.langs(), ['en']);
  settings.data.subtitles.dir = 'relative\\x';
  assert.equal(finder.dir(), outDir);

  // the video goes away
  finder.onHelper({ type: 'player', present: false });
  await until(() => finder.publicState().status === 'idle');
  finder.dispose();
  assert.equal(DEFAULTS.subtitles.autoDownload, true);
  assert.equal(DEFAULTS.subtitles.providers.podnapisi.on, true);
  console.log('PASS v1.6 subtitle checks (parsing, ranking, archives, encodings, providers, finder flow)');
})().catch((e) => { console.error(e); process.exit(1); });
