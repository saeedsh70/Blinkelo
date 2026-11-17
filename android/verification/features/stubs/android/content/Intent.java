package android.content;
import android.net.Uri;
public class Intent {
    public Intent(Context c, Class<?> target) {}
    public Intent setAction(String action) { return this; }
    public Intent setData(Uri uri) { return this; }
    public Intent putExtra(String key, String value) { return this; }
}
