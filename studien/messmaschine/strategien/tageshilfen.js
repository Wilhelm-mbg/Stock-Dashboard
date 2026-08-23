'use strict';
/* RECHENKERN FUER DIE EIGENBAU-THESEN (Vorregistrierung 2026-08-23).
 *
 * Alles hier liest ausschliesslich bars[0..i]. Zwei Stellen verdienen Erklaerung,
 * weil sie leicht zu einem Vorgriff werden:
 *
 * 1) SITZUNGSSCHLUSS OHNE BLICK NACH VORN. Ob eine Kerze die letzte des Tages ist,
 *    liesse sich trivial an bars[i+1] ablesen - das waere ein Vorgriff. Ein Haendler
 *    weiss es aber ohne Zukunft, weil die Boerse einen Kalender hat. Genau das wird
 *    hier nachgebaut: Die ANFANGSSTUNDE des Tages verraet die Zeitumstellung
 *    (13 UTC = Sommerzeit, letzte Kerze 19; 14 UTC = Winterzeit, letzte Kerze 20).
 *    Im Archiv gilt das fuer 725 von 732 Handelstagen; die 7 verkuerzten Tage
 *    (Handelsschluss vorgezogen) feuern nie. Das ist die vorsichtige Richtung.
 *
 * 2) DIE GROESSE, DIE DIE MASCHINE SPAETER ABRECHNET. Einstieg ist bars[i][1],
 *    Ausstieg bars[i+H][1]. Bei H = 1 ist die verdiente Rendite also die der Kerze
 *    i+1, nicht die der Kerze i. Wer historisch die Rendite der Kerze i schaetzt,
 *    schaetzt das falsche Objekt. Deshalb ist der "Stunden-Ertrag" hier immer
 *    bars[k+1]/bars[k] - 1, also die Rendite NACH einer Kerze der Stunde h - genau
 *    das, was auch die Kontrolle der Maschine mittelt.
 *
 * Der Zwischenspeicher haengt an der bars-Liste selbst (WeakMap). Er wird einmal je
 * Symbol gebaut und von allen Varianten geteilt; ohne ihn liefe eine Messung Stunden.
 */
var speicher = new WeakMap();

