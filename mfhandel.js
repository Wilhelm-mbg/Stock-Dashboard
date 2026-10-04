'use strict';
/* ================= Mittelfrist-Depot: die Handelslogik =================
 *
 * Warum es dieses Modul gibt: Die zwei am besten belegten Effekte der App — Momentum
 * (+5,4 Pp p. a. außerhalb der Stichprobe) und Ergebnis-Drift (+10,4 % p. a.
 * marktneutral, t = 3,04) — waren bis zum 21.08.2026 reine Rechenblätter. Kein Depot
 * führte ihre Positionen; die Schalter im Strategien-Tab schalteten nichts. Das
 * Intraday-Segment mit der schwächsten Evidenz hatte die ganze Ausführungsmaschinerie,
 * die Mittelfrist mit der stärksten hatte keine.
 *
 * Hier steht die reine Logik: Rangfolge bilden, Umschichtung planen, Orders ausführen,
 * Buch bewerten. Alles ohne Fenster und ohne Netz, damit es in Node prüfbar ist —
 * untestete Inline-Logik war in diesem Projekt wiederholt die Fehlerquelle.
 * Die Verdrahtung (Laden, Zeitgeber, Anzeige) liegt in mfdepot.js.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {

  /* Konfiguration des Buchs: Fenster aus momentum.js (STANDARD), Korbregel aus
   * liquide.js (KORB). Beides sind Wurzelmodule, die das Buch WIRKLICH liest - und
   * test-v6.js Block 34 haelt genau diese Zahlen gegen die Rohdaten der Studie
   * (Live = Messung als Test-Invariante, wiki/messmethodik.md Punkt 11). */
  var Mo = (typeof module !== 'undefined' && module.exports) ? require('./momentum.js') : root.Momentum;
  var Li = (typeof module !== 'undefined' && module.exports) ? require('./liquide.js') : root.Liquide;

  /** Die Konfiguration, mit der das Buch rechnet - als Kopie, damit Anzeige und
   *  Journal dieselben Zahlen nennen wie die Rechnung. */
  function buchKonfig() {
    return { rueckblick: Mo.STANDARD.rueckblick, luecke: Mo.STANDARD.luecke, halten: Mo.STANDARD.halten,
      anteil: Mo.STANDARD.anteil, mindestWerte: Li.KORB.mindestWerte,
      umsatzMin: Li.KORB.umsatzMin, umsatzFenster: Li.KORB.fenster,
      /* Regel K gegen Kleinstpositionen (Auftrag Nr. 85, 04.10.2026): Anteil am Platzwert
       * (Depotwert / Zielzahl), unter dem ein Kauf nicht ausgefuehrt wird (K1) und ein Bestand
       * nicht als gehalten gilt (K2). EINGESCHALTET seit Auftrag Nr. 87 (04.10.2026) mit 0,05 -
       * die Nachrechnung (studien/momentum-korb-kleinst-2026-10-04/) ist abgenommen. 0 hiesse
       * AUS; so wurde bis Nr. 85 gemessen. mfdepot.js liest das Feld und reicht es als
       * { kleinstAnteil } an planeUmschichtung und fuehreAus - die Funktionen selbst behalten
       * ihre Vorgabe AUS (wer sie ohne opts ruft, rechnet wie vor Nr. 85). */
      kleinstAnteil: 0.05 };
  }

  /** 12-1-Momentum-Rangfolge auf ROHEN Serien — jede Serie mit ihren eigenen
   *  Handelstagen, bewusst ohne gemeinsame Zeitachse: Für ein Live-Ranking zählt der
   *  letzte Stand jedes Werts, nicht ein historischer Schnittpunkt.
   *  rohMap: {SYM: [[t, kurs, stueck], …]}   opts: {rueckblick, luecke, anteil, minWerte,
   *  umsatzMin, umsatzFenster, maxAlterMs, nowMs} - ohne opts gilt die gemessene Konfiguration.
   *  Korbfilter VOR der Rangbildung (Studie 02.09.2026, liquide Fassung): nur Werte mit
   *  Median-Tagesumsatz >= umsatzMin ueber umsatzFenster Balken bis zum Stichtag ranken mit.
   *  Rückgabe: {ziel: [sym…], rangfolge: [{sym, staerke, umsatz}], uebersprungen: [sym…],
   *             verworfen: [{sym, grund}],
   *             korb: {zulaessig, geprueft, ohneUmsatz, unterSchwelle, umsatzMin, fenster}} */
  function momentumZiel(rohMap, opts) {
    opts = opts || {};
    var K = buchKonfig();
    var rueck = opts.rueckblick || K.rueckblick, luecke = opts.luecke || K.luecke;
    var anteil = opts.anteil || K.anteil, minWerte = opts.minWerte || K.mindestWerte;
    var umsatzMin = opts.umsatzMin == null ? K.umsatzMin : opts.umsatzMin;
    var fenster = opts.umsatzFenster || K.umsatzFenster;
    var maxAlter = opts.maxAlterMs || 7 * 86400000;
    var nowMs = opts.nowMs || Date.now();
    var punkte = [], uebersprungen = [], verworfen = [];
    var korb = { zulaessig: 0, geprueft: 0, ohneUmsatz: 0, unterSchwelle: 0, umsatzMin: umsatzMin, fenster: fenster };
    /** Jeder Ausschluss wird mit Grund festgehalten, nicht nur gezählt — die Anzeige
     *  soll erklären können, warum ein Wert nicht mitrankt. */
    function raus(sym, grund) { uebersprungen.push(sym); verworfen.push({ sym: sym, grund: grund }); }
    Object.keys(rohMap).forEach(function (sym) {
      var r = rohMap[sym];
      korb.geprueft++;
      /* Mindestlaenge EXAKT wie periode() im Studienwerkzeug: von = i - (rueck + luecke)
       * muss >= 0 sein. Vorher stand hier eine Zugabe von 5 Tagen - eine Reihe mit 253
       * bis 256 Tagen rankte live nicht, in der Messung schon. */
      if (!r || r.length < rueck + luecke + 1) { raus(sym, 'zu kurze Kursreihe (' + ((r && r.length) || 0) + ' von ' + (rueck + luecke + 1) + ' Tagen)'); return; }
      // Veraltete Serien fliegen raus, statt mit einem alten Kurs mitzuranken —
      // ein eingefrorener Wert sähe im fallenden Markt fälschlich „stark“ aus.
      if (nowMs - r[r.length - 1][0] > maxAlter) {
        raus(sym, 'Kurse veraltet (' + Math.round((nowMs - r[r.length - 1][0]) / 86400000) + ' Tage alt)'); return;
      }
      var i = r.length - 1;
      /* Fenster EXAKT wie die validierte Staerke in momentum.js (von = bis - rueck):
       * rueck Tage, endend luecke Tage vor heute = 231 Tage. Vorher stand hier
       * r[i - rueck], also nur rueck - luecke = 210 Tage - das Live-Buch handelte ein
       * anderes Momentum als das belegte (Audit 22.08.2026). */
      var a = r[i - luecke - rueck][1], m2 = r[i - luecke][1], p0 = r[i][1];
      if (!(a > 0) || !(m2 > 0) || !(p0 > 0)) { raus(sym, 'Stärke nicht berechenbar (Kurslücke)'); return; }
      /* Liquiditaet VOR der Rangbildung - dieselbe Rechenregel wie die Studie
       * (liquide.js). Der Grund unterscheidet "unter der Schwelle" von "keine
       * Stueckzahlen": Letzteres ist eine Luecke der Daten, kein Befund ueber den Wert. */
      var z = Li.zulaessig(r, i, { umsatzMin: umsatzMin, fenster: fenster });
      if (!z.ok) {
        if (umsatzMin > 0 && !Li.hatUmsatz(r, i, fenster)) korb.ohneUmsatz++; else korb.unterSchwelle++;
        raus(sym, z.grund); return;
      }
      var st = m2 / a - 1;
      if (isFinite(st)) { korb.zulaessig++; punkte.push({ sym: sym, staerke: st, umsatz: z.umsatz }); }
      else raus(sym, 'Stärke nicht berechenbar (Kurslücke)');
    });
    if (punkte.length < minWerte) return { ziel: [], rangfolge: [], uebersprungen: uebersprungen, verworfen: verworfen, korb: korb, zuWenig: true };
    punkte.sort(function (a, b) { return b.staerke - a.staerke; });
    var n = Math.max(5, Math.round(punkte.length * anteil));
    return { ziel: punkte.slice(0, n).map(function (p) { return p.sym; }), rangfolge: punkte,
      uebersprungen: uebersprungen, verworfen: verworfen, korb: korb };
  }

  /** Umschichtung planen: Soll-Ist-Abgleich. Gleichgewichtung über die Zielliste.
   *  buch: {cash, positionen: [{sym, stueck, einstand}]}   preise: {sym: kurs}
   *  Rückgabe: {verkaufen: [{sym, stueck, kurs}], kaufen: [{sym, stueck, kurs, budget}],
   *             halten: [sym…], fehltKurs: [sym…]}
   *  opts.kleinstAnteil > 0 schaltet Regel K2 ein (Auftrag Nr. 85; Vorgabe AUS - ohne opts
   *  oder mit 0 rechnet die Funktion wie zuvor): eine gehaltene Position MIT Kurs, deren
   *  Wert unter kleinstAnteil × (Depotwert / Zielzahl) liegt, ist ein Kleinstbestand. Sie
   *  wird ganz verkauft; ist ihr Wert ein Ziel, wird er wie ein nicht gehaltenes Ziel neu
   *  geplant - an seiner Stelle der Zielliste. Der Depotwert zaehlt sie mit, wie bisher;
   *  eine Position ohne Kurs bleibt, wie sie ist. Die Rückgabe traegt dann zusaetzlich
   *  kleinst: [sym…]. Grund: fuehreAus verkleinert einen Kauf, wenn das Bargeld nicht
   *  reicht, bis auf 0,0001 Stück - und ein solcher Rest galt hier als volle Position, der
   *  Platz blieb leer, solange der Wert Ziel war (wiki/fehlerformen.md, 04.10.2026). */
  function planeUmschichtung(ziel, buch, preise, opts) {
    var kl = opts && opts.kleinstAnteil > 0 ? opts.kleinstAnteil : 0;
    var zielSet = {};
    ziel.forEach(function (s) { zielSet[s] = true; });
    var verkaufen = [], halten = [], fehltKurs = [], kleinst = [], istKleinst = {};
    var wert = buch.cash;
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (k > 0) wert += p.stueck * k;
    });
    // Gleichgewichtung: jedes Ziel bekommt wert/zielAnzahl. Bestehende Positionen werden
    // NICHT nachjustiert — jeder Trade kostet, und die Messung lief ohne Feinjustierung.
    var budget = ziel.length ? wert / ziel.length : 0;
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (!(k > 0)) { fehltKurs.push(p.sym); halten.push(p.sym); return; }   // ohne Kurs kein Handel
      if (kl > 0 && p.stueck * k < kl * budget) {                             // K2: Kleinstbestand
        kleinst.push(p.sym); istKleinst[p.sym] = true;
        verkaufen.push({ sym: p.sym, stueck: p.stueck, kurs: k });
        return;
      }
      if (zielSet[p.sym]) halten.push(p.sym);
      else verkaufen.push({ sym: p.sym, stueck: p.stueck, kurs: k });
    });
    var neuKaufen = ziel.filter(function (s) {
      return istKleinst[s] === true || !(buch.positionen || []).some(function (p) { return p.sym === s; });
    }).filter(function (s) { if (!(preise[s] > 0)) { fehltKurs.push(s); return false; } return true; });
    var kaufen = neuKaufen.map(function (s) {
      return { sym: s, kurs: preise[s], budget: budget, stueck: budget > 0 ? Math.round(budget / preise[s] * 10000) / 10000 : 0 };
    });
    var plan = { verkaufen: verkaufen, kaufen: kaufen, halten: halten, fehltKurs: fehltKurs, depotwert: wert };
    if (kl > 0) plan.kleinst = kleinst;
    return plan;
  }

  /** Orders ausführen — mutiert das Buch, schreibt Trades. kostenBp je Seite.
   *  Bruchstücke sind erlaubt (Simulation/CFD). Rückgabe: Anzahl der Ausführungen.
   *  opts.kleinstAnteil > 0 schaltet Regel K1 ein (Auftrag Nr. 85; Vorgabe AUS): liegt der
   *  Wert eines Kaufs NACH dem Verkleinern unter kleinstAnteil × o.budget, wird er nicht
   *  ausgeführt - keine Position, kein Trade, o.stueck = 0, das Bargeld bleibt. Ein Kauf
   *  ohne positives o.budget (ein anderer Aufrufer) läuft wie zuvor. */
  function fuehreAus(buch, plan, nowMs, kostenBp, opts) {
    var k = (kostenBp == null ? 20 : kostenBp) / 10000;
    var kl = opts && opts.kleinstAnteil > 0 ? opts.kleinstAnteil : 0;
    var n = 0;
    if (!buch.trades) buch.trades = [];
    plan.verkaufen.forEach(function (o) {
      var idx = buch.positionen.findIndex(function (p) { return p.sym === o.sym; });
      if (idx < 0) return;
      var p = buch.positionen[idx];
      var erloes = p.stueck * o.kurs * (1 - k);
      buch.cash += erloes;
      buch.trades.push({ t: nowMs, sym: o.sym, art: 'verkauf', stueck: p.stueck, kurs: o.kurs,
        pnl: Math.round((erloes - p.stueck * p.einstand) * 100) / 100 });
      buch.positionen.splice(idx, 1);
      n++;
    });
    plan.kaufen.forEach(function (o) {
      var kosten = o.stueck * o.kurs * (1 + k);
      if (!(o.stueck > 0) || kosten > buch.cash) {
        // Reicht das Bargeld nicht (Rundung, Kosten), wird die Order verkleinert statt
        // still verworfen — sonst hängt das Depot dauerhaft unter der Zielgewichtung.
        o.stueck = Math.max(0, Math.floor(buch.cash / (o.kurs * (1 + k)) * 10000) / 10000);
        kosten = o.stueck * o.kurs * (1 + k);
        if (!(o.stueck > 0)) return;
      }
      if (kl > 0 && o.budget > 0 && o.stueck * o.kurs < kl * o.budget) { o.stueck = 0; return; }   // K1: kein Kleinstkauf
      buch.cash -= kosten;
      buch.positionen.push({ sym: o.sym, stueck: o.stueck, einstand: o.kurs * (1 + k), seit: nowMs });
      buch.trades.push({ t: nowMs, sym: o.sym, art: 'kauf', stueck: o.stueck, kurs: o.kurs });
      n++;
    });
    if (buch.trades.length > 400) buch.trades = buch.trades.slice(-400);
    return n;
  }

  /** Buchwert zu aktuellen Kursen. Positionen ohne Kurs zählen zum Einstand —
   *  ehrlicher wäre null, aber ein Depotwert muss eine Zahl sein; das Feld
   *  ohneKurs macht die Unsicherheit sichtbar. */
  function bewerte(buch, preise) {
    var wert = buch.cash, ohneKurs = [];
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (k > 0) wert += p.stueck * k;
      else { wert += p.stueck * p.einstand; ohneKurs.push(p.sym); }
    });
    return { wert: Math.round(wert * 100) / 100, ohneKurs: ohneKurs };
  }

  /** Ist ein Rebalancing fällig? Gezählt wird in HANDELSTAGEN über die Marktreihe
   *  (SPY) — Kalendertage wären bei Feiertagen ungenau, und die Messung lief in
   *  Handelstagen (63 = ein Quartal). */
  function rebalanceFaellig(marktReihe, letztesT, halten) {
    if (!letztesT) return true;
    var tage = 0;
    for (var i = marktReihe.length - 1; i >= 0 && marktReihe[i][0] > letztesT; i--) tage++;
    return tage >= (halten || 63);
  }

  /** Drift-Buch abgleichen: fällige Positionen schließen, neue Signale eröffnen.
   *  heute: Ergebnis von Drift.heute() — {offen: [{sym, richtung, seitTagen, …}], faellig}
   *  Eröffnet werden nur JUNGE Signale (seitTagen <= maxAlterTage): Ein 40 Tage altes
   *  Signal hat den Großteil seiner 60-Tage-Wirkung hinter sich — spät einsteigen
   *  hieße, die Messung nicht mehr abzubilden.
   *  Shorts sind linear (CFD-Stil): Gewinn = Einstand − Kurs.
   *  Jedes erkannte, aber NICHT gehandelte Signal landet mit Grund in getan.verworfen —
   *  vorher verschwanden diese Fälle spurlos, und im Fenster stand „12 Signale offen“
   *  neben drei Positionen, ohne dass die Lücke irgendwo erklärt war.
   *  opts.nurPruefen: nichts anfassen, nur berichten, was das Buch täte (Automatik aus). */
  function driftAbgleich(buch, heute, preise, nowMs, opts) {
    opts = opts || {};
    // Im Prüf-Modus wird auf einer Kopie gerechnet: Die Anzeige soll auch bei
    // ausgeschalteter Automatik ehrlich sagen können, was fällig wäre — ohne zu handeln.
    var nurPruefen = !!opts.nurPruefen;
    if (nurPruefen) buch = JSON.parse(JSON.stringify(buch || {}));
    var kostenBp = opts.kostenBp == null ? 10 : opts.kostenBp;
    var k = kostenBp / 10000;
    var maxAlter = opts.maxAlterTage == null ? 5 : opts.maxAlterTage;
    var haltenTage = opts.haltenTage || 60;
    var budgetAnteil = opts.budgetAnteil || 0.05;    // je Position 5 % des Buchwerts
    if (!buch.trades) buch.trades = [];
    var getan = { geschlossen: 0, eroeffnet: 0, uebersprungen: [], verworfen: [], nurGeprueft: nurPruefen };
    function verwirf(sym, richtung, grund) { getan.verworfen.push({ sym: sym, richtung: richtung, grund: grund }); }

    // 1. Fällige schließen: Haltedauer erreicht (nach eigener Buchführung — die
    //    heute.faellig-Liste hilft, aber die eigene Uhr ist die Wahrheit des Buchs)
    for (var i = (buch.positionen || []).length - 1; i >= 0; i--) {
      var p = buch.positionen[i];
      var alterTage = (nowMs - p.seit) / 86400000 * (252 / 365);   // grob in Handelstage
      if (alterTage < haltenTage) continue;
      var kurs = preise[p.sym];
      if (!(kurs > 0)) {
        getan.uebersprungen.push(p.sym + ' (kein Kurs)');
        verwirf(p.sym, p.richtung, 'fällig, aber kein frischer Kurs – bleibt offen');
        continue;
      }
      if (nurPruefen) verwirf(p.sym, p.richtung, 'wäre fällig zum Schließen – Automatik aus');
      var wert = p.richtung > 0 ? p.stueck * kurs : p.stueck * (2 * p.einstand - kurs);
      var erloes = Math.max(0, wert) * (1 - k);
      buch.cash += erloes;
      buch.trades.push({ t: nowMs, sym: p.sym, art: p.richtung > 0 ? 'verkauf' : 'rueckkauf',
        stueck: p.stueck, kurs: kurs, pnl: Math.round((erloes - p.stueck * p.einstand) * 100) / 100 });
      buch.positionen.splice(i, 1);
      getan.geschlossen++;
    }

    // 2. Neue Signale eröffnen — je Termin genau einmal (Schlüssel sym+Richtung offen)
    var wert2 = bewerteDrift(buch, preise).wert;
    (heute && heute.offen || []).forEach(function (o) {
      var ri = o.richtung === 'kaufen' ? 1 : -1;
      if (o.seitTagen > maxAlter) {
        verwirf(o.sym, ri, 'Signal ist ' + o.seitTagen + ' Handelstage alt (Grenze ' + maxAlter + ') – Wirkung größtenteils vorbei');
        return;
      }
      var schonDa = (buch.positionen || []).some(function (p) { return p.sym === o.sym; });
      if (schonDa) { verwirf(o.sym, ri, 'schon im Buch – wird nicht doppelt eröffnet'); return; }
      var kurs = preise[o.sym];
      if (!(kurs > 0)) {
        getan.uebersprungen.push(o.sym + ' (kein Kurs)');
        verwirf(o.sym, ri, 'kein frischer Kurs – ohne Kurs kein Handel');
        return;
      }
      var budget = wert2 * budgetAnteil;
      if (budget > buch.cash) budget = buch.cash;
      var stueck = Math.floor(budget / (kurs * (1 + k)) * 10000) / 10000;
      if (!(stueck > 0)) { verwirf(o.sym, ri, 'Bargeld reicht nicht für eine Position'); return; }
      if (nurPruefen) verwirf(o.sym, ri, 'würde eröffnet – Automatik aus');
      buch.cash -= stueck * kurs * (1 + k);
      buch.positionen.push({ sym: o.sym, stueck: stueck, einstand: kurs * (1 + k),
        richtung: o.richtung === 'kaufen' ? 1 : -1, seit: nowMs, ueberraschung: o.ueberraschung });
      buch.trades.push({ t: nowMs, sym: o.sym, art: o.richtung === 'kaufen' ? 'kauf' : 'leerverkauf', stueck: stueck, kurs: kurs });
      getan.eroeffnet++;
    });
    if (buch.trades.length > 400) buch.trades = buch.trades.slice(-400);
    return getan;
  }

  /** Drift-Buchwert: Longs linear, Shorts linear invers (2·Einstand − Kurs). */
  function bewerteDrift(buch, preise) {
    var wert = buch.cash, ohneKurs = [];
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (!(k > 0)) { wert += p.stueck * p.einstand; ohneKurs.push(p.sym); return; }
      wert += p.richtung > 0 ? p.stueck * k : Math.max(0, p.stueck * (2 * p.einstand - k));
    });
    return { wert: Math.round(wert * 100) / 100, ohneKurs: ohneKurs };
  }

  /* ================= Kapitalmassnahmen: Splits und Ausschuettungen (Auftrag Nr. 87, 04.10.2026) =================
   *
   * Die Buecher kaufen und bewerten zum juengsten Kurs der Tagesreihe - das ist der wirklich
   * gehandelte Schluss. Zwei Dinge fehlten bis Nr. 87: (1) ein Split in einer gehaltenen
   * Position liess die Stueckzahl stehen, waehrend der Kurs im Verhaeltnis fiel - das Buch
   * zeigte einen Scheinverlust; (2) Ausschuettungen wurden nicht gutgeschrieben, waehrend der
   * Massstab (S&P 500) seit Nr. 81 mit Ausschuettungen rechnet.
   *
   * Die Ereignisse kommen aus demselben Tagesabruf wie die Kurse (kurse.js, Bestand
   * mf_ereignisse). Yahoo meldet die Ausschuettung in HEUTIGER Stueckelung und stempelt ein
   * Ereignis wie den Tagesbalken des Ex-Tags (beides am 04.10.2026 nachgesehen, kurse.js
   * ereignisseAus). Daraus folgen Reihenfolge und Grenzen unten. */
  var SPLIT_SPERRE_MS = 30 * 86400000;

  /** Splits und Ausschuettungen eines Buchs buchen - mutiert das Buch (Stueck, Einstand,
   *  Bargeld, Merker je Position). Rein: kein Netz, kein Fenster.
   *    buch        {cash, positionen: [{sym, stueck, einstand, seit, kursT, gebucht, richtung}]}
   *    ereignisse  {SYM: {div: [[tMs, betragJeStueck], …], split: [[tMs, zaehler, nenner], …]}}
   *    barZeit     {SYM: Zeitstempel des juengsten GESPEICHERTEN Tagesbalkens des Werts}
   *  Die Regeln (fest, Auftrag Nr. 87 §2):
   *  1. Beginn je Position: p.kursT - der Zeitstempel des Balkens, zu dessen Kurs gekauft
   *     wurde; fehlt er (Positionen von vor Nr. 87), gilt p.seit.
   *  2. Gebucht wird jedes Ereignis des Werts mit t > Beginn UND t <= barZeit[sym] (der
   *     gespeicherte Kurs enthaelt den Ex-Tag dann schon), das nicht in p.gebucht steht
   *     (Kennungen 'split:' + t, 'div:' + t). Erst alle Splits in zeitlicher Folge, dann
   *     die Ausschuettungen. Jedes Buch bucht fuer sich.
   *  3. Split z : n -> stueck × z / n, einstand × n / z, ungerundet; Kauf und Leerverkauf gleich.
   *  4. Ausschuettung b je Stueck -> Bargeld + stueck × b (Kauf) bzw. - stueck × b
   *     (Leerverkauf, richtung < 0); stueck ist die Stueckzahl NACH den Splits aus 3, weil b
   *     in heutiger Stueckelung steht.
   *  5. Sperre: ein zweiter Split desselben Werts im Abstand von hoechstens 30 Kalendertagen
   *     zu einem gebuchten wird NICHT gebucht, sondern gemeldet (gesperrt; neu = true beim
   *     ersten Mal, die Position merkt es sich in p.gemeldet).
   *  6. Ohne Ereignisse oder ohne barZeit fuer den Wert geschieht nichts; ein zweiter Aufruf
   *     mit denselben Daten bucht nichts.
   *  Rueckgabe: {buchungen: [{sym, art: 'split'|'div', t, am, kaufT, …}], gesperrt: [{sym, art, t, …, neu}]}.
   *  Die Buchungen stehen NICHT in buch.trades (dort steht nur Handel), sondern in
   *  buch.massnahmen (hoechstens 400) - damit sich das Bargeld des Buchs auch ohne das
   *  Journal nachrechnen laesst. */
  function bucheMassnahmen(buch, ereignisse, barZeit, nowMs) {
    var res = { buchungen: [], gesperrt: [] };
    if (!buch || !ereignisse || !barZeit) return res;
    function nachZeit(a, b) { return a[0] - b[0]; }
    (buch.positionen || []).forEach(function (p) {
      var e = ereignisse[p.sym], bis = barZeit[p.sym];
      if (!e || !(bis > 0)) return;
      var beginn = p.kursT > 0 ? p.kursT : p.seit;
      if (!(beginn > 0)) return;
      function faellig(art, t) {
        return t > beginn && t <= bis && !(p.gebucht && p.gebucht.indexOf(art + ':' + t) >= 0);
      }
      function merke(art, t) { if (!p.gebucht) p.gebucht = []; p.gebucht.push(art + ':' + t); }
      (e.split || []).slice().sort(nachZeit).forEach(function (s) {
        var t = s[0], z = s[1], n = s[2];
        if (!(z > 0) || !(n > 0) || !faellig('split', t)) return;
        var davor = (p.gebucht || []).filter(function (k) {
          return k.indexOf('split:') === 0 && Math.abs(t - Number(k.slice(6))) <= SPLIT_SPERRE_MS;
        })[0];
        if (davor) {                                                  // Regel 5: Sperre
          var schon = !!(p.gemeldet && p.gemeldet.indexOf('split:' + t) >= 0);
          if (!schon) { if (!p.gemeldet) p.gemeldet = []; p.gemeldet.push('split:' + t); }
          res.gesperrt.push({ sym: p.sym, art: 'split', t: t, zaehler: z, nenner: n, gebuchtT: Number(davor.slice(6)), neu: !schon });
          return;
        }
        var b = { sym: p.sym, art: 'split', t: t, am: nowMs, kaufT: beginn, zaehler: z, nenner: n,
          stueckAlt: p.stueck, einstandAlt: p.einstand };
        p.stueck = p.stueck * z / n;                                  // Regel 3
        p.einstand = p.einstand * n / z;
        b.stueckNeu = p.stueck; b.einstandNeu = p.einstand;
        merke('split', t);
        res.buchungen.push(b);
      });
      (e.div || []).slice().sort(nachZeit).forEach(function (a) {
        var t = a[0], betrag = a[1];
        if (!(betrag > 0) || !faellig('div', t)) return;
        var richtung = p.richtung < 0 ? -1 : 1;
        var summe = richtung * p.stueck * betrag;                     // Regel 4: Stueckzahl NACH den Splits
        buch.cash += summe;
        merke('div', t);
        res.buchungen.push({ sym: p.sym, art: 'div', t: t, am: nowMs, kaufT: beginn, betrag: betrag, stueck: p.stueck,
          richtung: richtung, summe: summe });
      });
    });
    if (res.buchungen.length) {
      buch.massnahmen = (buch.massnahmen || []).concat(res.buchungen);
      if (buch.massnahmen.length > 400) buch.massnahmen = buch.massnahmen.slice(-400);
    }
    return res;
  }

  /** Neue Positionen (seit === nowMs) bekommen den Zeitstempel des Balkens, zu dessen Kurs
   *  gekauft wurde - den Beginn fuer bucheMassnahmen (Regel 1). Aufgerufen gleich nach
   *  fuehreAus bzw. driftAbgleich; auch ein nach Regel K2 neu gekaufter Bestand ist eine
   *  neue Position. Rueckgabe: Zahl der gestempelten Positionen. */
  function stempleKursT(buch, barZeit, nowMs) {
    var n = 0;
    ((buch && buch.positionen) || []).forEach(function (p) {
      if (p.seit === nowMs && !(p.kursT > 0) && barZeit && barZeit[p.sym] > 0) { p.kursT = barZeit[p.sym]; n++; }
    });
    return n;
  }

  /** Die EINE Journalzeile je Takt und Buch zu bucheMassnahmen - null, wenn nichts gebucht
   *  und nichts neu gesperrt wurde. name: 'momentum' | 'drift'. Rein (Text, keine Wirkung).
   *  Der Ex-Tag ist der Kalendertag des Zeitstempels in UTC (= Handelstag in New York). */
  function massnahmenJournal(name, res, nowMs) {
    var div = res.buchungen.filter(function (b) { return b.art === 'div'; });
    var split = res.buchungen.filter(function (b) { return b.art === 'split'; });
    var sperre = res.gesperrt.filter(function (g) { return g.neu; });
    if (!div.length && !split.length && !sperre.length) return null;
    var buchName = name === 'drift' ? 'Ergebnis-Drift-Buch' : 'Momentum-Buch';
    function tag(t) { var s = new Date(t).toISOString(); return s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4); }
    function zahl(x, stellen) { return String(Math.round(x * Math.pow(10, stellen)) / Math.pow(10, stellen)).replace('.', ','); }
    function geld(x) { return (x < 0 ? '−' : '') + Math.abs(x).toFixed(2).replace('.', ',') + ' $'; }
    var applied = [], saetze = [];
    if (div.length) {
      var summe = div.reduce(function (a, b) { return a + b.summe; }, 0);
      var mitLeer = div.some(function (b) { return b.richtung < 0; });
      var kopf = (mitLeer ? 'Ausschüttungen gebucht (Gutschrift bei Kauf, Belastung bei Leerverkauf): ' : 'Ausschüttungen gutgeschrieben: ') +
        div.length + (div.length === 1 ? ' Buchung' : ' Buchungen') + ', Summe ' + geld(summe);
      applied.push(buchName + ': ' + kopf);
      /* Nachtrag: der Ex-Tag liegt schon mehr als vier Tage zurueck - der erste Lauf nach dem
       * Update (oder nach einer Pause der App) holt nach, was seit dem Kauf angefallen ist. */
      var nach = div.filter(function (b) { return nowMs - b.t > 4 * 86400000; });
      var kaufTage = {};
      div.forEach(function (b) { kaufTage[tag(b.kaufT)] = true; });
      var mehrere = Object.keys(kaufTage).length > 1;                 // dann nennt jeder Posten seinen Kauftag
      saetze.push(kopf + ' – ins Bargeld des Buchs.' +
        (nach.length ? ' Nachtrag seit dem ' + (mehrere ? 'jeweiligen Kauf (je Posten genannt)' : 'Kauf am ' + tag(nach[0].kaufT)) +
          ': nachgeholt wird, was seit dem Kauf angefallen und noch nicht gebucht war.' : '') +
        ' Einzelposten (Wert, Ex-Tag, Betrag je Stück × Stück = Summe): ' +
        div.map(function (b) {
          return b.sym + ' ' + tag(b.t) + ' ' + zahl(b.betrag, 6) + ' $ × ' + zahl(b.stueck, 4) + ' = ' + geld(b.summe) +
            (b.richtung < 0 ? ' (Leerverkauf)' : '') + (mehrere ? ' (Kauf ' + tag(b.kaufT) + ')' : '');
        }).join('; ') + '.');
    }
    split.forEach(function (b) {
      var s = 'Split gebucht: ' + b.sym + ' ' + b.zaehler + ' : ' + b.nenner + ', Stück ' + zahl(b.stueckAlt, 4) + ' → ' + zahl(b.stueckNeu, 4) +
        ', Einstand ' + geld(b.einstandAlt) + ' → ' + geld(b.einstandNeu);
      applied.push(buchName + ': Split gebucht: ' + b.sym + ' ' + b.zaehler + ' : ' + b.nenner);
      saetze.push(s + ' (Ex-Tag ' + tag(b.t) + '; der Wert der Position bleibt gleich).');
    });
    sperre.forEach(function (g) {
      applied.push(buchName + ': Split NICHT gebucht (Sperre): ' + g.sym + ' ' + g.zaehler + ' : ' + g.nenner);
      saetze.push('Split NICHT gebucht: ' + g.sym + ' ' + g.zaehler + ' : ' + g.nenner + ' vom ' + tag(g.t) + ' liegt höchstens 30 Kalendertage neben dem gebuchten Split vom ' +
        tag(g.gebuchtT) + ' – zwei Splits so dicht beieinander sind fast immer eine doppelte Meldung der Quelle. Bitte prüfen; die Position bleibt, wie sie ist.');
    });
    return { applied: applied, txt: saetze.join(' ') + ' Simulation mit virtuellem Kapital, keine Anlageberatung.' };
  }

  var MFHandel = {
    buchKonfig: buchKonfig, momentumZiel: momentumZiel, planeUmschichtung: planeUmschichtung,
    fuehreAus: fuehreAus, bewerte: bewerte, rebalanceFaellig: rebalanceFaellig,
    driftAbgleich: driftAbgleich, bewerteDrift: bewerteDrift,
    bucheMassnahmen: bucheMassnahmen, stempleKursT: stempleKursT, massnahmenJournal: massnahmenJournal
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = MFHandel; return; }
  root.MFHandel = MFHandel;
})(typeof window !== 'undefined' ? window : globalThis);
