'use strict';
/* ====== Auditor, vertiefte Probe (Nacht auf den 27.08.2026) ======
 *
 * Aenderungsmenge d964891..04c9be5 (117 Commits). Oberflaechen-Dateien darin:
 * index.html, scoreboard.js, archivkarte.js (NEU), depot.js, explorer.js,
 * strategien.js, strategiechart.js, quant.js, app-shell.js, kurse.js.
 * Daraus die vier Schwerpunkte dieser Nacht:
 *
 *  A  SCOREBOARD (Messung). Zwei neue Spalten - "Feinheit" (delta80 in
 *     Prozentpunkten) und "Aussicht" (Signaltage) - und die dreigeteilte
 *     Tabelle mit der Aufloesungswand, die an der LIVE-Kostenhuerde aus
 *     DepotAPI.kostenHuerde() trennt. Dazu label() -> U.urteilText (#102).
 *     Genau hier ist am 26.08. schon einmal ein roher Schluessel sichtbar
 *     geworden, und genau hier wurden Prozentpunkte und Tage verwechselt.
 *     Ohne Messprotokolle im Datenordner ist das alles nur ein Leerzustand,
 *     deshalb werden die Protokolle des Repos GESAET.
 *  B  KURSARCHIV (Werkzeuge -> Kursarchiv). Vollstaendig neue Pille und neue
 *     Datei. Sie laedt ueber das Ereignis 'sub-changed' nach - eine Karte,
 *     die nur beim Aufschlagen laedt, ist die Sorte, die im Leerlauf haengen
 *     bleibt. Geprueft wird, ob sie ueberhaupt aus "Sehe im Archiv nach ..."
 *     herauskommt und was danach dort steht.
 *  C  PERZENTIL STATT ROH-GUETE (#80). explorer.js und strategiechart.js
 *     zeigen jetzt "besser als X % des Zufalls". Q.gueteZufallsAnteil wird
 *     direkt in der Seite gegen ihre eigene Eichtabelle geprueft, und die
 *     Beschriftungen werden im Wortlaut gelesen.
 *  D  ROTATION: der Reiter STRATEGIEN, vollstaendig (alle sechs Pillen).
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-27\probe.js
 *
 * Der Vorspann stammt aus tools/ui-probe.js - er ist der Grund, warum die Probe die
 * echte Installation nicht anfasst. ACHTUNG: WURZEL geht von hier DREI Ebenen hoch.
 *
 * Geklickt wird ausschliesslich Navigation (Reiter und Pillen). Kein Knopf, der
 * handelt, zuruecksetzt, laeuft oder kostet - siehe Sperrliste im Auftrag. Der
 * Knopf "Jetzt holen" der neuen Archivkarte faellt ausdruecklich darunter: er
 * startet einen echten Sammellauf gegen Yahoo. Er wird gelesen, nicht gedrueckt. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor27-'));
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

/* ---- Saatgut ----------------------------------------------------------------
 * Geschrieben wird ausschliesslich in das frische TESTROOT unter %TEMP%. Der
 * Speicher und der Datenordner des Anwenders werden weder gelesen noch angefasst.
 * Die Protokolle kommen aus dem Repo (nur gelesen) an die Stelle, an der main.js
 * sie sucht. */
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
  const werte = [
    { sym: 'AAPL', name: 'Apple Inc.', stueck: 12, isin: 'US0378331005', wkn: null, seit: 1 },
    { sym: 'NVDA', name: 'NVIDIA Corporation', stueck: 40, isin: 'US67066G1040', wkn: null, seit: 1 }
  ];
  fs.writeFileSync(path.join(sd, 'bestand.json'), JSON.stringify({ stand: 1, werte: werte }), 'utf8');
  console.log('PROTOKOLLE=' + n + ' -> ' + ziel);
  return n;
}
const SAATZAHL = saatLegen();

const BILDER = path.join(TESTROOT, 'bilder');
fs.mkdirSync(BILDER, { recursive: true });

