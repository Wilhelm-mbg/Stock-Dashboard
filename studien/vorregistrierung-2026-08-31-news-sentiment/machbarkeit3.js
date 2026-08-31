'use strict';
/* RAUSCHMASS fuer die MDE - ausdruecklich NUR die Streuung der Uebernachtertraege,
 * kein Zusammenhang mit irgendeinem Score. Ohne diese Zahl waere die MDE geraten. */
var fs = require('fs'), path = require('path');
var Q = require('../../quant.js');
var SY = fs.readdirSync(path.join(__dirname, 'archiv-kopie')).map(function (f) { return f.replace(/bars_1d_|\.json/g, ''); });
function sommer(ms) { return Q.usSommerzeit(new Date(ms)); }
function tagKey(ms) { return new Date(ms - (sommer(ms) ? 4 : 5) * 3600000).toISOString().slice(0, 10); }

/* Uebernacht = Eroeffnung(T+1) / Schluss(T) - 1, in Prozentpunkten. */
var jeSym = {}, jeTag = {};
SY.forEach(function (s) {
  var ser = JSON.parse(fs.readFileSync(path.join(__dirname, 'archiv-kopie', 'bars_1d_' + s + '.json'), 'utf8')).series;
  var r = [];
  for (var i = 1; i < ser.length; i++) {
    var vor = ser[i - 1], jetzt = ser[i];
    if (!(vor[1] > 0) || !(jetzt[5] > 0)) continue;              // Schluss T, Eroeffnung T+1
    r.push({ tag: tagKey(vor[0]), un: (jetzt[5] / vor[1] - 1) * 100 });
  }
  jeSym[s] = r;
  r.slice(-260).forEach(function (x) { (jeTag[x.tag] = jeTag[x.tag] || []).push({ s: s, un: x.un }); });
});
function sd(a) { var m = a.reduce(function (x, y) { return x + y; }, 0) / a.length;
  return Math.sqrt(a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / (a.length - 1)); }

/* (a) roh, je Symbol ueber die letzten 260 Handelstage */
console.log('Streuung der Uebernachtertraege (Pp), letzte 260 Handelstage:');
var sds = [];
SY.forEach(function (s) { var a = jeSym[s].slice(-260).map(function (x) { return x.un; });
  var v = sd(a); sds.push(v); console.log('  ' + (s + '     ').slice(0, 6) + ' n=' + a.length + '  sd ' + v.toFixed(3)); });
sds.sort(function (a, b) { return a - b; });
var sdMed = sds[Math.floor(sds.length / 2)];
console.log('  Median sd (roh): ' + sdMed.toFixed(3) + ' Pp');

/* (b) tagesbereinigt: Marktfaktor raus - der ist bei 16 Tech-Werten an EINEM Tag der Chef */
var rest = [];
Object.keys(jeTag).forEach(function (k) {
  var g = jeTag[k]; if (g.length < 3) return;
  var m = g.reduce(function (a, b) { return a + b.un; }, 0) / g.length;
  g.forEach(function (x) { rest.push(x.un - m); });
});
var sdRest = sd(rest);
console.log('  sd tagesbereinigt (Querschnitt): ' + sdRest.toFixed(3) + ' Pp   auf ' + rest.length + ' Symbol-Tagen');

/* ---- MDE, zweiseitig, alpha 0,05, Power 80 % ---- */
var K = 1.959964 + 0.8416212;                       // 2,8016
console.log('\nMDE (zweiseitig, alpha 0,05, Power 80 %), Faktor ' + K.toFixed(4) + ':');
function zeile(txt, n1, n2, s) {
  var mde = K * s * Math.sqrt(1 / n1 + (n2 ? 1 / n2 : 0));
  console.log('  ' + txt + '  -> MDE ' + mde.toFixed(3) + ' Pp   = ' + (mde / 0.10).toFixed(1) + ' x Kostenhuerde 0,10 %');
  return mde;
}
console.log(' Variante 1 - alle 33 Symbol-Tage als unabhaengig behandelt (zu optimistisch):');
zeile('Zweistichprobe 28 pos / 5 neg, sd ' + sdRest.toFixed(2), 28, 5, sdRest);
zeile('Einstichprobe n=33,             sd ' + sdRest.toFixed(2), 33, 0, sdRest);
console.log(' Variante 2 - je Tag geclustert (10 Zeitpunkte), Tagesmittel als Beobachtung:');
var sdTag = sdRest / Math.sqrt(3.3);                // mittlere Gruppengroesse 33/10
zeile('Einstichprobe n=10 Tage,        sd ' + sdTag.toFixed(2), 10, 0, sdTag);
console.log('\n Zum Vergleich: wie viele UNABHAENGIGE Symbol-Tage braeuchte eine Kante von 0,10 Pp?');
console.log('  n = (' + K.toFixed(3) + ' * ' + sdRest.toFixed(3) + ' / 0,10)^2 = ' + Math.round(Math.pow(K * sdRest / 0.10, 2)) + ' Symbol-Tage');
