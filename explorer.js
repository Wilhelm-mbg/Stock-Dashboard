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
      '<h3>Einen Wert öffnen</h3>' +
      '<div style="color:var(--muted); font-size:12.5px;">Suche nach Ticker oder Name (auch deutsche Aktien, ETFs, Indizes, Krypto) – oder starte mit einem Klick:</div>' +
      '<div class="popchips">' + POPULAR.map(function (p, i) { return '<button type="button" data-pop="' + i + '">' + U.esc(p.sym) + ' · ' + U.esc(p.name) + '</button>'; }).join('') + '</div>' +
      '<div style="color:var(--muted); font-size:11.5px; margin-top:10px;">In der Detail-Ansicht: Chart von 1 Tag bis Max., Kennzahlen, News, „KI-Analyse anfordern“ und „Zur Handels-Watchlist“ (dann handeln die Strategien den Wert mit).</div>' +
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
      var q = r.indicators.quote[0] || {};
      var ts = r.timestamp || [], closes = q.close || [], hi = q.high || [], lo = q.low || [], vo = q.volume || [];
      var series = [], bars = [];
      for (var i = 0; i < ts.length; i++) {
        if (closes[i] == null) continue;
        var t = ts[i] * 1000, c = closes[i];
        series.push([t, c]);
        // Vollformat fuer die Signalrechnung: [Zeit, Schluss, Volumen, Hoch, Tief]
        bars.push([t, c, vo[i] || 0, hi[i] != null ? hi[i] : c, lo[i] != null ? lo[i] : c]);
      }
      return { series: series, bars: bars, meta: r.meta || {} };
    } catch (e) { return null; }
  }

  /* ================= Detail-Ansicht ================= */
  var openSeq = 0; // Stale-Antworten verwerfen: schnelles Symbol-Wechseln überschrieb sonst
                   // Kennzahlen/CURDATA mit den Daten des VORHERIGEN Symbols
  async function openDetail(hit) {
    var seq = ++openSeq;
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
    buildChartLeiste();

    // Tagesdaten (2 Jahre) für Kennzahlen/Analyse + aktueller Range-Chart + News parallel
    var daily = await fetchRange(hit.sym, '2y', '1d');
    if (seq !== openSeq) return; // inzwischen wurde ein anderes Symbol geöffnet
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
        ['Vola (30T, annualisiert)', (closes && closes.length >= 35) ? Math.round(vol30 * 100) + ' %' : '–'], // <35 Tage: histVol liefert nur den 30-%-Platzhalter
        ['RSI (14)', r14 != null ? Math.round(r14) : '–'],
        ['SMA 50', (function () { var s = Q.sma(closes, 50); return s ? U.nf2.format(s) : '–'; })()],
        ['SMA 200', (function () { var s = Q.sma(closes, 200); return s ? U.nf2.format(s) : '–'; })()]
      ];
      // Börsenname und Währung kommen von Yahoo, also von außen – sie gehören escaped
      // ins DOM wie jeder andere Fremdtext auch (überall sonst macht die App das bereits).
      document.getElementById('expStats').innerHTML = stats.map(function (s) { return '<dt>' + U.esc(s[0]) + '</dt><dd>' + U.esc(s[1]) + '</dd>'; }).join('');
    }
    loadRange();
    loadNews();
  }

  /** Zeitraum-, Kerzen- und Signalwahl verdrahten. Einmal beim Start, nicht je Symbol. */
  function buildChartLeiste() {
    var zEl = document.getElementById('expZeit'), kEl = document.getElementById('expKerze');
    if (zEl && !zEl.__bereit) {
      zEl.__bereit = true;
      zEl.addEventListener('change', function () {
        // Schnellwahl-Knoepfe abwaehlen, sobald frei gewaehlt wird - sonst waere unklar, was gilt
        var rb = document.getElementById('expRanges');
        if (rb && zEl.value) rb.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        loadRange();
      });
    }
    if (kEl && !kEl.__bereit) { kEl.__bereit = true; kEl.addEventListener('change', function () { loadRange(); }); }
    var leiste = document.getElementById('expSignalLeiste');
    if (leiste && !leiste.__bereit) {
      leiste.__bereit = true;
      leiste.querySelectorAll('input[data-sig]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          sigAn[cb.getAttribute('data-sig')] = cb.checked;
          // Neu zeichnen genuegt - die Kurse sind schon da, es wird nichts nachgeladen
          drawBig(document.getElementById('bigchart'), CURDATA.rangeSeries || [], letzteBeschriftung);
        });
      });
    }
    var indL = document.getElementById('expIndiLeiste');
    if (indL && !indL.__bereit) {
      indL.__bereit = true;
      indL.querySelectorAll('input[data-ind]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          indAn[cb.getAttribute('data-ind')] = cb.checked;
          drawBig(document.getElementById('bigchart'), CURDATA.rangeSeries || [], letzteBeschriftung);
        });
      });
    }
  }
  var letzteBeschriftung = '';

  function buildRangeButtons() {
    var el = document.getElementById('expRanges');
    el.innerHTML = RANGES.map(function (r) {
      return '<button data-range="' + r.k + '" class="' + (r.k === activeRange ? 'active' : '') + '">' + r.k + '</button>';
    }).join('');
    el.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        activeRange = b.getAttribute('data-range');
        var zEl3 = document.getElementById('expZeit');
        if (zEl3) zEl3.value = '';        // Schnellwahl hebt die freie Wahl auf
        el.querySelectorAll('button').forEach(function (x) { x.classList.toggle('active', x === b); });
        loadRange();
      });
    });
  }

  /* Yahoo begrenzt Intraday-Daten hart und lehnt zu weite Anfragen mit einem Fehler ab.
   * Am 20.08.2026 ausgemessen - das sind die tatsaechlichen Obergrenzen, nicht geschaetzt. */
  var MAX_ZEIT = { '1m': '7d', '5m': '60d', '15m': '60d', '60m': '730d' };
  var ZEIT_TAGE = { '5d': 5, '1mo': 30, '60d': 60, '6mo': 182, '1y': 365, '2y': 730, '5y': 1825, 'max': 99999, '7d': 7, '730d': 730 };

  /** Passt den Zeitraum an, wenn er fuer die gewaehlte Kerzengroesse zu weit reicht.
   *  Lieber stillschweigend kuerzen und es DAZUSCHREIBEN, als eine leere Antwort zeigen. */
  function zeitPruefen(zeit, kerze) {
    var max = MAX_ZEIT[kerze];
    if (!max) return { zeit: zeit, hinweis: '' };
    if ((ZEIT_TAGE[zeit] || 0) <= (ZEIT_TAGE[max] || 0)) return { zeit: zeit, hinweis: '' };
    var txt = { '7d': '7 Tage', '60d': '60 Tage', '730d': '730 Handelstage' }[max] || max;
    return { zeit: max, hinweis: 'Bei ' + kerze + '-Kerzen liefert die Quelle höchstens ' + txt + ' – darauf gekürzt.' };
  }

  async function loadRange() {
    if (!CUR) return;
    var seqR = openSeq;
    var zEl = document.getElementById('expZeit'), kEl = document.getElementById('expKerze');
    var hEl = document.getElementById('expZeitHinweis');
    var zeit, kerze, beschriftung;
    if (zEl && zEl.value) {
      // Freie Wahl hat Vorrang vor den Schnellwahl-Knoepfen
      var pr = zeitPruefen(zEl.value, kEl.value);
      zeit = pr.zeit; kerze = kEl.value;
      if (hEl) hEl.textContent = pr.hinweis;
      beschriftung = zEl.options[zEl.selectedIndex].text + ' · ' + kEl.options[kEl.selectedIndex].text;
    } else {
      var r = RANGES.filter(function (x) { return x.k === activeRange; })[0];
      zeit = r.range; kerze = r.interval; beschriftung = r.k;
      if (hEl) hEl.textContent = '';
      if (kEl) kEl.value = r.interval;
    }
    var data = await fetchRange(CUR.sym, zeit, kerze);
    if (seqR !== openSeq) return; // Symbol wurde inzwischen gewechselt
    if (!data || !data.series.length) {
      if (hEl) hEl.textContent = 'Für diese Kombination liefert die Quelle keine Daten.';
    }
    CURDATA.rangeSeries = data ? data.series : null;
    CURDATA.rangeBars = data ? data.bars : null;
    CURDATA.kerze = kerze;
    letzteBeschriftung = beschriftung;
    drawBig(document.getElementById('bigchart'), data ? data.series : [], beschriftung);
  }

  var bigMeta = null;
  /* ================= Signale im Chart =================
   * Berechnet mit denselben Funktionen, die auch die Messung und der Handel benutzen -
   * es wird nichts fuer die Anzeige nachgebaut. Was hier zu sehen ist, ist exakt das,
   * worauf die Automatik reagieren wuerde. */
  var SIGNALE = {
    cross:     { name: 'EMA-Kreuzung', farbe: '#4a9eff', fn: function (b) { var r = Q.signalCross(b, 'ema', 20, 15); return r.crossed ? (r.crossed === 'up' ? 'call' : 'put') : null; } },
    reversion: { name: 'Umkehr',       farbe: '#c084fc', fn: function (b) { return Q.reversionSignal(b, 'ema', 20, 1.5).signal; } },
    pullback:  { name: 'Rücksetzer',   farbe: '#fbbf24', fn: function (b) { return Q.pullbackSignal(b, 'ema', 20, 15).signal; } },
    rsi2:      { name: 'RSI(2)',       farbe: '#34d399', fn: function (b) { return Q.rsiExtremSignal(b).signal; } },
    donchian:  { name: 'Donchian',     farbe: '#fb7185', fn: function (b) { return Q.donchianSignal(b, 20, 15).signal; } },
    squeeze:   { name: 'Squeeze',      farbe: '#f472b6', fn: function (b) { return Q.squeezeSignal(b, 20).signal; } }
  };
  var sigAn = {};
  var indAn = {};        // Chartbild: gleitende Durchschnitte, Kanal, Zonen, Volumen

  /** Signale ueber die geladene Kursreihe rechnen.
   *  Jeder Punkt sieht nur die Kerzen BIS zu sich selbst - kein Blick in die Zukunft,
   *  sonst zeigte der Chart Signale, die es zu dem Zeitpunkt gar nicht gab. */
  function signalePunkte(bars) {
    var raus = [];
    var keys = Object.keys(SIGNALE).filter(function (k) { return sigAn[k]; });
    // Frueher lag die Untergrenze bei 130 Kerzen - auf einem Monatschart (21 Kerzen)
    // erschien deshalb NIE etwas, und es sah aus, als seien die Signale kaputt.
    // Jede Signalfunktion prueft ihre eigene Mindestlaenge selbst; hier genuegt es,
    // offensichtlich zu kurze Reihen abzuweisen.
    if (!keys.length || !bars || bars.length < 40) return raus;
    var start = Math.max(30, bars.length - 1200);        // Anzeige-Obergrenze: sonst rechnet der Chart ewig
    for (var i = start; i < bars.length; i++) {
      var fenster = bars.slice(Math.max(0, i - 300), i + 1);
      for (var ki = 0; ki < keys.length; ki++) {
        var def = SIGNALE[keys[ki]], d = null;
        try { d = def.fn(fenster); } catch (e) { d = null; }
        if (d) raus.push({ t: bars[i][0], preis: bars[i][1], dir: d, farbe: def.farbe, name: def.name });
      }
    }
    return raus;
  }

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
    /* --- Chartbild: Durchschnitte, Kanal, Zonen, Volumen --- */
    var indiPfad = '', zonen = '', volBalken = '', kreuze = '';
    var barsI = CURDATA.rangeBars;
    if (barsI && barsI.length > 30) {
      var cI = barsI.map(function (b) { return b[1]; });
      /** Einfacher gleitender Durchschnitt als Reihe - fuer die ANZEIGE.
       *  Bewusst SMA und nicht EMA: "SMA 50/200" ist das, was in jedem Chartprogramm
       *  steht, und der Nutzer soll dasselbe sehen. */
      function smaReihe(a, n) {
        var out = new Array(a.length).fill(null), summe = 0;
        for (var i2 = 0; i2 < a.length; i2++) {
          summe += a[i2];
          if (i2 >= n) summe -= a[i2 - n];
          if (i2 >= n - 1) out[i2] = summe / n;
        }
        return out;
      }
      function pfadAus(reihe, farbe, breite, strich) {
        var p = [];
        for (var i3 = 0; i3 < barsI.length; i3++) {
          if (reihe[i3] == null || barsI[i3][0] < x0 || barsI[i3][0] > x1) continue;
          p.push((p.length ? 'L' : 'M') + X(barsI[i3][0]).toFixed(1) + ' ' + Y(reihe[i3]).toFixed(1));
        }
        return p.length > 1 ? '<path d="' + p.join(' ') + '" fill="none" stroke="' + farbe + '" stroke-width="' + breite +
          '"' + (strich ? ' stroke-dasharray="' + strich + '"' : '') + ' opacity="0.85"></path>' : '';
      }
      var s50 = null, s200 = null;
      if (indAn.ma || indAn.cross50200) {
        s50 = smaReihe(cI, Math.min(50, Math.floor(cI.length / 3)));
        s200 = smaReihe(cI, Math.min(200, Math.floor(cI.length / 2)));
      }
      if (indAn.ma) {
        indiPfad += pfadAus(s50, '#4a9eff', 1.3);
        indiPfad += pfadAus(s200, '#f59e0b', 1.6);
      }
      if (indAn.cross50200 && s50 && s200) {
        for (var ck = 1; ck < barsI.length; ck++) {
          if (s50[ck] == null || s200[ck] == null || s50[ck - 1] == null || s200[ck - 1] == null) continue;
          if (barsI[ck][0] < x0 || barsI[ck][0] > x1) continue;
          var golden = s50[ck - 1] <= s200[ck - 1] && s50[ck] > s200[ck];
          var death = s50[ck - 1] >= s200[ck - 1] && s50[ck] < s200[ck];
          if (!golden && !death) continue;
          var cx = X(barsI[ck][0]), cy = Y(s50[ck]);
          kreuze += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5" fill="none" stroke="' +
            (golden ? 'var(--up)' : 'var(--down)') + '" stroke-width="2"><title>' +
            (golden ? 'Golden Cross' : 'Death Cross') + ' · SMA50 kreuzt SMA200 ' + (golden ? 'nach oben' : 'nach unten') +
            '\n' + new Date(barsI[ck][0]).toLocaleDateString('de-DE') +
            '\nHinweis: an 191 Werten über 55 Jahre gemessen hat dieses Signal keinen Vorsprung (48 % Trefferquote).' +
            '</title></circle>';
        }
      }
      if (indAn.kanal && barsI.length >= 60) {
        // Regressionskanal ueber das sichtbare Fenster: Gerade durch die Kurse,
        // Ober- und Unterkante im groessten Abstand nach oben bzw. unten.
        var sicht = [];
        for (var v = 0; v < barsI.length; v++) if (barsI[v][0] >= x0 && barsI[v][0] <= x1) sicht.push({ i: v, t: barsI[v][0], c: cI[v] });
        if (sicht.length >= 20) {
          var nS = sicht.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
          for (var q = 0; q < nS; q++) { sx += q; sy += sicht[q].c; sxx += q * q; sxy += q * sicht[q].c; }
          var nenner = nS * sxx - sx * sx;
          if (nenner !== 0) {
            var st = (nS * sxy - sx * sy) / nenner, ac = (sy - st * sx) / nS;
            var obenAb = -Infinity, untenAb = Infinity;
            for (var q2 = 0; q2 < nS; q2++) { var ab = sicht[q2].c - (ac + st * q2); if (ab > obenAb) obenAb = ab; if (ab < untenAb) untenAb = ab; }
            function kante(off, farbe, breite, strich) {
              var p1 = ac + off, p2 = ac + st * (nS - 1) + off;
              return '<line x1="' + X(sicht[0].t).toFixed(1) + '" y1="' + Y(p1).toFixed(1) +
                '" x2="' + X(sicht[nS - 1].t).toFixed(1) + '" y2="' + Y(p2).toFixed(1) +
                '" stroke="' + farbe + '" stroke-width="' + breite + '"' + (strich ? ' stroke-dasharray="' + strich + '"' : '') + ' opacity="0.7"></line>';
            }
            var richtung = st > 0 ? 'aufwärts' : st < 0 ? 'abwärts' : 'seitwärts';
            indiPfad += kante(0, '#a78bfa', 1.4) + kante(obenAb, '#a78bfa', 1, '4 4') + kante(untenAb, '#a78bfa', 1, '4 4') +
              '<text x="' + (X(sicht[nS - 1].t) - 4).toFixed(1) + '" y="' + (Y(ac + st * (nS - 1) + obenAb) - 4).toFixed(1) +
              '" fill="#a78bfa" font-size="10" text-anchor="end">Kanal ' + richtung + '</text>';
          }
        }
      }
      if (indAn.sr) {
        // Unterstuetzung und Widerstand als Hoch/Tief der letzten 20 und 60 Kerzen.
        // Das ist dieselbe Groesse, die der Donchian-Detektor benutzt - was man sieht,
        // ist also genau das, worauf die Automatik reagieren wuerde.
        [[20, '#94a3b8'], [60, '#64748b']].forEach(function (paar) {
          var nn = paar[0];
          if (barsI.length < nn + 2) return;
          var hoch = -Infinity, tief = Infinity;
          for (var k4 = barsI.length - nn; k4 < barsI.length; k4++) {
            var hh = barsI[k4][3] != null ? barsI[k4][3] : barsI[k4][1];
            var ll = barsI[k4][4] != null ? barsI[k4][4] : barsI[k4][1];
            if (hh > hoch) hoch = hh; if (ll < tief) tief = ll;
          }
          [[hoch, 'Widerstand'], [tief, 'Unterstützung']].forEach(function (z) {
            if (z[0] < y0 || z[0] > y1) return;
            var yy = Y(z[0]);
            zonen += '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) +
              '" stroke="' + paar[1] + '" stroke-width="1" stroke-dasharray="6 4" opacity="0.75"></line>' +
              '<text x="' + (pad + 3) + '" y="' + (yy - 3).toFixed(1) + '" fill="' + paar[1] + '" font-size="9">' +
              z[1] + ' ' + nn + ' · ' + U.nf2.format(z[0]) + '</text>';
          });
        });
      }
      if (indAn.volumen) {
        var maxV = 0;
        for (var vv = 0; vv < barsI.length; vv++) if ((barsI[vv][2] || 0) > maxV) maxV = barsI[vv][2] || 0;
        if (maxV > 0) {
          var hVol = Math.round((H - pad - padB) * 0.18);
          var bw = Math.max(1, (W - 2 * pad) / Math.max(1, barsI.length) * 0.8);
          for (var vb = 0; vb < barsI.length; vb++) {
            if (barsI[vb][0] < x0 || barsI[vb][0] > x1) continue;
            var vh = (barsI[vb][2] || 0) / maxV * hVol;
            if (vh < 0.4) continue;
            var steigt = vb === 0 || cI[vb] >= cI[vb - 1];
            volBalken += '<rect x="' + (X(barsI[vb][0]) - bw / 2).toFixed(1) + '" y="' + (H - padB - vh).toFixed(1) +
              '" width="' + bw.toFixed(1) + '" height="' + vh.toFixed(1) + '" fill="' +
              (steigt ? 'var(--up)' : 'var(--down)') + '" opacity="0.22"></rect>';
          }
        }
      }
    }

    /* --- Signale und Leitlinie --- */
    var marker = '', linienPfad = '';
    var bars = CURDATA.rangeBars;
    if (bars && bars.length > 30) {
      if (sigAn.linie) {
        var closesL = bars.map(function (b) { return b[1]; });
        var linie = Q.emaSeries(closesL, 20);
        var lp = [];
        for (var li = 20; li < bars.length; li++) {
          if (bars[li][0] < x0 || bars[li][0] > x1) continue;
          lp.push((lp.length ? 'L' : 'M') + X(bars[li][0]).toFixed(1) + ' ' + Y(linie[li]).toFixed(1));
        }
        if (lp.length > 1) linienPfad = '<path d="' + lp.join(' ') + '" fill="none" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" opacity="0.8"></path>';
      }
      var punkte = signalePunkte(bars);
      // Zaehler fuer die Bedienleiste - macht sichtbar, wie oft ein Setup ueberhaupt anschlaegt
      var zEl2 = document.getElementById('expSigZahl');
      var etwasAn = Object.keys(sigAn).some(function (k) { return sigAn[k] && k !== 'linie'; });
      if (zEl2) {
        if (punkte.length) zEl2.textContent = punkte.length + ' Signale im gezeigten Zeitraum';
        else if (!etwasAn) zEl2.textContent = '';
        else if (bars.length < 130) zEl2.textContent = 'Nur ' + bars.length +
          ' Kerzen – die meisten Signale brauchen mehr Vorlauf. Längeren Zeitraum oder feinere Kerzen wählen.';
        else zEl2.textContent = 'kein Signal in diesem Zeitraum';
      }
      punkte.forEach(function (p) {
        if (p.t < x0 || p.t > x1) return;
        var px = X(p.t), py = Y(p.preis);
        // Call unter dem Kurs (Dreieck nach oben), Put darueber (nach unten) - so ueberdecken
        // sie den Kursverlauf nicht und die Richtung ist ohne Legende erkennbar.
        var d2 = p.dir === 'call'
          ? 'M' + px + ' ' + (py + 6) + ' l4 7 l-8 0 Z'
          : 'M' + px + ' ' + (py - 6) + ' l4 -7 l-8 0 Z';
        marker += '<path d="' + d2 + '" fill="' + p.farbe + '" opacity="0.85"><title>' + p.name + ' · ' +
          (p.dir === 'call' ? 'Kauf' : 'Verkauf') + '\n' +
          new Date(p.t).toLocaleString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) +
          '\n' + U.nf2.format(p.preis) + '</title></path>';
      });
    }
    var first = series[0][1], last = series[series.length - 1][1];
    var chg = (last / first - 1) * 100;
    svg.innerHTML = grid +
      '<path d="' + d + ' L' + X(x1).toFixed(1) + ' ' + (H - padB) + ' L' + X(x0).toFixed(1) + ' ' + (H - padB) + ' Z" fill="var(--series-soft)"></path>' +
      '<path d="' + d + '" fill="none" stroke="var(--series)" stroke-width="2" vector-effect="non-scaling-stroke"></path>' +
      volBalken + zonen + indiPfad + linienPfad + kreuze + marker +
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
        return '<div class="news-item"><div class="t"><a href="' + U.esc(U.safeUrl(n.url)) + '" target="_blank" rel="noopener">' + U.esc(n.title) + '</a></div><div class="src">' + when + '</div></div>';
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
    if (!body) body = localAnalysis(c) + '\n\n*Tipp: In den Einstellungen () die lokale KI (Ollama) einrichten – dann erstellt ein Sprachmodell die Analyse aus denselben Daten, ohne API-Kosten.*';
    st.textContent = '';
    btn.disabled = false;
    document.getElementById('aiTitle').textContent = 'KI-Analyse: ' + CUR.name + ' (' + CUR.sym + ')' + (usedLLM ? '' : ' – regelbasiert');
    document.getElementById('aiBody').innerHTML = U.md(body) +
      '<div class="warn">Simulations-/Informationszweck. Automatische Analysen (insbesondere Elliott-Wellen-Zählungen) sind unsicher und mehrdeutig. Keine Anlageberatung.</div>';
    window.openModal('aiModalBg');
  }
  document.getElementById('aiBtn').addEventListener('click', requestAnalysis);

  // Zur Handels-Watchlist hinzufügen (KI-Depot handelt den Wert dann mit)
  document.getElementById('watchBtn').addEventListener('click', function () {
    if (!CUR || !window.DepotAPI) return;
    var st = document.getElementById('aiStatus');
    var r = window.DepotAPI.addWatch(CUR.sym, CUR.name);
    st.textContent = r === true ? '' + CUR.sym + ' wird jetzt mitgehandelt (siehe Optionsscheine → Strategien).'
      : r === 'standard' ? CUR.sym + ' ist schon in der Standard-Watchlist.'
      : r === 'schon' ? CUR.sym + ' ist bereits auf deiner Watchlist.'
      : 'Konnte nicht hinzugefügt werden.';
    setTimeout(function () { st.textContent = ''; }, 5000);
  });
})();
