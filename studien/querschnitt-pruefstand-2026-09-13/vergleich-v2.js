'use strict';
/* VERGLEICH v1/v2 der Kennzahlen von Teil 3 (V0), Teil 1 (Kontrollen) und Teil 4 (Test 1) nach der Panel-Reparatur
 * (Auftrag §3). Liest nur fertige Ergebnisdateien, rechnet nichts nach.
 *
 * Aufruf: node vergleich-v2.js [--t3v1 teil3-ergebnis.json] [--t3v2 teil3-ergebnis-v2.json]
 *                              [--k1v1 kontrollen-voll.json] [--k1v2 voll/kontrollen-v2.json]
 *                              [--t4v1 teil4-ergebnis.json] [--t4v2 teil4-ergebnis-v2.json]
 *                              [--aussenV2 aussen-pruefstein-teil3-v2.json]
 * Schreibt vergleich-v2.json und gibt die Tafeln aus.
 */
var fs = require('fs');
var path = require('path');
var A = { t3v1: 'teil3-ergebnis.json', t3v2: 'teil3-ergebnis-v2.json', k1v1: 'kontrollen-voll.json', k1v2: 'voll/kontrollen-v2.json',
  t4v1: 'teil4-ergebnis.json', t4v2: 'teil4-ergebnis-v2.json', aussenV2: 'aussen-pruefstein-teil3-v2.json' };
for (var i = 2; i < process.argv.length; i++) { var x = process.argv[i]; if (x.slice(0, 2) === '--' && A[x.slice(2)] !== undefined) A[x.slice(2)] = process.argv[++i]; }
function lese(p) { var q = path.isAbsolute(p) ? p : path.join(__dirname, p); return fs.existsSync(q) ? JSON.parse(fs.readFileSync(q, 'utf8')) : null; }
function hol(o, pfad) { var t = o; pfad.split('.').forEach(function (k) { t = (t == null) ? undefined : t[k]; }); return (typeof t === 'number') ? t : null; }
function f(x, n) { return x == null ? '—' : x.toFixed(n == null ? 3 : n); }

var T3a = lese(A.t3v1), T3b = lese(A.t3v2), K1a = lese(A.k1v1), K1b = lese(A.k1v2), T4a = lese(A.t4v1), T4b = lese(A.t4v2), AUb = lese(A.aussenV2);
var out = { stand: new Date().toISOString(), dateien: A, tafeln: {} };

function tafel(name, a, b, zeilen) {
  var rows = [];
  process.stdout.write('\n== ' + name + ' ==\n');
  zeilen.forEach(function (z) {
    var va = a ? hol(a, z.pfad) : null, vb = b ? hol(b, z.pfad) : null;
    var d = (va != null && vb != null) ? vb - va : null;
    rows.push({ name: z.name, pfad: z.pfad, v1: va, v2: vb, delta: d });
    process.stdout.write('  ' + z.name.padEnd(46) + ' v1 ' + f(va, z.n).padStart(10) + '  v2 ' + f(vb, z.n).padStart(10) + '  Δ ' + (d == null ? '—' : (d >= 0 ? '+' : '') + d.toFixed(z.n == null ? 3 : z.n)) + '\n');
  });
  out.tafeln[name] = rows;
}

