package com.saeedsh.islandlink;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.RemoteInput;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.Icon;
import android.os.Bundle;
import android.os.Parcelable;
import android.service.notification.StatusBarNotification;

import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/** Mirrors phone notifications to the PC (KDE Connect "notification" packets), with reply/actions/dismiss. */
final class NotificationMirror {
    private static NotificationMirror instance;
    private final Context ctx;
    volatile NotifListener listener;
    private final Map<String, String> lastContent = new HashMap<String, String>();
    private final Map<String, Notification.Action> replies = new LinkedHashMap<String, Notification.Action>();
    private final Map<String, String> replyKeys = new HashMap<String, String>();
    private final Map<String, Notification> byKey = new HashMap<String, Notification>();
    private final Map<String, String> packages = new HashMap<String, String>();
    private final Map<String, byte[]> iconCache = new HashMap<String, byte[]>();

    private NotificationMirror(Context ctx) { this.ctx = ctx.getApplicationContext(); }

    static synchronized NotificationMirror get(Context ctx) {
        if (instance == null) instance = new NotificationMirror(ctx);
        return instance;
    }

    boolean hasAccess() { return listener != null; }

    // ------------------------------------------------------------------ filters
    private boolean enabled() {
        return Settings.section(ctx, "notifications").bool("mirror", true);
    }

    private boolean blocked(String pkg) {
        for (String b : Settings.section(ctx, "notifications").arrOrEmpty("blocked").strings()) if (b.equals(pkg)) return true;
        return false;
    }

    private boolean relevant(StatusBarNotification sbn) {
        if (sbn == null) return false;
        String pkg = sbn.getPackageName();
        if (ctx.getPackageName().equals(pkg)) return false;
        Notification n = sbn.getNotification();
        if (n == null) return false;
        int f = n.flags;
        if ((f & Notification.FLAG_GROUP_SUMMARY) != 0) return false;
        if ((f & Notification.FLAG_FOREGROUND_SERVICE) != 0) return false;
        if ((f & Notification.FLAG_ONGOING_EVENT) != 0 && !Notification.CATEGORY_CALL.equals(n.category)) return false;
        if (Notification.CATEGORY_TRANSPORT.equals(n.category) || Notification.CATEGORY_PROGRESS.equals(n.category)) return false;
        if (n.extras != null && n.extras.containsKey(Notification.EXTRA_MEDIA_SESSION)) return false;
        return true;
    }

    // ------------------------------------------------------------------ events from the listener service
    void onPosted(StatusBarNotification sbn, boolean silent) {
        if (!relevant(sbn)) return;
        rememberApp(sbn.getPackageName());
        if (!enabled() || blocked(sbn.getPackageName())) return;
        Notification n = sbn.getNotification();
        Bundle ex = n.extras != null ? n.extras : new Bundle();
        String title = str(ex.getCharSequence(Notification.EXTRA_TITLE));
        String text = str(ex.getCharSequence(Notification.EXTRA_BIG_TEXT));
        if (text.isEmpty()) text = str(ex.getCharSequence(Notification.EXTRA_TEXT));
        String messaging = lastMessage(ex);
        if (!messaging.isEmpty()) text = messaging;
        if (title.isEmpty() && text.isEmpty()) return;
        String key = sbn.getKey();
        String content = title + "\u0000" + text;
        if (!silent && content.equals(lastContent.get(key))) return; // same notification re-posted
        lastContent.put(key, content);
        byKey.put(key, n);
        packages.put(key, sbn.getPackageName());
        forgetReplies(key);

        String app = Util.appLabel(ctx, sbn.getPackageName());
        Json.Obj body = new Json.Obj()
                .p("id", key)
                .p("appName", app)
                .p("title", title)
                .p("text", text)
                .p("ticker", title.isEmpty() ? text : title + ": " + text)
                .p("isClearable", sbn.isClearable())
                .p("time", Long.toString(sbn.getPostTime()))
                .p("silent", silent);
        Json.Arr actions = new Json.Arr();
        if (n.actions != null) {
            for (Notification.Action a : n.actions) {
                if (a == null || a.title == null) continue;
                RemoteInput[] inputs = a.getRemoteInputs();
                boolean isReply = false;
                if (inputs != null) for (RemoteInput ri : inputs) if (ri.getAllowFreeFormInput()) isReply = true;
                if (isReply) {
                    String rid = UUID.randomUUID().toString();
                    replies.put(rid, a);
                    replyKeys.put(rid, key);
                    trimReplies();
                    body.p("requestReplyId", rid);
                } else {
                    actions.add(a.title.toString());
                }
            }
        }
        if (!actions.isEmpty()) body.p("actions", actions);
        Packet p = Packet.of("kdeconnect.notification", body);
        byte[] icon = iconFor(sbn, n);
        if (icon != null) {
            body.p("payloadHash", Util.md5(icon));
            p.withPayload(icon);
        }
        LinkService s = LinkService.get();
        if (s != null) s.send(p);
    }

