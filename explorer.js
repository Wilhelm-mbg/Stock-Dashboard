'use strict';
/* Aktien-Explorer: freie Suche (Yahoo-Universum), Voll-Chart 1T–Max,
   Kennzahlen, News, regelbasierte Analyse. */
(function () {
  var Q = window.Quant, U = window.U;
  var CUR = null; // aktuell angezeigtes Symbol {sym, name, exch, type}
  var CURDATA = { daily: null, rangeSeries: null, meta: null, news: [] };
  var RANGES = [
    { k: '1T', range: '1d', interval: '5m' },
    { k: '5T', range: '5d', interval: '15m' },
    // 1M mit Stundenkerzen statt Tageskerzen: ein Monat hat nur ~21 Handelstage,
    // und fast jedes Signal braucht 40+ Kerzen Vorlauf - mit Tageskerzen war die
    // Monatsansicht deshalb immer leer (Tester-Meldung #10). ~150 Stundenkerzen
    // tragen Signale, Kanal und Durchschnitte.
    { k: '1M', range: '1mo', interval: '60m' },
    // 6M ebenfalls mit Stundenkerzen: 126 Tageskerzen liegen unter dem Vorlauf,
    // den die meisten Signale brauchen (~130) - die Halbjahresansicht zeigte
    // deshalb kaum je etwas. ~780 Stundenkerzen tragen alles.
    { k: '6M', range: '6mo', interval: '60m' },
    { k: '1J', range: '1y', interval: '1d' },
    { k: '5J', range: '5y', interval: '1wk' },
    { k: 'Max', range: 'max', interval: '1mo' }
  ];
  var activeRange = '1J';

  /* ================= Suche ================= */
  /* Gescheiterte Suche und leere Suche waren dasselbe: beide gaben [] zurueck und die
   * Liste sagte "Nichts gefunden." Bei abgerissener Verbindung behauptet die App damit,
   * es GAEBE das Papier nicht - und man sucht den Fehler bei sich statt beim Netz.
   * Der Fehlerfall traegt jetzt seinen Grund mit. */
  async function search(q) {
    var url = 'https://query1.finance.yahoo.com/v1/finance/search?q=' + encodeURIComponent(q) + '&quotesCount=10&newsCount=0&listsCount=0';
    var res;
    try { res = await window.api.fetchText(url); } catch (e) { return { fehler: String(e && e.message || e) }; }
    if (!res || !res.ok) return { fehler: (res && res.status ? 'Die Suche antwortete mit Status ' + res.status : 'Keine Antwort von der Suche') };
    try {
      var j = JSON.parse(res.body);
      return (j.quotes || []).filter(function (x) { return x.symbol; }).map(function (x) {
        return { sym: x.symbol, name: x.longname || x.shortname || x.symbol, exch: x.exchDisp || x.exchange || '', type: x.typeDisp || x.quoteType || '' };
      });
    } catch (e) { return { fehler: 'Die Antwort der Suche war unlesbar' }; }
  }

  function renderResults(hits) {
    var el = document.getElementById('expResults');
    if (hits && hits.fehler) {
      el.innerHTML = '<div class="panel" style="padding:12px 16px; color:var(--down);">' +
        '<b>Die Suche konnte nicht ausgeführt werden.</b><br>' +
        '<span style="color:var(--muted); font-size:var(--fs-neben);">' + U.esc(hits.fehler) +
        ' – das heißt nicht, dass es den Wert nicht gibt. Noch einmal versuchen, sobald die Verbindung steht.</span></div>';
      return;
    }
    if (!hits.length) { el.innerHTML = '<div class="panel" style="padding:12px 16px; color:var(--muted);">Nichts gefunden.</div>'; return; }
    /* <button> statt <div>: Die Trefferliste war reine Mausbedienung - per Tastatur
       kam man an keinen einzigen Treffer heran. type="button" verhindert, dass Enter
       das umgebende Suchformular abschickt. */
    el.innerHTML = '<div class="panel" role="list">' + hits.map(function (h, i) {
      return '<button type="button" class="exp-hit" role="listitem" data-hit="' + i + '">' +
        '<span class="s">' + U.esc(h.sym) + '</span><span class="n">' + U.esc(h.name) + '</span>' +
        '<span class="x">' + U.esc(h.type) + ' · ' + U.esc(h.exch) + '</span></button>';
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
      '<div style="color:var(--muted); font-size:var(--fs-text);">Suche nach Ticker oder Name (auch deutsche Aktien, ETFs, Indizes, Krypto) – oder starte mit einem Klick:</div>' +
      '<div class="popchips">' + POPULAR.map(function (p, i) { return '<button type="button" data-pop="' + i + '">' + U.esc(p.sym) + ' · ' + U.esc(p.name) + '</button>'; }).join('') + '</div>' +
      '<div style="color:var(--muted); font-size:var(--fs-neben); margin-top:10px;">In der Detail-Ansicht: Chart von 1 Tag bis Max., Kennzahlen, News, „Analyse anfordern“ und „Zur Handels-Watchlist“ (dann handeln die Strategien den Wert mit).</div>' +
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
  async function fetchRange(sym, range, interval, von, bis) {
    // Entweder benannter Zeitraum ODER freie Datumsgrenzen (period1/period2 in Sekunden)
    /* ROH: Der Explorer zeigt den Chart, den man auch beim Broker sieht, und rechnet
     * dieselben Signale wie der Live-Handel - beides auf dem tatsaechlich gehandelten
     * Kurs. Die Balken kommen im Vollformat [Zeit, Schluss, Volumen, Hoch, Tief,
     * Eroeffnung]; Luecken in Hoch/Tief/Eroeffnung fuellt der Lader mit dem Schluss. */
    var kd = await window.Kurse.hole(sym, (von && bis)
      ? { von: von, bis: bis, interval: interval, bereinigt: false }
      : { range: range, interval: interval, bereinigt: false });
    if (!kd) return null;
    return { series: window.Kurse.reihe(kd.bars), bars: kd.bars, meta: kd.meta };
  }

  /* ================= Detail-Ansicht ================= */
  var openSeq = 0; // Stale-Antworten verwerfen: schnelles Symbol-Wechseln überschrieb sonst
                   // Kennzahlen/CURDATA mit den Daten des VORHERIGEN Symbols
  async function openDetail(hit) {
    var seq = ++openSeq;
    CUR = hit;
    activeRange = '1J';
    // Menues auf den Startzustand der Schnellwahl stellen (Menues = einzige Wahrheit)
    var zElO = document.getElementById('expZeit'), kElO = document.getElementById('expKerze');
    if (zElO) zElO.value = '1y';
    if (kElO) kElO.value = '1d';
    var vElO = document.getElementById('expVon'), bElO = document.getElementById('expBis');
    if (vElO) vElO.value = ''; if (bElO) bElO.value = '';
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
        if (rb) rb.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
        // Handwahl des Zeitraums hebt die Datumswahl auf
        var v4 = document.getElementById('expVon'), b4 = document.getElementById('expBis');
        if (v4) v4.value = ''; if (b4) b4.value = '';
        loadRange();
      });
    }
    if (kEl && !kEl.__bereit) { kEl.__bereit = true; kEl.addEventListener('change', function () { loadRange(); }); }
    ['expVon', 'expBis'].forEach(function (idD) {
      var eD = document.getElementById(idD);
      if (eD && !eD.__bereit) {
        eD.__bereit = true;
        eD.addEventListener('change', function () {
          var rb2 = document.getElementById('expRanges');
          if (rb2) rb2.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); });
          loadRange();
        });
      }
    });
    var leiste = document.getElementById('expSignalLeiste');
    if (leiste && !leiste.__bereit) {
      leiste.__bereit = true;
      leiste.querySelectorAll('input[data-sig]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          sigAn[cb.getAttribute('data-sig')] = cb.checked;
          // Neu zeichnen genuegt - die Kurse sind schon da, es wird nichts nachgeladen
          drawAktuell();
        });
      });
    }
    var artL = document.getElementById('expChartArt');
    if (artL && !artL.__bereit) {
      artL.__bereit = true;
      artL.addEventListener('change', function () {
        chartArt = artL.value;
        drawAktuell();
      });
    }
    var indL = document.getElementById('expIndiLeiste');
    if (indL && !indL.__bereit) {
      indL.__bereit = true;
      indL.querySelectorAll('input[data-ind]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          indAn[cb.getAttribute('data-ind')] = cb.checked;
          drawAktuell();
        });
      });
    }
  }
  var letzteBeschriftung = '';

  /* ---- Mausrad-Zoom (Tester-Wunsch #27) ----
   * Zoomt in die GELADENE Reihe hinein, ohne neu zu laden: zoomFenster haelt die
   * sichtbaren Indizes. Rad nach vorn verengt das Fenster um den Mauszeiger
   * herum, Rad zurueck weitet es; ganz herausgezoomt (null) gilt die volle Reihe. */
  var zoomFenster = null;   // {von, bis} als Indizes in CURDATA.rangeSeries
  function sichtbareSerie() {
    var s = CURDATA.rangeSeries || [];
    if (!zoomFenster || !s.length) return s;
    return s.slice(Math.max(0, zoomFenster.von), Math.min(s.length, zoomFenster.bis + 1));
  }
  function drawAktuell() {
    drawBig(document.getElementById('bigchart'), sichtbareSerie(),
      letzteBeschriftung + (zoomFenster ? ' · Ausschnitt (Rad zurück = ganz)' : ''));
  }
  (function () {
    var svgZ = document.getElementById('bigchart');
    if (!svgZ || svgZ.__zoomBereit) return;
    svgZ.__zoomBereit = true;
    svgZ.addEventListener('wheel', function (ev) {
      var s = CURDATA.rangeSeries || [];
      if (s.length < 40) return;
      ev.preventDefault();                                  // Seite soll nicht mitscrollen
      var von = zoomFenster ? zoomFenster.von : 0;
      var bis = zoomFenster ? zoomFenster.bis : s.length - 1;
      var len = bis - von + 1;
      var r = svgZ.getBoundingClientRect();
      var frac = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
      var anker = von + Math.round(frac * (len - 1));       // Kerze unterm Mauszeiger bleibt stehen
      var neuLen = ev.deltaY < 0 ? Math.max(30, Math.round(len * 0.75)) : Math.round(len / 0.75);
      if (neuLen >= s.length) { zoomFenster = null; drawAktuell(); return; }
      var neuVon = Math.max(0, anker - Math.round(frac * (neuLen - 1)));
      var neuBis = Math.min(s.length - 1, neuVon + neuLen - 1);
      neuVon = Math.max(0, neuBis - neuLen + 1);
      zoomFenster = { von: neuVon, bis: neuBis };
      drawAktuell();
    }, { passive: false });
  })();

  function buildRangeButtons() {
    var el = document.getElementById('expRanges');
    el.innerHTML = RANGES.map(function (r) {
      return '<button data-range="' + r.k + '" class="' + (r.k === activeRange ? 'active' : '') + '">' + r.k + '</button>';
    }).join('');
    el.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        activeRange = b.getAttribute('data-range');
        /* Aufgeraeumt (Tester-Meldungen #23/#26): Die Menues sind die EINZIGE
           Wahrheit - ein Schnellwahl-Knopf setzt nur die beiden Menues und laedt.
           Frueher liefen zwei getrennte Zweige, und der Schnellwahl-Zweig
           ueberschrieb jede Kerzenwahl sofort wieder. */
        var r = RANGES.filter(function (x) { return x.k === activeRange; })[0];
        var zEl3 = document.getElementById('expZeit'), kEl3 = document.getElementById('expKerze');
        if (zEl3) zEl3.value = r.range;
        if (kEl3) kEl3.value = r.interval;
        var v3 = document.getElementById('expVon'), b3 = document.getElementById('expBis');
        if (v3) v3.value = ''; if (b3) b3.value = '';   // Schnellwahl hebt die Datumswahl auf
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
    var vEl = document.getElementById('expVon'), bEl = document.getElementById('expBis');
    var hEl = document.getElementById('expZeitHinweis');
    /* EIN Weg statt zwei (Tester-Meldungen #23/#26): Die Menues sind die einzige
       Wahrheit; Schnellwahl-Knoepfe setzen nur die Menues. Der fruehere zweite
       Zweig ueberschrieb jede Kerzenwahl sofort wieder - das Kerzen-Menue wirkte
       tot, solange eine Schnellwahl aktiv war.
       selectedIndex bleibt defensiv geprueft (.options[-1].text warf frueher
       einen TypeError, Tester-Meldung #12). */
    var kerze = (kEl && kEl.selectedIndex >= 0 && kEl.value) ? kEl.value : '1d';
    var kTxt = (kEl && kEl.selectedIndex >= 0) ? kEl.options[kEl.selectedIndex].text : kerze;
    var zeit, beschriftung, von = null, bis = null;
    if (vEl && bEl && vEl.value && bEl.value) {
      // Freie Datumswahl (Tester-Wunsch #25): von/bis schlaegt alles andere
      von = Date.parse(vEl.value); bis = Date.parse(bEl.value) + 86399000; // bis-Tag einschliesslich
      if (!(von < bis)) { if (hEl) hEl.textContent = '„Von" muss vor „Bis" liegen.'; return; }
      var spannTage = Math.ceil((bis - von) / 86400000);
      var maxT = ZEIT_TAGE[MAX_ZEIT[kerze]] || 99999;
      if (spannTage > maxT) {
        von = bis - maxT * 86400000;
        if (hEl) hEl.textContent = 'Bei ' + kerze + '-Kerzen liefert die Quelle höchstens ' + maxT + ' Tage – Beginn entsprechend verschoben.';
      } else if (hEl) hEl.textContent = '';
      beschriftung = vEl.value + ' – ' + bEl.value + ' · ' + kTxt;
    } else {
      zeit = (zEl && zEl.value) || '1y';
      var pr = zeitPruefen(zeit, kerze);
      zeit = pr.zeit;
      if (hEl) hEl.textContent = pr.hinweis;
      var zTxt = (zEl && zEl.selectedIndex >= 0) ? zEl.options[zEl.selectedIndex].text : zeit;
      beschriftung = zTxt + ' · ' + kTxt;
    }
    var data = await fetchRange(CUR.sym, zeit, kerze, von, bis);
    if (seqR !== openSeq) return; // Symbol wurde inzwischen gewechselt
    if (!data || !data.series.length) {
      if (hEl) hEl.textContent = 'Für diese Kombination liefert die Quelle keine Daten.';
    }
    CURDATA.rangeSeries = data ? data.series : null;
    CURDATA.rangeBars = data ? data.bars : null;
    CURDATA.kerze = kerze;
    letzteBeschriftung = beschriftung;
    zoomFenster = null;   // neue Daten = neuer Massstab, der alte Ausschnitt gilt nicht mehr
    drawBig(document.getElementById('bigchart'), data ? data.series : [], beschriftung);
  }

  var bigMeta = null;
  /** Liste aller Signale des aktuellen Charts. Ohne sie muss man mit der Maus auf
   *  winzige Dreiecke zielen, um zu sehen, was ein Signal war - auf einem Jahreschart
   *  mit hunderten Markierungen ist das aussichtslos. */
  var SIGNAL_ERKLAERT = {
    'EMA-Kreuzung': 'Der Kurs hat die EMA20 durchbrochen und steht jetzt mindestens 15 Basispunkte jenseits davon. Innerhalb der letzten sechs Kerzen war er noch auf der anderen Seite.',
    'Umkehr': 'Der Abstand des Kurses zur Leitlinie ist mehr als das 1,5-fache seiner üblichen Schwankung – und die letzte Kerze dreht bereits zurück (kein Griff ins fallende Messer).',
    'Rücksetzer': 'Im laufenden Trend ist der Kurs an die Leitlinie zurückgekommen und dreht dort wieder in Trendrichtung.',
    'RSI(2)': 'Der 2-Perioden-RSI steht im Extrem (unter 10 bzw. über 90) und der übergeordnete Trend passt zur Richtung.',
    'Donchian': 'Der Schlusskurs liegt über dem Hoch (bzw. unter dem Tief) der letzten 20 Kerzen – ein Ausbruch aus der jüngsten Spanne.',
    'Squeeze': 'Die Bollinger-Bänder waren deutlich enger als zuletzt üblich, und jetzt bricht der Kurs aus dieser Kompression aus.'
  };

  /** Was das gewählte Signal aussagt – und was danach tatsächlich passiert ist. */
  function zeigeSignalDetail() {
    var el = document.getElementById('expSigDetail');
    if (!el) return;
    if (GEWAEHLT == null || !LETZTE_PUNKTE[GEWAEHLT]) { el.innerHTML = ''; el.style.display = 'none'; return; }
    var p = LETZTE_PUNKTE[GEWAEHLT];
    var bars = CURDATA.rangeBars || [];
    var idx = -1;
    for (var i = 0; i < bars.length; i++) if (bars[i][0] === p.t) { idx = i; break; }
    var danach = '';
    if (idx >= 0) {
      // Was danach kam - in Signalrichtung gerechnet, damit "+" immer "richtig gelegen" heisst
      var zeilen = [4, 8, 16, 26].map(function (h) {
        if (idx + h >= bars.length) return null;
        var r = (bars[idx + h][1] / bars[idx][1] - 1) * 100;
        var inRichtung = p.dir === 'call' ? r : -r;
        return '<span style="display:inline-block; min-width:104px;">nach ' + h + ' Kerzen: <b class="' +
          (inRichtung >= 0 ? 'up' : 'down') + '" style="color:' + (inRichtung >= 0 ? 'var(--up)' : 'var(--down)') + '">' +
          (inRichtung >= 0 ? '+' : '') + inRichtung.toFixed(2) + ' %</b></span>';
      }).filter(Boolean);
      danach = zeilen.length
        ? '<div style="margin-top:8px; font-size:var(--fs-neben);"><span style="color:var(--muted);">Was danach kam, in Signalrichtung:</span><br>' + zeilen.join(' ') + '</div>'
        : '<div style="margin-top:8px; font-size:var(--fs-neben); color:var(--muted);">Das Signal ist zu jung – die Entwicklung danach liegt noch nicht vor.</div>';
    }
    el.style.display = 'block';
    el.innerHTML =
      '<div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">' +
        '<span style="width:11px; height:11px; border-radius:var(--r-klein); background:' + p.farbe + '; display:inline-block;"></span>' +
        '<b style="font-size:var(--fs-gross);">' + U.esc(p.name) + '</b>' +
        '<span style="color:' + (p.dir === 'call' ? 'var(--up)' : 'var(--down)') + '; font-weight:700;">' +
          (p.dir === 'call' ? '▲ Kauf' : '▼ Verkauf') + '</span>' +
        '<span style="color:var(--muted);">' + new Date(p.t).toLocaleString('de-DE') + ' · Kurs ' + U.nf2.format(p.preis) + '</span>' +
        '<button class="btn ghost tiny" id="expSigZu" style="margin-left:auto;">schließen</button>' +
      '</div>' +
      '<div style="font-size:var(--fs-text); color:var(--ink-2); margin-top:6px;">' +
        U.esc(SIGNAL_ERKLAERT[p.name] || 'Keine Erläuterung hinterlegt.') + '</div>' +
      danach +
      '<div style="font-size:var(--fs-klein); color:var(--muted); margin-top:8px;">' +
        'Hinweis: Einzelsignale wurden über 19 000 Kerzen gemessen und liegen bei 46–56 % Trefferquote. ' +
        'Was einzeln kaum trägt, kann in Kombination mit Trendkanal und Volumen deutlich besser sein.</div>';
    var zu = document.getElementById('expSigZu');
    if (zu) zu.addEventListener('click', function () {
      GEWAEHLT = null;
      drawAktuell();
    });
  }

  function zeigeSignalListe() {
    var el = document.getElementById('expSigListe');
    if (!el) return;
    if (!LETZTE_PUNKTE.length) {
      el.innerHTML = '<div class="empty" style="padding:10px 0;">Keine Signale eingeblendet. Oben Häkchen setzen.</div>';
      return;
    }
    // Neueste zuerst - die interessieren beim Prüfen am meisten
    var mitIndex = LETZTE_PUNKTE.map(function (p, i) { return { p: p, i: i }; })
      .sort(function (a, b) { return b.p.t - a.p.t; }).slice(0, 200);
    el.innerHTML =
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:6px;">' +
        LETZTE_PUNKTE.length + ' Signale · Zeile anklicken, um sie im Chart zu markieren' +
        (SIG_FEHLER ? ' · ACHTUNG: ' + SIG_FEHLER + ' Detektor-Abbrüche – die Liste ist unvollständig' : '') +
        (LETZTE_PUNKTE.length > 200 ? ' · die 200 jüngsten' : '') + '</div>' +
      '<div style="max-height:260px; overflow:auto;"><table class="tbl"><thead><tr>' +
        '<th>Zeitpunkt</th><th>Signal</th><th>Richtung</th><th style="text-align:right;">Kurs</th>' +
      '</tr></thead><tbody>' +
      mitIndex.map(function (x) {
        var p = x.p;
        return '<tr data-zeile="' + x.i + '" style="cursor:pointer;' +
          (GEWAEHLT === x.i ? ' background:var(--grid);' : '') + '">' +
          '<td>' + new Date(p.t).toLocaleString('de-DE', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</td>' +
          '<td><span style="display:inline-block; width:9px; height:9px; border-radius:var(--r-klein); background:' + p.farbe + '; margin-right:6px;"></span>' + U.esc(p.name) + '</td>' +
          '<td class="' + (p.dir === 'call' ? 'up' : 'down') + '" style="color:' + (p.dir === 'call' ? 'var(--up)' : 'var(--down)') + ';">' +
            (p.dir === 'call' ? '▲ Kauf' : '▼ Verkauf') + '</td>' +
          '<td style="text-align:right;">' + U.nf2.format(p.preis) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    el.querySelectorAll('[data-zeile]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var i3 = parseInt(tr.getAttribute('data-zeile'), 10);
        GEWAEHLT = (GEWAEHLT === i3) ? null : i3;
        drawAktuell();
      });
    });
  }

  /* ================= Signale im Chart =================
   * Berechnet mit denselben Funktionen, die auch die Messung und der Handel benutzen -
   * es wird nichts fuer die Anzeige nachgebaut. Was hier zu sehen ist, ist exakt das,
   * worauf die Automatik reagieren wuerde. */
  var SIGNALE = {
    /* C14 (01.09.2026): Farben aus der Token-Palette statt roher Hex-Werte - die
     * Kontraste sind dort je Thema GERECHNET; feste Hex-Toene galten nur fuer eines.
     * var() in SVG-Attributen traegt (dasselbe Muster wie die Kerzenfarben unten). */
    cross:     { name: 'EMA-Kreuzung', farbe: 'var(--series)',  fn: function (b) { var r = Q.signalCross(b, 'ema', 20, 15); return r.crossed ? (r.crossed === 'up' ? 'call' : 'put') : null; } },
    reversion: { name: 'Umkehr',       farbe: 'var(--series4)', fn: function (b) { return Q.reversionSignal(b, 'ema', 20, 1.5).signal; } },
    pullback:  { name: 'Rücksetzer',   farbe: 'var(--warn)',    fn: function (b) { return Q.pullbackSignal(b, 'ema', 20, 15).signal; } },
    rsi2:      { name: 'RSI(2)',       farbe: 'var(--series3)', fn: function (b) { return Q.rsiExtremSignal(b).signal; } },
    donchian:  { name: 'Donchian',     farbe: 'var(--series2)', fn: function (b) { return Q.donchianSignal(b, 20, 15).signal; } },
    squeeze:   { name: 'Squeeze',      farbe: 'var(--series5)', fn: function (b) { return Q.squeezeSignal(b, 20).signal; } }
  };
  var sigAn = {};
  var LETZTE_PUNKTE = [];     // Signale des aktuellen Charts - fuer Liste und Auswahl
  var SIG_FEHLER = 0;         // Detektor-Abbrueche des letzten Durchlaufs
  var GEWAEHLT = null;        // gerade angeklicktes Signal
  var indAn = {};        // Chartbild: gleitende Durchschnitte, Kanal, Zonen, Volumen
  var chartArt = 'linie';   // 'linie' oder 'kerzen'

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
    SIG_FEHLER = 0;
    var start = Math.max(30, bars.length - 1200);        // Anzeige-Obergrenze: sonst rechnet der Chart ewig
    for (var i = start; i < bars.length; i++) {
      var fenster = bars.slice(Math.max(0, i - 300), i + 1);
      for (var ki = 0; ki < keys.length; ki++) {
        var def = SIGNALE[keys[ki]], d = null;
        /* Wirft ein Detektor - oder fehlt seine Funktion -, lieferte er fuer JEDE der
         * bis zu 1200 Kerzen still null. Der Chart blieb ohne Markierungen und die
         * Liste sagte "keine Signale": ein Ausfall sah aus wie ein Befund. */
        try { d = def.fn(fenster); } catch (e) { d = null; SIG_FEHLER++; }
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
    // Zeitstempel -> Position in der Reihe. Nur so bekommt jede Kerze gleich viel Platz.
    var xIndex = {};
    for (var xi = 0; xi < series.length; xi++) xIndex[series[xi][0]] = xi;
    var letzterIdx = series.length - 1;
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
    /** x-Position einer Kerze. Bekannte Zeitstempel gehen ueber ihren Index (dadurch
     *  fallen Nacht und Wochenende heraus); unbekannte werden auf den naechstgelegenen
     *  Index interpoliert, damit auch Kanalkanten und Marker richtig sitzen. */
    function X(t) {
      var idx = xIndex[t];
      if (idx === undefined) {
        if (t <= x0) idx = 0;
        else if (t >= x1) idx = letzterIdx;
        else {
          // naechstgelegene Kerze suchen (Reihe ist zeitlich sortiert)
          var lo = 0, hi = letzterIdx;
          while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (series[mid][0] <= t) lo = mid; else hi = mid; }
          var span = series[hi][0] - series[lo][0];
          idx = span > 0 ? lo + (t - series[lo][0]) / span : lo;
        }
      }
      return pad + (letzterIdx > 0 ? idx / letzterIdx : 0) * (W - 2 * pad);
    }
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
        /* Volle 50/200 Kerzen oder gar nicht. Frueher schrumpften die Fenster still
           auf ein Drittel bzw. die Haelfte der Reihe - auf einem Monatschart wurde
           als "SMA 50/200" in Wahrheit ein SMA 7/10 gezeichnet, samt Golden Cross
           darauf (Tester-Meldung #10). Lieber ehrlich weglassen und es dazuschreiben. */
        if (cI.length >= 55) s50 = smaReihe(cI, 50);
        if (cI.length >= 210) s200 = smaReihe(cI, 200);
      }
      if (indAn.ma) {
        if (s50) indiPfad += pfadAus(s50, 'var(--series)', 1.3);
        if (s200) indiPfad += pfadAus(s200, 'var(--warn)', 1.6);
      }
      if ((indAn.ma || indAn.cross50200) && (!s50 || !s200)) {
        indiPfad += '<text x="' + (pad + 4) + '" y="' + (pad + 12) + '" fill="var(--muted)" font-size="10">' +
          (!s50 ? 'SMA 50 und 200' : 'SMA 200') + ': erst ab ' + (!s50 ? 55 : 210) +
          ' Kerzen (hier ' + cI.length + ') – längeren Zeitraum oder feinere Kerzen wählen</text>';
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
      var kInfoEl = document.getElementById('expKanalInfo');
      // Sonst bleibt beim Wechsel auf einen zu kurzen Chart die alte Zeile stehen
      // und behauptet Kanaele, die gar nicht gezeichnet wurden.
      if (kInfoEl) kInfoEl.textContent = indAn.kanal && barsI.length < 40
        ? "Nur " + barsI.length + " Kerzen - fuer einen Kanal zu wenig." : "";
      /* Kanal-Abschnitte ueber die GESAMTE Historie (21.08.2026): Die vier
       * Ebenen-Kanaele enden alle am rechten Rand - ein Chart hat aber so viele
       * Kanaele, wie er Trendabschnitte hat. Farbe nach Richtung, Deckkraft
       * nach Guete; jeder Abschnitt traegt seine Nummer und einen Tooltip. */
      if (indAn.segmente && barsI.length >= 40 && Q.kanalSegmente) {
        var sichtS = [];
        for (var sv2 = 0; sv2 < barsI.length; sv2++) if (barsI[sv2][0] >= x0 && barsI[sv2][0] <= x1) sichtS.push(barsI[sv2]);
        Q.kanalSegmente(sichtS).forEach(function (sg, si) {
          var tS1 = sichtS[sg.von][0], tS2 = sichtS[sg.bis][0];
          var mS1 = sg.achse, mS2 = sg.achse + sg.steigung * (sg.n - 1);
          var oS1 = mS1 + (sg.oben - sg.mitteJetzt), oS2 = sg.oben;
          var uS1 = mS1 + (sg.unten - sg.mitteJetzt), uS2 = sg.unten;
          var fS = sg.trend === 'auf' ? 'var(--up)' : sg.trend === 'ab' ? 'var(--down)' : 'var(--acc)';
          /* #80 (Wilhelms Weg 2): angezeigt und gewichtet wird das PERZENTIL gegen
           * Rauschen, nicht die Roh-Guete - deren Nullpunkt liegt bei ~75-94, je
           * Fensterlaenge (Eichung studien/kanal-guete-2026-08-26). Die Auswahl,
           * WELCHE Abschnitte erscheinen, blieb unveraendert in Roh-Guete. */
          var pS = Q.gueteZufallsAnteil(sg.guete, sg.n);
          var dS = (0.30 + Math.min(0.5, (pS == null ? 50 : pS) / 100 * 0.5)).toFixed(2);
          function linS(p1, p2, br, str) {
            return '<line x1="' + X(tS1).toFixed(1) + '" y1="' + Y(p1).toFixed(1) + '" x2="' + X(tS2).toFixed(1) +
              '" y2="' + Y(p2).toFixed(1) + '" stroke="' + fS + '" stroke-width="' + br + '"' +
              (str ? ' stroke-dasharray="' + str + '"' : '') + ' opacity="' + dS + '"></line>';
          }
          var titelS = sg.name + ' · ' + (sg.trend === 'auf' ? 'aufwärts' : sg.trend === 'ab' ? 'abwärts' : 'seitwärts') +
            ' · ' + sg.n + ' Kerzen · ' + (pS == null ? 'Ordnung nicht einordbar' : 'besser als ' + pS + ' % des Zufalls (Roh-Güte ' + sg.guete + '/100)') +
            ' · Breite ' + sg.breitePct.toFixed(1) + ' %';
          indiPfad += '<g><title>' + titelS + '</title>' + linS(mS1, mS2, 1.2) +
            linS(oS1, oS2, 1, '4 3') + linS(uS1, uS2, 1, '4 3') +
            '<text x="' + ((X(tS1) + X(tS2)) / 2).toFixed(1) + '" y="' + (Y(Math.max(oS1, oS2)) - 3).toFixed(1) +
            '" fill="' + fS + '" font-size="9" text-anchor="middle" opacity="0.9">A' + (si + 1) + ' ' +
            (sg.trend === 'auf' ? '▲' : sg.trend === 'ab' ? '▼' : '▬') + '</text></g>';
        });
      }
      if (indAn.kanal && barsI.length >= 40) {
        var sichtB = [];
        for (var sv = 0; sv < barsI.length; sv++) if (barsI[sv][0] >= x0 && barsI[sv][0] <= x1) sichtB.push(barsI[sv]);
        var kListe = (sichtB.length >= 40 && Q.kanaele) ? Q.kanaele(sichtB) : [];
        var FARBEN = { kurz: 'var(--series4)', mittel: 'var(--acc)', lang: 'var(--series3)', 'ab Wendepunkt': 'var(--warn)' };
        kListe.forEach(function (kk, ki) {
          var t1 = sichtB[kk.von][0], t2 = sichtB[kk.bis][0];
          var mit1 = kk.achse, mit2 = kk.achse + kk.steigung * (kk.n - 1);
          var oben1 = mit1 + (kk.oben - kk.mitteJetzt), oben2 = kk.oben;
          var unt1 = mit1 + (kk.unten - kk.mitteJetzt), unt2 = kk.unten;
          var farbe = FARBEN[kk.name] || 'var(--series4)';
          // Schwache Kanaele blasser zeichnen - die Ordnung soll man SEHEN, nicht lesen
          // muessen. Seit #80 speist das Perzentil die Deckkraft: zufallsnahe Kanaele
          // werden blass, obwohl ihre Roh-Guete hoch aussieht (Rauschen-Median 75-94).
          var pK = Q.gueteZufallsAnteil(kk.guete, kk.n);
          var deck = 0.25 + Math.min(0.55, (pK == null ? 50 : pK) / 100 * 0.55);
          function lin(p1, p2, br, str) {
            return '<line x1="' + X(t1).toFixed(1) + '" y1="' + Y(p1).toFixed(1) + '" x2="' + X(t2).toFixed(1) +
              '" y2="' + Y(p2).toFixed(1) + '" stroke="' + farbe + '" stroke-width="' + br + '"' +
              (str ? ' stroke-dasharray="' + str + '"' : '') + ' opacity="' + deck.toFixed(2) + '"></line>';
          }
          var titel = 'Kanal ' + kk.name + ' · ' +
            (kk.trend === 'auf' ? 'aufwärts' : kk.trend === 'ab' ? 'abwärts' : 'seitwärts') +
            ' · ' + (pK == null ? 'Ordnung nicht einordbar' : 'besser als ' + pK + ' % des Zufalls') +
            ' (Roh-Güte ' + kk.guete + '/100, Passgenauigkeit ' + kk.r2 + ', Kanten berührt ' +
            kk.beruehrungenOben + '× oben / ' + kk.beruehrungenUnten + '× unten)' +
            ' · Breite ' + kk.breitePct.toFixed(1) + ' % · Kurs steht bei ' + Math.round(kk.pos * 100) + ' % im Kanal';
          indiPfad += '<g><title>' + titel + '</title>' + lin(mit1, mit2, 1.2) +
            lin(oben1, oben2, 1, '5 4') + lin(unt1, unt2, 1, '5 4') + '</g>';
          if (ki === 0 || kk.name === 'lang') {
            indiPfad += '<text x="' + (X(t2) - 4).toFixed(1) + '" y="' + (Y(oben2) - 3).toFixed(1) +
              '" fill="' + farbe + '" font-size="9" text-anchor="end">' + kk.name + ' ' +
              (kk.trend === 'auf' ? '▲' : kk.trend === 'ab' ? '▼' : '▬') + ' ' +
              (pK == null ? '' : pK + '&#8202;%') + '</text>';
          }
        });
        var kEl = document.getElementById('expKanalInfo');
        if (kEl) kEl.textContent = kListe.length
          ? kListe.map(function (k5) {
            var p5 = Q.gueteZufallsAnteil(k5.guete, k5.n);
            return k5.name + ': ' + (k5.trend === 'auf' ? 'aufwärts' : k5.trend === 'ab' ? 'abwärts' : 'seitwärts') +
              ' (' + (p5 == null ? 'nicht einordbar' : 'besser als ' + p5 + ' % des Zufalls') +
              (k5.wendeBestaetigt ? ', beginnt an echtem Wendepunkt' : '') + ')';
          }).join(' · ')
          : 'Zu wenige Kerzen im Fenster für einen Kanal.';

        /* Wie spät ist der Kanal? Ein Regressionskanal beschreibt, was war – er kann der
           Bewegung nur nachlaufen. Wie weit, stand bisher nirgends, und man sieht es dem
           Bild nicht an: Am AMD-Chart vom 20.08.2026 meldete er am Tageshoch „aufwärts"
           und am Tagestief „abwärts". Diese Zeile rechnet es aus, statt es dem Auge zu
           überlassen – gerade weil sie oft unbequem ausfällt. */
        var vzEl = document.getElementById('expKanalVerzug');
        if (vzEl && Q.kanalVerzug) {
          var fen = Math.min(200, Math.max(40, Math.floor(sichtB.length / 3)));
          var vz = sichtB.length >= fen + 12 ? Q.kanalVerzug(sichtB, { fenster: fen, maxRueck: 150 }) : null;
          if (!vz) {
            vzEl.textContent = '';
          } else if (vz.ohneRichtung) {
            vzEl.innerHTML = '<b>Kanal-Verzug:</b> Der Kanal steht seitwärts – ohne Richtung gibt es keinen Verzug zu messen.';
          } else {
            var richt = vz.trend === 'auf' ? 'aufwärts' : 'abwärts';
            var wort = vz.trend === 'auf' ? 'Tief' : 'Hoch';
            var txt = '<b>Kanal-Verzug:</b> „' + richt + '" wird seit ' + vz.gemeldetVor + ' Kerzen gemeldet, ' +
              'zuerst bei ' + U.nf2.format(vz.gemeldetBei) + '. Das ' + wort + ', an dem die Bewegung begann, ' +
              'lag ' + vz.verzugKerzen + ' Kerzen davor bei ' + U.nf2.format(vz.wendeBei) + '.';
            if (vz.anteilVerpasst != null) {
              txt += ' <b style="color:' + (vz.anteilVerpasst >= 50 ? 'var(--down)' : 'var(--warn)') + ';">' +
                vz.anteilVerpasst + ' % der Bewegung waren beim Melden schon vorbei.</b>';
            }
            if (vz.gekappt) txt += ' <span style="opacity:.7;">(Richtung hält länger als das Suchfenster – der Verzug ist mindestens so groß.)</span>';
            vzEl.innerHTML = txt;
          }
        }
      }
      if (indAn.sr) {
        // Unterstuetzung und Widerstand als Hoch/Tief der letzten 20 und 60 Kerzen.
        // Das ist dieselbe Groesse, die der Donchian-Detektor benutzt - was man sieht,
        // ist also genau das, worauf die Automatik reagieren wuerde.
        [[20, 'var(--baseline)'], [60, 'var(--muted)']].forEach(function (paar) {
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
            // eigener Name: 'steigt' heisst weiter unten schon die Kerzenrichtung
            var volSteigt = vb === 0 || cI[vb] >= cI[vb - 1];
            volBalken += '<rect x="' + (X(barsI[vb][0]) - bw / 2).toFixed(1) + '" y="' + (H - padB - vh).toFixed(1) +
              '" width="' + bw.toFixed(1) + '" height="' + vh.toFixed(1) + '" fill="' +
              (volSteigt ? 'var(--up)' : 'var(--down)') + '" opacity="0.22"></rect>';
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
      LETZTE_PUNKTE = punkte.slice();
      punkte.forEach(function (p, pi) {
        if (p.t < x0 || p.t > x1) return;
        var px = X(p.t), py = Y(p.preis);
        var gew = GEWAEHLT != null && GEWAEHLT === pi;
        // Nochmals vergroessert (8 statt 6 Pixel Halbbreite; Tester-Wunsch #27:
        // "bitte um 2 mm") - mit unsichtbarer Klickflaeche darum.
        var s2 = gew ? 11 : 8;
        var d2 = p.dir === 'call'
          ? 'M' + px + ' ' + (py + 7) + ' l' + s2 + ' ' + (s2 + 3) + ' l' + (-2 * s2) + ' 0 Z'
          : 'M' + px + ' ' + (py - 7) + ' l' + s2 + ' ' + (-s2 - 3) + ' l' + (-2 * s2) + ' 0 Z';
        marker +=
          '<g class="sigmark" data-sig-i="' + pi + '" style="cursor:pointer;">' +
          '<rect x="' + (px - 11).toFixed(1) + '" y="' + (py - 20).toFixed(1) + '" width="22" height="40" fill="transparent"></rect>' +
          '<path d="' + d2 + '" fill="' + p.farbe + '" opacity="' + (gew ? '1' : '0.85') + '"' +
            (gew ? ' stroke="var(--ink)" stroke-width="1.5"' : '') + '></path>' +
          (gew ? '<line x1="' + px.toFixed(1) + '" x2="' + px.toFixed(1) + '" y1="' + pad + '" y2="' + (H - padB) +
                 '" stroke="' + p.farbe + '" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"></line>' : '') +
          '<title>' + p.name + ' · ' + (p.dir === 'call' ? 'Kauf' : 'Verkauf') + '\n' +
          new Date(p.t).toLocaleString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) +
          '\n' + U.nf2.format(p.preis) + '\n(anklicken für Einzelheiten)</title></g>';
      });
    }
    var first = series[0][1], last = series[series.length - 1][1];
    var chg = (last / first - 1) * 100;
    /* --- Kerzen --- */
    var kerzen = '';
    if (chartArt === 'kerzen' && barsI && barsI.length > 1) {
      // Breite aus dem Abstand zweier Kerzen, 70 % davon als Koerper - so bleibt ein
      // sichtbarer Spalt und die Kerzen kleben nicht aneinander.
      var abst = (W - 2 * pad) / Math.max(1, barsI.length - 1);
      var kb = Math.max(1, Math.min(14, abst * 0.7));
      var duenn = kb < 2.5;      // bei sehr vielen Kerzen nur noch Striche zeichnen
      for (var ki2 = 0; ki2 < barsI.length; ki2++) {
        var bk = barsI[ki2];
        if (bk[0] < x0 || bk[0] > x1) continue;
        var o = bk[5] != null ? bk[5] : bk[1], c2 = bk[1];
        var h2 = bk[3] != null ? bk[3] : Math.max(o, c2), l2 = bk[4] != null ? bk[4] : Math.min(o, c2);
        var xk = X(bk[0]);
        var steigt = c2 >= o;
        var farbe = steigt ? 'var(--up)' : 'var(--down)';
        // Docht: Hoch bis Tief
        kerzen += '<line x1="' + xk.toFixed(1) + '" x2="' + xk.toFixed(1) + '" y1="' + Y(h2).toFixed(1) +
          '" y2="' + Y(l2).toFixed(1) + '" stroke="' + farbe + '" stroke-width="1"></line>';
        if (!duenn) {
          // Koerper: Eroeffnung bis Schluss. Bei gleichem Kurs ein waagerechter Strich,
          // sonst waere die Kerze unsichtbar.
          var yo = Y(o), yc = Y(c2);
          var oben = Math.min(yo, yc), hoehe = Math.max(0.8, Math.abs(yc - yo));
          kerzen += '<rect x="' + (xk - kb / 2).toFixed(1) + '" y="' + oben.toFixed(1) + '" width="' + kb.toFixed(1) +
            '" height="' + hoehe.toFixed(1) + '" fill="' + (steigt ? farbe : farbe) + '" opacity="' + (steigt ? '0.9' : '1') + '"></rect>';
        }
      }
    }
    svg.innerHTML = grid +
      (chartArt === 'kerzen' ? '' :
        '<path d="' + d + ' L' + X(x1).toFixed(1) + ' ' + (H - padB) + ' L' + X(x0).toFixed(1) + ' ' + (H - padB) + ' Z" fill="var(--series-soft)"></path>') +
      (chartArt === 'kerzen' ? '' :
        '<path d="' + d + '" fill="none" stroke="var(--series)" stroke-width="2" vector-effect="non-scaling-stroke"></path>') +
      volBalken + zonen + kerzen + indiPfad + linienPfad + kreuze + marker +
      '<text x="' + pad + '" y="' + (H - 5) + '" fill="var(--muted)" font-size="10">' + rangeKey + ': <tspan class="' + U.signCls(chg) + '" fill="' + (chg >= 0 ? 'var(--up)' : 'var(--down)') + '">' + U.signTxt(chg, ' %') + '</tspan></text>' +
      '<line id="bigCross" y1="' + pad + '" y2="' + (H - padB) + '" stroke="var(--baseline)" stroke-width="1" style="display:none"></line>';
    bigMeta = { series: series, x0: x0, x1: x1, W: W, X: X };
    svg.querySelectorAll('.sigmark').forEach(function (g2) {
      g2.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var i2 = parseInt(g2.getAttribute('data-sig-i'), 10);
        GEWAEHLT = (GEWAEHLT === i2) ? null : i2;
        drawBig(svg, CURDATA.rangeSeries || [], letzteBeschriftung);
      });
    });
    zeigeSignalListe();
    zeigeSignalDetail();
  }

  // Crosshair-Tooltip auf dem großen Chart
  var tip = document.getElementById('tip');
  document.getElementById('bigchart').addEventListener('mousemove', function (e) {
    if (!bigMeta) return;
    var svg = e.currentTarget, r = svg.getBoundingClientRect();
    var frac = (e.clientX - r.left) / r.width;
    // Achse laeuft ueber den Kerzen-Index, nicht ueber die Zeit
    var idxF = Math.round(frac * (bigMeta.series.length - 1));
    var idx = Math.max(0, Math.min(bigMeta.series.length - 1, idxF));
    var best = bigMeta.series[idx];
    var cross = svg.querySelector('#bigCross');
    if (cross) { cross.style.display = 'block'; cross.setAttribute('x1', bigMeta.X(best[0])); cross.setAttribute('x2', bigMeta.X(best[0])); }
    var ro = document.getElementById('expReadout');
    if (ro) {
      var dt = new Date(best[0]);
      var wtag = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][dt.getDay()];
      var mR = (CURDATA.daily && CURDATA.daily.meta) || {};
      var curR = mR.currency === 'EUR' ? ' €' : mR.currency === 'USD' ? ' $' : (mR.currency ? ' ' + U.esc(mR.currency) : '');
      // Veraenderung zur VORHERIGEN Kerze der Serie; an der ersten gibt es keine
      var vorher = idx > 0 ? bigMeta.series[idx - 1][1] : null;
      var pctR = vorher ? (best[1] / vorher - 1) * 100 : null;
      ro.innerHTML = wtag + ' ' + dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' +
        dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) +
        ' · ' + U.nf2.format(best[1]) + curR +
        (pctR != null
          ? ' · <span style="color:' + (pctR >= 0 ? 'var(--up)' : 'var(--down)') + ';">' + U.signTxt(pctR, ' %') + '</span>'
          : '');
      ro.style.display = 'block';
    }
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
    var roZu = document.getElementById('expReadout');
    if (roZu) roZu.style.display = 'none';
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

  /* ================= Analyse (regelbasiert) ================= */
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
    lines.push('## Kurzfazit (regelbasiert)');
    var S = Q.combine({ news: c.sent.score, tech: c.tech.score, elliott: c.ell.score }, Q.DEFAULT_WEIGHTS);
    lines.push('Gesamtscore **' + S.toFixed(2) + '** (−1 bis +1) aus Technik (' + c.tech.score.toFixed(2) + ') und Elliott (' + c.ell.score.toFixed(2) + '); News (' + c.sent.score.toFixed(2) + ') geht mit Gewicht 0 ein – ' + Q.NEWS_HINWEIS + '. ' +
      (S > 0.35 ? 'Das Gesamtbild ist **konstruktiv**.' : S < -0.35 ? 'Das Gesamtbild ist **belastet**.' : 'Das Gesamtbild ist **neutral/gemischt**.'));
    lines.push('## Technik');
    c.tech.parts.forEach(function (p) { lines.push('- ' + p.name + ': Score ' + p.score.toFixed(2)); });
    lines.push('- RSI(14): ' + (c.rsi != null ? Math.round(c.rsi) : '–') + ' · 30-Tage-Vola: ' + c.vol30 + ' %');
    lines.push('## News-Lage');
    lines.push('- Sentiment-Score: ' + c.sent.score.toFixed(2) + ' *(' + Q.NEWS_HINWEIS + ')*' +
      (c.sent.events.length ? ' · Ereignistypen: ' + c.sent.events.join(', ') : ''));
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
    var body = localAnalysis(c);
    st.textContent = '';
    btn.disabled = false;
    document.getElementById('aiTitle').textContent = 'Analyse: ' + CUR.name + ' (' + CUR.sym + ') – regelbasiert';
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
    st.textContent = r === true ? '' + CUR.sym + ' wird jetzt mitgeprüft (siehe Regeln → Einstellungen).'
      : r === 'standard' ? CUR.sym + ' ist schon in der Standard-Watchlist.'
      : r === 'schon' ? CUR.sym + ' ist bereits auf deiner Watchlist.'
      : 'Konnte nicht hinzugefügt werden.';
    setTimeout(function () { st.textContent = ''; }, 5000);
  });

  // Oeffentliche Oeffnen-API: andere Module (z. B. die Dashboard-Heatmap) springen
  // damit direkt in die Detail-Ansicht, ohne die interne openDetail zu kennen.
  /** Zum Aktien-Explorer springen. Er ist seit dem UI-Umbau (Stufe 4) ein
   *  Unter-Reiter von "Werkzeuge" - es reicht also nicht mehr, einen Reiter
   *  anzuklicken, die Pille darin muss mit. Steht hier einmal, damit nicht zwei
   *  Stellen zwei verschiedene Wege kennen. */
  function zeigeExplorer() {
    var reiter = document.querySelector('[data-tab="werkzeuge"]');
    if (reiter) reiter.click();
    var pille = document.querySelector('#wzPills [data-sub="explorer"]');
    if (pille) pille.click();
  }

  window.Explorer = {
    oeffne: function (sym, name) {
      zeigeExplorer();
      openDetail({ sym: sym, name: name || sym, exch: '', type: '' });
    }
  };
})();
