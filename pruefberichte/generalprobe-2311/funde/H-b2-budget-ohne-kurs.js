'use strict';
/* Fund H-b2-budget-ohne-kurs (Klasse A): der Platzwert (Depotwert / Zielzahl) zaehlt eine gehaltene Position OHNE Eroeffnungskurs mit 0.
 * mfhandel.js planeUmschichtung (Z. 123-127): wert += stueck * k nur fuer k > 0. Fehlt am Ausfuehrungstag fuer einige gehaltene Werte
 * voruebergehend die Eroeffnung (Teilausfall der Quelle, Drosselung, spaeter Handelsbeginn, Wert ohne neue Balken), sinkt der
 * Depotwert um deren Wert, und JEDER Kauf dieses Tages bekommt ein zu kleines Budget. Die Umschichtung laeuft mit diesem Budget (Nr. 94:
 * offen.kaeufe[].budget traegt es in die spaeteren Takte weiter). Ergebnis: das Geld bleibt als Bargeld liegen, bis zur naechsten
 * Umschichtung 63 Handelstage spaeter. REGEL.md §1.3 nennt "Position ohne Kurs gehalten", sagt aber nichts davon, dass ihr Wert aus dem
 * Depotwert faellt; die Messung (rueckblick.js, Panel) hat an jedem Tag fuer jeden Wert eine Eroeffnung.
 * Kleinster Aufbau: zwei Zielwerte, eine gehaltene Position ohne Kurs. */
var H = require('../harness.js');
module.exports = {
  id: 'H-b2-budget-ohne-kurs', klasse: 'A', ort: 'mfhandel.js:123-130 (planeUmschichtung), mfdepot.js:413-423, mfhandel.js:744-755 (offeneAuftraege/budget)',
  titel: 'Depotwert/Platzwert der Umschichtung ohne die gehaltenen Positionen, fuer die die Eroeffnung fehlt: Kaeufe zu klein, Bargeld bleibt liegen',
  ausloeser: 'Teilausfall der Kursquelle am Ausfuehrungstag (b2) oder eine gehaltene Reihe ohne Balken (d, d2): gehaltene Position ohne Eroeffnungskurs',
  erwartet: 'Platzwert = (Bargeld + alle Positionen, fehlende zum letzten Schluss) / Zielzahl; Kaeufe so gross wie bei vollstaendigen Kursen',
  async lauf() {
    var MH = H.MH;
    /* 1) Kleinstaufbau: Ziel [B, A]; A gehalten (10 Stueck, letzter Schluss 100), kein Kurs; C gehalten, Kurs 100, nicht im Ziel; B Kurs 100 */
    var buch = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 100 }, { sym: 'C', stueck: 10, einstand: 100 }] };
    var plan = MH.planeUmschichtung(['B', 'A'], buch, { B: 100, C: 100 }, { kleinstAnteil: 0.05 });
    var kaufB = plan.kaufen.filter(function (o) { return o.sym === 'B'; })[0];
    var klein = { depotwert: plan.depotwert, stueckB: kaufB.stueck };      // beobachtet: 1000 / 5
    /* 2) ganz durch die App: b2 im Kleinen - zwei gehaltene bleibende Werte ohne Eroeffnung bis 11:00, Takte 09:35 und 11:05 */
    var ctx = await H.lauf({ kurz: true, bereitT: H.nz('2026-11-20', 16, 20), takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 11, 5)],
      ereignisFn: function () { return {}; } });
    /* der Ausfall braucht die Rollen: zweiter Lauf mit Ausfall der zwei bleibenden Werte (Rollen sind ohne Ausfall dieselben) */
    var r = ctx.rollen, syms = {}; syms[r.kept[0]] = true; syms[r.kept[1]] = true;
    var ctx2 = await H.lauf({ kurz: true, bereitT: H.nz('2026-11-20', 16, 20), takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 11, 5)],
      ausfall: [{ von: H.nz('2026-11-23', 9, 30), bis: H.nz('2026-11-23', 11, 0), art: 'leer', syms: syms }] });
    var cashNormal = ctx.d.mfBuch.cash, cashAusfall = ctx2.d.mfBuch.cash;
    var kaeufe = function (c) { return c.d.mfBuch.trades.filter(function (t) { return t.art === 'kauf' && t.t > c.buch0.positionen[0].seit; }).map(function (t) { return t.stueck; }); };
    var kN = kaeufe(ctx), kA = kaeufe(ctx2);
    var aw = klein.stueckB < 9 || cashAusfall > cashNormal + 1000;
    return { abweichung: aw, text: 'beobachtet (Kleinstaufbau): Depotwert ' + klein.depotwert + ', Kauf B ' + klein.stueckB + ' Stueck; erwartet 2000 und 10 Stueck (A zum letzten Schluss 100 gezaehlt). ' +
      'Ganz durch die App (zwei bleibende Werte bis 11:00 ohne Eroeffnung): Bargeld am Ende ' + Math.round(cashAusfall * 100) / 100 + ' $ gegen ' + Math.round(cashNormal * 100) / 100 + ' $ bei vollstaendigen Kursen; ' +
      'Kaeufe ' + (kA.length ? kA[0] : '-') + ' Stueck gegen ' + (kN.length ? kN[0] : '-') + ' Stueck (erstes Kauf-Stueck)' };
  }
};
