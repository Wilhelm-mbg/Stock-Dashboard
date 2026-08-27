'use strict';
/* ================= Mechanik-Pruefung OHNE 60m-Archiv (PM-Variante) =================
 *
 * Frage (PM-Regel Zweig 3, 27.08.): Gibt es die Mechanik, dass Yahoo in Rand-
 * und Nachhandelszeiten "Umsatz 0" schreibt, obwohl gehandelt wurde? Der
 * Vorboersen-Befund vom 23.08. belegt sie fuer die Vorboerse - hier wird
 * geprueft, ob sie auch im NACHHANDEL auftritt, und zwar an der einzigen
 * Stelle, die ohne das gesperrte 60m-Archiv auskommt: 5m gegen 15m, dieselbe
 * Viertelstunde, dieselbe Quelle. Traegt die 15m-Kerze 0 und die Summe ihrer
 * drei 5m-Kerzen > 0 (oder umgekehrt), liefert die Quelle denselben Zeitraum
 * einmal mit und einmal ohne Umsatz - die Mechanik waere belegt.
 *
 * NUR LESEND. archiv5m/archiv15m sind nicht gesperrt (Sperre liegt auf 60m/1d).
 *
 * POSITIVKONTROLLE gegen den Nullbefund (Hausregel): dieselbe Paarung auf
 * SITZUNGS-Viertelstunden - dort muss die 5m-Summe die 15m-Zahl im Regelfall
 * treffen. Findet die Paarung dort nichts, taugt auch ein "kein Widerspruch
 * im Nachhandel" nichts. */
var fs = require('fs'), path = require('path');
var Boerse = require(path.join(__dirname, '..', '..', 'boerse.js'));
var Q = require(path.join(__dirname, '..', '..', 'quant.js'));
var D5 = 'E:/Markt-Dashboard-Archiv/archiv5m', D15 = 'E:/Markt-Dashboard-Archiv/archiv15m';

function lade(p) { try { var j = JSON.parse(fs.readFileSync(p, 'utf8')); return Array.isArray(j.series) ? j.series : null; } catch (e) { return null; } }
function lage(t) {
  var m = null; try { m = Q.minutenSeitOeffnung(t); } catch (e) { return 'unbekannt'; }
  var s = Boerse.sitzungsMinuten(t);
  if (m == null || s == null) return 'unbekannt';
  if (m < 0) return 'vorboerse';
  if (m >= s) return 'nachhandel';
  return 'sitzung';
}

var syms15 = fs.readdirSync(D15).filter(function (f) { return /^bars_15m_.*\.json$/.test(f); });
console.log('15m-Reihen: ' + syms15.length + ' (nur lesend, 5m/15m sind nicht gesperrt)');

var zaehl = {
  sitzung:    { paare: 0, beideNull: 0, stimmig: 0, widerspruch15null: 0, widerspruch5null: 0 },
  nachhandel: { paare: 0, beideNull: 0, stimmig: 0, widerspruch15null: 0, widerspruch5null: 0 },
  vorboerse:  { paare: 0, beideNull: 0, stimmig: 0, widerspruch15null: 0, widerspruch5null: 0 }
};
var beispiele = [];
var randMitUmsatz5m = 0, randKerzen5m = 0;

syms15.forEach(function (f) {
  var s15 = lade(path.join(D15, f)); if (!s15) return;
  var f5 = path.join(D5, f.replace('bars_15m_', 'bars_5m_'));
  var s5 = lade(f5); if (!s5) return;
  /* 5m nach Viertelstunden-Beginn indexieren: Summe der bis zu drei Kerzen. */
  var idx5 = {};
  s5.forEach(function (k) {
    var q = Math.floor(k[0] / 900000) * 900000;
    idx5[q] = (idx5[q] || 0) + (k[2] || 0);
    var l9 = lage(k[0]);
    if (l9 === 'nachhandel' || l9 === 'vorboerse') { randKerzen5m++; if ((k[2] || 0) > 0) randMitUmsatz5m++; }
  });
  s15.forEach(function (k) {
    var q = Math.floor(k[0] / 900000) * 900000;
    if (!(q in idx5)) return;                    // keine 5m-Abdeckung: kein Paar
    var l = lage(k[0]); if (l === 'unbekannt') return;
    var u15 = k[2] || 0, u5 = idx5[q];
    var z = zaehl[l]; z.paare++;
    if (u15 === 0 && u5 === 0) z.beideNull++;
    else if (u15 > 0 && u5 > 0) z.stimmig++;
    else if (u15 === 0 && u5 > 0) { z.widerspruch15null++; if (l !== 'sitzung' && beispiele.length < 8) beispiele.push(f.replace(/^bars_15m_|\.json$/g, '') + ' ' + new Date(k[0]).toISOString().slice(0, 16) + ' (' + l + '): 15m=0, 5m-Summe=' + u5); }
    else z.widerspruch5null++;
  });
});

console.log('\n=== Paarung 15m-Kerze gegen Summe ihrer 5m-Kerzen ===');
['sitzung', 'nachhandel', 'vorboerse'].forEach(function (l) {
  var z = zaehl[l];
  console.log('  ' + l.padEnd(11) + ' Paare ' + String(z.paare).padStart(9) +
    ' | beide 0: ' + String(z.beideNull).padStart(8) +
    ' | beide >0: ' + String(z.stimmig).padStart(9) +
    ' | 15m=0/5m>0: ' + String(z.widerspruch15null).padStart(7) +
    ' | 15m>0/5m=0: ' + String(z.widerspruch5null).padStart(6));
});
console.log('\nPOSITIVKONTROLLE (Sitzung): ' + (zaehl.sitzung.stimmig > 1000
  ? 'BESTANDEN - die Paarung findet ' + zaehl.sitzung.stimmig.toLocaleString('de') + ' uebereinstimmende Umsatz-Paare; sie wuerde Widersprueche sehen, wenn es sie gaebe.'
  : 'FRAGLICH - nur ' + zaehl.sitzung.stimmig + ' stimmige Paare, der Paarungs-Mechanismus selbst ist zweifelhaft. Nullbefunde unten NICHT verwenden.'));
console.log('\n5m-Randkerzen (Vor-/Nachhandel) gesamt: ' + randKerzen5m.toLocaleString('de') +
  ', davon MIT Umsatz > 0: ' + randMitUmsatz5m.toLocaleString('de') +
  '  (liefert die Quelle in Randzeiten ueberhaupt je Umsatz?)');
console.log('\n=== Beispiele Widerspruch in Randzeiten (15m=0, 5m>0) ===');
if (beispiele.length) beispiele.forEach(function (b) { console.log('  ' + b); });
else console.log('  (keine)');
console.log('\nLESART (PM-Regel Zweig 3): Widersprueche in Randzeiten > 0 => die Quelle ' +
  'liefert denselben Zeitraum einmal mit, einmal ohne Umsatz - "Umsatz 0" ist dort ' +
  'KEIN Beleg fuer "kein Handel"; Zweig 1 (flach) verloere seine Begruendung. ' +
  'Null Widersprueche BEI bestandener Positivkontrolle => die Mechanik uebertraegt ' +
  'sich nicht auf den Nachhandel dieser Archive.');
