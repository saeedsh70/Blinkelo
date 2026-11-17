package com.saeedsh.islandlink;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcelable;
import android.util.Patterns;

import java.util.ArrayList;
import java.util.List;

/** "Send to PC" in the Android share sheet: files, links and text. */
public class ShareActivity extends Activity {
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        final LinkService s = LinkService.get();
        if (s == null || s.active() == null) {
            Util.toast(this, Strings.t(this, "not_connected"));
            LinkService.start(this);
            finish();
            return;
        }
        Intent in = getIntent();
        final List<Uri> uris = new ArrayList<Uri>();
        if (Intent.ACTION_SEND_MULTIPLE.equals(in.getAction())) {
            ArrayList<Parcelable> list = in.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
            if (list != null) for (Parcelable p : list) if (p instanceof Uri) uris.add((Uri) p);
        } else {
            Parcelable p = in.getParcelableExtra(Intent.EXTRA_STREAM);
            if (p instanceof Uri) uris.add((Uri) p);
        }
        // This activity is exported. Never let another app ask us to read our private files
        // using file:// or our own provider, which runs with our application's permissions.
        for (int k = uris.size() - 1; k >= 0; k--) {
            Uri uri = uris.get(k);
            if (!"content".equals(uri.getScheme()) || FilesProvider.authority(this).equals(uri.getAuthority())) uris.remove(k);
        }
        if (!uris.isEmpty()) {
            // open the streams now, while the share grant is still valid
            s.plugins.transfers.sendUris(uris);
            finish();
            return;
        }
        CharSequence text = in.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if (text != null) {
            String t = text.toString().trim();
            boolean sent;
            if (Patterns.WEB_URL.matcher(t).matches() && (t.startsWith("http://") || t.startsWith("https://"))) sent = s.plugins.transfers.sendUrl(t);
            else sent = s.plugins.transfers.sendText(t);
            Util.toast(this, sent ? Strings.t(this, "file_sent", "pc", s.activeName()) : Strings.t(this, "file_failed"));
        }
        finish();
    }
}
