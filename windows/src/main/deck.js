'use strict';
// Deck keys: the Apps tab is a Stream Deck style board. Besides launching apps, files and websites, a key can
// press a keyboard shortcut, control media / volume, run a built-in action, run a command or type a text.
// Keys live in settings.shortcuts (the app shortcuts of older versions are simply keys of kind file/aumid/url).

const LAUNCH_KINDS = ['file', 'aumid', 'url'];
const KEY_KINDS = ['hotkey', 'media', 'action', 'command', 'text'];
const MEDIA = ['toggle', 'next', 'prev', 'volup', 'voldown', 'mute'];
const ACTIONS = ['screenshot', 'lock', 'explorer', 'calc', 'taskmgr', 'winsettings', 'focus', 'phonelink'];
const SIZES = ['1x1', '2x1', '2x2'];
const MAX_KEYS = 60;

const str = (v, max) => (typeof v === 'string' ? v : '').slice(0, max);
const color = (v) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : '');
const glyph = (v) => (typeof v === 'string' && /^[a-z0-9-]{1,32}$/.test(v) ? v : '');
const size = (v) => (SIZES.includes(v) ? v : '1x1');

// Appearance fields every key may carry (also the launch kinds).
function look(item) {
  return { color: color(item && item.color), glyph: glyph(item && item.glyph), size: size(item && item.size) };
}

// Validates a new non-launch key coming from the settings window. Returns the fields to store or null.
function sanitizeKey(item) {
  if (!item || !KEY_KINDS.includes(item.kind)) return null;
  const name = str(item.name, 60).trim();
  if (!name) return null;
  const out = { name, kind: item.kind, target: '', ...look(item) };
  switch (item.kind) {
    case 'hotkey': {
      const vk = Number(item.vk) | 0;
      const mods = Number(item.mods) | 0;
      if (vk < 1 || vk > 0xFE || mods < 0 || mods > 15) return null;
      out.vk = vk;
      out.mods = mods;
      out.target = str(item.target, 60) || `VK ${vk}`;
      return out;
    }
    case 'media':
      if (!MEDIA.includes(item.target)) return null;
      out.target = item.target;
      return out;
    case 'action':
      if (!ACTIONS.includes(item.target)) return null;
      out.target = item.target;
      return out;
    case 'command': {
      const cmd = str(item.target, 500).trim();
      if (!cmd || /[\r\n\0]/.test(cmd)) return null;
      out.target = cmd;
      return out;
    }
    case 'text': {
      const text = str(item.target, 2000);
      if (!text.trim()) return null;
      out.target = text;
      return out;
    }
    default: return null;
  }
}

// Fields of an existing key the settings window may change.
function sanitizePatch(patch) {
  const out = {};
  if (!patch || typeof patch !== 'object') return out;
  if (typeof patch.name === 'string' && patch.name.trim()) out.name = patch.name.trim().slice(0, 60);
  if (patch.color !== undefined) out.color = color(patch.color);
  if (patch.glyph !== undefined) out.glyph = glyph(patch.glyph);
  if (patch.size !== undefined) out.size = size(patch.size);
  return out;
}

/**
 * Runs a key. ctx: { launch(item), helper: { send(name, ...args) }, action(name), spawn(cmd, args, opts), isWin }
 * Returns true when something was triggered.
 */
function run(key, ctx) {
  if (!key || !ctx) return false;
  const helper = ctx.helper;
  try {
    switch (key.kind) {
      case 'hotkey': {
        const vk = Number(key.vk) | 0;
        if (!helper || vk < 1 || vk > 0xFE) return false;
        return helper.send('input.key', 'vk', vk, (Number(key.mods) | 0) & 15) !== false;
      }
      case 'media': {
        if (!helper || !MEDIA.includes(key.target)) return false;
        if (key.target === 'volup') helper.send('volume.delta', '0.05');
        else if (key.target === 'voldown') helper.send('volume.delta', '-0.05');
        else if (key.target === 'mute') helper.send('volume.toggleMute');
        else helper.send(`media.${key.target}`);
        return true;
      }
      case 'action':
        return ACTIONS.includes(key.target) ? ctx.action(key.target) !== false : false;
      case 'command': {
        if (!ctx.isWin || !key.target || /[\r\n\0]/.test(key.target)) return false;
        ctx.spawn('cmd.exe', ['/d', '/s', '/c', key.target], { detached: true, stdio: 'ignore', windowsHide: true, windowsVerbatimArguments: false }).unref();
        return true;
      }
      case 'text':
        if (!helper || !key.target) return false;
        return helper.send('input.key', 'text', String(key.target).slice(0, 2000), 0) !== false;
      default:
        return ctx.launch(key);
    }
  } catch (_) {
    return false;
  }
}

// What the phone needs to draw a key (the icon is added by the caller).
function publicKey(s) {
  const l = look(s);
  return { id: s.id, name: s.name, kind: s.kind, color: l.color, glyph: l.glyph, size: l.size, hint: s.kind === 'hotkey' ? String(s.target || '') : '' };
}

module.exports = { LAUNCH_KINDS, KEY_KINDS, MEDIA, ACTIONS, SIZES, MAX_KEYS, sanitizeKey, sanitizePatch, run, publicKey, look };
