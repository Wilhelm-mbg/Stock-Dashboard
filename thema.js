'use strict';
/* ============================================================================
 * DAS THEMA, BEVOR DAS ERSTE PIXEL FAELLT
 *
 * Diese Datei existiert nur wegen ihrer STELLE: sie ist das erste Skript im
 * <head> und laeuft, bevor der Parser den Rumpf erreicht. Alles andere haengt
 * daran, und deshalb steht sie allein statt in renderer.js.
 *
 * Vorher: <html data-theme="dark"> stand fest im Quelltext, und renderer.js hat
 * die gespeicherte Wahl per storeGet() nachgeladen - ueber IPC, also mit einer
 * Antwort, die fruehestens im naechsten Umlauf kommt. Wer hell eingestellt hat,
 * sah bei JEDEM Start erst die dunkle Oberflaeche und dann den Umschlag. Am
 * Abend ist das ein Blitz ins Gesicht.
 *
 * Der Weg ohne Blitz waere ueblicherweise ein Inline-Skript im <head>. Das geht
 * hier NICHT: die Seite laeuft unter einer strengen Content-Security-Policy mit
 * script-src 'self', und die wird fuer eine Kosmetikfrage nicht aufgeweicht.
 * Also eine eigene Datei - die ist 'self' und damit erlaubt.
 *
 * Die Wahl kommt OHNE IPC: der Hauptprozess liest sie beim Start aus dem
 * Speicher und haengt sie als Startargument an das Fenster; preload.js legt sie
 * als window.api.startThema ab. Hier steht sie also schon bereit, wenn dieses
 * Skript laeuft - kein Warten, kein zweiter Anlauf.
 *
 * Faellt irgendetwas davon aus, passiert NICHTS: dann bleibt es bei dem, was im
 * <html>-Tag steht (dunkel), und renderer.js zieht die gespeicherte Wahl wie
 * bisher asynchron nach. Der Blitz waere zurueck, die App aber heil. Ein
 * Startskript, das die Oberflaeche aufhalten kann, waere der schlechtere Tausch.
 * ========================================================================== */
(function () {
  try {
    var t = window.api && window.api.startThema;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) {
    /* Bewusst still: diese Datei laeuft vor allem anderen, auch vor jeder
     * Fehleranzeige. Wer hier lauter waere, haette einen weissen Bildschirm. */
  }
})();
