package com.saeedsh.islandlink.core;

/** Base64 helpers (java.util.Base64 exists on Android 8.0+ and every desktop JVM). */
public final class Base64 {
    private Base64() {}

    public static String encode(byte[] data) {
        return java.util.Base64.getEncoder().encodeToString(data);
    }

    public static byte[] decode(String s) {
        if (s == null || s.isEmpty()) return new byte[0];
        try {
            return java.util.Base64.getMimeDecoder().decode(s);
        } catch (IllegalArgumentException e) {
            return new byte[0];
        }
    }
}
