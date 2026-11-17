package com.saeedsh.islandlink;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Starts the connection after a reboot or an app update. */
public class BootReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context ctx, Intent intent) {
        if (intent == null || (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction()))) return;
        if (!Settings.get(ctx).bool("onboarded", false)) return;
        // Local reminders are independent of whether the connection starts on boot.
        new Tasks(ctx).scheduleAll();
        new Timers(ctx).restore();
        if (Settings.get(ctx).bool("startOnBoot", true)) LinkService.start(ctx);
    }
}
