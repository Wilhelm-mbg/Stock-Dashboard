/* Praefix-Probe 'kanaltrend': Signal auf bars.slice(0, i+1) an Stelle i muss gleich dem
 * Signal auf der ganzen Reihe an Stelle i sein. Abweichung = Zukunftsblick.
 * 3 Symbole x 60m (Live-Zeitrahmen der App), >= 200 zufaellige Indizes je Symbol.
 * Zusaetzlich: Zustandsprobe (gleicher Aufruf zweimal, andere Reihenfolge). */
var fs = require('fs');
var det = require('./kanaltrend.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m';
var SYMS = (process.argv[3] || 'AAPL,MSFT,NVDA').split(',');
var N_PRO_SYM = parseInt(process.argv[4] || '250', 10);

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rnd = mulberry32(20260822);   // EIN Generator, ausserhalb aller Schleifen

function lade(sym) {
  var d = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8'));
  var b = d.series;
  // letzte Kerze ist im Archiv ein Quote-Stempel (vol 0, H=L=C, Zeit nicht auf Raster) -> weg
  return b.slice(0, b.length - 1);
}

var gesamt = 0, abweich = 0, signale = 0, reihenfolge = 0;
var PAR = [det.DEFAULT, Object.assign({}, det.DEFAULT, { MINQ: 40, confirmBps: 5 })];
SYMS.forEach(function (sym) {
  var bars = lade(sym);
  var n = bars.length;
  PAR.forEach(function (P, pi) {
    var lokalN = 0, lokalAb = 0, lokalSig = 0, beispiele = [];
    for (var k = 0; k < N_PRO_SYM; k++) {
      var i = 300 + Math.floor(rnd() * (n - 300));
      var voll = det.signal(bars, i, P);
      var praefix = det.signal(bars.slice(0, i + 1), i, P);
      // Zustandsprobe: derselbe Aufruf nach einem Aufruf an anderer Stelle
      det.signal(bars, Math.max(300, i - 7), P);
      var nochmal = det.signal(bars, i, P);
      var a = JSON.stringify(voll), b = JSON.stringify(praefix), c = JSON.stringify(nochmal);
      lokalN++;
      if (voll) lokalSig++;
      if (a !== b) { lokalAb++; if (beispiele.length < 5) beispiele.push(i + ':' + a + '/' + b); }
      if (a !== c) reihenfolge++;
    }
    gesamt += lokalN; abweich += lokalAb; signale += lokalSig;
    console.log(sym, IV, 'Param#' + pi, 'MINQ=' + P.MINQ, 'conf=' + P.confirmBps,
      'geprueft=' + lokalN, 'Signale=' + lokalSig, 'Abweichungen=' + lokalAb,
      beispiele.length ? 'Bsp: ' + beispiele.join(' ') : '');
  });
});
console.log('SUMME geprueft=' + gesamt + ' Signale=' + signale + ' Abweichungen=' + abweich +
  ' Reihenfolge-Abweichungen=' + reihenfolge +
  ' Trefferquote=' + (100 * (gesamt - abweich) / gesamt).toFixed(2) + '%');
