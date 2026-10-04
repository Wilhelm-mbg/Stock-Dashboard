'use strict';
/* Fund H-d-reihenende-fuenf-tage (Klasse B; dokumentierte Abweichung, ihre Wirkung am Umschichtungstag ist es nicht):
 * Ein gehaltener Wert, dessen Reihe am Mi 18.11. endet, wird von der App erst nach FUENF Handelstagen ohne neuen Balken ausgebucht
 * (mfhandel.js REIHENENDE_TAGE = 5, Kommentar "BEWUSSTE ABWEICHUNG"). REGEL.md §1.4 bucht am ERSTEN Handelstag nach der letzten Zeile
 * (Do 19.11.) zum letzten Schluss aus; am Mo 23.11. waere das Geld Bargeld und der Platz frei. Die App hat am Mo 23.11. erst 3 Handelstage
 * (Do, Fr, Mo); sie haelt die Position (ohne Kurs: nicht verkauft, auch wenn sie nicht im Ziel steht) - 20 statt 19 Positionen, und ihr
 * Wert fehlt im Platzwert (siehe H-b2-budget-ohne-kurs). Das Geld liegt bis zur Ausbuchung (Mi 25.11.) und dann bis zur naechsten
 * Umschichtung (63 Handelstage) als Bargeld. */
var H = require('../harness.js');
module.exports = {
  id: 'H-d-reihenende-fuenf-tage', klasse: 'B', ort: 'mfhandel.js:426-447 (REIHENENDE_TAGE = 5) gegen REGEL.md §1.4',
  titel: 'Reihenende erst nach 5 Handelstagen: am Umschichtungstag bleibt eine tote Position, 20 statt 19 Positionen',
  ausloeser: 'gehaltener, nicht im Ziel stehender Wert mit letzter Kerze Mi 18.11.; Umschichtung Mo 23.11. 09:35',
  erwartet: 'REGEL §1.4: Position seit Do 19.11. ausgebucht (letzter Schluss, ohne Kosten); nach der Umschichtung 19 Positionen und der Platz belegt',
  async lauf() {
    var w = H.baueWelt({}), r0 = H.rollenBestimmen(w, '2026-11-20'), dead = r0.sold[0], e = {}; e[dead] = '2026-11-18';
    var k = await H.kurzLauf({ endeReihen: e, takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 16, 20), H.nz('2026-11-23', 16, 25)] });
    var gehalten = k.ctx.d.mfBuch.positionen.some(function (p) { return p.sym === dead; }), n = k.ctx.d.mfBuch.positionen.length;
    var ende = (k.ctx.d.mfBuch.trades || []).some(function (t) { return t.art === 'reihenende' && t.sym === dead; });
    return { abweichung: gehalten, text: 'beobachtet: ' + dead + ' (letzte Kerze 18.11.) am Mo 23.11. um 16:25 ' + (gehalten ? 'noch im Buch' : 'ausgebucht') + ', Positionen ' + n + ', Reihenende gebucht: ' + (ende ? 'ja' : 'nein') +
      '; erwartet (REGEL §1.4): ausgebucht seit Do 19.11., Positionen 19' };
  }
};
