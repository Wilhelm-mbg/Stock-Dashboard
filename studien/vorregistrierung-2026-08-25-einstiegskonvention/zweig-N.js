'use strict';
/* ZWEIG N — die 60m-Strategien mit Fuellung zum ersten handelbaren Kurs NACH dem Signal.
 *
 * DIE REGEL, vorregistriert: "Nach unten: alles. Nach oben: nichts." Ein Urteil darf von
 * belegt auf nicht entscheidbar oder widerlegt FALLEN. Es darf nicht steigen. Eine
 * Strategie, deren korrigierter Wert vielversprechend aussieht, geht zurueck in den
 * Entdeckungsstapel und braucht FRISCHE Bestaetigungstage.
 *
 * DIES SIND KEINE TESTS. Die Konvention steht vorher fest, die Neumessung darf nur nach
 * unten wirken. Berichtet werden Punktschaetzer und 95-%-Intervall, ohne Sterne.
 *
 * SCHUTZVORHERSAGE fuer t1 V0 (vorregistriert, als Intervall): Ueberschuss springt von
 * -0,0040 Pp auf +0,08 bis +0,12 Pp, se faellt von 0,0583 auf ~0,047, also t ~ 1,6 bis 3,1.
 * Grund: unter folgeEroeffnung verlaesst die Uebernachtluecke die Handelsrendite, und t1
 * sitzt zu 99,914 % auf der Sitzungsgrenze, wo die Luecke je Fall sd 1,7652 Pp hat.
 * DIE UNGUELTIGKEIT IST VOM t-WERT ENTKOPPELT: der Grund lautet "die Bestaetigungshaelfte
 * von t1 ist verbraucht", nicht "es reisst die Schwelle ohnehin nicht".
 *
 * Die Strategiedateien werden NICHT veraendert - die Konvention wird hier gesetzt, damit
 * kein Lauf spaeter behaupten kann, sie sei nachtraeglich gewaehlt worden.
 *
 * Aufruf: node studien/vorregistrierung-2026-08-25-einstiegskonvention/zweig-N.js
 */
var path = require('path'), fs = require('fs');
var M = require(path.resolve(__dirname, '..', 'messmaschine', 'messmaschine.js'));

var ARCHIV = process.env.MD_ARCHIV60M || 'E:/Markt-Dashboard-Archiv/archiv60m';
var STRAT = path.resolve(__dirname, '..', 'messmaschine', 'strategien');
var NAMEN = ['kapitulation', 'rsi2seit', 'rsi2seit-mcp', 't1-zwangsglattstellung',
             't2-umsatzschock', 't3-stundendrift'];

function laufe(name, konvention) {
  delete require.cache[require.resolve(path.join(STRAT, name + '.js'))];
  var S = require(path.join(STRAT, name + '.js'));
  if ((S.zeitrahmen || '60m') !== '60m') return null;
  S.einstiegsZeitpunkt = konvention;
  return M.messe(S, ARCHIV);
}

var pp = function (x) { return x == null ? '   –  ' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(4)); };
var Z = 1.959964;

console.log('ZWEIG N — Fuellung zum ersten handelbaren Kurs NACH dem Signal');
console.log('Punktschaetzer und 95-%-Intervall. KEINE Tests, keine Sterne.');
console.log('Ein Urteil darf nur nach unten wirken.\n');

console.log('Strategie                 V   Ueberschuss alt   Ueberschuss neu      Verschiebung   t alt   t neu');
var zeilen = [];
NAMEN.forEach(function (name) {
  var alt, neu;
  try { alt = laufe(name, 'schlusskerze'); neu = laufe(name, 'folgeEroeffnung'); }
  catch (e) { console.log('  ' + name + ': FEHLER ' + String(e.message).slice(0, 60)); return; }
  if (!alt || !neu || alt.verweigert || neu.verweigert) {
    console.log('  ' + name + ': verweigert (' + ((alt && alt.grund) || (neu && neu.grund) || '?') + ')');
    return;
  }
  alt.ergebnisse.forEach(function (eA, vi) {
    var eN = neu.ergebnisse[vi]; if (!eN) return;
    var a = eA.bestaetigung.ueberschuss, n = eN.bestaetigung.ueberschuss;
    var d = n.tagesmittel - a.tagesmittel;
    console.log('  ' + name.slice(0, 22).padEnd(24) + vi + '   ' +
      pp(a.tagesmittel).padStart(13) + '   ' + pp(n.tagesmittel).padStart(14) + '   ' +
      pp(d).padStart(15) + '   ' + (a.t == null ? '  –' : a.t.toFixed(2).padStart(5)) +
      '   ' + (n.t == null ? '  –' : n.t.toFixed(2).padStart(5)));
    zeilen.push({ name: name, v: vi, altM: a.tagesmittel, neuM: n.tagesmittel, neuSe: n.se,
      altT: a.t, neuT: n.t, altUrteil: (alt.urteile || [])[vi], neuUrteil: (neu.urteile || [])[vi] });
  });
});

console.log('\n95-%-INTERVALLE der neuen Schaetzer:');
zeilen.forEach(function (r) {
  if (!(r.neuSe > 0)) return;
  console.log('  ' + (r.name + ' V' + r.v).padEnd(28) + pp(r.neuM) + ' Pp  [' +
    pp(r.neuM - Z * r.neuSe) + ', ' + pp(r.neuM + Z * r.neuSe) + ']');
});

/* Die Schutzvorhersage - vorregistriert, hier geprueft. */
var t1 = zeilen.filter(function (r) { return r.name === 't1-zwangsglattstellung' && r.v === 0; })[0];
if (t1) {
  console.log('\nSCHUTZVORHERSAGE t1 V0 (vorregistriert):');
  console.log('  Ueberschuss  vorhergesagt +0,08 bis +0,12 Pp   gemessen ' + pp(t1.neuM) + ' Pp  -> ' +
    (t1.neuM >= 0.0008 && t1.neuM <= 0.0012 ? 'im Intervall' : 'AUSSERHALB'));
  console.log('  t            vorhergesagt 1,6 bis 3,1          gemessen ' +
    (t1.neuT == null ? '–' : t1.neuT.toFixed(2)) + '  -> ' +
    (t1.neuT >= 1.6 && t1.neuT <= 3.1 ? 'im Intervall' : 'AUSSERHALB'));
  console.log('  Und unabhaengig davon UNGUELTIG: die Bestaetigungshaelfte von t1 ist verbraucht.');
}

/* Die Regel: nur nach unten. */
console.log('\nREGEL "nur nach unten" — hat sich ein Urteil VERBESSERT?');
var RANG = { 'bestaetigt': 0, 'nicht-bestaetigt': 1, 'nicht-entscheidbar': 2, 'nicht-messbar': 3, 'widerlegt': 4 };
var hoch = zeilen.filter(function (r) {
  return RANG[r.neuUrteil] != null && RANG[r.altUrteil] != null && RANG[r.neuUrteil] < RANG[r.altUrteil];
});
if (!hoch.length) console.log('  Nein - kein Urteil ist gestiegen.');
else hoch.forEach(function (r) {
  console.log('  ' + r.name + ' V' + r.v + ': ' + r.altUrteil + ' -> ' + r.neuUrteil +
    '  ZURUECK IN DEN ENTDECKUNGSSTAPEL - braucht frische Bestaetigungstage.');
});
