'use strict';
/* ================= Urteile von Studien AUSSERHALB der Messmaschine =================
 *
 * Warum es diese Datei gibt (QS-Fund vom 27.08.2026, "Widerlegte Schalter"):
 * Die Auslöser-Auswahl liest ihren Belegstand aus den Protokollen der Messmaschine.
 * Vier Auslöser wurden aber von ANDEREN Studien gemessen und verworfen — die legen
 * dort nichts ab, also standen sie als "Nicht gemessen". Das ist von den drei
 * Beschriftungen die einladendste, und sie stand auf genau den Kandidaten, bei denen
 * das Gegenteil bekannt ist. Wer nur eine Quelle liest, hält deren Lücke für die Welt.
 *
 * Was hier stehen DARF und was nicht:
 * - Nur VERWERFUNGEN. Ein positives Urteil kann aus dieser Datei nie kommen — der
 *   Beleg dafür steht im Messprotokoll und nirgendwo sonst (Regel D2). Eine Kante, die nur
 *   in einer Liste lebt, ist keine; eine dokumentierte Verwerfung mit Quelle dagegen
 *   ist genau das, was eine Liste tragen kann.
 * - Jeder Eintrag nennt Studie, Datum und die Zahl, an der das Urteil hängt.
 *   Ein Eintrag ohne Quelle gehört hier nicht hinein.
 * - Liegt für denselben Schlüssel später ein Messmaschinen-Protokoll vor, gewinnt
 *   das Protokoll: die Leser (depot.js, triggerBelegstand) fragen diese Datei nur,
 *   wenn kein Protokoll da ist.
 */
(function () {
  var EINTRAEGE = {
    donchian: {
      befund: 'Signalstudie 2026-08: in keiner Marktlage überzufällig — 0 von 51 Kandidaten der Studie bestätigt.',
      quelle: 'studien/signalstudie-2026-08/BERICHT.md, 23.08.2026',
      datum: '2026-08-23'
    },
    squeeze: {
      befund: 'Signalstudie 2026-08: in keiner Marktlage überzufällig — 0 von 51 Kandidaten der Studie bestätigt.',
      quelle: 'studien/signalstudie-2026-08/BERICHT.md, 23.08.2026',
      datum: '2026-08-23'
    },
    ruecksetzer: {
      befund: 'Signalstudie 2026-08 (dort "Pullback"): in keiner Marktlage überzufällig — 0 von 51 Kandidaten bestätigt.',
      quelle: 'studien/signalstudie-2026-08/BERICHT.md, 23.08.2026',
      datum: '2026-08-23'
    },
    kanaltrend: {
      befund: 'Abschnittskanäle-Studie: als Handelsbedingung schädlich (−0,17 Pp, t = −4,1); der Kanal ist seither nur Anzeige. Erster Backtest zuvor: −39 % bei Gegenprobe p = 0,86.',
      quelle: 'Abschnittskanäle-Befund 22.08.2026 (PROJEKTSTAND) + Backtest 21.08.2026 (quant.js, SETUP_ALLOW)',
      datum: '2026-08-22'
    }
  };
  window.StudienUrteile = {
    /** Liefert die dokumentierte Verwerfung zu einem Auslöser-/Modus-Schlüssel,
     *  oder null. Mehr Urteilsarten gibt es hier absichtlich nicht (s. Kopf). */
    verworfen: function (k) { return EINTRAEGE[k] || null; }
  };
})();
