package com.saeedsh.islandlink;
import android.content.Context;
import java.util.HashMap;
public class Settings {
    static final HashMap<String, String> STATE = new HashMap<String, String>();
    static String state(Context c, String k, String d) { return STATE.containsKey(k) ? STATE.get(k) : d; }
    static void setState(Context c, String k, String v) { STATE.put(k, v); }
}