tafel('Teil 3, V0 Momentum 12-1 monatlich, Klassen 1-3 (Pp je Monat)', T3a, T3b, [
  { name: 'netto Mittel', pfad: 'varianten.v0.kennzahlen.netto.mittel', n: 4 }, { name: 'netto se', pfad: 'varianten.v0.kennzahlen.netto.se', n: 4 },
  { name: 'netto t', pfad: 'varianten.v0.kennzahlen.netto.t', n: 3 }, { name: 'netto MDE80', pfad: 'varianten.v0.kennzahlen.netto.mde', n: 4 },
  { name: 'brutto Mittel', pfad: 'varianten.v0.kennzahlen.brutto.mittel', n: 4 }, { name: 'Tage netto: Mittel je Monat (HH)', pfad: 'varianten.v0.kennzahlen.tageNetto.mittelMonat', n: 4 },
  { name: 'Tage netto: t (HH)', pfad: 'varianten.v0.kennzahlen.tageNetto.t', n: 3 },
  { name: 'MDD netto (%)', pfad: 'varianten.v0.kennzahlen.mdd.mdd', n: 3 }, { name: 'Endstand netto (x)', pfad: 'varianten.v0.kennzahlen.mdd.endstand', n: 4 },
  { name: 'Sharpe', pfad: 'varianten.v0.kennzahlen.sharpe', n: 4 }, { name: 'schlechtestes 12-Monats-Fenster (Pp)', pfad: 'varianten.v0.kennzahlen.fenster12.wert', n: 3 },
  { name: 'Umschlag Mittel', pfad: 'varianten.v0.kennzahlen.umschlagMittel', n: 4 }, { name: 'Kosten Mittel (Pp)', pfad: 'varianten.v0.kennzahlen.kostenMittel', n: 4 },
  { name: 'Perioden n', pfad: 'varianten.v0.kennzahlen.n', n: 0 },
  { name: 'Universum netto Mittel', pfad: 'benchmarks.uni.kennzahlen.netto.mittel', n: 4 }, { name: 'Universum Sharpe', pfad: 'benchmarks.uni.kennzahlen.sharpe', n: 4 },
  { name: 'SPY netto Mittel', pfad: 'benchmarks.spy.kennzahlen.netto.mittel', n: 4 },
  { name: 'Maschine V0 (Long-Uni) netto Mittel', pfad: 'maschineV0.netto.mittel', n: 4 }, { name: 'Maschine V0 netto t', pfad: 'maschineV0.netto.t', n: 3 },
  { name: 'Orakel(Tag) Mittel/sd', pfad: 'kontrollen.orakel.nachrichtlich.orakelTagMittelDurchSd', n: 3 }, { name: 'Orakel(Tag) t', pfad: 'kontrollen.orakel.nachrichtlich.orakelTagT', n: 2 },
  { name: 'French-rho (Urteil, lsBrutto)', pfad: 'urteil.aussen.rho', n: 4 },
]);
if (AUb) { var rb = hol(AUb, 'haupt.rho'); out.tafeln.aussenV2 = { rho: rb, n: hol(AUb, 'haupt.n'), beta: hol(AUb, 'haupt.beta'), urteil: AUb.urteil }; process.stdout.write('  French-rho v2 (aussen.js neu gerechnet): ' + f(rb, 4) + ' (n ' + hol(AUb, 'haupt.n') + ', Urteil ' + AUb.urteil + ')\n'); }
if (T3a && T3b) {
  var ua = T3a.urteil || {}, ub = T3b.urteil || {};
  process.stdout.write('  Urteil: v1 gewaehlt ' + ua.gewaehlt + ', Tore ' + ua.toreMaschine + ', bestanden ' + JSON.stringify(ua.bestanden) + ' | v2 gewaehlt ' + ub.gewaehlt + ', Tore ' + ub.toreMaschine + ', bestanden ' + JSON.stringify(ub.bestanden) + '\n');
  process.stdout.write('  Befunde v1 ' + (T3a.befunde || []).length + ' | v2 ' + (T3b.befunde || []).length + (T3b.befunde && T3b.befunde.length ? ': ' + T3b.befunde.join(' | ') : '') + '\n');
  out.tafeln.urteilTeil3 = { v1: ua, v2: ub, befundeV2: T3b.befunde || [] };
  /* Varianten v1-v3 netto */
  ['v1', 'v2', 'v3'].forEach(function (v) { process.stdout.write('  ' + v + ' netto Mittel: v1 ' + f(hol(T3a, 'varianten.' + v + '.kennzahlen.netto.mittel'), 4) + '  v2 ' + f(hol(T3b, 'varianten.' + v + '.kennzahlen.netto.mittel'), 4) + '\n'); });
}

