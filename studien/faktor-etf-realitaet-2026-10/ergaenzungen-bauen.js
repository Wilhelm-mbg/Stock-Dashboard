'use strict';
/* Fuehrt die belegten Ausschuettungs-Abweichungen der Gruppen (ergaenzungen-g1..g5.json) zu ergaenzungen.json zusammen,
 * die rechnen.js als benannte Ergaenzungen nach REGEL.md C2 anwendet. Nichts wird geschaetzt: jeder Eintrag traegt die
 * Anbieterquelle; der einzige abgeleitete Betrag (VOO 12/2014 aus der Jahressumme des Jahresberichts) ist markiert.
 *   node ergaenzungen-bauen.js */
const fs = require('fs');
const path = require('path');
const eintraege = []; const geprueft = [];
for (const g of ['g1', 'g2', 'g3', 'g4', 'g5']) {
  const p = path.join(__dirname, 'ergaenzungen-' + g + '.json');
  if (!fs.existsSync(p)) { console.log('fehlt: ' + p); continue; }
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const e of j.ergaenzungen || []) {
    eintraege.push({
      gruppe: g, symbol: e.symbol, ex: e.ex, art: e.art,
      betrag: e.art === 'streichen' ? 0 : e.betrag, yahooBetrag: e.yahooBetrag == null ? null : e.yahooBetrag,
      anbieterBetrag: e.anbieterBetrag == null ? null : e.anbieterBetrag, splitFaktor: e.splitFaktor == null ? 1 : e.splitFaktor,
      quelle_url: e.quelle_url, bemerkung: e.bemerkung || '',
      abgeleitet: /NICHT als Einzelzahlung/.test(e.bemerkung || '') || undefined
    });
  }
  for (const x of j.geprueft || []) geprueft.push(Object.assign({ gruppe: g }, x));
}
const zaehl = {};
for (const e of eintraege) zaehl[e.art] = (zaehl[e.art] || 0) + 1;
fs.writeFileSync(path.join(__dirname, 'ergaenzungen.json'), JSON.stringify({
  kennung: 'faktor-etf-realitaet-2026-10/v1',
  hinweis: 'Benannte Ergaenzungen nach REGEL.md C2: nachgewiesene Abweichungen der Yahoo-Ausschuettungen von der Anbieterhistorie. Betraege split-bereinigt in der Einheit der Yahoo-Reihe.',
  zaehlung: zaehl, fondsGeprueft: geprueft.length,
  nichtPruefbar: geprueft.filter((x) => /nicht/.test(x.ergebnis || '')).map((x) => x.id),
  eintraege, geprueft
}, null, 1) + '\n');
console.log('Eintraege: ' + eintraege.length + ' ' + JSON.stringify(zaehl) + ', Fonds geprueft: ' + geprueft.length);
