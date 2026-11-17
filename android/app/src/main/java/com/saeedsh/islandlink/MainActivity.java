package com.saeedsh.islandlink;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.saeedsh.islandlink.core.Json;

import java.util.ArrayList;
import java.util.List;

/** Hosts the WebView UI (assets/ui) and the native bridge. */
public class MainActivity extends Activity implements UiBus.Sink {
    static final int REQ_PICK = 3100;
    private static final String UI_URL = "file:///android_asset/ui/index.html";

    private WebView web;
    private boolean pageReady;
    private String pendingRoute;
    private String pendingSharePeer;
    volatile String volumeMode = "off";

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (state != null) pendingSharePeer = state.getString("sharePeer");
        if (Settings.get(this).bool("onboarded", false)) LinkService.start(this);
        web = new WebView(this);
        web.setBackgroundColor(0xFF000000);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setAllowFileAccess(false);
        ws.setAllowFileAccessFromFileURLs(false);
        ws.setAllowUniversalAccessFromFileURLs(false);
        ws.setAllowContentAccess(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setTextZoom(100);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.addJavascriptInterface(new Bridge(this), "IslandNative");
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage m) {
                Util.log("ui: " + m.message() + " @" + m.lineNumber());
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (UI_URL.equals(u.toString()) || u.toString().startsWith(UI_URL + "#")) return false;
                if (r.isForMainFrame() && isWebUrl(u)) openExternal(new Intent(Intent.ACTION_VIEW, u));
                return true;
            }
            @Override public void onPageFinished(WebView v, String url) {
                if (!UI_URL.equals(url) && !url.startsWith(UI_URL + "#")) return;
                pageReady = true;
                applyInsets(web.getRootWindowInsets());
                if (pendingRoute != null) { route(pendingRoute); pendingRoute = null; }
            }
        });
        setupEdgeToEdge();
        setContentView(web);
        pendingRoute = getIntent().getStringExtra("route");
        web.loadUrl(UI_URL);
        UiBus.setSink(this);
    }

    @SuppressWarnings("deprecation")
    private void setupEdgeToEdge() {
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
        web.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                applyInsets(insets);
                return insets;
            }
        });
    }

    @SuppressWarnings("deprecation")
    private void applyInsets(WindowInsets in) {
        if (in == null || !pageReady) return;
        float d = getResources().getDisplayMetrics().density;
        int top, bottom, left, right, ime = 0;
        if (Build.VERSION.SDK_INT >= 30) {
            android.graphics.Insets s = in.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            android.graphics.Insets k = in.getInsets(WindowInsets.Type.ime());
            top = s.top; bottom = s.bottom; left = s.left; right = s.right; ime = k.bottom;
        } else {
            top = in.getSystemWindowInsetTop(); bottom = in.getSystemWindowInsetBottom();
            left = in.getSystemWindowInsetLeft(); right = in.getSystemWindowInsetRight();
        }
        String js = "window.__island&&__island.insets(" + Math.round(top / d) + "," + Math.round(right / d) + ","
                + Math.round(bottom / d) + "," + Math.round(left / d) + "," + Math.round(ime / d) + ")";
        web.evaluateJavascript(js, null);
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String r = intent.getStringExtra("route");
        if (r != null) { if (pageReady) route(r); else pendingRoute = r; }
    }

    private void route(String r) {
        web.evaluateJavascript("window.__island&&__island.route(" + Json.stringify(r) + ")", null);
    }

    @Override protected void onResume() {
        super.onResume();
        UiBus.setSink(this);
        UiBus.emit("permissions", Permissions.state(this));
        LinkService s = LinkService.get();
        if (s != null) UiBus.emit("devices", s.state());
        else UiBus.emit("devices", new Json.Obj().p("ready", false).p("service", false).p("active", null)
                .p("pc", new Json.Obj()).p("devices", new Json.Arr()));
    }

    @Override protected void onDestroy() {
        UiBus.setSink(null);
        pageReady = false;
        if (web != null) { web.removeJavascriptInterface("IslandNative"); web.destroy(); web = null; }
        super.onDestroy();
    }

    // ------------------------------------------------------------------ events → JS
    @Override public void emit(final String event, final String json) {
        if (web == null) return;
        runOnUiThread(new Runnable() {
            public void run() {
                if (!pageReady || web == null) return;
                web.evaluateJavascript("window.__island&&__island.event(" + Json.stringify(event) + "," + json + ")", null);
            }
        });
    }

    // ------------------------------------------------------------------ keys
    @Override public void onBackPressed() {
        if (!pageReady) { super.onBackPressed(); return; }
        web.evaluateJavascript("window.__island?__island.back():false", new ValueCallback<String>() {
            public void onReceiveValue(String v) {
                if (!"true".equals(v)) moveTaskToBack(true);
            }
        });
    }

    @Override public boolean dispatchKeyEvent(KeyEvent e) {
        int code = e.getKeyCode();
        if (!"off".equals(volumeMode) && (code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN)) {
            if (e.getAction() == KeyEvent.ACTION_DOWN && pageReady) {
                web.evaluateJavascript("window.__island&&__island.volumeKey(" + Json.stringify(code == KeyEvent.KEYCODE_VOLUME_UP ? "up" : "down") + ")", null);
            }
            return true;
        }
        return super.dispatchKeyEvent(e);
    }

    void setKeepScreenOn(final boolean on) {
        runOnUiThread(new Runnable() {
            public void run() {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
    }

    static boolean isWebUrl(Uri uri) {
        String scheme = uri.getScheme();
        return ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme))
                && uri.getHost() != null && !uri.getHost().isEmpty();
    }

    void openExternal(final Intent intent) {
        runOnUiThread(new Runnable() {
            public void run() {
                try { startActivity(intent); }
                catch (Exception e) { Util.toast(MainActivity.this, String.valueOf(e.getMessage())); }
            }
        });
    }

    // ------------------------------------------------------------------ results
    @Override protected void onSaveInstanceState(Bundle state) {
        if (pendingSharePeer != null) state.putString("sharePeer", pendingSharePeer);
        super.onSaveInstanceState(state);
    }

    void pickFiles() {
        runOnUiThread(new Runnable() {
            public void run() {
                LinkService service = LinkService.get();
                if (service == null || service.active() == null) { Util.toast(MainActivity.this, Strings.t(MainActivity.this, "not_connected")); return; }
                pendingSharePeer = service.active().id;
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
                        .putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try { startActivityForResult(i, REQ_PICK); } catch (Exception e) { Util.toast(MainActivity.this, String.valueOf(e.getMessage())); }
            }
        });
    }

    @Override protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        if (req != REQ_PICK) return;
        String targetId = pendingSharePeer;
        pendingSharePeer = null;
        if (result != RESULT_OK || data == null || targetId == null) return;
        List<Uri> uris = new ArrayList<Uri>();
        ClipData clip = data.getClipData();
        if (clip != null) for (int i = 0; i < clip.getItemCount(); i++) uris.add(clip.getItemAt(i).getUri());
        else if (data.getData() != null) uris.add(data.getData());
        LinkService s = LinkService.get();
        if (s != null && !uris.isEmpty()) s.plugins.transfers.sendUrisTo(uris, targetId);
    }

    @Override public void onRequestPermissionsResult(int req, String[] perms, int[] results) {
        super.onRequestPermissionsResult(req, perms, results);
        UiBus.emit("permissions", Permissions.state(this));
        LinkService s = LinkService.get();
        if (s != null) {
            for (String p : perms) if (p.contains("BLUETOOTH")) s.restartBluetooth();
            UiBus.emit("devices", s.state());
        }
    }
}
