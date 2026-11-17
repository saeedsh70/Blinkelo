package com.saeedsh.islandlink;

import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.VibrationEffect;
import android.os.Vibrator;

/** "Find my phone": rings loudly (even on silent) until stopped or two minutes pass. */
final class FindPhone {
    private FindPhone() {}

    private static MediaPlayer player;
    private static boolean active;
    private static int savedVolume = -1;
    private static Runnable autoStop;

    static synchronized boolean ringing() { return active; }

    static synchronized void start(final Context ctx, String pcName) {
        if (active) return;
        active = true;
        Context app = ctx.getApplicationContext();
        AudioManager am = app.getSystemService(AudioManager.class);
        MediaPlayer mp = null;
        try {
            if (am != null) {
                savedVolume = am.getStreamVolume(AudioManager.STREAM_ALARM);
                am.setStreamVolume(AudioManager.STREAM_ALARM, am.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0);
            }
            Uri uri = RingtoneManager.getActualDefaultRingtoneUri(app, RingtoneManager.TYPE_RINGTONE);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            mp = new MediaPlayer();
            mp.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            mp.setDataSource(app, uri);
            mp.setLooping(true);
            mp.prepare();
            mp.start();
            player = mp;
        } catch (Exception e) {
            if (mp != null) mp.release();
            Util.log("find phone sound failed: " + e);
        }
        Vibrator v = app.getSystemService(Vibrator.class);
        if (v != null) v.vibrate(VibrationEffect.createWaveform(new long[] {0, 800, 400, 800, 1200}, 0));

        Intent full = new Intent(app, FindPhoneActivity.class).putExtra("pc", pcName);
        Notification n = Notif.builder(app, Notif.CH_FIND)
                .setContentTitle(Strings.t(app, "find_title"))
                .setContentText(Strings.t(app, "find_text", "pc", pcName))
                .setCategory(Notification.CATEGORY_ALARM)
                .setOngoing(true)
                .setFullScreenIntent(Notif.activity(app, 51, full), true)
                .setContentIntent(Notif.activity(app, 52, full))
                .addAction(new Notification.Action.Builder(null, Strings.t(app, "act_found"),
                        Notif.action(app, 53, ActionReceiver.STOP_FIND)).build())
                .build();
        Notif.show(app, Notif.ID_FIND, n);
        try { app.startActivity(full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); } catch (Exception ignored) { /* background start blocked: notification covers it */ }
        final Context c = app;
        autoStop = new Runnable() { public void run() { stop(c); } };
        Util.mainDelayed(autoStop, 120000);
    }

    static synchronized void stop(Context ctx) {
        Context app = ctx.getApplicationContext();
        active = false;
        Util.cancelMain(autoStop);
        autoStop = null;
        if (player != null) {
            try { player.stop(); } catch (Exception ignored) { /* ignore */ }
            player.release();
            player = null;
        }
        AudioManager am = app.getSystemService(AudioManager.class);
        if (am != null && savedVolume >= 0) {
            try { am.setStreamVolume(AudioManager.STREAM_ALARM, savedVolume, 0); } catch (Exception ignored) { /* ignore */ }
            savedVolume = -1;
        }
        Vibrator v = app.getSystemService(Vibrator.class);
        if (v != null) v.cancel();
        Notif.cancel(app, Notif.ID_FIND);
        FindPhoneActivity.finishIfOpen();
    }
}
