'use strict';
/* ================= UI-Aufnahmen: jede Seite der Oberflaeche als PNG =================
 *
 * Rezept aus wiki/oberflaeche.md §6. Vorbild und technische Grundlage ist
 * tools/ui-probe.js - dieselbe ISOLIERTE Instanz (frisches userData, frischer
 * Downloads-Pfad unter %TEMP%), damit Store, Depot und Downloads des Nutzers nie
 * beruehrt werden. Der Unterschied: diese Probe klickt nicht nur, sie fotografiert.
 *
 * Aufruf aus der Repo-Wurzel (ein Fenster erscheint fuer eine Weile - das ist normal):
 *
 *   .\node_modules\.bin\electron.cmd tools\ui-aufnahmen.js <Zielordner>
 *
 * Der Zielordner wird angelegt. Er gehoert NICHT ins Repo - die Aufnahmen sind
 * Beleg fuer eine Uebergabe, kein Quellcode. Pro Reiter/Pille entsteht je
 * Fensterhoehe eine Datei: 01-dashboard-ueberblick-1.png, ...-2.png, ...
 *
 * Kein Teil von npm test: die Probe braucht ein Fenster und mehrere Minuten.
 * Sie gehoert einmal VOR und einmal NACH einen Umbau der Oberflaeche. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..');
const ZIEL = process.argv[2] && !process.argv[2].startsWith('-')
  ? path.resolve(process.argv[2])
  : path.join(WURZEL, '..', 'ui-aufnahmen');
fs.mkdirSync(ZIEL, { recursive: true });

const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-ui-aufnahmen-'));
app.setPath('userData', path.join(TESTROOT, 'userdata'));
app.setPath('downloads', path.join(TESTROOT, 'downloads'));

/* --kunstdaten: den Store der ISOLIERTEN Instanz vorab mit einem Depot fuellen, das
 * zwei laufende Buecher, eine offene Intraday-Position und 20 Verlaufspunkte hat.
 * Ohne das zeigt jede Aufnahme nur Leerzustaende - und eine Gestaltung, von der man
 * nur den leeren Fall gesehen hat, ist unbelegt.
 * Geschrieben wird ausschliesslich in das frische userData unter %TEMP%; der
 * Datenordner und die installierte App werden nie beruehrt. Die Zahlen sind
 * ERFUNDEN und als solche benannt (tools/kunstdepot.js). */
const KUNSTDATEN = process.argv.indexOf('--kunstdaten') > -1;
if (KUNSTDATEN) {
  const sd = path.join(TESTROOT, 'userdata', 'store');
  fs.mkdirSync(sd, { recursive: true });
  const KD = require(path.join(__dirname, 'kunstdepot.js'));
  const jetzt = Date.now();
  fs.writeFileSync(path.join(sd, 'depot.json'), JSON.stringify(KD.bauen(jetzt)));
  /* Die Kostenrunden wohnen in einem EIGENEN Store neben dem Depot. Sie in
   * depot.json zu legen genuegt nicht: der dort vorgesehene Uebernahmeweg laeuft
   * beim Start ins Leere (siehe Uebergabe oberflaeche-stufe2, Befund 2). */
  fs.writeFileSync(path.join(sd, 'kostenmessung.json'), JSON.stringify(KD.kostenmessung(jetzt)));
  console.log('Kunstdaten in den Test-Store geschrieben: ' + sd);
}
/* Ohne diese Schalter pausiert Chromium verdeckte Fenster - eine pausierte Seite
 * liefert leere Aufnahmen. */
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

const BREITE = 1280;
const HOEHE = 820;
const MAX_SEITEN = 14;  /* Deckel: eine sehr lange Seite soll die Probe nicht sprengen.
                         * 14 reicht fuer den aufgeklappten Maschinenraum. */

const schlaf = (ms) => new Promise((r) => setTimeout(r, ms));

async function aufnehmen(win, name) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  const hoehe = await js('Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)');
  const seiten = Math.max(1, Math.min(MAX_SEITEN, Math.ceil(hoehe / HOEHE)));
  for (let i = 0; i < seiten; i++) {
    await js('window.scrollTo(0, ' + (i * HOEHE) + '); 0');
    await schlaf(400);
    const bild = await wc.capturePage();
    const datei = path.join(ZIEL, name + '-' + (i + 1) + '.png');
    fs.writeFileSync(datei, bild.toPNG());
    console.log('  ' + path.basename(datei) + ' (' + bild.getSize().width + 'x' + bild.getSize().height + ')');
  }
  await js('window.scrollTo(0, 0); 0');
  return seiten;
}

/* ---- Textmenge je Panel (Oberflaeche Stufe 3, 03.09.2026) ----
 * Gemessen wird innerText des Panels in GENAU dem Zustand, den auch die Aufnahme
 * daneben zeigt: Klappen zu, nichts vorbereitet. innerText und nicht textContent -
 * versteckte Knoten (hidden, display:none, zugeklappte details-Inhalte) zaehlen dann
 * nicht mit, und genau darum geht es beim Schnitt: was der Leser vor sich hat.
 * Die Zahl ist ein BELEG fuer die Uebergabe, kein Kriterium einer Sperrklinke -
 * eine Klinke auf eine Zeichenzahl waere eine Schwelle ohne Messung dahinter. */
const TEXTMENGE = [];
async function textmenge(js, name, sel) {
  const n = await js("(function () { var e = document.querySelector('" + sel + "');" +
    "return e ? e.innerText.replace(/\\s+/g, ' ').trim().length : -1; })()");
  TEXTMENGE.push({ seite: name, sel: sel, zeichen: n });
  console.log('  Textmenge ' + name + ': ' + n + ' Zeichen (' + sel + ')');
  return n;
}

