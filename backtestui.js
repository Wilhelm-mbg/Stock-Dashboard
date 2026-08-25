'use strict';
/* ================= Backtest-UI (Regeln → Autopilot → Berichte & Werkzeuge) =================
 *
 * Stufe E des Struktur-Plans, Block 3b: WOERTLICH aus depot.js umgezogen. Rechnet das
 * eingestellte Setup auf Historie durch und zeigt das Ergebnis - Handwerkzeug, kein
 * Handel. Die Rechnung selbst laeuft im Worker-Pool (btpool.js).
 *
 * drawEquity wohnt hier und wird exportiert: depot.js zeichnet damit auch den
 * Depot-Verlauf - EINE Definition, zwei Nutzer, keine stille Kopie. */
(function () {
  var U = window.U, Q = window.Quant;
  var drawLines = window.Chart.drawLines;
  var pmap = window.BTPool.pmap;
  var btIntraday = window.BTPool.btIntraday;
  var btDaily = window.BTPool.btDaily;
  /* Von depot.js hereingereicht (verkabeln). */
  var holeDepot = null, universe = null, fetchIntraday = null, getHistory = null,
      modeParams = null, zOf = null, dateiSpeichern = null, START_CAPITAL = 0;
  var D = null;

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


  /** Frischt den D-Verweis am oeffentlichen Einstieg auf (Depot-Reset weist D neu zu). */
  function mitFrischemD(fn) {
    return function () {
      if (holeDepot) D = holeDepot();
      return fn.apply(this, arguments);
    };
  }

  /** Von depot.js init() gerufen: reicht die Helfer herein und verkabelt den
   *  Start-Knopf des Backtests. */
  function verkabeln(deps) {
    holeDepot = deps.depot;
    universe = deps.universe;
    fetchIntraday = deps.fetchIntraday;
    getHistory = deps.getHistory;
    modeParams = deps.modeParams;
    zOf = deps.zOf;
    dateiSpeichern = deps.dateiSpeichern;
    START_CAPITAL = deps.START_CAPITAL;
    var btBtn = document.getElementById('btRunBtn');
    if (btBtn) btBtn.addEventListener('click', mitFrischemD(runBacktest));
  }

  window.BacktestUI = { verkabeln: verkabeln, drawEquity: drawEquity };
})();
