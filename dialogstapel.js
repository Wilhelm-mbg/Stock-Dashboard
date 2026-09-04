'use strict';
/* ================= Dialog-Stapel: wer liegt oben, und wohin geht der Fokus =========
 *
 * Wozu es diese Datei gibt (QS-Fund B1, 04.09.2026): Die App hat sechs Dialoge, und
 * ihre Ordnung stand bis heute NUR im Markup - alle sechs trugen dasselbe
 * `z-index: 100`, also entschied die Reihenfolge im Dokument, wer oben liegt. Der
 * einzige Weg zu "Was ist neu" fuehrt aber durch die App-Einstellungen, und
 * `setModalBg` steht im Dokument HINTER `wasNeuModalBg`: der zweite Dialog ging auf
 * und blieb unsichtbar. Ein Knopfdruck bewirkte fuer den Nutzer nichts.
 *
 * Dazu kam ein einziger globaler Merker fuer die Fokus-Rueckgabe (`modalHer`). Beim
 * Schliessen des ersten Dialogs wurde er geleert - der zweite hatte danach kein
 * "zurueck" mehr, und der Fokus landete auf <body> statt auf dem Knopf, mit dem
 * alles begann.
 *
 * Beides ist dieselbe Ursache: es gab keine STELLE, die weiss, welche Dialoge offen
 * sind und in welcher Reihenfolge. Hier ist sie.
 *
 * Warum eine eigene Datei und nicht ein paar Zeilen in app-shell.js: Die
 * Oberflaechendateien sind in Node nicht ladbar, test-v6 tastet sie nur als TEXT ab.
 * Eine Ordnung, die nur im Renderer steht, laesst sich nicht durchspielen - man kann
 * bestenfalls pruefen, dass ein Wort im Quelltext vorkommt. Genau so ist im Projekt
 * schon einmal eine Pruefung zur Verkleidung geworden. Diese Datei
 *   - hat kein window, kein document, kein Netz, keinen Speicher,
 *   - kennt keine Elemente: der Ausloeser ist ein undurchsichtiges Zeichen, das sie
 *     nur aufbewahrt und zurueckgibt,
 *   - entscheidet nichts ueber Aussehen: sie sagt nur, WELCHE Ebene wer bekommt.
 * app-shell.js setzt die Ebenen, den Fokus und hoert auf Escape.
 *
 * EINE ORDNUNG, NICHT ZWEI. Die Ebenen kommen aus dem Stapel, nicht aus dem Markup.
 * Das `z-index: 100` im Stylesheet bleibt als Boden stehen (ein Dialog, der an
 * dieser Verwaltung vorbei geoeffnet wird, muss immer noch ueber dem klebenden
 * Cockpit liegen), aber es ordnet die Dialoge nicht mehr untereinander.
 *
 * Alles Simulation, keine Anlageberatung.
 */
(function (root) {

  /* Der Boden. Darueber liegen in index.html das Kurzinfo-Faehnchen (110), das
   * Hinweisfenster (120) und das Erklaerfenster (130) - letzteres AUSDRUECKLICH ueber
   * den Dialogen, weil ein i-Knopf auch in einem Dialog stehen kann. Der Stapel darf
   * diese drei also nicht ueberholen: bei sechs Dialogen reicht er bis 106. */
  var BASIS = 100;

  function neu(opt) {
    opt = opt || {};
    var basis = typeof opt.basis === 'number' ? opt.basis : BASIS;
    /* Der Stapel selbst: unten der aelteste, oben der zuletzt geoeffnete.
     * Je Eintrag { kennung, her } - "her" ist der Ausloeser DIESES Dialogs.
     * Je Dialog gemerkt, nicht global: das war der zweite Teil von B1. */
    var stapel = [];

    function platz(kennung) {
      for (var i = 0; i < stapel.length; i++) if (stapel[i].kennung === kennung) return i;
      return -1;
    }

    /* Die Ebenen werden IMMER aus der aktuellen Lage neu berechnet und vollstaendig
     * zurueckgegeben - nicht nur fuer den bewegten Dialog. Wer aus der Mitte
     * verschwindet, verschiebt alle darueber; wuerde nur der eine gesetzt, bliebe
     * eine Luecke, die beim naechsten Oeffnen zu einer Gleichstand-Kollision fuehrt.
     * Genau die Gleichstand-Kollision ist B1. */
    function ordnung() {
      return stapel.map(function (e, i) { return { kennung: e.kennung, ebene: basis + i + 1 }; });
    }

    return {
      /** Oeffnen. Ein schon offener Dialog wandert nach OBEN statt ein zweites Mal
       *  in den Stapel zu geraten - doppelte Eintraege waeren ein Leck, das erst
       *  beim Schliessen auffiele (der Dialog verschwaende, der Stapel nicht). */
      oeffnen: function (kennung, her) {
        if (!kennung) return null;
        var i = platz(kennung);
        if (i >= 0) {
          /* Ein zweites Oeffnen ohne erkennbaren Ausloeser darf den gemerkten
           * NICHT loeschen: sonst verliert ein Dialog seinen Rueckweg, nur weil ihn
           * jemand neu gezeichnet hat. */
          if (her) stapel[i].her = her;
          var alt = stapel.splice(i, 1)[0];
          stapel.push(alt);
        } else {
          stapel.push({ kennung: kennung, her: her || null });
        }
        return { ebene: basis + stapel.length, ordnung: ordnung() };
      },

      /** Schliessen. Gibt den Ausloeser GENAU DIESES Dialogs zurueck (oder null),
       *  dazu die neue Ordnung und wer jetzt oben liegt. Ein Dialog, der gar nicht
       *  im Stapel steht, liefert null - das ist kein Fehler, sondern der Fall
       *  "an der Verwaltung vorbei geoeffnet". */
      schliessen: function (kennung) {
        var i = platz(kennung);
        if (i < 0) return null;
        var weg = stapel.splice(i, 1)[0];
        return { her: weg.her || null, oben: this.oberster(), ordnung: ordnung() };
      },

      /** Vergessen ohne Fokus-Rueckgabe: fuer Dialoge, die auf einem anderen Weg
       *  zugegangen sind. Der Stapel darf nicht behaupten, etwas sei offen. */
      vergessen: function (kennung) {
        var i = platz(kennung);
        if (i < 0) return null;
        stapel.splice(i, 1);
        return { ordnung: ordnung() };
      },

      oberster: function () { return stapel.length ? stapel[stapel.length - 1].kennung : null; },
      herkunft: function (kennung) { var i = platz(kennung); return i < 0 ? null : (stapel[i].her || null); },
      offen: function (kennung) { return platz(kennung) >= 0; },
      liste: function () { return stapel.map(function (e) { return e.kennung; }); },
      ebene: function (kennung) { var i = platz(kennung); return i < 0 ? null : basis + i + 1; },
      ordnung: ordnung,
      tiefe: function () { return stapel.length; }
    };
  }

  var Dialogstapel = { BASIS: BASIS, neu: neu };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Dialogstapel; return; }
  root.Dialogstapel = Dialogstapel;
})(typeof window !== 'undefined' ? window : globalThis);
