'use strict';
const { app, BrowserWindow, ipcMain, shell, Tray, Menu, safeStorage } = require('electron');
// fork statt spawn: kein Shell-Aufruf, Argumente gehen als Liste - eine Zeichenkette,
// die eine Shell interpretiert, gibt es hier gar nicht.
const { fork } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { pathToFileURL } = require('url');

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
  'fc.yahoo.com', // nur fuer das Cookie, das Yahoos Kalender-Endpunkt verlangt
  'news.google.com',
  'api.github.com', // nur für den Update-Check (Releases lesen)
  // Offene Produktsuche für echte Optionsscheine (WKN, ISIN, Emittent, Basispreis,
  // Fälligkeit, BV) – ohne Schlüssel und ohne Anmeldung. Damit bekommt der
  // Schein-Finder endlich echte WKNs (Tickets #9/#11/#17); dieselbe Quelle, an der
  // am 21.08.2026 das Cent-Spread-Modell geeicht wurde. Nur Lesezugriff.
  'api.onvista.de'
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

/* ================= Ergebnistermine =================
 * Yahoos Kalender-Endpunkt liefert echte Veröffentlichungstermine mit Schätzung, Ist
 * und Überraschung, zurück bis in die 1990er. Anders als `quoteSummary` (nur 4 Quartale,
 * und dort steht das Quartals-ENDE, nicht der Termin). Er verlangt aber Cookie + Crumb
 * und einen POST.
 *
 * Beides bleibt bewusst hier im Hauptprozess: Der Renderer übergibt nur ein Kürzel, die
 * Ziel-URL und der Anfragekörper stehen fest. Damit lässt sich über diesen Weg nichts
 * anderes verschicken – ein allgemeines `postJson` wäre eine offene Tür gewesen.
 *
 * Gebraucht wird das für die Ergebnis-Drift-Strategie: Kurse laufen nach einer
 * Überraschung noch Wochen in Überraschungsrichtung weiter. Am 21.08.2026 auf 20.356
 * Terminen gemessen: +10,44 % p. a. marktneutral seit 2015 (t = 3,04).
 */
let yahooSitz = { cookie: null, crumb: null, at: 0 };

function holeSitz() {
  return new Promise((resolve) => {
    // Eine Stunde wiederverwenden – der Crumb hält deutlich länger, und jeder Abruf
    // kostet sonst zwei zusätzliche Anfragen je Symbol.
    if (yahooSitz.crumb && Date.now() - yahooSitz.at < 3600000) return resolve(yahooSitz);
    const req = https.get('https://fc.yahoo.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' },
      timeout: 15000
    }, (res) => {
      const ck = (res.headers['set-cookie'] || []).map((s) => s.split(';')[0]).join('; ');
      res.resume();
      if (!ck) return resolve({ cookie: null, crumb: null });
      const req2 = https.get('https://query2.finance.yahoo.com/v1/test/getcrumb', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
          'Cookie': ck
        },
        timeout: 15000
      }, (r2) => {
        let d = '';
        r2.setEncoding('utf8');
        r2.on('data', (c) => { d += c; if (d.length > 4096) req2.destroy(); });
        r2.on('end', () => {
          // Ein Crumb ist ein kurzes Token. Kommt etwas Längeres, ist es eine
          // Fehlerseite – dann lieber nichts als Müll weiterreichen.
          if (!d || d.length > 40) return resolve({ cookie: null, crumb: null });
          yahooSitz = { cookie: ck, crumb: d, at: Date.now() };
          resolve(yahooSitz);
        });
      });
      req2.on('timeout', () => { req2.destroy(); resolve({ cookie: null, crumb: null }); });
      req2.on('error', () => resolve({ cookie: null, crumb: null }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ cookie: null, crumb: null }); });
    req.on('error', () => resolve({ cookie: null, crumb: null }));
  });
}

/** Ergebnistermine eines Symbols. Rückgabe: [[ISO-Zeit, Schätzung, Ist, Überraschung%], …] */
async function holeTermine(symbol, wiederholung) {
  const sym = String(symbol || '').toUpperCase().replace(/[^A-Z0-9.^-]/g, '').slice(0, 12);
  if (!sym) return { ok: false, body: 'Kein gültiges Kürzel' };
  const s = await holeSitz();
  if (!s.crumb) { yahooSitz = { cookie: null, crumb: null, at: 0 }; return { ok: false, body: 'Kein Zugang zum Kalender (Cookie/Crumb)' }; }
  const koerper = JSON.stringify({
    sortType: 'DESC', entityIdType: 'earnings', sortField: 'startdatetime', size: 250, offset: 0,
    includeFields: ['startdatetime', 'epsestimate', 'epsactual', 'epssurprisepct'],
    query: { operator: 'and', operands: [{ operator: 'eq', operands: ['ticker', sym] }] }
  });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'query1.finance.yahoo.com',
      path: '/v1/finance/visualization?crumb=' + encodeURIComponent(s.crumb) + '&lang=en-US&region=US',
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(koerper),
        'Cookie': s.cookie,
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/'
      },
      timeout: 20000
    }, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { d += c; if (d.length > 4 * 1024 * 1024) { req.destroy(); resolve({ ok: false, body: 'Antwort zu groß' }); } });
      res.on('end', () => {
        if (res.statusCode === 401 || res.statusCode === 403) yahooSitz = { cookie: null, crumb: null, at: 0 };
        // Gedrosselt: einmal kurz warten und wiederholen, statt das Symbol still zu verlieren.
        if (res.statusCode === 429 && !wiederholung) {
          return setTimeout(() => resolve(holeTermine(sym, true)), 5000);
        }
        if (res.statusCode < 200 || res.statusCode >= 300) return resolve({ ok: false, status: res.statusCode, body: 'HTTP ' + res.statusCode });
        try {
          const doc = JSON.parse(d).finance.result[0].documents[0];
          const spalten = doc.columns.map((x) => x.id);
          const iT = spalten.indexOf('startdatetime'), iS = spalten.indexOf('epsestimate');
          const iI = spalten.indexOf('epsactual'), iU = spalten.indexOf('epssurprisepct');
          resolve({ ok: true, termine: doc.rows.map((r) => [r[iT], r[iS], r[iI], r[iU]]) });
        } catch (e) { resolve({ ok: false, body: 'Antwort nicht lesbar' }); }
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, body: 'Timeout' }); });
    req.on('error', (e) => resolve({ ok: false, body: String(e.message || e) }));
    req.write(koerper);
    req.end();
  });
}
/* Der Kalender-Endpunkt oben ist TIEF, aber nicht FRISCH: Am 21.08.2026 endete er bei
 * Terminen aus dem Juni 2025, während die Kurse bis August 2026 liefen — 420 Tage Lücke.
 * Für den Rückblick reicht das, für den laufenden Betrieb nicht.
 *
 * Die frischen Zahlen stehen woanders: `earningsHistory` kennt die letzten vier Quartale
 * mit Ist-Wert und Überraschung (aber nur das Quartals-ENDE), `calendarEvents` nennt mit
 * `earningsCallDate` den letzten tatsächlichen Meldetermin. Zusammengesetzt ergibt das
 * den jüngsten Termin.
 *
 * Sicher gepaart wird nur das NEUESTE Quartal, und nur wenn der Meldetermin danach liegt
 * und höchstens 120 Tage später — sonst gehört die Terminangabe zu einem anderen Quartal.
 * Lieber nichts melden als ein falsch datiertes Ereignis: Ein um Wochen verschobener
 * Reaktionstag macht aus dem Drift Rauschen.
 */
