'use strict';
/* ================= UI-Probe: der kleinste Verhaltenstest der Oberflaeche =================
 *
 * Struktur-Audit Punkt 12 (25.08.2026): test-v6 prueft Quelltext per Textmarke und
 * kann deshalb eine ganze Fehlerklasse nicht sehen - eine Pille ohne Wirkung, ein
 * Reiter, der beim Schalten wirft. Genau diese Klasse hat die App schon getroffen
 * (die Pillen aller Reiter waren tot, bis depot.js init() durch war).
 *
 * Diese Probe startet die App VOLLSTAENDIG ISOLIERT (frisches userData und ein
 * frischer Datenordner unter %TEMP% - Store, Depot und Downloads des Nutzers werden
 * nie beruehrt), klickt jeden Reiter und jede Pille und zaehlt unbehandelte Fehler.
 *
 * Aufruf aus der Repo-Wurzel (ein Fenster erscheint kurz - das ist normal):
 *
 *   .\node_modules\.bin\electron.cmd tools\ui-probe.js
 *
 * Exit-Code 0: jeder Reiter und jede Pille schaltet ihr Panel aktiv, keine
 * unbehandelten Fehler. Exit-Code 1: mindestens ein Befund (steht im Protokoll).
 * Exit-Code 2: die Probe selbst kam nicht durch (Zeitlimit, Startfehler).
 *
 * Kein Teil von npm test: die Probe braucht ein Fenster und einige Sekunden echten
 * App-Start. Sie gehoert VOR jeden Umbau der Navigation oder der Reiterinhalte -
 * einmal vorher gruen, einmal nachher gruen. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-ui-probe-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));
/* Ohne diese Schalter pausiert Chromium verdeckte Fenster - die Probe soll aber
 * auch laufen, wenn ihr Fenster hinter anderen liegt. */
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

/* loadFile loest relative Pfade gegen app.getAppPath() auf, und das ist bei diesem
 * Einstiegspunkt tools/ - der Patch biegt sie auf die Repo-Wurzel. */
const origLoadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (fp, opts) {
  if (!path.isAbsolute(fp)) fp = path.join(WURZEL, fp);
  return origLoadFile.call(this, fp, opts);
};

const konsoleFehler = [];

