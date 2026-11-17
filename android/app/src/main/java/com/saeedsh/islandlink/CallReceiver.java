package com.saeedsh.islandlink;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.telephony.SmsManager;
import android.telephony.TelephonyManager;

import com.saeedsh.islandlink.core.Base64;
import com.saeedsh.islandlink.core.Json;
import com.saeedsh.islandlink.core.Packet;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/** Incoming / missed calls → PC (KDE Connect "telephony"), ringer mute and SMS sending from the PC. */
public class CallReceiver extends BroadcastReceiver {
    private static String lastState = TelephonyManager.EXTRA_STATE_IDLE;
    private static String lastNumber = "";
    private static String lastEvent = "";
    private static boolean answered;
    private static boolean ringerMutedByUs;

    @Override public void onReceive(Context ctx, Intent intent) {
        if (!TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(intent.getAction())) return;
        String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
        if (TelephonyManager.EXTRA_STATE_IDLE.equals(state)) restoreRinger(ctx);
        if (!Settings.get(ctx).bool("calls", true)) return;
        @SuppressWarnings("deprecation")
        String number = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
        if (number != null && !number.isEmpty()) lastNumber = number;
        if (state == null) return;
        boolean repeat = state.equals(lastState);
        if (TelephonyManager.EXTRA_STATE_RINGING.equals(state)) {
            if (repeat && (number == null || number.isEmpty())) return;
            answered = false;
            send(ctx, "ringing", false);
        } else if (TelephonyManager.EXTRA_STATE_OFFHOOK.equals(state)) {
            if (TelephonyManager.EXTRA_STATE_RINGING.equals(lastState)) {
                answered = true;
                send(ctx, "ringing", true);
                send(ctx, "talking", false);
            }
        } else if (TelephonyManager.EXTRA_STATE_IDLE.equals(state)) {
            if (TelephonyManager.EXTRA_STATE_RINGING.equals(lastState) && !answered) {
                send(ctx, "ringing", true);
                send(ctx, "missedCall", false);
            } else if (!lastEvent.isEmpty()) {
                send(ctx, lastEvent, true);
            }
            lastNumber = "";
            lastEvent = "";
        }
        lastState = state;
    }

    private static void send(Context ctx, String event, boolean cancel) {
        LinkService s = LinkService.get();
        if (s == null) return;
        Json.Obj b = new Json.Obj().p("event", event).p("phoneNumber", lastNumber);
        if (cancel) b.p("isCancel", true);
        String[] contact = contact(ctx, lastNumber);
        if (contact[0] != null) b.p("contactName", contact[0]);
        if (contact[1] != null && !cancel) b.p("phoneThumbnail", contact[1]);
        s.send(Packet.of("kdeconnect.telephony", b));
        if (!cancel) lastEvent = event;
    }

    /** [name, base64 jpeg thumbnail] for a number, if contacts permission is granted. */
    private static String[] contact(Context ctx, String number) {
        String[] out = new String[2];
        if (number == null || number.isEmpty()) return out;
        if (ctx.checkSelfPermission(Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) return out;
        Cursor c = null;
        try {
            Uri uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(number));
            c = ctx.getContentResolver().query(uri, new String[] {ContactsContract.PhoneLookup.DISPLAY_NAME, ContactsContract.PhoneLookup.PHOTO_THUMBNAIL_URI}, null, null, null);
            if (c != null && c.moveToFirst()) {
                out[0] = c.getString(0);
                String photo = c.getString(1);
                if (photo != null) {
                    InputStream in = ctx.getContentResolver().openInputStream(Uri.parse(photo));
                    if (in != null) {
                        try { out[1] = Base64.encode(Util.readAll(in, 512 * 1024)); } finally { in.close(); }
                    }
                }
            }
        } catch (Exception e) {
            Util.log("contact lookup: " + e);
        } finally {
            if (c != null) c.close();
        }
        return out;
    }

    // ------------------------------------------------------------------ requests from the PC
    static void muteRinger(Context ctx) {
        if (!Settings.get(ctx).bool("calls", true) || !TelephonyManager.EXTRA_STATE_RINGING.equals(lastState)) return;
        try {
            AudioManager am = ctx.getSystemService(AudioManager.class);
            if (am != null && !am.isStreamMute(AudioManager.STREAM_RING)) {
                am.adjustStreamVolume(AudioManager.STREAM_RING, AudioManager.ADJUST_MUTE, 0);
                ringerMutedByUs = true;
            }
        } catch (Exception e) {
            Util.log("mute ringer failed: " + e);
        }
    }

    private static void restoreRinger(Context ctx) {
        if (!ringerMutedByUs) return;
        try {
            AudioManager am = ctx.getSystemService(AudioManager.class);
            if (am != null) am.adjustStreamVolume(AudioManager.STREAM_RING, AudioManager.ADJUST_UNMUTE, 0);
        } catch (Exception e) {
            Util.log("restore ringer failed: " + e);
        } finally {
            ringerMutedByUs = false;
        }
    }

    @SuppressWarnings("deprecation")
    static void sendSms(Context ctx, Json.Obj b) {
        if (!Settings.get(ctx).bool("sms", true)) return;
        if (ctx.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            Util.log("SEND_SMS not granted");
            return;
        }
        String text = b.str("messageBody", "");
        List<String> to = new ArrayList<String>();
        for (Object o : b.arrOrEmpty("addresses")) if (o instanceof Json.Obj) to.add(((Json.Obj) o).str("address", ""));
        if (b.has("phoneNumber")) to.add(b.str("phoneNumber"));
        if (text.isEmpty() || to.isEmpty()) return;
        SmsManager sms = Build.VERSION.SDK_INT >= 31 ? ctx.getSystemService(SmsManager.class) : SmsManager.getDefault();
        if (sms == null) return;
        for (String number : to) {
            if (number.trim().isEmpty()) continue;
            ArrayList<String> parts = sms.divideMessage(text);
            sms.sendMultipartTextMessage(number.trim(), null, parts, null, null);
        }
        Util.toast(ctx, Strings.t(ctx, "sms_sent"));
    }
}
