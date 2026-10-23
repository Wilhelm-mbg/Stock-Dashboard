'use strict';
/* Nr. 121-2b B.1/B.2: die QQQ-Tagesreihe der Pruefstrasse (pruefstrasse/daten/qqq-tage.json, erzeugt von qqq-bauen.js, committet) laden, pruefen und
 * auf einen Tafelkalender legen. markt(j) der Sicht = QQQ-Kurs (c, wie die Panel-SPY-Reihe ohne Ausschuettungen - Kreuzprobe 23.10.2026: Panel-SPY ist
 * die Kursreihe), marktGesamt(j) = Gesamtertrag (cb, Ausschuettung am Ex-Tag wieder angelegt). Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');

var DATEI = path.join(__dirname, 'qqq-tage.json');
var KENNUNG = 'pruefstrasse/daten/qqq-tage/v1';
var ALTER_WARNUNG_TAGE = 60;

function lade(datei) {
  var d = datei || DATEI;
  if (!fs.existsSync(d)) throw new Error('DATENQUELLE FEHLT: QQQ-Tagesreihe ' + d + ' (node pruefstrasse/daten/qqq-bauen.js)');
  return JSON.parse(fs.readFileSync(d, 'utf8'));
}
/** --pruefen: Kennung und Erzeugungsdatum; aelter als 60 Tage -> Warnung (kein Fehler). jetztMs fuer Tests. */
function pruefe(Q, jetztMs) {
  var f = [], w = [], jetzt = jetztMs == null ? Date.now() : jetztMs;
  if (!Q || Q.kennung !== KENNUNG) f.push('QQQ-Tagesreihe: Kennung ' + (Q && Q.kennung) + ' statt ' + KENNUNG);
  var e = Q && Date.parse(Q.erzeugt);
  if (!(e > 0)) f.push('QQQ-Tagesreihe: Erzeugungsdatum fehlt');
  else if ((jetzt - e) / 86400000 > ALTER_WARNUNG_TAGE) w.push('QQQ-Tagesreihe ist ' + Math.floor((jetzt - e) / 86400000) + ' Tage alt (erzeugt ' + Q.erzeugt + ', letzter Tag ' + Q.bis + ') - neu bauen: node pruefstrasse/daten/qqq-bauen.js');
  return { fehler: f, warnungen: w };
}
/** Marktreihe je Kalenderindex der Tafel: { c, cb (Float64Array, NaN ohne Tag), name, von, bis, kennung }. */
function marktReihe(tage, Q) {
  Q = Q || lade();
  var n = tage.length, c = new Float64Array(n).fill(NaN), cb = new Float64Array(n).fill(NaN), idx = {};
  tage.forEach(function (t, i) { idx[t] = i; });
  Q.tage.forEach(function (x) { var i = idx[x.d]; if (i != null) { c[i] = x.c; cb[i] = x.cb; } });
  return { c: c, cb: cb, name: 'QQQ (Nasdaq-100, ' + Q.kennung + ', bis ' + Q.bis + ')', von: Q.von, bis: Q.bis, kennung: Q.kennung };
}

module.exports = { DATEI: DATEI, KENNUNG: KENNUNG, ALTER_WARNUNG_TAGE: ALTER_WARNUNG_TAGE, lade: lade, pruefe: pruefe, marktReihe: marktReihe };
