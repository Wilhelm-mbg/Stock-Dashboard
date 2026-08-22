'use strict';
const fs = require('fs');
const { lade, ST } = require('./lade.js');
const D = require('./drift.js');
const v = lade();
// Einmal je Universum (Tageskurse aller Symbole, SPY, Terminarchiv):
const TAB = D.signalTabelle(v.kursMap, v.termine, v.markt);

// ---- AUFRUF-SNIPPET fuer das Messgeschirr (bars, i, params) -> {dir} | null ----
const Drift = require('C:/Users/Wilhe/AppData/Local/Temp/claude/C--Users-Wilhe-AppData-Local-Programs-markt-dashboard/5d59645f-0547-4aec-912b-09c638f04c24/scratchpad/detektoren/drift.js');
function driftSignal(bars, i, params) {
  // params.signale = TAB[SYM] aus Drift.signalTabelle(kursMapTage, termine, spyTage) – einmal je Universum
  var s = Drift.signal(bars, i, { signale: params.signale, schlussAbMin: 900 });
  return s ? { dir: s.dir } : null;          // feuert auf der Schlusskerze des Reaktionstags
}
// --------------------------------------------------------------------------------

for (const sym of ['AAPL', 'MSFT', 'JPM', 'TSLA']) {
  const bars = JSON.parse(fs.readFileSync(ST + 'bars_60m_' + sym + '.json', 'utf8')).series;
  const P = { signale: TAB[sym] || {} };
  const treffer = [];
  for (let i = 0; i < bars.length; i++) { const s = driftSignal(bars, i, P); if (s) treffer.push(new Date(bars[i][0]).toISOString().slice(0, 16) + ' dir=' + s.dir + ' kurs=' + bars[i][1].toFixed(2)); }
  console.log(sym, '60m Signale:', treffer.length, '| Tage laut Tabelle im 60m-Zeitraum:',
    Object.keys(P.signale).filter(d => d >= new Date(bars[0][0]).toISOString().slice(0, 10)).length, '\n  ', treffer.slice(-4).join('\n   '));
}
// Tageskerzen: dieselbe Funktion auf Tagesdaten
const bd = v.kursMap.AAPL; let nT = 0; for (let i = 0; i < bd.length; i++) if (driftSignal(bd, i, { signale: TAB.AAPL })) nT++;
console.log('AAPL 1d Signale:', nT, '| Tabelle:', Object.keys(TAB.AAPL).length);
