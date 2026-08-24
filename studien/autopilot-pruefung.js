'use strict';
/* PRUEFT DEN AUTOPILOTEN: arbeitet er richtig, und bringt er etwas?
 *
 * Der Autopilot misst nachts Walk-Forward ueber vier Setups mal Parameterraster,
 * verlangt >= 30 OOS-Trades auf >= 12 ungesehenen Handelstagen, eine Bestaetigung
 * in einer ZWEITEN Nacht mit NEUEN Tagen, und einen Zufallsvergleich. Das ist mehr
 * Sorgfalt als in den meisten Studien dieses Projekts.
 *
 * Die Frage, die er nicht stellt: WOGEGEN. Sein Urteil haengt an
 *     wfRet > 0 && posSegs >= 70 % && pf > 1 && bootLossProb <= 45
 * (depot.js, Urteilsblock). wfRet ist die Walk-Forward-RENDITE, nicht der
 * Ueberschuss gegen eine Kontrolle. In einem steigenden Markt hat jede
 * Long-Strategie eine positive Rendite - auch eine, die nichts kann.
 *
 * Dieses Skript rechnet die Vergleichszahl aus, die dem Autopiloten fehlt:
 * Was haette schlichtes Halten im selben Zeitraum gebracht?
 *
 * Aufruf: node studien/autopilot-pruefung.js [archiv]
 * Es wird nichts geaendert.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = process.argv[2] ||
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');
var ZUSTAND = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store', 'depot.json');

/* --- Was der Autopilot zuletzt gefunden hat --- */
var A = {};
try { A = JSON.parse(fs.readFileSync(ZUSTAND, 'utf8')).autoOpt || {}; } catch (e) { }
var hist = A.messHistorie || [];

console.log('AUTOPILOT-PRUEFUNG');
console.log('='.repeat(74));
console.log('\n1) WAS ER GETAN HAT\n');
console.log('   Naechte protokolliert: ' + hist.length);
console.log('   Uebernahmen: ' + (A.pending ? '1 anstehend' : 'keine') +
  ' | lastRecKey: ' + (A.lastRecKey == null ? 'null (keine laufende Bestaetigungskette)' : A.lastRecKey));
if (hist.length) {
  console.log('\n   Bester Kandidat je Nacht:');
  hist.slice(-8).forEach(function (e) {
    console.log('     ' + new Date(e.at).toISOString().slice(0, 16) + '  ' +
      String(e.name || '?').slice(0, 46).padEnd(48) +
      (e.interval || '').padEnd(5) + ' wfRet ' + String(e.wfRet).padStart(6) + ' %  n ' + String(e.n).padStart(4) +
      '  ungesehene Tage ' + e.oosTage);
  });
}
if (A.lastCheck && A.lastCheck.txt) {
  console.log('\n   Begruendung der letzten Nacht:');
  String(A.lastCheck.txt).split('\n').forEach(function (l) { if (l.trim()) console.log('     ' + l.trim()); });
}

/* --- Die Vergleichszahl, die ihm fehlt --- */
console.log('\n2) WOGEGEN? DIE ZAHL, DIE IM URTEIL FEHLT\n');

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_60m_') === 0; })
  .filter(function (f) { return f.indexOf('-USD') === -1; });
/* Der Autopilot mass zuletzt auf 232 ungesehenen Handelstagen. Dieselbe Spanne. */
var TAGE = 232;
var halten = [], spanneVon = null, spanneBis = null;
dateien.forEach(function (f) {
  var s;
  try { s = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')).series || []; } catch (e) { return; }
  if (s.length < 400) return;
  /* Handelstage von hinten zaehlen. */
  var tage = [], letzter = null;
  for (var i = s.length - 1; i >= 0; i--) {
    var d = new Date(s[i][0]).toISOString().slice(0, 10);
    if (d !== letzter) { letzter = d; tage.push(i); if (tage.length > TAGE) break; }
  }
  if (tage.length <= TAGE) return;
  var von = tage[tage.length - 1], bis = s.length - 1;
  if (!(s[von][1] > 0) || !(s[bis][1] > 0)) return;
  halten.push(s[bis][1] / s[von][1] - 1);
  if (spanneVon == null) { spanneVon = s[von][0]; spanneBis = s[bis][0]; }
});
halten.sort(function (a, b) { return a - b; });
var mittel = halten.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, halten.length);
var median = halten[halten.length >> 1];

console.log('   Schlichtes Halten ueber dieselben ' + TAGE + ' Handelstage, ' + halten.length + ' Werte:');
if (spanneVon) console.log('     Zeitraum ' + new Date(spanneVon).toISOString().slice(0, 10) +
  ' bis ' + new Date(spanneBis).toISOString().slice(0, 10));
console.log('     Mittel  ' + (mittel * 100).toFixed(1) + ' %');
console.log('     Median  ' + (median * 100).toFixed(1) + ' %');
console.log('     Anteil positiv ' + (100 * halten.filter(function (x) { return x > 0; }).length / halten.length).toFixed(0) + ' %');

var besterWf = hist.length ? hist[hist.length - 1].wfRet : null;
if (besterWf != null) {
  console.log('\n   Bester Autopilot-Kandidat derselben Nacht: ' + besterWf + ' % Walk-Forward.');
  console.log('   Halten im selben Zeitraum:                 ' + (median * 100).toFixed(1) + ' % (Median).');
  console.log('\n   Der Autopilot nennt das seinen besten von 56 Kandidaten. Er hat keinen');
  console.log('   Massstab, an dem er sehen koennte, dass Nichtstun besser war.');
}

/* --- Der Edge-Waechter --- */
console.log('\n3) DER EDGE-WAECHTER, DER GERADE HANDEL SPERRT\n');
var eh = A.edgeHistorie || [];
console.log('   ' + eh.length + ' Eintraege, davon VERFALL: ' + eh.filter(function (e) { return e.verfall; }).length);
eh.slice(-6).forEach(function (e) {
  console.log('     ' + new Date(e.at).toISOString().slice(0, 16) + '  mittelPp ' + String(e.mittelPp).padStart(6) +
    '  t ' + String(e.t).padStart(6) + (e.verfall ? '   VERFALL' : ''));
});
if (A.edge) {
  console.log('\n   Der Waechter loest am VORZEICHEN von mittelPp aus, nicht an einer Schwelle.');
  console.log('   Sein eigener t-Wert: ' + A.edge.t + '. Ab |t| = 2 spricht man von einem Befund.');
  console.log('   Bei ' + A.edge.nSym + ' Werten und ' + A.edge.n + ' Signalen liegt seine Aufloesung bei rund ' +
    (Math.abs(A.edge.mittelPp / (A.edge.t || -0.19)) * 2).toFixed(2) + ' Pp -');
  console.log('   das Vielfache der Kante, die er bewachen soll.');
}

console.log('\n' + '='.repeat(74));
console.log('Fertig. Es wurde nichts geaendert.');
