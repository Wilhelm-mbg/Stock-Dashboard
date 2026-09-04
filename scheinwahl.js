'use strict';
/* ================= Schein-Finder: die Wahl, ohne Fenster =================
 *
 * Wozu es diese Datei gibt (Oberflaeche Stufe 7, 04.09.2026): Der Finder zeigte
 * neun freie Zahlenfelder. Wer nicht wusste, welche Zahlen sinnvoll sind, sah
 * nichts. Jetzt stehen dort Auswahllisten mit BEREICHEN und drei Voreinstellungen.
 *
 * Und genau deshalb liegt die Tabelle hier und nicht im Markup: Sobald die Vorgaben
 * im HTML stehen, stehen sie an so vielen Stellen wie es Listen gibt, und die
 * Voreinstellung "ausgewogen" muesste sie ein zweites Mal wiederholen. Zwei Kopien
 * derselben Zahl driften - das ist im Projekt schon passiert. Hier steht jede Zahl
 * EINMAL; scheinfinder.js baut die Listen aus dieser Tabelle und liest sie zurueck.
 *
 * Diese Datei
 *   - hat kein window, kein document, kein Netz, keinen Speicher,
 *   - rechnet keinen Preis: die Bepreisung steht in quant.js und wird nicht
 *     angefasst. Hier wird nur AUSGEWAEHLT, was von einem fertig gerechneten Raster
 *     sichtbar ist,
 *   - ist in Node ladbar und damit pruefbar - der eigentliche Grund fuer den Schnitt.
 *
 * WOHER DIE ZAHLEN KOMMEN. Keine ist gegriffen. Die Schwellen sind die Schwellen des
 * Modells selbst, aus Q.scheinRisikostufe (quant.js):
 *   Grundstufe aus dem Hebel    Omega <= 4 -> 1, <= 8 -> 2, <= 13 -> 3, <= 20 -> 4, sonst 5
 *   Totalverlust ueber 25 %     +1 Stufe      ->  die Liste bietet 25 / 50 / 75 / egal
 *   Totalverlust ueber 50 %     +2 Stufen
 *   Restlaufzeit unter 14 Tagen +1 Stufe      ->  der kuerzeste Bereich beginnt bei 14
 *   Spanne ueber 2 % je Seite   +1 Stufe      ->  die Liste bietet 0,5 / 1 / 2 / egal
 * Die Bereichsgrenzen 14 / 30 / 90 / 180 Tage sind zugleich Rasterpunkte von
 * Q.scheinRaster (Laufzeiten 7, 14, 21, 30, 60, 90, 120, 180) - ein Bereich, der
 * zwischen zwei Rasterpunkte faellt, waere leer und niemand wuesste warum.
 *
 * DIE 7-TAGE-ZEILEN sind ueber keinen der angebotenen Bereiche erreichbar, nur ueber
 * "eigener Bereich". Das ist Absicht und keine Luecke: unter 14 Tagen vergibt das
 * Modell einen Aufschlag, und eine Liste, die das anbietet, empfiehlt es auch.
 */
