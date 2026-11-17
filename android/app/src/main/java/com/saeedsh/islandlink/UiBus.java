package com.saeedsh.islandlink;

import com.saeedsh.islandlink.core.Json;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Pushes events to the WebView UI (when it is open) and remembers the latest value of state-like events. */
public final class UiBus {
    private UiBus() {}

    public interface Sink {
        void emit(String event, String json);
    }

    private static volatile Sink sink;
    private static final Map<String, String> LAST = new ConcurrentHashMap<String, String>();
    private static final Set<String> CACHED = new HashSet<String>(Arrays.asList(
            "devices", "sysinfo", "pcmedia", "apps", "volume", "commands", "hello", "timers", "tasks", "received", "screenshot",
            "game", "gameicon", "gamelib", "gamesummary"));

    public static void setSink(Sink s) { sink = s; }

    public static void emit(String event, Object payload) {
        String json = payload instanceof String ? (String) payload : Json.stringify(payload);
        if (CACHED.contains(event)) LAST.put(event, json);
        Sink s = sink;
        if (s != null) s.emit(event, json);
    }

    public static void forget(String event) { LAST.remove(event); }

    /** Snapshot of all cached events, sent to the UI when it (re)loads. */
    public static String snapshot() {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, String> e : LAST.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            sb.append(Json.stringify(e.getKey())).append(':').append(e.getValue());
        }
        return sb.append('}').toString();
    }
}
