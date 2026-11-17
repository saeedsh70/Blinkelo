// Tiny spring physics engine (semi-implicit Euler with fixed sub-steps).
export const SPRINGS = {
  expand: { stiffness: 250, damping: 21, mass: 1 },     // bouncy grow (damping ratio ~0.66)
  collapse: { stiffness: 330, damping: 30, mass: 1 },   // quick, nearly critical shrink
  bubble: { stiffness: 210, damping: 17, mass: 1 },     // liquid split
  snappy: { stiffness: 520, damping: 36, mass: 1 },
  soft: { stiffness: 140, damping: 20, mass: 1 },
};

export class Spring {
  constructor(value = 0, opts = SPRINGS.expand) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.set(opts);
  }

  set({ stiffness, damping, mass = 1 }) {
    this.k = stiffness;
    this.c = damping;
    this.m = mass;
    return this;
  }

  to(target, opts) {
    if (opts) this.set(opts);
    this.target = target;
  }

  jump(v) {
    this.value = v;
    this.target = v;
    this.velocity = 0;
  }

  impulse(v) { this.velocity += v; }

  step(dt) {
    const h = 1 / 240;
    let t = Math.min(dt, 0.064);
    while (t > 1e-6) {
      const s = Math.min(h, t);
      const f = -this.k * (this.value - this.target) - this.c * this.velocity;
      this.velocity += (f / this.m) * s;
      this.value += this.velocity * s;
      t -= s;
    }
    if (this.resting) {
      this.value = this.target;
      this.velocity = 0;
    }
  }

  get resting() {
    return Math.abs(this.velocity) < 0.02 && Math.abs(this.value - this.target) < 0.02;
  }
}

// Drives a set of springs with requestAnimationFrame only while something moves.
export class Animator {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.springs = new Set();
    this.keepAlive = new Set();
    this.running = false;
    this.last = 0;
    this.tick = this.tick.bind(this);
  }

  add(...springs) { springs.forEach((s) => this.springs.add(s)); }

  hold(key) { this.keepAlive.add(key); this.kick(); }

  release(key) { this.keepAlive.delete(key); }

  kick() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.tick);
  }

  tick(now) {
    const dt = Math.max(0, (now - this.last) / 1000);
    this.last = now;
    let moving = false;
    for (const s of this.springs) {
      if (!s.resting) { s.step(dt); moving = true; }
    }
    this.onFrame(dt, now);
    if (moving || this.keepAlive.size > 0) requestAnimationFrame(this.tick);
    else this.running = false;
  }
}
