package com.saeedsh.islandlink.core;

import java.io.*;
import java.lang.reflect.*;
import java.net.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import javax.net.ssl.SSLSocket;

/** Dependency-free desktop JVM integration checks for the Android-independent protocol core. */
public final class CoreRegression {
    static int passed;
    static final Core.Log LOG = message -> {};
    static final String A_ID = "11111111111111111111111111111111";
    static final String B_ID = "22222222222222222222222222222222";
    static final String C_ID = "33333333333333333333333333333333";

    static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
        passed++;
        System.out.println("PASS " + message);
    }

    static Object call(Object owner, String name, Class<?>[] types, Object... args) throws Exception {
        Method m = owner.getClass().getDeclaredMethod(name, types);
        m.setAccessible(true);
        try { return m.invoke(owner, args); }
        catch (InvocationTargetException e) {
            if (e.getCause() instanceof Exception) throw (Exception) e.getCause();
            throw e;
        }
    }

    static void set(Object owner, String field, Object value) throws Exception {
        Field f = owner.getClass().getDeclaredField(field);
        f.setAccessible(true);
        f.set(owner, value);
    }

    static final class Events implements Core.Events {
        final BlockingQueue<Core.Device> requests = new LinkedBlockingQueue<>();
        final BlockingQueue<Core.Device> paired = new LinkedBlockingQueue<>();
        final BlockingQueue<Packet> packets = new LinkedBlockingQueue<>();
        final BlockingQueue<Core.Device> disconnected = new LinkedBlockingQueue<>();
        public void onDevicesChanged() {}
        public void onPairRequest(Core.Device d) { requests.add(d); }
        public void onPaired(Core.Device d) { paired.add(d); }
        public void onUnpaired(Core.Device d) {}
        public void onPairFailed(Core.Device d, String reason) {}
        public void onConnected(Core.Device d) {}
        public void onDisconnected(Core.Device d) { disconnected.add(d); }
        public void onPacket(Core.Device d, Packet p, Link via) { packets.add(p); }
    }

    static Core core(File dir, String name, Events events) throws Exception {
        Core c = new Core(new Core.Host() {
            public File dataDir() { return dir; }
            public File cacheDir() { return dir; }
            public String deviceName() { return name; }
            public String deviceType() { return "phone"; }
            public Core.Log log() { return LOG; }
            public List<InetAddress> broadcastAddresses() { return Collections.emptyList(); }
        }, events);
        c.loadIdentity();
        // Keep tests local: start only the TCP listener, with no LAN discovery broadcasts.
        set(c, "running", true);
        call(c, "openTcp", new Class<?>[0]);
        return c;
    }

    static void connect(Core a, Core b) throws Exception {
        call(a, "connectTo", new Class<?>[]{String.class, int.class, Json.Obj.class},
                "127.0.0.1", b.tcpPort(), b.identityBody());
    }

    static <T> T take(BlockingQueue<T> queue, String message) throws Exception {
        T value = queue.poll(10, TimeUnit.SECONDS);
        if (value == null) throw new AssertionError(message + " timed out");
        return value;
    }

    static Packet next(Events events, String type) throws Exception {
        long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < end) {
            Packet p = events.packets.poll(1, TimeUnit.SECONDS);
            if (p != null && type.equals(p.type)) return p;
        }
        throw new AssertionError("missing packet " + type);
    }

    static void testCore(File work) throws Exception {
        Events ae = new Events(), be = new Events();
        Core a = core(new File(work, "a"), "A", ae);
        Core b = core(new File(work, "b"), "B", be);
        try {
            connect(a, b);
            String aid = a.deviceId(), bid = b.deviceId();
            Link.Info rogueInfo = new Link.Info(); rogueInfo.deviceId = bid; rogueInfo.certSha256 = "different-certificate";
            BtLink rogue = new BtLink(rogueInfo, new Link.LineReader(new ByteArrayInputStream(new byte[0]), 100),
                    new ByteArrayOutputStream(), () -> {}, "test", work, LOG);
            call(a, "addLink", new Class<?>[]{Link.class}, rogue);
            check(rogue.isClosed() && a.device(bid).bt == null, "second transport cannot replace a connected device certificate");
            // Device.info can change as transports connect; pairing must use the actual requesting link.
            Link.Info actualInfo = a.device(bid).info;
            Link.Info changedInfo = new Link.Info(); changedInfo.spki = new byte[]{0, 1, 2};
            a.device(bid).info = changedInfo;
            check(a.requestPair(bid), "main TLS channel queues a pair request");
            Core.Device request = take(be.requests, "pair request");
            check(request.verifyKey.length() == 8 && request.verifyKey.equals(a.device(bid).verifyKey),
                    "pair verification uses the requesting link even if device metadata changes");
            a.device(bid).info = actualInfo;
            check(b.acceptPair(aid), "peer accepts pairing on the requesting link");
            take(ae.paired, "A paired"); take(be.paired, "B paired");
            check(a.activeDevice().paired && b.activeDevice().paired, "both certificates are pinned after pairing");
            check(a.send(bid, Packet.of("test.ping", new Json.Obj().p("value", "héllo 🌍 日本"))), "paired send is queued");
            check("héllo 🌍 日本".equals(next(be, "test.ping").body.str("value")), "UTF-8 packets survive TLS round trip");

            byte[] bytes = new byte[98317]; new Random(7).nextBytes(bytes);
            transfer(a, bid, be, bytes, "binary");
            transfer(a, bid, be, new byte[0], "empty");

            // A third certificate can reach a payload listener, but must receive no file bytes.
            AtomicBoolean ok = new AtomicBoolean(true);
            CountDownLatch done = new CountDownLatch(1);
            Packet secret = Packet.of("test.secret").withPayload(bytes);
            secret.sendDone = success -> { ok.set(success); done.countDown(); };
            check(a.send(bid, secret), "outgoing protected payload is queued");
            Packet offer = next(be, "test.secret");
            Tls attacker = new Tls(Certs.create(C_ID));
            SSLSocket intruder = attacker.wrap(new Socket("127.0.0.1", offer.payloadTransferInfo.integer("port", 0)), false);
            intruder.setSoTimeout(5000);
            int leaked = intruder.getInputStream().read(); intruder.close();
            check(done.await(10, TimeUnit.SECONDS) && !ok.get() && leaked == -1,
                    "wrong payload certificate gets zero file bytes and transfer fails");

            b.close();
            take(ae.disconnected, "disconnect");
            be = new Events();
            b = core(new File(work, "b"), "B", be);
            connect(a, b);
            check(a.device(bid).paired && b.device(aid).paired, "trusted identity reconnects without pairing again");
            check(a.send(bid, Packet.of("test.reconnect")), "reconnected device accepts packets");
            next(be, "test.reconnect");

            b.close(); take(ae.disconnected, "second disconnect");
            Certs.Identity changed = Certs.create(bid);
            Core.writeText(new File(work, "b/identity.json"), Json.stringify(new Json.Obj().p("deviceId", bid)
                    .p("key", Base64.encode(changed.key.getEncoded())).p("cert", Base64.encode(changed.certDer))));
            b = core(new File(work, "b"), "B", new Events());
            boolean refused = false;
            try { connect(a, b); } catch (IOException expected) { refused = true; }
            check(refused, "paired device certificate replacement is rejected");
        } finally { a.close(); b.close(); }
    }

    static ExecutorService executor(Core c, String name) throws Exception {
        Field f = Core.class.getDeclaredField(name); f.setAccessible(true);
        return (ExecutorService) f.get(c);
    }

    static void testDisposal(File dir) throws Exception {
        Core c = core(dir, "lifecycle", new Events());
        try {
            ExecutorService worker = executor(c, "core"), io = executor(c, "io"), timers = executor(c, "timers");
            c.stop();
            check(!worker.isShutdown() && !io.isShutdown() && !timers.isShutdown(), "temporary stop preserves reusable executors");
            CountDownLatch runnable = new CountDownLatch(2);
            c.runOnCore(runnable::countDown); c.runIo(runnable::countDown);
            c.schedule(() -> {}, 600000);
            check(runnable.await(5, TimeUnit.SECONDS), "temporary stop still permits future core and IO work");
            c.close(); c.close();
            check(worker.isShutdown() && io.isShutdown() && timers.isShutdown(), "permanent close shuts down all three executors idempotently");
            check(worker.awaitTermination(5, TimeUnit.SECONDS) && io.awaitTermination(5, TimeUnit.SECONDS)
                    && timers.awaitTermination(5, TimeUnit.SECONDS), "permanent close terminates worker threads and cancels delayed tasks");
            boolean refused = false;
            try { c.start(); } catch (IOException expected) { refused = true; }
            check(refused && !c.isRunning(), "disposed instance cannot restart");
            AtomicInteger ignored = new AtomicInteger();
            c.runOnCore(ignored::incrementAndGet); c.runIo(ignored::incrementAndGet);
            AtomicBoolean transportClosed = new AtomicBoolean();
            c.addBluetooth(new ByteArrayInputStream(new byte[0]), new ByteArrayOutputStream(), () -> transportClosed.set(true), "test");
            check(ignored.get() == 0 && transportClosed.get(), "late work is ignored and rejected Bluetooth transport is closed after disposal");
        } finally { c.close(); }
    }

    static void transfer(Core sender, String id, Events receiver, byte[] bytes, String label) throws Exception {
        Packet p = Packet.of("test." + label).withPayload(bytes);
        CountDownLatch done = new CountDownLatch(1); AtomicBoolean ok = new AtomicBoolean();
        p.sendDone = success -> { ok.set(success); done.countDown(); };
        check(sender.send(id, p), label + " payload is queued");
        Packet incoming = next(receiver, p.type);
        check(incoming.hasPayload() && Arrays.equals(bytes, incoming.readPayload(bytes.length)), label + " payload arrives byte-for-byte");
        check(done.await(10, TimeUnit.SECONDS) && ok.get(), label + " transfer reports completion");
    }

    static final class BtFixture {
        final BtLink link;
        final List<Packet> delivered = new ArrayList<>();
        BtFixture(File cache) throws Exception {
            Link.Info info = new Link.Info(); info.deviceId = A_ID; info.deviceName = "test";
            info.btSendKey = new byte[32]; info.btReceiveKey = new byte[32];
            info.btSendContext = new byte[0]; info.btReceiveContext = new byte[0];
            link = new BtLink(info, new Link.LineReader(new ByteArrayInputStream(new byte[0]), 65536),
                    new ByteArrayOutputStream(), () -> {}, "test", cache, LOG);
            link.authorizePayloads(() -> true);
            link.listener = new Link.Listener() {
                public void onPacket(Link l, Packet p) { delivered.add(p); }
                public void onClosed(Link l) {}
            };
        }
        void begin(String tid, long size) throws Exception {
            Packet p = Packet.of("test.file"); p.payloadSize = size;
            call(link, "beginPayload", new Class<?>[]{String.class, Packet.class}, tid, p);
        }
        void chunk(String tid, int seq, byte[] data, boolean last) throws Exception {
            rawChunk(tid, seq, Base64.encode(data), last);
        }
        void rawChunk(String tid, int seq, String data, boolean last) throws Exception {
            call(link, "onChunk", new Class<?>[]{Json.Obj.class}, new Json.Obj().p("tid", tid).p("seq", seq).p("data", data).p("last", last));
        }
    }

    static void testBluetooth(File cache) throws Exception {
        cache.mkdirs();
        BtFixture f = new BtFixture(cache);
        try {
            f.link.authorizePayloads(() -> false);
            f.begin("unpaired", BtLink.MEMORY_PAYLOAD + 1);
            check(cache.listFiles((d, n) -> n.endsWith(".part")).length == 0,
                    "Unpaired Bluetooth payload cannot allocate a temporary file");
            f.link.authorizePayloads(() -> true);
            f.begin("empty", 0); f.chunk("empty", 0, new byte[0], true);
            check(f.delivered.size() == 1 && f.delivered.remove(0).readPayload(0).length == 0, "Bluetooth supports empty files");
            f.begin("ok", 3); f.chunk("ok", 0, new byte[]{1, 2, 3}, true);
            check(Arrays.equals(f.delivered.remove(0).readPayload(3), new byte[]{1, 2, 3}), "Bluetooth valid payload retains exact bytes");
            f.begin("short", 4); f.chunk("short", 0, new byte[]{1}, true);
            check(f.delivered.isEmpty(), "Bluetooth rejects early last chunks");
            f.begin("long", 1); f.chunk("long", 0, new byte[]{1, 2}, true);
            check(f.delivered.isEmpty(), "Bluetooth rejects bytes above advertised size");
            f.begin("order", 2); f.chunk("order", 1, new byte[]{1, 2}, true);
            check(f.delivered.isEmpty(), "Bluetooth rejects out-of-order chunks");
            f.begin("bad64", 2); f.rawChunk("bad64", 0, "!!", true);
            check(f.delivered.isEmpty(), "Bluetooth rejects malformed base64 chunks");
            f.begin("huge", BtLink.MAX_PAYLOAD + 1);
            Field pending = BtLink.class.getDeclaredField("pending"); pending.setAccessible(true);
            check(((Map<?, ?>) pending.get(f.link)).isEmpty(), "Bluetooth rejects transfers above 150 MiB");
            for (int i = 0; i < 12; i++) f.begin("slot" + i, 1);
            check(((Map<?, ?>) pending.get(f.link)).size() == BtLink.MAX_PENDING, "Bluetooth bounds concurrent pending transfers");
            Object stalled = ((Map<?, ?>) pending.get(f.link)).get("slot0");
            Field lastActivity = stalled.getClass().getDeclaredField("lastActivity"); lastActivity.setAccessible(true);
            lastActivity.setLong(stalled, System.nanoTime() - TimeUnit.SECONDS.toNanos(31));
            call(f.link, "cleanupPayloads", new Class<?>[0]);
            check(((Map<?, ?>) pending.get(f.link)).size() == BtLink.MAX_PENDING - 1, "Stalled Bluetooth transfers release their reserved storage");
            f.link.authorizePayloads(() -> false);
            call(f.link, "cleanupPayloads", new Class<?>[0]);
            check(((Map<?, ?>) pending.get(f.link)).isEmpty(), "Revoking pairing clears pending Bluetooth transfers");
        } finally { f.link.close(); }

        BtFixture disk = new BtFixture(cache);
        try {
            disk.begin("replace", BtLink.MEMORY_PAYLOAD + 1);
            File[] files = cache.listFiles((d, n) -> n.endsWith(".part"));
            check(files != null && files.length > 0, "large Bluetooth payloads use the cache");
            File old = files[0];
            disk.begin("replace", 0);
            check(!old.exists(), "reused transfer ID removes old partial file");
        } finally { disk.link.close(); }

        BtFixture completed = new BtFixture(cache);
        try {
            int size = (int) BtLink.MEMORY_PAYLOAD + 1;
            completed.begin("disk", size);
            int sent = 0, seq = 0;
            while (sent < size) {
                int n = Math.min(BtLink.CHUNK_RAW, size - sent);
                sent += n;
                completed.chunk("disk", seq++, new byte[n], sent == size);
            }
            Packet p = completed.delivered.remove(0);
            File[] cached = cache.listFiles((d, n) -> n.endsWith(".part"));
            File file = cached[0];
            p.copyPayload(new OutputStream() { public void write(int b) {} public void write(byte[] b, int off, int n) {} }, null);
            check(!file.exists(), "consumed Bluetooth files are deleted immediately after the stream closes");
        } finally { completed.link.close(); }

        BtFixture cancelled = new BtFixture(cache);
        AtomicInteger closes = new AtomicInteger(), callbacks = new AtomicInteger();
        AtomicBoolean result = new AtomicBoolean(true); CountDownLatch callback = new CountDownLatch(1);
        Packet outgoing = Packet.of("test.cancel").withPayload(new Packet.PayloadOut() {
            public long size() { return 1024 * 1024; }
            public InputStream open() {
                return new ByteArrayInputStream(new byte[1024 * 1024]) {
                    public void close() { closes.incrementAndGet(); }
                };
            }
        });
        outgoing.sendProgress = (done, total) -> cancelled.link.close();
        outgoing.sendDone = ok -> { callbacks.incrementAndGet(); result.set(ok); callback.countDown(); };
        check(cancelled.link.send(outgoing), "Bluetooth file cancellation test is queued");
        check(callback.await(5, TimeUnit.SECONDS) && callbacks.get() == 1 && !result.get() && closes.get() == 1,
                "Bluetooth disconnect closes active input and reports failure exactly once");

        BtFixture queued = new BtFixture(cache);
        CountDownLatch blocked = new CountDownLatch(1), release = new CountDownLatch(1), failed = new CountDownLatch(1);
        queued.link.writer.execute(() -> {
            blocked.countDown();
            try { release.await(); } catch (InterruptedException ignored) {}
        });
        check(blocked.await(5, TimeUnit.SECONDS), "writer cancellation fixture is ready");
        AtomicInteger failures = new AtomicInteger();
        Packet neverStarted = Packet.of("test.queued").withPayload(new byte[]{1});
        neverStarted.sendDone = ok -> { if (!ok) failures.incrementAndGet(); failed.countDown(); };
        check(queued.link.send(neverStarted), "file waiting behind writer is accepted");
        queued.link.close(); release.countDown();
        check(failed.await(5, TimeUnit.SECONDS) && failures.get() == 1, "disconnect reports failure for accepted payloads that never start");

    }

    static void testDiscoveryThread(File dir) throws Exception {
        Thread uiThread = Thread.currentThread();
        AtomicReference<Thread> enumerationThread = new AtomicReference<>();
        AtomicReference<Thread> sendThread = new AtomicReference<>();
        AtomicReference<Packet> sentIdentity = new AtomicReference<>();
        CountDownLatch sending = new CountDownLatch(1), release = new CountDownLatch(1), finished = new CountDownLatch(1);
        Core c = new Core(new Core.Host() {
            public File dataDir() { return dir; }
            public File cacheDir() { return dir; }
            public String deviceName() { return "Discovery Test"; }
            public String deviceType() { return "phone"; }
            public Core.Log log() { return LOG; }
            public List<InetAddress> broadcastAddresses() {
                enumerationThread.set(Thread.currentThread());
                return Collections.emptyList();
            }
        }, new Events());
        DatagramSocket socket = new DatagramSocket((SocketAddress) null) {
            @Override public void send(DatagramPacket packet) throws IOException {
                // Model Android's network thread policy; never send a real discovery packet.
                if (Thread.currentThread() == uiThread)
                    throw new IllegalStateException("NetworkOnMainThreadException: discovery ran on the UI caller");
                sendThread.set(Thread.currentThread());
                sentIdentity.set(Packet.parse(new String(packet.getData(), packet.getOffset(), packet.getLength(), Link.UTF8)));
                sending.countDown();
                try { release.await(); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new IOException(e); }
                finally { finished.countDown(); }
            }
        };
        try {
            c.loadIdentity();
            set(c, "running", true); set(c, "tcpPort", 1716); set(c, "udp", socket);
            // This is the synchronous call used by onStartCommand and the network callback.
            c.broadcast();
            check(sending.await(5, TimeUnit.SECONDS), "UI discovery request reaches the network worker");
            check(sendThread.get() != uiThread && enumerationThread.get() != uiThread,
                    "discovery never sends or enumerates interfaces on the UI caller");
            check(finished.getCount() == 1, "discovery returns without waiting for a blocked network send");
            Packet identity = sentIdentity.get();
            check(identity != null && "kdeconnect.identity".equals(identity.type)
                    && c.deviceId().equals(identity.body.str("deviceId")) && identity.body.integer("tcpPort", 0) == 1716,
                    "background discovery preserves the actual identity and listening port");
            release.countDown();
            check(finished.await(5, TimeUnit.SECONDS), "background discovery finishes after the network is released");
            c.close();
            c.broadcast();
            check(socket.isClosed(), "discovery after disposal keeps the socket closed");
        } finally { release.countDown(); c.close(); socket.close(); }
    }

    public static void main(String[] args) throws Exception {
        Path work = Files.createTempDirectory(Paths.get(args[0]), "core-regression-");
        try {
            if (args.length > 1 && "discovery".equals(args[1])) {
                testDiscoveryThread(work.resolve("discovery").toFile());
                return;
            }
            testBluetooth(work.resolve("bt").toFile());
            testCore(work.resolve("core").toFile());
            testDisposal(work.resolve("lifecycle").toFile());
            testDiscoveryThread(work.resolve("discovery").toFile());
            System.out.println("ALL " + passed + " CORE CHECKS PASSED");
        } finally {
            try (java.util.stream.Stream<Path> files = Files.walk(work)) {
                for (Path path : (Iterable<Path>) files.sorted(Comparator.reverseOrder())::iterator) Files.deleteIfExists(path);
            }
        }
    }
}
