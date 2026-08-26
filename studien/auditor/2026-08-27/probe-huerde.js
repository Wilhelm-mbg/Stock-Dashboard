'use strict';
/* ====== Auditor, zweite Probe: wandert die Wand mit? (Nacht auf den 27.08.2026) ======
 *
 * Wilhelms Auflage zur Aufloesungswand steht woertlich im Scoreboard: "Aendern Sie
 * das Produkt oder die Haltedauer, verschiebt sich diese Grenze." Die erste Probe
 * hat die Wand nur in der VOREINSTELLUNG gesehen (Aktie 1x, 0,100 Pp) - und genau
 * dort faellt nicht auf, ob eine zweite Stelle dieselbe Zahl fest verdrahtet hat.
 * Denn das Messband auf Vermoegen -> Depot traegt in messband.js Zeile 27 ein
 * festes `var HUERDE_PP = 0.10` - dieselbe Zahl, die die Voreinstellung zufaellig
 * auch ergibt. Ob das zwei Rechnungen oder eine ist, entscheidet sich erst, wenn
 * man das Produkt umstellt.
 *
 * Das ist die Fehlerfamilie vom 23.08.2026 (Produkt-Vorgabe an drei Stellen, zwei
 * davon falsch), und sie ist mit blossem Lesen nicht zu entscheiden - deshalb wird
 * sie gemessen.
 *
 * Umgestellt wird ueber den SPEICHER des isolierten Testprofils, nicht ueber die
 * Bedienelemente: ein Klick auf die Produktwahl waere ein Eingriff in die laufende
 * Konfiguration und ist im Auftrag gesperrt. Ein frisch gesaetes Profil unter
 * %TEMP% ist kein Eingriff, sondern der Versuchsaufbau.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe-huerde.js
 *
 * ACHTUNG: WURZEL geht von hier DREI Ebenen hoch. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor27h-'));
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

function saatLegen() {
  const quelle = path.join(WURZEL, 'studien', 'messmaschine', 'protokolle');
  const ziel = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten', 'protokolle');
  fs.mkdirSync(ziel, { recursive: true });
  let n = 0;
  fs.readdirSync(quelle).filter((f) => f.endsWith('.json')).forEach((f) => {
    fs.copyFileSync(path.join(quelle, f), path.join(ziel, f)); n++;
  });
  const sd = path.join(TESTROOT, 'userdata', 'store');
  fs.mkdirSync(sd, { recursive: true });
  fs.writeFileSync(path.join(sd, 'theme.json'), JSON.stringify('light'), 'utf8');
  console.log('PROTOKOLLE=' + n);
}
saatLegen();

const BILDER = path.join(TESTROOT, 'bilder');
fs.mkdirSync(BILDER, { recursive: true });

/* Das Produkt umstellen - ueber den Speicher, mit dem Stand, den die App selbst
 * geschrieben hat, um EIN Feld ergaenzt und zurueckgelegt. Ein selbst getipptes
 * Teilobjekt haette fehlende Felder und wuerde Fehler erzeugen, die es in der App
 * gar nicht gibt (erfundene Funde). */
const UMSTELLCODE = "(async function () {" +
  "var d = await window.api.storeGet('depot');" +
  "if (!d) return { ok: false, grund: 'kein depot im Speicher' };" +
  "if (!d.intraday) return { ok: false, grund: 'kein intraday-Abschnitt' };" +
  "var vorher = d.intraday.instrument;" +
  "d.intraday.instrument = 'schein';" +
  "var r = await window.api.storeSet('depot', d);" +
  "return { ok: !(r && r.ok === false), vorher: vorher, jetzt: d.intraday.instrument }; })()";

/* Was die drei Stellen sagen, die dieselbe Kostenhuerde behaupten:
 *   1. DepotAPI.kostenHuerde()  - die Rechnung
 *   2. #kostenHuerde            - die Anzeige im Regelkopf
 *   3. #messband                - das Band auf Vermoegen -> Depot
 *   4. die Trennzeile des Scoreboards */
