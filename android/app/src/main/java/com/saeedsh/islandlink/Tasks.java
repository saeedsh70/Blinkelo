package com.saeedsh.islandlink;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import com.saeedsh.islandlink.core.Core;
import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Shared planner tasks. The same list lives on the PC (Blinkelo planner tab); both sides merge
 * by last-writer-wins per task, deletions are kept as tombstones for a while.
 */
final class Tasks {
    private static final long TOMBSTONE_KEEP = 30L * 86400000L;
    private final Context ctx;
    private final File file;
    private Json.Arr tasks = new Json.Arr();
    private Json.Obj tombstones = new Json.Obj();

    Tasks(Context ctx) {
        this.ctx = ctx;
        this.file = new File(ctx.getFilesDir(), "tasks.json");
        load();
    }

    private synchronized void load() {
        try {
            if (file.exists()) {
                Json.Obj j = Json.parseObj(Core.readText(file));
                if (j != null) {
                    tasks = new Json.Arr();
                    for (Object item : j.arrOrEmpty("tasks")) {
                        if (!(item instanceof Json.Obj)) continue;
                        Json.Obj task = (Json.Obj) item;
                        if (!task.str("id", "").isEmpty() && !task.str("title", "").trim().isEmpty()) tasks.add(task);
                    }
                    tombstones = j.objOrEmpty("tombstones");
                }
            }
        } catch (Exception e) {
            Util.log("tasks load: " + e);
        }
    }

    private synchronized void save() {
        long cutoff = System.currentTimeMillis() - TOMBSTONE_KEEP;
        for (String id : new ArrayList<String>(tombstones.keySet())) if (tombstones.lng(id, 0) < cutoff) tombstones.remove(id);
        try {
            Core.writeText(file, Json.stringify(new Json.Obj().p("tasks", tasks).p("tombstones", tombstones)));
        } catch (Exception e) {
            Util.log("tasks save: " + e);
        }
    }

    synchronized Json.Arr all() {
        List<Object> copy = new ArrayList<Object>(tasks);
        Collections.sort(copy, new Comparator<Object>() {
            public int compare(Object a, Object b) {
                Json.Obj x = (Json.Obj) a, y = (Json.Obj) b;
                int c = x.str("date").compareTo(y.str("date"));
                if (c != 0) return c;
                String tx = x.str("time", "99:99"), ty = y.str("time", "99:99");
                if (tx.isEmpty()) tx = "99:99";
                if (ty.isEmpty()) ty = "99:99";
                c = tx.compareTo(ty);
                if (c != 0) return c;
                return Long.compare(x.lng("created", 0), y.lng("created", 0));
            }
        });
        return new Json.Arr(copy);
    }

    private Json.Obj find(String id) {
        for (Object o : tasks) if (o instanceof Json.Obj && ((Json.Obj) o).str("id").equals(id)) return (Json.Obj) o;
        return null;
    }

