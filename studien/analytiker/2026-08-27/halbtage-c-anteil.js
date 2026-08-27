'use strict';
/* Analytiker 27.08.2026, Auftrag PM: Der 9-12-%-C-Anteil an HALBTAGEN im
 * Schiedsrichter - ist das die fehlende letzte Sitzungshalbstunde, deren Extreme
 * in der auf den Sitzungsschluss gestempelten Auktionskerze (17:00Z Sommer /
 * 18:00Z Winter) liegen? Dann ist C dort KEIN Nachhandels-Beleg, sondern der
 * bekannte Effekt, und der Befund ist ein Nullbefund.
 *
 * Methode: exakt die Klassifikation von schiedsrichter-test.js (QS 26./27.08.),
 * nur Halbtage, mit einem ZUSAETZLICHEN Aggregat in der Leiter:
 *   A) Kerzen voll innerhalb der Sitzung        (wie gehabt)
 *   B) A plus Randkerze (beginnt vor Schluss)   (wie gehabt)
 *   D) B plus die exakt auf den Sitzungsschluss gestempelte Kerze  <- NEU
 *   C) alle Kerzen des Tages
 * Reihenfolge A -> B -> D -> C -> keins. Alles, was frueher C war und jetzt D
 * ist, ist die Schluss-Auktionskerze, kein Nachhandel. Nur lesend. */
var fs = require('fs'), path = require('path');
var D60 = 'E:/Markt-Dashboard-Archiv/archiv60m', D1D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var HALBTAGE = { '2023-11-24': 1, '2024-07-03': 1, '2024-11-29': 1, '2024-12-24': 1,
                 '2025-07-03': 1, '2025-11-28': 1, '2025-12-24': 1 };
var STD = 3600000;
var TOL = [0, 1e-6, 1e-5, 1e-4, 1e-3];
var leiter = TOL.map(function () { return { A: 0, B: 0, D: 0, C: 0, keins: 0 }; });
var proTagStat = {};  // je Halbtag: Klassen bei 1e-4
Object.keys(HALBTAGE).forEach(function (d) { proTagStat[d] = { A: 0, B: 0, D: 0, C: 0, keins: 0, mitSchlussK: 0, tage: 0 }; });

function dateien(o, prae) {
  var out = [];
  fs.readdirSync(o, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(o, e.name);
    if (e.isDirectory()) out = out.concat(dateien(p, prae));
    else if (e.name.indexOf(prae) === 0 && /\.json$/.test(e.name)) out.push(p);
  });
  return out;
}
function hi(s) { return Math.max.apply(null, s.map(function (x) { return x[3]; })); }
function lo(s) { return Math.min.apply(null, s.map(function (x) { return x[4]; })); }

var index60 = {};
dateien(D60, 'bars_60m_').forEach(function (p) {
  index60[path.basename(p).replace(/^bars_60m_|\.json$/g, '')] = p;
});

var reihen = 0, tageGesamt = 0, cRestNachhandel = [];
dateien(D1D, 'bars_1d_').forEach(function (f1) {
  var sym = path.basename(f1).replace(/^bars_1d_|\.json$/g, '');
  var f60 = index60[sym];
  if (!f60) return;
  var a, b;
  try {
    a = JSON.parse(fs.readFileSync(f1, 'utf8'));
    b = JSON.parse(fs.readFileSync(f60, 'utf8'));
  } catch (e) { return; }
  if (!Array.isArray(a.series) || !Array.isArray(b.series)) return;
  reihen++;
  var proTag = {};
  b.series.forEach(function (k) {
    var d = new Date(k[0]).toISOString().slice(0, 10);
    if (!HALBTAGE[d]) return;
    (proTag[d] = proTag[d] || []).push(k);
  });
  a.series.forEach(function (t) {
    var d = new Date(t[0]).toISOString().slice(0, 10);
    if (!HALBTAGE[d]) return;
    var k = proTag[d];
    if (!k || !k.length) return;
    if (!(t[3] > 0) || !(t[4] > 0)) return;
    var start = t[0], ende = start + 3.5 * STD;
    var A = k.filter(function (x) { return x[0] >= start && x[0] + STD <= ende; });
    var B = k.filter(function (x) { return x[0] >= start && x[0] < ende; });
    if (!A.length || !B.length) return;
    var schlussK = k.filter(function (x) { return x[0] === ende; });
    var D2 = B.concat(schlussK);
    tageGesamt++;
    proTagStat[d].tage++;
    if (schlussK.length) proTagStat[d].mitSchlussK++;
    var relA = Math.max(Math.abs(hi(A) / t[3] - 1), Math.abs(lo(A) / t[4] - 1));
    var relB = Math.max(Math.abs(hi(B) / t[3] - 1), Math.abs(lo(B) / t[4] - 1));
    var relD = Math.max(Math.abs(hi(D2) / t[3] - 1), Math.abs(lo(D2) / t[4] - 1));
    var relC = Math.max(Math.abs(hi(k) / t[3] - 1), Math.abs(lo(k) / t[4] - 1));
    TOL.forEach(function (tol, ti) {
      var tr = relA <= tol ? 'A' : (relB <= tol ? 'B' : (relD <= tol ? 'D' : (relC <= tol ? 'C' : 'keins')));
      leiter[ti][tr]++;
      if (ti === 3) proTagStat[d][tr]++;   // 1e-4 als Referenzstufe
      if (ti === 3 && tr === 'C' && cRestNachhandel.length < 10)
        cRestNachhandel.push('  ' + sym.padEnd(6) + d + '  1d ' + t[3].toFixed(2) + '/' + t[4].toFixed(2) +
          '  B ' + hi(B).toFixed(2) + '/' + lo(B).toFixed(2) + '  D ' + hi(D2).toFixed(2) + '/' + lo(D2).toFixed(2) +
          '  C ' + hi(k).toFixed(2) + '/' + lo(k).toFixed(2) + '  SchlussK:' + schlussK.length);
    });
  });
});

console.log('Reihen: ' + reihen + '   Halbtags-Zellen: ' + tageGesamt);
console.log('\nLeiter (A -> B -> D=B+Schlusskerze -> C -> keins), Anteile in %:');
console.log('  Toleranz      A        B        D        C     keins');
TOL.forEach(function (tol, ti) {
  var z = leiter[ti], g = z.A + z.B + z.D + z.C + z.keins;
  console.log('  ' + String(tol === 0 ? 'exakt' : tol).padEnd(10) +
    ['A', 'B', 'D', 'C', 'keins'].map(function (kk) { return (100 * z[kk] / g).toFixed(2).padStart(7); }).join('  '));
});
console.log('\nJe Halbtag (Stufe 1e-4): Tage | mit Schlusskerze | A | B | D | C | keins');
Object.keys(HALBTAGE).forEach(function (d) {
  var s = proTagStat[d];
  console.log('  ' + d + '  ' + String(s.tage).padStart(6) + '  ' + String(s.mitSchlussK).padStart(6) + '  ' +
    [s.A, s.B, s.D, s.C, s.keins].map(function (x) { return String(x).padStart(6); }).join(' '));
});
console.log('\nVerbleibende echte C-Faelle (Stufe 1e-4), Beispiele:');
cRestNachhandel.forEach(function (z) { console.log(z); });
