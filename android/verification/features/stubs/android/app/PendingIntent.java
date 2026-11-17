package android.app;
import android.content.Context;
import android.content.Intent;
public class PendingIntent {
    public static final int FLAG_UPDATE_CURRENT = 1, FLAG_IMMUTABLE = 2;
    public static PendingIntent getBroadcast(Context ctx, int req, Intent i, int flags) { return new PendingIntent(); }
}