    private static String clean(String s, int max) {
        String t = s == null ? "" : s.replaceAll("[\\u0000-\\u001f]", " ").trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    // ------------------------------------------------------------------ local edits (from the UI)
    synchronized Json.Obj add(Json.Obj in) {
        String title = clean(in.str("title", ""), 200);
        if (title.isEmpty()) return null;
        long now = System.currentTimeMillis();
        String time = in.str("time", "");
        Json.Obj t = new Json.Obj()
                .p("id", UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                .p("title", title)
                .p("date", in.str("date", today()))
                .p("time", time.matches("\\d{2}:\\d{2}") ? time : null)
                .p("done", false)
                .p("color", in.str("color", "blue"))
                .p("created", now)
                .p("updated", now)
                .p("reminded", false);
        tasks.add(t);
        changed(t, null);
        return t;
    }

    synchronized Json.Obj update(String id, Json.Obj patch) {
        Json.Obj t = find(id);
        if (t == null) return null;
        for (String k : new String[] {"title", "date", "time", "done", "color"}) {
            if (!patch.containsKey(k)) continue;
            Object v = patch.get(k);
            if ("title".equals(k)) v = clean(String.valueOf(v), 200);
            if ("time".equals(k) && (v == null || !String.valueOf(v).matches("\\d{2}:\\d{2}"))) v = null;
            t.put(k, v);
        }
        if (patch.containsKey("date") || patch.containsKey("time")) t.put("reminded", false);
        t.put("updated", System.currentTimeMillis());
        changed(t, null);
        return t;
    }

    synchronized boolean remove(String id) {
        Json.Obj t = find(id);
        if (t == null) return false;
        tasks.remove(t);
        long now = System.currentTimeMillis();
        tombstones.put(id, now);
        cancelAlarm(id);
        changed(null, new Json.Obj().p("op", "remove").p("id", id).p("at", now));
        return true;
    }

    synchronized int clearDone() {
        return clearDone(null);
    }

    synchronized int clearDone(String date) {
        int n = 0;
        for (Object o : new ArrayList<Object>(tasks)) {
            Json.Obj t = (Json.Obj) o;
            if (t.bool("done") && (date == null || date.equals(t.str("date"))) && remove(t.str("id"))) n++;
        }
        return n;
    }

    private void changed(Json.Obj upsert, Json.Obj packet) {
        save();
        if (upsert != null) schedule(upsert);
        LinkService s = LinkService.get();
        if (s != null) {
            Json.Obj body = packet != null ? packet : new Json.Obj().p("op", "upsert").p("task", upsert);
            s.send(Packet.of("island.tasks", body));
        }
        UiBus.emit("tasks", all());
    }

    // ------------------------------------------------------------------ sync with the PC
    void sendSync() {
        LinkService s = LinkService.get();
        if (s == null) return;
        Json.Obj body;
        synchronized (this) {
            body = new Json.Obj().p("op", "sync").p("tasks", new Json.Arr(tasks)).p("tombstones", new Json.Obj(tombstones));
        }
        s.send(Packet.of("island.tasks", body));
    }

    synchronized void onPacket(Json.Obj b) {
        String op = b.str("op", "");
        boolean dirty = false;
        if ("sync".equals(op)) {
            Json.Obj ts = b.objOrEmpty("tombstones");
            for (String id : ts.keySet()) dirty |= applyRemove(id, ts.lng(id, 0));
            for (Object o : b.arrOrEmpty("tasks")) if (o instanceof Json.Obj) dirty |= applyUpsert((Json.Obj) o);
        } else if ("upsert".equals(op)) {
            Json.Obj t = b.obj("task");
            if (t != null) dirty = applyUpsert(t);
        } else if ("remove".equals(op)) {
            dirty = applyRemove(b.str("id", ""), b.lng("at", System.currentTimeMillis()));
        }
        if (dirty) {
            save();
            scheduleAll();
            UiBus.emit("tasks", all());
        }
    }

    private boolean applyUpsert(Json.Obj remote) {
        String id = remote.str("id", "");
        if (id.isEmpty() || clean(remote.str("title", ""), 200).isEmpty()) return false;
        long ru = remote.lng("updated", remote.lng("created", 0));
        if (tombstones.has(id) && tombstones.lng(id, 0) >= ru) return false;
        Json.Obj local = find(id);
        if (local != null && local.lng("updated", local.lng("created", 0)) >= ru) return false;
        Json.Obj t = new Json.Obj()
                .p("id", id)
                .p("title", clean(remote.str("title"), 200))
                .p("date", remote.str("date", today()))
                .p("time", remote.str("time", "").matches("\\d{2}:\\d{2}") ? remote.str("time") : null)
                .p("done", remote.bool("done"))
                .p("color", remote.str("color", "blue"))
                .p("created", remote.lng("created", ru))
                .p("updated", ru)
                .p("reminded", local != null && local.bool("reminded") && local.str("date").equals(remote.str("date")) && local.str("time", "").equals(remote.str("time", "")));
        if (local != null) tasks.remove(local);
        tasks.add(t);
        tombstones.remove(id);
        return true;
    }

    private boolean applyRemove(String id, long at) {
        if (id.isEmpty() || at <= 0) return false;
        Json.Obj local = find(id);
        if (local != null && local.lng("updated", 0) > at) return false;
        boolean had = local != null;
        if (local != null) tasks.remove(local);
        boolean changed = !tombstones.has(id) || tombstones.lng(id, 0) < at;
        if (changed) tombstones.put(id, at);
        if (had) cancelAlarm(id);
        return had || changed;
    }

    // ------------------------------------------------------------------ reminders
    static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()); }

    private static long dueAt(Json.Obj t) {
        String time = t.str("time", "");
        if (time.isEmpty() || "null".equals(time)) return -1;
        try {
            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US);
            format.setLenient(false);
            String value = t.str("date") + " " + time;
            Date d = format.parse(value);
            if (d == null || !format.format(d).equals(value)) return -1;
            return d != null ? d.getTime() : -1;
        } catch (Exception e) {
            return -1;
        }
    }

    synchronized void scheduleAll() {
        for (Object o : tasks) schedule((Json.Obj) o);
    }

    private void schedule(Json.Obj t) {
        String id = t.str("id");
        long at = dueAt(t);
        if (at <= System.currentTimeMillis() || t.bool("done") || t.bool("reminded")) { cancelAlarm(id); return; }
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null) return;
        PendingIntent pi = alarmIntent(id, t.str("title"));
        try {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    private PendingIntent alarmIntent(String id, String title) {
        Intent i = new Intent(ctx, ActionReceiver.class).setAction(ActionReceiver.TASK_ALARM)
                .setData(new Uri.Builder().scheme("islandlink").authority("task").appendPath(id).build())
                .putExtra("id", id).putExtra("title", title);
        return PendingIntent.getBroadcast(ctx, ("task" + id).hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void cancelAlarm(String id) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(alarmIntent(id, ""));
    }

    /** The alarm fired: notify and mark as reminded (the PC reminds on its own side too). */
    synchronized void onAlarm(String id) {
        Json.Obj t = find(id);
        if (t == null || t.bool("done") || t.bool("reminded")) return;
        t.put("reminded", true);
        save();
        int nid = Notif.ID_TASK_BASE + ((id.hashCode() & Integer.MAX_VALUE) % 1000);
        Notification n = Notif.builder(ctx, Notif.CH_TIMER)
                .setContentTitle(Strings.t(ctx, "task_reminder"))
                .setContentText(t.str("title"))
                .setCategory(Notification.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setContentIntent(Notif.openApp(ctx, "planner"))
                .addAction(new Notification.Action.Builder(null, Strings.t(ctx, "act_done"),
                        Notif.action(ctx, nid, ActionReceiver.TASK_DONE, "id", id)).build())
                .build();
        Notif.show(ctx, "task:" + id, nid, n);
    }
}
