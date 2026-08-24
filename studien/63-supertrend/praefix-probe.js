'use strict';
/* Praefix-Probe + Rauchtest zu Issue #63.
 * 1. Kein Zukunftsblick: signal(bars.slice(0,i+1), i) muss signal(bars, i) gleichen.
 * 2. Bausteine gegen von Hand gerechnete Faelle.
 * 3. Signalzahlen plausibel.
 */
var path = require('path');
var MG = require(path.join(__dirname, '..', 'signalstudie-2026-08', 'messgeschirr.js'));
var TAB = require('./detektoren.js');
var B = TAB.bausteine;

var fehler = 0;
function pruef(name, ok, info) {
  if (ok) { console.log('  ok   ' + name); }
  else { console.log('  FEHL ' + name + (info ? '  -> ' + info : '')); fehler++; }
}

console.log('--- Bausteine ---');
/* ATR: konstante Spanne 2 -> TR immer 2 -> RMA bleibt 2 */
(function () {
  var w = []; for (var i = 0; i < 30; i++) w.push([i * 60000, 100, 0, 101, 99]);
  var a = B.atrReihe(w, 10);
  pruef('ATR konstante Spanne = 2', Math.abs(a[29] - 2) < 1e-9, a[29]);
})();
/* RSI: nur Aufwaerts -> 100; nur Abwaerts -> 0; flach -> 50 */
(function () {
  var up = [], dn = [], fl = [];
  for (var i = 0; i < 60; i++) { up.push([i, 100 + i, 0, 100 + i, 100 + i]); dn.push([i, 200 - i, 0, 0, 0]); fl.push([i, 100, 0, 0, 0]); }
  pruef('RSI nur aufwaerts = 100', B.rsiWilder(up, 14) === 100, B.rsiWilder(up, 14));
  pruef('RSI nur abwaerts = 0', B.rsiWilder(dn, 14) === 0, B.rsiWilder(dn, 14));
  pruef('RSI flach = 50', B.rsiWilder(fl, 14) === 50, B.rsiWilder(fl, 14));
})();
/* EMA: konstante Reihe bleibt konstant */
(function () {
  var w = []; for (var i = 0; i < 80; i++) w.push([i, 42, 0, 42, 42]);
  pruef('EMA konstant = 42', Math.abs(B.emaReihe(w, 50)[79] - 42) < 1e-9);
})();
/* Supertrend: klarer Aufwaertstrend -> gruen am Ende; klarer Abwaerts -> rot */
(function () {
  var up = [], dn = [];
  for (var i = 0; i < 120; i++) { var p = 100 + i; up.push([i, p, 0, p + 0.2, p - 0.2]); var q = 300 - i; dn.push([i, q, 0, q + 0.2, q - 0.2]); }
  pruef('Supertrend Aufwaerts = gruen', B.supertrendReihe(up, 10, 2)[119] === 1);
  pruef('Supertrend Abwaerts = rot', B.supertrendReihe(dn, 10, 2)[119] === -1);
})();

console.log('--- Praefix-Probe auf echten Reihen ---');
var U = MG.ladeUniversum('5m', 6);
U.forEach(function (E) { E.bars.sym = E.sym; });
var geprueft = 0, abw = 0, treffer = 0;
U.forEach(function (E) {
  var n = E.bars.length;
  for (var k = 0; k < 400; k++) {
    var i = B.WARMUP + Math.floor((n - B.WARMUP - 1) * (k / 400));
    if (i < B.WARMUP || i >= n) continue;
    var kurz = E.bars.slice(0, i + 1);
    TAB.forEach(function (D) {
      var a = D.signal(E.bars, i, D.params);
      var b = D.signal(kurz, i, D.params);
      geprueft++;
      if (a) treffer++;
      var ga = a ? a.dir : 0, gb = b ? b.dir : 0;
      if (ga !== gb) { abw++; if (abw < 4) console.log('    Abweichung ' + D.key + ' ' + E.sym + ' i=' + i + ': ' + ga + ' vs ' + gb); }
    });
  }
});
pruef('Praefix-Probe ohne Abweichung (' + geprueft.toLocaleString('de-DE') + ' Stichproben, ' + treffer + ' Treffer)', abw === 0, abw + ' Abweichungen');

console.log('--- Rauchtest Signaldichte (6 Werte, 5m) ---');
TAB.forEach(function (D) {
  var z = 0;
  U.forEach(function (E) { for (var i = B.WARMUP; i < E.bars.length; i++) { var s = D.signal(E.bars, i, D.params); if (s) z++; } });
  console.log('  ' + D.key.padEnd(9) + String(z).padStart(6) + ' Rohsignale');
});

console.log(fehler === 0 ? '\nALLE PROBEN BESTANDEN' : '\n' + fehler + ' PROBE(N) FEHLGESCHLAGEN');
process.exit(fehler === 0 ? 0 : 1);
