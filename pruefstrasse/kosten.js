'use strict';
/* KOSTENREGEL der Pruefstrasse (Nr. 121-2b, FORM.md §3 "Kostenregel"): EINE Funktion fuer alle Formen, Einheit Pp je UMLAUF (Kauf + Verkauf).
 *   huerdeUmlauf(klasse, ausfuehrung, positionUsd, kurs[, modell]) -> { spannePp, gebuehrPp, gesamtPp, quelle, ... }
 *   Spanne = notierte Spanne (ap - bp) / mid je Umsatzklasse (volle Spanne je Umlauf, je Seite die Haelfte) zur Ausfuehrungszeit
 *   (kassa = Fenster mitte, eroeffnung = Kassa x Eroeffnungsfaktor der Klasse); Gebuehr = IBKR Ireland US-Aktien Fixed (Vorgabe) oder Tiered
 *   (nachrichtlich) mit CAT je Stueck und SEC beim Verkauf, echte Stueckzahl = Position / Kurs (roher Kurs).
 * HERKUNFT: Klassen 1-4, IBKR, ibkrGebuehr und anteilSeite sind KOPIERT aus studien/momentum-wiedervorlage-2026-10-23/kosten.js (Nr. 122,
 * Quellen je Zahl dort in quellen.md, abgerufen 23.10.2026) - nicht neu erfunden; die Studie ist versiegelt und bleibt unveraendert.
 * Klasse 5 und index sind neu (Nr. 121-2b A.2/A.3, Messung aus E:/Markt-Dashboard-Archiv/spannen/, Uebergabe pruefstrasse-stufe2b).
 * SPANNEN-ZEITRAUM: gemessen ab 2021 (Spannen-Studie 03.09.2026, Fenster mitte); fuer 2016-2020 ungeprueft - dort waren die Spannen kleiner
 * (Nr. 122 offener Punkt 4: 0,1107 / 0,0477 / 0,0289 / 0,0222 statt 0,1569 / 0,0854 / 0,0647 / 0,0449) -> die Huerde ist dort vorsichtig.
 * "schluss" wird nicht gebaut (kein Konsument, keine Intraday-Daten der tag-Form). Simulation mit virtuellem Kapital, keine Anlageberatung. */
var K = require('./konfig.js');

/* ---------- Spanne je Umsatzklasse (Pp je UMLAUF) ----------
 * Klassen 1-4 (Index 0-3): wiki/kosten.md "Kassa-Huerde je Umsatzklasse und Jahr" = studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS.md §3
 *   (Fenster mitte, ab 2021, Symbol-Median); Eroeffnungsfaktor studien/vorregistrierung-2026-09-06-signale-minuten/konfig.js KLASSEN (eroeffnung/mitte);
 *   Median-Kurs je Klasse wiki/kosten.md "Je Klasse x Fenster" - alles wie Nr. 122 kosten.js.
 * Klasse 5 (Index 4, "groesste"): Panel-Klasse 4 (ab 1.000 Mio $) mit Median-Dollarumsatz der 20 Tage vor dem Einstieg >= K.KLASSE5_UMSATZ - zur Laufzeit,
 *   das Panelfeld bleibt unveraendert. Gemessen 23.10.2026 aus spannen/2021-2026.jsonl, Klasse ab1000, gleiche Masszahl (Symbol-Median ueber 2021-2026,
 *   Positivkontrolle: alle 110 Symbole ergeben die 0,0449 der Studie exakt): oberstes Umsatz-Dezil (11 Symbole, Anker-Umsatz >= 3.833 Mio $) Kassa 0,0188,
 *   Eroeffnung 0,0309 (gemessen, Faktor 1,65), Median-Kurs 201,78 $. Grenze A.2: erstes Dezil, ab dem jedes hoehere Dezil und der Pool <= 0,7 x 0,0449.
 * index (SPY, QQQ; UCITS-Pendants nachrichtlich): in spannen/ NICHT gemessen (das Universum fuehrt keine ETFs) -> Platzhalter = Klasse-4-Spanne
 *   (0,0449 ist die Kassa-Spanne der Klasse ab 1.000 Mio $, KEIN Indexwert) mit der Marke "Index-Spanne nicht gemessen". */
