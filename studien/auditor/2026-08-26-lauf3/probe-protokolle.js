'use strict';
/* ====== Auditor, zweite Probe: mit Messprotokollen (26.08.2026, dritter Lauf) ======
 *
 * WARUM EIN ZWEITER LAUF. Die erste Probe faehrt ein leeres Profil - und damit einen
 * LEEREN DATENORDNER. Genau daran laeuft der Kern dieser Aenderungsmenge vorbei:
 *
 *   - kantenAusProtokollen() (depot.js, 8fc2c8a) waehlt jetzt die Variante, die das
 *     Urteil des PROTOKOLLS traegt, statt der mit dem staerksten t.
 *   - der neue Hinweissatz bei "nicht bestaetigt" (depot.js, Wilhelms Entscheid 2b)
 *     haengt an genau diesem Urteil.
 *   - das Scoreboard auf dem Reiter MESSUNG - der Rotationsblock dieser Nacht - ist
 *     ohne Protokolle nur ein Leerzustand.
 *
 * Ohne Protokolle im Datenordner faellt all das in den Zweig "kein Messprotokoll".
 * Die Probe legt deshalb die zwoelf Protokolle aus dem Repo in den ISOLIERTEN
 * Downloads-Ordner unter %TEMP% - dorthin, wo main.js sie liest. Kopiert wird nur
 * gelesen; der echte Datenordner des Anwenders wird nie angefasst.
 *
 * Der Auslöser wird ueber den SPEICHER gesetzt, nicht ueber die Bedienelemente: ein
 * Klick auf die Auslöser-Auswahl wuerde die Konfiguration der laufenden App umstellen,
 * und genau das ist im Auftrag gesperrt. Ein frisch gesaetes Testprofil in %TEMP% ist
 * kein Eingriff, sondern der Versuchsaufbau.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-26-lauf3\probe-protokolle.js
 *
 * ACHTUNG: WURZEL geht von hier DREI Ebenen hoch. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor3p-'));
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

function protokolleLegen() {
  const quelle = path.join(WURZEL, 'studien', 'messmaschine', 'protokolle');
  const ziel = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten', 'protokolle');
  fs.mkdirSync(ziel, { recursive: true });
  let n = 0;
  fs.readdirSync(quelle).filter((f) => f.endsWith('.json')).forEach((f) => {
    fs.copyFileSync(path.join(quelle, f), path.join(ziel, f)); n++;
  });
  fs.mkdirSync(path.join(TESTROOT, 'userdata', 'store'), { recursive: true });
  fs.writeFileSync(path.join(TESTROOT, 'userdata', 'store', 'theme.json'), JSON.stringify('light'), 'utf8');
  console.log('PROTOKOLLE=' + n + ' -> ' + ziel);
}
protokolleLegen();

const BILDER = path.join(TESTROOT, 'bilder');
fs.mkdirSync(BILDER, { recursive: true });

/* Depotverlauf saeen (fuer die Farbmessung am Ruecksetzer) und den Auslöser setzen.
 * Beides ueber den Speicher, mit dem Stand, den die App selbst geschrieben hat. */
function saatCode(modus) {
  return "(async function () {" +
    "var d = await window.api.storeGet('depot');" +
    "if (!d) return { ok: false, grund: 'kein depot im Speicher' };" +
    "var t0 = 1750000000000, punkte = [];" +
    "var kurve = [0, 1.5, 3.1, 4.6, 6.2, 8.9, 11.4, 9.0, 6.1, 3.4, 4.2, 5.0, 5.6, 6.1, 7.3];" +
    "for (var i = 0; i < kurve.length; i++) {" +
    "  punkte.push([t0 + i * 600000, Math.round(100000 * (1 + kurve[i] / 100) * 100) / 100]); }" +
    "d.equityHist = punkte;" +
    "if (d.intraday) d.intraday.mode = " + JSON.stringify(modus) + ";" +
    "var r = await window.api.storeSet('depot', d);" +
    "return { ok: !(r && r.ok === false), modus: d.intraday ? d.intraday.mode : null }; })()";
}

