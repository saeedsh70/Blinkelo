package com.saeedsh.islandlink;

import android.content.ComponentName;
import android.content.Context;
import android.graphics.Bitmap;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.os.SystemClock;

import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Phone media sessions → PC (KDE Connect "mpris"), and remote control from the PC. */
final class MediaMirror {
    private static MediaMirror instance;
    private final Context ctx;
    private MediaSessionManager msm;
    private final Map<String, MediaController> players = new LinkedHashMap<String, MediaController>();
    private final Map<MediaController, MediaController.Callback> callbacks = new HashMap<MediaController, MediaController.Callback>();
    private final Map<String, byte[]> art = new HashMap<String, byte[]>();
    private final Map<String, Long> lastSent = new HashMap<String, Long>();
    private boolean attached;
    private MediaSessionManager.OnActiveSessionsChangedListener sessionsListener;

    private MediaMirror(Context ctx) { this.ctx = ctx.getApplicationContext(); }

    static synchronized MediaMirror get(Context ctx) {
        if (instance == null) instance = new MediaMirror(ctx);
        return instance;
    }

    void attachIfPossible() {
        if (attached) return;
        try {
            msm = ctx.getSystemService(MediaSessionManager.class);
            if (msm == null) return;
            final ComponentName cn = new ComponentName(ctx, NotifListener.class);
            sessionsListener = new MediaSessionManager.OnActiveSessionsChangedListener() {
                public void onActiveSessionsChanged(List<MediaController> controllers) { update(controllers); }
            };
            msm.addOnActiveSessionsChangedListener(sessionsListener, cn);
            attached = true;
            update(msm.getActiveSessions(cn));
        } catch (SecurityException e) {
            // no notification access yet
        } catch (Exception e) {
            Util.log("media attach: " + e);
        }
    }

    private boolean enabled() { return Settings.section(ctx, "media").bool("mirror", true); }

    private synchronized void update(List<MediaController> controllers) {
        for (Map.Entry<MediaController, MediaController.Callback> e : callbacks.entrySet()) {
            try { e.getKey().unregisterCallback(e.getValue()); } catch (Exception ignored) { /* ignore */ }
        }
        callbacks.clear();
        players.clear();
        if (controllers != null) {
            for (final MediaController mc : controllers) {
                if (ctx.getPackageName().equals(mc.getPackageName())) continue; // our own PC-media session
                String name = Util.appLabel(ctx, mc.getPackageName());
                if (players.containsKey(name)) name = name + " (" + mc.getPackageName() + ")";
                players.put(name, mc);
                final String playerName = name;
                MediaController.Callback cb = new MediaController.Callback() {
                    @Override public void onPlaybackStateChanged(PlaybackState state) { sendNowPlaying(playerName, false); }
                    @Override public void onMetadataChanged(MediaMetadata metadata) { sendNowPlaying(playerName, true); }
                    @Override public void onSessionDestroyed() { sendPlayerList(); }
                };
                mc.registerCallback(cb, new android.os.Handler(android.os.Looper.getMainLooper()));
                callbacks.put(mc, cb);
            }
        }
        sendPlayerList();
        for (String n : players.keySet()) sendNowPlaying(n, true);
    }

    void sendPlayerList() {
        LinkService s = LinkService.get();
        if (s == null) return;
        List<String> names;
        synchronized (this) { names = enabled() ? new ArrayList<String>(players.keySet()) : new ArrayList<String>(); }
        s.send(Packet.of("kdeconnect.mpris", new Json.Obj().p("playerList", Json.arrOf(names)).p("supportAlbumArtPayload", true)));
    }

    synchronized void settingsChanged() {
        art.clear();
        lastSent.clear();
        sendPlayerList();
        if (enabled()) for (String name : players.keySet()) sendNowPlaying(name, true);
    }

    private void sendNowPlaying(String name, boolean force) {
        if (!enabled()) return;
        long now = SystemClock.elapsedRealtime();
        Long last = lastSent.get(name);
        if (!force && last != null && now - last < 300) return;
        lastSent.put(name, now);
        Json.Obj body = nowPlaying(name);
        if (body == null) return;
        LinkService s = LinkService.get();
        if (s != null) s.send(Packet.of("kdeconnect.mpris", body));
    }

