'use strict';
/* Praefix-Probe Donchian: Signal auf bars.slice(0,i+1) an Stelle i  ===  Signal auf ganzer Reihe an Stelle i.
 * Zusaetzlich: Fenster-Invarianz (Live uebergibt ALLE sigBars, Messung ein Fenster von N+10). */
var fs = require('fs');
var Q = require('../../../quant.js');
var D = require('./donchian.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var SYMS = ['AAPL', 'MSFT', 'NVDA'], IV = '5m', PRO_SYM = 250;
var P = D.LIVE;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);

function sigStr(s) { return s ? String(s.dir) : 'null'; }
var geprueft = 0, abw = 0, abwFenster = 0, sigCount = { '1': 0, '-1': 0, 'null': 0 };
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length, minI = P.period + 10;
  for (var k = 0; k < PRO_SYM; k++) {
    var i = minI + Math.floor(rnd() * (n - minI));
    var voll = D.donchian(bars, i, P);                          // ganze Reihe, Stelle i
    var prae = D.donchian(bars.slice(0, i + 1), i, P);          // nur Vergangenheit bis i
    // Live-Form: Q.donchianSignal auf ALLEN Bars bis i (so ruft depot.js:2705 auf)
    var liveS = Q.donchianSignal(bars.slice(0, i + 1), P.period, P.confirmBps).signal;
    var live = liveS === 'call' ? { dir: 1 } : liveS === 'put' ? { dir: -1 } : null;
    geprueft++;
    sigCount[sigStr(voll)]++;
    if (sigStr(voll) !== sigStr(prae)) { abw++; console.log('ABWEICHUNG', sym, i, sigStr(voll), sigStr(prae)); }
    if (sigStr(voll) !== sigStr(live)) { abwFenster++; console.log('FENSTER-ABWEICHUNG', sym, i, sigStr(voll), sigStr(live)); }
  }
});
console.log(JSON.stringify({ symbole: SYMS, zeitrahmen: IV, params: P, geprueft: geprueft, abweichungen: abw, fensterAbweichungen: abwFenster, signale: sigCount }));