/* ---- Allgemeine Messung. Laeuft IN der Seite, liest nur ----------------------
 * Uebernommen aus dem Lauf vom 26.08. (dritter Lauf), unveraendert bis auf
 * Punkt 9: rohe Bindestrich-Schluessel im sichtbaren Text. Das war #102, und
 * mit U.urteilText ist die Uebersetzung jetzt an einer Stelle - also lohnt die
 * Gegenprobe ueber ALLE Reiter, nicht nur ueber die eine reparierte Zeile. */
const MESSCODE = '(function (marke) {' +
  'var raus = { marke: marke, unfertig: [], ueberlauf: [], ausgelaufen: [],' +
  ' ueberlappung: [], unsichtbarBedienbar: [], ohneNamen: [], leerekarten: [], umbruch: [], rohschluessel: [] };' +
  'function sichtbar(el) {' +
  '  var s = getComputedStyle(el);' +
  '  if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;' +
  '  var r = el.getBoundingClientRect();' +
  '  return !!(el.offsetParent || s.position === "fixed") && r.width >= 0 && r.height >= 0; }' +
  'function kurz(el) {' +
  '  var t = (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ?' +
  '    "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".") : "");' +
  '  return (el.tagName.toLowerCase() + t).slice(0, 80); }' +
  'function pfad(el) {' +
  '  var out = [], n = el, i = 0;' +
  '  while (n && n.nodeType === 1 && i < 4) { out.unshift(kurz(n)); n = n.parentElement; i++; }' +
  '  return out.join(" > "); }' +
  /* --- 1. unfertige Werte im SICHTBAREN Text --- */
  'var muster = /(^|[^A-Za-z0-9_])(NaN|undefined|null|Infinity|-Infinity|\\[object Object\\])([^A-Za-z0-9_]|$)/;' +
  'var lauf = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);' +
  'var kn; var gesehen = 0;' +
  'while ((kn = lauf.nextNode()) && gesehen < 4000) {' +
  '  gesehen++;' +
  '  var txt = kn.nodeValue; if (!txt || !muster.test(txt)) continue;' +
  '  var el = kn.parentElement; if (!el || !sichtbar(el)) continue;' +
  '  if (el.closest("script, style, template")) continue;' +
  '  raus.unfertig.push({ text: txt.trim().slice(0, 120), wo: pfad(el) }); }' +
  /* --- 2. waagerechter Ueberlauf: Dokument und je Karte --- */
  'var de = document.documentElement;' +
  'if (de.scrollWidth > de.clientWidth + 1) raus.ueberlauf.push({ wo: "document", ist: de.scrollWidth, soll: de.clientWidth });' +
  'Array.prototype.forEach.call(document.querySelectorAll(".panel, .card, .kachel"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var s = getComputedStyle(el);' +
  '  if (s.overflowX === "auto" || s.overflowX === "scroll") return;' +
  '  if (el.scrollWidth > el.clientWidth + 2) raus.ueberlauf.push({ wo: pfad(el), ist: el.scrollWidth, soll: el.clientWidth }); });' +
  /* --- 3. Inhalt, der aus seiner Karte laeuft --- */
  'Array.prototype.forEach.call(document.querySelectorAll(".panel, .card, .kachel"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var s = getComputedStyle(el);' +
  '  if (s.overflow !== "visible" || s.overflowX !== "visible") return;' +
  '  var pr = el.getBoundingClientRect(); if (pr.width < 5) return;' +
  '  Array.prototype.forEach.call(el.children, function (k) {' +
  '    if (!sichtbar(k)) return;' +
  '    var ks = getComputedStyle(k); if (ks.position === "absolute" || ks.position === "fixed") return;' +
  '    var kr = k.getBoundingClientRect(); if (kr.width < 2) return;' +
  '    if (kr.right > pr.right + 2 || kr.left < pr.left - 2) {' +
  '      raus.ausgelaufen.push({ wo: pfad(k), in: kurz(el),' +
  '        ueber: Math.round(Math.max(kr.right - pr.right, pr.left - kr.left)) }); } }); });' +
  /* --- 4. ueberlappende sichtbare Geschwister-Bedienelemente --- */
  'var bedien = Array.prototype.filter.call(document.querySelectorAll("button, a[href], select, input"), function (el) {' +
  '  if (!sichtbar(el)) return false; var r = el.getBoundingClientRect();' +
  '  return r.width > 0 && r.height > 0; });' +
  'for (var a = 0; a < bedien.length; a++) { for (var b = a + 1; b < bedien.length; b++) {' +
  '  var x = bedien[a], y = bedien[b];' +
  '  if (x.parentElement !== y.parentElement) continue;' +
  '  var rx = x.getBoundingClientRect(), ry = y.getBoundingClientRect();' +
  '  var ux = Math.min(rx.right, ry.right) - Math.max(rx.left, ry.left);' +
  '  var uy = Math.min(rx.bottom, ry.bottom) - Math.max(rx.top, ry.top);' +
  '  if (ux > 2 && uy > 2) raus.ueberlappung.push({ a: kurz(x), b: kurz(y),' +
  '    flaeche: Math.round(ux) + "x" + Math.round(uy) }); } }' +
  /* --- 5. sichtbar ausgewiesen, aber Groesse 0 oder ausserhalb des Fensters --- */
  'Array.prototype.forEach.call(document.querySelectorAll("button, a[href], [role=button]"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var r = el.getBoundingClientRect();' +
  '  if (r.width < 1 || r.height < 1) { raus.unsichtbarBedienbar.push({ wo: pfad(el), grund: "Groesse 0" }); return; }' +
  '  if (r.right < 0 || r.bottom < 0 || r.left > de.clientWidth + 400) {' +
  '    raus.unsichtbarBedienbar.push({ wo: pfad(el), grund: "ausserhalb: left=" + Math.round(r.left) }); } });' +
  /* --- 6. Barrierefreiheit: kein zugaenglicher Name --- */
  'Array.prototype.forEach.call(document.querySelectorAll("button, a[href], [role=button]"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;' +
  '  var name = (el.textContent || "").trim() || (el.getAttribute("aria-label") || "").trim() ||' +
  '    (el.getAttribute("title") || "").trim();' +
  '  if (!name && el.getAttribute("aria-labelledby")) {' +
  '    var z = document.getElementById(el.getAttribute("aria-labelledby"));' +
  '    if (z) name = (z.textContent || "").trim(); }' +
  '  if (!name) raus.ohneNamen.push({ wo: pfad(el) }); });' +
  /* --- 7. Karten, die nur aus Ueberschrift bestehen (Leerzustand fehlt) --- */
  'Array.prototype.forEach.call(document.querySelectorAll(".panel, .card"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var t = (el.innerText || "").trim();' +
  '  var hatBedien = el.querySelector("button, input, select, canvas, table, svg, img");' +
  '  if (!t && !hatBedien) raus.leerekarten.push({ wo: pfad(el) }); });' +
  /* --- 8. Zahl und Einheit auf zwei Zeilen (der Fehler aus #93) --- */
  'var zahlMuster = /^[+\\u2212-]?[\\d.,\\u00a0 ]+\\s*(%|\\$|Pp|Punkte)$/;' +
  'Array.prototype.forEach.call(document.querySelectorAll("td, th, .tile b, .tile .delta"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  var t = (el.textContent || "").trim(); if (!t || !zahlMuster.test(t)) return;' +
  '  var rg = document.createRange(); rg.selectNodeContents(el);' +
  '  var rects = rg.getClientRects(); rg.detach && rg.detach();' +
  '  var zeilen = 0, letztesOben = null;' +
  '  for (var q = 0; q < rects.length; q++) {' +
  '    if (rects[q].width < 0.5) continue;' +
  '    if (letztesOben === null || Math.abs(rects[q].top - letztesOben) > 3) { zeilen++; letztesOben = rects[q].top; } }' +
  '  if (zeilen > 1) raus.umbruch.push({ text: t.slice(0, 40), wo: pfad(el), zeilen: zeilen }); });' +
  /* --- 9. NEU: rohe Bindestrich-Schluessel im sichtbaren Text (die Familie von #102).
   * Gesucht wird der Bauplan der Urteils-Schluessel: kleingeschriebene Woerter,
   * mit Bindestrich verbunden, ohne Leerzeichen, als GANZER Zellinhalt. Fliesstext
   * mit Gedankenstrichen faellt nicht darunter, Bindestrich-Woerter der deutschen
   * Sprache ("Geld-Brief-Spanne") faellt wegen der Grossbuchstaben heraus. */
  'var rohMuster = /^[a-z]{3,}(-[a-z]{3,}){1,4}$/;' +
  'Array.prototype.forEach.call(document.querySelectorAll("td, th, b, span, li"), function (el) {' +
  '  if (!sichtbar(el)) return;' +
  '  if (el.children.length) return;' +
  '  var t = (el.textContent || "").trim();' +
  '  if (!t || t.length > 60 || !rohMuster.test(t)) return;' +
  '  raus.rohschluessel.push({ text: t, wo: pfad(el) }); });' +
  'raus.warnband = ((document.getElementById("warnband") || {}).innerText || "").trim().slice(0, 300);' +
  /* Diagnosezaehler: ein "0 Funde" ist nur dann etwas wert, wenn die Pruefung auch
   * wirklich Elemente gesehen hat. Sonst meldet eine kaputte Pruefung Ruhe. */
  'raus.geprueft = { bedienelemente: bedien.length,' +
  '  namenskandidaten: document.querySelectorAll("button, a[href], [role=button]").length,' +
  '  karten: document.querySelectorAll(".panel, .card, .kachel").length,' +
  '  zahlzellen: document.querySelectorAll("td, th").length };' +
  'raus.modalOffen = !!document.querySelector(".modal-bg.open");' +
  'return raus; })';

