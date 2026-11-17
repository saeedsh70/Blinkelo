package com.saeedsh.islandlink;

import android.app.Notification;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.drawable.Icon;
import android.os.BatteryManager;
import android.os.Build;

import com.saeedsh.islandlink.core.Core;
import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

import java.util.LinkedHashMap;
import java.util.Map;

/** Routes packets from the PC to the features, and offers the outgoing helpers the UI uses. */
final class Plugins {
    static final String[] FEATURES = {
            "notifications", "mpris", "telephony", "sms", "battery", "findmyphone", "clipboard", "share", "mousepad",
            "presenter", "systemvolume", "runcommand", "sysinfo", "apps", "screenshot", "pcmedia", "tasks", "timers",
            "camera", "pcnotify", "findpc", "bluetooth", "clipboard-image", "transfer-ack", "game"};

    private final LinkService svc;
    final Transfers transfers;
    final Tasks tasks;
    final Timers timers;
    final PcMedia pcMedia;
    final GameMirror game;
    private Json.Obj pcInfo = new Json.Obj();
    private BroadcastReceiver batteryReceiver;
    private int lastCharge = -1;
    private boolean lastCharging;
    private final Map<String, Integer> pcNotifIds = new LinkedHashMap<String, Integer>();
    private int nextPcNotifId;
    private Json.Obj volume = new Json.Obj();

    Plugins(LinkService svc) {
        this.svc = svc;
        this.transfers = new Transfers(svc);
        this.tasks = new Tasks(svc);
        this.timers = new Timers(svc);
        this.pcMedia = new PcMedia(svc);
        this.game = new GameMirror(svc);
    }

    Json.Obj pcInfo() { return pcInfo; }

