package com.saeedsh.islandlink;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.net.Uri;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;

import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

import java.util.Collections;

/** JavaScript ↔ native bridge. One entry point: call(method, jsonArgs) → json. */
final class Bridge {
    private final MainActivity act;

    Bridge(MainActivity act) { this.act = act; }

    @JavascriptInterface
    public String call(String method, String argsJson) {
        try {
            Json.Obj a = Json.parseObj(argsJson == null || argsJson.isEmpty() ? "{}" : argsJson);
            if (a == null) a = new Json.Obj();
            Object r = dispatch(method, a);
            return Json.stringify(new Json.Obj().p("ok", true).p("result", r));
        } catch (Exception e) {
            Util.log("bridge " + method + " failed: " + e);
            return Json.stringify(new Json.Obj().p("ok", false).p("error", String.valueOf(e.getMessage())));
        }
    }

    private Object dispatch(String m, Json.Obj a) {
        LinkService s = LinkService.get();
        switch (m) {
            case "state": {
                Json.Obj st = s != null ? s.state() : new Json.Obj().p("ready", false).p("devices", new Json.Arr());
                Json.Obj cache = Json.parseObj(UiBus.snapshot());
                if (cache == null) cache = new Json.Obj();
                cache.p("tasks", tasks(s).all()).p("timers", timers(s).list());
                return st.p("settings", Settings.get(act)).p("permissions", Permissions.state(act)).p("lang", Strings.lang(act))
                        .p("version", BuildConfig.VERSION_NAME).p("cache", cache)
                        .p("service", s != null);
            }
            case "onboarded":
                Settings.update(act, new Json.Obj().p("onboarded", true));
                LinkService.start(act);
                return true;
            case "pair": return s != null && s.core.requestPair(a.str("id"));
            case "selectDevice": return s != null && s.selectDevice(a.str("id"));
            case "unpair": return s != null && s.core.unpair(a.str("id"));
            case "acceptPair": return s != null && s.core.acceptPair(a.str("id"));
            case "rejectPair": return s != null && s.core.rejectPair(a.str("id"));
            case "connectIp":
                if (s != null) s.core.connectIp(a.str("ip").trim());
                return s != null;
            case "refresh":
                if (s == null) LinkService.start(act);
                else LinkService.command(act, LinkService.ACTION_REFRESH);
                return true;
            case "send": {
                if (s == null) return false;
                Json.Obj body = a.objOrEmpty("body");
                Packet packet = Packet.of(a.str("type"), body);
                return a.has("deviceId") ? s.sendTo(a.str("deviceId"), packet) : s.send(packet);
            }
            case "setSettings": {
                Json.Obj patch = a.objOrEmpty("patch");
                Json.Obj out = Settings.update(act, patch);
                if (patch.has("language")) Notif.createChannels(act);
                if (s != null) {
                    if (patch.has("bluetooth")) { if (out.bool("bluetooth", true)) s.startBluetooth(); else s.stopBluetooth(); }
                    if (patch.has("deviceName")) s.core.broadcast();
                    if (patch.has("language")) s.refreshServiceNotification();
                    if (patch.has("media") && !out.objOrEmpty("media").bool("pcNotification", true)) s.plugins.pcMedia.hide();
                }
                if (patch.has("media")) act.runOnUiThread(new Runnable() {
                    public void run() { MediaMirror.get(act).settingsChanged(); }
                });
                return out;
            }
            case "permission":
                act.runOnUiThread(new PermissionAsk(a.str("kind")));
                return true;
            case "permissions": return Permissions.state(act);
            case "pickFiles": act.pickFiles(); return true;
            case "takePhoto": {
                if (s == null || s.active() == null) return false;
                String targetId = a.str("deviceId", s.active().id);
                act.openExternal(new Intent(act, CameraActivity.class).putExtra("deviceId", targetId));
                return true;
            }
            case "sendClipboard":
                if (s == null || s.active() == null) return false;
                act.runOnUiThread(new Runnable() {
                    public void run() { sendClipboard(LinkService.get()); }
                });
                return true;
            case "sendText": return s != null && s.plugins.transfers.sendText(a.str("text"));
            case "sendUrl": return s != null && s.plugins.transfers.sendUrl(a.str("url"));
            case "tasks": return tasks(s).all();
            case "taskAdd": return tasks(s).add(a.objOrEmpty("task"));
            case "taskUpdate": return tasks(s).update(a.str("id"), a.objOrEmpty("patch"));
            case "taskRemove": return tasks(s).remove(a.str("id"));
            case "tasksClearDone": return tasks(s).clearDone(a.str("date"));
            case "timers": return timers(s).list();
            case "timerStart": return timers(s).start(a.lng("ms", 0), a.str("label", ""));
            case "timerCancel":
                timers(s).cancel(a.str("id"), true);
                return true;
            case "received": return s != null ? s.plugins.transfers.recent() : new Json.Arr();
            case "openUri": {
                Uri u = Uri.parse(a.str("uri"));
                requireContentUri(u);
                Intent i = new Intent(Intent.ACTION_VIEW).setDataAndType(u, a.str("mime", Util.mimeOf(a.str("name", ""))))
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                act.openExternal(Intent.createChooser(i, a.str("name", "")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return true;
            }
            case "shareUri": {
                Uri u = Uri.parse(a.str("uri"));
                requireContentUri(u);
                Intent i = new Intent(Intent.ACTION_SEND).setType(a.str("mime", "*/*")).putExtra(Intent.EXTRA_STREAM, u)
                        .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                act.openExternal(Intent.createChooser(i, a.str("name", "")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return true;
            }
            case "openUrl": {
                Uri u = Uri.parse(a.str("url"));
                if (!MainActivity.isWebUrl(u)) throw new IllegalArgumentException("Unsupported link");
                act.openExternal(new Intent(Intent.ACTION_VIEW, u).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
                return true;
            }
            case "copy": {
                final String text = a.str("text");
                act.runOnUiThread(new Runnable() {
                    public void run() {
                        ClipboardManager cm = act.getSystemService(ClipboardManager.class);
                        if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("Blinkelo Link", text));
                    }
                });
                return true;
            }
            case "vibrate": {
                Vibrator v = act.getSystemService(Vibrator.class);
                if (v != null && Settings.section(act, "touchpad").bool("haptics", true)) {
                    int ms = Math.max(5, Math.min(200, a.integer("ms", 12)));
                    v.vibrate(VibrationEffect.createOneShot(ms, Math.max(1, Math.min(255, a.integer("amp", 80)))));
                }
                return true;
            }
            case "keepScreenOn": act.setKeepScreenOn(a.bool("on")); return true;
            case "volumeKeys": act.volumeMode = a.str("mode", "off"); return true;
            case "toast": Util.toast(act, a.str("text")); return true;
            case "notifApps": return NotificationMirror.get(act).apps();
            case "setNotifBlocked": {
                java.util.List<String> list = new java.util.ArrayList<String>(Settings.section(act, "notifications").arrOrEmpty("blocked").strings());
                String pkg = a.str("pkg");
                list.remove(pkg);
                if (a.bool("blocked")) list.add(pkg);
                Settings.update(act, new Json.Obj().p("notifications", new Json.Obj().p("blocked", Json.arrOf(list))));
                return true;
            }
            case "stopService":
                LinkService.command(act, LinkService.ACTION_STOP);
                return true;
            case "startService":
                LinkService.start(act);
                return true;
            default:
                throw new IllegalArgumentException("unknown method " + m);
        }
    }

    private Tasks tasks(LinkService s) {
        return s != null && s.plugins != null ? s.plugins.tasks : new Tasks(act);
    }

    private Timers timers(LinkService s) {
        return s != null && s.plugins != null ? s.plugins.timers : new Timers(act);
    }

    private static void requireContentUri(Uri uri) {
        if (!"content".equals(uri.getScheme())) throw new IllegalArgumentException("Unsupported file URI");
    }

    private boolean sendClipboard(LinkService s) {
        if (s == null || s.active() == null) return false;
        ClipboardManager cm = act.getSystemService(ClipboardManager.class);
        ClipData clip = cm != null ? cm.getPrimaryClip() : null;
        if (clip == null || clip.getItemCount() == 0) {
            Util.toast(act, Strings.t(act, "clip_empty"));
            return false;
        }
        ClipData.Item item = clip.getItemAt(0);
        if (item.getUri() != null && clip.getDescription() != null && clip.getDescription().hasMimeType("image/*")) {
            return s.plugins.transfers.sendUris(Collections.singletonList(item.getUri())) > 0;
        }
        CharSequence text = item.coerceToText(act);
        boolean ok = text != null && s.plugins.sendClipboardText(text.toString());
        if (ok) Util.toast(act, Strings.t(act, "clip_sent", "pc", s.activeName()));
        return ok;
    }

    private final class PermissionAsk implements Runnable {
        private final String kind;
        PermissionAsk(String kind) { this.kind = kind; }
        public void run() { Permissions.request(act, kind); }
    }
}
