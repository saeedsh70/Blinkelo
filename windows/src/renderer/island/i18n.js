// i18n for the island: the languages listed in shared/strings.js (Gregorian calendar, Latin digits).
import shared from '../../shared/strings.js';

const { strings, langInfo, LANGS } = shared;
const cache = {};

export function createI18n(getSettings) {
  const lang = () => {
    const l = getSettings().language;
    return LANGS.some((x) => x.code === l) ? l : 'en';
  };
  const digits = (s) => String(s);
  const table = () => { const l = lang(); if (!cache[l]) cache[l] = strings(l); return cache[l]; };

  function t(key, vars) {
    let s = table()[key];
    if (s === undefined || s === '') s = strings('en')[key] || key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, vars[k]);
    return s;
  }

  function num(n, frac = 0) {
    if (n === null || n === undefined || Number.isNaN(n)) return '–';
    return digits(Number(n).toFixed(frac));
  }

  function clock(date = new Date(), withSeconds = false) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return digits(withSeconds ? `${h}:${m}:${s}` : `${h}:${m}`);
  }

  function hour(date) { return digits(`${String(date.getHours()).padStart(2, '0')}:00`); }

  function duration(sec, forceHours = false) {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const mm = h > 0 || forceHours ? String(m).padStart(2, '0') : String(m);
    const out = h > 0 || forceHours ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
    return digits(out);
  }

  function timerText(sec) {
    sec = Math.max(0, Math.ceil(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return digits(h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
  }

  function locale() {
    return langInfo(lang()).locale;
  }

  // plain locale for numbers and planner dates (calendar chosen per call)
  function baseLocale() {
    return langInfo(lang()).locale.split('-u-')[0];
  }
  function numberingSystem() {
    return 'latn';
  }
  function numFmt(v, opts = {}) {
    if (v === null || v === undefined || !Number.isFinite(Number(v))) return '–';
    try { return new Intl.NumberFormat(baseLocale(), { numberingSystem: numberingSystem(), ...opts }).format(v); } catch (_) { return digits(String(v)); }
  }
  function fmtDate(date, opts) {
    try {
      return new Intl.DateTimeFormat(baseLocale(), { calendar: 'gregory', numberingSystem: numberingSystem(), ...opts }).format(date);
    } catch (_) {
      return date.toDateString();
    }
  }

  function dates(date = new Date()) {
    const out = {};
    try {
      const loc = locale();
      out.weekday = new Intl.DateTimeFormat(loc, { weekday: 'long' }).format(date);
      out.primary = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
      out.short = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' }).format(date);
      out.secondary = '';
    } catch (_) {
      out.weekday = ''; out.primary = date.toDateString(); out.short = ''; out.secondary = '';
    }
    return out;
  }

  function weekdayShort(date) {
    try { return new Intl.DateTimeFormat(locale(), { weekday: 'short' }).format(date); } catch (_) { return ''; }
  }

  function ago(ts) {
    const d = Math.max(0, Date.now() - ts);
    if (d < 60000) return t('now');
    if (d < 3600000) return t('minAgo', { n: digits(Math.floor(d / 60000)) });
    if (d < 86400000 * 2) return t('hourAgo', { n: digits(Math.floor(d / 3600000)) });
    return fmtDate(new Date(ts), { day: 'numeric', month: 'short' });
  }

  function bytes(n) {
    if (!Number.isFinite(n)) return '–';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${digits(n.toFixed(n >= 100 || i === 0 ? 0 : 1))} ${units[i]}`;
  }

  function temp(v) {
    if (v === null || v === undefined || Number.isNaN(v)) return '–';
    return `${digits(Math.round(v))}°`;
  }

  return {
    t, num, clock, hour, duration, timerText, dates, weekdayShort, ago, bytes, temp, digits, lang, numFmt, fmtDate,
    dir: () => langInfo(lang()).dir,
  };
}
