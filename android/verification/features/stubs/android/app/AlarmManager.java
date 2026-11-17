package android.app;
public class AlarmManager {
    public static final int RTC_WAKEUP = 0;
    public boolean canScheduleExactAlarms() { return false; }
    public void setAndAllowWhileIdle(int type, long at, PendingIntent pi) {}
    public void setExactAndAllowWhileIdle(int type, long at, PendingIntent pi) {}
    public void cancel(PendingIntent pi) {}
}
