package com.saeedsh.islandlink.core;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;

/** A connection to one device (Wi-Fi/TLS or Bluetooth). Packets are newline-terminated JSON. */
public abstract class Link {
    public static final Charset UTF8 = Charset.forName("UTF-8");

    public interface Listener {
        void onPacket(Link link, Packet p);
        void onClosed(Link link);
    }

    /** What we learned about the peer during the handshake. */
    public static final class Info {
        public String deviceId;
        public String deviceName;
        public String deviceType;
        public int protocolVersion;
        public List<String> incoming = new ArrayList<String>();
        public List<String> outgoing = new ArrayList<String>();
        public byte[] certDer;
        public String certSha256;
        public byte[] spki;
        public boolean btAuthenticated;
        public byte[] btSendKey, btReceiveKey, btSendContext, btReceiveContext;
        public boolean islandPortFallback;
        public long maxBluetoothPayload = 150L * 1024 * 1024;
    }

    public final Info info;
    protected volatile Listener listener;
    protected volatile boolean closed;
    protected final ExecutorService writer;
    protected final Core.Log log;

    protected Link(Info info, Core.Log log) {
        this.info = info;
        this.log = log;
        this.writer = Executors.newSingleThreadExecutor(new ThreadFactory() {
            public Thread newThread(Runnable r) {
                Thread t = new Thread(r, "link-writer");
                t.setDaemon(true);
                return t;
            }
        });
    }

    public abstract boolean isBluetooth();
    public abstract String address();
    /** Queue a packet (and its payload, if any). Never blocks the caller. */
    public abstract boolean send(Packet p);
    protected abstract void startReading();
    protected abstract void closeTransport();

    public final void start(Listener l) {
        this.listener = l;
        startReading();
    }

    public boolean isClosed() { return closed; }

    /** Releases already-buffered payloads when a packet is ignored, without opening a LAN socket. */
    public void discardPayload(Packet p) { }

    /** A queued payload owns its completion callback even if shutdown happens before it starts. */
    protected final boolean enqueue(Packet packet, Runnable action) {
        if (closed) return false;
        try { writer.execute(new QueuedSend(packet, action)); return true; }
        catch (RuntimeException e) { return false; }
    }

    private final class QueuedSend implements Runnable {
        final Packet packet;
        final Runnable action;
        boolean claimed;
        QueuedSend(Packet packet, Runnable action) { this.packet = packet; this.action = action; }
        synchronized boolean claim() {
            if (claimed) return false;
            claimed = true;
            return true;
        }
        public void run() {
            if (!claim()) return;
            if (closed) { if (packet.sendDone != null) packet.sendDone.done(false); }
            else action.run();
        }
        void cancel() {
            if (claim() && packet.sendDone != null) packet.sendDone.done(false);
        }
    }

    public final void close() {
        synchronized (this) {
            if (closed) return;
            closed = true;
        }
        closeTransport();
        for (Runnable pending : writer.shutdownNow()) {
            if (pending instanceof Link.QueuedSend) ((QueuedSend) pending).cancel();
        }
        Listener l = listener;
        if (l != null) l.onClosed(this);
    }

    protected void deliver(Packet p) {
        Listener l = listener;
        if (l != null && !closed) l.onPacket(this, p);
    }

    protected static void writeLine(OutputStream out, String line) throws IOException {
        out.write(line.getBytes(UTF8));
        out.flush();
    }

    // ------------------------------------------------------------------ line reader (no read-ahead past what it returns)
    public static final class LineReader {
        private final InputStream in;
        private final int maxLine;
        private final byte[] buf = new byte[16 * 1024];
        private int pos, len;

        public LineReader(InputStream in, int maxLine) {
            this.in = in;
            this.maxLine = maxLine;
        }

        /** Next line without the newline; null at end of stream. */
        public String readLine() throws IOException {
            ByteArrayOutputStream line = null;
            while (true) {
                if (pos >= len) {
                    len = in.read(buf, 0, buf.length);
                    pos = 0;
                    if (len <= 0) {
                        len = 0;
                        if (line != null && line.size() > 0) return new String(line.toByteArray(), UTF8);
                        return null;
                    }
                }
                int start = pos;
                while (pos < len && buf[pos] != '\n') pos++;
                if (line == null) line = new ByteArrayOutputStream(256);
                line.write(buf, start, pos - start);
                if (line.size() > maxLine) throw new IOException("line too long");
                if (pos < len) { // found newline
                    pos++;
                    byte[] b = line.toByteArray();
                    int n = b.length;
                    if (n > 0 && b[n - 1] == '\r') n--;
                    return new String(b, 0, n, UTF8);
                }
            }
        }

        /** Reads one line byte by byte (used before a TLS handshake so nothing is over-read). */
        public static String readPlainLine(InputStream in, int max) throws IOException {
            ByteArrayOutputStream out = new ByteArrayOutputStream(512);
            while (true) {
                int c = in.read();
                if (c < 0) throw new IOException("closed during identity");
                if (c == '\n') break;
                out.write(c);
                if (out.size() > max) throw new IOException("identity too large");
            }
            return new String(out.toByteArray(), UTF8).trim();
        }
    }
}