var KLASSEN = [
  { name: '5-50', von: 5e6, kassa: 0.1569, faktor: 2.68, kurs: 35.67, quelle: 'Nr. 122 kosten.js (Spannen-Studie 03.09.2026, mitte ab 2021; Faktor Minutenstudie)' },
  { name: '50-250', von: 50e6, kassa: 0.0854, faktor: 2.46, kurs: 68.47, quelle: 'Nr. 122 kosten.js (Spannen-Studie 03.09.2026, mitte ab 2021; Faktor Minutenstudie)' },
  { name: '250-1000', von: 250e6, kassa: 0.0647, faktor: 2.07, kurs: 110.34, quelle: 'Nr. 122 kosten.js (Spannen-Studie 03.09.2026, mitte ab 2021; Faktor Minutenstudie)' },
  { name: 'ab1000', von: 1e9, kassa: 0.0449, faktor: 1.81, kurs: 170.87, quelle: 'Nr. 122 kosten.js (Spannen-Studie 03.09.2026, mitte ab 2021; Faktor Minutenstudie)' },
  { name: 'groesste', von: K.KLASSE5_UMSATZ, kassa: 0.0188, eroeffnungGemessen: 0.0309, kurs: 201.78, gemessen: K.KLASSE5_UMSATZ != null,
    quelle: 'Nr. 121-2b Messung spannen/ 2021-2026, Klasse ab1000, oberstes Umsatz-Dezil - vorlaeufig, 11 Symbole, 95-%-Band 0,012-0,036 (QS 23.10.2026), Kassa und Eroeffnung direkt' },
];
KLASSEN.forEach(function (k) { k.eroeffnung = k.eroeffnungGemessen != null ? k.eroeffnungGemessen : k.kassa * k.faktor; if (k.faktor == null) k.faktor = k.eroeffnung / k.kassa; });
var INDEX = { name: 'index', kassa: KLASSEN[3].kassa, faktor: KLASSEN[3].faktor, eroeffnung: KLASSEN[3].eroeffnung, kurs: null, gemessen: false,
  marke: 'Index-Spanne nicht gemessen', quelle: 'Platzhalter = Klasse-4-Spanne (ab 1.000 Mio $), spannen/ fuehrt SPY/QQQ nicht; Instrumente SPY, QQQ (UCITS-Pendants nachrichtlich)' };
var AUSFUEHRUNGEN = ['eroeffnung', 'kassa'];

/* ---------- IBKR Ireland, US-Aktien (Nr. 122 quellen.md: interactivebrokers.ie/en/pricing/commissions-stocks.php, abgerufen 23.10.2026) - KOPIE ---------- */
var IBKR = {
  fixed: { jeStueck: 0.005, min: 1.00, maxAnteil: 0.01 },
  tiered: { jeStueck: 0.0035, min: 0.35, maxAnteil: 0.005, boerse: 0.0030, clearing: 0.00020, nysePass: 0.000175, finraPass: 0.00056 },
  sec: 0.0000206, taf: 0.0, cat: 0.000003,
};
/** IBKR-Gebuehr einer Order in USD (Kopie Nr. 122). modell 'fixed' | 'tiered'; seite 'kauf' | 'verkauf'; stueck = echte Stueckzahl (roher Kurs). */
function ibkrGebuehr(modell, seite, stueck, kursRoh) {
  if (!(stueck > 0)) return 0;
  var wert = stueck * kursRoh, m = IBKR[modell], prov;
  prov = Math.min(Math.max(m.jeStueck * stueck, m.min), m.maxAnteil * wert);
  var extra = IBKR.cat * stueck + (seite === 'verkauf' ? IBKR.sec * wert + IBKR.taf * stueck : 0);
  if (modell === 'tiered') extra += (m.boerse + m.clearing) * stueck + prov * (m.nysePass + m.finraPass);
  return prov + extra;
}