/* Teil 1: Kontrollen - je Lauf die ersten Zahlenfelder */
function laufZeilen(K, praefix) {
  var z = [];
  if (!K || !K.laeufe) return z;
  Object.keys(K.laeufe).forEach(function (art) { Object.keys(K.laeufe[art]).forEach(function (l) {
    var o = K.laeufe[art][l];
    ['netto.mittel', 'brutto.mittel', 'netto.t', 'mittel', 't', 'mittelDurchSd', 'mittelNetto', 'mittelBrutto', 'fehler', 'perioden'].forEach(function (p) { if (hol(o, p) != null) z.push({ name: art + ' ' + l + ' ' + p, pfad: 'laeufe.' + art + '.' + l + '.' + p, n: 4 }); });
  }); });
  return z;
}
if (K1a || K1b) {
  var zk = laufZeilen(K1a || K1b);
  tafel('Teil 1, Kontrollen (Orakel, Zufall, Momentum) - Pp je Periode', K1a, K1b, zk);
  process.stdout.write('  bestanden: v1 ' + (K1a ? K1a.bestanden + ' (Orakel ' + K1a.orakelBestanden + ', Zufall ' + K1a.zufallBestanden + ')' : '—') + ' | v2 ' + (K1b ? K1b.bestanden + ' (Orakel ' + K1b.orakelBestanden + ', Zufall ' + K1b.zufallBestanden + ')' : '—') + '\n');
  process.stdout.write('  Befunde v1: ' + JSON.stringify(K1a ? K1a.befunde : null) + ' | v2: ' + JSON.stringify(K1b ? K1b.befunde : null) + '\n');
  out.tafeln.kontrollenUrteil = { v1: K1a ? { bestanden: K1a.bestanden, befunde: K1a.befunde } : null, v2: K1b ? { bestanden: K1b.bestanden, befunde: K1b.befunde } : null };
}

/* Teil 4: Test 1 (A&B gegen A&nichtB) und Test 2 */
tafel('Teil 4, Test 1 gepaart (Pp je 120/250 Tage) und Test 2', T4a, T4b, [
  { name: 'Test 1 h120 netto Mittel', pfad: 'test1.h120.netto.mittel', n: 4 }, { name: 'Test 1 h120 netto se (HH)', pfad: 'test1.h120.netto.se', n: 4 },
  { name: 'Test 1 h120 netto t', pfad: 'test1.h120.netto.t', n: 3 }, { name: 'Test 1 h120 MDE80', pfad: 'test1.h120.netto.mde', n: 4 }, { name: 'Test 1 h120 n', pfad: 'test1.h120.n', n: 0 },
  { name: 'Test 1 h250 netto Mittel', pfad: 'test1.h250.netto.mittel', n: 4 }, { name: 'Test 1 h250 netto t', pfad: 'test1.h250.netto.t', n: 3 },
  { name: 'Test 2 h120 netto Mittel', pfad: 'test2.h120.netto.mittel', n: 4 }, { name: 'Test 2 h120 netto t', pfad: 'test2.h120.netto.t', n: 3 },
  { name: 'Vorpruefung A je Monat', pfad: 'vorpruefung.aMittel', n: 2 }, { name: 'Vorpruefung Universum je Monat', pfad: 'vorpruefung.uniMittel', n: 2 },
  { name: 'Vorpruefung Paar-sd h120', pfad: 'vorpruefung.horizonte.h120.paarSd', n: 3 },
]);
if (T4a && T4b) { process.stdout.write('  Urteil v1: ' + JSON.stringify(T4a.urteil).slice(0, 300) + '\n  Urteil v2: ' + JSON.stringify(T4b.urteil).slice(0, 300) + '\n  Befunde v2: ' + JSON.stringify(T4b.befunde).slice(0, 400) + '\n'); out.tafeln.urteilTeil4 = { v1: T4a.urteil, v2: T4b.urteil, befundeV2: T4b.befunde }; }

fs.writeFileSync(path.join(__dirname, 'vergleich-v2.json'), JSON.stringify(out, null, 1));
process.stdout.write('\n-> vergleich-v2.json\n');
