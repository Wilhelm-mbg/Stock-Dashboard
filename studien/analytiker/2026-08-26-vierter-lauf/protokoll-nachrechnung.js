'use strict';
/* VIERTER LAUF 26.08.2026 (ausserplanmaessig, 09:00, waehrend der Neumessung):
 * Unabhaengige Nachrechnung der frischen Protokolle des Neumessungs-Laufs
 * (Maschine 1.2.0). KEIN Aufruf der Messmaschine selbst - der Rechenlauf des
 * Masters laeuft parallel und wird nicht belastet. Gerechnet wird ausschliesslich
 * aus den abgelegten JSON-Zahlen.
 *
 * Geprueft je Protokoll:
 *  (1) codeStand/version einheitlich (Sperre auf messmaschine.js haelt).
 *  (2) Urteil je Variante aus bestaetigung.ueberschuss unabhaengig nachgefaellt
 *      (eigene normInv-Referenz nach Acklam + Halley-Verfeinerung ueber eigene erfc).
 *  (3) delta80 und aussicht.tage80 nachgerechnet - Feldpruefung der #91-Reparatur.
 *  (4) bestesUrteil = erster Treffer der Rangfolge - nachvollzogen, UND:
 *      Bestandsaufnahme ueber ALLE abgelegten Protokolle, welche Urteilsarten
 *      vorkommen (Frage: kann die Rangfolge 'widerlegt' verdecken? fehlt
 *      'bestaetigt-aber-nullpunkt-verschoben'?).
 *  (5) Placebo je Protokoll: |t| und MDE ausgewiesen.
 */
var fs = require('fs'), path = require('path');
var DIR = path.resolve(__dirname, '..', '..', 'messmaschine', 'protokolle');

