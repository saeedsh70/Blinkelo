package com.saeedsh.islandlink;

import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;

import com.saeedsh.islandlink.core.Json;

/** Notification buttons and alarms. */
public class ActionReceiver extends BroadcastReceiver {
    static final String PAIR_ACCEPT = "pair.accept";
    static final String PAIR_REJECT = "pair.reject";
    static final String STOP_FIND = "find.stop";
    static final String COPY_TEXT = "copy.text";
    static final String PCMEDIA_PREV = "pcmedia.prev";
    static final String PCMEDIA_TOGGLE = "pcmedia.toggle";
    static final String PCMEDIA_NEXT = "pcmedia.next";
    static final String TIMER_CANCEL = "timer.cancel";
    static final String TIMER_ALARM = "timer.alarm";
    static final String TASK_ALARM = "task.alarm";
    static final String TASK_DONE = "task.done";
    static final String GAME_CMD = "game.cmd";

    @Override public void onReceive(Context ctx, Intent intent) {
        String a = intent.getAction();
        if (a == null) return;
        LinkService s = LinkService.get();
        String id = intent.getStringExtra("id");
        switch (a) {
            case PAIR_ACCEPT:
                if (s != null && id != null) s.core.acceptPair(id);
                Notif.cancel(ctx, Notif.ID_PAIR);
                break;
            case PAIR_REJECT:
                if (s != null && id != null) s.core.rejectPair(id);
                Notif.cancel(ctx, Notif.ID_PAIR);
                break;
            case STOP_FIND:
                FindPhone.stop(ctx);
                break;
            case COPY_TEXT: {
                ClipboardManager cm = ctx.getSystemService(ClipboardManager.class);
                String text = intent.getStringExtra("text");
                if (cm != null && text != null) cm.setPrimaryClip(ClipData.newPlainText("Blinkelo Link", text));
                break;
            }
            case PCMEDIA_PREV: PcMedia.command(ctx, "prev", 0); break;
            case PCMEDIA_TOGGLE: PcMedia.command(ctx, "playpause", 0); break;
            case PCMEDIA_NEXT: PcMedia.command(ctx, "next", 0); break;
            case TIMER_CANCEL:
                if (id != null) (s != null ? s.plugins.timers : new Timers(ctx)).cancel(id, true);
                break;
            case TIMER_ALARM:
                if (s != null && id != null) s.plugins.timers.onAlarm(id);
                else if (id != null) new Timers(ctx).onAlarm(id);
                break;
            case TASK_ALARM:
                if (id != null) (s != null ? s.plugins.tasks : new Tasks(ctx)).onAlarm(id);
                break;
            case TASK_DONE:
                if (id != null) {
                    (s != null ? s.plugins.tasks : new Tasks(ctx)).update(id, new Json.Obj().p("done", true));
                    Notif.cancel(ctx, "task:" + id, Notif.ID_TASK_BASE + ((id.hashCode() & Integer.MAX_VALUE) % 1000));
                    Notif.cancel(ctx, Notif.ID_TASK_BASE + ((id.hashCode() & Integer.MAX_VALUE) % 1000)); // pre-1.0.3 notification
                }
                break;
            case GAME_CMD: {
                String cmd = intent.getStringExtra("cmd");
                if (s != null && cmd != null && cmd.matches("optimize|restore|hud")) {
                    s.send(com.saeedsh.islandlink.core.Packet.of("island.game.request", new Json.Obj().p("action", cmd)));
                }
                break;
            }
            default:
                break;
        }
    }
}
