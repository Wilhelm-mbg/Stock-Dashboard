'use strict';
/* KLEINE SPLIT-FAKTOREN - die benannte Blindstelle des Paragraph-2-Joins.
 * Vorregistrierung in diesem Ordner (Machbarkeit VOR dem Bau gerechnet).
 * Nur lesend; schreibt ausschliesslich in diesen Ordner.
 *
 * Kandidaten: Split-Ereignisse mit |f-1| >= 0,01 und 0,5 < f < 2 aus dem
 * Analytiker-Sweep. Klassen F / F? / U mit ABSOLUTER Faktor-Toleranz 0,002
 * (die relative +-10 % ist bei f nahe 1 wertlos - 99 % Trefferrate).
 * Beurteilbarkeits-Gate je Ereignis: p = 1-(1-rate(f))^3 < 5 %, rate(f) aus der
 * gemessenen Stichprobe. Nullwert = Summe p_i der beurteilten Ereignisse.
 */
var fs = require('fs'), path = require('path');
var HIER = __dirname;
var ARCHIV1D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var SWEEP = 'C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/analytiker/2026-08-27/einzelspruenge';
var TOL_ABS = 0.002, GATE_P = 0.05, STICHPROBE_JEDE = 48;

function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }
function ladeReihe(sym) {
  var p = path.join(ARCHIV1D, 'bars_1d_' + sym + '.json');
  if (!fs.existsSync(p)) return null;
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return (j.bars || j.series || []).filter(function (z) { return z[1] > 0; });
}

/* ---------- 1. Kandidaten-Ereignisse ---------- */
var ereignisse = [];
fs.readdirSync(SWEEP).forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(path.join(SWEEP, f), 'utf8')); } catch (e) { return; }
  var sym = j.sym || f.replace('.json', '');
  (j.ereignisse || []).forEach(function (x) {
    if (x.art !== 'split' || x.faktor == null) return;
    var fk = x.faktor;
    if (fk <= 0.5 || fk >= 2) return;              /* die sieht der Join bereits */
    if (Math.abs(fk - 1) < 0.01) return;           /* unter 1 % ist kein Ereignis mehr */
    ereignisse.push({ sym: sym, datum: x.datum, f: fk });
  });
});
console.log('Kandidaten-Ereignisse (0,5 < f < 2, |f-1| >= 0,01): ' + ereignisse.length +
  ' in ' + Object.keys(ereignisse.reduce(function (a, e) { a[e.sym] = 1; return a; }, {})).length + ' Reihen');

/* ---------- 2. Zufallsrate je Faktor aus der Stichprobe (absolute Toleranz) ---------- */
var dateien = fs.readdirSync(ARCHIV1D).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
var probe = [];
for (var i = 0; i < dateien.length; i += STICHPROBE_JEDE) probe.push(dateien[i]);
var qAlle = [];
probe.forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV1D, f), 'utf8')); } catch (e) { return; }
  var b = (j.bars || j.series || []); if (b.length < 200) return;
  for (var k = 1; k < b.length; k++) {
    var a = b[k - 1][1], c = b[k][1];
    if (a > 0 && c > 0) qAlle.push(c / a);
  }
});
qAlle.sort(function (a, b) { return a - b; });
console.log('Stichprobe: ' + probe.length + ' Reihen, ' + qAlle.length + ' Tagesuebergaenge');
function rateFuer(fk) {
  /* Anteil der Tage mit |q - f| <= TOL oder |1/q - f| <= TOL, per Binaersuche auf sortiertem q */
  function anzahlIm(lo, hi) {
    var a = 0, b = qAlle.length;
    while (a < b) { var m = (a + b) >> 1; if (qAlle[m] < lo) a = m + 1; else b = m; }
    var start = a; a = 0; b = qAlle.length;
    while (a < b) { var m2 = (a + b) >> 1; if (qAlle[m2] <= hi) a = m2 + 1; else b = m2; }
    return a - start;
  }
  var n = anzahlIm(fk - TOL_ABS, fk + TOL_ABS);
  /* inverse Seite: 1/q in [f-tol, f+tol]  <=>  q in [1/(f+tol), 1/(f-tol)] */
  if (fk - TOL_ABS > 0) n += anzahlIm(1 / (fk + TOL_ABS), 1 / (fk - TOL_ABS));
  return n / qAlle.length;
}

