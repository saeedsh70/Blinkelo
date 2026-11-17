package com.saeedsh.islandlink;
import android.content.Context;
import android.app.Notification;
import android.app.PendingIntent;
public class Notif {
    static final int ID_TIMER_BASE=5000, ID_TASK_BASE=7000;
    static final String CH_TIMER="timer", CH_MEDIA="media";
    static int shown;
    static java.util.Set<String> tags = new java.util.HashSet<String>();
    static Notification.Builder builder(Context c, String ch) { return new Notification.Builder(); }
    static PendingIntent openApp(Context c, String route) { return new PendingIntent(); }
    static PendingIntent action(Context c, int req, String action, String... extras) { return new PendingIntent(); }
    static void show(Context c, int id, Notification n) { shown++; }
    static void cancel(Context c, int id) {}
    static void show(Context c, String tag, int id, Notification n) { shown++; tags.add(tag); }
    static void cancel(Context c, String tag, int id) { tags.remove(tag); }
}
