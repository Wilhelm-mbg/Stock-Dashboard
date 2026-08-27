'use strict';
/* STRESS-ACHSE: Trennt die SPXL-Spannen-Quote (Vortag, >=1,5 ueber 20-Tage-Median)
 * die Kapitulations-Kante? Vorregistriert in VORREGISTRIERUNG.md VOR diesem Bau.
 * Kante unveraendert aus strategien/kapitulation.js; Maschine unveraendert.
 * NICHTS wird geschrieben ausser Ergebnisdateien in diesen Ordner.
 * Ueberschuss = Bestaetigungs-Haelfte (Maschinen-Konvention). NEIN ist erwartet. */
var fs = require('fs'), path = require('path');
var cp = require('child_process');
var MM = require('../messmaschine/messmaschine.js');
var K = require('../messmaschine/strategien/kapitulation.js');
var HIER = __dirname;
var ARCHIV60M = 'E:/Markt-Dashboard-Archiv/archiv60m';

/* Wachhund je Archiv (Sperre = Abbruch) */
var wh = cp.spawnSync('node', [path.join(HIER, '..', '..', 'tools', 'archiv-wachhund.js'), 'archiv60m'], { encoding: 'utf8' });
console.log('[Wachhund archiv60m] Exit ' + wh.status);
if (wh.status !== 0) { console.log(wh.stdout + wh.stderr); process.exit(2); }

/* ---------- Achse aus SPXL 1d: Spanne/(Median der 20 Vortage), Stress >= 1,5 ---------- */
var SCHWELLE = 1.5, ANTEIL_GATE = 0.35;
var spxl = JSON.parse(fs.readFileSync('E:/Markt-Dashboard-Archiv/archiv1d/bars_1d_SPXL.json', 'utf8'));
var B = spxl.bars || spxl.series;   /* [zeit, schluss, umsatz, hoch, tief, eroeffnung] */
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
var achseTage = [], achseStress = [], achsePlacebo = [];
var spannen = [];
for (var i = 0; i < B.length; i++) {
  var c = B[i][1], h = B[i][3], l = B[i][4];
  spannen.push((c > 0 && h >= l) ? (h - l) / c : null);
}
for (var i2 = 20; i2 < B.length; i2++) {
  if (spannen[i2] == null) continue;
  var fenster = [];
  for (var k = i2 - 20; k < i2; k++) if (spannen[k] != null) fenster.push(spannen[k]);
  if (fenster.length < 15) continue;
  fenster.sort(function (a, b) { return a - b; });
  var med = fenster[Math.floor(fenster.length / 2)];
  if (!(med > 0)) continue;
  achseTage.push(tagVon(B[i2][0]));
  achseStress.push(spannen[i2] / med >= SCHWELLE);
}
var nStress = achseStress.filter(Boolean).length;
var anteil = nStress / achseStress.length;
console.log('Achse: ' + achseStress.length + ' Tage (' + achseTage[0] + '..' + achseTage[achseTage.length - 1] + '), Stress-Anteil ' +
  (anteil * 100).toFixed(1) + ' %  (Gate <= 35 %)');
