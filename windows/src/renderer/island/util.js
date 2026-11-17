// Small DOM / color helpers.
export function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function h(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export function hashHue(str) {
  let x = 0;
  for (let i = 0; i < (str || '').length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0;
  return x % 360;
}

export function initials(name) {
  const clean = String(name || '?').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/);
  const first = Array.from(parts[0])[0] || '?';
  const second = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : '';
  return (first + (second || '')).toUpperCase();
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  let hh = 0; let s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hh = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hh = (b - r) / d + 2;
    else hh = (r - g) / d + 4;
    hh *= 60;
  }
  return [hh, s, l];
}

const hsl = (hh, s, l) => `hsl(${Math.round(hh)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

// Extract two vivid, readable-on-black colors from an image (album art / avatar).
export function extractColors(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => {
      try {
        const n = 28;
        const c = document.createElement('canvas');
        c.width = n; c.height = n;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, n, n);
        const data = ctx.getImageData(0, 0, n, n).data;
        const buckets = new Map();
        for (let i = 0; i < data.length; i += 4) {
          const [hh, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          if (data[i + 3] < 128 || l < 0.08 || l > 0.96) continue;
          const key = Math.round(hh / 24) % 15;
          const score = s * s * (1 - Math.abs(l - 0.55));
          const b = buckets.get(key) || { score: 0, hh: 0, s: 0, l: 0, n: 0 };
          b.score += score; b.hh += hh; b.s += s; b.l += l; b.n += 1;
          buckets.set(key, b);
        }
        const sorted = [...buckets.values()].filter((b) => b.n > 2).sort((a, b) => b.score - a.score);
        if (!sorted.length) return resolve(null);
        const pick = (b) => {
          const s = Math.max(0.45, Math.min(0.95, b.s / b.n + 0.1));
          const l = Math.max(0.55, Math.min(0.72, b.l / b.n + 0.08));
          return { h: b.hh / b.n, s, l };
        };
        const a = pick(sorted[0]);
        const bb = sorted[1] ? pick(sorted[1]) : { h: (a.h + 40) % 360, s: a.s, l: Math.min(0.75, a.l + 0.06) };
        resolve({ c1: hsl(a.h, a.s, a.l), c2: hsl(bb.h, bb.s, bb.l), raw: [a, bb] });
      } catch (_) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function mediaAppName(source) {
  const s = String(source || '').toLowerCase();
  const map = [
    ['spotify', 'Spotify'], ['chrome', 'Chrome'], ['msedge', 'Edge'], ['308046b0af4a39cb', 'Firefox'], ['firefox', 'Firefox'],
    ['vlc', 'VLC'], ['zunemusic', 'Media Player'], ['zunevideo', 'Movies & TV'], ['applemusic', 'Apple Music'], ['itunes', 'iTunes'],
    ['foobar', 'foobar2000'], ['aimp', 'AIMP'], ['opera', 'Opera'], ['brave', 'Brave'], ['telegram', 'Telegram'],
    ['whatsapp', 'WhatsApp'], ['potplayer', 'PotPlayer'], ['mpc', 'MPC'], ['deezer', 'Deezer'], ['tidal', 'TIDAL'],
    ['youtube', 'YouTube Music'], ['amazon', 'Amazon Music'], ['soundcloud', 'SoundCloud'], ['musicbee', 'MusicBee'],
  ];
  for (const [k, v] of map) if (s.includes(k)) return v;
  const base = String(source || '').split(/[\\/!]/).pop().replace(/\.exe$/i, '');
  return base.length > 18 ? base.slice(0, 18) : base;
}

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export function debounce(fn, ms) {
  let t = null;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function throttle(fn, ms) {
  let last = 0; let timer = null; let pending = null;
  return (...args) => {
    const now = Date.now();
    pending = args;
    if (now - last >= ms) { last = now; fn(...args); pending = null; return; }
    if (!timer) {
      timer = setTimeout(() => { timer = null; last = Date.now(); if (pending) fn(...pending); pending = null; }, ms - (now - last));
    }
  };
}

// Synthesized chime (no audio files needed).
let audioCtx = null;
export function chime(kind = 'timer') {
  try {
    audioCtx = audioCtx || new AudioContext();
    const now = audioCtx.currentTime;
    const notes = kind === 'timer' ? [880, 1174.66, 1318.5] : kind === 'find' ? [1046.5, 1568, 1318.5, 2093] : [660, 880];
    const peak = kind === 'find' ? 0.32 : 0.18;
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t0 = now + i * (kind === 'find' ? 0.12 : 0.16);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0);
      o.stop(t0 + 1);
    });
  } catch (_) { /* audio unavailable */ }
}
