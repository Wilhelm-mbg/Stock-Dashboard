'use strict';
/* Quant-Modul: Indikatoren, Black-Scholes, ZigZag/Elliott, Sentiment, Backtest.
   Reine Funktionen – läuft im Renderer (window.Quant) und in Node (Tests). */
(function (root) {

  /* ================= Basis-Statistik ================= */
  function sma(vals, n, i) {
    if (i === undefined) i = vals.length - 1;
    if (i + 1 < n) return null;
    var s = 0;
    for (var k = i - n + 1; k <= i; k++) s += vals[k];
    return s / n;
  }
  function stdev(vals) {
    if (vals.length < 2) return 0;
    var m = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    var v = vals.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (vals.length - 1);
    return Math.sqrt(v);
  }
  function logReturns(closes, n, endI) {
    if (endI === undefined) endI = closes.length - 1;
    var out = [];
    for (var i = Math.max(1, endI - n + 1); i <= endI; i++) out.push(Math.log(closes[i] / closes[i - 1]));
    return out;
  }
  // Annualisierte historische Volatilität (Basis: n Tagesrenditen)
  function histVol(closes, n, endI) {
    var r = logReturns(closes, n || 30, endI);
    if (r.length < 5) return 0.3;
    var v = stdev(r) * Math.sqrt(252);
    return Math.min(1.5, Math.max(0.10, v));
  }
  function rsi(closes, n, endI) {
    n = n || 14;
    if (endI === undefined) endI = closes.length - 1;
    if (endI < n) return null;
    var g = 0, l = 0;
    for (var i = endI - n + 1; i <= endI; i++) {
      var d = closes[i] - closes[i - 1];
      if (d > 0) g += d; else l -= d;
    }
    if (g + l === 0) return 50;
    var rs = l === 0 ? 100 : g / l;
    return 100 - 100 / (1 + rs);
  }
  function emaSeries(vals, n) {
    var k = 2 / (n + 1), out = [], prev = vals[0];
    for (var i = 0; i < vals.length; i++) { prev = i ? vals[i] * k + prev * (1 - k) : vals[0]; out.push(prev); }
    return out;
  }

  /* ================= Black-Scholes ================= */
  function erf(x) {
    // Abramowitz & Stegun 7.1.26 (|Fehler| < 1.5e-7)
    var s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function normCdf(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  /** Preis eines europäischen Calls/Puts. T in Jahren. */
  function bsPrice(type, S, K, T, sigma, r) {
    r = r === undefined ? 0.02 : r;
    if (T <= 0) return type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    var sq = sigma * Math.sqrt(T);
    var d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / sq;
    var d2 = d1 - sq;
    if (type === 'call') return S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
    return K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1);
  }
  function bsDelta(type, S, K, T, sigma, r) {
    r = r === undefined ? 0.02 : r;
    if (T <= 0) return type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0);
    var d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    return type === 'call' ? normCdf(d1) : normCdf(d1) - 1;
  }

  /* ================= ZigZag & Elliott ================= */
  /** pts: [[t, close]], thrPct: Umkehrschwelle in % */
  function zigzag(pts, thrPct) {
    var thr = thrPct / 100;
    if (pts.length < 3) return [];
    var piv = [];
    var lastP = pts[0][1], lastT = pts[0][0], lastI = 0, dir = 0; // dir 1=steigend seit Pivot
    var extP = lastP, extT = lastT, extI = 0;
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i][1];
      if (dir >= 0 && p > extP) { extP = p; extT = pts[i][0]; extI = i; }
      if (dir <= 0 && p < extP) { extP = p; extT = pts[i][0]; extI = i; }
      if (dir === 0) {
        if (p >= lastP * (1 + thr)) { dir = 1; extP = p; extT = pts[i][0]; extI = i; }
        else if (p <= lastP * (1 - thr)) { dir = -1; extP = p; extT = pts[i][0]; extI = i; }
      } else if (dir === 1 && p <= extP * (1 - thr)) {
        piv.push({ t: extT, p: extP, i: extI, type: 'H' });
        dir = -1; extP = p; extT = pts[i][0]; extI = i;
      } else if (dir === -1 && p >= extP * (1 + thr)) {
        piv.push({ t: extT, p: extP, i: extI, type: 'L' });
        dir = 1; extP = p; extT = pts[i][0]; extI = i;
      }
    }
    piv.push({ t: extT, p: extP, i: extI, type: dir === 1 ? 'H' : 'L', open: true }); // laufendes Extrem
    return piv;
  }

  function fibScore(x, lo, hi) { // 1 wenn im Idealband, weich abfallend außerhalb
    if (x >= lo && x <= hi) return 1;
    var d = x < lo ? (lo - x) / lo : (x - hi) / hi;
    return Math.max(0, 1 - d * 2);
  }

  /** Prüft 6 Pivotpreise p0..p5 als Impuls (up=true: L-H-L-H-L-H). Liefert Konfidenz 0..1 oder 0. */
  function impulseFit(pp, up) {
    var s = up ? 1 : -1;
    var p0 = pp[0], p1 = pp[1], p2 = pp[2], p3 = pp[3], p4 = pp[4], p5 = pp[5];
    var w1 = s * (p1 - p0), w3 = s * (p3 - p2), w5 = s * (p5 - p4);
    if (w1 <= 0 || w3 <= 0 || w5 <= 0) return 0;
    // Regel: W2 retraced nie >100 % von W1
    if (s * (p2 - p0) <= 0) return 0;
    // Regel: W3 nie die kürzeste
    if (w3 < w1 && w3 < w5) return 0;
    // Regel: W4 überlappt W1 nicht (kleine Toleranz 1 %)
    if (s * (p4 - p1) < -0.01 * Math.abs(p1)) return 0;
    // Fibonacci-Plausibilität
    var f = 0;
    f += fibScore(s * (p1 - p2) / w1, 0.30, 0.80);          // W2-Retracement 30–80 %
    f += fibScore(w3 / w1, 1.0, 2.8);                        // W3-Ausdehnung
    f += fibScore(s * (p3 - p4) / w3, 0.20, 0.55);           // W4-Retracement
    return 0.45 + 0.55 * (f / 3);
  }

  /** ABC-Korrektur aus 4 Pivotpreisen (down=true: Korrektur abwärts H-L-H-L). */
  function abcFit(pp, down) {
    var s = down ? -1 : 1;
    var a = s * (pp[1] - pp[0]), c = s * (pp[3] - pp[2]);
    if (a <= 0 || c <= 0) return 0;
    var b = -s * (pp[2] - pp[1]);
    if (b <= 0) return 0;
    var f = fibScore(b / a, 0.3, 0.8) + fibScore(c / a, 0.6, 1.7);
    return 0.4 + 0.6 * (f / 2);
  }

  /**
   * Elliott-Einordnung auf Tagesschluss-Serie.
   * Rückgabe: {label, phase, conf, alt, altConf, score, thrPct, pivots}
   * score ∈ [-1,1]: erwartete Richtung des NÄCHSTEN Moves (bereits mit Konfidenz gewichtet).
   */
  function elliott(pts) {
    var closes = pts.map(function (p) { return p[1]; });
    if (closes.length < 40) return { label: 'Zu wenig Daten', phase: '–', conf: 0, alt: '–', altConf: 0, score: 0, pivots: [] };
    var vol = histVol(closes, 30);
    var thrPct = Math.min(8, Math.max(3, vol * 100 * 0.35));
    var piv = zigzag(pts, thrPct);
    if (piv.length < 4) return { label: 'Keine klare Struktur', phase: '–', conf: 0.2, alt: '–', altConf: 0, score: 0, thrPct: thrPct, pivots: piv };

    var cands = [];
    var pp = piv.map(function (x) { return x.p; });
    var n = pp.length;
    var last = pts[pts.length - 1][1];

    // Kompletter Impuls (letzte 6 Pivots)
    if (n >= 6) {
      var six = pp.slice(n - 6);
      var cu = impulseFit(six, true);
      if (cu > 0) cands.push({ label: 'Aufwärtsimpuls 1–5 abgeschlossen', phase: 'Welle-5-Top → Korrektur erwartet', conf: cu, score: -0.45 * cu });
      var cd = impulseFit(six, false);
      if (cd > 0) cands.push({ label: 'Abwärtsimpuls 1–5 abgeschlossen', phase: 'Welle-5-Tief → Erholung erwartet', conf: cd, score: 0.45 * cd });
    }
    // Impuls im Aufbau: Welle 3 läuft (letzte 4 Pivots als 0-1-2 + laufende 3)
    if (n >= 4) {
      var four = pp.slice(n - 4);
      // up: L H L, aktueller Kurs über H(1) → Welle 3 aufwärts läuft
      if (piv[n - 4].type === 'L' && piv[n - 3].type === 'H' && piv[n - 2].type === 'L') {
        var w1 = four[1] - four[0], retr = (four[1] - four[2]) / (w1 || 1);
        if (w1 > 0 && four[2] > four[0] && last > four[1]) {
          var c3 = 0.5 + 0.5 * fibScore(retr, 0.3, 0.8);
          cands.push({ label: 'Aufwärtsimpuls: Welle 3 läuft', phase: 'Welle 3 aufwärts (stärkste Phase)', conf: c3, score: 0.7 * c3 });
        } else if (w1 > 0 && four[2] > four[0] && last <= four[1]) {
          var c2 = 0.4 + 0.4 * fibScore(retr, 0.3, 0.8);
          cands.push({ label: 'Aufwärtsimpuls: Welle-2-Korrektur', phase: 'Welle 2 → Welle 3 voraus, Bestätigung über Welle-1-Hoch nötig', conf: c2, score: 0.5 * c2 });
        }
      }
      if (piv[n - 4].type === 'H' && piv[n - 3].type === 'L' && piv[n - 2].type === 'H') {
        var w1d = four[0] - four[1], retrD = (four[2] - four[1]) / (w1d || 1);
        if (w1d > 0 && four[2] < four[0] && last < four[1]) {
          var c3d = 0.5 + 0.5 * fibScore(retrD, 0.3, 0.8);
          cands.push({ label: 'Abwärtsimpuls: Welle 3 läuft', phase: 'Welle 3 abwärts (stärkste Phase)', conf: c3d, score: -0.7 * c3d });
        } else if (w1d > 0 && four[2] < four[0] && last >= four[1]) {
          // Spiegelfall zum Aufwärts-Zweig – ohne ihn war der Elliott-Score systematisch bullisch verzerrt
          var c2d = 0.4 + 0.4 * fibScore(retrD, 0.3, 0.8);
          cands.push({ label: 'Abwärtsimpuls: Welle-2-Erholung', phase: 'Welle 2 → Welle 3 abwärts voraus, Bestätigung unter Welle-1-Tief nötig', conf: c2d, score: -0.5 * c2d });
        }
      }
    }
    // ABC-Korrektur (letzte 4 Pivots)
    if (n >= 4) {
      var fourP = pp.slice(n - 4);
      var down = piv[n - 4].type === 'H';
      var cab = abcFit(fourP, down);
      if (cab > 0) {
        if (down) cands.push({ label: 'ABC-Korrektur abwärts (mögl. abgeschlossen)', phase: 'C-Welle am Tief → Wiederaufnahme des Trends möglich', conf: cab, score: 0.4 * cab });
        else cands.push({ label: 'ABC-Gegenbewegung aufwärts', phase: 'C-Welle am Hoch → Abwärtsrisiko', conf: cab, score: -0.4 * cab });
      }
    }

    if (!cands.length) {
      return { label: 'Keine regelkonforme Zählung', phase: 'Seitwärts/unklar', conf: 0.2, alt: '–', altConf: 0, score: 0, thrPct: thrPct, pivots: piv };
    }
    cands.sort(function (a, b) { return b.conf - a.conf; });
    var best = cands[0], alt = cands[1];
    return {
      label: best.label, phase: best.phase, conf: Math.round(best.conf * 100) / 100,
      alt: alt ? alt.label : 'Seitwärts/unklare Struktur', altConf: alt ? Math.round(alt.conf * 100) / 100 : 0.2,
      score: Math.max(-1, Math.min(1, best.score)), thrPct: Math.round(thrPct * 10) / 10, pivots: piv
    };
  }

  /* ================= Technik-Score ================= */
  /** pts: Tagesserie [[t,close]]. Rückgabe {score, parts:[{name,score}]} */
  function technical(pts, endI) {
    var closes = pts.map(function (p) { return p[1]; });
    if (endI === undefined) endI = closes.length - 1;
    if (endI < 55) return { score: 0, parts: [] };
    var parts = [];
    var s20 = sma(closes, 20, endI), s50 = sma(closes, 50, endI);
    var trend = s20 && s50 ? Math.max(-1, Math.min(1, (s20 / s50 - 1) * 25)) : 0;
    parts.push({ name: 'Trend (SMA20/50)', score: trend });
    var r = rsi(closes, 14, endI);
    var rScore = r === null ? 0 : (r > 70 ? -(r - 70) / 30 : (r < 30 ? (30 - r) / 30 : (r - 50) / 50 * 0.3));
    parts.push({ name: 'RSI(14)=' + (r === null ? '–' : Math.round(r)), score: rScore });
    var mom = closes[endI] / closes[Math.max(0, endI - 10)] - 1;
    parts.push({ name: 'Momentum (10T)', score: Math.max(-1, Math.min(1, mom * 12)) });
    var e12 = emaSeries(closes.slice(0, endI + 1), 12), e26 = emaSeries(closes.slice(0, endI + 1), 26);
    var macd = e12[endI] - e26[endI];
    parts.push({ name: 'MACD-Tendenz', score: Math.max(-1, Math.min(1, macd / closes[endI] * 60)) });
    var score = parts.reduce(function (a, p) { return a + p.score; }, 0) / parts.length;
    return { score: Math.max(-1, Math.min(1, score)), parts: parts };
  }

  /* ================= News-Sentiment ================= */
  var POS = ['beat', 'beats', 'übertrifft', 'übertroffen', 'raises', 'hebt', 'anhebt', 'upgrade', 'hochgestuft', 'record', 'rekord', 'surge', 'soars', 'jumps', 'rally', 'strong', 'stark', 'wachstum', 'growth', 'gewinnsprung', 'buyback', 'rückkauf', 'dividendenerhöhung', 'outperform', 'kaufempfehlung', 'partnership', 'partnerschaft', 'expands', 'milestone', 'approval', 'zulassung', 'wins', 'gewinnt', 'auftrag', 'contract', 'breakthrough', 'durchbruch'];
  var NEG = ['miss', 'misses', 'verfehlt', 'cuts', 'senkt', 'kürzt', 'downgrade', 'abgestuft', 'plunge', 'crash', 'einbruch', 'stürzt', 'falls', 'fällt', 'weak', 'schwach', 'warnung', 'warning', 'gewinnwarnung', 'lawsuit', 'klage', 'probe', 'untersuchung', 'recall', 'rückruf', 'layoffs', 'stellenabbau', 'entlassungen', 'delay', 'verzögerung', 'shortage', 'engpass', 'strike', 'streik', 'fine', 'strafe', 'bußgeld', 'underperform', 'verkaufsempfehlung', 'insolvenz', 'bankruptcy'];
  var EVENTS = [
    { name: 'Earnings', mult: 1.4, kw: ['earnings', 'quartalszahlen', 'quarterly results', 'q1', 'q2', 'q3', 'q4', 'jahreszahlen', 'results'] },
    { name: 'Prognose', mult: 1.5, kw: ['guidance', 'prognose', 'outlook', 'forecast', 'ausblick'] },
    { name: 'Übernahme', mult: 1.6, kw: ['übernahme', 'acquisition', 'merger', 'buyout', 'takeover', 'fusion', 'deal'] },
    { name: 'Analysten', mult: 1.1, kw: ['analyst', 'kursziel', 'price target', 'rating', 'upgrade', 'downgrade'] },
    { name: 'Regulierung/Recht', mult: 1.2, kw: ['lawsuit', 'klage', 'regulator', 'kartell', 'antitrust', 'eu-kommission', 'ftc', 'doj'] },
    { name: 'Produkt/KI', mult: 1.15, kw: ['launch', 'vorstellung', 'chip', 'ki-', ' ai ', 'produkt', 'modell'] }
  ];
  function countHits(text, list) {
    var c = 0;
    for (var i = 0; i < list.length; i++) if (text.indexOf(list[i]) !== -1) c++;
    return c;
  }
  /** items: [{title, t(ms)}] → {score, events, top:{title,score}|null, n} */
  function sentiment(items, nowMs) {
    nowMs = nowMs || (items.length ? Math.max.apply(null, items.map(function (i) { return i.t || 0; })) : 0);
    var total = 0, weightSum = 0, evSet = {}, top = null, topAbs = 0;
    for (var i = 0; i < items.length; i++) {
      var txt = ' ' + (items[i].title || '').toLowerCase() + ' ';
      var raw = countHits(txt, POS) - countHits(txt, NEG);
      if (raw === 0) continue;
      var s = Math.max(-1, Math.min(1, raw * 0.5));
      var mult = 1;
      for (var e = 0; e < EVENTS.length; e++) {
        if (countHits(txt, EVENTS[e].kw)) { mult = Math.max(mult, EVENTS[e].mult); evSet[EVENTS[e].name] = true; }
      }
      var ageH = items[i].t ? (nowMs - items[i].t) / 3600000 : 24;
      var rec = ageH <= 6 ? 1 : ageH <= 24 ? 0.7 : ageH <= 48 ? 0.4 : 0.15;
      var w = mult * rec;
      total += s * w; weightSum += w;
      if (Math.abs(s * w) > topAbs) { topAbs = Math.abs(s * w); top = { title: items[i].title, score: Math.round(s * w * 100) / 100 }; }
    }
    var score = weightSum ? Math.max(-1, Math.min(1, total / Math.max(2, weightSum) * 1.6)) : 0;
    return { score: score, events: Object.keys(evSet), top: top, n: items.length };
  }

  /* ================= Kombination & Entscheidung ================= */
  var DEFAULT_WEIGHTS = { news: 0.35, tech: 0.40, elliott: 0.25 };
  function combine(scores, weights) {
    weights = weights || DEFAULT_WEIGHTS;
    var wSum = 0, total = 0;
    for (var k in weights) {
      if (scores[k] === undefined || scores[k] === null) continue;
      total += scores[k] * weights[k]; wSum += weights[k];
    }
    return wSum ? total / wSum : 0;
  }

  /* ================= Optionsschein-Simulation ================= */
  var RATIO = 0.1, SPREAD = 0.02, RISK_FREE = 0.02;
  function makeWarrant(dir, spot, vol, nowMs, ratio) {
    var strike = Math.round(spot * (dir === 'call' ? 1.05 : 0.95) * 100) / 100;
    var expiry = nowMs + 60 * 86400000;
    var iv = Math.min(1.5, Math.max(0.15, vol * 1.1));
    return { strike: strike, expiry: expiry, iv: iv, ratio: ratio || RATIO };
  }
  function warrantValue(dir, w, spot, nowMs) {
    var T = Math.max(0, (w.expiry - nowMs) / (365 * 86400000));
    return bsPrice(dir, spot, w.strike, T, w.iv, RISK_FREE) * w.ratio;
  }
  function warrantAsk(dir, w, spot, nowMs) { return warrantValue(dir, w, spot, nowMs) * (1 + SPREAD); }
  function warrantBid(dir, w, spot, nowMs) { return Math.max(0.001, warrantValue(dir, w, spot, nowMs) * (1 - SPREAD)); }

  /** Absoluter Cent-Spread des Emittenten, abhaengig vom Bezugsverhaeltnis.
   *  Kalibriert an echten Kursen (onvista, Nvidia-Scheine): BV 0,1 -> 1 ct, BV 1,0 -> 2 ct.
   *  Ein 8-EUR-Schein und ein 0,087-EUR-Schein zahlen DENSELBEN einen Cent (0,13 % bzw.
   *  11,5 %) - der Spread haengt am Emittenten-Raster, nicht am Preis. */
  function spreadCent(ratio) {
    var r = (ratio == null) ? 0.1 : ratio;
    return 0.01 + 0.01 * Math.min(1, Math.max(0, r));   // 0,1 -> 1,1 ct | 1,0 -> 2 ct
  }
  /** Effektiver Spread je Seite (Anteil am Scheinpreis). Mit Preis: reines Cent-Modell -
   *  KEIN prozentualer Boden. Gemessen: 8,00-EUR-Schein zahlt exakt 0,125 % = 1 ct / 8 EUR;
   *  ein prozentualer Boden (frueher 0,4 %) haette teure Scheine dreifach zu teuer gemacht.
   *  Kappe bei 15 % - Pfennig-Scheine sind real noch schlimmer (gemessen 11,5 %), aber
   *  irgendwo muss die Simulation aufhoeren, Unfug zu bepreisen.
   *  Ohne Preis gilt der Altpfad (Altaufrufe/Tests). */
  function effSpread(iv, base, preis, ratio) {
    base = base === undefined ? SPREAD : base;
    if (preis == null) return Math.min(base * 2.5, Math.max(base * 0.8, base * (0.7 + iv)));
    return Math.min(0.15, spreadCent(ratio) / Math.max(preis, 0.02));
  }
  /** Slippage-Anteil je Ausführung. Mit Scheinpreis: klein - der Emittent stellt feste
   *  Quotes, gefuellt wird zum gestellten Kurs; Restrisiko ist die Kursstellung selbst. */
  function slipOf(iv, base, preis) {
    base = base === undefined ? 0.005 : base;
    if (preis == null) return base * (0.5 + iv);
    // Der Emittent stellt verbindliche Quotes - gefuellt wird zum gestellten Kurs.
    // Restrisiko ist nur die Kursstellung selbst, daher sehr klein.
    return Math.min(0.01, Math.max(0.0005, 0.001 * (0.5 + iv)));
  }

  /** Effektiver Hebel (Omega) = Delta × Spot × Ratio / Scheinpreis */
  function warrantOmega(dir, w, spot, nowMs) {
    var T = Math.max(1e-6, (w.expiry - nowMs) / (365 * 86400000));
    var d = bsDelta(dir, spot, w.strike, T, w.iv, RISK_FREE);
    var p = bsPrice(dir, spot, w.strike, T, w.iv, RISK_FREE) * w.ratio;
    if (p <= 1e-9) return 0;
    return Math.abs(d) * spot * w.ratio / p;
  }
  /** Aufgeld in % – wie weit muss der Basiswert bis zum Break-even laufen */
  function warrantAufgeld(dir, w, spot, nowMs) {
    var pPerShare = warrantValue(dir, w, spot, nowMs) / w.ratio;
    var be = dir === 'call' ? w.strike + pPerShare : w.strike - pPerShare;
    return dir === 'call' ? (be / spot - 1) * 100 : (1 - be / spot) * 100;
  }
  /* ================= Schein-Finder: Kennzahlen und Risikostufe =================
   *
   * Modellbasiert, KEINE echten WKN-Listen - Emittenten-Daten gibt es nur ueber
   * Bezahl-APIs, und die sind bewusst draussen. Dafuer rechnet der Finder mit exakt
   * demselben Modell wie das Depot: Black-Scholes-Bewertung plus das an echten
   * Emittentenkursen geeichte Cent-Spread-Modell. Was man hier auswaehlt, verhaelt
   * sich in der Simulation genauso.
   */

  /** Alle Kennzahlen eines Scheins auf einen Blick. dir 'call'|'put',
   *  w {strike, expiry, iv, ratio}, spot, nowMs. Null, wenn der Schein Unfug ist. */
  function scheinKennzahlen(dir, w, spot, nowMs) {
    var T = Math.max(0, (w.expiry - nowMs) / (365 * 86400000));
    if (T <= 0 || !(spot > 0) || !(w.strike > 0)) return null;
    var wert = warrantValue(dir, w, spot, nowMs);
    if (!(wert > 0.02)) return null;                      // Pfennig-Bereich: Spanne frisst alles
    var spx = effSpread(w.iv, undefined, wert, w.ratio);
    var inner = Math.max(0, (dir === 'call' ? spot - w.strike : w.strike - spot)) * w.ratio;
    // Zeitwertverlust je Woche: derselbe Schein, eine Woche spaeter, Kurs unveraendert
    var in7 = warrantValue(dir, w, spot, nowMs + 7 * 86400000);
    var d1 = (Math.log(spot / w.strike) + (RISK_FREE + w.iv * w.iv / 2) * T) / (w.iv * Math.sqrt(T));
    var d2 = d1 - w.iv * Math.sqrt(T);
    var kz = {
      dir: dir, strike: w.strike, ratio: w.ratio, iv: w.iv,
      restTage: Math.round(T * 365),
      wert: Math.round(wert * 10000) / 10000,
      brief: Math.round(wert * (1 + spx) * 10000) / 10000,
      geld: Math.round(wert * (1 - spx) * 10000) / 10000,
      spreadPct: Math.round(spx * 10000) / 100,
      hebel: Math.round(spot * w.ratio / wert * 10) / 10,
      omega: Math.round(Math.abs(warrantOmega(dir, w, spot, nowMs)) * 10) / 10,
      aufgeldPa: Math.round(warrantAufgeld(dir, w, spot, nowMs) / T * 10) / 10,
      innererWert: Math.round(inner * 10000) / 10000,
      zeitwertAnteil: Math.round((1 - inner / wert) * 1000) / 10,
      thetaWoche: Math.round((in7 / wert - 1) * 1000) / 10,
      breakEven: Math.round((dir === 'call' ? w.strike + wert / w.ratio : w.strike - wert / w.ratio) * 100) / 100,
      delta: Math.round((dir === 'call' ? normCdf(d1) : normCdf(d1) - 1) * 100) / 100,
      // Risikoneutrale Wahrscheinlichkeit, dass der Schein wertlos verfaellt. Eine
      // Modellzahl, keine Prophezeiung - aber sie macht "weit aus dem Geld + kurze
      // Laufzeit" als das sichtbar, was es ist: ein Lotterielos.
      totalverlustP: Math.round((dir === 'call' ? normCdf(-d2) : normCdf(d2)) * 1000) / 10,
      // Wie weit muss der Basiswert laufen, damit allein die Spanne bezahlt ist?
      spanneHuerdePct: 0
    };
    kz.spanneHuerdePct = kz.omega > 0 ? Math.round(2 * spx / kz.omega * 10000) / 100 : null;
    return kz;
  }

  /** Risikostufe 1 (defensiv) bis 5 (Lotterielos). Bewusst einfache, dokumentierte
   *  Regeln statt einer undurchsichtigen Formel - man soll nachvollziehen koennen,
   *  WARUM ein Schein seine Stufe hat. Die gruende-Liste sagt es dazu. */
  function scheinRisikostufe(kz) {
    // Kein Kennzahlen-Objekt heisst: unter 2 Cent, die Spanne frisst jede Bewegung.
    // Das ist keine Stufe 5, das ist gar nicht handelbar - aber wer trotzdem fragt,
    // bekommt die ehrliche Hoechststufe statt eines Absturzes.
    if (!kz) return { stufe: 5, gruende: ['kein handelbarer Schein (Wert unter 2 Cent)'] };
    var gruende = [];
    var stufe = kz.omega <= 4 ? 1 : kz.omega <= 8 ? 2 : kz.omega <= 13 ? 3 : kz.omega <= 20 ? 4 : 5;
    gruende.push('Hebel (Omega) ' + kz.omega + ' → Grundstufe ' + stufe);
    if (kz.totalverlustP > 50) { stufe += 2; gruende.push('Totalverlust-Wahrscheinlichkeit über 50 % (+2)'); }
    else if (kz.totalverlustP > 25) { stufe += 1; gruende.push('Totalverlust-Wahrscheinlichkeit über 25 % (+1)'); }
    if (kz.restTage < 14) { stufe += 1; gruende.push('Restlaufzeit unter 14 Tagen (+1)'); }
    if (kz.spreadPct > 2) { stufe += 1; gruende.push('Spanne über 2 % je Seite – Pfennig-Schein (+1)'); }
    stufe = Math.max(1, Math.min(5, stufe));
    return { stufe: stufe, gruende: gruende };
  }

  /** Das volle Raster moeglicher Scheine zu einem Basiswert, mit allen Kennzahlen
   *  und Risikostufe. opt: {typen, laufzeiten, abstaende, ratios} */
  function scheinRaster(spot, iv, nowMs, opt) {
    opt = opt || {};
    var typen = opt.typen || ['call', 'put'];
    var laufzeiten = opt.laufzeiten || [7, 14, 21, 30, 60, 90, 120, 180];
    var abstaende = opt.abstaende || (function () {
      var a = []; for (var m = -0.20; m <= 0.201; m += 0.025) a.push(Math.round(m * 1000) / 1000); return a;
    })();
    var ratios = opt.ratios || [0.1, 1.0];
    var raus = [];
    typen.forEach(function (dir) {
      laufzeiten.forEach(function (lz) {
        abstaende.forEach(function (m) {
          ratios.forEach(function (bv) {
            var w = { strike: Math.round(spot * (1 + m) * 100) / 100, expiry: nowMs + lz * 86400000, iv: iv, ratio: bv };
            var kz = scheinKennzahlen(dir, w, spot, nowMs);
            if (!kz) return;
            var rs = scheinRisikostufe(kz);
            kz.stufe = rs.stufe; kz.stufenGruende = rs.gruende;
            // Moneyness aus Sicht des Typs: positiv = aus dem Geld
            kz.otmPct = Math.round((dir === 'call' ? m : -m) * 1000) / 10;
            raus.push(kz);
          });
        });
      });
    });
    return raus;
  }

  /** Bei welchem Basiswert-Kurs erreicht der Schein einen Zielpreis? (Bisektion) */
  function underlyingAtTarget(dir, w, targetWarrantPrice, nowMs, S0) {
    var lo = S0 * 0.4, hi = S0 * 1.6;
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2;
      var v = warrantValue(dir, w, mid, nowMs);
      if ((v < targetWarrantPrice) === (dir === 'call')) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /** Hebel-Profile für die Intraday-Strategie */
  /* Bezugsverhaeltnis (ratio) ist eine KOSTEN-Entscheidung, keine Kosmetik: Emittenten
   * stellen die Geld-Brief-Spanne als festen Cent-Betrag (gemessen an echten Nvidia-Scheinen
   * auf onvista: 1 ct bei BV 0,1 / 2 ct bei BV 1,0 - unabhaengig vom Preis). Ein Schein mit
   * BV 1,0 kostet das Zehnfache je Stueck, zahlt aber nur den doppelten Cent-Spread - also
   * ein FUENFTEL des relativen Spreads bei identischem Hebel (Omega ist ratio-unabhaengig).
   * Gemessene Realitaet: 4,50-EUR-Schein mit BV 1,0 -> 0,44 % je Seite, Breakeven 0,077 %;
   * 0,45-EUR-Schein mit BV 0,1 -> 2,2 % je Seite, Breakeven 0,31 %. */
  var PROFILES = {
    atm21:   { name: 'Moderat (ATM, 21 Tage)',        otmPct: 0.00, days: 21, ratio: 0.1 },
    otm3_14: { name: 'Spekulativ (3 % OTM, 14 Tage)', otmPct: 0.03, days: 14, ratio: 0.1 },
    otm5_10: { name: 'Heiß (5 % OTM, 10 Tage)',       otmPct: 0.05, days: 10, ratio: 0.1 },
    atm21_b: { name: 'Moderat, BV 1,0 (ATM, 21 Tage)',    otmPct: 0.00, days: 21, ratio: 1 },
    atm60_b: { name: 'Ruhig, BV 1,0 (ATM, 60 Tage)',      otmPct: 0.00, days: 60, ratio: 1 },
    otm3_30b:{ name: 'Spekulativ, BV 1,0 (3 % OTM, 30 T)', otmPct: 0.03, days: 30, ratio: 1 }
  };

  /* ================= Backtest-Kennzahlen ================= */
  function computeStats(equity, trades, capital) {
    var out = {};
    // Profit-Faktor, Ø Gewinn/Verlust, längste Verlustserie
    var gw = 0, gl = 0, wins = [], losses = [], streak = 0, maxStreak = 0;
    var sorted = trades.slice().sort(function (a, b) { return a.closeT - b.closeT; });
    sorted.forEach(function (t) {
      if (t.pnl > 0) { gw += t.pnl; wins.push(t.pnl); streak = 0; }
      else if (t.pnl < 0) { gl += -t.pnl; losses.push(t.pnl); streak++; if (streak > maxStreak) maxStreak = streak; }
    });
    out.profitFactor = gl > 0 ? Math.round(gw / gl * 100) / 100 : (gw > 0 ? 99 : 0);
    out.avgWin = wins.length ? Math.round(wins.reduce(function (a, b) { return a + b; }, 0) / wins.length * 100) / 100 : 0;
    out.avgLoss = losses.length ? Math.round(losses.reduce(function (a, b) { return a + b; }, 0) / losses.length * 100) / 100 : 0;
    out.maxLossStreak = maxStreak;
    // Zeit im Markt (näherungsweise, Überlappungen gekappt)
    if (equity.length >= 2 && sorted.length) {
      var span = equity[equity.length - 1][0] - equity[0][0];
      var held = sorted.reduce(function (a, t) { return a + (t.closeT - t.openT); }, 0);
      out.exposurePct = Math.min(100, Math.round(held / span * 100));
    } else out.exposurePct = 0;
    // Sharpe (annualisiert, näherungsweise aus der Equity-Kurve)
    if (equity.length > 10) {
      var rets = [], dts = [];
      for (var i = 1; i < equity.length; i++) {
        if (equity[i - 1][1] > 0) rets.push(equity[i][1] / equity[i - 1][1] - 1);
        dts.push(equity[i][0] - equity[i - 1][0]);
      }
      var avgDt = dts.reduce(function (a, b) { return a + b; }, 0) / dts.length;
      var ppy = avgDt > 0 ? 31557600000 / avgDt : 252;
      var m = rets.reduce(function (a, b) { return a + b; }, 0) / rets.length;
      var sdv = stdev(rets);
      out.sharpe = sdv > 0 ? Math.round(m / sdv * Math.sqrt(ppy) * 100) / 100 : 0;
    } else out.sharpe = 0;
    // Monats- und Jahres-Renditen aus der Equity-Kurve
    var monthly = {}, lastByMonth = {}, order = [];
    equity.forEach(function (p) {
      var d = new Date(p[0]);
      var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      if (!(k in lastByMonth)) order.push(k);
      lastByMonth[k] = p[1];
    });
    var prev = capital;
    order.forEach(function (k) {
      monthly[k] = Math.round((lastByMonth[k] / prev - 1) * 10000) / 100;
      prev = lastByMonth[k];
    });
    out.monthly = monthly;
    return out;
  }
  /** Bootstrap: Trades mit Zurücklegen neu ziehen → Bandbreite plausibler Endkapitale */
  /** Wie gut waere der BESTE von n Versuchen rein zufaellig geworden?
   *
   *  Das ist die Frage, die bei jeder Rasterssuche fehlt und ohne die jeder Fund eine
   *  Behauptung bleibt. Wer 3800 Kombinationen durchprobiert, findet mit Sicherheit
   *  eine, die gut aussieht - auch wenn keine einzige davon etwas kann. Die Frage ist
   *  nicht "ist der Beste positiv", sondern "ist er BESSER, als der Beste von 3800
   *  Zufallsversuchen geworden waere".
   *
   *  Verfahren: Aus den tatsaechlich gemessenen Ergebnissen aller Kandidaten werden
   *  Mittelwert und Streuung geschaetzt. Unter der Annahme "keiner kann etwas" waeren
   *  alle Ergebnisse Ziehungen aus dieser Verteilung, nur ohne systematischen Vorteil -
   *  also um den Mittelwert zentriert. Daraus wird per Simulation die Verteilung des
   *  MAXIMUMS von n solchen Ziehungen gebildet und mit dem echten Besten verglichen.
   *
   *  Bewusst konservativ: Kandidaten aus derselben Zuchtlinie aehneln einander stark,
   *  die WIRKSAME Zahl unabhaengiger Versuche ist also kleiner als n. Damit liegt die
   *  Zufallslatte hier eher zu hoch als zu tief - lieber ein echter Fund faellt durch,
   *  als ein zufaelliger kommt durch.
   *
   *  werte: Ergebnisse ALLER geprueften Kandidaten (z. B. Rendite out-of-sample in %).
   *  Rueckgabe: {n, bester, zufallsMedian, zufallsP95, vorsprung, ueberzufaellig, pWert}
   *  oder null, wenn zu wenige Werte fuer eine Aussage vorliegen. */
  function bestOfN(werte, laeufe) {
    var w = (werte || []).filter(function (v) { return typeof v === 'number' && isFinite(v); });
    if (w.length < 20) return null;                 // unter 20 Versuchen ist die Streuung geraten
    laeufe = laeufe || 2000;
    var n = w.length, i, r;
    var m = 0; for (i = 0; i < n; i++) m += w[i]; m /= n;
    var v = 0; for (i = 0; i < n; i++) v += (w[i] - m) * (w[i] - m);
    var sd = Math.sqrt(v / Math.max(1, n - 1));
    var bester = w[0]; for (i = 1; i < n; i++) if (w[i] > bester) bester = w[i];
    if (!(sd > 0)) return null;

    // Fester Startwert: dieselbe Eingabe ergibt immer dasselbe Urteil.
    var seed = 987654321;
    function rnd() { seed = (Math.imul(seed, 1103515245) + 12345) & 2147483647; return (seed + 1) / 2147483649; }
    function normal() {                              // Box-Muller
      var u1 = rnd(), u2 = rnd();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    var maxima = [], schlagen = 0;
    for (r = 0; r < laeufe; r++) {
      var mx = -Infinity;
      for (i = 0; i < n; i++) { var z = m + sd * normal(); if (z > mx) mx = z; }
      maxima.push(mx);
      if (mx >= bester) schlagen++;
    }
    maxima.sort(function (a, b) { return a - b; });
    var med = maxima[Math.floor(laeufe * 0.5)];
    var p95 = maxima[Math.floor(laeufe * 0.95)];
    return {
      n: n,
      bester: Math.round(bester * 100) / 100,
      zufallsMedian: Math.round(med * 100) / 100,
      zufallsP95: Math.round(p95 * 100) / 100,
      vorsprung: Math.round((bester - med) * 100) / 100,
      ueberzufaellig: bester > p95,                  // schlaegt 95 % der Zufallslaeufe
      pWert: Math.round(schlagen / laeufe * 1000) / 1000
    };
  }

  function bootstrapTrades(trades, capital, runs) {
    if (!trades.length) return null;
    runs = runs || 400;
    var pnls = trades.map(function (t) { return t.pnl; });
    var n = pnls.length, ends = [];
    var seed = 123456789;
    function rnd() { seed = (Math.imul(seed, 1103515245) + 12345) & 2147483647; return seed / 2147483648; }
    for (var r = 0; r < runs; r++) {
      var eq = capital;
      for (var i = 0; i < n; i++) eq += pnls[Math.floor(rnd() * n)];
      ends.push(eq);
    }
    ends.sort(function (a, b) { return a - b; });
    return {
      p5: Math.round(ends[Math.floor(runs * 0.05)]),
      p50: Math.round(ends[Math.floor(runs * 0.5)]),
      p95: Math.round(ends[Math.floor(runs * 0.95)]),
      lossProb: Math.round(ends.filter(function (e) { return e < capital; }).length / runs * 100)
    };
  }

  /* ================= Backtest ================= */
  /**
   * histMap: {SYM: [[t,close],...]} (Tagesdaten, >= ~300 Punkte empfohlen)
   * opts: {capital, weights, openThr, closeThr, budgetPct, sl, tp, maxPos}
   * Ohne historische News: Gewichte werden auf Technik+Elliott renormiert.
   */
  function backtest(histMap, opts) {
    opts = opts || {};
    var capital = opts.capital || 10000;
    var w0 = opts.weights || DEFAULT_WEIGHTS;
    var weights = { tech: w0.tech, elliott: w0.elliott }; // News nicht rückwirkend verfügbar
    var openThr = opts.openThr || 0.35, closeThr = opts.closeThr || 0.15;
    var budgetPct = opts.budgetPct || 0.05, SL = opts.sl || -0.40, TP = opts.tp || 0.80;
    var maxPos = opts.maxPos || 8;

    var syms = Object.keys(histMap);
    // gemeinsame Zeitachse (Tage, an denen mind. 1 Symbol Daten hat) – wir nutzen Index-Iteration je Symbol
    var minLen = Infinity;
    syms.forEach(function (s) { minLen = Math.min(minLen, histMap[s].length); });
    if (minLen < 120 || !syms.length) return { error: 'Zu wenig Historie (mind. 120 Handelstage nötig).' };
    // Datums-Ausrichtung: Vorher wurden die Serien per INDEX vom Ende her übereinandergelegt –
    // bei Feiertagslücken oder ungleich langen Historien bekam ein Signal vom Tag X die Kurse
    // vom Tag Y. Jetzt läuft ein gemeinsamer Kalender, jedes Symbol hat einen eigenen Zeiger.
    var zeitSet = {};
    syms.forEach(function (s) { histMap[s].forEach(function (p) { zeitSet[p[0]] = 1; }); });
    var kalender = Object.keys(zeitSet).map(Number).sort(function (a, b) { return a - b; });
    var zeiger = {};
    syms.forEach(function (s) { zeiger[s] = -1; });
    function ruecke(s, t) {
      var arr = histMap[s], c = zeiger[s];
      while (c + 1 < arr.length && arr[c + 1][0] <= t) c++;
      zeiger[s] = c;
      return c;
    }
    function spotVon(s) { var c = zeiger[s]; return c >= 0 ? histMap[s][c][1] : null; }

    var cash = capital, positions = [], trades = [], equity = [];
    var stats = { tech: { r: 0, w: 0 }, elliott: { r: 0, w: 0 } };
    var start = 70;

    function closePos(pos, spot, t, why) {
      var bid = warrantBid(pos.dir, pos.w, spot, t);
      var pnl = (bid - pos.entry) * pos.qty;
      cash += bid * pos.qty;
      var win = pnl > 0;
      ['tech', 'elliott'].forEach(function (src) {
        var sc = pos.sources[src];
        if (Math.abs(sc) < 0.15) return;
        var agreed = (sc > 0) === (pos.dir === 'call');
        if (agreed === win) stats[src].r++; else stats[src].w++;
      });
      trades.push({ sym: pos.sym, dir: pos.dir, openT: pos.openT, closeT: t, entry: pos.entry, exit: bid, qty: pos.qty, pnl: pnl, why: why });
    }

    for (var i = 0; i < kalender.length; i++) {
      var t = kalender[i];
      syms.forEach(function (s) { ruecke(s, t); });
      // Aufwärmphase: erst handeln, wenn genug Historie hinter dem Kalendertag liegt
      if (i < start) { continue; }

      // Positionen bewerten / schließen – jedes Symbol zu SEINEM letzten Kurs bis t
      for (var pi = positions.length - 1; pi >= 0; pi--) {
        var pos = positions[pi];
        var spot = spotVon(pos.sym);
        if (spot == null) continue;
        var bid = warrantBid(pos.dir, pos.w, spot, t);
        var ret = bid / pos.entry - 1;
        var daysLeft = (pos.w.expiry - t) / 86400000;
        var why = null;
        if (ret <= SL) why = 'Stop-Loss';
        else if (ret >= TP) why = 'Take-Profit';
        else if (daysLeft <= 10) why = 'Zeit-Exit (Restlaufzeit)';
        if (why) { closePos(pos, spot, t, why); positions.splice(pi, 1); }
      }

      // Neue Signale (alle 2 Tage rechnen, spart Zeit, verhält sich wie 2-Tages-Rhythmus)
      if (i % 2 === 0) {
        for (var si = 0; si < syms.length; si++) {
          var sym = syms[si];
          var full = histMap[sym];
          if (zeiger[sym] < 70) continue;              // dieses Symbol hat noch zu wenig eigene Historie
          if (full[zeiger[sym]][0] !== t) continue;    // heute kein Handel (Feiertag/Lücke): kein frisches Signal
          var upto = full.slice(0, zeiger[sym] + 1);
          var spot2 = upto[upto.length - 1][1];
          var tech = technical(upto);
          var ell = elliott(upto.slice(-260));
          var S = combine({ tech: tech.score, elliott: ell.score }, weights);
          var open = null;
          for (var pj = 0; pj < positions.length; pj++) if (positions[pj].sym === sym) open = positions[pj];
          if (open) {
            var oppose = (open.dir === 'call' && S < -closeThr) || (open.dir === 'put' && S > closeThr);
            if (oppose) {
              closePos(open, spot2, t, 'Gegensignal (Score ' + S.toFixed(2) + ')');
              positions.splice(positions.indexOf(open), 1);
            }
          } else if (Math.abs(S) >= openThr && positions.length < maxPos) {
            var dir = S > 0 ? 'call' : 'put';
            var vol = histVol(upto.map(function (p) { return p[1]; }), 30);
            var w = makeWarrant(dir, spot2, vol, t);
            var ask = warrantAsk(dir, w, spot2, t);
            var equityNow = cash + positions.reduce(function (a, p) {
              var spP = spotVon(p.sym); return a + (spP != null ? warrantBid(p.dir, p.w, spP, t) * p.qty : 0);
            }, 0);
            var qty = Math.floor((equityNow * budgetPct) / ask);
            if (qty >= 1 && cash >= qty * ask) {
              cash -= qty * ask;
              positions.push({ sym: sym, dir: dir, w: w, qty: qty, entry: ask, openT: t, sources: { tech: tech.score, elliott: ell.score } });
            }
          }
        }
      }

      // Equity-Kurve
      var eq = cash;
      positions.forEach(function (p) {
        var spQ = spotVon(p.sym);
        if (spQ != null) eq += warrantBid(p.dir, p.w, spQ, t) * p.qty;
      });
      equity.push([t, eq]);
    }
    // Offene Positionen zum Schluss glattstellen
    positions.forEach(function (p) {
      var sr = histMap[p.sym];
      closePos(p, sr[sr.length - 1][1], sr[sr.length - 1][0], 'Backtest-Ende');
    });

    var wins = trades.filter(function (tr) { return tr.pnl > 0; }).length;
    var final = equity.length ? equity[equity.length - 1][1] : capital;
    var peak = -Infinity, mdd = 0;
    equity.forEach(function (e) { peak = Math.max(peak, e[1]); mdd = Math.max(mdd, (peak - e[1]) / peak); });
    var summary = {
      start: capital, end: Math.round(final * 100) / 100,
      retPct: Math.round((final / capital - 1) * 10000) / 100,
      nTrades: trades.length, winRate: trades.length ? Math.round(wins / trades.length * 1000) / 10 : 0,
      maxDrawdownPct: Math.round(mdd * 1000) / 10,
      feesTotal: 0
    };
    Object.assign(summary, computeStats(equity, trades, capital));
    return { equity: equity, trades: trades, stats: stats, summary: summary, bootstrap: bootstrapTrades(trades, capital) };
  }

  /* ================= Intraday: MA-Durchbruch ================= */
  /**
   * Erkennt einen frischen Durchbruch des Kurses durch die EMA auf Intraday-Bars.
   * series: [[t, close]] (z. B. 5-Min-Bars), period: EMA-Periode,
   * confirmBps: Mindestabstand jenseits der EMA in Basispunkten (Whipsaw-Schutz).
   * Rückgabe: {crossed: 'up'|'down'|null, above, ma, price, distBps}
   */
  function crossCore(closes, line, confirmBps, lookback, minIdx) {
    var n = closes.length;
    if (n < minIdx + 3) return { crossed: null, above: null, ma: null, price: closes[n - 1] || null, distBps: 0 };
    var price = closes[n - 1], ma = line[n - 1];
    var conf = confirmBps / 10000;
    var distBps = (price / ma - 1) * 10000;
    // Durchbruch: Kurs steht JETZT klar jenseits der Leitlinie (Bestätigungsschwelle)
    // und war innerhalb der letzten Bars noch auf der anderen Seite.
    var K = (lookback || 3) + 3;
    var wasAbove = false, wasBelow = false;
    for (var j = n - 2; j >= Math.max(minIdx, n - 1 - K); j--) {
      if (closes[j] >= line[j]) wasAbove = true;
      if (closes[j] <= line[j]) wasBelow = true;
    }
    var crossed = null;
    if (price > ma * (1 + conf) && wasBelow) crossed = 'up';
    else if (price < ma * (1 - conf) && wasAbove) crossed = 'down';
    return { crossed: crossed, above: price > ma, ma: ma, price: price, distBps: Math.round(distBps * 10) / 10 };
  }

  /** VWAP-Linie mit Tages-Reset. bars: [t, close, volumen] – ohne Volumen: null */
  function vwapLine(bars) {
    if (!bars.length || bars[0].length < 3) return null;
    var line = [], pv = 0, vv = 0, day = null;
    for (var i = 0; i < bars.length; i++) {
      var d = new Date(bars[i][0]).toISOString().slice(0, 10);
      if (d !== day) { day = d; pv = 0; vv = 0; }
      var v = bars[i][2] || 0;
      pv += bars[i][1] * v; vv += v;
      line.push(vv > 0 ? pv / vv : bars[i][1]);
    }
    return line;
  }

  /** Durchbruch-Signal an wählbarer Leitlinie: 'ema' oder 'vwap' (Fallback EMA) */
  function signalCross(bars, lineType, period, confirmBps, lookback) {
    var closes = bars.map(function (p) { return p[1]; });
    var line = lineType === 'vwap' ? vwapLine(bars) : null;
    if (!line) line = emaSeries(closes, period);
    return crossCore(closes, line, confirmBps === undefined ? 15 : confirmBps, lookback || 3, period);
  }

  /** RSI(2)-Extrem (nach Larry Connors): Der 2-Perioden-RSI ist extrem überverkauft (<= 10)
   *  im Aufwärtstrend -> Call (Kauf der kurzfristigen Schwäche); >= 90 im Abwärtstrend -> Put.
   *  Eines der meistgetesteten Mean-Reversion-Setups überhaupt; hier auf Intraday-Bars mit
   *  EMA100-Richtung als Trendfilter (Original: SMA200 auf Tagesdaten). Bewusst OHNE
   *  Umkehr-Kerzen-Filter - die Regel kauft die Schwäche, der Not-Stop begrenzt das Risiko. */
  function rsiExtremSignal(bars, kaufSchwelle, verkaufSchwelle) {
    kaufSchwelle = kaufSchwelle || 10; verkaufSchwelle = verkaufSchwelle || 90;
    var closes = bars.map(function (p) { return p[1]; });
    var n = closes.length;
    if (n < 120) return { signal: null, wert: null };
    var r2 = rsi(closes, 2);
    if (r2 == null) return { signal: null, wert: null };
    var e100 = emaSeries(closes, 100);
    var steigt = e100[n - 1] > e100[Math.max(0, n - 9)];
    var faellt = e100[n - 1] < e100[Math.max(0, n - 9)];
    var wert = Math.round(r2 * 10) / 10;
    if (steigt && r2 <= kaufSchwelle) return { signal: 'call', wert: wert };
    if (faellt && r2 >= verkaufSchwelle) return { signal: 'put', wert: wert };
    return { signal: null, wert: wert };
  }

  /** Donchian-Kanal-Ausbruch (Turtle-Klassiker): Schlusskurs bricht über das Hoch der
   *  letzten N Bars (ohne den aktuellen) -> Call; unter das Tief -> Put. Der Schlusskurs
   *  muss den Ausbruch tragen ("full-candle commitment"), nicht nur ein Docht.
   *  Nutzt echte Hochs/Tiefs, wenn die Bars sie mitführen. */
  function donchianSignal(bars, N, confirmBps) {
    N = N || 20;
    var n = bars.length;
    if (n < N + 10) return { signal: null, hoch: null, tief: null };
    var conf = (confirmBps === undefined ? 10 : confirmBps) / 10000;
    var hatHL = bars[0].length >= 5 && bars[0][3] != null;
    var hoch = -Infinity, tief = Infinity;
    for (var i = n - 1 - N; i < n - 1; i++) {
      var h = hatHL ? bars[i][3] : bars[i][1];
      var l = hatHL ? bars[i][4] : bars[i][1];
      if (h > hoch) hoch = h;
      if (l < tief) tief = l;
    }
    var schluss = bars[n - 1][1];
    if (schluss > hoch * (1 + conf)) return { signal: 'call', hoch: hoch, tief: tief };
    if (schluss < tief * (1 - conf)) return { signal: 'put', hoch: hoch, tief: tief };
    return { signal: null, hoch: hoch, tief: tief };
  }

  /** Bollinger-Squeeze-Ausbruch: Erst eine echte Kompressionsphase (Bandbreite deutlich
   *  unter ihrem jüngeren Normalmaß), dann ein Schlusskurs jenseits des Bandes ->
   *  Ausbruch in diese Richtung. Die Kompression filtert die Fehlausbrüche, die in ohnehin
   *  hektischen Phasen entstehen. Bandbreiten-Vergleich an Stützstellen statt je Bar -
   *  volle Rolling-Fenster wären im Parameter-Raster unbezahlbar. */
  function squeezeSignal(bars, period, kSigma) {
    period = period || 20; kSigma = kSigma || 2;
    var closes = bars.map(function (p) { return p[1]; });
    var n = closes.length;
    if (n < period + 100) return { signal: null, enge: null };
    function band(endI) {
      var m = sma(closes, period, endI);
      if (m == null) return null;
      var st = stdev(closes.slice(endI - period + 1, endI + 1));
      return { mitte: m, sd: st, breite: m > 0 ? (4 * st) / m : 0 };
    }
    // Kompression am VOR-Bar messen: der Ausbruchs-Bar selbst blaeht die aktuelle
    // Bandbreite auf und wuerde die eigene Kompressions-Bedingung zerstoeren.
    var jetzt = band(n - 2);
    if (!jetzt || jetzt.sd <= 1e-9) return { signal: null, enge: null };
    var refs = [];
    [10, 30, 50, 70, 90].forEach(function (zurueck) {
      var b = band(n - 2 - zurueck);
      if (b) refs.push(b.breite);
    });
    if (refs.length < 4) return { signal: null, enge: null };
    // Vergleich gegen das juengste BREITEN-MAXIMUM (das weite Regime davor): der Median
    // versagt, sobald die Kompression laenger dauert als die halbe Referenzspanne -
    // dann sind die meisten Stuetzstellen selbst schon komprimiert.
    var maxRef = Math.max.apply(null, refs);
    var enge = maxRef > 0 ? Math.round(jetzt.breite / maxRef * 100) / 100 : null;
    // Kompression: aktuelles Band hoechstens 55 % der juengsten Maximalbreite
    if (enge == null || enge > 0.55) return { signal: null, enge: enge };
    var schluss = closes[n - 1];
    if (schluss > jetzt.mitte + kSigma * jetzt.sd) return { signal: 'call', enge: enge };
    if (schluss < jetzt.mitte - kSigma * jetzt.sd) return { signal: 'put', enge: enge };
    return { signal: null, enge: enge };
  }

  /** Trend-Rücksetzer (Pullback): Im laufenden Trend kommt der Kurs an seine Leitlinie
   *  zurück und dreht dort wieder in Trendrichtung – der Klassiker unter den Trendfolge-
   *  Einstiegen. call = Aufwärtstrend (EMA100 steigt), Kurs war klar über der Leitlinie,
   *  berührt sie jetzt und die letzte Kerze dreht bereits wieder nach oben. put spiegelbildlich.
   *  Rückgabe: {signal: 'call'|'put'|null, distBps}. */
  function pullbackSignal(bars, lineType, period, confirmBps) {
    var closes = bars.map(function (p) { return p[1]; });
    var n = closes.length;
    if (n < 120) return { signal: null, distBps: 0 };
    var line = lineType === 'vwap' ? vwapLine(bars) : null;
    if (!line) line = emaSeries(closes, period);
    var e100 = emaSeries(closes, 100);
    var steigt = e100[n - 1] > e100[Math.max(0, n - 9)];
    var faellt = e100[n - 1] < e100[Math.max(0, n - 9)];
    var conf = (confirmBps === undefined ? 15 : confirmBps) / 10000;
    var preis = closes[n - 1], ma = line[n - 1];
    var distBps = Math.round((preis / ma - 1) * 100000) / 10;
    // "War klar auf der Trendseite": VOR dem Rücksetzer, also im Fenster 10-45 Bars zurück -
    // zählte man die letzten Bars mit, steckte der Rücksetzer selbst in der Zählung und
    // machte die Bedingung unerfüllbar.
    // "War klar auf der Trendseite": VOR dem Rücksetzer (10-45 Bars zurück). Gezählt wird
    // die SEITE (über/unter der Linie); ob der Abstand "klar" war, prüft der mittlere
    // Abstand separat - eine feste bps-Schwelle skaliert sonst falsch mit dem Kursniveau.
    var oben = 0, unten = 0, gesamt = 0, distSumme = 0;
    for (var i = Math.max(0, n - 45); i < n - 10; i++) {
      gesamt++;
      if (closes[i] > line[i]) oben++; else if (closes[i] < line[i]) unten++;
      distSumme += Math.abs(closes[i] / line[i] - 1);
    }
    if (gesamt < 25) return { signal: null, distBps: distBps };
    var quorum = Math.ceil(gesamt * 0.85);
    var klar = (distSumme / gesamt) >= 1.5 * conf;   // im Schnitt deutlich von der Linie weg
    // Echte BERÜHRUNG in den letzten 8 Bars: der Kurs muss wirklich an die Linie
    // zurückgekommen sein - sonst gilt jeder gemütliche Trend als Rücksetzer.
    var beruehrtCall = false, beruehrtPut = false;
    for (var j = Math.max(0, n - 8); j < n; j++) {
      if (closes[j] <= line[j] * (1 + conf)) beruehrtCall = true;
      if (closes[j] >= line[j] * (1 - conf)) beruehrtPut = true;
    }
    // Aktuell nicht zu weit durchgetaucht und nicht schon wieder weit weg
    var nahCall = preis <= ma * (1 + 5 * conf) && preis >= ma * (1 - 3 * conf);
    var nahPut = preis >= ma * (1 - 5 * conf) && preis <= ma * (1 + 3 * conf);
    // … und die letzte Kerze dreht bereits zurück in Trendrichtung (kein fallendes Messer)
    if (steigt && oben >= quorum && klar && beruehrtCall && nahCall && closes[n - 1] > closes[n - 2]) return { signal: 'call', distBps: distBps };
    if (faellt && unten >= quorum && klar && beruehrtPut && nahPut && closes[n - 1] < closes[n - 2]) return { signal: 'put', distBps: distBps };
    return { signal: null, distBps: distBps };
  }

  /** Mean-Reversion-Signal: Kurs überdehnt von der Leitlinie entfernt (z-Score der Distanz).
   *  call = überdehnt UNTER der Linie (Rückkehr nach oben erwartet), put = darüber. */
  function reversionSignal(bars, lineType, period, zThr) {
    zThr = zThr || 2;
    var closes = bars.map(function (p) { return p[1]; });
    var n = closes.length;
    if (n < Math.max(period, 60) + 5) return { signal: null, z: 0 };
    var line = lineType === 'vwap' ? vwapLine(bars) : null;
    if (!line) line = emaSeries(closes, period);
    var dists = [];
    for (var i = Math.max(period, n - 80); i < n; i++) dists.push((closes[i] - line[i]) / line[i]);
    if (dists.length < 30) return { signal: null, z: 0 };
    var sd = stdev(dists);
    if (sd <= 1e-8) return { signal: null, z: 0 };
    // Zentriert: In Trends liegt der Kurs systematisch über/unter der Leitlinie –
    // ohne Zentrierung wären Einstiege MIT dem Trend systematisch benachteiligt.
    var dMean = dists.reduce(function (a, b) { return a + b; }, 0) / dists.length;
    var z = (dists[dists.length - 1] - dMean) / sd;
    var signal = z <= -zThr ? 'call' : z >= zThr ? 'put' : null;
    // Umkehr-Bestätigung: nicht ins fallende Messer greifen – die letzte Kerze
    // muss bereits zurück Richtung Leitlinie drehen.
    if (signal === 'call' && !(closes[n - 1] > closes[n - 2])) signal = null;
    if (signal === 'put' && !(closes[n - 1] < closes[n - 2])) signal = null;
    return { signal: signal, z: Math.round(z * 100) / 100, above: closes[n - 1] > line[n - 1], line: line[n - 1] };
  }

  /**
   * Wellen-Qualitäts-Score (0–100): Wie gut ist die aktuelle Welle zum Reiten?
   * Bewertet Rhythmus, Amplitude, Tal-Tiefe, Umkehr-Bestätigung und Volumen.
   * Rückgabe: {score, signal ('call'/'put'/null), z, parts}
   */
  function waveQuality(bars, lineType, period, zThr) {
    var closes = bars.map(function (p) { return p[1]; });
    var n = closes.length;
    var rs = reversionSignal(bars, lineType, period, zThr);
    if (n < 120) return { score: 0, signal: null, z: rs.z || 0, parts: {} };
    // Bar-Rauschen als Referenz
    var rets = logReturns(closes, Math.min(n - 1, 150));
    var sigmaBar = stdev(rets);
    if (sigmaBar <= 1e-8) return { score: 0, signal: null, z: rs.z, parts: {} };
    // Swings der letzten Wellen (ZigZag mit rauschadaptiver Schwelle)
    var thrPct = Math.max(0.03, sigmaBar * 3 * 100);
    var piv = zigzag(bars.slice(-260), thrPct);
    var swings = [], spans = [];
    for (var i = 1; i < piv.length; i++) {
      swings.push(Math.abs(piv[i].p / piv[i - 1].p - 1));
      spans.push(Math.max(1, piv[i].i - piv[i - 1].i));
    }
    swings = swings.slice(-8); spans = spans.slice(-8);
    // Wellenlänge: Median-Abstand zweier Pivots (halbe Welle) × 2
    var waveLen = null;
    if (spans.length >= 3) {
      var sp = spans.slice().sort(function (a, b) { return a - b; });
      waveLen = 2 * sp[Math.floor(sp.length / 2)];
    }
    var rhythm = 0, amp = 0;
    if (swings.length >= 4) {
      var m = swings.reduce(function (a, b) { return a + b; }, 0) / swings.length;
      var cv = m > 0 ? stdev(swings) / m : 1;
      rhythm = Math.max(0, Math.min(1, 1.1 - cv));                 // gleichmäßige Wellen = hoch
      var med = swings.slice().sort(function (a, b) { return a - b; })[Math.floor(swings.length / 2)];
      amp = Math.max(0, Math.min(1, med / (8 * sigmaBar)));        // Welle deutlich größer als Rauschen
    }
    // Tal-Tiefe: überdehnt ja, fallendes Messer nein
    var dz = Math.abs(rs.z || 0);
    var depth = dz >= zThr ? Math.max(0, Math.min(1, 0.5 + (dz - zThr) / 1.5)) : 0;
    if (dz > zThr * 2.5) depth *= 0.4; // extrem = eher Nachricht/Absturz als Welle
    // Umkehr: 1 Kerze (Pflicht im Signal) = 0.6, zwei Kerzen in Umkehrrichtung = 1
    var turn = 0;
    if (rs.signal) {
      turn = 0.6;
      if (rs.signal === 'call' && closes[n - 2] > closes[n - 3]) turn = 1;
      if (rs.signal === 'put' && closes[n - 2] < closes[n - 3]) turn = 1;
    }
    // Volumen der Umkehrkerze vs. Durchschnitt
    var vol = 0.5;
    if (bars[0].length >= 3) {
      var vs = bars.slice(-50).map(function (b) { return b[2] || 0; });
      var va = vs.reduce(function (a, b) { return a + b; }, 0) / vs.length;
      if (va > 0) vol = Math.max(0, Math.min(1, ((bars[n - 1][2] || 0) / va - 0.6) / 1.2));
    }
    var score = Math.round(100 * (0.3 * rhythm + 0.25 * amp + 0.2 * depth + 0.15 * turn + 0.1 * vol));
    return {
      score: score, signal: rs.signal, z: rs.z, waveLen: waveLen,
      parts: { rhythmus: Math.round(rhythm * 100) / 100, amplitude: Math.round(amp * 100) / 100, tiefe: Math.round(depth * 100) / 100, umkehr: turn, volumen: Math.round(vol * 100) / 100 }
    };
  }

  /**
   * Übernacht-Sprünge aus einer Bar-Serie herausrechnen („degap“):
   * Jeder neue Handelstag wird an den Schluss des Vortags angeglichen, sodass
   * die Regressionsgerade nicht durch Gaps verzerrt wird. Die Intraday-Struktur
   * (Wellen, Steigung innerhalb der Tage) bleibt vollständig erhalten.
   * bars: [t, close, ...] → Rückgabe: reine Schlusskurs-Liste (angepasst).
   */
  function degapCloses(bars) {
    var out = [], offset = 0, lastDay = null, prevClose = null;
    for (var i = 0; i < bars.length; i++) {
      var d = new Date(bars[i][0]).toISOString().slice(0, 10);
      if (lastDay !== null && d !== lastDay && prevClose !== null) {
        offset += bars[i][1] - prevClose; // Gap neutralisieren
      }
      lastDay = d;
      prevClose = bars[i][1];
      out.push(bars[i][1] - offset);
    }
    return out;
  }

  /**
   * Linearer Regressionskanal über die letzten N Schlusskurse.
   * Regressionsgerade + parallele Bänder bei ±2 Residuen-Standardabweichungen.
   * Rückgabe (am letzten Bar) oder null:
   *  mid/upper/lower: Kanalmitte/-ober-/-unterkante, sd: Residuen-Streuung,
   *  pos: Lage des Kurses im Kanal (0 = Unterkante, 1 = Oberkante),
   *  slopePct: Steigung je Bar in % der Kanalmitte,
   *  steep: Kanal-Drift über das ganze Fenster relativ zur halben Kanalbreite
   *         (>1 = klarer Aufwärtskanal, <-1 = klarer Abwärtskanal, ~0 = seitwärts),
   *  widthPct: Kanalbreite in % der Kanalmitte.
   */
  /** Varianzverhältnis der Residuen: Schwankt der Kurs um die Gerade herum (Kanal)
   *  oder läuft er einfach weg (Zufallspfad)? Werte deutlich unter 1 = Rückkehr zur Mitte.
   *  Ohne diesen Test hält man jeden Zufallspfad für einen Trendkanal – der klassische Fehler. */
  function varianceRatio(res, k) {
    var n = res.length, i;
    if (n < k + 10 || k < 2) return 1;
    var d1 = [], dk = [];
    for (i = 1; i < n; i++) d1.push(res[i] - res[i - 1]);
    for (i = k; i < n; i++) dk.push(res[i] - res[i - k]);
    function vari(a) {
      var m = 0, j; for (j = 0; j < a.length; j++) m += a[j]; m /= a.length;
      var v = 0; for (j = 0; j < a.length; j++) v += (a[j] - m) * (a[j] - m);
      return v / Math.max(1, a.length - 1);
    }
    var v1 = vari(d1);
    if (v1 <= 1e-14) return 1;
    return (vari(dk) / k) / v1;
  }

  /** Stärkste negative Autokorrelation der Residuen: erkennt eine echte Schwingung
   *  zwischen den Kanten. Ein Zufallspfad hat das nicht – er wandert, er schwingt nicht. */
  function minAutoCorr(res, lagMin, lagMax) {
    var n = res.length, i, L;
    if (n < 30) return 0;
    var m = 0; for (i = 0; i < n; i++) m += res[i]; m /= n;
    var v = 0; for (i = 0; i < n; i++) v += (res[i] - m) * (res[i] - m);
    if (v <= 1e-14) return 0;
    var mn = 1;
    for (L = lagMin; L <= lagMax; L += 2) {
      var sum = 0;
      for (i = 0; i + L < n; i++) sum += (res[i] - m) * (res[i + L] - m);
      var rho = sum / v;
      if (rho < mn) mn = rho;
    }
    return mn;
  }

  /** Übernacht-Sprünge auch für Hoch/Tief herausrechnen (falls vorhanden). */
  function degapBars(bars) {
    var out = { closes: [], highs: null, lows: null };
    var hasHL = bars.length > 0 && bars[0].length >= 5 && bars[0][3] != null;
    if (hasHL) { out.highs = []; out.lows = []; }
    var offset = 0, lastDay = null, prevClose = null;
    for (var i = 0; i < bars.length; i++) {
      var d = new Date(bars[i][0]).toISOString().slice(0, 10);
      if (lastDay !== null && d !== lastDay && prevClose !== null) offset += bars[i][1] - prevClose;
      lastDay = d; prevClose = bars[i][1];
      out.closes.push(bars[i][1] - offset);
      if (hasHL) { out.highs.push(bars[i][3] - offset); out.lows.push(bars[i][4] - offset); }
    }
    return out;
  }

  /** Entzerrte Bars als fertiges Array [t, close, vol, high, low] – für die Kanal-Erkennung. */
  function degapBarArray(bars) {
    var dg = degapBars(bars);
    var out = new Array(bars.length);
    for (var i = 0; i < bars.length; i++) {
      out[i] = [bars[i][0], dg.closes[i], bars[i][2],
        dg.highs ? dg.highs[i] : dg.closes[i], dg.lows ? dg.lows[i] : dg.closes[i]];
    }
    out.versatz = bars.length ? bars[bars.length - 1][1] - dg.closes[bars.length - 1] : 0;
    return out;
  }

  /** Ein einzelner Kanal-Fit über N Bars, endend bei endI.
   *  Mitgeliefert werden Güte (R²), Steigungs-Signifikanz, Kanten-Berührungen und das
   *  Varianzverhältnis – ohne diese Angaben ist ein Regressionskanal nur eine Linie
   *  durch beliebige Punkte, die auch jeden Zufallspfad umschließt.
   *  opt.highs / opt.lows: Wenn vorhanden, werden die Kanten an echten Hochs und Tiefs
   *  ausgerichtet statt nur an Schlusskursen – so, wie man einen Kanal von Hand zeichnet. */
  function channelFit(closes, N, endI, opt) {
    opt = opt || {};
    var qOut = opt.qOut === undefined ? 0.05 : opt.qOut;
    if (endI === undefined) endI = closes.length - 1;
    if (N < 20 || endI + 1 < N) return null;
    var x0 = endI - N + 1;
    var sx = 0, sy = 0, sxx = 0, sxy = 0, i, y;
    for (i = 0; i < N; i++) { y = closes[x0 + i]; sx += i; sy += y; sxx += i * i; sxy += i * y; }
    var den = N * sxx - sx * sx;
    if (!den) return null;
    var b = (N * sxy - sx * sy) / den;
    var a = (sy - b * sx) / N;
    var mean = sy / N;
    var ssRes = 0, ssTot = 0, res = new Array(N);
    for (i = 0; i < N; i++) {
      var r = closes[x0 + i] - (a + b * i);
      res[i] = r; ssRes += r * r;
      var dm = closes[x0 + i] - mean; ssTot += dm * dm;
    }
    var mid = a + b * (N - 1);
    if (mid <= 0 || ssTot <= 1e-12) return null;
    var sd = Math.sqrt(ssRes / Math.max(1, N - 2));
    if (sd <= 1e-9) return null;
    var r2 = Math.max(0, 1 - ssRes / ssTot);
    var sxxC = sxx - sx * sx / N;
    var seB = Math.sqrt((ssRes / Math.max(1, N - 2)) / Math.max(1e-12, sxxC));
    var tSlope = seB > 0 ? b / seB : 0;

    // Residuen für die Kanten: bevorzugt Hochs (oben) und Tiefs (unten)
    var resHi = res, resLo = res, hasHL = false;
    if (opt.highs && opt.lows && opt.highs.length === closes.length) {
      resHi = []; resLo = []; hasHL = true;
      for (i = 0; i < N; i++) {
        resHi.push(opt.highs[x0 + i] - (a + b * i));
        resLo.push(opt.lows[x0 + i] - (a + b * i));
      }
    }
    function quant(arr, f) {
      var srt = arr.slice().sort(function (p1, p2) { return p1 - p2; });
      var idx = (srt.length - 1) * f, lo = Math.floor(idx), hi = Math.ceil(idx);
      return srt[lo] + (srt[hi] - srt[lo]) * (idx - lo);
    }
    var upOff = Math.max(quant(resHi, 1 - qOut), 0.25 * sd);
    var loOff = Math.min(quant(resLo, qOut), -0.25 * sd);

    // Berührungen und Seitenwechsel: Ein Kanal lebt davon, dass beide Kanten
    // mehrfach angelaufen werden – abwechselnd, nicht nur einmal am Rand entlang.
    var tU = 0, tL = 0, alt = 0, lastSide = 0;
    for (i = 0; i < N; i++) {
      var side = 0;
      if (resHi[i] >= 0.75 * upOff) { tU++; side = 1; }
      else if (resLo[i] <= 0.75 * loOff) { tL++; side = -1; }
      if (side && side !== lastSide) { if (lastSide) alt++; lastSide = side; }
    }
    var vr = varianceRatio(res, Math.max(5, Math.round(N / 8)));
    // Nur wenn das Varianzverhältnis allein nicht überzeugt, zusätzlich auf Schwingung prüfen
    // (spart Rechenzeit im Backtest, wo das je Bar läuft).
    var acf = vr <= (opt.vrGate === undefined ? 0.35 : opt.vrGate)
      ? -1
      : minAutoCorr(res, Math.max(5, Math.round(N / 25)), Math.round(N / 2));

    var upper = mid + upOff, lower = mid + loOff;
    if (upper - lower <= 1e-9) return null;
    var price = closes[endI];
    var slopeTot = (b * N) / (upper - lower);
    return {
      N: N, mid: mid, upper: upper, lower: lower, sd: sd, hl: hasHL,
      b: b, upOff: upOff, loOff: loOff,
      r2: Math.round(r2 * 1000) / 1000,
      vr: Math.round(vr * 1000) / 1000,
      t: Math.round(tSlope * 10) / 10,
      touchUp: tU, touchLo: tL, wechsel: alt,
      acf: Math.round(acf * 100) / 100,
      pos: Math.round((price - lower) / (upper - lower) * 1000) / 1000,
      slopePct: Math.round(b / mid * 100 * 10000) / 10000,
      steep: Math.round(slopeTot * 100) / 100,
      widthPct: Math.round((upper - lower) / mid * 100 * 100) / 100,
      toUpperPct: Math.round((upper - price) / price * 100 * 100) / 100,
      toLowerPct: Math.round((price - lower) / price * 100 * 100) / 100
    };
  }

  /** Mindestanforderungen an einen brauchbaren Kanal. Bewusst streng:
   *  Ein Kanal, der alles umschließt, sagt nichts vorher.
   *  Gegen Zufallspfade kalibriert: ~10 % Fehlalarm, echte Kanäle werden zu 67–99 % erkannt.
   *  R² ist bewusst KEINE Hürde – ein Seitwärtskanal hat naturgemäß ein R² nahe null und ist
   *  trotzdem ein gültiger Kanal. Entscheidend ist die Rückkehr zur Mitte (Varianzverhältnis). */
  var CHAN_MIN = { r2: 0, touch: 2, wechsel: 3, vr: 0.35, acf: -0.65, tSlope: 2.0, minN: 100, maxN: 320 };

  /** Gültig ist ein Kanal, wenn beide Kanten mehrfach und abwechselnd angelaufen wurden
   *  UND der Kurs nachweislich zur Mitte zurückkehrt (Varianzverhältnis) oder sauber
   *  zwischen den Kanten schwingt (negative Autokorrelation). */
  function channelValid(f, min) {
    min = min || CHAN_MIN;
    if (!f) return false;
    var struktur = f.N >= min.minN && f.touchUp >= min.touch && f.touchLo >= min.touch && f.wechsel >= min.wechsel;
    var dynamik = f.vr <= min.vr || f.acf <= min.acf;
    return struktur && dynamik && f.r2 >= min.r2;
  }

  /** Sucht das Fenster, das die aktuelle Struktur am besten beschreibt – statt eines starren Werts.
   *  Nach einem Regimewechsel gewinnt automatisch ein kürzeres Fenster, weil der lange Fit
   *  dann durchfällt. Gibt null zurück, wenn kein Fenster überzeugt – dann gibt es eben keinen Kanal. */
  function bestChannel(closes, endI, opt) {
    opt = opt || {};
    var min = opt.min || CHAN_MIN;
    if (endI === undefined) endI = closes.length - 1;
    var maxN = Math.min(opt.maxN || min.maxN, endI + 1);
    var minN = opt.minN || min.minN;
    if (maxN < minN) return null;
    var cand = [100, 130, 170, 220, 280, 320];
    var best = null, bestScore = -1, tried = 0;
    for (var k = 0; k < cand.length; k++) {
      var N = cand[k];
      if (N < minN || N > maxN) continue;
      var f = channelFit(closes, N, endI, opt);
      if (!f) continue;
      tried++;
      if (!channelValid(f, min)) continue;
      // Güte zählt, Länge gibt einen leichten Bonus: ein langer guter Kanal trägt weiter.
      var score = Math.max(1 - f.vr, -f.acf) * Math.pow(N / minN, 0.2);
      if (score > bestScore) { bestScore = score; best = f; }
    }
    if (!best) return null;
    best.trend = (best.t >= min.tSlope && best.steep > 0.3) ? 'up'
      : (best.t <= -min.tSlope && best.steep < -0.3) ? 'down' : 'flat';
    best.quality = Math.max(0, Math.min(100, Math.round(
      50 * Math.min(1, Math.max((min.vr - best.vr) / min.vr, (best.acf - min.acf) / (-1 - min.acf))) + // Rückkehr zur Mitte bzw. Schwingung
      25 * Math.min(1, best.wechsel / 8) +                      // wie oft wechselt er zwischen den Kanten
      15 * Math.min(1, (best.touchUp + best.touchLo) / 12) +    // wie oft werden die Kanten angelaufen
      10 * Math.min(1, best.N / 220)                            // wie tragfähig ist das Fenster
    )));
    best.geprueft = tried;
    return best;
  }

  /** Abwärtskompatibel: fester Fensterkanal ohne Güteprüfung (nur noch für Altaufrufe). */
  function regressionChannel(closes, N, endI) {
    return channelFit(closes, N || 120, endI);
  }

  /* ================= Trendkanal nach Chart-Technik =================
   * Nicht mehr eine Regressionsgerade mit Bändern, sondern das, was ein Chartist zeichnet:
   * Wendepunkte suchen, Geraden durch die tatsächlichen Hochs und Tiefs legen, Berührungen
   * zählen, Verletzungen bestrafen – und am Ende Aufwärtskanal, Abwärtskanal, Seitwärts-
   * korridor und Keil unterscheiden, samt Ausbruch. Gegen Zufallsdaten kalibriert. */

  /** Mittlere Spannweite je Bar – Maßstab für „nah genug an der Linie". */
  function spannweite(H, L, C) {
    var n = C.length, sum = 0, k = 0, i;
    if (H && L) { for (i = 0; i < n; i++) { sum += H[i] - L[i]; k++; } }
    if (!(sum > 0)) { // Close-only-Daten: H/L fehlen oder sind nur kopierte Closes
      sum = 0; k = 0;
      for (i = 1; i < n; i++) { sum += Math.abs(C[i] - C[i - 1]); k++; }
    }
    return k ? sum / k : 0;
  }

  /** k-kleinster bzw. k-größter Wert ohne vollständiges Sortieren – im Backtest läuft das
   *  je Einstiegskandidat, deshalb lohnt die Abkürzung. */
  function kSmallest(arr, k) {
    var buf = [], i, j;
    for (i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (buf.length < k) { buf.push(v); buf.sort(function (a, b) { return a - b; }); }
      else if (v < buf[k - 1]) { buf[k - 1] = v; for (j = k - 1; j > 0 && buf[j] < buf[j - 1]; j--) { var t = buf[j]; buf[j] = buf[j - 1]; buf[j - 1] = t; } }
    }
    return buf[buf.length - 1];
  }
  function kLargest(arr, k) {
    var buf = [], i, j;
    for (i = 0; i < arr.length; i++) {
      var v = arr[i];
      if (buf.length < k) { buf.push(v); buf.sort(function (a, b) { return b - a; }); }
      else if (v > buf[k - 1]) { buf[k - 1] = v; for (j = k - 1; j > 0 && buf[j] > buf[j - 1]; j--) { var t2 = buf[j]; buf[j] = buf[j - 1]; buf[j - 1] = t2; } }
    }
    return buf[buf.length - 1];
  }

  /** Stand der Rechengrundlage. Wird hochgezählt, sobald sich etwas ändert, das alte
   *  Backtest-Ergebnisse ungültig macht (z. B. die Vola-Skalierung in 7.10). Die Farm
   *  verwirft dann ihren Champion-Nachweis und lässt ihn neu antreten. */
  var RECHENSTAND = 10;  // v8.23.13: Stempel-Kerzen aus der Messbasis entfernt (Yahoo-Quote-Stempel
                         // lagen als Pseudo-Kerzen im Archiv; alte Messergebnisse darauf sind ungueltig)

  var KANAL_MIN = { touchJeSeite: 3, dichte: 2.5, wechsel: 2, deckung: 0.90, enge: 0.85, vr: 0.35, acf: -0.65, score: 50 };

  /** Kanal-Erkennung: Der Chart wird gedanklich so lange gedreht, bis das Kursband am
   *  schmalsten liegt – genau das tut ein Chartist, wenn er zwei parallele Linien anlegt.
   *  Entscheidend für die Gültigkeit ist danach, ob das Band SCHMALER ist, als es ein
   *  Zufallspfad gleicher Schwankung hergeben würde. Sonst ist es kein Kanal, nur ein Rahmen.
   *  bars: [t, close, vol, high?, low?] */
  function trendChannel(bars, opt) {
    opt = opt || {};
    var min = opt.min || KANAL_MIN;
    var nAll = bars.length;
    if (nAll < 50) return null;
    var fenster = (opt.fenster || [60, 90, 130, 180, 250]).filter(function (w) { return w <= nAll; });
    if (!fenster.length) return null;
    var hatHL = bars[0].length >= 5 && bars[0][3] != null;
    var best = null;
    for (var fi = 0; fi < fenster.length; fi++) {
      var N = fenster[fi];
      var sl = bars.slice(nAll - N);
      // Die letzten Bars fließen NICHT in die Linienlage ein. Sonst wandert der Kanal mit dem
      // Kurs mit und ein Ausbruch wäre per Konstruktion unsichtbar.
      var puffer = opt.puffer === undefined ? 3 : opt.puffer;
      var NF = N - puffer;
      if (NF < 40) continue;
      var C = sl.map(function (b) { return b[1]; });
      var H = hatHL ? sl.map(function (b) { return b[3]; }) : C;
      var L = hatHL ? sl.map(function (b) { return b[4]; }) : C;
      var i, k;
      // Schwankung je Bar – daraus folgt, wie breit ein Zufallspfad dieses Fenster füllen würde
      var d1 = [];
      for (i = 1; i < NF; i++) d1.push(C[i] - C[i - 1]);
      var mD = 0; for (i = 0; i < d1.length; i++) mD += d1[i]; mD /= Math.max(1, d1.length);
      var vD = 0; for (i = 0; i < d1.length; i++) vD += (d1[i] - mD) * (d1[i] - mD);
      var sigma = Math.sqrt(vD / Math.max(1, d1.length - 1));
      if (!(sigma > 0)) continue;
      var erwartet = sigma * Math.sqrt(NF) * 1.9;    // typische Spannweite eines Zufallspfads
      var atr = spannweite(H, L, C);
      // Kandidaten-Steigungen: Regressionssteigung plus ein Fächer darum herum
      var sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (i = 0; i < NF; i++) { sx += i; sy += C[i]; sxx += i * i; sxy += i * C[i]; }
      var den = NF * sxx - sx * sx;
      var mReg = den ? (NF * sxy - sx * sy) / den : 0;
      var spanne = (erwartet / NF) * 2.2;
      var kand = [];
      for (k = -7; k <= 7; k++) kand.push(mReg + spanne * (k / 7));
      var bestF = null;
      for (k = 0; k < kand.length; k++) {
        var m = kand[k];
        var rU = [], rO = [];
        for (i = 0; i < NF; i++) { rU.push(L[i] - m * i); rO.push(H[i] - m * i); }
        var kq = Math.max(1, Math.round(NF * 0.02));
        var offU = kSmallest(rU, kq), offO = kLargest(rO, kq);
        var br = offO - offU;
        if (!(br > 0)) continue;
        if (!bestF || br < bestF.br) bestF = { m: m, offU: offU, offO: offO, br: br };
      }
      if (!bestF) continue;
      var breite = bestF.br;
      var tol = Math.max(0.45 * atr, 0.07 * breite);
      // Berührungen (zusammenhängende Bars an einer Kante zählen als EINE Berührung),
      // Deckung und – entscheidend – wie oft der Kurs von einer Kante zur anderen wandert.
      var tU = 0, tO = 0, drin = 0, minU = 1e9, maxU = -1, minO = 1e9, maxO = -1, viol = 0;
      var letzteSeite = 0, wechsel = 0, vorSeite = 0;
      for (i = 0; i < NF; i++) {
        var u = bestF.offU + bestF.m * i, o = bestF.offO + bestF.m * i;
        var anU = L[i] <= u + tol, anO = H[i] >= o - tol;
        if (anU && !anO) {
          if (vorSeite !== -1) { tU++; if (i < minU) minU = i; if (i > maxU) maxU = i; }
          if (letzteSeite === 1) wechsel++;
          letzteSeite = -1; vorSeite = -1;
        } else if (anO && !anU) {
          if (vorSeite !== 1) { tO++; if (i < minO) minO = i; if (i > maxO) maxO = i; }
          if (letzteSeite === -1) wechsel++;
          letzteSeite = 1; vorSeite = 1;
        } else vorSeite = 0;
        if (L[i] >= u - tol && H[i] <= o + tol) drin++; else viol++;
      }
      var deckung = drin / NF;
      var enge = breite / erwartet;                  // < 1 heißt: enger als reiner Zufall
      var strU = maxU > minU ? (maxU - minU) / (NF - 1) : 0;
      var strO = maxO > minO ? (maxO - minO) / (NF - 1) : 0;
      var preis = C[N - 1];
      var uEnd = bestF.offU + bestF.m * (N - 1), oEnd = bestF.offO + bestF.m * (N - 1);
      var stMit = bestF.m * NF / breite;
      var typ = stMit > 0.5 ? 'aufwaerts' : stMit < -0.5 ? 'abwaerts' : 'seitwaerts';
      // Ausbruch: jetzt jenseits der Linie, vorher innen
      var ausbruch = null, vorherDrin = true;
      for (k = Math.max(0, NF - 6); k < NF; k++) {
        var uk = bestF.offU + bestF.m * k, ok2 = bestF.offO + bestF.m * k;
        if (C[k] > ok2 + tol || C[k] < uk - tol) vorherDrin = false;
      }
      if (vorherDrin && preis > oEnd + tol) ausbruch = 'oben';
      else if (vorherDrin && preis < uEnd - tol) ausbruch = 'unten';
      // Der harte Test: Kehrt der Kurs innerhalb des Bandes wirklich zur Mitte zurück?
      // Ein Zufallspfad lässt sich immer einrahmen – er pendelt nur nicht.
      var mitte = [], mLine = (bestF.offU + bestF.offO) / 2;
      for (i = 0; i < NF; i++) mitte.push(C[i] - (mLine + bestF.m * i));
      var vr = varianceRatio(mitte, Math.max(5, Math.round(NF / 8)));
      var acf = vr <= 0.35 ? -1 : minAutoCorr(mitte, Math.max(5, Math.round(NF / 25)), Math.round(NF / 2));
      var pendelt = vr <= (min.vr === undefined ? 0.35 : min.vr) || acf <= (min.acf === undefined ? -0.65 : min.acf);
      var touchGes = tU + tO;
      // Berührungsdichte: Wie oft je 100 Bars trägt die schwächere Seite? Ein Zufallspfad
      // streift die Kanten seltener als ein Kurs, der wirklich zwischen ihnen pendelt.
      var dichte = Math.min(tU, tO) / (NF / 100);
      var score = Math.max(0, Math.min(100, Math.round(
        30 * Math.max(0, Math.min(1, Math.max((0.35 - vr) / 0.35, (acf + 0.5) / -0.5))) +  // Rückkehr zur Mitte
        20 * Math.min(1, dichte / 5) +                         // wie dicht die Linien getragen werden
        18 * Math.min(1, (strU + strO) / 1.5) +                // über wie viel Zeit verteilt
        14 * Math.max(0, (deckung - 0.8) / 0.2) +              // wie sauber eingefasst
        10 * Math.min(1, Math.min(tU, tO) / 3) +               // beide Seiten müssen tragen
        8 * Math.min(1, N / 200)                               // Tragfähigkeit des Fensters
      )));
      var gueltig = tU >= min.touchJeSeite && tO >= min.touchJeSeite && dichte >= min.dichte &&
        wechsel >= min.wechsel && deckung >= min.deckung && enge <= min.enge &&
        pendelt && score >= min.score;
      var cand = {
        N: N, typ: typ, gueltig: gueltig, score: score, hl: hatHL,
        unten: uEnd, oben: oEnd, mid: (uEnd + oEnd) / 2,
        mUnten: bestF.m, mOben: bestF.m, cUnten: bestF.offU, cOben: bestF.offO, endI: N - 1,
        touchUnten: tU, touchOben: tO, wechsel: wechsel, dichte: Math.round(dichte * 100) / 100, viol: viol,
        vr: Math.round(vr * 1000) / 1000, acf: Math.round(acf * 100) / 100,
        deckung: Math.round(deckung * 1000) / 1000,
        enge: Math.round(enge * 1000) / 1000,
        streuung: Math.round((strU + strO) / 2 * 100) / 100,
        steigung: Math.round(stMit * 100) / 100,
        breitePct: Math.round(breite / preis * 100 * 100) / 100,
        pos: Math.round((preis - uEnd) / breite * 1000) / 1000,
        zuObenPct: Math.round((oEnd - preis) / preis * 100 * 100) / 100,
        zuUntenPct: Math.round((preis - uEnd) / preis * 100 * 100) / 100,
        ausbruch: ausbruch, tol: tol
      };
      // Auswahl: Gültigkeit zuerst, dann Güte – mit einem Bonus für längere Fenster.
      // Ein kurzes Fenster beschreibt sonst nur ein Bruchstück einer Welle und gewinnt zu leicht.
      cand.rang = (cand.gueltig ? 1000 : 0) + cand.score + 14 * (N / 250);
      if (!best || cand.rang > best.rang) best = cand;
    }
    if (!best) return null;
    best.trend = best.typ === 'aufwaerts' ? 'up' : best.typ === 'abwaerts' ? 'down' : 'flat';
    return best;
  }

  /** Kanal auf einen späteren Bar fortschreiben (Linien laufen weiter). */
  function projectTrendChannel(ref, schritte, preis) {
    if (!ref) return null;
    var i = ref.endI + (schritte || 0);
    var u = ref.cUnten + ref.mUnten * i, o = ref.cOben + ref.mOben * i;
    if (o - u <= 1e-9) return null;
    return { unten: u, oben: o, mid: (u + o) / 2, pos: (preis - u) / (o - u),
      ausbruch: preis > o + ref.tol ? 'oben' : (preis < u - ref.tol ? 'unten' : null) };
  }

  /* ================= Regime-Whitelist (reine Prüf-Logik) =================
   * Lebt hier statt in depot.js, damit die Unit-Tests die ECHTE Funktion prüfen –
   * die gespiegelte Kopie im Test konnte durch Änderungen am Produktcode nie rot werden. */
  /* 'pause' ist ein vollwertiges Setup, kein Sonderfall: Bisher MUSSTE die Regime-Logik
    * eine Handelsart waehlen - "heute passt nichts" war schlicht nicht ausdrueckbar, also
    * wurde im Zweifel Trendfolge gehandelt, auch in einem Markt der weder trendet noch
    * schwingt. Der Ausloeser heisst 'keiner', damit die Whitelist-Pruefung unveraendert
    * greift (Setup -> erlaubte Ausloeser). */
  /* Freigabeliste für die KI-Regimeempfehlung – ABSICHTLICH kürzer als die Liste der
   * von Hand wählbaren Auslöser. Was hier steht, darf die Automatik selbsttätig
   * einstellen; alles andere muss ein Mensch wählen.
   *
   * Nicht enthalten und das mit Absicht: 'ruecksetzer', 'donchian', 'squeeze', 'rsi2'
   * 'rsi2seit' und seit dem 21.08.2026 auch 'kanaltrend'. Sie sind wählbar, aber nicht belegt –
   * 'kanaltrend' kam im ersten Backtest auf 8 Kryptowerten sogar auf −39 % bei einer
   * Gegenprobe von p = 0,86 (Zufall wäre besser gewesen). Ein Modus, der noch gemessen
   * wird, darf sich nicht selbst einschalten. */
  var SETUP_ALLOW = {
    ausbruch: ['kreuzung', 'range'],
    umkehr: ['ueberdehnung', 'welle'],
    pause: ['keiner']
  };
  /** KI-Antwort gegen Whitelist und harte Plausibilitätsregeln prüfen. */
  function regimeValidate(w, f) {
    if (!w || !SETUP_ALLOW[w.setup]) return { ok: false, grund: 'Setup unbekannt' };
    if (SETUP_ALLOW[w.setup].indexOf(w.ausloeser) === -1) return { ok: false, grund: 'Auslöser passt nicht zum Setup' };
    // Pause braucht keinen Zeitrahmen und keine Marktstruktur - es wird ja nicht gehandelt.
    // Die Sperren unten (Umkehr im Trend, Welle ohne Wellen, Range nur frueh) pruefen
    // Handels-Plausibilitaet; auf "nicht handeln" sind sie nicht anwendbar.
    if (w.setup === 'pause') { w.zeitrahmen = w.zeitrahmen || '5m'; w.kanal = false; return { ok: true }; }
    if (['1m', '5m'].indexOf(w.zeitrahmen) === -1) return { ok: false, grund: 'Zeitrahmen unzulässig' };
    // Harte Sperren – die gelten auch dann, wenn das Modell etwas anderes will
    if (w.setup === 'umkehr' && (f.trendAnteilPct >= 70 || f.trendAnteilPct <= 30)) return { ok: false, grund: 'Umkehr im Trendmarkt gesperrt' };
    if (w.ausloeser === 'welle' && f.mittlererWellenScore < 45) return { ok: false, grund: 'Wellental ohne Wellenmuster gesperrt' };
    if (w.ausloeser === 'range' && !(f.minutenSeitEroeffnung != null && f.minutenSeitEroeffnung <= 150)) return { ok: false, grund: 'Eröffnungs-Range nur früh am Tag' };
    // Regel 5 aus dem Prompt war bisher NICHT durchgesetzt: das Modell durfte bei hoher
    // Vola 1m wählen, obwohl 1-Minuten-Signale dann überwiegend Rauschen sind – und genau
    // das tat es auch (gemessen am 19.08.: vola1mPct 0,275 und trotzdem 1m).
    if (w.zeitrahmen === '1m' && f.vola1mPct != null && f.vola1mPct > 0.15) {
      w.zeitrahmen = '5m';
      w.begruendung = (w.begruendung || '') + ' [auf 5m korrigiert: Vola ' + f.vola1mPct + ' über 0,15]';
    }
    if (w.kanal && f.kanalAnteilPct < 20) w.kanal = false;
    return { ok: true };
  }

  /** Bewährungs-Urteil für die Strategie-Farm.
   *  pruefungen: [{champ, hera, trades, sieger}] – jede Prüfung auf Daten, die es bei der
   *  Entstehung des Herausforderers noch nicht gab.
   *  Rückgabe: 'uebernehmen' | 'verwerfen' | 'weiter'.
   *  Bewusst streng: Ein einzelner Sieg ist Zufall, erst die Wiederholung ist ein Argument. */
  function bewaehrungsUrteil(pruefungen, min) {
    min = min || { pruefungen: 3, siege: 2, trades: 15, abbruchNach: 4, maxSiegeAbbruch: 1, spanneStd: 20 };
    var pr = pruefungen || [];
    var siege = 0, sumH = 0, sumC = 0, trades = 0;
    for (var i = 0; i < pr.length; i++) {
      if (pr[i].sieger === 'herausforderer') siege++;
      sumH += pr[i].hera || 0; sumC += pr[i].champ || 0; trades += pr[i].trades || 0;
    }
    // Drei Prüfungen innerhalb weniger Minuten sind KEINE Bewährung – sie laufen auf
    // praktisch denselben Daten. Zwischen erster und letzter Prüfung muss echte Zeit liegen.
    var spanneStd = (pr.length >= 2 && pr[0].at && pr[pr.length - 1].at)
      ? (pr[pr.length - 1].at - pr[0].at) / 3600000 : 0;
    var langGenug = spanneStd >= (min.spanneStd === undefined ? 20 : min.spanneStd);
    if (pr.length >= min.pruefungen && siege >= min.siege && sumH > sumC && trades >= min.trades && langGenug) return 'uebernehmen';
    if (pr.length >= min.abbruchNach && siege <= min.maxSiegeAbbruch) return 'verwerfen';
    return 'weiter';
  }

  /** Kosten-Breakeven-Filter: Kann die typische Bewegung die Handelskosten schlagen?
   *  Rückgabe: {ok, needPct, havePct} – Bewegungen in % des Basiswerts. */
  function edgeCheck(closes, barsInHold, roundTripPct, omega, minEdge) {
    minEdge = minEdge || 1.5;
    var r = logReturns(closes, Math.min(closes.length - 1, 120));
    if (r.length < 30 || !omega || omega <= 0) return { ok: true, needPct: 0, havePct: 0 };
    var perBar = stdev(r);
    var havePct = perBar * Math.sqrt(Math.max(1, barsInHold)) * 100;
    var needPct = (roundTripPct / omega) * 100;
    return { ok: havePct >= needPct * minEdge, needPct: Math.round(needPct * 100) / 100, havePct: Math.round(havePct * 100) / 100 };
  }

  /** Handelszeitfenster – relativ zur tatsächlichen US-Eröffnung, nicht fest in UTC.
   *  Die USA schalten am zweiten Sonntag im März auf Sommerzeit und am ersten Sonntag im
   *  November zurück; die Börse öffnet dann 14:30 statt 13:30 UTC. Feste UTC-Grenzen
   *  verschieben die Fenster im Winter um eine volle Stunde. */
  var WINDOWS = {
    all:    null,
    open2:  [0, 120],      // erste 2 Stunden nach Eröffnung
    open4:  [0, 240],      // erste 4 Stunden
    close2: [270, 390]     // letzte 2 Stunden (Handelstag = 390 Minuten)
  };
  /** Sommerzeit in den USA? (2. Sonntag März – 1. Sonntag November) */
  function usSommerzeit(d) {
    var jahr = d.getUTCFullYear(), m = d.getUTCMonth();
    if (m < 2 || m > 10) return false;
    if (m > 2 && m < 10) return true;
    function nterSonntag(monat, n, stundeUtc) {
      var t = new Date(Date.UTC(jahr, monat, 1));
      var tage = (7 - t.getUTCDay()) % 7 + 1 + (n - 1) * 7;   // 1-basierter Tag des n-ten Sonntags
      return Date.UTC(jahr, monat, tage, stundeUtc, 0);
    }
    if (m === 2) return d.getTime() >= nterSonntag(2, 2, 7);  // Beginn: 2 Uhr EST = 7 UTC
    return d.getTime() < nterSonntag(10, 1, 6);               // Ende: 2 Uhr EDT = 6 UTC
  }
  /** Minuten seit US-Handelsbeginn (negativ vor der Eröffnung). */
  function minutenSeitOeffnung(tMs) {
    var d = new Date(tMs);
    var oeffnung = (usSommerzeit(d) ? 13 : 14) * 60 + 30;
    return d.getUTCHours() * 60 + d.getUTCMinutes() - oeffnung;
  }
  function inWindow(tMs, preset) {
    var w = WINDOWS[preset || 'all'];
    if (!w) return true;
    var m = minutenSeitOeffnung(tMs);
    return m >= w[0] && m < w[1];
  }

  /** Bars auf ein größeres Raster bündeln (z. B. 1m → 5m). bars: [t, close, vol] */
  function resampleBars(bars, k) {
    var out = [];
    for (var i = 0; i < bars.length; i += k) {
      var chunk = bars.slice(i, Math.min(i + k, bars.length));
      var v = 0;
      for (var j = 0; j < chunk.length; j++) v += chunk[j][2] || 0;
      out.push([chunk[chunk.length - 1][0], chunk[chunk.length - 1][1], v]);
    }
    return out;
  }

  /** 5-Min-Bestätigung für 1-Min-Signale: Richtung der EMA20 auf dem gebündelten Chart.
   *  Bei zu wenig Daten wird NICHT blockiert (true). */
  function mtfAgrees(bars, dir, k) {
    var b5 = resampleBars(bars, k || 5);
    if (b5.length < 25) return true;
    var closes = b5.map(function (b) { return b[1]; });
    var e = emaSeries(closes, 20);
    var rising = e[e.length - 1] > e[e.length - 3];
    return dir === 'call' ? rising : !rising;
  }

  /** Einstiegspruefung fuer EINE Kerze - rein aus Kursen, ohne jeden Depotzustand.
   *  Rueckgabe: null (kein Einstieg) oder {dir, chE, chRef, chN}.
   *  P: {ENTRY, LINE, period, confirmBps, ZTHR, MINQ, CHAN, MTF, TREND}
   *  'orb' wird hier NICHT behandelt (haengt am Handelsverlauf, siehe backtestIntraday). */
  function einstiegSignal(bars, ci, P) {
    var spot = bars[ci][1];
    var dir = null;
    var win = bars.slice(Math.max(0, ci - Math.max(P.period * 4, P.CHAN ? 380 : 260)), ci + 1);
    var chE = null, chN = 0, chRef = null;
    if (P.ENTRY === 'wave') {
      var wq = waveQuality(win, P.LINE, P.period, P.ZTHR);
      if (!wq.signal || wq.score < P.MINQ) return null;
      dir = wq.signal;
      if (P.CHAN) {
        var dgE = degapBarArray(win);
        chE = trendChannel(dgE);
        if (!chE || !chE.gueltig) return null;
        chN = chE.N;
        chRef = { kanal: chE, i0: ci, off: dgE[dgE.length - 1][1] - spot };
        if (dir === 'call' && chE.pos > 0.30) return null;
        if (dir === 'put' && chE.pos < 0.70) return null;
        if (dir === 'call' && chE.trend === 'down') return null;
        if (dir === 'put' && chE.trend === 'up') return null;
      }
    } else if (P.ENTRY === 'reversion') {
      var rsig = reversionSignal(win, P.LINE, P.period, P.ZTHR);
      if (!rsig.signal) return null;
      dir = rsig.signal;
    } else if (P.ENTRY === 'pullback') {
      var psig = pullbackSignal(win, P.LINE, P.period, P.confirmBps);
      if (!psig.signal) return null;
      dir = psig.signal;
    } else if (P.ENTRY === 'rsi2') {
      var xsig = rsiExtremSignal(win);
      if (!xsig.signal) return null;
      dir = xsig.signal;
    } else if (P.ENTRY === 'donchian') {
      var dsig = donchianSignal(win, P.period, P.confirmBps);
      if (!dsig.signal) return null;
      dir = dsig.signal;
    } else if (P.ENTRY === 'squeeze') {
      var qsig = squeezeSignal(win, P.period);
      if (!qsig.signal) return null;
      dir = qsig.signal;
    } else if (P.ENTRY === 'rsi2seit') {
      /* RSI(2)-EXTREM NUR IM SEITWÄRTSKANAL, MIT VOLUMENBESTÄTIGUNG.
       *
       * Ergebnis der Bedingungsstudie vom 21.08.2026 (162 Aktien, Stundenkerzen, jedes
       * Signal gekreuzt mit Kanalzustand, EMA100, Volumen und Tageszeit): Unbedingt ist
       * RSI(2) ein Münzwurf (+0,017 Pp). Im SEITWÄRTSKANAL mit Volumenbestätigung wird
       * daraus +0,147 Pp auf 8 Stunden — t = 4,1 ÜBER DIE SYMBOLE (je Wert ein Mittel,
       * damit überlappende Fenster das t nicht aufblasen), beide Zeithälften positiv,
       * 99 von 162 Werten im Plus. Im volatilen Drittel des Universums +0,235 Pp.
       *
       * Warum das inhaltlich stimmt: RSI(2) kauft kurzfristige Übertreibung und braucht
       * die Rückkehr zur Mitte. Die gibt es nur, wo eine Mitte existiert — im
       * Seitwärtskanal. Im Trend ist dieselbe Übertreibung oft der Anfang der nächsten
       * Etappe, und das Signal fängt Messer. Der Kanal liefert also nicht die Richtung,
       * sondern die ERLAUBNIS.
       *
       * Wirtschaftlich: +0,147 Pp liegen UNTER der Scheinhürde (0,21 % auf 8 h), aber
       * ÜBER der Basiswert-Hürde (0,10 %). Dieser Modus gehört auf den Basiswert-Pfad
       * (instrument: 'basis') oder auf das volatile Drittel des Universums. */
      var xs2 = rsiExtremSignal(win);
      if (!xs2.signal) return null;
      var ks2 = null;
      try { ks2 = kanalUeber(bars, Math.max(0, ci - 200), ci); } catch (eK2) { }
      if (!ks2 || ks2.trend !== 'seit') return null;
      // Volumenbestätigung: Signalkerze über dem 1,3-fachen des Schnitts der 50 davor.
      // Mittel ohne die Signalkerze selbst - sonst bestätigt sie sich selbst.
      var vs2 = 0, vn2 = 0;
      for (var vq2 = win.length - 51; vq2 < win.length - 1; vq2++) {
        if (vq2 >= 0) { vs2 += (win[vq2][2] || 0); vn2++; }
      }
      var vAvg2 = vn2 ? vs2 / vn2 : 0;
      if (!(vAvg2 > 0 && (win[win.length - 1][2] || 0) > 1.3 * vAvg2)) return null;
      dir = xs2.signal;
    } else if (P.ENTRY === 'kapitulation') {
      /* KAPITULATIONS-DIP: Ueberdehnung UNTER die Leitlinie IM Abwaertskanal, mit
       * Volumenbestaetigung - nur Long. Zweiter Fund der Bedingungsstudie vom
       * 21.08.2026 (162 Aktien, Stundenkerzen):
       *   Median +0,44 % je Trade nach 10 Bp Kosten, 26 Handelsstunden Horizont,
       *   t = 4,62 UEBER DIE SYMBOLE, 98 von 154 Werten positiv, beide Haelften positiv.
       *
       * EHRLICHE WARNUNG, die zur Regel gehoert: Der Gewinn sitzt im rechten Schwanz.
       * Ohne die besten 5 % der Trades faellt das Mittel UNTER die Drift-Basislinie
       * (+0,72 % -> -0,06 % gegen +0,56 % Drift). Viele kleine Ergebnisse, wenige
       * grosse Erholungen tragen alles. Konsequenz: KEIN Gewinnziel, kein Deckel -
       * wer die Ausreisser kappt, behaelt nur die Messer. Der Zeit-Ausstieg nach 26
       * Handelsstunden ist die ganze Ausstiegsregel.
       *
       * Das Put-Gegenstueck (Blow-off im Aufwaertskanal) ist gemessen und faellt:
       * -0,33 % je Trade, es kaempft gegen die Marktdrift. */
      var rk = reversionSignal(win, P.LINE, P.period, P.ZTHR);
      if (rk.signal !== 'call') return null;
      var kk = null;
      try { kk = kanalUeber(bars, Math.max(0, ci - 200), ci); } catch (eK3) { }
      if (!kk || kk.trend !== 'ab') return null;
      var vsK3 = 0, vnK3 = 0;
      for (var vq3 = win.length - 51; vq3 < win.length - 1; vq3++) {
        if (vq3 >= 0) { vsK3 += (win[vq3][2] || 0); vnK3++; }
      }
      var vAvg3 = vnK3 ? vsK3 / vnK3 : 0;
      if (!(vAvg3 > 0 && (win[win.length - 1][2] || 0) > 1.3 * vAvg3)) return null;
      dir = 'call';
    } else if (P.ENTRY === 'kanaltrend') {
      /* TRENDFOLGE IM KANAL – die entgegengesetzte These zu 'wave' und 'reversion'.
       *
       * Diese beiden kaufen an der Kanalunterkante, weil sie auf eine Rückkehr zur Mitte
       * setzen. Am 21.08.2026 auf 138.648 Krypto-Stundenkerzen gemessen, war das die
       * Verliererseite, und zwar durchgehend über alle Signale:
       *     Kanal: unten kaufen   −0,093 Pp auf 24 Stunden (t = −5,9, n = 70.839)
       *     Rücksetzer            −0,119 Pp
       *     Umkehr zur Linie      −0,064 Pp
       *     Kanal: Trend folgen   +0,071 Pp (t = 5,5, n = 99.337)
       *     Squeeze               +0,135 Pp (t = 4,0)
       * Vier Umkehr-Signale verlieren, drei Trend-Signale gewinnen – kein Einzelausreißer.
       *
       * WICHTIG, was das NICHT heißt: Als handelbare Strategie mit Kosten und auf nicht
       * überlappenden Monaten gerechnet, bleibt von t = 5,5 nur t = 0,46 übrig, und eine
       * zufällige Richtung mit gleicher Haltedauer verdient sogar mehr. Belegt ist die
       * RICHTUNG des Effekts, nicht seine Höhe. Deshalb steht dieser Modus als zusätzliche,
       * einzeln schaltbare Variante neben den anderen – nicht an ihrer Stelle. Er ist zum
       * Messen da, nicht zum Umstellen.
       *
       * Ohne Auslöser wäre der Kanaltrend kein Signal, sondern ein Zustand: Er gilt auf
       * rund 72 % aller Kerzen. Wer bei jeder Kerze neu kauft, zahlt tausendfach Spanne
       * und ist tot, egal wie gut die Richtung stimmt. Die Leitlinien-Kreuzung liefert
       * den fehlenden Auslöser.
       */
      var dgT = degapBarArray(win);
      var chT = trendChannel(dgT);
      if (!chT || !chT.gueltig || chT.ausbruch) return null;
      if (chT.score < P.MINQ) return null;
      if (chT.trend !== 'up' && chT.trend !== 'down') return null;
      var tsig = signalCross(win, P.LINE, P.period, P.confirmBps);
      if (!tsig.crossed) return null;
      var trendDir = chT.trend === 'up' ? 'call' : 'put';
      // Auslöser und Kanal müssen dasselbe sagen – eine Kreuzung GEGEN den Kanal ist
      // genau die Umkehrwette, von der dieser Modus wegführen soll.
      if ((tsig.crossed === 'up' ? 'call' : 'put') !== trendDir) return null;
      dir = trendDir;
      chE = chT; chN = chT.N;
      chRef = { kanal: chT, i0: ci, off: dgT[dgT.length - 1][1] - spot };
    } else {
      var sig = signalCross(win, P.LINE, P.period, P.confirmBps);
      if (!sig.crossed) return null;
      dir = sig.crossed === 'up' ? 'call' : 'put';
    }
    if (P.MTF && !mtfAgrees(win, dir, 5)) return null;
    if (P.TREND && P.ENTRY !== 'reversion') {
      if (chE) {
        if (dir === 'call' && chE.trend === 'down') return null;
        if (dir === 'put' && chE.trend === 'up') return null;
      }
      var trendCloses = bars.slice(Math.max(0, ci - 240), ci + 1).map(function (b) { return b[1]; });
      if (trendCloses.length >= 100) {
        var e100 = emaSeries(trendCloses, 100);
        if (P.ENTRY === 'wave') {
          var rising = e100[e100.length - 1] > e100[Math.max(0, e100.length - 9)];
          if ((dir === 'call' && !rising) || (dir === 'put' && rising)) return null;
        } else {
          var up100 = spot > e100[e100.length - 1];
          if ((dir === 'call' && !up100) || (dir === 'put' && up100)) return null;
        }
      }
    }
    return { dir: dir, chE: chE, chRef: chRef, chN: chN };
  }

  /** Mehrere Varianten in EINEM Durchgang - die Einstiegssignale werden einmal berechnet
   *  und geteilt.
   *
   *  Warum das so viel bringt: Not-Stop, Haltedauer, Schein-Profil und Budget aendern die
   *  Einstiegssignale nicht - nur, was danach mit der Position passiert. Die Zucht probiert
   *  aber 5 Not-Stops x 4 Haltedauern durch, rechnet also zwanzigmal exakt dieselben Signale.
   *  Gemessen sind Signale rund die Haelfte der Rechenzeit eines Backtests; sie einmal statt
   *  zwanzigmal zu berechnen spart also knapp die Haelfte.
   *
   *  basis: gemeinsame Optionen (Signalparameter MUESSEN hier stehen)
   *  varianten: [{sl, maxHoldMin, otmPct, ...}] - was sich je Lauf unterscheidet
   *  Rueckgabe: Array der Einzelergebnisse, in derselben Reihenfolge.
   *
   *  Die Signalvorberechnung greift nicht beim Eroeffnungs-Range-Einstieg (orb): der haengt
   *  am Handelsverlauf und wird je Variante neu bestimmt. */
  function backtestIntradayMulti(histMap, basis, varianten) {
    basis = basis || {};
    varianten = varianten || [{}];
    var entry = basis.entryMode || 'cross';
    if (entry === 'orb' || varianten.length < 2) {
      return varianten.map(function (v) { return backtestIntraday(histMap, Object.assign({}, basis, v)); });
    }
    var P2 = {
      ENTRY: entry,
      LINE: basis.lineType || 'ema',
      period: basis.period || 20,
      confirmBps: basis.confirmBps === undefined ? 15 : basis.confirmBps,
      ZTHR: basis.zThr || 1.5,
      MINQ: basis.minQuality === undefined ? 60 : basis.minQuality,
      CHAN: !!basis.channel,
      MTF: !!basis.mtf,
      TREND: !!basis.trendFilter
    };
    var speicher = {};
    var syms = Object.keys(histMap);
    for (var si = 0; si < syms.length; si++) {
      var bars = histMap[syms[si]];
      var arr = new Array(bars.length);
      // AB DER ERSTEN Kerze. Ein frueherer Versuch startete bei 60 mit der Begruendung,
      // darunter liefere ohnehin keine Signalfunktion etwas - das stimmt fuer die Umkehr
      // (Fenster 260 Kerzen), aber NICHT fuer die EMA-Kreuzung, die schon nach rund 30
      // Kerzen ausloest. Der Gleichheitstest fand prompt neun fehlende Trades. Die paar
      // zusaetzlichen Aufrufe kosten nichts, eine stille Abweichung dagegen alles.
      for (var ci = 0; ci < bars.length; ci++) arr[ci] = einstiegSignal(bars, ci, P2);
      speicher[syms[si]] = arr;
    }
    return varianten.map(function (v) {
      return backtestIntraday(histMap, Object.assign({}, basis, v, { __signale: speicher }));
    });
  }

  /* ================= Zufallsgegenprobe =================
   *
   * Permutationstest auf der HANDELSRICHTUNG. Die Trades bleiben, wie sie sind -
   * gleiche Zeitpunkte, gleiche Haltedauern, gleiche Anzahl. Gewuerfelt wird nur, ob
   * jeder einzelne auf steigende oder fallende Kurse gesetzt haette. Aus vielen
   * solchen Welten entsteht eine Verteilung: "so gut waere Raten gewesen".
   *
   * Liegt das echte Ergebnis mittendrin, hat das Signal keine Richtungsinformation -
   * ganz gleich, wie gut die Ertragskurve aussieht. Genau dieser Fall ist am
   * 21.08.2026 auf Krypto eingetreten.
   *
   * Der Zufall ist absichtlich REPRODUZIERBAR (fester Startwert): zwei Laeufe auf
   * denselben Trades muessen dasselbe Urteil geben, sonst kann man Messungen nicht
   * vergleichen - und die Zucht, die Analyse-Zentrale und der Pruefstand tun genau das.
   */
  function mischer(saat) {
    // xorshift32: klein, schnell, ohne Abhaengigkeit - Math.random() waere nicht wiederholbar
    var z = saat | 0 || 2463534242;
    return function () {
      z ^= z << 13; z ^= z >>> 17; z ^= z << 5;
      return ((z >>> 0) % 100000) / 100000;
    };
  }

  /**
   * Trifft das Signal die Richtung besser als eine Muenze?
   * trades: [{dir, entrySpot, exitSpot}, ...]   laeufe: Zahl der Zufallswelten
   * Rueckgabe: {n, echt, zufallMittel, zufallP95, quote, besserAls, pWert, aussage}
   *   echt         mittlere Bewegung des Basiswerts IN Handelsrichtung, in Prozent
   *   zufallMittel dasselbe, wenn die Richtung gewuerfelt wird
   *   pWert        Anteil der Zufallswelten, die mindestens so gut waren
   */
  function gegenprobeRichtung(trades, laeufe) {
    laeufe = laeufe || 2000;
    // Kursbewegung und Handelsrichtung getrennt halten - die Probe mischt gleich nur
    // die Richtungen, die Bewegungen bleiben, wo sie sind.
    var kurs = [], richtung = [], n = 0;
    for (var i = 0; i < (trades || []).length; i++) {
      var t = trades[i];
      if (!t || !(t.entrySpot > 0) || !(t.exitSpot > 0)) continue;
      kurs.push((t.exitSpot / t.entrySpot - 1) * 100);
      richtung.push(t.dir === 'put' ? -1 : 1);
      n++;
    }
    if (n < 20) return { n: n, zuWenig: true, aussage: 'Zu wenige Trades mit Kursdaten (' + n + ') für eine Gegenprobe.' };
    var mittel = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
    var bew = kurs.map(function (k2, i2) { return k2 * richtung[i2]; });
    var echt = mittel(bew);
    var quote = bew.filter(function (x) { return x > 0; }).length / n;

    /* GEMISCHT, NICHT NEU GEWUERFELT. Ein frueherer Anlauf zog je Trade eine Muenze,
     * also 50 % Call / 50 % Put. Das ist der falsche Vergleichsmassstab: Eine Strategie,
     * die zu 64 % long steht, schlaegt in einem steigenden Markt jede 50/50-Zuteilung -
     * ohne einen einzigen Richtungstreffer, allein durch die Marktneigung. Genau dieser
     * Fall ist am 21.08.2026 auf Krypto aufgetreten.
     * Richtig ist, die VORHANDENEN Richtungen unter den Trades zu vertauschen. Dann hat
     * jede Zufallswelt dieselbe Long-Quote wie das Original, und uebrig bleibt genau die
     * Frage: Sassen die Calls auf den richtigen Trades? */
    var wuerfel = mischer(20260821), welten = [], besser = 0;
    var misch = richtung.slice();
    for (var w = 0; w < laeufe; w++) {
      for (var f = n - 1; f > 0; f--) {          // Fisher-Yates
        var g = Math.floor(wuerfel() * (f + 1));
        var tmp = misch[f]; misch[f] = misch[g]; misch[g] = tmp;
      }
      var s = 0;
      for (var k = 0; k < n; k++) s += misch[k] * kurs[k];
      var m = s / n;
      welten.push(m);
      if (m >= echt) besser++;
    }
    welten.sort(function (a, b) { return a - b; });
    var p = besser / laeufe;
    var aussage;
    if (p <= 0.01) aussage = 'Die Richtung ist deutlich besser als Raten (p = ' + p.toFixed(3) + ').';
    else if (p <= 0.05) aussage = 'Die Richtung ist besser als Raten (p = ' + p.toFixed(3) + ').';
    else if (p >= 0.5) aussage = 'Raten wäre im Mittel BESSER gewesen (p = ' + p.toFixed(2) + '). Das Signal trägt keine Richtungsinformation.';
    else aussage = 'Nicht von Raten zu unterscheiden (p = ' + p.toFixed(2) + '). Kein Beleg für Richtungstreffer.';
    return {
      n: n,
      echt: Math.round(echt * 1000) / 1000,
      zufallMittel: Math.round(mittel(welten) * 1000) / 1000,
      zufallP95: Math.round(welten[Math.floor(laeufe * 0.95)] * 1000) / 1000,
      quote: Math.round(quote * 1000) / 10,
      besserAls: Math.round((1 - p) * 1000) / 10,
      pWert: Math.round(p * 10000) / 10000,
      ueberzufaellig: p <= 0.05,
      aussage: aussage
    };
  }

  /* ================= Altlast: Position aus einer früheren Sitzung? =================
   *
   * Positionen werden nur im Scan geschlossen, und der läuft nur bei offener App UND
   * offener Börse. War die App tagelang zu, lief der Zeitwert des Scheins weiter ab,
   * ohne dass etwas eingriff. In den Daten vom 21.08.2026 gefunden: Trades mit 22 und
   * 23 Tagen Haltedauer auf 60-Tage-Scheinen, Ergebnis −44 % und −41 %; über alle 28
   * geschlossenen Trades stammten 38 % des Verlusts aus reinem Zeitwertverfall.
   *
   * Zwei Kriterien, und das zweite ist das wichtigere:
   *  - Eine KURZFRISTIGE Position, die einen Handelstag überlebt hat, ist keine mehr.
   *    Eine fehlende Strategie-Kennung zählt dazu: Die teuersten Trades im Bestand
   *    (9 Stück, −1.993 $, Median 22,2 Tage) tragen keine, weil sie aus einer älteren
   *    Fassung stammen. Vorsichtig ist hier richtig.
   *  - VERBRAUCHTE LAUFZEIT, unabhängig von der Strategie. Über einem Viertel der
   *    ursprünglichen Scheinlaufzeit ist der Zeitwertverfall spürbar. Die
   *    Stunden-Strategie hält im Median 1,5 Tage; ein Viertel von 60 Tagen sind 15 –
   *    die Schwelle stört den regulären Betrieb nicht.
   *
   * Rückgabe: Grundtext, oder null wenn die Position bleiben darf.
   */
  function altlastGrund(pos, now, opt) {
    if (!pos || !pos.openT) return null;
    opt = opt || {};
    var grenze = opt.anteilLaufzeit === undefined ? 0.25 : opt.anteilLaufzeit;
    now = now || Date.now();
    if (new Date(pos.openT).toISOString().slice(0, 10) === new Date(now).toISOString().slice(0, 10)) return null;
    var tage = Math.round((now - pos.openT) / 86400000 * 10) / 10;
    if (pos.strategy === 'intraday' || !pos.strategy) {
      // Positionen mit Übernacht-Erlaubnis (RSI2-Seitwärts) dürfen eine Nacht überleben -
      // das IST ihre Strategie. Erst über zwei Tagen sind auch sie Altlast.
      if (pos.uebernacht && (now - pos.openT) <= 2 * 86400000) return null;
      return 'kurzfristige Position seit ' + tage + ' Tagen offen';
    }
    var laufzeit = pos.expiry ? (pos.expiry - pos.openT) : 0;
    if (laufzeit > 0 && (now - pos.openT) / laufzeit > grenze) {
      return Math.round((now - pos.openT) / laufzeit * 100) + ' % der Scheinlaufzeit verbraucht';
    }
    return null;
  }

  /* ================= Fingerabdruck einer Schatten-Konfiguration =================
   *
   * Ein Schatten ist nur mit anderen Schatten DERSELBEN Ausstiegsregeln vergleichbar.
   * Am 21.08.2026 stand in der Bilanz ein Urteil, das aus 392 Schatten mit drei Minuten
   * Haltedauer stammte, während die App mit 240 Minuten lief. Bei drei Minuten misst man
   * nichts als die Geld-Brief-Spanne: Median -5,8 % gegen 5,4 % Kosten, Trefferquote 3 %.
   * Die Zahl sah nach Filterwirkung aus und war die Kostenstruktur.
   *
   * Aufgenommen wird nur, was das ERGEBNIS eines Schattens verändert. Der Modusname
   * gehört nicht dazu - zwei Modi mit gleichen Ausstiegsregeln liefern vergleichbare
   * Schatten, und ein reiner Namenswechsel soll die Zählung nicht zurücksetzen.
   */
  function schattenKonfig(mp, cfg) {
    mp = mp || {}; cfg = cfg || {};
    var teile = [
      'x' + (mp.exitMode || '-'),
      'h' + (mp.maxHoldMin || 0),
      's' + (mp.sl === 'auto' ? 'auto' : Math.round((mp.sl || 0) * 100)),
      't' + (mp.tp == null ? '-' : Math.round(mp.tp * 100)),
      'r' + Math.round((mp.trail || 0) * 100),
      'p' + (cfg.profile || '-'),
      'i' + (cfg.interval || '-')
    ];
    return teile.join('_');
  }

  /* ================= Signifikanz aus MONATSERTRÄGEN =================
   *
   * Warum nicht aus den Trades: Bei Haltedauern über mehreren Bars sind fast alle Trades
   * gleichzeitig offen. Ein t-Wert setzt aber UNABHÄNGIGE Beobachtungen voraus; bei
   * Überlappung zählt er dieselbe Marktbewegung dutzendfach und wird dadurch beliebig
   * groß. Am 21.08.2026 auf Krypto nachgemessen: Aus t = 5,5 (je Kerze gerechnet) wurde
   * t = 0,46, sobald man auf nicht überlappende Monate umstellte. Dieselbe Strategie,
   * dieselben Daten – nur ein ehrlicher Nenner.
   *
   * Monatserträge aus der Kapitalkurve überlappen nicht. Der t-Wert daraus bedeutet
   * wieder etwas, und n ist die Zahl der Monate, nicht die der Trades.
   *
   * equity: [[Zeitstempel, Kapital], …]
   */
  function monatsStatistik(equity) {
    if (!equity || equity.length < 3) return null;
    var proMonat = {}, reihenfolge = [];
    for (var i = 0; i < equity.length; i++) {
      var k = new Date(equity[i][0]).toISOString().slice(0, 7);
      if (proMonat[k] === undefined) { proMonat[k] = { erst: equity[i][1], letzt: equity[i][1] }; reihenfolge.push(k); }
      else proMonat[k].letzt = equity[i][1];
    }
    reihenfolge.sort();
    // Der erste Monat beginnt beim Startkapital, jeder weitere beim Schluss des Vormonats.
    // Ohne diese Verkettung fehlt der Ertrag, der über den Monatswechsel entstanden ist.
    var werte = [], vorher = null;
    for (var m = 0; m < reihenfolge.length; m++) {
      var e = proMonat[reihenfolge[m]];
      var basis = vorher === null ? e.erst : vorher;
      if (basis > 0) werte.push((e.letzt / basis - 1) * 100);
      vorher = e.letzt;
    }
    if (werte.length < 3) return { monate: werte.length, zuKurz: true };
    var mittel = werte.reduce(function (a, b) { return a + b; }, 0) / werte.length;
    var varianz = werte.reduce(function (a, b) { return a + (b - mittel) * (b - mittel); }, 0) / (werte.length - 1);
    var t = varianz > 0 ? mittel / Math.sqrt(varianz / werte.length) : 0;
    return {
      monate: werte.length,
      jeMonat: Math.round(mittel * 1000) / 1000,
      proJahr: Math.round(mittel * 12 * 100) / 100,
      positiveMonate: Math.round(100 * werte.filter(function (v) { return v > 0; }).length / werte.length),
      tWert: Math.round(t * 100) / 100,
      // Erst ab rund 24 Monaten ist ein t-Wert belastbar. Darunter wird er ausgewiesen,
      // aber nicht als Beleg gewertet – sonst erklärt ein guter Quartalslauf eine
      // Strategie zum Fund.
      belastbar: werte.length >= 24,
      ueberzufaellig: werte.length >= 24 && t >= 2
    };
  }

  /* ================= Wie spät ist der Kanal? =================
   *
   * Ein Regressionskanal beschreibt, was WAR. Er kann gar nicht anders, als der
   * Bewegung nachzulaufen — die Frage ist nur, um wie viel. Am AMD-Chart vom
   * 20.08.2026 meldete er am Tageshoch (473,50) „aufwärts" und am Tagestief (460,88)
   * „abwärts". Der Abwärtstrend war erst bei 465,51 erkannt, da waren 7,22 der 12,62
   * Dollar Bewegung vorbei.
   *
   * Diese Funktion rechnet genau das aus, statt es dem Auge zu überlassen: Seit wann
   * meldet der Kanal die jetzige Richtung, wo lag der Wendepunkt davor, und welcher
   * Anteil der Bewegung war zum Meldezeitpunkt schon gelaufen.
   *
   * Ohne Blick in die Zukunft: Für jeden geprüften Zeitpunkt i wird der Kanal nur über
   * [i-fenster, i] gebildet, nie darüber hinaus.
   */
  function kanalVerzug(bars, opt) {
    opt = opt || {};
    var fenster = opt.fenster || 200;
    var maxRueck = opt.maxRueck || 200;          // Deckel: sonst läuft die Suche über den ganzen Chart
    var n = bars.length;
    if (n < fenster + 10) return null;
    function trendBei(i) {
      var k = kanalUeber(bars, Math.max(0, i - fenster), i);
      return k ? k.trend : null;
    }
    var jetzt = trendBei(n - 1);
    if (!jetzt) return null;
    // Seitwärts hat keine Richtung, also auch keinen Verzug. Eine Zahl auszurechnen wäre
    // hier schlimmer als keine: Sie hätte kein Vorzeichen, das etwas bedeutet.
    if (jetzt !== 'auf' && jetzt !== 'ab') return { trend: 'seit', ohneRichtung: true };
    // Rückwärts, bis der Kanal etwas anderes gemeldet hat: das ist der Meldezeitpunkt.
    var meldeIdx = n - 1, grenze = Math.max(fenster, n - 1 - maxRueck), gekappt = false;
    for (var i = n - 2; i >= grenze; i--) {
      if (trendBei(i) !== jetzt) { meldeIdx = i + 1; break; }
      meldeIdx = i;
      if (i === grenze) gekappt = true;
    }
    // Der Wendepunkt, an dem die Bewegung tatsächlich begann: bei „aufwärts" das Tief
    // vor der Meldung, bei „abwärts" das Hoch. Gesucht wird nur VOR dem Meldezeitpunkt.
    var von = Math.max(0, meldeIdx - Math.round(fenster / 2));
    var wendeIdx = meldeIdx, best = null;
    for (var j = von; j <= meldeIdx; j++) {
      var p = bars[j][1];
      if (best === null || (jetzt === 'auf' ? p < best : p > best)) { best = p; wendeIdx = j; }
    }
    var pWende = bars[wendeIdx][1], pMelde = bars[meldeIdx][1], pJetzt = bars[n - 1][1];
    var ganzeBewegung = pJetzt - pWende;
    // Anteil der Bewegung, der beim Melden schon vorbei war. Nur sinnvoll, wenn sich
    // der Kurs seit dem Wendepunkt überhaupt in Trendrichtung bewegt hat.
    var anteil = null;
    if (Math.abs(ganzeBewegung) > 1e-9 && (jetzt === 'auf' ? ganzeBewegung > 0 : ganzeBewegung < 0)) {
      anteil = Math.max(0, Math.min(1, (pMelde - pWende) / ganzeBewegung));
    }
    return {
      trend: jetzt,
      gemeldetVor: n - 1 - meldeIdx,             // in Kerzen
      gemeldetBei: pMelde,
      gemeldetT: bars[meldeIdx][0],
      wendeVor: n - 1 - wendeIdx,
      wendeBei: pWende,
      wendeT: bars[wendeIdx][0],
      verzugKerzen: meldeIdx - wendeIdx,
      anteilVerpasst: anteil === null ? null : Math.round(anteil * 1000) / 10,
      seitherPct: Math.round((pJetzt / pMelde - 1) * 10000) / 100,
      gekappt: gekappt
    };
  }

  /* ================= Trendkanäle: beschreiben statt filtern =================
   *
   * Ein Kanal ist eine BESCHREIBUNG des Kursverlaufs, keine Ja/Nein-Entscheidung.
   * Für fast jeden Abschnitt lässt sich einer zeichnen – die Frage ist nicht OB,
   * sondern wie gut er passt und was er über die aktuelle Lage sagt.
   * Der ältere trendChannel() liefert ein Urteil ("gültig/ungültig") und wird für die
   * Handelslogik weiter gebraucht. Diese Funktionen hier liefern stattdessen die
   * Geometrie plus ehrliche Gütemaße – für die Anzeige und für Signale, die den Kanal
   * als Kontext nutzen wollen.
   *
   * Zwei Dinge macht sie besser als die frühere Kanalzeichnung:
   *  1. KANTEN AUS QUANTILEN statt aus dem äußersten Ausreißer. Vorher machte ein
   *     einzelner Spike den Kanal doppelt so breit; die Kante lag dann dort, wo der
   *     Kurs genau einmal war, und war als Ziel oder Stopp wertlos.
   *  2. WENDEPUNKTE statt fester Fenster. Ein Kanal soll dort anfangen, wo die
   *     Bewegung anfing – nicht 130 Kerzen vor jetzt, weil das eine runde Zahl ist.
   */

  /** Wendepunkte (Swing-Hochs und -Tiefs): eine Kerze, die im Umkreis von `spanne`
   *  Kerzen auf beiden Seiten die höchste bzw. tiefste ist. Das sind die Punkte, an
   *  denen ein Mensch beim Zeichnen ansetzen würde. */
  function wendepunkte(bars, spanne) {
    spanne = spanne || 5;
    var n = bars.length, hoch = [], tief = [];
    var H = function (i) { return bars[i].length >= 5 && bars[i][3] != null ? bars[i][3] : bars[i][1]; };
    var T = function (i) { return bars[i].length >= 5 && bars[i][4] != null ? bars[i][4] : bars[i][1]; };
    for (var i = spanne; i < n - spanne; i++) {
      var istHoch = true, istTief = true;
      for (var k = i - spanne; k <= i + spanne; k++) {
        if (k === i) continue;
        if (H(k) >= H(i)) istHoch = false;
        if (T(k) <= T(i)) istTief = false;
        if (!istHoch && !istTief) break;
      }
      if (istHoch) hoch.push({ i: i, preis: H(i) });
      if (istTief) tief.push({ i: i, preis: T(i) });
    }
    return { hoch: hoch, tief: tief };
  }

  /** Ein Kanal über einen Abschnitt: Regressionsgerade durch die Schlusskurse,
   *  Kanten aus dem 90.- bzw. 10.-Perzentil der Abweichungen.
   *  Rückgabe: {von, bis, steigung, mitteJetzt, oben, unten, breite, r2,
   *             beruehrungenOben, beruehrungenUnten, pos, trend, guete} */
  function kanalUeber(bars, von, bis, opt) {
    opt = opt || {};
    if (bis - von < 15 || bis >= bars.length) return null;
    var n = bis - von + 1, i, x, y;
    var c = [];
    for (i = von; i <= bis; i++) { if (bars[i][1] == null) return null; c.push(bars[i][1]); }
    // Regressionsgerade
    var sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (i = 0; i < n; i++) { sx += i; sy += c[i]; sxx += i * i; sxy += i * c[i]; }
    var nenner = n * sxx - sx * sx;
    if (nenner === 0) return null;
    var steig = (n * sxy - sx * sy) / nenner;
    var achse = (sy - steig * sx) / n;
    // Abweichungen und Bestimmtheitsmaß
    var abw = [], mittelY = sy / n, ssTot = 0, ssRes = 0;
    for (i = 0; i < n; i++) {
      var linie = achse + steig * i, d = c[i] - linie;
      abw.push(d);
      ssTot += (c[i] - mittelY) * (c[i] - mittelY);
      ssRes += d * d;
    }
    var r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    // Kanten aus Quantilen - ein einzelner Ausreißer darf den Kanal nicht aufblähen
    var sortiert = abw.slice().sort(function (a, b) { return a - b; });
    var qi = function (p) { return sortiert[Math.min(sortiert.length - 1, Math.max(0, Math.round((sortiert.length - 1) * p)))]; };
    var offOben = qi(opt.quantil === undefined ? 0.92 : opt.quantil);
    var offUnten = qi(1 - (opt.quantil === undefined ? 0.92 : opt.quantil));
    var breite = offOben - offUnten;
    // Entartete Breite: Wenn der Kurs der Geraden fast exakt folgt, liegen das 92.- und
    // das 8.-Perzentil der Abweichungen im Fliesskomma-Rauschen – mal minimal auseinander,
    // mal gleich. Früher gab es dafür null zurück, also KEINEN Kanal, obwohl die
    // Passgenauigkeit perfekt war: auf einer glatten Rampe kam abwechselnd ein Ergebnis
    // und null heraus. Auf echten Kursen ist der Fall selten, aber nicht ausgeschlossen
    // (lange flache Strecken, grob gerundete Kurse) – und dort verschwand der Kanal still
    // aus jeder Messung, statt als perfekt passend gemeldet zu werden.
    // Jetzt bekommt er eine Mindestbreite auf Kursniveau. Für echte Kurse ändert sich
    // nichts, deren Breite liegt immer weit darüber.
    if (!(breite > 0)) {
      var minBreite = Math.max(Math.abs(mittelY) * 1e-7, 1e-10);
      offOben = minBreite / 2; offUnten = -minBreite / 2; breite = minBreite;
    }
    // Wie oft berührt der Kurs die Kanten? Ein Kanal, den niemand anfasst, beschreibt nichts.
    var tolBand = breite * 0.15, tO = 0, tU = 0;
    for (i = 0; i < n; i++) {
      if (abw[i] >= offOben - tolBand) tO++;
      if (abw[i] <= offUnten + tolBand) tU++;
    }
    var mitteJetzt = achse + steig * (n - 1);
    var obenJetzt = mitteJetzt + offOben, untenJetzt = mitteJetzt + offUnten;
    var pos = breite > 0 ? (c[n - 1] - untenJetzt) / (obenJetzt - untenJetzt) : 0.5;
    // Richtung: die Steigung über die ganze Strecke, gemessen an der Kanalbreite.
    // Eine Steigung von einer halben Kanalbreite über den Abschnitt ist noch flach.
    var hub = steig * (n - 1);
    var trend = hub > breite * 0.5 ? 'auf' : hub < -breite * 0.5 ? 'ab' : 'seit';
    /* Güte 0-100: Passgenauigkeit, Berührungen beider Kanten, ausreichende Länge.
     * Längen-Normierung (Befund 21.08.2026): Der alte Längenterm n/120 gab einem
     * perfekten 30-Kerzen-Kanal höchstens 5 von 20 Punkten - kurze saubere Kanäle
     * verloren die Bester-Auswahl IMMER gegen längere unsaubere, und in der Messung
     * wurden 25er-Kanäle nur zu einem Drittel erkannt (50er: 100 %). Ab 40 Kerzen
     * ist eine Regression mit Kantenprüfung statistisch tragfähig - mehr Länge macht
     * einen Kanal nicht besser, nur länger. Ebenso skaliert das Berührungs-Soll:
     * 3 je Kante sind bei 25 Kerzen unerreichbar streng, 2 genügen dort. */
    var beruehrSoll = n >= 80 ? 3 : 2;
    /* Passgenauigkeit: r2 misst, wie viel die GERADE erklaert - fuer einen
     * SEITWAERTSKANAL ist das strukturell ~0 (eine horizontale Gerade erklaert
     * vom Pendeln nichts), und perfekte Korridore bekamen Guete ~55. Fuer flache
     * Kanaele zaehlt stattdessen die ENGE gegen die Random-Walk-Erwartung:
     * Ein Korridor, der deutlich enger ist als 2*sigma*sqrt(n), ist echte
     * Kompression; einer in Zufallsbreite beschreibt nichts. */
    var pass = Math.max(0, Math.min(1, r2));
    if (trend === 'seit') {
      var sd = 0, dn2 = 0;
      for (i = 1; i < n; i++) { var dd = c[i] - c[i - 1]; sd += dd * dd; dn2++; }
      var sigma = dn2 ? Math.sqrt(sd / dn2) : 0;
      /* Referenz 0,68*sigma*sqrt(n): die EMPIRISCH gemessene Quantilbreite der
       * Regressions-Residuen eines reinen Random Walks (3000 Laeufe je n, Werte
       * 0,66-0,71 ueber n=25..100; Brueckenprozess, deshalb deutlich unter der
       * naiven 2*sigma*sqrt(n)-Spanne). Rauschen bekommt damit enge ~0 - nur ein
       * Korridor, der DEUTLICH enger ist als Zufall, zaehlt als Kompression. */
      var erwartet = 0.68 * sigma * Math.sqrt(n);
      var enge = erwartet > 0 ? Math.max(0, 1 - breite / erwartet) : 0;
      pass = Math.max(pass, enge);
    }
    var guete = Math.round(
      pass * 45 +
      Math.min(1, Math.min(tO, tU) / beruehrSoll) * 35 +
      Math.min(1, n / 40) * 20
    );
    return {
      von: von, bis: bis, n: n,
      steigung: steig, mitteJetzt: mitteJetzt, oben: obenJetzt, unten: untenJetzt,
      breite: breite, breitePct: mitteJetzt > 0 ? breite / mitteJetzt * 100 : 0,
      r2: Math.round(r2 * 100) / 100,
      beruehrungenOben: tO, beruehrungenUnten: tU,
      pos: Math.round(pos * 1000) / 1000,
      trend: trend, guete: guete,
      achse: achse   // für das Zeichnen: Wert am Anfang des Abschnitts
    };
  }

  /** Mehrere Kanäle zu einem Kursverlauf – kurz, mittel, lang – plus den besten.
   *  Warum mehrere: Ein 30-Tage-Kanal und ein 300-Tage-Kanal können gegenläufig sein,
   *  und BEIDES ist wahr. Wer nur einen zeigt, verschweigt die Hälfte. */
  function kanaele(bars, opt) {
    opt = opt || {};
    var n = bars.length;
    if (n < 30) return [];
    var raus = [];
    /* 1) Zeitebenen. 'kurz' hat eine FESTE Ziellänge statt eines Anteils:
     * 25 % der Sichtweite waren auf einem Jahreschart 62 Kerzen - ein echter
     * kurzer Kanal (20-40 Kerzen) wurde damit systematisch mit dem Vorlauf-
     * Regime verwässert: falsches r2, beim Seitwärtskanal sogar falsche
     * Richtung (Messung 21.08.2026: 25er-Erkennung 33 %, seitwärts 5 %). */
    var kurzLen = Math.min(45, Math.max(25, Math.round(n * 0.15)));
    var ebenen = opt.ebenen || [
      // 'kurz' probiert ZWEI Laengen und behaelt die besser passende - ein
      // 25-Kerzen-Korridor wird von einem 38er-Fenster sonst noch verwaessert.
      { name: 'kurz', laengen: kurzLen > 30 ? [25, kurzLen] : [kurzLen] },
      { name: 'mittel', anteil: 0.5 },
      { name: 'lang', anteil: 1.0 }
    ];
    ebenen.forEach(function (e) {
      var laengen = e.laengen || [e.laenge != null ? e.laenge : Math.max(20, Math.round(n * e.anteil))];
      var bestE = null;
      laengen.forEach(function (laenge) {
        var k = kanalUeber(bars, Math.max(0, n - laenge), n - 1, opt);
        if (k && (!bestE || k.guete > bestE.guete)) bestE = k;
      });
      if (bestE) { bestE.name = e.name; raus.push(bestE); }
    });
    // 2) Zusätzlich ein Kanal, der an einem echten Wendepunkt beginnt – dort, wo die
    //    aktuelle Bewegung tatsächlich anfing, nicht bei einer runden Kerzenzahl.
    var wp = wendepunkte(bars, Math.max(3, Math.round(n / 40)));
    // p.i < n-15: auch juengere Wendepunkte zulassen - kanalUeber braucht nur 15 Kerzen,
    // und gerade die frische Bewegung ist die, die man sehen will.
    var kandidaten = wp.hoch.concat(wp.tief).filter(function (p) { return p.i < n - 15; });
    kandidaten.sort(function (a, b) { return b.i - a.i; });
    /* Deckungsgleiche Kanaele nicht doppelt ausgeben (Befund 21.08.2026): Seit die
     * kurz-Ebene echte kurze Kanaele findet, landen kurz und 'ab Wendepunkt' oft
     * auf demselben Fenster - gezeichnet lagen zwei Linienpaare aufeinander, und
     * es SAHEN nur drei Kanaele aus. Ein Wendepunkt-Kanal, der eine Ebene bloss
     * bestaetigt, markiert sie jetzt (wendeBestaetigt); als vierter Kanal kommt
     * der beste ANDERSARTIGE Kandidat - vier Linien sollen vier Sichten sein. */
    function deckungsgleich(a, b) {
      return Math.abs(a.von - b.von) <= 0.2 * Math.min(a.n, b.n) &&
        Math.max(a.n, b.n) / Math.min(a.n, b.n) <= 1.3;
    }
    var bester = null, besterFrei = null;
    for (var q = 0; q < Math.min(8, kandidaten.length); q++) {
      var k2 = kanalUeber(bars, kandidaten[q].i, n - 1, opt);
      if (!k2) continue;
      // Bei Gleichstand gewinnt der KUERZERE - er beschreibt die aktuelle Bewegung.
      if (!bester || k2.guete > bester.guete || (k2.guete === bester.guete && k2.n < bester.n)) bester = k2;
      var frei = !raus.some(function (e2) { return deckungsgleich(e2, k2); });
      if (frei && (!besterFrei || k2.guete > besterFrei.guete || (k2.guete === besterFrei.guete && k2.n < besterFrei.n))) besterFrei = k2;
    }
    if (bester) {
      var zwilling = null;
      raus.forEach(function (e3) { if (deckungsgleich(e3, bester)) zwilling = e3; });
      if (zwilling) zwilling.wendeBestaetigt = true;
      var wahl = zwilling ? besterFrei : bester;
      if (wahl) { wahl.name = 'ab Wendepunkt'; raus.push(wahl); }
    }
    return raus;
  }

  /** ALLE Trendabschnitte einer Reihe, je mit eigenem Kanal (21.08.2026).
   *  Die vier Ebenen-Kanaele (kurz/mittel/lang/Wendepunkt) enden alle am rechten
   *  Rand - eine Implementierungsgrenze, keine Marktwahrheit: Ein Chart hat so
   *  viele Kanaele, wie er Trendabschnitte hat. Hier wird die Reihe an den
   *  grossen Wendepunkten zerlegt, jeder Abschnitt (ab 15 Kerzen) bekommt seinen
   *  Kanal, und Nachbarn gleicher Richtung verschmelzen, wenn der gemeinsame
   *  Kanal mindestens so gut passt wie der schwaechere Einzelne. */
  function kanalSegmente(bars, opt) {
    opt = opt || {};
    var n = bars.length;
    if (n < 40) return [];
    var fenster = Math.max(3, Math.round(n / 25));
    var wp = wendepunkte(bars, fenster);
    var grenzen = wp.hoch.concat(wp.tief).map(function (p) { return p.i; }).sort(function (a, b) { return a - b; });
    var punkte = [0];
    grenzen.forEach(function (g) { if (g - punkte[punkte.length - 1] >= 15) punkte.push(g); });
    if (n - 1 - punkte[punkte.length - 1] >= 15) punkte.push(n - 1);
    else punkte[punkte.length - 1] = n - 1;
    var raus = [];
    for (var s = 0; s + 1 < punkte.length; s++) {
      var k = kanalUeber(bars, punkte[s], punkte[s + 1], opt);
      if (k && k.guete >= (opt.mindestGuete != null ? opt.mindestGuete : 50)) raus.push(k);
    }
    var i2 = 0;
    while (i2 + 1 < raus.length) {
      var a = raus[i2], b = raus[i2 + 1];
      if (a.trend === b.trend && b.von - a.bis <= fenster) {
        var m = kanalUeber(bars, a.von, b.bis, opt);
        if (m && m.guete >= Math.min(a.guete, b.guete)) { raus.splice(i2, 2, m); continue; }
      }
      i2++;
    }
    raus.forEach(function (k3, idx) { k3.name = 'Abschnitt ' + (idx + 1); });
    return raus;
  }

  /** Trendwechsel-Beobachtung (Felix' Winkel-Detektor, Ticket #33/#35).
   *  EXAKT die Logik der Trendwende-Studie vom 21.08.2026 - hier nur als
   *  BEOBACHTUNG, nicht als Handelssignal: Der Detektor war der einzige
   *  Teilueberlebende der Studie, aber ~44 % seines Effekts war Tageszeit-Drift
   *  und die 1m-Basis zu kurz. Der Retest laeuft; bis dahin zeigt diese Funktion
   *  nur an, was der Detektor sieht.
   *
   *  Ablauf (walk-forward, kein Blick in die Zukunft):
   *   1. Wendepunkte gelten erst F Kerzen NACH ihrem Hoch/Tief als bestaetigt.
   *   2. Der Vor-Abschnitt (vorletzter -> letzter Wendepunkt) liefert den
   *      Vortrend-Winkel; ohne echten Vortrend (|Winkel| < 0,5) kein Signal.
   *   3. Der junge Abschnitt (ab letztem Wendepunkt) braucht >= 10 Kerzen und
   *      einen gueltigen Kanal; sein normierter Winkel (Steigung x Laenge /
   *      Kanalbreite - wie steil relativ zum Rauschen) muss die Schwelle S
   *      reissen UND das Vorzeichen gegen den Vortrend drehen.
   *  Rueckgabe: { vorher: {winkel, trend}, aktuell: {winkel, trend, seitKerzen},
   *              signal: {dir, beiKerze}|null } oder null (zu wenig Daten). */
  function trendwechsel(bars, opt) {
    opt = opt || {};
    var F = opt.bestaetigung || 5;       // Kerzen bis ein Wendepunkt bestaetigt ist
    var S = opt.schwelle != null ? opt.schwelle : 1.0;   // Winkel-Schwelle (normiert)
    var MIN_JUNG = 10;
    if (!bars || bars.length < 40) return null;
    var wnk = function (k) { return k.steigung * k.n / k.breite; };
    var wp = wendepunkte(bars, F);
    var alle = wp.hoch.concat(wp.tief).map(function (w) { return w.i; }).sort(function (a, b) { return a - b; });
    // nur bestaetigte Wendepunkte (i + F <= letzte Kerze)
    var C = alle.filter(function (i) { return i + F <= bars.length - 1; });
    if (C.length < 2) return null;
    var wLetzt = C[C.length - 1], wVor = C[C.length - 2];
    var kAlt = kanalUeber(bars, wVor, wLetzt);
    var winkelAlt = (kAlt && kAlt.breite > 0) ? wnk(kAlt) : 0;
    var seit = bars.length - 1 - wLetzt;
    var raus = {
      vorher: kAlt ? { winkel: Math.round(winkelAlt * 100) / 100, trend: kAlt.trend } : null,
      aktuell: null, signal: null
    };
    if (seit < MIN_JUNG) { raus.aktuell = { winkel: null, trend: 'zu jung', seitKerzen: seit }; return raus; }
    var kNeu = kanalUeber(bars, wLetzt, bars.length - 1);
    if (!kNeu || !(kNeu.breite > 0)) { raus.aktuell = { winkel: null, trend: 'kein Kanal', seitKerzen: seit }; return raus; }
    var wn = wnk(kNeu);
    raus.aktuell = { winkel: Math.round(wn * 100) / 100, trend: kNeu.trend, seitKerzen: seit };
    if (Math.abs(winkelAlt) >= 0.5 && Math.abs(wn) >= S && Math.sign(wn) !== Math.sign(winkelAlt)) {
      raus.signal = { dir: wn > 0 ? 'call' : 'put', beiKerze: bars.length - 1 };
    }
    return raus;
  }

  /** Volatilitäts-Stop („atmender“ Not-SL) auf den SCHEIN, aus Bar-Rauschen × Hebel.
   *  Rückgabe: negativer Anteil, z. B. -0.22 = −22 %. */
  function autoStop(closes, omega, barsHold) {
    var r = logReturns(closes, Math.min(closes.length - 1, 150));
    if (r.length < 30 || !omega) return -0.25;
    var sig = stdev(r);
    var move = 2.0 * sig * Math.sqrt(Math.max(4, barsHold || 12)); // 2σ der erwarteten Haltedauer
    return -Math.min(0.45, Math.max(0.10, move * omega));
  }

  /** Annualisierte Vola aus Intraday-Bars (barsPerDay z. B. 78 für 5-Min US-Session) */
  function histVolIntraday(closes, barsPerDay) {
    var r = logReturns(closes, Math.min(closes.length - 1, 300));
    if (r.length < 30) return 0.3;
    var v = stdev(r) * Math.sqrt(252 * (barsPerDay || 78));
    return Math.min(1.5, Math.max(0.10, v));
  }

  /**
   * Intraday-Backtest: MA-Durchbruch-Strategie über 5-Min-Historie.
   * histMap: {SYM: [[t,close]]} (5-Min-Bars, mehrere Tage/Wochen)
   * opts: {capital, period, confirmBps, budgetPct, sl, tp, cooldownMin, maxPerDay}
   */
  /** Bar-Länge in Minuten aus der Serie ableiten – Median der Abstände innerhalb eines Tages. */
  /** Nur FERTIGE Kerzen behalten (Befund vom 21.08.2026): Yahoo haengt einen
   *  Quote-Stempel mit der aktuellen Uhrzeit an, und davor kann die noch laufende
   *  Kerze stehen. Die alte Einmal-Kappung entfernte nur den Stempel - die laufende
   *  Kerze galt als fertig, Signale entstanden auf halben Kerzen und konnten bis
   *  zum Kerzenschluss wieder verschwinden (Repainting). Live mass damit etwas
   *  anderes als Studie und Backtest. Deshalb SCHLEIFE: hinten faellt alles weg,
   *  was juenger als eine Kerzenlaenge ist. */
  function fertigeBars(bars, barMin, now) {
    var n = (bars || []).length;
    var min = (barMin || 1) * 60000;
    while (n > 2 && (now || Date.now()) - bars[n - 1][0] < min) n--;
    return n === (bars || []).length ? bars : bars.slice(0, n);
  }

  function barMinOf(bars, ci) {
    var d = [], i, von = Math.max(1, (ci || bars.length - 1) - 40);
    for (i = von; i <= Math.min(bars.length - 1, (ci || bars.length - 1)); i++) {
      var dt = (bars[i][0] - bars[i - 1][0]) / 60000;
      if (dt > 0 && dt <= 120) d.push(dt);
    }
    if (!d.length) return 5;
    d.sort(function (a, b) { return a - b; });
    return d[Math.floor(d.length / 2)] || 5;
  }

  function backtestIntraday(histMap, opts) {
    opts = opts || {};
    var capital = opts.capital || 10000;
    var period = opts.period || 20, confirmBps = opts.confirmBps === undefined ? 15 : opts.confirmBps;
    var budgetPct = opts.budgetPct || 0.03, SL = opts.sl || -0.25, TP = opts.tp || 0.35;
    var cooldownMs = (opts.cooldownMin || 45) * 60000;
    var maxPerDay = opts.maxPerDay || 10;
    var FEE = opts.orderFee === undefined ? 1.5 : opts.orderFee;      // Ordergebühr je Kauf/Verkauf
    var SP = opts.spread === undefined ? SPREAD : opts.spread;         // Geld-Brief-Spanne
    var OTM = opts.otmPct || 0;                                        // Basispreis-Abstand (Hebel-Profil)
    var EXPD = opts.expiryDays || 21;                                  // Restlaufzeit (Hebel-Profil)
    var EXIT_MODE = opts.exitMode || 'confirmed';                      // 'recross' = Wellen-Scalping
    var TRAIL = opts.trailPct || 0;                                    // Trailing-Stop ab Hoch
    var MAXHOLD = (opts.maxHoldMin || 0) * 60000;                      // Maximal-Haltedauer
    var TPv = opts.tp === null ? Infinity : TP;                        // TP abschaltbar
    var LINE = opts.lineType || 'ema';                                 // 'ema' | 'vwap'
    var TREND = !!opts.trendFilter;                                    // nur mit übergeordnetem Trend (EMA100)
    var WIN = opts.window || 'all';                                    // Handelszeitfenster
    var SLIPB = opts.slippage === undefined ? 0.005 : opts.slippage;   // Slippage-Basis je Ausführung
    var INSTRUMENT = opts.instrument || 'schein';                      // 'schein' | 'basis' (Aktie/CFD, linear, ohne Zeitwert)
    var BASIS_SP = (opts.basisBp === undefined ? 5 : opts.basisBp) / 10000; // Basiswert-Spanne je Seite
    var ENTRY = opts.entryMode || 'cross';                             // 'cross' | 'reversion' | 'wave'
    var NUR_RICHTUNG = opts.nurRichtung || null;                       // 'call' | 'put': nur eine Seite handeln.
    // Grund: Ein relativer Vorsprung auf der Short-Seite laesst sich mit einem nackten
    // Leerverkauf nicht ernten - er kaempft gegen die Marktdrift. Beim RSI2-im-
    // Seitwaertskanal gemessen: Call-Bein +0,075 % je Trade, Put-Bein -0,099 %.
    // Dieselbe Lektion wie bei der Ergebnis-Drift-Strategie.
    var ZTHR = opts.zThr || 2;                                         // z-Score-Schwelle (Rücksetzer/Wellenreiter)
    var MINEDGE = opts.minEdge === undefined ? 1.5 : opts.minEdge;     // Kosten-Breakeven-Filter (0 = aus)
    var MINQ = opts.minQuality === undefined ? 60 : opts.minQuality;   // Wellen-Qualitäts-Schwelle
    var CHAN = !!opts.channel;                                         // Regressionskanal (nur Wellenreiter)
    var CHN = opts.channelN || 0;                                      // Kanal-Fenster in Bars (0 = automatisch: 2,5 Wellenlängen)
    var MTF = !!opts.mtf;                                              // 5-Min-Bestätigung (für 1-Min-Serien)
    var RISKP = opts.riskPct || 0;                                     // Positionsgröße nach Risiko (% vom Kapital je Stop)
    var ORBMIN = opts.orbMin || 30;                                    // Opening-Range-Dauer in Minuten
    var BV = opts.ratio || RATIO;                                      // Bezugsverhaeltnis (Kostenhebel!)
    // Alles, woran die Einstiegspruefung haengt - und NICHTS davon aendert sich,
    // wenn nur Not-Stop, Haltedauer, Schein-Profil oder Budget variieren.
    var SIGP = { ENTRY: ENTRY, LINE: LINE, period: period, confirmBps: confirmBps,
      ZTHR: ZTHR, MINQ: MINQ, CHAN: CHAN, MTF: MTF, TREND: TREND };
    var SIGV = opts.__signale || null;      // von backtestIntradayMulti gefuellt
    var AUTO_SL = SL === 'auto';
    if (AUTO_SL) SL = -0.25; // Fallback, echter Wert je Trade
    var orbState = {};

    var cash = capital, trades = [], equity = [];
    var open = {};       // sym -> Position
    var lastTrade = {};  // sym -> ts
    var dayCount = {};   // 'YYYY-MM-DD' -> Anzahl
    var syms = Object.keys(histMap);
    if (!syms.length) return { error: 'Keine Daten.' };

    // Gemeinsame Zeitachse aus allen Bar-Zeitstempeln
    var timesSet = {};
    syms.forEach(function (s) { histMap[s].forEach(function (p) { timesSet[p[0]] = 1; }); });
    var times = Object.keys(timesSet).map(Number).sort(function (a, b) { return a - b; });
    if (times.length < period + 20) return { error: 'Zu wenig Intraday-Historie.' };
    // Index je Symbol vorbereiten
    var idx = {}, cursor = {};
    syms.forEach(function (s) { idx[s] = histMap[s]; cursor[s] = 0; });

    function dayKey(t) { var d = new Date(t); return d.getUTCFullYear() + '-' + d.getUTCMonth() + '-' + d.getUTCDate(); }
    /* DURCHGEHENDE MÄRKTE haben keinen Handelsschluss. Für Aktien ist die Glattstellung
     * zum Tagesende richtig – über Nacht steht man ungeschützt im Gap. Für Krypto ist
     * sie eine erfundene Grenze: `dayKey` teilt bei UTC-Mitternacht, obwohl dort nichts
     * passiert.
     *
     * Am 21.08.2026 gemessen, was das anrichtet: Von 21 Trades einer Krypto-Trendfolge
     * schlossen 9 mit „Tagesschluss-Glattstellung", Median-Haltedauer 2 Stunden. Die
     * geprüfte Ausstiegsregel kam nie zum Zug – zwei völlig verschiedene Ausstiegsmodi
     * lieferten deshalb bis auf die Kommastelle dasselbe Ergebnis. Ohne diesen Schalter
     * ist auf durchgehenden Märkten keine Haltedauer über einem Tag messbar. */
    var TAGESSCHLUSS = opts.tagesschluss !== false;
    function isLastBarOfDay(s, ci) {
      if (!TAGESSCHLUSS) return false;
      var bars = idx[s];
      return ci === bars.length - 1 || dayKey(bars[ci + 1][0]) !== dayKey(bars[ci][0]);
    }
    /** Wert einer Position - Schein ueber Black-Scholes, Basiswert linear.
     *  Der Put auf dem Basiswert ist ein linearer Leerverkauf: Wert = 2*Einstieg - Kurs.
     *  Faellt der Kurs um 1 %, steigt der Wert um 1 % - kein Hebel, kein Zeitwert. */
    function positionsWert(p, spot, t) {
      if (p.basis) return p.dir === 'call' ? spot : Math.max(0.001, 2 * p.entrySpot - spot);
      return warrantValue(p.dir, p.w, spot, t);
    }
    function closePos(sym, spot, t, why) {
      var p = open[sym];
      var bid = Math.max(0.001, positionsWert(p, spot, t) * (1 - (p.spx || SP)));
      var proceeds = bid * p.qty - FEE;
      cash += proceeds;
      // entrySpot/exitSpot sind der BASISWERT, nicht der Schein. Ohne sie laesst sich
      // die Richtungs-Gegenprobe nicht rechnen: ein gespiegelter Schein-Trade ist wegen
      // Zeitwert und Kruemmung nicht die Spiegelung des echten, die Kursbewegung schon.
      trades.push({ sym: sym, dir: p.dir, openT: p.openT, closeT: t, entry: p.entry, exit: bid, qty: p.qty, pnl: proceeds - p.cost, fees: 2 * FEE, why: why, holdMin: Math.round((t - p.openT) / 60000), entrySpot: p.entrySpot, exitSpot: spot });
      delete open[sym];
    }

    for (var ti = 0; ti < times.length; ti++) {
      var t = times[ti];
      for (var si = 0; si < syms.length; si++) {
        var sym = syms[si];
        var bars = idx[sym];
        var ci = cursor[sym];
        while (ci < bars.length - 1 && bars[ci + 1][0] <= t) ci++;
        cursor[sym] = ci;
        if (bars[ci][0] !== t || ci < period + 2) continue;
        var spot = bars[ci][1];

        // Opening-Range fortschreiben (ORB-Modus)
        if (ENTRY === 'orb') {
          var dkO = dayKey(t);
          var os = orbState[sym];
          if (!os || os.day !== dkO) os = orbState[sym] = { day: dkO, start: t, high: spot, low: spot, done: false, traded: {} };
          if (t - os.start < ORBMIN * 60000) { if (spot > os.high) os.high = spot; if (spot < os.low) os.low = spot; }
          else os.done = true;
        }

        // Offene Position managen
        if (open[sym]) {
          var p = open[sym];
          var bid = Math.max(0.001, positionsWert(p, spot, t) * (1 - (p.spx || SP)));
          var ret = bid / p.entry - 1;
          if (bid > (p.peak || 0)) p.peak = bid;
          var sig0 = signalCross(bars.slice(Math.max(0, ci - Math.max(period * 4, 120)), ci + 1), LINE, period, confirmBps);
          var why = null;
          if (ret <= (p.sl != null ? p.sl : SL)) why = 'Stop-Loss';
          else if (ret >= TPv) why = 'Take-Profit';
          else if (TRAIL && p.peak > p.entry && bid <= p.peak * (1 - TRAIL)) why = 'Trailing-Stop (−' + Math.round(TRAIL * 100) + ' % vom Hoch)';
          else if (MAXHOLD && t - p.openT >= MAXHOLD) why = 'Max-Haltedauer erreicht';
          else if (isLastBarOfDay(sym, ci)) why = 'Tagesschluss-Glattstellung';
          else if (ENTRY === 'wave') {
            if (CHAN && p.chan) {
              // Der Kanal vom Einstieg wird fortgeschrieben, nicht jede Minute neu gezeichnet –
              // sonst läuft die Linie dem Kurs hinterher und jedes Ziel verschiebt sich mit.
              var chM = projectTrendChannel(p.chan.kanal, ci - p.chan.i0, spot + p.chan.off);
              if (chM) {
                if (p.dir === 'call' && chM.pos >= 0.80) why = 'Kanaloberkante erreicht (Ziel)';
                else if (p.dir === 'put' && chM.pos <= 0.20) why = 'Kanalunterkante erreicht (Ziel)';
                else if (p.dir === 'call' && chM.pos <= -0.125) why = 'Kanalbruch nach unten (Schutz-Exit)';
                else if (p.dir === 'put' && chM.pos >= 1.125) why = 'Kanalbruch nach oben (Schutz-Exit)';
              }
            }
            if (!why) {
              var zc = reversionSignal(bars.slice(Math.max(0, ci - 200), ci + 1), LINE, period, 1e9).z || 0;
              if ((p.dir === 'call' && zc >= ZTHR * 0.8) || (p.dir === 'put' && zc <= -ZTHR * 0.8)) why = 'Wellenkamm erreicht (Überdehnung auf der Gegenseite)';
            }
          } else if (ENTRY === 'reversion') {
            if ((p.dir === 'call' && sig0.above) || (p.dir === 'put' && !sig0.above)) why = 'Ziel erreicht: Rückkehr zur Leitlinie';
          } else if (EXIT_MODE === 'blitz') {
            // ⚡ Blitz: raus bei der ersten Gegenbar oder der EMA9-Rückkreuzung – langes Halten
            // ist im Daytrade Gift; kleine Gewinne, viele Versuche.
            var gb1 = ci >= 2 ? bars[ci][1] : null, gb0 = ci >= 2 ? bars[ci - 1][1] : null;
            var sig9 = signalCross(bars.slice(Math.max(0, ci - 60), ci + 1), 'ema', 9, 0);
            if (gb1 != null && ((p.dir === 'call' && gb1 < gb0) || (p.dir === 'put' && gb1 > gb0))) why = 'Blitz: Gegenbar';
            else if ((p.dir === 'call' && !sig9.above) || (p.dir === 'put' && sig9.above)) why = 'Blitz: EMA9-Rückkreuzung';
          } else if (EXIT_MODE === 'recross') {
            if ((p.dir === 'call' && !sig0.above) || (p.dir === 'put' && sig0.above)) why = 'EMA-Rückkreuzung (Wellen-Ende)';
          } else if (EXIT_MODE === 'zeit') {
            /* REINER ZEIT-AUSSTIEG: nur Stop, Ziel, Trailing, Haltedauer, Tagesschluss –
             * kein Signal-Ausstieg. Nötig für Strategien mit festem Horizont: Beim
             * RSI2-Dip-Kauf steht der Kurs beim Einstieg UNTER der Leitlinie, und der
             * generische Gegen-Durchbruch-Ausstieg feuert dadurch sofort auf die
             * Einstiegsbedingung selbst – 2.831 von 4.932 Trades flogen im Test nach
             * Minuten raus, obwohl die Regel acht Stunden halten wollte. Der leere
             * Zweig ist Absicht: Er fängt den Fall ab, bevor der generische Ausstieg
             * darunter greift. */
          } else if (EXIT_MODE === 'trendhalten') {
            /* HALTEN, SOLANGE DER KANAL DIE RICHTUNG HÄLT – das Gegenstück zu 'crest',
             * das an der Gegenkante schließt.
             *
             * 'crest' nimmt Gewinn an der Kanalkante mit; das ist eine Umkehrwette und
             * damit genau die Seite, die in der Messung vom 21.08.2026 verloren hat
             * (Kanal: unten kaufen −0,093 Pp, t = −5,9). Hier wird das Gegenteil geprüft:
             * Die Kante ist kein Ziel, sondern normaler Trendverlauf. Beendet wird erst,
             * wenn die These nicht mehr gilt – der Kanal dreht oder bricht.
             *
             * Der Kanal wird vom Einstieg FORTGESCHRIEBEN, nicht neu gezeichnet. Ein neu
             * gezeichneter Kanal läuft dem Kurs hinterher, dann verschiebt sich das
             * Abbruchkriterium mit der Position mit und die Regel wird zahnlos. */
            if (p.chan) {
              var chH = projectTrendChannel(p.chan.kanal, ci - p.chan.i0, spot + p.chan.off);
              if (chH) {
                if (p.dir === 'call' && chH.pos <= -0.125) why = 'Kanal nach unten gebrochen – These gebrochen';
                else if (p.dir === 'put' && chH.pos >= 1.125) why = 'Kanal nach oben gebrochen – These gebrochen';
              }
              // Dreht der frisch gemessene Kanal, ist der Trend keiner mehr. Das ist die
              // eigentliche Abbruchbedingung – der Bruch oben fängt nur den schnellen Fall.
              if (!why) {
                var chNeu = trendChannel(degapBarArray(bars.slice(Math.max(0, ci - 380), ci + 1)));
                if (chNeu && chNeu.gueltig) {
                  if (p.dir === 'call' && chNeu.trend === 'down') why = 'Kanal dreht abwärts – These gebrochen';
                  else if (p.dir === 'put' && chNeu.trend === 'up') why = 'Kanal dreht aufwärts – These gebrochen';
                }
              }
            }
            if (!why && ((p.dir === 'call' && sig0.crossed === 'down') || (p.dir === 'put' && sig0.crossed === 'up'))) {
              why = 'Gegen-Durchbruch der Leitlinie';
            }
          } else if ((p.dir === 'call' && sig0.crossed === 'down') || (p.dir === 'put' && sig0.crossed === 'up')) {
            why = 'Gegen-Durchbruch';
          }
          if (why) { closePos(sym, spot, t, why); lastTrade[sym] = t; }
          continue;
        }

        // Einstieg
        if (isLastBarOfDay(sym, ci)) continue; // nicht in den Schluss hinein kaufen
        if (!inWindow(t, WIN)) continue;       // außerhalb des Handelszeitfensters
        var dk = dayKey(t);
        if ((dayCount[dk] || 0) >= maxPerDay) continue;
        if (lastTrade[sym] && t - lastTrade[sym] < cooldownMs) continue;
        var dir = null;
        var chE = null, chN = 0, chRef = null;
        if (ENTRY === 'orb') {
          var os2 = orbState[sym];
          if (!os2 || !os2.done) continue;
          var confO = confirmBps / 10000;
          // WICHTIG: Die Tageschance wird erst nach dem tatsächlichen Kauf als verbraucht
          // markiert. Sonst frisst ein von einem Filter abgelehnter Ausbruch den Trade des Tages.
          if (spot > os2.high * (1 + confO) && !os2.traded.call) dir = 'call';
          else if (spot < os2.low * (1 - confO) && !os2.traded.put) dir = 'put';
          else continue;
          // Die reinen Filter gelten fuer orb genauso - nur der Ausloeser ist zustandsbehaftet.
          var winO = bars.slice(Math.max(0, ci - Math.max(period * 4, CHAN ? 380 : 260)), ci + 1);
          if (MTF && !mtfAgrees(winO, dir, 5)) continue;
          if (TREND) {
            var tcO = bars.slice(Math.max(0, ci - 240), ci + 1).map(function (b) { return b[1]; });
            if (tcO.length >= 100) {
              var eO = emaSeries(tcO, 100);
              if ((dir === 'call' && !(spot > eO[eO.length - 1])) || (dir === 'put' && (spot > eO[eO.length - 1]))) continue;
            }
          }
        } else {
          // Vorberechnet, wenn ein Signalspeicher mitgegeben wurde - sonst hier und jetzt.
          var vor = SIGV ? SIGV[sym][ci] : einstiegSignal(bars, ci, SIGP);
          if (!vor) continue;
          dir = vor.dir; chE = vor.chE; chRef = vor.chRef; chN = vor.chN;
        }
        if (NUR_RICHTUNG && dir !== NUR_RICHTUNG) continue;
        var closesUpto = bars.slice(Math.max(0, ci - 300), ci + 1).map(function (b) { return b[1]; });
        // Volatilität muss auf das Bar-Raster hochgerechnet werden: 390 Handelsminuten je Tag
        // geteilt durch die Bar-Länge. Ein fester Wert (78 = 5-Min-Bars) unterschätzt die Vola
        // auf 1-Min-Daten um den Faktor √5 – und macht damit die Scheine zu billig.
        var barsProTag = Math.max(1, Math.round(390 / Math.max(1, barMinOf(bars, ci))));
        var iv = Math.min(1.5, Math.max(0.15, histVolIntraday(closesUpto, barsProTag) * 1.1));
        var strike = spot * (1 + (dir === 'call' ? OTM : -OTM));
        var w = { strike: strike, expiry: t + EXPD * 86400000, iv: iv, ratio: BV };
        var wWert, spx, ask, omegaE;
        if (INSTRUMENT === 'basis') {
          /* BASISWERT statt Schein: Aktie lang bzw. linear leer, ohne Hebel, ohne
           * Zeitwert, ohne Emittenten-Spanne. Die Bedingungsstudie vom 21.08.2026 hat
           * gezeigt, warum dieser Pfad existieren muss: Die besten bedingten Signale
           * liefern +0,15 bis +0,24 Pp auf 8 Stunden - ÜBER der Basiswert-Hürde von
           * rund 0,10 %, aber UNTER der Scheinhürde von 0,21 bis 0,47 %. Derselbe
           * Vorsprung ist auf dem einen Instrument wirtschaftlich und auf dem anderen
           * tot. Ohne diesen Schalter kann der Prüfstand das nicht einmal messen. */
          wWert = spot;
          spx = BASIS_SP;
          ask = spot * (1 + spx);
          omegaE = 1;
        } else {
          wWert = warrantValue(dir, w, spot, t);
          if (wWert <= 0.001) continue;
          spx = effSpread(iv, SP, wWert, BV) + slipOf(iv, SLIPB, wWert); // Cent-Spread + Slippage
          ask = wWert * (1 + spx);
          omegaE = warrantOmega(dir, w, spot, t);
        }
        var barMsX = ci > 0 ? Math.max(60000, bars[ci][0] - bars[ci - 1][0]) : 300000;
        var holdBars = MAXHOLD ? MAXHOLD / barMsX : 12;
        var slT = AUTO_SL ? autoStop(closesUpto, omegaE, holdBars) : SL;
        // Kosten-Breakeven-Filter: typische Bewegung muss die Round-Trip-Kosten schlagen können
        if (MINEDGE > 0) {
          var feePct = (2 * FEE) / Math.max(1, capital * budgetPct);
          var roundTrip = 2 * spx + feePct;
          var barMs = barMsX;
          var barsHold = MAXHOLD ? MAXHOLD / barMs : 12;
          if (chE) {
            // Kanal-Edge: Der Weg bis zur Gegenkante muss die Kosten decken.
            var toEdge = dir === 'call' ? chE.zuObenPct : chE.zuUntenPct;
            var needPctC = omegaE > 0 ? (roundTrip / omegaE) * 100 : Infinity;
            if (!(toEdge >= needPctC * MINEDGE)) continue;
          } else {
            var ec = edgeCheck(closesUpto, barsHold, roundTrip, omegaE, MINEDGE);
            if (!ec.ok) continue;
          }
        }
        var qty;
        if (RISKP) {
          // Positionsgröße nach Risiko: ein ausgelöster Stop kostet immer ~RISKP % vom Kapital
          qty = Math.floor((capital * RISKP / 100) / (ask * Math.max(0.08, Math.abs(slT))));
          var qMax = Math.floor((capital * Math.max(budgetPct * 3, 0.10)) / ask);
          if (qty > qMax) qty = qMax;
        } else {
          qty = Math.floor((capital * budgetPct) / ask);
        }
        /* Beim BASISWERT sind Bruchstuecke erlaubt (CFD-Realitaet). Ohne das fiel jede
         * Aktie ueber capital*budgetPct still aus dem Backtest: Bei 10.000 $ Kapital und
         * 4 % Budget war alles ueber 400 $ ausgeschlossen - AVGO, BKNG, META. Der Test
         * handelte ein verzerrtes Billig-Teiluniversum und mass etwas anderes als die
         * Studie, die alle Werte gleich wichtete. Beim Schein bleibt die Stueckelung
         * ganzzahlig, so wird er auch gehandelt. */
        if (INSTRUMENT === 'basis') { qty = (capital * budgetPct) / ask; if (RISKP) qty = (capital * RISKP / 100) / (ask * Math.max(0.08, Math.abs(slT))); }
        var cost = qty * ask + FEE;
        if (qty * ask < 1 || cash < cost) continue;
        cash -= cost;
        open[sym] = { dir: dir, w: w, qty: qty, entry: ask, cost: cost, openT: t, spx: spx, chN: chN, chan: chRef, sl: slT, entrySpot: spot, basis: INSTRUMENT === 'basis' };
        if (ENTRY === 'orb' && orbState[sym]) orbState[sym].traded[dir] = true;   // Tageschance erst jetzt verbraucht
        lastTrade[sym] = t;
        dayCount[dk] = (dayCount[dk] || 0) + 1;
      }
      // Equity nur alle ~12 Bars aufzeichnen (Performance)
      if (ti % 12 === 0 || ti === times.length - 1) {
        var eq = cash;
        for (var s2 in open) {
          var bars2 = idx[s2], p2 = open[s2];
          eq += Math.max(0.001, warrantValue(p2.dir, p2.w, bars2[Math.min(cursor[s2], bars2.length - 1)][1], t) * (1 - (p2.spx || SP))) * p2.qty;
        }
        equity.push([t, eq]);
      }
    }
    // Rest glattstellen
    var letztT = times.length ? times[times.length - 1] : Date.now();
    Object.keys(open).forEach(function (s3) {
      var bars3 = idx[s3];
      closePos(s3, bars3[bars3.length - 1][1], bars3[bars3.length - 1][0], 'Backtest-Ende');
    });
    // Endstand NACH der Glattstellung aufzeichnen, sonst fehlen die letzten Exit-Kosten in end/retPct
    equity.push([letztT, cash]);

    var wins = trades.filter(function (tr) { return tr.pnl > 0; }).length;
    var final = equity.length ? equity[equity.length - 1][1] : capital;
    var peak = -Infinity, mdd = 0;
    equity.forEach(function (e) { peak = Math.max(peak, e[1]); mdd = Math.max(mdd, (peak - e[1]) / peak); });
    var avgHold = trades.length ? Math.round(trades.reduce(function (a, tr) { return a + tr.holdMin; }, 0) / trades.length) : 0;
    var feesTotal = trades.reduce(function (a, tr) { return a + (tr.fees || 0); }, 0);
    var summary2 = {
      start: capital, end: Math.round(final * 100) / 100,
      retPct: Math.round((final / capital - 1) * 10000) / 100,
      nTrades: trades.length, winRate: trades.length ? Math.round(wins / trades.length * 1000) / 10 : 0,
      maxDrawdownPct: Math.round(mdd * 1000) / 10, avgHoldMin: avgHold,
      feesTotal: Math.round(feesTotal * 100) / 100
    };
    Object.assign(summary2, computeStats(equity, trades, capital));
    // Die Gegenprobe laeuft IMMER mit, nicht auf Anforderung. Sie kostet fast nichts
    // und ist die einzige Zahl, die verhindert, dass eine schoene Ertragskurve als
    // Fund durchgeht, obwohl Muenzwerfen dasselbe gebracht haette.
    summary2.gegenprobe = gegenprobeRichtung(trades, 2000);
    // Signifikanz aus nicht ueberlappenden Monaten, nicht aus der Trade-Zahl.
    summary2.monatlich = monatsStatistik(equity);
    return { equity: equity, trades: trades, summary: summary2, bootstrap: bootstrapTrades(trades, capital) };
  }

  var Quant = {
    sma: sma, rsi: rsi, stdev: stdev, histVol: histVol, emaSeries: emaSeries,
    normCdf: normCdf, bsPrice: bsPrice, bsDelta: bsDelta,
    zigzag: zigzag, elliott: elliott, technical: technical,
    sentiment: sentiment, combine: combine, DEFAULT_WEIGHTS: DEFAULT_WEIGHTS,
    makeWarrant: makeWarrant, warrantValue: warrantValue, warrantAsk: warrantAsk, warrantBid: warrantBid,
    warrantOmega: warrantOmega, warrantAufgeld: warrantAufgeld, PROFILES: PROFILES,
    underlyingAtTarget: underlyingAtTarget,
    backtest: backtest, RATIO: RATIO,
    histVolIntraday: histVolIntraday, barMinOf: barMinOf, fertigeBars: fertigeBars, einstiegSignal: einstiegSignal, backtestIntraday: backtestIntraday, backtestIntradayMulti: backtestIntradayMulti,
    usSommerzeit: usSommerzeit, minutenSeitOeffnung: minutenSeitOeffnung,
    SETUP_ALLOW: SETUP_ALLOW, regimeValidate: regimeValidate,
    resampleBars: resampleBars, mtfAgrees: mtfAgrees, autoStop: autoStop,
    signalCross: signalCross, vwapLine: vwapLine, inWindow: inWindow,
    effSpread: effSpread, slipOf: slipOf, spreadCent: spreadCent,
    reversionSignal: reversionSignal, pullbackSignal: pullbackSignal, rsiExtremSignal: rsiExtremSignal,
    donchianSignal: donchianSignal, squeezeSignal: squeezeSignal, edgeCheck: edgeCheck, waveQuality: waveQuality,
    regressionChannel: regressionChannel, channelFit: channelFit, bestChannel: bestChannel,
    channelValid: channelValid, CHAN_MIN: CHAN_MIN, varianceRatio: varianceRatio,
    bewaehrungsUrteil: bewaehrungsUrteil,
    trendChannel: trendChannel, projectTrendChannel: projectTrendChannel,
    wendepunkte: wendepunkte, kanalUeber: kanalUeber, kanaele: kanaele, kanalSegmente: kanalSegmente, trendwechsel: trendwechsel,
    KANAL_MIN: KANAL_MIN, RECHENSTAND: RECHENSTAND, degapBarArray: degapBarArray,
    degapCloses: degapCloses, degapBars: degapBars,
    computeStats: computeStats, bootstrapTrades: bootstrapTrades, bestOfN: bestOfN, gegenprobeRichtung: gegenprobeRichtung, kanalVerzug: kanalVerzug, monatsStatistik: monatsStatistik, schattenKonfig: schattenKonfig, scheinKennzahlen: scheinKennzahlen, scheinRisikostufe: scheinRisikostufe, scheinRaster: scheinRaster, altlastGrund: altlastGrund
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Quant;
  else root.Quant = Quant;
})(typeof window !== 'undefined' ? window : globalThis);