/* Yahoo drosselt bei zu vielen Anfragen in Folge mit 429 und liefert dann den Text
 * "Too Many Requests" statt JSON. Ohne Behandlung fällt das Symbol still aus der
 * Messbasis – dieselbe Falle, die beim Kursabruf schon einmal zugeschlagen hat und
 * dort mit einer einzelnen Wiederholung behoben wurde. Hier wird zusätzlich
 * schrittweise länger gewartet, weil der Terminabruf über viele Symbole läuft. */
function jsonGet(pfad, cookie, versuch) {
  versuch = versuch || 0;
  return new Promise((resolve) => {
    const req = https.get('https://query2.finance.yahoo.com' + pfad, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Cookie': cookie, 'Accept': 'application/json'
      },
      timeout: 15000
    }, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { d += c; if (d.length > 2 * 1024 * 1024) req.destroy(); });
      res.on('end', () => {
        if (res.statusCode === 429 && versuch < 2) {
          return setTimeout(() => resolve(jsonGet(pfad, cookie, versuch + 1)), 4000 * (versuch + 1));
        }
        // 401/403 heißt meist: Crumb abgelaufen. Sitzung verwerfen, damit der nächste
        // Aufruf sich eine frische holt, statt endlos mit einem toten Token zu fragen.
        if (res.statusCode === 401 || res.statusCode === 403) yahooSitz = { cookie: null, crumb: null, at: 0 };
        try { resolve(res.statusCode === 200 ? JSON.parse(d) : null); } catch (e) { resolve(null); }
      });
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}

/* Die eigentliche Paarung steht in drift.js als reine Funktion – dort ist sie ohne
 * Netz und ohne Electron prüfbar, und sie IST geprüft (Termin vor dem Quartalsende,
 * Termin zu weit danach, fehlende Überraschung, vertauschte Reihenfolge). Hier bleibt
 * nur das Auspacken der beiden Yahoo-Antworten. */
const Drift = require('./drift.js');

async function holeAktuell(sym) {
  const s = await holeSitz();
  if (!s.crumb) return null;
  const c = encodeURIComponent(s.crumb);
  const hist = await jsonGet('/v10/finance/quoteSummary/' + sym + '?modules=earningsHistory&crumb=' + c, s.cookie);
  const kal = await jsonGet('/v10/finance/quoteSummary/' + sym + '?modules=calendarEvents&crumb=' + c, s.cookie);
  try {
    const reihen = hist.quoteSummary.result[0].earningsHistory.history || [];
    const historie = reihen.map((q) => ({
      quartalsEndeMs: q.quarter && q.quarter.raw ? q.quarter.raw * 1000 : 0,
      ueberraschung: q.surprisePercent && q.surprisePercent.raw != null ? q.surprisePercent.raw * 100 : null,
      ist: q.epsActual && q.epsActual.raw,
      schaetzung: q.epsEstimate && q.epsEstimate.raw
    }));
    const cd = kal && kal.quoteSummary.result[0].calendarEvents.earnings.earningsCallDate;
    const terminMs = cd && cd.length
      ? (typeof cd[0] === 'number' ? cd[0] * 1000 : (cd[0].raw ? cd[0].raw * 1000 : Date.parse(cd[0].fmt || cd[0])))
      : 0;
    return Drift.paareAktuell(historie, terminMs);
  } catch (e) { return null; }
}

ipcMain.handle('earnings-fetch', async (_ev, symbol) => {
  const sym = String(symbol || '').toUpperCase().replace(/[^A-Z0-9.^-]/g, '').slice(0, 12);
  if (!sym) return { ok: false, body: 'Kein gültiges Kürzel' };
  const tief = await holeTermine(sym);
  const frisch = await holeAktuell(sym);
  if (!tief.ok && !frisch) return tief;
  return { ok: true, termine: tief.ok ? tief.termine : [], aktuell: frisch };
});
ipcMain.handle('app-version', async () => app.getVersion());
/* ================= Autostart mit Windows (minimiert im Tray) =================
 *
 * Der Haken sprang bisher nach dem Speichern wieder heraus. Ursache: Unter Windows
 * schreibt `setLoginItemSettings` mit `args: ['--hidden']` einen Registry-Eintrag der
 * Form `"…\App.exe" --hidden`. Beim Zurücklesen vergleicht Electron den gefundenen
 * Eintrag mit `path` und `args` — werden die beim LESEN nicht mitgegeben, passt der
 * Vergleich nicht und `openAtLogin` kommt als `false` zurück. Der Eintrag war die
 * ganze Zeit da, nur die Rückfrage stellte die falsche Frage.
 *
 * Deshalb: beide Richtungen mit denselben Optionen. Zusätzlich wird das Ergebnis
 * geprüft und ein Fehlschlag nach oben gemeldet, statt still zu scheitern.
 */
