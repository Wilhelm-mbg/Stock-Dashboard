'use strict';
/* Analytiker 27.08.2026: Sortierung der Einzelspruenge nach der VORAB fixierten
 * Trennregel (TRENNREGEL-EINZELSPRUENGE.md). Klassen S / U / X, Hinweise
 * H-Tick / H-Fenster / H-Extrem. NUR LESEN.
 *
 * Aufrufarten:
 *   node einzelsprung-sortierung.js --kontrolle   nur WHLR-Positivkontrolle (16/16 S?)
 *   node einzelsprung-sortierung.js --liste       Einzelspruenge enumerieren und ablegen
 *   node einzelsprung-sortierung.js --urteil      Klassifikation ueber alle mit Ereignisdaten
 */
var fs = require('fs'), path = require('path');
var D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var EIGEN = path.join(__dirname, 'einzelspruenge');
var FREMD = path.join(__dirname, '..', '..', 'vorregistrierung-2026-08-27-skalenfehler', 'ereignisse');
var GRENZE60M = '2024-08-27';

function reihe(sym) {
  var f = path.join(D, 'bars_1d_' + sym + '.json');
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')).series || null; } catch (e) { return null; }
}
/* Einzelspruenge = Spruenge (>=2 / <=0,5), die nicht in einem I1-Paar stecken */
function einzelspruenge(s) {
  var spr = [];
  for (var i = 1; i < s.length; i++) {
    var a = s[i - 1][1], b = s[i][1];
    if (!(a > 0) || !(b > 0)) continue;
    var r = b / a;
    if (r >= 2 || r <= 0.5) spr.push({ i: i, d: new Date(s[i][0]).toISOString().slice(0, 10), r: r, kurs: b });
  }
  var benutzt = {};
  for (var p = 0; p < spr.length; p++) {
    if (benutzt[p]) continue;
    for (var q = p + 1; q < spr.length; q++) {
      if (benutzt[q]) continue;
      var A = spr[p], B = spr[q];
      if (B.i - A.i > 30) break;
      if ((A.r >= 2) === (B.r >= 2)) continue;
      if (Math.abs(A.r * B.r - 1) > 0.10) continue;
      benutzt[p] = benutzt[q] = 1; break;
    }
  }
  return spr.filter(function (_, ix) { return !benutzt[ix]; });
}
function ereignisseFuer(sym) {
  var kandidaten = [path.join(EIGEN, sym + '.json'), path.join(FREMD, sym + '.json')];
  for (var i = 0; i < kandidaten.length; i++) {
    if (fs.existsSync(kandidaten[i])) {
      try { return JSON.parse(fs.readFileSync(kandidaten[i], 'utf8')); } catch (e) { /* weiter */ }
    }
  }
  return null;
}
function handelstagDiff(s, d1, d2) {
  var t = s.map(function (k) { return new Date(k[0]).toISOString().slice(0, 10); });
  var i1 = t.indexOf(d1), i2 = t.indexOf(d2);
  if (i1 >= 0 && i2 >= 0) return Math.abs(i1 - i2);
  return Math.abs(Date.parse(d1) - Date.parse(d2)) / 86400000 <= 3 ? 1 : 99;
}
function klasse(s, leg, ev) {
  if (!ev) return { k: 'X', grund: 'keine Ereignisdaten' };
  var splits = (ev.ereignisse || []).filter(function (e) { return e.art === 'split'; });
  var best = null;
  splits.forEach(function (e) {
    var ok = [e.faktor, 1 / e.faktor].some(function (k) { return Math.abs(leg.r / k - 1) <= 0.10; });
    if (!ok) return;
    var dd = handelstagDiff(s, leg.d, e.datum);
    if (dd <= 1 && (!best || dd < best.dd)) best = { e: e, dd: dd };
  });
  if (best) return { k: 'S', ereignis: best.e };
  var hin = [];
  if ((leg.r >= 1.96 && leg.r <= 2.04) || (leg.r >= 0.49 && leg.r <= 0.51)) {
    if (leg.kurs < 1) hin.push('H-Tick');
  }
  if (leg.d >= GRENZE60M) hin.push('H-Fenster');
  if (leg.r >= 4 || leg.r <= 0.25) hin.push('H-Extrem');
  return { k: 'U', hinweise: hin };
}

