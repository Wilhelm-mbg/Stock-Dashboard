'use strict';
/* M-04 (C): nachfassen rechnet die Stueckzahl eines spaeten Kaufs mit Math.floor (4 Stellen), planeUmschichtung - und damit die Messung -
 * mit Math.round. Bis zu 0,0001 Stueck Unterschied je spaetem Kauf (Groessenordnung Cent). Nur Schoenheit. */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
module.exports = {
  id: 'M-04-nachfassen-abrunden', klasse: 'C', ort: 'mfhandel.js:777 nachfassen (Math.floor) gegen :118 planeUmschichtung (Math.round)',
  titel: 'Spaete Kaeufe (nachfassen) werden abgerundet, die Umschichtung und die Messung runden',
  ausloeser: 'Ein Ziel hat um 09:35 keine Eroeffnung und wird per nachfassen gekauft; budget/kurs hat in der 5. Nachkommastelle >= 5.',
  erwartet: 'Dieselbe Stueckzahl wie planeUmschichtung (Math.round auf vier Stellen).',
  async lauf() {
    var kurs = 6, budget = 10000;
    var plan = MH.planeUmschichtung(['X'], { cash: budget, positionen: [] }, { X: kurs });
    var b = { cash: budget, positionen: [], trades: [], offen: { tag: '2026-11-23', verkaeufe: [], kaeufe: [{ sym: 'X', budget: budget, rang: 1 }] } };
    MH.nachfassen(b, { X: kurs }, { X: 1 }, 1, 0);
    var nach = b.positionen[0] ? b.positionen[0].stueck : 0, norm = plan.kaufen[0].stueck;
    return { abweichung: nach !== norm, text: 'beobachtet: nachfassen ' + nach + ' Stueck; erwartet (Plan/Messung, round) ' + norm + ' Stueck' };
  }
};
