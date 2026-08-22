'use strict';
const Dr = require('../../../drift.js');
// 120 Handelstage, letzter Tag 2026-08-21 (Freitag), Stempel wie mf_tagesdaten (Sessionöffnung UTC)
const tage = []; let d = new Date(Date.UTC(2026, 7, 21, 13, 30));
while (tage.length < 120) { if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) tage.unshift([d.getTime(), 100]); d = new Date(d.getTime() - 86400000); }
const idx = Dr.datumIndex(tage);
console.log('b.length =', tage.length, '| reaktionstag(21.08. 21:00Z) =', Dr.reaktionstag('2026-08-21T21:00:00.000Z', idx));
for (const fall of [['Meldung NACH Schluss am letzten Tag', '2026-08-21T21:00:00.000Z'], ['Meldung VOR Oeffnung am letzten Tag', '2026-08-21T11:00:00.000Z']]) {
  try {
    const e = Dr.ereignisse({ X: tage }, { X: [[fall[1], 1, 1, 5]] }, tage, { zukunftNoetig: false });
    console.log(fall[0], '-> ok, Ereignisse:', e.length);
  } catch (e) { console.log(fall[0], '-> WIRFT:', e.constructor.name, e.message); }
}
// heute() im Live-Pfad (mfdepot.js:116) ruft ereignisse mit zukunftNoetig:false
try { Dr.heute({ X: tage }, { X: [['2026-08-21T21:00:00.000Z', 1, 1, 5]] }, tage); console.log('heute() ok'); }
catch (e) { console.log('heute() WIRFT:', e.message); }
