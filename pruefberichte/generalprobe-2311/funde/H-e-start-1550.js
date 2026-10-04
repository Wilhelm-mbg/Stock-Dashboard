'use strict';
/* Gegenprobe H-e-start-1550 (Klasse A, KEINE Abweichung erwartet): Start 15:50 */
var H = require('../harness.js');
module.exports = {
  id: 'H-e-start-1550', klasse: 'A', ort: 'mfdepot.js:340-400 (takt), 278-300',
  titel: 'Gegenprobe e: App startet erst Mo 15:50 - Nachladen, dann Umschichtung zur Eroeffnung des Tages (nicht zum Kurs von 15:55)',
  ausloeser: 'erste Takte Mo 15:50 und 15:55 (5-Minuten-Raster), Bestand vom Donnerstag',
  erwartet: 'Umschichtung um 15:55 (der erste Takt nach dem Nachladen), zur Eroeffnung des Montags, Fr-Tagespunkt vor dem Handel',
  async lauf() {
    var k = await H.kurzLauf({ bereitT: H.nz('2026-11-19', 16, 20), takte: [H.nz('2026-11-23', 15, 50), H.nz('2026-11-23', 15, 55), H.nz('2026-11-23', 16, 0)] });
    var rebal = k.ctx.d.tuneLog.filter(function (z) { return /^mfrebal-/.test(z.id); });
    var zeiten = k.ctx.tradeLog.map(function (x) { return x.T; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var aw = k.abw.length > 0 || rebal.length !== 1 || zeiten.join('') !== '2026-11-23 15:55';
    return { abweichung: aw, text: 'beobachtet: Umschichtungen ' + rebal.length + ', Zeit(en) ' + zeiten.join('/') + ', Kurse ' + JSON.stringify(k.aus.kursKlassen) + ', Abweichungen gegen das Soll: ' + (k.abwText.join(' | ') || 'keine') + '; erwartet: eine Umschichtung um 15:55 zur Eroeffnung des Montags' };
  }
};