const AUTOSTART_OPT = { path: process.execPath, args: ['--hidden'] };

function autostartLesen() {
  // Erst mit den Optionen fragen, mit denen geschrieben wurde. Nur wenn das nichts
  // findet, die schlichte Abfrage – dann stammt der Eintrag aus einer älteren Fassung.
  try {
    if (app.getLoginItemSettings(AUTOSTART_OPT).openAtLogin) return true;
    return !!app.getLoginItemSettings().openAtLogin;
  } catch (e) { return false; }
}

ipcMain.handle('set-autostart', async (_ev, on) => {
  try {
    if (on) app.setLoginItemSettings(Object.assign({ openAtLogin: true }, AUTOSTART_OPT));
    else {
      // Beide Schreibweisen entfernen: die mit Argumenten und die alte ohne.
      app.setLoginItemSettings(Object.assign({ openAtLogin: false }, AUTOSTART_OPT));
      app.setLoginItemSettings({ openAtLogin: false });
    }
    const ist = autostartLesen();
    if (!!on !== ist) {
      return { ok: false, on: ist, msg: on
        ? 'Windows hat den Autostart-Eintrag nicht übernommen (fehlende Rechte oder eine Richtlinie?).'
        : 'Der Autostart-Eintrag ließ sich nicht entfernen.' };
    }
    return { ok: true, on: ist };
  } catch (e) { return { ok: false, on: autostartLesen(), msg: String(e.message || e) }; }
});
ipcMain.handle('get-autostart', async () => {
  try { return { ok: true, on: autostartLesen() }; } catch (e) { return { ok: false, on: false }; }
});
// Analyse-Export: schreibt Depot-Daten (OHNE Zugangsdaten) in den Downloads-Ordner,
// damit sie z. B. von Claude zur Auswertung gelesen werden können.
/* ================= Fehlermeldungen =================
 * Meldungen landen als JSON im selben Daten-Ordner, den auch der Analyse-Export nutzt.
 * Von dort liest sie ein geplanter Auftrag, bewertet sie und behebt, was sich beheben
 * lässt — und schreibt seinen Befund in dieselbe Datei zurück. Deshalb ist das Format
 * bewusst schlicht und in beide Richtungen beschreibbar.
 *
 * Bewusst KEINE Zugangsdaten und keine Kursdaten: Eine Fehlermeldung soll man
 * weitergeben können, ohne sie vorher durchsehen zu müssen.
 */
