package com.saeedsh.islandlink;

import android.app.Notification;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.Icon;
import android.os.SystemClock;
import android.widget.RemoteViews;

import com.saeedsh.islandlink.core.Json;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Live game numbers from the PC ("island.game", Blinkelo 1.8+): a graphical ongoing notification while a
 * game runs, a summary notification when it ends, and events for the WebView game page.
 */
final class GameMirror {
    private static final int GOOD = Color.parseColor("#30D158");
    private static final int WARN = Color.parseColor("#FF9F0A");
    private static final int BAD = Color.parseColor("#FF453A");

    private final LinkService svc;
    private String sessionId = "";
    private Bitmap icon;
    private boolean showing;
    private long lastNotif;

    GameMirror(LinkService svc) { this.svc = svc; }

    void onPacket(Json.Obj b) {
        String kind = b.str("kind", "live");
        if ("library".equals(kind)) { UiBus.emit("gamelib", b); return; }
        if ("launch".equals(kind)) { UiBus.emit("gamelaunch", b); return; }
        if ("summary".equals(kind)) { onSummary(b); return; }
        onLive(b);
    }

    /** The PC went away: no stale "playing" notification. */
    void clear() {
        if (showing) Notif.cancel(svc, Notif.ID_GAME);
        showing = false;
        sessionId = "";
        icon = null;
        UiBus.forget("game");
        UiBus.forget("gameicon");
        UiBus.forget("gamelib");
    }

    private void onLive(Json.Obj b) {
        Json.Obj g = b.obj("game");
        String data = b.str("icon", "");
        b.remove("icon");
        if (g == null || !"playing".equals(b.str("state"))) {
            if (showing) Notif.cancel(svc, Notif.ID_GAME);
            showing = false;
            sessionId = "";
            icon = null;
            UiBus.emit("game", b);
            return;
        }
        String id = g.str("id", "");
        if (!id.equals(sessionId)) { sessionId = id; icon = null; }
        if (!data.isEmpty()) {
            Bitmap bm = Util.decodeDataUrl(data);
            if (bm != null) icon = bm;
            UiBus.emit("gameicon", new Json.Obj().p("id", id).p("icon", data));
        }
        UiBus.emit("game", b);
        notifyLive(b, g);
    }

    // ------------------------------------------------------------------ ongoing notification
    private void notifyLive(Json.Obj b, Json.Obj g) {
        if (!Settings.section(svc, "gaming").bool("notification", true)) {
            if (showing) Notif.cancel(svc, Notif.ID_GAME);
            showing = false;
            return;
        }
        long now = SystemClock.uptimeMillis();
        if (showing && now - lastNotif < 1200) return; // updates arrive every 1-2 s; never redraw faster than this
        lastNotif = now;
        Json.Obj m = b.objOrEmpty("m");
        boolean f = "f".equals(b.str("temp", "c"));
        String name = g.str("title", "").isEmpty() ? g.str("name", "Game") : g.str("title", "");
        String pkg = svc.getPackageName();
        RemoteViews small = new RemoteViews(pkg, R.layout.notif_game);
        RemoteViews big = new RemoteViews(pkg, R.layout.notif_game_big);
        fill(small, m, f, false);
        fill(big, m, f, true);
        big.setTextViewText(R.id.g_title, name);
        big.setTextViewText(R.id.g_sub, Strings.t(svc, "game_playing_on", "pc", svc.activeName()));
        if (icon != null) big.setImageViewBitmap(R.id.g_icon, icon);
        else big.setImageViewResource(R.id.g_icon, R.drawable.ic_act_game);
        long start = g.lng("start", 0);
        long elapsed = start > 0 ? Math.max(0, System.currentTimeMillis() - start) : 0;
        big.setChronometer(R.id.g_time, SystemClock.elapsedRealtime() - elapsed, null, true);
        boolean optimized = b.bool("optimized");
        boolean hud = b.bool("hud");
        Notification.Builder nb = Notif.builder(svc, Notif.CH_GAME)
                .setSmallIcon(R.drawable.ic_act_game)
                .setContentTitle(name)
                .setContentText(line(m, f))
                .setSubText(svc.activeName())
                .setStyle(new Notification.DecoratedCustomViewStyle())
                .setCustomContentView(small)
                .setCustomBigContentView(big)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setLocalOnly(true)
                .setCategory(Notification.CATEGORY_STATUS)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setContentIntent(Notif.openApp(svc, "game"))
                .addAction(action(optimized ? "game_undo" : "game_optimize", optimized ? "restore" : "optimize", 61))
                .addAction(action(hud ? "game_bar_hide" : "game_bar_show", "hud", 62));
        if (icon != null) nb.setLargeIcon(Icon.createWithBitmap(icon));
        Notif.show(svc, Notif.ID_GAME, nb.build());
        showing = true;
    }

