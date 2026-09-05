'use strict';
/* Aktien-Explorer: freie Suche (Yahoo-Universum), Voll-Chart 1T–Max,
   Kennzahlen, News, regelbasierte Analyse. */
(function () {
  var Q = window.Quant, U = window.U;
  var CUR = null; // aktuell angezeigtes Symbol {sym, name, exch, type}
  var CURDATA = { daily: null, rangeSeries: null, meta: null, news: [] };
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
      /* Stufe 3 (03.09.2026): Der Hinweis, was die Detail-Ansicht kann, stand hier -
       * und verschwand mit dieser Startkarte, sobald man einen Wert oeffnete, also
       * genau dann, wenn er galt. Er steht woertlich im Register (werkzeuge.explorer);
       * der i-Knopf sitzt in der Suchzeile und bleibt sichtbar. */
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
    var startEl = document.getElementById('expStart');
    if (startEl) startEl.style.display = 'none';
    document.getElementById('expDetail').style.display = 'block';
    document.getElementById('expName').textContent = hit.name;
    /* U7 (QS 04.09.2026): stand hier fest 'sym · type' + optional Boerse, hing der
     * erste Trenner auch dann dran, wenn type leer war - und leer ist er bei JEDEM
     * Sprung aus dem Reiter Markt (Hotlist und Marktkarte uebergeben exch:'', type:'').
     * Auf dem Bildschirm stand 'KUNSTM9 · '. Jetzt werden die Teile gesammelt und
     * die leeren fallen weg - der Trenner steht zwischen zwei Angaben oder gar nicht. */
    document.getElementById('expMeta').textContent = [hit.sym, hit.type, hit.exch]
      .filter(function (t) { return t != null && String(t).trim() !== ''; }).join(' · ');
    document.getElementById('expPrice').textContent = '…';
    document.getElementById('expChg').innerHTML = '';
    document.getElementById('expStats').innerHTML = '';
    document.getElementById('expNews').innerHTML = '<div class="loading">Lade News …</div>';
    document.getElementById('aiStatus').textContent = '';
    vwOeffnen();

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
    loadNews();
  }

  /* ================= Signale im Chart =================
   * Berechnet mit denselben Funktionen, die auch die Messung und der Handel benutzen -
   * es wird nichts fuer die Anzeige nachgebaut. Was hier zu sehen ist, ist exakt das,
   * worauf die Automatik reagieren wuerde.
   *
   * Viewer 8a (05.09.2026): Diese Tabelle stand frueher neben einer zweiten Ansicht
   * (ein eigener SVG-Zeichner mit eigener Achse). Die ist weg, die Tabelle ist DIESELBE
   * geblieben - sie speist jetzt den Kerzenchart. Ein zweiter Satz Detektoren fuer
   * die neue Zeichenflaeche waere genau die zweite Wahrheit, die das Projekt schon
   * einmal Kerzen gekostet hat.
   *
   * `hinweis` ist der Text, der bisher als title am Kaestchen im Markup stand. Er
   * steht jetzt hier, damit die Leiste aus Daten gebaut wird und kein Satz beim
   * Umbau verloren geht.
   *
   * `urteil` nennt den Schluessel, unter dem das Studienregister sein Urteil fuehrt.
   * Der Viewer BEHAUPTET nichts: was in der Marke steht, wird aus StudienUrteile
   * gelesen (Regel D2). */
  var SIGNALE = {
    /* C14 (01.09.2026): Farben aus der Token-Palette statt roher Hex-Werte - die
     * Kontraste sind dort je Thema GERECHNET; feste Hex-Toene galten nur fuer eines. */
    cross: {
      name: 'EMA-Kreuzung', farbe: 'var(--series)', urteil: null,
      hinweis: 'Gemessen und ohne Vorsprung – wird angezeigt, weil du es sehen willst, nicht weil es trägt.',
      fn: function (b) { var r = Q.signalCross(b, 'ema', 20, 15); return r.crossed ? (r.crossed === 'up' ? 'call' : 'put') : null; }
    },
    reversion: {
      name: 'Umkehr', farbe: 'var(--series4)', urteil: null,
      hinweis: 'Roh ohne Vorsprung. Dieselbe Überdehnung trägt erst als Kapitulations-Dip: nur im Abwärtskanal, nur mit Volumen, nur Long.',
      fn: function (b) { return Q.reversionSignal(b, 'ema', 20, 1.5).signal; }
    },
    pullback: {
      name: 'Rücksetzer', farbe: 'var(--warn)', urteil: 'ruecksetzer',
      hinweis: 'Gemessen und ohne Vorsprung – wird angezeigt, weil du es sehen willst, nicht weil es trägt.',
      fn: function (b) { return Q.pullbackSignal(b, 'ema', 20, 15).signal; }
    },
    rsi2: {
      name: 'RSI(2)', farbe: 'var(--series3)', urteil: null,
      hinweis: 'Roh ein Münzwurf (+0,017 Prozentpunkte). Trägt erst mit der Erlaubnis „Seitwärtskanal + Volumen“ – das ist die Hauptstrategie; gegen eine gepaarte Kontrolle ist sie seit dem 23.08.2026 nicht entscheidbar.',
      fn: function (b) { return Q.rsiExtremSignal(b).signal; }
    },
    donchian: {
      name: 'Donchian', farbe: 'var(--series2)', urteil: 'donchian',
      hinweis: 'Gemessen und ohne Vorsprung – wird angezeigt, weil du es sehen willst, nicht weil es trägt.',
      fn: function (b) { return Q.donchianSignal(b, 20, 15).signal; }
    },
    squeeze: {
      name: 'Squeeze', farbe: 'var(--series5)', urteil: 'squeeze',
      hinweis: 'Gemessen und ohne Vorsprung – wird angezeigt, weil du es sehen willst, nicht weil es trägt.',
      fn: function (b) { return Q.squeezeSignal(b, 20).signal; }
    }
  };

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

  /* Das Chartbild: was ausser den Kerzen noch zu sehen ist. Auch diese Texte
   * standen als title im Markup und stehen jetzt hier - eine Leiste aus Daten. */
  var INDIKATOREN = {
    ma: { name: 'SMA 50/200', urteil: null,
      hinweis: 'Gleitende Durchschnitte über die letzten 50 bzw. 200 KERZEN der gewählten Kerzengröße – auf dem Tageschart also 50/200 Handelstage, auf dem Stundenchart 50/200 Stunden. Gezeichnet wird nur, wenn genug Kerzen da sind, nie heimlich verkürzt.' },
    cross50200: { name: 'Golden/Death Cross', urteil: null,
      hinweis: 'Kreuzungen der beiden Durchschnitte. Gemessen an 191 Werten über 55 Jahre hat dieses Signal KEINEN Vorsprung – es wird angezeigt, weil du es sehen willst, nicht weil es trägt.' },
    kanal: { name: 'Trendkanal', urteil: 'kanaltrend',
      hinweis: 'Regressionskanal: eine Gerade durch den Kursverlauf mit paralleler Ober- und Unterkante. Zeigt vier Sichten auf die JÜNGSTE Bewegung (kurz/mittel/lang/ab Wendepunkt). Das lange Seitwärtsfenster daraus ist die einzige gemessen tragende Kanal-Nutzung – es steuert den Intraday-Einstieg.' },
    segmente: { name: 'Kanal-Abschnitte (Historie)', urteil: 'kanaltrend',
      hinweis: 'Zerlegt die gesamte sichtbare Historie an ihren Wendepunkten und zeichnet für JEDEN Trendabschnitt einen eigenen Kanal – grün aufwärts, rot abwärts, blau seitwärts. Reine Anzeige zum Erkennen von Marktphasen: Als Handelsbedingung wurde ein Dip-Kauf im frischen Seitwärtsabschnitt gemessen und fiel durch – es wird bewusst nichts davon gehandelt.' },
    sr: { name: 'Unterstützung / Widerstand', urteil: null,
      hinweis: 'Höchster und tiefster Kurs der letzten 20 bzw. 60 Perioden – die Zonen, an denen der Kurs zuletzt gedreht hat.' },
    volumen: { name: 'Volumen', urteil: null,
      hinweis: 'Handelsvolumen je Kerze. Ein Ausbruch mit hohem Volumen ist glaubwürdiger als einer bei dünnem Handel.' },
    rsi: { name: 'RSI (14) als eigene Spur', urteil: null,
      hinweis: 'Der Relative-Stärke-Index über 14 Kerzen, unter dem Chart in eigener Skala von 0 bis 100. Er läuft zwischen null und hundert – in der Kursskala wäre er eine platte Linie am unteren Rand.' },
    linie: { name: 'Leitlinie (EMA20)', urteil: null,
      hinweis: 'Der 20er-Exponentialdurchschnitt, an dem sich Umkehr und Rücksetzer messen. Dieselbe Linie, die die Detektoren benutzen.' }
  };

  var sigAn = {};
  var LETZTE_PUNKTE = [];     // Signale des aktuellen Charts - fuer Liste und Auswahl
  var SIG_FEHLER = 0;         // Detektor-Abbrueche des letzten Durchlaufs
  var GEWAEHLT = null;        // gerade angeklicktes Signal
  var indAn = {};             // Chartbild: Durchschnitte, Kanal, Zonen, Volumen, RSI

  /** Das Urteil zu einem Schalter - GELESEN, nie behauptet.
   *
   * Warum das hier steht und nicht als Satz im Markup: das Projekt hat schon einmal
   * eine ueberholte Formel monatelang weitergetragen, weil sie fest im Text stand
   * (Regel D2). Was das Studienregister nicht fuehrt, bekommt deshalb keine
   * einladende Beschriftung: "nicht gemessen" ist von allen Etiketten das
   * freundlichste und stand genau auf den Kandidaten, bei denen das Gegenteil
   * bekannt war (studienurteile.js, Kopf). Hier steht dann, was wahr ist: dass kein
   * Protokoll etwas bestaetigt. */
  function urteilZu(schluessel) {
    var SU = window.StudienUrteile;
    var e = (schluessel && SU && typeof SU.verworfen === 'function') ? SU.verworfen(schluessel) : null;
    if (e && e.befund) return { text: e.befund, quelle: e.quelle || '', gefuehrt: true };
    return { text: 'Kein Protokoll sagt bestätigt.', quelle: '', gefuehrt: false };
  }

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
        if (d) raus.push({ t: bars[i][0], preis: bars[i][1], dir: d, farbe: def.farbe, name: def.name, schluessel: keys[ki] });
      }
    }
    return raus;
  }

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


  /* ================= Aktien-Viewer (Stufe 6, 04.09. · Viewer 8a, 05.09.2026) =====
   *
   * Der Explorer bekommt einen Kerzenchart nach TradingView-Muster. Die RECHNUNG
   * steht in markt/kerzenchart.js und ist dort in Node pruefbar; hier steht nur, was
   * sie mit dem Bildschirm zu tun hat.
   *
   * ZWEI FRAGEN, ZWEI KNOPFREIHEN (8a). Wilhelms Befund vom 05.09.2026: "Ich kann
   * nicht mehr reinzoomen, auch keine Signale mehr einblenden, zudem lassen sich nur
   * maximal Wochencharts anzeigen bzw. sind die Zeitraeume falsch beschriftet."
   * Alle drei Punkte hatten dieselbe Wurzel: EINE Reihe Knoepfe beantwortete
   * "wie weit zurueck" und "wie fein" zugleich, und die Signale lagen in einer
   * zweiten, eingeklappten Ansicht. Jetzt sagt Reihe 1 den ZEITRAUM, Reihe 2 die
   * KERZENLAENGE, und die Signale liegen im Kerzenchart selbst.
   *
   * DATENQUELLEN IN FESTER REIHENFOLGE, und die Fusszeile nennt sie:
   *   1. das eigene Archiv ueber die Leseauskunft `archiv-kerzen` (nur lesend). Fuer
   *      Minutenkerzen ist das das Alpaca-Minutenarchiv mit seinen Sitzungsbereichen,
   *      sonst archiv1d/60m/15m/5m/1m im Format 2.
   *   2. Yahoo als RUECKFALL, wenn das Archiv den Wert oder den Zeitrahmen nicht
   *      fuehrt - und fuer den Rest des laufenden Tages, den das Archiv noch nicht hat.
   *   3. WOCHEN- UND MONATSKERZEN werden NICHT geholt, sondern aus Tageskerzen
   *      gebildet (KerzenChart.verdichten). Zwei Quellen fuer dieselbe Woche waeren
   *      zwei Wahrheiten ueber denselben Kurs.
   * AN DER NAHT GEWINNT DAS ARCHIV (wiki/archiv-zusammenfuehrung.md Paragraph 6).
   *
   * DIE LAUFENDE KERZE kommt aus den Quotes und wird gestrichelt gezeichnet. Sie
   * geht NIE ins Archiv: der Viewer ruft keine schreibende Auskunft auf, und die
   * Kerze traegt zusaetzlich eine Marke, die archivFaehig() herauswirft.
   *
   * GEHANDELT WIRD AUS DEM VIEWER NICHTS. Er bewertet auch nichts: was an einer
   * Signal-Marke steht, ist aus dem Studienregister GELESEN (urteilZu). */
  function KC() { return window.KerzenChart; }
  function MU2() { return window.MarktUebersicht; }
  var VW = {
    zeitraum: '1J',
    kerze: '1T',
    kerzen: [],            // was gezeichnet wird (Archiv + Live + laufende Kerze)
    fest: [],              // dasselbe ohne die laufende Kerze
    sitzungen: [],         // Sitzung je Kerze der festen Reihe
    quelleText: '',        // EIN Satz fuer die Fusszeile
    quelleDetails: [],     // die Einzelheiten dahinter (i-Knopf)
    ma: { 20: false, 50: false, 200: true },
    nurRegulaer: true,
    /* Der LINKE Rand ist der Anker, nicht der rechte: beim Wechsel der Kerzenlaenge
     * soll der Anfang stehen bleiben (TradingView-Verhalten). null = ganz rechts. */
    fensterVon: null,
    fensterN: 260,
    kreuz: null,
    takt: null,
    laeuft: false,
    letzterLauf: 0,
    tages: null,           // Tagesreihe aus dem eigenen Archiv (Volumen-Median)
    punkte: [],            // Signale ueber die GELADENE Reihe - nicht je Fenster
    nachgeladen: ''        // Grund, falls der Zeitraum von selbst gewachsen ist
  };
  var VW_STORE = 'viewerNurRegulaer';
  var VW_STORE_ZEITRAUM = 'viewerZeitraum';
  var VW_STORE_KERZE = 'viewerKerze';
  var VW_STORE_SCHALTER = 'viewerSchalter';
  var VW_TAKT_MS = 60000;

  /* ---- Reihe 1: der ZEITRAUM. Kein Text im Markup, die Liste steht im Modul. ---- */
  function vwZeitraumBauen() {
    var el = document.getElementById('vwZeitraum');
    if (!el || el.__bereit || !KC()) return;
    el.__bereit = true;
    el.innerHTML = KC().ZEITRAEUME.map(function (z) {
      return '<button type="button" data-zeitraum="' + z + '">' + z + '</button>';
    }).join('');
    el.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('button[data-zeitraum]') : null;
      if (!b) return;
      VW.zeitraum = b.getAttribute('data-zeitraum');
      /* Der Zeitraum SETZT DIE KERZE VOR (Auftrag 8a): 5J zeigt Wochenkerzen, 1M
       * Stundenkerzen. Danach ist die Kerze frei waehlbar - die zweite Reihe steht
       * direkt darunter und nimmt jeden erlaubten Knopf an.
       *
       * Die bisherige Wahl wird bewusst NICHT weitergetragen: sonst haengt an einem
       * Knopf zweierlei Verhalten, je nachdem, was vorher galt - wer von 1J/1T auf
       * 5J klickt, bekaeme Tageskerzen, wer von 1J/1h kommt, Stundenkerzen. Ein
       * Knopf, der zweierlei tut, ist genau die Verwechslung, aus der 8a herausfuehrt.
       * `null` heisst deshalb: keine Vorwahl, die zu ehren waere. */
      VW.kerze = KC().kerzeFuer(VW.zeitraum, null);
      VW.fensterVon = null;
      VW.nachgeladen = '';
      vwWahlZeichnen();
      vwMerken();
      vwLaden();
    });
  }

  /* ---- Reihe 2: die KERZENLAENGE. Unsinnige Paare sind ausgegraut und sagen,
   * warum - ein Knopf, der nichts tut und nichts sagt, ist eine Sackgasse. ---- */
  function vwKerzeBauen() {
    var el = document.getElementById('vwKerze');
    if (!el || el.__bereit || !KC()) return;
    el.__bereit = true;
    el.innerHTML = KC().KERZEN.map(function (k) {
      return '<button type="button" data-kerze="' + k + '">' + k + '</button>';
    }).join('');
    el.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('button[data-kerze]') : null;
      if (!b || b.disabled) return;
      var neu = b.getAttribute('data-kerze');
      if (neu === VW.kerze) return;
      /* DER LINKE RAND BLEIBT STEHEN. Beim Wechsel auf eine feinere Kerze zeigt das
       * Bild denselben Anfang, nur genauer - es springt nicht ans Reihenende. Die
       * Zahl der sichtbaren Kerzen waechst dabei im selben Verhaeltnis wie die
       * Aufloesung, sonst zeigte "feiner" pltzlich einen kuerzeren Ausschnitt. */
      var altZeit = vwLinkeZeit();
      VW.kerze = neu;
      VW.__linkeZeit = altZeit;
      VW.nachgeladen = '';
      vwWahlZeichnen();
      vwMerken();
      vwLaden();
    });
  }

  /** Der Zeitstempel der linken Kerze im Bild - der Anker ueber den Kerzenwechsel.
   *  Ein INDEX taugte dafuer nicht: bei feineren Kerzen zeigt derselbe Index auf
   *  einen ganz anderen Tag. */
  function vwLinkeZeit() {
    var s = VW.sichtbar;
    return (s && s.kerzen && s.kerzen.length) ? s.kerzen[0][0] : null;
  }

  /** Beide Reihen anmalen: was gewaehlt ist, was gesperrt ist und warum. */
  function vwWahlZeichnen() {
    var kc = KC();
    if (!kc) return;
    var zEl = document.getElementById('vwZeitraum');
    if (zEl) {
      [].slice.call(zEl.querySelectorAll('button[data-zeitraum]')).forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-zeitraum') === VW.zeitraum);
      });
    }
    var kEl = document.getElementById('vwKerze');
    if (kEl) {
      [].slice.call(kEl.querySelectorAll('button[data-kerze]')).forEach(function (b) {
        var k = b.getAttribute('data-kerze');
        var u = kc.paarUrteil(VW.zeitraum, k);
        b.disabled = !u.ok;
        b.classList.toggle('active', k === VW.kerze);
        /* Der Grund steht am Knopf, nicht in einer Fussnote - dort sucht ihn
         * niemand. */
        if (u.ok) b.removeAttribute('title'); else b.setAttribute('title', u.grund);
        b.setAttribute('aria-disabled', u.ok ? 'false' : 'true');
      });
    }
  }

  /* ---- Die Leiste "Einblenden": Signale, Kanaele, Indikatoren ----
   * Aus Daten gebaut (SIGNALE, INDIKATOREN), nicht aus Markup - die Erklaertexte
   * und die Urteile stehen dort an EINER Stelle. */
  function vwEinblendenBauen() {
    var el = document.getElementById('vwEinblenden');
    if (!el || el.__bereit) return;
    el.__bereit = true;
    function kasten(art, schluessel, def) {
      var u = urteilZu(def.urteil);
      var titel = def.hinweis + (def.urteil ? '\n\nStudienregister: ' + u.text + (u.quelle ? ' (' + u.quelle + ')' : '') : '');
      return '<label class="sigbox" title="' + U.esc(titel) + '">' +
        '<input type="checkbox" data-' + art + '="' + U.esc(schluessel) + '"> ' + U.esc(def.name) + '</label>';
    }
    el.innerHTML =
      '<span class="vwGruppe">Signale:</span>' +
      Object.keys(SIGNALE).map(function (k) { return kasten('sig', k, SIGNALE[k]); }).join('') +
      '<span class="vwGruppe">Chartbild:</span>' +
      Object.keys(INDIKATOREN).map(function (k) { return kasten('ind', k, INDIKATOREN[k]); }).join('') +
      '<span id="vwSigZahl" class="hinweis"></span>';
    el.addEventListener('change', function (ev) {
      var cb = ev.target;
      if (!cb || cb.type !== 'checkbox') return;
      var s = cb.getAttribute('data-sig'), i = cb.getAttribute('data-ind');
      if (s) { sigAn[s] = cb.checked; vwPunkteRechnen(); }
      else if (i) { indAn[i] = cb.checked; }
      else return;
      GEWAEHLT = null;
      vwMerken();
      /* Neu zeichnen genuegt - die Kerzen sind schon da, es wird nichts nachgeladen. */
      vwZeichnen();
    });
  }

  /* ---- Die Zoom-Knoepfe. Die Tastatur bleibt, aber sie war unsichtbar. ---- */
  function vwZoomBauen() {
    var el = document.getElementById('vwZoom');
    if (!el || el.__bereit) return;
    el.__bereit = true;
    el.innerHTML =
      '<button type="button" data-zoom="rein" aria-label="Hineinzoomen">+</button>' +
      '<button type="button" data-zoom="raus" aria-label="Herauszoomen">−</button>' +
      '<button type="button" data-zoom="zurueck" aria-label="Zoom auf den Zeitraum zurücksetzen">↺</button>';
    el.addEventListener('click', function (ev) {
      var b = ev.target && ev.target.closest ? ev.target.closest('button[data-zoom]') : null;
      if (!b) return;
      var was = b.getAttribute('data-zoom');
      if (was === 'zurueck') { vwZurueck(); return; }
      vwZoomen(was === 'rein', 0.5);
    });
  }

  /** Zoom auf den Zeitraum zuruecksetzen - das ist der Doppelklick und der ↺-Knopf. */
  function vwZurueck() {
    VW.fensterVon = null;
    VW.fensterN = vwFensterVorgabe();
    VW.nachgeladen = '';
    vwZeichnen();
  }
  /** Wie viele Kerzen zeigt der gewaehlte Zeitraum von sich aus? Genau so viele, wie
   *  er hat - der Zeitraum IST das Bild, solange niemand zoomt. */
  function vwFensterVorgabe() {
    var n = KC() ? KC().kerzenZahl(VW.zeitraum, VW.kerze) : null;
    return n ? Math.max(20, Math.round(n)) : 260;
  }

  /** Zoomen um einen Anteil der Bildbreite (0 = linker Rand, 1 = rechter). */
  function vwZoomen(rein, anteil) {
    var s = VW.sichtbar;
    if (!s || !KC()) return;
    var f = KC().radZoom(s.gesamt, s.fenster.von, s.fenster.anzahl, anteil, rein);
    VW.fensterVon = f.von;
    VW.fensterN = f.anzahl;
    vwZeichnen();
    /* Ganz links angekommen und immer noch weiter herausgezoomt: dann reicht die
     * geladene Reihe nicht mehr, und der naechstgroessere Zeitraum wird geholt. */
    if (!rein && f.von === 0 && f.anzahl >= s.gesamt) vwMehrLaden();
  }

  /** Blaettern um `kerzen` Stellen (positiv = nach rechts, juenger). */
  function vwBlaettern(kerzen) {
    var s = VW.sichtbar;
    if (!s || !KC()) return;
    var f = KC().blaettern(s.gesamt, s.fenster.von, s.fenster.anzahl, kerzen);
    var amAnfang = f.von === 0 && s.fenster.von === 0 && kerzen < 0;
    VW.fensterVon = f.von;
    VW.fensterN = f.anzahl;
    vwZeichnen();
    if (amAnfang) vwMehrLaden();
  }

  /** Ueber den Anfang hinaus: den naechstgroesseren Zeitraum nachladen.
   *  Zoomen laedt sonst NICHTS nach - solange die geladene Reihe reicht, ist das
   *  Bild eine Sache der Anzeige, keine der Quelle. */
  function vwMehrLaden() {
    if (!KC() || VW.laeuft) return;
    var liste = KC().ZEITRAEUME;
    var i = liste.indexOf(VW.zeitraum);
    if (i < 0 || i >= liste.length - 1) return;
    var neu = liste[i + 1];
    if (!KC().paarUrteil(neu, VW.kerze).ok) {
      /* Der groessere Zeitraum vertruege diese Kerze nicht - dann waechst er nicht
       * heimlich mit einer anderen Kerze, sondern es bleibt, wie es ist. */
      VW.nachgeladen = 'Weiter zurück ginge nur mit gröberen Kerzen als ' + VW.kerze + '.';
      vwQuelleZeichnen(VW.sichtbar);
      return;
    }
    VW.zeitraum = neu;
    VW.nachgeladen = 'Am Anfang der geladenen Reihe – auf ' + neu + ' erweitert.';
    VW.fensterVon = 0;
    vwWahlZeichnen();
    vwMerken();
    vwLaden();
  }

  /* ---- Sitzung je Kerze: Bereiche aus der Datei, sonst die Uhr ---- */
  function vwSitzungAusZeit(tsMs) {
    if (!window.Quant || !window.Boerse || !KC()) return null;
    var laenge = window.Boerse.sitzungsMinuten(tsMs);
    return KC().sitzungAusMinuten(window.Quant.minutenSeitOeffnung(tsMs), laenge);
  }

  /* ---- Wie weit die Quelle je Zeitraum gefragt wird ---- */
  var VW_YAHOO_BEREICH = {
    '1T': '1d', '5T': '5d', '1M': '1mo', '3M': '3mo',
    '6M': '6mo', '1J': '1y', '5J': '5y', 'Max': 'max'
  };
  /* Vorlauf fuer die Durchschnitte: die MA200 braucht 200 Kerzen VOR der ersten
   * sichtbaren, sonst beginnt die Linie mitten im Bild. Genau das war der Befund am
   * AMD-Foto (05.09.2026) - dort lag der Fehler zwar an der Rechnung, aber ohne
   * Vorlauf waere er nur verschoben. */
  var VW_VORLAUF = 250;

  /** Wie viele Kerzen der gewaehlte Zeitraum in der gewaehlten Kerzenlaenge braucht. */
  function vwAnzahl(kerze) {
    var n = KC() ? KC().kerzenZahl(VW.zeitraum, kerze) : null;
    return Math.min(20000, Math.max(60, Math.round((n || 260) + VW_VORLAUF)));
  }

  /* ---- Laden: Archiv zuerst, Yahoo als Rueckfall, 1W/1M gebildet ---- */
  async function vwLaden() {
    if (!CUR || !KC()) return;
    var seq = openSeq;
    VW.laeuft = true;
    var kc = KC();
    /* Wochen und Monate holt niemand: sie werden aus TAGESKERZEN gebildet. Geladen
     * wird also die Tagesreihe, verdichtet wird danach. */
    var gebildet = !!kc.AUS_TAGESKERZEN[VW.kerze];
    var quellKerze = gebildet ? '1T' : VW.kerze;
    var n = vwAnzahl(quellKerze) * (gebildet ? (VW.kerze === '1M' ? 21 : 5) : 1);
    n = Math.min(20000, n);
    var teile = [], details = [];
    var archiv = [], sitzungsBereiche = [], archivBis = null;

    var r = null;
    if (window.api && typeof window.api.archivKerzen === 'function') {
      try { r = await window.api.archivKerzen(CUR.sym, quellKerze, n); } catch (e) { r = { ok: false, grund: String(e && e.message || e) }; }
    } else {
      r = { ok: false, grund: 'Leseauskunft in dieser Fassung nicht vorhanden' };
    }
    if (seq !== openSeq) return;
    if (r && r.ok && r.kerzen && r.kerzen.length) {
      archiv = r.kerzen;
      sitzungsBereiche = r.sitzungen || [];
      archivBis = r.bis;
      /* Format 1 fuehrt keine Herkunft je Kerze - das ist kein Fehler, sondern der
       * Bestand vor Z1 (03.09.2026). "unbekannt" saehe wie eine Stoerung aus. */
      var qn = (r.quellen || ['unbekannt']).map(function (q) {
        return q === 'unbekannt' ? 'Herkunft nicht vermerkt' : q;
      });
      var quellName = r.quelle === 'alpaca' ? 'Alpaca-Minutenarchiv' : 'Archiv (' + qn.join(', ') + ')';
      teile.push(quellName);
      details.push(quellName + ', bis ' + vwZeitpunkt(r.bis));
    } else {
      teile.push('Archiv: ' + ((r && r.grund) || 'nichts gefunden'));
      details.push('Archiv: ' + ((r && r.grund) || 'nichts gefunden'));
    }

    /* Rueckfall und Ergaenzung: Yahoo. Er wird IMMER gefragt, wenn das Archiv den
     * laufenden Tag nicht hat - sonst endete der Chart am Vortagsschluss, ohne dass
     * jemand saehe, warum. Was Yahoo doppelt liefert, wirft die Naht weg. */
    var live = [];
    var brauchtLive = !archiv.length || vwArchivVeraltet(archivBis, quellKerze);
    if (brauchtLive) {
      try {
        var iv = kc.YAHOO_INTERVALL[quellKerze];
        var kd = await window.Kurse.hole(CUR.sym, { range: VW_YAHOO_BEREICH[VW.zeitraum] || '1y', interval: iv, bereinigt: false });
        if (seq !== openSeq) return;
        live = (kd && kd.bars) ? kd.bars : [];
        if (!archiv.length) teile.push(live.length ? 'Yahoo' : 'Yahoo: keine Kerzen');
        details.push(live.length ? 'Yahoo live: ' + live.length + ' Kerzen' : 'Yahoo live: keine Kerzen');
      } catch (e) {
        teile.push('Yahoo: ' + String(e && e.message || e));
        details.push('Yahoo live: ' + String(e && e.message || e));
      }
    }

    var z = kc.zusammenfuehren(archiv, live);
    var reihe = z.kerzen;
    if (gebildet) {
      var vorher = reihe.length;
      reihe = kc.verdichten(reihe, VW.kerze, 'America/New_York');
      details.push(VW.kerze + '-Kerzen aus ' + vorher + ' Tageskerzen gebildet (Börsenkalender), nicht geholt');
    }
    VW.fest = reihe;
    VW.sitzungen = kc.sitzungJeKerze(VW.fest, gebildet ? [] : sitzungsBereiche, gebildet ? null : vwSitzungAusZeit);
    if (z.doppelt) details.push(z.doppelt + ' doppelte Kerzen an der Naht verworfen (Archiv gewinnt)');
    VW.quelleText = teile.join(' · ');
    VW.quelleDetails = details;
    VW.laeuft = false;
    VW.letzterLauf = Date.now();
    vwPunkteRechnen();
    /* Der gemerkte linke Rand (Kerzenwechsel) wird jetzt auf die neue Reihe
     * uebersetzt - ueber die ZEIT, nicht ueber den Index. */
    if (VW.__linkeZeit) { vwLinkenRandSetzen(VW.__linkeZeit); VW.__linkeZeit = null; }
    else if (VW.fensterVon == null) VW.fensterN = vwFensterVorgabe();
    vwZeichnen();
    vwArchivKarte();
  }

  /** Den linken Rand auf den Zeitpunkt legen, der vor dem Wechsel dort stand. */
  function vwLinkenRandSetzen(zeitMs) {
    var basis = vwBasis().kerzen;
    if (!basis.length) return;
    var i = 0;
    while (i < basis.length - 1 && basis[i][0] < zeitMs) i++;
    var alt = VW.fensterN;
    VW.fensterN = Math.max(20, Math.min(basis.length, Math.round(vwFensterVorgabe())));
    VW.fensterVon = Math.max(0, Math.min(basis.length - VW.fensterN, i));
    if (!(alt > 0)) VW.fensterVon = null;
  }

  /* Ist das Archiv fuer diesen Zeitrahmen nicht mehr aktuell? Eine Kerzendauer
   * Nachlauf, damit nicht jede gerade laufende Periode als Luecke gilt. */
  function vwArchivVeraltet(bisMs, zr) {
    if (!bisMs || !KC()) return true;
    var d = KC().INTERVALL_MS[zr] || 86400000;
    return (Date.now() - bisMs) > d * 2;
  }
  function vwZeitpunkt(ms) {
    if (!ms) return '–';
    var d = new Date(ms);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' +
      d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET';
  }

  /* ---- Zeichnen ---- */
  function vwFarben() {
    var s = getComputedStyle(document.documentElement);
    function v(name, ersatz) { var x = s.getPropertyValue(name); return (x && x.trim()) || ersatz; }
    return {
      auf: v('--up', '#16a34a'), ab: v('--down', '#dc2626'),
      band: 'rgba(148,163,184,0.13)', umsatz: 'rgba(148,163,184,0.5)',
      gitter: 'rgba(148,163,184,0.22)',
      text: v('--muted', '#64748b'),
      ma20: v('--series', '#2563eb'), ma50: v('--warn', '#f59e0b'), ma200: v('--series3', '#a855f7'),
      kreuz: v('--muted', '#94a3b8'),
      linie: v('--muted', '#94a3b8'),
      zone20: v('--baseline', '#64748b'), zone60: v('--muted', '#94a3b8'),
      kanal: v('--series4', '#0ea5e9'), acc: v('--acc', '#2563eb')
    };
  }
  var VW_MA_FARBE = { 20: 'ma20', 50: 'ma50', 200: 'ma200' };

  /** Die Reihe, auf der Fenster und Signale sitzen: gefiltert, mit laufender Kerze. */
  function vwBasis() {
    var basis = VW.fest, sitz = VW.sitzungen;
    if (VW.nurRegulaer && KC()) {
      var g = KC().nurRegulaer(basis, sitz);
      basis = g.kerzen; sitz = g.sitzungen;
    }
    /* Die laufende Kerze haengt hinten an - und NUR hier, in der Zeichenliste. */
    var lauf = vwLaufendeKerze(basis);
    return {
      kerzen: lauf ? basis.concat([lauf]) : basis,
      sitzungen: lauf ? sitz.concat([vwSitzungAusZeit(lauf[0]) || 'unbekannt']) : sitz,
      laufend: !!lauf
    };
  }
  function vwSichtbar() {
    var b = vwBasis();
    var alle = b.kerzen;
    var n = Math.min(alle.length || 1, VW.fensterN || vwFensterVorgabe());
    var f = VW.fensterVon == null
      ? KC().fenster(alle.length, alle.length - 1, n)
      : KC().fensterAbVon(alle.length, VW.fensterVon, n);
    return {
      kerzen: alle.slice(f.von, f.bis + 1),
      sitzungen: b.sitzungen.slice(f.von, f.bis + 1),
      gesamt: alle.length, fenster: f, laufend: b.laufend, alle: alle
    };
  }
  /* Die laufende Kerze aus dem Quote - nur bei sichtbarem Fenster und nur, wenn ein
   * Kurs da ist. Sie wird nie gespeichert und nie geschrieben.
   * Bei gebildeten Kerzen (1W/1M) entsteht sie nicht: ihre Periode hat keine feste
   * Laenge, und die letzte Wochenkerze traegt den laufenden Tag ohnehin schon. */
  function vwLaufendeKerze(basis) {
    if (document.hidden || !basis.length || !KC()) return null;
    if (KC().AUS_TAGESKERZEN[VW.kerze]) return null;
    var q = vwQuote();
    if (!q || !(q.kurs > 0)) return null;
    var d = KC().INTERVALL_MS[VW.kerze];
    if (!d) return null;
    return KC().laufendeKerze(basis[basis.length - 1], q.kurs, Date.now(), d);
  }
  function vwQuote() {
    var MW = window.Marktwerte;
    if (MW && typeof MW.quote === 'function') {
      var q = MW.quote(CUR ? CUR.sym : '');
      if (q && q.kurs > 0) return q;
    }
    return null;
  }

  /** Die Signale ueber die GELADENE Reihe rechnen - einmal, nicht je Bild.
   *  Zoomen und Blaettern duerfen nichts nachrechnen; sonst kostet jede Radbewegung
   *  auf einem Jahreschart hunderte Detektor-Laeufe. */
  function vwPunkteRechnen() {
    VW.punkte = signalePunkte(vwBasis().kerzen);
    LETZTE_PUNKTE = VW.punkte.slice();
    GEWAEHLT = null;
  }
  /** Aus den Signalen die Marken fuer das gezeigte Fenster - reine Zuordnung ueber
   *  den Zeitstempel, keine zweite Rechnung. */
  function vwMarken(kerzen) {
    var wo = {};
    kerzen.forEach(function (k, i) { wo[k[0]] = i; });
    var aus = [];
    VW.punkte.forEach(function (p, pi) {
      var i = wo[p.t];
      if (i === undefined) return;
      aus.push({ index: i, richtung: p.dir === 'call' ? 'call' : 'put', farbe: p.farbe,
                 gewaehlt: GEWAEHLT === pi, punkt: pi });
    });
    return aus;
  }

  function vwZeichnen() {
    var c = document.getElementById('vwChart');
    if (!c || !KC()) return;
    var breite = Math.max(320, c.clientWidth || 900);
    var hoehe = Math.max(200, c.clientHeight || 420);
    var dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(breite * dpr) || c.height !== Math.round(hoehe * dpr)) {
      c.width = Math.round(breite * dpr); c.height = Math.round(hoehe * dpr);
    }
    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var s = vwSichtbar();
    var hin = document.getElementById('vwHinweis');
    if (!s.kerzen.length) {
      ctx.clearRect(0, 0, breite, hoehe);
      if (hin) hin.textContent = 'Für diese Kombination liegen keine Kerzen vor.';
      VW.sichtbar = s;
      vwQuelleZeichnen(s);
      vwSignalListe();
      return;
    }
    if (hin) hin.textContent = '';
    var sk = KC().skala(s.kerzen, { breite: breite, hoehe: hoehe });
    if (!sk) return;
    VW.skala = sk;
    VW.sichtbar = s;
    var f = vwFarben();
    var linien = vwLinien(s);
    var bs = KC().baender(s.sitzungen);
    var marken = vwMarken(s.kerzen);
    /* Das Ergebnis des Zeichnens bleibt stehen - die Oberflaechen-Probe kann sonst
     * nur pruefen, dass ein Canvas Breite hat, nicht WAS darauf steht. */
    VW.gezeichnet = KC().zeichnen(ctx, s.kerzen, sk, {
      farben: f, baender: bs, linien: linien, kreuz: VW.kreuz,
      marken: marken, umsatz: indAn.volumen !== false
    });
    vwZonenZeichnen(ctx, sk, s.kerzen, f);
    vwKanaeleZeichnen(ctx, sk, s.kerzen, f);
    vwBandBeschriften(ctx, sk, bs, f);
    vwAchsen(ctx, sk, s.kerzen, f);
    vwSpurZeichnen(s, f);
    vwQuelleZeichnen(s, bs);
    vwSignalListe();
  }

  /** Die Linien im Kursbild: gleitende Durchschnitte und die Leitlinie.
   *
   *  UEBER DIE GANZE GELADENE REIHE gerechnet, dann auf das Fenster geschnitten.
   *  Vorher lief maReihe ueber die SICHTBAREN Kerzen - auf einem Bild mit 260 von
   *  695 geladenen Kerzen begann die MA200 deshalb erst bei der 200. sichtbaren,
   *  also weit im Bild drin (PM-Fund am AMD-Foto, 05.09.2026). Eine Linie, die
   *  spaeter beginnt, als sie koennte, ist keine kuerzere Linie - sie ist eine
   *  andere Zahl unter demselben Namen. */
  function vwLinien(s) {
    var linien = [];
    if (!window.Quant || !KC()) return linien;
    var f = vwFarben();
    var alle = s.alle;
    var von = s.fenster.von, bis = s.fenster.bis;
    Object.keys(VW.ma).forEach(function (n) {
      if (!VW.ma[n]) return;
      var ganz = KC().maReihe(alle, Number(n), window.Quant.sma);
      var werte = ganz.slice(von, bis + 1);
      if (werte.some(function (v) { return v != null; })) {
        linien.push({ werte: werte, farbe: f[VW_MA_FARBE[n]], breite: 1.3 });
      }
    });
    /* SMA 50/200 als Chartbild-Schalter - dieselbe Rechnung, andere Beschriftung.
     * Volle 50/200 Kerzen oder gar nicht: frueher schrumpften die Fenster still auf
     * einen Bruchteil der Reihe, und als "SMA 200" wurde ein SMA 10 gezeichnet. */
    if (indAn.ma) {
      [[50, 'ma50'], [200, 'ma200']].forEach(function (paar) {
        if (alle.length < paar[0] + 5) return;
        var ganz = KC().maReihe(alle, paar[0], window.Quant.sma);
        linien.push({ werte: ganz.slice(von, bis + 1), farbe: f[paar[1]], breite: 1.4 });
      });
    }
    if (indAn.linie && window.Quant.emaSeries) {
      var closes = alle.map(function (k) { return k[1]; });
      var ema = window.Quant.emaSeries(closes, 20);
      linien.push({ werte: ema.slice(von, bis + 1), farbe: f.linie, breite: 1 });
    }
    return linien;
  }

  /** Unterstuetzung und Widerstand als Hoch/Tief der letzten 20 und 60 Kerzen.
   *  Dieselbe Groesse, die der Donchian-Detektor benutzt - was man sieht, ist genau
   *  das, worauf die Automatik reagieren wuerde. */
  function vwZonenZeichnen(ctx, sk, kerzen, f) {
    if (!indAn.sr) return;
    ctx.save();
    ctx.font = '10px system-ui, sans-serif';
    [[20, f.zone20], [60, f.zone60]].forEach(function (paar) {
      var nn = paar[0];
      if (kerzen.length < nn + 2) return;
      var hoch = -Infinity, tief = Infinity;
      for (var i = kerzen.length - nn; i < kerzen.length; i++) {
        var hh = kerzen[i][3] != null ? kerzen[i][3] : kerzen[i][1];
        var ll = kerzen[i][4] != null ? kerzen[i][4] : kerzen[i][1];
        if (hh > hoch) hoch = hh;
        if (ll < tief) tief = ll;
      }
      [[hoch, 'Widerstand'], [tief, 'Unterstützung']].forEach(function (z) {
        if (z[0] > sk.hoch || z[0] < sk.tief) return;
        var y = sk.y(z[0]);
        ctx.strokeStyle = paar[1];
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(sk.links, y);
        ctx.lineTo(sk.breite - sk.rechts, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = paar[1];
        ctx.fillText(z[1] + ' ' + nn + ' · ' + U.nf2.format(z[0]), sk.links + 3, y - 3);
      });
    });
    ctx.restore();
  }

  /** Kanaele und Kanal-Abschnitte, Anzeige wie in der alten Ansicht - nur auf
   *  Leinwand statt SVG. Gerechnet wird nichts Neues: Q.kanaele und
   *  Q.kanalSegmente sind dieselben Funktionen wie bisher.
   *
   *  Der Kanal ist ANZEIGE. Als Handelsbedingung ist er gemessen und verworfen
   *  (Abschnittskanaele, 22.08.2026); die Leiste sagt das im Tooltip aus dem
   *  Studienregister, nicht aus einem festen Satz. */
  function vwKanaeleZeichnen(ctx, sk, kerzen, f) {
    if (!Q || kerzen.length < 40) {
      var kInfoLeer = document.getElementById('vwKanalInfo');
      if (kInfoLeer && (indAn.kanal || indAn.segmente)) {
        kInfoLeer.textContent = 'Nur ' + kerzen.length + ' Kerzen im Bild – für einen Kanal zu wenig.';
      } else if (kInfoLeer) { kInfoLeer.textContent = ''; }
      return;
    }
    var texte = [];
    function kante(von, bis, p1, p2, farbe, breite, strich, deck) {
      ctx.save();
      ctx.strokeStyle = farbe;
      ctx.lineWidth = breite;
      ctx.globalAlpha = deck;
      if (strich) ctx.setLineDash(strich);
      ctx.beginPath();
      ctx.moveTo(sk.x(von), sk.y(p1));
      ctx.lineTo(sk.x(bis), sk.y(p2));
      ctx.stroke();
      ctx.restore();
    }
    if (indAn.segmente && Q.kanalSegmente) {
      Q.kanalSegmente(kerzen).forEach(function (sg, si) {
        var m1 = sg.achse, m2 = sg.achse + sg.steigung * (sg.n - 1);
        var o1 = m1 + (sg.oben - sg.mitteJetzt), o2 = sg.oben;
        var u1 = m1 + (sg.unten - sg.mitteJetzt), u2 = sg.unten;
        var farbe = sg.trend === 'auf' ? f.auf : sg.trend === 'ab' ? f.ab : f.acc;
        /* #80 (Wilhelms Weg 2): angezeigt und gewichtet wird das PERZENTIL gegen
         * Rauschen, nicht die Roh-Guete - deren Nullpunkt liegt bei ~75-94. */
        var pS = Q.gueteZufallsAnteil(sg.guete, sg.n);
        var deck = 0.30 + Math.min(0.5, (pS == null ? 50 : pS) / 100 * 0.5);
        kante(sg.von, sg.bis, m1, m2, farbe, 1.2, null, deck);
        kante(sg.von, sg.bis, o1, o2, farbe, 1, [4, 3], deck);
        kante(sg.von, sg.bis, u1, u2, farbe, 1, [4, 3], deck);
        /* Auf einer Leinwand gibt es kein <title> wie im SVG - die Einordnung des
         * Abschnitts stuende sonst nirgends. Sie gehoert in die Zeile darunter:
         * die Roh-Guete allein ist kein Mass (Rauschen-Median 75-94), das
         * Perzentil ist es. */
        texte.push('A' + (si + 1) + ' ' + (sg.trend === 'auf' ? 'aufwärts' : sg.trend === 'ab' ? 'abwärts' : 'seitwärts') +
          ' über ' + sg.n + ' Kerzen (' +
          (pS == null ? 'Ordnung nicht einordbar' : 'besser als ' + pS + ' % des Zufalls, Roh-Güte ' + sg.guete + '/100') + ')');
        ctx.save();
        ctx.fillStyle = farbe;
        ctx.globalAlpha = 0.9;
        ctx.font = '9px system-ui, sans-serif';
        ctx.fillText('A' + (si + 1) + ' ' + (sg.trend === 'auf' ? '▲' : sg.trend === 'ab' ? '▼' : '▬'),
          sk.x((sg.von + sg.bis) / 2) - 8, sk.y(Math.max(o1, o2)) - 3);
        ctx.restore();
      });
    }
    if (indAn.kanal && Q.kanaele) {
      var kListe = Q.kanaele(kerzen) || [];
      kListe.forEach(function (kk) {
        var m1 = kk.achse, m2 = kk.achse + kk.steigung * (kk.n - 1);
        var o1 = m1 + (kk.oben - kk.mitteJetzt), o2 = kk.oben;
        var u1 = m1 + (kk.unten - kk.mitteJetzt), u2 = kk.unten;
        var pK = Q.gueteZufallsAnteil(kk.guete, kk.n);
        var deck = 0.25 + Math.min(0.55, (pK == null ? 50 : pK) / 100 * 0.55);
        kante(kk.von, kk.bis, m1, m2, f.kanal, 1.2, null, deck);
        kante(kk.von, kk.bis, o1, o2, f.kanal, 1, [5, 4], deck);
        kante(kk.von, kk.bis, u1, u2, f.kanal, 1, [5, 4], deck);
        texte.push(kk.name + ': ' + (kk.trend === 'auf' ? 'aufwärts' : kk.trend === 'ab' ? 'abwärts' : 'seitwärts') +
          ' (' + (pK == null ? 'nicht einordbar' : 'besser als ' + pK + ' % des Zufalls') +
          (kk.wendeBestaetigt ? ', beginnt an echtem Wendepunkt' : '') + ')');
      });
    }
    /* Golden/Death Cross als Kreise auf der SMA50 - dieselbe Stelle wie frueher. */
    if (indAn.cross50200 && window.Quant && kerzen.length >= 210) {
      var s50 = KC().maReihe(kerzen, 50, window.Quant.sma);
      var s200 = KC().maReihe(kerzen, 200, window.Quant.sma);
      var kreuze = 0;
      ctx.save();
      ctx.lineWidth = 2;
      for (var ci = 1; ci < kerzen.length; ci++) {
        if (s50[ci] == null || s200[ci] == null || s50[ci - 1] == null || s200[ci - 1] == null) continue;
        var golden = s50[ci - 1] <= s200[ci - 1] && s50[ci] > s200[ci];
        var death = s50[ci - 1] >= s200[ci - 1] && s50[ci] < s200[ci];
        if (!golden && !death) continue;
        kreuze++;
        ctx.strokeStyle = golden ? f.auf : f.ab;
        ctx.beginPath();
        ctx.arc(sk.x(ci), sk.y(s50[ci]), 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      if (kreuze) texte.push(kreuze + ' Kreuzung' + (kreuze === 1 ? '' : 'en') + ' SMA50/200 im Bild');
    }
    var kInfo = document.getElementById('vwKanalInfo');
    if (kInfo) {
      kInfo.textContent = texte.length ? texte.join(' · ')
        : ((indAn.kanal || indAn.segmente || indAn.cross50200) ? 'Nichts davon im gezeigten Ausschnitt.' : '');
    }
    vwKanalVerzug(kerzen);
  }

  /** Wie spaet ist der Kanal?
   *
   *  Ein Regressionskanal beschreibt, was war - er kann der Bewegung nur nachlaufen.
   *  Wie weit, stand bis zum 20.08.2026 nirgends, und man sieht es dem Bild nicht an:
   *  am AMD-Chart meldete er am Tageshoch "aufwaerts" und am Tagestief "abwaerts".
   *  Diese Zeile rechnet es aus, statt es dem Auge zu ueberlassen - gerade weil sie
   *  oft unbequem ausfaellt. */
  function vwKanalVerzug(kerzen) {
    var el = document.getElementById('vwKanalVerzug');
    if (!el) return;
    if (!indAn.kanal || !Q || !Q.kanalVerzug) { el.innerHTML = ''; return; }
    var fen = Math.min(200, Math.max(40, Math.floor(kerzen.length / 3)));
    var vz = kerzen.length >= fen + 12 ? Q.kanalVerzug(kerzen, { fenster: fen, maxRueck: 150 }) : null;
    if (!vz) { el.innerHTML = ''; return; }
    if (vz.ohneRichtung) {
      el.innerHTML = '<b>Kanal-Verzug:</b> Der Kanal steht seitwärts – ohne Richtung gibt es keinen Verzug zu messen.';
      return;
    }
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
    el.innerHTML = txt;
  }

  /** Die Indikator-Spur unter dem Chart. Gerechnet wird der RSI von window.Quant -
   *  der Viewer hat keine eigene Formel dafuer. */
  function vwSpurZeichnen(s, f) {
    var c = document.getElementById('vwIndi');
    var wrap = document.getElementById('vwIndiWrap');
    if (!c || !wrap) return;
    var an = !!indAn.rsi;
    wrap.hidden = !an;
    if (!an) return;
    var breite = Math.max(320, c.clientWidth || 900);
    var hoehe = Math.max(60, c.clientHeight || 90);
    var dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(breite * dpr) || c.height !== Math.round(hoehe * dpr)) {
      c.width = Math.round(breite * dpr); c.height = Math.round(hoehe * dpr);
    }
    var ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!window.Quant || typeof window.Quant.rsi !== 'function') return;
    /* Ueber die ganze geladene Reihe, dann geschnitten - wie die Durchschnitte.
     * Ein RSI, der beim linken Bildrand neu anfaengt, misst 14 andere Kerzen. */
    var closes = s.alle.map(function (k) { return k[1]; });
    var reihe = [];
    for (var i = 0; i < closes.length; i++) {
      reihe.push(i < 14 ? null : window.Quant.rsi(closes.slice(0, i + 1), 14));
    }
    KC().spurZeichnen(ctx, reihe.slice(s.fenster.von, s.fenster.bis + 1),
      { breite: breite, hoehe: hoehe },
      { name: 'RSI 14', schwellen: [30, 70], tief: 0, hoch: 100, farbe: f.ma20, farben: f });
  }

  /* Ein graues Band ohne Wort ist ein grauer Fleck. Beschriftet wird nur, was breit
   * genug ist - sonst stuenden auf einem Jahreschart hunderte Woerter uebereinander. */
  function vwBandBeschriften(ctx, sk, bs, f) {
    ctx.save();
    ctx.fillStyle = f.kreuz;
    ctx.font = '10px system-ui, sans-serif';
    bs.forEach(function (b) {
      var x0 = sk.links + b.von * sk.dx, x1 = sk.links + (b.bis + 1) * sk.dx;
      var txt = KC().bandText(b.art);
      if (x1 - x0 < ctx.measureText(txt).width + 8) return;
      ctx.fillText(txt, x0 + 3, sk.oben + 11);
    });
    ctx.restore();
  }
  /* Kurs- und Zeitachse. Die Zeit steht in New Yorker Zeit - der Wert wird dort
   * gehandelt, und eine deutsche Uhrzeit auf einer US-Sitzung waere eine
   * Umrechnung, die niemand im Kopf hat. */
  function vwAchsen(ctx, sk, kerzen, f) {
    ctx.save();
    ctx.fillStyle = f.kreuz;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    for (var i = 0; i <= 4; i++) {
      var v = sk.tief + (sk.hoch - sk.tief) * i / 4;
      ctx.fillText(U.nf2.format(v), sk.breite - sk.rechts + 4, sk.y(v) + 3);
    }
    /* Die Halte rechnet markt/kerzenchart.js - dort ist die Regel in Node pruefbar
     * und haengt an nichts, was auf dem Bildschirm steht (PM-Fund 04.09.2026:
     * sechsmal "10:30" ueber drei Tage). */
    var kc = KC();
    var marken = kc && kc.achsenBeschriftung
      ? kc.achsenBeschriftung(kerzen, { intervallMs: kc.INTERVALL_MS[VW.kerze] || 86400000, zone: 'America/New_York' })
      : [];
    marken.forEach(function (m) {
      ctx.fillText(m.text, sk.x(m.i) - 18, sk.hoehe - 6);
    });
    ctx.restore();
  }

  /* DIE FUSSZEILE IST NIE STUMM - aber sie ist auch keine Textwand mehr.
   *
   * Vorher stand dort alles nebeneinander: "449 doppelte Kerzen an der Naht
   * verworfen (Archiv gewinnt) · 260 von 695 · letzte Kerze laeuft noch ... · 12
   * ausserboersliche Abschnitte grau hinterlegt · nur regulaere Sitzung". Das ist
   * richtig und trotzdem unlesbar. Jetzt sagt sie EINEN Satz - Quelle, Zeitraum,
   * Kerze, Zahl -, und die Einzelheiten liegen hinter dem i-Knopf daneben. */
  function vwQuelleZeichnen(s, bs) {
    var e = document.getElementById('vwQuelle');
    if (!e) return;
    var satz = (VW.quelleText || 'Quelle unbekannt') +
      ' · ' + VW.zeitraum + ' in ' + VW.kerze + '-Kerzen · ' +
      (s && s.kerzen.length ? s.kerzen.length + ' von ' + s.gesamt + ' im Bild' : 'keine Kerzen');
    if (VW.nachgeladen) satz += ' · ' + VW.nachgeladen;
    e.textContent = satz;
    var d = document.getElementById('vwQuelleDetail');
    if (!d) return;
    var zeilen = (VW.quelleDetails || []).slice();
    if (s && s.laufend) zeilen.push('Die letzte Kerze läuft noch (gestrichelt) – sie wird nicht ins Archiv geschrieben.');
    if (bs && bs.length) zeilen.push(bs.length + ' außerbörsliche Abschnitte grau hinterlegt.');
    zeilen.push(VW.nurRegulaer ? 'Nur die reguläre Sitzung wird gezeigt.' : 'Vor- und nachbörsliche Kerzen werden mitgezeigt.');
    if (SIG_FEHLER) zeilen.push(SIG_FEHLER + ' Detektor-Abbrüche – die Signal-Liste ist unvollständig.');
    d.innerHTML = '<ul>' + zeilen.map(function (z) { return '<li>' + U.esc(z) + '</li>'; }).join('') + '</ul>';
  }

  /* ---- Fadenkreuz: die Statuszeile oben links ----
   * TradingView zeigt dort Zeit, O/H/L/C, Aenderung und Volumen der Kerze unter dem
   * Zeiger. Genau das steht hier - aus der Kerze gelesen, nicht nachgerechnet. */
  function vwKreuzAn(ev) {
    var c = document.getElementById('vwChart');
    if (!c || !VW.skala || !VW.sichtbar) return;
    var r = c.getBoundingClientRect();
    var x = ev.clientX - r.left, y = ev.clientY - r.top;
    if (VW.ziehen) { vwZiehenBewegen(x); return; }
    var i = VW.skala.index(x);
    var k = VW.sichtbar.kerzen[i];
    if (!k) return;
    VW.kreuz = { index: i, y: y };
    vwStatusZeile(i, k);
    vwMarkeTipp(ev, i);
    vwZeichnen();
  }
  function vwStatusZeile(i, k) {
    var ro = document.getElementById('vwKreuz');
    if (!ro) return;
    var vor = i > 0 ? VW.sichtbar.kerzen[i - 1] : null;
    var o = k[5] != null ? k[5] : k[1];
    var h = k[3] != null ? k[3] : Math.max(o, k[1]);
    var t = k[4] != null ? k[4] : Math.min(o, k[1]);
    var pct = vor && vor[1] ? (k[1] / vor[1] - 1) * 100 : null;
    var sitz = VW.sichtbar.sitzungen[i];
    var teile = [
      vwZeitpunkt(k[0]),
      'O ' + U.nf2.format(o), 'H ' + U.nf2.format(h),
      'L ' + U.nf2.format(t), 'C ' + U.nf2.format(k[1])
    ];
    var txt = teile.join(' · ');
    if (k[2] != null) txt += ' · Vol ' + U.nf0.format(k[2]);
    if (KC().istLaufend(k)) txt += ' · läuft';
    if (sitz === 'vor' || sitz === 'nach') txt += ' · ' + KC().bandText(sitz);
    ro.innerHTML = U.esc(txt) +
      (pct != null ? ' · <span style="color:' + (pct >= 0 ? 'var(--up)' : 'var(--down)') + ';">' +
        U.signTxt(pct, ' %') + '</span>' : '');
  }
  /** Der Tooltip an einer Signal-Marke. Er traegt das Urteil WOERTLICH aus dem
   *  Studienregister - kein Signal wird als Empfehlung gezeichnet. */
  function vwMarkeTipp(ev, i) {
    var tip = document.getElementById('tip');
    if (!tip) return;
    var hier = VW.punkte.filter(function (p) {
      var k = VW.sichtbar.kerzen[i];
      return k && p.t === k[0];
    });
    if (!hier.length) { tip.style.display = 'none'; return; }
    tip.innerHTML = hier.map(function (p) {
      var u = urteilZu((SIGNALE[p.schluessel] || {}).urteil);
      return '<span class="tv">' + U.esc(p.name) + ' · ' + (p.dir === 'call' ? '▲ Kauf' : '▼ Verkauf') + '</span><br>' +
        '<span class="tt">' + U.esc(new Date(p.t).toLocaleString('de-DE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })) +
        ' · ' + U.esc(U.nf2.format(p.preis)) + '</span><br>' +
        '<span class="tt">' + U.esc(u.text) + '</span>';
    }).join('<hr>');
    tip.style.display = 'block';
    tip.style.left = Math.min(window.innerWidth - 260, ev.clientX + 14) + 'px';
    tip.style.top = (ev.clientY + 14) + 'px';
  }
  function vwKreuzAus() {
    VW.kreuz = null;
    VW.ziehen = null;
    var ro = document.getElementById('vwKreuz');
    if (ro) ro.textContent = '';
    var tip = document.getElementById('tip');
    if (tip) tip.style.display = 'none';
    vwZeichnen();
  }

  /* ---- Maus: Rad zoomt, Ziehen blaettert, Doppelklick setzt zurueck ---- */
  function vwRad(ev) {
    var c = document.getElementById('vwChart');
    if (!c || !VW.sichtbar || !VW.skala) return;
    ev.preventDefault();                        // die Seite soll nicht mitscrollen
    var r = c.getBoundingClientRect();
    var anteil = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width));
    vwZoomen(ev.deltaY < 0, anteil);
  }
  function vwZiehenStart(ev) {
    if (!VW.sichtbar) return;
    var c = document.getElementById('vwChart');
    var r = c.getBoundingClientRect();
    VW.ziehen = { x: ev.clientX - r.left, von: VW.sichtbar.fenster.von };
  }
  function vwZiehenBewegen(x) {
    if (!VW.ziehen || !VW.skala) return;
    var dx = x - VW.ziehen.x;
    var kerzen = Math.round(-dx / Math.max(1, VW.skala.dx));
    var s = VW.sichtbar;
    var f = KC().blaettern(s.gesamt, VW.ziehen.von, s.fenster.anzahl, kerzen);
    VW.fensterVon = f.von;
    VW.fensterN = f.anzahl;
    vwZeichnen();
    if (f.von === 0 && kerzen < 0) vwMehrLaden();
  }
  function vwZiehenEnde() { VW.ziehen = null; }

  /* ---- Tastatur: blaettern und zoomen. Sie bleibt, was sie war. ---- */
  function vwTaste(ev) {
    var s = VW.sichtbar;
    if (!s) return;
    var schritt = Math.max(1, Math.round(s.fenster.anzahl / 10));
    if (ev.key === 'ArrowLeft') vwBlaettern(-schritt);
    else if (ev.key === 'ArrowRight') vwBlaettern(schritt);
    else if (ev.key === '+' || ev.key === '=') vwZoomen(true, 0.5);
    else if (ev.key === '-' || ev.key === '_') vwZoomen(false, 0.5);
    else if (ev.key === 'Home') vwZurueck();
    else return;
    ev.preventDefault();
  }

  /* ---- Die Signal-Liste unter dem Chart ----
   * Ohne sie muss man mit der Maus auf winzige Dreiecke zielen; ein Klick auf eine
   * Zeile springt zur Kerze. */
  function vwSignalListe() {
    var el = document.getElementById('vwSigListe');
    var zEl = document.getElementById('vwSigZahl');
    if (zEl) {
      var etwasAn = Object.keys(sigAn).some(function (k) { return sigAn[k]; });
      zEl.textContent = !etwasAn ? ''
        : VW.punkte.length ? VW.punkte.length + ' Signale in der geladenen Reihe'
        : (VW.fest.length < 40 ? 'Nur ' + VW.fest.length + ' Kerzen – die meisten Signale brauchen mehr Vorlauf.'
                               : 'kein Signal in dieser Reihe');
    }
    if (!el) return;
    if (!VW.punkte.length) {
      el.innerHTML = '<div class="empty" style="padding:10px 0;">Keine Signale eingeblendet. Oben in „Einblenden“ Häkchen setzen.</div>';
      return;
    }
    // Neueste zuerst - die interessieren beim Pruefen am meisten
    var mitIndex = VW.punkte.map(function (p, i) { return { p: p, i: i }; })
      .sort(function (a, b) { return b.p.t - a.p.t; }).slice(0, 200);
    el.innerHTML =
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:6px;">' +
        VW.punkte.length + ' Signale · Zeile anklicken, um zur Kerze zu springen' +
        (SIG_FEHLER ? ' · ACHTUNG: ' + SIG_FEHLER + ' Detektor-Abbrüche – die Liste ist unvollständig' : '') +
        (VW.punkte.length > 200 ? ' · die 200 jüngsten' : '') + '</div>' +
      '<div style="max-height:260px; overflow:auto;"><table class="tbl"><thead><tr>' +
        '<th>Zeitpunkt</th><th>Signal</th><th>Richtung</th><th style="text-align:right;">Kurs</th><th>Belegstand laut Studienregister</th>' +
      '</tr></thead><tbody>' +
      mitIndex.map(function (x) {
        var p = x.p;
        var u = urteilZu((SIGNALE[p.schluessel] || {}).urteil);
        return '<tr data-zeile="' + x.i + '" style="cursor:pointer;' +
          (GEWAEHLT === x.i ? ' background:var(--grid);' : '') + '">' +
          '<td>' + U.esc(new Date(p.t).toLocaleString('de-DE', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })) + '</td>' +
          '<td><span style="display:inline-block; width:9px; height:9px; border-radius:var(--r-klein); background:' + p.farbe + '; margin-right:6px;"></span>' + U.esc(p.name) + '</td>' +
          '<td style="color:' + (p.dir === 'call' ? 'var(--up)' : 'var(--down)') + ';">' +
            (p.dir === 'call' ? '▲ Kauf' : '▼ Verkauf') + '</td>' +
          '<td style="text-align:right;">' + U.esc(U.nf2.format(p.preis)) + '</td>' +
          '<td style="color:var(--muted); font-size:var(--fs-klein);">' + U.esc(u.text) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div id="vwSigDetail" class="hinweis" style="margin-top:8px;"></div>';
    el.querySelectorAll('[data-zeile]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var i = parseInt(tr.getAttribute('data-zeile'), 10);
        GEWAEHLT = (GEWAEHLT === i) ? null : i;
        if (GEWAEHLT != null) vwSpringeZu(VW.punkte[GEWAEHLT]);
        else vwZeichnen();
      });
    });
    vwSignalDetail();
  }

  /** Zur Kerze eines Signals springen: das Fenster so legen, dass sie darin liegt. */
  function vwSpringeZu(p) {
    if (!p) return;
    var alle = vwBasis().kerzen;
    var i = -1;
    for (var j = 0; j < alle.length; j++) { if (alle[j][0] === p.t) { i = j; break; } }
    if (i < 0) { vwZeichnen(); return; }
    var n = Math.min(alle.length, VW.fensterN || vwFensterVorgabe());
    VW.fensterVon = Math.max(0, Math.min(alle.length - n, i - Math.round(n / 2)));
    VW.fensterN = n;
    vwZeichnen();
  }

  /** Was das gewaehlte Signal aussagt - und was danach tatsaechlich passiert ist. */
  function vwSignalDetail() {
    var el = document.getElementById('vwSigDetail');
    if (!el) return;
    if (GEWAEHLT == null || !VW.punkte[GEWAEHLT]) { el.innerHTML = ''; return; }
    var p = VW.punkte[GEWAEHLT];
    var bars = vwBasis().kerzen;
    var idx = -1;
    for (var i = 0; i < bars.length; i++) { if (bars[i][0] === p.t) { idx = i; break; } }
    var danach = '';
    if (idx >= 0) {
      // Was danach kam - in Signalrichtung gerechnet, damit "+" immer "richtig gelegen" heisst
      var zeilen = [4, 8, 16, 26].map(function (h) {
        if (idx + h >= bars.length) return null;
        var r = (bars[idx + h][1] / bars[idx][1] - 1) * 100;
        var inRichtung = p.dir === 'call' ? r : -r;
        return '<span style="display:inline-block; min-width:104px;">nach ' + h + ' Kerzen: <b style="color:' +
          (inRichtung >= 0 ? 'var(--up)' : 'var(--down)') + '">' +
          (inRichtung >= 0 ? '+' : '') + inRichtung.toFixed(2) + ' %</b></span>';
      }).filter(Boolean);
      danach = zeilen.length
        ? '<div style="margin-top:6px;"><span style="color:var(--muted);">Was danach kam, in Signalrichtung:</span><br>' + zeilen.join(' ') + '</div>'
        : '<div style="margin-top:6px; color:var(--muted);">Das Signal ist zu jung – die Entwicklung danach liegt noch nicht vor.</div>';
    }
    var u = urteilZu((SIGNALE[p.schluessel] || {}).urteil);
    el.innerHTML =
      '<b>' + U.esc(p.name) + '</b> · ' + U.esc(SIGNAL_ERKLAERT[p.name] || 'Keine Erläuterung hinterlegt.') +
      danach +
      '<div style="margin-top:6px;">Belegstand laut Studienregister: <b>' + U.esc(u.text) + '</b>' +
      (u.quelle ? ' <span style="color:var(--muted);">(' + U.esc(u.quelle) + ')</span>' : '') + '</div>';
  }

  /* ---- Der Kopf des Viewers ---- */
  function vwKopfZeichnen() {
    var e = document.getElementById('vwKopf');
    if (!e || !CUR) return;
    var q = vwQuote() || {};
    var st = vwStamm(CUR.sym);
    var felder = [];
    function feld(name, wert, roh) {
      felder.push('<span class="vwFeld">' + U.esc(name) + ' <b>' + (roh ? wert : U.esc(wert)) + '</b></span>');
    }
    feld('Börse', (CURDATA.meta && CURDATA.meta.fullExchangeName) || CUR.exch || '–');
    if (st && st.sektor) feld('Branche', st.sektor);
    if (q.mkap > 0) feld('Marktkapitalisierung', vwGeld(q.mkap));
    /* Vor- und Nachboerse mit Kennzeichnung: Yahoo fuellt je nach Tageszeit nur
     * eines von beiden. Ohne das Wort daneben waere der Kurs nicht einzuordnen. */
    if (q.vorboerse > 0) feld('Vorbörslich', U.nf2.format(q.vorboerse));
    if (q.nachboerse > 0) feld('Nachbörslich', U.nf2.format(q.nachboerse));
    var tag = vwTagesspanne();
    if (tag) feld('Tagesspanne', U.nf2.format(tag.tief) + ' – ' + U.nf2.format(tag.hoch));
    if (q.hoch52 > 0 && q.kurs > 0) {
      var tief52 = (CURDATA.meta && CURDATA.meta.fiftyTwoWeekLow > 0) ? CURDATA.meta.fiftyTwoWeekLow : null;
      if (tief52 && q.hoch52 > tief52) {
        var anteil = Math.max(0, Math.min(1, (q.kurs - tief52) / (q.hoch52 - tief52)));
        feld('52 Wochen', '<span class="vwBand" title="' + U.esc(U.nf2.format(tief52) + ' bis ' + U.nf2.format(q.hoch52)) +
          '"><i style="left:' + (anteil * 100).toFixed(1) + '%"></i></span>', true);
      }
    }
    var rel = vwRelVolumen(q.volumen);
    if (rel) feld('Umsatz gegen 20-Tage-Median', U.nf2.format(rel.faktor) + '×');
    e.innerHTML = felder.join('');
  }
  function vwGeld(v) {
    if (!(v > 0)) return '–';
    if (v >= 1e12) return U.nf2.format(v / 1e12) + ' Bio. $';
    if (v >= 1e9) return U.nf2.format(v / 1e9) + ' Mrd. $';
    return Math.round(v / 1e6) + ' Mio. $';
  }
  function vwStamm(sym) {
    var MW = window.Marktwerte;
    if (!MW || typeof MW.stammEintrag !== 'function') return null;
    return MW.stammEintrag(sym);
  }
  /* Die Tagesspanne aus den geladenen Kerzen des laufenden Tages - nicht aus einer
   * zweiten Abfrage. Ohne Kerzen von heute steht dort nichts, statt einer Spanne
   * von gestern, die wie heute aussaehe. */
  function vwTagesspanne() {
    var heute = new Date().toISOString().slice(0, 10);
    var hi = -Infinity, lo = Infinity;
    (VW.fest || []).forEach(function (k) {
      if (new Date(k[0]).toISOString().slice(0, 10) !== heute) return;
      var h = k[3] != null ? k[3] : k[1], t = k[4] != null ? k[4] : k[1];
      if (h > hi) hi = h;
      if (t < lo) lo = t;
    });
    return isFinite(hi) && isFinite(lo) ? { hoch: hi, tief: lo } : null;
  }
  function vwRelVolumen(heute) {
    if (!MU2() || !VW.tages || !VW.tages.length) return null;
    var vol = MU2().volumenReihe(VW.tages.slice(0, -1));
    return MU2().relativesVolumen(heute, vol, { fenster: 20, minTage: 20 });
  }

  /* ---- Karte "Im Archiv": welcher Zeitrahmen reicht wie weit zurueck ----
   * Die Zahlen kommen aus derselben Leseauskunft wie die Kerzen; eine zweite Quelle
   * fuer dieselbe Frage waere eine zweite Wahrheit. */
  async function vwArchivKarte() {
    var e = document.getElementById('vwArchiv');
    if (!e || !CUR || !KC()) return;
    if (!window.api || typeof window.api.archivKerzen !== 'function') {
      e.innerHTML = '<div class="loading">Leseauskunft in dieser Fassung nicht vorhanden.</div>';
      return;
    }
    if (vwArchivKarte.fuer === CUR.sym) return;   // je Wert einmal
    vwArchivKarte.fuer = CUR.sym;
    var sym = CUR.sym;
    var zeilen = [];
    for (var i = 0; i < KC().ZEITRAHMEN.length; i++) {
      var zr = KC().ZEITRAHMEN[i];
      /* 1W und 1M fuehrt das Archiv nicht - sie werden aus Tageskerzen GEBILDET.
       * "keine Kerzen" waere hier zwar wahr, aber irrefuehrend: es klingt nach einer
       * Luecke, und in Wahrheit ist es eine Ableitung. */
      if (KC().AUS_TAGESKERZEN[zr]) {
        zeilen.push({ zr: zr, gebildet: true });
        continue;
      }
      var r = null;
      try { r = await window.api.archivKerzen(sym, zr, 20); } catch (e2) { r = null; }
      if (vwArchivKarte.fuer !== sym) return;     // inzwischen anderer Wert
      zeilen.push({ zr: zr, ok: !!(r && r.ok), von: r && r.von, bis: r && r.bis,
                    grund: (r && r.grund) || '', quelle: (r && r.quelle) || '' });
    }
    e.innerHTML = '<dl class="kv">' + zeilen.map(function (z) {
      var wert = z.gebildet
        ? 'aus Tageskerzen gebildet'
        : z.ok
        ? (z.quelle === 'alpaca' ? 'Alpaca' : 'Archiv') + ' bis ' + U.esc(vwZeitpunkt(z.bis))
        : U.esc(z.grund || 'nichts da');
      return '<dt>' + U.esc(z.zr) + '</dt><dd>' + wert + '</dd>';
    }).join('') + '</dl>';
  }

  /* ---- Karte "Termine": der naechste Ergebnistermin ---- */
  async function vwTermine() {
    var e = document.getElementById('vwTermine');
    if (!e || !CUR) return;
    var sym = CUR.sym;
    e.innerHTML = '<div class="loading">–</div>';
    var text = '';
    try {
      var r = window.api && window.api.earningsKalender ? await window.api.earningsKalender(7) : null;
      if (r && r.ok) {
        var eigen = (r.termine || []).filter(function (t) { return t.sym === sym; })[0];
        if (eigen) {
          text = 'Ergebnistermin: <b>' + U.esc(new Date(eigen.zeit).toLocaleDateString('de-DE')) + '</b>' +
            (eigen.art ? ' (' + U.esc(eigen.art) + ')' : '');
        }
      }
      if (!text) {
        /* Ausserhalb des Sieben-Tage-Fensters fragt der Viewer den Wert selbst -
         * derselbe Endpunkt, den das Termin-Archiv der Ergebnis-Drift benutzt. */
        var a = window.api && window.api.earningsFetch ? await window.api.earningsFetch(sym) : null;
        if (sym !== (CUR && CUR.sym)) return;
        if (a && a.ok && a.aktuell && a.aktuell.termin) {
          text = 'Nächster Ergebnistermin: <b>' + U.esc(new Date(a.aktuell.termin).toLocaleDateString('de-DE')) + '</b>';
        } else {
          /* PM-Fund am Viewer-Foto (04.09.2026): ohne Netz stand hier
           * "Kein Ergebnistermin gefunden (Cannot read properties of null (reading
           * 'quoteSummary'))". Das ist die Innenseite eines Abrufs, kein Satz fuer
           * den Leser - und es behauptet ausserdem etwas Falsches: nicht "es gibt
           * keinen Termin", sondern "wir konnten nicht nachsehen". Der Grund geht
           * ins Log, damit er beim Suchen weiter da ist. */
          if (a && a.aktuellGrund) {
            text = 'Termine derzeit nicht abrufbar.';
            console.log('[Explorer] Termine ' + sym + ' nicht abrufbar: ' + a.aktuellGrund);
          } else {
            text = 'Kein Ergebnistermin gefunden.';
          }
        }
      }
    } catch (e3) {
      text = 'Termine derzeit nicht abrufbar.';
      console.log('[Explorer] Termine ' + sym + ' warfen: ' + String(e3 && e3.message || e3));
    }
    if (sym !== (CUR && CUR.sym)) return;
    e.innerHTML = '<div>' + text + '</div>';
  }

  /* ---- Wegweiser zum Belegstand. KEIN Urteil im Viewer.
   * Was ein Protokoll sagt, steht im Studienregister und wird von dort GELESEN -
   * ein fester Satz koennte es nur behaupten, und genau so hat sich im Projekt
   * schon einmal eine ueberholte Formel monatelang weitergetragen (Regel D2). */
  function vwBelegstand() {
    var e = document.getElementById('vwBelegstand');
    if (!e) return;
    var SU = window.StudienUrteile;
    var vt = SU && SU.vorwaertstest ? SU.vorwaertstest('momentum-liquide') : null;
    var belegt = !!(vt && vt.urteil === 'bestaetigt');
    e.innerHTML = 'Signale zu diesem Wert: <b>' +
      (belegt ? 'ein Protokoll sagt bestätigt' : 'kein Protokoll sagt bestätigt') +
      '</b>. Der Viewer bewertet nichts und handelt nichts; den Belegstand aller Regeln zeigt ' +
      '<b>Regeln → Strategien</b>.';
  }

  /* ---- Tagesreihe fuer den Volumen-Median (eigenes Tagesarchiv) ---- */
  async function vwTagesreihe() {
    VW.tages = null;
    if (!window.api || typeof window.api.marktTagesreihen !== 'function' || !CUR) return;
    var sym = CUR.sym;
    try {
      var r = await window.api.marktTagesreihen([sym], 60);
      if (sym !== (CUR && CUR.sym)) return;
      if (r && r.ok && r.reihen && r.reihen[sym]) VW.tages = r.reihen[sym];
    } catch (e) { /* ohne Tagesarchiv bleibt das relative Volumen unbekannt */ }
  }

  /* ---- Verdrahtung, einmal ---- */
  function vwBauen() {
    vwZeitraumBauen();
    vwKerzeBauen();
    vwEinblendenBauen();
    vwZoomBauen();
    vwWahlZeichnen();
    var leiste = document.getElementById('vwLeiste');
    if (leiste && !leiste.__bereit) {
      leiste.__bereit = true;
      leiste.querySelectorAll('input[data-ma]').forEach(function (cb) {
        cb.checked = !!VW.ma[cb.getAttribute('data-ma')];
        cb.addEventListener('change', function () {
          VW.ma[cb.getAttribute('data-ma')] = cb.checked;
          vwMerken();
          vwZeichnen();
        });
      });
      var nr = document.getElementById('vwNurRegulaer');
      if (nr) {
        nr.addEventListener('change', function () {
          VW.nurRegulaer = nr.checked;
          try { window.api.storeSet(VW_STORE, VW.nurRegulaer); } catch (e) { /* ohne Speicher geht es auch */ }
          /* Die Filterung aendert die Reihe, auf der die Signale sitzen - also neu
           * rechnen, sonst zeigen die Marken auf Kerzen, die nicht mehr da sind. */
          vwPunkteRechnen();
          vwZeichnen();
        });
      }
    }
    var mehr = document.getElementById('vwQuelleMehr');
    if (mehr && !mehr.__bereit) {
      mehr.__bereit = true;
      mehr.addEventListener('click', function () {
        var d = document.getElementById('vwQuelleDetail');
        if (!d) return;
        var auf = d.hidden;
        d.hidden = !auf;
        mehr.setAttribute('aria-expanded', auf ? 'true' : 'false');
      });
    }
    var c = document.getElementById('vwChart');
    if (c && !c.__bereit) {
      c.__bereit = true;
      c.addEventListener('mousemove', vwKreuzAn);
      c.addEventListener('mouseleave', vwKreuzAus);
      c.addEventListener('keydown', vwTaste);
      c.addEventListener('wheel', vwRad, { passive: false });
      c.addEventListener('mousedown', vwZiehenStart);
      c.addEventListener('mouseup', vwZiehenEnde);
      c.addEventListener('dblclick', vwZurueck);
      window.addEventListener('resize', function () { if (CUR) vwZeichnen(); });
    }
    if (!VW.takt) {
      /* Nur bei sichtbarem Fenster, Muster marktui.js. Die laufende Kerze ist eine
       * ANZEIGE - schlaeft das Fenster, sieht niemand hin, und der Takt kostet
       * nichts. */
      VW.takt = setInterval(function () {
        if (document.hidden || !CUR) return;
        vwQuoteHolen();
        vwKopfZeichnen();
        vwZeichnen();
        if (Date.now() - VW.letzterLauf >= VW_TAKT_MS * 5) vwLaden();
      }, VW_TAKT_MS);
    }
  }

  /** Was der Viewer sich merkt: Zeitraum, Kerzenlaenge, Schalter, Durchschnitte.
   *  Alles in EINEM Schreibvorgang je Feld - der Store ist die einzige Wahrheit
   *  ueber die zuletzt gewaehlte Ansicht. */
  function vwMerken() {
    if (!window.api || typeof window.api.storeSet !== 'function') return;
    try {
      window.api.storeSet(VW_STORE_ZEITRAUM, VW.zeitraum);
      window.api.storeSet(VW_STORE_KERZE, VW.kerze);
      window.api.storeSet(VW_STORE_SCHALTER, { sig: sigAn, ind: indAn, ma: VW.ma });
    } catch (e) { /* ohne Speicher bleibt es bei der Vorgabe */ }
  }
  /* Der gemerkte Zustand. Vorgaben: regulaere Sitzung an, 1 Jahr in Tageskerzen. */
  (function () {
    if (!window.api || typeof window.api.storeGet !== 'function') return;
    window.api.storeGet(VW_STORE).then(function (v) {
      if (v === false) VW.nurRegulaer = false;
      var nr = document.getElementById('vwNurRegulaer');
      if (nr) nr.checked = VW.nurRegulaer;
    }).catch(function () { /* ohne Speicher bleibt es bei der Vorgabe */ });
    window.api.storeGet(VW_STORE_ZEITRAUM).then(function (v) {
      if (!KC() || KC().ZEITRAEUME.indexOf(v) < 0) return;
      VW.zeitraum = v;
      return window.api.storeGet(VW_STORE_KERZE);
    }).then(function (k) {
      if (!KC()) return;
      /* Eine gemerkte Kerze, die zum gemerkten Zeitraum nicht passt, wird NICHT
       * uebernommen - sonst startet der Viewer in einem Zustand, den seine eigene
       * Ausgrau-Regel verbietet. */
      VW.kerze = KC().kerzeFuer(VW.zeitraum, KC().KERZEN.indexOf(k) >= 0 ? k : null);
      vwWahlZeichnen();
    }).catch(function () { /* ohne Speicher bleibt es bei der Vorgabe */ });
    window.api.storeGet(VW_STORE_SCHALTER).then(function (s) {
      if (!s || typeof s !== 'object') return;
      Object.keys(s.sig || {}).forEach(function (k) { if (SIGNALE[k]) sigAn[k] = !!s.sig[k]; });
      Object.keys(s.ind || {}).forEach(function (k) { if (INDIKATOREN[k]) indAn[k] = !!s.ind[k]; });
      Object.keys(s.ma || {}).forEach(function (k) { if (VW.ma[k] !== undefined) VW.ma[k] = !!s.ma[k]; });
      vwSchalterZeichnen();
    }).catch(function () { /* ohne Speicher bleibt es bei der Vorgabe */ });
  })();
  /** Die Haekchen auf den gemerkten Stand bringen. */
  function vwSchalterZeichnen() {
    var el = document.getElementById('vwEinblenden');
    if (el) {
      el.querySelectorAll('input[data-sig]').forEach(function (cb) { cb.checked = !!sigAn[cb.getAttribute('data-sig')]; });
      el.querySelectorAll('input[data-ind]').forEach(function (cb) { cb.checked = !!indAn[cb.getAttribute('data-ind')]; });
    }
    var l = document.getElementById('vwLeiste');
    if (l) l.querySelectorAll('input[data-ma]').forEach(function (cb) { cb.checked = !!VW.ma[cb.getAttribute('data-ma')]; });
  }

  /* Der Kurs fuer Kopf und laufende Kerze kommt aus DERSELBEN Sammelrunde wie die
   * Marktkarte (window.Marktwerte.quotesHolen). Ein eigener Abruf je geoeffnetem Wert
   * waere eine dritte Runde neben den beiden, die dieser Auftrag gerade zu einer
   * zusammenlegt. Ist der Wert nicht in der Grundmenge der Karte, faehrt die Runde
   * ihn mit - ein Kuerzel mehr in einem Block von 400 kostet keine Anfrage. */
  async function vwQuoteHolen() {
    var MW = window.Marktwerte;
    if (!MW || typeof MW.quotesHolen !== "function" || !CUR) return;
    var sym = CUR.sym;
    try { await MW.quotesHolen([sym]); } catch (e) { return; }
    if (sym !== (CUR && CUR.sym)) return;
    vwKopfZeichnen();
    vwZeichnen();
  }

  /** Alles, was der Viewer beim Oeffnen eines Werts tut. Wird von openDetail
   *  aufgerufen; die Reihenfolge ist Absicht: erst zeichnen, was ohne Netz geht. */
  function vwOeffnen() {
    vwBauen();
    vwSchalterZeichnen();
    vwArchivKarte.fuer = null;
    VW.fensterVon = null;
    VW.fensterN = vwFensterVorgabe();
    VW.nachgeladen = '';
    VW.punkte = [];
    GEWAEHLT = null;
    VW.tages = null;
    vwBelegstand();
    vwKopfZeichnen();
    vwLaden();
    vwQuoteHolen();
    vwTagesreihe().then(vwKopfZeichnen);
    vwTermine();
  }
  /* Nur fuer Proben und die Selbstpruefung - kein Bedienweg. */
  window.__viewer = VW;
  window.__viewerLaden = vwLaden;

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
