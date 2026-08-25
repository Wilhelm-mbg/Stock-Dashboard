'use strict';
/* ================= Berichte: Retrospektive und Wochenreport =================
 *
 * Stufe E des Struktur-Plans, Block 5b: WOERTLICH aus depot.js umgezogen - gleiche
 * Funktionen, gleiche Kommentare; neu sind nur dieser Kopf und die Verkabelung am
 * Ende. Beide Berichte LESEN den Depot-Zustand und bauen Text daraus; sie handeln
 * nichts und schreiben nichts zurueck.
 *
 * Die Abhaengigkeiten kommen ueber Berichte.verkabeln() aus depot.js - bewusst als
 * benannte Liste statt ueber Globals: was ein Bericht liest, soll man hier oben
 * sehen koennen. Der Depot-Zustand kommt als GETTER (depot.js weist sein D beim
 * Depot-Reset neu zu). */
(function () {
  var U = window.U;
  /* Von depot.js hereingereicht (verkabeln) - vorher zeigen beide Knoepfe nichts. */
  var holeDepot = null, equityNow = null, istMess = null, stratOf = null,
      normWeights = null, kiSuggestions = null, getHistory = null,
      patienceAgg = null, dateiSpeichern = null, START_CAPITAL = 0;
  var D = null;

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


  /** Frischt den D-Verweis am oeffentlichen Einstieg auf (siehe Kopfkommentar). */
  function mitFrischemD(fn) {
    return function () {
      if (holeDepot) D = holeDepot();
      return fn.apply(this, arguments);
    };
  }

  /** Von depot.js init() gerufen: reicht die Lese-Helfer herein und verkabelt die
   *  beiden Knoepfe im Bereich Berichte & Werkzeuge. */
  function verkabeln(deps) {
    holeDepot = deps.depot;
    equityNow = deps.equityNow;
    istMess = deps.istMess;
    stratOf = deps.stratOf;
    normWeights = deps.normWeights;
    kiSuggestions = deps.kiSuggestions;
    getHistory = deps.getHistory;
    patienceAgg = deps.patienceAgg;
    dateiSpeichern = deps.dateiSpeichern;
    START_CAPITAL = deps.START_CAPITAL;
    var rb = document.getElementById('retroBtn');
    if (rb) rb.addEventListener('click', mitFrischemD(runRetro));
    var wb = document.getElementById('weeklyBtn');
    if (wb) wb.addEventListener('click', mitFrischemD(runWeekly));
  }

  window.Berichte = { verkabeln: verkabeln };
})();