    private Notification.Action action(String label, String cmd, int req) {
        return new Notification.Action.Builder(Icon.createWithResource(svc, R.drawable.ic_act_game), Strings.t(svc, label),
                Notif.action(svc, req, ActionReceiver.GAME_CMD, "cmd", cmd)).build();
    }

    private static int val(Json.Obj m, String k) {
        return m.has(k) ? (int) Math.round(m.num(k, -1)) : -1;
    }

    private static double dval(Json.Obj m, String k) {
        return m.has(k) ? m.num(k, -1) : -1;
    }

    private static String temp(int c, boolean f) {
        if (c < 0) return "";
        return f ? Math.round(c * 9 / 5.0 + 32) + "°F" : c + "°";
    }

    private static int fpsColor(int fps) {
        return fps < 0 ? GOOD : fps < 30 ? BAD : fps < 55 ? WARN : GOOD;
    }

    private static String gb(double v) {
        return v < 0 ? "–" : (v >= 10 ? String.valueOf(Math.round(v)) : String.format(Locale.US, "%.1f", v));
    }

    private void fill(RemoteViews rv, Json.Obj m, boolean f, boolean big) {
        int fps = val(m, "fps");
        int low = val(m, "low1");
        rv.setTextViewText(R.id.g_fps, fps >= 0 ? String.valueOf(fps) : "–");
        rv.setTextColor(R.id.g_fps, fpsColor(fps));
        usage(rv, R.id.g_cpu_bar, R.id.g_cpu_v, val(m, "cpu"), val(m, "cpuTemp"), 80, 90, f);
        usage(rv, R.id.g_gpu_bar, R.id.g_gpu_v, val(m, "gpu"), val(m, "gpuTemp"), 78, 86, f);
        if (!big) {
            rv.setTextViewText(R.id.g_fps_l, low >= 0 ? "FPS · 1% " + low : "FPS");
            return;
        }
        rv.setTextViewText(R.id.g_low, low >= 0 ? String.valueOf(low) : "–");
        rv.setTextColor(R.id.g_low, fpsColor(low));
        double ft = dval(m, "ft");
        rv.setTextViewText(R.id.g_ft, ft >= 0 ? String.format(Locale.US, "%.1f", ft) : "–");
        int ram = val(m, "ram");
        rv.setProgressBar(R.id.g_ram_bar, 100, Math.max(0, ram), false);
        double ru = dval(m, "ramUsed"), rt = dval(m, "ramTotal");
        rv.setTextViewText(R.id.g_ram_v, ru >= 0 && rt > 0 ? gb(ru) + "/" + gb(rt) + " GB" : ram >= 0 ? ram + "%" : "–");
        double vu = dval(m, "vram"), vt = dval(m, "vramTotal");
        rv.setProgressBar(R.id.g_vram_bar, 100, vu >= 0 && vt > 0 ? (int) Math.round(vu * 100 / vt) : 0, false);
        rv.setTextViewText(R.id.g_vram_v, vu >= 0 ? gb(vu) + (vt > 0 ? "/" + gb(vt) : "") + " GB" : "–");
        List<String> foot = new ArrayList<String>();
        int ping = val(m, "ping");
        if (m.has("ping")) foot.add(ping < 0 ? "Ping ✕" : "Ping " + ping + " ms");
        int pw = val(m, "gpuPower");
        if (pw >= 0) foot.add("GPU " + pw + " W");
        rv.setTextViewText(R.id.g_foot, join(foot));
    }

