package com.saeedsh.islandlink;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.Environment;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

/** Minimal FileProvider replacement (no AndroidX): shares our cache/files and the Blinkelo download folder. */
public class FilesProvider extends ContentProvider {

    static String authority(Context ctx) { return ctx.getPackageName() + ".files"; }

    private static File[] roots(Context ctx) {
        File ext = Environment.getExternalStorageDirectory();
        return new File[] {ctx.getCacheDir(), ctx.getFilesDir(), ctx.getExternalFilesDir(null), ext};
    }

    private static final String[] NAMES = {"cache", "files", "extfiles", "ext"};

    /** content:// uri for a file inside one of the roots. */
    static Uri uriFor(Context ctx, File f) {
        try {
            String path = f.getCanonicalPath();
            File[] r = roots(ctx);
            for (int i = 0; i < r.length; i++) {
                if (r[i] == null) continue;
                String root = r[i].getCanonicalPath();
                if (path.startsWith(root + File.separator)) {
                    return new Uri.Builder().scheme("content").authority(authority(ctx)).appendPath(NAMES[i])
                            .appendEncodedPath(Uri.encode(path.substring(root.length() + 1), "/")).build();
                }
            }
        } catch (IOException ignored) { /* fall through */ }
        throw new IllegalArgumentException("not shareable: " + f);
    }

    private File fileFor(Uri uri) throws FileNotFoundException {
        Context ctx = getContext();
        if (ctx == null) throw new FileNotFoundException();
        java.util.List<String> seg = uri.getPathSegments();
        if (seg.size() < 2) throw new FileNotFoundException(uri.toString());
        File[] r = roots(ctx);
        for (int i = 0; i < NAMES.length; i++) {
            if (!NAMES[i].equals(seg.get(0)) || r[i] == null) continue;
            String rel = uri.getPath().substring(seg.get(0).length() + 2);
            try {
                File f = new File(r[i], rel).getCanonicalFile();
                if (!f.getPath().startsWith(r[i].getCanonicalPath() + File.separator)) throw new FileNotFoundException("outside root");
                return f;
            } catch (IOException e) {
                throw new FileNotFoundException(e.getMessage());
            }
        }
        throw new FileNotFoundException(uri.toString());
    }

    @Override public boolean onCreate() { return true; }

    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        File f = fileFor(uri);
        int m = "r".equals(mode) ? ParcelFileDescriptor.MODE_READ_ONLY : ParcelFileDescriptor.parseMode(mode);
        return ParcelFileDescriptor.open(f, m);
    }

    @Override public Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) {
        File f;
        try { f = fileFor(uri); } catch (FileNotFoundException e) { return null; }
        String[] cols = projection != null ? projection : new String[] {OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE};
        MatrixCursor c = new MatrixCursor(cols, 1);
        Object[] row = new Object[cols.length];
        for (int i = 0; i < cols.length; i++) {
            if (OpenableColumns.DISPLAY_NAME.equals(cols[i])) row[i] = f.getName();
            else if (OpenableColumns.SIZE.equals(cols[i])) row[i] = f.length();
        }
        c.addRow(row);
        return c;
    }

    @Override public String getType(Uri uri) {
        String last = uri.getLastPathSegment();
        return Util.mimeOf(last == null ? "" : last);
    }

    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
    @Override public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] selectionArgs) { return 0; }
}