if (anteil > ANTEIL_GATE) {
  console.log('SIGNALANTEIL-GATE GERISSEN -> NEIN per Vorregistrierung (Achse trennt per Konstruktion nicht). Kein Lauf.');
  process.exit(0);
}
/* Placebo: Tages-Hash ohne Kursbezug, gleiche Randhaeufigkeit */
function hash01(tagStr) {
  var n = +tagStr.replace(/-/g, '');
  var x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
for (var p = 0; p < achseTage.length; p++) achsePlacebo.push(hash01(achseTage[p]) < anteil);
var nPl = achsePlacebo.filter(Boolean).length;
console.log('Placebo-Anteil ' + (100 * nPl / achsePlacebo.length).toFixed(1) + ' % (Soll ~' + (anteil * 100).toFixed(1) + ' %)');

/* Ueberlappung mit alter Regime-Achse (deskriptiv, ohne Urteil) */
try {
  var dm = JSON.parse(fs.readFileSync(path.join(process.env.APPDATA || '', 'Markt-Dashboard', 'store', 'drift_markt.json'), 'utf8')).reihe;
  var kf = 2 / (29 + 1), ema = dm[0][1], unter = {};
  for (var q = 0; q < dm.length; q++) { ema = dm[q][1] * kf + ema * (1 - kf); unter[tagVon(dm[q][0])] = dm[q][1] <= ema; }
  var beide = 0, mitAnker = 0;
  for (var u = 0; u < achseTage.length; u++) if (achseStress[u] && (achseTage[u] in unter)) { mitAnker++; if (unter[achseTage[u]]) beide++; }
  console.log('Ueberlappung (deskriptiv): ' + beide + '/' + mitAnker + ' Stress-Tage sind zugleich Markt<=EMA-Tage (' +
    (mitAnker ? (100 * beide / mitAnker).toFixed(1) : '?') + ' %)');
} catch (e) { console.log('Ueberlappung: Regime-Anker nicht lesbar (' + e.code + ') - deskriptiver Ausweis entfaellt.'); }

/* Signal-Tag -> letzter Achsen-Tag STRENG davor (kein Blick nach vorn) */
function achseVorTag(ms) {
  var d = tagVon(ms);
  var lo = 0, hi = achseTage.length;
  while (lo < hi) { var m = (lo + hi) >> 1; if (achseTage[m] < d) lo = m + 1; else hi = m; }
  return lo > 0 ? { stress: achseStress[lo - 1], placebo: achsePlacebo[lo - 1] } : null;
}

/* ---------- Strategie-Huelle: Kante unveraendert, Achse als Tor je Variante ---------- */
var S = {
  key: 'kapitulation-stress-achse',
  testfamilie: { name: 'stress-achse-2026-08-27', testsGesamt: 6,
    begruendung: 'Vorregistrierte Familie: Stress-Arm und Ruhig-Arm sind die zwei Tests; Basis (Positivkontrolle), zwei Placebo-Waechter und Live-Referenz laufen ausser Konkurrenz, die Maschine zaehlt konservativ alle 6.' },
  grund: 'Instrumentenfrage, kein Kanten-Nachweis: Trennt die Spannen-Quote (Vortag) die validierte Kapitulations-Kante in tragende Stress- und nicht tragende Ruhig-Tage? (PM-Auftrag Kosten-Freigabeschwelle)',
  zeitrahmen: '60m',
  leseFensterKerzen: K.leseFensterKerzen,
  haltedauerKerzen: K.haltedauerKerzen,
  richtung: K.richtung,
  universum: K.universum,
  kosten: K.kosten,
  varianten: [
    { liquiditaet: true, regime: false, achse: null,       name: 'basis' },
    { liquiditaet: true, regime: false, achse: 'stress',   name: 'stress' },
    { liquiditaet: true, regime: false, achse: 'ruhig',    name: 'ruhig' },
    { liquiditaet: true, regime: false, achse: 'plStress', name: 'placebo-stress' },
    { liquiditaet: true, regime: false, achse: 'plRuhig',  name: 'placebo-ruhig' },
    { liquiditaet: true, regime: true,  achse: null,       name: 'live-referenz' },
  ],
  signal: function (bars, i, params) {
    if (params.achse) {
      var a = achseVorTag(bars[i][0]);
      if (!a) return null;
      if (params.achse === 'stress' && !a.stress) return null;
      if (params.achse === 'ruhig' && a.stress) return null;
      if (params.achse === 'plStress' && !a.placebo) return null;
      if (params.achse === 'plRuhig' && a.placebo) return null;
    }
    return K.signal(bars, i, params);
  },
};

console.log('\nmesse() startet (6 Varianten, volles 60m-Archiv) ...');
var R = MM.messe(S, ARCHIV60M, {});
fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'),
  JSON.stringify(R, null, 1));

