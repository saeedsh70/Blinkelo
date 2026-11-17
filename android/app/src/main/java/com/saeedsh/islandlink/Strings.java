package com.saeedsh.islandlink;

import android.content.Context;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Native-side texts (notifications, toasts) in the same languages as the UI. */
public final class Strings {
    private Strings() {}

    static final String[] LANGS = {"en", "ar", "tr", "es", "ru", "zh"};
    private static final Map<String, String[]> T = new HashMap<String, String[]>();

    private static void d(String key, String en, String ar, String tr, String es, String ru, String zh) {
        T.put(key, new String[] {en, ar, tr, es, ru, zh});
    }

    static {
        d("ch_game", "PC gaming", "الألعاب على الحاسوب", "PC’de oyun", "Juegos en el PC", "Игры на ПК", "电脑游戏");
        d("game_playing_on", "Playing on {pc}", "تلعب على {pc}", "{pc} üzerinde oynanıyor", "Jugando en {pc}", "Игра на {pc}", "正在 {pc} 上游戏");
        d("game_optimize", "Optimize", "تحسين", "Optimize et", "Optimizar", "Оптимизировать", "优化");
        d("game_undo", "Undo", "تراجع", "Geri al", "Deshacer", "Отменить", "撤销");
        d("game_bar_show", "Bar on PC", "الشريط على الحاسوب", "PC’de çubuk", "Barra en el PC", "Полоса на ПК", "电脑悬浮条");
        d("game_bar_hide", "Hide PC bar", "إخفاء الشريط", "Çubuğu gizle", "Ocultar barra", "Скрыть полосу", "隐藏悬浮条");
        d("game_ended", "Session ended · {name}", "انتهت الجلسة · {name}", "Oturum bitti · {name}", "Sesión terminada · {name}", "Сессия завершена · {name}", "游戏结束 · {name}");
        d("game_s_avg", "avg {n} FPS", "متوسط {n} FPS", "ort. {n} FPS", "media {n} FPS", "в среднем {n} FPS", "平均 {n} FPS");
        d("game_s_low", "1% low {n}", "أدنى 1٪ {n}", "%1 düşük {n}", "1% bajo {n}", "1% low {n}", "1% 低帧 {n}");
        d("game_s_cpu", "CPU max {t}", "أقصى حرارة للمعالج {t}", "CPU en fazla {t}", "CPU máx. {t}", "ЦП макс. {t}", "CPU 最高 {t}");
        d("game_s_gpu", "GPU max {t}", "أقصى حرارة للرسوميات {t}", "GPU en fazla {t}", "GPU máx. {t}", "ГП макс. {t}", "GPU 最高 {t}");
        d("dur_hm", "{h} h {m} min", "{h} س {m} د", "{h} sa {m} dk", "{h} h {m} min", "{h} ч {m} мин", "{h} 小时 {m} 分钟");
        d("dur_m", "{m} min", "{m} د", "{m} dk", "{m} min", "{m} мин", "{m} 分钟");
        d("svc_searching", "Looking for your PC…", "جارٍ البحث عن الحاسوب…", "PC aranıyor…", "Buscando tu PC…", "Поиск компьютера…", "正在查找电脑…");
        d("svc_connected", "Connected to {name}", "متصل بـ {name}", "{name} cihazına bağlı", "Conectado a {name}", "Подключено к {name}", "已连接到 {name}");
        d("via_wifi", "Wi-Fi", "Wi-Fi", "Wi-Fi", "Wi-Fi", "Wi-Fi", "Wi-Fi");
        d("via_bt", "Bluetooth", "بلوتوث", "Bluetooth", "Bluetooth", "Bluetooth", "蓝牙");
        d("via_both", "Wi-Fi + Bluetooth", "Wi-Fi + بلوتوث", "Wi-Fi + Bluetooth", "Wi-Fi + Bluetooth", "Wi-Fi + Bluetooth", "Wi-Fi + 蓝牙");
        d("act_clipboard", "Send clipboard", "إرسال الحافظة", "Panoyu gönder", "Enviar portapapeles", "Отправить буфер", "发送剪贴板");
        d("act_open", "Open", "فتح", "Aç", "Abrir", "Открыть", "打开");
        d("act_touchpad", "Touchpad", "لوحة اللمس", "Dokunmatik", "Panel táctil", "Тачпад", "触控板");
        d("pair_title", "Pairing request", "طلب اقتران", "Eşleştirme isteği", "Solicitud de vinculación", "Запрос на сопряжение", "配对请求");
        d("pair_text", "{name} wants to pair · code {key}", "{name} يريد الاقتران · الرمز {key}", "{name} eşleşmek istiyor · kod {key}", "{name} quiere vincularse · código {key}", "{name} хочет выполнить сопряжение · код {key}", "{name} 请求配对 · 代码 {key}");
        d("act_accept", "Accept", "قبول", "Kabul et", "Aceptar", "Принять", "接受");
        d("act_reject", "Reject", "رفض", "Reddet", "Rechazar", "Отклонить", "拒绝");
        d("paired", "Paired with {name}", "تم الاقتران مع {name}", "{name} ile eşleşti", "Vinculado con {name}", "Сопряжено с {name}", "已与 {name} 配对");
        d("file_received", "File received", "تم استلام ملف", "Dosya alındı", "Archivo recibido", "Файл получен", "已收到文件");
        d("file_receiving", "Receiving {name}", "جارٍ استلام {name}", "{name} alınıyor", "Recibiendo {name}", "Получение {name}", "正在接收 {name}");
        d("file_sending", "Sending {name}", "جارٍ إرسال {name}", "{name} gönderiliyor", "Enviando {name}", "Отправка {name}", "正在发送 {name}");
        d("file_sent", "Sent to {pc}", "أُرسل إلى {pc}", "{pc} cihazına gönderildi", "Enviado a {pc}", "Отправлено на {pc}", "已发送到 {pc}");
        d("file_failed", "Transfer failed", "فشل النقل", "Aktarım başarısız", "La transferencia falló", "Ошибка передачи", "传输失败");
        d("link_received", "Link from {pc}", "رابط من {pc}", "{pc} cihazından bağlantı", "Enlace de {pc}", "Ссылка от {pc}", "来自 {pc} 的链接");
        d("text_copied", "Text from {pc} copied", "تم نسخ نص من {pc}", "{pc} cihazından metin kopyalandı", "Texto de {pc} copiado", "Текст от {pc} скопирован", "已复制来自 {pc} 的文本");
        d("clip_sent", "Clipboard sent to {pc}", "أُرسلت الحافظة إلى {pc}", "Pano {pc} cihazına gönderildi", "Portapapeles enviado a {pc}", "Буфер отправлен на {pc}", "剪贴板已发送到 {pc}");
        d("clip_empty", "Clipboard is empty", "الحافظة فارغة", "Pano boş", "El portapapeles está vacío", "Буфер пуст", "剪贴板为空");
        d("not_connected", "Not connected to a PC", "غير متصل بحاسوب", "Bir PC'ye bağlı değil", "No hay ningún PC conectado", "Нет подключения к ПК", "未连接电脑");
        d("photo_request", "{pc} asks for a photo", "{pc} يطلب صورة", "{pc} bir fotoğraf istiyor", "{pc} pide una foto", "{pc} просит фото", "{pc} 请求一张照片");
        d("photo_tap", "Tap to take a photo", "اضغط لالتقاط صورة", "Fotoğraf çekmek için dokunun", "Toca para hacer una foto", "Нажмите, чтобы сделать фото", "点按拍照");
        d("find_title", "Find my phone", "العثور على هاتفي", "Telefonumu bul", "Encontrar mi teléfono", "Найти телефон", "查找手机");
        d("find_text", "{pc} is looking for this phone", "{pc} يبحث عن هذا الهاتف", "{pc} bu telefonu arıyor", "{pc} está buscando este teléfono", "{pc} ищет этот телефон", "{pc} 正在查找此手机");
        d("act_found", "Found it", "وجدته", "Buldum", "Lo encontré", "Нашёл", "找到了");
        d("timer_title", "Timer", "مؤقت", "Zamanlayıcı", "Temporizador", "Таймер", "计时器");
        d("timer_done", "Time's up", "انتهى الوقت", "Süre doldu", "Se acabó el tiempo", "Время вышло", "时间到");
        d("act_cancel", "Cancel", "إلغاء", "İptal", "Cancelar", "Отмена", "取消");
        d("task_reminder", "Reminder", "تذكير", "Hatırlatıcı", "Recordatorio", "Напоминание", "提醒");
        d("act_done", "Done", "تم", "Tamam", "Hecho", "Готово", "完成");
        d("act_copy", "Copy", "نسخ", "Kopyala", "Copiar", "Копировать", "复制");
        d("act_share", "Share", "مشاركة", "Paylaş", "Compartir", "Поделиться", "分享");
        d("screenshot_saved", "PC screenshot saved", "تم حفظ لقطة شاشة الحاسوب", "PC ekran görüntüsü kaydedildi", "Captura del PC guardada", "Снимок экрана ПК сохранён", "电脑截图已保存");
        d("ch_service", "Connection", "الاتصال", "Bağlantı", "Conexión", "Подключение", "连接");
        d("ch_pair", "Pairing", "الاقتران", "Eşleştirme", "Vinculación", "Сопряжение", "配对");
        d("ch_transfer", "Files", "الملفات", "Dosyalar", "Archivos", "Файлы", "文件");
        d("ch_pc", "PC notifications", "إشعارات الحاسوب", "PC bildirimleri", "Notificaciones del PC", "Уведомления ПК", "电脑通知");
        d("ch_find", "Find my phone", "العثور على هاتفي", "Telefonumu bul", "Encontrar mi teléfono", "Найти телефон", "查找手机");
        d("ch_timer", "Timers & reminders", "المؤقتات والتذكيرات", "Zamanlayıcılar ve hatırlatıcılar", "Temporizadores y recordatorios", "Таймеры и напоминания", "计时器和提醒");
        d("ch_media", "PC media", "وسائط الحاسوب", "PC medyası", "Multimedia del PC", "Медиа ПК", "电脑媒体");
        d("pc_media", "Playing on PC", "يُشغَّل على الحاسوب", "PC'de çalıyor", "Reproduciendo en el PC", "Играет на ПК", "电脑正在播放");
        d("sms_sent", "SMS sent", "تم إرسال الرسالة", "SMS gönderildi", "SMS enviado", "SMS отправлено", "短信已发送");
    }

    public static String lang(Context ctx) {
        String l = Settings.get(ctx).str("language", "auto");
        if (!"auto".equals(l)) for (String s : LANGS) if (s.equals(l)) return s;
        String sys = Locale.getDefault().getLanguage();
        if ("iw".equals(sys)) sys = "he";
        for (String s : LANGS) if (s.equals(sys)) return s;
        return "en";
    }

    public static String t(Context ctx, String key, String... kv) {
        String[] v = T.get(key);
        if (v == null) return key;
        String l = lang(ctx);
        int idx = 0;
        for (int i = 0; i < LANGS.length; i++) if (LANGS[i].equals(l)) idx = i;
        String s = v[idx];
        for (int i = 0; i + 1 < kv.length; i += 2) s = s.replace("{" + kv[i] + "}", kv[i + 1] == null ? "" : kv[i + 1]);
        return s;
    }
}