/** Klassenobjekt: 0..4 oder 'index'. */
function klasseObj(klasse) {
  if (klasse === 'index') return INDEX;
  var k = KLASSEN[klasse];
  if (!k) throw new Error('kosten.js: unbekannte Klasse ' + JSON.stringify(klasse) + ' (0..4 | index)');
  return k;
}
/** Kostenklasse zur Laufzeit (A.2): Panel-Klasse 3 (ab 1.000 Mio $) mit Median-Dollarumsatz der 20 Tage vor dem Einstieg >= KLASSE5_UMSATZ -> 4
 *  (Klasse 5); sonst die Panel-Klasse. KLASSE5_UMSATZ null = Klasse 5 nicht aktiv. */
function klasseZurLaufzeit(panelKlasse, umsatzMedianUsd, grenze) {
  var g = grenze === undefined ? K.KLASSE5_UMSATZ : grenze;
  return (panelKlasse === 3 && g != null && umsatzMedianUsd >= g) ? 4 : panelKlasse;
}

/**
 * Huerde eines Umlaufs in Pp (Kauf + Verkauf). klasse 0..4 | 'index'; ausfuehrung 'eroeffnung' | 'kassa'; positionUsd (Vorgabe K.POSITION_USD);
 * kurs = roher Kurs je Stueck (Stueckzahl; ohne Kurs der Median-Kurs der Klasse); modell 'fixed' (Vorgabe) | 'tiered' (nachrichtlich).
 * Gebuehr: Kauf und Verkauf je auf den Positionswert (der Verkaufswert = Kaufwert; der Ertrag des Trades aendert ihn um Bruchteile).
 */
function huerdeUmlauf(klasse, ausfuehrung, positionUsd, kurs, modell) {
  var k = klasseObj(klasse), a = ausfuehrung || 'eroeffnung', md = modell || 'fixed';
  if (AUSFUEHRUNGEN.indexOf(a) === -1) throw new Error('kosten.js: ausfuehrung muss eroeffnung | kassa sein, nicht ' + JSON.stringify(ausfuehrung));
  if (md !== 'fixed' && md !== 'tiered') throw new Error('kosten.js: modell muss fixed | tiered sein');
  var pos = positionUsd == null ? K.POSITION_USD : positionUsd, px = kurs > 0 ? kurs : (k.kurs || KLASSEN[3].kurs);
  var spannePp = a === 'eroeffnung' ? k.eroeffnung : k.kassa, stueck = pos / px;
  var gebuehrPp = (ibkrGebuehr(md, 'kauf', stueck, px) + ibkrGebuehr(md, 'verkauf', stueck, px)) / pos * 100;
  return { klasse: klasse === 'index' ? 'index' : klasse, name: k.name, ausfuehrung: a, modell: md, positionUsd: pos, kurs: px, kursAusKlasse: !(kurs > 0),
    spannePp: spannePp, gebuehrPp: gebuehrPp, gesamtPp: spannePp + gebuehrPp, marke: k.marke || null,
    quelle: k.quelle + '; Gebuehr IBKR Ireland ' + (md === 'fixed' ? 'Fixed 0,005 $/Stueck min 1 $ max 1 %' : 'Tiered') + ' + CAT + SEC (Nr. 122 quellen.md, 23.10.2026)' };
}
/** Schneller Zahlpfad fuer die Buchung je Trade (gleiche Rechnung wie huerdeUmlauf, nur gesamtPp). */
function gesamtPp(klasse, ausfuehrung, positionUsd, kurs, modell) {
  var k = klasse === 'index' ? INDEX : KLASSEN[klasse];
  if (!k || (ausfuehrung !== 'kassa' && ausfuehrung !== 'eroeffnung')) throw new Error('kosten.js gesamtPp: Klasse ' + JSON.stringify(klasse) + ' / Ausfuehrung ' + JSON.stringify(ausfuehrung));   /* QS U5 */
  var px = kurs > 0 ? kurs : (k.kurs || KLASSEN[3].kurs), stueck = positionUsd / px, md = modell || 'fixed';
  return (ausfuehrung === 'kassa' ? k.kassa : k.eroeffnung) + (ibkrGebuehr(md, 'kauf', stueck, px) + ibkrGebuehr(md, 'verkauf', stueck, px)) / positionUsd * 100;
}
/** Spannenanteil der Huerde (Pp je Umlauf) einer Klasse zur Ausfuehrungszeit - fuer die Zerlegung Spanne + Gebuehr im Protokoll. */
function spannePp(klasse, ausfuehrung) { var k = klasse === 'index' ? INDEX : KLASSEN[klasse]; return ausfuehrung === 'kassa' ? k.kassa : k.eroeffnung; }
/** Korb-Hilfe: Huerde je SEITE in Basispunkten (gesamtPp x 100 / 2). */
function jeSeiteBp(h) { return h.gesamtPp * 100 / 2; }

