'use strict';
/* DETEKTOREN der Studie Trendwende II (VORREGISTRIERUNG.md §2, Nachtrag 3) - acht Familien der Wende, jede eine reine
 * Funktion signal(bars, i, params) -> {dir:+1|-1} | null nach dem Muster von
 * studien/signalstudie-2026-08/detektoren/_tabelle.js. Alle sehen nur bars[0..i]; die einzigen Caches sind
 * Datencaches (Wendepunktlisten, RSI-Reihe, Tagesanfaenge je Reihe), die das Ergebnis nicht von der
 * Aufrufreihenfolge abhaengig machen - ein Wendepunkt bei j sieht bars[j-F..j+F] und wird erst ab i >= j+F
 * verwendet. test.js prueft das Signal fuer Signal gegen den Aufruf auf dem Praefix bars.slice(0, i+1).
 *
 * Kerzen: [t, schluss, umsatz, hoch, tief, eroeffnung] auf dem Sitzungsraster (lesen.js der Minutenstudie).
 *
 * HERKUNFT:
 *   W1a/W1b  Felix' Winkel-Detektor (Issue #33), zeilengleich zu detect() in studien/33-winkel-detektor/hauptstudie.js
 *            (Neubewertung 22.08.2026); die Zustandsregeln dort (Cooldown 60 Kerzen, MIN_REST 30) uebernimmt der Lauf.
 *   W2, W3   die August-Tabelle per require, unveraendert (wendepunkt-trendwechsel, kapitulation).
 *   W4-W7    neu nach den Definitionen der Vorregistrierung §2 (Auftrag 09.09.2026).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var path = require('path');
var REPO = path.resolve(__dirname, '..', '..');
var Q = require(path.join(REPO, 'quant.js'));
var TAB = require(path.join(REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'));
function tabEintrag(key) { var d = TAB.filter(function (x) { return x.key === key; })[0]; if (!d) throw new Error('August-Tabelle ohne ' + key); return d; }

/* ---------- Helfer (Datencaches je Reihe) ---------- */
function tagVon(t) { return new Date(t).toISOString().slice(0, 10); }
var TAGSTART = new WeakMap();
/** Index der ersten Kerze desselben UTC-Tages wie Kerze i (regulaere Kerzen: UTC-Tag = ET-Tag, lesen.js). */
function tagStart(bars, i) {
  var a = TAGSTART.get(bars);
  if (!a) {
    a = new Int32Array(bars.length); var s = 0, tg = bars.length ? tagVon(bars[0][0]) : '';
    for (var k = 0; k < bars.length; k++) { var t = tagVon(bars[k][0]); if (t !== tg) { s = k; tg = t; } a[k] = s; }
    TAGSTART.set(bars, a);
  }
  return a[i];
}
function wnk(k) { return k.steigung * k.n / k.breite; }
function medianVon(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s.length ? s[s.length >> 1] : NaN; }

