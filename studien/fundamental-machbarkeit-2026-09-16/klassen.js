'use strict';
/* Schritt 2 der Fundamentaltafel: Umsatzklasse je Panelreihe und KALENDERJAHR 2016-2026 (fuer die Deckungstafel
 * Klasse x Jahr). Dieselbe Definition wie panel.js / Pruefstand §1.5, nur das Fenster ist das Kalenderjahr:
 * Median des Dollar-Umsatzes (c1 x v) ueber die Handelstage des Jahres mit Umsatz > 0, mindestens 40 davon,
 * sonst "duenn" (die Reihe hatte Kurse im Jahr, aber keine 40 Umsatztage). "aktiv" = mindestens ein Tag mit Kurs im Jahr.
 *
 * Liest: panel.json (Reihen + CIK der Machbarkeit), _kalender.json (Handelstage), Tagesdateien der Trendkanal-Studie.
 * Schreibt: klassen-jahr.json (Arbeitsdatei, nicht ins Repo - liegt neben der Tafel).
 */
var fs = require('fs');
var path = require('path');

var ROH = 'E:/Markt-Dashboard-Archiv/alpaca1m';
var KANAL = path.join(__dirname, '..', 'vorregistrierung-2026-09-08-trendkanal-tage');
var JAHRE = []; for (var j = 2016; j <= 2026; j++) JAHRE.push(String(j));
var KLASSEN = [{ name: 'unter5', von: 0, bis: 5e6 }, { name: '5-50', von: 5e6, bis: 50e6 }, { name: '50-250', von: 50e6, bis: 250e6 },
  { name: '250-1000', von: 250e6, bis: 1e9 }, { name: 'ab1000', von: 1e9, bis: Infinity }];
var MIN_TAGE = 40;
function klasseVon(m) { for (var i = 0; i < KLASSEN.length; i++) if (m >= KLASSEN[i].von && m < KLASSEN[i].bis) return KLASSEN[i].name; return null; }
function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }); var n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }

function main() {
  var panel = JSON.parse(fs.readFileSync(path.join(__dirname, 'panel.json'), 'utf8'));
  var kal = Object.keys(JSON.parse(fs.readFileSync(path.join(ROH, '_kalender.json'), 'utf8')).tage).sort();
  var jahrVonIdx = kal.map(function (t) { return t.slice(0, 4); });
  var dateiVon = {};
  ['tage-0', 'tage-1', 'tage-2', 'tage-3'].forEach(function (d) {
    var dir = path.join(KANAL, d);
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(function (f) { if (f.slice(-5) === '.json') dateiVon[f.slice(0, -5)] = path.join(dir, f); });
  });
  var reihen = {}, z = { reihen: 0, ohneTagesdatei: 0, jeJahr: {} };
  JAHRE.forEach(function (y) { z.jeJahr[y] = { aktiv: 0, klassen: {} }; });
  panel.reihen.forEach(function (r) {
    z.reihen++;
    var pf = dateiVon[r.reihe] || dateiVon[r.basis], tage = null;
    if (pf) { try { tage = JSON.parse(fs.readFileSync(pf, 'utf8')); } catch (x) { tage = null; } }
    if (!tage) z.ohneTagesdatei++;
    var jeJahr = {};
    JAHRE.forEach(function (y) { jeJahr[y] = { aktiv: 0, tage: 0, umsatztage: 0, median: null, klasse: null }; });
    if (tage) {
      var dv = {};
      for (var i = 0; i < tage.tag.length; i++) {
        var y = jahrVonIdx[tage.tag[i]]; if (!jeJahr[y]) continue;
        jeJahr[y].aktiv = 1; jeJahr[y].tage++;
        var d = tage.c1[i] * tage.v[i];
        if (d > 0) { (dv[y] = dv[y] || []).push(d); }
      }
      JAHRE.forEach(function (y) {
        var e = jeJahr[y]; if (!e.aktiv) return;
        e.umsatztage = (dv[y] || []).length;
        if (e.umsatztage >= MIN_TAGE) { e.median = Math.round(median(dv[y])); e.klasse = klasseVon(e.median); } else e.klasse = 'duenn';
        z.jeJahr[y].aktiv++; z.jeJahr[y].klassen[e.klasse] = (z.jeJahr[y].klassen[e.klasse] || 0) + 1;
      });
    }
    reihen[r.reihe] = { basis: r.basis, cik: r.cik, sicherheit: r.sicherheit, lebend: r.lebend, erster: r.erster, letzter: r.letzter, jahr: jeJahr };
  });
  var out = { kennung: 'fundamentaltafel-2026-09-16/klassen-jahr/v1', panelKennung: panel.kennung, jahre: JAHRE, minTage: MIN_TAGE, klassen: KLASSEN, zaehler: z, reihen: reihen };
  fs.writeFileSync(path.join(__dirname, 'klassen-jahr.json'), JSON.stringify(out));
  console.log(JSON.stringify(z, null, 1));
}
main();
