// Settings window (bundled to settings.js): onboarding + 11 sections, 7 languages.
import { icon } from '../island/icons.js';
import shared from '../../shared/strings.js';
import { CLOCK_ZONES, cityName } from '../island/cities.js';
import DM from '../../shared/deck-meta.js';
import SL from '../../shared/sub-langs.js';
import LINKS from '../../shared/links.js';
import { faceHtml, createBlinker, followPointer } from '../shared/blink.js';

const { strings, LANGS, langInfo } = shared;
const PARAMS = new URLSearchParams(location.search);
const api = window.islandSettings || mockApi();

let S = null;
let section = 'welcome';
let onboarding = false;
let obStep = 0;
let statusData = null;
let displays = [];
let phone = { me: null, devices: [] };
let downloadDir = '';
let btScanning = false;
let wx = null;
let shortcuts = [];
let installed = null;
let pickerOpen = false;
let pickerQuery = '';
let webForm = false;
let editKey = null;        // deck key whose editor is open
let keyForm = null;        // kind of the new-key form: hotkey | media | action | command | text
let keyDraft = { name: '', target: '', hotkey: null };
let cityResults = null;
let cityQuery = '';
let cityBusy = false;
let ipBusy = false;
let catalog = null;
let feedBusy = false;
let feedError = '';
let feedDraft = '';
let flash = '';
let subsDir = '';
let subsTests = {};          // provider -> { busy } | test result
let subsUserDraft = null;
let gm = null;               // gaming mode state from main
let gmProcs = null;          // running apps for the close list: null | 'loading' | []
let gmAllow = null;          // result of the FPS permission request
let gmLib = null;            // game library (with icons) for the settings list
let gmLibBusy = false;
const strCache = {};

const lang = () => (S && LANGS.some((l) => l.code === S.language) ? S.language : 'en');
const dir = () => langInfo(lang()).dir;
function t(k, vars) {
  const l = lang();
  if (!strCache[l]) strCache[l] = strings(l);
  let s = strCache[l][k];
  if (s === undefined) s = k;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, n) => (vars[n] !== undefined ? vars[n] : ''));
  return s;
}
const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n) => String(n);

const SECTIONS = [
  ['welcome', 'sparkles'], ['appearance', 'layout-grid'], ['modules', 'app-window'], ['notificationsNav', 'bell'],
  ['phoneNav', 'smartphone'], ['shortcutsNav', 'rocket'], ['subtitlesNav', 'captions'], ['gamingNav', 'gamepad-2'], ['widgetsNav', 'bitcoin'], ['weatherNav', 'cloud-sun'], ['behavior', 'settings'],
  ['tryit', 'play'], ['status', 'activity'], ['support', 'heart'], ['about', 'flag'],
];

const KDE_PLAY = 'https://play.google.com/store/apps/details?id=org.kde.kdeconnect_tp';
const KDE_FDROID = 'https://f-droid.org/packages/org.kde.kdeconnect_tp/';

async function save(patch, rerender = true) {
  S = await api.set(patch);
  if (rerender) render(false);
}

// ------------------------------------------------------------------ small builders
function sw(path, value) {
  return `<label class="switch"><input type="checkbox" data-path="${path}" ${value ? 'checked' : ''}><span></span></label>`;
}
function row(title, hint, control, ic, extra = '') {
  return `<div class="row ${extra}">${ic ? `<span class="row-ic">${icon(ic, 18)}</span>` : ''}<div class="row-text"><div class="row-title">${esc(title)}</div>${hint ? `<div class="row-hint">${esc(hint)}</div>` : ''}</div><div class="row-ctl">${control}</div></div>`;
}
function seg(path, value, options) {
  return `<div class="seg">${options.map(([v, label]) => `<button data-seg="${path}" data-val="${esc(v)}" class="${String(v) === String(value) ? 'on' : ''}">${esc(label)}</button>`).join('')}</div>`;
}
function range(path, value, min, max, step, fmt) {
  return `<div class="range"><input type="range" data-path="${path}" data-fmt="${path}" min="${min}" max="${max}" step="${step}" value="${value}"><output>${esc(fmt(value))}</output></div>`;
}
const FMT = {
  scale: (v) => `${num(Math.round(v * 100))}%`,
  topOffset: (v) => `${num(v)}px`,
  'notifications.duration': (v) => `${num(v)} ${t('seconds')}`,
  transparency: (v) => `${num(v)}%`,
  'gaming.hud.opacity': (v) => `${num(v)}%`,
};
// Blinkelo's face in a big black pill: it says hello the first time a page shows, then blinks on its own
function heroIsland(wide = false) {
  return `<div class="hero-island bk-hero-area"><div class="hi-pill bk-hero ${wide ? 'wide' : ''}">${faceHtml(wide ? 'bk-xl' : 'bk-lg')}</div></div>`;
}
let heroFaces = [];
function wireFaces(firstShow) {
  heroFaces.forEach((f) => { f.destroy(); if (f.unfollow) f.unfollow(); });
  heroFaces = [];
  document.querySelectorAll('#main .bk-hero .bk').forEach((el) => {
    const f = createBlinker(el, { gap: [2600, 6200] });
    const area = el.closest('.bk-hero-area');
    f.unfollow = followPointer(el, area, 1);
    if (area) area.onclick = () => { if (!f.busy) f.wink(); };
    if (firstShow) f.hello().then(() => f.start());
    else f.start();
    heroFaces.push(f);
  });
}
function langGrid(big = false) {
  return `<div class="lang-grid ${big ? 'big' : ''}">${LANGS.map((l) => `<button class="lang-tile ${S.language === l.code ? 'on' : ''}" data-setlang="${l.code}" dir="${l.dir}">
    <b>${esc(l.name)}</b><span>${esc(l.english)}</span>${S.language === l.code ? `<i class="lang-check">${icon('check', 13, 3)}</i>` : ''}</button>`).join('')}</div>`;
}

// ------------------------------------------------------------------ weather helpers
function wxKey(code) {
  const c = Number(code);
  if (c === 0) return ['wx_clear', 'sun'];
  if (c === 1) return ['wx_mostlyClear', 'sun'];
  if (c === 2) return ['wx_partlyCloudy', 'cloud-sun'];
  if (c === 3) return ['wx_cloudy', 'cloud'];
  if (c === 45 || c === 48) return ['wx_fog', 'cloud-fog'];
  if (c >= 51 && c <= 57) return ['wx_drizzle', 'cloud-drizzle'];
  if (c >= 61 && c <= 67) return ['wx_rain', 'cloud-rain'];
  if (c >= 80 && c <= 82) return ['wx_showers', 'cloud-rain'];
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return ['wx_snow', 'cloud-snow'];
  if (c >= 95) return ['wx_thunder', 'cloud-lightning'];
  return ['wx_cloudy', 'cloud'];
}

function citySearchBox() {
  let results = '';
  if (cityBusy) results = `<div class="city-results"><div class="muted pad">${esc(t('loading'))}</div></div>`;
  else if (cityResults && cityResults.error) results = `<div class="city-results"><div class="muted pad">${esc(t('weatherError'))}</div></div>`;
  else if (cityResults && !cityResults.length) results = `<div class="city-results"><div class="muted pad">${esc(t('noResults'))}</div></div>`;
  else if (cityResults) {
    results = `<div class="city-results">${cityResults.map((c, i) => `<button class="city-opt" data-city="${i}">${icon('map-pin', 15)}<span><b>${esc(c.name)}</b><small>${esc([c.admin1, c.country].filter(Boolean).join(' · '))}</small></span></button>`).join('')}</div>`;
  }
  return `<div class="city-search"><span class="search-ic">${icon('search', 16)}</span>
    <input class="text big" id="cityInput" placeholder="${esc(t('searchCity'))}" value="${esc(cityQuery)}" autocomplete="off" dir="auto"></div>${results}`;
}

function selectedCity() {
  const c = S.weather && S.weather.city;
  if (!c) return '';
  return `<div class="city-chip">${icon('map-pin', 15)}<span><b>${esc(c.name)}</b><small>${esc([c.admin1, c.country].filter(Boolean).join(' · '))}</small></span></div>`;
}

function weatherPreview() {
  if (!wx || !wx.current) return '';
  const [k, ic] = wxKey(wx.current.code);
  const unit = wx.unit === 'f' ? '°F' : '°';
  return `<div class="wx-prev">
    <span class="wx-prev-ic">${icon(ic, 34, 1.8)}</span>
    <div><div class="wx-prev-temp">${num(Math.round(wx.current.temp))}${unit}</div><div class="muted">${esc(t(k))} · ${esc(wx.city)}</div></div>
    <button class="btn sm" data-cmd="wxRefresh" title="${esc(t('refresh'))}">${icon('refresh-cw', 15)}</button>
  </div>`;
}

// ------------------------------------------------------------------ phone helpers
function deviceRow(d) {
  let state; let cls; let actions = '';
  if (d.pairState === 'requestedByPeer') {
    state = t('pairRequest', { name: d.name }); cls = 'wait';
    actions = `<button class="btn sm" data-phone="reject" data-id="${esc(d.id)}">${icon('x', 14, 2.4)} ${esc(t('rejectPair'))}</button>
      <button class="btn sm green" data-phone="accept" data-id="${esc(d.id)}">${icon('check', 14, 2.6)} ${esc(t('acceptPair'))}</button>`;
  } else if (d.pairState === 'requested') {
    state = t('waitingPhone'); cls = 'wait';
  } else if (d.paired) {
    state = `${t('pairedState')} · ${d.connected ? t('connectedState') : t('offlineState')}`; cls = d.connected ? 'ok' : 'off';
    actions = `${d.connected ? `<button class="btn sm" data-phone="sendFile" data-id="${esc(d.id)}" title="${esc(t('sendFile'))}">${icon('upload', 15)}</button>
      <button class="btn sm" data-phone="find" data-id="${esc(d.id)}" title="${esc(t('ringPhone'))}">${icon('bell-ring', 15)}</button>` : ''}
      <button class="btn sm danger" data-phone="unpair" data-id="${esc(d.id)}">${esc(t('unpair'))}</button>`;
  } else {
    state = `${t('notPaired')}${d.connected ? '' : ` · ${t('offlineState')}`}`; cls = 'off';
    if (d.connected) actions = `<button class="btn sm accent" data-phone="pair" data-id="${esc(d.id)}">${icon('link', 14, 2.4)} ${esc(t('pair'))}</button>`;
  }
  const code = d.verifyKey && d.pairState !== 'paired' ? `<span class="code" dir="ltr">${esc(d.verifyKey.slice(0, 4))} ${esc(d.verifyKey.slice(4))}</span>` : '';
  const bat = d.paired && d.battery !== undefined && d.battery !== null
    ? `<span class="dev-bat ${d.charging ? 'chg' : ''}" dir="ltr">${icon(d.charging ? 'battery-charging' : 'battery-medium', 15)} ${num(d.battery)}%</span>` : '';
  return `<div class="row dev">
    <span class="row-ic dev-ic ${cls}">${icon(d.type === 'tablet' ? 'monitor' : 'smartphone', 18)}<i class="dev-dot ${cls}"></i></span>
    <div class="row-text"><div class="row-title">${esc(d.name)} ${bat}${d.island ? `<span class="tag-island">${esc(t('islandApp'))}</span>` : ''}</div><div class="row-hint">${esc(state)} ${code}${d.wifi && d.address ? ` · <span class="dev-via">${icon('wifi', 12)} <span dir="ltr">${esc(d.address)}</span></span>` : (!d.bluetooth && d.address ? ` · <span dir="ltr">${esc(d.address)}</span>` : '')}${d.bluetooth ? ` · <span class="dev-via">${icon('bluetooth', 12)} ${esc(t('viaBluetooth'))}</span>` : ''}</div></div>
    <div class="row-ctl btn-row">${actions}</div>
  </div>`;
}

function phoneFeatures() {
  const P = S.phone || {};
  const dir = downloadDir || '';
  return `<div class="card"><div class="card-head"><h3>${icon('sparkles', 17)} ${esc(t('phoneFeatures'))}</h3></div>
    ${row(t('btLink'), t('btLinkHint'), sw('phone.bluetooth', P.bluetooth !== false), 'bluetooth')}
    ${row(t('remoteInput'), t('remoteInputHint'), sw('phone.remoteInput', P.remoteInput !== false), 'mouse-pointer-2')}
    ${row(t('sharedClipboard'), t('sharedClipboardHint'), sw('phone.clipboard', P.clipboard !== false), 'clipboard')}
    ${P.clipboard !== false ? row(t('clipImages'), '', sw('phone.clipboardImages', P.clipboardImages !== false), 'image', 'sub') : ''}
    ${row(t('forwardNotifs'), '', sw('phone.forwardNotifications', P.forwardNotifications !== false), 'bell')}
    ${row(t('openLinks'), '', sw('phone.openLinks', P.openLinks !== false), 'link')}
    ${row(t('cameraToClip'), '', sw('phone.cameraToClipboard', P.cameraToClipboard !== false), 'camera')}
    <div class="row"><span class="row-ic">${icon('folder-open', 18)}</span>
      <div class="row-text"><div class="row-title">${esc(t('downloadFolder'))}</div><div class="row-hint ell" dir="ltr">${esc(dir)}</div></div>
      <div class="row-ctl btn-row"><button class="btn sm" data-phone="openDownloads">${esc(t('openFolder'))}</button><button class="btn sm" data-phone="pickDownloadDir">${esc(t('change'))}</button></div></div>
  </div>`;
}

function commandsCard() {
  const list = (S.phone && S.phone.commands) || [];
  return `<div class="card"><div class="card-head"><h3>${icon('terminal', 17)} ${esc(t('customCommands'))}</h3></div>
    <div class="row-hint pad-hint">${esc(t('customCommandsHint'))}</div>
    ${list.length ? list.map((c) => `<div class="row cmd-row"><span class="row-ic">${icon('zap', 16)}</span>
      <div class="row-text"><div class="row-title">${esc(c.name)}</div><div class="row-hint ell" dir="ltr">${esc(c.command)}</div></div>
      <div class="row-ctl"><button class="btn sm icon danger" data-cmdrm="${esc(c.id)}" title="${esc(t('remove'))}">${icon('trash-2', 14)}</button></div></div>`).join('')
    : `<div class="empty small">${esc(t('noCommands'))}</div>`}
    <form class="cmd-form" id="cmdForm"><input class="text" id="cmdName" placeholder="${esc(t('cmdName'))}" maxlength="40" dir="auto">
      <input class="text" id="cmdCommand" placeholder="${esc(t('cmdCommand'))} — explorer shell:Downloads" maxlength="400" dir="ltr">
      <button class="btn sm accent" type="submit">${icon('plus', 14, 2.4)} ${esc(t('addCommand'))}</button></form>
  </div>`;
}

function phoneSteps() {
  return `<ol class="steps">
    <li><span class="step-n">${num(1)}</span><div>${esc(t('phoneStep1'))}
      <div class="btns tight"><button class="btn sm" data-url="${KDE_PLAY}">${icon('download', 14)} Google Play</button><button class="btn sm" data-url="${KDE_FDROID}">${icon('download', 14)} F-Droid</button></div></div></li>
    <li><span class="step-n">${num(2)}</span><div>${esc(t('phoneStep2'))}</div></li>
    <li><span class="step-n">${num(3)}</span><div>${esc(t('phoneStep3'))}</div></li>
  </ol>`;
}

