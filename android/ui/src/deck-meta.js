// Deck (Apps tab) metadata shared by the island, the settings window and the tests.
const KEY_KINDS = ['hotkey', 'media', 'action', 'command', 'text'];
const SIZES = ['1x1', '2x1', '2x2'];
const MEDIA = [
  ['toggle', 'play', 'mediaToggle'], ['prev', 'skip-back', 'mediaPrev'], ['next', 'skip-forward', 'mediaNext'],
  ['voldown', 'volume-1', 'volDown'], ['volup', 'volume-2', 'volUp'], ['mute', 'volume-x', 'volMute'],
];
const ACTIONS = [
  ['screenshot', 'scan'], ['lock', 'lock'], ['explorer', 'folder'], ['calc', 'calculator'],
  ['taskmgr', 'activity'], ['winsettings', 'settings'], ['focus', 'moon'], ['phonelink', 'smartphone'],
];
const KIND_LOOK = {
  hotkey: { glyph: 'keyboard', color: '#5e5ce6' },
  media: { glyph: 'play', color: '#ff375f' },
  action: { glyph: 'zap', color: '#0a84ff' },
  command: { glyph: 'terminal', color: '#30d158' },
  text: { glyph: 'file-text', color: '#ff9f0a' },
  url: { glyph: 'globe', color: '' },
  file: { glyph: '', color: '' },
  aumid: { glyph: '', color: '' },
};
const COLORS = ['#0a84ff', '#5e5ce6', '#bf5af2', '#ff375f', '#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#64d2ff', '#8e8e93'];
const GLYPHS = [
  'play', 'pause', 'skip-back', 'skip-forward', 'volume-2', 'volume-1', 'volume-x', 'music', 'mic', 'video', 'camera', 'image',
  'keyboard', 'terminal', 'folder', 'folder-open', 'file-text', 'copy', 'clipboard', 'scan', 'search', 'globe', 'link', 'external-link',
  'lock', 'power', 'moon', 'sun', 'monitor', 'settings', 'calculator', 'cpu', 'activity', 'gauge', 'wifi', 'bluetooth',
  'smartphone', 'phone', 'message-circle', 'send', 'bell', 'download', 'upload', 'timer', 'alarm-clock', 'calendar-days',
  'zap', 'rocket', 'sparkles', 'flag', 'pin', 'eye', 'eye-off', 'shield', 'house', 'layout-grid', 'app-window', 'refresh-cw',
  'rotate-ccw', 'undo-2', 'trash-2', 'check', 'x', 'plus', 'hash', 'list', 'map-pin', 'cloud', 'coins', 'bitcoin', 'newspaper',
  'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'maximize-2', 'minimize-2',
];

// glyph + colour a key is drawn with (its own choice first, then the default of its kind / target)
function keyLook(s) {
  const base = KIND_LOOK[s.kind] || KIND_LOOK.file;
  let glyph = s.glyph || base.glyph;
  if (!s.glyph && s.kind === 'media') { const m = MEDIA.find((x) => x[0] === s.target); if (m) glyph = m[1]; }
  if (!s.glyph && s.kind === 'action') { const a = ACTIONS.find((x) => x[0] === s.target); if (a) glyph = a[1]; }
  return { glyph, color: s.color || base.color, size: SIZES.includes(s.size) ? s.size : '1x1' };
}

// Island Apps tab: rows of square keys for each key size, sized to the 612 x 204 px plate.
const PLATE = { w: 612, h: 204, gap: 8 };
function deckGrid(size) {
  const rows = size === 's' ? 4 : size === 'l' ? 2 : 3;
  const unit = (PLATE.h - (rows - 1) * PLATE.gap) / rows;
  const cols = Math.floor((PLATE.w + PLATE.gap) / (unit + PLATE.gap));
  return { rows, cols, unit: Math.floor(unit * 100) / 100 };
}

module.exports = { KEY_KINDS, SIZES, MEDIA, ACTIONS, KIND_LOOK, COLORS, GLYPHS, keyLook, deckGrid, PLATE };
