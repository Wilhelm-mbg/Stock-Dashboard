'use strict';
/* WIE VIELE DATEN BRAUCHTE ES, UM DEN KAPITULATIONS-DIP ZU ENTSCHEIDEN?
 *
 * Die Messung vom 24.08.2026 ergab: Ueberschuss +0,201 Pp gegen eine MDE von
 * 0,695 Pp. Der Effekt muesste also 3,5-mal groesser sein, um mit diesen Daten
 * aufloesbar zu sein. Die naechste Frage ist nicht "ist er echt", sondern "kann
 * man das ueberhaupt herausfinden" - und daran haengt, ob weiteres Messen an
 * dieser Kante ueberhaupt Sinn hat.
 *
 * ZWEI HEBEL, beide hier empirisch gemessen statt geschaetzt:
 *   MEHR TAGE    - die MDE faellt mit 1/Wurzel(Tage). Reine Rechnung.
 *   MEHR WERTE   - unklar. Mehr Werte bringen mehr Signale JE TAG, aber Werte
 *                  bewegen sich an einem Tag gemeinsam. Ab wann bringt der
 *                  naechste Wert nichts mehr? Das laesst sich nur messen:
 *                  Teilstichproben ziehen und sehen, wie die MDE faellt.
 *
 * Aufruf: node studien/messmaschine/kapitulation-auflosung.js
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var M = require('./messmaschine.js');
var S = require('./strategien/kapitulation.js');

var ARCHIV = process.argv[2] ||
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');

var alle = fs.readdirSync(ARCHIV)
  .filter(function (f) { return f.indexOf('bars_60m_') === 0; })
  .map(function (f) { return f.slice(9, -5); })
  .filter(function (s) { return s.indexOf('-USD') === -1; })
  .sort();

/* Fester Startwert: derselbe Aufruf zieht dieselben Teilstichproben. */
var saat = 20260824;
function wuerfel() { saat = (Math.imul(saat, 1664525) + 1013904223) >>> 0; return saat / 4294967296; }
function stichprobe(n) {
  var k = alle.slice();
  for (var q = k.length - 1; q > 0; q--) { var w = Math.floor(wuerfel() * (q + 1)); var t = k[q]; k[q] = k[w]; k[w] = t; }
  var aus = {};
  k.slice(0, n).forEach(function (s) { aus[s] = 1; });
  return aus;
}

console.log('AUFLOESUNG DES KAPITULATIONS-DIPS');
console.log('Gemessen wird, wie die MDE mit der Zahl der Werte faellt. Nur Variante 0');
console.log('(der Ausloeser allein), damit die Signalzahl nicht zusaetzlich schwankt.\n');
console.log('Werte   Signale   Bestaetigungstage   Ueberschuss Pp     MDE Pp   Faktor bis Aufloesung');

var reihe = [];
[24, 48, 96, 191].forEach(function (n) {
  var erlaubt = n >= alle.length ? null : stichprobe(n);
  var V = Object.assign({}, S, {
    varianten: [{ liquiditaet: false, regime: false }],
    universum: erlaubt ? function (sym) { return sym.indexOf('-USD') === -1 && erlaubt[sym]; }
                       : function (sym) { return sym.indexOf('-USD') === -1; },
  });
  var r = M.messe(V, ARCHIV);
  if (r.verweigert) { console.log(String(n).padStart(5) + '   VERWEIGERT: ' + r.grund); return; }
  var e = r.ergebnisse[0], u = e.bestaetigung.ueberschuss;
  var faktor = u.mde > 0 && u.tagesmittel !== 0 ? u.mde / Math.abs(u.tagesmittel) : null;
  reihe.push({ werte: r.universum.werte, signale: e.signale, tage: u.tage, mde: u.mde, ueber: u.tagesmittel });
  console.log(String(r.universum.werte).padStart(5) + '   ' + String(e.signale).padStart(7) + '   ' +
    String(u.tage).padStart(17) + '   ' + ((u.tagesmittel >= 0 ? '+' : '') + (u.tagesmittel * 100).toFixed(3)).padStart(13) + '   ' +
    (u.mde * 100).toFixed(3).padStart(8) + '   ' + (faktor == null ? '–' : faktor.toFixed(1)));
});

/* Wie skaliert die MDE mit der Zahl der Werte? Steigung im log-log-Raum. */
if (reihe.length >= 3) {
  var n = reihe.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
  reihe.forEach(function (r) {
    var x = Math.log(r.werte), y = Math.log(r.mde);
    sx += x; sy += y; sxx += x * x; sxy += x * y;
  });
  var b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  console.log('\nMDE ~ Werte^' + b.toFixed(2) + '   (bei voellig unabhaengigen Werten waere -0,50;');
  console.log('                        bei perfektem Gleichlauf 0,00 - dann bringt kein weiterer Wert etwas)');

  var letzte = reihe[reihe.length - 1];
  var noetig = letzte.mde / Math.abs(letzte.ueber);
  console.log('\nUm den gemessenen Ueberschuss von ' + (letzte.ueber * 100).toFixed(3) + ' Pp aufzuloesen, muesste die MDE');
  console.log('um Faktor ' + noetig.toFixed(1) + ' fallen. Dafuer braeuchte es');
  console.log('  ueber TAGE   : ' + Math.round(letzte.tage * noetig * noetig) + ' Bestaetigungstage statt ' + letzte.tage +
    '  (~' + (letzte.tage * noetig * noetig / 252).toFixed(1) + ' Jahre Bestaetigungshaelfte, also rund ' +
    (2 * letzte.tage * noetig * noetig / 252).toFixed(0) + ' Jahre Archiv)');
  if (b < -0.02) {
    console.log('  ueber WERTE  : ' + Math.round(letzte.werte * Math.pow(noetig, -1 / b)) + ' Werte statt ' + letzte.werte +
      '  (aus der gemessenen Steigung ' + b.toFixed(2) + ')');
  } else {
    console.log('  ueber WERTE  : gar nicht - die MDE faellt mit weiteren Werten praktisch nicht mehr.');
    console.log('                 Die Werte bewegen sich an einem Tag gemeinsam; der naechste Wert');
    console.log('                 bringt keine unabhaengige Wiederholung.');
  }
}
