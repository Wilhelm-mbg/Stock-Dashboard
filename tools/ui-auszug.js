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
 * GEKLICKT werden nur Reiter, Pillen und die zwei Start-Dialoge (#erststartOk,
 * #diagNein) - kein Knopf, der holt, rechnet, handelt oder sendet.
 *
 * Aufruf (aus der Repo-Wurzel):
 *   .\node_modules\.bin\electron.cmd tools\ui-auszug.js [--kapi-ohne-merker] [--aus <datei.json>]
 * --kapi-ohne-merker  saet einen Bestand mit kapiZusatz: true OHNE den Merker der
 *                     Sicherung - der Auszug zeigt dann auch ihren Journal-Eintrag.
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
const ausIdx = process.argv.indexOf('--aus');
const AUS = ausIdx !== -1 ? process.argv[ausIdx + 1] : null;

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
      await warte(500);
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
      erg.variante = KAPI ? 'kapiZusatz: true ohne Merker' : 'Kunstbestand unveraendert';
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
