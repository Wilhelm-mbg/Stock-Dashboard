'use strict';
/* Gegenprobe: nyZeit/nyTag ueber zwei Jahre, 8 Uhrzeiten je Tag, inkl. Sommer-/Winterzeitwechsel (08.03./01.11.2026, 14.03./07.11.2027), Stunde 24/00.
 * Einzige Ausnahme: die nicht existierende Ortszeit 02:30 am Tag des Vorstellens (01:30 statt 02:30) - kommt in der App nicht vor. */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
module.exports = {
  id: 'OK-02-nyzeit-sommerzeitwechsel', klasse: 'ok', ort: 'mfhandel.js:264 nyZeit, nyTeile', titel: 'New-Yorker Uhr stimmt an Zeitumstellungen',
  ausloeser: 'Gegenprobe', erwartet: 'nyZeit(tag,h,m) liegt wieder bei tag h:m New York, ausser bei nicht existierenden Ortszeiten.',
  async lauf() {
    var fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    var schlecht = [], n = 0;
    for (var d = Date.UTC(2026, 0, 1); d < Date.UTC(2028, 0, 1); d += 86400000) {
      var tag = new Date(d).toISOString().slice(0, 10);
      [[0, 0], [9, 35], [16, 0], [16, 15], [23, 59], [3, 0], [1, 59], [2, 30]].forEach(function (hm) {
        var t = MH.nyZeit(tag, hm[0], hm[1]), soll = tag + ', ' + ('0' + hm[0]).slice(-2) + ':' + ('0' + hm[1]).slice(-2);
        n++; if (fmt.format(new Date(t)) !== soll && !(hm[0] === 2 && hm[1] === 30 && (tag === '2026-03-08' || tag === '2027-03-14'))) schlecht.push(tag + ' ' + hm);
      });
    }
    var tagOk = MH.nyTag(Date.UTC(2026, 10, 23, 14, 30)) === '2026-11-23' && MH.nyTag(Date.UTC(2026, 7, 25, 13, 30)) === '2026-08-25';
    return { abweichung: schlecht.length > 0 || !tagOk, text: schlecht.length + ' Abweichungen bei ' + n + ' Pruefpunkten; nyTag fuer Stempel 14:30 UTC (Winter) und 13:30 UTC (Sommer) ' + (tagOk ? 'richtig' : 'falsch') };
  }
};