async function lauf(win) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  win.setContentSize(BREITE, HOEHE);
  await schlaf(700);
  /* Diagnose-Frage und Erststart-Banner wegklicken - sonst liegt ueber jeder
   * Aufnahme derselbe Kasten. Die Reihenfolge ist NICHT beliebig: erststart.js
   * oeffnet sein Fenster erst, wenn der Diagnose-Dialog zu ist, und pollt dafuer
   * im Sekundentakt. Ein Klick zum festen Zeitpunkt trifft deshalb ins Leere -
   * die erste Fassung dieser Probe hat genau so 33 Bilder MIT dem Erststart-
   * Kasten gemacht. Also klicken, dann warten, bis kein Dialog mehr offen ist. */
  await js("(function () { var b = document.getElementById('diagNein'); if (b) b.click(); return 'ok'; })()");
  for (let i = 0; i < 30; i++) {
    await schlaf(700);
    const offen = await js("(function () {" +
      "var o = document.querySelector('.modal-bg.open'); if (!o) return '';" +
      "var k = o.querySelector('#erststartOk, #diagNein, [data-close=\"' + o.id + '\"]');" +
      "if (k) k.click(); return o.id; })()");
    if (!offen) break;
  }
  await schlaf(800);

  const tabs = await js("Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) { return b.getAttribute('data-tab'); })");
  if (!tabs || !tabs.length) throw new Error('keine Reiter gefunden');
  let nr = 0;
  let dateien = 0;
  for (const tab of tabs) {
    await js("(function () { var b = document.querySelector('nav.tabs [data-tab=\"" + tab + "\"]'); if (b) b.click(); return 'ok'; })()");
    await schlaf(900);
    const subs = await js("Array.prototype.map.call(document.querySelectorAll('#tab-" + tab + " .pills button[data-sub]'), function (b) { return b.getAttribute('data-sub'); })");
    if (!subs || !subs.length) {
      nr++;
      console.log('Reiter ' + tab + ':');
      await textmenge(js, tab, '#tab-' + tab);
      dateien += await aufnehmen(win, String(nr).padStart(2, '0') + '-' + tab);
      continue;
    }
    for (const sub of subs) {
      await js("(function () { var b = document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if (b) b.click(); return 'ok'; })()");
      await schlaf(900);
      nr++;
      console.log('Reiter ' + tab + ' / Pille ' + sub + ':');
      await textmenge(js, tab + '/' + sub, '#sub-' + sub);
      dateien += await aufnehmen(win, String(nr).padStart(2, '0') + '-' + tab + '-' + sub);
      /* Der Maschinenraum besteht aus geschlossenen Klappen - zugeklappt zeigt die
       * Aufnahme nur eine Liste von Ueberschriften und belegt gar nichts. Deshalb
       * ein zweiter Durchgang mit allen Klappen offen: erst DAS zeigt, ob jeder
       * Block wirklich mitgekommen ist. Geklickt wird nichts, es wird nur
       * aufgeklappt. */
      const klappen = await js("(function () {" +
        "var d = document.querySelectorAll('#sub-" + sub + " details[data-klappe]');" +
        "Array.prototype.forEach.call(d, function (x) { x.open = true; });" +
        "return d.length; })()");
      if (klappen) {
        await schlaf(1500);
        nr++;
        console.log('Reiter ' + tab + ' / Pille ' + sub + ' (alle ' + klappen + ' Klappen offen):');
        await textmenge(js, tab + '/' + sub + ' (Klappen offen)', '#sub-' + sub);
        dateien += await aufnehmen(win, String(nr).padStart(2, '0') + '-' + tab + '-' + sub + '-offen');
        await js("(function () {" +
          "var d = document.querySelectorAll('#sub-" + sub + " details[data-klappe]');" +
          "Array.prototype.forEach.call(d, function (x) { x.open = false; });" +
          "return 'zu'; })()");
      }
    }
  }
  return { seiten: nr, dateien };
}

/* Hartes Zeitlimit: eine haengende Probe ist ein Befund, kein Grund zu warten. */
setTimeout(() => { console.error('UI-Aufnahmen: Zeitlimit (600 s) erreicht.'); app.exit(2); }, 600000);

let gestartet = false;
app.on('browser-window-created', (ev, win) => {
  if (gestartet) return;
  gestartet = true;
  win.webContents.once('did-finish-load', async () => {
    try {
      /* Die Start-Renderings (Skeletons, erste Abrufe) abwarten - Rezept §6 nennt 7 s. */
      await schlaf(7000);
      const erg = await lauf(win);
      /* Die Textmengen neben die Bilder legen - sie gehoeren zur selben Aufnahme
       * und sollen ohne die Sitzung nachlesbar sein, in der sie entstanden sind. */
      fs.writeFileSync(path.join(ZIEL, 'textmenge.json'),
        JSON.stringify({ stand: new Date().toISOString(), kunstdaten: KUNSTDATEN, panels: TEXTMENGE }, null, 2));
      console.log('UI-Aufnahmen: ' + erg.seiten + ' Seiten, ' + erg.dateien + ' Dateien in ' + ZIEL);
      console.log('Textmenge: ' + TEXTMENGE.length + ' Panels, Summe ' +
        TEXTMENGE.reduce((s, x) => s + Math.max(0, x.zeichen), 0) + ' Zeichen (textmenge.json)');
      app.exit(0);
    } catch (e) {
      console.error('UI-Aufnahmen abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