/* ---------- Vorregistriertes JA/NEIN-Kriterium ---------- */
function arm(name) {
  for (var j = 0; j < R.ergebnisse.length; j++) if ((S.varianten[R.ergebnisse[j].variante] || {}).name === name || R.ergebnisse[j].variante === name) return R.ergebnisse[j];
  return R.ergebnisse[({ basis: 0, stress: 1, ruhig: 2, 'placebo-stress': 3, 'placebo-ruhig': 4, 'live-referenz': 5 })[name]];
}
function bu(r) { return r && r.bestaetigung && r.bestaetigung.ueberschuss; }
var schwelle = null;
R.entscheidungen.forEach(function (e) { if (e.name === 'B4 Bonferroni') schwelle = e.ergebnis.schwelleT; });
var basis = bu(arm('basis')), st = bu(arm('stress')), ru = bu(arm('ruhig')),
    ps = bu(arm('placebo-stress')), pr = bu(arm('placebo-ruhig')), live = bu(arm('live-referenz'));
function welch(a, b) {
  if (!a || !b || !(a.se > 0) || !(b.se > 0)) return null;
  return (a.tagesmittel - b.tagesmittel) / Math.sqrt(a.se * a.se + b.se * b.se);
}
var tDiff = welch(st, ru), tPl = welch(ps, pr);
function z(x, f) { return x == null ? '?' : (x * (f || 1)).toFixed(f === 100 ? 4 : 2); }
console.log('\n-- Arme (Bestaetigungs-Ueberschuss) --');
[['basis', basis], ['stress', st], ['ruhig', ru], ['placebo-stress', ps], ['placebo-ruhig', pr], ['live-referenz', live]].forEach(function (x) {
  var b = x[1] || {};
  console.log(x[0].padEnd(16) + 'Tage=' + (b.tage || 0) + '  Signale=' + (b.signale || 0) +
    '  Mittel=' + z(b.tagesmittel, 100) + ' Pp  t=' + z(b.t) + '  MDE=' + z(b.mde, 100) + ' Pp  jeSignal=' + z(b.jeSignal, 100) + ' Pp');
});
console.log('Welch-t Stress-Ruhig = ' + z(tDiff) + '   Welch-t Placebo-Differenz = ' + z(tPl) + '   Bonferroni-Schwelle = ' + z(schwelle));

var krit = [
  ['1 Signalanteil <= 35 %', anteil <= ANTEIL_GATE],
  ['2 Positivkontrolle Basis t >= 2', !!(basis && basis.t >= 2)],
  ['3 Stress traegt (t >= Schwelle, jeSignal > 0)', !!(st && schwelle != null && st.t >= schwelle && st.jeSignal > 0)],
  ['4 Ruhig traegt nicht (t < Schwelle)', !!(ru && schwelle != null && ru.t < schwelle)],
  ['5 Differenz Welch-t >= 2', tDiff != null && tDiff >= 2],
  ['6 Placebo-Differenz |t| < 2', tPl != null && Math.abs(tPl) < 2],
];
console.log('\n-- Vorregistriertes Kriterium --');
var alle = true; krit.forEach(function (c) { console.log((c[1] ? ' erfuellt ' : ' VERFEHLT ') + ' ' + c[0]); if (!c[1]) alle = false; });
var urteil = !(basis && basis.t >= 2) ? 'NICHT MESSBAR (Positivkontrolle versagt - kein NEIN, kein JA)' : (alle ? 'JA - Achse validiert' : 'NEIN - Achse wird nicht gebaut, Schwelle bleibt streng');
console.log('\nURTEIL: ' + urteil);
console.log('delta80 Stress-Arm ' + (st && st.se > 0 && schwelle != null ? ((schwelle + 0.8416) * st.se * 100).toFixed(4) + ' Pp' : '?') +
  ' | Ruhig-Arm ' + (ru && ru.se > 0 && schwelle != null ? ((schwelle + 0.8416) * ru.se * 100).toFixed(4) + ' Pp' : '?'));
fs.writeFileSync(path.join(HIER, 'urteil-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'),
  JSON.stringify({ gemessenAm: new Date().toISOString(), anteil: anteil, schwelleBonferroni: schwelle, tDiff: tDiff, tPlacebo: tPl,
    kriterien: krit, urteil: urteil, arme: { basis: basis, stress: st, ruhig: ru, placeboStress: ps, placeboRuhig: pr, live: live } }, null, 1));
console.log('Dateien geschrieben. NICHTS am Archiv geaendert.');
