package com.saeedsh.islandlink.core;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.atomic.AtomicLong;

/** One protocol packet: a JSON line, optionally followed by a payload transferred separately. */
public final class Packet {
    private static final AtomicLong LAST_ID = new AtomicLong();

    public long id;
    public String type;
    public Json.Obj body;
    public long payloadSize = -1;
    public Json.Obj payloadTransferInfo;

    /** Outgoing payload (set by the sender). */
    public transient PayloadOut payloadOut;
    /** Incoming payload (set by the link that received the packet). */
    public transient PayloadIn payloadIn;
    /** Optional callbacks for outgoing payload transfers. */
    public transient Progress sendProgress;
    public transient Done sendDone;

    public interface Done {
        void done(boolean ok);
    }

    public interface PayloadOut {
        long size();
        InputStream open() throws IOException;
    }

    public interface PayloadIn {
        InputStream open() throws IOException;
    }

    public interface Progress {
        void onProgress(long done, long total);
    }

    public Packet(String type, Json.Obj body) {
        long now = System.currentTimeMillis();
        long prev;
        do { prev = LAST_ID.get(); } while (!LAST_ID.compareAndSet(prev, Math.max(prev + 1, now)));
        this.id = Math.max(prev + 1, now);
        this.type = type;
        this.body = body != null ? body : new Json.Obj();
    }

    public static Packet of(String type) { return new Packet(type, new Json.Obj()); }
    public static Packet of(String type, Json.Obj body) { return new Packet(type, body); }

    public Packet withPayload(final byte[] data) {
        payloadOut = new PayloadOut() {
            public long size() { return data.length; }
            public InputStream open() { return new ByteArrayInputStream(data); }
        };
        payloadSize = data.length;
        return this;
    }

    public Packet withPayload(final File file) {
        payloadOut = new PayloadOut() {
            public long size() { return file.length(); }
            public InputStream open() throws IOException { return new FileInputStream(file); }
        };
        payloadSize = file.length();
        return this;
    }

    public Packet withPayload(PayloadOut out) {
        payloadOut = out;
        payloadSize = out.size();
        return this;
    }

    public String toLine() {
        Json.Obj o = new Json.Obj().p("id", id).p("type", type).p("body", body);
        if (payloadSize >= 0 && (payloadOut != null || payloadTransferInfo != null)) {
            o.p("payloadSize", payloadSize);
            o.p("payloadTransferInfo", payloadTransferInfo != null ? payloadTransferInfo : new Json.Obj());
        }
        return Json.stringify(o) + "\n";
    }

    /** Parses one line; returns null for anything that is not a packet. */
    public static Packet parse(String line) {
        Json.Obj o = Json.parseObj(line);
        if (o == null) return null;
        String type = o.str("type", "");
        if (type.isEmpty()) return null;
        Json.Obj body = o.obj("body");
        Packet p = new Packet(type, body != null ? body : new Json.Obj());
        p.id = o.lng("id", p.id);
        if (o.has("payloadSize")) p.payloadSize = o.lng("payloadSize", -1);
        p.payloadTransferInfo = o.obj("payloadTransferInfo");
        return p;
    }

    public boolean hasPayload() { return payloadSize >= 0 && payloadIn != null; }

    /** Reads the whole payload into memory (null when missing or larger than {@code max}). */
    public byte[] readPayload(long max) throws IOException {
        if (!hasPayload() || payloadSize > max) return null;
        ByteArrayOutputStream bos = new ByteArrayOutputStream((int) Math.min(payloadSize, 1 << 20));
        copyPayload(bos, null);
        return bos.toByteArray();
    }

    public void savePayload(File file, Progress progress) throws IOException {
        OutputStream out = new FileOutputStream(file);
        try {
            copyPayload(out, progress);
        } finally {
            out.close();
        }
    }

    public void copyPayload(OutputStream out, Progress progress) throws IOException {
        if (!hasPayload()) throw new IOException("no payload");
        InputStream in = payloadIn.open();
        try {
            byte[] buf = new byte[64 * 1024];
            long done = 0;
            long lastReport = 0;
            while (done < payloadSize) {
                int n = in.read(buf, 0, (int) Math.min(buf.length, payloadSize - done));
                if (n < 0) break;
                out.write(buf, 0, n);
                done += n;
                if (progress != null && (done - lastReport > 256 * 1024 || done == payloadSize)) {
                    lastReport = done;
                    progress.onProgress(done, payloadSize);
                }
            }
            if (done < payloadSize) throw new IOException("payload truncated " + done + "/" + payloadSize);
        } finally {
            try { in.close(); } catch (IOException ignored) { /* ignore */ }
        }
    }

    @Override public String toString() { return type + " " + Json.stringify(body); }
}
