package com.saeedsh.islandlink;

import android.Manifest;
import android.app.Notification;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.drawable.Icon;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.saeedsh.islandlink.core.Core;
import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;

/** File / link / text sharing in both directions, plus PC screenshots and clipboard images. */
final class Transfers {
    static final String FOLDER = "Blinkelo";
    private final Context ctx;
    private final ExecutorService io = createIoExecutor();
    private final AtomicInteger counter = new AtomicInteger();
    private final java.util.concurrent.ConcurrentHashMap<String, Ack> acknowledgements = new java.util.concurrent.ConcurrentHashMap<String, Ack>();

    private final class Ack implements Packet.Done {
        final String id, peer;
        final Packet.Done callback;
        boolean sent, finished;
        Boolean received;
        Ack(String id, String peer, Packet.Done callback) { this.id = id; this.peer = peer; this.callback = callback; }
        synchronized void finish(boolean ok) {
            if (finished) return;
            finished = true; acknowledgements.remove(id, this); callback.done(ok);
        }
        public synchronized void done(boolean ok) {
            if (!ok) { finish(false); return; }
            sent = true;
            if (received != null) finish(received);
            else Util.mainDelayed(new Runnable() { public void run() { finish(false); } }, 30000);
        }
        synchronized void receive(boolean ok) { received = ok; if (sent) finish(ok); }
    }

    void onTransferResult(Core.Device peer, Json.Obj result) {
        Ack ack = acknowledgements.get(result.str("id", ""));
        if (ack != null && ack.peer.equals(peer.id)) ack.receive(result.bool("ok"));
    }

    private void acknowledge(Core.Device peer, Packet p, boolean ok) {
        String id = p.body.str("transferId", "");
        LinkService s = LinkService.get();
        if (!id.isEmpty() && id.length() <= 128 && s != null)
            s.sendTo(peer.id, Packet.of("island.transfer.result", new Json.Obj().p("id", id).p("ok", ok)));
    }

    Transfers(Context ctx) { this.ctx = ctx.getApplicationContext(); }

    private static ExecutorService createIoExecutor() {
        // Finish accepted jobs (which own URI streams), then let all idle workers exit.
        // A stopped service must not leave a permanent pair of threads behind.
        ThreadPoolExecutor pool = new ThreadPoolExecutor(2, 2, 30, TimeUnit.SECONDS,
                new LinkedBlockingQueue<Runnable>());
        pool.allowCoreThreadTimeOut(true);
        return pool;
    }

    // ------------------------------------------------------------------ sending
    /** Opens URI grants immediately, then prepares payloads off the activity's main thread. */
    int sendUris(List<Uri> uris) {
        final LinkService s = LinkService.get();
        if (s == null || s.active() == null) { Util.toast(ctx, Strings.t(ctx, "not_connected")); return 0; }
        return sendUrisTo(uris, s.active().id);
    }

