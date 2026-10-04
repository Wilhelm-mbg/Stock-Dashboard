'use strict';
/* Auszaehlung aus ergebnis.json fuer die Uebergabe (beschreibend, keine neue Rechnung an den Kursen). Ausgabe: zeigen.log */
var path = require('path');
var E = require(path.join(__dirname, 'ergebnis.json'));
function f(x, n) { return x == null || x !== x ? 'n. v.' : x.toFixed(n); }
var nach = E.ereignisse.filter(function (x) { return x.fenster === 'W-Nach'; }), gross = nach.filter(function (x) { return Math.abs(x.t) >= 2; });
console.log('W-Nach: ' + nach.length + ' Zellen, |t| >= 2: ' + gross.length + ' (negativ ' + gross.filter(function (x) { return x.t < 0; }).length + ')');
gross.forEach(function (x) { console.log('  ' + x.wert + ' ' + x.ausloeser + ' H' + x.H + ': ' + f(x.mittelBp, 2) + ' Bp, t ' + f(x.t, 2) + ', n ' + x.n); });
console.log('Zellen W-Nach mit Mittel >= 1,0 Bp: ' + nach.filter(function (x) { return x.mittelBp >= 1; }).length + '; hoechstes Mittel ' + f(Math.max.apply(null, nach.map(function (x) { return x.mittelBp; })), 2));
['QQQ', 'SPY', 'IWM'].forEach(function (w) {
  var c = nach.filter(function (x) { return x.wert === w && x.ausloeser === 'Alle' && x.H === 5; })[0];
  console.log(w + ' Alle H5: ' + f(c.mittelBp, 3) + ' Bp, SE ' + f(c.seBp, 3) + ', t ' + f(c.t, 2) + ', n ' + c.n + ', roh ' + f(c.rohBp, 3));
});
Object.keys(E.daten).forEach(function (w) { var z = E.daten[w].ausloeser; console.log(w + ' Ausloeser (alle Tage): ' + JSON.stringify(z)); });
E.struktur.filter(function (s) { return s.fenster === 'W-Nach'; }).forEach(function (s) {
  var b = s.bot;
  console.log(s.wert + ' W-Nach Bot: Ausloeser ' + b.ausloeser + ', Einstiege ' + b.einstiege + ', verfallen ' + JSON.stringify(b.verfallen) + ', Arten ' + JSON.stringify(b.arten) +
    ', Tage mit Trade ' + b.tageMitTrade + '/' + b.tage + ', Calls ' + f(b.anteilCalls * 100, 1) + ' %, pZ2 ' + f(s.pZ2, 4) + ', Z2 Ausloeser/Tag ' + f(s.z2.mittlereAusloeserJeTag, 2) + ' gegen Alle ' + f(s.alleJeTag, 2));
  console.log('  Jahre Bot: ' + Object.keys(b.jahre).map(function (j) { var y = b.jahre[j]; return j + ' ' + f(y.summeR, 1) + ' R, gruen ' + y.gruen + '/' + y.tageMitTrade; }).join(' | '));
  console.log('  Z1 Median Summe ' + f(s.z1.median.summeR, 1) + ' [' + f(s.z1.q025.summeR, 1) + '; ' + f(s.z1.q975.summeR, 1) + '], Serie [' + f(s.z1.q025.laengsteSerie, 0) + '; ' + f(s.z1.q975.laengsteSerie, 0) + ']' +
    ', schlechtester Tag [' + f(s.z1.q025.schlechtesterTagR, 2) + '; ' + f(s.z1.q975.schlechtesterTagR, 2) + ']');
});
['W-Vor', 'W-Papier'].forEach(function (fe) {
  E.struktur.filter(function (s) { return s.fenster === fe; }).forEach(function (s) {
    console.log(fe + ' ' + s.wert + ': Bot ' + f(s.bot.rJeTrade, 3) + ' R (t ' + f(s.bot.t, 2) + '), Z1 97,5 % ' + f(s.z1.q975.rJeTrade, 3) + ', gruen ' + f(s.bot.anteilGruen * 100, 0) + ' %, Satz: ' + s.satz);
  });
});
