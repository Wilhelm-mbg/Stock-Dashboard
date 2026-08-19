'use strict';
const { app, BrowserWindow, ipcMain, shell, Tray, Menu, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Nur EINE Instanz. Autostart (--hidden), Tray-Betrieb und ein Doppelklick auf die Verknüpfung
// starteten sonst mehrere Prozesse, die sich denselben Depot-Store teilen: beide scannen, beide
// handeln, der letzte Schreiber gewinnt. Genau daraus entstanden die verwaisten Trades und
// Doppel-Gutschriften, die repairOrphans() in depot.js bisher nur nachträglich aufräumen konnte.
const HAT_SPERRE = app.requestSingleInstanceLock();
if (!HAT_SPERRE) app.quit();

// Nur diese Hosts darf der Renderer über die Bridge abrufen:
const ALLOWED_HOSTS = new Set([
  'query1.finance.yahoo.com',
  'query2.finance.yahoo.com',
  'feeds.finance.yahoo.com',
  'news.google.com',
  'api.github.com' // nur für den Update-Check (Releases lesen)
]);

function fetchText(url, redirectsLeft) {
  if (redirectsLeft === undefined) redirectsLeft = 3;
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ ok: false, status: 0, body: 'Ungültige URL' }); }
    if (u.protocol !== 'https:' || !ALLOWED_HOSTS.has(u.hostname)) {
      return resolve({ ok: false, status: 0, body: 'Host nicht erlaubt: ' + u.hostname });
    }
    const req = https.get(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'application/json,text/xml,application/xml,*/*'
      },
      timeout: 15000
    }, (res) => {
      // Redirects folgen (nur innerhalb erlaubter Hosts)
      if (res.statusCode >= 301 && res.statusCode <= 308 && res.headers.location && redirectsLeft > 0) {
        res.resume();
        return resolve(fetchText(new URL(res.headers.location, u).toString(), redirectsLeft - 1));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; if (data.length > 8 * 1024 * 1024) { req.destroy(); resolve({ ok: false, status: res.statusCode || 0, body: 'Antwort zu groß (über 8 MB) – abgebrochen' }); } });
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode || 0, body: data }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, body: 'Timeout' }); });
    req.on('error', (e) => resolve({ ok: false, status: 0, body: String(e.message || e) }));
  });
}

