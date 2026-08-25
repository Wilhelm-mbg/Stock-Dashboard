'use strict';
/* DIE OBERGRENZEN-MELDUNG.
 *
 * "Nicht entscheidbar" ist eine Nicht-Aussage. Es klingt wie "wir wissen es nicht", und
 * meistens stimmt sogar etwas Staerkeres: Wir wissen, dass dort NICHTS GROSSES ist.
 *
 * Der Unterschied ist der zwischen Schweigen und Wissen. Ein Lauf, der +0,05 Pp misst
 * mit einem Standardfehler von 0,06 Pp, hat eine obere 95-%-Grenze von 0,17 Pp. Er hat
 * damit AUSGESCHLOSSEN, dass dort eine Kante von 0,30 Pp liegt - das ist ein Befund, und
 * er stand bisher in keinem Protokoll ausgeschrieben.
 *
 * Liegt die obere Grenze unter der Kostenhuerde der Handelsklasse, ist die Sache
 * ERLEDIGT, nicht offen: Selbst der optimistischste mit den Daten vertraegliche Wert
 * traegt die Kosten nicht. Diese Familie muss nie wieder durchsucht werden.
 *
 * WAS DIESES WERKZEUG NICHT DARF: Es rechnet keine neuen Zahlen. tagesmittel und se
 * stehen im Protokoll; die Grenze ist tagesmittel + 1,96 x se, eine Zeile. Und es
 * schreibt kein Protokoll um - Protokolle sind Belege (D2).
 *
 * ZUR SKALA: tagesmittel ist der Mittelwert UEBER TAGE des mittleren Ueberschusses JE
 * HANDEL an diesem Tag. Seine Einheit ist damit Pp je Umlauf - dieselbe wie die der
 * Kostenhuerde. Der Vergleich ist zulaessig.
 *
 * Aufruf: node tools/obergrenzen-bericht.js [protokollordner]
 */
var fs = require('fs'), path = require('path');

var Z = 1.959964;   // zweiseitig 95 %
var HUERDEN = [
  ['Aktie', 0.04], ['Schein ATM', 0.05], ['CFD', 0.10], ['Standard-Schein', 0.23]
];

var dir = process.argv[2] || path.join(__dirname, '..', 'studien', 'messmaschine', 'protokolle');
if (!fs.existsSync(dir)) { console.error('Kein Protokollordner: ' + dir); process.exit(2); }

/* Je Kennung nur der juengste Lauf - aeltere sind vom selben Gegenstand. */
var jeKey = {};
fs.readdirSync(dir).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) {
  var p; try { p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return; }
  var k = p.strategie && p.strategie.key; if (!k) return;
  var st = fs.statSync(path.join(dir, f)).mtimeMs;
  if (!jeKey[k] || jeKey[k].st < st) jeKey[k] = { st: st, p: p, datei: f };
});

var zeilen = [];
Object.keys(jeKey).sort().forEach(function (k) {
  var p = jeKey[k].p;
  (p.ergebnisse || []).forEach(function (e, vi) {
    var u = e.bestaetigung && e.bestaetigung.ueberschuss;
    if (!u || u.tagesmittel == null || !(u.se > 0)) return;
    zeilen.push({
      key: k, v: vi, zr: p.strategie.zeitrahmen, H: p.strategie.haltedauerKerzen,
      mittel: u.tagesmittel * 100, se: u.se * 100,
      oben: (u.tagesmittel + Z * u.se) * 100,
      unten: (u.tagesmittel - Z * u.se) * 100,
      urteil: (p.urteile || [])[vi] || '?'
    });
  });
});

if (!zeilen.length) { console.log('Keine auswertbaren Protokolle.'); process.exit(0); }

console.log('OBERGRENZEN — was jede Messung AUSSCHLIESST (' + zeilen.length + ' Varianten)\n');
console.log('Strategie'.padEnd(24) + 'V ' + 'gemessen'.padStart(9) + 'se'.padStart(8) +
            '   95-%-Band'.padStart(20) + '   schliesst aus ab');
zeilen.slice().sort(function (a, b) { return a.oben - b.oben; }).forEach(function (r) {
  console.log(r.key.slice(0, 23).padEnd(24) + r.v + ' ' +
    r.mittel.toFixed(3).padStart(9) + r.se.toFixed(3).padStart(8) +
    ('[' + r.unten.toFixed(3) + ', ' + r.oben.toFixed(3) + ']').padStart(20) +
    ('  > ' + r.oben.toFixed(3) + ' Pp').padStart(18));
});

console.log('\nWAS DAMIT ERLEDIGT IST — je Handelsklasse');
HUERDEN.forEach(function (h) {
  var zu = zeilen.filter(function (r) { return r.oben < h[1]; });
  console.log('\n  ' + h[0] + ' (Huerde ' + h[1].toFixed(2) + ' Pp je Umlauf): ' +
    zu.length + ' von ' + zeilen.length + ' Varianten GESCHLOSSEN');
  if (zu.length) {
    var namen = {};
    zu.forEach(function (r) { namen[r.key] = (namen[r.key] || 0) + 1; });
    console.log('    ' + Object.keys(namen).map(function (n) { return n + ' (' + namen[n] + ')'; }).join(', '));
    console.log('    Selbst der optimistischste mit den Daten vertraegliche Wert traegt die Kosten nicht.');
  }
});

/* Die eigentliche Aussage: was ist NICHT ausgeschlossen? */
console.log('\nWAS OFFEN BLEIBT');
var offen = zeilen.filter(function (r) { return r.oben >= 0.10; });
if (!offen.length) {
  console.log('  Nichts. Fuer jede gemessene Variante schliesst das 95-%-Band eine');
  console.log('  CFD-handelbare Kante aus. Der durchsuchte Raum ist leer.');
} else {
  console.log('  ' + offen.length + ' von ' + zeilen.length + ' Varianten lassen eine CFD-handelbare Kante (0,10 Pp) zu.');
  console.log('  Bei ihnen ist "nicht entscheidbar" wirklich Unwissen und nicht Ausschluss:');
  offen.sort(function (a, b) { return b.oben - a.oben; }).slice(0, 12).forEach(function (r) {
    console.log('    ' + (r.key + ' V' + r.v).padEnd(28) + 'obere Grenze ' + r.oben.toFixed(3).padStart(7) + ' Pp' +
      '   (' + r.zr + ', H=' + r.H + ')');
  });
}

console.log('\nHINWEIS ZUR LESART: Eine obere Grenze schliesst eine GROESSE aus, keine These.');
console.log('Sie sagt "hier liegt nichts ueber X", nicht "hier liegt nichts". Und sie gilt nur');
console.log('fuer das gemessene Universum, den gemessenen Zeitraum und die gemessene Haltedauer.');