    private synchronized Json.Obj nowPlaying(String name) {
        MediaController mc = players.get(name);
        if (mc == null) return null;
        MediaMetadata md = mc.getMetadata();
        PlaybackState st = mc.getPlaybackState();
        Json.Obj b = new Json.Obj().p("player", name);
        String title = "", artist = "", album = "";
        long length = 0;
        if (md != null) {
            title = s(md.getString(MediaMetadata.METADATA_KEY_TITLE));
            if (title.isEmpty()) title = s(md.getString(MediaMetadata.METADATA_KEY_DISPLAY_TITLE));
            artist = s(md.getString(MediaMetadata.METADATA_KEY_ARTIST));
            if (artist.isEmpty()) artist = s(md.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST));
            if (artist.isEmpty()) artist = s(md.getString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE));
            album = s(md.getString(MediaMetadata.METADATA_KEY_ALBUM));
            length = md.getLong(MediaMetadata.METADATA_KEY_DURATION);
            Bitmap bmp = md.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
            if (bmp == null) bmp = md.getBitmap(MediaMetadata.METADATA_KEY_ART);
            if (bmp == null) bmp = md.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON);
            if (bmp != null) {
                byte[] jpg = Util.jpeg(Util.scaleToFit(bmp, 512), 85);
                if (jpg != null) {
                    String url = "island://art/" + Util.md5(jpg).substring(0, 16);
                    art.put(url, jpg);
                    if (art.size() > 12) art.remove(art.keySet().iterator().next());
                    b.p("albumArtUrl", url);
                }
            }
        }
        boolean playing = st != null && st.getState() == PlaybackState.STATE_PLAYING;
        long pos = 0;
        long actions = st != null ? st.getActions() : 0;
        if (st != null) {
            pos = st.getPosition();
            if (playing && st.getLastPositionUpdateTime() > 0) {
                pos += (long) ((SystemClock.elapsedRealtime() - st.getLastPositionUpdateTime()) * st.getPlaybackSpeed());
            }
        }
        AudioManager am = ctx.getSystemService(AudioManager.class);
        int vol = 50;
        if (am != null) {
            int max = Math.max(1, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC));
            vol = Math.round(am.getStreamVolume(AudioManager.STREAM_MUSIC) * 100f / max);
        }
        return b.p("title", title).p("artist", artist).p("album", album).p("nowPlaying", artist.isEmpty() ? title : artist + " - " + title)
                .p("isPlaying", playing).p("pos", Math.max(0, pos)).p("length", Math.max(0, length))
                .p("canPlay", (actions & (PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PLAY_PAUSE)) != 0 || st == null)
                .p("canPause", (actions & (PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE)) != 0 || st == null)
                .p("canGoNext", (actions & PlaybackState.ACTION_SKIP_TO_NEXT) != 0)
                .p("canGoPrevious", (actions & PlaybackState.ACTION_SKIP_TO_PREVIOUS) != 0)
                .p("canSeek", (actions & PlaybackState.ACTION_SEEK_TO) != 0)
                .p("volume", vol);
    }

    private static String s(String v) { return v == null ? "" : v; }

    // ------------------------------------------------------------------ requests from the PC
    void onRequest(Json.Obj b) {
        if (!enabled()) return;
        if (b.bool("requestPlayerList")) { sendPlayerList(); return; }
        String name = b.str("player", "");
        MediaController mc;
        synchronized (this) { mc = players.get(name); }
        if (mc == null) return;
        if (b.has("albumArtUrl")) {
            byte[] jpg = art.get(b.str("albumArtUrl"));
            if (jpg != null) {
                LinkService s = LinkService.get();
                if (s != null) s.send(Packet.of("kdeconnect.mpris", new Json.Obj().p("player", name)
                        .p("albumArtUrl", b.str("albumArtUrl")).p("transferringAlbumArt", true)).withPayload(jpg));
            }
            return;
        }
        MediaController.TransportControls tc = mc.getTransportControls();
        String action = b.str("action", "");
        PlaybackState st = mc.getPlaybackState();
        boolean playing = st != null && st.getState() == PlaybackState.STATE_PLAYING;
        switch (action) {
            case "Play": tc.play(); break;
            case "Pause": tc.pause(); break;
            case "PlayPause": if (playing) tc.pause(); else tc.play(); break;
            case "Stop": tc.stop(); break;
            case "Next": tc.skipToNext(); break;
            case "Previous": tc.skipToPrevious(); break;
            default: break;
        }
        if (b.has("SetPosition")) tc.seekTo(Math.max(0, b.lng("SetPosition", 0)));
        if (b.has("Seek")) {
            long cur = st != null ? st.getPosition() : 0;
            tc.seekTo(Math.max(0, cur + b.lng("Seek", 0) / 1000));
        }
        if (b.has("setVolume")) {
            AudioManager am = ctx.getSystemService(AudioManager.class);
            if (am != null) {
                int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                am.setStreamVolume(AudioManager.STREAM_MUSIC, Math.round(max * b.integer("setVolume", 50) / 100f), 0);
            }
        }
        if (b.bool("requestNowPlaying") || b.bool("requestVolume")) sendNowPlaying(name, true);
    }
}