/* ---- A: das Scoreboard, Spalte fuer Spalte ----------------------------------
 * Gemessen wird dreierlei, das ein Blick nicht sicher hergibt:
 *  - die SPALTENZAHL je Zeile gegen die Kopfzeile (colspan mitgerechnet). Zwei
 *    neue Spalten sind der klassische Anlass fuer eine verrutschte Tabelle.
 *  - die AUSRICHTUNG der Zahlzellen. Die Koepfe tragen text-align:right als
 *    Inline-Stil, die Zellen tragen class="num" - ob die Klasse etwas bewirkt,
 *    ist eine Frage an den Rechner, nicht ans Auge.
 *  - die DREITEILUNG: welche Trennzeilen erscheinen, was in ihnen steht, und ob
 *    die Kostenhuerde, die im Satz genannt wird, die des Depots ist. */
const SCOREBOARDCODE = "(function () {" +
  "var k = document.getElementById('scoreboard');" +
  "if (!k) return { fehlt: true };" +
  "var t = k.querySelector('table');" +
  "if (!t) return { fehlt: false, tabelle: false, text: (k.innerText || '').trim().slice(0, 400) };" +
  "function spalten(r) { var n = 0;" +
  "  for (var i = 0; i < r.cells.length; i++) n += (r.cells[i].colSpan || 1); return n; }" +
  "var kopf = t.rows[0];" +
  "var kopfSpalten = spalten(kopf);" +
  "var kopfTexte = Array.prototype.map.call(kopf.cells, function (c) {" +
  "  return (c.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 60); });" +
  "var zeilen = Array.prototype.map.call(t.rows, function (r, i) {" +
  "  return { nr: i, spalten: spalten(r), klasse: r.className || ''," +
  "    trenner: r.cells.length === 1 && (r.cells[0].colSpan || 1) > 1," +
  "    text: (r.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 200) }; });" +
  "var abweichend = zeilen.filter(function (z) { return z.spalten !== kopfSpalten; });" +
  "var datenzeilen = Array.prototype.filter.call(t.rows, function (r) {" +
  "  return r.className && r.className.indexOf('sbRow') !== -1; });" +
  "function zelle(r, idx) { var c = r.cells[idx]; if (!c) return null;" +
  "  var s = getComputedStyle(c);" +
  "  return { t: (c.innerText || '').trim(), klasse: c.className || ''," +
  "    ausricht: s.textAlign, farbe: s.color," +
  "    titel: (c.querySelector('[title]') ? c.querySelector('[title]').getAttribute('title') : '').slice(0, 60) }; }" +
  "var proben = datenzeilen.slice(0, 40).map(function (r) {" +
  "  return { urteil: (r.cells[0] ? (r.cells[0].innerText || '').trim() : '')," +
  "    strategie: (r.cells[1] ? (r.cells[1].innerText || '').trim() : '')," +
  "    feinheit: zelle(r, 7), aussicht: zelle(r, 8)," +
  "    ueberschuss: zelle(r, 2), tage: zelle(r, 6) }; });" +
  "var kopfAusricht = Array.prototype.map.call(kopf.cells, function (c) {" +
  "  return { t: (c.innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 24), a: getComputedStyle(c).textAlign }; });" +
  "var huerde = null;" +
  "try { huerde = window.DepotAPI && window.DepotAPI.kostenHuerde ? window.DepotAPI.kostenHuerde() : 'kein DepotAPI'; }" +
  "catch (e) { huerde = 'Fehler: ' + (e && e.message); }" +
  "var kasten = t.parentElement;" +
  "return { fehlt: false, tabelle: true, kopfSpalten: kopfSpalten, kopfTexte: kopfTexte," +
  "  kopfAusricht: kopfAusricht, zeilenZahl: t.rows.length, datenzeilen: datenzeilen.length," +
  "  abweichendeZeilen: abweichend, trennzeilen: zeilen.filter(function (z) { return z.trenner; })," +
  "  proben: proben, huerde: huerde," +
  "  tabelleBreite: Math.round(t.getBoundingClientRect().width)," +
  "  kastenBreite: kasten ? Math.round(kasten.getBoundingClientRect().width) : null," +
  "  rollbar: kasten ? (kasten.scrollWidth > kasten.clientWidth + 2) : null," +
  "  fusstext: (function () { var f = k.querySelectorAll(':scope > div');" +
  "    return f.length ? (f[f.length - 1].innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 900) : null; })()" +
  "}; })()";

