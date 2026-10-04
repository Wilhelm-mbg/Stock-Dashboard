'use strict';
/* Gegenprobe H-g-dst-uhr (Klasse A, KEINE Abweichung erwartet): Zeitumstellung */
var H = require('../harness.js');
module.exports = {
  id: 'H-g-dst-uhr', klasse: 'A', ort: 'mfhandel.js:240-296 (nyTeile, nyZeit, letzterFertigerWerktag, bestandFrisch)',
  titel: 'Gegenprobe g: nyTag/nyUhr/nyZeit/letzterFertigerWerktag/bestandFrisch ueber die Zeitumstellungen 08.03.2026, 01.11.2026, 14.03.2027 gegen eine unabhaengige Regelrechnung',
  ausloeser: 'Raster alle 5 Minuten +-6 h um je 8 Tage der drei Wechsel, dazu die Woche um den 07.03.2027 (dort KEIN Wechsel)',
  erwartet: 'keine Abweichung gegen die US-Regel (zweiter Sonntag Maerz / erster Sonntag November, 02:00 Ortszeit)',
  async lauf() {
    var r = H.dstPruefung();
    return { abweichung: r.abweichungen.length > 0, text: 'beobachtet: ' + r.abweichungen.length + ' Abweichungen in ' + r.anzahlMinutenraster + ' Rasterpunkten, ' + r.anzahlNyZeit + ' nyZeit-Faellen, ' + r.anzahlFrisch + ' bestandFrisch-Faellen' +
      (r.abweichungen.length ? ': ' + JSON.stringify(r.abweichungen[0]) : '') + '; erwartet: 0 (Hinweis: der Wechsel 2027 ist am 14.03., nicht am 07.03.)' };
  }
};
