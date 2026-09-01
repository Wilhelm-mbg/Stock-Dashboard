'use strict';
/* Gatter 5 der Vorregistrierung nachtstoss-umkehr: die Kennzahl z1 darf
 * ausschliesslich aus Kursen bis Eroeffnung(i) gebildet sein und insbesondere
 * Schluss(i), Hoch(i), Tief(i) NICHT beruehren. "Testfall verlangt."
 *
 * Geprueft wird die EINGEBAUTE Funktion (_kennzahl aus der Strategiedatei), kein
 * Nachbau - die Falle "der Pruefstand prueft, was er nachbilden kann" ist bekannt.
 * Methode: Stoerprobe. Jede Groesse, die die Kennzahl laut Registrierung nicht
 * lesen darf, wird einzeln verdreht - der Wert muss exakt gleich bleiben. Jede
 * Groesse, die sie lesen MUSS, wird verdreht - der Wert muss sich aendern
 * (sonst prueft der Test eine Konstante). */
var N = require('../messmaschine/strategien/nachtstoss-umkehr-n.js');

function kunstReihe() {
  /* 80 Tage, deterministisch, mit Eroeffnungen (Feld 5). */
  var bars = [];
  var c = 100;
  for (var i = 0; i < 80; i++) {
    var drift = Math.sin(i * 1.7) * 0.8;
    var o = c * (1 + Math.sin(i * 2.3) * 0.004);
    var neuC = c + drift;
    var h = Math.max(o, neuC) * 1.01, l = Math.min(o, neuC) * 0.99;
    bars.push([Date.UTC(2020, 0, 1) + i * 86400000, neuC, 5e6, h, l, o]);
    c = neuC;
  }
  return bars;
}

var I = 75;
var fehler = 0, ok = 0;
function pruefe(name, aendern, mussSichAendern) {
  var basis = N._kennzahl(kunstReihe(), I);
  var b2 = kunstReihe();
  aendern(b2);
  var neu = N._kennzahl(b2, I);
  var geaendert = neu !== basis;
  var bestanden = mussSichAendern ? geaendert : !geaendert;
  if (basis == null || neu === undefined) bestanden = false;
  console.log((bestanden ? '  ok      ' : '  FEHLER  ') + name +
    '  (Basis ' + (basis == null ? 'null' : basis.toFixed(6)) +
    ' -> ' + (neu == null ? 'null' : neu.toFixed(6)) + ')');
  if (bestanden) ok++; else fehler++;
}

console.log('Gatter-5-Testfall nachtstoss-umkehr: z1 gegen Stoerproben');
/* Verbotene Leser - z1 muss unveraendert bleiben: */
pruefe('Schluss(i) verdreht -> z1 unveraendert', function (b) { b[I][1] *= 1.37; }, false);
pruefe('Hoch(i) verdreht -> z1 unveraendert', function (b) { b[I][3] *= 1.37; }, false);
pruefe('Tief(i) verdreht -> z1 unveraendert', function (b) { b[I][4] *= 0.63; }, false);
pruefe('Umsatz(i) verdreht -> z1 unveraendert', function (b) { b[I][2] *= 7; }, false);
pruefe('Schluss(i+1)/Eroeffnung(i+1) verdreht -> z1 unveraendert', function (b) { b[I + 1][1] *= 1.5; b[I + 1][5] *= 1.5; }, false);
/* Pflichtleser - z1 muss sich aendern: */
pruefe('Eroeffnung(i) verdreht -> z1 aendert sich', function (b) { b[I][5] *= 1.02; }, true);
pruefe('Schluss(i-1) verdreht -> z1 aendert sich', function (b) { b[I - 1][1] *= 1.02; }, true);
pruefe('Eroeffnung(i-30) im Nennerfenster verdreht -> z1 aendert sich', function (b) { b[I - 30][5] *= 1.02; }, true);
pruefe('fehlende Eroeffnung im Fenster -> kein Wert (null)', function (b) { b[I - 10] = b[I - 10].slice(0, 5); }, true);

console.log(ok + '/' + (ok + fehler) + ' bestanden');
process.exit(fehler ? 1 : 0);
