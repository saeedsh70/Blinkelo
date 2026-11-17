package android.content;
import java.io.File;
public class Context {
    private final File directory;
    public Context(File directory) { this.directory = directory; directory.mkdirs(); }
    public Context getApplicationContext() { return this; }
    public File getFilesDir() { return directory; }
    public <T> T getSystemService(Class<T> type) { return null; }
}
