'use strict';
/* Auftrag Nr. 89 (Reel-Strategien, Teil 1) - Rechenkern. Reine Funktionen, kein Dateizugriff.
 * Die Regeln stehen in REGEL.md (Paragraph 2 des Auftrags woertlich, dazu die Lesarten L1 bis L19).
 * Rechenform einer Reihe: siehe daten.js (ausTagen). */

var START = 100000;
var EPS_GLEICH = 1e-9;          // L2: "gleich" heisst gleich bis auf Rechengenauigkeit (relativ zum Kurs)
var EMA_SPERRE = 250;           // 2.3: die ersten 250 Kerzen des Archivs erzeugen kein Signal
var H_LISTE = [5, 15, 30, 60];
var NW_LAGS = 5;
var FENSTER = [
  { name: 'W-Vor', von: '2016-01-04', bis: '2017-12-29' },
  { name: 'W-Papier', von: '2018-01-02', bis: '2023-09-28' },
  { name: 'W-Nach', von: '2023-09-29', bis: '2026-09-30' }
];
var KOSTEN = [
  { name: '0', art: 'bp', c: 0 },
  { name: 'Papier', art: 'aktie', f: 0.0005 },
  { name: '0,1', art: 'bp', c: 0.1 },
  { name: '0,25', art: 'bp', c: 0.25 },
  { name: '0,5', art: 'bp', c: 0.5 },
  { name: '1,0', art: 'bp', c: 1.0 },
  { name: '1,5', art: 'bp', c: 1.5 }
];

/** 2.1: VWAP des Tages nach jeder regulaeren Kerze. NaN, solange die Umsatzsumme null ist (L3). */
function vwapReihe(R) {
  var vw = new Float64Array(R.n);
  for (var d = 0; d < R.tagA.length; d++) {
    var pv = 0, vv = 0;
    for (var i = R.tagA[d]; i < R.tagE[d]; i++) {
      pv += (R.h[i] + R.l[i] + R.c[i]) / 3 * R.v[i];
      vv += R.v[i];
      vw[i] = vv > 0 ? pv / vv : NaN;
    }
  }
  return vw;
}

/** +1 Schluss ueber VWAP, -1 darunter, 0 gleich (bis auf Rechengenauigkeit) oder VWAP nicht definiert. */
function seite(c, vw) {
  var diff = c - vw;
  if (!(Math.abs(diff) > EPS_GLEICH * c)) return 0;
  return diff > 0 ? 1 : -1;
}

/** 2.2: Zustand R1 nach jedem Kerzenschluss: +1 long, -1 short, 0 noch keine Seite. Gleichstand haelt. */
function zustandR1(R, vw) {
  var s = new Int8Array(R.n), gleich = 0;
  for (var d = 0; d < R.tagA.length; d++) {
    var vorher = 0;
    for (var i = R.tagA[d]; i < R.tagE[d]; i++) {
      var x = seite(R.c[i], vw[i]);
      if (x === 0) gleich++;
      s[i] = x !== 0 ? x : vorher;
      vorher = s[i];
    }
  }
  s.gleichstaende = gleich;
  return s;
}

/** EMA ueber die ganze Reihe, fortlaufend ueber die Tage: alpha = 2/(n+1), Startwert = erster Schlusskurs. */
function ema(c, n) {
  var e = new Float64Array(c.length), a = 2 / (n + 1);
  if (!c.length) return e;
  e[0] = c[0];
  for (var i = 1; i < c.length; i++) e[i] = a * c[i] + (1 - a) * e[i - 1];
  return e;
}

/** 2.3: Zustand R2 nach jedem Kerzenschluss: +1, -1 oder 0 (ohne Position). */
function zustandR2(R, vw) {
  var e9 = ema(R.c, 9), e21 = ema(R.c, 21), e50 = ema(R.c, 50), s = new Int8Array(R.n);
  for (var i = EMA_SPERRE; i < R.n; i++) {
    var x = seite(R.c[i], vw[i]);
    if (x === 1 && e9[i] > e21[i] && e21[i] > e50[i]) s[i] = 1;
    else if (x === -1 && e9[i] < e21[i] && e21[i] < e50[i]) s[i] = -1;
  }
  return s;
}

/** Tage [d0, d1) eines Fensters (Datumsgrenzen einschliesslich). */
function fensterTage(R, f) {
  var d0 = 0, n = R.tagDatum.length;
  while (d0 < n && R.tagDatum[d0] < f.von) d0++;
  var d1 = d0;
  while (d1 < n && R.tagDatum[d1] <= f.bis) d1++;
  return [d0, d1];
}

