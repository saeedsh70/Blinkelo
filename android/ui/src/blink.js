// Blinkelo blink kit (same file as the Windows app: src/renderer/shared/blink.js). The brand "face" and its moves.
// Shared by the island, the settings window and (copied) the Blinkelo Link phone UI.
// Animations are CSS keyframes (blink.css) switched on with classes, so nothing here runs per frame.
//
//   el.innerHTML = faceHtml('bk-lg');
//   const face = createBlinker(el.firstElementChild, { auto: true });
//   face.wink(); face.look(-1); face.hello(); face.sleep(); face.destroy();

export const BLINK_MS = { blink: 240, blink2: 560, wink: 920, look: 1000, wake: 720, sleep: 280 };
const PLAY = ['is-blink', 'is-blink2', 'is-wink', 'is-look', 'is-wake'];

export function reducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) { return false; }
}

/** Markup of a face. `cls` adds size / context classes (bk-xs, bk-sm, bk-lg, bk-xl, asleep, dozing...);
 *  `role` is stored as data-face so a page can find and wire its faces after rendering. */
export function faceHtml(cls = '', role = '') {
  return `<span class="bk ${cls}"${role ? ` data-face="${role}"` : ''} dir="ltr" aria-hidden="true"><span class="bk-face">`
    + '<i class="bk-eye bk-l"><b class="bk-ball"></b></i>'
    + '<i class="bk-eye bk-r"><b class="bk-ball"></b><svg class="bk-arc" viewBox="0 0 24 12" focusable="false"><path d="M3.2 10 Q12 1.4 20.8 10"/></svg></i>'
    + '</span></span>';
}

/**
 * Brings a face element (from faceHtml) to life.
 * opts.auto: blink on its own every few seconds (random, with the odd double blink, glance or wink).
 * opts.gap: [min, max] ms between automatic moves.
 * opts.onMove(kind): called when a move starts (the island uses it to squash its pill a little).
 */
export function createBlinker(el, opts = {}) {
  const gap = opts.gap || [2400, 6400];
  const timers = new Set();
  let alive = true;
  let autoOn = false;
  let autoTimer = null;
  let busyUntil = 0;

  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms);
    timers.add(t);
    return t;
  };
  const wait = (ms) => new Promise((r) => later(r, ms));

  function play(cls, ms, kind) {
    if (!alive || !el) return Promise.resolve();
    el.classList.remove(...PLAY);
    void el.offsetWidth; // restart the keyframes even when the same move repeats
    el.classList.add(cls);
    busyUntil = performance.now() + ms;
    if (opts.onMove) { try { opts.onMove(kind); } catch (_) { /* cosmetic */ } }
    later(() => el.classList.remove(cls), ms + 40);
    return wait(ms);
  }

  const api = {
    el,
    get busy() { return performance.now() < busyUntil; },
    blink() { return play('is-blink', BLINK_MS.blink, 'blink'); },
    blink2() { return play('is-blink2', BLINK_MS.blink2, 'blink2'); },
    wink() { return play('is-wink', BLINK_MS.wink, 'wink'); },
    look(dir = 1) {
      el.style.setProperty('--bk-dir', dir < 0 ? '-1' : '1');
      return play('is-look', BLINK_MS.look, 'look');
    },
    wake() {
      el.classList.remove('asleep');
      return play('is-wake', BLINK_MS.wake, 'wake');
    },
    sleep() {
      el.classList.remove(...PLAY);
      el.classList.add('asleep');
      busyUntil = performance.now() + BLINK_MS.sleep;
      return wait(BLINK_MS.sleep);
    },
    /** The signature hello: open, glance both ways, blink, wink. */
    async hello() {
      await api.wake();
      await wait(180);
      await api.look(-1);
      await api.look(1);
      await wait(120);
      await api.blink();
      await wait(220);
      await api.wink();
    },
    /** One random idle move, weighted towards plain blinks. */
    random() {
      const r = Math.random();
      if (r < 0.62) return api.blink();
      if (r < 0.8) return api.blink2();
      if (r < 0.93) return api.look(Math.random() < 0.5 ? -1 : 1);
      return api.wink();
    },
    start() {
      if (autoOn) return api;
      autoOn = true;
      schedule(900 + Math.random() * 1600);
      return api;
    },
    stop() {
      autoOn = false;
      if (autoTimer) { clearTimeout(autoTimer); timers.delete(autoTimer); autoTimer = null; }
      return api;
    },
    destroy() {
      alive = false;
      autoOn = false;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      if (el) el.classList.remove(...PLAY);
    },
  };

  function schedule(ms) {
    if (!autoOn) return;
    autoTimer = later(() => {
      autoTimer = null;
      if (!autoOn) return;
      const idleOk = !document.hidden && !reducedMotion() && el.isConnected && !api.busy;
      if (idleOk) api.random();
      schedule(gap[0] + Math.random() * (gap[1] - gap[0]));
    }, ms);
  }

  if (opts.auto) api.start();
  return api;
}

/** Eyes follow the pointer inside `area` (the about page hero). Returns a function that removes the listeners. */
export function followPointer(face, area, reach = 1) {
  if (!face || !area) return () => {};
  const move = (e) => {
    const r = face.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 260));
    const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 200));
    face.style.setProperty('--bk-tx', (dx * reach).toFixed(3));
    face.style.setProperty('--bk-ty', (dy * reach).toFixed(3));
  };
  const leave = () => { face.style.setProperty('--bk-tx', '0'); face.style.setProperty('--bk-ty', '0'); };
  area.addEventListener('pointermove', move);
  area.addEventListener('pointerleave', leave);
  return () => { area.removeEventListener('pointermove', move); area.removeEventListener('pointerleave', leave); };
}