async function probe(win) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  /* Fehlerzaehler in die Seite legen. Er faengt ab jetzt - fruehe Startfehler
   * stehen ersatzweise in konsoleFehler (console-message, nur als Hinweis). */
  await js("window.__probe = { fehler: [] };" +
    "window.addEventListener('error', function (e) { window.__probe.fehler.push(String(e.message || e)); });" +
    "window.addEventListener('unhandledrejection', function (e) { window.__probe.fehler.push('unhandled: ' + String(e.reason && e.reason.message || e.reason)); });" +
    "'bereit'");
  const tabs = await js("Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) { return b.getAttribute('data-tab'); })");
  if (!tabs || !tabs.length) throw new Error('keine Reiter gefunden');
  const probleme = [];
  let pillen = 0;
  for (const tab of tabs) {
    const okTab = await js("(function () {" +
      "var b = document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if (!b) return 'kein Knopf';" +
      "b.click();" +
      "var p = document.getElementById('tab-" + tab + "');" +
      "return p && p.classList.contains('active') ? 'ok' : 'Panel nicht aktiv'; })()");
    if (okTab !== 'ok') probleme.push('Reiter ' + tab + ': ' + okTab);
    const subs = await js("Array.prototype.map.call(document.querySelectorAll('#tab-" + tab + " .pills button[data-sub]'), function (b) { return b.getAttribute('data-sub'); })");
    for (const sub of (subs || [])) {
      pillen++;
      const okSub = await js("(function () {" +
        "var b = document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if (!b) return 'kein Knopf';" +
        "b.click();" +
        "var p = document.getElementById('sub-" + sub + "');" +
        "return p && p.classList.contains('active') ? 'ok' : 'Unterseite nicht aktiv'; })()");
      if (okSub !== 'ok') probleme.push('Pille ' + tab + '/' + sub + ': ' + okSub);
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  /* ---- Verhaltenstest: der Intraday-Bereich (Oberflaeche Stufe 2) ----
   * Ist die Intraday-Strategie aus, wird der Behaelter AUSGEBLENDET - und zwar per
   * hidden, nicht durch Entfernen: depot.js render() schreibt ohne Null-Pruefung in
   * #depotStats, messband.js haengt sein Band als erstes Kind in #sub-depot. Ein
   * Umbau, der die Elemente herausnimmt, wuerde beides STILL brechen - kein
   * Textmarken-Test im Quelltext kann das sehen.
   * Geprueft wird der Zusammenhang, nicht ein fester Zustand: hidden genau dann,
   * wenn die Strategie aus ist. In der frischen Instanz ist sie aus (Vorgabe), mit
   * tools/ui-aufnahmen.js --kunstdaten an - dieselbe Zusicherung deckt beide Faelle
   * ab und hat damit ihre eigene Positivkontrolle. */
  const bereich = await js("(function () {" +
    "var el = document.getElementById('intradayBereich');" +
    "var rs = window.DepotAPI && window.DepotAPI.regelStatus ? window.DepotAPI.regelStatus() : null;" +
    "return { da: !!el, hidden: el ? !!el.hidden : null, an: rs ? !!rs.intradayAn : null," +
    " stats: !!document.getElementById('depotStats')," +
    " messband: !!document.getElementById('sub-depot')," +
    " karten: ['buchMomentumKopf', 'buchDriftKopf', 'buchIntradayKopf']" +
    "   .filter(function (i) { return !!document.getElementById(i); }).length }; })()");
  if (!bereich.da) probleme.push('#intradayBereich fehlt im DOM');
  else if (bereich.an === null) probleme.push('DepotAPI.regelStatus() antwortet nicht - Zustand nicht pruefbar');
  else if (bereich.hidden === bereich.an) {
    probleme.push('Intraday-Bereich: hidden=' + bereich.hidden + ' bei intradayAn=' + bereich.an +
      ' - er muss genau dann versteckt sein, wenn die Strategie aus ist');
  }
  if (!bereich.stats) probleme.push('#depotStats steht nicht mehr im DOM - render() schriebe ins Leere');
  if (!bereich.messband) probleme.push('#sub-depot steht nicht mehr im DOM - messband.js faende seinen Anker nicht');
  if (bereich.karten !== 3) probleme.push('Es stehen ' + bereich.karten + ' statt 3 Buecher-Karten im DOM');
  console.log('  Intraday-Bereich: hidden=' + bereich.hidden + ', Strategie an=' + bereich.an +
    ', Karten=' + bereich.karten);

  const seitenFehler = await js('window.__probe.fehler.slice(0, 20)');
  /* Ein abgebrochenes init() faengt depot.js selbst ab und meldet es NUR im
   * Warnband - die Schaltung funktioniert dann trotzdem, und genau so waere der
   * Q-Fehler der Migrations-Auslagerung (25.08.2026) hier fast durchgerutscht.
   * Deshalb ist das Warnband Teil der Probe. */
  const warnband = await js("(document.getElementById('warnband') || {}).textContent || ''");
  if (/nicht vollständig starten|nicht vollstaendig starten/.test(warnband)) {
    probleme.push('Warnband meldet init-Abbruch: ' + String(warnband).slice(0, 120));
  }
  return { tabs: tabs.length, pillen, probleme, seitenFehler: seitenFehler || [] };
}

/* Hartes Zeitlimit: eine haengende Probe ist ein Befund, kein Grund zu warten. */
setTimeout(() => { console.error('UI-Probe: Zeitlimit (90 s) erreicht.'); app.exit(2); }, 90000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.on('console-message', (e2, level, message) => {
    if (level >= 3) konsoleFehler.push(String(message).slice(0, 200));
  });
  win.webContents.once('did-finish-load', async () => {
    try {
      /* Die Start-Renderings (Skeletons, erste Abrufe) kurz abwarten - die Probe
       * misst die Schaltung, nicht das Netz. */
      await new Promise((r) => setTimeout(r, 4000));
      const erg = await probe(win);
      console.log('UI-Probe: ' + erg.tabs + ' Reiter, ' + erg.pillen + ' Pillen geschaltet.');
      erg.probleme.forEach((p) => console.error('BEFUND Schaltung: ' + p));
      erg.seitenFehler.forEach((f) => console.error('BEFUND unbehandelter Fehler: ' + f));
      if (konsoleFehler.length) {
        console.log('Hinweis: ' + konsoleFehler.length + ' console.error-Meldung(en) - im Offline-Betrieb meist Netzabrufe, kein Befund:');
        konsoleFehler.slice(0, 5).forEach((f) => console.log('  · ' + f));
      }
      const rot = erg.probleme.length + erg.seitenFehler.length;
      console.log(rot ? 'UI-Probe ROT: ' + rot + ' Befund(e).' : 'UI-Probe gruen.');
      app.exit(rot ? 1 : 0);
    } catch (e) {
      console.error('UI-Probe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
