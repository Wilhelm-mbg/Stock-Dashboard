'use strict';
/* Auswertung der Neumessung vom 26.08.2026 - zweite Fassung.
 *
 * Die erste verglich je Protokoll die Variante, die das Urteil traegt. Das ist FALSCH,
 * sobald das Urteil wechselt: dann stehen zwei VERSCHIEDENE Varianten nebeneinander, und
 * der Unterschied sieht nach Bewegung aus, wo keine ist. Bei rsi2seit-mcp kam so ein
 * "t 2,01 -> 1,72" heraus; Variante gegen Variante sind es 1,74 -> 1,72.
 *
 * Verglichen wird deshalb Variante i gegen Variante i. Und weil ein Vergleich nur zaehlt,
 * wenn beide Seiten dasselbe gemessen haben, wird das Universum mitgeprueft: bei
 * monatsende-kauf lief das alte Protokoll auf 191 Werten, das neue auf 2.874 - da ist
 * jede Differenz eine Folge der Datenmenge, kein Befund ueber die Strategie.
 */
const fs = require('fs');
const path = require('path');
const D = 'C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/messmaschine/protokolle';
const HEUTE = '2026-08-26';

const alle = fs.readdirSync(D).filter((f) => f.endsWith('.json'));
const neu = alle.filter((f) => f.indexOf(HEUTE) !== -1).sort();
function key(f) { return f.replace(/-\d{4}-\d{2}-\d{2}(-fremdarchiv)?\.json$/, ''); }
function lade(f) { return JSON.parse(fs.readFileSync(path.join(D, f), 'utf8')); }
function uni(j) { return j.universum.werte + '/' + j.universum.handelstage + '/' + j.universum.von + '/' + j.universum.bis; }

const staende = new Set(), versionen = new Set();
let gleich = 0, gewechselt = [], unvergleichbar = [], ohneVorgaenger = [];

console.log('# Neumessung 26.08.2026\n');
console.log('| Strategie | Var | Urteil vorher -> jetzt | t | Ueberschuss Pp | Signale |');
console.log('|---|---|---|---|---|---|');

neu.forEach((f) => {
  const k = key(f), j = lade(f);
  staende.add(j.verfahren.codeStand); versionen.add(j.verfahren.version);
  const vor = alle.filter((x) => key(x) === k && x !== f && x.indexOf('fremdarchiv') === -1).sort().reverse();
  if (!vor.length) { ohneVorgaenger.push(k); console.log('| ' + k + ' | – | (kein Vorgaenger) | | | |'); return; }
  const alt = lade(vor[0]);
  if (uni(alt) !== uni(j)) {
    unvergleichbar.push({ key: k, alt: uni(alt), neu: uni(j), datei: vor[0] });
    console.log('| ' + k + ' | – | **nicht vergleichbar** (anderes Universum) | | | |');
    return;
  }
  j.ergebnisse.forEach((en, i) => {
    const ea = alt.ergebnisse[i];
    if (!ea) return;
    const ua = ea.bestaetigung.ueberschuss, un = en.bestaetigung.ueberschuss;
    const uAlt = alt.urteile[i], uNeu = j.urteile[i];
    if (uAlt === uNeu) gleich++; else gewechselt.push({ key: k, i: i, von: uAlt, zu: uNeu, ppAlt: ua.tagesmittel, ppNeu: un.tagesmittel, mde: un.mde });
    console.log('| ' + (i === 0 ? k : '') + ' | ' + i + ' | ' + uAlt + (uAlt === uNeu ? '' : ' -> **' + uNeu + '**') +
      ' | ' + (ua.t == null ? '–' : ua.t.toFixed(2)) + ' -> ' + (un.t == null ? '–' : un.t.toFixed(2)) +
      ' | ' + (ua.tagesmittel * 100).toFixed(4) + ' -> ' + (un.tagesmittel * 100).toFixed(4) +
      ' | ' + ea.signale + ' -> ' + en.signale + ' |');
  });
});

console.log('\n## Was sich bewegt hat');
console.log('  Varianten mit unveraendertem Urteil: ' + gleich);
console.log('  Varianten mit gewechseltem Urteil:   ' + gewechselt.length);
gewechselt.forEach((g) => {
  console.log('    ' + g.key + ' Variante ' + g.i + ': ' + g.von + ' -> ' + g.zu);
  console.log('      Ueberschuss ' + (g.ppAlt * 100).toFixed(4) + ' -> ' + (g.ppNeu * 100).toFixed(4) +
    ' Pp gegen MDE ' + (g.mde * 100).toFixed(4) + ' Pp   (Abstand ' + ((g.ppNeu - g.mde) * 100).toFixed(4) + ' Pp)');
});
if (unvergleichbar.length) {
  console.log('\n## Nicht vergleichbar (anderes Universum - kein Befund ueber die Strategie)');
  unvergleichbar.forEach((u) => console.log('  ' + u.key + '\n    alt (' + u.datei + '): ' + u.alt + '\n    neu:                          ' + u.neu));
}
if (ohneVorgaenger.length) console.log('\n## Ohne Vorgaenger: ' + ohneVorgaenger.join(', '));

console.log('\n## Vergleichbarkeit des Laufs selbst');
console.log('  Protokolle: ' + neu.length);
console.log('  Maschinenversionen: ' + Array.from(versionen).join(', ') + (versionen.size === 1 ? '  (eine)' : '  ACHTUNG'));
console.log('  Codestaende: ' + Array.from(staende).join(', ') + (staende.size === 1 ? '  (einer - die Sperre hat gehalten)' : '  ACHTUNG: nicht vergleichbar!'));