/* ---- B: die neue Kursarchiv-Karte ------------------------------------------
 * Die Karte laedt erst auf 'sub-changed'. Bleibt sie im Ladetext stehen, ist das
 * ein A-Fund und keine Frage des Geschmacks - deshalb steht der Ladetext hier
 * woertlich als Vergleich. */
const ARCHIVCODE = "(function () {" +
  "var k = document.getElementById('archivKarte');" +
  "if (!k) return { fehlt: true };" +
  "var text = (k.innerText || '').replace(/\\s+/g, ' ').trim();" +
  "var t = k.querySelector('table');" +
  "var lade = k.querySelector('.loading');" +
  "var knoepfe = Array.prototype.map.call(k.querySelectorAll('button'), function (b) {" +
  "  var r = b.getBoundingClientRect();" +
  "  return { text: (b.textContent || '').trim(), id: b.id || ''," +
  "    aus: !!b.disabled, br: Math.round(r.width), ho: Math.round(r.height)," +
  "    iv: b.getAttribute('data-iv') || '' }; });" +
  "var zeilen = t ? Array.prototype.map.call(t.rows, function (r) {" +
  "  var n = 0; for (var i = 0; i < r.cells.length; i++) n += (r.cells[i].colSpan || 1);" +
  "  return { spalten: n, teil: r.parentElement ? r.parentElement.tagName : ''," +
  "    zellen: Array.prototype.map.call(r.cells, function (c) {" +
  "      var s = getComputedStyle(c);" +
  "      return { tag: c.tagName, t: (c.innerText || '').trim().slice(0, 60)," +
  "        klasse: c.className || '', ausricht: s.textAlign," +
  "        schreibung: s.textTransform, groesse: s.fontSize }; }) }; }) : null;" +
  "var kasten = t ? t.parentElement : null;" +
  "return { fehlt: false, ladetextDa: !!lade," +
  "  ladetext: lade ? (lade.innerText || '').trim().slice(0, 120) : null," +
  "  tabelle: !!t, zeilen: zeilen, knoepfe: knoepfe," +
  "  textLaenge: text.length, text: text.slice(0, 1200)," +
  "  rollbar: kasten ? (kasten.scrollWidth > kasten.clientWidth + 2) : null," +
  "  kopfDa: !!document.querySelector('#sub-archiv h2')," +
  "  kopfText: ((document.querySelector('#sub-archiv h2') || {}).innerText || '').replace(/\\s+/g, ' ').trim().slice(0, 200)" +
  "}; })()";

