'use strict';
/* KREUZPROBE - Tageskerzen aus dem Minutenarchiv gegen die Yahoo-Tageskerzen in archiv1d (VORREGISTRIERUNG §1.2).
 *
 *   node kreuzprobe.js --tage tage-pilot [--tage tage-kreuz] [--aus kreuzprobe.json]
 *
 * Fuer jede Tagesdatei mit Yahoo-Gegenstueck (E:/Markt-Dashboard-Archiv/archiv1d/bars_1d_<REIHE>.json, nur lesen):
 * je Tag |O/O_Y - 1|, |C_k/C_Y - 1| (k = c1, c2, c3) in Pp, V/V_Y; Tage im Massnahmenfenster (Flag) und Tage ohne
 * Yahoo-Kerze werden ausgelassen; Spruenge (|Delta| > KREUZPROBE.sprungPp) werden getrennt gezaehlt und gehen nicht in den
 * Median. Ergebnis: Mediane, P95, Anteile ueber 0,1 Pp je Kandidat und Wert, gepoolt, und die WAHL nach der
 * registrierten Regel (kleinster Median; Gleichstand < 0,002 Pp: c2 vor c1 vor c3; Toleranz Median <= 0,03, P95 <= 0,30).
 *
 * Yahoo ist die Kreuzprobe, nie die Messbasis. Alles Simulation, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');

function argumente(argv) {
  var a = { tage: [], aus: null };
  for (var i = 0; i < argv.length; i++) { if (argv[i] === '--tage') a.tage.push(argv[++i]); else if (argv[i] === '--aus') a.aus = argv[++i]; }
  return a;
}
function quantil(a, p) { if (!a.length) return NaN; var s = a.slice().sort(function (x, y) { return x - y; }); var i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); }
function yahooTage(reihe) {
  var p = path.join(K.ORTE.roh(), '..', 'archiv1d', 'bars_1d_' + reihe + '.json');
  if (!fs.existsSync(p)) return null;
  var j = JSON.parse(fs.readFileSync(p, 'utf8')), aus = {};
  (j.series || []).forEach(function (k) { if (k[1] > 0 && k[5] > 0) aus[new Date(k[0]).toISOString().slice(0, 10)] = k; });   // Stempel 09:30 ET = derselbe UTC-Tag
  return aus;
}
/** Vergleich einer Tagesdatei: Rueckgabe je Kandidat Listen der Abweichungen (Pp), Spruenge, Volumenverhaeltnisse. */
function vergleiche(D, kal) {
  var Y = yahooTage(D.reihe);
  if (!Y) return null;
  var aus = { reihe: D.reihe, tage: 0, ohneYahoo: 0, massnahmen: 0, spruenge: 0, o: [], c1: [], c2: [], c3: [], v: [], c16fehlt: 0 };
  for (var i = 0; i < D.tag.length; i++) {
    var tag = kal.tage[D.tag[i]], y = Y[tag];
    if (!y) { aus.ohneYahoo++; continue; }
    if (D.flags[i] & K.FLAG.massnahmen) { aus.massnahmen++; continue; }
    var dO = (D.o[i] / y[5] - 1) * 100, dC = [(D.c1[i] / y[1] - 1) * 100, (D.c2[i] / y[1] - 1) * 100, (D.c3[i] / y[1] - 1) * 100];
    if (Math.abs(dO) > K.KREUZPROBE.sprungPp || Math.abs(dC[2]) > K.KREUZPROBE.sprungPp) { aus.spruenge++; continue; }
    aus.tage++;
    if (D.flags[i] & K.FLAG.c16fehlt) aus.c16fehlt++;
    aus.o.push(Math.abs(dO)); aus.c1.push(Math.abs(dC[0])); aus.c2.push(Math.abs(dC[1])); aus.c3.push(Math.abs(dC[2]));
    if (y[2] > 0) aus.v.push(D.v[i] / y[2]);
  }
  return aus;
}
function kennzahlen(liste) {
  return { n: liste.length, median: quantil(liste, 0.5), p95: quantil(liste, 0.95), ueber01: liste.length ? liste.filter(function (x) { return x > 0.1; }).length / liste.length : NaN, max: liste.length ? Math.max.apply(null, liste) : NaN };
}
/** Die registrierte Wahl: kleinster Median der gepoolten Schluss-Abweichung, Gleichstand nach Vorrang, Toleranz geprueft. */
function wahl(gepoolt) {
  var R = K.KREUZPROBE, kand = K.SCHLUSS_KANDIDATEN.map(function (k) { return { k: k, median: gepoolt[k].median, p95: gepoolt[k].p95, ueber01: gepoolt[k].ueber01 }; });
  /* Registrierte Regel: kleinster Median. Gleichstand (< gleichstandPp) nach Nachtrag 2: kleineres P95, dann kleinerer
   * Anteil > 0,1 Pp, dann Vorrang c2 < c1 < c3. Die Reihenfolge der urspruenglichen Regel (Vorrang allein) steht daneben. */
  function nachRegel(reihe) {
    return kand.slice().sort(function (a, b) {
      if (Math.abs(a.median - b.median) >= R.gleichstandPp) return a.median - b.median;
      for (var q = 0; q < reihe.length; q++) {
        var d = reihe[q] === 'vorrang' ? R.vorrang.indexOf(a.k) - R.vorrang.indexOf(b.k) : a[reihe[q]] - b[reihe[q]];
        if (d) return d;
      }
      return 0;
    });
  }
  var neu = nachRegel(R.gleichstand), alt = nachRegel(['vorrang']), best = neu[0];
  return { kandidat: best.k, median: best.median, p95: best.p95, toleranzSchluss: best.median <= R.medianMaxPp && best.p95 <= R.p95MaxPp,
    toleranzEroeffnung: gepoolt.o.median <= R.medianMaxPp && gepoolt.o.p95 <= R.p95MaxPp, reihenfolge: neu.map(function (x) { return x.k; }),
    urspruenglicheRegel: { kandidat: alt[0].k, toleranzSchluss: alt[0].median <= R.medianMaxPp && alt[0].p95 <= R.p95MaxPp, reihenfolge: alt.map(function (x) { return x.k; }) } };
}
function lauf(a) {
  var kal = K.kalender(), je = [], pool = { o: [], c1: [], c2: [], c3: [], v: [] }, gesamt = { tage: 0, ohneYahoo: 0, massnahmen: 0, spruenge: 0, c16fehlt: 0, ohneGegenstueck: [] };
  a.tage.forEach(function (o) {
    var ordner = path.resolve(K.HIER, o);
    fs.readdirSync(ordner).forEach(function (name) {
      if (!/\.json$/.test(name) || name[0] === '_') return;
      var D = JSON.parse(fs.readFileSync(path.join(ordner, name), 'utf8'));
      var v = vergleiche(D, kal);
      if (!v) { gesamt.ohneGegenstueck.push(D.reihe); return; }
      ['tage', 'ohneYahoo', 'massnahmen', 'spruenge', 'c16fehlt'].forEach(function (k) { gesamt[k] += v[k]; });
      Object.keys(pool).forEach(function (k) { pool[k] = pool[k].concat(v[k]); });
      je.push({ reihe: D.reihe, tage: v.tage, ohneYahoo: v.ohneYahoo, massnahmen: v.massnahmen, spruenge: v.spruenge, c16fehlt: v.c16fehlt, quelleJeJahr: D.quelleJeJahr,
        o: kennzahlen(v.o), c1: kennzahlen(v.c1), c2: kennzahlen(v.c2), c3: kennzahlen(v.c3), vVerhaeltnis: { median: quantil(v.v, 0.5), p05: quantil(v.v, 0.05), p95: quantil(v.v, 0.95) } });
    });
  });
  var gepoolt = { o: kennzahlen(pool.o), c1: kennzahlen(pool.c1), c2: kennzahlen(pool.c2), c3: kennzahlen(pool.c3), vVerhaeltnis: { median: quantil(pool.v, 0.5), p05: quantil(pool.v, 0.05), p95: quantil(pool.v, 0.95) } };
  var E = { stand: new Date().toISOString(), regel: K.KREUZPROBE, werte: je.length, gesamt: gesamt, gepoolt: gepoolt, wahl: wahl(gepoolt), je: je };
  if (a.aus) fs.writeFileSync(path.resolve(K.HIER, a.aus), JSON.stringify(E, null, 1));
  return E;
}
module.exports = { lauf: lauf, argumente: argumente, vergleiche: vergleiche, kennzahlen: kennzahlen, wahl: wahl, yahooTage: yahooTage, quantil: quantil };
if (require.main === module) {
  var E = lauf(argumente(process.argv.slice(2)));
  var f = function (x) { return x == null || x !== x ? '–' : x.toFixed(4); };
  console.log('Kreuzprobe: ' + E.werte + ' Werte, ' + E.gesamt.tage + ' Tage verglichen, ohne Yahoo ' + E.gesamt.ohneYahoo + ', Massnahmen ' + E.gesamt.massnahmen + ', Spruenge ' + E.gesamt.spruenge + ', 16:00-Kerze fehlt ' + E.gesamt.c16fehlt + ', ohne Gegenstueck: ' + E.gesamt.ohneGegenstueck.join(' '));
  ['o', 'c1', 'c2', 'c3'].forEach(function (k) { var g = E.gepoolt[k]; console.log('  ' + k.padEnd(3) + ' Median ' + f(g.median) + ' Pp  P95 ' + f(g.p95) + '  >0,1 Pp ' + (g.ueber01 * 100).toFixed(1) + ' %  max ' + f(g.max)); });
  console.log('  V/V_Yahoo Median ' + f(E.gepoolt.vVerhaeltnis.median) + ' [P5 ' + f(E.gepoolt.vVerhaeltnis.p05) + ', P95 ' + f(E.gepoolt.vVerhaeltnis.p95) + ']');
  console.log('  WAHL: ' + E.wahl.kandidat + ' (Reihenfolge ' + E.wahl.reihenfolge.join(' < ') + '), Toleranz Schluss ' + (E.wahl.toleranzSchluss ? 'eingehalten' : 'VERFEHLT') + ', Eroeffnung ' + (E.wahl.toleranzEroeffnung ? 'eingehalten' : 'VERFEHLT'));
  E.je.forEach(function (j) { console.log('  ' + j.reihe.padEnd(6) + String(j.tage).padStart(5) + ' Tage  o ' + f(j.o.median) + '/' + f(j.o.p95) + '  c1 ' + f(j.c1.median) + '/' + f(j.c1.p95) + '  c2 ' + f(j.c2.median) + '/' + f(j.c2.p95) + '  c3 ' + f(j.c3.median) + '/' + f(j.c3.p95) + '  V ' + f(j.vVerhaeltnis.median) + '  Spruenge ' + j.spruenge + ' Massn ' + j.massnahmen + ' c16fehlt ' + j.c16fehlt); });
}
