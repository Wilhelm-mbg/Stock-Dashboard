'use strict';
/* Messfenster: welche Kerzen in welche Scheibe fallen.
 *
 * Dritter Schnitt aus depot.js (Audit 22). Die "Messmaschine" dort ist 1.117 Zeilen
 * lang, ruft acht Funktionen aus dem Rest der Datei auf und fasst D, das DOM und
 * save() an - sie WOERTLICH zu verschieben, wie es beim Chart ging, waere kein
 * Umzug gewesen, sondern ein Umbau mit acht neuen Durchreichungen. Das waere ein
 * schlechter Tausch: dieselbe Verflechtung, nur ueber Dateigrenzen verteilt.
 *
 * Verschoben ist deshalb der Teil, der WIRKLICH rein ist - und zufaellig auch der
 * wichtigste. Diese sieben Funktionen entscheiden, welche Kerze zum Optimieren,
 * welche zum Auswaehlen und welche zum Belegen zaehlt. Faellt eine Handelstags-
 * grenze um einen Tag falsch, wandert ein Tag aus der Belegscheibe in die
 * Trainingsscheibe - und das Ergebnis sieht besser aus, ohne dass irgendwo ein
 * Fehler auffiele. Bis 8.24.5 war das nur ueber einen kompletten Messlauf
 * pruefbar; jetzt in Node, mit gebauten Kursreihen und bekannter Antwort.
 *
 * Rein heisst hier woertlich: kein D, kein DOM, kein window, kein await, kein
 * Zustand. Alles kommt als Argument herein. */
(function (root) {

  /* Der Warmlauf zieht mit um: warmlaufBars braucht ihn, und er ist eine Eigenschaft
   * des Messfensters, keine des Handels. In depot.js stand er als Modulkonstante -
   * genau die Sorte Abhaengigkeit, die eine Reinheitspruefung auf D, DOM und window
   * NICHT findet. Der erste Wurf dieses Moduls war deshalb kaputt: warmlaufBars gab
   * fuer alles ausser 60m 'undefined' zurueck, und sliceMap haette mit undefined
   * Warmlauf-Bars geschnitten - lautlos, weil Math.max(0, erst - undefined) NaN ist
   * und slice(NaN, n) bei 0 anfaengt. Jede Scheibe waere ab dem ersten Bar gelaufen. */
  var WARMLAUF_BARS = 400;   // deckt Kanal (380), EMA100 und Wellen-Score (120) ab

  /** Warmlauf je Zeitrahmen: 400 Stundenkerzen waeren ~61 Handelstage und wuerden die
   *  komplette 60m-Historie auffressen - dort reichen 150 Bars (EMA100 + Wellen-Score). */
  function warmlaufBars(iv) { return iv === '60m' ? 150 : WARMLAUF_BARS; }
  /** Alle Handelstage (UTC) der Datenbasis, aufsteigend. */
  function handelsTage(map) {
    var set = {};
    Object.keys(map).forEach(function (s) {
      map[s].forEach(function (p) { set[new Date(p[0]).toISOString().slice(0, 10)] = 1; });
    });
    return Object.keys(set).sort();
  }
  function mapSpan(map) {
    var t0 = Infinity, t1 = -Infinity;
    Object.keys(map).forEach(function (s) {
      var a = map[s];
      if (a.length) { t0 = Math.min(t0, a[0][0]); t1 = Math.max(t1, a[a.length - 1][0]); }
    });
    return [t0, t1];
  }
  /** Zeitgrenze nach einem Anteil der Handelstage (0–1). */
  function tagesGrenze(map, anteil) {
    var tage = handelsTage(map);
    if (!tage.length) return null;
    var i = Math.min(tage.length - 1, Math.max(0, Math.floor(tage.length * anteil)));
    return Date.parse(tage[i] + 'T00:00:00Z');
  }
  /** Teilt die Handelstage in n gleich große Blöcke: [{von, bis, tage}] als ms-Grenzen. */
  function tagesScheiben(map, n) {
    var tage = handelsTage(map);
    if (tage.length < n) return [];
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = Math.floor(tage.length * i / n), b = Math.floor(tage.length * (i + 1) / n);
      if (b <= a) return [];
      out.push({ von: Date.parse(tage[a] + 'T00:00:00Z'), bis: Date.parse(tage[b - 1] + 'T23:59:59.999Z'), tage: b - a });
    }
    return out;
  }
  /** Ausschnitt [from, to] je Symbol – der Warmlauf zählt in BARS, nicht in Millisekunden.
   *  Vorher war er als Kalenderzeit gerechnet: 160 Bars × 5 Minuten = 13 Stunden Wanduhr,
   *  die über ein Wochenende NULL zusätzliche Bars ergeben. Jede Scheibe startete dadurch
   *  kalt – Wellen-Score (120 Bars), EMA100 (100) und Kanal (380) waren am Anfang blind. */
  function sliceMap(map, from, to, warmupBars) {
    var out = {};
    var w = warmupBars || 0;
    Object.keys(map).forEach(function (s) {
      var arr = map[s], erst = -1, letzt = -1;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i][0] > to) break;
        if (erst < 0 && arr[i][0] >= from) erst = i;
        letzt = i;
      }
      if (erst < 0 || letzt < erst) return;
      var sl = arr.slice(Math.max(0, erst - w), letzt + 1);
      if (sl.length > 60) out[s] = sl;
    });
    return out;
  }
  /** Handelstage in einer Kurs-Scheibe - fuer die ehrliche Angabe, worauf ein Urteil steht. */
  function tageIn(m) {
    try { return handelsTage(m).length; } catch (e) { return null; }
  }

  var Messfenster = {
    warmlaufBars: warmlaufBars, handelsTage: handelsTage, mapSpan: mapSpan,
    tagesGrenze: tagesGrenze, tagesScheiben: tagesScheiben, sliceMap: sliceMap, tageIn: tageIn
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Messfenster; return; }
  root.Messfenster = Messfenster;
})(typeof window !== 'undefined' ? window : globalThis);