function deviceList() {
  const list = (phone.devices || []).slice().sort((a, b) => (b.paired - a.paired) || (b.connected - a.connected));
  const me = phone.me;
  return `<div class="card">
    <div class="card-head"><h3>${icon('smartphone', 17)} ${esc(t('devices'))}</h3>
      <div class="btn-row">${S.phone && S.phone.bluetooth !== false ? `<button class="btn sm ${btScanning ? 'on' : ''}" data-phone="btScan" title="${esc(t('btSearchHint'))}">${icon('bluetooth', 14)} ${esc(t(btScanning ? 'btSearching' : 'btSearch'))}</button>` : ''}
      <button class="btn sm" data-phone="refresh">${icon('refresh-cw', 14)} ${esc(t('refresh'))}</button></div></div>
    ${list.length ? list.map(deviceRow).join('') : `<div class="empty"><span class="radar">${icon('radar', 26, 1.8)}</span><span>${esc(t('noDevices'))}</span></div>`}
    <div class="row ip-row">
      <span class="row-ic">${icon('wifi', 18)}</span>
      <div class="row-text"><div class="row-title">${esc(t('addByIp'))}</div>
      ${me ? `<div class="row-hint">${esc(t('thisPc'))}: <b>${esc(me.name)}</b> · <span dir="ltr">${esc((me.ips || []).join(', '))}${me.port ? `:${me.port}` : ''}</span></div>` : ''}</div>
      <div class="row-ctl btn-row"><input class="text ip" id="ipInput" placeholder="192.168.1.20" dir="ltr"><button class="btn sm" data-phone="connectIp" ${ipBusy ? 'disabled' : ''}>${icon('link', 14)}</button></div>
    </div>
  </div>`;
}

// ------------------------------------------------------------------ shortcuts helpers
function scIcon(s, size = 28) {
  if (s.icon) return `<img class="sc-img" src="${esc(s.icon)}" alt="" style="width:${size}px;height:${size}px">`;
  if (s.kind === 'url') return `<span class="sc-ph url" style="width:${size}px;height:${size}px">${icon('globe', Math.round(size * 0.6))}</span>`;
  return `<span class="sc-ph" style="width:${size}px;height:${size}px">${esc((s.name || '?').trim()[0] || '?')}</span>`;
}

// ------------------------------------------------------------------ deck (keys) helpers
const cap = (k) => k[0].toUpperCase() + k.slice(1);
function keyPreview(s, size = 38) {
  const look = DM.keyLook(s);
  const inner = s.icon ? `<img src="${esc(s.icon)}" alt="">` : look.glyph ? icon(look.glyph, Math.round(size * 0.5), 2) : `<b>${esc((s.name || '?').trim()[0] || '?')}</b>`;
  return `<span class="dkp ${look.color ? 'tint' : ''}" style="width:${size}px;height:${size}px;${look.color ? `--kc:${look.color}` : ''}">${inner}</span>`;
}

function keyHint(s) {
  if (s.kind === 'hotkey') return `${t('keyHotkey')} · ${s.target}`;
  if (s.kind === 'media') { const m = DM.MEDIA.find((x) => x[0] === s.target); return `${t('keyMedia')} · ${m ? t(m[2]) : s.target}`; }
  if (s.kind === 'action') return `${t('keyAction')} · ${t(s.target)}`;
  if (s.kind === 'command') return `${t('keyCommand')} · ${s.target}`;
  if (s.kind === 'text') return `${t('keyText')} · ${s.target}`;
  return s.target || '';
}

function keyEditor(s) {
  const look = DM.keyLook(s);
  const id = esc(s.id);
  return `<div class="key-edit">
    <div class="ke-row"><label>${esc(t('keyName'))}</label><input class="text" id="keyRename" data-keyname="${id}" value="${esc(s.name)}" maxlength="60" dir="auto"></div>
    <div class="ke-row"><label>${esc(t('keySize'))}</label><div class="seg">${DM.SIZES.map((z) => `<button data-keyset="size" data-id="${id}" data-val="${z}" class="${look.size === z ? 'on' : ''}"><i class="sz sz-${z}"></i><span dir="ltr">${z.replace('x', '×')}</span></button>`).join('')}</div></div>
    <div class="ke-row"><label>${esc(t('keyColor'))}</label><div class="swatches">
      <button class="swatch none ${s.color ? '' : 'on'}" data-keyset="color" data-id="${id}" data-val="" title="${esc(t('keyAuto'))}"></button>
      ${DM.COLORS.map((c) => `<button class="swatch ${s.color === c ? 'on' : ''}" data-keyset="color" data-id="${id}" data-val="${c}" style="--c:${c}"></button>`).join('')}</div></div>
    <div class="ke-row top"><label>${esc(t('keyIcon'))}</label><div class="glyphs">
      <button class="glyph auto ${s.glyph ? '' : 'on'}" data-keyset="glyph" data-id="${id}" data-val="">${esc(t('keyAuto'))}</button>
      ${DM.GLYPHS.map((g) => `<button class="glyph ${s.glyph === g ? 'on' : ''}" data-keyset="glyph" data-id="${id}" data-val="${g}">${icon(g, 16)}</button>`).join('')}</div></div>
  </div>`;
}

function shortcutList() {
  if (!shortcuts.length) return `<div class="empty">${icon('layout-grid', 26, 1.8)}<span>${esc(t('appsEmpty'))}</span></div>`;
  return shortcuts.map((s, i) => `<div class="row sc-row ${editKey === s.id ? 'open' : ''}">
    ${keyPreview(s)}
    <div class="row-text"><div class="row-title">${esc(s.name)}</div><div class="row-hint ell" dir="${DM.KEY_KINDS.includes(s.kind) ? 'auto' : 'ltr'}">${esc(keyHint(s))}</div></div>
    <div class="row-ctl btn-row">
      <button class="btn sm icon" data-sc="launch" data-id="${esc(s.id)}" title="${esc(t('open'))}">${icon('play', 13, 0, '', true)}</button>
      <button class="btn sm icon ${editKey === s.id ? 'on' : ''}" data-sc="edit" data-id="${esc(s.id)}" title="${esc(t('keyEdit'))}">${icon('pencil', 14)}</button>
      <button class="btn sm icon" data-sc="up" data-id="${esc(s.id)}" ${i === 0 ? 'disabled' : ''}>${icon('arrow-up', 15)}</button>
      <button class="btn sm icon" data-sc="down" data-id="${esc(s.id)}" ${i === shortcuts.length - 1 ? 'disabled' : ''}>${icon('arrow-down', 15)}</button>
      <button class="btn sm icon danger" data-sc="remove" data-id="${esc(s.id)}" title="${esc(t('remove'))}">${icon('trash-2', 15)}</button>
    </div></div>${editKey === s.id ? keyEditor(s) : ''}`).join('');
}

function keyFormHtml() {
  if (!keyForm) return '';
  const kinds = [['hotkey', 'keyboard'], ['media', 'music'], ['action', 'zap'], ['command', 'terminal'], ['text', 'file-text']];
  let body;
  if (keyForm === 'media') {
    body = `<div class="key-choices">${DM.MEDIA.map(([k, ic, label]) => `<button class="btn" data-keyadd="media" data-val="${k}">${icon(ic, 15)} ${esc(t(label))}</button>`).join('')}</div>`;
  } else if (keyForm === 'action') {
    body = `<div class="key-choices">${DM.ACTIONS.map(([k, ic]) => `<button class="btn" data-keyadd="action" data-val="${k}">${icon(ic, 15)} ${esc(t(k))}</button>`).join('')}</div>`;
  } else {
    const field = keyForm === 'hotkey'
      ? `<button type="button" class="btn kbd-rec ${keyDraft.hotkey ? 'set' : ''}" id="keyRec" dir="ltr">${keyDraft.hotkey ? esc(keyDraft.hotkey.label) : `${icon('keyboard', 15)} ${esc(t('keyRecord'))}`}</button>`
      : `<input class="text grow" id="keyTarget" name="target" placeholder="${esc(t(keyForm === 'command' ? 'keyCommandPh' : 'keyTextPh'))}" value="${esc(keyDraft.target)}" dir="${keyForm === 'command' ? 'ltr' : 'auto'}" maxlength="${keyForm === 'command' ? 500 : 2000}" autocomplete="off">`;
    body = `<form class="web-form flat" id="keyForm">
      <input class="text" id="keyName" name="name" placeholder="${esc(t('keyName'))}" value="${esc(keyDraft.name)}" dir="auto" maxlength="60" autocomplete="off">
      ${field}
      <button class="btn accent" type="submit">${icon('plus', 14, 2.4)} ${esc(t('add'))}</button>
    </form>`;
  }
  return `<div class="key-form">
    <div class="seg wrap">${kinds.map(([k, ic]) => `<button data-keykind="${k}" class="${keyForm === k ? 'on' : ''}">${icon(ic, 14)} ${esc(t(`key${cap(k)}`))}</button>`).join('')}</div>
    ${body}</div>`;
}

// Captures a key combination for a hotkey key: modifier bits (ctrl 1, alt 2, shift 4, win 8) + Windows virtual key.
function recordHotkey(btn) {
  btn.textContent = t('pressKeys');
  btn.classList.add('rec');
  const onKey = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(ev.key)) return;
    document.removeEventListener('keydown', onKey, true);
    const mods = (ev.ctrlKey ? 1 : 0) | (ev.altKey ? 2 : 0) | (ev.shiftKey ? 4 : 0) | (ev.metaKey ? 8 : 0);
    if (ev.key === 'Escape' && !mods) { render(false); return; }
    const names = [];
    if (ev.ctrlKey) names.push('Ctrl');
    if (ev.altKey) names.push('Alt');
    if (ev.shiftKey) names.push('Shift');
    if (ev.metaKey) names.push('Win');
    // the physical key name keeps the label readable on non-Latin layouts
    let key = /^(Key|Digit)/.test(ev.code || '') ? ev.code.replace(/^(Key|Digit)/, '') : (ev.key === ' ' ? 'Space' : (ev.key.length === 1 ? ev.key.toUpperCase() : ev.key.replace(/^Arrow/, '')));
    if (!key) key = `VK ${ev.keyCode}`;
    if (ev.keyCode > 0 && ev.keyCode < 255) keyDraft.hotkey = { vk: ev.keyCode, mods, label: [...names, key].join('+') };
    render(false);
  };
  document.addEventListener('keydown', onKey, true);
}

function pickerHtml() {
  if (!pickerOpen) return '';
  let body;
  if (!installed) body = `<div class="muted pad">${esc(t('loading'))}</div>`;
  else {
    const q = pickerQuery.trim().toLowerCase();
    const list = installed.filter((a) => !q || a.name.toLowerCase().includes(q)).slice(0, 300);
    body = list.length ? `<div class="app-grid">${list.map((a) => {
      const idx = installed.indexOf(a);
      const added = shortcuts.some((s) => s.target === a.target);
      return `<button class="app-pick ${added ? 'added' : ''}" data-pick="${idx}" title="${esc(a.target)}" ${added ? 'disabled' : ''}>
        <span class="app-pick-ic" data-icon-idx="${idx}">${a.icon ? `<img src="${esc(a.icon)}" alt="">` : `<span class="sc-ph">${esc(a.name[0] || '?')}</span>`}</span>
        <span class="app-pick-name">${esc(a.name)}</span>${added ? `<i>${icon('check', 12, 3)}</i>` : ''}</button>`;
    }).join('')}</div>` : `<div class="muted pad">${esc(t('noResults'))}</div>`;
  }
  return `<div class="picker">
    <div class="city-search"><span class="search-ic">${icon('search', 16)}</span><input class="text big" id="appSearch" placeholder="${esc(t('searchApps'))}" value="${esc(pickerQuery)}" autocomplete="off" dir="auto"></div>
    <div class="picker-body">${body}</div></div>`;
}

function webFormHtml() {
  if (!webForm) return '';
  return `<form class="web-form" id="webForm">
    <input class="text" name="name" placeholder="${esc(t('websiteName'))}" dir="auto" required>
    <input class="text" name="url" placeholder="${esc(t('websiteUrl'))}" dir="ltr" required>
    <button class="btn accent" type="submit">${icon('plus', 14, 2.4)} ${esc(t('add'))}</button>
    <button class="btn" type="button" data-cmd="webCancel">${esc(t('cancel'))}</button>
  </form>`;
}


