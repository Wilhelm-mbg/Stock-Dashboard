'use strict';
/* Frage: Liegt bei Terminen ohne Uhrzeit (Stempel 04:00/05:00 UTC = Mitternacht New York)
 * der Kurssprung VOR dem Einstieg (Schluss des Reaktionstags r) oder DANACH?
 * Korrekt datiert: Sprung auf r-1 -> r (vor Einstieg). Falsch (Meldung nach Schluss, aber
 * als Vorboersen gewertet): Sprung auf r -> r+1, also NACH dem Einstieg = Zukunftsblick. */
const { lade } = require('./lade.js');
const Dr = require('../../../drift.js');
const { kursMap, markt, termine } = lade();
const ev = Dr.ereignisse(kursMap, termine, markt, { zukunftNoetig: false });
const pos = Dr.zuordnen(ev);
const stempel = {};
Object.keys(termine).forEach(s => termine[s].forEach(t => { stempel[s + '|' + Date.parse(t[0])] = new Date(t[0]).getUTCHours(); }));
// Ereignis -> Stunde: ueber sym + Reaktionstag ist nicht eindeutig, deshalb ueber termineMap neu suchen
const klasse = h => (h === 4 || h === 5) ? 'mitternacht' : (h >= 20 || h <= 3) ? 'nachSchluss' : (h >= 9 && h <= 14) ? 'vorOeffnung' : 'sonst';
const agg = {}; const IDX = {}; Object.keys(kursMap).forEach(sy => { IDX[sy] = Dr.datumIndex(kursMap[sy]); }); const RT = {}; Object.keys(termine).forEach(sy => { RT[sy] = {}; termine[sy].forEach(tt => { if (tt[3] == null) return; const r = Dr.reaktionstag(tt[0], IDX[sy]); if (r != null && RT[sy][r] == null) RT[sy][r] = new Date(tt[0]).getUTCHours(); }); });
pos.forEach(p => {
  const b = kursMap[p.e.sym], r = p.e.i;
  if (r < 2 || r + 2 >= b.length) return;
  // Termin zu diesem Ereignis: der mit reaktionstag == r
  const h = RT[p.e.sym][r]; if (h == null) return;
  const k = klasse(h);
  const vor = b[r][1] / b[r - 1][1] - 1, nach = b[r + 1][1] / b[r][1] - 1;
  const a = agg[k] = agg[k] || { n: 0, absVor: 0, absNach: 0, sigVor: 0, sigNach: 0 };
  a.n++; a.absVor += Math.abs(vor); a.absNach += Math.abs(nach); a.sigVor += p.richtung * vor; a.sigNach += p.richtung * nach;
});
console.log('Klasse            n   |ret| r-1->r   |ret| r->r+1   Richtung*ret r-1->r   Richtung*ret r->r+1');
Object.keys(agg).forEach(k => { const a = agg[k]; const f = x => (100 * x / a.n).toFixed(2).padStart(8) + ' %'; console.log(k.padEnd(14), String(a.n).padStart(6), f(a.absVor), '   ', f(a.absNach), '      ', f(a.sigVor), '          ', f(a.sigNach)); });
