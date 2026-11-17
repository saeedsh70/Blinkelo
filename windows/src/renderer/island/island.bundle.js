(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/shared/home-layout.js
  var require_home_layout = __commonJS({
    "src/shared/home-layout.js"(exports, module) {
      var GRID = { cols: 12, rows: 6, cw: 45, rh: 30, gap: 8 };
      var WIDGETS2 = {
        clock: { icon: "alarm-clock", min: [2, 2], def: [3, 5] },
        quick: { icon: "rocket", min: [2, 1], def: [3, 1] },
        media: { icon: "music", min: [4, 2], def: [5, 6] },
        sys: { icon: "cpu", min: [3, 2], def: [4, 2] },
        widgets: { icon: "layout-grid", min: [3, 3], def: [4, 4] },
        crypto: { icon: "bitcoin", min: [3, 2], def: [4, 4] },
        news: { icon: "newspaper", min: [3, 2], def: [4, 4] },
        clocks: { icon: "globe", min: [3, 2], def: [4, 4] },
        weather: { icon: "cloud-sun", min: [2, 2], def: [3, 3] },
        tasks: { icon: "list-checks", min: [3, 2], def: [4, 3] }
      };
      var DEFAULT = [
        { t: "clock", x: 0, y: 0, w: 3, h: 5 },
        { t: "quick", x: 0, y: 5, w: 3, h: 1 },
        { t: "media", x: 3, y: 0, w: 5, h: 6 },
        { t: "sys", x: 8, y: 0, w: 4, h: 2 },
        { t: "widgets", x: 8, y: 2, w: 4, h: 4 }
      ];
      var int = (v) => Number.isFinite(Number(v)) ? Math.round(Number(v)) : NaN;
      var overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      var inBounds = (r) => r.x >= 0 && r.y >= 0 && r.w >= 1 && r.h >= 1 && r.x + r.w <= GRID.cols && r.y + r.h <= GRID.rows;
      var bigEnough = (r) => {
        const m = WIDGETS2[r.t].min;
        return r.w >= m[0] && r.h >= m[1];
      };
      var free = (list, r, ignore = []) => inBounds(r) && !list.some((o) => !ignore.includes(o.t) && overlaps(o, r));
      function normalize(home) {
        if (!home || !home.custom || !Array.isArray(home.layout)) return DEFAULT.map((r) => ({ ...r }));
        const out = [];
        for (const raw of home.layout) {
          if (!raw || !WIDGETS2[raw.t] || out.some((o) => o.t === raw.t)) continue;
          const r = { t: raw.t, x: int(raw.x), y: int(raw.y), w: int(raw.w), h: int(raw.h) };
          if ([r.x, r.y, r.w, r.h].some(Number.isNaN) || !bigEnough(r) || !free(out, r)) continue;
          out.push(r);
        }
        return out;
      }
      function findSpot(list, w, h2) {
        for (let y = 0; y + h2 <= GRID.rows; y += 1) {
          for (let x = 0; x + w <= GRID.cols; x += 1) {
            if (free(list, { x, y, w, h: h2 })) return { x, y };
          }
        }
        return null;
      }
      function addTile(list, type) {
        const meta = WIDGETS2[type];
        if (!meta || list.some((o) => o.t === type)) return null;
        const sizes = [];
        for (let h2 = meta.def[1]; h2 >= meta.min[1]; h2 -= 1) {
          for (let w = meta.def[0]; w >= meta.min[0]; w -= 1) sizes.push([w, h2]);
        }
        sizes.sort((a, b) => b[0] * b[1] - a[0] * a[1]);
        for (const [w, h2] of sizes) {
          const spot = findSpot(list, w, h2);
          if (spot) return [...list, { t: type, ...spot, w, h: h2 }];
        }
        return null;
      }
      function moveTile(list, type, x, y) {
        const a = list.find((o) => o.t === type);
        if (!a) return { ok: false, list };
        const target = { ...a, x, y };
        if (!inBounds(target)) return { ok: false, list };
        const hit = list.filter((o) => o.t !== type && overlaps(o, target));
        if (!hit.length) return { ok: true, list: list.map((o) => o.t === type ? target : o) };
        if (hit.length === 1) {
          const b = hit[0];
          const moved = { ...b, x: a.x, y: a.y };
          const others = list.filter((o) => o.t !== a.t && o.t !== b.t);
          if (free(others, moved) && !overlaps(moved, target)) {
            return { ok: true, swap: b.t, list: list.map((o) => o.t === a.t ? target : o.t === b.t ? moved : o) };
          }
        }
        return { ok: false, list };
      }
      function resizeTile(list, type, w, h2) {
        const a = list.find((o) => o.t === type);
        if (!a) return { ok: false, list };
        const target = { ...a, w, h: h2 };
        if (!bigEnough(target) || !free(list, target, [type])) return { ok: false, list };
        return { ok: true, list: list.map((o) => o.t === type ? target : o) };
      }
      var removeTile = (list, type) => list.filter((o) => o.t !== type);
      var missing = (list) => Object.keys(WIDGETS2).filter((k) => !list.some((o) => o.t === k));
      function rectPx(r) {
        const sx = GRID.cw + GRID.gap;
        const sy = GRID.rh + GRID.gap;
        return { x: r.x * sx, y: r.y * sy, w: r.w * sx - GRID.gap, h: r.h * sy - GRID.gap };
      }
      module.exports = { GRID, WIDGETS: WIDGETS2, DEFAULT, normalize, findSpot, addTile, moveTile, resizeTile, removeTile, missing, rectPx, overlaps };
    }
  });

  // src/shared/deck-meta.js
  var require_deck_meta = __commonJS({
    "src/shared/deck-meta.js"(exports, module) {
      var KEY_KINDS = ["hotkey", "media", "action", "command", "text"];
      var SIZES = ["1x1", "2x1", "2x2"];
      var MEDIA = [
        ["toggle", "play", "mediaToggle"],
        ["prev", "skip-back", "mediaPrev"],
        ["next", "skip-forward", "mediaNext"],
        ["voldown", "volume-1", "volDown"],
        ["volup", "volume-2", "volUp"],
        ["mute", "volume-x", "volMute"]
      ];
      var ACTIONS = [
        ["screenshot", "scan"],
        ["lock", "lock"],
        ["explorer", "folder"],
        ["calc", "calculator"],
        ["taskmgr", "activity"],
        ["winsettings", "settings"],
        ["focus", "moon"],
        ["phonelink", "smartphone"]
      ];
      var KIND_LOOK = {
        hotkey: { glyph: "keyboard", color: "#5e5ce6" },
        media: { glyph: "play", color: "#ff375f" },
        action: { glyph: "zap", color: "#0a84ff" },
        command: { glyph: "terminal", color: "#30d158" },
        text: { glyph: "file-text", color: "#ff9f0a" },
        url: { glyph: "globe", color: "" },
        file: { glyph: "", color: "" },
        aumid: { glyph: "", color: "" }
      };
      var COLORS = ["#0a84ff", "#5e5ce6", "#bf5af2", "#ff375f", "#ff453a", "#ff9f0a", "#ffd60a", "#30d158", "#64d2ff", "#8e8e93"];
      var GLYPHS = [
        "play",
        "pause",
        "skip-back",
        "skip-forward",
        "volume-2",
        "volume-1",
        "volume-x",
        "music",
        "mic",
        "video",
        "camera",
        "image",
        "keyboard",
        "terminal",
        "folder",
        "folder-open",
        "file-text",
        "copy",
        "clipboard",
        "scan",
        "search",
        "globe",
        "link",
        "external-link",
        "lock",
        "power",
        "moon",
        "sun",
        "monitor",
        "settings",
        "calculator",
        "cpu",
        "activity",
        "gauge",
        "wifi",
        "bluetooth",
        "smartphone",
        "phone",
        "message-circle",
        "send",
        "bell",
        "download",
        "upload",
        "timer",
        "alarm-clock",
        "calendar-days",
        "zap",
        "rocket",
        "sparkles",
        "flag",
        "pin",
        "eye",
        "eye-off",
        "shield",
        "house",
        "layout-grid",
        "app-window",
        "refresh-cw",
        "rotate-ccw",
        "undo-2",
        "trash-2",
        "check",
        "x",
        "plus",
        "hash",
        "list",
        "map-pin",
        "cloud",
        "coins",
        "bitcoin",
        "newspaper",
        "arrow-left",
        "arrow-right",
        "arrow-up",
        "arrow-down",
        "maximize-2",
        "minimize-2"
      ];
      function keyLook(s) {
        const base = KIND_LOOK[s.kind] || KIND_LOOK.file;
        let glyph = s.glyph || base.glyph;
        if (!s.glyph && s.kind === "media") {
          const m = MEDIA.find((x) => x[0] === s.target);
          if (m) glyph = m[1];
        }
        if (!s.glyph && s.kind === "action") {
          const a = ACTIONS.find((x) => x[0] === s.target);
          if (a) glyph = a[1];
        }
        return { glyph, color: s.color || base.color, size: SIZES.includes(s.size) ? s.size : "1x1" };
      }
      var PLATE = { w: 612, h: 204, gap: 8 };
      function deckGrid(size) {
        const rows = size === "s" ? 4 : size === "l" ? 2 : 3;
        const unit = (PLATE.h - (rows - 1) * PLATE.gap) / rows;
        const cols = Math.floor((PLATE.w + PLATE.gap) / (unit + PLATE.gap));
        return { rows, cols, unit: Math.floor(unit * 100) / 100 };
      }
      module.exports = { KEY_KINDS, SIZES, MEDIA, ACTIONS, KIND_LOOK, COLORS, GLYPHS, keyLook, deckGrid, PLATE };
    }
  });

  // src/shared/sub-langs.js
  var require_sub_langs = __commonJS({
    "src/shared/sub-langs.js"(exports, module) {
      var TABLE = [
        ["en", "English", "English", "en", "EN", "en", "windows-1252"],
        ["ar", "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", "Arabic", "ar", "AR", "ar", "windows-1256"],
        ["tr", "T\xFCrk\xE7e", "Turkish", "tr", "TR", "tr", "windows-1254"],
        ["es", "Espa\xF1ol", "Spanish", "es", "ES", "es", "windows-1252"],
        ["ru", "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", "Russian", "ru", "RU", "ru", "windows-1251"],
        ["zh", "\u4E2D\u6587", "Chinese", "zh-cn", "ZH", "zh", "gb18030"],
        ["fr", "Fran\xE7ais", "French", "fr", "FR", "fr", "windows-1252"],
        ["de", "Deutsch", "German", "de", "DE", "de", "windows-1252"],
        ["it", "Italiano", "Italian", "it", "IT", "it", "windows-1252"],
        ["pt", "Portugu\xEAs", "Portuguese", "pt-pt", "PT", "pt", "windows-1252"],
        ["pt-br", "Portugu\xEAs (BR)", "Portuguese (Brazil)", "pt-br", "BR_PT", "pt-br", "windows-1252"],
        ["ja", "\u65E5\u672C\u8A9E", "Japanese", "ja", "JA", "ja", "shift_jis"],
        ["ko", "\uD55C\uAD6D\uC5B4", "Korean", "ko", "KO", "ko", "euc-kr"],
        ["hi", "\u0939\u093F\u0928\u094D\u0926\u0940", "Hindi", "hi", "HI", "hi", "windows-1252"],
        ["ur", "\u0627\u0631\u062F\u0648", "Urdu", "ur", "UR", "ur", "windows-1256"],
        ["ku", "Kurd\xEE", "Kurdish", "ku", "KU", "ku", "windows-1256"],
        ["az", "Az\u0259rbaycan", "Azerbaijani", "az", "AZ", "az", "windows-1254"],
        ["nl", "Nederlands", "Dutch", "nl", "NL", "nl", "windows-1252"],
        ["pl", "Polski", "Polish", "pl", "PL", "pl", "windows-1250"],
        ["uk", "\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430", "Ukrainian", "uk", "UK", "uk", "windows-1251"],
        ["el", "\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC", "Greek", "el", "EL", "el", "windows-1253"],
        ["he", "\u05E2\u05D1\u05E8\u05D9\u05EA", "Hebrew", "he", "HE", "he", "windows-1255"],
        ["id", "Indonesia", "Indonesian", "id", "ID", "id", "windows-1252"],
        ["sv", "Svenska", "Swedish", "sv", "SV", "sv", "windows-1252"]
      ];
      var LANGS2 = TABLE.map(([code, name, english, os, subdl, pod, enc]) => ({ code, name, english, os, subdl, pod, enc }));
      var PROVIDER_NAMES = { subdl: "SubDL", opensubtitles: "OpenSubtitles", podnapisi: "Podnapisi" };
      function byCode(code) {
        return LANGS2.find((l) => l.code === code) || null;
      }
      function short(code) {
        return String(code || "").toUpperCase();
      }
      module.exports = { LANGS: LANGS2, PROVIDER_NAMES, byCode, short };
    }
  });

  // src/shared/strings.js
  var require_strings = __commonJS({
    "src/shared/strings.js"(exports, module) {
      var LANGS2 = [
        { code: "en", name: "English", english: "English", dir: "ltr", locale: "en-US" },
        { code: "ar", name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", english: "Arabic", dir: "rtl", locale: "ar-EG-u-nu-latn" },
        { code: "tr", name: "T\xFCrk\xE7e", english: "Turkish", dir: "ltr", locale: "tr-TR" },
        { code: "es", name: "Espa\xF1ol", english: "Spanish", dir: "ltr", locale: "es-ES" },
        { code: "ru", name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", english: "Russian", dir: "ltr", locale: "ru-RU" },
        { code: "zh", name: "\u7B80\u4F53\u4E2D\u6587", english: "Chinese", dir: "ltr", locale: "zh-CN" }
      ];
      var ORDER = LANGS2.map((l) => l.code);
      var T = {
        // ---------------------------------------------------------------- island
        nowPlaying: ["Now Playing", "\u0642\u064A\u062F \u0627\u0644\u062A\u0634\u063A\u064A\u0644", "\u015Eimdi \xE7al\u0131yor", "Reproduciendo", "\u0421\u0435\u0439\u0447\u0430\u0441 \u0438\u0433\u0440\u0430\u0435\u0442", "\u6B63\u5728\u64AD\u653E"],
        nothingPlaying: ["Nothing playing", "\u0644\u0627 \u064A\u0648\u062C\u062F \u062A\u0634\u063A\u064A\u0644", "\xC7alan bir \u015Fey yok", "No se reproduce nada", "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0438\u0433\u0440\u0430\u0435\u0442", "\u672A\u5728\u64AD\u653E"],
        paused: ["Paused", "\u0645\u062A\u0648\u0642\u0641 \u0645\u0624\u0642\u062A\u064B\u0627", "Duraklat\u0131ld\u0131", "En pausa", "\u041F\u0430\u0443\u0437\u0430", "\u5DF2\u6682\u505C"],
        charging: ["Charging", "\u062C\u0627\u0631\u064D \u0627\u0644\u0634\u062D\u0646", "\u015Earj oluyor", "Cargando", "\u0417\u0430\u0440\u044F\u0436\u0430\u0435\u0442\u0441\u044F", "\u6B63\u5728\u5145\u7535"],
        onBattery: ["On battery", "\u0639\u0644\u0649 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", "Pilde", "Con bater\xEDa", "\u041E\u0442 \u0431\u0430\u0442\u0430\u0440\u0435\u0438", "\u4F7F\u7528\u7535\u6C60"],
        batteryLow: ["Battery low", "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629 \u0645\u0646\u062E\u0641\u0636\u0629", "Pil zay\u0131f", "Bater\xEDa baja", "\u041D\u0438\u0437\u043A\u0438\u0439 \u0437\u0430\u0440\u044F\u0434", "\u7535\u91CF\u4E0D\u8DB3"],
        fullyCharged: ["Fully charged", "\u0645\u0634\u062D\u0648\u0646\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644", "Tamamen \u015Farj oldu", "Carga completa", "\u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0437\u0430\u0440\u044F\u0436\u0435\u043D\u043E", "\u5DF2\u5145\u6EE1"],
        capsOn: ["Caps Lock on", "Caps Lock \u0645\u0641\u0639\u0651\u0644", "Caps Lock a\xE7\u0131k", "Bloq May\xFAs activado", "Caps Lock \u0432\u043A\u043B\u044E\u0447\u0451\u043D", "\u5927\u5199\u9501\u5B9A\u5DF2\u5F00\u542F"],
        capsOff: ["Caps Lock off", "Caps Lock \u0645\u0639\u0637\u0651\u0644", "Caps Lock kapal\u0131", "Bloq May\xFAs desactivado", "Caps Lock \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D", "\u5927\u5199\u9501\u5B9A\u5DF2\u5173\u95ED"],
        numOn: ["Num Lock on", "Num Lock \u0645\u0641\u0639\u0651\u0644", "Num Lock a\xE7\u0131k", "Bloq Num activado", "Num Lock \u0432\u043A\u043B\u044E\u0447\u0451\u043D", "\u6570\u5B57\u9501\u5B9A\u5DF2\u5F00\u542F"],
        numOff: ["Num Lock off", "Num Lock \u0645\u0639\u0637\u0651\u0644", "Num Lock kapal\u0131", "Bloq Num desactivado", "Num Lock \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D", "\u6570\u5B57\u9501\u5B9A\u5DF2\u5173\u95ED"],
        copied: ["Copied", "\u062A\u0645 \u0627\u0644\u0646\u0633\u062E", "Kopyaland\u0131", "Copiado", "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E", "\u5DF2\u590D\u5236"],
        protectedCopied: ["Protected content copied", "\u062A\u0645 \u0646\u0633\u062E \u0645\u062D\u062A\u0648\u0649 \u0645\u062D\u0645\u064A", "Korumal\u0131 i\xE7erik kopyaland\u0131", "Contenido protegido copiado", "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u0437\u0430\u0449\u0438\u0449\u0451\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435", "\u5DF2\u590D\u5236\u53D7\u4FDD\u62A4\u5185\u5BB9"],
        clipboardTooLarge: ["Text exceeds 1 MiB; not synced", "\u0627\u0644\u0646\u0635 \u064A\u062A\u062C\u0627\u0648\u0632 1 MiB\u061B \u0644\u0645 \u062A\u062A\u0645 \u0645\u0632\u0627\u0645\u0646\u062A\u0647", "Metin 1 MiB s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor; e\u015Fitlenmedi", "Texto mayor de 1 MiB; sin sincronizar", "\u0422\u0435\u043A\u0441\u0442 \u0431\u043E\u043B\u044C\u0448\u0435 1 \u041C\u0438\u0411; \u043D\u0435 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D", "\u6587\u672C\u8D85\u8FC7 1 MiB\uFF0C\u672A\u540C\u6B65"],
        fileCopied: ["File copied", "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0645\u0644\u0641", "Dosya kopyaland\u0131", "Archivo copiado", "\u0424\u0430\u0439\u043B \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D", "\u6587\u4EF6\u5DF2\u590D\u5236"],
        imageCopied: ["Image copied", "\u062A\u0645 \u0646\u0633\u062E \u0627\u0644\u0635\u0648\u0631\u0629", "G\xF6r\xFCnt\xFC kopyaland\u0131", "Imagen copiada", "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E", "\u56FE\u7247\u5DF2\u590D\u5236"],
        incomingCall: ["Incoming call", "\u0645\u0643\u0627\u0644\u0645\u0629 \u0648\u0627\u0631\u062F\u0629", "Gelen arama", "Llamada entrante", "\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0439 \u0432\u044B\u0437\u043E\u0432", "\u6765\u7535"],
        accept: ["Accept", "\u0631\u062F", "Yan\u0131tla", "Aceptar", "\u041E\u0442\u0432\u0435\u0442\u0438\u0442\u044C", "\u63A5\u542C"],
        decline: ["Decline", "\u0631\u0641\u0636", "Reddet", "Rechazar", "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C", "\u62D2\u7EDD"],
        onCall: ["On call", "\u0641\u064A \u0645\u0643\u0627\u0644\u0645\u0629", "G\xF6r\xFC\u015Fmede", "En llamada", "\u0420\u0430\u0437\u0433\u043E\u0432\u043E\u0440", "\u901A\u8BDD\u4E2D"],
        endCall: ["End call", "\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629", "Aramay\u0131 bitir", "Colgar", "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C", "\u6302\u65AD"],
        openPhoneLink: ["Open Phone Link", "\u0641\u062A\u062D Phone Link", "Phone Link\u2019i a\xE7", "Abrir Phone Link", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C Phone Link", "\u6253\u5F00 Phone Link"],
        hide: ["Hide", "\u0625\u062E\u0641\u0627\u0621", "Gizle", "Ocultar", "\u0421\u043A\u0440\u044B\u0442\u044C", "\u9690\u85CF"],
        callFailed: ["Couldn't control the call here \u2014 opened Phone Link", "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0645\u0646 \u0647\u0646\u0627 \u2014 \u062A\u0645 \u0641\u062A\u062D Phone Link", "Arama buradan kontrol edilemedi \u2014 Phone Link a\xE7\u0131ld\u0131", "No se pudo controlar la llamada \u2014 se abri\xF3 Phone Link", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0432\u044B\u0437\u043E\u0432\u043E\u043C \u2014 \u043E\u0442\u043A\u0440\u044B\u0442 Phone Link", "\u65E0\u6CD5\u5728\u6B64\u63A7\u5236\u901A\u8BDD \u2014 \u5DF2\u6253\u5F00 Phone Link"],
        connecting: ["Connecting\u2026", "\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u062A\u0635\u0627\u0644\u2026", "Ba\u011Flan\u0131yor\u2026", "Conectando\u2026", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u2026", "\u6B63\u5728\u8FDE\u63A5\u2026"],
        reply: ["Write a reply\u2026", "\u0627\u0643\u062A\u0628 \u0631\u062F\u064B\u0627\u2026", "Yan\u0131t yaz\u0131n\u2026", "Escribe una respuesta\u2026", "\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u043E\u0442\u0432\u0435\u0442\u2026", "\u8F93\u5165\u56DE\u590D\u2026"],
        send: ["Send", "\u0625\u0631\u0633\u0627\u0644", "G\xF6nder", "Enviar", "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C", "\u53D1\u9001"],
        sent: ["Sent", "\u062A\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644", "G\xF6nderildi", "Enviado", "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E", "\u5DF2\u53D1\u9001"],
        replyFailed: ["Not sent", "\u0644\u0645 \u064A\u064F\u0631\u0633\u0644", "G\xF6nderilemedi", "No enviado", "\u041D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E", "\u53D1\u9001\u5931\u8D25"],
        open: ["Open", "\u0641\u062A\u062D", "A\xE7", "Abrir", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C", "\u6253\u5F00"],
        dismiss: ["Dismiss", "\u0625\u063A\u0644\u0627\u0642", "Kapat", "Descartar", "\u0417\u0430\u043A\u0440\u044B\u0442\u044C", "\u5173\u95ED"],
        clearAll: ["Clear all", "\u0645\u0633\u062D \u0627\u0644\u0643\u0644", "T\xFCm\xFCn\xFC temizle", "Borrar todo", "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0441\u0451", "\u5168\u90E8\u6E05\u9664"],
        actionDone: ["Done", "\u062A\u0645", "Tamam", "Hecho", "\u0413\u043E\u0442\u043E\u0432\u043E", "\u5DF2\u5B8C\u6210"],
        actionFailed: ["Failed", "\u0641\u0634\u0644", "Ba\u015Far\u0131s\u0131z", "Fall\xF3", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C", "\u5931\u8D25"],
        timer: ["Timer", "\u0645\u0624\u0642\u0651\u062A", "Zamanlay\u0131c\u0131", "Temporizador", "\u0422\u0430\u0439\u043C\u0435\u0440", "\u8BA1\u65F6\u5668"],
        stopwatch: ["Stopwatch", "\u0633\u0627\u0639\u0629 \u0625\u064A\u0642\u0627\u0641", "Kronometre", "Cron\xF3metro", "\u0421\u0435\u043A\u0443\u043D\u0434\u043E\u043C\u0435\u0440", "\u79D2\u8868"],
        timesUp: ["Time's up!", "\u0627\u0646\u062A\u0647\u0649 \u0627\u0644\u0648\u0642\u062A!", "S\xFCre doldu!", "\xA1Se acab\xF3 el tiempo!", "\u0412\u0440\u0435\u043C\u044F \u0432\u044B\u0448\u043B\u043E!", "\u65F6\u95F4\u5230\uFF01"],
        endsAt: ["Ends at {t}", "\u064A\u0646\u062A\u0647\u064A \u0641\u064A {t}", "{t} itibar\u0131yla biter", "Termina a las {t}", "\u0417\u0430\u043A\u043E\u043D\u0447\u0438\u0442\u0441\u044F \u0432 {t}", "{t} \u7ED3\u675F"],
        start: ["Start", "\u0627\u0628\u062F\u0623", "Ba\u015Flat", "Iniciar", "\u0421\u0442\u0430\u0440\u0442", "\u5F00\u59CB"],
        minutes: ["min", "\u062F", "dk", "min", "\u043C\u0438\u043D", "\u5206\u949F"],
        custom: ["Custom", "\u0645\u062E\u0635\u0635", "\xD6zel", "Otro", "\u0421\u0432\u043E\u0451", "\u81EA\u5B9A\u4E49"],
        volume: ["Volume", "\u0627\u0644\u0635\u0648\u062A", "Ses", "Volumen", "\u0413\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u044C", "\u97F3\u91CF"],
        micInUse: ["{app} is using the microphone", "{app} \u064A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646", "{app} mikrofonu kullan\u0131yor", "{app} est\xE1 usando el micr\xF3fono", "{app} \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D", "{app} \u6B63\u5728\u4F7F\u7528\u9EA6\u514B\u98CE"],
        camInUse: ["{app} is using the camera", "{app} \u064A\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627", "{app} kameray\u0131 kullan\u0131yor", "{app} est\xE1 usando la c\xE1mara", "{app} \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u043A\u0430\u043C\u0435\u0440\u0443", "{app} \u6B63\u5728\u4F7F\u7528\u6444\u50CF\u5934"],
        locInUse: ["{app} is using your location", "{app} \u064A\u0633\u062A\u062E\u062F\u0645 \u0645\u0648\u0642\u0639\u0643", "{app} konumunuzu kullan\u0131yor", "{app} est\xE1 usando tu ubicaci\xF3n", "{app} \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0433\u0435\u043E\u043B\u043E\u043A\u0430\u0446\u0438\u044E", "{app} \u6B63\u5728\u4F7F\u7528\u4F4D\u7F6E"],
        someApp: ["An app", "\u062A\u0637\u0628\u064A\u0642", "Bir uygulama", "Una app", "\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435", "\u67D0\u4E2A\u5E94\u7528"],
        home: ["Home", "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", "Ana sayfa", "Inicio", "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", "\u4E3B\u9875"],
        alerts: ["Alerts", "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", "Bildirimler", "Avisos", "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F", "\u901A\u77E5"],
        apps: ["Apps", "\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A", "Uygulamalar", "Apps", "\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F", "\u5E94\u7528"],
        weather: ["Weather", "\u0627\u0644\u0637\u0642\u0633", "Hava durumu", "Tiempo", "\u041F\u043E\u0433\u043E\u0434\u0430", "\u5929\u6C14"],
        tools: ["Tools", "\u0627\u0644\u0623\u062F\u0648\u0627\u062A", "Ara\xE7lar", "Herramientas", "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B", "\u5DE5\u5177"],
        shelf: ["Shelf", "\u0627\u0644\u0631\u0641", "Raf", "Estante", "\u041F\u043E\u043B\u043A\u0430", "\u6587\u4EF6\u67B6"],
        clipboard: ["Clipboard", "\u0627\u0644\u062D\u0627\u0641\u0638\u0629", "Pano", "Portapapeles", "\u0411\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430", "\u526A\u8D34\u677F"],
        shelfEmpty: ["Drag files onto the island to keep them here", "\u0627\u0633\u062D\u0628 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0644\u062A\u0628\u0642\u0649 \u0647\u0646\u0627", "Dosyalar\u0131 burada tutmak i\xE7in adaya s\xFCr\xFCkleyin", "Arrastra archivos a la isla para guardarlos aqu\xED", "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0444\u0430\u0439\u043B\u044B \u043D\u0430 \u043E\u0441\u0442\u0440\u043E\u0432, \u0447\u0442\u043E\u0431\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0438\u0445 \u0437\u0434\u0435\u0441\u044C", "\u5C06\u6587\u4EF6\u62D6\u5230\u60AC\u6D6E\u5C9B\u4E0A\u6682\u5B58"],
        dropHere: ["Drop to keep on the shelf", "\u0623\u0641\u0644\u062A \u0644\u062D\u0641\u0638\u0647 \u0639\u0644\u0649 \u0627\u0644\u0631\u0641", "Rafa eklemek i\xE7in b\u0131rak\u0131n", "Suelta para guardar en el estante", "\u041E\u0442\u043F\u0443\u0441\u0442\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u044C \u043D\u0430 \u043F\u043E\u043B\u043A\u0443", "\u677E\u5F00\u4EE5\u653E\u5165\u6587\u4EF6\u67B6"],
        added: ["{n} item(s) added to the shelf", "\u062A\u0645\u062A \u0625\u0636\u0627\u0641\u0629 {n} \u0625\u0644\u0649 \u0627\u0644\u0631\u0641", "Rafa {n} \xF6\u011Fe eklendi", "{n} elemento(s) a\xF1adidos al estante", "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u043D\u0430 \u043F\u043E\u043B\u043A\u0443: {n}", "\u5DF2\u6DFB\u52A0 {n} \u9879\u5230\u6587\u4EF6\u67B6"],
        clipboardEmpty: ["Nothing copied yet", "\u0644\u0645 \u064A\u064F\u0646\u0633\u062E \u0634\u064A\u0621 \u0628\u0639\u062F", "Hen\xFCz bir \u015Fey kopyalanmad\u0131", "A\xFAn no has copiado nada", "\u041F\u043E\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E", "\u5C1A\u672A\u590D\u5236\u4EFB\u4F55\u5185\u5BB9"],
        alertsEmpty: ["No notifications", "\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u0634\u0639\u0627\u0631\u0627\u062A", "Bildirim yok", "Sin notificaciones", "\u041D\u0435\u0442 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439", "\u6CA1\u6709\u901A\u77E5"],
        screenshot: ["Screenshot", "\u0644\u0642\u0637\u0629 \u0634\u0627\u0634\u0629", "Ekran g\xF6r\xFCnt\xFCs\xFC", "Captura", "\u0421\u043A\u0440\u0438\u043D\u0448\u043E\u0442", "\u622A\u56FE"],
        lock: ["Lock", "\u0642\u0641\u0644", "Kilitle", "Bloquear", "\u0411\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0430", "\u9501\u5B9A"],
        phonelink: ["Phone Link", "Phone Link", "Phone Link", "Phone Link", "Phone Link", "Phone Link"],
        explorer: ["Files", "\u0627\u0644\u0645\u0644\u0641\u0627\u062A", "Dosyalar", "Archivos", "\u0424\u0430\u0439\u043B\u044B", "\u6587\u4EF6"],
        calc: ["Calculator", "\u0627\u0644\u0622\u0644\u0629 \u0627\u0644\u062D\u0627\u0633\u0628\u0629", "Hesap makinesi", "Calculadora", "\u041A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440", "\u8BA1\u7B97\u5668"],
        taskmgr: ["Task Manager", "\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0647\u0627\u0645", "G\xF6rev Y\xF6neticisi", "Administrador de tareas", "\u0414\u0438\u0441\u043F\u0435\u0442\u0447\u0435\u0440 \u0437\u0430\u0434\u0430\u0447", "\u4EFB\u52A1\u7BA1\u7406\u5668"],
        winsettings: ["Windows Settings", "\u0625\u0639\u062F\u0627\u062F\u0627\u062A Windows", "Windows Ayarlar\u0131", "Configuraci\xF3n", "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B Windows", "Windows \u8BBE\u7F6E"],
        focus: ["Focus", "\u0627\u0644\u062A\u0631\u0643\u064A\u0632", "Odak", "Concentraci\xF3n", "\u0424\u043E\u043A\u0443\u0441\u0438\u0440\u043E\u0432\u043A\u0430", "\u4E13\u6CE8"],
        settings: ["Settings", "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", "Ayarlar", "Ajustes", "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438", "\u8BBE\u7F6E"],
        cpu: ["CPU", "\u0627\u0644\u0645\u0639\u0627\u0644\u062C", "\u0130\u015Flemci", "CPU", "\u0426\u041F", "CPU"],
        ram: ["RAM", "\u0627\u0644\u0630\u0627\u0643\u0631\u0629", "Bellek", "RAM", "\u041E\u0417\u0423", "\u5185\u5B58"],
        gpu: ["GPU", "\u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A", "GPU", "GPU", "\u0413\u041F", "GPU"],
        battery: ["Battery", "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", "Pil", "Bater\xEDa", "\u0411\u0430\u0442\u0430\u0440\u0435\u044F", "\u7535\u6C60"],
        now: ["now", "\u0627\u0644\u0622\u0646", "\u015Fimdi", "ahora", "\u0441\u0435\u0439\u0447\u0430\u0441", "\u521A\u521A"],
        minAgo: ["{n}m ago", "\u0642\u0628\u0644 {n} \u062F", "{n} dk \xF6nce", "hace {n} min", "{n} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434", "{n} \u5206\u949F\u524D"],
        hourAgo: ["{n}h ago", "\u0642\u0628\u0644 {n} \u0633", "{n} sa \xF6nce", "hace {n} h", "{n} \u0447 \u043D\u0430\u0437\u0430\u0434", "{n} \u5C0F\u65F6\u524D"],
        pin: ["Pin", "\u062A\u062B\u0628\u064A\u062A", "Sabitle", "Fijar", "\u0417\u0430\u043A\u0440\u0435\u043F\u0438\u0442\u044C", "\u56FA\u5B9A"],
        unpin: ["Unpin", "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062A\u062B\u0628\u064A\u062A", "Sabitlemeyi kald\u0131r", "Desfijar", "\u041E\u0442\u043A\u0440\u0435\u043F\u0438\u0442\u044C", "\u53D6\u6D88\u56FA\u5B9A"],
        quickActions: ["System shortcuts", "\u0627\u062E\u062A\u0635\u0627\u0631\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645", "Sistem k\u0131sayollar\u0131", "Atajos del sistema", "\u0421\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0435 \u044F\u0440\u043B\u044B\u043A\u0438", "\u7CFB\u7EDF\u5FEB\u6377\u65B9\u5F0F"],
        notifications: ["notifications", "\u0625\u0634\u0639\u0627\u0631", "bildirim", "notificaciones", "\u0443\u0432\u0435\u0434\u043E\u043C\u043B.", "\u6761\u901A\u77E5"],
        items: ["items", "\u0639\u0646\u0635\u0631", "\xF6\u011Fe", "elementos", "\u0448\u0442.", "\u9879"],
        unknownCaller: ["Unknown", "\u0645\u062C\u0647\u0648\u0644", "Bilinmeyen", "Desconocido", "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439", "\u672A\u77E5\u53F7\u7801"],
        shelfTip: ["Click to open \xB7 drag to move", "\u0627\u0646\u0642\u0631 \u0644\u0644\u0641\u062A\u062D \xB7 \u0627\u0633\u062D\u0628 \u0644\u0644\u0646\u0642\u0644", "A\xE7mak i\xE7in t\u0131kla \xB7 ta\u015F\u0131mak i\xE7in s\xFCr\xFCkle", "Clic para abrir \xB7 arrastra para mover", "\u041A\u043B\u0438\u043A \u2014 \u043E\u0442\u043A\u0440\u044B\u0442\u044C \xB7 \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u044C \u2014 \u043F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C", "\u70B9\u51FB\u6253\u5F00 \xB7 \u62D6\u52A8\u79FB\u51FA"],
        clickToCopy: ["Click to copy again", "\u0627\u0646\u0642\u0631 \u0644\u0644\u0646\u0633\u062E \u0645\u062C\u062F\u062F\u064B\u0627", "Tekrar kopyalamak i\xE7in t\u0131kla", "Clic para copiar de nuevo", "\u041D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0441\u043D\u043E\u0432\u0430 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C", "\u70B9\u51FB\u518D\u6B21\u590D\u5236"],
        addApp: ["Add", "\u0625\u0636\u0627\u0641\u0629", "Ekle", "A\xF1adir", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C", "\u6DFB\u52A0"],
        weatherEmpty: ["Set your city in Settings", "\u062D\u062F\u062F \u0645\u062F\u064A\u0646\u062A\u0643 \u0645\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", "Ayarlar\u2019dan \u015Fehrinizi se\xE7in", "Elige tu ciudad en Ajustes", "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0433\u043E\u0440\u043E\u0434 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445", "\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u9009\u62E9\u57CE\u5E02"],
        weatherError: ["Couldn't load weather", "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0637\u0642\u0633", "Hava durumu al\u0131namad\u0131", "No se pudo cargar el tiempo", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043F\u043E\u0433\u043E\u0434\u0443", "\u65E0\u6CD5\u83B7\u53D6\u5929\u6C14"],
        feelsLike: ["Feels {t}", "\u0627\u0644\u0645\u062D\u0633\u0648\u0633\u0629 {t}", "Hissedilen {t}", "Sensaci\xF3n {t}", "\u041E\u0449\u0443\u0449\u0430\u0435\u0442\u0441\u044F {t}", "\u4F53\u611F {t}"],
        humidity: ["Humidity", "\u0627\u0644\u0631\u0637\u0648\u0628\u0629", "Nem", "Humedad", "\u0412\u043B\u0430\u0436\u043D\u043E\u0441\u0442\u044C", "\u6E7F\u5EA6"],
        wind: ["Wind", "\u0627\u0644\u0631\u064A\u0627\u062D", "R\xFCzgar", "Viento", "\u0412\u0435\u0442\u0435\u0440", "\u98CE\u901F"],
        today: ["Today", "\u0627\u0644\u064A\u0648\u0645", "Bug\xFCn", "Hoy", "\u0421\u0435\u0433\u043E\u0434\u043D\u044F", "\u4ECA\u5929"],
        kmh: ["km/h", "\u0643\u0645/\u0633", "km/s", "km/h", "\u043A\u043C/\u0447", "\u516C\u91CC/\u65F6"],
        wx_clear: ["Clear", "\u0635\u0627\u0641\u064D", "A\xE7\u0131k", "Despejado", "\u042F\u0441\u043D\u043E", "\u6674"],
        wx_mostlyClear: ["Mostly clear", "\u0635\u0627\u0641\u064D \u063A\u0627\u0644\u0628\u064B\u0627", "\xC7o\u011Funlukla a\xE7\u0131k", "Mayormente despejado", "\u041C\u0430\u043B\u043E\u043E\u0431\u043B\u0430\u0447\u043D\u043E", "\u5927\u81F4\u6674\u6717"],
        wx_partlyCloudy: ["Partly cloudy", "\u063A\u0627\u0626\u0645 \u062C\u0632\u0626\u064A\u064B\u0627", "Par\xE7al\u0131 bulutlu", "Parcialmente nublado", "\u041F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u0430\u044F \u043E\u0431\u043B\u0430\u0447\u043D\u043E\u0441\u0442\u044C", "\u591A\u4E91"],
        wx_cloudy: ["Cloudy", "\u063A\u0627\u0626\u0645", "Bulutlu", "Nublado", "\u041F\u0430\u0441\u043C\u0443\u0440\u043D\u043E", "\u9634"],
        wx_fog: ["Fog", "\u0636\u0628\u0627\u0628", "Sis", "Niebla", "\u0422\u0443\u043C\u0430\u043D", "\u96FE"],
        wx_drizzle: ["Drizzle", "\u0631\u0630\u0627\u0630", "\xC7isenti", "Llovizna", "\u041C\u043E\u0440\u043E\u0441\u044C", "\u6BDB\u6BDB\u96E8"],
        wx_rain: ["Rain", "\u0645\u0637\u0631", "Ya\u011Fmurlu", "Lluvia", "\u0414\u043E\u0436\u0434\u044C", "\u96E8"],
        wx_snow: ["Snow", "\u062B\u0644\u062C", "Karl\u0131", "Nieve", "\u0421\u043D\u0435\u0433", "\u96EA"],
        wx_showers: ["Showers", "\u0632\u062E\u0627\u062A", "Sa\u011Fanak", "Chubascos", "\u041B\u0438\u0432\u043D\u0438", "\u9635\u96E8"],
        wx_thunder: ["Thunderstorm", "\u0639\u0627\u0635\u0641\u0629 \u0631\u0639\u062F\u064A\u0629", "G\xF6k g\xFCr\xFClt\xFCl\xFC", "Tormenta", "\u0413\u0440\u043E\u0437\u0430", "\u96F7\u96E8"],
        muteRinger: ["Mute ringer", "\u0643\u062A\u0645 \u0627\u0644\u0631\u0646\u064A\u0646", "Zili sustur", "Silenciar tono", "\u0411\u0435\u0437 \u0437\u0432\u0443\u043A\u0430", "\u9759\u97F3\u94C3\u58F0"],
        answerOnPhone: ["Answer on your phone", "\u0623\u062C\u0628 \u0645\u0646 \u0647\u0627\u062A\u0641\u0643", "Telefonunuzdan yan\u0131tlay\u0131n", "Contesta en tu tel\xE9fono", "\u041E\u0442\u0432\u0435\u0442\u044C\u0442\u0435 \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435", "\u8BF7\u5728\u624B\u673A\u4E0A\u63A5\u542C"],
        missedCall: ["Missed call", "\u0645\u0643\u0627\u0644\u0645\u0629 \u0641\u0627\u0626\u062A\u0629", "Cevaps\u0131z arama", "Llamada perdida", "\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043D\u044B\u0439 \u0432\u044B\u0437\u043E\u0432", "\u672A\u63A5\u6765\u7535"],
        pairRequest: ["\u201C{name}\u201D wants to pair", "\xAB{name}\xBB \u064A\u0631\u064A\u062F \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u0646", "\u201C{name}\u201D e\u015Fle\u015Fmek istiyor", "\u201C{name}\u201D quiere vincularse", "\xAB{name}\xBB \u0445\u043E\u0447\u0435\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F", "\u201C{name}\u201D\u8BF7\u6C42\u914D\u5BF9"],
        pairCode: ["Code {code}", "\u0627\u0644\u0631\u0645\u0632 {code}", "Kod {code}", "C\xF3digo {code}", "\u041A\u043E\u0434 {code}", "\u9A8C\u8BC1\u7801 {code}"],
        pairAccepted: ["\u201C{name}\u201D paired", "\u062A\u0645 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u0646 \u0628\u0640\xAB{name}\xBB", "\u201C{name}\u201D e\u015Fle\u015Fti", "\u201C{name}\u201D vinculado", "\xAB{name}\xBB \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D", "\u5DF2\u4E0E\u201C{name}\u201D\u914D\u5BF9"],
        pairFailed: ["Pairing failed", "\u0641\u0634\u0644 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u0646", "E\u015Fle\u015Fme ba\u015Far\u0131s\u0131z", "Vinculaci\xF3n fallida", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C", "\u914D\u5BF9\u5931\u8D25"],
        ringPhone: ["Ring phone", "\u0631\u0646\u0651 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefonu \xE7ald\u0131r", "Hacer sonar", "\u041F\u043E\u0437\u0432\u043E\u043D\u0438\u0442\u044C \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u54CD\u94C3\u627E\u624B\u673A"],
        phoneRinging: ["Ringing your phone\u2026", "\u062C\u0627\u0631\u064D \u0631\u0646\u064A\u0646 \u0647\u0627\u062A\u0641\u0643\u2026", "Telefonunuz \xE7al\u0131yor\u2026", "Haciendo sonar tu tel\xE9fono\u2026", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u0437\u0432\u043E\u043D\u0438\u0442\u2026", "\u6B63\u5728\u8BA9\u624B\u673A\u54CD\u94C3\u2026"],
        phoneBatteryLow: ["Phone battery low ({p}%)", "\u0628\u0637\u0627\u0631\u064A\u0629 \u0627\u0644\u0647\u0627\u062A\u0641 \u0645\u0646\u062E\u0641\u0636\u0629 ({p}%)", "Telefon pili zay\u0131f (%{p})", "Bater\xEDa del tel\xE9fono baja ({p}%)", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u0440\u0430\u0437\u0440\u044F\u0436\u0430\u0435\u0442\u0441\u044F ({p}%)", "\u624B\u673A\u7535\u91CF\u4F4E\uFF08{p}%\uFF09"],
        pingFrom: ["Ping from {name}", "\u062A\u0646\u0628\u064A\u0647 \u0645\u0646 {name}", "{name} adl\u0131 cihazdan ping", "Ping de {name}", "\u0421\u0438\u0433\u043D\u0430\u043B \u043E\u0442 {name}", "\u6765\u81EA {name} \u7684\u63D0\u9192"],
        minimize: ["Minimize", "\u062A\u0635\u063A\u064A\u0631", "K\xFC\xE7\xFClt", "Minimizar", "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C", "\u6700\u5C0F\u5316"],
        restore: ["Restore", "\u0627\u0633\u062A\u0639\u0627\u062F\u0629", "Geri y\xFCkle", "Restaurar", "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C", "\u8FD8\u539F"],
        hideIsland: ["Hide island", "\u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u062C\u0632\u064A\u0631\u0629", "Aday\u0131 gizle", "Ocultar isla", "\u0421\u043A\u0440\u044B\u0442\u044C \u043E\u0441\u0442\u0440\u043E\u0432", "\u9690\u85CF\u60AC\u6D6E\u5C9B"],
        showIsland: ["Show island", "\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u062C\u0632\u064A\u0631\u0629", "Aday\u0131 g\xF6ster", "Mostrar isla", "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043E\u0441\u0442\u0440\u043E\u0432", "\u663E\u793A\u60AC\u6D6E\u5C9B"],
        phoneNotConnected: ["Phone not connected", "\u0627\u0644\u0647\u0627\u062A\u0641 \u063A\u064A\u0631 \u0645\u062A\u0635\u0644", "Telefon ba\u011Fl\u0131 de\u011Fil", "Tel\xE9fono no conectado", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D", "\u624B\u673A\u672A\u8FDE\u63A5"],
        mute: ["Mute", "\u0643\u062A\u0645", "Sessiz", "Silenciar", "\u0411\u0435\u0437 \u0437\u0432\u0443\u043A\u0430", "\u9759\u97F3"],
        welcomeIsland: ["Hi! Your island is ready", "\u0645\u0631\u062D\u0628\u064B\u0627! \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u062C\u0627\u0647\u0632\u0629", "Merhaba! Ada haz\u0131r", "\xA1Hola! Tu isla est\xE1 lista", "\u041F\u0440\u0438\u0432\u0435\u0442! \u041E\u0441\u0442\u0440\u043E\u0432 \u0433\u043E\u0442\u043E\u0432", "\u4F60\u597D\uFF01\u60AC\u6D6E\u5C9B\u5DF2\u5C31\u7EEA"],
        // ---------------------------------------------------------------- settings: navigation
        welcome: ["Welcome", "\u0645\u0631\u062D\u0628\u064B\u0627", "Ho\u015F geldiniz", "Bienvenida", "\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C", "\u6B22\u8FCE"],
        appearance: ["Appearance", "\u0627\u0644\u0645\u0638\u0647\u0631", "G\xF6r\xFCn\xFCm", "Apariencia", "\u041E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435", "\u5916\u89C2"],
        modules: ["Features", "\u0627\u0644\u0645\u064A\u0632\u0627\u062A", "\xD6zellikler", "Funciones", "\u0424\u0443\u043D\u043A\u0446\u0438\u0438", "\u529F\u80FD"],
        notificationsNav: ["Notifications & calls", "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A", "Bildirimler ve aramalar", "Notificaciones y llamadas", "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0438 \u0432\u044B\u0437\u043E\u0432\u044B", "\u901A\u77E5\u4E0E\u6765\u7535"],
        phoneNav: ["Phone connection", "\u0631\u0628\u0637 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefon ba\u011Flant\u0131s\u0131", "Conexi\xF3n del tel\xE9fono", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430", "\u624B\u673A\u8FDE\u63A5"],
        weatherNav: ["Weather", "\u0627\u0644\u0637\u0642\u0633", "Hava durumu", "Tiempo", "\u041F\u043E\u0433\u043E\u0434\u0430", "\u5929\u6C14"],
        behavior: ["Behavior & position", "\u0627\u0644\u0633\u0644\u0648\u0643 \u0648\u0627\u0644\u0645\u0648\u0636\u0639", "Davran\u0131\u015F ve konum", "Comportamiento y posici\xF3n", "\u041F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435", "\u884C\u4E3A\u4E0E\u4F4D\u7F6E"],
        tryit: ["Try it", "\u062C\u0631\u0651\u0628\u0647", "Deneyin", "Pru\xE9balo", "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C", "\u8BD5\u4E00\u8BD5"],
        status: ["Status", "\u0627\u0644\u062D\u0627\u0644\u0629", "Durum", "Estado", "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435", "\u72B6\u6001"],
        about: ["About", "\u062D\u0648\u0644", "Hakk\u0131nda", "Acerca de", "\u041E \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435", "\u5173\u4E8E"],
        // ---------------------------------------------------------------- settings: welcome / onboarding
        welcomeTitle: ["Blinkelo is ready", "Blinkelo \u062C\u0627\u0647\u0632", "Blinkelo haz\u0131r", "Blinkelo est\xE1 listo", "Blinkelo \u0433\u043E\u0442\u043E\u0432", "Blinkelo \u5DF2\u5C31\u7EEA"],
        welcomeText: ["The island lives at the top of your screen and comes alive when something happens: music, phone messages and calls, volume, charging, timers, weather, clipboard and a file shelf.", "\u062A\u0639\u064A\u0634 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0623\u0639\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629 \u0648\u062A\u0646\u0628\u0636 \u0628\u0627\u0644\u062D\u064A\u0627\u0629 \u0639\u0646\u062F \u062D\u062F\u0648\u062B \u0623\u064A \u0634\u064A\u0621: \u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0649 \u0648\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0645\u0643\u0627\u0644\u0645\u0627\u062A\u0647 \u0648\u0627\u0644\u0635\u0648\u062A \u0648\u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u0645\u0624\u0642\u062A\u0627\u062A \u0648\u0627\u0644\u0637\u0642\u0633 \u0648\u0627\u0644\u062D\u0627\u0641\u0638\u0629 \u0648\u0631\u0641 \u0627\u0644\u0645\u0644\u0641\u0627\u062A.", "Ada ekran\u0131n \xFCst\xFCnde durur ve bir \u015Fey oldu\u011Funda canlan\u0131r: m\xFCzik, telefon mesajlar\u0131 ve aramalar\u0131, ses, \u015Farj, zamanlay\u0131c\u0131, hava durumu, pano ve dosya raf\u0131.", "La isla vive arriba de tu pantalla y cobra vida cuando pasa algo: m\xFAsica, mensajes y llamadas del m\xF3vil, volumen, carga, temporizadores, tiempo, portapapeles y estante de archivos.", "\u041E\u0441\u0442\u0440\u043E\u0432 \u0436\u0438\u0432\u0451\u0442 \u0432\u0432\u0435\u0440\u0445\u0443 \u044D\u043A\u0440\u0430\u043D\u0430 \u0438 \u043E\u0436\u0438\u0432\u0430\u0435\u0442, \u043A\u043E\u0433\u0434\u0430 \u0447\u0442\u043E-\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442: \u043C\u0443\u0437\u044B\u043A\u0430, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0438 \u0437\u0432\u043E\u043D\u043A\u0438 \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430, \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u044C, \u0437\u0430\u0440\u044F\u0434\u043A\u0430, \u0442\u0430\u0439\u043C\u0435\u0440\u044B, \u043F\u043E\u0433\u043E\u0434\u0430, \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430 \u0438 \u043F\u043E\u043B\u043A\u0430 \u0444\u0430\u0439\u043B\u043E\u0432.", "\u60AC\u6D6E\u5C9B\u4F4D\u4E8E\u5C4F\u5E55\u9876\u90E8\uFF0C\u6709\u4E8B\u53D1\u751F\u65F6\u5C31\u4F1A\u6D3B\u8DC3\u8D77\u6765\uFF1A\u97F3\u4E50\u3001\u624B\u673A\u6D88\u606F\u4E0E\u6765\u7535\u3001\u97F3\u91CF\u3001\u5145\u7535\u3001\u8BA1\u65F6\u5668\u3001\u5929\u6C14\u3001\u526A\u8D34\u677F\u548C\u6587\u4EF6\u67B6\u3002"],
        tips: ["Quick tips", "\u0646\u0635\u0627\u0626\u062D \u0633\u0631\u064A\u0639\u0629", "H\u0131zl\u0131 ipu\xE7lar\u0131", "Consejos r\xE1pidos", "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0438", "\u5FEB\u901F\u63D0\u793A"],
        tip1: ["Click to expand \xB7 right-click for the dashboard \xB7 middle-click = play/pause", "\u0627\u0646\u0642\u0631 \u0644\u0644\u062A\u0648\u0633\u064A\u0639 \xB7 \u0632\u0631 \u0623\u064A\u0645\u0646 \u0644\u0644\u0648\u062D\u0629 \xB7 \u0627\u0644\u0632\u0631 \u0627\u0644\u0623\u0648\u0633\u0637 = \u062A\u0634\u063A\u064A\u0644/\u0625\u064A\u0642\u0627\u0641", "Geni\u015Fletmek i\xE7in t\u0131kla \xB7 pano i\xE7in sa\u011F t\u0131k \xB7 orta t\u0131k = oynat/duraklat", "Clic para expandir \xB7 clic derecho = panel \xB7 clic central = reproducir/pausar", "\u041A\u043B\u0438\u043A \u2014 \u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \xB7 \u043F\u0440\u0430\u0432\u044B\u0439 \u043A\u043B\u0438\u043A \u2014 \u043F\u0430\u043D\u0435\u043B\u044C \xB7 \u0441\u0440\u0435\u0434\u043D\u0438\u0439 \u2014 \u043F\u0430\u0443\u0437\u0430", "\u5355\u51FB\u5C55\u5F00 \xB7 \u53F3\u952E\u6253\u5F00\u9762\u677F \xB7 \u4E2D\u952E = \u64AD\u653E/\u6682\u505C"],
        tip2: ["Scroll on the island to change system volume", "\u0645\u0631\u0651\u0631 \u0639\u0644\u0649 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0644\u062A\u063A\u064A\u064A\u0631 \u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A", "Sesi de\u011Fi\u015Ftirmek i\xE7in adan\u0131n \xFCzerinde kayd\u0131r\u0131n", "Despl\xE1zate sobre la isla para cambiar el volumen", "\u041F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0430 \u043D\u0430\u0434 \u043E\u0441\u0442\u0440\u043E\u0432\u043E\u043C \u043C\u0435\u043D\u044F\u0435\u0442 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u044C", "\u5728\u60AC\u6D6E\u5C9B\u4E0A\u6EDA\u52A8\u53EF\u8C03\u8282\u97F3\u91CF"],
        tip3: ["Drag the island to move it (it snaps back to the center)", "\u0627\u0633\u062D\u0628 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0644\u062A\u062D\u0631\u064A\u0643\u0647\u0627 (\u062A\u0644\u062A\u0635\u0642 \u0628\u0627\u0644\u0645\u0646\u062A\u0635\u0641)", "Ta\u015F\u0131mak i\xE7in aday\u0131 s\xFCr\xFCkleyin (ortaya yap\u0131\u015F\u0131r)", "Arrastra la isla para moverla (se ajusta al centro)", "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043E\u0441\u0442\u0440\u043E\u0432, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C (\u0446\u0435\u043D\u0442\u0440 \u043F\u0440\u0438\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442)", "\u62D6\u52A8\u60AC\u6D6E\u5C9B\u5373\u53EF\u79FB\u52A8\uFF08\u9760\u8FD1\u4E2D\u95F4\u4F1A\u81EA\u52A8\u5438\u9644\uFF09"],
        tip4: ["Keyboard shortcut for the dashboard: ", "\u0627\u062E\u062A\u0635\u0627\u0631 \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0644\u0644\u0648\u062D\u0629: ", "Pano i\xE7in klavye k\u0131sayolu: ", "Atajo de teclado del panel: ", "\u0413\u043E\u0440\u044F\u0447\u0430\u044F \u043A\u043B\u0430\u0432\u0438\u0448\u0430 \u043F\u0430\u043D\u0435\u043B\u0438: ", "\u6253\u5F00\u9762\u677F\u7684\u5FEB\u6377\u952E\uFF1A"],
        chooseLanguage: ["Choose your language", "\u0627\u062E\u062A\u0631 \u0644\u063A\u062A\u0643", "Dilinizi se\xE7in", "Elige tu idioma", "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044F\u0437\u044B\u043A", "\u9009\u62E9\u8BED\u8A00"],
        chooseLanguageText: ["You can change it later in Settings.", "\u064A\u0645\u0643\u0646\u0643 \u062A\u063A\u064A\u064A\u0631\u0647\u0627 \u0644\u0627\u062D\u0642\u064B\u0627 \u0645\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A.", "Daha sonra Ayarlar\u2019dan de\u011Fi\u015Ftirebilirsiniz.", "Puedes cambiarlo despu\xE9s en Ajustes.", "\u0415\u0433\u043E \u043C\u043E\u0436\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445.", "\u4E4B\u540E\u53EF\u4EE5\u5728\u8BBE\u7F6E\u4E2D\u66F4\u6539\u3002"],
        next: ["Next", "\u0627\u0644\u062A\u0627\u0644\u064A", "\u0130leri", "Siguiente", "\u0414\u0430\u043B\u0435\u0435", "\u4E0B\u4E00\u6B65"],
        back: ["Back", "\u0627\u0644\u0633\u0627\u0628\u0642", "Geri", "Atr\xE1s", "\u041D\u0430\u0437\u0430\u0434", "\u4E0A\u4E00\u6B65"],
        skip: ["Skip", "\u062A\u062E\u0637\u064D\u0651", "Atla", "Omitir", "\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C", "\u8DF3\u8FC7"],
        finish: ["Let's go", "\u0644\u0646\u0628\u062F\u0623", "Ba\u015Flayal\u0131m", "\xA1Vamos!", "\u041F\u043E\u0435\u0445\u0430\u043B\u0438", "\u5F00\u59CB\u4F7F\u7528"],
        obCityTitle: ["Where are you?", "\u0623\u064A\u0646 \u062A\u0642\u064A\u0645\u061F", "Neredesiniz?", "\xBFD\xF3nde est\xE1s?", "\u0413\u0434\u0435 \u0432\u044B \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0435\u0441\u044C?", "\u4F60\u5728\u54EA\u91CC\uFF1F"],
        obCityText: ["Type your city to show the weather on the island.", "\u0627\u0643\u062A\u0628 \u0627\u0633\u0645 \u0645\u062F\u064A\u0646\u062A\u0643 \u0644\u0639\u0631\u0636 \u0627\u0644\u0637\u0642\u0633 \u0639\u0644\u0649 \u0627\u0644\u062C\u0632\u064A\u0631\u0629.", "Adada hava durumunu g\xF6stermek i\xE7in \u015Fehrinizi yaz\u0131n.", "Escribe tu ciudad para ver el tiempo en la isla.", "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0433\u043E\u0440\u043E\u0434, \u0447\u0442\u043E\u0431\u044B \u0432\u0438\u0434\u0435\u0442\u044C \u043F\u043E\u0433\u043E\u0434\u0443 \u043D\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0435.", "\u8F93\u5165\u4F60\u6240\u5728\u7684\u57CE\u5E02\uFF0C\u5373\u53EF\u5728\u60AC\u6D6E\u5C9B\u4E0A\u663E\u793A\u5929\u6C14\u3002"],
        obPhoneTitle: ["Connect your phone", "\u0627\u0631\u0628\u0637 \u0647\u0627\u062A\u0641\u0643", "Telefonunuzu ba\u011Flay\u0131n", "Conecta tu tel\xE9fono", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u8FDE\u63A5\u4F60\u7684\u624B\u673A"],
        obPhoneText: ["To see your phone\u2019s music, notifications and calls (no Phone Link needed), install the free KDE Connect app on your phone. Phone and PC must be on the same Wi-Fi.", "\u0644\u0639\u0631\u0636 \u0645\u0648\u0633\u064A\u0642\u0649 \u0647\u0627\u062A\u0641\u0643 \u0648\u0625\u0634\u0639\u0627\u0631\u0627\u062A\u0647 \u0648\u0645\u0643\u0627\u0644\u0645\u0627\u062A\u0647 (\u062F\u0648\u0646 Phone Link) \u062B\u0628\u0651\u062A \u062A\u0637\u0628\u064A\u0642 KDE Connect \u0627\u0644\u0645\u062C\u0627\u0646\u064A \u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0627\u0644\u062D\u0627\u0633\u0648\u0628 \u0639\u0644\u0649 \u0634\u0628\u0643\u0629 Wi-Fi \u0646\u0641\u0633\u0647\u0627.", "Telefonunuzun m\xFCzi\u011Fini, bildirimlerini ve aramalar\u0131n\u0131 (Phone Link gerekmeden) g\xF6rmek i\xE7in \xFCcretsiz KDE Connect uygulamas\u0131n\u0131 y\xFCkleyin. Telefon ve PC ayn\u0131 Wi-Fi\u2019da olmal\u0131.", "Para ver la m\xFAsica, notificaciones y llamadas del m\xF3vil (sin Phone Link), instala la app gratuita KDE Connect. El m\xF3vil y el PC deben estar en la misma Wi-Fi.", "\u0427\u0442\u043E\u0431\u044B \u0432\u0438\u0434\u0435\u0442\u044C \u043C\u0443\u0437\u044B\u043A\u0443, \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0438 \u0437\u0432\u043E\u043D\u043A\u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 (\u0431\u0435\u0437 Phone Link), \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 KDE Connect. \u0422\u0435\u043B\u0435\u0444\u043E\u043D \u0438 \u041F\u041A \u0434\u043E\u043B\u0436\u043D\u044B \u0431\u044B\u0442\u044C \u0432 \u043E\u0434\u043D\u043E\u0439 \u0441\u0435\u0442\u0438 Wi-Fi.", "\u8981\u5728\u60AC\u6D6E\u5C9B\u4E0A\u67E5\u770B\u624B\u673A\u7684\u97F3\u4E50\u3001\u901A\u77E5\u548C\u6765\u7535\uFF08\u65E0\u9700 Phone Link\uFF09\uFF0C\u8BF7\u5728\u624B\u673A\u4E0A\u5B89\u88C5\u514D\u8D39\u7684 KDE Connect \u5E94\u7528\u3002\u624B\u673A\u548C\u7535\u8111\u9700\u8FDE\u63A5\u540C\u4E00 Wi-Fi\u3002"],
        obDoneTitle: ["All set!", "\u0643\u0644 \u0634\u064A\u0621 \u062C\u0627\u0647\u0632!", "Her \u015Fey haz\u0131r!", "\xA1Todo listo!", "\u0412\u0441\u0451 \u0433\u043E\u0442\u043E\u0432\u043E!", "\u4E00\u5207\u5C31\u7EEA\uFF01"],
        obDoneText: ["The island is waiting at the top of your screen. Use \u201CTry it\u201D to preview every state.", "\u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0628\u0627\u0646\u062A\u0638\u0627\u0631\u0643 \u0623\u0639\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629. \u0627\u0633\u062A\u062E\u062F\u0645 \xAB\u062C\u0631\u0651\u0628\u0647\xBB \u0644\u0645\u0639\u0627\u064A\u0646\u0629 \u0643\u0644 \u0627\u0644\u062D\u0627\u0644\u0627\u062A.", "Ada ekran\u0131n\u0131z\u0131n \xFCst\xFCnde sizi bekliyor. T\xFCm durumlar\u0131 g\xF6rmek i\xE7in \u201CDeneyin\u201Di kullan\u0131n.", "La isla te espera arriba de la pantalla. Usa \u201CPru\xE9balo\u201D para ver todos los estados.", "\u041E\u0441\u0442\u0440\u043E\u0432 \u0436\u0434\u0451\u0442 \u0432\u0432\u0435\u0440\u0445\u0443 \u044D\u043A\u0440\u0430\u043D\u0430. \u0420\u0430\u0437\u0434\u0435\u043B \xAB\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C\xBB \u043F\u043E\u043A\u0430\u0436\u0435\u0442 \u0432\u0441\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F.", "\u60AC\u6D6E\u5C9B\u5DF2\u5728\u5C4F\u5E55\u9876\u90E8\u7B49\u4F60\u3002\u4F7F\u7528\u201C\u8BD5\u4E00\u8BD5\u201D\u9884\u89C8\u6240\u6709\u72B6\u6001\u3002"],
        // ---------------------------------------------------------------- settings: appearance
        language: ["Language", "\u0627\u0644\u0644\u063A\u0629", "Dil", "Idioma", "\u042F\u0437\u044B\u043A", "\u8BED\u8A00"],
        languageHint: ["Language of the island and settings", "\u0644\u063A\u0629 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0648\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", "Ada ve ayarlar\u0131n dili", "Idioma de la isla y los ajustes", "\u042F\u0437\u044B\u043A \u043E\u0441\u0442\u0440\u043E\u0432\u0430 \u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A", "\u60AC\u6D6E\u5C9B\u548C\u8BBE\u7F6E\u7684\u8BED\u8A00"],
        style: ["Island style", "\u0646\u0645\u0637 \u0627\u0644\u062C\u0632\u064A\u0631\u0629", "Ada stili", "Estilo de la isla", "\u0421\u0442\u0438\u043B\u044C \u043E\u0441\u0442\u0440\u043E\u0432\u0430", "\u60AC\u6D6E\u5C9B\u6837\u5F0F"],
        floating: ["Floating", "\u0639\u0627\u0626\u0645\u0629", "Y\xFCzen", "Flotante", "\u041F\u043B\u0430\u0432\u0430\u044E\u0449\u0438\u0439", "\u60AC\u6D6E"],
        notch: ["Notch (attached to edge)", "\u0646\u062A\u0648\u0621 (\u0645\u0644\u062A\u0635\u0642 \u0628\u0627\u0644\u062D\u0627\u0641\u0629)", "\xC7entik (kenara biti\u015Fik)", "Notch (pegada al borde)", "\u0412\u044B\u0440\u0435\u0437 (\u0443 \u043A\u0440\u0430\u044F)", "\u5218\u6D77\uFF08\u8D34\u8FB9\uFF09"],
        scale: ["Size", "\u0627\u0644\u062D\u062C\u0645", "Boyut", "Tama\xF1o", "\u0420\u0430\u0437\u043C\u0435\u0440", "\u5927\u5C0F"],
        topOffset: ["Top offset", "\u0627\u0644\u0645\u0633\u0627\u0641\u0629 \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649", "\xDCst bo\u015Fluk", "Margen superior", "\u041E\u0442\u0441\u0442\u0443\u043F \u0441\u0432\u0435\u0440\u0445\u0443", "\u9876\u90E8\u95F4\u8DDD"],
        accent: ["Accent color", "\u0644\u0648\u0646 \u0627\u0644\u062A\u0645\u064A\u064A\u0632", "Vurgu rengi", "Color de acento", "\u0410\u043A\u0446\u0435\u043D\u0442\u043D\u044B\u0439 \u0446\u0432\u0435\u0442", "\u5F3A\u8C03\u8272"],
        auto: ["Auto (Windows accent)", "\u062A\u0644\u0642\u0627\u0626\u064A (\u0644\u0648\u0646 Windows)", "Otomatik (Windows rengi)", "Autom\xE1tico (color de Windows)", "\u0410\u0432\u0442\u043E (\u0446\u0432\u0435\u0442 Windows)", "\u81EA\u52A8\uFF08Windows \u5F3A\u8C03\u8272\uFF09"],
        glow: ["Ambient glow", "\u062A\u0648\u0647\u0651\u062C \u0645\u062D\u064A\u0637\u064A", "Ortam par\u0131lt\u0131s\u0131", "Brillo ambiental", "\u0426\u0432\u0435\u0442\u043D\u043E\u0435 \u0441\u0432\u0435\u0447\u0435\u043D\u0438\u0435", "\u73AF\u5883\u5149\u6655"],
        glowHint: ["A soft glow sampled from album art and calls", "\u062A\u0648\u0647\u0651\u062C \u0645\u0623\u062E\u0648\u0630 \u0645\u0646 \u063A\u0644\u0627\u0641 \u0627\u0644\u0623\u0644\u0628\u0648\u0645 \u0648\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A", "Alb\xFCm kapa\u011F\u0131ndan al\u0131nan yumu\u015Fak bir par\u0131lt\u0131", "Un brillo tomado de la portada y las llamadas", "\u0421\u0432\u0435\u0447\u0435\u043D\u0438\u0435 \u0432 \u0446\u0432\u0435\u0442\u0430\u0445 \u043E\u0431\u043B\u043E\u0436\u043A\u0438 \u0438 \u0437\u0432\u043E\u043D\u043A\u043E\u0432", "\u53D6\u81EA\u4E13\u8F91\u5C01\u9762\u548C\u6765\u7535\u7684\u67D4\u548C\u5149\u6655"],
        edgeLight: ["Edge light", "\u0636\u0648\u0621 \u0627\u0644\u062D\u0627\u0641\u0629", "Kenar \u0131\u015F\u0131\u011F\u0131", "Luz de borde", "\u041F\u043E\u0434\u0441\u0432\u0435\u0442\u043A\u0430 \u043A\u0440\u0430\u044F", "\u8FB9\u7F18\u5149"],
        edgeLightHint: ["A light that sweeps the border when something arrives", "\u0636\u0648\u0621 \u064A\u062F\u0648\u0631 \u062D\u0648\u0644 \u0627\u0644\u062D\u0627\u0641\u0629 \u0639\u0646\u062F \u0648\u0635\u0648\u0644 \u0634\u064A\u0621", "Bir \u015Fey geldi\u011Finde kenarda dola\u015Fan \u0131\u015F\u0131k", "Una luz que recorre el borde al llegar algo", "\u0421\u0432\u0435\u0442, \u0431\u0435\u0433\u0443\u0449\u0438\u0439 \u043F\u043E \u043A\u0440\u0430\u044E \u043F\u0440\u0438 \u0441\u043E\u0431\u044B\u0442\u0438\u0438", "\u6709\u65B0\u5185\u5BB9\u65F6\u6CBF\u8FB9\u7F18\u626B\u8FC7\u7684\u5149"],
        blinkHello: ["Say hello at start", "\u0627\u0644\u062A\u062D\u064A\u0629 \u0639\u0646\u062F \u0627\u0644\u062A\u0634\u063A\u064A\u0644", "A\xE7\u0131l\u0131\u015Fta selam ver", "Saludar al iniciar", "\u041F\u0440\u0438\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435", "\u542F\u52A8\u65F6\u6253\u62DB\u547C"],
        blinkHelloHint: ["When the app starts, the island opens its eyes, looks around and winks", "\u0639\u0646\u062F \u0628\u062F\u0621 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u062A\u0641\u062A\u062D \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0639\u064A\u0646\u064A\u0647\u0627 \u0648\u062A\u062A\u0644\u0641\u0651\u062A \u0648\u062A\u063A\u0645\u0632", "Uygulama a\xE7\u0131l\u0131nca ada g\xF6zlerini a\xE7ar, etrafa bakar ve g\xF6z k\u0131rpar", "Al iniciar la app, la isla abre los ojos, mira alrededor y gui\xF1a", "\u041F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435 \u043E\u0441\u0442\u0440\u043E\u0432 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0433\u043B\u0430\u0437\u0430, \u043E\u0433\u043B\u044F\u0434\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0438 \u043F\u043E\u0434\u043C\u0438\u0433\u0438\u0432\u0430\u0435\u0442", "\u5E94\u7528\u542F\u52A8\u65F6\uFF0C\u60AC\u6D6E\u5C9B\u4F1A\u7741\u773C\u3001\u5F20\u671B\u5E76\u7728\u773C"],
        blinkIdle: ["Blinkelo\u2019s eyes", "\u0639\u064A\u0646\u0627 Blinkelo", "Blinkelo\u2019nun g\xF6zleri", "Los ojos de Blinkelo", "\u0413\u043B\u0430\u0437\u0430 Blinkelo", "Blinkelo \u7684\u773C\u775B"],
        blinkIdleHint: ["Every minute or two while the island is idle, it opens its eyes, looks around and winks", "\u0643\u0644 \u062F\u0642\u064A\u0642\u0629 \u0623\u0648 \u0627\u062B\u0646\u062A\u064A\u0646 \u062D\u064A\u0646 \u062A\u0643\u0648\u0646 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u062E\u0627\u0645\u0644\u0629 \u062A\u0641\u062A\u062D \u0639\u064A\u0646\u064A\u0647\u0627 \u0648\u062A\u062A\u0644\u0641\u0651\u062A \u0648\u062A\u063A\u0645\u0632", "Ada bo\u015Ftayken bir iki dakikada bir g\xF6zlerini a\xE7ar, etrafa bakar ve g\xF6z k\u0131rpar", "Cada uno o dos minutos, con la isla inactiva, abre los ojos, mira alrededor y gui\xF1a", "\u0420\u0430\u0437 \u0432 \u043C\u0438\u043D\u0443\u0442\u0443-\u0434\u0432\u0435, \u043F\u043E\u043A\u0430 \u043E\u0441\u0442\u0440\u043E\u0432 \u043F\u0440\u043E\u0441\u0442\u0430\u0438\u0432\u0430\u0435\u0442, \u043E\u043D \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0433\u043B\u0430\u0437\u0430, \u043E\u0433\u043B\u044F\u0434\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0438 \u043F\u043E\u0434\u043C\u0438\u0433\u0438\u0432\u0430\u0435\u0442", "\u60AC\u6D6E\u5C9B\u7A7A\u95F2\u65F6\u6BCF\u9694\u4E00\u4E24\u5206\u949F\u4F1A\u7741\u773C\u3001\u5F20\u671B\u5E76\u7728\u773C"],
        blinkEvents: ["Blink for new things", "\u0631\u0645\u0634\u0629 \u0644\u0643\u0644 \u062C\u062F\u064A\u062F", "Yeniliklerde g\xF6z k\u0131rp", "Parpadear con lo nuevo", "\u041C\u043E\u0440\u0433\u0430\u0442\u044C \u043F\u0440\u0438 \u043D\u043E\u0432\u043E\u043C", "\u65B0\u4E8B\u4EF6\u65F6\u7728\u773C"],
        blinkEventsHint: ["New notifications, messages, calls, files and songs appear with a blink, and the tray icon blinks too", "\u062A\u0638\u0647\u0631 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0648\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0648\u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0648\u0627\u0644\u0623\u063A\u0627\u0646\u064A \u0627\u0644\u062C\u062F\u064A\u062F\u0629 \u0628\u0631\u0645\u0634\u0629\u060C \u0648\u062A\u0631\u0645\u0634 \u0623\u064A\u0642\u0648\u0646\u0629 \u0634\u0631\u064A\u0637 \u0627\u0644\u0645\u0647\u0627\u0645 \u0623\u064A\u0636\u064B\u0627", "Yeni bildirimler, mesajlar, aramalar, dosyalar ve \u015Fark\u0131lar bir k\u0131rp\u0131\u015Fla belirir; tepsi simgesi de g\xF6z k\u0131rpar", "Las notificaciones, mensajes, llamadas, archivos y canciones nuevos aparecen con un parpadeo, y el icono de la bandeja tambi\xE9n parpadea", "\u041D\u043E\u0432\u044B\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F, \u0437\u0432\u043E\u043D\u043A\u0438, \u0444\u0430\u0439\u043B\u044B \u0438 \u043F\u0435\u0441\u043D\u0438 \u043F\u043E\u044F\u0432\u043B\u044F\u044E\u0442\u0441\u044F \u0441 \u043C\u043E\u0440\u0433\u0430\u043D\u0438\u0435\u043C, \u0438 \u0437\u043D\u0430\u0447\u043E\u043A \u0432 \u0442\u0440\u0435\u0435 \u0442\u043E\u0436\u0435 \u043C\u043E\u0440\u0433\u0430\u0435\u0442", "\u65B0\u901A\u77E5\u3001\u6D88\u606F\u3001\u6765\u7535\u3001\u6587\u4EF6\u548C\u6B4C\u66F2\u4F1A\u968F\u4E00\u6B21\u7728\u773C\u51FA\u73B0\uFF0C\u6258\u76D8\u56FE\u6807\u4E5F\u4F1A\u7728\u773C"],
        blinkHi: ["Hi! I\u2019m Blinkelo", "\u0645\u0631\u062D\u0628\u064B\u0627! \u0623\u0646\u0627 Blinkelo", "Merhaba! Ben Blinkelo", "\xA1Hola! Soy Blinkelo", "\u041F\u0440\u0438\u0432\u0435\u0442! \u042F Blinkelo", "\u4F60\u597D\uFF01\u6211\u662F Blinkelo"],
        blinkTagline: ["Every new thing, in a blink", "\u0643\u0644 \u062C\u062F\u064A\u062F\u060C \u0641\u064A \u0631\u0645\u0634\u0629", "Her yenilik, bir g\xF6z k\u0131rp\u0131\u015F\u0131nda", "Cada novedad, en un parpadeo", "\u0412\u0441\u0451 \u043D\u043E\u0432\u043E\u0435 \u2014 \u0432 \u043E\u0434\u043D\u043E \u043C\u043E\u0440\u0433\u0430\u043D\u0438\u0435", "\u6BCF\u6761\u65B0\u6D88\u606F\uFF0C\u7728\u773C\u5373\u8FBE"],
        idleClock: ["Clock & temperature when idle", "\u0627\u0644\u0633\u0627\u0639\u0629 \u0648\u0627\u0644\u062D\u0631\u0627\u0631\u0629 \u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u062E\u0645\u0648\u0644", "Bo\u015Ftayken saat ve s\u0131cakl\u0131k", "Reloj y temperatura en reposo", "\u0427\u0430\u0441\u044B \u0438 \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u0432 \u043F\u043E\u043A\u043E\u0435", "\u7A7A\u95F2\u65F6\u663E\u793A\u65F6\u949F\u548C\u6E29\u5EA6"],
        compactInfo: ["Show track/video title in the compact island", "\u0625\u0638\u0647\u0627\u0631 \u0627\u0633\u0645 \u0627\u0644\u0645\u0642\u0637\u0639 \u0641\u064A \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0627\u0644\u0645\u0635\u063A\u0651\u0631\u0629", "K\xFC\xE7\xFCk adada par\xE7a/video ad\u0131n\u0131 g\xF6ster", "Mostrar el t\xEDtulo en la isla compacta", "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0432 \u043A\u043E\u043C\u043F\u0430\u043A\u0442\u043D\u043E\u043C \u043E\u0441\u0442\u0440\u043E\u0432\u0435", "\u5728\u7D27\u51D1\u60AC\u6D6E\u5C9B\u4E2D\u663E\u793A\u66F2\u76EE/\u89C6\u9891\u540D\u79F0"],
        compactInfoHint: ["While something plays on the PC or phone, its title appears next to the cover", "\u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0639\u0644\u0649 \u0627\u0644\u062D\u0627\u0633\u0648\u0628 \u0623\u0648 \u0627\u0644\u0647\u0627\u062A\u0641 \u064A\u0638\u0647\u0631 \u0627\u0644\u0627\u0633\u0645 \u0628\u062C\u0627\u0646\u0628 \u0627\u0644\u063A\u0644\u0627\u0641", "Bilgisayarda veya telefonda \xE7alarken ad\u0131 kapa\u011F\u0131n yan\u0131nda g\xF6r\xFCn\xFCr", "Mientras algo suena en el PC o el m\xF3vil, el t\xEDtulo aparece junto a la portada", "\u0412\u043E \u0432\u0440\u0435\u043C\u044F \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F \u043D\u0430 \u041F\u041A \u0438\u043B\u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0432\u0438\u0434\u043D\u043E \u0440\u044F\u0434\u043E\u043C \u0441 \u043E\u0431\u043B\u043E\u0436\u043A\u043E\u0439", "\u7535\u8111\u6216\u624B\u673A\u64AD\u653E\u65F6\uFF0C\u5728\u5C01\u9762\u65C1\u663E\u793A\u540D\u79F0"],
        idleClockHint: ["Always show the time on the island", "\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0648\u0642\u062A \u062F\u0627\u0626\u0645\u064B\u0627 \u0639\u0644\u0649 \u0627\u0644\u062C\u0632\u064A\u0631\u0629", "Saati her zaman adada g\xF6ster", "Mostrar siempre la hora en la isla", "\u0412\u0441\u0435\u0433\u0434\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0432\u0440\u0435\u043C\u044F", "\u59CB\u7EC8\u5728\u60AC\u6D6E\u5C9B\u4E0A\u663E\u793A\u65F6\u95F4"],
        // ---------------------------------------------------------------- settings: features
        m_media: ["Now Playing", "\u0642\u064A\u062F \u0627\u0644\u062A\u0634\u063A\u064A\u0644", "\u015Eimdi \xE7al\u0131yor", "Reproduciendo", "\u0421\u0435\u0439\u0447\u0430\u0441 \u0438\u0433\u0440\u0430\u0435\u0442", "\u6B63\u5728\u64AD\u653E"],
        m_media_d: ["From Spotify, browsers, YouTube \u2014 and your phone", "\u0645\u0646 Spotify \u0648\u0627\u0644\u0645\u062A\u0635\u0641\u062D\u0627\u062A \u0648YouTube \u0648\u062D\u062A\u0649 \u0647\u0627\u062A\u0641\u0643", "Spotify, taray\u0131c\u0131lar, YouTube ve telefonunuzdan", "De Spotify, navegadores, YouTube y tu m\xF3vil", "Spotify, \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u044B, YouTube \u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u6765\u81EA Spotify\u3001\u6D4F\u89C8\u5668\u3001YouTube \u4EE5\u53CA\u624B\u673A"],
        m_visualizer: ["Real audio visualizer", "\u0645\u064F\u062E\u0637\u0650\u0651\u0637 \u0635\u0648\u062A\u064A \u062D\u0642\u064A\u0642\u064A", "Ger\xE7ek ses g\xF6rselle\u015Ftirici", "Visualizador de audio real", "\u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u0432\u0438\u0437\u0443\u0430\u043B\u0438\u0437\u0430\u0442\u043E\u0440", "\u771F\u5B9E\u97F3\u9891\u53EF\u89C6\u5316"],
        m_visualizer_d: ["Bars move with the actual system audio", "\u062A\u062A\u062D\u0631\u0643 \u0627\u0644\u0623\u0639\u0645\u062F\u0629 \u0645\u0639 \u0635\u0648\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0627\u0644\u0641\u0639\u0644\u064A", "\xC7ubuklar ger\xE7ek sistem sesiyle hareket eder", "Las barras siguen el audio real del sistema", "\u041F\u043E\u043B\u043E\u0441\u044B \u0434\u0432\u0438\u0433\u0430\u044E\u0442\u0441\u044F \u0432 \u0442\u0430\u043A\u0442 \u0437\u0432\u0443\u043A\u0443 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", "\u97F3\u67F1\u968F\u7CFB\u7EDF\u771F\u5B9E\u97F3\u9891\u8DF3\u52A8"],
        m_notifications: ["Notifications", "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", "Bildirimler", "Notificaciones", "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F", "\u901A\u77E5"],
        m_notifications_d: ["Windows and phone notifications in the island", "\u0625\u0634\u0639\u0627\u0631\u0627\u062A Windows \u0648\u0627\u0644\u0647\u0627\u062A\u0641 \u062F\u0627\u062E\u0644 \u0627\u0644\u062C\u0632\u064A\u0631\u0629", "Adada Windows ve telefon bildirimleri", "Notificaciones de Windows y del m\xF3vil en la isla", "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F Windows \u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u043D\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0435", "\u5728\u60AC\u6D6E\u5C9B\u4E2D\u663E\u793A Windows \u4E0E\u624B\u673A\u901A\u77E5"],
        m_phoneCalls: ["Incoming calls", "\u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u0648\u0627\u0631\u062F\u0629", "Gelen aramalar", "Llamadas entrantes", "\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u0432\u044B\u0437\u043E\u0432\u044B", "\u6765\u7535"],
        m_phoneCalls_d: ["Phone calls (Phone Link or KDE Connect)", "\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0627\u0644\u0647\u0627\u062A\u0641 (Phone Link \u0623\u0648 KDE Connect)", "Telefon aramalar\u0131 (Phone Link veya KDE Connect)", "Llamadas (Phone Link o KDE Connect)", "\u0417\u0432\u043E\u043D\u043A\u0438 (Phone Link \u0438\u043B\u0438 KDE Connect)", "\u624B\u673A\u6765\u7535\uFF08Phone Link \u6216 KDE Connect\uFF09"],
        m_volumeHud: ["Volume HUD", "\u0645\u0624\u0634\u0631 \u0627\u0644\u0635\u0648\u062A", "Ses g\xF6stergesi", "Indicador de volumen", "\u0418\u043D\u0434\u0438\u043A\u0430\u0442\u043E\u0440 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u0438", "\u97F3\u91CF\u63D0\u793A"],
        m_volumeHud_d: ["Shows volume changes; scroll on the island to change it", "\u064A\u0639\u0631\u0636 \u062A\u063A\u064A\u0651\u0631 \u0627\u0644\u0635\u0648\u062A\u061B \u0645\u0631\u0651\u0631 \u0639\u0644\u0649 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0644\u062A\u063A\u064A\u064A\u0631\u0647", "Ses de\u011Fi\u015Fimlerini g\xF6sterir; de\u011Fi\u015Ftirmek i\xE7in kayd\u0131r\u0131n", "Muestra cambios de volumen; desplaza para cambiarlo", "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u044C; \u043F\u0440\u043E\u043A\u0440\u0443\u0442\u043A\u0430 \u043C\u0435\u043D\u044F\u0435\u0442 \u0435\u0451", "\u663E\u793A\u97F3\u91CF\u53D8\u5316\uFF1B\u5728\u60AC\u6D6E\u5C9B\u4E0A\u6EDA\u52A8\u5373\u53EF\u8C03\u8282"],
        m_battery: ["Charging & battery", "\u0627\u0644\u0634\u062D\u0646 \u0648\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", "\u015Earj ve pil", "Carga y bater\xEDa", "\u0417\u0430\u0440\u044F\u0434\u043A\u0430 \u0438 \u0431\u0430\u0442\u0430\u0440\u0435\u044F", "\u5145\u7535\u4E0E\u7535\u6C60"],
        m_battery_d: ["Charger plugged/unplugged and low battery", "\u062A\u0648\u0635\u064A\u0644/\u0641\u0635\u0644 \u0627\u0644\u0634\u0627\u062D\u0646 \u0648\u0627\u0646\u062E\u0641\u0627\u0636 \u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629", "\u015Earj tak\u0131ld\u0131/\xE7\u0131kar\u0131ld\u0131 ve d\xFC\u015F\xFCk pil", "Cargador conectado/desconectado y bater\xEDa baja", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0437\u0430\u0440\u044F\u0434\u043A\u0438 \u0438 \u043D\u0438\u0437\u043A\u0438\u0439 \u0437\u0430\u0440\u044F\u0434", "\u5145\u7535\u5668\u63D2\u62D4\u4E0E\u4F4E\u7535\u91CF\u63D0\u9192"],
        m_capsLock: ["Caps Lock", "Caps Lock", "Caps Lock", "Bloq May\xFAs", "Caps Lock", "\u5927\u5199\u9501\u5B9A"],
        m_capsLock_d: ["Show when Caps Lock toggles", "\u0625\u0638\u0647\u0627\u0631 \u062A\u0628\u062F\u064A\u0644 Caps Lock", "Caps Lock de\u011Fi\u015Fti\u011Finde g\xF6ster", "Mostrar al cambiar Bloq May\xFAs", "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 Caps Lock", "\u5207\u6362\u5927\u5199\u9501\u5B9A\u65F6\u63D0\u793A"],
        m_numLock: ["Num Lock", "Num Lock", "Num Lock", "Bloq Num", "Num Lock", "\u6570\u5B57\u9501\u5B9A"],
        m_numLock_d: ["Show when Num Lock toggles", "\u0625\u0638\u0647\u0627\u0631 \u062A\u0628\u062F\u064A\u0644 Num Lock", "Num Lock de\u011Fi\u015Fti\u011Finde g\xF6ster", "Mostrar al cambiar Bloq Num", "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 Num Lock", "\u5207\u6362\u6570\u5B57\u9501\u5B9A\u65F6\u63D0\u793A"],
        m_clipboard: ["Clipboard", "\u0627\u0644\u062D\u0627\u0641\u0638\u0629", "Pano", "Portapapeles", "\u0411\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430", "\u526A\u8D34\u677F"],
        m_clipboard_d: ["Copy confirmation and history (passwords are hidden)", "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0646\u0633\u062E \u0648\u0627\u0644\u0633\u062C\u0644 (\u0643\u0644\u0645\u0627\u062A \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u062E\u0641\u064A\u0629)", "Kopyalama onay\u0131 ve ge\xE7mi\u015F (parolalar gizli)", "Confirmaci\xF3n de copia e historial (contrase\xF1as ocultas)", "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F (\u043F\u0430\u0440\u043E\u043B\u0438 \u0441\u043A\u0440\u044B\u0442\u044B)", "\u590D\u5236\u63D0\u793A\u4E0E\u5386\u53F2\uFF08\u9690\u85CF\u5BC6\u7801\uFF09"],
        m_privacy: ["Privacy indicators", "\u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629", "Gizlilik g\xF6stergeleri", "Indicadores de privacidad", "\u0418\u043D\u0434\u0438\u043A\u0430\u0442\u043E\u0440\u044B \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u043E\u0441\u0442\u0438", "\u9690\u79C1\u6307\u793A"],
        m_privacy_d: ["A dot when the microphone or camera is in use", "\u0646\u0642\u0637\u0629 \u0639\u0646\u062F \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646 \u0623\u0648 \u0627\u0644\u0643\u0627\u0645\u064A\u0631\u0627", "Mikrofon veya kamera kullan\u0131l\u0131rken nokta", "Un punto cuando se usa el micr\xF3fono o la c\xE1mara", "\u0422\u043E\u0447\u043A\u0430, \u043A\u043E\u0433\u0434\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u043C\u0438\u043A\u0440\u043E\u0444\u043E\u043D \u0438\u043B\u0438 \u043A\u0430\u043C\u0435\u0440\u0430", "\u9EA6\u514B\u98CE\u6216\u6444\u50CF\u5934\u4F7F\u7528\u65F6\u663E\u793A\u5706\u70B9"],
        m_stats: ["System stats", "\u0625\u062D\u0635\u0627\u0621\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645", "Sistem durumu", "Estado del sistema", "\u0421\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", "\u7CFB\u7EDF\u72B6\u6001"],
        m_stats_d: ["CPU, RAM, GPU and network speed", "\u0627\u0644\u0645\u0639\u0627\u0644\u062C \u0648\u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0648\u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A \u0648\u0633\u0631\u0639\u0629 \u0627\u0644\u0634\u0628\u0643\u0629", "\u0130\u015Flemci, bellek, GPU ve a\u011F h\u0131z\u0131", "CPU, RAM, GPU y velocidad de red", "\u0426\u041F, \u041E\u0417\u0423, \u0413\u041F \u0438 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0441\u0435\u0442\u0438", "CPU\u3001\u5185\u5B58\u3001GPU \u548C\u7F51\u901F"],
        m_shelf: ["File shelf", "\u0631\u0641 \u0627\u0644\u0645\u0644\u0641\u0627\u062A", "Dosya raf\u0131", "Estante de archivos", "\u041F\u043E\u043B\u043A\u0430 \u0444\u0430\u0439\u043B\u043E\u0432", "\u6587\u4EF6\u67B6"],
        m_shelf_d: ["Drop files on the island, drag them out later", "\u0623\u0641\u0644\u062A \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0639\u0644\u0649 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0648\u0627\u0633\u062D\u0628\u0647\u0627 \u0644\u0627\u062D\u0642\u064B\u0627", "Dosyalar\u0131 adaya b\u0131rak\u0131n, sonra s\xFCr\xFCkleyip \xE7\u0131kar\u0131n", "Suelta archivos en la isla y s\xE1calos luego", "\u0411\u0440\u043E\u0441\u0430\u0439\u0442\u0435 \u0444\u0430\u0439\u043B\u044B \u043D\u0430 \u043E\u0441\u0442\u0440\u043E\u0432 \u0438 \u0437\u0430\u0431\u0438\u0440\u0430\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435", "\u628A\u6587\u4EF6\u62D6\u5230\u60AC\u6D6E\u5C9B\uFF0C\u7A0D\u540E\u518D\u62D6\u51FA"],
        m_timer: ["Timer & stopwatch", "\u0627\u0644\u0645\u0624\u0642\u0651\u062A \u0648\u0633\u0627\u0639\u0629 \u0627\u0644\u0625\u064A\u0642\u0627\u0641", "Zamanlay\u0131c\u0131 ve kronometre", "Temporizador y cron\xF3metro", "\u0422\u0430\u0439\u043C\u0435\u0440 \u0438 \u0441\u0435\u043A\u0443\u043D\u0434\u043E\u043C\u0435\u0440", "\u8BA1\u65F6\u5668\u4E0E\u79D2\u8868"],
        m_timer_d: ["Live timer with progress ring and chime", "\u0645\u0624\u0642\u0651\u062A \u062D\u064A \u0628\u062D\u0644\u0642\u0629 \u062A\u0642\u062F\u0651\u0645 \u0648\u062A\u0646\u0628\u064A\u0647", "\u0130lerleme halkal\u0131 ve sesli canl\u0131 zamanlay\u0131c\u0131", "Temporizador en vivo con anillo y aviso", "\u0416\u0438\u0432\u043E\u0439 \u0442\u0430\u0439\u043C\u0435\u0440 \u0441 \u043A\u043E\u043B\u044C\u0446\u043E\u043C \u0438 \u0441\u0438\u0433\u043D\u0430\u043B\u043E\u043C", "\u5E26\u8FDB\u5EA6\u73AF\u548C\u63D0\u793A\u97F3\u7684\u5B9E\u65F6\u8BA1\u65F6\u5668"],
        m_weather: ["Weather", "\u0627\u0644\u0637\u0642\u0633", "Hava durumu", "Tiempo", "\u041F\u043E\u0433\u043E\u0434\u0430", "\u5929\u6C14"],
        m_weather_d: ["Current temperature and forecast for your city", "\u0627\u0644\u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0648\u0627\u0644\u062A\u0648\u0642\u0639\u0627\u062A \u0644\u0645\u062F\u064A\u0646\u062A\u0643", "\u015Eehriniz i\xE7in anl\u0131k s\u0131cakl\u0131k ve tahmin", "Temperatura actual y previsi\xF3n de tu ciudad", "\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u0438 \u043F\u0440\u043E\u0433\u043D\u043E\u0437", "\u4F60\u6240\u5728\u57CE\u5E02\u7684\u5F53\u524D\u6E29\u5EA6\u4E0E\u9884\u62A5"],
        // ---------------------------------------------------------------- settings: notifications
        notifDuration: ["Notification duration", "\u0645\u062F\u0629 \u0639\u0631\u0636 \u0627\u0644\u0625\u0634\u0639\u0627\u0631", "Bildirim s\xFCresi", "Duraci\xF3n de la notificaci\xF3n", "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F", "\u901A\u77E5\u663E\u793A\u65F6\u957F"],
        seconds: ["sec", "\u062B", "sn", "s", "\u0441", "\u79D2"],
        showBody: ["Show message text", "\u0625\u0638\u0647\u0627\u0631 \u0646\u0635 \u0627\u0644\u0631\u0633\u0627\u0644\u0629", "Mesaj metnini g\xF6ster", "Mostrar el texto", "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0442\u0435\u043A\u0441\u0442", "\u663E\u793A\u6D88\u606F\u5185\u5BB9"],
        showBodyHint: ["Turn off to show only the sender", "\u0623\u0648\u0642\u0641\u0647 \u0644\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0645\u0631\u0633\u0644 \u0641\u0642\u0637", "Yaln\u0131zca g\xF6ndereni g\xF6stermek i\xE7in kapat\u0131n", "Desact\xEDvalo para ver solo el remitente", "\u0412\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0432\u0438\u0434\u0435\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u0435\u043B\u044F", "\u5173\u95ED\u540E\u4EC5\u663E\u793A\u53D1\u9001\u8005"],
        respectDnd: ["Respect Do Not Disturb", "\u0627\u062D\u062A\u0631\u0627\u0645 \u0648\u0636\u0639 \u0639\u062F\u0645 \u0627\u0644\u0625\u0632\u0639\u0627\u062C", "Rahats\u0131z Etmeyin\u2019e uy", "Respetar No molestar", "\u0423\u0447\u0438\u0442\u044B\u0432\u0430\u0442\u044C \xAB\u041D\u0435 \u0431\u0435\u0441\u043F\u043E\u043A\u043E\u0438\u0442\u044C\xBB", "\u9075\u5FAA\u52FF\u6270\u6A21\u5F0F"],
        callsOverFullscreen: ["Show calls even over fullscreen apps", "\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u062D\u062A\u0649 \u0641\u0648\u0642 \u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629", "Aramalar\u0131 tam ekranda bile g\xF6ster", "Mostrar llamadas aun en pantalla completa", "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0437\u0432\u043E\u043D\u043A\u0438 \u043F\u043E\u0432\u0435\u0440\u0445 \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0445", "\u5168\u5C4F\u65F6\u4E5F\u663E\u793A\u6765\u7535"],
        blocked: ["Blocked apps", "\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0645\u062D\u0638\u0648\u0631\u0629", "Engellenen uygulamalar", "Apps bloqueadas", "\u0417\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F", "\u5C4F\u853D\u7684\u5E94\u7528"],
        blockedHint: ["Comma-separated app names", "\u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0648\u0627\u0635\u0644", "Virg\xFClle ayr\u0131lm\u0131\u015F uygulama adlar\u0131", "Nombres de apps separados por comas", "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0447\u0435\u0440\u0435\u0437 \u0437\u0430\u043F\u044F\u0442\u0443\u044E", "\u7528\u9017\u53F7\u5206\u9694\u5E94\u7528\u540D\u79F0"],
        plTitle: ["Phone Link (optional)", "Phone Link (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)", "Phone Link (iste\u011Fe ba\u011Fl\u0131)", "Phone Link (opcional)", "Phone Link (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", "Phone Link\uFF08\u53EF\u9009\uFF09"],
        plText: ["If you use Phone Link, its messages and calls appear too, and you can answer calls from the island (keep the Phone Link call banner on).", "\u0625\u0630\u0627 \u0643\u0646\u062A \u062A\u0633\u062A\u062E\u062F\u0645 Phone Link \u0641\u0633\u062A\u0638\u0647\u0631 \u0631\u0633\u0627\u0626\u0644\u0647 \u0648\u0645\u0643\u0627\u0644\u0645\u0627\u062A\u0647 \u0623\u064A\u0636\u064B\u0627\u060C \u0648\u064A\u0645\u0643\u0646\u0643 \u0627\u0644\u0631\u062F \u0639\u0644\u0649 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0645\u0646 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 (\u0623\u0628\u0642\u0650 \u0644\u0627\u0641\u062A\u0629 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0629 \u0645\u0641\u0639\u0651\u0644\u0629).", "Phone Link kullan\u0131yorsan\u0131z mesajlar\u0131 ve aramalar\u0131 da g\xF6r\xFCn\xFCr ve aramalar\u0131 adadan yan\u0131tlayabilirsiniz (arama bildirimini a\xE7\u0131k tutun).", "Si usas Phone Link, sus mensajes y llamadas tambi\xE9n aparecen y puedes contestar desde la isla (mant\xE9n activo su aviso de llamada).", "\u0415\u0441\u043B\u0438 \u0432\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0435 Phone Link, \u0435\u0433\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0438 \u0437\u0432\u043E\u043D\u043A\u0438 \u0442\u043E\u0436\u0435 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F, \u0430 \u043D\u0430 \u0432\u044B\u0437\u043E\u0432\u044B \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u0441 \u043E\u0441\u0442\u0440\u043E\u0432\u0430 (\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0431\u0430\u043D\u043D\u0435\u0440 \u0432\u044B\u0437\u043E\u0432\u0430 \u0432\u043A\u043B\u044E\u0447\u0451\u043D\u043D\u044B\u043C).", "\u5982\u679C\u4F60\u4F7F\u7528 Phone Link\uFF0C\u5176\u6D88\u606F\u548C\u6765\u7535\u4E5F\u4F1A\u663E\u793A\uFF0C\u5E76\u53EF\u5728\u60AC\u6D6E\u5C9B\u4E0A\u63A5\u542C\uFF08\u8BF7\u4FDD\u6301\u5176\u6765\u7535\u6A2A\u5E45\u5F00\u542F\uFF09\u3002"],
        openNotifSettings: ["Windows notification settings", "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0625\u0634\u0639\u0627\u0631\u0627\u062A Windows", "Windows bildirim ayarlar\u0131", "Ajustes de notificaciones", "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439 Windows", "Windows \u901A\u77E5\u8BBE\u7F6E"],
        // ---------------------------------------------------------------- settings: phone (KDE Connect)
        phoneEnable: ["Phone connection (Blinkelo Link or KDE Connect)", "\u0631\u0628\u0637 \u0627\u0644\u0647\u0627\u062A\u0641 (Blinkelo Link \u0623\u0648 KDE Connect)", "Telefon ba\u011Flant\u0131s\u0131 (Blinkelo Link veya KDE Connect)", "Conexi\xF3n del m\xF3vil (Blinkelo Link o KDE Connect)", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 (Blinkelo Link \u0438\u043B\u0438 KDE Connect)", "\u624B\u673A\u8FDE\u63A5\uFF08Blinkelo Link \u6216 KDE Connect\uFF09"],
        phoneEnableHint: ["Phone music, notifications, calls and battery \u2014 no Phone Link", "\u0645\u0648\u0633\u064A\u0642\u0649 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0625\u0634\u0639\u0627\u0631\u0627\u062A\u0647 \u0648\u0645\u0643\u0627\u0644\u0645\u0627\u062A\u0647 \u0648\u0628\u0637\u0627\u0631\u064A\u062A\u0647 \u062F\u0648\u0646 Phone Link", "Telefon m\xFCzi\u011Fi, bildirimleri, aramalar\u0131 ve pili \u2014 Phone Link\u2019siz", "M\xFAsica, avisos, llamadas y bater\xEDa del m\xF3vil sin Phone Link", "\u041C\u0443\u0437\u044B\u043A\u0430, \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F, \u0437\u0432\u043E\u043D\u043A\u0438 \u0438 \u0431\u0430\u0442\u0430\u0440\u0435\u044F \u2014 \u0431\u0435\u0437 Phone Link", "\u65E0\u9700 Phone Link \u5373\u53EF\u83B7\u53D6\u624B\u673A\u97F3\u4E50\u3001\u901A\u77E5\u3001\u6765\u7535\u4E0E\u7535\u91CF"],
        phoneHow: ["Setup in 3 steps", "\u0627\u0644\u0625\u0639\u062F\u0627\u062F \u0641\u064A 3 \u062E\u0637\u0648\u0627\u062A", "3 ad\u0131mda kurulum", "Configuraci\xF3n en 3 pasos", "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0437\u0430 3 \u0448\u0430\u0433\u0430", "\u4E09\u6B65\u5B8C\u6210\u8BBE\u7F6E"],
        phoneStep1: ["On the phone, install \u201CBlinkelo Link\u201D (this app\u2019s Android companion, with PC remote and Bluetooth) or the free \u201CKDE Connect\u201D app.", "\u062B\u0628\u0651\u062A \u0639\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641 \u062A\u0637\u0628\u064A\u0642 \xABBlinkelo Link\xBB (\u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0631\u0627\u0641\u0642 \u0645\u0639 \u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631 \u0648\u0627\u0644\u0628\u0644\u0648\u062A\u0648\u062B) \u0623\u0648 \u062A\u0637\u0628\u064A\u0642 \xABKDE Connect\xBB \u0627\u0644\u0645\u062C\u0627\u0646\u064A.", "Telefona \u201CBlinkelo Link\u201Di (PC kumandas\u0131 ve Bluetooth\u2019lu e\u015Flik\xE7i uygulama) veya \xFCcretsiz \u201CKDE Connect\u201Di kurun.", "Instala en el m\xF3vil \u201CBlinkelo Link\u201D (la app compa\xF1era, con mando del PC y Bluetooth) o la app gratuita \u201CKDE Connect\u201D.", "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \xABBlinkelo Link\xBB (\u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435-\u043A\u043E\u043C\u043F\u0430\u043D\u044C\u043E\u043D \u0441 \u043F\u0443\u043B\u044C\u0442\u043E\u043C \u041F\u041A \u0438 Bluetooth) \u0438\u043B\u0438 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E\u0435 \xABKDE Connect\xBB.", "\u5728\u624B\u673A\u4E0A\u5B89\u88C5\u201CBlinkelo Link\u201D\uFF08\u672C\u5E94\u7528\u7684 Android \u914D\u5957\u5E94\u7528\uFF0C\u652F\u6301\u8FDC\u7A0B\u63A7\u5236\u7535\u8111\u548C\u84DD\u7259\uFF09\u6216\u514D\u8D39\u7684\u201CKDE Connect\u201D\u3002"],
        phoneStep2: ["Put the phone and PC on the same Wi-Fi and open the app \u2014 this PC shows up in the list. If Windows asks about network access, click \u201CAllow\u201D.", "\u0635\u0650\u0644 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0627\u0644\u062D\u0627\u0633\u0648\u0628 \u0628\u0634\u0628\u0643\u0629 Wi-Fi \u0646\u0641\u0633\u0647\u0627 \u0648\u0627\u0641\u062A\u062D \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u060C \u0648\u0633\u064A\u0638\u0647\u0631 \u0647\u0630\u0627 \u0627\u0644\u062D\u0627\u0633\u0648\u0628. \u0625\u0630\u0627 \u0633\u0623\u0644 Windows \u0639\u0646 \u0627\u0644\u0634\u0628\u0643\u0629 \u0641\u0627\u0646\u0642\u0631 \xABAllow\xBB.", "Telefonu ve PC\u2019yi ayn\u0131 Wi-Fi\u2019a ba\u011Flay\u0131p uygulamay\u0131 a\xE7\u0131n; bu PC listede g\xF6r\xFCn\xFCr. Windows a\u011F izni sorarsa \u201C\u0130zin ver\u201De t\u0131klay\u0131n.", "Conecta m\xF3vil y PC a la misma Wi-Fi y abre la app: este PC aparecer\xE1. Si Windows pregunta por la red, pulsa \u201CPermitir\u201D.", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0438 \u041F\u041A \u043A \u043E\u0434\u043D\u043E\u0439 Wi-Fi \u0438 \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u2014 \u044D\u0442\u043E\u0442 \u041F\u041A \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0432 \u0441\u043F\u0438\u0441\u043A\u0435. \u0415\u0441\u043B\u0438 Windows \u0441\u043F\u0440\u043E\u0441\u0438\u0442 \u043E \u0434\u043E\u0441\u0442\u0443\u043F\u0435 \u043A \u0441\u0435\u0442\u0438, \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u044C\xBB.", "\u8BA9\u624B\u673A\u548C\u7535\u8111\u8FDE\u63A5\u540C\u4E00 Wi-Fi \u5E76\u6253\u5F00\u5E94\u7528\uFF0C\u5373\u53EF\u5728\u5217\u8868\u4E2D\u770B\u5230\u8FD9\u53F0\u7535\u8111\u3002\u82E5 Windows \u8BE2\u95EE\u7F51\u7EDC\u8BBF\u95EE\uFF0C\u8BF7\u70B9\u51FB\u201C\u5141\u8BB8\u201D\u3002"],
        phoneStep3: ["Tap \u201CPair\u201D and accept on the island. In the phone app, grant notification access and enable the \u201CMedia control receiver\u201D and \u201CTelephony\u201D plugins.", "\u0627\u0636\u063A\u0637 \xABPair\xBB \u0648\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0627\u0644\u062C\u0632\u064A\u0631\u0629. \u0641\u064A \u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0647\u0627\u062A\u0641 \u0627\u0645\u0646\u062D \u0625\u0630\u0646 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0648\u0641\u0639\u0651\u0644 \u0625\u0636\u0627\u0641\u062A\u064A \xABMedia control receiver\xBB \u0648\xABTelephony\xBB.", "\u201CE\u015Fle\u015Ftir\u201De dokunup adada onaylay\u0131n. Telefon uygulamas\u0131nda bildirim eri\u015Fimi verin ve \u201CMedia control receiver\u201D ile \u201CTelephony\u201D eklentilerini a\xE7\u0131n.", "Toca \u201CVincular\u201D y acepta en la isla. En la app, da acceso a notificaciones y activa \u201CMedia control receiver\u201D y \u201CTelephony\u201D.", "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xABPair\xBB \u0438 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043D\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0435. \u0412 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438 \u0434\u0430\u0439\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F\u043C \u0438 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u043F\u043B\u0430\u0433\u0438\u043D\u044B \xABMedia control receiver\xBB \u0438 \xABTelephony\xBB.", "\u70B9\u51FB\u201C\u914D\u5BF9\u201D\u5E76\u5728\u60AC\u6D6E\u5C9B\u4E0A\u63A5\u53D7\u3002\u5728\u624B\u673A\u5E94\u7528\u4E2D\u6388\u4E88\u901A\u77E5\u6743\u9650\uFF0C\u5E76\u542F\u7528\u201CMedia control receiver\u201D\u548C\u201CTelephony\u201D\u63D2\u4EF6\u3002"],
        devices: ["Devices", "\u0627\u0644\u0623\u062C\u0647\u0632\u0629", "Cihazlar", "Dispositivos", "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430", "\u8BBE\u5907"],
        noDevices: ["No phone found yet. Open KDE Connect on your phone.", "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0647\u0627\u062A\u0641 \u0628\u0639\u062F. \u0627\u0641\u062A\u062D KDE Connect \u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643.", "Hen\xFCz telefon bulunamad\u0131. Telefonda KDE Connect\u2019i a\xE7\u0131n.", "A\xFAn no hay tel\xE9fonos. Abre KDE Connect en tu m\xF3vil.", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u043F\u043E\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 KDE Connect \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435.", "\u5C1A\u672A\u53D1\u73B0\u624B\u673A\u3002\u8BF7\u5728\u624B\u673A\u4E0A\u6253\u5F00 KDE Connect\u3002"],
        pair: ["Pair", "\u0627\u0642\u062A\u0631\u0627\u0646", "E\u015Fle\u015Ftir", "Vincular", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C", "\u914D\u5BF9"],
        unpair: ["Unpair", "\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0627\u0642\u062A\u0631\u0627\u0646", "E\u015Fle\u015Fmeyi kald\u0131r", "Desvincular", "\u041E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C", "\u53D6\u6D88\u914D\u5BF9"],
        acceptPair: ["Accept", "\u0642\u0628\u0648\u0644", "Kabul et", "Aceptar", "\u041F\u0440\u0438\u043D\u044F\u0442\u044C", "\u63A5\u53D7"],
        rejectPair: ["Reject", "\u0631\u0641\u0636", "Reddet", "Rechazar", "\u041E\u0442\u043A\u043B\u043E\u043D\u0438\u0442\u044C", "\u62D2\u7EDD"],
        waitingPhone: ["Waiting for the phone to accept\u2026", "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u0647\u0627\u062A\u0641\u2026", "Telefonun onay\u0131 bekleniyor\u2026", "Esperando a que el m\xF3vil acepte\u2026", "\u0416\u0434\u0451\u043C \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435\u2026", "\u7B49\u5F85\u624B\u673A\u786E\u8BA4\u2026"],
        pairedState: ["Paired", "\u0645\u0642\u062A\u0631\u0646", "E\u015Fle\u015Fti", "Vinculado", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E", "\u5DF2\u914D\u5BF9"],
        connectedState: ["Connected", "\u0645\u062A\u0635\u0644", "Ba\u011Fl\u0131", "Conectado", "\u0412 \u0441\u0435\u0442\u0438", "\u5DF2\u8FDE\u63A5"],
        offlineState: ["Offline", "\u063A\u064A\u0631 \u0645\u062A\u0635\u0644", "\xC7evrimd\u0131\u015F\u0131", "Sin conexi\xF3n", "\u041D\u0435 \u0432 \u0441\u0435\u0442\u0438", "\u79BB\u7EBF"],
        notPaired: ["Not paired", "\u063A\u064A\u0631 \u0645\u0642\u062A\u0631\u0646", "E\u015Fle\u015Fmedi", "Sin vincular", "\u041D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E", "\u672A\u914D\u5BF9"],
        addByIp: ["Add by phone IP", "\u0625\u0636\u0627\u0641\u0629 \u0628\u0639\u0646\u0648\u0627\u0646 IP", "Telefon IP\u2019siyle ekle", "A\xF1adir por IP", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E IP", "\u6309\u624B\u673A IP \u6DFB\u52A0"],
        refresh: ["Refresh", "\u062A\u062D\u062F\u064A\u062B", "Yenile", "Actualizar", "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C", "\u5237\u65B0"],
        thisPc: ["This PC", "\u0647\u0630\u0627 \u0627\u0644\u062D\u0627\u0633\u0648\u0628", "Bu bilgisayar", "Este PC", "\u042D\u0442\u043E\u0442 \u041F\u041A", "\u672C\u673A"],
        phoneServiceOff: ["Phone service did not start (is port 1716 in use?)", "\u0644\u0645 \u062A\u0628\u062F\u0623 \u062E\u062F\u0645\u0629 \u0627\u0644\u0647\u0627\u062A\u0641 (\u0647\u0644 \u0627\u0644\u0645\u0646\u0641\u0630 1716 \u0645\u0633\u062A\u062E\u062F\u0645\u061F)", "Telefon hizmeti ba\u015Flamad\u0131 (1716 portu kullan\u0131mda m\u0131?)", "El servicio no arranc\xF3 (\xBFpuerto 1716 ocupado?)", "\u0421\u043B\u0443\u0436\u0431\u0430 \u043D\u0435 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u043B\u0430\u0441\u044C (\u043F\u043E\u0440\u0442 1716 \u0437\u0430\u043D\u044F\u0442?)", "\u624B\u673A\u670D\u52A1\u672A\u80FD\u542F\u52A8\uFF08\u7AEF\u53E3 1716 \u88AB\u5360\u7528\uFF1F\uFF09"],
        // ---------------------------------------------------------------- settings: shortcuts
        addFromApps: ["From installed apps", "\u0645\u0646 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0645\u062B\u0628\u062A\u0629", "Y\xFCkl\xFC uygulamalardan", "De apps instaladas", "\u0418\u0437 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043D\u044B\u0445", "\u4ECE\u5DF2\u5B89\u88C5\u5E94\u7528"],
        browseFile: ["Browse file\u2026", "\u0627\u0633\u062A\u0639\u0631\u0627\u0636 \u0645\u0644\u0641\u2026", "Dosya se\xE7\u2026", "Elegir archivo\u2026", "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B\u2026", "\u6D4F\u89C8\u6587\u4EF6\u2026"],
        addWebsite: ["Add website", "\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u0642\u0639", "Web sitesi ekle", "A\xF1adir web", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0430\u0439\u0442", "\u6DFB\u52A0\u7F51\u7AD9"],
        websiteName: ["Name", "\u0627\u0644\u0627\u0633\u0645", "Ad", "Nombre", "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", "\u540D\u79F0"],
        websiteUrl: ["Address (https://\u2026)", "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 (https://\u2026)", "Adres (https://\u2026)", "Direcci\xF3n (https://\u2026)", "\u0410\u0434\u0440\u0435\u0441 (https://\u2026)", "\u7F51\u5740\uFF08https://\u2026\uFF09"],
        add: ["Add", "\u0625\u0636\u0627\u0641\u0629", "Ekle", "A\xF1adir", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C", "\u6DFB\u52A0"],
        cancel: ["Cancel", "\u0625\u0644\u063A\u0627\u0621", "\u0130ptal", "Cancelar", "\u041E\u0442\u043C\u0435\u043D\u0430", "\u53D6\u6D88"],
        searchApps: ["Search apps\u2026", "\u0627\u0628\u062D\u062B \u0639\u0646 \u062A\u0637\u0628\u064A\u0642\u2026", "Uygulama ara\u2026", "Buscar apps\u2026", "\u041F\u043E\u0438\u0441\u043A \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0439\u2026", "\u641C\u7D22\u5E94\u7528\u2026"],
        loading: ["Loading\u2026", "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644\u2026", "Y\xFCkleniyor\u2026", "Cargando\u2026", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026", "\u6B63\u5728\u52A0\u8F7D\u2026"],
        remove: ["Remove", "\u0625\u0632\u0627\u0644\u0629", "Kald\u0131r", "Quitar", "\u0423\u0434\u0430\u043B\u0438\u0442\u044C", "\u79FB\u9664"],
        // ---------------------------------------------------------------- settings: weather
        city: ["City", "\u0627\u0644\u0645\u062F\u064A\u0646\u0629", "\u015Eehir", "Ciudad", "\u0413\u043E\u0440\u043E\u0434", "\u57CE\u5E02"],
        searchCity: ["Type a city\u2026", "\u0627\u0643\u062A\u0628 \u0627\u0633\u0645 \u0645\u062F\u064A\u0646\u0629\u2026", "Bir \u015Fehir yaz\u0131n\u2026", "Escribe una ciudad\u2026", "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0433\u043E\u0440\u043E\u0434\u2026", "\u8F93\u5165\u57CE\u5E02\u540D\u2026"],
        noResults: ["No results", "\u0644\u0627 \u0646\u062A\u0627\u0626\u062C", "Sonu\xE7 yok", "Sin resultados", "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E", "\u65E0\u7ED3\u679C"],
        unit: ["Temperature unit", "\u0648\u062D\u062F\u0629 \u0627\u0644\u062D\u0631\u0627\u0631\u0629", "S\u0131cakl\u0131k birimi", "Unidad", "\u0415\u0434\u0438\u043D\u0438\u0446\u044B", "\u6E29\u5EA6\u5355\u4F4D"],
        celsius: ["Celsius", "\u0645\u0626\u0648\u064A\u0629", "Santigrat", "Celsius", "\u0426\u0435\u043B\u044C\u0441\u0438\u0439", "\u6444\u6C0F\u5EA6"],
        fahrenheit: ["Fahrenheit", "\u0641\u0647\u0631\u0646\u0647\u0627\u064A\u062A", "Fahrenhayt", "Fahrenheit", "\u0424\u0430\u0440\u0435\u043D\u0433\u0435\u0439\u0442", "\u534E\u6C0F\u5EA6"],
        weatherSource: ["Data from Open-Meteo (free, no account needed)", "\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0646 Open-Meteo (\u0645\u062C\u0627\u0646\u064A\u0629)", "Veriler Open-Meteo\u2019dan (\xFCcretsiz)", "Datos de Open-Meteo (gratis)", "\u0414\u0430\u043D\u043D\u044B\u0435 Open-Meteo (\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E)", "\u6570\u636E\u6765\u81EA Open-Meteo\uFF08\u514D\u8D39\uFF09"],
        selectedCity: ["Selected city", "\u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0645\u062E\u062A\u0627\u0631\u0629", "Se\xE7ili \u015Fehir", "Ciudad elegida", "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u0433\u043E\u0440\u043E\u0434", "\u5DF2\u9009\u57CE\u5E02"],
        change: ["Change", "\u062A\u063A\u064A\u064A\u0631", "De\u011Fi\u015Ftir", "Cambiar", "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C", "\u66F4\u6539"],
        // ---------------------------------------------------------------- settings: behavior
        movable: ["Movable island", "\u062C\u0632\u064A\u0631\u0629 \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062A\u062D\u0631\u064A\u0643", "Ta\u015F\u0131nabilir ada", "Isla movible", "\u041F\u0435\u0440\u0435\u043C\u0435\u0449\u0430\u0435\u043C\u044B\u0439 \u043E\u0441\u0442\u0440\u043E\u0432", "\u53EF\u62D6\u52A8\u60AC\u6D6E\u5C9B"],
        movableHint: ["Drag the island with the mouse; it snaps to the center", "\u0627\u0633\u062D\u0628 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0628\u0627\u0644\u0645\u0627\u0648\u0633\u061B \u062A\u0644\u062A\u0635\u0642 \u0628\u0627\u0644\u0645\u0646\u062A\u0635\u0641", "Aday\u0131 fareyle s\xFCr\xFCkleyin; ortaya yap\u0131\u015F\u0131r", "Arrastra la isla; se ajusta al centro", "\u041F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u0439\u0442\u0435 \u043C\u044B\u0448\u044C\u044E; \u0446\u0435\u043D\u0442\u0440 \u043F\u0440\u0438\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442", "\u7528\u9F20\u6807\u62D6\u52A8\uFF1B\u9760\u8FD1\u4E2D\u95F4\u4F1A\u81EA\u52A8\u5438\u9644"],
        resetPosition: ["Reset to center", "\u0625\u0639\u0627\u062F\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0646\u062A\u0635\u0641", "Ortaya s\u0131f\u0131rla", "Volver al centro", "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0432 \u0446\u0435\u043D\u0442\u0440", "\u91CD\u7F6E\u5230\u4E2D\u95F4"],
        minimized: ["Minimized mode", "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u0635\u063A\u0651\u0631", "K\xFC\xE7\xFClt\xFClm\xFC\u015F mod", "Modo minimizado", "\u0421\u0432\u0451\u0440\u043D\u0443\u0442\u044B\u0439 \u0440\u0435\u0436\u0438\u043C", "\u6700\u5C0F\u5316\u6A21\u5F0F"],
        minimizedHint: ["The island shrinks to a thin handle and opens only for events", "\u062A\u062A\u0642\u0644\u0635 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0625\u0644\u0649 \u0634\u0631\u064A\u0637 \u0631\u0641\u064A\u0639 \u0648\u0644\u0627 \u062A\u064F\u0641\u062A\u062D \u0625\u0644\u0627 \u0644\u0644\u0623\u062D\u062F\u0627\u062B", "Ada ince bir tutama\u011Fa d\xF6n\xFC\u015F\xFCr, yaln\u0131zca olaylarda a\xE7\u0131l\u0131r", "La isla se reduce a una barra y solo se abre con eventos", "\u041E\u0441\u0442\u0440\u043E\u0432 \u0441\u0436\u0438\u043C\u0430\u0435\u0442\u0441\u044F \u0432 \u043F\u043E\u043B\u043E\u0441\u043A\u0443 \u0438 \u0440\u0430\u0441\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u0438 \u0441\u043E\u0431\u044B\u0442\u0438\u044F\u0445", "\u60AC\u6D6E\u5C9B\u7F29\u6210\u7EC6\u6761\uFF0C\u4EC5\u5728\u6709\u4E8B\u4EF6\u65F6\u5C55\u5F00"],
        hidden: ["Hide the island completely", "\u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u062A\u0645\u0627\u0645\u064B\u0627", "Aday\u0131 tamamen gizle", "Ocultar la isla por completo", "\u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0441\u043A\u0440\u044B\u0442\u044C \u043E\u0441\u0442\u0440\u043E\u0432", "\u5B8C\u5168\u9690\u85CF\u60AC\u6D6E\u5C9B"],
        hiddenHint: ["Show it again from the tray icon", "\u0623\u0638\u0647\u0631\u0647\u0627 \u0645\u062C\u062F\u062F\u064B\u0627 \u0645\u0646 \u0623\u064A\u0642\u0648\u0646\u0629 \u0634\u0631\u064A\u0637 \u0627\u0644\u0645\u0647\u0627\u0645", "Sistem tepsisi simgesinden tekrar g\xF6sterin", "Mu\xE9strala de nuevo desde el icono de la bandeja", "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u043C\u043E\u0436\u043D\u043E \u0447\u0435\u0440\u0435\u0437 \u0437\u043D\u0430\u0447\u043E\u043A \u0432 \u0442\u0440\u0435\u0435", "\u53EF\u4ECE\u6258\u76D8\u56FE\u6807\u91CD\u65B0\u663E\u793A"],
        hideInFullscreen: ["Hide during fullscreen games & video", "\u0627\u0644\u0625\u062E\u0641\u0627\u0621 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0628\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629", "Tam ekran oyun ve videoda gizle", "Ocultar en juegos y v\xEDdeo a pantalla completa", "\u0421\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0432 \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0445 \u0438\u0433\u0440\u0430\u0445 \u0438 \u0432\u0438\u0434\u0435\u043E", "\u5168\u5C4F\u6E38\u620F\u548C\u89C6\u9891\u65F6\u9690\u85CF"],
        startWithWindows: ["Start with Windows", "\u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0645\u0639 Windows", "Windows ile ba\u015Flat", "Iniciar con Windows", "\u0417\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u0441 Windows", "\u5F00\u673A\u542F\u52A8"],
        shortcut: ["Dashboard shortcut", "\u0627\u062E\u062A\u0635\u0627\u0631 \u0627\u0644\u0644\u0648\u062D\u0629", "Pano k\u0131sayolu", "Atajo del panel", "\u041A\u043B\u0430\u0432\u0438\u0448\u0438 \u043F\u0430\u043D\u0435\u043B\u0438", "\u9762\u677F\u5FEB\u6377\u952E"],
        shortcutHint: ["Click and press keys", "\u0627\u0646\u0642\u0631 \u0648\u0627\u0636\u063A\u0637 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D", "T\u0131klay\u0131n ve tu\u015Flara bas\u0131n", "Haz clic y pulsa las teclas", "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435", "\u70B9\u51FB\u540E\u6309\u4E0B\u7EC4\u5408\u952E"],
        display: ["Display", "\u0627\u0644\u0634\u0627\u0634\u0629", "Ekran", "Pantalla", "\u0414\u0438\u0441\u043F\u043B\u0435\u0439", "\u663E\u793A\u5668"],
        primary: ["Primary display", "\u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", "Birincil ekran", "Pantalla principal", "\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0434\u0438\u0441\u043F\u043B\u0435\u0439", "\u4E3B\u663E\u793A\u5668"],
        sound: ["Timer chime", "\u0646\u063A\u0645\u0629 \u0627\u0644\u0645\u0624\u0642\u0651\u062A", "Zamanlay\u0131c\u0131 sesi", "Sonido del temporizador", "\u0421\u0438\u0433\u043D\u0430\u043B \u0442\u0430\u0439\u043C\u0435\u0440\u0430", "\u8BA1\u65F6\u5668\u63D0\u793A\u97F3"],
        pressKeys: ["Press keys\u2026", "\u0627\u0636\u063A\u0637 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D\u2026", "Tu\u015Flara bas\u0131n\u2026", "Pulsa las teclas\u2026", "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438\u2026", "\u8BF7\u6309\u952E\u2026"],
        reset: ["Reset to defaults", "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A", "Varsay\u0131lana d\xF6n", "Restablecer", "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C", "\u6062\u590D\u9ED8\u8BA4"],
        quit: ["Quit app", "\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062A\u0637\u0628\u064A\u0642", "Uygulamadan \xE7\u0131k", "Salir", "\u0412\u044B\u0439\u0442\u0438", "\u9000\u51FA\u5E94\u7528"],
        // ---------------------------------------------------------------- settings: try / status / about
        tryText: ["Preview every island state without a phone or real music.", "\u0639\u0627\u064A\u0646 \u0643\u0644 \u062D\u0627\u0644\u0627\u062A \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u062F\u0648\u0646 \u0647\u0627\u062A\u0641 \u0623\u0648 \u0645\u0648\u0633\u064A\u0642\u0649 \u062D\u0642\u064A\u0642\u064A\u0629.", "Telefon veya ger\xE7ek m\xFCzik olmadan t\xFCm durumlar\u0131 g\xF6r\xFCn.", "Mira cada estado sin m\xF3vil ni m\xFAsica real.", "\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435 \u0432\u0441\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u0431\u0435\u0437 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u0438 \u043C\u0443\u0437\u044B\u043A\u0438.", "\u65E0\u9700\u624B\u673A\u6216\u771F\u5B9E\u97F3\u4E50\u5373\u53EF\u9884\u89C8\u6240\u6709\u72B6\u6001\u3002"],
        t_video: ["Video player (VLC)", "\u0645\u0634\u063A\u0651\u0644 \u0641\u064A\u062F\u064A\u0648 (VLC)", "Video oynat\u0131c\u0131 (VLC)", "Reproductor de v\xEDdeo (VLC)", "\u0412\u0438\u0434\u0435\u043E\u043F\u043B\u0435\u0435\u0440 (VLC)", "\u89C6\u9891\u64AD\u653E\u5668 (VLC)"],
        t_blink: ["Blinkelo wink", "\u063A\u0645\u0632\u0629 Blinkelo", "Blinkelo g\xF6z k\u0131rpmas\u0131", "Gui\xF1o de Blinkelo", "\u041F\u043E\u0434\u043C\u0438\u0433\u0438\u0432\u0430\u043D\u0438\u0435 Blinkelo", "Blinkelo \u7728\u773C"],
        t_music: ["Music", "\u0645\u0648\u0633\u064A\u0642\u0649", "M\xFCzik", "M\xFAsica", "\u041C\u0443\u0437\u044B\u043A\u0430", "\u97F3\u4E50"],
        t_message: ["Phone message", "\u0631\u0633\u0627\u0644\u0629 \u0647\u0627\u062A\u0641", "Telefon mesaj\u0131", "Mensaje", "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435", "\u624B\u673A\u6D88\u606F"],
        t_call: ["Incoming call", "\u0645\u0643\u0627\u0644\u0645\u0629 \u0648\u0627\u0631\u062F\u0629", "Gelen arama", "Llamada", "\u0412\u044B\u0437\u043E\u0432", "\u6765\u7535"],
        t_timer: ["12-second timer", "\u0645\u0624\u0642\u0651\u062A 12 \u062B\u0627\u0646\u064A\u0629", "12 sn zamanlay\u0131c\u0131", "Temporizador de 12 s", "\u0422\u0430\u0439\u043C\u0435\u0440 12 \u0441", "12 \u79D2\u8BA1\u65F6\u5668"],
        t_stopwatch: ["Stopwatch", "\u0633\u0627\u0639\u0629 \u0625\u064A\u0642\u0627\u0641", "Kronometre", "Cron\xF3metro", "\u0421\u0435\u043A\u0443\u043D\u0434\u043E\u043C\u0435\u0440", "\u79D2\u8868"],
        t_charging: ["Charger", "\u0627\u0644\u0634\u0627\u062D\u0646", "\u015Earj aleti", "Cargador", "\u0417\u0430\u0440\u044F\u0434\u043A\u0430", "\u5145\u7535\u5668"],
        t_volume: ["Volume", "\u0627\u0644\u0635\u0648\u062A", "Ses", "Volumen", "\u0413\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u044C", "\u97F3\u91CF"],
        t_caps: ["Caps Lock", "Caps Lock", "Caps Lock", "Bloq May\xFAs", "Caps Lock", "\u5927\u5199\u9501\u5B9A"],
        t_copied: ["Copy", "\u0646\u0633\u062E", "Kopya", "Copia", "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435", "\u590D\u5236"],
        t_privacy: ["Microphone", "\u0627\u0644\u0645\u064A\u0643\u0631\u0648\u0641\u0648\u0646", "Mikrofon", "Micr\xF3fono", "\u041C\u0438\u043A\u0440\u043E\u0444\u043E\u043D", "\u9EA6\u514B\u98CE"],
        t_dashboard: ["Dashboard", "\u0627\u0644\u0644\u0648\u062D\u0629", "Pano", "Panel", "\u041F\u0430\u043D\u0435\u043B\u044C", "\u9762\u677F"],
        t_weather: ["Weather", "\u0627\u0644\u0637\u0642\u0633", "Hava", "Tiempo", "\u041F\u043E\u0433\u043E\u0434\u0430", "\u5929\u6C14"],
        t_pair: ["Pair request", "\u0637\u0644\u0628 \u0627\u0642\u062A\u0631\u0627\u0646", "E\u015Fle\u015Fme iste\u011Fi", "Solicitud de v\xEDnculo", "\u0417\u0430\u043F\u0440\u043E\u0441 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F", "\u914D\u5BF9\u8BF7\u6C42"],
        helper: ["Windows helper", "\u0645\u0633\u0627\u0639\u062F Windows", "Windows yard\u0131mc\u0131s\u0131", "Ayudante de Windows", "\u041F\u043E\u043C\u043E\u0449\u043D\u0438\u043A Windows", "Windows \u52A9\u624B"],
        core: ["Core", "\u0627\u0644\u0646\u0648\u0627\u0629", "\xC7ekirdek", "N\xFAcleo", "\u042F\u0434\u0440\u043E", "\u6838\u5FC3"],
        mediaMod: ["Media", "\u0627\u0644\u0648\u0633\u0627\u0626\u0637", "Medya", "Multimedia", "\u041C\u0435\u0434\u0438\u0430", "\u5A92\u4F53"],
        audio: ["Audio", "\u0627\u0644\u0635\u0648\u062A", "Ses", "Audio", "\u0417\u0432\u0443\u043A", "\u97F3\u9891"],
        system: ["System", "\u0627\u0644\u0646\u0638\u0627\u0645", "Sistem", "Sistema", "\u0421\u0438\u0441\u0442\u0435\u043C\u0430", "\u7CFB\u7EDF"],
        notifs: ["Notification database", "\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A", "Bildirim veritaban\u0131", "Base de notificaciones", "\u0411\u0430\u0437\u0430 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439", "\u901A\u77E5\u6570\u636E\u5E93"],
        uia: ["Phone Link call control", "\u0627\u0644\u062A\u062D\u0643\u0645 \u0628\u0645\u0643\u0627\u0644\u0645\u0627\u062A Phone Link", "Phone Link arama kontrol\xFC", "Control de llamadas Phone Link", "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0432\u044B\u0437\u043E\u0432\u0430\u043C\u0438 Phone Link", "Phone Link \u901A\u8BDD\u63A7\u5236"],
        phoneMod: ["Phone (KDE Connect)", "\u0627\u0644\u0647\u0627\u062A\u0641 (KDE Connect)", "Telefon (KDE Connect)", "Tel\xE9fono (KDE Connect)", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D (KDE Connect)", "\u624B\u673A\uFF08KDE Connect\uFF09"],
        weatherMod: ["Weather", "\u0627\u0644\u0637\u0642\u0633", "Hava durumu", "Tiempo", "\u041F\u043E\u0433\u043E\u0434\u0430", "\u5929\u6C14"],
        ok: ["OK", "\u064A\u0639\u0645\u0644", "Tamam", "OK", "\u041E\u041A", "\u6B63\u5E38"],
        fail: ["Error", "\u062E\u0637\u0623", "Hata", "Error", "\u041E\u0448\u0438\u0431\u043A\u0430", "\u9519\u8BEF"],
        waiting: ["Waiting\u2026", "\u0628\u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631\u2026", "Bekleniyor\u2026", "Esperando\u2026", "\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435\u2026", "\u7B49\u5F85\u4E2D\u2026"],
        restartHelper: ["Restart helper", "\u0625\u0639\u0627\u062F\u0629 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u0633\u0627\u0639\u062F", "Yard\u0131mc\u0131y\u0131 yeniden ba\u015Flat", "Reiniciar ayudante", "\u041F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u043F\u043E\u043C\u043E\u0449\u043D\u0438\u043A", "\u91CD\u542F\u52A9\u624B"],
        openLogs: ["Open logs", "\u0641\u062A\u062D \u0627\u0644\u0633\u062C\u0644\u0627\u062A", "G\xFCnl\xFCkleri a\xE7", "Abrir registros", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0436\u0443\u0440\u043D\u0430\u043B\u044B", "\u6253\u5F00\u65E5\u5FD7"],
        statusHint: ["If something does not work, send the logs for troubleshooting.", "\u0625\u0630\u0627 \u0644\u0645 \u064A\u0639\u0645\u0644 \u0634\u064A\u0621 \u0641\u0623\u0631\u0633\u0644 \u0627\u0644\u0633\u062C\u0644\u0627\u062A \u0644\u0644\u062A\u0634\u062E\u064A\u0635.", "Bir \u015Fey \xE7al\u0131\u015Fmazsa g\xFCnl\xFCkleri g\xF6nderin.", "Si algo falla, env\xEDa los registros.", "\u0415\u0441\u043B\u0438 \u0447\u0442\u043E-\u0442\u043E \u043D\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442, \u043F\u0440\u0438\u0448\u043B\u0438\u0442\u0435 \u0436\u0443\u0440\u043D\u0430\u043B\u044B.", "\u5982\u6709\u95EE\u9898\uFF0C\u8BF7\u53D1\u9001\u65E5\u5FD7\u4EE5\u4FBF\u6392\u67E5\u3002"],
        aboutText: ["Blinkelo is a lively island for Windows that shows you every new thing with a blink: spring animations, ambient glow, phone connection and plenty of features macOS doesn\u2019t have.", "Blinkelo \u062C\u0632\u064A\u0631\u0629 \u062D\u064A\u0651\u0629 \u0644\u0646\u0638\u0627\u0645 Windows \u062A\u064F\u0631\u064A\u0643 \u0643\u0644 \u062C\u062F\u064A\u062F \u0628\u0631\u0645\u0634\u0629: \u062D\u0631\u0643\u0627\u062A \u0646\u0627\u0628\u0636\u064A\u0629 \u0648\u062A\u0648\u0647\u0651\u062C \u0648\u0631\u0628\u0637 \u0628\u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0645\u064A\u0632\u0627\u062A \u0643\u062B\u064A\u0631\u0629 \u0644\u0627 \u064A\u0645\u0644\u0643\u0647\u0627 macOS.", "Blinkelo, her yenili\u011Fi bir g\xF6z k\u0131rp\u0131\u015F\u0131yla g\xF6steren, Windows i\xE7in canl\u0131 bir ada: yay animasyonlar\u0131, ortam par\u0131lt\u0131s\u0131, telefon ba\u011Flant\u0131s\u0131 ve macOS\u2019ta bile olmayan \xF6zellikler.", "Blinkelo es una isla viva para Windows que te muestra cada novedad con un parpadeo: animaciones el\xE1sticas, brillo, conexi\xF3n con el m\xF3vil y funciones que ni macOS tiene.", "Blinkelo \u2014 \u0436\u0438\u0432\u043E\u0439 \u043E\u0441\u0442\u0440\u043E\u0432 \u0434\u043B\u044F Windows, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0432\u0441\u0451 \u043D\u043E\u0432\u043E\u0435 \u043C\u043E\u0440\u0433\u0430\u043D\u0438\u0435\u043C: \u043F\u0440\u0443\u0436\u0438\u043D\u043D\u0430\u044F \u0430\u043D\u0438\u043C\u0430\u0446\u0438\u044F, \u0441\u0432\u0435\u0447\u0435\u043D\u0438\u0435, \u0441\u0432\u044F\u0437\u044C \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u043C \u0438 \u0444\u0443\u043D\u043A\u0446\u0438\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0434\u0430\u0436\u0435 \u0432 macOS.", "Blinkelo \u662F\u4E00\u5EA7\u4F1A\u7728\u773C\u7684 Windows \u60AC\u6D6E\u5C9B\uFF1A\u6BCF\u6761\u65B0\u6D88\u606F\u90FD\u4F34\u968F\u4E00\u6B21\u7728\u773C\u51FA\u73B0\u3002\u5F39\u7C27\u52A8\u753B\u3001\u73AF\u5883\u5149\u6655\u3001\u624B\u673A\u8FDE\u63A5\uFF0C\u8FD8\u6709 macOS \u90FD\u6CA1\u6709\u7684\u529F\u80FD\u3002"],
        version: ["Version", "\u0627\u0644\u0625\u0635\u062F\u0627\u0631", "S\xFCr\xFCm", "Versi\xF3n", "\u0412\u0435\u0440\u0441\u0438\u044F", "\u7248\u672C"],
        toggleIsland: ["Show / hide island", "\u0625\u0638\u0647\u0627\u0631/\u0625\u062E\u0641\u0627\u0621 \u0627\u0644\u062C\u0632\u064A\u0631\u0629", "Aday\u0131 g\xF6ster/gizle", "Mostrar/ocultar isla", "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C/\u0441\u043A\u0440\u044B\u0442\u044C \u043E\u0441\u0442\u0440\u043E\u0432", "\u663E\u793A/\u9690\u85CF\u60AC\u6D6E\u5C9B"],
        // ---------------------------------------------------------------- v1.3: widgets, planner
        crypto: ["Crypto", "\u0627\u0644\u0639\u0645\u0644\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629", "Kripto", "Cripto", "\u041A\u0440\u0438\u043F\u0442\u043E\u0432\u0430\u043B\u044E\u0442\u0430", "\u52A0\u5BC6\u8D27\u5E01"],
        news: ["News", "\u0627\u0644\u0623\u062E\u0628\u0627\u0631", "Haberler", "Noticias", "\u041D\u043E\u0432\u043E\u0441\u0442\u0438", "\u65B0\u95FB"],
        clocks: ["World clock", "\u0627\u0644\u0633\u0627\u0639\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629", "D\xFCnya saati", "Reloj mundial", "\u041C\u0438\u0440\u043E\u0432\u043E\u0435 \u0432\u0440\u0435\u043C\u044F", "\u4E16\u754C\u65F6\u949F"],
        widgetError: ["Could not connect", "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0627\u062A\u0635\u0627\u0644", "Ba\u011Flan\u0131lamad\u0131", "No se pudo conectar", "\u041D\u0435\u0442 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F", "\u65E0\u6CD5\u8FDE\u63A5"],
        noNews: ["No headlines yet", "\u0644\u0627 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0639\u062F", "Hen\xFCz ba\u015Fl\u0131k yok", "A\xFAn no hay titulares", "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u043E\u0432", "\u6682\u65E0\u65B0\u95FB"],
        widgetOff: ["Turn on widgets in Settings", "\u0641\u0639\u0651\u0644 \u0627\u0644\u0623\u062F\u0648\u0627\u062A \u0645\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", "Ayarlardan widget a\xE7\u0131n", "Activa los widgets en Ajustes", "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0432\u0438\u0434\u0436\u0435\u0442\u044B \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445", "\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u5F00\u542F\u5C0F\u7EC4\u4EF6"],
        planner: ["Planner", "\u0627\u0644\u0645\u062E\u0637\u0637", "Planlay\u0131c\u0131", "Agenda", "\u041F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0449\u0438\u043A", "\u8BA1\u5212"],
        taskPlaceholder: ["New task\u2026", "\u0645\u0647\u0645\u0629 \u062C\u062F\u064A\u062F\u0629\u2026", "Yeni g\xF6rev\u2026", "Nueva tarea\u2026", "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430\u2026", "\u65B0\u4EFB\u52A1\u2026"],
        noTasks: ["Nothing planned for this day", "\u0644\u0627 \u0645\u0647\u0627\u0645 \u0644\u0647\u0630\u0627 \u0627\u0644\u064A\u0648\u0645", "Bu g\xFCn i\xE7in plan yok", "Nada planeado para este d\xEDa", "\u041D\u0430 \u044D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435\u0442", "\u8FD9\u5929\u6CA1\u6709\u5B89\u6392"],
        allDone: ["All done \u{1F389}", "\u062A\u0645 \u0643\u0644 \u0634\u064A\u0621 \u{1F389}", "Hepsi tamam \u{1F389}", "Todo hecho \u{1F389}", "\u0412\u0441\u0451 \u0441\u0434\u0435\u043B\u0430\u043D\u043E \u{1F389}", "\u5168\u90E8\u5B8C\u6210 \u{1F389}"],
        tasksLeft: ["{n} left", "\u0645\u062A\u0628\u0642\u064D\u0651 {n}", "{n} kald\u0131", "Quedan {n}", "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C {n}", "\u5269\u4F59 {n} \u9879"],
        reminder: ["Reminder", "\u062A\u0630\u0643\u064A\u0631", "Hat\u0131rlat\u0131c\u0131", "Recordatorio", "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435", "\u63D0\u9192"],
        clearDone: ["Clear done", "\u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062C\u0632\u0629", "Bitenleri sil", "Borrar hechas", "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u044B\u0435", "\u6E05\u9664\u5DF2\u5B8C\u6210"],
        timeOpt: ["Time (optional)", "\u0627\u0644\u0648\u0642\u062A (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)", "Saat (iste\u011Fe ba\u011Fl\u0131)", "Hora (opcional)", "\u0412\u0440\u0435\u043C\u044F (\u043D\u0435\u043E\u0431\u044F\u0437.)", "\u65F6\u95F4\uFF08\u53EF\u9009\uFF09"],
        goToday: ["Today", "\u0627\u0644\u064A\u0648\u0645", "Bug\xFCn", "Hoy", "\u0421\u0435\u0433\u043E\u0434\u043D\u044F", "\u4ECA\u5929"],
        t_reminder: ["Task reminder", "\u062A\u0630\u0643\u064A\u0631 \u0628\u0645\u0647\u0645\u0629", "G\xF6rev hat\u0131rlat\u0131c\u0131", "Recordatorio", "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435", "\u4EFB\u52A1\u63D0\u9192"],
        retry: ["Try again", "\u0623\u0639\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629", "Tekrar dene", "Reintentar", "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C", "\u91CD\u8BD5"],
        widgetsNav: ["Widgets", "\u0627\u0644\u0623\u062F\u0648\u0627\u062A", "Widget'lar", "Widgets", "\u0412\u0438\u0434\u0436\u0435\u0442\u044B", "\u5C0F\u7EC4\u4EF6"],
        widgetsText: ["Under the system meters on the dashboard one of these widgets is shown; switch between them with the buttons above it.", "\u062A\u0638\u0647\u0631 \u0625\u062D\u062F\u0649 \u0647\u0630\u0647 \u0627\u0644\u0623\u062F\u0648\u0627\u062A \u062A\u062D\u062A \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0641\u064A \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A.", "G\xF6sterge panelinde sistem g\xF6stergelerinin alt\u0131nda bu widget'lardan biri g\xF6r\xFCn\xFCr.", "Bajo los indicadores del sistema se muestra uno de estos widgets.", "\u041F\u043E\u0434 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u043C\u0438 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044F\u043C\u0438 \u043D\u0430 \u043F\u0430\u043D\u0435\u043B\u0438 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0438\u0437 \u044D\u0442\u0438\u0445 \u0432\u0438\u0434\u0436\u0435\u0442\u043E\u0432.", "\u4EEA\u8868\u677F\u7684\u7CFB\u7EDF\u6307\u6807\u4E0B\u65B9\u4F1A\u663E\u793A\u5176\u4E2D\u4E00\u4E2A\u5C0F\u7EC4\u4EF6\u3002"],
        m_widgets: ["Dashboard widgets", "\u0623\u062F\u0648\u0627\u062A \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A", "Pano widget'lar\u0131", "Widgets del panel", "\u0412\u0438\u0434\u0436\u0435\u0442\u044B \u043F\u0430\u043D\u0435\u043B\u0438", "\u4EEA\u8868\u677F\u5C0F\u7EC4\u4EF6"],
        m_widgets_d: ["Crypto, news and world clock on the home tab", "\u0627\u0644\u0639\u0645\u0644\u0627\u062A \u0648\u0627\u0644\u0623\u062E\u0628\u0627\u0631 \u0648\u0627\u0644\u0633\u0627\u0639\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629", "Kripto, haberler ve d\xFCnya saati", "Cripto, noticias y reloj mundial", "\u041A\u0440\u0438\u043F\u0442\u0430, \u043D\u043E\u0432\u043E\u0441\u0442\u0438 \u0438 \u043C\u0438\u0440\u043E\u0432\u043E\u0435 \u0432\u0440\u0435\u043C\u044F", "\u52A0\u5BC6\u8D27\u5E01\u3001\u65B0\u95FB\u548C\u4E16\u754C\u65F6\u949F"],
        coins: ["Coins", "\u0627\u0644\u0639\u0645\u0644\u0627\u062A", "Coinler", "Monedas", "\u041C\u043E\u043D\u0435\u0442\u044B", "\u5E01\u79CD"],
        feeds: ["News sources", "\u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u0623\u062E\u0628\u0627\u0631", "Haber kaynaklar\u0131", "Fuentes", "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0438", "\u65B0\u95FB\u6765\u6E90"],
        addFeed: ["Add RSS feed", "\u0625\u0636\u0627\u0641\u0629 \u0645\u0648\u062C\u0632 RSS", "RSS ekle", "A\xF1adir RSS", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C RSS", "\u6DFB\u52A0 RSS"],
        feedUrl: ["Feed address (RSS or Atom)", "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0648\u062C\u0632", "Besleme adresi", "Direcci\xF3n del feed", "\u0410\u0434\u0440\u0435\u0441 \u043B\u0435\u043D\u0442\u044B", "\u8BA2\u9605\u5730\u5740"],
        feedBad: ["That address is not a reachable feed", "\u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0644\u064A\u0633 \u0645\u0648\u062C\u0632\u064B\u0627 \u0635\u0627\u0644\u062D\u064B\u0627", "Ge\xE7erli bir besleme de\u011Fil", "No es un feed v\xE1lido", "\u042D\u0442\u043E \u043D\u0435 \u043B\u0435\u043D\u0442\u0430", "\u4E0D\u662F\u6709\u6548\u7684\u8BA2\u9605\u6E90"],
        zones: ["Cities", "\u0627\u0644\u0645\u062F\u0646", "\u015Eehirler", "Ciudades", "\u0413\u043E\u0440\u043E\u0434\u0430", "\u57CE\u5E02"],
        maxReached: ["Up to {n}", "\u062D\u062A\u0649 {n}", "En fazla {n}", "Hasta {n}", "\u0414\u043E {n}", "\u6700\u591A {n} \u4E2A"],
        // ---------------------------------------------------------------- Blinkelo Link (phone app) — island
        clipFromPhone: ["Clipboard from {name}", "\u0627\u0644\u062D\u0627\u0641\u0638\u0629 \u0645\u0646 {name}", "{name} panosu kopyaland\u0131", "Portapapeles de {name}", "\u0411\u0443\u0444\u0435\u0440 \u0441 {name}", "\u6765\u81EA {name} \u7684\u526A\u8D34\u677F"],
        clipImageFromPhone: ["Picture copied from {name}", "\u0646\u064F\u0633\u062E\u062A \u0635\u0648\u0631\u0629 \u0645\u0646 {name}", "{name} resmi kopyaland\u0131", "Imagen copiada de {name}", "\u041A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0441 {name}", "\u5DF2\u590D\u5236\u6765\u81EA {name} \u7684\u56FE\u7247"],
        btConnected: ["Connected to {name} over Bluetooth", "\u0645\u062A\u0635\u0644 \u0628\u0640 {name} \u0639\u0628\u0631 \u0627\u0644\u0628\u0644\u0648\u062A\u0648\u062B", "{name} ile Bluetooth ba\u011Fl\u0131", "Conectado a {name} por Bluetooth", "Bluetooth: {name} \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D", "\u5DF2\u901A\u8FC7\u84DD\u7259\u8FDE\u63A5 {name}"],
        pcRestarting: ["{name} is restarting this PC\u2026", "{name} \u064A\u0639\u064A\u062F \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631\u2026", "{name} bilgisayar\u0131 yeniden ba\u015Flat\u0131yor\u2026", "{name} reinicia el PC\u2026", "{name} \u043F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u0442 \u041F\u041A\u2026", "{name} \u6B63\u5728\u91CD\u542F\u7535\u8111\u2026"],
        pcShuttingDown: ["{name} is shutting this PC down\u2026", "{name} \u064A\u0637\u0641\u0626 \u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631\u2026", "{name} bilgisayar\u0131 kapat\u0131yor\u2026", "{name} apaga el PC\u2026", "{name} \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0435\u0442 \u041F\u041A\u2026", "{name} \u6B63\u5728\u5173\u95ED\u7535\u8111\u2026"],
        ranCommand: ["Ran \u201C{name}\u201D", "\u062A\u0645 \u062A\u0634\u063A\u064A\u0644 \xAB{name}\xBB", "\u201C{name}\u201D \xE7al\u0131\u015Ft\u0131r\u0131ld\u0131", "Ejecutado \xAB{name}\xBB", "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E: \xAB{name}\xBB", "\u5DF2\u8FD0\u884C\u201C{name}\u201D"],
        timerFromPhone: ["Timer from {name}", "\u0645\u0624\u0642\u062A \u0645\u0646 {name}", "{name} zamanlay\u0131c\u0131s\u0131", "Temporizador de {name}", "\u0422\u0430\u0439\u043C\u0435\u0440 \u0441 {name}", "\u6765\u81EA {name} \u7684\u8BA1\u65F6\u5668"],
        transferFailed: ["Couldn\u2019t transfer {name}", "\u062A\u0639\u0630\u0651\u0631 \u0646\u0642\u0644 {name}", "{name} aktar\u0131lamad\u0131", "No se pudo transferir {name}", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u0434\u0430\u0442\u044C {name}", "\u65E0\u6CD5\u4F20\u8F93 {name}"],
        sentToPhone: ["{name} sent to phone", "\u0623\u064F\u0631\u0633\u0644 {name} \u0625\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641", "{name} telefona g\xF6nderildi", "{name} enviado al tel\xE9fono", "{name} \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D", "{name} \u5DF2\u53D1\u9001\u5230\u624B\u673A"],
        clipSentToPhone: ["Clipboard sent to phone", "\u0623\u064F\u0631\u0633\u0644\u062A \u0627\u0644\u062D\u0627\u0641\u0638\u0629 \u0625\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641", "Pano telefona g\xF6nderildi", "Portapapeles enviado", "\u0411\u0443\u0444\u0435\u0440 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u526A\u8D34\u677F\u5DF2\u53D1\u9001\u5230\u624B\u673A"],
        cameraAsked: ["Take the photo on {name}", "\u0627\u0644\u062A\u0642\u0637 \u0627\u0644\u0635\u0648\u0631\u0629 \u0639\u0644\u0649 {name}", "Foto\u011Fraf\u0131 {name} \xFCzerinde \xE7ekin", "Haz la foto en {name}", "\u0421\u0434\u0435\u043B\u0430\u0439\u0442\u0435 \u0444\u043E\u0442\u043E \u043D\u0430 {name}", "\u8BF7\u5728 {name} \u4E0A\u62CD\u7167"],
        findPcTitle: ["{name} is looking for this PC", "{name} \u064A\u0628\u062D\u062B \u0639\u0646 \u0647\u0630\u0627 \u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631", "{name} bu bilgisayar\u0131 ar\u0131yor", "{name} est\xE1 buscando este PC", "{name} \u0438\u0449\u0435\u0442 \u044D\u0442\u043E\u0442 \u041F\u041A", "{name} \u6B63\u5728\u5BFB\u627E\u8FD9\u53F0\u7535\u8111"],
        findPcSub: ["Click to stop the sound", "\u0627\u0646\u0642\u0631 \u0644\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0635\u0648\u062A", "Sesi durdurmak i\xE7in t\u0131klay\u0131n", "Clic para parar el sonido", "\u041D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0437\u0432\u0443\u043A", "\u70B9\u51FB\u505C\u6B62\u54CD\u94C3"],
        stopSound: ["Stop", "\u0625\u064A\u0642\u0627\u0641", "Durdur", "Parar", "\u0421\u0442\u043E\u043F", "\u505C\u6B62"],
        receivedFile: ["File received", "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0644\u0641", "Dosya al\u0131nd\u0131", "Archivo recibido", "\u0424\u0430\u0439\u043B \u043F\u043E\u043B\u0443\u0447\u0435\u043D", "\u5DF2\u6536\u5230\u6587\u4EF6"],
        receivedPhoto: ["Photo received", "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0635\u0648\u0631\u0629", "Foto\u011Fraf al\u0131nd\u0131", "Foto recibida", "\u0424\u043E\u0442\u043E \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E", "\u5DF2\u6536\u5230\u7167\u7247"],
        receivedLink: ["Link received", "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0631\u0627\u0628\u0637", "Ba\u011Flant\u0131 al\u0131nd\u0131", "Enlace recibido", "\u0421\u0441\u044B\u043B\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0430", "\u5DF2\u6536\u5230\u94FE\u63A5"],
        receivedText: ["Text received and copied", "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0646\u0635 \u0648\u0646\u0633\u062E\u0647", "Metin al\u0131nd\u0131 ve kopyaland\u0131", "Texto recibido y copiado", "\u0422\u0435\u043A\u0441\u0442 \u043F\u043E\u043B\u0443\u0447\u0435\u043D \u0438 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D", "\u5DF2\u6536\u5230\u6587\u672C\u5E76\u590D\u5236"],
        fromName: ["From {name}", "\u0645\u0646 {name}", "{name} cihaz\u0131ndan", "De {name}", "\u0421 {name}", "\u6765\u81EA {name}"],
        linkOpened: ["Opened in your browser", "\u0641\u064F\u062A\u062D \u0641\u064A \u0627\u0644\u0645\u062A\u0635\u0641\u062D", "Taray\u0131c\u0131da a\xE7\u0131ld\u0131", "Abierto en el navegador", "\u041E\u0442\u043A\u0440\u044B\u0442\u043E \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435", "\u5DF2\u5728\u6D4F\u89C8\u5668\u6253\u5F00"],
        showInFolder: ["Show in folder", "\u0625\u0638\u0647\u0627\u0631 \u0641\u064A \u0627\u0644\u0645\u062C\u0644\u062F", "Klas\xF6rde g\xF6ster", "Mostrar en carpeta", "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0432 \u043F\u0430\u043F\u043A\u0435", "\u5728\u6587\u4EF6\u5939\u4E2D\u663E\u793A"],
        sendingTo: ["Sending to phone", "\u062C\u0627\u0631\u064D \u0627\u0644\u0625\u0631\u0633\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefona g\xF6nderiliyor", "Enviando al tel\xE9fono", "\u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u6B63\u5728\u53D1\u9001\u5230\u624B\u673A"],
        receivingFrom: ["Receiving from phone", "\u062C\u0627\u0631\u064D \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0645\u0646 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefondan al\u0131n\u0131yor", "Recibiendo del tel\xE9fono", "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430", "\u6B63\u5728\u4ECE\u624B\u673A\u63A5\u6536"],
        phoneTools: ["Phone", "\u0627\u0644\u0647\u0627\u062A\u0641", "Telefon", "Tel\xE9fono", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D", "\u624B\u673A"],
        sendClipboard: ["Send clipboard", "\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062D\u0627\u0641\u0638\u0629", "Panoyu g\xF6nder", "Enviar portapapeles", "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0431\u0443\u0444\u0435\u0440", "\u53D1\u9001\u526A\u8D34\u677F"],
        takePhoto: ["Phone camera", "\u0643\u0627\u0645\u064A\u0631\u0627 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefon kameras\u0131", "C\xE1mara del m\xF3vil", "\u041A\u0430\u043C\u0435\u0440\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430", "\u624B\u673A\u62CD\u7167"],
        sendFile: ["Send file", "\u0625\u0631\u0633\u0627\u0644 \u0645\u0644\u0641", "Dosya g\xF6nder", "Enviar archivo", "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0444\u0430\u0439\u043B", "\u53D1\u9001\u6587\u4EF6"],
        findPhone: ["Find phone", "\u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefonu bul", "Buscar m\xF3vil", "\u041D\u0430\u0439\u0442\u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u67E5\u627E\u624B\u673A"],
        noPhoneConnected: ["No phone connected \u2014 pair Blinkelo Link or KDE Connect", "\u0644\u0627 \u064A\u0648\u062C\u062F \u0647\u0627\u062A\u0641 \u0645\u062A\u0635\u0644", "Ba\u011Fl\u0131 telefon yok", "Ning\xFAn tel\xE9fono conectado", "\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D", "\u672A\u8FDE\u63A5\u624B\u673A"],
        toPhone: ["Send to phone", "\u0625\u0631\u0633\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefona g\xF6nder", "Enviar al m\xF3vil", "\u041D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D", "\u53D1\u9001\u5230\u624B\u673A"],
        viaBluetooth: ["Bluetooth", "\u0628\u0644\u0648\u062A\u0648\u062B", "Bluetooth", "Bluetooth", "Bluetooth", "\u84DD\u7259"],
        viaWifi: ["Wi-Fi", "\u0648\u0627\u064A \u0641\u0627\u064A", "Wi-Fi", "Wi-Fi", "Wi-Fi", "Wi-Fi"],
        // ---------------------------------------------------------------- Blinkelo Link — settings
        phoneFeatures: ["Phone features", "\u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0647\u0627\u062A\u0641", "Telefon \xF6zellikleri", "Funciones del tel\xE9fono", "\u0424\u0443\u043D\u043A\u0446\u0438\u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430", "\u624B\u673A\u529F\u80FD"],
        btLink: ["Bluetooth connection", "\u0627\u062A\u0635\u0627\u0644 \u0628\u0644\u0648\u062A\u0648\u062B", "Bluetooth ba\u011Flant\u0131s\u0131", "Conexi\xF3n Bluetooth", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u043F\u043E Bluetooth", "\u84DD\u7259\u8FDE\u63A5"],
        btLinkHint: ["Reaches the Blinkelo Link app over Bluetooth when there is no Wi-Fi (pair the phone in Windows Bluetooth settings first)", "\u064A\u062A\u0635\u0644 \u0628\u062A\u0637\u0628\u064A\u0642 Blinkelo Link \u0639\u0628\u0631 \u0627\u0644\u0628\u0644\u0648\u062A\u0648\u062B \u0639\u0646\u062F \u063A\u064A\u0627\u0628 \u0627\u0644\u0648\u0627\u064A \u0641\u0627\u064A (\u0627\u0642\u0631\u0646 \u0627\u0644\u0647\u0627\u062A\u0641 \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0628\u0644\u0648\u062A\u0648\u062B \u0648\u064A\u0646\u062F\u0648\u0632 \u0623\u0648\u0644\u0627\u064B)", "Wi-Fi yokken Blinkelo Link uygulamas\u0131na Bluetooth ile ba\u011Flan\u0131r (\xF6nce telefonu Windows Bluetooth ayarlar\u0131nda e\u015Fle\u015Ftirin)", "Conecta con Blinkelo Link por Bluetooth sin Wi-Fi (empareja antes el m\xF3vil en Windows)", "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F \u043A Blinkelo Link \u043F\u043E Bluetooth \u0431\u0435\u0437 Wi-Fi (\u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043E\u043F\u0440\u044F\u0433\u0438\u0442\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0432 Windows)", "\u65E0 Wi-Fi \u65F6\u901A\u8FC7\u84DD\u7259\u8FDE\u63A5 Blinkelo Link\uFF08\u8BF7\u5148\u5728 Windows \u84DD\u7259\u8BBE\u7F6E\u4E2D\u914D\u5BF9\u624B\u673A\uFF09"],
        remoteInput: ["Remote control from the phone", "\u0627\u0644\u062A\u062D\u0643\u0645 \u0639\u0646 \u0628\u064F\u0639\u062F \u0645\u0646 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefondan uzaktan kontrol", "Control remoto desde el m\xF3vil", "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430", "\u624B\u673A\u8FDC\u7A0B\u63A7\u5236"],
        remoteInputHint: ["The phone\u2019s touchpad, keyboard and presenter can move the mouse and type", "\u0644\u0648\u062D\u0629 \u0627\u0644\u0644\u0645\u0633 \u0648\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0648\u0648\u0636\u0639 \u0627\u0644\u0639\u0631\u0636 \u0641\u064A \u0627\u0644\u0647\u0627\u062A\u0641 \u062A\u062D\u0631\u0643 \u0627\u0644\u0645\u0627\u0648\u0633 \u0648\u062A\u0643\u062A\u0628", "Telefonun dokunmatik y\xFCzeyi, klavyesi ve sunum modu fareyi oynat\u0131p yazabilir", "El touchpad, teclado y presentador del m\xF3vil mueven el rat\xF3n y escriben", "\u0422\u0430\u0447\u043F\u0430\u0434, \u043A\u043B\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0430 \u0438 \u0440\u0435\u0436\u0438\u043C \u043F\u0440\u0435\u0437\u0435\u043D\u0442\u0430\u0446\u0438\u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442 \u043C\u044B\u0448\u044C\u044E \u0438 \u0432\u0432\u043E\u0434\u043E\u043C", "\u624B\u673A\u89E6\u63A7\u677F\u3001\u952E\u76D8\u548C\u6F14\u793A\u6A21\u5F0F\u53EF\u4EE5\u79FB\u52A8\u9F20\u6807\u5E76\u8F93\u5165"],
        sharedClipboard: ["Shared clipboard", "\u062D\u0627\u0641\u0638\u0629 \u0645\u0634\u062A\u0631\u0643\u0629", "Ortak pano", "Portapapeles compartido", "\u041E\u0431\u0449\u0438\u0439 \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430", "\u5171\u4EAB\u526A\u8D34\u677F"],
        sharedClipboardHint: ["Text you copy is available on both devices", "\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0646\u0633\u0648\u062E \u0645\u062A\u0627\u062D \u0639\u0644\u0649 \u0627\u0644\u062C\u0647\u0627\u0632\u064A\u0646", "Kopyalad\u0131\u011F\u0131n\u0131z metin iki cihazda da olur", "El texto copiado est\xE1 en ambos dispositivos", "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u043D\u0430 \u043E\u0431\u043E\u0438\u0445 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430\u0445", "\u590D\u5236\u7684\u6587\u672C\u5728\u4E24\u53F0\u8BBE\u5907\u4E0A\u90FD\u53EF\u7528"],
        clipImages: ["Include pictures", "\u0645\u0639 \u0627\u0644\u0635\u0648\u0631", "Resimler dahil", "Incluir im\xE1genes", "\u0412\u043C\u0435\u0441\u0442\u0435 \u0441 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0430\u043C\u0438", "\u5305\u62EC\u56FE\u7247"],
        forwardNotifs: ["Show PC notifications on the phone", "\u0625\u0638\u0647\u0627\u0631 \u0625\u0634\u0639\u0627\u0631\u0627\u062A \u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631 \u0639\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641", "PC bildirimlerini telefonda g\xF6ster", "Ver notificaciones del PC en el m\xF3vil", "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u041F\u041A \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435", "\u5728\u624B\u673A\u4E0A\u663E\u793A\u7535\u8111\u901A\u77E5"],
        openLinks: ["Open links sent from the phone", "\u0641\u062A\u062D \u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0631\u0633\u0644\u0629 \u0645\u0646 \u0627\u0644\u0647\u0627\u062A\u0641", "Telefondan gelen ba\u011Flant\u0131lar\u0131 a\xE7", "Abrir enlaces enviados desde el m\xF3vil", "\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0438 \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430", "\u6253\u5F00\u624B\u673A\u53D1\u6765\u7684\u94FE\u63A5"],
        cameraToClip: ["Copy phone-camera photos to the clipboard", "\u0646\u0633\u062E \u0635\u0648\u0631 \u0643\u0627\u0645\u064A\u0631\u0627 \u0627\u0644\u0647\u0627\u062A\u0641 \u0625\u0644\u0649 \u0627\u0644\u062D\u0627\u0641\u0638\u0629", "Telefon kameras\u0131 foto\u011Fraflar\u0131n\u0131 panoya kopyala", "Copiar fotos de la c\xE1mara al portapapeles", "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0444\u043E\u0442\u043E \u0441 \u043A\u0430\u043C\u0435\u0440\u044B \u0432 \u0431\u0443\u0444\u0435\u0440", "\u5C06\u624B\u673A\u62CD\u6444\u7684\u7167\u7247\u590D\u5236\u5230\u526A\u8D34\u677F"],
        downloadFolder: ["Received files folder", "\u0645\u062C\u0644\u062F \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u0644\u0645\u0629", "Al\u0131nan dosyalar klas\xF6r\xFC", "Carpeta de archivos recibidos", "\u041F\u0430\u043F\u043A\u0430 \u0434\u043B\u044F \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044B\u0445 \u0444\u0430\u0439\u043B\u043E\u0432", "\u63A5\u6536\u6587\u4EF6\u5939"],
        openFolder: ["Open", "\u0641\u062A\u062D", "A\xE7", "Abrir", "\u041E\u0442\u043A\u0440\u044B\u0442\u044C", "\u6253\u5F00"],
        customCommands: ["Custom commands", "\u0623\u0648\u0627\u0645\u0631 \u0645\u062E\u0635\u0635\u0629", "\xD6zel komutlar", "Comandos personalizados", "\u0421\u0432\u043E\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u044B", "\u81EA\u5B9A\u4E49\u547D\u4EE4"],
        customCommandsHint: ["Commands the phone can run on this PC (cmd)", "\u0623\u0648\u0627\u0645\u0631 \u064A\u0645\u0643\u0646 \u0644\u0644\u0647\u0627\u062A\u0641 \u062A\u0634\u063A\u064A\u0644\u0647\u0627 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631", "Telefonun bu PC\u2019de \xE7al\u0131\u015Ft\u0131rabilece\u011Fi komutlar", "Comandos que el m\xF3vil puede ejecutar en este PC", "\u041A\u043E\u043C\u0430\u043D\u0434\u044B, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u043C\u043E\u0436\u0435\u0442 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u043D\u0430 \u041F\u041A", "\u624B\u673A\u53EF\u4EE5\u5728\u6B64\u7535\u8111\u4E0A\u8FD0\u884C\u7684\u547D\u4EE4"],
        cmdName: ["Name", "\u0627\u0644\u0627\u0633\u0645", "Ad", "Nombre", "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", "\u540D\u79F0"],
        cmdCommand: ["Command", "\u0627\u0644\u0623\u0645\u0631", "Komut", "Comando", "\u041A\u043E\u043C\u0430\u043D\u0434\u0430", "\u547D\u4EE4"],
        addCommand: ["Add command", "\u0625\u0636\u0627\u0641\u0629 \u0623\u0645\u0631", "Komut ekle", "A\xF1adir comando", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443", "\u6DFB\u52A0\u547D\u4EE4"],
        noCommands: ["No custom commands yet; lock, sleep, shut down and restart are always available", "\u0644\u0627 \u0623\u0648\u0627\u0645\u0631 \u0628\u0639\u062F\u061B \u0627\u0644\u0642\u0641\u0644 \u0648\u0627\u0644\u0633\u0643\u0648\u0646 \u0648\u0627\u0644\u0625\u064A\u0642\u0627\u0641 \u0645\u062A\u0627\u062D\u0629 \u062F\u0627\u0626\u0645\u064B\u0627", "Hen\xFCz komut yok; kilit, uyku, kapatma her zaman var", "A\xFAn no hay comandos; bloquear, suspender y apagar siempre est\xE1n", "\u0421\u0432\u043E\u0438\u0445 \u043A\u043E\u043C\u0430\u043D\u0434 \u043D\u0435\u0442; \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0430, \u0441\u043E\u043D \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0432\u0441\u0435\u0433\u0434\u0430", "\u6682\u65E0\u81EA\u5B9A\u4E49\u547D\u4EE4\uFF1B\u9501\u5B9A\u3001\u7761\u7720\u3001\u5173\u673A\u59CB\u7EC8\u53EF\u7528"],
        islandApp: ["Blinkelo Link", "Blinkelo Link", "Blinkelo Link", "Blinkelo Link", "Blinkelo Link", "Blinkelo Link"],
        islandAppHint: ["This app\u2019s own Android companion: PC remote, files, shared planner and timers, Bluetooth and more (KDE Connect works too)", "\u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u0627\u0644\u0645\u0631\u0627\u0641\u0642 \u0644\u0623\u0646\u062F\u0631\u0648\u064A\u062F: \u062A\u062D\u0643\u0645 \u0628\u0627\u0644\u0643\u0645\u0628\u064A\u0648\u062A\u0631 \u0648\u0645\u0644\u0641\u0627\u062A \u0648\u0645\u062E\u0637\u0637 \u0648\u0645\u0624\u0642\u062A\u0627\u062A \u0645\u0634\u062A\u0631\u0643\u0629 \u0648\u0628\u0644\u0648\u062A\u0648\u062B (KDE Connect \u064A\u0639\u0645\u0644 \u0623\u064A\u0636\u064B\u0627)", "Android e\u015Flik\xE7isi: PC kumandas\u0131, dosyalar, ortak planlay\u0131c\u0131, Bluetooth (KDE Connect de \xE7al\u0131\u015F\u0131r)", "Su app Android: mando del PC, archivos, agenda compartida, Bluetooth (KDE Connect tambi\xE9n sirve)", "Android-\u043A\u043E\u043C\u043F\u0430\u043D\u044C\u043E\u043D: \u043F\u0443\u043B\u044C\u0442 \u041F\u041A, \u0444\u0430\u0439\u043B\u044B, \u043E\u0431\u0449\u0438\u0439 \u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0449\u0438\u043A, Bluetooth (KDE Connect \u0442\u043E\u0436\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442)", "\u914D\u5957\u7684 Android \u5E94\u7528\uFF1A\u8FDC\u7A0B\u63A7\u5236\u7535\u8111\u3001\u6587\u4EF6\u3001\u5171\u4EAB\u65E5\u7A0B\u4E0E\u8BA1\u65F6\u5668\u3001\u84DD\u7259\u7B49\uFF08KDE Connect \u4E5F\u53EF\u7528\uFF09"],
        ipHint: ["If the phone can\u2019t find it, use \u201CAdd by IP\u201D in the app and enter:", "\u0625\u0646 \u0644\u0645 \u064A\u062C\u062F\u0647 \u0627\u0644\u0647\u0627\u062A\u0641 \u0627\u0633\u062A\u062E\u062F\u0645 \xAB\u0625\u0636\u0627\u0641\u0629 \u0639\u0628\u0631 IP\xBB \u0648\u0623\u062F\u062E\u0644:", "Telefon bulamazsa uygulamada \u201CIP ile ekle\u201Dyi kullan\u0131n:", "Si el m\xF3vil no lo encuentra, usa \xABA\xF1adir por IP\xBB:", "\u0415\u0441\u043B\u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u043D\u0435 \u043D\u0430\u0445\u043E\u0434\u0438\u0442 \u041F\u041A, \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E IP\xBB \u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435:", "\u5982\u679C\u624B\u673A\u627E\u4E0D\u5230\uFF0C\u8BF7\u5728\u5E94\u7528\u4E2D\u4F7F\u7528\u201C\u901A\u8FC7 IP \u6DFB\u52A0\u201D\u5E76\u8F93\u5165\uFF1A"],
        btSearch: ["Bluetooth search", "\u0628\u062D\u062B \u0628\u0644\u0648\u062A\u0648\u062B", "Bluetooth aramas\u0131", "Buscar por Bluetooth", "\u041F\u043E\u0438\u0441\u043A \u043F\u043E Bluetooth", "\u84DD\u7259\u641C\u7D22"],
        btSearching: ["Searching\u2026", "\u062C\u0627\u0631\u064D \u0627\u0644\u0628\u062D\u062B\u2026", "Aran\u0131yor\u2026", "Buscando\u2026", "\u041F\u043E\u0438\u0441\u043A\u2026", "\u6B63\u5728\u641C\u7D22\u2026"],
        btSearchHint: ["For two minutes, looks for phones paired in Windows Bluetooth settings that run Blinkelo Link", "\u064A\u0628\u062D\u062B \u0644\u0645\u062F\u0629 \u062F\u0642\u064A\u0642\u062A\u064A\u0646 \u0639\u0646 \u0627\u0644\u0647\u0648\u0627\u062A\u0641 \u0627\u0644\u0645\u0642\u062A\u0631\u0646\u0629 \u0641\u064A \u0628\u0644\u0648\u062A\u0648\u062B \u0648\u064A\u0646\u062F\u0648\u0632 \u0648\u0627\u0644\u062A\u064A \u062A\u0634\u063A\u0651\u0644 Blinkelo Link", "\u0130ki dakika boyunca Windows\u2019ta e\u015Fle\u015Ftirilmi\u015F ve Blinkelo Link \xE7al\u0131\u015Ft\u0131ran telefonlar\u0131 arar", "Durante dos minutos busca m\xF3viles emparejados en Windows con Blinkelo Link", "\u0414\u0432\u0435 \u043C\u0438\u043D\u0443\u0442\u044B \u0438\u0449\u0435\u0442 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u044B, \u0441\u043E\u043F\u0440\u044F\u0436\u0451\u043D\u043D\u044B\u0435 \u0432 Windows, \u0441 \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u043D\u044B\u043C Blinkelo Link", "\u5728\u4E24\u5206\u949F\u5185\u67E5\u627E\u5DF2\u5728 Windows \u84DD\u7259\u4E2D\u914D\u5BF9\u5E76\u8FD0\u884C Blinkelo Link \u7684\u624B\u673A"],
        btMod: ["Bluetooth", "\u0628\u0644\u0648\u062A\u0648\u062B", "Bluetooth", "Bluetooth", "Bluetooth", "\u84DD\u7259"],
        // ---------------------------------------------------------------- tray
        trayTry: ["Try it", "\u062C\u0631\u0651\u0628", "Dene", "Probar", "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C", "\u8BD5\u4E00\u8BD5"],
        trayLogs: ["Open logs folder", "\u0645\u062C\u0644\u062F \u0627\u0644\u0633\u062C\u0644\u0627\u062A", "G\xFCnl\xFCk klas\xF6r\xFC", "Carpeta de registros", "\u041F\u0430\u043F\u043A\u0430 \u0436\u0443\u0440\u043D\u0430\u043B\u043E\u0432", "\u65E5\u5FD7\u6587\u4EF6\u5939"],
        // v1.5: frosted glass theme, editable home, deck
        theme: ["Theme", "\u0627\u0644\u0633\u0645\u0629", "Tema", "Tema", "\u0422\u0435\u043C\u0430", "\u4E3B\u9898"],
        themeDark: ["Classic black", "\u0623\u0633\u0648\u062F \u0643\u0644\u0627\u0633\u064A\u0643\u064A", "Klasik siyah", "Negro cl\xE1sico", "\u041A\u043B\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0447\u0451\u0440\u043D\u044B\u0439", "\u7ECF\u5178\u9ED1"],
        themeGlass: ["Frosted glass", "\u0632\u062C\u0627\u062C \u0645\u0635\u0646\u0641\u0631", "Buzlu cam", "Cristal esmerilado", "\u041C\u0430\u0442\u043E\u0432\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E", "\u78E8\u7802\u73BB\u7483"],
        transparency: ["Transparency", "\u0627\u0644\u0634\u0641\u0627\u0641\u064A\u0629", "Saydaml\u0131k", "Transparencia", "\u041F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0441\u0442\u044C", "\u900F\u660E\u5EA6"],
        transparencyHint: ["Higher values let more of what is behind the island and this window show through. Text always stays sharp.", "\u0643\u0644\u0645\u0627 \u0632\u0627\u062F\u062A\u060C \u0638\u0647\u0631 \u0645\u0627 \u062E\u0644\u0641 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0648\u0647\u0630\u0647 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u0623\u0643\u062B\u0631. \u064A\u0628\u0642\u0649 \u0627\u0644\u0646\u0635 \u0648\u0627\u0636\u062D\u0627\u064B \u062F\u0627\u0626\u0645\u0627\u064B.", "Artt\u0131k\xE7a adan\u0131n ve bu pencerenin arkas\u0131 daha \xE7ok g\xF6r\xFCn\xFCr. Yaz\u0131lar her zaman net kal\u0131r.", "Cuanto m\xE1s alto, m\xE1s se ve lo que hay detr\xE1s de la isla y de esta ventana. El texto siempre queda n\xEDtido.", "\u0427\u0435\u043C \u0432\u044B\u0448\u0435, \u0442\u0435\u043C \u0441\u0438\u043B\u044C\u043D\u0435\u0435 \u043F\u0440\u043E\u0441\u0432\u0435\u0447\u0438\u0432\u0430\u0435\u0442 \u0444\u043E\u043D \u0437\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u043E\u043C \u0438 \u044D\u0442\u0438\u043C \u043E\u043A\u043D\u043E\u043C. \u0422\u0435\u043A\u0441\u0442 \u0432\u0441\u0435\u0433\u0434\u0430 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0447\u0451\u0442\u043A\u0438\u043C.", "\u6570\u503C\u8D8A\u9AD8\uFF0C\u60AC\u6D6E\u5C9B\u548C\u6B64\u7A97\u53E3\u80CC\u540E\u7684\u5185\u5BB9\u900F\u51FA\u8D8A\u591A\uFF0C\u6587\u5B57\u59CB\u7EC8\u4FDD\u6301\u6E05\u6670\u3002"],
        themeHint: ["Frosted glass lets the colours of your wallpaper glow softly through the island.", "\u0627\u0644\u0632\u062C\u0627\u062C \u0627\u0644\u0645\u0635\u0646\u0641\u0631 \u064A\u064F\u0638\u0647\u0631 \u0623\u0644\u0648\u0627\u0646 \u062E\u0644\u0641\u064A\u0629 \u0633\u0637\u062D \u0627\u0644\u0645\u0643\u062A\u0628 \u0628\u0646\u0639\u0648\u0645\u0629 \u0639\u0628\u0631 \u0627\u0644\u062C\u0632\u064A\u0631\u0629.", "Buzlu cam, duvar k\xE2\u011F\u0131d\u0131n\u0131z\u0131n renklerini adan\u0131n i\xE7inden yumu\u015Fak\xE7a yans\u0131t\u0131r.", "El cristal esmerilado deja ver suavemente los colores de tu fondo de pantalla.", "\u041C\u0430\u0442\u043E\u0432\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u043C\u044F\u0433\u043A\u043E \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u0446\u0432\u0435\u0442\u0430 \u043E\u0431\u043E\u0435\u0432 \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u0441\u0442\u043E\u043B\u0430.", "\u78E8\u7802\u73BB\u7483\u4F1A\u8BA9\u58C1\u7EB8\u7684\u8272\u5F69\u67D4\u548C\u5730\u900F\u8FC7\u60AC\u6D6E\u5C9B\u3002"],
        editLayout: ["Edit layout", "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u062A\u062E\u0637\u064A\u0637", "D\xFCzeni d\xFCzenle", "Editar dise\xF1o", "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0443", "\u7F16\u8F91\u5E03\u5C40"],
        resetLayout: ["Default layout", "\u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A", "Varsay\u0131lan d\xFCzen", "Dise\xF1o predeterminado", "\u0420\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0430 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E", "\u9ED8\u8BA4\u5E03\u5C40"],
        done: ["Done", "\u062A\u0645", "Bitti", "Listo", "\u0413\u043E\u0442\u043E\u0432\u043E", "\u5B8C\u6210"],
        addWidget: ["Add", "\u0625\u0636\u0627\u0641\u0629", "Ekle", "A\xF1adir", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C", "\u6DFB\u52A0"],
        editHint: ["Drag tiles to move, pull a corner to resize, \xD7 to remove", "\u0627\u0633\u062D\u0628 \u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062A \u0644\u0646\u0642\u0644\u0647\u0627\u060C \u0648\u0627\u0633\u062D\u0628 \u0627\u0644\u0632\u0627\u0648\u064A\u0629 \u0644\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u062C\u0645\u060C \u0648\xD7 \u0644\u0644\u062D\u0630\u0641", "Ta\u015F\u0131mak i\xE7in s\xFCr\xFCkleyin, k\xF6\u015Feden boyutland\u0131r\u0131n, \xD7 ile kald\u0131r\u0131n", "Arrastra para mover, tira de la esquina para redimensionar, \xD7 para quitar", "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043F\u043B\u0438\u0442\u043A\u0443, \u043F\u043E\u0442\u044F\u043D\u0438\u0442\u0435 \u0437\u0430 \u0443\u0433\u043E\u043B \u0434\u043B\u044F \u0440\u0430\u0437\u043C\u0435\u0440\u0430, \xD7 \u2014 \u0443\u0434\u0430\u043B\u0438\u0442\u044C", "\u62D6\u52A8\u5361\u7247\u79FB\u52A8\uFF0C\u62C9\u52A8\u89D2\u843D\u8C03\u6574\u5927\u5C0F\uFF0C\xD7 \u5220\u9664"],
        noRoom: ["No room \u2014 shrink or remove a tile first", "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0633\u0627\u062D\u0629 \u2014 \u0635\u063A\u0651\u0631 \u0623\u0648 \u0627\u062D\u0630\u0641 \u0628\u0637\u0627\u0642\u0629 \u0623\u0648\u0644\u0627\u064B", "Yer yok \u2014 \xF6nce bir kart\u0131 k\xFC\xE7\xFClt\xFCn veya kald\u0131r\u0131n", "Sin espacio: reduce o quita una tarjeta primero", "\u041D\u0435\u0442 \u043C\u0435\u0441\u0442\u0430 \u2014 \u0443\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u0435 \u0438\u043B\u0438 \u0443\u0434\u0430\u043B\u0438\u0442\u0435 \u043F\u043B\u0438\u0442\u043A\u0443", "\u7A7A\u95F4\u4E0D\u8DB3\u2014\u2014\u8BF7\u5148\u7F29\u5C0F\u6216\u5220\u9664\u4E00\u4E2A\u5361\u7247"],
        homeEmpty: ["Home is empty", "\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629 \u0641\u0627\u0631\u063A\u0629", "Ana sayfa bo\u015F", "Inicio est\xE1 vac\xEDo", "\u0413\u043B\u0430\u0432\u043D\u0430\u044F \u043F\u0443\u0441\u0442\u0430", "\u4E3B\u9875\u662F\u7A7A\u7684"],
        w_clock: ["Clock", "\u0627\u0644\u0633\u0627\u0639\u0629", "Saat", "Reloj", "\u0427\u0430\u0441\u044B", "\u65F6\u949F"],
        w_quick: ["Quick keys", "\u0645\u0641\u0627\u062A\u064A\u062D \u0633\u0631\u064A\u0639\u0629", "H\u0131zl\u0131 tu\u015Flar", "Teclas r\xE1pidas", "\u0411\u044B\u0441\u0442\u0440\u044B\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438", "\u5FEB\u6377\u952E"],
        w_media: ["Player", "\u0627\u0644\u0645\u0634\u063A\u0651\u0644", "Oynat\u0131c\u0131", "Reproductor", "\u041F\u043B\u0435\u0435\u0440", "\u64AD\u653E\u5668"],
        w_sys: ["System", "\u0627\u0644\u0646\u0638\u0627\u0645", "Sistem", "Sistema", "\u0421\u0438\u0441\u0442\u0435\u043C\u0430", "\u7CFB\u7EDF"],
        w_widgets: ["Widgets", "\u0627\u0644\u0623\u062F\u0648\u0627\u062A", "Widgetlar", "Widgets", "\u0412\u0438\u0434\u0436\u0435\u0442\u044B", "\u5C0F\u7EC4\u4EF6"],
        deckSize: ["Key size on the island", "\u062D\u062C\u0645 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0641\u064A \u0627\u0644\u062C\u0632\u064A\u0631\u0629", "Adadaki tu\u015F boyutu", "Tama\xF1o de teclas en la isla", "\u0420\u0430\u0437\u043C\u0435\u0440 \u043A\u043B\u0430\u0432\u0438\u0448 \u043D\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0435", "\u60AC\u6D6E\u5C9B\u4E0A\u7684\u6309\u952E\u5927\u5C0F"],
        sizeS: ["Small", "\u0635\u063A\u064A\u0631", "K\xFC\xE7\xFCk", "Peque\xF1o", "\u041C\u0435\u043B\u043A\u0438\u0439", "\u5C0F"],
        sizeM: ["Medium", "\u0645\u062A\u0648\u0633\u0637", "Orta", "Mediano", "\u0421\u0440\u0435\u0434\u043D\u0438\u0439", "\u4E2D"],
        sizeL: ["Large", "\u0643\u0628\u064A\u0631", "B\xFCy\xFCk", "Grande", "\u041A\u0440\u0443\u043F\u043D\u044B\u0439", "\u5927"],
        addKey: ["New key", "\u0645\u0641\u062A\u0627\u062D \u062C\u062F\u064A\u062F", "Yeni tu\u015F", "Nueva tecla", "\u041D\u043E\u0432\u0430\u044F \u043A\u043B\u0430\u0432\u0438\u0448\u0430", "\u65B0\u6309\u952E"],
        keyHotkey: ["Keyboard shortcut", "\u0627\u062E\u062A\u0635\u0627\u0631 \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D", "Klavye k\u0131sayolu", "Atajo de teclado", "\u0421\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448", "\u952E\u76D8\u5FEB\u6377\u952E"],
        keyMedia: ["Media & volume", "\u0627\u0644\u0648\u0633\u0627\u0626\u0637 \u0648\u0627\u0644\u0635\u0648\u062A", "Medya ve ses", "Multimedia y volumen", "\u041C\u0435\u0434\u0438\u0430 \u0438 \u0437\u0432\u0443\u043A", "\u5A92\u4F53\u4E0E\u97F3\u91CF"],
        keyAction: ["System action", "\u0625\u062C\u0631\u0627\u0621 \u0627\u0644\u0646\u0638\u0627\u0645", "Sistem eylemi", "Acci\xF3n del sistema", "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u044B", "\u7CFB\u7EDF\u64CD\u4F5C"],
        keyCommand: ["Run command", "\u062A\u0634\u063A\u064A\u0644 \u0623\u0645\u0631", "Komut \xE7al\u0131\u015Ft\u0131r", "Ejecutar comando", "\u0412\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u043A\u043E\u043C\u0430\u043D\u0434\u0443", "\u8FD0\u884C\u547D\u4EE4"],
        keyText: ["Type text", "\u0643\u062A\u0627\u0628\u0629 \u0646\u0635", "Metin yaz", "Escribir texto", "\u0412\u0432\u0435\u0441\u0442\u0438 \u0442\u0435\u043A\u0441\u0442", "\u8F93\u5165\u6587\u672C"],
        keyName: ["Key name", "\u0627\u0633\u0645 \u0627\u0644\u0645\u0641\u062A\u0627\u062D", "Tu\u015F ad\u0131", "Nombre de la tecla", "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438", "\u6309\u952E\u540D\u79F0"],
        keySize: ["Size", "\u0627\u0644\u062D\u062C\u0645", "Boyut", "Tama\xF1o", "\u0420\u0430\u0437\u043C\u0435\u0440", "\u5927\u5C0F"],
        keyColor: ["Colour", "\u0627\u0644\u0644\u0648\u0646", "Renk", "Color", "\u0426\u0432\u0435\u0442", "\u989C\u8272"],
        keyIcon: ["Icon", "\u0627\u0644\u0623\u064A\u0642\u0648\u0646\u0629", "Simge", "Icono", "\u0417\u043D\u0430\u0447\u043E\u043A", "\u56FE\u6807"],
        keyRecord: ["Record shortcut", "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0627\u062E\u062A\u0635\u0627\u0631", "K\u0131sayolu kaydet", "Grabar atajo", "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435", "\u5F55\u5236\u5FEB\u6377\u952E"],
        keyCommandPh: ["e.g. notepad.exe or shutdown /h", "\u0645\u062B\u0644 notepad.exe \u0623\u0648 shutdown /h", "\xF6rn. notepad.exe veya shutdown /h", "p. ej. notepad.exe o shutdown /h", "\u043D\u0430\u043F\u0440. notepad.exe \u0438\u043B\u0438 shutdown /h", "\u4F8B\u5982 notepad.exe \u6216 shutdown /h"],
        keyTextPh: ["Text typed when the key is pressed", "\u0627\u0644\u0646\u0635 \u0627\u0644\u0630\u064A \u064A\u064F\u0643\u062A\u0628 \u0639\u0646\u062F \u0627\u0644\u0636\u063A\u0637 \u0639\u0644\u0649 \u0627\u0644\u0645\u0641\u062A\u0627\u062D", "Tu\u015Fa bas\u0131nca yaz\u0131lacak metin", "Texto que se escribe al pulsar la tecla", "\u0422\u0435\u043A\u0441\u0442, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0432\u0432\u043E\u0434\u0438\u0442\u0441\u044F \u043F\u043E \u043D\u0430\u0436\u0430\u0442\u0438\u044E", "\u6309\u4E0B\u6309\u952E\u65F6\u8F93\u5165\u7684\u6587\u672C"],
        keyEdit: ["Edit", "\u062A\u0639\u062F\u064A\u0644", "D\xFCzenle", "Editar", "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C", "\u7F16\u8F91"],
        keyAuto: ["Auto", "\u062A\u0644\u0642\u0627\u0626\u064A", "Otomatik", "Auto", "\u0410\u0432\u0442\u043E", "\u81EA\u52A8"],
        mediaToggle: ["Play / Pause", "\u062A\u0634\u063A\u064A\u0644 / \u0625\u064A\u0642\u0627\u0641", "Oynat / Duraklat", "Reproducir / Pausa", "\u041F\u0443\u0441\u043A / \u041F\u0430\u0443\u0437\u0430", "\u64AD\u653E / \u6682\u505C"],
        mediaPrev: ["Previous", "\u0627\u0644\u0633\u0627\u0628\u0642", "\xD6nceki", "Anterior", "\u041D\u0430\u0437\u0430\u0434", "\u4E0A\u4E00\u66F2"],
        mediaNext: ["Next", "\u0627\u0644\u062A\u0627\u0644\u064A", "Sonraki", "Siguiente", "\u0412\u043F\u0435\u0440\u0451\u0434", "\u4E0B\u4E00\u66F2"],
        volDown: ["Volume down", "\u062E\u0641\u0636 \u0627\u0644\u0635\u0648\u062A", "Sesi k\u0131s", "Bajar volumen", "\u0422\u0438\u0448\u0435", "\u97F3\u91CF\u51CF"],
        volUp: ["Volume up", "\u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u062A", "Sesi a\xE7", "Subir volumen", "\u0413\u0440\u043E\u043C\u0447\u0435", "\u97F3\u91CF\u52A0"],
        volMute: ["Mute", "\u0643\u062A\u0645", "Sessiz", "Silenciar", "\u0411\u0435\u0437 \u0437\u0432\u0443\u043A\u0430", "\u9759\u97F3"],
        shortcutsNav: ["Deck", "\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D", "Deck", "Deck", "\u0414\u0435\u043A\u0430", "\u6309\u952E\u9762\u677F"],
        shortcutsTitle: ["Deck \u2014 interactive keys", "\u0627\u0644\u0644\u0648\u062D\u0629 \u2014 \u0645\u0641\u0627\u062A\u064A\u062D \u062A\u0641\u0627\u0639\u0644\u064A\u0629", "Deck \u2014 etkile\u015Fimli tu\u015Flar", "Deck: teclas interactivas", "\u0414\u0435\u043A\u0430 \u2014 \u0438\u043D\u0442\u0435\u0440\u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438", "\u6309\u952E\u9762\u677F\u2014\u2014\u4EA4\u4E92\u6309\u952E"],
        shortcutsText: ["Like a stream deck: add apps, files and websites, or build keys for keyboard shortcuts, media, system actions, commands and typed text. Keys show up in the island\u2019s Apps tab and in Blinkelo Link on your phone.", "\u0645\u062B\u0644 \u0644\u0648\u062D\u0629 \u0627\u0644\u0628\u062B: \u0623\u0636\u0641 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0648\u0645\u0644\u0641\u0627\u062A \u0648\u0645\u0648\u0627\u0642\u0639\u060C \u0623\u0648 \u0623\u0646\u0634\u0626 \u0645\u0641\u0627\u062A\u064A\u062D \u0644\u0627\u062E\u062A\u0635\u0627\u0631\u0627\u062A \u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0648\u0627\u0644\u0648\u0633\u0627\u0626\u0637 \u0648\u0625\u062C\u0631\u0627\u0621\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 \u0648\u0627\u0644\u0623\u0648\u0627\u0645\u0631 \u0648\u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0646\u0635\u0648\u0635. \u062A\u0638\u0647\u0631 \u0627\u0644\u0645\u0641\u0627\u062A\u064A\u062D \u0641\u064A \u062A\u0628\u0648\u064A\u0628 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0648\u0641\u064A Blinkelo Link \u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643.", "Bir stream deck gibi: uygulama, dosya ve site ekleyin ya da klavye k\u0131sayolu, medya, sistem eylemi, komut ve metin tu\u015Flar\u0131 olu\u015Fturun. Tu\u015Flar adan\u0131n Uygulamalar sekmesinde ve telefondaki Blinkelo Link\u2019te g\xF6r\xFCn\xFCr.", "Como un stream deck: a\xF1ade apps, archivos y webs, o crea teclas para atajos de teclado, multimedia, acciones del sistema, comandos y texto. Las teclas aparecen en la pesta\xF1a Apps y en Blinkelo Link en tu tel\xE9fono.", "\u041A\u0430\u043A \u0441\u0442\u0440\u0438\u043C-\u0434\u0435\u043A\u0430: \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F, \u0444\u0430\u0439\u043B\u044B \u0438 \u0441\u0430\u0439\u0442\u044B \u0438\u043B\u0438 \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u043A\u043B\u0430\u0432\u0438\u0448\u0438 \u0434\u043B\u044F \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0439, \u043C\u0435\u0434\u0438\u0430, \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u044B, \u043A\u043E\u043C\u0430\u043D\u0434 \u0438 \u0432\u0432\u043E\u0434\u0430 \u0442\u0435\u043A\u0441\u0442\u0430. \u041A\u043B\u0430\u0432\u0438\u0448\u0438 \u0432\u0438\u0434\u043D\u044B \u043D\u0430 \u0432\u043A\u043B\u0430\u0434\u043A\u0435 \xAB\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F\xBB \u0438 \u0432 Blinkelo Link \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435.", "\u50CF Stream Deck \u4E00\u6837\uFF1A\u6DFB\u52A0\u5E94\u7528\u3001\u6587\u4EF6\u548C\u7F51\u7AD9\uFF0C\u6216\u521B\u5EFA\u952E\u76D8\u5FEB\u6377\u952E\u3001\u5A92\u4F53\u3001\u7CFB\u7EDF\u64CD\u4F5C\u3001\u547D\u4EE4\u548C\u6587\u672C\u8F93\u5165\u6309\u952E\u3002\u6309\u952E\u663E\u793A\u5728\u60AC\u6D6E\u5C9B\u7684\u201C\u5E94\u7528\u201D\u6807\u7B7E\u548C\u624B\u673A\u4E0A\u7684 Blinkelo Link \u4E2D\u3002"],
        appsEmpty: ["No keys yet", "\u0644\u0627 \u062A\u0648\u062C\u062F \u0645\u0641\u0627\u062A\u064A\u062D \u0628\u0639\u062F", "Hen\xFCz tu\u015F yok", "A\xFAn no hay teclas", "\u041A\u043B\u0430\u0432\u0438\u0448 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442", "\u8FD8\u6CA1\u6709\u6309\u952E"],
        // ---------------------------------------------------------------- subtitles (1.6)
        subsTitle: ["Subtitles", "\u0627\u0644\u062A\u0631\u062C\u0645\u0629", "Altyaz\u0131", "Subt\xEDtulos", "\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044B", "\u5B57\u5E55"],
        subsEpisode: ["S{s} \xB7 E{e}", "\u0627\u0644\u0645\u0648\u0633\u0645 {s} \xB7 \u0627\u0644\u062D\u0644\u0642\u0629 {e}", "{s}. sezon \xB7 {e}. b\xF6l\xFCm", "T{s} \xB7 E{e}", "\u0421\u0435\u0437\u043E\u043D {s} \xB7 \u0441\u0435\u0440\u0438\u044F {e}", "\u7B2C {s} \u5B63 \xB7 \u7B2C {e} \u96C6"],
        subsReady: ["Subtitle ready", "\u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u062C\u0627\u0647\u0632\u0629", "Altyaz\u0131 haz\u0131r", "Subt\xEDtulo listo", "\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044B \u0433\u043E\u0442\u043E\u0432\u044B", "\u5B57\u5E55\u5DF2\u5C31\u7EEA"],
        subsDragHint: ["Drag it onto your player", "\u0627\u0633\u062D\u0628\u0647\u0627 \u0648\u0623\u0641\u0644\u062A\u0647\u0627 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u063A\u0651\u0644", "Oynat\u0131c\u0131n\u0131n \xFCzerine s\xFCr\xFCkleyin", "Arr\xE1stralo al reproductor", "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0432 \u043F\u043B\u0435\u0435\u0440", "\u62D6\u5230\u64AD\u653E\u5668\u4E0A"],
        subsSearching: ["Looking for subtitles\u2026", "\u062C\u0627\u0631\u064D \u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u062A\u0631\u062C\u0645\u0629\u2026", "Altyaz\u0131 aran\u0131yor\u2026", "Buscando subt\xEDtulos\u2026", "\u0418\u0449\u0435\u043C \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B\u2026", "\u6B63\u5728\u67E5\u627E\u5B57\u5E55\u2026"],
        subsDownloading: ["Downloading the subtitle\u2026", "\u062C\u0627\u0631\u064D \u062A\u0646\u0632\u064A\u0644 \u0627\u0644\u062A\u0631\u062C\u0645\u0629\u2026", "Altyaz\u0131 indiriliyor\u2026", "Descargando el subt\xEDtulo\u2026", "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u043C \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B\u2026", "\u6B63\u5728\u4E0B\u8F7D\u5B57\u5E55\u2026"],
        subsPick: ["Pick one of the subtitles below", "\u0627\u062E\u062A\u0631 \u0625\u062D\u062F\u0649 \u0627\u0644\u062A\u0631\u062C\u0645\u0627\u062A \u0623\u062F\u0646\u0627\u0647", "A\u015Fa\u011F\u0131dan bir altyaz\u0131 se\xE7in", "Elige uno de los subt\xEDtulos", "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B \u043D\u0438\u0436\u0435", "\u8BF7\u4ECE\u4E0B\u65B9\u9009\u62E9\u5B57\u5E55"],
        subsNoKey: ["No subtitle source is turned on", "\u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0635\u062F\u0631 \u062A\u0631\u062C\u0645\u0629 \u0645\u0641\u0639\u0651\u0644", "A\xE7\u0131k altyaz\u0131 kayna\u011F\u0131 yok", "No hay ninguna fuente activada", "\u041D\u0438 \u043E\u0434\u0438\u043D \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0451\u043D", "\u6CA1\u6709\u542F\u7528\u5B57\u5E55\u6765\u6E90"],
        subsOff: ["Subtitle finder is off", "\u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0645\u062A\u0648\u0642\u0641", "Altyaz\u0131 bulucu kapal\u0131", "El buscador de subt\xEDtulos est\xE1 desactivado", "\u041F\u043E\u0438\u0441\u043A \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u043E\u0432 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D", "\u5B57\u5E55\u67E5\u627E\u5DF2\u5173\u95ED"],
        subsErr_key: ["The subtitle source rejected the API key", "\u0631\u0641\u0636 \u0645\u0635\u062F\u0631 \u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0645\u0641\u062A\u0627\u062D API", "Kaynak API anahtar\u0131n\u0131 reddetti", "La fuente rechaz\xF3 la clave API", "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B \u043A\u043B\u044E\u0447 API", "\u5B57\u5E55\u6765\u6E90\u62D2\u7EDD\u4E86 API \u5BC6\u94A5"],
        subsErr_quota: ["Today\u2019s download limit for this source is used up", "\u0646\u0641\u062F\u062A \u062D\u0635\u0629 \u0627\u0644\u062A\u0646\u0632\u064A\u0644 \u0627\u0644\u064A\u0648\u0645\u064A\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0635\u062F\u0631", "Bu kayna\u011F\u0131n g\xFCnl\xFCk indirme s\u0131n\u0131r\u0131 doldu", "Se agot\xF3 el l\xEDmite diario de esta fuente", "\u0414\u043D\u0435\u0432\u043D\u043E\u0439 \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u0433\u0440\u0443\u0437\u043E\u043A \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D", "\u8BE5\u6765\u6E90\u4ECA\u65E5\u4E0B\u8F7D\u6B21\u6570\u5DF2\u7528\u5B8C"],
        subsErr_net: ["Couldn\u2019t reach the subtitle source", "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0645\u0635\u062F\u0631 \u0627\u0644\u062A\u0631\u062C\u0645\u0629", "Altyaz\u0131 kayna\u011F\u0131na ula\u015F\u0131lamad\u0131", "No se pudo conectar con la fuente", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F \u0441 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u043E\u043C", "\u65E0\u6CD5\u8FDE\u63A5\u5B57\u5E55\u6765\u6E90"],
        subsErr_other: ["Couldn\u2019t get the subtitle", "\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u062A\u0631\u062C\u0645\u0629", "Altyaz\u0131 al\u0131namad\u0131", "No se pudo obtener el subt\xEDtulo", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B", "\u65E0\u6CD5\u83B7\u53D6\u5B57\u5E55"],
        subsNone: ["Nothing found \u2014 try another name below", "\u0644\u0645 \u064A\u064F\u0639\u062B\u0631 \u0639\u0644\u0649 \u0634\u064A\u0621 \u2014 \u062C\u0631\u0651\u0628 \u0627\u0633\u0645\u064B\u0627 \u0622\u062E\u0631", "Bulunamad\u0131 \u2014 a\u015Fa\u011F\u0131da ba\u015Fka bir ad deneyin", "Nada encontrado: prueba otro nombre", "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u2014 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0434\u0440\u0443\u0433\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", "\u672A\u627E\u5230\uFF0C\u8BF7\u5728\u4E0B\u65B9\u6362\u4E2A\u540D\u79F0\u8BD5\u8BD5"],
        subsFallback: ["No {lang} subtitles \u2014 got {other}", "\u0644\u0627 \u062A\u0648\u062C\u062F \u062A\u0631\u062C\u0645\u0629 {lang} \u2014 \u062A\u0645 \u062C\u0644\u0628 {other}", "{lang} bulunamad\u0131 \u2014 {other} getirildi", "No hay en {lang}: se trajo {other}", "\u041D\u0430 \u044F\u0437\u044B\u043A\u0435 \xAB{lang}\xBB \u043D\u0435\u0442 \u2014 \u0432\u0437\u044F\u0442\u044B \xAB{other}\xBB", "\u6CA1\u6709{lang}\u5B57\u5E55\uFF0C\u5DF2\u83B7\u53D6{other}"],
        subsExact: ["Exact file", "\u0627\u0644\u0645\u0644\u0641 \u0646\u0641\u0633\u0647", "Ayn\u0131 dosya", "Archivo exacto", "\u0422\u043E\u0447\u043D\u043E \u044D\u0442\u043E\u0442 \u0444\u0430\u0439\u043B", "\u5B8C\u5168\u5339\u914D"],
        subsOthers: ["Other subtitles", "\u062A\u0631\u062C\u0645\u0627\u062A \u0623\u062E\u0631\u0649", "Di\u011Fer altyaz\u0131lar", "Otros subt\xEDtulos", "\u0414\u0440\u0443\u0433\u0438\u0435 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B", "\u5176\u4ED6\u5B57\u5E55"],
        subsSearchPh: ["Movie or show name\u2026", "\u0627\u0633\u0645 \u0627\u0644\u0641\u064A\u0644\u0645 \u0623\u0648 \u0627\u0644\u0645\u0633\u0644\u0633\u0644\u2026", "Film veya dizi ad\u0131\u2026", "Nombre de la pel\xEDcula o serie\u2026", "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0444\u0438\u043B\u044C\u043C\u0430 \u0438\u043B\u0438 \u0441\u0435\u0440\u0438\u0430\u043B\u0430\u2026", "\u7535\u5F71\u6216\u5267\u96C6\u540D\u79F0\u2026"],
        subsSearch: ["Search", "\u0628\u062D\u062B", "Ara", "Buscar", "\u041D\u0430\u0439\u0442\u0438", "\u641C\u7D22"],
        subtitlesNav: ["Subtitles", "\u0627\u0644\u062A\u0631\u062C\u0645\u0629", "Altyaz\u0131lar", "Subt\xEDtulos", "\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044B", "\u5B57\u5E55"],
        subtitlesTitle: ["Automatic subtitles", "\u062A\u0631\u062C\u0645\u0629 \u062A\u0644\u0642\u0627\u0626\u064A\u0629", "Otomatik altyaz\u0131", "Subt\xEDtulos autom\xE1ticos", "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B", "\u81EA\u52A8\u5B57\u5E55"],
        subtitlesText: ["When a movie or episode plays in VLC, PotPlayer, MPC, KMPlayer and other players, the island finds its subtitle in your language. Just drag it from the island onto the player.", "\u0639\u0646\u062F \u062A\u0634\u063A\u064A\u0644 \u0641\u064A\u0644\u0645 \u0623\u0648 \u062D\u0644\u0642\u0629 \u0641\u064A VLC \u0623\u0648 PotPlayer \u0623\u0648 MPC \u0623\u0648 KMPlayer \u0648\u063A\u064A\u0631\u0647\u0627\u060C \u062A\u062C\u062F \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u062A\u0631\u062C\u0645\u062A\u0647\u0627 \u0628\u0644\u063A\u062A\u0643. \u0627\u0633\u062D\u0628\u0647\u0627 \u0645\u0646 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0648\u0623\u0641\u0644\u062A\u0647\u0627 \u0639\u0644\u0649 \u0627\u0644\u0645\u0634\u063A\u0651\u0644.", "VLC, PotPlayer, MPC, KMPlayer ve di\u011Fer oynat\u0131c\u0131larda film veya dizi oynarken ada, altyaz\u0131s\u0131n\u0131 sizin dilinizde bulur. Adadan oynat\u0131c\u0131n\u0131n \xFCzerine s\xFCr\xFCkleyin, yeter.", "Cuando se reproduce una pel\xEDcula o un episodio en VLC, PotPlayer, MPC, KMPlayer u otros, la isla busca su subt\xEDtulo en tu idioma. Solo arr\xE1stralo de la isla al reproductor.", "\u041A\u043E\u0433\u0434\u0430 \u0444\u0438\u043B\u044C\u043C \u0438\u043B\u0438 \u0441\u0435\u0440\u0438\u044F \u0438\u0433\u0440\u0430\u0435\u0442 \u0432 VLC, PotPlayer, MPC, KMPlayer \u0438 \u0434\u0440\u0443\u0433\u0438\u0445 \u043F\u043B\u0435\u0435\u0440\u0430\u0445, \u043E\u0441\u0442\u0440\u043E\u0432 \u043D\u0430\u0445\u043E\u0434\u0438\u0442 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B \u043D\u0430 \u0432\u0430\u0448\u0435\u043C \u044F\u0437\u044B\u043A\u0435. \u041F\u0440\u043E\u0441\u0442\u043E \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0438\u0445 \u0441 \u043E\u0441\u0442\u0440\u043E\u0432\u0430 \u0432 \u043F\u043B\u0435\u0435\u0440.", "\u5F53\u7535\u5F71\u6216\u5267\u96C6\u5728 VLC\u3001PotPlayer\u3001MPC\u3001KMPlayer \u7B49\u64AD\u653E\u5668\u4E2D\u64AD\u653E\u65F6\uFF0C\u60AC\u6D6E\u5C9B\u4F1A\u7528\u4F60\u7684\u8BED\u8A00\u627E\u5230\u5B57\u5E55\u3002\u53EA\u9700\u628A\u5B83\u4ECE\u60AC\u6D6E\u5C9B\u62D6\u5230\u64AD\u653E\u5668\u4E0A\u3002"],
        subsEnable: ["Subtitle finder", "\u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u062A\u0631\u062C\u0645\u0629", "Altyaz\u0131 bulucu", "Buscador de subt\xEDtulos", "\u041F\u043E\u0438\u0441\u043A \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u043E\u0432", "\u5B57\u5E55\u67E5\u627E"],
        subsEnableHint: ["CC button in the island\u2019s player and the subtitle panel", "\u0632\u0631 CC \u0641\u064A \u0645\u0634\u063A\u0651\u0644 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0648\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u0631\u062C\u0645\u0629", "Adan\u0131n oynat\u0131c\u0131s\u0131nda CC d\xFC\u011Fmesi ve altyaz\u0131 paneli", "Bot\xF3n CC en el reproductor de la isla y panel de subt\xEDtulos", "\u041A\u043D\u043E\u043F\u043A\u0430 CC \u0432 \u043F\u043B\u0435\u0435\u0440\u0435 \u043E\u0441\u0442\u0440\u043E\u0432\u0430 \u0438 \u043F\u0430\u043D\u0435\u043B\u044C \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u043E\u0432", "\u60AC\u6D6E\u5C9B\u64AD\u653E\u5668\u4E2D\u7684 CC \u6309\u94AE\u548C\u5B57\u5E55\u9762\u677F"],
        subsAuto: ["Search automatically", "\u0627\u0644\u0628\u062D\u062B \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627", "Otomatik ara", "Buscar autom\xE1ticamente", "\u0418\u0441\u043A\u0430\u0442\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438", "\u81EA\u52A8\u641C\u7D22"],
        subsAutoHint: ["As soon as a video starts", "\u0628\u0645\u062C\u0631\u062F \u0628\u062F\u0621 \u0627\u0644\u0641\u064A\u062F\u064A\u0648", "Video ba\u015Flar ba\u015Flamaz", "En cuanto empieza un v\xEDdeo", "\u041A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430\u0447\u043D\u0451\u0442\u0441\u044F \u0432\u0438\u0434\u0435\u043E", "\u89C6\u9891\u4E00\u5F00\u59CB\u5C31\u641C\u7D22"],
        subsAutoDl: ["Download the best match", "\u062A\u0646\u0632\u064A\u0644 \u0623\u0641\u0636\u0644 \u062A\u0637\u0627\u0628\u0642", "En iyi e\u015Fle\u015Fmeyi indir", "Descargar la mejor coincidencia", "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u0442\u044C \u043B\u0443\u0447\u0448\u0435\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435", "\u81EA\u52A8\u4E0B\u8F7D\u6700\u4F73\u5339\u914D"],
        subsAutoDlHint: ["Matched by release name, group and file", "\u062D\u0633\u0628 \u0627\u0633\u0645 \u0627\u0644\u0625\u0635\u062F\u0627\u0631 \u0648\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629 \u0648\u0627\u0644\u0645\u0644\u0641", "S\xFCr\xFCm ad\u0131, grup ve dosyaya g\xF6re", "Seg\xFAn el nombre de la versi\xF3n, grupo y archivo", "\u041F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E \u0440\u0435\u043B\u0438\u0437\u0430, \u0433\u0440\u0443\u043F\u043F\u0435 \u0438 \u0444\u0430\u0439\u043B\u0443", "\u6309\u53D1\u5E03\u540D\u79F0\u3001\u5C0F\u7EC4\u548C\u6587\u4EF6\u5339\u914D"],
        subsLangs: ["Languages", "\u0627\u0644\u0644\u063A\u0627\u062A", "Diller", "Idiomas", "\u042F\u0437\u044B\u043A\u0438", "\u8BED\u8A00"],
        subsLangsHint: ["Up to 3, in order of preference; if the first isn\u2019t found the next is tried", "\u062D\u062A\u0649 3 \u0644\u063A\u0627\u062A \u062D\u0633\u0628 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629\u061B \u0625\u0646 \u0644\u0645 \u062A\u062A\u0648\u0641\u0631 \u0627\u0644\u0623\u0648\u0644\u0649 \u062A\u064F\u062C\u0631\u064E\u0651\u0628 \u0627\u0644\u062A\u0627\u0644\u064A\u0629", "\xD6ncelik s\u0131ras\u0131yla en fazla 3; ilki yoksa sonraki denenir", "Hasta 3, por orden de preferencia; si no hay del primero se prueba el siguiente", "\u0414\u043E 3 \u043F\u043E \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u0443; \u0435\u0441\u043B\u0438 \u043D\u0435\u0442 \u043F\u0435\u0440\u0432\u043E\u0433\u043E, \u043F\u0440\u043E\u0431\u0443\u0435\u0442\u0441\u044F \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439", "\u6700\u591A 3 \u79CD\uFF0C\u6309\u4F18\u5148\u987A\u5E8F\uFF1B\u627E\u4E0D\u5230\u7B2C\u4E00\u79CD\u65F6\u5C1D\u8BD5\u4E0B\u4E00\u79CD"],
        subsFolder: ["Save subtitles to", "\u062D\u0641\u0638 \u0627\u0644\u062A\u0631\u062C\u0645\u0627\u062A \u0641\u064A", "Altyaz\u0131lar\u0131 kaydet", "Guardar subt\xEDtulos en", "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u044C \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B \u0432", "\u5B57\u5E55\u4FDD\u5B58\u4F4D\u7F6E"],
        subsDefaultFolder: ["Default", "\u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A", "Varsay\u0131lan", "Predeterminada", "\u041F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E", "\u9ED8\u8BA4"],
        subsNextToVideo: ["Also save a copy next to the video", "\u062D\u0641\u0638 \u0646\u0633\u062E\u0629 \u0628\u062C\u0627\u0646\u0628 \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0623\u064A\u0636\u064B\u0627", "Videonun yan\u0131na da kopya kaydet", "Guardar tambi\xE9n una copia junto al v\xEDdeo", "\u041A\u043E\u043F\u0438\u044F \u0440\u044F\u0434\u043E\u043C \u0441 \u0432\u0438\u0434\u0435\u043E", "\u540C\u65F6\u5728\u89C6\u9891\u65C1\u4FDD\u5B58\u4E00\u4EFD"],
        subsNextToVideoHint: ["Most players then load it on their own next time", "\u062A\u062D\u0645\u0651\u0644\u0647\u0627 \u0645\u0639\u0638\u0645 \u0627\u0644\u0645\u0634\u063A\u0651\u0644\u0627\u062A \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0641\u064A \u0627\u0644\u0645\u0631\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629", "\xC7o\u011Fu oynat\u0131c\u0131 bir dahaki sefere kendisi y\xFCkler", "La mayor\xEDa de reproductores lo cargan solos la pr\xF3xima vez", "\u0411\u043E\u043B\u044C\u0448\u0438\u043D\u0441\u0442\u0432\u043E \u043F\u043B\u0435\u0435\u0440\u043E\u0432 \u043F\u043E\u0442\u043E\u043C \u043F\u043E\u0434\u0445\u0432\u0430\u0442\u044F\u0442 \u0435\u0451 \u0441\u0430\u043C\u0438", "\u591A\u6570\u64AD\u653E\u5668\u4E0B\u6B21\u4F1A\u81EA\u52A8\u52A0\u8F7D"],
        subsFixEnc: ["Fix garbled characters", "\u0625\u0635\u0644\u0627\u062D \u0627\u0644\u0623\u062D\u0631\u0641 \u0627\u0644\u0645\u0634\u0648\u0651\u0647\u0629", "Bozuk karakterleri d\xFCzelt", "Corregir caracteres extra\xF1os", "\u0418\u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \xAB\u043A\u0440\u0430\u043A\u043E\u0437\u044F\u0431\u0440\u044B\xBB", "\u4FEE\u590D\u4E71\u7801"],
        subsFixEncHint: ["Converts to UTF-8", "\u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0625\u0644\u0649 UTF-8", "UTF-8\u2019e d\xF6n\xFC\u015Ft\xFCr\xFCr", "Convierte a UTF-8", "\u041F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u0443\u0435\u0442 \u0432 UTF-8", "\u8F6C\u6362\u4E3A UTF-8"],
        subsHi: ["Hearing-impaired subtitles", "\u062A\u0631\u062C\u0645\u0629 \u0636\u0639\u0627\u0641 \u0627\u0644\u0633\u0645\u0639", "\u0130\u015Fitme engelli altyaz\u0131lar\u0131", "Subt\xEDtulos para sordos", "\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044B \u0434\u043B\u044F \u0441\u043B\u0430\u0431\u043E\u0441\u043B\u044B\u0448\u0430\u0449\u0438\u0445", "\u542C\u969C\u5B57\u5E55"],
        subsHiAvoid: ["Avoid", "\u062A\u062C\u0646\u0651\u0628", "Ka\xE7\u0131n", "Evitar", "\u0418\u0437\u0431\u0435\u0433\u0430\u0442\u044C", "\u907F\u514D"],
        subsHiAny: ["Any", "\u0644\u0627 \u064A\u0647\u0645", "Fark etmez", "Da igual", "\u041D\u0435\u0432\u0430\u0436\u043D\u043E", "\u65E0\u6240\u8C13"],
        subsHiPrefer: ["Prefer", "\u062A\u0641\u0636\u064A\u0644", "Tercih et", "Preferir", "\u041F\u0440\u0435\u0434\u043F\u043E\u0447\u0438\u0442\u0430\u0442\u044C", "\u4F18\u5148"],
        subsSources: ["Subtitle sources", "\u0645\u0635\u0627\u062F\u0631 \u0627\u0644\u062A\u0631\u062C\u0645\u0629", "Altyaz\u0131 kaynaklar\u0131", "Fuentes de subt\xEDtulos", "\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0438 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u043E\u0432", "\u5B57\u5E55\u6765\u6E90"],
        subsSourcesHint: ["SubDL and OpenSubtitles need a free API key (a few minutes to sign up). Podnapisi works without one.", "\u064A\u062D\u062A\u0627\u062C SubDL \u0648OpenSubtitles \u0625\u0644\u0649 \u0645\u0641\u062A\u0627\u062D API \u0645\u062C\u0627\u0646\u064A. \u064A\u0639\u0645\u0644 Podnapisi \u0628\u062F\u0648\u0646 \u0645\u0641\u062A\u0627\u062D.", "SubDL ve OpenSubtitles \xFCcretsiz bir API anahtar\u0131 ister. Podnapisi anahtars\u0131z \xE7al\u0131\u015F\u0131r.", "SubDL y OpenSubtitles necesitan una clave API gratuita. Podnapisi funciona sin clave.", "SubDL \u0438 OpenSubtitles \u0442\u0440\u0435\u0431\u0443\u044E\u0442 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 API. Podnapisi \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0431\u0435\u0437 \u043A\u043B\u044E\u0447\u0430.", "SubDL \u548C OpenSubtitles \u9700\u8981\u514D\u8D39\u7684 API \u5BC6\u94A5\u3002Podnapisi \u65E0\u9700\u5BC6\u94A5\u3002"],
        subsSubdlHint: ["Large multilingual archive (the Subscene archive)", "\u0623\u0631\u0634\u064A\u0641 \u0643\u0628\u064A\u0631 \u0645\u062A\u0639\u062F\u062F \u0627\u0644\u0644\u063A\u0627\u062A (\u0623\u0631\u0634\u064A\u0641 Subscene)", "B\xFCy\xFCk \xE7ok dilli ar\u015Fiv (Subscene ar\u015Fivi)", "Gran archivo multiling\xFCe (archivo de Subscene)", "\u0411\u043E\u043B\u044C\u0448\u043E\u0439 \u043C\u043D\u043E\u0433\u043E\u044F\u0437\u044B\u0447\u043D\u044B\u0439 \u0430\u0440\u0445\u0438\u0432 (\u0430\u0440\u0445\u0438\u0432 Subscene)", "\u5927\u578B\u591A\u8BED\u8A00\u5B57\u5E55\u5E93\uFF08Subscene \u5B58\u6863\uFF09"],
        subsOsHint: ["Largest archive; exact match by file hash. 5 downloads a day without signing in", "\u0623\u0643\u0628\u0631 \u0623\u0631\u0634\u064A\u0641\u061B \u0645\u0637\u0627\u0628\u0642\u0629 \u062F\u0642\u064A\u0642\u0629 \u0628\u0628\u0635\u0645\u0629 \u0627\u0644\u0645\u0644\u0641. 5 \u062A\u0646\u0632\u064A\u0644\u0627\u062A \u064A\u0648\u0645\u064A\u064B\u0627 \u062F\u0648\u0646 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644", "En b\xFCy\xFCk ar\u015Fiv; dosya \xF6zetiyle tam e\u015Fle\u015Fme. Giri\u015Fsiz g\xFCnde 5 indirme", "El mayor archivo; coincidencia exacta por hash. 5 descargas al d\xEDa sin iniciar sesi\xF3n", "\u041A\u0440\u0443\u043F\u043D\u0435\u0439\u0448\u0438\u0439 \u0430\u0440\u0445\u0438\u0432; \u0442\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043F\u043E \u0445\u0435\u0448\u0443. \u0411\u0435\u0437 \u0432\u0445\u043E\u0434\u0430 5 \u0437\u0430\u0433\u0440\u0443\u0437\u043E\u043A \u0432 \u0434\u0435\u043D\u044C", "\u6700\u5927\u7684\u5B57\u5E55\u5E93\uFF1B\u6309\u6587\u4EF6\u54C8\u5E0C\u7CBE\u786E\u5339\u914D\u3002\u672A\u767B\u5F55\u6BCF\u5929 5 \u6B21\u4E0B\u8F7D"],
        subsPodHint: ["No key needed; smaller archive", "\u0628\u0644\u0627 \u0645\u0641\u062A\u0627\u062D\u061B \u0623\u0631\u0634\u064A\u0641 \u0623\u0635\u063A\u0631", "Anahtar gerekmez; daha k\xFC\xE7\xFCk ar\u015Fiv", "Sin clave; archivo m\xE1s peque\xF1o", "\u0411\u0435\u0437 \u043A\u043B\u044E\u0447\u0430; \u0430\u0440\u0445\u0438\u0432 \u043C\u0435\u043D\u044C\u0448\u0435", "\u65E0\u9700\u5BC6\u94A5\uFF1B\u5B57\u5E55\u5E93\u8F83\u5C0F"],
        subsApiKey: ["API key", "\u0645\u0641\u062A\u0627\u062D API", "API anahtar\u0131", "Clave API", "\u041A\u043B\u044E\u0447 API", "API \u5BC6\u94A5"],
        subsGetKey: ["Get a key", "\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 \u0645\u0641\u062A\u0627\u062D", "Anahtar al", "Obtener clave", "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043A\u043B\u044E\u0447", "\u83B7\u53D6\u5BC6\u94A5"],
        subsUser: ["Username (optional)", "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)", "Kullan\u0131c\u0131 ad\u0131 (iste\u011Fe ba\u011Fl\u0131)", "Usuario (opcional)", "\u0418\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)", "\u7528\u6237\u540D\uFF08\u53EF\u9009\uFF09"],
        subsPass: ["Password", "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", "Parola", "Contrase\xF1a", "\u041F\u0430\u0440\u043E\u043B\u044C", "\u5BC6\u7801"],
        subsPassSaved: ["Password saved (encrypted)", "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u062D\u0641\u0648\u0638\u0629 (\u0645\u0634\u0641\u0651\u0631\u0629)", "Parola kay\u0131tl\u0131 (\u015Fifreli)", "Contrase\xF1a guardada (cifrada)", "\u041F\u0430\u0440\u043E\u043B\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D (\u0437\u0430\u0448\u0438\u0444\u0440\u043E\u0432\u0430\u043D)", "\u5BC6\u7801\u5DF2\u4FDD\u5B58\uFF08\u5DF2\u52A0\u5BC6\uFF09"],
        subsSaveLogin: ["Save login", "\u062D\u0641\u0638 \u0627\u0644\u062F\u062E\u0648\u0644", "Giri\u015Fi kaydet", "Guardar acceso", "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0432\u0445\u043E\u0434", "\u4FDD\u5B58\u767B\u5F55"],
        subsLoginHint: ["Signing in raises the download limit", "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u064A\u0631\u0641\u0639 \u062D\u062F \u0627\u0644\u062A\u0646\u0632\u064A\u0644", "Giri\u015F yapmak indirme s\u0131n\u0131r\u0131n\u0131 art\u0131r\u0131r", "Iniciar sesi\xF3n aumenta el l\xEDmite de descargas", "\u0412\u0445\u043E\u0434 \u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0432\u0430\u0435\u0442 \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u0433\u0440\u0443\u0437\u043E\u043A", "\u767B\u5F55\u53EF\u63D0\u9AD8\u4E0B\u8F7D\u4E0A\u9650"],
        subsTest: ["Test", "\u0627\u062E\u062A\u0628\u0627\u0631", "Dene", "Probar", "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C", "\u6D4B\u8BD5"],
        subsTestOk: ["Works \xB7 {n} results", "\u064A\u0639\u0645\u0644 \xB7 {n} \u0646\u062A\u064A\u062C\u0629", "\xC7al\u0131\u015F\u0131yor \xB7 {n} sonu\xE7", "Funciona \xB7 {n} resultados", "\u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \xB7 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432: {n}", "\u53EF\u7528 \xB7 {n} \u4E2A\u7ED3\u679C"],
        subsLoginOk: ["signed in", "\u062A\u0645 \u0627\u0644\u062F\u062E\u0648\u0644", "giri\u015F yap\u0131ld\u0131", "sesi\xF3n iniciada", "\u0432\u0445\u043E\u0434 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D", "\u5DF2\u767B\u5F55"],
        subsLoginFail: ["sign-in failed", "\u0641\u0634\u0644 \u0627\u0644\u062F\u062E\u0648\u0644", "giri\u015F ba\u015Far\u0131s\u0131z", "error de inicio de sesi\xF3n", "\u0432\u0445\u043E\u0434 \u043D\u0435 \u0443\u0434\u0430\u043B\u0441\u044F", "\u767B\u5F55\u5931\u8D25"],
        subsHow: ["How it works", "\u0643\u064A\u0641 \u064A\u0639\u0645\u0644", "Nas\u0131l \xE7al\u0131\u015F\u0131r", "C\xF3mo funciona", "\u041A\u0430\u043A \u044D\u0442\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442", "\u4F7F\u7528\u65B9\u6CD5"],
        subsHow1: ["Open the video in your usual player.", "\u0627\u0641\u062A\u062D \u0627\u0644\u0641\u064A\u062F\u064A\u0648 \u0641\u064A \u0645\u0634\u063A\u0651\u0644\u0643 \u0627\u0644\u0645\u0639\u062A\u0627\u062F.", "Videoyu her zamanki oynat\u0131c\u0131n\u0131zda a\xE7\u0131n.", "Abre el v\xEDdeo en tu reproductor habitual.", "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043E \u0432 \u0441\u0432\u043E\u0451\u043C \u043F\u043B\u0435\u0435\u0440\u0435.", "\u7528\u5E38\u7528\u64AD\u653E\u5668\u6253\u5F00\u89C6\u9891\u3002"],
        subsHow2: ["The island finds and downloads the subtitle (the CC bubble beside it turns green).", "\u062A\u062C\u062F \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0627\u0644\u062A\u0631\u062C\u0645\u0629 \u0648\u062A\u0646\u0632\u0651\u0644\u0647\u0627 (\u062A\u062A\u062D\u0648\u0644 \u0641\u0642\u0627\u0639\u0629 CC \u0625\u0644\u0649 \u0627\u0644\u0623\u062E\u0636\u0631).", "Ada altyaz\u0131y\u0131 bulup indirir (yan\u0131ndaki CC balonu ye\u015File d\xF6ner).", "La isla encuentra y descarga el subt\xEDtulo (la burbuja CC se pone verde).", "\u041E\u0441\u0442\u0440\u043E\u0432 \u043D\u0430\u0445\u043E\u0434\u0438\u0442 \u0438 \u0441\u043A\u0430\u0447\u0438\u0432\u0430\u0435\u0442 \u0441\u0443\u0431\u0442\u0438\u0442\u0440\u044B (\u0437\u043D\u0430\u0447\u043E\u043A CC \u0440\u044F\u0434\u043E\u043C \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0437\u0435\u043B\u0451\u043D\u044B\u043C).", "\u60AC\u6D6E\u5C9B\u627E\u5230\u5E76\u4E0B\u8F7D\u5B57\u5E55\uFF08\u65C1\u8FB9\u7684 CC \u6C14\u6CE1\u53D8\u7EFF\uFF09\u3002"],
        subsHow3: ["Drag it onto the player\u2019s picture. Want another version? Click CC.", "\u0627\u0633\u062D\u0628\u0647\u0627 \u0648\u0623\u0641\u0644\u062A\u0647\u0627 \u0639\u0644\u0649 \u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0634\u063A\u0651\u0644. \u062A\u0631\u064A\u062F \u0646\u0633\u062E\u0629 \u0623\u062E\u0631\u0649\u061F \u0627\u0646\u0642\u0631 CC.", "Oynat\u0131c\u0131n\u0131n g\xF6r\xFCnt\xFCs\xFCn\xFCn \xFCzerine s\xFCr\xFCkleyin. Ba\u015Fka s\xFCr\xFCm m\xFC? CC\u2019ye t\u0131klay\u0131n.", "Arr\xE1stralo sobre la imagen del reproductor. \xBFOtra versi\xF3n? Pulsa CC.", "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043D\u0430 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u043F\u043B\u0435\u0435\u0440\u0430. \u041D\u0443\u0436\u043D\u0430 \u0434\u0440\u0443\u0433\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F? \u041D\u0430\u0436\u043C\u0438\u0442\u0435 CC.", "\u628A\u5B83\u62D6\u5230\u64AD\u653E\u5668\u753B\u9762\u4E0A\u3002\u60F3\u6362\u7248\u672C\uFF1F\u70B9 CC\u3002"],
        t_subs: ["Movie subtitles", "\u062A\u0631\u062C\u0645\u0629 \u0627\u0644\u0641\u064A\u0644\u0645", "Film altyaz\u0131s\u0131", "Subt\xEDtulos", "\u0421\u0443\u0431\u0442\u0438\u0442\u0440\u044B \u043A \u0444\u0438\u043B\u044C\u043C\u0443", "\u7535\u5F71\u5B57\u5E55"],
        // ---------------------------------------------------------------- gaming mode (1.7.0)
        gaming: ["Gaming", "\u0627\u0644\u0623\u0644\u0639\u0627\u0628", "Oyun", "Juegos", "\u0418\u0433\u0440\u044B", "\u6E38\u620F"],
        gmTitle: ["Gaming mode", "\u0648\u0636\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628", "Oyun modu", "Modo juego", "\u0418\u0433\u0440\u043E\u0432\u043E\u0439 \u0440\u0435\u0436\u0438\u043C", "\u6E38\u620F\u6A21\u5F0F"],
        gmOff: ["Off", "\u0645\u062A\u0648\u0642\u0641", "Kapal\u0131", "Desactivado", "\u0412\u044B\u043A\u043B\u044E\u0447\u0435\u043D", "\u5DF2\u5173\u95ED"],
        gmWaiting: ["Waiting for a game\u2026", "\u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u062A\u0634\u063A\u064A\u0644 \u0644\u0639\u0628\u0629\u2026", "Oyun bekleniyor\u2026", "Esperando un juego\u2026", "\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 \u0438\u0433\u0440\u044B\u2026", "\u7B49\u5F85\u6E38\u620F\u542F\u52A8\u2026"],
        gmWatching: ["Games are detected automatically", "\u064A\u062A\u0645 \u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627", "Oyunlar otomatik alg\u0131lan\u0131r", "Los juegos se detectan solos", "\u0418\u0433\u0440\u044B \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u044E\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438", "\u81EA\u52A8\u8BC6\u522B\u6E38\u620F"],
        gmPlaying: ["Playing", "\u0642\u064A\u062F \u0627\u0644\u0644\u0639\u0628", "Oynan\u0131yor", "Jugando", "\u0418\u0434\u0451\u0442 \u0438\u0433\u0440\u0430", "\u6E38\u620F\u4E2D"],
        gmBackground: ["Game in the background", "\u0627\u0644\u0644\u0639\u0628\u0629 \u0641\u064A \u0627\u0644\u062E\u0644\u0641\u064A\u0629", "Oyun arka planda", "Juego en segundo plano", "\u0418\u0433\u0440\u0430 \u0432 \u0444\u043E\u043D\u0435", "\u6E38\u620F\u5728\u540E\u53F0"],
        gmOptimize: ["Optimize for gaming", "\u062A\u062D\u0633\u064A\u0646 \u0644\u0644\u0623\u0644\u0639\u0627\u0628", "Oyun i\xE7in optimize et", "Optimizar para jugar", "\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u043B\u044F \u0438\u0433\u0440\u044B", "\u4E00\u952E\u6E38\u620F\u4F18\u5316"],
        gmOptimizing: ["Optimizing\u2026", "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0633\u064A\u0646\u2026", "Optimize ediliyor\u2026", "Optimizando\u2026", "\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F\u2026", "\u6B63\u5728\u4F18\u5316\u2026"],
        gmOptimized: ["Ready to play", "\u0627\u0644\u0646\u0638\u0627\u0645 \u062C\u0627\u0647\u0632 \u0644\u0644\u0639\u0628", "Oynamaya haz\u0131r", "Listo para jugar", "\u0413\u043E\u0442\u043E\u0432\u043E \u043A \u0438\u0433\u0440\u0435", "\u5DF2\u51C6\u5907\u597D\u6E38\u620F"],
        gmUndo: ["Undo", "\u062A\u0631\u0627\u062C\u0639", "Geri al", "Deshacer", "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C", "\u64A4\u9500"],
        gmFreed: ["{n} freed", "\u062A\u0645 \u062A\u062D\u0631\u064A\u0631 {n}", "{n} bo\u015Falt\u0131ld\u0131", "{n} liberados", "\u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u043E {n}", "\u91CA\u653E {n}"],
        gmClosedN: ["{n} apps closed", "\u0623\u064F\u063A\u0644\u0642 {n} \u062A\u0637\u0628\u064A\u0642", "{n} uygulama kapat\u0131ld\u0131", "{n} apps cerradas", "\u0437\u0430\u043A\u0440\u044B\u0442\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0439: {n}", "\u5173\u95ED {n} \u4E2A\u5E94\u7528"],
        gmStep_power: ["High-performance power plan", "\u062E\u0637\u0629 \u0637\u0627\u0642\u0629 \u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u0623\u062F\u0627\u0621", "Y\xFCksek performans g\xFC\xE7 plan\u0131", "Plan de energ\xEDa de alto rendimiento", "\u0421\u0445\u0435\u043C\u0430 \xAB\u0412\u044B\u0441\u043E\u043A\u0430\u044F \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C\xBB", "\u9AD8\u6027\u80FD\u7535\u6E90\u8BA1\u5212"],
        gmStep_gameMode: ["Windows Game Mode", "\u0648\u0636\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0641\u064A \u0648\u064A\u0646\u062F\u0648\u0632", "Windows Oyun Modu", "Modo de juego de Windows", "\u0418\u0433\u0440\u043E\u0432\u043E\u0439 \u0440\u0435\u0436\u0438\u043C Windows", "Windows \u6E38\u620F\u6A21\u5F0F"],
        gmStep_close: ["Close extra apps", "\u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0625\u0636\u0627\u0641\u064A\u0629", "Fazla uygulamalar\u0131 kapat", "Cerrar apps sobrantes", "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u043B\u0438\u0448\u043D\u0438\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F", "\u5173\u95ED\u591A\u4F59\u5E94\u7528"],
        gmStep_memory: ["Free up RAM", "\u062A\u062D\u0631\u064A\u0631 \u0627\u0644\u0630\u0627\u0643\u0631\u0629", "Belle\u011Fi bo\u015Falt", "Liberar RAM", "\u041E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u0442\u044C \u041E\u0417\u0423", "\u91CA\u653E\u5185\u5B58"],
        gmStep_priority: ["CPU priority for the game", "\u0623\u0648\u0644\u0648\u064A\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062C \u0644\u0644\u0639\u0628\u0629", "Oyuna i\u015Flemci \xF6nceli\u011Fi", "Prioridad de CPU para el juego", "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442 \u0426\u041F \u0434\u043B\u044F \u0438\u0433\u0440\u044B", "\u6E38\u620F CPU \u4F18\u5148\u7EA7"],
        gmStep_dvr: ["Background recording off", "\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0641\u064A \u0627\u0644\u062E\u0644\u0641\u064A\u0629", "Arka plan kayd\u0131 kapal\u0131", "Grabaci\xF3n en segundo plano desactivada", "\u0424\u043E\u043D\u043E\u0432\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0430", "\u5173\u95ED\u540E\u53F0\u5F55\u5236"],
        gmLater: ["when the game starts", "\u0639\u0646\u062F \u0628\u062F\u0621 \u0627\u0644\u0644\u0639\u0628\u0629", "oyun ba\u015Flay\u0131nca", "al iniciar el juego", "\u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435 \u0438\u0433\u0440\u044B", "\u6E38\u620F\u542F\u52A8\u65F6"],
        gmAlready: ["already on", "\u0645\u0641\u0639\u0651\u0644 \u0645\u0633\u0628\u0642\u064B\u0627", "zaten a\xE7\u0131k", "ya activo", "\u0443\u0436\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E", "\u5DF2\u5F00\u542F"],
        gmNone: ["nothing to close", "\u0644\u0627 \u0634\u064A\u0621 \u0644\u0625\u063A\u0644\u0627\u0642\u0647", "kapat\u0131lacak bir \u015Fey yok", "nada que cerrar", "\u043D\u0435\u0447\u0435\u0433\u043E \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0442\u044C", "\u65E0\u9700\u5173\u95ED"],
        gmBar: ["Overlay bar", "\u0634\u0631\u064A\u0637 \u0641\u0648\u0642 \u0627\u0644\u0644\u0639\u0628\u0629", "Oyun \xFCst\xFC \xE7ubuk", "Barra superpuesta", "\u041E\u0432\u0435\u0440\u043B\u0435\u0439-\u043F\u043E\u043B\u043E\u0441\u0430", "\u6E38\u620F\u60AC\u6D6E\u6761"],
        gmIsGame: ["Is \u201C{name}\u201D a game?", "\u0647\u0644 \xAB{name}\xBB \u0644\u0639\u0628\u0629\u061F", "\u201C{name}\u201D bir oyun mu?", "\xBF\u201C{name}\u201D es un juego?", "\xAB{name}\xBB \u2014 \u044D\u0442\u043E \u0438\u0433\u0440\u0430?", "\u201C{name}\u201D\u662F\u6E38\u620F\u5417\uFF1F"],
        gmYes: ["Yes, it\u2019s a game", "\u0646\u0639\u0645\u060C \u0644\u0639\u0628\u0629", "Evet, oyun", "S\xED, es un juego", "\u0414\u0430, \u044D\u0442\u043E \u0438\u0433\u0440\u0430", "\u662F\u6E38\u620F"],
        gmLast: ["Last session", "\u0622\u062E\u0631 \u062C\u0644\u0633\u0629", "Son oturum", "\xDAltima sesi\xF3n", "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0441\u0435\u0430\u043D\u0441", "\u4E0A\u6B21\u6E38\u620F"],
        gmNoSessions: ["No sessions yet", "\u0644\u0627 \u062C\u0644\u0633\u0627\u062A \u0628\u0639\u062F", "Hen\xFCz oturum yok", "A\xFAn no hay sesiones", "\u0421\u0435\u0430\u043D\u0441\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442", "\u6682\u65E0\u8BB0\u5F55"],
        gmAvgFps: ["Avg FPS", "\u0645\u062A\u0648\u0633\u0637 FPS", "Ort. FPS", "FPS medio", "\u0421\u0440\u0435\u0434\u043D\u0438\u0439 FPS", "\u5E73\u5747 FPS"],
        gmLow1: ["1% low", "\u0623\u062F\u0646\u0649 1%", "%1 d\xFC\u015F\xFCk", "1% bajo", "1% low", "1% Low"],
        gmPlayTime: ["Play time", "\u0645\u062F\u0629 \u0627\u0644\u0644\u0639\u0628", "Oyun s\xFCresi", "Tiempo de juego", "\u0412\u0440\u0435\u043C\u044F \u0438\u0433\u0440\u044B", "\u6E38\u620F\u65F6\u957F"],
        gmPeak: ["Peak temp", "\u0623\u0639\u0644\u0649 \u062D\u0631\u0627\u0631\u0629", "En y\xFCksek s\u0131cakl\u0131k", "Temp. m\xE1xima", "\u041F\u0438\u043A\u043E\u0432\u0430\u044F \u0442\u0435\u043C\u043F.", "\u6700\u9AD8\u6E29\u5EA6"],
        gmSessionEnded: ["Session ended", "\u0627\u0646\u062A\u0647\u062A \u0627\u0644\u062C\u0644\u0633\u0629", "Oturum bitti", "Sesi\xF3n terminada", "\u0421\u0435\u0430\u043D\u0441 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D", "\u6E38\u620F\u7ED3\u675F"],
        gmFpsDenied: ["The FPS counter needs permission", "\u0639\u062F\u0651\u0627\u062F FPS \u064A\u062D\u062A\u0627\u062C \u0625\u0630\u0646\u064B\u0627", "FPS sayac\u0131 izin gerektiriyor", "El contador de FPS necesita permiso", "\u0421\u0447\u0451\u0442\u0447\u0438\u043A\u0443 FPS \u043D\u0443\u0436\u043D\u043E \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435", "FPS \u8BA1\u6570\u9700\u8981\u6743\u9650"],
        gmAllow: ["Allow", "\u0633\u0645\u0627\u062D", "\u0130zin ver", "Permitir", "\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u044C", "\u5141\u8BB8"],
        gmSignOut: ["Done; sign out of Windows and back in once", "\u062A\u0645\u061B \u0633\u062C\u0651\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0645\u0646 \u0648\u064A\u0646\u062F\u0648\u0632 \u062B\u0645 \u0627\u062F\u062E\u0644 \u0645\u0631\u0629 \u0648\u0627\u062D\u062F\u0629", "Tamam; Windows oturumunu bir kez kapat\u0131p a\xE7\u0131n", "Listo; cierra sesi\xF3n en Windows y vuelve a entrar", "\u0413\u043E\u0442\u043E\u0432\u043E; \u0432\u044B\u0439\u0434\u0438\u0442\u0435 \u0438\u0437 Windows \u0438 \u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u0441\u043D\u043E\u0432\u0430", "\u5B8C\u6210\uFF1B\u8BF7\u6CE8\u9500 Windows \u540E\u91CD\u65B0\u767B\u5F55\u4E00\u6B21"],
        gmAllowFail: ["Didn\u2019t work (needs administrator approval)", "\u0644\u0645 \u064A\u0646\u062C\u062D (\u064A\u062A\u0637\u0644\u0628 \u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u0645\u0633\u0624\u0648\u0644)", "Olmad\u0131 (y\xF6netici onay\u0131 gerekir)", "No funcion\xF3 (requiere aprobaci\xF3n de administrador)", "\u041D\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u043E\u0441\u044C (\u043D\u0443\u0436\u043D\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430)", "\u672A\u6210\u529F\uFF08\u9700\u8981\u7BA1\u7406\u5458\u6279\u51C6\uFF09"],
        gmEnd: ["End session", "\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062C\u0644\u0633\u0629", "Oturumu bitir", "Terminar sesi\xF3n", "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0441\u0435\u0430\u043D\u0441", "\u7ED3\u675F\u4F1A\u8BDD"],
        gmPing: ["Ping", "Ping", "Ping", "Ping", "\u041F\u0438\u043D\u0433", "Ping"],
        gmFrameTime: ["Frame time", "\u0632\u0645\u0646 \u0627\u0644\u0625\u0637\u0627\u0631", "Kare s\xFCresi", "Tiempo de fotograma", "\u0412\u0440\u0435\u043C\u044F \u043A\u0430\u0434\u0440\u0430", "\u5E27\u65F6\u95F4"],
        gmShortcutHint: ["Show/hide: {k}", "\u0625\u0638\u0647\u0627\u0631/\u0625\u062E\u0641\u0627\u0621: {k}", "G\xF6ster/gizle: {k}", "Mostrar/ocultar: {k}", "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C/\u0441\u043A\u0440\u044B\u0442\u044C: {k}", "\u663E\u793A/\u9690\u85CF\uFF1A{k}"],
        gmTip: ["Press before you start the game", "\u0627\u0636\u063A\u0637 \u0642\u0628\u0644 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0644\u0639\u0628\u0629", "Oyunu ba\u015Flatmadan \xF6nce bas\u0131n", "P\xFAlsalo antes de empezar a jugar", "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043F\u0435\u0440\u0435\u0434 \u0437\u0430\u043F\u0443\u0441\u043A\u043E\u043C \u0438\u0433\u0440\u044B", "\u542F\u52A8\u6E38\u620F\u524D\u70B9\u51FB"],
        t_gaming: ["Game summary", "\u0645\u0644\u062E\u0635 \u0627\u0644\u0644\u0639\u0628\u0629", "Oyun \xF6zeti", "Resumen de partida", "\u0418\u0442\u043E\u0433\u0438 \u0438\u0433\u0440\u044B", "\u6E38\u620F\u603B\u7ED3"],
        gmS_power: ["Power", "\u0627\u0644\u0637\u0627\u0642\u0629", "G\xFC\xE7", "Energ\xEDa", "\u041F\u0438\u0442\u0430\u043D\u0438\u0435", "\u7535\u6E90"],
        gmS_gameMode: ["Game Mode", "Game Mode", "Game Mode", "Game Mode", "Game Mode", "Game Mode"],
        gmS_close: ["Apps", "\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A", "Uygulamalar", "Apps", "\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F", "\u5E94\u7528"],
        gmS_memory: ["RAM", "\u0627\u0644\u0630\u0627\u0643\u0631\u0629", "Bellek", "RAM", "\u041E\u0417\u0423", "\u5185\u5B58"],
        gmS_priority: ["Priority", "\u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629", "\xD6ncelik", "Prioridad", "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442", "\u4F18\u5148\u7EA7"],
        gmS_dvr: ["Recording", "\u0627\u0644\u062A\u0633\u062C\u064A\u0644", "Kay\u0131t", "Grabaci\xF3n", "\u0417\u0430\u043F\u0438\u0441\u044C", "\u5F55\u5236"],
        gmTurnOn: ["Turn on in Settings", "\u0627\u0644\u062A\u0634\u063A\u064A\u0644 \u0645\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", "Ayarlardan a\xE7", "Activar en Ajustes", "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445", "\u5728\u8BBE\u7F6E\u4E2D\u5F00\u542F"],
        gamingNav: ["Gaming", "\u0627\u0644\u0623\u0644\u0639\u0627\u0628", "Oyun", "Juegos", "\u0418\u0433\u0440\u044B", "\u6E38\u620F"],
        gamingText: ["Get the PC ready with one click before you play, and watch FPS, CPU/GPU usage and temperatures and memory in a slim bar at the top of the screen while you play.", "\u062C\u0647\u0651\u0632 \u0627\u0644\u062C\u0647\u0627\u0632 \u0628\u0646\u0642\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0642\u0628\u0644 \u0627\u0644\u0644\u0639\u0628\u060C \u0648\u062A\u0627\u0628\u0639 FPS \u0648\u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0648\u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062C \u0648\u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A \u0648\u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0641\u064A \u0634\u0631\u064A\u0637 \u0631\u0641\u064A\u0639 \u0623\u0639\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0644\u0639\u0628.", "Oynamadan \xF6nce bilgisayar\u0131 tek t\u0131kla haz\u0131rlay\u0131n; oynarken FPS\u2019i, i\u015Flemci/GPU kullan\u0131m\u0131n\u0131, s\u0131cakl\u0131klar\u0131 ve belle\u011Fi ekran\u0131n \xFCst\xFCndeki ince \xE7ubukta izleyin.", "Prepara el PC con un clic antes de jugar y mira los FPS, el uso y la temperatura de CPU y GPU y la memoria en una barra fina arriba mientras juegas.", "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u044C\u0442\u0435 \u041F\u041A \u043E\u0434\u043D\u0438\u043C \u0449\u0435\u043B\u0447\u043A\u043E\u043C \u043F\u0435\u0440\u0435\u0434 \u0438\u0433\u0440\u043E\u0439 \u0438 \u0441\u043B\u0435\u0434\u0438\u0442\u0435 \u0437\u0430 FPS, \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u043E\u0439 \u0438 \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u043E\u0439 \u0426\u041F \u0438 \u0413\u041F \u0438 \u043F\u0430\u043C\u044F\u0442\u044C\u044E \u0432 \u0442\u043E\u043D\u043A\u043E\u0439 \u043F\u043E\u043B\u043E\u0441\u0435 \u0441\u0432\u0435\u0440\u0445\u0443 \u044D\u043A\u0440\u0430\u043D\u0430.", "\u6E38\u620F\u524D\u4E00\u952E\u4F18\u5316\u7535\u8111\uFF0C\u6E38\u620F\u65F6\u5728\u5C4F\u5E55\u9876\u90E8\u7684\u7EC6\u6761\u4E2D\u67E5\u770B FPS\u3001CPU/GPU \u5360\u7528\u4E0E\u6E29\u5EA6\u4EE5\u53CA\u5185\u5B58\u3002"],
        gmCheck: ["Turn gaming mode on to check", "\u0634\u063A\u0651\u0644 \u0648\u0636\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0644\u0644\u062A\u062D\u0642\u0642", "Kontrol i\xE7in oyun modunu a\xE7\u0131n", "Activa el modo juego para comprobarlo", "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0438\u0433\u0440\u043E\u0432\u043E\u0439 \u0440\u0435\u0436\u0438\u043C \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438", "\u5F00\u542F\u6E38\u620F\u6A21\u5F0F\u4EE5\u68C0\u6D4B"],
        gmLibEmpty: ["No games found; add one with +", "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0623\u0644\u0639\u0627\u0628\u061B \u0623\u0636\u0641 \u0648\u0627\u062D\u062F\u0629 \u0628\u0640 +", "Oyun bulunamad\u0131; + ile ekleyin", "No se encontraron juegos; a\xF1ade uno con +", "\u0418\u0433\u0440\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B; \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 +", "\u672A\u627E\u5230\u6E38\u620F\uFF1B\u7528 + \u6DFB\u52A0"],
        gmAddGame: ["Add a game", "\u0625\u0636\u0627\u0641\u0629 \u0644\u0639\u0628\u0629", "Oyun ekle", "A\xF1adir un juego", "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0438\u0433\u0440\u0443", "\u6DFB\u52A0\u6E38\u620F"],
        gmLaunching: ["Starting {name}\u2026", "\u062C\u0627\u0631\u064D \u062A\u0634\u063A\u064A\u0644 {name}\u2026", "{name} ba\u015Flat\u0131l\u0131yor\u2026", "Iniciando {name}\u2026", "\u0417\u0430\u043F\u0443\u0441\u043A {name}\u2026", "\u6B63\u5728\u542F\u52A8 {name}\u2026"],
        gmLaunchFail: ["Couldn\u2019t start {name}", "\u062A\u0639\u0630\u0651\u0631 \u062A\u0634\u063A\u064A\u0644 {name}", "{name} ba\u015Flat\u0131lamad\u0131", "No se pudo iniciar {name}", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C {name}", "\u65E0\u6CD5\u542F\u52A8 {name}"],
        gmBarRtss: ["In-game bar (RivaTuner)", "\u0627\u0644\u0634\u0631\u064A\u0637 \u062F\u0627\u062E\u0644 \u0627\u0644\u0644\u0639\u0628\u0629 (RivaTuner)", "Oyun i\xE7i \xE7ubuk (RivaTuner)", "Barra dentro del juego (RivaTuner)", "\u041F\u043E\u043B\u043E\u0441\u0430 \u0432 \u0438\u0433\u0440\u0435 (RivaTuner)", "\u6E38\u620F\u5185\u60AC\u6D6E\u6761\uFF08RivaTuner\uFF09"],
        gmRtssMissing: ["Exclusive fullscreen: switch the game to Borderless to see the bar", "\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u062D\u0635\u0631\u064A: \u0627\u062E\u062A\u0631 \u0648\u0636\u0639 Borderless \u0641\u064A \u0627\u0644\u0644\u0639\u0628\u0629 \u0644\u064A\u0638\u0647\u0631 \u0627\u0644\u0634\u0631\u064A\u0637", "\xD6zel tam ekran: \xE7ubu\u011Fu g\xF6rmek i\xE7in oyunu Borderless moda al\u0131n", "Pantalla completa exclusiva: usa el modo Borderless del juego para ver la barra", "\u042D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u044B\u0439 \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C: \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0432 \u0438\u0433\u0440\u0435 Borderless, \u0447\u0442\u043E\u0431\u044B \u0432\u0438\u0434\u0435\u0442\u044C \u043F\u043E\u043B\u043E\u0441\u0443", "\u72EC\u5360\u5168\u5C4F\uFF1A\u8BF7\u5C06\u6E38\u620F\u8BBE\u4E3A\u65E0\u8FB9\u6846\uFF08Borderless\uFF09\u4EE5\u663E\u793A\u60AC\u6D6E\u6761"],
        gmGuideTitle: ["Guide: seeing the bar over your game", "\u062F\u0644\u064A\u0644: \u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0634\u0631\u064A\u0637 \u0641\u0648\u0642 \u0627\u0644\u0644\u0639\u0628\u0629", "Rehber: \xE7ubu\u011Fu oyunun \xFCzerinde g\xF6rmek", "Gu\xEDa: ver la barra sobre el juego", "\u041A\u0430\u043A \u0443\u0432\u0438\u0434\u0435\u0442\u044C \u043F\u043E\u043B\u043E\u0441\u0443 \u043F\u043E\u0432\u0435\u0440\u0445 \u0438\u0433\u0440\u044B", "\u6307\u5357\uFF1A\u5728\u6E38\u620F\u4E0A\u663E\u793A\u60AC\u6D6E\u6761"],
        gmGuide1: ["Best way: in the game\u2019s graphics settings set Display mode to Borderless (also called \u201CWindowed Fullscreen\u201D). The island\u2019s bar then shows over the game; on Windows 10 and 11 this usually costs no performance.", "\u0623\u0641\u0636\u0644 \u0637\u0631\u064A\u0642\u0629: \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0631\u0633\u0648\u0645\u064A\u0627\u062A \u0627\u0644\u0644\u0639\u0628\u0629 \u0627\u062E\u062A\u0631 \u0648\u0636\u0639 \u0627\u0644\u0639\u0631\u0636 Borderless (\u0623\u0648 \xAB\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629 \u0628\u0646\u0627\u0641\u0630\u0629\xBB). \u0639\u0646\u062F\u0647\u0627 \u064A\u0638\u0647\u0631 \u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0641\u0648\u0642 \u0627\u0644\u0644\u0639\u0628\u0629\u060C \u0648\u0639\u0627\u062F\u0629\u064B \u062F\u0648\u0646 \u0623\u064A \u062E\u0633\u0627\u0631\u0629 \u0641\u064A \u0627\u0644\u0623\u062F\u0627\u0621 \u0639\u0644\u0649 \u0648\u064A\u0646\u062F\u0648\u0632 10 \u064811.", "En iyi yol: oyunun grafik ayarlar\u0131nda G\xF6r\xFCnt\xFC modunu Borderless (\u201CPencereli Tam Ekran\u201D) yap\u0131n. Adan\u0131n \xE7ubu\u011Fu oyunun \xFCzerinde g\xF6r\xFCn\xFCr; Windows 10 ve 11\u2019de genellikle performans kayb\u0131 olmaz.", "La mejor opci\xF3n: en los ajustes gr\xE1ficos del juego pon el modo de pantalla en Borderless (\u201CVentana sin bordes\u201D). La barra de la isla aparece sobre el juego y en Windows 10 y 11 normalmente no cuesta rendimiento.", "\u041B\u0443\u0447\u0448\u0438\u0439 \u0441\u043F\u043E\u0441\u043E\u0431: \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0433\u0440\u0430\u0444\u0438\u043A\u0438 \u0438\u0433\u0440\u044B \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0435\u0436\u0438\u043C \u044D\u043A\u0440\u0430\u043D\u0430 Borderless (\xAB\u041E\u043A\u043E\u043D\u043D\u044B\u0439 \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0439\xBB). \u0422\u043E\u0433\u0434\u0430 \u043F\u043E\u043B\u043E\u0441\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0430 \u0432\u0438\u0434\u043D\u0430 \u043F\u043E\u0432\u0435\u0440\u0445 \u0438\u0433\u0440\u044B; \u043D\u0430 Windows 10 \u0438 11 \u044D\u0442\u043E \u043E\u0431\u044B\u0447\u043D\u043E \u043D\u0435 \u0441\u043D\u0438\u0436\u0430\u0435\u0442 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C.", "\u6700\u4F73\u65B9\u6CD5\uFF1A\u5728\u6E38\u620F\u56FE\u5F62\u8BBE\u7F6E\u4E2D\u628A\u663E\u793A\u6A21\u5F0F\u8BBE\u4E3A\u65E0\u8FB9\u6846\uFF08Borderless\uFF0C\u4E5F\u53EB\u201C\u7A97\u53E3\u5316\u5168\u5C4F\u201D\uFF09\u3002\u60AC\u6D6E\u5C9B\u60AC\u6D6E\u6761\u5C31\u4F1A\u663E\u793A\u5728\u6E38\u620F\u4E0A\u65B9\uFF0C\u5728 Windows 10 \u548C 11 \u4E0A\u901A\u5E38\u4E0D\u5F71\u54CD\u6027\u80FD\u3002"],
        gmGuide2: ["If you keep the game in Full Screen: Windows lets no window be seen over it. Run RivaTuner (free, comes with MSI Afterburner) and the same numbers are drawn as text inside the game.", "\u0625\u0646 \u0623\u0628\u0642\u064A\u062A \u0627\u0644\u0644\u0639\u0628\u0629 \u0641\u064A \u0648\u0636\u0639 \u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629: \u0644\u0627 \u064A\u0633\u0645\u062D \u0648\u064A\u0646\u062F\u0648\u0632 \u0628\u0638\u0647\u0648\u0631 \u0623\u064A \u0646\u0627\u0641\u0630\u0629 \u0641\u0648\u0642\u0647\u0627. \u0634\u063A\u0651\u0644 RivaTuner (\u0645\u062C\u0627\u0646\u064A\u060C \u064A\u0623\u062A\u064A \u0645\u0639 MSI Afterburner) \u0644\u062A\u0638\u0647\u0631 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0646\u0641\u0633\u0647\u0627 \u0643\u0646\u0635 \u062F\u0627\u062E\u0644 \u0627\u0644\u0644\u0639\u0628\u0629.", "Oyunu Tam Ekran\u2019da tutarsan\u0131z: Windows \xFCzerinde hi\xE7bir pencerenin g\xF6r\xFCnmesine izin vermez. RivaTuner\u2019\u0131 (\xFCcretsiz, MSI Afterburner ile gelir) \xE7al\u0131\u015Ft\u0131r\u0131n; ayn\u0131 de\u011Ferler oyunun i\xE7inde metin olarak \xE7izilir.", "Si mantienes el juego en Pantalla completa: Windows no deja ver ninguna ventana encima. Abre RivaTuner (gratis, viene con MSI Afterburner) y los mismos n\xFAmeros se dibujan como texto dentro del juego.", "\u0415\u0441\u043B\u0438 \u0438\u0433\u0440\u0430 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0432 \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435: Windows \u043D\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043F\u043E\u0432\u0435\u0440\u0445 \u043D\u0435\u0451 \u043D\u0438\u043A\u0430\u043A\u0438\u0445 \u043E\u043A\u043E\u043D. \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 RivaTuner (\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439, \u0438\u0434\u0451\u0442 \u0441 MSI Afterburner) \u2014 \u0442\u0435 \u0436\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0442\u0435\u043A\u0441\u0442\u043E\u043C \u0432\u043D\u0443\u0442\u0440\u0438 \u0438\u0433\u0440\u044B.", "\u5982\u679C\u6E38\u620F\u4FDD\u6301\u5168\u5C4F\uFF1AWindows \u4E0D\u5141\u8BB8\u4EFB\u4F55\u7A97\u53E3\u663E\u793A\u5728\u5176\u4E0A\u65B9\u3002\u8FD0\u884C RivaTuner\uFF08\u514D\u8D39\uFF0C\u968F MSI Afterburner \u63D0\u4F9B\uFF09\uFF0C\u540C\u6837\u7684\u6570\u636E\u4F1A\u4EE5\u6587\u5B57\u5F62\u5F0F\u7ED8\u5236\u5728\u6E38\u620F\u5185\u3002"],
        gmGuide3: ["On your phone: Blinkelo Link shows all these numbers with graphs and in a phone notification, in every display mode, Full Screen included, without putting anything on the game\u2019s screen.", "\u0639\u0644\u0649 \u0627\u0644\u0647\u0627\u062A\u0641: \u064A\u0639\u0631\u0636 Blinkelo Link \u0643\u0644 \u0647\u0630\u0647 \u0627\u0644\u0623\u0631\u0642\u0627\u0645 \u0628\u0631\u0633\u0648\u0645 \u0628\u064A\u0627\u0646\u064A\u0629 \u0648\u0641\u064A \u0625\u0634\u0639\u0627\u0631 \u0627\u0644\u0647\u0627\u062A\u0641\u060C \u0641\u064A \u0623\u064A \u0648\u0636\u0639 \u0639\u0631\u0636 \u062D\u062A\u0649 \u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629\u060C \u062F\u0648\u0646 \u0648\u0636\u0639 \u0623\u064A \u0634\u064A\u0621 \u0639\u0644\u0649 \u0634\u0627\u0634\u0629 \u0627\u0644\u0644\u0639\u0628\u0629.", "Telefonda: Blinkelo Link t\xFCm bu de\u011Ferleri grafiklerle ve telefon bildiriminde g\xF6sterir; Tam Ekran dahil her g\xF6r\xFCnt\xFC modunda, oyun ekran\u0131na hi\xE7bir \u015Fey koymadan.", "En el m\xF3vil: Blinkelo Link muestra todos estos n\xFAmeros con gr\xE1ficos y en una notificaci\xF3n del tel\xE9fono, en cualquier modo de pantalla, incluida la pantalla completa, sin poner nada en la pantalla del juego.", "\u041D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435: Blinkelo Link \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0432\u0441\u0435 \u044D\u0442\u0438 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0441 \u0433\u0440\u0430\u0444\u0438\u043A\u0430\u043C\u0438 \u0438 \u0432 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0438 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u2014 \u0432 \u043B\u044E\u0431\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u044D\u043A\u0440\u0430\u043D\u0430, \u0432\u043A\u043B\u044E\u0447\u0430\u044F \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0439, \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u044F \u043D\u0430 \u044D\u043A\u0440\u0430\u043D \u0438\u0433\u0440\u044B.", "\u5728\u624B\u673A\u4E0A\uFF1ABlinkelo Link \u4EE5\u56FE\u8868\u548C\u624B\u673A\u901A\u77E5\u7684\u5F62\u5F0F\u663E\u793A\u6240\u6709\u8FD9\u4E9B\u6570\u636E\uFF0C\u9002\u7528\u4E8E\u4EFB\u4F55\u663E\u793A\u6A21\u5F0F\uFF08\u5305\u62EC\u5168\u5C4F\uFF09\uFF0C\u4E14\u4E0D\u4F1A\u5728\u6E38\u620F\u753B\u9762\u4E0A\u6DFB\u52A0\u4EFB\u4F55\u5185\u5BB9\u3002"],
        gmGuideWhyTitle: ["Why doesn\u2019t Blinkelo draw inside the game itself?", "\u0644\u0645\u0627\u0630\u0627 \u0644\u0627 \u064A\u0631\u0633\u0645 Blinkelo \u062F\u0627\u062E\u0644 \u0627\u0644\u0644\u0639\u0628\u0629 \u0646\u0641\u0633\u0647\u0627\u061F", "Blinkelo neden oyunun i\xE7ine \xE7izim yapm\u0131yor?", "\xBFPor qu\xE9 Blinkelo no dibuja dentro del juego?", "\u041F\u043E\u0447\u0435\u043C\u0443 Blinkelo \u043D\u0435 \u0440\u0438\u0441\u0443\u0435\u0442 \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u0430\u043C\u043E\u0439 \u0438\u0433\u0440\u044B?", "\u4E3A\u4EC0\u4E48 Blinkelo \u4E0D\u5728\u6E38\u620F\u5185\u90E8\u7ED8\u5236\uFF1F"],
        gmGuideWhy: ["Drawing inside a game means injecting code into the game\u2019s process. Anti-cheat systems (Easy Anti-Cheat, BattlEye, Vanguard and others) treat an unknown program doing that as cheating and can ban your game account. Blinkelo deliberately injects nothing into games so your account stays safe. RivaTuner has been around for years and most anti-cheats allow it.", "\u0627\u0644\u0631\u0633\u0645 \u062F\u0627\u062E\u0644 \u0627\u0644\u0644\u0639\u0628\u0629 \u064A\u0639\u0646\u064A \u062D\u0642\u0646 \u0634\u064A\u0641\u0631\u0629 \u0641\u064A \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0644\u0639\u0628\u0629. \u0623\u0646\u0638\u0645\u0629 \u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u063A\u0634 (Easy Anti-Cheat \u0648BattlEye \u0648Vanguard \u0648\u063A\u064A\u0631\u0647\u0627) \u062A\u0639\u062F\u0651 \u0623\u064A \u0628\u0631\u0646\u0627\u0645\u062C \u0645\u062C\u0647\u0648\u0644 \u064A\u0641\u0639\u0644 \u0630\u0644\u0643 \u063A\u0634\u064B\u0627 \u0648\u0642\u062F \u062A\u062D\u0638\u0631 \u062D\u0633\u0627\u0628\u0643 \u0641\u064A \u0627\u0644\u0644\u0639\u0628\u0629. \u0644\u0627 \u064A\u062D\u0642\u0646 Blinkelo \u0623\u064A \u0634\u064A\u0641\u0631\u0629 \u0641\u064A \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0639\u0645\u062F\u064B\u0627 \u0644\u064A\u0628\u0642\u0649 \u062D\u0633\u0627\u0628\u0643 \u0622\u0645\u0646\u064B\u0627. \u0623\u0645\u0627 RivaTuner \u0641\u0645\u0639\u0631\u0648\u0641 \u0645\u0646\u0630 \u0633\u0646\u0648\u0627\u062A \u0648\u062A\u0633\u0645\u062D \u0628\u0647 \u0645\u0639\u0638\u0645 \u0623\u0646\u0638\u0645\u0629 \u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u063A\u0634.", "Oyunun i\xE7ine \xE7izmek, oyunun s\xFCrecine kod enjekte etmek demektir. Hile \xF6nleyiciler (Easy Anti-Cheat, BattlEye, Vanguard ve di\u011Ferleri) bunu yapan bilinmeyen bir program\u0131 hile sayar ve oyun hesab\u0131n\u0131z\u0131 yasaklayabilir. Blinkelo hesab\u0131n\u0131z g\xFCvende kals\u0131n diye oyunlara bilerek hi\xE7bir kod enjekte etmez. RivaTuner y\u0131llard\u0131r bilinir ve \xE7o\u011Fu hile \xF6nleyici buna izin verir.", "Dibujar dentro de un juego implica inyectar c\xF3digo en su proceso. Los sistemas antitrampas (Easy Anti-Cheat, BattlEye, Vanguard y otros) consideran trampa que un programa desconocido haga eso y pueden suspender tu cuenta. Blinkelo no inyecta nada en los juegos a prop\xF3sito, para que tu cuenta est\xE9 a salvo. RivaTuner existe desde hace a\xF1os y la mayor\xEDa de antitrampas lo permiten.", "\u0427\u0442\u043E\u0431\u044B \u0440\u0438\u0441\u043E\u0432\u0430\u0442\u044C \u0432\u043D\u0443\u0442\u0440\u0438 \u0438\u0433\u0440\u044B, \u043D\u0443\u0436\u043D\u043E \u0432\u043D\u0435\u0434\u0440\u0438\u0442\u044C \u043A\u043E\u0434 \u0432 \u0435\u0451 \u043F\u0440\u043E\u0446\u0435\u0441\u0441. \u0410\u043D\u0442\u0438\u0447\u0438\u0442\u044B (Easy Anti-Cheat, BattlEye, Vanguard \u0438 \u0434\u0440\u0443\u0433\u0438\u0435) \u0441\u0447\u0438\u0442\u0430\u044E\u0442 \u044D\u0442\u043E \u0447\u0438\u0442\u0435\u0440\u0441\u0442\u0432\u043E\u043C, \u0435\u0441\u043B\u0438 \u0442\u0430\u043A \u0434\u0435\u043B\u0430\u0435\u0442 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430, \u0438 \u043C\u043E\u0433\u0443\u0442 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0438\u0433\u0440\u043E\u0432\u043E\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442. Blinkelo \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u043E \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0432\u043D\u0435\u0434\u0440\u044F\u0435\u0442 \u0432 \u0438\u0433\u0440\u044B, \u0447\u0442\u043E\u0431\u044B \u0432\u0430\u0448 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0431\u044B\u043B \u0432 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438. RivaTuner \u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D \u043C\u043D\u043E\u0433\u043E \u043B\u0435\u0442, \u0438 \u0431\u043E\u043B\u044C\u0448\u0438\u043D\u0441\u0442\u0432\u043E \u0430\u043D\u0442\u0438\u0447\u0438\u0442\u043E\u0432 \u0435\u0433\u043E \u0434\u043E\u043F\u0443\u0441\u043A\u0430\u044E\u0442.", "\u5728\u6E38\u620F\u5185\u90E8\u7ED8\u5236\u9700\u8981\u5411\u6E38\u620F\u8FDB\u7A0B\u6CE8\u5165\u4EE3\u7801\u3002\u53CD\u4F5C\u5F0A\u7CFB\u7EDF\uFF08Easy Anti-Cheat\u3001BattlEye\u3001Vanguard \u7B49\uFF09\u4F1A\u628A\u8FD9\u6837\u505A\u7684\u672A\u77E5\u7A0B\u5E8F\u89C6\u4E3A\u4F5C\u5F0A\uFF0C\u5E76\u53EF\u80FD\u5C01\u7981\u4F60\u7684\u6E38\u620F\u8D26\u53F7\u3002Blinkelo \u523B\u610F\u4E0D\u5411\u6E38\u620F\u6CE8\u5165\u4EFB\u4F55\u4EE3\u7801\uFF0C\u4EE5\u4FDD\u62A4\u4F60\u7684\u8D26\u53F7\u5B89\u5168\u3002RivaTuner \u5DF2\u5B58\u5728\u591A\u5E74\uFF0C\u5927\u591A\u6570\u53CD\u4F5C\u5F0A\u7CFB\u7EDF\u90FD\u5141\u8BB8\u5B83\u3002"],
        gmGuideNowFs: ["The current game runs in Full Screen: the island\u2019s bar can\u2019t be seen over it.", "\u0627\u0644\u0644\u0639\u0628\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u062A\u0639\u0645\u0644 \u0628\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629: \u0644\u0627 \u064A\u0638\u0647\u0631 \u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0641\u0648\u0642\u0647\u0627.", "Mevcut oyun Tam Ekran\u2019da \xE7al\u0131\u015F\u0131yor: adan\u0131n \xE7ubu\u011Fu \xFCzerinde g\xF6r\xFCnmez.", "El juego actual est\xE1 en Pantalla completa: la barra de la isla no se ve encima.", "\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0438\u0433\u0440\u0430 \u0432 \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435: \u043F\u043E\u043B\u043E\u0441\u0443 \u043E\u0441\u0442\u0440\u043E\u0432\u0430 \u043F\u043E\u0432\u0435\u0440\u0445 \u043D\u0435\u0451 \u043D\u0435 \u0432\u0438\u0434\u043D\u043E.", "\u5F53\u524D\u6E38\u620F\u4EE5\u5168\u5C4F\u8FD0\u884C\uFF1A\u60AC\u6D6E\u5C9B\u60AC\u6D6E\u6761\u65E0\u6CD5\u663E\u793A\u5728\u5176\u4E0A\u65B9\u3002"],
        gmGuideNowOk: ["The current game runs windowed or borderless: the island\u2019s bar shows over it.", "\u0627\u0644\u0644\u0639\u0628\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u062A\u0639\u0645\u0644 \u0628\u0646\u0627\u0641\u0630\u0629 \u0623\u0648 \u0628\u0644\u0627 \u062D\u062F\u0648\u062F: \u064A\u0638\u0647\u0631 \u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0641\u0648\u0642\u0647\u0627.", "Mevcut oyun pencereli veya kenarl\u0131ks\u0131z: adan\u0131n \xE7ubu\u011Fu \xFCzerinde g\xF6r\xFCn\xFCr.", "El juego actual est\xE1 en ventana o sin bordes: la barra de la isla se ve encima.", "\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0438\u0433\u0440\u0430 \u0432 \u043E\u043A\u043E\u043D\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u0438\u043B\u0438 \u0431\u0435\u0437 \u0440\u0430\u043C\u043A\u0438: \u043F\u043E\u043B\u043E\u0441\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0430 \u0432\u0438\u0434\u043D\u0430 \u043F\u043E\u0432\u0435\u0440\u0445 \u043D\u0435\u0451.", "\u5F53\u524D\u6E38\u620F\u4E3A\u7A97\u53E3\u6216\u65E0\u8FB9\u6846\u6A21\u5F0F\uFF1A\u60AC\u6D6E\u5C9B\u60AC\u6D6E\u6761\u4F1A\u663E\u793A\u5728\u5176\u4E0A\u65B9\u3002"],
        gmFsHint: ["The game is in Full Screen, so the bar can\u2019t be seen over it", "\u0627\u0644\u0644\u0639\u0628\u0629 \u0628\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629 \u0644\u0630\u0627 \u0644\u0627 \u064A\u0638\u0647\u0631 \u0627\u0644\u0634\u0631\u064A\u0637 \u0641\u0648\u0642\u0647\u0627", "Oyun Tam Ekran\u2019da, \xE7ubuk \xFCzerinde g\xF6r\xFCnmez", "El juego est\xE1 en pantalla completa y la barra no se ve encima", "\u0418\u0433\u0440\u0430 \u0432 \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u2014 \u043F\u043E\u043B\u043E\u0441\u044B \u043F\u043E\u0432\u0435\u0440\u0445 \u043D\u0435\u0451 \u043D\u0435 \u0432\u0438\u0434\u043D\u043E", "\u6E38\u620F\u5904\u4E8E\u5168\u5C4F\uFF0C\u60AC\u6D6E\u6761\u65E0\u6CD5\u663E\u793A\u5728\u5176\u4E0A\u65B9"],
        gmGuideBtn: ["Guide", "\u0627\u0644\u062F\u0644\u064A\u0644", "Rehber", "Gu\xEDa", "\u0421\u043F\u0440\u0430\u0432\u043A\u0430", "\u6307\u5357"],
        gmRtssNotInstalled: ["RivaTuner isn\u2019t installed", "RivaTuner \u063A\u064A\u0631 \u0645\u062B\u0628\u062A", "RivaTuner y\xFCkl\xFC de\u011Fil", "RivaTuner no est\xE1 instalado", "RivaTuner \u043D\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D", "\u672A\u5B89\u88C5 RivaTuner"],
        gmStep_rtss: ["RivaTuner for exclusive fullscreen", "RivaTuner \u0644\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u062D\u0635\u0631\u064A", "\xD6zel tam ekran i\xE7in RivaTuner", "RivaTuner para pantalla completa exclusiva", "RivaTuner \u0434\u043B\u044F \u044D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u043E\u0433\u043E \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u0440\u0435\u0436\u0438\u043C\u0430", "\u7528\u4E8E\u72EC\u5360\u5168\u5C4F\u7684 RivaTuner"],
        gmS_rtss: ["RivaTuner", "RivaTuner", "RivaTuner", "RivaTuner", "RivaTuner", "RivaTuner"],
        gmEngine: ["How the bar is drawn", "\u0637\u0631\u064A\u0642\u0629 \u0631\u0633\u0645 \u0627\u0644\u0634\u0631\u064A\u0637", "\xC7ubuk nas\u0131l \xE7izilsin", "C\xF3mo se dibuja la barra", "\u041A\u0430\u043A \u0440\u0438\u0441\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u043B\u043E\u0441\u0443", "\u60AC\u6D6E\u6761\u7ED8\u5236\u65B9\u5F0F"],
        gmEngAuto: ["Automatic", "\u062A\u0644\u0642\u0627\u0626\u064A", "Otomatik", "Autom\xE1tico", "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438", "\u81EA\u52A8"],
        gmEngWindow: ["Window", "\u0646\u0627\u0641\u0630\u0629", "Pencere", "Ventana", "\u041E\u043A\u043D\u043E", "\u7A97\u53E3"],
        gmEngRtss: ["In-game (RivaTuner)", "\u062F\u0627\u062E\u0644 \u0627\u0644\u0644\u0639\u0628\u0629 (RivaTuner)", "Oyun i\xE7i (RivaTuner)", "Dentro del juego (RivaTuner)", "\u0412 \u0438\u0433\u0440\u0435 (RivaTuner)", "\u6E38\u620F\u5185\uFF08RivaTuner\uFF09"],
        gmEngHint: ["\u201CAutomatic\u201D: the island\u2019s own bar is shown over the game. No window can be seen over a game in real Full Screen; there, if RivaTuner is running, the text inside the game takes the bar\u2019s place. To see the island\u2019s bar, set the game to Borderless. \u201CWindow\u201D always uses the island\u2019s bar, \u201CIn-game\u201D always RivaTuner.", "\xAB\u062A\u0644\u0642\u0627\u0626\u064A\xBB: \u064A\u0638\u0647\u0631 \u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0641\u0648\u0642 \u0627\u0644\u0644\u0639\u0628\u0629. \u0644\u0627 \u062A\u0638\u0647\u0631 \u0623\u064A \u0646\u0627\u0641\u0630\u0629 \u0641\u0648\u0642 \u0644\u0639\u0628\u0629 \u0641\u064A \u0648\u0636\u0639 \u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u061B \u0639\u0646\u062F\u0647\u0627 \u0625\u0646 \u0643\u0627\u0646 RivaTuner \u064A\u0639\u0645\u0644 \u064A\u062D\u0644 \u0627\u0644\u0646\u0635 \u062F\u0627\u062E\u0644 \u0627\u0644\u0644\u0639\u0628\u0629 \u0645\u062D\u0644 \u0627\u0644\u0634\u0631\u064A\u0637. \u0644\u0631\u0624\u064A\u0629 \u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0627\u0636\u0628\u0637 \u0627\u0644\u0644\u0639\u0628\u0629 \u0639\u0644\u0649 Borderless. \xAB\u0646\u0627\u0641\u0630\u0629\xBB \u062A\u0633\u062A\u062E\u062F\u0645 \u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u062F\u0627\u0626\u0645\u064B\u0627 \u0648\xAB\u062F\u0627\u062E\u0644 \u0627\u0644\u0644\u0639\u0628\u0629\xBB RivaTuner \u062F\u0627\u0626\u0645\u064B\u0627.", "\u201COtomatik\u201D: adan\u0131n kendi \xE7ubu\u011Fu oyunun \xFCzerinde g\xF6sterilir. Ger\xE7ek tam ekrandaki bir oyunun \xFCzerinde hi\xE7bir pencere g\xF6r\xFCnmez; orada RivaTuner \xE7al\u0131\u015F\u0131yorsa \xE7ubu\u011Fun yerini oyun i\xE7i metin al\u0131r. Adan\u0131n \xE7ubu\u011Funu g\xF6rmek i\xE7in oyunu Borderless yap\u0131n. \u201CPencere\u201D her zaman adan\u0131n \xE7ubu\u011Funu, \u201COyun i\xE7i\u201D her zaman RivaTuner\u2019\u0131 kullan\u0131r.", "\u201CAutom\xE1tico\u201D: la barra de la isla se muestra sobre el juego. Sobre un juego en pantalla completa real no se ve ninguna ventana; ah\xED, si RivaTuner est\xE1 abierto, el texto dentro del juego ocupa el lugar de la barra. Para ver la barra de la isla, pon el juego en Borderless. \u201CVentana\u201D usa siempre la barra de la isla y \u201CDentro del juego\u201D siempre RivaTuner.", "\xAB\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\xBB: \u043F\u043E\u0432\u0435\u0440\u0445 \u0438\u0433\u0440\u044B \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u043B\u043E\u0441\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0430. \u041F\u043E\u0432\u0435\u0440\u0445 \u0438\u0433\u0440\u044B \u0432 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u043C \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u043D\u0435 \u0432\u0438\u0434\u043D\u043E \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u043E\u043A\u043D\u0430; \u0442\u043E\u0433\u0434\u0430, \u0435\u0441\u043B\u0438 \u0437\u0430\u043F\u0443\u0449\u0435\u043D RivaTuner, \u0432\u043C\u0435\u0441\u0442\u043E \u043F\u043E\u043B\u043E\u0441\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0442\u0435\u043A\u0441\u0442 \u0432\u043D\u0443\u0442\u0440\u0438 \u0438\u0433\u0440\u044B. \u0427\u0442\u043E\u0431\u044B \u0432\u0438\u0434\u0435\u0442\u044C \u043F\u043E\u043B\u043E\u0441\u0443 \u043E\u0441\u0442\u0440\u043E\u0432\u0430, \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0432 \u0438\u0433\u0440\u0435 Borderless. \xAB\u041E\u043A\u043D\u043E\xBB \u2014 \u0432\u0441\u0435\u0433\u0434\u0430 \u043F\u043E\u043B\u043E\u0441\u0430 \u043E\u0441\u0442\u0440\u043E\u0432\u0430, \xAB\u0412 \u0438\u0433\u0440\u0435\xBB \u2014 \u0432\u0441\u0435\u0433\u0434\u0430 RivaTuner.", "\u201C\u81EA\u52A8\u201D\uFF1A\u5728\u6E38\u620F\u4E0A\u663E\u793A\u60AC\u6D6E\u5C9B\u81EA\u5DF1\u7684\u60AC\u6D6E\u6761\u3002\u771F\u6B63\u5168\u5C4F\u7684\u6E38\u620F\u4E0A\u770B\u4E0D\u5230\u4EFB\u4F55\u7A97\u53E3\uFF1B\u6B64\u65F6\u82E5 RivaTuner \u6B63\u5728\u8FD0\u884C\uFF0C\u5219\u6539\u7528\u6E38\u620F\u5185\u6587\u5B57\u3002\u8981\u770B\u5230\u60AC\u6D6E\u5C9B\u60AC\u6D6E\u6761\uFF0C\u8BF7\u628A\u6E38\u620F\u8BBE\u4E3A\u65E0\u8FB9\u6846\uFF08Borderless\uFF09\u3002\u201C\u7A97\u53E3\u201D\u59CB\u7EC8\u4F7F\u7528\u60AC\u6D6E\u5C9B\u60AC\u6D6E\u6761\uFF0C\u201C\u6E38\u620F\u5185\u201D\u59CB\u7EC8\u4F7F\u7528 RivaTuner\u3002"],
        gmRtss: ["RivaTuner Statistics Server", "RivaTuner Statistics Server", "RivaTuner Statistics Server", "RivaTuner Statistics Server", "RivaTuner Statistics Server", "RivaTuner Statistics Server"],
        gmRtssRunning: ["Running", "\u064A\u0639\u0645\u0644", "\xC7al\u0131\u015F\u0131yor", "En ejecuci\xF3n", "\u0417\u0430\u043F\u0443\u0449\u0435\u043D", "\u8FD0\u884C\u4E2D"],
        gmRtssInstalled: ["Installed, not running (Optimize starts it)", "\u0645\u062B\u0628\u062A \u0644\u0643\u0646\u0647 \u0644\u0627 \u064A\u0639\u0645\u0644 (\u0627\u0644\u062A\u062D\u0633\u064A\u0646 \u064A\u0634\u063A\u0651\u0644\u0647)", "Y\xFCkl\xFC, \xE7al\u0131\u015Fm\u0131yor (Optimize ba\u015Flat\u0131r)", "Instalado, sin ejecutar (Optimizar lo inicia)", "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D, \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D (\u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442 \u0435\u0433\u043E)", "\u5DF2\u5B89\u88C5\u4F46\u672A\u8FD0\u884C\uFF08\u4F18\u5316\u65F6\u4F1A\u542F\u52A8\uFF09"],
        gmRtssHint: ["No window can appear over a game in exclusive fullscreen; only something that draws inside the game can. RivaTuner (free, ships with MSI Afterburner) does exactly that and anti-cheat systems know it. Set the text position and size in RivaTuner itself.", "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0644\u0623\u064A \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u0638\u0647\u0648\u0631 \u0641\u0648\u0642 \u0644\u0639\u0628\u0629 \u0628\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u062D\u0635\u0631\u064A\u061B \u0641\u0642\u0637 \u0645\u0627 \u064A\u0631\u0633\u0645 \u062F\u0627\u062E\u0644 \u0627\u0644\u0644\u0639\u0628\u0629. \u064A\u0642\u0648\u0645 RivaTuner (\u0645\u062C\u0627\u0646\u064A\u060C \u0645\u0639 MSI Afterburner) \u0628\u0630\u0644\u0643 \u0648\u062A\u0639\u0631\u0641\u0647 \u0623\u0646\u0638\u0645\u0629 \u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u063A\u0634. \u0627\u0636\u0628\u0637 \u0645\u0648\u0636\u0639 \u0627\u0644\u0646\u0635 \u0648\u062D\u062C\u0645\u0647 \u0641\u064A RivaTuner \u0646\u0641\u0633\u0647.", "\xD6zel tam ekrandaki oyunun \xFCst\xFCnde hi\xE7bir pencere g\xF6r\xFCnmez; yaln\u0131zca oyunun i\xE7ine \xE7izen bir \u015Fey g\xF6r\xFCn\xFCr. RivaTuner (\xFCcretsiz, MSI Afterburner ile gelir) bunu yapar ve hile kar\u015F\u0131t\u0131 sistemler onu tan\u0131r. Metnin konumunu ve boyutunu RivaTuner\u2019da ayarlay\u0131n.", "Ninguna ventana puede verse sobre un juego en pantalla completa exclusiva; solo algo que dibuje dentro del juego. RivaTuner (gratis, viene con MSI Afterburner) hace eso y los antitrampas lo conocen. Ajusta la posici\xF3n y el tama\xF1o del texto en RivaTuner.", "\u041F\u043E\u0432\u0435\u0440\u0445 \u0438\u0433\u0440\u044B \u0432 \u044D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u043E\u043C \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u043D\u0435 \u0432\u0438\u0434\u043D\u043E \u043D\u0438 \u043E\u0434\u043D\u043E \u043E\u043A\u043D\u043E \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u043E, \u0447\u0442\u043E \u0440\u0438\u0441\u0443\u0435\u0442 \u0432\u043D\u0443\u0442\u0440\u0438 \u0438\u0433\u0440\u044B. \u042D\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 RivaTuner (\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439, \u0438\u0434\u0451\u0442 \u0441 MSI Afterburner), \u0438 \u0430\u043D\u0442\u0438\u0447\u0438\u0442\u044B \u0435\u0433\u043E \u0437\u043D\u0430\u044E\u0442. \u041F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0438 \u0440\u0430\u0437\u043C\u0435\u0440 \u0442\u0435\u043A\u0441\u0442\u0430 \u0437\u0430\u0434\u0430\u044E\u0442\u0441\u044F \u0432 \u0441\u0430\u043C\u043E\u043C RivaTuner.", "\u72EC\u5360\u5168\u5C4F\u6E38\u620F\u4E0A\u65E0\u6CD5\u663E\u793A\u4EFB\u4F55\u7A97\u53E3\uFF0C\u53EA\u6709\u5728\u6E38\u620F\u5185\u90E8\u7ED8\u5236\u7684\u7A0B\u5E8F\u624D\u884C\u3002RivaTuner\uFF08\u514D\u8D39\uFF0C\u968F MSI Afterburner \u63D0\u4F9B\uFF09\u6B63\u662F\u8FD9\u6837\u505A\u7684\uFF0C\u4E14\u53CD\u4F5C\u5F0A\u7CFB\u7EDF\u8BA4\u53EF\u5B83\u3002\u6587\u5B57\u4F4D\u7F6E\u548C\u5927\u5C0F\u8BF7\u5728 RivaTuner \u4E2D\u8BBE\u7F6E\u3002"],
        gmGetRtss: ["Get RivaTuner", "\u062A\u0646\u0632\u064A\u0644 RivaTuner", "RivaTuner\u2019\u0131 indir", "Descargar RivaTuner", "\u0421\u043A\u0430\u0447\u0430\u0442\u044C RivaTuner", "\u83B7\u53D6 RivaTuner"],
        gmLibrary: ["Game library", "\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0623\u0644\u0639\u0627\u0628", "Oyun k\xFCt\xFCphanesi", "Biblioteca de juegos", "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0438\u0433\u0440", "\u6E38\u620F\u5E93"],
        gmLibHint: ["Steam, Epic, GOG and Ubisoft games are found automatically; games you played before or add yourself show up too. Click an icon in the Gaming tab to start the game.", "\u062A\u064F\u0643\u062A\u0634\u0641 \u0623\u0644\u0639\u0627\u0628 Steam \u0648Epic \u0648GOG \u0648Ubisoft \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627\u060C \u0648\u062A\u0638\u0647\u0631 \u0623\u064A\u0636\u064B\u0627 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0627\u0644\u062A\u064A \u0644\u0639\u0628\u062A\u0647\u0627 \u0623\u0648 \u0623\u0636\u0641\u062A\u0647\u0627. \u0627\u0646\u0642\u0631 \u0623\u064A\u0642\u0648\u0646\u0629 \u0641\u064A \u062A\u0628\u0648\u064A\u0628 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0644\u0644\u062A\u0634\u063A\u064A\u0644.", "Steam, Epic, GOG ve Ubisoft oyunlar\u0131 otomatik bulunur; daha \xF6nce oynad\u0131\u011F\u0131n\u0131z veya ekledi\u011Finiz oyunlar da g\xF6r\xFCn\xFCr. Ba\u015Flatmak i\xE7in Oyun sekmesinde simgeye t\u0131klay\u0131n.", "Los juegos de Steam, Epic, GOG y Ubisoft se encuentran solos; tambi\xE9n aparecen los que ya jugaste o a\xF1adas. Haz clic en un icono de la pesta\xF1a Juegos para iniciarlo.", "\u0418\u0433\u0440\u044B Steam, Epic, GOG \u0438 Ubisoft \u043D\u0430\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438; \u0442\u0430\u043A\u0436\u0435 \u0432\u0438\u0434\u043D\u044B \u0438\u0433\u0440\u044B, \u0432 \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0432\u044B \u0443\u0436\u0435 \u0438\u0433\u0440\u0430\u043B\u0438 \u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u0438\u043B\u0438 \u0441\u0430\u043C\u0438. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0437\u043D\u0430\u0447\u043E\u043A \u043D\u0430 \u0432\u043A\u043B\u0430\u0434\u043A\u0435 \xAB\u0418\u0433\u0440\u044B\xBB, \u0447\u0442\u043E\u0431\u044B \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C.", "\u81EA\u52A8\u53D1\u73B0 Steam\u3001Epic\u3001GOG \u548C Ubisoft \u6E38\u620F\uFF0C\u73A9\u8FC7\u6216\u624B\u52A8\u6DFB\u52A0\u7684\u6E38\u620F\u4E5F\u4F1A\u663E\u793A\u3002\u5728\u6E38\u620F\u6807\u7B7E\u4E2D\u70B9\u51FB\u56FE\u6807\u5373\u53EF\u542F\u52A8\u3002"],
        gmRescan: ["Scan again", "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0628\u062D\u062B", "Yeniden tara", "Volver a buscar", "\u0418\u0441\u043A\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430", "\u91CD\u65B0\u626B\u63CF"],
        gmOptLaunch: ["Optimize before starting a game from the island", "\u0627\u0644\u062A\u062D\u0633\u064A\u0646 \u0642\u0628\u0644 \u062A\u0634\u063A\u064A\u0644 \u0644\u0639\u0628\u0629 \u0645\u0646 \u0627\u0644\u062C\u0632\u064A\u0631\u0629", "Adadan oyun ba\u015Flatmadan \xF6nce optimize et", "Optimizar antes de iniciar un juego desde la isla", "\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0435\u0440\u0435\u0434 \u0437\u0430\u043F\u0443\u0441\u043A\u043E\u043C \u0438\u0433\u0440\u044B \u0441 \u043E\u0441\u0442\u0440\u043E\u0432\u0430", "\u4ECE\u60AC\u6D6E\u5C9B\u542F\u52A8\u6E38\u620F\u524D\u5148\u4F18\u5316"],
        gmHide: ["Hide", "\u0625\u062E\u0641\u0627\u0621", "Gizle", "Ocultar", "\u0421\u043A\u0440\u044B\u0442\u044C", "\u9690\u85CF"],
        gmShow: ["Show", "\u0625\u0638\u0647\u0627\u0631", "G\xF6ster", "Mostrar", "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C", "\u663E\u793A"],
        gmSrc_steam: ["Steam", "Steam", "Steam", "Steam", "Steam", "Steam"],
        gmSrc_epic: ["Epic Games", "Epic Games", "Epic Games", "Epic Games", "Epic Games", "Epic Games"],
        gmSrc_gog: ["GOG", "GOG", "GOG", "GOG", "GOG", "GOG"],
        gmSrc_ubisoft: ["Ubisoft Connect", "Ubisoft Connect", "Ubisoft Connect", "Ubisoft Connect", "Ubisoft Connect", "Ubisoft Connect"],
        gmSrc_played: ["Played before", "\u0644\u064F\u0639\u0628\u062A \u0633\u0627\u0628\u0642\u064B\u0627", "Daha \xF6nce oynand\u0131", "Jugado antes", "\u0423\u0436\u0435 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u043B\u0430\u0441\u044C", "\u73A9\u8FC7"],
        gmSrc_custom: ["Added by you", "\u0623\u0636\u0641\u062A\u0647\u0627 \u0623\u0646\u062A", "Sizin ekledi\u011Finiz", "A\xF1adido por ti", "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0430 \u0432\u0430\u043C\u0438", "\u624B\u52A8\u6DFB\u52A0"],
        // settings
        gmEnable: ["Enable gaming mode", "\u062A\u0641\u0639\u064A\u0644 \u0648\u0636\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628", "Oyun modunu etkinle\u015Ftir", "Activar el modo juego", "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u0433\u0440\u043E\u0432\u043E\u0439 \u0440\u0435\u0436\u0438\u043C", "\u542F\u7528\u6E38\u620F\u6A21\u5F0F"],
        gmEnableHint: ["One-click optimizer and an overlay bar with FPS, temperatures and usage", "\u0645\u062D\u0633\u0651\u0646 \u0628\u0646\u0642\u0631\u0629 \u0648\u0627\u062D\u062F\u0629 \u0648\u0634\u0631\u064A\u0637 \u0641\u0648\u0642 \u0627\u0644\u0644\u0639\u0628\u0629 \u064A\u0639\u0631\u0636 FPS \u0648\u0627\u0644\u062D\u0631\u0627\u0631\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u0647\u0644\u0627\u0643", "Tek t\u0131kla optimizasyon ve FPS, s\u0131cakl\u0131k, kullan\u0131m g\xF6steren \xE7ubuk", "Optimizador de un clic y barra con FPS, temperaturas y uso", "\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F \u0432 \u043E\u0434\u0438\u043D \u043A\u043B\u0438\u043A \u0438 \u043F\u043E\u043B\u043E\u0441\u0430 \u0441 FPS, \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430\u043C\u0438 \u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u043E\u0439", "\u4E00\u952E\u4F18\u5316\uFF0C\u5E76\u5728\u6E38\u620F\u4E0A\u663E\u793A FPS\u3001\u6E29\u5EA6\u548C\u5360\u7528"],
        gmAuto: ["Detect games automatically", "\u0627\u0643\u062A\u0634\u0627\u0641 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627", "Oyunlar\u0131 otomatik alg\u0131la", "Detectar juegos autom\xE1ticamente", "\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0442\u044C \u0438\u0433\u0440\u044B \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438", "\u81EA\u52A8\u8BC6\u522B\u6E38\u620F"],
        gmAutoHint: ["When a game starts, gaming mode and the overlay bar turn on by themselves", "\u0639\u0646\u062F \u0628\u062F\u0621 \u0644\u0639\u0628\u0629 \u064A\u0639\u0645\u0644 \u0648\u0636\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0648\u0627\u0644\u0634\u0631\u064A\u0637 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627", "Oyun ba\u015Flay\u0131nca oyun modu ve \xE7ubuk kendili\u011Finden a\xE7\u0131l\u0131r", "Al iniciar un juego, el modo juego y la barra se activan solos", "\u041F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435 \u0438\u0433\u0440\u044B \u0440\u0435\u0436\u0438\u043C \u0438 \u043F\u043E\u043B\u043E\u0441\u0430 \u0432\u043A\u043B\u044E\u0447\u0430\u044E\u0442\u0441\u044F \u0441\u0430\u043C\u0438", "\u6E38\u620F\u542F\u52A8\u65F6\u81EA\u52A8\u5F00\u542F\u6E38\u620F\u6A21\u5F0F\u548C\u60AC\u6D6E\u6761"],
        gmAutoOpt: ["Optimize automatically when a game starts", "\u062A\u062D\u0633\u064A\u0646 \u062A\u0644\u0642\u0627\u0626\u064A \u0639\u0646\u062F \u0628\u062F\u0621 \u0627\u0644\u0644\u0639\u0628\u0629", "Oyun ba\u015Flay\u0131nca otomatik optimize et", "Optimizar autom\xE1ticamente al iniciar un juego", "\u041E\u043F\u0442\u0438\u043C\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435 \u0438\u0433\u0440\u044B", "\u6E38\u620F\u542F\u52A8\u65F6\u81EA\u52A8\u4F18\u5316"],
        gmRestore: ["Undo the changes when the game closes", "\u0627\u0644\u062A\u0631\u0627\u062C\u0639 \u0639\u0646 \u0627\u0644\u062A\u063A\u064A\u064A\u0631\u0627\u062A \u0639\u0646\u062F \u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0644\u0639\u0628\u0629", "Oyun kapan\u0131nca de\u011Fi\u015Fiklikleri geri al", "Deshacer los cambios al cerrar el juego", "\u041E\u0442\u043C\u0435\u043D\u044F\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u044F \u0438\u0433\u0440\u044B", "\u6E38\u620F\u5173\u95ED\u540E\u64A4\u9500\u66F4\u6539"],
        gmQuiet: ["Keep the island out of the way while playing", "\u0625\u0628\u0639\u0627\u062F \u0627\u0644\u062C\u0632\u064A\u0631\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u0644\u0639\u0628", "Oynarken ada g\xF6r\xFCnmesin", "Ocultar la isla mientras juegas", "\u0423\u0431\u0438\u0440\u0430\u0442\u044C \u043E\u0441\u0442\u0440\u043E\u0432 \u0432\u043E \u0432\u0440\u0435\u043C\u044F \u0438\u0433\u0440\u044B", "\u6E38\u620F\u65F6\u9690\u85CF\u60AC\u6D6E\u5C9B"],
        gmQuietHint: ["Calls still show up; widget downloads pause", "\u062A\u0628\u0642\u0649 \u0627\u0644\u0645\u0643\u0627\u0644\u0645\u0627\u062A \u0638\u0627\u0647\u0631\u0629 \u0648\u062A\u062A\u0648\u0642\u0641 \u062A\u0646\u0632\u064A\u0644\u0627\u062A \u0627\u0644\u0623\u062F\u0648\u0627\u062A", "Aramalar yine g\xF6r\xFCn\xFCr; widget indirmeleri durur", "Las llamadas siguen apareciendo; se pausan los widgets", "\u0417\u0432\u043E\u043D\u043A\u0438 \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u0432\u0438\u0434\u043D\u044B; \u0432\u0438\u0434\u0436\u0435\u0442\u044B \u043D\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u044F\u044E\u0442\u0441\u044F", "\u6765\u7535\u4ECD\u4F1A\u663E\u793A\uFF1B\u5C0F\u7EC4\u4EF6\u6682\u505C\u66F4\u65B0"],
        gmBarSection: ["Overlay bar", "\u0634\u0631\u064A\u0637 \u0641\u0648\u0642 \u0627\u0644\u0644\u0639\u0628\u0629", "Oyun \xFCst\xFC \xE7ubuk", "Barra superpuesta", "\u041E\u0432\u0435\u0440\u043B\u0435\u0439-\u043F\u043E\u043B\u043E\u0441\u0430", "\u6E38\u620F\u60AC\u6D6E\u6761"],
        gmBarEnable: ["Show a slim bar at the top of the screen", "\u0625\u0638\u0647\u0627\u0631 \u0634\u0631\u064A\u0637 \u0631\u0641\u064A\u0639 \u0623\u0639\u0644\u0649 \u0627\u0644\u0634\u0627\u0634\u0629", "Ekran\u0131n \xFCst\xFCnde ince \xE7ubuk g\xF6ster", "Mostrar una barra fina arriba", "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0442\u043E\u043D\u043A\u0443\u044E \u043F\u043E\u043B\u043E\u0441\u0443 \u0441\u0432\u0435\u0440\u0445\u0443", "\u5728\u5C4F\u5E55\u9876\u90E8\u663E\u793A\u7EC6\u6761"],
        gmBarShow: ["When to show it", "\u0645\u062A\u0649 \u064A\u0638\u0647\u0631", "Ne zaman g\xF6sterilsin", "Cu\xE1ndo mostrarla", "\u041A\u043E\u0433\u0434\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C", "\u4F55\u65F6\u663E\u793A"],
        gmBarGame: ["Only over games", "\u0641\u0648\u0642 \u0627\u0644\u0623\u0644\u0639\u0627\u0628 \u0641\u0642\u0637", "Yaln\u0131zca oyunlarda", "Solo sobre juegos", "\u0422\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0432\u0435\u0440\u0445 \u0438\u0433\u0440", "\u4EC5\u5728\u6E38\u620F\u4E0A"],
        gmBarAlways: ["Whenever gaming mode is on", "\u062F\u0627\u0626\u0645\u064B\u0627 \u0641\u064A \u0648\u0636\u0639 \u0627\u0644\u0623\u0644\u0639\u0627\u0628", "Oyun modu a\xE7\u0131kken her zaman", "Siempre en modo juego", "\u0412\u0441\u0435\u0433\u0434\u0430 \u0432 \u0438\u0433\u0440\u043E\u0432\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435", "\u6E38\u620F\u6A21\u5F0F\u4E0B\u59CB\u7EC8\u663E\u793A"],
        gmPos: ["Position", "\u0627\u0644\u0645\u0648\u0636\u0639", "Konum", "Posici\xF3n", "\u041F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435", "\u4F4D\u7F6E"],
        gmLeft: ["Left", "\u064A\u0633\u0627\u0631", "Sol", "Izquierda", "\u0421\u043B\u0435\u0432\u0430", "\u5DE6"],
        gmCenter: ["Center", "\u0648\u0633\u0637", "Orta", "Centro", "\u041F\u043E \u0446\u0435\u043D\u0442\u0440\u0443", "\u4E2D"],
        gmRight: ["Right", "\u064A\u0645\u064A\u0646", "Sa\u011F", "Derecha", "\u0421\u043F\u0440\u0430\u0432\u0430", "\u53F3"],
        gmSize: ["Size", "\u0627\u0644\u062D\u062C\u0645", "Boyut", "Tama\xF1o", "\u0420\u0430\u0437\u043C\u0435\u0440", "\u5927\u5C0F"],
        gmSmall: ["Small", "\u0635\u063A\u064A\u0631", "K\xFC\xE7\xFCk", "Peque\xF1o", "\u041C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u0439", "\u5C0F"],
        gmMedium: ["Medium", "\u0645\u062A\u0648\u0633\u0637", "Orta", "Mediano", "\u0421\u0440\u0435\u0434\u043D\u0438\u0439", "\u4E2D"],
        gmLarge: ["Large", "\u0643\u0628\u064A\u0631", "B\xFCy\xFCk", "Grande", "\u0411\u043E\u043B\u044C\u0448\u043E\u0439", "\u5927"],
        gmOpacity: ["Background opacity", "\u0639\u062A\u0627\u0645\u0629 \u0627\u0644\u062E\u0644\u0641\u064A\u0629", "Arka plan opakl\u0131\u011F\u0131", "Opacidad del fondo", "\u041D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0441\u0442\u044C \u0444\u043E\u043D\u0430", "\u80CC\u666F\u4E0D\u900F\u660E\u5EA6"],
        gmMetrics: ["What it shows", "\u0645\u0627 \u064A\u0639\u0631\u0636\u0647", "Neler g\xF6sterilsin", "Qu\xE9 muestra", "\u0427\u0442\u043E \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C", "\u663E\u793A\u5185\u5BB9"],
        gx_fps: ["FPS", "FPS", "FPS", "FPS", "FPS", "FPS"],
        gx_low1: ["1% low FPS", "\u0623\u062F\u0646\u0649 1% FPS", "%1 d\xFC\u015F\xFCk FPS", "FPS 1% bajo", "1% low FPS", "1% Low FPS"],
        gx_ft: ["Frame time", "\u0632\u0645\u0646 \u0627\u0644\u0625\u0637\u0627\u0631", "Kare s\xFCresi", "Tiempo de fotograma", "\u0412\u0440\u0435\u043C\u044F \u043A\u0430\u0434\u0440\u0430", "\u5E27\u65F6\u95F4"],
        gx_cpu: ["CPU usage", "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0639\u0627\u0644\u062C", "\u0130\u015Flemci kullan\u0131m\u0131", "Uso de CPU", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0426\u041F", "CPU \u5360\u7528"],
        gx_cpuTemp: ["CPU temperature", "\u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062C", "\u0130\u015Flemci s\u0131cakl\u0131\u011F\u0131", "Temperatura de CPU", "\u0422\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u0426\u041F", "CPU \u6E29\u5EA6"],
        gx_gpu: ["GPU usage", "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A", "GPU kullan\u0131m\u0131", "Uso de GPU", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0413\u041F", "GPU \u5360\u7528"],
        gx_gpuTemp: ["GPU temperature", "\u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A", "GPU s\u0131cakl\u0131\u011F\u0131", "Temperatura de GPU", "\u0422\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u0413\u041F", "GPU \u6E29\u5EA6"],
        gx_vram: ["Video memory (VRAM)", "\u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A", "Ekran belle\u011Fi (VRAM)", "Memoria de v\xEDdeo (VRAM)", "\u0412\u0438\u0434\u0435\u043E\u043F\u0430\u043C\u044F\u0442\u044C", "\u663E\u5B58"],
        gx_ram: ["RAM usage", "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0630\u0627\u0643\u0631\u0629", "Bellek kullan\u0131m\u0131", "Uso de RAM", "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u041E\u0417\u0423", "\u5185\u5B58\u5360\u7528"],
        gx_power: ["GPU power", "\u0637\u0627\u0642\u0629 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A", "GPU g\xFCc\xFC", "Consumo de GPU", "\u041C\u043E\u0449\u043D\u043E\u0441\u0442\u044C \u0413\u041F", "GPU \u529F\u8017"],
        gx_ping: ["Ping", "Ping", "Ping", "Ping", "\u041F\u0438\u043D\u0433", "Ping"],
        gx_clock: ["Clock", "\u0627\u0644\u0633\u0627\u0639\u0629", "Saat", "Reloj", "\u0427\u0430\u0441\u044B", "\u65F6\u949F"],
        gx_time: ["Play time", "\u0645\u062F\u0629 \u0627\u0644\u0644\u0639\u0628", "Oyun s\xFCresi", "Tiempo de juego", "\u0412\u0440\u0435\u043C\u044F \u0438\u0433\u0440\u044B", "\u6E38\u620F\u65F6\u957F"],
        gx_battery: ["Battery (laptops)", "\u0627\u0644\u0628\u0637\u0627\u0631\u064A\u0629 (\u0644\u0644\u062D\u0627\u0633\u0648\u0628 \u0627\u0644\u0645\u062D\u0645\u0648\u0644)", "Pil (diz\xFCst\xFC)", "Bater\xEDa (port\xE1tiles)", "\u0411\u0430\u0442\u0430\u0440\u0435\u044F (\u043D\u043E\u0443\u0442\u0431\u0443\u043A\u0438)", "\u7535\u6C60\uFF08\u7B14\u8BB0\u672C\uFF09"],
        gmHotkey: ["Show/hide shortcut", "\u0627\u062E\u062A\u0635\u0627\u0631 \u0627\u0644\u0625\u0638\u0647\u0627\u0631/\u0627\u0644\u0625\u062E\u0641\u0627\u0621", "G\xF6ster/gizle k\u0131sayolu", "Atajo mostrar/ocultar", "\u0421\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435 \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C/\u0441\u043A\u0440\u044B\u0442\u044C", "\u663E\u793A/\u9690\u85CF\u5FEB\u6377\u952E"],
        gmNoHotkey: ["No shortcut", "\u0628\u0644\u0627 \u0627\u062E\u062A\u0635\u0627\u0631", "K\u0131sayol yok", "Sin atajo", "\u0411\u0435\u0437 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u044F", "\u65E0\u5FEB\u6377\u952E"],
        gmPingHost: ["Ping server", "\u062E\u0627\u062F\u0645 Ping", "Ping sunucusu", "Servidor de ping", "\u0421\u0435\u0440\u0432\u0435\u0440 \u0434\u043B\u044F \u043F\u0438\u043D\u0433\u0430", "Ping \u670D\u52A1\u5668"],
        gmPingHint: ["Address or IP; e.g. the game server", "\u0639\u0646\u0648\u0627\u0646 \u0623\u0648 IP\u061B \u0645\u062B\u0644 \u062E\u0627\u062F\u0645 \u0627\u0644\u0644\u0639\u0628\u0629", "Adres veya IP; \xF6r. oyun sunucusu", "Direcci\xF3n o IP; p. ej. el servidor del juego", "\u0410\u0434\u0440\u0435\u0441 \u0438\u043B\u0438 IP, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u0441\u0435\u0440\u0432\u0435\u0440 \u0438\u0433\u0440\u044B", "\u5730\u5740\u6216 IP\uFF0C\u4F8B\u5982\u6E38\u620F\u670D\u52A1\u5668"],
        gmBarHint: ["Nothing can be drawn over a game in exclusive fullscreen; choose borderless or windowed in the game\u2019s settings.", "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0639\u0631\u0636 \u0623\u064A \u0634\u064A\u0621 \u0641\u0648\u0642 \u0644\u0639\u0628\u0629 \u0628\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629 \u0627\u0644\u062D\u0635\u0631\u064A\u061B \u0627\u062E\u062A\u0631 \u0648\u0636\u0639 \u0628\u0644\u0627 \u062D\u062F\u0648\u062F \u0623\u0648 \u0646\u0627\u0641\u0630\u0629 \u0641\u064A \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0644\u0639\u0628\u0629.", "\xD6zel tam ekrandaki bir oyunun \xFCst\xFCnde hi\xE7bir \u015Fey g\xF6r\xFCnmez; oyun ayarlar\u0131nda kenarl\u0131ks\u0131z veya pencereli se\xE7in.", "No se puede dibujar sobre un juego en pantalla completa exclusiva; elige sin bordes o ventana en el juego.", "\u041F\u043E\u0432\u0435\u0440\u0445 \u0438\u0433\u0440\u044B \u0432 \u044D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u043E\u043C \u043F\u043E\u043B\u043D\u043E\u044D\u043A\u0440\u0430\u043D\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0432\u0438\u0434\u043D\u043E; \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \xAB\u0431\u0435\u0437 \u0440\u0430\u043C\u043A\u0438\xBB \u0438\u043B\u0438 \xAB\u0432 \u043E\u043A\u043D\u0435\xBB.", "\u72EC\u5360\u5168\u5C4F\u7684\u6E38\u620F\u4E0A\u65E0\u6CD5\u663E\u793A\u4EFB\u4F55\u7A97\u53E3\uFF1B\u8BF7\u5728\u6E38\u620F\u8BBE\u7F6E\u4E2D\u9009\u62E9\u65E0\u8FB9\u6846\u6216\u7A97\u53E3\u6A21\u5F0F\u3002"],
        gmOptSection: ["What Optimize does", "\u0645\u0627\u0630\u0627 \u064A\u0641\u0639\u0644 \u0627\u0644\u062A\u062D\u0633\u064A\u0646", "Optimize ne yapar", "Qu\xE9 hace Optimizar", "\u0427\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u043E\u043F\u0442\u0438\u043C\u0438\u0437\u0430\u0446\u0438\u044F", "\u4F18\u5316\u4F1A\u505A\u4EC0\u4E48"],
        gmOptPowerHint: ["Reversible; laptops with only Balanced get the \u201CBest performance\u201D power mode", "\u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u0631\u0627\u062C\u0639\u061B \u0627\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u062A\u064A \u0644\u062F\u064A\u0647\u0627 \xAB\u0645\u062A\u0648\u0627\u0632\u0646\xBB \u0641\u0642\u0637 \u062A\u062D\u0635\u0644 \u0639\u0644\u0649 \u0648\u0636\u0639 \xAB\u0623\u0641\u0636\u0644 \u0623\u062F\u0627\u0621\xBB", "Geri al\u0131nabilir; yaln\u0131zca Dengeli olan diz\xFCst\xFCler \u201CEn iyi performans\u201D moduna ge\xE7er", "Reversible; los port\xE1tiles con solo Equilibrado usan \u201CM\xE1ximo rendimiento\u201D", "\u041E\u0431\u0440\u0430\u0442\u0438\u043C\u043E; \u043D\u0430 \u043D\u043E\u0443\u0442\u0431\u0443\u043A\u0430\u0445 \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u043E \xAB\u0421\u0431\u0430\u043B\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0439\xBB \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F \u0440\u0435\u0436\u0438\u043C \xAB\u041C\u0430\u043A\u0441. \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C\xBB", "\u53EF\u64A4\u9500\uFF1B\u53EA\u6709\u201C\u5E73\u8861\u201D\u8BA1\u5212\u7684\u7B14\u8BB0\u672C\u4F1A\u5207\u6362\u5230\u201C\u6700\u4F73\u6027\u80FD\u201D\u6A21\u5F0F"],
        gmOptMemHint: ["Trims idle background apps; helps most on PCs with little RAM", "\u064A\u0642\u0644\u0651\u0635 \u0630\u0627\u0643\u0631\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u062E\u0627\u0645\u0644\u0629\u061B \u064A\u0641\u064A\u062F \u0623\u0643\u062B\u0631 \u0645\u0639 \u0630\u0627\u0643\u0631\u0629 \u0642\u0644\u064A\u0644\u0629", "Bo\u015Ftaki arka plan uygulamalar\u0131n\u0131 k\u0131rpar; az belle\u011Fi olan PC\u2019lerde daha etkilidir", "Recorta apps inactivas; ayuda m\xE1s con poca RAM", "\u0421\u0436\u0438\u043C\u0430\u0435\u0442 \u043F\u0430\u043C\u044F\u0442\u044C \u043F\u0440\u043E\u0441\u0442\u0430\u0438\u0432\u0430\u044E\u0449\u0438\u0445 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0439; \u043F\u043E\u043B\u0435\u0437\u043D\u0435\u0435 \u043F\u0440\u0438 \u043C\u0430\u043B\u043E\u043C \u043E\u0431\u044A\u0451\u043C\u0435 \u041E\u0417\u0423", "\u538B\u7F29\u540E\u53F0\u95F2\u7F6E\u5E94\u7528\u7684\u5185\u5B58\uFF1B\u5185\u5B58\u5C0F\u7684\u7535\u8111\u6548\u679C\u66F4\u660E\u663E"],
        gmPrioNormal: ["Normal", "\u0639\u0627\u062F\u064A\u0629", "Normal", "Normal", "\u041E\u0431\u044B\u0447\u043D\u044B\u0439", "\u6B63\u5E38"],
        gmPrioAbove: ["Above normal", "\u0641\u0648\u0642 \u0627\u0644\u0639\u0627\u062F\u064A\u0629", "Normalin \xFCst\xFCnde", "Superior a normal", "\u0412\u044B\u0448\u0435 \u0441\u0440\u0435\u0434\u043D\u0435\u0433\u043E", "\u9AD8\u4E8E\u6B63\u5E38"],
        gmPrioHigh: ["High", "\u0639\u0627\u0644\u064A\u0629", "Y\xFCksek", "Alta", "\u0412\u044B\u0441\u043E\u043A\u0438\u0439", "\u9AD8"],
        gmCloseList: ["Apps to close", "\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0625\u063A\u0644\u0627\u0642\u0647\u0627", "Kapat\u0131lacak uygulamalar", "Apps que se cerrar\xE1n", "\u041A\u0430\u043A\u0438\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0442\u044C", "\u8981\u5173\u95ED\u7684\u5E94\u7528"],
        gmCloseEmpty: ["No apps chosen yet", "\u0644\u0645 \u064A\u062A\u0645 \u0627\u062E\u062A\u064A\u0627\u0631 \u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0628\u0639\u062F", "Hen\xFCz uygulama se\xE7ilmedi", "A\xFAn no hay apps elegidas", "\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D\u044B", "\u5C1A\u672A\u9009\u62E9\u5E94\u7528"],
        gmRunning: ["Running apps", "\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0644\u0629", "\xC7al\u0131\u015Fan uygulamalar", "Apps en ejecuci\xF3n", "\u0417\u0430\u043F\u0443\u0449\u0435\u043D\u043D\u044B\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F", "\u6B63\u5728\u8FD0\u884C\u7684\u5E94\u7528"],
        gmForce: ["Force-close apps that don\u2019t respond", "\u0641\u0631\u0636 \u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0627\u0644\u062A\u064A \u0644\u0627 \u062A\u0633\u062A\u062C\u064A\u0628", "Yan\u0131t vermeyenleri zorla kapat", "Forzar el cierre si no responden", "\u041F\u0440\u0438\u043D\u0443\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u0437\u0430\u0432\u0438\u0441\u0448\u0438\u0435", "\u5F3A\u5236\u5173\u95ED\u65E0\u54CD\u5E94\u7684\u5E94\u7528"],
        gmReopen: ["Reopen them after the game", "\u0625\u0639\u0627\u062F\u0629 \u0641\u062A\u062D\u0647\u0627 \u0628\u0639\u062F \u0627\u0644\u0644\u0639\u0628\u0629", "Oyundan sonra yeniden a\xE7", "Volver a abrirlas tras el juego", "\u0421\u043D\u043E\u0432\u0430 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0442\u044C \u043F\u043E\u0441\u043B\u0435 \u0438\u0433\u0440\u044B", "\u6E38\u620F\u540E\u91CD\u65B0\u6253\u5F00"],
        gmOptDvr: ["Turn off Xbox Game Bar background recording", "\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0641\u064A \u0627\u0644\u062E\u0644\u0641\u064A\u0629 \u0644\u0640 Xbox Game Bar", "Xbox Game Bar arka plan kayd\u0131n\u0131 kapat", "Desactivar la grabaci\xF3n en segundo plano de Xbox Game Bar", "\u041E\u0442\u043A\u043B\u044E\u0447\u0430\u0442\u044C \u0444\u043E\u043D\u043E\u0432\u0443\u044E \u0437\u0430\u043F\u0438\u0441\u044C Xbox Game Bar", "\u5173\u95ED Xbox Game Bar \u540E\u53F0\u5F55\u5236"],
        gmGames: ["My games", "\u0623\u0644\u0639\u0627\u0628\u064A", "Oyunlar\u0131m", "Mis juegos", "\u041C\u043E\u0438 \u0438\u0433\u0440\u044B", "\u6211\u7684\u6E38\u620F"],
        gmGamesHint: ["Always treated as games (exe name)", "\u062A\u064F\u0639\u0627\u0645\u0644 \u062F\u0627\u0626\u0645\u064B\u0627 \u0643\u0623\u0644\u0639\u0627\u0628 (\u0627\u0633\u0645 \u0645\u0644\u0641 exe)", "Her zaman oyun say\u0131l\u0131r (exe ad\u0131)", "Siempre se tratan como juegos (nombre del exe)", "\u0412\u0441\u0435\u0433\u0434\u0430 \u0441\u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u0438\u0433\u0440\u0430\u043C\u0438 (\u0438\u043C\u044F exe)", "\u59CB\u7EC8\u89C6\u4E3A\u6E38\u620F\uFF08exe \u540D\u79F0\uFF09"],
        gmIgnore: ["Never treat as games", "\u0644\u0627 \u062A\u064F\u0639\u0627\u0645\u0644 \u0643\u0623\u0644\u0639\u0627\u0628 \u0623\u0628\u062F\u064B\u0627", "Asla oyun sayma", "No tratar nunca como juegos", "\u041D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u0441\u0447\u0438\u0442\u0430\u0442\u044C \u0438\u0433\u0440\u0430\u043C\u0438", "\u6C38\u4E0D\u89C6\u4E3A\u6E38\u620F"],
        gmExeName: ["exe name", "\u0627\u0633\u0645 \u0645\u0644\u0641 exe", "exe ad\u0131", "nombre del exe", "\u0438\u043C\u044F exe", "exe \u540D\u79F0"],
        gmSensors: ["Counters and sensors", "\u0627\u0644\u0639\u062F\u0627\u062F\u0627\u062A \u0648\u0627\u0644\u0645\u0633\u062A\u0634\u0639\u0631\u0627\u062A", "Saya\xE7lar ve sens\xF6rler", "Contadores y sensores", "\u0421\u0447\u0451\u0442\u0447\u0438\u043A\u0438 \u0438 \u0434\u0430\u0442\u0447\u0438\u043A\u0438", "\u8BA1\u6570\u4E0E\u4F20\u611F\u5668"],
        gmFpsCounter: ["FPS counter", "\u0639\u062F\u0651\u0627\u062F FPS", "FPS sayac\u0131", "Contador de FPS", "\u0421\u0447\u0451\u0442\u0447\u0438\u043A FPS", "FPS \u8BA1\u6570"],
        gmEtwOk: ["Active", "\u0646\u0634\u0637", "Etkin", "Activo", "\u0420\u0430\u0431\u043E\u0442\u0430\u0435\u0442", "\u8FD0\u884C\u4E2D"],
        gmEtwDenied: ["Needs permission", "\u064A\u062D\u062A\u0627\u062C \u0625\u0630\u0646\u064B\u0627", "\u0130zin gerekli", "Necesita permiso", "\u041D\u0443\u0436\u043D\u043E \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435", "\u9700\u8981\u6743\u9650"],
        gmEtwRtss: ["Read from RivaTuner", "\u064A\u064F\u0642\u0631\u0623 \u0645\u0646 RivaTuner", "RivaTuner\u2019dan okunuyor", "Le\xEDdo de RivaTuner", "\u0411\u0435\u0440\u0451\u0442\u0441\u044F \u0438\u0437 RivaTuner", "\u4ECE RivaTuner \u8BFB\u53D6"],
        gmEtwOff: ["Off", "\u0645\u062A\u0648\u0642\u0641", "Kapal\u0131", "Desactivado", "\u0412\u044B\u043A\u043B\u044E\u0447\u0435\u043D", "\u5173\u95ED"],
        gmEtwError: ["Error", "\u062E\u0637\u0623", "Hata", "Error", "\u041E\u0448\u0438\u0431\u043A\u0430", "\u9519\u8BEF"],
        gmAllowHint: ["One administrator prompt adds your Windows account to the \u201CPerformance Log Users\u201D group; then sign out and back in once. Alternatively, run RivaTuner (comes with MSI Afterburner).", "\u0628\u0645\u0648\u0627\u0641\u0642\u0629 \u0645\u0633\u0624\u0648\u0644 \u0648\u0627\u062D\u062F\u0629 \u064A\u064F\u0636\u0627\u0641 \u062D\u0633\u0627\u0628\u0643 \u0625\u0644\u0649 \u0645\u062C\u0645\u0648\u0639\u0629 \xABPerformance Log Users\xBB\u061B \u062B\u0645 \u0633\u062C\u0651\u0644 \u0627\u0644\u062E\u0631\u0648\u062C \u0648\u0627\u0644\u062F\u062E\u0648\u0644 \u0645\u0631\u0629. \u0623\u0648 \u0634\u063A\u0651\u0644 RivaTuner (\u0645\u0639 MSI Afterburner).", "Tek bir y\xF6netici onay\u0131yla hesab\u0131n\u0131z \u201CPerformance Log Users\u201D grubuna eklenir; sonra bir kez \xE7\u0131k\u0131\u015F yap\u0131p girin. Ya da RivaTuner\u2019\u0131 (MSI Afterburner ile gelir) \xE7al\u0131\u015Ft\u0131r\u0131n.", "Con una confirmaci\xF3n de administrador tu cuenta entra en el grupo \u201CPerformance Log Users\u201D; luego cierra sesi\xF3n y vuelve a entrar. O ejecuta RivaTuner (viene con MSI Afterburner).", "\u041E\u0434\u043D\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0434\u043E\u0431\u0430\u0432\u0438\u0442 \u0443\u0447\u0451\u0442\u043D\u0443\u044E \u0437\u0430\u043F\u0438\u0441\u044C \u0432 \u0433\u0440\u0443\u043F\u043F\u0443 \xABPerformance Log Users\xBB; \u0437\u0430\u0442\u0435\u043C \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u0432\u044B\u0439\u0434\u0438\u0442\u0435 \u0438 \u0432\u043E\u0439\u0434\u0438\u0442\u0435. \u0418\u043B\u0438 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 RivaTuner (\u0438\u0434\u0451\u0442 \u0441 MSI Afterburner).", "\u4E00\u6B21\u7BA1\u7406\u5458\u786E\u8BA4\u5373\u53EF\u628A\u4F60\u7684\u8D26\u6237\u52A0\u5165\u201CPerformance Log Users\u201D\u7EC4\uFF0C\u7136\u540E\u6CE8\u9500\u5E76\u91CD\u65B0\u767B\u5F55\u4E00\u6B21\u3002\u6216\u8FD0\u884C RivaTuner\uFF08\u968F MSI Afterburner \u5B89\u88C5\uFF09\u3002"],
        gmCpuTemp: ["CPU temperature", "\u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062C", "\u0130\u015Flemci s\u0131cakl\u0131\u011F\u0131", "Temperatura de CPU", "\u0422\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u0426\u041F", "CPU \u6E29\u5EA6"],
        gmGpuTemp: ["GPU temperature", "\u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u0631\u0633\u0648\u0645\u064A\u0627\u062A", "GPU s\u0131cakl\u0131\u011F\u0131", "Temperatura de GPU", "\u0422\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430 \u0413\u041F", "GPU \u6E29\u5EA6"],
        gmFrom: ["from {src}", "\u0645\u0646 {src}", "{src} kayna\u011F\u0131ndan", "de {src}", "\u0438\u0437 {src}", "\u6765\u81EA {src}"],
        gmNotFound: ["not found", "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", "bulunamad\u0131", "no encontrado", "\u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E", "\u672A\u627E\u5230"],
        gmApprox: ["approximate (ACPI)", "\u062A\u0642\u0631\u064A\u0628\u064A\u0629 (ACPI)", "yakla\u015F\u0131k (ACPI)", "aproximada (ACPI)", "\u043F\u0440\u0438\u0431\u043B\u0438\u0437\u0438\u0442\u0435\u043B\u044C\u043D\u043E (ACPI)", "\u8FD1\u4F3C\u503C\uFF08ACPI\uFF09"],
        gmTempHint: ["Windows doesn\u2019t expose the real CPU temperature without a driver. Run LibreHardwareMonitor or HWiNFO (with Shared Memory on) and it shows up here and on the bar.", "\u0644\u0627 \u064A\u0639\u0631\u0636 \u0648\u064A\u0646\u062F\u0648\u0632 \u062D\u0631\u0627\u0631\u0629 \u0627\u0644\u0645\u0639\u0627\u0644\u062C \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629 \u062F\u0648\u0646 \u062A\u0639\u0631\u064A\u0641. \u0634\u063A\u0651\u0644 LibreHardwareMonitor \u0623\u0648 HWiNFO (\u0645\u0639 Shared Memory) \u0644\u062A\u0638\u0647\u0631 \u0647\u0646\u0627 \u0648\u0639\u0644\u0649 \u0627\u0644\u0634\u0631\u064A\u0637.", "Windows ger\xE7ek i\u015Flemci s\u0131cakl\u0131\u011F\u0131n\u0131 s\xFCr\xFCc\xFC olmadan vermez. LibreHardwareMonitor veya HWiNFO\u2019yu (Shared Memory a\xE7\u0131k) \xE7al\u0131\u015Ft\u0131r\u0131n; burada ve \xE7ubukta g\xF6r\xFCn\xFCr.", "Windows no muestra la temperatura real de la CPU sin un controlador. Ejecuta LibreHardwareMonitor o HWiNFO (con Shared Memory) y aparecer\xE1 aqu\xED y en la barra.", "Windows \u043D\u0435 \u043E\u0442\u0434\u0430\u0451\u0442 \u0440\u0435\u0430\u043B\u044C\u043D\u0443\u044E \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0443 \u0426\u041F \u0431\u0435\u0437 \u0434\u0440\u0430\u0439\u0432\u0435\u0440\u0430. \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 LibreHardwareMonitor \u0438\u043B\u0438 HWiNFO (\u0441 Shared Memory) \u2014 \u0438 \u043E\u043D\u0430 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C \u0438 \u043D\u0430 \u043F\u043E\u043B\u043E\u0441\u0435.", "Windows \u4E0D\u501F\u52A9\u9A71\u52A8\u65E0\u6CD5\u63D0\u4F9B\u771F\u5B9E\u7684 CPU \u6E29\u5EA6\u3002\u8FD0\u884C LibreHardwareMonitor \u6216 HWiNFO\uFF08\u5F00\u542F Shared Memory\uFF09\u540E\u5373\u53EF\u5728\u6B64\u548C\u60AC\u6D6E\u6761\u4E0A\u663E\u793A\u3002"],
        gmGetLhm: ["Get LibreHardwareMonitor", "\u062A\u0646\u0632\u064A\u0644 LibreHardwareMonitor", "LibreHardwareMonitor\u2019u indir", "Descargar LibreHardwareMonitor", "\u0421\u043A\u0430\u0447\u0430\u0442\u044C LibreHardwareMonitor", "\u83B7\u53D6 LibreHardwareMonitor"],
        gmSessions: ["Recent sessions", "\u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0623\u062E\u064A\u0631\u0629", "Son oturumlar", "Sesiones recientes", "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0441\u0435\u0430\u043D\u0441\u044B", "\u6700\u8FD1\u7684\u6E38\u620F"],
        gmEverywhere: ["Everything is reversible and applies to this Windows account only.", "\u0643\u0644 \u0634\u064A\u0621 \u0642\u0627\u0628\u0644 \u0644\u0644\u062A\u0631\u0627\u062C\u0639 \u0648\u064A\u0637\u0628\u0651\u0642 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628 \u0641\u0642\u0637.", "Her \u015Fey geri al\u0131nabilir ve yaln\u0131zca bu hesaba uygulan\u0131r.", "Todo es reversible y solo afecta a esta cuenta.", "\u0412\u0441\u0451 \u043E\u0431\u0440\u0430\u0442\u0438\u043C\u043E \u0438 \u043A\u0430\u0441\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u044D\u0442\u043E\u0439 \u0443\u0447\u0451\u0442\u043D\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438.", "\u6240\u6709\u66F4\u6539\u5747\u53EF\u64A4\u9500\uFF0C\u4E14\u53EA\u5F71\u54CD\u5F53\u524D\u8D26\u6237\u3002"]
      };
      function strings2(lang) {
        const i = Math.max(0, ORDER.indexOf(lang));
        const en = ORDER.indexOf("en");
        const out = {};
        for (const [k, arr] of Object.entries(T)) out[k] = arr[i] || arr[en];
        return out;
      }
      function langInfo2(lang) {
        return LANGS2.find((l) => l.code === lang) || LANGS2[0];
      }
      module.exports = { LANGS: LANGS2, strings: strings2, langInfo: langInfo2 };
    }
  });

  // src/renderer/island/spring.js
  var SPRINGS = {
    expand: { stiffness: 250, damping: 21, mass: 1 },
    // bouncy grow (damping ratio ~0.66)
    collapse: { stiffness: 330, damping: 30, mass: 1 },
    // quick, nearly critical shrink
    bubble: { stiffness: 210, damping: 17, mass: 1 },
    // liquid split
    snappy: { stiffness: 520, damping: 36, mass: 1 },
    soft: { stiffness: 140, damping: 20, mass: 1 }
  };
  var Spring = class {
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
    impulse(v) {
      this.velocity += v;
    }
    step(dt) {
      const h2 = 1 / 240;
      let t = Math.min(dt, 0.064);
      while (t > 1e-6) {
        const s = Math.min(h2, t);
        const f = -this.k * (this.value - this.target) - this.c * this.velocity;
        this.velocity += f / this.m * s;
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
  };
  var Animator = class {
    constructor(onFrame2) {
      this.onFrame = onFrame2;
      this.springs = /* @__PURE__ */ new Set();
      this.keepAlive = /* @__PURE__ */ new Set();
      this.running = false;
      this.last = 0;
      this.tick = this.tick.bind(this);
    }
    add(...springs) {
      springs.forEach((s) => this.springs.add(s));
    }
    hold(key) {
      this.keepAlive.add(key);
      this.kick();
    }
    release(key) {
      this.keepAlive.delete(key);
    }
    kick() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.tick);
    }
    tick(now) {
      const dt = Math.max(0, (now - this.last) / 1e3);
      this.last = now;
      let moving = false;
      for (const s of this.springs) {
        if (!s.resting) {
          s.step(dt);
          moving = true;
        }
      }
      this.onFrame(dt, now);
      if (moving || this.keepAlive.size > 0) requestAnimationFrame(this.tick);
      else this.running = false;
    }
  };

  // src/renderer/island/icons.js
  var ICONS = {
    "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /> <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /> <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />',
    "info": '<circle cx="12" cy="12" r="10" /> <path d="M12 16v-4" /> <path d="M12 8h.01" />',
    "library": '<path d="m16 6 4 14" /> <path d="M12 6v14" /> <path d="M8 8v12" /> <path d="M4 4v16" />',
    "circle-dashed": '<path d="M10.1 2.182a10 10 0 0 1 3.8 0" /> <path d="M13.9 21.818a10 10 0 0 1-3.8 0" /> <path d="M17.609 3.721a10 10 0 0 1 2.69 2.7" /> <path d="M2.182 13.9a10 10 0 0 1 0-3.8" /> <path d="M20.279 17.609a10 10 0 0 1-2.7 2.69" /> <path d="M21.818 10.1a10 10 0 0 1 0 3.8" /> <path d="M3.721 6.391a10 10 0 0 1 2.7-2.69" /> <path d="M6.391 20.279a10 10 0 0 1-2.69-2.7" />',
    "trophy": '<path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" /> <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" /> <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" /> <path d="M4 22h16" /> <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" /> <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />',
    "gamepad-2": '<line x1="6" x2="10" y1="11" y2="11" /> <line x1="8" x2="8" y1="9" y2="13" /> <line x1="15" x2="15.01" y1="12" y2="12" /> <line x1="18" x2="18.01" y1="10" y2="10" /> <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />',
    "history": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" /> <path d="M12 7v5l4 2" />',
    "clock": '<circle cx="12" cy="12" r="10" /> <path d="M12 6v6l4 2" />',
    "flame": '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />',
    "circle-gauge": '<path d="M15.6 2.7a10 10 0 1 0 5.7 5.7" /> <circle cx="12" cy="12" r="2" /> <path d="M13.4 10.6 19 5" />',
    "ear": '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" /> <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />',
    "captions": '<rect width="18" height="14" x="3" y="5" rx="2" ry="2" /> <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />',
    "pencil": '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /> <path d="m15 5 4 4" />',
    "mouse-pointer-2": '<path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />',
    "terminal": '<path d="M12 19h8" /> <path d="m4 17 6-6-6-6" />',
    "bluetooth": '<path d="m7 7 10 10-5 5V2l5 5L7 17" />',
    "camera": '<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" /> <circle cx="12" cy="13" r="3" />',
    "file-down": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M12 18v-6" /> <path d="m9 15 3 3 3-3" />',
    "triangle-alert": '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />',
    "power": '<path d="M12 2v10" /> <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />',
    "file-up": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M12 12v6" /> <path d="m15 15-3-3-3 3" />',
    "list-checks": '<path d="M13 5h8" /> <path d="M13 12h8" /> <path d="M13 19h8" /> <path d="m3 17 2 2 4-4" /> <path d="m3 7 2 2 4-4" />',
    "trending-up": '<path d="M16 7h6v6" /> <path d="m22 7-8.5 8.5-5-5L2 17" />',
    "coins": '<path d="M13.744 17.736a6 6 0 1 1-7.48-7.48" /> <path d="M15 6h1v4" /> <path d="m6.134 14.768.866-.5 2 3.464" /> <circle cx="16" cy="8" r="6" />',
    "rss": '<path d="M4 11a9 9 0 0 1 9 9" /> <path d="M4 4a16 16 0 0 1 16 16" /> <circle cx="5" cy="19" r="1" />',
    "calendar-days": '<path d="M8 2v3" /> <path d="M16 2v3" /> <rect x="3" y="3" width="18" height="18" rx="2" /> <path d="M3 9h18" /> <path d="M8 13h.01" /> <path d="M12 13h.01" /> <path d="M16 13h.01" /> <path d="M8 17h.01" /> <path d="M12 17h.01" /> <path d="M16 17h.01" />',
    "calendar-check": '<path d="M8 2v3" /> <path d="M16 2v3" /> <rect x="3" y="3" width="18" height="18" rx="2" /> <path d="M3 9h18" /> <path d="m9 15 2 2 4-4" />',
    "wifi-off": '<path d="M12 20h.01" /> <path d="M8.5 16.429a5 5 0 0 1 7 0" /> <path d="M5 12.859a10 10 0 0 1 5.17-2.69" /> <path d="M19 12.859a10 10 0 0 0-2.007-1.523" /> <path d="M2 8.82a15 15 0 0 1 4.177-2.643" /> <path d="M22 8.82a15 15 0 0 0-11.288-3.764" /> <path d="m2 2 20 20" />',
    "loader": '<path d="M21 12a9 9 0 1 1-6.219-8.56" />',
    "newspaper": '<path d="M15 18h-5" /> <path d="M18 14h-8" /> <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" /> <rect width="8" height="4" x="10" y="6" rx="1" />',
    "bitcoin": '<path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727" />',
    "play": '<path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />',
    "pause": '<rect x="14" y="3" width="5" height="18" rx="1" /> <rect x="5" y="3" width="5" height="18" rx="1" />',
    "skip-forward": '<path d="M21 4v16" /> <path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z" />',
    "skip-back": '<path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z" /> <path d="M3 20V4" />',
    "phone": '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />',
    "phone-off": '<path d="M10.1 13.9a14 14 0 0 0 3.732 2.668 1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2 18 18 0 0 1-12.728-5.272" /> <path d="M22 2 2 22" /> <path d="M4.76 13.582A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 .244.473" />',
    "phone-incoming": '<path d="M16 2v6h6" /> <path d="m22 2-6 6" /> <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />',
    "phone-missed": '<path d="m16 2 6 6" /> <path d="m22 2-6 6" /> <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />',
    "message-circle": '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />',
    "bell": '<path d="M10.268 21a2 2 0 0 0 3.464 0" /> <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />',
    "bell-ring": '<path d="M10.268 21a2 2 0 0 0 3.464 0" /> <path d="M22 8c0-2.3-.8-4.3-2-6" /> <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /> <path d="M4 2C2.8 3.7 2 5.7 2 8" />',
    "bell-off": '<path d="M10.268 21a2 2 0 0 0 3.464 0" /> <path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742" /> <path d="m2 2 20 20" /> <path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05" />',
    "volume": '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />',
    "volume-1": '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /> <path d="M16 9a5 5 0 0 1 0 6" />',
    "volume-2": '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /> <path d="M16 9a5 5 0 0 1 0 6" /> <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />',
    "volume-x": '<path d="M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z" /> <path d="m16.5 14.5 5-5" /> <path d="m16.5 9.5 5 5" />',
    "battery-charging": '<path d="m11 7-3 5h4l-3 5" /> <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935" /> <path d="M22 14v-4" /> <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936" />',
    "battery": '<path d="M 22 14 L 22 10" /> <rect x="2" y="6" width="16" height="12" rx="2" />',
    "battery-low": '<path d="M22 14v-4" /> <path d="M6 14v-4" /> <rect x="2" y="6" width="16" height="12" rx="2" />',
    "battery-full": '<path d="M10 10v4" /> <path d="M14 10v4" /> <path d="M22 14v-4" /> <path d="M6 10v4" /> <rect x="2" y="6" width="16" height="12" rx="2" />',
    "battery-medium": '<path d="M10 14v-4" /> <path d="M22 14v-4" /> <path d="M6 14v-4" /> <rect x="2" y="6" width="16" height="12" rx="2" />',
    "zap": '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" />',
    "lock": '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    "clipboard": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1" /> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />',
    "clipboard-check": '<rect width="8" height="4" x="8" y="2" rx="1" ry="1" /> <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /> <path d="m9 14 2 2 4-4" />',
    "timer": '<line x1="10" x2="14" y1="2" y2="2" /> <line x1="12" x2="15" y1="14" y2="11" /> <circle cx="12" cy="14" r="8" />',
    "hourglass": '<path d="M5 22h14" /> <path d="M5 2h14" /> <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /> <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />',
    "alarm-clock": '<circle cx="12" cy="13" r="8" /> <path d="M12 9v4l2 2" /> <path d="M5 3 2 6" /> <path d="m22 6-3-3" /> <path d="M6.38 18.7 4 21" /> <path d="M17.64 18.67 20 21" />',
    "square": '<rect width="18" height="18" x="3" y="3" rx="2" />',
    "plus": '<path d="M5 12h14" /> <path d="M12 5v14" />',
    "x": '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
    "house": '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
    "inbox": '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /> <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />',
    "folder": '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />',
    "file": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" />',
    "image": '<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /> <circle cx="9" cy="9" r="2" /> <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />',
    "copy": '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /> <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
    "cpu": '<path d="M12 20v2" /> <path d="M12 2v2" /> <path d="M17 20v2" /> <path d="M17 2v2" /> <path d="M2 12h2" /> <path d="M2 17h2" /> <path d="M2 7h2" /> <path d="M20 12h2" /> <path d="M20 17h2" /> <path d="M20 7h2" /> <path d="M7 20v2" /> <path d="M7 2v2" /> <rect x="4" y="4" width="16" height="16" rx="2" /> <rect x="8" y="8" width="8" height="8" rx="1" />',
    "memory-stick": '<path d="M12 12v-2" /> <path d="M12 18v-2" /> <path d="M16 12v-2" /> <path d="M16 18v-2" /> <path d="M2 11h1.5" /> <path d="M20 18v-2" /> <path d="M20.5 11H22" /> <path d="M4 18v-2" /> <path d="M8 12v-2" /> <path d="M8 18v-2" /> <rect x="2" y="6" width="20" height="10" rx="2" />',
    "gauge": '<path d="m12 14 4-4" /> <path d="M3.34 19a10 10 0 1 1 17.32 0" />',
    "wifi": '<path d="M12 20h.01" /> <path d="M2 8.82a15 15 0 0 1 20 0" /> <path d="M5 12.859a10 10 0 0 1 14 0" /> <path d="M8.5 16.429a5 5 0 0 1 7 0" />',
    "arrow-down": '<path d="M12 5v14" /> <path d="m19 12-7 7-7-7" />',
    "arrow-up": '<path d="m5 12 7-7 7 7" /> <path d="M12 19V5" />',
    "scan": '<path d="M3 7V5a2 2 0 0 1 2-2h2" /> <path d="M17 3h2a2 2 0 0 1 2 2v2" /> <path d="M21 17v2a2 2 0 0 1-2 2h-2" /> <path d="M7 21H5a2 2 0 0 1-2-2v-2" />',
    "smartphone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2" /> <path d="M12 18h.01" />',
    "calculator": '<rect width="16" height="20" x="4" y="2" rx="2" /> <line x1="8" x2="16" y1="6" y2="6" /> <line x1="16" x2="16" y1="14" y2="18" /> <path d="M16 10h.01" /> <path d="M12 10h.01" /> <path d="M8 10h.01" /> <path d="M12 14h.01" /> <path d="M8 14h.01" /> <path d="M12 18h.01" /> <path d="M8 18h.01" />',
    "settings": '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" /> <circle cx="12" cy="12" r="3" />',
    "mic": '<path d="M12 19v3" /> <path d="M19 10v2a7 7 0 0 1-14 0v-2" /> <rect x="9" y="2" width="6" height="13" rx="3" />',
    "video": '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /> <rect x="2" y="6" width="14" height="12" rx="2" />',
    "map-pin": '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /> <circle cx="12" cy="10" r="3" />',
    "pin": '<path d="M12 17v5" /> <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />',
    "pin-off": '<path d="M12 17v5" /> <path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" /> <path d="m2 2 20 20" /> <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" />',
    "trash-2": '<path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
    "external-link": '<path d="M15 3h6v6" /> <path d="M10 14 21 3" /> <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />',
    "send": '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /> <path d="m21.854 2.147-10.94 10.939" />',
    "reply": '<path d="M20 18v-2a4 4 0 0 0-4-4H4" /> <path d="m9 17-5-5 5-5" />',
    "arrow-big-up": '<path d="M9 19a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-6a1 1 0 0 1 1-1h3.293a.707.707 0 0 0 .5-1.207l-7.086-7.086a1 1 0 0 0-1.414 0l-7.086 7.086a.707.707 0 0 0 .5 1.207H8a1 1 0 0 1 1 1z" />',
    "keyboard": '<path d="M10 8h.01" /> <path d="M12 12h.01" /> <path d="M14 8h.01" /> <path d="M16 12h.01" /> <path d="M18 8h.01" /> <path d="M6 8h.01" /> <path d="M7 16h10" /> <path d="M8 12h.01" /> <rect width="20" height="16" x="2" y="4" rx="2" />',
    "monitor": '<rect width="20" height="14" x="2" y="3" rx="2" /> <line x1="8" x2="16" y1="21" y2="21" /> <line x1="12" x2="12" y1="17" y2="21" />',
    "rotate-ccw": '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /> <path d="M3 3v5h5" />',
    "music": '<path d="M21 16V3a1 1 0 0 0-1.28-.96l-10 2.917a1 1 0 0 0-.72.96V19" /> <circle cx="18" cy="16" r="3" /> <circle cx="6" cy="19" r="3" />',
    "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />',
    "layout-grid": '<rect width="7" height="7" x="3" y="3" rx="1" /> <rect width="7" height="7" x="14" y="3" rx="1" /> <rect width="7" height="7" x="14" y="14" rx="1" /> <rect width="7" height="7" x="3" y="14" rx="1" />',
    "moon": '<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />',
    "sparkles": '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /> <path d="M20 2v4" /> <path d="M22 4h-4" /> <circle cx="4" cy="20" r="2" />',
    "chevron-right": '<path d="m9 18 6-6-6-6" />',
    "chevron-left": '<path d="m15 18-6-6 6-6" />',
    "download": '<path d="M12 15V3" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /> <path d="m7 10 5 5 5-5" />',
    "upload": '<path d="M12 3v12" /> <path d="m17 8-5-5-5 5" /> <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />',
    "activity": '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />',
    "app-window": '<rect x="2" y="4" width="20" height="16" rx="2" /> <path d="M10 4v4" /> <path d="M2 8h20" /> <path d="M6 4v4" />',
    "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />',
    "check": '<path d="M20 6 9 17l-5-5" />',
    "rotate-cw": '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /> <path d="M21 3v5h-5" />',
    "flag": '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />',
    "list": '<path d="M3 5h.01" /> <path d="M3 12h.01" /> <path d="M3 19h.01" /> <path d="M8 5h13" /> <path d="M8 12h13" /> <path d="M8 19h13" />',
    "undo-2": '<path d="M9 14 4 9l5-5" /> <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />',
    "sun": '<circle cx="12" cy="12" r="4" /> <path d="M12 2v2" /> <path d="M12 20v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="m17.66 17.66 1.41 1.41" /> <path d="M2 12h2" /> <path d="M20 12h2" /> <path d="m6.34 17.66-1.41 1.41" /> <path d="m19.07 4.93-1.41 1.41" />',
    "hash": '<line x1="4" x2="20" y1="9" y2="9" /> <line x1="4" x2="20" y1="15" y2="15" /> <line x1="10" x2="8" y1="3" y2="21" /> <line x1="16" x2="14" y1="3" y2="21" />',
    "file-text": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /> <path d="M14 2v5a1 1 0 0 0 1 1h5" /> <path d="M10 9H8" /> <path d="M16 13H8" /> <path d="M16 17H8" />',
    "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
    "maximize-2": '<path d="M15 3h6v6" /> <path d="m21 3-7 7" /> <path d="m3 21 7-7" /> <path d="M9 21H3v-6" />',
    "minimize-2": '<path d="m14 10 7-7" /> <path d="M20 10h-6V4" /> <path d="m3 21 7-7" /> <path d="M4 14h6v6" />',
    "cloud": '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />',
    "cloud-sun": '<path d="M12 2v2" /> <path d="m4.93 4.93 1.41 1.41" /> <path d="M20 12h2" /> <path d="m19.07 4.93-1.41 1.41" /> <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" /> <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />',
    "cloud-moon": '<path d="M13 16a3 3 0 0 1 0 6H7a5 5 0 1 1 4.9-6z" /> <path d="M18.376 14.512a6 6 0 0 0 3.461-4.127c.148-.625-.659-.97-1.248-.714a4 4 0 0 1-5.259-5.26c.255-.589-.09-1.395-.716-1.248a6 6 0 0 0-4.594 5.36" />',
    "cloud-rain": '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /> <path d="M16 14v6" /> <path d="M8 14v6" /> <path d="M12 16v6" />',
    "cloud-drizzle": '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /> <path d="M8 19v1" /> <path d="M8 14v1" /> <path d="M16 19v1" /> <path d="M16 14v1" /> <path d="M12 21v1" /> <path d="M12 16v1" />',
    "cloud-snow": '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /> <path d="M8 15h.01" /> <path d="M8 19h.01" /> <path d="M12 17h.01" /> <path d="M12 21h.01" /> <path d="M16 15h.01" /> <path d="M16 19h.01" />',
    "cloud-lightning": '<path d="M6 16.326A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.973" /> <path d="m13 12-3 5h4l-3 5" />',
    "cloud-fog": '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /> <path d="M16 17H7" /> <path d="M17 21H9" />',
    "droplets": '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" /> <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />',
    "wind": '<path d="M12.8 19.6A2 2 0 1 0 14 16H2" /> <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" /> <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />',
    "thermometer": '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />',
    "search": '<path d="m21 21-4.34-4.34" /> <circle cx="11" cy="11" r="8" />',
    "globe": '<circle cx="12" cy="12" r="10" /> <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /> <path d="M2 12h20" />',
    "move": '<path d="M12 2v20" /> <path d="m15 19-3 3-3-3" /> <path d="m19 9 3 3-3 3" /> <path d="M2 12h20" /> <path d="m5 9-3 3 3 3" /> <path d="m9 5 3-3 3 3" />',
    "eye-off": '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /> <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /> <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /> <path d="m2 2 20 20" />',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /> <circle cx="12" cy="12" r="3" />',
    "sunrise": '<path d="M12 2v8" /> <path d="m4.93 10.93 1.41 1.41" /> <path d="M2 18h2" /> <path d="M20 18h2" /> <path d="m19.07 10.93-1.41 1.41" /> <path d="M22 22H2" /> <path d="m8 6 4-4 4 4" /> <path d="M16 18a4 4 0 0 0-8 0" />',
    "sunset": '<path d="M12 10V2" /> <path d="m4.93 10.93 1.41 1.41" /> <path d="M2 18h2" /> <path d="M20 18h2" /> <path d="m19.07 10.93-1.41 1.41" /> <path d="M22 22H2" /> <path d="m16 6-4 4-4-4" /> <path d="M16 18a4 4 0 0 0-8 0" />',
    "umbrella": '<path d="M12 13v7a2 2 0 0 0 4 0" /> <path d="M12 2v2" /> <path d="M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z" />',
    "grip-horizontal": '<circle cx="12" cy="9" r="1" /> <circle cx="19" cy="9" r="1" /> <circle cx="5" cy="9" r="1" /> <circle cx="12" cy="15" r="1" /> <circle cx="19" cy="15" r="1" /> <circle cx="5" cy="15" r="1" />',
    "languages": '<path d="m5 8 6 6" /> <path d="m4 14 6-6 2-3" /> <path d="M2 5h12" /> <path d="M7 2h1" /> <path d="m22 22-5-10-5 10" /> <path d="M14 18h6" />',
    "radar": '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" /> <path d="M4 6h.01" /> <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" /> <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67" /> <path d="M12 18h.01" /> <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" /> <circle cx="12" cy="12" r="2" /> <path d="m13.41 10.59 5.66-5.66" />',
    "link-2": '<path d="M9 17H7A5 5 0 0 1 7 7h2" /> <path d="M15 7h2a5 5 0 1 1 0 10h-2" /> <line x1="8" x2="16" y1="12" y2="12" />',
    "refresh-cw": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /> <path d="M21 3v5h-5" /> <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /> <path d="M8 16H3v5" />',
    "arrow-left": '<path d="m12 19-7-7 7-7" /> <path d="M19 12H5" />',
    "arrow-right": '<path d="M5 12h14" /> <path d="m12 5 7 7-7 7" />',
    "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /> <path d="m9 12 2 2 4-4" />',
    "layout-dashboard": '<rect width="7" height="9" x="3" y="3" rx="1" /> <rect width="7" height="5" x="14" y="3" rx="1" /> <rect width="7" height="9" x="14" y="12" rx="1" /> <rect width="7" height="5" x="3" y="16" rx="1" />',
    "rocket": '<path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /> <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09" /> <path d="M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z" /> <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05" />'
  };
  function icon(name, size = 18, stroke = 2, cls = "", filled = false) {
    const body = ICONS[name] || ICONS.sparkles;
    const fill = filled ? "currentColor" : "none";
    return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  // src/renderer/island/util.js
  function esc(s) {
    return String(s === void 0 || s === null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function h(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }
  function hashHue(str) {
    let x = 0;
    for (let i = 0; i < (str || "").length; i++) x = x * 31 + str.charCodeAt(i) >>> 0;
    return x % 360;
  }
  function initials(name) {
    const clean = String(name || "?").replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
    if (!clean) return "?";
    const parts = clean.split(/\s+/);
    const first = Array.from(parts[0])[0] || "?";
    const second = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : "";
    return (first + (second || "")).toUpperCase();
  }
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hh = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) hh = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) hh = (b - r) / d + 2;
      else hh = (r - g) / d + 4;
      hh *= 60;
    }
    return [hh, s, l];
  }
  var hsl = (hh, s, l) => `hsl(${Math.round(hh)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
  function extractColors(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => {
        try {
          const n = 28;
          const c = document.createElement("canvas");
          c.width = n;
          c.height = n;
          const ctx2 = c.getContext("2d", { willReadFrequently: true });
          ctx2.drawImage(img, 0, 0, n, n);
          const data = ctx2.getImageData(0, 0, n, n).data;
          const buckets = /* @__PURE__ */ new Map();
          for (let i = 0; i < data.length; i += 4) {
            const [hh, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
            if (data[i + 3] < 128 || l < 0.08 || l > 0.96) continue;
            const key = Math.round(hh / 24) % 15;
            const score = s * s * (1 - Math.abs(l - 0.55));
            const b = buckets.get(key) || { score: 0, hh: 0, s: 0, l: 0, n: 0 };
            b.score += score;
            b.hh += hh;
            b.s += s;
            b.l += l;
            b.n += 1;
            buckets.set(key, b);
          }
          const sorted = [...buckets.values()].filter((b) => b.n > 2).sort((a2, b) => b.score - a2.score);
          if (!sorted.length) return resolve(null);
          const pick = (b) => {
            const s = Math.max(0.45, Math.min(0.95, b.s / b.n + 0.1));
            const l = Math.max(0.55, Math.min(0.72, b.l / b.n + 0.08));
            return { h: b.hh / b.n, s, l };
          };
          const a = pick(sorted[0]);
          const bb = sorted[1] ? pick(sorted[1]) : { h: (a.h + 40) % 360, s: a.s, l: Math.min(0.75, a.l + 0.06) };
          resolve({ c1: hsl(a.h, a.s, a.l), c2: hsl(bb.h, bb.s, bb.l), raw: [a, bb] });
        } catch (_) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }
  function mediaAppName(source) {
    const s = String(source || "").toLowerCase();
    const map = [
      ["spotify", "Spotify"],
      ["chrome", "Chrome"],
      ["msedge", "Edge"],
      ["308046b0af4a39cb", "Firefox"],
      ["firefox", "Firefox"],
      ["vlc", "VLC"],
      ["zunemusic", "Media Player"],
      ["zunevideo", "Movies & TV"],
      ["applemusic", "Apple Music"],
      ["itunes", "iTunes"],
      ["foobar", "foobar2000"],
      ["aimp", "AIMP"],
      ["opera", "Opera"],
      ["brave", "Brave"],
      ["telegram", "Telegram"],
      ["whatsapp", "WhatsApp"],
      ["potplayer", "PotPlayer"],
      ["mpc", "MPC"],
      ["deezer", "Deezer"],
      ["tidal", "TIDAL"],
      ["youtube", "YouTube Music"],
      ["amazon", "Amazon Music"],
      ["soundcloud", "SoundCloud"],
      ["musicbee", "MusicBee"]
    ];
    for (const [k, v] of map) if (s.includes(k)) return v;
    const base = String(source || "").split(/[\\/!]/).pop().replace(/\.exe$/i, "");
    return base.length > 18 ? base.slice(0, 18) : base;
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function throttle(fn, ms) {
    let last = 0;
    let timer2 = null;
    let pending = null;
    return (...args) => {
      const now = Date.now();
      pending = args;
      if (now - last >= ms) {
        last = now;
        fn(...args);
        pending = null;
        return;
      }
      if (!timer2) {
        timer2 = setTimeout(() => {
          timer2 = null;
          last = Date.now();
          if (pending) fn(...pending);
          pending = null;
        }, ms - (now - last));
      }
    };
  }
  var audioCtx = null;
  function chime(kind = "timer") {
    try {
      audioCtx = audioCtx || new AudioContext();
      const now = audioCtx.currentTime;
      const notes = kind === "timer" ? [880, 1174.66, 1318.5] : kind === "find" ? [1046.5, 1568, 1318.5, 2093] : [660, 880];
      const peak = kind === "find" ? 0.32 : 0.18;
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        const t0 = now + i * (kind === "find" ? 0.12 : 0.16);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(peak, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(1e-4, t0 + 0.9);
        o.connect(g).connect(audioCtx.destination);
        o.start(t0);
        o.stop(t0 + 1);
      });
    } catch (_) {
    }
  }

  // src/renderer/island/cities.js
  var CITY = {
    "Europe/London": "London",
    "Europe/Paris": "Paris",
    "Europe/Berlin": "Berlin",
    "Europe/Madrid": "Madrid",
    "Europe/Istanbul": "Istanbul",
    "Europe/Moscow": "Moscow",
    "America/New_York": "New York",
    "America/Los_Angeles": "Los Angeles",
    "America/Toronto": "Toronto",
    "America/Sao_Paulo": "S\xE3o Paulo",
    "Asia/Dubai": "Dubai",
    "Asia/Riyadh": "Riyadh",
    "Asia/Kolkata": "Delhi",
    "Asia/Singapore": "Singapore",
    "Asia/Shanghai": "Beijing",
    "Asia/Tokyo": "Tokyo",
    "Australia/Sydney": "Sydney"
  };
  var CLOCK_ZONES = Object.keys(CITY);
  function cityName(tz, lang) {
    return CITY[tz] || tz.split("/").pop().replace(/_/g, " ");
  }

  // src/renderer/island/calendar.js
  function isoOf(date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  }
  function dateOfIso(iso) {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1, 12);
  }
  function monthGrid(ym, weekStart) {
    const first = new Date(ym.y, ym.m - 1, 1, 12);
    const days = new Date(ym.y, ym.m, 0).getDate();
    const lead = (first.getDay() - weekStart + 7) % 7;
    const cells = [];
    const start = new Date(first.getTime() - lead * 864e5);
    const total = Math.ceil((lead + days) / 7) * 7;
    for (let i = 0; i < total; i += 1) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
      const inMonth = d.getFullYear() === ym.y && d.getMonth() + 1 === ym.m;
      cells.push({ iso: isoOf(d), g: d.getDate(), gm: d.getMonth() + 1, inMonth, dow: d.getDay() });
    }
    return cells;
  }
  function currentYm(date = /* @__PURE__ */ new Date()) {
    return { y: date.getFullYear(), m: date.getMonth() + 1 };
  }
  function shiftYm(ym, delta) {
    let m = ym.m + delta;
    let y = ym.y;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    return { y, m };
  }
  function ymOfIso(iso) {
    return currentYm(dateOfIso(iso));
  }

  // src/renderer/island/views.js
  var import_home_layout = __toESM(require_home_layout());
  var import_deck_meta = __toESM(require_deck_meta());
  var import_sub_langs = __toESM(require_sub_langs());

  // src/renderer/shared/blink.js
  var BLINK_MS = { blink: 240, blink2: 560, wink: 920, look: 1e3, wake: 720, sleep: 280 };
  var PLAY = ["is-blink", "is-blink2", "is-wink", "is-look", "is-wake"];
  function reducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (_) {
      return false;
    }
  }
  function faceHtml(cls = "", role = "") {
    return `<span class="bk ${cls}"${role ? ` data-face="${role}"` : ""} dir="ltr" aria-hidden="true"><span class="bk-face"><i class="bk-eye bk-l"><b class="bk-ball"></b></i><i class="bk-eye bk-r"><b class="bk-ball"></b><svg class="bk-arc" viewBox="0 0 24 12" focusable="false"><path d="M3.2 10 Q12 1.4 20.8 10"/></svg></i></span></span>`;
  }
  function createBlinker(el, opts = {}) {
    const gap = opts.gap || [2400, 6400];
    const timers = /* @__PURE__ */ new Set();
    let alive = true;
    let autoOn = false;
    let autoTimer = null;
    let busyUntil = 0;
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        if (alive) fn();
      }, ms);
      timers.add(t);
      return t;
    };
    const wait = (ms) => new Promise((r) => later(r, ms));
    function play(cls, ms, kind) {
      if (!alive || !el) return Promise.resolve();
      el.classList.remove(...PLAY);
      void el.offsetWidth;
      el.classList.add(cls);
      busyUntil = performance.now() + ms;
      if (opts.onMove) {
        try {
          opts.onMove(kind);
        } catch (_) {
        }
      }
      later(() => el.classList.remove(cls), ms + 40);
      return wait(ms);
    }
    const api = {
      el,
      get busy() {
        return performance.now() < busyUntil;
      },
      blink() {
        return play("is-blink", BLINK_MS.blink, "blink");
      },
      blink2() {
        return play("is-blink2", BLINK_MS.blink2, "blink2");
      },
      wink() {
        return play("is-wink", BLINK_MS.wink, "wink");
      },
      look(dir = 1) {
        el.style.setProperty("--bk-dir", dir < 0 ? "-1" : "1");
        return play("is-look", BLINK_MS.look, "look");
      },
      wake() {
        el.classList.remove("asleep");
        return play("is-wake", BLINK_MS.wake, "wake");
      },
      sleep() {
        el.classList.remove(...PLAY);
        el.classList.add("asleep");
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
        if (autoTimer) {
          clearTimeout(autoTimer);
          timers.delete(autoTimer);
          autoTimer = null;
        }
        return api;
      },
      destroy() {
        alive = false;
        autoOn = false;
        timers.forEach((t) => clearTimeout(t));
        timers.clear();
        if (el) el.classList.remove(...PLAY);
      }
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

  // src/renderer/island/views.js
  var COMPACT_H = 32;
  function isRtl(text) {
    const m = String(text || "").match(/[A-Za-zÀ-ɏЀ-ӿ֐-ࣿיִ-﷿ﹰ-﻿一-鿿]/);
    return !!m && /[֐-ࣿיִ-﷿ﹰ-﻿]/.test(m[0]);
  }
  function wxInfo(code, isDay = true) {
    const c = Number(code);
    if (c === 0) return { ic: isDay ? "sun" : "moon", key: "wx_clear", anim: isDay ? "wx-spin" : "wx-float" };
    if (c === 1) return { ic: isDay ? "sun" : "moon", key: "wx_mostlyClear", anim: isDay ? "wx-spin" : "wx-float" };
    if (c === 2) return { ic: isDay ? "cloud-sun" : "cloud-moon", key: "wx_partlyCloudy", anim: "wx-float" };
    if (c === 3) return { ic: "cloud", key: "wx_cloudy", anim: "wx-float" };
    if (c === 45 || c === 48) return { ic: "cloud-fog", key: "wx_fog", anim: "wx-float" };
    if (c >= 51 && c <= 57) return { ic: "cloud-drizzle", key: "wx_drizzle", anim: "wx-bob" };
    if (c >= 61 && c <= 67) return { ic: "cloud-rain", key: "wx_rain", anim: "wx-bob" };
    if (c >= 80 && c <= 82) return { ic: "cloud-rain", key: "wx_showers", anim: "wx-bob" };
    if (c >= 71 && c <= 77 || c === 85 || c === 86) return { ic: "cloud-snow", key: "wx_snow", anim: "wx-bob" };
    if (c >= 95) return { ic: "cloud-lightning", key: "wx_thunder", anim: "wx-flash" };
    return { ic: "cloud", key: "wx_cloudy", anim: "wx-float" };
  }
  function wxIcon(code, isDay, size, extra = "") {
    const w = wxInfo(code, isDay);
    return `<span class="wx-ic ${w.anim} ${extra}" data-wx="${w.ic}">${icon(w.ic, size, 2)}</span>`;
  }
  function wxColor(code, isDay) {
    const c = Number(code);
    if (c <= 1) return isDay ? "var(--yellow)" : "#c7d2fe";
    if (c === 2) return isDay ? "#ffd27a" : "#c7d2fe";
    if (c >= 95) return "var(--purple)";
    if (c >= 51) return "var(--teal)";
    return "#d1d5db";
  }
  function avatar(src, name, { size = "md", badge = null, cls = "", hue = null } = {}) {
    const hh = hue === null ? hashHue(name) : hue;
    const inner = src ? `<img src="${esc(src)}" alt="" draggable="false">` : `<span class="av-letters">${esc(initials(name))}</span>`;
    const b = badge ? `<span class="av-badge">${badge}</span>` : "";
    return `<div class="av av-${size} ${cls}" style="--hue:${hh}">${inner}${b}</div>`;
  }
  function art(src, size, colors, video = false) {
    if (src) return `<img class="art art-${size}" src="${esc(src)}" alt="" draggable="false">`;
    const c1 = colors && colors.c1 || (video ? "var(--purple)" : "var(--accent)");
    return `<div class="art art-${size} art-ph ${video ? "vid" : ""}" style="--c1:${c1}">${icon(video ? "video" : "music", size === "lg" ? 26 : size === "md" ? 20 : 12, 2.2)}</div>`;
  }
  function mediaSub(m) {
    if (m.artist) return m.artist;
    if (m.phone) return m.source || "";
    return m.player || mediaAppName(m.source);
  }
  function viz(n, cls = "") {
    return `<div class="viz ${cls}" data-viz="${n}" dir="ltr">${"<i></i>".repeat(n)}</div>`;
  }
  function ring(p, size, color, stroke = 3, inner = "") {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return `<div class="ring" style="width:${size}px;height:${size}px;--rc:${color}">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="ring-bg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
      <circle class="ring-fg" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - clamp(p, 0, 1))).toFixed(2)}"
        transform="rotate(-90 ${size / 2} ${size / 2})" data-circ="${c.toFixed(2)}"/>
    </svg>${inner ? `<div class="ring-in">${inner}</div>` : ""}</div>`;
  }
  function setRing(el, p) {
    if (!el) return;
    const fg = el.querySelector(".ring-fg");
    if (!fg) return;
    const c = Number(fg.dataset.circ);
    fg.setAttribute("stroke-dashoffset", (c * (1 - clamp(p, 0, 1))).toFixed(2));
  }
  function bind(el, name, text) {
    const n = el.querySelector(`[data-bind="${name}"]`);
    if (n && n.textContent !== text) n.textContent = text;
  }
  function volIcon(level, muted) {
    if (muted || level <= 1e-3) return "volume-x";
    if (level < 0.34) return "volume";
    if (level < 0.67) return "volume-1";
    return "volume-2";
  }
  function mediaPos(m) {
    if (!m) return 0;
    let p = m.position || 0;
    if (m.status === "playing") p += (Date.now() - m.receivedAt) / 1e3;
    return m.duration > 0 ? clamp(p, 0, m.duration) : Math.max(0, p);
  }
  function timerState(tm) {
    if (!tm) return { remaining: 0, elapsed: 0, progress: 0 };
    const now = Date.now();
    if (tm.kind === "stopwatch") {
      const elapsed = (tm.accum || 0) + (tm.running ? (now - tm.startedAt) / 1e3 : 0);
      return { elapsed, remaining: 0, progress: elapsed % 60 / 60 };
    }
    const remaining = tm.running ? Math.max(0, (tm.endsAt - now) / 1e3) : tm.remaining;
    return { remaining, elapsed: tm.duration - remaining, progress: tm.duration > 0 ? remaining / tm.duration : 0 };
  }
  function pdots(privacy2) {
    return `${privacy2.mic.length ? '<i class="pd mic"></i>' : ""}${privacy2.cam.length ? '<i class="pd cam"></i>' : ""}${privacy2.loc.length ? '<i class="pd loc"></i>' : ""}`;
  }
  var idle = {
    name: "idle",
    size(d, ctx2) {
      const notch = ctx2.s.style === "notch";
      const showClock = d.hover || ctx2.s.idleClock;
      if (showClock) return { w: notch ? 236 : 186, h: 34 };
      const extra = (d.privacy.mic.length ? 10 : 0) + (d.privacy.cam.length ? 10 : 0) + (d.privacy.loc.length ? 10 : 0);
      return { w: (notch ? 196 : 124) + extra, h: notch ? 32 : 30 };
    },
    key(d, ctx2) {
      return `idle:${d.hover || ctx2.s.idleClock ? "clock" : "plain"}:${d.weather && d.weather.current ? "wx" : "nowx"}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const showClock = d.hover || ctx2.s.idleClock;
      if (!showClock) return h(`<div class="cmp idle"><div class="pdots">${pdots(d.privacy)}</div></div>`);
      const w = d.weather && d.weather.current;
      const right = w ? `<span class="idle-wx" data-bind-wx>${wxIcon(w.code, w.isDay, 15)}<span class="tnum" data-bind="temp">${ctx2.i.temp(w.temp)}</span></span>` : `<span class="idle-date" data-bind="date">${esc(ctx2.i.dates().short)}</span>`;
      return h(`<div class="cmp idle clock" dir="ltr">
      <span class="idle-time tnum" data-bind="clock">${ctx2.i.clock()}</span>
      ${right}
      <div class="pdots">${pdots(d.privacy)}</div>
    </div>`);
    },
    update(el, d, ctx2) {
      bind(el, "clock", ctx2.i.clock());
      const w = d.weather && d.weather.current;
      if (w) bind(el, "temp", ctx2.i.temp(w.temp));
      const dots = el.querySelector(".pdots");
      if (dots) {
        const html = pdots(d.privacy);
        if (dots.innerHTML !== html) dots.innerHTML = html;
      }
    }
  };
  var handle = {
    name: "handle",
    size(d, ctx2) {
      const notch = ctx2.s.style === "notch";
      if (d.activity) return { w: notch ? 140 : 96, h: 16, r: 8 };
      return { w: notch ? 120 : 70, h: 10, r: 5 };
    },
    key(d) {
      return `handle:${d.activity || ""}`;
    },
    render(d) {
      let inner = "";
      if (d.activity === "media") inner = viz(4, "viz-mini");
      else if (d.activity === "timer") inner = '<i class="hdot orange"></i>';
      else if (d.activity === "call") inner = '<i class="hdot green"></i>';
      return h(`<div class="cmp handle-v">${inner}</div>`);
    }
  };
  var media = {
    name: "media",
    expandTo: "media",
    size(d) {
      if (!d.info || !(d.media.title || d.media.artist)) return { w: d.hover ? 268 : 252, h: d.hover ? 36 : COMPACT_H };
      return { w: d.hover ? 378 : 360, h: d.hover ? 36 : COMPACT_H };
    },
    key(d) {
      const m = d.media;
      return `media:${m.art ? m.artKey : "noart"}:${m.phone ? 1 : 0}:${m.video ? 1 : 0}:${d.info ? `${m.title}|${mediaSub(m)}` : ""}`;
    },
    render(d) {
      const m = d.media;
      const info = d.info && (m.title || m.artist);
      const sub = mediaSub(m);
      const title = m.title || sub;
      return h(`<div class="cmp media ${info ? "with-info" : ""} ${m.status === "playing" ? "playing" : ""}" dir="ltr">
      <div class="media-left">${art(m.art, "sm", m.colors, m.video)}${m.phone ? `<span class="src-badge">${icon("smartphone", 8, 3)}</span>` : ""}</div>
      ${info ? `<div class="cm-info marquee"><span dir="auto"><b>${esc(title)}</b>${m.title && sub ? `<em> \xB7 ${esc(sub)}</em>` : ""}</span></div>` : ""}
      <div class="media-right">${icon("pause", 12, 0, "paused-ic", true)}${viz(5)}</div>
    </div>`);
    },
    update(el, d) {
      el.classList.toggle("playing", d.media.status === "playing");
    }
  };
  var mediaMini = {
    name: "mediaMini",
    bubble: true,
    key(d) {
      return `mm:${d.media.artKey}`;
    },
    render(d) {
      return h(`<div class="bub mm ${d.media.status === "playing" ? "playing" : ""}">${art(d.media.art, "xs", d.media.colors)}</div>`);
    },
    update(el, d) {
      el.classList.toggle("playing", d.media.status === "playing");
    }
  };
  var mediaExpanded = {
    name: "mediaExpanded",
    size() {
      return { w: 432, h: 184, r: 46 };
    },
    key(d, ctx2) {
      return `mx:${d.media.artKey}:${d.media.art ? 1 : 0}:${d.cc ? 1 : 0}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const m = d.media;
      const playing = m.status === "playing";
      return h(`<div class="mx ${playing ? "playing" : ""}">
      <div class="mx-top" dir="ltr">
        <div class="mx-art-wrap" data-s>${art(m.art, "lg", m.colors, m.video)}</div>
        <div class="mx-meta" data-s>
          <div class="mx-title marquee" dir="auto"><span>${esc(m.title || ctx2.i.t("nowPlaying"))}</span></div>
          <div class="mx-artist" dir="auto">${esc(m.artist || m.album || "")}</div>
        </div>
        <div class="mx-side" data-s>
          <span class="chip">${m.phone ? icon("smartphone", 11, 2.4) : ""}${esc(m.phone ? m.source : m.player || mediaAppName(m.source))}</span>
          ${viz(6, "viz-lg")}
        </div>
      </div>
      <div class="mx-prog" dir="ltr" data-s>
        <span class="tnum t-dim" data-bind="elapsed">0:00</span>
        <div class="prog ${m.canSeek ? "seekable" : ""} ${m.duration ? "" : "nodur"}" data-slider="seek"><div class="prog-fill"></div><div class="prog-knob"></div></div>
        <span class="tnum t-dim" data-bind="remain">-0:00</span>
      </div>
      <div class="mx-ctrl" dir="ltr" data-s>
        <div class="mx-sl"><button class="ib" data-act="volume.toggleMute" title="${esc(ctx2.i.t("volume"))}">${icon(volIcon(d.volume.level, d.volume.muted), 18)}</button></div>
        <div class="mx-main-ctrl">
          <button class="ib" data-act="media.prev" ${m.canPrev === false ? "disabled" : ""}>${icon("skip-back", 24, 0, "", true)}</button>
          <button class="ib big" data-act="media.toggle">${icon(playing ? "pause" : "play", 30, 0, "pp", true)}</button>
          <button class="ib" data-act="media.next" ${m.canNext === false ? "disabled" : ""}>${icon("skip-forward", 24, 0, "", true)}</button>
        </div>
        <div class="mx-sr">
          ${d.cc ? `<button class="ib mx-cc" data-act="subs.open" title="${esc(ctx2.i.t("subsTitle"))}">${icon("captions", 18)}</button>` : ""}
          <button class="ib" data-act="dashboard" title="${esc(ctx2.i.t("home"))}">${icon("layout-grid", 17)}</button>
        </div>
      </div>
    </div>`);
    },
    update(el, d, ctx2) {
      const m = d.media;
      const playing = m.status === "playing";
      el.classList.toggle("playing", playing);
      const pp = el.querySelector('[data-act="media.toggle"]');
      const want = playing ? "pause" : "play";
      if (pp && pp.dataset.icon !== want) {
        pp.dataset.icon = want;
        pp.innerHTML = icon(want, 30, 0, "pp", true);
      }
      const volBtn = el.querySelector('[data-act="volume.toggleMute"]');
      const vi = volIcon(d.volume.level, d.volume.muted);
      if (volBtn && volBtn.dataset.icon !== vi) {
        volBtn.dataset.icon = vi;
        volBtn.innerHTML = icon(vi, 18);
      }
      const pos = d.seekPreview !== null && d.seekPreview !== void 0 ? d.seekPreview : mediaPos(m);
      const dur = m.duration || 0;
      bind(el, "elapsed", dur > 0 || !m.win ? ctx2.i.duration(pos) : "");
      bind(el, "remain", dur > 0 ? `-${ctx2.i.duration(dur - pos)}` : "");
      const fill = el.querySelector(".prog-fill");
      const knob = el.querySelector(".prog-knob");
      const p = dur > 0 ? clamp(pos / dur, 0, 1) : 0;
      if (fill) fill.style.width = `${(p * 100).toFixed(2)}%`;
      if (knob) knob.style.left = `${p * 100}%`;
    }
  };
  function notifAvatar(n) {
    const badge = n.app && n.app.phone ? icon("smartphone", 10, 2.6) : null;
    return avatar(n.avatar || n.appIcon, n.title || n.appName, { size: "md", badge, cls: n.avatar ? "" : n.appIcon ? "av-icon" : "" });
  }
  var notification = {
    name: "notification",
    expandTo: "notification",
    size(d) {
      return { w: d.hover ? 400 : 388, h: d.hover ? 76 : 72, r: 36 };
    },
    key(d) {
      return `nt:${d.n.id}:${d.n.avatar ? 1 : 0}:${d.n.appIcon ? 1 : 0}`;
    },
    render(d, ctx2) {
      const n = d.n;
      const sub = [n.attribution || n.appName, ctx2.i.ago(n.time)].filter(Boolean).join(" \xB7 ");
      const dir = isRtl(`${n.title} ${n.body}`) ? "rtl" : "ltr";
      return h(`<div class="nt" dir="${dir}">
      ${notifAvatar(n)}
      <div class="nt-body">
        <div class="nt-head"><span class="nt-title">${esc(n.title || n.appName)}</span><span class="nt-app" data-bind="sub">${esc(sub)}</span></div>
        <div class="nt-text">${esc(ctx2.s.notifications.showBody === false ? "" : n.body)}</div>
      </div>
      <div class="nt-more ${d.queue > 0 ? "show" : ""}" data-bind="more">+${ctx2.i.num(d.queue)}</div>
    </div>`);
    },
    update(el, d, ctx2) {
      const more = el.querySelector(".nt-more");
      if (more) {
        more.classList.toggle("show", d.queue > 0);
        more.textContent = `+${ctx2.i.num(d.queue)}`;
      }
    }
  };
  var notificationExpanded = {
    name: "notificationExpanded",
    autoHeight: true,
    size() {
      return { w: 436, h: 200, r: 40 };
    },
    key(d, ctx2) {
      return `nx:${d.n.id}:${d.n.avatar ? 1 : 0}:${d.status || ""}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const n = d.n;
      const t = ctx2.i.t;
      const acts = (n.actions || []).filter((a) => !a.inputId && a.content && a.placement !== "contextMenu").slice(0, 3);
      const input = (n.inputs || []).find((i) => i.type !== "selection");
      const sendAct = input ? (n.actions || []).find((a) => a.inputId === input.id) : null;
      const status = d.status ? `<div class="nx-status ${d.statusOk ? "ok" : "bad"}">${icon(d.statusOk ? "check" : "x", 13, 2.6)} ${esc(d.status)}</div>` : "";
      const dir = isRtl(`${n.title} ${n.body}`) ? "rtl" : "ltr";
      const kde = n.source === "kde";
      return h(`<div class="nx" dir="${dir}">
      <div class="nx-head" data-s>
        ${notifAvatar(n)}
        <div class="nx-meta">
          <div class="nt-title">${esc(n.title || n.appName)}</div>
          <div class="nt-app">${esc([n.attribution || n.appName, ctx2.i.ago(n.time)].filter(Boolean).join(" \xB7 "))}</div>
        </div>
        ${kde ? n.clearable ? `<button class="ib sm" data-act="notif.phoneDismiss" title="${esc(t("dismiss"))}">${icon("trash-2", 16)}</button>` : "" : `<button class="ib sm" data-act="notif.open" title="${esc(t("open"))}">${icon("external-link", 16)}</button>`}
        <button class="ib sm" data-act="notif.dismiss" title="${esc(t("dismiss"))}">${icon("x", 17)}</button>
      </div>
      <div class="nx-text" data-s>${esc(ctx2.s.notifications.showBody === false ? "" : n.body || "")}</div>
      ${acts.length ? `<div class="nx-acts" data-s>${acts.map((a, i) => `<button class="pill" data-act="notif.action" data-arg="${i}">${esc(a.content)}</button>`).join("")}</div>` : ""}
      ${input ? `<form class="nx-reply" data-form="reply" data-s>
          <input type="text" name="reply" autocomplete="off" placeholder="${esc(input.placeholder || t("reply"))}" dir="auto">
          <button class="send" type="submit" title="${esc(sendAct && sendAct.content ? sendAct.content : t("send"))}">${icon("send", 16, 2.2)}</button>
        </form>` : ""}
      ${status}
    </div>`);
    }
  };
  var call = {
    name: "call",
    size() {
      return { w: 432, h: 86, r: 43 };
    },
    key(d, ctx2) {
      return `call:${d.call.id}:${d.call.avatar ? 1 : 0}:${d.call.pending || ""}:${d.call.error ? 1 : 0}:${d.call.muted ? 1 : 0}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const c = d.call;
      const t = ctx2.i.t;
      const kde = c.source === "kde";
      let sub;
      if (c.error) sub = t("callFailed");
      else if (c.pending) sub = t("connecting");
      else if (kde) sub = null;
      else sub = [c.subtitle || t("incomingCall"), c.phone ? "Phone Link" : c.appName].filter(Boolean).join(" \xB7 ");
      const buttons = kde ? `<button class="cbtn gray ${c.muted ? "on" : ""}" data-act="call.mute" title="${esc(t("muteRinger"))}">${icon(c.muted ? "bell-off" : "bell-ring", 21, 2.2)}</button>
         <button class="cbtn red" data-act="call.dismiss" title="${esc(t("dismiss"))}">${icon("x", 22, 2.4)}</button>` : `<button class="cbtn red ${c.pending === "decline" ? "busy" : ""}" data-act="call.decline" title="${esc(t("decline"))}">${icon("phone-off", 22, 2.2)}</button>
         <button class="cbtn green ${c.pending ? "" : "wiggle"} ${c.pending === "accept" ? "busy" : ""}" data-act="call.accept" title="${esc(t("accept"))}">${icon("phone", 22, 2.2)}</button>`;
      return h(`<div class="call" dir="ltr">
      <div class="call-av">${avatar(c.avatar, c.name, { size: "lg", cls: "pulse" })}</div>
      <div class="call-meta">
        <div class="call-name" dir="auto">${esc(c.name || t("unknownCaller"))}</div>
        ${sub === null ? `<div class="call-sub two" dir="${ctx2.i.dir()}">${c.subtitle ? `<bdi dir="ltr">${esc(c.subtitle)}</bdi><br>` : ""}${esc(t("answerOnPhone"))}</div>` : `<div class="call-sub ${c.error ? "err" : ""}" dir="auto">${esc(sub)}</div>`}
      </div>
      <div class="call-btns">${buttons}</div>
    </div>`);
    }
  };
  var callActive = {
    name: "callActive",
    expandTo: "callActive",
    size(d) {
      return { w: d.hover ? 248 : 232, h: d.hover ? 36 : COMPACT_H };
    },
    key() {
      return "callA";
    },
    render(d, ctx2) {
      return h(`<div class="cmp calla" dir="ltr">
      <span class="calla-ic">${icon("phone", 13, 2.6)}</span>
      <span class="tnum calla-time" data-bind="t">${ctx2.i.duration((Date.now() - d.call.startedAt) / 1e3)}</span>
      ${viz(5, "viz-green")}
    </div>`);
    },
    update(el, d, ctx2) {
      bind(el, "t", ctx2.i.duration((Date.now() - d.call.startedAt) / 1e3));
    }
  };
  var callActiveExpanded = {
    name: "callActiveExpanded",
    size() {
      return { w: 400, h: 120, r: 44 };
    },
    key(d, ctx2) {
      return `callAX:${d.call.id}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const c = d.call;
      const t = ctx2.i.t;
      const kde = c.source === "kde";
      return h(`<div class="callx" dir="ltr">
      <div class="callx-top" data-s>
        ${avatar(c.avatar, c.name, { size: "md" })}
        <div class="call-meta"><div class="call-name" dir="auto">${esc(c.name || t("unknownCaller"))}</div>
        <div class="call-sub green tnum" data-bind="t">${t("onCall")} \xB7 ${ctx2.i.duration((Date.now() - c.startedAt) / 1e3)}</div></div>
        ${viz(6, "viz-green viz-lg")}
      </div>
      <div class="callx-btns" data-s>
        ${kde ? "" : `<button class="pill" data-act="action" data-arg="phonelink">${icon("smartphone", 15)} ${esc(t("openPhoneLink"))}</button>`}
        <button class="pill" data-act="call.hide">${icon("eye-off", 15)} ${esc(t("hide"))}</button>
        ${kde ? "" : `<button class="pill red" data-act="call.end">${icon("phone-off", 15)} ${esc(t("endCall"))}</button>`}
      </div>
    </div>`);
    },
    update(el, d, ctx2) {
      bind(el, "t", `${ctx2.i.t("onCall")} \xB7 ${ctx2.i.duration((Date.now() - d.call.startedAt) / 1e3)}`);
    }
  };
  var pair = {
    name: "pair",
    size() {
      return { w: 456, h: 88, r: 44 };
    },
    key(d, ctx2) {
      return `pair:${d.pair.id}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      const code = d.pair.verifyKey ? `${d.pair.verifyKey.slice(0, 4)} ${d.pair.verifyKey.slice(4)}` : "";
      return h(`<div class="call pairv" dir="${ctx2.i.dir()}">
      <div class="pair-ic">${icon("smartphone", 24, 2)}</div>
      <div class="call-meta" style="text-align:start">
        <div class="call-name">${esc(t("pairRequest", { name: d.pair.name }))}</div>
        <div class="call-sub">${code ? `${esc(t("pairCode", { code: "" }))}<b class="code" dir="ltr">${esc(code)}</b>` : ""}</div>
      </div>
      <div class="call-btns">
        <button class="cbtn gray" data-act="pair.reject" title="${esc(t("rejectPair"))}">${icon("x", 22, 2.4)}</button>
        <button class="cbtn green" data-act="pair.accept" title="${esc(t("acceptPair"))}">${icon("check", 22, 2.6)}</button>
      </div>
    </div>`);
    }
  };
  var volume = {
    name: "volume",
    size() {
      return { w: 330, h: 44 };
    },
    key() {
      return "vol";
    },
    render(d) {
      return h(`<div class="hud" dir="ltr">
      <span class="hud-ic" data-bind-icon="vol">${icon(volIcon(d.volume.level, d.volume.muted), 20)}</span>
      <div class="slider" data-slider="volume"><div class="slider-fill"></div></div>
      <span class="hud-val tnum" data-bind="v"></span>
    </div>`);
    },
    update(el, d, ctx2) {
      const v = d.volume;
      const lvl = v.muted ? 0 : v.level;
      const fill = el.querySelector(".slider-fill");
      if (fill) fill.style.width = `${(lvl * 100).toFixed(2)}%`;
      bind(el, "v", v.muted ? "" : ctx2.i.num(Math.round(v.level * 100)));
      const ic = el.querySelector('[data-bind-icon="vol"]');
      const name = volIcon(v.level, v.muted);
      if (ic && ic.dataset.name !== name) {
        ic.dataset.name = name;
        ic.innerHTML = icon(name, 20);
      }
      el.classList.toggle("muted", !!v.muted);
    }
  };
  var battery = {
    name: "battery",
    size() {
      return { w: 330, h: 44 };
    },
    key(d) {
      return `bat:${d.kind}:${d.battery.charging ? 1 : 0}`;
    },
    render(d, ctx2) {
      const b = d.battery;
      const t = ctx2.i.t;
      const low = d.kind === "low";
      const label = low ? t("batteryLow") : b.charging ? b.percent >= 100 ? t("fullyCharged") : t("charging") : t("onBattery");
      const cls = low ? "low" : b.charging ? "chg" : "";
      return h(`<div class="hud bat ${cls}" dir="${ctx2.i.dir()}">
      <span class="hud-label">${esc(label)}</span>
      <span class="hud-val tnum" dir="ltr">${ctx2.i.num(b.percent)}%</span>
      <div class="bat-ic"><div class="bat-fill" style="transform:scaleX(${clamp(b.percent / 100, 0.04, 1)})"></div>${b.charging ? `<span class="bat-bolt">${icon("zap", 12, 0, "", true)}</span>` : ""}</div>
    </div>`);
    }
  };
  var keys = {
    name: "keys",
    size() {
      return { w: 258, h: 40 };
    },
    key(d) {
      return `keys:${d.which}:${d.on ? 1 : 0}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      const label = d.which === "num" ? d.on ? t("numOn") : t("numOff") : d.on ? t("capsOn") : t("capsOff");
      return h(`<div class="hud keys ${d.on ? "on" : ""}" dir="${ctx2.i.dir()}">
      <span class="key-cap">${icon(d.which === "num" ? "hash" : "arrow-big-up", 18, 2.2, "", d.on && d.which !== "num")}</span>
      <span class="hud-label">${esc(label)}</span>
      <i class="key-led"></i>
    </div>`);
    }
  };
  var copied = {
    name: "copied",
    size() {
      return { w: 352, h: 44 };
    },
    key(d) {
      return `copy:${d.item.id || d.item.time}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      const it = d.item;
      const label = it.kind === "error" ? t("clipboardTooLarge") : it.kind === "secret" ? t("protectedCopied") : it.kind === "image" ? t("imageCopied") : it.kind === "file" ? t("fileCopied") : t("copied");
      const preview = it.kind === "image" && it.thumb ? `<img class="copy-thumb" src="${esc(it.thumb)}" alt="">` : it.kind === "secret" ? '<span class="copy-prev">\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022</span>' : `<span class="copy-prev" dir="auto">${esc((it.text || "").replace(/\s+/g, " ").slice(0, 80))}</span>`;
      return h(`<div class="hud copy" dir="${ctx2.i.dir()}">
      <span class="hud-ic accent">${icon(it.kind === "secret" ? "shield" : "clipboard-check", 19, 2.2)}</span>
      <span class="hud-label">${esc(label)}</span>
      ${preview}
    </div>`);
    }
  };
  var privacy = {
    name: "privacy",
    size() {
      return { w: 360, h: 44 };
    },
    key(d) {
      return `priv:${d.kind}:${d.app}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      const k = d.kind;
      const text = t(k === "mic" ? "micInUse" : k === "cam" ? "camInUse" : "locInUse", { app: d.app || t("someApp") });
      return h(`<div class="hud priv ${k}" dir="${ctx2.i.dir()}">
      <span class="priv-ic">${icon(k === "mic" ? "mic" : k === "cam" ? "video" : "map-pin", 16, 2.4)}</span>
      <span class="hud-label">${esc(text)}</span>
    </div>`);
    }
  };
  var message = {
    name: "message",
    size(d) {
      return { w: clamp(120 + (d.text || "").length * 6.4, 260, 440), h: 44 };
    },
    key(d) {
      return `msg:${d.id}`;
    },
    render(d, ctx2) {
      const ic = d.icon === "blinkelo" ? `<span class="hud-ic bk-hud">${faceHtml("bk-sm wink-once")}</span>` : `<span class="hud-ic ${d.tone || ""}">${icon(d.icon || "sparkles", 18, 2.2)}</span>`;
      return h(`<div class="hud msg ${d.tone || ""}" dir="${ctx2.i.dir()}">
      ${ic}
      <span class="hud-label">${esc(d.text)}</span>
    </div>`);
    }
  };
  var track = {
    name: "track",
    size() {
      return { w: 372, h: 46 };
    },
    key(d) {
      return `trk:${d.media.artKey}:${d.media.art ? 1 : 0}:${d.media.title}`;
    },
    render(d, ctx2) {
      const m = d.media;
      return h(`<div class="hud trk playing" dir="ltr">
      ${art(m.art, "sm2", m.colors, m.video)}
      <div class="trk-meta"><div class="trk-title" dir="auto">${esc(m.title || ctx2.i.t("nowPlaying"))}</div>
      <div class="trk-artist" dir="auto">${esc(mediaSub(m))}</div></div>
      ${viz(5)}
    </div>`);
    }
  };
  var drop = {
    name: "drop",
    size() {
      return { w: 440, h: 116, r: 42 };
    },
    key(d, ctx2) {
      return `drop:${d.apps ? "apps" : "shelf"}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      return h(`<div class="drop">
      <div class="drop-zone" data-s>${icon(d.apps ? "app-window" : "download", 26, 2)}<span>${esc(d.apps ? ctx2.i.t("addApp") : ctx2.i.t("dropHere"))}</span></div>
    </div>`);
    }
  };
  var timer = {
    name: "timer",
    expandTo: "timer",
    size(d) {
      return { w: d.hover ? 226 : 212, h: d.hover ? 36 : COMPACT_H };
    },
    key(d) {
      return `tmr:${d.timer.kind}`;
    },
    render(d, ctx2) {
      const tm = d.timer;
      const sw = tm.kind === "stopwatch";
      const st = timerState(tm);
      return h(`<div class="cmp tmr ${sw ? "sw" : ""} ${tm.running ? "" : "paused"}" dir="ltr">
      ${ring(st.progress, 20, sw ? "var(--green)" : "var(--orange)", 3)}
      <span class="tmr-text tnum" data-bind="t">${sw ? ctx2.i.duration(st.elapsed) : ctx2.i.timerText(st.remaining)}</span>
    </div>`);
    },
    update(el, d, ctx2) {
      const tm = d.timer;
      const st = timerState(tm);
      bind(el, "t", tm.kind === "stopwatch" ? ctx2.i.duration(st.elapsed) : ctx2.i.timerText(st.remaining));
      setRing(el.querySelector(".ring"), st.progress);
      el.classList.toggle("paused", !tm.running);
    }
  };
  var timerMini = {
    name: "timerMini",
    bubble: true,
    key(d) {
      return `tmini:${d.timer.kind}`;
    },
    render(d) {
      const sw = d.timer.kind === "stopwatch";
      return h(`<div class="bub tmini">${ring(timerState(d.timer).progress, 22, sw ? "var(--green)" : "var(--orange)", 3)}</div>`);
    },
    update(el, d) {
      setRing(el.querySelector(".ring"), timerState(d.timer).progress);
    }
  };
  var timerExpanded = {
    name: "timerExpanded",
    size() {
      return { w: 400, h: 140, r: 46 };
    },
    key(d, ctx2) {
      return `tx:${d.timer.kind}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const tm = d.timer;
      const t = ctx2.i.t;
      const sw = tm.kind === "stopwatch";
      const st = timerState(tm);
      const color = sw ? "var(--green)" : "var(--orange)";
      return h(`<div class="tx ${sw ? "sw" : ""}" dir="${ctx2.i.dir()}">
      <div data-s>${ring(st.progress, 92, color, 5, `<span class="tx-ring-ic">${icon(sw ? "timer" : "hourglass", 22, 2.2)}</span>`)}</div>
      <div class="tx-main" data-s>
        <div class="tx-label">${esc(sw ? t("stopwatch") : t("timer"))}</div>
        <div class="tx-time tnum" data-bind="t" dir="ltr">${sw ? ctx2.i.duration(st.elapsed) : ctx2.i.timerText(st.remaining)}</div>
        <div class="tx-sub" data-bind="sub"></div>
      </div>
      <div class="tx-btns" data-s>
        <button class="cbtn sm ${sw ? "green" : "orange"}" data-act="timer.toggle">${icon(tm.running ? "pause" : "play", 18, 0, "", true)}</button>
        ${sw ? `<button class="cbtn sm gray" data-act="timer.reset">${icon("rotate-ccw", 17, 2.2)}</button>` : `<button class="cbtn sm gray" data-act="timer.add">${icon("plus", 18, 2.4)}</button>`}
        <button class="cbtn sm gray" data-act="timer.stop">${icon("x", 18, 2.4)}</button>
      </div>
    </div>`);
    },
    update(el, d, ctx2) {
      const tm = d.timer;
      const st = timerState(tm);
      const sw = tm.kind === "stopwatch";
      bind(el, "t", sw ? ctx2.i.duration(st.elapsed) : ctx2.i.timerText(st.remaining));
      let sub = "";
      if (!sw && tm.running) sub = ctx2.i.t("endsAt", { t: ctx2.i.clock(new Date(tm.endsAt)) });
      else if (!tm.running) sub = ctx2.i.t("paused");
      bind(el, "sub", sub);
      setRing(el.querySelector(".ring"), st.progress);
      const tg = el.querySelector('[data-act="timer.toggle"]');
      const want = tm.running ? "pause" : "play";
      if (tg && tg.dataset.icon !== want) {
        tg.dataset.icon = want;
        tg.innerHTML = icon(want, 18, 0, "", true);
      }
    }
  };
  var timerDone = {
    name: "timerDone",
    size() {
      return { w: 380, h: 92, r: 46 };
    },
    key(d, ctx2) {
      return `tdone:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      return h(`<div class="tdone" dir="${ctx2.i.dir()}">
      <span class="tdone-ic">${icon("alarm-clock", 30, 2.2)}</span>
      <div class="tdone-meta"><div class="tdone-title">${esc(t("timesUp"))}</div>
      <div class="t-dim" dir="auto">${esc(d.label || t("timer"))} \xB7 <span class="tnum" dir="ltr">${ctx2.i.timerText(d.duration || 0)}</span></div></div>
      <button class="cbtn sm gray" data-act="timer.again" title="${esc(t("start"))}">${icon("rotate-ccw", 18, 2.2)}</button>
      <button class="cbtn sm orange" data-act="timer.dismiss" title="${esc(t("dismiss"))}">${icon("x", 20, 2.6)}</button>
    </div>`);
    }
  };
  var findPc = {
    name: "findPc",
    size() {
      return { w: 420, h: 88, r: 44 };
    },
    key(d, ctx2) {
      return `findpc:${d.name}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      return h(`<div class="call findpc" dir="${ctx2.i.dir()}" data-act="findpc.stop">
      <div class="find-ic"><span class="find-wave"></span><span class="find-wave w2"></span>${icon("radar", 24, 2)}</div>
      <div class="call-meta" style="text-align:start">
        <div class="call-name" dir="auto">${esc(t("findPcTitle", { name: d.name || t("phoneTools") }))}</div>
        <div class="call-sub">${esc(t("findPcSub"))}</div>
      </div>
      <div class="call-btns"><button class="cbtn red" data-act="findpc.stop" title="${esc(t("stopSound"))}">${icon("volume-x", 22, 2.2)}</button></div>
    </div>`);
    }
  };
  function fmtBytes(n, ctx2) {
    const v = Number(n) || 0;
    if (v >= 1073741824) return `${ctx2.i.num((v / 1073741824).toFixed(1))} GB`;
    if (v >= 1048576) return `${ctx2.i.num((v / 1048576).toFixed(1))} MB`;
    if (v >= 1024) return `${ctx2.i.num(Math.round(v / 1024))} KB`;
    return `${ctx2.i.num(v)} B`;
  }
  var received = {
    name: "received",
    size(d) {
      return { w: d.kind === "file" ? 452 : 420, h: 80, r: 40 };
    },
    key(d, ctx2) {
      return `recv:${d.id}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      let title = t("receivedFile");
      let ic = "file-down";
      let sub = "";
      let btns = "";
      if (d.kind === "file") {
        if (d.image) {
          title = t("receivedPhoto");
          ic = "image";
        }
        sub = `<bdi>${esc(d.file || "")}</bdi> \xB7 <bdi>${fmtBytes(d.size, ctx2)}</bdi>`;
        btns = `<button class="cbtn sm gray" data-act="recv.show" title="${esc(t("showInFolder"))}">${icon("folder-open", 18, 2.2)}</button>
        <button class="cbtn sm blue" data-act="recv.open" title="${esc(t("open"))}">${icon("external-link", 18, 2.2)}</button>`;
      } else if (d.kind === "url") {
        title = t("receivedLink");
        ic = "link";
        sub = `<bdi dir="ltr">${esc(String(d.url || "").replace(/^https?:\/\//, "").slice(0, 60))}</bdi>${d.opened ? ` \xB7 ${esc(t("linkOpened"))}` : ""}`;
        btns = d.opened ? "" : `<button class="cbtn sm blue" data-act="recv.open" title="${esc(t("open"))}">${icon("external-link", 18, 2.2)}</button>`;
      } else {
        title = t("receivedText");
        ic = "clipboard-check";
        sub = `<bdi>${esc(String(d.text || "").replace(/\s+/g, " ").slice(0, 70))}</bdi>`;
      }
      return h(`<div class="recv" dir="${ctx2.i.dir()}">
      <span class="recv-ic ${d.kind}">${icon(ic, 22, 2.1)}<i class="recv-badge">${icon("smartphone", 9, 2.8)}</i></span>
      <div class="recv-meta"><div class="recv-title">${esc(title)} <span class="t-dim">\xB7 ${esc(t("fromName", { name: d.name || "" }))}</span></div>
        <div class="recv-sub one">${sub}</div></div>
      <div class="recv-btns">${btns}<button class="cbtn sm gray" data-act="recv.close" title="${esc(t("dismiss"))}">${icon("x", 18, 2.6)}</button></div>
    </div>`);
    }
  };
  var transfer = {
    name: "transfer",
    size() {
      return { w: 360, h: 46 };
    },
    key(d) {
      return `xfer:${d.tid}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      const el = h(`<div class="hud xfer" dir="${ctx2.i.dir()}">
      <span class="hud-ic blue">${icon(d.dir === "out" ? "upload" : "download", 17, 2.3)}</span>
      <div class="xfer-meta"><div class="xfer-top"><span class="xfer-name one" dir="auto">${esc(d.name || "")}</span><span class="tnum xfer-pct" data-bind="p"></span></div>
        <div class="xfer-bar"><i></i></div><div class="xfer-sub t-dim">${esc(t(d.dir === "out" ? "sendingTo" : "receivingFrom"))}</div></div>
    </div>`);
      transfer.update(el, d, ctx2);
      return el;
    },
    update(el, d, ctx2) {
      const p = d.total ? Math.min(1, (Number(d.done) || 0) / d.total) : 0;
      const bar = el.querySelector(".xfer-bar i");
      if (bar) bar.style.transform = `scaleX(${p})`;
      bind(el, "p", `${ctx2.i.num(Math.round(p * 100))}%`);
    }
  };
  function subLang(code) {
    const l = import_sub_langs.default.byCode(code);
    return l ? l.name : import_sub_langs.default.short(code);
  }
  function subsEpisode(v, ctx2) {
    if (!v) return "";
    if (v.season !== null && v.season !== void 0) return ctx2.i.t("subsEpisode", { s: ctx2.i.num(v.season), e: ctx2.i.num(v.episode) });
    return v.year ? ctx2.i.num(v.year) : "";
  }
  function subFileIcon(lang, size = 22) {
    return `<span class="sfile-ic">${icon("captions", size, 2)}<i class="sfile-lang">${esc(import_sub_langs.default.short(lang))}</i></span>`;
  }
  var SPIN = (size = 14) => `<span class="spin-ic">${icon("loader", size, 2.4)}</span>`;
  var subsMini = {
    name: "subsMini",
    bubble: true,
    key(d) {
      return `smini:${d.subs.status === "ready" ? "ready" : "busy"}`;
    },
    render(d) {
      const ready = d.subs.status === "ready";
      return h(`<div class="bub smini ${ready ? "ready" : "busy"}" ${ready ? 'draggable="true" data-subdrag="1"' : ""}>${icon("captions", 17, 2.1)}<i class="smini-dot"></i></div>`);
    }
  };
  var subsReady = {
    name: "subsReady",
    size() {
      return { w: 408, h: 64, r: 32 };
    },
    key(d, ctx2) {
      return `sready:${d.file.name}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      return h(`<div class="sready" dir="${ctx2.i.dir()}" draggable="true" data-subdrag="1">
      ${subFileIcon(d.file.lang)}
      <div class="sready-meta"><div class="sready-title">${esc(t("subsReady"))} <span class="t-dim">\xB7 ${esc(subLang(d.file.lang))}</span></div>
        <div class="sready-sub">${esc(t("subsDragHint"))}</div></div>
      <span class="sready-grip">${icon("grip-horizontal", 16, 2.2)}</span>
    </div>`);
    }
  };
  function subsLangsHtml(st) {
    return (st.langs || []).map((c) => `<button class="spn-lang ${c === st.lang ? "on" : ""}" data-act="subs.lang" data-arg="${esc(c)}" title="${esc(subLang(c))}">${esc(import_sub_langs.default.short(c))}</button>`).join("");
  }
  function subsStatusHtml(st, ctx2) {
    const t = ctx2.i.t;
    const btn = (act, label, ic) => `<button class="pill sm" data-act="${act}">${icon(ic, 13, 2.4)} ${esc(label)}</button>`;
    switch (st.status) {
      case "searching":
        return `<div class="spn-status">${SPIN(16)}<span>${esc(t("subsSearching"))}</span></div>`;
      case "downloading":
        return `<div class="spn-status">${SPIN(16)}<span>${esc(t("subsDownloading"))}</span></div>`;
      case "found":
        return `<div class="spn-status">${icon("arrow-down", 16, 2.2)}<span>${esc(t("subsPick"))}</span></div>`;
      case "nokey":
        return `<div class="spn-status warn">${icon("triangle-alert", 16, 2.2)}<span>${esc(t("subsNoKey"))}</span>${btn("subs.settings", t("settings"), "settings")}</div>`;
      case "off":
        return `<div class="spn-status">${icon("eye-off", 16, 2.2)}<span>${esc(t("subsOff"))}</span>${btn("subs.settings", t("settings"), "settings")}</div>`;
      case "error":
        return `<div class="spn-status warn">${icon("triangle-alert", 16, 2.2)}<span>${esc(t(`subsErr_${st.error && st.error.code || "other"}`))}</span>${btn("subs.retry", t("retry"), "rotate-cw")}</div>`;
      case "empty":
        return `<div class="spn-status">${icon("search", 16, 2.2)}<span>${esc(t("subsNone"))}</span></div>`;
      default:
        return `<div class="spn-status">${SPIN(16)}<span>${esc(t("subsSearching"))}</span></div>`;
    }
  }
  function subsBodyHtml(st, ctx2) {
    const t = ctx2.i.t;
    let top;
    if (st.file) {
      const busy = st.downloading ? SPIN(15) : "";
      top = `<div class="spn-file" draggable="true" data-subdrag="1" title="${esc(st.file.release || st.file.name)}">
      ${subFileIcon(st.file.lang)}
      <div class="spn-file-meta"><div class="spn-file-name" dir="ltr">${esc(st.file.name)}</div>
        <div class="spn-file-hint">${icon("grip-horizontal", 12, 2.4)} ${esc(t("subsDragHint"))} \xB7 ${esc(import_sub_langs.default.PROVIDER_NAMES[st.file.provider] || "")}</div></div>
      ${busy}
      <button class="ib sm" data-act="subs.reveal" title="${esc(t("showInFolder"))}">${icon("folder-open", 16)}</button>
    </div>`;
    } else {
      top = subsStatusHtml(st, ctx2);
      if (!(st.results || []).length) top = top.replace('class="spn-status', 'class="spn-status big');
    }
    const notes = [];
    if (st.fallback) notes.push(t("subsFallback", { lang: subLang(st.fallback.from), other: subLang(st.fallback.to) }));
    if (st.error && st.file) notes.push(t(`subsErr_${st.error.code || "other"}`));
    if (st.error && !st.file && st.status !== "error" && st.error.download) notes.push(t(`subsErr_${st.error.code || "other"}`));
    const note = notes.length ? `<div class="spn-note">${esc(notes.join(" \xB7 "))}</div>` : "";
    const rows = (st.results || []).map((r) => {
      const on = r.id === st.selected;
      const dl = r.id === st.downloading;
      const lead = dl ? SPIN(13) : on ? icon("check", 13, 3) : icon("captions", 13, 2);
      return `<button class="spn-row ${on ? "on" : ""} ${dl ? "dl" : ""}" data-act="subs.choose" data-arg="${esc(r.id)}" title="${esc(r.name)}">
      <span class="spn-row-ic">${lead}</span>
      <span class="spn-rel" dir="ltr">${esc(r.name)}</span>
      ${r.hash ? `<span class="stag green">${esc(t("subsExact"))}</span>` : ""}
      ${r.hi ? '<span class="stag">HI</span>' : ""}
      ${r.lang && r.lang !== st.lang ? `<span class="stag">${esc(import_sub_langs.default.short(r.lang))}</span>` : ""}
      <span class="stag prov">${esc(import_sub_langs.default.PROVIDER_NAMES[r.provider] || r.provider)}</span>
    </button>`;
    }).join("");
    const searchingMore = st.file && st.searching ? `<div class="spn-more">${SPIN(12)} ${esc(t("subsSearching"))}</div>` : "";
    const list = rows ? `<div class="spn-cap">${esc(t("subsOthers"))}</div><div class="spn-list scroll">${rows}</div>` : searchingMore;
    return `${top}${note}${list}`;
  }
  var subsPanel = {
    name: "subsPanel",
    size() {
      return { w: 468, h: 304, r: 40 };
    },
    key(d, ctx2) {
      return `spanel:${d.subs.video ? d.subs.video.key : ""}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const st = d.subs;
      const v = st.video || {};
      const t = ctx2.i.t;
      const q = st.query && st.query.manual ? st.query.title : v.title || "";
      const sub = [subsEpisode(v, ctx2), v.app].filter(Boolean).join(" \xB7 ");
      return h(`<div class="spn" dir="${ctx2.i.dir()}">
      <div class="spn-head" data-s>
        <span class="spn-cc">${icon("captions", 19, 2)}</span>
        <div class="spn-meta"><div class="spn-title" dir="auto">${esc(v.title || t("subsTitle"))}</div><div class="spn-sub">${esc(sub)}</div></div>
        <div class="spn-langs"></div>
        <button class="ib sm" data-act="subs.settings" title="${esc(t("settings"))}">${icon("settings", 16)}</button>
        <button class="ib sm" data-act="subs.close" title="${esc(t("dismiss"))}">${icon("x", 17)}</button>
      </div>
      <div class="spn-body" data-s></div>
      <form class="spn-search" data-form="subs" data-s>
        <span class="spn-search-ic">${icon("search", 14, 2.4)}</span>
        <input name="q" type="text" maxlength="120" dir="auto" spellcheck="false" placeholder="${esc(t("subsSearchPh"))}" value="${esc(q)}">
        <button class="pill sm accent" type="submit">${esc(t("subsSearch"))}</button>
      </form>
    </div>`);
    },
    update(el, d, ctx2) {
      const st = d.subs;
      const sig = JSON.stringify([st.status, st.lang, st.langs, st.file, st.selected, st.downloading, st.searching, st.error, st.fallback, (st.results || []).map((r) => r.id), ctx2.i.lang()]);
      if (el.dataset.sig === sig) return;
      el.dataset.sig = sig;
      const body = el.querySelector(".spn-body");
      const list = body.querySelector(".spn-list");
      const scroll = list ? list.scrollTop : 0;
      el.querySelector(".spn-langs").innerHTML = subsLangsHtml(st);
      body.innerHTML = subsBodyHtml(st, ctx2);
      const nl = body.querySelector(".spn-list");
      if (nl) nl.scrollTop = scroll;
    }
  };
  var TABS = [
    ["home", "house"],
    ["alerts", "bell"],
    ["apps", "app-window"],
    ["planner", "calendar-check"],
    ["weather", "cloud-sun"],
    ["tools", "timer"],
    ["gaming", "gamepad-2"],
    ["shelf", "folder-open"],
    ["clipboard", "clipboard"]
  ];
  var QUICK = [
    ["screenshot", "scan"],
    ["lock", "lock"],
    ["phonelink", "smartphone"],
    ["explorer", "folder"],
    ["calc", "calculator"],
    ["taskmgr", "activity"],
    ["winsettings", "settings"],
    ["focus", "moon"]
  ];
  function shortcutTile(s) {
    const look = import_deck_meta.default.keyLook(s);
    const inner = s.icon ? `<img src="${esc(s.icon)}" alt="" draggable="false">` : look.glyph ? icon(look.glyph, 16) : `<span class="qa-letter">${esc(initials(s.name)[0] || "?")}</span>`;
    return `<button class="qa" data-act="app.launch" data-arg="${esc(s.id)}" title="${esc(s.name)}"${look.color && !s.icon ? ` style="color:${look.color}"` : ""}>${inner}</button>`;
  }
  function weatherLine(d, ctx2) {
    const w = d.weather;
    if (!w || !w.current) return "";
    const info = wxInfo(w.current.code, w.current.isDay);
    return `<button class="home-wx" data-act="tab" data-arg="weather" style="--wxc:${wxColor(w.current.code, w.current.isDay)}">
    ${wxIcon(w.current.code, w.current.isDay, 16)}<b class="tnum">${ctx2.i.temp(w.current.temp)}</b><span>${esc(ctx2.i.t(info.key))} \xB7 ${esc(w.city)}</span></button>`;
  }
  var TILE_TITLE = { clock: "w_clock", quick: "w_quick", media: "w_media", sys: "w_sys", widgets: "w_widgets", crypto: "crypto", news: "news", clocks: "clocks", weather: "weather", tasks: "planner" };
  function tileStyle(r) {
    const p = import_home_layout.default.rectPx(r);
    return `inset-inline-start:${p.x}px;top:${p.y}px;width:${p.w}px;height:${p.h}px`;
  }
  function playerHtml(d, ctx2) {
    const t = ctx2.i.t;
    const m = d.media;
    if (!m) return `<div class="mini-player empty">${icon("music", 26, 1.8)}<span>${esc(t("nothingPlaying"))}</span></div>`;
    return `<div class="mini-player ${m.status === "playing" ? "playing" : ""}">
        <div class="mp-top" dir="ltr">
          ${art(m.art, "md", m.colors, m.video)}
          <div class="mp-meta"><div class="mp-title marquee" dir="auto"><span>${esc(m.title || t("nowPlaying"))}</span></div>
          <div class="mp-artist" dir="auto">${m.phone ? icon("smartphone", 11, 2.4) : ""}${esc(mediaSub(m))}</div></div>
        </div>
        <div class="mp-prog" dir="ltr">
          <div class="prog thin ${m.canSeek ? "seekable" : ""} ${m.duration ? "" : "nodur"}" data-slider="seek"><div class="prog-fill"></div><div class="prog-knob"></div></div>
          <div class="mp-times tnum"><span data-bind="mpel"></span><span data-bind="mprem"></span></div>
        </div>
        <div class="mp-ctrl" dir="ltr">
          <button class="ib sm" data-act="media.prev">${icon("skip-back", 18, 0, "", true)}</button>
          <button class="ib" data-act="media.toggle">${icon(m.status === "playing" ? "pause" : "play", 24, 0, "pp", true)}</button>
          <button class="ib sm" data-act="media.next">${icon("skip-forward", 18, 0, "", true)}</button>
        </div>
      </div>`;
  }
  function weatherTile(d, ctx2) {
    const t = ctx2.i.t;
    const w = d.weather;
    if (!w || !w.current) return `<button class="h-wx empty" data-act="action" data-arg="settings" data-arg2="weather">${icon("map-pin", 20, 1.8)}<span>${esc(t("city"))}</span></button>`;
    const c = w.current;
    const info = wxInfo(c.code, c.isDay);
    const today = w.daily && w.daily[0];
    const days = (w.daily || []).slice(1, 5);
    return `<button class="h-wx" data-act="tab" data-arg="weather" style="--wxc:${wxColor(c.code, c.isDay)}">
    <div class="hwx-now">${wxIcon(c.code, c.isDay, 30)}<b class="tnum">${ctx2.i.temp(c.temp)}</b></div>
    <div class="hwx-cond">${esc(t(info.key))}</div>
    <div class="hwx-city">${icon("map-pin", 10, 2.6)}<span>${esc(w.city)}</span>${today ? `<i class="tnum" dir="ltr">\u2191${ctx2.i.temp(today.max)} \u2193${ctx2.i.temp(today.min)}</i>` : ""}</div>
    ${days.length ? `<div class="hwx-days">${days.map((dd) => `<span><small>${esc(ctx2.i.weekdayShort(/* @__PURE__ */ new Date(`${dd.date}T12:00:00`)))}</small><em style="color:${wxColor(dd.code, true)}">${icon(wxInfo(dd.code, true).ic, 14, 2)}</em><b class="tnum">${ctx2.i.temp(dd.max)}</b></span>`).join("")}</div>` : ""}
  </button>`;
  }
  function todayTasks(d) {
    const today = isoOf(/* @__PURE__ */ new Date());
    return (d.tasks || []).filter((x) => x.date === today).sort((a, b) => a.done - b.done || (a.time || "99").localeCompare(b.time || "99"));
  }
  function tasksTile(d, ctx2) {
    const t = ctx2.i.t;
    const list = todayTasks(d);
    const left = list.filter((x) => !x.done).length;
    return `<div class="h-tasks"><button class="ht-head" data-act="tab" data-arg="planner">${icon("list-checks", 13, 2.2)}<b>${esc(t("today"))}</b>
    <span class="t-dim">${list.length ? left ? esc(t("tasksLeft", { n: ctx2.i.digits(left) })) : esc(t("allDone")) : ""}</span></button>
    <div class="ht-list scroll">${list.length ? list.map((x) => `<div class="task ${x.done ? "done" : ""}" data-color="${esc(x.color || "blue")}">
      <button class="tcheck" data-act="task.toggle" data-arg="${esc(x.id)}">${x.done ? icon("check", 12, 3.2) : ""}</button>
      <span class="ttitle" dir="auto">${esc(x.title)}</span>${x.time ? `<span class="ttime tnum" dir="ltr">${ctx2.i.digits(x.time)}</span>` : ""}</div>`).join("") : `<div class="tasks-empty">${icon("calendar-check", 20, 1.8)}<span>${esc(t("noTasks"))}</span></div>`}</div></div>`;
  }
  function tileBody(r, d, ctx2) {
    const t = ctx2.i.t;
    switch (r.t) {
      case "clock": {
        const dt = ctx2.i.dates();
        return `<div class="home-clock">
      <div class="big-time tnum" data-bind="clock" dir="ltr">${ctx2.i.clock()}</div>
      <div class="home-date"><b>${esc(dt.weekday)}</b> ${esc(dt.primary)}</div>
      ${dt.secondary ? `<div class="home-date2" dir="ltr">${esc(dt.secondary)}</div>` : ""}
      ${weatherLine(d, ctx2)}
    </div>`;
      }
      case "quick": {
        const p = import_home_layout.default.rectPx(r);
        const n = Math.max(1, Math.floor((p.w + 5) / 35)) * Math.max(1, Math.floor((p.h + 5) / 35));
        const list = (d.shortcuts || []).slice(0, n);
        const quick = list.length ? list.map((s) => shortcutTile(s)).join("") : QUICK.slice(0, Math.max(1, n - 1)).map(([k, ic]) => `<button class="qa" data-act="action" data-arg="${k}" title="${esc(t(k))}">${icon(ic, 16)}</button>`).join("") + (n > 1 ? `<button class="qa" data-act="tab" data-arg="apps" title="${esc(t("apps"))}">${icon("plus", 16)}</button>` : "");
        return `<div class="qa-row">${quick}</div>`;
      }
      case "media":
        return playerHtml(d, ctx2);
      case "sys":
        return '<div class="sys" data-sys></div>';
      case "widgets":
        return widgetList(d).length ? '<div class="wcard" data-widget></div>' : `<div class="wcard"><div class="w-empty">${icon("layout-grid", 18, 2)}<span>${esc(t("w_widgets"))}</span></div></div>`;
      case "crypto":
      case "news":
      case "clocks":
        return `<div class="wcard solo" data-solo="${r.t}"></div>`;
      case "weather":
        return weatherTile(d, ctx2);
      case "tasks":
        return tasksTile(d, ctx2);
      default:
        return "";
    }
  }
  function homeTab(d, ctx2) {
    const t = ctx2.i.t;
    const list = import_home_layout.default.normalize(d.home);
    const edit = !!d.homeEdit;
    const tiles = list.map((r) => `<div class="h-tile t-${r.t}${d.homeNew === r.t ? " pop" : ""}" data-tile="${r.t}" style="${tileStyle(r)}">
      <div class="h-body">${tileBody(r, d, ctx2)}</div>
      ${edit ? `<button class="h-x" data-act="home.remove" data-arg="${r.t}" title="${esc(t("remove"))}">${icon("x", 11, 3)}</button><span class="h-resize"></span>` : ""}
    </div>`).join("");
    const empty = list.length ? "" : `<div class="empty-state">${icon("layout-dashboard", 28, 1.8)}<span>${esc(t("homeEmpty"))}</span>
      ${edit ? "" : `<button class="pill accent" data-act="home.edit">${icon("plus", 14, 2.4)} ${esc(t("editLayout"))}</button>`}</div>`;
    return `<div class="home2${edit ? " editing" : ""}">${edit ? '<div class="h-cells"></div>' : ""}${tiles}${empty}</div>`;
  }
  function editBarHtml(d, ctx2) {
    const t = ctx2.i.t;
    const miss = import_home_layout.default.missing(import_home_layout.default.normalize(d.home));
    const labels = miss.length <= 5;
    const add = d.homeNoRoom ? `<span class="eb-warn">${icon("triangle-alert", 13, 2.4)}${esc(t("noRoom"))}</span>` : miss.length ? miss.map((k) => `<button class="eb-chip" data-act="home.add" data-arg="${k}" title="${esc(t("addWidget"))}: ${esc(t(TILE_TITLE[k]))}">${icon("plus", 10, 3.2)}${icon(import_home_layout.default.WIDGETS[k].icon, 13, 2.2)}${labels ? `<span>${esc(t(TILE_TITLE[k]))}</span>` : ""}</button>`).join("") : `<span class="t-dim eb-hint">${esc(t("editHint"))}</span>`;
    return `<div class="eb-add">${add}</div>
    <div class="eb-end"><button class="ib sm" data-act="home.reset" title="${esc(t("resetLayout"))}">${icon("rotate-ccw", 15)}</button>
    <button class="pill xs accent" data-act="home.done">${icon("check", 12, 3)} ${esc(t("done"))}</button></div>`;
  }
  function soloHtml(kind, d, ctx2) {
    const w = d.widgets || {};
    const ic = WIDGETS.find(([k]) => k === kind)[1];
    let meta = "";
    if (kind === "crypto" && w.crypto && w.crypto.items && w.crypto.items.length) meta = "USD";
    const cfg = d.widgetsCfg || {};
    const body = kind === "crypto" ? cryptoHtml(w.crypto, ctx2) : kind === "news" ? newsHtml(w.news, ctx2) : clocksHtml(cfg.clocks && cfg.clocks.zones, ctx2);
    return `<div class="w-head"><span class="w-title">${icon(ic, 13, 2.2)}<span>${esc(ctx2.i.t(kind))}</span></span>${meta ? `<span class="w-meta">${esc(meta)}</span>` : ""}</div><div class="w-body">${body}</div>`;
  }
  function sysHtml(d, ctx2) {
    const s = d.stats || {};
    const t = ctx2.i.t;
    const meters = [[t("cpu"), s.cpu || 0, "var(--accent)"], [t("ram"), s.ram || 0, "var(--purple)"]];
    if (s.gpu !== null && s.gpu !== void 0) meters.splice(1, 0, [t("gpu"), s.gpu, "var(--green)"]);
    else if (d.battery && d.battery.has) meters.push([t("battery"), d.battery.percent, "var(--green)"]);
    const net = d.net || { down: 0, up: 0 };
    return `<div class="meters">${meters.map(([label, v, c]) => `
      <div class="meter" style="--mc:${c}"><div class="meter-top"><span>${esc(label)}</span><b class="tnum">${ctx2.i.num(v)}<small>%</small></b></div>
      <div class="meter-bar"><i style="width:${clamp(v, 0, 100).toFixed(1)}%"></i></div></div>`).join("")}</div>
    <div class="sys-net tnum" dir="ltr"><span class="dn">${icon("arrow-down", 11, 2.8)}${ctx2.i.bytes(net.down)}/s</span><span class="up">${icon("arrow-up", 11, 2.8)}${ctx2.i.bytes(net.up)}/s</span>
    ${s.gpuTemp ? `<span class="tmp">${icon("thermometer", 11, 2.4)}${ctx2.i.num(s.gpuTemp)}\xB0</span>` : ""}</div>`;
  }
  var WIDGETS = [["crypto", "bitcoin"], ["news", "newspaper"], ["clocks", "globe"]];
  function widgetList(d) {
    const cfg = d.widgetsCfg;
    if (!cfg || cfg.module === false) return [];
    return WIDGETS.filter(([k]) => !cfg[k] || cfg[k].enabled !== false);
  }
  function priceText(v, cur, ctx2) {
    if (!Number.isFinite(v)) return "\u2013";
    const frac = v >= 1e3 ? 0 : v >= 1 ? 2 : 4;
    return `$${ctx2.i.numFmt(v, { minimumFractionDigits: frac, maximumFractionDigits: frac })}`;
  }
  var COIN_HUE = { BTC: 33, ETH: 230, USDT: 160, BNB: 45, SOL: 280, XRP: 210, TON: 200, DOGE: 48, TRX: 355, ADA: 220, LTC: 215, NOT: 0 };
  function cryptoHtml(w, ctx2) {
    const t = ctx2.i.t;
    if (!w) return `<div class="w-empty">${icon("loader", 18, 2, "spin")}<span>${esc(t("loading"))}</span></div>`;
    if (w.error && !(w.items || []).length) return `<div class="w-empty">${icon("wifi-off", 18, 2)}<span>${esc(t("widgetError"))}</span><button class="link" data-act="widget.refresh" data-arg="crypto">${esc(t("retry"))}</button></div>`;
    return `<div class="coins">${(w.items || []).map((c) => {
      const up = c.change >= 0;
      return `<div class="coin" dir="ltr"><span class="coin-sym" style="--h:${COIN_HUE[c.sym] !== void 0 ? COIN_HUE[c.sym] : hashHue(c.sym)}">${esc(c.sym)}</span>
      <span class="coin-price tnum">${priceText(c.price, w.currency, ctx2)}</span>
      <span class="coin-ch tnum ${up ? "up" : "down"}">${up ? "\u25B2" : "\u25BC"}${ctx2.i.numFmt(Math.abs(c.change), { maximumFractionDigits: 1, minimumFractionDigits: 1 })}%</span></div>`;
    }).join("")}</div>`;
  }
  function newsHtml(w, ctx2) {
    const t = ctx2.i.t;
    if (!w) return `<div class="w-empty">${icon("loader", 18, 2, "spin")}<span>${esc(t("loading"))}</span></div>`;
    const items = w.items || [];
    const failed = w.error || w.failed && w.failed.length;
    if (!items.length) return `<div class="w-empty">${icon(failed ? "wifi-off" : "newspaper", 18, 2)}<span>${esc(t(failed ? "widgetError" : "noNews"))}</span><button class="link" data-act="widget.refresh" data-arg="news">${esc(t("retry"))}</button></div>`;
    return `<div class="news scroll">${items.slice(0, 20).map((n) => `
    <button class="news-item" data-act="openUrl" data-arg="${esc(n.link)}" dir="${isRtl(n.title) ? "rtl" : "ltr"}" title="${esc(n.title)}">
      <span class="news-t">${esc(n.title)}</span><span class="news-m">${esc(n.feed)}${n.time ? ` \xB7 ${esc(ctx2.i.ago(n.time))}` : ""}</span></button>`).join("")}</div>`;
  }
  var DEFAULT_ZONES = ["Europe/London", "America/New_York", "Europe/Paris", "Asia/Tokyo"];
  function clocksHtml(zones, ctx2) {
    if (!zones || !zones.length) zones = DEFAULT_ZONES;
    const now = /* @__PURE__ */ new Date();
    const localDay = now.getDate();
    return `<div class="clocks">${(zones || []).slice(0, 5).map((tz) => {
      let hh = 0;
      let mm = 0;
      let day = localDay;
      try {
        const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", day: "numeric", hourCycle: "h23" }).formatToParts(now).filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
        hh = parts.hour;
        mm = parts.minute;
        day = parts.day;
      } catch (_) {
        return "";
      }
      const night = hh < 6 || hh >= 19;
      const rel = day === localDay ? "" : day > localDay || localDay > 25 && day < 3 ? "+1" : "\u22121";
      return `<div class="clock-row"><span class="clk-ic ${night ? "night" : "day"}">${icon(night ? "moon" : "sun", 12, 2.4)}</span>
      <span class="clk-city">${esc(cityName(tz, ctx2.i.lang()))}</span>
      ${rel ? `<span class="clk-rel tnum" dir="ltr">${rel}</span>` : ""}
      <b class="clk-time tnum" dir="ltr">${ctx2.i.digits(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`)}</b></div>`;
    }).join("")}</div>`;
  }
  function widgetHtml(d, ctx2) {
    const list = widgetList(d);
    if (!list.length) return "";
    const active = list.some(([k]) => k === d.widgetActive) ? d.widgetActive : list[0][0];
    const w = d.widgets || {};
    let meta = "";
    if (active === "crypto" && w.crypto && w.crypto.items && w.crypto.items.length) meta = "USD";
    const body = active === "crypto" ? cryptoHtml(w.crypto, ctx2) : active === "news" ? newsHtml(w.news, ctx2) : clocksHtml(d.widgetsCfg.clocks && d.widgetsCfg.clocks.zones, ctx2);
    return `<div class="w-head"><div class="w-tabs">${list.map(([k, ic]) => `<button class="w-tab ${k === active ? "on" : ""}" data-act="widget" data-arg="${k}" title="${esc(ctx2.i.t(k))}">${icon(ic, 13, 2.2)}${k === active ? `<span>${esc(ctx2.i.t(k))}</span>` : ""}</button>`).join("")}</div>
    ${meta ? `<span class="w-meta">${esc(meta)}</span>` : ""}</div><div class="w-body">${body}</div>`;
  }
  function alertsTab(d, ctx2) {
    const t = ctx2.i.t;
    const list = d.notifHistory || [];
    if (!list.length) return `<div class="empty-state">${icon("bell-off", 28, 1.8)}<span>${esc(t("alertsEmpty"))}</span></div>`;
    return `<div class="list-head"><span class="t-dim">${ctx2.i.num(list.length)} ${esc(t("notifications"))}</span><button class="link" data-act="alerts.clear">${esc(t("clearAll"))}</button></div>
    <div class="list scroll">${list.slice(0, 40).map((n) => `
      <div class="row alert-row" data-act="alerts.open" data-arg="${esc(n.id)}" dir="${isRtl(`${n.title} ${n.body}`) ? "rtl" : "ltr"}">
        ${avatar(n.avatar || n.appIcon, n.title || n.appName, { size: "sm", badge: n.app && n.app.phone ? icon("smartphone", 8, 2.8) : null })}
        <div class="row-body"><div class="row-title"><span>${esc(n.title || n.appName)}</span><span class="t-dim">${esc(n.appName)} \xB7 ${esc(ctx2.i.ago(n.time))}</span></div>
        <div class="row-text">${esc(ctx2.s.notifications.showBody === false ? "" : n.body)}</div></div>
        <button class="row-x" data-act="alerts.dismiss" data-arg="${esc(n.id)}" title="${esc(t("dismiss"))}">${icon("x", 12, 2.6)}</button>
      </div>`).join("")}</div>`;
  }
  function deckKey(s) {
    const look = import_deck_meta.default.keyLook(s);
    const [kw, kh] = look.size.split("x").map(Number);
    const face = s.icon ? `<img src="${esc(s.icon)}" alt="" draggable="false">` : look.glyph ? icon(look.glyph, 24, 1.9) : `<span class="dk-letter">${esc(initials(s.name)[0] || "?")}</span>`;
    const tip = s.kind === "hotkey" && s.target ? `${s.name} \xB7 ${s.target}` : s.name;
    return `<button class="dk k-${esc(s.kind || "file")}${kw > 1 ? " w2" : ""}${kh > 1 ? " h2" : ""}${look.color ? " tint" : ""}" data-act="app.launch" data-arg="${esc(s.id)}" title="${esc(tip)}"${look.color ? ` style="--kc:${look.color}"` : ""}>
    <span class="dk-face">${face}</span><span class="dk-label" dir="auto">${esc(s.name)}</span></button>`;
  }
  function appsTab(d, ctx2) {
    const t = ctx2.i.t;
    const list = d.shortcuts || [];
    if (!list.length) {
      return `<div class="empty-state">${icon("layout-grid", 28, 1.8)}<span>${esc(t("appsEmpty"))}</span>
      <button class="pill accent" data-act="action" data-arg="settings" data-arg2="shortcuts">${icon("plus", 14, 2.4)} ${esc(t("addApp"))}</button></div>`;
    }
    const size = ["s", "m", "l"].includes(d.deckSize) ? d.deckSize : "m";
    const g = import_deck_meta.default.deckGrid(size);
    return `<div class="deck-plate"><div class="deck scroll size-${size}" style="--dc:${g.cols};--du:${g.unit}px">${list.map(deckKey).join("")}
    <button class="dk add" data-act="action" data-arg="settings" data-arg2="shortcuts" title="${esc(t("addApp"))}">${icon("plus", 20, 2)}</button></div></div>`;
  }
  function weatherTab(d, ctx2) {
    const t = ctx2.i.t;
    const w = d.weather;
    if (!w || !w.current) {
      const err = w && w.error;
      return `<div class="empty-state">${icon(err ? "cloud-fog" : "map-pin", 28, 1.8)}<span>${esc(err ? t("weatherError") : t("weatherEmpty"))}</span>
      <button class="pill accent" data-act="action" data-arg="settings" data-arg2="weather">${icon("search", 14, 2.4)} ${esc(t("city"))}</button></div>`;
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
      <div class="wx-city">${icon("map-pin", 12, 2.4)} ${esc(w.city)}</div>
      <div class="wx-big">${wxIcon(c.code, c.isDay, 40, "big")}<span class="wx-temp tnum">${ctx2.i.temp(c.temp)}</span></div>
      <div class="wx-cond">${esc(t(info.key))}${today ? ` \xB7 <span class="tnum" dir="ltr">\u2191${ctx2.i.temp(today.max)} \u2193${ctx2.i.temp(today.min)}</span>` : ""}</div>
      <div class="wx-meta">
        <span>${icon("thermometer", 12, 2.4)} ${esc(t("feelsLike", { t: ctx2.i.temp(c.feels) }))}</span>
        <span>${icon("droplets", 12, 2.4)} ${ctx2.i.num(c.humidity)}%</span>
        <span>${icon("wind", 12, 2.4)} ${ctx2.i.num(c.wind)} ${esc(t("kmh"))}</span>
      </div>
    </div>
    <div class="wx-right">
      <div class="wx-hours" dir="ltr">${hours.map((hh, i) => `<div class="wx-h">
        <span class="t-dim tnum">${i === 0 ? esc(t("now")) : ctx2.i.hour(new Date(hh.time))}</span>
        <span style="color:${wxColor(hh.code, hh.isDay)}">${icon(wxInfo(hh.code, hh.isDay).ic, 17, 2)}</span>
        <b class="tnum">${ctx2.i.temp(hh.temp)}</b></div>`).join("")}</div>
      <div class="wx-days">${days.slice(0, 5).map((dd, i) => {
      const from = (dd.min - allMin) / span * 100;
      const to = (dd.max - allMin) / span * 100;
      return `<div class="wx-d">
        <span class="wx-dn">${i === 0 ? esc(t("today")) : esc(ctx2.i.weekdayShort(/* @__PURE__ */ new Date(`${dd.date}T12:00:00`)))}</span>
        <span style="color:${wxColor(dd.code, true)}">${icon(wxInfo(dd.code, true).ic, 15, 2)}</span>
        <span class="tnum t-dim">${ctx2.i.temp(dd.min)}</span>
        <span class="wx-bar" dir="ltr"><i style="left:${from.toFixed(1)}%;right:${(100 - to).toFixed(1)}%"></i></span>
        <span class="tnum">${ctx2.i.temp(dd.max)}</span>
      </div>`;
    }).join("")}</div>
    </div>
  </div>`;
  }
  function phoneToolsCard(d, ctx2) {
    const t = ctx2.i.t;
    const p = d.phoneDevice;
    if (!p) return `<div class="phone-strip off">${icon("smartphone", 15, 2.2)}<span class="t-dim one">${esc(t("noPhoneConnected"))}</span></div>`;
    const via = p.bluetooth && !p.wifi ? `<span class="via bt">${icon("bluetooth", 11, 2.4)} ${esc(t("viaBluetooth"))}</span>` : `<span class="via">${icon("wifi", 11, 2.4)} ${esc(t("viaWifi"))}</span>`;
    const btn = (act, ic, label, on = true) => on ? `<button class="pt-btn" data-act="${act}" title="${esc(label)}">${icon(ic, 15, 2.2)}<span>${esc(label)}</span></button>` : "";
    return `<div class="phone-strip">
    <div class="ps-name">${icon("smartphone", 15, 2.2)}<span class="one" dir="auto">${esc(p.name)}</span>${via}</div>
    <div class="pt-row">${btn("phone.find", "bell-ring", t("findPhone"))}${btn("phone.clip", "clipboard", t("sendClipboard"))}${btn("phone.camera", "camera", t("takePhoto"), !!p.island)}${btn("phone.sendFile", "file-up", t("sendFile"))}</div>
  </div>`;
  }
  function toolsTab(d, ctx2) {
    const t = ctx2.i.t;
    const presets = [1, 3, 5, 10, 15, 25, 30, 45, 60];
    return `<div class="tools">
    <div class="tool-card">
      <div class="tool-title">${icon("hourglass", 15, 2.2)} ${esc(t("timer"))}</div>
      ${(d.sharedTimers || []).map((timer2) => `<div class="row"><button class="link" data-act="timer.selectShared" data-arg="${esc(timer2.id)}">${esc(timer2.label || t("timer"))} \xB7 ${ctx2.i.num(Math.max(0, Math.ceil((timer2.endsAt - Date.now()) / 6e4)))} ${esc(t("minutes"))}</button><button class="ib sm" data-act="timer.cancelShared" data-arg="${esc(timer2.id)}" title="${esc(t("cancel"))}">${icon("x", 14)}</button></div>`).join("")}
      <div class="chips">${presets.map((m) => `<button class="chip-btn" data-act="timer.start" data-arg="${m * 60}">${ctx2.i.num(m)}<small>${esc(t("minutes"))}</small></button>`).join("")}</div>
      <form class="custom-timer" data-form="timer" dir="ltr">
        <input type="number" name="min" min="1" max="600" placeholder="${esc(t("custom"))}" inputmode="numeric">
        <button class="pill accent" type="submit">${icon("play", 13, 0, "", true)} ${esc(t("start"))}</button>
        <button class="pill" type="button" data-act="stopwatch.start">${icon("timer", 14, 2.2)} ${esc(t("stopwatch"))}</button>
      </form>
    </div>
    <div class="tool-card">
      <div class="tool-title">${icon("layout-grid", 15, 2.2)} ${esc(t("quickActions"))}</div>
      <div class="qa-grid">${QUICK.map(([k, ic]) => `<button class="qa-tile" data-act="action" data-arg="${k}" title="${esc(t(k))}">${icon(ic, 18)}<span>${esc(t(k))}</span></button>`).join("")}</div>
    </div>
    ${phoneToolsCard(d, ctx2)}
  </div>`;
  }
  function shelfTab(d, ctx2) {
    const t = ctx2.i.t;
    const items = d.shelf || [];
    if (!items.length) return `<div class="empty-state drop-hint">${icon("download", 30, 1.8)}<span>${esc(t("shelfEmpty"))}</span></div>`;
    return `<div class="list-head"><span class="t-dim">${ctx2.i.num(items.length)} ${esc(t("items"))} \xB7 ${esc(t("shelfTip"))}</span><button class="link" data-act="shelf.clear">${esc(t("clearAll"))}</button></div>
    <div class="shelf-grid scroll">${items.map((f) => `
      <div class="file" draggable="true" data-drag="${esc(f.path)}" data-act="shelf.open" data-arg="${esc(f.path)}" title="${esc(f.path)}">
        <button class="file-x" data-act="shelf.remove" data-arg="${esc(f.path)}">${icon("x", 11, 3)}</button>
        ${d.phoneDevice && !f.isDir ? `<button class="file-ph" data-act="shelf.toPhone" data-arg="${esc(f.path)}" title="${esc(t("toPhone"))}">${icon("smartphone", 11, 2.6)}</button>` : ""}
        ${f.icon ? `<img src="${esc(f.icon)}" alt="" draggable="false">` : icon(f.isDir ? "folder" : "file", 30, 1.6)}
        <span dir="auto">${esc(f.name)}</span>
      </div>`).join("")}</div>`;
  }
  function clipboardTab(d, ctx2) {
    const t = ctx2.i.t;
    const items = d.clipHistory || [];
    if (!items.length) return `<div class="empty-state">${icon("clipboard", 28, 1.8)}<span>${esc(t("clipboardEmpty"))}</span></div>`;
    return `<div class="list-head"><span class="t-dim">${esc(t("clickToCopy"))}</span><button class="link" data-act="clip.clear">${esc(t("clearAll"))}</button></div>
    <div class="list scroll">${items.map((c) => `
      <div class="row cliprow" data-act="clip.copy" data-arg="${esc(c.id)}" dir="${isRtl(c.text) ? "rtl" : "ltr"}">
        <span class="clip-ic">${icon(c.kind === "image" ? "image" : c.kind === "file" ? "file" : "file-text", 16, 2)}</span>
        ${c.kind === "image" && c.thumb ? `<img class="clip-thumb" src="${esc(c.thumb)}" alt="">` : ""}
        <div class="row-text one">${esc((c.text || "").replace(/\s+/g, " ").slice(0, 160))}</div>
        <span class="t-dim tnum">${esc(ctx2.i.ago(c.time))}</span>
      </div>`).join("")}</div>`;
  }
  function weekStartFor(lang) {
    if (lang === "ar") return 6;
    return lang === "en" ? 0 : 1;
  }
  function plannerTab(d, ctx2) {
    const t = ctx2.i.t;
    const p = d.planner;
    const lang = ctx2.i.lang();
    const ws = weekStartFor(lang);
    const cells = monthGrid(p.ym, ws);
    const todayIso = isoOf(/* @__PURE__ */ new Date());
    const byDay = {};
    for (const task of d.tasks || []) (byDay[task.date] = byDay[task.date] || []).push(task);
    const inMonth = cells.filter((c) => c.inMonth);
    const firstD = dateOfIso(inMonth[0].iso);
    const title = ctx2.i.fmtDate(firstD, { month: "long", year: "numeric" });
    const wd = [];
    for (let i = 0; i < 7; i += 1) wd.push(ctx2.i.fmtDate(dateOfIso(cells[i].iso), { weekday: "narrow" }));
    const sel = p.sel;
    const selDate = dateOfIso(sel);
    const dayTasks = (byDay[sel] || []).slice().sort((a, b) => a.done - b.done || (a.time || "99").localeCompare(b.time || "99"));
    const left = dayTasks.filter((x) => !x.done).length;
    const rtl = ctx2.i.dir() === "rtl";
    const grid = cells.map((c) => {
      const list = byDay[c.iso] || [];
      const pending = list.some((x) => !x.done);
      return `<button class="cday ${c.inMonth ? "" : "out"} ${c.iso === todayIso ? "today" : ""} ${c.iso === sel ? "sel" : ""}" data-act="cal.pick" data-arg="${c.iso}">
      <b class="tnum">${ctx2.i.digits(c.g)}</b>${list.length ? `<i class="cdot ${pending ? "pend" : "ok"}"></i>` : ""}</button>`;
    }).join("");
    return `<div class="planner">
    <div class="cal">
      <div class="cal-head">
        <button class="ib xs" data-act="cal.prev">${icon(rtl ? "chevron-right" : "chevron-left", 15, 2.4)}</button>
        <div class="cal-title"><b>${esc(title)}</b></div>
        <button class="ib xs" data-act="cal.next">${icon(rtl ? "chevron-left" : "chevron-right", 15, 2.4)}</button>
      </div>
      <div class="cal-grid">${wd.map((w) => `<span class="cwd">${esc(w)}</span>`).join("")}${grid}</div>
    </div>
    <div class="day">
      <div class="day-head">
        <div class="day-title"><b>${esc(ctx2.i.fmtDate(selDate, { weekday: "long" }))}</b>
        <small>${esc(ctx2.i.fmtDate(selDate, { day: "numeric", month: "long", year: "numeric" }))}</small></div>
        ${sel !== todayIso ? `<button class="pill xs" data-act="cal.today">${esc(t("goToday"))}</button>` : ""}
      </div>
      <div class="tasks scroll">${dayTasks.length ? dayTasks.map((x) => `
        <div class="task ${x.done ? "done" : ""}" data-color="${esc(x.color || "blue")}">
          <button class="tcheck" data-act="task.toggle" data-arg="${esc(x.id)}">${x.done ? icon("check", 12, 3.2) : ""}</button>
          <span class="ttitle" dir="auto">${esc(x.title)}</span>
          ${x.time ? `<span class="ttime tnum" dir="ltr">${icon("alarm-clock", 11, 2.4)}${ctx2.i.digits(x.time)}</span>` : ""}
          <button class="tdel" data-act="task.remove" data-arg="${esc(x.id)}">${icon("x", 11, 2.8)}</button>
        </div>`).join("") : `<div class="tasks-empty">${icon("calendar-check", 22, 1.8)}<span>${esc(t("noTasks"))}</span></div>`}
      </div>
      <div class="day-foot">
        <form class="task-add" data-form="task">
          <input name="title" maxlength="200" placeholder="${esc(t("taskPlaceholder"))}" autocomplete="off" dir="auto">
          <input name="time" type="time" title="${esc(t("timeOpt"))}">
          <button class="tadd" type="submit">${icon("plus", 15, 2.6)}</button>
        </form>
        ${dayTasks.length ? `<span class="t-dim tasks-left">${left ? esc(t("tasksLeft", { n: ctx2.i.digits(left) })) : esc(t("allDone"))}</span>` : ""}
      </div>
    </div>
  </div>`;
  }
  function gmLibHtml(d, ctx2) {
    const t = ctx2.i.t;
    const g = d.gaming || {};
    const lib = d.gameLib;
    if (lib === null || lib === void 0) return `<div class="gm-lib loading">${[0, 1, 2, 3, 4, 5].map(() => '<span class="gm-game ghost"></span>').join("")}</div>`;
    const tiles = lib.map((x) => {
      const busy = g.launching === x.id;
      const face = x.icon ? `<img src="${esc(x.icon)}" alt="" draggable="false">` : `<b>${esc((x.name || "?").trim().charAt(0).toUpperCase())}</b>`;
      return `<button class="gm-game ${busy ? "busy" : ""}" data-act="game.launch" data-arg="${esc(x.id)}" title="${esc(x.name)}" aria-label="${esc(x.name)}">${face}${busy ? `<span class="gm-ring"></span>` : ""}</button>`;
    }).join("");
    const add = `<button class="gm-game add" data-act="game.add" title="${esc(t("gmAddGame"))}" aria-label="${esc(t("gmAddGame"))}">${icon("plus", 18, 2.4)}</button>`;
    if (!lib.length) return `<div class="gm-lib empty">${add}<span class="t-dim one">${esc(t("gmLibEmpty"))}</span></div>`;
    return `<div class="gm-lib" data-gm-lib>${tiles}${add}</div>`;
  }
  var GM_STEP_IC = { wait: ["circle-dashed", ""], run: ["loader", "run"], ok: ["check", "ok"], skip: ["check", "skip"], later: ["clock", "later"], fail: ["x", "fail"] };
  function gmTemp(c, unit) {
    if (c === null || c === void 0 || !Number.isFinite(c)) return null;
    return unit === "f" ? Math.round(c * 9 / 5 + 32) : Math.round(c);
  }
  function gmCls(v, warn, bad) {
    return v === null || v === void 0 ? "" : v >= bad ? "bad" : v >= warn ? "warn" : "";
  }
  function gmJoin(parts, ctx2) {
    return parts.join(ctx2.i.dir() === "rtl" ? "\u060C " : " \xB7 ");
  }
  function gmHotkey(k) {
    return String(k || "").replace(/Control/g, "Ctrl").replace(/CommandOrControl|CmdOrCtrl/g, "Ctrl");
  }
  function gmGb(b) {
    const g = b / 1073741824;
    return Math.abs(g - Math.round(g)) < 0.05 ? String(Math.round(g)) : g.toFixed(g >= 10 ? 0 : 1);
  }
  function gmStatus(g, ctx2) {
    const t = ctx2.i.t;
    if (!g || !g.enabled) return t("gmOff");
    if (g.game) return `${t(g.game.front ? "gmPlaying" : "gmBackground")} \xB7 ${g.game.title || g.game.name}`;
    if (g.opt && g.opt.running) return t("gmOptimizing");
    if (g.manual) return t("gmWaiting");
    return t("gmWatching");
  }
  function gmLiveHtml(d, ctx2) {
    const t = ctx2.i.t;
    const g = d.gaming || {};
    const m = g.metrics || {};
    const unit = d.gmTemp === "f" ? "\xB0F" : "\xB0";
    const num = (v) => v === null || v === void 0 ? "\u2013" : ctx2.i.num(v);
    const tile = (label, value, sub, cls = "", big = false) => `<div class="gm-t ${big ? "big" : ""}"><span class="gm-l">${esc(label)}</span><b class="tnum ${cls}" dir="ltr">${value}</b>${sub ? `<small class="tnum" dir="ltr">${sub}</small>` : ""}</div>`;
    const fpsOn = !!m.fpsSrc;
    const fpsCls = !fpsOn || m.fps === null ? "" : m.fps < 30 ? "bad" : m.fps < 55 ? "warn" : "good";
    const ct = gmTemp(m.cpuTemp, d.gmTemp);
    const gt = gmTemp(m.gpuTemp, d.gmTemp);
    const vram = m.vram !== null && m.vram !== void 0 ? `${ctx2.i.digits(gmGb(m.vram))}${m.vramTotal ? `<i>/${ctx2.i.digits(gmGb(m.vramTotal))}</i>` : ""}` : "\u2013";
    const ping = m.ping === null || m.ping === void 0 ? null : m.ping;
    return [
      tile("FPS", fpsOn ? num(m.fps) : "\u2013", fpsOn && m.low1 !== null ? `${esc(t("gmLow1"))} ${num(m.low1)}` : "", fpsCls, true),
      tile(t("cpu"), `${num(m.cpu)}<i>%</i>`, ct !== null ? `${ctx2.i.digits(ct)}${unit}` : "", gmCls(m.cpuTemp, 80, 90)),
      tile(t("gpu"), `${num(m.gpu)}<i>%</i>`, gt !== null ? `${ctx2.i.digits(gt)}${unit}` : "", gmCls(m.gpuTemp, 78, 86)),
      tile(t("ram"), `${num(m.ram)}<i>%</i>`, m.ramUsed ? `${ctx2.i.digits(gmGb(m.ramUsed))}/${ctx2.i.digits(gmGb(m.ramTotal))} GB` : "", gmCls(m.ram, 88, 95)),
      tile("VRAM", vram, "GB"),
      tile(t("gmPing"), ping === null ? "\u2013" : ping < 0 ? "\xD7" : `${num(ping)}<i>ms</i>`, "", ping !== null && (ping < 0 || ping >= 120) ? "bad" : ping >= 70 ? "warn" : "")
    ].join("");
  }
  function gmStepsHtml(g, d, ctx2) {
    const t = ctx2.i.t;
    const run = g.opt && g.opt.steps && g.opt.steps.length ? g.opt.steps : (d.gmSteps || []).map((key) => ({ key, status: "wait" }));
    return run.map((st) => {
      const [ic, cls] = GM_STEP_IC[st.status] || GM_STEP_IC.wait;
      let tip = t(`gmStep_${st.key}`);
      if (st.status === "later") tip += ` \xB7 ${t("gmLater")}`;
      if (st.status === "skip" && st.detail === "already") tip += ` \xB7 ${t("gmAlready")}`;
      if (st.status === "skip" && st.detail === "none") tip += ` \xB7 ${t("gmNone")}`;
      if (st.status === "skip" && st.detail === "missing") tip += ` \xB7 ${t("gmRtssNotInstalled")}`;
      return `<span class="gm-step ${cls}" title="${esc(tip)}">${st.status === "run" ? `<span class="spin-ic">${icon("loader", 12, 2.6)}</span>` : icon(ic, 12, 2.8)}<span>${esc(t(`gmS_${st.key}`))}</span></span>`;
    }).join("");
  }
  function gmFootHtml(g, d, ctx2) {
    const t = ctx2.i.t;
    const f = g.fps || {};
    if (g.osd === "missing") {
      return `<div class="gm-foot warn">${icon("triangle-alert", 13, 2.4)}<span class="one">${esc(t("gmRtssMissing"))}</span>
      <button class="pill xs" data-act="game.settings">${esc(t("settings"))}</button></div>`;
    }
    if (g.game && g.fullscreen && g.hud && g.osd === "off") {
      return `<div class="gm-foot warn">${icon("triangle-alert", 13, 2.4)}<span class="one">${esc(t("gmFsHint"))}</span>
      <button class="pill xs" data-act="game.settings">${esc(t("gmGuideBtn"))}</button></div>`;
    }
    if (d.gmNote) return `<div class="gm-foot ${d.gmNote.ok ? "ok" : "warn"}">${icon(d.gmNote.ok ? "shield-check" : "triangle-alert", 13, 2.4)}<span class="one">${esc(t(d.gmNote.key))}</span></div>`;
    if (g.candidate && g.candidate.name && !g.game) {
      return `<div class="gm-foot ask">${icon("gamepad-2", 13, 2.2)}<span class="one" dir="auto">${esc(t("gmIsGame", { name: g.candidate.title || g.candidate.name }))}</span>
      <button class="pill xs accent" data-act="game.mark" data-arg="${esc(g.candidate.name)}">${esc(t("gmYes"))}</button></div>`;
    }
    if (f.etw === "denied" && !f.rtss) {
      return `<div class="gm-foot warn">${icon("triangle-alert", 13, 2.4)}<span class="one">${esc(t("gmFpsDenied"))}</span>
      <button class="pill xs" data-act="game.allowFps">${icon("shield-check", 12, 2.4)} ${esc(t("gmAllow"))}</button></div>`;
    }
    const s = (g.sessions || [])[0];
    if (!s) return `<div class="gm-foot t-dim">${icon("history", 13, 2.2)}<span class="one">${esc(t("gmNoSessions"))}</span></div>`;
    const bits = [ctx2.i.duration(s.dur)];
    if (s.avgFps) bits.push(`${ctx2.i.num(s.avgFps)} FPS`);
    if (s.low1) bits.push(`${t("gmLow1")} ${ctx2.i.num(s.low1)}`);
    return `<div class="gm-foot sess" title="${esc(`${t("gmLast")}: ${s.title || s.name} \xB7 ${bits.join(" \xB7 ")}`)}">${icon("history", 13, 2.2)}<span class="one"><b dir="auto">${esc(s.title || s.name)}</b>
    <span class="t-dim tnum"> ${ctx2.i.dir() === "rtl" ? "\u060C " : "\xB7 "}${gmJoin(bits.map((b) => `<bdi>${esc(b)}</bdi>`), ctx2)}</span></span></div>`;
  }
  function gamingTab(d, ctx2) {
    const t = ctx2.i.t;
    const g = d.gaming || {};
    if (!g.enabled) {
      return `<div class="empty-state">${icon("gamepad-2", 30, 1.8)}<span>${esc(t("gmTitle"))} \xB7 ${esc(t("gmOff"))}</span>
      <button class="pill accent" data-act="game.settings">${icon("settings", 14, 2.2)} ${esc(t("gmTurnOn"))}</button></div>`;
    }
    const running = g.opt && g.opt.running;
    const done = !running && g.optimized;
    const on = g.active;
    let btn;
    if (running) btn = `<button class="gm-go busy" disabled><span class="spin-ic">${icon("loader", 18, 2.4)}</span><span>${esc(t("gmOptimizing"))}</span></button>`;
    else if (done) {
      const extra = [];
      if (g.opt && g.opt.freed > 64 * 1048576) extra.push(t("gmFreed", { n: ctx2.i.bytes(g.opt.freed) }));
      if (g.opt && g.opt.closed) extra.push(t("gmClosedN", { n: ctx2.i.num(g.opt.closed) }));
      btn = `<div class="gm-go done"><span class="gm-go-ic">${icon("check", 17, 3)}</span><span class="gm-go-t"><b>${esc(t("gmOptimized"))}</b>${extra.length ? `<small>${esc(gmJoin(extra, ctx2))}</small>` : ""}</span>
      <button class="gm-undo" data-act="game.restore">${icon("undo-2", 13, 2.4)} ${esc(t("gmUndo"))}</button></div>`;
    } else btn = `<button class="gm-go" data-act="game.optimize"><span class="gm-go-ic">${icon("rocket", 18, 2.2)}</span><span class="gm-go-t"><b>${esc(t("gmOptimize"))}</b><small>${esc(t("gmTip"))}</small></span></button>`;
    return `<div class="gm">
    <div class="gm-card gm-main">
      <div class="gm-head">
        <span class="gm-badge ${on ? "on" : ""}">${icon("gamepad-2", 18, 2.2)}</span>
        <div class="gm-meta"><b>${esc(t("gmTitle"))}</b><span class="one" dir="auto">${esc(gmStatus(g, ctx2))}</span></div>
        ${g.game ? `<button class="ib xs" data-act="game.end" title="${esc(t("gmEnd"))}">${icon("x", 14, 2.4)}</button>` : ""}
        <button class="gm-sw ${on ? "on" : ""}" data-act="game.toggle" role="switch" aria-checked="${on ? "true" : "false"}" title="${esc(t("gmTitle"))}"><i></i></button>
      </div>
      ${gmLibHtml(d, ctx2)}
      ${btn}
      <div class="gm-steps">${gmStepsHtml(g, d, ctx2)}</div>
    </div>
    <div class="gm-card gm-side">
      <div class="gm-live" data-gm-live></div>
      ${gmFootHtml(g, d, ctx2)}
      <div class="gm-actions">
        <button class="gm-bar ${g.hud ? "on" : ""}" data-act="game.hud" title="${esc(t("gmShortcutHint", { k: gmHotkey(d.gmHotkey) }))}">${icon(g.hud ? "eye" : "eye-off", 14, 2.2)}<span class="one">${esc(t(g.osd === "on" ? "gmBarRtss" : "gmBar"))}</span>${d.gmHotkey ? `<kbd dir="ltr">${esc(gmHotkey(d.gmHotkey))}</kbd>` : ""}</button>
        <button class="ib xs" data-act="game.settings" title="${esc(t("settings"))}">${icon("settings", 15)}</button>
      </div>
    </div>
  </div>`;
  }
  var gameLaunch = {
    name: "gameLaunch",
    size() {
      return { w: 330, h: 52 };
    },
    key(d, ctx2) {
      return `glaunch:${d.id}:${d.ok}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      const face = d.icon ? `<img src="${esc(d.icon)}" alt="">` : icon("gamepad-2", 18, 2.2);
      return h(`<div class="hud glaunch ${d.ok === false ? "fail" : ""}" dir="${ctx2.i.dir()}">
      <span class="gl-ic">${face}</span>
      <span class="gl-t one" dir="auto">${esc(t(d.ok === false ? "gmLaunchFail" : "gmLaunching", { name: d.name }))}</span>
      ${d.ok === false ? icon("triangle-alert", 16, 2.4) : `<span class="spin-ic">${icon("loader", 16, 2.4)}</span>`}
    </div>`);
    }
  };
  var gameSummary = {
    name: "gameSummary",
    size() {
      return { w: 470, h: 96, r: 40 };
    },
    key(d, ctx2) {
      return `gsum:${d.id}:${ctx2.i.lang()}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      const unit = d.temp === "f" ? "\xB0F" : "\xB0";
      const cell = (label, value, cls = "") => `<div class="gs-c"><span>${esc(label)}</span><b class="tnum ${cls}" dir="ltr">${value}</b></div>`;
      const peak = Math.max(d.maxCpuTemp || 0, d.maxGpuTemp || 0);
      const cells = [cell(t("gmPlayTime"), ctx2.i.duration(d.dur))];
      if (d.avgFps) cells.push(cell(t("gmAvgFps"), ctx2.i.num(d.avgFps), "acc"));
      if (d.low1) cells.push(cell(t("gmLow1"), ctx2.i.num(d.low1)));
      if (peak) cells.push(cell(t("gmPeak"), `${ctx2.i.digits(gmTemp(peak, d.temp))}${unit}`, peak >= 88 ? "bad" : peak >= 80 ? "warn" : ""));
      return h(`<div class="gsum" dir="${ctx2.i.dir()}">
      <span class="gs-ic">${icon("trophy", 22, 2)}</span>
      <div class="gs-meta"><div class="gs-title"><span class="t-dim">${esc(t("gmSessionEnded"))} \xB7</span> <bdi>${esc(d.title || d.name)}</bdi></div>
        <div class="gs-row">${cells.join("")}</div></div>
      <button class="cbtn sm gray" data-act="gsum.close" title="${esc(t("dismiss"))}">${icon("x", 18, 2.6)}</button>
    </div>`);
    }
  };
  var TAB_RENDER = { home: homeTab, alerts: alertsTab, apps: appsTab, planner: plannerTab, weather: weatherTab, tools: toolsTab, gaming: gamingTab, shelf: shelfTab, clipboard: clipboardTab };
  function tabKey(d) {
    switch (d.tab) {
      case "home": {
        const lay = import_home_layout.default.normalize(d.home);
        const tk = lay.some((r) => r.t === "tasks") ? JSON.stringify(todayTasks(d).map((x) => [x.id, x.done, x.time, x.title, x.color])) + (/* @__PURE__ */ new Date()).toDateString() : "";
        return `home:${d.media ? `${d.media.artKey}:${d.media.art ? 1 : 0}` : "none"}:${(d.shortcuts || []).map((s) => s.id + (s.icon ? 1 : 0) + (s.glyph || "") + (s.color || "")).join(",")}:${d.weather && d.weather.updatedAt}:${widgetList(d).length}:${JSON.stringify(lay)}:${d.homeEdit ? 1 : 0}:${d.homeNew || ""}:${tk}`;
      }
      case "planner":
        return `plan:${d.planner.ym.y}-${d.planner.ym.m}:${d.planner.sel}:${JSON.stringify((d.tasks || []).map((x) => [x.id, x.done, x.date, x.time, x.title, x.color, x.updated]))}:${(/* @__PURE__ */ new Date()).toDateString()}`;
      case "alerts":
        return `alerts:${(d.notifHistory || []).map((n) => n.id).join("|").length}:${(d.notifHistory || []).length}:${(d.notifHistory || [])[0] ? d.notifHistory[0].id : ""}:${(d.notifHistory || []).filter((n) => n.avatar || n.appIcon).length}`;
      case "apps":
        return `apps:${d.deckSize}:${(d.shortcuts || []).map((s) => [s.id, s.icon ? 1 : 0, s.name, s.kind, s.glyph || "", s.color || "", s.size || ""].join("~")).join(",")}`;
      case "weather":
        return `wx:${d.weather ? d.weather.updatedAt || (d.weather.error ? "err" : "") : "none"}`;
      case "shelf":
        return `shelf:${(d.shelf || []).map((f) => f.path).join("|")}:${d.phoneDevice ? 1 : 0}`;
      case "tools": {
        const p = d.phoneDevice;
        return `tools:${JSON.stringify(d.sharedTimers || [])}:${p ? `${p.id}:${p.wifi ? 1 : 0}${p.bluetooth ? 1 : 0}${p.island ? 1 : 0}` : ""}`;
      }
      case "clipboard":
        return `clip:${(d.clipHistory || []).map((c) => c.id).join("|")}:${Math.floor(Date.now() / 6e4)}`;
      case "gaming": {
        const g = d.gaming || {};
        return `game:${JSON.stringify([g.enabled, g.active, g.manual, g.game, g.candidate, g.opt, g.optimized, g.hud, g.osd, g.fullscreen, g.launching, g.fps && g.fps.etw, g.fps && g.fps.rtss, (g.sessions || [])[0], d.gmHotkey, d.gmSteps, d.gmNote, d.gameLib ? d.gameLib.map((x) => x.id + (x.icon ? 1 : 0)).join("|") : null])}`;
      }
      default:
        return d.tab;
    }
  }
  function phoneChip(d, ctx2) {
    const p = d.phoneDevice;
    if (!p) return "";
    const bat = p.battery !== null && p.battery !== void 0 ? `${ctx2.i.num(p.battery)}%` : "";
    return `<button class="phone-chip ${p.charging ? "chg" : ""}" data-act="phone.find" title="${esc(ctx2.i.t("ringPhone"))} \xB7 ${esc(p.name)}">
    ${icon("smartphone", 13, 2.4)}<span class="tnum" dir="ltr">${bat}</span>${p.charging ? icon("zap", 10, 0, "", true) : ""}</button>`;
  }
  var dashboard = {
    name: "dashboard",
    size() {
      return { w: 664, h: 296, r: 48 };
    },
    key(d, ctx2) {
      return `dash:${ctx2.i.lang()}:${d.phoneDevice ? d.phoneDevice.id : ""}`;
    },
    render(d, ctx2) {
      const t = ctx2.i.t;
      const el = h(`<div class="dash" dir="${ctx2.i.dir()}">
      <div class="dash-top" data-s>
        <div class="dash-side">
          <button class="ib sm" data-act="action" data-arg="settings" title="${esc(t("settings"))}">${icon("settings", 16)}</button>
          <span data-phone-chip>${phoneChip(d, ctx2)}</span>
        </div>
        <div class="tabs">
          <div class="tab-hl"></div>
          ${TABS.map(([k, ic]) => `<button class="tab" data-act="tab" data-arg="${k}" title="${esc(t(k))}">${icon(ic, 15, 2.2)}<span>${esc(t(k))}</span></button>`).join("")}
        </div>
        <div class="dash-side end">
          <button class="ib sm home-edit" data-act="home.edit" title="${esc(t("editLayout"))}">${icon("layout-dashboard", 15)}</button>
          <button class="ib sm" data-act="minimize" title="${esc(t("minimize"))}">${icon("minimize-2", 15)}</button>
          <button class="ib sm pin ${d.pinned ? "on" : ""}" data-act="pin" title="${esc(t(d.pinned ? "unpin" : "pin"))}">${icon(d.pinned ? "pin-off" : "pin", 16)}</button>
        </div>
      </div>
      <div class="dash-body" data-s></div>
    </div>`);
      el.querySelector(".dash-top").insertAdjacentHTML("beforeend", '<div class="edit-bar" data-edit-bar></div>');
      dashboard.update(el, d, ctx2);
      return el;
    },
    update(el, d, ctx2) {
      el.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.arg === d.tab));
      const active = el.querySelector(`.tab[data-arg="${d.tab}"]`);
      const hl = el.querySelector(".tab-hl");
      if (active && hl) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          hl.style.width = `${active.offsetWidth}px`;
          hl.style.transform = `translateX(${active.offsetLeft}px)`;
        }));
      }
      const editing = d.tab === "home" && !!d.homeEdit;
      el.classList.toggle("editing", editing);
      el.dataset.tab = d.tab;
      const eb = el.querySelector("[data-edit-bar]");
      if (eb) {
        const html = editing ? editBarHtml(d, ctx2) : "";
        if (eb.dataset.html !== html) {
          eb.dataset.html = html;
          eb.innerHTML = html;
        }
      }
      const pin = el.querySelector(".pin");
      if (pin) pin.classList.toggle("on", !!d.pinned);
      const chip = el.querySelector("[data-phone-chip]");
      if (chip) {
        const html = phoneChip(d, ctx2);
        if (chip.dataset.html !== html) {
          chip.dataset.html = html;
          chip.innerHTML = html;
        }
      }
      const body = el.querySelector(".dash-body");
      const key = tabKey(d) + ctx2.i.lang();
      if (body.dataset.key !== key) {
        const switching = body.dataset.tab && body.dataset.tab !== d.tab;
        body.dataset.key = key;
        body.dataset.tab = d.tab;
        body.innerHTML = TAB_RENDER[d.tab](d, ctx2);
        if (switching) {
          body.animate(
            [{ opacity: 0, transform: "translateY(6px) scale(.985)", filter: "blur(4px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
            { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" }
          );
        }
      }
      if (d.tab === "gaming") {
        const live = body.querySelector("[data-gm-live]");
        if (live) {
          const html = gmLiveHtml(d, ctx2);
          if (live.dataset.html !== html) {
            live.dataset.html = html;
            live.innerHTML = html;
          }
        }
      }
      if (d.tab === "home") {
        bind(body, "clock", ctx2.i.clock());
        const st = body.querySelector("[data-sys]");
        if (st) {
          const html = sysHtml(d, ctx2);
          if (st.dataset.html !== html) {
            st.dataset.html = html;
            st.innerHTML = html;
          }
        }
        const wc = body.querySelector("[data-widget]");
        if (wc) {
          const html = widgetHtml(d, ctx2);
          if (wc.dataset.html !== html) {
            const sc = wc.querySelector(".news");
            const top = sc ? sc.scrollTop : 0;
            const same = wc.dataset.active === d.widgetActive;
            wc.dataset.html = html;
            wc.dataset.active = d.widgetActive;
            wc.innerHTML = html;
            const sc2 = wc.querySelector(".news");
            if (sc2 && same) sc2.scrollTop = top;
            if (!same && wc.dataset.shown) wc.querySelector(".w-body").classList.add("w-in");
            wc.dataset.shown = "1";
          }
        }
        body.querySelectorAll("[data-solo]").forEach((sc) => {
          const html = soloHtml(sc.dataset.solo, d, ctx2);
          if (sc.dataset.html === html) return;
          const old = sc.querySelector(".news");
          const top = old ? old.scrollTop : 0;
          sc.dataset.html = html;
          sc.innerHTML = html;
          const now = sc.querySelector(".news");
          if (now) now.scrollTop = top;
        });
        const m = d.media;
        if (m) {
          const fill = body.querySelector(".mini-player .prog-fill");
          const knob = body.querySelector(".mini-player .prog-knob");
          const pos = d.seekPreview !== null && d.seekPreview !== void 0 ? d.seekPreview : mediaPos(m);
          const p = m.duration > 0 ? clamp(pos / m.duration, 0, 1) : 0;
          if (fill) fill.style.width = `${(p * 100).toFixed(2)}%`;
          if (knob) knob.style.left = `${p * 100}%`;
          bind(body, "mpel", ctx2.i.duration(pos));
          bind(body, "mprem", m.duration > 0 ? `-${ctx2.i.duration(m.duration - pos)}` : "");
          const pp = body.querySelector('.mini-player [data-act="media.toggle"]');
          const want = m.status === "playing" ? "pause" : "play";
          if (pp && pp.dataset.icon !== want) {
            pp.dataset.icon = want;
            pp.innerHTML = icon(want, 24, 0, "pp", true);
          }
          const mp = body.querySelector(".mini-player");
          if (mp) mp.classList.toggle("playing", m.status === "playing");
        }
      }
    }
  };
  var HOME = import_home_layout.default;
  var VIEWS = {
    idle,
    handle,
    media,
    mediaMini,
    mediaExpanded,
    notification,
    notificationExpanded,
    call,
    callActive,
    callActiveExpanded,
    pair,
    volume,
    battery,
    keys,
    copied,
    privacy,
    message,
    drop,
    track,
    timer,
    timerMini,
    timerExpanded,
    timerDone,
    dashboard,
    findPc,
    received,
    transfer,
    subsMini,
    subsReady,
    subsPanel,
    gameSummary,
    gameLaunch
  };

  // src/renderer/island/i18n.js
  var import_strings = __toESM(require_strings());
  var { strings, langInfo, LANGS } = import_strings.default;
  var cache = {};
  function createI18n(getSettings) {
    const lang = () => {
      const l = getSettings().language;
      return LANGS.some((x) => x.code === l) ? l : "en";
    };
    const digits = (s) => String(s);
    const table = () => {
      const l = lang();
      if (!cache[l]) cache[l] = strings(l);
      return cache[l];
    };
    function t(key, vars) {
      let s = table()[key];
      if (s === void 0 || s === "") s = strings("en")[key] || key;
      if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, vars[k]);
      return s;
    }
    function num(n, frac = 0) {
      if (n === null || n === void 0 || Number.isNaN(n)) return "\u2013";
      return digits(Number(n).toFixed(frac));
    }
    function clock(date = /* @__PURE__ */ new Date(), withSeconds = false) {
      const h2 = String(date.getHours()).padStart(2, "0");
      const m = String(date.getMinutes()).padStart(2, "0");
      const s = String(date.getSeconds()).padStart(2, "0");
      return digits(withSeconds ? `${h2}:${m}:${s}` : `${h2}:${m}`);
    }
    function hour(date) {
      return digits(`${String(date.getHours()).padStart(2, "0")}:00`);
    }
    function duration(sec, forceHours = false) {
      sec = Math.max(0, Math.floor(sec || 0));
      const h2 = Math.floor(sec / 3600);
      const m = Math.floor(sec % 3600 / 60);
      const s = sec % 60;
      const mm = h2 > 0 || forceHours ? String(m).padStart(2, "0") : String(m);
      const out = h2 > 0 || forceHours ? `${h2}:${mm}:${String(s).padStart(2, "0")}` : `${mm}:${String(s).padStart(2, "0")}`;
      return digits(out);
    }
    function timerText(sec) {
      sec = Math.max(0, Math.ceil(sec));
      const h2 = Math.floor(sec / 3600);
      const m = Math.floor(sec % 3600 / 60);
      const s = sec % 60;
      return digits(h2 > 0 ? `${h2}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    function locale() {
      return langInfo(lang()).locale;
    }
    function baseLocale() {
      return langInfo(lang()).locale.split("-u-")[0];
    }
    function numberingSystem() {
      return "latn";
    }
    function numFmt(v, opts = {}) {
      if (v === null || v === void 0 || !Number.isFinite(Number(v))) return "\u2013";
      try {
        return new Intl.NumberFormat(baseLocale(), { numberingSystem: numberingSystem(), ...opts }).format(v);
      } catch (_) {
        return digits(String(v));
      }
    }
    function fmtDate(date, opts) {
      try {
        return new Intl.DateTimeFormat(baseLocale(), { calendar: "gregory", numberingSystem: numberingSystem(), ...opts }).format(date);
      } catch (_) {
        return date.toDateString();
      }
    }
    function dates(date = /* @__PURE__ */ new Date()) {
      const out = {};
      try {
        const loc = locale();
        out.weekday = new Intl.DateTimeFormat(loc, { weekday: "long" }).format(date);
        out.primary = new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric" }).format(date);
        out.short = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short" }).format(date);
        out.secondary = "";
      } catch (_) {
        out.weekday = "";
        out.primary = date.toDateString();
        out.short = "";
        out.secondary = "";
      }
      return out;
    }
    function weekdayShort(date) {
      try {
        return new Intl.DateTimeFormat(locale(), { weekday: "short" }).format(date);
      } catch (_) {
        return "";
      }
    }
    function ago(ts) {
      const d = Math.max(0, Date.now() - ts);
      if (d < 6e4) return t("now");
      if (d < 36e5) return t("minAgo", { n: digits(Math.floor(d / 6e4)) });
      if (d < 864e5 * 2) return t("hourAgo", { n: digits(Math.floor(d / 36e5)) });
      return fmtDate(new Date(ts), { day: "numeric", month: "short" });
    }
    function bytes(n) {
      if (!Number.isFinite(n)) return "\u2013";
      const units = ["B", "KB", "MB", "GB"];
      let i = 0;
      while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i++;
      }
      return `${digits(n.toFixed(n >= 100 || i === 0 ? 0 : 1))} ${units[i]}`;
    }
    function temp(v) {
      if (v === null || v === void 0 || Number.isNaN(v)) return "\u2013";
      return `${digits(Math.round(v))}\xB0`;
    }
    return {
      t,
      num,
      clock,
      hour,
      duration,
      timerText,
      dates,
      weekdayShort,
      ago,
      bytes,
      temp,
      digits,
      lang,
      numFmt,
      fmtDate,
      dir: () => langInfo(lang()).dir
    };
  }

  // src/renderer/island/demo.js
  var TRACKS = [
    { title: "Midnight Drive", artist: "Neon Coast", album: "Afterglow", hues: [330, 265], duration: 214 },
    { title: "Golden Hour", artist: "Aria Vale", album: "Light", hues: [28, 350], duration: 248 },
    { title: "Ocean Lights", artist: "Lumen", album: "Tides", hues: [190, 230], duration: 187 }
  ];
  var trackIndex = 0;
  function makeArt(hues, seed) {
    const c = document.createElement("canvas");
    c.width = 300;
    c.height = 300;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 300, 300);
    grad.addColorStop(0, `hsl(${hues[0]} 85% 58%)`);
    grad.addColorStop(1, `hsl(${hues[1]} 80% 30%)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 300, 300);
    for (let i = 0; i < 7; i++) {
      const x = (Math.sin(seed * 13 + i * 2.1) * 0.5 + 0.5) * 300;
      const y = (Math.cos(seed * 7 + i * 1.3) * 0.5 + 0.5) * 300;
      const r = 30 + (i * 37 + seed * 11) % 90;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, `hsla(${(hues[i % 2] + i * 20) % 360} 95% 70% / .55)`);
      rg.addColorStop(1, "hsla(0 0% 100% / 0)");
      g.fillStyle = rg;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(255,255,255,.35)";
    g.lineWidth = 6;
    g.beginPath();
    g.arc(150, 150, 70, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "rgba(255,255,255,.85)";
    g.beginPath();
    g.arc(150, 150, 12, 0, Math.PI * 2);
    g.fill();
    return c.toDataURL("image/jpeg", 0.9);
  }
  function makeAvatar(name, hue) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 128, 128);
    grad.addColorStop(0, `hsl(${hue} 70% 62%)`);
    grad.addColorStop(1, `hsl(${(hue + 40) % 360} 70% 42%)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = "rgba(255,255,255,.92)";
    g.beginPath();
    g.arc(64, 50, 22, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(64, 118, 42, 34, 0, Math.PI, 0);
    g.fill();
    return c.toDataURL("image/png");
  }
  var SAMPLES = {
    en: { name: "Sarah", full: "Sarah Miller", msg: "Hey! Coffee at 8 tonight? \u2615\uFE0F", mobile: "Mobile", city: "London" },
    ar: { name: "\u0633\u0627\u0631\u0629", full: "\u0633\u0627\u0631\u0629 \u0623\u062D\u0645\u062F", msg: "\u0645\u0631\u062D\u0628\u064B\u0627! \u0642\u0647\u0648\u0629 \u0627\u0644\u0633\u0627\u0639\u0629 \u0668 \u0627\u0644\u0644\u064A\u0644\u0629\u061F \u2615\uFE0F", mobile: "\u062C\u0648\u0627\u0644", city: "\u062F\u0628\u064A" },
    tr: { name: "Selin", full: "Selin Y\u0131lmaz", msg: "Selam! Bu ak\u015Fam 8'de kahve? \u2615\uFE0F", mobile: "Mobil", city: "\u0130stanbul" },
    es: { name: "Luc\xEDa", full: "Luc\xEDa Garc\xEDa", msg: "\xA1Hola! \xBFCaf\xE9 esta noche a las 8? \u2615\uFE0F", mobile: "M\xF3vil", city: "Madrid" },
    ru: { name: "\u0410\u043D\u044F", full: "\u0410\u043D\u043D\u0430 \u0421\u043C\u0438\u0440\u043D\u043E\u0432\u0430", msg: "\u041F\u0440\u0438\u0432\u0435\u0442! \u041A\u043E\u0444\u0435 \u0441\u0435\u0433\u043E\u0434\u043D\u044F \u0432 8? \u2615\uFE0F", mobile: "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u044B\u0439", city: "\u041C\u043E\u0441\u043A\u0432\u0430" },
    zh: { name: "\u5C0F\u96E8", full: "\u738B\u5C0F\u96E8", msg: "\u55E8\uFF01\u4ECA\u665A\u516B\u70B9\u559D\u5496\u5561\u5417\uFF1F\u2615\uFE0F", mobile: "\u624B\u673A", city: "\u4E0A\u6D77" }
  };
  function sample(lang) {
    return SAMPLES[lang] || SAMPLES.en;
  }
  function demoWeather(lang) {
    const now = /* @__PURE__ */ new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hourly = [];
    const codes = [1, 1, 2, 2, 3, 3, 61, 61, 2, 1, 0, 0];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getTime() + i * 36e5);
      d.setMinutes(0, 0, 0);
      const hr2 = d.getHours();
      hourly.push({ time: `${iso(d)}T${pad(hr2)}:00`, temp: 18 - Math.abs(14 - hr2) * 0.6 + Math.sin(i) * 0.8, code: codes[i], isDay: hr2 >= 6 && hr2 < 18 });
    }
    const daily = [];
    const dc = [1, 61, 3, 0, 2, 95];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getTime() + i * 864e5);
      daily.push({ date: iso(d), code: dc[i], max: 21 - i + i % 2 * 3, min: 11 - i % 3, pop: [5, 70, 30, 0, 10, 80][i], sunrise: null, sunset: null });
    }
    const hr = now.getHours();
    return {
      city: sample(lang).city,
      country: "",
      unit: "c",
      updatedAt: Date.now(),
      current: { temp: 17.6, feels: 16.2, humidity: 48, wind: 12, code: 1, isDay: hr >= 6 && hr < 18 },
      hourly,
      daily
    };
  }
  function demoPayload(kind, step = 0, lang = "en") {
    const sm = sample(lang);
    if (kind === "music") {
      trackIndex = (trackIndex + step + TRACKS.length) % TRACKS.length;
      const t = TRACKS[trackIndex];
      return {
        type: "media",
        present: true,
        title: t.title,
        artist: t.artist,
        album: t.album,
        status: "playing",
        source: "Spotify.exe",
        position: 37,
        duration: t.duration,
        canPlay: true,
        canPause: true,
        canNext: true,
        canPrev: true,
        canSeek: true,
        artKey: `demo-${trackIndex}`,
        art: makeArt(t.hues, trackIndex + 1)
      };
    }
    if (kind === "message") {
      return {
        type: "toast",
        id: `demo-msg-${Date.now()}`,
        time: Date.now(),
        app: { aumid: "Microsoft.YourPhone_8wekyb3d8bbwe!App", name: "Phone Link", phone: true },
        texts: [sm.name, sm.msg],
        attribution: "WhatsApp",
        header: "",
        images: [],
        actions: [{ content: "Send", inputId: "reply" }, { content: "Mark as read" }],
        inputs: [{ id: "reply", type: "text", placeholder: "" }],
        avatarData: makeAvatar(sm.name, 330)
      };
    }
    if (kind === "call") {
      return {
        type: "toast",
        id: `demo-call-${Date.now()}`,
        time: Date.now(),
        call: true,
        scenario: "incomingCall",
        app: { aumid: "Microsoft.YourPhone_8wekyb3d8bbwe!App", name: "Phone Link", phone: true },
        texts: [sm.full, sm.mobile],
        images: [],
        actions: [{ content: "Accept", style: "Success" }, { content: "Decline", style: "Critical" }],
        inputs: [],
        avatarData: makeAvatar(sm.full, 200)
      };
    }
    if (kind === "weather") return demoWeather(lang);
    return {};
  }
  var DEMO_APPS = [
    { id: "a1", name: "Visual Studio Code", kind: "file", icon: null },
    { id: "a2", name: "Telegram", kind: "file", icon: null },
    { id: "a3", name: "Photoshop", kind: "file", icon: null },
    { id: "a4", name: "GitHub", kind: "url", icon: null },
    { id: "a5", name: "Spotify", kind: "aumid", icon: null },
    { id: "a6", name: "Figma", kind: "file", icon: null },
    { id: "k1", name: "Play / Pause", kind: "media", target: "toggle", size: "2x1" },
    { id: "k2", name: "Next", kind: "media", target: "next" },
    { id: "k3", name: "Mute", kind: "media", target: "mute", color: "#ff9f0a" },
    { id: "k4", name: "Save all", kind: "hotkey", target: "Ctrl+Shift+S", vk: 83, mods: 5 },
    { id: "k5", name: "Screenshot", kind: "action", target: "screenshot" },
    { id: "k6", name: "Lock", kind: "action", target: "lock", color: "#ff453a" },
    { id: "k7", name: "Build", kind: "command", target: "npm run build", glyph: "rocket" },
    { id: "k8", name: "Signature", kind: "text", target: "Best regards", glyph: "send", color: "#64d2ff" }
  ];
  var DEMO_PHONE = {
    me: { id: "pc", name: "My PC", port: 1716, ips: ["192.168.1.20"] },
    devices: [{ id: "p1", name: "Galaxy S24", type: "phone", connected: true, paired: true, pairState: "paired", battery: 76, charging: false, wifi: true, bluetooth: false, island: { app: "Blinkelo Link", version: "1.0.0" } }]
  };
  function demoWidgets(lang) {
    const now = Date.now();
    return {
      crypto: { currency: "USD", source: "CoinGecko", items: [{ sym: "BTC", price: 68012.4, change: 2.14 }, { sym: "ETH", price: 3187.2, change: -0.86 }, { sym: "USDT", price: 1.0001, change: 0.01 }, { sym: "TON", price: 4.42, change: 4.7 }], updatedAt: now },
      news: {
        items: [
          ["Next-gen laptop chips focus on on-device AI", "The Verge"],
          ["Gold climbs to a three-month high", "BBC World"],
          ["What is new in the latest Windows 11 update", "The Verge"],
          ["Volleyball team prepares for the world championship", "BBC World"]
        ].map(([title, feed], i) => ({ title, feed, link: "https://example.com/", time: now - (i + 1) * 23 * 6e4 })),
        updatedAt: now
      }
    };
  }
  function createDemoBridge() {
    const listeners = {};
    const emit = (ch, payload) => (listeners[ch] || []).forEach((cb) => cb(payload));
    const params = new URLSearchParams(location.search);
    let statsTimer = null;
    const settings = {};
    if (params.get("lang")) settings.language = params.get("lang");
    if (params.get("theme")) settings.theme = params.get("theme");
    if (params.get("deck")) settings.deck = { size: params.get("deck") };
    if (params.get("tp")) settings.transparency = Number(params.get("tp"));
    const shelf = [
      { path: "C:\\Users\\me\\Desktop\\Report.pdf", name: "Report.pdf", isDir: false },
      { path: "C:\\Users\\me\\Pictures\\cover.png", name: "cover.png", isDir: false },
      { path: "C:\\Projects\\island", name: "island", isDir: true }
    ];
    const clips = [
      { id: "c1", kind: "text", text: "https://github.com/SaeedSH", time: Date.now() - 6e4 },
      { id: "c2", kind: "text", text: "Meeting tomorrow at 10 am", time: Date.now() - 6e5 }
    ];
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const today = /* @__PURE__ */ new Date();
    let tasks = [
      { id: "t1", title: "Project team meeting", date: iso(today), time: "10:30", done: false, color: "blue", created: 1 },
      { id: "t2", title: "Send the weekly report", date: iso(today), time: null, done: true, color: "green", created: 2 },
      { id: "t3", title: "Buy a birthday gift", date: iso(today), time: "18:00", done: false, color: "orange", created: 3 },
      { id: "t4", title: "Dentist", date: iso(new Date(today.getTime() + 2 * 864e5)), time: "16:00", done: false, color: "red", created: 4 },
      { id: "t5", title: "Renew subscription", date: iso(new Date(today.getTime() - 3 * 864e5)), time: null, done: true, color: "blue", created: 5 }
    ];
    const gmode = params.get("gaming") || "";
    const gm = {
      enabled: gmode !== "off",
      manual: gmode === "playing",
      active: gmode === "playing",
      game: gmode === "playing" ? { name: "cyberpunk2077", title: "Cyberpunk 2077", start: Date.now() - 228e4, front: true } : null,
      candidate: gmode === "ask" ? { name: "witcher3", title: "The Witcher 3" } : null,
      metrics: null,
      opt: { running: false, steps: [], at: 0, freed: 0, closed: 0, mode: "" },
      optimized: false,
      hud: gmode === "playing",
      fps: { etw: gmode === "denied" ? "denied" : "ok", access: null, rtss: false },
      sessions: [{ id: "s1", name: "eldenring", title: "ELDEN RING", dur: 4325, avgFps: 96, low1: 61, maxCpuTemp: 74, maxGpuTemp: 79 }]
    };
    const gmTick = () => {
      const r = (a, b) => Math.round(a + Math.random() * (b - a));
      gm.metrics = { fps: gm.game ? r(128, 146) : r(58, 62), low1: gm.game ? 97 : 55, ft: 7.1, fpsSrc: "etw", cpu: r(31, 44), cpuTemp: r(61, 66), gpu: gm.game ? r(94, 99) : r(6, 14), gpuTemp: gm.game ? r(70, 73) : 48, ram: 61, ramUsed: 196e8, ramTotal: 32e9, vram: (gm.game ? 6.1 : 1.4) * 1073741824, vramTotal: 8 * 1073741824, ping: r(21, 29) };
      emit("gaming", JSON.parse(JSON.stringify(gm)));
    };
    setInterval(gmTick, 1e3);
    setTimeout(gmTick, 50);
    const gmIcon = (letter, c1, c2) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='64' height='64' rx='14' fill='url(#g)'/><text x='32' y='43' font-family='Arial' font-weight='700' font-size='30' fill='white' text-anchor='middle'>${letter}</text></svg>`)}`;
    const gmLib = [["Cyberpunk 2077", "C", "#fde047", "#ca8a04"], ["ELDEN RING", "E", "#a8a29e", "#44403c"], ["Counter-Strike 2", "CS", "#f59e0b", "#1e293b"], ["Forza Horizon 5", "F", "#ec4899", "#7c3aed"], ["The Witcher 3", "W", "#ef4444", "#450a0a"], ["Hades II", "H", "#22c55e", "#14532d"], ["Baldur\u2019s Gate 3", "B", "#a855f7", "#1e1b4b"], ["Red Dead Redemption 2", "R", "#dc2626", "#111827"], ["Hollow Knight", "K", "#60a5fa", "#0f172a"]].map(([name, l, a, b], i) => ({ id: `demo:${i}`, name, source: i % 3 ? "steam" : "epic", played: 0, hidden: false, icon: gmIcon(l, a, b) }));
    const gmCmd = (name, a) => {
      if (name === "library") return new Promise((res) => setTimeout(() => res(params.get("nolib") ? [] : gmLib), 350));
      if (name === "launch") return new Promise((res) => {
        gm.launching = a.id;
        setTimeout(() => {
          gm.launching = null;
          res({ ok: true });
        }, 1800);
      });
      if (name === "toggle") {
        gm.manual = !gm.manual;
        gm.active = gm.manual || !!gm.game;
      }
      if (name === "hud") gm.hud = !gm.hud;
      if (name === "restore") {
        gm.optimized = false;
        gm.opt = { running: false, steps: [], at: 0, freed: 0, closed: 0, mode: "" };
      }
      if (name === "markGame") gm.candidate = null;
      if (name === "optimize") {
        const keys2 = ["power", "gameMode", "close", "memory", "priority"];
        gm.manual = true;
        gm.active = true;
        gm.opt = { running: true, steps: keys2.map((key) => ({ key, status: "wait" })), at: Date.now(), freed: 0, closed: 0, mode: "" };
        keys2.forEach((k, i) => {
          setTimeout(() => {
            gm.opt.steps[i].status = "run";
            emit("gaming", JSON.parse(JSON.stringify(gm)));
          }, 120 + i * 520);
          setTimeout(() => {
            gm.opt.steps[i].status = k === "priority" && !gm.game ? "later" : k === "gameMode" ? "skip" : "ok";
            if (k === "gameMode") gm.opt.steps[i].detail = "already";
            emit("gaming", JSON.parse(JSON.stringify(gm)));
          }, 520 + i * 520);
        });
        setTimeout(() => {
          gm.opt.running = false;
          gm.optimized = true;
          gm.opt.freed = 132e7;
          gm.opt.closed = 2;
          emit("gaming", JSON.parse(JSON.stringify(gm)));
        }, 300 + keys2.length * 520);
      }
      if (name === "allowFps") return new Promise((res) => setTimeout(() => res({ ok: true, signOut: true }), 700));
      setTimeout(gmTick, 0);
      return Promise.resolve(JSON.parse(JSON.stringify(gm)));
    };
    const bridge2 = {
      platform: "demo",
      on(ch, cb) {
        (listeners[ch] = listeners[ch] || []).push(cb);
        return () => {
        };
      },
      helper(name, ...args) {
        if (params.has("debug")) console.log("[helper]", name, args);
      },
      invoke(name, arg) {
        switch (name) {
          case "settings:get":
            return Promise.resolve(Object.keys(settings).length ? settings : null);
          case "accent:get":
            return Promise.resolve("#0a84ff");
          case "shelf:get":
            return Promise.resolve(shelf);
          case "shelf:add":
            return Promise.resolve(shelf);
          case "clipboard:history":
            return Promise.resolve(clips);
          case "shortcuts:get":
            return Promise.resolve(params.has("apps") ? DEMO_APPS : []);
          case "weather:get":
            return Promise.resolve(params.has("wx") ? demoWeather(params.get("lang") || "en") : null);
          case "phone:get":
            return Promise.resolve(params.has("phone") ? DEMO_PHONE : null);
          case "widgets:get":
            return Promise.resolve(demoWidgets(params.get("lang") || "en"));
          case "tasks:get":
            return Promise.resolve(tasks);
          case "tasks:add": {
            const t = { id: `t${Date.now()}`, done: false, color: "blue", created: Date.now(), ...arg };
            tasks.push(t);
            return Promise.resolve(t);
          }
          case "tasks:update":
            return Promise.resolve(true);
          case "tasks:remove":
            tasks = tasks.filter((x) => x.id !== arg);
            return Promise.resolve(true);
          case "settings:set":
            return Promise.resolve(null);
          case "gaming:get":
            return Promise.resolve(JSON.parse(JSON.stringify(gm)));
          case "gaming:cmd":
            return gmCmd(arg, arguments[2] || {});
          default:
            return Promise.resolve(null);
        }
      },
      setRects() {
      },
      setInteractive() {
      },
      setFocus() {
      },
      attention() {
      },
      stats(on) {
        clearInterval(statsTimer);
        if (!on) return;
        const send = () => emit("stats", { cpu: 18 + Math.random() * 20, ram: 54 + Math.random() * 4, ramUsed: 174e8, ramTotal: 32e9, gpu: 9 + Math.random() * 10, gpuTemp: 47 });
        send();
        statsTimer = setInterval(send, 2e3);
      },
      startDrag() {
      },
      phone(name, args) {
        if (params.has("debug")) console.log("[phone]", name, args);
        return Promise.resolve(true);
      },
      hit() {
      },
      drag() {
      },
      pathForFile(f) {
        return f.name;
      },
      log(...a) {
        console.log(...a);
      }
    };
    window.__demo = { emit, run: (k) => emit("demo", k), hover: (v) => emit("hover", v) };
    setTimeout(() => emit("helper", { type: "net", down: 24e5, up: 31e4 }), 100);
    setTimeout(() => emit("helper", { type: "battery", has: true, plugged: true, charging: true, percent: 82 }), 100);
    return bridge2;
  }

  // src/renderer/island/island.js
  var bridge = window.island || createDemoBridge();
  var IS_DEMO = !window.island;
  var state = {
    settings: {
      language: "en",
      style: "floating",
      scale: 1,
      topOffset: 8,
      glow: true,
      edgeLight: true,
      idleClock: false,
      hideInFullscreen: true,
      respectDnd: true,
      sound: true,
      movable: true,
      minimized: false,
      modules: { media: true, visualizer: true, notifications: true, phoneCalls: true, volumeHud: true, battery: true, capsLock: true, numLock: false, clipboard: true, privacy: true, stats: true, shelf: true, timer: true, weather: true },
      notifications: { duration: 5, blocked: [], showBody: true },
      media: { pausedTimeout: 25, compactInfo: true },
      blink: { hello: true, peeks: false, events: true }
    },
    hover: false,
    everHovered: false,
    expanded: null,
    // 'media' | 'notification' | 'timer' | 'callActive' | 'dashboard' | 'subs'
    expandedNotif: null,
    notifStatus: null,
    pinned: false,
    homeEdit: false,
    // the home tab is in layout-edit mode (keeps the dashboard open)
    homeNew: null,
    // tile that was just added (pops in once)
    homeNoRoom: false,
    sliderDrag: false,
    moving: false,
    inputFocused: false,
    tab: "home",
    pcMedia: null,
    phoneMedia: null,
    winMedia: null,
    // desktop players without Windows media controls (VLC 3, PotPlayer, MPC...)
    media: null,
    // the active one of the two
    mediaLastPlaying: 0,
    seekPreview: null,
    meter: { p: 0, l: 0, r: 0, at: 0 },
    volume: { level: 0.5, muted: false },
    volumeKnown: false,
    battery: null,
    keys: null,
    privacy: { mic: [], cam: [], loc: [] },
    privacyKnown: false,
    fullscreen: false,
    quiet: false,
    transient: null,
    notifQueue: [],
    notifHistory: [],
    recentKeys: /* @__PURE__ */ new Map(),
    call: null,
    pair: null,
    timer: null,
    sharedTimers: [],
    findPc: null,
    // { name } while a phone is ringing this PC
    timerDone: null,
    stats: null,
    net: null,
    shelf: [],
    clipHistory: [],
    shortcuts: [],
    weather: null,
    widgets: { crypto: null, news: null },
    tasks: [],
    planner: null,
    // { cal, ym, sel } (built lazily from the settings)
    phone: { me: null, devices: [] },
    dragOver: false,
    outDrag: false,
    // a file is being dragged out of the island (shelf item, subtitle)
    subs: null,
    // subtitle finder state from main
    gaming: null,
    // gaming mode state from main
    gameLib: null,
    // installed games (with icons) for the gaming tab
    gameLibVer: -1
  };
  var i18n = createI18n(() => state.settings);
  var ctx = { i: i18n, st: state, get s() {
    return state.settings;
  } };
  var $ = (id) => document.getElementById(id);
  var stage = $("stage");
  var els = {
    glow: $("glow"),
    mainShadow: $("mainShadow"),
    bubbleShadow: $("bubbleShadow"),
    goo: $("gooLayer"),
    mainFill: $("mainFill"),
    bubbleFill: $("bubbleFill"),
    mainClip: $("mainClip"),
    bubbleClip: $("bubbleClip"),
    mainHost: $("mainHost"),
    bubbleHost: $("bubbleHost"),
    edge: $("edge"),
    wrap: $("islandWrap"),
    bkFace: $("bkFace"),
    bkLash: $("bkLash")
  };
  var geo = {
    w: new Spring(124),
    h: new Spring(30),
    r: new Spring(15),
    bs: new Spring(0, SPRINGS.bubble),
    bx: new Spring(-24, SPRINGS.bubble),
    glow: new Spring(0, SPRINGS.soft)
  };
  var animator = new Animator(onFrame);
  animator.add(...Object.values(geo));
  var GLOW_W = 400;
  var GLOW_H = 160;
  var GLOW_PAD_X = 58;
  var GLOW_PAD_Y = 42;
  var slots = {
    main: { key: null, el: null, view: null, data: null },
    bubble: { key: null, el: null, view: null, data: null }
  };
  var currentMain = "idle";
  var currentBubble = null;
  var lastRectsJson = "";
  var lastRects = [];
  function scale() {
    return clamp(Number(state.settings.scale) || 1, 0.7, 1.5);
  }
  function topOffset() {
    return state.settings.style === "notch" && !state.settings.position ? 0 : clamp(Number(state.settings.topOffset) || 0, 0, 80);
  }
  function placeBox(el, x, y, w, hh, r, notch) {
    el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    el.style.width = `${Math.max(0, w).toFixed(2)}px`;
    el.style.height = `${Math.max(0, hh).toFixed(2)}px`;
    el.style.borderRadius = notch ? `0 0 ${r.toFixed(2)}px ${r.toFixed(2)}px` : `${r.toFixed(2)}px`;
  }
  function layout(values) {
    const S = scale();
    const W = stage.clientWidth || window.innerWidth;
    const w = values.w * S;
    const hh = values.h * S;
    const r = Math.min(values.r * S, hh / 2, w / 2);
    const bs = Math.max(0, values.bs * S);
    const gap = values.bx * S;
    const shift = Math.max(0, (bs + gap) / 2);
    const top = topOffset();
    const left = (W - w) / 2 - shift;
    return { w, h: hh, r, bs, gap, top, left, bLeft: left + w + gap, bTop: top + (hh - bs) / 2 };
  }
  function isNotch() {
    return state.settings.style === "notch" && !state.settings.position;
  }
  function onFrame(dt, now) {
    const notch = isNotch();
    const L = layout({ w: geo.w.value, h: geo.h.value, r: geo.r.value, bs: geo.bs.value, bx: geo.bx.value });
    placeBox(els.mainFill, L.left, L.top, L.w, L.h, L.r, notch);
    placeBox(els.mainClip, L.left, L.top, L.w, L.h, L.r, notch);
    placeBox(els.mainShadow, L.left, L.top, L.w, L.h, L.r, notch);
    const bVisible = L.bs > 0.6;
    for (const el of [els.bubbleFill, els.bubbleClip, els.bubbleShadow]) {
      el.style.display = bVisible ? "block" : "none";
      if (bVisible) placeBox(el, L.bLeft, L.bTop, L.bs, L.bs, L.bs / 2, false);
    }
    els.goo.classList.toggle("goo-on", !(geo.bs.resting && geo.bx.resting));
    const gw = L.w + (bVisible ? L.bs + L.gap : 0);
    const peak = state.meter && now - state.meter.at < 400 ? state.meter.p : 0;
    const breathe = 1 + Math.min(peak, 1) * 0.08;
    const S = scale();
    const bw = gw + GLOW_PAD_X * 2 * S;
    const bh = L.h + GLOW_PAD_Y * 2 * S;
    els.glow.style.transform = `translate3d(${(L.left + gw / 2).toFixed(1)}px, ${(L.top + L.h / 2).toFixed(1)}px, 0) translate(-50%, -50%) scale(${(bw / GLOW_W * breathe).toFixed(3)}, ${(bh / GLOW_H * breathe).toFixed(3)})`;
    els.glow.style.opacity = String(clamp(geo.glow.value, 0, 1));
    vizFrame(now);
  }
  function isLive(m) {
    if (!m || !state.settings.modules.media) return false;
    if (m.status === "playing" || m.status === "changing") return true;
    if (m.status === "paused" || m.status === "stopped") return Date.now() - (m.lastPlayingAt || 0) < state.settings.media.pausedTimeout * 1e3;
    return false;
  }
  function winMediaDuplicate() {
    const w = state.winMedia;
    const p = state.pcMedia;
    if (!w || !p) return false;
    const exe = String(w.source || "").toLowerCase().replace(/\.exe$/, "").replace(/64x?$/, "");
    return !!exe && String(p.source || "").toLowerCase().includes(exe);
  }
  function pickMedia() {
    const list = [state.pcMedia, state.phoneMedia, winMediaDuplicate() ? null : state.winMedia].filter(Boolean);
    let m = null;
    const playing = list.filter((x) => x.status === "playing");
    const pool = playing.length ? playing : list;
    for (const x of pool) if (!m || (x.lastPlayingAt || 0) > (m.lastPlayingAt || 0)) m = x;
    state.media = m;
    if (m && m.status === "playing") state.mediaLastPlaying = Date.now();
  }
  function mediaIsLive() {
    return isLive(state.media);
  }
  function isVideoMedia(m) {
    return !!(m && !m.phone && (m.video || m.kind === "video"));
  }
  function subsOn() {
    return !!(state.subs && state.subs.enabled && state.subs.video);
  }
  function subsForMedia() {
    return subsOn() && isVideoMedia(state.media);
  }
  function subsBubbleOn() {
    return subsForMedia() && mediaIsLive() && ["searching", "downloading", "ready", "found"].includes(state.subs.status);
  }
  function phoneDevice() {
    const list = state.phone && state.phone.devices || [];
    return list.find((d) => d.paired && d.connected) || null;
  }
  function dashData() {
    return {
      tab: state.tab,
      pinned: state.pinned,
      media: state.media,
      seekPreview: state.seekPreview,
      stats: state.stats,
      net: state.net,
      battery: state.battery,
      notifHistory: state.notifHistory,
      shelf: state.shelf,
      clipHistory: state.clipHistory,
      shortcuts: state.shortcuts,
      weather: state.weather,
      phoneDevice: phoneDevice(),
      widgets: state.widgets,
      widgetActive: widgetActive(),
      widgetsCfg: widgetsCfg(),
      tasks: state.tasks,
      sharedTimers: state.sharedTimers,
      planner: plannerState(),
      home: state.settings.home,
      homeEdit: state.homeEdit,
      homeNew: state.homeNew,
      homeNoRoom: state.homeNoRoom,
      deckSize: state.settings.deck && state.settings.deck.size || "m",
      gaming: state.gaming,
      gameLib: state.gameLib ? state.gameLib.filter((x) => !x.hidden) : null,
      gmNote: state.gamingNote && state.gamingNote.until > Date.now() ? state.gamingNote : null,
      gmTemp: gmCfg().temp,
      gmHotkey: (gmCfg().hud || {}).hotkey || "",
      gmSteps: gmSteps()
    };
  }
  function gmCfg() {
    return state.settings.gaming || {};
  }
  function gmSteps() {
    const g = gmCfg();
    const o = g.optimize || { power: true, gameMode: true, memory: true, priority: "above" };
    const out = [];
    if (o.power) out.push("power");
    if (o.gameMode) out.push("gameMode");
    if (o.closeApps && (g.closeList || []).length) out.push("close");
    if (o.memory) out.push("memory");
    if (o.priority && o.priority !== "normal") out.push("priority");
    if (o.dvr) out.push("dvr");
    return out;
  }
  function widgetsCfg() {
    const w = state.settings.widgets || {};
    return { ...w, module: state.settings.modules.widgets !== false };
  }
  function widgetActive() {
    return state.settings.widgets && state.settings.widgets.active || "crypto";
  }
  function plannerState() {
    if (!state.planner) {
      const today = isoOf(/* @__PURE__ */ new Date());
      state.planner = { ym: currentYm(), sel: today };
    }
    return state.planner;
  }
  var homeHintTimer = null;
  var pinnedBeforeEdit = false;
  function setHomeEdit(on) {
    if (on === state.homeEdit) return;
    state.homeEdit = on;
    state.homeNoRoom = false;
    if (on) {
      pinnedBeforeEdit = state.pinned;
      state.pinned = true;
    } else state.pinned = pinnedBeforeEdit;
  }
  function saveHome(layout2) {
    saveSettings({ home: { layout: layout2, custom: true } });
  }
  function startTileDrag(e, tile, resize) {
    const type = tile.dataset.tile;
    const layout2 = HOME.normalize(state.settings.home);
    const item = layout2.find((r) => r.t === type);
    if (!item) return;
    e.preventDefault();
    const G = HOME.GRID;
    const stepX = G.cw + G.gap;
    const stepY = G.rh + G.gap;
    const sc = scale();
    const rtl = i18n.dir() === "rtl";
    const base = HOME.rectPx(item);
    const min = HOME.WIDGETS[type].min;
    const home = tile.parentElement;
    const ghost = document.createElement("div");
    ghost.className = "h-ghost";
    ghost.style.cssText = tileStyle(item);
    home.insertBefore(ghost, home.firstChild);
    tile.classList.add("dragging");
    state.sliderDrag = true;
    syncInteractive(true);
    try {
      tile.setPointerCapture(e.pointerId);
    } catch (_) {
    }
    let result = { ok: true, list: layout2 };
    let changed = false;
    const move = (ev) => {
      const sdx = (ev.clientX - e.clientX) / sc;
      const dy = (ev.clientY - e.clientY) / sc;
      const dx = rtl ? -sdx : sdx;
      let target;
      if (resize) {
        const w = clamp(Math.round((base.w + G.gap + dx) / stepX), min[0], G.cols - item.x);
        const h2 = clamp(Math.round((base.h + G.gap + dy) / stepY), min[1], G.rows - item.y);
        target = { ...item, w, h: h2 };
        tile.style.width = `${Math.max(min[0] * stepX - G.gap, base.w + dx)}px`;
        tile.style.height = `${Math.max(min[1] * stepY - G.gap, base.h + dy)}px`;
        result = HOME.resizeTile(layout2, type, w, h2);
      } else {
        const x = clamp(Math.round((base.x + dx) / stepX), 0, G.cols - item.w);
        const y = clamp(Math.round((base.y + dy) / stepY), 0, G.rows - item.h);
        target = { ...item, x, y };
        tile.style.transform = `translate(${sdx}px, ${dy}px)`;
        result = HOME.moveTile(layout2, type, x, y);
      }
      changed = target.x !== item.x || target.y !== item.y || target.w !== item.w || target.h !== item.h;
      ghost.style.cssText = tileStyle(target);
      ghost.classList.toggle("bad", !result.ok);
      syncInteractive();
    };
    const up = () => {
      tile.removeEventListener("pointermove", move);
      tile.removeEventListener("pointerup", up);
      tile.removeEventListener("pointercancel", up);
      tile.removeEventListener("lostpointercapture", up);
      tile.classList.remove("dragging");
      ghost.remove();
      const commit = result.ok && changed;
      for (const r of commit ? result.list : layout2) {
        const el = home.querySelector(`.h-tile[data-tile="${r.t}"]`);
        if (el) {
          el.style.cssText = tileStyle(r);
        }
      }
      suppressClick = true;
      setTimeout(() => {
        suppressClick = false;
      }, 80);
      state.sliderDrag = false;
      syncInteractive();
      if (commit) setTimeout(() => {
        saveHome(result.list);
        present();
      }, 300);
    };
    tile.addEventListener("pointermove", move);
    tile.addEventListener("pointerup", up);
    tile.addEventListener("pointercancel", up);
    tile.addEventListener("lostpointercapture", up);
  }
  function saveSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    bridge.invoke("settings:set", patch).catch(() => {
    });
  }
  function expandedView(name) {
    switch (name) {
      case "dashboard":
        return ["dashboard", dashData()];
      case "media":
        return state.media ? ["mediaExpanded", { media: state.media, volume: state.volume, seekPreview: state.seekPreview, cc: subsForMedia() }] : null;
      case "subs":
        return subsOn() ? ["subsPanel", { subs: state.subs }] : null;
      case "notification":
        return state.expandedNotif ? ["notificationExpanded", { n: state.expandedNotif, status: state.notifStatus && state.notifStatus.text, statusOk: state.notifStatus && state.notifStatus.ok }] : null;
      case "timer":
        return state.timer ? ["timerExpanded", { timer: state.timer }] : null;
      case "callActive":
        return state.call && state.call.state === "active" ? ["callActiveExpanded", { call: state.call }] : null;
      default:
        return null;
    }
  }
  function transientView(tr) {
    const hover = state.hover;
    switch (tr.kind) {
      case "notification":
        return ["notification", { n: tr.data, queue: state.notifQueue.length, hover }];
      case "volume":
        return ["volume", { volume: state.volume }];
      case "battery":
        return state.battery ? ["battery", { battery: state.battery, kind: tr.data.kind }] : null;
      case "keys":
        return ["keys", tr.data];
      case "copied":
        return ["copied", tr.data];
      case "privacy":
        return ["privacy", tr.data];
      case "message":
        return ["message", tr.data];
      case "track":
        return state.media ? ["track", { media: state.media }] : null;
      case "received":
        return ["received", tr.data];
      case "transfer":
        return ["transfer", tr.data];
      case "subsReady":
        return state.subs && state.subs.file ? ["subsReady", { file: state.subs.file }] : null;
      case "gameSummary":
        return ["gameSummary", tr.data];
      case "gameLaunch":
        return ["gameLaunch", tr.data];
      default:
        return null;
    }
  }
  function liveActivity() {
    if (state.call && state.call.state === "active" && !state.call.hidden) return "call";
    if (state.timer && state.settings.modules.timer) return "timer";
    if (mediaIsLive() && state.media.status === "playing") return "media";
    return "";
  }
  function computePresentation() {
    const st = state;
    const s = st.settings;
    const hover = st.hover;
    if (st.dragOver && !st.outDrag && s.modules.shelf) return { main: ["drop", { apps: st.expanded === "dashboard" && st.tab === "apps" }] };
    if (st.call && st.call.state === "incoming") return { main: ["call", { call: st.call }] };
    if (st.pair) return { main: ["pair", { pair: st.pair }] };
    if (st.findPc) return { main: ["findPc", st.findPc] };
    if (st.timerDone) return { main: ["timerDone", st.timerDone] };
    if (st.transient && (st.transient.kind === "message" || st.transient.kind === "received")) return { main: transientView(st.transient) };
    if (st.expanded) {
      const ex = expandedView(st.expanded);
      if (ex) return { main: ex };
      st.expanded = null;
    }
    if (st.transient) {
      const tv = transientView(st.transient);
      if (tv) return { main: tv };
    }
    if (s.minimized && !hover && !st.moving) return { main: ["handle", { activity: liveActivity() }] };
    const live = [];
    if (st.call && st.call.state === "active" && !st.call.hidden) live.push(["callActive", { call: st.call, hover }]);
    if (st.timer && s.modules.timer) live.push(["timer", { timer: st.timer, hover }]);
    if (mediaIsLive()) live.push(["media", { media: st.media, hover, info: !s.media || s.media.compactInfo !== false }]);
    if (live.length) {
      let bubble = null;
      if (live.length > 1) {
        const second = live[1][0];
        if (second === "timer") bubble = ["timerMini", { timer: st.timer }];
        else if (second === "media") bubble = ["mediaMini", { media: st.media }];
      }
      if (!bubble && subsBubbleOn()) bubble = ["subsMini", { subs: st.subs }];
      return { main: live[0], bubble };
    }
    return { main: ["idle", { hover, privacy: st.privacy, weather: s.modules.weather ? st.weather : null }] };
  }
  var presentQueued = false;
  function present() {
    if (presentQueued) return;
    presentQueued = true;
    queueMicrotask(() => {
      presentQueued = false;
      presentNow();
    });
  }
  function presentNow() {
    const p = computePresentation();
    const [mainName, mainData] = p.main;
    const view = VIEWS[mainName];
    const size = view.size(mainData, ctx);
    const target = { w: size.w, h: size.h, r: size.r === void 0 ? size.h / 2 : size.r };
    if (isNotch()) target.r = Math.min(target.r, 30);
    if ((peek.busy || peek.booting) && (mainName !== "idle" || state.hover || state.moving)) cancelPeek();
    setSlot("main", view, mainData, target);
    if (view.autoHeight && slots.main.measuredH) target.h = slots.main.measuredH;
    if (BLINK_VIEWS.has(mainName)) maybeBlink(mainName);
    const growing = target.w * target.h > geo.w.target * geo.h.target + 1;
    const opts = growing ? SPRINGS.expand : SPRINGS.collapse;
    if (target.w !== geo.w.target || target.h !== geo.h.target || target.r !== geo.r.target) {
      geo.w.to(target.w, opts);
      geo.h.to(target.h, opts);
      geo.r.to(target.r, opts);
    }
    const bubbleOn = !!p.bubble;
    geo.bs.to(bubbleOn ? 32 : 0, SPRINGS.bubble);
    geo.bx.to(bubbleOn ? 8 : -24, SPRINGS.bubble);
    setSlot("bubble", p.bubble ? VIEWS[p.bubble[0]] : null, p.bubble ? p.bubble[1] : null, { w: 32, h: 32 });
    currentMain = mainName;
    currentBubble = p.bubble ? p.bubble[0] : null;
    updateGlow();
    updateMeterSubscription();
    sendRects(target, bubbleOn);
    document.body.dataset.view = mainName;
    syncGamingPanel();
    animator.kick();
  }
  els.bkFace.innerHTML = faceHtml("asleep");
  var islandFace = createBlinker(els.bkFace.firstElementChild, { onMove: faceMoved });
  var peek = { busy: false, booting: true, kind: "", token: 0, timer: null, helloQueued: false };
  function blinkCfg() {
    return state.settings.blink || {};
  }
  function faceMoved(kind) {
    if (kind === "blink" || kind === "blink2") {
      geo.h.impulse(-110);
      geo.w.impulse(80);
    } else if (kind === "wink") {
      geo.h.impulse(-70);
      geo.w.impulse(150);
    } else if (kind === "wake") {
      geo.h.impulse(150);
      geo.w.impulse(190);
    } else return;
    animator.kick();
  }
  function canPeek(kind, force = false) {
    const s = state.settings;
    if (currentMain !== "idle" || state.hover || state.moving || state.dragOver || state.fullscreen || state.quiet || s.hidden || document.hidden) return false;
    if (force) return true;
    if (reducedMotion()) return false;
    return kind === "hello" ? blinkCfg().hello !== false : blinkCfg().peeks === true;
  }
  function endBoot() {
    if (!peek.booting) return;
    peek.booting = false;
    document.body.classList.remove("bk-boot");
    if (!peek.busy) document.body.classList.remove("bk-peek");
  }
  async function runPeek(kind = "random", force = false) {
    if (peek.busy || !canPeek(kind, force)) {
      if (kind === "hello") endBoot();
      return false;
    }
    peek.busy = true;
    peek.kind = kind;
    const token = ++peek.token;
    const live = () => token === peek.token;
    const fromBoot = peek.booting;
    document.body.classList.add("bk-peek");
    if (fromBoot) {
      peek.booting = false;
      document.body.classList.remove("bk-boot");
    }
    const f = islandFace;
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));
    try {
      if (!fromBoot) await pause(160);
      if (!live()) return false;
      await f.wake();
      const steps = [];
      if (kind === "hello") steps.push(() => pause(140), () => f.look(-1), () => f.look(1), () => pause(90), () => f.blink(), () => pause(200), () => f.wink(), () => pause(260));
      else {
        const r = Math.random();
        if (r < 0.42) steps.push(() => pause(380), () => f.blink(), () => pause(650));
        else if (r < 0.66) steps.push(() => pause(240), () => f.blink2(), () => pause(520));
        else if (r < 0.86) steps.push(() => pause(200), () => f.look(Math.random() < 0.5 ? -1 : 1), () => f.blink(), () => pause(300));
        else steps.push(() => pause(300), () => f.wink(), () => pause(320));
      }
      for (const step of steps) {
        if (!live()) return false;
        await step();
      }
      return live();
    } finally {
      if (live()) endPeek(false);
    }
  }
  function endPeek(immediate) {
    peek.busy = false;
    islandFace.sleep();
    const token = peek.token;
    if (immediate) document.body.classList.remove("bk-peek");
    else setTimeout(() => {
      if (token === peek.token && !peek.busy) document.body.classList.remove("bk-peek");
    }, 190);
  }
  function cancelPeek() {
    peek.token += 1;
    peek.booting = false;
    document.body.classList.remove("bk-boot");
    endPeek(true);
  }
  function schedulePeek(ms) {
    clearTimeout(peek.timer);
    peek.timer = setTimeout(async () => {
      if (blinkCfg().peeks !== true) {
        schedulePeek(3e4);
        return;
      }
      const shown = await runPeek("random");
      schedulePeek(shown ? 55e3 + Math.random() * 85e3 : 15e3 + Math.random() * 1e4);
    }, ms);
  }
  function queueHello() {
    if (peek.helloQueued) return;
    peek.helloQueued = true;
    setTimeout(async () => {
      const shown = await runPeek("hello");
      schedulePeek(shown ? 5e4 + Math.random() * 4e4 : 12e3);
    }, 450);
  }
  var BLINK_VIEWS = /* @__PURE__ */ new Set(["notification", "message", "received", "track", "call", "pair", "findPc", "timerDone", "gameSummary", "gameLaunch", "subsReady"]);
  var LASH = { call: "var(--green)", pair: "var(--green)", findPc: "var(--red)", timerDone: "var(--orange)", gameSummary: "var(--purple)", gameLaunch: "var(--purple)", subsReady: "var(--green)" };
  var blinkedObjs = /* @__PURE__ */ new WeakSet();
  var blinkedIds = [];
  var revealTimer = null;
  function blinkSubject(name) {
    switch (name) {
      case "call":
        return state.call ? `call:${state.call.id}` : null;
      case "pair":
        return state.pair ? `pair:${state.pair.id}` : null;
      case "findPc":
        return state.findPc;
      case "timerDone":
        return state.timerDone;
      // notification, message, received, track, game*, subsReady come in as transients; a transient of the same kind
      // is reused for the next one, so its data object is what identifies "a new thing"
      default:
        return state.transient && state.transient.data && typeof state.transient.data === "object" ? state.transient.data : null;
    }
  }
  function maybeBlink(name) {
    const subj = blinkSubject(name);
    if (!subj) return;
    if (typeof subj === "string") {
      if (blinkedIds.includes(subj)) return;
      blinkedIds.push(subj);
      if (blinkedIds.length > 40) blinkedIds.shift();
    } else if (typeof subj === "object") {
      if (blinkedObjs.has(subj)) return;
      blinkedObjs.add(subj);
    } else return;
    islandBlink(lashColor(name));
  }
  function lashColor(name) {
    if (LASH[name]) return LASH[name];
    const d = state.transient && state.transient.data;
    if (name === "notification" && d && d.app && d.app.phone) return "var(--green)";
    if (name === "received") return "var(--green)";
    if (name === "message" && d && d.tone) return { green: "var(--green)", red: "var(--red)", orange: "var(--orange)", blue: "var(--accent)" }[d.tone] || "var(--accent)";
    return "var(--accent)";
  }
  function islandBlink(color) {
    if (blinkCfg().events === false || reducedMotion()) return;
    const c = els.mainClip;
    c.style.setProperty("--bk-lash", color || "var(--accent)");
    c.classList.remove("bk-reveal");
    void c.offsetWidth;
    c.classList.add("bk-reveal");
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => c.classList.remove("bk-reveal"), 640);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && peek.busy) cancelPeek();
  });
  var gamingPanelSent = false;
  function syncGamingPanel() {
    const want = state.expanded === "dashboard" && state.tab === "gaming";
    if (want === gamingPanelSent) return;
    gamingPanelSent = want;
    bridge.invoke("gaming:cmd", "panel", { open: want }).catch(() => {
    });
  }
  function gamingCommand(name, args = {}) {
    return bridge.invoke("gaming:cmd", name, args).then((g) => {
      if (g && typeof g === "object" && "enabled" in g) {
        state.gaming = g;
        present();
      }
      return g;
    }).catch(() => null);
  }
  function loadGameLib(refresh) {
    state.gameLibStale = false;
    return bridge.invoke("gaming:cmd", "library", { refresh }).then((lib) => {
      if (Array.isArray(lib)) {
        state.gameLib = lib;
        if (state.expanded === "dashboard" && state.tab === "gaming") present();
      }
    }).catch(() => {
    });
  }
  function onGaming(g) {
    if (g && typeof g.libVer === "number" && g.libVer !== state.gameLibVer) {
      state.gameLibVer = g.libVer;
      if (state.gameLib) {
        state.gameLibStale = true;
        if (state.expanded === "dashboard" && state.tab === "gaming") loadGameLib(false);
      }
    }
    state.gaming = g || null;
    if (state.expanded === "dashboard" && state.tab === "gaming") present();
  }
  function setSlot(slotName, view, data, size) {
    const slot = slots[slotName];
    const host = slotName === "main" ? els.mainHost : els.bubbleHost;
    const key = view ? view.key(data, ctx) : null;
    if (key && key === slot.key) {
      slot.data = data;
      if (view.update) view.update(slot.el, data, ctx);
      if (slot.el) {
        slot.el.style.width = `${size.w}px`;
        if (!view.autoHeight) slot.el.style.height = `${size.h}px`;
      }
      return;
    }
    const old = slot.el;
    if (old) {
      old.style.pointerEvents = "none";
      old.classList.add("leaving");
      const a = old.animate(
        [{ opacity: 1, filter: "blur(0px)", transform: "scale(1)" }, { opacity: 0, filter: "blur(7px)", transform: "scale(0.94)" }],
        { duration: 170, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" }
      );
      a.onfinish = () => old.remove();
    }
    slot.key = key;
    slot.view = view;
    slot.data = data;
    slot.el = null;
    slot.measuredH = 0;
    if (!view) return;
    const el = view.render(data, ctx);
    el.classList.add("view", `v-${view.name}`);
    el.style.width = `${size.w}px`;
    el.style.height = `${size.h}px`;
    host.appendChild(el);
    if (view.update) view.update(el, data, ctx);
    if (view.autoHeight) {
      el.style.height = "auto";
      slot.measuredH = Math.ceil(el.offsetHeight);
      el.style.height = `${slot.measuredH}px`;
    }
    el.animate(
      [{ opacity: 0, filter: "blur(9px)", transform: "scale(0.9)" }, { opacity: 1, filter: "blur(0px)", transform: "scale(1)" }],
      { duration: 430, delay: old ? 90 : 40, easing: "cubic-bezier(.2,.9,.25,1.08)", fill: "backwards" }
    );
    el.querySelectorAll("[data-s]").forEach((c, idx) => {
      c.animate(
        [{ opacity: 0, transform: "translateY(8px) scale(.98)" }, { opacity: 1, transform: "none" }],
        { duration: 420, delay: 150 + idx * 45, easing: "cubic-bezier(.2,.8,.2,1)", fill: "backwards" }
      );
    });
    slot.el = el;
    requestAnimationFrame(() => setupMarquees(el));
  }
  function setupMarquees(root) {
    root.querySelectorAll(".marquee").forEach((m) => {
      const span = m.firstElementChild;
      if (!span) return;
      const rtl = getComputedStyle(span).direction === "rtl" || /^[^A-Za-z0-9]*[\u0590-\u08FF]/.test(span.textContent || "");
      m.classList.toggle("rtl", rtl);
      const over = span.scrollWidth - m.clientWidth;
      if (over > 4) {
        m.classList.add("scroll");
        m.style.setProperty("--mq", `${rtl ? over + 16 : -over - 16}px`);
        m.style.setProperty("--mqd", `${Math.max(6, over / 22)}s`);
      } else m.classList.remove("scroll");
    });
  }
  function sendRects(target, bubbleOn) {
    const L = layout({ w: target.w, h: Math.max(target.h, 10), r: target.r, bs: bubbleOn ? 32 : 0, bx: bubbleOn ? 8 : -24 });
    const padY = currentMain === "handle" ? 8 : 0;
    const rects = [{ x: Math.round(L.left), y: Math.round(L.top), w: Math.round(L.w), h: Math.round(L.h + padY) }];
    if (bubbleOn) rects.push({ x: Math.round(L.bLeft), y: Math.round(L.bTop), w: Math.round(L.bs), h: Math.round(L.bs) });
    lastRects = rects;
    const json = JSON.stringify(rects);
    if (json !== lastRectsJson) {
      lastRectsJson = json;
      bridge.setRects(rects);
    }
  }
  function updateGlow() {
    const s = state.settings;
    let target = 0;
    let c1 = null;
    let c2 = null;
    if (s.glow) {
      if (state.call && state.call.state === "incoming" || currentMain === "pair") {
        target = 0.75;
        c1 = "var(--green)";
        c2 = "hsl(150 80% 45%)";
      } else if (currentMain === "timerDone") {
        target = 0.7;
        c1 = "var(--orange)";
        c2 = "hsl(20 95% 55%)";
      } else if (["media", "mediaExpanded", "track"].includes(currentMain) && state.media && state.media.status === "playing") {
        target = currentMain === "media" ? 0.5 : 0.8;
        c1 = state.media.colors && state.media.colors.c1 || "var(--accent)";
        c2 = state.media.colors && state.media.colors.c2 || "var(--purple)";
      } else if (currentMain === "dashboard") {
        target = 0.35;
        c1 = "var(--accent)";
        c2 = "var(--purple)";
      }
    }
    if (c1) {
      els.glow.style.setProperty("--g1", c1);
      els.glow.style.setProperty("--g2", c2);
    }
    const mc = state.media && state.media.colors;
    document.documentElement.style.setProperty("--m1", mc ? mc.c1 : "#ffffff");
    document.documentElement.style.setProperty("--m2", mc ? mc.c2 : "rgba(255,255,255,.7)");
    geo.glow.to(target, SPRINGS.soft);
  }
  function edge(color, loop = false) {
    if (!state.settings.edgeLight) return;
    const e = els.edge;
    e.style.setProperty("--edge", color);
    e.classList.remove("run", "loop");
    void e.offsetWidth;
    e.classList.add(loop ? "loop" : "run");
  }
  function stopEdge() {
    els.edge.classList.remove("run", "loop");
  }
  function bump(strength = 1) {
    geo.w.impulse(260 * strength);
    geo.h.impulse(60 * strength);
    animator.kick();
  }
  function shake() {
    els.wrap.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-4px)" }, { transform: "translateX(2px)" }, { transform: "translateX(0)" }],
      { duration: 520, easing: "ease-out" }
    );
  }
  var vizState = /* @__PURE__ */ new WeakMap();
  var meterSubscribed = false;
  function wantsMeter() {
    return state.settings.modules.visualizer && state.media && state.media.status === "playing" && ["media", "mediaExpanded", "track", "mediaMini", "dashboard", "handle"].some((v) => v === currentMain || v === currentBubble);
  }
  function updateMeterSubscription() {
    const want = wantsMeter() || state.call && state.call.state === "active" && !state.call.hidden;
    if (want !== meterSubscribed) {
      meterSubscribed = want;
      bridge.helper("audio.meter", want && !(state.media && state.media.phone) ? "1" : "0");
      if (want) animator.hold("viz");
      else animator.release("viz");
    }
  }
  function vizFrame(now) {
    if (!meterSubscribed) return;
    const bars = stage.querySelectorAll(".viz");
    if (!bars.length) return;
    const t = now / 1e3;
    const fresh = now - state.meter.at < 600 && !(state.media && state.media.phone);
    const playing = state.media && state.media.status === "playing";
    let base;
    if (fresh) base = clamp(Math.pow(state.meter.p, 0.7) * 1.25, 0, 1);
    else base = playing ? 0.45 + 0.22 * Math.sin(t * 2.3) + 0.12 * Math.sin(t * 5.7) : 0.12;
    bars.forEach((v) => {
      let vs = vizState.get(v);
      const kids = v.children;
      if (!vs || vs.length !== kids.length) {
        vs = Array.from(kids, (_, i) => ({ cur: 0.2, phase: i * 1.7 + Math.random(), speed: 5 + Math.random() * 4 }));
        vizState.set(v, vs);
      }
      const green = v.classList.contains("viz-green");
      for (let i = 0; i < kids.length; i++) {
        const b = vs[i];
        const center = 1 - Math.abs(i - (kids.length - 1) / 2) / kids.length;
        const wobble = 0.55 + 0.45 * Math.sin(t * b.speed + b.phase) * Math.sin(t * (b.speed * 0.37) + b.phase * 2);
        let target = green && !playing ? 0.3 + 0.35 * Math.abs(Math.sin(t * b.speed * 0.6 + b.phase)) : base * (0.45 + 0.55 * wobble) * (0.75 + 0.35 * center);
        target = clamp(target, 0.12, 1);
        b.cur += (target - b.cur) * (target > b.cur ? 0.45 : 0.18);
        kids[i].style.transform = `scaleY(${b.cur.toFixed(3)})`;
      }
    });
  }
  var interactiveSent = false;
  var interactiveRenewAt = 0;
  function syncInteractive(force = false) {
    const want = state.sliderDrag || state.inputFocused || state.dragOver || state.moving;
    const now = Date.now();
    if (want !== interactiveSent || want && (force || now > interactiveRenewAt)) {
      interactiveSent = want;
      interactiveRenewAt = now + 1e3;
      bridge.setInteractive(want);
    }
  }
  var transientTimer = null;
  var transientSeq = 0;
  var PRIORITY = { notification: 3, received: 2, transfer: 2, battery: 2, volume: 2, keys: 2, privacy: 2, message: 2, subsReady: 2, gameSummary: 2, gameLaunch: 2, copied: 1, track: 1 };
  function showTransient(kind, data, ms) {
    const cur = state.transient;
    if (state.expanded) {
      if (kind === "notification") {
        if (state.pinned || state.sliderDrag || state.inputFocused) {
          state.notifQueue.push(data);
          present();
          return;
        }
        collapse(false);
      } else if (kind === "volume" && state.expanded === "media") {
        present();
        return;
      } else if (kind !== "message" && kind !== "received") {
        return;
      }
    }
    if (cur && cur.kind === "notification" && kind !== "notification") {
      if (PRIORITY[kind] < 2) return;
      state.notifQueue.unshift(cur.data);
    }
    if (cur && cur.kind === kind && kind !== "notification") {
      cur.data = data;
      cur.until = Date.now() + ms;
      scheduleTransientEnd();
      present();
      return;
    }
    transientSeq += 1;
    state.transient = { kind, data, until: Date.now() + ms, id: transientSeq };
    scheduleTransientEnd();
    present();
  }
  function scheduleTransientEnd() {
    clearTimeout(transientTimer);
    if (!state.transient) return;
    transientTimer = setTimeout(checkTransient, Math.max(60, state.transient.until - Date.now()));
  }
  function checkTransient() {
    const tr = state.transient;
    if (!tr) return;
    if (state.hover && tr.kind !== "track" && tr.kind !== "message" || state.sliderDrag) {
      tr.until = Date.now() + 1300;
      scheduleTransientEnd();
      return;
    }
    if (Date.now() < tr.until - 20) {
      scheduleTransientEnd();
      return;
    }
    endTransient();
  }
  function endTransient() {
    state.transient = null;
    clearTimeout(transientTimer);
    if (state.notifQueue.length && !state.expanded) {
      const n = state.notifQueue.shift();
      showTransient("notification", n, notifMs());
      bump(0.6);
      return;
    }
    present();
  }
  function notifMs() {
    return clamp(Number(state.settings.notifications.duration) || 5, 2, 30) * 1e3;
  }
  function say(text, iconName = "sparkles", tone = "", ms = 2400) {
    showTransient("message", { id: `${Date.now()}${Math.random()}`, icon: iconName, text, tone }, ms);
  }
  var collapseTimer = null;
  var shortcutTimer = null;
  function expand(name) {
    if (name === "notification" && state.transient && state.transient.kind === "notification") {
      state.expandedNotif = state.transient.data;
      state.notifStatus = null;
      state.transient = null;
      clearTimeout(transientTimer);
    }
    state.expanded = name;
    if (name === "dashboard") {
      bridge.stats(true);
      refreshTabData(state.tab);
    }
    present();
  }
  function collapse(showQueued = true) {
    clearTimeout(collapseTimer);
    clearTimeout(shortcutTimer);
    if (state.expanded === "dashboard") bridge.stats(false);
    state.expanded = null;
    state.expandedNotif = null;
    state.notifStatus = null;
    state.seekPreview = null;
    state.pinned = false;
    state.homeEdit = false;
    state.homeNoRoom = false;
    if (state.inputFocused) {
      state.inputFocused = false;
      const f = stage.querySelector("input:focus");
      if (f) f.blur();
      bridge.setFocus(false);
    }
    syncInteractive();
    if (showQueued && !state.transient && state.notifQueue.length) {
      const n = state.notifQueue.shift();
      showTransient("notification", n, notifMs());
      return;
    }
    present();
  }
  function setHover(v) {
    if (state.hover === v) return;
    state.hover = v;
    if (v && (state.transient && state.transient.kind === "subsReady" || state.expanded === "subs")) bridge.attention(2e4);
    if (v) {
      state.everHovered = true;
      clearTimeout(collapseTimer);
      clearTimeout(shortcutTimer);
    } else if (state.expanded && !state.pinned) {
      clearTimeout(collapseTimer);
      collapseTimer = setTimeout(() => {
        if (!state.hover && !state.sliderDrag && !state.inputFocused && !state.pinned && !state.moving) collapse();
      }, 700);
    }
    present();
  }
  function openDashboard(viaShortcut = false, tab = null) {
    if (tab) state.tab = tab;
    expand("dashboard");
    if (viaShortcut) {
      state.everHovered = false;
      clearTimeout(shortcutTimer);
      shortcutTimer = setTimeout(() => {
        if (!state.everHovered && state.expanded === "dashboard" && !state.pinned) collapse();
      }, 9e3);
    }
  }
  function refreshTabData(tab) {
    if (tab === "alerts") bridge.helper("notif.recent", "30");
    if (tab === "shelf") bridge.invoke("shelf:get").then((s) => {
      state.shelf = s || [];
      present();
    }).catch(() => {
    });
    if (tab === "clipboard") bridge.invoke("clipboard:history").then((c) => {
      state.clipHistory = c || [];
      present();
    }).catch(() => {
    });
    if (tab === "apps") bridge.invoke("shortcuts:get").then((s) => {
      state.shortcuts = s || [];
      present();
    }).catch(() => {
    });
    if (tab === "planner") bridge.invoke("tasks:get").then((t) => {
      state.tasks = t || [];
      present();
    }).catch(() => {
    });
    if (tab === "gaming") {
      bridge.invoke("gaming:get").then((g) => {
        if (g) {
          state.gaming = g;
          present();
        }
      }).catch(() => {
      });
      if (!state.gameLib || state.gameLibStale) loadGameLib(false);
    }
  }
  function mergeMedia(prev, msg, isPhone) {
    if (!msg.present) return null;
    const sameTrack = prev && prev.artKey === msg.artKey;
    const m = { ...msg, receivedAt: Date.now(), demo: msg.demo || false, phone: isPhone };
    if (msg.kind === "video") m.video = true;
    if (Object.prototype.hasOwnProperty.call(msg, "art")) {
      m.art = msg.art || (sameTrack ? prev.art : null);
      m.colors = sameTrack && prev.colors && !msg.art ? prev.colors : null;
      if (msg.art && !(sameTrack && prev.art === msg.art && prev.colors)) {
        extractColors(msg.art).then((c) => {
          const cur = isPhone ? state.phoneMedia : state.pcMedia;
          if (cur && cur.artKey === m.artKey) {
            cur.colors = c;
            present();
          }
        });
      } else if (sameTrack && prev.art === msg.art) m.colors = prev.colors;
    } else if (sameTrack) {
      m.art = prev.art;
      m.colors = prev.colors;
    } else {
      m.art = null;
      m.colors = null;
    }
    m.lastPlayingAt = m.status === "playing" ? Date.now() : prev && prev.lastPlayingAt || 0;
    return m;
  }
  function onMedia(msg, isPhone = false) {
    const prevActive = state.media;
    const prev = isPhone ? state.phoneMedia : state.pcMedia;
    const m = mergeMedia(prev, msg, isPhone);
    if (isPhone) state.phoneMedia = m;
    else state.pcMedia = m;
    pickMedia();
    if (!state.media && state.expanded === "media") state.expanded = null;
    const cur = state.media;
    const trackChanged = cur && prevActive && cur === m && prevActive.title !== cur.title && cur.title && cur.status === "playing";
    const startedPlaying = cur && cur === m && (!prev || prev.status !== "playing") && cur.status === "playing";
    if (trackChanged && !state.expanded && !state.transient && state.settings.modules.media) showTransient("track", {}, 3200);
    else if (startedPlaying && currentMain === "idle") bump(0.4);
    present();
  }
  function mediaCommand(cmd) {
    const m = state.media;
    if (!m) return;
    const optimisticToggle = () => {
      m.position += m.status === "playing" ? (Date.now() - m.receivedAt) / 1e3 : 0;
      m.receivedAt = Date.now();
      m.status = m.status === "playing" ? "paused" : "playing";
      if (m.status === "playing") {
        m.lastPlayingAt = Date.now();
        state.mediaLastPlaying = Date.now();
      }
    };
    if (m.demo) {
      if (cmd === "media.toggle") optimisticToggle();
      else if (cmd === "media.next" || cmd === "media.prev") {
        onMedia({ ...demoPayload("music", cmd === "media.next" ? 1 : -1), demo: true });
        return;
      }
      present();
      return;
    }
    if (cmd === "media.toggle") {
      optimisticToggle();
      present();
    }
    if (m.phone) {
      const map = { "media.toggle": "PlayPause", "media.next": "Next", "media.prev": "Previous", "media.play": "Play", "media.pause": "Pause" };
      if (map[cmd]) bridge.phone("media", { action: map[cmd] });
    } else if (m.win) {
      const map = { "media.toggle": "play", "media.play": "play", "media.pause": "play", "media.next": "next", "media.prev": "prev" };
      if (map[cmd]) bridge.helper("keys.media", map[cmd]);
    } else {
      bridge.helper(cmd);
    }
  }
  function seekMedia(sec) {
    const m = state.media;
    if (!m) return;
    m.position = sec;
    m.receivedAt = Date.now();
    if (m.demo) return;
    if (m.phone) bridge.phone("media", { action: "seek", arg: sec });
    else if (!m.win) bridge.helper("media.seek", String(sec));
  }
  var VIDEO_PLAYERS = /^(potplayer|mpc-|kmplayer|gom|mpv|smplayer)/i;
  var AUDIO_PLAYERS = /^(winamp|foobar2000|aimp|musicbee)/i;
  var VIDEO_HINT = /\b(480p|720p|1080p|2160p|4k|x264|x265|h\.?264|h\.?265|hevc|bluray|blu-ray|web-?dl|webrip|hdtv|dvdrip|s\d{1,2}e\d{1,3})\b/i;
  function onPlayer(msg) {
    if (!msg.present) {
      state.winMedia = null;
      pickMedia();
      if (!state.media && state.expanded === "media") state.expanded = null;
      present();
      return;
    }
    const prev = state.winMedia;
    const exe = String(msg.exe || "");
    let title = String(msg.title || "").trim();
    if (!/\s/.test(title) && (title.match(/\./g) || []).length >= 2) title = title.replace(/\./g, " ");
    const video = VIDEO_PLAYERS.test(exe) || VIDEO_HINT.test(title);
    let artist = "";
    const dash = title.indexOf(" - ");
    if (!video && dash > 0 && (AUDIO_PLAYERS.test(exe) || /^vlc/i.test(exe))) {
      artist = title.slice(0, dash).trim();
      title = title.slice(dash + 3).trim();
    }
    const playing = !!msg.playing;
    const key = `win:${exe}:${msg.title}`;
    const now = Date.now();
    state.winMedia = {
      present: true,
      win: true,
      video,
      title,
      artist,
      album: "",
      status: playing ? "playing" : "paused",
      source: exe,
      player: msg.app,
      position: 0,
      duration: 0,
      canPlay: true,
      canPause: true,
      canNext: true,
      canPrev: true,
      canSeek: false,
      artKey: key,
      art: null,
      colors: null,
      receivedAt: now,
      lastPlayingAt: playing ? now : prev && prev.artKey === key ? prev.lastPlayingAt : 0
    };
    const before = state.media;
    pickMedia();
    const cur = state.media;
    if (cur === state.winMedia && playing && (!before || before.artKey !== key) && !state.expanded && !state.transient && state.settings.modules.media) {
      showTransient("track", {}, 3200);
    }
    present();
  }
  var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function dedupeKey(n) {
    return `${n.title}|${n.body}`.toLowerCase().replace(/\s+/g, " ").trim();
  }
  function isDuplicate(n) {
    const key = dedupeKey(n);
    const now = Date.now();
    for (const [k, ts] of state.recentKeys) if (now - ts > 2e4) state.recentKeys.delete(k);
    if (state.recentKeys.has(key)) return true;
    state.recentKeys.set(key, now);
    return false;
  }
  function toNotif(msg) {
    const texts = msg.texts || [];
    const app = msg.app || { name: "Windows" };
    let title = texts[0] || msg.header || app.name;
    let body = texts.slice(1).join("\n");
    if (!body && texts.length === 1 && msg.header) {
      body = title;
      title = msg.header;
    }
    let attribution = msg.attribution || "";
    if (app.phone && !attribution && msg.header) attribution = msg.header;
    return {
      id: `${msg.id}:${msg.time || 0}`,
      toastId: String(msg.id),
      source: "toast",
      time: msg.time || Date.now(),
      app,
      appName: app.phone ? "Phone Link" : app.name || "Windows",
      attribution,
      title,
      body,
      actions: msg.actions || [],
      inputs: msg.inputs || [],
      images: msg.images || [],
      launch: msg.launch,
      avatar: msg.avatarData || null,
      appIcon: null,
      demo: !!msg.demo
    };
  }
  function kdeNotif(p) {
    return {
      id: `kde:${p.deviceId}:${p.id}`,
      source: "kde",
      kdeId: p.id,
      deviceId: p.deviceId,
      time: p.time || Date.now(),
      app: { name: p.appName, phone: true, kde: true },
      appName: p.appName,
      attribution: `${p.appName} \xB7 ${p.deviceName}`,
      title: p.title || p.appName,
      body: p.text || "",
      actions: (p.actions || []).map((a) => ({ content: a })),
      inputs: p.replyId ? [{ id: "reply", type: "text", placeholder: "" }] : [],
      replyId: p.replyId,
      clearable: p.clearable,
      avatar: p.icon || null,
      appIcon: null,
      demo: !!p.demo
    };
  }
  async function resolveNotifImages(n) {
    try {
      const imgs = n.images || [];
      const logo = imgs.find((i) => i.placement === "appLogoOverride") || imgs.find((i) => !i.placement);
      if (!n.avatar && logo) {
        if (logo.path) n.avatar = await bridge.invoke("image:data", logo.path);
        else if (/^(https?:|data:image)/i.test(logo.src || "")) n.avatar = logo.src;
      }
      if (!n.avatar && n.app && n.app.exe) n.appIcon = await bridge.invoke("icon:forExe", n.app.exe);
    } catch (_) {
    }
    return n;
  }
  function notifPrefs() {
    return state.settings.notifications || {};
  }
  function addHistory(n, live = true) {
    if (state.notifHistory.some((x) => x.id === n.id)) return;
    const prefs = notifPrefs();
    if ((prefs.dismissed || []).includes(n.id)) return;
    if (!live && n.time && n.time <= (prefs.clearedAt || 0)) return;
    state.notifHistory = [n, ...state.notifHistory].sort((a, b) => b.time - a.time).slice(0, 60);
  }
  function clearAlerts() {
    const newest = state.notifHistory.reduce((m, n) => Math.max(m, n.time || 0), 0);
    const at = Math.max(Date.now(), newest) + 1;
    state.notifHistory = [];
    saveSettings({ notifications: { ...notifPrefs(), clearedAt: at, dismissed: [] } });
    present();
  }
  function dismissAlert(id) {
    state.notifHistory = state.notifHistory.filter((n) => n.id !== id);
    const list = [id, ...(notifPrefs().dismissed || []).filter((x) => x !== id)].slice(0, 300);
    saveSettings({ notifications: { ...notifPrefs(), dismissed: list } });
    present();
  }
  function canShowNotification(n) {
    const s = state.settings;
    if (!s.modules.notifications) return false;
    if ((s.notifications.blocked || []).some((b) => b && (b === n.appName || b === n.app.name))) return false;
    if (s.respectDnd && state.quiet) return false;
    if (state.fullscreen && s.hideInFullscreen) return false;
    return true;
  }
  function presentNotification(n) {
    const cur = state.transient;
    if (cur && cur.kind === "notification") {
      state.notifQueue.push(n);
      bump(0.5);
      present();
    } else {
      showTransient("notification", n, notifMs());
      bump(0.8);
      edge(n.app && n.app.phone ? "var(--green)" : "var(--accent)");
    }
  }
  async function onToast(msg) {
    if (msg.call) {
      onCallToast(msg);
      return;
    }
    const n = toNotif(msg);
    addHistory(n);
    if (!canShowNotification(n) || isDuplicate(n)) {
      present();
      return;
    }
    await Promise.race([resolveNotifImages(n), sleep(300)]);
    presentNotification(n);
    if (!n.avatar && !n.appIcon) resolveNotifImages(n).then(() => present());
  }
  function onToastHistory(items) {
    for (const it of items || []) {
      if (it.call) continue;
      const n = toNotif(it);
      if (!state.notifHistory.some((x) => x.id === n.id)) {
        addHistory(n, false);
        if (state.notifHistory.some((x) => x.id === n.id)) resolveNotifImages(n).then(() => present());
      }
    }
    present();
  }
  function openNotifApp(n) {
    if (!n || n.source === "kde") return;
    if (n.app && n.app.phone) bridge.invoke("action", "phonelink");
    else if (n.app && n.app.aumid) bridge.invoke("action", "openApp", n.app.aumid);
  }
  var pendingUia = /* @__PURE__ */ new Map();
  function uia(kind, label, cb, demo = false) {
    const id = `u${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    pendingUia.set(id, cb);
    if (demo || IS_DEMO) {
      setTimeout(() => onUia({ id, ok: true, detail: "demo" }), 650);
      return;
    }
    bridge.helper("uia.invoke", id, kind, label || "");
    setTimeout(() => {
      if (pendingUia.has(id)) onUia({ id, ok: false, detail: "timeout" });
    }, 6e3);
  }
  function uiaReply(text, sendLabel, cb, demo = false) {
    const id = `r${Date.now()}`;
    pendingUia.set(id, cb);
    if (demo || IS_DEMO) {
      setTimeout(() => onUia({ id, ok: true, detail: "demo" }), 500);
      return;
    }
    bridge.helper("uia.reply", id, text, sendLabel || "");
    setTimeout(() => {
      if (pendingUia.has(id)) onUia({ id, ok: false, detail: "timeout" });
    }, 6e3);
  }
  function onUia(msg) {
    const cb = pendingUia.get(msg.id);
    if (!cb) return;
    pendingUia.delete(msg.id);
    cb(!!msg.ok, msg.detail || "");
  }
  var callTimeout = null;
  var demoCallTimer = null;
  function pickAction(actions, kind) {
    const list = actions || [];
    const words = kind === "accept" ? /accept|answer/i : /decline|reject|ignore/i;
    return list.find((a) => (kind === "accept" ? /success/i : /critical/i).test(a.style || "")) || list.find((a) => words.test(`${a.content} ${a.args}`)) || list[kind === "accept" ? 0 : 1] || null;
  }
  function startCall(call2) {
    state.call = call2;
    state.expanded = null;
    if (state.settings.callsOverFullscreen !== false) bridge.attention(6e4, "call");
    edge("var(--green)", true);
    clearTimeout(callTimeout);
    callTimeout = setTimeout(() => {
      if (state.call === call2 && call2.state === "incoming") endCall();
    }, 6e4);
    present();
  }
  function onCallToast(msg) {
    if (!state.settings.modules.phoneCalls) return;
    const texts = msg.texts || [];
    const app = msg.app || {};
    const call2 = {
      id: String(msg.id),
      source: "toast",
      toastId: msg.id,
      state: "incoming",
      name: texts[0] || "",
      subtitle: texts[1] || "",
      phone: !!app.phone,
      appName: app.name || "",
      avatar: msg.avatarData || null,
      accept: pickAction(msg.actions, "accept"),
      decline: pickAction(msg.actions, "decline"),
      startedAt: 0,
      pending: null,
      error: false,
      removed: false,
      demo: !!msg.demo,
      hidden: false
    };
    const imgs = msg.images || [];
    const logo = imgs.find((i) => i.placement === "appLogoOverride") || imgs[0];
    if (!call2.avatar && logo && logo.path) {
      bridge.invoke("image:data", logo.path).then((d) => {
        if (state.call === call2 && d) {
          call2.avatar = d;
          present();
        }
      }).catch(() => {
      });
    }
    startCall(call2);
  }
  function onTelephony(p) {
    if (!state.settings.modules.phoneCalls) return;
    const c = state.call;
    if (p.isCancel) {
      if (c && c.source === "kde") endCall();
      return;
    }
    if (p.event === "ringing") {
      if (c && c.source === "toast") return;
      startCall({
        id: `kde-${p.deviceId}-${p.phoneNumber || p.contactName}`,
        source: "kde",
        deviceId: p.deviceId,
        state: "incoming",
        name: p.contactName || p.phoneNumber,
        subtitle: p.phoneNumber && p.phoneNumber !== p.contactName ? p.phoneNumber : "",
        phone: true,
        avatar: p.thumbnail || null,
        startedAt: 0,
        demo: !!p.demo,
        hidden: false
      });
    } else if (p.event === "talking") {
      if (c && c.source === "toast") return;
      if (c && c.source === "kde") {
        c.state = "active";
        c.startedAt = c.startedAt || Date.now();
        stopEdge();
        bridge.attention(0);
        present();
      } else {
        state.call = { id: `kde-${p.deviceId}-talk`, source: "kde", deviceId: p.deviceId, state: "active", name: p.contactName, phone: true, avatar: p.thumbnail, startedAt: Date.now(), hidden: false };
        present();
      }
    } else if (p.event === "missedCall") {
      if (c && c.source === "kde") endCall();
      const n = kdeNotif({ deviceId: p.deviceId, deviceName: p.deviceName, id: `missed-${Date.now()}`, appName: state.settings.language ? i18n.t("missedCall") : "Missed call", title: p.contactName || p.phoneNumber, text: i18n.t("missedCall"), icon: p.thumbnail });
      addHistory(n);
      if (canShowNotification(n)) presentNotification(n);
    }
  }
  function endCall() {
    clearTimeout(callTimeout);
    clearTimeout(demoCallTimer);
    state.call = null;
    stopEdge();
    bridge.attention(0);
    if (state.expanded === "callActive") state.expanded = null;
    present();
  }
  function onToastRemoved(id) {
    const c = state.call;
    if (!c || c.source !== "toast" || String(c.toastId) !== String(id)) return;
    if (c.pending) {
      c.removed = true;
      return;
    }
    if (c.state === "incoming") endCall();
  }
  function callAction(kind) {
    const c = state.call;
    if (!c) return;
    if (kind === "dismiss") {
      endCall();
      return;
    }
    if (kind === "mute") {
      c.muted = true;
      if (!c.demo) bridge.phone("mute", { deviceId: c.deviceId });
      present();
      return;
    }
    if (kind === "hide") {
      c.hidden = true;
      collapse();
      return;
    }
    if (kind === "accept" || kind === "decline") {
      if (c.pending) return;
      c.pending = kind;
      c.error = false;
      present();
      const act = kind === "accept" ? c.accept : c.decline;
      uia(kind, act && act.content, (ok) => {
        if (state.call !== c) return;
        c.pending = null;
        if (ok) {
          if (kind === "accept") {
            c.state = "active";
            c.startedAt = Date.now();
            stopEdge();
            bridge.attention(0);
            bump(0.6);
            if (c.demo) {
              clearTimeout(demoCallTimer);
              demoCallTimer = setTimeout(() => {
                if (state.call === c) endCall();
              }, 2e4);
            }
            present();
          } else {
            endCall();
          }
        } else if (c.removed) {
          endCall();
        } else {
          c.error = true;
          bridge.invoke("action", "phonelink");
          shake();
          present();
          setTimeout(() => {
            if (state.call === c && c.state === "incoming") endCall();
          }, 8e3);
        }
      }, c.demo);
    } else if (kind === "end") {
      uia("end", "", (ok) => {
        if (!ok && !c.demo) bridge.invoke("action", "phonelink");
        endCall();
      }, c.demo);
    }
  }
  function onPhone(p) {
    switch (p.type) {
      case "devices": {
        const prev = phoneDevice();
        state.phone = { me: p.me, devices: p.devices || [] };
        const now = phoneDevice();
        if (prev && now && prev.id === now.id && prev.battery > 15 && now.battery !== null && now.battery <= 15 && !now.charging) {
          say(i18n.t("phoneBatteryLow", { p: i18n.num(now.battery) }), "battery-low", "red", 3500);
        }
        if (state.pair && !(p.devices || []).some((d) => d.id === state.pair.id && d.pairState === "requestedByPeer")) {
          if (!state.pair.demo) {
            state.pair = null;
            bridge.attention(0);
          }
        }
        if (state.expanded === "dashboard") present();
        break;
      }
      case "media":
        onMedia(p, true);
        break;
      case "notification": {
        const n = kdeNotif(p);
        addHistory(n, !p.silent);
        if (p.silent || !canShowNotification(n) || isDuplicate(n)) {
          present();
          return;
        }
        presentNotification(n);
        break;
      }
      case "notificationRemoved": {
        const id = `kde:${p.deviceId}:${p.id}`;
        state.notifQueue = state.notifQueue.filter((n) => n.id !== id);
        if (state.transient && state.transient.kind === "notification" && state.transient.data.id === id) endTransient();
        break;
      }
      case "telephony":
        onTelephony(p);
        break;
      case "pairRequest":
        state.pair = { id: p.id, name: p.name, verifyKey: p.verifyKey, demo: !!p.demo };
        bridge.attention(25e3);
        edge("var(--green)", true);
        present();
        break;
      case "paired":
        if (state.pair && state.pair.id === p.id) state.pair = null;
        stopEdge();
        say(i18n.t("pairAccepted", { name: p.name }), "blinkelo", "green", 2800);
        break;
      case "pairRejected":
      case "pairTimeout":
      case "pairFailed":
        if (state.pair && state.pair.id === p.id) {
          state.pair = null;
          stopEdge();
          present();
        }
        break;
      case "ping":
        say(i18n.t("pingFrom", { name: p.name }), "bell-ring", "", 2600);
        break;
      case "findPc":
        onFindPc(p);
        break;
      case "timer":
        onPhoneTimer(p);
        break;
      case "timerList":
        state.sharedTimers = p.timers || [];
        present();
        break;
      case "received":
        onReceived(p);
        break;
      case "transfer":
        onTransfer(p);
        break;
      case "clipboard":
        say(i18n.t(p.kind === "image" ? "clipImageFromPhone" : "clipFromPhone", { name: p.name || "" }), "clipboard-check", "green", 2200);
        break;
      case "bluetooth":
        if (p.up) say(i18n.t("btConnected", { name: p.name || "" }), "bluetooth", "blue", 2600);
        break;
      case "power":
        say(i18n.t(p.what === "restart" ? "pcRestarting" : "pcShuttingDown", { name: p.name || "" }), "power", "red", 4800);
        break;
      case "command":
        say(i18n.t("ranCommand", { name: p.name || "" }), "zap", "", 2600);
        break;
      default:
        break;
    }
  }
  var findTimer = null;
  var findStopTimer = null;
  function onFindPc(p) {
    clearTimeout(findTimer);
    clearTimeout(findStopTimer);
    if (!p.ringing) {
      state.findPc = null;
      stopEdge();
      present();
      return;
    }
    state.findPc = { name: p.name || "" };
    if (state.expanded) collapse(false);
    edge("var(--red)", true);
    present();
    setTimeout(shake, 200);
    const ring2 = () => {
      if (!state.findPc) return;
      chime("find");
      findTimer = setTimeout(ring2, 1500);
    };
    ring2();
    findStopTimer = setTimeout(() => {
      if (state.findPc) bridge.phone("stopFindPc");
    }, 9e4);
  }
  function onPhoneTimer(p) {
    if (p.state === "running") {
      const sec = Math.max(1, Math.round((Number(p.remaining) || 0) / 1e3));
      const tm = state.timer;
      if (!tm || tm.syncId === p.id || tm.kind === "stopwatch" || !tm.running) {
        startTimer(sec, { syncId: p.id, label: p.label || "", origin: "phone", duration: Math.round((Number(p.duration) || 0) / 1e3) || sec });
        if (!tm || tm.syncId !== p.id) say(i18n.t("timerFromPhone", { name: p.from || "" }), "smartphone", "orange", 2200);
      } else {
        say(i18n.t("timerFromPhone", { name: p.from || "" }), "smartphone", "orange", 2600);
      }
      return;
    }
    if (state.timer && state.timer.syncId === p.id) {
      if (p.state === "done") {
        timerFinished();
        return;
      }
      state.timer = null;
      if (state.expanded === "timer") state.expanded = null;
      present();
    } else if (p.state === "done") {
      say(p.label || i18n.t("timer"), "timer", "orange", 4e3);
      if (state.settings.sound) chime("timer");
    }
  }
  function timerSync(op) {
    const tm = state.timer;
    if (!tm || tm.kind !== "timer" || !tm.syncId) return;
    bridge.phone("timer", { op, timer: { syncId: tm.syncId, label: tm.label || "", origin: tm.origin || "pc", duration: tm.duration, endsAt: tm.endsAt } }).catch(() => {
    });
  }
  function onReceived(p) {
    if (p.kind === "file") bridge.invoke("shelf:get").then((s) => {
      state.shelf = s || [];
      if (state.expanded === "dashboard") present();
    }).catch(() => {
    });
    if (state.expanded === "dashboard" && state.tab === "shelf" && p.kind === "file") {
      present();
      return;
    }
    if (state.expanded && state.expanded !== "dashboard") collapse(false);
    showTransient("received", { ...p, id: `${Date.now()}` }, p.kind === "file" ? 9e3 : 6e3);
    bump(0.5);
    if (state.settings.sound) chime("msg");
  }
  function onTransfer(p) {
    if (p.state === "failed") {
      say(i18n.t("transferFailed", { name: p.name || "" }), "triangle-alert", "red", 3200);
      return;
    }
    if (p.state === "done") {
      if (p.dir === "out") say(i18n.t("sentToPhone", { name: p.name || "" }), "check", "green", 2200);
      else if (state.transient && state.transient.kind === "transfer") endTransient();
      return;
    }
    const total = Number(p.total) || 0;
    if (total && total < 400 * 1024 && p.dir === "in") return;
    showTransient("transfer", { ...p, total, done: Number(p.done) || 0 }, 4e3);
  }
  function pairAction(accept) {
    const pr = state.pair;
    if (!pr) return;
    state.pair = null;
    stopEdge();
    bridge.attention(0);
    if (pr.demo) {
      if (accept) say(i18n.t("pairAccepted", { name: pr.name }), "blinkelo", "green", 2800);
      else present();
      return;
    }
    bridge.phone(accept ? "accept" : "reject", { id: pr.id });
    present();
  }
  var ticker = null;
  var chimeTimer = null;
  var chimeCount = 0;
  function startTimer(sec, opts = {}) {
    sec = clamp(Math.round(sec), 1, opts.syncId ? 365 * 86400 : 60 * 600);
    state.timer = {
      kind: "timer",
      duration: opts.duration || sec,
      remaining: sec,
      endsAt: Date.now() + sec * 1e3,
      running: true,
      syncId: opts.syncId || `pc-${Date.now().toString(36)}`,
      label: opts.label || "",
      origin: opts.origin || "pc"
    };
    state.timerDone = null;
    stopChime();
    if (state.expanded === "dashboard") collapse(false);
    if (state.timer.origin !== "phone") timerSync("start");
    bump(0.5);
    present();
  }
  function startStopwatch() {
    state.timer = { kind: "stopwatch", startedAt: Date.now(), accum: 0, running: true };
    state.timerDone = null;
    if (state.expanded === "dashboard") collapse(false);
    bump(0.5);
    present();
  }
  function timerAction(act, arg) {
    const tm = state.timer;
    const now = Date.now();
    switch (act) {
      case "timer.selectShared": {
        const selected = state.sharedTimers.find((t) => t.id === arg);
        if (selected) startTimer(Math.max(1, (selected.endsAt - now) / 1e3), { syncId: selected.id, label: selected.label, origin: "phone", duration: selected.duration / 1e3 });
        return;
      }
      case "timer.cancelShared":
        bridge.phone("timer", { op: "stop", timer: { syncId: arg } }).catch(() => {
        });
        if (tm?.syncId === arg) state.timer = null;
        present();
        return;
      case "timer.start":
        startTimer(Number(arg) || 60);
        return;
      case "stopwatch.start":
        startStopwatch();
        return;
      case "timer.toggle":
        if (!tm) return;
        if (tm.running) {
          if (tm.kind === "timer") {
            tm.remaining = Math.max(0, (tm.endsAt - now) / 1e3);
            timerSync("pause");
          } else tm.accum += (now - tm.startedAt) / 1e3;
          tm.running = false;
        } else {
          if (tm.kind === "timer") {
            tm.endsAt = now + tm.remaining * 1e3;
            tm.running = true;
            timerSync("start");
          } else tm.startedAt = now;
          tm.running = true;
        }
        break;
      case "timer.add":
        if (!tm || tm.kind !== "timer") return;
        tm.duration += 60;
        if (tm.running) {
          tm.endsAt += 6e4;
          timerSync("start");
        } else tm.remaining += 60;
        bump(0.3);
        break;
      case "timer.reset":
        if (!tm) return;
        tm.accum = 0;
        tm.startedAt = now;
        break;
      case "timer.stop":
        timerSync("stop");
        state.timer = null;
        if (state.expanded === "timer") state.expanded = null;
        break;
      case "timer.again": {
        const d = state.timerDone ? state.timerDone.duration : 60;
        state.timerDone = null;
        stopChime();
        stopEdge();
        startTimer(d);
        return;
      }
      case "timer.dismiss":
        state.timerDone = null;
        stopChime();
        stopEdge();
        bridge.attention(0);
        break;
      default:
        break;
    }
    present();
  }
  function timerFinished() {
    timerSync("done");
    const d = state.timer.duration;
    const label = state.timer.label || "";
    state.timer = null;
    if (state.expanded === "timer" || state.expanded === "dashboard") state.expanded = null;
    state.timerDone = { duration: d, label };
    bridge.attention(6e4);
    edge("var(--orange)", true);
    present();
    setTimeout(shake, 250);
    chimeCount = 0;
    const ring2 = () => {
      if (!state.timerDone || chimeCount >= 8) return;
      chimeCount += 1;
      if (state.settings.sound) chime("timer");
      chimeTimer = setTimeout(ring2, 2600);
    };
    ring2();
    setTimeout(() => {
      if (state.timerDone && state.timerDone.duration === d) timerAction("timer.dismiss");
    }, 6e4);
  }
  function stopChime() {
    clearTimeout(chimeTimer);
    chimeTimer = null;
  }
  function tick() {
    const tm = state.timer;
    if (tm && tm.kind === "timer" && tm.running && Date.now() >= tm.endsAt) {
      timerFinished();
      return;
    }
    if (state.inputFocused && !stage.querySelector("input:focus")) {
      state.inputFocused = false;
      bridge.setFocus(false);
    }
    syncInteractive();
    if (!state.sliderDrag) present();
  }
  function currentNotif() {
    return state.expandedNotif;
  }
  function doAction(act, arg, el) {
    if (act.startsWith("media.")) {
      mediaCommand(act);
      return;
    }
    if (act.startsWith("timer.") || act === "stopwatch.start") {
      timerAction(act, arg);
      return;
    }
    switch (act) {
      case "volume.toggleMute":
        state.volume.muted = !state.volume.muted;
        bridge.helper("volume.toggleMute");
        present();
        break;
      case "dashboard":
        openDashboard();
        break;
      case "tab":
        if (state.homeEdit && arg !== "home") setHomeEdit(false);
        state.tab = arg;
        if (state.expanded !== "dashboard") expand("dashboard");
        refreshTabData(arg);
        present();
        break;
      case "pin":
        state.pinned = !state.pinned;
        present();
        break;
      case "subs.open":
        if (subsOn()) {
          expand("subs");
          bridge.attention(2e4);
        }
        break;
      case "subs.close":
        collapse();
        break;
      case "subs.lang":
        subsCommand("search", { lang: arg });
        break;
      case "subs.choose":
        subsCommand("choose", { id: arg });
        break;
      case "subs.retry":
        subsCommand("search", {});
        break;
      case "subs.reveal":
        subsCommand("reveal");
        break;
      case "subs.settings":
        bridge.invoke("action", "settings", "subtitles").catch(() => {
        });
        collapse();
        break;
      case "minimize":
        collapse();
        bridge.invoke("action", "minimize").catch(() => {
        });
        break;
      case "action":
        bridge.invoke("action", arg, el && el.dataset.arg2).catch(() => {
        });
        if (arg !== "phonelink" || state.expanded === "dashboard") collapse();
        break;
      case "app.launch": {
        bridge.invoke("shortcuts:launch", arg).catch(() => {
        });
        const key = state.shortcuts.find((x) => x.id === arg);
        const stay = key && ["hotkey", "media", "text", "command"].includes(key.kind);
        const cls = stay ? "fired" : "flash";
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
        if (stay) setTimeout(() => el.classList.remove(cls), 520);
        else setTimeout(() => collapse(), 260);
        break;
      }
      case "home.edit":
        if (state.tab !== "home") state.tab = "home";
        setHomeEdit(true);
        present();
        break;
      case "home.done":
        setHomeEdit(false);
        present();
        break;
      case "home.reset":
        saveSettings({ home: { layout: [], custom: false } });
        present();
        break;
      case "home.remove":
        saveHome(HOME.removeTile(HOME.normalize(state.settings.home), arg));
        present();
        break;
      case "home.add": {
        const next = HOME.addTile(HOME.normalize(state.settings.home), arg);
        clearTimeout(homeHintTimer);
        if (next) {
          state.homeNoRoom = false;
          state.homeNew = arg;
          saveHome(next);
          homeHintTimer = setTimeout(() => {
            state.homeNew = null;
          }, 600);
        } else {
          state.homeNoRoom = true;
          homeHintTimer = setTimeout(() => {
            state.homeNoRoom = false;
            present();
          }, 2600);
        }
        present();
        break;
      }
      case "phone.find": {
        const dev = phoneDevice();
        if (dev) {
          bridge.phone("find", { deviceId: dev.id });
          say(i18n.t("phoneRinging"), "bell-ring", "green", 2400);
        }
        break;
      }
      case "phone.clip": {
        const dev = phoneDevice();
        if (!dev) break;
        bridge.phone("sendClipboard", { deviceId: dev.id }).then((ok) => say(i18n.t(ok ? "clipSentToPhone" : "actionFailed"), ok ? "clipboard-check" : "triangle-alert", ok ? "green" : "red", 2200)).catch(() => {
        });
        break;
      }
      case "phone.camera": {
        const dev = phoneDevice();
        if (!dev) break;
        bridge.phone("camera", { deviceId: dev.id });
        say(i18n.t("cameraAsked", { name: dev.name }), "camera", "blue", 3e3);
        break;
      }
      case "phone.sendFile": {
        const dev = phoneDevice();
        if (dev) bridge.phone("pickAndSend", { deviceId: dev.id }).catch(() => {
        });
        break;
      }
      case "shelf.toPhone": {
        const dev = phoneDevice();
        if (dev && arg) bridge.phone("sendFiles", { deviceId: dev.id, paths: [arg] }).catch(() => {
        });
        break;
      }
      case "findpc.stop":
        bridge.phone("stopFindPc");
        state.findPc = null;
        clearTimeout(findTimer);
        stopEdge();
        present();
        break;
      case "recv.open":
      case "recv.show": {
        const tr = state.transient;
        const d = tr && tr.kind === "received" ? tr.data : null;
        if (d && d.path) bridge.phone("openReceived", { path: d.path, reveal: act === "recv.show" });
        else if (d && d.url) bridge.invoke("action", "openUrl", d.url).catch(() => {
        });
        endTransient();
        break;
      }
      case "recv.close":
        endTransient();
        break;
      case "gsum.close":
        endTransient();
        break;
      case "game.launch": {
        const g = (state.gameLib || []).find((x) => x.id === arg);
        if (!g || state.gaming && state.gaming.launching) break;
        if (state.gaming) state.gaming = { ...state.gaming, launching: g.id };
        present();
        bridge.invoke("gaming:cmd", "launch", { id: g.id }).then((r) => {
          if (state.gaming) state.gaming = { ...state.gaming, launching: null };
          collapse();
          showTransient("gameLaunch", { id: g.id, name: g.name, icon: g.icon, ok: !!(r && r.ok) }, r && r.ok ? 4500 : 6e3);
        }).catch(() => {
          if (state.gaming) state.gaming = { ...state.gaming, launching: null };
          present();
        });
        break;
      }
      case "game.add":
        bridge.invoke("gaming:cmd", "addGame", {}).then((lib) => {
          if (Array.isArray(lib)) {
            state.gameLib = lib;
            present();
          }
        }).catch(() => {
        });
        break;
      case "game.toggle":
        gamingCommand("toggle");
        break;
      case "game.optimize":
        gamingCommand("optimize");
        break;
      case "game.restore":
        gamingCommand("restore");
        break;
      case "game.hud":
        gamingCommand("hud");
        break;
      case "game.end":
        gamingCommand("end");
        break;
      case "game.mark":
        gamingCommand("markGame", { name: arg });
        break;
      case "game.allowFps":
        el.classList.add("busy");
        bridge.invoke("gaming:cmd", "allowFps", {}).then((r) => {
          el.classList.remove("busy");
          state.gamingNote = { ok: !!(r && r.ok), key: r && r.ok ? "gmSignOut" : "gmAllowFail", until: Date.now() + 15e3 };
          present();
          setTimeout(present, 15100);
        }).catch(() => el.classList.remove("busy"));
        break;
      case "game.settings":
        bridge.invoke("action", "settings", "gaming").catch(() => {
        });
        collapse();
        break;
      case "notif.open":
        openNotifApp(currentNotif());
        collapse();
        break;
      case "notif.dismiss":
        collapse();
        break;
      case "notif.phoneDismiss": {
        const n = currentNotif();
        if (n && n.source === "kde" && !n.demo) bridge.phone("notifDismiss", { deviceId: n.deviceId, id: n.kdeId });
        collapse();
        break;
      }
      case "notif.action": {
        const n = currentNotif();
        const acts = (n && n.actions ? n.actions : []).filter((a2) => !a2.inputId && a2.content && a2.placement !== "contextMenu");
        const a = acts[Number(arg)];
        if (!a) return;
        el.classList.add("busy");
        const done = (ok) => {
          state.notifStatus = { ok, text: ok ? i18n.t("actionDone") : i18n.t("actionFailed") };
          present();
          if (ok) setTimeout(() => {
            if (state.expandedNotif === n) collapse();
          }, 1100);
          else openNotifApp(n);
        };
        if (n.source === "kde") {
          if (!n.demo) bridge.phone("notifAction", { deviceId: n.deviceId, id: n.kdeId, action: a.content });
          done(true);
        } else uia("button", a.content, done, n.demo);
        break;
      }
      case "call.accept":
        callAction("accept");
        break;
      case "call.decline":
        callAction("decline");
        break;
      case "call.end":
        callAction("end");
        break;
      case "call.hide":
        callAction("hide");
        break;
      case "call.mute":
        callAction("mute");
        break;
      case "call.dismiss":
        callAction("dismiss");
        break;
      case "pair.accept":
        pairAction(true);
        break;
      case "pair.reject":
        pairAction(false);
        break;
      case "alerts.clear":
        clearAlerts();
        break;
      case "alerts.dismiss":
        dismissAlert(arg);
        break;
      case "widget":
        saveSettings({ widgets: { ...state.settings.widgets || {}, active: arg } });
        present();
        break;
      case "widget.refresh":
        bridge.invoke("widgets:refresh", arg).catch(() => {
        });
        break;
      case "openUrl":
        if (/^https?:\/\//i.test(arg || "")) bridge.invoke("action", "openUrl", arg).catch(() => {
        });
        el.classList.add("flash");
        break;
      case "cal.prev":
      case "cal.next": {
        const pl = plannerState();
        pl.ym = shiftYm(pl.ym, act === "cal.next" ? 1 : -1);
        present();
        break;
      }
      case "cal.today": {
        const pl = plannerState();
        pl.sel = isoOf(/* @__PURE__ */ new Date());
        pl.ym = currentYm();
        present();
        break;
      }
      case "cal.pick": {
        const pl = plannerState();
        pl.sel = arg;
        pl.ym = ymOfIso(arg);
        present();
        break;
      }
      case "task.toggle": {
        const tk = state.tasks.find((x) => x.id === arg);
        if (!tk) return;
        tk.done = !tk.done;
        present();
        bridge.invoke("tasks:update", arg, { done: tk.done }).catch(() => {
        });
        if (tk.done && state.settings.sound) chime("done");
        break;
      }
      case "task.remove":
        state.tasks = state.tasks.filter((x) => x.id !== arg);
        present();
        bridge.invoke("tasks:remove", arg).catch(() => {
        });
        break;
      case "alerts.open": {
        const n = state.notifHistory.find((x) => x.id === arg);
        if (n) {
          state.expandedNotif = n;
          state.notifStatus = null;
          state.expanded = "notification";
          bridge.stats(false);
          present();
        }
        break;
      }
      case "shelf.open":
        bridge.invoke("shelf:open", arg);
        break;
      case "shelf.remove":
        bridge.invoke("shelf:remove", arg).then((s) => {
          state.shelf = s || [];
          present();
        });
        break;
      case "shelf.clear":
        bridge.invoke("shelf:clear").then(() => {
          state.shelf = [];
          present();
        });
        break;
      case "clip.copy":
        bridge.invoke("clipboard:write", arg).then(() => {
          el.classList.add("flash");
          setTimeout(() => el.classList.remove("flash"), 500);
        });
        break;
      case "clip.clear":
        bridge.invoke("clipboard:clear").then(() => {
          state.clipHistory = [];
          present();
        });
        break;
      default:
        break;
    }
  }
  function onIslandClick() {
    switch (currentMain) {
      case "idle":
      case "handle":
        if (state.settings.minimized && currentMain === "handle") {
          setHover(true);
          return;
        }
        openDashboard();
        break;
      case "media":
      case "track":
        expand("media");
        break;
      case "timer":
        expand("timer");
        break;
      case "callActive":
        expand("callActive");
        break;
      case "notification":
        expand("notification");
        break;
      case "subsReady":
        endTransient();
        expand("subs");
        break;
      case "volume":
      case "keys":
      case "battery":
      case "copied":
      case "message":
      case "privacy":
        endTransient();
        break;
      default:
        break;
    }
  }
  function onBubbleClick() {
    if (currentBubble === "timerMini") expand("timer");
    else if (currentBubble === "mediaMini") expand("media");
    else if (currentBubble === "subsMini") expand("subs");
  }
  var suppressClick = false;
  var handledOnUpAt = 0;
  function activate(target, e) {
    const actEl = target.closest("[data-act]");
    if (actEl && !actEl.disabled) {
      if (actEl.closest(".leaving")) return;
      if (e) e.stopPropagation();
      doAction(actEl.dataset.act, actEl.dataset.arg, actEl);
      return;
    }
    if (target.closest("input, form, .slider, .prog")) return;
    if (target.closest("#mainClip")) onIslandClick();
    else if (target.closest("#bubbleClip")) onBubbleClick();
  }
  stage.addEventListener("click", (e) => {
    if (suppressClick) {
      suppressClick = false;
      e.stopPropagation();
      return;
    }
    if (Date.now() - handledOnUpAt < 400) return;
    activate(e.target, e);
  });
  var lastDownAt = 0;
  var upOnlyCount = 0;
  document.addEventListener("pointerdown", () => {
    lastDownAt = Date.now();
  }, true);
  document.addEventListener("mousedown", () => {
    lastDownAt = Date.now();
  }, true);
  document.addEventListener("mouseup", (e) => {
    if (e.button !== 0 || Date.now() - lastDownAt < 2e3) return;
    if (!e.target.closest || !e.target.closest("#mainClip, #bubbleClip")) return;
    upOnlyCount += 1;
    if (bridge.diag) bridge.diag({ kind: "release-without-press", view: currentMain, count: upOnlyCount });
    handledOnUpAt = Date.now();
    const input = e.target.closest("input");
    if (input) {
      state.inputFocused = true;
      syncInteractive(true);
      bridge.setFocus(true);
      setTimeout(() => input.focus(), 80);
      return;
    }
    const sl = e.target.closest("[data-slider]");
    if (sl) {
      const r = sl.getBoundingClientRect();
      const p = clamp((e.clientX - r.left) / r.width, 0, 1);
      if (sl.dataset.slider === "volume") {
        state.volume.level = p;
        bridge.helper("volume.set", String(p));
        present();
      } else if (state.media && state.media.duration && state.media.canSeek !== false) seekMedia(p * state.media.duration);
      return;
    }
    activate(e.target, null);
  }, true);
  stage.addEventListener("auxclick", (e) => {
    if (e.button === 1 && state.media) {
      e.preventDefault();
      mediaCommand("media.toggle");
    }
  });
  stage.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (state.call && state.call.state === "incoming") {
      callAction(state.call.source === "kde" ? "dismiss" : "decline");
      return;
    }
    if (state.timerDone) {
      timerAction("timer.dismiss");
      return;
    }
    if (state.expanded === "dashboard") collapse();
    else openDashboard();
  });
  var wheelVolume = throttle((delta) => bridge.helper("volume.delta", String(delta)), 40);
  stage.addEventListener("wheel", (e) => {
    if (e.target.closest(".scroll:not(.marquee)")) return;
    if (!state.settings.modules.volumeHud) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.04 : -0.04;
    state.volume.level = clamp(state.volume.level + delta, 0, 1);
    if (delta > 0) state.volume.muted = false;
    wheelVolume(delta);
    if (state.expanded === "media") present();
    else if (!state.expanded) showTransient("volume", {}, 1600);
  }, { passive: false });
  var hitIfInside = throttle((x, y) => {
    if (state.hover) return;
    if (lastRects.some((r) => x >= r.x - 2 && x <= r.x + r.w + 2 && y >= r.y - 2 && y <= r.y + r.h + 2)) bridge.hit();
  }, 25);
  document.addEventListener("mousemove", (e) => hitIfInside(e.clientX, e.clientY));
  var setVolumeThrottled = throttle((v) => bridge.helper("volume.set", String(v)), 50);
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const input = e.target.closest("input");
    if (input) {
      state.inputFocused = true;
      syncInteractive(true);
      bridge.setFocus(true);
      setTimeout(() => input.focus(), 60);
      return;
    }
    const tile = state.homeEdit ? e.target.closest(".h-tile") : null;
    if (tile) {
      if (!e.target.closest("[data-act]")) startTileDrag(e, tile, !!e.target.closest(".h-resize"));
      return;
    }
    const sl = e.target.closest("[data-slider]");
    if (sl) {
      startSlider(e, sl);
      return;
    }
    if (state.settings.movable && e.target.closest("#mainClip, #bubbleClip") && !e.target.closest("button, [data-act], [data-drag], [data-subdrag], .scroll:not(.marquee), form, a")) {
      startMovePending(e);
    }
  });
  function startSlider(e, sl) {
    const kind = sl.dataset.slider;
    if (kind === "seek" && (!state.media || !state.media.duration)) return;
    e.preventDefault();
    e.stopPropagation();
    sl.setPointerCapture(e.pointerId);
    state.sliderDrag = true;
    syncInteractive(true);
    sl.classList.add("dragging");
    const apply = (ev) => {
      const r = sl.getBoundingClientRect();
      const p = clamp((ev.clientX - r.left) / r.width, 0, 1);
      if (kind === "volume") {
        state.volume.level = p;
        state.volume.muted = p === 0 ? state.volume.muted : false;
        setVolumeThrottled(p);
        if (state.transient && state.transient.kind === "volume") state.transient.until = Date.now() + 1800;
      } else {
        state.seekPreview = p * state.media.duration;
      }
      presentNow();
    };
    apply(e);
    const move = (ev) => apply(ev);
    const up = () => {
      sl.removeEventListener("pointermove", move);
      sl.removeEventListener("pointerup", up);
      sl.removeEventListener("pointercancel", up);
      sl.removeEventListener("lostpointercapture", up);
      sl.classList.remove("dragging");
      state.sliderDrag = false;
      syncInteractive();
      if (kind === "seek" && state.seekPreview !== null && state.media) {
        const sec = state.seekPreview;
        state.seekPreview = null;
        seekMedia(sec);
      }
      if (kind === "volume") setVolumeThrottled(state.volume.level);
      present();
    };
    sl.addEventListener("pointermove", move);
    sl.addEventListener("pointerup", up);
    sl.addEventListener("pointercancel", up);
    sl.addEventListener("lostpointercapture", up);
  }
  function startMovePending(e) {
    const target = e.target.closest("#mainClip, #bubbleClip");
    const sx = e.screenX;
    const sy = e.screenY;
    let moving = false;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (_) {
    }
    const move = (ev) => {
      if (!moving && Math.hypot(ev.screenX - sx, ev.screenY - sy) > 6) {
        moving = true;
        state.moving = true;
        syncInteractive(true);
        document.body.classList.add("moving");
        bridge.drag("start");
      }
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
      target.removeEventListener("lostpointercapture", up);
      if (moving) {
        bridge.drag("end");
        suppressClick = true;
        setTimeout(() => {
          suppressClick = false;
        }, 80);
        state.moving = false;
        document.body.classList.remove("moving");
        syncInteractive();
        present();
      }
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
    target.addEventListener("lostpointercapture", up);
  }
  stage.addEventListener("focusin", (e) => {
    if (e.target.matches("input")) {
      state.inputFocused = true;
      syncInteractive(true);
    }
  });
  stage.addEventListener("focusout", (e) => {
    if (e.target.matches("input")) {
      setTimeout(() => {
        if (!stage.querySelector("input:focus")) {
          state.inputFocused = false;
          syncInteractive();
          bridge.setFocus(false);
          if (!state.hover && state.expanded && !state.pinned) collapse();
        }
      }, 150);
    }
  });
  stage.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.dataset.form === "timer") {
      const min = Number(form.elements.min.value);
      if (min > 0) startTimer(min * 60);
      bridge.setFocus(false);
    } else if (form.dataset.form === "task") {
      const title = form.elements.title.value.trim();
      if (!title) return;
      const time = form.elements.time.value || null;
      const pl = plannerState();
      bridge.invoke("tasks:add", { title, date: pl.sel, time }).then((tk) => {
        if (tk && !state.tasks.some((x) => x.id === tk.id)) {
          state.tasks = [...state.tasks, tk];
          present();
        }
      }).catch(() => {
      });
      form.elements.title.value = "";
      form.elements.time.value = "";
      setTimeout(() => {
        const i = stage.querySelector('form[data-form="task"] input[name="title"]');
        if (i) i.focus();
      }, 60);
    } else if (form.dataset.form === "subs") {
      const q = form.elements.q.value.trim();
      if (q) subsCommand("search", { query: q });
      const f = form.elements.q;
      if (f) f.blur();
      bridge.setFocus(false);
    } else if (form.dataset.form === "reply") {
      const n = currentNotif();
      const text = form.elements.reply.value.trim();
      if (!text || !n) return;
      form.classList.add("busy");
      const done = (ok) => {
        state.notifStatus = { ok, text: ok ? i18n.t("sent") : i18n.t("replyFailed") };
        if (!ok) openNotifApp(n);
        present();
        if (ok) setTimeout(() => {
          if (state.expandedNotif === n) collapse();
        }, 1200);
      };
      if (n.source === "kde") {
        if (!n.demo) bridge.phone("notifReply", { deviceId: n.deviceId, replyId: n.replyId, message: text }).then((r) => done(!!r)).catch(() => done(false));
        else done(true);
      } else {
        const input = (n.inputs || []).find((i) => i.type !== "selection");
        const sendAct = input ? (n.actions || []).find((a) => a.inputId === input.id) : null;
        uiaReply(text, sendAct && sendAct.content, done, n.demo);
      }
    }
  });
  stage.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      bridge.setFocus(false);
      collapse();
    }
  });
  var outDragTimer = null;
  function beginOutDrag() {
    state.outDrag = true;
    clearTimeout(outDragTimer);
    outDragTimer = setTimeout(() => {
      state.outDrag = false;
    }, 2e4);
  }
  function endOutDrag() {
    clearTimeout(outDragTimer);
    if (!state.outDrag) return;
    state.outDrag = false;
    state.dragOver = false;
    syncInteractive();
    present();
  }
  stage.addEventListener("dragstart", (e) => {
    const sd = e.target.closest("[data-subdrag]");
    if (sd) {
      e.preventDefault();
      if (!state.subs || !state.subs.file) return;
      beginOutDrag();
      if (state.subs.demo || !bridge.subsDrag) {
        setTimeout(endOutDrag, 300);
        return;
      }
      bridge.subsDrag();
      return;
    }
    const f = e.target.closest("[data-drag]");
    if (!f) return;
    e.preventDefault();
    beginOutDrag();
    bridge.startDrag(f.dataset.drag);
  });
  bridge.on("dragDone", () => {
    const wasSub = state.transient && state.transient.kind === "subsReady";
    endOutDrag();
    if (wasSub) endTransient();
  });
  document.addEventListener("pointermove", (e) => {
    if (state.outDrag && e.buttons === 0) setTimeout(() => {
      if (state.outDrag) endOutDrag();
    }, 600);
  }, true);
  var dragTimer = null;
  function hasFiles(e) {
    return e.dataTransfer && Array.from(e.dataTransfer.types || []).includes("Files");
  }
  window.addEventListener("dragover", (e) => {
    if (state.outDrag) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "none";
      return;
    }
    if (!hasFiles(e) || !state.settings.modules.shelf) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!state.dragOver) {
      state.dragOver = true;
      syncInteractive(true);
      present();
    }
    clearTimeout(dragTimer);
    dragTimer = setTimeout(() => {
      state.dragOver = false;
      syncInteractive();
      present();
    }, 220);
  });
  window.addEventListener("drop", async (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (state.outDrag) return;
    clearTimeout(dragTimer);
    const toApps = state.expanded === "dashboard" && state.tab === "apps";
    state.dragOver = false;
    syncInteractive();
    const paths = Array.from(e.dataTransfer.files).map((f) => bridge.pathForFile(f)).filter(Boolean);
    if (!paths.length) {
      present();
      return;
    }
    if (toApps) {
      await bridge.invoke("shortcuts:addPaths", paths).catch(() => 0);
      refreshTabData("apps");
      return;
    }
    state.shelf = await bridge.invoke("shelf:add", paths) || state.shelf;
    say(i18n.t("added", { n: i18n.num(paths.length) }), "folder-open", "", 2200);
    edge("var(--accent)");
  });
  if (IS_DEMO) {
    for (const el of [els.mainClip, els.bubbleClip]) {
      el.addEventListener("mouseenter", () => setHover(true));
      el.addEventListener("mouseleave", (e) => {
        if (e.relatedTarget && (els.mainClip.contains(e.relatedTarget) || els.bubbleClip.contains(e.relatedTarget))) return;
        setHover(false);
      });
    }
  }
  function onHelper(msg) {
    switch (msg.type) {
      case "media":
        onMedia(msg, false);
        break;
      case "player":
        onPlayer(msg);
        break;
      case "meter":
        state.meter = { p: msg.p, l: msg.l, r: msg.r, at: performance.now() };
        break;
      case "volume": {
        const prev = state.volume;
        const changed = !state.volumeKnown || Math.abs(prev.level - msg.level) > 3e-3 || prev.muted !== msg.muted;
        const wasKnown = state.volumeKnown;
        state.volume = { level: msg.level, muted: msg.muted };
        state.volumeKnown = true;
        if (wasKnown && changed && !msg.initial && state.settings.modules.volumeHud && !state.sliderDrag) showTransient("volume", {}, 1700);
        else present();
        break;
      }
      case "battery": {
        const prev = state.battery;
        state.battery = msg;
        if (prev && msg.has && state.settings.modules.battery) {
          if (prev.plugged !== msg.plugged) {
            showTransient("battery", { kind: "plug" }, 3200);
            if (msg.plugged) edge("var(--green)");
          } else if (!msg.plugged && (prev.percent > 20 && msg.percent <= 20 || prev.percent > 10 && msg.percent <= 10)) {
            showTransient("battery", { kind: "low" }, 4500);
            edge("var(--red)");
          }
        }
        break;
      }
      case "keys":
        if (!msg.initial && msg.changed) {
          const which = msg.changed;
          if (which === "caps" && state.settings.modules.capsLock || which === "num" && state.settings.modules.numLock) {
            showTransient("keys", { which, on: which === "caps" ? msg.caps : msg.num }, 1500);
          }
        }
        state.keys = msg;
        break;
      case "privacy": {
        const prev = state.privacy;
        state.privacy = { mic: msg.mic || [], cam: msg.cam || [], loc: msg.loc || [] };
        if (state.privacyKnown && state.settings.modules.privacy) {
          const newMic = state.privacy.mic.find((a) => !prev.mic.includes(a));
          const newCam = state.privacy.cam.find((a) => !prev.cam.includes(a));
          if (newCam) showTransient("privacy", { kind: "cam", app: newCam }, 2600);
          else if (newMic) showTransient("privacy", { kind: "mic", app: newMic }, 2600);
        }
        state.privacyKnown = true;
        present();
        break;
      }
      case "fullscreen":
        state.fullscreen = !!msg.busy;
        state.quiet = !!msg.quiet;
        break;
      case "net":
        state.net = { down: msg.down, up: msg.up };
        if (state.expanded === "dashboard") present();
        break;
      case "toast":
        onToast(msg);
        break;
      case "toastRemoved":
        onToastRemoved(msg.id);
        break;
      case "toastHistory":
        onToastHistory(msg.items);
        break;
      case "uia":
        onUia(msg);
        break;
      default:
        break;
    }
  }
  var lastVisualSig = "";
  function applySettings(s) {
    if (!s) return;
    state.settings = { ...state.settings, ...s, modules: { ...state.settings.modules, ...s.modules || {} } };
    document.documentElement.lang = i18n.lang();
    document.body.classList.toggle("notch", isNotch());
    document.body.classList.toggle("no-glow", !state.settings.glow);
    document.body.classList.toggle("theme-glass", state.settings.theme === "glass");
    document.body.classList.toggle("moved", !!state.settings.position);
    document.body.dataset.lang = i18n.lang();
    document.documentElement.style.setProperty("--s", String(scale()));
    document.documentElement.style.setProperty("--tp", String(clamp(Number(state.settings.transparency) || 0, 0, 90) / 100));
    const ss = state.settings;
    const sig = JSON.stringify([ss.language, ss.style, ss.scale, ss.topOffset, ss.idleClock, ss.modules, ss.media, ss.notifications]);
    if (sig !== lastVisualSig) {
      lastVisualSig = sig;
      slots.main.key = null;
      slots.bubble.key = null;
    }
    lastRectsJson = "";
    if (!state.settings.modules.visualizer) bridge.helper("audio.meter", "0");
    if (peek.busy && peek.kind === "random" && blinkCfg().peeks !== true) cancelPeek();
    queueHello();
    present();
  }
  function applyBackdrop(url) {
    const st = document.documentElement.style;
    if (url) {
      st.setProperty("--glass-img", `url("${url}")`);
      st.setProperty("--glass-w", `${Math.max(window.screen.width || 0, 800)}px`);
      st.setProperty("--glass-h", `${Math.max(window.screen.height || 0, 500)}px`);
    } else {
      st.removeProperty("--glass-img");
      st.removeProperty("--glass-w");
      st.removeProperty("--glass-h");
    }
  }
  function applyAccent(color) {
    if (color) document.documentElement.style.setProperty("--accent", color);
  }
  function runDemo(kind) {
    const p = demoPayload(kind, 0, i18n.lang());
    switch (kind) {
      case "blink":
        if (currentMain === "idle" && !state.hover) {
          cancelPeek();
          runPeek("hello", true);
        } else say(i18n.t("blinkHi"), "blinkelo", "", 2800);
        break;
      case "music":
        onMedia({ ...p, demo: true }, false);
        break;
      case "video":
        onPlayer({ type: "player", present: true, app: "VLC", exe: "vlc.exe", title: "Interstellar.2014.1080p.BluRay", playing: true });
        clearTimeout(demoVideoTimer);
        demoVideoTimer = setTimeout(() => onPlayer({ type: "player", present: false }), 3e4);
        break;
      case "message":
        onToast({ ...p, demo: true });
        break;
      case "call":
        onCallToast({ ...p, demo: true });
        clearTimeout(demoCallTimer);
        demoCallTimer = setTimeout(() => {
          if (state.call && state.call.demo && state.call.state === "incoming") endCall();
        }, 25e3);
        break;
      case "timer":
        startTimer(12);
        break;
      case "stopwatch":
        startStopwatch();
        break;
      case "charging":
        state.battery = { has: true, plugged: false, charging: false, percent: 64 };
        onHelper({ type: "battery", has: true, plugged: true, charging: true, percent: 64 });
        break;
      case "volume":
        state.volumeKnown = true;
        onHelper({ type: "volume", level: clamp(state.volume.level + 0.12 > 1 ? 0.3 : state.volume.level + 0.12, 0, 1), muted: false });
        break;
      case "caps":
        onHelper({ type: "keys", caps: !(state.keys && state.keys.caps), num: true, changed: "caps" });
        break;
      case "copied":
        onClipboard({ item: { id: `d${Date.now()}`, kind: "text", text: "https://github.com/SaeedSH/blinkelo", time: Date.now() }, history: state.clipHistory });
        break;
      case "privacy":
        state.privacyKnown = true;
        onHelper({ type: "privacy", mic: ["Zoom"], cam: [], loc: [] });
        setTimeout(() => onHelper({ type: "privacy", mic: [], cam: [], loc: [] }), 9e3);
        break;
      case "weather":
        if (!state.weather || !state.weather.current) state.weather = { ...p, demo: true };
        openDashboard(false, "weather");
        break;
      case "pair":
        onPhone({ type: "pairRequest", id: "demo-phone", name: "Galaxy S24", verifyKey: "7F3A9C21", demo: true });
        setTimeout(() => {
          if (state.pair && state.pair.demo) {
            state.pair = null;
            stopEdge();
            bridge.attention(0);
            present();
          }
        }, 25e3);
        break;
      case "dashboard":
        openDashboard();
        break;
      case "reminder": {
        const now = /* @__PURE__ */ new Date();
        onReminder({ id: `demo${now.getTime()}`, title: i18n.t("t_reminder"), time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` });
        break;
      }
      case "planner":
        openDashboard(false, "planner");
        break;
      case "findpc":
        onFindPc({ ringing: true, name: "Galaxy S24" });
        break;
      case "subs":
        startDemoSubs();
        break;
      case "gaming":
        showTransient("gameSummary", { id: `demo${Date.now()}`, name: "cyberpunk2077", title: "Cyberpunk 2077", dur: 5412, avgFps: 118, low1: 74, maxCpuTemp: 78, maxGpuTemp: 83, temp: gmCfg().temp }, 12e3);
        bump(0.6);
        edge("var(--purple)");
        break;
      case "received":
        onReceived({ type: "received", kind: "file", file: "IMG_20261108_142233.jpg", size: 3481221, image: true, name: "Galaxy S24", path: "" });
        break;
      case "receivedLink":
        onReceived({ type: "received", kind: "url", url: "https://github.com/SaeedSH/blinkelo", opened: true, name: "Galaxy S24" });
        break;
      case "transfer":
        onTransfer({ dir: "out", tid: "demo", name: "Presentation-final.pptx", done: 62e5, total: 98e5, state: "active" });
        break;
      case "phoneTimer":
        onPhoneTimer({ state: "running", id: "tm-demo", label: "Tea", duration: 3e5, remaining: 184e3, from: "Galaxy S24" });
        break;
      default:
        break;
    }
  }
  var demoVideoTimer = null;
  function onSubs(st) {
    const prev = state.subs;
    state.subs = st || null;
    if (!st || !st.video) {
      if (state.expanded === "subs") state.expanded = null;
      if (state.transient && state.transient.kind === "subsReady") state.transient = null;
      present();
      return;
    }
    const videoChanged = !prev || !prev.video || prev.video.key !== st.video.key;
    const fresh = st.file && st.status === "ready" && (videoChanged || !prev.file || prev.file.name !== st.file.name);
    if (fresh && state.expanded !== "subs" && !state.call) {
      showTransient("subsReady", {}, 8e3);
      bump(0.5);
      edge("var(--accent)");
    }
    present();
  }
  function subsCommand(name, args = {}) {
    const st = state.subs;
    if (st && st.demo) {
      demoSubs(name, args);
      return;
    }
    if (bridge.subs) bridge.subs(name, args).catch(() => {
    });
  }
  var DEMO_SUBS = [
    { id: "d1", provider: "subdl", name: "Interstellar.2014.1080p.BluRay.x264-SPARKS", lang: "en", hi: false, downloads: 18200, score: 52, hash: false },
    { id: "d2", provider: "opensubtitles", name: "Interstellar.2014.IMAX.1080p.BluRay", lang: "en", hi: false, downloads: 9400, score: 40, hash: true },
    { id: "d3", provider: "subdl", name: "Interstellar.2014.720p.WEB-DL.H264", lang: "en", hi: false, downloads: 5100, score: 31, hash: false },
    { id: "d4", provider: "podnapisi", name: "Interstellar 2014 BRRip", lang: "en", hi: true, downloads: 820, score: 22, hash: false }
  ];
  var demoSubsTimers = [];
  function demoSubsFile(id, lang) {
    const r = DEMO_SUBS.find((x) => x.id === id) || DEMO_SUBS[0];
    return { name: `Interstellar.2014.1080p.BluRay.x264.${lang}.srt`, lang, provider: r.provider, release: r.name, converted: true };
  }
  function demoSubs(name, args) {
    const st = { ...state.subs };
    if (name === "choose" && args.id) {
      onSubs({ ...st, status: "downloading", downloading: args.id });
      demoSubsTimers.push(setTimeout(() => onSubs({ ...st, status: "ready", downloading: null, selected: args.id, file: demoSubsFile(args.id, st.lang) }), 700));
    } else if (name === "search") {
      const lang = args.lang || st.lang;
      const results = DEMO_SUBS.map((r) => ({ ...r, lang }));
      onSubs({ ...st, lang, status: st.file && lang === st.lang ? "ready" : "searching", searching: true, results: [], query: args.query ? { title: args.query, manual: true } : st.query });
      demoSubsTimers.push(setTimeout(() => onSubs({ ...state.subs, searching: false, results, status: "ready", selected: "d1", file: demoSubsFile("d1", lang) }), 900));
    }
  }
  function startDemoSubs() {
    demoSubsTimers.forEach(clearTimeout);
    demoSubsTimers = [];
    const langs = [i18n.lang(), "en"].filter((x, i, a) => a.indexOf(x) === i);
    const v = { key: "demo|interstellar", title: "Interstellar", raw: "Interstellar.2014.1080p.BluRay.x264.mkv", app: "VLC", hasPath: true, season: null, episode: null, year: 2014 };
    const base = { demo: true, enabled: true, video: v, lang: langs[0], langs, query: { title: "Interstellar", year: 2014 }, results: [], selected: null, file: null, error: null, fallback: null, searching: false, downloading: null, providers: ["subdl", "opensubtitles", "podnapisi"] };
    onPlayer({ type: "player", present: true, app: "VLC", exe: "vlc.exe", title: "Interstellar.2014.1080p.BluRay", playing: true });
    onSubs({ ...base, status: "searching", searching: true });
    const results = DEMO_SUBS.map((r) => ({ ...r, lang: langs[0] }));
    demoSubsTimers.push(setTimeout(() => onSubs({ ...base, status: "downloading", downloading: "d1", results }), 1500));
    demoSubsTimers.push(setTimeout(() => onSubs({ ...base, status: "ready", results, selected: "d1", file: demoSubsFile("d1", langs[0]) }), 2700));
    clearTimeout(demoVideoTimer);
    demoVideoTimer = setTimeout(() => {
      onPlayer({ type: "player", present: false });
      onSubs(null);
    }, 45e3);
  }
  function onClipboard(payload) {
    if (payload.history) state.clipHistory = payload.history;
    if (payload.item && state.settings.modules.clipboard) showTransient("copied", { item: payload.item }, 1900);
    else present();
  }
  bridge.on("helper", onHelper);
  bridge.on("hover", setHover);
  bridge.on("settings", applySettings);
  bridge.on("accent", applyAccent);
  bridge.on("backdrop", applyBackdrop);
  bridge.invoke("backdrop:get").then(applyBackdrop).catch(() => {
  });
  bridge.on("clipboard", onClipboard);
  bridge.phone("timers").then((timers) => {
    state.sharedTimers = timers || [];
    present();
  }).catch(() => {
  });
  bridge.on("stats", (s) => {
    state.stats = s;
    if (state.expanded === "dashboard") present();
  });
  bridge.on("demo", runDemo);
  bridge.on("toggleDashboard", () => {
    if (state.expanded === "dashboard") collapse();
    else openDashboard(true);
  });
  bridge.on("phone", onPhone);
  bridge.on("weather", (w) => {
    state.weather = w;
    present();
  });
  bridge.on("shortcuts", (s) => {
    state.shortcuts = s || [];
    present();
  });
  bridge.on("widgets", (w) => {
    state.widgets = w || { crypto: null, news: null };
    if (state.expanded === "dashboard") present();
  });
  bridge.on("tasks", (t) => {
    state.tasks = t || [];
    if (state.expanded === "dashboard") present();
  });
  bridge.on("reminder", onReminder);
  bridge.on("subs", onSubs);
  bridge.on("gaming", onGaming);
  bridge.on("gamingLibrary", () => {
    state.gameLibStale = true;
    if (state.expanded === "dashboard" && state.tab === "gaming") loadGameLib(false);
  });
  document.addEventListener("wheel", (e) => {
    const lib = e.target.closest && e.target.closest("[data-gm-lib]");
    if (!lib || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    lib.scrollLeft += (getComputedStyle(lib).direction === "rtl" ? -1 : 1) * e.deltaY;
    e.preventDefault();
  }, { passive: false });
  bridge.on("gameSummary", (rec) => {
    if (!rec) return;
    showTransient("gameSummary", { ...rec, temp: gmCfg().temp }, 12e3);
    bump(0.6);
    edge("var(--purple)");
  });
  if (!IS_DEMO) bridge.invoke("subs:get").then((st) => {
    if (st) onSubs(st);
  }).catch(() => {
  });
  bridge.on("shelfChanged", () => {
    if (state.expanded === "dashboard" && state.tab === "shelf") refreshTabData("shelf");
  });
  function onReminder(tk) {
    if (!tk) return;
    const when = tk.time ? `${i18n.digits(tk.time)} \xB7 ` : "";
    showTransient("message", { id: `rem-${tk.id}`, icon: "alarm-clock", text: `${when}${tk.title}`, tone: "orange" }, 7e3);
    bump(0.9);
    edge("var(--orange)");
    if (state.settings.sound) chime("timer");
  }
  Promise.all([
    bridge.invoke("settings:get").catch(() => null),
    bridge.invoke("accent:get").catch(() => null),
    bridge.invoke("shelf:get").catch(() => []),
    bridge.invoke("clipboard:history").catch(() => []),
    bridge.invoke("shortcuts:get").catch(() => []),
    bridge.invoke("weather:get").catch(() => null),
    bridge.invoke("phone:get").catch(() => null),
    bridge.invoke("widgets:get").catch(() => null),
    bridge.invoke("tasks:get").catch(() => [])
  ]).then(([s, accent, shelf, clips, shortcuts, weather, phone, widgets, tasks]) => {
    if (widgets) state.widgets = widgets;
    state.tasks = tasks || [];
    if (s) applySettings(s);
    applyAccent(accent);
    state.shelf = shelf || [];
    state.clipHistory = clips || [];
    state.shortcuts = shortcuts || [];
    if (weather) state.weather = weather;
    if (phone) state.phone = { me: phone.me, devices: phone.devices || [] };
    present();
  });
  ticker = setInterval(tick, 250);
  window.addEventListener("resize", () => {
    lastRectsJson = "";
    present();
  });
  presentNow();
  window.__island = { state, runDemo, expand, collapse, setHover, present: presentNow, openDashboard, applySettings, startTimer, onPhone };
})();