/** 2.2 bis 2.5: spielt die Zustandsreihe s ueber die Tage [d0, d1) durch.
 *  fassung 'P': Handel zum Schluss der Signalkerze; 'N': zur Eroeffnung der naechsten vorhandenen Kerze.
 *  Die letzte Kerze des Tages loest keinen Handel aus; die Position wird zu ihrem Schluss glattgestellt.
 *  kosten: { art: 'bp', c } (Basispunkte je gehandeltem Betrag) oder { art: 'aktie', f } (Dollar je Aktie).
 *  protokoll (optional): Liste, in die jeder Handel als { i, preis, von, nach } geschrieben wird. */
function simuliere(R, s, d0, d1, fassung, kosten, protokoll) {
  var nT = d1 - d0;
  var aus = {
    tagErtrag: new Float64Array(nT), tagUmsatz: new Float64Array(nT), tagEnde: new Float64Array(nT),
    trades: 0, gewinner: 0, summeBrutto: 0, eimer: [0, 0, 0]
  };
  var bp = kosten.art === 'bp', cs = bp ? kosten.c / 10000 : 0, fest = bp ? 0 : kosten.f;
  var o = R.o, c = R.c, min = R.min, E = START, istP = fassung === 'P';
  if (!istP && fassung !== 'N') throw new Error('Fassung unbekannt: ' + fassung);
  for (var d = d0; d < d1; d++) {
    var a = R.tagA[d], e = R.tagE[d], E0 = E, umsatz = 0, pos = 0, q = 0, pe = 0, gebEin = 0, mark = E;
    var zu = min[e - 1] < 780 ? 780 : 960;       // L10: verkuerzter Tag, wenn die letzte Kerze vor 13:00 liegt
    for (var i = a; i < e; i++) {
      var letzte = i === e - 1, ziel = letzte ? 0 : s[i], wert;
      var erstBewerten = !istP && !letzte;       // N: der Handel faellt in die naechste Kerze
      if (erstBewerten) {
        wert = pos === 0 ? E : (pos > 0 ? q * c[i] : q * (2 * pe - c[i]));
        aus.eimer[min[i] < 630 ? 0 : (min[i] >= zu - 60 ? 2 : 1)] += Math.log(wert / mark);
        mark = wert;
      }
      if (ziel !== pos) {
        var p = erstBewerten ? o[i + 1] : c[i];
        if (protokoll) protokoll.push({ i: i, preis: p, von: pos, nach: ziel });
        if (pos !== 0) {                          // Ausstieg: Gebuehr auf den gehandelten Betrag q * p
          var fx = bp ? cs * p : fest;
          var Eneu = pos > 0 ? q * (p - fx) : q * (2 * pe - p - fx);
          umsatz += q * p;
          aus.trades++;
          aus.summeBrutto += pos > 0 ? p / pe - 1 : 1 - p / pe;
          /* Korrektur 1: Gewinner ist ein Trade mit Gewinn je Stueck nach Gebuehren ueber null - geprueft an den Kursen,
           * nicht am Vermoegen (dort entschied bei Ertrag genau null das letzte Bit). Gleichbedeutend mit Eneu > Evor. */
          var jeStueck = pos > 0 ? (p - fx) - (pe + gebEin) : (pe - p) - fx - gebEin;
          if (jeStueck > EPS_GLEICH * pe) aus.gewinner++;
          E = Eneu; pos = 0;
        }
        if (ziel !== 0) {                         // Einstieg: das ganze Vermoegen, Gebuehr eingerechnet (kein Hebel)
          var fe = bp ? cs * p : fest;
          gebEin = fe; q = E / (p + fe); pe = p; pos = ziel;
          umsatz += q * p;
        }
      }
      if (!erstBewerten) {
        wert = pos === 0 ? E : (pos > 0 ? q * c[i] : q * (2 * pe - c[i]));
        aus.eimer[min[i] < 630 ? 0 : (min[i] >= zu - 60 ? 2 : 1)] += Math.log(wert / mark);
        mark = wert;
      }
    }
    aus.tagErtrag[d - d0] = E / E0 - 1;
    aus.tagUmsatz[d - d0] = umsatz / E0;
    aus.tagEnde[d - d0] = E;
  }
  return aus;
}

