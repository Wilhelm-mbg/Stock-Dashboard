'use strict';
/* #96, dritter Anlauf - und die beiden Fehlversuche gehoeren zum Ergebnis.
 *
 * 1. Anlauf: "Sitzungsschluss" als letzten Eimer-BEGINN mit Umsatz gerechnet (19:30)
 *    und gefragt, ob die flache Kerze genau dort liegt. Sie liegt bei 20:00. H3 kam
 *    mit 3,2 % heraus und war gar nicht gefragt worden.
 * 2. Anlauf: Schluss = letzter Eimer-Beginn + 60 min. Ergibt 20:30 - denn der letzte
 *    Eimer des Tages ist KUERZER als das Gitter (19:30 bis 20:00). Die Regel traf
 *    21.180 Kerzen, davon 1.858 MIT Umsatz.
 *
 * Beide Male war der Fehler derselbe: aus den Daten laesst sich der Sitzungsschluss
 * als Uhrzeit nicht sauber ableiten, weil das Gitter um :30 versetzt ist und die
 * letzte Kerze abgeschnitten wird. Also wird er gar nicht abgeleitet. Die Regel
 * kommt ohne Uhrzeit aus:
 *
 *   R'  Eine Kerze, deren Gitterbeginn SPAETER liegt als der letzte Eimer-Beginn,
 *       den dieser Handelstag im Archiv mit Umsatz fuehrt, gehoert nicht zur Sitzung.
 *
 * Der laufende Tag bleibt aussen vor: dort ist das Archiv halb geholt, und der
 * "letzte Eimer" waere eine Aussage ueber den Abrufstand statt ueber die Boerse.
 * Genau daran ist Anlauf 2 haengengeblieben (AAPD 2026-08-26 15:30 mit 335.467 Umsatz).
 *
 * Gezaehlt, nicht eingebaut. Geloescht wird hier nichts.
 */
var fs = require('fs');
var path = require('path');
var Q = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/kerzenquelle.js');

var ZIEL = Q.ordnerVon('60m');
var dateien = Q.archivDateien(ZIEL);

