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
 * - Seit 04.10.2026 (Auftrag Nr. 81) zusätzlich RÜCKBLICKE (unten): die beschreibende
 *   Zahl „Buch gegen S&P 500 über fünf Jahre" zu einer Buch-Konfiguration. Kein Urteil
 *   über eine Kante, nie „belegt", nie „bestätigt" - und jede Zahl wird von test-v6.js
 *   gegen ergebnis.json der Studie gehalten.
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
      befund: 'Abschnittskanäle-Studie: als Handelsbedingung schädlich (−0,17 Pp, t = −4,1); der Kanal ist seither nur Anzeige. Trendkanal auf Tagesbasis (09.09.2026): Kauf an der unteren Linie t −3,4 bis −4,3 gegen den Topf – als Einstieg in jeder Umsatzklasse zu.',
      quelle: 'Abschnittskanäle-Befund 22.08.2026 (PROJEKTSTAND) + wiki/belegstand.md, Abschnitt „Trendkanal auf Tagesbasis“ (09.09.2026)',
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
  /* RÜCKBLICKE (Auftrag Nr. 81, 04.10.2026). Wilhelms Regel hat zwei Stufen: Rückblick
   * über fünf Jahre nach Kosten gegen den S&P 500, dann einige Monate Vorwärtstest. Der
   * Vorwärtstest steht an der Karte des Buchs (massstab.js); hier steht der Rückblick -
   * eine BESCHREIBENDE Zahl, kein Urteil über eine Kante, deshalb weder „belegt" noch
   * „bestätigt". Je Buch-Konfiguration eine LISTE: ein weiterer Rückblick (anderer
   * Korb, anderes Fenster) kommt als weiterer Eintrag dazu, die Leser zeigen jede Zeile.
   * Aufgenommen wird nur ein zweifach gerechneter Rückblick; die Vorab-Rechnung des PM
   * mit dem engeren Korb (eine einzelne Rechnung) steht bewusst NICHT hier.
   * Jede Zahl in zahlen hält test-v6.js gegen ergebnis.json der Studie (auf eine
   * Nachkommastelle); der Text entsteht in rueckblickText() nur aus diesen Feldern.
   *
   * Seit Auftrag Nr. 91 (04.10.2026): die App rechnet seit Nr. 87 mit Regel K (kein Kauf
   * unter 5 % des Platzwerts) - deshalb überall die Fassung MIT Regel K aus
   * studien/momentum-korb-kleinst-2026-10-04/ergebnis.json (laeufe.<Lauf>.mit). Drei
   * Einträge in fester Reihenfolge: Korb 187 / 2021–2026, Korb 187 / 2017–2021, breiter
   * Markt / 2021–2026 (ersetzt den Eintrag ohne Regel K aus massstab-rueckblick v1).
   * medianAbstandPa ist der Median der 63 Startphasen (Pp pro Jahr), grenzen ein fester
   * Satz des PM. Für das Drift-Buch steht unter 'drift' der Rückblick aus Nr. 88 (art
   * 'zufall': gegen 200 Zufallsbücher statt über Startphasen).
   *
   * Seit Auftrag Nr. 95 (04.10.2026, Entscheide des PM zu B1 und A1 des Prüfgangs Nr. 83):
   * grenzen BEGINNT bei allen drei Momentum-Einträgen mit ZUFALL (Belegstand, Lesart zu
   * Nr. 78: das 95-%-Band schließt in allen fünf Läufen null ein - die Drift-Zeile nennt
   * ihren Zufallsvergleich schon in der Zeile). ZUFALL ist ein fester Satz des PM und
   * steht hinter „Grenzen:" - der Kleinsttest 10 prüft dort keine Zahl.
   *
   * Seit Auftrag Nr. 96 (04.10.2026): die drei Momentum-Einträge stehen auf dem bereinigten
   * Panel v2.3 - dieselbe Regel und derselbe Rechner wie Nr. 85, nachgerechnet in
   * studien/momentum-korb-v23-2026-10-04/ (ergebnis.json, laeufe.<Lauf>.mit). Der
   * Halbsatz zu den doppelten Reihen (Vorgänger-Kürzel) ist aus grenzen weggefallen: das
   * Panel ist bereinigt. */
  var ZUFALL = 'vom Zufall nicht zu trennen (je Umschichtungsperiode schließt das 95-%-Band des Abstands null ein)';
  var RUECKBLICK = {
    'momentum-liquide': [
      {
        kennung: 'momentum-korb-v23-2026-10-04/v1',
        lauf: 'B-187',
        korb: 'Korb der 187 umsatzstärksten Werte am Stichtag (nicht die Liste der App)',
        regel: 'mit Regel K',
        zahlen: { von: '2021-09-16', bis: '2026-09-15', buchGesamt: 150.1, spyGesamt: 81.2, schlaegt: true,
          phasenVorn: 61, phasen: 63, medianAbstandPa: 8.2, rueckschlagBuch: -56.9, rueckschlagSpy: -24.5 },
        grenzen: ZUFALL + '; der Vorsprung stammt aus einem Schub (2024/25); vor Steuern (im Rechenmodell nach Steuern rund 2,4 Pp pro Jahr weniger)',
        quelle: 'studien/momentum-korb-v23-2026-10-04/ERGEBNIS.md, Lauf B-187 mit Regel K, Panel v2.3, 04.10.2026',
        datum: '2026-10-04'
      },
      {
        kennung: 'momentum-korb-v23-2026-10-04/v1',
        lauf: 'A-187',
        korb: 'Korb der 187 umsatzstärksten Werte am Stichtag (nicht die Liste der App)',
        regel: 'mit Regel K',
        zahlen: { von: '2017-01-04', bis: '2021-09-15', buchGesamt: 159.2, spyGesamt: 115.5, schlaegt: true,
          phasenVorn: 63, phasen: 63, medianAbstandPa: 7.3, rueckschlagBuch: -49.0, rueckschlagSpy: -33.8 },
        grenzen: ZUFALL + '; der Vorsprung stammt aus einem Schub (2020); vor Steuern (im Rechenmodell nach Steuern rund 2,4 Pp pro Jahr weniger)',
        quelle: 'studien/momentum-korb-v23-2026-10-04/ERGEBNIS.md, Lauf A-187 mit Regel K, Panel v2.3, 04.10.2026',
        datum: '2026-10-04'
      },
      {
        kennung: 'momentum-korb-v23-2026-10-04/v1',
        lauf: 'B-breit',
        korb: 'breiter Markt (alle zulässigen Werte, nicht die Liste der App)',
        regel: 'mit Regel K',
        zahlen: { von: '2021-09-16', bis: '2026-09-15', buchGesamt: 64.0, spyGesamt: 81.2, schlaegt: false,
          phasenVorn: 43, phasen: 63, medianAbstandPa: 1.7, rueckschlagBuch: -40.3, rueckschlagSpy: -24.5 },
        grenzen: ZUFALL + '; vor Steuern (im Rechenmodell nach Steuern, ohne Regel K: −2,20 Pp pro Jahr hinter dem Indexfonds)',
        quelle: 'studien/momentum-korb-v23-2026-10-04/ERGEBNIS.md, Lauf B-breit mit Regel K, Panel v2.3, 04.10.2026',
        datum: '2026-10-04'
      }
    ],
    'drift': [
      {
        kennung: 'vorregistrierung-2026-10-04-ergebnis-drift/v1',
        art: 'zufall',
        korb: 'Kauf nach den stärksten Überraschungen (40 Plätze, 60 Handelstage, nur Kaufseite – nicht die Regel dieses Buchs)',
        lage: 'knapp davor',
        zahlen: { von: '2021-09-16', bis: '2026-09-15', buchGesamt: 84.2, spyGesamt: 81.2, schlaegt: true,
          zufallUeber: 16, zufallBuecher: 200, vorwaertstest: false, rueckschlagBuch: -21.6, rueckschlagSpy: -24.5 },
        quelle: 'studien/vorregistrierung-2026-10-04-ergebnis-drift/ERGEBNIS.md, Stufe 2, 04.10.2026',
        datum: '2026-10-04'
      }
    ]
  };
  /* ALTE BELEGE (Auftrag Nr. 91): Sätze, die nur am Universum der Überlebenden gemessen
   * sind (Werte, die es heute noch gibt). Sie bleiben stehen; darüber steht dieser Kopf -
   * an jeder Stelle derselbe Wortlaut, nur von hier (belegeKopf). Der Tag kommt aus dem
   * ersten Rückblick-Eintrag desselben Schlüssels. */
  var ALTE_BELEGE = {
    /* karte (Auftrag Nr. 95, B3): wo die Zeile Rückblick steht - zwei der drei Stellen des
     * Kopfs (Werkzeuge → Betrieb, Erklärfenster) haben sie nicht in Sichtweite. */
    'momentum-liquide': { grund: 'gemessen nur an Werten, die es heute noch gibt (ohne die verschwundenen)', karte: 'Momentum-Buchs' }
  };
  /* Satz zum Buch neben seinen Rückblick-Zeilen (Auftrag Nr. 95, B5, Wortlaut des PM). */
  var BUCH_SATZ = {
    'drift': 'Das Buch läuft als Simulation weiter; seine eigene Regel (Kauf und Leerverkauf, 60 Handelstage) ist nicht gemessen – kein Kandidat für echtes Geld.'
  };
  function pzDe(x) { return (x < 0 ? '−' : '+') + Math.abs(x).toFixed(1).replace('.', ',') + ' %'; }
  function ppDe(x) { return (x < 0 ? '−' : '+') + Math.abs(x).toFixed(1).replace('.', ',') + ' Pp'; }
  function tagDe(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); return m ? m[3] + '.' + m[2] + '.' + m[1] : String(iso || ''); }
  window.StudienUrteile = {
    /** Die Rückblicke zu einer Buch-Konfiguration - eine Liste, möglicherweise leer. */
    rueckblicke: function (k) { return RUECKBLICK[k] || []; },
    /** EIN Rückblick als Zeile, wie Karte und Antwort-Seite ihn zeigen - nur aus den
     *  Feldern des Eintrags: „Rückblick 16.09.2021 bis 15.09.2026, Korb der 187
     *  umsatzstärksten Werte am Stichtag (nicht die Liste der App), mit Regel K: Buch
     *  +150,1 % gegen S&P 500 +81,2 % – geschlagen; je nach Starttag in 61 von 63 Fällen
     *  vorn, in der Mitte +8,2 Pp pro Jahr; größter Rückschlag −56,9 % gegen −24,5 %.
     *  Grenzen: …". Art 'zufall' (Drift-Buch) nennt statt der Startphasen die
     *  Zufallsbücher über dem Buch und ob ein Vorwärtstest angezeigt ist. */
    rueckblickText: function (r) {
      var z = r.zahlen;
      var kopf = 'Rückblick ' + tagDe(z.von) + ' bis ' + tagDe(z.bis) + ', ' + r.korb + (r.regel ? ', ' + r.regel : '') +
        ': Buch ' + pzDe(z.buchGesamt) + ' gegen S&P 500 ' + pzDe(z.spyGesamt) + ' – ';
      var fuss = 'größter Rückschlag ' + pzDe(z.rueckschlagBuch) + ' gegen ' + pzDe(z.rueckschlagSpy) + '.' +
        (r.grenzen ? ' Grenzen: ' + r.grenzen + '.' : '');
      if (r.art === 'zufall') {
        return kopf + (r.lage || (z.schlaegt ? 'davor' : 'dahinter')) + ', aber ' + z.zufallUeber + ' von ' + z.zufallBuecher +
          ' Zufallsbüchern liegen darüber: ' + (z.vorwaertstest ? 'Vorwärtstest angezeigt' : 'kein Vorwärtstest angezeigt') + '; ' + fuss;
      }
      return kopf + (z.schlaegt ? 'geschlagen' : 'nicht geschlagen') + '; je nach Starttag in ' + z.phasenVorn + ' von ' + z.phasen +
        ' Fällen vorn, in der Mitte ' + ppDe(z.medianAbstandPa) + ' pro Jahr; ' + fuss;
    },
    /** Der Kopf über ALTEN Belegen (Auftrag Nr. 91, nach dem Muster von ueberholtKopf):
     *  „Überholt: gemessen nur an Werten, die es heute noch gibt (ohne die
     *  verschwundenen). Maßgeblich ist der Rückblick vom 04.10.2026 gegen den S&P 500 –
     *  siehe die Zeile Rückblick auf der Karte des Momentum-Buchs (Heute → Bestand)." (Ort
     *  seit Auftrag Nr. 95.) Leer, wenn es zum Schlüssel keinen gibt. EINE Quelle
     *  für drei Stellen: strategien.js (Belege hinter dem i der Karte), app-shell.js
     *  (Erklärung Momentum) und index.html (#mfErklaerung, gefüllt unten). */
    belegeKopf: function (k) {
      var a = ALTE_BELEGE[k], r = RUECKBLICK[k] && RUECKBLICK[k][0];
      if (!a || !r) return '';
      return 'Überholt: ' + a.grund + '. Maßgeblich ist der Rückblick vom ' + tagDe(r.datum) + ' gegen den S&P 500 – siehe die Zeile ' +
        'Rückblick auf der Karte des ' + a.karte + ' (Heute → Bestand).';
    },
    /** Der Satz zum BUCH neben seinen Rückblick-Zeilen (Auftrag Nr. 95, B5) - leer, wenn es
     *  keinen gibt. Für das Drift-Buch: warum es läuft, obwohl seine Rückblick-Zeile „kein
     *  Vorwärtstest angezeigt" sagt. Ein fester Satz des PM; er steht bewusst NICHT in
     *  rueckblickText (der Kleinsttest 10 hält jede Zahl dort gegen die Ergebnisdatei, die
     *  60 Handelstage der Buch-Regel stehen in keiner). Leser: Karte des Buchs (mfdepot.js)
     *  und Antwort-Seite (strategien.js), je einmal unter den Rückblick-Zeilen. */
    buchSatz: function (k) { return BUCH_SATZ[k] || ''; },
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
  /* Feste Stellen im Markup (index.html) tragen einen leeren Behälter mit
   * data-belege-kopf="<Schlüssel>"; der Satz kommt von hier, damit er an jeder Stelle
   * wortgleich ist. Das Skript steht am Ende von index.html - die Behälter gibt es schon. */
  if (typeof document !== 'undefined' && document.querySelectorAll) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-belege-kopf]'), function (el) {
      el.textContent = window.StudienUrteile.belegeKopf(el.getAttribute('data-belege-kopf'));
    });
  }
})();
