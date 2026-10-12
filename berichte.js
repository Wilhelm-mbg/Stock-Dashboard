'use strict';
/* ================= Berichte: Retro, Wochenreport, Analyse-Export, Messbericht =================
 *
 * Stufe E des Struktur-Plans, Bloecke 5a/5b/5c: alle vier Textausgaben der App,
 * WOERTLICH aus depot.js umgezogen. Berichte LESEN den Zustand und bauen Text -
 * sie handeln nichts. Die eine Rueckkopplung ist der Analyse-Export: save() im
 * Handelsmodul ruft ihn gedrosselt nach jedem Speichern (die Drossel wohnt im
 * Export selbst). Vor der Verkabelung kehrt er still um - ein Wurf hier duerfte
 * niemals das Speichern des Depots verhindern.
 *
 * Vier Datenquellen kommen als GETTER, nicht als Kopie: der Depot-Zustand (D wird
 * beim Reset neu zugewiesen), die Sentiment-Historie und die Archiv-Abdeckung
 * (beide werden im Handelsmodul neu zugewiesen) sowie Kursreihen/Tagescache. */
(function () {
  var U = window.U;
  /* Von depot.js hereingereicht (verkabeln) - vorher zeigen die Knoepfe nichts. */
  var holeDepot = null, equityNow = null, istMess = null, stratOf = null,
      normWeights = null, kiSuggestions = null, getHistory = null,
      patienceAgg = null, dateiSpeichern = null, START_CAPITAL = 0,
      holeHealth = null, holeSent = null, holeAbdeckung = null,
      holeLastbars = null, holeTagescache = null,
      modeParams = null, melde = null, scheiterGrund = null, HAND_LABEL = null,
      MIN_OOS_TRADES = 0, MIN_OOS_TAGE = 0;
  var D = null, HEALTH = null, SENT = null, EXPORT_ABDECKUNG = null,
      LASTBARS = null, TAGES_CACHE = null;

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
        if (pct < 45) recs.push('- **' + src + '**: nur ' + Math.round(pct) + ' % Treffer (' + s.r + '/' + tot + ') – wenige Treffer, aber eine Trefferquote ist kein Beleg gegen die Quelle.');
        if (pct > 60) recs.push('- **' + src + '**: ' + Math.round(pct) + ' % Treffer (' + s.r + '/' + tot + ') – viele Treffer, aber eine Trefferquote ist kein Beleg für die Quelle.');
      }
    });
    var ia = d.agg.intraday;
    if (ia.n >= 10 && ia.pnl < 0 && d.fees > Math.abs(ia.pnl) * 0.3) recs.push('- **Intraday: Kosten fressen das Ergebnis** – ein größerer Minuten-Zeitrahmen hilft nach dem Belegstand nicht: die Signalstudie fand auf 1m/5m/15m unter Kassa-Kosten keine belegte Konfiguration (0 von 234, Stand 11.09.2026).');
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
    lines.push('- Gesamt seit Start: ' + U.signTxt(window.Massstab.prozent(eqEnd, START_CAPITAL), ' %') + ' · Offene Positionen: ' + D.positions.length);
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
  /* ---- Lagebild-Export (Auftrag Nr. 115, 12.10.2026): eigener Takt neben den 10 Minuten ----
   * lagebild.json und kursdaten.json alle 2 Minuten in vor/haupt/nach, sonst alle 10, dazu
   * sofort bei force (jede Depot-Aenderung); analyse-daten.json behaelt seine 10 Minuten.
   * markt-chart/ alle 15 Minuten und sofort fuer einen im Viewer geoeffneten Wert. Die Sperren
   * bleiben wie bei lastAnalysisExport auch im Fehlerfall gesetzt (Begruendung unten). */
  var lastLagebildExport = 0, lastChartExport = 0;
  var LAGEBILD_TAKT = { offen: 2 * 60000, zu: 10 * 60000, chart: 15 * 60000 };
  var VIEWER_ZULETZT = [], CHART_SOFORT = [], APP_VERSION = null, SAMMLER_STAND = null;
  function lagebildTakt(sitzung) { return (sitzung === 'vor' || sitzung === 'haupt' || sitzung === 'nach') ? LAGEBILD_TAKT.offen : LAGEBILD_TAKT.zu; }
  function viewerGeoeffnet(sym) {
    sym = String(sym || '').toUpperCase();
    if (!sym) return;
    VIEWER_ZULETZT = [sym].concat(VIEWER_ZULETZT.filter(function (s) { return s !== sym; })).slice(0, 20);
    if (CHART_SOFORT.indexOf(sym) === -1) CHART_SOFORT.push(sym);
    exportAnalysis(false);
  }
  /** Welche Werte eine markt-chart-Datei bekommen: Watchlist, Positionen aller Buecher,
   *  zuletzt im Viewer geoeffnete - hoechstens 60. Kerzen liest der Hauptprozess selbst. */
  function chartAuftrag() {
    var syms = [], seen = {};
    function nimm(s) { s = String(s || '').toUpperCase(); if (s && !seen[s] && syms.length < 60) { seen[s] = 1; syms.push(s); } }
    CHART_SOFORT.forEach(nimm);
    VIEWER_ZULETZT.forEach(nimm);
    (D.positions || []).forEach(function (p) { nimm(p && p.sym); });
    [D.mfBuch, D.driftBuch].forEach(function (b) { ((b && b.positionen) || []).forEach(function (p) { nimm(p && p.sym); }); });
    (D.watchlist || []).forEach(function (w) { nimm(w && w.y); });
    var auftrag = { symbole: syms, sofort: CHART_SOFORT.slice(), namen: {} };
    syms.forEach(function (s) { var e = window.Marktwerte && window.Marktwerte.stammEintrag ? window.Marktwerte.stammEintrag(s) : null; if (e) auftrag.namen[s] = e.name; });
    CHART_SOFORT = [];
    return auftrag;
  }
  function kursVon(sym) {
    var k = window.Marktwerte && window.Marktwerte.kurs ? window.Marktwerte.kurs(sym) : null;
    if (k && isFinite(k.kurs)) return k.kurs;
    var l = window.DepotAPI && window.DepotAPI.letzterKurs ? window.DepotAPI.letzterKurs(sym) : null;
    return l && isFinite(l.kurs) ? l.kurs : null;
  }
  /** Die Quellen des Lagebilds - nur Leseauskuenfte und Zustand, nichts aus Einstellungen. */
  function lagebildQuellen(gesundheit, jetzt) {
    var API = window.DepotAPI;
    var signale = [];
    (D.watchlist || []).forEach(function (w) {
      var s = w && API && API.signal ? API.signal(w.y) : null;
      if (s) signale.push({ sym: w.y, signal: null, t: s.t, grund: s.grund });
    });
    var sm = SAMMLER_STAND;
    return { D: D, HEALTH: HEALTH, jetzt: jetzt, appVersion: APP_VERSION, DepotAPI: API, MFDepot: window.MFDepot,
      StudienUrteile: window.StudienUrteile, Massstab: window.Massstab, Boerse: window.Boerse, Dash: window.Dash,
      Drift: window.Drift, Scoreboard: window.Scoreboard, antwortTexte: window.__antwortTexte,
      equityNow: equityNow, startKapital: START_CAPITAL, scanMs: modeParams().scanMs, abdeckung: EXPORT_ABDECKUNG,
      gesundheit: gesundheit, kursVon: kursVon,
      nameVon: function (sym) { var e = window.Marktwerte && window.Marktwerte.stammEintrag ? window.Marktwerte.stammEintrag(sym) : null; return e ? e.name : null; },
      termine: window.Cal && window.Cal.next ? window.Cal.next(6) : [], signale: signale,
      sammler: sm ? { laeuft: !!sm.laeuft, stand: sm.fortschritt ? sm.fortschritt.begonnen : null, menge: Array.isArray(sm.zeilen) ? sm.zeilen.length : null, sperre: sm.fehler || null } : null };
  }
  function nebenstaendeHolen() {
    try { if (!APP_VERSION && window.api.appVersion) window.api.appVersion().then(function (v) { APP_VERSION = v && v.version ? v.version : (typeof v === 'string' ? v : null); }, function () {}); } catch (e) { /* ohne Version */ }
    try { if (window.api.sammlerStand) window.api.sammlerStand().then(function (s) { SAMMLER_STAND = s || null; }, function () {}); } catch (e) { /* ohne Sammler-Stand */ }
  }

  async function exportAnalysis(force) {
    if (!D || !window.api.exportAnalysis) return null;
    var nowE = Date.now();
    var LB = window.Lagebild || null;
    var sitz = LB ? LB.sitzung(nowE, window.Boerse) : null;
    var analyseFaellig = !!force || nowE - lastAnalysisExport >= 10 * 60000;
    var lagebildFaellig = !!LB && (!!force || nowE - lastLagebildExport >= lagebildTakt(sitz));
    var chartFaellig = !!LB && (CHART_SOFORT.length > 0 || nowE - lastChartExport >= LAGEBILD_TAKT.chart);
    if (!analyseFaellig && !lagebildFaellig && !chartFaellig) return null;
    if (analyseFaellig) lastAnalysisExport = nowE;
    if (lagebildFaellig) lastLagebildExport = nowE;
    if (chartFaellig) lastChartExport = nowE;
    nebenstaendeHolen();
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
    /* Der Lagebild-Takt: was nicht faellig ist, faehrt nicht mit (main.js schreibt nur, was da ist). */
    if (lagebildFaellig) {
      try { payload.lagebild = LB.bau(lagebildQuellen(payload.json.gesundheit, nowE)); }
      catch (e) { payload.lagebild = null; }
    }
    if (chartFaellig) payload.charts = chartAuftrag();
    if (!analyseFaellig) { payload.json = null; payload.csv = null; payload.bericht = null; if (!lagebildFaellig) payload.kurse = null; }
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
    z.push('Das Kursarchiv sammelt rollierend 90 Kalendertage – die Tabelle wächst mit jedem Handelstag, an dem die App läuft. Mindestmenge, bevor die App überhaupt rechnet: **' + MIN_OOS_TRADES + ' Out-of-Sample-Trades auf ' + MIN_OOS_TAGE + ' ungesehenen Handelstagen** – ein Urteil ist das noch nicht; dafür braucht es t über Tage, ausreichende Auflösung und Netto nach Kosten.');
    z.push('');
    z.push('## Kostenmodell der Scheine (Annahme, nicht gemessen)');
    z.push('');
    z.push('Die Simulation rechnet für Scheine mit einem Cent-Modell: die Geld-Brief-Spanne als fester Cent-Betrag je Bezugsverhältnis, unabhängig vom Preis des Scheins. Das Modell stammt aus einer Stichprobe bei onvista vom 20.08.2026, die nicht als Messung abgelegt ist – es ist eine Annahme, kein Beleg. Gemessen ist für Hebelscheine nur die Hürde der Signalstudie: 0,23 Pp je 3 Stunden (wiki/kosten.md).');
    z.push('');
    z.push('Nach diesem Modell ist das Bezugsverhältnis ein Kostenhebel: ein Schein mit höherem Bezugsverhältnis kostet mehr je Stück, zahlt aber relativ weniger Spanne bei gleichem Hebel (Omega hängt nicht am Bezugsverhältnis) – eine Folgerung aus der Modellannahme, nicht gemessen. Was die Bewegung nach dem Modell mindestens hergeben muss, damit ein Trade überhaupt lohnt:');
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
          (om > 0 ? U.dez(rt / om * 100, 3) : '–') + ' %** |');
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
        /* Seit Auftrag Nr. 81 durch DIESELBE Rechnung wie die Oberflaeche (massstab.js):
         * Buch und Markt ueber dieselben Tagespunkte, der Markt aus der bereinigten
         * SPY-Reihe (Gesamtertrag), sonst sichtbar der Kursertrag. Vorher stand hier ein
         * eigener Rechenweg ueber die abgelegten Tagesstaende - in einer Woche mit
         * Ex-Tag eine andere Zahl als im Kopf der App.
         * Seit Auftrag Nr. 95 (C1) ueber DIESELBE Funktion wie Kopf und Karten
         * (MFDepot.vergleich, nur mit den Punkten der Woche): dieselben Optionen -
         * Marktstand je Punkt (punktKurs), Rohreihe, Ausschuettungen des Buchs. Vorher
         * rief diese Zeile den Massstab ohne sie und konnte in einer Woche mit Ex-Tag
         * vom Kopf abweichen. */
        var MsW = window.Massstab, MFD = window.MFDepot;
        var vMW = MFD && MFD.vergleich ? MFD.vergleich('momentum', mv) : null;
        var vDW = MFD && MFD.vergleich ? MFD.vergleich('drift', mv) : null;
        var okW = function (v2) { return v2 && v2.ok ? v2 : null; };
        var vSW = okW(vMW) || okW(vDW);
        function pctW(v2, feld) { return v2 && v2[feld] != null ? v2[feld].toFixed(2) : '–'; }
        z.push('');
        z.push('Bücher über die Woche (' + mv.length + ' Tagespunkte): Momentum ' + pctW(okW(vMW), 'buchPct') +
          ' % · Drift ' + pctW(okW(vDW), 'buchPct') + ' % · SPY ' + pctW(vSW, 'marktPct') + ' %' +
          (vSW && MsW ? ' (' + MsW.marktZusatz(vSW) + ')' : '') + '.');
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
      z.push('Basis mit allen Filtern: ' + (fb.basisRet > 0 ? '+' : '') + fb.basisRet + ' % bei ' + fb.basisN + ' Trades. „Nutzen“ = Rendite mit Filter minus ohne – positiv heißt: mit Filter lag die Rendite auf dieser Testscheibe höher; ohne Signifikanzprüfung, kein Beleg.');
      z.push('');
      z.push('| Filter | mit | ohne | Nutzen | Trades mit/ohne | Urteil |');
      z.push('|---|---|---|---|---|---|');
      fb.zeilen.forEach(function (r) {
        var urteil = r.duenn ? 'zu wenig Trades für ein Urteil'
          : r.nutzen > 0.5 ? 'mit Filter besser (ohne Signifikanzprüfung)' : r.nutzen < -0.5 ? 'mit Filter schlechter (ohne Signifikanzprüfung)' : 'kein Unterschied sichtbar';
        z.push('| ' + r.name + ' | ' + (r.mitRet > 0 ? '+' : '') + r.mitRet + ' % | ' + (r.ohneRet > 0 ? '+' : '') + r.ohneRet + ' % | ' +
          (r.nutzen > 0 ? '+' : '') + r.nutzen + ' Pp | ' + r.mitN + '/' + r.ohneN + ' | ' + urteil + ' |');
      });
    } else {
      z.push('Keine Filter-Bilanz in dieser Messung (zu wenig Daten auf der Testscheibe).');
    }
    z.push('');
    z.push('Nur live wirksame Filter (nicht im Backtest abbildbar) – Beobachtung aus dem Schattenbuch, kein Beleg:');
    z.push('');
    var sst = extra.schatten || {};
    var sk = Object.keys(sst);
    if (sk.length) {
      sk.forEach(function (g) {
        var x = sst[g];
        var u = x.n < 5 ? 'zu früh (' + x.n + ' Schatten)'
          : x.gerettet > x.verhindert * 1.5 ? 'bisher eher Verluste vermieden' : x.verhindert > x.gerettet * 1.5 ? 'bisher eher Gewinne verhindert' : 'kein Muster';
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
      z.push('| Datum | bester Kandidat | WF-Rendite | Trades | Tage | Mindestmenge erreicht |');
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

  /** Frischt alle Getter-Quellen am oeffentlichen Einstieg auf (siehe Kopf). */
  function mitFrisch(fn) {
    return function () {
      if (!holeDepot) return null;   // noch nicht verkabelt: still umkehren (save() darf nie brechen)
      D = holeDepot();
      HEALTH = holeHealth();
      SENT = holeSent();
      EXPORT_ABDECKUNG = holeAbdeckung();
      LASTBARS = holeLastbars();
      TAGES_CACHE = holeTagescache();
      return fn.apply(this, arguments);
    };
  }

  /** Von depot.js init() gerufen: reicht die Lese-Helfer herein und verkabelt die
   *  Bericht-Knoepfe (Retro, Wochenreport, Analyse-Bericht). */
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
    holeHealth = deps.HEALTH;
    holeSent = deps.SENT;
    holeAbdeckung = deps.EXPORT_ABDECKUNG;
    holeLastbars = deps.LASTBARS;
    holeTagescache = deps.TAGES_CACHE;
    modeParams = deps.modeParams;
    melde = deps.melde;
    scheiterGrund = deps.scheiterGrund;
    HAND_LABEL = deps.HAND_LABEL;
    MIN_OOS_TRADES = deps.MIN_OOS_TRADES;
    MIN_OOS_TAGE = deps.MIN_OOS_TAGE;
    var rb = document.getElementById('retroBtn');
    if (rb) rb.addEventListener('click', mitFrisch(runRetro));
    var wb = document.getElementById('weeklyBtn');
    if (wb) wb.addEventListener('click', mitFrisch(runWeekly));
    var sb = document.getElementById('reportShowBtn');
    if (sb) sb.addEventListener('click', mitFrisch(showReport));
  }

  /* Der 2-Minuten-Takt haengt nicht an save(): einmal je Minute nachsehen, ob etwas faellig ist. */
  if (typeof setInterval === 'function') setInterval(function () { if (holeDepot) mitFrisch(exportAnalysis)(false); }, 60000);

  window.Berichte = {
    verkabeln: verkabeln,
    exportAnalysis: mitFrisch(exportAnalysis),
    viewerGeoeffnet: mitFrisch(viewerGeoeffnet),
    csvString: mitFrisch(csvString),
    baueMessbericht: mitFrisch(baueMessbericht)
  };
})();
