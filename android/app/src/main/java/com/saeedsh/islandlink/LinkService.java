package com.saeedsh.islandlink;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings.Global;

import com.saeedsh.islandlink.core.Core;
import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Link;
import com.saeedsh.islandlink.core.Packet;

import java.io.File;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** Foreground service that owns the connection core and routes packets to the features. */
public class LinkService extends Service implements Core.Events {
    public static final String ACTION_REFRESH = "refresh";
    public static final String ACTION_STOP = "stop";

    private static volatile LinkService instance;
    // Keep startup/teardown ordered across service instances without doing TLS I/O on main.
    private static final ExecutorService LIFECYCLE = lifecycleExecutor();

    private static ExecutorService lifecycleExecutor() {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(1, 1, 30, TimeUnit.SECONDS,
                new LinkedBlockingQueue<Runnable>(), new ThreadFactory() {
                    public Thread newThread(Runnable action) {
                        Thread thread = new Thread(action, "island-lifecycle");
                        thread.setDaemon(true);
                        return thread;
                    }
                });
        executor.allowCoreThreadTimeOut(true);
        return executor;
    }

    Core core;
    Plugins plugins;
    private BtServer bt;
    private WifiManager.MulticastLock multicast;
    private ConnectivityManager.NetworkCallback netCallback;
    private volatile boolean coreReady;
    private volatile boolean destroyed;
    private boolean foregroundStarted;

    public static LinkService get() { return instance; }

    public static void start(Context ctx) {
        Intent i = new Intent(ctx, LinkService.class);
        try {
            ctx.startForegroundService(i);
        } catch (Exception e) {
            Util.log("cannot start service: " + e);
        }
    }

    public static void command(Context ctx, String action) {
        Intent i = new Intent(ctx, LinkService.class).setAction(action);
        try { ctx.startForegroundService(i); } catch (Exception e) { Util.log("command failed: " + e); }
    }

    // ------------------------------------------------------------------ lifecycle
    @Override public void onCreate() {
        super.onCreate();
        instance = this;
        Notif.createChannels(this);
        foregroundStarted = startInForeground(serviceNotification());
        if (!foregroundStarted) {
            stopSelf();
            return;
        }
        plugins = new Plugins(this);
        core = new Core(new Host(), this);
        LIFECYCLE.execute(new Runnable() {
            public void run() {
                try {
                    if (destroyed) return;
                    core.preferDevice(Settings.state(LinkService.this, "activePeer", ""));
                    core.start();
                    if (destroyed) {
                        core.close();
                        return;
                    }
                    Util.main(new Runnable() {
                        public void run() {
                            if (destroyed) return;
                            coreReady = true;
                            plugins.start();
                            startBluetooth();
                            onDevicesChanged();
                        }
                    });
                } catch (Exception e) {
                    Util.log("core start failed: " + e);
                    core.stop();
                    Util.main(new Runnable() {
                        public void run() { if (!destroyed) stopSelf(); }
                    });
                }
            }
        });
        acquireMulticast();
        watchNetwork();
    }