/* ---- C: Perzentil statt Roh-Guete (#80) ------------------------------------
 * Q.gueteZufallsAnteil wird direkt aufgerufen - das ist netzunabhaengig und
 * deterministisch. Geprueft wird der Wertebereich (0..100, kein null bei
 * gueltigen Eingaben) und die Monotonie: eine hoehere Guete darf nie ein
 * kleineres Perzentil bekommen. Dazu die Beschriftungen im Wortlaut. */
const PERZENTILCODE = "(function () {" +
  "if (!window.Q || !Q.gueteZufallsAnteil) return { fehlt: true };" +
  "var proben = [], kaputt = [], nichtMonoton = [];" +
  "[20, 30, 50, 80, 120, 150, 200, 300].forEach(function (n) {" +
  "  var vorher = -1;" +
  "  for (var g = 0; g <= 100; g += 1) {" +
  "    var p = Q.gueteZufallsAnteil(g, n);" +
  "    if (p == null || !isFinite(p) || p < 0 || p > 100) kaputt.push({ n: n, g: g, p: p });" +
  "    else { if (p < vorher) nichtMonoton.push({ n: n, g: g, p: p, vorher: vorher }); vorher = p; } }" +
  "  proben.push({ n: n, p50: Q.gueteZufallsAnteil(50, n), p75: Q.gueteZufallsAnteil(75, n)," +
  "    p90: Q.gueteZufallsAnteil(90, n), p100: Q.gueteZufallsAnteil(100, n) }); });" +
  "return { fehlt: false, proben: proben, kaputt: kaputt.slice(0, 10)," +
  "  nichtMonoton: nichtMonoton.slice(0, 10)," +
  "  ungueltig: { textN: Q.gueteZufallsAnteil(50, 'x'), leerG: Q.gueteZufallsAnteil(null, 100) }," +
  "  kanalInfo: ((document.getElementById('expKanalInfo') || {}).textContent || '').slice(0, 300)" +
  "}; })()";

