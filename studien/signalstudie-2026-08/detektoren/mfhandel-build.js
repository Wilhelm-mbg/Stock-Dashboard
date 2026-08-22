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

  /** 12-1-Momentum-Rangfolge auf ROHEN Serien — jede Serie mit ihren eigenen
   *  Handelstagen, bewusst ohne gemeinsame Zeitachse: Für ein Live-Ranking zählt der
   *  letzte Stand jedes Werts, nicht ein historischer Schnittpunkt.
   *  rohMap: {SYM: [[t, kurs], …]}   opts: {rueckblick, luecke, anteil, minWerte, maxAlterMs, nowMs}
   *  Rückgabe: {ziel: [sym…], rangfolge: [{sym, staerke}], uebersprungen: [sym…]} */
  function momentumZiel(rohMap, opts) {
    opts = opts || {};
    var rueck = opts.rueckblick || 231, luecke = opts.luecke || 21;
    var anteil = opts.anteil || 0.10, minWerte = opts.minWerte || 25;
    var maxAlter = opts.maxAlterMs || 7 * 86400000;
    var nowMs = opts.nowMs || Date.now();
    var punkte = [], uebersprungen = [], verworfen = [];
    /** Jeder Ausschluss wird mit Grund festgehalten, nicht nur gezählt — die Anzeige
     *  soll erklären können, warum ein Wert nicht mitrankt. */
    function raus(sym, grund) { uebersprungen.push(sym); verworfen.push({ sym: sym, grund: grund }); }
    Object.keys(rohMap).forEach(function (sym) {
      var r = rohMap[sym];
      if (!r || r.length < rueck + 5) { raus(sym, 'zu kurze Kursreihe (' + ((r && r.length) || 0) + ' von ' + (rueck + 5) + ' Tagen)'); return; }
      // Veraltete Serien fliegen raus, statt mit einem alten Kurs mitzuranken —
      // ein eingefrorener Wert sähe im fallenden Markt fälschlich „stark“ aus.
      if (nowMs - r[r.length - 1][0] > maxAlter) {
        raus(sym, 'Kurse veraltet (' + Math.round((nowMs - r[r.length - 1][0]) / 86400000) + ' Tage alt)'); return;
      }
      var i = r.length - 1;
      var st = r[i - luecke][1] / r[i - rueck][1] - 1;
      if (isFinite(st)) punkte.push({ sym: sym, staerke: st });
      else raus(sym, 'Stärke nicht berechenbar (Kurslücke)');
    });
    if (punkte.length < minWerte) return { ziel: [], rangfolge: [], uebersprungen: uebersprungen, verworfen: verworfen, zuWenig: true };
    punkte.sort(function (a, b) { return b.staerke - a.staerke; });
    var n = Math.max(5, Math.round(punkte.length * anteil));
    return { ziel: punkte.slice(0, n).map(function (p) { return p.sym; }), rangfolge: punkte,
      uebersprungen: uebersprungen, verworfen: verworfen };
  }

  /** Umschichtung planen: Soll-Ist-Abgleich. Gleichgewichtung über die Zielliste.
   *  buch: {cash, positionen: [{sym, stueck, einstand}]}   preise: {sym: kurs}
   *  Rückgabe: {verkaufen: [{sym, stueck, kurs}], kaufen: [{sym, stueck, kurs, budget}],
   *             halten: [sym…], fehltKurs: [sym…]} */
  function planeUmschichtung(ziel, buch, preise) {
    var zielSet = {};
    ziel.forEach(function (s) { zielSet[s] = true; });
    var verkaufen = [], halten = [], fehltKurs = [];
    var wert = buch.cash;
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (!(k > 0)) { fehltKurs.push(p.sym); halten.push(p.sym); return; }   // ohne Kurs kein Handel
      wert += p.stueck * k;
      if (zielSet[p.sym]) halten.push(p.sym);
      else verkaufen.push({ sym: p.sym, stueck: p.stueck, kurs: k });
    });
    var neuKaufen = ziel.filter(function (s) {
      return !(buch.positionen || []).some(function (p) { return p.sym === s; });
    }).filter(function (s) { if (!(preise[s] > 0)) { fehltKurs.push(s); return false; } return true; });
    // Gleichgewichtung: jedes Ziel bekommt wert/zielAnzahl. Bestehende Positionen werden
    // NICHT nachjustiert — jeder Trade kostet, und die Messung lief ohne Feinjustierung.
    var budget = ziel.length ? wert / ziel.length : 0;
    var kaufen = neuKaufen.map(function (s) {
      return { sym: s, kurs: preise[s], budget: budget, stueck: budget > 0 ? Math.round(budget / preise[s] * 10000) / 10000 : 0 };
    });
    return { verkaufen: verkaufen, kaufen: kaufen, halten: halten, fehltKurs: fehltKurs, depotwert: wert };
  }

  /** Orders ausführen — mutiert das Buch, schreibt Trades. kostenBp je Seite.
   *  Bruchstücke sind erlaubt (Simulation/CFD). Rückgabe: Anzahl der Ausführungen. */
  function fuehreAus(buch, plan, nowMs, kostenBp) {
    var k = (kostenBp == null ? 20 : kostenBp) / 10000;
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

  var MFHandel = {
    momentumZiel: momentumZiel, planeUmschichtung: planeUmschichtung,
    fuehreAus: fuehreAus, bewerte: bewerte, rebalanceFaellig: rebalanceFaellig,
    driftAbgleich: driftAbgleich, bewerteDrift: bewerteDrift
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = MFHandel; return; }
  root.MFHandel = MFHandel;
})(typeof window !== 'undefined' ? window : globalThis);
