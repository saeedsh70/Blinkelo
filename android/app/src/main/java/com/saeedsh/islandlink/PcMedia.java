package com.saeedsh.islandlink;

import android.app.Notification;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.drawable.Icon;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;

import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

/** What the PC is playing, shown as a media notification (lock screen controls) and in the app. */
final class PcMedia {
    private final Context ctx;
    private MediaSession session;
    private Json.Obj state = new Json.Obj().p("present", false);
    private String artKey = "";
    private String artDataUrl = "";
    private Bitmap artBitmap;

    PcMedia(Context ctx) { this.ctx = ctx; }

    Json.Obj state() { return state; }

    void onMedia(Json.Obj b) {
        String key = b.str("artKey", "");
        if (b.has("art") && !b.str("art").isEmpty()) {
            artDataUrl = b.str("art");
            artBitmap = Util.decodeDataUrl(artDataUrl);
            artKey = key;
        } else if (!key.equals(artKey) && !b.bool("keepArt")) {
            artDataUrl = "";
            artBitmap = null;
            artKey = key;
        }
        state = new Json.Obj(b);
        state.p("art", artDataUrl).p("receivedAt", System.currentTimeMillis());
        UiBus.emit("pcmedia", state);
        if (!b.bool("present") || !Settings.section(ctx, "media").bool("pcNotification", true)) { hide(); return; }
        show();
    }

    static void command(Context ctx, String action, double position) {
        LinkService s = LinkService.get();
        if (s == null) return;
        Json.Obj body = new Json.Obj().p("action", action);
        if ("seek".equals(action)) body.p("position", position);
        s.send(Packet.of("island.media.request", body));
    }

    private void ensureSession() {
        if (session != null) return;
        session = new MediaSession(ctx, "BlinkeloPC");
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { command(ctx, "play", 0); }
            @Override public void onPause() { command(ctx, "pause", 0); }
            @Override public void onSkipToNext() { command(ctx, "next", 0); }
            @Override public void onSkipToPrevious() { command(ctx, "prev", 0); }
            @Override public void onStop() { command(ctx, "pause", 0); }
            @Override public void onSeekTo(long pos) { command(ctx, "seek", pos / 1000.0); }
        });
    }

    private void show() {
        ensureSession();
        boolean playing = "playing".equals(state.str("status"));
        long duration = (long) (state.num("duration", 0) * 1000);
        long position = (long) (state.num("position", 0) * 1000);
        MediaMetadata.Builder md = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, state.str("title", ""))
                .putString(MediaMetadata.METADATA_KEY_ARTIST, state.str("artist", ""))
                .putString(MediaMetadata.METADATA_KEY_ALBUM, state.str("album", ""))
                .putLong(MediaMetadata.METADATA_KEY_DURATION, duration);
        if (artBitmap != null) md.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, artBitmap);
        session.setMetadata(md.build());
        long actions = PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS;
        if (state.bool("canSeek")) actions |= PlaybackState.ACTION_SEEK_TO;
        session.setPlaybackState(new PlaybackState.Builder()
                .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, position, playing ? 1f : 0f)
                .setActions(actions).build());
        session.setActive(true);

        Notification.Builder nb = Notif.builder(ctx, Notif.CH_MEDIA)
                .setContentTitle(state.str("title", ""))
                .setContentText(state.str("artist", ""))
                .setSubText(Strings.t(ctx, "pc_media") + " · " + state.str("source", ""))
                .setOngoing(playing)
                .setShowWhen(false)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setContentIntent(Notif.openApp(ctx, "media"))
                .addAction(act(R.drawable.ic_act_prev, "prev", ActionReceiver.PCMEDIA_PREV, 41))
                .addAction(playing ? act(R.drawable.ic_act_pause, "pause", ActionReceiver.PCMEDIA_TOGGLE, 42)
                        : act(R.drawable.ic_act_play, "play", ActionReceiver.PCMEDIA_TOGGLE, 42))
                .addAction(act(R.drawable.ic_act_next, "next", ActionReceiver.PCMEDIA_NEXT, 43))
                .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1, 2));
        if (artBitmap != null) nb.setLargeIcon(Icon.createWithBitmap(artBitmap));
        Notif.show(ctx, Notif.ID_PC_MEDIA, nb.build());
    }

    private Notification.Action act(int icon, String title, String action, int req) {
        return new Notification.Action.Builder(Icon.createWithResource(ctx, icon), title, Notif.action(ctx, req, action)).build();
    }

    void hide() {
        Notif.cancel(ctx, Notif.ID_PC_MEDIA);
        if (session != null) {
            session.setActive(false);
            session.release();
            session = null;
        }
    }

    void clear() {
        hide();
        state = new Json.Obj().p("present", false);
        artKey = "";
        artDataUrl = "";
        artBitmap = null;
    }
}
