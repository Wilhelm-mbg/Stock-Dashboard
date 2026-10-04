'use strict';
/* ================= Textauszug aus einer ISOLIERTEN Instanz (nur lesen) =================
 *
 * Auftrag Nr. 73 (04.10.2026), Rest aus Nr. 71: die UI-Probe belegt, dass die App
 * startet und schaltet - sie gibt aber keinen Text aus. Dieses Skript liest, was die
 * laufende Instanz WIRKLICH zeigt: den Kapitulations-Haken samt Kennzeichnung, den
 * Regelkopf, den Klartext, die Ausloeser-Auswahl, die Karte "Kurzfristig · Intraday"
 * und die Massstab-Texte (Kopf, Buch-Karten, Buecher-Verlauf, Benchmark).
 *
 * ISOLATION wie tools/ui-probe.js: eigenes Profil unter %TEMP%, Kunstdaten aus
 * tools/kunstinstanz.js. Die installierte App und ihr Datenordner werden nie beruehrt.
 * GEKLICKT werden nur Reiter, Pillen, die zwei Start-Dialoge (#erststartOk,
 * #diagNein) und - seit Auftrag Nr. 81 - der Erklaerknopf (i) der Karte "Kurzfristig ·
 * Intraday" (oeffnet nur das Erklaerfenster) - kein Knopf, der holt, rechnet, handelt
 * oder sendet.
 *
 * Aufruf (aus der Repo-Wurzel):
 *   .\node_modules\.bin\electron.cmd tools\ui-auszug.js [--kapi-ohne-merker] [--protokolle]
 *                                                       [--aus <datei.json>] [--bild <datei.png>]
 * --kapi-ohne-merker  saet einen Bestand mit kapiZusatz: true OHNE den Merker der
 *                     Sicherung - der Auszug zeigt dann auch ihren Journal-Eintrag.
 * --protokolle        legt zwei ECHTE Messprotokolle aus dem Repo (kapitulation und
 *                     rsi2seit vom 26.08.2026) in den Test-Datenordner dieser Instanz -
 *                     das Scoreboard zeigt dann den Kopf ueber dem wirklichen alten
 *                     Protokoll (Auftrag Nr. 81), nicht ueber einem erfundenen.
 * --bild              legt eine Aufnahme der Kopfzeile bei 1024 px Breite ab.
 *
 * Seit Nr. 81 liest der Auszug ausserdem: Kartentext und Belege hinter dem i der Karte
 * "Kurzfristig · Intraday", die Zeilen unter dem Buecher-Verlauf (#buecherMassstab), die
 * Zeile am Momentum-Buch und - bei 1024 px Fensterbreite - wie die Kopfzeile umbricht.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-ui-auszug-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

const origLoadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (fp, opts) {
  if (!path.isAbsolute(fp)) fp = path.join(WURZEL, fp);
  return origLoadFile.call(this, fp, opts);
};

require(path.join(__dirname, 'kunstinstanz.js')).saeen(TESTROOT);
const KAPI = process.argv.indexOf('--kapi-ohne-merker') !== -1;
if (KAPI) {
  /* Nur die Kunstdatei im Temp-Profil dieser Instanz wird umgeschrieben. */
  const dp = path.join(TESTROOT, 'userdata', 'store', 'depot.json');
  const d = JSON.parse(fs.readFileSync(dp, 'utf8'));
  d.intraday.kapiZusatz = true;
  delete d.kapitulationNeumessungGeprueft;
  fs.writeFileSync(dp, JSON.stringify(d));
}
const PROT = process.argv.indexOf('--protokolle') !== -1;
if (PROT) {
  /* Kopien zweier Repo-Dateien, geschrieben NUR in den Test-Datenordner unter %TEMP%. */
  const pd = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten', 'protokolle');
  fs.mkdirSync(pd, { recursive: true });
  ['kapitulation-2026-08-26.json', 'rsi2seit-2026-08-26.json'].forEach((f) => {
    fs.copyFileSync(path.join(WURZEL, 'studien', 'messmaschine', 'protokolle', f), path.join(pd, f));
  });
}
const ausIdx = process.argv.indexOf('--aus');
const AUS = ausIdx !== -1 ? process.argv[ausIdx + 1] : null;
const bildIdx = process.argv.indexOf('--bild');
const BILD = bildIdx !== -1 ? process.argv[bildIdx + 1] : null;

