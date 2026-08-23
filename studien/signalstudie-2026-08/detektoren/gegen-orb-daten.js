/* Gegenpruefung ORB: Datenqualitaet im Archiv - erster Tagesbar, Vorboerse, Sortierung, Duplikate, Sekunden-Versatz */
'use strict';
var fs = require('fs');
var ST = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '1m';
var SYMS = (process.argv[3] || 'AAPL,NVDA,MSFT,TSLA,AMD,SPY').split(',');
function tag(t) { return new Date(t).toISOString().slice(0, 10); }
function hhmm(t) { return new Date(t).toISOString().slice(11, 19); }
SYMS.forEach(function (sym) {
  var f = ST + 'bars_' + IV + '_' + sym + '.json';
  if (!fs.existsSync(f)) { console.log(sym, 'fehlt'); return; }
  var bars = JSON.parse(fs.readFileSync(f, 'utf8')).series;
  var unsorted = 0, dup = 0, sek = 0, vor = 0, nach = 0, wochenende = 0;
  var erste = {}, tage = {};
  for (var i = 0; i < bars.length; i++) {
    var t = bars[i][0], d = new Date(t);
    if (i > 0 && t < bars[i - 1][0]) unsorted++;
    if (i > 0 && t === bars[i - 1][0]) dup++;
    if (t % 60000 !== 0) sek++;
    var m = d.getUTCHours() * 60 + d.getUTCMinutes();
    if (m < 13 * 60 + 30) vor++;
    if (m >= 20 * 60) nach++;
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) wochenende++;
    var tg = tag(t);
    if (!tage[tg]) { tage[tg] = 0; erste[tg] = hhmm(t); }
    tage[tg]++;
  }
  var ersteVert = {};
  Object.keys(erste).forEach(function (tg) { ersteVert[erste[tg]] = (ersteVert[erste[tg]] || 0) + 1; });
  var kleineTage = Object.keys(tage).filter(function (tg) { return tage[tg] < (IV === '1m' ? 300 : IV === '5m' ? 60 : 20); });
  console.log(sym, IV, 'Bars', bars.length, 'Tage', Object.keys(tage).length, '| unsortiert', unsorted, 'Duplikate', dup, 'Sekundenversatz', sek,
    '| vor 13:30', vor, 'ab 20:00', nach, 'Wochenende', wochenende, '| erster Tagesbar:', JSON.stringify(ersteVert), '| kurze Tage:', kleineTage.map(function (tg) { return tg + '=' + tage[tg]; }).join(' '));
});