/* ---------- W1a / W1b: Winkel (Felix #33), zeilengleich zu hauptstudie.js detect() ---------- */
var WP1 = new WeakMap();
function wpListe(bars, F) {
  var c = WP1.get(bars); if (!c) { c = {}; WP1.set(bars, c); }
  if (!c[F]) { var wp = Q.wendepunkte(bars, F); c[F] = { liste: wp.hoch.concat(wp.tief).map(function (w) { return w.i; }).sort(function (a, b) { return a - b; }), alt: {} }; }
  return c[F];
}
/** Richtung der Winkel-Bedingung an Kerze i (0 = keine): junger Kanal ab wLetzt, |Winkel| >= S, Vorzeichen gegen wAlt. */
function winkelBedingung(bars, wLetzt, wAlt, i, S) {
  var kNeu = Q.kanalUeber(bars, wLetzt, i);
  if (!kNeu || !(kNeu.breite > 0)) return 0;
  var wn = wnk(kNeu);
  if (Math.abs(wn) < S) return 0;
  if (Math.sign(wn) === Math.sign(wAlt)) return 0;
  return wn > 0 ? 1 : -1;
}
function winkel(bars, i, p) {
  var W = wpListe(bars, p.F), alle = W.liste;
  var lo = 0, hi = alle.length;                                       // Zahl der bestaetigten Wendepunkte (alle[q] + F <= i)
  while (lo < hi) { var m = (lo + hi) >> 1; if (alle[m] + p.F <= i) lo = m + 1; else hi = m; }
  if (lo < 2) return null;
  var wLetzt = alle[lo - 1], wVor = alle[lo - 2], key = wVor + '|' + wLetzt, wAlt = W.alt[key];
  if (wAlt === undefined) { var kAlt = Q.kanalUeber(bars, wVor, wLetzt); wAlt = (kAlt && kAlt.breite > 0) ? wnk(kAlt) : 0; W.alt[key] = wAlt; }
  if (Math.abs(wAlt) < p.vortrend) return null;                      // Abschnitt ohne Vortrend: geschlossen (detect: sectionDone)
  if (i - wLetzt < 10) return null;
  var d = winkelBedingung(bars, wLetzt, wAlt, i, p.S);
  if (!d) return null;
  /* nur die erste Kerze je Abschnitt (detect: sectionDone nach dem ersten Treffer) - stand die Bedingung schon
   * an einer frueheren Kerze desselben Abschnitts (gleicher letzter bestaetigter Wendepunkt), kein Signal. */
  for (var j = Math.max(wLetzt + 10, wLetzt + p.F); j < i; j++) if (winkelBedingung(bars, wLetzt, wAlt, j, p.S)) return null;
  return { dir: d };
}

/* ---------- W4: Erschoepfung / Klimax ---------- */
function klimax(bars, i, p) {
  var j0 = tagStart(bars, i);
  if (i - j0 < p.minKerzen || i - j0 < p.N) return null;
  /* Reihenfolge nur Laufzeit (die Bedingungen sind unabhaengig): erst der seltene Lauf, dann der Median des Tages. */
  var auf = true, ab = true;
  for (var k = i - p.N + 1; k <= i - 1; k++) {
    if (!(bars[k][3] > bars[k - 1][3] && bars[k][4] > bars[k - 1][4])) auf = false;
    if (!(bars[k][3] < bars[k - 1][3] && bars[k][4] < bars[k - 1][4])) ab = false;
    if (!auf && !ab) return null;
  }
  var inSpanne = bars[i][1] <= bars[i - 1][3] && bars[i][1] >= bars[i - 1][4];
  if (!inSpanne) return null;
  var vols = []; for (var q = j0; q < i; q++) vols.push(bars[q][2] || 0);
  var med = medianVon(vols);
  if (!(med > 0) || !((bars[i][2] || 0) >= p.faktor * med)) return null;
  if (auf && bars[i][3] > bars[i - 1][3]) return { dir: -1 };
  if (ab && bars[i][4] < bars[i - 1][4]) return { dir: 1 };
  return null;
}

/* ---------- W5: Dow-Struktur (tieferes Hoch / hoeheres Tief, an der Bestaetigungskerze) ---------- */
var WP5 = new WeakMap();
function dowListe(bars, F) {
  var c = WP5.get(bars); if (!c) { c = {}; WP5.set(bars, c); }
  if (!c[F]) {
    var wp = Q.wendepunkte(bars, F), posH = new Map(), posT = new Map();
    wp.hoch.forEach(function (w, q) { posH.set(w.i, q); }); wp.tief.forEach(function (w, q) { posT.set(w.i, q); });
    c[F] = { hoch: wp.hoch, tief: wp.tief, posH: posH, posT: posT };
  }
  return c[F];
}
function dow(bars, i, p) {
  var j = i - p.F; if (j < 0) return null;
  var W = dowListe(bars, p.F);
  var ph = W.posH.get(j);
  if (ph !== undefined && ph >= 1) { var H2 = W.hoch[ph], H1 = W.hoch[ph - 1]; if (H2.preis < H1.preis && H2.i - H1.i >= p.abstand) return { dir: -1 }; }
  var pt = W.posT.get(j);
  if (pt !== undefined && pt >= 1) { var T2 = W.tief[pt], T1 = W.tief[pt - 1]; if (T2.preis > T1.preis && T2.i - T1.i >= p.abstand) return { dir: 1 }; }
  return null;
}

