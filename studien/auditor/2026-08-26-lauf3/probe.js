'use strict';
/* ====== Auditor, vertiefte Probe (26.08.2026, dritter Lauf) ======
 *
 * Aenderungsmenge 9652f97..d964891. Oberflaechen-Dateien darin: index.html,
 * depot.js, bestandui.js. Daraus die vier Schwerpunkte dieser Nacht:
 *
 *  A  DEPOTVERLAUF (Vermoegen -> Depot). Das zweite, schlichte Verlaufsbild ist
 *     entfallen; seine drei Kennzahlen sind aus #eqPanel nach #eqKopf in die Karte
 *     des ausfuehrlichen Bildes gezogen (10ae955). Ein umgezogener Kopf ist genau
 *     die Sorte Aenderung, die im leeren Profil unsichtbar bleibt: unter 5 Punkten
 *     versteckt er sich selbst. Deshalb wird der Verlauf hier GESAET.
 *  B  BESTANDSTABELLE (Vermoegen -> Meine Papiere). Gegenprobe zu den eigenen
 *     Funden #93 (Umbruch von Zahl und Einheit bei 1000 px) und #94 (englisches
 *     Zahlenformat, graue statt roter Verluste), repariert in a5641d3.
 *  C  REGELKOPF (Regeln -> Regelbuch). Die linke Spalte ist von <td> auf
 *     <th scope="row"> umgestellt (779c02c). table.tbl th traegt in index.html
 *     mehr als nur Ausrichtung und Strichstaerke - was davon durchschlaegt, wird
 *     gemessen statt geschaetzt. Dazu der neue Hinweissatz bei "nicht bestaetigt".
 *  D  ROTATION: der Reiter MESSUNG, vollstaendig.
 *
 * Aufruf aus der Repo-Wurzel:
 *   .\node_modules\.bin\electron.cmd studien\auditor\2026-08-26-lauf3\probe.js
 *
 * Der Vorspann stammt aus tools/ui-probe.js - er ist der Grund, warum die Probe die
 * echte Installation nicht anfasst. ACHTUNG: WURZEL geht von hier DREI Ebenen hoch.
 *
 * Geklickt wird ausschliesslich Navigation (Reiter und Pillen). Kein Knopf, der
 * handelt, zuruecksetzt, laeuft oder kostet - siehe Sperrliste im Auftrag. */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const WURZEL = path.join(__dirname, '..', '..', '..');
const TESTROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'md-auditor3-'));
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
 * Geschrieben wird ausschliesslich in das frische TESTROOT unter %TEMP%: dieselben
 * Dateien, die storeSet() schreiben wuerde, nur vorher. Der Speicher des Anwenders
 * wird weder gelesen noch angefasst.
 * Vier Papiere mit Stueckzahl, damit die Summenzeile faellt; eines mit langem Namen,
 * weil Layout-Fehler an der laengsten Zelle zuerst auffallen. */
function saatLegen() {
  const d = path.join(TESTROOT, 'userdata', 'store');
  fs.mkdirSync(d, { recursive: true });
  const werte = [
    { sym: 'AAPL', name: 'Apple Inc.', stueck: 12, isin: 'US0378331005', wkn: null, seit: 1 },
    { sym: 'MSFT', name: 'Microsoft Corporation', stueck: 5, isin: 'US5949181045', wkn: null, seit: 1 },
    { sym: 'NVDA', name: 'NVIDIA Corporation', stueck: 40, isin: 'US67066G1040', wkn: null, seit: 1 },
    { sym: 'AMZN', name: 'Amazon.com Incorporated Registered Shares', stueck: 3, isin: 'US0231351067', wkn: null, seit: 1 }
  ];
  fs.writeFileSync(path.join(d, 'bestand.json'), JSON.stringify({ stand: 1, werte: werte }), 'utf8');
  fs.writeFileSync(path.join(d, 'theme.json'), JSON.stringify('light'), 'utf8');
  console.log('SAAT=' + d);
}
saatLegen();

const BILDER = path.join(TESTROOT, 'bilder');
fs.mkdirSync(BILDER, { recursive: true });

