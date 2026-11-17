package android.net;
public class Uri {
    public static class Builder {
        public Builder scheme(String v) { return this; }
        public Builder authority(String v) { return this; }
        public Builder appendPath(String v) { return this; }
        public Uri build() { return new Uri(); }
    }
}