/* ---------- W6: V-Umkehr ---------- */
function sigmaN(bars, a, n) {
  if (a < n) return 0;
  var r = [], s = 0;
  for (var t = a - n + 1; t <= a; t++) { var v = bars[t][1] / bars[t - 1][1] - 1; r.push(v); s += v; }
  var m = s / n, q = 0; r.forEach(function (v) { q += (v - m) * (v - m); });
  return Math.sqrt(q / (n - 1));
}
function vUmkehr(bars, i, p) {
  var j0 = tagStart(bars, i), lo = Math.max(j0, i - p.m);
  if (lo > i - 1) return null;
  var c = function (q) { return bars[q][1]; };
  var b = lo, bt = lo;                                                  // b = hoechster Schluss, bt = tiefster Schluss in [i-m, i-1]
  for (var q = lo; q <= i - 1; q++) { if (c(q) > c(b)) b = q; if (c(q) < c(bt)) bt = q; }
  /* Aufwaerts-V -> short: tiefster Schluss a vor b, Bewegung >= k sigma, Ruecklauf >= 50 % erstmals an i */
  var la = Math.max(j0, b - p.m);
  if (la <= b - 1) {
    var a = la; for (var q2 = la; q2 <= b - 1; q2++) if (c(q2) < c(a)) a = q2;
    var s1 = sigmaN(bars, a, p.sigmaN), bew = c(b) - c(a);
    if (s1 > 0 && bew >= p.k * s1 * c(a)) { var soll = p.rueck * bew; if (c(b) - c(i) >= soll && c(b) - c(i - 1) < soll) return { dir: -1 }; }
  }
  /* Abwaerts-V -> long */
  var lb = Math.max(j0, bt - p.m);
  if (lb <= bt - 1) {
    var a2 = lb; for (var q3 = lb; q3 <= bt - 1; q3++) if (c(q3) > c(a2)) a2 = q3;
    var s2 = sigmaN(bars, a2, p.sigmaN), bew2 = c(a2) - c(bt);
    if (s2 > 0 && bew2 >= p.k * s2 * c(a2)) { var soll2 = p.rueck * bew2; if (c(i) - c(bt) >= soll2 && c(i - 1) - c(bt) < soll2) return { dir: 1 }; }
  }
  return null;
}

/* ---------- W7: RSI-Divergenz ---------- */
/** RSI(n) wie quant.js rsi(): einfaches Mittel der Gewinne und Verluste ueber n Kerzen; NaN unter n Kerzen. */
function rsi(bars, n, endI) {
  if (endI < n) return NaN;
  var g = 0, l = 0;
  for (var i = endI - n + 1; i <= endI; i++) { var d = bars[i][1] - bars[i - 1][1]; if (d > 0) g += d; else l -= d; }
  if (g + l === 0) return 50;
  var rs = l === 0 ? 100 : g / l;
  return 100 - 100 / (1 + rs);
}
var RSIC = new WeakMap();
function rsiReihe(bars, n) {
  var c = RSIC.get(bars); if (!c) { c = {}; RSIC.set(bars, c); }
  if (!c[n]) { var a = new Float64Array(bars.length); for (var i = 0; i < bars.length; i++) a[i] = rsi(bars, n, i); c[n] = a; }
  return c[n];
}
function rsiDiv(bars, i, p) {
  if (i < p.fenster + p.n) return null;
  var R = rsiReihe(bars, p.n), maxC = -Infinity, minC = Infinity, maxR = -Infinity, minR = Infinity;
  for (var q = i - p.fenster; q <= i - 1; q++) { var c = bars[q][1], r = R[q]; if (c > maxC) maxC = c; if (c < minC) minC = c; if (r > maxR) maxR = r; if (r < minR) minR = r; }
  if (bars[i][1] > maxC && R[i] < maxR) return { dir: -1 };
  if (bars[i][1] < minC && R[i] > minR) return { dir: 1 };
  return null;
}

