// Phone as a PC touchpad: 1 finger moves, tap clicks, 2-finger tap = right click, 3-finger tap = middle click,
// 2-finger drag scrolls, long press starts a drag (released on lift).

export class Touchpad {
  constructor(el, { send, haptic, settings }) {
    this.el = el;
    this.send = send;
    this.haptic = haptic || (() => {});
    this.settings = settings || (() => ({}));
    this.reset();
    this.pending = { dx: 0, dy: 0, sx: 0, sy: 0 };
    this.raf = 0;
    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
    el.addEventListener('touchstart', this.onStart, { passive: false });
    el.addEventListener('touchmove', this.onMove, { passive: false });
    el.addEventListener('touchend', this.onEnd, { passive: false });
    el.addEventListener('touchcancel', this.onEnd, { passive: false });
    // desktop preview: mouse drags move the pointer
    this.mouseDown = false;
    this.onMouseDown = (e) => { this.mouseDown = true; this.last = { x: e.clientX, y: e.clientY }; this.moved = 0; this.startTime = Date.now(); };
    this.onMouseMove = (e) => {
      if (!this.mouseDown) return;
      const dx = e.clientX - this.last.x; const dy = e.clientY - this.last.y;
      this.last = { x: e.clientX, y: e.clientY };
      this.moved += Math.abs(dx) + Math.abs(dy);
      this.queueMove(dx, dy);
    };
    this.onMouseUp = () => {
      if (this.mouseDown && this.moved < 6 && Date.now() - this.startTime < 300) this.click('singleclick');
      this.mouseDown = false;
    };
    el.addEventListener('mousedown', this.onMouseDown);
    el.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  destroy() {
    const el = this.el;
    el.removeEventListener('touchstart', this.onStart);
    el.removeEventListener('touchmove', this.onMove);
    el.removeEventListener('touchend', this.onEnd);
    el.removeEventListener('touchcancel', this.onEnd);
    el.removeEventListener('mousedown', this.onMouseDown);
    el.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    cancelAnimationFrame(this.raf);
    clearTimeout(this.holdTimer);
    if (this.dragging) this.send({ singlerelease: true });
    this.mouseDown = false;
    this.reset();
    this.el.classList.remove('active', 'dragging');
  }

  reset() {
    this.maxTouches = 0;
    this.moved = 0;
    this.startTime = 0;
    this.dragging = false;
    this.last = null;
    this.lastMoveAt = 0;
    clearTimeout(this.holdTimer);
  }

  centroid(touches) {
    let x = 0; let y = 0;
    for (let i = 0; i < touches.length; i += 1) { x += touches[i].clientX; y += touches[i].clientY; }
    return { x: x / touches.length, y: y / touches.length };
  }

  onStart(e) {
    e.preventDefault();
    const n = e.touches.length;
    if (this.maxTouches === 0) {
      this.startTime = Date.now();
      this.moved = 0;
      this.holdTimer = setTimeout(() => {
        if (this.moved < 12 && this.maxTouches === 1) {
          this.dragging = true;
          this.send({ singlehold: true });
          this.haptic(35);
          this.el.classList.add('dragging');
        }
      }, 480);
    }
    this.maxTouches = Math.max(this.maxTouches, n);
    if (n > 1) clearTimeout(this.holdTimer);
    this.last = this.centroid(e.touches);
    this.el.classList.add('active');
  }

  onMove(e) {
    e.preventDefault();
    if (!this.last) return;
    const c = this.centroid(e.touches);
    const dx = c.x - this.last.x;
    const dy = c.y - this.last.y;
    this.last = c;
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.moved > 12) clearTimeout(this.holdTimer);
    if (e.touches.length === 1) this.queueMove(dx, dy);
    else if (e.touches.length === 2) this.queueScroll(dx, dy);
  }

  onEnd(e) {
    e.preventDefault();
    const cancelled = e.type === 'touchcancel';
    if (!cancelled && e.touches.length > 0) { this.last = this.centroid(e.touches); return; }
    clearTimeout(this.holdTimer);
    const dur = Date.now() - this.startTime;
    if (this.dragging) {
      this.flush();
      this.send({ singlerelease: true });
      this.el.classList.remove('dragging');
    } else if (!cancelled && this.moved < 14 && dur < 300) {
      if (this.maxTouches === 1) this.click('singleclick');
      else if (this.maxTouches === 2) this.click('rightclick');
      else if (this.maxTouches >= 3) this.click('middleclick');
    }
    this.el.classList.remove('active');
    this.reset();
  }

  click(kind) {
    this.flush();
    this.send({ [kind]: true });
    this.haptic(kind === 'singleclick' ? 10 : 18);
    this.el.classList.remove('tap');
    void this.el.offsetWidth; // restart the ripple animation
    this.el.classList.add('tap');
  }

  queueMove(dx, dy) {
    const s = this.settings();
    const now = performance.now();
    const dt = Math.max(1, now - (this.lastMoveAt || now - 16));
    this.lastMoveAt = now;
    const speed = Math.hypot(dx, dy) / dt; // px per ms
    const accel = 1 + Math.min(2.2, Math.max(0, speed - 0.25) * 1.6);
    const k = (Number(s.sensitivity) || 1) * 1.6 * accel;
    this.pending.dx += dx * k;
    this.pending.dy += dy * k;
    this.schedule();
  }

  queueScroll(dx, dy) {
    const s = this.settings();
    const k = (Number(s.scroll) || 1) * (s.natural ? -1 : 1);
    this.pending.sx += dx * k;
    this.pending.sy += dy * k;
    this.schedule();
  }

  schedule() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.flush(); });
  }

  flush() {
    const p = this.pending;
    const dx = Math.trunc(p.dx); const dy = Math.trunc(p.dy);
    if (dx || dy) {
      this.send({ dx, dy });
      p.dx -= dx; p.dy -= dy;
    }
    const sx = Math.trunc(p.sx); const sy = Math.trunc(p.sy);
    if (Math.abs(sy) >= 2 || Math.abs(sx) >= 2) {
      this.send({ scroll: true, dx: sx, dy: sy });
      p.sx -= sx; p.sy -= sy;
    }
  }
}