    void start() {
        batteryReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context c, Intent i) { onBattery(i, false); }
        };
        Intent sticky = Util.registerSticky(svc, batteryReceiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (sticky != null) onBattery(sticky, false);
        tasks.scheduleAll();
        timers.restore();
        UiBus.emit("tasks", tasks.all());
        UiBus.emit("timers", timers.list());
        UiBus.emit("received", transfers.recent());
        MediaMirror.get(svc).attachIfPossible();
    }

    void stop() {
        if (batteryReceiver != null) try { svc.unregisterReceiver(batteryReceiver); } catch (Exception ignored) { /* ignore */ }
        pcMedia.hide();
    }

    // ------------------------------------------------------------------ connection events
    void onConnected(Core.Device d) {
        svc.send(Packet.of("island.hello", new Json.Obj().p("app", "Blinkelo Link").p("version", BuildConfig.VERSION_NAME)
                .p("platform", "android").p("sdk", Build.VERSION.SDK_INT).p("model", Build.MANUFACTURER + " " + Build.MODEL)
                .p("features", Json.arr((Object[]) FEATURES))));
        sendBattery(true);
        tasks.sendSync();
        timers.sendAll();
        svc.send(Packet.of("kdeconnect.systemvolume.request", new Json.Obj().p("requestSinks", true)));
        svc.send(Packet.of("kdeconnect.runcommand.request", new Json.Obj().p("requestCommandList", true)));
        svc.send(Packet.of("island.apps.request", new Json.Obj()));
        MediaMirror.get(svc).sendPlayerList();
        svc.refreshServiceNotification();
    }

    void onDisconnected(Core.Device d) {
        game.clear();
        if (svc.active() != null) return; // still connected to another PC
        clearPeer();
    }

    void clearPeer() {
        pcMedia.clear();
        game.clear();
        for (Integer id : pcNotifIds.values()) Notif.cancel(svc, id);
        pcNotifIds.clear();
        Notif.cancel(svc, Notif.ID_CAMERA);
        for (String event : new String[] {"sysinfo", "apps", "volume", "commands", "hello", "screenshot"}) UiBus.forget(event);
        volume = new Json.Obj();
        UiBus.emit("pcmedia", new Json.Obj().p("present", false));
        pcInfo = new Json.Obj();
    }

    // ------------------------------------------------------------------ incoming packets
    void onPacket(Core.Device d, Packet p) {
        if ("island.transfer.result".equals(p.type)) { transfers.onTransferResult(d, p.body); return; }
        Core.Device selected = svc.active();
        if (selected == null || !selected.id.equals(d.id)) return;
        Json.Obj b = p.body;
        switch (p.type) {
            case "kdeconnect.ping":
                Util.toast(svc, "👋 " + d.name + (b.str("message", "").isEmpty() ? "" : ": " + b.str("message")));
                UiBus.emit("ping", new Json.Obj().p("from", d.name).p("message", b.str("message", "")));
                break;
            case "kdeconnect.battery.request":
                sendBattery(true);
                break;
            case "kdeconnect.notification.request":
                NotificationMirror.get(svc).onRequest(b);
                break;
            case "kdeconnect.notification.reply":
                NotificationMirror.get(svc).reply(b.str("requestReplyId", ""), b.str("message", ""));
                break;
            case "kdeconnect.notification.action":
                NotificationMirror.get(svc).action(b.str("key", ""), b.str("action", ""));
                break;
            case "kdeconnect.mpris.request":
                MediaMirror.get(svc).onRequest(b);
                break;
            case "kdeconnect.telephony.request_mute":
                CallReceiver.muteRinger(svc);
                break;
            case "kdeconnect.findmyphone.request":
                FindPhone.start(svc, d.name);
                break;
            case "kdeconnect.clipboard":
            case "kdeconnect.clipboard.connect":
                onRemoteClipboard(b.str("content", ""));
                break;
            case "kdeconnect.share.request":
                transfers.onShare(d, p);
                break;
            case "kdeconnect.sms.request":
                CallReceiver.sendSms(svc, b);
                break;
            case "kdeconnect.systemvolume":
                onVolume(b);
                break;
            case "kdeconnect.runcommand":
                onCommands(b);
                break;
            case "island.hello":
                pcInfo = b;
                UiBus.emit("hello", b);
                UiBus.emit("devices", svc.state());
                break;
            case "island.sysinfo":
                UiBus.emit("sysinfo", b);
                break;
            case "island.apps":
                UiBus.emit("apps", b);
                break;
            case "island.screenshot":
                transfers.onScreenshot(d, p);
                break;
            case "island.media":
                pcMedia.onMedia(b);
                break;
            case "island.tasks":
                tasks.onPacket(b);
                break;
            case "island.timer":
                timers.onRemote(b);
                break;
            case "island.camera.request":
                onCameraRequest(d, b);
                break;
            case "island.pcnotify":
                onPcNotify(b);
                break;
            case "island.clipboard.image":
                transfers.onClipboardImage(d, p);
                break;
            case "island.findpc.state":
                UiBus.emit("findpc", b);
                break;
            case "island.game":
                game.onPacket(b);
                break;
            default:
                break;
        }
    }

    // ------------------------------------------------------------------ battery
    private void onBattery(Intent i, boolean force) {
        int level = i.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = i.getIntExtra(BatteryManager.EXTRA_SCALE, 100);
        int status = i.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        if (level < 0 || scale <= 0) return;
        int charge = Math.round(level * 100f / scale);
        boolean charging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
        boolean changed = charge != lastCharge || charging != lastCharging;
        boolean crossedLow = !charging && charge <= 15 && (lastCharge > 15 || lastCharge < 0);
        lastCharge = charge;
        lastCharging = charging;
        if (changed || force) sendBatteryPacket(crossedLow);
    }

    void sendBattery(boolean force) {
        if (lastCharge < 0) return;
        if (force) sendBatteryPacket(false);
    }

    private void sendBatteryPacket(boolean low) {
        svc.send(Packet.of("kdeconnect.battery", new Json.Obj().p("currentCharge", lastCharge).p("isCharging", lastCharging)
                .p("thresholdEvent", low ? 1 : 0)));
    }

    // ------------------------------------------------------------------ clipboard
    private void onRemoteClipboard(String text) {
        if (text.isEmpty()) return;
        if (!Settings.section(svc, "clipboard").bool("receive", true)) return;
        ClipboardManager cm = svc.getSystemService(ClipboardManager.class);
        if (cm == null) return;
        try {
            cm.setPrimaryClip(ClipData.newPlainText("Blinkelo Link", text));
        } catch (Exception e) {
            Util.log("clipboard write failed: " + e);
        }
        UiBus.emit("clipboard", new Json.Obj().p("text", text).p("from", "pc"));
    }

    boolean sendClipboardText(String text) {
        if (text == null || text.isEmpty()) return false;
        return svc.send(Packet.of("kdeconnect.clipboard", new Json.Obj().p("content", text)));
    }

    // ------------------------------------------------------------------ PC volume / commands
    private void onVolume(Json.Obj b) {
        Json.Arr list = b.arr("sinkList");
        if (list != null) {
            volume = new Json.Obj().p("sinkList", list);
        } else if (b.has("name")) {
            Json.Arr cur = volume.arrOrEmpty("sinkList");
            for (Object o : cur) {
                if (o instanceof Json.Obj && ((Json.Obj) o).str("name").equals(b.str("name"))) {
                    Json.Obj s = (Json.Obj) o;
                    if (b.has("volume")) s.put("volume", b.get("volume"));
                    if (b.has("muted")) s.put("muted", b.get("muted"));
                    if (b.has("enabled")) s.put("enabled", b.get("enabled"));
                }
            }
            volume = new Json.Obj().p("sinkList", cur);
        }
        UiBus.emit("volume", volume);
    }

    private void onCommands(Json.Obj b) {
        Object raw = b.get("commandList");
        Json.Obj map = null;
        if (raw instanceof Json.Obj) map = (Json.Obj) raw;
        else if (raw instanceof String) map = Json.parseObj((String) raw);
        Json.Arr out = new Json.Arr();
        if (map != null) {
            for (String key : map.keySet()) {
                Json.Obj c = map.obj(key);
                if (c != null) out.add(new Json.Obj().p("key", key).p("name", c.str("name", key)).p("command", c.str("command", "")));
            }
        }
        UiBus.emit("commands", new Json.Obj().p("commands", out));
    }

    // ------------------------------------------------------------------ PC asks for a photo
    private void onCameraRequest(Core.Device d, Json.Obj b) {
        Intent cam = new Intent(svc, CameraActivity.class).putExtra("auto", true).putExtra("reason", "pc").putExtra("deviceId", d.id);
        Notification n = Notif.builder(svc, Notif.CH_PAIR)
                .setContentTitle(Strings.t(svc, "photo_request", "pc", d.name))
                .setContentText(Strings.t(svc, "photo_tap"))
                .setAutoCancel(true)
                .setTimeoutAfter(120000)
                .setContentIntent(Notif.activity(svc, 31, cam))
                .build();
        Notif.show(svc, Notif.ID_CAMERA, n);
        UiBus.emit("cameraRequest", new Json.Obj().p("from", d.name).p("deviceId", d.id));
    }

    // ------------------------------------------------------------------ PC notifications on the phone
    private void onPcNotify(Json.Obj b) {
        String id = b.str("id", "");
        if (id.isEmpty()) return;
        Integer nid = pcNotifIds.get(id);
        if (b.bool("cancel")) {
            if (nid != null) Notif.cancel(svc, nid);
            pcNotifIds.remove(id);
            return;
        }
        if (!Settings.get(svc).bool("pcNotifications", true)) return;
        if (nid == null) {
            if (pcNotifIds.size() >= 1000) {
                String oldest = pcNotifIds.keySet().iterator().next();
                Notif.cancel(svc, pcNotifIds.remove(oldest));
            }
            do { nid = Notif.ID_PC_BASE + ((nextPcNotifId++ & Integer.MAX_VALUE) % 1000); }
            while (pcNotifIds.containsValue(nid));
            pcNotifIds.put(id, nid);
        }
        String app = b.str("app", "PC");
        Notification.Builder nb = Notif.builder(svc, Notif.CH_PC)
                .setContentTitle(b.str("title", app))
                .setContentText(b.str("text", ""))
                .setStyle(new Notification.BigTextStyle().bigText(b.str("text", "")))
                .setSubText(app + " · " + svc.activeName())
                .setGroup("pc")
                .setAutoCancel(true)
                .setWhen(b.lng("time", System.currentTimeMillis()))
                .setShowWhen(true)
                .setContentIntent(Notif.openApp(svc, null));
        Bitmap icon = Util.decodeDataUrl(b.str("icon", ""));
        if (icon != null) nb.setLargeIcon(Icon.createWithBitmap(icon));
        Notif.show(svc, nid, nb.build());
    }
}
