'use strict';
/* WAS HAETTE JEDER LAUF UEBERHAUPT SEHEN KOENNEN?
 *
 * Die Messmaschine schreibt seit dem 25.08.2026 `delta80` in jede Urteilszeile. Fuer die
 * Laeufe davor steht die Zahl nicht im Protokoll - herleiten laesst sie sich aber, denn
 * `se` und die Bonferroni-Schwelle stehen dort. Dieses Werkzeug rechnet sie nach.
 *
 * WARUM DIE PROTOKOLLE DABEI NICHT ANGEFASST WERDEN. Ein Protokoll ist der Beleg einer
 * Messung, nicht ein Arbeitsblatt. Waere es zulaessig, alte Protokolle um neue Felder zu
 * ergaenzen, waere es auch zulaessig, alte Zahlen zu "verbessern" - und dann ist der
 * Unterschied zwischen Beleg und Behauptung weg. Dieses Werkzeug LIEST nur.
 *
 * WAS delta80 IST, und warum es nicht die MDE ist:
 *   MDE     = 2 x se        -> ab welchem Ausschlag geht es nicht mehr als Rauschen durch
 *   delta80 = (Schwelle + 0,8416) x se
 *                           -> welcher WAHRE Effekt haette es mit 80 % Wahrscheinlichkeit
 *                              ueber die Schwelle geschafft
 * Die MDE beantwortet die Frage "ist das noch Rauschen?". delta80 beantwortet die Frage
 * "haette ich es ueberhaupt gefunden?" - und nur die zweite entscheidet, ob eine Messung
 * sinnvoll war. Genau diese Verwechslung hat das Projekt zweimal Kandidaten vorregistrieren
 * lassen, die es nie haette bestaetigen koennen.
 *
 * Aufruf:  node tools/delta80-bericht.js [protokollordner]
 */
var fs = require('fs'), path = require('path');

var Z80 = 0.8416212;                    // z fuer 80 % Macht, einseitig
var HUERDEN = { 'Aktie': 0.04, 'Schein ATM': 0.05, 'CFD': 0.10, 'Standard-Schein': 0.23 };

var dir = process.argv[2] || path.join(__dirname, '..', 'studien', 'messmaschine', 'protokolle');
if (!fs.existsSync(dir)) { console.error('Kein Protokollordner: ' + dir); process.exit(2); }

var zeilen = [];
fs.readdirSync(dir).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) {
  var p;
  try { p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return; }
  /* Die Schwelle steht als Entscheidung im Protokoll - sie aus P.tests neu zu rechnen
   * waere eine zweite Quelle fuer dieselbe Zahl (D2). */
  var b4 = (p.entscheidungen || []).filter(function (e) { return e.regel === 'B4 Bonferroni'; })[0];
  var schwelle = b4 && b4.ergebnis && b4.ergebnis.schwelleT;
  if (!schwelle) return;
  (p.ergebnisse || []).forEach(function (e, vi) {
    var u = e.bestaetigung && e.bestaetigung.ueberschuss;
    if (!u || !(u.se > 0)) return;
    zeilen.push({
      key: (p.strategie && p.strategie.key) || f.replace('.json', ''),
      datei: f, v: vi, tage: u.tage, se: u.se * 100,
      mde: u.mde != null ? u.mde * 100 : null,
      d80: (schwelle + Z80) * u.se * 100,
      ueber: u.tagesmittel != null ? u.tagesmittel * 100 : null,
      urteil: (p.urteile || [])[vi] || '?'
    });
  });
});

if (!zeilen.length) { console.log('Keine auswertbaren Protokolle in ' + dir); process.exit(0); }

zeilen.sort(function (a, b) { return a.d80 - b.d80; });
console.log('DELTA80 - was jeder Lauf haette sehen koennen (' + zeilen.length + ' Varianten)\n');
console.log('Strategie'.padEnd(26) + 'V ' + 'Tage'.padStart(6) + 'Ueber Pp'.padStart(10) +
            'MDE Pp'.padStart(9) + 'd80 Pp'.padStart(9) + '  Urteil');
zeilen.forEach(function (r) {
  console.log(r.key.slice(0, 25).padEnd(26) + r.v + ' ' + String(r.tage).padStart(6) +
    (r.ueber != null ? r.ueber.toFixed(3) : '-').padStart(10) +
    (r.mde != null ? r.mde.toFixed(3) : '-').padStart(9) +
    r.d80.toFixed(3).padStart(9) + '  ' + r.urteil);
});

var d = zeilen.map(function (r) { return r.d80; }).sort(function (a, b) { return a - b; });
var med = d[Math.floor(d.length / 2)];
console.log('\nMedian delta80: ' + med.toFixed(3) + ' Pp   (Spanne ' + d[0].toFixed(3) + ' bis ' + d[d.length - 1].toFixed(3) + ')');

console.log('\nWIE VIELE LAEUFE WAREN FUER IHRE HANDELSKLASSE UEBERHAUPT NICHT BLIND?');
Object.keys(HUERDEN).forEach(function (k) {
  var n = zeilen.filter(function (r) { return r.d80 <= HUERDEN[k]; }).length;
  console.log('  ' + k.padEnd(17) + 'Huerde ' + HUERDEN[k].toFixed(2) + ' Pp -> ' +
    String(n).padStart(2) + ' von ' + zeilen.length +
    ' Varianten haetten eine Kante dieser Groesse mit 80 % gefunden');
});
console.log('\nEine Variante, deren delta80 UEBER der Huerde ihrer Handelsklasse liegt, kann');
console.log('keine handelbare Kante bestaetigen - unabhaengig davon, was gemessen wird.');