    int sendUrisTo(List<Uri> uris, final String targetId) {
        final LinkService s = LinkService.get();
        Core.Device peer = s != null ? s.core.device(targetId) : null;
        if (peer == null || !peer.paired || !peer.connected()) { Util.toast(ctx, Strings.t(ctx, "not_connected")); return 0; }
        final List<Object[]> opened = new ArrayList<Object[]>();
        for (Uri u : uris) {
            InputStream in = null;
            try {
                in = ctx.getContentResolver().openInputStream(u);
                if (in == null) continue;
                String name = Util.uriName(ctx, u);
                long size = Util.uriSize(ctx, u);
                opened.add(new Object[] {name, size, in, null});
                in = null; // ownership passes to the background preparation job
            } catch (Exception e) {
                Util.log("open " + u + ": " + e);
            } finally {
                close(in);
            }
        }
        if (opened.isEmpty()) return 0;
        io.execute(new Runnable() {
            public void run() {
                List<Object[]> items = new ArrayList<Object[]>();
                long total = 0;
                for (Object[] it : opened) {
                    InputStream in = (InputStream) it[2];
                    File tmp = null;
                    try {
                        long size = (Long) it[1];
                        if (size < 0) {
                            // Providers can give different files the same display name.
                            tmp = File.createTempFile("outgoing-", ".tmp", sharedDir());
                            try (OutputStream out = new FileOutputStream(tmp)) { Util.copy(in, out); }
                            close(in);
                            it[2] = null;
                            it[3] = tmp;
                            it[1] = tmp.length();
                            size = tmp.length();
                        }
                        items.add(it);
                        total += size;
                    } catch (Exception e) {
                        close(in);
                        if (tmp != null) tmp.delete();
                        Util.log("prepare share: " + e);
                        Util.toast(ctx, Strings.t(ctx, "file_failed"));
                    }
                }
                for (Object[] it : items) {
                    final String name = (String) it[0];
                    final long size = (Long) it[1];
                    final InputStream in = (InputStream) it[2];
                    final File file = (File) it[3];
                    Json.Obj body = new Json.Obj().p("filename", name).p("numberOfFiles", items.size()).p("totalPayloadSize", total)
                            .p("lastModified", System.currentTimeMillis());
                    Packet p = Packet.of("kdeconnect.share.request", body);
                    if (file != null) p.withPayload(file);
                    else p.withPayload(new Packet.PayloadOut() {
                        boolean used;
                        public long size() { return size; }
                        public synchronized InputStream open() throws IOException {
                            if (used) throw new IOException("stream already used");
                            used = true;
                            return in;
                        }
                    });
                    trackOutgoing(p, name, targetId);
                    final Packet.Done notify = p.sendDone;
                    p.sendDone = new Packet.Done() {
                        final AtomicBoolean completed = new AtomicBoolean();
                        public void done(boolean ok) {
                            if (!completed.compareAndSet(false, true)) return;
                            close(in);
                            if (file != null) file.delete();
                            notify.done(ok);
                        }
                    };
                    if (!s.sendTo(targetId, p)) p.sendDone.done(false);
                }
            }
        });
        return opened.size();
    }

    private static void close(InputStream in) {
        if (in != null) try { in.close(); } catch (IOException ignored) { /* ignore */ }
    }

    boolean sendFile(File f, Json.Obj extra) {
        LinkService s = LinkService.get();
        if (s == null || s.active() == null) { Util.toast(ctx, Strings.t(ctx, "not_connected")); return false; }
        return sendFileTo(f, extra, s.active().id);
    }

    boolean sendFileTo(File f, Json.Obj extra, String targetId) {
        LinkService s = LinkService.get();
        Core.Device peer = s != null ? s.core.device(targetId) : null;
        if (peer == null || !peer.paired || !peer.connected()) { Util.toast(ctx, Strings.t(ctx, "not_connected")); return false; }
        Json.Obj body = new Json.Obj().p("filename", f.getName()).p("numberOfFiles", 1).p("totalPayloadSize", f.length())
                .p("lastModified", f.lastModified());
        if (extra != null) body.p("island", extra);
        Packet p = Packet.of("kdeconnect.share.request", body).withPayload(f);
        trackOutgoing(p, f.getName(), targetId);
        boolean sent = s.sendTo(targetId, p);
        if (!sent) p.sendDone.done(false);
        return sent;
    }

    boolean sendText(String text) {
        LinkService s = LinkService.get();
        return s != null && s.send(Packet.of("kdeconnect.share.request", new Json.Obj().p("text", text)));
    }

    boolean sendUrl(String url) {
        LinkService s = LinkService.get();
        return s != null && s.send(Packet.of("kdeconnect.share.request", new Json.Obj().p("url", url)));
    }