function bugDatei() {
  const dir = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, 'fehlermeldungen.json');
}
function bugsLesen() {
  try {
    const p = bugDatei();
    if (!fs.existsSync(p)) return { version: 1, meldungen: [] };
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (j && Array.isArray(j.meldungen)) return j;
    defektMerken('fehlermeldungen', defektBeiseite(p));
    return { version: 1, meldungen: [] };
  } catch (e) {
    // Sonst haette der naechste bug-report die unlesbare Datei durch eine mit
    // genau EINER Meldung ersetzt - alle frueheren waeren weg gewesen.
    try { defektMerken('fehlermeldungen', defektBeiseite(bugDatei())); } catch (e2) { /* Ordner nicht da */ }
    return { version: 1, meldungen: [] };
  }
}
ipcMain.handle('bug-list', async () => {
  const j = bugsLesen();
  return { ok: true, meldungen: j.meldungen, datei: bugDatei() };
});
ipcMain.handle('bug-report', async (_ev, m) => {
  try {
    const j = bugsLesen();
    const text = String((m && m.text) || '').trim().slice(0, 4000);
    if (!text) return { ok: false, msg: 'Bitte beschreiben, was passiert ist.' };
    const eintrag = {
      id: 'bug' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      gemeldet: new Date().toISOString(),
      art: ['funktion', 'kosmetik', 'zahlen', 'sonstiges'].indexOf(m && m.art) >= 0 ? m.art : 'sonstiges',
      schwere: ['stoert-kaum', 'aergerlich', 'blockiert'].indexOf(m && m.schwere) >= 0 ? m.schwere : 'aergerlich',
      bereich: String((m && m.bereich) || '').slice(0, 60),
      text: text,
      // Umgebung mitschicken, damit man nicht nachfragen muss
      umgebung: {
        version: app.getVersion(),
        plattform: process.platform,
        electron: process.versions.electron,
        fenster: (m && m.fenster) || null
      },
      // Automatisch mitgeschnittene Fehler des Programms, falls vorhanden
      fehlerprotokoll: Array.isArray(m && m.fehler) ? m.fehler.slice(-20) : [],
      status: 'offen',
      bewertung: null,
      erledigt: null,
      // Wann die Meldung das Projekt tatsaechlich erreicht hat. null heisst: liegt nur
      // hier. Genau daran ist der erste Tester haengengeblieben - drei Meldungen
      // geschrieben, eine kam an, zwei blieben im Browser-Tab stecken. Der Renderer
      // arbeitet alles mit null beim Start nach, sobald ein Sendeweg funktioniert.
      uebermittelt: null
    };
    j.meldungen.unshift(eintrag);
    if (j.meldungen.length > 300) j.meldungen.length = 300;
    schreibAtomar(bugDatei(), JSON.stringify(j, null, 1));
    return { ok: true, id: eintrag.id, datei: bugDatei() };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});
// Rueckkanal: der Renderer hat die Projekt-Issues gelesen und traegt hier den
// dortigen Stand in die lokale Liste ein. Nur die drei bekannten Status sind
// erlaubt, und was einmal behoben ist, bleibt behoben - der Abgleich kann den
// Status nur voranbringen, nie zuruecksetzen.
ipcMain.handle('bug-sync', async (_ev, updates) => {
  try {
    if (!Array.isArray(updates)) return { ok: false, msg: 'keine Liste' };
    const erlaubt = ['behoben', 'abgelehnt', 'geprueft'];
    const j = bugsLesen();
    let n = 0;
    for (const u of updates.slice(0, 100)) {
      if (!u || erlaubt.indexOf(u.status) < 0) continue;
      const m = j.meldungen.find((x) => x && x.id === u.id);
      if (!m || m.status === 'behoben' || m.status === 'abgelehnt') continue;
      m.status = u.status;
      m.bewertung = String(u.bewertung || '').slice(0, 300);
      m.erledigt = (u.status === 'behoben' || u.status === 'abgelehnt') ? new Date().toISOString() : null;
      n++;
    }
    if (n) schreibAtomar(bugDatei(), JSON.stringify(j, null, 1));
    return { ok: true, n };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});
// Vermerkt, dass eine Meldung beim Projekt angekommen ist - danach fasst der
// Nachversand sie nie wieder an. Ohne den Vermerk wuerde jeder Start dieselbe
// Meldung erneut als Issue anlegen.
ipcMain.handle('bug-mark-sent', async (_ev, id) => {
  try {
    const j = bugsLesen();
    const m = j.meldungen.find((x) => x && x.id === id);
    if (!m) return { ok: false, msg: 'Meldung nicht gefunden' };
    m.uebermittelt = new Date().toISOString();
    schreibAtomar(bugDatei(), JSON.stringify(j, null, 1));
    return { ok: true };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});

/* ================= Diagnose-Versand =================
 * Der Renderer stellt die Diagnose zusammen (weisse Liste, siehe diagnose.js), hier
 * liegt nur der Transport: ein GitHub-Issue im konfigurierten Repo.
 *
 * Das Sende-Token kommt aus einer optionalen telemetrie.json NEBEN den App-Dateien:
 *   { "repo": "Wilhelm-mbg/Stock-Dashboard", "token": "github_pat_..." }
 * Wilhelm legt sie vor dem Bauen in den Quellordner; sie wird mit verpackt. WICHTIG
 * beim Erzeugen des Tokens: feingranular, NUR dieses Repo, NUR Issues (Schreiben).
 * Ein Token im Client ist grundsaetzlich auslesbar - mit diesem Zuschnitt ist der
 * moegliche Schaden auf Issue-Spam im eigenen Repo begrenzt, und das Token laesst
 * sich jederzeit widerrufen. Ohne die Datei faellt die App auf den Browser-Weg
 * zurueck (vorausgefuelltes Issue, Nutzer schickt selbst ab).
 */
let TELEMETRIE = null;
/* Warum das Token (nicht) geladen wurde, wandert in die Diagnose selbst.
 * Anlass: Diagnose #3 kam trotz 8.23.0 über den Browser-Weg, und von außen war
 * nicht zu erkennen, warum – lokal lud dasselbe Paket einwandfrei. Statt zu raten,
 * erklärt sich die App ab jetzt selbst. Mehrere Kandidaten-Pfade, weil __dirname
 * je nach Verpackung unterschiedlich zeigen kann. */
let TELEMETRIE_GRUND = 'nicht geprüft';
try {
  const kandidaten = [path.join(__dirname, 'telemetrie.json')];
  try { if (process.resourcesPath) kandidaten.push(path.join(process.resourcesPath, 'app.asar', 'telemetrie.json')); } catch (e0) { }
  try { if (app.getAppPath) kandidaten.push(path.join(app.getAppPath(), 'telemetrie.json')); } catch (e1) { }
  let gefunden = null;
  for (const tp of kandidaten) {
    try { if (fs.existsSync(tp)) { gefunden = tp; break; } } catch (e2) { }
  }
  if (!gefunden) {
    TELEMETRIE_GRUND = 'telemetrie.json nicht gefunden (' + kandidaten.map((k) => k.split(/[\\/]/).slice(-3).join('/')).join(' | ') + ')';
  } else {
    const t = JSON.parse(fs.readFileSync(gefunden, 'utf8'));
    // repo muss "besitzer/name" sein – geprüft ohne Regex, die hat sich beim
    // Patchen schon einmal still zerlegt
    const teile = String(t && t.repo || '').split('/');
    const repoOk = teile.length === 2 && teile.every((x) => x.length > 0 && /^[\w.-]+$/.test(x));
    if (t && repoOk && typeof t.token === 'string' && t.token.length > 20) {
      TELEMETRIE = t;
      TELEMETRIE_GRUND = 'ok';
    } else {
      TELEMETRIE_GRUND = 'telemetrie.json gefunden, aber ungültig (repo ' + (repoOk ? 'ok' : 'fehlerhaft') + ', tokenLen ' + String(t && t.token ? t.token.length : 0) + ')';
    }
  }
} catch (e) { TELEMETRIE_GRUND = 'Fehler beim Laden: ' + String(e.message || e); }

ipcMain.handle('diagnose-config', async () => ({
  auto: !!TELEMETRIE,
  repo: TELEMETRIE ? TELEMETRIE.repo : 'Wilhelm-mbg/Stock-Dashboard',
  grund: TELEMETRIE_GRUND
}));

ipcMain.handle('diagnose-send', async (_ev, titel, body, label) => {
  if (!TELEMETRIE) return { ok: false, msg: 'Kein Sende-Token in diesem Build.' };
  const daten = JSON.stringify({
    title: String(titel || 'Diagnose').slice(0, 200),
    body: String(body || '').slice(0, 60000),
    // Label aus weisser Liste - der Renderer darf waehlen, aber nichts erfinden
    labels: [['diagnose', 'bug'].indexOf(label) >= 0 ? label : 'diagnose']
  });
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: '/repos/' + TELEMETRIE.repo + '/issues',
      method: 'POST',
      headers: {
        'User-Agent': 'Markt-Dashboard-Diagnose',
        'Accept': 'application/vnd.github+json',
        'Authorization': 'Bearer ' + TELEMETRIE.token,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(daten)
      },
      timeout: 20000
    }, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { d += c; if (d.length > 1e6) req.destroy(); });
      res.on('end', () => {
        if (res.statusCode === 201) {
          try { resolve({ ok: true, url: JSON.parse(d).html_url }); } catch (e) { resolve({ ok: true }); }
        } else resolve({ ok: false, msg: 'HTTP ' + res.statusCode });
      });
    });
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, msg: 'Timeout' }); });
    req.on('error', (e) => resolve({ ok: false, msg: String(e.message || e) }));
    req.write(daten);
    req.end();
  });
});

