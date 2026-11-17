package com.saeedsh.islandlink;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;

import com.saeedsh.islandlink.core.Json;

import java.io.File;
import java.io.FileOutputStream;

/** Takes a photo with the system camera and drops it on the PC (island shelf + clipboard there). */
public class CameraActivity extends Activity {
    private static final int REQ = 7;
    private File photo;
    private String targetId;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        Notif.cancel(this, Notif.ID_CAMERA);
        targetId = state != null ? state.getString("deviceId") : getIntent().getStringExtra("deviceId");
        if (state != null && state.getString("photo") != null) {
            photo = new File(state.getString("photo"));
            return;
        }
        LinkService s = LinkService.get();
        if (targetId == null && s != null && s.active() != null) targetId = s.active().id;
        com.saeedsh.islandlink.core.Core.Device peer = s != null ? s.core.device(targetId) : null;
        if (peer == null || !peer.paired || !peer.connected()) {
            Util.toast(this, Strings.t(this, "not_connected"));
            finish();
            return;
        }
        File dir = new File(getCacheDir(), "shared");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        photo = new File(dir, "Photo-" + System.currentTimeMillis() + ".jpg");
        Uri out = FilesProvider.uriFor(this, photo);
        Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                .putExtra(MediaStore.EXTRA_OUTPUT, out)
                .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            startActivityForResult(cam, REQ);
        } catch (Exception e) {
            Util.toast(this, "Camera: " + e.getMessage());
            finish();
        }
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (photo != null) out.putString("photo", photo.getAbsolutePath());
        if (targetId != null) out.putString("deviceId", targetId);
    }

    @Override protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        if (req != REQ) return;
        if (result == RESULT_OK && photo != null && photo.length() > 0) {
            final File f = photo;
            LinkService service = LinkService.get();
            com.saeedsh.islandlink.core.Core.Device peer = service != null ? service.core.device(targetId) : null;
            final boolean bluetooth = peer != null && !peer.wifi();
            final String destination = targetId;
            new Thread(new Runnable() {
                public void run() {
                    File toSend = normalize(f, bluetooth ? 1920 : 3200);
                    LinkService s = LinkService.get();
                    if (s != null) s.plugins.transfers.sendFileTo(toSend, new Json.Obj().p("camera", true), destination);
                }
            }, "camera-send").start();
        }
        finish();
    }

    /** Applies the EXIF rotation and caps the size so the PC gets an upright, reasonably sized image. */
    private static File normalize(File f, int maxSide) {
        try {
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(f.getAbsolutePath(), o);
            int sample = 1;
            while (Math.max(o.outWidth, o.outHeight) / sample > maxSide * 2) sample *= 2;
            o = new BitmapFactory.Options();
            o.inSampleSize = sample;
            Bitmap b = BitmapFactory.decodeFile(f.getAbsolutePath(), o);
            if (b == null) return f;
            int rot = 0;
            int orient = new ExifInterface(f.getAbsolutePath()).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            if (orient == ExifInterface.ORIENTATION_ROTATE_90) rot = 90;
            else if (orient == ExifInterface.ORIENTATION_ROTATE_180) rot = 180;
            else if (orient == ExifInterface.ORIENTATION_ROTATE_270) rot = 270;
            b = Util.scaleToFit(b, maxSide);
            if (rot != 0) {
                Matrix m = new Matrix();
                m.postRotate(rot);
                b = Bitmap.createBitmap(b, 0, 0, b.getWidth(), b.getHeight(), m, true);
            }
            File out = new File(f.getParentFile(), f.getName().replace(".jpg", "") + "-s.jpg");
            FileOutputStream fo = new FileOutputStream(out);
            try { b.compress(Bitmap.CompressFormat.JPEG, 90, fo); } finally { fo.close(); }
            File named = new File(f.getParentFile(), f.getName());
            //noinspection ResultOfMethodCallIgnored
            f.delete();
            return out.renameTo(named) ? named : out;
        } catch (Exception e) {
            return f;
        }
    }
}
