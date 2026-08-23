'use strict';
/* VORPROBE, KEIN TEST: Wie oft greift der Live-Stop ueberhaupt?
 *
 * Anlass: Im Ergebnisdokument steht als offene Differenz, dass die Messung ohne
 * Stop lief, live aber einer aktiv ist. Bevor daraus ein vorregistrierter Test
 * wird, gehoert die Vorfrage geklaert - und die ist rein beschreibend:
 * In wie vielen der 1.151 Trades faellt der Basiswert innerhalb von 26 Kerzen
 * ueberhaupt um 20 %?
 *
 * Das ist ausdruecklich KEINE Hypothesenpruefung. Es wird kein Ueberschuss gegen
 * eine Kontrolle gerechnet und kein Urteil gefaellt. Wer eine Haeufigkeit
 * auszaehlt, macht keinen Test - und spart sich einen, wenn die Antwort "so gut
 * wie nie" lautet.
 *
 * DER LIVE-STOP, nachgelesen statt angenommen:
 *   slOf(c) = -(c.scalpSL || 20) / 100      (depot.js)
 *   gespeichert: scalpSL = 20               -> Stop bei -20 %
 *   instrument 'basis'                      -> ret = Bewegung des BASISWERTS
 *   geprueft wird gegen den laufenden Kurs (Scan alle 90 s), also faktisch
 *   innerhalb der Kerze -> hier gegen das Kerzentief.
 * Das Feld D.intraday.sl (-0,25) wird von modeParams NICHT benutzt; es waere
 * -25 %. Massgeblich ist scalpSL.
 *
 * Aufruf: node studien/messmaschine/kapitulation-stop-vorprobe.js
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var Q = require('../../quant.js');

var ARCHIV = process.argv[2] ||
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');
var P = { ENTRY: 'kapitulation', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };
var H = 26, VOR = 261;
var STOPS = [0.20, 0.15, 0.10, 0.05];   // nur zum Auszaehlen, nicht als Varianten

var syms = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_60m_') === 0; })
  .map(function (f) { return f.slice(9, -5); }).filter(function (s) { return s.indexOf('-USD') === -1; });

var trades = [];
syms.forEach(function (sym) {
  var b;
  try { b = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_60m_' + sym + '.json'), 'utf8')).series; } catch (e) { return; }
  for (var i = VOR; i < b.length - H; i++) {
    var s = null; try { s = Q.einstiegSignal(b, i, P); } catch (e) { continue; }
    if (!s || s.dir !== 'call') continue;
    var ein = b[i][1];
    if (!(ein > 0)) continue;
    /* Tiefstes Tief innerhalb der Haltedauer, und wann es kam. */
    var tiefstes = Infinity, wann = -1;
    for (var k = i + 1; k <= i + H; k++) {
      var tf = b[k][4] != null ? b[k][4] : b[k][1];
      if (tf < tiefstes) { tiefstes = tf; wann = k - i; }
    }
    var ende = b[i + H][1];
    trades.push({ sym: sym, tag: new Date(b[i][0]).toISOString().slice(0, 10),
      rueck: tiefstes / ein - 1, wann: wann, ergebnis: ende / ein - 1 });
  }
});

console.log('VORPROBE: greift der Live-Stop ueberhaupt?');
console.log(trades.length + ' Kapitulations-Signale, Haltedauer ' + H + ' Kerzen, Basiswert.\n');
console.log('Stop bei   Trades getroffen   Anteil    Ergebnis dieser Trades OHNE Stop');
STOPS.forEach(function (st) {
  var t = trades.filter(function (x) { return x.rueck <= -st; });
  var mittel = t.length ? t.reduce(function (a, x) { return a + x.ergebnis; }, 0) / t.length : 0;
  console.log('  -' + (st * 100).toFixed(0).padStart(2) + ' %' + String(t.length).padStart(18) + '   ' +
    (100 * t.length / trades.length).toFixed(2).padStart(5) + ' %   ' +
    (t.length ? ((mittel >= 0 ? '+' : '') + (mittel * 100).toFixed(2) + ' %') : '–'));
});

/* Und die Gegenfrage: Wie tief geht ein typischer Trade zwischendurch? */
var rueck = trades.map(function (t) { return t.rueck; }).sort(function (a, b) { return a - b; });
function q(p) { return (rueck[Math.floor(rueck.length * p)] * 100).toFixed(2); }
console.log('\nZwischentief je Trade (Verteilung):');
console.log('  schlechteste 1 %  ' + q(0.01) + ' %');
console.log('  schlechteste 5 %  ' + q(0.05) + ' %');
console.log('  Median            ' + q(0.50) + ' %');

/* Der eine Trade, der im Ergebnisdokument steht. */
var dl = trades.filter(function (t) { return t.sym === 'DLTR' && t.tag === '2024-08-29'; })[0];
if (dl) console.log('\nDLTR 2024-08-29 (der schlechteste Trade): Zwischentief ' + (dl.rueck * 100).toFixed(2) +
  ' % nach ' + dl.wann + ' Kerzen, Endergebnis ' + (dl.ergebnis * 100).toFixed(2) + ' %');
var af = trades.filter(function (t) { return t.sym === 'AFRM' && t.tag === '2025-04-04'; })[0];
if (af) console.log('AFRM 2025-04-04 (der beste Trade):        Zwischentief ' + (af.rueck * 100).toFixed(2) +
  ' % nach ' + af.wann + ' Kerzen, Endergebnis ' + (af.ergebnis * 100).toFixed(2) + ' %');
