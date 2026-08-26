'use strict';
/* F3-Gegenversuch (Analytiker, 26.08.2026):
 * Die Maschine clustert ueber TAGE und ruft statistik(tagesmittel, H-1) auf,
 * wobei H die Haltedauer in KERZEN (60m) ist. Die Fenster ueberlappen aber nur
 * ceil(H/6.5)-1 TAGE. Frage: was macht die zu grosse Bandbreite (7 statt 1-2
 * Tages-Lags bei H=8; 25 statt ~3 bei H=26) mit dem Standardfehler?
 *
 * Aufbau: Tagesmittel-Reihe mit ECHTER MA(1)-Struktur in Tagen (rho1 einstellbar,
 * dahinter null) - das ist die Welt, die eine 8-Kerzen-Haltedauer erzeugt.
 * Vergleich: se(NW, lags=wahr) vs se(NW, lags=maschinell) vs empirische
 * Streuung des Mittels ueber viele Wiederholungen (die Wahrheit).
 * Funktionen WORTGLEICH aus messmaschine.js Zeilen 110-139 uebernommen. */

function neweyWest(werte, mu, va, lags) {
  var n = werte.length;
  if (!(lags > 0) || n < 3) return va;
  var L = Math.min(lags, n - 2);
  var lang = va;
  for (var k = 1; k <= L; k++) {
    var gew = 1 - k / (L + 1);
    var s = 0, c = 0;
    for (var i = 0; i + k < n; i++) { s += (werte[i] - mu) * (werte[i + k] - mu); c++; }
    if (c) lang += 2 * gew * (s / c);
  }
  return lang > 0 ? lang : va;
}
function seVon(werte, lags) {
  var n = werte.length;
  var mu = werte.reduce(function (a, b) { return a + b; }, 0) / n;
  var va = werte.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / (n - 1);
  return { mu: mu, se: Math.sqrt(neweyWest(werte, mu, va, lags) / n) };
}

/* Deterministischer Zufall (Maschinenregel: kein Math.random in Studienlaeufen,
 * und reproduzierbar soll es ohnehin sein). */
function lcg(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function gauss(rnd) { var u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

/* MA(q)-Tagesreihe: x_d = sum_{j=0..q} b_j e_{d-j}; rho1 ueber b steuerbar. */
function reihe(n, q, b, rnd) {
  var e = [], x = [];
  for (var i = 0; i < n + q; i++) e.push(gauss(rnd));
  for (var d = q; d < n + q; d++) {
    var s = 0;
    for (var j = 0; j <= q; j++) s += b[j] * e[d - j];
    x.push(s);
  }
  return x;
}

var REP = 4000, N = 360; // ~ein Bestaetigungsjahr, wie in den Protokollen
var faelle = [
  { name: 'H=8: echte Ueberlappung 1 Tag (MA1, b=[1,0.5])', q: 1, b: [1, 0.5], wahrLags: 1, maschLags: 7 },
  { name: 'H=26: echte Ueberlappung 3 Tage (MA3, b=[1,.6,.35,.15])', q: 3, b: [1, 0.6, 0.35, 0.15], wahrLags: 3, maschLags: 25 },
  { name: 'H=8, keine echte Tageskorrelation (weisses Rauschen)', q: 0, b: [1], wahrLags: 0, maschLags: 7 },
];
faelle.forEach(function (fall, fi) {
  var rnd = lcg(20260826 + fi * 7919);
  var mus = [], seW = 0, seM = 0, seN = 0, tMehrW = 0, tMehrM = 0;
  for (var r = 0; r < REP; r++) {
    var x = reihe(N, fall.q, fall.b, rnd);
    var a = seVon(x, fall.wahrLags), m = seVon(x, fall.maschLags), n0 = seVon(x, 0);
    mus.push(a.mu); seW += a.se; seM += m.se; seN += n0.se;
    if (Math.abs(a.mu / m.se) >= 1.96) tMehrM++;
    if (Math.abs(a.mu / a.se) >= 1.96) tMehrW++;
  }
  var muM = mus.reduce(function (p, c) { return p + c; }, 0) / REP;
  var sdEmp = Math.sqrt(mus.reduce(function (p, c) { return p + (c - muM) * (c - muM); }, 0) / (REP - 1));
  console.log('== ' + fall.name);
  console.log('   wahre Streuung des Mittels (empirisch): ' + sdEmp.toFixed(5));
  console.log('   se naiv (lags 0):          ' + (seN / REP).toFixed(5));
  console.log('   se NW korrekte Bandbreite: ' + (seW / REP).toFixed(5) + '   Fehlalarme (|t|>=1.96 unter H0): ' + (tMehrW / REP * 100).toFixed(1) + ' %');
  console.log('   se NW Maschinen-Bandbreite:' + (seM / REP).toFixed(5) + '   Fehlalarme mit diesem se:        ' + (tMehrM / REP * 100).toFixed(1) + ' %');
});
