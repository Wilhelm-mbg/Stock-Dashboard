'use strict';
/* Gegenpruefung: Snippet vs. Live-Pfad (mfhandel.momentumZiel) auf DERSELBEN Datenbasis
 * (Tagesschluesse aus dem 60m-Archiv, 114 Aktien). Dazu Fenster-Probe 231 vs. 210 Tage. */
var fs = require('fs');
var MOM = require('./momentum.js');
var M = require('../../../momentum.js');
var MH = require('../../../mfhandel.js');
var DIR = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var universum60m = {};
fs.readdirSync(DIR).filter(function (f) { return /^bars_60m_/.test(f); }).forEach(function (f) { universum60m[f.slice(9, -5)] = JSON.parse(fs.readFileSync(DIR + f, 'utf8')).series; });

// ---- Snippet des Pruefers ----
var vb = MOM.vorbereiten(universum60m);
function signal(bars, i, params) {
  var s = MOM.momentumSignal(bars, i, { sym: params.sym, vb: vb, rueckblick: 231, luecke: 21, anteil: 0.10, minWerte: 25 });
  return s ? { dir: s.dir } : null;
}
// ---- Snippet auf 2 Symbolen ----
['AAPL', 'INTC'].forEach(function (sym) {
  var b = universum60m[sym], n = { '+1': 0, '-1': 0 }, erst = null, letzt = null;
  for (var i = 1; i < b.length; i++) { var s = signal(b, i, { sym: sym }); if (s) { n[s.dir > 0 ? '+1' : '-1']++; if (!erst) erst = MOM.nyTag(b[i][0]); letzt = MOM.nyTag(b[i][0]); } }
  console.log(sym + ': ' + JSON.stringify(n) + ' erstes ' + erst + ' letztes ' + letzt);
});

// ---- Live-Pfad: rohMap wie mf_tagesdaten ([[t, kurs]] je Symbol) aus denselben Tagesschluessen ----
// Am letzten Tag der Achse (2026-08-21): Zielliste von momentumZiel mit Live-Defaults (231/21 -> 210-Tage-Fenster)
// und mit rueckblick 252 (= exakt momentum.js 231/21) gegen das Snippet-Set der +1-Signale am ersten Bar des 21.08.
var letzterTag = vb.zeiten[vb.zeiten.length - 1];
var rohMap = {};
vb.syms.forEach(function (s) {
  var r = [];
  for (var k = 0; k < vb.zeiten.length; k++) if (vb.map[s][k] != null) r.push([Date.parse(vb.zeiten[k] + 'T20:00:00Z'), vb.map[s][k]]);
  rohMap[s] = r;
});
var nowMs = Date.parse(letzterTag + 'T20:00:00Z');
var zielLive = MH.momentumZiel(rohMap, { nowMs: nowMs });
var zielLive252 = MH.momentumZiel(rohMap, { nowMs: nowMs, rueckblick: 252 });
// Snippet am ersten Bar des letzten Tages. ACHTUNG: Live rechnet am Tag i = letzter Eintrag (Schluss 21.08. ist bekannt),
// Snippet feuert am ersten Bar von Tag d und liest d-21/d-252 -> entspricht Live-Stand mit letztem Eintrag = Vortag.
// Deshalb: Snippet am ersten Bar des NAECHSTEN Tages waere noetig; wir vergleichen stattdessen Snippet am ersten Bar des
// 21.08. mit Live, dessen rohMap auf den 20.08. gekappt ist.
var vortag = vb.zeiten[vb.zeiten.length - 2];
var rohMapVortag = {};
vb.syms.forEach(function (s) { rohMapVortag[s] = rohMap[s].filter(function (p) { return p[0] <= Date.parse(vortag + 'T20:00:00Z'); }); });
var nowV = Date.parse(vortag + 'T20:00:00Z');
var liveV = MH.momentumZiel(rohMapVortag, { nowMs: nowV });
var liveV252 = MH.momentumZiel(rohMapVortag, { nowMs: nowV, rueckblick: 252 });
var snippetPlus = [], snippetMinus = [];
vb.syms.forEach(function (s) {
  var b = universum60m[s];
  for (var i = b.length - 1; i >= 1; i--) {
    if (MOM.nyTag(b[i][0]) === letzterTag && MOM.nyTag(b[i - 1][0]) !== letzterTag) {
      var sg = signal(b, i, { sym: s }); if (sg && sg.dir > 0) snippetPlus.push(s); if (sg && sg.dir < 0) snippetMinus.push(s); break;
    }
  }
});
function cmp(a, b) { var A = a.slice().sort(), B = b.slice().sort(); var nur = A.filter(function (x) { return B.indexOf(x) < 0; }); var nurB = B.filter(function (x) { return A.indexOf(x) < 0; }); return { gleich: JSON.stringify(A) === JSON.stringify(B), nurSnippet: nur, nurLive: nurB }; }
console.log('Signaltag ' + letzterTag + ', Live-Stand ' + vortag + ': Snippet +1 = ' + snippetPlus.length + ' Werte, -1 = ' + snippetMinus.length);
console.log('Live (231/21 -> 210 Tage) Ziel ' + liveV.ziel.length + ' Werte, uebersprungen ' + liveV.uebersprungen.length + ': ' + JSON.stringify(cmp(snippetPlus, liveV.ziel)));
console.log('Live mit rueckblick 252 (= momentum.js 231/21): ' + JSON.stringify(cmp(snippetPlus, liveV252.ziel)));
console.log('Zielliste Live heute (' + letzterTag + '): ' + zielLive.ziel.join(' ') + ' | mit 252: ' + zielLive252.ziel.join(' '));

// ---- Fenster-Probe: welches Fenster rechnet wer? ----
var reihe = []; for (var k = 0; k < 300; k++) reihe.push(k + 1);
var roh = reihe.map(function (v, k) { return [k, v]; });
console.log('momentum.js staerke(i=299, 231, 21) = ' + M.staerke(reihe, 299, 231, 21) + '  (erwartet 279/48-1 = ' + (279 / 48 - 1) + ')');
var z = MH.momentumZiel({ X: roh, A: roh, B: roh, C: roh, D: roh }, { nowMs: 299, maxAlterMs: 1e9, minWerte: 1 });
console.log('mfhandel momentumZiel staerke = ' + z.rangfolge[0].staerke + '  (279/69-1 = ' + (279 / 69 - 1) + ')');
// Rangvergleich ueber die ganze Achse: wie oft unterscheidet sich das Top-Dezil 231 vs. 210 Tage?
var gleichTage = 0, tage = 0, jaccardSum = 0;
for (var d = 260; d < vb.zeiten.length; d++) {
  var a = M.auswahl(vb.map, d, { rueckblick: 231, luecke: 21 });
  var b2 = M.auswahl(vb.map, d, { rueckblick: 210, luecke: 21 });
  if (!a || !b2) continue;
  var A = a.map(function (x) { return x.sym; }), B = b2.map(function (x) { return x.sym; });
  var schnitt = A.filter(function (x) { return B.indexOf(x) >= 0; }).length;
  jaccardSum += schnitt / (A.length + B.length - schnitt); tage++; if (schnitt === A.length) gleichTage++;
}
console.log('Top-Dezil 231 vs. 210 Tage ueber ' + tage + ' Tage: identisch an ' + gleichTage + ' Tagen, mittlere Jaccard-Ueberdeckung ' + (jaccardSum / tage).toFixed(3));
