package com.saeedsh.islandlink.core;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.BooleanSupplier;

/**
 * Bluetooth (RFCOMM) link. There is no TLS here (the Bluetooth pairing encrypts the link) and no
 * second socket, so payloads travel inline as base64 "island.chunk" packets.
 */
public final class BtLink extends Link {
    public static final String CHUNK = "island.chunk";
    static final int CHUNK_RAW = 48 * 1024;
    static final long MAX_PAYLOAD = 150L * 1024 * 1024;
    static final long MEMORY_PAYLOAD = 8L * 1024 * 1024;
    static final int MAX_PENDING = 4;

    private final LineReader reader;
    private final OutputStream out;
    private final Closeable transport;
    private final String address;
    private final File cacheDir;
    private final Map<String, Pending> pending = new HashMap<String, Pending>();
    private final Set<File> receivedFiles = Collections.synchronizedSet(new HashSet<File>());
    private final Map<File, Long> receivedAt = new HashMap<File, Long>();
    private volatile BooleanSupplier payloadAuthorization = () -> false;
    private final ScheduledExecutorService maintenance = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread thread = new Thread(r, "bt-payload-cleanup"); thread.setDaemon(true); return thread;
    });
    private final Set<ChunkTask> outgoing = Collections.synchronizedSet(new HashSet<ChunkTask>());
    private long sendSequence, receiveSequence;

    private static final class Pending {
        Packet packet;
        ByteArrayOutputStream mem;
        File file;
        OutputStream fileOut;
        long received;
        int nextSeq;
        long lastActivity = System.nanoTime();
    }

    BtLink(Info info, LineReader reader, OutputStream out, Closeable transport, String address, File cacheDir, Core.Log log) {
        super(info, log);
        this.reader = reader;
        this.out = out;
        this.transport = transport;
        this.address = address;
        this.cacheDir = cacheDir;
    }

    @Override public boolean isBluetooth() { return true; }
    @Override public String address() { return address; }

    void authorizePayloads(BooleanSupplier check) { payloadAuthorization = check; }

    private boolean payloadAllowed() { return !closed && payloadAuthorization.getAsBoolean(); }

    private synchronized void cleanupPayloads() {
        long now = System.nanoTime();
        boolean allowed = payloadAllowed();
        java.util.Iterator<Pending> pendingIt = pending.values().iterator();
        while (pendingIt.hasNext()) {
            Pending pd = pendingIt.next();
            if (!allowed || now - pd.lastActivity > TimeUnit.SECONDS.toNanos(30)) { pendingIt.remove(); dropPending(pd); }
        }
        java.util.Iterator<Map.Entry<File, Long>> files = receivedAt.entrySet().iterator();
        while (files.hasNext()) {
            Map.Entry<File, Long> entry = files.next();
            if (!allowed || now - entry.getValue() > TimeUnit.MINUTES.toNanos(5)) {
                receivedFiles.remove(entry.getKey()); entry.getKey().delete(); files.remove();
            }
        }
    }

    private synchronized void releaseFile(File file) {
        receivedFiles.remove(file); receivedAt.remove(file); file.delete();
    }

    @Override public void discardPayload(Packet p) {
        if (!p.hasPayload()) return;
        try { p.payloadIn.open().close(); } catch (IOException ignored) { /* already consumed */ }
    }

    private void writePacket(Packet p) throws IOException {
        try {
            byte[] plain = p.toLine().getBytes(UTF8);
            if (plain.length > 4 * 1024 * 1024) throw new IOException("Bluetooth packet too large");
            long seq = sendSequence++;
            byte[] data = BtAuth.crypt(true, info.btSendKey, info.btSendContext, seq, plain);
            writeLine(out, Packet.of("island.bt.frame", new Json.Obj().p("seq", seq).p("data", Base64.encode(data))).toLine());
        } catch (Exception e) { throw new IOException("Bluetooth encryption failed", e); }
    }

    private Packet readPacket(String line) throws IOException {
        try {
            Packet frame = Packet.parse(line);
            if (frame == null || !"island.bt.frame".equals(frame.type)) throw new IOException("unencrypted Bluetooth packet");
            Object number = frame.body.get("seq");
            if (!(number instanceof Number) || ((Number) number).doubleValue() != receiveSequence)
                throw new IOException("Bluetooth sequence rejected");
            byte[] data = java.util.Base64.getDecoder().decode(frame.body.str("data", ""));
            if (data.length < 16 || data.length > 4 * 1024 * 1024 + 16) throw new IOException("Bluetooth frame too large");
            byte[] plain = BtAuth.crypt(false, info.btReceiveKey, info.btReceiveContext, receiveSequence, data);
            receiveSequence++;
            Packet packet = Packet.parse(new String(plain, UTF8));
            if (packet == null) throw new IOException("invalid encrypted packet");
            return packet;
        } catch (Exception e) { throw new IOException("Bluetooth frame rejected", e); }
    }

    @Override protected void startReading() {
        maintenance.scheduleWithFixedDelay(() -> cleanupPayloads(), 1, 1, TimeUnit.SECONDS);
        Thread t = new Thread(new Runnable() {
            public void run() {
                try {
                    String line;
                    while (!closed && (line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty()) continue;
                        Packet p = readPacket(line);
                        if (CHUNK.equals(p.type)) { onChunk(p.body); continue; }
                        String tid = p.payloadTransferInfo != null ? p.payloadTransferInfo.str("bt", "") : "";
                        if (p.payloadSize >= 0 && !tid.isEmpty()) { beginPayload(tid, p); continue; }
                        deliver(p);
                    }
                } catch (IOException e) {
                    if (!closed) log.d("bt link read: " + e.getMessage());
                } finally {
                    synchronized (BtLink.this) {
                        for (Pending pd : pending.values()) dropPending(pd);
                        pending.clear();
                    }
                    close();
                }
            }
        }, "bt-reader");
        t.setDaemon(true);
        t.start();
    }

    // ------------------------------------------------------------------ incoming payloads
    private synchronized void beginPayload(String tid, Packet p) throws IOException {
        if (!payloadAllowed() || !tid.matches("[a-zA-Z0-9_-]{1,128}") || p.payloadSize < 0) return;
        if (p.payloadSize > MAX_PAYLOAD) { log.d("bt payload too large: " + p.payloadSize); return; }
        Pending old = pending.remove(tid);
        if (old != null) dropPending(old);
        long reserved = 0;
        for (Pending item : pending.values()) reserved += item.packet.payloadSize;
        synchronized (receivedFiles) { for (File file : receivedFiles) reserved += file.length(); }
        if (pending.size() + receivedFiles.size() >= MAX_PENDING || reserved + p.payloadSize > MAX_PAYLOAD) {
            log.d("bluetooth transfer budget reached"); return;
        }
        Pending pd = new Pending();
        pd.packet = p;
        long memory = 0;
        for (Pending other : pending.values()) if (other.mem != null) memory += other.packet.payloadSize;
        if (p.payloadSize <= MEMORY_PAYLOAD - memory) pd.mem = new ByteArrayOutputStream((int) p.payloadSize);
        else {
            pd.file = File.createTempFile("bt-", ".part", cacheDir);
            pd.fileOut = new FileOutputStream(pd.file);
        }
        pending.put(tid, pd);
    }

    private synchronized void onChunk(Json.Obj b) throws IOException {
        if (!payloadAllowed()) { cleanupPayloads(); return; }
        String tid = b.str("tid", "");
        Pending pd = pending.get(tid);
        if (pd == null) return;
        int seq = b.integer("seq", -1);
        if (seq != pd.nextSeq) { log.d("bt chunk out of order " + seq); dropPending(pd); pending.remove(tid); return; }
        pd.nextSeq++;
        byte[] data;
        String encoded = b.str("data", "");
        if (encoded.length() > ((CHUNK_RAW + 2) / 3) * 4) { dropPending(pd); pending.remove(tid); return; }
        try { data = java.util.Base64.getDecoder().decode(encoded); }
        catch (IllegalArgumentException e) { dropPending(pd); pending.remove(tid); return; }
        if (data.length > CHUNK_RAW || data.length > pd.packet.payloadSize - pd.received
                || (b.bool("last") && pd.received + data.length != pd.packet.payloadSize)) {
            log.d("invalid bluetooth payload size");
            dropPending(pd);
            pending.remove(tid);
            return;
        }
        if (pd.mem != null) pd.mem.write(data);
        else pd.fileOut.write(data);
        pd.received += data.length;
        pd.lastActivity = System.nanoTime();
        if (b.bool("last") || pd.received >= pd.packet.payloadSize) {
            pending.remove(tid);
            final Packet p = pd.packet;
            if (pd.mem != null) {
                final byte[] all = pd.mem.toByteArray();
                p.payloadIn = new Packet.PayloadIn() {
                    public InputStream open() { return new ByteArrayInputStream(all); }
                };
            } else {
                pd.fileOut.close();
                final File f = pd.file;
                receivedFiles.add(f);
                receivedAt.put(f, System.nanoTime());
                p.payloadIn = new Packet.PayloadIn() {
                    public InputStream open() throws IOException {
                        return new FilterInputStream(new FileInputStream(f)) {
                            @Override public void close() throws IOException {
                                try { super.close(); } finally {
                                    releaseFile(f);
                                }
                            }
                        };
                    }
                };
            }
            deliver(p);
        }
    }

    private static void dropPending(Pending pd) {
        try { if (pd.fileOut != null) pd.fileOut.close(); } catch (IOException ignored) { /* ignore */ }
        if (pd.file != null) //noinspection ResultOfMethodCallIgnored
            pd.file.delete();
    }

    // ------------------------------------------------------------------ sending
    @Override public boolean send(final Packet p) {
        if (p.payloadOut != null && (p.payloadOut.size() < 0 || p.payloadOut.size() > Math.min(MAX_PAYLOAD, info.maxBluetoothPayload))) return false;
        return enqueue(p, new Runnable() {
                public void run() {
                    try {
                        if (p.payloadOut == null) { writePacket(p); return; }
                        final String tid = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
                        p.payloadTransferInfo = new Json.Obj().p("bt", tid);
                        p.payloadSize = p.payloadOut.size();
                        if (p.payloadSize < 0 || p.payloadSize > MAX_PAYLOAD) throw new IOException("invalid bluetooth payload size");
                        writePacket(p);
                        final InputStream in = p.payloadOut.open();
                        ChunkTask task = new ChunkTask(p, tid, in);
                        outgoing.add(task);
                        try {
                            if (closed) task.finish(false);
                            else writer.execute(task);
                        } catch (RuntimeException e) { task.finish(false); }
                    } catch (IOException e) {
                        log.d("bt send failed: " + e.getMessage());
                        if (p.sendDone != null) p.sendDone.done(false);
                        close();
                    }
                }
            });
    }

    /** Sends one chunk, then re-queues itself so other packets can interleave with big transfers. */
    private final class ChunkTask implements Runnable {
        final Packet p;
        final String tid;
        final InputStream in;
        int seq;
        long sent;
        boolean finished;

        ChunkTask(Packet p, String tid, InputStream in) {
            this.p = p;
            this.tid = tid;
            this.in = in;
        }

        public void run() {
            try {
                if (closed) { finish(false); return; }
                byte[] buf = new byte[CHUNK_RAW];
                int n = 0;
                int wanted = (int) Math.min(buf.length, p.payloadSize - sent);
                while (n < wanted) {
                    int r = in.read(buf, n, wanted - n);
                    if (r < 0) throw new IOException("bluetooth payload truncated");
                    n += r;
                }
                sent += n;
                boolean last = sent == p.payloadSize;
                byte[] data = new byte[n];
                System.arraycopy(buf, 0, data, 0, n);
                Packet c = Packet.of(CHUNK, new Json.Obj().p("tid", tid).p("seq", seq++).p("data", Base64.encode(data)).p("last", last));
                writePacket(c);
                if (p.sendProgress != null) p.sendProgress.onProgress(sent, p.payloadSize);
                if (last) {
                    finish(true);
                } else if (!closed) {
                    writer.execute(this);
                } else finish(false);
            } catch (Exception e) {
                log.d("bt chunk failed: " + e.getMessage());
                finish(false);
            }
        }

        synchronized void finish(boolean ok) {
            if (finished) return;
            finished = true;
            outgoing.remove(this);
            try { in.close(); } catch (IOException ignored) { /* ignore */ }
            if (p.sendDone != null) p.sendDone.done(ok);
        }
    }

    @Override protected void closeTransport() {
        maintenance.shutdownNow();
        try { transport.close(); } catch (IOException ignored) { /* ignore */ }
        ChunkTask[] tasks;
        synchronized (outgoing) { tasks = outgoing.toArray(new ChunkTask[0]); }
        for (ChunkTask task : tasks) task.finish(false);
        synchronized (receivedFiles) {
            for (File file : receivedFiles) {
                //noinspection ResultOfMethodCallIgnored
                file.delete();
            }
            receivedFiles.clear();
        }
        synchronized (this) { receivedAt.clear(); }
    }
}
