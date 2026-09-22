'use strict';
/* FELD 6, nachrichtliche Zelle: ROA (Auftrag Nr. 54, 22.09.2026; VORREGISTRIERUNG-KOMBINATION.md §4 Zeile 6, Nachtrag §11 (1)).
 * Nicht gewichtet, wird nicht kombiniert.
 *
 * Rohgroesse: abgeleitet.roa des juengsten Filings (filed strikt vor dem Signaltag, Tor 456 Tage) - von der Tafel gebildet als
 * summe4q.netto / roh.vermoegen (D0); hier nur gelesen, nicht nachgerechnet. Hoeher = besser. Verhaeltnis.
 * null (nie 0), wenn keine Panelzeile, kein Filing oder abgeleitet.roa nicht ausgewiesen.
 *
 * Zaehler wie in feld.js: je Lesetag+Symbol einmal, Hauptlauf/Versatz getrennt, Null-Gruende; Ausgabe "ZAEHLER ertragskraft-roa ..."
 * beim Prozessende.
 *
 *   cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/ertragskraft/feld-roa.js
 *
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var gesehen = Object.create(null);
var Z = { aufrufe: 0, paare: 0, haupt: { n: 0, wert: 0, grund: {}, werte: [] }, versatz: { n: 0, wert: 0, grund: {} } };
function plus(o, k) { o[k] = (o[k] || 0) + 1; }

module.exports = {
  feld: 'ertragskraft-roa',
  definition: 'abgeleitet.roa des juengsten Filings (filed < Signaltag) = summe4q.netto / roh.vermoegen D0, von der Tafel gebildet; Verhaeltnis, hoeher = besser; null wenn nicht ausgewiesen. Nachrichtlich, nicht gewichtet',
  quellen: ['Panel querschnitt-pruefstand-2026-09-13/panel/v2', 'Fundamentaltafel fundamentaltafel-2026-09-16/v1'],
  werte: function (sym, tag, sicht) {
    Z.aufrufe++;
    var lese = sicht.iso, schl = lese + '|' + sym, neu = !gesehen[schl];
    if (neu) { gesehen[schl] = true; Z.paare++; }
    var K = (sicht.periode && sicht.periode.iso !== lese) ? Z.versatz : Z.haupt;
    if (neu) K.n++;
    var z = sicht.zeileAm(sym);
    if (z < 0) { if (neu) plus(K.grund, 'keineZeile'); return null; }
    var f = sicht.fundamentalAm(sym, lese);                       /* genau ein Bilanzzugriff, Tag = Lesetag der Sicht */
    if (!f) { if (neu) plus(K.grund, 'keinFiling'); return null; }
    var w = (f.abgeleitet && typeof f.abgeleitet.roa === 'number' && isFinite(f.abgeleitet.roa)) ? f.abgeleitet.roa : null;
    if (w === null) { if (neu) plus(K.grund, 'roaNull'); return null; }
    if (neu) { K.wert++; if (K === Z.haupt) K.werte.push(w); }
    return w;
  },
};

process.on('exit', function () {
  var a = Z.haupt.werte, q = null;
  if (a.length) {
    var s = a.slice().sort(function (x, y) { return x - y; }); q = { n: s.length };
    [0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99].forEach(function (p) { q['p' + Math.round(p * 100)] = +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(4); });
    q.min = +s[0].toFixed(4); q.max = +s[s.length - 1].toFixed(4);
  }
  process.stdout.write('ZAEHLER ertragskraft-roa ' + JSON.stringify({ aufrufe: Z.aufrufe, paare: Z.paare,
    haupt: { n: Z.haupt.n, wert: Z.haupt.wert, grund: Z.haupt.grund, quantile: q }, versatz: { n: Z.versatz.n, wert: Z.versatz.wert, grund: Z.versatz.grund } }) + '\n');
});