/* ---- D: Rotationsblock STRATEGIEN ------------------------------------------ */
const STRATEGIENCODE = "(function () {" +
  "var t = document.getElementById('tab-strategien'); if (!t) return { fehlt: true };" +
  "var aktiv = t.querySelector('.sub.active');" +
  "var tabellen = Array.prototype.map.call(t.querySelectorAll('.sub.active table'), function (tb) {" +
  "  var kopf = tb.rows[0];" +
  "  function sp(r) { var n = 0; for (var i = 0; i < r.cells.length; i++) n += (r.cells[i].colSpan || 1); return n; }" +
  "  return { zeilen: tb.rows.length, spalten: kopf ? sp(kopf) : 0," +
  "    ungleich: Array.prototype.filter.call(tb.rows, function (r) { return kopf && sp(r) !== sp(kopf); }).length," +
  "    erstesFeld: kopf && kopf.cells[0] ? (kopf.cells[0].innerText || '').trim().slice(0, 40) : '' }; });" +
  "var panels = Array.prototype.map.call((aktiv || t).querySelectorAll('.panel'), function (p) {" +
  "  return { kopf: ((p.querySelector('h3, h2') || {}).innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 50)," +
  "    laenge: (p.innerText || '').trim().length," +
  "    hatBedien: !!p.querySelector('button, input, select, table, svg, canvas') }; });" +
  "return { fehlt: false, aktiveSub: aktiv ? aktiv.id : null, tabellen: tabellen, panels: panels," +
  "  textLaenge: (aktiv || t).innerText.length," +
  "  ueberschriften: Array.prototype.map.call((aktiv || t).querySelectorAll('h2, h3'), function (h) {" +
  "    return (h.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 80); })" +
  "}; })()";

