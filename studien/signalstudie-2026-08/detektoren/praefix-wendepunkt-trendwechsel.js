/* Praefix-Probe 'wendepunkt-trendwechsel': 3 Symbole x 1m, >= 200 Zufallsindizes je Symbol.
 * Vergleich: Q.trendwechsel auf bars.slice(0, i+1) (Referenz, App-Aufruf)
 *        vs. schnelle Variante auf der ganzen Reihe an Stelle i.
 * Zufall: mulberry32, Generator AUSSERHALB der Schleife.
 * Zusatz: Vergleich mit dem Studien-Detektor (hauptstudie.js detect(), ohne Cooldown/MinRest)
 *         ueber die ganze Reihe - belegt, dass 'ersteImAbschnitt' die Studienlogik trifft. */
'use strict';
var fs = require('fs');
var Q = require('../../../quant.js');
var D = require('./wendepunkt-trendwechsel.js');
var STORE = (process.env.APPDATA || require('os').homedir() + '/AppData/Roaming') + '/markt-dashboard/store/';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rnd = mulberry32(20260822);   // ausserhalb der Schleife

var SYMS = ['AAPL', 'NVDA', 'MSFT'], IV = '1m', N_PROBE = 250;
var P = { S: D.LIVE.S, F: D.LIVE.F };
var gesamt = 0, abw = 0, sigTreffer = 0;
var s = function (x) { return x ? (x.dir > 0 ? '+1' : '-1') : 'null'; };

/* Studien-Detektor (hauptstudie.js 63-93) ohne Cooldown/MinRest, zum Abgleich. */
function detectStudie(bars, S, F) {
  var wnk = function (k) { return k.steigung * k.n / k.breite; };
  var wp = Q.wendepunkte(bars, F);
  var all = wp.hoch.concat(wp.tief).map(function (w) { return w.i; }).sort(function (a, b) { return a - b; });
  var sigs = [], p = 0, C = [], sectionDone = true, winkelAlt = 0;
  for (var i = 0; i < bars.length; i++) {
    while (p < all.length && all[p] + F <= i) {
      C.push(all[p]); p++; sectionDone = false; winkelAlt = 0;
      if (C.length >= 2) { var kAlt = Q.kanalUeber(bars, C[C.length - 2], C[C.length - 1]); if (kAlt && kAlt.breite > 0) winkelAlt = wnk(kAlt); }
      if (Math.abs(winkelAlt) < 0.5) sectionDone = true;
    }
    if (sectionDone) continue;
    var w = C[C.length - 1];
    if (i - w < 10) continue;
    var kNeu = Q.kanalUeber(bars, w, i);
    if (!kNeu || !(kNeu.breite > 0)) continue;
    var wn = wnk(kNeu);
    if (Math.abs(wn) < S) continue;
    if (Math.sign(wn) === Math.sign(winkelAlt)) continue;
    sectionDone = true;
    sigs.push({ i: i, dir: wn > 0 ? 1 : -1 });
  }
  return sigs;
}

SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length;
  var wp = D.vorbereiten(bars, P);
  var pFast = { S: P.S, F: P.F, _wp: wp };
  var t0 = Date.now(), lokalAbw = 0, lokalSig = 0;
  // 1) Zufallsindizes
  for (var k = 0; k < N_PROBE; k++) {
    var i = 40 + Math.floor(rnd() * (n - 40));
    var a = D.signalPraefix(bars, i, P);
    var b = D.signal(bars, i, pFast);
    gesamt++;
    if (s(a) !== s(b)) { lokalAbw++; abw++; if (lokalAbw <= 5) console.log('  ABWEICHUNG', sym, 'i=' + i, 'praefix=' + s(a), 'ganz=' + s(b)); }
    if (a) lokalSig++;
  }
  // 2) Gezielt: alle Signalkerzen der schnellen Variante (Cluster) gegen das Praefix - bis 150 Stueck
  var sigIdx = [];
  for (var j = 40; j < n; j++) { if (D.signal(bars, j, pFast)) sigIdx.push(j); }
  var schritt = Math.max(1, Math.floor(sigIdx.length / 150)), gez = 0, gezAbw = 0;
  for (var m = 0; m < sigIdx.length; m += schritt) {
    var ii = sigIdx[m], a2 = D.signalPraefix(bars, ii, P), b2 = D.signal(bars, ii, pFast);
    gesamt++; gez++;
    if (s(a2) !== s(b2)) { gezAbw++; abw++; if (gezAbw <= 5) console.log('  ABWEICHUNG(sig)', sym, 'i=' + ii, 'praefix=' + s(a2), 'ganz=' + s(b2)); }
  }
  sigTreffer += lokalSig;
  // 3) Cluster-Statistik und Abgleich mit der Studienlogik
  var erste = [], pE = { S: P.S, F: P.F, _wp: wp, ersteImAbschnitt: true };
  for (var j2 = 40; j2 < n; j2++) { var e = D.signal(bars, j2, pE); if (e) erste.push({ i: j2, dir: e.dir }); }
  var stud = detectStudie(bars, P.S, P.F);
  var key = function (x) { return x.i + ':' + x.dir; };
  var setStud = {}; stud.forEach(function (x) { setStud[key(x)] = 1; });
  var gleich = erste.filter(function (x) { return setStud[key(x)]; }).length;
  console.log(sym + ' ' + IV + ': n=' + n + ' | Zufall ' + N_PROBE + ' Indizes, Abweichungen ' + lokalAbw +
    ', davon Signalkerzen ' + lokalSig + ' | gezielt ' + gez + ' Signalkerzen, Abweichungen ' + gezAbw +
    ' | Signalkerzen gesamt ' + sigIdx.length + ' (jede Kerze), erste je Abschnitt ' + erste.length +
    ' | Studien-detect (ohne Cooldown/MinRest) ' + stud.length + ', identisch ' + gleich +
    ' | ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
});
console.log('GESAMT: geprueft ' + gesamt + ', Abweichungen ' + abw + ', Trefferquote ' + ((1 - abw / gesamt) * 100).toFixed(2) + ' %' +
  (abw === 0 ? ' -> walk-forward' : ' -> ZUKUNFTSBLICK'));