/** Kostentabelle Klasse x Ausfuehrung x Position (Pp je Umlauf) fuer Protokoll und Uebergabe; Position 5.263 $ (Vorgabe) und 1.000 $ (Sensitivitaet,
 *  Mindestgebuehr), Kurs = Median-Kurs der Klasse (index: QQQ-artig 400 $). */
function tabelle(positionen) {
  var P = positionen || [K.POSITION_USD, K.POSITION_SENSITIV_USD], z = [];
  [0, 1, 2, 3, 4, 'index'].forEach(function (kl) {
    P.forEach(function (pos) {
      AUSFUEHRUNGEN.forEach(function (a) {
        var f = huerdeUmlauf(kl, a, pos, kl === 'index' ? 400 : null, 'fixed'), t = huerdeUmlauf(kl, a, pos, kl === 'index' ? 400 : null, 'tiered');
        z.push({ klasse: kl, name: f.name, positionUsd: pos, ausfuehrung: a, kurs: f.kurs, spannePp: f.spannePp, gebuehrFixedPp: f.gebuehrPp, gesamtFixedPp: f.gesamtPp,
          gebuehrTieredPp: t.gebuehrPp, gesamtTieredPp: t.gesamtPp, marke: f.marke, klasse5Aktiv: kl === 4 ? K.KLASSE5_UMSATZ != null : null });
      });
    });
  });
  return z;
}

/** Nr. 125a (Vorschlag Nr. 126, offener Punkt 5): Kosten EINER Seite als Brueche des Handelswerts, getrennt - spanne = halbe Spanne der Kostenklasse
 *  zur Ausfuehrungszeit (lage 'eroeffnung' | 'kassa'), gebuehr = IBKR-Gebuehr der Seite / Wert (Stueck = Wert / roher Kurs; ohne Wert oder Kurs 0).
 *  spanne + gebuehr ist ziffergleich zu adapter/korb-kosten.js anteilSeite (Test K-1 in test-125a.js). Die App spiegelt sie in kostenregel.js. */
function seite(klasse, lage, seiteArt, wertUsd, kursRoh, modell) {
  var k = klasseObj(klasse), sp = (lage === 'kassa' ? k.kassa : k.eroeffnung) / 100 / 2;
  return { spanne: sp, gebuehr: (wertUsd > 0 && kursRoh > 0) ? ibkrGebuehr(modell || K.KOSTEN.modell, seiteArt, wertUsd / kursRoh, kursRoh) / wertUsd : 0 };
}

module.exports = { seite: seite, KLASSEN: KLASSEN, INDEX: INDEX, AUSFUEHRUNGEN: AUSFUEHRUNGEN, IBKR: IBKR, ibkrGebuehr: ibkrGebuehr, klasseObj: klasseObj, klasseZurLaufzeit: klasseZurLaufzeit,
  huerdeUmlauf: huerdeUmlauf, gesamtPp: gesamtPp, spannePp: spannePp, jeSeiteBp: jeSeiteBp, tabelle: tabelle };