function minutenVon(ms) { var d = new Date(ms); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
function hhmm(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
function datumVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function lies(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')).series || []; } catch (e) { return null; } }
function istFlachK(kz) { return kz[2] === 0 && kz[3] === kz[4] && kz[3] === kz[1] && (kz[5] == null || kz[5] === kz[1]); }

console.log('Archiv: ' + ZIEL + '   Reihen: ' + dateien.length);

var proDatum = Object.create(null), reihenProDatum = Object.create(null);
dateien.forEach(function (f) {
  var s = lies(f); if (!s) return;
  var gesehen = Object.create(null);
  for (var k = 0; k < s.length; k++) {
    var ms = s[k][0], d = datumVon(ms), m = minutenVon(ms);
    if (new Date(ms).getUTCSeconds() !== 0) continue;
    if (!proDatum[d]) { proDatum[d] = Object.create(null); reihenProDatum[d] = 0; }
    if (!gesehen[d]) { gesehen[d] = 1; reihenProDatum[d]++; }
    if (s[k][2] > 0) proDatum[d][m] = (proDatum[d][m] || 0) + 1;
  }
});

var tage = Object.keys(proDatum).sort();
var juengsterTag = tage[tage.length - 1];
var letzterStart = Object.create(null);
tage.forEach(function (d) {
  if (d === juengsterTag) return;                 // laufender Abruf: kein Urteil
  var schwelle = reihenProDatum[d] * 0.5, beste = null;
  Object.keys(proDatum[d]).forEach(function (m) {
    m = Number(m);
    if (proDatum[d][m] >= schwelle && (beste === null || m > beste)) beste = m;
  });
  if (beste !== null) letzterStart[d] = beste;
});
var histo = Object.create(null);
Object.keys(letzterStart).forEach(function (d) { var t = hhmm(letzterStart[d]); histo[t] = (histo[t] || 0) + 1; });
console.log('Beurteilte Handelstage: ' + Object.keys(letzterStart).length +
  '   (ausgelassen: ' + juengsterTag + ', dort laeuft der Abruf noch)');
console.log('Letzter Eimer-Beginn je Tag: ' + Object.keys(histo).sort()
  .map(function (t) { return t + ' \u00d7' + histo[t]; }).join(' | ') + '\n');

var treffer = 0, trefferUmsatz = 0, trefferFlach = 0, trefferReihen = Object.create(null);
var flach = 0, flachDraussen = 0, flachDrin = 0, flachDrinReihen = Object.create(null);
var abstand = Object.create(null), umsatzBsp = [], flachDrinBsp = [];
var proReihe = Object.create(null);

dateien.forEach(function (f) {
  var s = lies(f); if (!s || !s.length) return;
  var sym = path.basename(f).replace(/^bars_60m_/, '').replace(/\.json$/, '');
  for (var k = 0; k < s.length; k++) {
    var kz = s[k], ms = kz[0], d = datumVon(ms), m = minutenVon(ms);
    if (letzterStart[d] == null) continue;
    if (new Date(ms).getUTCSeconds() !== 0) continue;
    var draussen = m > letzterStart[d];
    var fl = istFlachK(kz);
    if (fl) {
      flach++;
      if (draussen) flachDraussen++;
      else {
        flachDrin++; flachDrinReihen[sym] = (flachDrinReihen[sym] || 0) + 1;
        if (flachDrinBsp.length < 8) flachDrinBsp.push(sym + ' ' + d + ' ' + hhmm(m) + ' (letzter Eimer ' + hhmm(letzterStart[d]) + ')');
      }
    }
    if (!draussen) continue;
    treffer++; trefferReihen[sym] = 1;
    proReihe[sym] = (proReihe[sym] || 0) + 1;
    abstand[m - letzterStart[d]] = (abstand[m - letzterStart[d]] || 0) + 1;
    if (fl) trefferFlach++;
    if (kz[2] > 0) {
      trefferUmsatz++;
      if (umsatzBsp.length < 10) umsatzBsp.push(sym + ' ' + d + ' ' + hhmm(m) + '  Umsatz ' + kz[2] +
        '  Spanne ' + (kz[3] - kz[4]).toFixed(4) + '  (letzter Eimer ' + hhmm(letzterStart[d]) + ')');
    }
  }
});

var jeReihe = Object.keys(proReihe).map(function (s) { return proReihe[s]; }).sort(function (a, b) { return a - b; });
function med(a) { return a.length ? a[Math.floor(a.length / 2)] : 0; }

console.log('================ Regel R\': Gitterbeginn NACH dem letzten Eimer des Tages ================');
console.log('Getroffene Kerzen      : ' + treffer.toLocaleString('de-DE'));
console.log('  davon flach          : ' + trefferFlach.toLocaleString('de-DE') +
  '   (' + (100 * trefferFlach / (treffer || 1)).toFixed(2) + ' %)');
console.log('  davon MIT UMSATZ     : ' + trefferUmsatz.toLocaleString('de-DE') +
  '   <-- jede einzelne waere ein geloeschter Handel');
console.log('  betroffene Reihen    : ' + Object.keys(trefferReihen).length + ' von ' + dateien.length +
  ',  Median je Reihe ' + med(jeReihe) + ',  Spanne ' + (jeReihe[0] || 0) + ' bis ' + (jeReihe[jeReihe.length - 1] || 0));
console.log('  Abstand zum letzten Eimer:');
Object.keys(abstand).sort(function (a, b) { return Number(a) - Number(b); }).slice(0, 6)
  .forEach(function (m) { console.log('      +' + m + ' min : ' + abstand[m].toLocaleString('de-DE')); });
if (umsatzBsp.length) {
  console.log('  Beispiele MIT Umsatz:');
  umsatzBsp.forEach(function (z) { console.log('      ' + z); });
}

console.log('\n================ Die flache Kerze ================');
console.log('Flache Kerzen (beurteilte Tage): ' + flach.toLocaleString('de-DE'));
console.log('  AUSSERHALB der Sitzung       : ' + flachDraussen.toLocaleString('de-DE') +
  '   (' + (100 * flachDraussen / (flach || 1)).toFixed(1) + ' %)');
console.log('  INNERHALB                    : ' + flachDrin.toLocaleString('de-DE') +
  '   in ' + Object.keys(flachDrinReihen).length + ' Reihen');
if (flachDrinBsp.length) { console.log('  Beispiele innerhalb:'); flachDrinBsp.forEach(function (z) { console.log('      ' + z); }); }
var schlimm = Object.keys(flachDrinReihen).sort(function (a, b) { return flachDrinReihen[b] - flachDrinReihen[a]; }).slice(0, 6);
console.log('  Reihen mit den meisten echten Leerstunden: ' +
  schlimm.map(function (s) { return s + ' ' + flachDrinReihen[s]; }).join(', '));