const DREISTELLENCODE = "(function () {" +
  "var h = null;" +
  "try { h = window.DepotAPI && window.DepotAPI.kostenHuerde ? window.DepotAPI.kostenHuerde() : null; }" +
  "catch (e) { h = 'Fehler: ' + (e && e.message); }" +
  "function txt(id) { var e = document.getElementById(id);" +
  "  return e ? (e.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 700) : null; }" +
  "var sb = document.getElementById('scoreboard');" +
  "var trenner = [];" +
  "if (sb) { Array.prototype.forEach.call(sb.querySelectorAll('tr'), function (r) {" +
  "  if (r.cells.length === 1 && (r.cells[0].colSpan || 1) > 1)" +
  "    trenner.push((r.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 500)); }); }" +
  "var reihen = sb ? Array.prototype.map.call(sb.querySelectorAll('tr.sbRow'), function (r) {" +
  "  return { strategie: (r.cells[1] ? (r.cells[1].innerText || '').trim() : '')," +
  "    feinheit: (r.cells[7] ? (r.cells[7].innerText || '').trim() : '') }; }) : [];" +
  "return { rechnung: h, regelkopf: txt('kostenHuerde'), messband: txt('messband')," +
  "  trenner: trenner, reihen: reihen }; })()";

async function js2(win, code) { return win.webContents.executeJavaScript(code, true); }
async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function schuss(win, name) {
  const bild = await win.webContents.capturePage();
  const ziel = path.join(BILDER, name + '.png');
  fs.writeFileSync(ziel, bild.toPNG());
  return ziel;
}
async function reiter(win, tab, sub) {
  await js2(win, "(function(){var b=document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if(b) b.click();" +
    (sub ? "var s=document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if(s) s.click();" : '') +
    "return 'ok';})()");
}

async function aufnehmen(win) {
  win.setContentSize(1280, 800);
  await warte(600);
  await reiter(win, 'messung', null);
  await warte(3000);
  const messung = await js2(win, DREISTELLENCODE);
  await reiter(win, 'depot', 'depot');
  await warte(2500);
  const depot = await js2(win, DREISTELLENCODE);
  await reiter(win, 'strategien', 'strategien');
  await warte(2000);
  const regeln = await js2(win, DREISTELLENCODE);
  return { rechnung: messung.rechnung, trenner: messung.trenner, reihen: messung.reihen,
    messband: depot.messband, regelkopf: regeln.regelkopf || depot.regelkopf || messung.regelkopf };
}

setTimeout(() => { console.error('Auditor-Huerdenprobe: Zeitlimit erreicht.'); app.exit(2); }, 900000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  let schonGelaufen = false;
  win.webContents.on('did-finish-load', async () => {
    if (schonGelaufen) return;
    schonGelaufen = true;
    try {
      await warte(6000);
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(1000);

      const vorher = await aufnehmen(win);
      await reiter(win, 'depot', 'depot');
      await warte(1500);
      await schuss(win, 'H1-messband-aktie');

      const um = await js2(win, UMSTELLCODE);
      console.log('UMSTELLUNG=' + JSON.stringify(um));
      await js2(win, "location.reload(); 'neu'").catch(() => {});
      await warte(11000);
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(1500);

      const nachher = await aufnehmen(win);
      await reiter(win, 'depot', 'depot');
      await warte(1500);
      await schuss(win, 'H2-messband-schein');
      await reiter(win, 'messung', null);
      await warte(2500);
      await schuss(win, 'H3-scoreboard-schein');

      const bericht = { commit: '04c9be5', bilder: BILDER, umstellung: um, vorher: vorher, nachher: nachher };
      fs.writeFileSync(path.join(TESTROOT, 'huerde.json'), JSON.stringify(bericht, null, 1));
      console.log('BILDER=' + BILDER);
      console.log('BERICHT=' + path.join(TESTROOT, 'huerde.json'));
      console.log('VORHER pp=' + JSON.stringify(vorher.rechnung));
      console.log('NACHHER pp=' + JSON.stringify(nachher.rechnung));
      app.exit(0);
    } catch (e) {
      console.error('Auditor-Huerdenprobe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
