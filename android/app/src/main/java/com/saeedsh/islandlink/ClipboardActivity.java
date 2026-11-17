package com.saeedsh.islandlink;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.net.Uri;
import android.os.Bundle;

import java.util.Collections;

/**
 * Android 10+ only lets the focused app read the clipboard, so the tile / notification button opens
 * this invisible activity, which reads the clipboard once it has focus and sends it to the PC.
 */
public class ClipboardActivity extends Activity {
    private boolean done;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus || done) return;
        done = true;
        send();
        finish();
    }

    private void send() {
        LinkService s = LinkService.get();
        if (s == null || s.active() == null) {
            Util.toast(this, Strings.t(this, "not_connected"));
            return;
        }
        ClipboardManager cm = getSystemService(ClipboardManager.class);
        ClipData clip = cm != null ? cm.getPrimaryClip() : null;
        if (clip == null || clip.getItemCount() == 0) {
            Util.toast(this, Strings.t(this, "clip_empty"));
            return;
        }
        ClipData.Item item = clip.getItemAt(0);
        Uri uri = item.getUri();
        if (uri != null && clip.getDescription() != null && clip.getDescription().hasMimeType("image/*")) {
            s.plugins.transfers.sendUris(Collections.singletonList(uri));
            return;
        }
        CharSequence text = item.coerceToText(this);
        if (text == null || text.length() == 0) {
            Util.toast(this, Strings.t(this, "clip_empty"));
            return;
        }
        if (s.plugins.sendClipboardText(text.toString())) Util.toast(this, Strings.t(this, "clip_sent", "pc", s.activeName()));
    }
}