function mittel(x) {
  var s = 0;
  for (var i = 0; i < x.length; i++) s += x[i];
  return x.length ? s / x.length : NaN;
}

/** Mittel, Standardfehler und t nach Newey-West (Bartlett-Gewichte 1 - l/(L+1)). */
function neweyWest(x, L) {
  var T = x.length, m = mittel(x), lrv = 0, i, l;
  for (i = 0; i < T; i++) lrv += (x[i] - m) * (x[i] - m);
  lrv /= T;
  for (l = 1; l <= L && l < T; l++) {
    var g = 0;
    for (i = l; i < T; i++) g += (x[i] - m) * (x[i - l] - m);
    lrv += 2 * (1 - l / (L + 1)) * g / T;
  }
  var se = Math.sqrt(lrv / T);
  return { mittel: m, se: se, t: se > 0 ? m / se : 0 };
}

/** 2.9: Kennzahlen eines Laufs. jahre = Kalenderjahr je Tag des Fensters. */
function kennzahlen(sim, jahre) {
  var r = sim.tagErtrag, T = r.length, m = mittel(r), q = 0, i;
  for (i = 0; i < T; i++) q += (r[i] - m) * (r[i] - m);
  var std = T > 1 ? Math.sqrt(q / (T - 1)) : NaN;
  var ende = T ? sim.tagEnde[T - 1] : START, gipfel = START, mdd = 0, jahr = {};
  for (i = 0; i < T; i++) {
    if (sim.tagEnde[i] > gipfel) gipfel = sim.tagEnde[i];
    var dd = 1 - sim.tagEnde[i] / gipfel;
    if (dd > mdd) mdd = dd;
    var j = jahre[i];
    jahr[j] = (jahr[j] == null ? 1 : jahr[j]) * (1 + r[i]);
  }
  Object.keys(jahr).forEach(function (k) { jahr[k] = jahr[k] - 1; });
  var nw = neweyWest(r, NW_LAGS), logSumme = sim.eimer[0] + sim.eimer[1] + sim.eimer[2];
  return {
    tage: T, gesamt: ende / START - 1, pa: Math.pow(ende / START, 252 / T) - 1, vol: std * Math.sqrt(252),
    sharpe: std > 0 ? m / std * Math.sqrt(252) : 0, rueckschlag: mdd,
    trades: sim.trades, tradesJeTag: sim.trades / T, trefferquote: sim.trades ? sim.gewinner / sim.trades : NaN,
    bruttoJeTradeBp: sim.trades ? sim.summeBrutto / sim.trades * 10000 : NaN,
    tagesumsatz: mittel(sim.tagUmsatz), mittelTagBp: nw.mittel * 10000, seTagBp: nw.se * 10000, t: nw.t,
    jahre: jahr,
    logErtrag: { ersteStunde: sim.eimer[0], mitte: sim.eimer[1], letzteStunde: sim.eimer[2] },
    anteil: logSumme !== 0 ? { ersteStunde: sim.eimer[0] / logSumme, mitte: sim.eimer[1] / logSumme, letzteStunde: sim.eimer[2] / logSumme } : null
  };
}

/** Kaufen-und-Halten (Kursertrag, ohne Ausschuettungen): erste Eroeffnung bis letzter Schluss des Fensters. */
function kaufenHalten(R, d0, d1) {
  var g = R.c[R.tagE[d1 - 1] - 1] / R.o[R.tagA[d0]];
  return { gesamt: g - 1, pa: Math.pow(g, 252 / (d1 - d0)) - 1 };
}

/** 2.5: Kostengrenze in Basispunkten je Seite aus dem Lauf mit c = 0. */
function kostengrenze(sim0) {
  var u = mittel(sim0.tagUmsatz);
  return u > 0 ? mittel(sim0.tagErtrag) / u * 10000 : NaN;
}

/** 2.11: der vorher festgelegte Satz. m = mittlerer Tagesertrag, t = Newey-West-t, bei c = 0 und c = 0,25. */
function satz(m0, t0, m025, t025) {
  if (m025 > 0 && t025 >= 2) return 'hält auch nach Kosten';
  if (m0 > 0 && t0 >= 2) return 'hält nur ohne Kosten';
  return 'hält nicht';
}

/** 2.8: Ertrag von der Eroeffnung der Kerze i bis zur Eroeffnung der ersten Kerze desselben Tages,
 *  die mindestens H Minuten spaeter beginnt (L13). NaN, wenn der Tag nicht reicht. */
