// Subtitle languages (CommonJS: used by the main process, the island and the settings window).
// [code, native name, English name, OpenSubtitles code, SubDL code, Podnapisi code, legacy encoding of old files]
const TABLE = [
  ['en', 'English', 'English', 'en', 'EN', 'en', 'windows-1252'],
  ['ar', 'العربية', 'Arabic', 'ar', 'AR', 'ar', 'windows-1256'],
  ['tr', 'Türkçe', 'Turkish', 'tr', 'TR', 'tr', 'windows-1254'],
  ['es', 'Español', 'Spanish', 'es', 'ES', 'es', 'windows-1252'],
  ['ru', 'Русский', 'Russian', 'ru', 'RU', 'ru', 'windows-1251'],
  ['zh', '中文', 'Chinese', 'zh-cn', 'ZH', 'zh', 'gb18030'],
  ['fr', 'Français', 'French', 'fr', 'FR', 'fr', 'windows-1252'],
  ['de', 'Deutsch', 'German', 'de', 'DE', 'de', 'windows-1252'],
  ['it', 'Italiano', 'Italian', 'it', 'IT', 'it', 'windows-1252'],
  ['pt', 'Português', 'Portuguese', 'pt-pt', 'PT', 'pt', 'windows-1252'],
  ['pt-br', 'Português (BR)', 'Portuguese (Brazil)', 'pt-br', 'BR_PT', 'pt-br', 'windows-1252'],
  ['ja', '日本語', 'Japanese', 'ja', 'JA', 'ja', 'shift_jis'],
  ['ko', '한국어', 'Korean', 'ko', 'KO', 'ko', 'euc-kr'],
  ['hi', 'हिन्दी', 'Hindi', 'hi', 'HI', 'hi', 'windows-1252'],
  ['ur', 'اردو', 'Urdu', 'ur', 'UR', 'ur', 'windows-1256'],
  ['ku', 'Kurdî', 'Kurdish', 'ku', 'KU', 'ku', 'windows-1256'],
  ['az', 'Azərbaycan', 'Azerbaijani', 'az', 'AZ', 'az', 'windows-1254'],
  ['nl', 'Nederlands', 'Dutch', 'nl', 'NL', 'nl', 'windows-1252'],
  ['pl', 'Polski', 'Polish', 'pl', 'PL', 'pl', 'windows-1250'],
  ['uk', 'Українська', 'Ukrainian', 'uk', 'UK', 'uk', 'windows-1251'],
  ['el', 'Ελληνικά', 'Greek', 'el', 'EL', 'el', 'windows-1253'],
  ['he', 'עברית', 'Hebrew', 'he', 'HE', 'he', 'windows-1255'],
  ['id', 'Indonesia', 'Indonesian', 'id', 'ID', 'id', 'windows-1252'],
  ['sv', 'Svenska', 'Swedish', 'sv', 'SV', 'sv', 'windows-1252'],
];
const LANGS = TABLE.map(([code, name, english, os, subdl, pod, enc]) => ({ code, name, english, os, subdl, pod, enc }));
const PROVIDER_NAMES = { subdl: 'SubDL', opensubtitles: 'OpenSubtitles', podnapisi: 'Podnapisi' };

function byCode(code) { return LANGS.find((l) => l.code === code) || null; }
function short(code) { return String(code || '').toUpperCase(); }

module.exports = { LANGS, PROVIDER_NAMES, byCode, short };