/* ---- Depotverlauf saeen -----------------------------------------------------
 * NICHT von Hand zusammengebaut: depot.js liest den Speicher ohne Verschmelzung mit
 * den Vorgabewerten (D = storeGet('depot') || defaultDepot()). Ein selbst getipptes
 * Teilobjekt haette fehlende Felder und wuerde Fehler erzeugen, die es in der App
 * gar nicht gibt - erfundene Funde. Stattdessen wird der Stand genommen, den die App
 * selbst geschrieben hat, um EIN Feld ergaenzt und zurueckgelegt.
 * Der Verlauf hat einen Anstieg, ein Hoch und einen echten Ruecksetzer danach: nur so
 * traegt "Max. Ruecksetzer" eine Zahl ungleich null und die Klasse "down". */
const SAATCODE = "(async function () {" +
  "var d = await window.api.storeGet('depot');" +
  "if (!d) return { ok: false, grund: 'kein depot im Speicher' };" +
  "var t0 = 1750000000000, punkte = [], w = 100000;" +
  "var kurve = [0, 1.5, 3.1, 4.6, 6.2, 8.9, 11.4, 9.0, 6.1, 3.4, 4.2, 5.0, 5.6, 6.1, 7.3];" +
  "for (var i = 0; i < kurve.length; i++) {" +
  "  punkte.push([t0 + i * 600000, Math.round(w * (1 + kurve[i] / 100) * 100) / 100]); }" +
  "d.equityHist = punkte;" +
  "var r = await window.api.storeSet('depot', d);" +
  "return { ok: !(r && r.ok === false), punkte: punkte.length,"  +
  "  ersterWert: punkte[0][1], hoch: 111400, letzter: punkte[punkte.length - 1][1] }; })()";

/* ---- Allgemeine Messung. Laeuft IN der Seite, liest nur ---------------------- */
const MESSCODE = '(function (marke) {' +
  'var raus = { marke: marke, unfertig: [], ueberlauf: [], ausgelaufen: [],' +
  ' ueberlappung: [], unsichtbarBedienbar: [], ohneNamen: [], leerekarten: [], umbruch: [] };' +
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
  /* --- 8. NEU in diesem Lauf: Zahl und Einheit auf zwei Zeilen (der Fehler aus #93).
   * Ein Blick auf die Zelle genuegt dafuer nicht - eine Zelle ist auch dann hoch
   * genug, wenn sie zwei Zeilen traegt. Gemessen wird deshalb der TEXT selbst:
   * ein Range ueber den Zellinhalt liefert je angefangener Zeile ein Rechteck.
   * Mehr als eines heisst umgebrochen. Geprueft werden nur Zellen, die eine Zahl
   * mit Einheit tragen - bei Fliesstext ist ein Umbruch richtig, nicht falsch. */
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
  'raus.warnband = ((document.getElementById("warnband") || {}).innerText || "").trim().slice(0, 300);' +
  /* Diagnosezaehler: ein "0 Funde" ist nur dann etwas wert, wenn die Pruefung auch
   * wirklich Elemente gesehen hat. Sonst meldet eine kaputte Pruefung Ruhe. */
  'raus.geprueft = { bedienelemente: bedien.length,' +
  '  namenskandidaten: document.querySelectorAll("button, a[href], [role=button]").length,' +
  '  karten: document.querySelectorAll(".panel, .card, .kachel").length,' +
  '  zahlzellen: document.querySelectorAll("td, th").length };' +
  'raus.modalOffen = !!document.querySelector(".modal-bg.open");' +
  'return raus; })';