// Auto-Tuning: von Claude geschriebene Empfehlung aus dem Daten-Ordner lesen
ipcMain.handle('read-recommendation', async () => {
  try {
    const p = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', 'empfehlung.json');
    if (!fs.existsSync(p)) return { ok: false };
    return { ok: true, body: fs.readFileSync(p, 'utf8'), mtime: fs.statSync(p).mtimeMs };
  } catch (e) { return { ok: false, msg: String(e.message || e) }; }
});
/* Spekulations-Radar: Eine geplante Claude-Aufgabe durchsucht oeffentliche Quellen
 * nach Marktspekulationen und schreibt sie in den Daten-Ordner - die App ZEIGT sie
 * nur an (Dashboard-Karte), gehandelt wird davon nichts. Groessenkappe als Schutz
 * gegen eine ausufernde oder kaputte Datei. */
/* Gemeinschafts-Ablage (Wunsch #44): Die geplante Suche laeuft nur auf EINEM Rechner
 * und schrieb bisher nur dorthin - alle anderen Installationen sahen ein leeres Radar.
 * Dieselbe Aufgabe legt die Datei jetzt zusaetzlich im Zweig "radar" des Projekts ab,
 * und jede App liest von dort. Die URL steht FEST im Code (kein Umweg ueber die
 * allgemeine Abruf-Weissliste), gelesen wird nur - die App schreibt nie ins Netz.
 * Der frischere von beiden Staenden gewinnt: auf Wilhelms Rechner also die lokale
 * Datei, bei allen anderen die aus dem Netz. */
const SPEK_URL = 'https://raw.githubusercontent.com/Wilhelm-mbg/Stock-Dashboard/radar/spekulationen.json';
/* Insider-Karte (23.08.2026): dieselbe Mechanik, andere Datei. Meldepflichtige
 * Eigengeschaefte von Vorstand und Aufsichtsrat US-notierter Firmen (SEC Form 4),
 * geholt von tools/insider-holen.js. Auch das ist reine Anzeige. */
const INSIDER_URL = 'https://raw.githubusercontent.com/Wilhelm-mbg/Stock-Dashboard/radar/insider.json';
const ablageCache = {};   // je Adresse ein eigener 5-Minuten-Puffer
function holeAblageNetz(url) {
  // 5-Minuten-Cache: die Karte fragt alle 10 Minuten, die Suche schreibt stuendlich
  const c = ablageCache[url];
  if (c && c.body != null && Date.now() - c.at < 5 * 60000) return Promise.resolve(c.body);
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Markt-Dashboard', 'Accept': 'application/json' }, timeout: 8000 }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return resolve(null); }
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (stueck) => { d += stueck; if (d.length > 300000) { req.destroy(); resolve(null); } });
      res.on('end', () => { ablageCache[url] = { at: Date.now(), body: d }; resolve(d); });
    });
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.on('error', () => resolve(null));
  });
}
// Zeitstempel aus dem Feld "stand" ziehen - nur so sind lokal und Netz vergleichbar
function spekStand(body, ersatz) {
  try { const t = Date.parse(JSON.parse(body).stand || ''); return isNaN(t) ? ersatz : t; }
  catch (e) { return NaN; }   // kaputtes JSON scheidet aus dem Vergleich aus
}
/* Eine Ablage lesen: erst die lokale Datei, sonst die Gemeinschafts-Ablage im Netz.
 * Radar und Insider teilen sich diesen Weg - zwei Kopien davon waeren mit der Zeit
 * auseinandergelaufen. */
async function ablageLesen(datei, url) {
  let lokal = null;
  try {
    const p = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', datei);
    if (fs.existsSync(p)) {
      const st = fs.statSync(p);
      if (st.size > 300000) { /* ausufernde Datei: gar nicht erst anfassen */ }
      else {
        const body = fs.readFileSync(p, 'utf8');
        const t = spekStand(body, st.mtimeMs);
        if (!isNaN(t)) lokal = { ok: true, body: body, mtime: t, quelle: 'lokal' };
      }
    }
  } catch (e) { /* lokale Datei fehlt oder ist unlesbar: dann eben das Netz */ }
  // Ist die eigene Datei frisch, sparen wir uns den Abruf komplett
  if (lokal && Date.now() - lokal.mtime < 90 * 60000) return lokal;
  let netz = null;
  try {
    const body = await holeAblageNetz(url);
    if (body) { const t = spekStand(body, NaN); if (!isNaN(t)) netz = { ok: true, body: body, mtime: t, quelle: 'netz' }; }
  } catch (e) { /* offline: dann bleibt es beim lokalen Stand */ }
  if (netz && (!lokal || netz.mtime > lokal.mtime)) return netz;
  return lokal || { ok: false };
}
ipcMain.handle('read-spekulationen', async () => ablageLesen('spekulationen.json', SPEK_URL));