    private void trackOutgoing(Packet p, final String name, String targetId) {
        final int id = Notif.ID_TRANSFER_BASE + (counter.incrementAndGet() % 500);
        final String tid = "out" + id;
        LinkService service = LinkService.get();
        Core.Device target = service != null ? service.core.device(targetId) : null;
        final String pc = target != null ? target.name : "PC";
        progress(id, Strings.t(ctx, "file_sending", "name", name), 0, 1);
        UiBus.emit("transfer", new Json.Obj().p("id", tid).p("name", name).p("dir", "out").p("done", 0).p("total", p.payloadSize).p("state", "active"));
        p.sendProgress = new Packet.Progress() {
            long lastUi;
            public void onProgress(long done, long total) {
                progress(id, Strings.t(ctx, "file_sending", "name", name), done, total);
                long now = System.currentTimeMillis();
                if (now - lastUi > 250 || done >= total) {
                    lastUi = now;
                    UiBus.emit("transfer", new Json.Obj().p("id", tid).p("name", name).p("dir", "out").p("done", done).p("total", total).p("state", "active"));
                }
            }
        };
        p.sendDone = new Packet.Done() {
            public void done(boolean ok) {
                Notif.cancel(ctx, id);
                if (ok) Util.toast(ctx, Strings.t(ctx, "file_sent", "pc", pc));
                else Util.toast(ctx, Strings.t(ctx, "file_failed"));
                UiBus.emit("transfer", new Json.Obj().p("id", tid).p("name", name).p("dir", "out").p("state", ok ? "done" : "failed"));
            }
        };
        LinkService s = LinkService.get();
        Core.Device peer = s != null ? s.core.device(targetId) : null;
        if (peer != null && peer.info != null && peer.info.incoming.contains("island.transfer.result")) {
            String transferId = java.util.UUID.randomUUID().toString();
            p.body.p("transferId", transferId);
            final Ack ack = new Ack(transferId, targetId, p.sendDone);
            acknowledgements.put(transferId, ack); p.sendDone = ack;
            Util.mainDelayed(new Runnable() { public void run() { ack.finish(false); } }, 10 * 60000);
        }
    }

    private void progress(int id, String title, long done, long total) {
        int pct = total > 0 ? (int) Math.min(100, done * 100 / total) : 0;
        Notification n = Notif.builder(ctx, Notif.CH_TRANSFER)
                .setContentTitle(title)
                .setProgress(100, pct, total <= 0)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .build();
        Notif.show(ctx, id, n);
    }

    // ------------------------------------------------------------------ receiving
    void onShare(final Core.Device d, final Packet p) {
        Json.Obj b = p.body;
        if (b.has("url")) { onUrl(d, b.str("url")); return; }
        if (b.has("text") && !p.hasPayload()) { onText(d, b.str("text")); return; }
        if (!p.hasPayload()) return;
        final String name = safeName(b.str("filename", "file"));
        final boolean image = Util.mimeOf(name).startsWith("image/");
        io.execute(new Runnable() {
            public void run() {
                final int id = Notif.ID_TRANSFER_BASE + (counter.incrementAndGet() % 500);
                final String tid = "in" + id;
                try {
                    Uri uri = save(p, name, Util.mimeOf(name), false, new Packet.Progress() {
                        long lastUi;
                        public void onProgress(long done, long total) {
                            progress(id, Strings.t(ctx, "file_receiving", "name", name), done, total);
                            long now = System.currentTimeMillis();
                            if (now - lastUi > 250 || done >= total) {
                                lastUi = now;
                                UiBus.emit("transfer", new Json.Obj().p("id", tid).p("name", name).p("dir", "in").p("done", done).p("total", total).p("state", "active"));
                            }
                        }
                    });
                    Notif.cancel(ctx, id);
                    remember(name, uri, Util.mimeOf(name), p.payloadSize, d.name);
                    acknowledge(d, p, true);
                    UiBus.emit("transfer", new Json.Obj().p("id", tid).p("name", name).p("dir", "in").p("state", "done").p("uri", uri.toString()));
                    notifyReceived(id, name, uri, image);
                } catch (Exception e) {
                    Util.log("receive failed: " + e);
                    acknowledge(d, p, false);
                    Notif.cancel(ctx, id);
                    UiBus.emit("transfer", new Json.Obj().p("id", tid).p("name", name).p("dir", "in").p("state", "failed"));
                    Util.toast(ctx, Strings.t(ctx, "file_failed"));
                }
            }
        });
    }

