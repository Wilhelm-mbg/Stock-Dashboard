'use strict';
/* Fund H-b2-budget-ohne-kurs (Klasse A): der Platzwert (Depotwert / Zielzahl) zaehlt eine gehaltene Position OHNE Eroeffnungskurs mit 0.
 * mfhandel.js planeUmschichtung (Z. 123-127): wert += stueck * k nur fuer k > 0. Fehlt am Ausfuehrungstag fuer einige gehaltene Werte
 * voruebergehend die Eroeffnung (Teilausfall der Quelle, Drosselung, spaeter Handelsbeginn, Wert ohne neue Balken), sinkt der
 * Depotwert um deren Wert, und JEDER Kauf dieses Tages bekommt ein zu kleines Budget. Die Umschichtung laeuft mit diesem Budget (Nr. 94:
 * offen.kaeufe[].budget traegt es in die spaeteren Takte weiter). Ergebnis: das Geld bleibt als Bargeld liegen, bis zur naechsten
 * Umschichtung 63 Handelstage spaeter. REGEL.md §1.3 nennt "Position ohne Kurs gehalten", sagt aber nichts davon, dass ihr Wert aus dem
 * Depotwert faellt; die Messung (rueckblick.js, Panel) hat an jedem Tag fuer jeden Wert eine Eroeffnung.
 * Angepasst (Fix Generalprobe): Teil 1 (Kleinstaufbau gegen die reine Funktion planeUmschichtung, Soll "A zum letzten Schluss
 * gezaehlt") ist herausgenommen. REGEL.md §1.3: "ein Wert ohne Kurs an diesem Tag wird behandelt, wie planeUmschichtung es tut"; die
 * Messung ruft genau diese Funktion mit den Eroeffnungen des Ausfuehrungstags (rueckblick.js Z. 194-198) und zaehlt einen Wert ohne
 * Zeile dort ebenfalls 0. Die Funktion ist die gemessene Regel und bleibt byte-gleich. Der Fehler sitzt live: die App plante, bevor
 * sie die Eroeffnung eines handelnden Werts hatte. Das prueft Teil 2 (ganz durch die App) - er bleibt der Test. */
var H = require('../harness.js');
module.exports = {
  id: 'H-b2-budget-ohne-kurs', klasse: 'A', ort: 'mfhandel.js:123-130 (planeUmschichtung), mfdepot.js:413-423, mfhandel.js:744-755 (offeneAuftraege/budget)',
  titel: 'Depotwert/Platzwert der Umschichtung ohne die gehaltenen Positionen, fuer die die Eroeffnung fehlt: Kaeufe zu klein, Bargeld bleibt liegen',
  ausloeser: 'Teilausfall der Kursquelle am Ausfuehrungstag (b2) oder eine gehaltene Reihe ohne Balken (d, d2): gehaltene Position ohne Eroeffnungskurs',
  erwartet: 'Kaeufe so gross wie bei vollstaendigen Kursen, Bargeld wie bei vollstaendigen Kursen (die Eroeffnung eines handelnden Werts kommt noch am Tag)',
  async lauf() {
    /* ganz durch die App: b2 im Kleinen - zwei gehaltene bleibende Werte ohne Eroeffnung bis 11:00, Takte 09:35 und 11:05 */
    var ctx = await H.lauf({ kurz: true, bereitT: H.nz('2026-11-20', 16, 20), takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 11, 5)],
      ereignisFn: function () { return {}; } });
    /* der Ausfall braucht die Rollen: zweiter Lauf mit Ausfall der zwei bleibenden Werte (Rollen sind ohne Ausfall dieselben) */
    var r = ctx.rollen, syms = {}; syms[r.kept[0]] = true; syms[r.kept[1]] = true;
    var ctx2 = await H.lauf({ kurz: true, bereitT: H.nz('2026-11-20', 16, 20), takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 11, 5)],
      ausfall: [{ von: H.nz('2026-11-23', 9, 30), bis: H.nz('2026-11-23', 11, 0), art: 'leer', syms: syms }] });
    var cashNormal = ctx.d.mfBuch.cash, cashAusfall = ctx2.d.mfBuch.cash;
    var kaeufe = function (c) { return c.d.mfBuch.trades.filter(function (t) { return t.art === 'kauf' && t.t > c.buch0.positionen[0].seit; }).map(function (t) { return t.stueck; }); };
    var kN = kaeufe(ctx), kA = kaeufe(ctx2);
    var aw = cashAusfall > cashNormal + 1000;
    return { abweichung: aw, text: 'Ganz durch die App (zwei bleibende Werte bis 11:00 ohne Eroeffnung): Bargeld am Ende ' + Math.round(cashAusfall * 100) / 100 + ' $ gegen ' + Math.round(cashNormal * 100) / 100 + ' $ bei vollstaendigen Kursen; ' +
      'Kaeufe ' + (kA.length ? kA[0] : '-') + ' Stueck gegen ' + (kN.length ? kN[0] : '-') + ' Stueck (erstes Kauf-Stueck)' };
  }
};
