'use strict';
/* Gegenprobe H-b2-nachfassen-zur-eroeffnung (Klasse A, KEINE Abweichung erwartet): Nachfassen zur Eroeffnung */
var H = require('../harness.js');
module.exports = {
  id: 'H-b2-nachfassen-zur-eroeffnung', klasse: 'A', ort: 'mfdepot.js:309-338 (offenNachfassen), mfhandel.js:777-812 (nachfassen)',
  titel: 'Gegenprobe b2: Nachfassen nach einem Teilausfall kauft zur Eroeffnung des Tages, nie zum laufenden Kurs',
  ausloeser: 'vier neu zu kaufende Ziele und ein zu verkaufender Wert ohne Antwort (HTTP 200 leer / 429) bis 11:00; Takte 09:35, 10:00, 11:05',
  erwartet: 'die spaeteren Kaeufe/Verkaeufe um 11:05 zur Eroeffnung des Montags (Klasse "Eroeffnung des Tages"), nie laufender Kurs',
  async lauf() {
    var w = H.baueWelt({}), r = H.rollenBestimmen(w, '2026-11-20'), leer = {}, dr = {};
    r.neu.slice(0, 4).concat(r.sold.slice(0, 1)).forEach(function (s, i) { if (i % 2) dr[s] = true; else leer[s] = true; });
    var k = await H.kurzLauf({ ausfall: [{ von: H.nz('2026-11-23', 9, 30), bis: H.nz('2026-11-23', 11, 0), art: 'leer', syms: leer }, { von: H.nz('2026-11-23', 9, 30), bis: H.nz('2026-11-23', 11, 0), art: '429', syms: dr }],
      takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 10, 0), H.nz('2026-11-23', 11, 5)] });
    var klassen = k.aus.kursKlassen, nur = Object.keys(klassen).length === 1 && /^Eroeffnung/.test(Object.keys(klassen)[0]);
    var spaet = k.ctx.tradeLog.filter(function (x) { return x.T === '2026-11-23 11:05'; }).length;
    var aw = !nur || spaet < 3 || k.abw.filter(function (a) { return a !== 'erhaltung' && a !== 'endbuch-positionen' && a !== 'endbuch-cash'; }).length > 0;
    return { abweichung: aw, text: 'beobachtet: Kurse ' + JSON.stringify(klassen) + ', Trades um 11:05: ' + spaet + '; erwartet: alle zur Eroeffnung des Tages, mindestens 3 Trades erst um 11:05 (die Stueckzahlen weichen vom Soll ab - siehe H-b2-budget-ohne-kurs)' };
  }
};
