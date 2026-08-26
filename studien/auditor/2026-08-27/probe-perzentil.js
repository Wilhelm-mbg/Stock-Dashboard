'use strict';
/* ====== Auditor, Nachtrag: das Guete-Perzentil (#80) ======
 *
 * Die Hauptprobe hat hier "fehlt" gemeldet - und das war MEIN Fehler, kein Fund:
 * sie fragte nach `window.Q`. Den Namen `Q` gibt es aber nur modulintern
 * (`var Q = window.Quant` in explorer.js Zeile 5); veroeffentlicht ist
 * `window.Quant`. Ein Nullbefund ohne Positivkontrolle haette hier beinahe eine
 * fehlende Funktion behauptet, die es laengst gibt.
 *
 * Geprueft wird deshalb hier, netzunabhaengig und deterministisch:
 *   - gibt es Quant.gueteZufallsAnteil ueberhaupt (Positivkontrolle)?
 *   - liegt der Rueckgabewert immer in 0..100?
 *   - ist er monoton in der Roh-Guete (hoehere Guete nie kleineres Perzentil)?
 *   - was liefert er bei unbrauchbaren Eingaben (soll: null, nicht NaN)?
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe-perzentil.js
 *
 * ACHTUNG: WURZEL geht von hier DREI Ebenen hoch. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor27p-'));
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

const CODE = "(function () {" +
  "var Qt = window.Quant;" +
  "if (!Qt) return { quantDa: false };" +
  "if (!Qt.gueteZufallsAnteil) return { quantDa: true, funktionDa: false," +
  "  namen: Object.keys(Qt).filter(function (k) { return /guete|zufall/i.test(k); }) };" +
  "var proben = [], kaputt = [], nichtMonoton = [];" +
  "[20, 30, 50, 80, 120, 150, 200, 300].forEach(function (n) {" +
  "  var vorher = -1;" +
  "  for (var g = 0; g <= 100; g++) {" +
  "    var p = Qt.gueteZufallsAnteil(g, n);" +
  "    if (p == null || !isFinite(p) || p < 0 || p > 100) { kaputt.push({ n: n, g: g, p: p }); continue; }" +
  "    if (p < vorher) nichtMonoton.push({ n: n, g: g, p: p, vorher: vorher });" +
  "    vorher = p; }" +
  "  proben.push({ n: n, p50: Qt.gueteZufallsAnteil(50, n), p75: Qt.gueteZufallsAnteil(75, n)," +
  "    p90: Qt.gueteZufallsAnteil(90, n), p100: Qt.gueteZufallsAnteil(100, n) }); });" +
  "return { quantDa: true, funktionDa: true, proben: proben," +
  "  kaputt: kaputt.slice(0, 12), nichtMonoton: nichtMonoton.slice(0, 12)," +
  "  ungueltig: { textN: Qt.gueteZufallsAnteil(50, 'x'), leerG: Qt.gueteZufallsAnteil(null, 100)," +
  "    negG: Qt.gueteZufallsAnteil(-5, 100), grossG: Qt.gueteZufallsAnteil(500, 100) }" +
  "}; })()";

async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }

setTimeout(() => { console.error('Perzentil-Probe: Zeitlimit.'); app.exit(2); }, 300000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  let schonGelaufen = false;
  win.webContents.on('did-finish-load', async () => {
    if (schonGelaufen) return;
    schonGelaufen = true;
    try {
      await warte(5000);
      const erg = await win.webContents.executeJavaScript(CODE, true);
      fs.writeFileSync(path.join(TESTROOT, 'perzentil.json'), JSON.stringify(erg, null, 1));
      console.log('ERGEBNIS=' + JSON.stringify(erg));
      app.exit(0);
    } catch (e) {
      console.error('Perzentil-Probe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
