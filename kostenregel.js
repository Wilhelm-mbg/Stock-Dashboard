'use strict';
/* ================= Die Kostenregel des Momentum-Buchs (Auftrag Nr. 126, 26.10.2026) =================
 *
 * KOPIE, NICHT NEU ERFUNDEN. Die Zahlen und Rechenwege stehen in der Pruefstrasse:
 *   KLASSEN, INDEX, IBKR, ibkrGebuehr, klasseZurLaufzeit   <- pruefstrasse/kosten.js (Nr. 121-2b; dort Kopie aus
 *                                                              studien/momentum-wiedervorlage-2026-10-23/kosten.js, Nr. 122)
 *   KLASSE5_UMSATZ 3,8 Mrd $, UMSATZ_FENSTER 20             <- pruefstrasse/konfig.js
 *   anteilSeite, klasseVonUmsatz                            <- pruefstrasse/adapter/korb-kosten.js
 * Warum kopiert statt geladen: pruefstrasse/kosten.js laedt pruefstrasse/konfig.js, und das liest mit fs die konfig.json
 * der Pruefstrasse - im Fenster der App (Renderer ohne Node) geht das nicht, und pruefstrasse/ liegt nicht im Paket.
 * Die Bindung haelt test-momentum-umstellung.js: jede Zahl und jede Funktion hier gegen das Original, bitgleich.
 * Aendert die Pruefstrasse eine Zahl, wird der Test rot - dann hier nachziehen (Live = Messung).
 *
 * Die Regel je Seite (Kauf oder Verkauf) als Bruch des Handelswerts:
 *   Spanne  = halbe notierte Spanne der Kostenklasse zur Ausfuehrungszeit (Eroeffnung)
 *   Gebuehr = IBKR Ireland US-Aktien Fixed (0,005 $/Stueck, mindestens 1 $, hoechstens 1 % des Werts) + CAT je Stueck
 *             + SEC beim Verkauf - auf die echte Stueckzahl (Handelswert / Kurs, roher Kurs).
 * Kostenklasse aus dem Median-Dollarumsatz (Schluss x Stueck) der 20 Tagesbalken VOR dem Ausfuehrungstag:
 *   5-50 Mio (auch darunter) / 50-250 / 250-1.000 / ab 1.000 Mio $ / ab 3.800 Mio $ (Klasse 5, "groesste").
 * Alles Simulation mit virtuellem Kapital, keine Anlageberatung. */
