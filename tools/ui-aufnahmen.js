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
 *   .\node_modules\.bin\electron.cmd tools\ui-aufnahmen.js <Zielordner> [--kunstdaten] [--breite 1024]
 *
 * --breite setzt die Fensterbreite (Vorgabe 1280). Sie ist seit Stufe 4 ein eigener
 * Schalter, weil die Kopfzeile bei 1280 UND bei 1024 px einzeilig bleiben muss -
 * eine Aussage, die man nur mit zwei Aufnahmen belegen kann.
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
  /* Das Kunst-ARCHIV liegt nicht im Store, sondern im Datenordner - dort sucht
   * kerzenquelle.js. In der isolierten Instanz ist das TESTROOT/downloads, also
   * ebenfalls unter %TEMP%: der echte Datenordner wird nicht angefasst. Ohne diesen
   * Bestand zeigt die Archiv-Grafik fuenf leere Balken und belegt nichts. */
  /* Der Reiter Markt (Stufe 5) haengt an drei Quellen. Zwei davon sind Dateien und
   * werden hier gelegt: die Stammdaten (Branche, Aktienanzahl) und Tagesreihen im
   * Tagesarchiv. Die dritte sind LAUFENDE Kurse - die gibt es ohne Netz nicht, und
   * eine Testinstanz soll auch keins bekommen. Deshalb kommt zusaetzlich der
   * gemerkte Stand in den Store, denselben Schluessel, den marktui.js schreibt.
   * Gerechnet ist er mit den echten Funktionen aus markt/uebersicht.js. */
  fs.writeFileSync(path.join(sd, 'marktUeberblickStand.json'), JSON.stringify(KD.marktstand(jetzt)));
  const dd = path.join(TESTROOT, 'downloads', 'Markt-Dashboard-Daten');
  KD.archiv(jetzt).concat(KD.marktArchiv(jetzt)).forEach((f) => {
    const ziel = path.join(dd, f.pfad.replace(/\//g, path.sep));
    fs.mkdirSync(path.dirname(ziel), { recursive: true });
    fs.writeFileSync(ziel, JSON.stringify(f.inhalt));
  });
  const md = path.join(dd, 'markt');
  fs.mkdirSync(md, { recursive: true });
  fs.writeFileSync(path.join(md, 'stammdaten.json'), JSON.stringify(KD.marktStammdaten(jetzt)));
  console.log('Kunstdaten in den Test-Store geschrieben: ' + sd);
  console.log('Kunst-Archiv und Kunst-Stammdaten in den Test-Datenordner geschrieben: ' + dd);
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

/* --breite <px>: die Fensterbreite. Vorgabe bleibt 1280 - jede aeltere Aufnahme ist
 * damit entstanden, und zwei Saetze mit stillschweigend verschiedener Breite waeren
 * nicht vergleichbar. */
const BREITE = (function () {
  const i = process.argv.indexOf('--breite');
  const n = i > -1 ? parseInt(process.argv[i + 1], 10) : NaN;
  return isFinite(n) && n >= 320 && n <= 3840 ? n : 1280;
})();
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


/* ---- Steht die Kopfzeile in EINER Zeile? (Oberflaeche Stufe 4, 03.09.2026) ----
 * Der Simulations-Satz aus Stufe 3 drueckte die vier Knoepfe bei 1280 px in eine
 * zweite Reihe. Die Marke soll das beheben - und "soll" ist keine Aussage, solange
 * es niemand misst. Gemessen wird die EIGENSCHAFT, nicht das Aussehen: liegen alle
 * sieben Teile der Kopfzeile in einem gemeinsamen waagerechten Band, dann ist es
 * eine Zeile. Ein Vergleich der oberen Kanten allein taete es nicht - die Kopfzeile
 * richtet an der Schriftgrundlinie aus, und ein h1 sitzt dabei hoeher als ein Knopf.
 */
let KOPFZEILE = null;
async function kopfzeileMessen(js) {
  KOPFZEILE = await js("(function () {" +
    "var sel = ['header h1', 'header .simmarke', '#stamp', '#refreshBtn', '#glossarBtn', '#themeBtn', '#settingsBtn'];" +
    "var teile = sel.map(function (s) {" +
      "var e = document.querySelector(s);" +
      "if (!e) return { sel: s, fehlt: true };" +
      "var r = e.getBoundingClientRect();" +
      "return { sel: s, oben: Math.round(r.top), unten: Math.round(r.bottom), links: Math.round(r.left), breite: Math.round(r.width) };" +
    "});" +
    "var da = teile.filter(function (t) { return !t.fehlt; });" +
    "var kopf = document.querySelector('header').getBoundingClientRect();" +
    "return { fensterBreite: window.innerWidth," +
      "kopfHoehe: Math.round(kopf.height)," +
      "einzeilig: Math.max.apply(null, da.map(function (t) { return t.oben; }))" +
        "< Math.min.apply(null, da.map(function (t) { return t.unten; }))," +
      "fehlend: teile.filter(function (t) { return t.fehlt; }).map(function (t) { return t.sel; })," +
      "teile: teile }; })()");
  console.log('Kopfzeile bei ' + KOPFZEILE.fensterBreite + ' px: ' +
    (KOPFZEILE.einzeilig ? 'EINE Zeile' : 'MEHRZEILIG') + ', ' + KOPFZEILE.kopfHoehe + ' px hoch' +
    (KOPFZEILE.fehlend.length ? ' - fehlt: ' + KOPFZEILE.fehlend.join(', ') : ''));
}

/* ---- Der laengste Dauertext-Lauf, GEMESSEN AM LAUFENDEN PANEL ----
 * Die Sperrklinke in test-v6 (65) Schnitt) liest index.html. Sie kann deshalb nur
 * finden, was IM MARKUP steht - ein Absatz, den erst der Renderer schreibt, ist fuer
 * sie unsichtbar. Genau so ist der Marktlage-Absatz (297 Zeichen, depot.js
 * renderRegime) durch Stufe 3 gekommen. Diese Messung schliesst die Luecke von der
 * anderen Seite: sie liest den DOM in genau dem Zustand, den die Aufnahme daneben
 * zeigt. Sie ist ein BELEG fuer die Uebergabe, keine Sperrklinke - der Ausschnitt
 * eines Blattknotens ist eine Naeherung, und eine Klinke auf einer Naeherung waere
 * eine, von der niemand weiss, was sie prueft. */
const WEISS = ['idKlartext', 'antwortSeite', 'kostenHuerde', 'mfErklaerung', 'wendeUrteil'];
const LAEUFE = [];
async function laeufeMessen(js, name, sel) {
  const f = await js("(function () {" +
    "var weiss = " + JSON.stringify(WEISS) + ";" +
    "var wurzel = document.querySelector('" + sel + "'); if (!wurzel) return [];" +
    "var BLOCK = 'div,p,h1,h2,h3,h4,h5,li,ul,ol,section,details,summary,label,table,thead,tbody,tr,td,th,nav,header,footer,button,select,option,textarea,svg,dl,dt,dd,form';" +
    "var out = [], alle = wurzel.querySelectorAll('*');" +
    "for (var i = 0; i < alle.length; i++) {" +
      "var e = alle[i];" +
      "if (e.querySelector(BLOCK)) continue;" +
      "if (e.closest('details:not([data-klappe])') || e.closest('[hidden]')) continue;" +
      "if (e.closest('button, select, summary, label, svg')) continue;" +
      "if (!e.offsetParent) continue;" +
      "var p = e, drin = false;" +
      "while (p) { if (p.id && weiss.indexOf(p.id) >= 0) { drin = true; break; } p = p.parentElement; }" +
      "if (drin) continue;" +
      "var t = (e.innerText || '').replace(/\\s+/g, ' ').trim();" +
      "if (t.length > 240) out.push({ ort: e.id ? '#' + e.id : (e.className ? '.' + String(e.className).split(' ')[0] : e.tagName), len: t.length, txt: t.slice(0, 100) });" +
    "}" +
    "return out; })()");
  LAEUFE.push({ seite: name, sel: sel, funde: f });
  if (f.length) console.log('  Dauertext ueber 240: ' + f.map(function (x) { return x.ort + ' (' + x.len + ')'; }).join(', '));
  return f;
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

  await kopfzeileMessen(js);

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
      await laeufeMessen(js, tab, '#tab-' + tab);
      dateien += await aufnehmen(win, String(nr).padStart(2, '0') + '-' + tab);
      continue;
    }
    for (const sub of subs) {
      await js("(function () { var b = document.querySelector('#tab-" + tab + " .pills [data-sub=\"" + sub + "\"]'); if (b) b.click(); return 'ok'; })()");
      await schlaf(900);
      nr++;
      console.log('Reiter ' + tab + ' / Pille ' + sub + ':');
      await textmenge(js, tab + '/' + sub, '#sub-' + sub);
      await laeufeMessen(js, tab + '/' + sub, '#sub-' + sub);
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
        await laeufeMessen(js, tab + '/' + sub + ' (Klappen offen)', '#sub-' + sub);
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
        JSON.stringify({ stand: new Date().toISOString(), kunstdaten: KUNSTDATEN, breite: BREITE,
                         kopfzeile: KOPFZEILE, panels: TEXTMENGE, dauertext: LAEUFE }, null, 2));
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
