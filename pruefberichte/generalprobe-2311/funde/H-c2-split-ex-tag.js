'use strict';
/* Fund H-c2-split-ex-tag (Klasse A): Split mit Ex-Tag = Ausfuehrungstag in einer GEHALTENEN Position.
 * Yahoo meldet am Montag ab 09:30 die Eroeffnung schon in neuer Stueckelung (2:1: halber Kurs). Der Bestand der App ist vom Freitag
 * (Splits mit Ex-Tag Montag sind in ihm nicht enthalten, die Stueckzahl im Buch ist die alte). mfdepot.js ausfuehrungVorbereiten holt die
 * Eroeffnung des Montags (eroeffnung(), Z. ~263) und rechnet sie gegen die Stueckzahl OHNE Split (planeUmschichtung/fuehreAus, Z. 422-423);
 * bucheMassnahmen bucht den Split erst nach dem naechsten Laden (Montag 16:20) - zu spaet fuer die Umschichtung.
 *   - ein VERKAUFTER Wert bringt nur den halben Erloes (alte Stueckzahl x halber Kurs);
 *   - ein BLEIBENDER Wert geht mit dem halben Wert in den Depotwert, damit sinkt der Platzwert (Depotwert / Zielzahl) aller Kaeufe. */
var H = require('../harness.js');
module.exports = {
  id: 'H-c2-split-ex-tag', klasse: 'A', ort: 'mfdepot.js:278-300 (ausfuehrungVorbereiten/eroeffnung), 413-423 (plane/fuehreAus), mfhandel.js:607 (bucheMassnahmen laeuft nur auf gespeicherten Balken)',
  titel: 'Split 2:1 mit Ex-Tag am Ausfuehrungstag: Verkauf zur neuen (halben) Eroeffnung mit der alten Stueckzahl',
  ausloeser: 'ein gehaltener, nicht im Ziel stehender Wert hat am Mo 23.11. Ex-Tag eines 2:1-Splits; Takt 09:35 NY, Bestand vom Freitag',
  erwartet: 'Erloes = 2 x alte Stueckzahl x halbe Eroeffnung x (1 - 0,002), also der Wert der Position vor dem Split',
  async lauf() {
    var ctx = await H.lauf({ kurz: true, bereitT: H.nz('2026-11-20', 16, 20), takte: [H.nz('2026-11-23', 9, 35)],
      ereignisFn: function (r) { var e = {}; e[r.sold[0]] = { splits: [{ tag: '2026-11-23', z: 2, n: 1 }] }; return e; } });
    var sym = ctx.rollen.sold[0], p0 = ctx.buch0.positionen.filter(function (p) { return p.sym === sym; })[0];
    var tr = ctx.d.mfBuch.trades.filter(function (t) { return t.sym === sym && t.art === 'verkauf'; })[0];
    if (!tr) return { abweichung: true, text: 'beobachtet: ' + sym + ' wurde nicht verkauft; erwartet: Verkauf zur Eroeffnung' };
    var erloesApp = tr.stueck * tr.kurs * 0.998, erloesSoll = p0.stueck * 2 * tr.kurs * 0.998;
    var aw = erloesApp < 0.9 * erloesSoll;
    return { abweichung: aw, text: 'beobachtet: ' + sym + ' verkauft mit ' + tr.stueck + ' Stueck (Buch: alte Stueckzahl, Position hatte ' + p0.stueck + ') zu ' + tr.kurs + ' (Eroeffnung nach Split) = Erloes ' +
      Math.round(erloesApp * 100) / 100 + ' $; erwartet: ' + p0.stueck * 2 + ' Stueck zu ' + tr.kurs + ' = Erloes ' + Math.round(erloesSoll * 100) / 100 + ' $ (Verlust ' + Math.round((erloesSoll - erloesApp) * 100) / 100 + ' $ = ' +
      Math.round((1 - erloesApp / erloesSoll) * 100) + ' % der Position)' };
  }
};
