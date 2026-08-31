'use strict';
/* MACHBARKEIT der News-Sentiment-Messung. Zaehlt NUR die Nachrichtenseite -
 * kein Kurs, kein Ertrag. Laeuft auf der KOPIE des Stores. */
var fs = require('fs'), path = require('path');
var Q = require('../../quant.js');
var KOP = path.join(__dirname, 'store-kopie');

/* Handelsschluss 16:00 New York als UTC-ms. usSommerzeit aus quant.js, nicht geraten. */
function schlussMs(y, m, d) {                       // m 1-12
  var mittag = Date.UTC(y, m - 1, d, 16, 0, 0);     // 16:00 UTC als Sonde
  var sommer = Q.usSommerzeit(new Date(mittag));
  return Date.UTC(y, m - 1, d, sommer ? 20 : 21, 0, 0);
}
function tagVon(ms) {                                // Handelstag (NY-Datum) eines Stempels
  var d = new Date(ms - (Q.usSommerzeit(new Date(ms)) ? 4 : 5) * 3600000);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
var syms = fs.readdirSync(KOP).filter(function (f) { return /^newsarchiv_/.test(f); })
  .map(function (f) { return f.replace(/^newsarchiv_|\.json$/g, ''); });

var alle = {}, spanneMin = Infinity, spanneMax = -Infinity, gesamtItems = 0;
syms.forEach(function (s) {
  var j = JSON.parse(fs.readFileSync(path.join(KOP, 'newsarchiv_' + s + '.json'), 'utf8'));
  var items = (j.items || []).map(function (x) { return { t: x[0], title: x[1] }; })
    .filter(function (x) { return x.t > 0; }).sort(function (a, b) { return a.t - b.t; });
  alle[s] = items; gesamtItems += items.length;
  if (items.length) { spanneMin = Math.min(spanneMin, items[0].t); spanneMax = Math.max(spanneMax, items[items.length - 1].t); }
});
console.log('Symbole: ' + syms.length + '   Meldungen gesamt: ' + gesamtItems);
console.log('Spanne:  ' + new Date(spanneMin).toISOString().slice(0, 16) + ' .. ' + new Date(spanneMax).toISOString().slice(0, 16) + ' UTC');
console.log('Deckel 400 erreicht bei: ' + syms.filter(function (s) { return alle[s].length >= 400; }).join(',') || '-');
console.log('');

/* Alle Kalendertage der Spanne, Mo-Fr (echte Handelstage erst beim Messlauf aus archiv1d). */
var tage = [];
for (var ms = Date.UTC(new Date(spanneMin).getUTCFullYear(), new Date(spanneMin).getUTCMonth(), new Date(spanneMin).getUTCDate());
     ms <= spanneMax + 86400000; ms += 86400000) {
  var d = new Date(ms); if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
  tage.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(),
              key: d.toISOString().slice(0, 10) });
}
console.log('Werktage in der Spanne: ' + tage.length + '  (' + tage.map(function (t) { return t.key; }).join(', ') + ')');
console.log('');

var mitMeldung = 0, mitScore = 0, zeilen = [], scores = [];
syms.forEach(function (s) {
  tage.forEach(function (t) {
    var cut = schlussMs(t.y, t.m, t.d);
    /* Wie LIVE: die 12 juengsten Schlagzeilen zum Zeitpunkt - getSymbolNews liest
     * hoechstens 12 Feed-Eintraege, und genau die sah sentiment(). */
    var bis = alle[s].filter(function (x) { return x.t <= cut; });
    var fenster = bis.slice(-12);
    if (!fenster.length) return;
    mitMeldung++;
    var sc = Q.sentiment(fenster, cut).score;
    if (sc !== 0) { mitScore++; scores.push(sc); zeilen.push(s + ' ' + t.key + ' ' + sc.toFixed(3) + ' n=' + fenster.length); }
  });
});
console.log('Symbol-Tage mit >=1 Meldung bis Schluss: ' + mitMeldung);
console.log('davon Score != 0:                        ' + mitScore);
var mu = scores.reduce(function (a, b) { return a + b; }, 0) / (scores.length || 1);
var sd = Math.sqrt(scores.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / Math.max(1, scores.length - 1));
console.log('Score-Verteilung: Mittel ' + mu.toFixed(3) + '  sd ' + sd.toFixed(3) +
            '  min ' + Math.min.apply(null, scores).toFixed(3) + '  max ' + Math.max.apply(null, scores).toFixed(3));
console.log('  positiv ' + scores.filter(function (x) { return x > 0; }).length +
            '  negativ ' + scores.filter(function (x) { return x < 0; }).length);
console.log('');
console.log('-- erste 25 Zeilen --'); zeilen.slice(0, 25).forEach(function (z) { console.log('  ' + z); });
fs.writeFileSync(path.join(__dirname, 'machbarkeit-roh.txt'), zeilen.join('\n'));