const LESEN = "(function () {" +
  "function el(id) { return document.getElementById(id); }" +
  "function txt(id) { var e = el(id); return e ? String(e.innerText || e.textContent || '').replace(/\\s+/g, ' ').trim() : null; }" +
  "var haken = el('idKapiZusatz'), reg = el('idRegime'), trig = el('idTrigger'), ck = el('ckBooks');" +
  "var karte = null;" +
  "Array.prototype.forEach.call(document.querySelectorAll('#sub-regeln *'), function (e) {" +
  "  var t = e.innerText || ''; if (t.indexOf('Kurzfristig · Intraday') !== -1 && (!karte || t.length < karte.length) && t.length > 60) karte = t; });" +
  "var D = window.__D ? window.__D() : null;" +
  "return {" +
  "  idKapiZusatzChecked: haken ? haken.checked : null," +
  "  idKapiKennung: txt('idKapiKennung')," +
  "  hakenTitel: haken ? (haken.title || (haken.closest('label') || {}).title || null) : null," +
  "  idRegimeChecked: reg ? reg.checked : null," +
  "  idKlartext: txt('idKlartext')," +
  "  regelKopf: txt('regelKopf')," +
  "  idTriggerOptionen: trig ? Array.prototype.map.call(trig.querySelectorAll('optgroup, option'), function (o) {" +
  "    return o.tagName === 'OPTGROUP' ? '[' + o.label + ']' : (o.selected ? '* ' : '  ') + o.textContent.trim(); }) : null," +
  "  karteKurzfristIntraday: karte ? karte.replace(/\\s+/g, ' ').trim() : null," +
  "  kopfBuecher: ck ? ck.textContent : null," +
  "  kopfBuecherTitel: ck ? ck.title : null," +
  "  buchMomentumKopf: txt('buchMomentumKopf')," +
  "  buchDriftKopf: txt('buchDriftKopf')," +
  "  buchIntradayKopf: txt('buchIntradayKopf')," +
  "  buecherLegende: txt('buecherLegende')," +
  "  buecherMassstab: txt('buecherMassstab')," +
  "  antwortHandelt: txt('antwortHandelt')," +
  "  scoreboardUeberholt: (function () { var s = el('scoreboard'); if (!s) return null; var raus = [];" +
  "    Array.prototype.forEach.call(s.querySelectorAll('tr'), function (tr, i, alle) {" +
  "      var t = String(tr.innerText || tr.textContent || '').replace(/\\s+/g, ' ').trim();" +
  "      if (t.indexOf('Überholt durch') === 0) { raus.push(t);" +
  "        if (alle[i + 1]) raus.push(String(alle[i + 1].innerText || alle[i + 1].textContent || '').replace(/\\s+/g, ' ').trim()); } });" +
  "    return raus; })()," +
  "  scoreboardZeilen: (function () { var s = el('scoreboard'); return s ? Array.prototype.map.call(s.querySelectorAll('tr.sbRow'), function (tr) {" +
  "    return String(tr.innerText || tr.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 90); }) : null; })()," +
  "  strategienListeKapitulation: (function () { var s = el('strategienListe'), r = null; if (!s) return null;" +
  "    Array.prototype.forEach.call(s.querySelectorAll('tr'), function (tr) {" +
  "      var t = String(tr.innerText || tr.textContent || '').replace(/\\s+/g, ' ').trim(); if (t.indexOf('kapitulation') === 0) r = t; });" +
  "    return r; })()," +
  "  benchInfo: txt('benchInfo')," +
  "  benchLegend: txt('benchLegend')," +
  "  depotStats: txt('depotStats')," +
  "  empfehlungenTitel: (function () { var e = el('idAutoTune'); var l = e && e.closest('label'); return e ? (e.title || (l && l.title) || null) : null; })()," +
  "  journalSicherung: D && D.tuneLog ? D.tuneLog.filter(function (e) { return e.quelle === 'sicherung'; }).map(function (e) {" +
  "    return { applied: e.applied, txt: e.txt }; }) : null," +
  "  merker: D ? D.kapitulationNeumessungGeprueft : null," +
  "  kapiZusatzImBestand: D && D.intraday ? D.intraday.kapiZusatz : null," +
  "  modus: D && D.intraday ? D.intraday.mode : null" +
  "}; })()";