const funde = [];
const konsoleFehler = [];

function schluessel(o) { return JSON.stringify(o); }

/* Vieles steht auf jedem Reiter (Kopfzeile, Warnband). Ohne Entdopplung meldet die
 * Probe denselben Knopf 21-mal. Der erste Fundort gewinnt. */
const schonGesehen = Object.create(null);
function aufnehmen(marke, art, liste) {
  (liste || []).forEach((e) => {
    const k = art + '|' + schluessel(e);
    if (schonGesehen[k]) return;
    schonGesehen[k] = marke;
    funde.push({ marke, art, e });
  });
}

function aufnehmenAlle(m) {
  if (!m) return;
  aufnehmen(m.marke, 'unfertig', m.unfertig);
  aufnehmen(m.marke, 'ueberlauf', m.ueberlauf);
  aufnehmen(m.marke, 'ausgelaufen', m.ausgelaufen);
  aufnehmen(m.marke, 'ueberlappung', m.ueberlappung);
  aufnehmen(m.marke, 'unsichtbarBedienbar', m.unsichtbarBedienbar);
  aufnehmen(m.marke, 'ohneNamen', m.ohneNamen);
  aufnehmen(m.marke, 'leerekarten', m.leerekarten);
  aufnehmen(m.marke, 'umbruch', m.umbruch);
  aufnehmen(m.marke, 'rohschluessel', m.rohschluessel);
}

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

async function lauf(win) {
  const wc = win.webContents;
  const js = (code) => wc.executeJavaScript(code, true);
  await js("window.__auditor = { fehler: [] };" +
    "window.addEventListener('error', function (e) { window.__auditor.fehler.push(String(e.message || e)); });" +
    "window.addEventListener('unhandledrejection', function (e) { window.__auditor.fehler.push('unhandled: ' + String(e.reason && e.reason.message || e.reason)); });" +
    "'bereit'");

  const tabs = await js("Array.prototype.map.call(document.querySelectorAll('nav.tabs button[data-tab]'), function (b) { return b.getAttribute('data-tab'); })");
  if (!tabs || !tabs.length) throw new Error('keine Reiter gefunden');

  for (const [br, ho] of [[1280, 800], [1000, 700]]) {
    win.setContentSize(br, ho);
    await warte(900);
    const g = br + 'x' + ho;
    for (const tab of tabs) {
      await reiter(win, tab, null);
      await warte(700);
      aufnehmenAlle(await js(MESSCODE + '(' + JSON.stringify(tab + ' @' + g) + ')'));
      await schuss(win, g + '__' + tab);

      const subs = await js("Array.prototype.map.call(document.querySelectorAll('#tab-" + tab + " .pills button[data-sub]'), function (b) { return b.getAttribute('data-sub'); })");
      for (const sub of (subs || [])) {
        await reiter(win, tab, sub);
        await warte(700);
        aufnehmenAlle(await js(MESSCODE + '(' + JSON.stringify(tab + '/' + sub + ' @' + g) + ')'));
        if (br === 1000) await schuss(win, g + '__' + tab + '__' + sub);
      }
    }
  }
  const seitenFehler = await js('window.__auditor.fehler.slice(0, 30)');
  return { tabs: tabs.length, seitenFehler: seitenFehler || [] };
}

