'use strict';
// In-game bar: renders the numbers main sends once a second. Click-through; never takes focus.
(function () {
  const bar = document.getElementById('bar');
  const api = window.gamebar || null;
  let cfg = { hud: { metrics: ['fps', 'low1', 'cpu', 'cpuTemp', 'gpu', 'gpuTemp', 'vram', 'ram', 'ping', 'clock'], size: 'm', opacity: 88 }, temp: 'c', language: 'en', accent: '#0a84ff' };
  let data = null;
  let lastHtml = '';
  let lastSize = '';

  function digits(s) { return String(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  const has = (v) => v !== null && v !== undefined && Number.isFinite(Number(v));

  function temp(c) {
    if (!has(c)) return null;
    return cfg.temp === 'f' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
  }
  function tempCls(c, warn, bad) { return !has(c) ? '' : c >= bad ? 'bad' : c >= warn ? 'warn' : ''; }
  function fpsCls(f) { return !has(f) ? '' : f < 30 ? 'bad' : f < 55 ? 'warn' : 'good'; }

  const ICON = {
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    time: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
    ping: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
    battery: '<rect width="16" height="10" x="2" y="7" rx="2"/><line x1="22" x2="22" y1="11" y2="13"/>',
  };
  const ic = (n) => `<svg class="ic" viewBox="0 0 24 24">${ICON[n]}</svg>`;
  const v = (val, cls = '') => (has(val) || typeof val === 'string' ? `<b class="v ${cls}">${esc(digits(val))}</b>` : '<b class="v na">–</b>');
  const u = (s) => `<span class="u${s[0] === '°' ? ' deg' : ''}">${esc(s)}</span>`;
  const l = (s) => `<span class="l">${esc(s)}</span>`;

  function gb(bytes) {
    const g = bytes / 1073741824;
    if (Math.abs(g - Math.round(g)) < 0.05) return String(Math.round(g));
    return g >= 10 ? g.toFixed(0) : g.toFixed(1);
  }

  function elapsed(start) {
    const s = Math.max(0, Math.floor((Date.now() - start) / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`;
  }

  // metrics that share a label are drawn as one segment (CPU 34% 62°)
  function segments(m) {
    const want = (cfg.hud && Array.isArray(cfg.hud.metrics)) ? cfg.hud.metrics : [];
    const on = (k) => want.includes(k);
    const out = [];
    const unit = cfg.temp === 'f' ? '°F' : '°';
    for (const k of want) {
      switch (k) {
        case 'fps': {
          const none = !m.fpsSrc;
          out.push(`<div class="seg fps ${none ? 'none' : ''}"><span class="dot"></span>${v(none ? null : m.fps, fpsCls(m.fps))}${u('FPS')}</div>`);
          break;
        }
        case 'low1': if (m.fpsSrc) out.push(`<div class="seg">${l('1%')}${v(m.low1, fpsCls(m.low1))}</div>`); break;
        case 'ft': if (m.fpsSrc) out.push(`<div class="seg">${l('FT')}${v(has(m.ft) ? m.ft.toFixed(1) : null)}${u('ms')}</div>`); break;
        case 'cpu': case 'cpuTemp': {
          if (out.some((s) => s.includes('data-g="cpu"'))) break;
          const parts = [];
          if (on('cpu')) parts.push(`${v(m.cpu)}${u('%')}`);
          if (on('cpuTemp')) parts.push(`${v(temp(m.cpuTemp), tempCls(m.cpuTemp, 80, 90))}${u(unit)}`);
          out.push(`<div class="seg" data-g="cpu">${l('CPU')}${parts.join('<span class="sep">·</span>')}</div>`);
          break;
        }
        case 'gpu': case 'gpuTemp': case 'power': {
          if (out.some((s) => s.includes('data-g="gpu"'))) break;
          const parts = [];
          if (on('gpu')) parts.push(`${v(m.gpu)}${u('%')}`);
          if (on('gpuTemp')) parts.push(`${v(temp(m.gpuTemp), tempCls(m.gpuTemp, 78, 86))}${u(unit)}`);
          if (on('power') && has(m.gpuPower)) parts.push(`${v(Math.round(m.gpuPower))}${u('W')}`);
          out.push(`<div class="seg" data-g="gpu">${l('GPU')}${parts.join('<span class="sep">·</span>')}</div>`);
          break;
        }
        case 'vram': {
          if (!has(m.vram)) { out.push(`<div class="seg">${l('VRAM')}${v(null)}</div>`); break; }
          const full = has(m.vramTotal) && m.vramTotal > 0 ? m.vram / m.vramTotal : 0;
          out.push(`<div class="seg">${l('VRAM')}${v(gb(m.vram), full >= 0.95 ? 'warn' : '')}${has(m.vramTotal) && m.vramTotal > 0 ? u(`/${digits(gb(m.vramTotal))}G`) : u('G')}</div>`);
          break;
        }
        case 'ram': out.push(`<div class="seg">${l('RAM')}${v(m.ram, m.ram >= 95 ? 'bad' : m.ram >= 88 ? 'warn' : '')}${u('%')}</div>`); break;
        case 'ping': {
          if (m.ping === undefined) break;
          const p = m.ping;
          const cls = p === -1 ? 'bad' : p >= 120 ? 'bad' : p >= 70 ? 'warn' : '';
          out.push(`<div class="seg">${ic('ping')}${p === -1 ? '<b class="v bad">×</b>' : `${v(p, cls)}${u('ms')}`}</div>`);
          break;
        }
        case 'clock': {
          const d = new Date();
          out.push(`<div class="seg">${v(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)}</div>`);
          break;
        }
        case 'time': if (m.session && m.session.start) out.push(`<div class="seg">${ic('time')}${v(elapsed(m.session.start))}</div>`); break;
        case 'battery': if (m.battery && !m.battery.plugged) out.push(`<div class="seg">${ic('battery')}${v(m.battery.percent, m.battery.percent <= 15 ? 'bad' : m.battery.percent <= 30 ? 'warn' : '')}${u('%')}</div>`); break;
        default: break;
      }
    }
    return out;
  }

  function render() {
    const m = data || {};
    const hud = cfg.hud || {};
    bar.className = `bar size-${['s', 'm', 'l'].includes(hud.size) ? hud.size : 'm'}`;
    document.documentElement.style.setProperty('--op', String(Math.min(1, Math.max(0.15, (Number(hud.opacity) || 88) / 100))));
    document.documentElement.style.setProperty('--accent', cfg.accent || '#0a84ff');
    const segs = segments(m);
    const html = segs.length ? segs.join('') : `<div class="seg fps none"><span class="dot"></span>${v(null)}${u('FPS')}</div>`;
    if (html !== lastHtml) { lastHtml = html; bar.innerHTML = html; }
    report();
  }

  function report() {
    const w = Math.ceil(bar.offsetWidth) + 20;
    const h = Math.ceil(bar.offsetHeight) + 14;
    const key = `${w}x${h}`;
    if (key === lastSize) return;
    lastSize = key;
    if (api) api.size(w, h);
  }

  if (api) {
    api.on('gamebar:config', (c) => { if (c) { cfg = { ...cfg, ...c }; render(); } });
    api.on('gamebar:data', (m) => { data = m; render(); });
  } else {
    // browser preview: ?demo
    data = { fps: 144, low1: 98, ft: 6.9, fpsSrc: 'etw', cpu: 34, cpuTemp: 62, gpu: 97, gpuTemp: 71, vram: 6.1 * 1073741824, vramTotal: 8 * 1073741824, ram: 61, ping: 23, session: { start: Date.now() - 4210000 } };
    const q = new URLSearchParams(location.search);
    if (q.get('lang')) cfg.language = q.get('lang');
    if (q.get('size')) cfg.hud.size = q.get('size');
    if (q.get('m')) cfg.hud.metrics = q.get('m').split(',');
    if (q.get('hot')) Object.assign(data, { fps: 41, low1: 22, cpuTemp: 93, gpuTemp: 84, ram: 91, ping: 140 });
  }
  render();
  setInterval(render, 1000); // keeps the clock / play time moving between updates
}());