(function (root) {

  var KLASSE5_UMSATZ = 3.8e9, UMSATZ_FENSTER = 20;   /* pruefstrasse/konfig.js */
  var KLASSEN = [
    { name: '5-50', von: 5e6, kassa: 0.1569, faktor: 2.68, kurs: 35.67 },
    { name: '50-250', von: 50e6, kassa: 0.0854, faktor: 2.46, kurs: 68.47 },
    { name: '250-1000', von: 250e6, kassa: 0.0647, faktor: 2.07, kurs: 110.34 },
    { name: 'ab1000', von: 1e9, kassa: 0.0449, faktor: 1.81, kurs: 170.87 },
    { name: 'groesste', von: KLASSE5_UMSATZ, kassa: 0.0188, eroeffnungGemessen: 0.0309, kurs: 201.78 }
  ];
  KLASSEN.forEach(function (k) { k.eroeffnung = k.eroeffnungGemessen != null ? k.eroeffnungGemessen : k.kassa * k.faktor; if (k.faktor == null) k.faktor = k.eroeffnung / k.kassa; });
  var INDEX = { name: 'index', kassa: KLASSEN[3].kassa, faktor: KLASSEN[3].faktor, eroeffnung: KLASSEN[3].eroeffnung, kurs: null, marke: 'Index-Spanne nicht gemessen' };
  var IBKR = {
    fixed: { jeStueck: 0.005, min: 1.00, maxAnteil: 0.01 },
    tiered: { jeStueck: 0.0035, min: 0.35, maxAnteil: 0.005, boerse: 0.0030, clearing: 0.00020, nysePass: 0.000175, finraPass: 0.00056 },
    sec: 0.0000206, taf: 0.0, cat: 0.000003
  };
  var NAME = 'eroeffnung+ibkr';                       /* Feld kostenRegel der Buchkonfiguration und des Lagebilds */
  var KURZTEXT = 'Kostenregel (Nr. 121-2b/126): je Seite halbe Spanne der Umsatzklasse zur Eröffnung + IBKR Fixed ' +
    '(0,005 $/Stück, min. 1 $, max. 1 %) + CAT, beim Verkauf SEC; Klasse aus dem Median-Dollarumsatz der 20 Tage vor dem Handel.';

  /** IBKR-Gebuehr einer Order in USD (Kopie pruefstrasse/kosten.js). */
  function ibkrGebuehr(modell, seite, stueck, kursRoh) {
    if (!(stueck > 0)) return 0;
    var wert = stueck * kursRoh, m = IBKR[modell], prov;
    prov = Math.min(Math.max(m.jeStueck * stueck, m.min), m.maxAnteil * wert);
    var extra = IBKR.cat * stueck + (seite === 'verkauf' ? IBKR.sec * wert + IBKR.taf * stueck : 0);
    if (modell === 'tiered') extra += (m.boerse + m.clearing) * stueck + prov * (m.nysePass + m.finraPass);
    return prov + extra;
  }
  /** Klassenobjekt: 0..4 oder 'index' (Kopie pruefstrasse/kosten.js). */
  function klasseObj(klasse) {
    if (klasse === 'index') return INDEX;
    var k = KLASSEN[klasse];
    if (!k) throw new Error('kostenregel.js: unbekannte Klasse ' + JSON.stringify(klasse) + ' (0..4 | index)');
    return k;
  }
  /** Kopie pruefstrasse/kosten.js: Panel-Klasse 3 mit Median-Umsatz >= Grenze -> 4 (Klasse 5). */
  function klasseZurLaufzeit(panelKlasse, umsatzMedianUsd, grenze) {
    var g = grenze === undefined ? KLASSE5_UMSATZ : grenze;
    return (panelKlasse === 3 && g != null && umsatzMedianUsd >= g) ? 4 : panelKlasse;
  }
  /** Kopie pruefstrasse/adapter/korb-kosten.js: Panel-Klasse 0..3 aus dem Median-Dollarumsatz (unter 5 Mio $ die Klasse 5-50), dann Klasse 5. */
  function klasseVonUmsatz(med) {
    var k = 0; for (var i = 3; i >= 0; i--) if (med >= KLASSEN[i].von) { k = i; break; }
    return klasseZurLaufzeit(k, med);
  }
  /** Kopie pruefstrasse/adapter/korb-kosten.js: Kostenanteil einer Seite (Bruch des Handelswerts). */
  function anteilSeite(klasse, lage, seite, wertUsd, kursRoh, modell) {
    var k = klasseObj(klasse), sp = (lage === 'kassa' ? k.kassa : k.eroeffnung) / 100 / 2;
    if (!(wertUsd > 0) || !(kursRoh > 0)) return sp;
    return sp + ibkrGebuehr(modell || 'fixed', seite, wertUsd / kursRoh, kursRoh) / wertUsd;
  }
  /** Dieselbe Rechnung wie anteilSeite, getrennt in Spanne und Gebuehr (Brueche des Handelswerts):
   *  spanne + gebuehr ist ZIFFERNGLEICH zu anteilSeite (gleiche Ausdruecke, gleiche Reihenfolge). */
  function seite(klasse, lage, art, wertUsd, kursRoh, modell) {
    var k = klasseObj(klasse), sp = (lage === 'kassa' ? k.kassa : k.eroeffnung) / 100 / 2;
    if (!(wertUsd > 0) || !(kursRoh > 0)) return { spanne: sp, gebuehr: 0 };
    return { spanne: sp, gebuehr: ibkrGebuehr(modell || 'fixed', art, wertUsd / kursRoh, kursRoh) / wertUsd };
  }

  /** Median-Dollarumsatz (Schluss x Stueck) der UMSATZ_FENSTER Tagesbalken VOR dem Zeitpunkt grenzeMs (Balkenstempel < grenze) -
   *  wie korb-kosten.js kontext: die 20 Zeilen bis zum Tag vor dem Ausfuehrungstag. reihe [[t, schluss, stueck, ...], ...] aufsteigend.
   *  Ohne Stueckzahlen 0 (Klasse 5-50, die teuerste - vorsichtig). */
  function medianUmsatzVor(reihe, grenzeMs, fenster) {
    fenster = fenster || UMSATZ_FENSTER;
    if (!reihe || !reihe.length) return 0;
    var e = reihe.length;
    while (e > 0 && reihe[e - 1][0] >= grenzeMs) e--;
    var w = [];
    for (var q = Math.max(0, e - fenster); q < e; q++) w.push((reihe[q][1] || 0) * (reihe[q][2] || 0));
    if (!w.length) return 0;
    w.sort(function (a, b) { return a - b; });
    var m = w.length >> 1;
    return w.length % 2 ? w[m] : (w[m - 1] + w[m]) / 2;
  }

  /** Die Kostenfunktion fuer MFHandel.fuehreAus (opts.kostenRegel). klasseVon(sym) -> Kostenklasse 0..4 (oder 'index');
   *  lage 'eroeffnung' (Vorgabe, das Buch handelt zur Eroeffnung) | 'kassa'; modell 'fixed' (Vorgabe) | 'tiered'.
   *  order { sym, seite: 'kauf'|'verkauf', stueck, kurs } -> { spanne, gebuehr, klasse } (Brueche des Handelswerts je Seite). */
  function regel(klasseVon, lage, modell) {
    var la = lage || 'eroeffnung', md = modell || 'fixed';
    return function kostenRegel(order) {
      var kl = klasseVon(order.sym), s = seite(kl, la, order.seite, order.stueck * order.kurs, order.kurs, md);
      return { spanne: s.spanne, gebuehr: s.gebuehr, klasse: kl };
    };
  }
  /** Die Kostenregel des Buchs aus den Tagesreihen: Klasse je Wert aus medianUmsatzVor(reihe, Beginn des Ausfuehrungstags). */
  function regelAusReihen(rohMap, grenzeMs) {
    var cache = {};
    return regel(function (sym) {
      if (cache[sym] == null) cache[sym] = klasseVonUmsatz(medianUmsatzVor(rohMap && rohMap[sym], grenzeMs));
      return cache[sym];
    }, 'eroeffnung', 'fixed');
  }

  var Kostenregel = { NAME: NAME, KURZTEXT: KURZTEXT, KLASSEN: KLASSEN, INDEX: INDEX, IBKR: IBKR, KLASSE5_UMSATZ: KLASSE5_UMSATZ, UMSATZ_FENSTER: UMSATZ_FENSTER,
    ibkrGebuehr: ibkrGebuehr, klasseObj: klasseObj, klasseZurLaufzeit: klasseZurLaufzeit, klasseVonUmsatz: klasseVonUmsatz, anteilSeite: anteilSeite,
    seite: seite, medianUmsatzVor: medianUmsatzVor, regel: regel, regelAusReihen: regelAusReihen };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Kostenregel; return; }
  root.Kostenregel = Kostenregel;
})(typeof window !== 'undefined' ? window : globalThis);