setTimeout(() => { console.error('Auditor-Probe: Zeitlimit erreicht.'); app.exit(2); }, 1500000);

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
      await warte(6000);
      /* Die Einwilligungsfrage (Diagnosedaten) liegt beim ersten Start als Dialog ueber
       * der halben Flaeche. Sie wird NICHT beantwortet: diagnose.js haelt ausdruecklich
       * fest, dass Wegklicken ohne Antwort erlaubt ist und weiterhin bedeutet, dass
       * nichts gesendet wird. Ein echter Escape-Tastendruck, kein Knopfklick. */
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(1000);
      const nochOffen = await js2(win, "!!document.querySelector('.modal-bg.open')");
      console.log('MODAL_NACH_ESCAPE=' + nochOffen);

      const erg = await lauf(win);

      /* ---- A: Scoreboard, beide Groessen ---- */
      const sb = [];
      for (const paar of [[1280, 800], [1000, 700]]) {
        win.setContentSize(paar[0], paar[1]);
        await warte(700);
        await reiter(win, 'messung', null);
        await warte(3500);
        const m = await js2(win, SCOREBOARDCODE);
        m.groesse = paar[0] + 'x' + paar[1];
        sb.push(m);
        aufnehmenAlle(await js2(win, MESSCODE + '(' + JSON.stringify('messung-mit-protokollen @' + paar[0]) + ')'));
        await schuss(win, 'A-scoreboard-' + paar[0]);
      }

      /* ---- B: Kursarchiv, beide Groessen ----
       * Nach dem Pillenwechsel laenger warten: sammlerStand() liest bis zu 60
       * Dateien je Aufloesung von der Platte. Wer zu frueh misst, sieht den
       * Ladetext und haelt das fuer einen Fund. */
      const arch = [];
      for (const paar of [[1280, 800], [1000, 700]]) {
        win.setContentSize(paar[0], paar[1]);
        await warte(700);
        await reiter(win, 'werkzeuge', 'archiv');
        await warte(8000);
        const m = await js2(win, ARCHIVCODE);
        m.groesse = paar[0] + 'x' + paar[1];
        arch.push(m);
        aufnehmenAlle(await js2(win, MESSCODE + '(' + JSON.stringify('werkzeuge/archiv @' + paar[0]) + ')'));
        await schuss(win, 'B-kursarchiv-' + paar[0]);
      }

      /* ---- C: Perzentil ---- */
      win.setContentSize(1280, 800);
      await warte(600);
      await reiter(win, 'werkzeuge', 'explorer');
      await warte(2500);
      const perzentil = await js2(win, PERZENTILCODE);
      await schuss(win, 'C-explorer-1280');

      /* ---- D: Rotationsblock Strategien, alle Pillen ---- */
      const strat = [];
      const stratSubs = await js2(win, "Array.prototype.map.call(document.querySelectorAll('#tab-strategien .pills button[data-sub]'), function (b) { return b.getAttribute('data-sub'); })");
      for (const paar of [[1280, 800], [1000, 700]]) {
        win.setContentSize(paar[0], paar[1]);
        await warte(700);
        for (const s of (stratSubs || [])) {
          await reiter(win, 'strategien', s);
          await warte(2200);
          const m = await js2(win, STRATEGIENCODE);
          m.sub = s; m.groesse = paar[0] + 'x' + paar[1];
          strat.push(m);
          aufnehmenAlle(await js2(win, MESSCODE + '(' + JSON.stringify('strategien/' + s + '-rot @' + paar[0]) + ')'));
          await schuss(win, 'D-strategien-' + s + '-' + paar[0]);
        }
      }

      const seitenFehler2 = await js2(win, 'window.__auditor.fehler.slice(0, 40)');

      const bericht = {
        commit: '04c9be5', bilder: BILDER, tabs: erg.tabs, protokolle: SAATZAHL,
        scoreboard: sb, archiv: arch, perzentil: perzentil, strategien: strat,
        seitenFehler: seitenFehler2 || erg.seitenFehler,
        konsoleFehler: konsoleFehler.slice(0, 60),
        funde
      };
      fs.writeFileSync(path.join(TESTROOT, 'befund.json'), JSON.stringify(bericht, null, 1));
      console.log('BILDER=' + BILDER);
      console.log('BEFUNDDATEI=' + path.join(TESTROOT, 'befund.json'));
      const zaehl = Object.create(null);
      funde.forEach((f) => { zaehl[f.art] = (zaehl[f.art] || 0) + 1; });
      console.log('ZUSAMMENFASSUNG=' + JSON.stringify(zaehl));
      console.log('SEITENFEHLER=' + (seitenFehler2 || []).length);
      (seitenFehler2 || []).slice(0, 12).forEach((f) => console.log('  ! ' + f));
      app.exit(0);
    } catch (e) {
      console.error('Auditor-Probe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