    void onRemoved(StatusBarNotification sbn) {
        if (sbn == null) return;
        String key = sbn.getKey();
        if (lastContent.remove(key) == null) return;
        byKey.remove(key);
        packages.remove(key);
        forgetReplies(key);
        LinkService s = LinkService.get();
        if (s != null) s.send(Packet.of("kdeconnect.notification", new Json.Obj().p("id", key).p("isCancel", true)));
    }

    // ------------------------------------------------------------------ requests from the PC
    void onRequest(Json.Obj b) {
        if (!enabled()) return;
        if (b.has("cancel")) {
            NotifListener l = listener;
            String key = b.str("cancel");
            if (l != null && allowed(key)) try { l.cancelNotification(key); } catch (Exception ignored) { /* ignore */ }
            return;
        }
        if (b.bool("request")) {
            NotifListener l = listener;
            if (l == null) return;
            try {
                StatusBarNotification[] all = l.getActiveNotifications();
                if (all != null) for (StatusBarNotification sbn : all) onPosted(sbn, true);
            } catch (Exception e) {
                Util.log("active notifications: " + e);
            }
        }
    }

    void reply(String replyId, String message) {
        if (!enabled() || !allowed(replyKeys.get(replyId))) return;
        Notification.Action a = replies.get(replyId);
        if (a == null || a.actionIntent == null || message.isEmpty()) return;
        RemoteInput[] inputs = a.getRemoteInputs();
        if (inputs == null) return;
        Intent fill = new Intent();
        Bundle results = new Bundle();
        for (RemoteInput ri : inputs) results.putCharSequence(ri.getResultKey(), message);
        RemoteInput.addResultsToIntent(inputs, fill, results);
        try {
            a.actionIntent.send(ctx, 0, fill);
        } catch (PendingIntent.CanceledException e) {
            Util.log("reply failed: " + e);
        }
    }

    void action(String key, String title) {
        if (!enabled() || !allowed(key)) return;
        Notification n = byKey.get(key);
        if (n == null || n.actions == null) return;
        for (Notification.Action a : n.actions) {
            if (a != null && a.actionIntent != null && a.title != null && a.title.toString().equals(title)) {
                try { a.actionIntent.send(); } catch (PendingIntent.CanceledException e) { Util.log("action failed: " + e); }
                return;
            }
        }
    }

    // ------------------------------------------------------------------ helpers
    private void trimReplies() {
        while (replies.size() > 60) {
            String id = replies.keySet().iterator().next();
            replies.remove(id);
            replyKeys.remove(id);
        }
    }

    private boolean allowed(String key) {
        String pkg = packages.get(key);
        return pkg != null && byKey.containsKey(key) && !blocked(pkg);
    }

    private void forgetReplies(String key) {
        for (String id : new java.util.ArrayList<String>(replyKeys.keySet())) {
            if (key.equals(replyKeys.get(id))) { replyKeys.remove(id); replies.remove(id); }
        }
    }

    private static String str(CharSequence cs) { return cs == null ? "" : cs.toString().trim(); }

    private static String lastMessage(Bundle ex) {
        Parcelable[] msgs = ex.getParcelableArray(Notification.EXTRA_MESSAGES);
        if (msgs == null || msgs.length == 0) return "";
        Parcelable last = msgs[msgs.length - 1];
        if (!(last instanceof Bundle)) return "";
        Bundle m = (Bundle) last;
        CharSequence text = m.getCharSequence("text");
        CharSequence sender = m.getCharSequence("sender");
        if (text == null) return "";
        return sender != null && msgs.length > 1 ? sender + ": " + text : text.toString();
    }

    private byte[] iconFor(StatusBarNotification sbn, Notification n) {
        try {
            Bitmap bmp = null;
            Icon large = n.getLargeIcon();
            if (large != null) {
                Drawable d = large.loadDrawable(ctx);
                bmp = Util.drawableToBitmap(d, 96);
            }
            if (bmp == null) {
                String pkg = sbn.getPackageName();
                byte[] cached = iconCache.get(pkg);
                if (cached != null) return cached;
                bmp = Util.drawableToBitmap(Util.appIcon(ctx, pkg), 96);
                byte[] png = Util.png(bmp);
                if (png != null) iconCache.put(pkg, png);
                return png;
            }
            return Util.png(bmp);
        } catch (Exception e) {
            return null;
        }
    }

    private void rememberApp(String pkg) {
        String raw = Settings.state(ctx, "notifApps", "{}");
        Json.Obj apps = Json.parseObj(raw);
        if (apps == null) apps = new Json.Obj();
        if (apps.has(pkg)) return;
        apps.p(pkg, Util.appLabel(ctx, pkg));
        Settings.setState(ctx, "notifApps", Json.stringify(apps));
    }

    Json.Arr apps() {
        Json.Obj apps = Json.parseObj(Settings.state(ctx, "notifApps", "{}"));
        Json.Arr out = new Json.Arr();
        if (apps == null) return out;
        for (String pkg : apps.keySet()) out.add(new Json.Obj().p("pkg", pkg).p("name", apps.str(pkg)).p("blocked", blocked(pkg)));
        return out;
    }
}
