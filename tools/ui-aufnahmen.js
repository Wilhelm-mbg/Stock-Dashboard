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
 *   .\node_modules\.bin\electron.cmd tools\ui-aufnahmen.js <Zielordner> [--kunstdaten] [--breite 1024] [--messung]
 *
 * --messung legt Blockmessung und Satzzaehlung zusaetzlich nach
 * wiki/aufnahmen/laufzeit.json ab - das ist die Datei, die die Sperrklinke in
 * test-v6 (Abschnitt 73) liest. Ohne den Schalter fasst die Probe das Repo nicht an.
 *
 * --breite setzt die Fensterbreite (Vorgabe 1280). Sie ist seit Stufe 4 ein eigener
 * Schalter, weil die Kopfzeile bei 1280 UND bei 1024 px einzeilig bleiben muss -
 * eine Aussage, die man nur mit zwei Aufnahmen belegen kann.
 * Seit dem 04.09.2026 misst die Probe bei jeder Breite auch den RUMPF: passt jedes
 * Panel ins Fenster, oder bekommt die Seite eine waagerechte Bildlaufleiste? Die
 * Zahlen stehen in textmenge.json unter "bildlauf". Stufe 4 hatte fuer 1024 px nur
 * die Kopfzeile gemessen - so kam F1 der UI-QS durch.
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
/* --messung: die Blockmessung und die Satzzaehlung zusaetzlich nach
 * wiki/aufnahmen/laufzeit.json legen. Dort liest sie die Sperrklinke in test-v6
 * (Abschnitt 73). Bewusst ein eigener Schalter - siehe Begruendung unten. */
const MESSUNG_ABLEGEN = process.argv.indexOf('--messung') > -1;
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


/* ---- Passt der Rumpf ins Fenster? (Rumpf bei 1024, 04.09.2026) ----
 * Stufe 4 hat fuer 1024 px nur die KOPFZEILE gemessen. Der Rumpf ist nie gemessen
 * worden - und genau dort lag F1 der UI-QS vom 04.09.2026: die Tabelle "Offene
 * Positionen" reichte bei 1024 px bis x = 1040 bei clientWidth 1014, der Knopf
 * "Schliessen" endete bei 1032 und war ohne seitliches Scrollen nicht erreichbar.
 * Sichtbar war das nur MIT offener Intraday-Position, also nur mit --kunstdaten.
 *
 * Gemessen wird die EIGENSCHAFT, nicht das Aussehen: scrollWidth des Dokuments
 * gegen seine clientWidth. Sind sie gleich, gibt es keine waagerechte
 * Bildlaufleiste; ist scrollWidth groesser, liegt etwas ausserhalb des Fensters -
 * unabhaengig davon, ob man es auf einer Aufnahme erkennt. Dazu kommen die
 * Elemente, deren rechte Kante ueber die clientWidth hinausragt: ohne sie waere
 * die Zahl ein Alarm ohne Ort.
 * Ein Kasten, der SELBST scrollt (overflow-x: auto), ist ausdruecklich in Ordnung -
 * er verbreitert das Dokument nicht. Deshalb wird auch nur das Dokument gemessen
 * und nicht jeder Kasten: die Frage ist "scrollt die SEITE", nicht "scrollt hier
 * irgendwo etwas".
 * Die Zahl ist Beleg fuer die Uebergabe UND Grundlage der Sperrklinke in
 * tools/ui-probe.js - dort entscheidet dieselbe Messung ueber rot und gruen. */
