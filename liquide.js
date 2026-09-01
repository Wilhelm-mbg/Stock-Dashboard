'use strict';
/* ================= Liquider Korb: die Korbregel des Momentum-Buchs =================
 *
 * Warum es dieses Modul gibt (Wilhelms Entscheid 02.09.2026): Das Momentum-Buch der App
 * uebernimmt EXAKT die gemessene liquide Konfiguration aus
 *   studien/vorregistrierung-2026-09-02-momentum-liquide/  (messen.js, periode())
 * damit jede kuenftige Umschichtung ein Out-of-Sample-Beleg ist. Die Regel dort:
 *
 *   Ein Wert ist am Stichtag t nur zulaessig, wenn sein Median-Tagesumsatz
 *   (Schluss x Stueck) ueber die 20 Balken bis einschliesslich t >= 100 Mio $ ist.
 *   Punkt-in-Zeit, VOR der Rangbildung. Median = sortiert[n >> 1] (bei gerader Zahl
 *   der obere der beiden mittleren Werte) - genau wie median() im Studienwerkzeug.
 *
 * Die Schwelle ist NOMINAL und wird nicht "verbessert" (kein Quantil, keine
 * Inflationsanpassung), obwohl wiki/fehlerformen.md die Drift einer nominalen Schwelle
 * ueber lange Historien als Fehlerform fuehrt: Live = Messung heisst dieselbe Zahl.
 * Die Drift wird im Buch NACHRICHTLICH ausgewiesen (Korbgroesse je Umschichtung), nicht
 * behoben. Wer die Zahl aendert, aendert die Konfiguration, die gemessen wurde - und
 * test-v6.js Block 34 wird rot, weil er sie gegen die Rohdaten der Studie haelt.
 *
 * Wurzelmodul, weil tools/ und studien/ NICHT ausgeliefert werden (wiki/fehlerformen.md
 * "Code im Repo != Code im Paket"). Rein, ohne Fenster und Netz, in Node testbar;
 * die Aequivalenz zum Studienwerkzeug prueft test-v6.js auf denselben Eingangsdaten.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {

  /* Korbregel der Studie - NICHT variieren. mindestWerte ist MINDEST_WERTE des
   * Studienwerkzeugs: unter 100 zulaessigen Werten wurde dort keine Periode gewertet,
   * also bildet auch das Buch darunter keinen Korb. */
  var KORB = {
    umsatzMin: 100000000,   // $ Median-Tagesumsatz, nominal (Registrierung §3)
    fenster: 20,            // Balken bis einschliesslich Stichtag
    mindestWerte: 100       // zulaessige Werte, unter denen keine Rangfolge gebildet wird
  };

  /** Median wie im Studienwerkzeug: sortiert[n >> 1]. Kein Mittel der beiden
   *  mittleren Werte - die Studie hat es so gerechnet, also rechnet das Buch es so. */
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    return s.length ? s[s.length >> 1] : NaN;
  }

  /** Median-Tagesumsatz (Schluss x Stueck) ueber die `fenster` Balken bis einschliesslich
   *  Index i. bars: [[t, schluss, stueck, ...], ...]. Fehlende Stueckzahl zaehlt wie in der
   *  Studie als 0 ((b[q][2] || 0)). Rueckgabe NaN ohne Balken. */
  function medianUmsatz(bars, i, fenster) {
    fenster = fenster || KORB.fenster;
    if (!bars || !bars.length) return NaN;
    if (i == null) i = bars.length - 1;
    if (i < 0 || i >= bars.length) return NaN;
    var ums = [];
    for (var q = Math.max(0, i - (fenster - 1)); q <= i; q++) ums.push((bars[q][1] || 0) * (bars[q][2] || 0));
    return median(ums);
  }

  /** Fuehrt die Reihe ueberhaupt Stueckzahlen? Gespeicherte Tagesdaten aus der Zeit vor
   *  dieser Regel tragen nur [t, kurs] - dann ist "Umsatz 0" kein Befund ueber den Wert,
   *  sondern eine Luecke der Daten. Das Buch soll beides auseinanderhalten koennen. */
  function hatUmsatz(bars, i, fenster) {
    fenster = fenster || KORB.fenster;
    if (!bars || !bars.length) return false;
    if (i == null) i = bars.length - 1;
    for (var q = Math.max(0, i - (fenster - 1)); q <= i && q < bars.length; q++) {
      if (typeof bars[q][2] === 'number' && isFinite(bars[q][2])) return true;
    }
    return false;
  }

  /** Ist der Wert am Index i zulaessig? Rueckgabe {ok, umsatz, grund}. */
  function zulaessig(bars, i, opts) {
    opts = opts || {};
    var min = opts.umsatzMin == null ? KORB.umsatzMin : opts.umsatzMin;
    var fenster = opts.fenster || KORB.fenster;
    var u = medianUmsatz(bars, i, fenster);
    if (!(min > 0)) return { ok: true, umsatz: u, grund: null };
    if (!hatUmsatz(bars, i, fenster)) {
      return { ok: false, umsatz: u, grund: 'keine Stückzahlen in den Tagesdaten – Umsatz nicht prüfbar (Tagesdaten neu laden)' };
    }
    if (!(u >= min)) {
      return { ok: false, umsatz: u,
        grund: 'Median-Tagesumsatz ' + Math.round(u / 1e6) + ' Mio $ unter ' + Math.round(min / 1e6) + ' Mio $ (' + fenster + ' Balken) – nicht im liquiden Korb' };
    }
    return { ok: true, umsatz: u, grund: null };
  }

  var Liquide = { KORB: KORB, median: median, medianUmsatz: medianUmsatz, hatUmsatz: hatUmsatz, zulaessig: zulaessig };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Liquide; return; }
  root.Liquide = Liquide;
})(typeof window !== 'undefined' ? window : globalThis);