/* ---- A: der umgezogene Depotverlauf-Kopf ------------------------------------ */
const EQCODE = "(function () {" +
  "var k = document.getElementById('eqKopf');" +
  "var alt = document.getElementById('eqPanel');" +
  "var svg = document.getElementById('equityChart');" +
  "var karte = k ? k.closest('.panel') : null;" +
  "function rechteck(e) { if (!e) return null; var r = e.getBoundingClientRect();" +
  "  return { l: Math.round(r.left), r: Math.round(r.right), o: Math.round(r.top)," +
  "    u: Math.round(r.bottom), br: Math.round(r.width), ho: Math.round(r.height) }; }" +
  "return {" +
  "  altNochDa: !!alt," +
  "  kopfDa: !!k," +
  "  anzeige: k ? getComputedStyle(k).display : null," +
  "  text: k ? (k.innerText || '').replace(/\\n/g, ' | ').slice(0, 200) : null," +
  "  spannen: k ? k.querySelectorAll(':scope > span').length : 0," +
  "  klassenImKopf: k ? Array.prototype.map.call(k.querySelectorAll('b'), function (b) {" +
  "    return { t: (b.textContent || '').trim(), c: b.className || '' }; }) : []," +
  "  kopfRechteck: rechteck(k)," +
  "  karteRechteck: rechteck(karte)," +
  "  svgDa: !!svg," +
  "  svgPfade: svg ? svg.querySelectorAll('path').length : 0," +
  "  svgText: svg ? (svg.textContent || '').trim().slice(0, 160) : null," +
  "  svgHoehe: svg ? Math.round(svg.getBoundingClientRect().height) : null," +
  "  regelEqPanel: (function () { var n = 0;" +
  "    for (var i = 0; i < document.styleSheets.length; i++) {" +
  "      var rs; try { rs = document.styleSheets[i].cssRules; } catch (e) { continue; }" +
  "      for (var j = 0; rs && j < rs.length; j++) {" +
  "        if (rs[j].selectorText && rs[j].selectorText.indexOf('eq-panel') !== -1) n++; } }" +
  "    return n; })()" +
  "}; })()";

/* ---- B: die Bestandstabelle Zelle fuer Zelle -------------------------------- */
const TABELLENCODE = "(function () {" +
  "var k = document.getElementById('bestandTabelle');" +
  "if (!k) return { fehlt: true };" +
  "var t = k.querySelector('table');" +
  "if (!t) return { fehlt: false, tabelle: false, text: (k.innerText || '').trim().slice(0, 300) };" +
  "function zeilenZahl(el) {" +
  "  var rg = document.createRange(); rg.selectNodeContents(el);" +
  "  var rects = rg.getClientRects(); var n = 0, oben = null;" +
  "  for (var q = 0; q < rects.length; q++) { if (rects[q].width < 0.5) continue;" +
  "    if (oben === null || Math.abs(rects[q].top - oben) > 3) { n++; oben = rects[q].top; } }" +
  "  return n; }" +
  "var zeilen = Array.prototype.map.call(t.rows, function (r) {" +
  "  return { zellen: r.cells.length, klasse: r.className || ''," +
  "    inhalt: Array.prototype.map.call(r.cells, function (c) {" +
  "      var cs = getComputedStyle(c);" +
  "      return { t: (c.innerText || '').trim().slice(0, 60), c: c.className || ''," +
  "        farbe: cs.color, umbruchAus: cs.whiteSpace, ausricht: cs.textAlign," +
  "        zeilen: zeilenZahl(c) }; }) }; });" +
  "var r = t.getBoundingClientRect(), pr = k.getBoundingClientRect();" +
  "var zeilenText = (k.innerText || '').split(String.fromCharCode(10));" +
  "return { fehlt: false, tabelle: true, zeilen: zeilen," +
  "  breiteTabelle: Math.round(r.width), breiteKasten: Math.round(pr.width)," +
  "  rollbar: k.scrollWidth > k.clientWidth + 2," +
  "  ueberKasten: Math.round(r.right - pr.right)," +
  "  fusstext: (zeilenText[zeilenText.length - 1] || '').slice(0, 200) }; })()";

/* ---- C: der Regelkopf, td gegen th ------------------------------------------
 * Die linke Spalte ist auf <th scope="row"> umgestellt. table.tbl th traegt in
 * index.html aber mehr als Ausrichtung und Gewicht: Grossschreibung, Sperrung,
 * kleinere Schrift, Unterstrich. Die neue Zeile setzt per Attribut nur Farbe,
 * Ausrichtung und Gewicht zurueck - was sonst noch durchschlaegt, steht hier. */
