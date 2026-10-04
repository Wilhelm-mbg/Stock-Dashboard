'use strict';
/* M-03: Reihenende nach FUENF Handelstagen (REIHENENDE_TAGE) statt am ersten Handelstag ohne Zeile (REGEL §1.4, Teil C.5; rueckblick.js
 * Schritt 1 laeuft VOR der Umschichtung desselben Tages). mfhandel.js nennt die Abweichung "bewusst" und sagt, der Preis sei derselbe - der Preis
 * ist derselbe, aber endet die Reihe in den fuenf Handelstagen VOR einer Umschichtung (Uebernahme, Delisting am Freitag 20.11.), fehlt dem Plan
 * am Montag das Geld: die Position steht ohne Kurs als "gehalten" im Buch (nicht im Depotwert), ihr Wert liegt bis zur Ausbuchung (5 Tage) und danach
 * bis zur naechsten Umschichtung (63 Handelstage) als Bargeld brach. Die Messung haette es am Montag vor dem Handel angelegt. */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
function ny(tag, h, m) { return MH.nyZeit(tag, h, m); }
module.exports = {
  id: 'M-03-reihenende-vor-umschichtung', klasse: 'B', ort: 'mfhandel.js:426-427 reihenendeAusbuchen (REIHENENDE_TAGE = 5) i.V.m. :118 planeUmschichtung (Position ohne Kurs: gehalten, nicht im Depotwert)',
  titel: 'Reihe endet kurz vor dem Ausfuehrungstag: Wert der Position wird bei der Umschichtung nicht angelegt (Messung bucht am ersten Tag aus und legt an)',
  ausloeser: 'Eine gehaltene Aktie hat ihren letzten Handelstag in den 5 Handelstagen vor der Umschichtung (z. B. Uebernahme, letzter Handelstag Fr 20.11.).',
  erwartet: 'Wie rueckblick.js: Position vor dem Handel zum letzten Schluss ausgebucht, Gutschrift im Depotwert, Neukauf mit vollem Budget (depotwert/zielzahl).',
  async lauf() {
    var tage = ['2026-11-13', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'];
    function ser(p) { return tage.map(function (d) { return [ny(d, 9, 30), p, 1e6, p]; }); }
    var spy = ser(400), roh = { GONE: ser(100), A: ser(100) };
    function neuesBuch() { return { cash: 0, positionen: [{ sym: 'A', stueck: 200, einstand: 100, seit: 1 }, { sym: 'GONE', stueck: 200, einstand: 100, seit: 1 }], trades: [] }; }
    var jetzt = ny('2026-11-23', 9, 35), ziel = ['A', 'NEU'], preise = { A: 100, NEU: 50 };   // GONE hat am 23.11. keine Eroeffnung
    // Live: Takt ruft reihenendeAusbuchen (vor dem Plan), dann Plan und Ausfuehrung
    var live = neuesBuch();
    var aus = MH.reihenendeAusbuchen(live, roh, spy, jetzt);
    var pl = MH.planeUmschichtung(ziel, live, preise, { kleinstAnteil: 0.05 });
    MH.fuehreAus(live, pl, jetzt, 20, { kleinstAnteil: 0.05 });
    var neuLive = (live.positionen.filter(function (p) { return p.sym === 'NEU'; })[0] || { stueck: 0 }).stueck;
    // Messung: Reihenende am ersten Handelstag ohne Zeile, vor dem Handel, ohne Kosten
    var mes = neuesBuch(); mes.cash += 200 * 100; mes.positionen.splice(1, 1);
    var pm = MH.planeUmschichtung(ziel, mes, preise);
    MH.fuehreAus(mes, pm, jetzt, 20);
    var neuMes = (mes.positionen.filter(function (p) { return p.sym === 'NEU'; })[0] || { stueck: 0 }).stueck;
    return { abweichung: Math.abs(neuLive - neuMes) > 0.01 * neuMes || live.positionen.some(function (p) { return p.sym === 'GONE'; }),
      text: 'beobachtet: ausgebucht ' + aus.length + ' (GONE bleibt im Buch, fehltKurs=' + pl.fehltKurs.join(',') + '), Depotwert im Plan ' + pl.depotwert + ' $, NEU gekauft ' + neuLive + ' Stueck. erwartet (Messung): Depotwert ' +
        pm.depotwert + ' $, NEU ' + neuMes + ' Stueck (Budget ' + (pm.depotwert / 2) + ' $ je Platz statt ' + (pl.depotwert / 2) + ' $)' };
  }
};
