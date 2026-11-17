package com.saeedsh.islandlink;

import android.content.Context;
import com.saeedsh.islandlink.core.Json;
import java.lang.reflect.Method;
import java.nio.file.Files;

/** Exercises production planner/timer logic with small Android API doubles; no device claims. */
public class FeatureRegressionTest {
    private static int checks;
    static void check(boolean condition, String message) {
        checks++;
        if (!condition) throw new AssertionError(message);
    }

    public static void main(String[] args) throws Exception {
        Context ctx = new Context(Files.createTempDirectory("island-feature-test-").toFile());
        long now = System.currentTimeMillis();
        Tasks tasks = new Tasks(ctx);
        // An unseen remote deletion must survive process restart and reject an older upsert.
        tasks.onPacket(new Json.Obj().p("op", "remove").p("id", "removed-before-sync").p("at", now));
        Tasks restarted = new Tasks(ctx);
        restarted.onPacket(new Json.Obj().p("op", "upsert").p("task", new Json.Obj()
                .p("id", "removed-before-sync").p("title", "stale task").p("updated", now - 1)));
        check(restarted.all().isEmpty(), "Unseen tombstone must persist across restart");
        // A later tombstone for an already-deleted task also needs to be persisted.
        restarted.onPacket(new Json.Obj().p("op", "remove").p("id", "removed-before-sync").p("at", now + 50));
        restarted = new Tasks(ctx);
        restarted.onPacket(new Json.Obj().p("op", "upsert").p("task", new Json.Obj()
                .p("id", "removed-before-sync").p("title", "still stale").p("updated", now + 25)));
        check(restarted.all().isEmpty(), "Updated tombstone must persist across restart");
        // Completed-day cleanup must preserve another day's completed tasks.
        Json.Obj first = restarted.add(new Json.Obj().p("title", "today").p("date", "2026-11-08"));
        Json.Obj other = restarted.add(new Json.Obj().p("title", "tomorrow").p("date", "2026-11-09"));
        restarted.update(first.str("id"), new Json.Obj().p("done", true));
        restarted.update(other.str("id"), new Json.Obj().p("done", true));
        check(restarted.clearDone("2026-11-08") == 1, "Clear must affect only selected date");
        check(restarted.all().size() == 1 && restarted.all().get(0) == other, "Other day's task must survive");
        Method dueAt = Tasks.class.getDeclaredMethod("dueAt", Json.Obj.class);
        dueAt.setAccessible(true);
        check((Long) dueAt.invoke(null, new Json.Obj().p("date", "2026-02-30").p("time", "10:00")) == -1,
                "Invalid calendar date must not roll into another day");
        check((Long) dueAt.invoke(null, new Json.Obj().p("date", "2026-11-08").p("time", "24:01")) == -1,
                "Invalid time must not roll into another day");
        check((Long) dueAt.invoke(null, new Json.Obj().p("date", "2026-11-08").p("time", "10:00")) > 0,
                "Valid reminder must parse");
        // This is the exact fallback used by TIMER_ALARM when LinkService does not exist.
        Settings.STATE.clear();
        Settings.setState(ctx, "timers", Json.stringify(Json.arr(new Json.Obj().p("id", "expired")
                .p("endsAt", now - 1000).p("origin", "phone").p("label", "test"))));
        int before = Notif.shown;
        new Timers(ctx).onAlarm("expired");
        check(Notif.shown == before + 1, "Alarm after process death must notify");
        check(new Timers(ctx).list().isEmpty(), "Fired timer must be removed durably");
        new Timers(ctx).onAlarm("expired");
        check(Notif.shown == before + 1, "Duplicate alarm must not ring twice");
        Timers timers = new Timers(ctx);
        Json.Obj timer = timers.start(60000, "running");
        check(new Timers(ctx).list().size() == 1, "Running timer must survive recreation");
        new Timers(ctx).cancel(timer.str("id"), true);
        check(new Timers(ctx).list().isEmpty(), "Cancel action after process death must persist");
        check(timers.start(Long.MAX_VALUE, "overflow") == null, "Overflow duration must be rejected");
        // Corrupt persisted entries should be skipped without crashing service startup.
        Settings.setState(ctx, "timers", "[null,7,{}, {\"id\":\"valid\",\"endsAt\":" + (now + 60000) + "}]");
        check(new Timers(ctx).list().size() == 1, "Malformed timer entries must be ignored");
        Settings.STATE.clear(); Notif.tags.clear();
        Timers collision = new Timers(ctx);
        collision.onRemote(new Json.Obj().p("id", "Aa").p("remaining", 60000).p("state", "running").p("updated", now));
        collision.onRemote(new Json.Obj().p("id", "BB").p("remaining", 60000).p("state", "running").p("updated", now));
        check(Notif.tags.contains("timer:Aa") && Notif.tags.contains("timer:BB"), "Hash-colliding timers retain distinct notifications");
        collision.cancel("Aa", true);
        check(!Notif.tags.contains("timer:Aa") && Notif.tags.contains("timer:BB"), "Cancelling one colliding timer preserves the other");
        collision = new Timers(ctx);
        collision.onRemote(new Json.Obj().p("id", "Aa").p("remaining", 50000).p("state", "running").p("updated", now-1));
        check(collision.list().size() == 1 && "BB".equals(((Json.Obj)collision.list().get(0)).str("id")), "Offline cancellation tombstone rejects stale timer after restart");
        before = Notif.shown;
        collision.onRemote(new Json.Obj().p("id", "BB").p("state", "done").p("updated", now + 100));
        check(Notif.shown == before + 1 && collision.list().isEmpty(), "Remote completion alerts the phone and removes the timer");
        collision.onRemote(new Json.Obj().p("id", "BB").p("state", "done").p("updated", now + 200));
        check(Notif.shown == before + 1, "Repeated completion does not alert twice");
        System.out.println("Feature regression checks passed: " + checks);
    }
}