const REGELKOPFCODE = "(function () {" +
  "var k = document.getElementById('regelKopf');" +
  "if (!k) return { fehlt: true };" +
  "var t = k.querySelector('table'); if (!t) return { fehlt: false, tabelle: false," +
  "  text: (k.innerText || '').trim().slice(0, 200) };" +
  "function stil(el) { if (!el) return null; var s = getComputedStyle(el);" +
  "  var r = el.getBoundingClientRect();" +
  "  return { schreibung: s.textTransform, sperrung: s.letterSpacing, groesse: s.fontSize," +
  "    gewicht: s.fontWeight, farbe: s.color, ausricht: s.textAlign," +
  "    unten: s.borderBottomWidth + ' ' + s.borderBottomStyle," +
  "    breite: Math.round(r.width) }; }" +
  "var zeilen = Array.prototype.map.call(t.rows, function (r, i) {" +
  "  var erste = r.cells[0], zweite = r.cells[1];" +
  "  return { nr: i, ersteTag: erste ? erste.tagName : null," +
  "    scope: erste ? (erste.getAttribute('scope') || '') : ''," +
  "    text: erste ? (erste.innerText || '').trim() : ''," +
  "    stilErste: stil(erste), stilZweite: stil(zweite) }; });" +
  "var warn = k.querySelector('.warn');" +
  "return { fehlt: false, tabelle: true, zeilen: zeilen," +
  "  hatWarnhinweis: !!warn, warntext: warn ? (warn.innerText || '').trim().slice(0, 240) : null," +
  "  volltext: (k.innerText || '').trim().slice(0, 600) }; })()";

/* ---- D: der Reiter Messung (Rotationsblock) --------------------------------- */
const MESSUNGCODE = "(function () {" +
  "var t = document.getElementById('tab-messung'); if (!t) return { fehlt: true };" +
  "var tabellen = Array.prototype.map.call(t.querySelectorAll('table'), function (tb) {" +
  "  var kopf = tb.rows[0];" +
  "  return { zeilen: tb.rows.length," +
  "    kopfIstTh: kopf ? Array.prototype.every.call(kopf.cells, function (c) { return c.tagName === 'TH'; }) : null," +
  "    spalten: kopf ? kopf.cells.length : 0," +
  "    ungleicheZeilen: Array.prototype.filter.call(tb.rows, function (r) {" +
  "      return kopf && r.cells.length !== kopf.cells.length; }).length," +
  "    erstesFeld: kopf && kopf.cells[0] ? (kopf.cells[0].innerText || '').trim().slice(0, 30) : '' }; });" +
  "return { fehlt: false, tabellen: tabellen," +
  "  ueberschriften: Array.prototype.map.call(t.querySelectorAll('h2, h3'), function (h) {" +
  "    return (h.innerText || '').trim().replace(/\\s+/g, ' ').slice(0, 90); })," +
  "  textLaenge: (t.innerText || '').length," +
  "  leerHinweise: Array.prototype.map.call(t.querySelectorAll('.panel'), function (p) {" +
  "    return { kopf: ((p.querySelector('h3') || {}).innerText || '').trim().slice(0, 40)," +
  "      laenge: (p.innerText || '').trim().length }; }) }; })()";

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
        await warte(600);
        aufnehmenAlle(await js(MESSCODE + '(' + JSON.stringify(tab + '/' + sub + ' @' + g) + ')'));
        /* Pillen nur in der schmalen Groesse fotografieren - dort faellt fast jeder
         * Layout-Fehler zuerst auf, und das Temp bleibt uebersichtlich. */
        if (br === 1000) await schuss(win, g + '__' + tab + '__' + sub);
      }
    }
  }
  const seitenFehler = await js('window.__auditor.fehler.slice(0, 30)');
  return { tabs: tabs.length, seitenFehler: seitenFehler || [] };
}