function median(a) {
  var s = a.slice().sort(function (x, y) { return x - y; });
  var m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function baue(bars) {
  var n = bars.length;
  var ende = new Uint8Array(n);        // 1 = letzte Kerze der Sitzung
  var tagNr = new Int32Array(n).fill(-1);   // laufende Nummer der Sitzung, nur an Schlusskerzen
  var schlussIdx = [];
  var letzterTag = null, ersteStunde = -1;
  var stunde = new Int8Array(n);
  for (var i = 0; i < n; i++) {
    var d = new Date(bars[i][0]);
    var tag = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    var h = d.getUTCHours();
    stunde[i] = h;
    if (tag !== letzterTag) { letzterTag = tag; ersteStunde = h; }
    var erwartet = ersteStunde === 13 ? 19 : (ersteStunde === 14 ? 20 : -1);
    if (h === erwartet) { ende[i] = 1; tagNr[i] = schlussIdx.length; schlussIdx.push(i); }
  }

  /* Tagesrenditen: Schluss zu Schluss zwischen aufeinanderfolgenden Sitzungen. */
  var tagRet = new Float64Array(schlussIdx.length).fill(NaN);
  for (var j = 1; j < schlussIdx.length; j++) {
    var a = bars[schlussIdx[j - 1]][1], b = bars[schlussIdx[j]][1];
    if (a > 0 && b > 0) tagRet[j] = b / a - 1;
  }

  /* Je UTC-Stunde: die Reihenfolge der Vorkommen, und je Vorkommen der Ertrag DANACH.
   * "Danach" ist Absicht - siehe Kopf, Punkt 2. */
  var stdListe = {};                   // h -> [indices]
  var stdPos = new Int32Array(n).fill(-1);
  var folgeRet = new Float64Array(n).fill(NaN);
  for (var k = 0; k < n; k++) {
    var hh = stunde[k];
    var L = stdListe[hh] || (stdListe[hh] = []);
    stdPos[k] = L.length; L.push(k);
    if (k + 1 < n) { var p0 = bars[k][1], p1 = bars[k + 1][1]; if (p0 > 0 && p1 > 0) folgeRet[k] = p1 / p0 - 1; }
  }

  /* Rollender Median des Umsatzes derselben Stunde ueber die 60 VORIGEN Vorkommen,
   * und rollende Standardabweichung der Kerzenrendite ueber dieselben. Einmal gebaut,
   * weil die Variantenschleife sonst jede Kerze neu sortieren wuerde. */
  var volMed = new Float64Array(n).fill(NaN);
  var retSd = new Float64Array(n).fill(NaN);
  Object.keys(stdListe).forEach(function (hh) {
    var L = stdListe[hh];
    for (var q = 60; q < L.length; q++) {
      var vv = [], rr = [];
      for (var z = q - 60; z < q; z++) {
        var idx = L[z];
        vv.push(bars[idx][2] || 0);
        var vorher = idx - 1 >= 0 ? bars[idx - 1][1] : 0;
        if (vorher > 0 && bars[idx][1] > 0) rr.push(bars[idx][1] / vorher - 1);
      }
      volMed[L[q]] = median(vv);
      if (rr.length > 5) {
        var mu = rr.reduce(function (x, y) { return x + y; }, 0) / rr.length;
        var va = rr.reduce(function (x, y) { return x + (y - mu) * (y - mu); }, 0) / (rr.length - 1);
        retSd[L[q]] = Math.sqrt(va);
      }
    }
  });

  return { ende: ende, tagNr: tagNr, schlussIdx: schlussIdx, tagRet: tagRet,
           stunde: stunde, stdListe: stdListe, stdPos: stdPos, folgeRet: folgeRet,
           volMed: volMed, retSd: retSd };
}

function X(bars) {
  var c = speicher.get(bars);
  if (!c) { c = baue(bars); speicher.set(bars, c); }
  return c;
}

/* Streuung der n Tagesrenditen VOR der Sitzung j - die heutige gehoert nicht dazu,
 * sonst misst die Schwelle sich teilweise an sich selbst. */
function tagesSd(c, j, n) {
  if (j - n < 1) return null;
  var s = 0, s2 = 0, m = 0;
  for (var z = j - n; z < j; z++) { var r = c.tagRet[z]; if (!isFinite(r)) continue; s += r; s2 += r * r; m++; }
  if (m < n * 0.8) return null;
  var mu = s / m, va = (s2 - m * mu * mu) / (m - 1);
  return va > 0 ? Math.sqrt(va) : null;
}

/* Mittelwert und Standardfehler des Stunden-Ertrags ueber die n Vorkommen derselben
 * Stunde VOR Kerze i. Das letzte zulaessige Vorkommen ist i-1: dessen Folge-Ertrag
 * endet auf Kerze i und ist damit bekannt. */
function stundenDrift(c, bars, i, n) {
  var h = c.stunde[i], L = c.stdListe[h], q = c.stdPos[i];
  if (!L || q < n + 1) return null;
  var s = 0, s2 = 0, m = 0;
  for (var z = q - n; z < q; z++) {
    var idx = L[z];
    if (idx + 1 > i) continue;                 // Folge-Ertrag laege in der Zukunft
    var r = c.folgeRet[idx];
    if (!isFinite(r)) continue;
    s += r; s2 += r * r; m++;
  }
  if (m < n * 0.8) return null;
  var mu = s / m, va = (s2 - m * mu * mu) / (m - 1);
  if (!(va > 0)) return null;
  return { mittel: mu, se: Math.sqrt(va / m), n: m };
}

module.exports = { X: X, tagesSd: tagesSd, stundenDrift: stundenDrift };
