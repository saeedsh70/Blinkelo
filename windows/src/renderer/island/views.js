// Island views. Each view: size(d, ctx) -> {w,h,r}, key(d, ctx), render(d, ctx) -> Element, update(el, d, ctx).
import { icon } from './icons.js';
import { esc, h, hashHue, initials, mediaAppName, clamp } from './util.js';
import { CLOCK_ZONES, cityName } from './cities.js';
export { CLOCK_ZONES, cityName };
import { monthGrid, dateOfIso, isoOf } from './calendar.js';
import HL from '../../shared/home-layout.js';
import DM from '../../shared/deck-meta.js';
import SL from '../../shared/sub-langs.js';
import { faceHtml } from '../shared/blink.js';

const COMPACT_H = 32;

// direction of the first strong character (so right-to-left content mirrors naturally)
export function isRtl(text) {
  const m = String(text || '').match(/[A-Za-zÀ-ɏЀ-ӿ֐-ࣿיִ-﷿ﹰ-﻿一-鿿]/);
  return !!m && /[֐-ࣿיִ-﷿ﹰ-﻿]/.test(m[0]);
}

// ------------------------------------------------------------------ weather helpers
export function wxInfo(code, isDay = true) {
  const c = Number(code);
  if (c === 0) return { ic: isDay ? 'sun' : 'moon', key: 'wx_clear', anim: isDay ? 'wx-spin' : 'wx-float' };
  if (c === 1) return { ic: isDay ? 'sun' : 'moon', key: 'wx_mostlyClear', anim: isDay ? 'wx-spin' : 'wx-float' };
  if (c === 2) return { ic: isDay ? 'cloud-sun' : 'cloud-moon', key: 'wx_partlyCloudy', anim: 'wx-float' };
  if (c === 3) return { ic: 'cloud', key: 'wx_cloudy', anim: 'wx-float' };
  if (c === 45 || c === 48) return { ic: 'cloud-fog', key: 'wx_fog', anim: 'wx-float' };
  if (c >= 51 && c <= 57) return { ic: 'cloud-drizzle', key: 'wx_drizzle', anim: 'wx-bob' };
  if ((c >= 61 && c <= 67)) return { ic: 'cloud-rain', key: 'wx_rain', anim: 'wx-bob' };
  if (c >= 80 && c <= 82) return { ic: 'cloud-rain', key: 'wx_showers', anim: 'wx-bob' };
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return { ic: 'cloud-snow', key: 'wx_snow', anim: 'wx-bob' };
  if (c >= 95) return { ic: 'cloud-lightning', key: 'wx_thunder', anim: 'wx-flash' };
  return { ic: 'cloud', key: 'wx_cloudy', anim: 'wx-float' };
}

function wxIcon(code, isDay, size, extra = '') {
  const w = wxInfo(code, isDay);
  return `<span class="wx-ic ${w.anim} ${extra}" data-wx="${w.ic}">${icon(w.ic, size, 2)}</span>`;
}

function wxColor(code, isDay) {
  const c = Number(code);
  if (c <= 1) return isDay ? 'var(--yellow)' : '#c7d2fe';
  if (c === 2) return isDay ? '#ffd27a' : '#c7d2fe';
  if (c >= 95) return 'var(--purple)';
  if (c >= 51) return 'var(--teal)';
  return '#d1d5db';
}

// ------------------------------------------------------------------ shared bits
function avatar(src, name, { size = 'md', badge = null, cls = '', hue = null } = {}) {
  const hh = hue === null ? hashHue(name) : hue;
  const inner = src
    ? `<img src="${esc(src)}" alt="" draggable="false">`
    : `<span class="av-letters">${esc(initials(name))}</span>`;
  const b = badge ? `<span class="av-badge">${badge}</span>` : '';
  return `<div class="av av-${size} ${cls}" style="--hue:${hh}">${inner}${b}</div>`;
}

function art(src, size, colors, video = false) {
  if (src) return `<img class="art art-${size}" src="${esc(src)}" alt="" draggable="false">`;
  const c1 = (colors && colors.c1) || (video ? 'var(--purple)' : 'var(--accent)');
  return `<div class="art art-${size} art-ph ${video ? 'vid' : ''}" style="--c1:${c1}">${icon(video ? 'video' : 'music', size === 'lg' ? 26 : size === 'md' ? 20 : 12, 2.2)}</div>`;
}

// where the media comes from, for subtitles: phone app, desktop player or SMTC app
function mediaSub(m) {
  if (m.artist) return m.artist;
  if (m.phone) return m.source || '';
  return m.player || mediaAppName(m.source);
}

function viz(n, cls = '') {
  return `<div class="viz ${cls}" data-viz="${n}" dir="ltr">${'<i></i>'.repeat(n)}</div>`;
}

function ring(p, size, color, stroke = 3, inner = '') {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return `<div class="ring" style="width:${size}px;height:${size}px;--rc:${color}">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
      <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - clamp(p, 0, 1))).toFixed(2)}"
        transform="rotate(-90 ${size / 2} ${size / 2})" data-circ="${c.toFixed(2)}"/>
    </svg>${inner ? `<div class="ring-in">${inner}</div>` : ''}</div>`;
}

function setRing(el, p) {
  if (!el) return;
  const fg = el.querySelector('.ring-fg');
  if (!fg) return;
  const c = Number(fg.dataset.circ);
  fg.setAttribute('stroke-dashoffset', (c * (1 - clamp(p, 0, 1))).toFixed(2));
}

function bind(el, name, text) {
  const n = el.querySelector(`[data-bind="${name}"]`);
  if (n && n.textContent !== text) n.textContent = text;
}

function volIcon(level, muted) {
  if (muted || level <= 0.001) return 'volume-x';
  if (level < 0.34) return 'volume';
  if (level < 0.67) return 'volume-1';
  return 'volume-2';
}

export function mediaPos(m) {
  if (!m) return 0;
  let p = m.position || 0;
  if (m.status === 'playing') p += (Date.now() - m.receivedAt) / 1000;
  return m.duration > 0 ? clamp(p, 0, m.duration) : Math.max(0, p);
}

function timerState(tm) {
  if (!tm) return { remaining: 0, elapsed: 0, progress: 0 };
  const now = Date.now();
  if (tm.kind === 'stopwatch') {
    const elapsed = (tm.accum || 0) + (tm.running ? (now - tm.startedAt) / 1000 : 0);
    return { elapsed, remaining: 0, progress: (elapsed % 60) / 60 };
  }
  const remaining = tm.running ? Math.max(0, (tm.endsAt - now) / 1000) : tm.remaining;
  return { remaining, elapsed: tm.duration - remaining, progress: tm.duration > 0 ? remaining / tm.duration : 0 };
}

function pdots(privacy) {
  return `${privacy.mic.length ? '<i class="pd mic"></i>' : ''}${privacy.cam.length ? '<i class="pd cam"></i>' : ''}${privacy.loc.length ? '<i class="pd loc"></i>' : ''}`;
}

// ------------------------------------------------------------------ idle & minimized handle
export const idle = {
  name: 'idle',
  size(d, ctx) {
    const notch = ctx.s.style === 'notch';
    const showClock = d.hover || ctx.s.idleClock;
    if (showClock) return { w: notch ? 236 : 186, h: 34 };
    const extra = (d.privacy.mic.length ? 10 : 0) + (d.privacy.cam.length ? 10 : 0) + (d.privacy.loc.length ? 10 : 0);
    return { w: (notch ? 196 : 124) + extra, h: notch ? 32 : 30 };
  },
  key(d, ctx) { return `idle:${d.hover || ctx.s.idleClock ? 'clock' : 'plain'}:${d.weather && d.weather.current ? 'wx' : 'nowx'}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const showClock = d.hover || ctx.s.idleClock;
    if (!showClock) return h(`<div class="cmp idle"><div class="pdots">${pdots(d.privacy)}</div></div>`);
    const w = d.weather && d.weather.current;
    const right = w
      ? `<span class="idle-wx" data-bind-wx>${wxIcon(w.code, w.isDay, 15)}<span class="tnum" data-bind="temp">${ctx.i.temp(w.temp)}</span></span>`
      : `<span class="idle-date" data-bind="date">${esc(ctx.i.dates().short)}</span>`;
    return h(`<div class="cmp idle clock" dir="ltr">
      <span class="idle-time tnum" data-bind="clock">${ctx.i.clock()}</span>
      ${right}
      <div class="pdots">${pdots(d.privacy)}</div>
    </div>`);
  },
  update(el, d, ctx) {
    bind(el, 'clock', ctx.i.clock());
    const w = d.weather && d.weather.current;
    if (w) bind(el, 'temp', ctx.i.temp(w.temp));
    const dots = el.querySelector('.pdots');
    if (dots) {
      const html = pdots(d.privacy);
      if (dots.innerHTML !== html) dots.innerHTML = html;
    }
  },
};

export const handle = {
  name: 'handle',
  size(d, ctx) {
    const notch = ctx.s.style === 'notch';
    if (d.activity) return { w: notch ? 140 : 96, h: 16, r: 8 };
    return { w: notch ? 120 : 70, h: 10, r: 5 };
  },
  key(d) { return `handle:${d.activity || ''}`; },
  render(d) {
    let inner = '';
    if (d.activity === 'media') inner = viz(4, 'viz-mini');
    else if (d.activity === 'timer') inner = '<i class="hdot orange"></i>';
    else if (d.activity === 'call') inner = '<i class="hdot green"></i>';
    return h(`<div class="cmp handle-v">${inner}</div>`);
  },
};

// ------------------------------------------------------------------ media
export const media = {
  name: 'media',
  expandTo: 'media',
  size(d) {
    if (!d.info || !(d.media.title || d.media.artist)) return { w: d.hover ? 268 : 252, h: d.hover ? 36 : COMPACT_H };
    return { w: d.hover ? 378 : 360, h: d.hover ? 36 : COMPACT_H };
  },
  key(d) {
    const m = d.media;
    return `media:${m.art ? m.artKey : 'noart'}:${m.phone ? 1 : 0}:${m.video ? 1 : 0}:${d.info ? `${m.title}|${mediaSub(m)}` : ''}`;
  },
  render(d) {
    const m = d.media;
    const info = d.info && (m.title || m.artist);
    const sub = mediaSub(m);
    const title = m.title || sub;
    return h(`<div class="cmp media ${info ? 'with-info' : ''} ${m.status === 'playing' ? 'playing' : ''}" dir="ltr">
      <div class="media-left">${art(m.art, 'sm', m.colors, m.video)}${m.phone ? `<span class="src-badge">${icon('smartphone', 8, 3)}</span>` : ''}</div>
      ${info ? `<div class="cm-info marquee"><span dir="auto"><b>${esc(title)}</b>${m.title && sub ? `<em> · ${esc(sub)}</em>` : ''}</span></div>` : ''}
      <div class="media-right">${icon('pause', 12, 0, 'paused-ic', true)}${viz(5)}</div>
    </div>`);
  },
  update(el, d) { el.classList.toggle('playing', d.media.status === 'playing'); },
};

export const mediaMini = {
  name: 'mediaMini',
  bubble: true,
  key(d) { return `mm:${d.media.artKey}`; },
  render(d) {
    return h(`<div class="bub mm ${d.media.status === 'playing' ? 'playing' : ''}">${art(d.media.art, 'xs', d.media.colors)}</div>`);
  },
  update(el, d) { el.classList.toggle('playing', d.media.status === 'playing'); },
};

export const mediaExpanded = {
  name: 'mediaExpanded',
  size() { return { w: 432, h: 184, r: 46 }; },
  key(d, ctx) { return `mx:${d.media.artKey}:${d.media.art ? 1 : 0}:${d.cc ? 1 : 0}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const m = d.media;
    const playing = m.status === 'playing';
    return h(`<div class="mx ${playing ? 'playing' : ''}">
      <div class="mx-top" dir="ltr">
        <div class="mx-art-wrap" data-s>${art(m.art, 'lg', m.colors, m.video)}</div>
        <div class="mx-meta" data-s>
          <div class="mx-title marquee" dir="auto"><span>${esc(m.title || ctx.i.t('nowPlaying'))}</span></div>
          <div class="mx-artist" dir="auto">${esc(m.artist || m.album || '')}</div>
        </div>
        <div class="mx-side" data-s>
          <span class="chip">${m.phone ? icon('smartphone', 11, 2.4) : ''}${esc(m.phone ? m.source : (m.player || mediaAppName(m.source)))}</span>
          ${viz(6, 'viz-lg')}
        </div>
      </div>
      <div class="mx-prog" dir="ltr" data-s>
        <span class="tnum t-dim" data-bind="elapsed">0:00</span>
        <div class="prog ${m.canSeek ? 'seekable' : ''} ${m.duration ? '' : 'nodur'}" data-slider="seek"><div class="prog-fill"></div><div class="prog-knob"></div></div>
        <span class="tnum t-dim" data-bind="remain">-0:00</span>
      </div>
      <div class="mx-ctrl" dir="ltr" data-s>
        <div class="mx-sl"><button class="ib" data-act="volume.toggleMute" title="${esc(ctx.i.t('volume'))}">${icon(volIcon(d.volume.level, d.volume.muted), 18)}</button></div>
        <div class="mx-main-ctrl">
          <button class="ib" data-act="media.prev" ${m.canPrev === false ? 'disabled' : ''}>${icon('skip-back', 24, 0, '', true)}</button>
          <button class="ib big" data-act="media.toggle">${icon(playing ? 'pause' : 'play', 30, 0, 'pp', true)}</button>
          <button class="ib" data-act="media.next" ${m.canNext === false ? 'disabled' : ''}>${icon('skip-forward', 24, 0, '', true)}</button>
        </div>
        <div class="mx-sr">
          ${d.cc ? `<button class="ib mx-cc" data-act="subs.open" title="${esc(ctx.i.t('subsTitle'))}">${icon('captions', 18)}</button>` : ''}
          <button class="ib" data-act="dashboard" title="${esc(ctx.i.t('home'))}">${icon('layout-grid', 17)}</button>
        </div>
      </div>
    </div>`);
  },
  update(el, d, ctx) {
    const m = d.media;
    const playing = m.status === 'playing';
    el.classList.toggle('playing', playing);
    const pp = el.querySelector('[data-act="media.toggle"]');
    const want = playing ? 'pause' : 'play';
    if (pp && pp.dataset.icon !== want) { pp.dataset.icon = want; pp.innerHTML = icon(want, 30, 0, 'pp', true); }
    const volBtn = el.querySelector('[data-act="volume.toggleMute"]');
    const vi = volIcon(d.volume.level, d.volume.muted);
    if (volBtn && volBtn.dataset.icon !== vi) { volBtn.dataset.icon = vi; volBtn.innerHTML = icon(vi, 18); }
    const pos = d.seekPreview !== null && d.seekPreview !== undefined ? d.seekPreview : mediaPos(m);
    const dur = m.duration || 0;
    bind(el, 'elapsed', dur > 0 || !m.win ? ctx.i.duration(pos) : '');
    bind(el, 'remain', dur > 0 ? `-${ctx.i.duration(dur - pos)}` : '');
    const fill = el.querySelector('.prog-fill');
    const knob = el.querySelector('.prog-knob');
    const p = dur > 0 ? clamp(pos / dur, 0, 1) : 0;
    if (fill) fill.style.width = `${(p * 100).toFixed(2)}%`;
    if (knob) knob.style.left = `${p * 100}%`;
  },
};