// ------------------------------------------------------------------ widgets helpers
const LIMITS = { coin: 8, feed: 6, zone: 5, sublang: 3 };
function W() {
  const w = S.widgets || {};
  return {
    active: w.active || 'crypto',
    crypto: { enabled: true, source: 'auto', coins: ['BTC', 'ETH', 'USDT', 'TON'], ...(w.crypto || {}) },
    news: { enabled: true, feeds: [], custom: [], ...(w.news || {}) },
    clocks: { enabled: true, zones: ['Europe/London', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo'], ...(w.clocks || {}) },
  };
}
function activeFeeds() {
  const n = W().news;
  return n.feeds && n.feeds.length ? n.feeds : ((catalog && catalog.defaultFeeds) || []);
}
function chip(kind, val, label, on, extra = '') {
  return `<button class="chip ${on ? 'on' : ''}" data-wchip="${kind}" data-val="${esc(val)}" dir="auto">${on ? icon('check', 12, 3) : ''}<span>${esc(label)}</span>${extra}</button>`;
}
function widgetCard(key, ic, body) {
  const w = W()[key];
  return `<div class="card pad-card wcard ${w.enabled === false ? 'off' : ''}">
    <div class="card-head"><h3>${icon(ic, 17)} ${esc(t(key))}</h3>${sw(`widgets.${key}.enabled`, w.enabled !== false)}</div>
    <div class="wbody">${body}</div></div>`;
}
function limitNote(kind) {
  return `<span class="limit ${flash === kind ? 'flash' : ''}">${esc(t('maxReached', { n: num(LIMITS[kind]) }))}</span>`;
}
function cryptoSettings() {
  const c = W().crypto;
  const coins = (catalog && catalog.coins) || c.coins.map((sym) => ({ sym, name: sym }));
  return `<div class="sub-h"><b>${esc(t('coins'))}</b>${limitNote('coin')}</div>
    <div class="chips">${coins.map((co) => chip('coin', co.sym, co.sym, c.coins.includes(co.sym), co.name && co.name !== co.sym ? `<small>${esc(co.name)}</small>` : '')).join('')}</div>`;
}
function newsSettings() {
  const n = W().news;
  const sel = activeFeeds();
  const presets = (catalog && catalog.feeds) || [];
  const mine = lang();
  const sorted = presets.slice().sort((a, b) => (b.lang === mine) - (a.lang === mine));
  const custom = (n.custom || []).map((f) => chip('feed', f.id, f.name, sel.includes(f.id),
    `<i class="chip-x" data-wchip="custom-x" data-val="${esc(f.id)}" title="${esc(t('remove'))}">${icon('x', 11, 2.6)}</i>`)).join('');
  return `<div class="sub-h"><b>${esc(t('feeds'))}</b>${limitNote('feed')}</div>
    <div class="chips">${sorted.map((f) => chip('feed', f.id, f.name, sel.includes(f.id))).join('')}${custom}</div>
    <form class="feed-form" id="feedForm">
      <span class="feed-ic">${icon('rss', 15)}</span>
      <input class="text ${feedError ? 'bad' : ''}" id="feedUrl" name="url" placeholder="${esc(t('feedUrl'))}" value="${esc(feedDraft)}" autocomplete="off" spellcheck="false" ${feedBusy ? 'disabled' : ''}>
      <button class="btn sm accent" type="submit" ${feedBusy ? 'disabled' : ''}>${icon(feedBusy ? 'loader' : 'plus', 14, 2.4, feedBusy ? 'spin' : '')} ${esc(t('addFeed'))}</button>
    </form>
    ${feedError ? `<div class="warn">${icon('wifi-off', 15)} ${esc(feedError)}</div>` : ''}`;
}
function clockSettings() {
  const z = W().clocks.zones || [];
  const l = lang();
  return `<div class="sub-h"><b>${esc(t('zones'))}</b>${limitNote('zone')}</div>
    <div class="chips">${CLOCK_ZONES.map((tz) => chip('zone', tz, cityName(tz, l), z.includes(tz))).join('')}</div>`;
}
let flashTimer = null;
function flashLimit(kind) {
  flash = kind;
  render(false);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { flash = ''; render(false); }, 900);
}
async function toggleChip(kind, val) {
  const w = W();
  const flip = (list, max) => {
    if (list.includes(val)) return list.length > 1 ? list.filter((x) => x !== val) : list;
    if (list.length >= max) { flashLimit(kind); return null; }
    return [...list, val];
  };
  if (kind === 'coin') {
    const coins = flip(w.crypto.coins || [], LIMITS.coin);
    if (coins) await save({ widgets: { crypto: { coins } } });
  } else if (kind === 'feed') {
    const feeds = flip(activeFeeds(), LIMITS.feed);
    if (feeds) await save({ widgets: { news: { feeds } } });
  } else if (kind === 'zone') {
    const zones = flip(w.clocks.zones || [], LIMITS.zone);
    if (zones) await save({ widgets: { clocks: { zones } } });
  } else if (kind === 'custom-x') {
    const custom = (w.news.custom || []).filter((f) => f.id !== val);
    let feeds = activeFeeds().filter((x) => x !== val);
    if (!feeds.length) feeds = [];
    await save({ widgets: { news: { custom, feeds } } });
  }
}
async function addFeed(raw) {
  let url = String(raw || '').trim();
  feedDraft = url;
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try { const u = new URL(url); if (!u.hostname.includes('.')) throw new Error('bad'); } catch (_) { feedError = t('feedBad'); render(false); return; }
  const w = W();
  if ((w.news.custom || []).some((f) => f.url === url)) { feedError = ''; render(false); return; }
  if (activeFeeds().length >= LIMITS.feed) { flashLimit('feed'); return; }
  feedBusy = true; feedError = ''; render(false);
  let r = null;
  try { r = await api.widgets.testFeed(url); } catch (_) { r = null; }
  feedBusy = false;
  if (!r || !r.ok) { feedError = t('feedBad'); render(false); return; }
  const id = `c-${Date.now().toString(36)}`;
  const name = (r.title || new URL(url).hostname.replace(/^www\./, '')).slice(0, 40);
  feedDraft = '';
  await save({ widgets: { news: { custom: [...(w.news.custom || []), { id, name, url }], feeds: [...activeFeeds(), id] } } });
}
async function loadCatalog() {
  if (catalog && catalog.lang === lang()) return;
  try { catalog = { ...(await api.widgets.catalog()), lang: lang() }; } catch (_) { catalog = null; }
}


// ------------------------------------------------------------------ gaming
const GX = ['fps', 'low1', 'ft', 'cpu', 'cpuTemp', 'gpu', 'gpuTemp', 'power', 'vram', 'ram', 'ping', 'time', 'clock', 'battery'];
const GM_HOTKEYS = ['Control+Shift+G', 'Alt+Shift+G', 'Control+Shift+F10', 'Alt+F10', 'Control+Alt+G'];
const LHM_URL = 'https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases';
const RTSS_URL = 'https://www.guru3d.com/download/rtss-rivatuner-statistics-server-download/';
async function loadGameLib(refresh) {
  if (!api.gaming) return;
  gmLibBusy = true;
  try { gmLib = (await api.gaming.cmd('library', { refresh })) || []; } catch (_) { gmLib = []; }
  gmLibBusy = false;
}
function gmLibHtml() {
  if (gmLib === null) return `<p class="muted small">${icon('loader', 14, 2.2, 'spin')} …</p>`;
  if (!gmLib.length) return `<p class="muted small top0">${esc(t('gmLibEmpty'))}</p>`;
  return `<div class="gm-libl">${gmLib.map((g) => `<div class="gm-lrow ${g.hidden ? 'off' : ''}">
      <span class="gm-lic">${g.icon ? `<img src="${esc(g.icon)}" alt="">` : icon('gamepad-2', 16)}</span>
      <div class="row-text"><div class="row-title ell" dir="auto">${esc(g.name)}</div><div class="row-hint">${esc(t(`gmSrc_${g.source}`))}</div></div>
      ${g.source === 'custom' ? `<button class="ib sm" data-gmlib="removeCustom" data-id="${esc(g.id)}" title="${esc(t('remove'))}">${icon('trash-2', 15)}</button>` : ''}
      <button class="btn sm" data-gmlib="${g.hidden ? 'unhideGame' : 'hideGame'}" data-id="${esc(g.id)}">${icon(g.hidden ? 'eye' : 'eye-off', 14)} ${esc(t(g.hidden ? 'gmShow' : 'gmHide'))}</button>
    </div>`).join('')}</div>`;
}
function GC() {
  const g = S.gaming || {};
  return { ...g, hud: { metrics: [], ...(g.hud || {}) }, optimize: { ...(g.optimize || {}) }, closeList: g.closeList || [], games: g.games || [], ignore: g.ignore || [] };
}
const hk = (k) => String(k || '').replace(/Control/g, 'Ctrl');
const gb = (b) => (b >= 1073741824 ? `${num((b / 1073741824).toFixed(1))} GB` : `${num(Math.round(b / 1048576))} MB`);
function dur(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return num(h ? `${h}:${String(m).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}` : `${m}:${String(sec % 60).padStart(2, '0')}`);
}
async function loadGaming() {
  if (!api.gaming) return;
  try { gm = await api.gaming.get(); } catch (_) { gm = null; }
}
function gmListChips(list, kind) {
  if (!list.length) return `<span class="muted small">${esc(t('gmCloseEmpty'))}</span>`;
  return list.map((n) => `<span class="chip on gm-chip" dir="ltr">${esc(n)}<button class="chip-x" data-gmrm="${kind}" data-val="${esc(n)}" title="${esc(t('remove'))}">${icon('x', 12, 2.6)}</button></span>`).join('');
}
function gmProcsHtml() {
  if (gmProcs === null) return '';
  if (gmProcs === 'loading') return `<div class="gm-procs"><span class="muted small">${icon('loader', 14, 2.2, 'spin')} …</span></div>`;
  const have = new Set(GC().closeList);
  const rows = gmProcs.filter((p) => !have.has(String(p.name).toLowerCase())).slice(0, 40);
  if (!rows.length) return '<div class="gm-procs"><span class="muted small">—</span></div>';
  return `<div class="gm-procs">${rows.map((p) => `<button class="gm-proc" data-gmadd="closeList" data-val="${esc(String(p.name).toLowerCase())}" title="${esc(p.path || '')}">
      ${icon('plus', 13, 2.6)}<b dir="ltr">${esc(p.name)}</b><span class="muted ell" dir="auto">${esc(p.title || '')}</span><small dir="ltr">${esc(gb(p.mem || 0))}</small></button>`).join('')}</div>`;
}
function gmFpsStatus() {
  const f = (gm && gm.fps) || {};
  if (f.etw === 'ok') return ['ok', t('gmEtwOk'), 'ETW'];
  if (f.rtss) return ['ok', t('gmEtwRtss'), 'RTSS'];
  if (f.etw === 'denied') return ['bad', t('gmEtwDenied'), ''];
  if (f.etw === 'error' || f.etw === 'unavailable' || f.etw === 'unsupported') return ['bad', t('gmEtwError'), f.etw];
  return ['wait', t('gmEtwOff'), ''];
}
const SRC_NAMES = { lhm: 'LibreHardwareMonitor', ohm: 'OpenHardwareMonitor', hwinfo: 'HWiNFO', nvidia: 'NVIDIA', acpi: 'ACPI' };
function gmTempRow(label, temp, src) {
  const m = gm && gm.metrics;
  let cls = 'wait'; let text = m ? t('gmNotFound') : t('gmCheck');
  if (m && src && temp !== null && temp !== undefined) {
    cls = src === 'acpi' ? 'wait' : 'ok';
    text = src === 'acpi' ? t('gmApprox') : t('gmFrom', { src: SRC_NAMES[src] || src });
  }
  const val = m && temp !== null && temp !== undefined ? `<b class="tnum" dir="ltr">${num(GC().temp === 'f' ? Math.round(temp * 9 / 5 + 32) : Math.round(temp))}°</b>` : '';
  return `<div class="row"><span class="dot ${cls}"></span><div class="row-text"><div class="row-title">${esc(label)}</div><div class="row-hint">${esc(text)}</div></div><div class="row-ctl">${val}</div></div>`;
}
function gmSessionsHtml() {
  const list = (gm && gm.sessions) || [];
  if (!list.length) return `<p class="muted small top0">${esc(t('gmNoSessions'))}</p>`;
  return `<div class="gm-sess">${list.map((x) => {
    const d = new Date(x.end || x.start);
    const peak = Math.max(x.maxCpuTemp || 0, x.maxGpuTemp || 0);
    return `<div class="gm-srow"><span class="gm-sic">${icon('gamepad-2', 15)}</span>
      <div class="row-text"><div class="row-title ell" dir="auto">${esc(x.title || x.name)}</div><div class="row-hint" dir="ltr">${esc(d.toLocaleString(langInfo(lang()).locale, { dateStyle: 'medium', timeStyle: 'short' }))}</div></div>
      <div class="gm-sval"><span>${esc(t('gmPlayTime'))}</span><b dir="ltr">${dur(x.dur)}</b></div>
      <div class="gm-sval"><span>${esc(t('gmAvgFps'))}</span><b dir="ltr">${x.avgFps ? num(x.avgFps) : '–'}</b></div>
      <div class="gm-sval"><span>${esc(t('gmLow1'))}</span><b dir="ltr">${x.low1 ? num(x.low1) : '–'}</b></div>
      <div class="gm-sval"><span>${esc(t('gmPeak'))}</span><b dir="ltr">${peak ? `${num(GC().temp === 'f' ? Math.round(peak * 9 / 5 + 32) : peak)}°` : '–'}</b></div></div>`;
  }).join('')}</div>`;
}
function gmSig(g) {
  if (!g) return '';
  const m = g.metrics || {};
  return JSON.stringify([g.fps, (g.sessions || []).map((x) => x.id), !!g.metrics, m.cpuTempSrc, m.gpuTempSrc, Math.round((m.cpuTemp || 0) / 3), Math.round((m.gpuTemp || 0) / 3), g.optimized, g.rtss]);
}

// ------------------------------------------------------------------ subtitles
const SUB_LINKS = { subdl: 'https://subdl.com/panel/api', opensubtitles: 'https://www.opensubtitles.com/en/consumers' };
function SC() {
  const c = S.subtitles || {};
  const p = c.providers || {};
  return {
    enabled: c.enabled !== false, auto: c.auto !== false, autoDownload: c.autoDownload !== false, dir: c.dir || '',
    nextToVideo: !!c.nextToVideo, fixEncoding: c.fixEncoding !== false, hi: c.hi || 'avoid', languages: Array.isArray(c.languages) ? c.languages : [],
    providers: {
      subdl: { on: true, key: '', ...(p.subdl || {}) },
      opensubtitles: { on: true, key: '', user: '', passEnc: '', ...(p.opensubtitles || {}) },
      podnapisi: { on: true, ...(p.podnapisi || {}) },
    },
  };
}
// none chosen yet = the app language, then English (same rule as the finder in main)
function subLangs() {
  const c = SC().languages.filter((x) => SL.byCode(x));
  if (c.length) return c.slice(0, 3);
  return [...new Set([SL.byCode(lang()) ? lang() : 'en', 'en'])];
}
async function toggleSubLang(code) {
  const cur = subLangs();
  let next;
  if (cur.includes(code)) { if (cur.length === 1) return; next = cur.filter((x) => x !== code); }
  else { if (cur.length >= LIMITS.sublang) { flashLimit('sublang'); return; } next = [...cur, code]; }
  await save({ subtitles: { languages: next } });
}
function subsTestHtml(id) {
  const r = subsTests[id];
  if (!r) return '';
  if (r.busy) return `<span class="ptest">${icon('loader', 13, 2.4, 'spin')}</span>`;
  if (r.ok) {
    const login = r.login === true ? ` · ${t('subsLoginOk')}` : r.login === false ? ` · ${t('subsLoginFail')}` : '';
    return `<span class="ptest ok">${icon('check', 13, 3)} ${esc(t('subsTestOk', { n: num(r.count) }))}${esc(login)}</span>`;
  }
  return `<span class="ptest bad" title="${esc(r.detail || '')}">${icon('x', 13, 3)} ${esc(t(`subsErr_${r.code || 'other'}`))}</span>`;
}
function providerBlock(id, letter, hintKey) {
  const P = SC().providers[id];
  const on = P.on !== false;
  const needsKey = id !== 'podnapisi';
  let fields = '';
  if (on && needsKey) {
    fields = `<div class="prov-fields">
      <input class="text mono" data-path="subtitles.providers.${id}.key" value="${esc(P.key || '')}" placeholder="${esc(t('subsApiKey'))}" dir="auto" spellcheck="false" autocomplete="off">
      <button class="btn sm" data-url="${SUB_LINKS[id]}">${icon('external-link', 13)} ${esc(t('subsGetKey'))}</button>
    </div>`;
    if (id === 'opensubtitles') {
      const user = subsUserDraft !== null ? subsUserDraft : (P.user || '');
      fields += `<div class="prov-fields">
        <input class="text" id="osUser" value="${esc(user)}" placeholder="${esc(t('subsUser'))}" dir="auto" spellcheck="false" autocomplete="off">
        <input class="text" id="osPass" type="password" placeholder="${esc(P.passEnc ? t('subsPassSaved') : t('subsPass'))}" dir="ltr" autocomplete="new-password">
        <button class="btn sm" data-subs="login">${icon('check', 13, 2.6)} ${esc(t('subsSaveLogin'))}</button>
      </div><div class="row-hint prov-note">${esc(t('subsLoginHint'))}</div>`;
    }
  }
  const canTest = on && (!needsKey || String(P.key || '').trim());
  return `<div class="prov ${on ? '' : 'off'}">
    <div class="prov-head">
      <span class="prov-logo p-${id}">${letter}</span>
      <div class="row-text"><div class="row-title">${esc(SL.PROVIDER_NAMES[id])}</div><div class="row-hint">${esc(t(hintKey))}</div></div>
      <div class="row-ctl btn-row">${subsTestHtml(id)}${canTest ? `<button class="btn sm" data-subs="test" data-id="${id}">${esc(t('subsTest'))}</button>` : ''}${sw(`subtitles.providers.${id}.on`, on)}</div>
    </div>
    ${fields}
  </div>`;
}
async function loadSubs() {
  try { subsDir = (await api.subs.cmd('dir')) || ''; } catch (_) { subsDir = ''; }
}

// ------------------------------------------------------------------ sections
// Gaming guide: how to see the bar over a game, and why nothing is drawn inside games (anti-cheat)
function gmGuideHtml() {
  const now = gm && gm.game
    ? `<div class="gm-now ${gm.fullscreen ? 'warn' : 'ok'}">${icon(gm.fullscreen ? 'triangle-alert' : 'circle-check', 15)}<span dir="auto">${esc(t(gm.fullscreen ? 'gmGuideNowFs' : 'gmGuideNowOk'))}</span></div>`
    : '';
  return `<div class="card pad-card gm-guide" id="gmGuide">
      <h3>${icon('info', 17)} ${esc(t('gmGuideTitle'))}</h3>
      ${now}
      <ol class="steps">
        <li><span class="step-n">${num(1)}</span><div>${esc(t('gmGuide1'))}</div></li>
        <li><span class="step-n">${num(2)}</span><div>${esc(t('gmGuide2'))}</div></li>
        <li><span class="step-n">${num(3)}</span><div>${esc(t('gmGuide3'))}</div></li>
      </ol>
      <div class="gm-why"><div class="gm-why-t">${icon('shield-check', 16)}<b>${esc(t('gmGuideWhyTitle'))}</b></div><p>${esc(t('gmGuideWhy'))}</p></div>
    </div>`;
}

const SECTION_RENDER = {
  welcome() {
    return `<section class="hero">
      ${heroIsland()}
      <h1>${esc(t('welcomeTitle'))}</h1><p>${esc(t('welcomeText'))}</p>
      <div class="card pad-card"><h3>${esc(t('tips'))}</h3><ul class="tips">
        <li>${icon('maximize-2', 16)}<span>${esc(t('tip1'))}</span></li>
        <li>${icon('volume-2', 16)}<span>${esc(t('tip2'))}</span></li>
        <li>${icon('move', 16)}<span>${esc(t('tip3'))}</span></li>
        <li>${icon('keyboard', 16)}<span>${esc(t('tip4'))}<kbd dir="ltr">${esc(S.shortcut || '—')}</kbd></span></li>
      </ul></div>
      <div class="btns center"><button class="btn accent" data-go="tryit">${icon('play', 14, 0, '', true)} ${esc(t('tryit'))}</button>
      <button class="btn" data-go="phoneNav">${icon('smartphone', 15)} ${esc(t('obPhoneTitle'))}</button>
      <button class="btn" data-go="weatherNav">${icon('cloud-sun', 15)} ${esc(t('weatherNav'))}</button></div>
    </section>`;
  },
  appearance() {
    const swatches = ['auto', '#0a84ff', '#30d158', '#ff9f0a', '#ff375f', '#bf5af2', '#64d2ff', '#ffd60a'];
    return `<h2>${esc(t('appearance'))}</h2>
      <div class="card pad-card">
        <h3>${icon('languages', 17)} ${esc(t('language'))}</h3>
        <p class="muted top0">${esc(t('languageHint'))}</p>
        ${langGrid()}
      </div>
      <div class="card pad-card">
        <h3>${icon('sparkles', 17)} ${esc(t('theme'))}</h3>
        <p class="muted top0">${esc(t('themeHint'))}</p>
        <div class="style-pick theme-pick" style="--tp:${(S.transparency || 0) / 100}">
          ${['dark', 'glass'].map((th) => `<button class="style-opt ${(S.theme || 'dark') === th ? 'on' : ''}" data-seg="theme" data-val="${th}">
            <div class="sp-screen wall"><div class="sp-island floating th-${th}"><i></i><i></i></div></div><span>${esc(t(th === 'glass' ? 'themeGlass' : 'themeDark'))}</span></button>`).join('')}
        </div>
        ${row(t('transparency'), t('transparencyHint'), range('transparency', S.transparency || 0, 0, 90, 5, FMT.transparency), 'eye')}
      </div>
      <div class="card">
        <div class="style-pick">
          ${['floating', 'notch'].map((st) => `<button class="style-opt ${S.style === st ? 'on' : ''}" data-seg="style" data-val="${st}">
            <div class="sp-screen"><div class="sp-island ${st}"></div></div><span>${esc(t(st))}</span></button>`).join('')}
        </div>
        ${row(t('scale'), '', range('scale', S.scale, 0.8, 1.3, 0.05, FMT.scale), 'maximize-2')}
        ${S.style === 'floating' ? row(t('topOffset'), '', range('topOffset', S.topOffset, 0, 40, 1, FMT.topOffset), 'arrow-down') : ''}
        ${row(t('accent'), '', `<div class="swatches">${swatches.map((c) => `<button class="swatch ${S.accent === c ? 'on' : ''} ${c === 'auto' ? 'auto' : ''}" data-seg="accent" data-val="${c}" title="${c === 'auto' ? esc(t('auto')) : c}" style="${c === 'auto' ? '' : `--c:${c}`}"></button>`).join('')}</div>`, 'sun')}
      </div>
      <div class="card">
        ${row(t('glow'), t('glowHint'), sw('glow', S.glow), 'sparkles')}
        ${row(t('edgeLight'), t('edgeLightHint'), sw('edgeLight', S.edgeLight), 'zap')}
        ${row(t('blinkHello'), t('blinkHelloHint'), sw('blink.hello', !S.blink || S.blink.hello !== false), 'sparkles')}
        ${row(t('blinkIdle'), t('blinkIdleHint'), sw('blink.peeks', !!(S.blink && S.blink.peeks)), 'eye')}
        ${row(t('blinkEvents'), t('blinkEventsHint'), sw('blink.events', !S.blink || S.blink.events !== false), 'zap')}
        ${row(t('idleClock'), t('idleClockHint'), sw('idleClock', S.idleClock), 'timer')}
        ${row(t('compactInfo'), t('compactInfoHint'), sw('media.compactInfo', !S.media || S.media.compactInfo !== false), 'music')}
      </div>`;
  },
  modules() {
    const mods = [
      ['media', 'music'], ['visualizer', 'activity'], ['notifications', 'bell'], ['phoneCalls', 'phone-incoming'],
      ['weather', 'cloud-sun'], ['volumeHud', 'volume-2'], ['battery', 'battery-charging'], ['capsLock', 'arrow-big-up'], ['numLock', 'hash'],
      ['clipboard', 'clipboard'], ['privacy', 'mic'], ['stats', 'cpu'], ['shelf', 'folder-open'], ['timer', 'hourglass'],
      ['widgets', 'bitcoin'],
    ];
    return `<h2>${esc(t('modules'))}</h2><div class="card grid2">${mods.map(([k, ic]) => `<div class="mod ${S.modules[k] ? 'on' : ''}">
      <span class="mod-ic">${icon(ic, 18)}</span><div class="row-text"><div class="row-title">${esc(t(`m_${k}`))}</div><div class="row-hint">${esc(t(`m_${k}_d`))}</div></div>${sw(`modules.${k}`, S.modules[k])}</div>`).join('')}</div>`;
  },
  notificationsNav() {
    return `<h2>${esc(t('notificationsNav'))}</h2>
      <div class="card">
        ${row(t('notifDuration'), '', range('notifications.duration', S.notifications.duration, 2, 15, 1, FMT['notifications.duration']), 'timer')}
        ${row(t('showBody'), t('showBodyHint'), sw('notifications.showBody', S.notifications.showBody), 'message-circle')}
        ${row(t('respectDnd'), '', sw('respectDnd', S.respectDnd), 'moon')}
        ${row(t('callsOverFullscreen'), '', sw('callsOverFullscreen', S.callsOverFullscreen), 'phone-incoming')}
        ${row(t('blocked'), t('blockedHint'), `<input class="text" id="blocked" value="${esc((S.notifications.blocked || []).join(', '))}" dir="ltr">`, 'bell-off')}
      </div>
      <div class="card pad-card"><h3>${icon('smartphone', 17)} ${esc(t('plTitle'))}</h3>
        <p class="muted top0">${esc(t('plText'))}</p>
        <div class="btns"><button class="btn" data-action="phonelink">${icon('smartphone', 15)} ${esc(t('openPhoneLink'))}</button>
        <button class="btn" data-action="winsettings-notif">${icon('settings', 15)} ${esc(t('openNotifSettings'))}</button>
        <button class="btn" data-go="phoneNav">${icon('link', 15)} ${esc(t('phoneEnable'))}</button></div>
      </div>`;
  },
  phoneNav() {
    const on = S.phone && S.phone.enabled;
    const st = statusData && statusData.helper && statusData.helper.phone;
    const failed = on && st && st.ok === false && st.detail && st.detail !== 'off';
    return `<h2>${esc(t('phoneNav'))}</h2>
      <div class="card">
        ${row(t('phoneEnable'), t('phoneEnableHint'), sw('phone.enabled', on), 'smartphone')}
        ${failed ? `<div class="warn">${icon('shield', 15)} ${esc(t('phoneServiceOff'))} <span dir="ltr" class="muted">${esc(st.detail)}</span></div>` : ''}
      </div>
      ${on ? deviceList() : ''}
      ${on ? phoneFeatures() : ''}
      ${on ? commandsCard() : ''}
      <div class="card pad-card"><h3>${icon('list', 17)} ${esc(t('phoneHow'))}</h3>${phoneSteps()}</div>
      <div class="btns"><button class="btn" data-test="pair">${icon('link', 15)} ${esc(t('t_pair'))}</button>
      <button class="btn" data-go="notificationsNav">${icon('smartphone', 15)} ${esc(t('plTitle'))}</button></div>`;
  },
  shortcutsNav() {
    return `<h2>${esc(t('shortcutsTitle'))}</h2>
      <p class="muted top0">${esc(t('shortcutsText'))}</p>
      <div class="card">${row(t('deckSize'), '', seg('deck.size', (S.deck && S.deck.size) || 'm', [['s', t('sizeS')], ['m', t('sizeM')], ['l', t('sizeL')]]), 'layout-grid')}</div>
      <div class="card">${shortcutList()}</div>
      <div class="btns">
        <button class="btn ${keyForm ? 'on' : ''}" data-cmd="keyform">${icon('keyboard', 15)} ${esc(t('addKey'))}</button>
        <button class="btn ${pickerOpen ? 'on' : 'accent'}" data-cmd="picker">${icon('app-window', 15)} ${esc(t('addFromApps'))}</button>
        <button class="btn" data-cmd="browse">${icon('folder-open', 15)} ${esc(t('browseFile'))}</button>
        <button class="btn ${webForm ? 'on' : ''}" data-cmd="web">${icon('globe', 15)} ${esc(t('addWebsite'))}</button>
      </div>
      ${keyFormHtml()}
      ${webFormHtml()}
      ${pickerHtml()}`;
  },
  subtitlesNav() {
    const C = SC();
    const chosen = subLangs();
    const custom = !!C.dir;
    return `<h2>${esc(t('subtitlesTitle'))}</h2>
      <p class="muted top0">${esc(t('subtitlesText'))}</p>
      <div class="card">
        ${row(t('subsEnable'), t('subsEnableHint'), sw('subtitles.enabled', C.enabled), 'captions')}
        ${C.enabled ? row(t('subsAuto'), t('subsAutoHint'), sw('subtitles.auto', C.auto), 'search') : ''}
        ${C.enabled && C.auto ? row(t('subsAutoDl'), t('subsAutoDlHint'), sw('subtitles.autoDownload', C.autoDownload), 'download', 'sub') : ''}
      </div>
      <div class="wcards ${C.enabled ? '' : 'off'}">
      <div class="card pad-card">
        <div class="sub-h top0"><b>${icon('languages', 16)} ${esc(t('subsLangs'))}</b>${limitNote('sublang')}</div>
        <p class="muted top0">${esc(t('subsLangsHint'))}</p>
        <div class="chips">${SL.LANGS.map((l) => {
    const i = chosen.indexOf(l.code);
    return `<button class="chip ${i >= 0 ? 'on' : ''}" data-sublang="${l.code}">${i >= 0 ? `<b class="ord">${num(i + 1)}</b>` : ''}<span>${esc(l.name)}</span>${l.name !== l.english ? `<small>${esc(l.english)}</small>` : ''}</button>`;
  }).join('')}</div>
      </div>
      <div class="card">
        <div class="row"><span class="row-ic">${icon('folder-open', 18)}</span>
          <div class="row-text"><div class="row-title">${esc(t('subsFolder'))}</div><div class="row-hint ell" dir="ltr">${esc(subsDir)}</div></div>
          <div class="row-ctl btn-row"><button class="btn sm" data-subs="openDir">${esc(t('openFolder'))}</button><button class="btn sm" data-subs="pickDir">${esc(t('change'))}</button>${custom ? `<button class="btn sm" data-subs="resetDir" title="${esc(t('subsDefaultFolder'))}">${icon('rotate-ccw', 13)}</button>` : ''}</div></div>
        ${row(t('subsNextToVideo'), t('subsNextToVideoHint'), sw('subtitles.nextToVideo', C.nextToVideo), 'file-down')}
        ${row(t('subsFixEnc'), t('subsFixEncHint'), sw('subtitles.fixEncoding', C.fixEncoding), 'languages')}
        ${row(t('subsHi'), '', seg('subtitles.hi', C.hi, [['avoid', t('subsHiAvoid')], ['any', t('subsHiAny')], ['prefer', t('subsHiPrefer')]]), 'ear')}
      </div>
      <div class="card pad-card">
        <h3>${icon('globe', 17)} ${esc(t('subsSources'))}</h3>
        <p class="muted top0">${esc(t('subsSourcesHint'))}</p>
        ${providerBlock('subdl', 'S', 'subsSubdlHint')}
        ${providerBlock('opensubtitles', 'O', 'subsOsHint')}
        ${providerBlock('podnapisi', 'P', 'subsPodHint')}
      </div>
      </div>
      <div class="card pad-card"><h3>${icon('list', 17)} ${esc(t('subsHow'))}</h3>
        <ol class="steps">
          <li><span class="step-n">${num(1)}</span><div>${esc(t('subsHow1'))}</div></li>
          <li><span class="step-n">${num(2)}</span><div>${esc(t('subsHow2'))}</div></li>
          <li><span class="step-n">${num(3)}</span><div>${esc(t('subsHow3'))}</div></li>
        </ol></div>
      <div class="btns"><button class="btn" data-test="subs">${icon('captions', 15)} ${esc(t('t_subs'))}</button></div>`;
  },
  gamingNav() {
    if (gmLib === null && !gmLibBusy) loadGameLib(false).then(() => { if (section === 'gamingNav') render(false); });
    const G = GC();
    const H = G.hud;
    const O = G.optimize;
    const [fcls, ftext, fsrc] = gmFpsStatus();
    const m = (gm && gm.metrics) || {};
    const needAllow = gm && gm.fps && gm.fps.etw === 'denied';
    return `<h2>${esc(t('gmTitle'))}</h2>
      <p class="muted top0">${esc(t('gamingText'))}</p>
      <div class="card">
        ${row(t('gmEnable'), t('gmEnableHint'), sw('gaming.enabled', G.enabled), 'gamepad-2')}
        ${G.enabled ? row(t('gmAuto'), t('gmAutoHint'), sw('gaming.auto', G.auto), 'radar') : ''}
        ${G.enabled ? row(t('gmAutoOpt'), '', sw('gaming.autoOptimize', G.autoOptimize), 'rocket', 'sub') : ''}
        ${G.enabled ? row(t('gmRestore'), '', sw('gaming.restoreOnExit', G.restoreOnExit), 'undo-2', 'sub') : ''}
        ${G.enabled ? row(t('gmQuiet'), t('gmQuietHint'), sw('gaming.quiet', G.quiet), 'eye-off') : ''}
      </div>
      ${G.enabled ? gmGuideHtml() : ''}
      <div class="wcards ${G.enabled ? '' : 'off'}">
      <div class="card pad-card">
        <h3>${icon('gauge', 17)} ${esc(t('gmBarSection'))}</h3>
        ${row(t('gmBarEnable'), '', sw('gaming.hud.enabled', H.enabled), 'eye')}
        ${row(t('gmEngine'), '', seg('gaming.hud.engine', H.engine || 'auto', [['auto', t('gmEngAuto')], ['window', t('gmEngWindow')], ['rtss', t('gmEngRtss')]]), 'layers')}
        <p class="muted small gm-note top0">${icon('layers', 14)}<span>${esc(t('gmEngHint'))}</span></p>
        ${(H.engine || 'auto') !== 'window' ? (() => {
          const r = (gm && gm.rtss) || {};
          const cls = r.running ? 'ok' : r.installed ? 'wait' : 'bad';
          const txt = r.running ? t('gmRtssRunning') : r.installed ? t('gmRtssInstalled') : t('gmRtssNotInstalled');
          return `<div class="row"><span class="dot ${cls}"></span><div class="row-text"><div class="row-title">${esc(t('gmRtss'))}</div><div class="row-hint">${esc(txt)}</div></div>
            <div class="row-ctl">${r.installed ? '' : `<button class="btn sm accent" data-url="${RTSS_URL}">${icon('external-link', 14)} ${esc(t('gmGetRtss'))}</button>`}</div></div>
            <p class="muted small gm-note">${icon('info', 14)}<span>${esc(t('gmRtssHint'))}</span></p>`;
        })() : ''}
        ${row(t('gmBarShow'), '', seg('gaming.hud.show', H.show, [['game', t('gmBarGame')], ['always', t('gmBarAlways')]]), 'monitor')}
        ${row(t('gmPos'), '', seg('gaming.hud.position', H.position, (dir() === 'rtl' ? (a) => a.reverse() : (a) => a)([['left', t('gmLeft')], ['center', t('gmCenter')], ['right', t('gmRight')]])), 'move')}
        ${row(t('gmSize'), '', seg('gaming.hud.size', H.size, [['s', t('gmSmall')], ['m', t('gmMedium')], ['l', t('gmLarge')]]), 'layout-grid')}
        ${row(t('gmOpacity'), '', range('gaming.hud.opacity', H.opacity, 30, 100, 5, FMT['gaming.hud.opacity']), 'sun')}
        ${row(t('unit'), '', seg('gaming.temp', G.temp, [['c', '°C'], ['f', '°F']]), 'thermometer')}
        <div class="row"><span class="row-ic">${icon('keyboard', 18)}</span><div class="row-text"><div class="row-title">${esc(t('gmHotkey'))}</div></div>
          <div class="row-ctl"><select id="gmHotkey" class="text" dir="ltr">${[...GM_HOTKEYS, ''].map((k) => `<option value="${esc(k)}" ${k === (H.hotkey || '') ? 'selected' : ''}>${esc(k ? hk(k) : t('gmNoHotkey'))}</option>`).join('')}</select></div></div>
        <div class="sub-h">${esc(t('gmMetrics'))}</div>
        <div class="chips">${GX.map((k) => `<button class="chip ${H.metrics.includes(k) ? 'on' : ''}" data-gmmetric="${k}">${H.metrics.includes(k) ? icon('check', 12, 3) : ''}<span>${esc(t(`gx_${k}`))}</span></button>`).join('')}</div>
        ${H.metrics.includes('ping') ? `<div class="row top8"><span class="row-ic">${icon('radar', 18)}</span><div class="row-text"><div class="row-title">${esc(t('gmPingHost'))}</div><div class="row-hint">${esc(t('gmPingHint'))}</div></div>
          <div class="row-ctl"><input id="gmPing" class="text mono" data-path="gaming.pingHost" value="${esc(G.pingHost || '')}" dir="ltr" spellcheck="false" placeholder="8.8.8.8"></div></div>` : ''}
        ${(H.engine || 'auto') === 'window' ? `<p class="muted small gm-note">${icon('triangle-alert', 14)}<span>${esc(t('gmBarHint'))}</span></p>` : ''}
      </div>
      <div class="card pad-card">
        <h3>${icon('rocket', 17)} ${esc(t('gmOptSection'))}</h3>
        ${row(t('gmStep_power'), t('gmOptPowerHint'), sw('gaming.optimize.power', O.power), 'zap')}
        ${row(t('gmStep_gameMode'), '', sw('gaming.optimize.gameMode', O.gameMode), 'gamepad-2')}
        ${row(t('gmStep_memory'), t('gmOptMemHint'), sw('gaming.optimize.memory', O.memory), 'cpu')}
        ${row(t('gmStep_priority'), '', seg('gaming.optimize.priority', O.priority, [['normal', t('gmPrioNormal')], ['above', t('gmPrioAbove')], ['high', t('gmPrioHigh')]]), 'trending-up')}
        ${row(t('gmOptDvr'), '', sw('gaming.optimize.dvr', O.dvr), 'video')}
        ${row(t('gmStep_close'), '', sw('gaming.optimize.closeApps', O.closeApps), 'app-window')}
        ${O.closeApps ? `<div class="gm-box">
          <div class="sub-h top0">${esc(t('gmCloseList'))}</div>
          <div class="chips">${gmListChips(G.closeList, 'closeList')}</div>
          <div class="btns top8"><button class="btn sm ${gmProcs !== null ? 'on' : ''}" data-gm="procs">${icon('list', 14)} ${esc(t('gmRunning'))}</button></div>
          ${gmProcsHtml()}
          ${row(t('gmForce'), '', sw('gaming.forceClose', G.forceClose), '', 'sub')}
          ${row(t('gmReopen'), '', sw('gaming.reopen', G.reopen), '', 'sub')}
        </div>` : ''}
        <p class="muted small gm-note">${icon('shield-check', 14)}<span>${esc(t('gmEverywhere'))}</span></p>
      </div>
      <div class="card pad-card">
        <h3>${icon('library', 17)} ${esc(t('gmLibrary'))}</h3>
        <p class="muted top0">${esc(t('gmLibHint'))}</p>
        ${row(t('gmOptLaunch'), '', sw('gaming.optimizeOnLaunch', G.optimizeOnLaunch !== false), 'rocket')}
        <div class="btns top8"><button class="btn sm" data-gmlib="addGame">${icon('plus', 14)} ${esc(t('gmAddGame'))}</button>
          <button class="btn sm" data-gmlib="rescan" ${gmLibBusy ? 'disabled' : ''}>${icon('refresh-cw', 14, 2.2, gmLibBusy ? 'spin' : '')} ${esc(t('gmRescan'))}</button></div>
        ${gmLibHtml()}
      </div>
      <div class="card pad-card">
        <h3>${icon('gamepad-2', 17)} ${esc(t('gmGames'))}</h3>
        <p class="muted top0">${esc(t('gmGamesHint'))}</p>
        <div class="chips">${gmListChips(G.games, 'games')}</div>
        <form class="inline-form top8" data-gmform="games"><input class="text mono" name="exe" placeholder="eldenring.exe" aria-label="${esc(t('gmExeName'))}" dir="ltr" spellcheck="false"><button class="btn sm" type="submit">${icon('plus', 14)} ${esc(t('add'))}</button></form>
        <div class="sub-h">${esc(t('gmIgnore'))}</div>
        <div class="chips">${gmListChips(G.ignore, 'ignore')}</div>
        <form class="inline-form top8" data-gmform="ignore"><input class="text mono" name="exe" placeholder="launcher.exe" aria-label="${esc(t('gmExeName'))}" dir="ltr" spellcheck="false"><button class="btn sm" type="submit">${icon('plus', 14)} ${esc(t('add'))}</button></form>
      </div>
      <div class="card pad-card">
        <h3>${icon('activity', 17)} ${esc(t('gmSensors'))}</h3>
        <div class="row"><span class="dot ${fcls}"></span><div class="row-text"><div class="row-title">${esc(t('gmFpsCounter'))}</div><div class="row-hint">${esc(ftext)}${fsrc ? ` · ${esc(fsrc)}` : ''}${gmAllow ? ` · ${esc(t(gmAllow.ok ? 'gmSignOut' : 'gmAllowFail'))}` : ''}</div></div>
          <div class="row-ctl">${needAllow ? `<button class="btn sm accent" data-gm="allowFps">${icon('shield-check', 14)} ${esc(t('gmAllow'))}</button>` : `<span class="badge ${fcls}">${fcls === 'ok' ? esc(t('ok')) : '—'}</span>`}</div></div>
        ${needAllow ? `<p class="muted small">${esc(t('gmAllowHint'))}</p>` : ''}
        ${gmTempRow(t('gmCpuTemp'), m.cpuTemp, m.cpuTempSrc)}
        ${gmTempRow(t('gmGpuTemp'), m.gpuTemp, m.gpuTempSrc)}
        ${!m.cpuTempSrc || m.cpuTempSrc === 'acpi' ? `<p class="muted small">${esc(t('gmTempHint'))}</p><div class="btns"><button class="btn sm" data-url="${LHM_URL}">${icon('external-link', 14)} ${esc(t('gmGetLhm'))}</button></div>` : ''}
      </div>
      <div class="card pad-card">
        <div class="sub-h top0"><b>${icon('history', 16)} ${esc(t('gmSessions'))}</b>${gm && gm.sessions && gm.sessions.length ? `<button class="link" data-gm="clearSessions">${esc(t('clearAll'))}</button>` : ''}</div>
        ${gmSessionsHtml()}
      </div>
      </div>
      <div class="btns"><button class="btn" data-test="gaming">${icon('trophy', 15)} ${esc(t('t_gaming'))}</button></div>`;
  },
  widgetsNav() {
    const on = S.modules.widgets !== false;
    return `<h2>${esc(t('widgetsNav'))}</h2>
      <p class="muted top0">${esc(t('widgetsText'))}</p>
      <div class="card">${row(t('m_widgets'), t('m_widgets_d'), sw('modules.widgets', on), 'layout-grid')}</div>
      <div class="wcards ${on ? '' : 'off'}">
        ${widgetCard('crypto', 'bitcoin', cryptoSettings())}
        ${widgetCard('news', 'newspaper', newsSettings())}
        ${widgetCard('clocks', 'globe', clockSettings())}
      </div>`;
  },
  weatherNav() {
    const w = S.weather || {};
    return `<h2>${esc(t('weatherNav'))}</h2>
      <div class="card">
        ${row(t('m_weather'), t('m_weather_d'), sw('modules.weather', S.modules.weather), 'cloud-sun')}
        ${row(t('unit'), '', seg('weather.unit', w.unit || 'c', [['c', t('celsius')], ['f', t('fahrenheit')]]), 'thermometer')}
      </div>
      <div class="card pad-card">
        <h3>${icon('map-pin', 17)} ${esc(t('city'))}</h3>
        ${w.city ? `<div class="city-sel">${selectedCity()}${weatherPreview()}</div>` : ''}
        ${citySearchBox()}
        <p class="muted small">${esc(t('weatherSource'))}</p>
      </div>`;
  },
  behavior() {
    return `<h2>${esc(t('behavior'))}</h2>
      <div class="card">
        ${row(t('movable'), t('movableHint'), sw('movable', S.movable), 'move')}
        ${S.position ? row(t('resetPosition'), '', `<button class="btn sm" data-cmd="resetPos">${icon('rotate-ccw', 14)} ${esc(t('resetPosition'))}</button>`, 'grip-horizontal') : ''}
        ${row(t('minimized'), t('minimizedHint'), sw('minimized', S.minimized), 'minimize-2')}
        ${row(t('hidden'), t('hiddenHint'), sw('hidden', S.hidden), 'eye-off')}
      </div>
      <div class="card">
        ${row(t('startWithWindows'), '', sw('startWithWindows', S.startWithWindows), 'monitor')}
        ${row(t('hideInFullscreen'), '', sw('hideInFullscreen', S.hideInFullscreen), 'maximize-2')}
        ${row(t('sound'), '', sw('sound', S.sound), 'alarm-clock')}
        ${row(t('shortcut'), t('shortcutHint'), `<button class="kbd-input" id="shortcut" dir="ltr">${esc(S.shortcut || '—')}</button>`, 'keyboard')}
        ${row(t('display'), '', `<select id="display" class="text">${[['primary', t('primary')], ...displays.filter((d) => !d.primary).map((d) => [d.id, `${d.label} (${d.size})`])].map(([v, l]) => `<option value="${esc(v)}" ${String(S.display) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`, 'monitor')}
      </div>
      <div class="btns">
      <button class="btn" data-cmd="reset">${icon('rotate-ccw', 15)} ${esc(t('reset'))}</button>
      <button class="btn danger" data-cmd="quit">${icon('x', 15)} ${esc(t('quit'))}</button></div>`;
  },
  tryit() {
    const tests = [['blink', 'eye'], ['music', 'music'], ['video', 'video'], ['message', 'message-circle'], ['call', 'phone-incoming'], ['weather', 'cloud-sun'], ['pair', 'link'],
      ['timer', 'hourglass'], ['stopwatch', 'timer'], ['charging', 'battery-charging'], ['volume', 'volume-2'], ['caps', 'arrow-big-up'],
      ['copied', 'clipboard-check'], ['privacy', 'mic'], ['reminder', 'calendar-check'], ['subs', 'captions'], ['gaming', 'trophy'], ['dashboard', 'layout-grid']];
    return `<h2>${esc(t('tryit'))}</h2><p class="muted top0">${esc(t('tryText'))}</p>
      <div class="tests">${tests.map(([k, ic]) => `<button class="test" data-test="${k}">${icon(ic, 22)}<span>${esc(t(`t_${k}`))}</span></button>`).join('')}</div>`;
  },
  status() {
    const st = (statusData && statusData.helper) || {};
    const mods = [['core', 'core'], ['media', 'mediaMod'], ['audio', 'audio'], ['system', 'system'], ['notifications', 'notifs'], ['uia', 'uia'], ['phone', 'phoneMod'], ['bluetooth', 'btMod'], ['weather', 'weatherMod']];
    return `<h2>${esc(t('status'))}</h2>
      <div class="card">${mods.map(([k, label]) => {
    const m = st[k];
    const off = m && m.detail === 'off';
    const cls = !m ? 'wait' : off ? 'wait' : (m.ok ? 'ok' : 'bad');
    return `<div class="row"><span class="dot ${cls}"></span><div class="row-text"><div class="row-title">${esc(t(label))}</div><div class="row-hint ell" dir="ltr">${esc(m ? m.detail : '')}</div></div><div class="row-ctl"><span class="badge ${cls}">${esc(!m ? t('waiting') : off ? '—' : (m.ok ? t('ok') : t('fail')))}</span></div></div>`;
  }).join('')}</div>
      <p class="muted">${esc(t('statusHint'))}</p>
      <div class="btns"><button class="btn" data-cmd="restart">${icon('rotate-cw', 15)} ${esc(t('restartHelper'))}</button>
      <button class="btn" data-cmd="logs">${icon('folder-open', 15)} ${esc(t('openLogs'))}</button></div>
      ${statusData ? `<p class="muted small" dir="ltr">v${esc(statusData.version)} · Electron ${esc(statusData.electron)} · ${esc(statusData.platform)}</p>` : ''}`;
  },
  support() {
    return `<section class="hero support">
      <div class="support-ic">${icon('heart', 40, 2, '', true)}</div>
      <h1>${esc(t('supportTitle'))}</h1><p>${esc(t('supportText'))}</p>
      <div class="btns"><button class="btn accent big" data-url="${LINKS.DONATE}">${icon('heart', 16, 2.2)} ${esc(t('donateCrypto'))}</button></div>
      <p class="muted small" dir="ltr">BTC · USDT (TRC20, BEP20) · SOL</p>
    </section>
    <p class="muted">${esc(t('supportFree'))}</p>
    <div class="btns"><button class="btn" data-url="${LINKS.REPO}">${icon('star', 15)} ${esc(t('starGithub'))}</button>
      <button class="btn" data-url="${LINKS.ISSUES}">${icon('bug', 15)} ${esc(t('reportBug'))}</button></div>`;
  },
  about() {
    return `<section class="hero about">
      ${heroIsland(true)}
      <h1 class="bk-wordmark">Blinkelo</h1><p class="bk-tagline">${esc(t('blinkTagline'))}</p><p>${esc(t('aboutText'))}</p>
      <div class="btns"><button class="btn" data-go="support">${icon('heart', 15)} ${esc(t('supportTitle'))}</button>
      <button class="btn" data-url="${LINKS.REPO}">${icon('star', 15)} ${esc(t('starGithub'))}</button></div>
      <p class="muted" dir="ltr">© SaeedSH · ${esc(statusData ? `v${statusData.version}` : '')}</p>
      <p class="muted small" dir="ltr">Inter font (OFL) · Lucide icons (ISC) · KDE Connect protocol (GPL apps, open protocol) · Open-Meteo</p>
    </section>`;
  },
};

// ------------------------------------------------------------------ onboarding
const OB_STEPS = ['lang', 'city', 'phone', 'done'];
function obDots() {
  return `<div class="ob-dots">${OB_STEPS.map((_, i) => `<i class="${i === obStep ? 'on' : ''} ${i < obStep ? 'past' : ''}"></i>`).join('')}</div>`;
}
function renderOnboarding() {
  const step = OB_STEPS[obStep];
  let body = '';
  let nav = '';
  if (step === 'lang') {
    body = `<div class="ob-hero">${heroIsland()}</div>
      <h1>${esc(t('chooseLanguage'))}</h1><p class="muted">${esc(t('chooseLanguageText'))}</p>${langGrid(true)}`;
    nav = `<span></span><button class="btn accent big" data-ob="next">${esc(t('next'))} ${icon(dir() === 'rtl' ? 'arrow-left' : 'arrow-right', 16, 2.4)}</button>`;
  } else if (step === 'city') {
    body = `<div class="ob-icon wx">${icon('cloud-sun', 40, 1.6)}</div>
      <h1>${esc(t('obCityTitle'))}</h1><p class="muted">${esc(t('obCityText'))}</p>
      <div class="ob-city">${S.weather && S.weather.city ? `<div class="city-sel">${selectedCity()}${weatherPreview()}</div>` : ''}${citySearchBox()}</div>`;
    nav = `<button class="btn ghost" data-ob="back">${esc(t('back'))}</button><div class="btns tight"><button class="btn ghost" data-ob="skip">${esc(t('skip'))}</button><button class="btn accent big" data-ob="next">${esc(t('next'))} ${icon(dir() === 'rtl' ? 'arrow-left' : 'arrow-right', 16, 2.4)}</button></div>`;
  } else if (step === 'phone') {
    const paired = (phone.devices || []).filter((d) => d.paired || d.pairState !== 'none' || d.connected);
    body = `<div class="ob-icon ph">${icon('smartphone', 40, 1.6)}</div>
      <h1>${esc(t('obPhoneTitle'))}</h1><p class="muted">${esc(t('obPhoneText'))}</p>
      <div class="card pad-card ob-card">${phoneSteps()}</div>
      ${S.phone && S.phone.enabled && paired.length ? `<div class="card ob-card">${paired.map(deviceRow).join('')}</div>` : ''}`;
    nav = `<button class="btn ghost" data-ob="back">${esc(t('back'))}</button><div class="btns tight"><button class="btn ghost" data-ob="skip">${esc(t('skip'))}</button><button class="btn accent big" data-ob="next">${esc(t('next'))} ${icon(dir() === 'rtl' ? 'arrow-left' : 'arrow-right', 16, 2.4)}</button></div>`;
  } else {
    body = `<div class="ob-icon done">${icon('check', 42, 2.4)}</div>
      <h1>${esc(t('obDoneTitle'))}</h1><p class="muted">${esc(t('obDoneText'))}</p>
      <div class="card pad-card ob-card"><ul class="tips">
        <li>${icon('maximize-2', 16)}<span>${esc(t('tip1'))}</span></li>
        <li>${icon('volume-2', 16)}<span>${esc(t('tip2'))}</span></li>
        <li>${icon('move', 16)}<span>${esc(t('tip3'))}</span></li>
      </ul></div>`;
    nav = `<button class="btn ghost" data-ob="back">${esc(t('back'))}</button><button class="btn accent big" data-ob="finish">${icon('sparkles', 15)} ${esc(t('finish'))}</button>`;
  }
  return `<div class="ob" data-step="${step}">${obDots()}<div class="ob-body">${body}</div><div class="ob-nav">${nav}</div></div>`;
}

async function obGo(action) {
  if (action === 'next' || action === 'skip') {
    if (obStep === 0 && !S.onboarded) await save({ onboarded: true }, false);
    obStep = Math.min(OB_STEPS.length - 1, obStep + 1);
    cityResults = null;
  } else if (action === 'back') {
    obStep = Math.max(0, obStep - 1);
  } else if (action === 'finish') {
    onboarding = false;
    section = 'welcome';
    if (!S.onboarded) await save({ onboarded: true }, false);
    api.test('dashboard');
  }
  render();
}

// ------------------------------------------------------------------ render
let lastRenderKey = '';
function render(full = true) {
  document.documentElement.lang = lang();
  document.documentElement.dir = dir();
  document.body.dataset.lang = lang();
  document.body.classList.toggle('onboarding', onboarding);
  document.body.classList.toggle('theme-glass', !!S && S.theme === 'glass');
  if (S) document.documentElement.style.setProperty('--tp', String((Number(S.transparency) || 0) / 100));
  const nav = document.getElementById('nav');
  const main = document.getElementById('main');
  const active = document.activeElement;
  const focusId = active && active.id && main.contains(active) ? active.id : null;
  const caret = focusId && active.selectionStart !== undefined ? [active.selectionStart, active.selectionEnd] : null;
  const scroll = main.scrollTop;
  const pickerScroll = main.querySelector('.picker-body') ? main.querySelector('.picker-body').scrollTop : 0;

  nav.innerHTML = onboarding ? '' : SECTIONS.map(([k, ic]) => `<button class="nav-btn ${k === section ? 'on' : ''}" data-go="${k}">${icon(ic, 17)}<span>${esc(t(k))}</span></button>`).join('');
  main.innerHTML = onboarding ? renderOnboarding() : `<div class="page">${SECTION_RENDER[section]()}</div>`;
  const key = onboarding ? `ob${obStep}` : section;
  if (!full || key === lastRenderKey) {
    main.scrollTop = scroll;
    const pb = main.querySelector('.picker-body');
    if (pb) pb.scrollTop = pickerScroll;
  } else {
    main.scrollTop = 0;
    main.firstElementChild.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  const firstShow = key !== lastRenderKey;
  lastRenderKey = key;
  wireFaces(firstShow);
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) {
      el.focus();
      if (caret && el.setSelectionRange) try { el.setSelectionRange(caret[0], caret[1]); } catch (_) { /* number inputs */ }
    }
  }
  loadPickerIcons();
}

function setPath(path, value) {
  const parts = path.split('.');
  const patch = {};
  let cur = patch;
  parts.forEach((p, i) => { if (i === parts.length - 1) cur[p] = value; else { cur[p] = {}; cur = cur[p]; } });
  return patch;
}

// ------------------------------------------------------------------ data loading
async function loadPhone() {
  try { phone = (await api.phone.get()) || { me: null, devices: [] }; } catch (_) { /* ignore */ }
  try { downloadDir = (await api.phone.cmd('downloadDir')) || ''; } catch (_) { downloadDir = ''; }
}
async function loadShortcuts() {
  try { shortcuts = (await api.shortcuts.get()) || []; } catch (_) { shortcuts = []; }
}
async function loadWeather() {
  try { wx = await api.weather.get(); } catch (_) { wx = null; }
}
async function loadInstalled(force = false) {
  installed = null;
  render(false);
  try { installed = (await api.shortcuts.installed(force)) || []; } catch (_) { installed = []; }
  render(false);
}

let iconObserver = null;
const iconQueue = new Set();
function loadPickerIcons() {
  if (!pickerOpen || !installed) return;
  if (iconObserver) iconObserver.disconnect();
  const root = document.querySelector('.picker-body');
  if (!root) return;
  iconObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const idx = Number(e.target.dataset.iconIdx);
      iconObserver.unobserve(e.target);
      const app = installed[idx];
      if (!app || app.icon || iconQueue.has(idx)) continue;
      iconQueue.add(idx);
      api.shortcuts.icon(app).then((ic) => {
        iconQueue.delete(idx);
        if (!ic) return;
        app.icon = ic;
        const host = document.querySelector(`[data-icon-idx="${idx}"]`);
        if (host) host.innerHTML = `<img src="${esc(ic)}" alt="">`;
      }).catch(() => iconQueue.delete(idx));
    }
  }, { root, rootMargin: '120px' });
  root.querySelectorAll('[data-icon-idx]').forEach((el) => { if (!installed[Number(el.dataset.iconIdx)].icon) iconObserver.observe(el); });
}

let cityTimer = null;
let citySeq = 0;
function searchCity(q) {
  cityQuery = q;
  clearTimeout(cityTimer);
  if (q.trim().length < 2) { cityResults = null; cityBusy = false; render(false); return; }
  cityTimer = setTimeout(async () => {
    const seq = ++citySeq;
    cityBusy = true;
    render(false);
    let r;
    try { r = await api.weather.search(q.trim()); } catch (e) { r = { error: true }; }
    if (seq !== citySeq) return;
    cityBusy = false;
    cityResults = Array.isArray(r) ? r : (r && r.error ? { error: true } : []);
    render(false);
  }, 380);
}

async function pickCity(i) {
  const c = cityResults && cityResults[i];
  if (!c) return;
  cityResults = null;
  cityQuery = '';
  wx = null;
  await save({ weather: { city: c } });
  setTimeout(async () => { await loadWeather(); render(false); }, 1800);
}

// ------------------------------------------------------------------ events
document.addEventListener('click', async (e) => {
  const ob = e.target.closest('[data-ob]');
  if (ob) { obGo(ob.dataset.ob); return; }
  const lg = e.target.closest("[data-setlang]");
  if (lg) {
    const code = lg.dataset.setlang;
    S = await api.setLanguage(code);
    if (section === 'widgetsNav') await loadCatalog();
    render(false);
    return;
  }
  const go = e.target.closest('[data-go]');
  if (go) {
    section = go.dataset.go;
    pickerOpen = false; webForm = false; cityResults = null; cityQuery = '';
    if (section === 'phoneNav') await loadPhone();
    if (section === 'shortcutsNav') await loadShortcuts();
    if (section === 'weatherNav') await loadWeather();
    if (section === 'widgetsNav') { feedError = ''; await loadCatalog(); }
    if (section === 'subtitlesNav') { subsTests = {}; subsUserDraft = null; await loadSubs(); }
    if (section === 'gamingNav') { gmProcs = null; await loadGaming(); loadGameLib(false).then(() => { if (section === 'gamingNav') render(false); }); }
    gmProbe();
    render();
    if (section === 'status' || section === 'phoneNav') refreshStatus();
    return;
  }
  const slc = e.target.closest('[data-sublang]');
  if (slc) { toggleSubLang(slc.dataset.sublang); return; }
  const sb = e.target.closest('[data-subs]');
  if (sb) {
    const c = sb.dataset.subs;
    if (c === 'openDir') { await api.subs.cmd('openDir'); return; }
    if (c === 'pickDir') { const d = await api.subs.cmd('pickDir'); if (d) { subsDir = d; render(false); } return; }
    if (c === 'resetDir') { subsDir = (await api.subs.cmd('resetDir')) || ''; render(false); return; }
    if (c === 'test') {
      const id = sb.dataset.id;
      subsTests[id] = { busy: true };
      render(false);
      let r;
      try { r = await api.subs.cmd('test', { provider: id }); } catch (_) { r = { ok: false, code: 'other' }; }
      subsTests[id] = r || { ok: false, code: 'other' };
      render(false);
      return;
    }
    if (c === 'login') {
      const user = (document.getElementById('osUser') || {}).value || '';
      const pass = (document.getElementById('osPass') || {}).value || '';
      if (!pass && user.trim()) { const pe = document.getElementById('osPass'); if (pe && !SC().providers.opensubtitles.passEnc) { pe.classList.add('bad'); return; } }
      await api.subs.cmd('login', { user, pass: pass || '' });
      subsUserDraft = null;
      S = await api.get();
      if (user.trim() && (pass || SC().providers.opensubtitles.passEnc)) {
        subsTests.opensubtitles = { busy: true };
        render(false);
        try { subsTests.opensubtitles = await api.subs.cmd('test', { provider: 'opensubtitles' }); } catch (_) { subsTests.opensubtitles = { ok: false, code: 'other' }; }
      }
      render(false);
      return;
    }
    return;
  }
  const gmm = e.target.closest('[data-gmmetric]');
  if (gmm) {
    const k = gmm.dataset.gmmetric;
    const cur = GC().hud.metrics;
    const next = GX.filter((x) => (x === k ? !cur.includes(k) : cur.includes(x)));
    await save({ gaming: { hud: { metrics: next } } });
    return;
  }
  const gmr = e.target.closest('[data-gmrm]');
  if (gmr) {
    const list = gmr.dataset.gmrm;
    await save({ gaming: { [list]: GC()[list].filter((x) => x !== gmr.dataset.val) } });
    return;
  }
  const gma = e.target.closest('[data-gmadd]');
  if (gma) {
    const list = gma.dataset.gmadd;
    await save({ gaming: { [list]: [...new Set([...GC()[list], gma.dataset.val])] } });
    return;
  }
  const gml = e.target.closest('[data-gmlib]');
  if (gml && api.gaming) {
    const c = gml.dataset.gmlib;
    if (c === 'rescan') { gmLibBusy = true; render(false); await loadGameLib(true); render(false); return; }
    const r = await api.gaming.cmd(c, { id: gml.dataset.id });
    if (Array.isArray(r)) gmLib = r;
    render(false);
    return;
  }
  const gmb = e.target.closest('[data-gm]');
  if (gmb && api.gaming) {
    const c = gmb.dataset.gm;
    if (c === 'procs') {
      if (gmProcs !== null) { gmProcs = null; render(false); return; }
      gmProcs = 'loading'; render(false);
      try { gmProcs = (await api.gaming.cmd('procs')) || []; } catch (_) { gmProcs = []; }
      render(false);
    } else if (c === 'allowFps') {
      gmb.classList.add('busy');
      try { gmAllow = await api.gaming.cmd('allowFps'); } catch (_) { gmAllow = { ok: false }; }
      render(false);
    } else if (c === 'clearSessions') {
      await api.gaming.cmd('clearSessions');
      await loadGaming();
      render(false);
    }
    return;
  }
  const wc = e.target.closest('[data-wchip]');
  if (wc) { e.preventDefault(); toggleChip(wc.dataset.wchip, wc.dataset.val); return; }
  const sg = e.target.closest('[data-seg]');
  if (sg) { save(setPath(sg.dataset.seg, sg.dataset.val)); return; }
  const test = e.target.closest('[data-test]');
  if (test) {
    test.classList.add('pulse');
    setTimeout(() => test.classList.remove('pulse'), 500);
    api.test(test.dataset.test);
    return;
  }
  const url = e.target.closest('[data-url]');
  if (url) { api.action('openUrl', url.dataset.url); return; }
  const city = e.target.closest('[data-city]');
  if (city) { pickCity(Number(city.dataset.city)); return; }
  const ph = e.target.closest('[data-phone]');
  if (ph) {
    const c = ph.dataset.phone;
    const id = ph.dataset.id;
    if (c === 'connectIp') {
      const ip = (document.getElementById('ipInput') || {}).value || '';
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim())) { document.getElementById('ipInput').classList.add('bad'); return; }
      ipBusy = true; render(false);
      await api.phone.cmd('connectIp', { ip });
      setTimeout(() => { ipBusy = false; render(false); }, 1500);
      return;
    }
    if (c === 'sendFile') { await api.phone.cmd('pickAndSend', { deviceId: id, from: 'settings' }); return; }
    if (c === 'btScan') {
      if (await api.phone.cmd('btScan')) { btScanning = true; render(false); setTimeout(() => { btScanning = false; render(false); }, 120000); }
      return;
    }
    if (c === 'openDownloads') { await api.phone.cmd('openDownloads'); return; }
    if (c === 'pickDownloadDir') { const d = await api.phone.cmd('pickDownloadDir'); if (d) { downloadDir = d; render(false); } return; }
    if (c === 'unpair' && !confirm(`${t('unpair')}: ${(phone.devices.find((d) => d.id === id) || {}).name || ''}?`)) return;
    await api.phone.cmd(c === 'find' ? 'find' : c, c === 'find' ? { deviceId: id } : { id });
    if (c === 'refresh') { ph.classList.add('spin'); setTimeout(() => ph.classList.remove('spin'), 900); }
    return;
  }
  const cmdRm = e.target.closest('[data-cmdrm]');
  if (cmdRm) {
    const list = ((S.phone && S.phone.commands) || []).filter((c) => c.id !== cmdRm.dataset.cmdrm);
    await save({ phone: { commands: list } }, true);
    return;
  }
  const kk = e.target.closest('[data-keykind]');
  if (kk) { keyForm = kk.dataset.keykind; keyDraft = { name: keyDraft.name, target: '', hotkey: null }; render(false); return; }
  const ka = e.target.closest('[data-keyadd]');
  if (ka) {
    const kind = ka.dataset.keyadd;
    const val = ka.dataset.val;
    const m = DM.MEDIA.find((x) => x[0] === val);
    await api.shortcuts.addKey({ kind, target: val, name: kind === 'media' && m ? t(m[2]) : t(val) });
    await loadShortcuts();
    render(false);
    return;
  }
  const ks = e.target.closest('[data-keyset]');
  if (ks) {
    await api.shortcuts.update(ks.dataset.id, { [ks.dataset.keyset]: ks.dataset.val });
    await loadShortcuts();
    render(false);
    return;
  }
  const rec = e.target.closest('#keyRec');
  if (rec) { recordHotkey(rec); return; }
  const sc = e.target.closest('[data-sc]');
  if (sc) {
    const c = sc.dataset.sc;
    const id = sc.dataset.id;
    if (c === 'edit') { editKey = editKey === id ? null : id; render(false); return; }
    if (c === 'remove' && editKey === id) editKey = null;
    if (c === 'launch') api.shortcuts.launch(id);
    else if (c === 'remove') await api.shortcuts.remove(id);
    else if (c === 'up' || c === 'down') await api.shortcuts.move(id, c === 'up' ? -1 : 1);
    if (c !== 'launch') { await loadShortcuts(); render(false); }
    return;
  }
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    const a = installed[Number(pick.dataset.pick)];
    if (!a) return;
    pick.classList.add('adding');
    await api.shortcuts.add({ name: a.name, kind: a.kind, target: a.target, iconPath: a.iconPath });
    await loadShortcuts();
    render(false);
    return;
  }
  const act = e.target.closest('[data-action]');
  if (act) {
    if (act.dataset.action === 'winsettings-notif') api.action('openUrl', 'ms-settings:notifications');
    else api.action(act.dataset.action);
    return;
  }
  const cmd = e.target.closest('[data-cmd]');
  if (cmd) {
    const c = cmd.dataset.cmd;
    if (c === 'restart') { api.restartHelper(); setTimeout(refreshStatus, 4000); }
    else if (c === 'logs') api.openLogs();
    else if (c === 'quit') api.quit();
    else if (c === 'reset') { S = await api.reset(); render(false); }
    else if (c === 'resetPos') save({ position: null });
    else if (c === 'wxRefresh') { cmd.classList.add('spin'); await api.weather.refresh(); setTimeout(async () => { await loadWeather(); render(false); }, 1500); }
    else if (c === 'keyform') { keyForm = keyForm ? null : 'hotkey'; pickerOpen = false; webForm = false; keyDraft = { name: '', target: '', hotkey: null }; render(false); }
    else if (c === 'picker') { pickerOpen = !pickerOpen; webForm = false; keyForm = null; if (pickerOpen && !installed) loadInstalled(); else render(false); }
    else if (c === 'web') { webForm = !webForm; pickerOpen = false; keyForm = null; render(false); if (webForm) setTimeout(() => { const f = document.querySelector('#webForm input'); if (f) f.focus(); }, 30); }
    else if (c === 'webCancel') { webForm = false; render(false); }
    else if (c === 'browse') { if (await api.shortcuts.browse()) { await loadShortcuts(); render(false); } }
    return;
  }
  const kb = e.target.closest('#shortcut');
  if (kb) recordShortcut(kb);
});

function recordShortcut(kb) {
  kb.textContent = t('pressKeys');
  kb.classList.add('rec');
  const onKey = (ev) => {
    ev.preventDefault();
    const mods = [];
    if (ev.ctrlKey) mods.push('Control');
    if (ev.altKey) mods.push('Alt');
    if (ev.shiftKey) mods.push('Shift');
    if (ev.metaKey) mods.push('Super');
    const k = ev.key;
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(k)) return;
    let key = k === ' ' ? 'Space' : (k.length === 1 ? k.toUpperCase() : k);
    if (/^Arrow/.test(key)) key = key.replace('Arrow', '');
    document.removeEventListener('keydown', onKey, true);
    kb.classList.remove('rec');
    if (key === 'Escape' || !mods.length) { render(false); return; }
    save({ shortcut: [...mods, key].join('+') });
  };
  document.addEventListener('keydown', onKey, true);
}

document.addEventListener('submit', async (e) => {
  if (e.target.id === 'feedForm') { e.preventDefault(); addFeed(e.target.elements.url.value); return; }
  if (e.target.id === 'keyForm') {
    e.preventDefault();
    const nameEl = document.getElementById('keyName');
    const targetEl = document.getElementById('keyTarget');
    const item = { kind: keyForm, name: nameEl.value.trim() };
    if (keyForm === 'hotkey') {
      if (!keyDraft.hotkey) { const b = document.getElementById('keyRec'); if (b) b.classList.add('bad'); return; }
      Object.assign(item, { vk: keyDraft.hotkey.vk, mods: keyDraft.hotkey.mods, target: keyDraft.hotkey.label });
      if (!item.name) item.name = keyDraft.hotkey.label;
    } else {
      item.target = keyForm === 'command' ? targetEl.value.trim() : targetEl.value;
      if (!item.target.trim()) { targetEl.classList.add('bad'); return; }
      if (!item.name) item.name = item.target.trim().slice(0, 24);
    }
    if (!(await api.shortcuts.addKey(item))) { (targetEl || nameEl).classList.add('bad'); return; }
    keyDraft = { name: '', target: '', hotkey: null };
    if (document.activeElement) document.activeElement.blur();
    await loadShortcuts();
    render(false);
    return;
  }
  if (e.target.id === 'cmdForm') {
    e.preventDefault();
    const nameEl = document.getElementById('cmdName');
    const cmdEl = document.getElementById('cmdCommand');
    const name = nameEl.value.trim();
    const command = cmdEl.value.trim();
    if (!name) { nameEl.classList.add('bad'); return; }
    if (!command) { cmdEl.classList.add('bad'); return; }
    const list = ((S.phone && S.phone.commands) || []).slice(0, 29);
    list.push({ id: `c${Date.now().toString(36)}`, name: name.slice(0, 40), command: command.slice(0, 400) });
    if (document.activeElement) document.activeElement.blur();
    await save({ phone: { commands: list } }, true);
    return;
  }
  if (e.target.id !== 'webForm') return;
  e.preventDefault();
  const f = e.target;
  let url = f.elements.url.value.trim();
  const name = f.elements.name.value.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try { const u = new URL(url); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) throw new Error('bad'); } catch (_) { f.elements.url.classList.add('bad'); return; }
  await api.shortcuts.add({ name: name || new URL(url).hostname, kind: 'url', target: url });
  webForm = false;
  await loadShortcuts();
  render(false);
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('input[type=checkbox][data-path]')) save(setPath(el.dataset.path, el.checked));
  else if (el.matches('input[type=range][data-path]')) save(setPath(el.dataset.path, Number(el.value)));
  else if (el.matches('input.text[data-path]')) {
    if (el.dataset.path.endsWith('.key')) subsTests[el.dataset.path.split('.')[2]] = null;
    save(setPath(el.dataset.path, el.value.trim().slice(0, 200)));
  }
  else if (el.id === 'blocked') save({ notifications: { blocked: el.value.split(',').map((s) => s.trim()).filter(Boolean) } });
  else if (el.id === 'display') save({ display: el.value });
  else if (el.id === 'gmHotkey') save({ gaming: { hud: { hotkey: el.value } } });
  else if (el.dataset.keyname) { const v = el.value.trim(); if (v) api.shortcuts.update(el.dataset.keyname, { name: v }).then(loadShortcuts).then(() => render(false)); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('input[type=range]')) {
    const out = el.parentElement.querySelector('output');
    const fmt = FMT[el.dataset.fmt];
    if (out && fmt) out.textContent = fmt(Number(el.value));
    if (el.dataset.path === 'transparency') {
      const tp = String(Number(el.value) / 100);
      document.documentElement.style.setProperty('--tp', tp);
      const pick = document.querySelector('.theme-pick');
      if (pick) pick.style.setProperty('--tp', tp);
    }
  } else if (el.id === 'cityInput') searchCity(el.value);
  else if (el.id === 'appSearch') { pickerQuery = el.value; render(false); }
  else if (el.id === 'keyName') keyDraft.name = el.value;
  else if (el.id === 'osUser') subsUserDraft = el.value;
  else if (el.id === 'keyTarget') { keyDraft.target = el.value; el.classList.remove('bad'); }
  else if (el.id === 'feedUrl') { feedDraft = el.value; if (feedError) { feedError = ''; el.classList.remove('bad'); } }
  else if (el.classList.contains('bad')) el.classList.remove('bad');
});

document.addEventListener('submit', async (e) => {
  const f = e.target.closest('[data-gmform]');
  if (!f) return;
  e.preventDefault();
  const list = f.dataset.gmform;
  const v = String(f.exe.value || '').trim().split(/[\\/]/).pop().replace(/\.exe$/i, '').toLowerCase().slice(0, 80);
  if (!v) { f.exe.classList.add('bad'); return; }
  const other = list === 'games' ? 'ignore' : 'games';
  await save({ gaming: { [list]: [...new Set([...GC()[list], v])], [other]: GC()[other].filter((x) => x !== v) } });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'cityInput' && cityResults && cityResults.length) { e.preventDefault(); pickCity(0); }
  if (e.key === 'Enter' && e.target.id === 'ipInput') { e.preventDefault(); const b = document.querySelector('[data-phone="connectIp"]'); if (b) b.click(); }
});

async function refreshStatus() {
  try { statusData = await api.status(); } catch (_) { statusData = null; }
  if (['status', 'about', 'phoneNav'].includes(section) && !onboarding) render(false);
}

// typing in a field must not be interrupted by background updates
function busyTyping() {
  const a = document.activeElement;
  return a && a.tagName === 'INPUT' && a.type !== 'checkbox' && a.type !== 'range';
}

api.on('settings', (s) => {
  const dirChanged = !S || !s || JSON.stringify((S.subtitles || {}).dir) !== JSON.stringify((s.subtitles || {}).dir);
  S = s;
  if (dirChanged && api.subs) loadSubs().then(() => { if (section === 'subtitlesNav' && !busyTyping()) render(false); });
  if (!busyTyping()) render(false);
});
api.on('status', (st) => {
  if (statusData) statusData.helper = st && st.helper ? st.helper : st;
  if ((section === 'status' || section === 'phoneNav') && !onboarding && !busyTyping()) render(false);
});
const TAB_ALIAS = { shortcuts: 'shortcutsNav', weather: 'weatherNav', phone: 'phoneNav', notifications: 'notificationsNav', widgets: 'widgetsNav', subtitles: 'subtitlesNav', gaming: 'gamingNav' };
async function openTab(tab) {
  if (!tab) return;
  if (tab === 'onboarding') { onboarding = true; obStep = 0; render(); return; }
  const sec = TAB_ALIAS[tab] || tab;
  if (!SECTIONS.some(([k]) => k === sec)) return;
  onboarding = false;
  section = sec;
  pickerOpen = false; webForm = false; cityResults = null; cityQuery = '';
  if (sec === 'shortcutsNav') await loadShortcuts();
  if (sec === 'weatherNav') await loadWeather();
  if (sec === 'phoneNav') await loadPhone();
  if (sec === 'widgetsNav') await loadCatalog();
  if (sec === 'subtitlesNav') await loadSubs();
  if (sec === 'gamingNav') { await loadGaming(); loadGameLib(false).then(() => { if (section === 'gamingNav') render(false); }); }
  gmProbe();
  render();
}

let gmProbing = false;
function gmProbe() {
  const want = section === 'gamingNav' && !onboarding && !document.hidden;
  if (want === gmProbing || !api.gaming) return;
  gmProbing = want;
  api.gaming.cmd('probe', { on: want }).catch(() => {});
}
document.addEventListener('visibilitychange', gmProbe);
window.addEventListener('beforeunload', () => { if (gmProbing && api.gaming) api.gaming.cmd('probe', { on: false }); });
api.on('settings:tab', (tab) => { openTab(tab); });
api.on('phone', (p) => {
  if (p && p.type === 'devices') {
    phone = { me: p.me, devices: p.devices || [] };
    if ((section === 'phoneNav' || (onboarding && OB_STEPS[obStep] === 'phone')) && !busyTyping()) render(false);
  }
});
api.on('weather', (w) => {
  wx = w;
  if ((section === 'weatherNav' || (onboarding && OB_STEPS[obStep] === 'city')) && !busyTyping()) render(false);
});
api.on('gamingLibrary', () => { if (section === 'gamingNav') loadGameLib(false).then(() => render(false)); });
api.on('gaming', (g) => {
  gm = g;
  const sig = gmSig(g);
  if (sig === gmSig.last) return;
  gmSig.last = sig;
  if (section === 'gamingNav' && !onboarding && !busyTyping()) render(false);
});
api.on('shortcuts', (list) => { shortcuts = list || []; if (section === 'shortcutsNav' && !busyTyping()) render(false); });

// the titlebar logo: a tiny Blinkelo face that blinks every few seconds
(() => {
  const bf = document.getElementById('brandFace');
  if (!bf) return;
  bf.innerHTML = faceHtml('bk-xs');
  createBlinker(bf.firstElementChild, { auto: true, gap: [3200, 8200] });
})();

(async () => {
  S = await api.get();
  try { displays = await api.displays(); } catch (_) { displays = []; }
  if (api.platform !== 'win32') document.body.classList.add('solid');
  const hash = location.hash ? location.hash.slice(1) : '';
  const startTab = PARAMS.get('tab') || hash;
  if (!S.onboarded || startTab === 'onboarding') onboarding = true;
  else if (startTab) { const sec = TAB_ALIAS[startTab] || startTab; if (SECTIONS.some(([k]) => k === sec)) section = sec; }
  if (PARAMS.has('step')) obStep = Number(PARAMS.get('step')) || 0;
  await Promise.all([loadPhone(), loadShortcuts(), loadWeather(), loadCatalog(), loadSubs(), loadGaming()]);
  render();
  gmProbe();
  refreshStatus();
})();

// ------------------------------------------------------------------ browser preview mock
function mockApi() {
  let s = {
    language: PARAMS.get('lang') || 'en', onboarded: !PARAMS.has('ob'), style: 'floating', scale: 1, topOffset: 8,
    accent: 'auto', glow: true, edgeLight: true, blink: { hello: true, peeks: false, events: true }, idleClock: false, hideInFullscreen: true, callsOverFullscreen: true, respectDnd: true,
    startWithWindows: false, shortcut: 'Control+Alt+Space', sound: true, display: 'primary', movable: true, position: { fx: 0.3, dy: 0 }, minimized: false, hidden: false,
    weather: { enabled: true, unit: 'c', city: PARAMS.has('nocity') ? null : { name: 'London', country: 'United Kingdom', admin1: 'England', lat: 51.51, lon: -0.13 } },
    phone: { enabled: true, bluetooth: true, remoteInput: true, clipboard: true, clipboardImages: true, forwardNotifications: true, openLinks: true, cameraToClipboard: true, downloadDir: '', commands: [{ id: 'c1', name: 'Open Downloads', command: 'explorer shell:Downloads' }] },
    modules: { media: true, visualizer: true, notifications: true, phoneCalls: true, volumeHud: true, battery: true, capsLock: true, numLock: false, clipboard: true, privacy: true, stats: true, shelf: true, timer: true, weather: true },
    notifications: { duration: 5, blocked: [], showBody: true }, media: { pausedTimeout: 25, compactInfo: true },
    widgets: { active: 'crypto', crypto: { enabled: true, coins: ['BTC', 'ETH', 'USDT', 'TON'] }, news: { enabled: true, feeds: [], custom: [] }, clocks: { enabled: true, zones: ['Europe/London', 'America/New_York', 'Europe/Paris', 'Asia/Tokyo'] } },
  };
  s.modules.widgets = true;
  s.gaming = {
    enabled: true, auto: true, autoOptimize: false, restoreOnExit: true, quiet: true, fps: true, temp: 'c', pingHost: '8.8.8.8',
    hud: { enabled: true, show: 'game', position: 'center', size: 'm', opacity: 88, metrics: ['fps', 'low1', 'cpu', 'cpuTemp', 'gpu', 'gpuTemp', 'vram', 'ram', 'ping', 'clock'], hotkey: 'Control+Shift+G' },
    optimize: { power: true, gameMode: true, memory: true, priority: 'above', closeApps: true, dvr: false },
    closeList: ['onedrive'], forceClose: false, reopen: true, games: ['eldenring'], ignore: [],
  };
  const merge = (a, b) => {
    if (!b || typeof b !== 'object' || Array.isArray(b)) return b === undefined ? a : b;
    const o = { ...(a || {}) };
    Object.keys(b).forEach((k) => { o[k] = merge(o[k], b[k]); });
    return o;
  };
  let sc = [
    { id: '1', name: 'Visual Studio Code', kind: 'file', target: 'C:\\Users\\me\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe', icon: null },
    { id: '2', name: 'Telegram', kind: 'file', target: 'C:\\Users\\me\\AppData\\Roaming\\Telegram Desktop\\Telegram.exe', icon: null },
    { id: '3', name: 'GitHub', kind: 'url', target: 'https://github.com', icon: null },
  ];
  const apps = ['Adobe Photoshop 2025', 'Blender', 'Calculator', 'Discord', 'Figma', 'Firefox', 'Google Chrome', 'Microsoft Edge', 'Notepad', 'OBS Studio', 'Paint', 'Spotify', 'Steam', 'Telegram', 'Terminal', 'VLC media player', 'Visual Studio Code', 'Word', 'Excel', 'PowerPoint', 'WhatsApp', 'Zoom']
    .map((n, i) => ({ name: n, kind: i % 5 === 0 ? 'aumid' : 'file', target: `C:\\Apps\\${n}.lnk` }));
  const phoneData = {
    me: { id: 'pc', name: 'My-PC', port: 1716, ips: ['192.168.1.20'] },
    devices: [
      { id: 'p1', name: 'Galaxy S24', type: 'phone', address: '192.168.1.34', connected: true, paired: true, pairState: 'paired', battery: 76, charging: true, wifi: true, bluetooth: true, island: { app: 'Blinkelo Link' } },
      { id: 'p2', name: 'Pixel 8', type: 'phone', address: '192.168.1.41', connected: true, paired: false, pairState: 'requestedByPeer', verifyKey: '7F3A9C21' },
      { id: 'p3', name: 'Redmi Note 13', type: 'phone', address: '192.168.1.52', connected: true, paired: false, pairState: 'none' },
    ],
  };
  const weatherData = { city: 'London', unit: 'c', updatedAt: Date.now(), current: { temp: 17.6, feels: 16, humidity: 40, wind: 10, code: 1, isDay: true } };
  return {
    platform: 'demo',
    get: async () => s,
    set: async (p) => { s = merge(s, p); return s; },
    setLanguage: async (code) => { s = { ...s, language: code }; return s; },
    reset: async () => s,
    status: async () => ({ helper: { core: { ok: true, detail: 'PowerShell 5.1.26100' }, media: { ok: true, detail: 'ok' }, audio: { ok: true, detail: 'ok' }, system: { ok: true, detail: 'ok' }, notifications: { ok: true, detail: 'ok' }, uia: { ok: true, detail: 'ok' }, phone: { ok: true, detail: 'listening on 1716 · 3 devices' }, weather: { ok: true, detail: 'London · 17.6°' } }, version: '1.0.0', electron: '45.2.3', platform: 'win32' }),
    displays: async () => [{ id: '1', label: 'Display 1', primary: true, size: '2560×1440' }],
    test: async () => true, restartHelper: async () => true, openLogs: async () => true, action: async () => true, quit: async () => true,
    shortcuts: {
      get: async () => sc,
      installed: async () => apps,
      icon: async () => null,
      add: async (it) => { sc = [...sc, { id: String(Date.now()), ...it }]; return true; },
      remove: async (id) => { sc = sc.filter((x) => x.id !== id); return true; },
      move: async () => true,
      browse: async () => false,
      launch: async () => true,
      addKey: async (it) => { sc = [...sc, { id: String(Date.now()), ...it }]; return true; },
      update: async (id, p) => { sc = sc.map((x) => (x.id === id ? { ...x, ...p } : x)); return true; },
    },
    weather: {
      search: async (q) => [{ name: q[0].toUpperCase() + q.slice(1), country: 'Canada', admin1: 'Province', lat: 1, lon: 1 }, { name: `${q} Heights`, country: 'United States', admin1: 'Ohio', lat: 2, lon: 2 }],
      get: async () => weatherData,
      refresh: async () => true,
    },
    phone: { get: async () => phoneData, cmd: async (n) => (n === 'downloadDir' ? 'C:\\Users\\me\\Downloads\\Blinkelo' : true) },
    gaming: {
      get: async () => ({
        enabled: true, manual: false, active: PARAMS.has('playing'), candidate: null, optimized: false, hud: PARAMS.has('playing'),
        game: PARAMS.has('playing') ? { id: 'g1', name: 'witcher3', title: 'The Witcher 3', start: Date.now() - 600000, front: true } : null,
        fullscreen: PARAMS.get('playing') === 'fs',
        metrics: PARAMS.has('notemp') ? { cpuTemp: null, cpuTempSrc: '', gpuTemp: 54, gpuTempSrc: 'nvidia' } : { cpuTemp: 58, cpuTempSrc: 'lhm', gpuTemp: 54, gpuTempSrc: 'nvidia' },
        fps: { etw: PARAMS.has('denied') ? 'denied' : 'ok', rtss: false },
        rtss: { installed: !PARAMS.has('nortss'), running: PARAMS.has('rtss') },
        opt: { running: false, steps: [] },
        sessions: [{ id: 'a', name: 'eldenring', title: 'ELDEN RING', start: Date.now() - 90000000, end: Date.now() - 86000000, dur: 4325, avgFps: 96, low1: 61, maxCpuTemp: 74, maxGpuTemp: 79 },
          { id: 'b', name: 'cs2', title: 'Counter-Strike 2', start: Date.now() - 190000000, end: Date.now() - 187000000, dur: 2710, avgFps: 287, low1: 141, maxCpuTemp: 81, maxGpuTemp: 70 }],
      }),
      cmd: async (n) => {
        if (n === 'procs') { await new Promise((r) => setTimeout(r, 400)); return [['Discord', 'Discord', 412e6], ['chrome', 'YouTube - Google Chrome', 1.9e9], ['OneDrive', '', 120e6], ['Teams', 'Microsoft Teams', 610e6], ['steamwebhelper', '', 330e6]].map(([name, title, mem], i) => ({ pid: 100 + i, name, title, mem, path: `C:\\Apps\\${name}.exe` })); }
        if (n === 'allowFps') { await new Promise((r) => setTimeout(r, 600)); return { ok: true }; }
        if (n === 'library' || n === 'hideGame' || n === 'unhideGame') {
          mockApi.lib = mockApi.lib || [['Cyberpunk 2077', 'steam'], ['ELDEN RING', 'steam'], ['Fortnite', 'epic'], ['The Witcher 3', 'gog'], ['Valorant', 'played'], ['RetroArch', 'custom']].map(([name, source], i) => ({ id: `m${i}`, name, source, hidden: i === 2, icon: null }));
          return mockApi.lib;
        }
        return true;
      },
    },
    subs: {
      get: async () => null,
      cmd: async (n, a) => {
        if (n === 'dir' || n === 'resetDir') return (s.subtitles && s.subtitles.dir) || 'C:\\Users\\me\\Downloads\\Subtitles';
        if (n === 'pickDir') { s = merge(s, { subtitles: { dir: 'D:\\Movies\\Subtitles' } }); return 'D:\\Movies\\Subtitles'; }
        if (n === 'test') { await new Promise((r) => setTimeout(r, 600)); return a.provider === 'opensubtitles' ? { ok: false, code: 'key' } : { ok: true, count: 24 }; }
        if (n === 'login') { s = merge(s, { subtitles: { providers: { opensubtitles: { user: a.user, passEnc: a.pass ? 'x' : '' } } } }); return true; }
        return true;
      },
    },
    widgets: {
      catalog: async () => ({
        coins: [['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['USDT', 'Tether'], ['BNB', 'BNB'], ['SOL', 'Solana'], ['XRP', 'XRP'], ['TON', 'Toncoin'], ['DOGE', 'Dogecoin'], ['TRX', 'TRON'], ['ADA', 'Cardano'], ['LTC', 'Litecoin'], ['NOT', 'Notcoin']].map(([sym, name]) => ({ sym, name })),
        feeds: [['bbc-world', 'BBC World', 'en'], ['verge', 'The Verge', 'en'], ['hn', 'Hacker News', 'en'], ['bbc-ar', 'BBC عربي', 'ar'], ['bbc-tr', 'BBC Türkçe', 'tr'], ['bbc-es', 'BBC Mundo', 'es'], ['bbc-ru', 'BBC Русская служба', 'ru'], ['bbc-zh', 'BBC 中文', 'zh']].map(([id, name, l]) => ({ id, name, lang: l, url: '' })),
        defaultFeeds: ['bbc-world', 'verge'],
      }),
      testFeed: async (url) => (/bad/.test(url) ? { ok: false } : { ok: true, count: 12, title: 'Example Feed' }),
      get: async () => null,
      refresh: async () => true,
    },
    on: () => () => {},
  };
}
