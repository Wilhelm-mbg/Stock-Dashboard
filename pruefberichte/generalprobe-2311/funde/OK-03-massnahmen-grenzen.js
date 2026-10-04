'use strict';
/* Gegenprobe zu bucheMassnahmen: Ex-Tag = Kauftag zaehlt nicht (kursT = Stempel des Kaufbalkens), Ex-Tag nach dem Kauf zaehlt, Split + Ausschuettung in einem Takt
 * (Stueckzahl NACH dem Split, auch fuer eine Ausschuettung VOR dem Split-Tag, Betrag in heutiger Stueckelung), Leerverkauf belastet, zweiter Aufruf bucht nichts,
 * Ex-Tag am Ausfuehrungstag bei BEHALTENER Position wird nach 16:15 gebucht (wie die Messung: Gutschrift nach dem Handel). */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
module.exports = {
  id: 'OK-03-massnahmen-grenzen', klasse: 'ok', ort: 'mfhandel.js:607 bucheMassnahmen', titel: 'Kapitalmassnahmen: Grenzfaelle Kauftag, Split+Dividende, Leerverkauf, Doppelbuchung',
  ausloeser: 'Gegenprobe', erwartet: 'siehe Kopf',
  async lauf() {
    var D = 86400000, t0 = Date.UTC(2026, 10, 2, 14, 30), T = function (n) { return t0 + n * D; }, f = [];
    var b = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 1, seit: T(5) + 3.6e6, kursT: T(5) }] };
    if (MH.bucheMassnahmen(b, { A: { div: [[T(5), 1]], split: [] } }, { A: T(5) }, T(5) + 4e6).buchungen.length !== 0) f.push('Ex-Tag = Kauftag gebucht');
    b = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 100, seit: T(0), kursT: T(0) }] };
    var E = { A: { div: [[T(2), 1], [T(4), 1]], split: [[T(3), 4, 1]] } };
    MH.bucheMassnahmen(b, E, { A: T(5) }, T(5));
    if (b.cash !== 80 || b.positionen[0].stueck !== 40 || b.positionen[0].einstand !== 25) f.push('Split+Dividende: cash ' + b.cash + ' stueck ' + b.positionen[0].stueck);
    if (MH.bucheMassnahmen(b, E, { A: T(6) }, T(6)).buchungen.length !== 0) f.push('Doppelbuchung');
    b = { cash: 100, positionen: [{ sym: 'A', stueck: 10, einstand: 100, richtung: -1, seit: T(0), kursT: T(0) }] };
    MH.bucheMassnahmen(b, { A: { div: [[T(2), 1]], split: [[T(3), 2, 1]] } }, { A: T(5) }, T(5));
    if (b.cash !== 80 || b.positionen[0].stueck !== 20 || b.positionen[0].einstand !== 50) f.push('Leerverkauf: cash ' + b.cash);
    b = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 1, seit: T(0), kursT: T(0) }] };
    if (MH.bucheMassnahmen(b, { A: { div: [[T(5), 1]], split: [] } }, { A: T(4) }, T(5)).buchungen.length !== 0) f.push('Ereignis nach barZeit gebucht');
    if (MH.bucheMassnahmen(b, { A: { div: [[T(5), 1]], split: [] } }, { A: T(5) }, T(5)).buchungen.length !== 1) f.push('behaltene Position: Ex-Tag nach 16:15 nicht gebucht');
    return { abweichung: f.length > 0, text: f.length ? 'beobachtet: ' + f.join('; ') : 'alle Grenzfaelle wie erwartet' };
  }
};
