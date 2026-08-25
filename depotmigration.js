'use strict';
/* ================= Depot laden: Reparatur und Einmal-Migrationen =================
 *
 * Stufe E des Struktur-Plans, letzter Baustein: der Lade- und Migrationsteil von
 * init(), WOERTLICH umgezogen - reine Datenlogik, kein DOM ausser dem Warnband der
 * Sicherungs-Meldung. Jede Migration ist einmalig, traegt ihr Flag im Store und
 * ihren Eintrag im Experiment-Journal; hier stehen sie einzeln nachlesbar.
 *
 * laufen(D, deps) MUTIERT das uebergebene Depot-Objekt (das ist sein Zweck) und
 * gibt zurueck, ob gespeichert werden muss. Es laeuft genau EINMAL, synchron,
 * direkt nach dem Laden - deshalb hier kein Getter-Muster wie in den anderen
 * Stufe-E-Modulen. */
(function () {
  /* Q und U sind echte Fenster-Globals erst ueber ihre Langnamen - die Kurznamen
   * waren depot-lokal. Genau daran ist die erste Fassung dieses Moduls zur Laufzeit
   * gescheitert (init-Abbruch mit Warnband), waehrend Linter und Textmarken gruen
   * blieben: der Linter fuehrt Q/U als globals. Der Funktionstest der isolierten
   * Instanz hat es gefangen. */
  var Q = window.Quant, U = window.U;

  function laufen(D, deps) {
    var repairOrphans = deps.repairOrphans;
    var altlastSchliessen = deps.altlastSchliessen;
    var messSchnittSetzen = deps.messSchnittSetzen;
    var defaultDepot = deps.defaultDepot;
    var warnbandSetzen = deps.warnbandSetzen;
    var automatikDarf = deps.automatikDarf;
    /* Kam der Bestand aus einer Sicherungsgeneration (Hauptdatei unlesbar), muss
     * das SICHTBAR sein - vorher wurde daraus kommentarlos ein Werksreset. Die
     * Markierung fliegt raus, bevor der naechste save() sie mitschreiben wuerde. */
    if (D.__ausSicherung) {
      var gen = D.__ausSicherung; delete D.__ausSicherung;
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'sicherung-' + Date.now(), at: Date.now(), quelle: 'sicherung',
        applied: ['Depot aus Sicherungskopie geladen (' + gen + ')'],
        txt: 'Die Depot-Datei war unlesbar. Geladen wurde die Sicherungskopie ' + gen +
          ' (höchstens ~10 Minuten alt bei laufender App). Positionen und Protokoll bitte einmal auf Plausibilität ansehen.' });
      setTimeout(function () {
        warnbandSetzen('sicherung', '<b>Depot aus Sicherungskopie geladen</b> – die Hauptdatei war unlesbar. ' +
          'Der Stand ist höchstens ~10 Minuten älter als der letzte Betrieb. Einzelheiten im Experiment-Journal.', true);
      }, 500);
    }
    if (!D.positions) D.positions = [];
    if (!D.trades) D.trades = [];
    // Nach dem Laden sind Position und Protokoll-Eintrag getrennte JSON-Kopien.
    // Wieder auf dasselbe Objekt zeigen lassen – sonst bleibt der Protokoll-Eintrag beim
    // Schließen „offen“ und repairOrphans erzeugt daraus später eine Doppel-Gutschrift.
    (function () {
      var byId = {};
      D.trades.forEach(function (t) { if (t.id != null) byId[t.id] = t; });
      D.positions = D.positions.map(function (p) { return (p.id != null && byId[p.id]) ? byId[p.id] : p; });
    })();
    var repaired = repairOrphans(); // Buchhaltung geradeziehen, bevor irgendetwas rechnet
    var altlast = altlastSchliessen();
    // Einmaliger Messschnitt: Alles, was vor dieser Version entstanden ist, war durch den
    // Buchungsfehler verfälscht. Es bleibt erhalten, zählt aber in keiner Statistik mehr mit.
    var messNeu = 0;
    if (D.messStart === undefined) {
      messNeu = messSchnittSetzen('Automatischer Schnitt beim Update – Altbestand aus der Zeit des Buchungsfehlers');
    }
    // Abwärtskompatibel, falls Felder fehlen – auch eine Ebene tief (z. B. stats.ki,
    // intraday.budgetPct), sonst bekommt ein alter Store neue Unterfelder nie und
    // nachgelagerte Rechnungen laufen still auf undefined/NaN.
    /* ABER: Der Merge füllt fehlende Felder mit den VOREINSTELLUNGEN FÜR NEUE
     * INSTALLATIONEN – und die zeigen seit 8.22 bewusst zur Evidenz (Basiswert,
     * Bücher an, Risikostufe 3). Bei einem BESTANDS-Store ist das eine stille
     * Verhaltensänderung: Die erste externe Diagnose (#3) zeigte einen Tester, dessen
     * alte breakout-Konfiguration plötzlich Aktien statt Scheine handelte und dessen
     * Momentum-Buch 19 Positionen kaufte, ohne dass er je einen Schalter angefasst
     * hatte. Deshalb: Der Ist-Zustand VOR dem Merge wird festgehalten, und Bestände
     * bekommen für diese vier Felder die konservativen Altwerte zurück. Umstellen
     * ist eine Entscheidung – dafür gibt es den Knopf im Strategien-Tab. */
    var warBestand = D.rechenstand !== undefined || (D.trades && D.trades.length > 0);
    var hatteVorMerge = {
      instrument: !!(D.intraday && D.intraday.instrument !== undefined),
      momentumAn: D.momentumAn !== undefined,
      driftAn: D.driftAn !== undefined,
      maxRisikostufe: D.maxRisikostufe !== undefined
    };
    var def = defaultDepot();
    Object.keys(def).forEach(function (k) {
      if (D[k] === undefined) { D[k] = def[k]; return; }
      if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && D[k] && typeof D[k] === 'object' && !Array.isArray(D[k])) {
        Object.keys(def[k]).forEach(function (k2) { if (D[k][k2] === undefined) D[k][k2] = def[k][k2]; });
      }
    });
    if (warBestand) {
      var zurueck = [];
      if (!hatteVorMerge.instrument && D.intraday.instrument !== 'schein') { D.intraday.instrument = 'schein'; zurueck.push('Instrument bleibt Hebelschein'); }
      if (!hatteVorMerge.momentumAn && D.momentumAn) { D.momentumAn = false; zurueck.push('Momentum-Buch bleibt aus'); }
      if (!hatteVorMerge.driftAn && D.driftAn) { D.driftAn = false; zurueck.push('Drift-Buch bleibt aus'); }
      if (!hatteVorMerge.maxRisikostufe && D.maxRisikostufe !== 5) { D.maxRisikostufe = 5; zurueck.push('Risikostufe bleibt unbegrenzt'); }
      if (zurueck.length) {
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'bestandsschutz-' + Date.now(), at: Date.now(), quelle: 'sicherung',
          applied: zurueck,
          txt: 'Die neuen Voreinstellungen gelten nur für neue Installationen – dein bestehendes Depot ' +
            'behält sein Verhalten (' + zurueck.join(', ') + '). Wer auf die gemessenen Einstellungen ' +
            'wechseln will: Knopf „Belegte Voreinstellungen übernehmen“ im Reiter „Regeln“.' });
      }
    }
    /* Gesamtzaehler ueber alle Sitzungen. Die HEALTH-Zaehler beginnen bei jedem
     * Start wieder bei null - die erste Tester-Diagnose kam eine Minute nach dem
     * Start, und alle Betriebszahlen standen auf 0: nichtssagend. Hier wird jede
     * Sitzung aufsummiert, damit die Diagnose auch das GESAMTE Leben der
     * Installation erzaehlt (wie viele Sitzungen, wie viel Laufzeit, wie viele
     * Abruffehler insgesamt). */
    if (!D.gesamtzaehler) {
      D.gesamtzaehler = { seit: Date.now(), sitzungen: 0, laufzeitMin: 0, scans: 0, scanErrors: 0,
        fetchOk: 0, fetchFail: 0, kiOk: 0, kiFail: 0, killSwitch: 0, staleBars: 0, workerFail: 0 };
    }
    D.gesamtzaehler.sitzungen = (D.gesamtzaehler.sitzungen || 0) + 1;
    /* Einmalig: Die Stunden-Strategie wurde am 21.08.2026 vermessen (24.727
     * Signale, 189 Werte, 8 Jahre, Studien-Methodik) und ist WIDERLEGT - ihr
     * Technik-Score ist ein Kontraindikator (-0,74 Pp auf 20 Tage, t=-11,6,
     * beide Zeithaelften negativ; mit Elliott -1,0 Pp), und darauf zahlt sie
     * Schein-Spanne plus tagelanges Theta. Sie wird EINMAL abgeschaltet, mit
     * sichtbarem Protokoll-Eintrag. Wer sie danach von Hand wieder einschaltet,
     * entscheidet bewusst gegen die Messung - das wird respektiert und nie
     * wieder automatisch angefasst (dieselbe Mechanik wie beim Blackout). */
    if (D.hourlyWiderlegtGeprueft === undefined) {
      D.hourlyWiderlegtGeprueft = 1;
      if (D.hourlyEnabled !== false) {
        D.hourlyEnabled = false;
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'sicherung-' + Date.now(), at: Date.now(), quelle: 'sicherung',
          applied: ['Stunden-Strategie aus (Messung: Kontraindikator)'],
          txt: 'Die Stunden-Strategie wurde vermessen (24.727 Signale, 189 Werte, 8 Jahre): Ihr Technik-Score ist ein ' +
            'Kontraindikator (−0,74 Pp auf 20 Tage, t=−11,6) – dazu Schein-Kosten über Tage. Sie wurde einmalig ' +
            'abgeschaltet. Einschalten bleibt jederzeit möglich (Reiter „Regeln → ' +
            'Schalter & Einstellungen“, im Archiv) und wird danach nie wieder automatisch geändert.' });
      }
    }
    /* Einmalig: Wer die belegte Kante ueber die Auslöser-Liste gewaehlt hatte, sass
     * danach auf 1-Minuten-Kerzen - die alte applySetup-Regel stellte jeden
     * Umkehr-Auslöser stur auf 1m, und der Formular-Klick sperrte Zeitrahmen und
     * Haltedauer zugleich gegen jede Automatik. Gemessen wurde auf 60m. Einmal
     * geradeziehen, sichtbar im Protokoll, danach nie wieder automatisch. */
    if (D.rsi2seitZeitrahmenGeprueft === undefined) {
      D.rsi2seitZeitrahmenGeprueft = 1;
      var mB = D.intraday.mode;
      if ((mB === 'rsi2seit' || mB === 'kapitulation') && D.intraday.interval !== '60m') {
        var altIv = D.intraday.interval;
        D.intraday.interval = '60m';
        D.intraday.scalpHold = (mB === 'kapitulation') ? 1560 : 480;
        /* Die Hand-Sperre bleibt bewusst STEHEN: Der Nutzer hat diese Felder von Hand
         * berührt, also gehören sie weiterhin ihm. Die Sicherung korrigiert einmalig
         * den Wert - sie gibt die Felder nicht an die Automatik zurück. */
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'sicherung-' + Date.now(), at: Date.now(), quelle: 'sicherung',
          applied: ['Zeitrahmen ' + altIv + ' → 60m', 'Haltedauer → ' + D.intraday.scalpHold + ' Min'],
          txt: 'Die belegte Kante war auf ' + altIv + '-Kerzen eingestellt, gemessen wurde sie auf 60-Minuten-Kerzen. ' +
            'Ursache war ein Fehler in der Auslöser-Auswahl, der jeden Umkehr-Auslöser auf 1 Minute stellte. ' +
            'Einmalig auf die gemessene Einstellung zurückgesetzt – jede Änderung von Hand bleibt ab jetzt unangetastet.' });
      }
    }
    // Einmalig: Das Event-Blackout ist eine Sicherung, keine Stellschraube. Steht es aus,
    // wird es beim Update einmal zurückgesetzt – sichtbar im Verlauf, danach nie wieder automatisch.
    if (D.blackoutGeprueft === undefined) {
      D.blackoutGeprueft = 1;
      if (D.intraday.blackout === 'off') {
        D.intraday.blackout = 'block';
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'sicherung-' + Date.now(), at: Date.now(), quelle: 'sicherung',
          applied: ['Event-Blackout → ±45 Min'], txt: 'Sicherheitsfilter war ausgeschaltet und wurde einmalig zurückgesetzt. Keine Automatik darf ihn abschalten.',
          konfigVorher: null, konfigNachher: JSON.parse(JSON.stringify(D.intraday)) });
      }
    }
    // Einmalig: Die Trefferquoten-Zähler (D.stats) stammen noch aus der Zeit vor dem
    // Messschnitt – die Trades wurden markiert, die kumulierten Zähler aber nie geleert.
    if (D.messStart && !D.statsBereinigt) {
      D.statsBereinigt = Date.now();
      Object.keys(D.stats || {}).forEach(function (sk) {
        if (D.stats[sk] && typeof D.stats[sk].r === 'number') { D.stats[sk].r = 0; D.stats[sk].w = 0; }
      });
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'sicherung-stats-' + Date.now(), at: Date.now(), quelle: 'sicherung',
        applied: ['Trefferquoten-Zähler geleert'], txt: 'Die Trefferquoten zählten noch Trades aus der Zeit des Buchungsfehlers mit. Einmalig auf null gesetzt – ab jetzt zählen nur saubere Messdaten.',
        konfigVorher: null, konfigNachher: null });
      messNeu = messNeu || 1;
    }
    // Einmalig: Blitz (Trades von max. 3 Minuten) mit einem Cooldown von 30+ Minuten
    // widerspricht sich selbst – der Modus-Standard (2 Min) soll gelten. Der Wert stammte
    // aus der alten Ausbruch-Voreinstellung und hatte nie ein eigenes Formularfeld.
    if (!D.cooldownGeprueft) {
      D.cooldownGeprueft = 1;
      if (D.intraday.exitStyle === 'blitz' && D.intraday.cooldownMin != null && D.intraday.cooldownMin >= 30) {
        var altCd = D.intraday.cooldownMin;
        D.intraday.cooldownMin = null;   // Modus-Standard greift (Blitz: 2 Min)
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'sicherung-cd-' + Date.now(), at: Date.now(), quelle: 'sicherung',
          applied: ['Cooldown ' + altCd + ' Min → Modus-Standard (Blitz: 2 Min)'],
          txt: 'Blitz steigt nach spätestens 3 Minuten aus – ein ' + altCd + '-Minuten-Cooldown je Symbol ließ davon fast nichts übrig. Der Wert stammte aus der alten Ausbruch-Voreinstellung.',
          konfigVorher: null, konfigNachher: JSON.parse(JSON.stringify(D.intraday)) });
      }
    }
    // Kostenmodell v2 (Cent-Spread): fruehere Messwerte sind nicht mehr vergleichbar -
    // die Zwei-Naechte-Bestaetigung startet neu, damit kein alter Sieger mit neuen Zahlen
    // gemischt wird. Einmalig, sichtbar im Journal.
    // Kostenmodell v3: an echten Emittenten-Kursen kalibriert (onvista, 20.08.2026) und um
    // das Bezugsverhaeltnis erweitert. Frueher gemessene Ergebnisse sind damit erneut
    // nicht vergleichbar - Bestaetigungs-Kette startet neu, Ordergebuehr auf 0 (Capital.com).
    // Rechenstand-Kopplung: greift bei JEDER kuenftigen Aenderung der Rechenweise
    if (D.rechenstand !== Q.RECHENSTAND) {
      var alterStand = D.rechenstand;
      D.rechenstand = Q.RECHENSTAND;
      // Das News-Gewicht war bis Stand 7 auf 0,35 - ein Wert, der nie gemessen wurde.
      // Wer ihn selbst veraendert hat, behaelt seine Einstellung; nur der alte
      // Vorgabewert wird ersetzt.
      if (D.weights && Math.abs(D.weights.news - 0.35) < 0.001 && Math.abs(D.weights.tech - 0.40) < 0.001) {
        D.weights = { news: 0.15, tech: 0.55, elliott: 0.30 };
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'newsgewicht-' + Date.now(), at: Date.now(), quelle: 'messung',
          applied: ['News-Gewicht 35 % -> 15 %'],
          txt: 'Das News-Sentiment hatte 35 % Gewicht in jeder Entscheidung, ist aber nie ' +
            'geprueft worden: es gibt keine historischen Schlagzeilen, im Backtest faellt ' +
            'das Gewicht deshalb heraus. Unbelegt ist nicht widerlegt - aber 35 % sind zu ' +
            'viel Vertrauen dafuer. Ab jetzt wird jede Schlagzeile mit Zeitstempel ' +
            'archiviert; sobald genug zusammenkommt, wird die Frage messbar.' });
      }
      if (D.autoOpt) {
        var wegg = [];
        if (D.autoOpt.entdeckt) wegg.push('Tiefensuche-Fund');
        if (D.autoOpt.kiKandidat) wegg.push('KI-Kandidat');
        if (D.autoOpt.pending) wegg.push('vorgemerkte Empfehlung');
        if (D.autoOpt.zucht && (D.autoOpt.zucht.ueberlebende || []).length) wegg.push('Zucht-Population');
        D.autoOpt.entdeckt = null; D.autoOpt.kiKandidat = null; D.autoOpt.pending = null;
        D.autoOpt.tiefensuche = null; D.autoOpt.lastRecKey = null; D.autoOpt.filterBilanzVorher = null;
        D.autoOpt.zucht = { gen: 0, ueberlebende: [], gesehen: [] };
        D.autoOpt.lastTief = 0;
        if (alterStand !== undefined && wegg.length) {
          if (!D.tuneLog) D.tuneLog = [];
          D.tuneLog.unshift({ id: 'rechenstand-' + Date.now(), at: Date.now(), quelle: 'sicherung',
            applied: ['Gespeicherte Ergebnisse verworfen'],
            txt: 'Die Rechenweise hat sich geaendert (Stand ' + alterStand + ' -> ' + Q.RECHENSTAND + '). ' +
              'Damit sind alle frueher gemessenen Ergebnisse nicht mehr vergleichbar. Verworfen: ' +
              wegg.join(', ') + '. Die naechste Messung faengt sauber an.' });
        }
      }
    }
    if (!D.kostenModellV3) {
      D.kostenModellV3 = Date.now();
      // Auch der Tiefensuche-Fund und der KI-Kandidat stammen aus der alten Kostenwelt.
      // Sie traeten sonst in der naechsten Messung an, obwohl ihr Vorsprung auf einem
      // Spread-Modell beruht, das es nicht mehr gibt - gemessen an echten Kursen war der
      // alte Aufschlag fuer teure Scheine dreifach zu hoch und fuer Pfennig-Scheine zu
      // niedrig. Ein Fund mit Bezugsverhaeltnis 0,1 ist damit wertlos.
      if (D.autoOpt) {
        D.autoOpt.lastRecKey = null; D.autoOpt.pending = null; D.autoOpt.filterBilanzVorher = null;
        D.autoOpt.entdeckt = null; D.autoOpt.kiKandidat = null; D.autoOpt.tiefensuche = null;
        D.autoOpt.lastTief = 0;   // Tiefensuche darf sofort neu laufen, nicht erst morgen
      }
      var alteGebuehr = D.intraday.orderFee;
      if (alteGebuehr === 1.5 && automatikDarf('orderFee')) D.intraday.orderFee = 0;
      // atm21 -> atm21_b: identische Laufzeit, identischer Strike, identisches Omega,
      // aber nur ein Fuenftel des relativen Spreads. Kein Nachteil, nur billiger.
      var altesProfil = D.intraday.profile;
      if (altesProfil === 'atm21' && automatikDarf('profile')) D.intraday.profile = 'atm21_b';
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'sicherung-kosten3-' + Date.now(), at: Date.now(), quelle: 'sicherung',
        applied: ['Kostenmodell an echten Kursen kalibriert']
          .concat(D.intraday.orderFee !== alteGebuehr ? ['Ordergebuehr ' + alteGebuehr + ' -> 0'] : [])
          .concat(D.intraday.profile !== altesProfil ? ['Schein-Profil -> Bezugsverhaeltnis 1,0'] : []),
        txt: 'Echte Emittenten-Kurse (onvista) zeigen: der Spread ist ein fester Cent-Betrag, 1 ct bei Bezugsverhaeltnis 0,1 und 2 ct bei 1,0 - unabhaengig vom Preis. Ein 8-Euro-Schein zahlt 0,13 %, ein 9-Cent-Schein 11,5 %. Neu messbar sind daher Profile mit Bezugsverhaeltnis 1,0: gleicher Hebel, aber nur ein Fuenftel des relativen Spreads. Ordergebuehr steht auf 0, weil Capital.com keine Kommission berechnet. Alle frueheren Messwerte sind nicht mehr vergleichbar.',
        konfigVorher: null, konfigNachher: JSON.parse(JSON.stringify(D.intraday)) });
    }
    if (!D.kostenModellV2) {
      D.kostenModellV2 = Date.now();
      if (D.autoOpt) { D.autoOpt.lastRecKey = null; D.autoOpt.pending = null; }
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'sicherung-kosten-' + Date.now(), at: Date.now(), quelle: 'sicherung',
        applied: ['Kostenmodell -> Cent-Spread'],
        txt: 'Spread wird jetzt als Cent-Betrag je Schein simuliert (so stellen Emittenten ihre Kurse), nicht mehr als Pauschal-Prozentsatz. Teurere Scheine (ATM/laengere Laufzeit) zahlen relativ weniger - alle frueheren Messwerte sind damit nicht mehr vergleichbar, die Bestaetigungs-Kette der Nacht-Messung startet neu.',
        konfigVorher: null, konfigNachher: null });
    }
    // v8-Migration: Die Strategie-Farm ist durch den Autopiloten ersetzt. Der alte
    // Farm-Stand bleibt als farmAlt einsehbar (Export), steuert aber nichts mehr.
    if (D.farm && !D.v8Migriert) {
      D.v8Migriert = Date.now();
      D.farmAlt = D.farm;
      delete D.farm;
      delete D.regimePending;
      ['farm', 'farmH', 'farmPop', 'farmGens', 'lastFarm', 'everyH', 'onlyRobust', 'marketPause', 'lastRun'].forEach(function (k) {
        if (D.autoOpt) delete D.autoOpt[k];
      });
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'sicherung-v8-' + Date.now(), at: Date.now(), quelle: 'sicherung',
        applied: ['Autopilot ersetzt Farm + Selbst-Optimierung'],
        txt: 'v8: Eine Automatik statt drei. Das Kursarchiv sammelt ab jetzt jede geladene Kursreihe (rollierend 90 Tage) – die nächtliche Messung wird damit von Woche zu Woche belastbarer. Die Marktlage () ist nur noch Anzeige. Der alte Farm-Stand liegt unverändert im Analyse-Export (strategieFarmAlt).',
        konfigVorher: null, konfigNachher: null });
      messNeu = messNeu || 1;
    }
    return { repaired: repaired, messNeu: messNeu };
  }
  window.DepotMigration = { laufen: laufen };
})();