// ------------------------------------------------------------------ notifications
function notifAvatar(n) {
  const badge = n.app && n.app.phone ? icon('smartphone', 10, 2.6) : null;
  return avatar(n.avatar || n.appIcon, n.title || n.appName, { size: 'md', badge, cls: n.avatar ? '' : (n.appIcon ? 'av-icon' : '') });
}

export const notification = {
  name: 'notification',
  expandTo: 'notification',
  size(d) { return { w: d.hover ? 400 : 388, h: d.hover ? 76 : 72, r: 36 }; },
  key(d) { return `nt:${d.n.id}:${d.n.avatar ? 1 : 0}:${d.n.appIcon ? 1 : 0}`; },
  render(d, ctx) {
    const n = d.n;
    const sub = [n.attribution || n.appName, ctx.i.ago(n.time)].filter(Boolean).join(' · ');
    const dir = isRtl(`${n.title} ${n.body}`) ? 'rtl' : 'ltr';
    return h(`<div class="nt" dir="${dir}">
      ${notifAvatar(n)}
      <div class="nt-body">
        <div class="nt-head"><span class="nt-title">${esc(n.title || n.appName)}</span><span class="nt-app" data-bind="sub">${esc(sub)}</span></div>
        <div class="nt-text">${esc(ctx.s.notifications.showBody === false ? '' : n.body)}</div>
      </div>
      <div class="nt-more ${d.queue > 0 ? 'show' : ''}" data-bind="more">+${ctx.i.num(d.queue)}</div>
    </div>`);
  },
  update(el, d, ctx) {
    const more = el.querySelector('.nt-more');
    if (more) { more.classList.toggle('show', d.queue > 0); more.textContent = `+${ctx.i.num(d.queue)}`; }
  },
};

export const notificationExpanded = {
  name: 'notificationExpanded',
  autoHeight: true,
  size() { return { w: 436, h: 200, r: 40 }; },
  key(d, ctx) { return `nx:${d.n.id}:${d.n.avatar ? 1 : 0}:${d.status || ''}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const n = d.n;
    const t = ctx.i.t;
    const acts = (n.actions || []).filter((a) => !a.inputId && a.content && a.placement !== 'contextMenu').slice(0, 3);
    const input = (n.inputs || []).find((i) => i.type !== 'selection');
    const sendAct = input ? (n.actions || []).find((a) => a.inputId === input.id) : null;
    const status = d.status ? `<div class="nx-status ${d.statusOk ? 'ok' : 'bad'}">${icon(d.statusOk ? 'check' : 'x', 13, 2.6)} ${esc(d.status)}</div>` : '';
    const dir = isRtl(`${n.title} ${n.body}`) ? 'rtl' : 'ltr';
    const kde = n.source === 'kde';
    return h(`<div class="nx" dir="${dir}">
      <div class="nx-head" data-s>
        ${notifAvatar(n)}
        <div class="nx-meta">
          <div class="nt-title">${esc(n.title || n.appName)}</div>
          <div class="nt-app">${esc([n.attribution || n.appName, ctx.i.ago(n.time)].filter(Boolean).join(' · '))}</div>
        </div>
        ${kde
    ? (n.clearable ? `<button class="ib sm" data-act="notif.phoneDismiss" title="${esc(t('dismiss'))}">${icon('trash-2', 16)}</button>` : '')
    : `<button class="ib sm" data-act="notif.open" title="${esc(t('open'))}">${icon('external-link', 16)}</button>`}
        <button class="ib sm" data-act="notif.dismiss" title="${esc(t('dismiss'))}">${icon('x', 17)}</button>
      </div>
      <div class="nx-text" data-s>${esc(ctx.s.notifications.showBody === false ? '' : (n.body || ''))}</div>
      ${acts.length ? `<div class="nx-acts" data-s>${acts.map((a, i) => `<button class="pill" data-act="notif.action" data-arg="${i}">${esc(a.content)}</button>`).join('')}</div>` : ''}
      ${input ? `<form class="nx-reply" data-form="reply" data-s>
          <input type="text" name="reply" autocomplete="off" placeholder="${esc(input.placeholder || t('reply'))}" dir="auto">
          <button class="send" type="submit" title="${esc(sendAct && sendAct.content ? sendAct.content : t('send'))}">${icon('send', 16, 2.2)}</button>
        </form>` : ''}
      ${status}
    </div>`);
  },
};

// ------------------------------------------------------------------ calls
export const call = {
  name: 'call',
  size() { return { w: 432, h: 86, r: 43 }; },
  key(d, ctx) { return `call:${d.call.id}:${d.call.avatar ? 1 : 0}:${d.call.pending || ''}:${d.call.error ? 1 : 0}:${d.call.muted ? 1 : 0}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const c = d.call;
    const t = ctx.i.t;
    const kde = c.source === 'kde';
    let sub;
    if (c.error) sub = t('callFailed');
    else if (c.pending) sub = t('connecting');
    else if (kde) sub = null;
    else sub = [c.subtitle || t('incomingCall'), c.phone ? 'Phone Link' : c.appName].filter(Boolean).join(' · ');
    const buttons = kde
      ? `<button class="cbtn gray ${c.muted ? 'on' : ''}" data-act="call.mute" title="${esc(t('muteRinger'))}">${icon(c.muted ? 'bell-off' : 'bell-ring', 21, 2.2)}</button>
         <button class="cbtn red" data-act="call.dismiss" title="${esc(t('dismiss'))}">${icon('x', 22, 2.4)}</button>`
      : `<button class="cbtn red ${c.pending === 'decline' ? 'busy' : ''}" data-act="call.decline" title="${esc(t('decline'))}">${icon('phone-off', 22, 2.2)}</button>
         <button class="cbtn green ${c.pending ? '' : 'wiggle'} ${c.pending === 'accept' ? 'busy' : ''}" data-act="call.accept" title="${esc(t('accept'))}">${icon('phone', 22, 2.2)}</button>`;
    return h(`<div class="call" dir="ltr">
      <div class="call-av">${avatar(c.avatar, c.name, { size: 'lg', cls: 'pulse' })}</div>
      <div class="call-meta">
        <div class="call-name" dir="auto">${esc(c.name || t('unknownCaller'))}</div>
        ${sub === null
    ? `<div class="call-sub two" dir="${ctx.i.dir()}">${c.subtitle ? `<bdi dir="ltr">${esc(c.subtitle)}</bdi><br>` : ''}${esc(t('answerOnPhone'))}</div>`
    : `<div class="call-sub ${c.error ? 'err' : ''}" dir="auto">${esc(sub)}</div>`}
      </div>
      <div class="call-btns">${buttons}</div>
    </div>`);
  },
};

export const callActive = {
  name: 'callActive',
  expandTo: 'callActive',
  size(d) { return { w: d.hover ? 248 : 232, h: d.hover ? 36 : COMPACT_H }; },
  key() { return 'callA'; },
  render(d, ctx) {
    return h(`<div class="cmp calla" dir="ltr">
      <span class="calla-ic">${icon('phone', 13, 2.6)}</span>
      <span class="tnum calla-time" data-bind="t">${ctx.i.duration((Date.now() - d.call.startedAt) / 1000)}</span>
      ${viz(5, 'viz-green')}
    </div>`);
  },
  update(el, d, ctx) { bind(el, 't', ctx.i.duration((Date.now() - d.call.startedAt) / 1000)); },
};

export const callActiveExpanded = {
  name: 'callActiveExpanded',
  size() { return { w: 400, h: 120, r: 44 }; },
  key(d, ctx) { return `callAX:${d.call.id}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const c = d.call;
    const t = ctx.i.t;
    const kde = c.source === 'kde';
    return h(`<div class="callx" dir="ltr">
      <div class="callx-top" data-s>
        ${avatar(c.avatar, c.name, { size: 'md' })}
        <div class="call-meta"><div class="call-name" dir="auto">${esc(c.name || t('unknownCaller'))}</div>
        <div class="call-sub green tnum" data-bind="t">${t('onCall')} · ${ctx.i.duration((Date.now() - c.startedAt) / 1000)}</div></div>
        ${viz(6, 'viz-green viz-lg')}
      </div>
      <div class="callx-btns" data-s>
        ${kde ? '' : `<button class="pill" data-act="action" data-arg="phonelink">${icon('smartphone', 15)} ${esc(t('openPhoneLink'))}</button>`}
        <button class="pill" data-act="call.hide">${icon('eye-off', 15)} ${esc(t('hide'))}</button>
        ${kde ? '' : `<button class="pill red" data-act="call.end">${icon('phone-off', 15)} ${esc(t('endCall'))}</button>`}
      </div>
    </div>`);
  },
  update(el, d, ctx) { bind(el, 't', `${ctx.i.t('onCall')} · ${ctx.i.duration((Date.now() - d.call.startedAt) / 1000)}`); },
};

// ------------------------------------------------------------------ phone pairing
export const pair = {
  name: 'pair',
  size() { return { w: 456, h: 88, r: 44 }; },
  key(d, ctx) { return `pair:${d.pair.id}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    const code = d.pair.verifyKey ? `${d.pair.verifyKey.slice(0, 4)} ${d.pair.verifyKey.slice(4)}` : '';
    return h(`<div class="call pairv" dir="${ctx.i.dir()}">
      <div class="pair-ic">${icon('smartphone', 24, 2)}</div>
      <div class="call-meta" style="text-align:start">
        <div class="call-name">${esc(t('pairRequest', { name: d.pair.name }))}</div>
        <div class="call-sub">${code ? `${esc(t('pairCode', { code: '' }))}<b class="code" dir="ltr">${esc(code)}</b>` : ''}</div>
      </div>
      <div class="call-btns">
        <button class="cbtn gray" data-act="pair.reject" title="${esc(t('rejectPair'))}">${icon('x', 22, 2.4)}</button>
        <button class="cbtn green" data-act="pair.accept" title="${esc(t('acceptPair'))}">${icon('check', 22, 2.6)}</button>
      </div>
    </div>`);
  },
};

// ------------------------------------------------------------------ HUDs (transient)
export const volume = {
  name: 'volume',
  size() { return { w: 330, h: 44 }; },
  key() { return 'vol'; },
  render(d) {
    return h(`<div class="hud" dir="ltr">
      <span class="hud-ic" data-bind-icon="vol">${icon(volIcon(d.volume.level, d.volume.muted), 20)}</span>
      <div class="slider" data-slider="volume"><div class="slider-fill"></div></div>
      <span class="hud-val tnum" data-bind="v"></span>
    </div>`);
  },
  update(el, d, ctx) {
    const v = d.volume;
    const lvl = v.muted ? 0 : v.level;
    const fill = el.querySelector('.slider-fill');
    if (fill) fill.style.width = `${(lvl * 100).toFixed(2)}%`;
    bind(el, 'v', v.muted ? '' : ctx.i.num(Math.round(v.level * 100)));
    const ic = el.querySelector('[data-bind-icon="vol"]');
    const name = volIcon(v.level, v.muted);
    if (ic && ic.dataset.name !== name) { ic.dataset.name = name; ic.innerHTML = icon(name, 20); }
    el.classList.toggle('muted', !!v.muted);
  },
};

export const battery = {
  name: 'battery',
  size() { return { w: 330, h: 44 }; },
  key(d) { return `bat:${d.kind}:${d.battery.charging ? 1 : 0}`; },
  render(d, ctx) {
    const b = d.battery;
    const t = ctx.i.t;
    const low = d.kind === 'low';
    const label = low ? t('batteryLow') : (b.charging ? (b.percent >= 100 ? t('fullyCharged') : t('charging')) : t('onBattery'));
    const cls = low ? 'low' : (b.charging ? 'chg' : '');
    return h(`<div class="hud bat ${cls}" dir="${ctx.i.dir()}">
      <span class="hud-label">${esc(label)}</span>
      <span class="hud-val tnum" dir="ltr">${ctx.i.num(b.percent)}%</span>
      <div class="bat-ic"><div class="bat-fill" style="transform:scaleX(${clamp(b.percent / 100, 0.04, 1)})"></div>${b.charging ? `<span class="bat-bolt">${icon('zap', 12, 0, '', true)}</span>` : ''}</div>
    </div>`);
  },
};

