'use strict';
/* MESSTAUGLICHKEIT DES BESTANDS - die Ergaenzung zu bestand-pruefen.js.
 *
 * bestand-pruefen.js beantwortet "ist der Bestand vollstaendig". Dieses Werkzeug
 * beantwortet die andere Haelfte: "taugt er fuer eine Messung, und WOFUER REICHT ER".
 * Das sind verschiedene Fragen - ein lueckenloses Archiv kann trotzdem zu klein
 * sein, um eine Kante von null zu trennen, und genau daran ist am 24.08.2026 der
 * Kapitulations-Dip gescheitert.
 *
 * Drei Teile:
 *   1. Was liegt da, auch ausserhalb des App-Stores (Massive, Universum).
 *   2. Stimmt es. Die Pruefungen, an denen dieses Projekt schon einmal gescheitert
 *      ist: doppelte und rueckwaerts laufende Zeitstempel, Wochenendkerzen auf
 *      Aktien, dreielementige Kerzen (kein Hoch/Tief), CFD-Reihen im 60m-Archiv.
 *   3. Wofuer reicht es. Die Aufloesung ist der Engpass, nicht die Ideen.
 *
 * Aufruf: node tools/bestand-messtauglichkeit.js
 * Es wird nichts geaendert.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var STORE = process.env.MD_STORE || path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var MASSIVE = path.join(DATEN, 'massive');

function mb(b) { return (b / 1048576).toFixed(1) + ' MB'; }
function zahl(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function ordnerGroesse(p) {
  var s = 0;
  try { fs.readdirSync(p).forEach(function (f) { try { s += fs.statSync(path.join(p, f)).size; } catch (e) { } }); } catch (e) { return null; }
  return s;
}

console.log('MESSTAUGLICHKEIT DES BESTANDS  ·  ' + new Date().toLocaleString('de-DE'));
console.log('='.repeat(78));

/* ---------------- 1) Was liegt da ---------------- */
console.log('\n1) BESTAENDE AUSSERHALB DES APP-STORES\n');

var tagesOrdner = path.join(MASSIVE, 'tagesdaten');
if (fs.existsSync(tagesOrdner)) {
  var dat = fs.readdirSync(tagesOrdner).filter(function (f) { return f.slice(-5) === '.json'; });
  var kerzen = 0, frueheste = null, spaeteste = null, kurz = 0;
  dat.forEach(function (f) {
    try {
      var j = JSON.parse(fs.readFileSync(path.join(tagesOrdner, f), 'utf8'));
      var s = j.series || [];
      kerzen += s.length;
      if (s.length < 100) kurz++;
      if (s.length) {
        var a = s[0][0], b = s[s.length - 1][0];
        if (frueheste == null || a < frueheste) frueheste = a;
        if (spaeteste == null || b > spaeteste) spaeteste = b;
      }
    } catch (e) { }
  });
  console.log('   Massive-Tagesdaten (verschwundene Werte)');
  console.log('     ' + zahl(dat.length) + ' Reihen  ·  ' + zahl(kerzen) + ' Tageskerzen  ·  ' + mb(ordnerGroesse(tagesOrdner)));
  if (frueheste) console.log('     ' + new Date(frueheste).toISOString().slice(0, 10) + ' bis ' + new Date(spaeteste).toISOString().slice(0, 10) +
    '  ·  ' + kurz + ' Reihen unter 100 Tagen');
  var stand = path.join(MASSIVE, 'tagesdaten-stand.json');
  if (fs.existsSync(stand)) {
    var st = JSON.parse(fs.readFileSync(stand, 'utf8'));
    var g = Object.keys(st.fertig || {}).length, o = Object.keys(st.ohneDaten || {}).length;
    console.log('     Fortschritt: ' + g + ' mit Daten, ' + o + ' ohne (' + (100 * o / Math.max(1, g + o)).toFixed(0) +
      ' % leer - SPACs und Huelsen), zusammen ' + (g + o) + ' von 1.633');
  }
} else {
  console.log('   Massive-Tagesdaten: nicht vorhanden');
}

var uni = fs.existsSync(MASSIVE) ? fs.readdirSync(MASSIVE).filter(function (f) { return f.indexOf('universum-') === 0; }) : [];
uni.forEach(function (f) {
  var j = JSON.parse(fs.readFileSync(path.join(MASSIVE, f), 'utf8'));
  console.log('\n   Punkt-in-Zeit-Universum (' + f + ')');
  console.log('     Stichtag ' + j.stichtag + ', ' + j.handelstage + ' Handelstage, Schwelle ' + j.schwelleMio + ' Mio $');
  console.log('     ' + zahl((j.werte || []).length) + ' Werte, ausgewaehlt nach der Liquiditaet VON DAMALS');
});

var vDat = path.join(MASSIVE, 'verschwundene.json');
if (fs.existsSync(vDat)) {
  var V = JSON.parse(fs.readFileSync(vDat, 'utf8')).eintraege || [];
  console.log('\n   Liste verschwundener Werte: ' + zahl(V.length) + ' Eintraege');
}

/* ---------------- 2) Stimmt es ---------------- */
console.log('\n2) DATENQUALITAET DES 60m-ARCHIVS - die Fallen, in die dieses Projekt schon getappt ist\n');

var f60 = fs.readdirSync(STORE).filter(function (f) { return f.indexOf('bars_60m_') === 0; });
var pr = { reihen: 0, kerzen: 0, doppelt: 0, rueckwaerts: 0, wochenende: 0, dreiElement: 0,
           cfd: 0, nullKurs: 0, hochUnterTief: 0, symWochenende: [], symDrei: [] };
