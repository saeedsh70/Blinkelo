package com.saeedsh.islandlink;

import android.content.ContentResolver;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.util.Log;
import android.webkit.MimeTypeMap;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.MessageDigest;
import java.util.Locale;

/** Small helpers shared by the app layer. */
public final class Util {
    private Util() {}

    public static final String TAG = "BlinkeloLink";
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    public static void log(String msg) { Log.d(TAG, msg); }

    public static void main(Runnable r) { MAIN.post(r); }
    public static void mainDelayed(Runnable r, long ms) { MAIN.postDelayed(r, ms); }
    public static void cancelMain(Runnable r) { if (r != null) MAIN.removeCallbacks(r); }

    public static void toast(final Context ctx, final String msg) {
        main(new Runnable() {
            public void run() { Toast.makeText(ctx.getApplicationContext(), msg, Toast.LENGTH_SHORT).show(); }
        });
    }

    // ------------------------------------------------------------------ images
    public static Bitmap drawableToBitmap(Drawable d, int size) {
        if (d == null) return null;
        if (d instanceof BitmapDrawable && ((BitmapDrawable) d).getBitmap() != null) {
            Bitmap b = ((BitmapDrawable) d).getBitmap();
            return scaleToFit(b, size);
        }
        int w = d.getIntrinsicWidth() > 0 ? d.getIntrinsicWidth() : size;
        int h = d.getIntrinsicHeight() > 0 ? d.getIntrinsicHeight() : size;
        float k = Math.min(1f, (float) size / Math.max(w, h));
        int bw = Math.max(1, Math.round(w * k)), bh = Math.max(1, Math.round(h * k));
        Bitmap b = Bitmap.createBitmap(bw, bh, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        d.setBounds(0, 0, bw, bh);
        d.draw(c);
        return b;
    }

    public static Bitmap scaleToFit(Bitmap b, int size) {
        if (b == null) return null;
        int w = b.getWidth(), h = b.getHeight();
        if (w <= size && h <= size) return b;
        float k = (float) size / Math.max(w, h);
        return Bitmap.createScaledBitmap(b, Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)), true);
    }

    public static byte[] png(Bitmap b) {
        if (b == null) return null;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        return out.toByteArray();
    }

    public static byte[] jpeg(Bitmap b, int quality) {
        if (b == null) return null;
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.JPEG, quality, out);
        return out.toByteArray();
    }

    public static Bitmap decodeDataUrl(String dataUrl) {
        if (dataUrl == null || dataUrl.isEmpty()) return null;
        int comma = dataUrl.indexOf(',');
        String b64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
        byte[] bytes = com.saeedsh.islandlink.core.Base64.decode(b64);
        if (bytes.length == 0) return null;
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
    }

    public static String dataUrl(byte[] bytes, String mime) {
        return "data:" + mime + ";base64," + com.saeedsh.islandlink.core.Base64.encode(bytes);
    }

    // ------------------------------------------------------------------ apps
    public static String appLabel(Context ctx, String pkg) {
        try {
            PackageManager pm = ctx.getPackageManager();
            ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
            CharSequence l = pm.getApplicationLabel(ai);
            return l != null ? l.toString() : pkg;
        } catch (Exception e) {
            return pkg;
        }
    }

    public static Drawable appIcon(Context ctx, String pkg) {
        try {
            return ctx.getPackageManager().getApplicationIcon(pkg);
        } catch (Exception e) {
            return null;
        }
    }

    // ------------------------------------------------------------------ hashing
    public static String md5(byte[] data) {
        try {
            byte[] h = MessageDigest.getInstance("MD5").digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : h) sb.append(String.format(Locale.US, "%02x", b & 0xff));
            return sb.toString();
        } catch (Exception e) {
            return Integer.toHexString(java.util.Arrays.hashCode(data));
        }
    }

    // ------------------------------------------------------------------ content uris
    public static String uriName(Context ctx, Uri uri) {
        String name = null;
        if ("content".equals(uri.getScheme())) {
            Cursor c = null;
            try {
                c = ctx.getContentResolver().query(uri, new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null);
                if (c != null && c.moveToFirst() && !c.isNull(0)) name = c.getString(0);
            } catch (Exception ignored) { /* ignore */ } finally { if (c != null) c.close(); }
        }
        if (name == null) name = uri.getLastPathSegment();
        if (name == null || name.isEmpty()) name = "file";
        return name.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    public static long uriSize(Context ctx, Uri uri) {
        Cursor c = null;
        try {
            c = ctx.getContentResolver().query(uri, new String[] {OpenableColumns.SIZE}, null, null, null);
            if (c != null && c.moveToFirst() && !c.isNull(0)) return c.getLong(0);
        } catch (Exception ignored) { /* ignore */ } finally { if (c != null) c.close(); }
        try {
            android.content.res.AssetFileDescriptor fd = ctx.getContentResolver().openAssetFileDescriptor(uri, "r");
            if (fd != null) {
                long len = fd.getLength();
                fd.close();
                if (len >= 0) return len;
            }
        } catch (Exception ignored) { /* ignore */ }
        return -1;
    }

    public static String mimeOf(String name) {
        String ext = "";
        int dot = name.lastIndexOf('.');
        if (dot >= 0) ext = name.substring(dot + 1).toLowerCase(Locale.US);
        String m = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
        return m != null ? m : "application/octet-stream";
    }

    public static byte[] readAll(InputStream in, long max) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16 * 1024];
        int n;
        long total = 0;
        while ((n = in.read(buf)) > 0) {
            total += n;
            if (total > max) throw new IOException("too large");
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }

    public static void copy(InputStream in, OutputStream out) throws IOException {
        byte[] buf = new byte[64 * 1024];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
    }

    public static byte[] readUri(Context ctx, Uri uri, long max) throws IOException {
        ContentResolver cr = ctx.getContentResolver();
        InputStream in = cr.openInputStream(uri);
        if (in == null) throw new IOException("cannot open " + uri);
        try {
            return readAll(in, max);
        } finally {
            in.close();
        }
    }

    /** registerReceiver with the export flag Android 13+ wants (system broadcasts are delivered either way). */
    public static void register(Context ctx, android.content.BroadcastReceiver r, android.content.IntentFilter f) {
        if (android.os.Build.VERSION.SDK_INT >= 33) ctx.registerReceiver(r, f, Context.RECEIVER_NOT_EXPORTED);
        else ctx.registerReceiver(r, f);
    }

    public static android.content.Intent registerSticky(Context ctx, android.content.BroadcastReceiver r, android.content.IntentFilter f) {
        if (android.os.Build.VERSION.SDK_INT >= 33) return ctx.registerReceiver(r, f, Context.RECEIVER_NOT_EXPORTED);
        return ctx.registerReceiver(r, f);
    }

    public static int dp(Context ctx, float v) {
        return Math.round(v * ctx.getResources().getDisplayMetrics().density);
    }
}
