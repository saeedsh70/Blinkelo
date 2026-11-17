package com.saeedsh.islandlink;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;

/** Notification channels, ids and small builder helpers. */
public final class Notif {
    private Notif() {}

    public static final String CH_SERVICE = "service";
    public static final String CH_PAIR = "pair";
    public static final String CH_TRANSFER = "transfer";
    public static final String CH_PC = "pc";
    public static final String CH_FIND = "find";
    public static final String CH_TIMER = "timer";
    public static final String CH_MEDIA = "media";
    public static final String CH_GAME = "game";

    public static final int ID_SERVICE = 1;
    public static final int ID_PAIR = 2;
    public static final int ID_FIND = 3;
    public static final int ID_PC_MEDIA = 4;
    public static final int ID_CAMERA = 5;
    public static final int ID_CLIP = 6;
    public static final int ID_GAME = 8;
    public static final int ID_GAME_SUMMARY = 9;
    public static final int ID_TRANSFER_BASE = 1000;
    public static final int ID_PC_BASE = 3000;
    public static final int ID_TIMER_BASE = 5000;
    public static final int ID_TASK_BASE = 7000;

    public static void createChannels(Context ctx) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        channel(nm, CH_SERVICE, Strings.t(ctx, "ch_service"), NotificationManager.IMPORTANCE_MIN, false);
        channel(nm, CH_PAIR, Strings.t(ctx, "ch_pair"), NotificationManager.IMPORTANCE_HIGH, true);
        channel(nm, CH_TRANSFER, Strings.t(ctx, "ch_transfer"), NotificationManager.IMPORTANCE_LOW, false);
        channel(nm, CH_PC, Strings.t(ctx, "ch_pc"), NotificationManager.IMPORTANCE_DEFAULT, true);
        channel(nm, CH_FIND, Strings.t(ctx, "ch_find"), NotificationManager.IMPORTANCE_HIGH, false);
        channel(nm, CH_TIMER, Strings.t(ctx, "ch_timer"), NotificationManager.IMPORTANCE_HIGH, true);
        channel(nm, CH_MEDIA, Strings.t(ctx, "ch_media"), NotificationManager.IMPORTANCE_LOW, false);
        channel(nm, CH_GAME, Strings.t(ctx, "ch_game"), NotificationManager.IMPORTANCE_LOW, false);
    }

    private static void channel(NotificationManager nm, String id, String name, int importance, boolean sound) {
        NotificationChannel c = new NotificationChannel(id, name, importance);
        if (!sound) c.setSound(null, null);
        c.setShowBadge(CH_PC.equals(id) || CH_PAIR.equals(id));
        if (CH_FIND.equals(id)) c.setBypassDnd(true);
        nm.createNotificationChannel(c);
    }

    public static Notification.Builder builder(Context ctx, String channel) {
        return new Notification.Builder(ctx, channel)
                .setSmallIcon(R.drawable.ic_stat)
                .setColor(Color.parseColor("#0A84FF"));
    }

    public static void show(Context ctx, int id, Notification n) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        try { nm.notify(id, n); } catch (SecurityException ignored) { /* notifications not allowed */ }
    }

    public static void cancel(Context ctx, int id) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) nm.cancel(id);
    }

    public static void show(Context ctx, String tag, int id, Notification n) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) try { nm.notify(tag, id, n); } catch (SecurityException ignored) {}
    }

    public static void cancel(Context ctx, String tag, int id) {
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm != null) nm.cancel(tag, id);
    }

    private static Intent uniqueAction(Context ctx, String action, String... extras) {
        android.net.Uri.Builder key = new android.net.Uri.Builder().scheme("islandlink").authority("action").appendPath(action);
        Intent i = new Intent(ctx, ActionReceiver.class).setAction(action);
        for (int k = 0; k + 1 < extras.length; k += 2) {
            i.putExtra(extras[k], extras[k + 1]); key.appendQueryParameter(extras[k], extras[k + 1]);
        }
        return i.setData(key.build());
    }

    static int flags() {
        return PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
    }

    public static PendingIntent openApp(Context ctx, String route) {
        Intent i = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (route != null) i.putExtra("route", route);
        return PendingIntent.getActivity(ctx, route == null ? 0 : route.hashCode(), i, flags());
    }

    public static PendingIntent activity(Context ctx, int req, Intent i) {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(ctx, req, i, flags());
    }

    /** A broadcast handled by {@link ActionReceiver}. */
    public static PendingIntent action(Context ctx, int req, String action, String... extras) {
        Intent i = uniqueAction(ctx, action, extras);
        return PendingIntent.getBroadcast(ctx, req, i, flags());
    }

    public static PendingIntent mutableAction(Context ctx, int req, String action, String... extras) {
        Intent i = uniqueAction(ctx, action, extras);
        int f = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, req, i, f);
    }
}