f60.forEach(function (f) {
  var sym = f.slice(9, -5);
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(STORE, f), 'utf8')); } catch (e) { return; }
  var s = j.series || [];
  if (!s.length) return;
  pr.reihen++; pr.kerzen += s.length;
  if (/cfd|capital/i.test(JSON.stringify(j.quelle || '') + (j.quelleCfd ? '1' : ''))) pr.cfd++;
  var istKrypto = sym.indexOf('-USD') !== -1;
  var we = 0, drei = 0;
  for (var i = 0; i < s.length; i++) {
    var k = s[i];
    if (k.length < 5) { drei++; pr.dreiElement++; }
    if (!(k[1] > 0)) pr.nullKurs++;
    if (k.length >= 5 && k[3] != null && k[4] != null && k[3] < k[4]) pr.hochUnterTief++;
    if (i > 0) {
      if (k[0] === s[i - 1][0]) pr.doppelt++;
      else if (k[0] < s[i - 1][0]) pr.rueckwaerts++;
    }
    if (!istKrypto) { var d = new Date(k[0]).getUTCDay(); if (d === 0 || d === 6) { we++; pr.wochenende++; } }
  }
  if (we) pr.symWochenende.push(sym + ' (' + we + ')');
  if (drei) pr.symDrei.push(sym + ' (' + drei + ')');
});
function zeile(text, wert, gutWennNull) {
  var ok = gutWennNull ? wert === 0 : wert > 0;
  console.log('   ' + (ok ? '✓' : '✗') + ' ' + text.padEnd(52) + zahl(wert));
}
console.log('   ' + pr.reihen + ' Reihen, ' + zahl(pr.kerzen) + ' Kerzen geprueft\n');
zeile('doppelte Zeitstempel', pr.doppelt, true);
zeile('rueckwaerts laufende Zeitstempel', pr.rueckwaerts, true);
zeile('Wochenendkerzen auf Aktien', pr.wochenende, true);
zeile('dreielementige Kerzen (kein Hoch/Tief)', pr.dreiElement, true);
zeile('Kurse <= 0', pr.nullKurs, true);
zeile('Hoch unter Tief', pr.hochUnterTief, true);
zeile('als CFD-Quelle markierte Reihen', pr.cfd, true);
if (pr.symWochenende.length) console.log('     betroffen: ' + pr.symWochenende.slice(0, 8).join(', '));
if (pr.symDrei.length) console.log('     betroffen: ' + pr.symDrei.slice(0, 8).join(', '));

/* ---------------- 3) Wofuer reicht es ---------------- */
console.log('\n3) WOFUER REICHT DER BESTAND?\n');

/* Handelstage im 60m-Archiv - die Groesse, an der die Aufloesung haengt. */
var tage = {};
/* NUR Aktien zaehlen. Krypto handelt am Wochenende und blaeht die Zahl der
 * "Handelstage" auf - beim ersten Wurf standen hier 963 statt 733 Tage. */
f60.filter(function (f) { return f.indexOf('-USD') === -1; }).slice(0, 30).forEach(function (f) {
  try {
    var s = JSON.parse(fs.readFileSync(path.join(STORE, f), 'utf8')).series || [];
    s.forEach(function (k) { tage[new Date(k[0]).toISOString().slice(0, 10)] = 1; });
  } catch (e) { }
});
var nTage = Object.keys(tage).length;
var nAktien = f60.filter(function (f) { return f.indexOf('-USD') === -1; }).length;
console.log('   60m-Archiv: ' + nAktien + ' Aktien ueber ' + nTage + ' Handelstage (' + (nTage / 252).toFixed(1) + ' Jahre)');
console.log('   Bestaetigungshaelfte: rund ' + Math.floor(nTage / 2) + ' Tage - darauf ruht jedes Urteil.\n');

/* Die gemessene Skalierung: MDE ~ Werte^-0,39 (kapitulation-auflosung.js, 24.08.). */
var B = 0.39;
console.log('   Gemessene Skalierung der Aufloesung: MDE ~ Werte^-0,39');
console.log('   (bei voellig unabhaengigen Werten waere -0,50, bei perfektem Gleichlauf 0,00)\n');
console.log('   Kleinster Effekt, der sich mit N Werten noch von null trennen laesst,');
console.log('   hochgerechnet aus der Kapitulations-Messung (191 Werte -> MDE 0,695 Pp):\n');
console.log('   Werte      MDE Pp     traegt einen Effekt von …');
[191, 500, 1000, 3263, 4478].forEach(function (n) {
  var mde = 0.695 * Math.pow(n / 191, -B);
  var was = mde <= 0.10 ? 'unter der Kostenhuerde - alles Handelbare'
    : mde <= 0.21 ? 'ueber der Kostenhuerde, unter der Scheinhuerde'
    : mde <= 0.46 ? 'nur noch grosse Kanten'
    : 'praktisch nichts';
  console.log('   ' + String(n).padStart(5) + '      ' + mde.toFixed(3).padStart(6) + '     ' + was +
    (n === nAktien ? '   <- heute' : '') + (n === 3263 ? '   <- Punkt-in-Zeit-Universum' : ''));
});

console.log('\n   Das ist der Engpass. Nicht fehlende Ideen, sondern die Zahl der Werte.');
console.log('\n' + '='.repeat(78));
console.log('Fertig. Es wurde nichts geaendert.');