ipcMain.handle('fetch-text', async (_ev, url) => fetchText(url));
ipcMain.handle('app-version', async () => app.getVersion());
// Autostart mit Windows (minimiert im Tray)
ipcMain.handle('set-autostart', async (_ev, on) => {
  try {
    app.setLoginItemSettings({ openAtLogin: !!on, args: on ? ['--hidden'] : [] });
    return { ok: true, on: app.getLoginItemSettings().openAtLogin };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});
ipcMain.handle('get-autostart', async () => {
  try { return { ok: true, on: app.getLoginItemSettings().openAtLogin }; } catch (e) { return { ok: false, on: false }; }
});
// Analyse-Export: schreibt Depot-Daten (OHNE Zugangsdaten) in den Downloads-Ordner,
// damit sie z. B. von Claude zur Auswertung gelesen werden können.
// Auto-Tuning: von Claude geschriebene Empfehlung aus dem Daten-Ordner lesen
ipcMain.handle('read-recommendation', async () => {
  try {
    const p = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', 'empfehlung.json');
    if (!fs.existsSync(p)) return { ok: false };
    return { ok: true, body: fs.readFileSync(p, 'utf8'), mtime: fs.statSync(p).mtimeMs };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});
// Claude-Auswertungsbericht aus dem Daten-Ordner lesen (Anzeige in der App)
ipcMain.handle('read-report', async () => {
  try {
    const p = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', 'auswertung-bericht.md');
    if (!fs.existsSync(p)) return { ok: false };
    const txt = fs.readFileSync(p, 'utf8');
    return { ok: true, body: txt.length > 120000 ? txt.slice(0, 120000) + '\n\n… (gekürzt)' : txt, mtime: fs.statSync(p).mtimeMs };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});
ipcMain.handle('export-analysis', async (_ev, payload) => {
  try {
    const dir = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten');
    fs.mkdirSync(dir, { recursive: true });
    if (payload.json != null) schreibAtomar(path.join(dir, 'analyse-daten.json'), JSON.stringify(payload.json, null, 1));
    if (payload.csv) schreibAtomar(path.join(dir, 'trades.csv'), payload.csv);
    if (payload.kurse) schreibAtomar(path.join(dir, 'kursdaten.json'), JSON.stringify(payload.kurse));
    // 🤖 Messbericht des Autopiloten: Klartext, was funktioniert und woran der Rest scheitert –
    // gedacht zum Nachlesen und für die Auswertung mit Claude (liest denselben Ordner).
    if (payload.bericht) schreibAtomar(path.join(dir, 'messbericht.md'), payload.bericht);
    // Rechen-Engine mitliefern, damit externe Auswertungen exakt dieselbe Logik nutzen
    try {
      var eng = fs.readFileSync(path.join(__dirname, 'quant.js'), 'utf8');
      var engPath = path.join(dir, 'engine.js');
      if (!fs.existsSync(engPath) || fs.readFileSync(engPath, 'utf8') !== eng) fs.writeFileSync(engPath, eng, 'utf8');
    } catch (e) { /* Engine-Kopie ist optional */ }
    return { ok: true, dir };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});
ipcMain.handle('open-external', async (_ev, url) => {
  try {
    const u = new URL(url);
    if (u.protocol === 'https:' && (u.hostname === 'github.com' || u.hostname.endsWith('.github.com') || u.hostname === 'objects.githubusercontent.com')) {
      shell.openExternal(url);
      return true;
    }
  } catch (e) { /* ignorieren */ }
  return false;
});

// Die kostenpflichtige Anthropic-API wurde entfernt – KI-Analysen laufen lokal über Ollama.

// ---- Capital.com (NUR Demo-Host – Live-Handel ist bewusst nicht möglich) ----
const CAP_HOSTS = new Set(['demo-api-capital.backend-capital.com']);
function capFetch(method, url, headers, bodyObj) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ ok: false, status: 0, body: 'Ungültige URL', headers: {} }); }
    if (u.protocol !== 'https:' || !CAP_HOSTS.has(u.hostname)) {
      return resolve({ ok: false, status: 0, body: 'Host nicht erlaubt (nur Capital.com-DEMO): ' + u.hostname, headers: {} });
    }
    const payload = bodyObj != null ? JSON.stringify(bodyObj) : null;
    const h = Object.assign({}, headers || {});
    if (payload) { h['Content-Type'] = 'application/json'; h['Content-Length'] = Buffer.byteLength(payload); }
    const req = https.request(u, { method: method || 'GET', headers: h, timeout: 20000 }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; if (data.length > 8 * 1024 * 1024) { req.destroy(); resolve({ ok: false, status: res.statusCode || 0, body: 'Antwort zu groß – abgebrochen', headers: {} }); } });
      res.on('end', () => {
        const lower = {};
        Object.keys(res.headers || {}).forEach((k) => { lower[k.toLowerCase()] = res.headers[k]; });
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode || 0, body: data, headers: lower });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, body: 'Timeout', headers: {} }); });
    req.on('error', (e) => resolve({ ok: false, status: 0, body: String(e.message || e), headers: {} }));
    if (payload) req.write(payload);
    req.end();
  });
}
ipcMain.handle('cap-fetch', async (_ev, method, url, headers, bodyObj) => capFetch(method, url, headers, bodyObj));

