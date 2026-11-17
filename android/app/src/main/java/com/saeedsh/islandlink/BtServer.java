package com.saeedsh.islandlink;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothServerSocket;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;

import com.saeedsh.islandlink.core.Json;

import java.io.IOException;
import java.util.UUID;

/**
 * Bluetooth RFCOMM server. The PC (already paired with the phone in Windows Bluetooth settings)
 * connects to this service UUID; then the same JSON packets flow as over Wi-Fi.
 */
final class BtServer {
    static final UUID SERVICE_UUID = UUID.fromString("a8d1f0c2-6b7e-4f1a-9c3d-2e5b7a9c1d40");
    static final String SERVICE_NAME = "Blinkelo Link";

    private final LinkService svc;
    private volatile boolean running;
    private volatile BluetoothServerSocket server;
    private Thread thread;
    private BroadcastReceiver stateReceiver;
    private volatile String lastError = "";

    BtServer(LinkService svc) { this.svc = svc; }

    static boolean hasPermission(Context ctx) {
        return Build.VERSION.SDK_INT < 31 || ctx.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED;
    }

    static BluetoothAdapter adapter(Context ctx) {
        BluetoothManager bm = ctx.getSystemService(BluetoothManager.class);
        return bm != null ? bm.getAdapter() : null;
    }

    static Json.Obj state(Context ctx, BtServer s) {
        BluetoothAdapter a = adapter(ctx);
        boolean enabled = false;
        try { enabled = a != null && hasPermission(ctx) && a.isEnabled(); } catch (SecurityException ignored) { /* ignore */ }
        return new Json.Obj()
                .p("available", a != null)
                .p("permission", hasPermission(ctx))
                .p("enabled", enabled)
                .p("setting", Settings.get(ctx).bool("bluetooth", true))
                .p("listening", s != null && s.server != null)
                .p("error", s != null ? s.lastError : "");
    }

    synchronized void start() {
        if (running) return;
        running = true;
        stateReceiver = new BroadcastReceiver() {
            @Override public void onReceive(Context c, Intent i) {
                int st = i.getIntExtra(BluetoothAdapter.EXTRA_STATE, -1);
                if (st == BluetoothAdapter.STATE_ON) { closeServer(); wake(); }
                if (st == BluetoothAdapter.STATE_OFF || st == BluetoothAdapter.STATE_TURNING_OFF) { closeServer(); wake(); }
                svc.onDevicesChanged();
            }
        };
        // Bluetooth broadcasts originate from the privileged Bluetooth app, not the system UID.
        IntentFilter filter = new IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED);
        if (Build.VERSION.SDK_INT >= 33) svc.registerReceiver(stateReceiver, filter, Context.RECEIVER_EXPORTED);
        else svc.registerReceiver(stateReceiver, filter);
        thread = new Thread(new Runnable() {
            public void run() { loop(); }
        }, "bt-server");
        thread.setDaemon(true);
        thread.start();
    }

    private void wake() {
        Thread t = thread;
        if (t != null) t.interrupt();
    }

    private void loop() {
        while (running) {
            BluetoothAdapter a = adapter(svc);
            try {
                if (a == null || !hasPermission(svc) || !a.isEnabled()) {
                    lastError = a == null ? "no adapter" : (!hasPermission(svc) ? "permission" : "off");
                    sleep(15000);
                    continue;
                }
                BluetoothServerSocket listener = a.listenUsingRfcommWithServiceRecord(SERVICE_NAME, SERVICE_UUID);
                if (!publishServer(listener)) break;
                lastError = "";
                svc.onDevicesChanged();
                while (running) {
                    BluetoothSocket s = listener.accept();
                    if (s == null) continue;
                    if (!running) { s.close(); break; }
                    String addr = "bt";
                    try { addr = s.getRemoteDevice().getAddress(); } catch (SecurityException ignored) { /* ignore */ }
                    Util.log("bluetooth connection from " + addr);
                    try {
                        svc.core.addBluetooth(s.getInputStream(), s.getOutputStream(), s, addr);
                    } catch (IOException | RuntimeException e) {
                        try { s.close(); } catch (IOException ignored) { /* already closed */ }
                        throw e;
                    }
                }
            } catch (SecurityException e) {
                lastError = "permission";
                closeServer();
                if (running) sleep(15000);
            } catch (IOException e) {
                if (running) {
                    lastError = e.getMessage() != null ? e.getMessage() : "io";
                    Util.log("bluetooth server: " + e.getMessage());
                }
                closeServer();
                if (running) sleep(5000);
            }
        }
    }

    private static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) { /* woken up */ }
    }

    private synchronized boolean publishServer(BluetoothServerSocket listener) throws IOException {
        if (!running) { listener.close(); return false; }
        server = listener;
        return true;
    }

    private synchronized void closeServer() {
        BluetoothServerSocket s = server;
        server = null;
        if (s != null) try { s.close(); } catch (IOException ignored) { /* ignore */ }
    }

    synchronized void stop() {
        running = false;
        closeServer();
        if (stateReceiver != null) {
            try { svc.unregisterReceiver(stateReceiver); } catch (Exception ignored) { /* ignore */ }
            stateReceiver = null;
        }
        wake();
    }
}
