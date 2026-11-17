package com.saeedsh.islandlink;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings.Secure;

import com.saeedsh.islandlink.core.Json;

import java.util.ArrayList;
import java.util.List;

/** Which permissions the features need, their state, and how to ask for them. */
final class Permissions {
    private Permissions() {}

    static boolean granted(Context ctx, String perm) {
        return ctx.checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED;
    }

    static boolean notificationAccess(Context ctx) {
        String flat = Secure.getString(ctx.getContentResolver(), "enabled_notification_listeners");
        if (flat == null) return false;
        ComponentName me = new ComponentName(ctx, NotifListener.class);
        for (String part : flat.split(":")) if (me.equals(ComponentName.unflattenFromString(part))) return true;
        return false;
    }

    static Json.Obj state(Context ctx) {
        PowerManager pm = ctx.getSystemService(PowerManager.class);
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        Json.Obj s = new Json.Obj()
                .p("notifications", nm != null && nm.areNotificationsEnabled()
                        && (Build.VERSION.SDK_INT < 33 || granted(ctx, Manifest.permission.POST_NOTIFICATIONS)))
                .p("notificationAccess", notificationAccess(ctx))
                .p("phone", granted(ctx, Manifest.permission.READ_PHONE_STATE) && granted(ctx, Manifest.permission.READ_CALL_LOG))
                .p("contacts", granted(ctx, Manifest.permission.READ_CONTACTS))
                .p("sms", granted(ctx, Manifest.permission.SEND_SMS))
                .p("bluetooth", Build.VERSION.SDK_INT < 31 || granted(ctx, Manifest.permission.BLUETOOTH_CONNECT))
                .p("battery", pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName()))
                .p("exactAlarm", Build.VERSION.SDK_INT < 31 || (am != null && am.canScheduleExactAlarms()))
                .p("storage", Build.VERSION.SDK_INT >= 29 || granted(ctx, Manifest.permission.WRITE_EXTERNAL_STORAGE))
                .p("fullScreen", Build.VERSION.SDK_INT < 34 || (nm != null && nm.canUseFullScreenIntent()));
        return s;
    }

    static final int REQUEST_CODE = 4100;

    /** Asks for one permission group; runtime ones via the activity, special ones via system settings. */
    static void request(Activity a, String kind) {
        List<String> perms = new ArrayList<String>();
        Intent settings = null;
        String pkg = a.getPackageName();
        switch (kind) {
            case "notifications":
                if (Build.VERSION.SDK_INT >= 33) perms.add(Manifest.permission.POST_NOTIFICATIONS);
                break;
            case "notificationAccess":
                if (Build.VERSION.SDK_INT >= 30) {
                    settings = new Intent(android.provider.Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
                            .putExtra(android.provider.Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME,
                                    new ComponentName(a, NotifListener.class).flattenToString());
                } else {
                    settings = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
                }
                break;
            case "phone":
                perms.add(Manifest.permission.READ_PHONE_STATE);
                perms.add(Manifest.permission.READ_CALL_LOG);
                break;
            case "contacts":
                perms.add(Manifest.permission.READ_CONTACTS);
                break;
            case "sms":
                perms.add(Manifest.permission.SEND_SMS);
                break;
            case "bluetooth":
                if (Build.VERSION.SDK_INT >= 31) perms.add(Manifest.permission.BLUETOOTH_CONNECT);
                break;
            case "storage":
                if (Build.VERSION.SDK_INT < 29) perms.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
                break;
            case "battery":
                settings = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + pkg));
                break;
            case "exactAlarm":
                if (Build.VERSION.SDK_INT >= 31) settings = new Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + pkg));
                break;
            case "fullScreen":
                if (Build.VERSION.SDK_INT >= 34) settings = new Intent(android.provider.Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:" + pkg));
                break;
            case "appSettings":
                settings = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg));
                break;
            default:
                break;
        }
        if (!perms.isEmpty()) {
            a.requestPermissions(perms.toArray(new String[0]), REQUEST_CODE);
        } else if (settings != null) {
            try {
                a.startActivity(settings);
            } catch (Exception e) {
                try {
                    a.startActivity(new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + pkg)));
                } catch (Exception ignored) { /* nothing more to try */ }
            }
        }
    }
}