var modus = process.argv[2] || '--kontrolle';

if (modus === '--kontrolle') {
  var s = reihe('WHLR');
  var ev = ereignisseFuer('WHLR');
  if (!s || !ev) { console.log('WHLR-Daten fehlen'); process.exit(1); }
  var legs = einzelspruenge(s);
  var sN = 0, uN = 0;
  legs.forEach(function (l) {
    var k = klasse(s, l, ev);
    if (k.k === 'S') sN++; else uN++;
    console.log('WHLR ' + l.d + ' r=' + l.r.toFixed(3).padStart(8) + '  -> ' + k.k +
      (k.ereignis ? ' (Split ' + k.ereignis.datum + ' f=' + k.ereignis.faktor + ')' : (k.hinweise ? ' [' + k.hinweise.join(',') + ']' : '')));
  });
  console.log('KONTROLLE: ' + legs.length + ' Einzelspruenge, S=' + sN + ', U=' + uN +
    (uN === 0 && legs.length > 0 ? '  -> BESTANDEN' : '  -> WIDERLEGT (Regel nicht anwenden, erst reparieren)'));
} else if (modus === '--liste') {
  var alle = {};
  fs.readdirSync(D).filter(function (f) { return /^bars_1d_.*\.json$/.test(f); }).forEach(function (f) {
    var sym = f.replace(/^bars_1d_|\.json$/g, '');
    var s = reihe(sym); if (!s || s.length < 5) return;
    var legs = einzelspruenge(s);
    if (legs.length) alle[sym] = legs.map(function (l) { return { d: l.d, r: l.r, kurs: l.kurs }; });
  });
  fs.writeFileSync(path.join(__dirname, 'einzelspruenge-liste.json'), JSON.stringify(alle, null, 1));
  var n = Object.keys(alle).reduce(function (a, k) { return a + alle[k].length; }, 0);
  console.log('Liste: ' + n + ' Einzelspruenge in ' + Object.keys(alle).length + ' Reihen -> einzelspruenge-liste.json');
} else if (modus === '--urteil') {
  var liste = require('./einzelspruenge-liste.json');
  var stat = { S: 0, U: 0, X: 0 }, hin = { 'H-Tick': 0, 'H-Fenster': 0, 'H-Extrem': 0 };
  var uZeilen = [];
  Object.keys(liste).sort().forEach(function (sym) {
    var s = reihe(sym); if (!s) return;
    var ev = ereignisseFuer(sym);
    liste[sym].forEach(function (l) {
      var k = klasse(s, { d: l.d, r: l.r, kurs: l.kurs }, ev);
      stat[k.k]++;
      if (k.k === 'U') {
        (k.hinweise || []).forEach(function (h) { hin[h]++; });
        uZeilen.push(sym.padEnd(6) + l.d + ' r=' + l.r.toFixed(3).padStart(8) + ' kurs=' + String(l.kurs).slice(0, 8).padEnd(8) + ' [' + (k.hinweise || []).join(',') + ']');
      }
    });
  });
  console.log('== GRUNDRATE: S=' + stat.S + '  U=' + stat.U + '  X=' + stat.X +
    '  -> Quote S/(S+U) = ' + (100 * stat.S / Math.max(1, stat.S + stat.U)).toFixed(1) + ' % ==');
  console.log('Hinweise unter U: ' + JSON.stringify(hin));
  console.log('\nU-Zeilen (unentscheidbar mit diesen Endpunkten):');
  uZeilen.forEach(function (z) { console.log('  ' + z); });
  fs.writeFileSync(path.join(__dirname, 'einzelsprung-urteil.txt'),
    'GRUNDRATE S=' + stat.S + ' U=' + stat.U + ' X=' + stat.X + '\n' + uZeilen.join('\n'));
}
