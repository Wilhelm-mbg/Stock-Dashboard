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

  /* Vor-/nachboerslich? Ausserhalb der regulaeren Sitzung liefert das die Phase,
     sonst null. Pre-Market 4:00-9:30 ET (330 Min vor Oeffnung), After-Hours bis
     4 Stunden nach Schluss. Am Wochenende gibt es beides nicht. */
  function boersenPhase() {
    var now = new Date();
    var d = now.getUTCDay();
    if (d === 0 || d === 6) return null;
    var m = window.Quant.minutenSeitOeffnung(now.getTime());
    if (m >= -330 && m < 0) return 'vorboerslich';
    if (m >= 390 && m < 630) return 'nachboerslich';
    return null;
  }

  /** Vor-/nachboerslicher Kurs (Tester-Wunsch #24): 1-Tages-Chart MIT Pre/Post-
   *  Kerzen. Der letzte Balken ist der aktuelle ausserboersliche Kurs, verglichen
   *  wird gegen den letzten regulaeren Schluss (chartPreviousClose bzw.
   *  regularMarketPrice). Wird nur ausserhalb der Sitzung geladen. */
  async function loadPrePost(sym, phase) {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=1d&interval=5m&includePrePost=true';
    var res = await window.api.fetchText(url);
    if (!res.ok) return null;
    try {
      var r = JSON.parse(res.body).chart.result[0];
      var closes = (r.indicators.quote[0].close || []).filter(function (c) { return c != null; });
      if (!closes.length) return null;
      var kurs = closes[closes.length - 1];
      var basis = phase === 'vorboerslich'
        ? (r.meta.chartPreviousClose || r.meta.previousClose)
        : r.meta.regularMarketPrice;
      if (!basis) return null;
      return { kurs: kurs, pct: (kurs / basis - 1) * 100, phase: phase };
    } catch (e) { return null; }
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
    // Ausserhalb der Sitzung: Pre/Post-Kurse der Aktienliste nachziehen
    var phase = boersenPhase();
    if (phase) {
      var idxP = 0, syms = STOCKS.map(function (s) { return s.y; });
      async function laneP() {
        while (idxP < syms.length) {
          var iP = idxP++;
          var pp = await loadPrePost(syms[iP], phase);
          if (Q[syms[iP]]) Q[syms[iP]].pp = pp;
        }
      }
      var lanesP = [];
      for (var lp = 0; lp < 4; lp++) lanesP.push(laneP());
      await Promise.all(lanesP);
    } else {
      Object.keys(Q).forEach(function (k) { if (Q[k]) Q[k].pp = null; });
    }
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
      // Das Element heißt #news – unter der alten ID #newsList erschien die Meldung nie.
      var nl = document.getElementById('news');
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

  /** Inhalt setzen, wenn das Ziel existiert. Kein Bereich des Dashboards darf die
   *  Kursverarbeitung mitreissen, nur weil sein Kasten umgezogen ist. */
  function setzeInhalt(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
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
    setzeInhalt('tiles', tiles);

    // Gewinner/Verlierer
    var withQ = STOCKS.filter(function (s) { return Q[s.y] && Q[s.y].pct !== null; });
    var sorted = withQ.slice().sort(function (a, b) { return Q[b.y].pct - Q[a.y].pct; });
    function moverRows(list) {
      return list.map(function (s) {
        return '<div class="mover-row" data-sym="' + esc(s.y) + '"><span class="sym">' + esc(s.y) + '</span>' +
          '<span class="nm">' + esc(s.name) + '</span>' + pctChip(Q[s.y].pct) + '</div>';
      }).join('');
    }
    setzeInhalt('winners', moverRows(sorted.slice(0, 3)));
    setzeInhalt('losers', moverRows(sorted.slice(-3).reverse()));

    // Marktbild-Heatmap: eine Kachel je Wert, die Bewegten zuerst. Farbe nur über
    // CSS-Variablen (theme-fest): 3 % Tagesbewegung = volle Beimischung (45 %).
    var heatEl = document.getElementById('dashHeat');
    if (heatEl) {
      if (!withQ.length) {
        heatEl.innerHTML = '<div class="loading">Noch keine Kurse geladen.</div>';
      } else {
        var heatList = withQ.slice().sort(function (a, b) { return Math.abs(Q[b.y].pct) - Math.abs(Q[a.y].pct); });
        heatEl.innerHTML = heatList.map(function (s) {
          var pct = Q[s.y].pct;
          var bg = 'var(--surface)';
          if (Math.abs(pct) >= 0.05) {
            var n = Math.round(Math.min(45, Math.abs(pct) / 3 * 45));
            bg = 'color-mix(in srgb, var(' + (pct > 0 ? '--up' : '--down') + ') ' + n + '%, var(--surface))';
          }
          var sign = pct > 0 ? '+' : '';
          return '<div class="hz" data-heat="' + esc(s.y) + '" title="' + esc(s.name + ' ' + sign + nfP.format(pct) + ' %') + '" style="background:' + bg + '">' +
            '<span class="s">' + esc(s.y) + '</span><span class="p">' + sign + nfP.format(pct) + '&nbsp;%</span></div>';
        }).join('');
      }
    }

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
      // Vor-/nachboerslicher Kurs (Tester-Wunsch #24) - nur wenn gerade eine
      // ausserboersliche Sitzung laeuft und ein Kurs da ist
      var ppHtml = '';
      if (q.pp && q.pp.kurs) {
        var ppCls = q.pp.pct > 0.001 ? 'up' : (q.pp.pct < -0.001 ? 'down' : 'flat');
        ppHtml = '<div class="pp ' + ppCls + '" title="' + (q.pp.phase === 'vorboerslich' ? 'Vorbörslicher' : 'Nachbörslicher') + ' Handel – dünner Umsatz, Kurse können springen">' +
          (q.pp.phase === 'vorboerslich' ? 'vorb.' : 'nachb.') + ' ' + nfP.format(q.pp.kurs) + '&thinsp;$ ' +
          (q.pp.pct > 0 ? '+' : '') + nfP.format(q.pp.pct) + '&thinsp;%</div>';
      }
      return '<div class="card" data-sym="' + esc(s.y) + '">' +
        '<div class="top"><span class="sym">' + esc(s.y) + '</span><span class="nm">' + esc(s.name) + '</span></div>' +
        '<div class="prc-row"><span class="prc">' + nfP.format(q.price) + '&thinsp;$</span>' + pctChip(q.pct) + '</div>' +
        ppHtml +
        sparkSVG(q.series, 240, 44, s.y) +
        '<div class="meta"><span>MKap <b>' + cap + '</b></span><span>KGV <b>' + pe + '</b></span></div>' +
        rangeHtml +
        '</div>';
    }
    setzeInhalt('bigtech', STOCKS.filter(function (s) { return s.group === 'bigtech'; }).map(card).join(''));
    setzeInhalt('chips', STOCKS.filter(function (s) { return s.group === 'chips'; }).map(card).join(''));

    // Statuszeile
    var open = usMarketOpen();
    var stampTxt = open ? 'US-Börse geöffnet' : 'US-Börse geschlossen';
    if (lastOk) {
      stampTxt += ' · Stand: ' + lastOk.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' Uhr';
    }
    document.getElementById('stamp').innerHTML = '<span class="dot ' + (open ? 'open' : 'closed') + '"></span>' + esc(stampTxt);
    // Cockpit-Marktstatus – die übrigen Cockpit-Felder füllt depot.js
    var ckM = document.getElementById('ckMarkt');
    if (ckM) ckM.innerHTML = open ? '<span class="mdot open"></span>offen' : '<span class="mdot closed"></span>geschlossen';
    document.getElementById('err').textContent = fetchErrors > 0 ? '' + fetchErrors + ' Wert(e) konnten nicht geladen werden' : '';
    document.dispatchEvent(new CustomEvent('quotes-updated'));
  }

  // Nur echte Web-Links ins DOM lassen. Die Feed-Inhalte kommen von außen; javascript:-URLs
  // blockiert zwar schon die CSP, aber ein Link, der nichts tut, ist besser als einer, der
  // sich auf die CSP verlässt.
  function safeUrl(u) {
    try { var x = new URL(String(u)); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : '#'; }
    catch (e) { return '#'; }
  }

  function renderNews() {
    setzeInhalt('news', NEWS.map(function (n) {
      var when = n.t ? new Date(n.t).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr' : '';
      return '<div class="news-item"><div class="t"><a href="' + esc(safeUrl(n.url)) + '" target="_blank" rel="noopener">' + esc(n.title) + '</a></div>' +
        '<div class="src">' + esc(n.source) + (when ? '<br>' + esc(when) : '') + '</div></div>';
    }).join('') || '<div class="loading">Keine News gefunden.</div>');
    renderTicker();
  }

  /* ================= Spekulations-Radar =================
   * Eine geplante Claude-Aufgabe durchsucht stuendlich oeffentliche Quellen nach
   * Marktspekulationen (Uebernahmegeruechte, Beteiligungen, Squeeze-Kandidaten)
   * und schreibt sie als spekulationen.json in den Daten-Ordner. Diese Karte ZEIGT
   * sie nur - ungemessen, reine Beobachtung, gehandelt wird davon nichts.
   * Alles hier ist Fremdinhalt aus dem Web: konsequent esc() und safeUrl(),
   * feste Kappen, und eine kaputte Datei laesst die Karte einfach in Ruhe. */
  var SPEK_ART = { uebernahme: 'Übernahme', beteiligung: 'Beteiligung', analyst: 'Analysten', squeeze: 'Squeeze', geruecht: 'Gerücht', ereignis: 'Ereignis' };
  var spekGesehen = null;   // ids bereits gemeldeter Hoch-Eintraege (persistiert)
  /* Woher der angezeigte Stand stammt (Wunsch #44): Die Suche laeuft nur auf einem
     Rechner; alle anderen Installationen bekommen dieselben Funde ueber die
     Gemeinschafts-Ablage im Projekt-Zweig "radar". Das offen hinzuschreiben ist
     ehrlicher, als beides gleich aussehen zu lassen. */
  /* Wunsch #49: Die Thesen der Suche sind ganze Absaetze. Fuer die Karte reicht der
     erste Satz (hoechstens ~110 Zeichen, an einer Wortgrenze gekappt); der volle
     Wortlaut bleibt als Tooltip erhalten, es geht nichts verloren. */
  function spekKurz(t) {
    var s = String(t || '').trim();
    // Satzende nur, wenn danach ein Leerzeichen folgt - "25,3 Mrd." oder "S.p.A." sind keins
    var m = s.match(/^(.{20,}?[.!?])(\s|$)/);
    if (m && m[1].length <= 110 && !/\b(Mrd|Mio|Mr|Dr|ca|bzw|u|z\.B|S\.p\.A|Inc|Corp|Co)\.$/.test(m[1])) return m[1];
    if (s.length <= 110) return s;
    var k = s.slice(0, 110);
    var sp = k.lastIndexOf(' ');
    return (sp > 60 ? k.slice(0, sp) : k).replace(/[,;:\-–]$/, '') + ' …';
  }
  function quelleText(r) {
    return r && r.quelle === 'netz' ? 'Gemeinschafts-Ablage' : 'Suche auf diesem Rechner';
  }
  async function ladeSpekulationen() {
    var el = document.getElementById('spekRadar');
    if (!el || !window.api || !window.api.readSpekulationen) return;
    try {
      var r = await window.api.readSpekulationen();
      if (!r || !r.ok) return;   // keine Datei: Platzhalter bleibt stehen
      var d = JSON.parse(r.body);
      var roh = (d && Array.isArray(d.eintraege)) ? d.eintraege : [];
      var jetzt = Date.now();
      var RANG = { hoch: 0, mittel: 1, niedrig: 2 };
      var ein = [];
      for (var i = 0; i < roh.length; i++) {
        var e = roh[i];
        if (!e || typeof e.sym !== 'string' || typeof e.these !== 'string') continue;
        var t = Date.parse(e.zeit || '') || r.mtime;
        if (jetzt - t > 48 * 3600000) continue;   // aeltere Spekulation ist Geschichte
        ein.push({
          id: String(e.id || (e.sym + '|' + e.these)).slice(0, 120),
          sym: e.sym.toUpperCase().slice(0, 12),
          // Firmenname ohne Rechtsform-Anhang, damit das Label kurz bleibt
          name: typeof e.name === 'string' ? e.name.replace(/[\s,]+(S\.p\.A\.|AG|Inc\.?|Corp\.?|Corporation|plc|PLC|Ltd\.?|SE|N\.V\.|S\.A\.|Co\.)$/, '').slice(0, 40) : '',
          art: SPEK_ART[e.art] || 'Gerücht',
          chance: RANG[e.chance] != null ? e.chance : 'niedrig',
          these: e.these.slice(0, 240),
          kurz: spekKurz(e.these),
          begruendung: typeof e.begruendung === 'string' ? e.begruendung.slice(0, 240) : '',
          quellen: (Array.isArray(e.quellen) ? e.quellen : []).slice(0, 3).filter(function (q) {
            return q && typeof q.url === 'string' && safeUrl(q.url) !== '#';
          }),
          zeit: t
        });
      }
      ein.sort(function (a, b) { return (RANG[a.chance] - RANG[b.chance]) || (b.zeit - a.zeit); });
      ein = ein.slice(0, 12);
      if (!ein.length) {
        el.innerHTML = '<div class="loading">Gerade keine nennenswerten Spekulationen im Radar (Stand ' +
          new Date(r.mtime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr, ' + quelleText(r) + ').</div>';
        return;
      }
      /* 20 Stunden, nicht 3: Der Radar laeuft seit 23.08.2026 dreimal taeglich vor
       * US-Eroeffnung (06:45/12:45/14:45), nicht mehr stuendlich - die Websuche kostet
       * Credits und fand stuendlich dieselbe Nachrichtenlage. Groesste regulaere Luecke
       * ist die Nacht mit 16 Stunden. Eine Schwelle darunter wuerde die Karte fast
       * durchgehend als veraltet zeigen - und eine Warnung, die immer steht, liest
       * niemand mehr, wenn sie einmal stimmt. */
      var alt = jetzt - r.mtime > 20 * 3600000;
      el.innerHTML = ein.map(function (z) {
        return '<div class="spek-zeile">' +
          '<span class="sym" data-heat="' + esc(z.sym) + '" title="Im Explorer öffnen">' + esc(z.sym) +
          (z.name ? ' <span class="firma">' + esc(z.name) + '</span>' : '') + '</span>' +
          '<span class="spek-chip ' + z.chance + '">' + z.chance.toUpperCase() + '</span>' +
          '<span class="spek-chip mittel" style="border-style:dashed;">' + esc(z.art) + '</span>' +
          '<span class="these" title="' + esc(z.these) + '">' + esc(z.kurz) + (z.begruendung ? ' <span class="beg">– ' + esc(z.begruendung) + '</span>' : '') + '</span>' +
          (z.quellen.length ? '<span class="quellen">' + z.quellen.map(function (q, qi) {
            return '<a href="' + esc(safeUrl(q.url)) + '" target="_blank" rel="noopener">' +
              esc(typeof q.titel === 'string' && q.titel ? q.titel.slice(0, 60) : 'Quelle ' + (qi + 1)) + '</a>';
          }).join(' · ') + '</span>' : '') +
          '</div>';
      }).join('') +
        '<div style="color:var(--muted); font-size:11px; margin-top:8px;">Stand ' +
        new Date(r.mtime).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr' +
        ' · ' + quelleText(r) +
        (alt ? ' – <b>veraltet</b>, die Suche hat seit über 20 Stunden nicht geschrieben' : '') +
        ' · Sucht dreimal täglich vor US-Eröffnung (ca. 6:45, 12:45, 14:45 Uhr).' +
        ' · Chance-Einstufung ist eine redaktionelle Einschätzung der Suche, keine Messung.</div>';
      /* Benachrichtigung nur fuer NEUE Hoch-Eintraege, je id genau einmal - und nur,
       * wenn Benachrichtigungen im Depot nicht abgeschaltet sind. */
      if (spekGesehen === null) spekGesehen = (await window.api.storeGet('spekGesehen')) || [];
      var notifyAus = window.__D && window.__D() && window.__D().notify === false;
      var neu = ein.filter(function (z) { return z.chance === 'hoch' && spekGesehen.indexOf(z.id) === -1; });
      if (neu.length && !notifyAus) {
        try {
          var nN = new Notification('Spekulations-Radar: ' + neu.map(function (z) { return z.sym; }).join(', '),
            { body: neu[0].these + (neu.length > 1 ? ' (+' + (neu.length - 1) + ' weitere)' : '') + '\nUngemessen – reine Beobachtung, keine Anlageberatung.', silent: false });
          nN.onclick = function () { window.focus(); };
        } catch (eN) { /* Benachrichtigungen nicht verfuegbar */ }
      }
      if (neu.length) {
        neu.forEach(function (z) { spekGesehen.push(z.id); });
        if (spekGesehen.length > 200) spekGesehen = spekGesehen.slice(-200);
        window.api.storeSet('spekGesehen', spekGesehen);
      }
    } catch (e) { /* kaputte Datei: Karte unveraendert lassen */ }
  }
  setTimeout(ladeSpekulationen, 6000);
  setInterval(ladeSpekulationen, 10 * 60000);

  /* ================= Insider-Käufe =================
   * Vorstand und Aufsichtsrat US-notierter Firmen muessen jeden eigenen Handel mit
   * Aktien ihrer Firma binnen zwei Werktagen bei der SEC melden (Form 4). Das Skript
   * tools/insider-holen.js holt diese Meldungen, laesst nur offene Marktkaeufe stehen
   * (Code P - eigenes Geld, freiwillig) und schreibt insider.json. Diese Karte ZEIGT
   * das nur.
   *
   * Ausdruecklich KEINE gemessene Kante: der Insider-Kauf-Effekt ist in der Literatur
   * ein langsamer Halte-Effekt ueber Monate. Gegen die hier gemessene Produkthuerde
   * (0,23 Pp je 3 h beim Standard-Schein) traegt so etwas nicht. Wer das handeln will,
   * misst es vorher - so wie alles andere hier auch.
   *
   * Fremdinhalt aus dem Netz: konsequent esc() und safeUrl(), feste Kappen, und eine
   * kaputte Datei laesst die Karte einfach in Ruhe. */
  var insiderGesehen = null;
  function geldKurz(v) {
    if (!isFinite(v) || v <= 0) return '–';
    if (v >= 1e6) return fmt(v / 1e6, 2) + ' Mio $';
    return nf0.format(Math.round(v / 1000)) + ' Tsd. $';
  }
  async function ladeInsider() {
    var el = document.getElementById('insiderKarte');
    if (!el || !window.api || !window.api.readInsider) return;
    try {
      var r = await window.api.readInsider();
      if (!r || !r.ok) return;   // keine Datei: Platzhalter bleibt stehen
      var d = JSON.parse(r.body);
      var roh = (d && Array.isArray(d.eintraege)) ? d.eintraege : [];
      var jetzt = Date.now();
      var ein = [];
      for (var i = 0; i < roh.length; i++) {
        var e = roh[i];
        if (!e || typeof e.sym !== 'string' || !isFinite(e.wert)) continue;
        var t = Date.parse(e.zeit || '') || r.mtime;
        if (jetzt - t > 21 * 86400000) continue;   // aelter als drei Wochen: Geschichte
        var wer = (Array.isArray(e.wer) ? e.wer : []).slice(0, 4).filter(function (w) {
          return w && typeof w.person === 'string';
        });
        ein.push({
          id: String(e.id || (e.sym + '|' + t)).slice(0, 120),
          sym: e.sym.toUpperCase().slice(0, 12),
          name: typeof e.name === 'string' ? e.name.slice(0, 40) : '',
          anzahl: Math.max(1, Math.min(20, parseInt(e.anzahl, 10) || 1)),
          wert: Math.max(0, e.wert),
          stueck: isFinite(e.stueck) ? e.stueck : 0,
          kurs: isFinite(e.kurs) ? e.kurs : 0,
          rang: Math.max(0, Math.min(3, parseInt(e.rang, 10) || 0)),
          imUniversum: !!e.imUniversum,
          wer: wer,
          quellen: (Array.isArray(e.quellen) ? e.quellen : []).slice(0, 3).filter(function (q) {
            return q && typeof q.url === 'string' && safeUrl(q.url) !== '#';
          }),
          zeit: t
        });
      }
      // Cluster zuerst, dann die hoechste Rolle, dann das Volumen - wie im Skript
      ein.sort(function (a, b) {
        return (b.anzahl - a.anzahl) || (b.wert - a.wert) || (b.rang - a.rang);
      });
      ein = ein.slice(0, 12);
      if (!ein.length) {
        el.innerHTML = '<div class="loading">Zurzeit keine gemeldeten Insider-Käufe über der Schwelle (Stand ' +
          new Date(r.mtime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr, ' + quelleText(r) + ').</div>';
        return;
      }
      var alt = jetzt - r.mtime > 26 * 3600000;   // Meldungen kommen werktags, nicht stuendlich
      el.innerHTML = ein.map(function (z) {
        var kopf = z.wer.length
          ? esc(z.wer[0].person) + (z.wer[0].rolle ? ' <span class="beg">(' + esc(String(z.wer[0].rolle).slice(0, 40)) + ')</span>' : '') +
            (z.anzahl > 1 ? ' <span class="beg">und ' + (z.anzahl - 1) + ' weitere' + (z.anzahl === 2 ? 'r' : '') + '</span>' : '')
          : '<span class="beg">Meldende Person nicht lesbar</span>';
        var detail = (z.stueck > 0 && z.kurs > 0)
          ? ' – ' + nf0.format(z.stueck) + ' Stück zu ' + fmt(z.kurs, 2) + ' $'
          : '';
        return '<div class="spek-zeile">' +
          '<span class="sym" data-heat="' + esc(z.sym) + '" title="Im Explorer öffnen">' + esc(z.sym) +
          (z.name ? ' <span class="firma">' + esc(z.name) + '</span>' : '') + '</span>' +
          '<span class="spek-chip kauf">' + esc(geldKurz(z.wert)) + '</span>' +
          (z.anzahl > 1 ? '<span class="spek-chip cluster">' + z.anzahl + ' INSIDER</span>' : '') +
          (z.imUniversum ? '<span class="spek-chip univ">im Universum</span>' : '') +
          '<span class="these">' + kopf + detail +
          ' <span class="beg">· gemeldet ' + new Date(z.zeit).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + '</span></span>' +
          (z.quellen.length ? '<span class="quellen">' + z.quellen.map(function (q, qi) {
            return '<a href="' + esc(safeUrl(q.url)) + '" target="_blank" rel="noopener">' +
              esc(typeof q.titel === 'string' && q.titel ? q.titel.slice(0, 60) : 'Quelle ' + (qi + 1)) + '</a>';
          }).join(' · ') + '</span>' : '') +
          '</div>';
      }).join('') +
        '<div style="color:var(--muted); font-size:11px; margin-top:8px;">Stand ' +
        new Date(r.mtime).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr' +
        ' · ' + quelleText(r) +
        (alt ? ' – <b>veraltet</b>, der Abruf hat länger nicht geschrieben' : '') +
        ' · Nur offene Marktkäufe (SEC-Code P) ab 100.000 $ und 5 $ je Aktie, ohne reine 10-%-Aktionäre.' +
        ' Was hier steht, ist gemeldet – nicht gemessen.</div>';
      /* Benachrichtigung nur fuer Cluster, je Eintrag genau einmal: ein einzelner Kauf
       * ist ein Datenpunkt, mehrere Insider derselben Firma binnen weniger Tage sind
       * der seltene Fall, der ueberhaupt eine Meldung wert ist. */
      if (insiderGesehen === null) insiderGesehen = (await window.api.storeGet('insiderGesehen')) || [];
      var notifyAus = window.__D && window.__D() && window.__D().notify === false;
      var neu = ein.filter(function (z) { return z.anzahl > 1 && insiderGesehen.indexOf(z.id) === -1; });
      if (neu.length && !notifyAus) {
        try {
          var nN = new Notification('Insider-Käufe: ' + neu.map(function (z) { return z.sym; }).join(', '),
            { body: neu[0].anzahl + ' Insider bei ' + neu[0].sym + ' für zusammen ' + geldKurz(neu[0].wert) +
              '\nGemeldet, nicht gemessen – keine Anlageberatung.', silent: false });
          nN.onclick = function () { window.focus(); };
        } catch (eN) { /* Benachrichtigungen nicht verfuegbar */ }
      }
      if (neu.length) {
        neu.forEach(function (z) { insiderGesehen.push(z.id); });
        if (insiderGesehen.length > 200) insiderGesehen = insiderGesehen.slice(-200);
        window.api.storeSet('insiderGesehen', insiderGesehen);
      }
    } catch (e) { /* kaputte Datei: Karte unveraendert lassen */ }
  }
  setTimeout(ladeInsider, 7000);
  setInterval(ladeInsider, 10 * 60000);

  /* ================= Vorbörsen-Lücken =================
   * Tester-Wunsch #55: eine Liste der Werte, die vor der US-Eröffnung deutlich
   * anders stehen als beim gestrigen Schluss. Die Schwellen sind die aus dem
   * Ticket: Lücke über 5 %, Kurs über 3 $, vorbörsliches Volumen über 50.000
   * Stück, höchstens zehn Zeilen.
   *
   * Diese Karte ZEIGT nur. Sie löst nichts aus, sie geht in keine Strategie ein,
   * kein Knopf handelt daraus. "Gap and Go" gehört zur Ausbruchsfamilie, und die
   * ist hier gemessen und widerlegt worden - die grosse Signalstudie vom
   * 23.08.2026 hat in 3.372 Tests keinen einzigen bestätigten Ausbruchs-Vorteil
   * gefunden, und die Produkthürde beim Standard-Schein (0,23 Pp je 3 h) frisst
   * mehr, als solche Effekte roh hergeben. Wer das handeln will, misst es vorher.
   *
   * Datenquelle sind die Yahoo-Screener (dieselbe Liste, die auch die
   * Gewinner-Seite füllt, nur als JSON) plus die 5-Minuten-Kerzen mit
   * Vorbörsen-Fenster - beides über den Host, den die App ohnehin benutzt.
   * Der im Ticket vorgeschlagene Nachrichten-Anbieter kommt bewusst NICHT dazu:
   * das wäre ein neuer Fremdhost auf der Whitelist, und ein Auslöser-Text ist
   * hier ohnehin nichts Gemessenes. */
  var VM_SCREENER = ['day_gainers', 'small_cap_gainers', 'most_actives'];
  var vormarktLaeuft = false;
  var vormarktStand = null;   // { zeit, geprueft, zeilen: [...] }

  function vormarktZeilenSauber(roh) {
    var aus = [];
    for (var i = 0; i < (roh || []).length && i < 10; i++) {
      var z = roh[i];
      if (!z || typeof z.sym !== 'string' || !isFinite(z.luecke)) continue;
      aus.push({
        sym: z.sym.toUpperCase().slice(0, 12),
        name: typeof z.name === 'string' ? z.name.slice(0, 40) : '',
        kurs: isFinite(z.kurs) ? z.kurs : 0,
        luecke: z.luecke,
        vol: isFinite(z.vol) ? z.vol : 0,
        kerzen: isFinite(z.kerzen) ? z.kerzen : 0
      });
    }
    return aus;
  }

  async function vormarktSuchen() {
    if (vormarktLaeuft || !window.api || !window.Vormarkt) return;
    vormarktLaeuft = true;
    zeigeVormarkt('Suche läuft – Kandidatenliste wird geholt …');
    try {
      var kandidaten = [];
      for (var s = 0; s < VM_SCREENER.length; s++) {
        var url = 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=' +
          VM_SCREENER[s] + '&count=50';
        var rs = await window.api.fetchText(url);
        if (rs && rs.ok) kandidaten = kandidaten.concat(window.Vormarkt.kandidatenAus(rs.body));
      }
      // Die eigenen 15 Werte immer mitprüfen - siehe Kommentar in vormarkt.js
      STOCKS.forEach(function (x) {
        kandidaten.push({ sym: x.y, name: x.name, kurs: null, vorPct: null, regPct: null, immer: true });
      });
      var liste = window.Vormarkt.vorauswahl(kandidaten, window.Vormarkt.MAX_CHART);
      if (!liste.length) { vormarktFertig([], 0); return; }
      zeigeVormarkt('Suche läuft – ' + liste.length + ' Werte werden nachgesehen …');
      var treffer = [], idx = 0;
      async function bahn() {
        while (idx < liste.length) {
          var k = liste[idx++];
          var cu = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(k.sym) +
            '?range=1d&interval=5m&includePrePost=true';
          var rc = await window.api.fetchText(cu);
          if (!rc || !rc.ok) continue;
          var v = window.Vormarkt.vormarktAusChart(rc.body);
          if (v) treffer.push({ sym: k.sym, name: k.name, kurs: v.kurs, luecke: v.luecke, vol: v.vol, kerzen: v.kerzen });
        }
      }
      var bahnen = [];
      for (var b = 0; b < 4; b++) bahnen.push(bahn());
      await Promise.all(bahnen);
      vormarktFertig(window.Vormarkt.sieben(treffer, window.Vormarkt.MAX_LISTE), liste.length);
    } catch (e) {
      zeigeVormarkt('Die Suche ist nicht durchgelaufen – später noch einmal versuchen.');
    } finally {
      vormarktLaeuft = false;
    }
  }

  function vormarktFertig(zeilen, geprueft) {
    vormarktStand = { zeit: Date.now(), geprueft: geprueft, zeilen: vormarktZeilenSauber(zeilen) };
    try { window.api.storeSet('vormarktStand', vormarktStand); } catch (e) { /* ohne Speicher geht es auch */ }
    zeigeVormarkt();
  }

  function zeigeVormarkt(hinweis) {
    var el = document.getElementById('vormarktKarte');
    if (!el) return;
    var phase = boersenPhase();
    var kopf = '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:6px;">' +
      '<button id="vormarktJetzt" class="btn"' + (vormarktLaeuft ? ' disabled' : '') + '>' +
      (vormarktLaeuft ? 'Suche läuft …' : 'Jetzt nachsehen') + '</button>' +
      '<span style="color:var(--muted); font-size:11.5px;">' +
      (phase === 'vorboerslich'
        ? 'Vorbörse läuft – die Karte sieht alle 10 Minuten von selbst nach.'
        : 'Ausserhalb der US-Vorbörse (10:00–15:30 unserer Zeit) gibt es keine Vorbörsen-Kerzen.') +
      '</span></div>';
    var rumpf;
    if (hinweis) {
      rumpf = '<div class="loading">' + esc(hinweis) + '</div>';
    } else if (!vormarktStand) {
      rumpf = '<div class="loading">Noch nicht gesucht.</div>';
    } else if (!vormarktStand.zeilen.length) {
      rumpf = '<div class="loading">Kein Wert über der Schwelle – ' + nf0.format(vormarktStand.geprueft) +
        ' Werte nachgesehen, Stand ' +
        new Date(vormarktStand.zeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr.</div>';
    } else {
      rumpf = vormarktStand.zeilen.map(function (z) {
        return '<div class="spek-zeile">' +
          '<span class="sym" data-heat="' + esc(z.sym) + '" title="Im Explorer öffnen">' + esc(z.sym) +
          (z.name ? ' <span class="firma">' + esc(z.name) + '</span>' : '') + '</span>' +
          '<span class="spek-chip kauf">+' + fmt(z.luecke, 2) + ' %</span>' +
          '<span class="these">' + fmt(z.kurs, 2) + ' $ vorbörslich' +
          ' <span class="beg">· in ' + nf0.format(z.kerzen) + ' von 66 Vorbörsen-Kerzen gehandelt' +
          (z.vol > 0 ? ', ' + nf0.format(Math.round(z.vol)) + ' Stück' : '') + '</span></span>' +
          '</div>';
      }).join('');
    }
    var fuss = '<div style="color:var(--muted); font-size:11px; margin-top:8px;">' +
      (vormarktStand ? 'Stand ' + new Date(vormarktStand.zeit).toLocaleString('de-DE',
        { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr · ' : '') +
      'Schwellen: Lücke über ' + window.Vormarkt.MIN_LUECKE + ' %, Kurs über ' + window.Vormarkt.MIN_KURS +
      ' $, in mindestens ' + window.Vormarkt.MIN_KERZEN + ' der 5-Minuten-Kerzen gehandelt.' +
      ' Eine Volumen-Schwelle steht bewusst nicht drin: Yahoo liefert vorbörslich kein Volumen (am 23.08.2026' +
      ' an fünf liquiden Werten geprüft, jede Kerze 0). Gezählt wird deshalb, wie lange überhaupt gehandelt wurde.' +
      ' Durchsucht werden die Yahoo-Listen (Tagesgewinner, Nebenwerte, umsatzstärkste) und die 15 Werte dieses Reiters' +
      ' – nicht der ganze Markt: die Listen sortieren nach dem regulären Vortag, ein Wert, der erst heute Nacht springt,' +
      ' kann darin fehlen.' +
      ' Was hier steht, ist beobachtet – nicht gemessen. Keine Anlageberatung.</div>';
    el.innerHTML = kopf + rumpf + fuss;
    var btn = document.getElementById('vormarktJetzt');
    if (btn) btn.onclick = vormarktSuchen;
  }

  async function vormarktStart() {
    try {
      var g = await window.api.storeGet('vormarktStand');
      if (g && Array.isArray(g.zeilen)) {
        vormarktStand = { zeit: g.zeit || Date.now(), geprueft: g.geprueft || 0, zeilen: vormarktZeilenSauber(g.zeilen) };
      }
    } catch (e) { /* ohne Speicher startet die Karte eben leer */ }
    zeigeVormarkt();
    if (boersenPhase() === 'vorboerslich') vormarktSuchen();
  }
  setTimeout(vormarktStart, 8000);
  setInterval(function () { if (boersenPhase() === 'vorboerslich') vormarktSuchen(); }, 10 * 60000);

  /* Laufband oben im Dashboard (Tester-Wunsch #20): dieselben Schlagzeilen wie im
     News-Kasten, als endlos durchlaufendes Band. Der Inhalt wird verdoppelt, damit
     die CSS-Schleife (-50 %) nahtlos wieder am Anfang ankommt. Bewegung nervt
     manche - deshalb pausiert das Band unter dem Mauszeiger (CSS) und respektiert
     prefers-reduced-motion (ebenfalls CSS). */
  function renderTicker() {
    var el = document.getElementById('newsTicker');
    if (!el) return;
    if (!NEWS.length) { el.style.display = 'none'; return; }
    var stueck = NEWS.slice(0, 20).map(function (n) {
      return '<a href="' + esc(safeUrl(n.url)) + '" target="_blank" rel="noopener">' + esc(n.title) + '</a>' +
        '<span class="tickTrenn">•</span>';
    }).join('');
    el.style.display = 'block';
    // Laufzeit an die Textmenge koppeln, sonst rast ein kurzes Band und kriecht ein langes
    var dauer = Math.max(30, Math.min(240, NEWS.slice(0, 20).reduce(function (a, n) { return a + n.title.length; }, 0) / 6));
    el.innerHTML = '<div class="tickSpur" style="animation-duration:' + Math.round(dauer) + 's;">' + stueck + stueck + '</div>';
  }

  /* ================= Info-Fenster beim Draufzeigen (Tester-Wunsch #24) =========
   * Zeigt je Wert die wichtigsten Kennzahlen aus den SCHON GELADENEN Daten
   * (nichts blockiert, nichts wird beim Zeigen berechnet, was teuer waere) und
   * laedt die juengsten News zum Wert einmalig nach - mit 30-Minuten-Cache,
   * damit wiederholtes Zeigen keine neuen Abrufe ausloest. */
  var HOVER_NEWS = {};   // sym -> { t, items: [{title,url,source}] }
  var hoverSym = null, hoverTimer = null;

  function rsi14(series) {
    if (!series || series.length < 15) return null;
    var g = 0, v = 0;
    for (var i = series.length - 14; i < series.length; i++) {
      var d = series[i][1] - series[i - 1][1];
      if (d > 0) g += d; else v -= d;
    }
    if (g + v === 0) return 50;
    return Math.round(100 * g / (g + v));
  }

  function hoverHtml(s, q) {
    var z = [];
    function zeile(k, v2) { z.push('<div class="hv-z"><span>' + k + '</span><b>' + v2 + '</b></div>'); }
    zeile('Kurs', nfP.format(q.price) + ' $');
    if (q.pp && q.pp.kurs) zeile(q.pp.phase === 'vorboerslich' ? 'Vorbörslich' : 'Nachbörslich',
      nfP.format(q.pp.kurs) + ' $ (' + (q.pp.pct > 0 ? '+' : '') + nfP.format(q.pp.pct) + ' %)');
    if (q.pct != null) zeile('Heute', (q.pct > 0 ? '+' : '') + nfP.format(q.pct) + ' %');
    var n = q.series.length;
    if (n >= 6) zeile('1 Woche', (function (r) { return (r > 0 ? '+' : '') + nfP.format(r) + ' %'; })((q.series[n - 1][1] / q.series[n - 6][1] - 1) * 100));
    if (n >= 2) zeile('1 Monat', (function (r) { return (r > 0 ? '+' : '') + nfP.format(r) + ' %'; })((q.series[n - 1][1] / q.series[0][1] - 1) * 100));
    var r14 = rsi14(q.series);
    if (r14 != null) zeile('RSI (14 Tage)', r14 + (r14 >= 70 ? ' – heißgelaufen' : r14 <= 30 ? ' – ausverkauft' : ''));
    if (q.lo52 && q.hi52 && q.hi52 > q.lo52) {
      zeile('52-Wochen-Spanne', Math.round((q.price - q.lo52) / (q.hi52 - q.lo52) * 100) + ' % vom Tief');
    }
    if (s.sharesB) zeile('Marktkapital.', fmtCap(q.price * s.sharesB));
    if (s.eps) zeile('KGV', nfP.format(q.price / s.eps));
    var newsTeil = '<div class="hv-news" id="hvNews"><span class="loading">News werden geladen …</span></div>';
    var c = HOVER_NEWS[s.y];
    if (c && Date.now() - c.t < 30 * 60000) newsTeil = '<div class="hv-news" id="hvNews">' + hoverNewsHtml(c.items) + '</div>';
    return '<div class="hv-kopf"><b>' + esc(s.y) + '</b> · ' + esc(s.name) + '</div>' + z.join('') + newsTeil;
  }

  function hoverNewsHtml(items) {
    if (!items || !items.length) return '<span class="loading">Keine aktuellen News zu diesem Wert.</span>';
    return items.slice(0, 3).map(function (n2) {
      return '<a href="' + esc(safeUrl(n2.url)) + '" target="_blank" rel="noopener">' + esc(n2.title) + '</a>' +
        '<span class="src">' + esc(n2.source) + '</span>';
    }).join('');
  }

  async function hoverNewsLaden(s) {
    var c = HOVER_NEWS[s.y];
    if (c && Date.now() - c.t < 30 * 60000) return;
    var url = 'https://news.google.com/rss/search?q=' + encodeURIComponent(s.name + ' Aktie when:7d') + '&hl=de&gl=DE&ceid=DE:de';
    var items = [];
    try {
      var res = await window.api.fetchText(url);
      if (res.ok) {
        var doc = new DOMParser().parseFromString(res.body, 'text/xml');
        var nodes = doc.querySelectorAll('item');
        for (var i = 0; i < nodes.length && items.length < 3; i++) {
          var t2 = (nodes[i].querySelector('title') || {}).textContent || '';
          var l2 = (nodes[i].querySelector('link') || {}).textContent || '';
          var srcE = nodes[i].querySelector('source');
          var src2 = srcE ? srcE.textContent : 'Google News';
          if (src2 && t2.lastIndexOf(' - ' + src2) > 0) t2 = t2.slice(0, t2.lastIndexOf(' - ' + src2));
          if (t2 && l2) items.push({ title: t2, url: l2, source: src2 });
        }
      }
    } catch (e) { }
    HOVER_NEWS[s.y] = { t: Date.now(), items: items };
    // Nur aktualisieren, wenn das Fenster noch denselben Wert zeigt
    if (hoverSym === s.y) {
      var nEl = document.getElementById('hvNews');
      if (nEl) nEl.innerHTML = hoverNewsHtml(items);
    }
  }

  function hoverZeigen(sym, ankerEl) {
    var s = STOCKS.filter(function (x) { return x.y === sym; })[0];
    var q = Q[sym];
    var hv = document.getElementById('hoverInfo');
    if (!s || !q || !hv) return;
    hoverSym = sym;
    hv.innerHTML = hoverHtml(s, q);
    hv.style.display = 'block';
    // Neben dem Element platzieren, im Fenster halten
    var r = ankerEl.getBoundingClientRect();
    var links = Math.min(window.innerWidth - hv.offsetWidth - 12, r.right + 10);
    if (links < r.left) links = Math.max(8, r.left - hv.offsetWidth - 10);
    var oben = Math.max(8, Math.min(window.innerHeight - hv.offsetHeight - 12, r.top));
    hv.style.left = links + 'px';
    hv.style.top = oben + 'px';
    hoverNewsLaden(s);
  }

  function hoverVerstecken() {
    hoverSym = null;
    var hv = document.getElementById('hoverInfo');
    if (hv) hv.style.display = 'none';
  }

  // Delegation: die Karten/Zeilen werden bei jedem Refresh neu gebaut - die
  // Listener sitzen deshalb auf dem Dokument und schauen aufs data-sym.
  document.addEventListener('mouseover', function (e) {
    var zelle = e.target.closest ? e.target.closest('[data-sym]') : null;
    var hv = document.getElementById('hoverInfo');
    if (zelle) {
      clearTimeout(hoverTimer);
      var sym = zelle.getAttribute('data-sym');
      if (sym !== hoverSym) hoverZeigen(sym, zelle);
    } else if (hv && hv.contains(e.target)) {
      clearTimeout(hoverTimer);   // im Fenster selbst (News anklickbar): offen lassen
    } else if (hoverSym) {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(hoverVerstecken, 250);
    }
  });

  // Klick auf eine Heatmap-Kachel: Wert im Explorer öffnen. Die Kacheln werden bei
  // jedem Refresh neu gebaut, deshalb sitzt auch dieser Listener auf dem Dokument.
  document.addEventListener('click', function (e) {
    var hz = e.target.closest ? e.target.closest('[data-heat]') : null;
    if (!hz) return;
    var sym = hz.getAttribute('data-heat');
    var s = STOCKS.filter(function (x) { return x.y === sym; })[0];
    if (window.Explorer && window.Explorer.oeffne) {
      window.Explorer.oeffne(sym, s ? s.name : sym);
    } else {
      var tab = document.querySelector('[data-tab="explorer"]');
      if (tab) tab.click();
    }
  });

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
    // Ein Fehler im Abruf oder im Rendern darf den Takt nicht killen: vorher stoppte eine
    // einzige Ausnahme die Kursaktualisierung dauerhaft bis zum Neustart der App.
    try { await refreshQuotes(); }
    catch (e) { document.getElementById('err').textContent = 'Aktualisierung fehlgeschlagen: ' + (e && e.message ? e.message : e); }
    finally {
      refreshing = false;
      document.getElementById('refreshBtn').disabled = false;
    }
  }
  document.getElementById('refreshBtn').addEventListener('click', doRefresh);

  function scheduleLoop() {
    var interval = usMarketOpen() ? 60000 : 300000;
    setTimeout(function () { doRefresh().then(scheduleLoop, scheduleLoop); }, interval);
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
    /* Defensiv: skeletons() laeuft VOR dem ersten Kursabruf. Ein Fehler hier haette
     * die ganze Modul-Funktion abgebrochen - keine Kurse, kein 'quotes-updated',
     * und die App saehe lebendig aus, ohne je wieder zu handeln. */
    [['tiles', skel(6, 96, ['w60', 'w40', 'w80'])],
     ['bigtech', skel(7, 150, ['w40', 'w60', 'w80', 'w60'])],
     ['chips', skel(8, 150, ['w40', 'w60', 'w80', 'w60'])],
     ['winners', skel(3, 30, ['w80'])],
     ['losers', skel(3, 30, ['w80'])]].forEach(function (kv) {
      var el = document.getElementById(kv[0]);
      if (el) el.innerHTML = kv[1];
    });
  }
  skeletons();

  // Start – der Takt startet auch dann, wenn der erste Abruf scheitert
  doRefresh().then(scheduleLoop, scheduleLoop);
  refreshNews();
  setInterval(refreshNews, 30 * 60000);
})();