(function (root) {

  /* ---------- Die Bereiche der Auswahllisten ----------
     min/max sind genau die Zahlen, die frueher von Hand in die Felder getippt
     wurden - die Aequivalenz "Bereich 5-10 filtert wie Felder 5 und 10" ist damit
     keine Behauptung, sondern die Bauweise. */
  var HEBEL = [
    { wert: '2-5', text: '2- bis 5-fach', min: 2, max: 5 },
    { wert: '5-10', text: '5- bis 10-fach', min: 5, max: 10 },
    { wert: '10-20', text: '10- bis 20-fach', min: 10, max: 20 },
    { wert: 'ueber20', text: 'über 20-fach', min: 20, max: 9999 },
    { wert: 'eigen', text: 'eigener Bereich (leer = alle)', eigen: true }
  ];
  var LAUFZEIT = [
    { wert: '2-4w', text: '2 bis 4 Wochen', min: 14, max: 30 },
    { wert: '1-3m', text: '1 bis 3 Monate', min: 30, max: 90 },
    { wert: '3-6m', text: '3 bis 6 Monate', min: 90, max: 180 },
    { wert: 'lang', text: '6 Monate und länger', min: 180, max: 9999 },
    { wert: 'eigen', text: 'eigener Bereich (leer = alle)', eigen: true }
  ];
  /* "egal" ist 100 und nicht 999: beides sind Prozentwerte, und ueber 100 % kann
     weder eine Spanne je Seite noch eine Wahrscheinlichkeit liegen. */
  var SPANNE = [
    { wert: '0.5', text: 'höchstens 0,5 %', max: 0.5 },
    { wert: '1', text: 'höchstens 1 %', max: 1 },
    { wert: '2', text: 'höchstens 2 %', max: 2 },
    { wert: '100', text: 'egal', max: 100 }
  ];
  var TOTALVERLUST = [
    { wert: '25', text: 'höchstens 25 %', max: 25 },
    { wert: '50', text: 'höchstens 50 %', max: 50 },
    { wert: '75', text: 'höchstens 75 %', max: 75 },
    { wert: '100', text: 'egal', max: 100 }
  ];
  var STUFE = [
    { wert: '1', text: 'bis 1 – defensiv' },
    { wert: '2', text: 'bis 2 – vorsichtig' },
    { wert: '3', text: 'bis 3 – mittel' },
    { wert: '4', text: 'bis 4 – offensiv' },
    { wert: '5', text: 'bis 5 – spekulativ' }
  ];
  var TYP = [
    { wert: 'alle', text: 'Call und Put' },
    { wert: 'call', text: 'nur Call (steigend)' },
    { wert: 'put', text: 'nur Put (fallend)' }
  ];
  var BAND = [
    { wert: '999', text: 'alle Basispreise' },
    { wert: '2.5', text: '±2,5 % ums Geld' },
    { wert: '5', text: '±5 % ums Geld' },
    { wert: '10', text: '±10 % ums Geld' },
    { wert: '20', text: '±20 % ums Geld' }
  ];
  /* Die Sortierungen sind unveraendert aus der bisherigen Fassung uebernommen -
     sie stehen hier nur, damit auch diese Liste EINE Stelle hat. */
  var SORT = [
    { wert: 'stufe', text: 'Risikostufe (defensiv zuerst)' },
    { wert: 'huerde', text: 'kleinste Spannen-Hürde (ohne Zeitwert)' },
    { wert: 'spread', text: 'kleinste Spanne' },
    { wert: 'theta', text: 'wenigster Zeitwertverlust' },
    { wert: 'tv', text: 'kleinste Totalverlust-Gefahr' },
    { wert: 'omega', text: 'größter Hebel' },
    { wert: 'omegaAuf', text: 'kleinster Hebel' }
  ];

  /* ---------- Die drei Voreinstellungen ----------
     Jede setzt ALLE Listen auf einmal. Hergeleitet (siehe Kopf), nicht gegriffen -
     und danach am echten Raster nachgezaehlt, damit keine leer ist:
       Referenz 04.09.2026, Q.scheinRaster ueber vier Basiswerte
       (477 $/79 %, 600 $/18 %, 100 $/35 %, 20 $/55 %); Treffer und mittlere Stufe:
         defensiv     12 (1,2) · 10 (2,0) · 22 (1,9) · 13 (1,5)
         ausgewogen   52 (2,8) · 60 (2,3) · 52 (2,2) · 22 (2,2)
         offensiv     23 (5,0) · 30 (3,7) · 38 (4,3) ·  3 (4,3)
     Zwei frueh erwogene Varianten sind an dieser Zaehlung gescheitert und stehen
     deshalb NICHT hier: "defensiv" mit 3-6 Monaten (bei 79 % Vola null Treffer -
     lange Laufzeit und Totalverlust unter 25 % schliessen sich dort aus) und
     "offensiv" mit Hebel ueber 20 (bei zwei der vier Basiswerte null Treffer). */
  var VOREINSTELLUNGEN = {
    defensiv: {
      titel: 'defensiv',
      /* Stufe 2, weil die Grundstufe im Hebelband 2-5 genau 1 oder 2 ist und der
         Totalverlust-Aufschlag (+1 ab 25 %) mit der TV-Liste ausgeschlossen wird. */
      typ: 'alle', stufeMax: '2', hebel: '2-5', laufzeit: '1-3m',
      spanne: '1', tv: '25', band: '999', sort: 'stufe'
    },
    ausgewogen: {
      titel: 'ausgewogen',
      /* Die drei Zahlen der bisherigen Markup-Vorgabe bleiben stehen: Stufe 3,
         Spanne 1 %, Totalverlust 50 %. Neu ist nur, dass Hebel und Laufzeit
         Bereiche sind statt vier freier Felder (frueher 3-20 und 14-180). */
      typ: 'alle', stufeMax: '3', hebel: '5-10', laufzeit: '2-4w',
      spanne: '1', tv: '50', band: '999', sort: 'stufe'
    },
    offensiv: {
      titel: 'offensiv',
      /* Spanne 2 % ist genau die Schwelle, ab der das Modell den Pfennig-Schein-
         Aufschlag vergibt - weiter aufzumachen hiesse, Scheine anzubieten, die das
         Modell selbst als Aufschlagsfall fuehrt. Sortiert nach Hebel, weil danach
         sucht, wer diese Einstellung waehlt. */
      typ: 'alle', stufeMax: '5', hebel: '10-20', laufzeit: '2-4w',
      spanne: '2', tv: '100', band: '999', sort: 'omega'
    }
  };

  /** Eine Voreinstellung als frische Kopie - nie die Tabelle selbst, sonst
   *  veraendert die erste Bedienung die Vorlage fuer alle weiteren. */
  function voreinstellung(name) {
    var v = VOREINSTELLUNGEN[name];
    if (!v) return null;
    var aus = {};
    Object.keys(v).forEach(function (k) { if (k !== 'titel') aus[k] = v[k]; });
    aus.hebelVon = ''; aus.hebelBis = ''; aus.lzVon = ''; aus.lzBis = '';
    aus.alleSpalten = false;
    return aus;
  }

  function fund(liste, wert) {
    for (var i = 0; i < liste.length; i++) if (liste[i].wert === wert) return liste[i];
    return null;
  }
  function zahl(v, std) { var z = parseFloat(v); return isFinite(z) ? z : std; }

  /** Die Wahl (Auswahllisten) auf genau die Felder abbilden, nach denen frueher
   *  gefiltert wurde. Wer die Aequivalenz prueft, prueft diese Funktion. */
  function felder(wahl) {
    wahl = wahl || {};
    var h = fund(HEBEL, wahl.hebel) || fund(HEBEL, VOREINSTELLUNGEN.ausgewogen.hebel);
    var l = fund(LAUFZEIT, wahl.laufzeit) || fund(LAUFZEIT, VOREINSTELLUNGEN.ausgewogen.laufzeit);
    var s = fund(SPANNE, wahl.spanne) || fund(SPANNE, VOREINSTELLUNGEN.ausgewogen.spanne);
    var t = fund(TOTALVERLUST, wahl.tv) || fund(TOTALVERLUST, VOREINSTELLUNGEN.ausgewogen.tv);
    return {
      typ: wahl.typ || 'alle',
      stufeMax: zahl(wahl.stufeMax, 5),
      /* Leere eigene Felder heissen "keine Grenze" - dieselben Ersatzwerte wie in
         der bisherigen Fassung (0 / 999 bzw. 0 / 9999). */
      hebelMin: h.eigen ? zahl(wahl.hebelVon, 0) : h.min,
      hebelMax: h.eigen ? zahl(wahl.hebelBis, 999) : h.max,
      lzMin: l.eigen ? zahl(wahl.lzVon, 0) : l.min,
      lzMax: l.eigen ? zahl(wahl.lzBis, 9999) : l.max,
      spreadMax: s.max,
      tvMax: t.max,
      band: zahl(wahl.band, 999),
      sort: wahl.sort || 'stufe'
    };
  }

  /** Erfuellt eine Raster-Zeile die Felder? Woertlich die Bedingungen der
   *  bisherigen zeige()-Schleife, nur an einem in Node pruefbaren Ort. */
  function passt(k, f, spot) {
    if (!k || !f) return false;
    if (f.typ !== 'alle' && k.dir !== f.typ) return false;
    if (k.stufe > f.stufeMax) return false;
    if (k.omega < f.hebelMin || k.omega > f.hebelMax) return false;
    if (k.restTage < f.lzMin || k.restTage > f.lzMax) return false;
    if (k.spreadPct > f.spreadMax) return false;
    if (k.totalverlustP > f.tvMax) return false;
    if (spot && f.band < 999 && Math.abs(k.strike / spot - 1) * 100 > f.band) return false;
    return true;
  }

  /** Vergleicher zur Sortierung - unveraendert aus der bisherigen Fassung. */
  function vergleich(s) {
    return function (a, b) {
      if (s === 'omega') return b.omega - a.omega;
      if (s === 'omegaAuf') return a.omega - b.omega;
      if (s === 'spread') return a.spreadPct - b.spreadPct;
      if (s === 'theta') return b.thetaWoche - a.thetaWoche;
      if (s === 'huerde') return a.spanneHuerdePct - b.spanneHuerdePct;
      if (s === 'tv') return a.totalverlustP - b.totalverlustP;
      return a.stufe - b.stufe || a.spanneHuerdePct - b.spanneHuerdePct;
    };
  }

  /** Filtern und sortieren in einem - was die Tabelle zeigt. */
  function auswahl(raster, wahl, spot) {
    var f = felder(wahl);
    var liste = (raster || []).filter(function (k) { return passt(k, f, spot); });
    liste.sort(vergleich(f.sort));
    return liste;
  }

  /* ---------- Die Spalten ----------
     grund: true = eine der sieben, die immer stehen. Der Schalter "alle Kennzahlen"
     blendet die uebrigen acht ein. Die Auswahl der sieben ist die Frage, die man vor
     dem Kauf stellt: WELCHER Schein (WKN, Kennung), WIE riskant (Stufe), in WELCHE
     Richtung (Typ), ab WO (Basispreis), mit welchem HEBEL, und was steht auf dem
     Spiel (Totalverlust). Alles andere - OTM, Tage, BV, Brief, Spanne, Theta,
     Aufgeld, Huerde - erklaert, warum die Stufe so ausfaellt, und steht darum in der
     aufgeklappten Zeile ohnehin. */
  var SPALTEN = [
    { schl: 'wkn', t: 'WKN', grund: true },
    { schl: 'kennung', t: 'Kennung', grund: true },
    { schl: 'stufe', t: 'Stufe', grund: true, sort: 'stufe', pfeil: '↑' },
    { schl: 'typ', t: 'Typ', grund: true },
    { schl: 'strike', t: 'Basispreis', grund: true, r: 1 },
    { schl: 'otm', t: 'OTM', r: 1 },
    { schl: 'tage', t: 'Tage', r: 1 },
    { schl: 'bv', t: 'BV', r: 1 },
    { schl: 'brief', t: 'Brief', r: 1 },
    { schl: 'omega', t: 'Hebel', grund: true, sort: 'omega', pfeil: '↓', wechsel: 1, r: 1 },
    { schl: 'spread', t: 'Spanne', sort: 'spread', pfeil: '↑', r: 1 },
    { schl: 'theta', t: 'Θ/Woche', sort: 'theta', pfeil: '↑', r: 1 },
    { schl: 'aufgeld', t: 'Aufgeld p.a.', r: 1 },
    { schl: 'tv', t: 'Totalverlust', grund: true, sort: 'tv', pfeil: '↑', r: 1 },
    { schl: 'huerde', t: 'Hürde', sort: 'huerde', pfeil: '↑', r: 1 }
  ];
  /** Welche Spalten stehen gerade? alleSpalten=false -> die sieben Grundspalten. */
  function spalten(alleSpalten) {
    return SPALTEN.filter(function (c) { return alleSpalten || c.grund; });
  }

  var ScheinWahl = {
    HEBEL: HEBEL, LAUFZEIT: LAUFZEIT, SPANNE: SPANNE, TOTALVERLUST: TOTALVERLUST,
    STUFE: STUFE, TYP: TYP, BAND: BAND, SORT: SORT, SPALTEN: SPALTEN,
    VOREINSTELLUNGEN: VOREINSTELLUNGEN,
    voreinstellung: voreinstellung,
    felder: felder,
    passt: passt,
    vergleich: vergleich,
    auswahl: auswahl,
    spalten: spalten
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = ScheinWahl; return; }
  root.ScheinWahl = ScheinWahl;
})(typeof window !== 'undefined' ? window : globalThis);
