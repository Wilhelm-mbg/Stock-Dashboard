'use strict';
/* ================= Datenfund 1: Phantom-Dochte an US-Halbtagen =================
 *
 * ERHEBUNG VOR DER REGEL (Wilhelms Auflage 27.08.: zaehlen vor dem Loeschen).
 * NUR LESEND - dieses Skript aendert nichts. Es stellt vier Kandidaten-Regeln
 * nebeneinander und weist fuer jede DREI Zaehlungen mit Zahlen aus (PM-Auflage:
 * die Zahlen, nicht nur das Urteil):
 *
 *   (a) Treffer an Halbtagen            - trifft die Regel das Problem?
 *   (b) Treffer unter den ECHTEN Null-  - Schutzprobe, Soll: 0. Es gibt ~61
 *       umsatz-Kerzen an Halbtagen        echte Nullumsatz-Schlussstunden;
 *       (ohne Phantom-Merkmal)            eine Regel, die sie traefe, loescht
 *                                         echte Daten (dritter Beinahe-Fall).
 *   (c) Treffer an normalen Volltagen   - Positivkontrolle auf Trennschaerfe,
 *                                         Soll: 0. Eine Regel, die nichts
 *                                         Falsches trifft, weil sie gar nicht
 *                                         trennt, saehe sonst gut aus.
 *
 * Definition "Phantom" (aus der QS-Gegenpruefung phantom.js, uebernommen):
 * Nullumsatz-Kerze, deren Hoch ueber dem Hoch ODER Tief unter dem Tief aller
 * UMSATZ-Kerzen desselben Kalendertags liegt (>= 2 Umsatz-Kerzen als Basis).
 *
 * Zusaetzlich je Phantom-Treffer erhoben, weil es die REPARATURFORM entscheidet:
 * liegen Eroeffnung UND Schluss der Kerze innerhalb der Umsatz-Spanne? Wenn ja,
 * ist "Docht kappen" (Hoch/Tief auf max/min von Eroeffnung/Schluss setzen)
 * verlustfrei moeglich - loeschen waere dann unnoetig hart.
 *
 * Aufruf (ERST NACH SPERRFALL ~03:45): node studien/datenfund-dochte-2026-08-27/erhebung.js
 * Format der Reihen: [zeit, schluss, umsatz, hoch, tief, eroeffnung] */
var fs = require('fs'), path = require('path');
var Boerse = require(path.join(__dirname, '..', '..', 'boerse.js'));
var Q = require(path.join(__dirname, '..', '..', 'quant.js'));
var D = 'E:/Markt-Dashboard-Archiv/archiv60m';

/* Die sieben bekannten Phantom-Tage (Tafel 27.08.) - nur zur Gegenkontrolle,
 * die Erhebung selbst laeuft ueber ALLE Tage und findet ihre Tage selbst. */
var BEKANNT = ['2023-11-24', '2024-07-03', '2024-11-29', '2024-12-24', '2025-07-03', '2025-11-28', '2025-12-24'];

var dateien = fs.readdirSync(D).filter(function (f) { return /^bars_60m_.*\.json$/.test(f); });
console.log('Reihen im Archiv: ' + dateien.length + ' (nur lesend)');

/* Zaehler je Regel: [Halbtage, SchutzprobeEchteNull, Volltage] */
var REGELN = {
  'R1 nur Umsatz 0':                              { z: [0, 0, 0] },
  'R2 Umsatz 0 + nach Sitzungsende':              { z: [0, 0, 0] },
  'R3 Umsatz 0 + Docht ausserhalb (QS-Merkmal)':  { z: [0, 0, 0] },
  'R4 = R3 + nach Sitzungsende':                  { z: [0, 0, 0] }
};
var phantomJeTag = {}, echteNullHalbtag = [], kappbar = 0, nichtKappbar = 0, nichtKappBeispiele = [];
var phantomGesamt = 0, phantomReihen = {};