function vorwaerts(R, H) {
  var vor = new Float64Array(R.n);
  for (var d = 0; d < R.tagA.length; d++) {
    var e = R.tagE[d], j = R.tagA[d];
    for (var i = R.tagA[d]; i < e; i++) {
      var zielMin = R.min[i] + H;
      while (j < e && R.min[j] < zielMin) j++;
      vor[i] = j < e ? R.o[j] / R.o[i] - 1 : NaN;
    }
  }
  return vor;
}

/** 2.8 Kontrolle: mittlerer Vorwaertsertrag je Kalenderjahr und Tagesminute ueber alle Tage der Reihe (L14). */
function kontrolle(R, vor) {
  var tab = {};
  for (var d = 0; d < R.tagA.length; d++) {
    var j = R.tagJahr[d];
    if (!tab[j]) tab[j] = { s: new Float64Array(1440), n: new Int32Array(1440) };
    for (var i = R.tagA[d]; i < R.tagE[d]; i++) {
      if (vor[i] === vor[i]) { tab[j].s[R.min[i]] += vor[i]; tab[j].n[R.min[i]]++; }
    }
  }
  return function (jahr, minute) { var t = tab[jahr]; return t && t.n[minute] ? t.s[minute] / t.n[minute] : NaN; };
}

/** 2.8: Ereignisse einer Zustandsreihe. ausNull = false (R1): nur Seitenwechsel +1 <-> -1 innerhalb des Tages;
 *  ausNull = true (R2): jeder Eintritt in long oder short aus einem anderen Zustand, der Tag beginnt ohne Position (L12).
 *  Rueckgabe: Liste { i (Signalkerze), tag, richtung }. Die letzte Kerze des Tages gibt kein Ereignis. */
function ereignisse(R, s, ausNull, d0, d1) {
  var liste = [];
  for (var d = d0; d < d1; d++) {
    var vorher = 0;
    for (var i = R.tagA[d]; i < R.tagE[d] - 1; i++) {
      var jetzt = s[i];
      if (jetzt !== 0 && jetzt !== vorher && (ausNull || vorher !== 0)) liste.push({ i: i, tag: d, richtung: jetzt });
      vorher = jetzt;
    }
  }
  return liste;
}

/** 2.8: Auswertung fuer ein H. Ertrag ab Eroeffnung der naechsten Kerze, in Signalrichtung, minus Kontrolle.
 *  Standardfehler ueber Handelstage gebuendelt (L15). */
function ereignisSicht(R, liste, vor, ktr) {
  var jeTag = {}, N = 0, summe = 0, summeRoh = 0;
  liste.forEach(function (ev) {
    var k = ev.i + 1, r = vor[k];
    if (r !== r) return;
    var basis = ktr(R.tagJahr[ev.tag], R.min[k]);
    if (basis !== basis) return;
    var x = ev.richtung * (r - basis);
    if (!jeTag[ev.tag]) jeTag[ev.tag] = { s: 0, n: 0 };
    jeTag[ev.tag].s += x; jeTag[ev.tag].n++;
    N++; summe += x; summeRoh += ev.richtung * r;
  });
  var tage = Object.keys(jeTag), G = tage.length;
  if (!N) return { n: 0, tage: 0, mittelBp: NaN, rohBp: NaN, seBp: NaN, t: NaN };
  var m = summe / N, q = 0;
  tage.forEach(function (t) { var a = jeTag[t].s - jeTag[t].n * m; q += a * a; });
  var se = G > 1 ? Math.sqrt(G / (G - 1) * q) / N : NaN;
  return { n: N, tage: G, mittelBp: m * 10000, rohBp: summeRoh / N * 10000, seBp: se * 10000, t: se > 0 ? m / se : NaN };
}

module.exports = {
  START: START, EPS_GLEICH: EPS_GLEICH, EMA_SPERRE: EMA_SPERRE, H_LISTE: H_LISTE, NW_LAGS: NW_LAGS, FENSTER: FENSTER, KOSTEN: KOSTEN,
  vwapReihe: vwapReihe, seite: seite, zustandR1: zustandR1, ema: ema, zustandR2: zustandR2, fensterTage: fensterTage,
  simuliere: simuliere, mittel: mittel, neweyWest: neweyWest, kennzahlen: kennzahlen, kaufenHalten: kaufenHalten,
  kostengrenze: kostengrenze, satz: satz, vorwaerts: vorwaerts, kontrolle: kontrolle, ereignisse: ereignisse, ereignisSicht: ereignisSicht
};
