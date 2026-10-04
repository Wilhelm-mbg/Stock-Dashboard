'use strict';
/* Gegenprobe H-f-feiertag-montag (Klasse A, KEINE Abweichung erwartet): Feiertag */
var H = require('../harness.js');
module.exports = {
  id: 'H-f-feiertag-montag', klasse: 'A', ort: 'mfdepot.js:282-291 (kein Balken von SPY = kein Handelstag), mfhandel.js:329-348',
  titel: 'Gegenprobe f: Mo 23.11. Feiertag - Montag nichts, Dienstag 09:35 umgeschichtet mit Stichtag Freitag',
  ausloeser: 'SPY ohne Balken am Mo 23.11.; Takte Mo 09:35, 12:00, 16:20, Di 09:35',
  erwartet: 'keine Trades am Montag, genau eine Umschichtung Di 09:35 zur Eroeffnung des Dienstags, Stichtag Fr 20.11.',
  async lauf() {
    var k = await H.kurzLauf({ feiertage: ['2026-11-23'], takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 12, 0), H.nz('2026-11-23', 16, 20), H.nz('2026-11-24', 9, 35)] });
    var rebal = k.ctx.d.tuneLog.filter(function (z) { return /^mfrebal-/.test(z.id); });
    var zeiten = k.ctx.tradeLog.map(function (x) { return x.T; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var aw = k.abw.length > 0 || rebal.length !== 1 || zeiten.join('') !== '2026-11-24 09:35' || !/Stichtags 20\.11\.2026/.test(rebal[0].txt);
    return { abweichung: aw, text: 'beobachtet: Umschichtungen ' + rebal.length + ', Trade-Zeiten ' + zeiten.join('/') + ', Abweichungen: ' + (k.abwText.join(' | ') || 'keine') + '; erwartet: eine Umschichtung Di 24.11. 09:35, Stichtag 20.11.' };
  }
};
