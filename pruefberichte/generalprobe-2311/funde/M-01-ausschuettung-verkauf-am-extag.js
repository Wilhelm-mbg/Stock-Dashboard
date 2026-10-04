'use strict';
/* M-01: Ausschuettung geht verloren, wenn die Position am Ausfuehrungstag zur Eroeffnung verkauft wird und der Ex-Tag
 * dieser Tag ist. REGEL Teil C.3: "ein Verkauf zur Eroeffnung des Ex-Tags zaehlt noch" (rueckblick.js: Schritt 2 vor 3, Gutschrift
 * danach). Live: mittelfrist.js:81 schneidet den laufenden Balken (vor 16:15 New York) aus dem Bestand, barZeit endet am Vortag,
 * bucheMassnahmen (mfhandel.js:~640, "t <= barZeit") bucht nichts; die Umschichtung verkauft die Position; nach 16:15 liegt der Balken
 * des Ex-Tags im Bestand - aber bucheMassnahmen iteriert nur ueber Positionen, die noch im Buch stehen. Die Ausschuettung ist weg. */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
function ny(tag, h, m) { return MH.nyZeit(tag, h, m); }
module.exports = {
  id: 'M-01-ausschuettung-verkauf-am-extag', klasse: 'A', ort: 'mfhandel.js:607 bucheMassnahmen (iteriert nur ueber buch.positionen); Aufruf mfdepot.js:384 vor ausfuehrungVorbereiten (mfdepot.js:418)',
  titel: 'Ausschuettung mit Ex-Tag = Ausfuehrungstag geht verloren, wenn die Position am selben Tag verkauft wird',
  ausloeser: 'Ex-Tag einer gehaltenen Aktie ist der Ausfuehrungstag (Mo 23.11.), die Aktie steht nicht im neuen Ziel und wird zur Eroeffnung verkauft.',
  erwartet: 'Bargeld nach dem Tag = Verkaufserloes + stueck x Betrag (REGEL C.3: Verkauf zur Eroeffnung des Ex-Tags zaehlt noch).',
  async lauf() {
    var tag = '2026-11-23', vortag = '2026-11-20';
    var stV = ny(vortag, 9, 30), stD = ny(tag, 9, 30);               // Balkenstempel 09:30 New York (= 14:30 UTC im Winter)
    var buch = { cash: 0, positionen: [{ sym: 'AAA', stueck: 100, einstand: 50, seit: ny('2026-08-25', 9, 35), kursT: ny('2026-08-25', 9, 30) }], trades: [] };
    var ereignisse = { AAA: { div: [[stD, 1.5]], split: [] } };
    // Takt 1, 09:35 New York: der Bestand traegt den laufenden Balken von heute NICHT (ohneLaufendenBalken, mittelfrist.js:81)
    var reihe = [[stV, 50, 1e6, 50], [stD, 50, 1e6, 50]];
    var bestand = MH.ohneLaufendenBalken(reihe, ny(tag, 9, 35));
    var barZeit = { AAA: bestand[bestand.length - 1][0] };
    var r1 = MH.bucheMassnahmen(buch, ereignisse, barZeit, ny(tag, 9, 35));
    // Umschichtung: AAA nicht im Ziel -> verkauft zur Eroeffnung 50
    var plan = MH.planeUmschichtung(['BBB'], buch, { AAA: 50, BBB: 10 }, { kleinstAnteil: 0.05 });
    MH.fuehreAus(buch, plan, ny(tag, 9, 35), 20, { kleinstAnteil: 0.05 });
    // Takt 2, nach 16:15: Bestand enthaelt den Balken des Ex-Tags
    var bestand2 = MH.ohneLaufendenBalken(reihe, ny(tag, 16, 30));
    var r2 = MH.bucheMassnahmen(buch, ereignisse, { AAA: bestand2[bestand2.length - 1][0] }, ny(tag, 16, 30));
    var gebucht = (buch.massnahmen || []).filter(function (b) { return b.art === 'div'; }).length;
    var abw = r1.buchungen.length === 0 && r2.buchungen.length === 0 && gebucht === 0;
    return { abweichung: abw, text: 'beobachtet: Takt 09:35 bucht ' + r1.buchungen.length + ', Takt nach 16:15 bucht ' + r2.buchungen.length +
      ' Ausschuettungen (Bestand nach Verkauf: ' + buch.positionen.map(function (p) { return p.sym; }).join(',') + '); 100 x 1,50 $ = 150,00 $ fehlen. erwartet: 1 Buchung ueber 150,00 $ (Verkauf zur Eroeffnung des Ex-Tags zaehlt noch, REGEL C.3)' };
  }
};
