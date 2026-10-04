'use strict';
/* Nachsehen zu Paragraph 1 (nur Aufbau, keine Ertraege):
 * (a) QQQ am 02. und 03.05.2018 - wie viele Rohkerzen und welche Bloecke fuehrt die Jahresdatei?
 * (b) Sprungprobe gegen unbemerkte Splits: Tage, an denen die erste Eroeffnung mehr als 20 % vom letzten
 *     Schluss des Vortags abweicht (Soll: 0). Es wird nur gezaehlt.
 * (c) Wo liegen die Luecken am 22.02.2016 (QQQ) und am 12.08.2019 (SPY, IWM)? */
var fs = require('fs');
var D = require('./daten');

var j = JSON.parse(fs.readFileSync(D.ARCHIV + '/QQQ/2018.json', 'utf8'));
['2018-05-01', '2018-05-02', '2018-05-03', '2018-05-04'].forEach(function (tag) {
  var n = 0;
  j.series.forEach(function (k) { if (D.ortszeit(k[0]).datum === tag) n++; });
  var bl = j.sitzungen.filter(function (b) { return D.ortszeit(b.von).datum === tag; }).map(function (b) {
    return b.sitzung + ' ' + D.ortszeit(b.von).minute + '-' + D.ortszeit(b.bis).minute;
  });
  console.log('QQQ ' + tag + ': Rohkerzen aller Sitzungen ' + n + ', Bloecke: ' + bl.join(' | '));
});
j = null;

D.WERTE.forEach(function (sym) {
  var R = D.ladeWert(sym).reihe, spruenge = [];
  for (var d = 1; d < R.tagDatum.length; d++) {
    var q = R.o[R.tagA[d]] / R.c[R.tagE[d - 1] - 1];
    if (q > 1.2 || q < 1 / 1.2) spruenge.push(R.tagDatum[d]);
  }
  console.log(sym + ': Spruenge ueber Nacht groesser 20 %: ' + spruenge.length + (spruenge.length ? ' ' + spruenge.join(' ') : ''));
  ['2016-02-22', '2019-08-12'].forEach(function (tag) {
    var d = R.tagDatum.indexOf(tag);
    if (d < 0) return;
    var luecken = [];
    for (var i = R.tagA[d] + 1; i < R.tagE[d]; i++) if (R.min[i] - R.min[i - 1] > 1) luecken.push(R.min[i - 1] + '>' + R.min[i]);
    console.log('  ' + sym + ' ' + tag + ': Kerzen ' + (R.tagE[d] - R.tagA[d]) + ', Luecken (Minute>Minute): ' + (luecken.join(' ') || 'keine'));
  });
});