    private void usage(RemoteViews rv, int bar, int text, int pct, int t, int warn, int bad, boolean f) {
        rv.setProgressBar(bar, 100, Math.max(0, pct), false);
        String tt = temp(t, f);
        rv.setTextViewText(text, (pct >= 0 ? pct + "%" : "–") + (tt.isEmpty() ? "" : "  " + tt));
        if (t >= bad) rv.setTextColor(text, BAD);
        else if (t >= warn) rv.setTextColor(text, WARN);
    }

    private static String line(Json.Obj m, boolean f) {
        List<String> p = new ArrayList<String>();
        int fps = val(m, "fps");
        if (fps >= 0) p.add(fps + " FPS");
        int cpu = val(m, "cpu"), gpu = val(m, "gpu");
        if (cpu >= 0) p.add("CPU " + cpu + "% " + temp(val(m, "cpuTemp"), f));
        if (gpu >= 0) p.add("GPU " + gpu + "% " + temp(val(m, "gpuTemp"), f));
        return join(p).trim();
    }

    private static String join(List<String> parts) {
        StringBuilder sb = new StringBuilder();
        for (String s : parts) {
            if (s == null || s.trim().isEmpty()) continue;
            if (sb.length() > 0) sb.append(" · ");
            sb.append(s.trim());
        }
        return sb.toString();
    }

    // ------------------------------------------------------------------ summary
    private void onSummary(Json.Obj b) {
        if (showing) Notif.cancel(svc, Notif.ID_GAME);
        showing = false;
        String data = b.str("icon", "");
        b.remove("icon");
        Json.Obj s = b.objOrEmpty("summary");
        if (!data.isEmpty()) UiBus.emit("gameicon", new Json.Obj().p("id", s.str("id", "")).p("icon", data));
        UiBus.emit("gamesummary", b);
        if (!Settings.section(svc, "gaming").bool("summary", true)) return;
        boolean f = "f".equals(b.str("temp", "c"));
        List<String> p = new ArrayList<String>();
        long dur = s.lng("dur", 0);
        long h = dur / 3600, mins = (dur % 3600) / 60;
        p.add(h > 0 ? Strings.t(svc, "dur_hm", "h", String.valueOf(h), "m", String.valueOf(mins))
                : Strings.t(svc, "dur_m", "m", String.valueOf(Math.max(1, mins))));
        int avg = val(s, "avgFps"), low = val(s, "low1"), ct = val(s, "maxCpuTemp"), gt = val(s, "maxGpuTemp");
        if (avg >= 0) p.add(Strings.t(svc, "game_s_avg", "n", String.valueOf(avg)));
        if (low >= 0) p.add(Strings.t(svc, "game_s_low", "n", String.valueOf(low)));
        if (gt > 0) p.add(Strings.t(svc, "game_s_gpu", "t", temp(gt, f)));
        if (ct > 0) p.add(Strings.t(svc, "game_s_cpu", "t", temp(ct, f)));
        String text = join(p);
        Notification.Builder nb = Notif.builder(svc, Notif.CH_GAME)
                .setSmallIcon(R.drawable.ic_act_game)
                .setContentTitle(Strings.t(svc, "game_ended", "name", s.str("name", "")))
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setSubText(svc.activeName())
                .setAutoCancel(true)
                .setContentIntent(Notif.openApp(svc, "game"));
        Bitmap bm = Util.decodeDataUrl(data);
        if (bm != null) nb.setLargeIcon(Icon.createWithBitmap(bm));
        Notif.show(svc, Notif.ID_GAME_SUMMARY, nb.build());
    }
}
