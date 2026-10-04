'use strict';
/* M-02: Split mit Ex-Tag = Ausfuehrungstag. Der Plan rechnet die Eroeffnung des Tages (roh, nach dem Split: eroeffnung() in mfdepot.js,
 * bereinigt:false) gegen die noch UNGESPLITTETE Stueckzahl: der Split steht erst nach 16:15 im Bestand (laufender Balken ist abgeschnitten,
 * mittelfrist.js:81) und wird erst dann gebucht (bucheMassnahmen: t <= barZeit). In der Messung (Panel, bereinigt) gibt es das Problem nicht:
 * Stueckzahl x bereinigter Kurs ist ueber den Split konstant. */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
module.exports = {
  id: 'M-02-split-am-ausfuehrungstag', klasse: 'A', ort: 'mfhandel.js:118 planeUmschichtung / :159 fuehreAus (Stueck ungesplittet x Eroeffnung nach Split); mfdepot.js:263 eroeffnung (bereinigt:false)',
  titel: 'Split-Ex-Tag = Ausfuehrungstag: gehaltene Position wird zu 1/Faktor ihres Werts verkauft bzw. der Depotwert zu niedrig angesetzt',
  ausloeser: 'Gehaltene Aktie hat am 23.11. Ex-Tag eines 4:1-Splits (Eroeffnung 25 $ statt 100 $), steht nicht im neuen Ziel (oder im Ziel: Depotwert/Budget falsch).',
  erwartet: 'Erloes = 100 Stueck x 4 x 25 $ = 10.000 $ (abzgl. 20 Bp); der Plan kennt den Split am Ausfuehrungstag.',
  async lauf() {
    var buch = { cash: 0, positionen: [{ sym: 'SPL', stueck: 100, einstand: 100, seit: 1, kursT: 1 }], trades: [] };
    var ziel = ['AAA'];
    var plan = MH.planeUmschichtung(ziel, buch, { SPL: 25, AAA: 10 }, { kleinstAnteil: 0.05 });
    MH.fuehreAus(buch, plan, 2, 20, { kleinstAnteil: 0.05 });
    var verkauf = buch.trades.filter(function (t) { return t.art === 'verkauf'; })[0];
    var erloes = verkauf ? verkauf.stueck * verkauf.kurs * (1 - 0.002) : 0;
    var soll = 400 * 25 * (1 - 0.002);
    // Fall im Ziel: Depotwert (Budget) im Plan
    var b2 = { cash: 0, positionen: [{ sym: 'SPL', stueck: 100, einstand: 100, seit: 1, kursT: 1 }, { sym: 'XXX', stueck: 100, einstand: 100, seit: 1, kursT: 1 }], trades: [] };
    var p2 = MH.planeUmschichtung(['SPL', 'XXX'], b2, { SPL: 25, XXX: 100 }, { kleinstAnteil: 0.05 });
    var wahrerDepot = 400 * 25 + 100 * 100;
    return { abweichung: erloes < soll * 0.99 || p2.depotwert < wahrerDepot * 0.99,
      text: 'beobachtet: Verkauf von 100 SPL zu 25 $ bringt ' + erloes.toFixed(2) + ' $; Plan-Depotwert (Split-Position im Ziel) ' + p2.depotwert.toFixed(2) + ' $. erwartet: ' +
        soll.toFixed(2) + ' $ Erloes bzw. Depotwert ' + wahrerDepot.toFixed(2) + ' $ (Fehlbetrag ' + (soll - erloes).toFixed(2) + ' $ bzw. ' + (wahrerDepot - p2.depotwert).toFixed(2) + ' $)' };
  }
};
