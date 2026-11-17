package com.saeedsh.islandlink;

import android.content.ComponentName;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

/** Notification access: feeds the notification mirror and unlocks media-session control. */
public class NotifListener extends NotificationListenerService {

    @Override public void onListenerConnected() {
        NotificationMirror.get(this).listener = this;
        MediaMirror.get(this).attachIfPossible();
        UiBus.emit("permissions", Permissions.state(this));
    }

    @Override public void onListenerDisconnected() {
        NotificationMirror.get(this).listener = null;
        try { requestRebind(new ComponentName(this, NotifListener.class)); } catch (Exception ignored) { /* ignore */ }
    }

    @Override public void onNotificationPosted(StatusBarNotification sbn) {
        try { NotificationMirror.get(this).onPosted(sbn, false); } catch (Exception e) { Util.log("mirror: " + e); }
    }

    @Override public void onNotificationRemoved(StatusBarNotification sbn) {
        try { NotificationMirror.get(this).onRemoved(sbn); } catch (Exception e) { Util.log("mirror remove: " + e); }
    }
}
