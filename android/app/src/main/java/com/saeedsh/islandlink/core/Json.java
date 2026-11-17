package com.saeedsh.islandlink.core;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Tiny JSON implementation (objects = {@link Obj}, arrays = {@link Arr}, numbers = Long or Double).
 * Platform independent so the protocol core can be tested on a desktop JVM.
 */
public final class Json {
    private Json() {}

    // ------------------------------------------------------------------ object / array helpers
    public static final class Obj extends LinkedHashMap<String, Object> {
        public Obj() { super(); }
        public Obj(Map<String, Object> m) { super(m); }

        public Obj p(String key, Object value) { put(key, value); return this; }

        public String str(String key) { return str(key, ""); }
        public String str(String key, String def) {
            Object v = get(key);
            if (v == null) return def;
            if (v instanceof String) return (String) v;
            if (v instanceof Double) {
                double d = (Double) v;
                if (d == Math.rint(d) && !Double.isInfinite(d)) return Long.toString((long) d);
            }
            return String.valueOf(v);
        }
        public double num(String key, double def) {
            Object v = get(key);
            if (v instanceof Number) return ((Number) v).doubleValue();
            if (v instanceof String) { try { return Double.parseDouble(((String) v).trim()); } catch (Exception e) { return def; } }
            if (v instanceof Boolean) return ((Boolean) v) ? 1 : 0;
            return def;
        }
        public long lng(String key, long def) {
            Object v = get(key);
            if (v instanceof Number) return ((Number) v).longValue();
            if (v instanceof String) { try { return (long) Double.parseDouble(((String) v).trim()); } catch (Exception e) { return def; } }
            return def;
        }
        public int integer(String key, int def) { return (int) lng(key, def); }
        public boolean bool(String key, boolean def) {
            Object v = get(key);
            if (v instanceof Boolean) return (Boolean) v;
            if (v instanceof String) return "true".equalsIgnoreCase((String) v) || "1".equals(v);
            if (v instanceof Number) return ((Number) v).doubleValue() != 0;
            return def;
        }
        public boolean bool(String key) { return bool(key, false); }
        public Obj obj(String key) { Object v = get(key); return v instanceof Obj ? (Obj) v : null; }
        public Obj objOrEmpty(String key) { Obj o = obj(key); return o != null ? o : new Obj(); }
        public Arr arr(String key) { Object v = get(key); return v instanceof Arr ? (Arr) v : null; }
        public Arr arrOrEmpty(String key) { Arr a = arr(key); return a != null ? a : new Arr(); }
        public boolean has(String key) { return containsKey(key) && get(key) != null; }

        @Override public String toString() { return stringify(this); }
    }

    public static final class Arr extends ArrayList<Object> {
        public Arr() { super(); }
        public Arr(Collection<?> c) { super(c); }
        public Arr a(Object v) { add(v); return this; }
        public String str(int i) { Object v = get(i); return v == null ? "" : (v instanceof String ? (String) v : String.valueOf(v)); }
        public Obj obj(int i) { Object v = get(i); return v instanceof Obj ? (Obj) v : null; }
        public List<String> strings() {
            List<String> out = new ArrayList<String>();
            for (Object o : this) if (o != null) out.add(o instanceof String ? (String) o : String.valueOf(o));
            return out;
        }
        @Override public String toString() { return stringify(this); }
    }

    public static Obj obj() { return new Obj(); }
    public static Arr arr(Object... items) {
        Arr a = new Arr();
        for (Object o : items) a.add(o);
        return a;
    }
    public static Arr arrOf(Collection<?> items) { return new Arr(items); }

