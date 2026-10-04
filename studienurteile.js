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
 *   FORTGESCHRIEBEN AM 04.10.2026 (Auftrag Nr. 71): es gewinnt das JÜNGERE Urteil.
 *   Anlass war der Kapitulations-Dip: sein Protokoll vom 26.08.2026 (alte Maschine)
 *   hätte die Neumessung vom 03.10.2026 überdeckt, die außerhalb der Messmaschine lief
 *   und deshalb hier steht. Entschieden wird das an EINER Stelle - gueltig() unten;
 *   depot.js ruft sie über belegKette(), alle anderen Leser über DepotAPI. Bei
 *   gleichem Datum und ohne Registereintrag bleibt es wie bisher beim Protokoll.
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
    },
    /* Neumessung des Kapitulations-Dips (Auftrag Nr. 68, 03.10.2026). Der erste Satz des
     * Befunds ist der Urteilssatz der Studie WÖRTLICH (lauf/stufe-b.json, urteil.satz -
     * Vorregistrierung §9/§11), der Vermerk zu den verschwundenen Reihen ist Pflicht
     * (ERGEBNIS.md). Jede Zahl in zahlen wird von test-v6.js gegen stufe-b.json gehalten.
     * etikett ist die Kennzeichnung, die Auswahl, Statuszeile und Regelkopf zeigen.
     * art und form (Auftrag Nr. 81, 04.10.2026): daraus setzt ueberholtKopf() unten den
     * Kopf, den das Scoreboard ÜBER das alte Messprotokoll schreibt. form ist urteil.form
     * der Studie WÖRTLICH - auch sie hält test-v6.js gegen stufe-b.json. */
    kapitulation: {
      etikett: 'Neumessung: zurückgewiesen',
      art: 'Neumessung',
      form: 'in der behaupteten Größe zurückgewiesen',
      befund: 'In der behaupteten Größe zurückgewiesen: obere Grenze +0,601 < 1,107 Pp (V2 netto −0,024 Pp je Signaltag, Band [−0,649; +0,601]). ' +
        'Neumessung vom 03.10.2026 auf sauberem Minutenarchiv mit den verschwundenen Reihen, 528 Signaltage im zuvor nie gemessenen Fenster 2016 bis 25.09.2023. ' +
        'Das Urteil hängt an der Buchung der verschwundenen Reihen (strenge Regel: nicht entscheidbar). ' +
        'Ein kleiner Effekt in Hürdengröße ist weder belegt noch ausgeschlossen.',
      zahlen: { nettoPp: -0.0238, band95: [-0.6489, 0.6014], signaltage: 528, se: 0.319, mde80: 0.8936, behauptetPp: 1.107 },
      quelle: 'studien/kapitulation-neu-2026-10-03/ERGEBNIS.md, 03.10.2026 · wiki/belegstand.md, Abschnitt „Kapitulation V2, Neumessung“',
      datum: '2026-10-03'
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
    /** DIE EINE KETTE (04.10.2026): hält das Messprotokoll (pk, oder null) gegen den
     *  Registereintrag desselben Schlüssels - das JÜNGERE Urteil gewinnt, bei gleichem
     *  Datum das Protokoll. Rückgabe { protokoll, register }, genau eines davon gesetzt,
     *  oder null, wenn es keines von beiden gibt. Kein Leser entscheidet das selbst. */
    gueltig: function (k, pk) {
      var v = EINTRAEGE[k] || null;
      if (pk && !(v && v.datum > String(pk.datum || ''))) return { protokoll: pk, register: null };
      return v ? { protokoll: null, register: v } : null;
    },
    /** Der Kopf über einem ÜBERHOLTEN Messprotokoll (Scoreboard, Auftrag Nr. 81):
     *  „Überholt durch Neumessung 03.10.2026 – in der behaupteten Größe zurückgewiesen".
     *  Art und Form stehen im Eintrag, der Tag ist sein datum - kein Leser setzt den
     *  Satz selbst zusammen. Ein Eintrag ohne art/form (die älteren Verwerfungen) ergibt
     *  „Überholt durch ein jüngeres Urteil vom …". */
    ueberholtKopf: function (v) {
      if (!v) return '';
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v.datum || ''));
      var tag = m ? m[3] + '.' + m[2] + '.' + m[1] : '';
      return 'Überholt durch ' + (v.art ? v.art + (tag ? ' ' + tag : '') : 'ein jüngeres Urteil' + (tag ? ' vom ' + tag : '')) +
        (v.form ? ' – ' + v.form : '');
    },
    /** Liefert das Vorwärtstest-Etikett zu einer Buch-Konfiguration, oder null.
     *  Mehr Urteilsarten gibt es hier absichtlich nicht (s. Kopf). */
    vorwaertstest: function (k) { return VORWAERTSTEST[k] || null; }
  };
})();
