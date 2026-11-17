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
        support: ["Support", "\u0627\u062F\u0639\u0645", "Destek ol", "Apoyar", "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u0442\u044C", "\u652F\u6301"],
        supportTitle: ["Support Blinkelo", "\u0627\u062F\u0639\u0645 Blinkelo", "Blinkelo\u2019ya destek ol", "Apoya Blinkelo", "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u0442\u044C Blinkelo", "\u652F\u6301 Blinkelo"],
        supportText: ["Blinkelo is free, has no ads and collects no data. It\u2019s made by one developer in their spare time. If it makes your desktop nicer, a small crypto donation keeps new versions coming.", "Blinkelo \u0645\u062C\u0627\u0646\u064A\u060C \u0628\u0644\u0627 \u0625\u0639\u0644\u0627\u0646\u0627\u062A\u060C \u0648\u0644\u0627 \u064A\u062C\u0645\u0639 \u0623\u064A \u0628\u064A\u0627\u0646\u0627\u062A. \u064A\u0637\u0648\u0651\u0631\u0647 \u0645\u0637\u0648\u0651\u0631 \u0648\u0627\u062D\u062F \u0641\u064A \u0648\u0642\u062A \u0641\u0631\u0627\u063A\u0647. \u0625\u0646 \u0623\u0639\u062C\u0628\u0643\u060C \u0641\u062A\u0628\u0631\u0651\u0639 \u0635\u063A\u064A\u0631 \u0628\u0627\u0644\u0639\u0645\u0644\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u064A\u0633\u0627\u0639\u062F \u0639\u0644\u0649 \u0627\u0633\u062A\u0645\u0631\u0627\u0631 \u0627\u0644\u0625\u0635\u062F\u0627\u0631\u0627\u062A \u0627\u0644\u062C\u062F\u064A\u062F\u0629.", "Blinkelo \xFCcretsizdir, reklam i\xE7ermez ve veri toplamaz. Tek bir geli\u015Ftirici bo\u015F zaman\u0131nda geli\u015Ftiriyor. Masa\xFCst\xFCn\xFC g\xFCzelle\u015Ftiriyorsa, k\xFC\xE7\xFCk bir kripto ba\u011F\u0131\u015F\u0131 yeni s\xFCr\xFCmlerin gelmesini sa\u011Flar.", "Blinkelo es gratis, no tiene anuncios y no recopila datos. Lo hace un solo desarrollador en su tiempo libre. Si te gusta, una peque\xF1a donaci\xF3n en cripto ayuda a que sigan llegando versiones nuevas.", "Blinkelo \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u0435\u043D, \u0431\u0435\u0437 \u0440\u0435\u043A\u043B\u0430\u043C\u044B \u0438 \u043D\u0435 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0435. \u0415\u0433\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u043E\u0434\u0438\u043D \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A \u0432 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F. \u0415\u0441\u043B\u0438 \u043E\u043D \u0432\u0430\u043C \u043D\u0440\u0430\u0432\u0438\u0442\u0441\u044F, \u043D\u0435\u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u043F\u043E\u0436\u0435\u0440\u0442\u0432\u043E\u0432\u0430\u043D\u0438\u0435 \u0432 \u043A\u0440\u0438\u043F\u0442\u043E\u0432\u0430\u043B\u044E\u0442\u0435 \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u0432\u044B\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438.", "Blinkelo \u514D\u8D39\u3001\u65E0\u5E7F\u544A\u3001\u4E0D\u6536\u96C6\u4EFB\u4F55\u6570\u636E\uFF0C\u7531\u4E00\u4F4D\u5F00\u53D1\u8005\u5229\u7528\u4E1A\u4F59\u65F6\u95F4\u5236\u4F5C\u3002\u5982\u679C\u4F60\u559C\u6B22\u5B83\uFF0C\u4E00\u7B14\u5C0F\u5C0F\u7684\u52A0\u5BC6\u8D27\u5E01\u6350\u8D60\u80FD\u8BA9\u65B0\u7248\u672C\u6301\u7EED\u63A8\u51FA\u3002"],
        donateCrypto: ["Donate with crypto", "\u062A\u0628\u0631\u0651\u0639 \u0628\u0627\u0644\u0639\u0645\u0644\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629", "Kripto ile ba\u011F\u0131\u015F yap", "Donar con cripto", "\u041F\u043E\u0436\u0435\u0440\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u043A\u0440\u0438\u043F\u0442\u043E\u0432\u0430\u043B\u044E\u0442\u043E\u0439", "\u7528\u52A0\u5BC6\u8D27\u5E01\u6350\u8D60"],
        starGithub: ["Star on GitHub", "\u0623\u0639\u0637\u0650 \u0646\u062C\u0645\u0629 \u0639\u0644\u0649 GitHub", "GitHub\u2019da y\u0131ld\u0131z ver", "Dar una estrella en GitHub", "\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0437\u0432\u0435\u0437\u0434\u0443 \u043D\u0430 GitHub", "\u5728 GitHub \u4E0A\u70B9\u661F"],
        reportBug: ["Report a bug or idea", "\u0627\u0644\u0625\u0628\u0644\u0627\u063A \u0639\u0646 \u062E\u0637\u0623 \u0623\u0648 \u0641\u0643\u0631\u0629", "Hata ya da fikir bildir", "Informar de un error o una idea", "\u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E\u0431 \u043E\u0448\u0438\u0431\u043A\u0435 \u0438\u043B\u0438 \u0438\u0434\u0435\u0435", "\u62A5\u544A\u95EE\u9898\u6216\u5EFA\u8BAE"],
        supportFree: ["Free ways to help: star the project, share it with friends, or translate it into your language.", "\u0637\u0631\u0642 \u0645\u062C\u0627\u0646\u064A\u0629 \u0644\u0644\u0645\u0633\u0627\u0639\u062F\u0629: \u0627\u0645\u0646\u062D \u0627\u0644\u0645\u0634\u0631\u0648\u0639 \u0646\u062C\u0645\u0629\u060C \u0623\u0648 \u0634\u0627\u0631\u0643\u0647 \u0645\u0639 \u0623\u0635\u062F\u0642\u0627\u0626\u0643\u060C \u0623\u0648 \u062A\u0631\u062C\u0645\u0647 \u0625\u0644\u0649 \u0644\u063A\u062A\u0643.", "\xDCcretsiz destek yollar\u0131: projeye y\u0131ld\u0131z ver, arkada\u015Flar\u0131nla payla\u015F ya da kendi diline \xE7evir.", "Formas gratuitas de ayudar: dale una estrella, comp\xE1rtelo con tus amigos o trad\xFAcelo a tu idioma.", "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u0441\u043F\u043E\u0441\u043E\u0431\u044B \u043F\u043E\u043C\u043E\u0447\u044C: \u043F\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0437\u0432\u0435\u0437\u0434\u0443, \u0440\u0430\u0441\u0441\u043A\u0430\u0436\u0438\u0442\u0435 \u0434\u0440\u0443\u0437\u044C\u044F\u043C \u0438\u043B\u0438 \u043F\u0435\u0440\u0435\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u043D\u0430 \u0441\u0432\u043E\u0439 \u044F\u0437\u044B\u043A.", "\u514D\u8D39\u7684\u652F\u6301\u65B9\u5F0F\uFF1A\u70B9\u661F\u3001\u5206\u4EAB\u7ED9\u670B\u53CB\uFF0C\u6216\u628A\u5B83\u7FFB\u8BD1\u6210\u4F60\u7684\u8BED\u8A00\u3002"],
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
      function strings2(lang2) {
        const i = Math.max(0, ORDER.indexOf(lang2));
        const en = ORDER.indexOf("en");
        const out = {};
        for (const [k, arr] of Object.entries(T)) out[k] = arr[i] || arr[en];
        return out;
      }
      function langInfo2(lang2) {
        return LANGS2.find((l) => l.code === lang2) || LANGS2[0];
      }
      module.exports = { LANGS: LANGS2, strings: strings2, langInfo: langInfo2 };
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

  // src/shared/links.js
  var require_links = __commonJS({
    "src/shared/links.js"(exports, module) {
      "use strict";
      var REPO = "https://github.com/saeedsh70/Blinkelo";
      module.exports = {
        REPO,
        DONATE: `${REPO}/blob/main/DONATE.md`,
        ISSUES: `${REPO}/issues/new/choose`,
        RELEASES: `${REPO}/releases/latest`
      };
    }
  });

  // src/renderer/island/icons.js
  var ICONS = {
    "heart": '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />',
    "star": '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />',
    "bug": '<path d="M12 20v-9" /> <path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z" /> <path d="M14.12 3.88 16 2" /> <path d="M21 21a4 4 0 0 0-3.81-4" /> <path d="M21 5a4 4 0 0 1-3.55 3.97" /> <path d="M22 13h-4" /> <path d="M3 21a4 4 0 0 1 3.81-4" /> <path d="M3 5a4 4 0 0 0 3.55 3.97" /> <path d="M6 13H2" /> <path d="m8 2 1.88 1.88" /> <path d="M9 7.13V6a3 3 0 1 1 6 0v1.13" />',
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

  // src/renderer/settings/settings.src.js
  var import_strings = __toESM(require_strings());

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
  function cityName(tz, lang2) {
    return CITY[tz] || tz.split("/").pop().replace(/_/g, " ");
  }

  // src/renderer/settings/settings.src.js
  var import_deck_meta = __toESM(require_deck_meta());
  var import_sub_langs = __toESM(require_sub_langs());
  var import_links = __toESM(require_links());

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
      const t2 = setTimeout(() => {
        timers.delete(t2);
        if (alive) fn();
      }, ms);
      timers.add(t2);
      return t2;
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
    const api2 = {
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
      look(dir2 = 1) {
        el.style.setProperty("--bk-dir", dir2 < 0 ? "-1" : "1");
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
        await api2.wake();
        await wait(180);
        await api2.look(-1);
        await api2.look(1);
        await wait(120);
        await api2.blink();
        await wait(220);
        await api2.wink();
      },
      /** One random idle move, weighted towards plain blinks. */
      random() {
        const r = Math.random();
        if (r < 0.62) return api2.blink();
        if (r < 0.8) return api2.blink2();
        if (r < 0.93) return api2.look(Math.random() < 0.5 ? -1 : 1);
        return api2.wink();
      },
      start() {
        if (autoOn) return api2;
        autoOn = true;
        schedule(900 + Math.random() * 1600);
        return api2;
      },
      stop() {
        autoOn = false;
        if (autoTimer) {
          clearTimeout(autoTimer);
          timers.delete(autoTimer);
          autoTimer = null;
        }
        return api2;
      },
      destroy() {
        alive = false;
        autoOn = false;
        timers.forEach((t2) => clearTimeout(t2));
        timers.clear();
        if (el) el.classList.remove(...PLAY);
      }
    };
    function schedule(ms) {
      if (!autoOn) return;
      autoTimer = later(() => {
        autoTimer = null;
        if (!autoOn) return;
        const idleOk = !document.hidden && !reducedMotion() && el.isConnected && !api2.busy;
        if (idleOk) api2.random();
        schedule(gap[0] + Math.random() * (gap[1] - gap[0]));
      }, ms);
    }
    if (opts.auto) api2.start();
    return api2;
  }
  function followPointer(face, area, reach = 1) {
    if (!face || !area) return () => {
    };
    const move = (e) => {
      const r = face.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 260));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 200));
      face.style.setProperty("--bk-tx", (dx * reach).toFixed(3));
      face.style.setProperty("--bk-ty", (dy * reach).toFixed(3));
    };
    const leave = () => {
      face.style.setProperty("--bk-tx", "0");
      face.style.setProperty("--bk-ty", "0");
    };
    area.addEventListener("pointermove", move);
    area.addEventListener("pointerleave", leave);
    return () => {
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerleave", leave);
    };
  }

  // src/renderer/settings/settings.src.js
  var { strings, LANGS, langInfo } = import_strings.default;
  var PARAMS = new URLSearchParams(location.search);
  var api = window.islandSettings || mockApi();
  var S = null;
  var section = "welcome";
  var onboarding = false;
  var obStep = 0;
  var statusData = null;
  var displays = [];
  var phone = { me: null, devices: [] };
  var downloadDir = "";
  var btScanning = false;
  var wx = null;
  var shortcuts = [];
  var installed = null;
  var pickerOpen = false;
  var pickerQuery = "";
  var webForm = false;
  var editKey = null;
  var keyForm = null;
  var keyDraft = { name: "", target: "", hotkey: null };
  var cityResults = null;
  var cityQuery = "";
  var cityBusy = false;
  var ipBusy = false;
  var catalog = null;
  var feedBusy = false;
  var feedError = "";
  var feedDraft = "";
  var flash = "";
  var subsDir = "";
  var subsTests = {};
  var subsUserDraft = null;
  var gm = null;
  var gmProcs = null;
  var gmAllow = null;
  var gmLib = null;
  var gmLibBusy = false;
  var strCache = {};
  var lang = () => S && LANGS.some((l) => l.code === S.language) ? S.language : "en";
  var dir = () => langInfo(lang()).dir;
  function t(k, vars) {
    const l = lang();
    if (!strCache[l]) strCache[l] = strings(l);
    let s = strCache[l][k];
    if (s === void 0) s = k;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, n) => vars[n] !== void 0 ? vars[n] : "");
    return s;
  }
  var esc = (s) => String(s === void 0 || s === null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var num = (n) => String(n);
  var SECTIONS = [
    ["welcome", "sparkles"],
    ["appearance", "layout-grid"],
    ["modules", "app-window"],
    ["notificationsNav", "bell"],
    ["phoneNav", "smartphone"],
    ["shortcutsNav", "rocket"],
    ["subtitlesNav", "captions"],
    ["gamingNav", "gamepad-2"],
    ["widgetsNav", "bitcoin"],
    ["weatherNav", "cloud-sun"],
    ["behavior", "settings"],
    ["tryit", "play"],
    ["status", "activity"],
    ["support", "heart"],
    ["about", "flag"]
  ];
  var KDE_PLAY = "https://play.google.com/store/apps/details?id=org.kde.kdeconnect_tp";
  var KDE_FDROID = "https://f-droid.org/packages/org.kde.kdeconnect_tp/";
  async function save(patch, rerender = true) {
    S = await api.set(patch);
    if (rerender) render(false);
  }
  function sw(path, value) {
    return `<label class="switch"><input type="checkbox" data-path="${path}" ${value ? "checked" : ""}><span></span></label>`;
  }
  function row(title, hint, control, ic, extra = "") {
    return `<div class="row ${extra}">${ic ? `<span class="row-ic">${icon(ic, 18)}</span>` : ""}<div class="row-text"><div class="row-title">${esc(title)}</div>${hint ? `<div class="row-hint">${esc(hint)}</div>` : ""}</div><div class="row-ctl">${control}</div></div>`;
  }
  function seg(path, value, options) {
    return `<div class="seg">${options.map(([v, label]) => `<button data-seg="${path}" data-val="${esc(v)}" class="${String(v) === String(value) ? "on" : ""}">${esc(label)}</button>`).join("")}</div>`;
  }
  function range(path, value, min, max, step, fmt) {
    return `<div class="range"><input type="range" data-path="${path}" data-fmt="${path}" min="${min}" max="${max}" step="${step}" value="${value}"><output>${esc(fmt(value))}</output></div>`;
  }
  var FMT = {
    scale: (v) => `${num(Math.round(v * 100))}%`,
    topOffset: (v) => `${num(v)}px`,
    "notifications.duration": (v) => `${num(v)} ${t("seconds")}`,
    transparency: (v) => `${num(v)}%`,
    "gaming.hud.opacity": (v) => `${num(v)}%`
  };
  function heroIsland(wide = false) {
    return `<div class="hero-island bk-hero-area"><div class="hi-pill bk-hero ${wide ? "wide" : ""}">${faceHtml(wide ? "bk-xl" : "bk-lg")}</div></div>`;
  }
  var heroFaces = [];
  function wireFaces(firstShow) {
    heroFaces.forEach((f) => {
      f.destroy();
      if (f.unfollow) f.unfollow();
    });
    heroFaces = [];
    document.querySelectorAll("#main .bk-hero .bk").forEach((el) => {
      const f = createBlinker(el, { gap: [2600, 6200] });
      const area = el.closest(".bk-hero-area");
      f.unfollow = followPointer(el, area, 1);
      if (area) area.onclick = () => {
        if (!f.busy) f.wink();
      };
      if (firstShow) f.hello().then(() => f.start());
      else f.start();
      heroFaces.push(f);
    });
  }
  function langGrid(big = false) {
    return `<div class="lang-grid ${big ? "big" : ""}">${LANGS.map((l) => `<button class="lang-tile ${S.language === l.code ? "on" : ""}" data-setlang="${l.code}" dir="${l.dir}">
    <b>${esc(l.name)}</b><span>${esc(l.english)}</span>${S.language === l.code ? `<i class="lang-check">${icon("check", 13, 3)}</i>` : ""}</button>`).join("")}</div>`;
  }
  function wxKey(code) {
    const c = Number(code);
    if (c === 0) return ["wx_clear", "sun"];
    if (c === 1) return ["wx_mostlyClear", "sun"];
    if (c === 2) return ["wx_partlyCloudy", "cloud-sun"];
    if (c === 3) return ["wx_cloudy", "cloud"];
    if (c === 45 || c === 48) return ["wx_fog", "cloud-fog"];
    if (c >= 51 && c <= 57) return ["wx_drizzle", "cloud-drizzle"];
    if (c >= 61 && c <= 67) return ["wx_rain", "cloud-rain"];
    if (c >= 80 && c <= 82) return ["wx_showers", "cloud-rain"];
    if (c >= 71 && c <= 77 || c === 85 || c === 86) return ["wx_snow", "cloud-snow"];
    if (c >= 95) return ["wx_thunder", "cloud-lightning"];
    return ["wx_cloudy", "cloud"];
  }
  function citySearchBox() {
    let results = "";
    if (cityBusy) results = `<div class="city-results"><div class="muted pad">${esc(t("loading"))}</div></div>`;
    else if (cityResults && cityResults.error) results = `<div class="city-results"><div class="muted pad">${esc(t("weatherError"))}</div></div>`;
    else if (cityResults && !cityResults.length) results = `<div class="city-results"><div class="muted pad">${esc(t("noResults"))}</div></div>`;
    else if (cityResults) {
      results = `<div class="city-results">${cityResults.map((c, i) => `<button class="city-opt" data-city="${i}">${icon("map-pin", 15)}<span><b>${esc(c.name)}</b><small>${esc([c.admin1, c.country].filter(Boolean).join(" \xB7 "))}</small></span></button>`).join("")}</div>`;
    }
    return `<div class="city-search"><span class="search-ic">${icon("search", 16)}</span>
    <input class="text big" id="cityInput" placeholder="${esc(t("searchCity"))}" value="${esc(cityQuery)}" autocomplete="off" dir="auto"></div>${results}`;
  }
  function selectedCity() {
    const c = S.weather && S.weather.city;
    if (!c) return "";
    return `<div class="city-chip">${icon("map-pin", 15)}<span><b>${esc(c.name)}</b><small>${esc([c.admin1, c.country].filter(Boolean).join(" \xB7 "))}</small></span></div>`;
  }
  function weatherPreview() {
    if (!wx || !wx.current) return "";
    const [k, ic] = wxKey(wx.current.code);
    const unit = wx.unit === "f" ? "\xB0F" : "\xB0";
    return `<div class="wx-prev">
    <span class="wx-prev-ic">${icon(ic, 34, 1.8)}</span>
    <div><div class="wx-prev-temp">${num(Math.round(wx.current.temp))}${unit}</div><div class="muted">${esc(t(k))} \xB7 ${esc(wx.city)}</div></div>
    <button class="btn sm" data-cmd="wxRefresh" title="${esc(t("refresh"))}">${icon("refresh-cw", 15)}</button>
  </div>`;
  }
  function deviceRow(d) {
    let state;
    let cls;
    let actions = "";
    if (d.pairState === "requestedByPeer") {
      state = t("pairRequest", { name: d.name });
      cls = "wait";
      actions = `<button class="btn sm" data-phone="reject" data-id="${esc(d.id)}">${icon("x", 14, 2.4)} ${esc(t("rejectPair"))}</button>
      <button class="btn sm green" data-phone="accept" data-id="${esc(d.id)}">${icon("check", 14, 2.6)} ${esc(t("acceptPair"))}</button>`;
    } else if (d.pairState === "requested") {
      state = t("waitingPhone");
      cls = "wait";
    } else if (d.paired) {
      state = `${t("pairedState")} \xB7 ${d.connected ? t("connectedState") : t("offlineState")}`;
      cls = d.connected ? "ok" : "off";
      actions = `${d.connected ? `<button class="btn sm" data-phone="sendFile" data-id="${esc(d.id)}" title="${esc(t("sendFile"))}">${icon("upload", 15)}</button>
      <button class="btn sm" data-phone="find" data-id="${esc(d.id)}" title="${esc(t("ringPhone"))}">${icon("bell-ring", 15)}</button>` : ""}
      <button class="btn sm danger" data-phone="unpair" data-id="${esc(d.id)}">${esc(t("unpair"))}</button>`;
    } else {
      state = `${t("notPaired")}${d.connected ? "" : ` \xB7 ${t("offlineState")}`}`;
      cls = "off";
      if (d.connected) actions = `<button class="btn sm accent" data-phone="pair" data-id="${esc(d.id)}">${icon("link", 14, 2.4)} ${esc(t("pair"))}</button>`;
    }
    const code = d.verifyKey && d.pairState !== "paired" ? `<span class="code" dir="ltr">${esc(d.verifyKey.slice(0, 4))} ${esc(d.verifyKey.slice(4))}</span>` : "";
    const bat = d.paired && d.battery !== void 0 && d.battery !== null ? `<span class="dev-bat ${d.charging ? "chg" : ""}" dir="ltr">${icon(d.charging ? "battery-charging" : "battery-medium", 15)} ${num(d.battery)}%</span>` : "";
    return `<div class="row dev">
    <span class="row-ic dev-ic ${cls}">${icon(d.type === "tablet" ? "monitor" : "smartphone", 18)}<i class="dev-dot ${cls}"></i></span>
    <div class="row-text"><div class="row-title">${esc(d.name)} ${bat}${d.island ? `<span class="tag-island">${esc(t("islandApp"))}</span>` : ""}</div><div class="row-hint">${esc(state)} ${code}${d.wifi && d.address ? ` \xB7 <span class="dev-via">${icon("wifi", 12)} <span dir="ltr">${esc(d.address)}</span></span>` : !d.bluetooth && d.address ? ` \xB7 <span dir="ltr">${esc(d.address)}</span>` : ""}${d.bluetooth ? ` \xB7 <span class="dev-via">${icon("bluetooth", 12)} ${esc(t("viaBluetooth"))}</span>` : ""}</div></div>
    <div class="row-ctl btn-row">${actions}</div>
  </div>`;
  }
  function phoneFeatures() {
    const P = S.phone || {};
    const dir2 = downloadDir || "";
    return `<div class="card"><div class="card-head"><h3>${icon("sparkles", 17)} ${esc(t("phoneFeatures"))}</h3></div>
    ${row(t("btLink"), t("btLinkHint"), sw("phone.bluetooth", P.bluetooth !== false), "bluetooth")}
    ${row(t("remoteInput"), t("remoteInputHint"), sw("phone.remoteInput", P.remoteInput !== false), "mouse-pointer-2")}
    ${row(t("sharedClipboard"), t("sharedClipboardHint"), sw("phone.clipboard", P.clipboard !== false), "clipboard")}
    ${P.clipboard !== false ? row(t("clipImages"), "", sw("phone.clipboardImages", P.clipboardImages !== false), "image", "sub") : ""}
    ${row(t("forwardNotifs"), "", sw("phone.forwardNotifications", P.forwardNotifications !== false), "bell")}
    ${row(t("openLinks"), "", sw("phone.openLinks", P.openLinks !== false), "link")}
    ${row(t("cameraToClip"), "", sw("phone.cameraToClipboard", P.cameraToClipboard !== false), "camera")}
    <div class="row"><span class="row-ic">${icon("folder-open", 18)}</span>
      <div class="row-text"><div class="row-title">${esc(t("downloadFolder"))}</div><div class="row-hint ell" dir="ltr">${esc(dir2)}</div></div>
      <div class="row-ctl btn-row"><button class="btn sm" data-phone="openDownloads">${esc(t("openFolder"))}</button><button class="btn sm" data-phone="pickDownloadDir">${esc(t("change"))}</button></div></div>
  </div>`;
  }
  function commandsCard() {
    const list = S.phone && S.phone.commands || [];
    return `<div class="card"><div class="card-head"><h3>${icon("terminal", 17)} ${esc(t("customCommands"))}</h3></div>
    <div class="row-hint pad-hint">${esc(t("customCommandsHint"))}</div>
    ${list.length ? list.map((c) => `<div class="row cmd-row"><span class="row-ic">${icon("zap", 16)}</span>
      <div class="row-text"><div class="row-title">${esc(c.name)}</div><div class="row-hint ell" dir="ltr">${esc(c.command)}</div></div>
      <div class="row-ctl"><button class="btn sm icon danger" data-cmdrm="${esc(c.id)}" title="${esc(t("remove"))}">${icon("trash-2", 14)}</button></div></div>`).join("") : `<div class="empty small">${esc(t("noCommands"))}</div>`}
    <form class="cmd-form" id="cmdForm"><input class="text" id="cmdName" placeholder="${esc(t("cmdName"))}" maxlength="40" dir="auto">
      <input class="text" id="cmdCommand" placeholder="${esc(t("cmdCommand"))} \u2014 explorer shell:Downloads" maxlength="400" dir="ltr">
      <button class="btn sm accent" type="submit">${icon("plus", 14, 2.4)} ${esc(t("addCommand"))}</button></form>
  </div>`;
  }
  function phoneSteps() {
    return `<ol class="steps">
    <li><span class="step-n">${num(1)}</span><div>${esc(t("phoneStep1"))}
      <div class="btns tight"><button class="btn sm" data-url="${KDE_PLAY}">${icon("download", 14)} Google Play</button><button class="btn sm" data-url="${KDE_FDROID}">${icon("download", 14)} F-Droid</button></div></div></li>
    <li><span class="step-n">${num(2)}</span><div>${esc(t("phoneStep2"))}</div></li>
    <li><span class="step-n">${num(3)}</span><div>${esc(t("phoneStep3"))}</div></li>
  </ol>`;
  }
  function deviceList() {
    const list = (phone.devices || []).slice().sort((a, b) => b.paired - a.paired || b.connected - a.connected);
    const me = phone.me;
    return `<div class="card">
    <div class="card-head"><h3>${icon("smartphone", 17)} ${esc(t("devices"))}</h3>
      <div class="btn-row">${S.phone && S.phone.bluetooth !== false ? `<button class="btn sm ${btScanning ? "on" : ""}" data-phone="btScan" title="${esc(t("btSearchHint"))}">${icon("bluetooth", 14)} ${esc(t(btScanning ? "btSearching" : "btSearch"))}</button>` : ""}
      <button class="btn sm" data-phone="refresh">${icon("refresh-cw", 14)} ${esc(t("refresh"))}</button></div></div>
    ${list.length ? list.map(deviceRow).join("") : `<div class="empty"><span class="radar">${icon("radar", 26, 1.8)}</span><span>${esc(t("noDevices"))}</span></div>`}
    <div class="row ip-row">
      <span class="row-ic">${icon("wifi", 18)}</span>
      <div class="row-text"><div class="row-title">${esc(t("addByIp"))}</div>
      ${me ? `<div class="row-hint">${esc(t("thisPc"))}: <b>${esc(me.name)}</b> \xB7 <span dir="ltr">${esc((me.ips || []).join(", "))}${me.port ? `:${me.port}` : ""}</span></div>` : ""}</div>
      <div class="row-ctl btn-row"><input class="text ip" id="ipInput" placeholder="192.168.1.20" dir="ltr"><button class="btn sm" data-phone="connectIp" ${ipBusy ? "disabled" : ""}>${icon("link", 14)}</button></div>
    </div>
  </div>`;
  }
  var cap = (k) => k[0].toUpperCase() + k.slice(1);
  function keyPreview(s, size = 38) {
    const look = import_deck_meta.default.keyLook(s);
    const inner = s.icon ? `<img src="${esc(s.icon)}" alt="">` : look.glyph ? icon(look.glyph, Math.round(size * 0.5), 2) : `<b>${esc((s.name || "?").trim()[0] || "?")}</b>`;
    return `<span class="dkp ${look.color ? "tint" : ""}" style="width:${size}px;height:${size}px;${look.color ? `--kc:${look.color}` : ""}">${inner}</span>`;
  }
  function keyHint(s) {
    if (s.kind === "hotkey") return `${t("keyHotkey")} \xB7 ${s.target}`;
    if (s.kind === "media") {
      const m = import_deck_meta.default.MEDIA.find((x) => x[0] === s.target);
      return `${t("keyMedia")} \xB7 ${m ? t(m[2]) : s.target}`;
    }
    if (s.kind === "action") return `${t("keyAction")} \xB7 ${t(s.target)}`;
    if (s.kind === "command") return `${t("keyCommand")} \xB7 ${s.target}`;
    if (s.kind === "text") return `${t("keyText")} \xB7 ${s.target}`;
    return s.target || "";
  }
  function keyEditor(s) {
    const look = import_deck_meta.default.keyLook(s);
    const id = esc(s.id);
    return `<div class="key-edit">
    <div class="ke-row"><label>${esc(t("keyName"))}</label><input class="text" id="keyRename" data-keyname="${id}" value="${esc(s.name)}" maxlength="60" dir="auto"></div>
    <div class="ke-row"><label>${esc(t("keySize"))}</label><div class="seg">${import_deck_meta.default.SIZES.map((z) => `<button data-keyset="size" data-id="${id}" data-val="${z}" class="${look.size === z ? "on" : ""}"><i class="sz sz-${z}"></i><span dir="ltr">${z.replace("x", "\xD7")}</span></button>`).join("")}</div></div>
    <div class="ke-row"><label>${esc(t("keyColor"))}</label><div class="swatches">
      <button class="swatch none ${s.color ? "" : "on"}" data-keyset="color" data-id="${id}" data-val="" title="${esc(t("keyAuto"))}"></button>
      ${import_deck_meta.default.COLORS.map((c) => `<button class="swatch ${s.color === c ? "on" : ""}" data-keyset="color" data-id="${id}" data-val="${c}" style="--c:${c}"></button>`).join("")}</div></div>
    <div class="ke-row top"><label>${esc(t("keyIcon"))}</label><div class="glyphs">
      <button class="glyph auto ${s.glyph ? "" : "on"}" data-keyset="glyph" data-id="${id}" data-val="">${esc(t("keyAuto"))}</button>
      ${import_deck_meta.default.GLYPHS.map((g) => `<button class="glyph ${s.glyph === g ? "on" : ""}" data-keyset="glyph" data-id="${id}" data-val="${g}">${icon(g, 16)}</button>`).join("")}</div></div>
  </div>`;
  }
  function shortcutList() {
    if (!shortcuts.length) return `<div class="empty">${icon("layout-grid", 26, 1.8)}<span>${esc(t("appsEmpty"))}</span></div>`;
    return shortcuts.map((s, i) => `<div class="row sc-row ${editKey === s.id ? "open" : ""}">
    ${keyPreview(s)}
    <div class="row-text"><div class="row-title">${esc(s.name)}</div><div class="row-hint ell" dir="${import_deck_meta.default.KEY_KINDS.includes(s.kind) ? "auto" : "ltr"}">${esc(keyHint(s))}</div></div>
    <div class="row-ctl btn-row">
      <button class="btn sm icon" data-sc="launch" data-id="${esc(s.id)}" title="${esc(t("open"))}">${icon("play", 13, 0, "", true)}</button>
      <button class="btn sm icon ${editKey === s.id ? "on" : ""}" data-sc="edit" data-id="${esc(s.id)}" title="${esc(t("keyEdit"))}">${icon("pencil", 14)}</button>
      <button class="btn sm icon" data-sc="up" data-id="${esc(s.id)}" ${i === 0 ? "disabled" : ""}>${icon("arrow-up", 15)}</button>
      <button class="btn sm icon" data-sc="down" data-id="${esc(s.id)}" ${i === shortcuts.length - 1 ? "disabled" : ""}>${icon("arrow-down", 15)}</button>
      <button class="btn sm icon danger" data-sc="remove" data-id="${esc(s.id)}" title="${esc(t("remove"))}">${icon("trash-2", 15)}</button>
    </div></div>${editKey === s.id ? keyEditor(s) : ""}`).join("");
  }
  function keyFormHtml() {
    if (!keyForm) return "";
    const kinds = [["hotkey", "keyboard"], ["media", "music"], ["action", "zap"], ["command", "terminal"], ["text", "file-text"]];
    let body;
    if (keyForm === "media") {
      body = `<div class="key-choices">${import_deck_meta.default.MEDIA.map(([k, ic, label]) => `<button class="btn" data-keyadd="media" data-val="${k}">${icon(ic, 15)} ${esc(t(label))}</button>`).join("")}</div>`;
    } else if (keyForm === "action") {
      body = `<div class="key-choices">${import_deck_meta.default.ACTIONS.map(([k, ic]) => `<button class="btn" data-keyadd="action" data-val="${k}">${icon(ic, 15)} ${esc(t(k))}</button>`).join("")}</div>`;
    } else {
      const field = keyForm === "hotkey" ? `<button type="button" class="btn kbd-rec ${keyDraft.hotkey ? "set" : ""}" id="keyRec" dir="ltr">${keyDraft.hotkey ? esc(keyDraft.hotkey.label) : `${icon("keyboard", 15)} ${esc(t("keyRecord"))}`}</button>` : `<input class="text grow" id="keyTarget" name="target" placeholder="${esc(t(keyForm === "command" ? "keyCommandPh" : "keyTextPh"))}" value="${esc(keyDraft.target)}" dir="${keyForm === "command" ? "ltr" : "auto"}" maxlength="${keyForm === "command" ? 500 : 2e3}" autocomplete="off">`;
      body = `<form class="web-form flat" id="keyForm">
      <input class="text" id="keyName" name="name" placeholder="${esc(t("keyName"))}" value="${esc(keyDraft.name)}" dir="auto" maxlength="60" autocomplete="off">
      ${field}
      <button class="btn accent" type="submit">${icon("plus", 14, 2.4)} ${esc(t("add"))}</button>
    </form>`;
    }
    return `<div class="key-form">
    <div class="seg wrap">${kinds.map(([k, ic]) => `<button data-keykind="${k}" class="${keyForm === k ? "on" : ""}">${icon(ic, 14)} ${esc(t(`key${cap(k)}`))}</button>`).join("")}</div>
    ${body}</div>`;
  }
  function recordHotkey(btn) {
    btn.textContent = t("pressKeys");
    btn.classList.add("rec");
    const onKey = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (["Control", "Alt", "Shift", "Meta"].includes(ev.key)) return;
      document.removeEventListener("keydown", onKey, true);
      const mods = (ev.ctrlKey ? 1 : 0) | (ev.altKey ? 2 : 0) | (ev.shiftKey ? 4 : 0) | (ev.metaKey ? 8 : 0);
      if (ev.key === "Escape" && !mods) {
        render(false);
        return;
      }
      const names = [];
      if (ev.ctrlKey) names.push("Ctrl");
      if (ev.altKey) names.push("Alt");
      if (ev.shiftKey) names.push("Shift");
      if (ev.metaKey) names.push("Win");
      let key = /^(Key|Digit)/.test(ev.code || "") ? ev.code.replace(/^(Key|Digit)/, "") : ev.key === " " ? "Space" : ev.key.length === 1 ? ev.key.toUpperCase() : ev.key.replace(/^Arrow/, "");
      if (!key) key = `VK ${ev.keyCode}`;
      if (ev.keyCode > 0 && ev.keyCode < 255) keyDraft.hotkey = { vk: ev.keyCode, mods, label: [...names, key].join("+") };
      render(false);
    };
    document.addEventListener("keydown", onKey, true);
  }
  function pickerHtml() {
    if (!pickerOpen) return "";
    let body;
    if (!installed) body = `<div class="muted pad">${esc(t("loading"))}</div>`;
    else {
      const q = pickerQuery.trim().toLowerCase();
      const list = installed.filter((a) => !q || a.name.toLowerCase().includes(q)).slice(0, 300);
      body = list.length ? `<div class="app-grid">${list.map((a) => {
        const idx = installed.indexOf(a);
        const added = shortcuts.some((s) => s.target === a.target);
        return `<button class="app-pick ${added ? "added" : ""}" data-pick="${idx}" title="${esc(a.target)}" ${added ? "disabled" : ""}>
        <span class="app-pick-ic" data-icon-idx="${idx}">${a.icon ? `<img src="${esc(a.icon)}" alt="">` : `<span class="sc-ph">${esc(a.name[0] || "?")}</span>`}</span>
        <span class="app-pick-name">${esc(a.name)}</span>${added ? `<i>${icon("check", 12, 3)}</i>` : ""}</button>`;
      }).join("")}</div>` : `<div class="muted pad">${esc(t("noResults"))}</div>`;
    }
    return `<div class="picker">
    <div class="city-search"><span class="search-ic">${icon("search", 16)}</span><input class="text big" id="appSearch" placeholder="${esc(t("searchApps"))}" value="${esc(pickerQuery)}" autocomplete="off" dir="auto"></div>
    <div class="picker-body">${body}</div></div>`;
  }
  function webFormHtml() {
    if (!webForm) return "";
    return `<form class="web-form" id="webForm">
    <input class="text" name="name" placeholder="${esc(t("websiteName"))}" dir="auto" required>
    <input class="text" name="url" placeholder="${esc(t("websiteUrl"))}" dir="ltr" required>
    <button class="btn accent" type="submit">${icon("plus", 14, 2.4)} ${esc(t("add"))}</button>
    <button class="btn" type="button" data-cmd="webCancel">${esc(t("cancel"))}</button>
  </form>`;
  }
  var LIMITS = { coin: 8, feed: 6, zone: 5, sublang: 3 };
  function W() {
    const w = S.widgets || {};
    return {
      active: w.active || "crypto",
      crypto: { enabled: true, source: "auto", coins: ["BTC", "ETH", "USDT", "TON"], ...w.crypto || {} },
      news: { enabled: true, feeds: [], custom: [], ...w.news || {} },
      clocks: { enabled: true, zones: ["Europe/London", "America/New_York", "Europe/Paris", "Asia/Tokyo"], ...w.clocks || {} }
    };
  }
  function activeFeeds() {
    const n = W().news;
    return n.feeds && n.feeds.length ? n.feeds : catalog && catalog.defaultFeeds || [];
  }
  function chip(kind, val, label, on, extra = "") {
    return `<button class="chip ${on ? "on" : ""}" data-wchip="${kind}" data-val="${esc(val)}" dir="auto">${on ? icon("check", 12, 3) : ""}<span>${esc(label)}</span>${extra}</button>`;
  }
  function widgetCard(key, ic, body) {
    const w = W()[key];
    return `<div class="card pad-card wcard ${w.enabled === false ? "off" : ""}">
    <div class="card-head"><h3>${icon(ic, 17)} ${esc(t(key))}</h3>${sw(`widgets.${key}.enabled`, w.enabled !== false)}</div>
    <div class="wbody">${body}</div></div>`;
  }
  function limitNote(kind) {
    return `<span class="limit ${flash === kind ? "flash" : ""}">${esc(t("maxReached", { n: num(LIMITS[kind]) }))}</span>`;
  }
  function cryptoSettings() {
    const c = W().crypto;
    const coins = catalog && catalog.coins || c.coins.map((sym) => ({ sym, name: sym }));
    return `<div class="sub-h"><b>${esc(t("coins"))}</b>${limitNote("coin")}</div>
    <div class="chips">${coins.map((co) => chip("coin", co.sym, co.sym, c.coins.includes(co.sym), co.name && co.name !== co.sym ? `<small>${esc(co.name)}</small>` : "")).join("")}</div>`;
  }
  function newsSettings() {
    const n = W().news;
    const sel = activeFeeds();
    const presets = catalog && catalog.feeds || [];
    const mine = lang();
    const sorted = presets.slice().sort((a, b) => (b.lang === mine) - (a.lang === mine));
    const custom = (n.custom || []).map((f) => chip(
      "feed",
      f.id,
      f.name,
      sel.includes(f.id),
      `<i class="chip-x" data-wchip="custom-x" data-val="${esc(f.id)}" title="${esc(t("remove"))}">${icon("x", 11, 2.6)}</i>`
    )).join("");
    return `<div class="sub-h"><b>${esc(t("feeds"))}</b>${limitNote("feed")}</div>
    <div class="chips">${sorted.map((f) => chip("feed", f.id, f.name, sel.includes(f.id))).join("")}${custom}</div>
    <form class="feed-form" id="feedForm">
      <span class="feed-ic">${icon("rss", 15)}</span>
      <input class="text ${feedError ? "bad" : ""}" id="feedUrl" name="url" placeholder="${esc(t("feedUrl"))}" value="${esc(feedDraft)}" autocomplete="off" spellcheck="false" ${feedBusy ? "disabled" : ""}>
      <button class="btn sm accent" type="submit" ${feedBusy ? "disabled" : ""}>${icon(feedBusy ? "loader" : "plus", 14, 2.4, feedBusy ? "spin" : "")} ${esc(t("addFeed"))}</button>
    </form>
    ${feedError ? `<div class="warn">${icon("wifi-off", 15)} ${esc(feedError)}</div>` : ""}`;
  }
  function clockSettings() {
    const z = W().clocks.zones || [];
    const l = lang();
    return `<div class="sub-h"><b>${esc(t("zones"))}</b>${limitNote("zone")}</div>
    <div class="chips">${CLOCK_ZONES.map((tz) => chip("zone", tz, cityName(tz, l), z.includes(tz))).join("")}</div>`;
  }
  var flashTimer = null;
  function flashLimit(kind) {
    flash = kind;
    render(false);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      flash = "";
      render(false);
    }, 900);
  }
  async function toggleChip(kind, val) {
    const w = W();
    const flip = (list, max) => {
      if (list.includes(val)) return list.length > 1 ? list.filter((x) => x !== val) : list;
      if (list.length >= max) {
        flashLimit(kind);
        return null;
      }
      return [...list, val];
    };
    if (kind === "coin") {
      const coins = flip(w.crypto.coins || [], LIMITS.coin);
      if (coins) await save({ widgets: { crypto: { coins } } });
    } else if (kind === "feed") {
      const feeds = flip(activeFeeds(), LIMITS.feed);
      if (feeds) await save({ widgets: { news: { feeds } } });
    } else if (kind === "zone") {
      const zones = flip(w.clocks.zones || [], LIMITS.zone);
      if (zones) await save({ widgets: { clocks: { zones } } });
    } else if (kind === "custom-x") {
      const custom = (w.news.custom || []).filter((f) => f.id !== val);
      let feeds = activeFeeds().filter((x) => x !== val);
      if (!feeds.length) feeds = [];
      await save({ widgets: { news: { custom, feeds } } });
    }
  }
  async function addFeed(raw) {
    let url = String(raw || "").trim();
    feedDraft = url;
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      const u = new URL(url);
      if (!u.hostname.includes(".")) throw new Error("bad");
    } catch (_) {
      feedError = t("feedBad");
      render(false);
      return;
    }
    const w = W();
    if ((w.news.custom || []).some((f) => f.url === url)) {
      feedError = "";
      render(false);
      return;
    }
    if (activeFeeds().length >= LIMITS.feed) {
      flashLimit("feed");
      return;
    }
    feedBusy = true;
    feedError = "";
    render(false);
    let r = null;
    try {
      r = await api.widgets.testFeed(url);
    } catch (_) {
      r = null;
    }
    feedBusy = false;
    if (!r || !r.ok) {
      feedError = t("feedBad");
      render(false);
      return;
    }
    const id = `c-${Date.now().toString(36)}`;
    const name = (r.title || new URL(url).hostname.replace(/^www\./, "")).slice(0, 40);
    feedDraft = "";
    await save({ widgets: { news: { custom: [...w.news.custom || [], { id, name, url }], feeds: [...activeFeeds(), id] } } });
  }
  async function loadCatalog() {
    if (catalog && catalog.lang === lang()) return;
    try {
      catalog = { ...await api.widgets.catalog(), lang: lang() };
    } catch (_) {
      catalog = null;
    }
  }
  var GX = ["fps", "low1", "ft", "cpu", "cpuTemp", "gpu", "gpuTemp", "power", "vram", "ram", "ping", "time", "clock", "battery"];
  var GM_HOTKEYS = ["Control+Shift+G", "Alt+Shift+G", "Control+Shift+F10", "Alt+F10", "Control+Alt+G"];
  var LHM_URL = "https://github.com/LibreHardwareMonitor/LibreHardwareMonitor/releases";
  var RTSS_URL = "https://www.guru3d.com/download/rtss-rivatuner-statistics-server-download/";
  async function loadGameLib(refresh) {
    if (!api.gaming) return;
    gmLibBusy = true;
    try {
      gmLib = await api.gaming.cmd("library", { refresh }) || [];
    } catch (_) {
      gmLib = [];
    }
    gmLibBusy = false;
  }
  function gmLibHtml() {
    if (gmLib === null) return `<p class="muted small">${icon("loader", 14, 2.2, "spin")} \u2026</p>`;
    if (!gmLib.length) return `<p class="muted small top0">${esc(t("gmLibEmpty"))}</p>`;
    return `<div class="gm-libl">${gmLib.map((g) => `<div class="gm-lrow ${g.hidden ? "off" : ""}">
      <span class="gm-lic">${g.icon ? `<img src="${esc(g.icon)}" alt="">` : icon("gamepad-2", 16)}</span>
      <div class="row-text"><div class="row-title ell" dir="auto">${esc(g.name)}</div><div class="row-hint">${esc(t(`gmSrc_${g.source}`))}</div></div>
      ${g.source === "custom" ? `<button class="ib sm" data-gmlib="removeCustom" data-id="${esc(g.id)}" title="${esc(t("remove"))}">${icon("trash-2", 15)}</button>` : ""}
      <button class="btn sm" data-gmlib="${g.hidden ? "unhideGame" : "hideGame"}" data-id="${esc(g.id)}">${icon(g.hidden ? "eye" : "eye-off", 14)} ${esc(t(g.hidden ? "gmShow" : "gmHide"))}</button>
    </div>`).join("")}</div>`;
  }
  function GC() {
    const g = S.gaming || {};
    return { ...g, hud: { metrics: [], ...g.hud || {} }, optimize: { ...g.optimize || {} }, closeList: g.closeList || [], games: g.games || [], ignore: g.ignore || [] };
  }
  var hk = (k) => String(k || "").replace(/Control/g, "Ctrl");
  var gb = (b) => b >= 1073741824 ? `${num((b / 1073741824).toFixed(1))} GB` : `${num(Math.round(b / 1048576))} MB`;
  function dur(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor(sec % 3600 / 60);
    return num(h ? `${h}:${String(m).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}` : `${m}:${String(sec % 60).padStart(2, "0")}`);
  }
  async function loadGaming() {
    if (!api.gaming) return;
    try {
      gm = await api.gaming.get();
    } catch (_) {
      gm = null;
    }
  }
  function gmListChips(list, kind) {
    if (!list.length) return `<span class="muted small">${esc(t("gmCloseEmpty"))}</span>`;
    return list.map((n) => `<span class="chip on gm-chip" dir="ltr">${esc(n)}<button class="chip-x" data-gmrm="${kind}" data-val="${esc(n)}" title="${esc(t("remove"))}">${icon("x", 12, 2.6)}</button></span>`).join("");
  }
  function gmProcsHtml() {
    if (gmProcs === null) return "";
    if (gmProcs === "loading") return `<div class="gm-procs"><span class="muted small">${icon("loader", 14, 2.2, "spin")} \u2026</span></div>`;
    const have = new Set(GC().closeList);
    const rows = gmProcs.filter((p) => !have.has(String(p.name).toLowerCase())).slice(0, 40);
    if (!rows.length) return '<div class="gm-procs"><span class="muted small">\u2014</span></div>';
    return `<div class="gm-procs">${rows.map((p) => `<button class="gm-proc" data-gmadd="closeList" data-val="${esc(String(p.name).toLowerCase())}" title="${esc(p.path || "")}">
      ${icon("plus", 13, 2.6)}<b dir="ltr">${esc(p.name)}</b><span class="muted ell" dir="auto">${esc(p.title || "")}</span><small dir="ltr">${esc(gb(p.mem || 0))}</small></button>`).join("")}</div>`;
  }
  function gmFpsStatus() {
    const f = gm && gm.fps || {};
    if (f.etw === "ok") return ["ok", t("gmEtwOk"), "ETW"];
    if (f.rtss) return ["ok", t("gmEtwRtss"), "RTSS"];
    if (f.etw === "denied") return ["bad", t("gmEtwDenied"), ""];
    if (f.etw === "error" || f.etw === "unavailable" || f.etw === "unsupported") return ["bad", t("gmEtwError"), f.etw];
    return ["wait", t("gmEtwOff"), ""];
  }
  var SRC_NAMES = { lhm: "LibreHardwareMonitor", ohm: "OpenHardwareMonitor", hwinfo: "HWiNFO", nvidia: "NVIDIA", acpi: "ACPI" };
  function gmTempRow(label, temp, src) {
    const m = gm && gm.metrics;
    let cls = "wait";
    let text = m ? t("gmNotFound") : t("gmCheck");
    if (m && src && temp !== null && temp !== void 0) {
      cls = src === "acpi" ? "wait" : "ok";
      text = src === "acpi" ? t("gmApprox") : t("gmFrom", { src: SRC_NAMES[src] || src });
    }
    const val = m && temp !== null && temp !== void 0 ? `<b class="tnum" dir="ltr">${num(GC().temp === "f" ? Math.round(temp * 9 / 5 + 32) : Math.round(temp))}\xB0</b>` : "";
    return `<div class="row"><span class="dot ${cls}"></span><div class="row-text"><div class="row-title">${esc(label)}</div><div class="row-hint">${esc(text)}</div></div><div class="row-ctl">${val}</div></div>`;
  }
  function gmSessionsHtml() {
    const list = gm && gm.sessions || [];
    if (!list.length) return `<p class="muted small top0">${esc(t("gmNoSessions"))}</p>`;
    return `<div class="gm-sess">${list.map((x) => {
      const d = new Date(x.end || x.start);
      const peak = Math.max(x.maxCpuTemp || 0, x.maxGpuTemp || 0);
      return `<div class="gm-srow"><span class="gm-sic">${icon("gamepad-2", 15)}</span>
      <div class="row-text"><div class="row-title ell" dir="auto">${esc(x.title || x.name)}</div><div class="row-hint" dir="ltr">${esc(d.toLocaleString(langInfo(lang()).locale, { dateStyle: "medium", timeStyle: "short" }))}</div></div>
      <div class="gm-sval"><span>${esc(t("gmPlayTime"))}</span><b dir="ltr">${dur(x.dur)}</b></div>
      <div class="gm-sval"><span>${esc(t("gmAvgFps"))}</span><b dir="ltr">${x.avgFps ? num(x.avgFps) : "\u2013"}</b></div>
      <div class="gm-sval"><span>${esc(t("gmLow1"))}</span><b dir="ltr">${x.low1 ? num(x.low1) : "\u2013"}</b></div>
      <div class="gm-sval"><span>${esc(t("gmPeak"))}</span><b dir="ltr">${peak ? `${num(GC().temp === "f" ? Math.round(peak * 9 / 5 + 32) : peak)}\xB0` : "\u2013"}</b></div></div>`;
    }).join("")}</div>`;
  }
  function gmSig(g) {
    if (!g) return "";
    const m = g.metrics || {};
    return JSON.stringify([g.fps, (g.sessions || []).map((x) => x.id), !!g.metrics, m.cpuTempSrc, m.gpuTempSrc, Math.round((m.cpuTemp || 0) / 3), Math.round((m.gpuTemp || 0) / 3), g.optimized, g.rtss]);
  }
  var SUB_LINKS = { subdl: "https://subdl.com/panel/api", opensubtitles: "https://www.opensubtitles.com/en/consumers" };
  function SC() {
    const c = S.subtitles || {};
    const p = c.providers || {};
    return {
      enabled: c.enabled !== false,
      auto: c.auto !== false,
      autoDownload: c.autoDownload !== false,
      dir: c.dir || "",
      nextToVideo: !!c.nextToVideo,
      fixEncoding: c.fixEncoding !== false,
      hi: c.hi || "avoid",
      languages: Array.isArray(c.languages) ? c.languages : [],
      providers: {
        subdl: { on: true, key: "", ...p.subdl || {} },
        opensubtitles: { on: true, key: "", user: "", passEnc: "", ...p.opensubtitles || {} },
        podnapisi: { on: true, ...p.podnapisi || {} }
      }
    };
  }
  function subLangs() {
    const c = SC().languages.filter((x) => import_sub_langs.default.byCode(x));
    if (c.length) return c.slice(0, 3);
    return [.../* @__PURE__ */ new Set([import_sub_langs.default.byCode(lang()) ? lang() : "en", "en"])];
  }
  async function toggleSubLang(code) {
    const cur = subLangs();
    let next;
    if (cur.includes(code)) {
      if (cur.length === 1) return;
      next = cur.filter((x) => x !== code);
    } else {
      if (cur.length >= LIMITS.sublang) {
        flashLimit("sublang");
        return;
      }
      next = [...cur, code];
    }
    await save({ subtitles: { languages: next } });
  }
  function subsTestHtml(id) {
    const r = subsTests[id];
    if (!r) return "";
    if (r.busy) return `<span class="ptest">${icon("loader", 13, 2.4, "spin")}</span>`;
    if (r.ok) {
      const login = r.login === true ? ` \xB7 ${t("subsLoginOk")}` : r.login === false ? ` \xB7 ${t("subsLoginFail")}` : "";
      return `<span class="ptest ok">${icon("check", 13, 3)} ${esc(t("subsTestOk", { n: num(r.count) }))}${esc(login)}</span>`;
    }
    return `<span class="ptest bad" title="${esc(r.detail || "")}">${icon("x", 13, 3)} ${esc(t(`subsErr_${r.code || "other"}`))}</span>`;
  }
  function providerBlock(id, letter, hintKey) {
    const P = SC().providers[id];
    const on = P.on !== false;
    const needsKey = id !== "podnapisi";
    let fields = "";
    if (on && needsKey) {
      fields = `<div class="prov-fields">
      <input class="text mono" data-path="subtitles.providers.${id}.key" value="${esc(P.key || "")}" placeholder="${esc(t("subsApiKey"))}" dir="auto" spellcheck="false" autocomplete="off">
      <button class="btn sm" data-url="${SUB_LINKS[id]}">${icon("external-link", 13)} ${esc(t("subsGetKey"))}</button>
    </div>`;
      if (id === "opensubtitles") {
        const user = subsUserDraft !== null ? subsUserDraft : P.user || "";
        fields += `<div class="prov-fields">
        <input class="text" id="osUser" value="${esc(user)}" placeholder="${esc(t("subsUser"))}" dir="auto" spellcheck="false" autocomplete="off">
        <input class="text" id="osPass" type="password" placeholder="${esc(P.passEnc ? t("subsPassSaved") : t("subsPass"))}" dir="ltr" autocomplete="new-password">
        <button class="btn sm" data-subs="login">${icon("check", 13, 2.6)} ${esc(t("subsSaveLogin"))}</button>
      </div><div class="row-hint prov-note">${esc(t("subsLoginHint"))}</div>`;
      }
    }
    const canTest = on && (!needsKey || String(P.key || "").trim());
    return `<div class="prov ${on ? "" : "off"}">
    <div class="prov-head">
      <span class="prov-logo p-${id}">${letter}</span>
      <div class="row-text"><div class="row-title">${esc(import_sub_langs.default.PROVIDER_NAMES[id])}</div><div class="row-hint">${esc(t(hintKey))}</div></div>
      <div class="row-ctl btn-row">${subsTestHtml(id)}${canTest ? `<button class="btn sm" data-subs="test" data-id="${id}">${esc(t("subsTest"))}</button>` : ""}${sw(`subtitles.providers.${id}.on`, on)}</div>
    </div>
    ${fields}
  </div>`;
  }
  async function loadSubs() {
    try {
      subsDir = await api.subs.cmd("dir") || "";
    } catch (_) {
      subsDir = "";
    }
  }
  function gmGuideHtml() {
    const now = gm && gm.game ? `<div class="gm-now ${gm.fullscreen ? "warn" : "ok"}">${icon(gm.fullscreen ? "triangle-alert" : "circle-check", 15)}<span dir="auto">${esc(t(gm.fullscreen ? "gmGuideNowFs" : "gmGuideNowOk"))}</span></div>` : "";
    return `<div class="card pad-card gm-guide" id="gmGuide">
      <h3>${icon("info", 17)} ${esc(t("gmGuideTitle"))}</h3>
      ${now}
      <ol class="steps">
        <li><span class="step-n">${num(1)}</span><div>${esc(t("gmGuide1"))}</div></li>
        <li><span class="step-n">${num(2)}</span><div>${esc(t("gmGuide2"))}</div></li>
        <li><span class="step-n">${num(3)}</span><div>${esc(t("gmGuide3"))}</div></li>
      </ol>
      <div class="gm-why"><div class="gm-why-t">${icon("shield-check", 16)}<b>${esc(t("gmGuideWhyTitle"))}</b></div><p>${esc(t("gmGuideWhy"))}</p></div>
    </div>`;
  }
  var SECTION_RENDER = {
    welcome() {
      return `<section class="hero">
      ${heroIsland()}
      <h1>${esc(t("welcomeTitle"))}</h1><p>${esc(t("welcomeText"))}</p>
      <div class="card pad-card"><h3>${esc(t("tips"))}</h3><ul class="tips">
        <li>${icon("maximize-2", 16)}<span>${esc(t("tip1"))}</span></li>
        <li>${icon("volume-2", 16)}<span>${esc(t("tip2"))}</span></li>
        <li>${icon("move", 16)}<span>${esc(t("tip3"))}</span></li>
        <li>${icon("keyboard", 16)}<span>${esc(t("tip4"))}<kbd dir="ltr">${esc(S.shortcut || "\u2014")}</kbd></span></li>
      </ul></div>
      <div class="btns center"><button class="btn accent" data-go="tryit">${icon("play", 14, 0, "", true)} ${esc(t("tryit"))}</button>
      <button class="btn" data-go="phoneNav">${icon("smartphone", 15)} ${esc(t("obPhoneTitle"))}</button>
      <button class="btn" data-go="weatherNav">${icon("cloud-sun", 15)} ${esc(t("weatherNav"))}</button></div>
    </section>`;
    },
    appearance() {
      const swatches = ["auto", "#0a84ff", "#30d158", "#ff9f0a", "#ff375f", "#bf5af2", "#64d2ff", "#ffd60a"];
      return `<h2>${esc(t("appearance"))}</h2>
      <div class="card pad-card">
        <h3>${icon("languages", 17)} ${esc(t("language"))}</h3>
        <p class="muted top0">${esc(t("languageHint"))}</p>
        ${langGrid()}
      </div>
      <div class="card pad-card">
        <h3>${icon("sparkles", 17)} ${esc(t("theme"))}</h3>
        <p class="muted top0">${esc(t("themeHint"))}</p>
        <div class="style-pick theme-pick" style="--tp:${(S.transparency || 0) / 100}">
          ${["dark", "glass"].map((th) => `<button class="style-opt ${(S.theme || "dark") === th ? "on" : ""}" data-seg="theme" data-val="${th}">
            <div class="sp-screen wall"><div class="sp-island floating th-${th}"><i></i><i></i></div></div><span>${esc(t(th === "glass" ? "themeGlass" : "themeDark"))}</span></button>`).join("")}
        </div>
        ${row(t("transparency"), t("transparencyHint"), range("transparency", S.transparency || 0, 0, 90, 5, FMT.transparency), "eye")}
      </div>
      <div class="card">
        <div class="style-pick">
          ${["floating", "notch"].map((st) => `<button class="style-opt ${S.style === st ? "on" : ""}" data-seg="style" data-val="${st}">
            <div class="sp-screen"><div class="sp-island ${st}"></div></div><span>${esc(t(st))}</span></button>`).join("")}
        </div>
        ${row(t("scale"), "", range("scale", S.scale, 0.8, 1.3, 0.05, FMT.scale), "maximize-2")}
        ${S.style === "floating" ? row(t("topOffset"), "", range("topOffset", S.topOffset, 0, 40, 1, FMT.topOffset), "arrow-down") : ""}
        ${row(t("accent"), "", `<div class="swatches">${swatches.map((c) => `<button class="swatch ${S.accent === c ? "on" : ""} ${c === "auto" ? "auto" : ""}" data-seg="accent" data-val="${c}" title="${c === "auto" ? esc(t("auto")) : c}" style="${c === "auto" ? "" : `--c:${c}`}"></button>`).join("")}</div>`, "sun")}
      </div>
      <div class="card">
        ${row(t("glow"), t("glowHint"), sw("glow", S.glow), "sparkles")}
        ${row(t("edgeLight"), t("edgeLightHint"), sw("edgeLight", S.edgeLight), "zap")}
        ${row(t("blinkHello"), t("blinkHelloHint"), sw("blink.hello", !S.blink || S.blink.hello !== false), "sparkles")}
        ${row(t("blinkIdle"), t("blinkIdleHint"), sw("blink.peeks", !!(S.blink && S.blink.peeks)), "eye")}
        ${row(t("blinkEvents"), t("blinkEventsHint"), sw("blink.events", !S.blink || S.blink.events !== false), "zap")}
        ${row(t("idleClock"), t("idleClockHint"), sw("idleClock", S.idleClock), "timer")}
        ${row(t("compactInfo"), t("compactInfoHint"), sw("media.compactInfo", !S.media || S.media.compactInfo !== false), "music")}
      </div>`;
    },
    modules() {
      const mods = [
        ["media", "music"],
        ["visualizer", "activity"],
        ["notifications", "bell"],
        ["phoneCalls", "phone-incoming"],
        ["weather", "cloud-sun"],
        ["volumeHud", "volume-2"],
        ["battery", "battery-charging"],
        ["capsLock", "arrow-big-up"],
        ["numLock", "hash"],
        ["clipboard", "clipboard"],
        ["privacy", "mic"],
        ["stats", "cpu"],
        ["shelf", "folder-open"],
        ["timer", "hourglass"],
        ["widgets", "bitcoin"]
      ];
      return `<h2>${esc(t("modules"))}</h2><div class="card grid2">${mods.map(([k, ic]) => `<div class="mod ${S.modules[k] ? "on" : ""}">
      <span class="mod-ic">${icon(ic, 18)}</span><div class="row-text"><div class="row-title">${esc(t(`m_${k}`))}</div><div class="row-hint">${esc(t(`m_${k}_d`))}</div></div>${sw(`modules.${k}`, S.modules[k])}</div>`).join("")}</div>`;
    },
    notificationsNav() {
      return `<h2>${esc(t("notificationsNav"))}</h2>
      <div class="card">
        ${row(t("notifDuration"), "", range("notifications.duration", S.notifications.duration, 2, 15, 1, FMT["notifications.duration"]), "timer")}
        ${row(t("showBody"), t("showBodyHint"), sw("notifications.showBody", S.notifications.showBody), "message-circle")}
        ${row(t("respectDnd"), "", sw("respectDnd", S.respectDnd), "moon")}
        ${row(t("callsOverFullscreen"), "", sw("callsOverFullscreen", S.callsOverFullscreen), "phone-incoming")}
        ${row(t("blocked"), t("blockedHint"), `<input class="text" id="blocked" value="${esc((S.notifications.blocked || []).join(", "))}" dir="ltr">`, "bell-off")}
      </div>
      <div class="card pad-card"><h3>${icon("smartphone", 17)} ${esc(t("plTitle"))}</h3>
        <p class="muted top0">${esc(t("plText"))}</p>
        <div class="btns"><button class="btn" data-action="phonelink">${icon("smartphone", 15)} ${esc(t("openPhoneLink"))}</button>
        <button class="btn" data-action="winsettings-notif">${icon("settings", 15)} ${esc(t("openNotifSettings"))}</button>
        <button class="btn" data-go="phoneNav">${icon("link", 15)} ${esc(t("phoneEnable"))}</button></div>
      </div>`;
    },
    phoneNav() {
      const on = S.phone && S.phone.enabled;
      const st = statusData && statusData.helper && statusData.helper.phone;
      const failed = on && st && st.ok === false && st.detail && st.detail !== "off";
      return `<h2>${esc(t("phoneNav"))}</h2>
      <div class="card">
        ${row(t("phoneEnable"), t("phoneEnableHint"), sw("phone.enabled", on), "smartphone")}
        ${failed ? `<div class="warn">${icon("shield", 15)} ${esc(t("phoneServiceOff"))} <span dir="ltr" class="muted">${esc(st.detail)}</span></div>` : ""}
      </div>
      ${on ? deviceList() : ""}
      ${on ? phoneFeatures() : ""}
      ${on ? commandsCard() : ""}
      <div class="card pad-card"><h3>${icon("list", 17)} ${esc(t("phoneHow"))}</h3>${phoneSteps()}</div>
      <div class="btns"><button class="btn" data-test="pair">${icon("link", 15)} ${esc(t("t_pair"))}</button>
      <button class="btn" data-go="notificationsNav">${icon("smartphone", 15)} ${esc(t("plTitle"))}</button></div>`;
    },
    shortcutsNav() {
      return `<h2>${esc(t("shortcutsTitle"))}</h2>
      <p class="muted top0">${esc(t("shortcutsText"))}</p>
      <div class="card">${row(t("deckSize"), "", seg("deck.size", S.deck && S.deck.size || "m", [["s", t("sizeS")], ["m", t("sizeM")], ["l", t("sizeL")]]), "layout-grid")}</div>
      <div class="card">${shortcutList()}</div>
      <div class="btns">
        <button class="btn ${keyForm ? "on" : ""}" data-cmd="keyform">${icon("keyboard", 15)} ${esc(t("addKey"))}</button>
        <button class="btn ${pickerOpen ? "on" : "accent"}" data-cmd="picker">${icon("app-window", 15)} ${esc(t("addFromApps"))}</button>
        <button class="btn" data-cmd="browse">${icon("folder-open", 15)} ${esc(t("browseFile"))}</button>
        <button class="btn ${webForm ? "on" : ""}" data-cmd="web">${icon("globe", 15)} ${esc(t("addWebsite"))}</button>
      </div>
      ${keyFormHtml()}
      ${webFormHtml()}
      ${pickerHtml()}`;
    },
    subtitlesNav() {
      const C = SC();
      const chosen = subLangs();
      const custom = !!C.dir;
      return `<h2>${esc(t("subtitlesTitle"))}</h2>
      <p class="muted top0">${esc(t("subtitlesText"))}</p>
      <div class="card">
        ${row(t("subsEnable"), t("subsEnableHint"), sw("subtitles.enabled", C.enabled), "captions")}
        ${C.enabled ? row(t("subsAuto"), t("subsAutoHint"), sw("subtitles.auto", C.auto), "search") : ""}
        ${C.enabled && C.auto ? row(t("subsAutoDl"), t("subsAutoDlHint"), sw("subtitles.autoDownload", C.autoDownload), "download", "sub") : ""}
      </div>
      <div class="wcards ${C.enabled ? "" : "off"}">
      <div class="card pad-card">
        <div class="sub-h top0"><b>${icon("languages", 16)} ${esc(t("subsLangs"))}</b>${limitNote("sublang")}</div>
        <p class="muted top0">${esc(t("subsLangsHint"))}</p>
        <div class="chips">${import_sub_langs.default.LANGS.map((l) => {
        const i = chosen.indexOf(l.code);
        return `<button class="chip ${i >= 0 ? "on" : ""}" data-sublang="${l.code}">${i >= 0 ? `<b class="ord">${num(i + 1)}</b>` : ""}<span>${esc(l.name)}</span>${l.name !== l.english ? `<small>${esc(l.english)}</small>` : ""}</button>`;
      }).join("")}</div>
      </div>
      <div class="card">
        <div class="row"><span class="row-ic">${icon("folder-open", 18)}</span>
          <div class="row-text"><div class="row-title">${esc(t("subsFolder"))}</div><div class="row-hint ell" dir="ltr">${esc(subsDir)}</div></div>
          <div class="row-ctl btn-row"><button class="btn sm" data-subs="openDir">${esc(t("openFolder"))}</button><button class="btn sm" data-subs="pickDir">${esc(t("change"))}</button>${custom ? `<button class="btn sm" data-subs="resetDir" title="${esc(t("subsDefaultFolder"))}">${icon("rotate-ccw", 13)}</button>` : ""}</div></div>
        ${row(t("subsNextToVideo"), t("subsNextToVideoHint"), sw("subtitles.nextToVideo", C.nextToVideo), "file-down")}
        ${row(t("subsFixEnc"), t("subsFixEncHint"), sw("subtitles.fixEncoding", C.fixEncoding), "languages")}
        ${row(t("subsHi"), "", seg("subtitles.hi", C.hi, [["avoid", t("subsHiAvoid")], ["any", t("subsHiAny")], ["prefer", t("subsHiPrefer")]]), "ear")}
      </div>
      <div class="card pad-card">
        <h3>${icon("globe", 17)} ${esc(t("subsSources"))}</h3>
        <p class="muted top0">${esc(t("subsSourcesHint"))}</p>
        ${providerBlock("subdl", "S", "subsSubdlHint")}
        ${providerBlock("opensubtitles", "O", "subsOsHint")}
        ${providerBlock("podnapisi", "P", "subsPodHint")}
      </div>
      </div>
      <div class="card pad-card"><h3>${icon("list", 17)} ${esc(t("subsHow"))}</h3>
        <ol class="steps">
          <li><span class="step-n">${num(1)}</span><div>${esc(t("subsHow1"))}</div></li>
          <li><span class="step-n">${num(2)}</span><div>${esc(t("subsHow2"))}</div></li>
          <li><span class="step-n">${num(3)}</span><div>${esc(t("subsHow3"))}</div></li>
        </ol></div>
      <div class="btns"><button class="btn" data-test="subs">${icon("captions", 15)} ${esc(t("t_subs"))}</button></div>`;
    },
    gamingNav() {
      if (gmLib === null && !gmLibBusy) loadGameLib(false).then(() => {
        if (section === "gamingNav") render(false);
      });
      const G = GC();
      const H = G.hud;
      const O = G.optimize;
      const [fcls, ftext, fsrc] = gmFpsStatus();
      const m = gm && gm.metrics || {};
      const needAllow = gm && gm.fps && gm.fps.etw === "denied";
      return `<h2>${esc(t("gmTitle"))}</h2>
      <p class="muted top0">${esc(t("gamingText"))}</p>
      <div class="card">
        ${row(t("gmEnable"), t("gmEnableHint"), sw("gaming.enabled", G.enabled), "gamepad-2")}
        ${G.enabled ? row(t("gmAuto"), t("gmAutoHint"), sw("gaming.auto", G.auto), "radar") : ""}
        ${G.enabled ? row(t("gmAutoOpt"), "", sw("gaming.autoOptimize", G.autoOptimize), "rocket", "sub") : ""}
        ${G.enabled ? row(t("gmRestore"), "", sw("gaming.restoreOnExit", G.restoreOnExit), "undo-2", "sub") : ""}
        ${G.enabled ? row(t("gmQuiet"), t("gmQuietHint"), sw("gaming.quiet", G.quiet), "eye-off") : ""}
      </div>
      ${G.enabled ? gmGuideHtml() : ""}
      <div class="wcards ${G.enabled ? "" : "off"}">
      <div class="card pad-card">
        <h3>${icon("gauge", 17)} ${esc(t("gmBarSection"))}</h3>
        ${row(t("gmBarEnable"), "", sw("gaming.hud.enabled", H.enabled), "eye")}
        ${row(t("gmEngine"), "", seg("gaming.hud.engine", H.engine || "auto", [["auto", t("gmEngAuto")], ["window", t("gmEngWindow")], ["rtss", t("gmEngRtss")]]), "layers")}
        <p class="muted small gm-note top0">${icon("layers", 14)}<span>${esc(t("gmEngHint"))}</span></p>
        ${(H.engine || "auto") !== "window" ? (() => {
        const r = gm && gm.rtss || {};
        const cls = r.running ? "ok" : r.installed ? "wait" : "bad";
        const txt = r.running ? t("gmRtssRunning") : r.installed ? t("gmRtssInstalled") : t("gmRtssNotInstalled");
        return `<div class="row"><span class="dot ${cls}"></span><div class="row-text"><div class="row-title">${esc(t("gmRtss"))}</div><div class="row-hint">${esc(txt)}</div></div>
            <div class="row-ctl">${r.installed ? "" : `<button class="btn sm accent" data-url="${RTSS_URL}">${icon("external-link", 14)} ${esc(t("gmGetRtss"))}</button>`}</div></div>
            <p class="muted small gm-note">${icon("info", 14)}<span>${esc(t("gmRtssHint"))}</span></p>`;
      })() : ""}
        ${row(t("gmBarShow"), "", seg("gaming.hud.show", H.show, [["game", t("gmBarGame")], ["always", t("gmBarAlways")]]), "monitor")}
        ${row(t("gmPos"), "", seg("gaming.hud.position", H.position, (dir() === "rtl" ? (a) => a.reverse() : (a) => a)([["left", t("gmLeft")], ["center", t("gmCenter")], ["right", t("gmRight")]])), "move")}
        ${row(t("gmSize"), "", seg("gaming.hud.size", H.size, [["s", t("gmSmall")], ["m", t("gmMedium")], ["l", t("gmLarge")]]), "layout-grid")}
        ${row(t("gmOpacity"), "", range("gaming.hud.opacity", H.opacity, 30, 100, 5, FMT["gaming.hud.opacity"]), "sun")}
        ${row(t("unit"), "", seg("gaming.temp", G.temp, [["c", "\xB0C"], ["f", "\xB0F"]]), "thermometer")}
        <div class="row"><span class="row-ic">${icon("keyboard", 18)}</span><div class="row-text"><div class="row-title">${esc(t("gmHotkey"))}</div></div>
          <div class="row-ctl"><select id="gmHotkey" class="text" dir="ltr">${[...GM_HOTKEYS, ""].map((k) => `<option value="${esc(k)}" ${k === (H.hotkey || "") ? "selected" : ""}>${esc(k ? hk(k) : t("gmNoHotkey"))}</option>`).join("")}</select></div></div>
        <div class="sub-h">${esc(t("gmMetrics"))}</div>
        <div class="chips">${GX.map((k) => `<button class="chip ${H.metrics.includes(k) ? "on" : ""}" data-gmmetric="${k}">${H.metrics.includes(k) ? icon("check", 12, 3) : ""}<span>${esc(t(`gx_${k}`))}</span></button>`).join("")}</div>
        ${H.metrics.includes("ping") ? `<div class="row top8"><span class="row-ic">${icon("radar", 18)}</span><div class="row-text"><div class="row-title">${esc(t("gmPingHost"))}</div><div class="row-hint">${esc(t("gmPingHint"))}</div></div>
          <div class="row-ctl"><input id="gmPing" class="text mono" data-path="gaming.pingHost" value="${esc(G.pingHost || "")}" dir="ltr" spellcheck="false" placeholder="8.8.8.8"></div></div>` : ""}
        ${(H.engine || "auto") === "window" ? `<p class="muted small gm-note">${icon("triangle-alert", 14)}<span>${esc(t("gmBarHint"))}</span></p>` : ""}
      </div>
      <div class="card pad-card">
        <h3>${icon("rocket", 17)} ${esc(t("gmOptSection"))}</h3>
        ${row(t("gmStep_power"), t("gmOptPowerHint"), sw("gaming.optimize.power", O.power), "zap")}
        ${row(t("gmStep_gameMode"), "", sw("gaming.optimize.gameMode", O.gameMode), "gamepad-2")}
        ${row(t("gmStep_memory"), t("gmOptMemHint"), sw("gaming.optimize.memory", O.memory), "cpu")}
        ${row(t("gmStep_priority"), "", seg("gaming.optimize.priority", O.priority, [["normal", t("gmPrioNormal")], ["above", t("gmPrioAbove")], ["high", t("gmPrioHigh")]]), "trending-up")}
        ${row(t("gmOptDvr"), "", sw("gaming.optimize.dvr", O.dvr), "video")}
        ${row(t("gmStep_close"), "", sw("gaming.optimize.closeApps", O.closeApps), "app-window")}
        ${O.closeApps ? `<div class="gm-box">
          <div class="sub-h top0">${esc(t("gmCloseList"))}</div>
          <div class="chips">${gmListChips(G.closeList, "closeList")}</div>
          <div class="btns top8"><button class="btn sm ${gmProcs !== null ? "on" : ""}" data-gm="procs">${icon("list", 14)} ${esc(t("gmRunning"))}</button></div>
          ${gmProcsHtml()}
          ${row(t("gmForce"), "", sw("gaming.forceClose", G.forceClose), "", "sub")}
          ${row(t("gmReopen"), "", sw("gaming.reopen", G.reopen), "", "sub")}
        </div>` : ""}
        <p class="muted small gm-note">${icon("shield-check", 14)}<span>${esc(t("gmEverywhere"))}</span></p>
      </div>
      <div class="card pad-card">
        <h3>${icon("library", 17)} ${esc(t("gmLibrary"))}</h3>
        <p class="muted top0">${esc(t("gmLibHint"))}</p>
        ${row(t("gmOptLaunch"), "", sw("gaming.optimizeOnLaunch", G.optimizeOnLaunch !== false), "rocket")}
        <div class="btns top8"><button class="btn sm" data-gmlib="addGame">${icon("plus", 14)} ${esc(t("gmAddGame"))}</button>
          <button class="btn sm" data-gmlib="rescan" ${gmLibBusy ? "disabled" : ""}>${icon("refresh-cw", 14, 2.2, gmLibBusy ? "spin" : "")} ${esc(t("gmRescan"))}</button></div>
        ${gmLibHtml()}
      </div>
      <div class="card pad-card">
        <h3>${icon("gamepad-2", 17)} ${esc(t("gmGames"))}</h3>
        <p class="muted top0">${esc(t("gmGamesHint"))}</p>
        <div class="chips">${gmListChips(G.games, "games")}</div>
        <form class="inline-form top8" data-gmform="games"><input class="text mono" name="exe" placeholder="eldenring.exe" aria-label="${esc(t("gmExeName"))}" dir="ltr" spellcheck="false"><button class="btn sm" type="submit">${icon("plus", 14)} ${esc(t("add"))}</button></form>
        <div class="sub-h">${esc(t("gmIgnore"))}</div>
        <div class="chips">${gmListChips(G.ignore, "ignore")}</div>
        <form class="inline-form top8" data-gmform="ignore"><input class="text mono" name="exe" placeholder="launcher.exe" aria-label="${esc(t("gmExeName"))}" dir="ltr" spellcheck="false"><button class="btn sm" type="submit">${icon("plus", 14)} ${esc(t("add"))}</button></form>
      </div>
      <div class="card pad-card">
        <h3>${icon("activity", 17)} ${esc(t("gmSensors"))}</h3>
        <div class="row"><span class="dot ${fcls}"></span><div class="row-text"><div class="row-title">${esc(t("gmFpsCounter"))}</div><div class="row-hint">${esc(ftext)}${fsrc ? ` \xB7 ${esc(fsrc)}` : ""}${gmAllow ? ` \xB7 ${esc(t(gmAllow.ok ? "gmSignOut" : "gmAllowFail"))}` : ""}</div></div>
          <div class="row-ctl">${needAllow ? `<button class="btn sm accent" data-gm="allowFps">${icon("shield-check", 14)} ${esc(t("gmAllow"))}</button>` : `<span class="badge ${fcls}">${fcls === "ok" ? esc(t("ok")) : "\u2014"}</span>`}</div></div>
        ${needAllow ? `<p class="muted small">${esc(t("gmAllowHint"))}</p>` : ""}
        ${gmTempRow(t("gmCpuTemp"), m.cpuTemp, m.cpuTempSrc)}
        ${gmTempRow(t("gmGpuTemp"), m.gpuTemp, m.gpuTempSrc)}
        ${!m.cpuTempSrc || m.cpuTempSrc === "acpi" ? `<p class="muted small">${esc(t("gmTempHint"))}</p><div class="btns"><button class="btn sm" data-url="${LHM_URL}">${icon("external-link", 14)} ${esc(t("gmGetLhm"))}</button></div>` : ""}
      </div>
      <div class="card pad-card">
        <div class="sub-h top0"><b>${icon("history", 16)} ${esc(t("gmSessions"))}</b>${gm && gm.sessions && gm.sessions.length ? `<button class="link" data-gm="clearSessions">${esc(t("clearAll"))}</button>` : ""}</div>
        ${gmSessionsHtml()}
      </div>
      </div>
      <div class="btns"><button class="btn" data-test="gaming">${icon("trophy", 15)} ${esc(t("t_gaming"))}</button></div>`;
    },
    widgetsNav() {
      const on = S.modules.widgets !== false;
      return `<h2>${esc(t("widgetsNav"))}</h2>
      <p class="muted top0">${esc(t("widgetsText"))}</p>
      <div class="card">${row(t("m_widgets"), t("m_widgets_d"), sw("modules.widgets", on), "layout-grid")}</div>
      <div class="wcards ${on ? "" : "off"}">
        ${widgetCard("crypto", "bitcoin", cryptoSettings())}
        ${widgetCard("news", "newspaper", newsSettings())}
        ${widgetCard("clocks", "globe", clockSettings())}
      </div>`;
    },
    weatherNav() {
      const w = S.weather || {};
      return `<h2>${esc(t("weatherNav"))}</h2>
      <div class="card">
        ${row(t("m_weather"), t("m_weather_d"), sw("modules.weather", S.modules.weather), "cloud-sun")}
        ${row(t("unit"), "", seg("weather.unit", w.unit || "c", [["c", t("celsius")], ["f", t("fahrenheit")]]), "thermometer")}
      </div>
      <div class="card pad-card">
        <h3>${icon("map-pin", 17)} ${esc(t("city"))}</h3>
        ${w.city ? `<div class="city-sel">${selectedCity()}${weatherPreview()}</div>` : ""}
        ${citySearchBox()}
        <p class="muted small">${esc(t("weatherSource"))}</p>
      </div>`;
    },
    behavior() {
      return `<h2>${esc(t("behavior"))}</h2>
      <div class="card">
        ${row(t("movable"), t("movableHint"), sw("movable", S.movable), "move")}
        ${S.position ? row(t("resetPosition"), "", `<button class="btn sm" data-cmd="resetPos">${icon("rotate-ccw", 14)} ${esc(t("resetPosition"))}</button>`, "grip-horizontal") : ""}
        ${row(t("minimized"), t("minimizedHint"), sw("minimized", S.minimized), "minimize-2")}
        ${row(t("hidden"), t("hiddenHint"), sw("hidden", S.hidden), "eye-off")}
      </div>
      <div class="card">
        ${row(t("startWithWindows"), "", sw("startWithWindows", S.startWithWindows), "monitor")}
        ${row(t("hideInFullscreen"), "", sw("hideInFullscreen", S.hideInFullscreen), "maximize-2")}
        ${row(t("sound"), "", sw("sound", S.sound), "alarm-clock")}
        ${row(t("shortcut"), t("shortcutHint"), `<button class="kbd-input" id="shortcut" dir="ltr">${esc(S.shortcut || "\u2014")}</button>`, "keyboard")}
        ${row(t("display"), "", `<select id="display" class="text">${[["primary", t("primary")], ...displays.filter((d) => !d.primary).map((d) => [d.id, `${d.label} (${d.size})`])].map(([v, l]) => `<option value="${esc(v)}" ${String(S.display) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`, "monitor")}
      </div>
      <div class="btns">
      <button class="btn" data-cmd="reset">${icon("rotate-ccw", 15)} ${esc(t("reset"))}</button>
      <button class="btn danger" data-cmd="quit">${icon("x", 15)} ${esc(t("quit"))}</button></div>`;
    },
    tryit() {
      const tests = [
        ["blink", "eye"],
        ["music", "music"],
        ["video", "video"],
        ["message", "message-circle"],
        ["call", "phone-incoming"],
        ["weather", "cloud-sun"],
        ["pair", "link"],
        ["timer", "hourglass"],
        ["stopwatch", "timer"],
        ["charging", "battery-charging"],
        ["volume", "volume-2"],
        ["caps", "arrow-big-up"],
        ["copied", "clipboard-check"],
        ["privacy", "mic"],
        ["reminder", "calendar-check"],
        ["subs", "captions"],
        ["gaming", "trophy"],
        ["dashboard", "layout-grid"]
      ];
      return `<h2>${esc(t("tryit"))}</h2><p class="muted top0">${esc(t("tryText"))}</p>
      <div class="tests">${tests.map(([k, ic]) => `<button class="test" data-test="${k}">${icon(ic, 22)}<span>${esc(t(`t_${k}`))}</span></button>`).join("")}</div>`;
    },
    status() {
      const st = statusData && statusData.helper || {};
      const mods = [["core", "core"], ["media", "mediaMod"], ["audio", "audio"], ["system", "system"], ["notifications", "notifs"], ["uia", "uia"], ["phone", "phoneMod"], ["bluetooth", "btMod"], ["weather", "weatherMod"]];
      return `<h2>${esc(t("status"))}</h2>
      <div class="card">${mods.map(([k, label]) => {
        const m = st[k];
        const off = m && m.detail === "off";
        const cls = !m ? "wait" : off ? "wait" : m.ok ? "ok" : "bad";
        return `<div class="row"><span class="dot ${cls}"></span><div class="row-text"><div class="row-title">${esc(t(label))}</div><div class="row-hint ell" dir="ltr">${esc(m ? m.detail : "")}</div></div><div class="row-ctl"><span class="badge ${cls}">${esc(!m ? t("waiting") : off ? "\u2014" : m.ok ? t("ok") : t("fail"))}</span></div></div>`;
      }).join("")}</div>
      <p class="muted">${esc(t("statusHint"))}</p>
      <div class="btns"><button class="btn" data-cmd="restart">${icon("rotate-cw", 15)} ${esc(t("restartHelper"))}</button>
      <button class="btn" data-cmd="logs">${icon("folder-open", 15)} ${esc(t("openLogs"))}</button></div>
      ${statusData ? `<p class="muted small" dir="ltr">v${esc(statusData.version)} \xB7 Electron ${esc(statusData.electron)} \xB7 ${esc(statusData.platform)}</p>` : ""}`;
    },
    support() {
      return `<section class="hero support">
      <div class="support-ic">${icon("heart", 40, 2, "", true)}</div>
      <h1>${esc(t("supportTitle"))}</h1><p>${esc(t("supportText"))}</p>
      <div class="btns"><button class="btn accent big" data-url="${import_links.default.DONATE}">${icon("heart", 16, 2.2)} ${esc(t("donateCrypto"))}</button></div>
      <p class="muted small" dir="ltr">BTC \xB7 USDT (TRC20, BEP20) \xB7 SOL</p>
    </section>
    <p class="muted">${esc(t("supportFree"))}</p>
    <div class="btns"><button class="btn" data-url="${import_links.default.REPO}">${icon("star", 15)} ${esc(t("starGithub"))}</button>
      <button class="btn" data-url="${import_links.default.ISSUES}">${icon("bug", 15)} ${esc(t("reportBug"))}</button></div>`;
    },
    about() {
      return `<section class="hero about">
      ${heroIsland(true)}
      <h1 class="bk-wordmark">Blinkelo</h1><p class="bk-tagline">${esc(t("blinkTagline"))}</p><p>${esc(t("aboutText"))}</p>
      <div class="btns"><button class="btn" data-go="support">${icon("heart", 15)} ${esc(t("supportTitle"))}</button>
      <button class="btn" data-url="${import_links.default.REPO}">${icon("star", 15)} ${esc(t("starGithub"))}</button></div>
      <p class="muted" dir="ltr">\xA9 SaeedSH \xB7 ${esc(statusData ? `v${statusData.version}` : "")}</p>
      <p class="muted small" dir="ltr">Inter font (OFL) \xB7 Lucide icons (ISC) \xB7 KDE Connect protocol (GPL apps, open protocol) \xB7 Open-Meteo</p>
    </section>`;
    }
  };
  var OB_STEPS = ["lang", "city", "phone", "done"];
  function obDots() {
    return `<div class="ob-dots">${OB_STEPS.map((_, i) => `<i class="${i === obStep ? "on" : ""} ${i < obStep ? "past" : ""}"></i>`).join("")}</div>`;
  }
  function renderOnboarding() {
    const step = OB_STEPS[obStep];
    let body = "";
    let nav = "";
    if (step === "lang") {
      body = `<div class="ob-hero">${heroIsland()}</div>
      <h1>${esc(t("chooseLanguage"))}</h1><p class="muted">${esc(t("chooseLanguageText"))}</p>${langGrid(true)}`;
      nav = `<span></span><button class="btn accent big" data-ob="next">${esc(t("next"))} ${icon(dir() === "rtl" ? "arrow-left" : "arrow-right", 16, 2.4)}</button>`;
    } else if (step === "city") {
      body = `<div class="ob-icon wx">${icon("cloud-sun", 40, 1.6)}</div>
      <h1>${esc(t("obCityTitle"))}</h1><p class="muted">${esc(t("obCityText"))}</p>
      <div class="ob-city">${S.weather && S.weather.city ? `<div class="city-sel">${selectedCity()}${weatherPreview()}</div>` : ""}${citySearchBox()}</div>`;
      nav = `<button class="btn ghost" data-ob="back">${esc(t("back"))}</button><div class="btns tight"><button class="btn ghost" data-ob="skip">${esc(t("skip"))}</button><button class="btn accent big" data-ob="next">${esc(t("next"))} ${icon(dir() === "rtl" ? "arrow-left" : "arrow-right", 16, 2.4)}</button></div>`;
    } else if (step === "phone") {
      const paired = (phone.devices || []).filter((d) => d.paired || d.pairState !== "none" || d.connected);
      body = `<div class="ob-icon ph">${icon("smartphone", 40, 1.6)}</div>
      <h1>${esc(t("obPhoneTitle"))}</h1><p class="muted">${esc(t("obPhoneText"))}</p>
      <div class="card pad-card ob-card">${phoneSteps()}</div>
      ${S.phone && S.phone.enabled && paired.length ? `<div class="card ob-card">${paired.map(deviceRow).join("")}</div>` : ""}`;
      nav = `<button class="btn ghost" data-ob="back">${esc(t("back"))}</button><div class="btns tight"><button class="btn ghost" data-ob="skip">${esc(t("skip"))}</button><button class="btn accent big" data-ob="next">${esc(t("next"))} ${icon(dir() === "rtl" ? "arrow-left" : "arrow-right", 16, 2.4)}</button></div>`;
    } else {
      body = `<div class="ob-icon done">${icon("check", 42, 2.4)}</div>
      <h1>${esc(t("obDoneTitle"))}</h1><p class="muted">${esc(t("obDoneText"))}</p>
      <div class="card pad-card ob-card"><ul class="tips">
        <li>${icon("maximize-2", 16)}<span>${esc(t("tip1"))}</span></li>
        <li>${icon("volume-2", 16)}<span>${esc(t("tip2"))}</span></li>
        <li>${icon("move", 16)}<span>${esc(t("tip3"))}</span></li>
      </ul></div>`;
      nav = `<button class="btn ghost" data-ob="back">${esc(t("back"))}</button><button class="btn accent big" data-ob="finish">${icon("sparkles", 15)} ${esc(t("finish"))}</button>`;
    }
    return `<div class="ob" data-step="${step}">${obDots()}<div class="ob-body">${body}</div><div class="ob-nav">${nav}</div></div>`;
  }
  async function obGo(action) {
    if (action === "next" || action === "skip") {
      if (obStep === 0 && !S.onboarded) await save({ onboarded: true }, false);
      obStep = Math.min(OB_STEPS.length - 1, obStep + 1);
      cityResults = null;
    } else if (action === "back") {
      obStep = Math.max(0, obStep - 1);
    } else if (action === "finish") {
      onboarding = false;
      section = "welcome";
      if (!S.onboarded) await save({ onboarded: true }, false);
      api.test("dashboard");
    }
    render();
  }
  var lastRenderKey = "";
  function render(full = true) {
    document.documentElement.lang = lang();
    document.documentElement.dir = dir();
    document.body.dataset.lang = lang();
    document.body.classList.toggle("onboarding", onboarding);
    document.body.classList.toggle("theme-glass", !!S && S.theme === "glass");
    if (S) document.documentElement.style.setProperty("--tp", String((Number(S.transparency) || 0) / 100));
    const nav = document.getElementById("nav");
    const main = document.getElementById("main");
    const active = document.activeElement;
    const focusId = active && active.id && main.contains(active) ? active.id : null;
    const caret = focusId && active.selectionStart !== void 0 ? [active.selectionStart, active.selectionEnd] : null;
    const scroll = main.scrollTop;
    const pickerScroll = main.querySelector(".picker-body") ? main.querySelector(".picker-body").scrollTop : 0;
    nav.innerHTML = onboarding ? "" : SECTIONS.map(([k, ic]) => `<button class="nav-btn ${k === section ? "on" : ""}" data-go="${k}">${icon(ic, 17)}<span>${esc(t(k))}</span></button>`).join("");
    main.innerHTML = onboarding ? renderOnboarding() : `<div class="page">${SECTION_RENDER[section]()}</div>`;
    const key = onboarding ? `ob${obStep}` : section;
    if (!full || key === lastRenderKey) {
      main.scrollTop = scroll;
      const pb = main.querySelector(".picker-body");
      if (pb) pb.scrollTop = pickerScroll;
    } else {
      main.scrollTop = 0;
      main.firstElementChild.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    const firstShow = key !== lastRenderKey;
    lastRenderKey = key;
    wireFaces(firstShow);
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.focus();
        if (caret && el.setSelectionRange) try {
          el.setSelectionRange(caret[0], caret[1]);
        } catch (_) {
        }
      }
    }
    loadPickerIcons();
  }
  function setPath(path, value) {
    const parts = path.split(".");
    const patch = {};
    let cur = patch;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) cur[p] = value;
      else {
        cur[p] = {};
        cur = cur[p];
      }
    });
    return patch;
  }
  async function loadPhone() {
    try {
      phone = await api.phone.get() || { me: null, devices: [] };
    } catch (_) {
    }
    try {
      downloadDir = await api.phone.cmd("downloadDir") || "";
    } catch (_) {
      downloadDir = "";
    }
  }
  async function loadShortcuts() {
    try {
      shortcuts = await api.shortcuts.get() || [];
    } catch (_) {
      shortcuts = [];
    }
  }
  async function loadWeather() {
    try {
      wx = await api.weather.get();
    } catch (_) {
      wx = null;
    }
  }
  async function loadInstalled(force = false) {
    installed = null;
    render(false);
    try {
      installed = await api.shortcuts.installed(force) || [];
    } catch (_) {
      installed = [];
    }
    render(false);
  }
  var iconObserver = null;
  var iconQueue = /* @__PURE__ */ new Set();
  function loadPickerIcons() {
    if (!pickerOpen || !installed) return;
    if (iconObserver) iconObserver.disconnect();
    const root = document.querySelector(".picker-body");
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
    }, { root, rootMargin: "120px" });
    root.querySelectorAll("[data-icon-idx]").forEach((el) => {
      if (!installed[Number(el.dataset.iconIdx)].icon) iconObserver.observe(el);
    });
  }
  var cityTimer = null;
  var citySeq = 0;
  function searchCity(q) {
    cityQuery = q;
    clearTimeout(cityTimer);
    if (q.trim().length < 2) {
      cityResults = null;
      cityBusy = false;
      render(false);
      return;
    }
    cityTimer = setTimeout(async () => {
      const seq = ++citySeq;
      cityBusy = true;
      render(false);
      let r;
      try {
        r = await api.weather.search(q.trim());
      } catch (e) {
        r = { error: true };
      }
      if (seq !== citySeq) return;
      cityBusy = false;
      cityResults = Array.isArray(r) ? r : r && r.error ? { error: true } : [];
      render(false);
    }, 380);
  }
  async function pickCity(i) {
    const c = cityResults && cityResults[i];
    if (!c) return;
    cityResults = null;
    cityQuery = "";
    wx = null;
    await save({ weather: { city: c } });
    setTimeout(async () => {
      await loadWeather();
      render(false);
    }, 1800);
  }
  document.addEventListener("click", async (e) => {
    const ob = e.target.closest("[data-ob]");
    if (ob) {
      obGo(ob.dataset.ob);
      return;
    }
    const lg = e.target.closest("[data-setlang]");
    if (lg) {
      const code = lg.dataset.setlang;
      S = await api.setLanguage(code);
      if (section === "widgetsNav") await loadCatalog();
      render(false);
      return;
    }
    const go = e.target.closest("[data-go]");
    if (go) {
      section = go.dataset.go;
      pickerOpen = false;
      webForm = false;
      cityResults = null;
      cityQuery = "";
      if (section === "phoneNav") await loadPhone();
      if (section === "shortcutsNav") await loadShortcuts();
      if (section === "weatherNav") await loadWeather();
      if (section === "widgetsNav") {
        feedError = "";
        await loadCatalog();
      }
      if (section === "subtitlesNav") {
        subsTests = {};
        subsUserDraft = null;
        await loadSubs();
      }
      if (section === "gamingNav") {
        gmProcs = null;
        await loadGaming();
        loadGameLib(false).then(() => {
          if (section === "gamingNav") render(false);
        });
      }
      gmProbe();
      render();
      if (section === "status" || section === "phoneNav") refreshStatus();
      return;
    }
    const slc = e.target.closest("[data-sublang]");
    if (slc) {
      toggleSubLang(slc.dataset.sublang);
      return;
    }
    const sb = e.target.closest("[data-subs]");
    if (sb) {
      const c = sb.dataset.subs;
      if (c === "openDir") {
        await api.subs.cmd("openDir");
        return;
      }
      if (c === "pickDir") {
        const d = await api.subs.cmd("pickDir");
        if (d) {
          subsDir = d;
          render(false);
        }
        return;
      }
      if (c === "resetDir") {
        subsDir = await api.subs.cmd("resetDir") || "";
        render(false);
        return;
      }
      if (c === "test") {
        const id = sb.dataset.id;
        subsTests[id] = { busy: true };
        render(false);
        let r;
        try {
          r = await api.subs.cmd("test", { provider: id });
        } catch (_) {
          r = { ok: false, code: "other" };
        }
        subsTests[id] = r || { ok: false, code: "other" };
        render(false);
        return;
      }
      if (c === "login") {
        const user = (document.getElementById("osUser") || {}).value || "";
        const pass = (document.getElementById("osPass") || {}).value || "";
        if (!pass && user.trim()) {
          const pe = document.getElementById("osPass");
          if (pe && !SC().providers.opensubtitles.passEnc) {
            pe.classList.add("bad");
            return;
          }
        }
        await api.subs.cmd("login", { user, pass: pass || "" });
        subsUserDraft = null;
        S = await api.get();
        if (user.trim() && (pass || SC().providers.opensubtitles.passEnc)) {
          subsTests.opensubtitles = { busy: true };
          render(false);
          try {
            subsTests.opensubtitles = await api.subs.cmd("test", { provider: "opensubtitles" });
          } catch (_) {
            subsTests.opensubtitles = { ok: false, code: "other" };
          }
        }
        render(false);
        return;
      }
      return;
    }
    const gmm = e.target.closest("[data-gmmetric]");
    if (gmm) {
      const k = gmm.dataset.gmmetric;
      const cur = GC().hud.metrics;
      const next = GX.filter((x) => x === k ? !cur.includes(k) : cur.includes(x));
      await save({ gaming: { hud: { metrics: next } } });
      return;
    }
    const gmr = e.target.closest("[data-gmrm]");
    if (gmr) {
      const list = gmr.dataset.gmrm;
      await save({ gaming: { [list]: GC()[list].filter((x) => x !== gmr.dataset.val) } });
      return;
    }
    const gma = e.target.closest("[data-gmadd]");
    if (gma) {
      const list = gma.dataset.gmadd;
      await save({ gaming: { [list]: [.../* @__PURE__ */ new Set([...GC()[list], gma.dataset.val])] } });
      return;
    }
    const gml = e.target.closest("[data-gmlib]");
    if (gml && api.gaming) {
      const c = gml.dataset.gmlib;
      if (c === "rescan") {
        gmLibBusy = true;
        render(false);
        await loadGameLib(true);
        render(false);
        return;
      }
      const r = await api.gaming.cmd(c, { id: gml.dataset.id });
      if (Array.isArray(r)) gmLib = r;
      render(false);
      return;
    }
    const gmb = e.target.closest("[data-gm]");
    if (gmb && api.gaming) {
      const c = gmb.dataset.gm;
      if (c === "procs") {
        if (gmProcs !== null) {
          gmProcs = null;
          render(false);
          return;
        }
        gmProcs = "loading";
        render(false);
        try {
          gmProcs = await api.gaming.cmd("procs") || [];
        } catch (_) {
          gmProcs = [];
        }
        render(false);
      } else if (c === "allowFps") {
        gmb.classList.add("busy");
        try {
          gmAllow = await api.gaming.cmd("allowFps");
        } catch (_) {
          gmAllow = { ok: false };
        }
        render(false);
      } else if (c === "clearSessions") {
        await api.gaming.cmd("clearSessions");
        await loadGaming();
        render(false);
      }
      return;
    }
    const wc = e.target.closest("[data-wchip]");
    if (wc) {
      e.preventDefault();
      toggleChip(wc.dataset.wchip, wc.dataset.val);
      return;
    }
    const sg = e.target.closest("[data-seg]");
    if (sg) {
      save(setPath(sg.dataset.seg, sg.dataset.val));
      return;
    }
    const test = e.target.closest("[data-test]");
    if (test) {
      test.classList.add("pulse");
      setTimeout(() => test.classList.remove("pulse"), 500);
      api.test(test.dataset.test);
      return;
    }
    const url = e.target.closest("[data-url]");
    if (url) {
      api.action("openUrl", url.dataset.url);
      return;
    }
    const city = e.target.closest("[data-city]");
    if (city) {
      pickCity(Number(city.dataset.city));
      return;
    }
    const ph = e.target.closest("[data-phone]");
    if (ph) {
      const c = ph.dataset.phone;
      const id = ph.dataset.id;
      if (c === "connectIp") {
        const ip = (document.getElementById("ipInput") || {}).value || "";
        if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip.trim())) {
          document.getElementById("ipInput").classList.add("bad");
          return;
        }
        ipBusy = true;
        render(false);
        await api.phone.cmd("connectIp", { ip });
        setTimeout(() => {
          ipBusy = false;
          render(false);
        }, 1500);
        return;
      }
      if (c === "sendFile") {
        await api.phone.cmd("pickAndSend", { deviceId: id, from: "settings" });
        return;
      }
      if (c === "btScan") {
        if (await api.phone.cmd("btScan")) {
          btScanning = true;
          render(false);
          setTimeout(() => {
            btScanning = false;
            render(false);
          }, 12e4);
        }
        return;
      }
      if (c === "openDownloads") {
        await api.phone.cmd("openDownloads");
        return;
      }
      if (c === "pickDownloadDir") {
        const d = await api.phone.cmd("pickDownloadDir");
        if (d) {
          downloadDir = d;
          render(false);
        }
        return;
      }
      if (c === "unpair" && !confirm(`${t("unpair")}: ${(phone.devices.find((d) => d.id === id) || {}).name || ""}?`)) return;
      await api.phone.cmd(c === "find" ? "find" : c, c === "find" ? { deviceId: id } : { id });
      if (c === "refresh") {
        ph.classList.add("spin");
        setTimeout(() => ph.classList.remove("spin"), 900);
      }
      return;
    }
    const cmdRm = e.target.closest("[data-cmdrm]");
    if (cmdRm) {
      const list = (S.phone && S.phone.commands || []).filter((c) => c.id !== cmdRm.dataset.cmdrm);
      await save({ phone: { commands: list } }, true);
      return;
    }
    const kk = e.target.closest("[data-keykind]");
    if (kk) {
      keyForm = kk.dataset.keykind;
      keyDraft = { name: keyDraft.name, target: "", hotkey: null };
      render(false);
      return;
    }
    const ka = e.target.closest("[data-keyadd]");
    if (ka) {
      const kind = ka.dataset.keyadd;
      const val = ka.dataset.val;
      const m = import_deck_meta.default.MEDIA.find((x) => x[0] === val);
      await api.shortcuts.addKey({ kind, target: val, name: kind === "media" && m ? t(m[2]) : t(val) });
      await loadShortcuts();
      render(false);
      return;
    }
    const ks = e.target.closest("[data-keyset]");
    if (ks) {
      await api.shortcuts.update(ks.dataset.id, { [ks.dataset.keyset]: ks.dataset.val });
      await loadShortcuts();
      render(false);
      return;
    }
    const rec = e.target.closest("#keyRec");
    if (rec) {
      recordHotkey(rec);
      return;
    }
    const sc = e.target.closest("[data-sc]");
    if (sc) {
      const c = sc.dataset.sc;
      const id = sc.dataset.id;
      if (c === "edit") {
        editKey = editKey === id ? null : id;
        render(false);
        return;
      }
      if (c === "remove" && editKey === id) editKey = null;
      if (c === "launch") api.shortcuts.launch(id);
      else if (c === "remove") await api.shortcuts.remove(id);
      else if (c === "up" || c === "down") await api.shortcuts.move(id, c === "up" ? -1 : 1);
      if (c !== "launch") {
        await loadShortcuts();
        render(false);
      }
      return;
    }
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      const a = installed[Number(pick.dataset.pick)];
      if (!a) return;
      pick.classList.add("adding");
      await api.shortcuts.add({ name: a.name, kind: a.kind, target: a.target, iconPath: a.iconPath });
      await loadShortcuts();
      render(false);
      return;
    }
    const act = e.target.closest("[data-action]");
    if (act) {
      if (act.dataset.action === "winsettings-notif") api.action("openUrl", "ms-settings:notifications");
      else api.action(act.dataset.action);
      return;
    }
    const cmd = e.target.closest("[data-cmd]");
    if (cmd) {
      const c = cmd.dataset.cmd;
      if (c === "restart") {
        api.restartHelper();
        setTimeout(refreshStatus, 4e3);
      } else if (c === "logs") api.openLogs();
      else if (c === "quit") api.quit();
      else if (c === "reset") {
        S = await api.reset();
        render(false);
      } else if (c === "resetPos") save({ position: null });
      else if (c === "wxRefresh") {
        cmd.classList.add("spin");
        await api.weather.refresh();
        setTimeout(async () => {
          await loadWeather();
          render(false);
        }, 1500);
      } else if (c === "keyform") {
        keyForm = keyForm ? null : "hotkey";
        pickerOpen = false;
        webForm = false;
        keyDraft = { name: "", target: "", hotkey: null };
        render(false);
      } else if (c === "picker") {
        pickerOpen = !pickerOpen;
        webForm = false;
        keyForm = null;
        if (pickerOpen && !installed) loadInstalled();
        else render(false);
      } else if (c === "web") {
        webForm = !webForm;
        pickerOpen = false;
        keyForm = null;
        render(false);
        if (webForm) setTimeout(() => {
          const f = document.querySelector("#webForm input");
          if (f) f.focus();
        }, 30);
      } else if (c === "webCancel") {
        webForm = false;
        render(false);
      } else if (c === "browse") {
        if (await api.shortcuts.browse()) {
          await loadShortcuts();
          render(false);
        }
      }
      return;
    }
    const kb = e.target.closest("#shortcut");
    if (kb) recordShortcut(kb);
  });
  function recordShortcut(kb) {
    kb.textContent = t("pressKeys");
    kb.classList.add("rec");
    const onKey = (ev) => {
      ev.preventDefault();
      const mods = [];
      if (ev.ctrlKey) mods.push("Control");
      if (ev.altKey) mods.push("Alt");
      if (ev.shiftKey) mods.push("Shift");
      if (ev.metaKey) mods.push("Super");
      const k = ev.key;
      if (["Control", "Alt", "Shift", "Meta"].includes(k)) return;
      let key = k === " " ? "Space" : k.length === 1 ? k.toUpperCase() : k;
      if (/^Arrow/.test(key)) key = key.replace("Arrow", "");
      document.removeEventListener("keydown", onKey, true);
      kb.classList.remove("rec");
      if (key === "Escape" || !mods.length) {
        render(false);
        return;
      }
      save({ shortcut: [...mods, key].join("+") });
    };
    document.addEventListener("keydown", onKey, true);
  }
  document.addEventListener("submit", async (e) => {
    if (e.target.id === "feedForm") {
      e.preventDefault();
      addFeed(e.target.elements.url.value);
      return;
    }
    if (e.target.id === "keyForm") {
      e.preventDefault();
      const nameEl = document.getElementById("keyName");
      const targetEl = document.getElementById("keyTarget");
      const item = { kind: keyForm, name: nameEl.value.trim() };
      if (keyForm === "hotkey") {
        if (!keyDraft.hotkey) {
          const b = document.getElementById("keyRec");
          if (b) b.classList.add("bad");
          return;
        }
        Object.assign(item, { vk: keyDraft.hotkey.vk, mods: keyDraft.hotkey.mods, target: keyDraft.hotkey.label });
        if (!item.name) item.name = keyDraft.hotkey.label;
      } else {
        item.target = keyForm === "command" ? targetEl.value.trim() : targetEl.value;
        if (!item.target.trim()) {
          targetEl.classList.add("bad");
          return;
        }
        if (!item.name) item.name = item.target.trim().slice(0, 24);
      }
      if (!await api.shortcuts.addKey(item)) {
        (targetEl || nameEl).classList.add("bad");
        return;
      }
      keyDraft = { name: "", target: "", hotkey: null };
      if (document.activeElement) document.activeElement.blur();
      await loadShortcuts();
      render(false);
      return;
    }
    if (e.target.id === "cmdForm") {
      e.preventDefault();
      const nameEl = document.getElementById("cmdName");
      const cmdEl = document.getElementById("cmdCommand");
      const name2 = nameEl.value.trim();
      const command = cmdEl.value.trim();
      if (!name2) {
        nameEl.classList.add("bad");
        return;
      }
      if (!command) {
        cmdEl.classList.add("bad");
        return;
      }
      const list = (S.phone && S.phone.commands || []).slice(0, 29);
      list.push({ id: `c${Date.now().toString(36)}`, name: name2.slice(0, 40), command: command.slice(0, 400) });
      if (document.activeElement) document.activeElement.blur();
      await save({ phone: { commands: list } }, true);
      return;
    }
    if (e.target.id !== "webForm") return;
    e.preventDefault();
    const f = e.target;
    let url = f.elements.url.value.trim();
    const name = f.elements.name.value.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) throw new Error("bad");
    } catch (_) {
      f.elements.url.classList.add("bad");
      return;
    }
    await api.shortcuts.add({ name: name || new URL(url).hostname, kind: "url", target: url });
    webForm = false;
    await loadShortcuts();
    render(false);
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.matches("input[type=checkbox][data-path]")) save(setPath(el.dataset.path, el.checked));
    else if (el.matches("input[type=range][data-path]")) save(setPath(el.dataset.path, Number(el.value)));
    else if (el.matches("input.text[data-path]")) {
      if (el.dataset.path.endsWith(".key")) subsTests[el.dataset.path.split(".")[2]] = null;
      save(setPath(el.dataset.path, el.value.trim().slice(0, 200)));
    } else if (el.id === "blocked") save({ notifications: { blocked: el.value.split(",").map((s) => s.trim()).filter(Boolean) } });
    else if (el.id === "display") save({ display: el.value });
    else if (el.id === "gmHotkey") save({ gaming: { hud: { hotkey: el.value } } });
    else if (el.dataset.keyname) {
      const v = el.value.trim();
      if (v) api.shortcuts.update(el.dataset.keyname, { name: v }).then(loadShortcuts).then(() => render(false));
    }
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.matches("input[type=range]")) {
      const out = el.parentElement.querySelector("output");
      const fmt = FMT[el.dataset.fmt];
      if (out && fmt) out.textContent = fmt(Number(el.value));
      if (el.dataset.path === "transparency") {
        const tp = String(Number(el.value) / 100);
        document.documentElement.style.setProperty("--tp", tp);
        const pick = document.querySelector(".theme-pick");
        if (pick) pick.style.setProperty("--tp", tp);
      }
    } else if (el.id === "cityInput") searchCity(el.value);
    else if (el.id === "appSearch") {
      pickerQuery = el.value;
      render(false);
    } else if (el.id === "keyName") keyDraft.name = el.value;
    else if (el.id === "osUser") subsUserDraft = el.value;
    else if (el.id === "keyTarget") {
      keyDraft.target = el.value;
      el.classList.remove("bad");
    } else if (el.id === "feedUrl") {
      feedDraft = el.value;
      if (feedError) {
        feedError = "";
        el.classList.remove("bad");
      }
    } else if (el.classList.contains("bad")) el.classList.remove("bad");
  });
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("[data-gmform]");
    if (!f) return;
    e.preventDefault();
    const list = f.dataset.gmform;
    const v = String(f.exe.value || "").trim().split(/[\\/]/).pop().replace(/\.exe$/i, "").toLowerCase().slice(0, 80);
    if (!v) {
      f.exe.classList.add("bad");
      return;
    }
    const other = list === "games" ? "ignore" : "games";
    await save({ gaming: { [list]: [.../* @__PURE__ */ new Set([...GC()[list], v])], [other]: GC()[other].filter((x) => x !== v) } });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "cityInput" && cityResults && cityResults.length) {
      e.preventDefault();
      pickCity(0);
    }
    if (e.key === "Enter" && e.target.id === "ipInput") {
      e.preventDefault();
      const b = document.querySelector('[data-phone="connectIp"]');
      if (b) b.click();
    }
  });
  async function refreshStatus() {
    try {
      statusData = await api.status();
    } catch (_) {
      statusData = null;
    }
    if (["status", "about", "phoneNav"].includes(section) && !onboarding) render(false);
  }
  function busyTyping() {
    const a = document.activeElement;
    return a && a.tagName === "INPUT" && a.type !== "checkbox" && a.type !== "range";
  }
  api.on("settings", (s) => {
    const dirChanged = !S || !s || JSON.stringify((S.subtitles || {}).dir) !== JSON.stringify((s.subtitles || {}).dir);
    S = s;
    if (dirChanged && api.subs) loadSubs().then(() => {
      if (section === "subtitlesNav" && !busyTyping()) render(false);
    });
    if (!busyTyping()) render(false);
  });
  api.on("status", (st) => {
    if (statusData) statusData.helper = st && st.helper ? st.helper : st;
    if ((section === "status" || section === "phoneNav") && !onboarding && !busyTyping()) render(false);
  });
  var TAB_ALIAS = { shortcuts: "shortcutsNav", weather: "weatherNav", phone: "phoneNav", notifications: "notificationsNav", widgets: "widgetsNav", subtitles: "subtitlesNav", gaming: "gamingNav" };
  async function openTab(tab) {
    if (!tab) return;
    if (tab === "onboarding") {
      onboarding = true;
      obStep = 0;
      render();
      return;
    }
    const sec = TAB_ALIAS[tab] || tab;
    if (!SECTIONS.some(([k]) => k === sec)) return;
    onboarding = false;
    section = sec;
    pickerOpen = false;
    webForm = false;
    cityResults = null;
    cityQuery = "";
    if (sec === "shortcutsNav") await loadShortcuts();
    if (sec === "weatherNav") await loadWeather();
    if (sec === "phoneNav") await loadPhone();
    if (sec === "widgetsNav") await loadCatalog();
    if (sec === "subtitlesNav") await loadSubs();
    if (sec === "gamingNav") {
      await loadGaming();
      loadGameLib(false).then(() => {
        if (section === "gamingNav") render(false);
      });
    }
    gmProbe();
    render();
  }
  var gmProbing = false;
  function gmProbe() {
    const want = section === "gamingNav" && !onboarding && !document.hidden;
    if (want === gmProbing || !api.gaming) return;
    gmProbing = want;
    api.gaming.cmd("probe", { on: want }).catch(() => {
    });
  }
  document.addEventListener("visibilitychange", gmProbe);
  window.addEventListener("beforeunload", () => {
    if (gmProbing && api.gaming) api.gaming.cmd("probe", { on: false });
  });
  api.on("settings:tab", (tab) => {
    openTab(tab);
  });
  api.on("phone", (p) => {
    if (p && p.type === "devices") {
      phone = { me: p.me, devices: p.devices || [] };
      if ((section === "phoneNav" || onboarding && OB_STEPS[obStep] === "phone") && !busyTyping()) render(false);
    }
  });
  api.on("weather", (w) => {
    wx = w;
    if ((section === "weatherNav" || onboarding && OB_STEPS[obStep] === "city") && !busyTyping()) render(false);
  });
  api.on("gamingLibrary", () => {
    if (section === "gamingNav") loadGameLib(false).then(() => render(false));
  });
  api.on("gaming", (g) => {
    gm = g;
    const sig = gmSig(g);
    if (sig === gmSig.last) return;
    gmSig.last = sig;
    if (section === "gamingNav" && !onboarding && !busyTyping()) render(false);
  });
  api.on("shortcuts", (list) => {
    shortcuts = list || [];
    if (section === "shortcutsNav" && !busyTyping()) render(false);
  });
  (() => {
    const bf = document.getElementById("brandFace");
    if (!bf) return;
    bf.innerHTML = faceHtml("bk-xs");
    createBlinker(bf.firstElementChild, { auto: true, gap: [3200, 8200] });
  })();
  (async () => {
    S = await api.get();
    try {
      displays = await api.displays();
    } catch (_) {
      displays = [];
    }
    if (api.platform !== "win32") document.body.classList.add("solid");
    const hash = location.hash ? location.hash.slice(1) : "";
    const startTab = PARAMS.get("tab") || hash;
    if (!S.onboarded || startTab === "onboarding") onboarding = true;
    else if (startTab) {
      const sec = TAB_ALIAS[startTab] || startTab;
      if (SECTIONS.some(([k]) => k === sec)) section = sec;
    }
    if (PARAMS.has("step")) obStep = Number(PARAMS.get("step")) || 0;
    await Promise.all([loadPhone(), loadShortcuts(), loadWeather(), loadCatalog(), loadSubs(), loadGaming()]);
    render();
    gmProbe();
    refreshStatus();
  })();
  function mockApi() {
    let s = {
      language: PARAMS.get("lang") || "en",
      onboarded: !PARAMS.has("ob"),
      style: "floating",
      scale: 1,
      topOffset: 8,
      accent: "auto",
      glow: true,
      edgeLight: true,
      blink: { hello: true, peeks: false, events: true },
      idleClock: false,
      hideInFullscreen: true,
      callsOverFullscreen: true,
      respectDnd: true,
      startWithWindows: false,
      shortcut: "Control+Alt+Space",
      sound: true,
      display: "primary",
      movable: true,
      position: { fx: 0.3, dy: 0 },
      minimized: false,
      hidden: false,
      weather: { enabled: true, unit: "c", city: PARAMS.has("nocity") ? null : { name: "London", country: "United Kingdom", admin1: "England", lat: 51.51, lon: -0.13 } },
      phone: { enabled: true, bluetooth: true, remoteInput: true, clipboard: true, clipboardImages: true, forwardNotifications: true, openLinks: true, cameraToClipboard: true, downloadDir: "", commands: [{ id: "c1", name: "Open Downloads", command: "explorer shell:Downloads" }] },
      modules: { media: true, visualizer: true, notifications: true, phoneCalls: true, volumeHud: true, battery: true, capsLock: true, numLock: false, clipboard: true, privacy: true, stats: true, shelf: true, timer: true, weather: true },
      notifications: { duration: 5, blocked: [], showBody: true },
      media: { pausedTimeout: 25, compactInfo: true },
      widgets: { active: "crypto", crypto: { enabled: true, coins: ["BTC", "ETH", "USDT", "TON"] }, news: { enabled: true, feeds: [], custom: [] }, clocks: { enabled: true, zones: ["Europe/London", "America/New_York", "Europe/Paris", "Asia/Tokyo"] } }
    };
    s.modules.widgets = true;
    s.gaming = {
      enabled: true,
      auto: true,
      autoOptimize: false,
      restoreOnExit: true,
      quiet: true,
      fps: true,
      temp: "c",
      pingHost: "8.8.8.8",
      hud: { enabled: true, show: "game", position: "center", size: "m", opacity: 88, metrics: ["fps", "low1", "cpu", "cpuTemp", "gpu", "gpuTemp", "vram", "ram", "ping", "clock"], hotkey: "Control+Shift+G" },
      optimize: { power: true, gameMode: true, memory: true, priority: "above", closeApps: true, dvr: false },
      closeList: ["onedrive"],
      forceClose: false,
      reopen: true,
      games: ["eldenring"],
      ignore: []
    };
    const merge = (a, b) => {
      if (!b || typeof b !== "object" || Array.isArray(b)) return b === void 0 ? a : b;
      const o = { ...a || {} };
      Object.keys(b).forEach((k) => {
        o[k] = merge(o[k], b[k]);
      });
      return o;
    };
    let sc = [
      { id: "1", name: "Visual Studio Code", kind: "file", target: "C:\\Users\\me\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", icon: null },
      { id: "2", name: "Telegram", kind: "file", target: "C:\\Users\\me\\AppData\\Roaming\\Telegram Desktop\\Telegram.exe", icon: null },
      { id: "3", name: "GitHub", kind: "url", target: "https://github.com", icon: null }
    ];
    const apps = ["Adobe Photoshop 2025", "Blender", "Calculator", "Discord", "Figma", "Firefox", "Google Chrome", "Microsoft Edge", "Notepad", "OBS Studio", "Paint", "Spotify", "Steam", "Telegram", "Terminal", "VLC media player", "Visual Studio Code", "Word", "Excel", "PowerPoint", "WhatsApp", "Zoom"].map((n, i) => ({ name: n, kind: i % 5 === 0 ? "aumid" : "file", target: `C:\\Apps\\${n}.lnk` }));
    const phoneData = {
      me: { id: "pc", name: "My-PC", port: 1716, ips: ["192.168.1.20"] },
      devices: [
        { id: "p1", name: "Galaxy S24", type: "phone", address: "192.168.1.34", connected: true, paired: true, pairState: "paired", battery: 76, charging: true, wifi: true, bluetooth: true, island: { app: "Blinkelo Link" } },
        { id: "p2", name: "Pixel 8", type: "phone", address: "192.168.1.41", connected: true, paired: false, pairState: "requestedByPeer", verifyKey: "7F3A9C21" },
        { id: "p3", name: "Redmi Note 13", type: "phone", address: "192.168.1.52", connected: true, paired: false, pairState: "none" }
      ]
    };
    const weatherData = { city: "London", unit: "c", updatedAt: Date.now(), current: { temp: 17.6, feels: 16, humidity: 40, wind: 10, code: 1, isDay: true } };
    return {
      platform: "demo",
      get: async () => s,
      set: async (p) => {
        s = merge(s, p);
        return s;
      },
      setLanguage: async (code) => {
        s = { ...s, language: code };
        return s;
      },
      reset: async () => s,
      status: async () => ({ helper: { core: { ok: true, detail: "PowerShell 5.1.26100" }, media: { ok: true, detail: "ok" }, audio: { ok: true, detail: "ok" }, system: { ok: true, detail: "ok" }, notifications: { ok: true, detail: "ok" }, uia: { ok: true, detail: "ok" }, phone: { ok: true, detail: "listening on 1716 \xB7 3 devices" }, weather: { ok: true, detail: "London \xB7 17.6\xB0" } }, version: "1.0.0", electron: "45.2.3", platform: "win32" }),
      displays: async () => [{ id: "1", label: "Display 1", primary: true, size: "2560\xD71440" }],
      test: async () => true,
      restartHelper: async () => true,
      openLogs: async () => true,
      action: async () => true,
      quit: async () => true,
      shortcuts: {
        get: async () => sc,
        installed: async () => apps,
        icon: async () => null,
        add: async (it) => {
          sc = [...sc, { id: String(Date.now()), ...it }];
          return true;
        },
        remove: async (id) => {
          sc = sc.filter((x) => x.id !== id);
          return true;
        },
        move: async () => true,
        browse: async () => false,
        launch: async () => true,
        addKey: async (it) => {
          sc = [...sc, { id: String(Date.now()), ...it }];
          return true;
        },
        update: async (id, p) => {
          sc = sc.map((x) => x.id === id ? { ...x, ...p } : x);
          return true;
        }
      },
      weather: {
        search: async (q) => [{ name: q[0].toUpperCase() + q.slice(1), country: "Canada", admin1: "Province", lat: 1, lon: 1 }, { name: `${q} Heights`, country: "United States", admin1: "Ohio", lat: 2, lon: 2 }],
        get: async () => weatherData,
        refresh: async () => true
      },
      phone: { get: async () => phoneData, cmd: async (n) => n === "downloadDir" ? "C:\\Users\\me\\Downloads\\Blinkelo" : true },
      gaming: {
        get: async () => ({
          enabled: true,
          manual: false,
          active: PARAMS.has("playing"),
          candidate: null,
          optimized: false,
          hud: PARAMS.has("playing"),
          game: PARAMS.has("playing") ? { id: "g1", name: "witcher3", title: "The Witcher 3", start: Date.now() - 6e5, front: true } : null,
          fullscreen: PARAMS.get("playing") === "fs",
          metrics: PARAMS.has("notemp") ? { cpuTemp: null, cpuTempSrc: "", gpuTemp: 54, gpuTempSrc: "nvidia" } : { cpuTemp: 58, cpuTempSrc: "lhm", gpuTemp: 54, gpuTempSrc: "nvidia" },
          fps: { etw: PARAMS.has("denied") ? "denied" : "ok", rtss: false },
          rtss: { installed: !PARAMS.has("nortss"), running: PARAMS.has("rtss") },
          opt: { running: false, steps: [] },
          sessions: [
            { id: "a", name: "eldenring", title: "ELDEN RING", start: Date.now() - 9e7, end: Date.now() - 86e6, dur: 4325, avgFps: 96, low1: 61, maxCpuTemp: 74, maxGpuTemp: 79 },
            { id: "b", name: "cs2", title: "Counter-Strike 2", start: Date.now() - 19e7, end: Date.now() - 187e6, dur: 2710, avgFps: 287, low1: 141, maxCpuTemp: 81, maxGpuTemp: 70 }
          ]
        }),
        cmd: async (n) => {
          if (n === "procs") {
            await new Promise((r) => setTimeout(r, 400));
            return [["Discord", "Discord", 412e6], ["chrome", "YouTube - Google Chrome", 19e8], ["OneDrive", "", 12e7], ["Teams", "Microsoft Teams", 61e7], ["steamwebhelper", "", 33e7]].map(([name, title, mem], i) => ({ pid: 100 + i, name, title, mem, path: `C:\\Apps\\${name}.exe` }));
          }
          if (n === "allowFps") {
            await new Promise((r) => setTimeout(r, 600));
            return { ok: true };
          }
          if (n === "library" || n === "hideGame" || n === "unhideGame") {
            mockApi.lib = mockApi.lib || [["Cyberpunk 2077", "steam"], ["ELDEN RING", "steam"], ["Fortnite", "epic"], ["The Witcher 3", "gog"], ["Valorant", "played"], ["RetroArch", "custom"]].map(([name, source], i) => ({ id: `m${i}`, name, source, hidden: i === 2, icon: null }));
            return mockApi.lib;
          }
          return true;
        }
      },
      subs: {
        get: async () => null,
        cmd: async (n, a) => {
          if (n === "dir" || n === "resetDir") return s.subtitles && s.subtitles.dir || "C:\\Users\\me\\Downloads\\Subtitles";
          if (n === "pickDir") {
            s = merge(s, { subtitles: { dir: "D:\\Movies\\Subtitles" } });
            return "D:\\Movies\\Subtitles";
          }
          if (n === "test") {
            await new Promise((r) => setTimeout(r, 600));
            return a.provider === "opensubtitles" ? { ok: false, code: "key" } : { ok: true, count: 24 };
          }
          if (n === "login") {
            s = merge(s, { subtitles: { providers: { opensubtitles: { user: a.user, passEnc: a.pass ? "x" : "" } } } });
            return true;
          }
          return true;
        }
      },
      widgets: {
        catalog: async () => ({
          coins: [["BTC", "Bitcoin"], ["ETH", "Ethereum"], ["USDT", "Tether"], ["BNB", "BNB"], ["SOL", "Solana"], ["XRP", "XRP"], ["TON", "Toncoin"], ["DOGE", "Dogecoin"], ["TRX", "TRON"], ["ADA", "Cardano"], ["LTC", "Litecoin"], ["NOT", "Notcoin"]].map(([sym, name]) => ({ sym, name })),
          feeds: [["bbc-world", "BBC World", "en"], ["verge", "The Verge", "en"], ["hn", "Hacker News", "en"], ["bbc-ar", "BBC \u0639\u0631\u0628\u064A", "ar"], ["bbc-tr", "BBC T\xFCrk\xE7e", "tr"], ["bbc-es", "BBC Mundo", "es"], ["bbc-ru", "BBC \u0420\u0443\u0441\u0441\u043A\u0430\u044F \u0441\u043B\u0443\u0436\u0431\u0430", "ru"], ["bbc-zh", "BBC \u4E2D\u6587", "zh"]].map(([id, name, l]) => ({ id, name, lang: l, url: "" })),
          defaultFeeds: ["bbc-world", "verge"]
        }),
        testFeed: async (url) => /bad/.test(url) ? { ok: false } : { ok: true, count: 12, title: "Example Feed" },
        get: async () => null,
        refresh: async () => true
      },
      on: () => () => {
      }
    };
  }
})();
