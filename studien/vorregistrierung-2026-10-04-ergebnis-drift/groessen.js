'use strict';
/* Stufe 1 - die Groessen der Muehle, Schaetzer EREIGNIS-MITTEL (jede Meldung gleich gewichtet; Auftrag §1.3, Entwurf §5).
 *
 *   A       = Mittel(oberstes Zehntel) - Mittel(unterstes Zehntel)
 *   B       = Mittel(oberstes Zehntel)             (der Ertrag ist schon um das Klassen-Tagesmittel bereinigt)
 *   B netto = Mittel(oberstes Zehntel, je Ereignis abzueglich der Eroeffnungs-Huerde seiner Klasse)
 *   M       = Mittel aller Melder mit Signal (oben, unten und Mitte)
 *   B - M
 *
 * Fehler der TAGESREIHE (ueber Tage geclustert, Newey-West mit Lag H-1, Bartlett-Gewichte): jede Groesse ist ein Mittel ueber
 * Ereignisse; je Handelstag d des Fensters wird die Summe der Abweichungen der Ereignisse dieses Einstiegstags vom Mittel ihrer
 * Gruppe gebildet, geteilt durch die Gruppengroesse (z_d; Tage ohne Ereignis haben z_d = 0). Varianz = Summe z_d^2 +
 * 2 x Summe ueber l = 1..L von (1 - l/(L+1)) x Summe z_d z_(d-l). Bei A und B - M ist z_d die Differenz der beiden Gruppen -
 * die Kovarianz zwischen den Gruppen am selben und an benachbarten Tagen ist damit enthalten.
 *
 * Das Modul bekommt eine fertige Zuteilung (1 oben, -1 unten, 0 Mitte, sonst kein Signal) - ob sie aus der Ueberraschung, einer
 * Zufallszahl oder dem Placebo stammt, weiss es nicht. Simulation, keine Anlageberatung.
 */

function nwSumme(z, lag) {
  var D = z.length, v = 0, i, L = Math.min(lag, D - 1);
  for (i = 0; i < D; i++) v += z[i] * z[i];
  for (var l = 1; l <= L; l++) {
    var gsum = 0;
    for (i = l; i < D; i++) gsum += z[i] * z[i - l];
    v += 2 * (1 - l / (L + 1)) * gsum;
  }
  return Math.sqrt(Math.max(v, 0));
}

/**
 * ev:  { tag: Int32Array, x: Float64Array (bereinigter Ertrag in Pp; NaN = Haltefenster nicht abgeschlossen), kosten: Float64Array (Pp je Umlauf) }
 * zt:  Int8Array Zuteilung je Ereignis
 * opt: { lag, tagVon, tagBis (Kalenderindex, einschliesslich), pflanzeOben, pflanzeUnten (Pp; Kunstfall), ohneFehler: true -> nur die Mittel }
 */
function groessen(ev, zt, opt) {
  var n = ev.tag.length, tagVon = opt.tagVon, D = opt.tagBis - tagVon + 1, pO = opt.pflanzeOben || 0, pU = opt.pflanzeUnten || 0;
  var sO = 0, nO = 0, sU = 0, nU = 0, sA = 0, nA = 0, sK = 0, i, x, c;
  for (i = 0; i < n; i++) {
    c = zt[i]; x = ev.x[i];
    if (c < -1 || !isFinite(x)) continue;
    if (c === 1) { x += pO; sO += x; nO++; sK += ev.kosten[i]; }
    else if (c === -1) { x -= pU; sU += x; nU++; }
    sA += x; nA++;
  }
  var mO = sO / nO, mU = sU / nU, mA = sA / nA, mK = sK / nO;
  var aus = { nOben: nO, nUnten: nU, nAlle: nA, A: mO - mU, B: mO, Bnetto: mO - mK, M: mA, BM: mO - mA, kostenOben: mK, mittelUnten: mU };
  if (opt.ohneFehler) return aus;
  var zB = new Float64Array(D), zBn = new Float64Array(D), zU = new Float64Array(D), zM = new Float64Array(D), tageOben = {}, d;
  for (i = 0; i < n; i++) {
    c = zt[i]; x = ev.x[i];
    if (c < -1 || !isFinite(x)) continue;
    d = ev.tag[i] - tagVon;
    if (d < 0 || d >= D) throw new Error('Ereignis ausserhalb des Fensters der Tagesreihe');
    if (c === 1) { x += pO; zB[d] += (x - mO) / nO; zBn[d] += (x - ev.kosten[i] - (mO - mK)) / nO; tageOben[d] = 1; }
    else if (c === -1) { x -= pU; zU[d] += (x - mU) / nU; }
    zM[d] += (x - mA) / nA;
  }
  var zAr = new Float64Array(D), zBM = new Float64Array(D);
  for (d = 0; d < D; d++) { zAr[d] = zB[d] - zU[d]; zBM[d] = zB[d] - zM[d]; }
  var lag = opt.lag;
  aus.nw = { A: nwSumme(zAr, lag), B: nwSumme(zB, lag), Bnetto: nwSumme(zBn, lag), M: nwSumme(zM, lag), BM: nwSumme(zBM, lag) };
  aus.tageOben = Object.keys(tageOben).length;
  return aus;
}

