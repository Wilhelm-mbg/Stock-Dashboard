'use strict';
/* M-05 (C): plan.kleinst enthaelt JEDEN Bestand unter der Schwelle - auch einen, der ohnehin verkauft wuerde (nicht im Ziel). Die Journalzeile
 * (mfdepot.js: "n Kleinstbestaende aufgeloest") zaehlt ihn als Regel-K2-Fall; ohne Regel K waere er genauso verkauft worden. Nur Text. */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
module.exports = {
  id: 'M-05-kleinst-zaehlung-text', klasse: 'C', ort: 'mfhandel.js:118 planeUmschichtung (kleinst.push vor der Zielpruefung)',
  titel: 'Journal zaehlt einen ohnehin zu verkaufenden kleinen Bestand als "Kleinstbestand aufgeloest"',
  ausloeser: 'Ein Bestand unter 5 % des Platzwerts steht nicht im neuen Ziel.',
  erwartet: 'plan.kleinst nur fuer Bestaende, die OHNE Regel K gehalten wuerden (Ziel-Mitglieder).',
  async lauf() {
    var buch = { cash: 0, positionen: [{ sym: 'AAA', stueck: 100, einstand: 1, seit: 1 }, { sym: 'ALT', stueck: 0.01, einstand: 1, seit: 1 }] };
    var plan = MH.planeUmschichtung(['AAA'], buch, { AAA: 100, ALT: 100 }, { kleinstAnteil: 0.05 });
    return { abweichung: plan.kleinst.indexOf('ALT') >= 0, text: 'beobachtet: plan.kleinst = [' + plan.kleinst.join(',') + '] (ALT ist nicht im Ziel); erwartet: []' };
  }
};
