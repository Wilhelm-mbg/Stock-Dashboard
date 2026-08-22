'use strict';
/* Querschnitts-Momentum (Momentum-Buch) als reine Funktion fuer die Signalstudie.
 *
 * Quelle der Definition: Stock-Dashboard/momentum.js (staerke/rangfolge/auswahl),
 * Parameter STANDARD {rueckblick:231, luecke:21, anteil:0.10, minWerte:25, halten:63}.
 * Staerke = Kurs[d-21] / Kurs[d-252] - 1  (231 Handelstage, endend 21 Tage vor d).
 *
 * Abbildung auf das 60m-Archiv: Tagesschluss = letzter 60m-Bar je New-York-Handelstag.
 * Das Signal ist ein QUERSCHNITT - es braucht das ganze Universum (params.vb aus
 * vorbereiten()). Es feuert nur am ERSTEN Bar eines Handelstages (aus dem Praefix
 * erkennbar: Tag von bars[i] != Tag von bars[i-1]) und nutzt ausschliesslich Schluesse
 * von Tagen < d, genauer d-21 und d-252. Der laufende Tag geht nie ein.
 *
 * dir +1 = staerkstes Zehntel (belegte Kante, long). dir -1 = schwaechstes Zehntel
 * (NICHT in der App belegt - durchlauf() ist long-only; nur als Gegenseite fuer die
 * Studie, die Long und Short getrennt misst).
 */
var M = require('../../../momentum.js');
var Q = require('../../../quant.js');

var STANDARD = { rueckblick: 231, luecke: 21, anteil: 0.10, minWerte: 25, halten: 63, minSymJeTag: 30 };

/** Kalendertag in New York (YYYY-MM-DD) fuer einen UTC-Stempel. */
function nyTag(t) {
  var d = new Date(t);
  var off = Q.usSommerzeit(d) ? 4 : 5;
  return new Date(t - off * 3600000).toISOString().slice(0, 10);
}

/** Tagesschluesse aus Bars: letzter Bar je NY-Tag unter bars[0..bis]. Rueckgabe {tag: kurs}. */
function tagesSchluesse(bars, bis) {
  var out = {};
  var n = bis == null ? bars.length : Math.min(bars.length, bis + 1);
  for (var k = 0; k < n; k++) out[nyTag(bars[k][0])] = bars[k][1];
  return out;
}

/** Universum {SYM: bars60m} -> gemeinsame Tagesachse und Kursmatrix wie in mittelfrist.js.
 *  Rein: gleiche Eingabe, gleiche Ausgabe. Tage mit weniger als minSymJeTag Werten fallen weg. */
function vorbereiten(universum, opts) {
  opts = opts || {};
  var minSym = opts.minSymJeTag || STANDARD.minSymJeTag;
  var syms = Object.keys(universum).filter(function (s) { return !/-USD$/.test(s); });   // kein Krypto (24/7-Kalender)
  var schluss = {}, zaehler = {};
  syms.forEach(function (s) {
    schluss[s] = tagesSchluesse(universum[s]);
    Object.keys(schluss[s]).forEach(function (tag) { zaehler[tag] = (zaehler[tag] || 0) + 1; });
  });
  var zeiten = Object.keys(zaehler).filter(function (t) { return zaehler[t] >= minSym; }).sort();
  var idx = {}; zeiten.forEach(function (t, i) { idx[t] = i; });
  var map = {};
  syms.forEach(function (s) {
    var a = new Array(zeiten.length).fill(null);
    Object.keys(schluss[s]).forEach(function (tag) { var i = idx[tag]; if (i !== undefined) a[i] = schluss[s][tag]; });
    map[s] = a;
  });
  return { syms: syms, zeiten: zeiten, idx: idx, map: map };
}

/** Anzahl Kalendertage strikt vor `tag` (lower bound). So haengt der Index nicht davon
 *  ab, ob der laufende Tag schon in der Achse steht. */
function tageVor(zeiten, tag) {
  var lo = 0, hi = zeiten.length;
  while (lo < hi) { var m = (lo + hi) >> 1; if (zeiten[m] < tag) lo = m + 1; else hi = m; }
  return lo;
}

/** Signal fuer (bars, i, params). params: {sym, vb (aus vorbereiten) | universum, rueckblick, luecke, anteil, minWerte}
 *  Rueckgabe {dir:+1|-1, rang, n, staerke} | null. */
function momentumSignal(bars, i, params) {
  params = params || {};
  if (!bars || i < 1 || i >= bars.length) return null;
  if (nyTag(bars[i][0]) === nyTag(bars[i - 1][0])) return null;           // nur erster Bar des Tages
  var vb = params.vb || (params.universum ? vorbereiten(params.universum, params) : null);
  if (!vb || !params.sym || !vb.map[params.sym]) return null;
  var tag = nyTag(bars[i][0]);
  var di = tageVor(vb.zeiten, tag);                                        // Index des Tages d (= Zahl der Tage davor)
  var o = { rueckblick: params.rueckblick || STANDARD.rueckblick,
            luecke: params.luecke === undefined ? STANDARD.luecke : params.luecke,
            minWerte: params.minWerte || STANDARD.minWerte };
  var r = M.rangfolge(vb.map, di, o);                                      // nutzt nur Indizes di-luecke und di-luecke-rueck
  if (!r) return null;
  var pos = -1;
  for (var k = 0; k < r.length; k++) if (r[k].sym === params.sym) { pos = k; break; }
  if (pos < 0) return null;
  var n = Math.max(5, Math.round(r.length * (params.anteil || STANDARD.anteil)));
  if (pos < n) return { dir: +1, rang: pos + 1, n: r.length, staerke: r[pos].staerke };
  if (pos >= r.length - n) return { dir: -1, rang: pos + 1, n: r.length, staerke: r[pos].staerke };
  return null;
}

module.exports = { STANDARD: STANDARD, nyTag: nyTag, tagesSchluesse: tagesSchluesse, vorbereiten: vorbereiten,
  tageVor: tageVor, momentumSignal: momentumSignal };
