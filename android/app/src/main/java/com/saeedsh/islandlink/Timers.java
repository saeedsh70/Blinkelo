package com.saeedsh.islandlink;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Countdown timers shared with the PC island (live activity there, ongoing notification here). */
final class Timers {
    private final Context ctx;
    private final Map<String, Json.Obj> timers = new LinkedHashMap<String, Json.Obj>();
    private final Map<String, Long> tombstones = new LinkedHashMap<String, Long>();

    Timers(Context ctx) {
        this.ctx = ctx.getApplicationContext();
        Json.Obj removed = Json.parseObj(Settings.state(ctx, "timerTombstones", "{}"));
        if (removed != null) for (String id : removed.keySet()) if (removed.lng(id, 0) > System.currentTimeMillis() - 30L * 86400000L)
            tombstones.put(id, removed.lng(id, 0));
        // Alarm broadcasts may start a fresh process without LinkService. Load before handling them.
        Json.Arr saved = Json.parseArr(Settings.state(ctx, "timers", "[]"));
        if (saved != null) for (Object o : saved) {
            if (!(o instanceof Json.Obj)) continue;
            Json.Obj t = (Json.Obj) o;
            String id = t.str("id", "");
            if (!id.isEmpty() && t.lng("endsAt", 0) > 0 && (!tombstones.containsKey(id) || tombstones.get(id) < t.lng("updated", 0))) timers.put(id, t);
        }
    }

    synchronized Json.Arr list() {
        Json.Arr a = new Json.Arr();
        long now = System.currentTimeMillis();
        for (Json.Obj t : timers.values()) a.add(new Json.Obj(t).p("remaining", Math.max(0, t.lng("endsAt", now) - now)));
        return a;
    }

    synchronized void restore() {
        long now = System.currentTimeMillis();
        for (Json.Obj t : new ArrayList<Json.Obj>(timers.values())) {
            if (t.lng("endsAt", 0) > now) { showOngoing(t); schedule(t); }
            else onAlarm(t.str("id"));
        }
    }

    private void persist() {
        Json.Obj removed = new Json.Obj();
        for (Map.Entry<String, Long> entry : tombstones.entrySet()) if (entry.getValue() > System.currentTimeMillis() - 30L * 86400000L) removed.p(entry.getKey(), entry.getValue());
        Settings.setState(ctx, "timerTombstones", Json.stringify(removed));
        Settings.setState(ctx, "timers", Json.stringify(new Json.Arr(new ArrayList<Object>(timers.values()))));
        UiBus.emit("timers", list());
    }

    // ------------------------------------------------------------------ local
    synchronized Json.Obj start(long durationMs, String label) {
        if (durationMs < 1000 || durationMs > 365L * 86400000L) return null;
        long now = System.currentTimeMillis();
        Json.Obj t = new Json.Obj().p("id", UUID.randomUUID().toString().replace("-", "").substring(0, 12))
                .p("label", label == null ? "" : label).p("duration", durationMs).p("endsAt", now + durationMs).p("origin", "phone").p("updated", now);
        timers.put(t.str("id"), t);
        showOngoing(t);
        schedule(t);
        persist();
        send(t, "running");
        return t;
    }

    synchronized void cancel(String id, boolean tellPc) {
        Json.Obj t = timers.remove(id);
        if (t == null) return;
        t.p("updated", Math.max(System.currentTimeMillis(), t.lng("updated", 0) + 1));
        tombstones.put(id, t.lng("updated", 0));
        Notif.cancel(ctx, "timer:" + id, nid(id));
        cancelAlarm(id);
        persist();
        if (tellPc) send(t, "cancel");
    }

    // ------------------------------------------------------------------ remote (PC)
    synchronized void onRemote(Json.Obj b) {
        String id = b.str("id", "");
        if (id.isEmpty()) return;
        if (id.length() > 128) return;
        long updated = b.lng("updated", System.currentTimeMillis());
        if (updated <= 0 || (tombstones.containsKey(id) && tombstones.get(id) >= updated)) return;
        Json.Obj previous = timers.get(id);
        if (previous != null && previous.lng("updated", 0) > updated) return;
        String state = b.str("state", "running");
        if ("cancel".equals(state) || "done".equals(state)) {
            if ("done".equals(state) && previous != null) {
                // Finishing on either device must alert both devices exactly once.
                onAlarm(id, false);
                tombstones.put(id, Math.max(updated, tombstones.get(id)));
                persist();
                return;
            }
            tombstones.put(id, updated);
            Json.Obj t = timers.remove(id);
            if (t != null) {
                Notif.cancel(ctx, "timer:" + id, nid(id));
                cancelAlarm(id);
                persist();
            }
            else persist();
            return;
        }
        long remaining = b.lng("remaining", 0);
        if (!"running".equals(state) || remaining <= 0 || remaining > 365L * 86400000L) return;
        if (previous != null && previous.lng("updated", 0) == updated) return;
        if (timers.size() >= 100 && previous == null) return;
        Json.Obj t = new Json.Obj().p("id", id).p("label", b.str("label", "")).p("duration", b.lng("duration", remaining))
                .p("endsAt", System.currentTimeMillis() + remaining).p("origin", b.str("origin", "pc")).p("updated", updated);
        tombstones.remove(id);
        timers.put(id, t);
        showOngoing(t);
        schedule(t);
        persist();
    }

