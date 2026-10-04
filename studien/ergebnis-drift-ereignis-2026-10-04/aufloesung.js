'use strict';
/* M6 - Aufloesung, BLIND (Auftrag §2, §5.7).
 *
 * Dieses Modul bekommt die Ueberraschung NICHT als Eingabe. Jede Funktion nimmt ein Ereignis-Objekt mit GENAU den Feldern
 *   tag     Int32Array   Einstiegstag (Kalenderindex)
 *   quartal Int32Array   Kalenderquartal des Einstiegstags (Jahr * 4 + Quartal)
 *   abn     Float64Array Ertrag Eroeffnung -> Eroeffnung H Tage spaeter, abzueglich des Mittels der Klasse am selben Tag (Pp)
 * und wirft bei jedem weiteren Feld (pruefeEingabe) - ein Skript, das Ertrag und Ueberraschung zusammenbringen koennte, kann
 * das hier nicht tun. An die Stelle der Ueberraschung tritt eine Zufallszahl mit festem Startwert. Ausgegeben werden nur
 * Streuungen und Zaehlungen, nie ein Mittel des Ertrags.
 *
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var ERLAUBT = { tag: 1, quartal: 1, abn: 1 };

function pruefeEingabe(ev) {
  if (!ev || typeof ev !== 'object') throw new Error('Ereignisse fehlen');
  Object.keys(ev).forEach(function (k) { if (!ERLAUBT[k]) throw new Error('M6 ist blind: Feld "' + k + '" ist als Eingabe nicht erlaubt (nur tag, quartal, abn)'); });
  if (!ev.tag || !ev.quartal || !ev.abn || ev.tag.length !== ev.abn.length || ev.quartal.length !== ev.abn.length) throw new Error('tag, quartal, abn muessen gleich lang sein');
}

/* Zufall mit festem Startwert (mulberry32) */
function zufallsquelle(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function gueltige(ev) { var a = []; for (var i = 0; i < ev.abn.length; i++) if (isFinite(ev.abn[i])) a.push(i); return a; }

function sdVon(werte) {
  var n = werte.length; if (n < 2) return NaN;
  var s = 0, i; for (i = 0; i < n; i++) s += werte[i];
  var m = s / n, ss = 0; for (i = 0; i < n; i++) ss += (werte[i] - m) * (werte[i] - m);
  return Math.sqrt(ss / (n - 1));
}

/** Kopie von abn, an den Quantilen p und 1-p gestutzt (winsorisiert) - ueber ALLE Ereignisse, also blind. */
function stutze(abn, p) {
  var g = []; for (var i = 0; i < abn.length; i++) if (isFinite(abn[i])) g.push(abn[i]);
  g.sort(function (a, b) { return a - b; });
  if (!g.length) return Float64Array.from(abn);
  var lo = g[Math.floor(p * (g.length - 1))], hi = g[Math.ceil((1 - p) * (g.length - 1))];
  var aus = new Float64Array(abn.length);
  for (var j = 0; j < abn.length; j++) aus[j] = isFinite(abn[j]) ? Math.min(hi, Math.max(lo, abn[j])) : NaN;
  return aus;
}

/** (a) Streuung ueber alle Ereignisse und naive Fehler. */
function streuung(ev) {
  pruefeEingabe(ev);
  var idx = gueltige(ev), w = idx.map(function (i) { return ev.abn[i]; }), sd = sdVon(w), n = w.length;
  var tage = {}; idx.forEach(function (i) { tage[ev.tag[i]] = 1; });
  return { n: n, tage: Object.keys(tage).length, sd: sd,
    naivAbstand: sd * Math.sqrt(2 / (n / 10)),       /* oberstes gegen unterstes Zehntel */
    naivOben: sd * Math.sqrt(1 / (n / 10)) };        /* oberstes Zehntel gegen das Klassenmittel (das Mittel ist schon abgezogen) */
}

/** (c) Korrelation der bereinigten Ertraege von Ereignissen desselben Einstiegstags (Intraklassen-Korrelation, Varianzzerlegung). */
function gleicherTag(ev) {
  pruefeEingabe(ev);
  var idx = gueltige(ev), N = idx.length, je = {}, i;
  var s = 0; for (i = 0; i < N; i++) s += ev.abn[idx[i]];
  var m = s / N;
  idx.forEach(function (j) { var t = ev.tag[j]; var o = je[t] || (je[t] = { n: 0, s: 0, ss: 0 }); o.n++; o.s += ev.abn[j]; o.ss += ev.abn[j] * ev.abn[j]; });
  var ks = Object.keys(je), k = ks.length, ssb = 0, ssw = 0, n2 = 0;
  ks.forEach(function (t) { var o = je[t], mt = o.s / o.n; ssb += o.n * (mt - m) * (mt - m); ssw += o.ss - o.n * mt * mt; n2 += o.n * o.n; });
  var msb = ssb / (k - 1), msw = ssw / (N - k), n0 = (N - n2 / N) / (k - 1);
  var rho = (msb - msw) / (msb + (n0 - 1) * msw);
  var gewichtet = n2 / N;                            /* mittlere Tagesgroesse aus Sicht eines Ereignisses */
  return { n: N, tage: k, jeTagMittel: N / k, jeTagGewichtet: gewichtet, rho: rho,
    /* Fehler-Faktor, wenn ALLE Ereignisse eines Tages im selben Zehntel laegen (obere Grenze der Ballung nach Tagen) */
    faktorVolleBallung: Math.sqrt(Math.max(0, 1 + (gewichtet - 1) * rho)) };
}

function neweyWest(x, lag) {
  var D = x.length; if (D < 2) return NaN;
  var s = 0, i; for (i = 0; i < D; i++) s += x[i];
  var m = s / D, g0 = 0; for (i = 0; i < D; i++) g0 += (x[i] - m) * (x[i] - m);
  g0 /= D;
  var v = g0, L = Math.min(lag, D - 1);
  for (var l = 1; l <= L; l++) {
    var g = 0; for (i = l; i < D; i++) g += (x[i] - m) * (x[i - l] - m);
    v += 2 * (1 - l / (L + 1)) * g / D;
  }
  return Math.sqrt(Math.max(v, 0) / D);
}

/**
 * (b) und (d): Zufalls-Zuteilungen. Jedes Ereignis bekommt eine Zufallszahl an Stelle der Ueberraschung; je Kalenderquartal
 * bilden das oberste und das unterste Zehntel die beiden Koerbe. Ausgewertet wird, wie eine Messung es taete: erst das Mittel je
 * Einstiegstag, dann das Mittel ueber die Tage ("tag"); daneben das Mittel ueber alle Ereignisse ("pool").
 * opt: { laeufe, start, anteil (0,1), lag (Newey-West-Lag der Tagesreihe), jeTag (true: die Zufallszahl haengt am TAG - alle
 *        Ereignisse eines Tages teilen sie; obere Grenze der Ballung), pflanze (Pp, Kunstfall: auf jedes Ereignis des obersten
 *        Zehntels addiert, vom untersten abgezogen) }
 * Ergebnis: Standardfehler = Streuung der Laeufe; dazu der Fehler aus der Tagesreihe (Newey-West), gemittelt ueber die Laeufe.
 */
function zufall(ev, opt) {
  pruefeEingabe(ev);
  opt = opt || {};
  var laeufe = opt.laeufe || 200, anteil = opt.anteil || 0.1, lag = opt.lag || 0, pflanze = opt.pflanze || 0;
  var rnd = zufallsquelle(opt.start === undefined ? 1 : opt.start);
  var idx = gueltige(ev), jeQ = {}, maxTag = 0;
  idx.forEach(function (i) { (jeQ[ev.quartal[i]] = jeQ[ev.quartal[i]] || []).push(i); if (ev.tag[i] > maxTag) maxTag = ev.tag[i]; });
  var quartale = Object.keys(jeQ).map(function (q) { return jeQ[q]; });
  var u = new Float64Array(ev.abn.length), uTag = new Float64Array(maxTag + 1);
  var sO = new Float64Array(maxTag + 1), nO = new Int32Array(maxTag + 1), sU = new Float64Array(maxTag + 1), nU = new Int32Array(maxTag + 1);
  var erg = { abstandTag: [], abstandPool: [], obenTag: [], obenPool: [], nwOben: [], nwAbstand: [], tageOben: [], ereignisseOben: [], tAbstand: [], tOben: [] };
  var zuKlein = 0;
  for (var L = 0; L < laeufe; L++) {
    var i, t;
    if (opt.jeTag) { for (t = 0; t <= maxTag; t++) uTag[t] = rnd(); for (i = 0; i < idx.length; i++) u[idx[i]] = uTag[ev.tag[idx[i]]] + 1e-9 * rnd(); }
    else for (i = 0; i < idx.length; i++) u[idx[i]] = rnd();
    sO.fill(0); nO.fill(0); sU.fill(0); nU.fill(0);
    var pO = 0, pnO = 0, pU = 0, pnU = 0;
    for (var q = 0; q < quartale.length; q++) {
      var l = quartale[q], k = Math.floor(l.length * anteil);
      if (k < 1) { if (L === 0) zuKlein++; continue; }
      l.sort(function (a, b) { return u[a] - u[b]; });
      for (i = 0; i < k; i++) {
        var a = l[i], b = l[l.length - 1 - i];
        var wa = ev.abn[a] - pflanze, wb = ev.abn[b] + pflanze;
        sU[ev.tag[a]] += wa; nU[ev.tag[a]]++; pU += wa; pnU++;
        sO[ev.tag[b]] += wb; nO[ev.tag[b]]++; pO += wb; pnO++;
      }
    }
    var reiheO = [], reiheU = [];
    for (t = 0; t <= maxTag; t++) { if (nO[t]) reiheO.push(sO[t] / nO[t]); if (nU[t]) reiheU.push(sU[t] / nU[t]); }
    var mO = 0, mU = 0;
    for (i = 0; i < reiheO.length; i++) mO += reiheO[i];
    for (i = 0; i < reiheU.length; i++) mU += reiheU[i];
    mO /= reiheO.length; mU /= reiheU.length;
    var seO = neweyWest(reiheO, lag), seU = neweyWest(reiheU, lag), seA = Math.sqrt(seO * seO + seU * seU);
    erg.abstandTag.push(mO - mU); erg.abstandPool.push(pO / pnO - pU / pnU); erg.obenTag.push(mO); erg.obenPool.push(pO / pnO);
    erg.nwOben.push(seO); erg.nwAbstand.push(seA); erg.tageOben.push(reiheO.length); erg.ereignisseOben.push(pnO);
    erg.tAbstand.push((mO - mU) / seA); erg.tOben.push(mO / seO);
  }
  function mittel(a) { var s = 0; for (var j = 0; j < a.length; j++) s += a[j]; return s / a.length; }
  var aus = { laeufe: laeufe, n: idx.length, quartale: quartale.length, quartaleZuKlein: zuKlein, jeTag: !!opt.jeTag, lag: lag,
    tageObenMittel: mittel(erg.tageOben), ereignisseOben: mittel(erg.ereignisseOben),
    seAbstandTag: sdVon(erg.abstandTag), seAbstandPool: sdVon(erg.abstandPool),
    seObenTag: sdVon(erg.obenTag), seObenPool: sdVon(erg.obenPool),
    nwAbstandTag: mittel(erg.nwAbstand), nwObenTag: mittel(erg.nwOben) };
  if (pflanze) {
    /* Kunstfall: der eingepflanzte Abstand 2 x pflanze muss wiedergefunden werden (Mittel der Laeufe minus Mittel ohne Pflanzung
     * ist per Bau exakt 2 x pflanze im Pool); gezaehlt wird, wie oft |t| >= 2 erreicht wird. Ohne Pflanzung wird nichts gezaehlt,
     * was ein Mittel des Ertrags verriete. */
    aus.pflanze = pflanze;
    aus.anteilTAbstandUeber2 = erg.tAbstand.filter(function (x) { return x >= 2; }).length / laeufe;
  }
  return aus;
}

/* Normalverteilung: Macht eines einseitig-positiven Tests mit Schwelle z bei wahrem Effekt delta und Fehler se */
function phi(x) {
  var t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2);
  var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}
function macht(delta, se, schwelle) { return phi(delta / se - (schwelle === undefined ? 1.96 : schwelle)); }

module.exports = { pruefeEingabe: pruefeEingabe, streuung: streuung, gleicherTag: gleicherTag, zufall: zufall, stutze: stutze,
  neweyWest: neweyWest, zufallsquelle: zufallsquelle, sdVon: sdVon, macht: macht, phi: phi, ERLAUBT: Object.keys(ERLAUBT) };
