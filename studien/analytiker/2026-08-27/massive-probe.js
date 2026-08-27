'use strict';
/* Analytiker 27.08.2026, PM-Auftrag: schaltet der vorhandene Massive-Schluessel
 * die Splits-/Dividenden-Endpunkte frei?
 *
 * NUR LESEN. Der Schluessel kommt aus tools/massive.js (Bearer-Header, nie in
 * Ausgabe/Datei). Beide Richtungen: AAPL = Positivkontrolle (bekannte Splits
 * 2014-06-09 7:1, 2020-08-31 4:1 - der Endpunkt MUSS feuern), ARM =
 * Negativkontrolle (Boersengang 2023, keine Splits erwartet - leere Liste ist
 * dort die richtige Antwort, nicht der Beweis eines toten Endpunkts).
 *
 * Teil A (ohne Netz): Versatz-Faktor 60m/1d je Reihe beziffern - Median des
 * Verhaeltnisses 1d-Schluss / letzte-60m-Schlusskerze je Tag, in Zeitfenstern,
 * damit sichtbar wird, WO der Faktor springt.
 * Teil B (Netz, 13 s Abstand je Abruf): Splits fuer RGR SITC B WHLR BYND AAPL ARM,
 * Dividenden fuer RGR SITC B. Rohantworten (ohne Schluessel - der steckt nur im
 * Header) nach massive-probe-daten.json. */
var fs = require('fs');
var path = require('path');
var M = require(path.join(__dirname, '..', '..', '..', 'tools', 'massive.js'));

var A60 = 'E:/Markt-Dashboard-Archiv/archiv60m', A1D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var KANDIDATEN = ['RGR', 'SITC', 'B', 'WHLR', 'BYND'];

function lade(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')).series || null; } catch (e) { return null; } }
function reihe(archiv, prefix, sym) {
  var p1 = path.join(archiv, prefix + sym + '.json');
  var p2 = path.join(archiv, 'etf', prefix + sym + '.json');
  return lade(fs.existsSync(p1) ? p1 : p2);
}

/* ---------- Teil A: Versatz beziffern ---------- */
console.log('== TEIL A: Versatz 1d-Schluss / 60m-Tagesschluss (Median je Fenster) ==');
var versatz = {};
KANDIDATEN.forEach(function (sym) {
  var s60 = reihe(A60, 'bars_60m_', sym), s1d = reihe(A1D, 'bars_1d_', sym);
  if (!s60 || !s1d) { console.log(sym + ': Reihe fehlt (60m ' + !!s60 + ', 1d ' + !!s1d + ')'); return; }
  // letzte 60m-Kerze je Tag
  var tag60 = {};
  s60.forEach(function (k) {
    var d = new Date(k[0]).toISOString().slice(0, 10);
    if (!tag60[d] || k[0] > tag60[d][0]) tag60[d] = k;
  });
  var quoten = [];
  s1d.forEach(function (t) {
    var d = new Date(t[0]).toISOString().slice(0, 10);
    var k = tag60[d];
    if (!k || !(k[1] > 0) || !(t[1] > 0)) return;
    quoten.push({ d: d, q: t[1] / k[1] });
  });
  if (!quoten.length) { console.log(sym + ': keine gemeinsamen Tage'); return; }
  quoten.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
  // Fenster von je ~60 Tagen, Median je Fenster
  function med(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor(b.length / 2)]; }
  var fenster = [];
  for (var i = 0; i < quoten.length; i += 60) {
    var teil = quoten.slice(i, i + 60);
    fenster.push({ von: teil[0].d, bis: teil[teil.length - 1].d, median: med(teil.map(function (x) { return x.q; })) });
  }
  versatz[sym] = fenster;
  console.log(sym + ' (' + quoten.length + ' gemeinsame Tage):');
  fenster.forEach(function (f) { console.log('   ' + f.von + ' .. ' + f.bis + '   1d/60m = ' + f.median.toFixed(4)); });
  // Sprungstelle grob: erster Tag, an dem sich die Quote gegenueber dem Vortag um >5 % aendert
  for (var j = 1; j < quoten.length; j++) {
    var r = quoten[j].q / quoten[j - 1].q;
    if (r > 1.05 || r < 0.95) console.log('   SPRUNG der Quote am ' + quoten[j].d + ' (Faktor ' + r.toFixed(4) + ')');
  }
});

/* ---------- Teil B: die Abrufe ---------- */
(async function () {
  var key;
  try { key = M.schluessel(); } catch (e) { console.log('\n== TEIL B entfaellt: ' + e.message.split('\n')[0]); return; }
  console.log('\n== TEIL B: Massive-Endpunkte (13 s Abstand je Abruf) ==');
  var roh = { splits: {}, dividenden: {}, fehler: {} };
  var SPLIT_TICKER = KANDIDATEN.concat(['AAPL', 'ARM']);
  for (var i = 0; i < SPLIT_TICKER.length; i++) {
    var sym = SPLIT_TICKER[i];
    try {
      var j = await M.hole('/v3/reference/splits?ticker=' + sym + '&limit=1000', key);
      var res = j.results || [];
      roh.splits[sym] = res;
      console.log('splits ' + sym.padEnd(5) + ': ' + res.length + ' Eintrag/Eintraege' +
        (res.length ? ' -> ' + res.map(function (s) { return s.execution_date + ' ' + s.split_from + ':' + s.split_to; }).join(' | ') : ''));
    } catch (e) { roh.fehler['splits ' + sym] = String(e.message); console.log('splits ' + sym + ': FEHLER ' + e.message); }
  }
  var DIV_TICKER = ['RGR', 'SITC', 'B'];
  for (var i2 = 0; i2 < DIV_TICKER.length; i2++) {
    var sym2 = DIV_TICKER[i2];
    try {
      var j2 = await M.hole('/v3/reference/dividends?ticker=' + sym2 + '&limit=1000', key);
      var res2 = j2.results || [];
      roh.dividenden[sym2] = res2;
      var gross = res2.filter(function (d) { return d.cash_amount >= 1 || d.dividend_type === 'SC'; });
      console.log('divs   ' + sym2.padEnd(5) + ': ' + res2.length + ' gesamt, davon gross/Sonder: ' + gross.length +
        (gross.length ? ' -> ' + gross.slice(0, 6).map(function (d) { return d.ex_dividend_date + ' ' + d.cash_amount + ' (' + (d.dividend_type || '?') + ')'; }).join(' | ') : ''));
    } catch (e) { roh.fehler['divs ' + sym2] = String(e.message); console.log('divs ' + sym2 + ': FEHLER ' + e.message); }
  }
  fs.writeFileSync(path.join(__dirname, 'massive-probe-daten.json'), JSON.stringify(roh, null, 1));
  console.log('\nRohantworten -> massive-probe-daten.json (der Schluessel steckt nur im Header, nie in der Antwort)');
})();
