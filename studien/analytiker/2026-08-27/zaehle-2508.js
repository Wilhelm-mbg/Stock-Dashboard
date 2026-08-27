'use strict';
/* Analytiker 27.08.2026, Auftrag PM: Stimmt der 25.08. im NEU GESCHRIEBENEN
 * 60m-Archiv jetzt? (Datenfund 2/A — zaehlen, nicht reparieren.)
 * Beanstandet war (Stand vor dem Neuschreiben):
 *   (1) 2.839 von 2.885 Reihen trugen eine 20:00Z-Kerze am 25.08. mit Umsatz 0
 *       und Kurs = Schluss der 19:30-Kerze (eingefrorene Quote-Kerze).
 *   (2) Die 19:30-Kerze selbst war unfertig eingefroren (AAPL archiviert
 *       v 2.851.594 / c 309,8999 gegen Quelle heute v 2.846.819 / c 309,8299).
 * Kerzenformat: [ts, open, vol, high, low, close]. Nur lesen, nichts schreiben. */
var fs = require('fs'), path = require('path');
var A = 'E:/Markt-Dashboard-Archiv/archiv60m';
var dateien = [];
fs.readdirSync(A).forEach(function (f) { if (/^bars_60m_.*\.json$/.test(f)) dateien.push(path.join(A, f)); });
var etf = path.join(A, 'etf');
if (fs.existsSync(etf)) fs.readdirSync(etf).forEach(function (f) { if (/^bars_60m_.*\.json$/.test(f)) dateien.push(path.join(etf, f)); });

var T0 = Date.parse('2026-08-25T00:00:00Z'), T1 = Date.parse('2026-08-26T00:00:00Z');
var TS2000 = Date.parse('2026-08-25T20:00:00Z'), TS1930 = Date.parse('2026-08-25T19:30:00Z');

var n = 0, hatTag = 0, hat2000 = 0, v0_2000 = 0, cGleich1930 = 0, cAnders1930 = 0,
    ohne2000 = 0, hat1930 = 0, letzteNicht1930 = {}, stempelSonst = {};
var beispiele = [];
dateien.forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return; }
  var s = j.series; if (!Array.isArray(s) || !s.length) return;
  n++;
  var tag = s.filter(function (k) { return k[0] >= T0 && k[0] < T1; });
  if (!tag.length) return;
  hatTag++;
  var k2000 = null, k1930 = null;
  tag.forEach(function (k) {
    if (k[0] === TS2000) k2000 = k;
    if (k[0] === TS1930) k1930 = k;
    var hm = new Date(k[0]).toISOString().slice(11, 16);
    stempelSonst[hm] = (stempelSonst[hm] || 0) + 1;
  });
  if (k1930) hat1930++;
  if (k2000) {
    hat2000++;
    if (!(k2000[2] > 0)) v0_2000++;
    if (k1930) {
      if (k2000[5] === k1930[5]) cGleich1930++;
      else cAnders1930++;
    }
    if (beispiele.length < 5 && k1930) beispiele.push(path.basename(f) + '  19:30 c=' + k1930[5] + ' v=' + k1930[2] + '  20:00 c=' + k2000[5] + ' v=' + k2000[2]);
  } else ohne2000++;
  var letzte = tag[tag.length - 1];
  var hmL = new Date(letzte[0]).toISOString().slice(11, 16);
  letzteNicht1930[hmL] = (letzteNicht1930[hmL] || 0) + 1;
});
console.log('Reihen gesamt gelesen: ' + n + '  (davon mit Kerzen am 25.08.: ' + hatTag + ')');
console.log('mit 19:30Z-Kerze: ' + hat1930);
console.log('mit 20:00Z-Kerze: ' + hat2000 + '   ohne: ' + ohne2000);
console.log('  davon Umsatz 0: ' + v0_2000);
console.log('  Schluss 20:00 == Schluss 19:30: ' + cGleich1930 + '   verschieden: ' + cAnders1930);
console.log('Letzte Kerze des Tages je Stempel: ' + JSON.stringify(letzteNicht1930));
console.log('Alle Stempel des Tages (Anzahl Reihen): ' + JSON.stringify(stempelSonst));
console.log('Beispiele: '); beispiele.forEach(function (b) { console.log('  ' + b); });

/* AAPL im Detail — gegen die dokumentierten Quell-Werte des Datenfunds */
var aapl = JSON.parse(fs.readFileSync(path.join(A, 'bars_60m_AAPL.json'), 'utf8')).series
  .filter(function (k) { return k[0] >= T0 && k[0] < T1; });
console.log('\nAAPL 25.08. komplett ([UTC, open, vol, high, low, close]):');
aapl.forEach(function (k) { console.log('  ' + new Date(k[0]).toISOString().slice(11, 16) + '  o=' + k[1] + ' v=' + k[2] + ' h=' + k[3] + ' l=' + k[4] + ' c=' + k[5]); });
console.log('Dokumentiert: eingefroren v=2851594/c=309.8999 — Quelle (Stand Datenfund) v=2846819/c=309.8299');