/* ---- eigene Normalquantil-Referenz (Acklam), Halley-verfeinert ueber eigene erfc ---- */
function erfc(x) { // Abramowitz/Stegun 7.1.26-artige Chebyshev-Naeherung, |eps|<1.2e-7,
  // danach reicht die Halley-Iteration auf 1e-12, weil sie quadratisch/kubisch zieht.
  var z = Math.abs(x), t = 1 / (1 + z / 2);
  var ans = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 +
    t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? ans : 2 - ans;
}
function phi(x) { return 0.5 * erfc(-x / Math.SQRT2); }
function normInv(p) {
  // Acklam-Startwert
  var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  var pl = 0.02425, x, q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) { q = p - 0.5; r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else { q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  // zwei Halley-Schritte
  for (var i = 0; i < 2; i++) {
    var e = phi(x) - p, u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
    x = x - u / (1 + x * u / 2);
  }
  return x;
}
function bonferroni(tests, alpha) { return normInv(1 - (alpha / tests) / 2); }
/* Selbstkontrolle: zwei gesicherte Literaturwerte (z_0.975, z_0.995) plus Rundlauf
 * phi(normInv(p))=p an den real gebrauchten p-Werten (tests=1..7). Ein dritter
 * Literaturwert stand hier zuerst aus dem Gedaechtnis und war um 2e-4 falsch -
 * entfernt statt geglaettet. Die Halley-Verfeinerung konvergiert gegen den Fixpunkt
 * der eigenen erfc (|eps| ~ 1e-7); gemessen 3,7e-8 bei 1,96. Fuer Vergleiche mit
 * relativer Toleranz 1e-5 sind das drei Groessenordnungen Reserve. */
var sk = [[0.975, 1.959963984540054], [0.995, 2.5758293035489004]];
sk.forEach(function (s) {
  var d = Math.abs(normInv(s[0]) - s[1]);
  if (d > 5e-7) throw new Error('Selbstkontrolle normInv verfehlt: ' + s[0] + ' Abw ' + d);
});
var rmax = 0;
for (var tt = 1; tt <= 7; tt++) {
  var pp = 1 - (0.05 / tt) / 2, rr = Math.abs(phi(normInv(pp)) - pp);
  if (rr > rmax) rmax = rr;
}
if (rmax > 1e-12) throw new Error('Rundlauf phi(normInv(p)) verfehlt: ' + rmax);
console.log('normInv-Selbstkontrolle: 2 Literaturwerte |Abw|<=5e-7, Rundlauf tests=1..7 |Abw|<=1e-12. OK\n');

var Z80 = 0.8416212335729143; // Phi^-1(0.8); Maschine nutzt 0.8416212 (VERFAHREN)

/* ---- (1)-(3),(5): frische Protokolle ---- */
var frisch = fs.readdirSync(DIR).filter(function (f) { return f.indexOf('2026-08-26') >= 0; }).sort();
var staende = {}, abweichungen = 0, geprueft = 0;
frisch.forEach(function (f) {
  var p = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  var key = (p.verfahren.version || '?') + '@' + (p.verfahren.codeStand || '?');
  staende[key] = (staende[key] || 0) + 1;
  var schwelle = bonferroni(p.tests, p.verfahren.alpha);
  console.log('== ' + f + '  tests=' + p.tests + '  Schwelle(eigen)=' + schwelle.toFixed(6));
  // aussicht/delta80 stehen in entscheidungen unter 'Urteil Variante N'
  var urteilE = {};
  (p.entscheidungen || []).forEach(function (e) {
    var m = /^Urteil Variante (\d+)$/.exec(e.regel || '');
    if (m) urteilE[+m[1]] = e;
  });
  p.ergebnisse.forEach(function (r, vi) {
    var u = r.bestaetigung.ueberschuss;
    var urteil;
    if (u.tage < 30) urteil = 'nicht-messbar';
    else if (u.mde == null) urteil = 'nicht-messbar';
    else if (Math.abs(u.tagesmittel) < u.mde) urteil = 'nicht-entscheidbar';
    else if (u.t >= schwelle && u.tagesmittel > 0) urteil = 'bestaetigt(placebo-abhaengig)';
    else if (u.t <= -schwelle) urteil = 'widerlegt';
    else urteil = 'nicht-bestaetigt';
    var prot = p.urteile[vi];
    var ok = (urteil === prot) || (urteil.indexOf('bestaetigt(') === 0 && (prot === 'bestaetigt' || prot === 'bestaetigt-aber-nullpunkt-verschoben'));
    var zeile = '  V' + vi + ': eigen=' + urteil + '  protokoll=' + prot + (ok ? '' : '  <-- ABWEICHUNG');
    // delta80 / tage80
    var e = urteilE[vi], eg = e && e.ergebnis || {};
    var d80 = (u.se > 0) ? (schwelle + Z80) * u.se : null;
    if (eg.delta80 != null && d80 != null) {
      var dd = Math.abs(eg.delta80 - d80) / d80;
      zeile += '  delta80 relAbw=' + dd.toExponential(1);
      if (dd > 1e-5) { zeile += ' <-- ABWEICHUNG'; ok = false; }
    }
    if (u.tagesmittel > 0 && u.se > 0 && u.tage > 0) {
      var sd = u.se * Math.sqrt(u.tage);
      var t80 = Math.ceil(Math.pow(schwelle + Z80, 2) * sd * sd / (u.tagesmittel * u.tagesmittel));
      var pt80 = eg.aussicht && eg.aussicht.tage80;
      zeile += '  tage80 eigen=' + t80 + ' protokoll=' + pt80;
      // Rundungsrand: Schwellen-Differenz 1e-7 kann ceil um 1 kippen bei riesigen Zahlen
      if (pt80 != null && Math.abs(pt80 - t80) > Math.max(1, t80 * 1e-5)) { zeile += ' <-- ABWEICHUNG'; ok = false; }
      // Gegenprobe #91: was haette die ALTE Formel (zAlpha statt schwelle) gesagt?
      var alt = Math.ceil(Math.pow(1.959964 + Z80, 2) * sd * sd / (u.tagesmittel * u.tagesmittel));
      if (p.tests > 1) zeile += ' (alteFormel=' + alt + ')';
    }
    geprueft++;
    if (!ok) abweichungen++;
    console.log(zeile);
  });
  // bestesUrteil nachvollziehen
  var rang = ['bestaetigt', 'nicht-bestaetigt', 'nicht-entscheidbar', 'nicht-messbar', 'widerlegt'];
  var eigenBest = rang.filter(function (k) { return p.urteile.indexOf(k) >= 0; })[0] || 'nicht-messbar';
  console.log('  bestesUrteil: protokoll=' + p.bestesUrteil + '  rangfolge-nachvollzogen=' + eigenBest +
    (eigenBest === p.bestesUrteil ? '' : '  <-- ABWEICHUNG'));
  if (p.placebo) console.log('  placebo: t=' + p.placebo.t.toFixed(3) + '  MDE=' + (p.placebo.mde * 100).toFixed(4) + ' Pp  tage=' + p.placebo.tage);
  console.log('');
});
console.log('Maschinen-Staende der frischen Protokolle:', JSON.stringify(staende));
console.log('Varianten geprueft: ' + geprueft + ', Abweichungen: ' + abweichungen + '\n');

/* ---- (4): Bestandsaufnahme Urteilsarten ueber ALLE Protokolle ---- */
var arten = {}, gemischt = [];
fs.readdirSync(DIR).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) {
  var p; try { p = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { return; }
  if (!p.urteile) return;
  p.urteile.forEach(function (u) { arten[u] = (arten[u] || 0) + 1; });
  var uniq = {}; p.urteile.forEach(function (u) { uniq[u] = 1; });
  if (Object.keys(uniq).length > 1) gemischt.push(f + ': [' + p.urteile.join(', ') + '] -> ' + p.bestesUrteil);
});
console.log('Urteilsarten ueber alle abgelegten Protokolle:', JSON.stringify(arten));
console.log('Protokolle mit gemischten Urteilen:');
gemischt.forEach(function (g) { console.log('  ' + g); });
