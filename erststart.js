'use strict';
/* ================= Gefuehrter Erststart (C15, 01.09.2026) =================
 *
 * Drei Karten, einmal im Leben einer Installation: Was diese App ist, was
 * simuliert wird, wo die eigenen Papiere hinkommen. Der Befund dahinter (P6,
 * Struktur-Plan 25.08.): nach dem Diagnose-Dialog gab es keinerlei gefuehrten
 * Einstieg - die leeren Karten erklaerten sich unterschiedlich gut.
 *
 * Reihenfolge ist die halbe Arbeit: die Diagnose-Einwilligung erscheint ~4 s
 * nach dem Start und ist die WICHTIGERE Frage (sie entscheidet ueber Daten).
 * Dieses Fenster wartet deshalb, bis der Diagnose-Dialog nicht mehr offen ist,
 * und erscheint nie gleichzeitig. Es zeigt sich genau einmal; wer es per
 * Schliessen-Knopf oder Escape wegklickt, hat es gesehen - auch das wird
 * gemerkt, ein Erklaerfenster darf nicht wiederkommen wie eine Mahnung.
 * Kein Zwang, keine Animation, reiner statischer Text (Markup in index.html). */
(function () {
  var MERKER = 'erststart_gesehen';

  async function gesehen() {
    try { if (window.api && window.api.storeSet) await window.api.storeSet(MERKER, 1); }
    catch (e) { /* dann kommt es beim naechsten Start noch einmal - kein Schaden */ }
  }

  function diagOffen() {
    var d = document.getElementById('diagModalBg');
    return !!(d && d.classList.contains('open'));
  }

  async function pruefen() {
    if (!window.api || !window.api.storeGet || !window.openModal) return;
    var schon = null;
    try { schon = await window.api.storeGet(MERKER); } catch (e) { return; }
    if (schon) return;
    /* Warten, bis die Diagnose-Frage beantwortet oder weggeklickt ist. Kein
     * fester Zeitpunkt: auf langsamen Starts kaeme ein Timer zu frueh. */
    var versuche = 0;
    var takt = setInterval(function () {
      versuche++;
      if (diagOffen() && versuche < 120) return;   // hoechstens 2 Minuten warten
      clearInterval(takt);
      var box = document.getElementById('erststartModalBg');
      if (!box) return;
      window.openModal('erststartModalBg');
      /* Gesehen ist gesehen - egal ob ueber den Ok-Knopf, das Schliessen-Kreuz
       * oder Escape verlassen wird. Der Merker faellt beim OEFFNEN. Schliessen
       * uebernimmt komplett das Dialog-Muster der Shell (data-close, Escape,
       * Randklick, Fokusrueckgabe) - hier gibt es keinen zweiten Weg. */
      gesehen();
    }, 1000);
  }

  document.addEventListener('DOMContentLoaded', function () { setTimeout(pruefen, 6000); });
})();
