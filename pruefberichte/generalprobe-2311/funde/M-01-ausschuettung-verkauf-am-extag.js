'use strict';
/* M-01: Ausschuettung geht verloren, wenn die Position am Ausfuehrungstag zur Eroeffnung verkauft wird und der Ex-Tag
 * dieser Tag ist. REGEL Teil C.3: "ein Verkauf zur Eroeffnung des Ex-Tags zaehlt noch" (rueckblick.js: Schritt 2 vor 3, Gutschrift
 * danach). Live: mittelfrist.js:81 schneidet den laufenden Balken (vor 16:15 New York) aus dem Bestand, barZeit endet am Vortag,
 * bucheMassnahmen (mfhandel.js:~640, "t <= barZeit") bucht nichts; die Umschichtung verkauft die Position; nach 16:15 liegt der Balken
 * des Ex-Tags im Bestand - aber bucheMassnahmen iteriert nur ueber Positionen, die noch im Buch stehen. Die Ausschuettung ist weg.
 * Angepasst (Fix Generalprobe): der Test stellt jetzt die Reihenfolge des behobenen Takts nach - vor dem Plan die Splits des Tages
 * (MH.splitsAmAusfuehrungstag, bucht keine Ausschuettung), nach fuehreAus MH.anspruecheVormerken mit den Stempeln aus dem Abruf der
 * Eroeffnung, abends bucheMassnahmen. Fehlt die Hilfe (Stand vor der Behebung), bleibt es beim alten Ablauf - rot. Zugesichert wird
 * zusaetzlich: vor dem Handel kein Geld (Gutschrift NACH dem Handel, C.3), genau eine Buchung ueber 150 $, ein zweiter Takt bucht nichts,
 * der Anspruch ist danach erledigt. */
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
    var hilfe = typeof MH.anspruecheVormerken === 'function';
    // Takt 1, 09:35 New York: der Bestand traegt den laufenden Balken von heute NICHT (ohneLaufendenBalken, mittelfrist.js:81)
    var reihe = [[stV, 50, 1e6, 50], [stD, 50, 1e6, 50]];
    var bestand = MH.ohneLaufendenBalken(reihe, ny(tag, 9, 35));
    var barZeit = { AAA: bestand[bestand.length - 1][0] };
    var r1 = MH.bucheMassnahmen(buch, ereignisse, barZeit, ny(tag, 9, 35));
    // Umschichtung zur Eroeffnung (Abruf der Eroeffnung: Stempel des Balkens von heute, dieselben Ereignisse)
    var eroeffnungT = { AAA: stD, BBB: stD };
    if (typeof MH.splitsAmAusfuehrungstag === 'function') MH.splitsAmAusfuehrungstag(buch, ereignisse, eroeffnungT, ny(tag, 9, 35));
    var cashVorHandel = buch.cash;                                    // Soll 0: die Ausschuettung kommt erst nach dem Handel
    var vorher = buch.positionen.slice();
    // AAA nicht im Ziel -> verkauft zur Eroeffnung 50
    var plan = MH.planeUmschichtung(['BBB'], buch, { AAA: 50, BBB: 10 }, { kleinstAnteil: 0.05 });
    MH.fuehreAus(buch, plan, ny(tag, 9, 35), 20, { kleinstAnteil: 0.05 });
    if (hilfe) MH.anspruecheVormerken(buch, vorher, eroeffnungT, ny(tag, 9, 35));
    var cash1 = buch.cash;
    // Takt 2, nach 16:15: Bestand enthaelt den Balken des Ex-Tags
    var bestand2 = MH.ohneLaufendenBalken(reihe, ny(tag, 16, 30));
    var bz2 = { AAA: bestand2[bestand2.length - 1][0] };
    var r2 = MH.bucheMassnahmen(buch, ereignisse, bz2, ny(tag, 16, 30));
    var r3 = MH.bucheMassnahmen(buch, ereignisse, bz2, ny(tag, 16, 35));   // zweiter Takt: nichts mehr
    var divs = (buch.massnahmen || []).filter(function (b) { return b.art === 'div'; });
    var summe = divs.reduce(function (a, b) { return a + b.summe; }, 0);
    var ok = r1.buchungen.length === 0 && cashVorHandel === 0 && divs.length === 1 && Math.abs(summe - 150) < 1e-9 &&
      Math.abs(buch.cash - cash1 - 150) < 1e-9 && r3.buchungen.length === 0 && !buch.ansprueche;
    return { abweichung: !ok, text: 'beobachtet: Takt 09:35 bucht ' + r1.buchungen.length + ' (Bargeld vor dem Handel ' + cashVorHandel.toFixed(2) + ' $), Takt nach 16:15 bucht ' +
      r2.buchungen.length + ' Ausschuettung(en) ueber ' + summe.toFixed(2) + ' $, ein weiterer Takt ' + r3.buchungen.length + ' (Bestand nach Verkauf: ' +
      buch.positionen.map(function (p) { return p.sym; }).join(',') + '; offene Ansprueche: ' + ((buch.ansprueche || []).length) + (hilfe ? '' : '; keine Hilfe anspruecheVormerken') +
      '). erwartet: 0 vor dem Handel, danach 1 Buchung ueber 150,00 $ (100 x 1,50 $; Verkauf zur Eroeffnung des Ex-Tags zaehlt noch, REGEL C.3), keine zweite' };
  }
};
