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
  'fc.yahoo.com', // nur fuer das Cookie, das Yahoos Kalender-Endpunkt verlangt
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
    return j && Array.isArray(j.meldungen) ? j : { version: 1, meldungen: [] };
  } catch (e) { return { version: 1, meldungen: [] }; }
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
