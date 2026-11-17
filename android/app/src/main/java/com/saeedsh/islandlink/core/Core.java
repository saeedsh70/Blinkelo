package com.saeedsh.islandlink.core;

import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import javax.net.ssl.SSLSocket;

/**
 * Device discovery, connections and pairing. Speaks KDE Connect protocol v8 over Wi-Fi (UDP
 * discovery + TLS) and the same JSON packets over Bluetooth RFCOMM, plus "island.*" extensions.
 */
public final class Core implements Closeable {
    public static final int UDP_PORT = 1716;
    public static final int MIN_PORT = 1716;
    public static final int MAX_PORT = 1764;
    public static final int PROTOCOL_VERSION = 8;
    private static final Pattern DEVICE_ID = Pattern.compile("^[a-zA-Z0-9_-]{32,38}$");

    public static final List<String> INCOMING = Collections.unmodifiableList(Arrays.asList(
            "island.transfer.result",
            "kdeconnect.ping", "kdeconnect.battery.request", "kdeconnect.notification.request", "kdeconnect.notification.reply",
            "kdeconnect.notification.action", "kdeconnect.mpris.request", "kdeconnect.mpris", "kdeconnect.telephony.request_mute",
            "kdeconnect.findmyphone.request", "kdeconnect.clipboard", "kdeconnect.clipboard.connect", "kdeconnect.share.request",
            "kdeconnect.sms.request", "kdeconnect.systemvolume", "kdeconnect.runcommand",
            "island.hello", "island.sysinfo", "island.apps", "island.screenshot", "island.media", "island.tasks", "island.timer",
            "island.camera.request", "island.pcnotify", "island.clipboard.image", "island.findpc.state", "island.game"));
    public static final List<String> OUTGOING = Collections.unmodifiableList(Arrays.asList(
            "island.transfer.result",
            "kdeconnect.ping", "kdeconnect.battery", "kdeconnect.notification", "kdeconnect.mpris", "kdeconnect.mpris.request",
            "kdeconnect.telephony", "kdeconnect.findmyphone.request", "kdeconnect.clipboard", "kdeconnect.clipboard.connect",
            "kdeconnect.share.request", "kdeconnect.mousepad.request", "kdeconnect.presenter", "kdeconnect.systemvolume.request",
            "kdeconnect.runcommand.request",
            "island.hello", "island.sysinfo.request", "island.apps.request", "island.apps.launch", "island.screenshot.request",
            "island.media.request", "island.tasks", "island.timer", "island.clipboard.image", "island.findpc", "island.game.request"));

    public interface Log { void d(String msg); }

    public interface Host {
        File dataDir();
        File cacheDir();
        String deviceName();
        String deviceType();
        Log log();
        /** IPv4 broadcast addresses of the current networks (255.255.255.255 is added automatically). */
        List<InetAddress> broadcastAddresses();
    }

    public interface Events {
        void onDevicesChanged();
        void onPairRequest(Device d);
        void onPaired(Device d);
        void onUnpaired(Device d);
        void onPairFailed(Device d, String reason);
        void onConnected(Device d);
        void onDisconnected(Device d);
        void onPacket(Device d, Packet p, Link via);
    }

    /** A known device (connected and/or paired). */
    public static final class Device {
        public final String id;
        public volatile String name = "";
        public volatile String type = "desktop";
        public volatile boolean paired;
        public volatile String pairState = "none"; // none | requested | requestedByPeer | paired
        public volatile String verifyKey = "";
        public volatile LanLink lan;
        public volatile BtLink bt;
        public volatile Link.Info info;
        public volatile long lastSeen;
        ScheduledFuture<?> pairTimer;
        long pairGeneration;
        volatile Link pairLink;

        Device(String id) { this.id = id; }

        public boolean connected() { return alive(lan) || alive(bt); }
        public Link link() { return alive(lan) ? lan : (alive(bt) ? bt : null); }
        public boolean wifi() { return alive(lan); }
        public boolean bluetooth() { return alive(bt); }
        public String address() { return alive(lan) ? lan.address() : (alive(bt) ? bt.address() : ""); }
        private static boolean alive(Link l) { return l != null && !l.isClosed(); }

        public Json.Obj toJson() {
            return new Json.Obj().p("id", id).p("name", name).p("type", type).p("paired", paired).p("pairState", pairState)
                    .p("verifyKey", verifyKey).p("connected", connected()).p("wifi", wifi()).p("bluetooth", bluetooth())
                    .p("address", address()).p("lastSeen", lastSeen);
        }
    }

    private final Host host;
    private final Events events;
    private final Log log;
    private final ExecutorService core;
    private final ExecutorService io;
    private final ScheduledExecutorService timers;

