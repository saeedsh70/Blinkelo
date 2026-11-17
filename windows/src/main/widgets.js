'use strict';
// Dashboard widgets that need the network: crypto prices and news feeds.
const { EventEmitter } = require('events');
const { net } = require('electron');

const COINS = {
  BTC: { cg: 'bitcoin', name: 'Bitcoin' },
  ETH: { cg: 'ethereum', name: 'Ethereum' },
  USDT: { cg: 'tether', name: 'Tether' },
  BNB: { cg: 'binancecoin', name: 'BNB' },
  SOL: { cg: 'solana', name: 'Solana' },
  XRP: { cg: 'ripple', name: 'XRP' },
  TON: { cg: 'the-open-network', name: 'Toncoin' },
  DOGE: { cg: 'dogecoin', name: 'Dogecoin' },
  TRX: { cg: 'tron', name: 'TRON' },
  ADA: { cg: 'cardano', name: 'Cardano' },
  LTC: { cg: 'litecoin', name: 'Litecoin' },
  NOT: { cg: 'notcoin', name: 'Notcoin' },
};

const FEEDS = [
  { id: 'bbc-world', name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', lang: 'en' },
  { id: 'verge', name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', lang: 'en' },
  { id: 'hn', name: 'Hacker News', url: 'https://hnrss.org/frontpage', lang: 'en' },
  { id: 'bbc-ar', name: 'BBC عربي', url: 'https://feeds.bbci.co.uk/arabic/rss.xml', lang: 'ar' },
  { id: 'bbc-tr', name: 'BBC Türkçe', url: 'https://feeds.bbci.co.uk/turkce/rss.xml', lang: 'tr' },
  { id: 'bbc-es', name: 'BBC Mundo', url: 'https://feeds.bbci.co.uk/mundo/rss.xml', lang: 'es' },
  { id: 'bbc-ru', name: 'BBC Русская служба', url: 'https://feeds.bbci.co.uk/russian/rss.xml', lang: 'ru' },
  { id: 'bbc-zh', name: 'BBC 中文', url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml', lang: 'zh' },
];

function defaultFeeds(lang) {
  if (lang === 'en') return ['bbc-world', 'verge'];
  const own = FEEDS.find((f) => f.lang === lang);
  return own ? [own.id, 'bbc-world'] : ['bbc-world', 'verge'];
}

async function fetchText(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await net.fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Blinkelo/2.0 (+desktop widget)', Accept: '*/*' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, timeoutMs) { return JSON.parse(await fetchText(url, timeoutMs)); }

// ------------------------------------------------------------------ crypto
async function cryptoGlobal(symbols) {
  const ids = symbols.map((s) => COINS[s] && COINS[s].cg).filter(Boolean);
  const j = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`);
  return symbols.filter((s) => COINS[s] && j[COINS[s].cg]).map((s) => {
    const v = j[COINS[s].cg];
    return { sym: s, name: COINS[s].name, price: Number(v.usd), change: Number(v.usd_24h_change) || 0 };
  });
}

async function cryptoPrices(cfg) {
  const symbols = (cfg.coins && cfg.coins.length ? cfg.coins : ['BTC', 'ETH', 'USDT', 'TON']).filter((s) => COINS[s]).slice(0, 8);
  return { currency: 'USD', source: 'CoinGecko', items: await cryptoGlobal(symbols) };
}

// ------------------------------------------------------------------ news (RSS 2.0 + Atom)
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', zwnj: '\u200c', hellip: '…', mdash: '—', ndash: '–', laquo: '«', raquo: '»', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
function decodeEntities(s) {
  return String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => (ENTITIES[n.toLowerCase()] !== undefined ? ENTITIES[n.toLowerCase()] : m));
}
function clean(s) {
  let t = String(s || '');
  const cdata = t.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (cdata) t = cdata[1];
  t = decodeEntities(t.replace(/<[^>]+>/g, ' '));
  return decodeEntities(t).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function parseFeed(xml, feed) {
  const items = [];
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const re = isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi;
  const blocks = xml.match(re) || [];
  for (const b of blocks.slice(0, 25)) {
    const title = clean(tag(b, 'title'));
    let link = '';
    if (isAtom) {
      const lm = b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || b.match(/<link[^>]*href=["']([^"']+)["']/i);
      link = lm ? decodeEntities(lm[1]) : '';
    } else {
      link = clean(tag(b, 'link')) || clean(tag(b, 'guid'));
    }
    const dateText = clean(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    const time = Date.parse(dateText) || 0;
    if (!title || !/^https?:\/\//i.test(link)) continue;
    items.push({ title: title.slice(0, 220), link, time, feed: feed.name, feedId: feed.id });
  }
  return items;
}

async function newsItems(cfg, lang) {
  const ids = cfg.feeds && cfg.feeds.length ? cfg.feeds : defaultFeeds(lang);
  const feeds = [
    ...FEEDS.filter((f) => ids.includes(f.id)),
    ...(cfg.custom || []).filter((f) => f && /^https?:\/\//i.test(f.url) && ids.includes(f.id)),
  ].slice(0, 6);
  const results = await Promise.allSettled(feeds.map(async (f) => parseFeed(await fetchText(f.url), f)));
  const items = [];
  const failed = [];
  results.forEach((r, i) => { if (r.status === 'fulfilled') items.push(...r.value); else failed.push(feeds[i].name); });
  items.sort((a, b) => b.time - a.time);
  // interleave a little so one busy feed does not hide the others
  return { items: items.slice(0, 30), failed, feeds: feeds.map((f) => f.name) };
}

// ------------------------------------------------------------------ service
class Widgets extends EventEmitter {
  constructor(log) {
    super();
    this.log = log || (() => {});
    this.cfg = null;
    this.lang = 'en';
    this.data = { crypto: null, news: null };
    this.timers = {};
    this.paused = false;     // gaming mode: no background fetches while a game runs
    this.missed = false;
  }

  setPaused(on) {
    on = !!on;
    if (this.paused === on) return;
    this.paused = on;
    if (!on && this.missed) { this.missed = false; this.refresh().catch(() => {}); }
  }

  configure(cfg, lang) {
    const prev = JSON.stringify([this.cfg, this.lang]);
    this.cfg = cfg || {};
    this.lang = lang;
    if (prev === JSON.stringify([this.cfg, this.lang])) return;
    this.schedule('crypto', 90 * 1000);
    this.schedule('news', 15 * 60 * 1000);
  }

  schedule(kind, every) {
    clearInterval(this.timers[kind]);
    const enabled = this.cfg && this.cfg[kind] && this.cfg[kind].enabled !== false;
    if (!enabled) { this.data[kind] = null; this.emit('update', this.data); return; }
    this.refresh(kind);
    this.timers[kind] = setInterval(() => this.refresh(kind), every);
  }

  async refresh(kind) {
    if (!kind) { await Promise.all([this.refresh('crypto'), this.refresh('news')]); return; }
    const cfg = (this.cfg && this.cfg[kind]) || {};
    if (cfg.enabled === false) return;
    if (this.paused) { this.missed = true; return; }
    try {
      const result = kind === 'crypto' ? await cryptoPrices(cfg) : await newsItems(cfg, this.lang);
      this.data[kind] = { ...result, updatedAt: Date.now() };
    } catch (e) {
      this.log(`${kind} widget failed`, e.message);
      const prev = this.data[kind];
      this.data[kind] = prev && prev.items && prev.items.length ? { ...prev, stale: true } : { error: true, items: [], updatedAt: Date.now() };
    }
    this.emit('update', this.data);
  }

  stop() { for (const k of Object.keys(this.timers)) clearInterval(this.timers[k]); }
}

module.exports = { Widgets, COINS, FEEDS, defaultFeeds, parseFeed };
