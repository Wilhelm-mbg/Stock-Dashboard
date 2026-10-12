'use strict';
/* ================= Kunstinstanz-Probe fuer den Lagebild-Export (Auftrag Nr. 115) =================
 *
 * Startet die App ISOLIERT (wiki/oberflaeche.md §6: userData und downloads unter %TEMP%, Kunstdaten
 * aus tools/kunstinstanz.js), wartet die vereinbarte Zeit, und sieht dann im Temp-Datenordner nach:
 * lagebild.json (Groesse, Schema gegen test-daten/lagebild-beispiel.json, null-Abschnitte,
 * Schluesselmuster) und markt-chart/ (Dateien, Groessen). Nichts von Wilhelm wird beruehrt -
 * nie die installierte App, nie %APPDATA%\markt-dashboard\store, nie Downloads\Markt-Dashboard-Daten.
 *
 *   .\node_modules\.bin\electron.cmd tools\lagebild-probe.js [--warten 180] [--aus <Berichtsdatei>]
 *
 * Geklickt wird nur #erststartOk und #diagNein (Sperrliste Vertrag §7.6 beachtet).
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
function arg(name, vorgabe) { const i = process.argv.indexOf(name); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe; }
const WARTEN = Math.max(10, parseInt(arg('--warten', '180'), 10) || 180);
const AUS = arg('--aus', null);

const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-lagebild-probe-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));
require(path.join(__dirname, 'kunstinstanz.js')).saeen(TESTROOT);
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

const origLoadFile = BrowserWindow.prototype.loadFile;
BrowserWindow.prototype.loadFile = function (fp, opts) {
  if (!path.isAbsolute(fp)) fp = path.join(WURZEL, fp);
  return origLoadFile.call(this, fp, opts);
};
const schlaf = (ms) => new Promise((r) => setTimeout(r, ms));

const MUSTER = [/\bsk-[A-Za-z0-9]{12,}/, /APCA-API/i, /\bPK[A-Z0-9]{16,}\b/, /\bBearer\s+[A-Za-z0-9._-]{8,}/, /"[a-zA-Z]*token[a-zA-Z]*"\s*:/i, /passwort/i, /C:\\\\Users|C:\/Users/i];

async function auswerten() {
  const L = require(path.join(WURZEL, 'lagebild.js'));
  const ref = JSON.parse(fs.readFileSync(path.join(WURZEL, 'test-daten', 'lagebild-beispiel.json'), 'utf8'));
  const daten = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten');
  const bericht = { testroot: TESTROOT, gewartetS: WARTEN, lagebild: null, charts: null, dateien: [] };
  try { bericht.dateien = fs.readdirSync(daten); } catch (e) { bericht.dateien = ['(kein Datenordner: ' + e.message + ')']; }
  const lp = path.join(daten, 'lagebild.json');
  if (fs.existsSync(lp)) {
    const text = fs.readFileSync(lp, 'utf8');
    let obj = null;
    try { obj = JSON.parse(text); } catch (e) { obj = null; }
    const schema = obj ? L.pruefeSchema(obj, ref) : null;
    bericht.lagebild = { bytes: Buffer.byteLength(text, 'utf8'), gueltigesJson: !!obj, kennung: obj && obj.kennung, exportiert: obj && obj.exportiert,
      appVersion: obj && obj.appVersion, sitzung: obj && obj.kopf && obj.kopf.sitzung,
      nullAbschnitte: obj ? Object.keys(obj).filter((k) => obj[k] === null) : null,
      schema: schema, muster: MUSTER.filter((m) => m.test(text)).map(String),
      ausschnitt: obj ? { kopf: obj.kopf, buecher: (obj.buecher || []).map((b) => ({ name: b.name, wert: b.wert, gegenMarkt: b.gegenMarkt && b.gegenMarkt.text, rueckblick: (b.rueckblick || []).length })),
        antwort: obj.regeln && obj.regeln.antwort, fehler: obj.fehler } : null };
  }
  const cd = path.join(daten, 'markt-chart');
  if (fs.existsSync(cd)) {
    const dateien = fs.readdirSync(cd).filter((n) => /\.json$/.test(n));
    let summe = 0;
    bericht.charts = { anzahl: dateien.length, dateien: dateien.map((n) => { const s = fs.statSync(path.join(cd, n)).size; summe += s; return n + ' ' + s; }), bytesGesamt: 0, probe: null };
    bericht.charts.bytesGesamt = summe;
    if (dateien.length) {
      const c = JSON.parse(fs.readFileSync(path.join(cd, dateien[0]), 'utf8'));
      bericht.charts.probe = { sym: c.sym, gekappt: c.gekappt, rahmen: Object.keys(c.rahmen).map((r) => r + ':' + c.rahmen[r].length).join(' '), zeichnungen: (c.zeichnungen || []).length };
    }
  }
  const text = JSON.stringify(bericht, null, 1);
  console.log(text);
  if (AUS) fs.writeFileSync(AUS, text, 'utf8');
}

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    try {
      await schlaf(7000);
      const js = (code) => win.webContents.executeJavaScript(code, true);
      await js("(function () { ['erststartOk', 'diagNein'].forEach(function (id) { var e = document.getElementById(id); if (e) e.click(); }); return 1; })()");
      console.log('Kunstinstanz laeuft in ' + TESTROOT + ' - warte ' + WARTEN + ' s');
      await schlaf(WARTEN * 1000);
      await auswerten();
      app.exit(0);
    } catch (e) {
      console.error('Lagebild-Probe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});
setTimeout(() => { console.error('Lagebild-Probe: Zeitlimit erreicht.'); app.exit(2); }, (WARTEN + 120) * 1000);
require(path.join(WURZEL, 'main.js'));
