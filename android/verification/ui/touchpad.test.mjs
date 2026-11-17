import test from 'node:test';
import assert from 'node:assert/strict';
import { Touchpad } from '../../ui/src/touchpad.js';

class Surface {
  handlers = new Map();
  classes = new Set();
  classList = { add: (...names) => names.forEach((n) => this.classes.add(n)), remove: (...names) => names.forEach((n) => this.classes.delete(n)) };
  addEventListener(name, fn) { if (!this.handlers.has(name)) this.handlers.set(name, new Set()); this.handlers.get(name).add(fn); }
  removeEventListener(name, fn) { this.handlers.get(name)?.delete(fn); }
  fire(type, touches = []) { for (const fn of this.handlers.get(type) || []) fn({ type, touches, preventDefault() {} }); }
}

function fixture() {
  globalThis.window = new Surface();
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  const el = new Surface();
  const sent = [];
  const pad = new Touchpad(el, { send: (packet) => sent.push(packet) });
  return { el, sent, pad };
}

test('cancelling a tap never clicks the PC', () => {
  const { el, sent, pad } = fixture();
  el.fire('touchstart', [{ clientX: 1, clientY: 2 }]);
  el.fire('touchcancel');
  assert.deepEqual(sent, []);
  assert.equal(el.classes.has('active'), false);
  pad.destroy();
});

test('cancelling a drag releases its held button even if another touch remains', () => {
  const { el, sent, pad } = fixture();
  pad.dragging = true;
  el.classes.add('dragging');
  el.fire('touchcancel', [{ clientX: 1, clientY: 2 }]);
  assert.deepEqual(sent, [{ singlerelease: true }]);
  assert.equal(el.classes.has('dragging'), false);
  pad.destroy();
});

test('leaving the touchpad removes global and element handlers', () => {
  const { el, pad } = fixture();
  assert.equal(window.handlers.get('mouseup').size, 1);
  pad.destroy();
  assert.equal(window.handlers.get('mouseup').size, 0);
  for (const handlers of el.handlers.values()) assert.equal(handlers.size, 0);
});

test('ordinary taps and multi-finger taps preserve expected mouse buttons', () => {
  const { el, sent, pad } = fixture();
  for (let count = 1; count <= 3; count += 1) {
    el.fire('touchstart', Array.from({ length: count }, () => ({ clientX: 1, clientY: 2 })));
    el.fire('touchend');
  }
  assert.deepEqual(sent, [{ singleclick: true }, { rightclick: true }, { middleclick: true }]);
  pad.destroy();
});
