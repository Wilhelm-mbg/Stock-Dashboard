'use strict';
/* Auftrag Nr. 89R-2 (Reel-Strategien, Teil 2) - Rechenkern. Reine Funktionen, kein Dateizugriff.
 * Die Regeln stehen in REGEL.md (Paragraph 2 des Auftrags woertlich, dazu die Lesarten M1 bis M26).
 * Bausteine aus Teil 1 (per require, unveraendert): Rechenform der Reihe, VWAP, EMA, Seite (Lesart L2),
 * Zustand R1 und seine Ereignisse, Vorwaertsertrag, Kontrolle, Ereignis-Sicht. */
var K1 = require('../reel-vwap-ema-2026-10-04/kern');

var EPS = K1.EPS_GLEICH;            // 1e-9: "gleich" bis auf Rechengenauigkeit (Teil 1, L2)
var SPERRE = K1.EMA_SPERRE;         // 250: die ersten 250 Kerzen des Archivs ohne Signal (2.1)
var ATR_N = 14;                     // 2.1
var H_LISTE = [1, 2, 3, 5, 10, 15]; // 2.3
var AUSLOESER = ['A1', 'A1f', 'A2', 'A3', 'Alle'];
var FILTER = 0.5;                   // 2.2 A1f: Annahme des PM
var MIN_SPANNE_VON = 570, MIN_SPANNE_BIS = 584;   // 2.2 A3: 09:30 bis 09:44
var MIN_AUSBRUCH = 585;             // ab 09:45
var MIN_LETZTER_EINSTIEG = 944;     // 2.4 (d): Einstiegskerze beginnt spaetestens 15:44
var ABKUEHLUNG = 5;                 // 2.4 (b): Annahme des PM
/* 2.6: die Option ueber den Basiswert genaehert. Alles in Kursbewegung = Anteil des Einstiegskurses. */
var PRAEMIE = 0.0049, DELTA = 0.5;
var STOPP = 0.17 * PRAEMIE / DELTA;     // 0,1666 % = 1 R
var SCHARF = 0.06 * PRAEMIE / DELTA;    // 0,0588 %
var KOSTEN = 0.01 * PRAEMIE / DELTA;    // 0,0098 % je Trade hin und zurueck
var RUECKFALL = 0.6;                    // verkauft bei 60 % des Hoechststands (40 % abgegeben)
var BREMSE_R = 1.44;                    // 2.7
var HUERDE_BP = 1.0;                    // 2.3
var WIEDERHOLUNGEN = 200;               // 2.8
var BLOCK = 23;                         // 2.9

