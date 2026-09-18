package de.wilhelm.mailueberblick;

/* Mail-Überblick für Android: eine WebView um die Seite, die tools/mail-server.js auf
 * wilhelm-pc ausliefert. Die App selbst hält keine Mails; sie zeigt nur, was der Server
 * über Tailscale liefert. Die Serveradresse steht in den SharedPreferences und lässt sich
 * über den Link "Serveradresse ändern" auf der Seite (JavaScript-Brücke App.setzeAdresse)
 * oder auf der Fehlerseite ändern. */

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    static final String STANDARD = "http://100.101.162.19:8790/";
    private WebView web;
    private SharedPreferences prefs;

    class Bruecke {
        @JavascriptInterface
        public void setzeAdresse(String url) {
            if (url == null) return;
            String u = url.trim();
            if (!u.startsWith("http://") && !u.startsWith("https://")) u = "http://" + u;
            if (!u.endsWith("/")) u = u + "/";
            prefs.edit().putString("adresse", u).apply();
            final String ziel = u;
            runOnUiThread(new Runnable() { public void run() { web.loadUrl(ziel); } });
        }
        @JavascriptInterface
        public String adresse() { return prefs.getString("adresse", STANDARD); }
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        prefs = getSharedPreferences("mail", MODE_PRIVATE);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.addJavascriptInterface(new Bruecke(), "App");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) zeigeFehler(String.valueOf(err.getDescription()));
            }
        });
        setContentView(web);
        if (saved != null) web.restoreState(saved); else web.loadUrl(prefs.getString("adresse", STANDARD));
    }

    private void zeigeFehler(String grund) {
        String adr = prefs.getString("adresse", STANDARD);
        String html = "<!DOCTYPE html><html lang=de><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'>"
            + "<style>body{font:16px system-ui;padding:24px;color:#1a1d21;background:#f5f6f8}@media(prefers-color-scheme:dark){body{color:#e8eaed;background:#101214}}"
            + "input,button{font:inherit;padding:8px;border-radius:8px;border:1px solid #888;width:100%;box-sizing:border-box;margin-top:8px}</style></head><body>"
            + "<h2>Server nicht erreichbar</h2><p>" + escape(grund) + "</p>"
            + "<p>Läuft der PC (wilhelm-pc) und der Mail-Überblick-Server? Ist Tailscale am Handy an?</p>"
            + "<p>Serveradresse:</p><input id=a value='" + escape(adr) + "'>"
            + "<button onclick='App.setzeAdresse(document.getElementById(\"a\").value)'>Verbinden</button></body></html>";
        web.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    private static String escape(String s) {
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&#39;");
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }
}