// ---- Ollama (lokale KI – NUR localhost) ----
const http = require('http');
function gespeicherteSettings() {
  try {
    const f = path.join(app.getPath('userData'), 'store', 'settings.json');
    if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8')) || {};
  } catch (e) { /* defekte Datei: Defaults */ }
  return {};
}
function ollamaPortErlaubt(port) {
  if (port === '11434') return true;
  try {
    const st = gespeicherteSettings();
    if (st.ollamaUrl) { const ou = new URL(st.ollamaUrl); return (ou.port || '80') === port; }
  } catch (e) { /* ignorieren */ }
  return false;
}
function ollamaFetch(method, url, bodyObj) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch (e) { return resolve({ ok: false, status: 0, body: 'Ungültige URL' }); }
    if (u.protocol !== 'http:' || (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost')) {
      return resolve({ ok: false, status: 0, body: 'Nur localhost erlaubt' });
    }
    // Nur der Ollama-Port (Standard 11434 bzw. der in den Einstellungen hinterlegte) –
    // sonst könnte der Renderer beliebige lokale Dienste mit POSTs ansprechen.
    if (!ollamaPortErlaubt(u.port || '80')) {
      return resolve({ ok: false, status: 0, body: 'Port nicht erlaubt (nur der eingestellte Ollama-Port)' });
    }
    const payload = bodyObj != null ? JSON.stringify(bodyObj) : null;
    const req = http.request(u, {
      method: method || 'GET',
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {},
      timeout: 45000
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; if (data.length > 8 * 1024 * 1024) { req.destroy(); resolve({ ok: false, status: res.statusCode || 0, body: 'Antwort zu groß – abgebrochen' }); } });
      res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode || 0, body: data }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 0, body: 'Timeout – Modell zu langsam?' }); });
    req.on('error', (e) => resolve({ ok: false, status: 0, body: String(e.message || e) }));
    if (payload) req.write(payload);
    req.end();
  });
}
ipcMain.handle('ollama-fetch', async (_ev, method, url, bodyObj) => ollamaFetch(method, url, bodyObj));

// ---- Lokaler JSON-Store (userData/store/<name>.json) ----
/** Atomar schreiben: erst Temp-Datei, dann umbenennen. Ein Absturz mitten im Schreiben
 *  hinterlaesst sonst eine halbe JSON-Datei - und mit ihr waeren Depot, Einstellungen
 *  oder Wochen an gesammeltem Kursarchiv verloren. */
function schreibAtomar(pfad, inhalt) {
  const tmp = pfad + '.tmp';
  fs.writeFileSync(tmp, inhalt, 'utf8');
  fs.renameSync(tmp, pfad);
}

function storeDir() {
  const d = path.join(app.getPath('userData'), 'store');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}
function safeName(name) { return String(name).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80); }