/* ---- Messmaschine: Protokolle lesen (nur lesen - die App urteilt nie selbst) ----
 * Ordner: <Downloads>/Markt-Dashboard-Daten/protokolle/<key>-<datum>.json
 * Jedes Protokoll traegt seinen vollstaendigen Entscheidungsweg. Groessenkappe wie
 * bei den anderen Ablagen: eine ausufernde Datei wird nicht angefasst. */
ipcMain.handle('read-protokolle', async () => {
  try {
    const dir = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', 'protokolle');
    if (!fs.existsSync(dir)) return { ok: true, protokolle: [], ordner: dir };
    const out = [];
    fs.readdirSync(dir).filter((f) => /^[\w.-]+\.json$/.test(f)).forEach((f) => {
      try {
        const p = path.join(dir, f), st = fs.statSync(p);
        if (st.size > 2000000) return;
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (j && j.strategie && Array.isArray(j.urteile)) out.push({ datei: f, mtime: st.mtimeMs, protokoll: j });
      } catch (e) { /* eine kaputte Datei darf die Liste nicht kippen */ }
    });
    return { ok: true, protokolle: out, ordner: dir };
  } catch (e) { return { ok: false, grund: String(e && e.message || e) }; }
});
/* ---- Messmaschine: neue Strategie ablegen ----
 * Schreibt NUR in <Downloads>/Markt-Dashboard-Daten/strategien/, nur .js, nur mit
 * sicherem Dateinamen. Gemessen wird sie danach von der Maschine - seit 8.26.0 auch
 * auf Knopfdruck (mess-lauf, weiter unten). Das Urteil kommt trotzdem nicht aus der
 * App: es rechnet dieselbe Maschine in einem eigenen Prozess, mit denselben Regeln
 * und derselben Verweigerung. Bequemer ist der Weg dorthin, nicht das Urteil. */
ipcMain.handle('write-strategie', async (_ev, key, quelltext) => {
  try {
    if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(String(key || ''))) return { ok: false, grund: 'Kennung: nur Kleinbuchstaben, Ziffern, Bindestrich (2-41 Zeichen).' };
    if (typeof quelltext !== 'string' || quelltext.length > 200000) return { ok: false, grund: 'Quelltext fehlt oder ist zu gross.' };
    const dir = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', 'strategien');
    fs.mkdirSync(dir, { recursive: true });
    const p = path.join(dir, key + '.js');
    if (fs.existsSync(p)) return { ok: false, grund: 'Es gibt schon eine Strategie mit dieser Kennung. Eine neue Fassung braucht eine neue Kennung - sonst verschwindet das alte Protokoll unter einem geaenderten Text.' };
    fs.writeFileSync(p, quelltext, 'utf8');
    return { ok: true, pfad: p };
  } catch (e) { return { ok: false, grund: String(e && e.message || e) }; }
});
/* ---- Messmaschine aus der App starten ----
 * Bis 8.26.0 endete der Reiter "Messung" in einer Sackgasse: Die App legte die
 * Strategie ab und nannte einen Node-Befehl fuer einen Ordner, der im Installer gar
 * nicht enthalten war. Wer keine Entwicklungsumgebung hat, kam nie zu einem Urteil.
 *
 * Der Ordner wird jetzt mitgeliefert (package.json: files + asarUnpack), und die
 * Maschine laeuft in einem EIGENEN Prozess mit Electrons eingebautem Node
 * (ELECTRON_RUN_AS_NODE). Der Nutzer braucht also kein installiertes Node.
 *
 * WARUM EIN EIGENER PROZESS und nicht einfach require(): Die Messung rechnet
 * minutenlang durch Zehntausende Kerzen. Im Hauptprozess wuerde sie das Fenster
 * einfrieren. Und sie laedt eine Strategiedatei per require - fremden Code also.
 * Im eigenen Prozess kann der die App nicht anhalten, und ein Absturz dort ist ein
 * Fehlschlag der Messung, kein Absturz des Programms.
 *
 * DAS HIER IST KEIN KANAL FUER BELIEBIGEN CODE. Drei Riegel:
 *   1. Der Renderer uebergibt nur eine KENNUNG, nie einen Pfad. Dasselbe Muster wie
 *      write-strategie: Kleinbuchstaben, Ziffern, Bindestrich.
 *   2. Der Ordner steht fest (Downloads/Markt-Dashboard-Daten/strategien) und wird
 *      nach dem Zusammensetzen noch einmal geprueft - ein Name, der daraus
 *      herausfuehrt, fliegt raus, auch wenn das Muster ihn durchgelassen haette.
 *   3. Das Skript ist fest verdrahtet und kommt aus dem Programmordner, nie aus einer
 *      Angabe des Renderers. Keine Shell, kein spawn mit Zeichenkette.
 * Dass die Strategiedatei selbst Code ist, bleibt: sie ist der Zweck der Sache. Aber
 * sie liegt im Datenordner des Nutzers, den er selbst befuellt - das ist dieselbe
 * Vertrauensgrenze wie bei einem Dokument, das man doppelklickt. */