/* ---- Der Belegblock im Regelkopf, im Wortlaut und mit den Farben ---- */
const BELEGCODE = "(function () {" +
  "var k = document.getElementById('regelKopf');" +
  "if (!k) return { fehlt: true };" +
  "var zeilen = Array.prototype.map.call(k.querySelectorAll('tr'), function (r) {" +
  "  return { kopf: r.cells[0] ? (r.cells[0].innerText || '').trim() : ''," +
  "    wert: r.cells[1] ? (r.cells[1].innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 400) : '' }; });" +
  "var fett = k.querySelector('td b');" +
  "var warn = k.querySelector('.warn');" +
  "return { fehlt: false, zeilen: zeilen," +
  "  urteilRoh: fett ? (fett.textContent || '').trim() : null," +
  "  urteilFarbe: fett ? getComputedStyle(fett).color : null," +
  "  hatWarnhinweis: !!warn," +
  "  warntext: warn ? (warn.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 300) : null }; })()";

/* ---- Die Kostenhuerde: dort steht das Urteil ein zweites Mal ---- */
const HUERDECODE = "(function () {" +
  "var kandidaten = ['huerdeBox', 'kostenHuerde', 'huerde'];" +
  "var el = null;" +
  "for (var i = 0; i < kandidaten.length; i++) { var e = document.getElementById(kandidaten[i]); if (e) { el = e; break; } }" +
  "if (!el) {" +
  "  var alle = document.querySelectorAll('#tab-strategien div, #tab-depot div');" +
  "  for (var j = 0; j < alle.length; j++) {" +
  "    var t = alle[j].textContent || '';" +
  "    if (t.indexOf('Urteil der Messmaschine') !== -1 && alle[j].children.length < 12) { el = alle[j]; break; } } }" +
  "if (!el) return { gefunden: false };" +
  "return { gefunden: true, id: el.id || '(ohne Kennung)'," +
  "  text: (el.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 700) }; })()";

/* ---- Der Ruecksetzer im Depotverlauf-Kopf: traegt class="down" auch eine Farbe? ---- */
const DOWNCODE = "(function () {" +
  "var k = document.getElementById('eqKopf'); if (!k) return { fehlt: true };" +
  "var b = k.querySelector('b.down');" +
  "var alle = Array.prototype.map.call(k.querySelectorAll('b'), function (x) {" +
  "  return { t: (x.textContent || '').trim(), c: x.className || '', farbe: getComputedStyle(x).color }; });" +
  "var probe = document.createElement('span');" +
  "probe.style.color = 'var(--down)'; probe.style.position = 'absolute'; probe.textContent = '.';" +
  "document.body.appendChild(probe); var soll = getComputedStyle(probe).color;" +
  "var probe2 = document.createElement('span');" +
  "probe2.style.color = 'var(--ink)'; probe2.style.position = 'absolute'; probe2.textContent = '.';" +
  "document.body.appendChild(probe2); var ink = getComputedStyle(probe2).color;" +
  "probe.remove(); probe2.remove();" +
  "return { fehlt: false, downDa: !!b, downFarbe: b ? getComputedStyle(b).color : null," +
  "  sollDown: soll, normaleTinte: ink, alle: alle }; })()";

/* ---- Rotationsblock: das Scoreboard mit echten Protokollen ---- */
const SCOREBOARDCODE = "(function () {" +
  "var t = document.getElementById('tab-messung'); if (!t) return { fehlt: true };" +
  "var tabellen = Array.prototype.map.call(t.querySelectorAll('table'), function (tb) {" +
  "  var kopf = tb.rows[0];" +
  "  return { zeilen: tb.rows.length, spalten: kopf ? kopf.cells.length : 0," +
  "    kopfIstTh: kopf ? Array.prototype.every.call(kopf.cells, function (c) { return c.tagName === 'TH'; }) : null," +
  "    ungleich: Array.prototype.filter.call(tb.rows, function (r) { return kopf && r.cells.length !== kopf.cells.length; }).length," +
  "    kopfzeile: kopf ? Array.prototype.map.call(kopf.cells, function (c) { return (c.innerText || '').trim().slice(0, 24); }) : []," +
  "    ersteDaten: tb.rows[1] ? Array.prototype.map.call(tb.rows[1].cells, function (c) { return (c.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 40); }) : [] }; });" +
  "var urteilsWorte = [];" +
  "Array.prototype.forEach.call(t.querySelectorAll('td, span, b'), function (e) {" +
  "  var s = (e.textContent || '').trim();" +
  "  if (/^nicht-[a-z]+$/.test(s) || /^(nicht bestätigt|nicht entscheidbar|nicht messbar|bestätigt|widerlegt)$/.test(s)) {" +
  "    if (urteilsWorte.indexOf(s) === -1) urteilsWorte.push(s); } });" +
  "return { fehlt: false, tabellen: tabellen, urteilsWorte: urteilsWorte," +
  "  textLaenge: (t.innerText || '').length }; })()";