    void sendAll() {
        Json.Arr all;
        synchronized (this) { all = list(); }
        synchronized (this) {
            LinkService s = LinkService.get();
            if (s != null) for (Map.Entry<String, Long> entry : tombstones.entrySet()) s.send(Packet.of("island.timer",
                    new Json.Obj().p("id", entry.getKey()).p("state", "cancel").p("updated", entry.getValue())));
        }
        for (Object o : all) send((Json.Obj) o, "running");
    }

    private void send(Json.Obj t, String state) {
        LinkService s = LinkService.get();
        if (s == null) return;
        long remaining = Math.max(0, t.lng("endsAt", 0) - System.currentTimeMillis());
        s.send(Packet.of("island.timer", new Json.Obj().p("id", t.str("id")).p("label", t.str("label", "")).p("duration", t.lng("duration", 0))
                .p("remaining", remaining).p("state", state).p("origin", t.str("origin", "phone")).p("updated", t.lng("updated", 0))));
    }

    // ------------------------------------------------------------------ notifications & alarms
    private static int nid(String id) { return Notif.ID_TIMER_BASE + ((id.hashCode() & Integer.MAX_VALUE) % 1000); }

    private void showOngoing(Json.Obj t) {
        String id = t.str("id");
        Notif.cancel(ctx, nid(id)); // retire the untagged notification from older installations
        String label = t.str("label", "");
        Notification.Builder b = Notif.builder(ctx, Notif.CH_MEDIA)
                .setContentTitle(label.isEmpty() ? Strings.t(ctx, "timer_title") : label)
                .setContentText("pc".equals(t.str("origin")) ? (LinkService.get() != null ? LinkService.get().activeName() : "PC") : Strings.t(ctx, "timer_title"))
                .setOngoing(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(true)
                .setWhen(t.lng("endsAt", System.currentTimeMillis()))
                .setShowWhen(true)
                .setOnlyAlertOnce(true)
                .setCategory(Notification.CATEGORY_STOPWATCH)
                .setContentIntent(Notif.openApp(ctx, "timers"))
                .addAction(new Notification.Action.Builder(null, Strings.t(ctx, "act_cancel"),
                        Notif.action(ctx, nid(id), ActionReceiver.TIMER_CANCEL, "id", id)).build());
        Notif.show(ctx, "timer:" + id, nid(id), b.build());
    }

    private PendingIntent alarmIntent(String id) {
        Intent i = new Intent(ctx, ActionReceiver.class).setAction(ActionReceiver.TIMER_ALARM)
                .setData(new Uri.Builder().scheme("islandlink").authority("timer").appendPath(id).build()).putExtra("id", id);
        return PendingIntent.getBroadcast(ctx, ("timer" + id).hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void schedule(Json.Obj t) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null) return;
        long at = t.lng("endsAt", 0);
        PendingIntent pi = alarmIntent(t.str("id"));
        try {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    private void cancelAlarm(String id) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(alarmIntent(id));
    }

    synchronized void onAlarm(String id) {
        onAlarm(id, true);
    }

    private synchronized void onAlarm(String id, boolean tellPc) {
        Json.Obj t = timers.remove(id);
        if (t == null) return;
        t.p("updated", Math.max(System.currentTimeMillis(), t.lng("updated", 0) + 1));
        tombstones.put(id, t.lng("updated", 0));
        persist();
        Notif.cancel(ctx, "timer:" + id, nid(id));
        String label = t.str("label", "");
        Notification n = Notif.builder(ctx, Notif.CH_TIMER)
                .setContentTitle(Strings.t(ctx, "timer_done"))
                .setContentText(label.isEmpty() ? Strings.t(ctx, "timer_title") : label)
                .setCategory(Notification.CATEGORY_ALARM)
                .setAutoCancel(true)
                .setContentIntent(Notif.openApp(ctx, "timers"))
                .build();
        Notif.show(ctx, "timer:" + id, nid(id), n);
        if (tellPc) send(t, "done");
    }
}
