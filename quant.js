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
  function makeWarrant(dir, spot, vol, nowMs) {
    var strike = Math.round(spot * (dir === 'call' ? 1.05 : 0.95) * 100) / 100;
    var expiry = nowMs + 60 * 86400000;
    var iv = Math.min(1.5, Math.max(0.15, vol * 1.1));
    return { strike: strike, expiry: expiry, iv: iv, ratio: RATIO };
  }
  function warrantValue(dir, w, spot, nowMs) {
    var T = Math.max(0, (w.expiry - nowMs) / (365 * 86400000));
    return bsPrice(dir, spot, w.strike, T, w.iv, RISK_FREE) * w.ratio;
  }
  function warrantAsk(dir, w, spot, nowMs) { return warrantValue(dir, w, spot, nowMs) * (1 + SPREAD); }
  function warrantBid(dir, w, spot, nowMs) { return Math.max(0.001, warrantValue(dir, w, spot, nowMs) * (1 - SPREAD)); }

  /** Effektiver Spread: skaliert mit der impliziten Vola (hektischer Markt = teurer) */
  function effSpread(iv, base) {
    base = base === undefined ? SPREAD : base;
    return Math.min(base * 2.5, Math.max(base * 0.8, base * (0.7 + iv)));
  }
  /** Slippage-Anteil je Ausführung (auf den Scheinkurs) */
  function slipOf(iv, base) {
    base = base === undefined ? 0.005 : base;
    return base * (0.5 + iv);
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
  var PROFILES = {
    atm21:   { name: 'Moderat (ATM, 21 Tage)',        otmPct: 0.00, days: 21 },
    otm3_14: { name: 'Spekulativ (3 % OTM, 14 Tage)', otmPct: 0.03, days: 14 },
    otm5_10: { name: 'Heiß (5 % OTM, 10 Tage)',       otmPct: 0.05, days: 10 }
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

    // Wir iterieren über den Index der (pro Symbol gleich langen End-)Serien
    for (var i = start; i < minLen; i++) {
      var t = histMap[syms[0]][histMap[syms[0]].length - minLen + i][0];

      // Positionen bewerten / schließen
      for (var pi = positions.length - 1; pi >= 0; pi--) {
        var pos = positions[pi];
        var serie = histMap[pos.sym];
        var spot = serie[serie.length - minLen + i][1];
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
          var upto = full.slice(0, full.length - minLen + i + 1);
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
              var sr = histMap[p.sym]; return a + warrantBid(p.dir, p.w, sr[sr.length - minLen + i][1], t) * p.qty;
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
        var sr = histMap[p.sym];
        eq += warrantBid(p.dir, p.w, sr[sr.length - minLen + i][1], t) * p.qty;
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
  var RECHENSTAND = 4;

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
  var SETUP_ALLOW = {
    ausbruch: ['kreuzung', 'range'],
    umkehr: ['ueberdehnung', 'welle']
  };
  /** KI-Antwort gegen Whitelist und harte Plausibilitätsregeln prüfen. */
  function regimeValidate(w, f) {
    if (!w || !SETUP_ALLOW[w.setup]) return { ok: false, grund: 'Setup unbekannt' };
    if (SETUP_ALLOW[w.setup].indexOf(w.ausloeser) === -1) return { ok: false, grund: 'Auslöser passt nicht zum Setup' };
    if (['1m', '5m'].indexOf(w.zeitrahmen) === -1) return { ok: false, grund: 'Zeitrahmen unzulässig' };
    // Harte Sperren – die gelten auch dann, wenn das Modell etwas anderes will
    if (w.setup === 'umkehr' && (f.trendAnteilPct >= 70 || f.trendAnteilPct <= 30)) return { ok: false, grund: 'Umkehr im Trendmarkt gesperrt' };
    if (w.ausloeser === 'welle' && f.mittlererWellenScore < 45) return { ok: false, grund: 'Wellental ohne Wellenmuster gesperrt' };
    if (w.ausloeser === 'range' && !(f.minutenSeitEroeffnung != null && f.minutenSeitEroeffnung <= 150)) return { ok: false, grund: 'Eröffnungs-Range nur früh am Tag' };
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
    var ENTRY = opts.entryMode || 'cross';                             // 'cross' | 'reversion' | 'wave'
    var ZTHR = opts.zThr || 2;                                         // z-Score-Schwelle (Rücksetzer/Wellenreiter)
    var MINEDGE = opts.minEdge === undefined ? 1.5 : opts.minEdge;     // Kosten-Breakeven-Filter (0 = aus)
    var MINQ = opts.minQuality === undefined ? 60 : opts.minQuality;   // Wellen-Qualitäts-Schwelle
    var CHAN = !!opts.channel;                                         // Regressionskanal (nur Wellenreiter)
    var CHN = opts.channelN || 0;                                      // Kanal-Fenster in Bars (0 = automatisch: 2,5 Wellenlängen)
    var MTF = !!opts.mtf;                                              // 5-Min-Bestätigung (für 1-Min-Serien)
    var RISKP = opts.riskPct || 0;                                     // Positionsgröße nach Risiko (% vom Kapital je Stop)
    var ORBMIN = opts.orbMin || 30;                                    // Opening-Range-Dauer in Minuten
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
    function isLastBarOfDay(s, ci) {
      var bars = idx[s];
      return ci === bars.length - 1 || dayKey(bars[ci + 1][0]) !== dayKey(bars[ci][0]);
    }
    function closePos(sym, spot, t, why) {
      var p = open[sym];
      var bid = Math.max(0.001, warrantValue(p.dir, p.w, spot, t) * (1 - (p.spx || SP)));
      var proceeds = bid * p.qty - FEE;
      cash += proceeds;
      trades.push({ sym: sym, dir: p.dir, openT: p.openT, closeT: t, entry: p.entry, exit: bid, qty: p.qty, pnl: proceeds - p.cost, fees: 2 * FEE, why: why, holdMin: Math.round((t - p.openT) / 60000) });
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
          var bid = Math.max(0.001, warrantValue(p.dir, p.w, spot, t) * (1 - (p.spx || SP)));
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
        var win = bars.slice(Math.max(0, ci - Math.max(period * 4, CHAN ? 380 : 260)), ci + 1);
        var chE = null, chN = 0, chRef = null;
        if (ENTRY === 'wave') {
          var wq = waveQuality(win, LINE, period, ZTHR);
          if (!wq.signal || wq.score < MINQ) continue;
          dir = wq.signal;
          if (CHAN) {
            // Chart-technische Kanal-Erkennung; ohne gültigen Kanal kein Trade.
            var dgE = degapBarArray(win);
            chE = trendChannel(dgE);
            if (!chE || !chE.gueltig) continue;
            chN = chE.N;
            chRef = { kanal: chE, i0: ci, off: dgE[dgE.length - 1][1] - spot };
            // Einstieg nur am Kanalrand …
            if (dir === 'call' && chE.pos > 0.30) continue;
            if (dir === 'put' && chE.pos < 0.70) continue;
            // … und nie gegen einen Kanal, dessen Richtung statistisch belegt ist
            if (dir === 'call' && chE.trend === 'down') continue;
            if (dir === 'put' && chE.trend === 'up') continue;
          }
        } else if (ENTRY === 'reversion') {
          var rsig = reversionSignal(win, LINE, period, ZTHR);
          if (!rsig.signal) continue;
          dir = rsig.signal;
        } else if (ENTRY === 'orb') {
          var os2 = orbState[sym];
          if (!os2 || !os2.done) continue;
          var confO = confirmBps / 10000;
          // WICHTIG: Die Tageschance wird erst nach dem tatsächlichen Kauf als verbraucht
          // markiert. Sonst frisst ein von einem Filter abgelehnter Ausbruch den Trade des Tages.
          if (spot > os2.high * (1 + confO) && !os2.traded.call) dir = 'call';
          else if (spot < os2.low * (1 - confO) && !os2.traded.put) dir = 'put';
          else continue;
        } else {
          var sig = signalCross(win, LINE, period, confirmBps);
          if (!sig.crossed) continue;
          dir = sig.crossed === 'up' ? 'call' : 'put';
        }
        if (MTF && !mtfAgrees(win, dir, 5)) continue; // 5-Min-Chart widerspricht
        if (TREND && ENTRY !== 'reversion') { // übergeordneter Trend (Pflicht beim Wellenreiter)
          // Kanalrichtung UND übergeordneter Trend müssen passen. Ein Seitwärtskanal
          // innerhalb eines Abwärtstrends ist kein Freibrief für Long-Einstiege.
          if (chE) {
            if (dir === 'call' && chE.trend === 'down') continue;
            if (dir === 'put' && chE.trend === 'up') continue;
          }
          {
            var trendCloses = bars.slice(Math.max(0, ci - 240), ci + 1).map(function (b) { return b[1]; });
            if (trendCloses.length >= 100) {
              var e100 = emaSeries(trendCloses, 100);
              if (ENTRY === 'wave') {
                // Wellen-Tal liegt naturgemäß oft UNTER der EMA100 – deshalb zählt
                // die Richtung der EMA (steigend/fallend), nicht die Kurslage.
                var rising = e100[e100.length - 1] > e100[Math.max(0, e100.length - 9)];
                if ((dir === 'call' && !rising) || (dir === 'put' && rising)) continue;
              } else {
                var up100 = spot > e100[e100.length - 1];
                if ((dir === 'call' && !up100) || (dir === 'put' && up100)) continue;
              }
            }
          }
        }
        var closesUpto = bars.slice(Math.max(0, ci - 300), ci + 1).map(function (b) { return b[1]; });
        // Volatilität muss auf das Bar-Raster hochgerechnet werden: 390 Handelsminuten je Tag
        // geteilt durch die Bar-Länge. Ein fester Wert (78 = 5-Min-Bars) unterschätzt die Vola
        // auf 1-Min-Daten um den Faktor √5 – und macht damit die Scheine zu billig.
        var barsProTag = Math.max(1, Math.round(390 / Math.max(1, barMinOf(bars, ci))));
        var iv = Math.min(1.5, Math.max(0.15, histVolIntraday(closesUpto, barsProTag) * 1.1));
        var strike = spot * (1 + (dir === 'call' ? OTM : -OTM));
        var w = { strike: strike, expiry: t + EXPD * 86400000, iv: iv, ratio: RATIO };
        var spx = effSpread(iv, SP) + slipOf(iv, SLIPB); // vola-abhängiger Spread + Slippage
        var ask = warrantValue(dir, w, spot, t) * (1 + spx);
        if (ask <= 0.001) continue;
        var omegaE = warrantOmega(dir, w, spot, t);
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
        var cost = qty * ask + FEE;
        if (qty < 1 || cash < cost) continue;
        cash -= cost;
        open[sym] = { dir: dir, w: w, qty: qty, entry: ask, cost: cost, openT: t, spx: spx, chN: chN, chan: chRef, sl: slT };
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
    histVolIntraday: histVolIntraday, barMinOf: barMinOf, backtestIntraday: backtestIntraday,
    usSommerzeit: usSommerzeit, minutenSeitOeffnung: minutenSeitOeffnung,
    SETUP_ALLOW: SETUP_ALLOW, regimeValidate: regimeValidate,
    resampleBars: resampleBars, mtfAgrees: mtfAgrees, autoStop: autoStop,
    signalCross: signalCross, vwapLine: vwapLine, inWindow: inWindow,
    effSpread: effSpread, slipOf: slipOf,
    reversionSignal: reversionSignal, edgeCheck: edgeCheck, waveQuality: waveQuality,
    regressionChannel: regressionChannel, channelFit: channelFit, bestChannel: bestChannel,
    channelValid: channelValid, CHAN_MIN: CHAN_MIN, varianceRatio: varianceRatio,
    bewaehrungsUrteil: bewaehrungsUrteil,
    trendChannel: trendChannel, projectTrendChannel: projectTrendChannel,
    KANAL_MIN: KANAL_MIN, RECHENSTAND: RECHENSTAND, degapBarArray: degapBarArray,
    degapCloses: degapCloses, degapBars: degapBars,
    computeStats: computeStats, bootstrapTrades: bootstrapTrades
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Quant;
  else root.Quant = Quant;
})(typeof window !== 'undefined' ? window : globalThis);
