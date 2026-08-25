'use strict';
/* KI-Musterdepot: stündlicher Job (News + Technik + Elliott), synthetische
   Optionsscheine (Black-Scholes), Trade-Protokoll, Trefferquoten, Backtest.
   SIMULATION – keine Anlageberatung. */
(function () {
  var Q = window.Quant, U = window.U;
  /* 100.000 statt 10.000 (Wilhelm, 23.08.2026). Bei 10.000 $ war die groesstmoegliche
   * Position mit Klumpen-Deckel 8 genau 1.250 $; gegen einen Broker mit fester
   * Ordergebuehr liegt der Break-even ohne Hebel bei rund 4.100 $ - unerreichbar.
   * Betrifft NUR neue Depots. Ein laufendes Buch wird nicht angefasst; dafuer gibt es
   * die Aufstockung in den Einstellungen, die den Verlauf erhaelt. */
  var START_CAPITAL = 100000;
  var OPEN_THR = 0.35, CLOSE_THR = 0.25, BUDGET = 0.05, SL = -0.40, TP = 0.80;

  var D = null; // Depot-State
  var jobRunning = false;

  function defaultDepot() {
    return {
      cash: START_CAPITAL, positions: [], trades: [],
      stats: { news: { r: 0, w: 0 }, tech: { r: 0, w: 0 }, elliott: { r: 0, w: 0 }, maIntraday: { r: 0, w: 0 } },
      patience: {},
      // News auf 0,15 gesenkt (21.08.2026): das Sentiment ist unbelegt, weil es keine
      // historischen Schlagzeilen gibt. Steigt wieder, sobald das Archiv einen Beleg gibt.
      weights: { news: 0.15, tech: 0.55, elliott: 0.30 },
      /* Voreinstellungen zeigen dahin, wo die EVIDENZ ist. Die erste externe Diagnose
         (Issue #1, 21.08.2026) zeigte einen Tester, der am ersten Tag den alten Standard
         'breakout' auf Scheinen handelte - die Muenzwurf-Konfiguration -, waehrend die
         belegten Strategien ausgeschaltet daneben lagen. Neue Installationen starten jetzt
         mit dem gemessenen Modus (RSI2 im Seitwaertskanal, Basiswert, 8 h) im reinen
         Beobachtungsbetrieb: enabled bleibt false, das Schattenbuch zeichnet auf. */
      intraday: { enabled: false, exitStyle: 'laufen', mode: 'rsi2seit', interval: '60m', period: 20, confirmBps: 15, profile: 'atm60_b', instrument: 'basis', pool: 'auto', kapiZusatz: false, regimeZuteilung: false, orderFee: 0, minDollarVol: 50, budgetPct: 0.03, sl: -0.25, tp: 0.35, cooldownMin: 120, maxPerDay: 10, lineType: 'ema', trendFilter: false, window: 'all', scalpHold: 480, scalpTrail: 15, scalpSL: 20, blackout: 'block', channel: true, mtf: true, sizing: 'fix', screener: false, avoidHours: [], autoTune: true },
      // Die belegten Mittelfrist-Buecher handeln (virtuell) von Anfang an - dafuer sind sie da.
      momentumAn: true, driftAn: true, maxRisikostufe: 3,
      watchlist: [],
      intradayLastScan: 0, intradayDay: '', intradayCount: 0, intradayCooldown: {},
      // Die Stunden-Strategie startet AUS: gemessen widerlegt (Technik-Score t=-11,6).
      // Von Hand einschaltbar bleibt sie - dieser Entscheid wird respektiert.
      notify: true, hourlyEnabled: false, equityHist: [],
      risk: { maxPos: 8, dayLossPct: 3, exposurePct: 40 },
      dayKey: '', dayStartEq: 0,
      lastRun: 0, nextId: 1
    };
  }
  var logFilter = 'all';
  // Gesundheits-Telemetrie (für das externe Audit)
  var HEALTH = { scans: 0, scanErrors: 0, fetchFail: 0, fetchOk: 0, kiFail: 0, kiOk: 0, capFail: 0, capOk: 0, staleBars: 0, killSwitch: 0, workerFail: 0, lastScanT: 0, scanTimes: [], startedAt: Date.now() };
  var LASTBARS = {}; // sym -> zuletzt geladene Intraday-Serie (für den Kursdaten-Export)
  var SIG = {};      // sym -> letzter Signal-/Blocker-Zustand (Live-Monitor)
  /* Entscheidungsverlauf je Wert (Tester-Wunsch #30): Der Monitor zeigte nur den
   * LETZTEN Grund - warum ein Wert den ganzen Tag nicht gehandelt wurde, war nicht
   * nachvollziehbar. Ringpuffer mit 12 Eintraegen je Wert; derselbe Grund in Folge
   * wird nicht wiederholt, sondern bekommt einen Zaehler (sonst fluten 90-Sekunden-
   * Scans den Verlauf mit 'kein Signal'). Nur im Speicher - das ist Anzeige, kein Beleg. */
  var SIG_LOG = {};
  function sigLog(sym, grund, t) {
    if (!sym || !grund) return;
    var l = SIG_LOG[sym] = SIG_LOG[sym] || [];
    var letzter = l[l.length - 1];
    if (letzter && letzter.grund === grund) { letzter.t = t; letzter.n = (letzter.n || 1) + 1; return; }
    l.push({ t: t, grund: grund, n: 1 });
    if (l.length > 12) l.shift();
  }
  var APP_VER = '';
  var EXPORT_ABDECKUNG = null; // Archiv-Abdeckung (füllt renderPilot), geht mit in den Analyse-Export
  var lastEqPoint = 0;
  var SENT = {}; // Sentiment-Historie je Symbol

  /* ================= Risikomanagement =================
   * Die ENTSCHEIDUNGEN stehen in risiko.js: reine Funktionen ueber uebergebenen
   * Zustand, ohne D, ohne DOM, ohne Netz - und damit in Node ausfuehrbar. Vorher lagen
   * sie hier, wo die Testsuite sie nur als Text finden und die Formel danebenschreiben
   * konnte; sie war damit blind gegen jede Aenderung der echten Formel. Was HIER
   * bleibt, sind die Nebenwirkungen: Tagesstart fortschreiben, Positionen glattstellen,
   * speichern, protokollieren. */
  /* Fehlt das Modul, ist die Ladereihenfolge in index.html kaputt (risiko.js MUSS vor
   * depot.js stehen). Dann lieber hier laut abbrechen als spaeter beim ersten Scan mit
   * "Cannot read properties of null" - der Kapitalschutz waere in dem Moment aus. */
  var R = (typeof window !== 'undefined' && window.Risiko) || null;
  if (!R) throw new Error('risiko.js fehlt oder wird nach depot.js geladen - ohne das Modul gibt es keinen Kapitalschutz.');
  function ensureDay(eq) {
    var today = R.tagesSchluessel();
    if (D.dayKey !== today) { D.dayKey = today; D.dayStartEq = eq; }
  }
  function barsFrisch(bars, barMin, now) { return R.barsFrisch(bars, barMin, now); }

  /** Dürfen wir eine neue Position eröffnen? */
  function canOpen(eq) {
    ensureDay(eq);
    return R.darfOeffnen({ risk: D.risk, positionen: D.positions.length,
                           dayStartEq: D.dayStartEq, cash: D.cash }, eq);
  }

  /* ================= Kill-Switch: Tagesverlust-Limit =================
   * canOpen() prueft das Limit nur beim EINSTIEG. Offene Positionen liefen darueber
   * hinaus einfach weiter - das Limit war damit eine Bremse fuers Neugeschaeft, aber
   * kein Kapitalschutz: an einem schlechten Tag konnte der Verlust beliebig tief unter
   * das Limit laufen, ohne dass irgendetwas passierte. Dieser Schalter stellt bei
   * Erreichen ALLES sofort glatt und laesst den Handel bis Tagesende ruhen.
   * Bewusst rein deterministisch - keine KI, kein Ermessen, kein Netzwerk. */
  function killSwitchAktiv() {
    return !!(D.killSwitch && D.killSwitch.day === R.tagesSchluessel());
  }
  /** Prueft das Limit und stellt bei Erreichen alle offenen Positionen glatt.
   *  Rueckgabe: true, wenn der Handel heute gesperrt ist.
   *  Die Ausloese-ENTSCHEIDUNG trifft risiko.js; hier steht nur, was danach passiert. */
  function killSwitchPruefen(now) {
    if (!D) return false;
    if (killSwitchAktiv()) return true;
    // Frueher Ausstieg VOR equityNow()/ensureDay - unveraendert aus der alten Fassung:
    // ohne gesetztes Limit soll dieser Weg den Tagesstart gar nicht erst anfassen.
    if (!(D.risk && D.risk.dayLossPct)) return false;
    var eq = equityNow();
    ensureDay(eq);
    var urteil = R.killSwitchFaellig({ risk: D.risk, dayStartEq: D.dayStartEq }, eq);
    if (!urteil.faellig) return false;
    var tagPct = urteil.tagPct;
    var r = D.risk || {};
    now = now || Date.now();
    var grund = urteil.grund;
    var zu = [];
    D.positions.slice().forEach(function (p) {
      var sp = spotOf(p.sym) || p.entrySpot;
      if (!(sp > 0)) return;                      // ohne Kurs kein fairer Ausstiegspreis
      zu.push(p.sym);
      closeTrade(p, sp, now, grund);
    });
    D.killSwitch = { day: R.tagesSchluessel(), at: now, pct: Math.round(tagPct * 10) / 10,
      limit: r.dayLossPct, n: zu.length, syms: zu, offenGeblieben: D.positions.length };
    HEALTH.killSwitch = (HEALTH.killSwitch || 0) + 1;
    if (!D.tuneLog) D.tuneLog = [];
    D.tuneLog.unshift({ id: 'killswitch-' + now, at: now, quelle: 'sicherung', applied: ['Handel bis Tagesende gesperrt'],
      txt: 'Kill-Switch ausgeloest: Tagesverlust ' + tagPct.toFixed(1) + ' % hat das Limit von −' + r.dayLossPct + ' % erreicht. ' +
        (zu.length ? zu.length + ' offene Position(en) sofort glattgestellt (' + zu.join(', ') + ').' : 'Keine offenen Positionen.') +
        (D.positions.length ? ' ' + D.positions.length + ' Position(en) ohne aktuellen Kurs blieben offen und werden beim naechsten Scan geschlossen.' : '') +
        ' Neue Trades sind bis Mitternacht gesperrt.' });
    save();
    return true;
  }

  /* ================= Geduld-Bilanz (verworfene Signale) ================= */
  var patLast = {}; // Drossel: dieselbe Ablehnung (Symbol+Grund) max. alle 15 Min zählen
  function patienceAdd(reason, sym) {
    if (!D) return;
    if (sym) { SIG[sym] = SIG[sym] || {}; SIG[sym].grund = reason; SIG[sym].t = Date.now(); SIG[sym].ok = false; sigLog(sym, reason, Date.now()); }
    var key = (sym || '') + '|' + reason;
    var nowT = Date.now();
    if (patLast[key] && nowT - patLast[key] < 15 * 60000) return;
    patLast[key] = nowT;
    if (!D.patience) D.patience = {};
    var dk = new Date().toISOString().slice(0, 10);
    if (!D.patience[dk]) D.patience[dk] = {};
    D.patience[dk][reason] = (D.patience[dk][reason] || 0) + 1;
    Object.keys(D.patience).forEach(function (k) {
      if (nowT - new Date(k + 'T00:00:00Z').getTime() > 31 * 86400000) delete D.patience[k];
    });
  }
  function patienceAgg(days) {
    var out = {}, total = 0, cut = Date.now() - days * 86400000;
    Object.keys(D.patience || {}).forEach(function (k) {
      if (new Date(k + 'T00:00:00Z').getTime() < cut) return;
      Object.keys(D.patience[k]).forEach(function (r) { out[r] = (out[r] || 0) + D.patience[k][r]; total += D.patience[k][r]; });
    });
    return { byReason: out, total: total };
  }

  /* ================= Schattenbuch (verworfene Trades virtuell weiterverfolgen) =================
   * Jeder verworfene Trade mit bekannter Richtung wird als virtueller Schein weitergerechnet.
   * Nach ein paar Tagen steht je Verwerfungsgrund fest: Geld gerettet oder Gewinn verhindert?
   * Ein Filter, der nachweislich nur Gewinne verhindert, verliert sein Argument. */
  /** Erwarteter Ertrag ueber `halten` Kerzen, gemittelt ueber ALLE Kerzen derselben
   *  Tagesstunde in dieser Reihe - die letzte ausgenommen, weil sie das Signal ist.
   *  Das ist die Kontrolle: echte Kurse desselben Werts, nur ein anderer Tag.
   *  Rueckgabe in Prozent des Basiswerts, oder null, wenn zu wenig Vergleichsfaelle da
   *  sind. Bewusst KEIN Zufallsgriff - siehe Kopf der Datei-Aenderung. */
  function kontrollErtrag(bars, maxHoldMin, barMin) {
    try {
      if (!bars || bars.length < 120) return null;
      var n = Math.max(1, Math.round((maxHoldMin || 480) / Math.max(1, barMin || 60)));
      var i0 = bars.length - 1;
      var std = new Date(bars[i0][0]).getUTCHours();
      var s = 0, k = 0;
      /* Ab 261, nicht ab 60: Der Detektor braucht 261 Kerzen Vorlauf und darf auf
       * frueheren gar nicht rechnen. Eine Kontrolle, die dort Vergleichsfaelle
       * heranzieht, misst Zeitraeume mit, in denen die Regel nie haette ausloesen
       * koennen - nachgerechnet macht das 0,128 statt 0,113 Pp und verschiebt den
       * Ueberschuss von +0,064 auf +0,036. */
      for (var i = 261; i < bars.length - n - 1; i++) {
        if (new Date(bars[i][0]).getUTCHours() !== std) continue;
        var a = bars[i][1], b = bars[i + n][1];
        if (!(a > 0) || !(b > 0)) continue;
        s += (b / a - 1) * 100; k++;
      }
      if (k < 20) return null;                      // unter 20 Vergleichsfaellen sagt der Schnitt nichts
      return Math.round(s / k * 1000) / 1000;
    } catch (e) { return null; }
  }

  function schattenNeu(grund, sym, dir, spot, bars, mp, cfg, now, ivOpt) {
    try {
      if (!D || !dir || !(spot > 0) || !bars || bars.length < 30) return;
      if (!D.schatten) D.schatten = [];
      for (var i0 = 0; i0 < D.schatten.length; i0++) {
        var s0 = D.schatten[i0];
        if (s0.status === 'open' && s0.sym === sym && s0.grund === grund) return; // je Symbol+Grund nur ein offener Schatten
      }
      var closes = bars.map(function (b) { return b[1]; });
      var iv;
      if (ivOpt) iv = Math.min(1.5, Math.max(0.15, ivOpt));
      else {
        var barsProTagS = Math.max(1, Math.round(390 / Math.max(1, Q.barMinOf(bars, bars.length - 1))));
        iv = Math.min(1.5, Math.max(0.15, Q.histVolIntraday(closes.slice(-300), barsProTagS) * 1.1));
      }
      /* Der Vorwaertstest muss dasselbe Instrument messen, das gehandelt wuerde.
       * Im Basiswert-Modus (oder bei Krypto) wird der Schatten linear gefuehrt -
       * ein scheinbepreister Schatten wuerde eine Basiswert-Strategie an Kosten
       * messen, die sie nie zahlt. */
      var istBasisS = !!((cfg && cfg.instrument === 'basis') || istKrypto(sym));
      var prof = Q.PROFILES[(cfg && cfg.profile) || 'atm21'] || Q.PROFILES.atm21;
      var bvS = prof.ratio || Q.RATIO;
      var w, wWertS, spx, ask;
      if (istBasisS) {
        w = { strike: spot, expiry: now + 365 * 86400000, iv: iv, ratio: 1 };
        wWertS = spot;
        spx = basisSpanne(sym);
        ask = spot * (1 + spx);
      } else {
        w = { strike: spot * (1 + (dir === 'call' ? prof.otmPct : -prof.otmPct)), expiry: now + prof.days * 86400000, iv: iv, ratio: bvS };
        wWertS = Q.warrantValue(dir, w, spot, now);
        if (!(wWertS > 0.001)) return;
        spx = Q.effSpread(iv, undefined, wWertS, bvS) + Q.slipOf(iv, undefined, wWertS);
        ask = wWertS * (1 + spx);
      }
      var uebernacht = !!(mp && mp.uebernacht);
      // Kein frischer Intraday-Schatten im Tagesschluss-Fenster – er würde im nächsten
      // Scan sofort mit 'Tagesschluss' bei ~0 % geschlossen und verwässert nur die Bilanz.
      if (!uebernacht && Q.minutenSeitOeffnung(now) >= 375) return;
      var slT = mp && mp.sl != null
        ? (mp.sl === 'auto' ? Q.autoStop(closes, Q.warrantOmega(dir, w, spot, now), (mp.maxHoldMin || 60) / Math.max(1, Q.barMinOf(bars, bars.length - 1))) : mp.sl)
        : -0.25;
      // Fingerabdruck der Konfiguration mitschreiben: Ohne ihn lässt sich später nicht
      // mehr feststellen, unter welchen Ausstiegsregeln dieser Schatten entstanden ist.
      var konfig = Q.schattenKonfig(mp, cfg);
      schattenBilanzPruefen(konfig, now);
      /* KONTROLLE (Stufe 5, Befund vom 23.08.2026): Was haette derselbe Wert zur
       * selben Tagesstunde an einem BELIEBIGEN anderen Tag ueber dieselbe Haltedauer
       * verdient? Ohne diese Zahl misst eine Bilanz Marktdrift und nennt sie Kante -
       * bei der belegten Regel waren es rund zwei Drittel.
       * Gerechnet als Erwartung ueber ALLE zulaessigen Kerzen, nicht als eine
       * Zufallsziehung: eine einzelne Ziehung verdoppelt die Streuung. */
      var ktr = kontrollErtrag(bars, mp && mp.maxHoldMin, Q.barMinOf(bars, bars.length - 1));
      /* MERKMALE (Felix' Issue #57): Vier vorher festgelegte Beschreibungen des Moments
       * werden mitgeschrieben - Kanallage, Kanalrichtung, relatives Volumen, genutzte
       * Tagesspanne. Sie entscheiden NICHTS; sie sorgen nur dafuer, dass die Frage
       * "welche Signale waren gut und was hatten sie gemeinsam?" spaeter aus einer
       * Aufzeichnung beantwortet werden kann statt aus einer nachtraeglichen Suche. */
      var merk = Q.signalMerkmale ? Q.signalMerkmale(bars, bars.length - 1) : null;
      D.schatten.unshift({ id: 'sch' + now + '-' + sym, t: now, sym: sym, dir: dir, grund: grund, konfig: konfig,
        ktrPct: ktr, merk: merk,
        spot0: spot, ask: Math.round(ask * 10000) / 10000,
        w: { strike: Math.round(w.strike * 100) / 100, expiry: w.expiry, iv: Math.round(iv * 1000) / 1000, ratio: bvS },
        spx: Math.round(spx * 10000) / 10000, sl: slT, tp: mp && mp.tp != null ? mp.tp : null,
        trail: (mp && mp.trail) || 0, maxHoldMin: mp && mp.maxHoldMin != null ? mp.maxHoldMin : 240,
        uebernacht: uebernacht, basis: istBasisS || undefined,
        peak: ask, lastBid: null, status: 'open' });
      if (D.schatten.length > 400) D.schatten = D.schatten.filter(function (x, ix) { return ix < 400 || x.status === 'open'; });
    } catch (eS) { /* Das Schattenbuch darf den Handel nie stören */ }
  }
  /** Wacht darüber, dass die Schatten-Bilanz nur Vergleichbares zählt.
   *  Ändern sich die Ausstiegsregeln, wandert die bisherige Bilanz ins Archiv und die
   *  Zählung fängt neu an - sonst steht in der Bilanz ein Mittelwert über zwei
   *  verschiedene Experimente. Genau das war am 21.08.2026 der Fall: 392 Schatten mit
   *  drei Minuten Haltedauer bildeten das Urteil, während die App mit 240 Minuten lief. */
  function schattenBilanzPruefen(konfig, now) {
    if (!D) return;
    if (D.schattenKonfig === konfig) return;
    var alt = D.schattenKonfig;
    var hatte = D.schattenStat && Object.keys(D.schattenStat).length;
    if (alt && hatte) {
      if (!D.schattenArchiv) D.schattenArchiv = [];
      D.schattenArchiv.unshift({ konfig: alt, bis: now, bilanz: D.schattenStat });
      if (D.schattenArchiv.length > 12) D.schattenArchiv.length = 12;
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'schattenreset-' + now, at: now, quelle: 'sicherung',
        applied: ['Schatten-Bilanz zurückgesetzt'],
        txt: 'Die Ausstiegsregeln haben sich geändert (' + alt + ' → ' + konfig + '). ' +
          'Schatten aus verschiedenen Regeln sind nicht vergleichbar - eine Haltedauer von ' +
          'drei Minuten misst bei 2,7 % Spanne je Seite nichts als die Kosten, eine von vier ' +
          'Stunden dagegen die Bewegung. Die bisherige Bilanz liegt im Archiv, die Zählung ' +
          'fängt sauber an.' });
    }
    D.schattenKonfig = konfig;
    D.schattenStat = {};
    /* Die Merkmals-Zaehlung haengt an denselben Ausstiegsregeln wie die Bilanz und
     * wird deshalb gemeinsam mit ihr zurueckgesetzt - sonst mischt ein Topf zwei
     * verschiedene Experimente und sieht dabei nur voller aus. */
    D.merkStat = {};
  }

  /** Merkmale eines abgeschlossenen Signals in die Toepfe zaehlen.
   *  Nur Signale mit Grund 'Einstieg': Das sind die, die alle Filter passiert haben -
   *  also genau die "getaetigten Kaeufe", nach deren Mustern Felix in #57 fragt.
   *  Verworfene Signale gehoeren nicht hinein, sie beantworten eine andere Frage. */
  function merkZaehlen(sEintrag) {
    if (!sEintrag || sEintrag.grund !== 'Einstieg' || !sEintrag.merk) return;
    var ms = D.merkStat = D.merkStat || {};
    var keys = ['kanal', 'trend', 'vol', 'adr'];
    for (var m = 0; m < keys.length; m++) {
      var wert = sEintrag.merk[keys[m]];
      if (!wert) continue;                       // fehlendes Merkmal wird nicht geraten
      var k = keys[m] + '|' + wert;
      var t = ms[k] = ms[k] || { n: 0, sumPct: 0, ktrN: 0, ktrSum: 0 };
      t.n++;
      t.sumPct = Math.round((t.sumPct + sEintrag.pnlPct) * 100) / 100;
      if (sEintrag.ktrPct != null) {
        t.ktrN = (t.ktrN || 0) + 1;
        t.ktrSum = Math.round(((t.ktrSum || 0) + sEintrag.ktrPct) * 100) / 100;
      }
    }
  }

  function schattenSchliessen(sEintrag, retPct, why, now) {
    sEintrag.status = 'closed'; sEintrag.closeT = now;
    sEintrag.pnlPct = Math.round(retPct * 10000) / 100; sEintrag.why = why;
    var st = D.schattenStat = D.schattenStat || {};
    // Schatten aus einer früheren Konfiguration schließen zwar noch, zählen aber nicht
    // mehr in die aktuelle Bilanz - sonst sickert das alte Experiment ins neue.
    /* Benannte Regeln (Stufe 3, Felix' Instrument aus #36) sind von dieser Sperre
     * ausgenommen: Sie haben ABSICHTLICH eine eigene Konfiguration - das ist ihr Zweck.
     * Die Sperre gilt weiter fuer die gehandelte Regel, damit dort nicht das alte
     * Experiment ins neue sickert. */
    var eigeneRegel = String(sEintrag.grund || '').indexOf('Regel: ') === 0;
    if (!eigeneRegel && sEintrag.konfig && D.schattenKonfig && sEintrag.konfig !== D.schattenKonfig) return;
    merkZaehlen(sEintrag);
    var g2 = st[sEintrag.grund] = st[sEintrag.grund] || { n: 0, sumPct: 0, gerettet: 0, verhindert: 0, ktrN: 0, ktrSum: 0 };
    g2.n++; g2.sumPct = Math.round((g2.sumPct + sEintrag.pnlPct) * 100) / 100;
    /* Die Kontrolle wird getrennt gezaehlt, nicht verrechnet: Der Ueberschuss ist die
     * Aussage, aber beide Zahlen muessen sichtbar bleiben. Wer nur die Differenz sieht,
     * kann nicht erkennen, ob eine gute Bilanz aus dem Signal oder aus dem Markt kam. */
    if (sEintrag.ktrPct != null) {
      g2.ktrN = (g2.ktrN || 0) + 1;
      g2.ktrSum = Math.round(((g2.ktrSum || 0) + sEintrag.ktrPct) * 100) / 100;
    }
    if (sEintrag.pnlPct <= -1) g2.gerettet++;           // Filter hat Geld gerettet
    else if (sEintrag.pnlPct >= 1) g2.verhindert++;     // Filter hat Gewinn verhindert (±1 % Totzone)
  }
  /** Waisen-Schatten schließen: Symbole, die aus dem Scan-Universum gefallen sind,
   *  bekommen nie mehr ein Update – nach 5 Tagen werden sie mit dem letzten bekannten
   *  Kurs (oder 0 %) abgeschlossen, sonst wachsen sie als Unentschiedene ewig weiter. */
  function schattenAufraeumen(now) {
    if (!D || !D.schatten) return;
    for (var iA = 0; iA < D.schatten.length; iA++) {
      var sA = D.schatten[iA];
      if (sA.status === 'open' && now - sA.t > 5 * 86400000) {
        var retA = sA.lastBid != null ? (sA.lastBid / sA.ask - 1) : 0;
        schattenSchliessen(sA, retA, 'Verwaist', now);
      }
    }
  }
  function schattenUpdate(sym, spot, now, nearCloseFlag) {
    if (!D || !D.schatten || !D.schatten.length) return;
    for (var i1 = 0; i1 < D.schatten.length; i1++) {
      var sE = D.schatten[i1];
      if (sE.status !== 'open' || sE.sym !== sym) continue;
      try {
        var bidS;
        if (sE.basis) {
          bidS = Math.max(0.001, (sE.dir === 'call' ? spot : Math.max(0.001, 2 * sE.spot0 - spot)) * (1 - sE.spx));
        } else {
          var wS = { strike: sE.w.strike, expiry: sE.w.expiry, iv: sE.w.iv, ratio: sE.w.ratio || Q.RATIO };
          bidS = Math.max(0.001, Q.warrantValue(sE.dir, wS, spot, now) * (1 - sE.spx));
        }
        sE.lastBid = Math.round(bidS * 10000) / 10000;
        if (bidS > sE.peak) sE.peak = bidS;
        var retS = bidS / sE.ask - 1;
        var whyS = null;
        if (retS <= sE.sl) whyS = 'Stop';
        else if (sE.tp != null && retS >= sE.tp) whyS = 'Ziel';
        else if (sE.trail && sE.peak > sE.ask && bidS <= sE.peak * (1 - sE.trail)) whyS = 'Trailing';
        else if (sE.maxHoldMin && now - sE.t >= sE.maxHoldMin * 60000) whyS = 'Zeit';
        else if (nearCloseFlag && !sE.uebernacht) whyS = 'Tagesschluss';
        else if (now - sE.t > 5 * 86400000) whyS = 'Verwaist';
        if (whyS) schattenSchliessen(sE, retS, whyS, now);
      } catch (eU) { /* einzelner Schatten defekt: ignorieren */ }
    }
  }

  /* Kostenhuerde des GEWAEHLTEN Produkts, in Prozentpunkten des Basiswerts.
   * Signalstudie 23.08.2026: Die Huerde entscheidet, nicht die Signalqualitaet.
   * Schein: (2 x Spanne + Zeitwertverlust) / Hebel. Aktie/CFD: 2 x Spanne + Gebuehr. */
  /* ================= Volatilitaet: Smile und Ereignis =================
   * Bis 8.24.5 bekam jeder Schein dieselbe Vola - unabhaengig vom Basispreis und
   * eingefroren beim Oeffnen. Beides ist falsch, und beide Fehler zeigen in dieselbe
   * Richtung: Die Simulation faellt optimistischer aus als die Wirklichkeit.
   *
   * Nachgemessen (24.08.2026), damit die Groessenordnungen im Code stehen:
   *   Smile bei den Profilen, die diese App WIRKLICH handelt:
   *     atm21, atm21_b, atm60_b (4 von 6 Profilen)  ->  0,00 %  (am Geld, kein Effekt)
   *     otm3_14   Call 3 % aus dem Geld, 14 Tage    -> -2,48 %  (Call-Skew: billiger)
   *     otm3_30b                        , 30 Tage   -> -1,42 %
   *   Ereignis-Vola, am Geld, 21 Tage Restlaufzeit:
   *     ein Tag VOR den Zahlen                      -> +22,0 %
   *     ein Tag DANACH, bei UNVERAENDERTEM Kurs     -> -29,5 %
   *
   * Daraus folgt eine Korrektur am Bericht: Dort stand, ein aus dem Geld liegender
   * Schein "laege real hoeher, der Schein waere teurer". Das gilt fuer PUTS. Bei
   * Calls faellt der Aktien-Skew nach unten - der Call wird billiger. Und bei 3 %
   * Abstand ist der Effekt so oder so klein. Der grosse Posten ist das EREIGNIS,
   * nicht der Smile: 22 % hin, 29 % zurueck, ohne dass sich der Kurs bewegt. Genau
   * das ist der Fall, den ein Backtest bisher gar nicht kannte.
   *
   * Abschaltbar ueber D.intraday.ivModell === false - eine Modellaenderung an der
   * Preisbildung soll man zurueckdrehen koennen, ohne die Version zu wechseln. */
  function ivModellAn() { return !(D && D.intraday && D.intraday.ivModell === false); }

  /** Die Vola, mit der ein Schein JETZT bepreist wird.
   *  basis: die Vola am Geld (ohne Smile, ohne Ereignis).
   *  terminT: Zeitstempel des naechsten Ergebnistermins oder null. */
  function ivFuer(basis, dir, strike, spot, expiry, terminT, now) {
    if (!(basis > 0)) return basis;
    if (!ivModellAn()) return basis;
    var restTage = Math.max(0, (expiry - now) / 86400000);
    var iv = Q.smileIv(basis, strike, spot, restTage);
    if (terminT) iv = Q.ivMitEreignis(iv, (terminT - now) / 86400000);
    return Math.min(1.5, Math.max(0.05, iv));
  }
  /** Dieselbe Rechnung fuer eine offene Position - sie traegt ihre Basis-Vola mit.
   *  Altbestand ohne ivBasis faellt auf die eingefrorene Vola zurueck: dann verhaelt
   *  sich die Position wie vorher, statt rueckwirkend neu bepreist zu werden. */
  function ivDerPosition(pos, spot, now) {
    if (!ivModellAn()) return pos.iv;
    if (!(pos.ivBasis > 0)) return pos.iv;
    return ivFuer(pos.ivBasis, pos.dir, pos.strike, spot, pos.expiry, pos.terminT || null, now);
  }

  function kostenHuerdePp(cfg, spot, vol, haltenMin, einsatz) {
    spot = spot > 0 ? spot : 200; vol = vol > 0 ? vol : 0.30;
    var halten = Math.max(5, haltenMin || 60), now = Date.now();
    /* Die Gebuehr ist ein FESTER Betrag je Seite - ihr Gewicht haengt also allein an
     * der Positionsgroesse. Vorher stand hier eine fest verdrahtete 10.000-$-Position;
     * bei den real gehandelten 125-300 $ war sie damit um den Faktor 30-80 zu klein
     * angesetzt, und im Schein-Zweig fehlte sie ganz. Genau diese Gebuehr, nicht
     * Spanne oder Zeitwert, erschlaegt die gemessene Kante bei kleinen Positionen. */
    var pos = einsatz > 0 ? einsatz : 10000;
    var gebAnteil = (cfg.orderFee || 0) * 2 / pos;          // Anteil der Position, beide Seiten
    /* Uebernacht-Finanzierung: Capital.com berechnet rund 0,0237 % je Nacht auf das
     * ENGAGEMENT - aber nur mit Hebel. Woertlich von der Gebuehrenseite (23.08.2026):
     * "Trade CFDs on any of our shares markets using 1:1 leverage, and you'll get
     * 0% overnight funding." Ohne Hebel ist der Basiswert-Pfad also spannenfrei
     * finanziert; mit Hebel kostet jede Nacht mehr, als die gemessene Kante je
     * Trade einbringt (+0,073 Pp nach Spanne). Deshalb steht es hier als Zahl.
     * naechte: 0 bei einem Ausstieg am selben Tag, sonst 1 - ueber ein Wochenende 3. */
    /* Kalendernaechte, nicht Handelstagswechsel. Der erste Wurf zaehlte Handelstage:
     * Freitag auf Montag war damit EINE Nacht statt drei. Die Gegenprobe der Messungen
     * vom 23.08.2026 hat den Faktor an echten Zeitstempeln bestimmt - gezaehlt wurden
     * 0,563 / 0,666 / 1,927 / 3,497 / 5,011 Kalendernaechte bei 2/4/8/16/24 Kerzen,
     * gegen 0,397 / 0,469 / 1,327 / 2,399 / 3,439 nach Handelstagen. Faktor 1,45.
     * Betrifft nur den gehebelten Weg - ohne Hebel gibt es keine Finanzierung. */
    var handelstage = halten / (60 * 6.5);
    var naechte = Math.max(0, handelstage * 1.45);   // Wochenenden eingerechnet
    var uebernachtPp = (cfg.hebel > 1 ? 0.0237 : 0) * naechte;
    if (cfg.instrument === "basis") {
      return { pp: 2 * 0.05 + gebAnteil * 100 + uebernachtPp, produkt: "Aktie 1x", hebel: 1, einsatz: pos,
               naechte: naechte,
               teile: { spanne: 2 * 0.05, zeit: 0, gebuehr: gebAnteil * 100, uebernacht: uebernachtPp } };
    }
    var P = Q.PROFILES[cfg.profile] || Q.PROFILES.atm21;
    var w = Q.makeWarrant("call", spot, vol, now, P.ratio);
    w.strike = Math.round(spot * (1 + (P.otmPct || 0)) * 100) / 100;
    w.expiry = now + P.days * 86400000;
    /* Derselbe Smile wie im Handel. Die Huerde muss den Schein bepreisen, den der
     * Scanner tatsaechlich kaufen wuerde - stuende hier die Vola am Geld, waere die
     * Huerde fuer jedes aus dem Geld liegende Profil systematisch falsch.
     * Die Ereignis-Struktur bleibt hier bewusst AUSSEN VOR: Die Huerde ist eine
     * allgemeine Eigenschaft der Konfiguration ("was kostet dieser Trade typisch"),
     * kein Kurszettel fuer einen bestimmten Wert an einem bestimmten Tag. Einen
     * Termin gibt es an dieser Stelle gar nicht - es ist kein Symbol im Spiel. */
    /* Der Schalter kommt aus cfg, NICHT aus dem Modulzustand: kostenHuerdePp bekommt
     * ihre Konfiguration vollstaendig als Argument und bleibt damit einzeln
     * ausfuehrbar - die Testsuite schneidet sie heraus und rechnet sie nach. Ein
     * Griff nach D haette genau das kaputt gemacht (und tat es beim ersten Wurf). */
    w.iv = (cfg.ivModell === false) ? w.iv : Q.smileIv(w.iv, w.strike, spot, P.days);
    var wert = Q.warrantValue("call", w, spot, now);
    if (!(wert > 0.02)) return null;
    var spx = Q.effSpread(w.iv, undefined, wert, w.ratio);
    var omega = Q.warrantOmega("call", w, spot, now);
    if (!(omega > 0)) return null;
    var spaeter = Q.warrantValue("call", w, spot, now + halten * 60000);
    var theta = Math.max(0, (wert - spaeter) / wert);
    /* Alle drei Kostenanteile sind Anteile am SCHEINWERT; durch omega geteilt werden
     * sie zu Prozentpunkten des Basiswerts. Die Gebuehr gehoert genauso dazu wie
     * Spanne und Zeitwert - sie fehlte hier bisher vollstaendig. */
    var tSpanne = 2 * spx / omega * 100, tZeit = theta / omega * 100, tGeb = gebAnteil / omega * 100;
    /* Beim Schein gibt es keine Uebernacht-Finanzierung - der Zeitwertverlust IST
     * der Preis fuers Halten und steckt bereits in tZeit. */
    return { pp: tSpanne + tZeit + tGeb, produkt: P.name, hebel: omega, einsatz: pos, naechte: 0,
             teile: { spanne: tSpanne, zeit: tZeit, gebuehr: tGeb, uebernacht: 0 } };
  }
  /** Positionswert in Dollar, so wie ihn der Live-Pfad bildet (depot.js, Abschnitt
   *  "Positionsgroesse nach Risiko"). EINE Formel fuer Anzeige und Handel - dass die
   *  Anzeige anders rechnete als der Handel, war genau der Fehler.
   *  slAbs: Betrag des Not-Stops als Anteil (0.20 = -20 %).
   *  ACHTUNG, bewusst abgebildete Asymmetrie: Beim Schein deckelt der Live-Pfad die
   *  Risiko-Position auf max(3x budgetPct, 10 %) des Depots, beim Basiswert NICHT.
   *  Ob dieser Deckel bleiben soll, ist eine offene Frage - er begrenzt genau den
   *  Hebel, der die Gebuehr klein macht. Hier wird er abgebildet, nicht bewertet. */
  function positionsWert(cfg, equity, slAbs, faktor) {
    faktor = faktor > 0 ? faktor : 1;
    var sizingR = parseFloat(cfg.sizing);
    if (!(sizingR > 0)) return equity * (cfg.budgetPct || 0.03) * faktor;
    var wert = equity * sizingR / 100 * faktor / Math.max(0.08, Math.abs(slAbs || 0.20));
    if (cfg.instrument === "basis") return wert;
    return Math.min(wert, equity * Math.max((cfg.budgetPct || 0.03) * 3, 0.10));
  }
  /* ================= Benannte Regeln (Messinstrument, Issue #36) =================
   * Eine benannte Regel ist { id, name, cfg, seit }. cfg traegt dieselben Felder wie
   * D.intraday, damit Live-Regel und Testregel DASSELBE Objekt sind - nur eine davon
   * bekommt Geld. Genau das ist der Punkt: Zwei Beschreibungen derselben Regel sind
   * der Fehlertyp, an dem dieses Projekt sechsmal gescheitert ist.
   *
   * Ausdruecklich ohne Handelsknopf. Eine Regel, an der man mittendrin drehen kann,
   * misst nichts - und die Versuchung dazu ist am groessten, wenn es gut laeuft. */
  function regelnListe() { return (D && Array.isArray(D.regeln)) ? D.regeln : []; }

  /** Parameter einer benannten Regel in die Form bringen, die einstiegSignal erwartet -
   *  ueber stcParams, also ueber DIESELBE Funktion wie Chart und Live-Pfad. */
  function regelParams(r) {
    var c = r && r.cfg ? r.cfg : {};
    return { ENTRY: c.mode || 'rsi2seit', LINE: c.lineType || 'ema', period: c.period || 20,
             confirmBps: c.confirmBps != null ? c.confirmBps : 15, ZTHR: zOf(c.confirmBps),
             MINQ: 0, CHAN: false, MTF: false, TREND: false };
  }

  /** Eine benannte Regel auf den frischen Kerzen eines Werts pruefen und - wenn sie
   *  ausloest - einen Schatten anlegen. Kein Handel, keine Positionsgroesse, kein Geld.
   *  Die Abklingzeit gilt je Regel und Symbol, sonst zaehlt eine Regel dasselbe
   *  Ereignis mehrfach. */
  function regelnPruefen(sym, sigBars, now) {
    var liste = regelnListe();
    if (!liste.length || !sigBars || sigBars.length < 261) return;
    for (var i = 0; i < liste.length; i++) {
      var r = liste[i];
      if (!r || !r.name) continue;
      try {
        var P = regelParams(r);
        var s = Q.einstiegSignal(sigBars, sigBars.length - 1, P);
        if (!s || s.dir !== 'call') continue;                       // nur Long, wie gemessen
        if (!D.regelCooldown) D.regelCooldown = {};
        var k = r.id + '|' + sym;
        var cool = (r.cfg && r.cfg.cooldownMin != null ? r.cfg.cooldownMin : 120) * 60000;
        if (D.regelCooldown[k] && now - D.regelCooldown[k] < cool) continue;
        D.regelCooldown[k] = now;
        var mpR = { sl: -(((r.cfg && r.cfg.scalpSL) || 20) / 100), tp: null, trail: 0,
                    maxHoldMin: (r.cfg && r.cfg.scalpHold) || 480, uebernacht: true };
        schattenNeu('Regel: ' + r.name, sym, s.dir, sigBars[sigBars.length - 1][1], sigBars,
                    mpR, r.cfg || {}, now, undefined);
      } catch (eR) { /* Eine kaputte Regel darf den Scan nie stoppen */ }
    }
  }

  /** Zeigt die benannten Regeln mit ihrer eigenen Bilanz. Die Zahlen kommen aus
   *  D.schattenStat, das ohnehin je Grund zaehlt - "Regel: <Name>" ist der Grund.
   *  Bewusst nuechtern: n, Mittel je Trade und wie oft es aufging. Keine Hochrechnung
   *  auf das Jahr, keine Kurve - bei zweistelligen Fallzahlen waere beides Theater. */
  function regelnAnzeigen() {
    var el = document.getElementById('regelnListe'); if (!el) return;
    var liste = regelnListe();
    if (!liste.length) {
      el.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--muted);">Noch keine festgeschriebene Regel. ' +
        'Stell oben eine Konfiguration ein, gib ihr hier einen Namen und schreib sie fest.</div>';
      return;
    }
    var st = D.schattenStat || {};
    var offen = (D.schatten || []).filter(function (s) { return s.status === 'open'; });
    var rows = liste.map(function (r) {
      var g = st['Regel: ' + r.name] || { n: 0, sumPct: 0 };
      var mittel = g.n ? g.sumPct / g.n : null;
      var ktr = g.ktrN ? g.ktrSum / g.ktrN : null;
      var ueb = (mittel != null && ktr != null) ? mittel - ktr : null;
      var offenN = offen.filter(function (s) { return s.grund === 'Regel: ' + r.name; }).length;
      var tage = r.seit ? Math.max(0, Math.round((Date.now() - r.seit) / 86400000)) : 0;
      return '<tr>' +
        '<td><b>' + U.esc(r.name) + '</b><div style="color:var(--muted); font-size:var(--fs-klein);">' +
          U.esc((r.cfg && r.cfg.mode) || '?') + ' · ' + U.esc((r.cfg && r.cfg.interval) || '?') +
          ' · ' + (((r.cfg && r.cfg.scalpHold) || 480)) + ' Min · seit ' + tage + ' Tag(en)</div></td>' +
        '<td style="text-align:right;">' + g.n + '</td>' +
        '<td style="text-align:right;">' + offenN + '</td>' +
        '<td style="text-align:right;" class="' + (mittel == null ? '' : U.signCls(mittel)) + '">' +
          (mittel == null ? '–' : U.signTxt(Math.round(mittel * 100) / 100, ' %')) + '</td>' +
        '<td style="text-align:right; color:var(--muted);">' +
          (ktr == null ? '–' : U.signTxt(Math.round(ktr * 100) / 100, ' %')) + '</td>' +
        '<td style="text-align:right;" class="' + (ueb == null ? '' : U.signCls(ueb)) + '"><b>' +
          (ueb == null ? '–' : U.signTxt(Math.round(ueb * 100) / 100, ' %')) + '</b></td>' +
        '<td style="text-align:right;"><button class="btn ghost regelWeg" data-id="' + U.esc(r.id) +
          '" style="padding:2px 8px; font-size:var(--fs-klein);">löschen</button></td></tr>';
    }).join('');
    el.innerHTML = '<table class="tbl" style="font-size:var(--fs-text);">' +
      '<tr><th>Regel</th><th style="text-align:right;">geschlossen</th><th style="text-align:right;">offen</th>' +
      '<th style="text-align:right;">Ø je Trade</th><th style="text-align:right;">Kontrolle</th>' +
      '<th style="text-align:right;">Überschuss</th><th></th></tr>' + rows + '</table>' +
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:6px;">' +
      '<b>Kontrolle</b> ist derselbe Wert, dieselbe Tagesstunde, dieselbe Haltedauer – nur an ' +
      'einem beliebigen anderen Tag, gemittelt über alle. Sie sagt, was schlichtes Halten ' +
      'gebracht hätte. <b>Überschuss</b> ist die Differenz und die eigentliche Aussage: ' +
      'Nur er gehört der Regel. Bei der belegten Intraday-Regel sind rund zwei Drittel des ' +
      'Rohertrags Kontrolle (+0,065 Überschuss auf +0,170 roh) – ohne diese Spalte misst man ' +
      'Marktdrift und nennt sie Kante.' +
      '<br>Ø je Trade ist der Schatten-Ertrag nach Spanne, ohne Ordergebühr. Bei unter etwa ' +
      '300 Trades ist so gut wie jede Zahl hier mit Rauschen vereinbar; was sie zeigt, ist die ' +
      'Richtung – und dass die Regel überhaupt auslöst.</div>';
  }

  /** Fuellt den Regelkopf: welche Regel laeuft, mit welchen Parametern, und wie es
   *  um ihren Beleg steht. Alles kommt aus derselben Quelle wie der Handel -
   *  modeParams() fuer die Haltedauer, D.intraday fuer den Rest. Eine zweite
   *  Beschreibung der Regel waere genau die Doppelung, die dieser Umbau abschafft. */
  function regelKopfAnzeigen() {
    var el = document.getElementById('regelKopf'); if (!el) return;
    var cfg = D.intraday || {};
    var mp = {}; try { mp = modeParams() || {}; } catch (e) { mp = {}; }
    var NAME = { rsi2seit: 'RSI(2) im Seitwärtskanal', kapitulation: 'Kapitulations-Dip im Abwärtskanal' };
    /* Belegstand, ehrlich. Nach der Kontroll-Messung vom 23.08.2026 ist die Kante der
     * belegten Regel nicht mehr nachgewiesen: gegen eine Kontrolle aus echten Kerzen
     * desselben Werts zur selben Tagesstunde bleiben +0,114 Pp bei t = 1,49 und einer
     * Auflösung von 0,153. Das ist "nicht entscheidbar", nicht "belegt" - und es hier
     * anders hinzuschreiben waere genau die Art Schoenfaerberei, gegen die das ganze
     * Projekt aufgebaut ist. */
    var BELEG = {
      rsi2seit: { stand: 'nicht entscheidbar',
        /* +0,065, nicht +0,114. Die erste Auswertung hatte eine kaputte Paarung -
         * nur 0,6 % der Kontrollfaelle gehoerten zum selben Wert. Zwei unabhaengige
         * Nachrechnungen kommen auf +0,065 bzw. +0,066. */
        txt: '+0,065 Pp Überschuss gegen eine Kontrolle aus echten Kerzen desselben Werts zur ' +
             'selben Tagesstunde (6.509 Trades, 675 Tage). Die Rohkante von +0,170 Pp besteht ' +
             'damit zu rund zwei Dritteln aus schlichtem Halten – nicht die Regel verdient sie, ' +
             'sondern die Zeit im Markt.' },
      kapitulation: { stand: 'nicht entscheidbar',
        /* Gemessen am 24.08.2026 mit der Messmaschine, vorregistriert. Die Zahlen
         * kommen unten aus dem Protokoll; dieser Text erklaert nur, was sie heissen. */
        txt: 'Der Ertrag sitzt fast vollständig in wenigen Trades: In der Bestätigungshälfte tragen ' +
             '6 von 676 Trades die Hälfte des Gesamtertrags, und ohne die besten 5 % bleiben −0,505 Pp. ' +
             'Die Datenmenge kann die Frage nicht beantworten – dafür bräuchte es rund die 23-fache ' +
             'Zahl an Werten. Was belastbar ist, ist die Aussage über das Risiko, nicht die über den Ertrag.' }
    };
    var b = BELEG[cfg.mode] || { stand: 'ungemessen', txt: 'Für diesen Auslöser liegt keine Messung vor.' };
    /* D2: Wo ein Protokoll vorliegt, gewinnt es. Ein fest verdrahteter Belegstand
     * veraltet - genau das war beim Kapitulations-Dip passiert, der hier noch "in
     * Ueberpruefung" stand, als die Messung laengst vorlag. */
    var pk = PROTOKOLL_KANTE[cfg.mode];
    var belegAusProtokoll = null;
    if (pk && pk.urteil && pk.urteil !== 'unbekannt') {
      belegAusProtokoll = { stand: pk.urteil, datum: pk.datum, jeSignalPp: pk.jeSignalPp };
      b = { stand: pk.urteil, txt: b.txt };
    }
    /* Gruen nur, wenn ein PROTOKOLL "bestaetigt" sagt. Ein im Code stehendes "belegt"
     * reicht nicht - das war der Fehler, den die fest verdrahtete Kante 0,11 gemacht hat. */
    var farbe = (belegAusProtokoll && b.stand === 'bestaetigt') ? 'var(--up)'
      : b.stand === 'ungemessen' ? 'var(--down)' : 'var(--warn, var(--series2))';
    var halten = mp.maxHoldMin > 0 ? (mp.maxHoldMin >= 60 ? Math.round(mp.maxHoldMin / 60) + ' Stunden' : mp.maxHoldMin + ' Minuten') : 'kein Zeitausstieg';
    var zeilen = [
      ['Auslöser', NAME[cfg.mode] || cfg.mode],
      ['Kerzen', (cfg.interval || '60m') + (cfg.interval === '60m' ? ' (so gemessen)' : ' – NICHT die gemessene Konfiguration')],
      ['Haltedauer', halten],
      ['Produkt', cfg.instrument === 'basis' ? 'Basiswert ohne Hebel' : 'Hebelschein' + (cfg.profile ? ' · ' + cfg.profile : '')],
      ['Positionsgröße', parseFloat(cfg.sizing) > 0 ? 'nach Risiko ' + cfg.sizing + ' % je Stop' : 'fest ' + Math.round((cfg.budgetPct || 0.03) * 100) + ' % des Depots'],
      ['Not-Stop', (cfg.scalpSL || 20) + ' %'],
      ['Beleg', '<b style="color:' + farbe + ';">' + U.esc(b.stand) + '</b> – ' + U.esc(b.txt) +
        (belegAusProtokoll
          ? '<br><span style="color:var(--muted); font-size:var(--fs-neben);">Aus dem Messprotokoll vom ' +
            U.esc(belegAusProtokoll.datum) + ': Überschuss je Signal ' +
            (belegAusProtokoll.jeSignalPp >= 0 ? '+' : '') + belegAusProtokoll.jeSignalPp.toFixed(3) +
            ' Pp. Die App liest dieses Urteil, sie rechnet es nicht.</span>'
          : '<br><span style="color:var(--muted); font-size:var(--fs-neben);">Kein Messprotokoll im Datenordner – dieser Stand steht fest im Code und kann veralten.</span>')]
    ];
    el.innerHTML = '<table class="tbl" style="font-size:var(--fs-text);">' + zeilen.map(function (r) {
      return '<tr><td style="color:var(--muted); white-space:nowrap; width:130px;">' + U.esc(r[0]) + '</td><td>' + r[1] + '</td></tr>';
    }).join('') + '</table>';
  }
  /** Zeigt die Huerde und stellt sie der belegten Kante gegenueber. */
    /* ---------------------------------------------------------------------------
   * D2: Kantenwerte aus den Messprotokollen, nicht aus dem Code.
   *
   * Gelesen wird einmal beim Start ueber dieselbe Bruecke wie das Scoreboard. Die
   * App RECHNET hier nichts - sie nimmt den Ueberschuss je Signal und das Urteil,
   * so wie die Messmaschine sie hingeschrieben hat. Faellt das Lesen aus, bleibt der
   * Speicher leer und die Anzeige behauptet nichts.
   *
   * Warum "je Signal" und nicht das Tagesmittel: Die Kostenhuerde gilt je Umlauf.
   * Ein Tagesmittel gegen Umlaufkosten zu stellen vergleicht zwei verschiedene
   * Groessen - genau dieser Fehler stand hier bis zum 23.08.2026.
   * ------------------------------------------------------------------------- */
  var PROTOKOLL_KANTE = {};
  async function kantenAusProtokollen() {
    try {
      if (!window.api || !window.api.readProtokolle) return;
      var r = await window.api.readProtokolle();
      if (!r || !r.ok || !Array.isArray(r.protokolle)) return;
      var neu = {};
      r.protokolle.forEach(function (eintrag) {
        var j = eintrag && eintrag.protokoll;
        if (!j || !j.strategie || !j.strategie.key || !Array.isArray(j.ergebnisse)) return;
        /* Von mehreren Varianten die mit dem staerksten Bestaetigungs-t - und die
         * Variantenzahl wird mit angezeigt, damit die Auswahl sichtbar bleibt. */
        var beste = null, besterT = -Infinity, besterIdx = 0;
        j.ergebnisse.forEach(function (e, i) {
          var u = e && e.bestaetigung && e.bestaetigung.ueberschuss;
          if (!u || u.jeSignal == null || !isFinite(u.jeSignal)) return;
          var tw = isFinite(u.t) ? u.t : -Infinity;
          if (tw > besterT) { besterT = tw; beste = u; besterIdx = i; }
        });
        if (!beste) return;
        var vorhanden = neu[j.strategie.key];
        if (vorhanden && vorhanden.datum >= String(j.gemessenAm || '').slice(0, 10)) return;
        neu[j.strategie.key] = {
          jeSignalPp: beste.jeSignal * 100,
          urteil: (j.urteile && j.urteile[besterIdx]) || j.bestesUrteil || 'unbekannt',
          datum: String(j.gemessenAm || '').slice(0, 10),
          varianten: j.ergebnisse.length,
        };
      });
      PROTOKOLL_KANTE = neu;
      try { huerdeAnzeigen(); } catch (e) { /* Anzeige noch nicht da - beim naechsten Mal */ }
    } catch (e) { /* kein Protokoll lesbar: es wird eben nichts behauptet */ }
  }
  document.addEventListener('DOMContentLoaded', function () { kantenAusProtokollen(); });

  function huerdeAnzeigen() {
    var el = document.getElementById("kostenHuerde"); if (!el) return;
    var cfg = D.intraday || {};
    /* Haltedauer aus DERSELBEN Quelle wie der Handel: modeParams() liefert sie auch
     * dem Live-Pfad. Vorher stand hier cfg.maxHoldMin - ein Feld, das D.intraday nicht
     * hat; die Anzeige rechnete deshalb immer mit 60 Minuten statt mit 480. */
    var mp = {};
    try { mp = modeParams() || {}; } catch (eM) { mp = {}; }
    var offenesEnde = !(mp.maxHoldMin > 0);
    var halten = offenesEnde ? 240 : mp.maxHoldMin;
    var slAbs = typeof mp.sl === "number" ? Math.abs(mp.sl) : (cfg.scalpSL || 20) / 100;
    var eq = 10000;
    try { eq = equityNow() > 0 ? equityNow() : 10000; } catch (eE) { eq = 10000; }
    var einsatz = positionsWert(cfg, eq, slAbs, 1);
    var h = kostenHuerdePp(cfg, 200, 0.30, halten, einsatz);
    if (!h) { el.textContent = ""; return; }
    /* D2: Die Kante kommt aus dem Protokoll, nicht aus dem Code. Steht keins da,
     * wird nichts behauptet - die Huerde allein ist dann die Aussage.
     * (Bis 23.08.2026 stand hier KANTE = { rsi2seit: 0.11 } fest verdrahtet. Die
     * Zahl war ein Tagesmittel aus einer Messung mit dem Fehler A6 und wurde gegen
     * Kosten JE UMLAUF gestellt - daraus wurde "netto +0,01 Pp" in Gruen, waehrend
     * dasselbe Protokoll "nicht entscheidbar" und je Signal -0,14 Pp fuehrte.) */
    var kante = PROTOKOLL_KANTE[cfg.mode] || null;
    var std = halten >= 60 ? Math.round(halten / 60) + " h" : halten + " Min";
    var T = h.teile || { spanne: h.pp, zeit: 0, gebuehr: 0 };
    var txt = "<b>Kostenhürde:</b> " + h.pp.toFixed(3) + " Pp je Umlauf" +
      " · " + h.produkt + (h.hebel > 1.5 ? " (Hebel " + h.hebel.toFixed(1) + ")" : "") +
      " · Haltedauer " + std + (offenesEnde ? " (angenommen – dieser Modus hat keinen Zeitausstieg)" : "") +
      " · Einsatz " + Math.round(h.einsatz) + " $" +
      ". So weit muss sich der <i>Basiswert</i> bewegen, bevor etwas übrig bleibt." +
      "<br><span style=\"color:var(--muted);\">Davon Spanne " + T.spanne.toFixed(3) +
      " · Zeitwert " + T.zeit.toFixed(3) + " · Ordergebühr " + T.gebuehr.toFixed(3) +
      (T.uebernacht ? " · Übernacht-Finanzierung " + T.uebernacht.toFixed(3) + " (" + (h.naechte || 0) + " Nächte)" : "") +
      " Pp.</span>" +
      (cfg.instrument === "basis" && !(cfg.orderFee > 0)
        ? "<br><span style=\"color:var(--muted);\">Capital.com berechnet keine Kommission; ohne Hebel entfällt auch die Übernacht-Finanzierung. Für diesen Weg ist die Spanne der ganze Preis.</span>"
        : "");
    /* Die Gebuehr ist ein fester Betrag - auf einer kleinen Position wiegt sie alles
     * andere auf. Das ist kein Randfall, sondern der Regelfall beim Risiko-Sizing,
     * deshalb steht es als Satz da und nicht nur als Zahl. */
    if (T.gebuehr > T.spanne + T.zeit && T.gebuehr > 0) {
      txt += "<br><span class=\"warn\">Die Ordergebühr allein ist größer als Spanne und Zeitwert zusammen." +
        " Sie ist ein fester Betrag: Bei " + Math.round(h.einsatz) + " $ Einsatz wiegt sie " +
        (h.einsatz > 0 ? ((cfg.orderFee || 0) * 2 / h.einsatz * 100).toFixed(2) : "?") +
        " % der Position. Größere Positionen senken genau diesen Anteil.</span>";
    }
    if (kante != null && kante.jeSignalPp != null) {
      var netto = kante.jeSignalPp - h.pp;
      /* GRUEN NUR BEI BESTAETIGT. Ein positives Vorzeichen ist kein Vorsprung -
       * das war der Fehler, den diese Zeile bis zum 23.08.2026 gemacht hat. */
      var belegt = kante.urteil === "bestaetigt";
      txt += "<br>Messung vom " + kante.datum + ": Überschuss je Signal <b>" +
        (kante.jeSignalPp >= 0 ? "+" : "") + kante.jeSignalPp.toFixed(3) + " Pp</b> gegen eine gepaarte Kontrolle" +
        (kante.varianten > 1 ? " (beste von " + kante.varianten + " Varianten)" : "") +
        " → <span class=\"" + (belegt && netto > 0 ? "gut" : "warn") + "\">netto " +
        (netto >= 0 ? "+" : "") + netto.toFixed(3) + " Pp</span>";
      if (!belegt) {
        txt += "<br><span class=\"warn\">Urteil der Messmaschine: <b>" + kante.urteil +
          "</b>. Diese Zahl ist kein belegter Vorsprung – auch dann nicht, wenn sie positiv ist.</span>";
      } else if (netto <= 0) {
        txt += " – mit diesem Produkt trägt der Vorsprung die Kosten nicht.";
      }
    }
    el.innerHTML = txt;
  }
  if (typeof window !== "undefined") { window.__huerde = kostenHuerdePp; }

  /* ================= Lokale KI-Pruefung (Veto/Boost) ================= */
  /* ================= Benachrichtigungen & Nachbilden ================= */
  var SLUGS = { AAPL: 'apple', MSFT: 'microsoft', NVDA: 'nvidia', GOOGL: 'alphabet', AMZN: 'amazon', META: 'meta-platforms', TSLA: 'tesla', AMD: 'amd', AVGO: 'broadcom', TSM: 'tsmc', ASML: 'asml', INTC: 'intel', QCOM: 'qualcomm', MU: 'micron-technology', ARM: 'arm-holdings' };

  /** Allgemeine Benachrichtigung - fuer die seltenen, wichtigen Ereignisse
   *  (Quelle gestoert, Kante verfallen, Speichern fehlgeschlagen). */
  function melde(titel, text) {
    if (!D || D.notify === false) return;
    try {
      var n0 = new Notification(titel, { body: text, silent: false });
      n0.onclick = function () { window.focus(); };
    } catch (e) { /* Benachrichtigungen nicht verfuegbar */ }
  }

  function notifyTrade(trade, action) {
    if (!D || D.notify === false) return;
    try {
      var title = action === 'open'
        ? 'KI-Depot: ' + (trade.dir === 'call' ? 'CALL' : 'PUT') + ' ' + trade.sym + ' eröffnet'
        : 'KI-Depot: ' + (trade.dir === 'call' ? 'CALL' : 'PUT') + ' ' + trade.sym + ' geschlossen';
      var body = action === 'open'
        ? 'Basispreis ' + U.nf2.format(trade.strike) + ' · fällig ' + U.d(trade.expiry) + (trade.omega ? ' · Hebel ~' + trade.omega + 'x' : '') + '\nZum Nachbilden: App öffnen → Nachbilden-Button.'
        : 'P/L ' + U.signTxt(trade.pnl, ' $') + ' (' + (trade.why || '') + ')' + (trade.replicated ? '\nDu hast diesen Trade nachgebildet → reale Position prüfen/schließen!' : '');
      var n = new Notification(title, { body: body, silent: false });
      n.onclick = function () { window.focus(); };
    } catch (e) { /* Benachrichtigungen nicht verfügbar */ }
  }

  function findTrade(id) {
    for (var i = 0; i < D.trades.length; i++) if (D.trades[i].id === id) return D.trades[i];
    return null;
  }

  function ticketText(t, slTxt, tpTxt) {
    return 'OPTIONSSCHEIN-SUCHE (Trade #' + t.id + ' nachbilden – SIMULATION, keine Anlageberatung)\n' +
      '• Typ: ' + (t.dir === 'call' ? 'CALL' : 'PUT') + ' auf ' + t.sym + '\n' +
      '• Basispreis (Strike): ca. ' + U.nf2.format(t.strike) + ' $ (±2 %)\n' +
      '• Laufzeit: mindestens bis ' + U.d(t.expiry) + ' (gern etwas länger)\n' +
      '• Zielhebel (Omega): ~' + (t.omega || Math.round(Q.warrantOmega(t.dir, { strike: t.strike, expiry: t.expiry, iv: t.iv, ratio: t.ratio || Q.RATIO }, t.entrySpot, t.openT) * 10) / 10) + 'x · Bezugsverhältnis ' + String(t.ratio || Q.RATIO).replace('.', ',') + '\n' +
      '• Sim-Einsatz: ' + U.nf2.format(t.entry * t.qty) + ' $ (' + t.qty + ' Stk à ' + U.nf2.format(t.entry) + ' $) – real nur mit Spielgeld-Betrag!\n' +
      '• Exit auf den BASISWERT bezogen: Stop-Loss ' + slTxt + ' · Take-Profit ' + tpTxt + '\n' +
      '• Zusätzlich schließen bei App-Meldung (Gegensignal' + (t.strategy === 'intraday' ? ' / Tagesschluss' : ' / Zeit-Exit') + ')';
  }

  function openTicket(id) {
    var t = findTrade(id);
    if (!t) return;
    var now = Date.now();
    var w = { strike: t.strike, expiry: t.expiry, iv: t.iv, ratio: t.ratio || Q.RATIO };
    var spot = spotOf(t.sym) || t.entrySpot;
    var slLevel = Q.underlyingAtTarget(t.dir, w, t.entry * (1 + (t.sl || -0.4)), now, spot);
    var tpLevel = Q.underlyingAtTarget(t.dir, w, t.entry * (1 + (t.tp || 0.8)), now, spot);
    var slTxt = (t.dir === 'call' ? 'unter ~' : 'über ~') + U.nf2.format(slLevel) + ' $';
    var tpTxt = (t.dir === 'call' ? 'über ~' : 'unter ~') + U.nf2.format(tpLevel) + ' $';
    var omega = t.omega || Math.round(Q.warrantOmega(t.dir, w, spot, now) * 10) / 10;
    var aufgeld = Q.warrantAufgeld(t.dir, w, spot, now);
    var slug = SLUGS[t.sym];
    document.getElementById('ticketTitle').textContent = 'Nachbilden: ' + (t.dir === 'call' ? 'CALL' : 'PUT') + ' ' + t.sym + ' (Trade #' + t.id + ')';
    document.getElementById('ticketBody').innerHTML =
      '<p>So findest du einen <b>vergleichbaren echten Optionsschein</b> bei deinem Broker bzw. in einem Schein-Finder:</p>' +
      '<ul>' +
      '<li><b>Typ:</b> ' + (t.dir === 'call' ? 'Call' : 'Put') + ' auf <b>' + U.esc(t.sym) + '</b></li>' +
      '<li><b>Basispreis:</b> ca. <b>' + U.nf2.format(t.strike) + ' $</b> (±2 % ist okay)</li>' +
      '<li><b>Laufzeit:</b> mindestens bis <b>' + U.d(t.expiry) + '</b> – lieber etwas länger als kürzer (weniger Zeitwert-Stress)</li>' +
      '<li><b>Zielhebel:</b> ~' + omega + 'x (Omega) · Aufgeld aktuell ~' + aufgeld.toFixed(1) + ' % · Bezugsverhältnis 0,1</li>' +
      '<li><b>Größe:</b> Sim nutzt ' + U.nf2.format(t.entry * t.qty) + ' $ – nimm real einen Betrag, dessen <b>Totalverlust</b> okay wäre</li>' +
      '</ul>' +
      '<h4>Exits (auf den ' + U.esc(t.sym) + '-Kurs umgerechnet)</h4>' +
      '<ul>' +
      '<li><b>Stop-Loss:</b> ' + U.esc(t.sym) + ' ' + slTxt + ' (entspricht ca. −' + Math.round(Math.abs(t.sl || -0.4) * 100) + ' % auf den Schein)</li>' +
      '<li><b>Take-Profit:</b> ' + U.esc(t.sym) + ' ' + tpTxt + ' (ca. +' + Math.round((t.tp || 0.8) * 100) + ' % auf den Schein)</li>' +
      '<li>Zusätzlich schließen, wenn die App die Sim-Position schließt (Benachrichtigung an lassen!)</li>' +
      '</ul>' +
      '<h4>Schein-Finder</h4>' +
      '<ul>' +
      (slug ? '<li><a href="https://www.finanzen.net/optionsscheine/auf-' + slug + '" target="_blank" rel="noopener">finanzen.net: Optionsscheine auf ' + U.esc(t.sym) + '</a></li>' : '') +
      '<li><a href="https://www.onvista.de/derivate/optionsscheine" target="_blank" rel="noopener">onvista Optionsschein-Finder</a></li>' +
      '</ul>' +
      '<p style="color:var(--muted); font-size:var(--fs-neben);">Tipp: Sortiere im Finder nach Spread und wähle einen großen Emittenten mit engem Spread – die Nebenkosten entscheiden bei kurzen Trades.</p>';
    var chk = document.getElementById('ticketReplicated');
    chk.checked = !!t.replicated;
    chk.onchange = function () { t.replicated = chk.checked; save(); render(); };
    document.getElementById('ticketCopyBtn').onclick = function () {
      navigator.clipboard.writeText(ticketText(t, slTxt, tpTxt)).then(function () {
        document.getElementById('ticketStatus').textContent = 'Kopiert!';
        setTimeout(function () { document.getElementById('ticketStatus').textContent = ''; }, 2000);
      });
    };
    document.getElementById('ticketStatus').textContent = '';
    window.openModal('ticketModalBg');
  }
  /** Messschnitt: Trades vor dem Schnitt zählen nicht in Statistik, Ranking und Auswertung.
   *  So bleibt die Historie erhalten, verfälscht aber keine Messung mehr. */
  function istMess(t) { return !t.legacy; }
  function messSchnittSetzen(grund) {
    var n = 0;
    (D.trades || []).forEach(function (t) { if (!t.legacy) { t.legacy = true; n++; } });
    D.messStart = Date.now();
    D.messGrund = grund || '';
    return n;
  }

  /** Realisierter P/L des heutigen Handelstags – nur eigene, gemessene Trades. */
  function tagesPnl() {
    var heute = new Date().toISOString().slice(0, 10);
    var sel = (D.trades || []).filter(function (t) {
      return t.status === 'closed' && !t.legacy && t.closeT &&
        new Date(t.closeT).toISOString().slice(0, 10) === heute;
    });
    var sum = sel.reduce(function (a, t) { return a + t.pnl; }, 0);
    /* Bezugsgroesse ist das Kapital DIESES Tages, nicht die Startkonstante. Sonst
     * meldet ein aufgestocktes oder gewachsenes Depot einen falschen Tagesprozentsatz -
     * und der Kill-Switch entscheidet auf derselben Zahl. */
    var basis = D.dayStartEq > 0 ? D.dayStartEq : START_CAPITAL;
    return { n: sel.length, pnl: Math.round(sum * 100) / 100, pct: Math.round(sum / basis * 10000) / 100 };
  }

  function save() {
    exportAnalysis(false); // Analyse-Dateien im Downloads-Ordner aktuell halten (gedrosselt)
    /* Das Ergebnis wurde frueher nie geprueft: Volle Platte oder ein blockierendes
     * Programm hiess stilles Nicht-Speichern bei laufendem Handel - beim Beenden
     * war der ganze Tag weg. Jetzt: Warnband + Zaehler, und beim ersten Fehlschlag
     * eine Benachrichtigung. Der naechste save() versucht es ohnehin erneut. */
    return window.api.storeSet('depot', D).then(function (r) {
      if (r && r.ok === false) {
        HEALTH.saveFail = (HEALTH.saveFail || 0) + 1;
        if (typeof warnbandSetzen === 'function') warnbandSetzen('save',
          '<b>Speichern fehlgeschlagen</b> (' + U.esc(r.msg || 'unbekannt') + ') – die App läuft weiter, aber ' +
          'Änderungen seit dem letzten erfolgreichen Speichern gingen beim Beenden verloren. ' +
          'Häufigste Ursachen: Platte voll oder ein Programm blockiert den Daten-Ordner.');
        if (HEALTH.saveFail === 1) melde('Speichern fehlgeschlagen', 'Der Depot-Stand kann gerade nicht gesichert werden: ' + (r.msg || 'unbekannt'));
      } else if (r && r.ok && HEALTH.saveFail) {
        HEALTH.saveFail = 0;
        if (typeof warnbandSetzen === 'function') warnbandSetzen('save', null);
      }
      return r;
    });
  }

  /* ================= Parallel-Helfer & Backtest-Worker-Pool ================= */
  /** Parallel über Items laufen (max. conc gleichzeitig), Reihenfolge bleibt erhalten. */
  async function pmap(items, worker, conc) {
    var out = new Array(items.length), idx = 0;
    async function lane() {
      while (idx < items.length) {
        var i = idx++;
        try { out[i] = await worker(items[i], i); } catch (e) { out[i] = null; }
      }
    }
    var lanes = [];
    for (var l = 0; l < Math.max(1, Math.min(conc || 5, items.length)); l++) lanes.push(lane());
    await Promise.all(lanes);
    return out;
  }

  /** Worker-Pool: Backtests laufen in eigenen Threads (nutzt mehrere CPU-Kerne, UI bleibt flüssig). */
  var BTPool = (function () {
    /* Wie viele Worker duerfen laufen? Der alte feste Deckel von 8 schnitt die Formel ab:
     * auf einem 16-Thread-Rechner wollte sie 12 und bekam 8 - die halbe Maschine lag brach,
     * ausgerechnet bei der Nacht-Messung, wo niemand die Oberflaeche braucht.
     * Jetzt nach Lage: Boerse zu -> 75 % (Messung/Tiefensuche duerfen liefern),
     * Boerse offen -> 50 % (Luft fuer Oberflaeche, Kursabrufe und den Live-Scanner). */
    function poolGroesse() {
      var kerne = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
      var zu = true;
      try { zu = !(window.Dash && window.Dash.marketOpen && window.Dash.marketOpen()); } catch (e) { zu = true; }
      // Boerse zu UND Handel pausiert: die Maschine hat nichts Besseres zu tun.
      // Zwei Threads bleiben dem Betriebssystem und der Oberflaeche.
      if (zu && !handelBrauchtRechenzeit()) return Math.max(2, Math.min(15, kerne - 2));
      return zu ? Math.max(2, Math.min(12, Math.floor(kerne * 0.75)))
                : Math.max(2, Math.min(8, Math.floor(kerne * 0.5)));
    }
    var workers = [], queue = [], nextId = 1, pending = {}, ok = typeof Worker !== 'undefined';
    // Kurskarten bekommen eine Kennung; jeder Worker cached die letzten 3 Karten und
    // erhält Folgeauftraege nur noch mit der Kennung statt mit dem kompletten Datensatz.
    var MAP_IDS = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
    var mapIdZaehler = 0;
    function mapIdVon(m) {
      if (!MAP_IDS || !m || typeof m !== 'object') return 0;
      if (!MAP_IDS.has(m)) MAP_IDS.set(m, ++mapIdZaehler);
      return MAP_IDS.get(m);
    }
    var fehler = 0;
    function fertig(id, res) {
      var job = pending[id];
      if (!job) return;
      delete pending[id];
      if (job.timer) clearTimeout(job.timer);
      job.cb(res);
    }
    /** Rechnet im Hauptthread weiter – langsamer, aber es bleibt nie etwas hängen. */
    function selbstRechnen(job) {
      try {
        // Notpfad ohne Worker - muss dieselben Auftragsarten kennen, sonst faellt
        // ein Buendel-Auftrag beim Ausfall des Hintergrund-Rechnens lautlos auf die Nase.
        if (job.fn === 'daily') job.cb(Q.backtest(job.histMap, job.opts));
        else if (job.fn === 'intradayMulti') job.cb(Q.backtestIntradayMulti(job.histMap, job.opts.basis, job.opts.varianten));
        else job.cb(Q.backtestIntraday(job.histMap, job.opts));
      } catch (e) { job.cb({ error: String(e && e.message ? e.message : e) }); }
    }
    function spawn() {
      var w;
      try { w = new Worker('bt-worker.js'); } catch (e) { ok = false; return null; }
      w.busy = false; w.jobId = 0;
      // Erstkontakt-Wächter: Antwortet ein frisch gestarteter Worker nicht (z. B. weil das
      // Hintergrund-Rechnen in dieser Umgebung gesperrt ist), wird endgültig auf den
      // Hauptthread umgeschaltet, statt ewig zu warten.
      w.probe = setTimeout(function () { if (!w.hatGeantwortet) w.onerror(); }, 8000);
      try { w.postMessage({ ping: 1 }); } catch (ePing) { /* faellt in onerror */ }
      w.onmessage = function (e2) {
        w.hatGeantwortet = true;
        if (w.probe) { clearTimeout(w.probe); w.probe = null; }
        if (e2.data && e2.data.pong) return;      // reines Lebenszeichen, kein Auftrag
        w.busy = false; w.jobId = 0;
        fertig(e2.data.id, e2.data.ok ? e2.data.res : { error: e2.data.msg || 'Worker-Fehler' });
        pump();
      };
      // Stirbt ein Worker, darf der Auftrag NICHT verloren gehen – sonst wartet die Analyse ewig.
      w.onerror = function () {
        var id = w.jobId;
        if (w.probe) { clearTimeout(w.probe); w.probe = null; }
        w.busy = false; w.jobId = 0;
        fehler++;
        var idx = workers.indexOf(w);
        if (idx !== -1) workers.splice(idx, 1);
        try { w.terminate(); } catch (e3) { /* egal */ }
        if (typeof HEALTH !== 'undefined') { HEALTH.workerFail = (HEALTH.workerFail || 0) + 1; }
        // Erst mehrere Ausfaelle sind ein Umgebungsproblem. Ein einzelner Ausfall ist ein
        // einzelner Ausfall - frueher legte er den Pool fuer die ganze Sitzung still.
        if (fehler >= 3) ok = false;   // Hintergrund-Rechnen klappt hier nicht → Hauptthread
        var job = pending[id];
        if (job) { delete pending[id]; if (job.timer) clearTimeout(job.timer); selbstRechnen(job); }
        // wartende Aufträge ebenfalls retten
        if (!ok) {
          workers.slice().forEach(function (ww) { try { ww.terminate(); } catch (e4) { /* egal */ } });
          workers.length = 0;
          Object.keys(pending).forEach(function (pid) {
            var pj = pending[pid]; delete pending[pid];
            if (pj.timer) clearTimeout(pj.timer);
            selbstRechnen(pj);
          });
          var q = queue.splice(0, queue.length);
          q.forEach(selbstRechnen);
        } else pump();
      };
      workers.push(w);
      return w;
    }
    function pump() {
      // Ist das Hintergrund-Rechnen ausgefallen, dürfen wartende Aufträge nicht liegenbleiben.
      if (!ok) { var rest = queue.splice(0, queue.length); rest.forEach(selbstRechnen); return; }
      while (queue.length) {
        var free = null;
        for (var i = 0; i < workers.length; i++) if (!workers[i].busy) { free = workers[i]; break; }
        if (!free && workers.length < poolGroesse()) free = spawn();
        if (!free) {
          // Kein Worker verfügbar: entweder alle beschäftigt (warten) oder gar keiner möglich (selbst rechnen)
          if (!ok) { var rest2 = queue.splice(0, queue.length); rest2.forEach(selbstRechnen); }
          return;
        }
        var job = queue.shift();
        free.busy = true; free.jobId = job.id;
        pending[job.id] = job;
        // Karte nur mitschicken, wenn dieser Worker sie noch nicht hat
        if (!free.hatMaps) free.hatMaps = {};
        var mitDaten = !job.mapId || !free.hatMaps[job.mapId];
        if (mitDaten && job.mapId) {
          free.hatMaps[job.mapId] = Date.now();
          var kIds = Object.keys(free.hatMaps);
          if (kIds.length > 3) {
            kIds.sort(function (a2, b2) { return free.hatMaps[a2] - free.hatMaps[b2]; });
            delete free.hatMaps[kIds[0]];
            try { free.postMessage({ evict: parseInt(kIds[0], 10) }); } catch (eEv) { /* egal */ }
          }
        } else if (job.mapId) {
          free.hatMaps[job.mapId] = Date.now();   // zuletzt benutzt aktualisieren
        }
        // Sicherheitsnetz: Ein Auftrag, der nach 3 Minuten nicht zurück ist, gilt als verloren.
        // Der Worker wird dabei beendet und ersetzt – er rechnete sonst weiter und alle
        // Folgejobs stauten sich bei ihm und liefen kaskadierend in denselben Timeout.
        job.timer = setTimeout((function (jid, wk) {
          return function () {
            var j = pending[jid];
            if (!j) return;
            delete pending[jid];
            try { wk.terminate(); } catch (e0) {}
            var wi = workers.indexOf(wk);
            if (wi >= 0) workers.splice(wi, 1);
            j.cb({ error: 'Zeitüberschreitung im Hintergrund-Rechner' });
            pump();
          };
        })(job.id, free), 180000);
        free.postMessage({ id: job.id, fn: job.fn, mapId: job.mapId, map: mitDaten ? job.histMap : null, opts: job.opts });
      }
    }
    function run(fn, histMap, opts) {
      if (!ok) {
        return new Promise(function (resolve) {
          // Hauptthread nicht blockieren: Aufträge nacheinander im Leerlauf abarbeiten
          setTimeout(function () { selbstRechnen({ fn: fn, histMap: histMap, opts: opts, cb: resolve }); }, 0);
        });
      }
      return new Promise(function (resolve) {
        queue.push({ id: nextId++, fn: fn, histMap: histMap, mapId: mapIdVon(histMap), opts: opts, cb: resolve });
        pump();
      });
    }
    return { run: run };
  })();
  function btIntraday(map, opts) { return BTPool.run('intraday', map, opts); }

  /* Was haette gleichgewichtetes Halten desselben Universums ueber diese Scheibe
   * gebracht? In Prozent - dieselbe Einheit, in der foldRets rechnen.
   * Der Massstab, der dem Autopiloten bis zum 24.08.2026 fehlte. */
  function haltenUeberScheibe(map, von, bis) {
    var rr = [];
    Object.keys(map || {}).forEach(function (sym) {
      var b = map[sym];
      if (!Array.isArray(b) || b.length < 2) return;
      var ein = null, aus = null;
      for (var i = 0; i < b.length; i++) {
        var ms = b[i][0];
        if (ms < von || ms > bis) continue;
        if (!(b[i][1] > 0)) continue;
        if (ein == null) ein = b[i][1];
        aus = b[i][1];
      }
      if (ein != null && aus != null && ein > 0) rr.push(aus / ein - 1);
    });
    if (!rr.length) return null;
    /* Median statt Mittel: Ein einzelner Verdreifacher soll den Massstab nicht
     * verschieben. Wer den Median schlaegt, schlaegt den typischen Wert. */
    rr.sort(function (a, b) { return a - b; });
    return rr[rr.length >> 1] * 100;
  }
  /** Mehrere Varianten in einem Auftrag - der Worker berechnet die Einstiegssignale
   *  einmal und teilt sie. Rueckgabe: Array der Einzelergebnisse. */
  function btIntradayMulti(map, basis, varianten) {
    return BTPool.run('intradayMulti', map, { basis: basis, varianten: varianten });
  }
  function btDaily(map, opts) { return BTPool.run('daily', map, opts); }

  var WINDOW_NAMES = { all: 'ganzer Handelstag', open2: '15:30–17:30 Uhr', open4: '15:30–19:30 Uhr', close2: '20–22 Uhr' };

  /* ================= Auto-Tuning (empfehlung.json von Claude) ================= */
  var TUNE_ALLOW = {
    /* Die Liste enthielt ausschliesslich die inzwischen widerlegten Modi - eine
     * uebernommene Empfehlung konnte die Strategie also nur VON der belegten Kante
     * WEG schalten, nie zu ihr hin. Der Handels-Modus ist die eine Einstellung, die
     * eine Messung tragen muss; die Automatik darf ihn nur noch zwischen den beiden
     * belegten Kanten bewegen (UI-Audit 21.08.2026). */
    mode: ['rsi2seit', 'kapitulation'],
    interval: ['1m', '5m', '15m', '60m'],
    period: [9, 20, 50],
    confirmBps: [5, 15, 30],
    lineType: ['ema', 'vwap'],
    window: ['all', 'open2', 'open4', 'close2'],
    scalpSL: [10, 15, 20, 30, 45, 'auto'],
    sizing: ['fix', '0.25', '0.5', '1'],
    profile: ['atm21', 'otm3_14', 'otm5_10', 'atm21_b', 'atm60_b', 'otm3_30b']
  };
  async function checkRemoteRec() {
    if (!D || !window.api.readRecommendation) return;
    if (D.intraday.autoTune === false) return;
    try {
      var res = await window.api.readRecommendation();
      if (!res || !res.ok) return;
      var rec = JSON.parse(res.body);
      if (!rec || rec.quelle !== 'claude' || !rec.id || rec.id === D.lastTuneId) return;
      D.lastTuneId = rec.id;
      var vorher = JSON.parse(JSON.stringify(D.intraday));
      var applied = [];
      var it = rec.intraday || {};
      var gesperrtT = [];
      Object.keys(TUNE_ALLOW).forEach(function (k) {
        if (it[k] === undefined) return;
        var v = it[k];
        if (k === 'period' || k === 'confirmBps' || (k === 'scalpSL' && v !== 'auto')) v = parseInt(v, 10);
        if (TUNE_ALLOW[k].indexOf(v) === -1) return;
        if (D.intraday[k] === v) return;
        if (!automatikDarf(k)) { gesperrtT.push(HAND_LABEL[k] || k); return; }   // von Hand gesetzt
        D.intraday[k] = v; applied.push(k + ' → ' + v);
      });
      if (typeof it.channel === 'boolean' && D.intraday.channel !== it.channel) {
        if (automatikDarf('channel')) { D.intraday.channel = it.channel; applied.push('Trendkanal → ' + (it.channel ? 'an' : 'aus')); }
        else gesperrtT.push('Trendkanal');
      }
      if (typeof it.mtf === 'boolean' && D.intraday.mtf !== it.mtf) {
        if (automatikDarf('mtf')) { D.intraday.mtf = it.mtf; applied.push('5-Min-Bestätigung → ' + (it.mtf ? 'an' : 'aus')); }
        else gesperrtT.push('5-Min-Bestätigung');
      }
      if (Array.isArray(it.avoidHours)) {
        var ah = it.avoidHours.map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x >= 0 && x <= 23; }).slice(0, 8);
        if (JSON.stringify(ah) !== JSON.stringify(D.intraday.avoidHours || [])) {
          if (automatikDarf('avoidHours')) { D.intraday.avoidHours = ah; applied.push('Meide-Stunden → ' + (ah.join(', ') || 'keine')); }
          else gesperrtT.push('Meide-Stunden');
        }
      }
      if (gesperrtT.length) applied.push('nicht angefasst (von Hand gesetzt): ' + gesperrtT.join(' · '));
      D.lastTune = { id: rec.id, at: Date.now(), txt: String(rec.begruendung || '').slice(0, 300), applied: applied };
      if (!D.tuneLog) D.tuneLog = [];
      var closedNow = D.trades.filter(function (t) { return t.status === 'closed' && istMess(t); });
      D.tuneLog.unshift({
        id: rec.id, at: Date.now(), applied: applied, txt: String(rec.begruendung || '').slice(0, 300),
        konfigVorher: vorher,
        equityBei: Math.round(equityNow() * 100) / 100,
        tradesBei: closedNow.length,
        pnlBei: Math.round(closedNow.reduce(function (a2, t) { return a2 + t.pnl; }, 0) * 100) / 100,
        konfigNachher: JSON.parse(JSON.stringify(D.intraday))
      });
      if (D.tuneLog.length > 60) D.tuneLog = D.tuneLog.slice(0, 60);
      await save();
      // UI nachziehen
      [['idMode', D.intraday.mode], ['idInterval', D.intraday.interval], ['idPeriod', String(D.intraday.period)], ['idConfirm', String(D.intraday.confirmBps)], ['idLine', D.intraday.lineType], ['idWindow', D.intraday.window], ['idScalpSL', String(D.intraday.scalpSL)], ['idSizing', String(D.intraday.sizing)]].forEach(function (kv) {
        var el = document.getElementById(kv[0]);
        if (el) el.value = kv[1];
      });
      var chEl = document.getElementById('idChannel');
      if (chEl) chEl.checked = D.intraday.channel !== false;
      if (window.__updateParamVis) window.__updateParamVis();
      renderTune();
      renderTuneLog();
      render();
    } catch (e) { /* fehlerhafte Datei ignorieren */ }
  }
  function renderTune() {
    var el = document.getElementById('tuneStatus');
    if (!el) return;
    el.textContent = D.lastTune
      ? 'Auto-Tuning ' + U.dt(D.lastTune.at) + ': ' + (D.lastTune.applied.length ? D.lastTune.applied.join(' · ') : 'geprüft, keine Änderung nötig') + (D.lastTune.txt ? ' — ' + D.lastTune.txt : '')
      : '';
  }

  /* ================= Signal-Chart: was die Strategie sieht ================= */
  function stcParams(mode) {
    var cfg = D.intraday;
    return { ENTRY: mode, LINE: cfg.lineType || 'ema', period: cfg.period || 20, confirmBps: cfg.confirmBps,
      ZTHR: zOf(cfg.confirmBps), MINQ: 0, CHAN: false, MTF: false, TREND: false };
  }
  /** Bedingungen der letzten Kerze, einzeln geprueft - damit man sieht, WARUM (k)ein Signal steht.
   *  Die Einzelpruefungen spiegeln die Regel in Q.einstiegSignal; das Gesamturteil kommt
   *  trotzdem aus genau dieser Funktion, nicht aus der Summe der Haekchen. */
  function stcBedingungen(bars, mode, P, ciWunsch) {
    // ciWunsch: Index der zu pruefenden Kerze. Ohne Angabe die letzte abgeschlossene -
    // mit Angabe genau die Kerze, in der die Regel damals ihr Signal gab (Issue #52).
    var ci = ciWunsch == null ? bars.length - 1 : Math.max(0, Math.min(bars.length - 1, ciWunsch));
    var win = bars.slice(Math.max(0, ci - Math.max(P.period * 4, 260)), ci + 1);
    var closes = win.map(function (b) { return b[1]; });
    var n = closes.length, out = [];
    var kanal = null;
    try { kanal = Q.kanalUeber(bars, Math.max(0, ci - 200), ci); } catch (e) { }
    var kName = { seit: 'seitwärts', auf: 'aufwärts', ab: 'abwärts' };
    var vs = 0, vn = 0;
    for (var vq = n - 51; vq < n - 1; vq++) { if (vq >= 0) { vs += (win[vq][2] || 0); vn++; } }
    var vAvg = vn ? vs / vn : 0, vLast = win[n - 1][2] || 0;
    var vOk = vAvg > 0 && vLast > 1.3 * vAvg;
    var vTxt = 'Volumen der Signalkerze über dem 1,3-fachen der 50 Kerzen davor' + (vAvg > 0 ? ' – aktuell ' + (vLast / vAvg).toFixed(2) + '×' : ' – kein Volumen in der Reihe');
    var kTxt = kanal ? ' – aktuell ' + (kName[kanal.trend] || kanal.trend) + ', Güte ' + Math.round(kanal.guete) + '/100' : ' – kein Kanal berechenbar';
    if (mode === 'rsi2seit') {
      var r2 = n >= 3 ? Q.rsi(closes, 2) : null;
      var e100 = Q.emaSeries(closes, 100);
      var steigt = n >= 120 && e100[n - 1] > e100[Math.max(0, n - 9)];
      out.push({ ok: r2 != null && r2 <= 10, txt: 'RSI(2) ≤ 10 (überverkauft)' + (r2 != null ? ' – aktuell ' + r2.toFixed(1) : '') });
      out.push({ ok: steigt, txt: 'EMA100 steigt (gegen 8 Kerzen zuvor) – nur dann ist der Dip ein Kauf' });
      out.push({ ok: !!kanal && kanal.trend === 'seit', txt: 'Kanal der letzten 200 Kerzen ist seitwärts' + kTxt });
      out.push({ ok: vOk, txt: vTxt });
    } else {
      var rv = Q.reversionSignal(win, P.LINE, P.period, P.ZTHR);
      out.push({ ok: rv.z != null && rv.z <= -P.ZTHR, txt: 'Abstand zur Leitlinie EMA' + P.period + ' mindestens ' + P.ZTHR + ' Standardabweichungen UNTER ihr' + (rv.z != null ? ' – aktuell z = ' + rv.z.toFixed(2) : '') });
      out.push({ ok: n >= 2 && closes[n - 1] > closes[n - 2], txt: 'Letzte Kerze dreht bereits nach oben (kein fallendes Messer)' });
      out.push({ ok: !!kanal && kanal.trend === 'ab', txt: 'Kanal der letzten 200 Kerzen ist abwärts (Kapitulation braucht den Ausverkauf)' + kTxt });
      out.push({ ok: vOk, txt: vTxt });
    }
    var sig = null;
    try { sig = Q.einstiegSignal(bars, ci, P); } catch (e2) { }
    return { liste: out, signal: sig && sig.dir ? sig.dir : null, kanal: kanal };
  }
  /** Alle Kanaele, die fuer die Entscheidung IN EINER BESTIMMTEN KERZE zaehlen.
   *  ci ist der Index dieser Kerze in der Gesamtreihe - beim Klick auf ein historisches
   *  Signal also dessen Kerze, sonst die letzte abgeschlossene.
   *
   *  Warum das eine eigene Funktion ist: Vorher zeichnete der Chart pauschal den Kanal
   *  der LETZTEN Kerze, auch wenn die Bedingungsliste daneben ein historisches Signal
   *  nachrechnete. An 292 echten Signalen gemessen war das in 100 % der Faelle ein
   *  anderer Kanal und in 81 % einer mit anderer Richtung.
   *
   *  Entscheidungsrelevant ist genau EINER: der 200-Kerzen-Kanal, den einstiegSignal
   *  als Erlaubnis abfragt. Die uebrigen sind Kontext und sind auch so beschriftet -
   *  ein Kanal, der nichts entscheidet, darf nicht aussehen wie einer, der es tut. */
  function stcKanalListe(S, ci, mitKontext) {
    var out = [], off = S.off, ende = S.show.length - 1;
    var kName = { seit: 'seitwärts', auf: 'aufwärts', ab: 'abwärts' };
    function hol(bis) { try { return Q.kanalUeber(S.bars, Math.max(0, bis - 200), bis); } catch (e) { return null; } }
    var soll = S.mode === 'rsi2seit' ? 'seit' : 'ab';
    var kJetzt = hol(S.bars.length - 1);
    if (ci != null && ci !== S.bars.length - 1) {
      // Der Kanal, an dem das ANGEKLICKTE Signal haengt - das ist der entscheidende.
      var kSig = hol(ci);
      if (kSig) out.push({ k: kSig, endI: ci - off, farbe: 'var(--series3)', breite: 2,
        opac: 0.95, name: 'Entscheidung: ' + (kName[kSig.trend] || kSig.trend) + (kSig.trend === soll ? ' ✓' : ' ✗') });
      // Der heutige Kanal daneben, gestrichelt: er entscheidet ueber das Signal von
      // damals nichts, beantwortet aber die naheliegende Frage "und wie steht es jetzt?".
      if (kJetzt) out.push({ k: kJetzt, endI: ende, farbe: 'var(--series3)', breite: 1.2, dash: '4 4',
        opac: 0.35, fuellen: false, name: 'heute: ' + (kName[kJetzt.trend] || kJetzt.trend) });
    } else if (kJetzt) {
      out.push({ k: kJetzt, endI: ende, farbe: 'var(--series3)', breite: 2, opac: 0.95,
        name: 'Entscheidung: ' + (kName[kJetzt.trend] || kJetzt.trend) + (kJetzt.trend === soll ? ' ✓' : ' ✗') });
    }
    /* Kontext-Ebenen: derselbe Kursverlauf auf kurzer, mittlerer und langer Sicht.
     * Sie entscheiden NICHTS - sie erklaeren, warum die 200er-Sicht so eingeordnet
     * wird, wie sie eingeordnet wird. Ein kurzer Abwaertskanal in einem langen
     * Seitwaertskanal ist kein Widerspruch, sondern beides wahr. */
    if (mitKontext) {
      var bis = ci == null ? S.bars.length - 1 : ci;
      var ks = [];
      try { ks = Q.kanaele(S.bars.slice(0, bis + 1)) || []; } catch (e3) { ks = []; }
      ks.forEach(function (k) {
        if (!k || !k.name || k.n >= 190 && k.n <= 210) return;   // die 200er-Sicht steht schon oben
        out.push({ k: k, endI: (k.bis != null ? k.bis : bis) - off, farbe: 'var(--muted)', breite: 1,
          dash: '2 4', opac: 0.5, fuellen: false,
          name: k.name + ' (' + k.n + '): ' + (kName[k.trend] || k.trend) });
      });
    }
    return out;
  }
  /** Ueberdehnungsband um die Leitlinie, je sichtbarer Kerze.
   *  Nur fuer den Kapitulations-Modus: dort IST die Unterkante der Ausloeser
   *  (z <= -ZTHR ist genau der Kurs an der Unterkante). Beim RSI(2)-Modus loest
   *  RSI(2) aus, nicht dieses Band - dann waere es Zierrat und bleibt weg.
   *  Die Kurse kommen aus reversionSignal selbst, damit es nur eine Formel gibt. */
  function stcBandSerie(S) {
    if (S.mode !== 'kapitulation') return null;
    var out = [];
    for (var k = 0; k < S.show.length; k++) {
      var gi = S.off + k;
      if (gi < 120) { out.push(null); continue; }
      var r = null;
      try { r = Q.reversionSignal(S.bars.slice(Math.max(0, gi - 260), gi + 1), S.P.LINE, S.P.period, S.P.ZTHR); } catch (e) { r = null; }
      out.push(r && r.bandUnten ? { oben: r.bandOben, unten: r.bandUnten } : null);
    }
    return out;
  }
  /** Zustand des zuletzt geladenen Strategie-Charts. Wird gebraucht, damit ein Klick auf
   *  ein historisches Signal die Bedingungen JENER Kerze nachrechnen kann, ohne die Reihe
   *  neu zu laden. Reine Anzeige - hier wird nichts gehandelt und nichts gespeichert. */
  var stcState = null;
  /* Laufsperre gegen den Doppelklick. Die Zeile fehlte zwischenzeitlich; unter
   * 'use strict' warf runStrategieChart() dadurch bei JEDEM Klick auf "Chart laden"
   * eine ReferenceError, und der Chartbereich blieb leer. */
  var stcRunning = false;
  var STC_IV = { '60m': { min: 60, txt: '60-Minuten-Kerzen' }, '15m': { min: 15, txt: '15-Minuten-Kerzen' }, '5m': { min: 5, txt: '5-Minuten-Kerzen' } };
  /** Die Rechnung hinter dem Strategie-Chart, ohne jede Oberflaeche: Kerzen holen,
   *  Signale nachspielen, Hilfslinien bauen. Seit Issue #68 steht sie getrennt da,
   *  weil sie zwei Ansichten bedient - den grossen Chart im Reiter "Regeln" und die
   *  aufgeklappte Zeile einer offenen Position. Zwei Ansichten, EINE Rechnung: sonst
   *  zeigen sie irgendwann verschiedene Signale fuer denselben Wert, und niemand
   *  weiss, welche der beiden das Buch meint. */
  async function stcRechnen(sym, mode, iv, spanne) {
    var ivCfg = STC_IV[iv] || STC_IV['60m'];
    if (!(spanne > 0)) spanne = 320;
    /* Vorlauf: der Detektor rechnet erst ab Kerze 261 (Kanal ueber 200 + EMA100).
     * Ohne diesen Puffer waere der linke Teil des Bildes systematisch signalfrei -
     * man hielte eine Luecke der Rechnung fuer eine Aussage ueber den Markt. */
    var tiefe = Math.max(900, spanne + 320);
    var bars = null;
    // Archiv zuerst: es hat die Tiefe (>= 261 Kerzen), die der Detektor braucht - wie im Live-Scan.
    if (window.Archiv) { try { bars = await window.Archiv.serie(iv, sym); } catch (eA) { bars = null; } }
    if (!bars || bars.length < 300) {
      var fd = await fetchIntraday(sym, iv, true);
      if (fd && fd.series && (!bars || fd.series.length > bars.length)) bars = fd.series;
    }
    if (!bars || bars.length < 300) {
      return { ok: false, grund: 'Zu wenig ' + ivCfg.txt + ' für ' + sym + ' (' + (bars ? bars.length : 0) +
        ' < 300) – der Detektor rechnet erst ab 261 Kerzen wie gemessen.' };
    }
    bars = Q.fertigeBars(bars.slice(-tiefe), ivCfg.min, Date.now());
    var P = stcParams(mode);
    // Signale nachspielen: wie der Edge-Waechter, mit der Abklingzeit des Modus
    var cool = 0, marks = [], coolMin = D.intraday.cooldownMin != null ? D.intraday.cooldownMin : 120;
    for (var i = 261; i < bars.length; i++) {
      if (bars[i][0] - cool < coolMin * 60000) continue;
      var s = null;
      try { s = Q.einstiegSignal(bars, i, P); } catch (e) { }
      if (!s || s.dir !== 'call') continue;
      cool = bars[i][0];
      marks.push(i);
    }
    var show = bars.slice(-Math.min(spanne, bars.length));
    var off = bars.length - show.length;
    var closesAll = bars.map(function (b) { return b[1]; });
    var e20 = Q.emaSeries(closesAll, P.period).slice(off), e100 = Q.emaSeries(closesAll, 100).slice(off);
    var bed = stcBedingungen(bars, mode, P);
    var indSerie = [];
    if (mode === 'rsi2seit') {
      for (var k = 0; k < show.length; k++) { var gi = off + k; indSerie.push(gi >= 2 ? Q.rsi(closesAll, 2, gi) : null); }
    } else {
      for (var k2 = 0; k2 < show.length; k2++) {
        var gi2 = off + k2;
        if (gi2 < 120) { indSerie.push(null); continue; }
        var rz = Q.reversionSignal(bars.slice(Math.max(0, gi2 - 260), gi2 + 1), P.LINE, P.period, P.ZTHR);
        indSerie.push(rz && rz.z != null ? rz.z : null);
      }
    }
    var marksShow = marks.filter(function (m) { return m >= off; }).map(function (m) { return m - off; });
    var S = { bars: bars, show: show, off: off, mode: mode, P: P, marks: marks, sym: sym, iv: iv,
      e20: e20, e100: e100, kanal: bed.kanal, marksShow: marksShow, gewaehlt: null, band: null };
    S.band = stcBandSerie(S);
    return { ok: true, S: S, indSerie: indSerie, bed: bed, ivCfg: ivCfg };
  }

  async function runStrategieChart() {
    if (stcRunning) return;
    stcRunning = true;
    var sel = document.getElementById('stcSym'), modeEl = document.getElementById('stcMode'), st = document.getElementById('stcStatus');
    var btn = document.getElementById('stcBtn'), info = document.getElementById('stcInfo');
    var svg = document.getElementById('stcChart'), ind = document.getElementById('stcInd');
    var ivEl = document.getElementById('stcIv'), spEl = document.getElementById('stcSpanne'), warnEl = document.getElementById('stcIvWarn');
    if (!sel || !modeEl || !svg) { stcRunning = false; return; }
    btn.disabled = true;
    try {
      var sym = sel.value, mode = modeEl.value === 'kapitulation' ? 'kapitulation' : 'rsi2seit';
      var iv = ivEl && STC_IV[ivEl.value] ? ivEl.value : '60m';
      var ivCfg = STC_IV[iv];
      var spanne = spEl ? parseInt(spEl.value, 10) : 320;
      if (!(spanne > 0)) spanne = 320;
      // Ehrlichkeit vor Bequemlichkeit: gemessen sind beide Regeln auf 60m. Andere
      // Kerzenlaengen darf man sich ansehen, aber sie sind KEIN Beleg - genau dieser
      // stille Wechsel weg von der gemessenen Konfiguration hat hier schon einmal
      // Live und Messung auseinanderlaufen lassen.
      if (warnEl) {
        if (iv === '60m') { warnEl.style.display = 'none'; warnEl.textContent = ''; }
        else {
          warnEl.style.display = '';
          warnEl.textContent = 'Achtung: ' + ivCfg.txt + ' sind NICHT die gemessene Konfiguration. Beide Regeln wurden auf 60-Minuten-Kerzen belegt, und die grosse Signalstudie vom 23.08.2026 fand auf anderen Zeitrahmen keine tragfaehige Kante. Was hier steht, ist eine Ansicht zum Nachvollziehen der Mechanik - kein Beleg. Gehandelt wird weiterhin nur, was auf 60m gemessen ist.';
        }
      }
      st.textContent = 'Lade ' + sym + ' (' + ivCfg.txt + ') …';
      var r = await stcRechnen(sym, mode, iv, spanne);
      if (!r.ok) { st.textContent = r.grund; return; }
      var bed = r.bed;
      var bars = r.S.bars, show = r.S.show, off = r.S.off, P = r.S.P;
      var marks = r.S.marks, marksShow = r.S.marksShow, e20 = r.S.e20, e100 = r.S.e100;
      var indSerie = r.indSerie;
      st.textContent = '';
      stcState = r.S;
      var kEl = document.getElementById('stcKontext');
      drawStrategieChart(svg, show, e20, e100, stcKanalListe(stcState, null, !!(kEl && kEl.checked)),
        marksShow, null, stcState.band);
      drawStrategieIndikator(ind, show, indSerie, mode === 'rsi2seit'
        ? { lo: 0, hi: 100, schwelle: 10, name: 'RSI(2)' }
        : { lo: -4, hi: 4, schwelle: -P.ZTHR, name: 'z-Abstand zur EMA' + P.period });
      var name = mode === 'rsi2seit' ? 'RSI(2) im Seitwärtskanal' : 'Kapitulations-Dip im Abwärtskanal';
      var tage = Math.round((bars[bars.length - 1][0] - bars[261][0]) / 86400000);
      info.innerHTML = '<b>' + U.esc(name) + '</b> auf ' + U.esc(sym) + ' · ' + bars.length + ' ' + U.esc(ivCfg.txt) + ', davon ' + show.length + ' im Bild · Einstiege laut Regel in den letzten ~' + tage + ' Tagen: <b>' + marks.length + '</b>, im Bild <b>' + marksShow.length + '</b>' +
        ' · letzte Kerze ' + U.esc(new Date(bars[bars.length - 1][0]).toLocaleString('de-DE')) +
        (bed.signal === 'call' ? ' · <b style="color:var(--up);">Regel gibt JETZT ein Long-Signal</b>' : bed.signal === 'put' ? ' · Put-Seite gemeldet – trägt nicht, wird nicht gehandelt' : ' · aktuell kein Signal');
      stcListeZeichnen();
      stcCheckZeichnen(null);
    } catch (e3) {
      st.textContent = 'Fehler: ' + (e3.message || e3);
    } finally {
      btn.disabled = false;
      stcRunning = false;
    }
  }
  /** Alle historischen Signale der geladenen Reihe als anklickbare Liste (Issue #52).
   *  Nur was der Detektor tatsaechlich gemeldet hat - keine Nachbesserung, keine Auswahl
   *  der schoenen Faelle. Der spaetere Verlauf steht bewusst dabei: Wer ein Signal prueft,
   *  will sehen, was danach passiert ist. Das ist eine Beobachtung an EINEM Wert und
   *  ersetzt keine Messung - der Beleg steht in den Studien oben. */
  function stcListeZeichnen() {
    var el = document.getElementById('stcSignale');
    if (!el) return;
    var S = stcState;
    if (!S) { el.innerHTML = ''; return; }
    if (!S.marks.length) {
      el.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--muted);">Keine Einstiege der Regel in diesem Zeitraum. Das ist ein normales Ergebnis – beide Regeln melden sich selten, und genau deshalb sind sie ueberhaupt messbar.</div>';
      return;
    }
    // Juengstes Signal zuerst: das ist das, was man pruefen will
    var rows = S.marks.slice().reverse().map(function (mi) {
      var b = S.bars[mi];
      // Verlauf danach: Schlusskurs 6 Kerzen spaeter, sofern die Reihe so weit reicht
      var zi = Math.min(S.bars.length - 1, mi + 6);
      var d6 = zi > mi ? (S.bars[zi][1] / b[1] - 1) * 100 : null;
      var imBild = mi >= S.off;
      return '<tr class="stcRow" data-idx="' + mi + '" style="cursor:pointer;' + (S.gewaehlt === mi ? ' background:var(--grid);' : '') + '">' +
        '<td>' + U.esc(new Date(b[0]).toLocaleString('de-DE')) + '</td>' +
        '<td>' + U.nf2.format(b[1]) + ' $</td>' +
        '<td class="' + (d6 == null ? '' : U.signCls(d6)) + '">' + (d6 == null ? '–' : U.signTxt(Math.round(d6 * 100) / 100, ' %')) + '</td>' +
        '<td style="color:var(--muted);">' + (imBild ? 'im Bild' : 'vor dem Bild') + '</td>' +
        '<td style="color:var(--series2);">Bedingungen zeigen</td></tr>';
    }).join('');
    el.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin-bottom:4px;">' + S.marks.length + ' Einstieg(e), die die Regel hier gegeben hätte – Zeile anklicken, um die Bedingungen jener Kerze nachzurechnen:</div>' +
      '<div style="max-height:230px; overflow:auto;"><table class="tbl"><tr><th>Zeitpunkt der Signalkerze</th><th>Kurs</th><th>nach 6 Kerzen</th><th>Lage</th><th></th></tr>' + rows + '</table></div>' +
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:4px;">Die Spalte „nach 6 Kerzen" ist reine Kursbewegung des Basiswerts – ohne Kosten, ohne Schein und ohne Ausstiegsregel. Sie zeigt den Verlauf, nicht das Ergebnis eines Trades, und ist kein Beleg.</div>';
  }
  /** Bedingungsliste - entweder fuer die letzte abgeschlossene Kerze (idx = null)
   *  oder fuer die angeklickte Signalkerze. */
  function stcCheckZeichnen(idx) {
    var check = document.getElementById('stcCheck');
    var S = stcState;
    if (!check || !S) return;
    var bed = stcBedingungen(S.bars, S.mode, S.P, idx);
    var kopf;
    if (idx == null) {
      kopf = 'Bedingungen der letzten abgeschlossenen Kerze (alle müssen gleichzeitig gelten):';
    } else {
      kopf = 'Bedingungen der Signalkerze vom ' + U.esc(new Date(S.bars[idx][0]).toLocaleString('de-DE')) +
        ' – so sah die Regel den Markt in genau diesem Moment:';
    }
    check.innerHTML = '<div style="color:var(--muted); margin-bottom:2px;">' + kopf + '</div>' +
      bed.liste.map(function (bb) {
        return '<div><span style="color:' + (bb.ok ? 'var(--up)' : 'var(--down)') + '; font-weight:600;">' + (bb.ok ? '✓' : '✗') + '</span> ' + U.esc(bb.txt) + '</div>';
      }).join('') +
      (idx == null ? '' : '<div style="margin-top:4px; color:var(--muted); font-size:var(--fs-neben);">Gesamturteil des Detektors in dieser Kerze: ' +
        (bed.signal === 'call' ? '<b style="color:var(--up);">Einstieg (Long)</b>' : bed.signal === 'put' ? 'Put-Seite – wird nicht gehandelt' : 'kein Signal') +
        '. Es kommt aus <code>einstiegSignal</code> selbst, nicht aus der Summe der Häkchen – deshalb kann ein Häkchen fehlen und das Urteil trotzdem stehen (die Regel prüft manches auf einem anderen Fenster).</div>');
  }
  /** Klick auf ein Signal: Bedingungen jener Kerze zeigen und die Markierung hervorheben.
   *  Nochmal auf dieselbe Zeile klicken schaltet zurueck auf die letzte Kerze. */
  function stcSignalWaehlen(idx) {
    var S = stcState;
    if (!S || !(idx >= 0) || idx >= S.bars.length) return;
    S.gewaehlt = S.gewaehlt === idx ? null : idx;
    var svg = document.getElementById('stcChart');
    var hl = S.gewaehlt != null && S.gewaehlt >= S.off ? S.gewaehlt - S.off : null;
    var kEl2 = document.getElementById('stcKontext');
    if (svg) drawStrategieChart(svg, S.show, S.e20, S.e100,
      stcKanalListe(S, S.gewaehlt, !!(kEl2 && kEl2.checked)), S.marksShow, hl, S.band);
    stcListeZeichnen();
    stcCheckZeichnen(S.gewaehlt);
  }
  /** hl: Index (im Bildausschnitt) des angeklickten Signals - wird groesser und in der
   *  Gegenfarbe gezeichnet, damit man die Zeile der Liste im Chart wiederfindet. */
  /** kanaele: Liste von { k, endI, farbe, dash, opac, name } - jeder Kanal wird an
   *  SEINER Endkerze verankert (endI = Index im Bildausschnitt), nicht pauschal am
   *  rechten Rand. band: Liste je Bildkerze mit { oben, unten } oder null.
   *  hl: Index des angeklickten Signals im Bildausschnitt. */
  function drawStrategieChart(svg, bars, e20, e100, kanaele, marks, hl, band) {
    var W = svg.clientWidth || 900, H = svg.clientHeight || 280;
    var padL = 8, padR = 10, padT = 10, padB = 20;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var closes = bars.map(function (b) { return b[1]; });
    var lo = Math.min.apply(null, closes), hi = Math.max.apply(null, closes);
    var n = bars.length;
    kanaele = (kanaele || []).filter(function (z) { return z && z.k && z.endI != null; });
    /* Kanal-Geometrie an der eigenen Endkerze: mitte(i) laeuft von der Endkerze aus
     * mit der Steigung zurueck. startI darf negativ werden - dann ragt der Kanal
     * links aus dem Bild, und genau das soll man sehen. */
    kanaele.forEach(function (z) {
      z.startI = z.endI - (z.k.n - 1);
      z.mitteBei = function (i) { return z.k.mitteJetzt - z.k.steigung * (z.endI - i); };
      z.obenAb = z.k.oben - z.k.mitteJetzt;
      z.untenAb = z.k.unten - z.k.mitteJetzt;
      var s = Math.max(0, Math.min(n - 1, z.startI)), e = Math.max(0, Math.min(n - 1, z.endI));
      [s, e].forEach(function (i) {
        lo = Math.min(lo, z.mitteBei(i) + z.untenAb);
        hi = Math.max(hi, z.mitteBei(i) + z.obenAb);
      });
    });
    if (band) for (var bi = 0; bi < n; bi++) {
      if (!band[bi]) continue;
      lo = Math.min(lo, band[bi].unten); hi = Math.max(hi, band[bi].oben);
    }
    var pad = (hi - lo) * 0.08 || 1;
    lo -= pad; hi += pad;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var step = plotW / Math.max(1, n - 1);
    function X(i) { return padL + i * step; }
    function Y(v) { return H - padB - (v - lo) / (hi - lo) * plotH; }
    var html = '';
    niceTicks(lo, hi, 4).forEach(function (tv) {
      html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(tv).toFixed(1) + '" y2="' + Y(tv).toFixed(1) + '" stroke="var(--grid)" stroke-width="1"></line>' +
        '<text x="' + (padL + 2) + '" y="' + (Y(tv) - 3).toFixed(1) + '" fill="var(--muted)" font-size="9.5">' + fmtTick(tv, hi - lo) + '</text>';
    });
    var x0 = bars[0][0], x1 = bars[n - 1][0];
    for (var xi = 0; xi <= 3; xi++) {
      var ti = Math.round((n - 1) * xi / 3);
      html += '<text x="' + X(ti).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + (xi === 0 ? 'start' : xi === 3 ? 'end' : 'middle') + '" fill="var(--muted)" font-size="9.5">' + fmtTimeTick(bars[ti][0], x1 - x0) + '</text>';
    }
    /* Ueberdehnungsband um die Leitlinie: fuer den Kapitulations-Modus IST das der
     * Ausloeser - unterhalb der Unterkante steht z <= -ZTHR. Deshalb gehoert es ins
     * Bild und nicht nur in den Indikator darunter. */
    if (band) {
      var dO = '', dU = '';
      for (var q = 0; q < n; q++) {
        if (!band[q]) continue;
        dO += (dO ? 'L' : 'M') + X(q).toFixed(1) + ' ' + Y(band[q].oben).toFixed(1);
        dU += (dU ? 'L' : 'M') + X(q).toFixed(1) + ' ' + Y(band[q].unten).toFixed(1);
      }
      if (dO && dU) {
        html += '<path d="' + dU + '" fill="none" stroke="var(--series2)" stroke-width="1" stroke-dasharray="2 3" opacity="0.75"></path>';
        html += '<path d="' + dO + '" fill="none" stroke="var(--series2)" stroke-width="1" stroke-dasharray="2 3" opacity="0.35"></path>';
      }
    }
    kanaele.forEach(function (z) {
      var s = Math.max(0, z.startI), e = Math.min(n - 1, z.endI);
      if (e <= s) return;
      var yO = function (i) { return Y(z.mitteBei(i) + z.obenAb); };
      var yU = function (i) { return Y(z.mitteBei(i) + z.untenAb); };
      var opac = z.opac == null ? 0.85 : z.opac;
      if (z.fuellen !== false) {
        html += '<path d="M' + X(s).toFixed(1) + ' ' + yO(s).toFixed(1) + ' L' + X(e).toFixed(1) + ' ' + yO(e).toFixed(1) +
          ' L' + X(e).toFixed(1) + ' ' + yU(e).toFixed(1) + ' L' + X(s).toFixed(1) + ' ' + yU(s).toFixed(1) + ' Z" fill="' + z.farbe + '" opacity="0.10"></path>';
      }
      [yO, yU].forEach(function (yf) {
        html += '<line x1="' + X(s).toFixed(1) + '" y1="' + yf(s).toFixed(1) + '" x2="' + X(e).toFixed(1) + '" y2="' + yf(e).toFixed(1) +
          '" stroke="' + z.farbe + '" stroke-width="' + (z.breite || 1.5) + '"' + (z.dash ? ' stroke-dasharray="' + z.dash + '"' : '') + ' opacity="' + opac + '"></line>';
      });
      // Senkrechte an der Endkerze: sie zeigt, WELCHE Kerze diesen Kanal bestimmt hat.
      html += '<line x1="' + X(e).toFixed(1) + '" y1="' + yO(e).toFixed(1) + '" x2="' + X(e).toFixed(1) + '" y2="' + yU(e).toFixed(1) +
        '" stroke="' + z.farbe + '" stroke-width="1" opacity="' + (opac * 0.6) + '"></line>';
      if (z.name) {
        var ym = (yO(e) + yU(e)) / 2;
        html += '<text x="' + Math.min(W - padR - 2, X(e) - 3).toFixed(1) + '" y="' + ym.toFixed(1) + '" text-anchor="end" fill="' + z.farbe +
          '" font-size="9.5" opacity="' + Math.min(1, opac + 0.15) + '">' + U.esc(z.name) + '</text>';
      }
    });
    var linie = function (arr, farbe, dash) {
      var d = '';
      for (var i = 0; i < n; i++) { if (arr[i] == null) continue; d += (d ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(arr[i]).toFixed(1); }
      return d ? '<path d="' + d + '" fill="none" stroke="' + farbe + '" stroke-width="1.3" stroke-dasharray="' + dash + '"></path>' : '';
    };
    html += linie(e100, 'var(--series4)', '2 3') + linie(e20, 'var(--series2)', '5 4');
    html += '<path d="' + bars.map(function (b, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(b[1]).toFixed(1); }).join(' ') +
      '" fill="none" stroke="var(--series)" stroke-width="1.8" stroke-linejoin="round"></path>';
    marks.forEach(function (i) {
      var aktiv = hl != null && hl === i;
      // data-mark traegt den Index im Bildausschnitt; der Klick-Handler rechnet ihn
      // mit dem Versatz der Reihe in den echten Kerzenindex um.
      html += '<circle class="stcMark" data-mark="' + i + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(bars[i][1]).toFixed(1) + '" r="' + (aktiv ? 8 : 5) +
        '" fill="' + (aktiv ? 'var(--series2)' : 'var(--up)') + '" stroke="var(--surface)" stroke-width="2" style="cursor:pointer;"></circle>';
    });
    svg.innerHTML = html;
    svg.__chart = null;
  }
  function drawStrategieIndikator(svg, bars, serie, o) {
    if (!svg) return;
    var W = svg.clientWidth || 900, H = svg.clientHeight || 110;
    var padL = 8, padR = 10, padT = 6, padB = 6;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var n = bars.length, plotW = W - padL - padR, plotH = H - padT - padB;
    var step = plotW / Math.max(1, n - 1);
    function X(i) { return padL + i * step; }
    function Y(v) { return H - padB - (Math.max(o.lo, Math.min(o.hi, v)) - o.lo) / (o.hi - o.lo) * plotH; }
    var html = '<rect x="' + padL + '" y="' + padT + '" width="' + plotW + '" height="' + plotH + '" fill="var(--grid)" opacity="0.25"></rect>';
    // Schwellenzone: unterhalb (RSI <= 10 bzw. z <= -ZTHR) ist der Ausloeser scharf
    html += '<rect x="' + padL + '" y="' + Y(o.schwelle).toFixed(1) + '" width="' + plotW + '" height="' + (H - padB - Y(o.schwelle)).toFixed(1) + '" fill="var(--up)" opacity="0.12"></rect>';
    html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(o.schwelle).toFixed(1) + '" y2="' + Y(o.schwelle).toFixed(1) + '" stroke="var(--up)" stroke-width="1" stroke-dasharray="3 3"></line>';
    html += '<text x="' + (padL + 2) + '" y="' + (padT + 10) + '" fill="var(--muted)" font-size="9.5">' + U.esc(o.name) + ' · Schwelle ' + o.schwelle + '</text>';
    var d = '';
    for (var i = 0; i < n; i++) { if (serie[i] == null) continue; d += (d ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(serie[i]).toFixed(1); }
    if (d) html += '<path d="' + d + '" fill="none" stroke="var(--series2)" stroke-width="1.3"></path>';
    svg.innerHTML = html;
  }

  /* ================= Filter-Nutzen: mit vs. ohne Filter ================= */
  var filterRunning = false;
  async function runFilterCheck() {
    if (filterRunning) return;
    filterRunning = true;
    var btn = document.getElementById('filterBtn'), st = document.getElementById('filterStatus'), out = document.getElementById('filterResult');
    btn.disabled = true;
    try {
      var cfg = D.intraday;
      var iv = cfg.interval || '5m';
      st.textContent = 'Lade ' + iv + '-Historie …';
      var map = {}, done = 0;
      var syms = universe();
      await pmap(syms, async function (sy) {
        var fd = await fetchIntraday(sy, iv, true);
        done++;
        st.textContent = 'Lade Historie … (' + done + '/' + syms.length + ')';
        if (fd && fd.series.length > 200) map[sy] = fd.series;
      }, 6);
      if (Object.keys(map).length < 3) { st.textContent = 'Zu wenig Daten.'; return; }
      st.textContent = 'Rechne beide Varianten …';
      var base = labCommonOpts(cfg, iv);
      var modeKeyFC = cfg.mode === 'waves' ? 'breakout' : cfg.mode; // Altmodus 'waves' = Ausbruch mit kurzem Ausstieg
      var modeOpts = labModes(cfg).filter(function (m) { return m.key === modeKeyFC; })[0];
      modeOpts = modeOpts ? modeOpts.opts : { entryMode: 'cross' };
      var mit = Object.assign({}, base, modeOpts, { period: cfg.period, confirmBps: cfg.confirmBps, zThr: zOf(cfg.confirmBps) });
      var ohne = Object.assign({}, mit, { minEdge: 0, trendFilter: false, channel: false, mtf: false, window: 'all', minQuality: 0 });
      var res = await Promise.all([btIntraday(map, mit), btIntraday(map, ohne)]);
      st.textContent = '';
      var a2 = res[0], b2 = res[1];
      if (a2.error || b2.error) { st.textContent = a2.error || b2.error; return; }
      function row(n, r) {
        var avg = r.summary.nTrades ? Math.round(r.trades.reduce(function (s, t) { return s + t.pnl; }, 0) / r.summary.nTrades * 100) / 100 : 0;
        return '<tr><td>' + n + '</td><td class="' + U.signCls(r.summary.retPct) + '">' + U.signTxt(r.summary.retPct, ' %') + '</td>' +
          '<td>' + r.summary.nTrades + '</td><td>' + r.summary.winRate + ' %</td><td>' + U.signTxt(avg, ' $') + '</td>' +
          '<td>' + U.nf2.format(r.summary.feesTotal || 0) + ' $</td><td>−' + r.summary.maxDrawdownPct + ' %</td></tr>';
      }
      var nutzen = Math.round((a2.summary.retPct - b2.summary.retPct) * 100) / 100;
      out.innerHTML = '<table class="tbl"><tr><th>Variante</th><th>Rendite</th><th>Trades</th><th>Treffer</th><th>Ø je Trade</th><th>Gebühren</th><th>Drawdown</th></tr>' +
        row('<b>mit</b> deinen Filtern', a2) + row('<b>ohne</b> Filter (jedes Signal)', b2) + '</table>' +
        '<div style="margin-top:8px; font-size:var(--fs-text);">Filter-Nutzen: <b class="' + U.signCls(nutzen) + '">' + U.signTxt(nutzen, ' Prozentpunkte' ) + '</b> · ' +
        (nutzen > 0 ? 'Die Filter haben in diesem Zeitraum Geld gespart.' : nutzen < 0 ? 'Achtung: Die Filter haben hier Rendite gekostet – prüfen, welcher zu streng ist.' : 'Kein messbarer Unterschied.') + '</div>' +
        '<div style="color:var(--muted); font-size:var(--fs-neben); margin-top:6px;">„Ohne Filter" heißt: kein Kosten-Check, kein Trendfilter, kein Kanal, keine 5-Min-Bestätigung, kein Zeitfenster, keine Qualitätsschwelle – nur das reine Einstiegssignal. Gleiche Kosten, gleicher Zeitraum, gleiche Werte.</div>';
    } catch (e) {
      st.textContent = 'Fehler: ' + (e.message || e);
    } finally {
      btn.disabled = false;
      filterRunning = false;
    }
  }

  /* ================= Reparatur: verwaiste Trades ================= */
  /** Trades, die im Protokoll als "offen" stehen, aber in keiner Position mehr liegen
   *  (z. B. nach einem Absturz, Doppelstart oder Versionswechsel), zurück in die
   *  Positionsverwaltung holen – sonst ist das Kapital gebunden und niemand managt sie. */
  /** Intraday-Positionen aus einer frueheren Sitzung sofort schliessen.
   *
   *  Warum das noetig ist: Positionen werden nur im Scan geschlossen, und der laeuft nur
   *  bei offener App UND offener Boerse. War die App tagelang zu, lief der Zeitwert des
   *  Scheins weiter ab, ohne dass irgendetwas eingriff. Am 21.08.2026 in den Daten
   *  gefunden: Trades mit 22 und 23 Tagen Haltedauer bei 60 Tagen Restlaufzeit, Ergebnis
   *  -44 % und -41 %. Ueber alle 28 geschlossenen Trades stammten 38 % des Verlusts aus
   *  reinem Zeitwertverfall.
   *
   *  Die vorhandene Uebernacht-Regel im Scan greift erst, wenn der Scan wieder laeuft -
   *  bei einer Woche Pause also eine Woche zu spaet. Deshalb hier, beim Start, vor allem
   *  anderen und unabhaengig von der Boersenzeit.
   *
   *  Bewertet wird mit dem letzten bekannten Kurs. Der ist nicht exakt der Kurs, zu dem
   *  man haette verkaufen koennen - aber jede Stunde laenger macht ihn schlechter, nicht
   *  besser. Lieber ungenau geschlossen als genau verfallen. */
  function altlastSchliessen() {
    if (!D || !D.positions || !D.positions.length) return 0;
    var now = Date.now();
    var zu = [];
    for (var i = D.positions.length - 1; i >= 0; i--) {
      var p = D.positions[i];
      // Die Entscheidung selbst steht als reine Funktion in quant.js – dort ist sie ohne
      // laufende App prüfbar, und sie IST geprüft: Etikett, fehlendes Etikett, verbrauchte
      // Laufzeit, heute eröffnet, fehlende Felder.
      var grund = Q.altlastGrund(p, now);
      if (!grund) continue;
      var tage = Math.round((now - p.openT) / 86400000 * 10) / 10;
      var spot = spotOf(p.sym) || p.entrySpot;
      var bid = bidOf(p, spot, now);
      closeTrade(p, spot, now,
        'Altlast-Glattstellung beim Start: ' + grund + ', weil die App nicht lief. ' +
        'Der Zeitwert des Scheins läuft auch dann ab, wenn niemand hinsieht.');
      zu.push({ sym: p.sym, tage: tage, ret: p.entry ? Math.round((bid / p.entry - 1) * 100) : null });
    }
    if (zu.length) {
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'altlast-' + now, at: now, quelle: 'sicherung',
        applied: [zu.length + ' Altlast-Position(en) geschlossen'],
        txt: 'Beim Start standen ' + zu.length + ' Position(en) aus einer früheren Sitzung offen: ' +
          zu.map(function (x) { return x.sym + ' (' + x.tage + ' Tage' + (x.ret != null ? ', ' + (x.ret >= 0 ? '+' : '') + x.ret + ' %' : '') + ')'; }).join(', ') +
          '. Sie wurden sofort geschlossen. Grund: Der Scan schliesst nur bei offener App und offener Boerse - ' +
          'war die App zu, lief der Zeitwert des Scheins weiter ab, ohne dass etwas eingriff. In den Daten vom ' +
          '21.08.2026 stammten so 38 % des gesamten Verlusts aus reinem Zeitwertverfall.' });
    }
    return zu.length;
  }

  function repairOrphans() {
    if (!D || !D.trades) return 0;
    var have = {};
    (D.positions || []).forEach(function (p) { have[p.id] = 1; });
    var adopted = 0, written = 0;
    D.trades.forEach(function (t) {
      if (t.status === 'closed' || have[t.id]) return;
      if (t.legacy) return; // Altbestand vor dem Messschnitt: nie erneut adoptieren (Doppel-Gutschrift)
      if (!(t.sym && t.qty > 0 && t.entry > 0 && t.strike > 0 && t.expiry)) {
        // Daten unbrauchbar: sauber abschreiben, damit die Buchhaltung stimmt
        t.status = 'closed'; t.closeT = Date.now(); t.exit = 0;
        t.pnl = -(t.cost != null ? t.cost : t.entry * t.qty || 0);
        t.why = 'Verwaist – Datensatz unvollständig, abgeschrieben';
        written++;
        return;
      }
      if (t.peak == null) t.peak = t.entry;
      if (t.exitMode == null) t.exitMode = t.strategy === 'intraday' ? 'confirmed' : undefined;
      D.positions.push(t);
      have[t.id] = 1;
      adopted++;
    });
    if (adopted || written) {
      D.repairNote = { at: Date.now(), adopted: adopted, written: written };
    }
    return adopted + written;
  }

  /* ================= Symbol-Sperre (dauerhafte Verlustbringer) ================= */
  /** Wertet je Symbol die geschlossenen Intraday-Trades aus und sperrt klare Verlustbringer. */
  function updateSymBlocks() {
    if (!D || D.intraday.symBlock === false) return;
    var by = {};
    D.trades.forEach(function (t) {
      if (t.status !== 'closed' || t.strategy !== 'intraday' || !istMess(t)) return; // legacy: Buchungsfehler-Aera zaehlt nicht
      var b2 = (by[t.sym] = by[t.sym] || { n: 0, pnl: 0, w: 0 });
      b2.n++; b2.pnl += t.pnl; if (t.pnl > 0) b2.w++;
    });
    if (!D.symBlock) D.symBlock = {};
    Object.keys(by).forEach(function (sym) {
      var s = by[sym];
      var manuell = D.symBlock[sym] && D.symBlock[sym].manuell;
      if (manuell) return; // von Hand gesetzt/aufgehoben: nicht überschreiben
      var schlecht = s.n >= 6 && s.pnl < 0 && (s.w / s.n) <= 0.34;
      if (schlecht && !D.symBlock[sym]) {
        D.symBlock[sym] = { seit: Date.now(), n: s.n, pnl: Math.round(s.pnl * 100) / 100, quote: Math.round(s.w / s.n * 100) };
      } else if (!schlecht && D.symBlock[sym] && !D.symBlock[sym].manuell) {
        delete D.symBlock[sym]; // Erholung: Sperre fällt automatisch weg
      }
    });
  }
  function renderSymBlocks() {
    var el = document.getElementById('symBlocks');
    if (!el) return;
    var keys = Object.keys(D.symBlock || {});
    if (!keys.length) { el.innerHTML = '<span style="color:var(--muted); font-size:var(--fs-neben);">Keine gesperrten Werte.</span>'; return; }
    el.innerHTML = keys.map(function (s) {
      var b2 = D.symBlock[s];
      if (b2.frei) return '<span class="chip" style="margin-right:6px;">' + U.esc(s) + ' · manuell freigegeben</span>';
      return '<span class="chip down" style="margin-right:6px;">' + U.esc(s) + (b2.n ? ' · ' + b2.n + ' Trades, ' + U.signTxt(b2.pnl, ' $') + ', ' + b2.quote + ' % Treffer' : ' · manuell') +
        ' <a href="#" data-unblock="' + U.esc(s) + '" style="color:var(--ink-2); font-weight:700; margin-left:4px;">×</a></span>';
    }).join('');
    el.querySelectorAll('[data-unblock]').forEach(function (a2) {
      a2.addEventListener('click', function (ev) {
        ev.preventDefault();
        var s = a2.getAttribute('data-unblock');
        // Manuelle Freigabe bleibt gespeichert – sonst sperrt der nächste Scan sofort wieder
        D.symBlock[s] = { manuell: true, frei: true, seit: Date.now() };
        save(); renderSymBlocks();
      });
    });
  }

  /* ================= Warnband =================
   * Seltene, wichtige Zustaende gehoeren auf JEDEN Reiter, nicht in eine Klappe:
   * Quelle gestoert, Speichern fehlgeschlagen, Depot aus Sicherung, Kante verfallen.
   * Je Schluessel eine Zeile; null raeumt die Zeile wieder ab. */
  var WARNBAND = {};
  function warnbandSetzen(schluessel, html, gelb) {
    var el = document.getElementById('warnband');
    if (!el) return;
    if (html) WARNBAND[schluessel] = { html: html, gelb: !!gelb };
    else delete WARNBAND[schluessel];
    var keys = Object.keys(WARNBAND);
    /* 'block', NICHT '': Der Leerwert loescht nur den Inline-Stil, danach greift die
     * Regel #warnband{display:none} aus index.html - das Band blieb also IMMER
     * unsichtbar, egal welche Warnung anlag. Damit war der gesamte Warnkanal tot:
     * "Speichern fehlgeschlagen", "Depot aus Sicherung", "Kante verfallen". */
    el.style.display = keys.length ? 'block' : 'none';
    el.innerHTML = keys.map(function (k) {
      return '<div class="warnzeile' + (WARNBAND[k].gelb ? ' gelb' : '') + '">' + WARNBAND[k].html + '</div>';
    }).join('');
  }
  function edgePauseAnzeigen() {
    var c = (D && D.intraday) || {};
    /* EIN ABGESCHALTETER WAECHTER MUSS SICHTBAR BLEIBEN. Bis zum 25.08.2026 liess der
     * Hand-Entscheid das Band verschwinden - die Sicherung war aus, und nichts sagte es.
     * Der Entscheid wird weiter dauerhaft respektiert; er ist nur nicht mehr unsichtbar
     * und nicht mehr unumkehrbar. */
    if (c.edgePauseHand) {
      var seitTxt = c.edgePause && c.edgePause.seit
        ? ' Die letzte gemessene Pause stammt vom ' + new Date(c.edgePause.seit).toLocaleDateString('de-DE') +
          ' (' + c.edgePause.mittelPp + ' Pp, t=' + c.edgePause.t + ') und steht weiterhin.'
        : '';
      warnbandSetzen('edge', '<b>Edge-Wächter ist von Hand ausgeschaltet</b> – du hast einmal ' +
        '„Trotzdem weiter handeln“ gewählt. Seitdem setzt <b>keine</b> Kante mehr automatisch aus, ' +
        'auch wenn ihr gemessener Vorsprung verfällt.' + seitTxt + ' Gemessen wird weiter.' +
        '<button class="btn ghost" data-edgescharf="1" style="padding:2px 10px; font-size:var(--fs-neben); margin-left:6px;">Wächter wieder scharf stellen</button>', true);
      return;
    }
    /* Seit dem 25.08.2026 gibt es zwei Pausen - je Arm eine. Das Band nennt den Arm,
     * sonst weiss man nicht, was ausgesetzt ist und was weiterhandelt. */
    var offen = [];
    if (c.edgePause) offen.push({ name: 'RSI(2) im Seitwärtskanal', ep: c.edgePause });
    if (c.edgePauseKapi) offen.push({ name: 'Kapitulations-Dip', ep: c.edgePauseKapi });
    if (!offen.length) { warnbandSetzen('edge', null); return; }
    warnbandSetzen('edge', '<b>Edge-Wächter: ' +
      offen.map(function (o) { return o.name; }).join(' und ') + ' pausiert</b> – der gemessene Vorsprung ist in zwei Nächten ' +
      'hintereinander verfallen (' + offen.map(function (o) { return o.name + ': ' + o.ep.mittelPp + ' Pp, t=' + o.ep.t; }).join(' · ') + '). ' +
      'Neue Einstiege ' + (offen.length > 1 ? 'dieser Kanten' : 'dieser Kante') + ' sind ausgesetzt' +
      (offen.length > 1 ? '' : ', die andere handelt weiter') + '. Das Schattenbuch misst weiter; ' +
      'eine positive Nacht hebt die Pause automatisch auf. ' +
      '<button class="btn ghost" data-edgefrei="1" style="padding:2px 10px; font-size:var(--fs-neben); margin-left:6px;">Trotzdem weiter handeln</button>', true);
  }
  function stoerungAnzeigen() {
    if ((HEALTH.stoerungScans || 0) >= 2) {
      var seitTxt = HEALTH.stoerungSeit ? ' seit ' + new Date(HEALTH.stoerungSeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : '';
      warnbandSetzen('stoerung', '<b>Kursquelle gestört</b>' + seitTxt + ' – ' + HEALTH.stoerungScans +
        ' Scans ohne Antwort. Offene Positionen können nicht bewertet oder gestoppt werden; ' +
        'der Abruf-Takt ist gestreckt und normalisiert sich von selbst, sobald wieder Kurse kommen.');
    } else {
      warnbandSetzen('stoerung', null);
    }
  }

  /* ================= Trendfinder (Felix #33/#35, Umbau #58) =================
   * Seit #58 steht der TREND vorn und der Trendwechsel daneben als sein Sonderfall:
   * Ein Trend hat drei Eigenschaften - Richtung, Guete, Breite -, dieselben, die der
   * Aktien-Explorer zu einem Kanal nennt. Ein Wechsel ist der Moment, in dem der junge
   * Abschnitt gegen den Vortrend dreht. Beides wird getrennt bestimmt; die Guete loest
   * ausdruecklich NICHTS aus (als Handelsbedingung gemessen und widerlegt: -0,17 Pp,
   * t = -4,1).
   * BEOBACHTUNG, kein Handel: Der Winkel-Detektor war der einzige Teilueberlebende
   * der Trendwende-Studie, aber die 1m-Basis war zu kurz und ~44 % des Effekts war
   * Tageszeit-Drift. Der Retest kommt, wenn das naechtlich wachsende 1m-Archiv
   * 60+ Tage traegt. Bis dahin: live ansehen, nichts kaufen. */
  var wendeLaeuft = false, wendeZuletzt = 0;
  /* Die zuletzt geprueften Kerzen je Wert, damit der Chart (Wunsch #38) genau die
   * Reihe zeigt, auf der auch gerechnet wurde - kein zweiter Abruf, keine Abweichung. */
  var WENDE_BARS = {}, WENDE_ERG = {}, WENDE_F = 5;
  /** Was ist aus frueheren Drehungen DIESER Reihe geworden?
   *  Der Detektor wird ueber die Historie gefahren; jede Drehung wird bis zur
   *  GEGENDREHUNG gehalten - das ist die einzige Ausstiegsregel, die aus der Regel
   *  selbst folgt. Eine erfundene Haltedauer waere eine zweite, ungemessene Annahme.
   *
   *  Daneben die Kontrolle: dieselbe Haltedauer, dieselbe Reihe, aber an beliebigen
   *  Punkten - der Durchschnitt ueber alle. Ohne sie misst man Marktdrift und nennt
   *  sie Signal; bei der belegten Intraday-Regel waren das rund zwei Drittel.
   *
   *  Rueckgabe: { n, mittel, ktr, ueberschuss, dauerSchnitt } oder null. */
  function wendeNachlese(bars, opt) {
    try {
      if (!bars || bars.length < 260) return null;
      var S = opt.schwelle, F = opt.bestaetigung;
      var SCHRITT = Math.max(1, Math.round(bars.length / 400));   // nicht jede Kerze - das reicht und bleibt schnell
      var offen = null, faelle = [];
      for (var i = 200; i < bars.length - 1; i += SCHRITT) {
        var w = null;
        try { w = Q.trendwechsel(bars.slice(0, i + 1), { schwelle: S, bestaetigung: F }); } catch (e) { continue; }
        if (!w) continue;
        var richtung = w.aktuell && w.aktuell.winkel != null ? Math.sign(w.aktuell.winkel) : 0;
        if (offen && richtung && richtung !== offen.richtung) {
          // Gegendrehung: Position schliessen
          var ein = bars[offen.i][1], aus = bars[i][1];
          if (ein > 0 && aus > 0) {
            faelle.push({ i: offen.i, dauer: i - offen.i,
              ret: (aus / ein - 1) * 100 * offen.richtung });   // Short-Bein mit umgekehrtem Vorzeichen
          }
          offen = null;
        }
        if (!offen && w.signal && richtung) offen = { i: i, richtung: richtung };
      }
      if (faelle.length < 5) return null;
      var sum = 0, dau = 0;
      faelle.forEach(function (f) { sum += f.ret; dau += f.dauer; });
      var mittel = sum / faelle.length, dSchnitt = Math.round(dau / faelle.length);
      /* Kontrolle: dieselbe mittlere Haltedauer, ueber die ganze Reihe gemittelt.
       * Absolutbetrag waere falsch - gefragt ist, was ein beliebiger Einstieg
       * ueber dieselbe Zeit gebracht haette. */
      var ks = 0, kn = 0;
      for (var j = 200; j + dSchnitt < bars.length; j += SCHRITT) {
        var a2 = bars[j][1], b2 = bars[j + dSchnitt][1];
        if (a2 > 0 && b2 > 0) { ks += (b2 / a2 - 1) * 100; kn++; }
      }
      var ktr = kn >= 20 ? ks / kn : null;
      return { n: faelle.length, mittel: Math.round(mittel * 1000) / 1000,
               ktr: ktr == null ? null : Math.round(ktr * 1000) / 1000,
               ueberschuss: ktr == null ? null : Math.round((mittel - ktr) * 1000) / 1000,
               dauerSchnitt: dSchnitt };
    } catch (e) { return null; }
  }

  async function wendePruefen(erzwungen) {
    var el = document.getElementById('wendeTabelle'), st = document.getElementById('wendeStatus');
    if (!el || wendeLaeuft) return;
    // Beim blossen Reiterwechsel hoechstens alle 3 Minuten neu rechnen
    if (!erzwungen && Date.now() - wendeZuletzt < 3 * 60000 && el.querySelector('table')) return;
    wendeLaeuft = true;
    if (st) st.textContent = 'Prüfe …';
    try {
      var iv = (document.getElementById('wendeIv') || {}).value || '1m';
      var S = parseFloat((document.getElementById('wendeS') || {}).value || '1');
      var F = parseInt((document.getElementById('wendeF') || {}).value || '5', 10);
      var barMin = iv === '5m' ? 5 : 1;
      WENDE_F = F; WENDE_BARS = {}; WENDE_ERG = {};
      var syms = universe();   // 15 Standard-Werte + eigene Watchlist - bewusst NICHT der 99er-Pool (Abruflast)
      var fertig = 0;
      var zeilen = [];
      await pmap(syms, async function (sy) {
        var fd = await fetchIntraday(sy, iv, false);
        fertig++;
        if (st) st.textContent = 'Prüfe … (' + fertig + '/' + syms.length + ')';
        if (!fd || !fd.series || fd.series.length < 60) { zeilen.push({ sym: sy, fehler: 'keine Daten' }); return; }
        var sigBars = Q.fertigeBars(fd.series, barMin, Date.now());
        var w = Q.trendwechsel(sigBars, { schwelle: S, bestaetigung: F });
        WENDE_BARS[sy] = sigBars; WENDE_ERG[sy] = w;
        var nl = wendeNachlese(sigBars, { schwelle: S, bestaetigung: F });
        /* Der Trend selbst wird UNABHAENGIG von der Wendepunkt-Suche bestimmt (Wunsch #58).
         * Grund: Der Detektor braucht ZWEI bestaetigte Wendepunkte, sonst gibt er null
         * zurueck - und die Zeile meldete dann 'zu wenig Historie', obwohl ein
         * schnurgerader Trend lief. Wo der Detektor einen jungen Abschnitt hat, ist DAS
         * der Trend; wo nicht, steht der Kanal ueber die letzten 120 Kerzen - als
         * Fenster gekennzeichnet, damit man beides nicht verwechselt. */
        var kt = w && w.bild && w.bild.kanalJung ? { k: w.bild.kanalJung, quelle: 'wende' } : null;
        if (!kt && sigBars.length >= 40 && Q.kanalUeber) {
          var vonT = Math.max(0, sigBars.length - 1 - 120);
          var kf = Q.kanalUeber(sigBars, vonT, sigBars.length - 1);
          if (kf) kt = { k: kf, quelle: 'fenster' };
        }
        zeilen.push({ sym: sy, w: w, nl: nl, kt: kt });
      }, 4);
      /* Frische Wechsel zuoberst, danach die BESTEN Trends, erst dann die steilsten
       * (Wunsch #58: der Trend ist die Hauptsache, der Wechsel sein Sonderfall).
       * Die Reihenfolge ordnet nur die Anzeige - gehandelt wird davon nichts. */
      var gueteVon = function (z) { return z.kt ? z.kt.k.guete : -1; };
      zeilen.sort(function (a, b) {
        var sa = a.w && a.w.signal ? 1 : 0, sb = b.w && b.w.signal ? 1 : 0;
        if (sa !== sb) return sb - sa;
        var ga = gueteVon(a), gb = gueteVon(b);
        if (ga !== gb) return gb - ga;
        var wa = a.w && a.w.aktuell && a.w.aktuell.winkel != null ? Math.abs(a.w.aktuell.winkel) : -1;
        var wb = b.w && b.w.aktuell && b.w.aktuell.winkel != null ? Math.abs(b.w.aktuell.winkel) : -1;
        return wb - wa;
      });
      var pfeil = function (t) { return t === 'auf' || t === 'up' ? '↗' : (t === 'ab' || t === 'down' ? '↘' : '→'); };
      var h = '<table class="tbl"><tr><th>Wert</th>' +
        '<th title="Der laufende Abschnitt seit dem letzten bestätigten Wendepunkt: Richtung und normierter Winkel (Steigung × Länge ÷ Kanalbreite).">Trend jetzt</th>' +
        '<th title="Güte 0–100 aus denselben drei Eigenschaften, die der Aktien-Explorer zu einem Kanal nennt: Passgenauigkeit, Berührungen beider Kanten, Länge. Reine Beschreibung – als Handelsbedingung ist der Kanal gemessen und widerlegt (−0,17 Pp je Trade, t = −4,1).">Güte</th>' +
        '<th title="Breite des Kanals in Prozent des Kursniveaus – wie viel Luft der Trend zwischen seinen Kanten hat.">Breite</th>' +
        '<th>Vortrend</th><th>Drehung</th>' +
        '<th title="Die einzige Ausstiegsregel, die aus dem Detektor selbst folgt: halten, bis der Winkel zurückdreht.">Ausstieg</th>' +
        '<th title="Wie viele Drehungen dieser Art in der verfügbaren Historie überhaupt vorkommen. Für eine belastbare Bewertung bräuchte es rund 30 – dafür reicht das Archiv nicht.">Fälle in der Historie</th>' +
        '<th>Stand</th></tr>';
      zeilen.forEach(function (z) {
        if (z.fehler || (!z.w && !z.kt)) {
          h += '<tr><td><b>' + U.esc(z.sym) + '</b></td><td colspan="8" style="color:var(--muted);">' + U.esc(z.fehler || 'zu wenig Historie') + '</td></tr>';
          return;
        }
        var v = z.w ? z.w.vorher : null, a = z.w ? z.w.aktuell : null, sig = z.w ? z.w.signal : null;
        /* Die drei Eigenschaften des laufenden Trends (Wunsch #58) kommen aus GENAU dem
         * Kanal, den der Detektor selbst gerechnet hat - kein zweiter Rechenweg. */
        var kj = z.kt ? z.kt.k : null;
        var ausFenster = !!(z.kt && z.kt.quelle === 'fenster');
        // Winkel des Fenster-Kanals in derselben Einheit wie der des Detektors
        var wkF = (ausFenster && kj.breite > 0) ? Math.round(kj.steigung * kj.n / kj.breite * 100) / 100 : null;
        var dreht = v && a && a.winkel != null && Math.abs(v.winkel) >= 0.5 && Math.sign(a.winkel) !== Math.sign(v.winkel);
        var zeichenbar = !!(z.w && z.w.bild && (z.w.bild.kanalVor || z.w.bild.kanalJung));
        h += '<tr' + (zeichenbar ? ' data-wende="' + U.esc(z.sym) + '" style="cursor:pointer;' + (sig ? ' background:var(--up-soft);' : '') + '" title="Klick zeigt den Kursverlauf mit Wendepunkt und beiden Abschnitten"' : (sig ? ' style="background:var(--up-soft);"' : '')) + '><td><b>' + U.esc(z.sym) + (zeichenbar ? ' <span style="color:var(--muted); font-weight:400;">▸</span>' : '') + '</b></td>' +
          '<td>' + (a && a.winkel != null
            ? pfeil(a.trend) + ' ' + U.nf2.format(a.winkel) + ' <span style="color:var(--muted);">(seit ' + a.seitKerzen + ' Kerzen)</span>'
            : (kj
              ? pfeil(kj.trend) + (wkF != null ? ' ' + U.nf2.format(wkF) : '') +
                ' <span style="color:var(--muted);">(Fenster: letzte ' + kj.n + ' Kerzen' +
                (a ? ', ' + U.esc(a.trend) : ', kein bestätigter Wendepunkt') + ')</span>'
              : '<span style="color:var(--muted);">–</span>')) + '</td>' +
          '<td' + (kj ? ' title="Passgenauigkeit ' + kj.r2 + ', Kanten berührt ' + kj.beruehrungenOben + '× oben / ' + kj.beruehrungenUnten + '× unten, ' + kj.n + ' Kerzen lang – ' + (ausFenster ? 'gerechnet über ein festes Fenster, weil kein bestätigter Wendepunkt in Reichweite liegt' : 'gerechnet über den jungen Abschnitt seit dem Wendepunkt') + '"' : '') + '>' +
            (kj ? kj.guete + '/100' : '<span style="color:var(--muted);">–</span>') + '</td>' +
          '<td>' + (kj ? U.nf2.format(kj.breitePct) + ' %' : '<span style="color:var(--muted);">–</span>') + '</td>' +
          '<td>' + (v ? pfeil(v.trend) + ' ' + U.nf2.format(v.winkel) : '<span style="color:var(--muted);">kein Vortrend</span>') + '</td>' +
          '<td>' + (!z.w ? '<span style="color:var(--muted);">nicht bestimmbar</span>' : (dreht ? '<b>ja</b>' : 'nein')) + '</td>' +
          /* AUSSTIEG: Der Detektor hat keine eigene Ausstiegsregel - er erkennt eine
           * Drehung und sagt nie, wann man wieder raus soll. Die einzige Regel, die
           * aus ihm selbst folgt, ist die symmetrische: halten, bis der Winkel
           * zurueckdreht. Eine erfundene Haltedauer stuende hier als Zahl, die nie
           * gemessen wurde - deshalb steht stattdessen die Bedingung da. */
          '<td>' + (a && a.winkel != null
            ? '<span style="color:var(--muted);">bei Gegendrehung' +
              (z.nl && z.nl.dauerSchnitt ? ' – bisher im Schnitt nach ' + z.nl.dauerSchnitt + ' Kerzen' : '') + '</span>'
            : '<span style="color:var(--muted);">–</span>') + '</td>' +
          /* HIER STAND EINE ERTRAGSZAHL, UND SIE IST WIEDER RAUS.
           * Gemessen am 23.08.2026: Auf 4.000 Fuenf-Minuten-Kerzen findet der Detektor
           * rund SECHS Drehungen. Bei sechs Faellen kippt das Mittel das Vorzeichen,
           * sobald man nur die Abtastdichte aendert (-0,028 / +0,166 / +0,230 % bei
           * gleicher Fallzahl). Eine Zahl, die von einem Implementierungsdetail
           * abhaengt, gehoert nicht in die Oberflaeche - wer sie sieht, liest sie,
           * egal wie vorsichtig der Text daneben steht.
           * Was bleibt, ist die FALLZAHL: Sie sagt ehrlich, dass sich hier nichts
           * bewerten laesst. */
          '<td>' + (z.nl
            ? '<span style="color:var(--muted);">' + z.nl.n + ' Drehungen in der Historie – ' +
              'zu wenige für eine Bewertung</span>'
            : '<span style="color:var(--muted);">zu wenig Historie</span>') + '</td>' +
          '<td>' + (sig
            ? '<b class="' + (sig.dir === 'call' ? 'pos' : 'neg') + '">Wechsel nach ' + (sig.dir === 'call' ? 'OBEN' : 'UNTEN') + '</b>'
            : '<span style="color:var(--muted);">' + (!z.w ? 'nur Trend, kein Wechsel-Urteil'
              : (a && a.winkel != null && Math.abs(a.winkel) < S ? 'zu flach' : 'kein Wechsel')) + '</span>') + '</td></tr>';
      });
      h += '</table><div class="hinweis" style="margin-top:8px;"><b>Trendfinder:</b> Zuerst steht der laufende ' +
        'Trend mit seinen drei Eigenschaften – Richtung, Güte, Breite –, dieselben drei, die auch der ' +
        'Aktien-Explorer zu einem Kanal nennt, aus derselben Rechnung. Der Trendwechsel ist der Sonderfall ' +
        'rechts daneben: der Moment, in dem der junge Abschnitt gegen den Vortrend dreht (Wunsch #58).' +
        '<br><b>Trend ohne Wendepunkt:</b> Die Wechsel-Erkennung braucht zwei bestätigte Wendepunkte. Wo die ' +
        'fehlen, stand hier früher nur „zu wenig Historie“ – auch dann, wenn ein schnurgerader Trend lief. ' +
        'Jetzt steht dort der Kanal über die letzten 120 Kerzen, als „Fenster“ gekennzeichnet. Ein ' +
        'Wechsel-Urteil gibt es in solchen Zeilen weiterhin nicht – das wäre eine Zahl ohne Grundlage.' +
        '<br><b>Die Güte löst nichts aus – und das ist gemessen, nicht vorsichtig:</b> Der Trendkanal als ' +
        'Handelsbedingung kostete −0,17 Pp je Trade bei t = −4,1 (Abschnittskanal-Studie). Er ist als Filter ' +
        'nicht neutral, sondern schädlich. Ein Trend mit Güte 90 ist deshalb ein gut beschriebener Trend – ' +
        'kein guter Einstieg.' +
        '<br><br>Winkel = Steigung × Abschnittslänge ÷ Kanalbreite ' +
        '(wie steil relativ zum eigenen Rauschen; Vorzeichen = Richtung). „Wechsel“ = junger Abschnitt ist steiler als die ' +
        'Schwelle UND dreht gegen den Vortrend – die Studien-Bedingung. <b>Zeile anklicken</b> zeigt den Kursverlauf mit ' +
        'Wendepunkt und beiden Abschnitten (Wunsch #38). Simulation, keine Anlageberatung.' +
        '<br><br><b>Zum Ausstieg:</b> Der Detektor hat keine eigene Ausstiegsregel – er erkennt eine ' +
        'Drehung und sagt nichts darüber, wann man wieder heraus soll. Die einzige Regel, die aus ihm ' +
        'selbst folgt, ist die symmetrische: halten, bis der Winkel zurückdreht. Genau so ist die ' +
        'Spalte „Bisher“ gerechnet – jede vergangene Drehung dieser Reihe bis zur Gegendrehung.' +
        '<br><b>Warum hier keine Ertragszahl steht:</b> Es war eine geplant – und sie ist beim ' +
        'Nachrechnen durchgefallen. Auf 4.000 Fünf-Minuten-Kerzen findet der Detektor rund <b>sechs</b> ' +
        'Drehungen. Bei sechs Fällen entscheidet ein einziger Trade das Mittel, und das Vorzeichen ' +
        'kippt, sobald man nur die Abtastdichte ändert (−0,028 / +0,166 / +0,230 % bei gleicher ' +
        'Fallzahl). Für eine belastbare Bewertung bräuchte es rund 30 Fälle je Wert, also etwa ' +
        '20.000 Kerzen – das Archiv hat gut 5.000.' +
        '<br>Das ist selbst ein Ergebnis: <b>Dieser Reiter kann seine eigenen Signale nicht ' +
        'bewerten.</b> Er zeigt die Marktstruktur, und dafür ist er gut. Ob eine Drehung etwas ' +
        'einbringt, ist damit nicht zu beantworten – und eine Zahl hinzuschreiben, die es zu ' +
        'beantworten scheint, wäre schlechter als keine.' +
        '<br><b>Was aus der großen Messung bekannt ist:</b> Der Winkel-Detektor wurde auf 55 ' +
        'zurückgehaltenen Handelstagen nachgemessen; die ursprünglich gefundenen +0,25 Pp sind ' +
        'widerlegt (0,074 Pp, t = 1,22). Das ist die belastbare Aussage zu diesem Detektor.</div>';
      el.innerHTML = h;
      wendeChartsVerkabeln(el);
      wendeZuletzt = Date.now();
      if (st) st.textContent = 'Stand ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr · ' + zeilen.filter(function (z) { return z.w && z.w.signal; }).length + ' Wechsel';
    } catch (eW) {
      if (st) st.textContent = 'Prüfung fehlgeschlagen: ' + (eW && eW.message ? eW.message : eW);
    } finally {
      wendeLaeuft = false;
    }
  }

  /* Wunsch #38: die Wende im Chart nachvollziehen koennen.
   * Ein Klick auf eine Zeile klappt den Kursverlauf darunter auf und zeigt GENAU das,
   * woraus der Detektor sein Urteil bildet: den Vor-Abschnitt, den bestaetigten
   * Wendepunkt, den jungen Abschnitt und beide Kanaele. Reine Anzeige - es wird
   * weiterhin nichts gehandelt. */
  function wendeChartsVerkabeln(el) {
    el.querySelectorAll('[data-wende]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var sy = tr.getAttribute('data-wende');
        var warOffen = tr.nextElementSibling && tr.nextElementSibling.className === 'wende-inline';
        el.querySelectorAll('tr.wende-inline').forEach(function (x) { x.parentNode.removeChild(x); });
        if (warOffen) return;
        tr.insertAdjacentHTML('afterend',
          '<tr class="wende-inline"><td colspan="9" style="background:var(--panel); padding:8px 12px; cursor:default;">' +
          '<div style="font-size:var(--fs-neben); font-weight:600; margin-bottom:4px;">' + U.esc(sy) + ' – Kursverlauf mit Wendepunkt</div>' +
          '<svg class="wende-chart" style="width:100%; height:220px; display:block;"></svg>' +
          '<div class="wende-legende" style="font-size:var(--fs-neben); color:var(--ink-2); margin-top:6px; line-height:1.5;"></div>' +
          '</td></tr>');
        var zeile = tr.nextElementSibling;
        zeichneWendeChart(zeile.querySelector('.wende-chart'), zeile.querySelector('.wende-legende'),
          WENDE_BARS[sy], WENDE_ERG[sy], WENDE_F);
      });
    });
  }

  /** Zeichnet den Ausschnitt um die Wende: Kurs, beide Kanaele, Wendepunkt und
   *  die Kerze, ab der er bestaetigt war. Alle Geometrie stammt aus w.bild,
   *  also aus derselben Rechnung wie die Tabelle - der Chart kann gar nicht
   *  etwas anderes behaupten als das Urteil daneben. */
  function zeichneWendeChart(svg, legende, bars, w, F) {
    if (!svg) return;
    var b = w && w.bild;
    if (!bars || !bars.length || !b) {
      svg.innerHTML = '<text x="12" y="26" fill="var(--muted)" font-size="12">Keine Kerzen mehr im Speicher – bitte erneut prüfen.</text>';
      return;
    }
    var kV = b.kanalVor, kJ = b.kanalJung;
    // Fenster: etwas Vorlauf vor dem aelteren Wendepunkt, hoechstens 400 Kerzen
    var von = Math.max(0, Math.min(b.wpVor, bars.length - 1) - 12);
    von = Math.max(von, bars.length - 400);
    var bis = bars.length - 1;
    if (bis - von < 5) {
      svg.innerHTML = '<text x="12" y="26" fill="var(--muted)" font-size="12">Zu wenig Kerzen zum Zeichnen.</text>';
      return;
    }

    var W = svg.clientWidth || 860, H = svg.clientHeight || 220;
    var padL = 8, padR = 54, padT = 12, padB = 20;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var plotW = W - padL - padR, plotH = H - padT - padB;
    function X(i) { return padL + (i - von) / Math.max(1, bis - von) * plotW; }

    // Wertebereich: Kurse plus beide Kanalkanten im sichtbaren Fenster
    var lo = Infinity, hi = -Infinity, i;
    for (i = von; i <= bis; i++) {
      var c = bars[i][1];
      if (c == null) continue;
      if (c < lo) lo = c;
      if (c > hi) hi = c;
    }
    function kanalWert(k, idx, welche) {
      var mitte = k.achse + k.steigung * (idx - k.von);
      if (welche === 'm') return mitte;
      return mitte + (welche === 'o' ? (k.oben - k.mitteJetzt) : (k.unten - k.mitteJetzt));
    }
    [kV, kJ].forEach(function (k) {
      if (!k) return;
      [k.von, k.bis].forEach(function (idx) {
        ['o', 'u'].forEach(function (wl) {
          var v2 = kanalWert(k, idx, wl);
          if (isFinite(v2)) { if (v2 < lo) lo = v2; if (v2 > hi) hi = v2; }
        });
      });
    });
    if (!isFinite(lo) || !isFinite(hi)) {
      svg.innerHTML = '<text x="12" y="26" fill="var(--muted)" font-size="12">Keine gültigen Kurse.</text>';
      return;
    }
    var luft = (hi - lo) * 0.10 || 1;
    lo -= luft; hi += luft;
    function Y(v3) { return H - padB - (v3 - lo) / (hi - lo) * plotH; }

    var html = '';
    niceTicks(lo, hi, 4).forEach(function (tv) {
      html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(tv).toFixed(1) + '" y2="' + Y(tv).toFixed(1) + '" stroke="var(--grid)" stroke-width="1"></line>' +
        '<text x="' + (padL + plotW + 4) + '" y="' + (Y(tv) + 3).toFixed(1) + '" fill="var(--muted)" font-size="9.5">' + fmtTick(tv, hi - lo) + '</text>';
    });
    for (var xi = 0; xi <= 3; xi++) {
      var ix = Math.round(von + (bis - von) * xi / 3);
      html += '<text x="' + X(ix).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + (xi === 0 ? 'start' : xi === 3 ? 'end' : 'middle') +
        '" fill="var(--muted)" font-size="9.5">' + fmtTimeTick(bars[ix][0], bars[bis][0] - bars[von][0]) + '</text>';
    }

    // Beide Kanaele als Band + Mittellinie, jeweils nur ueber ihren eigenen Abschnitt
    function band(k, farbe, gestrichelt) {
      if (!k) return '';
      var a = Math.max(von, k.von), e = Math.min(bis, k.bis);
      if (e - a < 1) return '';
      var oben = [], unten = [], mitte = [], j;
      for (j = a; j <= e; j++) {
        oben.push((oben.length ? 'L' : 'M') + X(j).toFixed(1) + ' ' + Y(kanalWert(k, j, 'o')).toFixed(1));
        mitte.push((mitte.length ? 'L' : 'M') + X(j).toFixed(1) + ' ' + Y(kanalWert(k, j, 'm')).toFixed(1));
      }
      for (j = e; j >= a; j--) unten.push(X(j).toFixed(1) + ' ' + Y(kanalWert(k, j, 'u')).toFixed(1));
      return '<path d="' + oben.join(' ') + ' L' + unten.join(' L') + ' Z" fill="' + farbe + '" opacity="0.12"></path>' +
        '<path d="' + mitte.join(' ') + '" fill="none" stroke="' + farbe + '" stroke-width="1.8"' + (gestrichelt ? ' stroke-dasharray="5 4"' : '') + '></path>';
    }
    var farbeJung = w.aktuell && w.aktuell.winkel != null
      ? (w.aktuell.winkel > 0 ? 'var(--up)' : 'var(--down)') : 'var(--series3)';
    html += band(kV, 'var(--series2)', true);
    html += band(kJ, farbeJung, false);

    // Kurs
    var pfad = [];
    for (i = von; i <= bis; i++) {
      if (bars[i][1] == null) continue;
      pfad.push((pfad.length ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(bars[i][1]).toFixed(1));
    }
    html += '<path d="' + pfad.join(' ') + '" fill="none" stroke="var(--series)" stroke-width="1.8" stroke-linejoin="round"></path>';

    // Wendepunkte und die Kerze, ab der der juengere bestaetigt war
    function senkrechte(idx, farbe, text, hoch) {
      if (idx < von || idx > bis) return '';
      var x = X(idx);
      return '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + padT + '" y2="' + (H - padB) +
        '" stroke="' + farbe + '" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.8"></line>' +
        '<text x="' + (x + 3).toFixed(1) + '" y="' + (hoch ? padT + 9 : padT + 21) + '" fill="' + farbe + '" font-size="9.5" font-weight="600">' + text + '</text>';
    }
    html += senkrechte(b.wpVor, 'var(--muted)', 'Wendepunkt davor', true);
    html += senkrechte(b.wpLetzt, 'var(--ink-2)', 'Wendepunkt', true);
    html += senkrechte(b.wpLetzt + (F || 5), 'var(--muted)', 'ab hier bestätigt', false);
    [b.wpVor, b.wpLetzt].forEach(function (idx) {
      if (idx < von || idx > bis || bars[idx][1] == null) return;
      html += '<circle cx="' + X(idx).toFixed(1) + '" cy="' + Y(bars[idx][1]).toFixed(1) + '" r="4" fill="var(--surface)" stroke="var(--ink-2)" stroke-width="2"></circle>';
    });
    svg.innerHTML = html;

    if (legende) {
      var v = w.vorher, a2 = w.aktuell;
      legende.innerHTML =
        '<span style="color:var(--series2);">▬</span> Vor-Abschnitt (gestrichelt): ' +
        (v ? 'Winkel ' + U.nf2.format(v.winkel) : 'kein Vortrend') + ' · ' +
        '<span style="color:' + farbeJung + ';">▬</span> junger Abschnitt: ' +
        (a2 && a2.winkel != null ? 'Winkel ' + U.nf2.format(a2.winkel) + ' über ' + a2.seitKerzen + ' Kerzen' : U.esc(a2 ? a2.trend : '–')) + '<br>' +
        'Der Wendepunkt gilt erst ' + (F || 5) + ' Kerzen später als bestätigt – vorher weiß der Detektor nichts von ihm ' +
        '(walk-forward, kein Blick in die Zukunft). ' +
        (w.signal ? '<b class="' + (w.signal.dir === 'call' ? 'pos' : 'neg') + '">Das ist ein Wechsel nach ' + (w.signal.dir === 'call' ? 'OBEN' : 'UNTEN') + '.</b> ' : '') +
        'Beobachtung, kein Handel – Simulation, keine Anlageberatung.';
    }
  }

  /* ================= Live-Signal-Monitor ================= */
  function renderSigMonitor() {
    var el = document.getElementById('sigMonitor');
    if (!el) return;
    var syms = Object.keys(SIG);
    if (!syms.length) {
      el.innerHTML = '<div class="empty"><span class="ico"></span>Noch kein Scan gelaufen – der Monitor füllt sich, sobald die Intraday-Strategie aktiv ist und die US-Börse geöffnet hat.</div>';
      return;
    }
    syms.sort(function (a2, b2) { return (SIG[b2].score || 0) - (SIG[a2].score || 0); });
    var html = '<table class="tbl"><tr><th>Wert</th><th>Kurs</th><th>Wellen-Score</th><th>z</th><th>Kanal</th><th>Status</th><th>Geprüft</th></tr>';
    syms.slice(0, 30).forEach(function (s) {
      var g = SIG[s];
      html += '<tr data-siglog="' + U.esc(s) + '" style="cursor:pointer;" title="Klick zeigt den Entscheidungsverlauf dieses Werts"><td><b>' + U.esc(s) + '</b></td>' +
        '<td>' + (g.spot != null ? U.nf2.format(g.spot) : '–') + '</td>' +
        '<td>' + (g.score != null ? g.score + '/100' : '–') + '</td>' +
        '<td>' + (g.z != null ? g.z : '–') + '</td>' +
        '<td>' + (g.chanPos != null ? Math.round(g.chanPos * 100) + ' % · Güte ' + (g.chanQ != null ? g.chanQ : '–') : '–') + '</td>' +
        '<td class="' + (g.ok ? 'pos' : '') + '">' + U.esc(g.grund || (g.ok ? 'gehandelt' : 'kein Signal')) + '</td>' +
        '<td style="color:var(--muted);">' + (g.t ? new Date(g.t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–') + '</td></tr>';
    });
    html += '</table><div style="color:var(--muted); font-size:var(--fs-neben); margin-top:6px;">Zeigt für jeden gescannten Wert, was die Strategie zuletzt gesehen hat – und warum sie nicht gehandelt hat. Zeile anklicken: Entscheidungsverlauf des Werts (Tester-Wunsch #30).</div>';
    el.innerHTML = html;
    /* Entscheidungsverlauf aufklappen - direkt unter der angeklickten Zeile,
       gleiche Bedienung wie im Schein-Finder. */
    el.querySelectorAll('[data-siglog]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var s = tr.getAttribute('data-siglog');
        var warOffen = tr.nextElementSibling && tr.nextElementSibling.className === 'sig-inline';
        el.querySelectorAll('tr.sig-inline').forEach(function (x) { x.parentNode.removeChild(x); });
        if (warOffen) return;
        var l = (SIG_LOG[s] || []).slice().reverse();
        var inhalt = l.length
          ? l.map(function (e) {
              return '<div style="padding:1px 0;">' + new Date(e.t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) +
                ' · ' + U.esc(e.grund) + (e.n > 1 ? ' <span style="color:var(--muted);">(' + e.n + '× in Folge)</span>' : '') + '</div>';
            }).join('')
          : '<span style="color:var(--muted);">Noch kein Verlauf in dieser Sitzung.</span>';
        tr.insertAdjacentHTML('afterend',
          '<tr class="sig-inline"><td colspan="7" style="background:var(--panel); padding:8px 12px; font-size:var(--fs-neben); line-height:1.5; cursor:default;">' +
          '<b>' + U.esc(s) + ' – Entscheidungsverlauf (diese Sitzung, jüngste zuerst)</b><br>' + inhalt + '</td></tr>');
      });
    });
  }

  /* ================= Auto-Tuning-Verlauf & Wirkungs-Ranking ================= */
  /** Bewertet jede automatische Änderung: Ø P/L je Intraday-Trade davor vs. danach. */
  function tuneRanking() {
    var log = (D.tuneLog || []).slice(); // neu → alt
    if (!log.length) return [];
    var closed = D.trades.filter(function (t) { return t.status === 'closed' && t.strategy === 'intraday' && istMess(t); });
    function windowStats(from, to) {
      var sel = closed.filter(function (t) { return t.closeT >= from && t.closeT < to; });
      if (!sel.length) return { n: 0, avg: null, pnl: 0, win: null };
      var sum = sel.reduce(function (a2, t) { return a2 + t.pnl; }, 0);
      var w = sel.filter(function (t) { return t.pnl > 0; }).length;
      return { n: sel.length, avg: Math.round(sum / sel.length * 100) / 100, pnl: Math.round(sum * 100) / 100, win: Math.round(w / sel.length * 100) };
    }
    var out = [];
    for (var i = 0; i < log.length; i++) {
      var e = log[i];
      var nachBis = i === 0 ? Date.now() : log[i - 1].at;      // bis zur nächsten Änderung
      var vorAb = (i + 1 < log.length) ? log[i + 1].at : 0;    // seit der vorherigen Änderung
      var vor = windowStats(vorAb, e.at), nach = windowStats(e.at, nachBis);
      var delta = (vor.avg != null && nach.avg != null) ? Math.round((nach.avg - vor.avg) * 100) / 100 : null;
      var urteil, cls;
      if (nach.n < 5) { urteil = 'zu wenig Daten'; cls = ''; }
      else if (delta == null) { urteil = nach.avg > 0 ? 'positiv (kein Vergleich)' : 'negativ (kein Vergleich)'; cls = nach.avg > 0 ? 'pos' : 'neg'; }
      else if (delta > 0.5) { urteil = 'wirkt'; cls = 'pos'; }
      else if (delta < -0.5) { urteil = 'schadet'; cls = 'neg'; }
      else { urteil = 'neutral'; cls = ''; }
      out.push({ e: e, vor: vor, nach: nach, delta: delta, urteil: urteil, cls: cls, laufend: i === 0, idx: i });
    }
    // Rang nach Wirkung (nur bewertbare)
    var rankable = out.filter(function (r) { return r.nach.n >= 5; }).slice()
      .sort(function (a2, b2) { return ((b2.delta != null ? b2.delta : b2.nach.avg) - (a2.delta != null ? a2.delta : a2.nach.avg)); });
    rankable.forEach(function (r, i2) { r.rang = i2 + 1; });
    return out;
  }

  /* Einzelne Felder statt eines Rundumschlags: Eintraege, die ihre Aenderungen Feld fuer
   * Feld mitgeschrieben haben (bisher nur "Belegte Voreinstellungen uebernehmen"), zeigen
   * je Feld ein eigenes Zurueck. Genau das stand seit jeher im Knopftext - eingeloest war
   * es nie. Eintraege ohne felder[] verhalten sich unveraendert wie vorher. */
  function feldZeilen(e, idx) {
    if (!e.felder || !e.felder.length) return '';
    var h = '<div style="margin-top:4px; display:flex; flex-direction:column; gap:2px;">';
    e.felder.forEach(function (f, j) {
      // Ein schon zurueckgestelltes Feld behaelt seine Zeile - sonst sieht es aus, als
      // haette es die Aenderung nie gegeben - aber ohne Knopf, der nichts mehr taete.
      h += '<div style="font-size:var(--fs-klein); display:flex; align-items:center; gap:6px; color:' +
        (f.zurueck ? 'var(--muted);" ' : 'var(--ink-2);" ') + '>' +
        (f.zurueck
          ? '<span style="width:22px; text-align:center;" title="zurückgestellt">✓</span>' + U.esc(f.txt || f.k) + ' <span>(zurückgestellt)</span>'
          : '<button class="btn ghost" style="padding:0 6px; font-size:var(--fs-klein); line-height:16px;" ' +
            'data-feld="' + idx + ':' + j + '" title="Nur dieses Feld zurückstellen" ' +
            'aria-label="' + U.esc(f.txt || f.k) + ' zurückstellen">↩</button>' +
            U.esc(f.txt || f.k) + ' <span style="color:var(--muted);">(vorher: ' + U.esc(feldWert(f.alt)) + ')</span>') +
        '</div>';
    });
    return h + '</div>';
  }
  function feldWert(v) {
    if (v === true) return 'an';
    if (v === false) return 'aus';
    if (v === null || v === undefined) return 'nicht gesetzt';
    return String(v);
  }
  /** Setzt genau die uebergebenen Felder auf ihren alten Wert zurueck - nie mehr.
   *  Schreibt die Ruecknahme selbst wieder ins Protokoll, damit die Kette lueckenlos bleibt. */
  function felderZurueck(e, liste, wasTxt) {
    if (!liste.length) return;
    liste.forEach(function (f) {
      if (f.wo === 'intraday') { if (f.alt === null) delete D.intraday[f.k]; else D.intraday[f.k] = f.alt; }
      else { if (f.alt === null) delete D[f.k]; else D[f.k] = f.alt; }
      f.zurueck = true;
    });
    if (!D.tuneLog) D.tuneLog = [];
    D.tuneLog.unshift({ id: 'undo-' + e.id + '-' + Date.now(), at: Date.now(), quelle: 'hand',
      applied: ['↩ ' + wasTxt], txt: 'Von Hand zurückgestellt (' + U.dt(e.at) + ')',
      konfigVorher: null, konfigNachher: JSON.parse(JSON.stringify(D.intraday)) });
    save();
    if (window.__updateParamVis) window.__updateParamVis();
    if (window.__syncSetupUI) window.__syncSetupUI();
    renderTuneLog();
    render();
  }

  function renderTuneLog() {
    var el = document.getElementById('tuneLog');
    if (!el) return;
    var rows = tuneRanking();
    if (!rows.length) {
      el.innerHTML = '<div class="empty"><span class="ico"></span>Noch keine automatischen Anpassungen – sie erscheinen hier, sobald die Automatik eine robuste Verbesserung findet.</div>';
      return;
    }
    var html = '<table class="tbl"><tr><th>Rang</th><th>Wann</th><th>Änderung</th><th>Ø P/L je Trade davor → danach</th><th>Trades danach</th><th>Wirkung</th><th></th></tr>';
    rows.forEach(function (r) {
      var e = r.e;
      html += '<tr' + (r.laufend ? ' style="font-weight:600;"' : '') + '>' +
        '<td>' + (r.rang ? '#' + r.rang : '–') + '</td>' +
        '<td>' + U.dt(e.at) + '<br><span style="color:var(--muted); font-weight:400; font-size:var(--fs-klein);">' + ({ pilot: 'Autopilot', lokal: 'Selbst-Optimierung (alt)', manuell: 'manuell übernommen', hand: 'von Hand', regime: 'Regime (alt)', farm: 'Farm (alt)', sicherung: 'Sicherung' }[e.quelle] || 'Cloud-Analyse') + (r.laufend ? ' · läuft aktuell' : '') + '</span></td>' +
        '<td>' + (e.applied && e.applied.length ? U.esc(e.applied.join(' · ')) : '<span style="color:var(--muted);">keine Feldänderung</span>') +
          feldZeilen(e, r.idx) +
          (e.txt ? '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:2px;">' + U.esc(e.txt) + '</div>' : '') + '</td>' +
        '<td>' + (r.vor.avg != null ? U.signTxt(r.vor.avg, ' $') : '–') + ' → ' + (r.nach.avg != null ? '<b class="' + U.signCls(r.nach.avg) + '">' + U.signTxt(r.nach.avg, ' $') + '</b>' : '–') +
          (r.delta != null ? ' <span class="' + U.signCls(r.delta) + '">(' + U.signTxt(r.delta, ' $') + ')</span>' : '') + '</td>' +
        '<td>' + r.nach.n + (r.nach.win != null ? ' · ' + r.nach.win + ' % Treffer' : '') + '</td>' +
        '<td>' + r.urteil + '</td>' +
        '<td>' + (e.konfigVorher || (e.felder && e.felder.some(function (f) { return !f.zurueck; }))
          ? '<button class="btn ghost" style="padding:2px 8px; font-size:var(--fs-klein);" data-undo="' + r.idx + '">Rückgängig</button>' : '') + '</td></tr>';
    });
    html += '</table><div style="color:var(--muted); font-size:var(--fs-neben); margin-top:8px;">Bewertet wird der durchschnittliche Gewinn je Intraday-Trade im Zeitraum <b>nach</b> der Änderung gegen den Zeitraum davor. Unter 5 Trades ist keine Aussage möglich (). Der Rang sortiert nach Wirkung – so siehst du, welche Anpassungen wirklich etwas gebracht haben.</div>';
    el.innerHTML = html;
    el.querySelectorAll('[data-feld]').forEach(function (b3) {
      b3.addEventListener('click', function () {
        var t = b3.getAttribute('data-feld').split(':');
        var r = rows[parseInt(t[0], 10)];
        var f = r && r.e.felder ? r.e.felder[parseInt(t[1], 10)] : null;
        if (!f) return;
        felderZurueck(r.e, [f], f.txt || f.k);
      });
    });
    el.querySelectorAll('[data-undo]').forEach(function (b2) {
      b2.addEventListener('click', function () {
        var r = rows[parseInt(b2.getAttribute('data-undo'), 10)];
        if (!r) return;
        // Eintrag mit Einzelfeldern: alle auf einmal, aber ueber denselben Weg
        if (r.e.felder && r.e.felder.length) {
          var offen = r.e.felder.filter(function (f) { return !f.zurueck; });
          felderZurueck(r.e, offen, 'Alle ' + offen.length + ' Felder zurückgestellt');
          return;
        }
        if (!r.e.konfigVorher) return;
        var keys = ['mode', 'interval', 'period', 'confirmBps', 'lineType', 'window', 'scalpSL', 'sizing', 'channel', 'mtf', 'avoidHours'];
        keys.forEach(function (k) { if (r.e.konfigVorher[k] !== undefined) D.intraday[k] = r.e.konfigVorher[k]; });
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'undo-' + r.e.id, at: Date.now(), applied: ['↩ Rücknahme von ' + U.dt(r.e.at)], txt: 'Manuell zurückgenommen', konfigVorher: null, konfigNachher: JSON.parse(JSON.stringify(D.intraday)) });
        save();
        if (window.__updateParamVis) window.__updateParamVis();
        renderTuneLog();
        render();
      });
    });
  }

  /* ================= Claude-Bericht anzeigen ================= */
  async function showReport() {
    var st = document.getElementById('reportStatus');
    st.textContent = 'Lade Bericht …';
    var r = window.api.readReport ? await window.api.readReport() : { ok: false };
    st.textContent = '';
    if (!r.ok) {
      st.textContent = 'Noch kein Bericht vorhanden – die automatische Analyse legt ihn im Daten-Ordner an.';
      return;
    }
    document.getElementById('aiTitle').textContent = 'Analyse-Bericht (Stand: ' + U.dt(r.mtime) + ')';
    document.getElementById('aiBody').innerHTML = U.md(r.body) + '<div class="warn">Simulation – keine Anlageberatung.</div>';
    window.openModal('aiModalBg');
  }

  /* ================= Analyse-Export (Downloads\Markt-Dashboard-Daten) ================= */
  var lastAnalysisExport = 0;
  function csvString() {
    var head = ['ID', 'Strategie', 'Symbol', 'Typ', 'Eröffnet', 'Geschlossen', 'Stück', 'Basispreis', 'Fällig', 'Einstieg', 'Exit', 'P/L ($)', 'Haltedauer (Min)', 'Exit-Grund', 'Nachgebildet', 'Auslöser', 'Vor Messschnitt'];
    function f(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
    function num(v) { return v == null ? '' : String(Math.round(v * 10000) / 10000).replace('.', ','); }
    var rows = D.trades.slice().reverse().map(function (t) {
      return [t.id, t.strategy === 'intraday' ? 'Intraday' : 'Stunden', t.sym, t.dir.toUpperCase(),
        new Date(t.openT).toLocaleString('de-DE'), t.closeT ? new Date(t.closeT).toLocaleString('de-DE') : '',
        t.qty, num(t.strike), new Date(t.expiry).toLocaleDateString('de-DE'),
        num(t.entry), num(t.exit), num(t.pnl), t.closeT ? Math.round((t.closeT - t.openT) / 60000) : '',
        t.why || (t.status === 'open' ? 'offen' : ''), t.replicated ? 'ja' : '', t.reason || '', t.legacy ? 'ja' : ''
      ].map(f).join(';');
    });
    return '﻿' + head.map(f).join(';') + '\n' + rows.join('\n');
  }
  async function exportAnalysis(force) {
    if (!D || !window.api.exportAnalysis) return null;
    var nowE = Date.now();
    if (!force && nowE - lastAnalysisExport < 10 * 60000) return null;
    lastAnalysisExport = nowE;
    // Bewusst OHNE Einstellungen/Zugangsdaten – nur Handels- und Auswertungsdaten.
    var payload = {
      json: {
        exportiert: new Date().toISOString(),
        hinweis: 'Simulation, keine Anlageberatung. Automatischer Export des Markt-Dashboards für externe Auswertung.',
        depotwert: Math.round(equityNow() * 100) / 100,
        cash: Math.round(D.cash * 100) / 100,
        startkapital: START_CAPITAL,
        offenePositionen: D.positions,
        trades: D.trades.slice(0, 500),
        trefferquoten: D.stats,
        gewichte: D.weights,
        intradayKonfiguration: D.intraday,
        risiko: D.risk,
        geduldBilanz: D.patience || {},
        screener: D.screen || null,
        verlustSerie: D.lossStreak || null,
        equityVerlauf: (D.equityHist || []).slice(-2000),
        sentimentVerlauf: SENT,
        analyseZentrale: D.central || null,
        symbolSperren: D.symBlock || {},
        schattenbuch: { bilanz: D.schattenStat || {}, offen: (D.schatten || []).filter(function (x) { return x.status === 'open'; }).length,
          letzte: (D.schatten || []).slice(0, 60) },
        strategieFarmAlt: D.farmAlt || null,
        autopilot: D.autoOpt || null,
        archivAbdeckung: EXPORT_ABDECKUNG || null,
        marktRegime: D.regime || null,
        automatik: D.autoOpt || null,
        messschnitt: D.messStart ? { seit: new Date(D.messStart).toISOString(), grund: D.messGrund || '' } : null,
        experimentJournal: D.tuneLog || [],
        letzteAnpassung: D.lastTune || null,
        gesundheit: (function () {
          var h = { appLaeuftSeit: new Date(HEALTH.startedAt).toISOString(), scansGesamt: HEALTH.scans, scanFehler: HEALTH.scanErrors,
            letzterScan: HEALTH.lastScanT ? new Date(HEALTH.lastScanT).toISOString() : null,
            kursAbrufeOk: HEALTH.fetchOk, kursAbrufeFehler: HEALTH.fetchFail,
            kiPruefungenOk: HEALTH.kiOk, kiPruefungenFehler: HEALTH.kiFail,
            capitalOk: HEALTH.capOk, capitalFehler: HEALTH.capFail,
            signaleVerworfenKursdatenVeraltet: HEALTH.staleBars || 0, killSwitchAusloesungen: HEALTH.killSwitch || 0,
            hintergrundRechnerAusfaelle: HEALTH.workerFail || 0,
            analyseExportFehler: HEALTH.exportFail || 0,
            capitalOhneBestaetigung: HEALTH.capOhneDealId || 0,
            edgeWaechterAusfaelle: HEALTH.edgeFail || 0,
            scanSperreHaenger: HEALTH.scanHaenger || 0,
            archivSchreibFehler: (window.Archiv && window.Archiv.flushFehler
              ? window.Archiv.flushFehler().n : null),
            spannenTageAusKerzen: HEALTH.spannenTage || 0,
            spannenVerdrahtungFehlt: HEALTH.spannenVerdrahtung || 0,
            spannenKerzenOhneBriefkurs: HEALTH.spannenOhneFeld || 0,
            killSwitchHeute: (D.killSwitch && D.killSwitch.day === new Date().toISOString().slice(0, 10)) ? D.killSwitch : null,
            handelspauseRegime: (D.handelsPause && D.handelsPause.bis > Date.now()) ? D.handelsPause : null,
            letzterFehler: HEALTH.lastError || null,
            marktOffen: !!(window.Dash && window.Dash.marketOpen()),
            scanIntervallSollMs: modeParams().scanMs };
          // Scan-Lücken der letzten Stunde (Hinweis auf Aussetzer)
          var lastH = HEALTH.scanTimes.filter(function (t) { return Date.now() - t < 3600000; });
          var gaps = [];
          for (var i = 1; i < lastH.length; i++) { var g = lastH[i] - lastH[i - 1]; if (g > h.scanIntervallSollMs * 3) gaps.push(Math.round(g / 60000)); }
          h.scanLueckenMin = gaps;
          return h;
        })(),
        marktkontext: (function () {
          if (!window.Dash) return null;
          var out = {};
          ['^VIX', '^GSPC', '^IXIC'].forEach(function (s) {
            var q = window.Dash.quote(s);
            if (q) out[s] = { kurs: Math.round(q.price * 100) / 100, tagesPct: q.pct == null ? null : Math.round(q.pct * 100) / 100 };
          });
          return out;
        })()
      },
      // Kursdaten nur schreiben, wenn wirklich welche da sind – sonst überschreibt ein
      // Export direkt nach dem Start die guten Daten des Vortags mit einer leeren Datei.
      kurse: (Object.keys(LASTBARS).length || Object.keys(TAGES_CACHE).length) ? {
        exportiert: new Date().toISOString(),
        intervall: D.intraday.interval || '5m',
        hinweis: 'bars = Serien des letzten Intraday-Scans [t,close,volumen,high,low]; tages = Tagesschluss-Historie [t,close]. Mit engine.js (identische Rechenlogik der App) direkt backtestbar.',
        bars: LASTBARS,
        tages: TAGES_CACHE
      } : null,
      csv: csvString(),
      bericht: (D.central && D.central.berichtMd) || null
    };
    /* Der Analyse-Export ist die Leitung, ueber die SAEMTLICHE HEALTH-Zaehler die App
     * verlassen (gesundheit:, weiter oben). Bis zum 25.08.2026 wurde sein Ergebnis
     * verworfen: schlug er fehl, meldete niemand etwas - und mit ihm schwiegen still
     * auch alle Zaehler, die einen anderen stillen Ausfall haetten melden sollen.
     * Ein Waechter, der selbst lautlos ausfallen kann, ist kein Waechter.
     *
     * Ein Wurf waere falsch: exportAnalysis haengt an save(), das im laufenden Handel
     * staendig laeuft. Die 10-Minuten-Sperre bleibt auch im Fehlerfall bestehen -
     * sonst versuchte es jeder save() erneut und schriebe bei voller Platte im
     * Sekundentakt vier Dateien. */
    var rEx = null;
    try { rEx = await window.api.exportAnalysis(payload); }
    catch (e) { rEx = { ok: false, msg: String((e && e.message) || e) }; }
    if (!rEx || rEx.ok === false) {
      HEALTH.exportFail = (HEALTH.exportFail || 0) + 1;
      if (HEALTH.exportFail === 1) {
        melde('Analyse-Export fehlgeschlagen',
          'analyse-daten.json, messbericht.md, trades.csv und kursdaten.json werden nicht ' +
          'mehr geschrieben (' + ((rEx && rEx.msg) || 'unbekannt') + '). Damit fehlen auch ' +
          'saemtliche Gesundheitszahlen der App - haeufigste Ursachen: Platte voll oder ein ' +
          'Programm blockiert den Daten-Ordner.');
      }
      return rEx;
    }
    HEALTH.exportFail = 0;
    return rEx;
  }

  /* ================= Historie (lokaler Cache) ================= */
  var TAGES_CACHE = {};
  async function getHistory(sym, range) {
    range = range || '2y';
    var key = 'hist_' + sym;
    var cached = await window.api.storeGet(key);
    var now = Date.now();
    if (cached && cached.range === range && now - cached.fetchedAt < 12 * 3600000 && cached.series.length > 50) {
      TAGES_CACHE[sym] = cached.series.slice(-520);
      return cached.series;
    }
    try {
      /* ROH: Diese Reihe fuettert Stop-Abstaende und Positionsgroessen im Handel -
       * gerechnet wird auf dem Kurs, der auch gehandelt wird. Das Verwerfen von 0,
       * negativen Werten und NaN (frueher kursOk hier) macht jetzt der Lader. */
      var kd = await window.Kurse.hole(sym, { range: range, interval: '1d', bereinigt: false });
      if (!kd) return cached ? cached.series : null;
      var series = window.Kurse.reihe(kd.bars);
      if (series.length > 50) TAGES_CACHE[sym] = series.slice(-520);
      if (series.length > 50) {
        await window.api.storeSet(key, { fetchedAt: now, range: range, series: series });
        return series;
      }
      return cached ? cached.series : null;
    } catch (e) { return cached ? cached.series : null; }
  }

  /* ================= News je Symbol ================= */
  async function getSymbolNews(sym) {
    var url = 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=' + encodeURIComponent(sym) + '&region=US&lang=en-US';
    var res = await window.api.fetchText(url);
    if (!res.ok) return [];
    try {
      var doc = new DOMParser().parseFromString(res.body, 'text/xml');
      var nodes = doc.querySelectorAll('item');
      var items = [];
      for (var i = 0; i < nodes.length && i < 12; i++) {
        var n = nodes[i];
        items.push({
          title: (n.querySelector('title') || {}).textContent || '',
          url: (n.querySelector('link') || {}).textContent || '',
          t: Date.parse((n.querySelector('pubDate') || {}).textContent || '') || 0
        });
      }
      archiviereNews(sym, items);
      return items;
    } catch (e) { return []; }
  }

  /** Schlagzeilen mit Zeitstempel wegschreiben, damit das News-Sentiment irgendwann
   *  ueberhaupt PRUEFBAR wird. Heute ist es das nicht: die Quelle liefert nur die
   *  aktuellen Meldungen, und im Backtest faellt das News-Gewicht deshalb heraus
   *  (quant.js: "News nicht rueckwirkend verfuegbar"). Damit sind 35 % jeder
   *  Live-Entscheidung unbelegt - weder widerlegt noch belegt.
   *
   *  Gespeichert wird nur, was die Auswertung braucht: Titel und Zeitpunkt. Keine
   *  URLs, keine Texte. Ein Schluessel je Symbol, gedeckelt auf 400 Eintraege -
   *  das sind bei vier Abrufen am Tag rund drei Jahre. */
  async function archiviereNews(sym, items) {
    if (!items || !items.length) return;
    try {
      var key = 'newsarchiv_' + sym;
      var alt = await window.api.storeGet(key);
      var liste = (alt && alt.items) || [];
      // Doppelte am Titel erkennen: derselbe Artikel taucht bei jedem Abruf wieder auf,
      // der Zeitstempel schwankt dabei manchmal um Minuten.
      var bekannt = {};
      liste.forEach(function (x) { bekannt[x[1]] = 1; });
      var neu = 0;
      items.forEach(function (it) {
        var titel = (it.title || '').trim();
        if (!titel || bekannt[titel]) return;
        bekannt[titel] = 1;
        liste.push([it.t || Date.now(), titel]);
        neu++;
      });
      if (!neu) return;
      liste.sort(function (a, b) { return a[0] - b[0]; });
      if (liste.length > 400) liste = liste.slice(-400);
      await window.api.storeSet(key, { stand: Date.now(), items: liste });
    } catch (e) { /* Archiv ist Beiwerk - ein Fehler hier darf den Abruf nicht kippen */ }
  }

  /* ================= Spot-Kurs ================= */
  function spotOf(sym, hist) {
    var q = window.Dash && window.Dash.quote(sym);
    if (q && q.price != null) return q.price;
    // Der Kurs-Ticker kennt nur die 21 Standardwerte. Positionen auf Watchlist- oder
    // Screener-Werten (die der Intraday-Scanner sehr wohl handelt) fielen vorher direkt
    // auf den Einstiegskurs zurück: P/L stand dauerhaft bei 0 %, und equityNow() – und
    // damit Risiko-Limits und Depotkurve – rechneten mit einem eingefrorenen Wert.
    // Der Scanner legt für genau diese Symbole frische Bars in LASTBARS ab.
    var lb = LASTBARS[sym];
    if (lb && lb.length) return lb[lb.length - 1][1];
    return hist && hist.length ? hist[hist.length - 1][1] : null;
  }

  /* ================= Handels-Universum (Watchlist) ================= */
  function universe() {
    var base = window.Dash.STOCKS.map(function (s) { return s.y; });
    (D.watchlist || []).forEach(function (w) { if (base.indexOf(w.y) === -1) base.push(w.y); });
    return base;
  }
  /* Erweitertes 60m-Universum (Messung 21.08.2026, 3 Monate Stundenkerzen,
   * Zaehlfenster 30 Tage): Auf den 15 Basis-Werten feuert rsi2seit nur 0,57-mal
   * je Tag handelbar (Long) - an den meisten Tagen passiert schlicht nichts, und
   * genau das sah aus wie ein Defekt ("warum wird nichts gehandelt?"). Auf diesen
   * 84 liquiden S&P-Werten kommen 4,3 handelbare Signale je Tag hinzu.
   * Bei Stundenkerzen muss nicht jede Runde jedes Symbol abgefragt werden:
   * je Scan-Runde rotieren 12 Extras durch - jedes ist alle ~10 Minuten dran,
   * die Signalkerze schliesst ohnehin nur stuendlich. Klumpen-Deckel, Tageslimit,
   * Cooldown und Risikostufe gelten unveraendert. */
  /* Halbleiter-Stichtagsliste (22.08.2026) fuer den Sektor-Klumpen-Deckel. Eine
   * SETZUNG, keine Messung - aber der Deckel schreibt Schatten und ist damit
   * ueberpruefbar. Kriterium: Chips, Chip-Ausruestung und Speichertechnik. */
  var SEKTOR_CHIPS = {};
  ('NVDA AMD INTC MU ARM TSM ASML AVGO QCOM TXN LRCX KLAC AMAT ADI NXPI MRVL ON MCHP SMCI MPWR TER SWKS QRVO STX WDC').split(' ')
    .forEach(function (s9) { SEKTOR_CHIPS[s9] = 1; });
  var EXTRA_60M = ('ORCL CRM ADBE CSCO TXN IBM NOW INTU JPM BAC WFC GS MS C SCHW BLK AXP UNH PFE ABBV MRK LLY TMO ABT ' +
    'XOM CVX COP SLB EOG OXY WMT COST MCD NKE SBUX TGT LOW HD DIS CMCSA VZ TMUS CAT DE BA HON GE LMT RTX UNP UPS FDX ' +
    'PANW CRWD ZS NET DDOG SNOW MDB TEAM WDAY ADSK CDNS SNPS KLAC LRCX AMAT EBAY BKNG ABNB UBER DASH PYPL SHOP SNAP ' +
    'NFLX ROKU F GM MAR HLT RCL DAL UAL').split(' ');
  /* Waehlbare Beobachtungs-Pools (Tester-Wunsch #29). 'auto' = der gemessene
   * 84er-Standard oben. Die Gruppen sind statische Stichtagslisten (21.08.2026);
   * Indexumbauten aendern sie nicht von selbst - bewusst so, eine Liste, die sich
   * still selbst umbaut, waere eine unsichtbare Konfigurationsaenderung.
   * DAX-BESONDERHEIT: Der Scanner laeuft nur waehrend der US-Sitzung; XETRA
   * schliesst 17:30. DAX-Werte sind also nur im Ueberlapp 15:30-17:30 handelbar,
   * danach blockt die Veraltet-Pruefung ihre Kurse von selbst. */
  var POOLS_60M = {
    /* Volatilstes Drittel des 99er-Universums (Stichtag 21.08.2026, Vola ueber die
     * letzten 120 Handelstage annualisiert, Spanne 46-96 % gegen 38 % Median).
     * Beleg: Die Bedingungsstudie mass fuer rsi2seit im volatilen Drittel
     * +0,235 Pp je 8 h gegen +0,147 im Gesamtuniversum - mehr Bewegung heisst
     * mehr Ruecklauf zur Mitte, wo der Kanal die Erlaubnis gibt. */
    volatil: ('MU ARM TEAM INTC ZS AMD LRCX MDB DDOG NET KLAC AMAT SNOW NOW QCOM WDAY SNAP SHOP IBM ORCL INTU ASML CRWD UAL TXN TSLA AVGO PANW ADBE CRM DASH TSM RCL').split(' '),
    sp100:('BRK-B LLY V UNH MA JNJ PG COST ORCL MRK ABBV CVX CRM BAC KO PEP WMT ADBE CSCO ACN MCD LIN NFLX ABT DHR VZ TXN WFC PM NEE DIS IBM CAT RTX GE SPGI CMCSA AMGN HON UNP ISRG BKNG LOW T GS AXP INTU ELV BLK SBUX PLD MS BMY SYK MDT DE ADP LMT TJX GILD MMC ADI CB VRTX AMT C CVS SCHW MO ZTS SO CI TMUS DUK BSX PGR EOG NKE COP CL FDX BDX EMR NOW USB TGT PYPL JPM XOM UPS BA').split(' '),
    ndx100: ('GOOG COST NFLX ADBE PEP CSCO TMUS AMGN HON INTU ISRG BKNG ADP GILD VRTX ADI REGN LRCX PANW MU SNPS KLAC CDNS MELI ABNB CRWD MAR MRVL ORLY CSX PYPL MNST FTNT DASH ADSK ROP WDAY PCAR NXPI CPRT PDD AEP ROST ODFL KDP FAST EXC GEHC IDXX CTAS VRSK EA CCEP XEL TTWO DXCM ON FANG CSGP MDB TEAM ZS WBD DDOG SIRI ARM CEG DLTR KHC LULU AZN BIIB PAYX AMAT CMCSA TXN QCOM INTC').split(' '),
    dax: ('SAP.DE SIE.DE ALV.DE DTE.DE AIR.DE MUV2.DE BAS.DE BAYN.DE BMW.DE MBG.DE VOW3.DE DBK.DE DB1.DE ADS.DE IFX.DE HEN3.DE EOAN.DE RWE.DE DHL.DE BEI.DE CON.DE 1COV.DE FRE.DE HEI.DE MRK.DE MTX.DE P911.DE QIA.DE RHM.DE SHL.DE SY1.DE VNA.DE ZAL.DE HNR1.DE CBK.DE ENR.DE BNR.DE DTG.DE SRT3.DE PAH3.DE').split(' ')
  };
  var extra60mZeiger = 0;
  function extra60mFenster() {
    var quelle = POOLS_60M[D.intraday.pool] || EXTRA_60M;
    var aus = [];
    for (var i = 0; i < 12; i++) aus.push(quelle[(extra60mZeiger + i) % quelle.length]);
    extra60mZeiger = (extra60mZeiger + 12) % quelle.length;
    return aus;
  }

  /** Scan-Universum: Basis + Watchlist + heutige Screener-Treffer */
  function scanUniverse() {
    var base = universe();
    var today = new Date().toISOString().slice(0, 10);
    if (D.screen && D.screen.day === today && D.intraday.screener) {
      (D.screen.picks || []).forEach(function (p) { if (base.indexOf(p.sym) === -1) base.push(p.sym); });
    }
    // Nur fuer die belegten 60m-Modi - andere Modi behalten ihr gemessenes Umfeld
    if (D.intraday.interval === '60m' && (D.intraday.mode === 'rsi2seit' || D.intraday.mode === 'kapitulation')) {
      extra60mFenster().forEach(function (s) { if (base.indexOf(s) === -1) base.push(s); });
    }
    return base;
  }

  /* ================= Positions-Bewertung ================= */
  /** Verkaufskurs einer Position – mit dem Spread/Slippage-Aufschlag, der beim Kauf galt */
  function bidOf(pos, spot, now) {
    /* Basiswert-Position: linear, ohne Zeitwert. Der Put ist ein linearer Leerverkauf
     * (Wert = 2·Einstieg − Kurs) - faellt der Kurs 1 %, steigt der Wert 1 %. */
    if (pos.basis) {
      var vB = pos.dir === 'call' ? spot : Math.max(0.001, 2 * (pos.entrySpot || spot) - spot);
      return Math.max(0.001, vB * (1 - (pos.spx || 0.0005)));
    }
    /* Hier sass der groesste Modellfehler: pos.iv war die Vola vom OEFFNEN und wurde
     * bis zum Schliessen unveraendert weiterbenutzt. Vega - der groesste reale
     * Risikofaktor eines kurzlaufenden Scheins - kam damit in der Simulation
     * ueberhaupt nicht vor. Jetzt wird die Vola zu JEDEM Bewertungszeitpunkt neu
     * bestimmt: Smile nach aktuellem Kursabstand, Ereignis-Struktur nach dem
     * Abstand zum Ergebnistermin. */
    var ivJetzt = ivDerPosition(pos, spot, now);
    var v = Q.warrantValue(pos.dir, { strike: pos.strike, expiry: pos.expiry, iv: ivJetzt, ratio: pos.ratio || Q.RATIO }, spot, now);
    return Math.max(0.001, v * (1 - (pos.spx || 0.02)));
  }
  function posValue(pos, spot, now) {
    return bidOf(pos, spot, now) * pos.qty;
  }
  function equityNow() {
    var eq = D.cash, now = Date.now();
    D.positions.forEach(function (p) {
      var spot = spotOf(p.sym) || p.entrySpot;
      eq += posValue(p, spot, now);
    });
    return eq;
  }

  /* ================= Trade öffnen / schließen ================= */
  function openTrade(sym, dir, spot, vol, scores, reasonBits, now) {
    var bvH = (Q.PROFILES[D.intraday.profile] || {}).ratio || Q.RATIO;
    var w = Q.makeWarrant(dir, spot, vol, now, bvH);
    var wWert = Q.warrantValue(dir, w, spot, now);
    if (wWert <= 0.001) return null;
    var spx = Q.effSpread(w.iv, undefined, wWert, bvH) + Q.slipOf(w.iv, undefined, wWert);
    // Derselbe Risikostufen-Waechter wie im Intraday-Handel - die Stunden-Strategie
    // kauft ebenfalls Scheine, und die Grenze soll depotweit gelten, nicht je Pfad.
    var rsH = risikoStufeOk(dir, w, spot, now);
    if (!rsH.ok) { patienceAdd('Risikostufe (Stunden): ' + rsH.grund, sym); return null; }
    var ask = wWert * (1 + spx);
    var qty = Math.floor((equityNow() * BUDGET) / ask);
    if (qty < 1 || D.cash < qty * ask) return null;
    D.cash -= qty * ask;
    var trade = {
      id: D.nextId++, sym: sym, dir: dir, openT: now, strategy: 'hourly',
      entrySpot: spot, entry: ask, qty: qty, spx: Math.round(spx * 10000) / 10000,
      strike: w.strike, expiry: w.expiry, iv: Math.round(w.iv * 1000) / 1000, ratio: w.ratio,
      sl: SL, tp: TP,
      sources: (function () {
        var s0 = { news: scores.news, tech: scores.tech, elliott: scores.elliott };
        return s0;
      })(),
      reason: reasonBits.reason,
      scenario: reasonBits.scenario, elliottLabel: reasonBits.elliottLabel,
      status: 'open'
    };
    D.positions.push(trade);
    D.trades.unshift(trade);
    if (D.trades.length > 1000) D.trades = D.trades.filter(function (tt, i2) { return i2 < 1000 || tt.status !== 'closed'; }); // Store schlank halten, Offenes nie verwerfen
    spanneStempeln(trade, 'open');
    notifyTrade(trade, 'open');
    return trade;
  }

  /** Position sofort schließen (manuelle Notbremse) – inkl. Capital.com-Demo-Spiegelung. */
  async function closeNow(pos) {
    var spot = spotOf(pos.sym) || pos.entrySpot;
    // Capital-Demo-Spiegelung übernimmt closeTrade – ein zweiter Aufruf hier schlug fehl
    // und hängte irreführend „Schließen fehlgeschlagen“ an die Position.
    closeTrade(pos, spot, Date.now(), 'Manuell geschlossen');
    await save();
    render();
  }

  function closeTrade(pos, spot, now, why) {
    var bid = bidOf(pos, spot, now);
    var proceeds = bid * pos.qty;
    D.cash += proceeds;
    pos.status = 'closed';
    pos.closeT = now;
    pos.exit = bid;
    pos.exitSpot = spot;
    var fee = pos.orderFee || 0;
    pos.pnl = (bid * pos.qty - fee) - (pos.cost !== undefined ? pos.cost : pos.entry * pos.qty);
    D.cash -= fee; // Verkaufsgebühr (proceeds wurden oben brutto gutgeschrieben)
    pos.why = why;
    // Nach einem Neustart sind Position und Protokoll-Eintrag getrennte Objekte (JSON-Kopie).
    // Ohne Abgleich bliebe der Protokoll-Eintrag „offen“ – repairOrphans würde ihn später
    // erneut adoptieren und die Erlöse ein zweites Mal gutschreiben (der alte Buchungsfehler).
    for (var ti2 = 0; ti2 < D.trades.length; ti2++) {
      if (D.trades[ti2] !== pos && D.trades[ti2].id === pos.id) { D.trades[ti2] = pos; break; }
    }
    var win = pos.pnl > 0;
    // Verlustserien-Zähler (Tilt-Schutz, nur Intraday)
    // Nur echte Trades seit dem Messschnitt zählen – am 18.08. haben Zombie-Abwicklungen
    // von Altlasten die Serie auf 5 getrieben und den Tag gesperrt, obwohl erst 3 echte
    // Trades gelaufen waren.
    if (pos.strategy === 'intraday' && istMess(pos)) {
      var dToday = new Date().toISOString().slice(0, 10);
      if (!D.lossStreak || D.lossStreak.day !== dToday) D.lossStreak = { day: dToday, n: 0 };
      D.lossStreak.n = win ? 0 : D.lossStreak.n + 1;
    }
    var SRC2STAT = { news: 'news', tech: 'tech', elliott: 'elliott', intraday: 'maIntraday', ki: 'ki' };
    Object.keys(pos.sources || {}).forEach(function (src) {
      var stat = SRC2STAT[src];
      if (!stat || !D.stats[stat]) return;
      var sc = pos.sources[src];
      if (sc == null || Math.abs(sc) < 0.15) return;
      var agreed = (sc > 0) === (pos.dir === 'call');
      if (agreed === win) D.stats[stat].r++; else D.stats[stat].w++;
    });
    var idx = D.positions.indexOf(pos);
    if (idx >= 0) D.positions.splice(idx, 1);
    spanneStempeln(pos, 'close');
    notifyTrade(pos, 'close');
    // Gespiegelte Demo-Position beim Broker ebenfalls schließen
    if (pos.capDealId && window.CapAPI && window.CapAPI.enabled()) {
      (function (p2, spotAus) {
        window.CapAPI.closePosition(p2.capDealId).then(function (r) {
          p2.why = (p2.why || '') + ' · Demo-Position ' + (r.ok ? 'geschlossen' : 'Schließen fehlgeschlagen (' + r.msg + ') – bitte bei Capital.com prüfen');
          if (r.ok && r.fill != null && spotAus > 0) {
            p2.capFillClose = r.fill;
            p2.capSlipClose = (p2.dir === 'call' ? (spotAus / r.fill - 1) : (r.fill / spotAus - 1));
            kostenMessungNeu(p2);
          }
          save();
        });
      })(pos, spotOf(pos.sym) || pos.entrySpot);
    }
  }

  /* ================= Echte Handelskosten (Capital.com-Demo) =================
   * Alle Studien dieses Projekts rechnen mit der ANNAHME 0,10 % je Runde. Die
   * Demo-Anbindung ist die einzige Stelle mit echten Ausfuehrungen - bisher warf
   * sie den Fuellkurs weg (Inventur 22.08.2026). Jetzt wird je Trade gemessen,
   * was Ein- und Ausstieg WIRKLICH gekostet haben, und gegen die Annahme gestellt.
   * Reine Messung: die Studien bleiben unveraendert, bis genug Runden vorliegen. */
  function kostenMessungNeu(p) {
    if (!D) return;
    if (p.capSlipOpen == null || p.capSlipClose == null) return;   // erst vollstaendige Runden zaehlen
    if (!D.kostenMessung) D.kostenMessung = { runden: [], seit: Date.now() };
    D.kostenMessung.runden.unshift({
      at: Date.now(), sym: p.sym, dir: p.dir, basis: !!p.basis,
      slipOpen: Math.round(p.capSlipOpen * 1e6) / 1e6,
      slipClose: Math.round(p.capSlipClose * 1e6) / 1e6,
      runde: Math.round((p.capSlipOpen + p.capSlipClose) * 1e6) / 1e6
    });
    if (D.kostenMessung.runden.length > 300) D.kostenMessung.runden = D.kostenMessung.runden.slice(0, 300);
    save();
  }
  /** Warum die Spiegelung aufs Demo-Konto scheiterte - dauerhaft, nicht nur im
   *  Arbeitsspeicher. HEALTH.capFail zaehlt mit, ist aber beim naechsten Start weg,
   *  und der Grund wurde bisher weggeworfen. Ohne gespiegelte Positionen gibt es
   *  keine echten Ausfuehrungen, ohne die keine Messung der echten Handelskosten -
   *  und die entscheidet ueber fast jede Studie. Ein Fehlschlag, den niemand sieht,
   *  wird nicht behoben. */
  function capFehlerNeu(sym, r) {
    if (!D) return;
    if (!D.capFehler) D.capFehler = [];
    D.capFehler.unshift({
      at: Date.now(), sym: sym,
      msg: String((r && (r.msg || r.error)) || 'ohne Angabe').slice(0, 200)
    });
    if (D.capFehler.length > 50) D.capFehler = D.capFehler.slice(0, 50);
  }

  /** Die Spanne eines Wertes JETZT - Median der juengsten Proben aus den letzten 45
   *  Minuten. Ein einzelner Abruf kann eine hektische Sekunde erwischen; der Median
   *  ueber mehrere Proben ist die ehrlichere Zahl. Gibt null, wenn nichts vorliegt -
   *  dann wird auch nichts behauptet. */
  function spanneJetzt(sym) {
    var sp = D && D.spannen;
    if (!sp || !sp.proben || !sp.proben.length) return null;
    var grenze = Date.now() - 45 * 60000;
    var w = [];
    for (var i = 0; i < sp.proben.length; i++) {
      var p = sp.proben[i];
      if (p.at < grenze) break;              // Puffer ist absteigend sortiert
      if (p.sym === sym) w.push(p.spreadPct);
    }
    if (!w.length) return null;
    w.sort(function (a, b) { return a - b; });
    return w[Math.floor(w.length / 2)];
  }

  /** Die notierte Spanne an einen Trade heften - beim Oeffnen und beim Schliessen.
   *
   *  WARUM NICHT ueber die Demo-Spiegelung: kostenMessungNeu misst den echten
   *  Schlupf, feuert aber nur bei gespiegelten Positionen. Am 25.08.2026 hatte keine
   *  einzige offene Position eine capDealId, die Messung stand auf 0 Runden. Diese
   *  Aufzeichnung haengt an nichts ausser der laufenden Spannen-Probe und faellt
   *  deshalb immer an. Sie ist die halbe Rechnung, nicht die ganze - der Schlupf
   *  zwischen Anzeige und Ausfuehrung bleibt ungemessen, solange nicht gespiegelt
   *  wird. Das gehoert bei jeder Auswertung dazugesagt. */
  function spanneStempeln(tr, phase) {
    if (!tr || !tr.sym) return;
    var s = spanneJetzt(tr.sym);
    if (s == null) return;
    var pct = Math.round(s * 1e6) / 1e6;
    if (phase === 'open') tr.spanneAuf = pct;
    else {
      tr.spanneZu = pct;
      if (tr.spanneAuf != null) tr.spanneRunde = Math.round((tr.spanneAuf + pct) * 1e6) / 1e6;
    }
  }

  /** Bilanz der gemessenen Geld-Brief-Spannen. Erst je Wert den Median (eine
   *  hektische Minute soll ein Symbol nicht praegen), dann ueber die Werte - so
   *  zaehlt jeder Wert gleich, nicht der am haeufigsten abgefragte. */
  function spannenBilanz() {
    var sp = D && D.spannen;
    if (!sp || !sp.proben || sp.proben.length < 10) return null;
    var jeSym = {};
    sp.proben.forEach(function (p) { (jeSym[p.sym] = jeSym[p.sym] || []).push(p.spreadPct); });
    var med = function (a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; };
    var symMed = Object.keys(jeSym).map(function (s) { return med(jeSym[s]); });
    if (symMed.length < 3) return null;
    var alle = symMed.slice().sort(function (a, b) { return a - b; });
    return {
      proben: sp.proben.length, werte: symMed.length,
      medianPct: med(symMed) * 100,
      engstesPct: alle[0] * 100,
      weitestesPct: alle[alle.length - 1] * 100,
      annahmePct: 0.10, seit: sp.seit
    };
  }
  if (typeof window !== 'undefined') window.__spannenBilanz = spannenBilanz;

  /** Tagesmediane der Geld-Brief-Spanne aus Archiv-Kerzen in D.spannen.tage falten.
   *
   *  Woher: capital.js/pricesRange haengt die Spanne je Kerze an Element [5]. Der
   *  Backfill holt diese Kerzen ohnehin - die Spanne kostet keinen Abruf extra, sie
   *  wurde bis zum 25.08.2026 nur weggeworfen.
   *
   *  WARUM GETRENNT GEFUEHRT: Die Live-Proben (spannenProbe, alle 8 Minuten) sind
   *  Quote-Schnappschuesse, diese hier sind Kerzenschluss-Bid/Ask. Beide von
   *  Capital.com, beide auf denselben Epics - aber NICHT dieselbe Messung. Deshalb
   *  traegt ein aus Kerzen gewonnener Tag die Kennung q:"kerze", und er ueberschreibt
   *  NIE einen aus Live-Proben gewonnenen. Beides in einen Topf zu werfen waere
   *  "Zwei Quellen in einer Reihe" ein zweites Mal - diesmal in der Zahl, an der die
   *  Kostenhuerde jeder Studie haengt.
   *
   *  Erwartet SITZUNGSGEFILTERTE Kerzen. Capital liefert an Feiertagen und nach dem
   *  Halbtagsschluss weiter Bars; deren Spanne ist weit und misst nichts, was ein
   *  Handelssignal je zahlen wuerde. */
  function spannenAusKerzen(sym, bars) {
    if (!D || !sym || !bars || !bars.length) return 0;
    /* EIN FEHLER, DER KEINEN FEHLER ERZEUGT, war hier die eigentliche Gefahr.
     * Faellt die Verdrahtung weg - etwa weil archiv.js nicht mehr im Paket liegt -,
     * sammelte diese Funktion lautlos nichts: kein Wurf, kein roter Test, nur eine
     * Messreihe, die leer bleibt und erst auffaellt, wenn jemand sie vermisst.
     * Genau so ist hier schon einmal ein ganzes Modul aus dem Installationspaket
     * gefallen und erst beim Anwender aufgefallen.
     *
     * Ein Wurf waere trotzdem falsch: er wuerde den naechtlichen Backfill abbrechen,
     * der ausser der Spanne auch das Kursarchiv fuellt. Also zaehlen und EINMAL
     * melden - dasselbe Muster wie HEALTH.saveFail. */
    if (!window.Archiv || typeof window.Archiv.spannenJeTag !== 'function') {
      HEALTH.spannenVerdrahtung = (HEALTH.spannenVerdrahtung || 0) + 1;
      if (HEALTH.spannenVerdrahtung === 1) {
        melde('Spannen-Erfassung ausgefallen',
          'archiv.js/spannenJeTag ist nicht erreichbar. Die Geld-Brief-Spanne wird nicht mehr ' +
          'mitgeschrieben - die Kostenannahme von 0,10 % bleibt damit unbelegt. Das Kursarchiv ' +
          'selbst fuellt sich weiter.');
      }
      return 0;
    }
    var jeTag = window.Archiv.spannenJeTag(bars);
    var tage = Object.keys(jeTag);
    /* Kerzen kamen an, aber keine trug eine Spanne. Das ist NICHT dasselbe wie "keine
     * Kerzen": dann liefert die Quelle ihr ask-Feld nicht mehr, und jede weitere Runde
     * waere vergebens, ohne dass es irgendwo auffiele.
     *
     * Erst ab der fuenften Runde IN FOLGE gemeldet: ein einzelner Wert ohne Briefkurs
     * ist ein Einzelfall, kein Befund. Jeder Erfolg setzt den Zaehler zurueck - gemeldet
     * wird nur, was anhaelt. */
    if (!tage.length) {
      HEALTH.spannenOhneFeld = (HEALTH.spannenOhneFeld || 0) + 1;
      if (HEALTH.spannenOhneFeld === 5) {
        melde('Kerzen ohne Geld-Brief-Spanne',
          'Fuenf Abrufe in Folge lieferten Kerzen, aber keine Briefkurse (zuletzt ' + sym +
          ', ' + bars.length + ' Kerzen). Die Spannen-Historie waechst dadurch nicht weiter.');
      }
      return 0;
    }
    HEALTH.spannenOhneFeld = 0;
    if (!D.spannen) D.spannen = { proben: [], seit: Date.now() };
    if (!D.spannen.tage) D.spannen.tage = {};
    var neu = 0;
    for (var i = 0; i < tage.length; i++) {
      var tag = D.spannen.tage[tage[i]] = D.spannen.tage[tage[i]] || {};
      var da = tag[sym];
      if (da && da.q !== 'kerze') continue;          // die Live-Messung hat Vorrang
      tag[sym] = { n: jeTag[tage[i]].n, med: jeTag[tage[i]].med, q: 'kerze' };
      neu++;
    }
    HEALTH.spannenTage = (HEALTH.spannenTage || 0) + neu;
    return neu;
  }

  /** Was die Kerzen-Historie ueber die Spanne sagt - getrennt von der Live-Messung.
   *  Erst je Wert den Median ueber alle Tage, dann die Verteilung ueber die Werte:
   *  ein Wert mit vielen Tagen soll die Aussage nicht dominieren.
   *
   *  "streuung" ist die Zahl, wegen der das hier steht: das Verhaeltnis des weitesten
   *  zum engsten Wert. Es stand bisher als geschaetzte 1,35 in den Studien. */
  function spannenHistorie() {
    var sp = D && D.spannen;
    if (!sp || !sp.tage) return null;
    var jeSym = {}, tage = 0;
    Object.keys(sp.tage).forEach(function (d) {
      var tag = sp.tage[d], drin = false;
      Object.keys(tag).forEach(function (sy) {
        var e = tag[sy];
        if (!e || e.q !== 'kerze' || !isFinite(e.med)) return;
        (jeSym[sy] = jeSym[sy] || []).push(e.med); drin = true;
      });
      if (drin) tage++;
    });
    var syms = Object.keys(jeSym);
    if (syms.length < 3 || tage < 2) return null;
    function med(a) { var x = a.slice().sort(function (p, q) { return p - q; }); return x[Math.floor(x.length / 2)]; }
    var symMed = syms.map(function (sy) { return med(jeSym[sy]); }).sort(function (a, b) { return a - b; });
    return {
      tage: tage, werte: syms.length,
      medianPct: med(symMed) * 100,
      engstesPct: symMed[0] * 100,
      weitestesPct: symMed[symMed.length - 1] * 100,
      streuung: symMed[0] > 0 ? symMed[symMed.length - 1] / symMed[0] : null
    };
  }
  if (typeof window !== 'undefined') window.__spannenHistorie = spannenHistorie;

  /** EINE Messrunde: kleinste Position oeffnen, sofort schliessen, beide
   *  Ausfuehrungskurse gegen die Mitte halten. Das misst, was ein Umlauf WIRKLICH
   *  kostet - Spanne plus Schlupf - ohne auf ein Signal zu warten.
   *
   *  Warum es das gibt: Die Messung aus echten Trades stand am 25.08.2026 auf 0
   *  Runden und waere dort geblieben. Die Stunden-Strategie spiegelt nicht, und der
   *  Intraday-Arm ist seit dem 23.08. vom Edge-Waechter pausiert. Der Schutz
   *  verhindert genau die Messung, die ueber ihn entscheiden wuerde. Die Kostenfrage
   *  hat mit der Strategie aber gar nichts zu tun - also wird sie getrennt gemessen.
   *
   *  Setzt ECHTE Orders auf dem Demo-Konto ab. Wird nur von Hand ausgeloest. */
  /** Handelt der Wert rund um die Uhr? Capital fuehrt Krypto als BTCUSD/ETHUSD,
   *  die App schreibt intern BTC-USD. Beide Schreibweisen zaehlen.
   *
   *  DIESE FUNKTION GAB ES ZWEIMAL - hier und noch einmal weiter unten neben der
   *  KRYPTO-Liste, als /-USD$/. Zwei Funktionsdeklarationen desselben Namens im
   *  selben Gueltigkeitsbereich sind kein Fehler zur Laufzeit: die SPAETERE gewinnt,
   *  und zwar fuer alle Aufrufstellen, auch die weit darueber. Damit galt ueberall
   *  die enge Fassung /-USD$/ - und die trifft BTCUSD ohne Bindestrich NICHT. Genau
   *  das, was der Kommentar hier zusagt, war seitdem nicht mehr wahr: In
   *  kostenRundeMessen waere ein Capital-Kuerzel als Aktie durchgegangen und haette
   *  die Boersen-Sperre bekommen, die fuer Krypto falsch ist.
   *
   *  Jetzt eine Fassung, die beides kennt. Fuer die internen Kuerzel (immer mit
   *  Bindestrich) aendert sich nichts - der erste Zweig deckt sie ab, wie die
   *  bisher gewinnende Fassung auch. */
  function istKrypto(sym) {
    var s = String(sym || '');
    return /-USD$/i.test(s) || /^(BTC|ETH|XRP|LTC|SOL|ADA|DOGE|BNB)USD$/i.test(s);
  }

  /** Jeder Versuch einer Messrunde - auch der, der an einer Sperre endet.
   *  Ohne das steht nach einem Klick unter Umstaenden NICHTS in den Daten, und der
   *  Grund lebt nur in einer Statuszeile, die beim naechsten Neuzeichnen weg ist.
   *  Genau daran war am 25.08.2026 nicht nachvollziehbar, warum ein Klick nichts
   *  bewirkt hat. */
  function kostenVersuchNeu(sym, ok, grund) {
    if (!D) return;
    if (!D.kostenVersuche) D.kostenVersuche = [];
    D.kostenVersuche.unshift({ at: Date.now(), sym: sym || null, ok: !!ok,
      grund: String(grund || '').slice(0, 200) });
    if (D.kostenVersuche.length > 30) D.kostenVersuche = D.kostenVersuche.slice(0, 30);
    save();
  }

  async function kostenRundeMessen(sym) {
    if (!(window.CapAPI && window.CapAPI.enabled() && window.CapAPI.quote)) {
      var g1 = 'Capital.com-Demo ist nicht verbunden.';
      kostenVersuchNeu(sym, false, g1);
      return { ok: false, grund: g1 };
    }
    /* Die Boersen-Sperre gilt fuer Aktien. Krypto handelt rund um die Uhr - dort
     * waere sie schlicht falsch und haette das Messgeschirr nachts gesperrt. */
    var krypto = istKrypto(sym);
    if (!krypto && !(window.Dash && window.Dash.marketOpen && window.Dash.marketOpen())) {
      var g2 = 'Die Boerse ist zu - eine Aktien-Runde jetzt misst nichts Brauchbares. ' +
        'Krypto (BTCUSD, ETHUSD) geht rund um die Uhr.';
      kostenVersuchNeu(sym, false, g2);
      return { ok: false, grund: g2 };
    }
    /* Die notierte Spanne VOR der Order: nur so laesst sich hinterher trennen, was
     * Spanne war und was Schlupf. Ohne sie waere die Runde nur eine Zahl. */
    var vor = null;
    try { vor = await window.CapAPI.quote(sym); } catch (eQ) { vor = null; }
    if (!vor || !(vor.mid > 0)) {
      /* Der Grund steckt in capital.js (lastPriceError) - ohne ihn sucht man im Nebel. */
      var g3 = 'Kein Kurs fuer ' + sym + '.' +
        (window.CapAPI.lastPriceError ? ' ' + (window.CapAPI.lastPriceError() || '') : '');
      kostenVersuchNeu(sym, false, g3);
      return { ok: false, grund: g3 };
    }

    /* Die Groesse folgt dem GEGENWERT, nicht der Stueckzahl. Fest 0,1 Einheiten
     * hiess bei ETH (~3.000 $) rund 300 $ und bei BTC (~100.000 $) rund 10.000 $ -
     * am 25.08.2026 lehnte das Demo-Konto BTC deshalb mit RC_NOT_ENOUGH_MARGIN ab.
     * Gemessen wird der PREIS, nicht die Position; jede Einheit mehr erhoeht nur das
     * Risiko einer Ablehnung. */
    var ZIEL_USD = 200;
    var groesse = Math.max(0.001, Math.round((ZIEL_USD / vor.mid) * 1000) / 1000);
    var auf = null, versuche = 0;
    while (versuche < 3) {
      versuche++;
      try { auf = await window.CapAPI.openPosition(sym, 'call', groesse, null, null); }
      catch (eO) { auf = { ok: false, msg: String(eO && eO.message || eO) }; }
      if (auf && auf.ok) break;
      /* Nur bei zu wenig Sicherheit kleiner werden - jeder andere Grund bliebe auch
       * bei halber Groesse derselbe, und ein blindes Nachfassen verschleierte ihn. */
      var margin = /MARGIN/i.test(String((auf && auf.msg) || ''));
      if (!margin || groesse <= 0.001) break;
      groesse = Math.max(0.001, Math.round((groesse / 2) * 1000) / 1000);
    }
    if (!auf || !auf.ok) {
      capFehlerNeu(sym, auf || { msg: 'ohne Antwort' });
      var g4 = 'Oeffnen abgelehnt: ' + ((auf && auf.msg) || 'ohne Angabe') +
        (versuche > 1 ? ' (auch mit kleinerer Position, zuletzt ' + groesse + ')' : '');
      kostenVersuchNeu(sym, false, g4);
      return { ok: false, grund: g4 };
    }
    /* Sofort wieder zu. Zwischen Auf und Zu soll moeglichst nichts passieren -
     * gemessen werden die Kosten, nicht die Marktbewegung. */
    var zu = null;
    try { zu = await window.CapAPI.closePosition(auf.dealId); }
    catch (eC) { zu = { ok: false, msg: String(eC && eC.message || eC) }; }
    if (!zu || !zu.ok) {
      return { ok: false, grund: 'ACHTUNG: geoeffnet, aber Schliessen fehlgeschlagen (' +
        ((zu && zu.msg) || 'ohne Angabe') + '). Position bitte bei Capital.com von Hand pruefen.',
        offenGeblieben: auf.dealId };
    }
    if (auf.fill == null || zu.fill == null) {
      var g5 = 'Runde lief, aber ohne Ausfuehrungskurse - nichts zu messen.';
      kostenVersuchNeu(sym, false, g5);
      return { ok: false, grund: g5 };
    }
    /* Kauf ueber der Mitte, Verkauf darunter: beides zusammen ist der Umlauf. */
    var aufKosten = auf.fill / vor.mid - 1;
    var zuKosten = 1 - zu.fill / vor.mid;
    var runde = aufKosten + zuKosten;
    if (!D.kostenMessung) D.kostenMessung = { runden: [], seit: Date.now() };
    D.kostenMessung.runden.unshift({
      at: Date.now(), sym: sym, dir: 'call', basis: true, quelle: 'messrunde', krypto: krypto,
      groesse: groesse,
      slipOpen: Math.round(aufKosten * 1e6) / 1e6,
      slipClose: Math.round(zuKosten * 1e6) / 1e6,
      runde: Math.round(runde * 1e6) / 1e6,
      notiert: vor.spreadPct != null ? Math.round(vor.spreadPct * 1e6) / 1e6 : null
    });
    if (D.kostenMessung.runden.length > 300) D.kostenMessung.runden = D.kostenMessung.runden.slice(0, 300);
    save();
    kostenVersuchNeu(sym, true, 'Umlauf ' + (runde * 100).toFixed(4) + ' %');
    /* C5, gefunden am 25.08.2026: Hier stand `spreadPct * 200` - doppelt gezaehlt.
     *
     * aufKosten und zuKosten werden BEIDE gegen vor.mid gemessen (siehe oben), jede Seite
     * kostet also rund die halbe Spanne, und `runde` ist der volle Umlauf. vor.spreadPct =
     * (offer - bid) / mid ist ebenfalls schon der volle Umlauf - wer zum Brief kauft und
     * zum Geld verkauft, zahlt diese Spanne genau einmal. Die vergleichbare Zahl ist
     * deshalb spreadPct * 100.
     *
     * Mit * 200 stand die notierte Spanne doppelt so hoch wie der gemessene Umlauf, und
     * die Anzeige "Rest ist Schlupf" wurde regelmaessig negativ - der Schlupf sah aus, als
     * gaebe die Ausfuehrung Geld zurueck.
     *
     * WICHTIG: Daraus folgt NICHT, dass die Kostenhuerde von 0,10 % zu hoch waere. Die
     * Huerde stuetzt sich auf spannenBilanz(), und die rechnet seit jeher mit * 100, also
     * richtig. Fuer das tatsaechliche Archivuniversum zeigen die eigenen Ablehnungen sogar
     * in die Gegenrichtung (leerbuch-tageskerzen: Roll-Schaetzer ~0,93 Pp je Umlauf;
     * innertags-abgabedruck: 3,97 Pp Mindest-Tick). Korrigiert wird eine ANZEIGE, nicht
     * die Huerde. */
    return { ok: true, sym: sym, rundePct: runde * 100,
             /* * 100, nicht * 200: aufKosten und zuKosten oben werden BEIDE gegen mid
                gemessen, `runde` ist also schon der volle Umlauf - und spreadPct =
                (offer-bid)/mid ist es ebenfalls. Mit * 200 stand die notierte Spanne
                doppelt so hoch wie der gemessene Umlauf, und die Anzeige "Rest ist
                Schlupf" wurde regelmaessig negativ. Die Huerde 0,10 % bleibt, wo sie
                war; korrigiert ist eine Anzeige, nicht die Annahme. */             notiertPct: vor.spreadPct != null ? vor.spreadPct * 100 : null };
  }
  if (typeof window !== 'undefined') window.__kostenRundeMessen = kostenRundeMessen;

  /** Bilanz der echten Kosten - Median statt Mittel, ein Ausreisser soll nicht dominieren. */
  function kostenBilanz() {
    var km = D && D.kostenMessung;
    if (!km || !km.runden || !km.runden.length) return null;
    /* Krypto NICHT mitzaehlen: Die Spanne auf BTC sagt nichts ueber die Spanne auf
     * MSFT, und die Annahme 0,10 %, gegen die hier geprueft wird, stammt aus den
     * Aktien-Studien. Eine einzige BTC-Runde wuerde den Median verschieben, an dem
     * fast jede Studie haengt - unsichtbar. Zwei Quellen in einer Reihe haben hier
     * schon einmal Schaden angerichtet; das passiert nicht noch einmal. */
    function werte(nurKrypto) {
      return km.runden
        .filter(function (x) { return !!x.krypto === nurKrypto; })
        .map(function (x) { return x.runde; })
        .filter(function (v) { return v != null && isFinite(v); });
    }
    function med(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.floor(s.length / 2)]; }
    var r = werte(false);
    var k = werte(true);
    if (!r.length && !k.length) return null;
    var aus = { n: r.length, annahmePct: 0.10, seit: km.seit,
                kryptoN: k.length, kryptoMedianPct: k.length ? med(k) * 100 : null };
    if (r.length) {
      aus.medianPct = med(r) * 100;
      aus.mittelPct = r.reduce(function (a, b) { return a + b; }, 0) / r.length * 100;
    }
    return aus;
  }
  if (typeof window !== 'undefined') window.__kostenBilanz = kostenBilanz;

  /* ================= Der stündliche KI-Job ================= */
  async function runJob(manual) {
    if (jobRunning || !D) return;
    jobRunning = true;
    var statusEl = document.getElementById('jobStatus');
    var syms = universe();
    var now = Date.now();
    schattenAufraeumen(now);
    killSwitchPruefen(now);   // gilt fuer ALLE offenen Positionen, nicht nur Intraday

    var blackoutEv = (D.intraday.blackout !== 'off' && window.Cal) ? window.Cal.isBlackout(now, 45, 45) : null;
    try {
      for (var i = 0; i < syms.length; i++) {
        var sym = syms[i];
        statusEl.textContent = 'Prüfe ' + sym + ' … (' + (i + 1) + '/' + syms.length + ')';
        var hist = await getHistory(sym, '2y');
        if (!hist || hist.length < 120) continue;
        var spot = spotOf(sym, hist);
        schattenUpdate(sym, spot, now, false);
        var news = await getSymbolNews(sym);
        var closes = hist.map(function (p) { return p[1]; });

        var sent = Q.sentiment(news, now);
        // Sentiment-Verlauf aufzeichnen
        if (!SENT[sym]) SENT[sym] = [];
        SENT[sym].push([now, Math.round(sent.score * 100) / 100]);
        if (SENT[sym].length > 400) SENT[sym] = SENT[sym].slice(-300);
        var tech = Q.technical(hist);
        var ell = Q.elliott(hist.slice(-300));
        var scores = { news: sent.score, tech: tech.score, elliott: ell.score };
        var S = Q.combine(scores, D.weights);

        // ALLE Positionen der Stunden-Strategie zu diesem Symbol – nicht nur eine.
        // Vorher überschrieb die Schleife ihren Treffer und behielt nur den letzten: lagen
        // zwei Positionen auf demselben Wert (entsteht, wenn repairOrphans eine verwaiste
        // Position nachträglich adoptiert), wurde die andere NIE wieder geprüft – kein
        // Stop-Loss, kein Take-Profit, kein Zeit-Exit. Sie stand bis in alle Ewigkeit.
        var offene = D.positions.filter(function (x) { return x.sym === sym && x.strategy !== 'intraday'; });

        // Exits prüfen (SL/TP/Zeit/Gegensignal) – für jede offene Position dieses Symbols
        if (offene.length) {
          offene.forEach(function (pos) {
            var bid = bidOf(pos, spot, now);
            var ret = bid / pos.entry - 1;
            var daysLeft = (pos.expiry - now) / 86400000;
            var why = null;
            if (ret <= SL) why = 'Stop-Loss erreicht (' + Math.round(ret * 100) + ' %)';
            else if (ret >= TP) why = 'Take-Profit erreicht (+' + Math.round(ret * 100) + ' %)';
            else if (daysLeft <= 10) why = 'Zeit-Exit: Restlaufzeit unter 10 Tagen (Zeitwertverfall)';
            else if ((pos.dir === 'call' && S < -CLOSE_THR) || (pos.dir === 'put' && S > CLOSE_THR)) {
              why = 'Gegensignal (Gesamtscore ' + S.toFixed(2) + (sent.top ? '; Auslöser u. a.: „' + sent.top.title.slice(0, 90) + '“' : '') + ')';
            }
            if (why) closeTrade(pos, spot, now, why);
          });
        /* Die Sicherung stoppte bisher nur den Stundentakt - der Knopf „Jetzt prüfen“
         * eröffnete weiter Positionen auf genau dem Score, der als Kontraindikator
         * vermessen wurde (t=-11,6). Ist die Strategie aus, betreut der manuelle Lauf
         * nur noch den Bestand: Ausstiege oben laufen weiter, Einstiege nicht mehr.
         * Wer sie bewusst von Hand einschaltet, handelt wie bisher. */
        } else if (D.hourlyEnabled !== false && Math.abs(S) >= OPEN_THR && !blackoutEv && canOpen(equityNow()).ok) {
          var dir = S > 0 ? 'call' : 'put';
          var vol = Q.histVol(closes, 30);
          var evTxt = sent.events.length ? ' [' + sent.events.join(', ') + ']' : '';
          var reason = 'Gesamtscore ' + S.toFixed(2) + ' → ' + (dir === 'call' ? 'CALL' : 'PUT') +
            ' | News ' + sent.score.toFixed(2) + evTxt +
            (sent.top ? ' – „' + sent.top.title.slice(0, 110) + '“' : ' – keine markante Schlagzeile') +
            ' | Technik ' + tech.score.toFixed(2) +
            ' | Elliott ' + ell.score.toFixed(2) + ' (' + ell.label + ', Konf. ' + ell.conf + ')';
          var scenario = (dir === 'call'
            ? 'Szenario: Fortsetzung der Aufwärtsbewegung. '
            : 'Szenario: Fortsetzung der Abwärtsbewegung. ') +
            'Elliott-Einordnung: ' + ell.phase + ' (Alternativ: ' + ell.alt + '). ' +
            'Exit-Regeln: Stop-Loss −40 % auf den Scheinkurs, Take-Profit +80 %, Zeit-Exit 10 Tage vor Fälligkeit, oder Gegensignal.';
          /* Die lokale KI-Pruefung ist am 23.08.2026 entfernt worden: Sie lief laut
           * Diagnose ueber 14 Sitzungen und 1.741 Minuten kein einziges Mal (kiOk 0,
           * kiFehl 0) und hat nie etwas entschieden. Ihr neutraler Rueckgabewert war
           * "durchlassen" - genau das passiert hier jetzt direkt. */
          openTrade(sym, dir, spot, vol, scores, { reason: reason, scenario: scenario, elliottLabel: ell.label }, now);
        }
        await new Promise(function (r) { setTimeout(r, 250); });
      }
      D.lastRun = now;
      await save();
      await window.api.storeSet('sentiment', SENT);
      statusEl.textContent = 'Letzter Lauf: ' + U.dt(now) + (manual ? ' (manuell)' : '');
    } catch (e) {
      statusEl.textContent = 'Fehler im Lauf: ' + (e.message || e);
    } finally {
      jobRunning = false;
      render();
    }
  }

  /* ================= Intraday: MA-Durchbruch-Scanner ================= */
  var intradayScanning = false;
  var intradayScanSeit = 0;      // wann die Sperre gesetzt wurde - gegen ein Festhaengen

  /* btRange = wie weit zurueck fuer Messung und Archiv-Aufbau gefragt wird.
   * Am 20.08.2026 gegen die Yahoo-Chart-API ausgemessen (AAPL, gegengeprueft an NVDA,
   * MSFT, AMD, META - alle identisch). Vorher stand hier deutlich weniger, als die
   * Quelle hergibt: 60m fragte '3mo' (63 Handelstage) und konnte 730 haben, 5m/15m
   * fragten '1mo' (23 Tage) und konnten 60 haben. Groesser als hier eingetragen lehnt
   * Yahoo mit einem Fehler ab - diese Werte sind die tatsaechliche Obergrenze. */
  var INTERVAL_CFG = {
    '1m':  { range: '1d',  btRange: '7d',   barMin: 1 },     //   7 Handelstage (Yahoo-Maximum)
    '5m':  { range: '5d',  btRange: '60d',  barMin: 5 },      //  60 Handelstage
    '15m': { range: '5d',  btRange: '60d',  barMin: 15 },     //  60 Handelstage
    '60m': { range: '1mo', btRange: '730d', barMin: 60 }      // 730 Handelstage
  };

  /* ================= Krypto-Messbasis =================
   * Diese Werte werden NICHT gehandelt. Sie stehen bewusst nicht in universe() und
   * tauchen im Scanner nicht auf. Ihr einziger Zweck ist, das Kursarchiv schneller
   * zu fuellen, damit Intraday-Signale ueberhaupt pruefbar werden.
   *
   * Gemessen am 21.08.2026, Yahoo-Grenzen fuer Krypto:
   *   1m  ->   7 Tage    5m -> 60 Tage    15m -> 60 Tage    60m -> 730 Tage
   * und zwar durchgehende KALENDERtage, nicht Handelstage: 0,0 % Luecken auf jedem
   * Intervall. Bei Aktien sind dieselben 60 "Tage" nur 60 Handelstage mit Nachtluecken.
   */
  var KRYPTO = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'BNB-USD', 'ADA-USD', 'DOGE-USD', 'LTC-USD'];
  /* istKrypto stand hier ein zweites Mal - siehe die Erklaerung an der einen
   * verbliebenen Fassung weiter oben. */
  /** Spanne je Seite fuer den Basiswert-Pfad: Aktien-CFD 5 Bp, Krypto Taker-Gebuehr
   *  (Vorgabe 10 Bp, einstellbar). Bewusst konservativ - zu billige Kosten haben in
   *  diesem Projekt schon einmal ein Scheinergebnis erzeugt. */
  function basisSpanne(sym) {
    if (istKrypto(sym)) return (D && D.intraday && D.intraday.kryptoGebBp != null ? D.intraday.kryptoGebBp : 10) / 10000;
    return 0.0005;
  }
  /** Depotweiter Risikostufen-Waechter. EIN Waechter am Kauf statt zehn an den Quellen:
   *  Hand, Autopilot und Farm-Empfehlung laufen alle hier durch. Stufe 5 = keine Grenze. */
  function risikoStufeOk(dir, w, spot, now) {
    var max = (D && D.maxRisikostufe) || 5;
    if (max >= 5) return { ok: true };
    var kz = Q.scheinKennzahlen(dir, w, spot, now);
    if (!kz) return { ok: false, grund: 'Schein unter 2 Cent – die Spanne frisst jede Bewegung' };
    var rs = Q.scheinRisikostufe(kz);
    if (rs.stufe > max) return { ok: false, stufe: rs.stufe, grund: 'Risikostufe ' + rs.stufe + ' über der Grenze ' + max + ' (' + rs.gruende[0] + ')' };
    return { ok: true, stufe: rs.stufe };
  }
  var kryptoLaeuft = false;

  /** Krypto-Kerzen holen und ins Archiv legen. Laeuft unabhaengig von der US-Handelszeit -
   *  das ist der ganze Punkt: waehrend die Boerse zu ist, waechst hier die Messbasis
   *  weiter. Bewusst genuegsam: ein Intervall je Durchlauf, damit sich der Sammler nicht
   *  mit dem Scanner um Yahoos Anfragebudget streitet (dort kommen bei ~200 Anfragen in
   *  Folge 429er). */
  async function kryptoSammeln(intervall) {
    if (kryptoLaeuft || !window.Archiv) return null;
    kryptoLaeuft = true;
    var stat = { symbole: 0, kerzen: 0, fehler: 0, iv: intervall };
    try {
      for (var i = 0; i < KRYPTO.length; i++) {
        var fd = null;
        try { fd = await fetchIntraday(KRYPTO[i], intervall, true); } catch (e) { }
        if (!fd || !fd.series || fd.series.length < 30) { stat.fehler++; continue; }
        await window.Archiv.fuege(intervall, KRYPTO[i], fd.series);
        stat.symbole++; stat.kerzen += fd.series.length;
        await new Promise(function (r) { setTimeout(r, 400); });
      }
      if (stat.kerzen) await window.Archiv.speichere(true);
      if (!D.kryptoStat) D.kryptoStat = {};
      D.kryptoStat[intervall] = { at: Date.now(), symbole: stat.symbole, kerzen: stat.kerzen };
      save();
    } finally { kryptoLaeuft = false; }
    return stat;
  }

  /** Was hat der Sammler bisher zusammengetragen? Zeigt den echten Archivbestand,
   *  nicht nur "läuft" – bei einer Maßnahme gegen zu dünne Daten ist die einzig
   *  interessante Frage, ob die Datenbasis tatsächlich wächst. */
  async function zeigeKryptoStand() {
    var el = document.getElementById('kryptoStand');
    if (!el) return;
    if (D.kryptoSammeln === false) { el.textContent = 'Sammler aus – die Messbasis wächst nur noch mit den Aktien-Scans.'; return; }
    if (!window.Archiv) { el.textContent = ''; return; }
    try {
      var teile = [];
      for (var i = 0; i < ['1m', '5m', '15m', '60m'].length; i++) {
        var iv = ['1m', '5m', '15m', '60m'][i], kerzen = 0, werte = 0, aeltest = null;
        for (var s = 0; s < KRYPTO.length; s++) {
          var serie = await window.Archiv.serie(iv, KRYPTO[s]);
          if (!serie || !serie.length) continue;
          werte++; kerzen += serie.length;
          if (aeltest === null || serie[0][0] < aeltest) aeltest = serie[0][0];
        }
        if (!kerzen) continue;
        var tage = aeltest ? Math.round((Date.now() - aeltest) / 86400000) : 0;
        teile.push(iv + ': ' + kerzen.toLocaleString('de-DE') + ' Kerzen aus ' + werte + ' Werten, ' + tage + ' Tage zurück');
      }
      el.textContent = teile.length
        ? 'Krypto-Messbasis · ' + teile.join(' · ')
        : 'Noch nichts gesammelt – der erste Durchlauf startet kurz nach dem Programmstart.';
    } catch (e) { el.textContent = ''; }
  }

  /* ================= Setups: zwei Grundideen statt sechs Modi =================
   * Nach außen gibt es „Ausbruch" und „Umkehr" mit je zwei Auslösern. Intern bleibt
   * das bewährte mode-Feld erhalten – so bleiben Backtests, Historie und Kennzahlen
   * vergleichbar, und es gibt keine zweite Rechenlogik, die auseinanderlaufen kann. */
  var SETUPS = {
    ausbruch: { name: 'Ausbruch', trigger: { kreuzung: 'EMA-Kreuzung', range: 'Eröffnungs-Range', ruecksetzer: 'Trend-Rücksetzer', donchian: 'Kanal-Hoch/Tief (Donchian)', squeeze: 'Vola-Kompression (Squeeze)', kanaltrend: 'Kanaltrend folgen' } },
    umkehr:   { name: 'Umkehr',   trigger: { ueberdehnung: 'Überdehnung', welle: 'Wellental', rsi2: 'RSI(2)-Extrem', rsi2seit: 'RSI(2) im Seitwärtskanal (nur Long)', kapitulation: 'Kapitulations-Dip im Abwärtskanal (nur Long)' } }
  };
  function modeFromSetup(setup, trigger, exitStyle) {
    if (setup === 'umkehr' && trigger === 'rsi2') return 'rsi2';
    if (setup === 'umkehr' && trigger === 'rsi2seit') return 'rsi2seit';
    if (setup === 'umkehr' && trigger === 'kapitulation') return 'kapitulation';
    if (setup === 'umkehr') return trigger === 'welle' ? 'wave' : 'reversion';
    if (trigger === 'range') return 'orb';
    if (trigger === 'ruecksetzer') return 'pullback';
    if (trigger === 'donchian') return 'donchian';
    if (trigger === 'squeeze') return 'squeeze';
    if (trigger === 'kanaltrend') return 'kanaltrend';
    return (exitStyle === 'kurz' || exitStyle === 'blitz') ? 'waves' : 'breakout';
  }
  function setupFromMode(mode) {
    if (mode === 'wave') return { setup: 'umkehr', trigger: 'welle', exitStyle: 'laufen' };
    if (mode === 'reversion') return { setup: 'umkehr', trigger: 'ueberdehnung', exitStyle: 'laufen' };
    if (mode === 'orb') return { setup: 'ausbruch', trigger: 'range', exitStyle: 'laufen' };
    if (mode === 'pullback') return { setup: 'ausbruch', trigger: 'ruecksetzer', exitStyle: 'laufen' };
    if (mode === 'donchian') return { setup: 'ausbruch', trigger: 'donchian', exitStyle: 'laufen' };
    if (mode === 'squeeze') return { setup: 'ausbruch', trigger: 'squeeze', exitStyle: 'laufen' };
    if (mode === 'kanaltrend') return { setup: 'ausbruch', trigger: 'kanaltrend', exitStyle: 'trend' };
    if (mode === 'rsi2') return { setup: 'umkehr', trigger: 'rsi2', exitStyle: 'laufen' };
    if (mode === 'rsi2seit') return { setup: 'umkehr', trigger: 'rsi2seit', exitStyle: 'laufen' };
    if (mode === 'kapitulation') return { setup: 'umkehr', trigger: 'kapitulation', exitStyle: 'laufen' };
    if (mode === 'waves') return { setup: 'ausbruch', trigger: 'kreuzung', exitStyle: 'kurz' };
    return { setup: 'ausbruch', trigger: 'kreuzung', exitStyle: 'laufen' };
  }
  /** Klartext-Name einer Konfiguration – für Protokoll, Ranking und Empfehlungen. */
  function setupName(mode, channel) {
    var s = setupFromMode(mode);
    var t = SETUPS[s.setup].trigger[s.trigger];
    return SETUPS[s.setup].name + ' · ' + t
      + (s.exitStyle === 'kurz' ? ' · kurz' : '')
      + (mode === 'wave' && channel ? ' + Kanal' : '');
  }

  /** z-Score-Schwelle aus der Bestätigungs-Einstellung (Umkehr-Setup) */
  function zOf(confirmBps) { return confirmBps <= 5 ? 1.5 : confirmBps <= 15 ? 2.0 : 2.5; }

  /* ================= Hand schlägt Automatik =================
   * Was von Hand eingestellt wurde, bleibt stehen. Vorher schrieben Regime-Automatik,
   * Analyse-Zentrale, Farm und Cloud-Tuning alle in dieselben Felder – im Journal stand
   * am 19.08. sechs Handänderungen um 07:52, eine Stunde später drehte das Regime eine
   * davon zurück. Niemand konnte mehr sagen, warum eine Einstellung gerade so ist. */
  var HAND_LABEL = { mode: 'Setup', exitStyle: 'Ausstieg', interval: 'Zeitrahmen', period: 'Periode',
    confirmBps: 'Bestätigung', lineType: 'Leitlinie', window: 'Zeitfenster', trendFilter: 'Trendfilter',
    channel: 'Trendkanal', mtf: '5-Min-Bestätigung', scalpHold: 'Max-Halten', scalpTrail: 'Trailing',
    scalpSL: 'Not-Stop', profile: 'Schein-Profil', sizing: 'Positionsgröße', blackout: 'Event-Blackout',
    screener: 'Screener', cooldownMin: 'Cooldown', maxPerDay: 'Trades je Tag', avoidHours: 'Meide-Stunden' };
  /** Darf eine Automatik dieses Feld überhaupt anfassen? */
  function automatikDarf(feld) {
    return !(D && D.intraday && D.intraday.handSperre && D.intraday.handSperre[feld]);
  }
  /** Feld als „von Hand gesetzt" merken. */
  function handSperren(felder) {
    if (!D.intraday.handSperre) D.intraday.handSperre = {};
    (felder || []).forEach(function (f) { D.intraday.handSperre[f] = Date.now(); });
  }
  function handFreigeben(feld) {
    if (!D.intraday.handSperre) return;
    if (feld) delete D.intraday.handSperre[feld]; else D.intraday.handSperre = {};
  }
  /** Zeigt an, welche Felder dir gehören – und lässt sie einzeln wieder freigeben. */
  function renderHandSperre() {
    var el = document.getElementById('handSperre');
    if (!el || !D) return;
    var sp = D.intraday.handSperre || {};
    var felder = Object.keys(sp);
    if (!felder.length) {
      el.innerHTML = '<span style="color:var(--muted);">Alle Felder werden von der Automatik gepflegt. Sobald du eines von Hand änderst, gehört es dir.</span>';
      return;
    }
    el.innerHTML = '<span style="color:var(--ink-2);"><b>Von dir gesetzt</b> – die Automatik lässt diese Felder in Ruhe:</span> ' +
      felder.map(function (f) {
        return '<span class="chip flat" style="margin:2px 4px 2px 0;">' + U.esc(HAND_LABEL[f] || f) +
          ' <a href="#" data-frei="' + U.esc(f) + '" title="wieder von der Automatik pflegen lassen" style="font-weight:700; margin-left:3px;">×</a></span>';
      }).join('') +
      ' <a href="#" data-frei="*" style="color:var(--muted);">alle freigeben</a>';
    el.querySelectorAll('[data-frei]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var f = a.getAttribute('data-frei');
        handFreigeben(f === '*' ? null : f);
        save();
        renderHandSperre();
      });
    });
  }

  /** Modus-abhängige Handelsparameter */
  function slOf(c) { return c.scalpSL === 'auto' ? 'auto' : -(c.scalpSL || 20) / 100; }
  function modeParams() {
    var c = D.intraday;
    // cooldownMin/maxPerDay: konfigurierter Wert gewinnt – die Farm misst Gene damit,
    // also müssen promotete Werte auch live gelten (vorher: hart verdrahtete Modus-Defaults).
    if (c.mode === 'orb') {
      return {
        exitMode: 'confirmed', sl: slOf(c) === 'auto' ? 'auto' : slOf(c), tp: null,
        trail: 0.15, maxHoldMin: 0,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 10, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 10, scanMs: 60000
      };
    }
    if (c.mode === 'waves') {
      if (c.exitStyle === 'blitz') {
        // Blitz: Daytrade-These "langes Halten ist Gift" – raus nach spätestens 3 Minuten,
        // vorher schon bei der ersten Gegenbar oder der EMA9-Rückkreuzung. Kleine Gewinne,
        // viele Versuche; der Hebel kommt erst, wenn die Quote stimmt.
        return {
          exitMode: 'blitz', sl: slOf(c), tp: null,
          trail: 0.10, maxHoldMin: Math.min(3, c.scalpHold > 0 ? c.scalpHold : 3),
          cooldownMin: c.cooldownMin != null ? c.cooldownMin : 2, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 40, scanMs: 30000
        };
      }
      return {
        exitMode: 'recross', sl: slOf(c), tp: null,
        trail: (c.scalpTrail || 0) / 100, maxHoldMin: c.scalpHold || 0,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 5, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 40, scanMs: 90000
      };
    }
    if (c.mode === 'kapitulation') {
      /* Kapitulations-Dip: 26 Handelsstunden fester Horizont, KEIN Gewinnziel und kein
       * Trailing - der Gewinn sitzt im rechten Schwanz, jeder Deckel kappt genau die
       * Trades, die alles tragen (ohne die besten 5 % faellt das Mittel unter die
       * Drift). Nur der Not-Stop bleibt als Netz. */
      return {
        exitMode: 'zeit', sl: slOf(c), tp: null,
        trail: 0, maxHoldMin: c.scalpHold || 1560, uebernacht: true,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 240, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 6, scanMs: 90000
      };
    }
    if (c.mode === 'rsi2seit') {
      /* RSI2-Dip im Seitwaertskanal: fester Zeithorizont von 8 Handelsstunden, KEIN
       * Signal-Ausstieg (der Dip erfuellt die Gegen-Signal-Bedingung schon beim
       * Einstieg), und die Position DARF eine Nacht ueberleben - der Backtest zeigte:
       * streng intraday -0,081 % je Trade, mit Nacht +0,230 %. Der Vorsprung des
       * Dip-Kaufs zahlt zum grossen Teil ueber Nacht aus. */
      return {
        exitMode: 'zeit', sl: slOf(c), tp: null,
        trail: 0, maxHoldMin: c.scalpHold || 480, uebernacht: true,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 120, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 10, scanMs: 90000
      };
    }
    if (c.mode === 'rsi2') {
      // Connors-Logik: Schwaeche kaufen, Ausstieg bei Rueckkehr der Staerke (Leitlinie erreicht)
      return {
        exitMode: 'target', sl: slOf(c), tp: null,
        trail: 0, maxHoldMin: c.scalpHold || 240,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 10, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 20, scanMs: 90000
      };
    }
    if (c.mode === 'donchian' || c.mode === 'squeeze') {
      // Ausbruchslogik: laufen lassen mit Trailing-Stop, kein festes Ziel
      return {
        exitMode: 'confirmed', sl: slOf(c), tp: null,
        trail: (c.scalpTrail != null ? c.scalpTrail : 15) / 100, maxHoldMin: c.scalpHold || 0,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 30, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 10, scanMs: 90000
      };
    }
    if (c.mode === 'pullback') {
      return {
        exitMode: 'confirmed', sl: slOf(c), tp: null,
        trail: (c.scalpTrail != null ? c.scalpTrail : 15) / 100, maxHoldMin: c.scalpHold || 240,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 10, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 10, scanMs: 90000
      };
    }
    if (c.mode === 'reversion') {
      return {
        exitMode: 'target', sl: slOf(c), tp: null,
        trail: 0, maxHoldMin: c.scalpHold || 60,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 5, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 40, scanMs: 90000
      };
    }
    if (c.mode === 'kanaltrend') {
      /* Trendfolge im Kanal. Der Ausstieg ist bewusst NICHT 'crest': Die Kanalkante als
       * Ziel zu nehmen ist selbst eine Umkehrwette und damit genau die Seite, die in der
       * Messung verloren hat. Hier wird gehalten, bis der Kanal dreht oder bricht.
       *
       * Laengere Haltedauer als bei den Umkehr-Modi, weil ein Trend Zeit braucht - und
       * kein Ziel (tp: null), weil ein festes Ziel den Trend abschneidet, der die
       * ganze These ist. Der Not-Stop bleibt. */
      return {
        exitMode: 'trendhalten', sl: slOf(c), tp: null,
        trail: (c.scalpTrail || 0) / 100, maxHoldMin: c.scalpHold || 480,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 30, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 10, scanMs: 90000
      };
    }
    if (c.mode === 'wave') {
      return {
        exitMode: 'crest', sl: slOf(c), tp: null,
        trail: 0, maxHoldMin: c.scalpHold || 60,
        cooldownMin: c.cooldownMin != null ? c.cooldownMin : 3, maxPerDay: c.maxPerDay != null ? c.maxPerDay : 40, scanMs: 60000
      };
    }
    return { exitMode: 'confirmed', sl: c.sl, tp: c.tp, trail: 0, maxHoldMin: 0, cooldownMin: c.cooldownMin, maxPerDay: c.maxPerDay, scanMs: 5 * 60000 };
  }

  /** Ist das ueberhaupt ein Kurs? Endlich und echt groesser als null - alles andere
   *  (null, undefined, 0, negativ, NaN, Zeichenkette) hat in einer Kursreihe nichts
   *  verloren und darf erst recht keinen Stop ausloesen. */
  /* Eine Quelle, nicht zwei: die Regel steht in kurse.js und wird von dort geholt.
   * Eine zweite Fassung hier haette genau den Fehler wiederholt, den der Lader
   * aufloest - zwei Kopien derselben Regel, die auseinanderlaufen koennen. */
  var kursOk = window.Kurse.kursOk;

  async function fetchIntraday(sym, interval, btMode) {
    var fd = await fetchIntradayYahoo(sym, interval, btMode);
    if (fd) return fd;
    // Reserve: Kursdaten vom Capital.com-Demo-Konto (wenn verbunden)
    if (!btMode && window.CapAPI && window.CapAPI.enabled()) {
      try { return await window.CapAPI.prices(sym, interval, 500); } catch (e) { return null; }
    }
    return null;
  }
  async function fetchIntradayYahoo(sym, interval, btMode) {
    var ic = INTERVAL_CFG[interval] || INTERVAL_CFG['5m'];
    // Frueher lief der Messmodus ueber period1/period2, weil 'range' angeblich kein
    // 2-Monats-Kuerzel kennt. Am 20.08.2026 nachgemessen: das stimmt nicht, und der
    // Umweg KOSTETE Daten. Yahoo lehnt period1/period2 bei Intraday-Intervallen ab einer
    // gewissen Tiefe rundheraus ab (15m: ab -60 Tagen 'Unprocessable Entity', 60m sofort),
    // waehrend 'range' anstandslos liefert:
    //     15m  period1 max. 41 Handelstage  <->  range=60d   60 Handelstage
    //     60m  period1 abgelehnt            <->  range=730d 730 Handelstage
    // Die 42 Handelstage, die im Archiv lagen, sind exakt das period1-Maximum - der
    // Umweg war die Ursache der duennen Messbasis, nicht Yahoo.
    /* ROH: Was hier herauskommt, wird unmittelbar zu Stop, Ziel und Buchung - also
     * der tatsaechlich gehandelte Kurs, nicht der split-bereinigte.
     * Das Verwerfen unbrauchbarer Kurse (0, negativ, NaN), das Auffuellen fehlender
     * Hoch/Tief und der Tausch vertauscht gelieferter Werte stehen jetzt im Lader -
     * ein verworfener Balken zaehlt weiter wie ein fehlender, barsFrisch greift
     * dann von selbst. Die 429-Wiederholung ebenfalls, mit denselben 5 Sekunden. */
    try {
      var kd = await window.Kurse.hole(sym, {
        range: btMode ? ic.btRange : ic.range, interval: interval, bereinigt: false
      });
      if (!kd) return null;
      // Die Signalrechnung erwartet fuenf Spalten, nicht sechs (ohne Eroeffnung).
      var series = kd.bars.map(function (b5) { return b5.slice(0, 5); });
      var dollarSum = 0, days = {};
      for (var i = 0; i < series.length; i++) {
        var vol = series[i][2];
        if (vol) { dollarSum += vol * series[i][1]; days[new Date(series[i][0]).toISOString().slice(0, 10)] = 1; }
      }
      var nDays = Object.keys(days).length || 1;
      return series.length > 30 ? { series: series, dollarVolDay: dollarSum / nDays } : null;
    } catch (e) { return null; }
  }

  /* ---- Regime-Zuteilung (Studie 21.08.2026) ----
   * Die beiden belegten Kanten sind KOMPLEMENTAER: rsi2seit traegt im
   * SPY-Aufwaertstrend (+0,148 Pp, t=1,9) und verliert darunter (-0,169);
   * der Kapitulations-Dip sitzt fast vollstaendig im Abwaertstrend/Stress
   * (+0,94 Pp, t=3,1; in ruhigen Phasen Nullsumme). Die VORAB festgelegte
   * Regel 'rsi2seit nur ueber, Kapitulation nur unter der SPY-EMA200' schlug
   * die statische Basis auf BEIDEN Massstaeben (Mittel +0,075 Pp, t=3,2 UND
   * Durchsatz +45 Pp - die aussortierten 982 Trades waren netto negativ),
   * Zeithaelften 0,253/0,250, Permutation p=0,013. Geblockte Signale gehen
   * ins Schattenbuch - der Vorwaertstest misst die Regel live weiter. */
  var SPY_REGIME = { t: 0, auf: null };
  async function spyTrendAuf() {
    if (Date.now() - SPY_REGIME.t < 30 * 60000) return SPY_REGIME.auf;
    try {
      /* Tiefe Reihe holen: Der Anker braucht mehr als 220 Stundenkerzen, das Live-Fenster
       * (INTERVAL_CFG 60m range=1mo) liefert aber nur rund 150 - die Bedingung war nie
       * erfuellbar und die Regime-Zuteilung damit dauerhaft wirkungslos, ohne dass es
       * jemand sah. btMode waehlt btRange=730d, schaltet aber zugleich den
       * Capital.com-Ersatzweg ab; deshalb bei Fehlschlag noch einmal ueber den
       * normalen Weg, statt den Ersatz zu verlieren. */
      var fdS = await fetchIntraday('SPY', '60m', true);
      if (!fdS || !fdS.series || fdS.series.length <= 220) fdS = await fetchIntraday('SPY', '60m', false);
      if (fdS && fdS.series && fdS.series.length > 220) {
        var bS = Q.fertigeBars(fdS.series, 60, Date.now());
        var cS = bS.map(function (b) { return b[1]; });
        var eS = Q.emaSeries(cS, 200);
        SPY_REGIME = { t: Date.now(), auf: cS[cS.length - 1] > eS[eS.length - 1] };
      } else {
        SPY_REGIME = { t: Date.now(), auf: null };   // ohne Anker: Regel setzt aus (Basis-Verhalten)
      }
    } catch (eR) { SPY_REGIME = { t: Date.now(), auf: null }; }
    return SPY_REGIME.auf;
  }

  /* Naechster bekannter Ergebnistermin je Symbol - aus dem Drift-Terminarchiv,
   * hoechstens einmal je Stunde neu geladen. null = kein ZUKUENFTIGER Termin
   * bekannt (das Archiv ist historisch gewachsen und fuellt sich ueber den
   * 6-Stunden-Refresh der Drift-Strategie nach und nach mit Zukunftsterminen). */
  var TERMINE_KARTE = null, TERMINE_KARTE_T = 0;
  async function naechsterTermin(sym) {
    try {
      var now2 = Date.now();
      if (!TERMINE_KARTE || now2 - TERMINE_KARTE_T > 3600000) {
        var karte = {};
        var ta = await window.api.storeGet('drift_termine');
        if (ta && ta.sym) {
          Object.keys(ta.sym).forEach(function (s) {
            var kuenftig = null;
            (ta.sym[s] || []).forEach(function (e) {
              var t = Date.parse(e[0]);
              if (t > now2 && (!kuenftig || t < kuenftig)) kuenftig = t;
            });
            if (kuenftig) karte[s] = kuenftig;
          });
        }
        // Erst NACH erfolgreichem Laden stempeln - vorher blieb bei einem Store-
        // Fehler eine LEERE Karte eine Stunde lang als 'frisch' stehen (fail-open).
        TERMINE_KARTE = karte;
        TERMINE_KARTE_T = now2;
      }
      return TERMINE_KARTE[sym] || null;
    } catch (eT) { return null; }
  }

  function isNearUsClose() {
    /* Sommer-/winterzeitfest: 15 Minuten vor US-Schluss. Vorher war 19:45-21:00 UTC
     * hart verdrahtet - im Winter begann die Glattstellung damit 75 Minuten zu frueh.
     *
     * Und dann stand hier 390 als feste Sitzungslaenge. An einem HALBTAG (Schluss
     * 13:00 ET, 210 Minuten) wird 375 nie erreicht - die Tagesschluss-Glattstellung
     * fiel an diesen Tagen also KOMPLETT AUS, und Positionen, die ausdruecklich kein
     * Uebernacht-Risiko tragen sollten, lagen ueber Nacht. Sechs bis sieben Tage im
     * Jahr, darunter der Tag nach Thanksgiving. */
    var jetzt = Date.now();
    var laenge = (window.Boerse ? window.Boerse.sitzungsMinuten(jetzt) : 390) || 390;
    var m = Q.minutenSeitOeffnung(jetzt);
    return m >= laenge - 15 && m < laenge;
  }

  async function intradayScan() {
    // Der Scan laeuft auch bei abgeschaltetem Handel weiter, solange das Schattenbuch
    // mitschreiben soll. Frueher hing beides zusammen: Wer den Handel stoppte, stoppte
    // die Beweisaufnahme mit - und stand nach Monaten wieder ohne Daten da.
    // Reihenfolge beachten: erst prüfen, ob D überhaupt da ist. Die frühere Zeile
    // `!D || !D.intraday.enabled` war durch die Kurzschluss-Auswertung geschützt; ein
    // vorgezogenes `var nurSchatten = !D.intraday.enabled` hätte beim allerersten Aufruf
    // vor dem Laden des Depots geworfen.
    /* DIE SPERRE KONNTE FUER IMMER STEHENBLEIBEN. `intradayScanning = true` wird
     * weiter unten gesetzt, das schuetzende try beginnt aber erst danach. Wirft ein
     * Vorbereitungsschritt (runScreener, scanUniverse, window.Cal), bleibt die Sperre
     * gesetzt - und der 30-Sekunden-Takt prallt danach an dieser Zeile ab, bis die App
     * neu startet. Still ausgefallen waere nicht nur das Neugeschaeft, sondern auch
     * Stops, Ziele und die Tagesschluss-Glattstellung offener Positionen.
     *
     * Statt die Vorbereitung umzubauen bekommt die Sperre einen Zeitstempel. Das deckt
     * zusaetzlich den Fall ab, den ein try NIE faengt: ein await, das nicht zurueckkehrt.
     * Zehn Minuten sind reichlich - ein Scan dauert Sekunden. */
    if (intradayScanning) {
      if (Date.now() - intradayScanSeit < 10 * 60000) return;
      HEALTH.scanHaenger = (HEALTH.scanHaenger || 0) + 1;
      if (HEALTH.scanHaenger === 1) {
        melde('Intraday-Scan hing fest',
          'Ein Scan hat die Sperre laenger als zehn Minuten gehalten - danach haetten weder ' +
          'Signale noch Stops noch die Tagesschluss-Glattstellung gegriffen. Die Sperre ist ' +
          'geloest, der Scan laeuft wieder.');
      }
      intradayScanning = false;                 // dieser Aufruf uebernimmt
    }
    if (!D || !D.intraday) return;
    var nurSchatten = !D.intraday.enabled;
    if (nurSchatten && D.intraday.schattenImmer === false) return;
    // Krypto kennt keinen Handelsschluss: Ist der Krypto-Handel an, laeuft der Scan
    // auch bei geschlossener US-Boerse - dann nur ueber die Krypto-Werte.
    var boerseOffen = window.Dash.marketOpen();
    if (!boerseOffen && !D.intraday.kryptoHandeln) return;
    intradayScanning = true;
    intradayScanSeit = Date.now();
    var cfg = D.intraday;
    // Wellen-Screener: einmal täglich vor dem ersten Scan die besten Kandidaten holen
    if (cfg.screener && (!D.screen || D.screen.day !== new Date().toISOString().slice(0, 10))) {
      await runScreener(false); // Scan-Sperre bleibt gesetzt – sonst startet der 30-s-Takt parallel einen zweiten Scan
    }
    var st = document.getElementById('idStatus');
    var now = Date.now();
    var today = new Date().toISOString().slice(0, 10);
    if (D.intradayDay !== today) { D.intradayDay = today; D.intradayCount = 0; }
    var syms = scanUniverse();
    if (D.intraday.kryptoHandeln) KRYPTO.forEach(function (ks) { if (syms.indexOf(ks) === -1) syms.push(ks); });
    // Bei geschlossener Boerse nur die Werte scannen, die auch handeln koennen
    if (!boerseOffen) syms = syms.filter(istKrypto);
    schattenAufraeumen(now);
    var nearClose = isNearUsClose();
    var barMinScan = (INTERVAL_CFG[cfg.interval] || INTERVAL_CFG['5m']).barMin;
    var blackout = (cfg.blackout !== 'off' && window.Cal) ? window.Cal.isBlackout(now, 45, 45) : null;
    var flattenEv = (cfg.blackout === 'flat' && window.Cal) ? window.Cal.upcoming(15) : null;
    try {
      st.textContent = 'Lade Kurse (' + syms.length + ' Werte parallel) …';
      var fds = await pmap(syms, function (sy) { return fetchIntraday(sy, cfg.interval || '5m', false); }, 6);
      /* Symbole mit OFFENER Position bekommen bei ausbleibender Antwort genau einen
       * Sofort-Nachversuch: Ohne Kursantwort wurde das Symbol frueher komplett
       * uebersprungen - INKLUSIVE Stop, Ziel und Glattstellung der offenen Position.
       * Die Ausstiege sind das Letzte, das eine Stoerung stilllegen darf. */
      for (var ri = 0; ri < syms.length; ri++) {
        if (fds[ri]) continue;
        var hatOffen = D.positions.some(function (p0) { return p0.sym === syms[ri]; });
        if (hatOffen) fds[ri] = await fetchIntraday(syms[ri], cfg.interval || '5m', false);
        if (!fds[ri] && hatOffen) {
          HEALTH.exitBlind = (HEALTH.exitBlind || 0) + 1;
          patienceAdd('Kursquelle gestört – offene Position ohne frische Bewertung', syms[ri]);
        }
      }
      HEALTH.scans++; HEALTH.lastScanT = now;
      // Kapitalschutz zuerst - mit den eben geladenen, frischen Kursen. Vor jeder
      // Signalpruefung, damit an einem schlechten Tag nichts mehr dazukommt.
      killSwitchPruefen(now);
      /* Stoerungs-Zustand: Liefert ein kompletter Scan KEINE einzige Antwort, ist
       * nicht ein Symbol kaputt, sondern die Quelle. Dann: sichtbar machen (Banner,
       * einmalige Benachrichtigung) und den Takt strecken statt weiterzuhaemmern -
       * gerade bei einem Rate-Limit verlaengert stures Anfragen die Sperre nur. */
      var antworten = fds.filter(Boolean).length;
      if (antworten === 0 && syms.length >= 5) {
        HEALTH.stoerungScans = (HEALTH.stoerungScans || 0) + 1;
        if (HEALTH.stoerungScans === 2 && !HEALTH.stoerungGemeldet) {
          HEALTH.stoerungGemeldet = true;
          HEALTH.stoerungSeit = now;
          melde('Kursquelle gestört', 'Seit zwei Scans keine Kursdaten. Offene Positionen können bis zur Erholung nicht bewertet oder gestoppt werden.');
        }
      } else if (antworten > 0 && HEALTH.stoerungScans) {
        if (HEALTH.stoerungGemeldet) melde('Kursquelle wieder da', 'Die Kursdaten fließen wieder – Positionen werden normal bewertet.');
        HEALTH.stoerungScans = 0; HEALTH.stoerungGemeldet = false; HEALTH.stoerungSeit = 0;
      }
      stoerungAnzeigen();
      HEALTH.scanTimes.push(now); if (HEALTH.scanTimes.length > 400) HEALTH.scanTimes = HEALTH.scanTimes.slice(-400);
      for (var fi = 0; fi < fds.length; fi++) {
        var f = fds[fi];
        if (f && f.series) {
          HEALTH.fetchOk++;
          LASTBARS[syms[fi]] = f.series.slice(-420);
          // Jeder Scan füttert das Kursarchiv – so wächst die Messbasis mit jedem Handelstag,
          // statt für immer an Yahoos Rückblick-Fenster (5 Tage auf 1m) zu kleben.
          // Kam der Rueckfall von Capital statt Yahoo, muss das mitgeschrieben werden -
          // sonst mischt sich CFD-Volumen ungekennzeichnet in eine Boersen-Reihe.
          if (window.Archiv) await window.Archiv.fuege(cfg.interval || '5m', syms[fi], f.series,
            f.source === 'capital' ? 'cap' : null);
        }
        else HEALTH.fetchFail++;
      }
      if (window.Archiv) window.Archiv.speichere(false);  // gedrosselt: schreibt höchstens alle 10 Min
      for (var i = 0; i < syms.length; i++) {
        var sym = syms[i];
        st.textContent = 'Scan ' + sym + ' (' + (i + 1) + '/' + syms.length + ') …';
        var fd = fds[i];
        if (!fd) continue;
        var bars = fd.series;
        /* LIVE = STUDIE: Der Abruf liefert fuer 60m nur ~151 Kerzen, der rsi2seit-Detektor
         * braucht 261 (EMA100) und 201 (Kanal). Auf dem kurzen Fenster rechnete der Scanner
         * ein ANDERES Signal als Studie und Edge-Waechter (Uebereinstimmung 31,6 %, Audit
         * 22.08.2026). Das Archiv hat die Tiefe und wurde soeben mit den frischen Kerzen
         * gemischt - also rechnet der Scan darauf. Der Spot bleibt der frische Kurs. */
        if (window.Archiv) {
          try {
            var archS = await window.Archiv.serie(cfg.interval || '5m', sym);
            if (archS && archS.length > bars.length) bars = archS.slice(-800);
          } catch (eArch) { /* Archiv nicht lesbar: beim Abruf bleiben */ }
        }
        var spot = fd.series[fd.series.length - 1][1];
        // Signale ausschließlich auf ABGESCHLOSSENEN Bars rechnen. Yahoo liefert während der
        // Handelszeit den laufenden, noch unfertigen Bar mit: ein Signal darauf kann bis zum
        // Bar-Schluss wieder verschwinden (Repainting), und der Backtest wertet grundsätzlich
        // nur fertige Bars aus – Live und Backtest maßen also Unterschiedliches, obwohl Farm,
        // Analyse-Zentrale und Selbst-Optimierung genau auf dieser Vergleichbarkeit aufbauen.
        // Der Preis (spot) bleibt der aktuelle Kurs – gekauft und gestoppt wird zum Jetzt-Kurs.
        /* SCHLEIFE statt Einmal-Kappung (Befund 21.08.2026): Yahoo haengt einen
           Quote-Stempel mit aktueller Uhrzeit an, und davor steht die laufende
           Kerze. Die Einmal-Kappung entfernte nur den Stempel - die laufende
           Kerze galt als fertig, und der Scanner rechnete Signale auf halben
           Kerzen (Repainting; Live mass anderes als Studie und Backtest). */
        var sigBars = Q.fertigeBars(bars, barMinScan, now);
        var sigSpot = sigBars[sigBars.length - 1][1];
        /* Der Kapitulations-Modus stand hier nur, wenn er als ZUSATZ lief (kapiZusatz).
         * Als Hauptmodus war er ausgenommen - dort lebte der bekannte Fehler
         * "live 151 statt 261 Kerzen" weiter. Beide Detektoren brauchen dieselbe Tiefe:
         * einstiegSignal schneidet win auf max(period*4, 260), kanalUeber rechnet ueber 200. */
        if ((cfg.mode === 'rsi2seit' || cfg.mode === 'kapitulation' || cfg.kapiZusatz) && sigBars.length < 261) {
          // Detektor wuerde auf verkuerztem Fenster etwas anderes rechnen als gemessen
          patienceAdd('Kursreihe zu kurz (' + sigBars.length + ' < 261 Kerzen) – Signal wäre nicht das gemessene', sym);
          continue;
        }
        schattenUpdate(sym, spot, now, nearClose); // Schattenbuch mit frischem Kurs weiterrechnen
        /* Benannte Regeln laufen auf DENSELBEN Kerzen mit wie die gehandelte Regel -
         * vor allen Filtern, denn sie sollen die Regel messen, nicht die Filter. */
        regelnPruefen(sym, sigBars, now);
        var sig = Q.signalCross(sigBars, cfg.lineType || 'ema', cfg.period, cfg.confirmBps);
        var liquid = !cfg.minDollarVol || fd.dollarVolDay == null || fd.dollarVolDay >= cfg.minDollarVol * 1e6;
        SIG[sym] = { t: now, spot: spot, ok: false, grund: 'kein Signal', score: null, z: null, chanPos: null, chanSteep: null };
        sigLog(sym, 'kein Signal', now);
        if (D.symBlock && D.symBlock[sym] && !D.symBlock[sym].frei) { patienceAdd('Symbol gesperrt (Verlustbringer)', sym); continue; }

        // Offene Intraday-Position dieses Symbols managen
        var open = null;
        for (var p = 0; p < D.positions.length; p++) {
          if (D.positions[p].sym === sym && D.positions[p].strategy === 'intraday') open = D.positions[p];
        }
        if (open) {
          var bid = bidOf(open, spot, now);
          var ret = bid / open.entry - 1;
          if (bid > (open.peak || 0)) open.peak = bid;
          var xm = open.exitMode || 'confirmed';
          var xSL = open.sl != null ? open.sl : cfg.sl;
          var xTP = open.tp === null ? null : (open.tp != null ? open.tp : cfg.tp);
          var why = null;
          var openedToday = new Date(open.openT).toISOString().slice(0, 10) === today;
          /* Positionen mit Übernacht-Erlaubnis (RSI2-Seitwärts) überleben genau eine
           * Nacht - der Backtest zeigte: streng intraday -0,081 % je Trade, mit Nacht
           * +0,230 %. Die 2-Tage-Schranke ist das Netz, falls die App pausiert hat. */
          if (!openedToday && !open.uebernacht && !open.krypto) why = 'Übernacht-Glattstellung (App war zum Handelsschluss geschlossen)';
          /* Schutznetz skaliert mit dem Horizont: 26 Handelsstunden (Kapitulations-Dip)
           * sind 4 Handelstage - mit Wochenende bis ~6 Kalendertage. Das alte 2-Tage-
           * Netz haette jeden Kapitulations-Trade vorzeitig gekappt (und die Studie
           * zeigt: wer die langen Erholungen kappt, behaelt nur die Messer). */
          else if (open.uebernacht && now - open.openT > ((open.maxHoldMin || 0) >= 1000 ? 7 : 2) * 86400000) why = 'Übernacht-Position über dem Schutznetz (' + (((open.maxHoldMin || 0) >= 1000) ? 7 : 2) + ' Tage) – Schutzschließung';
          else if (flattenEv) why = 'Event-Glattstellung vor: ' + flattenEv.name;
          else if (ret <= xSL) why = 'Stop-Loss erreicht (' + Math.round(ret * 100) + ' %)';
          else if (xTP !== null && ret >= xTP) why = 'Take-Profit erreicht (+' + Math.round(ret * 100) + ' %)';
          else if (open.trail && open.peak > open.entry && bid <= open.peak * (1 - open.trail)) why = 'Trailing-Stop: −' + Math.round(open.trail * 100) + ' % vom Hoch (Gewinn gesichert)';
          else if (open.maxHoldMin && xm === 'zeit' && !open.krypto) {
            /* HANDELSKERZEN statt Wanduhr (Befund 21.08.2026): Die Studie mass den
             * Zeit-Ausstieg in Kerzen (8 x 60m = 8 HANDELSstunden). Die Wanduhr-
             * Zaehlung schloss jeden Uebernacht-Trade schon zur Eroeffnung des
             * Folgetags - ein 16:30-Einstieg hielt 5,5 statt 8 Handelsstunden
             * (-31 %) und der Exit landete systematisch in die Eroeffnungsauktion.
             * Jetzt zaehlen die FERTIGEN Kerzen seit dem Einstieg - exakt die
             * Backtest-Semantik. Krypto bleibt Wanduhr (dort ist beides dasselbe). */
            var kerzenSeit = 0;
            for (var kz = sigBars.length - 1; kz >= 0 && sigBars[kz][0] > open.openT; kz--) kerzenSeit++;
            if (kerzenSeit * barMinScan >= open.maxHoldMin) why = 'Haltedauer erreicht (' + kerzenSeit + ' Handelskerzen à ' + barMinScan + ' Min)';
          }
          else if (open.maxHoldMin && (xm !== 'zeit' || open.krypto) && now - open.openT >= open.maxHoldMin * 60000) why = 'Max-Haltedauer ' + open.maxHoldMin + ' Min erreicht';
          else if (nearClose && !open.uebernacht && !open.krypto) why = 'Tagesschluss-Glattstellung (kein Übernacht-Risiko)';
          else if (xm === 'crest') {
            if (open.chan) { // Kanal vom Einstieg fortschreiben, nicht jede Minute neu zeichnen
              var barMinX = (INTERVAL_CFG[cfg.interval] || INTERVAL_CFG['5m']).barMin;
              var schritteK = Math.round((now - open.chan.t) / (barMinX * 60000));
              var chM = Q.projectTrendChannel(open.chan.kanal, schritteK, spot + (open.chan.off || 0));
              if (chM) {
                chM.pos = Math.round(chM.pos * 1000) / 1000;
                if (open.dir === 'call' && chM.pos >= 0.80) why = 'Kanaloberkante erreicht – Ziel (Position ' + Math.round(chM.pos * 100) + ' % im Kanal)';
                else if (open.dir === 'put' && chM.pos <= 0.20) why = 'Kanalunterkante erreicht – Ziel (Position ' + Math.round(chM.pos * 100) + ' % im Kanal)';
                else if (open.dir === 'call' && chM.pos <= -0.125) why = 'Kanalbruch nach unten – Schutz-Exit (mögl. Trendwechsel)';
                else if (open.dir === 'put' && chM.pos >= 1.125) why = 'Kanalbruch nach oben – Schutz-Exit (mögl. Trendwechsel)';
              }
            }
            if (!why) {
              var zc = (Q.reversionSignal(sigBars, cfg.lineType || 'ema', cfg.period, 1e9).z) || 0;
              if ((open.dir === 'call' && zc >= zOf(cfg.confirmBps) * 0.8) || (open.dir === 'put' && zc <= -zOf(cfg.confirmBps) * 0.8)) why = 'Wellenkamm erreicht – Überdehnung auf der Gegenseite (z ' + zc + ')';
            }
          } else if (xm === 'zeit') {
            /* Reiner Zeit-Ausstieg: nur Stop, Ziel, Trailing, Haltedauer. Der leere
             * Zweig ist Absicht - ohne ihn griffe unten der generische Gegen-Durchbruch,
             * und der feuert beim Dip-Kauf auf die Einstiegsbedingung selbst. */
          } else if (xm === 'target') {
            if ((open.dir === 'call' && sig.above) || (open.dir === 'put' && !sig.above)) why = 'Ziel erreicht: Rückkehr zur Leitlinie';
          } else if (xm === 'blitz') {
            // Blitz-Ausstieg: erste abgeschlossene Gegenbar ODER Rückkreuzung der schnellen EMA9.
            // sigBars enthält nur fertige Bars, die Sonderbehandlung von früher entfällt damit.
            var b1 = sigBars.length >= 2 ? sigBars[sigBars.length - 1][1] : null;   // letzter abgeschlossener Bar
            var b0 = sigBars.length >= 2 ? sigBars[sigBars.length - 2][1] : null;
            var sig9 = Q.signalCross(sigBars.slice(-60), 'ema', 9, 0);
            if (b1 != null && ((open.dir === 'call' && b1 < b0) || (open.dir === 'put' && b1 > b0))) why = 'Blitz: Gegenbar – sofort raus';
            else if ((open.dir === 'call' && !sig9.above) || (open.dir === 'put' && sig9.above)) why = 'Blitz: EMA9-Rückkreuzung';
          } else if (xm === 'recross') {
            if ((open.dir === 'call' && !sig.above) || (open.dir === 'put' && sig.above)) why = 'EMA-Rückkreuzung – Welle zu Ende';
          } else if ((open.dir === 'call' && sig.crossed === 'down') || (open.dir === 'put' && sig.crossed === 'up')) {
            why = 'Gegen-Durchbruch der EMA' + cfg.period + ' (' + (sig.crossed === 'down' ? 'abwärts' : 'aufwärts') + ')';
          }
          if (why) { closeTrade(open, spot, now, why); D.intradayCooldown[sym] = now; }
          continue;
        }

        // Einstieg – Richtung je nach Modus bestimmen
        var mp = modeParams();
        var kapiTrade = false;   // dieser Trade laeuft als Kapitulations-Dip (Zusatz-Standbein)
        var isRev = cfg.mode === 'reversion';
        var isWave = cfg.mode === 'wave';
        var isOrb = cfg.mode === 'orb';
        var isPull = cfg.mode === 'pullback';
        var isRsi2 = cfg.mode === 'rsi2';
        var isRsi2Seit = cfg.mode === 'rsi2seit';
        var isKapitulation = cfg.mode === 'kapitulation';
        var isDon = cfg.mode === 'donchian';
        var isSq = cfg.mode === 'squeeze';
        var dir = null, revZ = null, waveQ = null, chE = null, chN = 0, chRef = null, orbInfo = null;
        var useChan = isWave && cfg.channel !== false;
        if (isOrb) {
          // Opening-Range-Breakout: Range der ersten 30 Min, 1 Trade je Richtung/Tag
          var tb = sigBars.filter(function (b) { return new Date(b[0]).toISOString().slice(0, 10) === today; });
          if (tb.length >= 3) {
            var t0b = tb[0][0];
            var rb = tb.filter(function (b) { return b[0] - t0b < 30 * 60000; });
            if (rb.length >= 3 && tb[tb.length - 1][0] - t0b >= 30 * 60000) {
              var orbHi = -Infinity, orbLo = Infinity;
              rb.forEach(function (b) { if (b[1] > orbHi) orbHi = b[1]; if (b[1] < orbLo) orbLo = b[1]; });
              var confO = (cfg.confirmBps || 15) / 10000;
              if (!D.orb || D.orb.day !== today) D.orb = { day: today, traded: {} };
              // Die Tageschance wird erst nach dem tatsächlichen Kauf verbraucht (siehe unten),
              // sonst frisst ein von einem Filter abgelehnter Ausbruch den Trade des Tages.
              // Vergleich gegen den letzten ABGESCHLOSSENEN Kurs: eine kurze Spitze innerhalb
              // der laufenden Kerze, die sich bis zum Bar-Schluss wieder zurückbildet, ist kein
              // Ausbruch – der Backtest sieht sie auch nicht.
              if (sigSpot > orbHi * (1 + confO) && !D.orb.traded[sym + '|call']) { dir = 'call'; orbInfo = { hi: orbHi, lo: orbLo }; }
              else if (sigSpot < orbLo * (1 - confO) && !D.orb.traded[sym + '|put']) { dir = 'put'; orbInfo = { hi: orbHi, lo: orbLo }; }
            }
          }
        } else if (isWave) {
          var wq = Q.waveQuality(sigBars, cfg.lineType || 'ema', cfg.period, zOf(cfg.confirmBps));
          SIG[sym].score = wq.score; SIG[sym].z = wq.z;
          if (wq.signal && wq.score >= 60) { dir = wq.signal; revZ = wq.z; waveQ = wq; }
          else if (wq.signal) patienceAdd('Wellen-Qualität zu niedrig (' + wq.score + '/100)', sym);
          if (dir && useChan) {
            // Chart-technische Erkennung: Linien ohne die letzten Bars gelegt, damit ein
            // Ausbruch überhaupt sichtbar werden kann.
            var dgB = Q.degapBarArray(sigBars);
            chE = Q.trendChannel(dgB);
            if (chE) {
              SIG[sym].chanPos = chE.pos; SIG[sym].chanSteep = chE.steigung; SIG[sym].chanQ = chE.score;
              SIG[sym].chanTyp = chE.typ; SIG[sym].chanAus = chE.ausbruch; chN = chE.N;
              // Versatz gegen den Kurs DESSELBEN Bars rechnen, aus dem dgB stammt – sonst
              // steckt die Bewegung innerhalb der laufenden Kerze mit im Versatz.
              chRef = { kanal: chE, t: now, off: dgB[dgB.length - 1][1] - sigSpot };
            }
            if (!chE || !chE.gueltig) { patienceAdd('Kein gültiger Kanal (Chart-Prüfung)', sym); schattenNeu('Kanal-Filter', sym, dir, spot, sigBars, mp, cfg, now); dir = null; }
            else if (chE.ausbruch) { patienceAdd('Kanalausbruch – der Kanal gilt nicht mehr', sym); schattenNeu('Kanal-Filter', sym, dir, spot, sigBars, mp, cfg, now); dir = null; }
            else if (dir === 'call' && chE.pos > 0.30) { patienceAdd('Kanal: nicht an der Unterkante', sym); schattenNeu('Kanal-Filter', sym, dir, spot, sigBars, mp, cfg, now); dir = null; }
            else if (dir === 'put' && chE.pos < 0.70) { patienceAdd('Kanal: nicht an der Oberkante', sym); schattenNeu('Kanal-Filter', sym, dir, spot, sigBars, mp, cfg, now); dir = null; }
            else if (dir === 'call' && chE.trend === 'down') { patienceAdd('Kanal zeigt abwärts', sym); schattenNeu('Kanal-Filter', sym, dir, spot, sigBars, mp, cfg, now); dir = null; }
            else if (dir === 'put' && chE.trend === 'up') { patienceAdd('Kanal zeigt aufwärts', sym); schattenNeu('Kanal-Filter', sym, dir, spot, sigBars, mp, cfg, now); dir = null; }
          }
        } else if (isRev) {
          var rsig = Q.reversionSignal(sigBars, cfg.lineType || 'ema', cfg.period, zOf(cfg.confirmBps));
          if (rsig.signal) { dir = rsig.signal; revZ = rsig.z; }
        } else if (isPull) {
          var psigL = Q.pullbackSignal(sigBars, cfg.lineType || 'ema', cfg.period, cfg.confirmBps);
          if (psigL.signal) { dir = psigL.signal; revZ = psigL.distBps / 100; }
        } else if (isRsi2) {
          var xsigL = Q.rsiExtremSignal(sigBars);
          if (xsigL.signal) { dir = xsigL.signal; revZ = xsigL.wert; }
        } else if (isKapitulation) {
          // Kapitulations-Dip: dieselbe geprüfte Funktion wie Studie und Backtest.
          var vsKap = Q.einstiegSignal(sigBars, sigBars.length - 1, {
            ENTRY: 'kapitulation', LINE: cfg.lineType || 'ema', period: cfg.period || 20,
            confirmBps: cfg.confirmBps, ZTHR: zOf(cfg.confirmBps), MINQ: 0,
            CHAN: false, MTF: false, TREND: false
          });
          if (vsKap && vsKap.dir === 'call') dir = 'call';
        } else if (isRsi2Seit) {
          /* RSI(2)-Dip NUR im Seitwärtskanal, nur Long. Bewusst über die reine Funktion
           * aus quant.js statt hier nachgebauter Logik – die Bedingungsstudie, der
           * Backtest und der Live-Scanner müssen exakt dieselbe Regel rechnen, sonst
           * messen sie Verschiedenes (der Präzedenzfall: der Gleichheitstest der
           * Vorberechnung fand neun still fehlende Trades).
           *
           * NUR CALL: Das Put-Bein kämpft gegen die Marktdrift und verlor im Backtest
           * −0,099 % je Trade, während das Call-Bein +0,075 % machte. Dieselbe Lektion
           * wie bei der Ergebnis-Drift-Strategie. */
          var vsK = Q.einstiegSignal(sigBars, sigBars.length - 1, {
            ENTRY: 'rsi2seit', LINE: cfg.lineType || 'ema', period: cfg.period || 20,
            confirmBps: cfg.confirmBps, ZTHR: zOf(cfg.confirmBps), MINQ: 0,
            CHAN: false, MTF: false, TREND: false
          });
          if (vsK && vsK.dir === 'call') dir = 'call';
          else if (vsK && vsK.dir === 'put') patienceAdd('RSI2-Seitwärts: Put-Seite trägt nicht (nur Long)', sym);
          /* ZWEITES STANDBEIN (21.08.2026): Der Kapitulations-Dip feuert in der
           * ANDEREN Marktphase (Abwaertskanal statt Seitwaerts) - die beiden
           * Erlaubnis-Gates schliessen sich praktisch aus, deshalb duerfen beide
           * belegten Modi parallel laufen (Haken 'Kapitulations-Dip zusaetzlich').
           * Ein Kapitulations-Trade traegt seinen eigenen Horizont (26 Handels-
           * stunden statt 8) und seinen Modus-Stempel. */
          if (!dir && cfg.kapiZusatz) {
            var vsK2 = Q.einstiegSignal(sigBars, sigBars.length - 1, {
              ENTRY: 'kapitulation', LINE: cfg.lineType || 'ema', period: cfg.period || 20,
              confirmBps: cfg.confirmBps, ZTHR: zOf(cfg.confirmBps), MINQ: 0,
              CHAN: false, MTF: false, TREND: false
            });
            if (vsK2 && vsK2.dir === 'call') { dir = 'call'; kapiTrade = true; }
          }
        } else if (isDon) {
          var dsigL = Q.donchianSignal(sigBars, cfg.period, cfg.confirmBps);
          if (dsigL.signal) dir = dsigL.signal;
        } else if (isSq) {
          var qsigL = Q.squeezeSignal(sigBars, cfg.period || 20);
          if (qsigL.signal) { dir = qsigL.signal; revZ = qsigL.enge; }
        } else if (sig.crossed) {
          dir = sig.crossed === 'up' ? 'call' : 'put';
        }
        /* Edge-Wächter-Pause: Der Vorsprung der belegten Kante ist in zwei Naechten
         * hintereinander verfallen - dann kommen keine NEUEN Einstiege mehr, bis
         * eine Nacht wieder positiv misst oder Wilhelm es von Hand uebersteuert.
         * Ausstiege und Schattenbuch laufen unveraendert weiter. */
        /* D1: Jeder Arm haengt an SEINER eigenen Messung. Vorher sperrte eine
         * rsi2seit-Messung auch den Kapitulations-Dip - eine andere Kante mit
         * anderer Haltedauer (26 statt 8 Kerzen) und anderem Regime.
         * Seit 25.08.2026 schreibt der Waechter beide Pausen (EDGE_ARME). Davor wurde
         * edgePauseKapi nur GELESEN und nie gesetzt - die Schutzpause dieses Arms
         * existierte nur auf dem Papier.
         * edgePauseKapi fehlt in alten Zustaenden; dann greift fuer diesen Arm
         * nichts, bis der Waechter ihn einmal gemessen hat. */
        var istKapiSignal = kapiTrade || isKapitulation;
        var armPause = istKapiSignal ? D.intraday.edgePauseKapi : (isRsi2Seit ? D.intraday.edgePause : null);
        if (dir && (isRsi2Seit || istKapiSignal) && armPause && !D.intraday.edgePauseHand) {
          patienceAdd('Edge-Wächter (' + (istKapiSignal ? 'Kapitulations-Dip' : 'RSI(2)') +
            '): Vorsprung verfallen – neue Einstiege pausiert', sym);
          schattenNeu('Edge-Wächter', sym, dir, spot, sigBars, mp, cfg, now);
          dir = null; kapiTrade = false;
        }
        /* Regime-Zuteilung: jede Kante nur in ihrem gemessenen Regime.
         * Steht BEWUSST hinter der ganzen Auslöser-Kette und nicht im rsi2seit-Zweig:
         * dort war das Gate fuer den eigenstaendigen Modus 'kapitulation' schlicht
         * unerreichbar - die Oberflaeche sagte einen Filter zu, den es dort nie gab
         * (Gegenpruefung 21.08.2026). regimeAuf === null (kein SPY-Anker) laesst
         * beide Kanten durch - Basis-Verhalten. */
        if (dir && cfg.regimeZuteilung && (isRsi2Seit || isKapitulation)) {
          var istKapi = kapiTrade || isKapitulation;   // Zusatz-Standbein ODER eigener Modus
          var regimeAuf = await spyTrendAuf();
          if (!istKapi && regimeAuf === false) {
            patienceAdd('Regime: S&P 500 unter der 200er-Linie – RSI(2) im Seitwärtskanal pausiert (verliert dort −0,17 Pp)', sym);
            schattenNeu('Regime-Filter', sym, dir, spot, sigBars, mp, cfg, now);
            dir = null;
          } else if (istKapi && regimeAuf === true) {
            patienceAdd('Regime: S&P 500 über der 200er-Linie – Kapitulations-Dip pausiert (trägt nur im Abwärtstrend)', sym);
            schattenNeu('Regime-Filter', sym, dir, spot, sigBars, mp, cfg, now);
            dir = null; kapiTrade = false;
          }
        }
        if (!dir) continue;
        if (nearClose && !mp.uebernacht && !istKrypto(sym)) { patienceAdd('Tagesschluss steht bevor', sym); continue; }
        if (blackout) { patienceAdd('Event-Blackout', sym); continue; } // FOMC/CPI/NFP ±45 Min
        /* Zahlen-Blackout fuer Uebernacht-Modi (21.08.2026): Wer eine Nacht haelt,
         * darf nicht ausgerechnet VOR den Quartalszahlen des Werts einsteigen -
         * Ergebnisluecken sind genau das Risiko, das der Event-Blackout-Gedanke
         * meidet. Geprueft wird gegen die lokal bekannten Termine (Drift-Archiv);
         * die Liste waechst mit jedem 6-Stunden-Refresh. Ein UNBEKANNTER Termin
         * kann nicht blocken - das ist die ehrliche Grenze dieser Pruefung. */
        /* Der Termin wird jetzt IMMER geholt, nicht nur fuer den Blackout: Seit die
         * Vola die Ereignis-Struktur kennt, geht er auch in die Bepreisung ein.
         * naechsterTermin liest aus einer stuendlich erneuerten Karte im Speicher -
         * der Aufruf kostet nichts. */
        var nTermin = istKrypto(sym) ? null : await naechsterTermin(sym);
        if (mp.uebernacht && !istKrypto(sym)) {
          /* Fenster = realer Wanduhr-Halt, nicht die nominelle Haltedauer: 8 Handels-
           * stunden heissen 'bis in den Folgetag' (~26-30 h), vor dem Wochenende bis
           * Montag (~78 h). Das alte 20-h-Fenster liess Einstiege durchrutschen, deren
           * Position exakt durch die Vor-Boersen-Zahlen des Folgetags sass. */
          var blackoutFenster = (new Date(now).getDay() === 5 ? 78 : 30) * 3600000;
          if (nTermin && nTermin - now < blackoutFenster) {
            patienceAdd('Zahlen stehen an (' + new Date(nTermin).toLocaleDateString('de-DE') + ') – kein Übernacht-Einstieg', sym);
            schattenNeu('Zahlen-Blackout', sym, dir, spot, sigBars, mp, cfg, now);
            continue;
          }
        }
        /* rsi2seit und kapitulation sind von Meide-Stunden und Zeitfenster AUSGENOMMEN -
         * dieselbe Falle wie der behobene trendFilter: Die Studie hat die Tageszeit
         * ausdruecklich mitgemessen und beide Modi OHNE Fenster-Bedingung validiert.
         * Farm und Analyse-Zentrale duerfen diese Felder setzen (fuer ihre Modi),
         * aber sie duerfen keine studierten Signale still ausduennen. */
        if ((cfg.avoidHours || []).length && !isRsi2Seit && !isKapitulation) {
          var hourB = parseInt(new Date(now).toLocaleString('de-DE', { hour: '2-digit', hour12: false, timeZone: 'Europe/Berlin' }), 10);
          if (cfg.avoidHours.indexOf(hourB) !== -1) {
            patienceAdd('Meide-Stunde (Analyse-Zentrale)', sym);
            // Auch dieser Block gehoert ins Schattenbuch - vorher waren seine Kosten unmessbar
            schattenNeu('Meide-Stunde', sym, dir, spot, sigBars, mp, cfg, now);
            continue;
          }
        }
        if (!istKrypto(sym) && !isRsi2Seit && !isKapitulation && !Q.inWindow(now, cfg.window || 'all')) { patienceAdd('Außerhalb des Zeitfensters', sym); schattenNeu('Zeitfenster', sym, dir, spot, sigBars, mp, cfg, now); continue; }
        if (!liquid) { patienceAdd('Zu wenig Liquidität', sym); continue; }
        var frisch = barsFrisch(bars, barMinScan, now);
        if (!frisch.ok) {
          patienceAdd('Kursdaten veraltet', sym);
          HEALTH.staleBars = (HEALTH.staleBars || 0) + 1;
          continue;
        }
        if (D.intradayCount >= mp.maxPerDay) { patienceAdd('Tageslimit erreicht', sym); schattenNeu('Tageslimit', sym, dir, spot, sigBars, mp, cfg, now); continue; }
        if (killSwitchAktiv()) { patienceAdd('Kill-Switch: Handel bis Tagesende gesperrt', sym); continue; }
        /* Die Marktlagen-Pause gilt NICHT fuer die belegten Kanten (Inventur
         * 22.08.2026): Ihre Fallback-Regel pausiert bei "Trendanteil 40-60 %,
         * wenig Wellen" - das IST der Seitwaertsmarkt, in dem rsi2seit sein Geld
         * verdient (gemessen +0,147 Pp). Die Pause misst auf 5m-Kennzahlen, die
         * Kante handelt auf 60m, und gemessen wurde die Regel nie. Fuer die
         * widerlegten Modi bleibt sie als Schutz bestehen. */
        if (D.handelsPause && D.handelsPause.bis > now && !isRsi2Seit && !isKapitulation) { patienceAdd('Handelspause (Marktlage: kein passendes Setup)', sym); continue; }
        if (!canOpen(equityNow()).ok) { patienceAdd('Risiko-Limit', sym); continue; } // Risikomanagement
        // 5-Min-Bestätigung für 1-Min-Signale (Multi-Timeframe)
        if (cfg.mtf !== false && (cfg.interval || '5m') === '1m' && !Q.mtfAgrees(sigBars, dir, 5)) { patienceAdd('5-Min-Chart widerspricht', sym); schattenNeu('MTF-Widerspruch', sym, dir, spot, sigBars, mp, cfg, now); continue; }
        // Verlustserien-Drossel (Tilt-Schutz)
        var lsN = (D.lossStreak && D.lossStreak.day === today) ? D.lossStreak.n : 0;
        if (lsN >= 5) { patienceAdd('Verlustserie (5+) – Pause bis Tagesende', sym); schattenNeu('Verlustserie', sym, dir, spot, sigBars, mp, cfg, now); continue; }
        var lsFactor = lsN >= 3 ? 0.5 : 1;
        /* rsi2seit und kapitulation sind vom optionalen EMA100-Trendfilter AUSGENOMMEN:
         * Beide sind Dip-Kaeufe - beim Signal liegt der Kurs naturgemaess unter der EMA,
         * ein aktiver Trendfilter haette praktisch JEDES Signal geblockt. Die Studie hat
         * den EMA-Zustand ausdruecklich mitgemessen und diese Modi OHNE EMA-Bedingung
         * validiert; ihr Regime-Gate ist der Kanal (seit bzw. ab), nichts anderes.
         * (Gefunden 21.08.2026: trendFilter=true aus einer alten wave-Konfiguration
         * haette den frisch umgestellten rsi2seit stumm geschaltet.) */
        if (isWave || (!isRev && !isRsi2Seit && !isKapitulation && cfg.trendFilter)) { // Trend: beim Wellenreiter Pflicht, sonst optional
          // Kanalrichtung UND übergeordneter Trend müssen passen – ein Seitwärtskorridor
          // innerhalb eines Abwärtstrends ist kein Freibrief für Long-Einstiege.
          if (chE) {
            if (dir === 'call' && chE.trend === 'down') { patienceAdd('Regime: Kanal zeigt abwärts', sym); schattenNeu('Kanal-Filter', sym, dir, spot, sigBars, mp, cfg, now); continue; }
            if (dir === 'put' && chE.trend === 'up') { patienceAdd('Regime: Kanal zeigt aufwärts', sym); schattenNeu('Kanal-Filter', sym, dir, spot, sigBars, mp, cfg, now); continue; }
          }
          {
            var tc = sigBars.slice(-240).map(function (b) { return b[1]; });
            if (tc.length >= 100) {
              var e100 = Q.emaSeries(tc, 100);
              if (isWave) {
                // Wellen-Tal liegt naturgemäß oft UNTER der EMA100 – es zählt die EMA-Richtung
                var rising = e100[e100.length - 1] > e100[Math.max(0, e100.length - 9)];
                if ((dir === 'call' && !rising) || (dir === 'put' && rising)) { patienceAdd('Gegen den Trend (EMA100)', sym); continue; }
              } else {
                var up100 = sigSpot > e100[e100.length - 1];
                if ((dir === 'call' && !up100) || (dir === 'put' && up100)) { patienceAdd('Gegen den Trend (EMA100)', sym); continue; }
              }
            }
          }
        }
        var barMin = (INTERVAL_CFG[cfg.interval] || INTERVAL_CFG['5m']).barMin;
        var effCooldown = Math.max(mp.cooldownMin, barMin * 2) * 60000;
        if (D.intradayCooldown[sym] && now - D.intradayCooldown[sym] < effCooldown) { patienceAdd('Cooldown (Straßenbahn-Regel)', sym); continue; }
        var prof = Q.PROFILES[cfg.profile] || Q.PROFILES.atm21;
        var closes5 = sigBars.map(function (b) { return b[1]; });
        /* ivBasis ist die Vola AM GELD - die geschaetzte, aus der realisierten
         * Volatilitaet. Sie wird auf der Position mitgeschrieben, denn die Bewertung
         * baut Smile und Ereignis-Struktur jedes Mal neu darauf auf. Wuerde nur die
         * fertige iv gespeichert, waere der Effekt beim naechsten Bewerten wieder
         * eingefroren - genau der Fehler, der hier behoben wird. */
        var ivBasis = Math.min(1.5, Math.max(0.15, Q.histVolIntraday(closes5, Math.round(390 / barMin)) * 1.1));
        var strike = Math.round(spot * (1 + (dir === 'call' ? prof.otmPct : -prof.otmPct)) * 100) / 100;
        var bvI = prof.ratio || Q.RATIO;
        var expiryI = now + prof.days * 86400000;
        var iv = ivFuer(ivBasis, dir, strike, spot, expiryI, nTermin, now);
        var w = { strike: strike, expiry: expiryI, iv: iv, ratio: bvI };
        var wWert2 = Q.warrantValue(dir, w, spot, now);
        if (wWert2 <= 0.001) continue;
        var spx2 = Q.effSpread(iv, undefined, wWert2, bvI) + Q.slipOf(iv, undefined, wWert2);
        var ask = wWert2 * (1 + spx2);
        // Kosten-Breakeven-Filter: lohnt sich der Trade nach Kosten überhaupt?
        var omegaPre = Q.warrantOmega(dir, w, spot, now);
        /* Instrument-Weiche: Basiswert statt Schein - vom Nutzer gewaehlt oder von
         * Krypto erzwungen (ein aktien-geeichtes Schein-Modell auf BTC waere Unfug).
         * Linear, ohne Zeitwert, mit kleiner fester Spanne. Der belegte RSI2-Einstieg
         * liegt ueber der Basiswert-Huerde (0,10 %) und unter der Scheinhuerde (0,21 %) -
         * ohne diese Weiche ist er live nicht erntbar. */
        var istBasis = cfg.instrument === 'basis' || istKrypto(sym);
        /* KLUMPENRISIKO-DECKEL. Die neuen Long-only-Modi (Kapitulations-Dip, RSI2-
         * Seitwaerts) feuern im Crash auf viele Werte GLEICHZEITIG - genau dann, wenn
         * alles zusammen faellt. maxPerDay begrenzt nur pro Tag; ueber mehrere Tage
         * stapeln sich sonst 15+ gleichgerichtete Longs, die alle dasselbe Marktbeta
         * sind. Zehn Kapitulations-Dips sind keine zehn Wetten, sondern eine - zehnmal.
         * Der Deckel zaehlt alle offenen Intraday-Positionen derselben Richtung und
         * laesst ab der Grenze (Vorgabe 8) nichts mehr dazu. Der Kill-Switch bleibt
         * unabhaengig davon das Netz darunter. */
        var klumpenMax = D.intraday.klumpenMax != null ? D.intraday.klumpenMax : 8;
        var gleicheRichtung = 0;
        for (var kp = 0; kp < D.positions.length; kp++) {
          if (D.positions[kp].strategy === 'intraday' && D.positions[kp].dir === dir) gleicheRichtung++;
        }
        if (gleicheRichtung >= klumpenMax) {
          patienceAdd('Klumpen-Limit: schon ' + gleicheRichtung + ' offene ' + (dir === 'call' ? 'Long' : 'Short') + '-Positionen (Grenze ' + klumpenMax + ') – zehn gleichgerichtete Trades sind eine Wette, zehnmal', sym);
          schattenNeu('Klumpen-Limit', sym, dir, spot, sigBars, mp, cfg, now, iv);
          continue;
        }
        /* SEKTOR-DECKEL (Inventur 22.08.2026): Der Richtungs-Deckel kannte keine
         * Branchen - 8 gleichgerichtete Longs durften 8 Halbleiter sein, und der
         * Pool 'volatil' besteht zu einem Drittel aus Chips. Genau im Chip-Ausverkauf
         * feuert rsi2seit auf alle gleichzeitig; das waere EINE Sektorwette mit bis
         * zu 40 % des Depots. Die Halbleiter-Liste ist eine SETZUNG (Stichtag), aber
         * der Deckel schreibt Schatten - seine Kosten sind damit messbar. */
        var sektor = SEKTOR_CHIPS[sym] ? 'chips' : null;
        if (sektor) {
          var chipMax = Math.max(2, Math.ceil(klumpenMax / 2));
          var gleicheChips = 0;
          for (var kc = 0; kc < D.positions.length; kc++) {
            if (D.positions[kc].strategy === 'intraday' && D.positions[kc].dir === dir && SEKTOR_CHIPS[D.positions[kc].sym]) gleicheChips++;
          }
          if (gleicheChips >= chipMax) {
            patienceAdd('Sektor-Klumpen: schon ' + gleicheChips + ' gleichgerichtete Halbleiter-Positionen (Grenze ' + chipMax + ') – acht Chips sind eine Wette, achtmal', sym);
            schattenNeu('Sektor-Klumpen', sym, dir, spot, sigBars, mp, cfg, now, iv);
            continue;
          }
        }
        if (istBasis) {
          wWert2 = spot;
          spx2 = basisSpanne(sym);
          ask = spot * (1 + spx2);
          omegaPre = 1;
        } else {
          var rsW = risikoStufeOk(dir, w, spot, now);
          if (!rsW.ok) {
            patienceAdd('Risikostufe: ' + rsW.grund, sym);
            schattenNeu('Risikostufe', sym, dir, spot, sigBars, mp, cfg, now, iv);
            continue;
          }
        }
        // Not-Stop: fix oder „atmend“ (Volatilität × Hebel)
        var slT = mp.sl === 'auto' ? Q.autoStop(closes5, omegaPre, (mp.maxHoldMin || 60) / barMin) : mp.sl;
        var budgetAbs = Math.max(1, equityNow() * cfg.budgetPct);
        var roundTrip = 2 * spx2 + (2 * (cfg.orderFee || 0)) / budgetAbs;
        var ec;
        if (chE) {
          // Kanal-Edge: Der Weg bis zur Gegenkante muss die Kosten decken.
          var toEdge = dir === 'call' ? chE.zuObenPct : chE.zuUntenPct;
          var needPctC = omegaPre > 0 ? (roundTrip / omegaPre) * 100 : Infinity;
          ec = { ok: toEdge >= needPctC * 1.5, havePct: Math.round(toEdge * 100) / 100, needPct: Math.round(needPctC * 100) / 100 };
        } else {
          ec = Q.edgeCheck(closes5, (mp.maxHoldMin || 60) / barMin, roundTrip, omegaPre, 1.5);
        }
        if (!ec.ok) { patienceAdd('Kosten-Check: Bewegung deckt Kosten nicht', sym); schattenNeu('Kosten-Check', sym, dir, spot, sigBars, mp, cfg, now); continue; }
        var fee = cfg.orderFee || 0;
        var qty;
        var sizingR = parseFloat(cfg.sizing);
        if (sizingR > 0) {
          // Positionsgröße nach Risiko: ausgelöster Stop kostet ~sizingR % vom Depot
          qty = Math.floor((equityNow() * sizingR / 100 * lsFactor) / (ask * Math.max(0.08, Math.abs(slT))));
          var qMax = Math.floor((equityNow() * Math.max(cfg.budgetPct * 3, 0.10)) / ask);
          if (qty > qMax) qty = qMax;
        } else {
          qty = Math.floor((equityNow() * cfg.budgetPct * lsFactor) / ask);
        }
        if (istBasis) {
          // Bruchstuecke sind beim Basiswert Realitaet (CFD). Ohne sie fiele jede Aktie
          // ueber equity*budget still aus dem Handel - im Backtest hat genau dieser
          // Ganzzahl-Filter alle Werte ueber 400 $ ausgeschlossen.
          qty = sizingR > 0
            ? (equityNow() * sizingR / 100 * lsFactor) / (ask * Math.max(0.08, Math.abs(slT)))
            : (equityNow() * cfg.budgetPct * lsFactor) / ask;
          qty = Math.max(0, Math.round(qty * 10000) / 10000);
          if (qty * ask < 1) qty = 0;
        }
        var cost = qty * ask + fee;
        /* Hier haben ALLE Filter zugestimmt. Das ist der Moment, den der Vorwaertstest
            braucht: Was die Strategie tun WOLLTE, unabhaengig davon, ob Geld da war und
            ob ueberhaupt gehandelt wird. Die bisherigen Schatten protokollieren nur, was
            ein Filter verhindert hat - damit laesst sich die Strategie selbst nie
            beurteilen, nur ihre Filter. */
        schattenNeu('Einstieg', sym, dir, spot, sigBars, mp, cfg, now, iv);
        if (nurSchatten) {
          // Handel ist aus: aufgezeichnet ist der Trade, ausgefuehrt wird er nicht.
          // Das Tageslimit trotzdem hochzaehlen, sonst zeichnet der Schatten einen Tag
          // auf, den die Strategie so nie gehabt haette.
          D.intradayCount = (D.intradayCount || 0) + 1;
          D.intradayCooldown[sym] = now;
          continue;
        }
        /* Beim Basiswert sind Bruchstuecke Realitaet und oben ausdruecklich erlaubt;
         * die Ganzzahl-Schranke hier hat das zwei Zeilen spaeter wieder aufgehoben.
         * Nachgezaehlt am Stundenarchiv (23.08.2026, 191 Werte): bei risikobasierter
         * Groesse (125 $) fielen 123 Werte still aus, bei fester Groesse (300 $) 53 -
         * betroffen war alles oberhalb des Positionswerts, also AAPL, MSFT, NVDA, META.
         * Zu klein ist eine Basiswert-Position erst unter einem Dollar, und das prueft
         * der Block oben bereits (qty * ask < 1 -> qty = 0).
         * Ausserdem wird nicht mehr still uebersprungen: Wer nicht sieht, dass zwei
         * Drittel des Universums ausfallen, sucht den Fehler an der falschen Stelle. */
        var zuKlein = istBasis ? !(qty > 0) : qty < 1;
        if (zuKlein || D.cash < cost) {
          patienceAdd(zuKlein
            ? 'Position zu klein: ' + (istBasis ? 'unter 1 $' : Math.round(ask) + ' $ je Stück, das Budget reicht nicht für ein ganzes')
            : 'Nicht genug freies Kapital', sym);
          continue;
        }
        D.cash -= cost;
        var omega = Q.warrantOmega(dir, w, spot, now);
        var aufgeld = Q.warrantAufgeld(dir, w, spot, now);
        var isWaves = D.intraday.mode === 'waves';
        var trade = {
          id: D.nextId++, sym: sym, dir: dir, openT: now, strategy: 'intraday',
          // Welches Setup hat ausgeloest? Ohne den Vermerk laesst sich spaeter nie
          // sagen, welcher Modus die Trades einer gemischten Historie erzeugt hat.
          modus: kapiTrade ? 'kapitulation' : (D.intraday.mode || null),
          entrySpot: spot, entry: ask, qty: qty, cost: cost, orderFee: fee, spx: Math.round(spx2 * 10000) / 10000,
          basis: istBasis || undefined, krypto: istKrypto(sym) || undefined,
          strike: w.strike, expiry: w.expiry, iv: Math.round(iv * 1000) / 1000, ratio: bvI,
          // Basis-Vola und Termin: daraus wird bei JEDER Bewertung neu gerechnet
          ivBasis: Math.round(ivBasis * 1000) / 1000,
          terminT: nTermin || undefined,
          /* Vega je Vola-Punkt und Stueck - die Zahl, die im Bericht als fehlend
           * benannt war. Sie sagt, wie viel ein Vola-Punkt diese Position wert ist. */
          vega: Math.round(Q.bsVega(spot, w.strike, Math.max(0, (w.expiry - now) / (365 * 86400000)), iv) * bvI * 10000) / 10000,
          omega: Math.round(omega * 10) / 10,
          sl: slT, tp: kapiTrade ? null : mp.tp, trail: kapiTrade ? 0 : (mp.trail || 0),
          // Kapitulations-Trades tragen ihren gemessenen 26-Handelsstunden-Horizont
          maxHoldMin: kapiTrade ? 1560 : (mp.maxHoldMin || 0),
          exitMode: kapiTrade ? 'zeit' : mp.exitMode, uebernacht: kapiTrade ? true : !!mp.uebernacht, peak: ask, chN: chN || 0, chan: chRef,
          sources: { intraday: dir === 'call' ? 1 : -1 },
          reason: (isOrb
              ? 'ORB: Ausbruch aus der Eröffnungs-Range (' + U.nf2.format(orbInfo.lo) + '–' + U.nf2.format(orbInfo.hi) + ', 30 Min) nach ' + (dir === 'call' ? 'OBEN' : 'UNTEN') + ' bei ' + U.nf2.format(spot) + '. '
              : isWave
              ? 'Wellenreiter: Tal erkannt (z ' + revZ + ', ' + barMin + '-Min) bei ' + U.nf2.format(spot) + ' · Wellen-Score ' + waveQ.score + '/100 (Rhythmus ' + waveQ.parts.rhythmus + ' · Amplitude ' + waveQ.parts.amplitude + ' · Tiefe ' + waveQ.parts.tiefe + ' · Umkehr ' + waveQ.parts.umkehr + ' · Volumen ' + waveQ.parts.volumen + ')' + (chE ? ' · Kanal (' + chN + ' Bars): Position ' + Math.round(chE.pos * 100) + ' %, Steigung ' + chE.steigung + ', Breite ' + chE.breitePct + ' %' : '') + '. '
              : isRsi2
              ? 'RSI(2)-Extrem (Connors): 2-Perioden-RSI bei ' + revZ + ' im ' + (dir === 'call' ? 'Aufwärts' : 'Abwärts') + 'trend (' + barMin + '-Min) bei ' + U.nf2.format(spot) + ' – kurzfristige Übertreibung gegen den Trend. '
              : isDon
              ? 'Donchian-Ausbruch: Schluss ' + (dir === 'call' ? 'über dem ' + cfg.period + '-Bar-Hoch' : 'unter dem ' + cfg.period + '-Bar-Tief') + ' (' + barMin + '-Min) bei ' + U.nf2.format(spot) + '. '
              : isSq
              ? 'Bollinger-Squeeze: Ausbruch nach ' + (dir === 'call' ? 'OBEN' : 'UNTEN') + ' aus einer Kompressionsphase (Enge ' + revZ + ', ' + barMin + '-Min) bei ' + U.nf2.format(spot) + '. '
              : isPull
              ? 'Trend-Rücksetzer: Kurs kommt im laufenden Trend an die ' + (cfg.lineType === 'vwap' ? 'VWAP' : 'EMA' + cfg.period) + ' zurück und dreht wieder (' + barMin + '-Min) bei ' + U.nf2.format(spot) + '. '
              : isRev
              ? 'Rücksetzer: Kurs überdehnt ' + (dir === 'call' ? 'UNTER' : 'ÜBER') + ' der ' + (cfg.lineType === 'vwap' ? 'VWAP' : 'EMA' + cfg.period) + ' (z-Score ' + revZ + ', ' + barMin + '-Min-Chart) bei ' + U.nf2.format(spot) + '. '
              : (isWaves ? 'Wellen-Scalp: ' : 'Intraday: ') + 'Kurs kreuzt ' + (cfg.lineType === 'vwap' ? 'VWAP' : 'EMA' + cfg.period) + ' (' + barMin + '-Min-Chart) nach ' + (dir === 'call' ? 'OBEN' : 'UNTEN') + ' bei ' + U.nf2.format(spot) + ' (Abstand ' + (sig.distBps / 100).toFixed(2) + ' %). ') +
            (istBasis
              ? 'Instrument: Basiswert 1× (' + (istKrypto(sym) ? 'Krypto, Taker ' : 'Aktie, Spanne ') + (spx2 * 10000).toFixed(0) + ' Bp je Seite, kein Zeitwertverfall), '
              : 'Schein: ' + prof.name + ', Hebel ~' + omega.toFixed(1) + 'x, Aufgeld ' + aufgeld.toFixed(1) + ' %, ') +
            'Tagesumsatz ~' + Math.round(fd.dollarVolDay / 1e6) + ' Mio $ · Kosten-Check: Bewegung ' + ec.havePct + ' % vs. nötig ' + ec.needPct + ' %',
          scenario: isOrb
            ? 'Szenario: Ausbruch aus der Eröffnungs-Range läuft in Ausbruchsrichtung weiter (max. 1 Trade je Richtung/Tag). Exit: Trailing-Stop −15 % vom Hoch, Not-SL, Glattstellung zum Tagesschluss.'
            : isWave
            ? (chE
              ? 'Szenario: Welle von der Kanalunterkante bis zur Oberkante reiten (Regressionskanal, ' + chN + ' Bars). Exit: Gegenkante erreicht (Ziel), Kanalbruch (Schutz), Wellenkamm-Überdehnung, Not-SL, max. Haltedauer, Glattstellung zum Tagesschluss. Nur in Kanalrichtung (Steigungs-Regime).'
              : 'Szenario: Welle vom Tal bis zum Kamm reiten. Exit: Überdehnung auf der Gegenseite (Wellenkamm), Not-SL, max. Haltedauer, Glattstellung zum Tagesschluss. Nur in Trendrichtung (EMA100).')
            : isRsi2
            ? 'Szenario: Rückkehr nach der kurzfristigen Übertreibung (Connors RSI-2). Exit: Rückkehr zur Leitlinie, Not-SL, max. Haltedauer, Glattstellung zum Tagesschluss.'
            : (isDon || isSq)
            ? 'Szenario: Ausbruch läuft weiter. Exit: Trailing-Stop vom Hoch, Gegen-Durchbruch, Not-SL, Glattstellung zum Tagesschluss.'
            : isPull
            ? 'Szenario: Der Trend nimmt nach dem Rücksetzer wieder Fahrt auf. Exit: Trailing-Stop vom Hoch, Gegen-Durchbruch der Leitlinie, Not-SL, max. Haltedauer, Glattstellung zum Tagesschluss.'
            : isRev
            ? 'Szenario: Rückkehr zur Leitlinie (Mean-Reversion). Exit: Linien-Berührung (Ziel), Not-SL, max. Haltedauer, Glattstellung zum Tagesschluss.'
            : isWaves
              ? 'Szenario: eine Welle mitnehmen. Exit: Rückkreuzung der Leitlinie (Wellen-Ende), Trailing-Stop vom Hoch, max. Haltedauer, Not-SL, Glattstellung zum Tagesschluss.'
              : 'Szenario: kurzfristige ' + (dir === 'call' ? 'Aufwärts' : 'Abwärts') + 'bewegung nach Durchbruch. Exit-Regeln: Stop-Loss −25 % / Take-Profit +35 %, Gegen-Durchbruch, Glattstellung zum Tagesschluss.',
          status: 'open'
        };
        if (isOrb && D.orb) D.orb.traded[sym + '|' + dir] = true;   // Tageschance erst jetzt verbraucht
        D.positions.push(trade);
        D.trades.unshift(trade);
        if (D.trades.length > 1000) D.trades = D.trades.filter(function (tt, i2) { return i2 < 1000 || tt.status !== 'closed'; }); // Store schlank halten, Offenes nie verwerfen
        spanneStempeln(trade, 'open');
        notifyTrade(trade, 'open');
        // Spiegelung auf dem Capital.com-Demo-Konto (CFD-Paper-Trade mit Stop-Loss)
        if (window.CapAPI && window.CapAPI.enabled()) {
          (function (tr, spotNow) {
            var slLvl, tpLvl;
            if (tr.basis) {
              /* Basis-Trades sind LINEAR - die Schein-Inversion (underlyingAtTarget)
               * bekam hier tr.entry~Spot statt eines Scheinpreises und lief an ihre
               * Obergrenze (SL-Level ~1,6x Spot ueber dem Markt, Order unsinnig). */
              slLvl = tr.dir === 'call' ? spotNow * (1 + tr.sl) : spotNow * (1 - tr.sl);
              tpLvl = tr.tp != null ? (tr.dir === 'call' ? spotNow * (1 + tr.tp) : spotNow * (1 - tr.tp)) : null;
            } else {
              var wRef = { strike: tr.strike, expiry: tr.expiry, iv: tr.iv, ratio: tr.ratio || Q.RATIO };
              slLvl = Q.underlyingAtTarget(tr.dir, wRef, tr.entry * (1 + tr.sl), Date.now(), spotNow);
              tpLvl = tr.tp != null ? Q.underlyingAtTarget(tr.dir, wRef, tr.entry * (1 + tr.tp), Date.now(), spotNow) : null;
            }
            var sizeC = Math.max(0.1, Math.round((equityNow() * cfg.budgetPct * 5 / spotNow) * 10) / 10);
            window.CapAPI.openPosition(tr.sym, tr.dir, sizeC, slLvl, tpLvl).then(function (r) {
              if (r.ok) { HEALTH.capOk++; } else { HEALTH.capFail++; capFehlerNeu(tr.sym, r); }
              /* HALBER ERFOLG, bis zum 25.08.2026 als ganzer gezaehlt. capital.js meldet
               * ok:true auch dann, wenn der POST durchging, die Bestaetigung
               * (GET /confirms) aber nicht - dealId ist dann null. Die CFD-Position IST
               * beim Broker eroeffnet, aber closeTrade schliesst nur bei vorhandener
               * capDealId: sie bleibt offen und unbeaufsichtigt, nur mit ihrem Stop,
               * waehrend die Simulation sie laengst geschlossen hat. Dieser Fall wurde
               * nicht bloss verschwiegen - er ging als capitalOk in den Export. */
              if (r.ok && !r.dealId) {
                HEALTH.capOhneDealId = (HEALTH.capOhneDealId || 0) + 1;
                capFehlerNeu(tr.sym, { msg: 'Order abgesetzt, aber ohne Bestaetigung - die Demo-Position ' +
                  'kann NICHT automatisch geschlossen werden und muss von Hand geprueft werden' });
              }
              if (r.ok) {
                tr.capDealId = r.dealId;
                tr.reason += ' · Demo-Konto: ' + (tr.dir === 'call' ? 'BUY' : 'SELL') + ' ' + sizeC + '× ' + (r.epic || tr.sym) + ' (SL ' + U.nf2.format(slLvl) + ')';
                /* Der Zaehler steht in der Diagnose, dieser Satz steht dort, wo jemand
                 * wirklich hinsieht: in der Begruendung des Trades. */
                if (!r.dealId) tr.reason += ' · ACHTUNG: ohne Bestätigung eröffnet – bitte bei Capital.com von Hand schließen';
                /* KOSTENMESSUNG (22.08.2026): echter Ausfuehrungskurs gegen den Kurs,
                 * mit dem die Simulation gerechnet hat. Das ist die einzige Stelle im
                 * Projekt mit ECHTEN Ausfuehrungen - alle Studien rechnen sonst mit
                 * der ANNAHME 0,10 % je Runde. Positiver Schlupf = teurer als gedacht. */
                if (r.fill != null && spotNow > 0) {
                  tr.capFillOpen = r.fill;
                  tr.capSlipOpen = (tr.dir === 'call' ? (r.fill / spotNow - 1) : (spotNow / r.fill - 1));
                }
              }
              else { tr.reason += ' · Demo-Order fehlgeschlagen: ' + (r.msg || '?'); }
              save(); render();
            });
          })(trade, spot);
        }
        SIG[sym] = { t: now, spot: spot, ok: true, grund: 'Trade eröffnet (' + (dir === 'call' ? 'CALL' : 'PUT') + ')', score: waveQ ? waveQ.score : null, z: revZ, chanPos: chE ? chE.pos : null, chanSteep: chE ? chE.steigung : null };
        sigLog(sym, 'Trade eröffnet (' + (dir === 'call' ? 'CALL' : 'PUT') + ')', now);
        D.intradayCooldown[sym] = now;
        D.intradayCount++;
      }
      D.intradayLastScan = now;
      updateSymBlocks();
      renderSigMonitor();
      renderSymBlocks();
      await save();
      st.textContent = 'Letzter Scan: ' + new Date(now).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr · Trades heute: ' + D.intradayCount + '/' + (modeParams().maxPerDay || cfg.maxPerDay);
      cockpitRender(); // Scan-Zeit im Kopf-Cockpit sofort nachziehen (kein eigener Timer)
    } catch (e) {
      HEALTH.scanErrors++;
      HEALTH.lastError = { t: Date.now(), msg: String(e.message || e).slice(0, 200) };
      st.textContent = 'Scan-Fehler: ' + (e.message || e);
    } finally {
      intradayScanning = false;
      render();
    }
  }

  /* ================= Rendering ================= */
  function render() {
    renderKlartext();
    if (!D) return;
    var now = Date.now();
    var eq = equityNow();
    var invested = eq - D.cash;
    var pnlTotal = eq - START_CAPITAL;
    var closed = D.trades.filter(function (t) { return t.status === 'closed' && istMess(t); });
    var wins = closed.filter(function (t) { return t.pnl > 0; }).length;
    var messPnl = Math.round(closed.reduce(function (a, t) { return a + t.pnl; }, 0) * 100) / 100;

    var dayDelta = D.dayStartEq > 0 ? (eq / D.dayStartEq - 1) * 100 : 0;
    document.getElementById('depotStats').innerHTML =
      tile('Depotwert', U.money(eq), null, U.signTxt(pnlTotal / START_CAPITAL * 100, ' %') + ' seit Start', pnlTotal) +
      tile('Cash', U.money(D.cash), null) +
      tile('In Scheinen', U.money(invested), null, eq > 0 ? Math.round(invested / eq * 100) + ' % vom Depot' : null, 0) +
      tile('Gesamt-P/L', U.signTxt(pnlTotal, ' $'), pnlTotal, 'heute ' + U.signTxt(dayDelta, ' %'), dayDelta) +
      tile('P/L der Messung', U.signTxt(messPnl, ' $'), messPnl, closed.length + ' Trades seit ' + (D.messStart ? U.dt(D.messStart) : 'Start'), messPnl) +
      tile('Trades (Trefferquote)', closed.length + (closed.length ? ' (' + Math.round(wins / closed.length * 100) + ' %)' : ''), null);
    var mn = document.getElementById('messNote');
    if (mn) {
      var altN = D.trades.filter(function (t) { return t.legacy; }).length;
      mn.innerHTML = altN
        ? 'Messschnitt am ' + U.dt(D.messStart) + ': <b>' + altN + ' ältere Trades</b> bleiben im Protokoll, zählen aber in Statistik, Wirkungs-Ranking und Auswertung nicht mehr mit – sie stammen aus der Zeit des Buchungsfehlers und würden jede Messung verfälschen.'
        : '';
    }

    // Depotverlauf fortschreiben (max. 1 Punkt / 10 Min) und zeichnen
    if (now - lastEqPoint > 10 * 60000) {
      lastEqPoint = now;
      if (!D.equityHist) D.equityHist = [];
      D.equityHist.push([now, Math.round(eq * 100) / 100]);
      if (D.equityHist.length > 2000) D.equityHist = D.equityHist.slice(-1500);
      save();
    }
    var eqSvg = document.getElementById('equityChart');
    if (eqSvg) {
      if (D.equityHist && D.equityHist.length >= 2) drawEquity(eqSvg, D.equityHist, START_CAPITAL);
      else eqSvg.innerHTML = '<text x="16" y="40" fill="var(--muted)" font-size="12">Die Kurve entsteht, sobald das Depot eine Weile läuft (1 Punkt alle 10 Minuten).</text>';
    }

    // Status-Badges der Strategie-Karten
    renderStatusBadges();
    edgePauseAnzeigen();


    // Kalender-Warnung (marktbewegende Termine in <24 h)
    var cw = document.getElementById('calWarn');
    if (cw && window.Cal) {
      var evs = window.Cal.within24h();
      cw.innerHTML = evs.length
        ? '<div class="simnote" style="color:var(--down); font-weight:600;">' + evs.map(function (e) {
            return e.name + ' (' + e.dt.toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr)';
          }).join(' · ') + ' – erhöhte Schwankungen möglich.</div>'
        : '';
    }

    // Risiko-Status
    var rs = document.getElementById('riskStatus'), rb = document.getElementById('riskState');
    if (rs && rb) {
      ensureDay(eq);
      var dayPct = D.dayStartEq ? (eq / D.dayStartEq - 1) * 100 : 0;
      var expo = eq > 0 ? (eq - D.cash) / eq * 100 : 0;
      var co = canOpen(eq);
      rs.textContent = 'Heute: ' + U.signTxt(dayPct, ' %') + ' · In Scheinen: ' + Math.round(expo) + ' % · Positionen: ' + D.positions.length + '/' + ((D.risk && D.risk.maxPos) || 8) + (co.ok ? '' : ' · ' + co.why);
      rb.textContent = co.ok ? 'ok' : 'Stopp';
      rb.className = 'state ' + (co.ok ? 'on' : 'off');
    }

  /** Welche Regel hat DIESE Position eroeffnet? Intraday-Trades merken sich das im
   *  Feld modus. Fehlt es (Altbestand, Stunden-Strategie), wird die aktuell
   *  eingestellte Regel gezeigt - und die Zeile sagt dann auch, dass sie geraten ist. */
  function posModus(pos) {
    var m = pos && pos.modus;
    if (m === 'rsi2seit' || m === 'kapitulation') return { mode: m, sicher: true };
    var akt = D.intraday && D.intraday.mode;
    return { mode: akt === 'kapitulation' ? 'kapitulation' : 'rsi2seit', sicher: false };
  }
  var POS_MODUS_NAME = { rsi2seit: 'RSI(2) im Seitwärtskanal', kapitulation: 'Kapitulations-Dip im Abwärtskanal' };

  /** Position auf- oder zuklappen (Felix, Issue #68). Gezeichnet wird mit derselben
   *  Rechnung wie der grosse Strategie-Chart; der eigene Einstieg wird markiert,
   *  wenn er im gezeigten Ausschnitt liegt. */
  async function posDetailUmschalten(id) {
    var pos = null;
    for (var pi = 0; pi < D.positions.length; pi++) if (D.positions[pi].id === id) pos = D.positions[pi];
    var zeile = document.querySelector('[data-poszeile="' + id + '"]');
    var knopf = document.querySelector('[data-posauf="' + id + '"]');
    if (!pos || !zeile) return;
    var da = document.querySelector('[data-posdetail="' + id + '"]');
    if (da) {
      da.parentNode.removeChild(da);
      if (knopf) { knopf.innerHTML = '&#9656;'; knopf.setAttribute('aria-expanded', 'false'); }
      return;
    }
    if (knopf) { knopf.innerHTML = '&#9662;'; knopf.setAttribute('aria-expanded', 'true'); }
    var spalten = zeile.children.length;
    var tr = document.createElement('tr');
    tr.setAttribute('data-posdetail', String(id));
    tr.innerHTML = '<td colspan="' + spalten + '" style="padding:10px 12px; background:var(--surface-2);">' +
      '<div data-posdetstatus="' + id + '" style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:6px;">Lade Kerzen für ' + U.esc(pos.sym) + ' …</div>' +
      '<svg data-posdetchart="' + id + '" style="width:100%; height:190px; display:block;"></svg>' +
      '<div data-posdetsig="' + id + '" style="font-size:var(--fs-neben); color:var(--ink-2); margin-top:6px;"></div>' +
      '</td>';
    zeile.parentNode.insertBefore(tr, zeile.nextSibling);
    var mw = posModus(pos);
    var r;
    try { r = await stcRechnen(pos.sym, mw.mode, '60m', 320); }
    catch (e) { r = { ok: false, grund: 'Die Kerzen ließen sich nicht laden: ' + (e.message || e) }; }
    /* In der Zwischenzeit koennte zugeklappt oder neu gezeichnet worden sein. */
    var st = document.querySelector('[data-posdetstatus="' + id + '"]');
    var svg = document.querySelector('[data-posdetchart="' + id + '"]');
    if (!st || !svg) return;
    if (!r.ok) { st.textContent = r.grund; return; }
    /* Den eigenen Einstieg suchen - nur markieren, wenn er wirklich im Bild liegt.
     * Sonst zeigte die Markierung auf die naechstbeste Kerze und behauptete etwas Falsches. */
    var hl = null, beste = null;
    if (pos.openT) {
      for (var i = 0; i < r.S.show.length; i++) {
        var ab = Math.abs(r.S.show[i][0] - pos.openT);
        if (beste === null || ab < beste.ab) beste = { i: i, ab: ab };
      }
      if (beste && beste.ab <= STC_IV['60m'].min * 60000) hl = beste.i;
    }
    drawStrategieChart(svg, r.S.show, r.S.e20, r.S.e100,
      stcKanalListe(r.S, null, false), r.S.marksShow, hl, r.S.band);
    st.innerHTML = '<b>' + U.esc(POS_MODUS_NAME[mw.mode] || mw.mode) + '</b> auf ' + U.esc(pos.sym) +
      ' · ' + r.S.show.length + ' 60-Minuten-Kerzen im Bild' +
      (mw.sicher ? '' : ' · <span style="color:var(--series2);">Diese Position hat keine Regel hinterlegt – gezeigt wird die aktuell eingestellte</span>') +
      (hl !== null ? ' · dein Einstieg ist markiert' : ' · dein Einstieg liegt außerhalb des Ausschnitts');
    var sg = document.querySelector('[data-posdetsig="' + id + '"]');
    if (sg) {
      var letzte = r.S.marksShow.slice(-8);
      sg.innerHTML = letzte.length
        ? 'Einstiege, die die Regel im Bild gegeben hätte (' + r.S.marksShow.length + '): ' + letzte.map(function (m) {
            var wann = new Date(r.S.show[m][0]).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            return '<span style="white-space:nowrap;' + (m === hl ? ' font-weight:700; color:var(--series);' : '') + '">' + U.esc(wann) + '</span>';
          }).join(' · ')
        : 'Im gezeigten Ausschnitt hat die Regel kein Signal gegeben.';
    }
  }

    function tile(name, val, sign, delta, deltaSign) {
      return '<div class="tile"><div class="name">' + name + '</div><div class="val' + (sign != null ? ' ' + U.signCls(sign) : '') + '" style="font-size:var(--fs-zahl);">' + val + '</div>' +
        (delta ? '<div class="delta ' + (deltaSign ? U.signCls(deltaSign) : '') + '">' + delta + '</div>' : '') + '</div>';
    }

    // Positionen
    var ph = '';
    if (D.positions.length) {
      /* Einsatz, aktueller Wert und P/L in Dollar (Felix, Issue #34): Stueckzahl und
       * Prozente allein ergeben keine Gewinninformation - erst "was habe ich bezahlt,
       * was ist es jetzt wert" macht die Zeile lesbar. Zusaetzlich: Basiswert-
       * Positionen bekommen keine Schein-Kennzahlen mehr vorgerechnet (Basispreis/
       * Faellig/IV eines Pseudo-Scheins, den niemand haelt). */
      var sumEinsatz = 0, sumWert = 0;
      ph = '<table class="tbl"><tr><th>Wert</th><th>Typ</th><th>Basispreis</th><th>Fällig</th><th title="Implizite Volatilität – jetzt, mit Smile und Termin-Struktur">IV</th><th title="Wertänderung der Position je Volatilitätspunkt, bei unverändertem Kurs">Vega</th><th>Hebel</th><th>Stück</th><th>Einstieg</th><th>Aktuell</th><th title="Kaufsumme inklusive Ordergebühr">Einsatz</th><th title="Stück × aktueller Verkaufskurs">Wert jetzt</th><th title="Wert jetzt minus Einsatz – vor der Ordergebühr des Verkaufs">P/L</th><th></th></tr>';
      D.positions.forEach(function (p) {
        var spot = spotOf(p.sym) || p.entrySpot;
        /* Die Vola JETZT, nicht die vom Oeffnen. Sonst zeigt die Spalte einen anderen
         * Wert als den, mit dem die Zeile daneben gerechnet ist - und die Kopfzeile
         * verspricht ausdruecklich den aktuellen Stand. Hebel und Aufgeld haengen
         * ebenfalls daran und wuerden sonst zur eingefrorenen Vola passen. */
        var ivAnz = ivDerPosition(p, spot, now);
        var wobj = { strike: p.strike, expiry: p.expiry, iv: ivAnz, ratio: p.ratio || Q.RATIO };
        var bid = bidOf(p, spot, now);
        var einsatz = p.cost != null ? p.cost : p.entry * p.qty;
        var wertJetzt = bid * p.qty;
        var plUsd = wertJetzt - einsatz;
        sumEinsatz += einsatz; sumWert += wertJetzt;
        var ret = bid / p.entry - 1;
        var scheinZellen = p.basis
          ? '<td>–</td><td>–</td><td>–</td><td title="Eine Aktie hat kein Vega – ihr Wert hängt nicht an der Volatilität">–</td><td title="Aktie ohne Hebel">1×</td>'
          : '<td>' + U.nf2.format(p.strike) + '</td>' +
            '<td>' + U.d(p.expiry) + '</td>' +
            '<td title="Beim Öffnen: ' + Math.round(p.iv * 100) + ' %">' + Math.round(ivAnz * 100) + ' %' +
              (Math.abs(ivAnz - p.iv) > 0.005 ? '<span style="color:var(--muted);"> (' + (ivAnz > p.iv ? '+' : '') + Math.round((ivAnz - p.iv) * 100) + ')</span>' : '') + '</td>' +
            /* Vega: was ein Vola-Punkt diese Position wert ist. Stand nirgends - und
             * genau daran haengt der groesste Teil der Bewegung um einen Termin. */
            '<td title="Wertänderung je Volatilitätspunkt – bei unverändertem Kurs">' +
              (p.vega > 0 ? U.nf2.format(p.vega * p.qty) + ' $' : '–') + '</td>' +
            '<td title="Aufgeld aktuell: ' + Q.warrantAufgeld(p.dir, wobj, spot, now).toFixed(1) + ' %">' + Q.warrantOmega(p.dir, wobj, spot, now).toFixed(1) + 'x</td>';
        /* Das Kuerzel ist ein echter Knopf, keine unterstrichene Schrift: so kommt man
         * auch mit der Tastatur hin. Der Pfeil daneben klappt Chart und Signale auf. */
        ph += '<tr data-poszeile="' + p.id + '"><td style="white-space:nowrap;">' +
          '<button type="button" data-posauf="' + p.id + '" aria-expanded="false" ' +
            'title="Chart und Signale zu dieser Position ein- und ausblenden" ' +
            'aria-label="Chart und Signale zu ' + U.esc(p.sym) + ' ein- und ausblenden" ' +
            'style="background:none; border:0; padding:0 4px 0 0; font:inherit; color:var(--muted); cursor:pointer;">&#9656;</button>' +
          '<button type="button" data-explsym="' + U.esc(p.sym) + '" title="' + U.esc(p.sym) + ' im Aktien-Explorer öffnen" ' +
            'style="background:none; border:0; padding:0; font:inherit; font-weight:700; color:var(--series); cursor:pointer; text-decoration:underline dotted;">' +
            U.esc(p.sym) + '</button>' +
          (p.strategy === 'intraday' ? ' <span title="Intraday-Strategie"></span>' : '') + '</td>' +
          '<td><span class="badge ' + p.dir + '">' + (p.dir === 'call' ? 'CALL' : 'PUT') + '</span></td>' +
          scheinZellen +
          '<td>' + p.qty + '</td>' +
          '<td>' + U.nf2.format(p.entry) + ' $</td>' +
          '<td>' + U.nf2.format(bid) + ' $</td>' +
          '<td>' + U.nf2.format(einsatz) + ' $</td>' +
          '<td>' + U.nf2.format(wertJetzt) + ' $</td>' +
          '<td class="' + U.signCls(plUsd) + '" style="white-space:nowrap;">' + U.signTxt(Math.round(plUsd * 100) / 100, ' $') +
            ' <span style="color:var(--muted); font-weight:400;">(' + U.signTxt(Math.round(ret * 1000) / 10, ' %') + ')</span></td>' +
          '<td style="white-space:nowrap;"><button class="btn ghost" style="padding:2px 8px; font-size:var(--fs-klein);" data-ticket="' + p.id + '" title="Order-Daten zum Nachbilden">Nachbilden</button> ' +
          '<button class="btn ghost" style="padding:2px 8px; font-size:var(--fs-klein);" data-closepos="' + p.id + '">Schließen</button></td></tr>';
      });
      var sumPl = sumWert - sumEinsatz;
      ph += '<tr><td colspan="10" style="text-align:right; color:var(--muted); font-weight:600;">Summe</td>' +
        '<td style="font-weight:600;">' + U.nf2.format(sumEinsatz) + ' $</td>' +
        '<td style="font-weight:600;">' + U.nf2.format(sumWert) + ' $</td>' +
        '<td class="' + U.signCls(sumPl) + '" style="white-space:nowrap;">' + U.signTxt(Math.round(sumPl * 100) / 100, ' $') + '</td><td></td></tr>';
      ph += '</table><div style="color:var(--muted); font-size:var(--fs-klein); margin-top:6px;">' +
        'Belegte Intraday-Kanten: nur Not-Stop, Ausstieg über die Zeit (8 bzw. 26 Handelsstunden), Übernacht erlaubt. ' +
        'Widerlegte Setups: Stop −25 % / Ziel +35 %, Glattstellung zum Tagesschluss. ' +
        'Altbestand der Stunden-Strategie: Stop −40 % / Ziel +80 %, Zeit-Ausstieg 10 Tage vor Fälligkeit. ' +
        'Bei Scheinen: Bezugsverhältnis 0,1 · Spanne 2 % · Ordergebühr je Kauf und Verkauf simuliert; Hebel = Omega ' +
        '(Maus über den Wert zeigt das aktuelle Aufgeld).</div>';
    } else {
      ph = '<div class="empty"><span class="ico"></span>Keine offenen Positionen. ' +
        (D.intraday && D.intraday.enabled
          ? 'Die Intraday-Strategie läuft und wartet auf ein Signal – wann sie zuletzt nichts getan hat und warum, steht unter „Regeln → Autopilot“.'
          : 'Die Intraday-Strategie ist aus – einschalten unter „Regeln → Schalter &amp; Einstellungen“.') + '</div>';
    }
    if (D.repairNote && Date.now() - D.repairNote.at < 7 * 86400000) {
      var rn = D.repairNote;
      ph = '<div style="border:1px solid var(--border); border-left:3px solid var(--series2); border-radius:var(--r-gross); padding:8px 12px; margin-bottom:10px; font-size:var(--fs-text);">' +
        '<b>Buchhaltung repariert</b> (' + U.dt(rn.at) + '): ' +
        (rn.adopted ? rn.adopted + ' verwaiste Position(en) zurückgeholt – sie werden ab sofort wieder normal überwacht und nach den Exit-Regeln geschlossen. ' : '') +
        (rn.written ? rn.written + ' unvollständige(r) Datensatz/Datensätze abgeschrieben. ' : '') +
        '<span style="color:var(--muted);">Ursache: Trades standen im Protokoll als „offen", lagen aber in keiner Position mehr (Absturz, Doppelstart oder Versionswechsel).</span></div>' + ph;
    }
    document.getElementById('positionsPanel').innerHTML = ph;
    document.querySelectorAll('[data-explsym]').forEach(function (b) {
      b.addEventListener('click', function () {
        var sym = b.getAttribute('data-explsym');
        if (window.Explorer && window.Explorer.oeffne) window.Explorer.oeffne(sym, sym);
      });
    });
    document.querySelectorAll('[data-posauf]').forEach(function (b) {
      b.addEventListener('click', function () { posDetailUmschalten(parseInt(b.getAttribute('data-posauf'), 10)); });
    });
    document.querySelectorAll('[data-ticket]').forEach(function (b) {
      b.addEventListener('click', function () { openTicket(parseInt(b.getAttribute('data-ticket'), 10)); });
    });
    document.querySelectorAll('[data-closepos]').forEach(function (b) {
      b.addEventListener('click', function () {
        var id = parseInt(b.getAttribute('data-closepos'), 10);
        var pos = D.positions.filter(function (p) { return p.id === id; })[0];
        if (pos) { b.disabled = true; closeNow(pos); }
      });
    });

    // Trefferquoten
    var hr = '';
    var srcRows = [
      // Kein Gewichts-Ausweis mehr: die Regler sind weg, weil keine der drei Quellen
      // einen belegten Vorsprung hat. Eine Prozentzahl ohne Regler wuerde nur raetseln lassen.
      { k: 'news', n: 'News-Sentiment', weighted: false },
      { k: 'tech', n: 'Technik', weighted: false },
      { k: 'elliott', n: 'Elliott-Wellen', weighted: false },
      { k: 'maIntraday', n: 'Intraday-MA (eigene Strategie)', weighted: false },
      { k: 'ki', n: 'KI-Prüfung (von der KI bestätigte Trades)', weighted: false }
    ];
    srcRows.forEach(function (row) {
      var s = D.stats[row.k] || { r: 0, w: 0 }, tot = s.r + s.w;
      var pct = tot ? Math.round(s.r / tot * 100) : null;
      var wTxt = row.weighted ? ' <span style="color:var(--muted)">(Gewicht ' + Math.round(normWeights()[row.k] * 100) + ' %)</span>' : '';
      hr += '<div style="margin-bottom:8px;"><div style="display:flex; justify-content:space-between; font-size:var(--fs-neben);">' +
        '<span>' + row.n + wTxt + '</span>' +
        '<span>' + (pct === null ? 'noch keine Daten' : pct + ' % richtig (' + s.r + '/' + tot + ')') + '</span></div>' +
        '<div class="hitbar"><span style="width:' + (pct === null ? 0 : pct) + '%"></span></div></div>';
    });
    document.getElementById('hitrates').innerHTML = hr;

    // Trade-Log (mit Filter)
    var tl = '';
    var filtered = D.trades.filter(function (t) {
      if (logFilter === 'hourly') return t.strategy !== 'intraday';
      if (logFilter === 'intraday') return t.strategy === 'intraday';
      if (logFilter === 'open') return t.status === 'open';
      if (logFilter === 'replicated') return !!t.replicated;
      return true;
    });
    filtered.slice(0, 40).forEach(function (t) {
      var plBadge = t.status === 'closed'
        ? '<span class="tpl ' + U.signCls(t.pnl) + '">' + U.signTxt(t.pnl, ' $') + '</span>'
        : '<span class="tpl" style="color:var(--ink-2); background:var(--series-soft);">offen</span>';
      tl += '<div class="trade-entry">' +
        '<div class="thead">' +
          '<span class="twhen">' + U.dt(t.openT) + '</span>' +
          '<span class="tsym">' + U.esc(t.sym) + '</span>' +
          '<span class="badge ' + t.dir + '">' + (t.dir === 'call' ? 'CALL' : 'PUT') + '</span>' +
          (t.strategy === 'intraday' ? '<span class="badge src">Intraday</span>' : '<span class="badge src">Stunden</span>') +
          (t.replicated ? '<span class="badge src" title="Als real nachgebildet markiert">nachgebildet</span>' : '') +
          plBadge +
        '</div>' +
        '<div class="tmeta">' + t.qty + ' Stk · Basispreis ' + U.nf2.format(t.strike) + ' · fällig ' + U.d(t.expiry) +
          (t.status === 'closed' ? ' · <b>' + U.esc(t.why || '') + '</b> (' + U.dt(t.closeT) + ')' : '') + '</div>' +
        '<details><summary>Auslöser &amp; Szenario</summary>' +
          '<div class="why">' + U.esc(t.reason || '') + '</div>' +
          '<div class="why">' + U.esc(t.scenario || '') + '</div></details>' +
        '</div>';
    });
    document.getElementById('tradeLog').innerHTML = tl || '<div class="empty"><span class="ico"></span>' + (D.trades.length ? 'Keine Trades in diesem Filter.' : 'Noch keine Trades – sie erscheinen hier, sobald eine Strategie handelt.') + '</div>';
    // Filter-Pills mit Trefferzahl
    var counts = { all: D.trades.length, hourly: 0, intraday: 0, open: 0, replicated: 0 };
    D.trades.forEach(function (t) {
      if (t.strategy === 'intraday') counts.intraday++; else counts.hourly++;
      if (t.status === 'open') counts.open++;
      if (t.replicated) counts.replicated++;
    });
    document.querySelectorAll('#logFilter button').forEach(function (b) {
      var k = b.getAttribute('data-lf');
      if (!b.__baseTxt) b.__baseTxt = b.textContent.replace(/\s*\(\d+\)$/, '');
      b.textContent = b.__baseTxt + (counts[k] != null && k !== 'all' ? ' (' + counts[k] + ')' : (k === 'all' ? ' (' + counts.all + ')' : ''));
    });

    renderWeights();
    cockpitRender();
    renderEquity();
  }

  /** Prozent mit 1 Nachkommastelle (deutsches Komma); 0 als '±0,0 %'. */
  function pz1(v) {
    if (!isFinite(v)) return '–';
    var r = Math.round(v * 10) / 10;
    return (r > 0 ? '+' : r < 0 ? '-' : '±') + Math.abs(r).toFixed(1).replace('.', ',') + ' %';
  }

  /** Kopf-Cockpit füllen – reine Anzeige aus vorhandenem State, keine eigene Datenhaltung. */
  function cockpitRender() {
    if (!D) return;
    var ce = document.getElementById('ckEquity');
    if (ce) ce.textContent = U.nf2.format(equityNow()) + ' $';
    var cd = document.getElementById('ckDay');
    if (cd) {
      var tp = tagesPnl();
      if (tp.pnl) {
        cd.textContent = U.signTxt(tp.pnl, ' $') + ' (' + U.signTxt(tp.pct, ' %') + ')';
        cd.classList.toggle('up', tp.pnl > 0);
        cd.classList.toggle('down', tp.pnl < 0);
      } else {
        cd.textContent = '±0,00 $';
        cd.classList.remove('up');
        cd.classList.remove('down');
      }
    }
    var co = document.getElementById('ckOpen');
    if (co) co.textContent = D.positions.length + (D.positions.length === 1 ? ' Position' : ' Positionen');
    var cb = document.getElementById('ckBooks');
    if (cb) {
      var mv = D.mfVerlauf || [];
      var lp = mv.length ? mv[mv.length - 1] : null;
      /* Bezugswert aus dem Buch, nicht aus einer festen Zahl: hier stand 10000, waehrend
       * die Buecher mit 100000 laufen (mfdepot.js/START_KAPITAL) - ein unberuehrtes Buch
       * meldete dadurch +900,0 %. mfVerlauf schreibt startM/startD seit 8.24.2 mit; fuer
       * aeltere Punkte bleibt das Buch selbst die Quelle. */
      var stM = (lp && lp.startM) || (D.mfBuch && D.mfBuch.start) || null;
      var stD = (lp && lp.startD) || (D.driftBuch && D.driftBuch.start) || null;
      var mTxt = (!D.momentumAn || !lp || lp.momentum == null || !stM) ? '–' : pz1((lp.momentum / stM - 1) * 100);
      var dTxt = (!D.driftAn || !lp || lp.drift == null || !stD) ? '–' : pz1((lp.drift / stD - 1) * 100);
      cb.textContent = 'M ' + mTxt + ' · D ' + dTxt;
    }
    var cs = document.getElementById('ckScan');
    if (cs) cs.textContent = HEALTH.lastScanT
      ? new Date(HEALTH.lastScanT).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      : '–';
  }

  /** Ertragskurve über den Depot-Kacheln: Gesamtrendite, Hoch, max. Rücksetzer und eine
   *  schlichte Fläche im Stil der Dashboard-Sparklines. Erst ab 5 Punkten – vorher bleibt
   *  das Panel versteckt, eine 3-Punkte-Kurve sagt nichts. */
  function renderEquity() {
    var el = document.getElementById('eqPanel');
    if (!el || !D) return;
    var h = D.equityHist || [];
    if (h.length < 5) { el.style.display = 'none'; return; }
    el.style.display = 'block';

    // Kopfzahlen über die GESAMTE Historie, die Kurve nur über die letzten 800 Punkte
    var hoch = h[0][1], peak = h[0][1], dd = 0;
    h.forEach(function (p) {
      if (p[1] > peak) peak = p[1];
      if (p[1] > hoch) hoch = p[1];
      var r = peak > 0 ? p[1] / peak - 1 : 0;
      if (r < dd) dd = r;
    });
    var eqLast = h[h.length - 1][1];

    var pts = h.slice(-800);
    var x0 = pts[0][0], x1 = pts[pts.length - 1][0];
    if (x1 - x0 < 1) x1 = x0 + 1;
    var ys = pts.map(function (p) { return p[1]; });
    var minV = Math.min.apply(null, ys), maxV = Math.max.apply(null, ys);
    // Referenzlinie 10.000 gehört mit in den Wertebereich, sonst hinge sie außerhalb
    var lo = Math.min(minV, START_CAPITAL), hi = Math.max(maxV, START_CAPITAL);
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    var yPad = (hi - lo) * 0.08;
    lo -= yPad; hi += yPad;

    var W = Math.max(320, (el.clientWidth || 620) - 28), H = 120;
    function X(t) { return (t - x0) / (x1 - x0) * W; }
    function Y(v) { return (H - 4) - (v - lo) / (hi - lo) * (H - 8); }
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    var area = line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z';
    var yB = Y(START_CAPITAL).toFixed(1);

    el.innerHTML =
      '<div class="eq-kopf">' +
        '<span><span class="ckl">Verlauf</span><b>' + pz1((eqLast / START_CAPITAL - 1) * 100) + '</b></span>' +
        '<span><span class="ckl">Hoch</span><b>' + U.nf0.format(hoch) + ' $</b></span>' +
        '<span><span class="ckl">Max. Rücksetzer</span><b' + (dd < 0 ? ' class="down"' : '') + '>' + pz1(dd * 100) + '</b></span>' +
      '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
        '<path d="' + area + '" fill="var(--series-soft)" stroke="none"></path>' +
        '<line x1="0" x2="' + W + '" y1="' + yB + '" y2="' + yB + '" stroke="var(--baseline)" stroke-width="1" stroke-dasharray="4 3"></line>' +
        '<path d="' + line + '" fill="none" stroke="var(--series)" stroke-width="1.5"></path>' +
        '<text x="' + (W - 3) + '" y="' + Math.max(10, Y(maxV) - 4).toFixed(1) + '" text-anchor="end" fill="var(--muted)" font-size="10">' + U.nf0.format(maxV) + ' $</text>' +
        '<text x="' + (W - 3) + '" y="' + Math.min(H - 3, Y(minV) + 11).toFixed(1) + '" text-anchor="end" fill="var(--muted)" font-size="10">' + U.nf0.format(minV) + ' $</text>' +
      '</svg>';
  }

  function normWeights() {
    var w = D.weights, sum = w.news + w.tech + w.elliott;
    if (sum <= 0) return { news: 0.34, tech: 0.33, elliott: 0.33 };
    return { news: w.news / sum, tech: w.tech / sum, elliott: w.elliott / sum };
  }

  var weightsBuilt = false;
  function renderWeights() {
    var el = document.getElementById('weightsPanel');
    if (!el) return;   // Regler duerfen fehlen - die Gewichte leben in D, nicht im DOM
    if (!weightsBuilt) {
      var names = { news: 'News-Sentiment', tech: 'Technik', elliott: 'Elliott-Wellen' };
      var html = '';
      Object.keys(names).forEach(function (k) {
        html += '<div class="wrow"><label>' + names[k] + '</label>' +
          '<input type="range" min="0" max="100" step="5" data-w="' + k + '" style="flex:1">' +
          '<output data-wo="' + k + '"></output></div>';
      });
      el.innerHTML = html;
      el.querySelectorAll('input[data-w]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          D.weights[inp.getAttribute('data-w')] = parseInt(inp.value, 10) / 100;
          save();
          updateWeightOutputs();
        });
      });
      weightsBuilt = true;
    }
    el.querySelectorAll('input[data-w]').forEach(function (inp) {
      inp.value = Math.round(D.weights[inp.getAttribute('data-w')] * 100);
    });
    updateWeightOutputs();
  }
  function updateWeightOutputs() {
    var nw = normWeights();
    document.querySelectorAll('output[data-wo]').forEach(function (o) {
      o.textContent = Math.round(nw[o.getAttribute('data-wo')] * 100) + ' %';
    });
  }

  /* ================= Backtest-UI ================= */
  async function runBacktest() {
    var btn = document.getElementById('btRunBtn'), st = document.getElementById('btStatus');
    if (!btn || !st) return;
    btn.disabled = true;
    var mode = (document.getElementById('btMode') || {}).value || 'daily';
    /* Dieses Werkzeug rechnet fest die EMA-Kreuzung auf synthetischen Optionsscheinen -
     * beide Richtungen, Zwangsschluss am Abend. Für die belegten Kanten waere das
     * eine plausibel aussehende, aber systematisch falsche Zahl: falscher Einstieg,
     * falsches Instrument, falscher Ausstieg. Lieber gar keine Zahl als eine, die
     * wie eine Widerlegung der eigenen Strategie aussieht. */
    if ((mode === 'intraday' || mode === 'intradayCompare') &&
        (D.intraday.mode === 'rsi2seit' || D.intraday.mode === 'kapitulation')) {
      st.textContent = 'Für „RSI(2) im Seitwärtskanal“ und „Kapitulations-Dip“ ist dieser Backtest nicht gebaut – ' +
        'er rechnet die EMA-Kreuzung auf Optionsscheinen. Diese beiden Strategien misst der Autopilot nachts ' +
        'auf dem Kursarchiv (Bereich Autopilot).';
      btn.disabled = false;
      return;
    }
    var range = (document.getElementById('btRange') || {}).value || '1y';
    var syms = universe();
    var histMap = {};
    async function loadIntradayHist(interval, label) {
      var map = {}, doneL = 0;
      await pmap(syms, async function (sy) {
        var fd = await fetchIntraday(sy, interval, true);
        doneL++;
        st.textContent = 'Lade ' + label + '-Historie … (' + doneL + '/' + syms.length + ')';
        if (fd && fd.series.length > 200) {
          // Liquiditätsfilter auch im Backtest anwenden
          if (!D.intraday.minDollarVol || fd.dollarVolDay == null || fd.dollarVolDay >= D.intraday.minDollarVol * 1e6) map[sy] = fd.series;
        }
      }, 6);
      return map;
    }
    function intradayOpts() {
      var prof = Q.PROFILES[D.intraday.profile] || Q.PROFILES.atm21;
      var mp = modeParams();
      return {
        capital: START_CAPITAL,
        period: D.intraday.period, confirmBps: D.intraday.confirmBps,
        budgetPct: D.intraday.budgetPct, sl: mp.sl, tp: mp.tp,
        cooldownMin: mp.cooldownMin, maxPerDay: mp.maxPerDay,
        orderFee: D.intraday.orderFee, otmPct: prof.otmPct, expiryDays: prof.days, ratio: prof.ratio || Q.RATIO,
        exitMode: mp.exitMode, trailPct: mp.trail, maxHoldMin: mp.maxHoldMin,
        lineType: D.intraday.lineType || 'ema', trendFilter: !!D.intraday.trendFilter, window: D.intraday.window || 'all',
        entryMode: D.intraday.mode === 'wave' ? 'wave' : D.intraday.mode === 'reversion' ? 'reversion' : D.intraday.mode === 'orb' ? 'orb' : 'cross',
        zThr: zOf(D.intraday.confirmBps), minEdge: 1.5, minQuality: 60,
        channel: D.intraday.mode === 'wave' && D.intraday.channel !== false,
        mtf: D.intraday.mtf !== false && (D.intraday.interval || '5m') === '1m',
        riskPct: parseFloat(D.intraday.sizing) > 0 ? parseFloat(D.intraday.sizing) : 0,
        orbMin: 30
      };
    }

    if (mode === 'intraday') {
      try {
        var iv0 = D.intraday.interval || '5m';
        var map0 = await loadIntradayHist(iv0, iv0);
        st.textContent = 'Rechne (' + Object.keys(map0).length + ' Werte) …';
        await new Promise(function (r) { setTimeout(r, 30); });
        var resI = await btIntraday(map0, intradayOpts());
        if (resI.error) { st.textContent = resI.error; return; }
        st.textContent = '';
        var profN = (Q.PROFILES[D.intraday.profile] || Q.PROFILES.atm21).name;
        var modeN = D.intraday.mode === 'waves' ? 'Wellen-Scalping' : 'Ausbrüche';
        renderBtResult(resI, modeN + ' · EMA' + D.intraday.period + ' · ' + iv0 + ' · ' + profN +
          ' · Gebühr ' + U.nf2.format(D.intraday.orderFee) + ' $/Order · Ø Haltedauer ' + resI.summary.avgHoldMin + ' Min · Gebühren gesamt ' + U.nf2.format(resI.summary.feesTotal || 0) + ' $');
      } catch (eI) {
        st.textContent = 'Fehler: ' + (eI.message || eI);
      } finally {
        btn.disabled = false;
      }
      return;
    }

    if (mode === 'intradayCompare') {
      try {
        var rows = [];
        var IVS = ['5m', '15m', '60m'];
        for (var vi = 0; vi < IVS.length; vi++) {
          var mapC = await loadIntradayHist(IVS[vi], IVS[vi]);
          st.textContent = 'Rechne ' + IVS[vi] + ' …';
          await new Promise(function (r) { setTimeout(r, 30); });
          var resC = await btIntraday(mapC, intradayOpts());
          if (!resC.error) rows.push({ iv: IVS[vi], s: resC.summary, res: resC });
        }
        st.textContent = '';
        if (!rows.length) { st.textContent = 'Keine Daten für den Vergleich.'; return; }
        rows.sort(function (a, b) { return b.s.retPct - a.s.retPct; });
        var best = rows[0];
        var html = '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin-bottom:8px;">Gleiche Regeln, drei Zeitrahmen (EMA' + D.intraday.period + ', ' +
          (Q.PROFILES[D.intraday.profile] || Q.PROFILES.atm21).name + ', Gebühr ' + U.nf2.format(D.intraday.orderFee) + ' $/Order). Hinweis: 60-Min nutzt ~3 Monate, 5/15-Min ~1 Monat Historie.</div>';
        html += '<table class="tbl"><tr><th>Zeitrahmen</th><th>Rendite</th><th>Trades</th><th>Trefferquote</th><th>Ø Haltedauer</th><th>Gebühren</th><th>Max. Drawdown</th></tr>';
        rows.forEach(function (r0) {
          html += '<tr' + (r0 === best ? ' style="font-weight:600;"' : '') + '><td>' + r0.iv + (r0 === best ? ' ' : '') + '</td>' +
            '<td class="' + U.signCls(r0.s.retPct) + '">' + U.signTxt(r0.s.retPct, ' %') + '</td>' +
            '<td>' + r0.s.nTrades + '</td><td>' + r0.s.winRate + ' %</td><td>' + r0.s.avgHoldMin + ' Min</td>' +
            '<td>' + U.nf2.format(r0.s.feesTotal || 0) + ' $</td><td>−' + r0.s.maxDrawdownPct + ' %</td></tr>';
        });
        html += '</table><div style="font-size:var(--fs-neben); color:var(--muted); margin-top:8px;">Je kürzer der Zeitrahmen, desto mehr Signale – aber auch mehr Spread- und Gebührenkosten sowie mehr Fehlsignale (Whipsaws). Der beste Zeitrahmen kann sich mit der Marktphase ändern; Vergangenheit ist kein Indikator für die Zukunft.</div>';
        html += '<svg id="btChart" style="width:100%; height:180px; margin-top:10px;"></svg>';
        document.getElementById('btResult').innerHTML = html;
        drawEquity(document.getElementById('btChart'), best.res.equity, START_CAPITAL);
      } catch (eC) {
        st.textContent = 'Fehler: ' + (eC.message || eC);
      } finally {
        btn.disabled = false;
      }
      return;
    }
    try {
      var fetchRange = range === '5y' ? '5y' : '2y';
      var doneH = 0;
      await pmap(syms, async function (sy) {
        var h = await getHistory(sy, fetchRange);
        doneH++;
        st.textContent = 'Lade Historie … (' + doneH + '/' + syms.length + ')';
        if (h && h.length > 260) histMap[sy] = range === '1y' ? h.slice(-320) : h; // ~1J + Warmup
      }, 6);
      st.textContent = 'Rechne …';
      await new Promise(function (r) { setTimeout(r, 30); });
      var res = await btDaily(histMap, { capital: START_CAPITAL, weights: D.weights });
      if (res.error) { st.textContent = res.error; return; }
      // Benchmark im selben Zeitraum (S&P 500, auf Startkapital normiert)
      var benchPts = null;
      if (res.equity && res.equity.length > 2) {
        var bh = await getHistory('^GSPC', fetchRange);
        if (bh) {
          var t0b = res.equity[0][0];
          var slb = bh.filter(function (p) { return p[0] >= t0b - 86400000; });
          if (slb.length > 2) {
            var p0b = slb[0][1];
            benchPts = slb.map(function (p) { return [Math.max(p[0], t0b), START_CAPITAL * p[1] / p0b]; });
          }
        }
      }
      st.textContent = '';
      renderBtResult(res, 'Stunden-Strategie (Technik + Elliott, Signale alle 2 Handelstage, SL −40 %/TP +80 %)', benchPts);
    } catch (e) {
      st.textContent = 'Fehler: ' + (e.message || e);
    } finally {
      btn.disabled = false;
    }
  }

  var lastBtTrades = null;
  function renderBtResult(res, label, benchPts) {
    var s = res.summary;
    lastBtTrades = res.trades || [];
    var html = '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin-bottom:8px;">' + label + '</div>';
    html += '<div class="depot-stats">' +
      '<div class="tile"><div class="name">Endkapital</div><div class="val ' + U.signCls(s.end - s.start) + '" style="font-size:var(--fs-zahl);">' + U.money(s.end) + '</div></div>' +
      '<div class="tile"><div class="name">Rendite</div><div class="val ' + U.signCls(s.retPct) + '" style="font-size:var(--fs-zahl);">' + U.signTxt(s.retPct, ' %') + '</div></div>' +
      '<div class="tile"><div class="name">Trades / Trefferquote</div><div class="val" style="font-size:var(--fs-zahl);">' + s.nTrades + ' / ' + s.winRate + ' %</div></div>' +
      '<div class="tile"><div class="name">Max. Drawdown</div><div class="val" style="font-size:var(--fs-zahl);">−' + s.maxDrawdownPct + ' %</div></div>' +
      '<div class="tile"><div class="name">Sharpe (ann., ca.)</div><div class="val ' + U.signCls(s.sharpe) + '" style="font-size:var(--fs-zahl);">' + (s.sharpe != null ? s.sharpe.toFixed(2) : '–') + '</div></div>' +
      '</div>';
    // Kennzahlen-Zeile 2
    html += '<div style="display:flex; gap:16px; flex-wrap:wrap; font-size:var(--fs-neben); color:var(--ink-2); margin-bottom:10px;">' +
      '<span>Profit-Faktor <b class="' + (s.profitFactor >= 1 ? 'pos' : 'neg') + '">' + (s.profitFactor != null ? s.profitFactor : '–') + '</b></span>' +
      '<span>Ø Gewinn-Trade <b class="pos">' + U.signTxt(s.avgWin || 0, ' $') + '</b></span>' +
      '<span>Ø Verlust-Trade <b class="neg">' + U.signTxt(s.avgLoss || 0, ' $') + '</b></span>' +
      '<span>Längste Verlustserie <b>' + (s.maxLossStreak || 0) + '</b></span>' +
      '<span>Zeit im Markt <b>' + (s.exposurePct || 0) + ' %</b></span>' +
      (s.avgHoldMin ? '<span>Ø Haltedauer <b>' + s.avgHoldMin + ' Min</b></span>' : '') +
      '<span>Gebühren <b>' + U.nf2.format(s.feesTotal || 0) + ' $</b></span>' +
      '</div>';
    /* Zufallsgegenprobe – die wichtigste Einzelzahl der ganzen Auswertung.
       Sie beantwortet die Frage, die eine schöne Ertragskurve nicht beantwortet:
       Hätte Raten dasselbe gebracht? Am 21.08.2026 kam eine Trendfolge-Strategie auf
       Krypto auf +13,7 % p. a. und sah nach einem Fund aus – bis dieselbe Rechnung mit
       vertauschten Richtungen +19,4 % ergab. Deshalb steht sie hier ganz oben und nicht
       versteckt unter den Kennzahlen. */
    if (s.gegenprobe) {
      var gp = s.gegenprobe;
      if (gp.zuWenig) {
        html += '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin-bottom:10px; padding:8px 10px; border-left:3px solid var(--grid);">' +
          'Zufallsgegenprobe: ' + U.esc(gp.aussage) + '</div>';
      } else {
        var farbe = gp.ueberzufaellig ? 'var(--up)' : (gp.pWert >= 0.5 ? 'var(--down)' : 'var(--warn)');
        html += '<div style="font-size:var(--fs-neben); margin-bottom:10px; padding:9px 11px; border-left:3px solid ' + farbe + '; background:var(--panel);">' +
          '<b style="color:' + farbe + ';">Zufallsgegenprobe:</b> ' + U.esc(gp.aussage) +
          '<div style="color:var(--ink-2); margin-top:4px;">' +
            'Diese Strategie bewegte den Basiswert im Mittel <b>' + U.signTxt(gp.echt, ' %') + '</b> in Handelsrichtung. ' +
            'Vertauscht man die Richtungen zufällig unter denselben ' + gp.n + ' Trades, kommen im Mittel ' +
            '<b>' + U.signTxt(gp.zufallMittel, ' %') + '</b> heraus. ' +
            'Richtung getroffen in ' + gp.quote + ' % der Fälle.' +
          '</div></div>';
      }
    }
    /* Signifikanz aus nicht überlappenden MONATEN statt aus der Trade-Zahl.
       Bei Haltedauern über mehreren Bars sind fast alle Trades gleichzeitig offen; ein
       trade-basierter t-Wert zählt dieselbe Marktbewegung dutzendfach. Am 21.08.2026 auf
       Krypto nachgemessen: aus t = 5,5 wurde t = 0,46, sobald man auf Monate umstellte. */
    if (s.monatlich && !s.monatlich.zuKurz) {
      var ms = s.monatlich;
      var mFarbe = ms.ueberzufaellig ? 'var(--up)' : 'var(--ink-2)';
      html += '<div style="font-size:var(--fs-neben); margin-bottom:10px; padding:9px 11px; border-left:3px solid ' + mFarbe + '; background:var(--panel);">' +
        '<b>Signifikanz über Monate:</b> ' + ms.monate + ' Monate, ' +
        '<b>' + U.signTxt(ms.jeMonat, ' %') + '</b> je Monat (' + U.signTxt(ms.proJahr, ' %') + ' p. a.), ' +
        ms.positiveMonate + ' % davon positiv, <b>t = ' + ms.tWert + '</b>' +
        '<div style="color:var(--ink-2); margin-top:4px;">' +
          (!ms.belastbar
            ? 'Unter 24 Monaten ist ein t-Wert nicht belastbar – hier zählt er nicht als Beleg, egal wie hoch er steht.'
            : ms.ueberzufaellig
              ? 'Überzufällig. Gerechnet auf Monatserträgen, die sich nicht überlappen – anders als eine Trade-Zählung, die dieselbe Bewegung mehrfach zählt.'
              : 'Nicht überzufällig (t unter 2). Die Trade-Zahl oben sieht besser aus, weil überlappende Trades dieselbe Marktbewegung mehrfach zählen.') +
        '</div></div>';
    }
    html += '<svg id="btChart" style="width:100%; height:180px; display:block;"></svg><div id="btChartLegend" style="font-size:var(--fs-neben); color:var(--ink-2); margin-top:4px;"></div>';
    // Robustheit (Bootstrap)
    if (res.bootstrap) {
      var bs = res.bootstrap;
      html += '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin-top:10px;">Robustheit (400 Neuziehungen der Trades): Endkapital-Bandbreite ' +
        '<b>' + U.nf0.format(bs.p5) + ' $</b> (5 %) · <b>' + U.nf0.format(bs.p50) + ' $</b> (Median) · <b>' + U.nf0.format(bs.p95) + ' $</b> (95 %) · ' +
        'Verlust-Wahrscheinlichkeit <b class="' + (bs.lossProb > 50 ? 'neg' : '') + '">' + bs.lossProb + ' %</b></div>';
    }
    // Monats-Heatmap
    if (s.monthly && Object.keys(s.monthly).length >= 4) {
      var byYear = {};
      Object.keys(s.monthly).forEach(function (k) {
        var y = k.slice(0, 4), m = parseInt(k.slice(5), 10);
        (byYear[y] = byYear[y] || {})[m] = s.monthly[k];
      });
      html += '<div style="margin-top:12px;"><div style="font-size:var(--fs-neben); color:var(--ink-2); margin-bottom:4px;">Monats-Renditen</div><table class="tbl" style="font-size:var(--fs-klein);"><tr><th></th>';
      for (var mm = 1; mm <= 12; mm++) html += '<th>' + ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][mm - 1] + '</th>';
      html += '</tr>';
      Object.keys(byYear).sort().forEach(function (y) {
        html += '<tr><td><b>' + y + '</b></td>';
        for (var m2 = 1; m2 <= 12; m2++) {
          var v2 = byYear[y][m2];
          if (v2 === undefined) html += '<td style="color:var(--muted);">·</td>';
          else {
            var op = Math.min(0.85, 0.15 + Math.abs(v2) / 12);
            html += '<td style="background:' + (v2 >= 0 ? 'rgba(12,163,12,' : 'rgba(208,59,59,') + op.toFixed(2) + ');">' + (v2 > 0 ? '+' : '') + v2.toFixed(1) + '</td>';
          }
        }
        html += '</tr>';
      });
      html += '</table></div>';
    }
    // Signalquellen / Exit-Gründe
    html += '<div class="grid2" style="margin-top:10px;"><div>';
    if (res.stats) {
      [['tech', 'Technik'], ['elliott', 'Elliott-Wellen']].forEach(function (kk) {
        var v = res.stats[kk[0]], tot = v.r + v.w, pct = tot ? Math.round(v.r / tot * 100) : 0;
        html += '<div style="font-size:var(--fs-neben); display:flex; justify-content:space-between;"><span>' + kk[1] + '</span><span>' + pct + ' % richtig (' + v.r + '/' + tot + ')</span></div><div class="hitbar" style="margin-bottom:8px;"><span style="width:' + pct + '%"></span></div>';
      });
    } else if (res.trades && res.trades.length) {
      var byWhy = {};
      res.trades.forEach(function (tr) { byWhy[tr.why] = (byWhy[tr.why] || 0) + 1; });
      html += '<div style="font-size:var(--fs-neben); color:var(--ink-2);">Exit-Gründe: ' + Object.keys(byWhy).map(function (k) { return k + ' (' + byWhy[k] + ')'; }).join(' · ') + '</div>';
    }
    html += '</div><div style="font-size:var(--fs-neben); color:var(--muted);">Simulation mit synthetischen Scheinen (Black-Scholes, vola-abhängiger Spread + Slippage + Gebühren). Vergangenheit ist kein Indikator für die Zukunft.</div></div>';
    // Trade-Liste
    if (res.trades && res.trades.length) {
      html += '<details style="margin-top:10px;"><summary style="cursor:pointer; font-size:var(--fs-text); color:var(--ink-2);">Alle ' + res.trades.length + ' Trades anzeigen</summary>' +
        '<div style="max-height:320px; overflow:auto; margin-top:8px;"><table class="tbl" style="font-size:var(--fs-neben);"><tr><th>Datum</th><th>Wert</th><th>Typ</th><th>Halt</th><th>P/L</th><th>Exit</th></tr>';
      res.trades.slice(-200).reverse().forEach(function (tr) {
        var holdTxt = tr.holdMin != null ? (tr.holdMin >= 1440 ? Math.round(tr.holdMin / 1440) + ' T' : tr.holdMin + ' Min') : Math.round((tr.closeT - tr.openT) / 86400000) + ' T';
        html += '<tr><td>' + new Date(tr.openT).toLocaleDateString('de-DE') + '</td><td><b>' + U.esc(tr.sym) + '</b></td>' +
          '<td>' + tr.dir.toUpperCase() + '</td><td>' + holdTxt + '</td>' +
          '<td class="' + U.signCls(tr.pnl) + '">' + U.signTxt(tr.pnl, ' $') + '</td><td>' + U.esc(tr.why || '') + '</td></tr>';
      });
      html += '</table></div><button class="btn ghost" id="btCsvBtn" style="margin-top:8px; font-size:var(--fs-neben);">Backtest-Trades als CSV</button></details>';
    }
    document.getElementById('btResult').innerHTML = html;
    var series = [{ name: 'Strategie', short: 'Strat', color: 'var(--series)', pts: res.equity }];
    if (benchPts) series.push({ name: 'S&P 500 (Buy & Hold)', short: 'S&P', color: 'var(--series2)', pts: benchPts });
    drawLines(document.getElementById('btChart'), series, document.getElementById('btChartLegend'), START_CAPITAL, { unit: ' $' });
    var csvB = document.getElementById('btCsvBtn');
    if (csvB) csvB.addEventListener('click', function () {
      var head = 'Datum;Symbol;Typ;Einstieg;Exit;Stück;P/L ($);Exit-Grund\n';
      var rows = lastBtTrades.map(function (tr) {
        return [new Date(tr.openT).toLocaleString('de-DE'), tr.sym, tr.dir.toUpperCase(), String(tr.entry).replace('.', ','), String(tr.exit).replace('.', ','), tr.qty, String(Math.round(tr.pnl * 100) / 100).replace('.', ','), (tr.why || '').replace(/;/g, ',')].join(';');
      }).join('\n');
      dateiSpeichern(new Blob(['﻿' + head + rows], { type: 'text/csv;charset=utf-8' }), 'backtest-trades.csv');
    });
  }

  function drawEquity(svg, eq, base) {
    drawLines(svg, [{ name: 'Depotwert', short: '', color: 'var(--series)', pts: eq }], null, base, { area: true, unit: ' $' });
  }

  /* ================= Chart-Zeichnung =================
   * Wohnt seit dem zweiten Schnitt (Audit 22) in chart.js - sie fasst weder D noch
   * eine Position noch eine Kursquelle an, sondern bekommt Punkte und einen
   * SVG-Knoten. Hier stehen nur noch die Namen, damit die rund 20 Aufrufstellen
   * unveraendert bleiben konnten. */
  var niceTicks = window.Chart.niceTicks;
  var fmtTick = window.Chart.fmtTick;
  var fmtTimeTick = window.Chart.fmtTimeTick;
  var drawLines = window.Chart.drawLines;

  /* ================= Parallel-Strategien-Auswertung ================= */
  function stratOf(t) { return t.strategy === 'intraday' ? 'intraday' : 'hourly'; }


  /* ================= Benchmark-Vergleich ================= */
  var benchLoadedAt = 0;
  async function renderBenchmark() {
    var info = document.getElementById('benchInfo');
    if (!info) return;
    if (!D.equityHist || D.equityHist.length < 2) {
      info.textContent = 'Noch zu wenig Depot-Verlauf – die Kurve entsteht, sobald die Simulation ein paar Stunden läuft.';
      return;
    }
    if (Date.now() - benchLoadedAt < 30 * 60000) return; // max. alle 30 Min laden
    benchLoadedAt = Date.now();
    info.textContent = 'Lade Index-Daten …';
    var t0 = D.equityHist[0][0], base = D.equityHist[0][1];
    var series = [{ name: 'KI-Depot', short: 'Depot', color: 'var(--series)', pts: D.equityHist }];
    var marks = [['^GSPC', 'S&P 500 (Buy & Hold)', 'S&P', 'var(--series2)'], ['^IXIC', 'Nasdaq (Buy & Hold)', 'NDQ', 'var(--series3)']];
    var retTxt = [];
    for (var i = 0; i < marks.length; i++) {
      var h = await getHistory(marks[i][0], '2y');
      if (!h) continue;
      var sl = h.filter(function (p) { return p[0] >= t0 - 86400000; });
      if (sl.length < 2) sl = h.slice(-2);
      var p0 = sl[0][1];
      series.push({ name: marks[i][1], short: marks[i][2], color: marks[i][3], pts: sl.map(function (p) { return [Math.max(p[0], t0), base * p[1] / p0]; }) });
      retTxt.push(marks[i][2] + ' ' + U.signTxt((sl[sl.length - 1][1] / p0 - 1) * 100, ' %'));
    }
    var eqNow = D.equityHist[D.equityHist.length - 1][1];
    info.innerHTML = 'Seit Depot-Start: <b class="' + U.signCls(eqNow - base) + '">Depot ' + U.signTxt((eqNow / base - 1) * 100, ' %') + '</b> · ' + retTxt.join(' · ');
    drawLines(document.getElementById('benchChart'), series, document.getElementById('benchLegend'), base, { unit: ' $' });
  }


  function renderPatience() {
    var el = document.getElementById('patience');
    if (!el) return;
    var agg = patienceAgg(7);
    var reasons = Object.keys(agg.byReason).sort(function (a, b) { return agg.byReason[b] - agg.byReason[a]; });
    if (!reasons.length) {
      el.innerHTML = '<div class="loading">Noch keine verworfenen Signale erfasst – entsteht, sobald der Intraday-Scanner läuft.</div>';
      return;
    }
    var weekAgo = Date.now() - 7 * 86400000;
    var taken = D.trades.filter(function (t) { return t.openT >= weekAgo && t.strategy === 'intraday'; }).length;
    var max = agg.byReason[reasons[0]];
    var rows = reasons.map(function (r) {
      var n = agg.byReason[r];
      var pct = Math.round(n / max * 100);
      return '<div class="patrow"><span>' + U.esc(r) + '</span>' +
        '<span class="pbar"><span style="width:' + pct + '%;"></span></span>' +
        '<b>' + n + '×</b></div>';
    }).join('');
    el.innerHTML =
      '<div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; font-size:var(--fs-text);">' +
      '<span>Ausgeführte Intraday-Trades: <b>' + taken + '</b></span>' +
      '<span>Bewusst verworfen: <b>' + agg.total + '</b></span>' +
      (agg.total + taken > 0 ? '<span>Geduld-Quote: <b>' + Math.round(agg.total / (agg.total + taken) * 100) + ' %</b></span>' : '') +
      '</div>' + rows + renderSchattenHtml();
  }

  /** Merkmals-Aufzeichnung des Vorwärtstests (Felix' Issue #57).
   *  Zeigt, was die abgeschlossenen Signale gemeinsam hatten – und sagt in derselben
   *  Karte dazu, warum das noch kein Befund ist. Diese Zeile ist wichtiger als die
   *  Tabelle: Wer zwölf Töpfe nebeneinander sieht, hält den besten für eine Kante.
   *  Nichts hiervon greift in den Handel ein. Simulation, keine Anlageberatung. */
  function renderMerkmaleHtml() {
    if (!Q.merkmalsBilanz) return '';
    var b = Q.merkmalsBilanz(D.merkStat || {});
    var LBL = {
      unten: 'unten', mitte: 'Mitte', oben: 'oben',
      auf: 'aufwärts', seit: 'seitwärts', ab: 'abwärts',
      niedrig: 'niedrig', normal: 'normal', hoch: 'hoch',
      wenig: 'wenig (< 40 %)', mittel: 'mittel (40–80 %)', viel: 'viel (> 80 %)'
    };
    var h = '<div style="margin-top:12px; border-top:1px solid var(--line); padding-top:8px;">' +
      '<div style="font-weight:700; margin-bottom:4px;">Merkmale der Signale – Aufzeichnung, kein Befund</div>' +
      '<div style="color:var(--muted); font-size:var(--fs-neben); margin-bottom:6px;">' +
      'Bei jedem Signal werden vier vorher festgelegte Merkmale mitgeschrieben (Lage im Trendkanal, ' +
      'Kanalrichtung, relatives Volumen, genutzte Tagesspanne). Erst danach wird gezählt. ' +
      'Andersherum – hinterher in den fertigen Trades nach Mustern suchen – findet man immer eines. ' +
      '„Kontrolle“ ist derselbe Wert zur selben Tagesstunde an beliebigen anderen Tagen; nur der ' +
      '<b>Überschuss</b> darüber wäre überhaupt eine Aussage. Simulation, keine Anlageberatung.</div>';
    if (!b.gesamtN) {
      return h + '<div style="color:var(--muted); font-size:var(--fs-neben);">Noch kein abgeschlossenes Signal mit Merkmalen. ' +
        'Die Aufzeichnung beginnt mit dem nächsten Signal, das alle Filter passiert.</div></div>';
    }
    for (var f = 0; f < b.felder.length; f++) {
      h += '<div style="font-size:var(--fs-neben); font-weight:600; margin-top:6px;">' + U.esc(b.felder[f].name) + '</div>';
      for (var z = 0; z < b.felder[f].zeilen.length; z++) {
        var r = b.felder[f].zeilen[z];
        var rechts = r.n + ' Signale · Ø ' + U.signTxt(r.avg, ' %') +
          (r.ktr == null ? '' : ' · Kontrolle ' + U.signTxt(r.ktr, ' %') +
            ' · Überschuss <b class="' + (r.ueber >= 0 ? 'pos' : 'neg') + '">' + U.signTxt(r.ueber, ' %') + '</b>');
        h += '<div class="patrow"><span>' + U.esc(LBL[r.wert] || r.wert) + '</span>' +
          '<span style="color:var(--muted);">' + rechts + '</span><b></b></div>';
        if (r.duenn) h += '<div class="urteil-zeile">unter ' + b.min + ' Signalen – die Zahl ist Rauschen, kein Hinweis</div>';
      }
    }
    /* Die Zahl der Vergleiche gehört sichtbar unter die Tabelle: Sie ist der Grund,
     * warum ein einzelner auffälliger Topf nichts beweist. */
    h += '<div style="color:var(--muted); font-size:var(--fs-neben); margin-top:8px;">' +
      b.toepfe + ' Vergleiche nebeneinander, ' + b.gesamtN + ' Merkmalseinträge aus den abgeschlossenen Signalen. ' +
      'Bei so vielen Töpfen sticht auch bei reinem Zufall regelmäßig einer heraus – ein auffälliger Wert ist ' +
      'deshalb ein <b>Kandidat für eine Messung</b>, nicht ihr Ergebnis. Gehandelt wird davon nichts: Erst eine ' +
      'Studie mit Überschuss gegen die Symbol-Drift, t-Wert über die Symbole, Zeitsplit und Netto nach Kosten ' +
      'macht aus einem Muster eine Regel.</div>';
    return h + '</div>';
  }

  /** Schattenbuch-Bilanz: Was wäre aus den verworfenen Trades geworden? */
  function renderSchattenHtml() {
    var st = D.schattenStat || {};
    /* „Einstieg“ misst etwas grundlegend anderes als die Filter-Gründe und gehört
       deshalb getrennt: Die Filter-Schatten beantworten „hat dieser Filter Geld
       gerettet?“, die Einstiegs-Schatten „hätte die Strategie insgesamt verdient?“.
       In einer Tabelle nebeneinander wären beide Zahlen missverständlich. */
    var gr = Object.keys(st).filter(function (k) { return k !== 'Einstieg'; })
      .sort(function (a, b) { return st[b].n - st[a].n; });
    var offen = (D.schatten || []).filter(function (x) { return x.status === 'open'; }).length;
    var ein = st['Einstieg'];
    if (!gr.length && !offen && !ein) return '';
    var h = '';

    /* ---- Vorwärtstest: die durchgelassenen Signale ---- */
    if (ein || D.intraday.schattenImmer !== false) {
      var einOffen = (D.schatten || []).filter(function (x) { return x.status === 'open' && x.grund === 'Einstieg'; }).length;
      h += '<div style="margin-top:12px; border-top:1px solid var(--line); padding-top:8px;">' +
        '<div style="font-weight:700; margin-bottom:4px;">Vorwärtstest – was die Intraday-Strategie verdient hätte</div>' +
        '<div style="color:var(--muted); font-size:var(--fs-neben); margin-bottom:6px;">' +
        'Jedes Signal, das alle Filter passiert hat, läuft hier virtuell zu Ende – auch wenn nicht gehandelt wird. ' +
        'Das ist die einzige Evidenzform ohne Rückschau-Verzerrung: Sie entsteht erst mit der Zeit und kann nicht nachträglich schöngerechnet werden. ' +
        'Simulation, keine Anlageberatung.</div>';
      if (!ein || !ein.n) {
        h += '<div style="color:var(--muted); font-size:var(--fs-neben);">Noch kein abgeschlossenes Signal' +
          (einOffen ? ' – ' + einOffen + ' laufen gerade.' : '. Die Aufzeichnung beginnt mit dem nächsten Signal.') + '</div>';
      } else {
        var avgE = Math.round(ein.sumPct / ein.n * 10) / 10;
        var quoteE = Math.round(100 * ein.verhindert / ein.n);
        // Erst ab einer belastbaren Zahl ein Urteil. 30 Trades sind wenig, aber
        // unterhalb davon ist jede Aussage Rauschen - das Live-Konto mit 28 Trades
        // und 11 % Trefferquote ist das Mahnmal dafuer.
        var urteilE = ein.n < 30
          ? 'noch zu wenige Signale für ein Urteil (ab 30 wird es aussagekräftig)'
          : (avgE > 0 ? 'die Strategie wäre im Mittel im Plus' : 'die Strategie wäre im Mittel im Minus');
        // Der Vorwaertstest ist die einzige Evidenz ohne Rueckschau-Verzerrung -
        // faellt er unter null, gehoert das ins Warnband, nicht nur in diese Karte.
        if (ein.n >= 30 && avgE < 0) {
          warnbandSetzen('vorwaerts', '<b>Vorwärtstest im Minus</b> – ' + ein.n + ' abgeschlossene Signale, Ø ' +
            U.signTxt(avgE, ' %') + ' je Signal. Die Live-Evidenz widerspricht damit der Backtest-Erwartung; ' +
            'Einzelheiten unter Auswertung → Vorwärtstest.', true);
        } else {
          warnbandSetzen('vorwaerts', null);
        }
        /* Das Urteil steht in einer EIGENEN Zeile unter den Kennzahlen. Vorher lief
         * ein ganzer Urteilssatz in die 44 Pixel schmale Zahlenspalte von .patrow. */
        h += '<div class="patrow"><span><b>' + ein.n + ' abgeschlossene Signale</b>' + (einOffen ? ' · ' + einOffen + ' laufen' : '') + '</span>' +
          '<span style="color:var(--muted);">Ø <b class="' + (avgE >= 0 ? 'pos' : 'neg') + '">' + U.signTxt(avgE, ' %') + '</b> je Signal · ' +
          quoteE + ' % im Plus</span><b></b></div>' +
          '<div class="urteil-zeile">' + urteilE + '</div>';
      }
      h += '</div>';
    }

    h += renderMerkmaleHtml();

    if (!gr.length && !offen) return h;
    h += '<div style="margin-top:12px; border-top:1px solid var(--line); padding-top:8px;">' +
      '<div style="font-weight:700; margin-bottom:4px;">Schattenbuch – was aus den verworfenen Trades geworden wäre</div>' +
      '<div style="color:var(--muted); font-size:var(--fs-neben); margin-bottom:6px;">Jeder verworfene Trade läuft virtuell weiter (gleiche Stop-/Ausstiegsregeln). ' +
      '„Gerettet“ = der Filter hat einen Verlust verhindert, „verhindert“ = er hat einen Gewinn gekostet (±1 % Totzone). Simulation, keine Anlageberatung.</div>';
    if (!gr.length) h += '<div style="color:var(--muted); font-size:var(--fs-neben);">' + offen + ' Schatten laufen – noch keiner abgeschlossen.</div>';
    gr.forEach(function (g3) {
      var x = st[g3];
      var avg = x.n ? Math.round(x.sumPct / x.n * 10) / 10 : 0;
      var urteil = x.n < 5 ? 'zu früh für ein Urteil'
        : (x.gerettet > x.verhindert * 1.5 ? 'rettet Geld' : (x.verhindert > x.gerettet * 1.5 ? 'verhindert eher Gewinne' : 'unentschieden'));
      h += '<div class="patrow"><span>' + U.esc(g3) + '</span>' +
        '<span style="color:var(--muted);">' + x.n + ' Schatten · Ø ' + U.signTxt(avg, ' %') + ' · gerettet ' + x.gerettet + ' · verhindert ' + x.verhindert + '</span>' +
        '<b></b></div>' +
        '<div class="urteil-zeile">' + urteil + '</div>';
    });
    if (offen) h += '<div style="color:var(--muted); font-size:var(--fs-neben); margin-top:4px;">' + offen + ' Schatten laufen noch.</div>';
    return h + '</div>';
  }

  function renderAnalytics() {
    renderBenchmark();
    renderPatience();
    renderTuneLog();
  }
  /* Die drei Ergebnis-Ansichten sind laengst in den Reiter "Regeln" gezogen, gezeichnet
   * wurden sie aber weiterhin NUR beim Klick auf die Pille "Auswertung" unter Vermoegen.
   * Wer also in "Regeln" die belegten Voreinstellungen uebernahm, sah die Tabelle
   * darunter unveraendert - und damit auch nie den Rueckgaengig-Knopf zu seiner eigenen
   * Aenderung. Beides nachgezogen: beim Oeffnen des Reiters und auf Zuruf. */
  if (typeof window !== 'undefined') {
    window.__renderAnalytics = function () { try { renderAnalytics(); } catch (e) { /* optional */ } };
    document.addEventListener('tab-changed', function (ev) {
      if (ev.detail === 'strategien') window.__renderAnalytics();
    });
  }

  /* ================= Retrospektive (regelbasiert) ================= */
  function retroData() {
    var closed = D.trades.filter(function (t) { return t.status === 'closed' && istMess(t); });
    var byWhy = {}, bySym = {}, byDir = { call: { n: 0, pnl: 0 }, put: { n: 0, pnl: 0 } };
    var agg = { hourly: { n: 0, w: 0, pnl: 0 }, intraday: { n: 0, w: 0, pnl: 0 } };
    var fees = 0, holdSum = 0;
    closed.forEach(function (t) {
      var w = (t.why || 'unbekannt').split(' (')[0].split(':')[0];
      (byWhy[w] = byWhy[w] || { n: 0, pnl: 0 }).n++; byWhy[w].pnl += t.pnl;
      (bySym[t.sym] = bySym[t.sym] || { n: 0, pnl: 0 }).n++; bySym[t.sym].pnl += t.pnl;
      byDir[t.dir].n++; byDir[t.dir].pnl += t.pnl;
      var a = agg[stratOf(t)]; a.n++; if (t.pnl > 0) a.w++; a.pnl += t.pnl;
      fees += t.orderFee ? t.orderFee * 2 : 0;
      holdSum += (t.closeT - t.openT) / 60000;
    });
    var symArr = Object.keys(bySym).map(function (k) { return [k, bySym[k].pnl, bySym[k].n]; }).sort(function (a, b) { return b[1] - a[1]; });
    return { closedN: closed.length, byWhy: byWhy, bySym: symArr, byDir: byDir, agg: agg, fees: Math.round(fees * 100) / 100, avgHoldMin: closed.length ? Math.round(holdSum / closed.length) : 0, stats: D.stats, weights: normWeights(), equity: equityNow() };
  }

  function retroRules(d) {
    var lines = ['## Kurzfazit (regelbasiert)'];
    lines.push('Analysiert: **' + d.closedN + ' geschlossene Trades** · Depot aktuell ' + U.money(d.equity) + ' (Start ' + U.money(START_CAPITAL) + ') · Gebühren gesamt ' + U.nf2.format(d.fees) + ' $ · Ø Haltedauer ' + d.avgHoldMin + ' Min.');
    lines.push('## Strategien');
    ['hourly', 'intraday'].forEach(function (k) {
      var a = d.agg[k];
      if (a.n) lines.push('- ' + (k === 'hourly' ? 'Stunden-Strategie' : 'Intraday') + ': ' + a.n + ' Trades, ' + Math.round(a.w / a.n * 100) + ' % Treffer, P/L ' + U.signTxt(a.pnl, ' $'));
    });
    lines.push('## Exit-Gründe (was beendet Trades – und mit welchem Ergebnis?)');
    Object.keys(d.byWhy).forEach(function (k) {
      var v = d.byWhy[k];
      lines.push('- ' + k + ': ' + v.n + '× · Ø ' + U.signTxt(v.pnl / v.n, ' $'));
    });
    if (d.bySym.length >= 2) {
      lines.push('## Beste / schwächste Basiswerte');
      lines.push('- Top: ' + d.bySym.slice(0, 3).map(function (x) { return x[0] + ' (' + U.signTxt(x[1], ' $') + ')'; }).join(', '));
      lines.push('- Flop: ' + d.bySym.slice(-3).reverse().map(function (x) { return x[0] + ' (' + U.signTxt(x[1], ' $') + ')'; }).join(', '));
    }
    lines.push('## Empfehlungen');
    var recs = [];
    ['news', 'tech', 'elliott'].forEach(function (src) {
      var s = d.stats[src], tot = s.r + s.w;
      if (tot >= 8) {
        var pct = s.r / tot * 100;
        if (pct < 45) recs.push('- **' + src + '-Gewicht senken**: nur ' + Math.round(pct) + ' % Treffer (' + s.r + '/' + tot + ').');
        if (pct > 60) recs.push('- **' + src + '-Gewicht erhöhen**: ' + Math.round(pct) + ' % Treffer (' + s.r + '/' + tot + ').');
      }
    });
    var ia = d.agg.intraday;
    if (ia.n >= 10 && ia.pnl < 0 && d.fees > Math.abs(ia.pnl) * 0.3) recs.push('- **Intraday: Kosten fressen das Ergebnis** – größeren Zeitrahmen (5/15 Min) oder höhere Bestätigung testen.');
    var slWhy = d.byWhy['Stop-Loss erreicht'] || d.byWhy['Stop-Loss'];
    if (slWhy && d.closedN && slWhy.n / d.closedN > 0.4) recs.push('- **Viele Stop-Loss-Exits (' + slWhy.n + ')** – Einstiege zu spät oder SL zu eng; höhere Bestätigungsschwelle testen.');
    if (!recs.length) recs.push('- Noch kein klares Muster – mehr Trades sammeln oder Backtests vergleichen.');
    lines = lines.concat(recs);
    return lines.join('\n');
  }

  async function runRetro() {
    var st = document.getElementById('reportStatus');
    var d = retroData();
    if (!d.closedN) { st.textContent = 'Noch keine geschlossenen Trades für eine Retrospektive.'; return; }
    var body = retroRules(d);
    st.textContent = '';
    document.getElementById('aiTitle').textContent = 'Retrospektive (' + d.closedN + ' Trades)';
    // Lernschleife: konkrete Regel-Vorschläge für die KI-Prüfung
    var sugs = kiSuggestions();
    var sugHtml = '';
    if (sugs.length) {
      sugHtml = '<div style="margin-top:14px; padding:10px 12px; border:1px solid var(--grid); border-radius:var(--r-gross);">' +
        '<div style="font-weight:600; font-size:var(--fs-text); margin-bottom:6px;">Lernschleife – Regel-Vorschläge aus den letzten 14 Tagen:</div>' +
        '<ul style="margin:0 0 8px 18px; font-size:var(--fs-text);">' + sugs.map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join('') + '</ul>' +
        '<button class="btn" id="kiSugBtn">→ In meine KI-Regeln übernehmen</button> <span id="kiSugStatus" style="font-size:var(--fs-neben); color:var(--muted);"></span></div>';
    }
    document.getElementById('aiBody').innerHTML = U.md(body) + sugHtml + '<div class="warn">Simulation – keine Anlageberatung.</div>';
    window.openModal('aiModalBg');
    var sb = document.getElementById('kiSugBtn');
    if (sb) sb.addEventListener('click', function () {
      var added = window.appendKiRules ? window.appendKiRules(sugs) : 0;
      document.getElementById('kiSugStatus').textContent = added ? '' + added + ' Regel(n) übernommen – gelten ab dem nächsten Trade.' : 'Alle Vorschläge sind schon in deinen Regeln.';
    });
  }

  /* ================= Wochenreport ================= */
  var KOSTOLANY = [
    '„An der Börse gilt: Wer nicht weiß, was er tut, muss wissen, wann er nichts tut.“',
    '„Einer Straßenbahn und einer Aktie darf man niemals nachlaufen. Nur Geduld: Die nächste kommt bestimmt.“',
    '„Was an der Börse jeder weiß, macht mich nicht heiß.“',
    '„Börsenerfolg ist eine Kunst und keine Wissenschaft.“',
    '„Die ganze Börse hängt nur davon ab, ob es mehr Aktien gibt als Idioten – oder umgekehrt.“',
    '„Nicht reich muss man sein, sondern unabhängig.“',
    '„Wirtschaft kann man nicht dozieren, man muss sie selbst erleben – und überleben.“'
  ];

  async function runWeekly() {
    var st = document.getElementById('reportStatus');
    st.textContent = 'Erstelle Wochenreport …';
    var now = Date.now(), weekAgo = now - 7 * 86400000;
    var closed = D.trades.filter(function (t) { return t.status === 'closed' && t.closeT >= weekAgo && istMess(t); });
    var wins = closed.filter(function (t) { return t.pnl > 0; }).length;
    var pnlW = closed.reduce(function (a, t) { return a + t.pnl; }, 0);
    var feesW = closed.reduce(function (a, t) { return a + (t.orderFee ? t.orderFee * 2 : 0); }, 0);
    var best = closed.slice().sort(function (a, b) { return b.pnl - a.pnl; })[0];
    var worst = closed.slice().sort(function (a, b) { return a.pnl - b.pnl; })[0];
    var eqPts = (D.equityHist || []).filter(function (p) { return p[0] >= weekAgo; });
    var eqStart = eqPts.length ? eqPts[0][1] : equityNow();
    var eqEnd = equityNow();
    var agg = { hourly: { n: 0, pnl: 0 }, intraday: { n: 0, pnl: 0 } };
    closed.forEach(function (t) { var a = agg[stratOf(t)]; a.n++; a.pnl += t.pnl; });
    var spx = '';
    var h = await getHistory('^GSPC', '2y');
    if (h && h.length > 6) {
      var wk = h.filter(function (p) { return p[0] >= weekAgo; });
      if (wk.length >= 2) spx = U.signTxt((wk[wk.length - 1][1] / wk[0][1] - 1) * 100, ' %');
    }
    var events = window.Cal ? window.Cal.next(5) : [];
    var kw = (function (dt) { var d1 = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())); var dayNum = d1.getUTCDay() || 7; d1.setUTCDate(d1.getUTCDate() + 4 - dayNum); var y0 = new Date(Date.UTC(d1.getUTCFullYear(), 0, 1)); return Math.ceil(((d1 - y0) / 86400000 + 1) / 7); })(new Date());

    var lines = [];
    lines.push('## Wochenreport KW ' + kw + ' (' + new Date(weekAgo).toLocaleDateString('de-DE') + ' – ' + new Date(now).toLocaleDateString('de-DE') + ')');
    lines.push('*' + KOSTOLANY[kw % KOSTOLANY.length] + ' – André Kostolany*');
    lines.push('## Depot');
    lines.push('- Wochen-Performance: **' + U.signTxt((eqEnd / eqStart - 1) * 100, ' %') + '** (' + U.money(eqStart) + ' → ' + U.money(eqEnd) + ')' + (spx ? ' · S&P 500 zur selben Zeit: ' + spx : ''));
    lines.push('- Gesamt seit Start: ' + U.signTxt((eqEnd / START_CAPITAL - 1) * 100, ' %') + ' · Offene Positionen: ' + D.positions.length);
    lines.push('## Trades dieser Woche');
    lines.push('- ' + closed.length + ' geschlossene Trades · Trefferquote ' + (closed.length ? Math.round(wins / closed.length * 100) + ' %' : '–') + ' · P/L ' + U.signTxt(pnlW, ' $') + ' · Gebühren ' + U.nf2.format(feesW) + ' $');
    if (agg.hourly.n) lines.push('- Stunden-Strategie: ' + agg.hourly.n + ' Trades, ' + U.signTxt(agg.hourly.pnl, ' $'));
    if (agg.intraday.n) lines.push('- Intraday: ' + agg.intraday.n + ' Trades, ' + U.signTxt(agg.intraday.pnl, ' $'));
    if (best) lines.push('- Bester Trade: ' + best.sym + ' ' + best.dir.toUpperCase() + ' ' + U.signTxt(best.pnl, ' $') + ' · Schwächster: ' + worst.sym + ' ' + worst.dir.toUpperCase() + ' ' + U.signTxt(worst.pnl, ' $'));
    var pat = patienceAgg(7);
    if (pat.total) {
      lines.push('## Geduld-Bilanz („wissen, wann man nichts tut")');
      var patReasons = Object.keys(pat.byReason).sort(function (a, b) { return pat.byReason[b] - pat.byReason[a]; });
      lines.push('- **' + pat.total + ' Signale bewusst verworfen** – ausgeführt wurden ' + agg.intraday.n + ' Intraday-Trades' + (pat.total + agg.intraday.n > 0 ? ' (Geduld-Quote ' + Math.round(pat.total / (pat.total + agg.intraday.n) * 100) + ' %)' : ''));
      patReasons.slice(0, 6).forEach(function (r) { lines.push('- ' + r + ': ' + pat.byReason[r] + '×'); });
    }
    if (events.length) {
      lines.push('## Nächste Woche wichtig');
      events.forEach(function (e) { lines.push('- ' + e.dt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ': ' + e.name); });
    }
    var body = lines.join('\n');
    st.textContent = '';
    document.getElementById('aiTitle').textContent = 'Wochenreport KW ' + kw;
    document.getElementById('aiBody').innerHTML = U.md(body) +
      '<div style="margin-top:12px;"><button class="btn" id="weeklySaveBtn">Als HTML-Datei speichern</button></div>' +
      '<div class="warn">Simulation – keine Anlageberatung.</div>';
    window.openModal('aiModalBg');
    document.getElementById('weeklySaveBtn').addEventListener('click', function () {
      var doc = '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Wochenreport KW ' + kw + '</title>' +
        '<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.6;color:#111}h2{margin-top:24px}</style></head><body>' +
        U.md(body) + '<hr><p style="color:#888;font-size:var(--fs-neben);">Erstellt vom Markt-Dashboard · Simulation, keine Anlageberatung.</p></body></html>';
      dateiSpeichern(new Blob([doc], { type: 'text/html' }), 'Wochenreport-KW' + kw + '.html');
    });
  }

  /* ================= Wellen-Screener ================= */
  var SCREEN_CANDS = ['NFLX', 'COIN', 'PLTR', 'SMCI', 'MSTR', 'SHOP', 'UBER', 'PYPL', 'BA', 'JPM', 'XOM', 'LLY', 'CRM', 'ORCL', 'DELL', 'MRVL', 'SNOW', 'CRWD', 'PANW', 'ABNB', 'SOFI', 'RIVN', 'ROKU', 'DKNG', 'HOOD', 'NIO', 'BABA', 'AFRM', 'NET', 'DDOG', 'ZS', 'TTD'];
  var screenRunning = false;
  async function runScreener(manual) {
    if (screenRunning || !D) return;
    screenRunning = true;
    var st = document.getElementById('screenStatus');
    var cfg = D.intraday;
    try {
      var base = universe();
      var cands = SCREEN_CANDS.filter(function (s) { return base.indexOf(s) === -1; });
      var scored = [], doneS = 0;
      await pmap(cands, async function (sy) {
        var fd = await fetchIntradayYahoo(sy, '5m', false);
        doneS++;
        if (st) st.textContent = 'Screene … (' + doneS + '/' + cands.length + ')';
        if (fd && fd.series.length > 150) {
          var liquidS = !cfg.minDollarVol || fd.dollarVolDay == null || fd.dollarVolDay >= cfg.minDollarVol * 1e6;
          if (liquidS) {
            var wq = Q.waveQuality(fd.series, 'ema', cfg.period || 20, 1e9); // nur Score, keine Signal-Schwelle
            if (wq.score > 0) scored.push({ sym: sy, score: wq.score, vol: fd.dollarVolDay ? Math.round(fd.dollarVolDay / 1e6) : null });
          }
        }
      }, 6);
      scored.sort(function (a, b) { return b.score - a.score; });
      D.screen = { day: new Date().toISOString().slice(0, 10), picks: scored.slice(0, 5), at: Date.now() };
      await save();
      renderScreen();
      if (st) st.textContent = scored.length ? 'Fertig: ' + scored.length + ' Kandidaten bewertet (' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr).' : 'Keine geeigneten Kandidaten gefunden.';
    } catch (e) {
      if (st) st.textContent = 'Screener-Fehler: ' + (e.message || e);
    } finally {
      screenRunning = false;
    }
  }
  function renderScreen() {
    var el = document.getElementById('screenChips');
    if (!el) return;
    var today = new Date().toISOString().slice(0, 10);
    if (!D.screen || !D.screen.picks || !D.screen.picks.length) { el.innerHTML = '<span style="color:var(--muted); font-size:var(--fs-neben);">Noch kein Lauf.</span>'; return; }
    var stale = D.screen.day !== today;
    el.innerHTML = D.screen.picks.map(function (p) {
      return '<span class="chip flat" style="font-size:var(--fs-neben); padding:3px 10px;">' + U.esc(p.sym) + ' · Wellen-Score ' + p.score + (p.vol ? ' · ~' + p.vol + ' Mio $/Tag' : '') + '</span>';
    }).join('') + (stale ? ' <span style="color:var(--muted); font-size:var(--fs-klein);">(von ' + U.esc(D.screen.day) + ' – läuft heute automatisch neu)</span>' : '') +
      (D.intraday.screener ? '' : ' <span style="color:var(--muted); font-size:var(--fs-klein);">Schalter aus – Treffer fließen nicht in den Scan ein.</span>');
  }

  /* ================= KI-Lernschleife: Regel-Vorschläge aus den Trades ================= */
  function kiSuggestions() {
    var since = Date.now() - 14 * 86400000;
    var closed = D.trades.filter(function (t) { return t.status === 'closed' && t.closeT >= since && istMess(t); });
    var out = [];
    var bySymDir = {};
    closed.forEach(function (t) {
      var k = t.sym + '|' + t.dir;
      var s = (bySymDir[k] = bySymDir[k] || { n: 0, w: 0, pnl: 0 });
      s.n++; if (t.pnl > 0) s.w++; s.pnl += t.pnl;
    });
    Object.keys(bySymDir).forEach(function (k) {
      var s = bySymDir[k];
      if (s.n >= 4 && s.w / s.n <= 0.25 && s.pnl < 0) {
        var p = k.split('|');
        out.push('Keine ' + p[0] + ' ' + (p[1] === 'call' ? 'Calls' : 'Puts') + '.');
      }
    });
    var byHour = {};
    closed.forEach(function (t) {
      var h = new Date(t.openT).toLocaleString('de-DE', { hour: '2-digit', hour12: false, timeZone: 'Europe/Berlin' }).slice(0, 2);
      var s = (byHour[h] = byHour[h] || { n: 0, pnl: 0 });
      s.n++; s.pnl += t.pnl;
    });
    Object.keys(byHour).forEach(function (h) {
      var s = byHour[h];
      if (s.n >= 5 && s.pnl < 0) out.push('Zwischen ' + h + ':00 und ' + (parseInt(h, 10) + 1) + ':00 Uhr (Berlin) hoechstens groesse 0.5.');
    });
    return out.slice(0, 6);
  }

  /* ================= Watchlist-Verwaltung ================= */
  function renderWatchChips() {
    var el = document.getElementById('watchChips');
    if (!el) return;
    var wl = D.watchlist || [];
    el.innerHTML = wl.length
      ? wl.map(function (w, i) {
        return '<span class="chip flat" style="font-size:var(--fs-neben); padding:3px 10px;">' + U.esc(w.y) + ' · ' + U.esc(w.name).slice(0, 24) +
          ' <a href="#" data-unwatch="' + i + '" style="color:var(--down); font-weight:700; margin-left:4px;">×</a></span>';
      }).join('')
      : '<span style="color:var(--muted); font-size:var(--fs-neben);">Noch keine eigenen Werte.</span>';
    el.querySelectorAll('[data-unwatch]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        D.watchlist.splice(parseInt(a.getAttribute('data-unwatch'), 10), 1);
        save();
        renderWatchChips();
      });
    });
  }
  window.DepotAPI = {
    /** Was die Kurzfrist-Regeln zu einem Symbol zuletzt gesagt haben.
     *  Nur eine KOPIE - das Bestandsdepot (Issue #71) liest mit, es greift nicht ein. */
    signal: function (sym) {
      var s = SIG[sym];
      if (!s) return null;
      return { ok: !!s.ok, grund: s.grund || null, t: s.t || null,
               spot: s.spot != null ? s.spot : null };
    },

    /** Halten die beiden Mittelfrist-Buecher dieses Symbol gerade?
     *  Das IST das Mittelfrist-Signal dieses Projekts: nicht eine Meinung, sondern
     *  die Frage, ob die gemessenen Regeln den Wert derzeit im Buch haetten.
     *  richtung: 1 long, -1 short (die Drift kennt beide Seiten). */
    mittelfrist: function (sym) {
      if (!D) return null;
      function suche(buch, name) {
        if (!buch || !buch.positionen) return null;
        for (var i = 0; i < buch.positionen.length; i++) {
          var p = buch.positionen[i];
          if (p.sym !== sym) continue;
          return { buch: name, richtung: p.richtung != null ? p.richtung : 1 };
        }
        return null;
      }
      return { momentum: suche(D.mfBuch, 'Momentum'), drift: suche(D.driftBuch, 'Ergebnis-Drift') };
    },

    /** Der letzte Kurs, den der Intraday-Scanner fuer ein Symbol gesehen hat.
     *  Er fuehrt LASTBARS fuer sein ganzes Handelsuniversum - deutlich mehr Werte
     *  als die Kachelreihe, und ohne einen einzigen zusaetzlichen Abruf. Die
     *  Marktkarte schoepft das ab, statt dieselben Kurse noch einmal zu holen.
     *  Die Tagesveraenderung kommt aus der ersten Kerze des laufenden Tages;
     *  liegt keine vor, wird pct null - dann faerbt die Karte neutral, statt zu
     *  raten. */
    letzterKurs: function (sym) {
      var b = LASTBARS[sym];
      if (!b || !b.length) return null;
      var kurs = b[b.length - 1][1];
      if (!(kurs > 0)) return null;
      var heute = new Date(b[b.length - 1][0]).toISOString().slice(0, 10);
      var ersteHeute = null, letzteGestern = null;
      for (var i = b.length - 1; i >= 0; i--) {
        var tag = new Date(b[i][0]).toISOString().slice(0, 10);
        if (tag === heute) ersteHeute = b[i];
        else { letzteGestern = b[i]; break; }
      }
      var basis = letzteGestern ? letzteGestern[1] : (ersteHeute ? ersteHeute[5] : null);
      return { kurs: kurs, pct: basis > 0 ? (kurs / basis - 1) * 100 : null };
    },
    addWatch: function (sym, name) {
      if (!D) return false;
      var base = window.Dash.STOCKS.map(function (s) { return s.y; });
      if (base.indexOf(sym) !== -1) return 'standard';
      if (!D.watchlist) D.watchlist = [];
      if (D.watchlist.some(function (w) { return w.y === sym; })) return 'schon';
      D.watchlist.push({ y: sym, name: name || sym });
      save();
      renderWatchChips();
      return true;
    }
  };

  /* ================= Datei-Download ================= */
  /** Blob als Datei anbieten und die Objekt-URL wieder freigeben – ohne revokeObjectURL
   *  hält der Renderer jeden je exportierten Datenbestand bis zum Neustart im Speicher. */
  function dateiSpeichern(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  /* ================= CSV-Export ================= */
  function exportCsv() {
    dateiSpeichern(new Blob([csvString()], { type: 'text/csv;charset=utf-8' }),
      'trades-' + new Date().toISOString().slice(0, 10) + '.csv');
  }

  /* ================= Strategie-Labor (Walk-Forward über alle Modi) ================= */
  /* Die Fenster-Rechnung wohnt seit dem dritten Schnitt (Audit 22) in messfenster.js:
   * sieben reine Funktionen, die entscheiden, welche Kerze zum Optimieren, welche zum
   * Auswaehlen und welche zum Belegen zaehlt. Sie fassen nichts an - deshalb liessen
   * sie sich verschieben, waehrend der Rest der Messmaschine hier bleibt (er ruft acht
   * Funktionen dieser Datei auf und schreibt in D). Hier stehen nur noch die Namen. */
  var warmlaufBars = window.Messfenster.warmlaufBars;
  var handelsTage = window.Messfenster.handelsTage;
  var mapSpan = window.Messfenster.mapSpan;
  var tagesGrenze = window.Messfenster.tagesGrenze;
  var tagesScheiben = window.Messfenster.tagesScheiben;
  var sliceMap = window.Messfenster.sliceMap;
  var tageIn = window.Messfenster.tageIn;


  /* Prüfscheiben werden nach HANDELSTAGEN geschnitten, nicht nach Kalenderzeit.
     Vorher lag bei 1-Minuten-Daten (5 Handelstage Historie) regelmäßig eine ganze Scheibe
     im Wochenende – gemessen: Scheibe 2 hatte 0 Bars, Scheibe 3 nur 25 und fiel durch die
     60-Bar-Hürde. Von vier Scheiben blieben zwei übrig, und das Urteil "robust" verlangt
     drei positive – es war schlicht unerreichbar, die Selbst-Optimierung damit wirkungslos. */
  // Hürden für ein belastbares Urteil. Bewusst deutlich höher als früher (12 Trades):
  // Yahoo gibt Intraday nur ~41 Handelstage (5m/15m) bzw. 5 Tage (1m) her – auf 1-Minuten-
  // Daten ist damit KEIN belastbares Urteil möglich, und das soll die App auch so sagen,
  // statt eine Rangliste aus Rauschen zu zeigen.
  var MIN_OOS_TRADES = 30;
  var MIN_OOS_TAGE = 12;



  /** MESS-Universum: bewusst breiter als das HANDELS-Universum. Mehr liquide Werte auf
   *  denselben Handelstagen bedeuten ein Vielfaches an Out-of-Sample-Trades je Messung –
   *  die Belastbarkeits-Huerde (30 Trades / 12 Tage) wird in Tagen erreichbar statt in
   *  Wochen. Gehandelt wird weiterhin nur Watchlist + Standardwerte; der Liquiditaets-
   *  filter in loadLabData sortiert duenne Kandidaten aus. */
  function messUniversum() {
    var syms = universe();
    SCREEN_CANDS.forEach(function (sy) { if (syms.indexOf(sy) === -1) syms.push(sy); });
    /* Bei den belegten 60m-Modi misst die Nacht auf dem HANDELS-Universum
     * (Basis + aktiver Pool), nicht auf der kleinen Screener-Liste - sonst
     * beurteilt die Messung ein anderes Revier, als der Scanner bejagt
     * (vorher: 47 Werte gemessen, 99 gehandelt). */
    if (D.intraday.interval === '60m' && (D.intraday.mode === 'rsi2seit' || D.intraday.mode === 'kapitulation')) {
      var extras = POOLS_60M[D.intraday.pool] || EXTRA_60M;
      extras.forEach(function (sy) { if (syms.indexOf(sy) === -1) syms.push(sy); });
    }
    return syms;
  }

  /* ================= Archiv-Backfill über die Capital.com-Demo-API =================
   * Yahoo reicht rückwirkend nur ~5 Handelstage (1m) zurück – Capital deutlich weiter.
   * Der Backfill blättert je Symbol RÜCKWÄRTS durch die Historie (1000 Kerzen je Anfrage)
   * und speist sie ins Archiv, bis 90 Tage erreicht sind oder das Nacht-Budget aufgebraucht
   * ist. Der Fortschritt verwaltet sich selbst: der früheste Archiv-Zeitstempel ist der
   * Zeiger, jede Nacht geht es dort weiter. Zwei Schutzmaßnahmen:
   *  - CFD-Kerzen laufen fast rund um die Uhr – es werden NUR Kerzen der regulären
   *    US-Handelszeit übernommen, sonst kippen ORB-, VWAP- und Zeitfenster-Logik.
   *  - 250 ms Pause je Anfrage, damit die Demo-API nicht drosselt. */
  async function capBackfill(budget) {
    if (!(window.CapAPI && window.CapAPI.enabled() && window.Archiv)) return { requests: 0, bars: 0, symbole: 0 };
    var stat = { requests: 0, bars: 0, symbole: 0 };
    var ziel = Date.now() - 90 * 86400000;
    var syms = messUniversum();
    var ivs = [{ iv: '5m', barMin: 5 }, { iv: '1m', barMin: 1 }];   // 5m zuerst: 1 Anfrage deckt ~13 Handelstage
    for (var vi = 0; vi < ivs.length && stat.requests < budget; vi++) {
      var iv = ivs[vi].iv, barMin = ivs[vi].barMin;
      for (var si = 0; si < syms.length && stat.requests < budget; si++) {
        var sym = syms[si];
        var serie = await window.Archiv.serie(iv, sym);
        var frueh = serie.length ? serie[0][0] : Date.now();
        if (frueh <= ziel) continue;   // dieses Symbol ist schon voll – nichts zu tun
        var leer = 0, geholt = false;
        while (frueh > ziel && stat.requests < budget && leer < 2) {
          var von = Math.max(ziel, frueh - 1000 * barMin * 60000);
          var bars = await window.CapAPI.pricesRange(sym, iv, von, frueh - 1, 1000);
          stat.requests++;
          if (!bars) break;            // Fehler (Login/Markt unbekannt): Symbol überspringen
          if (!bars.length) { leer++; frueh = von; continue; }
          leer = 0;
          /* Genau der Fall, fuer den istSitzung geschrieben wurde: Capital.com liefert
           * an Feiertagen und nach dem Halbtags-Schluss weiter Kerzen. Hier stand die
           * 390 noch einmal von Hand - eine zweite Regel neben istSitzung, die deren
           * Wochentag- und Feiertagspruefung nicht hatte. */
          var sess = bars.filter(function (b) { return istSitzung(b[0]); });
          if (sess.length) {
            spannenAusKerzen(sym, sess);        // Spanne auswerten, BEVOR das Archiv sie abschneidet
            await window.Archiv.fuege(iv, sym, sess, 'cap'); stat.bars += sess.length; geholt = true;
          }
          frueh = Math.min(von, bars[0][0]);
          await new Promise(function (r) { setTimeout(r, 250); });
        }
        if (geholt) stat.symbole++;
      }
    }
    if (stat.bars) await window.Archiv.speichere(true);
    return stat;
  }

  /* ================= Massen-Backfill (22.08.2026) =================
   * Der naechtliche Backfill oben laeuft mit 250 Anfragen - das fuellt das Archiv
   * ueber Wochen. Fuer die offenen Studien fehlt aber vor allem 1-Minuten-Historie:
   * Yahoo gibt nur 7 Tage, und Felix' Winkel-Detektor (#33) sowie die Dichte-Studie
   * (#36) brauchen 60+ Tage. Capital.com kann das liefern - in einem Rutsch.
   *
   * Bewusst NICHT "die API heiss laufen lassen": Ein zu schneller Lauf wird
   * gedrosselt oder sperrt den Zugang zeitweise, und dann steht alles. Deshalb
   * feste Pause je Anfrage, Abbruch nach mehreren Fehlern in Folge, und ein
   * Fortschritt, der jederzeit anhaltbar ist und beim naechsten Start weiterlaeuft
   * (der Zeiger ist der fruehste Archiv-Stempel je Symbol - er merkt sich alles). */
  var massenLaeuft = false, massenStop = false;
  function massenAbbrechen() { massenStop = true; }
  /** Liegt der Zeitpunkt in einer regulaeren US-Sitzung? Q.minutenSeitOeffnung prueft
   *  nur die UHRZEIT - ein Samstag 14:00 UTC gilt dort als Sitzung. Bei Yahoo-Daten war
   *  das folgenlos (keine Wochenendkerzen), CFD-Daten brauchen den Wochentag dazu. */
  function istSitzung(ms) {
    /* Feiertage und Halbtage kommen aus boerse.js. Nachgezaehlt ueber ein Jahr
     * Stundenkerzen (24.08.2026): Von den Kerzen, die die alte Regel als Sitzung
     * zaehlte, sind 3,85 % Feiertage und 0,38 % liegen nach dem Halbtags-Schluss -
     * zusammen 4,23 %. Bei Yahoo-Daten faellt das kaum auf (dort gibt es an
     * Feiertagen ohnehin keine Kerzen), bei CFD-Daten sehr wohl: Capital.com
     * liefert durch, und genau darum steht dieser Filter hier. */
    var tag = new Date(ms).getUTCDay();
    if (tag === 0 || tag === 6) return false;
    var laenge = (typeof window !== 'undefined' && window.Boerse) ? window.Boerse.sitzungsMinuten(ms) : 390;
    if (!laenge) return false;
    var m = Q.minutenSeitOeffnung(ms);
    return m >= 0 && m < laenge;
  }
  /** Letzter Sitzungsschluss VOR ms. Zieht den Zeiger in einem Schritt ueber Nacht,
   *  Wochenende oder Feiertag - sonst liefe der Backfill diese Pausen bei kleinem
   *  Fenster in dutzenden Leeranfragen ab. */
  function vorherigerSitzungsschluss(ms) {
    var z = ms;
    for (var i = 0; i < 12; i++) {
      var d = new Date(z), tag = d.getUTCDay(), m = Q.minutenSeitOeffnung(z);
      /* Der Kommentar darueber verspricht, ueber Feiertage zu springen - konnte es
       * aber gar nicht: geprueft wurde nur der Wochentag. An einem Feiertag lieferte
       * die Schleife einen "Schluss", den es nie gab, und der Backfill lief die
       * Pause doch in Leeranfragen ab. Jetzt haelt die Zeile, was sie ankuendigt. */
      var laenge = (typeof window !== 'undefined' && window.Boerse) ? window.Boerse.sitzungsMinuten(z) : 390;
      if (tag >= 1 && tag <= 5 && laenge && m >= laenge) return z - (m - laenge) * 60000;
      d.setUTCDate(d.getUTCDate() - 1);
      d.setUTCHours(23, 59, 0, 0);
      z = d.getTime();
    }
    return ms - 86400000;
  }

  /** Einmalige Umstellung: schon geschriebene Capital-Kerzen nachtraeglich kennzeichnen.
   *  Ohne sie rechnete dollarVolTag ihr CFD-Volumen als Boersenvolumen - belegt am
   *  22.08.2026 fuer 63 von 63 Dateien, die dadurch samt und sonders unter die
   *  50-Mio-Schwelle des Liquiditaetsfilters fielen. Immer dieselben Werte, also
   *  eine echte Auswahlverzerrung. */
  async function quellenMigration() {
    if (!window.Archiv || !window.api) return;
    try {
      if (await window.api.storeGet('capQuellenMigriert')) return;
      var epics = (await window.api.storeGet('cap_epics')) || {};
      var syms = Object.keys(epics);
      if (!syms.length) return;                 // nichts von Capital geholt: nichts zu tun
      var tagVon = function (ms) { return new Date(ms).toISOString().slice(0, 10); };
      function tagesVol(bars) {
        var t = {};
        (bars || []).forEach(function (b) { var k = tagVon(b[0]); t[k] = (t[k] || 0) + (b[2] || 0); });
        return t;
      }
      function median(x) { var s = x.slice().sort(function (a, b) { return a - b; }); return s.length ? s[Math.floor(s.length / 2)] : null; }
      var markiert = 0, dateien = 0;
      for (var i = 0; i < syms.length; i++) {
        var sym = syms[i];
        var ref = null;
        try {
          var s60 = await window.Archiv.serie('60m', sym);
          var v60 = Object.keys(tagesVol(s60)).map(function (k) { return tagesVol(s60)[k]; }).filter(function (v) { return v > 0; });
          ref = median(v60);
        } catch (e60) { ref = null; }
        var ivs = ['1m', '5m', '15m'];
        for (var j = 0; j < ivs.length; j++) {
          var iv = ivs[j], serie;
          try { serie = await window.Archiv.serie(iv, sym); } catch (eS) { continue; }
          if (!serie || serie.length < 2) continue;
          var vorhanden = await window.Archiv.bereiche(iv, sym);
          if (vorhanden && vorhanden.length) continue;      // schon gekennzeichnet
          dateien++;
          if (ref == null) {
            // Kein Boersen-Vergleichswert: der Wert kam erst durch den Backfill ins Archiv.
            await window.Archiv.markiere(iv, sym, serie[0][0], serie[serie.length - 1][0]);
            markiert++;
            continue;
          }
          var tv = tagesVol(serie), cfdTage = [];
          Object.keys(tv).forEach(function (k) { if (tv[k] > 0 && tv[k] < ref / 20) cfdTage.push(k); });
          if (!cfdTage.length) continue;
          cfdTage.sort();
          // Die Backfills schreiben ausschliesslich nach hinten (aelter), der CFD-Teil
          // liegt daher zusammenhaengend am Anfang. Ein Bereich genuegt.
          var von = null, bis = null;
          for (var q = 0; q < serie.length; q++) {
            if (cfdTage.indexOf(tagVon(serie[q][0])) !== -1) { if (von == null) von = serie[q][0]; bis = serie[q][0]; }
          }
          if (von != null) { await window.Archiv.markiere(iv, sym, von, bis); markiert++; }
        }
      }
      await window.Archiv.speichere(true);
      await window.api.storeSet('capQuellenMigriert', { am: Date.now(), dateien: dateien, markiert: markiert });
      if (markiert) console.log('Quellen-Umstellung: ' + markiert + ' von ' + dateien + ' Reihen als CFD gekennzeichnet.');
    } catch (e) { /* Umstellung darf den Start nie blockieren */ }
  }
  if (typeof window !== 'undefined') { window.__quellenMigration = quellenMigration; }

  async function massenBackfill(opts) {
    opts = opts || {};
    var el = document.getElementById('massenStatus');
    function melde(t) { if (el) el.textContent = t; }
    if (!(window.CapAPI && window.CapAPI.enabled())) { melde('Capital.com ist nicht verbunden – Zugangsdaten in den App-Einstellungen eintragen und „Verbindung aktivieren“ setzen.'); return null; }
    if (!window.Archiv) { melde('Kursarchiv nicht bereit.'); return null; }
    if (massenLaeuft) { melde('Läuft bereits.'); return null; }
    massenLaeuft = true; massenStop = false;
    var tage = opts.tage || 90;
    /* Reihenfolge bewusst vom billigsten zum teuersten Zeitrahmen: 15m und 5m haben
     * breite Abruffenster und sind schnell durch. 1m braucht ein Vielfaches an Anfragen
     * und ist zugleich der Zeitrahmen, um den es geht - er bekommt so den ganzen Rest
     * des Budgets, statt nur ein Drittel. */
    var ivs = opts.ivs || [{ iv: '15m', barMin: 15 }, { iv: '5m', barMin: 5 }, { iv: '1m', barMin: 1 }];
    /* Universum: Handels-Universum + Nasdaq-100 + aktiver Pool, dedupliziert.
     * Mehr Werte auf denselben Tagen = mehr Out-of-Sample-Trades je Messung. */
    var syms = universe().slice();
    /* ndx100 UND sp100: die Messung vom 23.08.2026 zeigt, dass der Ueberschuss in
     * weniger liquiden Werten nicht schlechter wird - die Verbreiterung braucht nur
     * vorher Daten. Ohne Archiv gehandelt waeren es nie gemessene Werte. */
    ['ndx100', 'sp100'].forEach(function (p) {
      (POOLS_60M[p] || []).forEach(function (s) { if (syms.indexOf(s) === -1) syms.push(s); });
    });
    (POOLS_60M[D.intraday.pool] || []).forEach(function (s) { if (syms.indexOf(s) === -1) syms.push(s); });
    var ziel = Date.now() - tage * 86400000;
    /* Capital begrenzt die Zeitspanne je Anfrage je nach Aufloesung - undokumentiert.
     * Die einmal gefundene Breite wird gespeichert, damit spaetere Laeufe nicht wieder
     * gegen die Wand laufen muessen. */
    var gemerkt = (await window.api.storeGet('cap_fenster')) || {};
    /* Anfragebudget: wird das Fenster klein, steigt die noetige Anfragezahl steil an.
     * Ohne Deckel liefe der Lauf im Extremfall Tage. Der Fortschritt ist gespeichert,
     * ein neuer Lauf setzt dort an - lieber mehrere kurze Laeufe als einer ohne Ende. */
    var budget = opts.maxAnfragen || 15000;
    var stat = { requests: 0, bars: 0, symbole: 0, fehler: 0, start: Date.now(), grund: '' };
    var ohneErfolg = 0;   // Werte in Folge, die keine einzige Kerze lieferten
    /* Capital.com erlaubt 10 Anfragen/Sekunde. Mit 200 ms Pause plus Antwortzeit
     * liegt der Lauf bei rund 2-3/s - genug Abstand, auch wenn nebenher der
     * Intraday-Scan oder die Spannen-Messung eine Anfrage stellt.
     * Groesseres Abruffenster wurde geprueft und VERWORFEN: eine Handelssitzung ist
     * 390 Minuten lang, jedes Fenster ab 390 Kerzen deckt sie bereits ganz ab. Der
     * 1m-Lauf kostet so oder so eine Anfrage je Handelstag. */
    var pause = opts.pauseMs || 200;
    melde('Starte … ' + syms.length + ' Werte × ' + ivs.length + ' Zeitrahmen, Ziel ' + tage + ' Tage.');
    try {
      /* STUFE 0: 60-Minuten-Historie. Die kommt NICHT von Capital, sondern von Yahoo
       * (730 Tage per btRange) - und genau auf ihr rechnet die belegte Kante rsi2seit.
       * Nur Werte, deren Archiv duenner als 400 Kerzen ist; die anderen sind versorgt. */
      if (opts.mit60m !== false) {
        var fehl60 = [];
        for (var f0 = 0; f0 < syms.length; f0++) {
          var s60 = await window.Archiv.serie('60m', syms[f0]);
          if (!s60 || s60.length < 400) fehl60.push(syms[f0]);
        }
        if (fehl60.length) {
          melde('Stufe 0: 60-Minuten-Historie für ' + fehl60.length + ' Werte ohne Archiv (Yahoo, 730 Tage) …');
          var ok60 = 0, fehler60 = 0;
          for (var g0 = 0; g0 < fehl60.length && !massenStop; g0++) {
            var fd60 = null;
            try { fd60 = await fetchIntraday(fehl60[g0], '60m', true); } catch (e60) { fd60 = null; }
            if (fd60 && fd60.series && fd60.series.length > 100) {
              await window.Archiv.fuege('60m', fehl60[g0], fd60.series);
              ok60++;
            } else { fehler60++; }
            if (g0 % 10 === 9) { await window.Archiv.speichere(true); }
            melde('Stufe 0: ' + (g0 + 1) + '/' + fehl60.length + ' · ' + ok60 + ' angelegt · ' +
              fehler60 + ' ohne Daten · ' + fehl60[g0]);
            // Yahoo drosselt bei rund 200 Anfragen in Folge - bewusst langsam
            await new Promise(function (r) { setTimeout(r, 700); });
          }
          await window.Archiv.speichere(true);
          melde('Stufe 0 fertig: ' + ok60 + ' von ' + fehl60.length + ' Werten haben jetzt 60-Minuten-Historie' +
            (fehler60 ? ' (' + fehler60 + ' ohne Daten – bei Yahoo nicht geführt)' : '') + '.');
        }
      }
      for (var vi = 0; vi < ivs.length && !massenStop; vi++) {
        var iv = ivs[vi].iv, barMin = ivs[vi].barMin;
        var fensterMs = gemerkt[iv] || 1000 * barMin * 60000;
        for (var si = 0; si < syms.length && !massenStop; si++) {
          var sym = syms[si];
          if (stat.requests >= budget) {
            melde('Anfragebudget erreicht (' + budget + ' Anfragen, ' +
              Math.round((Date.now() - stat.start) / 60000) + ' Min) – zuletzt bei ' + iv + ' / ' + sym + '.\n' +
              Math.round(stat.bars / 1000) + 'k Kerzen gesichert. Der Fortschritt ist gespeichert:\n' +
              'einfach erneut „jetzt auffüllen" drücken, der Lauf macht genau hier weiter.');
            try { await window.Archiv.speichere(true); } catch (e4) { }
            return stat;
          }
          var serie = await window.Archiv.serie(iv, sym);
          var frueh = serie.length ? serie[0][0] : Date.now();
          if (frueh <= ziel) continue;
          /* Handelspausen werden gesprungen (vorherigerSitzungsschluss), nicht abgelaufen.
           * Leere Fenster bedeuten deshalb: innerhalb einer Sitzung liegt nichts mehr vor.
           * Die Grenze deckt rund eine volle Sitzung ab, ist aber gedeckelt, damit ein
           * kleines Fenster nicht das Anfragebudget aufbraucht. */
          var leerGrenze = Math.max(4, Math.min(24, Math.ceil(8 * 3600000 / fensterMs)));
          var leer = 0, geholt = false, fehlSerie = 0, ohneSitzung = 0, symGrund = '', symArt = '';
          while (frueh > ziel && !massenStop && leer < leerGrenze && fehlSerie < 3 && ohneSitzung < 3) {
            var von = Math.max(ziel, frueh - fensterMs);
            var bars = null;
            var wurf = '';
            try { bars = await window.CapAPI.pricesRange(sym, iv, von, frueh - 1, 1000); }
            catch (eB) { bars = null; wurf = 'Ausnahme: ' + ((eB && eB.message) || eB); }
            stat.requests++;
            if (!bars) {
              var gRoh = wurf || (window.CapAPI.lastPriceError && window.CapAPI.lastPriceError()) || '';
              /* Capital lehnt die Zeitspanne ab. Das ist KEIN Fehlschlag, sondern eine
               * Auskunft ueber die Grenze: Fenster halbieren, merken, gleiche Stelle erneut. */
              if (gRoh.indexOf('invalid.max.daterange') !== -1 && fensterMs > 20 * 60000) {
                fensterMs = Math.floor(fensterMs / 2);
                leerGrenze = Math.max(2, Math.ceil(96 * 3600000 / fensterMs) + 1);
                gemerkt[iv] = fensterMs;
                try { await window.api.storeSet('cap_fenster', gemerkt); } catch (eS) { }
                melde(iv + ': Capital.com lehnt diese Zeitspanne ab – Fenster auf ' +
                  Math.round(fensterMs / 60000) + ' Min verkleinert und gemerkt. Läuft weiter …');
                continue;
              }
              fehlSerie++; stat.fehler++;
              // Den Grund festhalten: vorher gab es nur einen Zaehler, und „3 Fehler"
              // sagt nicht, ob der Markt fehlt, die Sitzung abläuft oder gedrosselt wird.
              symGrund = gRoh || symGrund;
              stat.grund = gRoh || stat.grund;
              // Fehlerart als CODE merken - der Meldungstext ist Anzeige, kein Protokoll.
              symArt = (window.CapAPI.lastErrorKind && window.CapAPI.lastErrorKind()) || symArt;
              // Bei Fehlern langsamer werden statt weiterzuhaemmern - das ist genau
              // die Situation, in der eine Drosselung greift.
              await new Promise(function (r) { setTimeout(r, 1500 * fehlSerie); });
              continue;
            }
            fehlSerie = 0;
            if (!bars.length) {
              leer++;
              frueh = istSitzung(von) ? von : Math.min(von, vorherigerSitzungsschluss(von));
              continue;
            }
            leer = 0;
            var sess = bars.filter(function (b) { return istSitzung(b[0]); });
            if (sess.length) {
              spannenAusKerzen(sym, sess);      // Spanne auswerten, BEVOR das Archiv sie abschneidet
              await window.Archiv.fuege(iv, sym, sess, 'cap'); stat.bars += sess.length; geholt = true; ohneSitzung = 0;
            }
            else {
              /* Kerzen kamen an, aber KEINE lag in der US-Sitzung. Ohne diese Bremse
               * liefe der Wert stumm bis ans Ziel zurueck und stellte hunderte
               * Anfragen, ohne je etwas zu sichern - und ohne einen Fehler zu melden. */
              ohneSitzung++;
              if (ohneSitzung >= 3) {
                stat.grund = sym + ' (' + iv + '): API liefert Kerzen, aber keine innerhalb der US-Handelszeit – ' +
                  'vermutlich ein rund um die Uhr gehandelter Markt (Index/Devisen) statt der Aktie.';
              }
            }
            frueh = Math.min(von, bars[0][0]);
            // Steht der Zeiger jetzt in einer Handelspause, in einem Schritt darueber hinweg.
            if (!istSitzung(frueh)) frueh = Math.min(frueh, vorherigerSitzungsschluss(frueh));
            await new Promise(function (r) { setTimeout(r, pause); });
          }
          /* Ein Wert ohne Kerzen zaehlt als Fehlschlag - egal ob durch Fehler, leere
           * Fenster oder Kerzen ausserhalb der Sitzung. NICHT gezaehlt wird 'kein Markt
           * gefunden': Capital fuehrt nicht jeden Wert als CFD (im DAX-Pool haengen 41
           * .DE-Symbole hintereinander), das ist eine Einzel- und keine Verbindungsstoerung. */
          if (geholt) { stat.symbole++; ohneErfolg = 0; }
          /* Leere Fenster zaehlen bewusst NICHT mit: sie bedeuten meist schlicht
           * 'weiter zurueck gibt die API nichts her'. Beim zweiten Lauf ist das der
           * Normalfall bei JEDEM Wert - mitgezaehlt haette der Lauf sich dann selbst
           * mit der Meldung 'Verbindung gestoert' abgebrochen. */
          else if ((fehlSerie >= 3 || ohneSitzung >= 3) && symArt !== 'kein-markt') { ohneErfolg++; }
          // stat.bars === 0 fasst den Fall 'es lief nie'. Bricht die Verbindung erst
          // mitten im Lauf weg, greift die zweite Schwelle.
          if (ohneErfolg >= 3 && (stat.bars === 0 || ohneErfolg >= 10)) {
            melde('Abgebrochen: ' + ohneErfolg + ' Werte in Folge lieferten keine einzige Kerze' +
              (stat.bars === 0 ? ' und bisher wurde gar nichts gesichert' : '') + '.\n' +
              'Das sieht nach einer gemeinsamen Ursache aus, nicht nach Einzelfällen.\n\nGrund der API: ' +
              (stat.grund || 'kein Fehler gemeldet – die Abrufe kamen leer zurück') +
              '\n\nBitte zuerst „Datenquelle testen" laufen lassen – das zeigt,\n' +
              'an welcher Stelle es klemmt.');
            try { await window.Archiv.speichere(true); } catch (e3) { }
            return stat;
          }
          var minLauf = Math.round((Date.now() - stat.start) / 60000);
          melde(iv + ': Wert ' + (si + 1) + '/' + syms.length + ' (' + sym + ') · ' +
            stat.requests + ' Anfragen · ' + Math.round(stat.bars / 1000) + 'k Kerzen · ' +
            stat.fehler + ' Fehler · ' + minLauf + ' Min' + (massenStop ? ' · wird angehalten …' : '') +
            (stat.grund ? '\nLetzter Fehler: ' + stat.grund : '') +
        (stat.bars === 0 && stat.requests > 0 && !stat.grund
          ? '\n\nEs kam keine einzige Kerze an, ohne dass ein Fehler gemeldet wurde. Entweder ist das\n' +
            'Archiv bereits so tief wie die API reicht – oder das Konto bekommt keine Historie.\n' +
            '„Datenquelle testen" unterscheidet die beiden Fälle.'
          : '') +
        (fensterTxt ? '\nGemessene Zeitspanne je Anfrage: ' + fensterTxt + ' (wird für künftige Läufe behalten).' : ''));
          if (si % 10 === 9) await window.Archiv.speichere(true);   // Zwischenstand sichern
        }
      }
      await window.Archiv.speichere(true);
      var dauer = Math.round((Date.now() - stat.start) / 60000);
      var fensterTxt = Object.keys(gemerkt).map(function (k) {
        return k + ' ' + Math.round(gemerkt[k] / 60000) + ' Min';
      }).join(' · ');
      melde((massenStop ? 'Angehalten' : 'Fertig') + ' nach ' + dauer + ' Min · ' + stat.symbole +
        ' Werte ergänzt · ' + Math.round(stat.bars / 1000) + 'k Kerzen · ' + stat.requests +
        ' Anfragen · ' + stat.fehler + ' Fehler. Der Fortschritt ist gespeichert – ein neuer Lauf setzt dort an.' +
        (stat.grund ? '\nLetzter Fehler: ' + stat.grund : ''));
      return stat;
    } catch (eM) {
      melde('Abgebrochen: ' + ((eM && eM.message) || eM) + ' · Zwischenstand ist gespeichert.');
      try { await window.Archiv.speichere(true); } catch (e2) { }
      return stat;
    } finally {
      massenLaeuft = false;
    }
  }
  if (typeof window !== 'undefined') { window.__massenBackfill = massenBackfill; window.__massenAbbrechen = massenAbbrechen; }

  /** Gestufte Diagnose der Capital.com-Datenquelle.
   *  Grund: massenBackfill konnte bisher nur ZAEHLEN, dass etwas scheitert - jede
   *  Ursache (kein Markt / Sitzung / HTTP / Drosselung) endete im selben stummen null.
   *  Diese Pruefung beantwortet der Reihe nach, WO es klemmt, und misst am Ende
   *  empirisch, wie weit die API je Zeitrahmen ueberhaupt zurueckreicht - die Zahl,
   *  an der haengt, ob Felix' 1m-Studien (#33) machbar sind. */
  async function datenquelleTest(sym) {
    sym = (sym || 'AAPL').toUpperCase();
    var el = document.getElementById('massenStatus');
    var z = [];
    function melde(s) { if (s != null) z.push(s); if (el) el.textContent = z.join('\n'); }

    melde('Prüfe Datenquelle für ' + sym + ' …');

    // 1) Ist die Anbindung überhaupt eingeschaltet?
    if (!(window.CapAPI && window.CapAPI.enabled())) {
      melde('✗ Schritt 1: Capital.com ist in dieser App NICHT aktiv.');
      melde('  → App-Einstellungen: Schlüssel, Kennung und Passwort eintragen UND den Haken');
      melde('    „Verbindung aktivieren" setzen. Ohne den Haken wird keine Anfrage gestellt.');
      return;
    }
    melde('✓ Schritt 1: Anbindung ist eingeschaltet (Demo-Host).');

    // 2) Meldet die Sitzung an?
    var st = await window.CapAPI.status();
    if (!st.ok) {
      melde('✗ Schritt 2: Anmeldung fehlgeschlagen – ' + st.msg);
      melde('  → Häufigste Ursachen: Schlüssel gehört zum LIVE- statt zum Demo-Konto,');
      melde('    das API-Passwort ist nicht das Konto-Passwort, oder der Schlüssel ist abgelaufen.');
      return;
    }
    melde('✓ Schritt 2: ' + st.msg);

    // 3) Wird der Markt gefunden?
    var epic = await window.CapAPI.epicFor(sym);
    if (!epic) {
      melde('✗ Schritt 3: ' + (window.CapAPI.lastPriceError() || 'kein Markt gefunden'));
      return;
    }
    /* epicFor faellt notfalls auf den ersten Suchtreffer zurueck. Bindet es einen Index
     * oder ein Devisenpaar statt der Aktie, laufen dessen Kerzen rund um die Uhr und
     * passen nie zur US-Sitzung - im Auffuell-Lauf genau der stille Leerlauf-Fall. */
    var iName = '', iTyp = '';
    var mres = await window.CapAPI.roh('/markets/' + encodeURIComponent(epic));
    if (mres.ok) {
      try { var mj = JSON.parse(mres.body).instrument || {}; iName = mj.name || ''; iTyp = mj.type || ''; } catch (e) { }
    }
    melde('✓ Schritt 3: Markt gefunden – Epic „' + epic + '"' +
      (iName ? ' = ' + iName : '') + (iTyp ? ' · Typ ' + iTyp : '') + '.');
    if (iTyp && iTyp.indexOf('SHARES') === -1) {
      melde('  ⚠ Das ist KEIN Aktienmarkt. Seine Kerzen laufen rund um die Uhr und fallen');
      melde('    nicht in die US-Sitzung – der Auffüll-Lauf würde für ' + sym + ' nichts sichern.');
    }

    // 4) Was antwortet der Kurs-Endpunkt roh? Hier zählt der Rumpf, nicht nur der Status.
    var roh = await window.CapAPI.roh('/prices/' + encodeURIComponent(epic) + '?resolution=MINUTE&max=5');
    melde('· Schritt 4: HTTP ' + roh.status + ' auf /prices – Antwort: ' +
      String(roh.body || '').replace(/\s+/g, ' ').slice(0, 300));
    if (!roh.ok) {
      melde('✗ Der Kurs-Endpunkt selbst lehnt ab. Der Fehlercode oben ist die Antwort –');
      melde('  bei „limit exceeded" ist es eine Drosselung, sonst fehlt dem Konto das Recht.');
      return;
    }

    // 5) Wie weit reicht die Historie je Zeitrahmen WIRKLICH zurück?
    //    Wochenenden werden übersprungen: eine Stichprobe auf einem Samstag liefert
    //    zu Recht nichts und würde sonst als „Grenze erreicht" fehlgedeutet.
    melde('· Schritt 5: messe die tatsächliche Reichweite je Zeitrahmen …');
    var stufen = [{ iv: '1m', r: 'MINUTE' }, { iv: '5m', r: 'MINUTE_5' }, { iv: '15m', r: 'MINUTE_15' }];
    var proben = [2, 7, 14, 30, 60, 90, 180, 365];
    function werktag(ms) {
      var d = new Date(ms);
      while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
      return d.getTime();
    }
    function iso(ms) { return new Date(ms).toISOString().slice(0, 19); }
    var ergebnis = {};
    for (var si = 0; si < stufen.length; si++) {
      var s = stufen[si], tiefe = 0, leerFolge = 0, httpFehler = 0, gestoert = false;
      for (var pi = 0; pi < proben.length; pi++) {
        var tag = werktag(Date.now() - proben[pi] * 86400000);
        // 14–18 UTC: im Sommer (Sitzung 13:30–20:00 UTC) ganz innerhalb, im Winter
        // (14:30–21:00 UTC) mit 3,5 h Überlappung – in beiden Fällen genug für ein Urteil.
        var von = new Date(tag); von.setUTCHours(14, 0, 0, 0);
        var bis = new Date(tag); bis.setUTCHours(18, 0, 0, 0);
        var r = await window.CapAPI.roh('/prices/' + encodeURIComponent(epic) +
          '?resolution=' + s.r + '&from=' + iso(von.getTime()) + '&to=' + iso(bis.getTime()) + '&max=1000');
        /* Ein HTTP-Fehler ist KEIN Messergebnis. Wuerde er wie „keine Daten" zaehlen,
         * wiese ausgerechnet dieses Werkzeug eine Drosselung als Historiengrenze aus. */
        if (!r.ok) {
          httpFehler++;
          melde('    ' + s.iv + ' bei ' + proben[pi] + ' Tagen: HTTP ' + r.status +
            ' – ' + String(r.body || '').replace(/\s+/g, ' ').slice(0, 140));
          await new Promise(function (res) { setTimeout(res, 1500 * httpFehler); });
          if (httpFehler >= 2) { gestoert = true; break; }
          continue;
        }
        var n = -1;
        try { n = (JSON.parse(r.body).prices || []).length; } catch (e) { n = -1; }
        if (n > 0) { tiefe = proben[pi]; leerFolge = 0; httpFehler = 0; }
        else if (++leerFolge >= 2) break;   // zweimal nichts hintereinander = Grenze erreicht
        await new Promise(function (res) { setTimeout(res, 250); });
      }
      ergebnis[s.iv] = gestoert ? null : tiefe;
      melde('    ' + s.iv + ': ' + (gestoert
        ? 'Messung abgebrochen (die API lehnte zweimal ab) – Tiefe UNBEKANNT, nicht „kurz".'
        : 'Historie reicht ' + (tiefe ? 'mindestens ' + tiefe + ' Tage zurück' : 'NICHT einmal 2 Tage zurück')));
    }

    melde('');
    function tg(v) { return v == null ? 'unbekannt' : v + ' T'; }
    melde('Ergebnis: 1m ' + tg(ergebnis['1m']) + ' · 5m ' + tg(ergebnis['5m']) + ' · 15m ' + tg(ergebnis['15m']) + '.');
    if (ergebnis['1m'] == null) melde('→ Für #33 keine Aussage möglich – die Messung wurde gestört. Später erneut prüfen.');
    else if (ergebnis['1m'] >= 60) melde('→ Reicht für Felix\' Winkel-Detektor (#33, braucht 60+ Tage 1m).');
    else if (ergebnis['1m'] > 0) melde('→ Für #33 (60+ Tage 1m) zu kurz; 1m bleibt beim laufenden Sammeln.');
    else melde('→ Die API gibt für ' + sym + ' gar keine 1-Minuten-Historie her; #33 bleibt beim laufenden Sammeln.');
    melde('Der Auffüll-Lauf sollte nur bis zu diesen Tiefen anfragen – alles darüber sind sichere Fehlschläge.');
    return ergebnis;
  }
  if (typeof window !== 'undefined') { window.__datenquelleTest = datenquelleTest; }


  async function loadLabData(st) {
    var cfg = D.intraday;
    // 60m mit dabei: Yahoo liefert dafuer ~3 Monate Historie, und die Kostenrechnung
    // (Round-Trip ~6,5 % auf den Schein) geht erst bei laengeren Haltedauern auf.
    var intervals = ['1m', '5m', '15m', '60m'];
    var data = {};
    var symsL = messUniversum();
    for (var ii = 0; ii < intervals.length; ii++) {
      var mapL = {}, doneLab = 0;
      var ivLab = intervals[ii];
      await pmap(symsL, async function (sy) {
        // Frisch von Yahoo holen und ins Archiv einpflegen – gemessen wird dann auf der
        // ZUSAMMENGEFÜHRTEN Serie (Archiv ∪ frischer Abruf). Am ersten Tag ist das identisch
        // mit dem Yahoo-Fenster; danach wächst die Messbasis mit jedem Handelstag weiter
        // (rollierend bis 90 Kalendertage), auch auf 1m, wo Yahoo nur ~5 Tage zurückreicht.
        var fdL = await fetchIntraday(sy, ivLab, true);
        doneLab++;
        if (st) st.textContent = 'Lade ' + ivLab + '-Historie … (' + doneLab + '/' + symsL.length + ')';
        var serie = null, dv = null;
        if (window.Archiv) {
          if (fdL && fdL.series.length) await window.Archiv.fuege(ivLab, sy, fdL.series);
          serie = await window.Archiv.serie(ivLab, sy);
          // Ohne die Bereiche rechnete dollarVolTag CFD-Volumen als Boersenvolumen und
          // warf die betroffenen Werte stumm aus dem Messlauf (belegt: 63 von 63).
          var berL = await window.Archiv.bereiche(ivLab, sy);
          dv = (fdL && fdL.dollarVolDay != null) ? fdL.dollarVolDay : window.Archiv.dollarVolTag(serie, berL);
        }
        if (!serie || serie.length <= 200) { serie = fdL ? fdL.series : null; dv = fdL ? fdL.dollarVolDay : null; }
        if (serie && serie.length > 200) {
          if (!cfg.minDollarVol || dv == null || dv >= cfg.minDollarVol * 1e6) mapL[sy] = serie;
        }
      }, 6);
      data[ivLab] = mapL;
    }
    if (window.Archiv) await window.Archiv.speichere(true);   // Messlauf = guter Moment zum Sichern
    return { intervals: intervals, data: data };
  }

  function labCommonOpts(cfg, iv) {
    var prof = Q.PROFILES[cfg.profile] || Q.PROFILES.atm21;
    return {
      capital: START_CAPITAL, budgetPct: cfg.budgetPct, orderFee: cfg.orderFee,
      // Gemessen wird IMMER auf dem ganzen Handelstag: Erbte die Messung das eingestellte
      // Zeitfenster (z. B. open2), sah sie nur Trades aus diesen Stunden - die Diagnose
      // 'bestes Zeitfenster' konnte dann nie etwas anderes empfehlen als das, was schon
      // eingestellt war. Das beste Fenster wird aus den Out-of-Sample-Trades ERMITTELT.
      window: 'all', lineType: cfg.lineType || 'ema',
      otmPct: prof.otmPct, expiryDays: prof.days, ratio: prof.ratio || Q.RATIO, minEdge: 1.5,
      mtf: iv === '1m' && cfg.mtf !== false,
      riskPct: parseFloat(cfg.sizing) > 0 ? parseFloat(cfg.sizing) : 0
    };
  }
  /** Die vier Kandidaten: zwei Setups mit je zwei Auslösern.
   *  Bewusst wenige – jeder zusätzliche Kandidat kostet Aussagekraft, weil der beste
   *  von vielen zufällig gut aussehen kann (Mehrfachvergleich). */
  function labModes(cfg) {
    var slV = (cfg.scalpSL === "auto" ? "auto" : -(cfg.scalpSL || 20) / 100);
    var kanal = cfg.channel !== false;
    var MODESL = [
      { key: 'breakout', setup: 'ausbruch', trigger: 'kreuzung', name: 'Ausbruch · EMA-Kreuzung',
        opts: cfg.exitStyle === 'blitz'
          ? { entryMode: 'cross', exitMode: 'blitz', sl: slV, tp: null, trailPct: 0.10, maxHoldMin: 3,
              cooldownMin: 2, maxPerDay: 40, trendFilter: !!cfg.trendFilter }
          : { entryMode: 'cross', exitMode: cfg.exitStyle === 'kurz' ? 'recross' : 'confirmed',
              sl: cfg.exitStyle === 'kurz' ? slV : -0.25, tp: cfg.exitStyle === 'kurz' ? null : 0.35,
              trailPct: cfg.exitStyle === 'kurz' ? (cfg.scalpTrail || 0) / 100 : 0,
              maxHoldMin: cfg.exitStyle === 'kurz' ? (cfg.scalpHold || 60) : 0,
              cooldownMin: cfg.exitStyle === 'kurz' ? 5 : 45, maxPerDay: cfg.exitStyle === 'kurz' ? 40 : 10,
              trendFilter: !!cfg.trendFilter } },
      { key: 'orb', setup: 'ausbruch', trigger: 'range', name: 'Ausbruch · Eröffnungs-Range',
        opts: { entryMode: 'orb', exitMode: 'confirmed', orbMin: 30, sl: (cfg.scalpSL === "auto" ? "auto" : -0.25),
          tp: null, trailPct: 0.15, maxHoldMin: 0, cooldownMin: 10, maxPerDay: 10 } },
      { key: 'reversion', setup: 'umkehr', trigger: 'ueberdehnung', name: 'Umkehr · Überdehnung',
        opts: { entryMode: 'reversion', sl: slV, tp: null, trailPct: 0, maxHoldMin: cfg.scalpHold || 60,
          cooldownMin: 5, maxPerDay: 40 } },
      { key: 'wave', setup: 'umkehr', trigger: 'welle', name: 'Umkehr · Wellental' + (kanal ? ' + Kanal' : ''),
        opts: { entryMode: 'wave', channel: kanal, sl: slV, tp: null, trailPct: 0, maxHoldMin: cfg.scalpHold || 60,
          cooldownMin: 3, maxPerDay: 40, trendFilter: true, minQuality: 60 } }
    ];
    // Fährt der Nutzer Blitz/kurz, erbt der Ausbruch-Kandidat diesen schnellen Ausstieg -
    // die Variante mit Stop/Ziel über Stunden käme sonst NIE ins Rennen. Die Messung von
    // heute zeigt aber: je länger die Haltedauer, desto kleiner der Verlust - genau diese
    // Richtung muss mitgemessen werden.
    MODESL.push({ key: 'pullback', setup: 'ausbruch', trigger: 'ruecksetzer', name: 'Ausbruch · Trend-Rücksetzer',
      meta: { scalpHold: 240, scalpTrail: 15 },
      opts: { entryMode: 'pullback', exitMode: 'confirmed', sl: slV, tp: null, trailPct: 0.15, maxHoldMin: 240,
        cooldownMin: 10, maxPerDay: 10, trendFilter: false } });
    // Lang-Varianten: gleiche Einstiege, aber 4 h Haltedauer und weiter Stop. Die erste
    // belastbare Messung zeigte: je länger die Haltedauer, desto kleiner der Verlust -
    // diese Richtung muss als eigener Kandidat mitlaufen.
    MODESL.push({ key: 'reversion_lang', setup: 'umkehr', trigger: 'ueberdehnung', name: 'Umkehr · Überdehnung · lang (4 h)',
      meta: { scalpHold: 240, scalpSL: 30 },
      opts: { entryMode: 'reversion', sl: -0.30, tp: null, trailPct: 0, maxHoldMin: 240, cooldownMin: 10, maxPerDay: 20 } });
    MODESL.push({ key: 'wave_lang', setup: 'umkehr', trigger: 'welle', name: 'Umkehr · Wellental · lang (4 h)' + (kanal ? ' + Kanal' : ''),
      meta: { scalpHold: 240, scalpSL: 30 },
      opts: { entryMode: 'wave', channel: kanal, sl: -0.30, tp: null, trailPct: 0, maxHoldMin: 240,
        cooldownMin: 10, maxPerDay: 20, trendFilter: true, minQuality: 60 } });
    MODESL.push({ key: 'rsi2', setup: 'umkehr', trigger: 'rsi2', name: 'Umkehr · RSI(2)-Extrem (Connors)',
      meta: { scalpHold: 240, scalpSL: 30 },
      opts: { entryMode: 'rsi2', exitMode: 'target', sl: -0.30, tp: null, trailPct: 0, maxHoldMin: 240, cooldownMin: 10, maxPerDay: 20 } });
    MODESL.push({ key: 'donchian', setup: 'ausbruch', trigger: 'donchian', name: 'Ausbruch · Donchian-Kanal',
      meta: { scalpSL: 30, scalpTrail: 15 },
      fixedGrid: [{ period: 20, confirmBps: 10, zThr: 2, lineType: 'ema' }, { period: 55, confirmBps: 10, zThr: 2, lineType: 'ema' }],
      opts: { entryMode: 'donchian', exitMode: 'confirmed', sl: -0.30, tp: null, trailPct: 0.15, maxHoldMin: 0, cooldownMin: 30, maxPerDay: 10 } });
    MODESL.push({ key: 'squeeze', setup: 'ausbruch', trigger: 'squeeze', name: 'Ausbruch · Bollinger-Squeeze',
      meta: { scalpHold: 240, scalpSL: 30, scalpTrail: 15 },
      fixedGrid: [{ period: 20, confirmBps: 15, zThr: 2, lineType: 'ema' }],
      opts: { entryMode: 'squeeze', exitMode: 'confirmed', sl: -0.30, tp: null, trailPct: 0.15, maxHoldMin: 240, cooldownMin: 30, maxPerDay: 10 } });
    /* Die beiden Funde der Bedingungsstudie vom 21.08.2026 - als Kandidaten mit ihrem
     * RICHTIGEN Instrument: Basiswert, nur Long, Zeit-Ausstieg, haelt ueber Nacht.
     * Auf dem Schein gemessen waeren beide tot (Huerde 0,21 % gegen Edge 0,15-0,23 %);
     * der Pruefstand soll sie mit den Kosten messen, die sie wirklich zahlen. */
    MODESL.push({ key: 'rsi2seit', setup: 'umkehr', trigger: 'rsi2seit', name: 'Umkehr · RSI(2) im Seitwärtskanal · nur Long · Basiswert',
      meta: { scalpHold: 480 },
      opts: { entryMode: 'rsi2seit', exitMode: 'zeit', sl: -0.90, tp: null, trailPct: 0, maxHoldMin: 480,
        cooldownMin: 120, maxPerDay: 10, instrument: 'basis', basisBp: 5, nurRichtung: 'call', tagesschluss: false } });
    MODESL.push({ key: 'kapitulation', setup: 'umkehr', trigger: 'kapitulation', name: 'Umkehr · Kapitulations-Dip im Abwärtskanal · nur Long · Basiswert',
      meta: { scalpHold: 1560 },
      opts: { entryMode: 'kapitulation', exitMode: 'zeit', sl: -0.90, tp: null, trailPct: 0, maxHoldMin: 1560,
        cooldownMin: 240, maxPerDay: 6, instrument: 'basis', basisBp: 10, nurRichtung: 'call', tagesschluss: false } });
        if (cfg.exitStyle === 'blitz' || cfg.exitStyle === 'kurz') {
      MODESL.push({ key: 'breakout_lauf', setup: 'ausbruch', trigger: 'kreuzung', name: 'Ausbruch · EMA-Kreuzung · laufen lassen',
        opts: { entryMode: 'cross', exitMode: 'confirmed', sl: -0.25, tp: 0.35, trailPct: 0, maxHoldMin: 0,
          cooldownMin: 45, maxPerDay: 10, trendFilter: !!cfg.trendFilter } });
    }
    /* WAECHTER-MODUS (21.08.2026): Faehrt der Nutzer eine BELEGTE Strategie,
     * misst die Nacht nicht mehr das Setup-Roulette der widerlegten Familie
     * (Breakout, Squeeze, Wave, Donchian ... - alle ohne gemessenen Vorsprung).
     * Genau diese Rangfolgen aus Walk-Forward-Renditen auf kurzen Fenstern haben
     * frueher Scheinsieger wie 'Bollinger-Squeeze +4,79 %' gekuert. Stattdessen
     * treten nur noch die belegten Modi mit ihren wenigen sinnvollen
     * Stellschrauben an (Haltedauer-Varianten). Wer bewusst ein anderes Setup
     * faehrt, bekommt weiterhin die volle Liste. */
    if (cfg.mode === 'rsi2seit' || cfg.mode === 'kapitulation') {
      var belegt = MODESL.filter(function (m) { return m.key === 'rsi2seit' || m.key === 'kapitulation'; });
      var basisK = belegt.filter(function (m) { return m.key === 'rsi2seit'; })[0];
      if (basisK) {
        [360, 600].forEach(function (hold) {
          belegt.push({ key: 'rsi2seit_h' + hold, setup: 'umkehr', trigger: 'rsi2seit',
            name: 'Umkehr · RSI(2) im Seitwärtskanal · Haltedauer ' + (hold / 60) + ' h',
            meta: { scalpHold: hold },
            opts: Object.assign({}, basisK.opts, { maxHoldMin: hold }) });
        });
      }
      return belegt;
    }
    return MODESL;
  }

  /** Walk-Forward über alle Modi × Zeitrahmen. Rückgabe: sortierte Ergebnisliste. */
  async function labCompute(ld, st) {
      var cfg = D.intraday;
      var intervals = ld.intervals;
      var data = ld.data;
      var MODES = labModes(cfg);
      // KI-Vorschlag der letzten Nacht: laeuft als markierter Kandidat mit - gemessen wie
      // alle anderen, mit festen Parametern und nur auf seinem eigenen Zeitrahmen.
      var entd = (D.autoOpt || {}).entdeckt;
      if (entd && entd.opts && entd.interval) {
        MODES.push({ key: 'entdeckt', setup: entd.setup, trigger: entd.trigger,
          name: 'Tiefensuche-Fund: ' + entd.name, nurInterval: entd.interval,
          meta: { kiBase: entd.basis, scalpHold: entd.scalpHold, scalpSL: entd.scalpSL, profile: entd.profile },
          fixedGrid: [{ period: entd.period, confirmBps: entd.confirmBps, zThr: zOf(entd.confirmBps), lineType: entd.lineType }],
          opts: entd.opts });
      }
      /* Der KI-Vorschlag stand hier als eigener Modus in der Auswahl und konnte damit
       * den Waechter-Modus unterlaufen - der Autopilot durfte von der belegten Kante
       * wegschalten. Zusammen mit dem uebrigen KI-Pfad entfernt (23.08.2026). */
      /* Fenster fuer die Vorauswahl. Gewaehlt so, dass jeder Zeitrahmen genug
       * Handelstage fuer neun Walk-Forward-Scheiben behaelt, ohne dass die Rechnung
       * explodiert. Der Sieger wird anschliessend auf der VOLLEN Historie geprueft. */
      var SCREEN_TAGE = { '1m': 7, '5m': 30, '15m': 60, '60m': 260 };
      /* Zum RANGORDNEN reicht eine Stichprobe der Werte - es geht nur darum, welche
       * Setups ueberhaupt in Frage kommen, nicht um die genaue Rendite. Der Sieger wird
       * anschliessend auf ALLEN Werten und der vollen Historie geprueft; erst daran
       * entscheidet sich, ob er robust ist.
       * Die Stichprobe ist bewusst NICHT zufaellig, sondern jeder n-te Wert der
       * alphabetisch sortierten Liste: so misst jeder Lauf dieselben Werte und die
       * Ranglisten zweier Naechte sind vergleichbar. Eine zufaellige Auswahl haette
       * genau die Vergleichbarkeit zerstoert, auf der die Zwei-Naechte-Regel beruht. */
      var SCREEN_WERTE = 16;
      function screenWerte(m) {
        var syms = Object.keys(m).sort();
        if (syms.length <= SCREEN_WERTE) return m;
        var schritt = syms.length / SCREEN_WERTE, out = {};
        for (var i4 = 0; i4 < SCREEN_WERTE; i4++) {
          var sy4 = syms[Math.floor(i4 * schritt)];
          if (sy4) out[sy4] = m[sy4];
        }
        return Object.keys(out).length >= 3 ? out : m;
      }
      function screenMap(m, iv3) {
        var max = SCREEN_TAGE[iv3];
        if (!max) return m;
        var tage = handelsTage(m);
        if (tage.length <= max) return m;
        var abTag = tage[tage.length - max];
        var ab = new Date(abTag + 'T00:00:00Z').getTime();
        var out = {};
        Object.keys(m).forEach(function (sy3) {
          var teil = m[sy3].filter(function (b3) { return b3[0] >= ab; });
          if (teil.length > 200) out[sy3] = teil;
        });
        return Object.keys(out).length >= 3 ? out : m;
      }
      /* period hat gemessen 0,18 Prozentpunkte Wirkung - drei Stufen im Screening waren
       * verschwendete Rechenzeit. Zwei genuegen, um grobe Fehlgriffe auszuschliessen. */
      var GRID = [];
      [14, 30].forEach(function (p) { [5, 15].forEach(function (c) { GRID.push({ period: p, confirmBps: c, zThr: zOf(c) }); }); });

      var results = [];
      var total = MODES.length * intervals.length, done = 0;
      var tLab = Date.now(), LAB_MS = 18 * 60000, uebersprungen = 0;
      for (var mi = 0; mi < MODES.length; mi++) {
        for (var vi = 0; vi < intervals.length; vi++) {
          done++;
          var iv = intervals[vi];
          if (MODES[mi].nurInterval && MODES[mi].nurInterval !== iv) continue;
          var mapVoll = data[iv];
          if (!mapVoll || Object.keys(mapVoll).length < 3) continue;
          var map = screenWerte(screenMap(mapVoll, iv));
          var commonIv = labCommonOpts(cfg, iv);
          // Zeitbudget: was nicht mehr reinpasst, wird GEMELDET statt still weggelassen.
          if (Date.now() - tLab > LAB_MS) {
            uebersprungen++;
            if (st) st.textContent = 'Zeitbudget der Vorauswahl erreicht – ' + uebersprungen + ' Kandidaten uebersprungen.';
            continue;
          }
          if (st) st.textContent = 'Walk-Forward ' + MODES[mi].name + ' · ' + iv + ' (' + done + '/' + total + ') …';
          await new Promise(function (r) { setTimeout(r, 20); });
          var span = mapSpan(map);
          if (!(span[1] > span[0])) continue;
          // Scheibenzahl waechst mit dem Archiv: bei 40 Handelstagen 5 Scheiben (4 Pruef-
          // scheiben), bei 90 Tagen 9 - mehr ungesehene Abschnitte = stabilere Urteile.
          var tageGesamt = handelsTage(map).length;
          var nScheiben = Math.min(9, Math.max(5, Math.floor(tageGesamt / 9) + 1));
          var scheiben = tagesScheiben(map, nScheiben);
          if (scheiben.length < nScheiben) continue;   // zu wenig Handelstage für einen Walk-Forward
          var oosMax = nScheiben - 1;
          var oosTage = 0;
          var foldRets = [], oosTrades = [], lastBest = null, haltenRets = [];
          for (var f = 1; f <= oosMax; f++) {
            var trainEnd = scheiben[f].von;
            var testEnd = scheiben[f].bis;
            oosTage += scheiben[f].tage;
            /* Der Massstab fuer genau diese ungesehene Scheibe. */
            var hR = haltenUeberScheibe(map, scheiben[f].von, scheiben[f].bis);
            if (hR != null) haltenRets.push(hR);
            // Parameter auf den bisherigen Daten bestimmen …
            var best = null;
            var trainMap = sliceMap(map, span[0], trainEnd, 0);
            var GRIDM = MODES[mi].fixedGrid || GRID;
            var gridRes = await Promise.all(GRIDM.map(function (g0) {
              return btIntraday(trainMap, Object.assign({}, commonIv, MODES[mi].opts, g0));
            }));
            GRIDM.forEach(function (g0, gi) {
              var rT = gridRes[gi];
              if (!rT || rT.error || rT.summary.nTrades < 4) return;
              if (!best || rT.summary.retPct > best.ret) best = { grid: g0, ret: rT.summary.retPct };
            });
            if (!best) { foldRets.push(null); continue; }
            lastBest = best.grid;
            // … und NUR auf der nächsten, ungesehenen Scheibe anwenden
            var optsA = Object.assign({}, commonIv, MODES[mi].opts, best.grid);
            var rA = await btIntraday(sliceMap(map, trainEnd, testEnd, warmlaufBars(iv)), optsA);
            if (rA.error) { foldRets.push(null); continue; }
            var tr = (rA.trades || []).filter(function (x) { return x.openT >= trainEnd; });
            var pnl = tr.reduce(function (a, x) { return a + x.pnl; }, 0);
            foldRets.push(Math.round(pnl / START_CAPITAL * 10000) / 100);
            oosTrades = oosTrades.concat(tr);
            await new Promise(function (r) { setTimeout(r, 10); });
          }
          var valid = foldRets.filter(function (x) { return x !== null; });
          if (!valid.length) continue;
          var wfRet = Math.round(valid.reduce(function (a, b) { return a + b; }, 0) * 100) / 100;
          /* Was Nichtstun im selben Zeitraum gebracht haette. */
          var haltenPct = haltenRets.length
            ? Math.round(haltenRets.reduce(function (a, b) { return a + b; }, 0) * 100) / 100 : null;
          var posSegs = valid.filter(function (x) { return x > 0; }).length;
          var wins = oosTrades.filter(function (x) { return x.pnl > 0; }).length;
          var gw = 0, gl = 0;
          oosTrades.forEach(function (x) { if (x.pnl > 0) gw += x.pnl; else gl += -x.pnl; });
          var pf = gl > 0 ? Math.round(gw / gl * 100) / 100 : (gw > 0 ? 99 : 0);
          // Belastbarkeit ehrlich prüfen: Eine Rangfolge aus 3 Trades ist keine Messung,
          // sondern eine Münzwurf-Serie mit Nachkommastellen. Es braucht BEIDES – genug
          // Trades UND genug ungesehene Handelstage, sonst gibt es kein Urteil.
          var duenn = oosTrades.length < MIN_OOS_TRADES || oosTage < MIN_OOS_TAGE || valid.length < 3;
          // E1: Bootstrap-Gegenprobe - 400 Neuziehungen der Trades; ist die Verlust-
          // Wahrscheinlichkeit hoch, ist ein positiver Walk-Forward noch kein Beleg.
          var bsOOS = oosTrades.length >= 10 ? Q.bootstrapTrades(oosTrades, START_CAPITAL) : null;
          // E2: Richtungs-Bilanz - manche Setups tragen nur in eine Richtung
          var rCall = { n: 0, pnl: 0 }, rPut = { n: 0, pnl: 0 };
          oosTrades.forEach(function (x) { var r3 = x.dir === 'call' ? rCall : rPut; r3.n++; r3.pnl += x.pnl; });
          var robustSchwelle = Math.ceil(oosMax * 0.7);
          /* Bis zum 24.08.2026 hiess "robust" nur: positive Rendite. Ohne Massstab
           * ist das in einem steigenden Markt fast geschenkt. Jetzt muss die
           * Strategie das Halten schlagen - und wer alle anderen Huerden nimmt,
           * aber darunter bleibt, wird nicht verschwiegen, sondern eingeordnet. */
          var schlaegtHalten = haltenPct == null || wfRet > haltenPct;
          var sonstRobust = wfRet > 0 && posSegs >= robustSchwelle && pf > 1 && (!bsOOS || bsOOS.lossProb <= 45);
          var verdict = duenn
            ? ('nicht belastbar (' + oosTrades.length + ' Trades auf ' + oosTage + ' ungesehenen Handelstagen, ' + valid.length + '/' + oosMax + ' Scheiben)')
            : (sonstRobust && schlaegtHalten) ? 'robust'
            : sonstRobust ? ('unter Halten (' + wfRet + ' % gegen ' + haltenPct + ' % fuers Nichtstun)')
            : (wfRet > 0 || posSegs >= Math.ceil(oosMax / 2)) ? 'gemischt' : 'kein Vorteil';
          results.push({
            mode: MODES[mi], interval: iv, wfRet: wfRet, foldRets: foldRets, posSegs: posSegs,
            haltenPct: haltenPct, schlaegtHalten: schlaegtHalten,
            n: oosTrades.length, winRate: oosTrades.length ? Math.round(wins / oosTrades.length * 100) : 0,
            pf: pf, verdict: verdict, best: lastBest, trades: oosTrades,
            oosTage: oosTage, scheibenGueltig: valid.length, belastbar: !duenn,
            scheibenMax: oosMax, bootLossProb: bsOOS ? bsOOS.lossProb : null,
            callN: rCall.n, callPnl: Math.round(rCall.pnl * 100) / 100,
            putN: rPut.n, putPnl: Math.round(rPut.pnl * 100) / 100
          });
        }
      }
      results.sort(function (a, b) {
        var aB = a.belastbar ? 1 : 0, bB = b.belastbar ? 1 : 0;
        if (aB !== bB) return bB - aB;                 // belastbar schlägt unbelastbar
        return b.wfRet - a.wfRet;
      });
      results.uebersprungen = uebersprungen;   // ehrlich weiterreichen, nicht still schlucken
      results.screenTage = SCREEN_TAGE;
      results.screenWerte = SCREEN_WERTE;
      /* MEHRFACHVERGLEICH. Hier werden 14 Modi x 4 Zeitrahmen geprueft und der Beste
       * gekuert - auf denselben Scheiben. Bei 56 Versuchen hat der Sieger auch dann
       * eine ordentliche Rendite, wenn KEIN einziger Kandidat etwas kann: das Maximum
       * aus 56 Ziehungen liegt immer deutlich ueber dem Mittel. Genau dafuer gibt es
       * bestOfN (quant.js) - es simuliert, wie gut der Beste aus n reinen Zufalls-
       * kandidaten derselben Streuung ausfaellt, und sagt, ob der echte Sieger das
       * ueberhaupt schlaegt. Die Funktion war da und wurde hier nie aufgerufen. */
      results.zufall = Q.bestOfN(results.filter(function (r0) { return r0.belastbar; })
                                        .map(function (r0) { return r0.wfRet; }));
      return results;
  }

  /* ================= Analyse-Zentrale ================= */
  var centralRunning = false;
  /** opts: {silent:true, status:fn} → rechnet ohne UI und meldet den Fortschritt per Callback. */
  async function runCentral(opts) {
    opts = (opts && typeof opts === 'object' && !opts.type) ? opts : {};
    var silent = !!opts.silent;
    if (centralRunning) return null;
    centralRunning = true;
    var dummy = { textContent: '', innerHTML: '', disabled: false };
    // Den Knopf 'centralBtn' gibt es seit der Umstellung auf den Autopiloten nicht mehr -
    // runCentral wird nur noch programmgesteuert aufgerufen. Der Platzhalter bleibt, damit
    // die btn.disabled-Zuweisungen weiter unten nicht ins Leere greifen.
    var btn = Object.assign({}, dummy);
    var out = (!silent && document.getElementById('centralResult')) || Object.assign({}, dummy);
    var st = silent
      ? { set textContent(v) { if (opts.status) opts.status(v); }, get textContent() { return ''; } }
      : Object.assign({}, dummy);
    btn.disabled = true;
    try {
      var cfg = D.intraday;
      out.innerHTML = '<div class="loading">Schritt 1/3: alle Setups × Zeitrahmen (inkl. 60m) per Walk-Forward prüfen …</div>';
      var ld = await loadLabData(st);
      var results = await labCompute(ld, st);
      st.textContent = '';
      if (results.uebersprungen) {
        st.textContent = 'Hinweis: ' + results.uebersprungen + ' Kandidaten kamen im Zeitbudget nicht dran.';
      }
      if (!results.length) { out.innerHTML = '<div class="empty"><span class="ico"></span>Zu wenig Daten für eine Analyse.</div>'; return null; }
      var top = results[0];

      // Schritt 2: Feinschliff für den Gewinner (Grid, 70/30 out-of-sample)
      out.innerHTML = '<div class="loading">Schritt 2/3: Feinschliff für ' + U.esc(top.mode.name) + ' · ' + top.interval + ' (18 Kombinationen parallel) …</div>';
      var map = ld.data[top.interval];
      /* DREI Scheiben, nicht zwei. Vorher lief es 70/30: auf den 70 % wurden 90
       * Kombinationen optimiert, und dieselbe 30-%-Scheibe entschied DANN, ob der
       * Feinschliff genommen wird (useFine), und lieferte ZUGLEICH die Filter-Bilanz,
       * die als Beleg berichtet wurde. Eine Scheibe kann aber nicht beides sein: wer
       * auf ihr auswaehlt, hat sie gesehen - ihre Zahlen sind dann kein Beleg mehr,
       * sondern Teil der Optimierung.
       *   0-70 %   trainMap  - hier werden die 90 Kombinationen optimiert
       *   70-85 %  wahlMap   - hier faellt die Entscheidung, ob der Feinschliff gilt
       *   85-100 % belegMap  - wird NUR berichtet, entscheidet nichts
       * Die Belegscheibe ist die kleinste, und das ist richtig so: sie muss nichts
       * optimieren, sie muss nur unberuehrt sein. */
      var span = mapSpan(map);
      var cut = tagesGrenze(map, 0.7) || (span[0] + (span[1] - span[0]) * 0.7);   // 70 % der HANDELSTAGE
      var cut2 = tagesGrenze(map, 0.85) || (span[0] + (span[1] - span[0]) * 0.85);
      var trainMap = sliceMap(map, span[0], cut, 0);
      var wahlMap = sliceMap(map, cut, cut2, warmlaufBars(top.interval));
      var belegMap = sliceMap(map, cut2, span[1], warmlaufBars(top.interval));

      var commonIv = labCommonOpts(cfg, top.interval);
      // Schein-Profil als eigene Dimension: ATM (moderater Hebel) gegen das eingestellte
      // Profil - der Hebel bestimmt, wie viel Basiswert-Bewegung die Kosten decken muss.
      // Schein-Profil inklusive Bezugsverhaeltnis ist die WICHTIGSTE Kostendimension:
      // BV 1,0 zahlt nur ein Fuenftel des relativen Spreads bei identischem Hebel.
      var PROFILE_TEST = ['atm21', 'atm21_b', 'atm60_b', 'otm3_30b', cfg.profile || 'otm3_14']
        .filter(function (v, i2, arr) { return arr.indexOf(v) === i2 && Q.PROFILES[v]; });
      var fineGrid = [];
      [9, 20, 50].forEach(function (p) { [5, 15, 30].forEach(function (c) { ['ema', 'vwap'].forEach(function (lt) { PROFILE_TEST.forEach(function (pr2) {
        var prof2 = Q.PROFILES[pr2];
        fineGrid.push({ period: p, confirmBps: c, zThr: zOf(c), lineType: lt, profil: pr2,
          otmPct: prof2.otmPct, expiryDays: prof2.days, ratio: prof2.ratio || Q.RATIO });
      }); }); }); });
      var fineRes = await Promise.all(fineGrid.map(function (g) {
        return btIntraday(trainMap, Object.assign({}, commonIv, top.mode.opts, g));
      }));
      var bestFine = null;
      fineGrid.forEach(function (g, gi) {
        var r0 = fineRes[gi];
        if (!r0 || r0.error || r0.summary.nTrades < 5) return;
        if (!bestFine || r0.summary.retPct > bestFine.train.retPct) bestFine = { g: g, train: r0.summary };
      });
      /* MEHRFACHVERGLEICH auch hier: 90 Kombinationen auf derselben Trainingsscheibe,
       * und die beste wird genommen. Ohne Korrektur ist ihr Vorsprung zum guten Teil
       * die Auswahl selbst. */
      var fineZufall = Q.bestOfN(fineRes.filter(function (r0) { return r0 && !r0.error && r0.summary; })
                                        .map(function (r0) { return r0.summary.retPct; }));
      var fineValid = null;
      if (bestFine) {
        // Die ENTSCHEIDUNG faellt auf der Wahlscheibe - nicht auf der, die berichtet wird.
        var rv = await btIntraday(wahlMap, Object.assign({}, commonIv, top.mode.opts, bestFine.g));
        if (rv && !rv.error) fineValid = rv.summary;
      }
      var useFine = bestFine && fineValid && fineValid.retPct > 0;
      // Und was die unberuehrte Belegscheibe dazu sagt - berichtet, nicht verwendet.
      var fineBeleg = null;
      if (bestFine) {
        var rb = await btIntraday(belegMap, Object.assign({}, commonIv, top.mode.opts, bestFine.g));
        if (rb && !rb.error) fineBeleg = rb.summary;
      }
      var pick = useFine ? bestFine.g : (top.best ? Object.assign({ lineType: cfg.lineType || 'ema' }, top.best) : { period: cfg.period, confirmBps: cfg.confirmBps, lineType: cfg.lineType || 'ema' });

      // Filter-Bilanz: Jeder Filter muss sein Geld verdienen. Für den besten Kandidaten
      // wird auf der UNGESEHENEN 30-%-Scheibe jeder Filter einzeln abgeschaltet und
      // nachgerechnet, was er in Prozentpunkten bringt oder kostet. Nur die im Backtest
      // abbildbaren Filter – KI-Veto, Verlustserie und Event-Blackout laufen nur live und
      // werden vom Schattenbuch beurteilt (steht mit im Bericht).
      var filterBilanz = null;
      try {
        out.innerHTML = '<div class="loading">Schritt 2b/3: Filter-Bilanz – jeden Filter einzeln nachrechnen …</div>';
        var basisOpts = Object.assign({}, commonIv, top.mode.opts, pick, { zThr: zOf(pick.confirmBps || cfg.confirmBps) });
        var basisAb = await btIntraday(belegMap, basisOpts);
        if (basisAb && !basisAb.error) {
          var varianten = [
            { name: 'Kosten-Check (Bewegung muss Kosten decken)', opts: { minEdge: 0 }, aktiv: (basisOpts.minEdge || 0) > 0 },
            { name: 'Trendfilter (EMA100)', opts: { trendFilter: false }, aktiv: !!basisOpts.trendFilter },
            { name: 'Trendkanal', opts: { channel: false }, aktiv: !!basisOpts.channel },
            { name: '5-Min-Bestätigung (MTF)', opts: { mtf: false }, aktiv: !!basisOpts.mtf },
            { name: 'Wellen-Qualitätsschwelle', opts: { minQuality: 0 }, aktiv: basisOpts.entryMode === 'wave' && (basisOpts.minQuality || 0) > 0 }
          ].filter(function (v) { return v.aktiv; });
          var abRes = await Promise.all(varianten.map(function (v) {
            return btIntraday(belegMap, Object.assign({}, basisOpts, v.opts));
          }));
          var zeilen = [];
          varianten.forEach(function (v, i2) {
            var r2 = abRes[i2];
            if (!r2 || r2.error) return;
            var nutzen = Math.round((basisAb.summary.retPct - r2.summary.retPct) * 100) / 100;
            zeilen.push({ name: v.name, mitRet: basisAb.summary.retPct, ohneRet: r2.summary.retPct,
              mitN: basisAb.summary.nTrades, ohneN: r2.summary.nTrades, nutzen: nutzen,
              duenn: (r2.summary.nTrades || 0) + (basisAb.summary.nTrades || 0) < 20 });
          });
          filterBilanz = { basisRet: basisAb.summary.retPct, basisN: basisAb.summary.nTrades, zeilen: zeilen };
        }
      } catch (eFb) { /* Filter-Bilanz ist Diagnose, kein Pflichtteil */ }

      // Schritt 3: Diagnose (Stunden, Zeitfenster, Symbole) aus den Out-of-Sample-Trades
      out.innerHTML = '<div class="loading">Schritt 3/3: Diagnose und Empfehlung …</div>';
      var byHour = {};
      top.trades.forEach(function (t) {
        var h = parseInt(new Date(t.openT).toLocaleString('de-DE', { hour: '2-digit', hour12: false, timeZone: 'Europe/Berlin' }), 10);
        var b = (byHour[h] = byHour[h] || { n: 0, pnl: 0 });
        b.n++; b.pnl += t.pnl;
      });
      var avoidHours = Object.keys(byHour).filter(function (h) { return byHour[h].n >= 3 && byHour[h].pnl < 0; }).map(Number).sort(function (a, b) { return a - b; });
      var winPreset = 'all', winBest = -Infinity;
      ['all', 'open2', 'open4', 'close2'].forEach(function (pr) {
        var pnl = 0, n = 0;
        top.trades.forEach(function (t) { if (Q.inWindow(t.openT, pr)) { pnl += t.pnl; n++; } });
        if (n >= 5 && pnl > winBest) { winBest = pnl; winPreset = pr; }
      });
      var bySym = {};
      top.trades.forEach(function (t) { var b = (bySym[t.sym] = bySym[t.sym] || { n: 0, pnl: 0 }); b.n++; b.pnl += t.pnl; });
      var symRank = Object.keys(bySym).map(function (k) { return [k, bySym[k].pnl, bySym[k].n]; }).sort(function (a, b) { return b[1] - a[1]; });

      var rec = {
        modeKey: top.mode.key, modeName: top.mode.name, interval: top.interval,
        period: pick.period, confirmBps: pick.confirmBps, lineType: pick.lineType || (cfg.lineType || 'ema'),
        channel: top.mode.key === 'wave' && cfg.channel !== false,
        setup: top.mode.setup, trigger: top.mode.trigger,
        window: winPreset, avoidHours: avoidHours,
        profile: (useFine && pick.profil) ? pick.profil : ((top.mode.meta || {}).profile || null),
        scalpHold: (top.mode.meta || {}).scalpHold || null,
        scalpSL: (top.mode.meta || {}).scalpSL || null,
        kiBase: (top.mode.meta || {}).kiBase || null,
        wfRet: top.wfRet, posSegs: top.posSegs, n: top.n, winRate: top.winRate, pf: top.pf, verdict: top.verdict,
        oosTage: top.oosTage, scheibenGueltig: top.scheibenGueltig, belastbar: top.belastbar,
        scheibenMax: top.scheibenMax, bootLossProb: top.bootLossProb,
        richtung: { callN: top.callN, callPnl: top.callPnl, putN: top.putN, putPnl: top.putPnl },
        fine: bestFine ? { train: bestFine.train.retPct, valid: fineValid ? fineValid.retPct : null,
          beleg: fineBeleg ? fineBeleg.retPct : null, belegN: fineBeleg ? fineBeleg.nTrades : null,
          used: !!useFine, zufall: fineZufall } : null,
        /* Was der Sieger gegen den Zufall steht. null heisst: zu wenige belastbare
         * Kandidaten fuer eine Aussage (bestOfN verlangt mindestens 20). */
        zufall: results.zufall,
        ueberzufaellig: results.zufall ? !!results.zufall.ueberzufaellig : null,
        topSymbols: symRank.slice(0, 3).map(function (x) { return x[0]; }),
        filterBilanz: filterBilanz,
        /* Wie gross die drei Scheiben tatsaechlich waren. Die Belegscheibe ist die
         * kleinste (15 %) - wer die Filter-Bilanz liest, soll sehen, auf wie wenig
         * sie steht, statt eine Zahl ohne Massstab zu bekommen. */
        scheiben: { trainTage: tageIn(trainMap), wahlTage: tageIn(wahlMap), belegTage: tageIn(belegMap) },
        datenbasis: { symbole: Object.keys(ld.data[top.interval] || {}).length, zeitrahmen: top.interval,
          spanneTage: (function () { var sp = mapSpan(ld.data[top.interval] || {}); return sp[1] > sp[0] ? Math.round((sp[1] - sp[0]) / 86400000) : 0; })() }
      };
      D.central = {
        at: Date.now(), rec: rec,
        // volles Ranking (alle Setups x Zeitrahmen) inkl. der Angaben, WORAN ein Kandidat scheitert
        ranking: results.map(function (r0) { return { name: r0.mode.name, modeKey: r0.mode.key, interval: r0.interval,
          wfRet: r0.wfRet, posSegs: r0.posSegs, scheibenGueltig: r0.scheibenGueltig, n: r0.n, oosTage: r0.oosTage,
          pf: r0.pf, winRate: r0.winRate, verdict: r0.verdict, belastbar: !!r0.belastbar,
          scheibenMax: r0.scheibenMax, bootLossProb: r0.bootLossProb,
          callN: r0.callN, callPnl: r0.callPnl, putN: r0.putN, putPnl: r0.putPnl }; }),
        // Datenlage je Zeitrahmen: Handelstage und Wertezahl der Messbasis
        datenlage: (function () {
          var out = {};
          ld.intervals.forEach(function (iv2) {
            var m2 = ld.data[iv2] || {};
            out[iv2] = { werte: Object.keys(m2).length, handelstage: handelsTage(m2).length };
          });
          return out;
        })()
      };
      await save();
      if (!silent) renderCentral();
      exportAnalysis(true);
      return rec;
    } catch (e) {
      out.innerHTML = '<div class="empty"><span class="ico"></span>Fehler: ' + U.esc(e.message || e) + '</div>';
      if (silent) throw e;
      return null;
    } finally {
      btn.disabled = false;
      centralRunning = false;
    }
  }

  /* ======= Empfehlung anwenden (gemeinsam für Knopf und Selbst-Optimierung) ======= */
  /** Übernimmt eine Zentrale-Empfehlung, protokolliert sie im Auto-Tuning-Verlauf. Gibt die Liste der Änderungen zurück. */
  function applyCentralRec(r, quelle) {
    var vorher = JSON.parse(JSON.stringify(D.intraday));
    var applied = [], gesperrt = [];
    function set(k, v, label) {
      if (JSON.stringify(D.intraday[k]) === JSON.stringify(v)) return;
      // Von Hand gesetzte Felder rührt die Automatik nicht mehr an
      if (!automatikDarf(k)) { gesperrt.push((HAND_LABEL[k] || k) + ' (Vorschlag: ' + label.split('→').pop().trim() + ')'); return; }
      D.intraday[k] = v;
      applied.push(label);
    }
    var mKey = r.modeKey === 'wave_ch' ? 'wave' : r.modeKey;
    if (mKey === 'ki' || mKey === 'entdeckt') mKey = r.kiBase || 'breakout';   // KI-/Tiefensuche-Kandidat: Basis-Modus
    if (mKey === 'reversion_lang') mKey = 'reversion';                    // Lang-Varianten: Basis-Modus,
    if (mKey === 'wave_lang') mKey = 'wave';                              // Haltedauer/Stop kommen unten mit
    // 'laufen lassen'-Kandidat: Modus ist Ausbruch, der Ausstieg wird explizit mit umgestellt
    if (mKey === 'breakout_lauf') { mKey = 'breakout'; set('exitStyle', 'laufen', 'Ausstieg → laufen lassen'); }
    if (mKey === 'pullback' || r.kiBase === 'pullback') { /* Ausstieg steckt im Modus */ }
    // Der 'breakout'-Kandidat wurde mit dem eingestellten Ausstiegsstil GEMESSEN (labModes) –
    // beim Anwenden muss derselbe Stil gelten (Blitz/kurz laufen als mode 'waves').
    if (mKey === 'breakout' && (D.intraday.exitStyle === 'blitz' || D.intraday.exitStyle === 'kurz')) mKey = 'waves';
    set('mode', mKey, 'Setup → ' + setupName(mKey, r.channel !== false));
    var stZ = setupFromMode(mKey);
    D.intraday.setup = stZ.setup; D.intraday.trigger = stZ.trigger;
    if (r.modeKey === 'wave_ch') set('channel', true, 'Trendkanal → an');   // Empfehlung aus einer älteren Version
    set('interval', r.interval, 'Zeitrahmen → ' + r.interval);
    set('period', r.period, 'Periode → ' + r.period);
    set('confirmBps', r.confirmBps, 'Bestätigung → ' + (r.confirmBps / 100).toFixed(2) + ' %');
    set('lineType', r.lineType, 'Leitlinie → ' + String(r.lineType).toUpperCase());
    set('window', r.window, 'Zeitfenster → ' + (WINDOW_NAMES[r.window] || r.window));
    if (r.profile) set('profile', r.profile, 'Schein-Profil → ' + ((Q.PROFILES[r.profile] || {}).name || r.profile));
    if (r.scalpHold) set('scalpHold', r.scalpHold, 'Max-Halten → ' + r.scalpHold + ' Min');
    if (r.scalpSL) set('scalpSL', r.scalpSL, 'Not-Stop → ' + (r.scalpSL === 'auto' ? 'auto' : r.scalpSL + ' %'));
    set('avoidHours', (r.avoidHours || []).slice(), 'Meide-Stunden → ' + ((r.avoidHours || []).join(', ') || 'keine'));
    if (applied.length || gesperrt.length) {
      if (!D.tuneLog) D.tuneLog = [];
      var closedNow = D.trades.filter(function (t) { return t.status === 'closed' && istMess(t); });
      var txt = (quelle === 'pilot' ? 'Autopilot: ' : quelle === 'lokal' ? 'Selbst-Optimierung: ' : '') + r.modeName + ' · ' + r.interval + ' · Walk-Forward ' +
        (r.wfRet > 0 ? '+' : '') + r.wfRet + ' % · ' + r.posSegs + '/' + (r.scheibenMax || 4) + ' Scheiben · ' + r.n + ' Trades · PF ' + r.pf + ' · ' + r.verdict +
        (gesperrt.length ? ' — nicht angefasst (von Hand gesetzt): ' + gesperrt.join(' · ') : '');
      D.tuneLog.unshift({
        id: (quelle || 'manuell') + '-' + Date.now(), at: Date.now(), quelle: quelle || 'manuell',
        applied: applied.length ? applied : ['(nichts geändert – alle Vorschläge betrafen von Hand gesetzte Felder)'],
        gesperrt: gesperrt, txt: txt, konfigVorher: vorher,
        equityBei: Math.round(equityNow() * 100) / 100,
        tradesBei: closedNow.length,
        pnlBei: Math.round(closedNow.reduce(function (a2, t) { return a2 + t.pnl; }, 0) * 100) / 100,
        konfigNachher: JSON.parse(JSON.stringify(D.intraday))
      });
      if (D.tuneLog.length > 60) D.tuneLog = D.tuneLog.slice(0, 60);
    }
    // UI nachziehen
    [['idMode', D.intraday.mode], ['idInterval', D.intraday.interval], ['idPeriod', String(D.intraday.period)],
     ['idConfirm', String(D.intraday.confirmBps)], ['idLine', D.intraday.lineType], ['idWindow', D.intraday.window]].forEach(function (kv) {
      var el = document.getElementById(kv[0]);
      if (el) el.value = kv[1];
    });
    var chEl = document.getElementById('idChannel');
    if (chEl) chEl.checked = !!D.intraday.channel;
    if (window.__updateParamVis) window.__updateParamVis();
    return applied;
  }

  /* ================= Regime-Automatik: die App wählt das Setup =================
   * Ablauf: Die App MISST die Marktlage (Trendanteil, Überdehnung, Wellen-Score, Kanal-Anteil,
   * Vola) und WÄHLT daraus nach festen Regeln eines von vier Setups. Die Wahl wird gegen eine
   * Whitelist geprüft (quant.js, damit die Unit-Tests die echte Funktion testen) und mit
   * Fakten, Begründung und späterer Wirkung protokolliert. Passt kein Setup: "pause". */
  var regimeRunning = false;

  /** Marktlage messen – rein rechnerisch, ohne Modell. */
  async function regimeFacts() {
    var syms = scanUniverse().slice(0, 14);
    var iv = '5m';
    var fds = await pmap(syms, function (sy) { return fetchIntraday(sy, iv, false); }, 6);
    var n = 0, ueberEma = 0, absZ = 0, wave = 0, kanal = 0, vol = 0, kanalTrendUp = 0, kanalTrendDown = 0, ausbrueche = 0;
    fds.forEach(function (fd) {
      if (!fd || fd.series.length < 120) return;
      n++;
      var bars = fd.series;
      var closes = bars.map(function (b) { return b[1]; });
      var e = Q.emaSeries(closes, 20);
      if (closes[closes.length - 1] > e[e.length - 1]) ueberEma++;
      var rs = Q.reversionSignal(bars, 'ema', 20, 1e9);
      absZ += Math.abs(rs.z || 0);
      var wq = Q.waveQuality(bars, 'ema', 20, 2.0);
      wave += (wq && wq.score) || 0;
      var dgR = Q.degapBarArray(bars);
      var ch = Q.trendChannel(dgR);
      if (ch && ch.gueltig) {
        kanal++;
        if (ch.trend === 'up') kanalTrendUp++;
        if (ch.trend === 'down') kanalTrendDown++;
        if (ch.ausbruch) ausbrueche++;
      }
      var r = [];
      for (var i = Math.max(1, closes.length - 120); i < closes.length; i++) r.push(Math.log(closes[i] / closes[i - 1]));
      var m = r.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, r.length);
      var sd = Math.sqrt(r.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / Math.max(1, r.length - 1));
      vol += sd * 100;
    });
    if (!n) return null;
    // Öffnungszeit NICHT fest auf 13:30 UTC verdrahten: im Winter öffnet die US-Börse um
    // 14:30 UTC. Der feste Wert machte die Marktlage jeden Winter um 60 Minuten zu alt und
    // verschob damit die Sperre "Eröffnungs-Range nur früh am Tag" (regimeValidate).
    var minsOpen = (window.Dash && window.Dash.marketOpen()) ? Q.minutenSeitOeffnung(Date.now()) : null;
    var q = function (sym) { var x = window.Dash && window.Dash.quote(sym); return x ? Math.round(x.pct * 100) / 100 : null; };
    var wf = (D.central && D.central.ranking) ? D.central.ranking.slice(0, 3).map(function (r0) {
      return { name: r0.name, zeitrahmen: r0.interval, wfRenditePct: r0.wfRet, scheibenPlus: r0.posSegs, trades: r0.n, urteil: r0.verdict };
    }) : [];
    return {
      geprueft: n,
      trendAnteilPct: Math.round(ueberEma / n * 100),
      mittleresAbsZ: Math.round(absZ / n * 100) / 100,
      mittlererWellenScore: Math.round(wave / n),
      kanalAnteilPct: Math.round(kanal / n * 100),
      kanalRichtung: kanalTrendUp > kanalTrendDown ? 'aufwaerts' : (kanalTrendDown > kanalTrendUp ? 'abwaerts' : 'gemischt'),
      kanalAusbruecheAnteilPct: Math.round(ausbrueche / n * 100),
      vola1mPct: Math.round(vol / n * 1000) / 1000,
      minutenSeitEroeffnung: minsOpen,
      vixTagesPct: q('^VIX'), sp500TagesPct: q('^GSPC'), nasdaqTagesPct: q('^IXIC'),
      letzteWalkForward: wf
    };
  }

  /** Feste Regel als Rückfallebene und als Plausibilitätsanker für die KI-Antwort. */
  function regimeFallback(f) {
    var trendig = f.trendAnteilPct >= 70 || f.trendAnteilPct <= 30;
    var zeitrahmen = f.vola1mPct > 0.15 ? '5m' : '1m';
    // Weder Trend noch Wellen: Trendfolge laeuft sich in einem richtungslosen Markt tot,
    // Umkehr braucht ein Schwingungsmuster, das hier fehlt. Bisher fiel dieser Fall durch
    // bis zur Vorgabe "Trendfolge" - es wurde also gehandelt, obwohl kein Setup passte.
    if (f.trendAnteilPct > 40 && f.trendAnteilPct < 60 && f.mittlererWellenScore < 45) {
      return { setup: 'pause', ausloeser: 'keiner', zeitrahmen: zeitrahmen, trendfilter: true, kanal: false,
        begruendung: 'Weder Trend (' + f.trendAnteilPct + ' % im Trend) noch Wellen (Score ' + f.mittlererWellenScore + ') – kein Setup passt' };
    }
    if (!trendig && f.mittlererWellenScore >= 50) {
      return { setup: 'umkehr', ausloeser: 'welle', zeitrahmen: zeitrahmen, trendfilter: true,
        kanal: f.kanalAnteilPct >= 20, begruendung: 'Kein klarer Trend, aber Wellenmuster (Score ' + f.mittlererWellenScore + ')' };
    }
    if (!trendig && f.mittleresAbsZ >= 1.5) {
      return { setup: 'umkehr', ausloeser: 'ueberdehnung', zeitrahmen: zeitrahmen, trendfilter: true,
        kanal: false, begruendung: 'Seitwärts und überdehnt (z ' + f.mittleresAbsZ + ')' };
    }
    if (f.minutenSeitEroeffnung != null && f.minutenSeitEroeffnung >= 30 && f.minutenSeitEroeffnung <= 120 && f.vola1mPct > 0.12) {
      return { setup: 'ausbruch', ausloeser: 'range', zeitrahmen: '1m', trendfilter: true, kanal: false,
        begruendung: 'Frühe Handelsphase mit erhöhter Vola – Eröffnungs-Range' };
    }
    return { setup: 'ausbruch', ausloeser: 'kreuzung', zeitrahmen: zeitrahmen, trendfilter: true, kanal: false,
      begruendung: 'Vorgabe: Trendfolge mit Trendfilter (Trendanteil ' + f.trendAnteilPct + ' %)' };
  }

  /** Kompletter Durchlauf: messen → entscheiden lassen → prüfen → anwenden → protokollieren. */
  async function runRegime(manual) {
    var a = autoOptCfg();
    if (regimeRunning || centralRunning) return false;
    if (!manual && a.regime === false) return false;
    regimeRunning = true;
    renderRegime('misst die Marktlage …');
    try {
      var f = await regimeFacts();
      if (!f) { D.regime = { at: Date.now(), ok: false, txt: 'Zu wenig Kursdaten für eine Lagebeurteilung.' }; await save(); renderRegime(); return; }
      /* Die Lagebeurteilung fragte hier ein lokales Modell und uebernahm dessen Setup,
       * wenn regimeValidate zustimmte. Zwei Gruende, warum das weg ist (23.08.2026):
       * Der Pfad lief laut Diagnose ueber 14 Sitzungen kein einziges Mal, UND
       * regimeValidate laesst nur 1m und 5m zu, waehrend die App auf 60m handelt -
       * ein Vorschlag konnte also gar nicht angenommen werden. Es bleibt die Regel,
       * die vorher schon in jedem Fall entschied. */
      var quelle = 'Regel';
      var wahl = regimeFallback(f);
      // v8: Die Marktlage ist NUR NOCH ANZEIGE. Sie schaltet nichts mehr selbst um –
      // das stündliche Hin-und-Her hat Handeinstellungen zurückgedreht und stand quer
      // zum Autopiloten, der auf gemessener Basis entscheidet. Umschalten tut nur noch
      // der Autopilot (nach doppelt bestätigter Nacht-Messung) – oder du selbst.
      D.regimePending = null;   // Altlast aus v7 aufräumen
      // Sonderfall pause: Die Marktlage ist seit v8 reine ANZEIGE und schaltet nichts um.
      // "Nicht handeln" ist aber die einzige Entscheidung, die das Risiko ausschliesslich
      // SENKT - sie kann nichts kaputtmachen, was eine Setup-Umstellung kaputtmachen koennte.
      // Deshalb wirkt sie sofort. Sie kann den Handel nur aussetzen, niemals einschalten,
      // und laeuft mit der naechsten Regime-Pruefung von selbst wieder aus.
      if (wahl.setup === 'pause') {
        var bisP = Date.now() + 65 * 60000;      // bis zur naechsten stuendlichen Pruefung
        D.handelsPause = { seit: Date.now(), bis: bisP, quelle: quelle, grund: wahl.begruendung || 'kein passendes Setup' };
        D.regime = { at: Date.now(), ok: true, quelle: quelle, wahl: wahl, fakten: f, applied: ['Intraday-Handel ausgesetzt'], nurAnzeige: false, pause: true,
          txt: 'Handelspause – ' + (wahl.begruendung || '') + ' · keine neuen Einstiege bis zur nächsten Prüfung (offene Positionen werden weiter gemanagt)' };
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'pause-' + Date.now(), at: Date.now(), quelle: 'regime', applied: ['Intraday-Handel ausgesetzt'],
          txt: 'Marktlage (' + quelle + '): ' + (wahl.begruendung || 'kein passendes Setup') +
            '. Es wird bis zur nächsten stündlichen Prüfung nichts Neues eröffnet. Offene Positionen laufen mit allen Ausstiegsregeln weiter.' });
        await save(); render();
        return;
      }
      // Eine frühere Pause endet, sobald wieder ein Setup passt
      if (D.handelsPause) { D.handelsPause = null; }
      var mode = modeFromSetup(wahl.setup, wahl.ausloeser, 'laufen');
      var stIst = setupFromMode(D.intraday.mode);
      var passt = stIst.setup === wahl.setup && stIst.trigger === wahl.ausloeser && D.intraday.interval === wahl.zeitrahmen;
      D.regime = { at: Date.now(), ok: true, quelle: quelle, wahl: wahl, fakten: f, applied: [], nurAnzeige: true,
        txt: setupName(mode, wahl.kanal) + ' · ' + wahl.zeitrahmen + ' — ' + (wahl.begruendung || '') +
             (passt ? ' · entspricht der aktuellen Einstellung' : ' · Empfehlung – umgestellt wird nichts') };
      await save();
      render();
    } catch (e) {
      D.regime = { at: Date.now(), ok: false, txt: 'Fehler: ' + (e && e.message ? e.message : e) };
    } finally {
      regimeRunning = false;
      renderRegime();
    }
  }

  /** Bedienelemente an den aktuellen (automatisch gesetzten) Stand angleichen. */
  function syncStrategyUI() {
    // ALLE Strategie-Felder angleichen. Vorher wurden nur vier synchronisiert – die
    // restlichen Formularfelder blieben stehen und das nächste change-Event schrieb
    // sie zurück in den Store: Automatik-Entscheidungen wurden still zurückgedreht.
    var c = D.intraday;
    [['idMode', c.mode], ['idInterval', c.interval || '5m'], ['idTrend', c.trendFilter ? '1' : '0'],
     ['idPeriod', String(c.period)], ['idConfirm', String(c.confirmBps)], ['idLine', c.lineType || 'ema'],
     ['idWindow', c.window || 'all'], ['idHold', String(c.scalpHold != null ? c.scalpHold : 60)],
     ['idTrail', String(c.scalpTrail != null ? c.scalpTrail : 15)],
     ['idScalpSL', c.scalpSL === 'auto' ? 'auto' : String(c.scalpSL != null ? c.scalpSL : 20)],
     ['idProfile', c.profile || 'atm60_b'], ['idSizing', parseFloat(c.sizing) > 0 ? String(c.sizing) : 'fix'],
     ['idBlackout', c.blackout || 'block']].forEach(function (kv) {
      var el = document.getElementById(kv[0]);
      if (el) el.value = kv[1];
    });
    [['idChannel', !!c.channel], ['idMtf', c.mtf !== false], ['idScreener', !!c.screener], ['idEnabled', !!c.enabled],
     ['idKapiZusatz', !!c.kapiZusatz], ['idRegime', !!c.regimeZuteilung], ['idKryptoHandeln', !!c.kryptoHandeln],
     // Auch der Stunden-Schalter gehoert nachgezogen, sonst laufen Kippschalter und
     // Speicherstand nach jedem Depot-Reset auseinander.
     ['hourlyEnabled', D.hourlyEnabled !== false]].forEach(function (kv) {
      var el = document.getElementById(kv[0]);
      if (el) el.checked = kv[1];
    });
    /* Der Instrument-Hinweis im Kopf des Reiters kommt aus dem Ist-Zustand und nicht
     * aus dem Markup - sonst behauptet er bei Bestandsdepots (die die Migration auf
     * 'schein' zuruecksetzt) das Falsche. */
    [['idInstrument', c.instrument || 'basis'], ['idPool', c.pool || 'auto'], ['idMaxStufe', String(D.maxRisikostufe || 5)]].forEach(function (kv) {
      var el = document.getElementById(kv[0]);
      if (el) el.value = kv[1];
    });
    if (window.__syncSetupUI) window.__syncSetupUI();   // Setup-Pillen + Auslöser + Ausstieg
    if (window.__updateParamVis) window.__updateParamVis();
    renderStatusBadges();
    renderKlartext();
  }
  // Der Strategien-Tab schaltet dieselben Werte - er muss die Formularseite nachziehen koennen.
  window.__syncStrategyUI = function () { try { syncStrategyUI(); } catch (e) { /* optional */ } };

  /** Die Abzeichen an den Strategie-Karten. Eigene Funktion, weil sie aus zwei
   *  Richtungen kommen muessen: aus render() und aus syncStrategyUI() - der
   *  Ein/Aus-Schalter liegt auch im Reiter „Regeln“, und ohne diesen
   *  zweiten Aufruf stand das Abzeichen auf „aus“, waehrend die Strategie lief. */
  function renderStatusBadges() {
    if (!D) return;
    var hs = document.getElementById('hourlyState');
    if (hs) {
      var hOn = D.hourlyEnabled !== false;
      // 'aus' allein waere hier zu wenig: es ist nicht irgendein Schalter, sondern
      // eine vermessene und durchgefallene Strategie.
      hs.textContent = hOn ? 'aktiv – gegen die Messung' : 'aus (widerlegt)';
      hs.className = 'state ' + (hOn ? 'on' : 'off');
    }
    var is2 = document.getElementById('idState');
    if (is2) { is2.textContent = D.intraday.enabled ? 'aktiv' : 'aus'; is2.className = 'state ' + (D.intraday.enabled ? 'on' : 'off'); }
  }

  function renderKlartext() {
    if (!D) return;
    var c = D.intraday;
    /* Der Instrument-Hinweis im Kopf des Reiters haengt hier mit dran: renderKlartext
     * laeuft aus jedem Formular-Change (idSave), syncStrategyUI dagegen nur beim
     * Reiterwechsel - sonst nennt der Pflicht-Hinweis nach dem Umstellen das
     * falsche Instrument. */
    var iH2 = document.getElementById('depotInstrumentHinweis');
    if (iH2) iH2.textContent = c.instrument === 'basis'
      ? 'der Basiswert (Aktie 1×, ohne Hebel)'
      : 'der Hebelschein';
    var el = document.getElementById('idKlartext');
    if (!el) return;
    var st = setupFromMode(c.mode);
    var name, was;
    /* Namen NICHT abtippen: sie stehen in SETUPS. Genau diese Doppelpflege hatte
     * dazu geführt, dass die Karte die belegte Hauptstrategie monatelang als
     * „Umkehr bei Überdehnung“ auswies - den Namen eines widerlegten Modus. */
    var trigName = (SETUPS[st.setup] && SETUPS[st.setup].trigger[st.trigger]) || '';
    var haltStd = Math.round((c.scalpHold || 480) / 60);
    if (c.mode === 'rsi2seit' || c.mode === 'kapitulation') {
      name = trigName;
      was = c.mode === 'rsi2seit'
        ? 'Kauft den RSI(2)-Rücklauf, aber nur im Seitwärtskanal mit Volumen – der Kanal gibt nicht die Richtung, sondern die Erlaubnis. Nur Long. Im Backtest gemessen: +0,147 Prozentpunkte auf 8 Handelsstunden über die übliche Drift hinaus.'
        : 'Kauft den Ausverkauf im Abwärtskanal – die Kapitulation, nicht den Trend. Nur Long. Im Backtest gemessen: Median +0,44 % je Trade.';
      // Ausstieg nennen: beide Kanten steigen ueber die Zeit aus, darunter nur der Not-Stop.
      was += ' Ausstieg nach ' + haltStd + ' Handelsstunden, darunter nur ein Not-Stop – kein Gewinnziel, kein Trailing; die Position darf über Nacht laufen.';
      // Instrument aus dem Ist-Zustand: die Bestandsschutz-Migration stellt alte
      // Depots aktiv auf 'schein' zurueck - fuer die waere "Aktie" schlicht falsch.
      was += c.instrument === 'basis'
        ? ' Gehandelt wird die Aktie selbst (1×, ohne Hebel).'
        : ' Achtung: eingestellt ist der Hebelschein – der gemessene Vorsprung liegt UNTER der Scheinhürde, mit Schein war dieselbe Strategie im Backtest bei −96 %.';
      if (c.mode === 'rsi2seit' && c.kapiZusatz) {
        was += ' Zusätzlich läuft der Kapitulations-Dip als zweites Standbein – er greift in der anderen Marktphase.';
      }
      if (c.regimeZuteilung) {
        /* Nur der Modulcache, niemals spyTrendAuf(): das ist async mit Netzabruf,
         * renderKlartext ist synchron und feuert bei jedem Formular-Change.
         * Der Satz beschreibt, was mit DIESER Einstellung gerade passiert - nicht
         * abstrakt beide Kanten, sonst raetselt der Leser, welche Haelfte ihn angeht. */
        var rg = SPY_REGIME.auf;
        var kapiLaeuft = (c.mode === 'kapitulation');
        was += ' Regime-Zuteilung ist an: ' + (rg === null
          ? 'Die Marktlage ist noch nicht gemessen – bis dahin läuft alles wie ohne Zuteilung.'
          : rg === !kapiLaeuft
            ? 'Der S&P 500 steht ' + (rg ? 'über' : 'unter') + ' seiner 200er-Linie – das ist die Phase dieser Kante, sie darf handeln.'
            : 'Der S&P 500 steht ' + (rg ? 'über' : 'unter') + ' seiner 200er-Linie – das ist NICHT die Phase dieser Kante, sie pausiert. ' +
              (c.mode === 'rsi2seit' && c.kapiZusatz
                ? 'Der Kapitulations-Dip handelt in dieser Phase weiter.'
                : 'Signale laufen währenddessen im Schattenbuch mit.'));
      }
    } else if (c.mode === 'kanaltrend') {
      name = trigName;
      was = 'Folgt dem erkannten Trendkanal und hält, bis der Kanal dreht. Gemessen und ohne Vorsprung.';
    } else if (st.setup === 'umkehr' && st.trigger === 'welle') {
      name = 'Umkehr am Wellental' + (c.channel !== false ? ' + Trendkanal' : '');
      was = 'Kauft am Tief einer Welle und verkauft am Wellenkamm' + (c.channel !== false ? ' – aber nur an der Kanalkante, Ziel ist die Gegenkante' : '') + '.';
    } else if (st.setup === 'umkehr' && st.trigger === 'rsi2') {
      name = 'Umkehr am RSI(2)-Extrem (Connors)';
      was = 'Kauft die kurzfristige Übertreibung gegen den Trend (2-Perioden-RSI unter 10 im Aufwärtstrend) und steigt bei Rückkehr zur Leitlinie aus – eines der meistgetesteten Mean-Reversion-Setups.';
    } else if (st.setup === 'umkehr') {
      name = 'Umkehr bei Überdehnung';
      was = 'Kauft gegen die Übertreibung, wenn der Kurs zu weit von seiner Leitlinie weggelaufen ist – Ziel ist die Rückkehr zur Linie.';
    } else if (st.trigger === 'donchian') {
      name = 'Ausbruch über den Donchian-Kanal';
      was = 'Kauft, wenn der Schlusskurs über das Hoch der letzten ' + c.period + ' Kerzen ausbricht (Put spiegelbildlich) – der Turtle-Klassiker, mit Trailing-Stop.';
    } else if (st.trigger === 'squeeze') {
      name = 'Ausbruch nach Vola-Kompression (Squeeze)';
      was = 'Wartet, bis die Bollinger-Bänder deutlich enger sind als zuletzt, und kauft erst den Ausbruch aus dieser Kompression – filtert Fehlausbrüche in ohnehin hektischen Phasen.';
    } else if (st.trigger === 'ruecksetzer') {
      name = 'Ausbruch am Trend-Rücksetzer';
      was = 'Kauft, wenn der Kurs im laufenden Trend an seine Leitlinie zurückkommt und dort wieder in Trendrichtung dreht – mit Trailing-Stop und längerer Haltedauer.';
    } else if (st.trigger === 'range') {
      name = 'Ausbruch aus der Eröffnungs-Range';
      was = 'Handelt den ersten Ausbruch aus der Spanne der ersten 30 Handelsminuten – maximal 1 Trade je Richtung und Tag.';
    } else {
      name = 'Ausbruch an der EMA' + c.period;
      was = 'Kauft (Call), wenn der Kurs die EMA' + c.period + ' nach OBEN durchbricht – Put beim Durchbruch nach unten. Immer in Trendrichtung.';
    }
    var exitTxt = c.exitStyle === 'blitz' ? 'Blitz-Ausstieg: nach spätestens 3 Minuten raus – bei der ersten Gegenbar oder der EMA9-Rückkreuzung. Kleine Gewinne, viele Versuche.'
      : c.exitStyle === 'kurz' ? 'Kurzer Ausstieg: raus bei der Rückkehr zur Leitlinie.'
      : st.setup === 'umkehr' ? '' : 'Ausstieg: laufen lassen bis zum Gegensignal, mit Not-Stop und Ziel.';
    // Wer hat das eingestellt? Letzter Journal-Eintrag mit echter Änderung
    var wer = '';
    var QUELLE_NAME = { pilot: 'Autopilot', regime: 'Regime-Automatik (alt)', farm: 'Strategie-Farm (alt)', hand: 'von Hand (Formular)', manuell: 'Analyse-Zentrale', lokal: 'Selbst-Optimierung (alt)', sicherung: 'Sicherung', claude: 'Cloud-Empfehlung' };
    var tl = (D.tuneLog || []).filter(function (e) { return (e.applied || []).length && e.quelle !== 'sicherung'; })[0];
    if (tl) wer = 'Zuletzt eingestellt von ' + (QUELLE_NAME[tl.quelle] || tl.quelle || '?') + ' (' + U.dt(tl.at) + '): ' + tl.applied.slice(0, 3).join(' · ') + (tl.applied.length > 3 ? ' …' : '');
    var a = autoOptCfg();
    var autoTxt = 'Du musst hier nichts einstellen: der Autopilot misst nachts auf dem wachsenden Kursarchiv und übernimmt nur doppelt bestätigte, robuste Ergebnisse – morgens vor Handelsbeginn' +
      (a.regime !== false ? '; die Marktlage wird stündlich gemessen und angezeigt – in erkennbar wirren Phasen setzt sie neue Einstiege für rund eine Stunde aus' : '') +
      '. Jede Änderung steht im Experiment-Journal (Auswertung).';
    var alleAn = a.on !== false;
    // Sperren zuerst - was gerade NICHT gehandelt wird, ist die wichtigste Information
    var sperrHtml = '';
    if (killSwitchAktiv()) {
      var ks = D.killSwitch;
      sperrHtml += '<div style="font-size:var(--fs-text); color:var(--down); font-weight:700; margin-bottom:6px; padding:6px 8px; border:1px solid var(--down); border-radius:var(--r-normal);">' +
        'Kill-Switch aktiv: Tagesverlust ' + ks.pct + ' % hat das Limit von −' + ks.limit + ' % erreicht. ' +
        (ks.n ? ks.n + ' Position(en) wurden sofort glattgestellt. ' : '') +
        'Es wird heute nichts mehr eröffnet – morgen früh läuft der Handel automatisch wieder an.</div>';
    }
    if (D.handelsPause && D.handelsPause.bis > Date.now()) {
      sperrHtml += '<div style="font-size:var(--fs-text); color:var(--warn); margin-bottom:6px; padding:6px 8px; border:1px solid var(--warn); border-radius:var(--r-normal);">' +
        'Handelspause (Marktlage): ' + U.esc(D.handelsPause.grund || '') + '. Keine neuen Einstiege bis ' +
        new Date(D.handelsPause.bis).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr. ' +
        'Offene Positionen werden normal weiter gemanagt.</div>';
    }
    var IV_NAME = { '1m': '1-Minuten-Kerzen', '5m': '5-Minuten-Kerzen', '15m': '15-Minuten-Kerzen', '60m': 60 + '-Minuten-Kerzen' };
    var ivTxt = IV_NAME[c.interval] || (c.interval || '60m');
    el.innerHTML = sperrHtml +
      '<div style="font-size:var(--fs-gross); font-weight:700; margin-bottom:4px;">' + name + ' · ' + ivTxt + '</div>' +
      '<div style="font-size:var(--fs-text); color:var(--ink-2); margin-bottom:4px;">' + was + (exitTxt ? ' ' + exitTxt : '') + '</div>' +
      (wer ? '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:4px;">' + U.esc(wer) + '</div>' : '') +
      (alleAn
        ? '<div style="font-size:var(--fs-neben); color:var(--muted);">' + autoTxt + '</div>'
        : '<div style="font-size:var(--fs-neben); color:var(--warn); margin-bottom:6px;">Der Autopilot ist ausgeschaltet – die Strategie verbessert sich gerade NICHT von selbst.</div>' +
          '<button class="btn tiny" id="klartextAutoBtn">Autopilot einschalten</button>');
    var kab = document.getElementById('klartextAutoBtn');
    if (kab) kab.addEventListener('click', function () {
      var a2 = autoOptCfg();
      a2.on = true; a2.regime = true;
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'hand-' + Date.now(), at: Date.now(), quelle: 'hand', applied: ['Autopilot → an'],
        txt: 'Autopilot über die Klartext-Karte eingeschaltet.' });
      save(); renderKlartext(); renderTune(); renderRegime(); renderPilot();
    });
  }

  function renderRegime(phase) {
    var hint = document.getElementById('regimeHint');
    if (hint && D) {
      hint.textContent = autoOptCfg().regime !== false
        ? 'Die Marktlage wird stündlich gemessen und hier angezeigt. Die Strategie stellt sie nicht um – das entscheidet der Autopilot nach der Nacht-Messung, oder du selbst. In erkennbar wirren Phasen setzt sie neue Einstiege für rund eine Stunde aus; offene Positionen laufen normal weiter.'
        : '';
    }
    var el = document.getElementById('regimeStatus');
    if (!el || !D) return;
    var a = autoOptCfg();
    if (phase) { el.innerHTML = '<span style="color:var(--acc);">Marktlage ' + U.esc(phase) + '</span>'; return; }
    var r = D.regime;
    if (!r) { el.innerHTML = a.regime === false ? '<span style="color:var(--muted);">Marktlage-Anzeige ist aus.</span>'
      : '<span style="color:var(--muted);">Noch keine Messung – startet automatisch nach Handelsbeginn.</span>'; return; }
    var f = r.fakten;
    el.innerHTML = (r.ok ? '<b>' + U.dt(r.at) + '</b> · Quelle: ' + U.esc(r.quelle) + '<br>' + U.esc(r.txt) : '' + U.esc(r.txt)) +
      (f ? '<div style="color:var(--muted); margin-top:4px; font-size:var(--fs-neben);">Gemessen an ' + f.geprueft + ' Werten: Trendanteil ' + f.trendAnteilPct +
        ' % · mittleres |z| ' + f.mittleresAbsZ + ' · Wellen-Score ' + f.mittlererWellenScore + ' · gültige Kanäle ' + f.kanalAnteilPct +
        ' % · 5-Min-Vola ' + f.vola1mPct + ' %</div>' : '');
  }

  /* ================= Autopilot (v8) =================
   * Ersetzt Selbst-Optimierung und Strategie-Farm durch EINE Kette:
   *  1. SAMMELN  – jeder Scan und jeder Messlauf füttert das Kursarchiv (rollierend 90 Tage).
   *  2. MESSEN   – nachts nach US-Börsenschluss: Walk-Forward über die 4 Setups × Parameter-
   *                Raster auf dem Archiv. Die Rechenlast liegt außerhalb der Handelszeit.
   *  3. URTEILEN – nur belastbare Ergebnisse zählen (>= 30 OOS-Trades auf >= 12 ungesehenen
   *                Handelstagen). Eine Empfehlung muss von ZWEI aufeinanderfolgenden Nacht-
   *                Messungen bestätigt werden – ein einzelner Sieg kann eine Münzwurf-Serie
   *                sein (das ersetzt die Bewährungsprüfung der alten Farm).
   *  4. ANWENDEN – morgens VOR Handelsbeginn, nie mitten im Handel. Die Hand-Sperre gilt:
   *                von dir gesetzte Felder fasst der Autopilot nicht an. */
  function autoOptCfg() {
    if (!D.autoOpt) D.autoOpt = {};
    var a = D.autoOpt;
    if (a.on == null) a.on = true;             // Autopilot an/aus
    if (a.regime == null) a.regime = true;     // Marktlage-Anzeige an/aus
    if (a.regimeMin == null) a.regimeMin = 60;
    if (a.lastMess == null) a.lastMess = 0;
    if (a.lastRegime == null) a.lastRegime = 0;
    return a;
  }
  /** Woran scheitert ein Kandidat? Klartext fuer Ranking, Bericht und Auswertung mit Claude. */
  function scheiterGrund(r) {
    if (String(r.verdict).indexOf('robust') === 0) return 'robust – wird nach einer Bestätigungs-Nacht übernommen';
    var g = [];
    var smax = r.scheibenMax || 4;
    if (!r.belastbar) {
      if ((r.n || 0) < MIN_OOS_TRADES) g.push('nur ' + (r.n || 0) + ' von ' + MIN_OOS_TRADES + ' nötigen OOS-Trades');
      if ((r.oosTage || 0) < MIN_OOS_TAGE) g.push('nur ' + (r.oosTage || 0) + ' von ' + MIN_OOS_TAGE + ' nötigen ungesehenen Handelstagen');
      if ((r.scheibenGueltig || 0) < 3) g.push('nur ' + (r.scheibenGueltig || 0) + '/' + smax + ' Prüfscheiben auswertbar');
    } else {
      if (r.haltenPct != null && r.schlaegtHalten === false) {
        g.push('Walk-Forward ' + r.wfRet + ' % gegen ' + r.haltenPct + ' % fürs blosse Halten desselben Universums – ' +
          'die Regel verdient weniger als Nichtstun. (Sie trägt dabei weniger Marktrisiko; wer das bewusst will, ' +
          'muss es bewusst wollen.)');
      }
      if (r.wfRet <= 0) g.push('Walk-Forward-Rendite ' + r.wfRet + ' % – verliert auf ungesehenen Daten');
      if ((r.posSegs || 0) < Math.ceil(smax * 0.7)) g.push('nur ' + (r.posSegs || 0) + '/' + smax + ' Zeitscheiben positiv – nicht konsistent');
      if ((r.pf || 0) <= 1) g.push('Profit-Faktor ' + r.pf + ' – Verluste überwiegen');
      if (r.bootLossProb != null && r.bootLossProb > 45) g.push('Bootstrap: ' + r.bootLossProb + ' % Verlust-Wahrscheinlichkeit bei Neuziehung der Trades');
    }
    return g.join(' · ') || 'knapp unter der Robustheits-Schwelle';
  }

  /** Messbericht als Markdown – landet in Downloads/Markt-Dashboard-Daten/messbericht.md.
   *  Klartext: für dich zum Nachlesen und für Claude zum Auswerten (die geplanten Claude-
   *  Aufgaben lesen denselben Ordner). Pure Funktion, testbar über window.__pilotBericht. */
  function baueMessbericht(c, a, extra) {
    extra = extra || {};
    var z = [];
    z.push('# Autopilot-Messbericht');
    z.push('');
    z.push('Stand: ' + new Date(c.at || Date.now()).toLocaleString('de-DE') + ' Uhr' +
      (a.lastCheck && a.lastCheck.dauerMin ? ' · Rechenzeit ' + a.lastCheck.dauerMin + ' Min' : '') +
      (extra.version ? ' · App ' + extra.version : ''));
    z.push('');
    z.push('## Datenlage (Messbasis dieser Nacht)');
    z.push('');
    z.push('| Zeitrahmen | Werte | Handelstage |');
    z.push('|---|---|---|');
    var dl = c.datenlage || {};
    ['1m', '5m', '15m', '60m'].forEach(function (iv) {
      var d = dl[iv] || {};
      z.push('| ' + iv + ' | ' + (d.werte || 0) + ' | ' + (d.handelstage || 0) + ' |');
    });
    z.push('');
    if (a.lastBackfill) z.push('Capital-Backfill: zuletzt ' + new Date(a.lastBackfill.at).toLocaleString('de-DE') + ' – ' + a.lastBackfill.bars + ' Kerzen für ' + a.lastBackfill.symbole + ' Werte nachgeladen (' + a.lastBackfill.requests + ' Anfragen).');
    if (a.lastBackfill) z.push('');
    z.push('Das Kursarchiv sammelt rollierend 90 Kalendertage – die Tabelle wächst mit jedem Handelstag, an dem die App läuft. Hürde für ein belastbares Urteil: **' + MIN_OOS_TRADES + ' Out-of-Sample-Trades auf ' + MIN_OOS_TAGE + ' ungesehenen Handelstagen**.');
    z.push('');
    z.push('## Kostenrealität (woran das Modell geeicht ist)');
    z.push('');
    z.push('Die Simulation rechnet nicht mit Pauschalen, sondern mit echten Emittenten-Kursen (Stichprobe onvista, 20.08.2026). Befund: **die Geld-Brief-Spanne ist ein fester Cent-Betrag**, kein Prozentsatz – rund 1 ct bei Bezugsverhältnis 0,1 und 2 ct bei 1,0, unabhängig vom Preis des Scheins. Ein 8-Euro-Schein zahlt damit 0,13 % je Seite, ein 9-Cent-Schein 11,5 %.');
    z.push('');
    z.push('Daraus folgt der wichtigste Kostenhebel überhaupt: Ein Schein mit Bezugsverhältnis 1,0 kostet das Zehnfache je Stück, zahlt aber nur den doppelten Cent – also **ein Fünftel des relativen Spreads bei identischem Hebel** (Omega hängt nicht am Bezugsverhältnis). Was die Bewegung mindestens hergeben muss, damit ein Trade überhaupt lohnt:');
    z.push('');
    z.push('| Profil | Bezugsv. | Scheinpreis | Spread je Seite | Hebel | Basiswert muss laufen |');
    z.push('|---|---|---|---|---|---|');
    (function () {
      var spotB = 100, nowB = Date.now();
      Object.keys(Q.PROFILES).forEach(function (pk) {
        var p = Q.PROFILES[pk], bv = p.ratio || Q.RATIO;
        var w = { strike: Math.round(spotB * (1 + p.otmPct) * 100) / 100, expiry: nowB + p.days * 86400000, iv: 0.35, ratio: bv };
        var wv = Q.warrantValue('call', w, spotB, nowB);
        if (!(wv > 0.001)) return;
        var sp = Q.effSpread(0.35, undefined, wv, bv), om = Q.warrantOmega('call', w, spotB, nowB);
        var fee = D.intraday.orderFee || 0, budg = Math.max(1, equityNow() * D.intraday.budgetPct);
        var rt = 2 * sp + (2 * fee) / budg;
        z.push('| ' + p.name + ' | ' + String(bv).replace('.', ',') + ' | ' + wv.toFixed(2).replace('.', ',') + ' € | ' +
          (sp * 100).toFixed(2).replace('.', ',') + ' % | ' + om.toFixed(1).replace('.', ',') + ' | **' +
          (om > 0 ? (rt / om * 100).toFixed(3).replace('.', ',') : '–') + ' %** |');
      });
    })();
    z.push('');
    z.push('Ordergebühr steht auf ' + ((D.intraday.orderFee || 0) === 0 ? '**0** – Capital.com berechnet keine Kommission, alles steckt im Spread.' : (D.intraday.orderFee + ' $ je Order.')));
    z.push('');
    /* Wochenrueckblick: Eine einzelne Nacht kann Zufall sein - erst der
     * 7-Tage-Blick zeigt, ob etwas TRAEGT. Rollierend statt Kalenderwoche,
     * damit der Abschnitt in jedem Bericht steht und nie veraltet. */
    z.push('## Wochenrückblick (rollierend, letzte 7 Tage)');
    z.push('');
    (function () {
      var seitW = (c.at || Date.now()) - 7 * 86400000;
      var wt = (D.trades || []).filter(function (t) { return t.status === 'closed' && t.closeT >= seitW; });
      if (!wt.length) {
        z.push('Keine abgeschlossenen Trades in den letzten 7 Tagen.');
      } else {
        z.push('| Strategie | Trades | Treffer | Ergebnis |');
        z.push('|---|---|---|---|');
        [['intraday', 'Intraday'], ['hourly', 'Stunden'], [null, 'Altbestand']].forEach(function (paar) {
          var liste = wt.filter(function (t) { return paar[0] ? t.strategy === paar[0] : !t.strategy; });
          if (!liste.length) return;
          var wins = liste.filter(function (t) { return t.pnl > 0; }).length;
          var summe = liste.reduce(function (a2, t) { return a2 + (t.pnl || 0); }, 0);
          z.push('| ' + paar[1] + ' | ' + liste.length + ' | ' + Math.round(wins / liste.length * 100) + ' % | ' +
            (summe > 0 ? '+' : '') + summe.toFixed(2).replace('.', ',') + ' $ |');
        });
        var wBasis = wt.filter(function (t) { return t.basis; }).length;
        if (wBasis) z.push('');
        if (wBasis) z.push('Davon ' + wBasis + ' über den Basiswert (statt Hebelschein).');
      }
      var wSch = (D.schatten || []).filter(function (s) { return s.status === 'closed' && s.closeT >= seitW; });
      if (wSch.length) z.push('');
      if (wSch.length) z.push('Vorwärtstest: ' + wSch.length + ' Schatten-Trades abgeschlossen (Bilanz je Grund steht im Vorwärtstest-Abschnitt der App).');
      var wTune = (D.tuneLog || []).filter(function (e2) { return e2.at >= seitW; });
      if (wTune.length) {
        z.push('');
        z.push('Eingriffe der Woche (Autopilot/Sicherungen, jüngste zuerst):');
        wTune.slice(0, 8).forEach(function (e2) {
          z.push('- ' + new Date(e2.at).toLocaleDateString('de-DE') + ' · ' + (e2.quelle || '?') + ': ' +
            ((e2.applied || []).join(', ') || (e2.txt || '').slice(0, 90)));
        });
        if (wTune.length > 8) z.push('- … und ' + (wTune.length - 8) + ' weitere');
      }
      var mv = (D.mfVerlauf || []).filter(function (p) { return p.t >= seitW; });
      if (mv.length >= 2) {
        var e0 = mv[0], e1 = mv[mv.length - 1];
        function pctW(a2, b2) { return a2 > 0 ? ((b2 / a2 - 1) * 100).toFixed(2) : '–'; }
        z.push('');
        z.push('Bücher über die Woche (' + mv.length + ' Tagespunkte): Momentum ' + pctW(e0.momentum, e1.momentum) +
          ' % · Drift ' + pctW(e0.drift, e1.drift) + ' % · SPY ' + pctW(e0.spy, e1.spy) + ' %.');
      }
    })();
    z.push('');
    z.push('## Ergebnis dieser Messung');
    z.push('');
    z.push(a.lastCheck ? a.lastCheck.txt : '–');
    if (c.rec && c.rec.richtung && (c.rec.richtung.callN || c.rec.richtung.putN)) {
      var ri = c.rec.richtung;
      z.push('');
      z.push('Richtungs-Bilanz des besten Kandidaten: Calls ' + ri.callN + ' Trades (' + (ri.callPnl > 0 ? '+' : '') + ri.callPnl + ' $) · Puts ' + ri.putN + ' Trades (' + (ri.putPnl > 0 ? '+' : '') + ri.putPnl + ' $)' +
        (ri.callN >= 10 && ri.putN >= 10 && ((ri.callPnl > 0) !== (ri.putPnl > 0)) ? ' – trägt bisher nur in EINE Richtung, beobachten.' : '.'));
    }
    if (a.pending && a.pending.rec) { z.push(''); z.push('**Vorgemerkt:** ' + a.pending.rec.modeName + ' · ' + a.pending.rec.interval + ' – wird angewendet, sobald die Börse geschlossen ist.'); }
    if (a.lastApply) { z.push(''); z.push('Zuletzt automatisch übernommen: ' + new Date(a.lastApply.at).toLocaleString('de-DE') + ' – ' + (a.lastApply.name || '')); }
    z.push('');
    z.push('## Ranking – alle Kandidaten und woran sie scheitern');
    z.push('');
    z.push('| # | Setup | Zeitrahmen | WF-Rendite | Scheiben+ | Trades | Tage | PF | Treffer | Woran scheitert es |');
    z.push('|---|---|---|---|---|---|---|---|---|---|');
    (c.ranking || []).forEach(function (r, i) {
      z.push('| ' + (i + 1) + ' | ' + r.name + ' | ' + r.interval + ' | ' + (r.wfRet > 0 ? '+' : '') + r.wfRet + ' % | ' +
        (r.posSegs || 0) + '/' + (r.scheibenMax || 4) + ' | ' + (r.n || 0) + ' | ' + (r.oosTage || 0) + ' | ' + (r.pf != null ? r.pf : '–') + ' | ' +
        (r.winRate != null ? r.winRate + ' %' : '–') + ' | ' + scheiterGrund(r) + ' |');
    });
    z.push('');
    var fb = c.rec && c.rec.filterBilanz;
    z.push('## Filter-Bilanz (bester Kandidat, ungesehene Daten)');
    z.push('');
    if (fb && fb.zeilen && fb.zeilen.length) {
      z.push('Basis mit allen Filtern: ' + (fb.basisRet > 0 ? '+' : '') + fb.basisRet + ' % bei ' + fb.basisN + ' Trades. „Nutzen“ = Rendite mit Filter minus ohne – positiv heißt: der Filter spart Geld.');
      z.push('');
      z.push('| Filter | mit | ohne | Nutzen | Trades mit/ohne | Urteil |');
      z.push('|---|---|---|---|---|---|');
      fb.zeilen.forEach(function (r) {
        var urteil = r.duenn ? 'zu wenig Trades für ein Urteil'
          : r.nutzen > 0.5 ? 'spart Geld' : r.nutzen < -0.5 ? 'kostet Geld – Kandidat zum Lockern' : 'neutral';
        z.push('| ' + r.name + ' | ' + (r.mitRet > 0 ? '+' : '') + r.mitRet + ' % | ' + (r.ohneRet > 0 ? '+' : '') + r.ohneRet + ' % | ' +
          (r.nutzen > 0 ? '+' : '') + r.nutzen + ' Pp | ' + r.mitN + '/' + r.ohneN + ' | ' + urteil + ' |');
      });
    } else {
      z.push('Keine Filter-Bilanz in dieser Messung (zu wenig Daten auf der Testscheibe).');
    }
    z.push('');
    z.push('Nur live wirksame Filter (nicht im Backtest abbildbar) – Urteil aus dem Schattenbuch:');
    z.push('');
    var sst = extra.schatten || {};
    var sk = Object.keys(sst);
    if (sk.length) {
      sk.forEach(function (g) {
        var x = sst[g];
        var u = x.n < 5 ? 'zu früh (' + x.n + ' Schatten)'
          : x.gerettet > x.verhindert * 1.5 ? 'rettet Geld' : x.verhindert > x.gerettet * 1.5 ? 'verhindert eher Gewinne' : 'unentschieden';
        z.push('- ' + g + ': ' + x.n + ' Schatten · Ø ' + (x.n ? Math.round(x.sumPct / x.n * 10) / 10 : 0) + ' % · gerettet ' + x.gerettet + ' / verhindert ' + x.verhindert + ' → ' + u);
      });
    } else {
      z.push('- noch keine abgeschlossenen Schatten – entsteht im Live-Betrieb.');
    }
    z.push('');
    if (a.tiefensuche) {
      z.push('## Tiefensuche (Leerlaufstunden, rein aus dem Archiv)');
      z.push('');
      z.push('Zuletzt ' + new Date(a.tiefensuche.at).toLocaleString('de-DE') + ' · ' + a.tiefensuche.geprueft + ' Kombinationen in ' + a.tiefensuche.dauerMin + ' Min.');
      if ((a.tiefensuche.top || []).length) {
        z.push('');
        z.push('| Kombination | Training | ungesehen | Trades |');
        z.push('|---|---|---|---|');
        a.tiefensuche.top.forEach(function (f) {
          z.push('| ' + f.name + ' | ' + (f.trainRet > 0 ? '+' : '') + f.trainRet + ' % | ' + (f.testRet > 0 ? '+' : '') + f.testRet + ' % | ' + f.testN + ' |');
        });
      }
      z.push('');
      z.push(a.entdeckt ? 'Fund tritt in der naechsten Nacht-Messung an: ' + a.entdeckt.name : 'Kein Fund, der out-of-sample positiv war.');
      z.push('');
    }
    if (a.kiKandidat) {
      z.push('## KI-Vorschlag (lokales Modell, Whitelist-geprueft)');
      z.push('');
      var kiErg = (c.ranking || []).filter(function (r) { return r.modeKey === 'ki'; })[0];
      z.push('- Kandidat: ' + a.kiKandidat.name);
      if (a.kiKandidat.begruendung) z.push('- Begruendung des Modells: ' + a.kiKandidat.begruendung);
      z.push(kiErg
        ? '- Ergebnis dieser Messung: WF ' + (kiErg.wfRet > 0 ? '+' : '') + kiErg.wfRet + ' % · ' + kiErg.n + ' Trades · ' + kiErg.verdict
        : '- Laeuft ab der naechsten Messung mit.');
      z.push('');
    }
    z.push('## Verlauf der letzten Messungen');
    z.push('');
    if ((a.messHistorie || []).length) {
      z.push('| Datum | bester Kandidat | WF-Rendite | Trades | Tage | belastbar |');
      z.push('|---|---|---|---|---|---|');
      a.messHistorie.slice(0, 14).forEach(function (h) {
        z.push('| ' + new Date(h.at).toLocaleString('de-DE') + ' | ' + h.name + ' · ' + h.interval + ' | ' +
          (h.wfRet > 0 ? '+' : '') + h.wfRet + ' % | ' + h.n + ' | ' + (h.oosTage || 0) + ' | ' + (h.belastbar ? 'ja' : 'nein') + ' |');
      });
      z.push('');
      z.push('Steigen Trades und Tage von Nacht zu Nacht, wächst das Archiv wie geplant. Bleiben sie stehen, lief die App nachts nicht durch (Tray-Modus reicht).');
    } else {
      z.push('Noch keine früheren Messungen – der Verlauf entsteht ab der zweiten Nacht.');
    }
    z.push('');
    var sp = Object.keys(extra.handSperre || {});
    z.push('## Von Hand gesetzte Felder (für die Automatik gesperrt)');
    z.push('');
    z.push(sp.length ? sp.map(function (f) { return HAND_LABEL[f] || f; }).join(' · ') : 'keine – alle Felder werden vom Autopiloten gepflegt');
    z.push('');
    var cfg = extra.intraday || {};
    z.push('## Aktuelle Handels-Konfiguration');
    z.push('');
    z.push('Setup ' + (cfg.mode || '?') + (cfg.exitStyle && cfg.exitStyle !== 'laufen' ? '/' + cfg.exitStyle : '') +
      ' · Zeitrahmen ' + (cfg.interval || '?') + ' · ' + String(cfg.lineType || 'ema').toUpperCase() + (cfg.period || '') +
      ' · Bestätigung ' + (cfg.confirmBps || '?') + ' bps · Zeitfenster ' + (cfg.window || 'all') +
      ' · Stop ' + (cfg.scalpSL === 'auto' ? 'auto' : (cfg.scalpSL || '?') + ' %') +
      ' · Cooldown ' + (cfg.cooldownMin != null ? cfg.cooldownMin + ' Min' : 'Modus-Standard') + ' · max. ' + (cfg.maxPerDay || '?') + ' Trades/Tag' +
      ' · Trendfilter ' + (cfg.trendFilter ? 'an' : 'aus') + ' · Kanal ' + (cfg.channel !== false ? 'an' : 'aus'));
    z.push('');
    z.push('## Auswertung mit Claude');
    z.push('');
    z.push('Im selben Ordner liegen: analyse-daten.json (Depot, Trades, Geduld-Bilanz, Schattenbuch, Gesundheit), kursdaten.json (Bars des letzten Scans + Tageshistorie) und engine.js (identische Rechenlogik der App – eigene Backtests damit exakt vergleichbar). ' +
      'Verbesserungsvorschläge zurück an die App: empfehlung.json mit {"quelle":"claude","id":"eindeutig","begruendung":"…","intraday":{…}} – die App übernimmt nur Whitelist-Felder und respektiert die Hand-Sperre.');
    z.push('');
    z.push('*Simulation – keine Anlageberatung.*');
    return z.join('\n');
  }
  if (typeof window !== 'undefined') window.__pilotBericht = baueMessbericht;
  if (typeof window !== 'undefined') { window.__tiefensuche = function (o) { return tiefensuche(o || { unbegrenzt: true }); }; window.__pilotMessen = function () { return pilotMessen(true); }; }
  /* __warnband wird von renderer.js gebraucht: Bei gestoerter Kursquelle blieb das
   * Warnband bisher stumm, obwohl es genau dafuer gebaut ist - die Meldung stand nur
   * klein in der Kopfzeile. warnbandSetzen ist hier lokal, also wird sie durchgereicht. */
  if (typeof window !== 'undefined') { window.__warnband = warnbandSetzen; }
  if (typeof window !== 'undefined') { window.__save = save; window.__ladeArchivDaten = ladeArchivDaten; window.__labCommonOpts = labCommonOpts; window.__btIntraday = btIntraday; window.__D = function () { return D; }; window.__health = function () { return HEALTH; }; }   // fuer Funktionstests

  /* ---- Gesamtzaehler-Pflege ----
   * Alle 5 Minuten (und bei jeder Diagnose) wandert das DELTA der Sitzungszaehler
   * in D.gesamtzaehler. Ein Schnappschuss verhindert Doppelzaehlung: Es wird immer
   * nur das aufaddiert, was seit dem letzten Abgleich dazugekommen ist. */
  var GZ_FELDER = ['scans', 'scanErrors', 'fetchOk', 'fetchFail', 'kiOk', 'kiFail', 'killSwitch', 'staleBars', 'workerFail',
    // neu 22.08.2026: unbewertete offene Positionen (Quelle weg) und fehlgeschlagene Speicherversuche
    'exitBlind', 'saveFail'];
  var GZ_SCHNAPP = null;
  function gesamtzaehlerAuffrischen() {
    try {
      var g = D && D.gesamtzaehler;
      if (!g) return null;
      var s = GZ_SCHNAPP;
      if (!s) { s = { t: HEALTH.startedAt }; GZ_FELDER.forEach(function (k) { s[k] = 0; }); }
      g.laufzeitMin = (g.laufzeitMin || 0) + Math.max(0, Math.round((Date.now() - s.t) / 60000));
      GZ_FELDER.forEach(function (k) { g[k] = (g[k] || 0) + Math.max(0, (HEALTH[k] || 0) - (s[k] || 0)); });
      GZ_SCHNAPP = { t: Date.now() };
      GZ_FELDER.forEach(function (k) { GZ_SCHNAPP[k] = HEALTH[k] || 0; });
      save();
      return g;
    } catch (eG) { return null; }
  }
  setInterval(gesamtzaehlerAuffrischen, 5 * 60000);
  if (typeof window !== 'undefined') {
    // Fuer die Diagnose: erst abgleichen, dann eine KOPIE liefern - der Versand
    // haelt so immer den Stand der Sekunde, nicht den des letzten 5-Minuten-Takts.
    window.__healthGesamt = function () {
      var g = gesamtzaehlerAuffrischen();
      return g ? JSON.parse(JSON.stringify(g)) : null;
    };
  }

  /* ================= Tiefensuche (nutzt die brachliegenden Nacht-/Wochenendstunden) ====
   * Mehr Rechnen auf denselben Daten schafft kein Wissen - TIEFER suchen schon. Nach der
   * Nacht-Messung durchkaemmt die Tiefensuche auf dem ARCHIV (kein einziger Netzabruf)
   * einen viel breiteren Parameterraum, als die 15-Minuten-Messung es kann. Der beste Fund
   * tritt in der naechsten Nacht als markierter Kandidat im regulaeren Walk-Forward an und
   * muss dieselben Huerden nehmen wie alle anderen. Tagsueber laeuft sie nie: CPU und
   * Yahoo-Limits gehoeren dann dem Live-Scanner. */
  var tiefRunning = false, tiefStartAt = 0;
  /** Minuten bis zur naechsten US-Boersenoeffnung (Wochenende beruecksichtigt, grob). */
  /** Muss die Rechnerei fuer den Live-Handel Platz machen? Nur dann, wenn ueberhaupt
   *  eine Handels-Automatik laeuft - sonst gehoert die Maschine der Messung. */
  function handelBrauchtRechenzeit() {
    return !!(D && (D.intraday.enabled || D.hourlyEnabled !== false));
  }
  function minutenBisOeffnung() {
    var t = Date.now();
    for (var k = 0; k < 5 * 96; k++) {           // in 15-Min-Schritten bis zu 5 Tage voraus
      var d = new Date(t);
      var wt = d.getUTCDay();
      var m = Q.minutenSeitOeffnung(t);
      if (wt >= 1 && wt <= 5 && m >= 0 && m < 15) return Math.round((t - Date.now()) / 60000);
      t += 15 * 60000;
    }
    return 9999;
  }
  /** Messbasis NUR aus dem Archiv bauen - fuer Rechenlaeufe ohne Netzlast. */
  async function ladeArchivDaten(intervals) {
    var data = {};
    var syms = messUniversum();
    for (var ii = 0; ii < intervals.length; ii++) {
      var iv = intervals[ii], mapA = {};
      for (var si = 0; si < syms.length; si++) {
        var serie = await window.Archiv.serie(iv, syms[si]);
        if (serie && serie.length > 200) mapA[syms[si]] = serie;
      }
      data[iv] = mapA;
    }
    return { intervals: intervals, data: data };
  }
  /* ================= Zucht: Population ueber Naechte hinweg =================
   * Bisher hiess es "Tiefensuche", tat aber nichts Zuechterisches: Jede Nacht lief
   * dasselbe feste Raster, unabhaengig davon, was die Nacht davor herausgefunden hatte.
   * Neu ist genug Wissen fuer genau EINEN weiteren Handelstag - der Rest war Wiederholung.
   * Jetzt gibt es eine Population: Kandidaten, die sich out-of-sample bewaehrt haben,
   * ueberleben die Nacht und bekommen Nachkommen, die sich in ein bis zwei Achsen von
   * ihnen unterscheiden. Dazu kommt frisches Blut aus dem systematischen Raster, damit
   * die Suche nicht in einem lokalen Optimum versauert. Was schon einmal gerechnet wurde,
   * wird nicht wieder gerechnet - das ist der eigentliche Gewinn an Erkenntnis je Nacht. */
  var ZUCHT_ACHSEN = {
    period:     [9, 14, 20, 30, 50],
    confirmBps: [5, 15, 30],
    lineType:   ['ema', 'vwap'],
    profile:    ['atm21_b', 'atm60_b', 'otm3_30b'],
    scalpSL:    [10, 15, 20, 30, 45, 'auto'],
    scalpHold:  [15, 30, 60, 120, 240, 390],
    channel:    [true, false]
  };
  /* Wie oft eine Achse mutiert, richtet sich nach ihrer GEMESSENEN Wirkung
   * (15m-Archiv, 20.08.2026, Spannweite der Rendite ueber die Achse):
   * scalpSL 6,73 Pp | scalpHold 5,06 | lineType 4,03 | confirmBps 2,23 | period 0,18.
   * An einer wirkungslosen Achse zu drehen kostet eine Nacht und bringt nichts. */
  var ZUCHT_GEWICHT = [['scalpSL', 7], ['scalpHold', 5], ['channel', 5], ['lineType', 4], ['confirmBps', 2], ['profile', 2], ['period', 1]];
  var ZUCHT_UEBERLEBENDE = 12;     // Groesse der Population
  var ZUCHT_KINDER = 40;           // Nachkommen je Elternteil und Gruppe
  var ZUCHT_ZIEL = 480;            // Kombinationen je Basis/Zeitrahmen und Nacht
  var ZUCHT_GESEHEN_MAX = 40000;   // Gedaechtnis: so viele gepruefte Kombinationen

  /** Kanal wirkt nur beim Wellenreiter - ueberall sonst auf false setzen, damit
   *  scheinbar verschiedene Kandidaten als das erkannt werden, was sie sind: dieselben. */
  function zuchtNormal(k) {
    if (k.basis !== 'wave') k.channel = false;
    return k;
  }
  function zuchtKey(k) {
    return [k.basis, k.interval, k.period, k.confirmBps, k.lineType, k.profile, k.scalpSL, k.scalpHold, k.channel].join('|');
  }
  function zuchtWuerfel(liste) { return liste[Math.floor(Math.random() * liste.length)]; }
  function zuchtAchse() {
    var summe = 0, i;
    for (i = 0; i < ZUCHT_GEWICHT.length; i++) summe += ZUCHT_GEWICHT[i][1];
    var t = Math.random() * summe;
    for (i = 0; i < ZUCHT_GEWICHT.length; i++) { t -= ZUCHT_GEWICHT[i][1]; if (t <= 0) return ZUCHT_GEWICHT[i][0]; }
    return ZUCHT_GEWICHT[0][0];
  }
  function zuchtKopie(k) {
    return { basis: k.basis, interval: k.interval, period: k.period, confirmBps: k.confirmBps,
      lineType: k.lineType, profile: k.profile, scalpSL: k.scalpSL, scalpHold: k.scalpHold,
      channel: k.channel };
  }
  /** Nachkomme: wie der Elternteil, aber in ein bis zwei Achsen verschoben. */
  function zuchtMutiere(k) {
    var m = zuchtKopie(k);
    var n = Math.random() < 0.7 ? 1 : 2;      // meist kleine Schritte, manchmal groessere
    for (var i = 0; i < n; i++) {
      var a = zuchtAchse();
      if (a === 'channel' && m.basis !== 'wave') a = 'scalpSL';   // dort waere es wirkungslos
      m[a] = zuchtWuerfel(ZUCHT_ACHSEN[a]);
    }
    return zuchtNormal(m);
  }
  /** Voellig frischer Kandidat - gegen Inzucht und lokale Optima. */
  function zuchtZufall(basis, interval) {
    return { basis: basis, interval: interval,
      period: zuchtWuerfel(ZUCHT_ACHSEN.period), confirmBps: zuchtWuerfel(ZUCHT_ACHSEN.confirmBps),
      lineType: zuchtWuerfel(ZUCHT_ACHSEN.lineType), profile: zuchtWuerfel(ZUCHT_ACHSEN.profile),
      scalpSL: zuchtWuerfel(ZUCHT_ACHSEN.scalpSL), scalpHold: zuchtWuerfel(ZUCHT_ACHSEN.scalpHold),
      channel: basis === 'wave' ? zuchtWuerfel(ZUCHT_ACHSEN.channel) : false };
  }
  /* Gleichmaessige, IMMER GLEICHE Stichprobe: jeder n-te Wert der sortierten Liste.
   * Eine zufaellige Auswahl haette die Vergleichbarkeit zweier Naechte zerstoert -
   * und genau darauf beruht die Regel, dass ein Fund zweimal bestaetigt sein muss. */
  var ZUCHT_WERTE = 16;
  function zuchtStichprobe(m) {
    var syms = Object.keys(m).sort();
    if (syms.length <= ZUCHT_WERTE) return m;
    var schritt = syms.length / ZUCHT_WERTE, out = {};
    for (var i5 = 0; i5 < ZUCHT_WERTE; i5++) {
      var sy5 = syms[Math.floor(i5 * schritt)];
      if (sy5) out[sy5] = m[sy5];
    }
    return Object.keys(out).length >= 3 ? out : m;
  }
  function zuchtStand(a) {
    if (!a.zucht) a.zucht = { gen: 0, ueberlebende: [], gesehen: [] };
    if (!a.zucht.gesehen) a.zucht.gesehen = [];
    if (!a.zucht.ueberlebende) a.zucht.ueberlebende = [];
    return a.zucht;
  }

  var tiefFortschritt = null;   // Live-Stand fuer die Oberflaeche (sonst Blackbox)
  async function tiefensuche(opts) {
    opts = opts || {};
    var unbegrenzt = !!opts.unbegrenzt;      // Analyselauf: rechnet zu Ende, egal wie lange
    var a = autoOptCfg();
    if (tiefRunning || pilotRunning || centralRunning || jobRunning) return;
    if (!window.Archiv) {
      /* Dieser Waechter stand VOR dem ersten Protokolleintrag und vor tiefRunning:
       * fehlte das Kursarchiv, kehrte die ganze Nacht um, ohne eine Zeile zu
       * hinterlassen. Auch der Haenge-Waechter griff nicht (tiefRunning war nie
       * gesetzt), a.lastTief blieb alt, und die Anzeige zeigte den Stand der letzten
       * gelungenen Nacht - ohne Hinweis, dass seither nichts mehr gerechnet wurde. */
      pilotLogAdd('Tiefensuche uebersprungen: das Kursarchiv ist nicht geladen.');
      return;
    }
    tiefRunning = true;
    tiefStartAt = Date.now();
    tiefFortschritt = null;
    var t0 = Date.now();
    try {
      pilotLogAdd('Tiefensuche gestartet: breite Parametersuche auf dem Archiv (ohne Netzabrufe).');
      renderPilot();
      var ivs = ['15m', '60m'];                    // die Richtung, die die Daten zeigen
      var ld = await ladeArchivDaten(ivs);
      // Basen: die zwei besten unterschiedlichen Grund-Setups des letzten Rankings + Pullback
      var basenSet = {};
      var basen = [];
      ((D.central || {}).ranking || []).forEach(function (r) {
        var b = { breakout: 'breakout_lauf', breakout_lauf: 'breakout_lauf', orb: 'orb',
          reversion: 'reversion', reversion_lang: 'reversion', wave: 'wave', wave_lang: 'wave',
          pullback: 'pullback', ki: null, entdeckt: null }[r.modeKey];
        if (b && !basenSet[b] && basen.length < 2) { basenSet[b] = 1; basen.push(b); }
      });
      if (!basenSet.pullback && basen.length < 3) basen.push('pullback');
      if (!basen.length) basen = ['reversion', 'pullback'];
      var PER = [14, 30], CONF = [5, 15], LT = ['ema', 'vwap'];
      var SL = [10, 15, 20, 30, 'auto'], HOLD = [60, 120, 240, 390], CHAN = [true, false];
      var PROF = ['atm21_b', 'atm60_b', D.intraday.profile || 'otm3_14'];
      PROF = PROF.filter(function (v, i2, arr) { return arr.indexOf(v) === i2; });
      var funde = [], geprueft = 0;
      var GESAMT_MS = unbegrenzt ? Infinity : 22 * 60000;   // Puffer unter dem 25-Minuten-Deckel
      var gruppenGesamt = basen.length * ivs.length, gruppenFertig = 0;
      var msJeKombiSchnitt = 0, kombisGesamtBisher = 0;      // gemessene Geschwindigkeit
      /** Restzeit aus dem, was bisher tatsaechlich gebraucht wurde - keine Schaetzung ins Blaue. */
      function restText(offenHier, kombisJeGruppe) {
        if (!msJeKombiSchnitt) return '';
        var offenSpaeter = Math.max(0, gruppenGesamt - gruppenFertig - 1) * kombisJeGruppe;
        var ms = (offenHier + offenSpaeter) * msJeKombiSchnitt;
        var min = ms / 60000;
        return ' · noch ca. ' + (min >= 60 ? (min / 60).toFixed(1) + ' Std' : Math.max(1, Math.round(min)) + ' Min');
      }
      // Population und Gedaechtnis dieser Zuchtlinie laden
      var zStand = zuchtStand(a);
      var gesehenSet = {};
      zStand.gesehen.forEach(function (g) { gesehenSet[g] = 1; });
      var nachwuchs = [], zufallProGruppe = [];
      pilotLogAdd('Zucht Generation ' + (zStand.gen + 1) + ': ' + zStand.ueberlebende.length +
        ' Ueberlebende aus der Vornacht, ' + zStand.gesehen.length + ' Kombinationen bereits geprueft (werden nicht wiederholt).' +
        (unbegrenzt ? ' Analyselauf – rechnet vollstaendig durch, ohne Zeitlimit.' : ''));
      for (var bi = 0; bi < basen.length; bi++) {
        for (var vi = 0; vi < ivs.length; vi++) {
          var iv2 = ivs[vi];
          var map = ld.data[iv2];
          if (!map || Object.keys(map).length < 3) continue;
          var span = mapSpan(map);
          var cut = tagesGrenze(map, 0.7);
          if (!cut) continue;
          var trainMapVoll = sliceMap(map, span[0], cut, 0);
          var testMapVoll = sliceMap(map, cut, span[1], warmlaufBars(iv2));
          var trainMap = zuchtStichprobe(trainMapVoll);   // Suchen auf der Stichprobe …
          var testMapAlle = testMapVoll;                  // … Urteil auf allen Werten
          var common = labCommonOpts(D.intraday, iv2);
          var basisJetzt = basen[bi];
          // 1) Nachkommen der Ueberlebenden dieser Basis/dieses Zeitrahmens
          var kombis = [], gesehenNeu = {};
          function zuchtNimm(k) {
            zuchtNormal(k);
            var sl3 = zuchtKey(k);
            if (gesehenNeu[sl3] || gesehenSet[sl3]) return false;   // nichts zweimal rechnen
            gesehenNeu[sl3] = 1; kombis.push(k); return true;
          }
          var eltern = zStand.ueberlebende.filter(function (u) {
            return u.k && u.k.basis === basisJetzt && u.k.interval === iv2;
          }).slice(0, 6);
          eltern.forEach(function (el) {
            zuchtNimm(zuchtKopie(el.k));                            // Elternteil selbst mitlaufen lassen
            for (var mv = 0; mv < ZUCHT_KINDER; mv++) zuchtNimm(zuchtMutiere(el.k));
          });
          var ausZucht = kombis.length;
          // 2) Systematisches Raster - aber nur, was noch nie gerechnet wurde
          var raster = [];
          PER.forEach(function (p) { CONF.forEach(function (c) { LT.forEach(function (lt) { PROF.forEach(function (pr) {
            var chanListe = basisJetzt === 'wave' ? CHAN : [false];
            SL.forEach(function (sl2) { HOLD.forEach(function (h2) { chanListe.forEach(function (ch2) {
              raster.push({ basis: basisJetzt, interval: iv2, period: p, confirmBps: c, lineType: lt,
                profile: pr, scalpSL: sl2, scalpHold: h2, channel: ch2 });
            }); }); });
          }); }); }); });
          for (var rz = raster.length - 1; rz > 0; rz--) {          // mischen, damit nicht immer dieselbe Ecke zuerst drankommt
            var rj = Math.floor(Math.random() * (rz + 1)), rt = raster[rz]; raster[rz] = raster[rj]; raster[rj] = rt;
          }
          for (var rk = 0; rk < raster.length && kombis.length < ZUCHT_ZIEL; rk++) zuchtNimm(raster[rk]);
          var ausRaster = kombis.length - ausZucht;
          // 3) Frisches Blut, falls Raster und Zucht schon erschoepft sind
          var versuche = 0;
          while (kombis.length < Math.min(ZUCHT_ZIEL, 60) && versuche++ < 2000) zuchtNimm(zuchtZufall(basisJetzt, iv2));
          var ausZufall = kombis.length - ausZucht - ausRaster;
          if (!kombis.length) { pilotLogAdd('Zucht: ' + basisJetzt + ' · ' + iv2 + ' – alles Erreichbare bereits geprueft.'); continue; }
          Object.keys(gesehenNeu).forEach(function (g2) { gesehenSet[g2] = 1; });
          var schrittNr = (bi * ivs.length + vi) + 1, schritteGesamt = basen.length * ivs.length;
          pilotLogAdd('Zucht Gen ' + (zStand.gen + 1) + ' – Schritt ' + schrittNr + '/' + schritteGesamt + ': ' + basisJetzt + ' · ' + iv2 +
            ' · ' + kombis.length + ' Kombinationen (' + ausZucht + ' aus ' + eltern.length + ' Eltern, ' +
            ausRaster + ' neu aus dem Raster' + (ausZufall ? ', ' + ausZufall + ' zufaellig' : '') + ') · gesucht auf ' +
            Object.keys(trainMap).length + ' Werten, geurteilt auf ' + Object.keys(testMapAlle).length + ' …');
          renderPilot();
          // Jede Gruppe bekommt ihren fairen Anteil an der verbleibenden Zeit.
          var restGruppen = Math.max(1, gruppenGesamt - gruppenFertig);
          var anteilMs = unbegrenzt ? Infinity : Math.max(30000, (GESAMT_MS - (Date.now() - t0)) / restGruppen);
          // Nach Signal-Schluessel gruppieren; die Reihenfolge der Ergebnisse bleibt erhalten
          var buendel = {}, reihenfolge = [];
          kombis.forEach(function (k, ki3) {
            var sk = [k.basis, k.period, k.confirmBps, k.lineType, k.channel].join('|');
            if (!buendel[sk]) { buendel[sk] = []; reihenfolge.push(sk); }
            buendel[sk].push({ k: k, idx: ki3 });
          });
          var trainRes = new Array(kombis.length), BLOCK = 3, tBlock = Date.now(), abgeschnitten = 0, fertigN = 0;
          for (var kb = 0; kb < reihenfolge.length; kb += BLOCK) {
            var gruppenTeil = reihenfolge.slice(kb, kb + BLOCK);
            await Promise.all(gruppenTeil.map(function (sk2) {
              var eintraege = buendel[sk2];
              var k0 = eintraege[0].k;
              var kk0 = kandidatBauen(k0);
              var basisOpts = Object.assign({}, common, kk0.opts,
                { period: k0.period, confirmBps: k0.confirmBps, zThr: zOf(k0.confirmBps), lineType: k0.lineType });
              // Was sich je Variante unterscheidet: Not-Stop, Haltedauer, Schein-Profil
              var varianten = eintraege.map(function (e) {
                var kkv = kandidatBauen(e.k);
                return { sl: kkv.opts.sl, maxHoldMin: kkv.opts.maxHoldMin,
                  otmPct: kkv.opts.otmPct, expiryDays: kkv.opts.expiryDays, ratio: kkv.opts.ratio };
              });
              return btIntradayMulti(trainMap, basisOpts, varianten).then(function (rs) {
                (rs || []).forEach(function (r3, ri) { trainRes[eintraege[ri].idx] = r3; });
                fertigN += eintraege.length;
              });
            }));
            var mitTrades = trainRes.filter(function (r0) { return r0 && !r0.error && r0.summary && r0.summary.nTrades >= 10; }).length;
            fertigN = Math.min(fertigN, kombis.length);
            tiefFortschritt = { basis: basen[bi], iv: iv2, fertig: fertigN, gesamt: kombis.length,
              schritt: schrittNr, schritte: schritteGesamt, brauchbar: mitTrades, at: Date.now() };
            var msJeKombi = (Date.now() - tBlock) / Math.max(1, fertigN);
            msJeKombiSchnitt = kombisGesamtBisher
              ? (msJeKombiSchnitt * kombisGesamtBisher + msJeKombi * fertigN) / (kombisGesamtBisher + fertigN)
              : msJeKombi;
            pilotLogAdd('… ' + fertigN + '/' + kombis.length + ' gerechnet (' + mitTrades + ' mit genug Trades, ' +
              Math.round((Date.now() - tBlock) / 1000) + ' s' + restText(kombis.length - fertigN, kombis.length) + ')');
            renderPilot();
            await new Promise(function (r0) { setTimeout(r0, 0); });   // Renderer atmen lassen
            if (!unbegrenzt && Date.now() - tBlock > anteilMs && fertigN < kombis.length) {
              abgeschnitten = kombis.length - fertigN;
              kombis = kombis.slice(0, fertigN);      // nur Gerechnetes darf in die Auswertung
              pilotLogAdd('… Zeitanteil dieser Gruppe erreicht: ' + fertigN + ' gerechnet, ' +
                abgeschnitten + ' uebersprungen (kommen in einer der naechsten Naechte dran).');
              break;
            }
          }
          geprueft += kombis.length;
          // die 3 besten Trainings-Kombis je Basis/Zeitrahmen out-of-sample gegenpruefen
          var kandT = [];
          kombis.forEach(function (k, ki2) {
            var r2 = trainRes[ki2];
            if (!r2 || r2.error || r2.summary.nTrades < 10) return;
            kandT.push({ k: k, train: r2.summary });
          });
          kandT.sort(function (x, y) { return y.train.retPct - x.train.retPct; });
          // Wie gut waere der Beste dieser Gruppe rein zufaellig geworden?
          var zpG = Q.bestOfN(kandT.map(function (x) { return x.train.retPct; }));
          if (zpG) {
            pilotLogAdd('   Zufallsprobe ' + basisJetzt + '/' + iv2 + ': Bester ' + zpG.bester + ' %, Zufallslatte ' +
              zpG.zufallsMedian + ' % (95 %: ' + zpG.zufallsP95 + ') aus ' + zpG.n + ' Versuchen – ' +
              (zpG.ueberzufaellig ? 'ueberzufaellig' : 'im Rahmen des Zufalls'));
            zufallProGruppe.push({ basis: basisJetzt, iv: iv2, probe: zpG });
          }
          for (var ti2 = 0; ti2 < Math.min(6, kandT.length); ti2++) {
            var kk2 = kandidatBauen(kandT[ti2].k);
            var rv = await btIntraday(testMapAlle, Object.assign({}, labCommonOpts(D.intraday, iv2), kk2.opts,
              { period: kandT[ti2].k.period, confirmBps: kandT[ti2].k.confirmBps, zThr: zOf(kandT[ti2].k.confirmBps), lineType: kandT[ti2].k.lineType }));
            if (rv && !rv.error) {
              var fund = { k: kandT[ti2].k, name: kk2.name, trainRet: kandT[ti2].train.retPct, trainN: kandT[ti2].train.nTrades,
                testRet: rv.summary.retPct, testN: rv.summary.nTrades, pf: rv.summary.profitFactor };
              funde.push(fund);
              // Nur wer sich auf UNGESEHENEN Daten behauptet, darf sich fortpflanzen.
              // Nach der Trainings-Rendite zu zuechten hiesse, Ueberanpassung zu zuechten.
              if (fund.testRet > 0 && fund.testN >= 15) {
                nachwuchs.push({ k: zuchtKopie(fund.k), testRet: fund.testRet, testN: fund.testN,
                  trainRet: fund.trainRet, gen: zStand.gen + 1, at: Date.now() });
              }
            }
          }
          gruppenFertig++;
          kombisGesamtBisher += kombis.length;
          var boerseDraengt = !unbegrenzt && handelBrauchtRechenzeit() && minutenBisOeffnung() < 90;
          if (boerseDraengt || (!unbegrenzt && Date.now() - t0 > GESAMT_MS + 3 * 60000)) {
            pilotLogAdd('Zucht: ' + (boerseDraengt ? 'Boerse oeffnet gleich und der Handel laeuft – Zwischenstand gespeichert.'
                                                   : 'Zeitbudget erreicht – Zwischenstand gespeichert.'));
            bi = basen.length; break;
          }
        }
      }
      funde.sort(function (x, y) { return y.testRet - x.testRet; });
      /* ---- Generationswechsel ----
       * Auslese nach der UNGESEHENEN Rendite, nicht nach der Trainings-Rendite: wer nach
       * dem Training zuechtet, zuechtet Ueberanpassung. Alte Ueberlebende treten dabei
       * gegen den Nachwuchs an; nur die besten ZUCHT_UEBERLEBENDE bleiben, und je Basis
       * hoechstens vier, damit nicht eine einzige Linie die ganze Population besetzt. */
      var alleU = zStand.ueberlebende.concat(nachwuchs);
      var gesehenU = {}, gefiltert = [];
      alleU.sort(function (x, y) { return (y.testRet || 0) - (x.testRet || 0); });
      var proBasis = {};
      alleU.forEach(function (u) {
        if (!u || !u.k) return;
        var sl4 = zuchtKey(u.k);
        if (gesehenU[sl4]) return;
        var bkey = u.k.basis + '|' + u.k.interval;
        if ((proBasis[bkey] || 0) >= 4) return;
        gesehenU[sl4] = 1; proBasis[bkey] = (proBasis[bkey] || 0) + 1;
        gefiltert.push(u);
      });
      var vorher = zStand.ueberlebende.length;
      zStand.ueberlebende = gefiltert.slice(0, ZUCHT_UEBERLEBENDE);
      zStand.gen = zStand.gen + 1;
      // Gedaechtnis fortschreiben; aelteste Eintraege fallen heraus, wenn es zu gross wird
      var gesAlle = Object.keys(gesehenSet);
      zStand.gesehen = gesAlle.length > ZUCHT_GESEHEN_MAX ? gesAlle.slice(gesAlle.length - ZUCHT_GESEHEN_MAX) : gesAlle;
      var neuDrin = zStand.ueberlebende.filter(function (u) { return u.gen === zStand.gen; }).length;
      pilotLogAdd('Generation ' + zStand.gen + ' abgeschlossen: ' + nachwuchs.length + ' Nachkommen haben sich ungesehen behauptet, ' +
        neuDrin + ' davon in die Population aufgenommen (Population ' + vorher + ' -> ' + zStand.ueberlebende.length +
        ', Gedaechtnis ' + zStand.gesehen.length + ' Kombinationen).');
      var zpGesamt = Q.bestOfN(funde.map(function (f) { return f.testRet; }));
      if (zpGesamt) {
        pilotLogAdd('Zufallsprobe (ungesehene Daten): Bester ' + zpGesamt.bester + ' %, Zufallslatte ' + zpGesamt.zufallsMedian +
          ' % aus ' + zpGesamt.n + ' Endkandidaten – ' + (zpGesamt.ueberzufaellig
            ? 'schlaegt 95 % der Zufallslaeufe (p ' + zpGesamt.pWert + ').'
            : 'NICHT ueberzufaellig (p ' + zpGesamt.pWert + ') – der Vorsprung erklaert sich durch die Zahl der Versuche.'));
      }
      a.tiefensuche = { at: Date.now(), geprueft: geprueft, dauerMin: Math.round((Date.now() - t0) / 6000) / 10, top: funde.slice(0, 5),
        generation: zStand.gen, population: zStand.ueberlebende.length, gedaechtnis: zStand.gesehen.length,
        zufallsprobe: zpGesamt, zufallProGruppe: zufallProGruppe };
      var bester = funde[0];
      // Positiv UND genug Trades reicht nicht mehr: Wer aus tausenden Versuchen
      // ausgewaehlt wurde, muss besser sein als der beste Zufallsversuch. Sonst
      // zuechten wir Rauschen und nennen es Fortschritt.
      var zufallOk = !zpGesamt || zpGesamt.ueberzufaellig;
      if (bester && bester.testRet > 0 && bester.testN >= 15 && zufallOk) {
        var ek = kandidatBauen(bester.k);
        ek.quelle = 'tiefensuche';
        a.entdeckt = ek;
        pilotLogAdd('Tiefensuche-Fund: ' + ek.name + ' (Training ' + bester.trainRet + ' %, ungesehen +' + bester.testRet + ' % bei ' + bester.testN + ' Trades) – tritt in der nächsten Nacht-Messung an.');
      } else {
        a.entdeckt = null;
        pilotLogAdd('Zucht fertig: ' + geprueft + ' Kombinationen, kein Fund. ' +
          (bester && bester.testRet > 0 && !zufallOk
            ? 'Der Beste war zwar positiv (' + bester.testRet + ' %), lag aber innerhalb dessen, was ' + (zpGesamt ? zpGesamt.n : '') +
              ' Zufallsversuche von selbst hergeben. Kein Fund ist besser als ein erfundener.'
            : 'Keiner war out-of-sample positiv. Ehrliches Ergebnis.'));
      }
      a.lastTief = Date.now();
      await save();
      renderPilot();
    } catch (e) {
      pilotLogAdd('Tiefensuche-Fehler: ' + (e && e.message ? e.message : e));
      a.lastTief = Date.now();
    } finally {
      tiefRunning = false; tiefStartAt = 0;
    }
  }

  /* ================= KI-Vorschlags-Slot =================
   * Das lokale Modell sieht nach jeder Messung Ranking und Filter-Bilanz und darf EINEN
   * Kandidaten fuer die NAECHSTE Messung nominieren. Es entscheidet nichts: Der Vorschlag
   * wird gegen eine strikte Whitelist geprueft, laeuft als markierter Kandidat mit und
   * muss dieselben Huerden nehmen wie alle anderen (belastbar + robust + zwei Naechte). */
  var KI_ERLAUBT = {
    basis: ['breakout_lauf', 'orb', 'reversion', 'wave', 'pullback', 'rsi2', 'donchian', 'squeeze'],
    interval: ['1m', '5m', '15m', '60m'],
    period: [9, 20, 50], confirmBps: [5, 15, 30], lineType: ['ema', 'vwap'],
    profile: ['atm21', 'otm3_14', 'otm5_10', 'atm21_b', 'atm60_b', 'otm3_30b'],
    scalpSL: [10, 15, 20, 30, 45, 'auto'], scalpHold: [15, 30, 60, 120, 240, 390], channel: [true, false]
  };
  function kandidatBauen(k) {
    var slV = k.scalpSL === 'auto' ? 'auto' : -(k.scalpSL) / 100;
    var prof = Q.PROFILES[k.profile] || Q.PROFILES.atm21;
    var basisO;
    if (k.basis === 'orb') basisO = { entryMode: 'orb', exitMode: 'confirmed', orbMin: 30, sl: slV, tp: null, trailPct: 0.15, maxHoldMin: 0, cooldownMin: 10, maxPerDay: 10 };
    else if (k.basis === 'reversion') basisO = { entryMode: 'reversion', sl: slV, tp: null, trailPct: 0, maxHoldMin: k.scalpHold, cooldownMin: 10, maxPerDay: 20 };
    else if (k.basis === 'wave') basisO = { entryMode: 'wave', channel: (k.channel !== undefined ? !!k.channel : D.intraday.channel !== false), sl: slV, tp: null, trailPct: 0, maxHoldMin: k.scalpHold, cooldownMin: 10, maxPerDay: 20, trendFilter: true, minQuality: 60 };
    else if (k.basis === 'pullback') basisO = { entryMode: 'pullback', exitMode: 'confirmed', sl: slV, tp: null, trailPct: 0.15, maxHoldMin: k.scalpHold, cooldownMin: 10, maxPerDay: 10 };
    else if (k.basis === 'rsi2') basisO = { entryMode: 'rsi2', exitMode: 'target', sl: slV, tp: null, trailPct: 0, maxHoldMin: k.scalpHold, cooldownMin: 10, maxPerDay: 20 };
    else if (k.basis === 'donchian') basisO = { entryMode: 'donchian', exitMode: 'confirmed', sl: slV, tp: null, trailPct: 0.15, maxHoldMin: k.scalpHold, cooldownMin: 30, maxPerDay: 10 };
    else if (k.basis === 'squeeze') basisO = { entryMode: 'squeeze', exitMode: 'confirmed', sl: slV, tp: null, trailPct: 0.15, maxHoldMin: k.scalpHold, cooldownMin: 30, maxPerDay: 10 };
    else basisO = { entryMode: 'cross', exitMode: 'confirmed', sl: slV === 'auto' ? -0.25 : slV, tp: 0.35, trailPct: 0, maxHoldMin: k.scalpHold, cooldownMin: 45, maxPerDay: 10, trendFilter: true };
    basisO.otmPct = prof.otmPct;
    basisO.expiryDays = prof.days;
    basisO.ratio = prof.ratio || Q.RATIO;
    var st2 = setupFromMode(k.basis === 'breakout_lauf' ? 'breakout' : k.basis);
    return {
      basis: k.basis, interval: k.interval, period: k.period, confirmBps: k.confirmBps,
      lineType: k.lineType, profile: k.profile, scalpSL: k.scalpSL, scalpHold: k.scalpHold,
      setup: st2.setup, trigger: st2.trigger,
      name: k.basis + ' · ' + k.interval + ' · ' + String(k.lineType).toUpperCase() + k.period +
        ' · ' + (prof.name || k.profile) + ' · SL ' + (k.scalpSL === 'auto' ? 'auto' : k.scalpSL + ' %') + ' · Halt ' + k.scalpHold + ' Min',
      begruendung: String(k.begruendung || '').slice(0, 200),
      at: Date.now(), opts: basisO
    };
  }
  function recKey(r) { return [r.modeKey, r.interval, r.period, r.confirmBps, r.lineType, r.window, r.profile || '', r.scalpHold || '', r.scalpSL || ''].join('|'); }
  var pilotRunning = false, pilotPhase = '';
  var pilotStartAt = 0;
  var pilotLog = [];        // [zeit, text] - Live-Protokoll der laufenden/letzten Messung
  /** Jede Phase der Messung landet sichtbar im Protokoll - keine Blackbox mehr. */
  function pilotLogAdd(t) {
    var letzte = pilotLog[pilotLog.length - 1];
    if (letzte && letzte[1] === String(t)) return;   // identische Wiederholungen nicht stapeln
    pilotLog.push([Date.now(), String(t)]);
    if (pilotLog.length > 150) pilotLog = pilotLog.slice(-150);
    renderPilotLog();
  }
  function renderPilotLog() {
    var el = document.getElementById('pilotLog');
    if (!el) return;
    if (!pilotLog.length) { el.style.display = 'none'; return; }
    el.style.display = '';
    el.innerHTML = pilotLog.map(function (z) {
      return '<div><span class="plz">' + new Date(z[0]).toLocaleTimeString('de-DE') + '</span> ' + U.esc(z[1]) + '</div>';
    }).join('');
    el.scrollTop = el.scrollHeight;
  }
  /** Edge-Waechter: Lebt der belegte Vorsprung im frischen Fenster noch?
   *  Rechnet rsi2seit-Signale der letzten 120 Tage auf dem 60m-Archiv nach -
   *  Ueberschuss gegen die Drift des Symbols, t UEBER SYMBOLE, exakt die
   *  Studien-Methodik. Das ist die eigentliche Aufgabe der Nacht: nicht neue
   *  Sieger kueren, sondern den belegten Edge BEWACHEN. */
  /* Die beiden Arme des Intraday-Handels, mit je EIGENEM Zustand. Bis zum 25.08.2026
   * gab es diese Tabelle nicht: der Waechter rief edgeZustand() ohne Argument, mass
   * damit nur rsi2seit und schrieb nur edgePause. D.intraday.edgePauseKapi wurde
   * gelesen, aber NIE geschrieben - die Schutzpause des Kapitulations-Arms existierte
   * nur auf dem Papier.
   * Eigene Pause je Arm und nicht eine gemeinsame, weil die Arme verschiedene
   * Haltedauern und verschiedene Regime haben: eine gemeinsame Pause legt einen
   * gesunden Arm still, weil der andere verfaellt. */
  var EDGE_ARME = [
    { key: 'rsi2seit',     name: 'rsi2seit',          pauseKey: 'edgePause',
      histKey: 'edgeHistorie',     edgeKey: 'edge' },
    { key: 'kapitulation', name: 'Kapitulations-Dip', pauseKey: 'edgePauseKapi',
      histKey: 'edgeHistorieKapi', edgeKey: 'edgeKapi' }
  ];

  async function edgeZustand(entry) {
    /* D1: Der Waechter misst den Arm, den er auch sperrt. Vorher stand hier fest
     * 'rsi2seit', pausiert wurden aber beide Kanten. */
    entry = entry || 'rsi2seit';
    var istKapiArm = entry === 'kapitulation';
    var cfg = D.intraday || {};   // cfg ist hier nicht modulweit sichtbar

    var P = { ENTRY: entry, LINE: cfg.lineType || 'ema', period: cfg.period || 20,
      confirmBps: cfg.confirmBps, ZTHR: zOf(cfg.confirmBps), MINQ: 0, CHAN: false, MTF: false, TREND: false };
    /* Haltedauer wie live: der Kapitulations-Dip laeuft 26 Kerzen, rsi2seit 8. */
    var H = istKapiArm ? 26 : 8, abT = Date.now() - 120 * 86400000;
    var syms = messUniversum();
    var symMittel = [], nGes = 0;
    for (var si = 0; si < syms.length; si++) {
      var bars = await window.Archiv.serie('60m', syms[si]);
      if (!bars || bars.length < 300) continue;
      var c = bars.map(function (b) { return b[1]; });
      /* A9: Die Kontrolle muss aus DEMSELBEN Zeitraum kommen wie die Signale.
       * Vorher lief die Drift ueber die ganze Reihe, die Signale nur ueber 120
       * Tage - ein Fenster gegen einen anderen Zeitraum gemessen. */
      var ds = 0, dn = 0;
      for (var i = 0; i < c.length - H; i += H) {
        if (bars[i][0] < abT) continue;
        ds += c[i + H] / c[i] - 1; dn++;
      }
      var drift = dn ? ds / dn : 0;
      var us = [], cool = 0;
      for (var i2 = 300; i2 < bars.length - H; i2++) {
        if (bars[i2][0] < abT) continue;
        if (bars[i2][0] - cool < 120 * 60000) continue;
        var s = null;
        try { s = Q.einstiegSignal(bars, i2, P); } catch (e) { }
        if (!s || s.dir !== 'call') continue;
        cool = bars[i2][0];
        us.push((c[i2 + H] / c[i2] - 1) - drift);
        nGes++;
      }
      if (us.length >= 2) symMittel.push(us.reduce(function (a2, b2) { return a2 + b2; }, 0) / us.length);
    }
    var n = symMittel.length;
    if (n < 5) return { n: nGes, nSym: n, txt: 'Edge-Wächter: erst ' + nGes + ' rsi2seit-Signale im 60m-Archiv – die Messbasis wächst mit jedem Handelstag.' };
    var m = symMittel.reduce(function (a3, b3) { return a3 + b3; }, 0) / n;
    var sd = Math.sqrt(symMittel.reduce(function (a4, b4) { return a4 + (b4 - m) * (b4 - m); }, 0) / (n - 1));
    var t = sd > 0 ? m / (sd / Math.sqrt(n)) : 0;
    /* Die Aufloesung dieser Messung - sie gehoert in den Satz, denn sie ist meist
     * groesser als die Kante, um die es geht. */
    var mde = sd > 0 ? 2 * sd / Math.sqrt(n) : null;
    var urteil = (m > 0 && t >= 1.5) ? 'im Rahmen der Studie'
      : (m > 0 ? 'positiv, aber statistisch dünn – weiter beobachten'
        : (Math.abs(t) >= 2
          ? 'VERFALL – der Vorsprung ist messbar negativ, Handel pausieren und neu messen'
          : 'kein Vorsprung messbar – diese Messung kann Verfall nicht von Rauschen trennen (|t| ' +
            Math.abs(t).toFixed(2) + ' < 2' + (mde ? ', Auflösung ' + (mde * 100).toFixed(2) + ' Pp' : '') +
            '). Vorsichtshalber wird trotzdem pausiert: eine Pause kostet weniger als ein Irrtum'));
    return { entry: entry, n: nGes, nSym: n, rohMittel: m,
      mittelPp: Math.round(m * 10000) / 100, mdePp: mde != null ? Math.round(mde * 10000) / 100 : null,
      t: Math.round(t * 100) / 100,
      txt: 'Edge-Wächter (' + entry + ', letzte 120 Tage, Archiv): ' + nGes + ' Signale über ' + n + ' Werte · Überschuss ' +
        (m >= 0 ? '+' : '') + (m * 100).toFixed(3) + ' Pp/8 h · t über Symbole ' + t.toFixed(2) + ' → ' + urteil };
  }

  async function pilotMessen(manual) {
    var a = autoOptCfg();
    if (tiefRunning) { if (manual) pilotLogAdd('Hinweis: Tiefensuche läuft gerade – die Messung startet danach automatisch beim nächsten Takt.'); return; }
    if (pilotRunning || centralRunning || jobRunning) {
      // Zweiter Klick ist KEIN Neustart - sichtbar sagen, dass schon gemessen wird
      if (manual && pilotRunning) pilotLogAdd('Hinweis: Messung läuft bereits (seit ' + Math.round((Date.now() - pilotStartAt) / 60000) + ' Min) - Verlauf siehe unten.');
      return;
    }
    if (!manual && a.on === false) return;
    pilotRunning = true;
    pilotStartAt = Date.now();
    pilotLog = [];
    pilotLogAdd(manual ? 'Messung von Hand gestartet.' : 'Nächtliche Messung gestartet.');
    pilotPhase = 'startet …';
    renderPilot();
    var t0 = Date.now();
    try {
      // Erst das Archiv rückwärts auffüllen (falls Capital.com verbunden ist) –
      // jede Nacht ein Stück weiter zurück, bis 90 Tage stehen.
      if (window.CapAPI && window.CapAPI.enabled()) {
        pilotPhase = 'Capital-Backfill: füllt das Kursarchiv rückwärts auf …';
        pilotLogAdd(pilotPhase);
        renderPilot();
        try {
          var bf = await capBackfill(250);
          if (bf.requests) { a.lastBackfill = { at: Date.now(), requests: bf.requests, bars: bf.bars, symbole: bf.symbole }; pilotLogAdd('Backfill: ' + bf.bars + ' Kerzen für ' + bf.symbole + ' Werte (' + bf.requests + ' Anfragen).'); }
        } catch (eBf) { /* Backfill ist Bonus – die Messung läuft auch ohne */ }
      }
      /* 1m-Messbasis sammeln (Trendwende-Studie 21.08.2026): Felix' Winkel-Detektor
       * war die einzige von sechs Wende-Familien, die die adversariale Pruefung
       * teilweise ueberstand (1m, Short, verzugsrobust, p=0/300) - aber Yahoo gibt
       * nur 7 Tage 1m-Historie her, zu wenig fuer ein Urteil. Das Archiv haelt 1m
       * 90 Tage: Jede Nacht die frischen 7 Tage einsammeln, und in 4-6 Wochen ist
       * die Frage auf 60+ Tagen entscheidbar. ~99 Abrufe, einmal je Nacht. */
      try {
        pilotPhase = '1m-Messbasis einsammeln (für die Trendwende-Studie) …';
        pilotLogAdd(pilotPhase); renderPilot();
        var symsM1 = messUniversum();
        var m1Ok = 0;
        for (var sM = 0; sM < symsM1.length; sM++) {
          var fdM1 = await fetchIntraday(symsM1[sM], '1m', true);
          if (fdM1 && fdM1.series && fdM1.series.length > 100 && window.Archiv) {
            await window.Archiv.fuege('1m', symsM1[sM], fdM1.series);
            m1Ok++;
          }
          await new Promise(function (w1) { setTimeout(w1, 150); });
        }
        if (window.Archiv) await window.Archiv.speichere(true);
        pilotLogAdd('1m-Messbasis: ' + m1Ok + ' Werte eingesammelt.');
      } catch (eM1) { pilotLogAdd('1m-Sammlung übersprungen (' + (eM1.message || eM1) + ').'); }
      var rec = await runCentral({ silent: true, status: function (t) { pilotPhase = t; pilotLogAdd(t); renderPilot(); } });
      a.lastMess = Date.now();
      if (!rec) {
        a.lastCheck = { at: Date.now(), ok: false, txt: 'Zu wenig Kursdaten für eine Messung – das Archiv füllt sich mit jedem Handelstag.' };
      } else {
        /* ZWEI HUERDEN, die es vorher nicht gab.
         *
         * 1. MEHRFACHVERGLEICH. Gekuert wird der Beste aus 14 Modi x 4 Zeitrahmen.
         *    Bei 56 Versuchen hat der Sieger auch dann eine schoene Rendite, wenn kein
         *    einziger Kandidat etwas kann - das Maximum aus 56 Ziehungen liegt immer
         *    ueber dem Mittel. rec.ueberzufaellig sagt (ueber bestOfN), ob der Sieger
         *    das schlaegt, was reiner Zufall bei 56 Versuchen hergibt. Faellt er
         *    durch, wird NICHTS umgestellt. null heisst: zu wenige belastbare
         *    Kandidaten fuer die Aussage - dann bleibt es wie bisher beim Urteil
         *    allein, aber die Meldung sagt das auch.
         *
         * 2. ECHTER ZUWACHS. "Bestaetigung durch die naechste Nacht" war keine: die
         *    Messung laeuft ueber dieselbe Historie, eine Nacht bringt bei 60-Minuten-
         *    Kerzen rund 0,4 % neue Kerzen. Zweimal dasselbe Ergebnis auf denselben
         *    Daten ist ein Ergebnis, nicht zwei. Anders als beim Edge-Waechter ist das
         *    hier keine schuetzende Handlung, sondern eine AENDERUNG der Konfiguration -
         *    und die braucht echte neue Evidenz. Verlangt wird deshalb mindestens ein
         *    zusaetzlicher ungesehener Handelstag zwischen den beiden Messungen. */
        var robust = String(rec.verdict).indexOf('robust') === 0 && rec.belastbar !== false && rec.n >= MIN_OOS_TRADES;
        var zufaellig = rec.ueberzufaellig === false;
        var zTxt = rec.zufall
          ? ' Zufallsprobe über ' + rec.zufall.n + ' Kandidaten: der Beste liegt bei ' + rec.zufall.bester +
            ' %, reiner Zufall bringt im Mittel ' + rec.zufall.zufallsMedian + ' % und in 5 % der Fälle über ' +
            rec.zufall.zufallsP95 + ' % (p=' + rec.zufall.pWert + ').'
          : ' Für eine Zufallsprobe gab es zu wenige belastbare Kandidaten.';
        var k = recKey(rec);
        if (!robust) {
          a.pending = null; a.lastRecKey = null; a.lastRecTage = null;
          a.lastCheck = { at: Date.now(), ok: true,
            txt: 'Bester Kandidat: ' + rec.modeName + ' · ' + rec.interval + ' (' + rec.verdict + ', ' + rec.n + ' Trades auf ' +
              (rec.oosTage != null ? rec.oosTage : '?') + ' ungesehenen Handelstagen). Nichts geändert – übernommen wird nur, ' +
              'was robust ist, den Zufall schlägt UND sich auf neuen Daten wiederholt.' + zTxt };
        } else if (zufaellig) {
          /* Robust, aber nicht ueberzufaellig: Das ist der Fall, den es vorher gar
           * nicht gab - und der haeufigste bei 56 Kandidaten. */
          a.pending = null; a.lastRecKey = null; a.lastRecTage = null;
          a.lastCheck = { at: Date.now(), ok: true,
            txt: '' + rec.modeName + ' · ' + rec.interval + ' sieht robust aus (Walk-Forward ' + (rec.wfRet > 0 ? '+' : '') + rec.wfRet +
              ' %), schlägt aber den Zufall nicht: Bei ' + rec.zufall.n + ' geprüften Kandidaten fällt der Beste auch ohne jede ' +
              'echte Kante so gut aus. Nichts geändert.' + zTxt };
        } else if (a.lastRecKey === k) {
          /* Dasselbe Ergebnis wie beim letzten Mal - aber ist inzwischen ueberhaupt
           * etwas Neues dazugekommen? oosTage ist die Zahl ungesehener Handelstage,
           * auf denen gemessen wurde; waechst sie nicht, war es dieselbe Messung. */
          var neueTage = (typeof a.lastRecTage === 'number' && typeof rec.oosTage === 'number')
            ? rec.oosTage - a.lastRecTage : null;
          if (neueTage != null && neueTage < 1) {
            a.lastCheck = { at: Date.now(), ok: true,
              txt: '' + rec.modeName + ' · ' + rec.interval + ' zum zweiten Mal robust – aber auf DENSELBEN Daten ' +
                '(' + rec.oosTage + ' ungesehene Handelstage, kein Zuwachs seit der letzten Messung). Das ist eine ' +
                'Messung, nicht zwei. Wird übernommen, sobald mindestens ein neuer Handelstag dazukommt.' + zTxt };
          } else {
            a.pending = { rec: rec, seit: Date.now(), neueTage: neueTage };
            a.lastRecTage = rec.oosTage;
            a.lastCheck = { at: Date.now(), ok: true,
              txt: '' + rec.modeName + ' · ' + rec.interval + ' zum zweiten Mal robust, diesmal mit ' +
                (neueTage != null ? neueTage + ' neuen ungesehenen Handelstag(en)' : 'neuer Messbasis') +
                ' (Walk-Forward ' + (rec.wfRet > 0 ? '+' : '') + rec.wfRet + ' %, ' + rec.n + ' Trades) – wird vor dem ' +
                'nächsten Handelsbeginn übernommen.' + zTxt };
          }
        } else {
          a.lastRecKey = k; a.pending = null; a.lastRecTage = rec.oosTage;
          a.lastCheck = { at: Date.now(), ok: true,
            txt: '' + rec.modeName + ' · ' + rec.interval + ' ist robust (Walk-Forward ' + (rec.wfRet > 0 ? '+' : '') + rec.wfRet + ' %, ' +
              rec.n + ' Trades) – wartet auf eine Wiederholung mit NEUEN Handelstagen. Ein einzelner Sieg kann Zufall sein, ' +
              'und dieselbe Messung zweimal anzusehen macht sie nicht belastbarer.' + zTxt };
        }
      }
      // Edge-Waechter im Anschluss - die eigentliche Frage der Nacht: Traegt der
      // belegte Vorsprung im frischen Fenster noch? (reine Archiv-Rechnung)
      try {
        for (var _ai = 0; _ai < EDGE_ARME.length; _ai++) {
        var ARM = EDGE_ARME[_ai];
        var edge = await edgeZustand(ARM.key);
        if (edge) {
          a[ARM.edgeKey] = Object.assign({ at: Date.now(), arm: ARM.key }, edge);
          a.lastCheck.txt += '\n\n[' + ARM.name + '] ' + edge.txt;
          /* Eskalation (Gegenpruefung 21.08.2026): Der Waechter KUENDIGTE eine
           * Konsequenz an ("naechste Nacht bestaetigt -> pausieren"), die es nie
           * gab - er war reine Anzeige. Jetzt: zwei Naechte VERFALL hintereinander
           * pausieren NEUE Einstiege der belegten Kanten. Die Schatten laufen
           * weiter (Messung geht nie aus), ein Hand-Entscheid "trotzdem handeln"
           * wird dauerhaft respektiert, und eine positive Nacht hebt die Pause
           * von selbst wieder auf. */
          /* TOTBAND behoben: Vorher entschied der auf zwei Stellen GERUNDETE Wert.
           * Ein wahrer Mittelwert von +0,004 Pp rundete auf 0,00, galt als Verfall
           * und konnte die Pause nie wieder aufheben - der Waechter hing fest. */
          var roh = edge.rohMittel != null ? edge.rohMittel : (edge.mittelPp != null ? edge.mittelPp / 100 : null);
          var verfall = roh != null && !(roh > 0) && (edge.nSym || 0) >= 5;
          if (!a[ARM.histKey]) a[ARM.histKey] = [];
          /* ZWEI NAECHTE SIND NICHT ZWEI MESSUNGEN. Der Waechter rechnet ueber ein
           * rollendes 120-Tage-Fenster auf 60-Minuten-Kerzen. Eine Nacht bringt darin
           * rund 0,4 % neue Kerzen - "in zwei Naechten hintereinander verfallen" klang
           * nach zwei unabhaengigen Belegen und war in Wahrheit fast derselbe Datensatz,
           * zweimal angesehen. Deshalb wird jetzt der tatsaechliche ZUWACHS an Signalen
           * mitgeschrieben und in jeder Meldung genannt. */
          var vorig = a[ARM.histKey][0] || null;
          var zuwachs = (vorig && typeof vorig.n === 'number') ? (edge.n || 0) - vorig.n : null;
          var zuwachsPct = (vorig && vorig.n > 0 && zuwachs != null)
            ? Math.round(zuwachs / vorig.n * 1000) / 10 : null;
          a[ARM.histKey].unshift({ at: Date.now(), mittelPp: edge.mittelPp != null ? edge.mittelPp : null,
            t: edge.t != null ? edge.t : null, verfall: verfall,
            n: edge.n || 0, zuwachs: zuwachs, zuwachsPct: zuwachsPct });
          if (a[ARM.histKey].length > 30) a[ARM.histKey] = a[ARM.histKey].slice(0, 30);
          /* Die Schwelle bleibt bewusst bei zwei Verfalls-Messungen und wird NICHT an
           * einen Mindestzuwachs gebunden. Das ist eine SCHUETZENDE Handlung: sie setzt
           * neue Einstiege aus und laesst die Messung weiterlaufen. Bei einer solchen
           * darf duenne Evidenz ausloesen - der Preis eines Fehlalarms ist eine Pause,
           * der Preis des Zoegerns sind Verluste. Was sich aendert, ist der ANSPRUCH:
           * die Meldung behauptet keine zwei unabhaengigen Belege mehr, sondern nennt,
           * wie viel neue Messbasis wirklich dazwischen lag.
           * Umgekehrt ist es bei Aenderungen an der Konfiguration - siehe unten. */
          var zuwachsTxt = zuwachs == null ? 'die Vorgaengermessung ist ohne Zaehlstand'
            : (zuwachs + ' neue Signale' + (zuwachsPct != null ? ' (+' + zuwachsPct + ' %)' : '') + ' seit der letzten Messung');
          if (verfall && a[ARM.histKey].length >= 2 && a[ARM.histKey][1].verfall &&
              !D.intraday.edgePauseHand && !D.intraday[ARM.pauseKey]) {
            D.intraday[ARM.pauseKey] = { seit: Date.now(), arm: ARM.key,
              mittelPp: edge.mittelPp, t: edge.t,
              zuwachs: zuwachs, zuwachsPct: zuwachsPct };
            if (!D.tuneLog) D.tuneLog = [];
            D.tuneLog.unshift({ id: 'sicherung-' + Date.now(), at: Date.now(), quelle: 'sicherung',
              applied: ['Edge-Wächter (' + ARM.name + '): neue Einstiege pausiert'],
              txt: 'Der gemessene Vorsprung von ' + ARM.name + ' war in zwei aufeinanderfolgenden Messungen ' +
                'verfallen (zuletzt ' + edge.mittelPp + ' Pp, t=' + edge.t + '; ' + zuwachsTxt + '). ' +
                'Die zweite Messung ist KEIN unabhängiger zweiter Beleg – sie läuft über dasselbe rollende ' +
                '120-Tage-Fenster. Ausgesetzt wird trotzdem: eine Pause kostet weniger als ein Irrtum in die ' +
                'andere Richtung. Das Schattenbuch misst weiter. Eine positive Messung hebt die Pause ' +
                'automatisch auf – oder du entscheidest von Hand „trotzdem handeln“ (wird dauerhaft respektiert).' });
            melde('Edge-Wächter: ' + ARM.name + ' pausiert', 'Der gemessene Vorsprung von ' + ARM.name + ' ist zweimal in Folge verfallen (' + edge.mittelPp + ' Pp, ' + zuwachsTxt + '). Neue Einstiege DIESES Arms sind ausgesetzt, der andere handelt weiter, die Messung läuft weiter.');
            pilotLogAdd('Edge-Wächter [' + ARM.name + ']: VERFALL zweimal in Folge (' + zuwachsTxt + ') – neue Einstiege dieses Arms pausiert.');
          }
          if (!verfall && roh != null && roh > 0 && D.intraday[ARM.pauseKey]) {
            delete D.intraday[ARM.pauseKey];
            if (!D.tuneLog) D.tuneLog = [];
            D.tuneLog.unshift({ id: 'sicherung-' + Date.now(), at: Date.now(), quelle: 'sicherung',
              applied: ['Edge-Wächter (' + ARM.name + '): Pause aufgehoben'],
              txt: 'Die Nacht-Messung zeigt den Vorsprung von ' + ARM.name + ' wieder positiv (' + edge.mittelPp + ' Pp, t=' + edge.t + ') – die Einstiegs-Pause dieses Arms ist aufgehoben.' });
            melde('Edge-Wächter: ' + ARM.name + ' handelt wieder', 'Der Vorsprung von ' + ARM.name + ' ist wieder positiv (' + edge.mittelPp + ' Pp) – neue Einstiege dieses Arms sind freigegeben.');
            pilotLogAdd('Edge-Wächter [' + ARM.name + ']: Vorsprung wieder positiv – Pause aufgehoben.');
          }
        }
        }   // Ende der Schleife ueber die Arme
      } catch (eEdge) {
        /* Der Waechter ist Zusatz - die Messung gilt auch ohne ihn. Sein Ausfall darf
         * aber nicht unsichtbar sein: mit ihm faellt eine SCHUETZENDE Handlung aus
         * (neue Einstiege pausieren, wenn der Vorsprung zweimal verfallen ist) und
         * ebenso das automatische Aufheben einer bestehenden Pause. Beides schweigend
         * zu verlieren ist genau der Fall, den dieser Kommentar bisher gedeckt hat. */
        HEALTH.edgeFail = (HEALTH.edgeFail || 0) + 1;
        pilotLogAdd('Edge-Waechter ausgefallen: ' + String((eEdge && eEdge.message) || eEdge).slice(0, 140));
        if (HEALTH.edgeFail === 2) {
          melde('Edge-Wächter ausgefallen',
            'Zwei Läufe in Folge konnte der Wächter den gemessenen Vorsprung nicht prüfen. ' +
            'Damit pausiert er auch nicht mehr von selbst - die Schutzhandlung ist ausgesetzt.');
        }
      }
      a.lastCheck.dauerMin = Math.round((Date.now() - t0) / 60000 * 10) / 10;
      pilotLogAdd('Fertig nach ' + a.lastCheck.dauerMin + ' Min: ' + a.lastCheck.txt);
      // Verlauf + Messbericht: sichtbar machen, was funktioniert und woran der Rest scheitert
      if (rec) {
        if (!a.messHistorie) a.messHistorie = [];
        a.messHistorie.unshift({ at: Date.now(), name: rec.modeName, interval: rec.interval, wfRet: rec.wfRet,
          n: rec.n, oosTage: rec.oosTage || 0, belastbar: rec.belastbar !== false && rec.n >= MIN_OOS_TRADES });
        if (a.messHistorie.length > 30) a.messHistorie = a.messHistorie.slice(0, 30);
      }
      if (D.central) {
        D.central.berichtMd = baueMessbericht(D.central, a, { handSperre: D.intraday.handSperre, intraday: D.intraday, version: APP_VER, schatten: D.schattenStat });
      }
      // Filter, die in ZWEI aufeinanderfolgenden Messungen nachweislich Geld gekostet
      // haben, werden gelockert - dieselbe Zwei-Nächte-Disziplin wie bei den Setups.
      // Der Kosten-Check und die Qualitätsschwelle sind davon bewusst ausgenommen
      // (Sicherungs-Filter), die Hand-Sperre gilt.
      try {
        var fbZeilen = (rec && rec.filterBilanz && rec.filterBilanz.zeilen) || null;
        if (fbZeilen) {
          var FILTER_FELD = { 'Trendfilter (EMA100)': 'trendFilter', 'Trendkanal': 'channel', '5-Min-Bestätigung (MTF)': 'mtf' };
          var vorherFb = a.filterBilanzVorher || {};
          var gelockert = [];
          fbZeilen.forEach(function (z9) {
            var feld9 = FILTER_FELD[z9.name];
            if (!feld9 || z9.duenn || z9.nutzen > -1) return;
            if (vorherFb[feld9] != null && vorherFb[feld9] <= -1 && automatikDarf(feld9) && D.intraday[feld9] !== false) {
              D.intraday[feld9] = false;
              gelockert.push(z9.name + ' (kostete ' + vorherFb[feld9] + ' und ' + z9.nutzen + ' Pp in zwei Messungen)');
            }
          });
          if (gelockert.length) {
            if (!D.tuneLog) D.tuneLog = [];
            D.tuneLog.unshift({ id: 'pilot-filter-' + Date.now(), at: Date.now(), quelle: 'pilot',
              applied: gelockert.map(function (gtxt) { return 'Filter gelockert: ' + gtxt; }),
              txt: 'Filter-Bilanz zweier aufeinanderfolgender Messungen: dieser Filter hat auf ungesehenen Daten Geld gekostet.',
              konfigVorher: null, konfigNachher: JSON.parse(JSON.stringify(D.intraday)) });
            gelockert.forEach(function (gtxt) { pilotLogAdd('Filter gelockert: ' + gtxt); });
            syncStrategyUI();
          }
          a.filterBilanzVorher = {};
          fbZeilen.forEach(function (z9) { var f9 = FILTER_FELD[z9.name]; if (f9 && !z9.duenn) a.filterBilanzVorher[f9] = z9.nutzen; });
        }
      } catch (eFb2) { /* Diagnose darf die Messung nie kippen */ }
      /* Hier nominierte das lokale Modell einen Kandidaten fuer die naechste Nacht.
       * Mit dem uebrigen KI-Pfad entfernt (23.08.2026): Der Vorschlag ging als eigener
       * Modus in die Auswahl und konnte damit den Waechter-Modus unterlaufen. */
      pilotAnwenden();          // Börse gerade zu? Dann direkt einspielen statt bis morgens zu warten
      await save();
      exportAnalysis(true);     // messbericht.md + analyse-daten.json sofort in den Daten-Ordner
      renderTuneLog();
      renderCentral();
      render();
    } catch (e) {
      a.lastMess = Date.now();
      a.lastCheck = { at: Date.now(), ok: false, txt: 'Fehler: ' + (e && e.message ? e.message : e) };
      pilotLogAdd('FEHLER: ' + (e && e.message ? e.message : e));
      try { await save(); } catch (e2) { /* egal */ }
    } finally {
      pilotRunning = false;
      pilotPhase = '';
      renderPilot();
    }
  }
  /** Vorgemerkte, doppelt bestätigte Empfehlung anwenden – nur bei geschlossener Börse. */
  function pilotAnwenden() {
    var a = autoOptCfg();
    if (!a.pending || !a.pending.rec) return;
    if (window.Dash && window.Dash.marketOpen()) return;   // nie mitten im Handel die Strategie wechseln
    var applied = applyCentralRec(a.pending.rec, 'pilot');
    a.lastApply = { at: Date.now(), applied: applied, name: a.pending.rec.modeName + ' · ' + a.pending.rec.interval };
    a.pending = null;
    a.lastRecKey = null;
    save();
    renderKlartext();
    render();
  }
  async function renderPilot() {
    var el = document.getElementById('pilotStatus');
    if (!el || !D) return;
    var a = autoOptCfg();
    if (pilotRunning) {
      var seitMin = pilotStartAt ? Math.round((Date.now() - pilotStartAt) / 6000) / 10 : 0;
      var letzteAkt = pilotLog.length ? Math.round((Date.now() - pilotLog[pilotLog.length - 1][0]) / 1000) : 0;
      el.innerHTML = '<b>Messung läuft</b> · seit ' + seitMin + ' Min · letzte Aktivität vor ' + letzteAkt + ' s' +
        '<div style="color:var(--acc); margin-top:2px;">' + U.esc(pilotPhase || '') + '</div>' +
        '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:2px;">Der komplette Verlauf steht im Protokoll darunter. Der Wächter greift erst bei 12 Minuten ohne Aktivität.</div>';
      return;
    }
    // Datenlage: Wie viele Handelstage hat das Archiv schon gesammelt?
    // Einmalige Quellen-Umstellung im Hintergrund - blockiert den Start nicht.
    quellenMigration();
    huerdeAnzeigen();          // Kostenhuerde beim Start zeigen, nicht erst nach einer Aenderung
    regelKopfAnzeigen();   // dieselbe Quelle, derselbe Takt wie die Huerde
    regelnAnzeigen();
    var deck = '';
    if (window.Archiv) {
      try {
        var syms = universe();
        var d1 = await window.Archiv.abdeckung('1m', syms);
        var d5 = await window.Archiv.abdeckung('5m', syms);
        var ziel = MIN_OOS_TAGE * 5;   // 4 OOS-Scheiben + Training brauchen ~5× die Mindest-Tage
        function balken(t) {
          var pct = Math.min(100, Math.round(t / ziel * 100));
          return '<span class="pbar" style="display:inline-block; width:90px; vertical-align:middle;"><span style="width:' + pct + '%;"></span></span> ' + t + '/' + ziel + ' Tage';
        }
        EXPORT_ABDECKUNG = { at: Date.now(), min1: d1, min5: d5, zielTage: ziel };
        deck = '<div style="margin-top:4px;">Kursarchiv (Ziel für volle Belastbarkeit: ' + ziel + ' Handelstage):' +
          '<div>1-Min: ' + balken(d1.tageMedian) + ' · 5-Min: ' + balken(d5.tageMedian) + ' <span style="color:var(--muted);">(' + Math.max(d1.symbole, d5.symbole) + ' Werte, rollierend 90 Kalendertage)</span></div></div>';
      } catch (e) { /* Anzeige ist optional */ }
    }
    var c = a.lastCheck;
    var txt = c
      ? '<b>' + U.dt(c.at) + '</b> · ' + (c.ok ? '' : '') + U.esc(c.txt) +
        (c.dauerMin ? ' <span style="color:var(--muted);">(' + c.dauerMin + ' Min Rechenzeit)</span>' : '')
      : 'Noch keine Messung – die erste läuft in der nächsten Nacht nach US-Börsenschluss.';
    var pend = a.pending ? '<div style="color:var(--up); margin-top:3px;">Vorgemerkt: ' + U.esc(a.pending.rec.modeName + ' · ' + a.pending.rec.interval) + ' – wird angewendet, sobald die Börse geschlossen ist.</div>' : '';
    var tfz = a.tiefensuche ? '<div style="color:var(--muted); margin-top:3px;">Tiefensuche: ' + a.tiefensuche.geprueft + ' Kombinationen (' + U.dt(a.tiefensuche.at) + ')' + (a.entdeckt ? ' · Fund: ' + U.esc(a.entdeckt.name) : ' · kein Fund') + '</div>' : '';
    var bfz = a.lastBackfill ? '<div style="color:var(--muted); margin-top:3px;">Capital-Backfill: ' + a.lastBackfill.bars + ' Kerzen nachgeladen (' + U.dt(a.lastBackfill.at) + ')</div>' : '';
    var apl = a.lastApply ? '<div style="color:var(--muted); margin-top:3px;">Zuletzt übernommen: ' + U.dt(a.lastApply.at) + ' · ' + U.esc(a.lastApply.name || '') + '</div>' : '';
    var hinweis = a.on === false ? 'Autopilot ist aus – es wird gesammelt, aber nichts gemessen oder geändert.'
      : 'Misst jede Nacht nach US-Börsenschluss und wendet doppelt bestätigte Ergebnisse vor Handelsbeginn an. Von Hand gesetzte Felder bleiben unangetastet.';
    el.innerHTML = txt + pend + apl + bfz + tfz + deck + '<div style="color:var(--muted); margin-top:3px;">' + hinweis + '</div>';
  }

  function renderCentral() {
    var out = document.getElementById('centralResult');
    if (!out) return;
    if (!D.central || !D.central.rec) {
      out.innerHTML = '<div class="empty"><span class="ico"></span>Noch keine Analyse gelaufen – ein Klick oben genügt.</div>';
      return;
    }
    var c = D.central, r = c.rec;
    var html = '<div style="display:flex; gap:14px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">' +
      '<span style="font-size:var(--fs-text);">' + r.verdict + '</span>' +
      '<span style="font-size:var(--fs-gross); font-weight:700;">' + U.esc(r.modeName) + ' · ' + r.interval + '</span>' +
      '<span style="color:var(--muted); font-size:var(--fs-neben);">Stand: ' + U.dt(c.at) + '</span></div>';
    html += '<table class="tbl" style="max-width:680px;"><tr><th>Empfehlung</th><th>Wert</th><th>Begründung</th></tr>' +
      '<tr><td>Modus / Zeitrahmen</td><td><b>' + U.esc(r.modeName) + ' · ' + r.interval + '</b></td><td>Walk-Forward ' + U.signTxt(r.wfRet, ' %') + ' · ' + r.posSegs + '/' + (r.scheibenMax || 4) + ' Scheiben · ' + r.n + ' Trades · ' + r.winRate + ' % Treffer · PF ' + r.pf + (r.datenbasis ? ' · Datenbasis: ' + r.datenbasis.symbole + ' Werte über ' + r.datenbasis.spanneTage + ' Tage' : '') + '</td></tr>' +
      '<tr><td>Leitlinie / Periode / Bestätigung</td><td><b>' + r.lineType.toUpperCase() + ' · P' + r.period + ' · ' + (r.confirmBps / 100).toFixed(2) + ' %</b></td><td>' +
      (r.fine ? (r.fine.used ? 'Feinschliff gewählt: Training ' + U.signTxt(r.fine.train, ' %') + ' → Wahlscheibe ' + U.signTxt(r.fine.valid, ' %') : 'Feinschliff nicht robust (Wahlscheibe ' + (r.fine.valid == null ? 'ohne Ergebnis' : U.signTxt(r.fine.valid, ' %')) + ') → Labor-Parameter behalten') : 'aus dem Walk-Forward') +
        (r.fine && r.fine.beleg != null ? '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:2px;">Auf der unberührten Belegscheibe: ' + U.signTxt(r.fine.beleg, ' %') + ' (' + r.fine.belegN + ' Trades) – diese Zahl hat nichts entschieden.</div>' : '') + '</td></tr>' +
      /* Die Zufallsprobe gehoert AN DIE ERSTE STELLE der Bewertung, nicht in eine
       * Fussnote: bei 56 Kandidaten ist sie die Frage, ob ueberhaupt etwas da ist. */
      '<tr><td>Gegen den Zufall</td><td>' +
        (r.zufall
          ? (r.ueberzufaellig
              ? '<b class="pos">schlägt den Zufall</b>'
              : '<b class="neg">nicht überzufällig</b>')
          : '<span style="color:var(--muted);">kein Urteil</span>') + '</td><td>' +
        (r.zufall
          ? 'Bester von ' + r.zufall.n + ' Kandidaten: ' + r.zufall.bester + ' %. Reiner Zufall bringt bei ' + r.zufall.n +
            ' Versuchen im Mittel ' + r.zufall.zufallsMedian + ' % und in 5 % der Fälle über ' + r.zufall.zufallsP95 +
            ' % (p=' + r.zufall.pWert + ').' +
            (r.ueberzufaellig ? '' : ' Deshalb wird nichts umgestellt – so gut fällt der Beste auch ohne jede echte Kante aus.')
          : 'Für eine Zufallsprobe braucht es mindestens 20 belastbare Kandidaten.') + '</td></tr>' +
      (r.scheiben ? '<tr><td>Datenscheiben</td><td>' + (r.scheiben.belegTage != null ? r.scheiben.belegTage + ' Tage Beleg' : '–') + '</td><td>' +
        'Optimiert auf ' + r.scheiben.trainTage + ' Handelstagen, entschieden auf ' + r.scheiben.wahlTage + ', berichtet auf ' + r.scheiben.belegTage +
        '. Die Belegscheibe wird von keiner Entscheidung angefasst – deshalb ist ihre Zahl eine Aussage und keine Auswahl.</td></tr>' : '') +
      '<tr><td>Zeitfenster</td><td><b>' + WINDOW_NAMES[r.window] + '</b></td><td>bestes Out-of-Sample-Fenster nach P/L</td></tr>' +
      '<tr><td>Meide-Stunden</td><td><b>' + (r.avoidHours.length ? r.avoidHours.map(function (h) { return h + ' Uhr'; }).join(', ') : 'keine') + '</b></td><td>Stunden mit ≥3 Trades und negativem P/L (Berlin)</td></tr>' +
      '<tr><td>Stärkste Werte</td><td colspan="2">' + r.topSymbols.map(U.esc).join(' · ') + '</td></tr></table>';
    if (r.filterBilanz && r.filterBilanz.zeilen && r.filterBilanz.zeilen.length) {
      html += '<div style="font-size:var(--fs-text); font-weight:600; margin-top:14px;">Filter-Bilanz (bester Kandidat, ungesehene Daten)</div>';
      html += '<div style="color:var(--muted); font-size:var(--fs-neben); margin:2px 0 6px;">Basis mit allen Filtern: ' + U.signTxt(r.filterBilanz.basisRet, ' %') + ' bei ' + r.filterBilanz.basisN + ' Trades. Nutzen = mit minus ohne – positiv heißt: der Filter spart Geld.</div>';
      html += '<table class="tbl" style="font-size:var(--fs-neben);"><tr><th>Filter</th><th>mit</th><th>ohne</th><th>Nutzen</th><th>Trades mit/ohne</th><th>Urteil</th></tr>';
      r.filterBilanz.zeilen.forEach(function (fz) {
        var fu = fz.duenn ? 'zu wenig Trades' : fz.nutzen > 0.5 ? 'spart Geld' : fz.nutzen < -0.5 ? 'kostet Geld' : 'neutral';
        html += '<tr><td>' + U.esc(fz.name) + '</td><td class="' + U.signCls(fz.mitRet) + '">' + U.signTxt(fz.mitRet, ' %') + '</td>' +
          '<td class="' + U.signCls(fz.ohneRet) + '">' + U.signTxt(fz.ohneRet, ' %') + '</td>' +
          '<td class="' + U.signCls(fz.nutzen) + '"><b>' + U.signTxt(fz.nutzen, ' Pp') + '</b></td>' +
          '<td>' + fz.mitN + '/' + fz.ohneN + '</td><td>' + fu + '</td></tr>';
      });
      html += '</table>';
    }
    // Volles Ranking: ALLE Kandidaten mit dem Grund, woran sie scheitern – dieselbe
    // Sicht wie im messbericht.md, damit App und Bericht nie auseinanderlaufen.
    if (c.ranking && c.ranking.length) {
      html += '<div style="font-size:var(--fs-text); font-weight:600; margin-top:14px;">Alle Kandidaten dieser Messung</div>';
      if (c.datenlage) {
        var dlz = ['1m', '5m', '15m', '60m'].map(function (iv2) { var d2 = c.datenlage[iv2] || {}; return iv2 + ': ' + (d2.handelstage || 0) + ' Tage / ' + (d2.werte || 0) + ' Werte'; }).join(' · ');
        html += '<div style="color:var(--muted); font-size:var(--fs-neben); margin:2px 0 6px;">Messbasis – ' + dlz + '</div>';
      }
      html += '<table class="tbl" style="font-size:var(--fs-neben);"><tr><th>#</th><th>Setup</th><th>Zeitrahmen</th><th>WF-Rendite</th><th>Scheiben+</th><th>Trades</th><th>Tage</th><th>PF</th><th>Woran scheitert es</th></tr>';
      c.ranking.forEach(function (r2, i2) {
        html += '<tr><td>' + (i2 + 1) + '</td><td>' + U.esc(r2.name) + '</td><td>' + r2.interval + '</td>' +
          '<td class="' + U.signCls(r2.wfRet) + '">' + U.signTxt(r2.wfRet, ' %') + '</td>' +
          '<td>' + (r2.posSegs || 0) + '/' + (r2.scheibenMax || 4) + '</td><td>' + (r2.n || 0) + '</td><td>' + (r2.oosTage || 0) + '</td><td>' + (r2.pf != null ? r2.pf : '–') + '</td>' +
          '<td>' + U.esc(scheiterGrund(r2)) + '</td></tr>';
      });
      html += '</table>';
    }
    html += '<div style="display:flex; gap:8px; align-items:center; margin-top:10px; flex-wrap:wrap;">' +
      '<button class="btn" id="centralApplyBtn">Empfehlung komplett übernehmen</button>' +
      '<span id="centralApplyStatus" style="color:var(--muted); font-size:var(--fs-neben);"></span></div>';
    html += '<div style="color:var(--muted); font-size:var(--fs-neben); margin-top:8px;">Ehrlichkeit: ' + r.n + ' Out-of-Sample-Trades sind eine kleine Stichprobe – die Empfehlung ist ein Kandidat, kein Beweis. Analyse regelmäßig wiederholen; sie wird mit jedem Handelstag belastbarer. Ergebnis liegt auch im Analyse-Export.</div>';
    out.innerHTML = html;
    var ab = document.getElementById('centralApplyBtn');
    if (ab) ab.addEventListener('click', function () {
      if (r.verdict && (r.verdict.indexOf('kein Vorteil') !== -1 || r.verdict.indexOf('nicht belastbar') !== -1)) {
        document.getElementById('centralApplyStatus').textContent = 'Gesperrt: ' + (r.verdict.indexOf('nicht belastbar') !== -1
          ? 'Dieses Urteil beruht auf zu wenigen Trades (' + r.n + ') – das ist Rauschen, keine Messung.'
          : 'Dieses Setup hat im Test KEINEN Vorteil gezeigt (' + r.verdict + ').') + ' Es wird nicht übernommen.';
        return;
      }
      var applied = applyCentralRec(r, 'manuell');
      save();
      document.getElementById('centralApplyStatus').textContent = (applied.length ? 'Übernommen (' + applied.length + ' Änderungen)' : 'Nichts zu ändern – läuft bereits so') + ' – gilt ab dem nächsten Scan' + (r.avoidHours.length ? ' (Meide-Stunden aktiv: ' + r.avoidHours.join(', ') + ' Uhr)' : '') + '.';
      renderTuneLog();
      render();
    });
  }


  /* ================= Init & Loop ================= */
  async function init() {
    D = (await window.api.storeGet('depot')) || defaultDepot();
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
    if (repaired || messNeu) save();
    render();
    var jS0 = document.getElementById('jobStatus');
    if (jS0) jS0.textContent = D.lastRun
      ? 'Letzter Lauf: ' + U.dt(D.lastRun)
      : (D.hourlyEnabled !== false ? 'Noch kein Lauf – nächster innerhalb einer Stunde.' : 'Kein Lauf nötig – die Strategie ist aus.');
    /* Warnband-Knoepfe (Delegation - das Band wird bei jeder Aenderung neu gebaut).
     * "Trotzdem weiter handeln" ist ein Hand-Entscheid gegen die Messung: er wird
     * dauerhaft respektiert und nie wieder automatisch angefasst (Muster hourly). */
    /* DER WEG ZURUECK. Bis zum 25.08.2026 gab es ihn nicht: edgePauseHand wurde an genau
     * einer Stelle auf true gesetzt und an keiner je zurueck. Automatisch angefasst wird
     * der Entscheid weiterhin NIE - nur von Hand, so wie er zustande kam. */
    var wbS = document.getElementById('warnband');
    if (wbS) wbS.addEventListener('click', function (evS) {
      var bs = evS.target.closest ? evS.target.closest('[data-edgescharf]') : null;
      if (!bs) return;
      delete D.intraday.edgePauseHand;
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'hand-' + Date.now(), at: Date.now(), quelle: 'hand',
        applied: ['Edge-Wächter wieder scharf'],
        txt: 'Von Hand entschieden: der Edge-Wächter darf wieder automatisch aussetzen. Eine bereits gemessene, noch stehende Pause greift damit sofort wieder.' });
      save();
      edgePauseAnzeigen();
    });

    var wb = document.getElementById('warnband');
    if (wb) wb.addEventListener('click', function (evW) {
      var b = evW.target.closest ? evW.target.closest('[data-edgefrei]') : null;
      if (!b) return;
      D.intraday.edgePauseHand = true;
      if (!D.tuneLog) D.tuneLog = [];
      D.tuneLog.unshift({ id: 'hand-' + Date.now(), at: Date.now(), quelle: 'hand',
        applied: ['Edge-Wächter-Pause übersteuert'],
        txt: 'Von Hand entschieden: trotz verfallenem Vorsprung weiter handeln. Der Edge-Wächter misst weiter, pausiert aber nicht mehr automatisch - fuer KEINEN Arm. ' +
          'Das steht ab jetzt dauerhaft im Warnband und laesst sich dort auch zuruecknehmen.' });
      save();
      edgePauseAnzeigen();
    });
    // Sub-Navigation (Pills)
    /* Allgemein statt auf #depotPills festgenagelt: Seit Stufe 4 gibt es eine zweite
     * Pillenleiste (Werkzeuge). Der Umschalter arbeitet jetzt in dem Reiter, in dem die
     * angeklickte Pille steht - so kostet jede weitere Leiste keinen neuen Code. */
    /* Nur Pillen MIT data-sub sind Navigation. Ohne diese Einschraenkung fing der
     * Umschalter auch die sechs Protokoll-Filter, den CSV-Knopf und die beiden
     * Setup-Pillen ab: er blendete alle .sub-Bereiche aus, fand dann kein Ziel und
     * schaltete nichts zurueck - der Reiter blieb leer. */
    var pills = document.querySelectorAll('.pills button[data-sub]');
    pills.forEach(function (b) {
      b.addEventListener('click', function () {
        var reiter = b.closest('.tab');
        var meine = reiter ? reiter.querySelectorAll('.pills button[data-sub]') : [b];
        meine.forEach(function (x) { x.classList.remove('active'); });
        if (reiter) reiter.querySelectorAll('.sub').forEach(function (s) { s.classList.remove('active'); });
        b.classList.add('active');
        var subZiel = document.getElementById('sub-' + b.getAttribute('data-sub'));
        if (subZiel) subZiel.classList.add('active');
        render();
        if (b.getAttribute('data-sub') === 'auswertung') renderAnalytics();
        if (b.getAttribute('data-sub') === 'strategien') { renderPilot(); renderRegime(); }
        if (b.getAttribute('data-sub') === 'wende') wendePruefen(false);
      });
    });

    if (window.api.appVersion) window.api.appVersion().then(function (v) { APP_VER = v || ''; });
    // Sentiment-Historie laden
    SENT = (await window.api.storeGet('sentiment')) || {};

    // Risiko-Einstellungen verkabeln
    if (!D.risk) D.risk = { maxPos: 8, dayLossPct: 5, exposurePct: 40 };
    var rkP = document.getElementById('rkMaxPos'), rkD = document.getElementById('rkDayLoss'), rkE = document.getElementById('rkExposure');
    rkP.value = String(D.risk.maxPos || 8);
    rkD.value = String(D.risk.dayLossPct != null ? D.risk.dayLossPct : 5);
    rkE.value = String(D.risk.exposurePct != null ? D.risk.exposurePct : 40);
    [rkP, rkD, rkE].forEach(function (el) {
      el.addEventListener('change', function () {
        D.risk.maxPos = parseInt(rkP.value, 10);
        D.risk.dayLossPct = parseInt(rkD.value, 10);
        D.risk.exposurePct = parseInt(rkE.value, 10);
        save();
        render();
      });
    });

    // Retrospektive & Wochenreport
    document.getElementById('retroBtn').addEventListener('click', runRetro);
    document.getElementById('weeklyBtn').addEventListener('click', runWeekly);
    document.getElementById('reportShowBtn').addEventListener('click', showReport);
    (function () {
      // Strategie-Chart im Reiter „Regeln“ (Issue #51)
      var sb = document.getElementById('stcBtn'), ss = document.getElementById('stcSym');
      if (sb && ss) {
        universe().forEach(function (s2) { var o = document.createElement('option'); o.value = s2; o.textContent = s2; ss.appendChild(o); });
        sb.addEventListener('click', runStrategieChart);
        /* Benannte Regeln (Issue #36): festschreiben, was JETZT eingestellt ist. */
        var rnb = document.getElementById('regelNeuBtn');
        if (rnb) rnb.addEventListener('click', function () {
          var nEl = document.getElementById('regelName'), stEl = document.getElementById('regelStatus');
          var name = (nEl.value || '').trim().slice(0, 40);
          if (!name) { stEl.textContent = 'Bitte einen Namen vergeben.'; return; }
          if (!D.regeln) D.regeln = [];
          if (D.regeln.some(function (x) { return x.name === name; })) { stEl.textContent = 'Diesen Namen gibt es schon.'; return; }
          if (D.regeln.length >= 8) { stEl.textContent = 'Höchstens acht Regeln gleichzeitig – mehr misst man nicht ernsthaft.'; return; }
          /* Eine KOPIE der aktuellen Einstellungen, nicht ein Verweis darauf. Sonst
           * aendert sich die festgeschriebene Regel mit, sobald jemand oben dreht -
           * und dann misst sie nicht mehr, was sie zu messen vorgibt. */
          D.regeln.push({ id: 'r' + Date.now(), name: name, seit: Date.now(),
            cfg: JSON.parse(JSON.stringify(D.intraday || {})) });
          nEl.value = '';
          stEl.textContent = 'Festgeschrieben. Ab dem nächsten Scan läuft sie mit – ohne Geld.';
          save(); regelnAnzeigen();
        });
        var rl = document.getElementById('regelnListe');
        if (rl) rl.addEventListener('click', function (ev) {
          var b = ev.target && ev.target.closest ? ev.target.closest('button.regelWeg') : null;
          if (!b) return;
          var id = b.getAttribute('data-id');
          var r = (D.regeln || []).filter(function (x) { return x.id === id; })[0];
          if (!r) return;
          if (!window.confirm('Regel „' + r.name + '“ löschen?\n\nIhre Schatten bleiben im Buch, ' +
            'aber die Zeile verschwindet. Eine gelöschte Messung lässt sich nicht rückwirkend fortsetzen.')) return;
          D.regeln = (D.regeln || []).filter(function (x) { return x.id !== id; });
          save(); regelnAnzeigen();
        });
        var kb = document.getElementById('stcKontext');
        // Neu zeichnen genuegt - die Reihe liegt schon im Zustand, ein Neuladen waere
        // ein Netzabruf fuer eine reine Anzeigefrage.
        if (kb) kb.addEventListener('change', function () {
          var S = stcState;
          if (!S) return;
          var svg = document.getElementById('stcChart');
          var hl = S.gewaehlt != null && S.gewaehlt >= S.off ? S.gewaehlt - S.off : null;
          if (svg) drawStrategieChart(svg, S.show, S.e20, S.e100,
            stcKanalListe(S, S.gewaehlt, kb.checked), S.marksShow, hl, S.band);
        });
      }
      // Signale anklickbar (Issue #52): in der Liste und direkt im Chart. Delegiert,
      // weil beide Inhalte bei jedem Lauf neu gezeichnet werden.
      var sl = document.getElementById('stcSignale');
      if (sl) sl.addEventListener('click', function (ev) {
        var tr = ev.target && ev.target.closest ? ev.target.closest('tr.stcRow') : null;
        if (tr) stcSignalWaehlen(parseInt(tr.getAttribute('data-idx'), 10));
      });
      var sc2 = document.getElementById('stcChart');
      if (sc2) sc2.addEventListener('click', function (ev) {
        var t = ev.target;
        if (!t || !t.getAttribute || !t.getAttribute('data-mark')) return;
        if (!stcState) return;
        stcSignalWaehlen(stcState.off + parseInt(t.getAttribute('data-mark'), 10));
      });
    })();
    document.getElementById('filterBtn').addEventListener('click', runFilterCheck);
    renderSigMonitor();
    renderSymBlocks();
    (function () {
      var fw = document.getElementById('feeWarn');
      if (fw && D.intraday.orderFee === 0) fw.textContent = 'Ordergebühr 0 – korrekt für Broker ohne Kommission (z. B. Capital.com, dort steckt alles im Spread). Bei einem Broker mit Ordergebühr hier den echten Betrag eintragen, sonst sehen Backtests besser aus, als sie sind.';
    })();
    document.getElementById('exportDataBtn').addEventListener('click', async function () {
      var stE = document.getElementById('reportStatus');
      stE.textContent = 'Exportiere …';
      var r = await exportAnalysis(true);
      stE.textContent = r && r.ok ? 'Gespeichert in ' + r.dir : 'Export fehlgeschlagen' + (r && r.msg ? ': ' + r.msg : ' (läuft die App als Installation?)');
    });

    // Optimierer, CSV, Watchlist, Strategie-Labor
    document.getElementById('csvBtn').addEventListener('click', exportCsv);
    renderWatchChips();

    // Capital.com-Demo-Status
    async function updateCapStatus() {
      var el = document.getElementById('capStatus');
      if (!el) return;
      if (!(window.CapAPI && window.CapAPI.enabled())) {
        /* Halbfertiger Zustand sichtbar machen: Zugangsdaten liegen, aber der
         * Schalter ist aus - dann passiert nichts, und bisher stand hier NICHTS,
         * was das erklaert hätte (22.08.2026). */
        var s9 = window.getSettings ? window.getSettings() : null;
        el.textContent = (s9 && s9.capKey && s9.capId && s9.capPass && !s9.capEnabled)
          ? 'Capital.com: Zugangsdaten sind hinterlegt, die Spiegelung ist aber AUS. Häkchen in den App-Einstellungen setzen – erst dann werden Signale gespiegelt und die echten Handelskosten gemessen.'
          : '';
        return;
      }
      el.textContent = 'Capital.com Demo: verbinde …';
      var s0 = await window.CapAPI.status();
      var txt = '' + s0.msg + (s0.ok ? ' · Intraday-Signale werden gespiegelt.' : '');
      /* Die gemessenen Kosten gehoeren direkt neben die Annahme, mit der ALLE
       * Studien rechnen - das ist der eigentliche Zweck der Anbindung. */
      var kb = kostenBilanz();
      if (kb) {
        var diff = kb.medianPct - kb.annahmePct;
        txt += ' · Gemessene Handelskosten aus ' + kb.n + ' vollständigen Runden: Median ' +
          kb.medianPct.toFixed(3) + ' % je Runde (angenommen: ' + kb.annahmePct.toFixed(2) + ' %) – ' +
          (kb.n < 20 ? 'noch zu wenige Runden für ein Urteil'
            : Math.abs(diff) < 0.02 ? 'die Annahme der Studien trägt'
            : diff > 0 ? 'teurer als angenommen, die Studien rechnen zu günstig'
            : 'günstiger als angenommen – die Kostenhürde der Studien ist zu streng');
      } else if (s0.ok) {
        /* Stand 25.08.2026 stimmte dieser Satz nicht mehr: gespiegelt wird nur im
         * Intraday-Pfad, und der ist seit dem 23.08. vom Edge-Waechter pausiert. Der
         * Satz haette auf etwas gewartet, das nicht kommt. */
        if (kb && kb.kryptoN) {
          txt += ' · Krypto getrennt gemessen (' + kb.kryptoN + ' Runde(n)): Median ' +
            kb.kryptoMedianPct.toFixed(3) + ' % je Runde – sagt NICHTS über die Spanne auf Aktien.';
        }
        txt += ' · Kostenmessung aus Ausführungen: noch keine Runde. Sie startet mit dem ersten ' +
          'gespiegelten Trade – oder sofort über „Kostenrunde messen“, das braucht kein Signal.';
      }
      /* Die Spannen-Messung braucht keine Trades - nur Kurse. Sie liefert die
       * Kostenhuerde deshalb schon nach einer Handelssitzung. */
      var sb = spannenBilanz();
      if (sb) {
        var d2 = sb.medianPct - sb.annahmePct;
        txt += ' · Gemessene Geld-Brief-Spanne über ' + sb.werte + ' Werte (' + sb.proben + ' Proben): Median ' +
          sb.medianPct.toFixed(3) + ' % je Runde, Spanne ' + sb.engstesPct.toFixed(3) + '–' + sb.weitestesPct.toFixed(3) +
          ' % · angenommen 0,10 % → ' +
          (Math.abs(d2) < 0.015 ? 'die Annahme der Studien trägt'
            : d2 > 0 ? 'teurer als angenommen: die Studien rechnen zu günstig'
            : 'günstiger als angenommen: die Kostenhürde der Studien ist zu streng');
      }
      /* Aus dem Kursarchiv - reicht weiter zurueck und ueber mehr Werte als der
       * Live-Ringpuffer, misst aber Kerzenschluss statt Quote. Steht NEBEN der
       * Messung oben, nicht an ihrer Stelle. */
      var sh = spannenHistorie();
      if (sh) {
        txt += ' · Aus dem Kursarchiv (' + sh.tage + ' Tage, ' + sh.werte + ' Werte): Median ' +
          sh.medianPct.toFixed(3) + ' %, ' + sh.engstesPct.toFixed(3) + '–' + sh.weitestesPct.toFixed(3) + ' %' +
          (sh.streuung ? ' – der weiteste Wert kostet das ' + sh.streuung.toFixed(2) + '-fache des engsten' : '') +
          ' (Kerzenschluss-Bid/Ask, nicht Quote-Proben).';
      }
      /* Der letzte Versuch einer Messrunde - auch ein gescheiterter. Sonst steht nach
       * einem Klick, der an einer Sperre endete, wieder nichts da. */
      var kv = (D && D.kostenVersuche || [])[0];
      if (kv) {
        txt += ' · Letzte Kostenrunde (' + U.dt(kv.at) + (kv.sym ? ', ' + kv.sym : '') + '): ' +
          (kv.ok ? kv.grund : 'nicht gelaufen – ' + kv.grund);
      }
      el.textContent = txt;
    }
    /* Messrunde von Hand. Setzt echte Orders auf dem Demo-Konto ab - deshalb eine
     * Rueckfrage davor und ein Riegel gegen Doppelklicks. Die Symbole werden
     * durchgereicht, damit die Proben nicht alle an einem Wert haengen. */
    var kostenRundeLaeuft = false, kostenRundeTakt = 0;
    (function () {
      var b = document.getElementById('kostenRundeBtn');
      var st = document.getElementById('kostenRundeStatus');
      if (!b) return;
      b.addEventListener('click', async function () {
        if (kostenRundeLaeuft) return;
        var wahl = document.getElementById('kostenRundeSym');
        var sym = wahl && wahl.value ? wahl.value : null;
        if (!sym) {
          var syms = universe();
          if (!syms.length) { st.textContent = 'Kein Wert im Universum.'; return; }
          sym = syms[kostenRundeTakt % syms.length];
        }
        if (!window.confirm('Auf dem Capital.com-DEMO-Konto wird jetzt die kleinstmögliche Position in ' +
            sym + ' geöffnet und sofort wieder geschlossen. Das ist eine echte Order mit Demo-Geld.\n\n' +
            'Gemessen wird, was ein Umlauf wirklich kostet. Fortfahren?')) return;
        kostenRundeTakt++;
        kostenRundeLaeuft = true; b.disabled = true;
        st.textContent = 'Messe ' + sym + ' …';
        var r = null;
        try { r = await kostenRundeMessen(sym); }
        catch (e) { r = { ok: false, grund: 'Fehler: ' + (e && e.message || e) }; }
        if (r && r.ok) {
          var n = ((D.kostenMessung || {}).runden || []).length;
          st.textContent = sym + ': Umlauf ' + r.rundePct.toFixed(3) + ' %' +
            (r.notiertPct != null ? ' (notiert ' + r.notiertPct.toFixed(3) + ' %, Rest ist Schlupf)' : '') +
            ' · ' + n + ' von ~20 Runden';
        } else {
          st.textContent = (r && r.grund) || 'Die Runde lief nicht durch.';
        }
        render();
        kostenRundeLaeuft = false; b.disabled = false;
      });
    })();

    setTimeout(updateCapStatus, 3000);
    setInterval(updateCapStatus, 10 * 60000);
    document.addEventListener('settings-saved', function () { setTimeout(updateCapStatus, 500); });

    // Protokoll-Filter
    var lfBtns = document.querySelectorAll('#logFilter button');
    lfBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        lfBtns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        logFilter = b.getAttribute('data-lf');
        render();
      });
    });

    // Stunden-Strategie-Schalter
    var hE = document.getElementById('hourlyEnabled');
    if (hE) {
      hE.checked = D.hourlyEnabled !== false;
      hE.addEventListener('change', function () {
        D.hourlyEnabled = hE.checked;
        save();
        render();
        var jS = document.getElementById('jobStatus');
        if (jS) jS.textContent = hE.checked
          ? 'Aktiv – nächster Lauf innerhalb einer Stunde.'
          : 'Pausiert – der Knopf „Bestand jetzt prüfen“ betreut nur noch offene Altpositionen.';
      });
    }

    // Stunden-Scheduler: alle 5 Min prüfen, ob eine Stunde um ist
    setInterval(function () {
      if (D.hourlyEnabled !== false && Date.now() - D.lastRun >= 3600000 && !jobRunning) runJob(false);
    }, 5 * 60000);
    // Beim Start: nachholen, wenn der letzte Lauf >1 h her ist
    if (D.hourlyEnabled !== false && Date.now() - D.lastRun >= 3600000) setTimeout(function () { runJob(false); }, 20000);

    // Intraday-UI verkabeln
    var idE = document.getElementById('idEnabled'), idP = document.getElementById('idPeriod'), idC = document.getElementById('idConfirm');
    var idI = document.getElementById('idInterval'), idPr = document.getElementById('idProfile'), idF = document.getElementById('idFee'), idL = document.getElementById('idLiq');
    var idM = document.getElementById('idMode');
    var idLn = document.getElementById('idLine'), idTr = document.getElementById('idTrend'), idW = document.getElementById('idWindow');
    var idH = document.getElementById('idHold'), idTl = document.getElementById('idTrail'), idSS = document.getElementById('idScalpSL');
    var idCh = document.getElementById('idChannel');
    var idMt = document.getElementById('idMtf'), idSz = document.getElementById('idSizing'), idScr = document.getElementById('idScreener');
    /* Defensiv: ein einzelnes fehlendes Bedienelement darf die Verkabelung des
     * ganzen Formulars nicht abbrechen (UI-Audit 21.08.2026). */
    function setzeWert(el, val) { if (el) el.value = val; }
    function setzeHaken(el, val) { if (el) el.checked = val; }
    setzeHaken(idCh, D.intraday.channel !== false);
    setzeHaken(idMt, D.intraday.mtf !== false);
    setzeWert(idSz, parseFloat(D.intraday.sizing) > 0 ? String(D.intraday.sizing) : 'fix');
    setzeHaken(idScr, !!D.intraday.screener);
    setzeWert(idLn, D.intraday.lineType || 'ema');
    setzeWert(idTr, D.intraday.trendFilter ? '1' : '0');
    setzeWert(idW, D.intraday.window || 'all');
    setzeWert(idH, String(D.intraday.scalpHold != null ? D.intraday.scalpHold : 60));
    setzeWert(idTl, String(D.intraday.scalpTrail != null ? D.intraday.scalpTrail : 15));
    setzeWert(idSS, D.intraday.scalpSL === 'auto' ? 'auto' : String(D.intraday.scalpSL != null ? D.intraday.scalpSL : 20));
    setzeWert(document.getElementById('idBlackout'), D.intraday.blackout || 'block');
    setzeWert(idM, D.intraday.mode || 'rsi2seit');
    // Modus-/Zeitrahmen-abhängige Felder ein-/ausblenden
    function updateParamVis() {
      var m = idM.value, iv = idI.value;
      document.querySelectorAll('#idParams label[data-modes]').forEach(function (l) {
        l.style.display = l.getAttribute('data-modes').split(',').indexOf(m) !== -1 ? '' : 'none';
      });
      document.querySelectorAll('#idParams label[data-iv]').forEach(function (l) {
        l.style.display = l.getAttribute('data-iv') === iv ? '' : 'none';
      });
      /* Die Box mit den gemessenen Stellschrauben liegt bewusst ausserhalb von
       * #idParams (sie soll ueber der Experten-Klappe stehen) - deshalb wird sie
       * hier eigens ein- und ausgeblendet. Ihre drei Regler wirken nur in den
       * beiden belegten Modi; in einem anderen Modus liest der Code sie nie. */
      var bb = document.querySelector('.belegt-box');
      if (bb) bb.style.display = (m === 'rsi2seit' || m === 'kapitulation') ? '' : 'none';
      var pg = document.getElementById('pgScalp');
      if (pg) {
        var any = Array.prototype.some.call(pg.querySelectorAll('.params > label'), function (l) { return l.style.display !== 'none'; });
        pg.style.display = any ? '' : 'none';
      }
      if (window.__syncSetupUI) window.__syncSetupUI();
    }
    /* ===== Setup-Bedienung: zwei Pillen + Auslöser + Ausstieg ===== */
    var idTg = document.getElementById('idTrigger'), idEx = document.getElementById('idExit');
    var setupPills = document.querySelectorAll('#idSetupPills button');
    /* Belegstand der Auslöser - rein zur Anzeige. Die Schlüssel selbst sind ein
     * Datenvertrag (SETUPS, setupFromMode, gespeicherte Depots, quant.js), deshalb
     * steht die Einteilung hier daneben und nicht in SETUPS. */
    var TRIG_BELEGT = { rsi2seit: 1, kapitulation: 1 };
    /** Standard-Auslöser je Setup: im Umkehr-Setup die belegte Kante, nicht der Listenerste. */
    function standardTrigger(setup) {
      return setup === 'umkehr' ? 'rsi2seit' : Object.keys(SETUPS[setup].trigger)[0];
    }
    function fillTrigger(setup, sel) {
      if (!idTg) return;
      var tr = SETUPS[setup].trigger;
      idTg.innerHTML = '';
      /* Zwei Gruppen, nicht drei: Auch der rohe RSI(2) IST gemessen - er kam als
       * Muenzwurf heraus (+0,017 Pp) und traegt erst mit der Seitwaerts-Erlaubnis.
       * Ihn als "noch nicht gemessen" zu fuehren waere eine neue Unwahrheit. */
      var gruppen = [
        { titel: 'Belegt und in Betrieb', test: function (k) { return TRIG_BELEGT[k]; } },
        { titel: 'Gemessen, ohne eigenen Vorsprung', test: function (k) { return !TRIG_BELEGT[k]; } }
      ];
      gruppen.forEach(function (g) {
        var keys = Object.keys(tr).filter(g.test);
        if (!keys.length) return;
        var og = document.createElement('optgroup'); og.label = g.titel;
        keys.forEach(function (k) {
          var o = document.createElement('option'); o.value = k; o.textContent = tr[k]; og.appendChild(o);
        });
        idTg.appendChild(og);
      });
      idTg.value = tr[sel] ? sel : standardTrigger(setup);
    }
    /** Bedienelemente aus dem internen Modus nachziehen (auch nach Auto-Tuning). */
    function syncSetupUI() {
      if (!idM) return;
      var st2 = setupFromMode(idM.value);
      setupPills.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-setup') === st2.setup); });
      fillTrigger(st2.setup, st2.trigger);
      setzeWert(idEx, (st2.setup === 'ausbruch' && st2.trigger === 'kreuzung' && D.intraday.exitStyle) ? D.intraday.exitStyle : st2.exitStyle);
      var lx = document.getElementById('lblExit');
      if (lx) lx.style.display = (st2.setup === 'ausbruch' && st2.trigger === 'kreuzung') ? '' : 'none';
    }
    function applySetup(setup, trigger, exitStyle) {
      var m = modeFromSetup(setup, trigger, exitStyle);
      setzeWert(idM, m);
      /* Die belegten Kanten bringen ihre GEMESSENE Konfiguration mit. Vorher setzte
       * jeder Umkehr-Auslöser stur 1 Minute – wer „RSI(2) im Seitwärtskanal“ wählte,
       * verließ damit im selben Klick die Einstellung, auf der die Messung beruht
       * (60-Minuten-Kerzen, 8 bzw. 26 Handelsstunden Zeit-Ausstieg). */
      var warBelegt = idH && (idH.value === '480' || idH.value === '1560');
      if (m === 'rsi2seit' || m === 'kapitulation') {
        setzeWert(idI, '60m'); setzeWert(idC, '15');
        setzeWert(idH, m === 'kapitulation' ? '1560' : '480');
      }
      else {
        /* Beim VERLASSEN der belegten Kanten muss die Haltedauer mit: 8 oder 26
         * Handelsstunden gehoeren zu ihnen, nicht zu einem Minuten-Setup - und der
         * Formular-Klick sperrt das Feld anschliessend gegen jede Automatik. */
        if (warBelegt) setzeWert(idH, '60');
        if (setup === 'umkehr') { setzeWert(idI, '1m'); setzeWert(idC, '15'); if (trigger === 'welle') setzeWert(idTr, '1'); }
        else if (trigger === 'range') { setzeWert(idI, '1m'); setzeWert(idC, '15'); }
        else if (exitStyle === 'kurz' || exitStyle === 'blitz') { setzeWert(idI, '1m'); setzeWert(idC, '5'); }
        else { setzeWert(idI, '5m'); setzeWert(idC, '15'); }
      }
      // Erst speichern, dann anzeigen: syncSetupUI liest den gespeicherten Ausstiegsstil –
      // in der alten Reihenfolge setzte es die frische Blitz-Auswahl auf den alten Wert zurück.
      idSave();
      syncSetupUI();
    }
    setupPills.forEach(function (b) {
      b.addEventListener('click', function () {
        var sNew = b.getAttribute('data-setup');
        if (!idM || setupFromMode(idM.value).setup === sNew) return;
        applySetup(sNew, standardTrigger(sNew), 'laufen');
      });
    });
    if (idTg) idTg.addEventListener('change', function () {
      var st2 = setupFromMode(idM.value);
      applySetup(st2.setup, idTg.value, idEx ? idEx.value : st2.exitStyle);
    });
    if (idEx) idEx.addEventListener('change', function () {
      var st2 = setupFromMode(idM.value);
      applySetup(st2.setup, st2.trigger, idEx.value);
    });
    setzeHaken(idE, !!D.intraday.enabled);
    setzeWert(idP, String(D.intraday.period));
    setzeWert(idC, String(D.intraday.confirmBps));
    setzeWert(idI, D.intraday.interval || '60m');
    setzeWert(idPr, D.intraday.profile || 'atm21');
    var idIns = document.getElementById('idInstrument');
    if (idIns) idIns.value = D.intraday.instrument || 'schein';
    var idPl = document.getElementById('idPool');
    if (idPl) idPl.value = D.intraday.pool || 'auto';
    var idKZ = document.getElementById('idKapiZusatz');
    if (idKZ) idKZ.checked = !!D.intraday.kapiZusatz;
    var idRZ = document.getElementById('idRegime');
    if (idRZ) idRZ.checked = !!D.intraday.regimeZuteilung;
    var idMS = document.getElementById('idMaxStufe');
    if (idMS) idMS.value = String(D.maxRisikostufe || 5);
    var idKH = document.getElementById('idKryptoHandeln');
    if (idKH) idKH.checked = !!D.intraday.kryptoHandeln;
    setzeWert(idF, String(D.intraday.orderFee != null ? D.intraday.orderFee : 0));
    setzeWert(idL, String(D.intraday.minDollarVol != null ? D.intraday.minDollarVol : 50));
    // 'enabled' bewusst nicht dabei: An/Aus ist Alltag, kein Experiment – das würde das Journal fluten.
    var HAND_FELDER = { mode: 'Setup', period: 'Periode', confirmBps: 'Bestätigung', interval: 'Zeitrahmen',
      profile: 'Schein-Profil', instrument: 'Instrument', kryptoHandeln: 'Krypto-Handel', lineType: 'Leitlinie', trendFilter: 'Trendfilter', window: 'Zeitfenster', scalpHold: 'Max-Halten',
      scalpTrail: 'Trailing', scalpSL: 'Not-Stop', blackout: 'Event-Blackout', channel: 'Trendkanal', mtf: '5-Min-Bestätigung',
      sizing: 'Positionsgröße', screener: 'Screener', exitStyle: 'Ausstieg' };
    /* Lies ein Feld nur, wenn es da ist - sonst bleibt der gespeicherte Wert stehen.
     * Verhindert, dass ein umgezogenes oder entferntes Bedienelement eine
     * Einstellung still auf undefined setzt. */
    function lies(el, alt, wandel) { return el ? (wandel ? wandel(el.value) : el.value) : alt; }
    function liesHaken(el, alt) { return el ? el.checked : alt; }
    function idSave() {
      var vorherHand = JSON.parse(JSON.stringify(D.intraday));
      D.intraday.mode = lies(idM, D.intraday.mode);
      D.intraday.period = lies(idP, D.intraday.period, function (v) { return parseInt(v, 10); });
      D.intraday.confirmBps = lies(idC, D.intraday.confirmBps, function (v) { return parseInt(v, 10); });
      D.intraday.interval = lies(idI, D.intraday.interval);
      D.intraday.profile = lies(idPr, D.intraday.profile);
      var idIns2 = document.getElementById('idInstrument');
      if (idIns2) D.intraday.instrument = idIns2.value;
      var idPl2 = document.getElementById('idPool');
      if (idPl2) D.intraday.pool = idPl2.value;
      var idKZ2 = document.getElementById('idKapiZusatz');
      if (idKZ2) D.intraday.kapiZusatz = idKZ2.checked;
      var idRZ2 = document.getElementById('idRegime');
      if (idRZ2) D.intraday.regimeZuteilung = idRZ2.checked;
      var idMS2 = document.getElementById('idMaxStufe');
      if (idMS2) D.maxRisikostufe = parseInt(idMS2.value, 10) || 5;
      var idKH2 = document.getElementById('idKryptoHandeln');
      if (idKH2) D.intraday.kryptoHandeln = idKH2.checked;
      D.intraday.orderFee = lies(idF, D.intraday.orderFee, parseFloat);
      var feeWarn = document.getElementById('feeWarn');
      if (feeWarn) feeWarn.textContent = D.intraday.orderFee === 0
        ? 'Ordergebühr 0 – korrekt für Broker ohne Kommission (z. B. Capital.com). Bei Ordergebühren hier den echten Betrag eintragen.'
        : '';
      D.intraday.minDollarVol = lies(idL, D.intraday.minDollarVol, function (v) { return parseInt(v, 10); });
      D.intraday.lineType = lies(idLn, D.intraday.lineType);
      D.intraday.trendFilter = idTr ? idTr.value === '1' : !!D.intraday.trendFilter;
      D.intraday.window = lies(idW, D.intraday.window);
      D.intraday.scalpHold = lies(idH, D.intraday.scalpHold, function (v) { return parseInt(v, 10); });
      D.intraday.scalpTrail = lies(idTl, D.intraday.scalpTrail, function (v) { return parseInt(v, 10); });
      D.intraday.scalpSL = idSS ? (idSS.value === 'auto' ? 'auto' : parseInt(idSS.value, 10)) : D.intraday.scalpSL;
      var idBl2 = document.getElementById('idBlackout');
      if (idBl2) D.intraday.blackout = idBl2.value;
      D.intraday.channel = liesHaken(idCh, D.intraday.channel);
      D.intraday.mtf = liesHaken(idMt, D.intraday.mtf);
      D.intraday.sizing = lies(idSz, D.intraday.sizing);
      D.intraday.screener = liesHaken(idScr, D.intraday.screener);
      var stS = setupFromMode(D.intraday.mode);
      D.intraday.setup = stS.setup; D.intraday.trigger = stS.trigger;
      D.intraday.exitStyle = (stS.setup === 'ausbruch' && stS.trigger === 'kreuzung')
        ? ((idEx && idEx.value) || stS.exitStyle) : stS.exitStyle;
      // Journal: Was hat sich von Hand geändert? Ohne Eintrag ist das Experiment-Journal
      // unvollständig und Konfig-Drift nicht mehr nachvollziehbar.
      var handDiff = [], handFelder = [];
      Object.keys(HAND_FELDER).forEach(function (fk) {
        if (String(vorherHand[fk]) !== String(D.intraday[fk])) { handDiff.push(HAND_FELDER[fk] + ' → ' + D.intraday[fk]); handFelder.push(fk); }
      });
      if (handDiff.length) {
        // Ab jetzt gehört dieses Feld dir: keine Automatik überschreibt es mehr,
        // bis du es unter der Strategie-Karte wieder freigibst.
        handSperren(handFelder);
        if (!D.tuneLog) D.tuneLog = [];
        D.tuneLog.unshift({ id: 'hand-' + Date.now(), at: Date.now(), quelle: 'hand', applied: handDiff,
          txt: 'Von Hand geändert (Formular) – diese Felder sind jetzt gegen die Automatik gesperrt.',
          konfigVorher: vorherHand, konfigNachher: JSON.parse(JSON.stringify(D.intraday)) });
        if (D.tuneLog.length > 60) D.tuneLog = D.tuneLog.slice(0, 60);
      }
      renderHandSperre();
      updateParamVis();
      renderKlartext();   // Setup-Wechsel sofort in der Klartext-Karte zeigen
      save();
      var idSt = document.getElementById('idStatus');
      if (idSt) idSt.textContent = D.intraday.enabled
        ? (window.Dash.marketOpen() ? 'Aktiv – nächster Scan in wenigen Minuten.' : 'Aktiv – wartet auf US-Handelsbeginn (15:30 Uhr Berlin).')
        : '';
      /* Kostenhuerde mitfuehren: sie haengt an Instrument, Profil und Haltedauer -
       * alle drei aendern sich genau hier. So kann die Anzeige nie veralten. */
      huerdeAnzeigen();
      regelKopfAnzeigen();   // dieselbe Quelle, derselbe Takt wie die Huerde
      regelnAnzeigen();
    }
    /* 'enabled' schreibt nur noch der eigene Schalter. Frueher schrieb idSave() den
     * Wert bei JEDEM Feld-Change zurueck - damit konnte der Ein/Aus-Zustand aus dem
     * Strategien-Tab still ueberschrieben werden (UI-Audit 21.08.2026). */
    if (idE) idE.addEventListener('change', function () { D.intraday.enabled = idE.checked; idSave(); if (D.intraday.enabled) intradayScan(); });
    /* Sechs Felder des HEUTIGEN Systems hingen hier nie drin - Instrument, Pool,
     * Kapitulations-Zusatz, Regime-Zuteilung, Risikostufe und Krypto-Handel wurden
     * nur mitgespeichert, wenn zufaellig ein anderes Feld geaendert wurde. Und ein
     * einziges fehlendes Element liess frueher die ganze Schleife werfen: danach
     * bekam KEIN Intraday-Feld mehr einen Listener, das Formular sah heil aus und
     * speicherte still nichts (UI-Audit 21.08.2026). Darum filter(Boolean). */
    [idP, idC, idI, idPr, idF, idL, idLn, idTr, idW, idH, idTl, idSS, idCh, idMt, idSz, idScr]
      .concat(['idBlackout', 'idInstrument', 'idPool', 'idKapiZusatz', 'idRegime', 'idMaxStufe', 'idKryptoHandeln']
        .map(function (id) { return document.getElementById(id); }))
      .filter(Boolean)
      .forEach(function (el) { el.addEventListener('change', idSave); });
    var scrBtn = document.getElementById('screenBtn');
    if (scrBtn) scrBtn.addEventListener('click', function () { runScreener(true); });
    // Datenquellen-Diagnose (klaert die Voraussetzung fuers Auffuellen)
    var qBtn = document.getElementById('quelleTestBtn');
    if (qBtn) qBtn.addEventListener('click', function () {
      // Beide schreiben in dieselbe Statusfläche und fragen dieselbe API - gleichzeitig
      // wuerden sie sich ueberschreiben und die Drosselgefahr genau waehrend der Messung erhoehen.
      var andere = document.getElementById('massenBtn');
      qBtn.disabled = true; if (andere) andere.disabled = true;
      datenquelleTest(universe()[0] || 'AAPL').catch(function (e) {
        var el = document.getElementById('massenStatus');
        if (el) el.textContent = 'Prüfung abgebrochen: ' + ((e && e.message) || e);
      }).then(function () { qBtn.disabled = false; if (andere) andere.disabled = false; });
    });
    // Massen-Backfill (Kursarchiv in einem Rutsch vertiefen)
    var mBtn = document.getElementById('massenBtn');
    if (mBtn) mBtn.addEventListener('click', function () {
      if (qBtn) qBtn.disabled = true;
      massenBackfill({ tage: 90 }).catch(function () { }).then(function () { if (qBtn) qBtn.disabled = false; });
    });
    var m1 = document.getElementById('massen1mBtn');
    if (m1) m1.addEventListener('click', function () {
      if (qBtn) qBtn.disabled = true;
      // Nur 1m: der einzige Zeitrahmen mit echter Luecke. 15m/5m stehen bereits bei ~85 Tagen.
      massenBackfill({ tage: 90, ivs: [{ iv: '1m', barMin: 1 }] })
        .catch(function () { }).then(function () { if (qBtn) qBtn.disabled = false; });
    });
    var mStop = document.getElementById('massenStopBtn');
    if (mStop) mStop.addEventListener('click', function () { massenAbbrechen(); });
    // Trendwechsel-Beobachtung (Felix #33/#35)
    var wBtn = document.getElementById('wendeBtn');
    if (wBtn) wBtn.addEventListener('click', function () { wendePruefen(true); });
    ['wendeIv', 'wendeS', 'wendeF'].forEach(function (id) {
      var e2 = document.getElementById(id);
      if (e2) e2.addEventListener('change', function () { wendePruefen(true); });
    });
    renderScreen();
    renderHandSperre();
    window.__syncSetupUI = syncSetupUI;
    syncSetupUI();
    updateParamVis();
    window.__updateParamVis = updateParamVis;
    // (v8) Die Messung startet nur noch der Autopilot – Knopf oder Nacht-Takt.
    renderCentral();

    /* Autopilot verkabeln */
    (function () {
      var a = autoOptCfg();
      var pOn = document.getElementById('pilotOn'), pBtn = document.getElementById('pilotBtn');
      if (!pOn) return;
      pOn.checked = a.on !== false;
      pOn.addEventListener('change', function () { a.on = pOn.checked; save(); renderPilot(); renderKlartext(); });
      pBtn.addEventListener('click', function () { pilotMessen(true); });
      renderPilot();
    })();
    // Takt: alle 5 Min. Bei geschlossener Börse wird Vorgemerktes angewendet und – höchstens
    // einmal je ~20 h – die Nacht-Messung gestartet. So läuft sie genau einmal pro Nacht,
    // die Rechenlast bleibt außerhalb der Handelszeit, und Neustarts überstehen den Takt
    // (lastMess liegt im Store, nicht im Speicher).
    // Herzschlag: solange gemessen wird, Kopfzeile alle 5 s auffrischen (seit/letzte Aktivität)
    setInterval(function () { if (pilotRunning) renderPilot(); }, 5000);
    setInterval(function () {
      var a = autoOptCfg();
      // Wächter: Eine Messung, die nach 30 Minuten nicht zurück ist, gilt als hängend.
      // Der Zustand wird freigegeben, damit Nächte nicht verloren gehen; der Vorfall
      // steht sichtbar im Protokoll und im Status.
      // Hängend heißt: KEINE Aktivität mehr - nicht: dauert lange. Eine gesunde Messung
      // schreibt ständig ins Protokoll; mit wachsendem Archiv darf sie auch mal 40 Minuten
      // brauchen. Abbruch erst bei 12 Minuten Funkstille oder 90 Minuten Gesamtdauer.
      // Waechter deckt Messung UND Tiefensuche ab. Ohne den zweiten Fall wuerde eine
      // haengende Tiefensuche (tiefRunning bleibt true) JEDE kuenftige Messung blockieren -
      // die Messung steigt bei laufender Tiefensuche bewusst frueh aus.
      [['Messung', pilotRunning, pilotStartAt], ['Tiefensuche', tiefRunning, tiefStartAt]].forEach(function (w9) {
        if (!w9[1] || !w9[2]) return;
        var letzteAktW = pilotLog.length ? pilotLog[pilotLog.length - 1][0] : w9[2];
        var funkstille = Date.now() - letzteAktW > 12 * 60000;
        var ueberlang = Date.now() - w9[2] > 90 * 60000;
        if (!funkstille && !ueberlang) return;
        if (w9[0] === 'Messung') { pilotRunning = false; pilotPhase = ''; } else { tiefRunning = false; }
        a.lastCheck = { at: Date.now(), ok: false, txt: 'Wächter-Abbruch (' + w9[0] + '): ' + (funkstille ? '12 Minuten ohne Aktivität' : 'lief über 90 Minuten') + '. Nächster Versuch beim nächsten Takt.' };
        pilotLogAdd('WÄCHTER: ' + w9[0] + ' abgebrochen (' + (funkstille ? 'Funkstille' : 'Überlänge') + ') und Zustand freigegeben.');
        save(); renderPilot();
      });
      if (window.Dash.marketOpen()) return;
      pilotAnwenden();
      if (a.on === false || pilotRunning || centralRunning || jobRunning || tiefRunning) return;
      if (Date.now() - (a.lastMess || 0) >= 20 * 3600000) { pilotMessen(false); return; }
      // Leerlaufstunden nutzen: Messung fuer diesen Daten-Tag ist erledigt, bis zur
      // Oeffnung ist reichlich Zeit -> Tiefensuche (hoechstens alle 6 h, rein aus dem Archiv)
      if (minutenBisOeffnung() > 120 && Date.now() - (a.lastTief || 0) > 6 * 3600000) tiefensuche();
    }, 5 * 60000);
    // Beim Start: Vorgemerktes ggf. sofort einspielen (z. B. App war über Nacht aus)
    setTimeout(function () { if (!window.Dash.marketOpen()) pilotAnwenden(); }, 30000);

    /* Regime-Automatik verkabeln */
    (function () {
      var rOn = document.getElementById('aoRegime'), rBtn = document.getElementById('regimeBtn');
      if (!rOn) return;
      rOn.checked = autoOptCfg().regime !== false;
      rOn.addEventListener('change', function () { autoOptCfg().regime = rOn.checked; save(); renderRegime(); });
      rBtn.addEventListener('click', function () { runRegime(true); });
      renderRegime();
    })();

    // Takt: kurz nach Handelsbeginn und danach stündlich, solange die Börse offen ist
    setInterval(function () {
      var a = autoOptCfg();
      if (a.regime === false || regimeRunning) return;
      if (!window.Dash.marketOpen()) return;
      if (Date.now() - (a.lastRegime || 0) < (a.regimeMin || 60) * 60000) return;
      a.lastRegime = Date.now(); // vor dem Start setzen; bei Abbruch gibt runRegime den Slot zurück
      runRegime(false).then(function (lief) { if (lief === false) a.lastRegime = 0; });
    }, 60000);
    var idAt = document.getElementById('idAutoTune');
    idAt.checked = D.intraday.autoTune !== false;
    idAt.addEventListener('change', function () { D.intraday.autoTune = idAt.checked; save(); });

    /* Krypto-Sammler: an/aus plus Bestandsanzeige. Ein Hintergrund-Netzwerkjob ohne
       Aus-Knopf wäre schlechter Stil – und man soll sehen, ob er etwas bringt. */
    var kEl2 = document.getElementById('idKrypto');
    if (kEl2) {
      kEl2.checked = D.kryptoSammeln !== false;
      kEl2.addEventListener('change', function () { D.kryptoSammeln = kEl2.checked; save(); zeigeKryptoStand(); });
    }
    /* Vorwärtstest: Wer den Handel abschaltet, soll die Beweisaufnahme behalten.
       Früher hing beides am selben Schalter – und nach Monaten Pause stand man
       wieder ohne Daten da. */
    var sIm = document.getElementById('idSchattenImmer');
    if (sIm) {
      sIm.checked = D.intraday.schattenImmer !== false;
      sIm.addEventListener('change', function () {
        D.intraday.schattenImmer = sIm.checked; save();
        var el2 = document.getElementById('idStatus');
        if (el2 && !D.intraday.enabled) {
          el2.textContent = sIm.checked
            ? 'Handel aus – Signale werden aber weiter aufgezeichnet (Vorwärtstest).'
            : 'Handel aus, keine Aufzeichnung. Es entstehen keine neuen Messdaten.';
        }
      });
    }
    zeigeKryptoStand();
    setInterval(zeigeKryptoStand, 5 * 60000);
    renderTune();
    setTimeout(checkRemoteRec, 8000);
    setInterval(checkRemoteRec, 10 * 60000);

    // Benachrichtigungen
    var nE = document.getElementById('notifyEnabled');
    nE.checked = D.notify !== false;
    nE.addEventListener('change', function () { D.notify = nE.checked; save(); });
    if (D.intraday.enabled) {
      document.getElementById('idStatus').textContent = window.Dash.marketOpen() ? 'Aktiv.' : 'Aktiv – wartet auf US-Handelsbeginn (15:30 Uhr Berlin).';
    } else if (D.intraday.schattenImmer !== false) {
      // Ohne diese Zeile sieht der abgeschaltete Handel aus wie „nichts passiert“,
      // obwohl im Hintergrund der Vorwärtstest läuft.
      document.getElementById('idStatus').textContent = window.Dash.marketOpen()
        ? 'Handel aus – Signale werden aufgezeichnet (Vorwärtstest, kein Kapitaleinsatz).'
        : 'Handel aus – Aufzeichnung wartet auf US-Handelsbeginn (15:30 Uhr Berlin).';
    }
    // Intraday-Scheduler: Scan-Takt je nach Modus (Scalping 90 s, Ausbrüche 5 Min)
    setInterval(function () {
      // Auch ohne Handel scannen, solange aufgezeichnet werden soll – sonst liefe der
      // Vorwärtstest nur, wenn ohnehin Kapital im Feuer steht, und wäre damit wertlos.
      var lohnt = D.intraday.enabled || D.intraday.schattenImmer !== false;
      // Krypto-Handel kennt keinen Boersenschluss - der Takt laeuft dann durch.
      /* Bei gestoerter Quelle Takt vervierfachen: stures Weiterhaemmern verlaengert
       * ein Rate-Limit nur. Der gestreckte Takt prueft weiter (Erholung erkennen!),
       * aber schont die Quelle. */
      var taktMs = modeParams().scanMs * ((HEALTH.stoerungScans || 0) >= 2 ? 4 : 1);
      if (lohnt && (window.Dash.marketOpen() || D.intraday.kryptoHandeln) && Date.now() - D.intradayLastScan >= taktMs) intradayScan();
    }, 30000);

    /* Krypto-Sammler. Ausdruecklich OHNE marketOpen()-Pruefung - waehrend die US-Boerse
       zu ist, hat der Sammler Yahoos Anfragebudget fuer sich allein, und Krypto handelt
       ohnehin durchgehend. Reihum durch die Intervalle, alle 20 Minuten eines:
       15m und 5m oft (dort ist das Fenster mit 60 Tagen am knappsten), 60m selten
       (730 Tage Rueckblick, da eilt nichts), 1m am haeufigsten (nur 7 Tage Fenster -
       was aelter ist, holt niemand je wieder). */
    var kryptoTakt = 0;
    setInterval(function () {
      if (D.kryptoSammeln === false) return;
      var reihe = ['1m', '15m', '1m', '5m', '1m', '15m', '1m', '60m'];
      kryptoSammeln(reihe[kryptoTakt % reihe.length]);
      kryptoTakt++;
    }, 20 * 60000);
    setTimeout(function () { if (D.kryptoSammeln !== false) kryptoSammeln('1m'); }, 25000);

    /* ===== Spannen-Messung (22.08.2026) =====
     * Capital.com liefert Geld- UND Briefkurs. Deren Abstand IST die Kostenhuerde
     * einer Runde: gekauft wird zum Brief, verkauft zum Geld - wer ein- und
     * aussteigt, zahlt die Spanne einmal. Damit ist die Zahl, an der fast jede
     * Studie haengt (Annahme 0,10 %), in EINER Handelssitzung messbar statt in
     * Wochen: die Fill-Messung braucht ~20 abgeschlossene Runden, diese hier
     * braucht nur Kurse.
     * Schonend: sechs Werte je Takt im Wechsel, nur bei offener Boerse. */
    var spannenTakt = 0;
    async function spannenProbe() {
      if (!(window.CapAPI && window.CapAPI.enabled() && window.CapAPI.quote)) return;
      if (!(window.Dash && window.Dash.marketOpen())) return;
      var syms = universe();
      if (!syms.length) return;
      var teil = [];
      for (var i = 0; i < 6 && i < syms.length; i++) teil.push(syms[(spannenTakt * 6 + i) % syms.length]);
      spannenTakt++;
      if (!D.spannen) D.spannen = { proben: [], seit: Date.now() };
      for (var j = 0; j < teil.length; j++) {
        try {
          var q = await window.CapAPI.quote(teil[j]);
          if (q && q.spreadPct != null && isFinite(q.spreadPct) && q.spreadPct >= 0 && q.spreadPct < 0.2) {
            D.spannen.proben.unshift({ at: Date.now(), sym: teil[j], spreadPct: Math.round(q.spreadPct * 1e6) / 1e6 });
          }
        } catch (eQ) { /* eine Absage kippt die Messung nicht */ }
      }
      /* Der Ringpuffer haelt rund 16 Handelstage. Bevor der aelteste Tag lautlos
       * herausfaellt, wird er als Median je Wert festgeschrieben - 15 Zahlen am Tag,
       * die bleiben. Ohne das waere weder "haelt die Annahme ueber Wochen?" noch
       * "ist die enge Haelfte dauerhaft enger?" jemals zu beantworten. */
      spannenTagFestschreiben();
      if (D.spannen.proben.length > 4000) D.spannen.proben = D.spannen.proben.slice(0, 4000);
      save();
    }
    /** Je Tag und Wert einen Median festhalten. Laeuft nach jeder Probenrunde; der
     *  laufende Tag wird dabei ueberschrieben, fertige Tage bleiben unberuehrt. */
    function spannenTagFestschreiben() {
      var sp = D && D.spannen;
      if (!sp || !sp.proben || !sp.proben.length) return;
      if (!sp.tage) sp.tage = {};
      var heute = new Date().toISOString().slice(0, 10);
      var jeSym = {};
      for (var i = 0; i < sp.proben.length; i++) {
        var p = sp.proben[i];
        if (new Date(p.at).toISOString().slice(0, 10) !== heute) continue;
        (jeSym[p.sym] = jeSym[p.sym] || []).push(p.spreadPct);
      }
      var tag = {};
      Object.keys(jeSym).forEach(function (s) {
        var a = jeSym[s].sort(function (x, y) { return x - y; });
        tag[s] = { n: a.length, med: Math.round(a[Math.floor(a.length / 2)] * 1e6) / 1e6 };
      });
      if (Object.keys(tag).length) sp.tage[heute] = tag;
      /* Sehr grosszuegig aufraeumen: 15 Werte je Tag sind wenige hundert Bytes.
       * Wer hier zu frueh loescht, loescht genau die Historie, fuer die das da ist. */
      var alt = Date.now() - 5 * 365 * 86400000;
      Object.keys(sp.tage).forEach(function (k) {
        if (new Date(k + 'T00:00:00Z').getTime() < alt) delete sp.tage[k];
      });
    }

    /* Das Festschreiben darf NICHT an derselben Sperre haengen wie das Sammeln.
     * spannenProbe kehrt bei geschlossener Boerse sofort um - die Proben vom Vortag
     * blieben deshalb bis zur naechsten Boersenoeffnung unbewahrt im Ringpuffer.
     * Der Zweck der Tagesbilanz war gerade, dass nichts verlorengeht. */
    setTimeout(function () { try { spannenTagFestschreiben(); save(); } catch (e) { } }, 5000);
    setInterval(function () { try { spannenTagFestschreiben(); } catch (e) { } }, 30 * 60000);

    setInterval(spannenProbe, 8 * 60000);
    setTimeout(spannenProbe, 40000);
  }

  /* Diese drei Zeilen liefen frueher ungeprueft und standen VOR init(): fehlte einer
   * der Knoepfe, blieb der gesamte Depot-Reiter tot - ohne sichtbare Fehlermeldung. */
  var rjBtn = document.getElementById('runJobBtn');
  if (rjBtn) rjBtn.addEventListener('click', function () { runJob(true); });
  var btBtn = document.getElementById('btRunBtn');
  if (btBtn) btBtn.addEventListener('click', runBacktest);
  var drBtn = document.getElementById('depotResetBtn');
  if (drBtn) drBtn.addEventListener('click', function () {
    // Ein Klick löschte bisher unwiderruflich Positionen, Trade-Protokoll, Trefferquoten,
    // Experiment-Journal und Strategie-Farm. Dafür ist eine Rückfrage angemessen.
    var offen = D && D.positions ? D.positions.length : 0;
    var geschlossen = D && D.trades ? D.trades.filter(function (t) { return t.status === 'closed'; }).length : 0;
    var mfT = (D && D.mfBuch && D.mfBuch.trades ? D.mfBuch.trades.length : 0) +
              (D && D.driftBuch && D.driftBuch.trades ? D.driftBuch.trades.length : 0);
    if (!window.confirm('Depot wirklich zurücksetzen?\n\nGelöscht werden: ' + offen + ' offene Position(en), ' +
      geschlossen + ' geschlossene Trades, alle Trefferquoten, das Experiment-Journal und die Strategie-Farm.\n' +
      'Ebenfalls neu angelegt werden die beiden Mittelfrist-Bücher (Momentum und Ergebnis-Drift, zusammen ' +
      mfT + ' Trades).\n\nAlle Bücher starten danach mit ' + U.nf0.format(START_CAPITAL) + ' $.\n\n' +
      'Vorher wird eine Sicherung unter „depot_vor_reset" abgelegt – ein Reset ist damit umkehrbar.')) return;
    /* Sicherung VOR dem Loeschen. Der Knopf schrieb frueher selbst "Das laesst sich
     * nicht rueckgaengig machen" - das war wahr und unnoetig. Eine Kopie kostet nichts. */
    try { window.api.storeSet('depot_vor_reset', D); } catch (eSich) { /* Sicherung darf den Reset nicht verhindern */ }
    D = defaultDepot();
    weightsBuilt = false;
    save();
    // Formularfelder auf die frischen Werte stellen – sonst schreibt das nächste
    // change-Event die alten UI-Werte zurück ins zurückgesetzte Depot.
    try { syncStrategyUI(); } catch (e0) { /* UI-Sync optional */ }
    render();
    var stEl = document.getElementById('setStatus');
    if (stEl) stEl.textContent = 'Alle Bücher zurückgesetzt (' + U.nf0.format(START_CAPITAL) + ' $ je Buch). ' +
      'Der vorherige Stand liegt als „depot_vor_reset" im Datenordner.';
  });
  document.addEventListener('quotes-updated', function () {
    var tD = document.getElementById('tab-depot');
    if (D && tD && tD.classList.contains('active')) render();
  });
  document.addEventListener('tab-changed', function (e) {
    // Der Reiterwechsel heilt den Formularstand: Ein/Aus laesst sich auch im
    // Strategien-Tab umlegen, dann muessen die Schalter hier nachziehen.
    if (e.detail === 'depot') { render(); try { syncStrategyUI(); } catch (e2) { /* UI-Sync optional */ } }
  });

  /* init() verkabelt nebenbei die Unter-Navigation ALLER Reiter. Wirft sie, blieb die
   * halbe App vorher stumm bedienbar-aussehend, aber tot - und niemand erfuhr davon.
   * Jetzt geht der Fehler ins Warnband und in den Fehlermitschnitt. */
  init().catch(function (e) {
    var grund = (e && e.message) ? e.message : String(e);
    try {
      warnbandSetzen('start', 'Das Depot konnte nicht vollständig starten (' + U.esc(grund) +
        '). Teile der Oberfläche reagieren nicht — ein Neustart der App hilft meist.');
    } catch (e2) { /* Warnband selbst nicht erreichbar */ }
    /* Der globale unhandledrejection-Zuhoerer greift hier nicht mehr, weil wir den
     * Fehler gerade abgefangen haben - also selbst in den Mitschnitt legen. */
    try { if (window.Bugs) window.Bugs.merke('start', 'init(): ' + grund, 'depot.js', null, e && e.stack); }
    catch (e3) { /* Mitschnitt optional */ }
    if (window.console) console.error('depot init', e);
  });
})();