const BILDLAUF = [];
async function bildlaufMessen(js, name, sel) {
  const m = await js("(function () {" +
    "var de = document.documentElement;" +
    "var cw = de.clientWidth, sw = de.scrollWidth;" +
    "var wurzel = document.querySelector('" + sel + "');" +
    "var raus = [];" +
    "if (wurzel && sw > cw) {" +
      "var alle = wurzel.querySelectorAll('*');" +
      "for (var i = 0; i < alle.length && raus.length < 12; i++) {" +
        "var e = alle[i];" +
        "if (!e.offsetParent && e.tagName !== 'TABLE') continue;" +
        "var r = e.getBoundingClientRect();" +
        "if (r.width === 0 && r.height === 0) continue;" +
        "if (Math.round(r.right) <= cw) continue;" +
        "var pfad = [], p = e;" +
        "for (var k = 0; k < 4 && p && p.tagName; k++) {" +
          "pfad.unshift(p.tagName.toLowerCase() + (p.id ? '#' + p.id : '') +" +
            "(p.className && typeof p.className === 'string' ? '.' + p.className.split(' ')[0] : ''));" +
          "p = p.parentElement; }" +
        "raus.push({ pfad: pfad.join(' > '), rechts: Math.round(r.right)," +
          "txt: (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) });" +
      "}" +
    "}" +
    "return { scrollWidth: sw, clientWidth: cw, raus: raus }; })()");
  const eintrag = { seite: name, panel: sel, scrollWidth: m.scrollWidth, clientWidth: m.clientWidth,
                    ueber: m.scrollWidth - m.clientWidth, raus: m.raus };
  BILDLAUF.push(eintrag);
  if (eintrag.ueber > 0) {
    console.log('  BILDLAUF ' + name + ': scrollWidth ' + m.scrollWidth + ' > clientWidth ' + m.clientWidth +
      ' (+' + eintrag.ueber + ' px)' +
      (m.raus.length ? ' - ganz rechts: ' + m.raus[m.raus.length - 1].pfad + ' bis x=' +
        m.raus[m.raus.length - 1].rechts : ''));
  }
  return eintrag;
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

/* ---- Dauertext JE BLOCK, an der LAUFENDEN Instanz (F9/F10 der UI-QS, 04.09.2026) ----
 * Die Messung darueber (laeufeMessen) sucht den laengsten Lauf in EINEM Blattknoten.
 * Sie findet die eine lange Zeile, aber nicht den Block, der aus fuenf mittellangen
 * Absaetzen eine Wand baut - und genau so sind F9 (1.304 Zeichen, wendeui.js) und
 * F10 (439 Zeichen, depot.js) durch beide bisherigen Klinken gekommen: die
 * Markup-Klinke (test-v6, Abschnitt 65) sieht den Renderer nicht, die Blatt-Messung
 * sieht die Summe nicht.
 *
 * Ein BLOCK ist hier, was auch der Leser als Block sieht: section / .card / .panel /
 * details MIT Ueberschrift (h1-h4 oder summary). Gezaehlt wird der Text, der dem
 * Block SELBST gehoert; Text in einem verschachtelten Block gehoert dem inneren.
 *
 * Nicht mitgezaehlt wird, jedes aus einem eigenen Grund:
 *   0. Die Ueberschrift selbst (h1-h4). Sie benennt den Block, sie ist nicht sein
 *      Dauertext - sonst waere ein Block mit langem Titel allein deshalb eine Wand.
 *   1. Tabellen und Listen (ul/ol/dl) - das sind Daten, kein Dauertext.
 *   2. Bedienelemente (button, select, option, textarea, label, summary, svg).
 *   3. Unsichtbares: hidden, display:none, und der Inhalt gewoehnlicher <details>
 *      (eine Vertiefung, an der man nicht vorbeiscrollen muss - dieselbe Regel wie
 *      in test-v6 Abschnitt 65). details[data-klappe] ist dagegen selbst ein Block
 *      und zaehlt mit; der Maschinenraum ist nicht ausgenommen.
 *   4. Messaussagen-Kaesten ([data-mess]) und die Weissliste oben. Ein Messergebnis
 *      darf nie gegen eine Zeichengrenze laufen - sonst kuerzt irgendwann jemand
 *      eine Messaussage, um eine Klinke gruen zu bekommen.
 *
 * Der Schluessel eines Blocks ist seine UEBERSCHRIFT, nicht seine Kennung: eine
 * Ausnahmeliste, die auf ".panel" zeigt, sagt niemandem, was sie erlaubt.
 *
 * Grenze der Messung: zwei Bloecke mit gleicher Ueberschrift UND gleicher Kennung
 * fallen zusammen. Das macht die Zahl groesser, nie kleiner - die Klinke wird davon
 * lauter, nicht leiser.
 *
 * Zweite Grenze, und sie wird MITGEMELDET statt verschwiegen: Text, der in gar
 * keinem Block steht (direkt in der Pille, in einem <div> ohne Klasse), gehoert zu
 * keiner Ueberschrift und laesst sich keinem Block zurechnen. Er landet in
 * "ohneBlock" - eine Messung, die etwas nicht sieht, muss sagen wie viel. */
const BLOECKE = [];
const BLOCK_JS = "(function (sel) {" +
  "var weiss = " + JSON.stringify(WEISS) + ";" +
  "var wurzel = document.querySelector(sel); if (!wurzel) return [];" +
  "var BLOCKSEL = 'section, .card, .panel, details';" +
  "var RAUS = 'h1, h2, h3, h4, table, ul, ol, dl, button, select, option, textarea, label, summary, svg, [hidden], [data-mess], details:not([data-klappe])';" +
  /* Die Ueberschrift muss ueber Laeufe hinweg DIESELBE sein, sonst zeigt eine
   * Ausnahmeliste morgen ins Leere. Deshalb fliegen raus: die Statuszeile der
   * Klappe (sie traegt eine Uhrzeit), Knoepfe (das "i" des Erklaerknopfs) und alles
   * ab dem ersten Gedankenstrich - dort beginnt der Untertitel, und der ist genau
   * der Text, den ein Schnitt aendert. */
  "function kopfText(h) {" +
    "var c = h.cloneNode(true);" +
    "Array.prototype.forEach.call(c.querySelectorAll('.klappe-stand, button'), function (x) { x.remove(); });" +
    "var t = (c.textContent || '').replace(/\\s+/g, ' ').trim();" +
    "var schnitt = t.search(/\\s[\\u2013\\u2014-]\\s/);" +
    "if (schnitt > 8) t = t.slice(0, schnitt);" +
    "return t.slice(0, 60).trim() || null; }" +
  "function kopf(b) {" +
    "var h = b.querySelector('h1, h2, h3, h4, summary'); if (!h) return null;" +
    "if (h.closest(BLOCKSEL) !== b) return null;" +
    "return kopfText(h); }" +
  /* Nicht jeder Block traegt seine Ueberschrift IN sich. #positionsPanel auf "Heute"
   * ist ein .panel, und das <h2>Offene Positionen</h2> steht als Geschwister davor -
   * genau darunter sass F10. Ein Block ohne eigene Ueberschrift bekommt deshalb die
   * naechste Ueberschrift VOR ihm, denn das ist die, unter der ein Leser ihn liest. */
  "function vorKopf(b) {" +
    "var p = b.previousElementSibling;" +
    "while (p) {" +
      "if (p.matches(BLOCKSEL)) return null;" +
      "if (/^H[1-4]$/.test(p.tagName)) return kopfText(p);" +
      "var hs = p.querySelectorAll('h1, h2, h3, h4');" +
      "if (hs.length) return kopfText(hs[hs.length - 1]);" +
      "p = p.previousElementSibling; }" +
    "return null; }" +
  "function kennung(b) {" +
    "if (b.getAttribute && b.getAttribute('data-klappe')) return '[' + b.getAttribute('data-klappe') + ']';" +
    "return b.id ? '#' + b.id" +
      ": (b.className && typeof b.className === 'string' ? '.' + b.className.split(' ')[0] : b.tagName.toLowerCase()); }" +
  "var karte = new Map(), ohne = '', lauf = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT), n;" +
  "while ((n = lauf.nextNode())) {" +
    "var roh = (n.nodeValue || '').replace(/\\s+/g, ' ');" +
    "if (!roh.trim()) continue;" +
    "var e = n.parentElement; if (!e) continue;" +
    "if (!e.offsetParent) continue;" +
    "if (e.closest(RAUS)) continue;" +
    "var w = e, drin = false;" +
    "while (w) { if (w.id && weiss.indexOf(w.id) >= 0) { drin = true; break; } w = w.parentElement; }" +
    "if (drin) continue;" +
    "var b = e.closest(BLOCKSEL), ueber = null;" +
    "while (b) { ueber = kopf(b) || vorKopf(b); if (ueber) break;" +
      "b = b.parentElement && b.parentElement.closest(BLOCKSEL); }" +
    "if (!b || !ueber) { ohne += roh; continue; }" +
    "var k = ueber + ' \\u00b7 ' + kennung(b);" +
    "var d = karte.get(k); if (!d) { d = { ort: k, txt: '' }; karte.set(k, d); }" +
    "d.txt += roh; }" +
  "var out = [];" +
  "karte.forEach(function (d) {" +
    "var t = d.txt.replace(/\\s+/g, ' ').trim();" +
    "if (t.length > 0) out.push({ ort: d.ort, len: t.length, anfang: t.slice(0, 120) }); });" +
  "out.sort(function (a, b2) { return b2.len - a.len; });" +
  "var rest = ohne.replace(/\\s+/g, ' ').trim();" +
  "return { bloecke: out, ohneBlock: { len: rest.length, anfang: rest.slice(0, 200) } }; })";
async function bloeckeMessen(js, name, sel) {
  const f = await js(BLOCK_JS + "('" + sel + "')");
  BLOECKE.push({ seite: name, sel: sel, bloecke: f.bloecke, ohneBlock: f.ohneBlock });
  const ueber = f.bloecke.filter((x) => x.len > 240);
  if (ueber.length) {
    console.log('  Bloecke ueber 240: ' + ueber.map((x) => x.ort + ' (' + x.len + ')').join(', '));
  }
  if (f.ohneBlock.len > 240) console.log('  ausserhalb aller Bloecke: ' + f.ohneBlock.len + ' Zeichen');
  return f;
}

/* ---- Wie oft steht ein Satz IN DER APP? (F5 der UI-QS, 04.09.2026) ----
 * Die Zusicherung "Gehandelt wird hiervon nichts" wurde bis 04.09.2026 in
 * index.html gezaehlt. Dort stand sie dreimal - in der App achtmal, weil das
 * Erklaerregister sie noch fuenfmal als Fusszeile fuehrte. Das ist die Fehlerform
 * "die Klinke prueft die Datei, nicht das Verhalten" (wiki/fehlerformen.md).
 *
 * Hier wird gezaehlt, was ein Leser tatsaechlich erreichen kann: der sichtbare Text
 * jeder Pille PLUS der Text hinter jedem i-Knopf dieser Pille. Der Erklaerkasten ist
 * ein einziger #infoPop - es kann immer nur EINER offen sein, also wird jeder Knopf
 * einzeln geoeffnet, gelesen und wieder geschlossen. Geklickt werden ausschliesslich
 * [data-info]-Knoepfe: die stehen auf keiner Sperrliste, sie oeffnen ein Fenster und
 * loesen sonst nichts aus. */
const SAETZE = ['Gehandelt wird hiervon nichts'];
const SATZFUNDE = [];
function satzZaehlen(text, satz) {
  var n = 0, i = 0;
  while ((i = text.indexOf(satz, i)) > -1) { n++; i += satz.length; }
  return n;
}
async function satzMessen(js, name, sel) {
  const sichtbar = await js("(function () { var e = document.querySelector('" + sel + "');" +
    "return e ? e.innerText : ''; })()");
  const knoepfe = await js("document.querySelectorAll('" + sel + " button[data-info]').length");
  const erklaer = [];
  for (let i = 0; i < knoepfe; i++) {
    const t = await js("(function () {" +
      "var b = document.querySelectorAll('" + sel + " button[data-info]')[" + i + "];" +
      "if (!b) return null;" +
      "b.click();" +
      "var p = document.getElementById('infoPop');" +
      "var t2 = (p && p.style.display !== 'none') ? p.innerText : '';" +
      "b.click();" +
      "return { schluessel: b.getAttribute('data-info'), text: t2 }; })()");
    if (t && t.text) erklaer.push(t);
  }
  const eintrag = { seite: name, sel: sel, iKnoepfe: knoepfe, saetze: {} };
  SAETZE.forEach(function (satz) {
    const imInfo = erklaer.map((x) => ({ schluessel: x.schluessel, n: satzZaehlen(x.text, satz) }))
      .filter((x) => x.n > 0);
    eintrag.saetze[satz] = {
      sichtbar: satzZaehlen(sichtbar, satz),
      hinterKnopf: imInfo.reduce((s, x) => s + x.n, 0),
      knoepfe: imInfo.map((x) => x.schluessel)
    };
  });
  SATZFUNDE.push(eintrag);
  SAETZE.forEach(function (satz) {
    const z = eintrag.saetze[satz];
    if (z.sichtbar || z.hinterKnopf) {
      console.log('  "' + satz + '": ' + z.sichtbar + ' sichtbar, ' + z.hinterKnopf +
        ' hinter i-Knopf (' + z.knoepfe.join(', ') + ')');
    }
  });
  return eintrag;
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
      await bloeckeMessen(js, tab, '#tab-' + tab);
      await bildlaufMessen(js, tab, '#tab-' + tab);
      await satzMessen(js, tab, '#tab-' + tab);
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
      await bloeckeMessen(js, tab + '/' + sub, '#sub-' + sub);
      await bildlaufMessen(js, tab + '/' + sub, '#sub-' + sub);
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
        await bloeckeMessen(js, tab + '/' + sub + ' (Klappen offen)', '#sub-' + sub);
        await bildlaufMessen(js, tab + '/' + sub + ' (Klappen offen)', '#sub-' + sub);
        dateien += await aufnehmen(win, String(nr).padStart(2, '0') + '-' + tab + '-' + sub + '-offen');
        /* Die Satzzaehlung laeuft genau EINMAL je Pille, und zwar im OFFENEN
         * Zustand: sonst fehlte, was in einer Klappe steht - oder es waere doppelt
         * gezaehlt, weil dieselbe Pille zweimal aufgenommen wird. */
        await satzMessen(js, tab + '/' + sub, '#sub-' + sub);
        await js("(function () {" +
          "var d = document.querySelectorAll('#sub-" + sub + " details[data-klappe]');" +
          "Array.prototype.forEach.call(d, function (x) { x.open = false; });" +
          "return 'zu'; })()");
      } else {
        await satzMessen(js, tab + '/' + sub, '#sub-' + sub);
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
      const messung = { stand: new Date().toISOString(), kunstdaten: KUNSTDATEN, breite: BREITE,
                        kopfzeile: KOPFZEILE, panels: TEXTMENGE, dauertext: LAEUFE,
                        bildlauf: BILDLAUF, bloecke: BLOECKE, saetze: SATZFUNDE };
      fs.writeFileSync(path.join(ZIEL, 'textmenge.json'), JSON.stringify(messung, null, 2));
      /* --messung: dieselbe Messung zusaetzlich ins Repo, wo die Sperrklinke sie
       * liest (test-v6, Abschnitt 73). OHNE den Schalter schreibt die Probe nichts
       * ins Repo - eine Probe, die nebenbei Quellcode-Ordner aendert, ist eine, der
       * man beim naechsten Mal nicht mehr traut. Abgelegt werden nur Blockmessung
       * und Satzzaehlung; Aufnahmen und Textmengen bleiben beim Beleg. */
      if (MESSUNG_ABLEGEN) {
        const ablage = path.join(WURZEL, 'wiki', 'aufnahmen', 'laufzeit.json');
        fs.writeFileSync(ablage, JSON.stringify({
          stand: messung.stand, kunstdaten: KUNSTDATEN, breite: BREITE,
          werkzeug: 'tools/ui-aufnahmen.js <ziel> --kunstdaten --messung',
          bloecke: BLOECKE, saetze: SATZFUNDE
        }, null, 2) + '\n');
        console.log('Messung abgelegt: ' + ablage);
      }
      console.log('UI-Aufnahmen: ' + erg.seiten + ' Seiten, ' + erg.dateien + ' Dateien in ' + ZIEL);
      console.log('Textmenge: ' + TEXTMENGE.length + ' Panels, Summe ' +
        TEXTMENGE.reduce((s, x) => s + Math.max(0, x.zeichen), 0) + ' Zeichen (textmenge.json)');
      const eng = BILDLAUF.filter((b) => b.ueber > 0);
      console.log('Bildlauf bei ' + BREITE + ' px: ' + BILDLAUF.length + ' Panels gemessen, ' +
        (eng.length ? eng.length + ' breiter als das Fenster (' +
          eng.map((b) => b.seite + ' +' + b.ueber).join(', ') + ')'
                    : 'keines breiter als das Fenster'));
      app.exit(0);
    } catch (e) {
      console.error('UI-Aufnahmen abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