/** mulberry32 - fester Zufall, wiederholbar. */
function zufall(saat) {
  var a = saat >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 2.1: ATR = einfaches Mittel der wahren Spanne ueber die letzten 14 Kerzen einschliesslich der aktuellen,
 *  fortlaufend ueber die Tage. Die erste Kerze des Archivs hat keine Vorkerze: wahre Spanne = Hoch - Tief (M2).
 *  Vor der 14. Kerze NaN. */
function atrReihe(R) {
  var n = R.n, tr = new Float64Array(n), atr = new Float64Array(n), i, k;
  for (i = 0; i < n; i++) {
    var x = R.h[i] - R.l[i];
    if (i > 0) {
      var a = Math.abs(R.h[i] - R.c[i - 1]), b = Math.abs(R.l[i] - R.c[i - 1]);
      if (a > x) x = a;
      if (b > x) x = b;
    }
    tr[i] = x;
  }
  for (i = 0; i < n; i++) {
    if (i < ATR_N - 1) { atr[i] = NaN; continue; }
    var s = 0;
    for (k = i - ATR_N + 1; k <= i; k++) s += tr[k];
    atr[i] = s / ATR_N;
  }
  return atr;
}

/** Kennzeichen "letzte Kerze ihres Tages" und Tag je Kerze. */
function tagesbau(R) {
  var letzte = new Uint8Array(R.n), tagVon = new Int32Array(R.n);
  for (var d = 0; d < R.tagA.length; d++) {
    for (var i = R.tagA[d]; i < R.tagE[d]; i++) tagVon[i] = d;
    if (R.tagE[d] > R.tagA[d]) letzte[R.tagE[d] - 1] = 1;
  }
  return { letzte: letzte, tagVon: tagVon };
}

/** 2.2: die drei Ausloeser und "Alle" als Richtungsreihen (+1 Call, -1 Put, 0 nichts), je Kerze nach ihrem Schluss.
 *  Die letzte Kerze eines Tages loest nie etwas aus. Rueckgabe zusaetzlich eine Zaehlung (Doppelte, Widersprueche, Filter). */
function ausloeser(R, vw) {
  var n = R.n, nT = R.tagA.length, bau = tagesbau(R), letzte = bau.letzte;
  var A1 = new Int8Array(n), A1f = new Int8Array(n), A2 = new Int8Array(n), A3 = new Int8Array(n), Alle = new Int8Array(n);
  var z = { A1: 0, A1f: 0, A1gefiltert: 0, A1inSperre: 0, A2: 0, A3: 0, Alle: 0, doppelt: 0, widerspruch: 0, tageOhneSpanne: 0, gleichstaendeEma50: 0 };
  /* A1: genau das Ereignis R1 aus Teil 1 (Zustand R1, Lesart L12 dort) */
  var s1 = K1.zustandR1(R, vw), ev = K1.ereignisse(R, s1, false, 0, nT);
  ev.forEach(function (e) { A1[e.i] = e.richtung; });
  z.A1 = ev.length;
  /* A1f: A1, aber nicht bei zusammengedrueckten EMA 9/21 (M5); EMA und ATR erst ab Kerze 251 (M3) */
  var e9 = K1.ema(R.c, 9), e21 = K1.ema(R.c, 21), e50 = K1.ema(R.c, 50), atr = atrReihe(R), i;
  for (i = 0; i < n; i++) {
    if (!A1[i]) continue;
    if (i < SPERRE) { z.A1inSperre++; continue; }
    if (zusammengedrueckt(e9[i], e21[i], atr[i], R.c[i])) { z.A1gefiltert++; continue; }
    A1f[i] = A1[i];
    z.A1f++;
  }
  /* A2: Seite des Schlusses gegenueber der EMA 50 derselben Kerze wechselt gegenueber der Vorkerze (auch ueber Nacht);
   * Gleichstand haelt die Seite; die erste Seite des Archivs ist kein Wechsel (M6). */
  var seiteVor = 0;
  for (i = 0; i < n; i++) {
    var x = K1.seite(R.c[i], e50[i]);
    if (x === 0) z.gleichstaendeEma50++;
    var jetzt = x !== 0 ? x : seiteVor;
    if (i >= SPERRE && !letzte[i] && seiteVor !== 0 && jetzt !== seiteVor) { A2[i] = jetzt; z.A2++; }
    seiteVor = jetzt;
  }
  /* A3: Spanne der Kerzen 09:30 bis 09:44 (ueber die Tagesminute); ab 09:45 der erste Schluss darueber / darunter (M7) */
  for (var d = 0; d < nT; d++) {
    var a = R.tagA[d], e = R.tagE[d], hoch = -Infinity, tief = Infinity, da = false;
    for (i = a; i < e; i++) {
      if (R.min[i] >= MIN_SPANNE_VON && R.min[i] <= MIN_SPANNE_BIS) { da = true; if (R.h[i] > hoch) hoch = R.h[i]; if (R.l[i] < tief) tief = R.l[i]; }
    }
    if (!da) { z.tageOhneSpanne++; continue; }
    var oben = false, unten = false;
    for (i = a; i < e - 1; i++) {
      if (R.min[i] < MIN_AUSBRUCH) continue;
      if (!oben && K1.seite(R.c[i], hoch) === 1) { A3[i] = 1; oben = true; z.A3++; } else if (!unten && K1.seite(R.c[i], tief) === -1) { A3[i] = -1; unten = true; z.A3++; }
    }
  }
  kombiniere(A1f, A2, A3, Alle, z);
  return { A1: A1, A1f: A1f, A2: A2, A3: A3, Alle: Alle, zaehlung: z, tagVon: bau.tagVon };
}

/** 2.2 A1f: "zusammengedrueckt", wenn |EMA9 - EMA21| < 0,5 x ATR; Gleichheit bis auf 1e-9 des Kurses ist NICHT zusammengedrueckt (M5). */
function zusammengedrueckt(e9, e21, atr, c) { return FILTER * atr - Math.abs(e9 - e21) > EPS * c; }

/** 2.2 "Alle": A1f, A2, A3 zusammen; gleiche Richtung zaehlt einmal, Widerspruch entfaellt (M8). Schreibt nach Alle, zaehlt in z. */
function kombiniere(A1f, A2, A3, Alle, z) {
  for (var i = 0; i < Alle.length; i++) {
    var plus = (A1f[i] === 1) + (A2[i] === 1) + (A3[i] === 1), minus = (A1f[i] === -1) + (A2[i] === -1) + (A3[i] === -1);
    Alle[i] = 0;
    if (plus && minus) { z.widerspruch++; continue; }
    if (plus + minus > 1) z.doppelt++;
    if (plus) Alle[i] = 1; else if (minus) Alle[i] = -1;
    if (plus || minus) z.Alle++;
  }
}

/** Ereignisliste einer Richtungsreihe ueber die Tage [d0, d1) in der Form, die K1.ereignisSicht erwartet. */
function liste(R, sig, d0, d1) {
  var aus = [];
  for (var d = d0; d < d1; d++) {
    for (var i = R.tagA[d]; i < R.tagE[d]; i++) if (sig[i]) aus.push({ i: i, tag: d, richtung: sig[i] });
  }
  return aus;
}

/** 2.3: der vorher festgelegte Satz der Ereignis-Sicht (Hauptzelle). */
function satzEreignis(mittelBp, t) {
  if (t >= 2 && mittelBp >= HUERDE_BP) return 'Richtungsvorteil über der geschätzten Hürde';
  if (t >= 2 && mittelBp > 0 && mittelBp < HUERDE_BP) return 'Richtungsvorteil vorhanden, aber unter der geschätzten Hürde';
  return 'kein Richtungsvorteil';
}

/** 2.4 bis 2.7: ein Bot ueber die Tage [d0, d1).
 *  sig: Richtungsreihe der Ausloeser. opt.zufall (nur Z1): die Richtung wird je Einstieg gewuerfelt, sig liefert nur die Zeitpunkte.
 *  opt.kosten: Kosten in Kursbewegung (Standard KOSTEN). opt.protokoll: Liste fuer jeden Trade.
 *  Rueckgabe: tagSumme (Netto-Kursbewegung je Tag), tagTrades, Summen fuer die Kennzahlen. */
function bot(R, sig, d0, d1, opt) {
  opt = opt || {};
  var kosten = opt.kosten == null ? KOSTEN : opt.kosten, wuerfel = opt.zufall || null, prot = opt.protokoll || null;
  var nT = d1 - d0, o = R.o, h = R.h, l = R.l, c = R.c, min = R.min, bremse = BREMSE_R * STOPP;
  var S = {
    tagSumme: new Float64Array(nT), tagTrades: new Int32Array(nT), trades: 0, gewinner: 0, summeGewinnR: 0, verlierer: 0, summeVerlustR: 0,
    summeR: 0, kurve: 0, gipfel: 0, rueckschlagR: 0, calls: 0, arten: { stopp: 0, sicherung: 0, tagesende: 0 },
    ausloeser: 0, einstiege: 0, verfallen: { offen: 0, abkuehlung: 0, bremse: 0, spaet: 0 }
  };
  for (var d = d0; d < d1; d++) {
    var a = R.tagA[d], e = R.tagE[d], offen = false, dir = 0, p0 = 0, M = 0, iEin = -1, letzterAus = -100000, real = 0;
    for (var i = a; i < e; i++) {
      if (offen) {
        /* 2.5, Kerze fuer Kerze; g = Kursbewegung in Signalrichtung seit dem Einstiegskurs */
        var gU = dir > 0 ? (l[i] - p0) / p0 : (p0 - h[i]) / p0, gG = dir > 0 ? (h[i] - p0) / p0 : (p0 - l[i]) / p0;
        var gO = dir * (o[i] - p0) / p0, gC = dir * (c[i] - p0) / p0, aus = NaN, art = '';
        if (gU <= -STOPP + EPS) {                                       // 1. Stopp
          aus = gO <= -STOPP + EPS ? gO : -STOPP; art = 'stopp';
        } else if (M >= SCHARF - EPS && gU <= RUECKFALL * M + EPS) {     // 2. Rueckfall gegen den alten Hoechststand
          var marke = RUECKFALL * M;
          aus = gO <= marke + EPS ? gO : marke; art = 'sicherung';
        } else {
          if (gG > M) {                                                  // 3. Hoechststand nachziehen
            M = gG;
            if (M >= SCHARF - EPS && gC <= RUECKFALL * M + EPS) { aus = RUECKFALL * M; art = 'sicherung'; }   // 4.
          }
          if (aus !== aus && i === e - 1) { aus = gC; art = 'tagesende'; }  // 5.
        }
        if (aus === aus) {
          var netto = aus - kosten, r = netto / STOPP;
          S.tagSumme[d - d0] += netto; S.tagTrades[d - d0]++; S.trades++; S.summeR += r; S.arten[art]++;
          if (netto > EPS) { S.gewinner++; S.summeGewinnR += r; } else { S.verlierer++; S.summeVerlustR += r; }
          S.kurve += r;
          if (S.kurve > S.gipfel) S.gipfel = S.kurve;
          if (S.gipfel - S.kurve > S.rueckschlagR) S.rueckschlagR = S.gipfel - S.kurve;
          if (prot) prot.push({ tag: d, iEin: iEin, iAus: i, richtung: dir, preis: p0, g: aus, netto: netto, r: r, art: art });
          offen = false; letzterAus = min[i]; real += netto;
        }
      }
      if (i < e - 1 && sig[i] !== 0) {                                   // 2.4: Ausloeser nach dem Schluss von i
        S.ausloeser++;
        var j = i + 1;
        if (offen) S.verfallen.offen++;
        else if (min[j] - letzterAus < ABKUEHLUNG) S.verfallen.abkuehlung++;
        else if (real >= bremse - EPS) S.verfallen.bremse++;
        else if (min[j] > MIN_LETZTER_EINSTIEG) S.verfallen.spaet++;
        else {
          offen = true; dir = wuerfel ? (wuerfel() < 0.5 ? 1 : -1) : sig[i]; p0 = o[j]; M = 0; iEin = j; S.einstiege++;
          if (dir > 0) S.calls++;
        }
      }
    }
  }
  return S;
}

/** Z2: Kandidaten sind die Kerzen von 09:45 bis 15:44, die nicht die letzte ihres Tages sind (M20). */
function kandidatenZ2(R, d0, d1) {
  var n = 0;
  for (var d = d0; d < d1; d++) {
    for (var i = R.tagA[d]; i < R.tagE[d] - 1; i++) if (R.min[i] >= MIN_AUSBRUCH && R.min[i] <= MIN_LETZTER_EINSTIEG) n++;
  }
  return n;
}

/** Z2: fuellt ziel (Int8Array der Laenge R.n) auf den Tagen [d0, d1) mit Zufallsausloesern. */
function fuelleZ2(R, d0, d1, p, z, ziel) {
  for (var d = d0; d < d1; d++) {
    var a = R.tagA[d], e = R.tagE[d];
    for (var i = a; i < e; i++) {
      ziel[i] = 0;
      if (i < e - 1 && R.min[i] >= MIN_AUSBRUCH && R.min[i] <= MIN_LETZTER_EINSTIEG && z() < p) ziel[i] = z() < 0.5 ? 1 : -1;
    }
  }
}

/** 2.9: Kennzahlen eines Bot-Laufs. jahre = Kalenderjahr je Tag des Fensters. */
function kennzahlen(S, jahre) {
  var T = S.tagSumme.length, N = S.trades, m = N ? S.summeR / N : NaN;
  var G = 0, gruen = 0, serie = 0, besteSerie = 0, bloecke = 0, bloeckeGruen = 0, imBlock = 0, blockGruen = true;
  var schlecht = Infinity, best = -Infinity, q = 0, jahr = {};
  for (var t = 0; t < T; t++) {
    var n = S.tagTrades[t];
    if (!n) continue;                         // Tage ohne Trade zaehlen nicht und unterbrechen nichts
    G++;
    var r = S.tagSumme[t] / STOPP, istGruen = S.tagSumme[t] > EPS;
    if (istGruen) { gruen++; serie++; if (serie > besteSerie) besteSerie = serie; } else serie = 0;
    imBlock++;
    if (!istGruen) blockGruen = false;
    if (imBlock === BLOCK) { bloecke++; if (blockGruen) bloeckeGruen++; imBlock = 0; blockGruen = true; }
    if (r < schlecht) schlecht = r;
    if (r > best) best = r;
    var abw = r - n * m;
    q += abw * abw;
    var j = jahre[t];
    if (!jahr[j]) jahr[j] = { summeR: 0, trades: 0, tageMitTrade: 0, gruen: 0 };
    jahr[j].summeR += r; jahr[j].trades += n; jahr[j].tageMitTrade++; if (istGruen) jahr[j].gruen++;
  }
  var se = G > 1 ? Math.sqrt(G / (G - 1) * q) / N : NaN;
  return {
    tage: T, tageMitTrade: G, trades: N, tradesJeTag: T ? N / T : NaN, trefferquote: N ? S.gewinner / N : NaN,
    mittlererGewinnR: S.gewinner ? S.summeGewinnR / S.gewinner : NaN, mittlererVerlustR: S.verlierer ? S.summeVerlustR / S.verlierer : NaN,
    rJeTrade: m, seR: se, t: se > 0 ? m / se : NaN, rJeTag: T ? S.summeR / T : NaN,
    anteilGruen: G ? gruen / G : NaN, laengsteSerie: besteSerie, bloecke: bloecke, bloeckeAlleGruen: bloeckeGruen,
    anteilBloeckeGruen: bloecke ? bloeckeGruen / bloecke : NaN,
    schlechtesterTagR: G ? schlecht : NaN, besterTagR: G ? best : NaN, summeR: S.summeR, rueckschlagR: S.rueckschlagR,
    anteilCalls: S.einstiege ? S.calls / S.einstiege : NaN, arten: S.arten, ausloeser: S.ausloeser, einstiege: S.einstiege, verfallen: S.verfallen,
    jahre: jahr
  };
}

/** Quantil mit linearer Interpolation (Position p * (n - 1) in der sortierten Liste; M22). */
function quantil(sortiert, p) {
  var n = sortiert.length;
  if (!n) return NaN;
  var hpos = p * (n - 1), lo = Math.floor(hpos), hi = Math.min(lo + 1, n - 1);
  return sortiert[lo] + (hpos - lo) * (sortiert[hi] - sortiert[lo]);
}

var VERTEILT = ['trades', 'tradesJeTag', 'tageMitTrade', 'trefferquote', 'mittlererGewinnR', 'mittlererVerlustR', 'rJeTrade', 'seR', 't', 'rJeTag',
  'anteilGruen', 'laengsteSerie', 'bloecke', 'bloeckeAlleGruen', 'anteilBloeckeGruen', 'schlechtesterTagR', 'besterTagR', 'summeR', 'rueckschlagR',
  'anteilCalls', 'ausloeser', 'einstiege'];

/** Median und 2,5-/97,5-%-Stelle je Kennzahl ueber die Wiederholungen. */
function verteilung(liste) {
  var aus = { wiederholungen: liste.length, median: {}, q025: {}, q975: {} };
  VERTEILT.forEach(function (k) {
    var x = liste.map(function (kz) { return kz[k]; }).filter(function (v) { return v === v; }).sort(function (a, b) { return a - b; });
    aus.median[k] = quantil(x, 0.5); aus.q025[k] = quantil(x, 0.025); aus.q975[k] = quantil(x, 0.975);
  });
  return aus;
}

/** 2.8 Z1: dieselben Ausloeser-Zeitpunkte, Richtung je Einstieg gewuerfelt. */
function kontrolleZ1(R, sig, d0, d1, saat, wdh, jahre) {
  var z = zufall(saat), liste = [];
  for (var w = 0; w < wdh; w++) liste.push(kennzahlen(bot(R, sig, d0, d1, { zufall: z }), jahre));
  return verteilung(liste);
}

/** 2.8 Z2: Zufallszeit mit der Wahrscheinlichkeit p je Kandidatenkerze, Richtung gewuerfelt. */
function kontrolleZ2(R, d0, d1, p, saat, wdh, jahre) {
  var z = zufall(saat), liste = [], sig = new Int8Array(R.n), ausl = 0;
  for (var w = 0; w < wdh; w++) {
    fuelleZ2(R, d0, d1, p, z, sig);
    var kz = kennzahlen(bot(R, sig, d0, d1), jahre);
    ausl += kz.ausloeser;
    liste.push(kz);
  }
  var v = verteilung(liste);
  v.p = p;
  v.mittlereAusloeserJeTag = ausl / wdh / (d1 - d0);
  return v;
}

/** 2.9: der vorher festgelegte Satz der Struktur-Sicht (strikt ueber der 97,5-%-Stelle von Z1). */
function satzStruktur(botRJeTrade, z1q975) {
  return botRJeTrade > z1q975 ? 'Die Auslöser tragen etwas bei' : 'Die Auslöser tragen gegenüber gewürfelter Richtung nichts bei';
}

/** Umkehrung der Standardnormalverteilung (Acklam, relativer Fehler unter 1,2e-9). */
function normalQuantil(p) {
  var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  var q, r;
  if (p < 0.02425) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - 0.02425) return -normalQuantil(1 - p);
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Schwelle fuer |t| nach Bonferroni bei m Zellen, zweiseitig 5 % (M11). */
function bonferroni(m) { return normalQuantil(1 - 0.025 / m); }

module.exports = {
  EPS: EPS, SPERRE: SPERRE, ATR_N: ATR_N, H_LISTE: H_LISTE, AUSLOESER: AUSLOESER, FILTER: FILTER, MIN_AUSBRUCH: MIN_AUSBRUCH,
  MIN_LETZTER_EINSTIEG: MIN_LETZTER_EINSTIEG, ABKUEHLUNG: ABKUEHLUNG, PRAEMIE: PRAEMIE, DELTA: DELTA, STOPP: STOPP, SCHARF: SCHARF, KOSTEN: KOSTEN,
  RUECKFALL: RUECKFALL, BREMSE_R: BREMSE_R, HUERDE_BP: HUERDE_BP, WIEDERHOLUNGEN: WIEDERHOLUNGEN, BLOCK: BLOCK,
  zufall: zufall, atrReihe: atrReihe, tagesbau: tagesbau, ausloeser: ausloeser, zusammengedrueckt: zusammengedrueckt, kombiniere: kombiniere, liste: liste, satzEreignis: satzEreignis, bot: bot,
  kandidatenZ2: kandidatenZ2, fuelleZ2: fuelleZ2, kennzahlen: kennzahlen, quantil: quantil, verteilung: verteilung,
  kontrolleZ1: kontrolleZ1, kontrolleZ2: kontrolleZ2, satzStruktur: satzStruktur, normalQuantil: normalQuantil, bonferroni: bonferroni
};
