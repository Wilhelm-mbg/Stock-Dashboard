'use strict';
/* Gegenprobe H-g1-uhr-zurueck (Klasse A, KEINE Abweichung erwartet): Uhr zurueck */
var H = require('../harness.js');
module.exports = {
  id: 'H-g1-uhr-zurueck', klasse: 'A', ort: 'mfdepot.js:236-258, 340-400',
  titel: 'Gegenprobe g1: Systemuhr wird um -30 min korrigiert (nach und vor der Umschichtung) - keine Doppelausfuehrung, kein Fehler',
  ausloeser: 'Uhr um 09:50 NY -30 min; Takte 09:35 (Umschichtung), 09:55, 10:05, 10:25, 16:50 (Uhr 16:20)',
  erwartet: 'genau eine Umschichtung, keine zweite nach dem Rueckwaertssprung, Tagespunkt Montag zu den Schlusskursen',
  async lauf() {
    var k = await H.kurzLauf({ uhrSprung: [{ ab: H.nz('2026-11-23', 9, 50), offset: -H.minuten(30) }], takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 9, 55), H.nz('2026-11-23', 10, 5), H.nz('2026-11-23', 10, 25), H.nz('2026-11-23', 16, 50), H.nz('2026-11-23', 16, 55)] });
    var rebal = k.ctx.d.tuneLog.filter(function (z) { return /^mfrebal-/.test(z.id); });
    var zeiten = k.ctx.tradeLog.map(function (x) { return x.T; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var aw = k.abw.length > 0 || rebal.length !== 1 || k.ctx.tradeLog.length !== 18;
    return { abweichung: aw, text: 'beobachtet: Umschichtungen ' + rebal.length + ', Zeit(en) ' + zeiten.join('/') + ', Kurse ' + JSON.stringify(k.aus.kursKlassen) + ', Abweichungen gegen das Soll: ' + (k.abwText.join(' | ') || 'keine') + '; erwartet: eine Umschichtung um 09:35 mit 18 Trades, nichts danach' };
  }
};