    // ------------------------------------------------------------------ stringify
    public static String stringify(Object v) {
        StringBuilder sb = new StringBuilder(64);
        write(sb, v);
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static void write(StringBuilder sb, Object v) {
        if (v == null) { sb.append("null"); return; }
        if (v instanceof String) { quote(sb, (String) v); return; }
        if (v instanceof Boolean) { sb.append(((Boolean) v) ? "true" : "false"); return; }
        if (v instanceof Double || v instanceof Float) {
            double d = ((Number) v).doubleValue();
            if (Double.isNaN(d) || Double.isInfinite(d)) { sb.append("null"); return; }
            if (d == Math.rint(d) && Math.abs(d) < 9.007199254740992E15) sb.append((long) d);
            else sb.append(d);
            return;
        }
        if (v instanceof Number) { sb.append(((Number) v).longValue()); return; }
        if (v instanceof Map) {
            sb.append('{');
            boolean first = true;
            for (Map.Entry<String, Object> e : ((Map<String, Object>) v).entrySet()) {
                if (!first) sb.append(',');
                first = false;
                quote(sb, e.getKey());
                sb.append(':');
                write(sb, e.getValue());
            }
            sb.append('}');
            return;
        }
        if (v instanceof Collection) {
            sb.append('[');
            boolean first = true;
            for (Object o : (Collection<Object>) v) {
                if (!first) sb.append(',');
                first = false;
                write(sb, o);
            }
            sb.append(']');
            return;
        }
        if (v instanceof Object[]) {
            sb.append('[');
            Object[] a = (Object[]) v;
            for (int i = 0; i < a.length; i++) {
                if (i > 0) sb.append(',');
                write(sb, a[i]);
            }
            sb.append(']');
            return;
        }
        quote(sb, String.valueOf(v));
    }

    private static final char[] HEX = "0123456789abcdef".toCharArray();

    private static void quote(StringBuilder sb, String s) {
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                default:
                    if (c < 0x20 || c == 0x2028 || c == 0x2029) {
                        sb.append("\\u").append(HEX[(c >> 12) & 15]).append(HEX[(c >> 8) & 15]).append(HEX[(c >> 4) & 15]).append(HEX[c & 15]);
                    } else sb.append(c);
            }
        }
        sb.append('"');
    }

    // ------------------------------------------------------------------ parse
    public static Object parse(String s) {
        if (s == null) throw new IllegalArgumentException("null json");
        Parser p = new Parser(s);
        p.ws();
        Object v = p.value(0);
        p.ws();
        if (p.i != s.length()) throw new IllegalArgumentException("trailing data at " + p.i);
        return v;
    }

    /** Parses an object; returns null on any error or when the text is not an object. */
    public static Obj parseObj(String s) {
        try {
            Object v = parse(s);
            return v instanceof Obj ? (Obj) v : null;
        } catch (RuntimeException e) {
            return null;
        }
    }

    public static Arr parseArr(String s) {
        try {
            Object v = parse(s);
            return v instanceof Arr ? (Arr) v : null;
        } catch (RuntimeException e) {
            return null;
        }
    }

    private static final class Parser {
        final String s;
        int i;
        Parser(String s) { this.s = s; }

        void ws() {
            while (i < s.length()) {
                char c = s.charAt(i);
                if (c == ' ' || c == '\n' || c == '\r' || c == '\t' || c == '\ufeff') i++;
                else break;
            }
        }

        IllegalArgumentException err(String m) { return new IllegalArgumentException(m + " at " + i); }

        Object value(int depth) {
            if (depth > 64) throw err("too deep");
            if (i >= s.length()) throw err("unexpected end");
            char c = s.charAt(i);
            switch (c) {
                case '{': return object(depth);
                case '[': return array(depth);
                case '"': return string();
                case 't': expect("true"); return Boolean.TRUE;
                case 'f': expect("false"); return Boolean.FALSE;
                case 'n': expect("null"); return null;
                default:
                    if (c == '-' || (c >= '0' && c <= '9')) return number();
                    throw err("unexpected char '" + c + "'");
            }
        }

        void expect(String word) {
            if (!s.startsWith(word, i)) throw err("expected " + word);
            i += word.length();
        }

        Obj object(int depth) {
            Obj o = new Obj();
            i++; // {
            ws();
            if (i < s.length() && s.charAt(i) == '}') { i++; return o; }
            while (true) {
                ws();
                if (i >= s.length() || s.charAt(i) != '"') throw err("expected key");
                String k = string();
                ws();
                if (i >= s.length() || s.charAt(i) != ':') throw err("expected :");
                i++;
                ws();
                o.put(k, value(depth + 1));
                ws();
                if (i >= s.length()) throw err("unexpected end");
                char c = s.charAt(i++);
                if (c == ',') continue;
                if (c == '}') return o;
                throw err("expected , or }");
            }
        }

        Arr array(int depth) {
            Arr a = new Arr();
            i++; // [
            ws();
            if (i < s.length() && s.charAt(i) == ']') { i++; return a; }
            while (true) {
                ws();
                a.add(value(depth + 1));
                ws();
                if (i >= s.length()) throw err("unexpected end");
                char c = s.charAt(i++);
                if (c == ',') continue;
                if (c == ']') return a;
                throw err("expected , or ]");
            }
        }

        String string() {
            i++; // opening quote
            StringBuilder sb = null;
            int start = i;
            while (i < s.length()) {
                char c = s.charAt(i);
                if (c == '"') {
                    String out = sb == null ? s.substring(start, i) : sb.append(s, start, i).toString();
                    i++;
                    return out;
                }
                if (c == '\\') {
                    if (sb == null) sb = new StringBuilder();
                    sb.append(s, start, i);
                    i++;
                    if (i >= s.length()) throw err("bad escape");
                    char e = s.charAt(i++);
                    switch (e) {
                        case '"': sb.append('"'); break;
                        case '\\': sb.append('\\'); break;
                        case '/': sb.append('/'); break;
                        case 'b': sb.append('\b'); break;
                        case 'f': sb.append('\f'); break;
                        case 'n': sb.append('\n'); break;
                        case 'r': sb.append('\r'); break;
                        case 't': sb.append('\t'); break;
                        case 'u':
                            if (i + 4 > s.length()) throw err("bad unicode escape");
                            sb.append((char) Integer.parseInt(s.substring(i, i + 4), 16));
                            i += 4;
                            break;
                        default: throw err("bad escape");
                    }
                    start = i;
                    continue;
                }
                i++;
            }
            throw err("unterminated string");
        }

        Object number() {
            int start = i;
            boolean frac = false;
            if (s.charAt(i) == '-') i++;
            while (i < s.length()) {
                char c = s.charAt(i);
                if (c >= '0' && c <= '9') i++;
                else if (c == '.' || c == 'e' || c == 'E' || c == '+' || c == '-') { frac = true; i++; }
                else break;
            }
            String t = s.substring(start, i);
            if (!frac) {
                try { return Long.parseLong(t); } catch (NumberFormatException ignored) { /* fall through */ }
            }
            try { return Double.parseDouble(t); } catch (NumberFormatException e) { throw err("bad number"); }
        }
    }

    // ------------------------------------------------------------------ misc
    public static List<String> strings(Object v) {
        List<String> out = new ArrayList<String>();
        if (v instanceof Collection) {
            for (Iterator<?> it = ((Collection<?>) v).iterator(); it.hasNext(); ) {
                Object o = it.next();
                if (o != null) out.add(String.valueOf(o));
            }
        }
        return out;
    }
}