/* ---------- Tabelle ----------
 * NACHTRAG 3 (12.09.2026, Entscheid PM): der Trendfolge-Detektor aus der August-Tabelle (`kanaltrend`, hier bis
 * dahin als Referenzzeile gefuehrt) ist gestrichen. Begruendung: er ist nach Code eine EMA20-Kreuzung in
 * Kanalrichtung - Trendfolge, kein Wende-Detektor; die Umschreibung der Vorregistrierung ("Ruecklauf gegen den
 * Abschnittskanal") trifft keine August-Funktion. Die August-Tabelle selbst bleibt unberuehrt (nur nicht mehr
 * hierher gezogen). test.js haelt das als Klinke ueber die Tabelleneigenschaften fest, nicht ueber Text. */
var W2 = tabEintrag('wendepunkt-trendwechsel'), W3 = tabEintrag('kapitulation');
var TABELLE = [
  { key: 'W1a', name: 'Winkel, Schwelle', familie: 'wende-winkel', params: { S: 0.5, F: 6, vortrend: 0.5 }, signal: winkel, richtungen: ['long', 'short'],
    herkunft: 'Felix (#33): studien/33-winkel-detektor/hauptstudie.js detect(), OOS-Zelle S 0,5 / F 6; Vortrend-Schwelle 0,5' },
  { key: 'W1b', name: 'Winkel, stark', familie: 'wende-winkel', params: { S: 0.5, F: 6, vortrend: 1.0 }, signal: winkel, richtungen: ['long', 'short'],
    herkunft: 'wie W1a, Vortrend-Schwelle 1,0 (Vorschlag aus #33 als zweite Schwelle)' },
  { key: 'W2', name: 'Wendepunkt-Trendwechsel', familie: 'wende-winkel', params: W2.params, signal: W2.signal, richtungen: ['long', 'short'],
    herkunft: 'August-Tabelle wendepunkt-trendwechsel (Q.trendwechsel, S 1,0 / F 5, erste Kerze je Abschnitt; 1m Tagesreihe)' },
  { key: 'W3', name: 'Kapitulation', familie: 'dip', params: W3.params, signal: W3.signal, richtungen: ['long'],
    herkunft: 'August-Tabelle kapitulation (Q.einstiegSignal, nur long)' },
  { key: 'W4', name: 'Erschoepfung/Klimax', familie: 'wende-struktur', params: { N: 5, faktor: 3, minKerzen: 10 }, signal: klimax, richtungen: ['long', 'short'],
    herkunft: 'neu (Auftrag 09.09.2026, Vorregistrierung §2)' },
  { key: 'W5', name: 'Dow-Struktur', familie: 'wende-struktur', params: { F: 5, abstand: 10 }, signal: dow, richtungen: ['long', 'short'],
    herkunft: 'August-Familie, Definition Vorregistrierung §2 (Q.wendepunkte)' },
  { key: 'W6', name: 'V-Umkehr', familie: 'wende-struktur', params: { k: 3, m: 12, sigmaN: 20, rueck: 0.5 }, signal: vUmkehr, richtungen: ['long', 'short'],
    herkunft: 'August-Familie, Definition Vorregistrierung §2' },
  { key: 'W7', name: 'RSI-Divergenz', familie: 'wende-struktur', params: { fenster: 60, n: 14 }, signal: rsiDiv, richtungen: ['long', 'short'],
    herkunft: 'August-Familie, Definition Vorregistrierung §2 (RSI wie quant.js rsi)' },
];

module.exports = { TABELLE: TABELLE, W: { winkel: winkel, klimax: klimax, dow: dow, vUmkehr: vUmkehr, rsiDiv: rsiDiv },
  helfer: { tagVon: tagVon, tagStart: tagStart, rsi: rsi, rsiReihe: rsiReihe, sigmaN: sigmaN, wpListe: wpListe, dowListe: dowListe, winkelBedingung: winkelBedingung, wnk: wnk } };
