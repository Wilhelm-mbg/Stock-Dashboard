'use strict';
/* Analytiker 27.08.2026: die 69 Pendel-Paare gegen die Ereignis-Dateien halten.
 * PM-Auflagen: (a) Quote ausweisen, wie viele Paare ueberhaupt ein Ereignis haben;
 * (b) je Fall die Richtung; (c) Spin-off-artige Faelle ausdruecklich als
 * "unentscheidbar mit diesen zwei Endpunkten", nie als "kein Fund".
 * Toleranzen wie in der Vorregistrierung skalenfehler §2: Datum +-1 Handelstag,
 * Faktor +-10 %. Die foermlichen §2-Urteile faellt die Rolle Berechnungen auf
 * denselben Dateien - hier ist die Analytiker-Sicht fuer die Tafel. NUR LESEN. */
var fs = require('fs'), path = require('path');
var D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var EREIGNISSE = path.join(__dirname, '..', '..', 'vorregistrierung-2026-08-27-skalenfehler', 'ereignisse');

/* I1 exakt wie in der Vorregistrierung: Faktor >=2 bzw. <=0,5; Pendel |Produkt-1|<=0,10; Fenster 30 */
function paareVon(s) {
  var spr = [], out = [];
  for (var i = 1; i < s.length; i++) {
    var a = s[i - 1][1], b = s[i][1];
    if (!(a > 0) || !(b > 0)) continue;
    var r = b / a;
    if (r >= 2 || r <= 0.5) spr.push({ i: i, t: s[i][0], d: new Date(s[i][0]).toISOString().slice(0, 10), r: r });
  }
  var benutzt = {};
  for (var p = 0; p < spr.length; p++) {
    if (benutzt[p]) continue;
    for (var q = p + 1; q < spr.length; q++) {
      if (benutzt[q]) continue;
      var A = spr[p], B = spr[q];
      if (B.i - A.i > 30) break;
      if ((A.r >= 2) === (B.r >= 2)) continue;
      if (Math.abs(A.r * B.r - 1) > 0.10) continue;
      benutzt[p] = benutzt[q] = 1;
      out.push({ a: A, b: B, tage: B.i - A.i });
      break;
    }
  }
  return out;
}
function handelstagDiff(s, d1, d2) {
  /* Abstand in Handelstagen der Reihe selbst */
  var t = s.map(function (k) { return new Date(k[0]).toISOString().slice(0, 10); });
  var i1 = t.indexOf(d1), i2 = t.indexOf(d2);
  if (i1 < 0 || i2 < 0) return null;
  return Math.abs(i1 - i2);
}
function passtEreignis(s, leg, ereignisse) {
  var best = null;
  ereignisse.forEach(function (e) {
    if (e.art !== 'split') return;
    var f = e.faktor;
    var kandidaten = [f, 1 / f];
    var ok = kandidaten.some(function (k) { return Math.abs(leg.r / k - 1) <= 0.10; });
    if (!ok) return;
    var dd = handelstagDiff(s, leg.d, e.datum);
    if (dd == null) {
      /* Ereignisdatum liegt nicht in der Reihe (z. B. Wochenende/ausserhalb) - Kalendertage als Rueckfall */
      dd = Math.abs(Date.parse(leg.d) - Date.parse(e.datum)) / 86400000 <= 3 ? 1 : 99;
    }
    if (dd <= 1 && (!best || dd < best.dd)) best = { e: e, dd: dd };
  });
  return best;
}

var syms = fs.readdirSync(EREIGNISSE).filter(function (f) { return /\.json$/.test(f); })
  .map(function (f) { return f.replace('.json', ''); });
var zeilen = [], statistik = { paare: 0, beideLegs: 0, einLeg: 0, keinLeg: 0 };
syms.forEach(function (sym) {
  var f1 = path.join(D, 'bars_1d_' + sym + '.json');
  if (!fs.existsSync(f1)) return;
  var s = JSON.parse(fs.readFileSync(f1, 'utf8')).series || [];
  var paare = paareVon(s);
  if (!paare.length) return;
  var ev = JSON.parse(fs.readFileSync(path.join(EREIGNISSE, sym + '.json'), 'utf8')).ereignisse || [];
  paare.forEach(function (p) {
    statistik.paare++;
    var mA = passtEreignis(s, p.a, ev), mB = passtEreignis(s, p.b, ev);
    var n = (mA ? 1 : 0) + (mB ? 1 : 0);
    if (n === 2) statistik.beideLegs++; else if (n === 1) statistik.einLeg++; else statistik.keinLeg++;
    var deutung;
    if (n === 2) deutung = 'BEIDE Legs ereignis-belegt (zwei echte Splits) - Archiv zeigt echte Ereignisse, kein Defekt';
    else if (n === 1) deutung = 'EIN Leg ereignis-belegt, das andere nicht - Verdacht Teil-Anpassung: die Zone zwischen den Legs steht auf falscher Skala (Richtung: das ereignislose Leg ist der Artefakt-Sprung)';
    else deutung = (Math.abs(p.a.r * p.b.r - 1) <= 0.05 && p.tage <= 15)
      ? 'kein Ereignis, Faktoren fast exakt invers, Zone kurz - Defekt-verdaechtig, aber UNENTSCHEIDBAR mit diesen zwei Endpunkten (Spin-off/ungefuehrtes Ereignis nicht ausschliessbar)'
      : 'kein Ereignis - UNENTSCHEIDBAR mit diesen zwei Endpunkten (echtes Marktereignis oder ungefuehrtes Korporat-Ereignis)';
    zeilen.push(sym.padEnd(6) + p.a.d + ' r=' + p.a.r.toFixed(3).padStart(8) + '  /  ' + p.b.d + ' r=' + p.b.r.toFixed(3).padStart(8) +
      '  Zone ' + String(p.tage).padStart(2) + ' HT  ' +
      (mA ? '[A=' + mA.e.datum + ' f=' + mA.e.faktor + ']' : '[A: kein Ereignis]') +
      (mB ? '[B=' + mB.e.datum + ' f=' + mB.e.faktor + ']' : '[B: kein Ereignis]') + '  -> ' + deutung);
  });
});
zeilen.sort().forEach(function (z) { console.log(z); });
console.log('\n== QUOTE (PM-Auflage 2): ' + statistik.paare + ' Paare | beide Legs belegt: ' + statistik.beideLegs +
  ' | ein Leg: ' + statistik.einLeg + ' | kein Leg: ' + statistik.keinLeg + ' ==');
