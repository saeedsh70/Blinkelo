package android.app;
public class Notification {
    public static final String CATEGORY_REMINDER = "reminder", CATEGORY_STOPWATCH = "stopwatch", CATEGORY_ALARM = "alarm";
    public static class Builder {
        public Builder setContentTitle(String s) { return this; }
        public Builder setContentText(String s) { return this; }
        public Builder setCategory(String s) { return this; }
        public Builder setAutoCancel(boolean v) { return this; }
        public Builder setContentIntent(PendingIntent i) { return this; }
        public Builder addAction(Action action) { return this; }
        public Builder setOngoing(boolean v) { return this; }
        public Builder setUsesChronometer(boolean v) { return this; }
        public Builder setChronometerCountDown(boolean v) { return this; }
        public Builder setWhen(long v) { return this; }
        public Builder setShowWhen(boolean v) { return this; }
        public Builder setOnlyAlertOnce(boolean v) { return this; }
        public Notification build() { return new Notification(); }
    }
    public static class Action {
        public static class Builder {
            public Builder(Object icon, String title, PendingIntent intent) {}
            public Action build() { return new Action(); }
        }
    }
}