const MESS_LAUF = { proc: null, key: null, start: 0, abbruch: false };
function entpackt(p) {
  /* Im Paket liegt ein per asarUnpack ausgenommener Pfad ENTPACKT neben der asar-Datei.
   * Ausserhalb des Pakets (Entwicklung) kommt 'app.asar' im Pfad gar nicht vor - dann
   * bleibt der Pfad, wie er ist.
   *
   * ZWEI Faelle, und der erste Wurf hatte nur einen: Ein Pfad IN das Archiv hinein
   * ('...\app.asar\studien\...') enthaelt 'app.asar' plus Trenner. __dirname selbst
   * ENDET aber auf 'app.asar', ohne Trenner dahinter - dort fand das blosse replace
   * nichts, gab den Archivpfad unveraendert zurueck, und quellOrdner() waere stumm
   * beim asar-Pfad geblieben. Genau die Abhaengigkeit, die es aufloesen soll. */
  var mitte = 'app.asar' + path.sep;
  if (p.indexOf(mitte) !== -1) return p.replace(mitte, 'app.asar.unpacked' + path.sep);
  if (p.slice(-('app.asar'.length + 1)) === path.sep + 'app.asar') return p + '.unpacked';
  return p;
}
function messmaschinePfad() {
  /* Aus dem Archiv heraus liesse sich das Skript nicht als eigener Prozess starten -
   * fork() braucht eine echte Datei. app.asar.unpacked ist der Ort dafuer. */
  const drin = path.join(__dirname, 'studien', 'messmaschine', 'messen.js');
  const aus = entpackt(drin);
  return fs.existsSync(aus) ? aus : drin;
}
function quellOrdner() {
  /* Woher die Strategie ihr quant.js laedt (STOCK_DASHBOARD_QUELLE).
   *
   * Der naheliegende Wert waere __dirname - im Paket also der Ordner IM asar-Archiv.
   * Das haenge ich nicht an die Frage, ob Electrons asar-Schicht auch im Kindprozess
   * mit ELECTRON_RUN_AS_NODE noch aktiv ist: kann ich hier nicht pruefen, und wenn
   * sie es nicht ist, scheitert jede Messung im Installer mit "Cannot find module".
   * quant.js ist deshalb mit entpackt (package.json/asarUnpack) und wird von dort
   * geladen, wenn es dort liegt. Damit braucht der Kindprozess KEINE asar-Schicht.
   * In der Entwicklung ist das unveraendert der Projektordner. */
  const aus = entpackt(__dirname);
  return fs.existsSync(path.join(aus, 'quant.js')) ? aus : __dirname;
}
ipcMain.handle('mess-strategien', async () => {
  try {
    const dir = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', 'strategien');
    if (!fs.existsSync(dir)) return { ok: true, liste: [], ordner: dir };
    const liste = fs.readdirSync(dir)
      .filter((f) => /^[a-z0-9][a-z0-9-]{1,40}\.js$/.test(f))
      .map((f) => {
        const st = fs.statSync(path.join(dir, f));
        return { key: f.slice(0, -3), datei: f, groesse: st.size, stand: st.mtimeMs };
      })
      .sort((a, b) => b.stand - a.stand);
    return { ok: true, liste: liste, ordner: dir, maschine: fs.existsSync(messmaschinePfad()) };
  } catch (e) { return { ok: false, grund: String(e && e.message || e) }; }
});
ipcMain.handle('mess-lauf', async (ev, key) => {
  if (MESS_LAUF.proc) return { ok: false, grund: 'Es läuft schon eine Messung (' + MESS_LAUF.key + ').' };
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(String(key || ''))) return { ok: false, grund: 'Kennung: nur Kleinbuchstaben, Ziffern, Bindestrich.' };
  const dir = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', 'strategien');
  const datei = path.join(dir, key + '.js');
  // Riegel 2: nach dem Zusammensetzen noch einmal pruefen, nicht nur das Muster davor
  if (path.dirname(path.resolve(datei)) !== path.resolve(dir)) return { ok: false, grund: 'Ungültiger Pfad.' };
  if (!fs.existsSync(datei)) return { ok: false, grund: 'Diese Strategie liegt nicht im Datenordner.' };
  const skript = messmaschinePfad();
  if (!fs.existsSync(skript)) {
    return { ok: false, grund: 'Die Messmaschine ist in dieser Installation nicht enthalten. ' +
      'Aus dem Projektordner geht es weiterhin von Hand: node studien/messmaschine/messen.js "' + datei + '"' };
  }
  const protokolle = path.join(app.getPath('downloads'), 'Markt-Dashboard-Daten', 'protokolle');
  return await new Promise((fertig) => {
    let raus = '';
    const kind = fork(skript, [datei], {
      silent: true,
      env: Object.assign({}, process.env, {
        ELECTRON_RUN_AS_NODE: '1',
        MESSMASCHINE_PROTOKOLLE: protokolle,
        STOCK_DASHBOARD_QUELLE: quellOrdner()
      })
    });
    MESS_LAUF.proc = kind; MESS_LAUF.key = key; MESS_LAUF.start = Date.now(); MESS_LAUF.abbruch = false;
    function melde(txt) {
      raus += txt;
      // Ungebremst waere das bei einer langen Messung ein Trommelfeuer an Ereignissen;
      // zeilenweise reicht, und der Renderer haengt sie einfach an.
      try { if (!ev.sender.isDestroyed()) ev.sender.send('mess-fortschritt', { key: key, text: txt }); } catch (e) { /* Fenster zu */ }
    }
    kind.stdout.on('data', (d) => melde(String(d)));
    kind.stderr.on('data', (d) => melde(String(d)));
    kind.on('error', (e) => { MESS_LAUF.proc = null; fertig({ ok: false, grund: String(e.message || e), ausgabe: raus }); });
    kind.on('close', (code) => {
      const dauer = Date.now() - MESS_LAUF.start;
      const abgebrochen = MESS_LAUF.abbruch;
      MESS_LAUF.proc = null; MESS_LAUF.key = null; MESS_LAUF.abbruch = false;
      /* Rueckgabe 3 heisst VERWEIGERT - das ist kein Fehler, sondern ein Urteil der
       * Maschine ("Strategie ohne Begruendung"). Es muss anders aussehen als ein Absturz.
       * Und ein Abbruch ist ueberhaupt kein Befund: kill() beendet den Prozess per Signal,
       * code ist dann null. Ohne dieses Merkmal las der Reiter das als Fehlschlag und
       * zeigte "Rueckgabewert null" - fuer etwas, das der Nutzer selbst ausgeloest hat. */
      fertig({ ok: code === 0, verweigert: code === 3, abgebrochen: abgebrochen,
               code: code, dauerMs: dauer, ausgabe: raus });
    });
  });
});
ipcMain.handle('mess-abbrechen', async () => {
  if (!MESS_LAUF.proc) return { ok: false, grund: 'Es läuft keine Messung.' };
  MESS_LAUF.abbruch = true;
  try { MESS_LAUF.proc.kill(); } catch (e) { /* schon vorbei */ }
  return { ok: true };
});