setTimeout(() => { console.error('UI-Auszug: Zeitlimit (120 s) erreicht.'); app.exit(2); }, 120000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    const js = (code) => win.webContents.executeJavaScript(code, true);
    const warte = (ms) => new Promise((r) => setTimeout(r, ms));
    const klick = (sel) => js("(function () { var e = document.querySelector('" + sel + "'); if (e) e.click(); return !!e; })()");
    try {
      await warte(7000);
      win.setContentSize(1280, 820);
      await klick('#erststartOk');
      await klick('#diagNein');
      /* Der Erststart-Dialog wartet auf das Ende der Diagnose-Frage und oeffnet sich
       * bis zu eine Sekunde DANACH (erststart.js) - der Klick davor traf ihn nie, und er
       * lag bis Nr. 81 ueber dem ganzen Auszug (fuer den Text gleichgueltig, fuer die
       * Aufnahme der Kopfzeile nicht). */
      await warte(1600);
      await klick('#erststartOk');
      await warte(400);
      /* Jede Flaeche einmal oeffnen, damit ihr Renderer geschrieben hat. */
      const wege = [['dashboard', null], ['strategien', 'einstellungen'], ['strategien', 'regeln'],
        ['werkzeuge', 'betrieb'], ['dashboard', null]];
      for (const w of wege) {
        await klick('nav.tabs button[data-tab="' + w[0] + '"]');
        await warte(600);
        if (w[1]) { await klick('#tab-' + w[0] + ' .pills button[data-sub="' + w[1] + '"]'); await warte(900); }
      }
      /* Die Benchmark-Zeile holt Indexdaten; ohne Netz bleibt sie beim Ladehinweis. */
      await js("(function () { if (window.__renderAnalytics) window.__renderAnalytics(); return 1; })()");
      await warte(6000);
      const erg = await js(LESEN);
      erg.variante = (KAPI ? 'kapiZusatz: true ohne Merker' : 'Kunstbestand unveraendert') + (PROT ? ' + zwei echte Protokolle vom 26.08.2026' : '');
      /* ---- Nr. 81: die Karte "Kurzfristig · Intraday" samt den Belegen hinter dem i ----
       * Bis hierher nahm der Auszug das KLEINSTE Element mit der Ueberschrift - das war
       * der Kartenkopf. Jetzt: die Karte (.panel) ganz, dann ihr Erklaerknopf. */
      await klick('nav.tabs button[data-tab="strategien"]');
      await warte(600);
      await klick('#tab-strategien .pills button[data-sub="regeln"]');
      await warte(900);
      const KARTE = "(function () { var p = null;" +
        "Array.prototype.forEach.call(document.querySelectorAll('#sub-regeln .panel'), function (e) {" +
        "  var s = e.querySelector('span'); if (s && s.textContent.trim() === 'Kurzfristig · Intraday') p = e; });" +
        "return p; })()";
      erg.karteKurzfristIntraday = await js("(function () { var p = " + KARTE + "; return p ? String(p.innerText || '').replace(/\\s+/g, ' ').trim() : null; })()");
      const iDa = await js("(function () { var p = " + KARTE + "; var i = p && p.querySelector('button.info'); if (i) i.click(); return !!i; })()");
      await warte(500);
      erg.karteBelegeHinterDemI = iDa
        ? await js("(function () { var k = document.getElementById('infoPop'); return k ? String(k.innerText || '').replace(/\\s+/g, ' ').trim() : null; })()")
        : null;
      await js("(function () { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return 1; })()");
      /* ---- Nr. 81: die Kopfzeile bei 1024 px ----
       * #cockpit ist eine umbrechende Flex-Zeile. Gemessen wird, was dabei geschieht:
       * in welcher Zeile jedes Feld steht, ob der Text in #ckBooks selbst umbricht und
       * ob irgendetwas ueber den Rand laeuft (dann waere scrollWidth > clientWidth). */
      await klick('nav.tabs button[data-tab="dashboard"]');
      win.setContentSize(1024, 768);
      await warte(1200);
      erg.kopf1024 = await js("(function () {" +
        "var c = document.getElementById('cockpit'), b = document.getElementById('ckBooks'); if (!c || !b) return null;" +
        "var lh = parseFloat(getComputedStyle(b).lineHeight) || (parseFloat(getComputedStyle(b).fontSize) * 1.2);" +
        "var r = b.getBoundingClientRect(), cr = c.getBoundingClientRect();" +
        "return { fensterBreite: window.innerWidth, seiteScrollBreite: document.documentElement.scrollWidth," +
        "  cockpit: { breite: Math.round(cr.width), hoehe: Math.round(cr.height), scrollBreite: c.scrollWidth, clientBreite: c.clientWidth }," +
        "  felder: Array.prototype.map.call(c.querySelectorAll('.ck'), function (k) { var q = k.getBoundingClientRect();" +
        "    return { name: (k.querySelector('.ckl') || {}).textContent, oben: Math.round(q.top - cr.top), links: Math.round(q.left), breite: Math.round(q.width), hoehe: Math.round(q.height) }; })," +
        "  ckBooks: { text: b.textContent, breite: Math.round(r.width), hoehe: Math.round(r.height), zeilenhoehe: Math.round(lh * 10) / 10," +
        "    zeilen: Math.round(r.height / lh), rechterRand: Math.round(r.right), scrollBreite: b.scrollWidth, clientBreite: b.clientWidth } }; })()");
      if (BILD) {
        const bild = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 260 });
        fs.writeFileSync(BILD, bild.toPNG());
      }
      const out = JSON.stringify(erg, null, 1);
      if (AUS) fs.writeFileSync(AUS, out);
      console.log(out);
      app.exit(0);
    } catch (e) {
      console.error('UI-Auszug abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
