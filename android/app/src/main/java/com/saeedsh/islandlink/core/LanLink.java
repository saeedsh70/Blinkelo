package com.saeedsh.islandlink.core;

import java.io.FilterInputStream;
import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import javax.net.ssl.SSLSocket;

/** Wi-Fi link: one TLS socket for packets, short-lived TLS sockets for payloads (KDE Connect style). */
public final class LanLink extends Link {
    static final int PAYLOAD_MIN_PORT = 1739;
    static final int PAYLOAD_MAX_PORT = 1764;

    private final SSLSocket sock;
    private final LineReader reader;
    private final OutputStream out;
    private final Tls tls;
    private final String address;
    private final Set<Closeable> payloadConnections = Collections.synchronizedSet(new HashSet<Closeable>());

    LanLink(Info info, SSLSocket sock, LineReader reader, Tls tls, String address, Core.Log log) throws IOException {
        super(info, log);
        this.sock = sock;
        this.reader = reader;
        this.out = sock.getOutputStream();
        this.tls = tls;
        this.address = address;
        try { sock.setKeepAlive(true); } catch (Exception ignored) { /* ignore */ }
    }

    @Override public boolean isBluetooth() { return false; }
    @Override public String address() { return address; }

    @Override protected void startReading() {
        Thread t = new Thread(new Runnable() {
            public void run() {
                try {
                    String line;
                    while (!closed && (line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty()) continue;
                        final Packet p = Packet.parse(line);
                        if (p == null) continue;
                        attachPayload(p);
                        deliver(p);
                    }
                } catch (IOException e) {
                    if (!closed) log.d("lan link read: " + e.getMessage());
                } finally {
                    close();
                }
            }
        }, "lan-reader-" + info.deviceName);
        t.setDaemon(true);
        t.start();
    }

    private void attachPayload(Packet p) {
        if (p.payloadSize < 0 || p.payloadTransferInfo == null) return;
        final int port = p.payloadTransferInfo.integer("port", 0);
        if (port < (info.islandPortFallback ? 1024 : PAYLOAD_MIN_PORT)
                || port > (info.islandPortFallback ? 65535 : PAYLOAD_MAX_PORT)) return;
        p.payloadIn = new Packet.PayloadIn() {
            public InputStream open() throws IOException {
                final Socket plain = new Socket();
                final SSLSocket s;
                try {
                    plain.connect(new InetSocketAddress(address, port), 8000);
                    s = tls.wrap(plain, false);
                    Tls.requirePeer(s, info.certSha256);
                } catch (IOException e) {
                    try { plain.close(); } catch (IOException ignored) { /* ignore */ }
                    throw e;
                }
                s.setSoTimeout(20000);
                return new FilterInputStream(s.getInputStream()) {
                    @Override public void close() throws IOException {
                        try { super.close(); } finally { try { s.close(); } catch (IOException ignored) { /* ignore */ } }
                    }
                };
            }
        };
    }

    @Override public boolean send(final Packet p) {
        return enqueue(p, new Runnable() {
                public void run() {
                    try {
                        if (p.payloadOut != null) sendWithPayload(p);
                        else writeLine(out, p.toLine());
                    } catch (IOException e) {
                        log.d("lan send failed: " + e.getMessage());
                        if (p.sendDone != null) p.sendDone.done(false);
                        close();
                    }
                }
            });
    }

    private void sendWithPayload(final Packet p) throws IOException {
        final ServerSocket ss = openPayloadServer();
        if (ss == null) {
            log.d("no free payload port");
            if (p.sendDone != null) p.sendDone.done(false);
            return;
        }
        payloadConnections.add(ss);
        if (closed) {
            payloadConnections.remove(ss);
            ss.close();
            throw new IOException("link closed before payload send");
        }
        p.payloadTransferInfo = new Json.Obj().p("port", ss.getLocalPort());
        p.payloadSize = p.payloadOut.size();
        try {
            writeLine(out, p.toLine());
        } catch (IOException e) {
            payloadConnections.remove(ss);
            try { ss.close(); } catch (IOException ignored) { /* ignore */ }
            throw e;
        }
        Thread t = new Thread(new Runnable() {
            public void run() {
                boolean ok = false;
                Socket c = null;
                InputStream in = null;
                try {
                    ss.setSoTimeout(30000);
                    c = ss.accept();
                    payloadConnections.add(c);
                    if (closed) throw new IOException("link closed during payload send");
                    SSLSocket s = tls.wrap(c, true);
                    payloadConnections.remove(c);
                    c = s;
                    payloadConnections.add(c);
                    if (closed) throw new IOException("link closed during payload handshake");
                    Tls.requirePeer(s, info.certSha256);
                    OutputStream o = s.getOutputStream();
                    in = p.payloadOut.open();
                    byte[] buf = new byte[64 * 1024];
                    long done = 0, total = p.payloadSize, last = 0;
                    int n;
                    while (done < total && (n = in.read(buf, 0, (int) Math.min(buf.length, total - done))) >= 0) {
                        if (n == 0) continue;
                        o.write(buf, 0, n);
                        done += n;
                        if (p.sendProgress != null && (done - last > 256 * 1024 || done >= total)) {
                            last = done;
                            p.sendProgress.onProgress(done, total);
                        }
                    }
                    o.flush();
                    ok = done == total;
                } catch (IOException e) {
                    log.d("payload send failed: " + e.getMessage());
                } finally {
                    payloadConnections.remove(ss);
                    if (c != null) payloadConnections.remove(c);
                    try { ss.close(); } catch (IOException ignored) { /* ignore */ }
                    try { if (in != null) in.close(); } catch (IOException ignored) { /* ignore */ }
                    try { if (c != null) c.close(); } catch (IOException ignored) { /* ignore */ }
                    if (p.sendDone != null) p.sendDone.done(ok);
                }
            }
        }, "payload-send");
        t.setDaemon(true);
        t.start();
    }

    private ServerSocket openPayloadServer() {
        for (int port = PAYLOAD_MIN_PORT; port <= PAYLOAD_MAX_PORT; port++) {
            try {
                ServerSocket ss = new ServerSocket();
                ss.setReuseAddress(true);
                ss.bind(new InetSocketAddress(port));
                return ss;
            } catch (IOException ignored) { /* try next */ }
        }
        if (info.islandPortFallback) try { return new ServerSocket(0); } catch (IOException ignored) {}
        return null;
    }

    @Override protected void closeTransport() {
        try { sock.close(); } catch (IOException ignored) { /* ignore */ }
        Closeable[] active;
        synchronized (payloadConnections) { active = payloadConnections.toArray(new Closeable[0]); }
        for (Closeable connection : active) {
            try { connection.close(); } catch (IOException ignored) { /* ignore */ }
        }
    }
}
