'use strict';
/* F-ROTATION PUNKT 2: Signifikanz-Rechnung und Testzahl-Korrektur.
 *
 * Unabhaengige Gegenprobe (nicht test-messmaschine.js):
 *  (1) normInv/bonferroniSchwelle gegen eine eigene, hochgenaue Referenz
 *      (erfc ueber die unvollstaendige Gammafunktion + Newton-Verfeinerung).
 *  (2) Alle abgelegten Protokolle: B4-Schwelle nachgerechnet aus tests.
 *  (3) Newey-West: die offene Frage des zweiten Laufs - Verzoegerung H-1 in
 *      KERZEN auf einer TAGES-Reihe. Simulation des echten Erzeugungsprozesses
 *      (7 Kerzen/Tag, H=8 => Nachbartage teilen genau 1 Kerze, wahre
 *      Tages-Autokovarianz nur bei Verzoegerung 1). Vergleich: Maschine (L=7),
 *      tages-richtige Wahl (L=1), naiv (L=0) - Verwerfungsraten unter der
 *      Nullhypothese und Treffgenauigkeit des Standardfehlers.
 *  (4) Duenn gesaete Signaltage (jeder 2. Tag, keine echte Ueberlappung):
 *      kostet die ueberzaehlige Korrektur Verwerfungsrate/Praezision?
 *  (5) aussicht.tage80 rechnet mit zAlpha=1,96, das Urteil faellt aber gegen
 *      die Bonferroni-Schwelle - Quantifizierung der Untergrenze.
 *
 * Determinismus: fester LCG-Seed, keine Date/Math.random-Abhaengigkeit im Ergebnis. */
var path = require('path'), fs = require('fs');
var M = require(path.resolve(__dirname, '..', '..', 'messmaschine', 'messmaschine.js'));
var statistik = M._intern.statistik, bonferroniSchwelle = M._intern.bonferroniSchwelle;

