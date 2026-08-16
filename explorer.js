'use strict';
/* Aktien-Explorer: freie Suche (Yahoo-Universum), Voll-Chart 1T–Max,
   Kennzahlen, News, KI-Analyse (LLM via API-Key oder regelbasierter Fallback). */
(function () {
  var Q = window.Quant, U = window.U;
  var CUR = null; // aktuell angezeigtes Symbol {sym, name, exch, type}
  var CURDATA = { daily: null, rangeSeries: null, meta: null, news: [] };
  var RANGES = [
    { k: '1T', range: '1d', interval: '5m' },
    { k: '5T', range: '5d', interval: '15m' },
    { k: '1M', range: '1mo', interval: '1d' },
    { k: '6M', range: '6mo', interval: '1d' },
    { k: '1J', range: '1y', interval: '1d' },
    { k: '5J', range: '5y', interval: '1wk' },
    { k: 'Max', range: 'max', interval: '1mo' }
  ];
  var activeRange = '1J';

  /* ================= Suche ================= */
  async function search(q) {
    var url = 'https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(q) + '&quotesCount=10&newsCount=0&listsCount=0';
    var res = await window.api.fetchText(url);
    if (!res.ok) return [];
    try {
      var j = JSON.parse(res.body);
      return (j.quotes || []).filter(function (x) { return x.symbol; }).map(function (x) {
        return { sym: x.symbol, name: x.longname || x.shortname || x.symbol, exch: x.exchDisp || x.exchange || '', type: x.typeDisp || x.quoteType || '' };
      });
    } catch (e) { return []; }
  }

  function renderResults(hits) {
    var el = document.getElementById('expResults');
    if (!hits.length) { el.innerHTML = '<div class="panel" style="padding:12px 16px; color:var(--muted);">Nichts gefunden.</div>'; return; }
    el.innerHTML = '<div class="panel">' + hits.map(function (h, i) {
      return '<div class="exp-hit" data-hit="' + i + '"><span class="s">' + U.esc(h.sym) + '</span><span class="n">' + U.esc(h.name) + '</span><span class="x">' + U.esc(h.type) + ' · ' + U.esc(h.exch) + '</span></div>';
    }).join('') + '</div>';
    el.querySelectorAll('[data-hit]').forEach(function (row) {
      row.addEventListener('click', function () {
        el.innerHTML = '';
        openDetail(hits[parseInt(row.getAttribute('data-hit'), 10)]);
      });
    });
  }

  async function doSearch() {
    var q = document.getElementById('expQuery').value.trim();
    if (q.length < 1) return;
    document.getElementById('expResults').innerHTML = '<div class="panel" style="padding:12px 16px;" ><span class="loading">Suche …</span></div>';
    renderResults(await search(q));
  }
  document.getElementById('expSearchBtn').addEventListener('click', doSearch);
  document.getElementById('expQuery').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });

  /* ================= Startseite (leer) ================= */
  var POPULAR = [
    { sym: 'AAPL', name: 'Apple' }, { sym: 'NVDA', name: 'Nvidia' }, { sym: 'TSLA', name: 'Tesla' },
    { sym: 'PLTR', name: 'Palantir' }, { sym: 'RHM.DE', name: 'Rheinmetall' }, { sym: 'SAP.DE', name: 'SAP' },
    { sym: 'BTC-USD', name: 'Bitcoin' }, { sym: '^GSPC', name: 'S&P 500' }, { sym: '^GDAXI', name: 'DAX' }
  ];
  function renderStart() {
    var el = document.getElementById('expStart');
    if (!el) return;
    el.innerHTML =
      '<div class="panel exp-start" style="margin-top:4px;">' +
      '<h3>🔎 Einen Wert öffnen</h3>' +
      '<div style="color:var(--muted); font-size:12.5px;">Suche nach Ticker oder Name (auch deutsche Aktien, ETFs, Indizes, Krypto) – oder starte mit einem Klick:</div>' +
      '<div class="popchips">' + POPULAR.map(function (p, i) { return '<button type="button" data-pop="' + i + '">' + U.esc(p.sym) + ' · ' + U.esc(p.name) + '</button>'; }).join('') + '</div>' +
      '<div style="color:var(--muted); font-size:11.5px; margin-top:10px;">In der Detail-Ansicht: Chart von 1 Tag bis Max., Kennzahlen, News, „KI-Analyse anfordern“ und „➕ Zur Handels-Watchlist“ (dann handeln die Strategien den Wert mit).</div>' +
      '</div>';
    el.querySelectorAll('[data-pop]').forEach(function (b) {
      b.addEventListener('click', function () {
        var p = POPULAR[parseInt(b.getAttribute('data-pop'), 10)];
        el.style.display = 'none';
        openDetail({ sym: p.sym, name: p.name, exch: '', type: '' });
      });
    });
  }
  renderStart();

  /* ================= Chart-Daten ================= */
  async function fetchRange(sym, range, interval) {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=' + range + '&interval=' + interval;
    var res = await window.api.fetchText(url);
    if (!res.ok) return null;
    try {
      var r = JSON.parse(res.body).chart.result[0];
      var ts = r.timestamp || [], closes = r.indicators.quote[0].close || [];
      var series = [];
      for (var i = 0; i < ts.length; i++) if (closes[i] != null) series.push([ts[i] * 1000, closes[i]]);
      return { series: series, meta: r.meta || {} };
    } catch (e) { return null; }
  }

  /* ================= Detail-Ansicht ================= */
  async function openDetail(hit) {
    CUR = hit;
    activeRange = '1J';
    var startEl = document.getElementById('expStart');
    if (startEl) startEl.style.display = 'none';
    document.getElementById('expDetail').style.display = 'block';
    document.getElementById('expName').textContent = hit.name;
    document.getElementById('expMeta').textContent = hit.sym + ' · ' + hit.type + (hit.exch ? ' · ' + hit.exch : '');
    document.getElementById('expPrice').textContent = '…';
    document.getElementById('expChg').innerHTML = '';
    document.getElementById('expStats').innerHTML = '';
    document.getElementById('expNews').innerHTML = '<div class="loading">Lade News …</div>';
    document.getElementById('aiStatus').textContent = '';
    buildRangeButtons();

    // Tagesdaten (2 Jahre) für Kennzahlen/Analyse + aktueller Range-Chart + News parallel
    var daily = await fetchRange(hit.sym, '2y', '1d');
    CURDATA.daily = daily;
    if (daily && daily.meta) {
      var m = daily.meta;
      var price = m.regularMarketPrice != null ? m.regularMarketPrice : (daily.series.length ? daily.series[daily.series.length - 1][1] : null);
      var prev = daily.series.length >= 2 ? daily.series[daily.series.length - 2][1] : null;
      var pct = price != null && prev ? (price / prev - 1) * 100 : null;
      var curSym = m.currency === 'EUR' ? ' €' : m.currency === 'USD' ? ' $' : (' ' + (m.currency || ''));
      document.getElementById('expPrice').textContent = price != null ? U.nf2.format(price) + curSym : '–';
      document.getElementById('expChg').innerHTML = pct != null ? '<span class="' + U.signCls(pct) + '">' + U.signTxt(pct, ' %') + '</span>' : '';
      var closes = daily.series.map(function (p) { return p[1]; });
      var vol30 = Q.histVol(closes, 30);
      var r14 = Q.rsi(closes, 14);
      var stats = [
        ['Börse', m.fullExchangeName || hit.exch || '–'],
        ['Währung', m.currency || '–'],
        ['52-Wochen-Hoch', m.fiftyTwoWeekHigh != null ? U.nf2.format(m.fiftyTwoWeekHigh) : '–'],
        ['52-Wochen-Tief', m.fiftyTwoWeekLow != null ? U.nf2.format(m.fiftyTwoWeekLow) : '–'],
        ['Vola (30T, annualisiert)', Math.round(vol30 * 100) + ' %'],
        ['RSI (14)', r14 != null ? Math.round(r14) : '–'],
        ['SMA 50', (function () { var s = Q.sma(closes, 50); return s ? U.nf2.format(s) : '–'; })()],
        ['SMA 200', (function () { var s = Q.sma(closes, 200); return s ? U.nf2.format(s) : '–'; })()]
      ];
      document.getElementById('expStats').innerHTML = stats.map(function (s) { return '<dt>' + s[0] + '</dt><dd>' + s[1] + '</dd>'; }).join('');
    }
    loadRange();
    loadNews();
  }

  function buildRangeButtons() {
    var el = document.getElementById('expRanges');
    el.innerHTML = RANGES.map(function (r) {
      return '<button data-range="' + r.k + '" class="' + (r.k === activeRange ? 'active' : '') + '">' + r.k + '</button>';
    }).join('');
    el.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        activeRange = b.getAttribute('data-range');
        el.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
        loadRange();
      });
    });
  }

  async function loadRange() {
    if (!CUR) return;
    var r = RANGES.filter(function (x) { return x.k === activeRange; })[0];
    var data = await fetchRange(CUR.sym, r.range, r.interval);
    CURDATA.rangeSeries = data ? data.series : null;
    drawBig(document.getElementById('bigchart'), data ? data.series : [], r.k);
  }

  var bigMeta = null;
  function drawBig(svg, series, rangeKey) {
    var W = svg.clientWidth || 800, H = svg.clientHeight || 300, pad = 8, padB = 18;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    if (!series || series.length < 2) { svg.innerHTML = '<text x="20" y="40" fill="var(--muted)" font-size="12">Keine Daten für diesen Zeitraum.</text>'; return; }
    var xs = series.map(function (p) { return p[0]; }), ys = series.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
    function X(t) { return pad + (t - x0) / (x1 - x0) * (W - 2 * pad); }
    function Y(v) { return H - padB - (v - y0) / (y1 - y0) * (H - pad - padB); }
    var d = series.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    var grid = '';
    for (var g = 0; g < 4; g++) {
      var gy = pad + g / 3 * (H - pad - padB);
      var gv = y1 - g / 3 * (y1 - y0);
      grid += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--grid)" stroke-width="1"></line>' +
        '<text x="' + (W - pad - 2) + '" y="' + (gy - 3) + '" fill="var(--muted)" font-size="10" text-anchor="end">' + U.nf2.format(gv) + '</text>';
    }
    var first = series[0][1], last = series[series.length - 1][1];
    var chg = (last / first - 1) * 100;
    svg.innerHTML = grid +
      '<path d="' + d + ' L' + X(x1).toFixed(1) + ' ' + (H - padB) + ' L' + X(x0).toFixed(1) + ' ' + (H - padB) + ' Z" fill="var(--series-soft)"></path>' +
      '<path d="' + d + '" fill="none" stroke="var(--series)" stroke-width="2" vector-effect="non-scaling-stroke"></path>' +
      '<text x="' + pad + '" y="' + (H - 5) + '" fill="var(--muted)" font-size="10">' + rangeKey + ': <tspan class="' + U.signCls(chg) + '" fill="' + (chg >= 0 ? 'var(--up)' : 'var(--down)') + '">' + U.signTxt(chg, ' %') + '</tspan></text>' +
      '<line id="bigCross" y1="' + pad + '" y2="' + (H - padB) + '" stroke="var(--baseline)" stroke-width="1" style="display:none"></line>';
    bigMeta = { series: series, x0: x0, x1: x1, W: W, X: X };
  }

  // Crosshair-Tooltip auf dem großen Chart
  var tip = document.getElementById('tip');
  document.getElementById('bigchart').addEventListener('mousemove', function (e) {
    if (!bigMeta) return;
    var svg = e.currentTarget, r = svg.getBoundingClientRect();
    var frac = (e.clientX - r.left) / r.width;
    var t = bigMeta.x0 + frac * (bigMeta.x1 - bigMeta.x0);
    var best = bigMeta.series[0];
    for (var j = 1; j < bigMeta.series.length; j++) if (Math.abs(bigMeta.series[j][0] - t) < Math.abs(best[0] - t)) best = bigMeta.series[j];
    var cross = svg.querySelector('#bigCross');
    if (cross) { cross.style.display = 'block'; cross.setAttribute('x1', bigMeta.X(best[0])); cross.setAttribute('x2', bigMeta.X(best[0])); }
    tip.innerHTML = '<span class="tv">' + U.nf2.format(best[1]) + '</span><br><span class="tt">' +
      new Date(best[0]).toLocaleString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</span>';
    tip.style.display = 'block';
    tip.style.left = Math.min(window.innerWidth - 150, e.clientX + 14) + 'px';
    tip.style.top = (e.clientY + 14) + 'px';
  });
  document.getElementById('bigchart').addEventListener('mouseleave', function (e) {
    tip.style.display = 'none';
    var cross = e.currentTarget.querySelector('#bigCross');
    if (cross) cross.style.display = 'none';
  });

  /* ================= News ================= */
  async function loadNews() {
    if (!CUR) return;
    var url = 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=' + encodeURIComponent(CUR.sym) + '&region=US&lang=en-US';
    var res = await window.api.fetchText(url);
    var items = [];
    if (res.ok) {
      try {
        var doc = new DOMParser().parseFromString(res.body, 'text/xml');
        var nodes = doc.querySelectorAll('item');
        for (var i = 0; i < nodes.length && i < 8; i++) {
          var n = nodes[i];
          items.push({
            title: (n.querySelector('title') || {}).textContent || '',
            url: (n.querySelector('link') || {}).textContent || '',
            t: Date.parse((n.querySelector('pubDate') || {}).textContent || '') || 0
          });
        }
      } catch (e) { /* leer lassen */ }
    }
    CURDATA.news = items;
    document.getElementById('expNews').innerHTML = items.length
      ? items.map(function (n) {
        var when = n.t ? new Date(n.t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
        return '<div class="news-item"><div class="t"><a href="' + U.esc(n.url) + '" target="_blank" rel="noopener">' + U.esc(n.title) + '</a></div><div class="src">' + when + '</div></div>';
      }).join('')
      : '<div class="loading">Keine News gefunden.</div>';
  }

  /* ================= KI-Analyse ================= */
  function analysisContext() {
    var daily = CURDATA.daily;
    var closes = daily.series.map(function (p) { return p[1]; });
    var m = daily.meta || {};
    var tech = Q.technical(daily.series);
    var ell = Q.elliott(daily.series.slice(-300));
    var sent = Q.sentiment(CURDATA.news, Date.now());
    var price = closes[closes.length - 1];
    return {
      sym: CUR.sym, name: CUR.name, price: price, currency: m.currency || '',
      pct1d: closes.length >= 2 ? (price / closes[closes.length - 2] - 1) * 100 : null,
      pct1m: closes.length >= 22 ? (price / closes[closes.length - 22] - 1) * 100 : null,
      pct1y: closes.length >= 252 ? (price / closes[closes.length - 252] - 1) * 100 : null,
      hi52: m.fiftyTwoWeekHigh, lo52: m.fiftyTwoWeekLow,
      vol30: Math.round(Q.histVol(closes, 30) * 100),
      rsi: Q.rsi(closes, 14), sma50: Q.sma(closes, 50), sma200: Q.sma(closes, 200),
      tech: tech, ell: ell, sent: sent,
      news: CURDATA.news.slice(0, 8).map(function (n) { return n.title; })
    };
  }

  function localAnalysis(c) {
    var lines = [];
    lines.push('## Kurzfazit (regelbasiert – ohne LLM)');
    var S = Q.combine({ news: c.sent.score, tech: c.tech.score, elliott: c.ell.score }, Q.DEFAULT_WEIGHTS);
    lines.push('Gesamtscore **' + S.toFixed(2) + '** (−1 bis +1) aus News (' + c.sent.score.toFixed(2) + '), Technik (' + c.tech.score.toFixed(2) + ') und Elliott (' + c.ell.score.toFixed(2) + '). ' +
      (S > 0.35 ? 'Das Gesamtbild ist **konstruktiv**.' : S < -0.35 ? 'Das Gesamtbild ist **belastet**.' : 'Das Gesamtbild ist **neutral/gemischt**.'));
    lines.push('## Technik');
    c.tech.parts.forEach(function (p) { lines.push('- ' + p.name + ': Score ' + p.score.toFixed(2)); });
    lines.push('- RSI(14): ' + (c.rsi != null ? Math.round(c.rsi) : '–') + ' · 30-Tage-Vola: ' + c.vol30 + ' %');
    lines.push('## News-Lage');
    lines.push('- Sentiment-Score: ' + c.sent.score.toFixed(2) + (c.sent.events.length ? ' · Ereignistypen: ' + c.sent.events.join(', ') : ''));
    if (c.sent.top) lines.push('- Auffälligste Schlagzeile: „' + c.sent.top.title + '“');
    lines.push('## Elliott-Wellen-Einordnung');
    lines.push('- Präferierte Zählung: **' + c.ell.label + '** (Konfidenz ' + Math.round(c.ell.conf * 100) + ' %)');
    lines.push('- Phase: ' + c.ell.phase);
    lines.push('- Alternativzählung: ' + c.ell.alt + ' (Konfidenz ' + Math.round(c.ell.altConf * 100) + ' %)');
    lines.push('- *Hinweis: Automatische Wellenzählungen sind grundsätzlich mehrdeutig – die Zählung ist als Hypothese zu verstehen, nicht als Fakt.*');
    lines.push('## Chancen & Risiken');
    lines.push('- Abstand zum 52-Wochen-Hoch: ' + (c.hi52 ? ((c.price / c.hi52 - 1) * 100).toFixed(1) + ' %' : '–') + ' · zum Tief: ' + (c.lo52 ? ('+' + ((c.price / c.lo52 - 1) * 100).toFixed(1) + ' %') : '–'));
    lines.push('- Kurs vs. SMA50/SMA200: ' + (c.sma50 ? (c.price > c.sma50 ? 'über' : 'unter') + ' SMA50' : '–') + ', ' + (c.sma200 ? (c.price > c.sma200 ? 'über' : 'unter') + ' SMA200' : '–'));
    return lines.join('\n');
  }

  async function requestAnalysis() {
    if (!CUR || !CURDATA.daily) return;
    var btn = document.getElementById('aiBtn'), st = document.getElementById('aiStatus');
    btn.disabled = true;
    var c = analysisContext();
    var body = '';
    var usedLLM = false;
    var prov = window.LLM ? window.LLM.provider() : null;
    if (prov) {
      st.textContent = prov === 'ollama' ? 'Lokale KI (' + window.LocalKI.model() + ') analysiert – kann 1–2 Min dauern …' : 'Frage KI an …';
      var prompt = 'Du bist ein nüchterner Aktienanalyst. Analysiere auf DEUTSCH das folgende Wertpapier anhand der Daten. ' +
        'Struktur (Markdown, ##-Überschriften): Kurzfazit (2-3 Sätze), News-Lage, Technische Analyse, Elliott-Wellen-Einordnung ' +
        '(nutze die vorberechnete Zählung, nenne IMMER Konfidenz UND Alternativzählung und weise explizit auf die Mehrdeutigkeit automatischer Wellenzählungen hin), ' +
        'Chancen, Risiken, Szenarien (Bull/Base/Bear mit ungefähren Kurszonen). Sei konkret mit Zahlen aus den Daten, erfinde nichts. ' +
        'Beende mit dem Hinweis, dass dies keine Anlageberatung ist.\n\nDATEN:\n' + JSON.stringify({
          symbol: c.sym, name: c.name, kurs: c.price, waehrung: c.currency,
          perf: { '1T_pct': c.pct1d, '1M_pct': c.pct1m, '1J_pct': c.pct1y },
          '52w': { hoch: c.hi52, tief: c.lo52 },
          technik: { rsi14: c.rsi, sma50: c.sma50, sma200: c.sma200, vola30_pct: c.vol30, score: c.tech.score, teilsignale: c.tech.parts },
          elliott: { zaehlung: c.ell.label, phase: c.ell.phase, konfidenz: c.ell.conf, alternative: c.ell.alt, alt_konfidenz: c.ell.altConf, zigzag_schwelle_pct: c.ell.thrPct },
          news_sentiment: { score: c.sent.score, ereignistypen: c.sent.events, top: c.sent.top },
          schlagzeilen: c.news
        });
      var txt = await window.LLM.ask(prompt, 2000);
      if (txt) { body = txt; usedLLM = true; }
      else body = '**KI-Anfrage fehlgeschlagen** – hier die regelbasierte Analyse:\n\n' + localAnalysis(c);
    }
    if (!body) body = localAnalysis(c) + '\n\n*Tipp: In den Einstellungen (⚙) einen Anthropic-API-Key ODER die lokale KI (Ollama) einrichten, dann erstellt ein Sprachmodell die Analyse aus denselben Daten.*';
    st.textContent = '';
    btn.disabled = false;
    document.getElementById('aiTitle').textContent = 'KI-Analyse: ' + CUR.name + ' (' + CUR.sym + ')' + (usedLLM ? '' : ' – regelbasiert');
    document.getElementById('aiBody').innerHTML = U.md(body) +
      '<div class="warn">⚠ Simulations-/Informationszweck. Automatische Analysen (insbesondere Elliott-Wellen-Zählungen) sind unsicher und mehrdeutig. Keine Anlageberatung.</div>';
    window.openModal('aiModalBg');
  }
  document.getElementById('aiBtn').addEventListener('click', requestAnalysis);

  // Zur Handels-Watchlist hinzufügen (KI-Depot handelt den Wert dann mit)
  document.getElementById('watchBtn').addEventListener('click', function () {
    if (!CUR || !window.DepotAPI) return;
    var st = document.getElementById('aiStatus');
    var r = window.DepotAPI.addWatch(CUR.sym, CUR.name);
    st.textContent = r === true ? '✅ ' + CUR.sym + ' wird jetzt mitgehandelt (siehe Optionsscheine → Strategien).'
      : r === 'standard' ? CUR.sym + ' ist schon in der Standard-Watchlist.'
      : r === 'schon' ? CUR.sym + ' ist bereits auf deiner Watchlist.'
      : 'Konnte nicht hinzugefügt werden.';
    setTimeout(function () { st.textContent = ''; }, 5000);
  });
})();