export const keys = {
  name: 'keys',
  size() { return { w: 258, h: 40 }; },
  key(d) { return `keys:${d.which}:${d.on ? 1 : 0}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    const label = d.which === 'num' ? (d.on ? t('numOn') : t('numOff')) : (d.on ? t('capsOn') : t('capsOff'));
    return h(`<div class="hud keys ${d.on ? 'on' : ''}" dir="${ctx.i.dir()}">
      <span class="key-cap">${icon(d.which === 'num' ? 'hash' : 'arrow-big-up', 18, 2.2, '', d.on && d.which !== 'num')}</span>
      <span class="hud-label">${esc(label)}</span>
      <i class="key-led"></i>
    </div>`);
  },
};

export const copied = {
  name: 'copied',
  size() { return { w: 352, h: 44 }; },
  key(d) { return `copy:${d.item.id || d.item.time}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    const it = d.item;
    const label = it.kind === 'error' ? t('clipboardTooLarge') : it.kind === 'secret' ? t('protectedCopied') : it.kind === 'image' ? t('imageCopied') : it.kind === 'file' ? t('fileCopied') : t('copied');
    const preview = it.kind === 'image' && it.thumb
      ? `<img class="copy-thumb" src="${esc(it.thumb)}" alt="">`
      : it.kind === 'secret' ? '<span class="copy-prev">••••••••</span>'
        : `<span class="copy-prev" dir="auto">${esc((it.text || '').replace(/\s+/g, ' ').slice(0, 80))}</span>`;
    return h(`<div class="hud copy" dir="${ctx.i.dir()}">
      <span class="hud-ic accent">${icon(it.kind === 'secret' ? 'shield' : 'clipboard-check', 19, 2.2)}</span>
      <span class="hud-label">${esc(label)}</span>
      ${preview}
    </div>`);
  },
};

export const privacy = {
  name: 'privacy',
  size() { return { w: 360, h: 44 }; },
  key(d) { return `priv:${d.kind}:${d.app}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    const k = d.kind;
    const text = t(k === 'mic' ? 'micInUse' : k === 'cam' ? 'camInUse' : 'locInUse', { app: d.app || t('someApp') });
    return h(`<div class="hud priv ${k}" dir="${ctx.i.dir()}">
      <span class="priv-ic">${icon(k === 'mic' ? 'mic' : k === 'cam' ? 'video' : 'map-pin', 16, 2.4)}</span>
      <span class="hud-label">${esc(text)}</span>
    </div>`);
  },
};

export const message = {
  name: 'message',
  size(d) { return { w: clamp(120 + (d.text || '').length * 6.4, 260, 440), h: 44 }; },
  key(d) { return `msg:${d.id}`; },
  render(d, ctx) {
    // icon 'blinkelo': the brand face, which winks once as the message lands
    const ic = d.icon === 'blinkelo' ? `<span class="hud-ic bk-hud">${faceHtml('bk-sm wink-once')}</span>`
      : `<span class="hud-ic ${d.tone || ''}">${icon(d.icon || 'sparkles', 18, 2.2)}</span>`;
    return h(`<div class="hud msg ${d.tone || ''}" dir="${ctx.i.dir()}">
      ${ic}
      <span class="hud-label">${esc(d.text)}</span>
    </div>`);
  },
};

export const track = {
  name: 'track',
  size() { return { w: 372, h: 46 }; },
  key(d) { return `trk:${d.media.artKey}:${d.media.art ? 1 : 0}:${d.media.title}`; },
  render(d, ctx) {
    const m = d.media;
    return h(`<div class="hud trk playing" dir="ltr">
      ${art(m.art, 'sm2', m.colors, m.video)}
      <div class="trk-meta"><div class="trk-title" dir="auto">${esc(m.title || ctx.i.t('nowPlaying'))}</div>
      <div class="trk-artist" dir="auto">${esc(mediaSub(m))}</div></div>
      ${viz(5)}
    </div>`);
  },
};

export const drop = {
  name: 'drop',
  size() { return { w: 440, h: 116, r: 42 }; },
  key(d, ctx) { return `drop:${d.apps ? 'apps' : 'shelf'}:${ctx.i.lang()}`; },
  render(d, ctx) {
    return h(`<div class="drop">
      <div class="drop-zone" data-s>${icon(d.apps ? 'app-window' : 'download', 26, 2)}<span>${esc(d.apps ? ctx.i.t('addApp') : ctx.i.t('dropHere'))}</span></div>
    </div>`);
  },
};

// ------------------------------------------------------------------ timer
export const timer = {
  name: 'timer',
  expandTo: 'timer',
  size(d) { return { w: d.hover ? 226 : 212, h: d.hover ? 36 : COMPACT_H }; },
  key(d) { return `tmr:${d.timer.kind}`; },
  render(d, ctx) {
    const tm = d.timer;
    const sw = tm.kind === 'stopwatch';
    const st = timerState(tm);
    return h(`<div class="cmp tmr ${sw ? 'sw' : ''} ${tm.running ? '' : 'paused'}" dir="ltr">
      ${ring(st.progress, 20, sw ? 'var(--green)' : 'var(--orange)', 3)}
      <span class="tmr-text tnum" data-bind="t">${sw ? ctx.i.duration(st.elapsed) : ctx.i.timerText(st.remaining)}</span>
    </div>`);
  },
  update(el, d, ctx) {
    const tm = d.timer;
    const st = timerState(tm);
    bind(el, 't', tm.kind === 'stopwatch' ? ctx.i.duration(st.elapsed) : ctx.i.timerText(st.remaining));
    setRing(el.querySelector('.ring'), st.progress);
    el.classList.toggle('paused', !tm.running);
  },
};

export const timerMini = {
  name: 'timerMini',
  bubble: true,
  key(d) { return `tmini:${d.timer.kind}`; },
  render(d) {
    const sw = d.timer.kind === 'stopwatch';
    return h(`<div class="bub tmini">${ring(timerState(d.timer).progress, 22, sw ? 'var(--green)' : 'var(--orange)', 3)}</div>`);
  },
  update(el, d) { setRing(el.querySelector('.ring'), timerState(d.timer).progress); },
};

export const timerExpanded = {
  name: 'timerExpanded',
  size() { return { w: 400, h: 140, r: 46 }; },
  key(d, ctx) { return `tx:${d.timer.kind}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const tm = d.timer;
    const t = ctx.i.t;
    const sw = tm.kind === 'stopwatch';
    const st = timerState(tm);
    const color = sw ? 'var(--green)' : 'var(--orange)';
    return h(`<div class="tx ${sw ? 'sw' : ''}" dir="${ctx.i.dir()}">
      <div data-s>${ring(st.progress, 92, color, 5, `<span class="tx-ring-ic">${icon(sw ? 'timer' : 'hourglass', 22, 2.2)}</span>`)}</div>
      <div class="tx-main" data-s>
        <div class="tx-label">${esc(sw ? t('stopwatch') : t('timer'))}</div>
        <div class="tx-time tnum" data-bind="t" dir="ltr">${sw ? ctx.i.duration(st.elapsed) : ctx.i.timerText(st.remaining)}</div>
        <div class="tx-sub" data-bind="sub"></div>
      </div>
      <div class="tx-btns" data-s>
        <button class="cbtn sm ${sw ? 'green' : 'orange'}" data-act="timer.toggle">${icon(tm.running ? 'pause' : 'play', 18, 0, '', true)}</button>
        ${sw ? `<button class="cbtn sm gray" data-act="timer.reset">${icon('rotate-ccw', 17, 2.2)}</button>`
    : `<button class="cbtn sm gray" data-act="timer.add">${icon('plus', 18, 2.4)}</button>`}
        <button class="cbtn sm gray" data-act="timer.stop">${icon('x', 18, 2.4)}</button>
      </div>
    </div>`);
  },
  update(el, d, ctx) {
    const tm = d.timer;
    const st = timerState(tm);
    const sw = tm.kind === 'stopwatch';
    bind(el, 't', sw ? ctx.i.duration(st.elapsed) : ctx.i.timerText(st.remaining));
    let sub = '';
    if (!sw && tm.running) sub = ctx.i.t('endsAt', { t: ctx.i.clock(new Date(tm.endsAt)) });
    else if (!tm.running) sub = ctx.i.t('paused');
    bind(el, 'sub', sub);
    setRing(el.querySelector('.ring'), st.progress);
    const tg = el.querySelector('[data-act="timer.toggle"]');
    const want = tm.running ? 'pause' : 'play';
    if (tg && tg.dataset.icon !== want) { tg.dataset.icon = want; tg.innerHTML = icon(want, 18, 0, '', true); }
  },
};

export const timerDone = {
  name: 'timerDone',
  size() { return { w: 380, h: 92, r: 46 }; },
  key(d, ctx) { return `tdone:${ctx.i.lang()}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    return h(`<div class="tdone" dir="${ctx.i.dir()}">
      <span class="tdone-ic">${icon('alarm-clock', 30, 2.2)}</span>
      <div class="tdone-meta"><div class="tdone-title">${esc(t('timesUp'))}</div>
      <div class="t-dim" dir="auto">${esc(d.label || t('timer'))} · <span class="tnum" dir="ltr">${ctx.i.timerText(d.duration || 0)}</span></div></div>
      <button class="cbtn sm gray" data-act="timer.again" title="${esc(t('start'))}">${icon('rotate-ccw', 18, 2.2)}</button>
      <button class="cbtn sm orange" data-act="timer.dismiss" title="${esc(t('dismiss'))}">${icon('x', 20, 2.6)}</button>
    </div>`);
  },
};

// ------------------------------------------------------------------ Blinkelo Link: find my PC, received items, transfers
export const findPc = {
  name: 'findPc',
  size() { return { w: 420, h: 88, r: 44 }; },
  key(d, ctx) { return `findpc:${d.name}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    return h(`<div class="call findpc" dir="${ctx.i.dir()}" data-act="findpc.stop">
      <div class="find-ic"><span class="find-wave"></span><span class="find-wave w2"></span>${icon('radar', 24, 2)}</div>
      <div class="call-meta" style="text-align:start">
        <div class="call-name" dir="auto">${esc(t('findPcTitle', { name: d.name || t('phoneTools') }))}</div>
        <div class="call-sub">${esc(t('findPcSub'))}</div>
      </div>
      <div class="call-btns"><button class="cbtn red" data-act="findpc.stop" title="${esc(t('stopSound'))}">${icon('volume-x', 22, 2.2)}</button></div>
    </div>`);
  },
};

function fmtBytes(n, ctx) {
  const v = Number(n) || 0;
  if (v >= 1073741824) return `${ctx.i.num((v / 1073741824).toFixed(1))} GB`;
  if (v >= 1048576) return `${ctx.i.num((v / 1048576).toFixed(1))} MB`;
  if (v >= 1024) return `${ctx.i.num(Math.round(v / 1024))} KB`;
  return `${ctx.i.num(v)} B`;
}