    private boolean startInForeground(Notification n) {
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(Notif.ID_SERVICE, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE);
            else startForeground(Notif.ID_SERVICE, n);
            return true;
        } catch (Exception e) {
            Util.log("startForeground failed: " + e);
            return false;
        }
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!foregroundStarted) return START_NOT_STICKY;
        if (ACTION_REFRESH.equals(action) && coreReady) {
            core.broadcast();
            restartBluetooth();
        }
        return START_STICKY;
    }

    @Override public void onDestroy() {
        destroyed = true;
        coreReady = false;
        if (instance == this) instance = null;
        if (plugins != null) plugins.stop();
        if (bt != null) bt.stop();
        final Core closingCore = core;
        if (closingCore != null) LIFECYCLE.execute(new Runnable() {
            public void run() { closingCore.close(); }
        });
        if (multicast != null && multicast.isHeld()) multicast.release();
        if (netCallback != null) {
            ConnectivityManager cm = getSystemService(ConnectivityManager.class);
            try { if (cm != null) cm.unregisterNetworkCallback(netCallback); } catch (Exception ignored) { /* ignore */ }
        }
        for (String event : new String[] {"sysinfo", "apps", "volume", "commands", "hello", "pcmedia", "screenshot"}) UiBus.forget(event);
        UiBus.emit("devices", new Json.Obj().p("ready", false).p("service", false).p("active", null)
                .p("pc", new Json.Obj()).p("devices", new Json.Arr()));
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    private void acquireMulticast() {
        try {
            WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                multicast = wm.createMulticastLock("island-discovery");
                multicast.setReferenceCounted(false);
                multicast.acquire();
            }
        } catch (Exception e) {
            Util.log("multicast lock: " + e);
        }
    }

    private void watchNetwork() {
        ConnectivityManager cm = getSystemService(ConnectivityManager.class);
        if (cm == null) return;
        netCallback = new ConnectivityManager.NetworkCallback() {
            @Override public void onAvailable(Network network) {
                Util.mainDelayed(new Runnable() {
                    public void run() { if (!destroyed && coreReady) core.broadcast(); }
                }, 1500);
            }
        };
        try {
            cm.registerNetworkCallback(new NetworkRequest.Builder().addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                    .addTransportType(NetworkCapabilities.TRANSPORT_ETHERNET).build(), netCallback);
        } catch (Exception e) {
            Util.log("network callback: " + e);
        }
    }

    // ------------------------------------------------------------------ bluetooth
    void startBluetooth() {
        if (destroyed || !coreReady) return;
        if (!Settings.get(this).bool("bluetooth", true)) return;
        if (bt == null) bt = new BtServer(this);
        bt.start();
    }

    void restartBluetooth() {
        if (bt != null) bt.stop();
        bt = null;
        startBluetooth();
    }

    void stopBluetooth() {
        if (bt != null) bt.stop();
        bt = null;
    }

    Json.Obj bluetoothState() {
        return BtServer.state(this, bt);
    }

    // ------------------------------------------------------------------ helpers for features / UI
    public boolean send(Packet p) {
        return coreReady && core.send(null, p);
    }

    public boolean sendTo(String id, Packet p) { return coreReady && core.send(id, p); }

    boolean selectDevice(String id) {
        if (!coreReady || !core.selectDevice(id)) return false;
        Settings.setState(this, "activePeer", id);
        plugins.clearPeer();
        Core.Device selected = active();
        if (selected != null) plugins.onConnected(selected);
        onDevicesChanged();
        return true;
    }

    public Core.Device active() {
        return coreReady ? core.activeDevice() : null;
    }

    public String activeName() {
        Core.Device d = active();
        return d != null ? d.name : "";
    }

    public Json.Obj state() {
        Json.Obj me = new Json.Obj();
        if (coreReady) me.p("id", core.deviceId()).p("name", Core.sanitizeName(deviceName())).p("port", core.tcpPort());
        Core.Device a = active();
        return new Json.Obj()
                .p("service", true)
                .p("ready", coreReady)
                .p("me", me)
                .p("devices", coreReady ? core.devicesJson() : new Json.Arr())
                .p("active", a != null ? a.toJson() : null)
                .p("pc", plugins != null ? plugins.pcInfo() : new Json.Obj())
                .p("bluetooth", bluetoothState())
                .p("ips", localIps());
    }

    String deviceName() {
        String custom = Settings.get(this).str("deviceName", "");
        if (!custom.trim().isEmpty()) return custom.trim();
        try {
            String n = Global.getString(getContentResolver(), "device_name");
            if (n != null && !n.trim().isEmpty()) return n;
        } catch (Exception ignored) { /* ignore */ }
        return Build.MODEL;
    }

    static Json.Arr localIps() {
        Json.Arr out = new Json.Arr();
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InterfaceAddress ia : ni.getInterfaceAddresses()) {
                    InetAddress a = ia.getAddress();
                    if (a instanceof java.net.Inet4Address) out.add(a.getHostAddress());
                }
            }
        } catch (Exception ignored) { /* ignore */ }
        return out;
    }

    // ------------------------------------------------------------------ service notification
    private Notification serviceNotification() {
        Core.Device d = active();
        String title, text;
        if (d != null) {
            title = Strings.t(this, "svc_connected", "name", d.name);
            text = d.wifi() && d.bluetooth() ? Strings.t(this, "via_both") : (d.wifi() ? Strings.t(this, "via_wifi") : Strings.t(this, "via_bt"));
        } else {
            title = "Blinkelo Link";
            text = Strings.t(this, "svc_searching");
        }
        Notification.Builder b = Notif.builder(this, Notif.CH_SERVICE)
                .setContentTitle(title)
                .setContentText(text)
                .setOngoing(true)
                .setShowWhen(false)
                .setContentIntent(Notif.openApp(this, null));
        if (d != null) {
            b.addAction(new Notification.Action.Builder(
                    android.graphics.drawable.Icon.createWithResource(this, R.drawable.ic_act_clipboard),
                    Strings.t(this, "act_clipboard"),
                    Notif.activity(this, 11, new Intent(this, ClipboardActivity.class))).build());
            b.addAction(new Notification.Action.Builder(
                    android.graphics.drawable.Icon.createWithResource(this, R.drawable.ic_act_touchpad),
                    Strings.t(this, "act_touchpad"),
                    Notif.openApp(this, "remote")).build());
        }
        return b.build();
    }

    void refreshServiceNotification() {
        Notif.show(this, Notif.ID_SERVICE, serviceNotification());
    }

    // ------------------------------------------------------------------ Core.Events
    @Override public void onDevicesChanged() {
        Util.main(new Runnable() {
            public void run() {
                if (destroyed) return;
                refreshServiceNotification();
                UiBus.emit("devices", state());
            }
        });
    }

    @Override public void onPairRequest(final Core.Device d) {
        Util.main(new Runnable() {
            public void run() {
                if (destroyed) return;
                Notification n = Notif.builder(LinkService.this, Notif.CH_PAIR)
                        .setContentTitle(Strings.t(LinkService.this, "pair_title"))
                        .setContentText(Strings.t(LinkService.this, "pair_text", "name", d.name, "key", d.verifyKey))
                        .setAutoCancel(true)
                        .setTimeoutAfter(25000)
                        .setContentIntent(Notif.openApp(LinkService.this, "devices"))
                        .addAction(new Notification.Action.Builder(null, Strings.t(LinkService.this, "act_accept"),
                                Notif.action(LinkService.this, 21, ActionReceiver.PAIR_ACCEPT, "id", d.id)).build())
                        .addAction(new Notification.Action.Builder(null, Strings.t(LinkService.this, "act_reject"),
                                Notif.action(LinkService.this, 22, ActionReceiver.PAIR_REJECT, "id", d.id)).build())
                        .build();
                Notif.show(LinkService.this, Notif.ID_PAIR, n);
                UiBus.emit("pairRequest", d.toJson());
            }
        });
    }

    @Override public void onPaired(final Core.Device d) {
        Util.main(new Runnable() {
            public void run() {
                if (destroyed) return;
                Notif.cancel(LinkService.this, Notif.ID_PAIR);
                UiBus.emit("pairResult", d.toJson().p("ok", true));
            }
        });
    }

    @Override public void onUnpaired(final Core.Device d) {
        Util.main(new Runnable() {
            public void run() { if (!destroyed) UiBus.emit("pairResult", d.toJson().p("ok", false).p("reason", "unpaired")); }
        });
    }

    @Override public void onPairFailed(final Core.Device d, final String reason) {
        Util.main(new Runnable() {
            public void run() {
                if (destroyed) return;
                Notif.cancel(LinkService.this, Notif.ID_PAIR);
                UiBus.emit("pairResult", d.toJson().p("ok", false).p("reason", reason));
            }
        });
    }

    @Override public void onConnected(final Core.Device d) {
        Util.main(new Runnable() {
            public void run() {
                if (destroyed) return;
                Core.Device selected = active();
                if (selected != null && selected.id.equals(d.id)) {
                    Settings.setState(LinkService.this, "activePeer", d.id);
                    plugins.onConnected(d);
                }
            }
        });
    }

    @Override public void onDisconnected(final Core.Device d) {
        Util.main(new Runnable() {
            public void run() { if (!destroyed) plugins.onDisconnected(d); }
        });
    }

    @Override public void onPacket(final Core.Device d, final Packet p, Link via) {
        Util.main(new Runnable() {
            public void run() {
                Core.Device selected = active();
                if (destroyed || (!"island.transfer.result".equals(p.type) && (selected == null || !selected.id.equals(d.id)))) {
                    via.discardPayload(p);
                    return;
                }
                try {
                    plugins.onPacket(d, p);
                } catch (Exception e) {
                    Util.log("plugin error " + p.type + ": " + e);
                }
            }
        });
    }

    // ------------------------------------------------------------------ host
    private final class Host implements Core.Host {
        public File dataDir() { return new File(getFilesDir(), "core"); }
        public File cacheDir() { return getCacheDir(); }
        public String deviceName() { return LinkService.this.deviceName(); }
        public String deviceType() {
            return getResources().getConfiguration().smallestScreenWidthDp >= 600 ? "tablet" : "phone";
        }
        public Core.Log log() {
            return new Core.Log() { public void d(String msg) { Util.log(msg); } };
        }
        public List<InetAddress> broadcastAddresses() {
            List<InetAddress> out = new ArrayList<InetAddress>();
            try {
                for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                    if (!ni.isUp() || ni.isLoopback()) continue;
                    for (InterfaceAddress ia : ni.getInterfaceAddresses()) {
                        if (ia.getBroadcast() != null) out.add(ia.getBroadcast());
                    }
                }
            } catch (Exception ignored) { /* ignore */ }
            return out;
        }
    }
}
