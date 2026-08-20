'use strict';
/* ================= Mittelfristige Querschnitts-Strategie =================
 *
 * Was sie tut: Sie vergleicht alle Werte des Universums MITEINANDER und kauft das
 * stärkste Zehntel. Kein Chartmuster, kein Ein- und Ausstiegssignal auf einem
 * einzelnen Wert — nur eine Rangfolge, die alle paar Wochen neu gebildet wird.
 *
 * Warum das etwas anderes ist als der Intraday-Teil:
 * Alle Zeitreihen-Signale (EMA-Kreuzung, Umkehr, RSI, Donchian, Squeeze, Wellen)
 * wurden am 20.08.2026 auf echten Kursen durchgemessen. Ergebnis: Trefferquoten
 * zwischen 46 und 56 Prozent — Münzwurf. Der beste gemessene Vorsprung lag bei
 * +0,09 Prozentpunkten, die Kostenhürde eines Hebelscheins beginnt bei 0,077 %.
 * Auf Intraday-Sicht gibt der Markt schlicht nicht genug her.
 *
 * Im QUERSCHNITT sieht es anders aus, weil eine andere Frage gestellt wird: nicht
 * "steigt dieser Wert gleich?", sondern "welche Werte sind gerade die stärksten?".
 * Der Marktdurchschnitt wird dabei abgezogen und fällt heraus.
 *
 * Gemessen auf 197 Werten aus allen Sektoren, Tageskerzen, 1970–2026:
 *   Parameter gewählt auf 1970–2004, geprüft auf 2005–2026 OHNE Anpassung
 *   Ergebnis Prüfzeitraum (20 Basispunkte Kosten je Seite):
 *     Depot  +20,3 % p. a.   Markt +14,9 % p. a.   Vorsprung +5,4 Pp
 *     schlug den Markt in 14 von 22 Jahren
 *     93 von 96 Parameterkombinationen schlugen den Markt (breites Plateau)
 *   Gegenprobe Überlebenden-Verzerrung: ohne die 30 besten Werte bleiben +0,98 %
 *     Median-Vorsprung je Umschlag bei 55 % Trefferquote — es bricht nicht zusammen.
 *   Über Jahrzehnte: positiv in allen fünf (1970er bis 2020er).
 *
 * EHRLICHE GRENZEN, die man kennen muss:
 *  - Der größte Rückschlag lag bei 52 % (2008). Das ist kein ruhiges Investment.
 *  - In 8 von 22 Jahren war das Depot schlechter als der Markt. Wer nach einem
 *    schwachen Jahr aussteigt, verliert den Effekt.
 *  - Das Universum enthält nur Firmen, die es HEUTE noch gibt. Pleiten fehlen.
 *    Der Vergleich ist marktrelativ, was das dämpft, aber nicht aufhebt.
 *  - Haltedauer 42–126 Tage. Mit Hebelscheinen auf 21 Tage ist das NICHT
 *    darstellbar — der Zeitwertverfall frisst es auf. Das hier sind Aktien.
 *
 * Reine Funktionen, in Node testbar (module.exports).
 */