/* ---------- 3. Gate + Klassifizierung ---------- */
var beurteilt = [], gesperrt = [], nullwert = 0;
ereignisse.forEach(function (e) {
  e.rate = rateFuer(e.f);
  e.p = 1 - Math.pow(1 - e.rate, 3);
  if (e.p < GATE_P) { beurteilt.push(e); nullwert += e.p; } else gesperrt.push(e);
});
console.log('Gate (p < ' + (100 * GATE_P) + ' %): beurteilbar ' + beurteilt.length + ', strukturell nicht entscheidbar ' + gesperrt.length);
console.log('Nullwert (Summe p_i der beurteilten): ' + nullwert.toFixed(3) + '  Schwelle fuer "belegt": ' +
  (nullwert + 3 * Math.sqrt(nullwert)).toFixed(2));

var reihenCache = {};
var F = [], Fq = [], U = [];
beurteilt.forEach(function (e) {
  var b = reihenCache[e.sym] !== undefined ? reihenCache[e.sym] : (reihenCache[e.sym] = ladeReihe(e.sym));
  if (!b || !b.length) { e.klasse = 'ohne 1d-Reihe'; U.push(e); return; }
  var tage = b.map(function (z) { return tag(z[0]); });
  var idx = -1;
  for (var k = 0; k < tage.length; k++) if (tage[k] >= e.datum) { idx = k; break; }
  if (idx < 0) { e.klasse = 'Ereignis ausserhalb der Reihe'; U.push(e); return; }
  var trefferDatum = false, qBest = null;
  for (var d = Math.max(1, idx - 1); d <= Math.min(b.length - 1, idx + 1); d++) {
    var q = b[d][1] / b[d - 1][1];
    var passt = Math.abs(q - e.f) <= TOL_ABS || (e.f > TOL_ABS && Math.abs(1 / q - e.f) <= TOL_ABS);
    if (!qBest || Math.abs(q - e.f) < Math.abs(qBest - e.f)) qBest = q;
    if (passt) { trefferDatum = true; break; }
  }
  e.qNaechste = qBest;
  if (trefferDatum) { e.klasse = 'F'; F.push(e); }
  else {
    /* F?: Datum trifft (es GIBT einen auffaelligen Sprung), Faktor passt nicht */
    var auffaellig = qBest != null && Math.abs(qBest - 1) >= Math.max(0.05, Math.abs(e.f - 1) / 2);
    if (auffaellig) { e.klasse = 'F?'; Fq.push(e); } else { e.klasse = 'U'; U.push(e); }
  }
});

console.log('\n-- Ergebnis (beurteilte Ereignisse) --');
console.log('F  (Datum+Faktor treffen, absolute Toleranz): ' + F.length);
F.forEach(function (e) { console.log('   ' + e.sym.padEnd(6) + e.datum + '  f=' + e.f.toFixed(4) + '  q=' + (e.qNaechste != null ? e.qNaechste.toFixed(4) : '-') + '  p_zufall=' + (100 * e.p).toFixed(3) + ' %'); });
console.log('F? (Sprung am Datum, Faktor abweichend): ' + Fq.length);
Fq.slice(0, 10).forEach(function (e) { console.log('   ' + e.sym.padEnd(6) + e.datum + '  f=' + e.f.toFixed(4) + '  q=' + (e.qNaechste != null ? e.qNaechste.toFixed(4) : '-')); });
console.log('U  (kein Bezug): ' + U.length);
console.log('\nStrukturell nicht entscheidbar (Faktor zu nah an 1): ' + gesperrt.length);
var proFaktor = {};
gesperrt.forEach(function (e) { var k = e.f.toFixed(4); (proFaktor[k] || (proFaktor[k] = [])).push(e.sym); });
Object.keys(proFaktor).sort().forEach(function (k) { console.log('   f=' + k + ': ' + proFaktor[k].length + ' (' + proFaktor[k].slice(0, 6).join(',') + ')'); });

var schwelle = nullwert + 3 * Math.sqrt(nullwert);
var urteil = F.length >= schwelle ? 'KLASSE BELEGT (F ' + F.length + ' >= Schwelle ' + schwelle.toFixed(2) + ', Nullwert ' + nullwert.toFixed(2) + ')'
  : 'nicht belegt (F ' + F.length + ' < Schwelle ' + schwelle.toFixed(2) + ', Nullwert ' + nullwert.toFixed(2) + ')';
if (!beurteilt.length) urteil = 'strukturell nicht entscheidbar - kein Ereignis passierte das Gate';
console.log('\nURTEIL: ' + urteil);
fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'),
  JSON.stringify({ gemessenAm: new Date().toISOString(), tolAbs: TOL_ABS, gateP: GATE_P,
    kandidaten: ereignisse.length, beurteilt: beurteilt.length, gesperrt: gesperrt.length,
    nullwert: nullwert, schwelle: schwelle, F: F, Fq: Fq, U: U, gesperrteListe: gesperrt, urteil: urteil }, null, 1));
console.log('lauf-<zeit>.json geschrieben. NICHTS am Archiv geaendert.');
