'use strict';
(function () {
  /* ================= Konfiguration ================= */
  var INDICES = [
    { y: '^GSPC',  id: 'spx',  name: 'S&P 500',            dec: 2 },
    { y: '^IXIC',  id: 'ixic', name: 'Nasdaq Composite',   dec: 2 },
    { y: '^GDAXI', id: 'dax',  name: 'DAX',                dec: 2 },
    { y: '^SOX',   id: 'sox',  name: 'PHLX Semiconductor', dec: 2 },
    { y: '^VIX',   id: 'vix',  name: 'VIX (Volatilität)',  dec: 2 },
    { y: 'BTC-USD', id: 'btc', name: 'Bitcoin', unit: '$', dec: 0 }
  ];
  // sharesB = Aktienanzahl in Mrd. (für MKap = Kurs × Anzahl), eps = Gewinn je Aktie (für KGV = Kurs / EPS). Stand: Juli 2026.
  var STOCKS = [
    { y: 'AAPL',  name: 'Apple',          group: 'bigtech', sharesB: 14.684, eps: 8.265 },
    { y: 'MSFT',  name: 'Microsoft',      group: 'bigtech', sharesB: 7.440,  eps: 16.793 },
    { y: 'NVDA',  name: 'Nvidia',         group: 'bigtech', sharesB: 24.222, eps: 6.529 },
    { y: 'GOOGL', name: 'Alphabet',       group: 'bigtech', sharesB: 12.229, eps: 19.909 },
    { y: 'AMZN',  name: 'Amazon',         group: 'bigtech', sharesB: 10.771, eps: 8.367 },
    { y: 'META',  name: 'Meta Platforms', group: 'bigtech', sharesB: 2.537,  eps: 27.517 },
    { y: 'TSLA',  name: 'Tesla',          group: 'bigtech', sharesB: 3.133,  eps: 1.077 },
    { y: 'AMD',   name: 'AMD',            group: 'chips',   sharesB: 1.631,  eps: 3.048 },
    { y: 'AVGO',  name: 'Broadcom',       group: 'chips',   sharesB: 4.765,  eps: 6.007 },
    { y: 'TSM',   name: 'TSMC (ADR)',     group: 'chips',   sharesB: 4.108,  eps: 9.714 },
    { y: 'ASML',  name: 'ASML (ADR)',     group: 'chips',   sharesB: 0.391,  eps: 29.129 },
    { y: 'INTC',  name: 'Intel',          group: 'chips',   sharesB: 4.992,  eps: null },
    { y: 'QCOM',  name: 'Qualcomm',       group: 'chips',   sharesB: 1.054,  eps: 9.194 },
    { y: 'MU',    name: 'Micron',         group: 'chips',   sharesB: 1.129,  eps: 44.170 },
    { y: 'ARM',   name: 'Arm Holdings',   group: 'chips',   sharesB: 1.068,  eps: 0.847 }
  ];
  var NEWS_FEEDS = [
    'https://news.google.com/rss/search?q=Aktien%20B%C3%B6rse%20Tech%20when%3A2d&hl=de&gl=DE&ceid=DE:de',
    'https://news.google.com/rss/search?q=Halbleiter%20OR%20Nvidia%20OR%20Chips%20Aktien%20when%3A2d&hl=de&gl=DE&ceid=DE:de'
  ];

  var Q = {};        // Yahoo-Symbol -> Quote {price, pct, series, lo52, hi52}
  var NEWS = [];
  var lastOk = null; // Date des letzten erfolgreichen Updates
  var fetchErrors = 0;

  var nfP = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  function fmt(v, dec) { return dec === 0 ? nf0.format(v) : nfP.format(v); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pctChip(pct) {
    if (pct === null || pct === undefined || isNaN(pct)) return '<span class="chip flat">–</span>';
    var cls = pct > 0.001 ? 'up' : (pct < -0.001 ? 'down' : 'flat');
    var arrow = pct > 0.001 ? '▲' : (pct < -0.001 ? '▼' : '·');
    var sign = pct > 0 ? '+' : '';
    return '<span class="chip ' + cls + '">' + arrow + ' ' + sign + nfP.format(pct) + '&nbsp;%</span>';
  }
  function fmtCap(mrd) {
    if (!mrd) return '–';
    return mrd >= 1000 ? nfP.format(mrd / 1000) + ' Bio. $' : new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(mrd) + ' Mrd. $';
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ================= Datenabruf ================= */
  function parseChart(bodyText) {
    var j = JSON.parse(bodyText);
    var r = j && j.chart && j.chart.result && j.chart.result[0];
    if (!r) throw new Error(j && j.chart && j.chart.error ? JSON.stringify(j.chart.error) : 'Leere Antwort');
    var meta = r.meta || {};
    var ts = r.timestamp || [];
    var closes = (r.indicators && r.indicators.quote && r.indicators.quote[0] && r.indicators.quote[0].close) || [];
    var series = [];
    for (var i = 0; i < ts.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) series.push([ts[i] * 1000, closes[i]]);
    }
    var price = (meta.regularMarketPrice !== undefined && meta.regularMarketPrice !== null)
      ? meta.regularMarketPrice
      : (series.length ? series[series.length - 1][1] : null);
    // Letzter Balken = heutiger (laufender) Tag bzw. letzter Handelstag → Vergleich mit dem Schluss davor
    var prev = series.length >= 2 ? series[series.length - 2][1] : null;
    if (series.length && price !== null) series[series.length - 1][1] = price;
    var pct = (price !== null && prev) ? (price / prev - 1) * 100 : null;
    return {
      price: price, pct: pct, series: series,
      lo52: meta.fiftyTwoWeekLow, hi52: meta.fiftyTwoWeekHigh
    };
  }

  async function loadSymbol(sym) {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=1mo&interval=1d';
    for (var attempt = 0; attempt < 2; attempt++) {
      var res = await window.api.fetchText(url);
      if (res.ok) {
        try { return parseChart(res.body); } catch (e) { return null; }
      }
      if (res.status === 429) { await sleep(20000); continue; } // kurz warten, einmal erneut
      return null;
    }
    return null;
  }

  async function refreshQuotes() {
    var all = INDICES.map(function (x) { return x.y; }).concat(STOCKS.map(function (s) { return s.y; }));
    var okCount = 0, idx = 0;
    // 6 Abfragen parallel statt streng nacheinander → Erst-Ladezeit Sekunden statt halbe Minute
    async function lane() {
      while (idx < all.length) {
        var i = idx++;
        var q = await loadSymbol(all[i]);
        if (q && q.price !== null) { Q[all[i]] = q; okCount++; }
      }
    }
    var lanes = [];
    for (var l = 0; l < 6; l++) lanes.push(lane());
    await Promise.all(lanes);
    fetchErrors = all.length - okCount;
    if (okCount > 0) lastOk = new Date();
    render();
  }

  async function refreshNews() {
    var items = [];
    for (var f = 0; f < NEWS_FEEDS.length; f++) {
      var res = await window.api.fetchText(NEWS_FEEDS[f]);
      if (!res.ok) continue;
      try {
        var doc = new DOMParser().parseFromString(res.body, 'text/xml');
        var nodes = doc.querySelectorAll('item');
        for (var i = 0; i < nodes.length && i < 15; i++) {
          var n = nodes[i];
          var title = (n.querySelector('title') || {}).textContent || '';
          var link = (n.querySelector('link') || {}).textContent || '';
          var srcEl = n.querySelector('source');
          var src = srcEl ? srcEl.textContent : '';
          var pd = (n.querySelector('pubDate') || {}).textContent || '';
          // Google News hängt " - Quelle" an den Titel: abschneiden
          if (src && title.lastIndexOf(' - ' + src) > 0) title = title.slice(0, title.lastIndexOf(' - ' + src));
          if (title && link) items.push({ title: title, url: link, source: src || 'Google News', t: Date.parse(pd) || 0 });
        }
      } catch (e) { /* Feed ignorieren */ }
    }
    // Duplikate raus, neueste zuerst, 6 Stück
    var seen = {};
    items = items.filter(function (it) { var k = it.title.toLowerCase().slice(0, 60); if (seen[k]) return false; seen[k] = 1; return true; });
    items.sort(function (a, b) { return b.t - a.t; });
    if (items.length) { NEWS = items.slice(0, 6); renderNews(); }
    else if (!NEWS.length) {
      var nl = document.getElementById('newsList');
      if (nl) nl.innerHTML = '<div class="loading">News derzeit nicht erreichbar – nächster Versuch in 30 Minuten.</div>';
    }
  }

  /* ================= Markt offen? ================= */
  function usMarketOpen() {
    var now = new Date();
    var d = now.getUTCDay();
    if (d === 0 || d === 6) return false;
    // Sommer-/winterzeitfest über die Rechen-Engine: 0–390 Minuten nach Börsenöffnung.
    // Vorher galt die Vereinigung beider Fenster – im Winter lief der Scanner damit eine
    // Stunde im Premarket auf stalen Kursen. (US-Feiertage kennt die App weiterhin nicht.)
    var m = window.Quant.minutenSeitOeffnung(now.getTime());
    return m >= 0 && m < 390;
  }

  /* ================= Rendering ================= */
  var SPARKS = [];
  function sparkSVG(series, w, h, id) {
    if (!series || series.length < 2) return '<svg viewBox="0 0 ' + w + ' ' + h + '"></svg>';
    var xs = series.map(function (p) { return p[0]; });
    var ys = series.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
    var pad = 3;
    function X(t) { return pad + (t - x0) / (x1 - x0) * (w - 2 * pad); }
    function Y(v) { return h - pad - (v - y0) / (y1 - y0) * (h - 2 * pad); }
    var d = series.map(function (p, i) { return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    var area = d + ' L' + X(x1).toFixed(1) + ' ' + (h - 1) + ' L' + X(x0).toFixed(1) + ' ' + (h - 1) + ' Z';
    var last = series[series.length - 1];
    SPARKS.push({ id: id, hist: series, x0: x0, x1: x1 });
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" data-spark="' + id + '">' +
      '<path d="' + area + '" fill="var(--series-soft)" stroke="none"></path>' +
      '<path d="' + d + '" fill="none" stroke="var(--series)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>' +
      '<circle cx="' + X(last[0]).toFixed(1) + '" cy="' + Y(last[1]).toFixed(1) + '" r="3" fill="var(--series)" stroke="var(--surface)" stroke-width="1.5"></circle>' +
      '</svg>';
  }

  function render() {
    SPARKS = [];
    // Kacheln
    var tiles = INDICES.map(function (ix) {
      var q = Q[ix.y];
      if (!q) return '<div class="tile"><div class="name">' + esc(ix.name) + '</div><div class="val">–</div></div>';
      return '<div class="tile">' +
        '<div class="name">' + esc(ix.name) + '</div>' +
        '<div class="val">' + fmt(q.price, ix.dec) + (ix.unit ? '&thinsp;' + ix.unit : '') + '</div>' +
        '<div class="sub">' + pctChip(q.pct) + '</div>' +
        sparkSVG(q.series, 160, 34, ix.id) +
        '</div>';
    }).join('');
    document.getElementById('tiles').innerHTML = tiles;

    // Gewinner/Verlierer
    var withQ = STOCKS.filter(function (s) { return Q[s.y] && Q[s.y].pct !== null; });
    var sorted = withQ.slice().sort(function (a, b) { return Q[b.y].pct - Q[a.y].pct; });
    function moverRows(list) {
      return list.map(function (s) {
        return '<div class="mover-row"><span class="sym">' + esc(s.y) + '</span>' +
          '<span class="nm">' + esc(s.name) + '</span>' + pctChip(Q[s.y].pct) + '</div>';
      }).join('');
    }
    document.getElementById('winners').innerHTML = moverRows(sorted.slice(0, 3));
    document.getElementById('losers').innerHTML = moverRows(sorted.slice(-3).reverse());

    // Karten
    function card(s) {
      var q = Q[s.y];
      if (!q) return '<div class="card"><div class="top"><span class="sym">' + esc(s.y) + '</span><span class="nm">' + esc(s.name) + '</span></div><div class="prc-row"><span class="prc">–</span></div></div>';
      var lo = q.lo52, hi = q.hi52, rangeHtml = '';
      if (lo && hi && hi > lo) {
        var pos = Math.max(0, Math.min(100, (q.price - lo) / (hi - lo) * 100));
        rangeHtml = '<div class="range"><div class="lbl"><span>52W&thinsp;Tief ' + fmt(lo, lo < 100 ? 2 : 0) + '</span><span>Hoch ' + fmt(hi, hi < 100 ? 2 : 0) + '</span></div>' +
          '<div class="track"><span class="mark" style="left:' + pos.toFixed(1) + '%"></span></div></div>';
      }
      var cap = fmtCap(s.sharesB ? q.price * s.sharesB : null);
      var pe = s.eps ? nfP.format(q.price / s.eps) : '–';
      return '<div class="card">' +
        '<div class="top"><span class="sym">' + esc(s.y) + '</span><span class="nm">' + esc(s.name) + '</span></div>' +
        '<div class="prc-row"><span class="prc">' + nfP.format(q.price) + '&thinsp;$</span>' + pctChip(q.pct) + '</div>' +
        sparkSVG(q.series, 240, 44, s.y) +
        '<div class="meta"><span>MKap <b>' + cap + '</b></span><span>KGV <b>' + pe + '</b></span></div>' +
        rangeHtml +
        '</div>';
    }
    document.getElementById('bigtech').innerHTML = STOCKS.filter(function (s) { return s.group === 'bigtech'; }).map(card).join('');
    document.getElementById('chips').innerHTML = STOCKS.filter(function (s) { return s.group === 'chips'; }).map(card).join('');

    // Statuszeile
    var open = usMarketOpen();
    var stampTxt = open ? 'US-Börse geöffnet' : 'US-Börse geschlossen';
    if (lastOk) {
      stampTxt += ' · Stand: ' + lastOk.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' Uhr';
    }
    document.getElementById('stamp').innerHTML = '<span class="dot ' + (open ? 'open' : 'closed') + '"></span>' + esc(stampTxt);
    document.getElementById('err').textContent = fetchErrors > 0 ? '⚠ ' + fetchErrors + ' Wert(e) konnten nicht geladen werden' : '';
    document.dispatchEvent(new CustomEvent('quotes-updated'));
  }

  function renderNews() {
    document.getElementById('news').innerHTML = NEWS.map(function (n) {
      var when = n.t ? new Date(n.t).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : '';
      return '<div class="news-item"><div class="t"><a href="' + esc(n.url) + '" target="_blank" rel="noopener">' + esc(n.title) + '</a></div>' +
        '<div class="src">' + esc(n.source) + (when ? '<br>' + esc(when) : '') + '</div></div>';
    }).join('') || '<div class="loading">Keine News gefunden.</div>';
  }

  /* ================= Tooltip ================= */
  var tip = document.getElementById('tip');
  var tipVonSpark = false; // Explorer/Depot nutzen dasselbe #tip – deren Tooltip nicht wegblenden
  document.addEventListener('mousemove', function (e) {
    var svg = e.target.closest ? e.target.closest('svg[data-spark]') : null;
    if (!svg) { if (tipVonSpark) { tip.style.display = 'none'; tipVonSpark = false; } return; }
    var meta = null;
    for (var i = 0; i < SPARKS.length; i++) if (SPARKS[i].id === svg.getAttribute('data-spark')) meta = SPARKS[i];
    if (!meta) { if (tipVonSpark) { tip.style.display = 'none'; tipVonSpark = false; } return; }
    var r = svg.getBoundingClientRect();
    var frac = (e.clientX - r.left) / r.width;
    var t = meta.x0 + frac * (meta.x1 - meta.x0);
    var best = meta.hist[0];
    for (var j = 1; j < meta.hist.length; j++) if (Math.abs(meta.hist[j][0] - t) < Math.abs(best[0] - t)) best = meta.hist[j];
    tip.innerHTML = '<span class="tv">' + nfP.format(best[1]) + '</span><br><span class="tt">' +
      new Date(best[0]).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) + '</span>';
    tip.style.display = 'block'; tipVonSpark = true;
    tip.style.left = Math.min(window.innerWidth - 130, e.clientX + 14) + 'px';
    tip.style.top = (e.clientY + 14) + 'px';
  });

  /* ================= Steuerung ================= */
  document.getElementById('themeBtn').addEventListener('click', function () {
    var root = document.documentElement;
    root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  var refreshing = false;
  async function doRefresh() {
    if (refreshing) return;
    refreshing = true;
    document.getElementById('refreshBtn').disabled = true;
    try { await refreshQuotes(); } finally {
      refreshing = false;
      document.getElementById('refreshBtn').disabled = false;
    }
  }
  document.getElementById('refreshBtn').addEventListener('click', doRefresh);

  function scheduleLoop() {
    var interval = usMarketOpen() ? 60000 : 300000;
    setTimeout(async function () { await doRefresh(); scheduleLoop(); }, interval);
  }

  // Für andere Module (KI-Depot, Explorer)
  window.Dash = {
    STOCKS: STOCKS,
    quote: function (ySym) { return Q[ySym]; },
    marketOpen: usMarketOpen
  };

  // Lade-Skeletons, bis die ersten Kurse da sind
  function skeletons() {
    function skel(n, h, bars) {
      var inner = bars.map(function (w) { return '<div class="bar ' + w + '"></div>'; }).join('');
      var out = '';
      for (var i = 0; i < n; i++) out += '<div class="skel" style="height:' + h + 'px; padding-top:4px;">' + inner + '</div>';
      return out;
    }
    document.getElementById('tiles').innerHTML = skel(6, 96, ['w60', 'w40', 'w80']);
    document.getElementById('bigtech').innerHTML = skel(7, 150, ['w40', 'w60', 'w80', 'w60']);
    document.getElementById('chips').innerHTML = skel(8, 150, ['w40', 'w60', 'w80', 'w60']);
    document.getElementById('winners').innerHTML = skel(3, 30, ['w80']);
    document.getElementById('losers').innerHTML = skel(3, 30, ['w80']);
  }
  skeletons();

  // Start
  doRefresh().then(scheduleLoop);
  refreshNews();
  setInterval(refreshNews, 30 * 60000);
})();
