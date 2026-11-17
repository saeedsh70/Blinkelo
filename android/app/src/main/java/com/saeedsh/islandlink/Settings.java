package com.saeedsh.islandlink;

import android.content.Context;
import android.content.SharedPreferences;

import com.saeedsh.islandlink.core.Json;

import java.util.Map;

/** App settings stored as one JSON object (defaults merged in). */
public final class Settings {
    private Settings() {}

    private static Json.Obj cache;

    static Json.Obj defaults() {
        return new Json.Obj()
                .p("language", "auto")
                .p("deviceName", "")
                .p("bluetooth", true)
                .p("startOnBoot", true)
                .p("notifications", new Json.Obj().p("mirror", true).p("blocked", new Json.Arr()))
                .p("pcNotifications", true)
                .p("clipboard", new Json.Obj().p("receive", true))
                .p("media", new Json.Obj().p("mirror", true).p("pcNotification", true))
                .p("calls", true)
                .p("sms", true)
                .p("touchpad", new Json.Obj().p("sensitivity", 1.0).p("scroll", 1.0).p("natural", false).p("haptics", true))
                .p("planner", new Json.Obj().p("calendar", "auto"))
                .p("gaming", new Json.Obj().p("notification", true).p("summary", true))
                .p("onboarded", false);
    }

    public static synchronized Json.Obj get(Context ctx) {
        if (cache != null) return cache;
        SharedPreferences sp = ctx.getApplicationContext().getSharedPreferences("island", Context.MODE_PRIVATE);
        Json.Obj stored = Json.parseObj(sp.getString("settings", "{}"));
        cache = merge(defaults(), stored != null ? stored : new Json.Obj());
        return cache;
    }

    /** Deep-merges {@code patch} into the settings and saves. Arrays are replaced wholesale. */
    public static synchronized Json.Obj update(Context ctx, Json.Obj patch) {
        Json.Obj cur = get(ctx);
        cache = merge(cur, patch);
        ctx.getApplicationContext().getSharedPreferences("island", Context.MODE_PRIVATE)
                .edit().putString("settings", Json.stringify(cache)).apply();
        return cache;
    }

    public static Json.Obj section(Context ctx, String key) {
        return get(ctx).objOrEmpty(key);
    }

    private static Json.Obj merge(Json.Obj base, Json.Obj patch) {
        Json.Obj out = new Json.Obj(base);
        for (Map.Entry<String, Object> e : patch.entrySet()) {
            Object b = out.get(e.getKey());
            Object v = e.getValue();
            if (b instanceof Json.Obj && v instanceof Json.Obj) out.put(e.getKey(), merge((Json.Obj) b, (Json.Obj) v));
            else out.put(e.getKey(), v);
        }
        return out;
    }

    /** Small key/value store for internal state (not user settings). */
    public static String state(Context ctx, String key, String def) {
        return ctx.getApplicationContext().getSharedPreferences("island-state", Context.MODE_PRIVATE).getString(key, def);
    }

    public static void setState(Context ctx, String key, String value) {
        ctx.getApplicationContext().getSharedPreferences("island-state", Context.MODE_PRIVATE).edit().putString(key, value).apply();
    }
}