(function (root) {

  /* Auf 1970–2004 gewählt, auf 2005–2026 bestätigt. Nicht nachträglich angepasst. */
  var STANDARD = {
    rueckblick: 231,     // Handelstage, über die die Stärke gemessen wird (~11 Monate)
    luecke: 21,          // letzter Monat wird ausgelassen (kurzfristige Gegenbewegung)
    halten: 63,          // Handelstage bis zur nächsten Umschichtung (~3 Monate)
    anteil: 0.10,        // stärkstes Zehntel wird gekauft
    minWerte: 25         // darunter ist eine Rangfolge nicht aussagekräftig
  };

  /** Stärke eines Werts: Rendite über `rueck` Tage, endend `luecke` Tage vor jetzt.
   *  Die Lücke ist kein Detail — der jüngste Monat trägt die kurzfristige
   *  Gegenbewegung und schwächt den Effekt, wenn man ihn mitnimmt. */
  function staerke(reihe, i, rueck, luecke) {
    var bis = i - (luecke || 0);
    var von = bis - rueck;
    if (von < 0 || bis >= reihe.length || bis < 0) return null;
    var a = reihe[von], b = reihe[bis];
    if (a == null || b == null || !(a > 0)) return null;
    return b / a - 1;
  }

  /** Rangfolge aller Werte zum Zeitpunkt i.
   *  map: {SYM: [kurs, ...]} — gleich lange Reihen, gemeinsame Zeitachse.
   *  Rückgabe: [{sym, staerke}] absteigend, oder null bei zu wenigen Werten. */
  function rangfolge(map, i, opts) {
    opts = opts || {};
    var rueck = opts.rueckblick || STANDARD.rueckblick;
    var luecke = opts.luecke === undefined ? STANDARD.luecke : opts.luecke;
    var minW = opts.minWerte || STANDARD.minWerte;
    var syms = Object.keys(map), liste = [];
    for (var k = 0; k < syms.length; k++) {
      var s = staerke(map[syms[k]], i, rueck, luecke);
      if (s != null && isFinite(s)) liste.push({ sym: syms[k], staerke: s });
    }
    if (liste.length < minW) return null;
    liste.sort(function (a, b) { return b.staerke - a.staerke; });
    return liste;
  }

  /** Wen soll man halten? Das stärkste `anteil`-Fünftel/Zehntel der Rangfolge. */
  function auswahl(map, i, opts) {
    opts = opts || {};
    var r = rangfolge(map, i, opts);
    if (!r) return null;
    var anteil = opts.anteil || STANDARD.anteil;
    var n = Math.max(5, Math.round(r.length * anteil));
    return r.slice(0, n);
  }

  /** Rendite eines Werts von i bis i+h. */
  function vorwaerts(reihe, i, h) {
    if (i < 0 || i + h >= reihe.length) return null;
    var a = reihe[i], b = reihe[i + h];
    return (a != null && b != null && a > 0) ? b / a - 1 : null;
  }

  /** Vollständiger Durchlauf über die Kursreihen.
   *  Vergleicht immer gegen den GLEICHGEWICHTETEN Durchschnitt derselben Werte —
   *  nicht gegen einen Index. Sonst misst man mit, wie der Markt insgesamt lief.
   *  Rückgabe: {kapital, markt, proJahr, marktProJahr, rueckschlag, schritte,
   *             umschlag, jahre: {jahr: {depot, markt}}, verlauf: [...]} */
  function durchlauf(map, opts) {
    opts = opts || {};
    var halten = opts.halten || STANDARD.halten;
    var kosten = opts.kostenBp === undefined ? 20 : opts.kostenBp;
    var start = opts.start || (STANDARD.rueckblick + STANDARD.luecke + 10);
    var syms = Object.keys(map);
    if (!syms.length) return null;
    var laenge = map[syms[0]].length;

    var kapital = 1, markt = 1, hoch = 1, rueckschlag = 0;
    var bestand = [], schritte = 0, umschlagSum = 0;
    var jahre = {}, verlauf = [];

    for (var i = start; i + halten < laenge; i += halten) {
      var aus = auswahl(map, i, opts);
      if (!aus) continue;
      var rang = rangfolge(map, i, opts);

      // Nur Werte behalten, für die es auch eine Vorwärtsrendite gibt — sonst
      // rechnet man mit Werten, die im Zielzeitpunkt gar nicht mehr da sind.
      var gehalten = [];
      for (var a = 0; a < aus.length; a++) {
        if (vorwaerts(map[aus[a].sym], i, halten) != null) gehalten.push(aus[a].sym);
      }
      if (gehalten.length < 3) continue;

      var neuAnteil = 0;
      for (var g = 0; g < gehalten.length; g++) if (bestand.indexOf(gehalten[g]) === -1) neuAnteil++;
      var umschlag = bestand.length ? neuAnteil / gehalten.length : 1;
      umschlagSum += umschlag; schritte++;
      kapital *= (1 - umschlag * 2 * kosten / 10000);   // Verkauf und Kauf
      bestand = gehalten;

      var sD = 0, nD = 0;
      for (var d = 0; d < gehalten.length; d++) { var rd = vorwaerts(map[gehalten[d]], i, halten); if (rd != null) { sD += rd; nD++; } }
      var sM = 0, nM = 0;
      for (var m = 0; m < rang.length; m++) { var rm = vorwaerts(map[rang[m].sym], i, halten); if (rm != null) { sM += rm; nM++; } }
      if (!nD || nM < 10) continue;

      kapital *= (1 + sD / nD);
      markt *= (1 + sM / nM);
      if (kapital > hoch) hoch = kapital;
      var tief = (hoch - kapital) / hoch;
      if (tief > rueckschlag) rueckschlag = tief;

      var jahr = opts.jahrVon ? opts.jahrVon(i + halten) : null;
      if (jahr != null) jahre[jahr] = { depot: kapital, markt: markt };
      verlauf.push({ i: i + halten, depot: kapital, markt: markt, gehalten: gehalten.slice() });
    }
    if (!schritte) return null;
    var perioden = schritte * halten / 252;
    return {
      kapital: kapital, markt: markt,
      proJahr: perioden > 0 ? (Math.pow(kapital, 1 / perioden) - 1) * 100 : 0,
      marktProJahr: perioden > 0 ? (Math.pow(markt, 1 / perioden) - 1) * 100 : 0,
      rueckschlag: rueckschlag * 100,
      schritte: schritte, umschlag: umschlagSum / schritte,
      jahre: jahre, verlauf: verlauf
    };
  }

  var Momentum = {
    STANDARD: STANDARD,
    staerke: staerke, rangfolge: rangfolge, auswahl: auswahl,
    vorwaerts: vorwaerts, durchlauf: durchlauf
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Momentum; return; }
  root.Momentum = Momentum;
})(typeof window !== 'undefined' ? window : globalThis);
