'use strict';
/* Gegenprobe H-a-normal-genau-einmal (Klasse A, KEINE Abweichung erwartet): normaler Tag */
var H = require('../harness.js');
module.exports = {
  id: 'H-a-normal-genau-einmal', klasse: 'A', ort: 'mfdepot.js:278-300, 413-439',
  titel: 'Gegenprobe a: normaler Tag - genau eine Umschichtung zur Eroeffnung, Ziel/Stueck/Bargeld gleich dem Soll',
  ausloeser: 'Takte Mo 23.11. 09:30-09:45 und 16:20/16:25, alle Kurse da',
  erwartet: '1 Eintrag mfrebal-*, 18 Trades zur Eroeffnung, Positionen und Bargeld gleich dem Soll aus MFHandel und von Hand',
  async lauf() {
    var k = await H.kurzLauf({ takte: [H.nz('2026-11-23', 9, 30), H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 9, 40), H.nz('2026-11-23', 9, 45), H.nz('2026-11-23', 16, 20), H.nz('2026-11-23', 16, 25)] });
    var rebal = k.ctx.d.tuneLog.filter(function (z) { return /^mfrebal-/.test(z.id); });
    var zeiten = k.ctx.tradeLog.map(function (x) { return x.T; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var aw = k.abw.length > 0 || rebal.length !== 1 || k.ctx.tradeLog.length !== 18;
    return { abweichung: aw, text: 'beobachtet: Umschichtungen ' + rebal.length + ', Zeit(en) ' + zeiten.join('/') + ', Kurse ' + JSON.stringify(k.aus.kursKlassen) + ', Abweichungen gegen das Soll: ' + (k.abwText.join(' | ') || 'keine') + '; erwartet: 1 Umschichtung um 09:35, 18 Trades, keine Abweichung' };
  }
};
