/* Rauchtest des Messgeschirrs - mit zwei Detektoren, deren Ergebnis bekannt sein MUSS:
 *   placebo : feuert deterministisch alle 97 Kerzen, Richtung aus dem Zeitstempel.
 *             Ein korrektes Geschirr muss hier Ueberschuss ~0 und |t| klein zeigen.
 *             Zeigt es etwas anderes, ist das Geschirr kaputt (z. B. Kontrolle falsch).
 *   rsi2roh : RSI(2) < 10 -> long, > 90 -> short. Bekannte Mean-Reversion-Heuristik;
 *             dient nur dazu, dass ueberhaupt Signale mit Struktur entstehen.
 */
'use strict';
const Q = require('../../quant.js');
const M = require('./messgeschirr.js');

const DETS = [
  { key: 'placebo', zeitrahmen: ['1m', '5m', '15m', '60m'], params: {},
    signal: (bars, i) => (i % 97 === 0 ? { dir: (Math.floor(bars[i][0] / 60000) % 2 === 0) ? 1 : -1 } : null) },
  { key: 'rsi2roh', zeitrahmen: ['1m', '5m', '15m', '60m'], params: { p: 2, lo: 10, hi: 90 },
    signal: (bars, i, p) => {
      if (i < 20) return null;
      const closes = bars.slice(i - 19, i + 1).map(b => b[1]);
      const r = Q.rsi(closes, p.p);
      const v = Array.isArray(r) ? r[r.length - 1] : r;
      if (v == null || isNaN(v)) return null;
      return v < p.lo ? { dir: 1 } : (v > p.hi ? { dir: -1 } : null);
    } },
];

const iv = process.argv[2] || '15m';
const out = M.lauf({ iv, phase: 'entdeckung', detektoren: DETS, max: 12 });

console.log('\n=== Placebo (muss ~0 sein) ===');
out.zeilen.filter(z => z.det === 'placebo' && z.bedingung === '-').forEach(z =>
  console.log('  ' + z.dir.padEnd(6) + z.hor.padEnd(4) + ' n=' + String(z.n).padStart(5) + '  brutto ' + String(z.bruttoPp).padStart(7) + ' Pp  t(Tag) ' + String(z.tTag).padStart(6) + '  MDE ' + z.mdeTagPp));
const pl = out.zeilen.filter(z => z.det === 'placebo' && z.bedingung === '-');
const maxT = Math.max.apply(null, pl.map(z => Math.abs(z.tTag)));
console.log('  -> groesstes |t| ' + maxT.toFixed(2) + (maxT < 2.5 ? '  OK' : '  VERDAECHTIG - Kontrolle pruefen'));

console.log('\n=== rsi2roh ===');
out.zeilen.filter(z => z.det === 'rsi2roh' && z.bedingung === '-').forEach(z =>
  console.log('  ' + z.dir.padEnd(6) + z.hor.padEnd(4) + ' n=' + String(z.n).padStart(5) + '  brutto ' + String(z.bruttoPp).padStart(7) + ' Pp  t(Tag) ' + String(z.tTag).padStart(6)));
console.log('\nBedingungs-Zeilen gesamt: ' + out.zeilen.filter(z => z.bedingung !== '-').length);
const bedBeispiel = out.zeilen.filter(z => z.det === 'rsi2roh' && z.bedingung === 'regime');
bedBeispiel.forEach(z => console.log('  regime=' + z.wert.padEnd(6) + z.dir.padEnd(6) + z.hor.padEnd(4) + ' n=' + z.n + ' brutto ' + z.bruttoPp));
