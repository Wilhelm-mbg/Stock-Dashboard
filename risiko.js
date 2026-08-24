'use strict';
/* Kapitalschutz als eigenes, in Node ausfuehrbares Modul.
 *
 * Warum getrennt: Die drei Regeln, die das Geld schuetzen - Positionslimit, Exposure-
 * Deckel und das Tagesverlust-Limit mit Kill-Switch - lagen in depot.js. Diese Datei hat
 * kein module.exports (sie ist eine IIFE ueber window und braucht ein DOM), also konnte
 * die Testsuite die Regeln nicht AUSFUEHREN. Sie hat sie stattdessen als Text gesucht
 * und die Formel danebengeschrieben - im Test stand woertlich "identische Formel wie im
 * Produktcode". Zwei Kopien derselben Regel, und die Pruefung faellt genau dann aus,
 * wenn sie gebraucht wird: Aendert jemand die Formel im Produktcode, rechnet der Test
 * weiter mit der alten und bleibt gruen.
 *
 * Hier stehen deshalb nur die ENTSCHEIDUNGEN, als reine Funktionen ueber uebergebenen
 * Zustand. Die Nebenwirkungen - Positionen schliessen, speichern, protokollieren -
 * bleiben in depot.js, wo sie hingehoeren. Nichts hier fasst D, das DOM oder das Netz an.
 *
 * Alle Formeln sind unveraendert aus depot.js uebernommen, einschliesslich der
 * Rueckfallwerte und der Wortlaute der Begruendungen. Diese Datei aendert Verhalten
 * nicht - sie macht es nur pruefbar. */
(function (root) {

  /* Der Rueckfall, wenn D.risk fehlt. ABWEICHEND von den Werten einer frischen
   * Installation (dayLossPct 3): das ist so gewachsen und bleibt hier absichtlich
   * unveraendert stehen - eine stillschweigende Angleichung waere eine Verhaltens-
   * aenderung an genau der Stelle, die Geld schuetzt. */
  var STANDARD = { maxPos: 8, dayLossPct: 5, exposurePct: 40 };

  /** Der Tagesschluessel, gegen den Tagesstart und Kill-Switch laufen.
   *  Bewusst UTC (toISOString), nicht Ortszeit - so war es immer, und ein Wechsel
   *  wuerde den Tagesstart einmalig verschieben. */
  function tagesSchluessel(now) {
    return new Date(now == null ? Date.now() : now).toISOString().slice(0, 10);
  }

  /** Ist der letzte Kursbalken noch frisch genug zum Handeln?
   *  Grenze: das Dreifache des Bar-Abstands - ein fehlender Bar ist normal (duenner
   *  Handel), drei sind ein Datenproblem. Gilt nur fuer EINSTIEGE. Ausstiege bleiben
   *  immer erlaubt: eine offene Position bei schlechter Datenlage nicht schliessen zu
   *  koennen waere das groessere Risiko. */
  function barsFrisch(bars, barMin, now) {
    if (!bars || !bars.length) return { ok: false, alterMin: null };
    var alterMin = (now - bars[bars.length - 1][0]) / 60000;
    return { ok: alterMin <= barMin * 3, alterMin: Math.round(alterMin) };
  }

  /** Darf eine neue Position eroeffnet werden?
   *  zustand: { risk, positionen (Anzahl), dayStartEq, cash }
   *  Die Reihenfolge der Pruefungen entscheidet, welcher Grund genannt wird - sie ist
   *  dieselbe wie vorher: Stueckzahl, dann Tagesverlust, dann Exposure. */
  function darfOeffnen(zustand, eq) {
    /* Im Zweifel NICHT oeffnen. Fehlt eine Zahl - ein Tippfehler im Feldnamen an der
     * Aufrufstelle genuegt -, dann waere "undefined >= 8" falsch und "(eq - undefined)"
     * NaN: beide Vergleiche gehen durch, und der Schutz haette stillschweigend alles
     * erlaubt. Das ist die einzige Richtung, in die ein Kapitalschutz nie fallen darf.
     * Bewusst kein throw: ein Ausnahmefehler mitten im Scan wuerde den Durchlauf
     * abbrechen und damit auch die AUSSTIEGE verhindern. Ablehnen mit Begruendung
     * landet dagegen sichtbar in der Geduld-Bilanz. */
    if (!zustand || typeof zustand.positionen !== 'number' || typeof zustand.cash !== 'number' ||
        typeof eq !== 'number' || !isFinite(eq)) {
      return { ok: false, why: 'Kein Einstieg: der Risikozustand ist unvollständig (Programmfehler)' };
    }
    var r = zustand.risk || STANDARD;
    if (zustand.positionen >= (r.maxPos || 8)) {
      return { ok: false, why: 'Positionslimit (' + r.maxPos + ') erreicht' };
    }
    if (r.dayLossPct && zustand.dayStartEq > 0) {
      var dayPct = (eq / zustand.dayStartEq - 1) * 100;
      if (dayPct <= -r.dayLossPct) {
        return { ok: false, why: 'Risiko-Stopp: Tagesverlust ' + dayPct.toFixed(1) + ' % (Limit −' + r.dayLossPct + ' %)' };
      }
    }
    if (r.exposurePct) {
      var expo = eq > 0 ? (eq - zustand.cash) / eq * 100 : 0;
      if (expo >= r.exposurePct) {
        return { ok: false, why: 'Exposure-Limit: ' + Math.round(expo) + ' % in Scheinen (Limit ' + r.exposurePct + ' %)' };
      }
    }
    return { ok: true };
  }

  /** Ist das Tagesverlust-Limit erreicht? Reine Entscheidung, KEINE Nebenwirkung -
   *  das Glattstellen bleibt in depot.js.
   *  zustand: { risk, dayStartEq }
   *  Gibt { faellig, tagPct, grund } zurueck. tagPct ist null, wenn gar nicht
   *  gerechnet werden konnte (kein Limit gesetzt, kein Tagesstart). */
  function killSwitchFaellig(zustand, eq) {
    var r = zustand.risk || {};
    if (!r.dayLossPct) return { faellig: false, tagPct: null, grund: null };
    if (!(zustand.dayStartEq > 0)) return { faellig: false, tagPct: null, grund: null };
    var tagPct = (eq / zustand.dayStartEq - 1) * 100;
    if (tagPct > -r.dayLossPct) return { faellig: false, tagPct: tagPct, grund: null };
    return {
      faellig: true, tagPct: tagPct,
      grund: 'Kill-Switch: Tagesverlust-Limit (' + tagPct.toFixed(1) + ' %, Limit −' + r.dayLossPct + ' %)'
    };
  }

  var Risiko = {
    STANDARD: STANDARD,
    tagesSchluessel: tagesSchluessel,
    barsFrisch: barsFrisch,
    darfOeffnen: darfOeffnen,
    killSwitchFaellig: killSwitchFaellig
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Risiko; return; }
  root.Risiko = Risiko;
})(typeof window !== 'undefined' ? window : globalThis);