setTimeout(() => { console.error('Auditor-Probe: Zeitlimit erreicht.'); app.exit(2); }, 900000);

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
      await warte(5000);
      /* Beim allerersten Start liegt die Einwilligungsfrage (Diagnosedaten) als Dialog
       * ueber der halben Flaeche - jedes Bildschirmfoto waere verdeckt. Sie wird NICHT
       * beantwortet: diagnose.js haelt ausdruecklich fest, dass Wegklicken ohne Antwort
       * erlaubt ist und weiterhin bedeutet, dass nichts gesendet wird. Ein echter
       * Escape-Tastendruck, kein Knopfklick. */
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(800);
      const nochOffen = await js2(win, "!!document.querySelector('.modal-bg.open')");
      console.log('MODAL_NACH_ESCAPE=' + nochOffen);

      /* Depotverlauf saeen und neu laden. Erst danach zeigt #eqKopf ueberhaupt etwas -
       * unter 5 Punkten versteckt er sich selbst, und das ist so gewollt. */
      const saat = await js2(win, SAATCODE);
      console.log('EQ_SAAT=' + JSON.stringify(saat));
      await js2(win, "location.reload(); 'neu'").catch(() => {});
      await warte(9000);
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
      await warte(1200);

      const erg = await lauf(win);

      /* ---- A: Depotverlauf, beide Groessen ---- */
      const eq = [];
      for (const paar of [[1280, 800], [1000, 700]]) {
        win.setContentSize(paar[0], paar[1]);
        await warte(700);
        await reiter(win, 'depot', 'depot');
        await warte(2500);
        const m = await js2(win, EQCODE);
        m.groesse = paar[0] + 'x' + paar[1];
        eq.push(m);
        aufnehmenAlle(await js2(win, MESSCODE + '(' + JSON.stringify('depot/depot-gesaet @' + paar[0]) + ')'));
        await schuss(win, 'A-depotverlauf-' + paar[0]);
      }

      /* ---- B: Bestandstabelle, beide Groessen ----
       * Nach dem Reiterwechsel wird laenger gewartet als sonst: jahresbasenLaden()
       * holt je Papier eine Tagesreihe ueber ein Jahr und zeichnet ERST DANACH neu.
       * Wer zu frueh misst, sieht "seit Jahresbeginn" leer und haelt das fuer einen Fund. */
      const tabellen = [];
      for (const paar of [[1280, 800], [1000, 700]]) {
        win.setContentSize(paar[0], paar[1]);
        await warte(700);
        await reiter(win, 'depot', 'papiere');
        await warte(9000);
        const m = await js2(win, TABELLENCODE);
        m.groesse = paar[0] + 'x' + paar[1];
        tabellen.push(m);
        aufnehmenAlle(await js2(win, MESSCODE + '(' + JSON.stringify('depot/papiere-gefuellt @' + paar[0]) + ')'));
        await schuss(win, 'B-papiere-' + paar[0]);
      }

      /* ---- C: Regelkopf ---- */
      win.setContentSize(1280, 800);
      await warte(600);
      await reiter(win, 'strategien', 'regelbuch');
      await warte(2500);
      const regelkopf = await js2(win, REGELKOPFCODE);
      await schuss(win, 'C-regelkopf-1280');
      win.setContentSize(1000, 700);
      await warte(900);
      await schuss(win, 'C-regelkopf-1000');

      /* ---- D: Rotationsblock Messung ---- */
      win.setContentSize(1280, 800);
      await warte(600);
      await reiter(win, 'messung', null);
      await warte(3000);
      const messung = await js2(win, MESSUNGCODE);
      await schuss(win, 'D-messung-1280');
      win.setContentSize(1000, 700);
      await warte(900);
      await schuss(win, 'D-messung-1000');

      const bericht = {
        commit: 'd964891', bilder: BILDER, tabs: erg.tabs,
        eqSaat: saat, eq: eq, tabellen: tabellen,
        regelkopf: regelkopf, messung: messung,
        seitenFehler: erg.seitenFehler,
        konsoleFehler: konsoleFehler.slice(0, 40),
        funde
      };
      fs.writeFileSync(path.join(TESTROOT, 'befund.json'), JSON.stringify(bericht, null, 1));
      console.log('BILDER=' + BILDER);
      console.log('BEFUNDDATEI=' + path.join(TESTROOT, 'befund.json'));
      const zaehl = Object.create(null);
      funde.forEach((f) => { zaehl[f.art] = (zaehl[f.art] || 0) + 1; });
      console.log('ZUSAMMENFASSUNG=' + JSON.stringify(zaehl));
      console.log('SEITENFEHLER=' + erg.seitenFehler.length);
      erg.seitenFehler.slice(0, 10).forEach((f) => console.log('  ! ' + f));
      app.exit(0);
    } catch (e) {
      console.error('Auditor-Probe abgebrochen: ' + (e && e.message || e));
      app.exit(2);
    }
  });
});

require(path.join(WURZEL, 'main.js'));