    private void onUrl(Core.Device d, String url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) return;
        Intent view = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        Notification n = Notif.builder(ctx, Notif.CH_PC)
                .setContentTitle(Strings.t(ctx, "link_received", "pc", d.name))
                .setContentText(url)
                .setAutoCancel(true)
                .setContentIntent(Notif.activity(ctx, url.hashCode(), view))
                .addAction(new Notification.Action.Builder(Icon.createWithResource(ctx, R.drawable.ic_act_clipboard), Strings.t(ctx, "act_copy"),
                        Notif.action(ctx, url.hashCode() + 1, ActionReceiver.COPY_TEXT, "text", url)).build())
                .build();
        Notif.show(ctx, Notif.ID_TRANSFER_BASE + 600 + (counter.incrementAndGet() % 100), n);
        UiBus.emit("link", new Json.Obj().p("url", url).p("from", d.name));
    }

    private void onText(Core.Device d, String text) {
        ClipboardManager cm = ctx.getSystemService(ClipboardManager.class);
        if (cm != null) try { cm.setPrimaryClip(ClipData.newPlainText("Blinkelo Link", text)); } catch (Exception ignored) { /* ignore */ }
        Util.toast(ctx, Strings.t(ctx, "text_copied", "pc", d.name));
        UiBus.emit("clipboard", new Json.Obj().p("text", text).p("from", "pc"));
    }

    void onScreenshot(final Core.Device d, final Packet p) {
        if (!p.hasPayload()) { UiBus.emit("screenshot", new Json.Obj().p("error", true)); return; }
        io.execute(new Runnable() {
            public void run() {
                try {
                    String name = "PC-" + new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(new Date()) + ".jpg";
                    Uri uri = save(p, name, "image/jpeg", true, null);
                    remember(name, uri, "image/jpeg", p.payloadSize, d.name);
                    LinkService s = LinkService.get();
                    if (s != null && s.active() != null && d.id.equals(s.active().id))
                        UiBus.emit("screenshot", new Json.Obj().p("uri", uri.toString()).p("name", name).p("w", p.body.integer("w", 0)).p("h", p.body.integer("h", 0)));
                    Util.toast(ctx, Strings.t(ctx, "screenshot_saved"));
                } catch (Exception e) {
                    Util.log("screenshot save failed: " + e);
                    LinkService s = LinkService.get();
                    if (s != null && s.active() != null && d.id.equals(s.active().id)) UiBus.emit("screenshot", new Json.Obj().p("error", true));
                }
            }
        });
    }

    void onClipboardImage(final Core.Device d, final Packet p) {
        if (!p.hasPayload() || !Settings.section(ctx, "clipboard").bool("receive", true)) return;
        io.execute(new Runnable() {
            public void run() {
                try {
                    File f = new File(sharedDir(), "clipboard-" + System.currentTimeMillis() + ".png");
                    p.savePayload(f, null);
                    Uri uri = FilesProvider.uriFor(ctx, f);
                    ClipboardManager cm = ctx.getSystemService(ClipboardManager.class);
                    if (cm != null) cm.setPrimaryClip(ClipData.newUri(ctx.getContentResolver(), "Blinkelo Link", uri));
                    UiBus.emit("clipboard", new Json.Obj().p("image", uri.toString()).p("from", "pc"));
                } catch (Exception e) {
                    Util.log("clipboard image failed: " + e);
                }
            }
        });
    }

    // ------------------------------------------------------------------ storage
    File sharedDir() {
        File dir = new File(ctx.getCacheDir(), "shared");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        return dir;
    }

    private static String safeName(String n) {
        String s = n.replaceAll("[\\\\/:*?\"<>|\\u0000-\\u001f]", "_").trim();
        if (s.isEmpty() || s.equals(".") || s.equals("..")) s = "file";
        return s.length() > 120 ? s.substring(s.length() - 120) : s;
    }

    /** Saves a payload to Downloads (or Pictures) / Blinkelo and returns a shareable uri. */
    private Uri save(Packet p, String name, String mime, boolean picture, Packet.Progress progress) throws IOException {
        if (Build.VERSION.SDK_INT >= 29) {
            ContentResolver cr = ctx.getContentResolver();
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, (picture ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS) + "/" + FOLDER);
            v.put(MediaStore.MediaColumns.IS_PENDING, 1);
            Uri collection = picture ? MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                    : MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);
            Uri uri = cr.insert(collection, v);
            if (uri == null) throw new IOException("MediaStore insert failed");
            boolean saved = false;
            try {
                try (OutputStream out = cr.openOutputStream(uri)) {
                    if (out == null) throw new IOException("cannot open output");
                    p.copyPayload(out, progress);
                }
                v.clear();
                v.put(MediaStore.MediaColumns.IS_PENDING, 0);
                if (cr.update(uri, v, null, null) <= 0) throw new IOException("cannot publish received file");
                saved = true;
                return uri;
            } finally {
                if (!saved) cr.delete(uri, null, null);
            }
        }
        File base;
        boolean canWrite = ctx.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        if (canWrite) base = Environment.getExternalStoragePublicDirectory(picture ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS);
        else base = ctx.getExternalFilesDir(picture ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS);
        if (base == null) base = ctx.getFilesDir();
        File dir = new File(base, FOLDER);
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        File f = unique(dir, name);
        try { p.savePayload(f, progress); }
        catch (IOException e) { f.delete(); throw e; }
        MediaScannerConnection.scanFile(ctx, new String[] {f.getAbsolutePath()}, new String[] {mime}, null);
        return FilesProvider.uriFor(ctx, f);
    }

    private static File unique(File dir, String name) {
        File f = new File(dir, name);
        if (!f.exists()) return f;
        int dot = name.lastIndexOf('.');
        String stem = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        for (int i = 2; i < 1000; i++) {
            f = new File(dir, stem + " (" + i + ")" + ext);
            if (!f.exists()) return f;
        }
        return new File(dir, stem + "-" + System.currentTimeMillis() + ext);
    }

    private void notifyReceived(int id, String name, Uri uri, boolean image) {
        Intent view = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, Util.mimeOf(name)).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        Intent share = Intent.createChooser(new Intent(Intent.ACTION_SEND).setType(Util.mimeOf(name)).putExtra(Intent.EXTRA_STREAM, uri)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION), name);
        Notification.Builder nb = Notif.builder(ctx, Notif.CH_PC)
                .setContentTitle(Strings.t(ctx, "file_received"))
                .setContentText(name)
                .setAutoCancel(true)
                .setContentIntent(Notif.activity(ctx, id, view))
                .addAction(new Notification.Action.Builder(Icon.createWithResource(ctx, R.drawable.ic_act_share), Strings.t(ctx, "act_share"),
                        Notif.activity(ctx, id + 10000, share)).build());
        if (image) {
            try (InputStream in = ctx.getContentResolver().openInputStream(uri)) {
                android.graphics.BitmapFactory.Options options = new android.graphics.BitmapFactory.Options();
                options.inJustDecodeBounds = true;
                android.graphics.BitmapFactory.decodeStream(in, null, options);
                int sample = 1;
                while (Math.max(options.outWidth, options.outHeight) / sample > 2048) sample *= 2;
                options.inJustDecodeBounds = false;
                options.inSampleSize = sample;
                android.graphics.Bitmap thumb;
                try (InputStream imageIn = ctx.getContentResolver().openInputStream(uri)) {
                    thumb = android.graphics.BitmapFactory.decodeStream(imageIn, null, options);
                }
                if (thumb != null) nb.setStyle(new Notification.BigPictureStyle().bigPicture(Util.scaleToFit(thumb, 1024)));
            } catch (Exception ignored) { /* no preview */ }
        }
        Notif.show(ctx, id, nb.build());
    }

    private synchronized void remember(String name, Uri uri, String mime, long size, String from) {
        Json.Arr list = Json.parseArr(Settings.state(ctx, "received", "[]"));
        if (list == null) list = new Json.Arr();
        list.add(0, new Json.Obj().p("name", name).p("uri", uri.toString()).p("mime", mime).p("size", size).p("from", from).p("time", System.currentTimeMillis()));
        while (list.size() > 40) list.remove(list.size() - 1);
        Settings.setState(ctx, "received", Json.stringify(list));
        UiBus.emit("received", list);
    }

    Json.Arr recent() {
        Json.Arr list = Json.parseArr(Settings.state(ctx, "received", "[]"));
        return list != null ? list : new Json.Arr();
    }
}
