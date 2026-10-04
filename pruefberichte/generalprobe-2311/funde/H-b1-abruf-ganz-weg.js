'use strict';
/* Gegenprobe H-b1-abruf-ganz-weg (Klasse A, KEINE Abweichung erwartet): Totalausfall am Vormittag */
var H = require('../harness.js');
module.exports = {
  id: 'H-b1-abruf-ganz-weg', klasse: 'A', ort: 'mfdepot.js:290-291 (SPY-Probe), mittelfrist.js ladenAnnehmen',
  titel: 'Gegenprobe b1: Kursabruf Montag 08:00-12:00 komplett weg - kein Handel bis zur Rueckkehr, dann Eroeffnung des Montags',
  ausloeser: 'alle Abrufe liefern null von 08:00 bis 12:00 NY; Takte 09:35, 11:55, 12:00, 12:05',
  erwartet: 'erst ab 12:00 umgeschichtet, zur Eroeffnung des Tages (nicht zum Kurs von 12:00), genau einmal',
  async lauf() {
    var k = await H.kurzLauf({ ausfall: [{ von: H.nz('2026-11-23', 8, 0), bis: H.nz('2026-11-23', 12, 0), art: 'null', syms: null }], takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 11, 55), H.nz('2026-11-23', 12, 0), H.nz('2026-11-23', 12, 5)] });
    var rebal = k.ctx.d.tuneLog.filter(function (z) { return /^mfrebal-/.test(z.id); });
    var zeiten = k.ctx.tradeLog.map(function (x) { return x.T; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var aw = k.abw.length > 0 || rebal.length !== 1 || zeiten.join('') !== '2026-11-23 12:00';
    return { abweichung: aw, text: 'beobachtet: Umschichtungen ' + rebal.length + ', Zeit(en) ' + zeiten.join('/') + ', Kurse ' + JSON.stringify(k.aus.kursKlassen) + ', Abweichungen gegen das Soll: ' + (k.abwText.join(' | ') || 'keine') + '; erwartet: keine Umschichtung vor 12:00, eine um 12:00 zur Eroeffnung' };
  }
};