ipcMain.handle('read-insider', async () => ablageLesen('insider.json', INSIDER_URL));
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

/* Eine unlesbare Datei darf NIE stillschweigend durch eine leere ersetzt werden.
 * Genau das passierte bisher zweimal: ein defektes bars_*.json machte aus Wochen
 * gesammelter Kurse eine leere Reihe, die der naechste Flush endgueltig festschrieb -
 * und Yahoo liefert 1m-Kerzen nur 7 Tage rueckwirkend, das ist also unwiederbringlich.
 * Dasselbe galt fuer fehlermeldungen.json. Darum wird der kaputte Bestand vor dem
 * ersten Ueberschreiben einmal zur Seite gelegt. Bewusst NICHT rotierend: die
 * aelteste beiseitegelegte Fassung ist die, die noch echte Daten traegt, und sie
 * darf von einem zweiten Fehlschlag nicht verdraengt werden. */
function defektBeiseite(pfad) {
  try {
    if (!fs.existsSync(pfad)) return null;
    const ziel = pfad + '.defekt';
    if (fs.existsSync(ziel)) return ziel;
    fs.renameSync(pfad, ziel);
    return ziel;
  } catch (e) { return null; }
}
/* Was in dieser Sitzung unlesbar war. Der Renderer holt die Liste beim Start und
 * zeigt sie im Warnband - ein Datenverlust, den niemand bemerkt, ist der teuerste. */
const defekteDateien = [];
function defektMerken(was, pfad) {
  if (defekteDateien.some((d) => d.was === was)) return;
  defekteDateien.push({ was: was, datei: pfad || null, zeit: new Date().toISOString() });
  if (defekteDateien.length > 50) defekteDateien.shift();
}
ipcMain.handle('store-defekte', async () => ({ ok: true, liste: defekteDateien.slice() }));

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
/* Sicherungsgenerationen fuer das Depot: Die eine Datei traegt Monate an Messbasis
 * (Trade-Protokoll, Schattenbuch, Geduld-Bilanz). Vorher machte EIN unlesbares
 * depot.json daraus kommentarlos ein frisches 10.000-$-Depot - und der naechste
 * save() ueberschrieb die kaputte Datei endgueltig. Jetzt: vor dem Schreiben
 * hoechstens alle 10 Minuten .bak1 -> .bak2 rotieren, beim Lesen im Fehlerfall
 * die Generationen versuchen und den Fund MARKIEREN statt still null zu liefern. */
const SICHERUNG_STORES = { depot: true };
const sicherungZuletzt = {};
function sicherungRotieren(f, name) {
  if (!SICHERUNG_STORES[name] || !fs.existsSync(f)) return;
  const jetzt = Date.now();
  if (sicherungZuletzt[name] && jetzt - sicherungZuletzt[name] < 10 * 60000) return;
  try {
    if (fs.existsSync(f + '.bak1')) fs.copyFileSync(f + '.bak1', f + '.bak2');
    fs.copyFileSync(f, f + '.bak1');
    sicherungZuletzt[name] = jetzt;
  } catch (e) { /* Sicherung darf das Speichern nie verhindern */ }
}
ipcMain.handle('store-get', async (_ev, name) => {
  const f = path.join(storeDir(), safeName(name) + '.json');
  try {
    if (!fs.existsSync(f)) return null;
    return geheimnisseWandeln(name, JSON.parse(fs.readFileSync(f, 'utf8')), dechiffrieren);
  } catch (e) {
    // Hauptdatei kaputt: Generationen versuchen, Fund markieren. Der Renderer
    // zeigt die Markierung an und entfernt sie vor dem naechsten Speichern.
    if (SICHERUNG_STORES[name]) {
      for (const gen of ['.bak1', '.bak2']) {
        try {
          if (!fs.existsSync(f + gen)) continue;
          const w = JSON.parse(fs.readFileSync(f + gen, 'utf8'));
          if (w && typeof w === 'object') w.__ausSicherung = gen;
          return geheimnisseWandeln(name, w, dechiffrieren);
        } catch (e2) { /* naechste Generation */ }
      }
    }
    // Kein brauchbarer Stand: die unlesbare Datei aus dem Weg raeumen, BEVOR der
    // naechste storeSet sie ueberschreibt. Danach ist der Start sauber (die Datei
    // fehlt schlicht), die Bytes bleiben aber fuer eine Rettung von Hand liegen.
    defektMerken(safeName(name), defektBeiseite(f));
    return null;
  }
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
    sicherungRotieren(f, safeName(name));
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
  /* Nur die eigene Startseite. Vorher stand hier "alles ausser file:// verbieten" - also
   * war JEDE lokale Adresse erlaubt. Ein Fenster, das dorthin navigiert, bekommt die
   * vollstaendige preload-Bruecke mit: Depot lesen und schreiben, Dateien im Datenordner
   * anlegen, die Messmaschine starten. Eine beliebige HTML-Datei auf der Platte (etwas
   * Heruntergeladenes genuegt) haette damit die Rechte der App gehabt.
   * Die App navigiert nirgendwohin - sie ist eine einzige Seite, und im ganzen Quelltext
   * steht kein location.href, kein location.reload und kein window.open. Diese Sperre
   * nimmt also nichts weg, sie schliesst nur eine Tuer, die niemand benutzt. */
  const startseite = pathToFileURL(path.join(__dirname, 'index.html')).href;
  win.webContents.on('will-navigate', (ev, ziel) => {
    if (ziel.startsWith('https://')) { ev.preventDefault(); shell.openExternal(ziel); return; }
    if (String(ziel).split('#')[0].split('?')[0] !== startseite) ev.preventDefault();
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