// Zugangsdaten liegen nicht mehr im Klartext auf der Platte. safeStorage nutzt den
// Windows-Anmeldedaten-Schutz (DPAPI): entschlüsseln kann nur derselbe Benutzer auf
// demselben Rechner. Ist der Dienst nicht verfügbar, bleibt es beim alten Verhalten –
// lieber unverschlüsselt speichern als die Einstellungen gar nicht sichern können.
const GEHEIME_FELDER = ['capKey', 'capId', 'capPass'];
function chiffrieren(v) {
  if (typeof v !== 'string' || !v) return v;
  try {
    if (!safeStorage.isEncryptionAvailable()) return v;
    return { __enc: 'v1', d: safeStorage.encryptString(v).toString('base64') };
  } catch (e) { return v; }
}
function dechiffrieren(v) {
  if (!v || typeof v !== 'object' || v.__enc !== 'v1') return v;   // Altbestand: Klartext bleibt lesbar
  // Fehlschlag wird MARKIERT statt als '' getarnt: ein leerer String saehe im Dialog wie
  // "nichts gespeichert" aus, und das naechste Speichern wuerde die verschluesselten
  // Zugangsdaten unwiederbringlich mit nichts ueberschreiben.
  try { return safeStorage.decryptString(Buffer.from(v.d, 'base64')); } catch (e) { return { __encFehler: true }; }
}
function geheimnisseWandeln(name, wert, fn) {
  if (name !== 'settings' || !wert || typeof wert !== 'object') return wert;
  const kopie = Object.assign({}, wert);
  GEHEIME_FELDER.forEach((k) => { if (k in kopie) kopie[k] = fn(kopie[k]); });
  return kopie;
}
ipcMain.handle('store-get', async (_ev, name) => {
  try {
    const f = path.join(storeDir(), safeName(name) + '.json');
    if (!fs.existsSync(f)) return null;
    return geheimnisseWandeln(name, JSON.parse(fs.readFileSync(f, 'utf8')), dechiffrieren);
  } catch (e) { return null; }
});
ipcMain.handle('store-set', async (_ev, name, value) => {
  try {
    const f = path.join(storeDir(), safeName(name) + '.json');
    let wert = geheimnisseWandeln(name, value, chiffrieren);
    // Keep-Sentinel: {__keep:true} bedeutet "gespeicherten Wert unveraendert lassen" -
    // der Renderer schickt das fuer Geheimnis-Felder, die er nicht entschluesseln konnte
    // oder bewusst nicht anfassen will. So kann ein Speichern nie Zugangsdaten vernichten.
    if (name === 'settings' && wert && typeof wert === 'object' && fs.existsSync(f)) {
      let alt = null;
      try { alt = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e2) { alt = null; }
      if (alt) GEHEIME_FELDER.forEach((k) => {
        if (wert[k] && typeof wert[k] === 'object' && wert[k].__keep) wert[k] = alt[k] != null ? alt[k] : '';
      });
    }
    schreibAtomar(f, JSON.stringify(wert));
    return { ok: true };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});

// ---- Tray-Modus (App läuft beim Schließen im Hintergrund weiter) ----
let tray = null;
let trayMode = false;
let quitting = false;
let mainWin = null;
ipcMain.on('tray-mode', (_ev, v) => { trayMode = !!v; });
app.on('before-quit', () => { quitting = true; });

function ensureTray() {
  if (tray) return;
  tray = new Tray(path.join(__dirname, 'icon.png'));
  tray.setToolTip('Markt-Dashboard – läuft im Hintergrund');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Markt-Dashboard anzeigen', click: () => { if (mainWin) { mainWin.show(); mainWin.focus(); } } },
    { type: 'separator' },
    { label: 'Beenden', click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on('double-click', () => { if (mainWin) { mainWin.show(); mainWin.focus(); } });
}

const STARTED_HIDDEN = process.argv.includes('--hidden');
function createWindow() {
  const win = new BrowserWindow({
    show: !STARTED_HIDDEN,   // beim Autostart minimiert im Tray starten
    width: 1240,
    height: 940,
    minWidth: 720,
    minHeight: 500,
    backgroundColor: '#0d0d0d',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWin = win;
  if (STARTED_HIDDEN) { trayMode = true; ensureTray(); }
  win.on('close', (e) => {
    if (trayMode && !quitting) {
      e.preventDefault();
      ensureTray();
      win.hide();
    }
  });
  win.loadFile('index.html');
  // Externe Links im Standard-Browser öffnen, nicht im App-Fenster
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (ev, url) => {
    if (!url.startsWith('file://')) { ev.preventDefault(); if (url.startsWith('https://')) shell.openExternal(url); }
  });
}

/* ================= Automatische Updates (electron-updater über GitHub-Releases) ================= */
let autoUpd = null;
let updState = { state: 'idle', version: null, pct: 0, msg: '', at: Date.now() };
function updSend(patch) {
  updState = Object.assign({}, updState, patch, { at: Date.now() });
  if (mainWin && !mainWin.isDestroyed()) {
    try { mainWin.webContents.send('update-state', updState); } catch (e) { /* Fenster weg */ }
  }
}
let updFehler = null;
function setupUpdater() {
  // WICHTIG: Ein bereits eingerichteter Updater wird ZURÜCKGEGEBEN, nicht mit null quittiert.
  // Vorher meldete der Knopf "Update-Modul nicht verfügbar", sobald der Start-Timer den
  // Updater schon angelegt hatte – obwohl alles funktionierte.
  if (autoUpd) return autoUpd;
  if (!app.isPackaged) return null;              // im Entwicklungsmodus gibt es nichts zu aktualisieren
  try {
    autoUpd = require('electron-updater').autoUpdater;
  } catch (e) {
    updFehler = (e && e.message) ? e.message : String(e);
    updSend({ state: 'error', version: null, pct: 0, msg: 'Update-Modul fehlt: ' + updFehler });
    return null;
  }
  const updAus = gespeicherteSettings().autoUpdate === false;   // Opt-out gilt ab dem Start
  autoUpd.autoDownload = !updAus;         // still im Hintergrund laden …
  autoUpd.autoInstallOnAppQuit = !updAus; // … und beim nächsten Beenden einspielen
  autoUpd.allowPrerelease = false;
  autoUpd.on('checking-for-update', () => updSend({ state: 'checking', msg: 'Suche nach Updates …' }));
  autoUpd.on('update-available', (i) => updSend({ state: 'available', version: i && i.version, pct: 0, msg: 'Version ' + ((i && i.version) || '?') + ' gefunden' + (autoUpd.autoDownload ? ' – wird geladen …' : ' (automatisches Laden ist ausgeschaltet)') }));
  autoUpd.on('update-not-available', () => updSend({ state: 'current', version: app.getVersion(), msg: 'Aktuell (' + app.getVersion() + ')' }));
  autoUpd.on('download-progress', (p) => updSend({ state: 'downloading', pct: Math.round((p && p.percent) || 0), msg: 'Lade … ' + Math.round((p && p.percent) || 0) + ' %' }));
  autoUpd.on('update-downloaded', (i) => updSend({ state: 'ready', version: i && i.version, pct: 100, msg: 'Version ' + ((i && i.version) || '?') + ' ist heruntergeladen – wird beim nächsten Beenden eingespielt.' }));
  autoUpd.on('error', (e) => updSend({ state: 'error', msg: 'Update-Fehler: ' + ((e && e.message) || e) }));
  return autoUpd;
}
ipcMain.handle('update-state', async () => Object.assign({ packaged: app.isPackaged, current: app.getVersion() }, updState));
ipcMain.handle('update-check', async () => {
  const u = setupUpdater();
  if (!u) return { ok: false, packaged: app.isPackaged,
    msg: !app.isPackaged ? 'Läuft aus dem Quellcode – Updates gibt es nur in der installierten Version.'
      : ('Update-Modul nicht ladbar' + (updFehler ? ': ' + updFehler : '')) };
  try { await u.checkForUpdates(); return { ok: true }; }
  catch (e) { updSend({ state: 'error', msg: 'Update-Fehler: ' + ((e && e.message) || e) }); return { ok: false, msg: String((e && e.message) || e) }; }
});
ipcMain.handle('update-install', async () => {
  if (!autoUpd || updState.state !== 'ready') return { ok: false, msg: 'Es liegt kein fertig geladenes Update bereit.' };
  quitting = true;
  setTimeout(() => {
    try { autoUpd.quitAndInstall(false, true); }
    catch (e) { quitting = false; updSend({ state: 'error', msg: 'Installation fehlgeschlagen: ' + ((e && e.message) || e) }); }
  }, 300);
  return { ok: true };
});
ipcMain.handle('update-set-auto', async (_ev, on) => {
  const u = setupUpdater();
  if (u) { u.autoDownload = !!on; u.autoInstallOnAppQuit = !!on; }
  return { ok: true, on: !!on };
});

// Zweiter Startversuch: kein neuer Prozess, sondern das vorhandene Fenster nach vorn holen.
app.on('second-instance', () => {
  if (mainWin && !mainWin.isDestroyed()) {
    if (mainWin.isMinimized()) mainWin.restore();
    mainWin.show();
    mainWin.focus();
  }
});

if (HAT_SPERRE) app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  // Kurz nach dem Start und danach alle 6 Stunden nach Updates sehen
  setTimeout(() => { const u = setupUpdater(); if (u) u.checkForUpdates().catch(() => {}); }, 25000);
  setInterval(() => { const u = setupUpdater(); if (u) u.checkForUpdates().catch(() => {}); }, 6 * 3600000);
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin' && !trayMode) app.quit(); });
