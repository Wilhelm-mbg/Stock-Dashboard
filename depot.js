'use strict';
/* KI-Musterdepot: stündlicher Job (News + Technik + Elliott), synthetische
   Optionsscheine (Black-Scholes), Trade-Protokoll, Trefferquoten, Backtest.
   SIMULATION – keine Anlageberatung. */
(function () {
  var Q = window.Quant, U = window.U;
  var START_CAPITAL = 10000;
  var OPEN_THR = 0.35, CLOSE_THR = 0.25, BUDGET = 0.05, SL = -0.40, TP = 0.80, MAX_POS = 8;

  var D = null; // Depot-State
  var jobRunning = false;

  function defaultDepot() {
    return {
      cash: START_CAPITAL, positions: [], trades: [],
      stats: { news: { r: 0, w: 0 }, tech: { r: 0, w: 0 }, elliott: { r: 0, w: 0 }, maIntraday: { r: 0, w: 0 }, ki: { r: 0, w: 0 } },
      kiLog: [], patience: {},
      weights: { news: 0.35, tech: 0.40, elliott: 0.25 },
      intraday: { enabled: false, mode: 'breakout', interval: '5m', period: 20, confirmBps: 15, profile: 'atm21', orderFee: 1.5, minDollarVol: 50, budgetPct: 0.03, sl: -0.25, tp: 0.35, cooldownMin: 45, maxPerDay: 10, lineType: 'ema', trendFilter: false, window: 'all', scalpHold: 60, scalpTrail: 15, scalpSL: 20, blackout: 'block', channel: true, mtf: true, sizing: 'fix', screener: false, avoidHours: [], autoTune: true },
      watchlist: [],
      intradayLastScan: 0, intradayDay: '', intradayCount: 0, intradayCooldown: {},
      notify: true, hourlyEnabled: true, equityHist: [],
      risk: { maxPos: 8, dayLossPct: 5, exposurePct: 40 },
      dayKey: '', dayStartEq: 0,
      lastRun: 0, nextId: 1
    };
  }
  var logFilter = 'all';
  // Gesundheits-Telemetrie (für das externe Audit)
  var HEALTH = { scans: 0, scanErrors: 0, fetchFail: 0, fetchOk: 0, kiFail: 0, kiOk: 0, capFail: 0, capOk: 0, lastScanT: 0, scanTimes: [], startedAt: Date.now() };
  var LASTBARS = {}; // sym -> zuletzt geladene Intraday-Serie (für den Kursdaten-Export)
  var SIG = {};      // sym -> letzter Signal-/Blocker-Zustand (Live-Monitor)
  var lastEqPoint = 0;
  var SENT = {}; // Sentiment-Historie je Symbol

  /* ================= Risikomanagement ================= */
  function ensureDay(eq) {
    var today = new Date().toISOString().slice(0, 10);
    if (D.dayKey !== today) { D.dayKey = today; D.dayStartEq = eq; }
  }
  /** Dürfen wir eine neue Position eröffnen? */
  function canOpen(eq) {
    var r = D.risk || { maxPos: 8, dayLossPct: 5, exposurePct: 40 };
    ensureDay(eq);
    if (D.positions.length >= (r.maxPos || 8)) return { ok: false, why: 'Positionslimit (' + r.maxPos + ') erreicht' };
    if (r.dayLossPct && D.dayStartEq > 0) {
      var dayPct = (eq / D.dayStartEq - 1) * 100;
      if (dayPct <= -r.dayLossPct) return { ok: false, why: 'Risiko-Stopp: Tagesverlust ' + dayPct.toFixed(1) + ' % (Limit −' + r.dayLossPct + ' %)' };
    }
    if (r.exposurePct) {
      var expo = eq > 0 ? (eq - D.cash) / eq * 100 : 0;
      if (expo >= r.exposurePct) return { ok: false, why: 'Exposure-Limit: ' + Math.round(expo) + ' % in Scheinen (Limit ' + r.exposurePct + ' %)' };
    }
    return { ok: true };
  }

  /* ================= Geduld-Bilanz (verworfene Signale) ================= */
  var patLast = {}; // Drossel: dieselbe Ablehnung (Symbol+Grund) max. alle 15 Min zählen
  function patienceAdd(reason, sym) {
    if (!D) return;
    if (sym) { SIG[sym] = SIG[sym] || {}; SIG[sym].grund = reason; SIG[sym].t = Date.now(); SIG[sym].ok = false; }
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

  /* ================= Lokale KI-Prüfung (Veto/Boost) ================= */
  function kiLogAdd(sym, dir, entscheidung, begruendung, mode) {
    if (!D.kiLog) D.kiLog = [];
    D.kiLog.unshift({ t: Date.now(), sym: sym, dir: dir, e: entscheidung, b: begruendung, m: mode });
    if (D.kiLog.length > 30) D.kiLog = D.kiLog.slice(0, 30);
  }
  /** Fragt die lokale KI. Rückgabe: {go, factor, note} – bei KI-Ausfall: durchwinken (fail-open). */
  async function kiCheck(ctx) {
    if (!(window.LocalKI && window.LocalKI.vetoEnabled())) return { go: true, factor: 1, note: '' };
    var r = await window.LocalKI.decide(ctx);
    if (r.ok) HEALTH.kiOk++; else HEALTH.kiFail++;
    if (!r.ok) return { go: true, factor: 1, note: ' · 🧠 KI nicht erreichbar (' + (r.msg || '?').slice(0, 40) + ') – ohne Prüfung gehandelt' };
    if (r.entscheidung === 'nein') {
      kiLogAdd(ctx.symbol, ctx.richtung, 'Veto', r.begruendung, ctx.modus);
      return { go: false, factor: 0, note: '' };
    }
    kiLogAdd(ctx.symbol, ctx.richtung, 'Ja ×' + r.groesse, r.begruendung, ctx.modus);
    return { go: true, factor: r.groesse, note: ' · 🧠 KI: ja ×' + r.groesse + ' (' + r.begruendung + ')', approved: true };
  }

  /* ================= Benachrichtigungen & Nachbilden ================= */
  var SLUGS = { AAPL: 'apple', MSFT: 'microsoft', NVDA: 'nvidia', GOOGL: 'alphabet', AMZN: 'amazon', META: 'meta-platforms', TSLA: 'tesla', AMD: 'amd', AVGO: 'broadcom', TSM: 'tsmc', ASML: 'asml', INTC: 'intel', QCOM: 'qualcomm', MU: 'micron-technology', ARM: 'arm-holdings' };

  function notifyTrade(trade, action) {
    if (!D || D.notify === false) return;
    try {
      var title = action === 'open'
        ? '📈 KI-Depot: ' + (trade.dir === 'call' ? 'CALL' : 'PUT') + ' ' + trade.sym + ' eröffnet'
        : '📉 KI-Depot: ' + (trade.dir === 'call' ? 'CALL' : 'PUT') + ' ' + trade.sym + ' geschlossen';
      var body = action === 'open'
        ? 'Basispreis ' + U.nf2.format(trade.strike) + ' · fällig ' + U.d(trade.expiry) + (trade.omega ? ' · Hebel ~' + trade.omega + 'x' : '') + '\nZum Nachbilden: App öffnen → Nachbilden-Button.'
        : 'P/L ' + U.signTxt(trade.pnl, ' $') + ' (' + (trade.why || '') + ')' + (trade.replicated ? '\n⚠ Du hast diesen Trade nachgebildet → reale Position prüfen/schließen!' : '');
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
      '• Zielhebel (Omega): ~' + (t.omega || Math.round(Q.warrantOmega(t.dir, { strike: t.strike, expiry: t.expiry, iv: t.iv, ratio: Q.RATIO }, t.entrySpot, t.openT) * 10) / 10) + 'x · Bezugsverhältnis 0,1\n' +
      '• Sim-Einsatz: ' + U.nf2.format(t.entry * t.qty) + ' $ (' + t.qty + ' Stk à ' + U.nf2.format(t.entry) + ' $) – real nur mit Spielgeld-Betrag!\n' +
      '• Exit auf den BASISWERT bezogen: Stop-Loss ' + slTxt + ' · Take-Profit ' + tpTxt + '\n' +
      '• Zusätzlich schließen bei App-Meldung (Gegensignal' + (t.strategy === 'intraday' ? ' / Tagesschluss' : ' / Zeit-Exit') + ')';
  }

  function openTicket(id) {
    var t = findTrade(id);
    if (!t) return;
    var now = Date.now();
    var w = { strike: t.strike, expiry: t.expiry, iv: t.iv, ratio: Q.RATIO };
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
      '<p style="color:var(--muted); font-size:12px;">Tipp: Sortiere im Finder nach Spread und wähle einen großen Emittenten mit engem Spread – die Nebenkosten entscheiden bei kurzen Trades.</p>';
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
  function save() {
    exportAnalysis(false); // Analyse-Dateien im Downloads-Ordner aktuell halten (gedrosselt)
    return window.api.storeSet('depot', D);
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
    var size = Math.max(2, Math.min(8, Math.floor((navigator.hardwareConcurrency || 4) * 0.75))); // CPU-Deckel ~75 %
    var workers = [], queue = [], nextId = 1, pending = {}, ok = typeof Worker !== 'undefined';
    function spawn() {
      try {
        var w = new Worker('bt-worker.js');
      } catch (e) { ok = false; return null; }
      w.busy = false;
      w.onmessage = function (e2) {
        var cb = pending[e2.data.id];
        delete pending[e2.data.id];
        w.busy = false;
        if (cb) cb(e2.data.ok ? e2.data.res : { error: e2.data.msg || 'Worker-Fehler' });
        pump();
      };
      w.onerror = function () { w.busy = false; pump(); };
      workers.push(w);
      return w;
    }
    function pump() {
      while (queue.length) {
        var free = null;
        for (var i = 0; i < workers.length; i++) if (!workers[i].busy) { free = workers[i]; break; }
        if (!free && workers.length < size) free = spawn();
        if (!free) return;
        var job = queue.shift();
        free.busy = true;
        pending[job.id] = job.cb;
        free.postMessage({ id: job.id, fn: job.fn, histMap: job.histMap, opts: job.opts });
      }
    }
    function run(fn, histMap, opts) {
      if (!ok) return Promise.resolve(fn === 'daily' ? Q.backtest(histMap, opts) : Q.backtestIntraday(histMap, opts));
      return new Promise(function (resolve) {
        queue.push({ id: nextId++, fn: fn, histMap: histMap, opts: opts, cb: resolve });
        pump();
      });
    }
    return { run: run, size: size };
  })();
  function btIntraday(map, opts) { return BTPool.run('intraday', map, opts); }
  function btDaily(map, opts) { return BTPool.run('daily', map, opts); }

  /* ================= 🛰 Auto-Tuning (empfehlung.json von Claude) ================= */
  var TUNE_ALLOW = {
    mode: ['breakout', 'waves', 'reversion', 'wave', 'orb'],
    interval: ['1m', '5m', '15m', '60m'],
    period: [9, 20, 50],
    confirmBps: [5, 15, 30],
    lineType: ['ema', 'vwap'],
    window: ['all', 'open2', 'open4', 'close2'],
    scalpSL: [15, 20, 30, 'auto'],
    sizing: ['fix', '0.25', '0.5', '1']
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
      Object.keys(TUNE_ALLOW).forEach(function (k) {
        if (it[k] === undefined) return;
        var v = it[k];
        if (k === 'period' || k === 'confirmBps' || (k === 'scalpSL' && v !== 'auto')) v = parseInt(v, 10);
        if (TUNE_ALLOW[k].indexOf(v) === -1) return;
        if (D.intraday[k] !== v) { D.intraday[k] = v; applied.push(k + ' → ' + v); }
      });
      if (typeof it.channel === 'boolean' && D.intraday.channel !== it.channel) { D.intraday.channel = it.channel; applied.push('Trendkanal → ' + (it.channel ? 'an' : 'aus')); }
      if (typeof it.mtf === 'boolean' && D.intraday.mtf !== it.mtf) { D.intraday.mtf = it.mtf; applied.push('5-Min-Bestätigung → ' + (it.mtf ? 'an' : 'aus')); }
      if (Array.isArray(it.avoidHours)) {
        var ah = it.avoidHours.map(function (x) { return parseInt(x, 10); }).filter(function (x) { return x >= 0 && x <= 23; }).slice(0, 8);
        if (JSON.stringify(ah) !== JSON.stringify(D.intraday.avoidHours || [])) { D.intraday.avoidHours = ah; applied.push('Meide-Stunden → ' + (ah.join(', ') || 'keine')); }
      }
      D.lastTune = { id: rec.id, at: Date.now(), txt: String(rec.begruendung || '').slice(0, 300), applied: applied };
      if (!D.tuneLog) D.tuneLog = [];
      var closedNow = D.trades.filter(function (t) { return t.status === 'closed'; });
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
      ? '🛰 Auto-Tuning ' + U.dt(D.lastTune.at) + ': ' + (D.lastTune.applied.length ? D.lastTune.applied.join(' · ') : 'geprüft, keine Änderung nötig') + (D.lastTune.txt ? ' — ' + D.lastTune.txt : '')
      : '';
  }

  /* ================= 📈 Signal-Chart: was die Strategie sieht ================= */
  var sigChartRunning = false;
  async function runSigChart() {
    if (sigChartRunning) return;
    sigChartRunning = true;
    var sel = document.getElementById('scSym'), st = document.getElementById('scStatus'), out = document.getElementById('scChart');
    var btn = document.getElementById('scBtn');
    btn.disabled = true;
    try {
      var cfg = D.intraday;
      var sym = sel.value;
      st.textContent = 'Lade ' + sym + ' …';
      var fd = await fetchIntraday(sym, cfg.interval || '5m', false);
      if (!fd || fd.series.length < 40) { st.textContent = 'Keine Daten für ' + sym + '.'; return; }
      var bars = fd.series.slice(-260);
      var closes = bars.map(function (b2) { return b2[1]; });
      var line = (cfg.lineType === 'vwap' ? Q.vwapLine(bars) : null) || Q.emaSeries(closes, cfg.period);
      // Kanal (nur wenn im Wellenreiter-Modus mit Kanal aktiv)
      var chan = null;
      if (cfg.mode === 'wave' && cfg.channel !== false) {
        var wq = Q.waveQuality(bars, cfg.lineType || 'ema', cfg.period, zOf(cfg.confirmBps));
        var chN = Math.max(100, Math.min(320, Math.round(2.5 * ((wq && wq.waveLen) || 72))));
        chan = Q.regressionChannel(Q.degapCloses(bars), Math.min(chN, bars.length - 2));
      }
      var t0 = bars[0][0], t1 = bars[bars.length - 1][0];
      var marks = D.trades.filter(function (t) { return t.sym === sym && t.openT >= t0 && t.openT <= t1; });
      st.textContent = '';
      drawSignalChart(out, bars, line, chan, marks, cfg);
      var info = document.getElementById('scInfo');
      info.innerHTML = 'Leitlinie: <b>' + (cfg.lineType === 'vwap' ? 'VWAP' : 'EMA' + cfg.period) + '</b> · Zeitrahmen ' + (cfg.interval || '5m') +
        (chan ? ' · 📐 Kanal: Position <b>' + Math.round(chan.pos * 100) + ' %</b>, Steigung <b>' + chan.steep + '</b>, Breite ' + chan.widthPct + ' %' : ' · Kanal nur im 🏄 Wellenreiter-Modus') +
        ' · eigene Trades im Bild: <b>' + marks.length + '</b>';
    } catch (e) {
      st.textContent = 'Fehler: ' + (e.message || e);
    } finally {
      btn.disabled = false;
      sigChartRunning = false;
    }
  }

  function drawSignalChart(svg, bars, line, chan, marks, cfg) {
    var W = svg.clientWidth || 900, H = svg.clientHeight || 300;
    var padL = 8, padR = 54, padT = 10, padB = 20;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var closes = bars.map(function (b) { return b[1]; });
    var lo = Math.min.apply(null, closes), hi = Math.max.apply(null, closes);
    if (chan) { lo = Math.min(lo, chan.lower); hi = Math.max(hi, chan.upper); }
    var pad = (hi - lo) * 0.08 || 1;
    lo -= pad; hi += pad;
    var x0 = bars[0][0], x1 = bars[bars.length - 1][0];
    var plotW = W - padL - padR, plotH = H - padT - padB;
    function X(t) { return padL + (t - x0) / Math.max(1, x1 - x0) * plotW; }
    function Y(v) { return H - padB - (v - lo) / (hi - lo) * plotH; }
    var html = '';
    niceTicks(lo, hi, 4).forEach(function (tv) {
      html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(tv).toFixed(1) + '" y2="' + Y(tv).toFixed(1) + '" stroke="var(--grid)" stroke-width="1"></line>' +
        '<text x="' + (padL + 2) + '" y="' + (Y(tv) - 3).toFixed(1) + '" fill="var(--muted)" font-size="9.5">' + fmtTick(tv, hi - lo) + '</text>';
    });
    for (var xi = 0; xi <= 3; xi++) {
      var tx = x0 + (x1 - x0) * xi / 3;
      html += '<text x="' + X(tx).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + (xi === 0 ? 'start' : xi === 3 ? 'end' : 'middle') + '" fill="var(--muted)" font-size="9.5">' + fmtTimeTick(tx, x1 - x0) + '</text>';
    }
    // Trendkanal als Band (Gerade über das gesamte Fenster rekonstruiert)
    if (chan) {
      var n = bars.length, span = Math.min(n - 1, 300);
      var stepPx = plotW / Math.max(1, n - 1);
      var slopePerBar = chan.slopePct / 100 * chan.mid;
      function bandY(i, off) { return Y(chan.mid + off + slopePerBar * (i - (n - 1))); }
      var up = [], dn = [];
      for (var i = 0; i < n; i++) {
        up.push((i ? 'L' : 'M') + (padL + i * stepPx).toFixed(1) + ' ' + bandY(i, 2 * chan.sd).toFixed(1));
        dn.push((padL + (n - 1 - i) * stepPx).toFixed(1) + ' ' + bandY(n - 1 - i, -2 * chan.sd).toFixed(1));
      }
      html += '<path d="' + up.join(' ') + ' L' + dn.join(' L') + ' Z" fill="var(--series3)" opacity="0.10"></path>';
      html += '<path d="' + up.join(' ') + '" fill="none" stroke="var(--series3)" stroke-width="1.5" opacity="0.8"></path>';
      html += '<path d="M' + dn.slice().reverse().join(' L') + '" fill="none" stroke="var(--series3)" stroke-width="1.5" opacity="0.8"></path>';
    }
    // Leitlinie
    if (line && line.length === bars.length) {
      html += '<path d="' + bars.map(function (b, i) { return (i ? 'L' : 'M') + X(b[0]).toFixed(1) + ' ' + Y(line[i]).toFixed(1); }).join(' ') +
        '" fill="none" stroke="var(--series2)" stroke-width="1.5" stroke-dasharray="5 4"></path>';
    }
    // Kurs
    html += '<path d="' + bars.map(function (b, i) { return (i ? 'L' : 'M') + X(b[0]).toFixed(1) + ' ' + Y(b[1]).toFixed(1); }).join(' ') +
      '" fill="none" stroke="var(--series)" stroke-width="2" stroke-linejoin="round"></path>';
    // Eigene Trades: Einstieg ▲/▼, Ausstieg ✕
    (marks || []).forEach(function (t) {
      var ex = X(t.openT), ey = Y(t.entrySpot || bars[0][1]);
      var col = t.dir === 'call' ? 'var(--up)' : 'var(--down)';
      html += '<circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="5" fill="' + col + '" stroke="var(--surface)" stroke-width="2"></circle>' +
        '<text x="' + (ex + 7).toFixed(1) + '" y="' + (ey - 6).toFixed(1) + '" fill="var(--ink-2)" font-size="9.5" font-weight="600">' + (t.dir === 'call' ? 'CALL' : 'PUT') + '</text>';
      if (t.status === 'closed' && t.closeT <= x1 && t.exitSpot) {
        var cx2 = X(t.closeT), cy2 = Y(t.exitSpot);
        html += '<path d="M' + (cx2 - 4).toFixed(1) + ' ' + (cy2 - 4).toFixed(1) + ' L' + (cx2 + 4).toFixed(1) + ' ' + (cy2 + 4).toFixed(1) +
          ' M' + (cx2 + 4).toFixed(1) + ' ' + (cy2 - 4).toFixed(1) + ' L' + (cx2 - 4).toFixed(1) + ' ' + (cy2 + 4).toFixed(1) +
          '" stroke="' + (t.pnl > 0 ? 'var(--up)' : 'var(--down)') + '" stroke-width="2"></path>';
      }
    });
    svg.innerHTML = html;
    svg.__chart = null;
  }

  /* ================= 🧹 Filter-Nutzen: mit vs. ohne Filter ================= */
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
      var modeOpts = labModes(cfg).filter(function (m) { return m.key === (cfg.mode === 'wave' && cfg.channel !== false ? 'wave_ch' : cfg.mode); })[0];
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
        row('🧹 <b>mit</b> deinen Filtern', a2) + row('🔓 <b>ohne</b> Filter (jedes Signal)', b2) + '</table>' +
        '<div style="margin-top:8px; font-size:13px;">Filter-Nutzen: <b class="' + U.signCls(nutzen) + '">' + U.signTxt(nutzen, ' Prozentpunkte' ) + '</b> · ' +
        (nutzen > 0 ? 'Die Filter haben in diesem Zeitraum Geld gespart.' : nutzen < 0 ? 'Achtung: Die Filter haben hier Rendite gekostet – prüfen, welcher zu streng ist.' : 'Kein messbarer Unterschied.') + '</div>' +
        '<div style="color:var(--muted); font-size:11.5px; margin-top:6px;">„Ohne Filter" heißt: kein Kosten-Check, kein Trendfilter, kein Kanal, keine 5-Min-Bestätigung, kein Zeitfenster, keine Qualitätsschwelle – nur das reine Einstiegssignal. Gleiche Kosten, gleicher Zeitraum, gleiche Werte.</div>';
    } catch (e) {
      st.textContent = 'Fehler: ' + (e.message || e);
    } finally {
      btn.disabled = false;
      filterRunning = false;
    }
  }

  /* ================= 🚫 Symbol-Sperre (dauerhafte Verlustbringer) ================= */
  /** Wertet je Symbol die geschlossenen Intraday-Trades aus und sperrt klare Verlustbringer. */
  function updateSymBlocks() {
    if (!D || D.intraday.symBlock === false) return;
    var by = {};
    D.trades.forEach(function (t) {
      if (t.status !== 'closed' || t.strategy !== 'intraday') return;
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
    if (!keys.length) { el.innerHTML = '<span style="color:var(--muted); font-size:12px;">Keine gesperrten Werte.</span>'; return; }
    el.innerHTML = keys.map(function (s) {
      var b2 = D.symBlock[s];
      return '<span class="chip down" style="margin-right:6px;">🚫 ' + U.esc(s) + (b2.n ? ' · ' + b2.n + ' Trades, ' + U.signTxt(b2.pnl, ' $') + ', ' + b2.quote + ' % Treffer' : ' · manuell') +
        ' <a href="#" data-unblock="' + U.esc(s) + '" style="color:var(--ink-2); font-weight:700; margin-left:4px;">✕</a></span>';
    }).join('');
    el.querySelectorAll('[data-unblock]').forEach(function (a2) {
      a2.addEventListener('click', function (ev) {
        ev.preventDefault();
        var s = a2.getAttribute('data-unblock');
        D.symBlock[s] = { manuell: true, frei: true, seit: Date.now() }; // dauerhaft freigegeben
        delete D.symBlock[s];
        D.symFree = D.symFree || {};
        D.symFree[s] = Date.now(); // nicht sofort automatisch wieder sperren
        save(); renderSymBlocks();
      });
    });
  }

  /* ================= 📡 Live-Signal-Monitor ================= */
  function renderSigMonitor() {
    var el = document.getElementById('sigMonitor');
    if (!el) return;
    var syms = Object.keys(SIG);
    if (!syms.length) {
      el.innerHTML = '<div class="empty"><span class="ico">📡</span>Noch kein Scan gelaufen – der Monitor füllt sich, sobald die Intraday-Strategie aktiv ist und die US-Börse geöffnet hat.</div>';
      return;
    }
    syms.sort(function (a2, b2) { return (SIG[b2].score || 0) - (SIG[a2].score || 0); });
    var html = '<table class="tbl"><tr><th>Wert</th><th>Kurs</th><th>Wellen-Score</th><th>z</th><th>Kanal</th><th>Status</th><th>Geprüft</th></tr>';
    syms.slice(0, 30).forEach(function (s) {
      var g = SIG[s];
      html += '<tr><td><b>' + U.esc(s) + '</b></td>' +
        '<td>' + (g.spot != null ? U.nf2.format(g.spot) : '–') + '</td>' +
        '<td>' + (g.score != null ? g.score + '/100' : '–') + '</td>' +
        '<td>' + (g.z != null ? g.z : '–') + '</td>' +
        '<td>' + (g.chanPos != null ? Math.round(g.chanPos * 100) + ' % · Steig. ' + g.chanSteep : '–') + '</td>' +
        '<td class="' + (g.ok ? 'pos' : '') + '">' + U.esc(g.grund || (g.ok ? '✅ gehandelt' : 'kein Signal')) + '</td>' +
        '<td style="color:var(--muted);">' + (g.t ? new Date(g.t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–') + '</td></tr>';
    });
    html += '</table><div style="color:var(--muted); font-size:11.5px; margin-top:6px;">Zeigt für jeden gescannten Wert, was die Strategie zuletzt gesehen hat – und warum sie nicht gehandelt hat. So wird die Geduld-Bilanz nachvollziehbar.</div>';
    el.innerHTML = html;
  }

  /* ================= 🛰 Auto-Tuning-Verlauf & Wirkungs-Ranking ================= */
  /** Bewertet jede automatische Änderung: Ø P/L je Intraday-Trade davor vs. danach. */
  function tuneRanking() {
    var log = (D.tuneLog || []).slice(); // neu → alt
    if (!log.length) return [];
    var closed = D.trades.filter(function (t) { return t.status === 'closed' && t.strategy === 'intraday'; });
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
      if (nach.n < 5) { urteil = '🟡 zu wenig Daten'; cls = ''; }
      else if (delta == null) { urteil = nach.avg > 0 ? '🟢 positiv (kein Vergleich)' : '🔴 negativ (kein Vergleich)'; cls = nach.avg > 0 ? 'pos' : 'neg'; }
      else if (delta > 0.5) { urteil = '🟢 wirkt'; cls = 'pos'; }
      else if (delta < -0.5) { urteil = '🔴 schadet'; cls = 'neg'; }
      else { urteil = '⚪ neutral'; cls = ''; }
      out.push({ e: e, vor: vor, nach: nach, delta: delta, urteil: urteil, cls: cls, laufend: i === 0, idx: i });
    }
    // Rang nach Wirkung (nur bewertbare)
    var rankable = out.filter(function (r) { return r.nach.n >= 5; }).slice()
      .sort(function (a2, b2) { return ((b2.delta != null ? b2.delta : b2.nach.avg) - (a2.delta != null ? a2.delta : a2.nach.avg)); });
    rankable.forEach(function (r, i2) { r.rang = i2 + 1; });
    return out;
  }

  function renderTuneLog() {
    var el = document.getElementById('tuneLog');
    if (!el) return;
    var rows = tuneRanking();
    if (!rows.length) {
      el.innerHTML = '<div class="empty"><span class="ico">🛰</span>Noch keine automatischen Anpassungen. Die stündliche Analyse schreibt Empfehlungen in den Daten-Ordner – die App übernimmt sie hier sichtbar.</div>';
      return;
    }
    var html = '<table class="tbl"><tr><th>Rang</th><th>Wann</th><th>Änderung</th><th>Ø P/L je Trade davor → danach</th><th>Trades danach</th><th>Wirkung</th><th></th></tr>';
    rows.forEach(function (r) {
      var e = r.e;
      html += '<tr' + (r.laufend ? ' style="font-weight:600;"' : '') + '>' +
        '<td>' + (r.rang ? '#' + r.rang : '–') + '</td>' +
        '<td>' + U.dt(e.at) + (r.laufend ? '<br><span style="color:var(--muted); font-weight:400; font-size:11px;">läuft aktuell</span>' : '') + '</td>' +
        '<td>' + (e.applied && e.applied.length ? U.esc(e.applied.join(' · ')) : '<span style="color:var(--muted);">keine Feldänderung</span>') +
          (e.txt ? '<div style="color:var(--muted); font-size:11px; margin-top:2px;">' + U.esc(e.txt) + '</div>' : '') + '</td>' +
        '<td>' + (r.vor.avg != null ? U.signTxt(r.vor.avg, ' $') : '–') + ' → ' + (r.nach.avg != null ? '<b class="' + U.signCls(r.nach.avg) + '">' + U.signTxt(r.nach.avg, ' $') + '</b>' : '–') +
          (r.delta != null ? ' <span class="' + U.signCls(r.delta) + '">(' + U.signTxt(r.delta, ' $') + ')</span>' : '') + '</td>' +
        '<td>' + r.nach.n + (r.nach.win != null ? ' · ' + r.nach.win + ' % Treffer' : '') + '</td>' +
        '<td>' + r.urteil + '</td>' +
        '<td>' + (e.konfigVorher ? '<button class="btn ghost" style="padding:2px 8px; font-size:11px;" data-undo="' + r.idx + '">Rückgängig</button>' : '') + '</td></tr>';
    });
    html += '</table><div style="color:var(--muted); font-size:11.5px; margin-top:8px;">Bewertet wird der durchschnittliche Gewinn je Intraday-Trade im Zeitraum <b>nach</b> der Änderung gegen den Zeitraum davor. Unter 5 Trades ist keine Aussage möglich (🟡). Der Rang sortiert nach Wirkung – so siehst du, welche Anpassungen wirklich etwas gebracht haben.</div>';
    el.innerHTML = html;
    el.querySelectorAll('[data-undo]').forEach(function (b2) {
      b2.addEventListener('click', function () {
        var r = rows[parseInt(b2.getAttribute('data-undo'), 10)];
        if (!r || !r.e.konfigVorher) return;
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
    document.getElementById('aiTitle').textContent = '📋 Analyse-Bericht (Stand: ' + U.dt(r.mtime) + ')';
    document.getElementById('aiBody').innerHTML = U.md(r.body) + '<div class="warn">⚠ Simulation – keine Anlageberatung.</div>';
    window.openModal('aiModalBg');
  }

  /* ================= Analyse-Export (Downloads\Markt-Dashboard-Daten) ================= */
  var lastAnalysisExport = 0;
  function csvString() {
    var head = ['ID', 'Strategie', 'Symbol', 'Typ', 'Eröffnet', 'Geschlossen', 'Stück', 'Basispreis', 'Fällig', 'Einstieg', 'Exit', 'P/L ($)', 'Haltedauer (Min)', 'Exit-Grund', 'Nachgebildet', 'Auslöser'];
    function f(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }
    function num(v) { return v == null ? '' : String(Math.round(v * 10000) / 10000).replace('.', ','); }
    var rows = D.trades.slice().reverse().map(function (t) {
      return [t.id, t.strategy === 'intraday' ? 'Intraday' : 'Stunden', t.sym, t.dir.toUpperCase(),
        new Date(t.openT).toLocaleString('de-DE'), t.closeT ? new Date(t.closeT).toLocaleString('de-DE') : '',
        t.qty, num(t.strike), new Date(t.expiry).toLocaleDateString('de-DE'),
        num(t.entry), num(t.exit), num(t.pnl), t.closeT ? Math.round((t.closeT - t.openT) / 60000) : '',
        t.why || (t.status === 'open' ? 'offen' : ''), t.replicated ? 'ja' : '', t.reason || ''
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
        kiEntscheidungen: D.kiLog || [],
        screener: D.screen || null,
        verlustSerie: D.lossStreak || null,
        equityVerlauf: (D.equityHist || []).slice(-2000),
        sentimentVerlauf: SENT,
        analyseZentrale: D.central || null,
        experimentJournal: D.tuneLog || [],
        letzteAnpassung: D.lastTune || null,
        gesundheit: (function () {
          var h = { appLaeuftSeit: new Date(HEALTH.startedAt).toISOString(), scansGesamt: HEALTH.scans, scanFehler: HEALTH.scanErrors,
            letzterScan: HEALTH.lastScanT ? new Date(HEALTH.lastScanT).toISOString() : null,
            kursAbrufeOk: HEALTH.fetchOk, kursAbrufeFehler: HEALTH.fetchFail,
            kiPruefungenOk: HEALTH.kiOk, kiPruefungenFehler: HEALTH.kiFail,
            capitalOk: HEALTH.capOk, capitalFehler: HEALTH.capFail,
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
      kurse: {
        exportiert: new Date().toISOString(),
        intervall: D.intraday.interval || '5m',
        hinweis: 'bars = Serien des letzten Intraday-Scans [t,close,volumen]; tages = Tagesschluss-Historie [t,close]. Mit engine.js (identische Rechenlogik der App) direkt backtestbar.',
        bars: LASTBARS,
        tages: TAGES_CACHE
      },
      csv: csvString()
    };
    try { return await window.api.exportAnalysis(payload); } catch (e) { return null; }
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
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=' + range + '&interval=1d';
    var res = await window.api.fetchText(url);
    if (!res.ok) return cached ? cached.series : null;
    try {
      var j = JSON.parse(res.body);
      var r = j.chart.result[0];
      var ts = r.timestamp || [];
      var closes = r.indicators.quote[0].close || [];
      var series = [];
      for (var i = 0; i < ts.length; i++) if (closes[i] != null) series.push([ts[i] * 1000, closes[i]]);
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
      return items;
    } catch (e) { return []; }
  }

  /* ================= Spot-Kurs ================= */
  function spotOf(sym, hist) {
    var q = window.Dash && window.Dash.quote(sym);
    if (q && q.price != null) return q.price;
    return hist && hist.length ? hist[hist.length - 1][1] : null;
  }

  /* ================= Handels-Universum (Watchlist) ================= */
  function universe() {
    var base = window.Dash.STOCKS.map(function (s) { return s.y; });
    (D.watchlist || []).forEach(function (w) { if (base.indexOf(w.y) === -1) base.push(w.y); });
    return base;
  }
  /** Scan-Universum: Basis + Watchlist + heutige Screener-Treffer */
  function scanUniverse() {
    var base = universe();
    var today = new Date().toISOString().slice(0, 10);
    if (D.screen && D.screen.day === today && D.intraday.screener) {
      (D.screen.picks || []).forEach(function (p) { if (base.indexOf(p.sym) === -1) base.push(p.sym); });
    }
    return base;
  }

  /* ================= Positions-Bewertung ================= */
  /** Verkaufskurs einer Position – mit dem Spread/Slippage-Aufschlag, der beim Kauf galt */
  function bidOf(pos, spot, now) {
    var v = Q.warrantValue(pos.dir, { strike: pos.strike, expiry: pos.expiry, iv: pos.iv, ratio: Q.RATIO }, spot, now);
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
  function openTrade(sym, dir, spot, vol, scores, reasonBits, now, kiRes) {
    kiRes = kiRes || { factor: 1, note: '', approved: false };
    var w = Q.makeWarrant(dir, spot, vol, now);
    var spx = Q.effSpread(w.iv) + Q.slipOf(w.iv);
    var ask = Q.warrantValue(dir, w, spot, now) * (1 + spx);
    if (ask <= 0.001) return null;
    var qty = Math.floor((equityNow() * BUDGET * (kiRes.factor || 1)) / ask);
    if (qty < 1 || D.cash < qty * ask) return null;
    D.cash -= qty * ask;
    var trade = {
      id: D.nextId++, sym: sym, dir: dir, openT: now, strategy: 'hourly',
      entrySpot: spot, entry: ask, qty: qty, spx: Math.round(spx * 10000) / 10000,
      strike: w.strike, expiry: w.expiry, iv: Math.round(w.iv * 1000) / 1000,
      sl: SL, tp: TP,
      sources: (function () {
        var s0 = { news: scores.news, tech: scores.tech, elliott: scores.elliott };
        if (kiRes.approved) s0.ki = dir === 'call' ? 1 : -1;
        return s0;
      })(),
      reason: (kiRes.note ? kiRes.note.replace(/^ · /, '') + ' · ' : '') + reasonBits.reason,
      scenario: reasonBits.scenario, elliottLabel: reasonBits.elliottLabel,
      status: 'open'
    };
    D.positions.push(trade);
    D.trades.unshift(trade);
    if (D.trades.length > 1000) D.trades = D.trades.slice(0, 1000); // Store schlank halten
    notifyTrade(trade, 'open');
    return trade;
  }

  /** Position sofort schließen (manuelle Notbremse) – inkl. Capital.com-Demo-Spiegelung. */
  async function closeNow(pos) {
    var spot = spotOf(pos.sym) || pos.entrySpot;
    if (pos.capDealId && window.CapAPI && window.CapAPI.enabled()) {
      try { await window.CapAPI.closePosition(pos.capDealId); } catch (e) { /* Demo-Konto optional */ }
    }
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
    var win = pos.pnl > 0;
    // Verlustserien-Zähler (Tilt-Schutz, nur Intraday)
    if (pos.strategy === 'intraday') {
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
    notifyTrade(pos, 'close');
    // Gespiegelte Demo-Position beim Broker ebenfalls schließen
    if (pos.capDealId && window.CapAPI && window.CapAPI.enabled()) {
      window.CapAPI.closePosition(pos.capDealId).then(function (r) {
        pos.why = (pos.why || '') + ' · 🅲 Demo-Position ' + (r.ok ? 'geschlossen' : 'Schließen fehlgeschlagen (' + r.msg + ') – bitte bei Capital.com prüfen');
        save();
      });
    }
  }

  /* ================= Der stündliche KI-Job ================= */
  async function runJob(manual) {
    if (jobRunning || !D) return;
    jobRunning = true;
    var statusEl = document.getElementById('jobStatus');
    var syms = universe();
    var now = Date.now();
    var blackoutEv = (D.intraday.blackout !== 'off' && window.Cal) ? window.Cal.isBlackout(now, 45, 45) : null;
    try {
      for (var i = 0; i < syms.length; i++) {
        var sym = syms[i];
        statusEl.textContent = 'Prüfe ' + sym + ' … (' + (i + 1) + '/' + syms.length + ')';
        var hist = await getHistory(sym, '2y');
        if (!hist || hist.length < 120) continue;
        var spot = spotOf(sym, hist);
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

        var open = null;
        for (var p = 0; p < D.positions.length; p++) if (D.positions[p].sym === sym) open = D.positions[p];

        // Exits prüfen (SL/TP/Zeit/Gegensignal)
        if (open) {
          var bid = bidOf(open, spot, now);
          var ret = bid / open.entry - 1;
          var daysLeft = (open.expiry - now) / 86400000;
          var why = null;
          if (ret <= SL) why = 'Stop-Loss erreicht (' + Math.round(ret * 100) + ' %)';
          else if (ret >= TP) why = 'Take-Profit erreicht (+' + Math.round(ret * 100) + ' %)';
          else if (daysLeft <= 10) why = 'Zeit-Exit: Restlaufzeit unter 10 Tagen (Zeitwertverfall)';
          else if ((open.dir === 'call' && S < -CLOSE_THR) || (open.dir === 'put' && S > CLOSE_THR)) {
            why = 'Gegensignal (Gesamtscore ' + S.toFixed(2) + (sent.top ? '; Auslöser u. a.: „' + sent.top.title.slice(0, 90) + '“' : '') + ')';
          }
          if (why) closeTrade(open, spot, now, why);
        } else if (Math.abs(S) >= OPEN_THR && !blackoutEv && canOpen(equityNow()).ok) {
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
          var kiH = await kiCheck({
            symbol: sym, richtung: dir === 'call' ? 'LONG (Call)' : 'SHORT (Put)', modus: 'stunden-strategie', zeitrahmen: 'Tagesdaten',
            gesamtScore: Math.round(S * 100) / 100, teilScores: scores,
            elliott: { zaehlung: ell.label, konfidenz: ell.conf, alternative: ell.alt },
            topSchlagzeile: sent.top ? sent.top.title : 'keine',
            eventIn24h: (window.Cal && window.Cal.within24h().length) ? window.Cal.within24h()[0].name : 'nein',
            tagesPnlPct: D.dayStartEq ? Math.round((equityNow() / D.dayStartEq - 1) * 10000) / 100 : 0
          });
          if (kiH.go) openTrade(sym, dir, spot, vol, scores, { reason: reason, scenario: scenario, elliottLabel: ell.label }, now, kiH);
          else patienceAdd('KI-Veto (Stunden-Strategie)', sym);
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

  var INTERVAL_CFG = {
    '1m':  { range: '1d',  btRange: '5d',  barMin: 1 },
    '5m':  { range: '5d',  btRange: '1mo', barMin: 5 },
    '15m': { range: '5d',  btRange: '1mo', barMin: 15 },
    '60m': { range: '1mo', btRange: '3mo', barMin: 60 }
  };

  /** z-Score-Schwelle aus der Bestätigungs-Einstellung (Rücksetzer-Modus) */
  function zOf(confirmBps) { return confirmBps <= 5 ? 1.5 : confirmBps <= 15 ? 2.0 : 2.5; }

  /** Modus-abhängige Handelsparameter */
  function slOf(c) { return c.scalpSL === 'auto' ? 'auto' : -(c.scalpSL || 20) / 100; }
  function modeParams() {
    var c = D.intraday;
    if (c.mode === 'orb') {
      return {
        exitMode: 'confirmed', sl: slOf(c) === 'auto' ? 'auto' : slOf(c), tp: null,
        trail: 0.15, maxHoldMin: 0,
        cooldownMin: 10, maxPerDay: 10, scanMs: 60000
      };
    }
    if (c.mode === 'waves') {
      return {
        exitMode: 'recross', sl: slOf(c), tp: null,
        trail: (c.scalpTrail || 0) / 100, maxHoldMin: c.scalpHold || 0,
        cooldownMin: 5, maxPerDay: 40, scanMs: 90000
      };
    }
    if (c.mode === 'reversion') {
      return {
        exitMode: 'target', sl: slOf(c), tp: null,
        trail: 0, maxHoldMin: c.scalpHold || 60,
        cooldownMin: 5, maxPerDay: 40, scanMs: 90000
      };
    }
    if (c.mode === 'wave') {
      return {
        exitMode: 'crest', sl: slOf(c), tp: null,
        trail: 0, maxHoldMin: c.scalpHold || 60,
        cooldownMin: 3, maxPerDay: 40, scanMs: 60000
      };
    }
    return { exitMode: 'confirmed', sl: c.sl, tp: c.tp, trail: 0, maxHoldMin: 0, cooldownMin: c.cooldownMin, maxPerDay: c.maxPerDay, scanMs: 5 * 60000 };
  }

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
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=' + (btMode ? ic.btRange : ic.range) + '&interval=' + interval;
    var res = await window.api.fetchText(url);
    if (!res.ok) return null;
    try {
      var r = JSON.parse(res.body).chart.result[0];
      var q = r.indicators.quote[0];
      var ts = r.timestamp || [], closes = q.close || [], vols = q.volume || [];
      var series = [];
      var dollarSum = 0, days = {};
      for (var i = 0; i < ts.length; i++) {
        if (closes[i] == null) continue;
        series.push([ts[i] * 1000, closes[i], vols[i] || 0]);
        if (vols[i]) { dollarSum += vols[i] * closes[i]; days[new Date(ts[i] * 1000).toISOString().slice(0, 10)] = 1; }
      }
      var nDays = Object.keys(days).length || 1;
      return series.length > 30 ? { series: series, dollarVolDay: dollarSum / nDays } : null;
    } catch (e) { return null; }
  }

  function isNearUsClose() {
    var now = new Date();
    var mins = now.getUTCHours() * 60 + now.getUTCMinutes();
    return mins >= 19 * 60 + 45 && mins < 21 * 60; // ~15 Min vor US-Schluss (Sommerzeit)
  }

  async function intradayScan() {
    if (intradayScanning || !D || !D.intraday.enabled) return;
    if (!window.Dash.marketOpen()) return;
    intradayScanning = true;
    var cfg = D.intraday;
    // Wellen-Screener: einmal täglich vor dem ersten Scan die besten Kandidaten holen
    if (cfg.screener && (!D.screen || D.screen.day !== new Date().toISOString().slice(0, 10))) {
      intradayScanning = false;
      await runScreener(false);
      intradayScanning = true;
    }
    var st = document.getElementById('idStatus');
    var now = Date.now();
    var today = new Date().toISOString().slice(0, 10);
    if (D.intradayDay !== today) { D.intradayDay = today; D.intradayCount = 0; }
    var syms = scanUniverse();
    var nearClose = isNearUsClose();
    var blackout = (cfg.blackout !== 'off' && window.Cal) ? window.Cal.isBlackout(now, 45, 45) : null;
    var flattenEv = (cfg.blackout === 'flat' && window.Cal) ? window.Cal.upcoming(15) : null;
    try {
      st.textContent = 'Lade Kurse (' + syms.length + ' Werte parallel) …';
      var fds = await pmap(syms, function (sy) { return fetchIntraday(sy, cfg.interval || '5m', false); }, 6);
      HEALTH.scans++; HEALTH.lastScanT = now;
      HEALTH.scanTimes.push(now); if (HEALTH.scanTimes.length > 400) HEALTH.scanTimes = HEALTH.scanTimes.slice(-400);
      fds.forEach(function (f, fi) {
        if (f && f.series) { HEALTH.fetchOk++; LASTBARS[syms[fi]] = f.series.slice(-420); }
        else HEALTH.fetchFail++;
      });
      for (var i = 0; i < syms.length; i++) {
        var sym = syms[i];
        st.textContent = 'Scan ' + sym + ' (' + (i + 1) + '/' + syms.length + ') …';
        var fd = fds[i];
        if (!fd) continue;
        var bars = fd.series;
        var spot = bars[bars.length - 1][1];
        var sig = Q.signalCross(bars, cfg.lineType || 'ema', cfg.period, cfg.confirmBps);
        var liquid = !cfg.minDollarVol || fd.dollarVolDay == null || fd.dollarVolDay >= cfg.minDollarVol * 1e6;
        SIG[sym] = { t: now, spot: spot, ok: false, grund: 'kein Signal', score: null, z: null, chanPos: null, chanSteep: null };
        if (D.symBlock && D.symBlock[sym]) { patienceAdd('Symbol gesperrt (Verlustbringer)', sym); continue; }

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
          if (!openedToday) why = 'Übernacht-Glattstellung (App war zum Handelsschluss geschlossen)';
          else if (flattenEv) why = 'Event-Glattstellung vor: ' + flattenEv.name;
          else if (ret <= xSL) why = 'Stop-Loss erreicht (' + Math.round(ret * 100) + ' %)';
          else if (xTP !== null && ret >= xTP) why = 'Take-Profit erreicht (+' + Math.round(ret * 100) + ' %)';
          else if (open.trail && open.peak > open.entry && bid <= open.peak * (1 - open.trail)) why = 'Trailing-Stop: −' + Math.round(open.trail * 100) + ' % vom Hoch (Gewinn gesichert)';
          else if (open.maxHoldMin && now - open.openT >= open.maxHoldMin * 60000) why = 'Max-Haltedauer ' + open.maxHoldMin + ' Min erreicht';
          else if (nearClose) why = 'Tagesschluss-Glattstellung (kein Übernacht-Risiko)';
          else if (xm === 'crest') {
            if (open.chN) { // Kanal-Exits (Wellenreiter mit Trendkanal, Übernacht-Gaps herausgerechnet)
              var chM = Q.regressionChannel(Q.degapCloses(bars), open.chN);
              if (chM) {
                if (open.dir === 'call' && chM.pos >= 0.80) why = 'Kanaloberkante erreicht – Ziel (Position ' + Math.round(chM.pos * 100) + ' % im Kanal)';
                else if (open.dir === 'put' && chM.pos <= 0.20) why = 'Kanalunterkante erreicht – Ziel (Position ' + Math.round(chM.pos * 100) + ' % im Kanal)';
                else if (open.dir === 'call' && chM.pos <= -0.125) why = 'Kanalbruch nach unten – Schutz-Exit (mögl. Trendwechsel)';
                else if (open.dir === 'put' && chM.pos >= 1.125) why = 'Kanalbruch nach oben – Schutz-Exit (mögl. Trendwechsel)';
              }
            }
            if (!why) {
              var zc = (Q.reversionSignal(bars, cfg.lineType || 'ema', cfg.period, 1e9).z) || 0;
              if ((open.dir === 'call' && zc >= zOf(cfg.confirmBps) * 0.8) || (open.dir === 'put' && zc <= -zOf(cfg.confirmBps) * 0.8)) why = 'Wellenkamm erreicht – Überdehnung auf der Gegenseite (z ' + zc + ')';
            }
          } else if (xm === 'target') {
            if ((open.dir === 'call' && sig.above) || (open.dir === 'put' && !sig.above)) why = 'Ziel erreicht: Rückkehr zur Leitlinie';
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
        var isRev = cfg.mode === 'reversion';
        var isWave = cfg.mode === 'wave';
        var isOrb = cfg.mode === 'orb';
        var dir = null, revZ = null, waveQ = null, chE = null, chN = 0, orbInfo = null;
        var useChan = isWave && cfg.channel !== false;
        if (isOrb) {
          // Opening-Range-Breakout: Range der ersten 30 Min, 1 Trade je Richtung/Tag
          var tb = bars.filter(function (b) { return new Date(b[0]).toISOString().slice(0, 10) === today; });
          if (tb.length >= 3) {
            var t0b = tb[0][0];
            var rb = tb.filter(function (b) { return b[0] - t0b < 30 * 60000; });
            if (rb.length >= 3 && tb[tb.length - 1][0] - t0b >= 30 * 60000) {
              var orbHi = -Infinity, orbLo = Infinity;
              rb.forEach(function (b) { if (b[1] > orbHi) orbHi = b[1]; if (b[1] < orbLo) orbLo = b[1]; });
              var confO = (cfg.confirmBps || 15) / 10000;
              if (!D.orb || D.orb.day !== today) D.orb = { day: today, traded: {} };
              if (spot > orbHi * (1 + confO) && !D.orb.traded[sym + '|call']) { dir = 'call'; D.orb.traded[sym + '|call'] = true; orbInfo = { hi: orbHi, lo: orbLo }; }
              else if (spot < orbLo * (1 - confO) && !D.orb.traded[sym + '|put']) { dir = 'put'; D.orb.traded[sym + '|put'] = true; orbInfo = { hi: orbHi, lo: orbLo }; }
            }
          }
        } else if (isWave) {
          var wq = Q.waveQuality(bars, cfg.lineType || 'ema', cfg.period, zOf(cfg.confirmBps));
          SIG[sym].score = wq.score; SIG[sym].z = wq.z;
          if (wq.signal && wq.score >= 60) { dir = wq.signal; revZ = wq.z; waveQ = wq; }
          else if (wq.signal) patienceAdd('Wellen-Qualität zu niedrig (' + wq.score + '/100)', sym);
          if (dir && useChan) {
            // Kanal-Fenster: 2,5 gemessene Wellenlängen (nie ≈ 1 Wellenperiode – Verzerrungsgefahr)
            chN = Math.max(100, Math.min(320, Math.round(2.5 * (wq.waveLen || 72))));
            chE = Q.regressionChannel(Q.degapCloses(bars), chN);
            if (chE) { SIG[sym].chanPos = chE.pos; SIG[sym].chanSteep = chE.steep; }
            if (!chE) dir = null; // zu wenig Historie für den Kanal
            else if (dir === 'call' && (chE.pos > 0.30 || chE.steep < -0.8)) { patienceAdd('Kanal: Lage/Gegensteigung', sym); dir = null; }  // nur an der Unterkante, nie gegen einen klaren Abwärtskanal
            else if (dir === 'put' && (chE.pos < 0.70 || chE.steep > 0.8)) { patienceAdd('Kanal: Lage/Gegensteigung', sym); dir = null; }    // nur an der Oberkante, nie gegen einen klaren Aufwärtskanal
          }
        } else if (isRev) {
          var rsig = Q.reversionSignal(bars, cfg.lineType || 'ema', cfg.period, zOf(cfg.confirmBps));
          if (rsig.signal) { dir = rsig.signal; revZ = rsig.z; }
        } else if (sig.crossed) {
          dir = sig.crossed === 'up' ? 'call' : 'put';
        }
        if (!dir) continue;
        if (nearClose) { patienceAdd('Tagesschluss steht bevor', sym); continue; }
        if (blackout) { patienceAdd('Event-Blackout', sym); continue; } // FOMC/CPI/NFP ±45 Min
        if ((cfg.avoidHours || []).length) {
          var hourB = parseInt(new Date(now).toLocaleString('de-DE', { hour: '2-digit', hour12: false, timeZone: 'Europe/Berlin' }), 10);
          if (cfg.avoidHours.indexOf(hourB) !== -1) { patienceAdd('Meide-Stunde (Analyse-Zentrale)', sym); continue; }
        }
        if (!Q.inWindow(now, cfg.window || 'all')) { patienceAdd('Außerhalb des Zeitfensters', sym); continue; }
        if (!liquid) { patienceAdd('Zu wenig Liquidität', sym); continue; }
        if (D.intradayCount >= mp.maxPerDay) { patienceAdd('Tageslimit erreicht', sym); continue; }
        if (!canOpen(equityNow()).ok) { patienceAdd('Risiko-Limit', sym); continue; } // Risikomanagement
        // 5-Min-Bestätigung für 1-Min-Signale (Multi-Timeframe)
        if (cfg.mtf !== false && (cfg.interval || '5m') === '1m' && !Q.mtfAgrees(bars, dir, 5)) { patienceAdd('5-Min-Chart widerspricht', sym); continue; }
        // Verlustserien-Drossel (Tilt-Schutz)
        var lsN = (D.lossStreak && D.lossStreak.day === today) ? D.lossStreak.n : 0;
        if (lsN >= 5) { patienceAdd('Verlustserie (5+) – Pause bis Tagesende', sym); continue; }
        var lsFactor = lsN >= 3 ? 0.5 : 1;
        if (isWave || (!isRev && cfg.trendFilter)) { // Trend: beim Wellenreiter Pflicht, sonst optional
          if (chE) {
            // Kanal-Steigung als Regime-Filter: nur in Richtung des Kanals handeln
            if (dir === 'call' && chE.steep < 0.3) { patienceAdd('Regime: Kanal nicht aufwärts', sym); continue; }
            if (dir === 'put' && chE.steep > -0.3) { patienceAdd('Regime: Kanal nicht abwärts', sym); continue; }
          } else {
            var tc = bars.slice(-240).map(function (b) { return b[1]; });
            if (tc.length >= 100) {
              var e100 = Q.emaSeries(tc, 100);
              if (isWave) {
                // Wellen-Tal liegt naturgemäß oft UNTER der EMA100 – es zählt die EMA-Richtung
                var rising = e100[e100.length - 1] > e100[Math.max(0, e100.length - 9)];
                if ((dir === 'call' && !rising) || (dir === 'put' && rising)) { patienceAdd('Gegen den Trend (EMA100)', sym); continue; }
              } else {
                var up100 = spot > e100[e100.length - 1];
                if ((dir === 'call' && !up100) || (dir === 'put' && up100)) { patienceAdd('Gegen den Trend (EMA100)', sym); continue; }
              }
            }
          }
        }
        var barMin = (INTERVAL_CFG[cfg.interval] || INTERVAL_CFG['5m']).barMin;
        var effCooldown = Math.max(mp.cooldownMin, barMin * 2) * 60000;
        if (D.intradayCooldown[sym] && now - D.intradayCooldown[sym] < effCooldown) { patienceAdd('Cooldown (Straßenbahn-Regel)', sym); continue; }
        var prof = Q.PROFILES[cfg.profile] || Q.PROFILES.atm21;
        var closes5 = bars.map(function (b) { return b[1]; });
        var iv = Math.min(1.5, Math.max(0.15, Q.histVolIntraday(closes5, Math.round(390 / barMin)) * 1.1));
        var strike = Math.round(spot * (1 + (dir === 'call' ? prof.otmPct : -prof.otmPct)) * 100) / 100;
        var w = { strike: strike, expiry: now + prof.days * 86400000, iv: iv, ratio: Q.RATIO };
        var spx2 = Q.effSpread(iv) + Q.slipOf(iv);
        var ask = Q.warrantValue(dir, w, spot, now) * (1 + spx2);
        if (ask <= 0.001) continue;
        // Kosten-Breakeven-Filter: lohnt sich der Trade nach Kosten überhaupt?
        var omegaPre = Q.warrantOmega(dir, w, spot, now);
        // Not-Stop: fix oder „atmend“ (Volatilität × Hebel)
        var slT = mp.sl === 'auto' ? Q.autoStop(bars.map(function (b) { return b[1]; }), omegaPre, (mp.maxHoldMin || 60) / barMin) : mp.sl;
        var budgetAbs = Math.max(1, equityNow() * cfg.budgetPct);
        var roundTrip = 2 * spx2 + (2 * (cfg.orderFee || 0)) / budgetAbs;
        var closes5 = bars.map(function (b) { return b[1]; });
        var ec;
        if (chE) {
          // Kanal-Edge: Der Weg bis zur Gegenkante muss die Kosten decken.
          var toEdge = dir === 'call' ? chE.toUpperPct : chE.toLowerPct;
          var needPctC = omegaPre > 0 ? (roundTrip / omegaPre) * 100 : Infinity;
          ec = { ok: toEdge >= needPctC * 1.5, havePct: Math.round(toEdge * 100) / 100, needPct: Math.round(needPctC * 100) / 100 };
        } else {
          ec = Q.edgeCheck(closes5, (mp.maxHoldMin || 60) / barMin, roundTrip, omegaPre, 1.5);
        }
        if (!ec.ok) { patienceAdd('Kosten-Check: Bewegung deckt Kosten nicht', sym); continue; }
        // 🧠 Lokale KI als letzte Prüfinstanz (Veto/Boost)
        var trendUp = (function () { var tc2 = bars.slice(-240).map(function (b) { return b[1]; }); if (tc2.length < 100) return '?'; var e2 = Q.emaSeries(tc2, 100); return spot > e2[e2.length - 1] ? 'aufwärts' : 'abwärts'; })();
        var ki = await kiCheck({
          symbol: sym, richtung: dir === 'call' ? 'LONG (Call)' : 'SHORT (Put)', modus: cfg.mode, zeitrahmen: cfg.interval,
          hebel: Math.round(omegaPre * 10) / 10,
          stopPct: Math.round(slT * 100),
          uhrzeitBerlin: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }),
          wochentag: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date().getDay()],
          zScore: revZ, wellenScore: waveQ ? waveQ.score : undefined, scoreTeile: waveQ ? waveQ.parts : undefined,
          trendEMA100: trendUp,
          trendkanal: chE ? { positionImKanal: Math.round(chE.pos * 100) + ' %', steigung: chE.steep, breitePct: chE.widthPct } : undefined,
          letzteBewegungenPct: bars.slice(-10).map(function (b) { return Math.round((b[1] / spot - 1) * 10000) / 100; }),
          kostenCheck: { typischeBewegungPct: ec.havePct, noetigPct: ec.needPct },
          eventIn24h: (window.Cal && window.Cal.within24h().length) ? window.Cal.within24h()[0].name : 'nein',
          tagesPnlPct: D.dayStartEq ? Math.round((equityNow() / D.dayStartEq - 1) * 10000) / 100 : 0
        });
        if (!ki.go) { patienceAdd('KI-Veto', sym); continue; }
        var fee = cfg.orderFee || 0;
        var qty;
        var sizingR = parseFloat(cfg.sizing);
        if (sizingR > 0) {
          // Positionsgröße nach Risiko: ausgelöster Stop kostet ~sizingR % vom Depot
          qty = Math.floor((equityNow() * sizingR / 100 * (ki.factor || 1) * lsFactor) / (ask * Math.max(0.08, Math.abs(slT))));
          var qMax = Math.floor((equityNow() * Math.max(cfg.budgetPct * 3, 0.10)) / ask);
          if (qty > qMax) qty = qMax;
        } else {
          qty = Math.floor((equityNow() * cfg.budgetPct * (ki.factor || 1) * lsFactor) / ask);
        }
        var cost = qty * ask + fee;
        if (qty < 1 || D.cash < cost) continue;
        D.cash -= cost;
        var omega = Q.warrantOmega(dir, w, spot, now);
        var aufgeld = Q.warrantAufgeld(dir, w, spot, now);
        var isWaves = D.intraday.mode === 'waves';
        var trade = {
          id: D.nextId++, sym: sym, dir: dir, openT: now, strategy: 'intraday',
          entrySpot: spot, entry: ask, qty: qty, cost: cost, orderFee: fee, spx: Math.round(spx2 * 10000) / 10000,
          strike: w.strike, expiry: w.expiry, iv: Math.round(iv * 1000) / 1000,
          omega: Math.round(omega * 10) / 10,
          sl: slT, tp: mp.tp, trail: mp.trail || 0, maxHoldMin: mp.maxHoldMin || 0, exitMode: mp.exitMode, peak: ask, chN: chN || 0,
          sources: ki.approved ? { intraday: dir === 'call' ? 1 : -1, ki: dir === 'call' ? 1 : -1 } : { intraday: dir === 'call' ? 1 : -1 },
          reason: ki.note.replace(/^ · /, '') + (ki.note ? ' · ' : '') + (isOrb
              ? '🚀 ORB: Ausbruch aus der Eröffnungs-Range (' + U.nf2.format(orbInfo.lo) + '–' + U.nf2.format(orbInfo.hi) + ', 30 Min) nach ' + (dir === 'call' ? 'OBEN' : 'UNTEN') + ' bei ' + U.nf2.format(spot) + '. '
              : isWave
              ? '🏄 Wellenreiter: Tal erkannt (z ' + revZ + ', ' + barMin + '-Min) bei ' + U.nf2.format(spot) + ' · Wellen-Score ' + waveQ.score + '/100 (Rhythmus ' + waveQ.parts.rhythmus + ' · Amplitude ' + waveQ.parts.amplitude + ' · Tiefe ' + waveQ.parts.tiefe + ' · Umkehr ' + waveQ.parts.umkehr + ' · Volumen ' + waveQ.parts.volumen + ')' + (chE ? ' · 📐 Kanal (' + chN + ' Bars): Position ' + Math.round(chE.pos * 100) + ' %, Steigung ' + chE.steep + ', Breite ' + chE.widthPct + ' %' : '') + '. '
              : isRev
              ? '🔄 Rücksetzer: Kurs überdehnt ' + (dir === 'call' ? 'UNTER' : 'ÜBER') + ' der ' + (cfg.lineType === 'vwap' ? 'VWAP' : 'EMA' + cfg.period) + ' (z-Score ' + revZ + ', ' + barMin + '-Min-Chart) bei ' + U.nf2.format(spot) + '. '
              : (isWaves ? '🌊 Wellen-Scalp: ' : 'Intraday: ') + 'Kurs kreuzt ' + (cfg.lineType === 'vwap' ? 'VWAP' : 'EMA' + cfg.period) + ' (' + barMin + '-Min-Chart) nach ' + (dir === 'call' ? 'OBEN' : 'UNTEN') + ' bei ' + U.nf2.format(spot) + ' (Abstand ' + (sig.distBps / 100).toFixed(2) + ' %). ') +
            'Schein: ' + prof.name + ', Hebel ~' + omega.toFixed(1) + 'x, Aufgeld ' + aufgeld.toFixed(1) + ' %, ' +
            'Tagesumsatz ~' + Math.round(fd.dollarVolDay / 1e6) + ' Mio $ · Kosten-Check: Bewegung ' + ec.havePct + ' % vs. nötig ' + ec.needPct + ' %',
          scenario: isOrb
            ? 'Szenario: Ausbruch aus der Eröffnungs-Range läuft in Ausbruchsrichtung weiter (max. 1 Trade je Richtung/Tag). Exit: Trailing-Stop −15 % vom Hoch, Not-SL, Glattstellung zum Tagesschluss.'
            : isWave
            ? (chE
              ? 'Szenario: Welle von der Kanalunterkante bis zur Oberkante reiten (Regressionskanal, ' + chN + ' Bars). Exit: Gegenkante erreicht (Ziel), Kanalbruch (Schutz), Wellenkamm-Überdehnung, Not-SL, max. Haltedauer, Glattstellung zum Tagesschluss. Nur in Kanalrichtung (Steigungs-Regime).'
              : 'Szenario: Welle vom Tal bis zum Kamm reiten. Exit: Überdehnung auf der Gegenseite (Wellenkamm), Not-SL, max. Haltedauer, Glattstellung zum Tagesschluss. Nur in Trendrichtung (EMA100).')
            : isRev
            ? 'Szenario: Rückkehr zur Leitlinie (Mean-Reversion). Exit: Linien-Berührung (Ziel), Not-SL, max. Haltedauer, Glattstellung zum Tagesschluss.'
            : isWaves
              ? 'Szenario: eine Welle mitnehmen. Exit: Rückkreuzung der Leitlinie (Wellen-Ende), Trailing-Stop vom Hoch, max. Haltedauer, Not-SL, Glattstellung zum Tagesschluss.'
              : 'Szenario: kurzfristige ' + (dir === 'call' ? 'Aufwärts' : 'Abwärts') + 'bewegung nach Durchbruch. Exit-Regeln: Stop-Loss −25 % / Take-Profit +35 %, Gegen-Durchbruch, Glattstellung zum Tagesschluss.',
          status: 'open'
        };
        D.positions.push(trade);
        D.trades.unshift(trade);
        notifyTrade(trade, 'open');
        // Spiegelung auf dem Capital.com-Demo-Konto (CFD-Paper-Trade mit Stop-Loss)
        if (window.CapAPI && window.CapAPI.enabled()) {
          (function (tr, spotNow) {
            var wRef = { strike: tr.strike, expiry: tr.expiry, iv: tr.iv, ratio: Q.RATIO };
            var slLvl = Q.underlyingAtTarget(tr.dir, wRef, tr.entry * (1 + tr.sl), Date.now(), spotNow);
            var tpLvl = tr.tp != null ? Q.underlyingAtTarget(tr.dir, wRef, tr.entry * (1 + tr.tp), Date.now(), spotNow) : null;
            var sizeC = Math.max(0.1, Math.round((equityNow() * cfg.budgetPct * 5 / spotNow) * 10) / 10);
            window.CapAPI.openPosition(tr.sym, tr.dir, sizeC, slLvl, tpLvl).then(function (r) {
              if (r.ok) { HEALTH.capOk++; } else { HEALTH.capFail++; }
              if (r.ok) { tr.capDealId = r.dealId; tr.reason += ' · 🅲 Demo-Konto: ' + (tr.dir === 'call' ? 'BUY' : 'SELL') + ' ' + sizeC + '× ' + (r.epic || tr.sym) + ' (SL ' + U.nf2.format(slLvl) + ')'; }
              else { tr.reason += ' · 🅲 Demo-Order fehlgeschlagen: ' + (r.msg || '?'); }
              save(); render();
            });
          })(trade, spot);
        }
        SIG[sym] = { t: now, spot: spot, ok: true, grund: '✅ Trade eröffnet (' + (dir === 'call' ? 'CALL' : 'PUT') + ')', score: waveQ ? waveQ.score : null, z: revZ, chanPos: chE ? chE.pos : null, chanSteep: chE ? chE.steep : null };
        D.intradayCooldown[sym] = now;
        D.intradayCount++;
      }
      D.intradayLastScan = now;
      updateSymBlocks();
      renderSigMonitor();
      renderSymBlocks();
      await save();
      st.textContent = 'Letzter Scan: ' + new Date(now).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr · Trades heute: ' + D.intradayCount + '/' + cfg.maxPerDay;
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
    if (!D) return;
    var now = Date.now();
    var eq = equityNow();
    var invested = eq - D.cash;
    var pnlTotal = eq - START_CAPITAL;
    var closed = D.trades.filter(function (t) { return t.status === 'closed'; });
    var wins = closed.filter(function (t) { return t.pnl > 0; }).length;

    var dayDelta = D.dayStartEq > 0 ? (eq / D.dayStartEq - 1) * 100 : 0;
    document.getElementById('depotStats').innerHTML =
      tile('Depotwert', U.money(eq), null, U.signTxt(pnlTotal / START_CAPITAL * 100, ' %') + ' seit Start', pnlTotal) +
      tile('Cash', U.money(D.cash), null) +
      tile('In Scheinen', U.money(invested), null, eq > 0 ? Math.round(invested / eq * 100) + ' % vom Depot' : null, 0) +
      tile('Gesamt-P/L', U.signTxt(pnlTotal, ' $'), pnlTotal, 'heute ' + U.signTxt(dayDelta, ' %'), dayDelta) +
      tile('Trades (Trefferquote)', closed.length + (closed.length ? ' (' + Math.round(wins / closed.length * 100) + ' %)' : ''), null);

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
    var hs = document.getElementById('hourlyState');
    if (hs) { var hOn = D.hourlyEnabled !== false; hs.textContent = hOn ? 'aktiv' : 'aus'; hs.className = 'state ' + (hOn ? 'on' : 'off'); }
    var is2 = document.getElementById('idState');
    if (is2) { is2.textContent = D.intraday.enabled ? 'aktiv' : 'aus'; is2.className = 'state ' + (D.intraday.enabled ? 'on' : 'off'); }

    // KI-Karte: Status & Entscheidungs-Log
    var ks = document.getElementById('kiState');
    if (ks) {
      var kiOn = !!(window.LocalKI && window.LocalKI.vetoEnabled());
      ks.textContent = kiOn ? 'aktiv' : 'aus';
      ks.className = 'state ' + (kiOn ? 'on' : 'off');
      var kl = document.getElementById('kiLog');
      if (kl) {
        kl.innerHTML = (D.kiLog && D.kiLog.length)
          ? '<div style="color:var(--muted); margin-bottom:3px;">Letzte KI-Entscheidungen:</div>' + D.kiLog.slice(0, 8).map(function (e0) {
            var veto = e0.e === 'Veto';
            return '<div style="padding:2px 0; border-top:1px solid var(--grid);">' +
              new Date(e0.t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' · <b>' + U.esc(e0.sym) + '</b> ' +
              '<span class="' + (veto ? 'neg' : 'pos') + '">' + U.esc(e0.e) + '</span> – ' + U.esc(e0.b || '') + '</div>';
          }).join('')
          : (kiOn ? '<span style="color:var(--muted);">Noch keine Entscheidungen – kommt mit dem nächsten Signal.</span>' : '');
      }
    }

    // Kalender-Warnung (marktbewegende Termine in <24 h)
    var cw = document.getElementById('calWarn');
    if (cw && window.Cal) {
      var evs = window.Cal.within24h();
      cw.innerHTML = evs.length
        ? '<div class="simnote" style="color:var(--down); font-weight:600;">🔴 ' + evs.map(function (e) {
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
      rs.textContent = 'Heute: ' + U.signTxt(dayPct, ' %') + ' · In Scheinen: ' + Math.round(expo) + ' % · Positionen: ' + D.positions.length + '/' + ((D.risk && D.risk.maxPos) || 8) + (co.ok ? '' : ' · ⛔ ' + co.why);
      rb.textContent = co.ok ? 'ok' : 'Stopp';
      rb.className = 'state ' + (co.ok ? 'on' : 'off');
    }

    function tile(name, val, sign, delta, deltaSign) {
      return '<div class="tile"><div class="name">' + name + '</div><div class="val' + (sign != null ? ' ' + U.signCls(sign) : '') + '" style="font-size:17px;">' + val + '</div>' +
        (delta ? '<div class="delta ' + (deltaSign ? U.signCls(deltaSign) : '') + '">' + delta + '</div>' : '') + '</div>';
    }

    // Positionen
    var ph = '';
    if (D.positions.length) {
      ph = '<table class="tbl"><tr><th>Wert</th><th>Typ</th><th>Basispreis</th><th>Fällig</th><th>IV</th><th>Hebel</th><th>Stück</th><th>Einstieg</th><th>Aktuell</th><th>P/L</th><th></th></tr>';
      D.positions.forEach(function (p) {
        var spot = spotOf(p.sym) || p.entrySpot;
        var wobj = { strike: p.strike, expiry: p.expiry, iv: p.iv, ratio: Q.RATIO };
        var bid = bidOf(p, spot, now);
        var omegaNow = Q.warrantOmega(p.dir, wobj, spot, now);
        var aufgeldNow = Q.warrantAufgeld(p.dir, wobj, spot, now);
        var ret = bid / p.entry - 1;
        ph += '<tr><td><b>' + U.esc(p.sym) + '</b>' + (p.strategy === 'intraday' ? ' <span title="Intraday-Strategie">⚡</span>' : '') + '</td>' +
          '<td><span class="badge ' + p.dir + '">' + (p.dir === 'call' ? 'CALL' : 'PUT') + '</span></td>' +
          '<td>' + U.nf2.format(p.strike) + '</td>' +
          '<td>' + U.d(p.expiry) + '</td>' +
          '<td>' + Math.round(p.iv * 100) + ' %</td>' +
          '<td title="Aufgeld aktuell: ' + aufgeldNow.toFixed(1) + ' %">' + omegaNow.toFixed(1) + 'x</td>' +
          '<td>' + p.qty + '</td>' +
          '<td>' + U.nf2.format(p.entry) + ' $</td>' +
          '<td>' + U.nf2.format(bid) + ' $</td>' +
          '<td class="' + U.signCls(ret) + '">' + U.signTxt(ret * 100, ' %') + '</td>' +
          '<td style="white-space:nowrap;"><button class="btn ghost" style="padding:2px 8px; font-size:11px;" data-ticket="' + p.id + '" title="Order-Daten zum Nachbilden">📋 Nachbilden</button> ' +
          '<button class="btn ghost" style="padding:2px 8px; font-size:11px;" data-closepos="' + p.id + '">Schließen</button></td></tr>';
      });
      ph += '</table><div style="color:var(--muted); font-size:11px; margin-top:6px;">Stunden-Strategie: SL −40 % / TP +80 %, Zeit-Exit 10 Tage vor Fälligkeit. ⚡ Intraday: SL −25 % / TP +35 %, Glattstellung zum Tagesschluss. Bezugsverhältnis 0,1 · Spread 2 % · Ordergebühr je Kauf/Verkauf simuliert. Hebel = Omega (Maus über den Wert zeigt das aktuelle Aufgeld).</div>';
    } else {
      ph = '<div class="empty"><span class="ico">💼</span>Keine offenen Positionen. Unter „🎯 Strategien“ den Lauf starten oder auf den Stunden-Takt warten.</div>';
    }
    document.getElementById('positionsPanel').innerHTML = ph;
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
      { k: 'news', n: 'News-Sentiment', weighted: true },
      { k: 'tech', n: 'Technik', weighted: true },
      { k: 'elliott', n: 'Elliott-Wellen', weighted: true },
      { k: 'maIntraday', n: '⚡ Intraday-MA (eigene Strategie)', weighted: false },
      { k: 'ki', n: '🧠 KI-Prüfung (von der KI bestätigte Trades)', weighted: false }
    ];
    srcRows.forEach(function (row) {
      var s = D.stats[row.k] || { r: 0, w: 0 }, tot = s.r + s.w;
      var pct = tot ? Math.round(s.r / tot * 100) : null;
      var wTxt = row.weighted ? ' <span style="color:var(--muted)">(Gewicht ' + Math.round(normWeights()[row.k] * 100) + ' %)</span>' : '';
      hr += '<div style="margin-bottom:8px;"><div style="display:flex; justify-content:space-between; font-size:12px;">' +
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
          (t.strategy === 'intraday' ? '<span class="badge src">⚡ Intraday</span>' : '<span class="badge src">🧠 Stunden</span>') +
          (t.replicated ? '<span class="badge src" title="Als real nachgebildet markiert">📌 nachgebildet</span>' : '') +
          plBadge +
        '</div>' +
        '<div class="tmeta">' + t.qty + ' Stk · Basispreis ' + U.nf2.format(t.strike) + ' · fällig ' + U.d(t.expiry) +
          (t.status === 'closed' ? ' · <b>' + U.esc(t.why || '') + '</b> (' + U.dt(t.closeT) + ')' : '') + '</div>' +
        '<details><summary>Auslöser &amp; Szenario</summary>' +
          '<div class="why">' + U.esc(t.reason || '') + '</div>' +
          '<div class="why">' + U.esc(t.scenario || '') + '</div></details>' +
        '</div>';
    });
    document.getElementById('tradeLog').innerHTML = tl || '<div class="empty"><span class="ico">🧾</span>' + (D.trades.length ? 'Keine Trades in diesem Filter.' : 'Noch keine Trades – sie erscheinen hier, sobald eine Strategie handelt.') + '</div>';
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
  }

  function normWeights() {
    var w = D.weights, sum = w.news + w.tech + w.elliott;
    if (sum <= 0) return { news: 0.34, tech: 0.33, elliott: 0.33 };
    return { news: w.news / sum, tech: w.tech / sum, elliott: w.elliott / sum };
  }

  var weightsBuilt = false;
  function renderWeights() {
    var el = document.getElementById('weightsPanel');
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
    btn.disabled = true;
    var mode = (document.getElementById('btMode') || {}).value || 'daily';
    var range = document.getElementById('btRange').value;
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
        orderFee: D.intraday.orderFee, otmPct: prof.otmPct, expiryDays: prof.days,
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
        var modeN = D.intraday.mode === 'waves' ? '🌊 Wellen-Scalping' : '🎯 Ausbrüche';
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
        var html = '<div style="font-size:12px; color:var(--ink-2); margin-bottom:8px;">Gleiche Regeln, drei Zeitrahmen (EMA' + D.intraday.period + ', ' +
          (Q.PROFILES[D.intraday.profile] || Q.PROFILES.atm21).name + ', Gebühr ' + U.nf2.format(D.intraday.orderFee) + ' $/Order). Hinweis: 60-Min nutzt ~3 Monate, 5/15-Min ~1 Monat Historie.</div>';
        html += '<table class="tbl"><tr><th>Zeitrahmen</th><th>Rendite</th><th>Trades</th><th>Trefferquote</th><th>Ø Haltedauer</th><th>Gebühren</th><th>Max. Drawdown</th></tr>';
        rows.forEach(function (r0) {
          html += '<tr' + (r0 === best ? ' style="font-weight:600;"' : '') + '><td>' + r0.iv + (r0 === best ? ' 🏆' : '') + '</td>' +
            '<td class="' + U.signCls(r0.s.retPct) + '">' + U.signTxt(r0.s.retPct, ' %') + '</td>' +
            '<td>' + r0.s.nTrades + '</td><td>' + r0.s.winRate + ' %</td><td>' + r0.s.avgHoldMin + ' Min</td>' +
            '<td>' + U.nf2.format(r0.s.feesTotal || 0) + ' $</td><td>−' + r0.s.maxDrawdownPct + ' %</td></tr>';
        });
        html += '</table><div style="font-size:11.5px; color:var(--muted); margin-top:8px;">Je kürzer der Zeitrahmen, desto mehr Signale – aber auch mehr Spread- und Gebührenkosten sowie mehr Fehlsignale (Whipsaws). Der beste Zeitrahmen kann sich mit der Marktphase ändern; Vergangenheit ist kein Indikator für die Zukunft.</div>';
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
    var html = '<div style="font-size:12px; color:var(--ink-2); margin-bottom:8px;">' + label + '</div>';
    html += '<div class="depot-stats">' +
      '<div class="tile"><div class="name">Endkapital</div><div class="val ' + U.signCls(s.end - s.start) + '" style="font-size:17px;">' + U.money(s.end) + '</div></div>' +
      '<div class="tile"><div class="name">Rendite</div><div class="val ' + U.signCls(s.retPct) + '" style="font-size:17px;">' + U.signTxt(s.retPct, ' %') + '</div></div>' +
      '<div class="tile"><div class="name">Trades / Trefferquote</div><div class="val" style="font-size:17px;">' + s.nTrades + ' / ' + s.winRate + ' %</div></div>' +
      '<div class="tile"><div class="name">Max. Drawdown</div><div class="val" style="font-size:17px;">−' + s.maxDrawdownPct + ' %</div></div>' +
      '<div class="tile"><div class="name">Sharpe (ann., ca.)</div><div class="val ' + U.signCls(s.sharpe) + '" style="font-size:17px;">' + (s.sharpe != null ? s.sharpe.toFixed(2) : '–') + '</div></div>' +
      '</div>';
    // Kennzahlen-Zeile 2
    html += '<div style="display:flex; gap:16px; flex-wrap:wrap; font-size:12px; color:var(--ink-2); margin-bottom:10px;">' +
      '<span>Profit-Faktor <b class="' + (s.profitFactor >= 1 ? 'pos' : 'neg') + '">' + (s.profitFactor != null ? s.profitFactor : '–') + '</b></span>' +
      '<span>Ø Gewinn-Trade <b class="pos">' + U.signTxt(s.avgWin || 0, ' $') + '</b></span>' +
      '<span>Ø Verlust-Trade <b class="neg">' + U.signTxt(s.avgLoss || 0, ' $') + '</b></span>' +
      '<span>Längste Verlustserie <b>' + (s.maxLossStreak || 0) + '</b></span>' +
      '<span>Zeit im Markt <b>' + (s.exposurePct || 0) + ' %</b></span>' +
      (s.avgHoldMin ? '<span>Ø Haltedauer <b>' + s.avgHoldMin + ' Min</b></span>' : '') +
      '<span>Gebühren <b>' + U.nf2.format(s.feesTotal || 0) + ' $</b></span>' +
      '</div>';
    html += '<svg id="btChart" style="width:100%; height:180px; display:block;"></svg><div id="btChartLegend" style="font-size:11.5px; color:var(--ink-2); margin-top:4px;"></div>';
    // Robustheit (Bootstrap)
    if (res.bootstrap) {
      var bs = res.bootstrap;
      html += '<div style="font-size:12px; color:var(--ink-2); margin-top:10px;">🎲 Robustheit (400 Neuziehungen der Trades): Endkapital-Bandbreite ' +
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
      html += '<div style="margin-top:12px;"><div style="font-size:12px; color:var(--ink-2); margin-bottom:4px;">Monats-Renditen</div><table class="tbl" style="font-size:11px;"><tr><th></th>';
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
        html += '<div style="font-size:12px; display:flex; justify-content:space-between;"><span>' + kk[1] + '</span><span>' + pct + ' % richtig (' + v.r + '/' + tot + ')</span></div><div class="hitbar" style="margin-bottom:8px;"><span style="width:' + pct + '%"></span></div>';
      });
    } else if (res.trades && res.trades.length) {
      var byWhy = {};
      res.trades.forEach(function (tr) { byWhy[tr.why] = (byWhy[tr.why] || 0) + 1; });
      html += '<div style="font-size:12px; color:var(--ink-2);">Exit-Gründe: ' + Object.keys(byWhy).map(function (k) { return k + ' (' + byWhy[k] + ')'; }).join(' · ') + '</div>';
    }
    html += '</div><div style="font-size:11.5px; color:var(--muted);">Simulation mit synthetischen Scheinen (Black-Scholes, vola-abhängiger Spread + Slippage + Gebühren). Vergangenheit ist kein Indikator für die Zukunft.</div></div>';
    // Trade-Liste
    if (res.trades && res.trades.length) {
      html += '<details style="margin-top:10px;"><summary style="cursor:pointer; font-size:12.5px; color:var(--ink-2);">Alle ' + res.trades.length + ' Trades anzeigen</summary>' +
        '<div style="max-height:320px; overflow:auto; margin-top:8px;"><table class="tbl" style="font-size:11.5px;"><tr><th>Datum</th><th>Wert</th><th>Typ</th><th>Halt</th><th>P/L</th><th>Exit</th></tr>';
      res.trades.slice(-200).reverse().forEach(function (tr) {
        var holdTxt = tr.holdMin != null ? (tr.holdMin >= 1440 ? Math.round(tr.holdMin / 1440) + ' T' : tr.holdMin + ' Min') : Math.round((tr.closeT - tr.openT) / 86400000) + ' T';
        html += '<tr><td>' + new Date(tr.openT).toLocaleDateString('de-DE') + '</td><td><b>' + U.esc(tr.sym) + '</b></td>' +
          '<td>' + tr.dir.toUpperCase() + '</td><td>' + holdTxt + '</td>' +
          '<td class="' + U.signCls(tr.pnl) + '">' + U.signTxt(tr.pnl, ' $') + '</td><td>' + U.esc(tr.why || '') + '</td></tr>';
      });
      html += '</table></div><button class="btn ghost" id="btCsvBtn" style="margin-top:8px; font-size:12px;">⬇ Backtest-Trades als CSV</button></details>';
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
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + head + rows], { type: 'text/csv;charset=utf-8' }));
      a.download = 'backtest-trades.csv';
      a.click();
    });
  }

  function drawEquity(svg, eq, base) {
    drawLines(svg, [{ name: 'Depotwert', short: '', color: 'var(--series)', pts: eq }], null, base, { area: true, unit: ' $' });
  }

  /* ================= Chart-Helfer: Achsen, Ticks, Hover ================= */
  function niceTicks(lo, hi, n) {
    var span = hi - lo;
    if (span <= 0) return [lo];
    var step = Math.pow(10, Math.floor(Math.log(span / n) / Math.LN10));
    var err = span / n / step;
    step *= err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
    var out = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + step * 1e-6; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }
  function fmtTick(v, span) {
    if (Math.abs(v) >= 1000) return U.nf0.format(v);
    if (span < 4) return U.nf2.format(v);
    return U.nf0.format(v);
  }
  function fmtTimeTick(t, spanMs) {
    var d = new Date(t);
    if (spanMs <= 30 * 3600000) return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    if (spanMs <= 130 * 86400000) return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    return d.toLocaleDateString('de-DE', { month: '2-digit', year: '2-digit' });
  }
  function chartHover(e) {
    var svg = e.currentTarget, c = svg.__chart, tip = document.getElementById('tip');
    if (!c || !tip) return;
    var rect = svg.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (c.W / Math.max(1, rect.width));
    var t = c.x0 + Math.max(0, Math.min(1, (mx - c.padL) / (c.plotW || 1))) * (c.x1 - c.x0);
    var rows = [], cx = null;
    c.series.forEach(function (s) {
      if (!s.pts.length) return;
      var best = 0, bd = Infinity;
      for (var i = 0; i < s.pts.length; i++) { var d0 = Math.abs(s.pts[i][0] - t); if (d0 < bd) { bd = d0; best = i; } }
      var p = s.pts[best];
      if (cx === null) cx = p[0];
      rows.push('<div style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:' + s.color + ';display:inline-block;"></span>' +
        '<span class="tt">' + U.esc(s.short || s.name) + '</span> <span class="tv">' + U.nf2.format(p[1]) + (c.unit || '') + '</span></div>');
    });
    if (cx === null) return;
    var xh = svg.querySelector('.xhair');
    if (xh) { xh.style.display = ''; var xpx = c.padL + (cx - c.x0) / (c.x1 - c.x0) * c.plotW; xh.setAttribute('x1', xpx); xh.setAttribute('x2', xpx); }
    tip.style.display = 'block';
    tip.innerHTML = '<div class="tt">' + fmtTimeTick(cx, c.x1 - c.x0) + (c.x1 - c.x0 > 30 * 3600000 ? ' · ' + new Date(cx).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : ' Uhr') + '</div>' + rows.join('');
    var tw = tip.offsetWidth || 120;
    tip.style.left = Math.min(window.innerWidth - tw - 12, e.clientX + 14) + 'px';
    tip.style.top = (e.clientY + 14) + 'px';
  }
  function chartLeave(e) {
    var tip = document.getElementById('tip');
    if (tip) tip.style.display = 'none';
    var xh = e.currentTarget.querySelector('.xhair');
    if (xh) xh.style.display = 'none';
  }

  /* ================= Mehrserien-Chart (Achsen + Grid + Hover) ================= */
  function drawLines(svg, seriesArr, legendEl, base, opts) {
    opts = opts || {};
    var W = svg.clientWidth || 560, H = svg.clientHeight || 150;
    var padL = 8, padR = opts.padR != null ? opts.padR : 52, padT = 8, padB = 18;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var all = [];
    seriesArr.forEach(function (s) { all = all.concat(s.pts); });
    if (all.length < 2) {
      svg.innerHTML = '<text x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle" fill="var(--muted)" font-size="12">Noch zu wenig Daten.</text>';
      if (legendEl) legendEl.innerHTML = '';
      svg.__chart = null;
      return;
    }
    var x0 = Math.min.apply(null, all.map(function (p) { return p[0]; })), x1 = Math.max.apply(null, all.map(function (p) { return p[0]; }));
    var ys = all.map(function (p) { return p[1]; });
    if (base != null) ys = ys.concat([base]);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
    var yPad = (y1 - y0) * 0.06;
    y0 -= yPad; y1 += yPad;
    if (x1 - x0 < 1) x1 = x0 + 1;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    function X(t) { return padL + (t - x0) / (x1 - x0) * plotW; }
    function Y(v) { return H - padB - (v - y0) / (y1 - y0) * plotH; }
    var html = '';
    // Y-Gitter (haarfein, durchgezogen) + Werte-Beschriftung
    var ticks = niceTicks(y0, y1, 4);
    ticks.forEach(function (tv) {
      html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(tv).toFixed(1) + '" y2="' + Y(tv).toFixed(1) + '" stroke="var(--grid)" stroke-width="1"></line>' +
        '<text x="' + (padL + 2) + '" y="' + (Y(tv) - 3).toFixed(1) + '" fill="var(--muted)" font-size="9.5">' + fmtTick(tv, y1 - y0) + '</text>';
    });
    // X-Zeitachse: 4 Beschriftungen, keine vertikalen Linien
    for (var xi = 0; xi <= 3; xi++) {
      var tx = x0 + (x1 - x0) * xi / 3;
      var anchor = xi === 0 ? 'start' : xi === 3 ? 'end' : 'middle';
      html += '<text x="' + X(tx).toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + anchor + '" fill="var(--muted)" font-size="9.5">' + fmtTimeTick(tx, x1 - x0) + '</text>';
    }
    if (base != null) html += '<line x1="' + padL + '" x2="' + (padL + plotW) + '" y1="' + Y(base) + '" y2="' + Y(base) + '" stroke="var(--baseline)" stroke-dasharray="4 4" stroke-width="1"></line>';
    // Flächenfüllung (nur Einzelserie, ~10 % Deckung)
    if (opts.area && seriesArr.length === 1 && seriesArr[0].pts.length > 1) {
      var s0 = seriesArr[0];
      var dA = s0.pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
      html += '<path d="' + dA + ' L' + X(s0.pts[s0.pts.length - 1][0]).toFixed(1) + ' ' + (H - padB) + ' L' + X(s0.pts[0][0]).toFixed(1) + ' ' + (H - padB) + ' Z" fill="' + s0.color + '" opacity="0.10"></path>';
    }
    // Linien + Endpunkte
    var endLabels = [];
    seriesArr.forEach(function (s) {
      if (s.pts.length < 2) return;
      var d = s.pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
      var last = s.pts[s.pts.length - 1];
      html += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>';
      html += '<circle cx="' + X(last[0]).toFixed(1) + '" cy="' + Y(last[1]).toFixed(1) + '" r="4" fill="' + s.color + '" stroke="var(--surface)" stroke-width="2"></circle>';
      if (s.short) endLabels.push({ x: X(last[0]) + 8, y: Y(last[1]) + 3.5, txt: s.short, color: s.color });
    });
    // End-Beschriftungen: Kollisionen vermeiden (min. 13 px Abstand), Text in Textfarbe
    endLabels.sort(function (a, b) { return a.y - b.y; });
    for (var li = 1; li < endLabels.length; li++) {
      if (endLabels[li].y - endLabels[li - 1].y < 13) endLabels[li].y = endLabels[li - 1].y + 13;
    }
    endLabels.forEach(function (l) {
      html += '<text x="' + l.x.toFixed(1) + '" y="' + Math.min(H - padB, l.y).toFixed(1) + '" fill="var(--ink-2)" font-size="10" font-weight="600">' + U.esc(l.txt) + '</text>';
    });
    // Crosshair fürs Hover
    html += '<line class="xhair" x1="0" x2="0" y1="' + padT + '" y2="' + (H - padB) + '" stroke="var(--baseline)" stroke-width="1" style="display:none;"></line>';
    svg.innerHTML = html;
    svg.__chart = { W: W, H: H, padL: padL, plotW: plotW, x0: x0, x1: x1, series: seriesArr, unit: opts.unit || '' };
    if (!svg.__hoverBound) {
      svg.__hoverBound = true;
      svg.style.cursor = 'crosshair';
      svg.addEventListener('mousemove', chartHover);
      svg.addEventListener('mouseleave', chartLeave);
    }
    if (legendEl) legendEl.innerHTML = seriesArr.length > 1 ? seriesArr.map(function (s) {
      return '<span style="display:inline-flex; align-items:center; gap:5px; margin-right:14px;"><span style="width:10px;height:10px;border-radius:3px;background:' + s.color + ';display:inline-block;"></span>' + U.esc(s.name) + '</span>';
    }).join('') : '';
  }

  /* ================= Parallel-Strategien-Auswertung ================= */
  function stratOf(t) { return t.strategy === 'intraday' ? 'intraday' : 'hourly'; }

  function renderStratCompare() {
    var el = document.getElementById('stratCompare');
    if (!el) return;
    var closed = D.trades.filter(function (t) { return t.status === 'closed'; }).slice().reverse(); // alt → neu
    var agg = { hourly: { n: 0, w: 0, pnl: 0, fees: 0, openN: 0 }, intraday: { n: 0, w: 0, pnl: 0, fees: 0, openN: 0 } };
    closed.forEach(function (t) {
      var a = agg[stratOf(t)];
      a.n++; if (t.pnl > 0) a.w++; a.pnl += t.pnl; a.fees += (t.orderFee ? t.orderFee * 2 : 0);
    });
    D.positions.forEach(function (p) { agg[stratOf(p)].openN++; });
    var names = { hourly: '🧠 Stunden-Strategie', intraday: '⚡ Intraday' };
    var rows = '<table class="tbl"><tr><th>Strategie</th><th>Trades</th><th>Trefferquote</th><th>Realisierte P/L</th><th>Gebühren</th><th>Offen</th></tr>';
    ['hourly', 'intraday'].forEach(function (k) {
      var a = agg[k];
      rows += '<tr><td>' + names[k] + '</td><td>' + a.n + '</td><td>' + (a.n ? Math.round(a.w / a.n * 100) + ' %' : '–') + '</td>' +
        '<td class="' + U.signCls(a.pnl) + '">' + U.signTxt(a.pnl, ' $') + '</td><td>' + U.nf2.format(a.fees) + ' $</td><td>' + a.openN + '</td></tr>';
    });
    rows += '</table>';
    el.innerHTML = closed.length ? rows : '<div class="loading">Noch keine geschlossenen Trades.</div>';

    // Kumulative realisierte P/L je Strategie
    var cum = { hourly: 0, intraday: 0 };
    var pts = { hourly: [], intraday: [] };
    closed.forEach(function (t) {
      var k = stratOf(t);
      cum[k] += t.pnl;
      pts[k].push([t.closeT, Math.round(cum[k] * 100) / 100]);
    });
    drawLines(document.getElementById('stratChart'), [
      { name: 'Stunden-Strategie', short: '🧠', color: 'var(--series)', pts: pts.hourly },
      { name: 'Intraday', short: '⚡', color: 'var(--series2)', pts: pts.intraday }
    ], document.getElementById('stratLegend'), 0, { unit: ' $' });
  }

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

  /* ================= Sentiment-Verlauf ================= */
  function renderSentiment() {
    var sel = document.getElementById('sentSym');
    if (!sel) return;
    if (!sel.options.length) {
      window.Dash.STOCKS.forEach(function (s) {
        var o = document.createElement('option'); o.value = s.y; o.textContent = s.y + ' – ' + s.name; sel.appendChild(o);
      });
      (D.watchlist || []).forEach(function (w) {
        var o = document.createElement('option'); o.value = w.y; o.textContent = w.y + ' – ' + w.name + ' (Watchlist)'; sel.appendChild(o);
      });
      sel.addEventListener('change', renderSentiment);
    }
    var sym = sel.value || window.Dash.STOCKS[0].y;
    var pts = SENT[sym] || [];
    document.getElementById('sentInfo').textContent = pts.length
      ? pts.length + ' Messpunkte · aktuell: ' + pts[pts.length - 1][1].toFixed(2)
      : 'Noch keine Daten – entsteht mit jedem Lauf der Stunden-Strategie.';
    var sentWrap = document.getElementById('sentChart');
    if (!pts.length) {
      sentWrap.style.height = '56px';
      sentWrap.innerHTML = '<text x="50%" y="34" text-anchor="middle" fill="var(--muted)" font-size="12">Noch keine Daten – entsteht mit jedem Lauf der Stunden-Strategie.</text>';
    } else {
      sentWrap.style.height = '130px';
      drawLines(sentWrap, [{ name: 'News-Sentiment ' + sym, short: sym, color: 'var(--series)', pts: pts }], null, 0);
    }
    // Ranking: aktuell stärkste / schwächste Sentiments
    var cur = [];
    Object.keys(SENT).forEach(function (k) {
      var a = SENT[k];
      if (a && a.length) cur.push([k, a[a.length - 1][1]]);
    });
    cur.sort(function (a, b) { return b[1] - a[1]; });
    var rank = document.getElementById('sentRank');
    if (cur.length >= 2) {
      var top = cur.slice(0, 3).map(function (x) { return '<span class="chip up" style="margin-right:4px;">' + x[0] + ' ' + (x[1] > 0 ? '+' : '') + x[1].toFixed(2) + '</span>'; }).join('');
      var flop = cur.slice(-3).reverse().map(function (x) { return '<span class="chip down" style="margin-right:4px;">' + x[0] + ' ' + (x[1] > 0 ? '+' : '') + x[1].toFixed(2) + '</span>'; }).join('');
      rank.innerHTML = 'Stärkste: ' + top + ' &nbsp; Schwächste: ' + flop;
    } else rank.innerHTML = '';
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
      '<div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:8px; font-size:12.5px;">' +
      '<span>✅ Ausgeführte Intraday-Trades: <b>' + taken + '</b></span>' +
      '<span>🧘 Bewusst verworfen: <b>' + agg.total + '</b></span>' +
      (agg.total + taken > 0 ? '<span>Geduld-Quote: <b>' + Math.round(agg.total / (agg.total + taken) * 100) + ' %</b></span>' : '') +
      '</div>' + rows;
  }

  function renderAnalytics() {
    renderStratCompare();
    renderSentiment();
    renderBenchmark();
    renderPatience();
    renderTuneLog();
  }

  /* ================= KI-Retrospektive ================= */
  function retroData() {
    var closed = D.trades.filter(function (t) { return t.status === 'closed'; });
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
      if (a.n) lines.push('- ' + (k === 'hourly' ? '🧠 Stunden-Strategie' : '⚡ Intraday') + ': ' + a.n + ' Trades, ' + Math.round(a.w / a.n * 100) + ' % Treffer, P/L ' + U.signTxt(a.pnl, ' $'));
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
    var body = '';
    var provR = window.LLM ? window.LLM.provider() : null;
    if (provR) {
      st.textContent = provR === 'ollama' ? 'Lokale KI analysiert deine Trades – kann 1–2 Min dauern …' : 'KI analysiert deine Trades …';
      body = await window.LLM.ask('Du bist Trading-Coach für ein SIMULIERTES Optionsschein-Depot. Erstelle auf DEUTSCH eine ehrliche Retrospektive (Markdown, ##-Überschriften): Kurzfazit, Was lief gut, Was lief schlecht, Muster in den Daten, 3-5 konkrete Empfehlungen (Gewichte/Modus/Zeitrahmen/Risiko). Nutze NUR die Daten, erfinde nichts, nenne Zahlen. Ende: Hinweis Simulation/keine Anlageberatung.\n\nDATEN:\n' + JSON.stringify(d), 1800) || '';
      if (!body) body = '**KI-Anfrage fehlgeschlagen** – regelbasierte Auswertung:\n\n' + retroRules(d);
    } else {
      body = retroRules(d) + '\n\n*Tipp: Mit Anthropic-API-Key oder lokaler KI (⚙ Einstellungen) schreibt ein Sprachmodell die Retrospektive ausführlicher.*';
    }
    st.textContent = '';
    document.getElementById('aiTitle').textContent = '🧠 KI-Retrospektive (' + d.closedN + ' Trades)';
    // Lernschleife: konkrete Regel-Vorschläge für die KI-Prüfung
    var sugs = kiSuggestions();
    var sugHtml = '';
    if (sugs.length) {
      sugHtml = '<div style="margin-top:14px; padding:10px 12px; border:1px solid var(--grid); border-radius:10px;">' +
        '<div style="font-weight:600; font-size:13px; margin-bottom:6px;">🔁 Lernschleife – Regel-Vorschläge aus den letzten 14 Tagen:</div>' +
        '<ul style="margin:0 0 8px 18px; font-size:12.5px;">' + sugs.map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join('') + '</ul>' +
        '<button class="btn" id="kiSugBtn">→ In meine KI-Regeln übernehmen</button> <span id="kiSugStatus" style="font-size:12px; color:var(--muted);"></span></div>';
    }
    document.getElementById('aiBody').innerHTML = U.md(body) + sugHtml + '<div class="warn">⚠ Simulation – keine Anlageberatung.</div>';
    window.openModal('aiModalBg');
    var sb = document.getElementById('kiSugBtn');
    if (sb) sb.addEventListener('click', function () {
      var added = window.appendKiRules ? window.appendKiRules(sugs) : 0;
      document.getElementById('kiSugStatus').textContent = added ? '✅ ' + added + ' Regel(n) übernommen – gelten ab dem nächsten Trade.' : 'Alle Vorschläge sind schon in deinen Regeln.';
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
    var closed = D.trades.filter(function (t) { return t.status === 'closed' && t.closeT >= weekAgo; });
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
    lines.push('## 📄 Wochenreport KW ' + kw + ' (' + new Date(weekAgo).toLocaleDateString('de-DE') + ' – ' + new Date(now).toLocaleDateString('de-DE') + ')');
    lines.push('*' + KOSTOLANY[kw % KOSTOLANY.length] + ' – André Kostolany*');
    lines.push('## Depot');
    lines.push('- Wochen-Performance: **' + U.signTxt((eqEnd / eqStart - 1) * 100, ' %') + '** (' + U.money(eqStart) + ' → ' + U.money(eqEnd) + ')' + (spx ? ' · S&P 500 zur selben Zeit: ' + spx : ''));
    lines.push('- Gesamt seit Start: ' + U.signTxt((eqEnd / START_CAPITAL - 1) * 100, ' %') + ' · Offene Positionen: ' + D.positions.length);
    lines.push('## Trades dieser Woche');
    lines.push('- ' + closed.length + ' geschlossene Trades · Trefferquote ' + (closed.length ? Math.round(wins / closed.length * 100) + ' %' : '–') + ' · P/L ' + U.signTxt(pnlW, ' $') + ' · Gebühren ' + U.nf2.format(feesW) + ' $');
    if (agg.hourly.n) lines.push('- 🧠 Stunden-Strategie: ' + agg.hourly.n + ' Trades, ' + U.signTxt(agg.hourly.pnl, ' $'));
    if (agg.intraday.n) lines.push('- ⚡ Intraday: ' + agg.intraday.n + ' Trades, ' + U.signTxt(agg.intraday.pnl, ' $'));
    if (best) lines.push('- Bester Trade: ' + best.sym + ' ' + best.dir.toUpperCase() + ' ' + U.signTxt(best.pnl, ' $') + ' · Schwächster: ' + worst.sym + ' ' + worst.dir.toUpperCase() + ' ' + U.signTxt(worst.pnl, ' $'));
    var pat = patienceAgg(7);
    if (pat.total) {
      lines.push('## 🧘 Geduld-Bilanz („wissen, wann man nichts tut")');
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
    document.getElementById('aiTitle').textContent = '📄 Wochenreport KW ' + kw;
    document.getElementById('aiBody').innerHTML = U.md(body) +
      '<div style="margin-top:12px;"><button class="btn" id="weeklySaveBtn">💾 Als HTML-Datei speichern</button></div>' +
      '<div class="warn">⚠ Simulation – keine Anlageberatung.</div>';
    window.openModal('aiModalBg');
    document.getElementById('weeklySaveBtn').addEventListener('click', function () {
      var doc = '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Wochenreport KW ' + kw + '</title>' +
        '<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.6;color:#111}h2{margin-top:24px}</style></head><body>' +
        U.md(body) + '<hr><p style="color:#888;font-size:12px;">Erstellt vom Markt-Dashboard · Simulation, keine Anlageberatung.</p></body></html>';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([doc], { type: 'text/html' }));
      a.download = 'Wochenreport-KW' + kw + '.html';
      a.click();
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
    if (!D.screen || !D.screen.picks || !D.screen.picks.length) { el.innerHTML = '<span style="color:var(--muted); font-size:12px;">Noch kein Lauf.</span>'; return; }
    var stale = D.screen.day !== today;
    el.innerHTML = D.screen.picks.map(function (p) {
      return '<span class="chip flat" style="font-size:12px; padding:3px 10px;">' + U.esc(p.sym) + ' · Wellen-Score ' + p.score + (p.vol ? ' · ~' + p.vol + ' Mio $/Tag' : '') + '</span>';
    }).join('') + (stale ? ' <span style="color:var(--muted); font-size:11px;">(von ' + U.esc(D.screen.day) + ' – läuft heute automatisch neu)</span>' : '') +
      (D.intraday.screener ? '' : ' <span style="color:var(--muted); font-size:11px;">Schalter aus – Treffer fließen nicht in den Scan ein.</span>');
  }

  /* ================= KI-Lernschleife: Regel-Vorschläge aus den Trades ================= */
  function kiSuggestions() {
    var since = Date.now() - 14 * 86400000;
    var closed = D.trades.filter(function (t) { return t.status === 'closed' && t.closeT >= since; });
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
      if (s.n >= 5 && s.pnl < 0) out.push('Zwischen ' + h + ':00 und ' + (parseInt(h, 10) + 1) + ':00 Uhr (Berlin) höchstens groesse 0.5.');
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
        return '<span class="chip flat" style="font-size:12px; padding:3px 10px;">' + U.esc(w.y) + ' · ' + U.esc(w.name).slice(0, 24) +
          ' <a href="#" data-unwatch="' + i + '" style="color:var(--down); font-weight:700; margin-left:4px;">✕</a></span>';
      }).join('')
      : '<span style="color:var(--muted); font-size:12px;">Noch keine eigenen Werte.</span>';
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

  /* ================= CSV-Export ================= */
  function exportCsv() {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csvString()], { type: 'text/csv;charset=utf-8' }));
    a.download = 'trades-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
  }

  /* ================= Parameter-Optimierer ================= */
  var optRunning = false;
  async function runOptimizer() {
    if (optRunning) return;
    optRunning = true;
    var btn = document.getElementById('optRunBtn'), st = document.getElementById('optStatus'), out = document.getElementById('optResult');
    btn.disabled = true;
    try {
      var intervals = ['1m', '5m', '15m'];
      var entries = ['cross', 'reversion'];
      var lineTypes = ['ema', 'vwap'];
      var periods = [20, 50];
      var confirms = [5, 15];
      // Historie je Zeitrahmen einmal laden, dann 70/30 in Optimierung/Validierung teilen
      var data = {};
      for (var ii = 0; ii < intervals.length; ii++) {
        st.textContent = 'Lade ' + intervals[ii] + '-Historie …';
        var full = {};
        var syms = universe();
        await pmap(syms, async function (sy) {
          var fd = await fetchIntraday(sy, intervals[ii], true);
          if (fd && fd.series.length > 300) full[sy] = fd.series;
        }, 6);
        var train = {}, test = {};
        Object.keys(full).forEach(function (s) {
          var n = full[s].length, cut = Math.floor(n * 0.7);
          train[s] = full[s].slice(0, cut);
          test[s] = full[s].slice(Math.max(0, cut - 150)); // Warmup-Überlappung
        });
        data[intervals[ii]] = { train: train, test: test };
      }
      // Grid rechnen
      var mp = modeParams();
      var baseOpts = {
        capital: START_CAPITAL, budgetPct: D.intraday.budgetPct,
        sl: mp.sl, tp: mp.tp, exitMode: mp.exitMode, trailPct: mp.trail, maxHoldMin: mp.maxHoldMin,
        cooldownMin: mp.cooldownMin, maxPerDay: mp.maxPerDay,
        orderFee: D.intraday.orderFee, window: D.intraday.window || 'all',
        otmPct: (Q.PROFILES[D.intraday.profile] || Q.PROFILES.atm21).otmPct,
        expiryDays: (Q.PROFILES[D.intraday.profile] || Q.PROFILES.atm21).days
      };
      baseOpts.minEdge = 1.5;
      baseOpts.trendFilter = !!D.intraday.trendFilter;
      var combos = [];
      intervals.forEach(function (iv) { entries.forEach(function (en) { lineTypes.forEach(function (lt) { periods.forEach(function (p) { confirms.forEach(function (c) {
        combos.push({ interval: iv, entryMode: en, lineType: lt, period: p, confirmBps: c, zThr: zOf(c) });
      }); }); }); }); });
      var results = [];
      var doneC = 0;
      st.textContent = 'Rechne ' + combos.length + ' Kombinationen parallel (auf ' + BTPool.size + ' CPU-Kernen) …';
      var allRes = await Promise.all(combos.map(function (cb) {
        return btIntraday(data[cb.interval].train, Object.assign({}, baseOpts, cb)).then(function (res) {
          doneC++;
          if (doneC % 6 === 0) st.textContent = 'Rechne Kombination ' + doneC + '/' + combos.length + ' …';
          return res;
        });
      }));
      combos.forEach(function (cb, ci) {
        var res = allRes[ci];
        if (res && !res.error && res.summary.nTrades >= 5) results.push({ cb: cb, train: res.summary });
      });
      if (!results.length) { st.textContent = 'Keine Kombination erzeugte genug Trades (min. 5).'; return; }
      results.sort(function (a, b) { return b.train.retPct - a.train.retPct; });
      // Top 8 out-of-sample validieren
      var top = results.slice(0, 8);
      st.textContent = 'Validiere Top-Settings out-of-sample …';
      var valRes = await Promise.all(top.map(function (t0) {
        return btIntraday(data[t0.cb.interval].test, Object.assign({}, baseOpts, t0.cb));
      }));
      top.forEach(function (t0, ti) { t0.valid = (valRes[ti] && !valRes[ti].error) ? valRes[ti].summary : null; });
      top.sort(function (a, b) { return ((b.valid && b.valid.retPct) || -999) - ((a.valid && a.valid.retPct) || -999); });
      st.textContent = '';
      var html = '<table class="tbl"><tr><th>Setting</th><th>Optimierung (70 %)</th><th>Validierung (30 %)</th><th>Trades (V)</th><th>Urteil</th><th></th></tr>';
      top.forEach(function (r0, idx) {
        var cb = r0.cb;
        var label = (cb.entryMode === 'reversion' ? '🔄 Rücksetzer' : '🌊/🎯 Durchbruch') + ' · ' + cb.interval + ' · ' + cb.lineType.toUpperCase() + ' · P' + cb.period + ' · ' +
          (cb.entryMode === 'reversion' ? 'z ' + cb.zThr : (cb.confirmBps / 100).toFixed(2) + ' %');
        var v = r0.valid;
        var overfit = v && r0.train.retPct > 0 && v.retPct < 0;
        var verdict = !v ? '–' : overfit ? '⚠ überangepasst' : v.retPct > 0 ? '✅ robust' : 'neutral';
        html += '<tr' + (idx === 0 ? ' style="font-weight:600;"' : '') + '><td>' + label + '</td>' +
          '<td class="' + U.signCls(r0.train.retPct) + '">' + U.signTxt(r0.train.retPct, ' %') + ' (' + r0.train.nTrades + ' T.)</td>' +
          '<td class="' + (v ? U.signCls(v.retPct) : '') + '">' + (v ? U.signTxt(v.retPct, ' %') : '–') + '</td>' +
          '<td>' + (v ? v.nTrades : '–') + '</td><td>' + verdict + '</td>' +
          '<td><button class="btn ghost" style="padding:2px 8px; font-size:11px;" data-applyopt="' + results.indexOf(r0) + '">Übernehmen</button></td></tr>';
      });
      html += '</table><div style="color:var(--muted); font-size:11.5px; margin-top:8px;">Sortiert nach Validierungs-Rendite. „Übernehmen“ setzt Zeitrahmen, Leitlinie, EMA-Periode, Bestätigung und Trendfilter der ⚡-Strategie. Kurze Historie = begrenzte Aussagekraft; regelmäßig neu optimieren.</div>';
      out.innerHTML = html;
      out.querySelectorAll('[data-applyopt]').forEach(function (b) {
        b.addEventListener('click', function () {
          var r0 = results[parseInt(b.getAttribute('data-applyopt'), 10)];
          if (!r0) return;
          D.intraday.interval = r0.cb.interval;
          D.intraday.lineType = r0.cb.lineType;
          D.intraday.period = r0.cb.period;
          D.intraday.confirmBps = r0.cb.confirmBps;
          if (r0.cb.entryMode === 'reversion') D.intraday.mode = 'reversion';
          else if (D.intraday.mode === 'reversion') D.intraday.mode = 'waves';
          save();
          // UI nachziehen
          document.getElementById('idMode').value = D.intraday.mode;
          document.getElementById('idInterval').value = r0.cb.interval;
          document.getElementById('idLine').value = r0.cb.lineType;
          document.getElementById('idPeriod').value = String(r0.cb.period);
          document.getElementById('idConfirm').value = String(r0.cb.confirmBps);
          st.textContent = '✅ Übernommen: ' + (r0.cb.entryMode === 'reversion' ? 'Rücksetzer' : 'Durchbruch') + ' / ' + r0.cb.interval + ' / ' + r0.cb.lineType.toUpperCase() + ' / P' + r0.cb.period + '.';
        });
      });
    } catch (e) {
      st.textContent = 'Fehler: ' + (e.message || e);
    } finally {
      btn.disabled = false;
      optRunning = false;
    }
  }

  /* ================= Strategie-Labor (Walk-Forward über alle Modi) ================= */
  var labRunning = false;

  function sliceMap(map, from, to, warmupMs) {
    var out = {};
    Object.keys(map).forEach(function (s) {
      var sl = map[s].filter(function (p) { return p[0] >= from - (warmupMs || 0) && p[0] <= to; });
      if (sl.length > 60) out[s] = sl;
    });
    return out;
  }
  function mapSpan(map) {
    var t0 = Infinity, t1 = -Infinity;
    Object.keys(map).forEach(function (s) {
      var a = map[s];
      if (a.length) { t0 = Math.min(t0, a[0][0]); t1 = Math.max(t1, a[a.length - 1][0]); }
    });
    return [t0, t1];
  }

  async function loadLabData(st) {
    var cfg = D.intraday;
    var intervals = ['1m', '5m', '15m'];
    var data = {};
    var symsL = universe();
    for (var ii = 0; ii < intervals.length; ii++) {
      var mapL = {}, doneLab = 0;
      var ivLab = intervals[ii];
      await pmap(symsL, async function (sy) {
        var fdL = await fetchIntraday(sy, ivLab, true);
        doneLab++;
        if (st) st.textContent = 'Lade ' + ivLab + '-Historie … (' + doneLab + '/' + symsL.length + ')';
        if (fdL && fdL.series.length > 200) {
          if (!cfg.minDollarVol || fdL.dollarVolDay == null || fdL.dollarVolDay >= cfg.minDollarVol * 1e6) mapL[sy] = fdL.series;
        }
      }, 6);
      data[ivLab] = mapL;
    }
    return { intervals: intervals, data: data };
  }

  function labCommonOpts(cfg, iv) {
    var prof = Q.PROFILES[cfg.profile] || Q.PROFILES.atm21;
    return {
      capital: START_CAPITAL, budgetPct: cfg.budgetPct, orderFee: cfg.orderFee,
      window: cfg.window || 'all', lineType: cfg.lineType || 'ema',
      otmPct: prof.otmPct, expiryDays: prof.days, minEdge: 1.5,
      mtf: iv === '1m' && cfg.mtf !== false,
      riskPct: parseFloat(cfg.sizing) > 0 ? parseFloat(cfg.sizing) : 0
    };
  }
  function labModes(cfg) {
    return [
        { key: 'breakout', name: '🎯 Ausbrüche', opts: { entryMode: 'cross', exitMode: 'confirmed', sl: -0.25, tp: 0.35, trailPct: 0, maxHoldMin: 0, cooldownMin: 45, maxPerDay: 10, trendFilter: !!cfg.trendFilter } },
        { key: 'waves', name: '🌊 Scalping', opts: { entryMode: 'cross', exitMode: 'recross', sl: (cfg.scalpSL === "auto" ? "auto" : -(cfg.scalpSL || 20) / 100), tp: null, trailPct: (cfg.scalpTrail || 0) / 100, maxHoldMin: cfg.scalpHold || 60, cooldownMin: 5, maxPerDay: 40, trendFilter: !!cfg.trendFilter } },
        { key: 'reversion', name: '🔄 Rücksetzer', opts: { entryMode: 'reversion', sl: (cfg.scalpSL === "auto" ? "auto" : -(cfg.scalpSL || 20) / 100), tp: null, trailPct: 0, maxHoldMin: cfg.scalpHold || 60, cooldownMin: 5, maxPerDay: 40 } },
        { key: 'wave', name: '🏄 Wellenreiter', opts: { entryMode: 'wave', sl: (cfg.scalpSL === "auto" ? "auto" : -(cfg.scalpSL || 20) / 100), tp: null, trailPct: 0, maxHoldMin: cfg.scalpHold || 60, cooldownMin: 3, maxPerDay: 40, trendFilter: true, minQuality: 60 } },
        { key: 'wave_ch', name: '🏄📐 Wellenreiter + Kanal', opts: { entryMode: 'wave', channel: true, sl: (cfg.scalpSL === "auto" ? "auto" : -(cfg.scalpSL || 20) / 100), tp: null, trailPct: 0, maxHoldMin: cfg.scalpHold || 60, cooldownMin: 3, maxPerDay: 40, trendFilter: true, minQuality: 60 } },
        { key: 'orb', name: '🚀 ORB (Eröffnungs-Range)', opts: { entryMode: 'orb', exitMode: 'confirmed', orbMin: 30, sl: (cfg.scalpSL === "auto" ? "auto" : -0.25), tp: null, trailPct: 0.15, maxHoldMin: 0, cooldownMin: 10, maxPerDay: 10 } }
    ];
  }

  /** Walk-Forward über alle Modi × Zeitrahmen. Rückgabe: sortierte Ergebnisliste. */
  async function labCompute(ld, st) {
      var cfg = D.intraday;
      var intervals = ld.intervals;
      var data = ld.data;
      var MODES = labModes(cfg);
      var GRID = [];
      [9, 20, 50].forEach(function (p) { [5, 15].forEach(function (c) { GRID.push({ period: p, confirmBps: c, zThr: zOf(c) }); }); });

      var results = [];
      var total = MODES.length * intervals.length, done = 0;
      for (var mi = 0; mi < MODES.length; mi++) {
        for (var vi = 0; vi < intervals.length; vi++) {
          done++;
          var iv = intervals[vi];
          var map = data[iv];
          if (!map || Object.keys(map).length < 3) continue;
          var commonIv = labCommonOpts(cfg, iv);
          if (st) st.textContent = 'Walk-Forward ' + MODES[mi].name + ' · ' + iv + ' (' + done + '/' + total + ') …';
          await new Promise(function (r) { setTimeout(r, 20); });
          var span = mapSpan(map);
          if (!(span[1] > span[0])) continue;
          var chunk = (span[1] - span[0]) / 5;
          var barMs = INTERVAL_CFG[iv].barMin * 60000;
          var warm = 160 * barMs;
          var foldRets = [], oosTrades = [], lastBest = null;
          for (var f = 1; f <= 4; f++) {
            var trainEnd = span[0] + chunk * f;
            var testEnd = span[0] + chunk * (f + 1);
            // Parameter auf den bisherigen Daten bestimmen …
            var best = null;
            var trainMap = sliceMap(map, span[0], trainEnd, 0);
            var gridRes = await Promise.all(GRID.map(function (g0) {
              return btIntraday(trainMap, Object.assign({}, commonIv, MODES[mi].opts, g0));
            }));
            GRID.forEach(function (g0, gi) {
              var rT = gridRes[gi];
              if (!rT || rT.error || rT.summary.nTrades < 4) return;
              if (!best || rT.summary.retPct > best.ret) best = { grid: g0, ret: rT.summary.retPct };
            });
            if (!best) { foldRets.push(null); continue; }
            lastBest = best.grid;
            // … und NUR auf der nächsten, ungesehenen Scheibe anwenden
            var optsA = Object.assign({}, commonIv, MODES[mi].opts, best.grid);
            var rA = await btIntraday(sliceMap(map, trainEnd, testEnd, warm), optsA);
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
          var posSegs = valid.filter(function (x) { return x > 0; }).length;
          var wins = oosTrades.filter(function (x) { return x.pnl > 0; }).length;
          var gw = 0, gl = 0;
          oosTrades.forEach(function (x) { if (x.pnl > 0) gw += x.pnl; else gl += -x.pnl; });
          var pf = gl > 0 ? Math.round(gw / gl * 100) / 100 : (gw > 0 ? 99 : 0);
          var verdict = (wfRet > 0 && posSegs >= 3 && pf > 1) ? '🟢 robust'
            : (wfRet > 0 || posSegs >= 2) ? '🟡 gemischt' : '🔴 kein Vorteil';
          results.push({
            mode: MODES[mi], interval: iv, wfRet: wfRet, foldRets: foldRets, posSegs: posSegs,
            n: oosTrades.length, winRate: oosTrades.length ? Math.round(wins / oosTrades.length * 100) : 0,
            pf: pf, verdict: verdict, best: lastBest, trades: oosTrades
          });
        }
      }
      results.sort(function (a, b) { return b.wfRet - a.wfRet; });
      return results;
  }

  /* ================= 🎛 Analyse-Zentrale ================= */
  var centralRunning = false;
  async function runCentral() {
    if (centralRunning || labRunning) return;
    centralRunning = true;
    var btn = document.getElementById('centralBtn'), st = document.getElementById('centralStatus'), out = document.getElementById('centralResult');
    btn.disabled = true;
    try {
      var cfg = D.intraday;
      out.innerHTML = '<div class="loading">Schritt 1/3: Alle 6 Modi × 3 Zeitrahmen per Walk-Forward prüfen …</div>';
      var ld = await loadLabData(st);
      var results = await labCompute(ld, st);
      st.textContent = '';
      if (!results.length) { out.innerHTML = '<div class="empty"><span class="ico">🎛</span>Zu wenig Daten für eine Analyse.</div>'; return; }
      var top = results[0];

      // Schritt 2: Feinschliff für den Gewinner (Grid, 70/30 out-of-sample)
      out.innerHTML = '<div class="loading">Schritt 2/3: Feinschliff für ' + U.esc(top.mode.name) + ' · ' + top.interval + ' (18 Kombinationen parallel) …</div>';
      var map = ld.data[top.interval];
      var span = mapSpan(map);
      var cut = span[0] + (span[1] - span[0]) * 0.7;
      var warm = 160 * INTERVAL_CFG[top.interval].barMin * 60000;
      var trainMap = sliceMap(map, span[0], cut, 0), testMap = sliceMap(map, cut, span[1], warm);
      var commonIv = labCommonOpts(cfg, top.interval);
      var fineGrid = [];
      [9, 20, 50].forEach(function (p) { [5, 15, 30].forEach(function (c) { ['ema', 'vwap'].forEach(function (lt) {
        fineGrid.push({ period: p, confirmBps: c, zThr: zOf(c), lineType: lt });
      }); }); });
      var fineRes = await Promise.all(fineGrid.map(function (g) {
        return btIntraday(trainMap, Object.assign({}, commonIv, top.mode.opts, g));
      }));
      var bestFine = null;
      fineGrid.forEach(function (g, gi) {
        var r0 = fineRes[gi];
        if (!r0 || r0.error || r0.summary.nTrades < 5) return;
        if (!bestFine || r0.summary.retPct > bestFine.train.retPct) bestFine = { g: g, train: r0.summary };
      });
      var fineValid = null;
      if (bestFine) {
        var rv = await btIntraday(testMap, Object.assign({}, commonIv, top.mode.opts, bestFine.g));
        if (rv && !rv.error) fineValid = rv.summary;
      }
      var useFine = bestFine && fineValid && fineValid.retPct > 0;
      var pick = useFine ? bestFine.g : (top.best ? Object.assign({ lineType: cfg.lineType || 'ema' }, top.best) : { period: cfg.period, confirmBps: cfg.confirmBps, lineType: cfg.lineType || 'ema' });

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
        channel: top.mode.key === 'wave_ch',
        window: winPreset, avoidHours: avoidHours,
        wfRet: top.wfRet, posSegs: top.posSegs, n: top.n, winRate: top.winRate, pf: top.pf, verdict: top.verdict,
        fine: bestFine ? { train: bestFine.train.retPct, valid: fineValid ? fineValid.retPct : null, used: !!useFine } : null,
        topSymbols: symRank.slice(0, 3).map(function (x) { return x[0]; })
      };
      D.central = { at: Date.now(), rec: rec, ranking: results.slice(0, 6).map(function (r0) { return { name: r0.mode.name, interval: r0.interval, wfRet: r0.wfRet, posSegs: r0.posSegs, n: r0.n, verdict: r0.verdict }; }) };
      await save();
      renderCentral();
      exportAnalysis(true);
    } catch (e) {
      out.innerHTML = '<div class="empty"><span class="ico">⚠</span>Fehler: ' + U.esc(e.message || e) + '</div>';
    } finally {
      btn.disabled = false;
      centralRunning = false;
    }
  }

  var WINDOW_NAMES = { all: 'ganzer Handelstag', open2: '15:30–17:30 Uhr', open4: '15:30–19:30 Uhr', close2: '20–22 Uhr' };
  function renderCentral() {
    var out = document.getElementById('centralResult');
    if (!out) return;
    if (!D.central || !D.central.rec) {
      out.innerHTML = '<div class="empty"><span class="ico">🎛</span>Noch keine Analyse gelaufen – ein Klick oben genügt.</div>';
      return;
    }
    var c = D.central, r = c.rec;
    var html = '<div style="display:flex; gap:14px; flex-wrap:wrap; align-items:center; margin-bottom:10px;">' +
      '<span style="font-size:13px;">' + r.verdict + '</span>' +
      '<span style="font-size:14px; font-weight:700;">' + U.esc(r.modeName) + ' · ' + r.interval + '</span>' +
      '<span style="color:var(--muted); font-size:12px;">Stand: ' + U.dt(c.at) + '</span></div>';
    html += '<table class="tbl" style="max-width:680px;"><tr><th>Empfehlung</th><th>Wert</th><th>Begründung</th></tr>' +
      '<tr><td>Modus / Zeitrahmen</td><td><b>' + U.esc(r.modeName) + ' · ' + r.interval + '</b></td><td>Walk-Forward ' + U.signTxt(r.wfRet, ' %') + ' · ' + r.posSegs + '/4 Scheiben · ' + r.n + ' Trades · ' + r.winRate + ' % Treffer · PF ' + r.pf + '</td></tr>' +
      '<tr><td>Leitlinie / Periode / Bestätigung</td><td><b>' + r.lineType.toUpperCase() + ' · P' + r.period + ' · ' + (r.confirmBps / 100).toFixed(2) + ' %</b></td><td>' +
      (r.fine ? (r.fine.used ? 'Feinschliff validiert: Training ' + U.signTxt(r.fine.train, ' %') + ' → ungesehen ' + U.signTxt(r.fine.valid, ' %') : 'Feinschliff nicht robust (Validierung ' + (r.fine.valid == null ? 'ohne Ergebnis' : U.signTxt(r.fine.valid, ' %')) + ') → Labor-Parameter behalten') : 'aus dem Walk-Forward') + '</td></tr>' +
      '<tr><td>Zeitfenster</td><td><b>' + WINDOW_NAMES[r.window] + '</b></td><td>bestes Out-of-Sample-Fenster nach P/L</td></tr>' +
      '<tr><td>Meide-Stunden</td><td><b>' + (r.avoidHours.length ? r.avoidHours.map(function (h) { return h + ' Uhr'; }).join(', ') : 'keine') + '</b></td><td>Stunden mit ≥3 Trades und negativem P/L (Berlin)</td></tr>' +
      '<tr><td>Stärkste Werte</td><td colspan="2">' + r.topSymbols.map(U.esc).join(' · ') + '</td></tr></table>';
    html += '<div style="display:flex; gap:8px; align-items:center; margin-top:10px; flex-wrap:wrap;">' +
      '<button class="btn" id="centralApplyBtn">✅ Empfehlung komplett übernehmen</button>' +
      '<span id="centralApplyStatus" style="color:var(--muted); font-size:12px;"></span></div>';
    html += '<div style="color:var(--muted); font-size:11.5px; margin-top:8px;">Ehrlichkeit: ' + r.n + ' Out-of-Sample-Trades sind eine kleine Stichprobe – die Empfehlung ist ein Kandidat, kein Beweis. Analyse regelmäßig wiederholen; sie wird mit jedem Handelstag belastbarer. Ergebnis liegt auch im Analyse-Export.</div>';
    out.innerHTML = html;
    var ab = document.getElementById('centralApplyBtn');
    if (ab) ab.addEventListener('click', function () {
      D.intraday.mode = r.modeKey === 'wave_ch' ? 'wave' : r.modeKey;
      D.intraday.channel = r.modeKey === 'wave_ch';
      D.intraday.interval = r.interval;
      D.intraday.period = r.period;
      D.intraday.confirmBps = r.confirmBps;
      D.intraday.lineType = r.lineType;
      D.intraday.window = r.window;
      D.intraday.avoidHours = r.avoidHours.slice();
      save();
      ['idMode|' + D.intraday.mode, 'idInterval|' + r.interval, 'idPeriod|' + r.period, 'idConfirm|' + r.confirmBps, 'idLine|' + r.lineType, 'idWindow|' + r.window].forEach(function (kv) {
        var p = kv.split('|'), el = document.getElementById(p[0]);
        if (el) el.value = p[1];
      });
      var chEl = document.getElementById('idChannel');
      if (chEl) chEl.checked = D.intraday.channel;
      if (window.__updateParamVis) window.__updateParamVis();
      document.getElementById('centralApplyStatus').textContent = '✅ Übernommen – gilt ab dem nächsten Scan' + (r.avoidHours.length ? ' (Meide-Stunden aktiv: ' + r.avoidHours.join(', ') + ' Uhr)' : '') + '.';
      render();
    });
  }

  async function runLab() {
    if (labRunning) return;
    labRunning = true;
    var btn = document.getElementById('labRunBtn'), st = document.getElementById('labStatus'), out = document.getElementById('labResult');
    btn.disabled = true;
    try {
      var ld = await loadLabData(st);
      var results = await labCompute(ld, st);
      st.textContent = '';
      if (!results.length) { out.innerHTML = '<div class="loading">Zu wenig Daten für den Walk-Forward-Test.</div>'; return; }

      var html = '<table class="tbl"><tr><th>Strategie</th><th>Zeitrahmen</th><th>WF-Rendite (nur ungesehen)</th><th>Scheiben +</th><th>Trades</th><th>Treffer</th><th>PF</th><th>Urteil</th><th></th></tr>';
      results.forEach(function (r0, idx) {
        html += '<tr' + (idx === 0 ? ' style="font-weight:600;"' : '') + '><td>' + r0.mode.name + '</td><td>' + r0.interval + '</td>' +
          '<td class="' + U.signCls(r0.wfRet) + '">' + U.signTxt(r0.wfRet, ' %') + ' <span style="color:var(--muted); font-weight:400;">[' + r0.foldRets.map(function (x) { return x === null ? '·' : (x > 0 ? '+' : '') + x.toFixed(1); }).join(' | ') + ']</span></td>' +
          '<td>' + r0.posSegs + '/4</td><td>' + r0.n + '</td><td>' + r0.winRate + ' %</td><td>' + r0.pf + '</td><td>' + r0.verdict + '</td>' +
          '<td>' + (r0.best ? '<button class="btn ghost" style="padding:2px 8px; font-size:11px;" data-labapply="' + idx + '">Übernehmen</button>' : '') + '</td></tr>';
      });
      html += '</table>';

      // Diagnose des besten Kandidaten
      var top = results[0];
      if (top.trades.length >= 5) {
        function bucketTable(title, keyFn, fmtKey) {
          var b = {};
          top.trades.forEach(function (t) { var k = keyFn(t); (b[k] = b[k] || { n: 0, pnl: 0 }).n++; b[k].pnl += t.pnl; });
          var keys = Object.keys(b).sort(function (a, b2) { return parseFloat(a) - parseFloat(b2); });
          var rows = keys.map(function (k) {
            return '<tr><td>' + (fmtKey ? fmtKey(k) : k) + '</td><td>' + b[k].n + '</td><td class="' + U.signCls(b[k].pnl) + '">' + U.signTxt(Math.round(b[k].pnl * 100) / 100, ' $') + '</td></tr>';
          }).join('');
          return '<div><div style="font-size:12px; color:var(--ink-2); margin:8px 0 4px;">' + title + '</div><table class="tbl" style="font-size:11.5px;"><tr><th></th><th>Trades</th><th>P/L</th></tr>' + rows + '</table></div>';
        }
        html += '<div style="margin-top:12px; font-size:12.5px; font-weight:600;">Diagnose des Spitzenreiters (' + top.mode.name + ' · ' + top.interval + ', nur Out-of-Sample-Trades):</div>';
        html += '<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px;">';
        html += bucketTable('Nach Uhrzeit (Berlin)', function (t) { return (new Date(t.openT).getUTCHours() + 2) % 24; }, function (k) { return k + ' Uhr'; });
        html += bucketTable('Nach Wochentag', function (t) { return new Date(t.openT).getDay(); }, function (k) { return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][k]; });
        // Symbol-Ranking
        var bs = {};
        top.trades.forEach(function (t) { (bs[t.sym] = bs[t.sym] || { n: 0, pnl: 0 }).n++; bs[t.sym].pnl += t.pnl; });
        var symArr = Object.keys(bs).map(function (k) { return [k, bs[k].pnl, bs[k].n]; }).sort(function (a, b2) { return b2[1] - a[1]; });
        html += '<div><div style="font-size:12px; color:var(--ink-2); margin:8px 0 4px;">Nach Symbol (Top/Flop)</div><table class="tbl" style="font-size:11.5px;"><tr><th></th><th>Trades</th><th>P/L</th></tr>' +
          symArr.slice(0, 4).concat(symArr.slice(-3)).map(function (x) {
            return '<tr><td><b>' + U.esc(x[0]) + '</b></td><td>' + x[2] + '</td><td class="' + U.signCls(x[1]) + '">' + U.signTxt(Math.round(x[1] * 100) / 100, ' $') + '</td></tr>';
          }).join('') + '</table></div>';
        html += '</div>';
      }
      html += '<div style="color:var(--muted); font-size:11.5px; margin-top:10px;">WF-Rendite = Summe der Ergebnisse auf ausschließlich ungesehenen Zeitscheiben (je Scheibe wurden EMA-Periode × Schwelle auf den Vordaten neu bestimmt). 🟢 = positiv, ≥3/4 Scheiben im Plus, Profit-Faktor &gt; 1. Kurze Historie (1m: ~5 Tage) = begrenzte Aussagekraft – Test regelmäßig wiederholen.</div>';
      out.innerHTML = html;
      out.querySelectorAll('[data-labapply]').forEach(function (b) {
        b.addEventListener('click', function () {
          var r0 = results[parseInt(b.getAttribute('data-labapply'), 10)];
          if (!r0 || !r0.best) return;
          D.intraday.mode = r0.mode.key === 'wave_ch' ? 'wave' : r0.mode.key;
          if (r0.mode.key === 'wave' || r0.mode.key === 'wave_ch') {
            D.intraday.channel = r0.mode.key === 'wave_ch';
            var chEl = document.getElementById('idChannel');
            if (chEl) chEl.checked = D.intraday.channel;
          }
          D.intraday.interval = r0.interval;
          D.intraday.period = r0.best.period;
          D.intraday.confirmBps = r0.best.confirmBps;
          save();
          document.getElementById('idMode').value = D.intraday.mode;
          document.getElementById('idInterval').value = r0.interval;
          document.getElementById('idPeriod').value = String(r0.best.period);
          document.getElementById('idConfirm').value = String(r0.best.confirmBps);
          st.textContent = '✅ Übernommen: ' + r0.mode.name + ' · ' + r0.interval + ' · P' + r0.best.period + '.';
          render();
        });
      });
    } catch (e) {
      st.textContent = 'Fehler: ' + (e.message || e);
    } finally {
      btn.disabled = false;
      labRunning = false;
    }
  }

  /* ================= Init & Loop ================= */
  async function init() {
    D = (await window.api.storeGet('depot')) || defaultDepot();
    // Abwärtskompatibel, falls Felder fehlen
    var def = defaultDepot();
    Object.keys(def).forEach(function (k) { if (D[k] === undefined) D[k] = def[k]; });
    render();
    document.getElementById('jobStatus').textContent = D.lastRun ? 'Letzter Lauf: ' + U.dt(D.lastRun) : 'Noch kein Lauf – „Jetzt prüfen“ klicken oder auf den Auto-Lauf warten.';
    // Sub-Navigation (Pills)
    var pills = document.querySelectorAll('#depotPills button');
    pills.forEach(function (b) {
      b.addEventListener('click', function () {
        pills.forEach(function (x) { x.classList.remove('active'); });
        document.querySelectorAll('#tab-depot .sub').forEach(function (s) { s.classList.remove('active'); });
        b.classList.add('active');
        document.getElementById('sub-' + b.getAttribute('data-sub')).classList.add('active');
        render();
        if (b.getAttribute('data-sub') === 'auswertung') renderAnalytics();
      });
    });

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
    document.getElementById('scBtn').addEventListener('click', runSigChart);
    document.getElementById('filterBtn').addEventListener('click', runFilterCheck);
    (function () {
      var sc = document.getElementById('scSym');
      universe().forEach(function (s) { var o = document.createElement('option'); o.value = s; o.textContent = s; sc.appendChild(o); });
    })();
    renderSigMonitor();
    renderSymBlocks();
    document.getElementById('exportDataBtn').addEventListener('click', async function () {
      var stE = document.getElementById('reportStatus');
      stE.textContent = 'Exportiere …';
      var r = await exportAnalysis(true);
      stE.textContent = r && r.ok ? '✅ Gespeichert in ' + r.dir : '❌ Export fehlgeschlagen' + (r && r.msg ? ': ' + r.msg : ' (läuft die App als Installation?)');
    });

    // Optimierer, CSV, Watchlist, Strategie-Labor
    document.getElementById('labRunBtn').addEventListener('click', runLab);
    document.getElementById('optRunBtn').addEventListener('click', runOptimizer);
    document.getElementById('csvBtn').addEventListener('click', exportCsv);
    renderWatchChips();

    // Capital.com-Demo-Status
    async function updateCapStatus() {
      var el = document.getElementById('capStatus');
      if (!el) return;
      if (!(window.CapAPI && window.CapAPI.enabled())) { el.textContent = ''; return; }
      el.textContent = '🅲 Capital.com Demo: verbinde …';
      var s0 = await window.CapAPI.status();
      el.textContent = '🅲 ' + s0.msg + (s0.ok ? ' · Intraday-Signale werden gespiegelt.' : '');
    }
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
    hE.checked = D.hourlyEnabled !== false;
    hE.addEventListener('change', function () {
      D.hourlyEnabled = hE.checked;
      save();
      render();
      document.getElementById('jobStatus').textContent = hE.checked ? 'Aktiv – nächster Lauf innerhalb einer Stunde.' : 'Pausiert (manueller Lauf weiter möglich).';
    });

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
    idCh.checked = D.intraday.channel !== false;
    var idMt = document.getElementById('idMtf'), idSz = document.getElementById('idSizing'), idScr = document.getElementById('idScreener');
    idMt.checked = D.intraday.mtf !== false;
    idSz.value = parseFloat(D.intraday.sizing) > 0 ? String(D.intraday.sizing) : 'fix';
    idScr.checked = !!D.intraday.screener;
    idLn.value = D.intraday.lineType || 'ema';
    idTr.value = D.intraday.trendFilter ? '1' : '0';
    idW.value = D.intraday.window || 'all';
    idH.value = String(D.intraday.scalpHold != null ? D.intraday.scalpHold : 60);
    idTl.value = String(D.intraday.scalpTrail != null ? D.intraday.scalpTrail : 15);
    idSS.value = D.intraday.scalpSL === 'auto' ? 'auto' : String(D.intraday.scalpSL != null ? D.intraday.scalpSL : 20);
    document.getElementById('idBlackout').value = D.intraday.blackout || 'block';
    idM.value = D.intraday.mode || 'breakout';
    // Modus-/Zeitrahmen-abhängige Felder ein-/ausblenden
    function updateParamVis() {
      var m = idM.value, iv = idI.value;
      document.querySelectorAll('#idParams label[data-modes]').forEach(function (l) {
        l.style.display = l.getAttribute('data-modes').split(',').indexOf(m) !== -1 ? '' : 'none';
      });
      document.querySelectorAll('#idParams label[data-iv]').forEach(function (l) {
        l.style.display = l.getAttribute('data-iv') === iv ? '' : 'none';
      });
      var pg = document.getElementById('pgScalp');
      if (pg) {
        var any = Array.prototype.some.call(pg.querySelectorAll('.params > label'), function (l) { return l.style.display !== 'none'; });
        pg.style.display = any ? '' : 'none';
      }
    }
    idM.addEventListener('change', function () {
      // Sinnvolle Voreinstellungen je Modus
      if (idM.value === 'waves') { idI.value = '1m'; idC.value = '5'; }
      else if (idM.value === 'wave') { idI.value = '1m'; idC.value = '15'; idTr.value = '1'; }
      else if (idM.value === 'orb') { idI.value = '1m'; idC.value = '15'; }
      else { idI.value = '5m'; idC.value = '15'; }
      idSave();
    });
    idE.checked = !!D.intraday.enabled;
    idP.value = String(D.intraday.period);
    idC.value = String(D.intraday.confirmBps);
    idI.value = D.intraday.interval || '5m';
    idPr.value = D.intraday.profile || 'atm21';
    idF.value = String(D.intraday.orderFee != null ? D.intraday.orderFee : 1.5);
    idL.value = String(D.intraday.minDollarVol != null ? D.intraday.minDollarVol : 50);
    function idSave() {
      D.intraday.enabled = idE.checked;
      D.intraday.mode = idM.value;
      D.intraday.period = parseInt(idP.value, 10);
      D.intraday.confirmBps = parseInt(idC.value, 10);
      D.intraday.interval = idI.value;
      D.intraday.profile = idPr.value;
      D.intraday.orderFee = parseFloat(idF.value);
      D.intraday.minDollarVol = parseInt(idL.value, 10);
      D.intraday.lineType = idLn.value;
      D.intraday.trendFilter = idTr.value === '1';
      D.intraday.window = idW.value;
      D.intraday.scalpHold = parseInt(idH.value, 10);
      D.intraday.scalpTrail = parseInt(idTl.value, 10);
      D.intraday.scalpSL = idSS.value === 'auto' ? 'auto' : parseInt(idSS.value, 10);
      D.intraday.blackout = document.getElementById('idBlackout').value;
      D.intraday.channel = idCh.checked;
      D.intraday.mtf = idMt.checked;
      D.intraday.sizing = idSz.value;
      D.intraday.screener = idScr.checked;
      updateParamVis();
      save();
      document.getElementById('idStatus').textContent = D.intraday.enabled
        ? (window.Dash.marketOpen() ? 'Aktiv – nächster Scan in wenigen Minuten.' : 'Aktiv – wartet auf US-Handelsbeginn (15:30 Uhr Berlin).')
        : '';
    }
    idE.addEventListener('change', function () { idSave(); if (D.intraday.enabled) intradayScan(); });
    [idP, idC, idI, idPr, idF, idL, idLn, idTr, idW, idH, idTl, idSS, idCh, idMt, idSz, idScr, document.getElementById('idBlackout')].forEach(function (el) { el.addEventListener('change', idSave); });
    document.getElementById('screenBtn').addEventListener('click', function () { runScreener(true); });
    renderScreen();
    updateParamVis();
    window.__updateParamVis = updateParamVis;
    document.getElementById('centralBtn').addEventListener('click', runCentral);
    renderCentral();
    var idAt = document.getElementById('idAutoTune');
    idAt.checked = D.intraday.autoTune !== false;
    idAt.addEventListener('change', function () { D.intraday.autoTune = idAt.checked; save(); });
    renderTune();
    setTimeout(checkRemoteRec, 8000);
    setInterval(checkRemoteRec, 10 * 60000);

    // Benachrichtigungen
    var nE = document.getElementById('notifyEnabled');
    nE.checked = D.notify !== false;
    nE.addEventListener('change', function () { D.notify = nE.checked; save(); });
    if (D.intraday.enabled) {
      document.getElementById('idStatus').textContent = window.Dash.marketOpen() ? 'Aktiv.' : 'Aktiv – wartet auf US-Handelsbeginn (15:30 Uhr Berlin).';
    }
    // Intraday-Scheduler: Scan-Takt je nach Modus (Scalping 90 s, Ausbrüche 5 Min)
    setInterval(function () {
      if (D.intraday.enabled && window.Dash.marketOpen() && Date.now() - D.intradayLastScan >= modeParams().scanMs) intradayScan();
    }, 30000);
  }

  document.getElementById('runJobBtn').addEventListener('click', function () { runJob(true); });
  document.getElementById('btRunBtn').addEventListener('click', runBacktest);
  document.getElementById('depotResetBtn').addEventListener('click', function () {
    D = defaultDepot();
    weightsBuilt = false;
    save();
    render();
    document.getElementById('setStatus').textContent = 'Depot zurückgesetzt (10.000 $).';
  });
  document.addEventListener('quotes-updated', function () {
    if (D && document.getElementById('tab-depot').classList.contains('active')) render();
  });
  document.addEventListener('tab-changed', function (e) { if (e.detail === 'depot') render(); });

  init();
})();
