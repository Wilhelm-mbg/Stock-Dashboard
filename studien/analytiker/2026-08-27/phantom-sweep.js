'use strict';
/* Analytiker 27.08.2026 abends, PM-Auftrag (vorgezogen): Phantom-Anpassungs-Sweep.
 * Suchmuster (RGR-Fall): Yahoo fuehrt ein Split-Ereignis, Massive kennt keines.
 * Grundmenge: alle Reihen mit vorhandenen Massive-Splitdaten (Eich- + 29er- +
 * 275er-Menge). Je Reihe EIN Yahoo-Abruf (interval=1mo, range=max - volle
 * Ereignishistorie, kleine Antwort), ~350 ms Abstand - schonend.
 * ZAEHLEN, NICHTS AENDERN. Kontrollen: AAPL/NVDA muessen Yahoo-events fuehren
 * UND von Massive gedeckt sein, sonst Abbruch.
 * Diff-Regel: Datum +-5 Kalendertage, Faktor +-3 % in BEIDER Orientierung
 * (Yahoos numerator/denominator-Konvention ist nicht dokumentiert einheitlich -
 * der RGR-Fall selbst steht als 374:1000 mit beobachtetem Kursfaktor 0,374). */
var fs = require('fs'), path = require('path');
var https = require('https');
var EIGEN = path.join(__dirname, 'einzelspruenge');
var FREMD = path.join(__dirname, '..', '..', 'vorregistrierung-2026-08-27-skalenfehler', 'ereignisse');

function massiveSplits(sym) {
  for (var o of [EIGEN, FREMD]) {
    var p = path.join(o, sym + '.json');
    if (fs.existsSync(p)) {
      try {
        var j = JSON.parse(fs.readFileSync(p, 'utf8'));
        return (j.ereignisse || []).filter(function (e) { return e.art === 'split'; });
      } catch (e) { /* weiter */ }
    }
  }
  return null;
}
function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function yahoo(sym) {
  return new Promise(function (res, rej) {
    var u = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
      '?range=max&interval=1mo&events=div%2Csplits';
    https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }, function (r) {
      var b = '';
      r.on('data', function (d) { b += d; });
      r.on('end', function () {
        try {
          var j = JSON.parse(b);
          if (j.chart && j.chart.error) return res({ fehler: j.chart.error.code });
          var e = j.chart.result[0].events || {};
          res({ splits: Object.values(e.splits || {}) });
        } catch (er) { res({ fehler: 'unlesbar' }); }
      });
    }).on('error', function (e) { res({ fehler: e.code || e.message }); })
      .on('timeout', function () { res({ fehler: 'timeout' }); });
  });
}
function faktorPasst(a, b) {
  return [b, 1 / b].some(function (k) { return k > 0 && Math.abs(a / k - 1) <= 0.03; });
}

(async function () {
  var syms = {};
  [EIGEN, FREMD].forEach(function (o) {
    if (fs.existsSync(o)) fs.readdirSync(o).forEach(function (f) {
      if (/\.json$/.test(f)) syms[f.replace('.json', '')] = 1;
    });
  });
  var liste = Object.keys(syms).sort();
  /* Kontrollreihen sicherstellen */
  ['AAPL', 'NVDA'].forEach(function (k) { if (!syms[k]) liste.push(k); });
  console.log('Grundmenge: ' + liste.length + ' Reihen mit Massive-Splitdaten (+Kontrollen)');

  var ergebnis = { geprueft: 0, ohneYahooDaten: [], beideLeer: 0, gedeckt: 0, reihenMitPhantom: [], phantome: [], massiveNur: [] };
  for (var i = 0; i < liste.length; i++) {
    var sym = liste[i];
    var mSplits = massiveSplits(sym) || (sym === 'AAPL' || sym === 'NVDA' ? [] : null);
    if (sym === 'AAPL') mSplits = [{ datum: '2020-08-31', faktor: 0.25 }, { datum: '2014-06-09', faktor: 1 / 7 }, { datum: '2005-02-28', faktor: 0.5 }, { datum: '2000-06-21', faktor: 0.5 }, { datum: '1987-06-16', faktor: 0.5 }];
    if (mSplits == null) continue;
    var y = await yahoo(sym);
    await warte(350);
    if (y.fehler) { ergebnis.ohneYahooDaten.push(sym + '(' + y.fehler + ')'); continue; }
    ergebnis.geprueft++;
    var ySplits = (y.splits || []).map(function (s) {
      return { datum: new Date(s.date * 1000).toISOString().slice(0, 10), zaehler: s.numerator, nenner: s.denominator, f: s.numerator / s.denominator };
    });
    if (!ySplits.length && !mSplits.length) { ergebnis.beideLeer++; continue; }
    var reiheHatPhantom = false;
    ySplits.forEach(function (ys) {
      var deckt = mSplits.some(function (ms) {
        var dd = Math.abs(Date.parse(ys.datum) - Date.parse(ms.datum)) / 86400000;
        return dd <= 5 && (faktorPasst(ys.f, ms.faktor) || faktorPasst(1 / ys.f, ms.faktor));
      });
      if (deckt) ergebnis.gedeckt++;
      else { reiheHatPhantom = true; ergebnis.phantome.push(sym + '  ' + ys.datum + '  Yahoo ' + ys.zaehler + ':' + ys.nenner); }
    });
    mSplits.forEach(function (ms) {
      var deckt = ySplits.some(function (ys) {
        var dd = Math.abs(Date.parse(ys.datum) - Date.parse(ms.datum)) / 86400000;
        return dd <= 5 && (faktorPasst(ys.f, ms.faktor) || faktorPasst(1 / ys.f, ms.faktor));
      });
      if (!deckt) ergebnis.massiveNur.push(sym + '  ' + ms.datum + '  Massive f=' + ms.faktor);
    });
    if (reiheHatPhantom) ergebnis.reihenMitPhantom.push(sym);
    if ((i + 1) % 50 === 0) console.log('... ' + (i + 1) + '/' + liste.length);
  }
  console.log('\n== ERGEBNIS ==');
  console.log('geprueft: ' + ergebnis.geprueft + '   ohne Yahoo-Daten: ' + ergebnis.ohneYahooDaten.length +
    (ergebnis.ohneYahooDaten.length ? ' (' + ergebnis.ohneYahooDaten.slice(0, 10).join(', ') + ')' : ''));
  console.log('beidseitig leer: ' + ergebnis.beideLeer + '   Yahoo-Splits von Massive gedeckt: ' + ergebnis.gedeckt);
  console.log('\nPHANTOM-KANDIDATEN (Yahoo fuehrt, Massive kennt nicht) - ' + ergebnis.phantome.length + ' Ereignisse in ' + ergebnis.reihenMitPhantom.length + ' Reihen:');
  ergebnis.phantome.forEach(function (z) { console.log('  ' + z); });
  console.log('\nGEGENRICHTUNG (Massive fuehrt, Yahoo nicht) - ' + ergebnis.massiveNur.length + ':');
  ergebnis.massiveNur.forEach(function (z) { console.log('  ' + z); });
  fs.writeFileSync(path.join(__dirname, 'phantom-sweep-ergebnis.json'), JSON.stringify(ergebnis, null, 1));
})().catch(function (e) { console.log('ABBRUCH: ' + e.message); process.exit(1); });
