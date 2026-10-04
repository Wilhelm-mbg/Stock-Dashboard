'use strict';
/* Gegenprobe: Faelligkeit nach Handelstagen. Letzter Ausfuehrungstag 25.08.2026, SPY-Kalender ohne Labor Day (07.09.) und Thanksgiving (26.11.):
 * zwischen 25.08. und Mo 23.11. liegen 62 Balken, der 23.11. ist der 63. Handelstag danach (rueckblick.js: naechste = Q.ptage[o + halten]) -> faellig
 * am Montag 23.11. um 09:35, NICHT am Freitag 20.11.; auch dann faellig, wenn der Balken von Montag noch fehlt (nach 16:15, vor Laden). */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
module.exports = {
  id: 'OK-01-faelligkeit-2311', klasse: 'ok', ort: 'mfhandel.js:329 faelligkeit', titel: 'Faelligkeit: 23.11. ist der 63. Handelstag nach dem 25.08. (kein off-by-one)',
  ausloeser: 'Gegenprobe', erwartet: 'Fr 20.11. nicht faellig (61 Balken dazwischen), Mo 23.11. faellig (62).',
  async lauf() {
    var hol = { '2026-09-07': 1, '2026-11-26': 1 }, tage = [];
    for (var t = Date.UTC(2026, 7, 3); t < Date.UTC(2026, 11, 31); t += 86400000) { var g = new Date(t).getUTCDay(), tag = new Date(t).toISOString().slice(0, 10); if (g && g < 6 && !hol[tag]) tage.push(tag); }
    function spy(bis) { return tage.filter(function (d) { return d <= bis; }).map(function (d) { return [MH.nyZeit(d, 9, 30), 400, 1e6, 400]; }); }
    var fr = MH.faelligkeit(spy('2026-11-19'), '2026-08-25', 63, MH.nyZeit('2026-11-20', 9, 35));
    var mo = MH.faelligkeit(spy('2026-11-20'), '2026-08-25', 63, MH.nyZeit('2026-11-23', 9, 35));
    var spaet = MH.faelligkeit(spy('2026-11-20'), '2026-08-25', 63, MH.nyZeit('2026-11-23', 16, 30));
    var ok = fr.faellig === false && fr.tageSeit === 61 && mo.faellig === true && mo.tageSeit === 62 && spaet.faellig === true;
    return { abweichung: !ok, text: 'Fr 20.11.: faellig=' + fr.faellig + ' (' + fr.tageSeit + '), Mo 23.11.: faellig=' + mo.faellig + ' (' + mo.tageSeit + '), Mo 16:30 ohne Montagsbalken: ' + spaet.faellig + '; erwartet false/61, true/62, true' };
  }
};