export const received = {
  name: 'received',
  size(d) { return { w: d.kind === 'file' ? 452 : 420, h: 80, r: 40 }; },
  key(d, ctx) { return `recv:${d.id}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    let title = t('receivedFile');
    let ic = 'file-down';
    let sub = '';
    let btns = '';
    if (d.kind === 'file') {
      if (d.image) { title = t('receivedPhoto'); ic = 'image'; }
      sub = `<bdi>${esc(d.file || '')}</bdi> · <bdi>${fmtBytes(d.size, ctx)}</bdi>`;
      btns = `<button class="cbtn sm gray" data-act="recv.show" title="${esc(t('showInFolder'))}">${icon('folder-open', 18, 2.2)}</button>
        <button class="cbtn sm blue" data-act="recv.open" title="${esc(t('open'))}">${icon('external-link', 18, 2.2)}</button>`;
    } else if (d.kind === 'url') {
      title = t('receivedLink'); ic = 'link';
      sub = `<bdi dir="ltr">${esc(String(d.url || '').replace(/^https?:\/\//, '').slice(0, 60))}</bdi>${d.opened ? ` · ${esc(t('linkOpened'))}` : ''}`;
      btns = d.opened ? '' : `<button class="cbtn sm blue" data-act="recv.open" title="${esc(t('open'))}">${icon('external-link', 18, 2.2)}</button>`;
    } else {
      title = t('receivedText'); ic = 'clipboard-check';
      sub = `<bdi>${esc(String(d.text || '').replace(/\s+/g, ' ').slice(0, 70))}</bdi>`;
    }
    return h(`<div class="recv" dir="${ctx.i.dir()}">
      <span class="recv-ic ${d.kind}">${icon(ic, 22, 2.1)}<i class="recv-badge">${icon('smartphone', 9, 2.8)}</i></span>
      <div class="recv-meta"><div class="recv-title">${esc(title)} <span class="t-dim">· ${esc(t('fromName', { name: d.name || '' }))}</span></div>
        <div class="recv-sub one">${sub}</div></div>
      <div class="recv-btns">${btns}<button class="cbtn sm gray" data-act="recv.close" title="${esc(t('dismiss'))}">${icon('x', 18, 2.6)}</button></div>
    </div>`);
  },
};

export const transfer = {
  name: 'transfer',
  size() { return { w: 360, h: 46 }; },
  key(d) { return `xfer:${d.tid}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    const el = h(`<div class="hud xfer" dir="${ctx.i.dir()}">
      <span class="hud-ic blue">${icon(d.dir === 'out' ? 'upload' : 'download', 17, 2.3)}</span>
      <div class="xfer-meta"><div class="xfer-top"><span class="xfer-name one" dir="auto">${esc(d.name || '')}</span><span class="tnum xfer-pct" data-bind="p"></span></div>
        <div class="xfer-bar"><i></i></div><div class="xfer-sub t-dim">${esc(t(d.dir === 'out' ? 'sendingTo' : 'receivingFrom'))}</div></div>
    </div>`);
    transfer.update(el, d, ctx);
    return el;
  },
  update(el, d, ctx) {
    const p = d.total ? Math.min(1, (Number(d.done) || 0) / d.total) : 0;
    const bar = el.querySelector('.xfer-bar i');
    if (bar) bar.style.transform = `scaleX(${p})`;
    bind(el, 'p', `${ctx.i.num(Math.round(p * 100))}%`);
  },
};

// ------------------------------------------------------------------ subtitles
function subLang(code) { const l = SL.byCode(code); return l ? l.name : SL.short(code); }
function subsEpisode(v, ctx) {
  if (!v) return '';
  if (v.season !== null && v.season !== undefined) return ctx.i.t('subsEpisode', { s: ctx.i.num(v.season), e: ctx.i.num(v.episode) });
  return v.year ? ctx.i.num(v.year) : '';
}
function subFileIcon(lang, size = 22) {
  return `<span class="sfile-ic">${icon('captions', size, 2)}<i class="sfile-lang">${esc(SL.short(lang))}</i></span>`;
}
const SPIN = (size = 14) => `<span class="spin-ic">${icon('loader', size, 2.4)}</span>`;

// small bubble beside the media pill: searching -> ready; drag it straight onto the player
export const subsMini = {
  name: 'subsMini',
  bubble: true,
  key(d) { return `smini:${d.subs.status === 'ready' ? 'ready' : 'busy'}`; },
  render(d) {
    const ready = d.subs.status === 'ready';
    return h(`<div class="bub smini ${ready ? 'ready' : 'busy'}" ${ready ? 'draggable="true" data-subdrag="1"' : ''}>${icon('captions', 17, 2.1)}<i class="smini-dot"></i></div>`);
  },
};

// "subtitle ready" HUD: the whole pill can be dragged onto the player
export const subsReady = {
  name: 'subsReady',
  size() { return { w: 408, h: 64, r: 32 }; },
  key(d, ctx) { return `sready:${d.file.name}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    return h(`<div class="sready" dir="${ctx.i.dir()}" draggable="true" data-subdrag="1">
      ${subFileIcon(d.file.lang)}
      <div class="sready-meta"><div class="sready-title">${esc(t('subsReady'))} <span class="t-dim">· ${esc(subLang(d.file.lang))}</span></div>
        <div class="sready-sub">${esc(t('subsDragHint'))}</div></div>
      <span class="sready-grip">${icon('grip-horizontal', 16, 2.2)}</span>
    </div>`);
  },
};

function subsLangsHtml(st) {
  return (st.langs || []).map((c) => `<button class="spn-lang ${c === st.lang ? 'on' : ''}" data-act="subs.lang" data-arg="${esc(c)}" title="${esc(subLang(c))}">${esc(SL.short(c))}</button>`).join('');
}

function subsStatusHtml(st, ctx) {
  const t = ctx.i.t;
  const btn = (act, label, ic) => `<button class="pill sm" data-act="${act}">${icon(ic, 13, 2.4)} ${esc(label)}</button>`;
  switch (st.status) {
    case 'searching': return `<div class="spn-status">${SPIN(16)}<span>${esc(t('subsSearching'))}</span></div>`;
    case 'downloading': return `<div class="spn-status">${SPIN(16)}<span>${esc(t('subsDownloading'))}</span></div>`;
    case 'found': return `<div class="spn-status">${icon('arrow-down', 16, 2.2)}<span>${esc(t('subsPick'))}</span></div>`;
    case 'nokey': return `<div class="spn-status warn">${icon('triangle-alert', 16, 2.2)}<span>${esc(t('subsNoKey'))}</span>${btn('subs.settings', t('settings'), 'settings')}</div>`;
    case 'off': return `<div class="spn-status">${icon('eye-off', 16, 2.2)}<span>${esc(t('subsOff'))}</span>${btn('subs.settings', t('settings'), 'settings')}</div>`;
    case 'error': return `<div class="spn-status warn">${icon('triangle-alert', 16, 2.2)}<span>${esc(t(`subsErr_${(st.error && st.error.code) || 'other'}`))}</span>${btn('subs.retry', t('retry'), 'rotate-cw')}</div>`;
    case 'empty': return `<div class="spn-status">${icon('search', 16, 2.2)}<span>${esc(t('subsNone'))}</span></div>`;
    default: return `<div class="spn-status">${SPIN(16)}<span>${esc(t('subsSearching'))}</span></div>`;
  }
}

function subsBodyHtml(st, ctx) {
  const t = ctx.i.t;
  let top;
  if (st.file) {
    const busy = st.downloading ? SPIN(15) : '';
    top = `<div class="spn-file" draggable="true" data-subdrag="1" title="${esc(st.file.release || st.file.name)}">
      ${subFileIcon(st.file.lang)}
      <div class="spn-file-meta"><div class="spn-file-name" dir="ltr">${esc(st.file.name)}</div>
        <div class="spn-file-hint">${icon('grip-horizontal', 12, 2.4)} ${esc(t('subsDragHint'))} · ${esc(SL.PROVIDER_NAMES[st.file.provider] || '')}</div></div>
      ${busy}
      <button class="ib sm" data-act="subs.reveal" title="${esc(t('showInFolder'))}">${icon('folder-open', 16)}</button>
    </div>`;
  } else {
    top = subsStatusHtml(st, ctx);
    // nothing to list yet: let the status fill the panel
    if (!(st.results || []).length) top = top.replace('class="spn-status', 'class="spn-status big');
  }
  const notes = [];
  if (st.fallback) notes.push(t('subsFallback', { lang: subLang(st.fallback.from), other: subLang(st.fallback.to) }));
  if (st.error && st.file) notes.push(t(`subsErr_${st.error.code || 'other'}`));
  if (st.error && !st.file && st.status !== 'error' && st.error.download) notes.push(t(`subsErr_${st.error.code || 'other'}`));
  const note = notes.length ? `<div class="spn-note">${esc(notes.join(' · '))}</div>` : '';
  const rows = (st.results || []).map((r) => {
    const on = r.id === st.selected;
    const dl = r.id === st.downloading;
    const lead = dl ? SPIN(13) : on ? icon('check', 13, 3) : icon('captions', 13, 2);
    return `<button class="spn-row ${on ? 'on' : ''} ${dl ? 'dl' : ''}" data-act="subs.choose" data-arg="${esc(r.id)}" title="${esc(r.name)}">
      <span class="spn-row-ic">${lead}</span>
      <span class="spn-rel" dir="ltr">${esc(r.name)}</span>
      ${r.hash ? `<span class="stag green">${esc(t('subsExact'))}</span>` : ''}
      ${r.hi ? '<span class="stag">HI</span>' : ''}
      ${r.lang && r.lang !== st.lang ? `<span class="stag">${esc(SL.short(r.lang))}</span>` : ''}
      <span class="stag prov">${esc(SL.PROVIDER_NAMES[r.provider] || r.provider)}</span>
    </button>`;
  }).join('');
  const searchingMore = st.file && st.searching ? `<div class="spn-more">${SPIN(12)} ${esc(t('subsSearching'))}</div>` : '';
  const list = rows ? `<div class="spn-cap">${esc(t('subsOthers'))}</div><div class="spn-list scroll">${rows}</div>` : searchingMore;
  return `${top}${note}${list}`;
}

// the subtitle panel (from the CC button, the bubble or the HUD)
export const subsPanel = {
  name: 'subsPanel',
  size() { return { w: 468, h: 304, r: 40 }; },
  key(d, ctx) { return `spanel:${d.subs.video ? d.subs.video.key : ''}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const st = d.subs;
    const v = st.video || {};
    const t = ctx.i.t;
    const q = st.query && st.query.manual ? st.query.title : (v.title || '');
    const sub = [subsEpisode(v, ctx), v.app].filter(Boolean).join(' · ');
    return h(`<div class="spn" dir="${ctx.i.dir()}">
      <div class="spn-head" data-s>
        <span class="spn-cc">${icon('captions', 19, 2)}</span>
        <div class="spn-meta"><div class="spn-title" dir="auto">${esc(v.title || t('subsTitle'))}</div><div class="spn-sub">${esc(sub)}</div></div>
        <div class="spn-langs"></div>
        <button class="ib sm" data-act="subs.settings" title="${esc(t('settings'))}">${icon('settings', 16)}</button>
        <button class="ib sm" data-act="subs.close" title="${esc(t('dismiss'))}">${icon('x', 17)}</button>
      </div>
      <div class="spn-body" data-s></div>
      <form class="spn-search" data-form="subs" data-s>
        <span class="spn-search-ic">${icon('search', 14, 2.4)}</span>
        <input name="q" type="text" maxlength="120" dir="auto" spellcheck="false" placeholder="${esc(t('subsSearchPh'))}" value="${esc(q)}">
        <button class="pill sm accent" type="submit">${esc(t('subsSearch'))}</button>
      </form>
    </div>`);
  },
  update(el, d, ctx) {
    const st = d.subs;
    const sig = JSON.stringify([st.status, st.lang, st.langs, st.file, st.selected, st.downloading, st.searching, st.error, st.fallback, (st.results || []).map((r) => r.id), ctx.i.lang()]);
    if (el.dataset.sig === sig) return;
    el.dataset.sig = sig;
    const body = el.querySelector('.spn-body');
    const list = body.querySelector('.spn-list');
    const scroll = list ? list.scrollTop : 0;
    el.querySelector('.spn-langs').innerHTML = subsLangsHtml(st);
    body.innerHTML = subsBodyHtml(st, ctx);
    const nl = body.querySelector('.spn-list');
    if (nl) nl.scrollTop = scroll;
  },
};

// ------------------------------------------------------------------ dashboard
const TABS = [
  ['home', 'house'], ['alerts', 'bell'], ['apps', 'app-window'], ['planner', 'calendar-check'], ['weather', 'cloud-sun'], ['tools', 'timer'], ['gaming', 'gamepad-2'], ['shelf', 'folder-open'], ['clipboard', 'clipboard'],
];
const QUICK = [
  ['screenshot', 'scan'], ['lock', 'lock'], ['phonelink', 'smartphone'], ['explorer', 'folder'],
  ['calc', 'calculator'], ['taskmgr', 'activity'], ['winsettings', 'settings'], ['focus', 'moon'],
];

function statTile(label, value, p, color, sub = '') {
  return `<div class="stat">
    ${ring(p, 42, color, 4, `<span class="tnum">${value}</span>`)}
    <div class="stat-meta"><div class="stat-label">${esc(label)}</div>${sub ? `<div class="stat-sub tnum">${sub}</div>` : ''}</div>
  </div>`;
}

// a deck key drawn small (home quick row): app image, glyph or first letter
function shortcutTile(s) {
  const look = DM.keyLook(s);
  const inner = s.icon ? `<img src="${esc(s.icon)}" alt="" draggable="false">` : look.glyph ? icon(look.glyph, 16) : `<span class="qa-letter">${esc(initials(s.name)[0] || '?')}</span>`;
  return `<button class="qa" data-act="app.launch" data-arg="${esc(s.id)}" title="${esc(s.name)}"${look.color && !s.icon ? ` style="color:${look.color}"` : ''}>${inner}</button>`;
}

function weatherLine(d, ctx) {
  const w = d.weather;
  if (!w || !w.current) return '';
  const info = wxInfo(w.current.code, w.current.isDay);
  return `<button class="home-wx" data-act="tab" data-arg="weather" style="--wxc:${wxColor(w.current.code, w.current.isDay)}">
    ${wxIcon(w.current.code, w.current.isDay, 16)}<b class="tnum">${ctx.i.temp(w.current.temp)}</b><span>${esc(ctx.i.t(info.key))} · ${esc(w.city)}</span></button>`;
}

// ------------------------------------------------------------------ home: free-form tiles on a 12 x 6 grid
const TILE_TITLE = { clock: 'w_clock', quick: 'w_quick', media: 'w_media', sys: 'w_sys', widgets: 'w_widgets', crypto: 'crypto', news: 'news', clocks: 'clocks', weather: 'weather', tasks: 'planner' };

export function tileStyle(r) {
  const p = HL.rectPx(r);
  return `inset-inline-start:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`;
}

function playerHtml(d, ctx) {
  const t = ctx.i.t;
  const m = d.media;
  if (!m) return `<div class="mini-player empty">${icon('music', 26, 1.8)}<span>${esc(t('nothingPlaying'))}</span></div>`;
  return `<div class="mini-player ${m.status === 'playing' ? 'playing' : ''}">
        <div class="mp-top" dir="ltr">
          ${art(m.art, 'md', m.colors, m.video)}
          <div class="mp-meta"><div class="mp-title marquee" dir="auto"><span>${esc(m.title || t('nowPlaying'))}</span></div>
          <div class="mp-artist" dir="auto">${m.phone ? icon('smartphone', 11, 2.4) : ''}${esc(mediaSub(m))}</div></div>
        </div>
        <div class="mp-prog" dir="ltr">
          <div class="prog thin ${m.canSeek ? 'seekable' : ''} ${m.duration ? '' : 'nodur'}" data-slider="seek"><div class="prog-fill"></div><div class="prog-knob"></div></div>
          <div class="mp-times tnum"><span data-bind="mpel"></span><span data-bind="mprem"></span></div>
        </div>
        <div class="mp-ctrl" dir="ltr">
          <button class="ib sm" data-act="media.prev">${icon('skip-back', 18, 0, '', true)}</button>
          <button class="ib" data-act="media.toggle">${icon(m.status === 'playing' ? 'pause' : 'play', 24, 0, 'pp', true)}</button>
          <button class="ib sm" data-act="media.next">${icon('skip-forward', 18, 0, '', true)}</button>
        </div>
      </div>`;
}

function weatherTile(d, ctx) {
  const t = ctx.i.t;
  const w = d.weather;
  if (!w || !w.current) return `<button class="h-wx empty" data-act="action" data-arg="settings" data-arg2="weather">${icon('map-pin', 20, 1.8)}<span>${esc(t('city'))}</span></button>`;
  const c = w.current;
  const info = wxInfo(c.code, c.isDay);
  const today = w.daily && w.daily[0];
  const days = (w.daily || []).slice(1, 5);
  return `<button class="h-wx" data-act="tab" data-arg="weather" style="--wxc:${wxColor(c.code, c.isDay)}">
    <div class="hwx-now">${wxIcon(c.code, c.isDay, 30)}<b class="tnum">${ctx.i.temp(c.temp)}</b></div>
    <div class="hwx-cond">${esc(t(info.key))}</div>
    <div class="hwx-city">${icon('map-pin', 10, 2.6)}<span>${esc(w.city)}</span>${today ? `<i class="tnum" dir="ltr">↑${ctx.i.temp(today.max)} ↓${ctx.i.temp(today.min)}</i>` : ''}</div>
    ${days.length ? `<div class="hwx-days">${days.map((dd) => `<span><small>${esc(ctx.i.weekdayShort(new Date(`${dd.date}T12:00:00`)))}</small><em style="color:${wxColor(dd.code, true)}">${icon(wxInfo(dd.code, true).ic, 14, 2)}</em><b class="tnum">${ctx.i.temp(dd.max)}</b></span>`).join('')}</div>` : ''}
  </button>`;
}

function todayTasks(d) {
  const today = isoOf(new Date());
  return (d.tasks || []).filter((x) => x.date === today).sort((a, b) => (a.done - b.done) || (a.time || '99').localeCompare(b.time || '99'));
}

function tasksTile(d, ctx) {
  const t = ctx.i.t;
  const list = todayTasks(d);
  const left = list.filter((x) => !x.done).length;
  return `<div class="h-tasks"><button class="ht-head" data-act="tab" data-arg="planner">${icon('list-checks', 13, 2.2)}<b>${esc(t('today'))}</b>
    <span class="t-dim">${list.length ? (left ? esc(t('tasksLeft', { n: ctx.i.digits(left) })) : esc(t('allDone'))) : ''}</span></button>
    <div class="ht-list scroll">${list.length ? list.map((x) => `<div class="task ${x.done ? 'done' : ''}" data-color="${esc(x.color || 'blue')}">
      <button class="tcheck" data-act="task.toggle" data-arg="${esc(x.id)}">${x.done ? icon('check', 12, 3.2) : ''}</button>
      <span class="ttitle" dir="auto">${esc(x.title)}</span>${x.time ? `<span class="ttime tnum" dir="ltr">${ctx.i.digits(x.time)}</span>` : ''}</div>`).join('')
    : `<div class="tasks-empty">${icon('calendar-check', 20, 1.8)}<span>${esc(t('noTasks'))}</span></div>`}</div></div>`;
}

function tileBody(r, d, ctx) {
  const t = ctx.i.t;
  switch (r.t) {
    case 'clock': {
      const dt = ctx.i.dates();
      return `<div class="home-clock">
      <div class="big-time tnum" data-bind="clock" dir="ltr">${ctx.i.clock()}</div>
      <div class="home-date"><b>${esc(dt.weekday)}</b> ${esc(dt.primary)}</div>
      ${dt.secondary ? `<div class="home-date2" dir="ltr">${esc(dt.secondary)}</div>` : ''}
      ${weatherLine(d, ctx)}
    </div>`;
    }
    case 'quick': {
      const p = HL.rectPx(r);
      const n = Math.max(1, Math.floor((p.w + 5) / 35)) * Math.max(1, Math.floor((p.h + 5) / 35));
      const list = (d.shortcuts || []).slice(0, n);
      const quick = list.length
        ? list.map((s) => shortcutTile(s)).join('')
        : QUICK.slice(0, Math.max(1, n - 1)).map(([k, ic]) => `<button class="qa" data-act="action" data-arg="${k}" title="${esc(t(k))}">${icon(ic, 16)}</button>`).join('')
          + (n > 1 ? `<button class="qa" data-act="tab" data-arg="apps" title="${esc(t('apps'))}">${icon('plus', 16)}</button>` : '');
      return `<div class="qa-row">${quick}</div>`;
    }
    case 'media': return playerHtml(d, ctx);
    case 'sys': return '<div class="sys" data-sys></div>';
    case 'widgets':
      return widgetList(d).length ? '<div class="wcard" data-widget></div>'
        : `<div class="wcard"><div class="w-empty">${icon('layout-grid', 18, 2)}<span>${esc(t('w_widgets'))}</span></div></div>`;
    case 'crypto': case 'news': case 'clocks': return `<div class="wcard solo" data-solo="${r.t}"></div>`;
    case 'weather': return weatherTile(d, ctx);
    case 'tasks': return tasksTile(d, ctx);
    default: return '';
  }
}

function homeTab(d, ctx) {
  const t = ctx.i.t;
  const list = HL.normalize(d.home);
  const edit = !!d.homeEdit;
  const tiles = list.map((r) => `<div class="h-tile t-${r.t}${d.homeNew === r.t ? ' pop' : ''}" data-tile="${r.t}" style="${tileStyle(r)}">
      <div class="h-body">${tileBody(r, d, ctx)}</div>
      ${edit ? `<button class="h-x" data-act="home.remove" data-arg="${r.t}" title="${esc(t('remove'))}">${icon('x', 11, 3)}</button><span class="h-resize"></span>` : ''}
    </div>`).join('');
  const empty = list.length ? '' : `<div class="empty-state">${icon('layout-dashboard', 28, 1.8)}<span>${esc(t('homeEmpty'))}</span>
      ${edit ? '' : `<button class="pill accent" data-act="home.edit">${icon('plus', 14, 2.4)} ${esc(t('editLayout'))}</button>`}</div>`;
  return `<div class="home2${edit ? ' editing' : ''}">${edit ? '<div class="h-cells"></div>' : ''}${tiles}${empty}</div>`;
}

// the strip that replaces the tabs while the home layout is being edited
function editBarHtml(d, ctx) {
  const t = ctx.i.t;
  const miss = HL.missing(HL.normalize(d.home));
  const labels = miss.length <= 5;
  const add = d.homeNoRoom ? `<span class="eb-warn">${icon('triangle-alert', 13, 2.4)}${esc(t('noRoom'))}</span>`
    : miss.length ? miss.map((k) => `<button class="eb-chip" data-act="home.add" data-arg="${k}" title="${esc(t('addWidget'))}: ${esc(t(TILE_TITLE[k]))}">${icon('plus', 10, 3.2)}${icon(HL.WIDGETS[k].icon, 13, 2.2)}${labels ? `<span>${esc(t(TILE_TITLE[k]))}</span>` : ''}</button>`).join('')
      : `<span class="t-dim eb-hint">${esc(t('editHint'))}</span>`;
  return `<div class="eb-add">${add}</div>
    <div class="eb-end"><button class="ib sm" data-act="home.reset" title="${esc(t('resetLayout'))}">${icon('rotate-ccw', 15)}</button>
    <button class="pill xs accent" data-act="home.done">${icon('check', 12, 3)} ${esc(t('done'))}</button></div>`;
}

function soloHtml(kind, d, ctx) {
  const w = d.widgets || {};
  const ic = WIDGETS.find(([k]) => k === kind)[1];
  let meta = '';
  if (kind === 'crypto' && w.crypto && w.crypto.items && w.crypto.items.length) meta = 'USD';
  const cfg = d.widgetsCfg || {};
  const body = kind === 'crypto' ? cryptoHtml(w.crypto, ctx) : kind === 'news' ? newsHtml(w.news, ctx) : clocksHtml(cfg.clocks && cfg.clocks.zones, ctx);
  return `<div class="w-head"><span class="w-title">${icon(ic, 13, 2.2)}<span>${esc(ctx.i.t(kind))}</span></span>${meta ? `<span class="w-meta">${esc(meta)}</span>` : ''}</div><div class="w-body">${body}</div>`;
}

// one compact card: CPU / GPU / RAM meters + network speed
function sysHtml(d, ctx) {
  const s = d.stats || {};
  const t = ctx.i.t;
  const meters = [[t('cpu'), s.cpu || 0, 'var(--accent)'], [t('ram'), s.ram || 0, 'var(--purple)']];
  if (s.gpu !== null && s.gpu !== undefined) meters.splice(1, 0, [t('gpu'), s.gpu, 'var(--green)']);
  else if (d.battery && d.battery.has) meters.push([t('battery'), d.battery.percent, 'var(--green)']);
  const net = d.net || { down: 0, up: 0 };
  return `<div class="meters">${meters.map(([label, v, c]) => `
      <div class="meter" style="--mc:${c}"><div class="meter-top"><span>${esc(label)}</span><b class="tnum">${ctx.i.num(v)}<small>%</small></b></div>
      <div class="meter-bar"><i style="width:${clamp(v, 0, 100).toFixed(1)}%"></i></div></div>`).join('')}</div>
    <div class="sys-net tnum" dir="ltr"><span class="dn">${icon('arrow-down', 11, 2.8)}${ctx.i.bytes(net.down)}/s</span><span class="up">${icon('arrow-up', 11, 2.8)}${ctx.i.bytes(net.up)}/s</span>
    ${s.gpuTemp ? `<span class="tmp">${icon('thermometer', 11, 2.4)}${ctx.i.num(s.gpuTemp)}°</span>` : ''}</div>`;
}

const WIDGETS = [['crypto', 'bitcoin'], ['news', 'newspaper'], ['clocks', 'globe']];
function widgetList(d) {
  const cfg = d.widgetsCfg;
  if (!cfg || cfg.module === false) return [];
  return WIDGETS.filter(([k]) => !cfg[k] || cfg[k].enabled !== false);
}

function priceText(v, cur, ctx) {
  if (!Number.isFinite(v)) return '–';
  const frac = v >= 1000 ? 0 : v >= 1 ? 2 : 4;
  return `$${ctx.i.numFmt(v, { minimumFractionDigits: frac, maximumFractionDigits: frac })}`;
}

const COIN_HUE = { BTC: 33, ETH: 230, USDT: 160, BNB: 45, SOL: 280, XRP: 210, TON: 200, DOGE: 48, TRX: 355, ADA: 220, LTC: 215, NOT: 0 };
function cryptoHtml(w, ctx) {
  const t = ctx.i.t;
  if (!w) return `<div class="w-empty">${icon('loader', 18, 2, 'spin')}<span>${esc(t('loading'))}</span></div>`;
  if (w.error && !(w.items || []).length) return `<div class="w-empty">${icon('wifi-off', 18, 2)}<span>${esc(t('widgetError'))}</span><button class="link" data-act="widget.refresh" data-arg="crypto">${esc(t('retry'))}</button></div>`;
  return `<div class="coins">${(w.items || []).map((c) => {
    const up = c.change >= 0;
    return `<div class="coin" dir="ltr"><span class="coin-sym" style="--h:${COIN_HUE[c.sym] !== undefined ? COIN_HUE[c.sym] : hashHue(c.sym)}">${esc(c.sym)}</span>
      <span class="coin-price tnum">${priceText(c.price, w.currency, ctx)}</span>
      <span class="coin-ch tnum ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}${ctx.i.numFmt(Math.abs(c.change), { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%</span></div>`;
  }).join('')}</div>`;
}

function newsHtml(w, ctx) {
  const t = ctx.i.t;
  if (!w) return `<div class="w-empty">${icon('loader', 18, 2, 'spin')}<span>${esc(t('loading'))}</span></div>`;
  const items = w.items || [];
  const failed = w.error || (w.failed && w.failed.length);
  if (!items.length) return `<div class="w-empty">${icon(failed ? 'wifi-off' : 'newspaper', 18, 2)}<span>${esc(t(failed ? 'widgetError' : 'noNews'))}</span><button class="link" data-act="widget.refresh" data-arg="news">${esc(t('retry'))}</button></div>`;
  return `<div class="news scroll">${items.slice(0, 20).map((n) => `
    <button class="news-item" data-act="openUrl" data-arg="${esc(n.link)}" dir="${isRtl(n.title) ? 'rtl' : 'ltr'}" title="${esc(n.title)}">
      <span class="news-t">${esc(n.title)}</span><span class="news-m">${esc(n.feed)}${n.time ? ` · ${esc(ctx.i.ago(n.time))}` : ''}</span></button>`).join('')}</div>`;
}


const DEFAULT_ZONES = ['Europe/London', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo'];
function clocksHtml(zones, ctx) {
  if (!zones || !zones.length) zones = DEFAULT_ZONES;
  const now = new Date();
  const localDay = now.getDate();
  return `<div class="clocks">${(zones || []).slice(0, 5).map((tz) => {
    let hh = 0; let mm = 0; let day = localDay;
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', day: 'numeric', hourCycle: 'h23' })
        .formatToParts(now).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)]));
      hh = parts.hour; mm = parts.minute; day = parts.day;
    } catch (_) { return ''; }
    const night = hh < 6 || hh >= 19;
    const rel = day === localDay ? '' : (day > localDay || (localDay > 25 && day < 3) ? '+1' : '−1');
    return `<div class="clock-row"><span class="clk-ic ${night ? 'night' : 'day'}">${icon(night ? 'moon' : 'sun', 12, 2.4)}</span>
      <span class="clk-city">${esc(cityName(tz, ctx.i.lang()))}</span>
      ${rel ? `<span class="clk-rel tnum" dir="ltr">${rel}</span>` : ''}
      <b class="clk-time tnum" dir="ltr">${ctx.i.digits(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)}</b></div>`;
  }).join('')}</div>`;
}

function widgetHtml(d, ctx) {
  const list = widgetList(d);
  if (!list.length) return '';
  const active = list.some(([k]) => k === d.widgetActive) ? d.widgetActive : list[0][0];
  const w = d.widgets || {};
  let meta = '';
  if (active === 'crypto' && w.crypto && w.crypto.items && w.crypto.items.length) meta = 'USD';
  const body = active === 'crypto' ? cryptoHtml(w.crypto, ctx) : active === 'news' ? newsHtml(w.news, ctx) : clocksHtml(d.widgetsCfg.clocks && d.widgetsCfg.clocks.zones, ctx);
  return `<div class="w-head"><div class="w-tabs">${list.map(([k, ic]) => `<button class="w-tab ${k === active ? 'on' : ''}" data-act="widget" data-arg="${k}" title="${esc(ctx.i.t(k))}">${icon(ic, 13, 2.2)}${k === active ? `<span>${esc(ctx.i.t(k))}</span>` : ''}</button>`).join('')}</div>
    ${meta ? `<span class="w-meta">${esc(meta)}</span>` : ''}</div><div class="w-body">${body}</div>`;
}

function alertsTab(d, ctx) {
  const t = ctx.i.t;
  const list = d.notifHistory || [];
  if (!list.length) return `<div class="empty-state">${icon('bell-off', 28, 1.8)}<span>${esc(t('alertsEmpty'))}</span></div>`;
  return `<div class="list-head"><span class="t-dim">${ctx.i.num(list.length)} ${esc(t('notifications'))}</span><button class="link" data-act="alerts.clear">${esc(t('clearAll'))}</button></div>
    <div class="list scroll">${list.slice(0, 40).map((n) => `
      <div class="row alert-row" data-act="alerts.open" data-arg="${esc(n.id)}" dir="${isRtl(`${n.title} ${n.body}`) ? 'rtl' : 'ltr'}">
        ${avatar(n.avatar || n.appIcon, n.title || n.appName, { size: 'sm', badge: n.app && n.app.phone ? icon('smartphone', 8, 2.8) : null })}
        <div class="row-body"><div class="row-title"><span>${esc(n.title || n.appName)}</span><span class="t-dim">${esc(n.appName)} · ${esc(ctx.i.ago(n.time))}</span></div>
        <div class="row-text">${esc(ctx.s.notifications.showBody === false ? '' : n.body)}</div></div>
        <button class="row-x" data-act="alerts.dismiss" data-arg="${esc(n.id)}" title="${esc(t('dismiss'))}">${icon('x', 12, 2.6)}</button>
      </div>`).join('')}</div>`;
}

// ------------------------------------------------------------------ apps tab: a Stream Deck style board
function deckKey(s) {
  const look = DM.keyLook(s);
  const [kw, kh] = look.size.split('x').map(Number);
  const face = s.icon ? `<img src="${esc(s.icon)}" alt="" draggable="false">`
    : look.glyph ? icon(look.glyph, 24, 1.9) : `<span class="dk-letter">${esc(initials(s.name)[0] || '?')}</span>`;
  const tip = s.kind === 'hotkey' && s.target ? `${s.name} · ${s.target}` : s.name;
  return `<button class="dk k-${esc(s.kind || 'file')}${kw > 1 ? ' w2' : ''}${kh > 1 ? ' h2' : ''}${look.color ? ' tint' : ''}" data-act="app.launch" data-arg="${esc(s.id)}" title="${esc(tip)}"${look.color ? ` style="--kc:${look.color}"` : ''}>
    <span class="dk-face">${face}</span><span class="dk-label" dir="auto">${esc(s.name)}</span></button>`;
}

function appsTab(d, ctx) {
  const t = ctx.i.t;
  const list = d.shortcuts || [];
  if (!list.length) {
    return `<div class="empty-state">${icon('layout-grid', 28, 1.8)}<span>${esc(t('appsEmpty'))}</span>
      <button class="pill accent" data-act="action" data-arg="settings" data-arg2="shortcuts">${icon('plus', 14, 2.4)} ${esc(t('addApp'))}</button></div>`;
  }
  const size = ['s', 'm', 'l'].includes(d.deckSize) ? d.deckSize : 'm';
  const g = DM.deckGrid(size);
  return `<div class="deck-plate"><div class="deck scroll size-${size}" style="--dc:${g.cols};--du:${g.unit}px">${list.map(deckKey).join('')}
    <button class="dk add" data-act="action" data-arg="settings" data-arg2="shortcuts" title="${esc(t('addApp'))}">${icon('plus', 20, 2)}</button></div></div>`;
}

function weatherTab(d, ctx) {
  const t = ctx.i.t;
  const w = d.weather;
  if (!w || !w.current) {
    const err = w && w.error;
    return `<div class="empty-state">${icon(err ? 'cloud-fog' : 'map-pin', 28, 1.8)}<span>${esc(err ? t('weatherError') : t('weatherEmpty'))}</span>
      <button class="pill accent" data-act="action" data-arg="settings" data-arg2="weather">${icon('search', 14, 2.4)} ${esc(t('city'))}</button></div>`;
  }
  const c = w.current;
  const info = wxInfo(c.code, c.isDay);
  const today = w.daily && w.daily[0];
  const hours = (w.hourly || []).slice(0, 8);
  const days = (w.daily || []).slice(0, 6);
  const allMin = Math.min(...days.map((x) => x.min));
  const allMax = Math.max(...days.map((x) => x.max));
  const span = Math.max(1, allMax - allMin);
  return `<div class="wx">
    <div class="wx-now" style="--wxc:${wxColor(c.code, c.isDay)}">
      <div class="wx-city">${icon('map-pin', 12, 2.4)} ${esc(w.city)}</div>
      <div class="wx-big">${wxIcon(c.code, c.isDay, 40, 'big')}<span class="wx-temp tnum">${ctx.i.temp(c.temp)}</span></div>
      <div class="wx-cond">${esc(t(info.key))}${today ? ` · <span class="tnum" dir="ltr">↑${ctx.i.temp(today.max)} ↓${ctx.i.temp(today.min)}</span>` : ''}</div>
      <div class="wx-meta">
        <span>${icon('thermometer', 12, 2.4)} ${esc(t('feelsLike', { t: ctx.i.temp(c.feels) }))}</span>
        <span>${icon('droplets', 12, 2.4)} ${ctx.i.num(c.humidity)}%</span>
        <span>${icon('wind', 12, 2.4)} ${ctx.i.num(c.wind)} ${esc(t('kmh'))}</span>
      </div>
    </div>
    <div class="wx-right">
      <div class="wx-hours" dir="ltr">${hours.map((hh, i) => `<div class="wx-h">
        <span class="t-dim tnum">${i === 0 ? esc(t('now')) : ctx.i.hour(new Date(hh.time))}</span>
        <span style="color:${wxColor(hh.code, hh.isDay)}">${icon(wxInfo(hh.code, hh.isDay).ic, 17, 2)}</span>
        <b class="tnum">${ctx.i.temp(hh.temp)}</b></div>`).join('')}</div>
      <div class="wx-days">${days.slice(0, 5).map((dd, i) => {
    const from = ((dd.min - allMin) / span) * 100;
    const to = ((dd.max - allMin) / span) * 100;
    return `<div class="wx-d">
        <span class="wx-dn">${i === 0 ? esc(t('today')) : esc(ctx.i.weekdayShort(new Date(`${dd.date}T12:00:00`)))}</span>
        <span style="color:${wxColor(dd.code, true)}">${icon(wxInfo(dd.code, true).ic, 15, 2)}</span>
        <span class="tnum t-dim">${ctx.i.temp(dd.min)}</span>
        <span class="wx-bar" dir="ltr"><i style="left:${from.toFixed(1)}%;right:${(100 - to).toFixed(1)}%"></i></span>
        <span class="tnum">${ctx.i.temp(dd.max)}</span>
      </div>`;
  }).join('')}</div>
    </div>
  </div>`;
}

function phoneToolsCard(d, ctx) {
  const t = ctx.i.t;
  const p = d.phoneDevice;
  if (!p) return `<div class="phone-strip off">${icon('smartphone', 15, 2.2)}<span class="t-dim one">${esc(t('noPhoneConnected'))}</span></div>`;
  const via = p.bluetooth && !p.wifi ? `<span class="via bt">${icon('bluetooth', 11, 2.4)} ${esc(t('viaBluetooth'))}</span>` : `<span class="via">${icon('wifi', 11, 2.4)} ${esc(t('viaWifi'))}</span>`;
  const btn = (act, ic, label, on = true) => (on ? `<button class="pt-btn" data-act="${act}" title="${esc(label)}">${icon(ic, 15, 2.2)}<span>${esc(label)}</span></button>` : '');
  return `<div class="phone-strip">
    <div class="ps-name">${icon('smartphone', 15, 2.2)}<span class="one" dir="auto">${esc(p.name)}</span>${via}</div>
    <div class="pt-row">${btn('phone.find', 'bell-ring', t('findPhone'))}${btn('phone.clip', 'clipboard', t('sendClipboard'))}${btn('phone.camera', 'camera', t('takePhoto'), !!p.island)}${btn('phone.sendFile', 'file-up', t('sendFile'))}</div>
  </div>`;
}

function toolsTab(d, ctx) {
  const t = ctx.i.t;
  const presets = [1, 3, 5, 10, 15, 25, 30, 45, 60];
  return `<div class="tools">
    <div class="tool-card">
      <div class="tool-title">${icon('hourglass', 15, 2.2)} ${esc(t('timer'))}</div>
      ${(d.sharedTimers || []).map((timer) => `<div class="row"><button class="link" data-act="timer.selectShared" data-arg="${esc(timer.id)}">${esc(timer.label || t('timer'))} · ${ctx.i.num(Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 60000)))} ${esc(t('minutes'))}</button><button class="ib sm" data-act="timer.cancelShared" data-arg="${esc(timer.id)}" title="${esc(t('cancel'))}">${icon('x', 14)}</button></div>`).join('')}
      <div class="chips">${presets.map((m) => `<button class="chip-btn" data-act="timer.start" data-arg="${m * 60}">${ctx.i.num(m)}<small>${esc(t('minutes'))}</small></button>`).join('')}</div>
      <form class="custom-timer" data-form="timer" dir="ltr">
        <input type="number" name="min" min="1" max="600" placeholder="${esc(t('custom'))}" inputmode="numeric">
        <button class="pill accent" type="submit">${icon('play', 13, 0, '', true)} ${esc(t('start'))}</button>
        <button class="pill" type="button" data-act="stopwatch.start">${icon('timer', 14, 2.2)} ${esc(t('stopwatch'))}</button>
      </form>
    </div>
    <div class="tool-card">
      <div class="tool-title">${icon('layout-grid', 15, 2.2)} ${esc(t('quickActions'))}</div>
      <div class="qa-grid">${QUICK.map(([k, ic]) => `<button class="qa-tile" data-act="action" data-arg="${k}" title="${esc(t(k))}">${icon(ic, 18)}<span>${esc(t(k))}</span></button>`).join('')}</div>
    </div>
    ${phoneToolsCard(d, ctx)}
  </div>`;
}

function shelfTab(d, ctx) {
  const t = ctx.i.t;
  const items = d.shelf || [];
  if (!items.length) return `<div class="empty-state drop-hint">${icon('download', 30, 1.8)}<span>${esc(t('shelfEmpty'))}</span></div>`;
  return `<div class="list-head"><span class="t-dim">${ctx.i.num(items.length)} ${esc(t('items'))} · ${esc(t('shelfTip'))}</span><button class="link" data-act="shelf.clear">${esc(t('clearAll'))}</button></div>
    <div class="shelf-grid scroll">${items.map((f) => `
      <div class="file" draggable="true" data-drag="${esc(f.path)}" data-act="shelf.open" data-arg="${esc(f.path)}" title="${esc(f.path)}">
        <button class="file-x" data-act="shelf.remove" data-arg="${esc(f.path)}">${icon('x', 11, 3)}</button>
        ${d.phoneDevice && !f.isDir ? `<button class="file-ph" data-act="shelf.toPhone" data-arg="${esc(f.path)}" title="${esc(t('toPhone'))}">${icon('smartphone', 11, 2.6)}</button>` : ''}
        ${f.icon ? `<img src="${esc(f.icon)}" alt="" draggable="false">` : icon(f.isDir ? 'folder' : 'file', 30, 1.6)}
        <span dir="auto">${esc(f.name)}</span>
      </div>`).join('')}</div>`;
}

function clipboardTab(d, ctx) {
  const t = ctx.i.t;
  const items = d.clipHistory || [];
  if (!items.length) return `<div class="empty-state">${icon('clipboard', 28, 1.8)}<span>${esc(t('clipboardEmpty'))}</span></div>`;
  return `<div class="list-head"><span class="t-dim">${esc(t('clickToCopy'))}</span><button class="link" data-act="clip.clear">${esc(t('clearAll'))}</button></div>
    <div class="list scroll">${items.map((c) => `
      <div class="row cliprow" data-act="clip.copy" data-arg="${esc(c.id)}" dir="${isRtl(c.text) ? 'rtl' : 'ltr'}">
        <span class="clip-ic">${icon(c.kind === 'image' ? 'image' : c.kind === 'file' ? 'file' : 'file-text', 16, 2)}</span>
        ${c.kind === 'image' && c.thumb ? `<img class="clip-thumb" src="${esc(c.thumb)}" alt="">` : ''}
        <div class="row-text one">${esc((c.text || '').replace(/\s+/g, ' ').slice(0, 160))}</div>
        <span class="t-dim tnum">${esc(ctx.i.ago(c.time))}</span>
      </div>`).join('')}</div>`;
}

function weekStartFor(lang) {
  if (lang === 'ar') return 6; // Saturday
  return lang === 'en' ? 0 : 1;
}

function plannerTab(d, ctx) {
  const t = ctx.i.t;
  const p = d.planner;
  const lang = ctx.i.lang();
  const ws = weekStartFor(lang);
  const cells = monthGrid(p.ym, ws);
  const todayIso = isoOf(new Date());
  const byDay = {};
  for (const task of d.tasks || []) (byDay[task.date] = byDay[task.date] || []).push(task);
  const inMonth = cells.filter((c) => c.inMonth);
  const firstD = dateOfIso(inMonth[0].iso);
  const title = ctx.i.fmtDate(firstD, { month: 'long', year: 'numeric' });
  const wd = [];
  for (let i = 0; i < 7; i += 1) wd.push(ctx.i.fmtDate(dateOfIso(cells[i].iso), { weekday: 'narrow' }));
  const sel = p.sel;
  const selDate = dateOfIso(sel);
  const dayTasks = (byDay[sel] || []).slice().sort((a, b) => (a.done - b.done) || (a.time || '99').localeCompare(b.time || '99'));
  const left = dayTasks.filter((x) => !x.done).length;
  const rtl = ctx.i.dir() === 'rtl';
  const grid = cells.map((c) => {
    const list = byDay[c.iso] || [];
    const pending = list.some((x) => !x.done);
    return `<button class="cday ${c.inMonth ? '' : 'out'} ${c.iso === todayIso ? 'today' : ''} ${c.iso === sel ? 'sel' : ''}" data-act="cal.pick" data-arg="${c.iso}">
      <b class="tnum">${ctx.i.digits(c.g)}</b>${list.length ? `<i class="cdot ${pending ? 'pend' : 'ok'}"></i>` : ''}</button>`;
  }).join('');
  return `<div class="planner">
    <div class="cal">
      <div class="cal-head">
        <button class="ib xs" data-act="cal.prev">${icon(rtl ? 'chevron-right' : 'chevron-left', 15, 2.4)}</button>
        <div class="cal-title"><b>${esc(title)}</b></div>
        <button class="ib xs" data-act="cal.next">${icon(rtl ? 'chevron-left' : 'chevron-right', 15, 2.4)}</button>
      </div>
      <div class="cal-grid">${wd.map((w) => `<span class="cwd">${esc(w)}</span>`).join('')}${grid}</div>
    </div>
    <div class="day">
      <div class="day-head">
        <div class="day-title"><b>${esc(ctx.i.fmtDate(selDate, { weekday: 'long' }))}</b>
        <small>${esc(ctx.i.fmtDate(selDate, { day: 'numeric', month: 'long', year: 'numeric' }))}</small></div>
        ${sel !== todayIso ? `<button class="pill xs" data-act="cal.today">${esc(t('goToday'))}</button>` : ''}
      </div>
      <div class="tasks scroll">${dayTasks.length ? dayTasks.map((x) => `
        <div class="task ${x.done ? 'done' : ''}" data-color="${esc(x.color || 'blue')}">
          <button class="tcheck" data-act="task.toggle" data-arg="${esc(x.id)}">${x.done ? icon('check', 12, 3.2) : ''}</button>
          <span class="ttitle" dir="auto">${esc(x.title)}</span>
          ${x.time ? `<span class="ttime tnum" dir="ltr">${icon('alarm-clock', 11, 2.4)}${ctx.i.digits(x.time)}</span>` : ''}
          <button class="tdel" data-act="task.remove" data-arg="${esc(x.id)}">${icon('x', 11, 2.8)}</button>
        </div>`).join('') : `<div class="tasks-empty">${icon('calendar-check', 22, 1.8)}<span>${esc(t('noTasks'))}</span></div>`}
      </div>
      <div class="day-foot">
        <form class="task-add" data-form="task">
          <input name="title" maxlength="200" placeholder="${esc(t('taskPlaceholder'))}" autocomplete="off" dir="auto">
          <input name="time" type="time" title="${esc(t('timeOpt'))}">
          <button class="tadd" type="submit">${icon('plus', 15, 2.6)}</button>
        </form>
        ${dayTasks.length ? `<span class="t-dim tasks-left">${left ? esc(t('tasksLeft', { n: ctx.i.digits(left) })) : esc(t('allDone'))}</span>` : ''}
      </div>
    </div>
  </div>`;
}

// ------------------------------------------------------------------ gaming mode
function gmLibHtml(d, ctx) {
  const t = ctx.i.t;
  const g = d.gaming || {};
  const lib = d.gameLib;
  if (lib === null || lib === undefined) return `<div class="gm-lib loading">${[0, 1, 2, 3, 4, 5].map(() => '<span class="gm-game ghost"></span>').join('')}</div>`;
  const tiles = lib.map((x) => {
    const busy = g.launching === x.id;
    const face = x.icon ? `<img src="${esc(x.icon)}" alt="" draggable="false">` : `<b>${esc((x.name || '?').trim().charAt(0).toUpperCase())}</b>`;
    return `<button class="gm-game ${busy ? 'busy' : ''}" data-act="game.launch" data-arg="${esc(x.id)}" title="${esc(x.name)}" aria-label="${esc(x.name)}">${face}${busy ? `<span class="gm-ring"></span>` : ''}</button>`;
  }).join('');
  const add = `<button class="gm-game add" data-act="game.add" title="${esc(t('gmAddGame'))}" aria-label="${esc(t('gmAddGame'))}">${icon('plus', 18, 2.4)}</button>`;
  if (!lib.length) return `<div class="gm-lib empty">${add}<span class="t-dim one">${esc(t('gmLibEmpty'))}</span></div>`;
  return `<div class="gm-lib" data-gm-lib>${tiles}${add}</div>`;
}

const GM_STEP_IC = { wait: ['circle-dashed', ''], run: ['loader', 'run'], ok: ['check', 'ok'], skip: ['check', 'skip'], later: ['clock', 'later'], fail: ['x', 'fail'] };
const GM_STEPS = ['power', 'gameMode', 'close', 'memory', 'priority', 'dvr', 'rtss'];

function gmTemp(c, unit) {
  if (c === null || c === undefined || !Number.isFinite(c)) return null;
  return unit === 'f' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
}
function gmCls(v, warn, bad) { return v === null || v === undefined ? '' : v >= bad ? 'bad' : v >= warn ? 'warn' : ''; }
// right-to-left languages separate with their own comma
function gmJoin(parts, ctx) { return parts.join(ctx.i.dir() === 'rtl' ? '، ' : ' · '); }
export function gmHotkey(k) { return String(k || '').replace(/Control/g, 'Ctrl').replace(/CommandOrControl|CmdOrCtrl/g, 'Ctrl'); }
function gmGb(b) { const g = b / 1073741824; return Math.abs(g - Math.round(g)) < 0.05 ? String(Math.round(g)) : g.toFixed(g >= 10 ? 0 : 1); }

function gmStatus(g, ctx) {
  const t = ctx.i.t;
  if (!g || !g.enabled) return t('gmOff');
  if (g.game) return `${t(g.game.front ? 'gmPlaying' : 'gmBackground')} · ${g.game.title || g.game.name}`;
  if (g.opt && g.opt.running) return t('gmOptimizing');
  if (g.manual) return t('gmWaiting');
  return t('gmWatching');
}

// the live numbers (updated in place every second)
export function gmLiveHtml(d, ctx) {
  const t = ctx.i.t;
  const g = d.gaming || {};
  const m = g.metrics || {};
  const unit = d.gmTemp === 'f' ? '°F' : '°';
  const num = (v) => (v === null || v === undefined ? '–' : ctx.i.num(v));
  const tile = (label, value, sub, cls = '', big = false) => `<div class="gm-t ${big ? 'big' : ''}"><span class="gm-l">${esc(label)}</span><b class="tnum ${cls}" dir="ltr">${value}</b>${sub ? `<small class="tnum" dir="ltr">${sub}</small>` : ''}</div>`;
  const fpsOn = !!m.fpsSrc;
  const fpsCls = !fpsOn || m.fps === null ? '' : m.fps < 30 ? 'bad' : m.fps < 55 ? 'warn' : 'good';
  const ct = gmTemp(m.cpuTemp, d.gmTemp);
  const gt = gmTemp(m.gpuTemp, d.gmTemp);
  const vram = m.vram !== null && m.vram !== undefined ? `${ctx.i.digits(gmGb(m.vram))}${m.vramTotal ? `<i>/${ctx.i.digits(gmGb(m.vramTotal))}</i>` : ''}` : '–';
  const ping = m.ping === null || m.ping === undefined ? null : m.ping;
  return [
    tile('FPS', fpsOn ? num(m.fps) : '–', fpsOn && m.low1 !== null ? `${esc(t('gmLow1'))} ${num(m.low1)}` : '', fpsCls, true),
    tile(t('cpu'), `${num(m.cpu)}<i>%</i>`, ct !== null ? `${ctx.i.digits(ct)}${unit}` : '', gmCls(m.cpuTemp, 80, 90)),
    tile(t('gpu'), `${num(m.gpu)}<i>%</i>`, gt !== null ? `${ctx.i.digits(gt)}${unit}` : '', gmCls(m.gpuTemp, 78, 86)),
    tile(t('ram'), `${num(m.ram)}<i>%</i>`, m.ramUsed ? `${ctx.i.digits(gmGb(m.ramUsed))}/${ctx.i.digits(gmGb(m.ramTotal))} GB` : '', gmCls(m.ram, 88, 95)),
    tile('VRAM', vram, 'GB'),
    tile(t('gmPing'), ping === null ? '–' : ping < 0 ? '×' : `${num(ping)}<i>ms</i>`, '', ping !== null && (ping < 0 || ping >= 120) ? 'bad' : ping >= 70 ? 'warn' : ''),
  ].join('');
}

function gmStepsHtml(g, d, ctx) {
  const t = ctx.i.t;
  const run = g.opt && g.opt.steps && g.opt.steps.length ? g.opt.steps : (d.gmSteps || []).map((key) => ({ key, status: 'wait' }));
  return run.map((st) => {
    const [ic, cls] = GM_STEP_IC[st.status] || GM_STEP_IC.wait;
    let tip = t(`gmStep_${st.key}`);
    if (st.status === 'later') tip += ` · ${t('gmLater')}`;
    if (st.status === 'skip' && st.detail === 'already') tip += ` · ${t('gmAlready')}`;
    if (st.status === 'skip' && st.detail === 'none') tip += ` · ${t('gmNone')}`;
    if (st.status === 'skip' && st.detail === 'missing') tip += ` · ${t('gmRtssNotInstalled')}`;
    return `<span class="gm-step ${cls}" title="${esc(tip)}">${st.status === 'run' ? `<span class="spin-ic">${icon('loader', 12, 2.6)}</span>` : icon(ic, 12, 2.8)}<span>${esc(t(`gmS_${st.key}`))}</span></span>`;
  }).join('');
}

function gmFootHtml(g, d, ctx) {
  const t = ctx.i.t;
  const f = g.fps || {};
  if (g.osd === 'missing') {
    return `<div class="gm-foot warn">${icon('triangle-alert', 13, 2.4)}<span class="one">${esc(t('gmRtssMissing'))}</span>
      <button class="pill xs" data-act="game.settings">${esc(t('settings'))}</button></div>`;
  }
  if (g.game && g.fullscreen && g.hud && g.osd === 'off') {
    return `<div class="gm-foot warn">${icon('triangle-alert', 13, 2.4)}<span class="one">${esc(t('gmFsHint'))}</span>
      <button class="pill xs" data-act="game.settings">${esc(t('gmGuideBtn'))}</button></div>`;
  }
  if (d.gmNote) return `<div class="gm-foot ${d.gmNote.ok ? 'ok' : 'warn'}">${icon(d.gmNote.ok ? 'shield-check' : 'triangle-alert', 13, 2.4)}<span class="one">${esc(t(d.gmNote.key))}</span></div>`;
  if (g.candidate && g.candidate.name && !g.game) {
    return `<div class="gm-foot ask">${icon('gamepad-2', 13, 2.2)}<span class="one" dir="auto">${esc(t('gmIsGame', { name: g.candidate.title || g.candidate.name }))}</span>
      <button class="pill xs accent" data-act="game.mark" data-arg="${esc(g.candidate.name)}">${esc(t('gmYes'))}</button></div>`;
  }
  if (f.etw === 'denied' && !f.rtss) {
    return `<div class="gm-foot warn">${icon('triangle-alert', 13, 2.4)}<span class="one">${esc(t('gmFpsDenied'))}</span>
      <button class="pill xs" data-act="game.allowFps">${icon('shield-check', 12, 2.4)} ${esc(t('gmAllow'))}</button></div>`;
  }
  const s = (g.sessions || [])[0];
  if (!s) return `<div class="gm-foot t-dim">${icon('history', 13, 2.2)}<span class="one">${esc(t('gmNoSessions'))}</span></div>`;
  const bits = [ctx.i.duration(s.dur)];
  if (s.avgFps) bits.push(`${ctx.i.num(s.avgFps)} FPS`);
  if (s.low1) bits.push(`${t('gmLow1')} ${ctx.i.num(s.low1)}`);
  return `<div class="gm-foot sess" title="${esc(`${t('gmLast')}: ${s.title || s.name} · ${bits.join(' · ')}`)}">${icon('history', 13, 2.2)}<span class="one"><b dir="auto">${esc(s.title || s.name)}</b>
    <span class="t-dim tnum"> ${ctx.i.dir() === 'rtl' ? '، ' : '· '}${gmJoin(bits.map((b) => `<bdi>${esc(b)}</bdi>`), ctx)}</span></span></div>`;
}

function gamingTab(d, ctx) {
  const t = ctx.i.t;
  const g = d.gaming || {};
  if (!g.enabled) {
    return `<div class="empty-state">${icon('gamepad-2', 30, 1.8)}<span>${esc(t('gmTitle'))} · ${esc(t('gmOff'))}</span>
      <button class="pill accent" data-act="game.settings">${icon('settings', 14, 2.2)} ${esc(t('gmTurnOn'))}</button></div>`;
  }
  const running = g.opt && g.opt.running;
  const done = !running && g.optimized;
  const on = g.active;
  let btn;
  if (running) btn = `<button class="gm-go busy" disabled><span class="spin-ic">${icon('loader', 18, 2.4)}</span><span>${esc(t('gmOptimizing'))}</span></button>`;
  else if (done) {
    const extra = [];
    if (g.opt && g.opt.freed > 64 * 1048576) extra.push(t('gmFreed', { n: ctx.i.bytes(g.opt.freed) }));
    if (g.opt && g.opt.closed) extra.push(t('gmClosedN', { n: ctx.i.num(g.opt.closed) }));
    btn = `<div class="gm-go done"><span class="gm-go-ic">${icon('check', 17, 3)}</span><span class="gm-go-t"><b>${esc(t('gmOptimized'))}</b>${extra.length ? `<small>${esc(gmJoin(extra, ctx))}</small>` : ''}</span>
      <button class="gm-undo" data-act="game.restore">${icon('undo-2', 13, 2.4)} ${esc(t('gmUndo'))}</button></div>`;
  } else btn = `<button class="gm-go" data-act="game.optimize"><span class="gm-go-ic">${icon('rocket', 18, 2.2)}</span><span class="gm-go-t"><b>${esc(t('gmOptimize'))}</b><small>${esc(t('gmTip'))}</small></span></button>`;
  return `<div class="gm">
    <div class="gm-card gm-main">
      <div class="gm-head">
        <span class="gm-badge ${on ? 'on' : ''}">${icon('gamepad-2', 18, 2.2)}</span>
        <div class="gm-meta"><b>${esc(t('gmTitle'))}</b><span class="one" dir="auto">${esc(gmStatus(g, ctx))}</span></div>
        ${g.game ? `<button class="ib xs" data-act="game.end" title="${esc(t('gmEnd'))}">${icon('x', 14, 2.4)}</button>` : ''}
        <button class="gm-sw ${on ? 'on' : ''}" data-act="game.toggle" role="switch" aria-checked="${on ? 'true' : 'false'}" title="${esc(t('gmTitle'))}"><i></i></button>
      </div>
      ${gmLibHtml(d, ctx)}
      ${btn}
      <div class="gm-steps">${gmStepsHtml(g, d, ctx)}</div>
    </div>
    <div class="gm-card gm-side">
      <div class="gm-live" data-gm-live></div>
      ${gmFootHtml(g, d, ctx)}
      <div class="gm-actions">
        <button class="gm-bar ${g.hud ? 'on' : ''}" data-act="game.hud" title="${esc(t('gmShortcutHint', { k: gmHotkey(d.gmHotkey) }))}">${icon(g.hud ? 'eye' : 'eye-off', 14, 2.2)}<span class="one">${esc(t(g.osd === 'on' ? 'gmBarRtss' : 'gmBar'))}</span>${d.gmHotkey ? `<kbd dir="ltr">${esc(gmHotkey(d.gmHotkey))}</kbd>` : ''}</button>
        <button class="ib xs" data-act="game.settings" title="${esc(t('settings'))}">${icon('settings', 15)}</button>
      </div>
    </div>
  </div>`;
}

// shown while a game from the library starts
export const gameLaunch = {
  name: 'gameLaunch',
  size() { return { w: 330, h: 52 }; },
  key(d, ctx) { return `glaunch:${d.id}:${d.ok}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    const face = d.icon ? `<img src="${esc(d.icon)}" alt="">` : icon('gamepad-2', 18, 2.2);
    return h(`<div class="hud glaunch ${d.ok === false ? 'fail' : ''}" dir="${ctx.i.dir()}">
      <span class="gl-ic">${face}</span>
      <span class="gl-t one" dir="auto">${esc(t(d.ok === false ? 'gmLaunchFail' : 'gmLaunching', { name: d.name }))}</span>
      ${d.ok === false ? icon('triangle-alert', 16, 2.4) : `<span class="spin-ic">${icon('loader', 16, 2.4)}</span>`}
    </div>`);
  },
};

