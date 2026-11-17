package com.saeedsh.islandlink.core;

import java.io.*;
import java.lang.reflect.*;
import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Runs production Core against Windows without broadcasting or discovering real LAN devices. */
public final class WindowsHarness {
    static Core client;
    static synchronized void emit(Json.Obj value) {
        System.out.println(Json.stringify(value));
        System.out.flush();
    }
    static void changed() {
        if (client == null) return;
        Json.Arr peers = new Json.Arr();
        for (Core.Device d : client.devices()) peers.add(new Json.Obj().p("id", d.id)
                .p("connected", d.connected()).p("paired", d.paired).p("code", d.verifyKey)
                .p("pairState", "requestedByPeer".equals(d.pairState) ? "incoming" : d.pairState));
        emit(new Json.Obj().p("event", "state").p("peers", peers));
    }
    public static void main(final String[] args) throws Exception {
        System.setOut(new PrintStream(new FileOutputStream(FileDescriptor.out), true, "UTF-8"));
        final File dir = new File(args[0]);
        client = new Core(new Core.Host() {
            public File dataDir() { return dir; }
            public File cacheDir() { return new File(dir, "cache"); }
            public String deviceName() { return "Island Link Test Phone"; }
            public String deviceType() { return "phone"; }
            public Core.Log log() { return msg -> emit(new Json.Obj().p("event", "log").p("message", msg)); }
            public List<InetAddress> broadcastAddresses() { return Collections.emptyList(); }
        }, new Core.Events() {
            public void onDevicesChanged() { changed(); }
            public void onPairRequest(Core.Device d) { changed(); }
            public void onPaired(Core.Device d) { changed(); }
            public void onUnpaired(Core.Device d) { changed(); }
            public void onPairFailed(Core.Device d, String reason) { changed(); }
            public void onConnected(Core.Device d) { changed(); }
            public void onDisconnected(Core.Device d) { changed(); }
            public void onPacket(Core.Device d, Packet p, Link via) {
                emit(new Json.Obj().p("event", "packet").p("type", p.type).p("body", p.body));
            }
        });
        client.loadIdentity();
        // Exercise production TCP/TLS methods while leaving UDP and periodic broadcasts disabled.
        Field running = Core.class.getDeclaredField("running"); running.setAccessible(true); running.setBoolean(client, true);
        Method tcp = Core.class.getDeclaredMethod("openTcp"); tcp.setAccessible(true); tcp.invoke(client);
        Method connect = Core.class.getDeclaredMethod("connectTo", String.class, int.class, Json.Obj.class); connect.setAccessible(true);
        emit(new Json.Obj().p("event", "started").p("port", client.tcpPort()));
        try (BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8))) {
            for (String line; (line = input.readLine()) != null;) {
                Json.Obj c = Json.parseObj(line); if (c == null) continue;
                String action = c.str("action"); if ("quit".equals(action)) break;
                switch (action) {
                    case "connect": connect.invoke(client, "127.0.0.1", c.integer("port", 1716), c.obj("identity")); break;
                    case "pair": client.requestPair(args[2]); break;
                    case "accept": client.acceptPair(args[2]); break;
                    case "unpair": client.unpair(args[2]); break;
                    case "send": client.send(args[2], Packet.of(c.str("type"), c.objOrEmpty("body"))); break;
                    default: break;
                }
            }
        } finally { client.stop(); }
    }
}