function sd(a) {
  var n = a.length, s = 0, i; for (i = 0; i < n; i++) s += a[i];
  var m = s / n, ss = 0; for (i = 0; i < n; i++) ss += (a[i] - m) * (a[i] - m);
  return Math.sqrt(ss / (n - 1));
}
function mittel(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }

var NAMEN = ['A', 'B', 'Bnetto', 'BM'];

/** Aus den Zufallslaeufen (je Lauf ein Ergebnis von `groessen`): Fehler = Streuung der Laeufe; dazu das Mittel der Tagesreihen-Fehler. */
function zufallsFehler(laeufe) {
  var aus = { zufall: {}, nwMittel: {}, laeufe: laeufe.length };
  NAMEN.forEach(function (k) {
    aus.zufall[k] = sd(laeufe.map(function (g) { return g[k]; }));
    aus.nwMittel[k] = mittel(laeufe.map(function (g) { return g.nw[k]; }));
  });
  aus.nwMittel.M = mittel(laeufe.map(function (g) { return g.nw.M; }));
  return aus;
}

/** BLIND: Mindest-Effektgroesse je Groesse = faktor x der groessere aus Zufallsfehler und mittlerem Tagesreihen-Fehler. */
function mde(zf, faktor) {
  var aus = {};
  NAMEN.forEach(function (k) { aus[k] = { zufall: zf.zufall[k], tagesreihe: zf.nwMittel[k], fehler: Math.max(zf.zufall[k], zf.nwMittel[k]), mde: faktor * Math.max(zf.zufall[k], zf.nwMittel[k]) }; });
  return aus;
}

/** Fehler einer konkreten Zuteilung: der GROESSERE aus Zufallsfehler und ihrem eigenen Tagesreihen-Fehler; t = Wert / Fehler. */
function mitFehler(g, zf) {
  var aus = { fehler: {}, t: {}, quelle: {} };
  NAMEN.forEach(function (k) {
    aus.fehler[k] = Math.max(zf.zufall[k], g.nw[k]);
    aus.quelle[k] = zf.zufall[k] >= g.nw[k] ? 'zufall' : 'tagesreihe';
    aus.t[k] = g[k] / aus.fehler[k];
  });
  aus.fehler.M = g.nw.M; aus.t.M = g.M / g.nw.M; aus.quelle.M = 'tagesreihe';
  return aus;
}

/** Das Tor (Auftrag §1.3): t >= schwelle fuer A UND fuer B netto - an den beiden Kunstfaellen. Die Zufallslaeufe werden um ihr
 *  eigenes Mittel ZENTRIERT (wahres A = dA, wahres B = dB; es geht nur ihre Streuung ein, kein Mittel eines Ertrags wird sichtbar),
 *  dann kommt der eingepflanzte Effekt dazu und bei B netto gehen die Kosten des Laufs ab. Ein konstanter Aufschlag je Gruppe aendert
 *  den Tagesreihen-Fehler eines Laufs nicht (er misst Abweichungen vom Gruppenmittel). */
function torAnteil(laeufe, zf, dA, dB, schwelle) {
  var nA = 0, nB = 0, nBeide = 0;
  var mA = mittel(laeufe.map(function (g) { return g.A; })), mB = mittel(laeufe.map(function (g) { return g.B; }));
  laeufe.forEach(function (g) {
    var tA = (g.A - mA + dA) / Math.max(zf.zufall.A, g.nw.A), tB = (g.B - mB + dB - g.kostenOben) / Math.max(zf.zufall.Bnetto, g.nw.Bnetto);
    if (tA >= schwelle) nA++;
    if (tB >= schwelle) nB++;
    if (tA >= schwelle && tB >= schwelle) nBeide++;
  });
  return { A: nA / laeufe.length, Bnetto: nB / laeufe.length, beide: nBeide / laeufe.length };
}

module.exports = { groessen: groessen, nwSumme: nwSumme, zufallsFehler: zufallsFehler, mde: mde, mitFehler: mitFehler, torAnteil: torAnteil, sd: sd, mittel: mittel, NAMEN: NAMEN };