dateien.forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(path.join(D, f), 'utf8')); } catch (e) { return; }
  var s = j.series; if (!Array.isArray(s)) return; var sym = j.sym || f;
  var tage = {};
  for (var i = 0; i < s.length; i++) {
    var d = new Date(s[i][0]).toISOString().slice(0, 10);
    (tage[d] = tage[d] || []).push(s[i]);
  }
  Object.keys(tage).forEach(function (d) {
    var k = tage[d];
    var halb = !!Boerse.halbtagAn(k[0][0]);
    var rest = k.filter(function (x) { return x[2] > 0; });
    var hi = null, lo = null;
    if (rest.length >= 2) {
      hi = Math.max.apply(null, rest.map(function (x) { return x[3]; }));
      lo = Math.min.apply(null, rest.map(function (x) { return x[4]; }));
      if (!(hi > 0 && lo > 0)) { hi = null; lo = null; }
    }
    k.forEach(function (x) {
      if (x[2] !== 0) return;                       // nur Nullumsatz-Kerzen
      var minuten = null;
      try { minuten = Q.minutenSeitOeffnung(x[0]); } catch (e) { minuten = null; }
      var sitzung = Boerse.sitzungsMinuten(x[0]);
      var nachSchluss = minuten != null && sitzung != null && minuten >= sitzung;
      var phantom = hi != null && (x[3] > hi || x[4] < lo);
      var spalte = halb ? (phantom ? 0 : 1) : 2;    // 0=Halbtag-Problem, 1=Schutzmenge, 2=Volltag
      /* Zaehlung je Kandidaten-Regel - dieselbe Kerze, vier Sichten. R1 trifft
       * jede Nullumsatz-Kerze - sie steht hier als Referenz, die durchfallen
       * MUSS (sie traefe die Schutzmenge), nicht als ernsthafter Kandidat. */
      REGELN['R1 nur Umsatz 0'].z[spalte]++;
      if (nachSchluss)             REGELN['R2 Umsatz 0 + nach Sitzungsende'].z[spalte]++;
      if (phantom)                 REGELN['R3 Umsatz 0 + Docht ausserhalb (QS-Merkmal)'].z[spalte]++;
      if (phantom && nachSchluss)  REGELN['R4 = R3 + nach Sitzungsende'].z[spalte]++;
      if (phantom && halb) {
        phantomGesamt++; phantomJeTag[d] = (phantomJeTag[d] || 0) + 1; phantomReihen[sym] = 1;
        var o = x[5] != null ? x[5] : x[1], c = x[1];
        var innen = o <= hi && o >= lo && c <= hi && c >= lo;
        if (innen) kappbar++; else { nichtKappbar++; if (nichtKappBeispiele.length < 8) nichtKappBeispiele.push(sym + ' ' + d + ' o=' + o + ' c=' + c + ' Spanne ' + lo.toFixed(2) + '-' + hi.toFixed(2)); }
      }
      if (halb && !phantom) { if (echteNullHalbtag.length < 100) echteNullHalbtag.push(sym + ' ' + d + ' ' + new Date(x[0]).toISOString().slice(11, 16)); }
    });
  });
});

console.log('\n=== DIE DREI ZAEHLUNGEN JE KANDIDATEN-REGEL ===');
console.log('Spalten: [Halbtag-Phantome erfasst | ECHTE Halbtag-Nullkerzen getroffen (Soll 0) | Volltag-Kerzen getroffen (Soll 0)]');
Object.keys(REGELN).forEach(function (r) {
  var z = REGELN[r].z;
  var urteil = (z[1] === 0 && z[2] === 0) ? (z[0] > 0 ? 'BESTEHT' : 'trennt, aber trifft nichts') : 'FAELLT DURCH';
  console.log('  ' + r.padEnd(46) + JSON.stringify(z) + '  -> ' + urteil);
});
console.log('\nPhantom-Treffer an Halbtagen gesamt: ' + phantomGesamt + ' in ' + Object.keys(phantomReihen).length + ' Reihen');
console.log('Echte Halbtag-Nullkerzen (Schutzmenge, erwartet ~61): siehe Spalte 2 von R1');
console.log('\n=== Phantom-Tage (alle) ===');
Object.keys(phantomJeTag).sort().forEach(function (d) {
  console.log('  ' + d + '  ' + phantomJeTag[d] + ' Kerzen' + (BEKANNT.indexOf(d) !== -1 ? '  (bekannt)' : '  *** NEU - nicht in der Tafel-Liste ***'));
});
console.log('\n=== Reparaturform ===');
console.log('Kappen verlustfrei moeglich (Eroeffnung+Schluss innerhalb der Spanne): ' + kappbar);
console.log('NICHT verlustfrei kappbar: ' + nichtKappbar);
nichtKappBeispiele.forEach(function (b) { console.log('   ' + b); });