async function js2(win, code) { return win.webContents.executeJavaScript(code, true); }
async function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function schuss(win, name) {
  const bild = await win.webContents.capturePage();
  fs.writeFileSync(path.join(BILDER, name + '.png'), bild.toPNG());
}
async function reiter(win, tab, sub) {
  await js2(win, "(function(){var b=document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if(b) b.click();" +
    (sub ? "var s=document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if(s) s.click();" : '') +
    "return 'ok';})()");
}
async function escape(win) {
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
  await warte(800);
}

setTimeout(() => { console.error('Auditor-Probe 2: Zeitlimit erreicht.'); app.exit(2); }, 600000);

const konsoleFehler = [];
let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.on('console-message', (e2, level, message) => {
    if (level >= 3) konsoleFehler.push(String(message).slice(0, 220));
  });
  let schonGelaufen = false;
  win.webContents.on('did-finish-load', async () => {
    if (schonGelaufen) return;
    schonGelaufen = true;
    try {
      win.setContentSize(1280, 800);
      await warte(5000);
      await escape(win);

      const ergebnis = { commit: 'd964891', laeufe: [] };

      /* Zwei Durchgaenge: rsi2seit steht im Protokoll auf "nicht-entscheidbar",
       * kapitulation auf "nicht-bestaetigt" - nur der zweite loest den neuen
       * Hinweissatz aus. Beide zeigen den Urteilswert im Klartext. */
      for (const modus of ['rsi2seit', 'kapitulation']) {
        const saat = await js2(win, saatCode(modus));
        await js2(win, "location.reload(); 'neu'").catch(() => {});
        await warte(10000);
        await escape(win);

        await reiter(win, 'strategien', 'regelbuch');
        await warte(3500);
        const beleg = await js2(win, BELEGCODE);
        const huerde = await js2(win, HUERDECODE);
        await schuss(win, 'P-regelkopf-' + modus);

        await reiter(win, 'depot', 'depot');
        await warte(2500);
        const down = await js2(win, DOWNCODE);
        if (modus === 'rsi2seit') await schuss(win, 'P-depotverlauf');

        ergebnis.laeufe.push({ modus, saat, beleg, huerde, down });
        console.log('== ' + modus + ' ==');
        console.log('  urteilRoh   = ' + JSON.stringify(beleg.urteilRoh));
        console.log('  hinweis     = ' + beleg.hatWarnhinweis);
        console.log('  down-Farbe  = ' + (down.downFarbe || '(kein down)') + ' | soll ' + down.sollDown + ' | Tinte ' + down.normaleTinte);
      }

      /* Rotationsblock: Messung mit echten Protokollen */
      await reiter(win, 'messung', null);
      await warte(5000);
      ergebnis.scoreboard = await js2(win, SCOREBOARDCODE);
      await schuss(win, 'P-messung-1280');
      win.setContentSize(1000, 700);
      await warte(1200);
      await schuss(win, 'P-messung-1000');

      ergebnis.konsoleFehler = konsoleFehler.slice(0, 40);
      fs.writeFileSync(path.join(TESTROOT, 'befund2.json'), JSON.stringify(ergebnis, null, 1));
      console.log('BILDER=' + BILDER);
      console.log('BEFUNDDATEI=' + path.join(TESTROOT, 'befund2.json'));
      console.log('URTEILSWORTE_MESSUNG=' + JSON.stringify(ergebnis.scoreboard.urteilsWorte));
      app.exit(0);
    } catch (e) {
      console.error('Auditor-Probe 2 abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