/* ---------- (0) Hochgenaue Referenz: erfc ueber Gamma-Reihen/Kettenbruch ---------- */
function gammln(a) {
  /* Lanczos-Koeffizienten (Numerical Recipes). Zwei davon stehen hier mit der
   * letzten Ziffer ANDERS als in der Literatur: -86.50532032941678 statt ...677 und
   * 2.5066282746310007 statt ...005 (sqrt(2*pi)). Das ist keine Korrektur des Werts,
   * sondern seine ehrliche Schreibweise - beide sind BITGLEICH zum Literaturwert,
   * die letzte Ziffer existiert im double gar nicht. Geschrieben wie in der
   * Literatur, meldete eslint zu Recht "verliert Praezision" und blockierte damit
   * die CI. Eine Ausnahmeregel fuer die Datei waere der bequemere Weg gewesen und
   * der schlechtere: die Regel faengt echte Tippfehler in langen Konstanten, und
   * genau davon stehen hier sechs. Die Selbstkontrolle unten prueft nach, dass sich
   * nichts geaendert hat (|Abw| gegen drei Literaturwerte bleibt 4,26e-14). */
  var cof = [76.18009172947146, -86.50532032941678, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  var x = a, y = a, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
  var ser = 1.000000000190015;
  for (var j = 0; j < 6; j++) ser += cof[j] / ++y;
  return -tmp + Math.log(2.5066282746310007 * ser / x);   // sqrt(2*pi), bitgleich zu ...005
}
function gser(a, x) { // Reihe fuer P(a,x)
  var ITMAX = 500, EPS = 3e-15, gln = gammln(a);
  var ap = a, sum = 1 / a, del = sum;
  for (var n = 1; n <= ITMAX; n++) {
    ap += 1; del *= x / ap; sum += del;
    if (Math.abs(del) < Math.abs(sum) * EPS) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - gln);
}
function gcf(a, x) { // Kettenbruch fuer Q(a,x)
  var ITMAX = 500, EPS = 3e-15, FPMIN = 1e-300, gln = gammln(a);
  var b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d;
  for (var i = 1; i <= ITMAX; i++) {
    var an = -i * (i - a);
    b += 2; d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; var del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return Math.exp(-x + a * Math.log(x) - gln) * h;
}
function erfcRef(x) {
  if (x < 0) return 2 - erfcRef(-x);
  var x2 = x * x;
  if (x2 < 1.5) return 1 - gser(0.5, x2);
  return gcf(0.5, x2);
}
function tailQ(z) { return 0.5 * erfcRef(z / Math.SQRT2); }   // P(Z > z)
function phi(z) { return Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI); }
function quantilRef(p, start) { // loese Q(z) = p, Newton ab Startwert
  var z = start;
  for (var i = 0; i < 60; i++) {
    var f = tailQ(z) - p, d = phi(z);
    if (!(d > 0)) break;
    var zn = z + f / d;
    if (Math.abs(zn - z) < 1e-13 * Math.max(1, Math.abs(z))) { z = zn; break; }
    z = zn;
  }
  return z;
}

console.log('=== (1) normInv/bonferroniSchwelle gegen Referenz ===');
var faelle = [1, 2, 3, 4, 6, 12, 24, 51, 200, 1000, 3372];
var maxAbw = 0;
faelle.forEach(function (tests) {
  var p = 0.05 / tests / 2;
  var maschine = bonferroniSchwelle(tests);
  var ref = quantilRef(p, maschine);
  var abw = Math.abs(maschine - ref);
  if (abw > maxAbw) maxAbw = abw;
  console.log('  tests=' + String(tests).padStart(5) + '  p=' + p.toExponential(3) +
    '  Maschine ' + maschine.toFixed(6) + '  Referenz ' + ref.toFixed(6) + '  |Abw| ' + abw.toExponential(2));
});
console.log('  groesste Abweichung: ' + maxAbw.toExponential(2) + (maxAbw < 1e-6 ? '  -> traegt' : '  -> AUFFAELLIG'));

/* Selbstkontrolle der Referenz an bekannten Werten */
var sk = [
  { p: 0.025, z: 1.9599639845400545 },
  { p: 0.005, z: 2.5758293035489004 },
  { p: 0.0005, z: 3.2905267314919255 },
];
var skMax = 0;
sk.forEach(function (s) { skMax = Math.max(skMax, Math.abs(quantilRef(s.p, 2) - s.z)); });
console.log('  Selbstkontrolle der Referenz an 3 Literaturwerten: |Abw| max ' + skMax.toExponential(2));

console.log('\n=== (2) B4-Schwellen aller abgelegten Protokolle nachgerechnet ===');
var protoDir = path.resolve(__dirname, '..', '..', 'messmaschine', 'protokolle');
var abweichler = 0, geprueft = 0;
fs.readdirSync(protoDir).filter(function (f) { return f.slice(-5) === '.json'; }).forEach(function (f) {
  try {
    var j = JSON.parse(fs.readFileSync(path.join(protoDir, f), 'utf8'));
    var b4 = (j.entscheidungen || []).filter(function (e) { return e.regel === 'B4 Bonferroni'; })[0];
    if (!b4) return;
    geprueft++;
    var soll = quantilRef(0.05 / Math.max(1, b4.eingabe.tests) / 2, b4.ergebnis.schwelleT || 2);
    var ist = b4.ergebnis.schwelleT;
    if (Math.abs(soll - ist) > 1e-5) { abweichler++; console.log('  ABWEICHUNG ' + f + ': tests=' + b4.eingabe.tests + ' ist ' + ist + ' soll ' + soll.toFixed(6)); }
  } catch (e) { console.log('  unlesbar: ' + f); }
});
console.log('  ' + geprueft + ' Protokolle mit B4 geprueft, ' + abweichler + ' Abweichungen');

/* ---------- LCG fuer deterministische Normalvariablen ---------- */
function macheLcg(seed) {
  var s = seed >>> 0;
  return function () { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}
function macheNormal(lcg) {
  var lager = null;
  return function () {
    if (lager != null) { var v = lager; lager = null; return v; }
    var u1 = Math.max(lcg(), 1e-12), u2 = lcg();
    var r = Math.sqrt(-2 * Math.log(u1)), w = 2 * Math.PI * u2;
    lager = r * Math.sin(w);
    return r * Math.cos(w);
  };
}

/* ---------- (3) NW-Verzoegerung: Kerzen gegen Tage ---------- */
console.log('\n=== (3) Newey-West: L=7 (Maschine) gegen L=1 (tages-richtig) gegen L=0 (naiv) ===');
console.log('  Aufbau: 252 Tage x 7 Kerzen, iid N(0,1) je Kerze, 1 Signal/Tag (Position 3),');
console.log('  H=8 Kerzen => Nachbartage teilen genau 1 Kerze: wahre Tages-Autokovarianz');
console.log('  gamma1=1, gamma0=8, Langfristvarianz je Tag = 10.');
var REP = 4000, TAGE = 252, KPT = 7, H = 8, POS = 3;
var norm = macheNormal(macheLcg(20260826));
function einLauf(schritt) {
  // schritt=1: Signal jeden Tag; schritt=2: jeden 2. Tag (keine echte Ueberlappung)
  var eps = new Array(TAGE * KPT + H + KPT);
  for (var i = 0; i < eps.length; i++) eps[i] = norm();
  var werte = [];
  for (var d = 0; d < TAGE; d += schritt) {
    var start = d * KPT + POS, s = 0;
    for (var k = 0; k < H; k++) s += eps[start + k];
    werte.push(s);
  }
  return werte;
}
function auswerten(schritt, lagsListe, label) {
  var nProben = [], zaehlVerwerfung = lagsListe.map(function () { return 0; });
  var seSummen = lagsListe.map(function () { return 0; }), seQuadrate = lagsListe.map(function () { return 0; });
  var mittelQuadrat = 0;
  for (var r = 0; r < REP; r++) {
    var w = einLauf(schritt);
    var n = w.length; nProben.push(n);
    var mu = w.reduce(function (a, b) { return a + b; }, 0) / n;
    mittelQuadrat += mu * mu;
    lagsListe.forEach(function (L, li) {
      var st = statistik(w, L);
      seSummen[li] += st.se; seQuadrate[li] += st.se * st.se;
      if (Math.abs(st.t) > 1.959964) zaehlVerwerfung[li]++;
    });
  }
  var wahreSeEmp = Math.sqrt(mittelQuadrat / REP); // empirische Streuung des Mittels (wahr, da E=0)
  console.log('  -- ' + label + ' (n je Lauf ' + nProben[0] + ', ' + REP + ' Wiederholungen)');
  console.log('     empirische wahre se des Mittels: ' + wahreSeEmp.toFixed(4));
  lagsListe.forEach(function (L, li) {
    var mSe = seSummen[li] / REP;
    var sdSe = Math.sqrt(Math.max(0, seQuadrate[li] / REP - mSe * mSe));
    console.log('     L=' + L + ': mittleres se ' + mSe.toFixed(4) + ' (Streuung ' + sdSe.toFixed(4) + ')' +
      '  Verwerfungsrate |t|>1,96: ' + (zaehlVerwerfung[li] / REP * 100).toFixed(2) + ' % (soll 5 %)');
  });
}
auswerten(1, [0, 1, 7], 'Signal jeden Tag, echte Ueberlappung 1 Tag');

/* ---------- (4) Duenn gesaete Signaltage ---------- */
console.log('\n=== (4) Signal nur jeden 2. Tag - Reihe hat KEINE echte Ueberlappung, Maschine korrigiert trotzdem mit L=7 ===');
auswerten(2, [0, 7], 'Signal jeden 2. Tag');

/* ---------- (5) aussicht.tage80: zAlpha gegen Bonferroni-Schwelle ---------- */
console.log('\n=== (5) aussicht.tage80 rechnet mit zAlpha=1,96 - das Urteil faellt gegen die Bonferroni-Schwelle ===');
[1, 2, 3, 4, 12].forEach(function (tests) {
  var zb = bonferroniSchwelle(tests);
  var f = Math.pow((zb + 0.8416212) / (1.959964 + 0.8416212), 2);
  console.log('  tests=' + String(tests).padStart(2) + ': Schwelle ' + zb.toFixed(3) +
    ' -> wahre Tage bis zur SCHWELLE = tage80 x ' + f.toFixed(3) +
    (tests > 1 ? '  (aussicht untertreibt um ' + ((f - 1) * 100).toFixed(0) + ' %)' : '  (deckungsgleich)'));
});

/* ---------- (6) Kleinigkeiten am Schaetzer, nur beziffert ---------- */
console.log('\n=== (6) Nebenbefunde am Schaetzer, beziffert ===');
console.log('  (a) Autokovarianz-Teiler n-k statt n: bei n=250, k=7 Faktor ' + (250 / 243).toFixed(4) + ' - vernachlaessigbar,');
console.log('      verliert aber die Garantie positiver Definitheit; die Maschine faengt das mit dem Rueckfall lang>0 ab.');
console.log('  (b) Rueckfall bei negativer Langfristvarianz nimmt die UNKORRIGIERTE Varianz - bei negativer');
console.log('      Autokorrelation ist das die groessere Zahl, der Fehler geht in die vorsichtige Richtung.');