    private String deviceId;
    private Certs.Identity identity;
    private Tls tls;
    private byte[] ownSpki;
    private volatile int tcpPort;
    private String preferredDeviceId = "";
    private ServerSocket server;
    private DatagramSocket udp;
    private volatile boolean running;
    private volatile boolean disposed;
    private final Map<String, Device> devices = new LinkedHashMap<String, Device>();
    private Json.Obj trusted = new Json.Obj();
    private final Map<String, Long> lastConnect = new HashMap<String, Long>();
    private ScheduledFuture<?> broadcastTask;

    public Core(Host host, Events events) {
        this.host = host;
        this.events = events;
        this.log = host.log();
        this.core = Executors.newSingleThreadExecutor(named("island-core"));
        this.io = Executors.newCachedThreadPool(named("island-io"));
        this.timers = Executors.newSingleThreadScheduledExecutor(named("island-timer"));
    }

    private static ThreadFactory named(final String name) {
        return new ThreadFactory() {
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, name);
                t.setDaemon(true);
                return t;
            }
        };
    }

    // ------------------------------------------------------------------ identity
    public String deviceId() { return deviceId; }
    public int tcpPort() { return tcpPort; }
    public byte[] certificateDer() { return identity != null ? identity.certDer : null; }

    public synchronized void loadIdentity() throws Exception {
        if (identity != null) return;
        File dir = host.dataDir();
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        File f = new File(dir, "identity.json");
        Json.Obj j = f.exists() ? Json.parseObj(readText(f)) : null;
        if (j != null && DEVICE_ID.matcher(j.str("deviceId")).matches()) {
            try {
                identity = Certs.load(Base64.decode(j.str("key")), Base64.decode(j.str("cert")));
                deviceId = j.str("deviceId");
                if (identity.cert.getNotAfter().getTime() < System.currentTimeMillis()) identity = null;
            } catch (Exception e) {
                identity = null;
            }
        }
        if (identity == null) {
            deviceId = java.util.UUID.randomUUID().toString().replace("-", "");
            identity = Certs.create(deviceId);
            writeText(f, Json.stringify(new Json.Obj().p("deviceId", deviceId)
                    .p("key", Base64.encode(identity.key.getEncoded())).p("cert", Base64.encode(identity.certDer))));
            log.d("generated identity " + deviceId);
        }
        tls = new Tls(identity);
        ownSpki = identity.cert.getPublicKey().getEncoded();
        File tf = new File(dir, "trusted.json");
        Json.Obj t = tf.exists() ? Json.parseObj(readText(tf)) : null;
        trusted = t != null ? t : new Json.Obj();
        for (String id : trusted.keySet()) {
            Json.Obj e = trusted.obj(id);
            if (e == null) continue;
            Device d = new Device(id);
            d.name = e.str("name", "PC");
            d.type = e.str("type", "desktop");
            d.paired = true;
            d.pairState = "paired";
            d.lastSeen = e.lng("lastSeen", 0);
            devices.put(id, d);
        }
    }

    private synchronized void saveTrusted() {
        try {
            writeText(new File(host.dataDir(), "trusted.json"), Json.stringify(trusted));
        } catch (IOException e) {
            log.d("save trusted failed " + e.getMessage());
        }
    }

    public static String sanitizeName(String name) {
        String s = name == null ? "" : name.replaceAll("[\"',;:.!?()\\[\\]<>]", "").trim();
        return s.length() > 32 ? s.substring(0, 32) : s;
    }

    public Json.Obj identityBody() {
        String name = sanitizeName(host.deviceName());
        return new Json.Obj().p("deviceId", deviceId).p("deviceName", name.isEmpty() ? "Phone" : name)
                .p("deviceType", host.deviceType()).p("protocolVersion", PROTOCOL_VERSION)
                .p("incomingCapabilities", Json.arrOf(INCOMING)).p("outgoingCapabilities", Json.arrOf(OUTGOING)).p("islandPortFallback", 1)
                .p("maxBluetoothPayload", 150L * 1024 * 1024);
    }

    private static Json.Obj parseIdentity(String line) {
        Packet p = Packet.parse(line);
        if (p == null || !"kdeconnect.identity".equals(p.type)) return null;
        if (!DEVICE_ID.matcher(p.body.str("deviceId", "")).matches()) return null;
        return p.body;
    }

    // ------------------------------------------------------------------ lifecycle
    public synchronized void start() throws Exception {
        if (disposed) throw new IOException("core has been closed");
        loadIdentity();
        if (running) return;
        running = true;
        openTcp();
        openUdp();
        broadcastTask = timers.scheduleWithFixedDelay(new Runnable() {
            public void run() { broadcast(); }
        }, 1, 45, TimeUnit.SECONDS);
        fireDevicesChanged();
    }

    public synchronized void stop() {
        running = false;
        if (broadcastTask != null) broadcastTask.cancel(false);
        try { if (server != null) server.close(); } catch (IOException ignored) { /* ignore */ }
        if (udp != null) udp.close();
        server = null;
        udp = null;
        tcpPort = 0;
        List<Link> all = new ArrayList<Link>();
        synchronized (this) {
            for (Device d : devices.values()) {
                cancelPairTimer(d);
                d.pairLink = null;
                d.pairState = d.paired ? "paired" : "none";
                d.verifyKey = "";
                if (d.lan != null) all.add(d.lan);
                if (d.bt != null) all.add(d.bt);
            }
        }
        for (Link l : all) l.close();
    }

    /** Permanent disposal for a destroyed Android service; stop() alone remains reusable. */
    @Override public synchronized void close() {
        if (disposed) return;
        disposed = true;
        stop();
        timers.shutdownNow();
        io.shutdownNow();
        core.shutdownNow();
    }

    private synchronized boolean executeCore(Runnable action) {
        if (disposed) return false;
        core.execute(action);
        return true;
    }

    private synchronized boolean executeIo(Runnable action) {
        if (disposed) return false;
        io.execute(action);
        return true;
    }

    public boolean isRunning() { return running; }

    private void openTcp() {
        for (int port = MIN_PORT; port <= MAX_PORT; port++) {
            try {
                ServerSocket ss = new ServerSocket();
                ss.setReuseAddress(true);
                ss.bind(new InetSocketAddress(port));
                server = ss;
                tcpPort = port;
                break;
            } catch (IOException ignored) { /* next port */ }
        }
        if (server == null) {
            try { server = new ServerSocket(0); tcpPort = server.getLocalPort(); }
            catch (IOException e) { log.d("no free tcp port: " + e.getMessage()); return; }
        }
        log.d("listening on tcp " + tcpPort + " as " + deviceId);
        final ServerSocket ss = server;
        Thread t = new Thread(new Runnable() {
            public void run() {
                while (running && !ss.isClosed()) {
                    try {
                        final Socket s = ss.accept();
                        boolean queued = executeIo(new Runnable() {
                            public void run() {
                                try { handleIncoming(s); } catch (Exception e) {
                                    log.d("incoming failed: " + e.getMessage());
                                    try { s.close(); } catch (IOException ignored) { /* ignore */ }
                                }
                            }
                        });
                        if (!queued) s.close();
                    } catch (IOException e) {
                        if (running) log.d("accept: " + e.getMessage());
                    }
                }
            }
        }, "island-accept");
        t.setDaemon(true);
        t.start();
    }

    private void openUdp() {
        try {
            DatagramSocket s = new DatagramSocket(null);
            s.setReuseAddress(true);
            s.setBroadcast(true);
            try {
                s.bind(new InetSocketAddress(UDP_PORT));
            } catch (IOException e) {
                s.close();
                s = new DatagramSocket();
                s.setBroadcast(true);
                log.d("udp " + UDP_PORT + " busy, discovery is send-only");
            }
            udp = s;
        } catch (IOException e) {
            log.d("udp failed: " + e.getMessage());
            return;
        }
        final DatagramSocket s = udp;
        Thread t = new Thread(new Runnable() {
            public void run() {
                byte[] buf = new byte[8192];
                while (running && !s.isClosed()) {
                    try {
                        DatagramPacket dp = new DatagramPacket(buf, buf.length);
                        s.receive(dp);
                        String line = new String(dp.getData(), 0, dp.getLength(), Link.UTF8).trim();
                        Json.Obj id = parseIdentity(line);
                        if (id != null) onUdpIdentity(dp.getAddress().getHostAddress(), id);
                    } catch (IOException e) {
                        if (running) log.d("udp receive: " + e.getMessage());
                    }
                }
            }
        }, "island-udp");
        t.setDaemon(true);
        t.start();
        broadcast();
    }

    /** Queues discovery; callers include Android service callbacks on the UI thread. */
    public void broadcast() {
        if (!running) return;
        executeIo(new Runnable() {
            public void run() {
                if (!running || udp == null || tcpPort == 0) return;
                Set<InetAddress> targets = new LinkedHashSet<InetAddress>();
                try { targets.add(InetAddress.getByName("255.255.255.255")); } catch (IOException ignored) { /* ignore */ }
                try { targets.addAll(host.broadcastAddresses()); } catch (Exception ignored) { /* ignore */ }
                sendIdentityTo(targets);
            }
        });
    }

    private void sendIdentityTo(Iterable<InetAddress> targets) {
        DatagramSocket s = udp;
        if (s == null) return;
        byte[] data = Packet.of("kdeconnect.identity", identityBody().p("tcpPort", tcpPort)).toLine().getBytes(Link.UTF8);
        for (InetAddress a : targets) {
            try {
                s.send(new DatagramPacket(data, data.length, a, UDP_PORT));
            } catch (IOException e) {
                log.d("udp send " + a.getHostAddress() + ": " + e.getMessage());
            }
        }
    }

    /** Manually added PC (when broadcasts are blocked): UDP hello + a direct TCP attempt. */
    public void connectIp(final String ip) {
        executeIo(new Runnable() {
            public void run() {
                try {
                    InetAddress a = InetAddress.getByName(ip);
                    sendIdentityTo(Collections.singletonList(a));
                    for (int port = MIN_PORT; port <= MIN_PORT + 4; port++) {
                        try {
                            connectTo(a.getHostAddress(), port, null);
                            return;
                        } catch (IOException e) {
                            log.d("direct " + ip + ":" + port + " " + e.getMessage());
                        }
                    }
                } catch (Exception e) {
                    log.d("connect ip failed: " + e.getMessage());
                }
            }
        });
    }

    private synchronized boolean rateLimited(String key) {
        long now = System.currentTimeMillis();
        Long last = lastConnect.get(key);
        if (last != null && now - last < 1500) return true;
        lastConnect.put(key, now);
        return false;
    }

    // ------------------------------------------------------------------ connection setup (Wi-Fi)
    private void onUdpIdentity(final String address, final Json.Obj id) {
        if (id.str("deviceId").equals(deviceId)) return;
        final int port = id.integer("tcpPort", 0);
        if (port < (id.integer("islandPortFallback", 0) == 1 ? 1024 : MIN_PORT)
                || port > (id.integer("islandPortFallback", 0) == 1 ? 65535 : MAX_PORT)) return;
        if (id.integer("protocolVersion", 0) < 7) return;
        Device d;
        synchronized (this) { d = devices.get(id.str("deviceId")); }
        if (d != null && d.wifi()) return;
        if (rateLimited(id.str("deviceId"))) return;
        executeIo(new Runnable() {
            public void run() {
                try {
                    connectTo(address, port, id);
                } catch (Exception e) {
                    log.d("connect " + address + ":" + port + " failed: " + e.getMessage());
                }
            }
        });
    }

    /** We discovered them: TCP connect, send our identity, then take the TLS server role. */
    private void connectTo(String address, int port, Json.Obj theirs) throws IOException {
        if (!running) throw new IOException("core stopped");
        Socket s = new Socket();
        try {
            s.connect(new InetSocketAddress(address, port), 6000);
            s.setTcpNoDelay(true);
            int theirPv = theirs != null ? theirs.integer("protocolVersion", PROTOCOL_VERSION) : PROTOCOL_VERSION;
            int pv = Math.min(PROTOCOL_VERSION, theirPv);
            Json.Obj body = identityBody().p("protocolVersion", pv).p("tcpPort", tcpPort);
            if (theirs != null) body.p("targetDeviceId", theirs.str("deviceId")).p("targetProtocolVersion", theirPv);
            Link.writeLine(s.getOutputStream(), Packet.of("kdeconnect.identity", body).toLine());
            SSLSocket t = tls.wrap(s, true);
            finishHandshake(t, theirs, address, pv);
        } catch (IOException e) {
            try { s.close(); } catch (IOException ignored) { /* ignore */ }
            throw e;
        }
    }

    /** They discovered us: read their identity, then take the TLS client role. */
    private void handleIncoming(Socket s) throws IOException {
        String address = s.getInetAddress().getHostAddress();
        s.setTcpNoDelay(true);
        s.setSoTimeout(6000);
        String line = Link.LineReader.readPlainLine(s.getInputStream(), 8192);
        Json.Obj id = parseIdentity(line);
        if (id == null || id.str("deviceId").equals(deviceId)) throw new IOException("invalid identity");
        String target = id.str("targetDeviceId", "");
        if (!target.isEmpty() && !target.equals(deviceId)) throw new IOException("not for me");
        int pv = id.integer("protocolVersion", 7);
        if (pv < 7) throw new IOException("old protocol");
        if (rateLimited("tcp:" + id.str("deviceId"))) throw new IOException("rate limited");
        s.setSoTimeout(0);
        SSLSocket t = tls.wrap(s, false);
        finishHandshake(t, id, address, Math.min(pv, PROTOCOL_VERSION));
    }

    private void finishHandshake(SSLSocket t, Json.Obj plain, String address, int pv) throws IOException {
        X509Certificate peer = Tls.peerCert(t);
        if (peer == null) { t.close(); throw new IOException("no peer certificate"); }
        String cn = Tls.commonName(peer);
        if (plain != null && !cn.isEmpty() && !cn.equals(plain.str("deviceId"))) { t.close(); throw new IOException("certificate CN mismatch"); }
        byte[] der;
        try { der = peer.getEncoded(); } catch (Exception e) { t.close(); throw new IOException("bad certificate"); }
        String fp = Certs.sha256Hex(der);
        Link.LineReader reader = new Link.LineReader(t.getInputStream(), 4 << 20);
        Json.Obj identityBody = plain;
        if (pv >= 8) {
            Link.writeLine(t.getOutputStream(), Packet.of("kdeconnect.identity", identityBody().p("protocolVersion", pv)).toLine());
            t.setSoTimeout(8000);
            Json.Obj secure = parseIdentity(reader.readLine());
            t.setSoTimeout(0);
            if (secure == null) { t.close(); throw new IOException("no secure identity"); }
            if (plain != null && !secure.str("deviceId").equals(plain.str("deviceId"))) { t.close(); throw new IOException("secure identity mismatch"); }
            if (secure.integer("protocolVersion", 0) != pv) { t.close(); throw new IOException("protocol changed during handshake"); }
            identityBody = secure;
        }
        if (identityBody == null) { t.close(); throw new IOException("no identity"); }
        String theirId = identityBody.str("deviceId");
        if (!cn.isEmpty() && !cn.equals(theirId)) { t.close(); throw new IOException("certificate CN mismatch"); }
        if (theirId.equals(deviceId)) { t.close(); throw new IOException("talking to myself"); }
        synchronized (this) {
            Json.Obj tr = trusted.obj(theirId);
            if (tr != null && !tr.str("certSha256", fp).equals(fp)) {
                t.close();
                throw new IOException("certificate of a paired device changed, refusing");
            }
        }
        Link.Info info = makeInfo(identityBody, pv, der, fp, peer);
        addLink(new LanLink(info, t, reader, tls, address, log));
    }

    private static Link.Info makeInfo(Json.Obj id, int pv, byte[] der, String fp, X509Certificate cert) {
        Link.Info info = new Link.Info();
        info.deviceId = id.str("deviceId");
        String name = sanitizeName(id.str("deviceName", ""));
        info.deviceName = name.isEmpty() ? "PC" : name;
        info.deviceType = id.str("deviceType", "desktop");
        info.protocolVersion = pv;
        info.incoming = id.arrOrEmpty("incomingCapabilities").strings();
        info.outgoing = id.arrOrEmpty("outgoingCapabilities").strings();
        info.certDer = der;
        info.certSha256 = fp;
        info.spki = cert != null ? cert.getPublicKey().getEncoded() : null;
        info.islandPortFallback = id.integer("islandPortFallback", 0) == 1;
        long limit = id.lng("maxBluetoothPayload", 150L * 1024 * 1024);
        if (limit > 0) info.maxBluetoothPayload = Math.min(limit, 150L * 1024 * 1024);
        return info;
    }

    // ------------------------------------------------------------------ Bluetooth
    /** Called by the platform when an RFCOMM connection is accepted. Runs the handshake in the background. */
    public void addBluetooth(final InputStream in, final OutputStream out, final Closeable transport, final String btAddress) {
        boolean queued = executeIo(new Runnable() {
            public void run() {
                ScheduledFuture<?> watchdog = null;
                try {
                synchronized (Core.this) {
                if (disposed) throw new IOException("core has been closed");
                watchdog = timers.schedule(new Runnable() {
                    public void run() { try { transport.close(); } catch (IOException ignored) { /* ignore */ } }
                }, 12, TimeUnit.SECONDS);
                }
                    String nonce = BtAuth.nonce();
                    String ownFingerprint = Certs.sha256Hex(identity.certDer);
                    Json.Obj body = identityBody().p("bluetooth", true).p("certificate", Base64.encode(identity.certDer))
                            .p("btAuth", 2).p("nonce", nonce);
                    Link.writeLine(out, Packet.of("kdeconnect.identity", body).toLine());
                    Link.LineReader reader = new Link.LineReader(in, 6 << 20);
                    Json.Obj id = parseIdentity(reader.readLine());
                    if (id == null || id.str("deviceId").equals(deviceId)) throw new IOException("bad bluetooth identity");
                    if (id.integer("btAuth", 0) != 2 || !id.str("nonce", "").matches("[a-f0-9]{64}"))
                        throw new IOException("Bluetooth authentication requires updated Blinkelo");
                    byte[] der = Base64.decode(id.str("certificate", ""));
                    if (der.length == 0) throw new IOException("bluetooth identity without certificate");
                    X509Certificate cert = Certs.parseCert(der);
                    String fp = Certs.sha256Hex(der);
                    String cn = Tls.commonName(cert);
                    if (!cn.equals(id.str("deviceId"))) throw new IOException("certificate CN mismatch");
                    synchronized (Core.this) {
                        Json.Obj tr = trusted.obj(id.str("deviceId"));
                        if (tr != null && !tr.str("certSha256").equals(fp)) throw new IOException("certificate of a paired device changed");
                    }
                    byte[] outboundContext = BtAuth.transcript(deviceId, id.str("deviceId"), nonce, id.str("nonce"), ownFingerprint, fp);
                    byte[] seed = BtAuth.seed(), sealed = BtAuth.sealSeed(cert, seed);
                    Link.writeLine(out, Packet.of("island.bt.auth", new Json.Obj().p("key", Base64.encode(sealed))
                            .p("signature", BtAuth.sign(identity, BtAuth.join(outboundContext, sealed)))).toLine());
                    Packet proof = Packet.parse(reader.readLine());
                    if (proof == null || !"island.bt.auth".equals(proof.type)) throw new IOException("missing Bluetooth proof");
                    String encryptedKey = proof.body.str("key", "");
                    if (encryptedKey.length() > 1024) throw new IOException("Bluetooth proof too large");
                    byte[] peerSealed = Base64.decode(encryptedKey);
                    byte[] inboundContext = BtAuth.transcript(id.str("deviceId"), deviceId, id.str("nonce"), nonce, fp, ownFingerprint);
                    BtAuth.verify(cert, BtAuth.join(inboundContext, peerSealed), proof.body.str("signature", ""));
                    byte[] peerSeed = BtAuth.openSeed(identity, peerSealed);
                    watchdog.cancel(false);
                    Link.Info info = makeInfo(id, Math.min(PROTOCOL_VERSION, id.integer("protocolVersion", PROTOCOL_VERSION)), der, fp, cert);
                    info.btAuthenticated = true;
                    info.btSendKey = BtAuth.sessionKey(seed, outboundContext); info.btSendContext = outboundContext;
                    info.btReceiveKey = BtAuth.sessionKey(peerSeed, inboundContext); info.btReceiveContext = inboundContext;
                    addLink(new BtLink(info, reader, out, transport, btAddress, host.cacheDir(), log));
                } catch (Exception e) {
                    if (watchdog != null) watchdog.cancel(false);
                    log.d("bluetooth handshake failed: " + e.getMessage());
                    try { transport.close(); } catch (IOException ignored) { /* ignore */ }
                }
            }
        });
        if (!queued) { try { transport.close(); } catch (IOException ignored) { /* ignore */ } }
    }

    // ------------------------------------------------------------------ links
    private void addLink(final Link link) {
        final Device d;
        boolean wasConnected;
        Link old = null;
        synchronized (this) {
            if (!running) { link.close(); return; }
            String id = link.info.deviceId;
            Device existing = devices.get(id);
            Json.Obj tr = trusted.obj(id);
            if (tr != null && !link.info.certSha256.equals(tr.str("certSha256"))) {
                link.close();
                return;
            }
            if (link.isBluetooth() && (!link.info.btAuthenticated || link.info.btSendKey == null || link.info.btReceiveKey == null)) {
                log.d("refusing Bluetooth connection without proof of private key possession");
                link.close();
                return;
            }
            Link existingLink = existing != null ? existing.link() : null;
            if (existingLink != null && !link.info.certSha256.equals(existingLink.info.certSha256)) {
                log.d("refusing a different certificate for connected device " + id);
                link.close();
                return;
            }
            d = existing != null ? existing : new Device(id);
            devices.put(id, d);
            wasConnected = d.connected();
            d.name = link.info.deviceName;
            d.type = link.info.deviceType;
            d.info = link.info;
            d.lastSeen = System.currentTimeMillis();
            if (link instanceof LanLink) { old = d.lan; d.lan = (LanLink) link; }
            else { old = d.bt; d.bt = (BtLink) link; }
            d.paired = trusted.has(id);
            if (d.paired) {
                d.pairState = "paired";
                tr.p("name", d.name).p("type", d.type).p("lastSeen", d.lastSeen);
            } else if (!"requested".equals(d.pairState)) {
                d.pairState = "none";
            }
        }
        if (old != null && old != link) old.close();
        if (link instanceof BtLink) ((BtLink) link).authorizePayloads(() -> d.paired && d.bt == link);
        if (d.paired) saveTrusted();
        log.d("linked " + d.name + " via " + (link.isBluetooth() ? "bluetooth" : "wifi " + link.address()) + " paired=" + d.paired);
        link.start(new Link.Listener() {
            public void onPacket(final Link l, final Packet p) {
                executeCore(new Runnable() {
                    public void run() { handlePacket(d, l, p); }
                });
            }
            public void onClosed(final Link l) {
                executeCore(new Runnable() {
                    public void run() { onLinkClosed(d, l); }
                });
            }
        });
        final boolean connectedEvent = d.paired && !wasConnected;
        executeCore(new Runnable() {
            public void run() {
                if (connectedEvent) events.onConnected(d);
                events.onDevicesChanged();
            }
        });
    }

    private void onLinkClosed(Device d, Link l) {
        boolean lost;
        synchronized (this) {
            if (d.lan == l) d.lan = null;
            if (d.bt == l) d.bt = null;
            if (d.pairLink == l) {
                cancelPairTimer(d);
                d.pairLink = null;
                d.pairState = d.paired ? "paired" : "none";
                d.verifyKey = "";
            }
            lost = !d.connected();
            if (lost && !d.paired) {
                devices.remove(d.id);
                cancelPairTimer(d);
                d.pairState = "none";
            }
        }
        if (lost && d.paired) events.onDisconnected(d);
        events.onDevicesChanged();
    }

    private void handlePacket(Device d, Link l, Packet p) {
        if (l.isClosed() || (d.lan != l && d.bt != l)) return;
        d.lastSeen = System.currentTimeMillis();
        if ("kdeconnect.pair".equals(p.type)) { onPair(d, l, p.body); return; }
        if (!d.paired) { l.discardPayload(p); return; } // unpaired devices may only pair
        try {
            events.onPacket(d, p, l);
        } catch (Exception e) {
            log.d("packet handler error " + p.type + ": " + e);
        }
    }

    // ------------------------------------------------------------------ pairing
    private String verificationFor(Link link, Object timestamp) {
        Link.Info info = link != null ? link.info : null;
        if (info == null || info.spki == null) return "";
        long ts;
        try { ts = timestamp instanceof Number ? ((Number) timestamp).longValue() : Long.parseLong(String.valueOf(timestamp)); }
        catch (Exception e) { return ""; }
        return Certs.verificationKey(ownSpki, info.spki, ts);
    }

    public synchronized boolean requestPair(String id) {
        Device d;
        synchronized (this) { d = devices.get(id); }
        if (d == null || d.paired || d.link() == null) return false;
        Link link = d.link();
        long ts = System.currentTimeMillis() / 1000;
        d.pairState = "requested";
        d.pairLink = link;
        d.verifyKey = verificationFor(link, ts);
        if (!link.send(Packet.of("kdeconnect.pair", new Json.Obj().p("pair", true).p("timestamp", ts)))) {
            d.pairState = "none";
            d.pairLink = null;
            d.verifyKey = "";
            return false;
        }
        setPairTimer(d, 30000);
        fireDevicesChanged();
        return true;
    }

    public synchronized boolean acceptPair(String id) {
        Device d;
        synchronized (this) { d = devices.get(id); }
        if (d == null || d.pairLink == null || d.pairLink.isClosed() || !"requestedByPeer".equals(d.pairState)) return false;
        Link link = d.pairLink;
        if (!link.send(Packet.of("kdeconnect.pair", new Json.Obj().p("pair", true)))) return false;
        markPaired(d, link);
        return true;
    }

    public synchronized boolean rejectPair(String id) {
        Device d;
        synchronized (this) { d = devices.get(id); }
        if (d == null) return false;
        Link link = d.pairLink != null ? d.pairLink : d.link();
        if (link != null) link.send(Packet.of("kdeconnect.pair", new Json.Obj().p("pair", false)));
        d.pairState = d.paired ? "paired" : "none";
        d.verifyKey = "";
        d.pairLink = null;
        cancelPairTimer(d);
        fireDevicesChanged();
        return true;
    }

    public synchronized boolean unpair(String id) {
        Device d;
        synchronized (this) {
            d = devices.get(id);
            trusted.remove(id);
        }
        saveTrusted();
        if (d != null) {
            if (d.link() != null) d.link().send(Packet.of("kdeconnect.pair", new Json.Obj().p("pair", false)));
            d.paired = false;
            d.pairState = "none";
            d.verifyKey = "";
            d.pairLink = null;
            cancelPairTimer(d);
            synchronized (this) { if (!d.connected()) devices.remove(id); }
            final Device dd = d;
            executeCore(new Runnable() { public void run() { events.onUnpaired(dd); } });
        }
        fireDevicesChanged();
        return true;
    }

    private synchronized void markPaired(final Device d, Link link) {
        if (link.isClosed() || (d.lan != link && d.bt != link)) return;
        cancelPairTimer(d);
        Link.Info info = link.info;
        synchronized (this) {
            Json.Obj e = new Json.Obj().p("name", d.name).p("type", d.type).p("lastSeen", System.currentTimeMillis());
            if (info != null) {
                e.p("certSha256", info.certSha256).p("protocolVersion", info.protocolVersion);
                if (info.certDer != null) e.p("cert", Base64.encode(info.certDer));
            }
            // The address is diagnostic; trust is established by the authenticated certificate.
            if (link.isBluetooth()) e.p("btAddress", normalizeBluetoothAddress(link.address()));
            trusted.put(d.id, e);
        }
        saveTrusted();
        d.paired = true;
        d.pairState = "paired";
        d.verifyKey = "";
        d.pairLink = null;
        executeCore(new Runnable() {
            public void run() {
                events.onPaired(d);
                events.onConnected(d);
                events.onDevicesChanged();
            }
        });
    }

    private synchronized void onPair(Device d, Link l, Json.Obj body) {
        if (body.bool("pair")) {
            if ("requested".equals(d.pairState) && d.pairLink == l) { markPaired(d, l); return; }
            Object ts = body.get("timestamp");
            if (l.info.protocolVersion >= 8) {
                double t = body.num("timestamp", Double.NaN);
                double now = System.currentTimeMillis() / 1000.0;
                if (Double.isNaN(t) || Double.isInfinite(t) || t != Math.rint(t) || Math.abs(now - t) > 1800) {
                    l.send(Packet.of("kdeconnect.pair", new Json.Obj().p("pair", false)));
                    events.onPairFailed(d, "clock");
                    return;
                }
            }
            if (d.paired) {
                // A valid request from the same certificate starts pairing again.
                trusted.remove(d.id);
                saveTrusted();
                d.paired = false;
                events.onUnpaired(d);
            }
            d.pairState = "requestedByPeer";
            d.pairLink = l;
            d.verifyKey = ts != null ? verificationFor(l, ts) : "";
            setPairTimer(d, 25000);
            events.onPairRequest(d);
            events.onDevicesChanged();
        } else {
            boolean wasPaired = d.paired;
            cancelPairTimer(d);
            if (wasPaired) {
                synchronized (this) { trusted.remove(d.id); }
                saveTrusted();
            }
            d.paired = false;
            d.pairState = "none";
            d.verifyKey = "";
            d.pairLink = null;
            if (wasPaired) events.onUnpaired(d);
            else events.onPairFailed(d, "rejected");
            events.onDevicesChanged();
        }
    }

    private void setPairTimer(final Device d, long ms) {
        cancelPairTimer(d);
        final long generation = d.pairGeneration;
        d.pairTimer = timers.schedule(new Runnable() {
            public void run() {
                executeCore(new Runnable() {
                    public void run() {
                        synchronized (Core.this) {
                        if (d.pairGeneration == generation && ("requested".equals(d.pairState) || "requestedByPeer".equals(d.pairState))) {
                            d.pairState = d.paired ? "paired" : "none";
                            d.verifyKey = "";
                            d.pairLink = null;
                            events.onPairFailed(d, "timeout");
                            events.onDevicesChanged();
                        }
                        }
                    }
                });
            }
        }, ms, TimeUnit.MILLISECONDS);
    }

    private static void cancelPairTimer(Device d) {
        d.pairGeneration++;
        if (d.pairTimer != null) { d.pairTimer.cancel(false); d.pairTimer = null; }
    }

    private static String normalizeBluetoothAddress(String address) {
        return address == null ? "" : address.trim().toUpperCase(Locale.US);
    }

    // ------------------------------------------------------------------ sending & state
    public synchronized List<Device> devices() { return new ArrayList<Device>(devices.values()); }

    public synchronized Device device(String id) { return id == null ? null : devices.get(id); }

    /** Keep the chosen peer until the user selects another; disconnection must not reroute commands. */
    public synchronized Device activeDevice() {
        if (!preferredDeviceId.isEmpty()) {
            Device selected = devices.get(preferredDeviceId);
            return selected != null && selected.paired && selected.connected() ? selected : null;
        }
        Device best = null;
        for (Device d : devices.values()) {
            if (!d.paired || !d.connected()) continue;
            if (best == null || (d.wifi() && !best.wifi()) || (d.wifi() == best.wifi() && d.lastSeen > best.lastSeen)) best = d;
        }
        if (best != null) preferredDeviceId = best.id;
        return best;
    }

    public synchronized void preferDevice(String id) { preferredDeviceId = id == null ? "" : id; }

    public synchronized boolean selectDevice(String id) {
        Device selected = devices.get(id);
        if (selected == null || !selected.paired) return false;
        preferredDeviceId = id;
        return true;
    }

    public boolean send(String deviceId, Packet p) {
        Device d = deviceId == null ? activeDevice() : device(deviceId);
        if (d == null || !d.paired) return false;
        Link l = d.link();
        return l != null && l.send(p);
    }

    /** Sends to every paired, connected device. */
    public int sendAll(Packet p) {
        int n = 0;
        for (Device d : devices()) {
            if (!d.paired) continue;
            Link l = d.link();
            if (l != null) {
                Packet copy = Packet.of(p.type, p.body);
                copy.payloadOut = p.payloadOut;
                copy.payloadSize = p.payloadSize;
                if (l.send(copy)) n++;
            }
        }
        return n;
    }

    public Json.Arr devicesJson() {
        Json.Arr a = new Json.Arr();
        for (Device d : devices()) a.add(d.toJson());
        return a;
    }

    public void runOnCore(Runnable r) { executeCore(r); }
    public void runIo(Runnable r) { executeIo(r); }
    public synchronized ScheduledFuture<?> schedule(Runnable r, long ms) {
        if (disposed) throw new IllegalStateException("core has been closed");
        return timers.schedule(r, ms, TimeUnit.MILLISECONDS);
    }

    private void fireDevicesChanged() {
        executeCore(new Runnable() { public void run() { events.onDevicesChanged(); } });
    }

    // ------------------------------------------------------------------ files
    public static String readText(File f) throws IOException {
        InputStream in = new FileInputStream(f);
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0) out.write(b, 0, n);
            return new String(out.toByteArray(), Link.UTF8);
        } finally {
            in.close();
        }
    }

    public static void writeText(File f, String s) throws IOException {
        File tmp = new File(f.getParentFile(), f.getName() + ".tmp");
        OutputStream out = new FileOutputStream(tmp);
        try {
            out.write(s.getBytes(Link.UTF8));
        } finally {
            out.close();
        }
        if (!tmp.renameTo(f)) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
            if (!tmp.renameTo(f)) throw new IOException("rename failed");
        }
    }
}
