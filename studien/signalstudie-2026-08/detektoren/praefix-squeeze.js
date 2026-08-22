'use strict';
/* Praefix-Probe (Zukunftsblick) fuer squeezeSignal:
   Signal auf bars.slice(0, i+1) muss dem Signal "an Stelle i" beim Lauf auf der ganzen
   Reihe entsprechen. Da squeezeSignal selbst nur das Ende der Reihe auswertet, ist
   "ganze Reihe an Stelle i" = Aufruf ueber das Fenster, das Backtest (quant.js:1602,
   win = bars.slice(ci-260, ci+1)) und Live (depot.js:2708, volle sigBars) benutzen.
   Drei Laeufe je Index: (a) Praefix, (b) Backtest-Fenster 261 Bars, (c) volle Reihe
   mit angehaengten ZUKUNFTS-Bars (i+1..n) darf das Signal an i nicht aendern. */
var fs = require('fs');
var Q = require('../../../quant.js');
var D = require('./squeeze.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m';
var SYMS = (process.argv[3] || 'AAPL,MSFT,NVDA').split(',');
var N_IDX = parseInt(process.argv[4] || '300', 10);
var PERIOD = 20;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rnd = mulberry32(20260822);   // EIN Generator, ausserhalb aller Schleifen

function sigOf(s) { return s && s.signal ? s.signal : null; }

var gesamt = 0, abw = 0, signale = { call: 0, put: 0 }, gesamtAbw = [];
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length;
  var lo = PERIOD + 100, hi = n - 2;
  var gepr = 0, abwS = 0;
  for (var k = 0; k < N_IDX; k++) {
    var i = lo + Math.floor(rnd() * (hi - lo + 1));
    // (a) Praefix: nur Vergangenheit bis i
    var a = sigOf(Q.squeezeSignal(bars.slice(0, i + 1), PERIOD));
    // (b) Backtest-Fenster wie einstiegSignal: 261 Bars bis i
    var b = sigOf(Q.squeezeSignal(bars.slice(Math.max(0, i - 260), i + 1), PERIOD));
    // (c) Huelle fuer das Messgeschirr auf der GANZEN Reihe an Stelle i
    var c = D.squeeze(bars, i, { period: PERIOD, kSigma: 2 });
    var cS = c ? (c.dir > 0 ? 'call' : 'put') : null;
    // (d) Zukunfts-Manipulation: alle Bars nach i auf einen absurden Kurs setzen - darf nichts aendern
    var mani = bars.slice(0, i + 1).concat(bars.slice(i + 1).map(function (p) { return [p[0], p[1] * 3, p[2], p[3] * 3, p[4] * 3]; }));
    var d = D.squeeze(mani, i, { period: PERIOD, kSigma: 2 });
    var dS = d ? (d.dir > 0 ? 'call' : 'put') : null;
    gepr++;
    if (a) signale[a]++;
    if (a !== b || a !== cS || a !== dS) {
      abwS++;
      if (gesamtAbw.length < 10) gesamtAbw.push(sym + '@' + i + ' praefix=' + a + ' fenster=' + b + ' huelle=' + cS + ' manipuliert=' + dS);
    }
  }
  gesamt += gepr; abw += abwS;
  console.log(IV, sym, 'n=' + n, 'geprueft=' + gepr, 'abweichungen=' + abwS);
});
console.log('SUMME', IV, 'geprueft=' + gesamt, 'abweichungen=' + abw, 'trefferquote=' + ((gesamt - abw) / gesamt * 100).toFixed(2) + '%', 'signale=' + JSON.stringify(signale));
if (gesamtAbw.length) console.log('Beispiele:', gesamtAbw.join('\n'));
