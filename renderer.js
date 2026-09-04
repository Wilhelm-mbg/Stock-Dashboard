'use strict';
(function () {
  /* ================= Konfiguration ================= */
  /* Zehn Kacheln statt sechs (Reiter Markt, Stufe 5, 04.09.2026). Dazugekommen sind
   * Dow, Gold, Öl und der Dollar-Index: ein Marktueberblick, der nur Aktien und
   * Bitcoin zeigt, laesst genau die vier Zeilen weg, an denen man einen Tag als
   * Rohstoff- oder Waehrungstag erkennt. Alle vier sind Yahoo-Kuerzel derselben
   * Quelle, kosten also keinen neuen Weg nach draussen.
   * Die Reihenfolge ist die Lesereihenfolge: erst die drei US-Indizes, dann DAX und
   * Halbleiter, dann Volatilitaet, dann Rohstoffe und Waehrung, Bitcoin zuletzt. */
  var INDICES = [
    { y: '^GSPC',  id: 'spx',  name: 'S&P 500',            dec: 2 },
    { y: '^IXIC',  id: 'ixic', name: 'Nasdaq Composite',   dec: 2 },
    { y: '^DJI',   id: 'dji',  name: 'Dow Jones',          dec: 2 },
    { y: '^GDAXI', id: 'dax',  name: 'DAX',                dec: 2 },
    { y: '^SOX',   id: 'sox',  name: 'PHLX Semiconductor', dec: 2 },
    { y: '^VIX',   id: 'vix',  name: 'VIX (Volatilität)',  dec: 2 },
    { y: 'GC=F',   id: 'gold', name: 'Gold (Future)', unit: '$', dec: 2 },
    { y: 'CL=F',   id: 'oel',  name: 'Öl WTI (Future)', unit: '$', dec: 2 },
    { y: 'DX-Y.NYB', id: 'dxy', name: 'Dollar-Index',     dec: 2 },
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
  var NEWS_MAX = 5;      // hoechstens fuenf Schlagzeilen im Kasten (Stufe 5)
  var NEWS_FEEDS = [
    'https://news.google.com/rss/search?q=Aktien%20B%C3%B6rse%20Tech%20when%3A2d&hl=de&gl=DE&ceid=DE:de',
    'https://news.google.com/rss/search?q=Halbleiter%20OR%20Nvidia%20OR%20Chips%20Aktien%20when%3A2d&hl=de&gl=DE&ceid=DE:de'
  ];

  var Q = {};        // Yahoo-Symbol -> Quote {price, pct, series, lo52, hi52}
  var NEWS = [];
  /* Alle geholten Schlagzeilen, nicht nur die fuenf des Kastens. Das Laufband zeigt
   * daraus die AELTEREN - so steht keine Meldung zweimal auf dem Reiter (QS-F4). */
  var NEWS_ALLE = [];
  var lastOk = null; // Date des letzten erfolgreichen Updates
  var fetchErrors = 0;

  var nfP = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var nf0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
  function fmt(v, dec) { return dec === 0 ? nf0.format(v) : nfP.format(v); }
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
  /* Nimmt die fertig zerlegten Balken des Laders und macht daraus, was die Kachel
   * braucht: Kurs, Tagesveraenderung, Verlaufslinie, 52-Wochen-Spanne. Das Zerlegen
   * selbst steht in kurse.js - hier bleibt nur, was NUR die Kachel angeht. */
  function ausKursdaten(kd) {
    var meta = kd.meta || {};
    var series = window.Kurse.reihe(kd.bars);
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
    /* ROH: Die Kachel zeigt den Kurs, der gerade an der Boerse steht. Die 429-
     * Wiederholung macht jetzt der Lader fuer alle Aufrufer, nicht nur fuer diesen. */
    var kd = null;
    try { kd = await window.Kurse.hole(sym, { range: '1mo', interval: '1d', bereinigt: false, warteMs: 20000 }); }
    catch (e) { return null; }
    if (!kd) return null;
    try { return ausKursdaten(kd); } catch (e) { return null; }
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
    // ROH und MIT Vor-/Nachboerse: gefragt ist der ausserboerslich gestellte Kurs.
    var kd = null;
    try { kd = await window.Kurse.hole(sym, { range: '1d', interval: '5m', prePost: true, bereinigt: false }); }
    catch (e) { return null; }
    if (!kd || !kd.bars.length) return null;
    var kurs = kd.bars[kd.bars.length - 1][1];
    /* DIE BASIS IST regularMarketPrice - in BEIDEN Phasen.
     *
     * Vorher stand hier vorboerslich chartPreviousClose. Das ist falsch, und zwar
     * um genau eine Sitzung. Nachgemessen am 25.08.2026 um 10:27 UTC, mitten in der
     * Vorboerse, an sechs Werten - AMD, NVDA, AAPL, MSFT, TSLA, INTC. Bei allen
     * sechs dasselbe Bild:
     *
     *   AMD  letzter Schluss (24.08.)  456,75
     *        regularMarketPrice        456,745   <- stimmt
     *        chartPreviousClose        473,25    <- der Schluss vom 21.08.
     *
     *   Vorboersenkurs 470,76 ergab damit -0,53 % statt +3,07 %. Nicht nur die
     *   Zahl war falsch, das VORZEICHEN war es. Genau so gemeldet in Issue #74.
     *
     * Der Grund: Bei range=1d waehrend der Vorboerse ist der Bezugspunkt des
     * Charts die letzte ABGESCHLOSSENE Sitzung. "Previous close" heisst dann der
     * Schluss DAVOR. regularMarketPrice dagegen ist immer der letzte regulaere
     * Kurs - vorboerslich also der Schluss von gestern, nachboerslich der von
     * heute. Beides ist genau die Basis, gegen die gerechnet werden soll.
     *
     * Gilt nur AUSSERHALB der Sitzung. Waehrend des Handels waere
     * regularMarketPrice der laufende Kurs und der Vergleich sinnlos - deshalb
     * wird diese Funktion nur bei gesetzter Phase gerufen. */
    var basis = kd.meta.regularMarketPrice ||
      kd.meta.chartPreviousClose || kd.meta.previousClose;
    if (!basis) return null;
    return { kurs: kurs, pct: (kurs / basis - 1) * 100, phase: phase };
  }

  /** Kurzform des ausserboerslichen Kurses fuer die engen Stellen (Marktbild,
   *  Gewinner/Verlierer). Gibt leeren Text zurueck, wenn gerade regulaer
   *  gehandelt wird oder kein Kurs vorliegt - dann steht dort einfach nichts. */
  function ppKurz(q) {
    if (!q || !q.pp || !q.pp.kurs) return '';
    var wort = q.pp.phase === 'vorboerslich' ? 'vorb.' : 'nachb.';
    var cls = q.pp.pct > 0.001 ? 'up' : (q.pp.pct < -0.001 ? 'down' : 'flat');
    return '<span class="ppk ' + cls + '" title="' + (q.pp.phase === 'vorboerslich' ? 'Vorbörslicher' : 'Nachbörslicher') +
      ' Handel: ' + nfP.format(q.pp.kurs) + ' $ – dünner Umsatz, Kurse können springen">' + wort + ' ' +
      (q.pp.pct > 0 ? '+' : '') + nfP.format(q.pp.pct) + '&nbsp;%</span>';
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
    /* Das Band aktuell halten: jede Kursrunde stoesst an, die Drossel in
     * refreshNews() entscheidet (hoechstens alle fuenf Minuten). Bewusst OHNE await -
     * die Kurse sollen nicht auf zwei RSS-Feeds warten. */
    refreshNews().catch(function () { /* ein gescheiterter Feed haelt die Kurse nicht auf */ });
  }

  /* WIE OFT DARF DAS BAND NACHLADEN? (Wilhelm 04.09.2026: "Laufband aktuell halten")
   * Bis heute: alle 30 Minuten, also 2 Runden je Stunde zu je zwei Feeds = 4 Anfragen.
   * Ein Ticker, der eine halbe Stunde alt sein darf, ist keiner.
   * Die Kursrunde laeuft waehrend der Sitzung jede Minute; sie einfach mitzunehmen
   * hiesse 120 Anfragen je Stunde an einen oeffentlichen Google-News-Feed - das ist
   * keine Hoeflichkeit mehr, und die Quelle gibt es auch gar nicht her: ihr Inhalt
   * wird oben zwischengespeichert und aendert sich nicht im Minutentakt.
   * Gewaehlt: die Kursrunde STOESST AN, eine Drossel von fuenf Minuten entscheidet.
   * Damit hoechstens 12 Runden = 24 Anfragen je Stunde, und zwar nur, solange die
   * App laeuft und Kurse holt. Der 30-Minuten-Zeitgeber bleibt als Netz fuer den
   * Fall, dass die Kursrunde selbst haengt. */
  var NEWS_MIN_MS = 5 * 60000;
  var newsZuletzt = 0;
  var newsLaeuft = false;

  async function refreshNews() {
    if (newsLaeuft) return;
    if (Date.now() - newsZuletzt < NEWS_MIN_MS) return;
    newsZuletzt = Date.now();   // auch bei Fehlschlag: sonst haemmert die Drossel ins Leere
    newsLaeuft = true;
    try { await newsRunde(); } finally { newsLaeuft = false; }
  }

  async function newsRunde() {
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
    /* Duplikate raus, neueste zuerst, HOECHSTENS FUENF.
     * Fuenf statt sechs seit dem Reiter Markt (Stufe 5, 04.09.2026): der Kasten
     * steht dort unter Sektoren, Hotlists und Terminen, und Schlagzeilen sind das
     * einzige auf diesem Reiter, an dem nichts gerechnet ist. Eine Zeile weniger
     * ist die ehrlichere Gewichtung. Bewertet oder sortiert wird nichts - es gibt
     * kein Sentiment auf diesem Reiter: die einzige Messung dazu (31.08.2026)
     * konnte die Frage nicht beantworten, und das Gewicht steht seither auf null. */
    var seen = {};
    items = items.filter(function (it) { var k = it.title.toLowerCase().slice(0, 60); if (seen[k]) return false; seen[k] = 1; return true; });
    items.sort(function (a, b) { return b.t - a.t; });
    if (items.length) {
      NEWS_ALLE = items.slice(0, 25);
      NEWS = items.slice(0, NEWS_MAX);
      renderNews();
      /* Den Stand merken - dasselbe Muster wie beim Vorboersen-Stand und beim
       * Marktueberblick. Ohne ihn steht nach jedem Start eine halbe Minute lang
       * "News derzeit nicht erreichbar" da, und ohne Netz gar nichts. Der Stand ist
       * nicht "aktuell" und behauptet es auch nicht: jede Meldung traegt ihr Alter. */
      try { window.api.storeSet('newsStand', { zeit: Date.now(), items: NEWS_ALLE }); }
      catch (e) { /* ohne Speicher laeuft alles weiter, nur der naechste Start ist leer */ }
    }
    else if (!NEWS.length) {
      // Das Element heißt #news – unter der alten ID #newsList erschien die Meldung nie.
      var nl = document.getElementById('news');
      if (nl) nl.innerHTML = '<div class="loading">News derzeit nicht erreichbar – nächster Versuch in 30 Minuten.</div>';
    }
  }

  /* Der Sitzungszustand in Worten - dieselbe Rechnung wie auf dem Reiter Markt
   * (markt/uebersicht.js, vier Zustaende). Gibt null zurueck, wenn eines der zwei
   * Fachmodule fehlt; dann bleibt es bei offen/zu. */
  function sitzungJetzt() {
    if (!window.MarktUebersicht || !window.Quant) return null;
    var jetzt = Date.now();
    var laenge = window.Boerse ? window.Boerse.sitzungsMinuten(jetzt) : 390;
    return window.MarktUebersicht.sitzungszustand(window.Quant.minutenSeitOeffnung(jetzt), laenge);
  }

  /* ---- Die Hinweis-Kette an #err ----
   * Ein Platz, mehrere Absender. Vorher schrieben zwei Stellen mit textContent
   * hinein und loeschten einander: wer zuletzt kam, gewann, und die andere Meldung
   * war weg, ohne dass ihr Zustand sich geaendert haette. */
  var HINWEISE = {};
  function hinweisSetzen(name, text) {
    if (text) HINWEISE[name] = String(text); else delete HINWEISE[name];
    var e = document.getElementById('err');
    if (!e) return;
    var namen = Object.keys(HINWEISE);
    e.innerHTML = namen.map(function (n) {
      return '<div data-hinweis="' + U.esc(n) + '">' + U.esc(HINWEISE[n]) + '</div>';
    }).join('');
  }
  /* Die Stillstandsbremse des Sammlers (sammelrunde.js) meldet sich hier. Sie sagt
   * es EINMAL je Stillstand, nicht bei jedem Blick - der Funkspruch traegt seine
   * eigene Bremse mit. Der Start-Hinweis wird bewusst NICHT gezeigt: ein Lauf, der
   * anfaengt, ist kein Fehler, und die Kopfzeile ist kein Protokoll. */
  if (window.api && typeof window.api.onSammlerHinweis === 'function') {
    window.api.onSammlerHinweis(function (d) {
      if (!d || d.art !== 'stillstand') return;
      hinweisSetzen('sammler', 'Kursarchiv ' + (d.intervall || '') + ': ' + (d.grund || 'Stillstand'));
    });
  }

  /* ================= Markt offen? ================= */
  function usMarketOpen() {
    var jetzt = Date.now();
    /* Feiertage UND Halbtage kommen jetzt aus boerse.js. Vorher galt jeder Wochentag
     * als voller Handelstag von 390 Minuten: An Feiertagen lief der Scanner ins Leere
     * (harmlos, barsFrisch faengt es ab), an Halbtagen aber galt die Boerse noch drei
     * Stunden nach dem Schluss als offen - und daran haengen Glattstellung,
     * Einstiegssperre und die Anzeige. */
    var laenge = window.Boerse ? window.Boerse.sitzungsMinuten(jetzt) : 390;
    if (!laenge) return false;
    // Sommer-/winterzeitfest über die Rechen-Engine. Vorher galt die Vereinigung beider
    // Fenster – im Winter lief der Scanner damit eine Stunde im Premarket auf stalen Kursen.
    var m = window.Quant.minutenSeitOeffnung(jetzt);
    return m >= 0 && m < laenge;
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
    /* Beide Zweige gehen ueber U.kachel (03.09.2026). Sie standen hier als
       Handarbeit, seit es die Hilfe gibt - die Klinke in test-v6 nannte damals nur
       drei Dateien beim Namen und sah diese nicht.
       Die Sparkline haengt an opt.extra: sie steht im .tile, aber weder in .val noch
       in .kachel-sub. Die Zusatzzeile heisst kachel-sub und NICHT sub - .sub ist die
       Klasse der Reiter-Unterseiten, deren Regel .sub{display:none} die Tagesbewegung
       auf allen sechs Kacheln unsichtbar gemacht hat: der Wert wurde gerechnet und
       dann verdeckt. U.kachel setzt kachel-sub, das bleibt also so. */
    var tiles = INDICES.map(function (ix) {
      var q = Q[ix.y];
      if (!q) return U.kachel(U.esc(ix.name), '–');
      return U.kachel(U.esc(ix.name),
        fmt(q.price, ix.dec) + (ix.unit ? '&thinsp;' + ix.unit : ''),
        { sub: pctChip(q.pct), extra: sparkSVG(q.series, 160, 34, ix.id) });
    }).join('');
    setzeInhalt('tiles', tiles);

    /* Struktur-Audit Punkt 10: die Spalten "Gewinner & Verlierer" sind mit dem
     * Marktbild zusammengelegt - dieselben 15 Werte standen dreimal untereinander.
     * Die Heatmap uebernimmt beides: sie sortiert signiert (staerkster Gewinner
     * zuerst, staerkster Verlierer zuletzt) und traegt Kurs, Prozent und
     * ausserboerslichen Kurs (#68/#74) auf jeder Kachel. */
    var withQ = STOCKS.filter(function (s) { return Q[s.y] && Q[s.y].pct !== null; });

    /* Marktbild-Heatmap: eine Kachel je Wert, vom staerksten Gewinner zum staerksten
     * Verlierer (seit Punkt 10 des Struktur-Audits ersetzt sie auch die frueheren
     * Gewinner/Verlierer-Spalten). Farbe nur über
     * CSS-Variablen (theme-fest): 3 % Tagesbewegung = volle Beimischung.
     * Die Beimischung ist seit Issue #74 auf 30 % gedeckelt statt auf 45: Darüber
     * fällt der Kontrast der Nebenzeile unter die Lesbarkeitsschwelle. Der Deckel
     * ist nicht geschätzt — Abschnitt 41 rechnet ihn aus den Farbwerten nach und
     * wird rot, sobald er zu hoch steht. Die Kachel bleibt farbig genug, um die
     * Richtung auf einen Blick zu zeigen. */
    var heatEl = document.getElementById('dashHeat');
    if (heatEl) {
      if (!withQ.length) {
        heatEl.innerHTML = '<div class="loading">Noch keine Kurse geladen.</div>';
      } else {
        var heatList = withQ.slice().sort(function (a, b) { return Q[b.y].pct - Q[a.y].pct; });
        heatEl.innerHTML = heatList.map(function (s) {
          var pct = Q[s.y].pct;
          var bg = 'var(--surface)';
          if (Math.abs(pct) >= 0.05) {
            var n = Math.round(Math.min(30, Math.abs(pct) / 3 * 30));
            bg = 'color-mix(in srgb, var(' + (pct > 0 ? '--up' : '--down') + ') ' + n + '%, var(--surface))';
          }
          var sign = pct > 0 ? '+' : '';
          /* Der ausserboersliche Kurs steht als eigene Zeile darunter, nicht statt der
           * Tagesbewegung: beide Zahlen beantworten verschiedene Fragen. */
          var ppq = Q[s.y], ppT = ppq && ppq.pp && ppq.pp.kurs
            ? ' · ' + (ppq.pp.phase === 'vorboerslich' ? 'vorbörslich' : 'nachbörslich') + ' ' +
              nfP.format(ppq.pp.kurs) + ' $ (' + (ppq.pp.pct > 0 ? '+' : '') + nfP.format(ppq.pp.pct) + ' %)'
            : '';
          /* Der Kurs gehoert auf die Kachel, nicht nur in den Tooltip (Issue #74:
           * "Das Marktbild braucht auch Kurse, nicht nur Prozente."). Ohne Kurs
           * bleibt die Zeile weg statt einen Platzhalter zu zeigen. */
          var kursT = Q[s.y] && Q[s.y].price != null
            ? '<span class="k">' + nfP.format(Q[s.y].price) + '&nbsp;$</span>' : '';
          return '<div class="hz" data-heat="' + U.esc(s.y) + '" title="' + U.esc(s.name + ' ' + sign + nfP.format(pct) + ' %' + ppT) + '" style="background:' + bg + '">' +
            '<span class="s">' + U.esc(s.y) + '</span>' + kursT +
            '<span class="p">' + sign + nfP.format(pct) + '&nbsp;%</span>' +
            ppKurz(Q[s.y]) + '</div>';
        }).join('');
      }
    }

    // Karten
    function card(s) {
      var q = Q[s.y];
      if (!q) return '<div class="card"><div class="top"><span class="sym">' + U.esc(s.y) + '</span><span class="nm">' + U.esc(s.name) + '</span></div><div class="prc-row"><span class="prc">–</span></div></div>';
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
      return '<div class="card" data-sym="' + U.esc(s.y) + '">' +
        '<div class="top"><span class="sym">' + U.esc(s.y) + '</span><span class="nm">' + U.esc(s.name) + '</span></div>' +
        '<div class="prc-row"><span class="prc">' + nfP.format(q.price) + '&thinsp;$</span>' + pctChip(q.pct) + '</div>' +
        ppHtml +
        sparkSVG(q.series, 240, 44, s.y) +
        '<div class="meta"><span>MKap <b>' + cap + '</b></span><span>KGV <b>' + pe + '</b></span></div>' +
        rangeHtml +
        '</div>';
    }
    setzeInhalt('bigtech', STOCKS.filter(function (s) { return s.group === 'bigtech'; }).map(card).join(''));
    setzeInhalt('chips', STOCKS.filter(function (s) { return s.group === 'chips'; }).map(card).join(''));

    /* Statuszeile. EIN ZUSTAND, DREI ORTE (QS-Fund F2, 04.09.2026): Kopfzeile,
     * Cockpit und der Reiter Markt sagen seither dasselbe Wort, weil sie dieselbe
     * Funktion fragen. usMarketOpen() bleibt fuer die HANDELSLOGIK (Glattstellung,
     * Einstiegssperre) - nur die Anzeige zieht um. */
    var open = usMarketOpen();
    var z = sitzungJetzt();
    var stampTxt = z ? z.kurz : (open ? 'US-Börse geöffnet' : 'US-Börse geschlossen');
    if (lastOk) {
      stampTxt += ' · Stand: ' + lastOk.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' Uhr';
    }
    document.getElementById('stamp').innerHTML = '<span class="dot ' + (open ? 'open' : 'closed') + '"></span>' + U.esc(stampTxt);
    // Cockpit-Marktstatus – die übrigen Cockpit-Felder füllt depot.js
    var ckM = document.getElementById('ckMarkt');
    if (ckM) ckM.innerHTML = '<span class="mdot ' + (open ? 'open' : 'closed') + '"></span>' +
      U.esc(z ? z.kurz : (open ? 'offen' : 'geschlossen'));
    hinweisSetzen('kurse', fetchErrors > 0 ? '' + fetchErrors + ' Wert(e) konnten nicht geladen werden' : '');
    /* Das Warnband ist fuer genau solche Zustaende gebaut und auf JEDEM Reiter sichtbar -
     * bei gestoerter Kursquelle blieb es trotzdem stumm, und die Meldung stand nur klein
     * in der Kopfzeile. Schwelle: mehr als die Haelfte gescheitert. Bei einzelnen
     * Ausfaellen bleibt es aus, sonst steht dort staendig etwas und niemand liest es mehr. */
    var gesamt = INDICES.length + STOCKS.length;
    quellenWarnung((fetchErrors > gesamt / 2)
      ? 'Die Kursquelle ist gestört: ' + fetchErrors + ' von ' + gesamt +
        ' Werten kamen nicht durch. Angezeigte Kurse können veraltet sein.'
      : null);
    document.dispatchEvent(new CustomEvent('quotes-updated'));
  }

  /* Das Warnband wohnt in depot.js - und das ist das 21. Skript, dieses hier das 3.
   * Beim ERSTEN Kursdurchlauf gibt es window.__warnband also noch nicht. Statt die
   * Meldung dann zu verlieren, wird sie gemerkt und nachgezogen, sobald es da ist. */
  var quellenStand = null;
  function quellenWarnung(text) {
    quellenStand = text;
    if (typeof window.__warnband === 'function') window.__warnband('kursquelle', text);
  }
  window.addEventListener('load', function () {
    if (quellenStand !== null && typeof window.__warnband === 'function') {
      window.__warnband('kursquelle', quellenStand);
    }
    defekteMelden();
  });

  /* Unlesbare Dateien beim Start ansagen. Der Hauptprozess legt sie beiseite, statt sie
   * dem naechsten Schreiben zu ueberlassen - aber ein Datenverlust, den niemand bemerkt,
   * ist der teuerste. Also einmal deutlich ins Warnband, mit dem Ort der Reste. */
  function defektName(w) {
    var m = /^bars_(\w+)_(.+)$/.exec(w);
    if (m) return 'Kursarchiv ' + m[2].replace(/_/g, '.') + ' (' + m[1] + ')';
    return { depot: 'Depot', settings: 'Einstellungen', fehlermeldungen: 'Fehlermeldungen',
             diagnose: 'Diagnose', theme: 'Farbthema' }[w] || w;
  }
  async function defekteMelden() {
    if (!window.api || typeof window.api.storeDefekte !== 'function') return;
    var r = null;
    try { r = await window.api.storeDefekte(); } catch (e) { return; }
    if (!r || !r.ok || !r.liste || !r.liste.length) return;
    var namen = r.liste.slice(0, 6).map(function (d) { return defektName(d.was); });
    var rest = r.liste.length - namen.length;
    var wo = r.liste[0].datei ? ' Die Reste liegen unter <code>' + U.esc(r.liste[0].datei) + '</code>.' : '';
    if (typeof window.__warnband === 'function') {
      window.__warnband('defekt', '<b>' + r.liste.length + ' gespeicherte Datei(en) waren unlesbar</b> – ' +
        U.esc(namen.join(', ')) + (rest > 0 ? ' und ' + rest + ' weitere' : '') +
        '. Sie wurden beiseitegelegt statt überschrieben, der Bestand beginnt dort neu.' + wo);
    }
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
      return '<div class="news-item"><div class="t"><a href="' + U.esc(safeUrl(n.url)) + '" target="_blank" rel="noopener">' + U.esc(n.title) + '</a></div>' +
        '<div class="src">' + U.esc(n.source) + (when ? '<br>' + U.esc(when) : '') + '</div></div>';
    }).join('') || '<div class="loading">Keine News gefunden.</div>');
    renderTicker();
  }

  /* ================= Spekulations-Radar =================
   * Eine geplante Claude-Aufgabe durchsucht stuendlich oeffentliche Quellen nach
   * Marktspekulationen (Uebernahmegeruechte, Beteiligungen, Squeeze-Kandidaten)
   * und schreibt sie als spekulationen.json in den Daten-Ordner. Diese Karte ZEIGT
   * sie nur - ungemessen, reine Beobachtung, gehandelt wird davon nichts.
   * Alles hier ist Fremdinhalt aus dem Web: konsequent U.esc() und safeUrl(),
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
  /* Die Karte kappte These und Begründung hart auf 240 Zeichen, ohne ein Zeichen dafür.
     Der Text endete dann mitten im Satz ("… veröffentlicht, der MPS", "Was danach kam"),
     und der Leser konnte nicht unterscheiden, ob die Quelle so schlecht war oder die
     Anzeige abgeschnitten hat. Gekappt wird deshalb an der Wortgrenze und sichtbar;
     was unter die Grenze passt, bleibt unverändert - ein Auslassungszeichen darf nur
     dort stehen, wo wirklich etwas fehlt. */
  function kappe(t, n) {
    var s = String(t == null ? '' : t).trim();
    if (s.length <= n) return s;
    var k = s.slice(0, n);
    var sp = k.lastIndexOf(' ');
    return (sp > n / 2 ? k.slice(0, sp) : k).replace(/[,;:\-–]$/, '') + ' …';
  }
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
  /* Leerzustand ist nicht Fehlerzustand. Vorher stand hier bei einem GESCHEITERTEN
   * Ladeversuch weiter "wird gleich aus der Gemeinschafts-Ablage geladen" - die Karte
   * versprach also dauerhaft etwas, das nicht mehr kommt. Wer das liest, wartet. */
  function ablageNichtDa(el, was) {
    if (!el) return;
    el.innerHTML = '<div class="loading">' + U.esc(was) + ' derzeit nicht erreichbar – ' +
      'die Gemeinschafts-Ablage antwortet nicht. Der nächste Versuch läuft automatisch.</div>';
  }

  async function ladeSpekulationen() {
    var el = document.getElementById('spekRadar');
    if (!el || !window.api || !window.api.readSpekulationen) return;
    try {
      var r = await window.api.readSpekulationen();
      if (!r || !r.ok) { ablageNichtDa(el, 'Spekulations-Radar'); return; }
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
          name: typeof e.name === 'string' ? kappe(e.name.replace(/[\s,]+(S\.p\.A\.|AG|Inc\.?|Corp\.?|Corporation|plc|PLC|Ltd\.?|SE|N\.V\.|S\.A\.|Co\.)$/, ''), 40) : '',
          art: SPEK_ART[e.art] || 'Gerücht',
          chance: RANG[e.chance] != null ? e.chance : 'niedrig',
          these: kappe(e.these, 240),
          kurz: spekKurz(e.these),
          begruendung: typeof e.begruendung === 'string' ? kappe(e.begruendung, 240) : '',
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
        return '<div class="spek-zeile gestapelt">' +
          '<span class="sym" data-heat="' + U.esc(z.sym) + '" title="Im Explorer öffnen">' + U.esc(z.sym) +
          (z.name ? ' <span class="firma">' + U.esc(z.name) + '</span>' : '') + '</span>' +
          '<span class="spek-chip ' + z.chance + '">' + z.chance.toUpperCase() + '</span>' +
          '<span class="spek-chip mittel" style="border-style:dashed;">' + U.esc(z.art) + '</span>' +
          '<span class="these" title="' + U.esc(z.these) + '">' + U.esc(z.kurz) + (z.begruendung ? ' <span class="beg">– ' + U.esc(z.begruendung) + '</span>' : '') + '</span>' +
          (z.quellen.length ? '<span class="quellen">' + z.quellen.map(function (q, qi) {
            return '<a href="' + U.esc(safeUrl(q.url)) + '" target="_blank" rel="noopener">' +
              U.esc(typeof q.titel === 'string' && q.titel ? q.titel.slice(0, 60) : 'Quelle ' + (qi + 1)) + '</a>';
          }).join(' · ') + '</span>' : '') +
          '</div>';
      }).join('') +
        '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:8px;">Stand ' +
        new Date(r.mtime).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr' +
        ' · ' + quelleText(r) +
        (alt ? ' – <b>veraltet</b>, die Suche hat seit über 20 Stunden nicht geschrieben' : '') +
        '</div>' +
        '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:2px;">' +
        'Sucht dreimal täglich vor US-Eröffnung (ca. 6:45, 12:45, 14:45 Uhr). ' +
        'Die Chance-Einstufung ist eine redaktionelle Einschätzung der Suche, keine Messung.</div>';
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
   * Fremdinhalt aus dem Netz: konsequent U.esc() und safeUrl(), feste Kappen, und eine
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
      if (!r || !r.ok) { ablageNichtDa(el, 'Insider-Käufe'); return; }
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
          name: typeof e.name === 'string' ? kappe(e.name, 40) : '',
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
          ? U.esc(z.wer[0].person) + (z.wer[0].rolle ? ' <span class="beg">(' + U.esc(kappe(z.wer[0].rolle, 40)) + ')</span>' : '') +
            (z.anzahl > 1 ? ' <span class="beg">und ' + (z.anzahl - 1) + ' weitere' + (z.anzahl === 2 ? 'r' : '') + '</span>' : '')
          : '<span class="beg">Meldende Person nicht lesbar</span>';
        var detail = (z.stueck > 0 && z.kurs > 0)
          ? ' – ' + nf0.format(z.stueck) + ' Stück zu ' + fmt(z.kurs, 2) + ' $'
          : '';
        return '<div class="spek-zeile gestapelt">' +
          '<span class="sym" data-heat="' + U.esc(z.sym) + '" title="Im Explorer öffnen">' + U.esc(z.sym) +
          (z.name ? ' <span class="firma">' + U.esc(z.name) + '</span>' : '') + '</span>' +
          '<span class="spek-chip kauf">' + U.esc(geldKurz(z.wert)) + '</span>' +
          (z.anzahl > 1 ? '<span class="spek-chip cluster">' + z.anzahl + ' INSIDER</span>' : '') +
          (z.imUniversum ? '<span class="spek-chip univ">im Universum</span>' : '') +
          '<span class="these">' + kopf + detail +
          ' <span class="beg">· gemeldet ' + new Date(z.zeit).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + '</span></span>' +
          (z.quellen.length ? '<span class="quellen">' + z.quellen.map(function (q, qi) {
            return '<a href="' + U.esc(safeUrl(q.url)) + '" target="_blank" rel="noopener">' +
              U.esc(typeof q.titel === 'string' && q.titel ? q.titel.slice(0, 60) : 'Quelle ' + (qi + 1)) + '</a>';
          }).join(' · ') + '</span>' : '') +
          '</div>';
      }).join('') +
        '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:8px;">Stand ' +
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
          /* holeRoh statt hole: vormarktAusChart schneidet das vorboersliche Fenster
             selbst aus den currentTradingPeriod-Grenzen - ein Sonderfall mit eigenem
             geprueften Vertrag. Ueber den Lader laeuft trotzdem der URL-Bau und die
             429-Behandlung, die dieser Weg vorher gar nicht hatte. */
          var rohText = await window.Kurse.holeRoh(k.sym, { range: '1d', interval: '5m', prePost: true });
          if (!rohText) continue;
          var v = window.Vormarkt.vormarktAusChart(rohText);
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
      '<span style="color:var(--muted); font-size:var(--fs-neben);">' +
      (phase === 'vorboerslich'
        ? 'Vorbörse läuft – die Karte sieht alle 10 Minuten von selbst nach.'
        : 'Ausserhalb der US-Vorbörse (10:00–15:30 unserer Zeit) gibt es keine Vorbörsen-Kerzen.') +
      '</span></div>';
    var rumpf;
    if (hinweis) {
      rumpf = '<div class="loading">' + U.esc(hinweis) + '</div>';
    } else if (!vormarktStand) {
      rumpf = '<div class="loading">Noch nicht gesucht.</div>';
    } else if (!vormarktStand.zeilen.length) {
      rumpf = '<div class="loading">Kein Wert über der Schwelle – ' + nf0.format(vormarktStand.geprueft) +
        ' Werte nachgesehen, Stand ' +
        new Date(vormarktStand.zeit).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr.</div>';
    } else {
      rumpf = vormarktStand.zeilen.map(function (z) {
        return '<div class="spek-zeile">' +
          '<span class="sym" data-heat="' + U.esc(z.sym) + '" title="Im Explorer öffnen">' + U.esc(z.sym) +
          (z.name ? ' <span class="firma">' + U.esc(z.name) + '</span>' : '') + '</span>' +
          '<span class="spek-chip kauf">+' + fmt(z.luecke, 2) + ' %</span>' +
          '<span class="these">' + fmt(z.kurs, 2) + ' $ vorbörslich' +
          ' <span class="beg">· in ' + nf0.format(z.kerzen) + ' von 66 Vorbörsen-Kerzen gehandelt' +
          (z.vol > 0 ? ', ' + nf0.format(Math.round(z.vol)) + ' Stück' : '') + '</span></span>' +
          '</div>';
      }).join('');
    }
    var fuss = '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:8px;">' +
      (vormarktStand ? 'Stand ' + new Date(vormarktStand.zeit).toLocaleString('de-DE',
        { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + ' Uhr · ' : '') +
      'Schwellen: Lücke über ' + window.Vormarkt.MIN_LUECKE + ' %, Kurs über ' + window.Vormarkt.MIN_KURS +
      ' $, in mindestens ' + window.Vormarkt.MIN_KERZEN + ' der 5-Minuten-Kerzen gehandelt.' +
      /* Stufe 3 (03.09.2026): Die zwei Begruendungs-Saetze (keine Volumen-Schwelle,
       * welche Listen durchsucht werden) stehen woertlich im Register unter
       * heute.vorboerse - der i-Knopf sitzt in der Ueberschrift der Karte. Sichtbar
       * bleiben die SCHWELLEN selbst (sie kommen aus window.Vormarkt und duerfen sich
       * aendern) und die Zusicherung, dass hier nichts gemessen ist. */
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

  /* ================= Das Laufband =================
   *
   * ES LAEUFT WIEDER (Wilhelm, 04.09.2026): von rechts nach links, durchgehend,
   * Meldung an Meldung. Vier Dinge macht diese Funktion; alles am Aussehen ist CSS.
   *
   * 1. INHALT: DIE JUENGSTEN. Juengste zuerst, hoechstens zwanzig - und ausdruecklich
   *    ALLE, auch die fuenf, die im Kasten stehen. Bis heute zeigte das Band "den
   *    Rest" (NEWS_ALLE.slice(NEWS_MAX, 20)), damit keine Schlagzeile zweimal auf dem
   *    Reiter steht (QS-F4). Das war eine ehrliche Antwort auf eine Frage, die
   *    Wilhelm inzwischen anders ENTSCHIEDEN hat: das Band ist der Ticker (was
   *    gerade passiert), der Kasten die Liste (was man in Ruhe liest). Der Kasten ist
   *    seither absichtlich eine TEILMENGE des Bandes. F4 ist damit entschieden, nicht
   *    offen - und die Sperrklinke dazu prueft genau das: Kasten im Band, juengste
   *    zuerst.
   * 2. ALTER. Jede Meldung traegt, wie alt sie ist. Ein Ticker ohne Alter behauptet
   *    Aktualitaet, die er nicht belegen kann - die Feeds liefern auch Stunden Altes.
   * 3. TEMPO. Aus der GEMESSENEN Breite einer Spurhaelfte, nicht aus der Zahl der
   *    Zeichen: gleiche Pixel je Sekunde, egal ob acht oder zwanzig Meldungen laufen.
   *    Im Markup steht dazu keine Zahl; die Dauer setzt bandTempo() nach dem
   *    Einhaengen - und nur, wenn es etwas zu messen gibt (auf einem verborgenen
   *    Reiter ist jede Breite 0).
   * 4. DIE DOPPELTE SPUR. Zwei gleiche Haelften, die Animation schiebt um -50 %,
   *    also um genau eine Haelfte: in dem Moment steht die Kopie da, wo das Original
   *    angefangen hat, und es entsteht keine Luecke. Die Kopie traegt aria-hidden -
   *    fuer eine Vorlesehilfe steht jede Meldung einmal da.
   *
   * DER SCHALTER IST NICHT MEHR "BEWEGUNG REDUZIEREN". Auf Wilhelms Rechner steht
   * die Windows-Einstellung dauerhaft an (#90), und er will das Band laufen sehen.
   * An ihre Stelle tritt die App-Einstellung "Laufband bewegen" (Vorgabe an), die
   * depot.js als data-laufband an das Wurzelelement schreibt. Der Renderer liest
   * dieses eine Attribut - dieselbe Quelle, aus der auch das CSS liest, damit Text
   * und Verhalten nicht auseinanderlaufen koennen. */
  var TICK_PXS = 60;          // Laufgeschwindigkeit in Pixeln je Sekunde
  var TICK_MAX = 20;          // hoechstens so viele Meldungen im Band

  function bandLaeuft() {
    return document.documentElement.getAttribute('data-laufband') !== 'aus';
  }

  /* Wie alt ist eine Meldung? Reine Rechnung, damit sie sich pruefen laesst.
   * Ohne brauchbaren Stempel gibt sie den leeren Text zurueck - eine erfundene
   * Altersangabe waere schlimmer als keine. */
  function newsAlter(tMs, jetztMs) {
    if (!tMs || !(tMs > 0)) return '';
    var min = Math.floor((jetztMs - tMs) / 60000);
    if (min < 1) return 'gerade eben';
    if (min < 60) return 'vor ' + min + ' Min';
    var std = Math.floor(min / 60);
    if (std < 24) return std === 1 ? 'vor 1 Std' : 'vor ' + std + ' Std';
    var tage = Math.floor(std / 24);
    return tage === 1 ? 'vor 1 Tag' : 'vor ' + tage + ' Tagen';
  }

  /* Das Tempo. Gemessen wird die ERSTE Haelfte: sie ist auch dann da, wenn die Kopie
   * bei stehendem Band ausgeblendet ist - sonst haette ein Umschalten das Tempo
   * verdoppelt. Gibt null zurueck, solange nichts zu messen ist. */
  function bandTempo() {
    var el = document.getElementById('newsTicker');
    if (!el) return null;
    var spur = el.querySelector('.tickSpur');
    var teil = el.querySelector('.tickTeil');
    if (!spur || !teil) return null;
    var breite = teil.offsetWidth;
    if (!(breite > 0)) return null;
    var dauer = Math.max(10, breite / TICK_PXS);
    spur.style.animationDuration = dauer.toFixed(1) + 's';
    return { breite: breite, dauer: dauer, pxs: breite / dauer };
  }
  /* Auf einem verborgenen Reiter ist jede Breite 0. Beim Wechsel dorthin wird
   * nachgemessen - einmal, und nur wenn es dann etwas zu messen gibt. */
  ['tab-changed', 'sub-changed'].forEach(function (ev) {
    document.addEventListener(ev, function () { bandTempo(); });
  });

  /* ---- Tastatur im Band (der Preis aus Stufe 6 4.3 wird hier bezahlt) ----
   * Die Links sind KEINE Tabulator-Halte (tabindex="-1"): ein angesprungener Link
   * kann breiter sein als das Band, und dann steht er halb draussen - zweimal
   * gemessen (Uebergabe Stufe 6, Abweichung 3). Anspringbar ist das BAND; es merkt
   * sich eine "aktuelle" Meldung, die Pfeiltasten bewegen sie, Enter oeffnet sie.
   * Solange der Fokus im Band steht, laeuft es nicht (CSS :focus-within) - sonst
   * schoebe die Animation genau die Meldung weg, die man gerade gewaehlt hat. */
  var bandAktiv = 0;
  function bandLinks() {
    var el = document.getElementById('newsTicker');
    var teil = el && el.querySelector('.tickTeil');
    return teil ? Array.prototype.slice.call(teil.querySelectorAll('a')) : [];
  }
  function bandZeigen(n) {
    var links = bandLinks();
    if (!links.length) return null;
    bandAktiv = Math.max(0, Math.min(links.length - 1, n));
    links.forEach(function (a, i) {
      if (i === bandAktiv) a.classList.add('tickAktiv'); else a.classList.remove('tickAktiv');
    });
    var a = links[bandAktiv];
    if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest', inline: 'center' });
    return a;
  }
  (function bandTastatur() {
    var el = document.getElementById('newsTicker');
    if (!el) return;
    el.addEventListener('focus', function () {
      if (!el.querySelector('.tickAktiv')) bandZeigen(bandAktiv);
    });
    el.addEventListener('keydown', function (ev) {
      var k = ev.key;
      if (k === 'ArrowRight' || k === 'ArrowDown') { bandZeigen(bandAktiv + 1); ev.preventDefault(); }
      else if (k === 'ArrowLeft' || k === 'ArrowUp') { bandZeigen(bandAktiv - 1); ev.preventDefault(); }
      else if (k === 'Home') { bandZeigen(0); ev.preventDefault(); }
      else if (k === 'Enter') {
        var links = bandLinks();
        if (links[bandAktiv]) { links[bandAktiv].click(); ev.preventDefault(); }
      }
    });
  })();

  function bandTitel() {
    return bandLaeuft()
      ? 'Markt-News als Laufband – unter dem Mauszeiger hält es an. Klick öffnet die Meldung.'
      : 'Markt-News. Das Band steht (App-Einstellung „Laufband bewegen“) – seitwärts schieben zeigt die übrigen Meldungen. Klick öffnet die Meldung.';
  }

  function renderTicker() {
    var el = document.getElementById('newsTicker');
    if (!el) return;
    /* DIE JUENGSTEN, juengste zuerst. NEWS_ALLE ist bereits nach Zeit sortiert
     * (refreshNews), der Schnitt nimmt also den Kopf der Liste. */
    var zeigen = NEWS_ALLE.slice(0, TICK_MAX);
    if (!zeigen.length) { el.style.display = 'none'; return; }
    var jetzt = Date.now();
    var stueck = zeigen.map(function (n) {
      var alter = newsAlter(n.t, jetzt);
      return '<a href="' + U.esc(safeUrl(n.url)) + '" target="_blank" rel="noopener" tabindex="-1">' +
        U.esc(n.title) + '</a>' +
        (alter ? '<span class="tickZeit">' + U.esc(alter) + '</span>' : '') +
        '<span class="tickTrenn">•</span>';
    }).join('');
    el.style.display = 'block';
    el.title = bandTitel();
    el.innerHTML = '<div class="tickSpur">' +
      '<span class="tickTeil">' + stueck + '</span>' +
      '<span class="tickTeil tickKopie" aria-hidden="true">' + stueck + '</span></div>';
    bandAktiv = 0;
    bandTempo();
  }
  /* Ein Umschalten im Betrieb aendert den Hinweistext und - bei ausgeschaltetem Band -
   * die Breite dessen, was zu sehen ist. Das Band selbst wird NICHT neu gebaut: das
   * Anhalten macht CSS, und ein Neuaufbau risse den Leser aus der Meldung, die
   * gerade vor ihm steht. */
  document.addEventListener('anzeige-geaendert', function () {
    var el = document.getElementById('newsTicker');
    if (!el || el.style.display === 'none') return;
    el.title = bandTitel();
    bandTempo();
  });

  /* ================= Die Marktglocke (Wilhelm, 04.09.2026) =================
   *
   * Zur Eroeffnung und zum Schluss ein kurzer Glockenton. NICHTS DAVON HAENGT AM
   * HANDEL: die Glocke laeutet auch, wenn keine Regel aktiv ist, und sie loest
   * nichts aus.
   *
   * DER AUSLOESER IST DER SITZUNGSZUSTAND, nicht die Uhr. Welcher Wechsel laeutet,
   * entscheidet MarktUebersicht.glockenEreignis() - eine reine Funktion, die nur
   * zwei Zustaende vergleicht. Eine eigene Zeitrechnung auf 09:30 New Yorker Zeit
   * haette Zeitzone, Sommerzeit und Feiertage ein zweites Mal gerechnet; so kommen
   * Feiertage und Halbtage ohne eine einzige zusaetzliche Zeile mit (an ihnen gibt
   * es kein 'regulaer'). Der Takt hier ist nur ein Blick auf diese Rechnung, keine
   * eigene: alle 15 Sekunden nachsehen, ob sich der Zustand geaendert hat.
   *
   * GENAU EINMAL JE EREIGNIS: gemerkt wird der zuletzt gesehene Zustand, und der
   * erste Blick laeutet nie (glockenEreignis gibt gegen null immer null zurueck) -
   * ein Neustart um 09:31 laeutet also nicht nach. Die Marke lebt nur in der
   * Sitzung; sie gehoert nicht in den Store, weil sie nichts ueber das Depot sagt. */
  var GLOCKE_TEILE = [
    { f: 587.33, a: 0.50, t: 1.20 },    // Grundton (d5) - er traegt den Ton
    { f: 1174.66, a: 0.20, t: 0.70 },   // Oktave darueber, verklingt schneller
    { f: 1760.00, a: 0.10, t: 0.35 }    // kurzer heller Teilton: das Anschlagen
  ];
  var glockeCtx = null;
  var glockeZustand = null;

  /* Der Ton wird ERZEUGT, nicht abgespielt: keine Audiodatei im Paket, keine
   * Lizenzfrage, und drei Sinus-Teiltoene mit abklingender Huellkurve sind das,
   * woraus eine Glocke besteht. Wirft irgendetwas davon, bleibt es still - ein
   * fehlgeschlagener Ton darf keinen Bildschirm mitnehmen. */
  function glockeTon() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!glockeCtx) glockeCtx = new AC();
      if (glockeCtx.state === 'suspended' && glockeCtx.resume) glockeCtx.resume();
      var t0 = glockeCtx.currentTime + 0.02;
      GLOCKE_TEILE.forEach(function (teil) {
        var osz = glockeCtx.createOscillator();
        var huelle = glockeCtx.createGain();
        osz.type = 'sine';
        osz.frequency.setValueAtTime(teil.f, t0);
        /* Exponentiell, weil ein Ton so verklingt - linear klaenge wie ein Abwuergen.
         * Der Startwert darf nicht 0 sein: von 0 kommt eine exponentielle Rampe nie weg. */
        huelle.gain.setValueAtTime(0.0001, t0);
        huelle.gain.exponentialRampToValueAtTime(teil.a, t0 + 0.012);
        huelle.gain.exponentialRampToValueAtTime(0.0001, t0 + teil.t);
        osz.connect(huelle);
        huelle.connect(glockeCtx.destination);
        osz.start(t0);
        osz.stop(t0 + teil.t + 0.05);
      });
      return true;
    } catch (e) { return false; }
  }

  function glockeAn() {
    return document.documentElement.getAttribute('data-glocke') !== 'aus';
  }

  /* Ein Blick. Gibt das Ereignis zurueck, damit die Probe es sehen kann. */
  function glockeTakt() {
    var z = sitzungJetzt();
    if (!z || !window.MarktUebersicht || !window.MarktUebersicht.glockenEreignis) return null;
    var ereignis = window.MarktUebersicht.glockenEreignis(glockeZustand, z.zustand);
    glockeZustand = z.zustand;
    if (!ereignis) return null;
    /* Sichtbar wird es auch ohne Ton: wer den Schalter aus hat oder keine Boxen
     * angeschlossen hat, soll trotzdem sehen, dass gerade etwas passiert ist.
     * Die Meldung geht nach einer Minute von selbst wieder weg - sie ist ein
     * Ereignis, kein Zustand, und die Hinweis-Kette traegt sonst Zustaende. */
    hinweisSetzen('glocke', ereignis === 'oeffnung' ? 'Börse geöffnet' : 'Börse geschlossen');
    setTimeout(function () { hinweisSetzen('glocke', null); }, 60000);
    if (glockeAn()) glockeTon();
    return ereignis;
  }
  /* Der erste Aufruf laeutet nie - er merkt sich nur, wo die App hereingekommen ist. */
  glockeTakt();
  setInterval(glockeTakt, 15000);

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
    return '<div class="hv-kopf"><b>' + U.esc(s.y) + '</b> · ' + U.esc(s.name) + '</div>' + z.join('') + newsTeil;
  }

  function hoverNewsHtml(items) {
    if (!items || !items.length) return '<span class="loading">Keine aktuellen News zu diesem Wert.</span>';
    return items.slice(0, 3).map(function (n2) {
      return '<a href="' + U.esc(safeUrl(n2.url)) + '" target="_blank" rel="noopener">' + U.esc(n2.title) + '</a>' +
        '<span class="src">' + U.esc(n2.source) + '</span>';
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
      /* Der Explorer ist seit dem UI-Umbau ein Unter-Reiter von "Werkzeuge":
       * Reiter UND Pille anklicken, sonst landet man auf der falschen Seite. */
      var reiter = document.querySelector('[data-tab="werkzeuge"]');
      if (reiter) reiter.click();
      var pille = document.querySelector('#wzPills [data-sub="explorer"]');
      if (pille) pille.click();
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
  /* Die Hell/Dunkel-Wahl wurde nirgends gespeichert - jeder Start begann wieder
   * dunkel, und wer hell braucht, musste bei jedem Start denselben Knopf druecken.
   * C12 (01.09.2026): dritter Zustand 'system' - der Knopf laeuft Dunkel -> Hell ->
   * System -> Dunkel. Bei 'system' folgt die Oberflaeche dem Betriebssystem, auch
   * bei einem Wechsel zur Laufzeit. Gespeichert wird der ZUSTAND, das Attribut
   * traegt immer den aufgeloesten Wert. */
  (function () {
    var btn = document.getElementById('themeBtn');
    var mqHell = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
    var zustand = (window.api && window.api.startThema === 'system') ? 'system'
      : (document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
    function aufgeloest() {
      if (zustand !== 'system') return zustand;
      return (mqHell && mqHell.matches) ? 'light' : 'dark';
    }
    function anwenden(speichern) {
      document.documentElement.setAttribute('data-theme', aufgeloest());
      btn.textContent = zustand === 'system' ? 'Thema: System' : 'Hell/Dunkel';
      btn.title = zustand === 'system'
        ? 'Folgt der Hell/Dunkel-Einstellung des Betriebssystems. Klick: fest Dunkel.'
        : 'Gerade fest ' + (zustand === 'dark' ? 'dunkel' : 'hell') + '. Klick wechselt; nach Hell kommt „System“ (folgt dem Betriebssystem).';
      if (speichern) {
        try { if (window.api && window.api.storeSet) window.api.storeSet('theme', zustand); }
        catch (e) { /* ohne Speicher bleibt es bei dieser Sitzung */ }
      }
    }
    btn.addEventListener('click', function () {
      zustand = zustand === 'dark' ? 'light' : zustand === 'light' ? 'system' : 'dark';
      anwenden(true);
    });
    if (mqHell && mqHell.addEventListener) {
      mqHell.addEventListener('change', function () { if (zustand === 'system') anwenden(false); });
    }
    anwenden(false);
  })();
  /* Seit dem 26.08.2026 steht das Thema normalerweise schon: thema.js setzt es im
   * <head> aus window.api.startThema, also bevor irgendetwas gezeichnet wird.
   * Dieser Weg hier bleibt als NETZ - fuer den Fall, dass das Startargument fehlt
   * (aeltere Fassung des Hauptprozesses, geaenderte Startbedingungen). Er kommt eine
   * Runde zu spaet und blitzt dann, aber er kommt. Wenn thema.js gegriffen hat,
   * setzt er denselben Wert noch einmal und niemand merkt etwas.
   * Ersatzlos streichen waere falsch: dann haenge die gespeicherte Wahl an EINEM
   * Pfad, und faellt der aus, waere sie stillschweigend vergessen. */
  (function themaLaden() {
    if (!window.api || !window.api.storeGet) return;
    window.api.storeGet('theme').then(function (t) {
      if (t === 'system') t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
      if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    }).catch(function () { /* nicht lesbar: es bleibt beim Vorgabethema */ });
  })();

  var refreshing = false;
  async function doRefresh() {
    if (refreshing) return;
    refreshing = true;
    document.getElementById('refreshBtn').disabled = true;
    // Ein Fehler im Abruf oder im Rendern darf den Takt nicht killen: vorher stoppte eine
    // einzige Ausnahme die Kursaktualisierung dauerhaft bis zum Neustart der App.
    try { await refreshQuotes(); }
    catch (e) { hinweisSetzen('aktualisierung', 'Aktualisierung fehlgeschlagen: ' + (e && e.message ? e.message : e)); }
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
    marketOpen: usMarketOpen,
    /* Der Probe-Knopf in den App-Einstellungen und die UI-Probe greifen hier an:
     * derselbe Ton und dieselbe Messung, die im Betrieb laufen - keine zweite. */
    glockeProbe: function () { return glockeTon(); },
    bandTempo: bandTempo
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
     ['chips', skel(8, 150, ['w40', 'w60', 'w80', 'w60'])]].forEach(function (kv) {
      var el = document.getElementById(kv[0]);
      if (el) el.innerHTML = kv[1];
    });
  }
  skeletons();

  /* Der gemerkte Schlagzeilen-Stand, bevor der erste Abruf zurueck ist. Eine
   * beschaedigte Datei darf den Start nicht aufhalten; im Zweifel bleibt es leer. */
  async function newsStandLaden() {
    try {
      var g = await window.api.storeGet('newsStand');
      if (!g || !Array.isArray(g.items) || !g.items.length) return;
      var sauber = g.items.filter(function (n) {
        return n && typeof n.title === 'string' && typeof n.url === 'string';
      }).map(function (n) {
        return { title: n.title, url: n.url, source: String(n.source || ''), t: Number(n.t) || 0 };
      });
      if (!sauber.length) return;
      /* Nur, wenn noch nichts da ist. Der Kursabruf laeuft parallel und stoesst
       * refreshNews() an - kaeme der gemerkte Stand danach an, ueberschriebe er
       * frisch geholte Schlagzeilen mit aelteren. */
      if (NEWS_ALLE.length) return;
      NEWS_ALLE = sauber.slice(0, 25);
      NEWS = NEWS_ALLE.slice(0, NEWS_MAX);
      renderNews();
    } catch (e) { /* ohne Speicher startet die Liste eben leer */ }
  }

  // Start – der Takt startet auch dann, wenn der erste Abruf scheitert
  doRefresh().then(scheduleLoop, scheduleLoop);
  newsStandLaden().then(refreshNews, refreshNews);
  setInterval(refreshNews, 30 * 60000);
})();