// shown once when a game closes
export const gameSummary = {
  name: 'gameSummary',
  size() { return { w: 470, h: 96, r: 40 }; },
  key(d, ctx) { return `gsum:${d.id}:${ctx.i.lang()}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    const unit = d.temp === 'f' ? '°F' : '°';
    const cell = (label, value, cls = '') => `<div class="gs-c"><span>${esc(label)}</span><b class="tnum ${cls}" dir="ltr">${value}</b></div>`;
    const peak = Math.max(d.maxCpuTemp || 0, d.maxGpuTemp || 0);
    const cells = [cell(t('gmPlayTime'), ctx.i.duration(d.dur))];
    if (d.avgFps) cells.push(cell(t('gmAvgFps'), ctx.i.num(d.avgFps), 'acc'));
    if (d.low1) cells.push(cell(t('gmLow1'), ctx.i.num(d.low1)));
    if (peak) cells.push(cell(t('gmPeak'), `${ctx.i.digits(gmTemp(peak, d.temp))}${unit}`, peak >= 88 ? 'bad' : peak >= 80 ? 'warn' : ''));
    return h(`<div class="gsum" dir="${ctx.i.dir()}">
      <span class="gs-ic">${icon('trophy', 22, 2)}</span>
      <div class="gs-meta"><div class="gs-title"><span class="t-dim">${esc(t('gmSessionEnded'))} ·</span> <bdi>${esc(d.title || d.name)}</bdi></div>
        <div class="gs-row">${cells.join('')}</div></div>
      <button class="cbtn sm gray" data-act="gsum.close" title="${esc(t('dismiss'))}">${icon('x', 18, 2.6)}</button>
    </div>`);
  },
};

const TAB_RENDER = { home: homeTab, alerts: alertsTab, apps: appsTab, planner: plannerTab, weather: weatherTab, tools: toolsTab, gaming: gamingTab, shelf: shelfTab, clipboard: clipboardTab };

function tabKey(d) {
  switch (d.tab) {
    case 'home': {
      const lay = HL.normalize(d.home);
      const tk = lay.some((r) => r.t === 'tasks') ? JSON.stringify(todayTasks(d).map((x) => [x.id, x.done, x.time, x.title, x.color])) + new Date().toDateString() : '';
      return `home:${d.media ? `${d.media.artKey}:${d.media.art ? 1 : 0}` : 'none'}:${(d.shortcuts || []).map((s) => s.id + (s.icon ? 1 : 0) + (s.glyph || '') + (s.color || '')).join(',')}:${d.weather && d.weather.updatedAt}:${widgetList(d).length}:${JSON.stringify(lay)}:${d.homeEdit ? 1 : 0}:${d.homeNew || ''}:${tk}`;
    }
    case 'planner': return `plan:${d.planner.ym.y}-${d.planner.ym.m}:${d.planner.sel}:${JSON.stringify((d.tasks || []).map((x) => [x.id, x.done, x.date, x.time, x.title, x.color, x.updated]))}:${new Date().toDateString()}`;
    case 'alerts': return `alerts:${(d.notifHistory || []).map((n) => n.id).join('|').length}:${(d.notifHistory || []).length}:${(d.notifHistory || [])[0] ? d.notifHistory[0].id : ''}:${(d.notifHistory || []).filter((n) => n.avatar || n.appIcon).length}`;
    case 'apps': return `apps:${d.deckSize}:${(d.shortcuts || []).map((s) => [s.id, s.icon ? 1 : 0, s.name, s.kind, s.glyph || '', s.color || '', s.size || ''].join('~')).join(',')}`;
    case 'weather': return `wx:${d.weather ? (d.weather.updatedAt || (d.weather.error ? 'err' : '')) : 'none'}`;
    case 'shelf': return `shelf:${(d.shelf || []).map((f) => f.path).join('|')}:${d.phoneDevice ? 1 : 0}`;
    case 'tools': { const p = d.phoneDevice; return `tools:${JSON.stringify(d.sharedTimers || [])}:${p ? `${p.id}:${p.wifi ? 1 : 0}${p.bluetooth ? 1 : 0}${p.island ? 1 : 0}` : ''}`; }
    case 'clipboard': return `clip:${(d.clipHistory || []).map((c) => c.id).join('|')}:${Math.floor(Date.now() / 60000)}`;
    case 'gaming': {
      const g = d.gaming || {};
      return `game:${JSON.stringify([g.enabled, g.active, g.manual, g.game, g.candidate, g.opt, g.optimized, g.hud, g.osd, g.fullscreen, g.launching, g.fps && g.fps.etw, g.fps && g.fps.rtss, (g.sessions || [])[0], d.gmHotkey, d.gmSteps, d.gmNote, d.gameLib ? d.gameLib.map((x) => x.id + (x.icon ? 1 : 0)).join('|') : null])}`;
    }
    default: return d.tab;
  }
}

function phoneChip(d, ctx) {
  const p = d.phoneDevice;
  if (!p) return '';
  const bat = p.battery !== null && p.battery !== undefined ? `${ctx.i.num(p.battery)}%` : '';
  return `<button class="phone-chip ${p.charging ? 'chg' : ''}" data-act="phone.find" title="${esc(ctx.i.t('ringPhone'))} · ${esc(p.name)}">
    ${icon('smartphone', 13, 2.4)}<span class="tnum" dir="ltr">${bat}</span>${p.charging ? icon('zap', 10, 0, '', true) : ''}</button>`;
}

export const dashboard = {
  name: 'dashboard',
  size() { return { w: 664, h: 296, r: 48 }; },
  key(d, ctx) { return `dash:${ctx.i.lang()}:${d.phoneDevice ? d.phoneDevice.id : ''}`; },
  render(d, ctx) {
    const t = ctx.i.t;
    const el = h(`<div class="dash" dir="${ctx.i.dir()}">
      <div class="dash-top" data-s>
        <div class="dash-side">
          <button class="ib sm" data-act="action" data-arg="settings" title="${esc(t('settings'))}">${icon('settings', 16)}</button>
          <span data-phone-chip>${phoneChip(d, ctx)}</span>
        </div>
        <div class="tabs">
          <div class="tab-hl"></div>
          ${TABS.map(([k, ic]) => `<button class="tab" data-act="tab" data-arg="${k}" title="${esc(t(k))}">${icon(ic, 15, 2.2)}<span>${esc(t(k))}</span></button>`).join('')}
        </div>
        <div class="dash-side end">
          <button class="ib sm home-edit" data-act="home.edit" title="${esc(t('editLayout'))}">${icon('layout-dashboard', 15)}</button>
          <button class="ib sm" data-act="minimize" title="${esc(t('minimize'))}">${icon('minimize-2', 15)}</button>
          <button class="ib sm pin ${d.pinned ? 'on' : ''}" data-act="pin" title="${esc(t(d.pinned ? 'unpin' : 'pin'))}">${icon(d.pinned ? 'pin-off' : 'pin', 16)}</button>
        </div>
      </div>
      <div class="dash-body" data-s></div>
    </div>`);
    el.querySelector('.dash-top').insertAdjacentHTML('beforeend', '<div class="edit-bar" data-edit-bar></div>');
    dashboard.update(el, d, ctx);
    return el;
  },
  update(el, d, ctx) {
    el.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.arg === d.tab));
    const active = el.querySelector(`.tab[data-arg="${d.tab}"]`);
    const hl = el.querySelector('.tab-hl');
    if (active && hl) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        hl.style.width = `${active.offsetWidth}px`;
        hl.style.transform = `translateX(${active.offsetLeft}px)`;
      }));
    }
    const editing = d.tab === 'home' && !!d.homeEdit;
    el.classList.toggle('editing', editing);
    el.dataset.tab = d.tab;
    const eb = el.querySelector('[data-edit-bar]');
    if (eb) { const html = editing ? editBarHtml(d, ctx) : ''; if (eb.dataset.html !== html) { eb.dataset.html = html; eb.innerHTML = html; } }
    const pin = el.querySelector('.pin');
    if (pin) pin.classList.toggle('on', !!d.pinned);
    const chip = el.querySelector('[data-phone-chip]');
    if (chip) { const html = phoneChip(d, ctx); if (chip.dataset.html !== html) { chip.dataset.html = html; chip.innerHTML = html; } }

    const body = el.querySelector('.dash-body');
    const key = tabKey(d) + ctx.i.lang();
    if (body.dataset.key !== key) {
      const switching = body.dataset.tab && body.dataset.tab !== d.tab;
      body.dataset.key = key;
      body.dataset.tab = d.tab;
      body.innerHTML = TAB_RENDER[d.tab](d, ctx);
      if (switching) {
        body.animate([{ opacity: 0, transform: 'translateY(6px) scale(.985)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
          { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    }

    if (d.tab === 'gaming') {
      const live = body.querySelector('[data-gm-live]');
      if (live) { const html = gmLiveHtml(d, ctx); if (live.dataset.html !== html) { live.dataset.html = html; live.innerHTML = html; } }
    }
    if (d.tab === 'home') {
      bind(body, 'clock', ctx.i.clock());
      const st = body.querySelector('[data-sys]');
      if (st) {
        const html = sysHtml(d, ctx);
        if (st.dataset.html !== html) { st.dataset.html = html; st.innerHTML = html; }
      }
      const wc = body.querySelector('[data-widget]');
      if (wc) {
        const html = widgetHtml(d, ctx);
        if (wc.dataset.html !== html) {
          const sc = wc.querySelector('.news');
          const top = sc ? sc.scrollTop : 0;
          const same = wc.dataset.active === d.widgetActive;
          wc.dataset.html = html;
          wc.dataset.active = d.widgetActive;
          wc.innerHTML = html;
          const sc2 = wc.querySelector('.news');
          if (sc2 && same) sc2.scrollTop = top;
          if (!same && wc.dataset.shown) wc.querySelector('.w-body').classList.add('w-in');
          wc.dataset.shown = '1';
        }
      }
      body.querySelectorAll('[data-solo]').forEach((sc) => {
        const html = soloHtml(sc.dataset.solo, d, ctx);
        if (sc.dataset.html === html) return;
        const old = sc.querySelector('.news');
        const top = old ? old.scrollTop : 0;
        sc.dataset.html = html;
        sc.innerHTML = html;
        const now = sc.querySelector('.news');
        if (now) now.scrollTop = top;
      });
      const m = d.media;
      if (m) {
        const fill = body.querySelector('.mini-player .prog-fill');
        const knob = body.querySelector('.mini-player .prog-knob');
        const pos = d.seekPreview !== null && d.seekPreview !== undefined ? d.seekPreview : mediaPos(m);
        const p = m.duration > 0 ? clamp(pos / m.duration, 0, 1) : 0;
        if (fill) fill.style.width = `${(p * 100).toFixed(2)}%`;
        if (knob) knob.style.left = `${p * 100}%`;
        bind(body, 'mpel', ctx.i.duration(pos));
        bind(body, 'mprem', m.duration > 0 ? `-${ctx.i.duration(m.duration - pos)}` : '');
        const pp = body.querySelector('.mini-player [data-act="media.toggle"]');
        const want = m.status === 'playing' ? 'pause' : 'play';
        if (pp && pp.dataset.icon !== want) { pp.dataset.icon = want; pp.innerHTML = icon(want, 24, 0, 'pp', true); }
        const mp = body.querySelector('.mini-player');
        if (mp) mp.classList.toggle('playing', m.status === 'playing');
      }
    }
  },
};

export const HOME = HL;
export const DECK = DM;
export const VIEWS = {
  idle, handle, media, mediaMini, mediaExpanded, notification, notificationExpanded, call, callActive, callActiveExpanded, pair,
  volume, battery, keys, copied, privacy, message, drop, track, timer, timerMini, timerExpanded, timerDone, dashboard,
  findPc, received, transfer, subsMini, subsReady, subsPanel, gameSummary, gameLaunch,
};
