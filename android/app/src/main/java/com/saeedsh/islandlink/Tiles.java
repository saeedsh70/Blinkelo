package com.saeedsh.islandlink;

import android.app.PendingIntent;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Build;
import android.service.quicksettings.Tile;
import android.service.quicksettings.TileService;

import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

/** Quick Settings tiles: send clipboard, lock the PC, open the touchpad. */
public final class Tiles {
    private Tiles() {}

    static void launch(TileService ts, Intent i) {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (Build.VERSION.SDK_INT >= 34) {
            PendingIntent pi = PendingIntent.getActivity(ts, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            ts.startActivityAndCollapse(pi);
        } else {
            launchBeforeAndroid14(ts, i);
        }
    }

    // The PendingIntent overload does not exist before API 34. This helper is called only
    // from the SDK < 34 branch; lint 8.7 does not account for that guard for this issue.
    @SuppressLint("StartActivityAndCollapseDeprecated")
    @SuppressWarnings("deprecation")
    private static void launchBeforeAndroid14(TileService ts, Intent i) {
        ts.startActivityAndCollapse(i);
    }

    static void refresh(TileService ts) {
        Tile t = ts.getQsTile();
        if (t == null) return;
        LinkService s = LinkService.get();
        boolean on = s != null && s.active() != null;
        t.setState(on ? Tile.STATE_ACTIVE : Tile.STATE_INACTIVE);
        if (Build.VERSION.SDK_INT >= 29) t.setSubtitle(on ? s.activeName() : null);
        t.updateTile();
    }

    public static class Clipboard extends TileService {
        @Override public void onStartListening() { refresh(this); }
        @Override public void onClick() { launch(this, new Intent(this, ClipboardActivity.class)); }
    }

    public static class Lock extends TileService {
        @Override public void onStartListening() { refresh(this); }
        @Override public void onClick() {
            LinkService s = LinkService.get();
            if (s == null || !s.send(Packet.of("kdeconnect.runcommand.request", new Json.Obj().p("key", "island.lock")))) {
                Util.toast(this, Strings.t(this, "not_connected"));
            }
        }
    }

    public static class Remote extends TileService {
        @Override public void onStartListening() { refresh(this); }
        @Override public void onClick() {
            launch(this, new Intent(this, MainActivity.class).putExtra("route", "remote"));
        }
    }
}
