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
 * - Seit 02.09.2026 zusätzlich VORWÄRTSTEST-Etiketten (unten): das wörtliche Urteil einer
 *   vorregistrierten Studie zu genau der Konfiguration, die ein Buch der App handelt.
 *   Nie „belegt", nie „bestätigt" — und jede Zahl wird von test-v6.js gegen die Rohdaten
 *   der Studie (lauf-*.json) gehalten. Eine Zahl, die dort nicht steht, macht die Suite rot.
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
  /* Vorwärtstest-Etiketten (Wilhelms Entscheid 02.09.2026): Das Momentum-Buch handelt
   * EXAKT die gemessene liquide Konfiguration; ab der ersten Umschichtung auf dem
   * liquiden Korb ist jede weitere ein Out-of-Sample-Beleg, den die Studie nicht kennen
   * konnte. Das Urteil steht hier WÖRTLICH wie in ERGEBNIS.md („lebt" nach registrierter
   * Regel — In-Sample, am Rand), das Datum des Vorwärtstests hängt der Leser
   * (strategien.js) aus dem Buch selbst an (DepotAPI.regelStatus().<buch>). */
  var VORWAERTSTEST = {
    'momentum-liquide': {
      urteil: 'lebt',
      etikett: 'In-Sample, am Rand',
      buch: 'momentumBuch',
      befund: 'Monats-Momentum, liquider Korb (Median-Tagesumsatz ≥ 100 Mio $, 20 Balken, Punkt-in-Zeit): brutto +1,835 Pp je Umlauf, se 0,911, t 2,02 über 79 Perioden, Band [+0,050, +3,620]. Untere Grenze 0,05 über null; bei Familienschwelle 2,638 schließt das Band null ein. Kein „belegt".',
      zahlen: { bruttoPp: 1.835, se: 0.911, t: 2.02, perioden: 79, untereGrenze95: 0.050, obereGrenze95: 3.620, umsatzMin: 100000000, rueckblick: 231, luecke: 21, halten: 63 },
      quelle: 'studien/vorregistrierung-2026-09-02-momentum-liquide/ERGEBNIS.md, 02.09.2026',
      datum: '2026-09-02'
    }
  };
  window.StudienUrteile = {
    /** Liefert die dokumentierte Verwerfung zu einem Auslöser-/Modus-Schlüssel,
     *  oder null. */
    verworfen: function (k) { return EINTRAEGE[k] || null; },
    /** Liefert das Vorwärtstest-Etikett zu einer Buch-Konfiguration, oder null.
     *  Mehr Urteilsarten gibt es hier absichtlich nicht (s. Kopf). */
    vorwaertstest: function (k) { return VORWAERTSTEST[k] || null; }
  };
})();
