'use strict';
/* AGGREGATIONS-DIFFERENZ: 3,22 % (Zensus, nur umsatztragende Kerzen) gegen 6,67 %
 * (Populationslauf, anderer Zuschnitt). Auftrag PM 27.08. abends.
 * Gemessen wird NICHT "welche Zahl stimmt", sondern was jede Aggregation kostet.
 *
 * Zwei Aggregationen je Reihe/Tag, nebeneinander:
 *   A "nur umsatztragend": Tages-H/T nur aus Kerzen mit Umsatz > 0
 *   B "alle Kerzen":       Tages-H/T aus allen Kerzen des Tages
 * Beide gegen archiv1d (Schwelle 0,2 %). Zusaetzlich je Fall die LAGE der Kerze,
 * die in B das Extrem traegt (kerzenlage.js - vorhandenes Instrument, kein Nachbau):
 * 'auktion' = echte Sitzungsdaten, 'schlusskurs'/'nachhandel' = Umsatz-0-Familien.
 *
 * Entscheidende Zahl: Wenn eine umsatzlose Kerze in B das Tagesextrem traegt -
 * bestaetigt das 1d dieses Extrem (dann kostet Aggregation A ein echtes Extrem)
 * oder widerspricht es (dann holt sich B einen Stempel herein)?
 * Nur lesend, schreibt nur in diesen Ordner. KEINE Umstellung, keine Empfehlung.
 */
var fs = require('fs'), path = require('path');
var REPO = 'C:/Users/Wilhe/Downloads/Stock-Dashboard';
var KL = require(REPO + '/kerzenlage.js');
var ARCHIV60M = 'E:/Markt-Dashboard-Archiv/archiv60m';
var ARCHIV1D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var HIER = __dirname;
var SCHWELLE = 0.002, SKALA_TOL = 0.01;
var JEDE = +(process.env.AGG_JEDE || 6);        /* Stichprobe: jede n-te Reihe */

function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }

var dateien = fs.readdirSync(ARCHIV60M).filter(function (f) { return f.indexOf('bars_60m_') === 0; });
var Z = {
  reihen: 0, tage: 0,
  uneinigA: 0, uneinigB: 0, uneinigC: 0,         /* Uneinigkeit H oder T, je Aggregation */
  nurAUneinig: 0, nurBUneinig: 0,                /* wo sie sich unterscheiden */
  extremVonUmsatzlos: 0,                         /* B-Extrem stammt aus Umsatz-0-Kerze */
  extremUmsatzlosBestaetigt: 0,                  /* ... und 1d bestaetigt es (A haette es verloren) */
  extremUmsatzlosWidersprochen: 0,               /* ... und 1d widerspricht (B holt Stempel) */
  lagen: {}, skala: 0, ohne1d: 0
};
function lageZaehl(l, feld) { (Z.lagen[l] || (Z.lagen[l] = { traegtExtrem: 0, bestaetigt: 0, widersprochen: 0 }))[feld]++; }

for (var di = 0; di < dateien.length; di += JEDE) {
  var f = dateien[di];
  var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV60M, f), 'utf8')); } catch (e) { continue; }
  var sym = j.sym || f.slice(9, -5);
  var p1 = path.join(ARCHIV1D, 'bars_1d_' + sym + '.json');
  if (!fs.existsSync(p1)) { Z.ohne1d++; continue; }
  var t1 = {};
  try {
    var j1 = JSON.parse(fs.readFileSync(p1, 'utf8'));
    (j1.bars || j1.series || []).forEach(function (z) { if (z[1] > 0) t1[tag(z[0])] = { h: z[3], l: z[4], c: z[1] }; });
  } catch (e) { Z.ohne1d++; continue; }
  Z.reihen++;

  var proTag = {};
  j.series.forEach(function (z) { (proTag[tag(z[0])] || (proTag[tag(z[0])] = [])).push(z); });

  Object.keys(proTag).forEach(function (T) {
    var d1 = t1[T]; if (!d1 || !(d1.h > 0) || !(d1.l > 0)) return;
    var kerzen = proTag[T];
    var A = { h: -Infinity, l: Infinity }, B = { h: -Infinity, l: Infinity, hK: null, lK: null };
    var C = { h: -Infinity, l: Infinity };     /* Variante C, s. Kopf: alles ausser 'nachhandel' */
    var c60 = null;
    kerzen.forEach(function (z) {
      var h = z[3], l = z[4], vol = z[2] || 0;
      if (h > B.h) { B.h = h; B.hK = z; }
      if (l > 0 && l < B.l) { B.l = l; B.lK = z; }
      if (vol > 0) {
        if (h > A.h) A.h = h;
        if (l > 0 && l < A.l) A.l = l;
      }
      if (vol > 0 || KL.kerzenLage(z[0], vol) !== 'nachhandel') {
        if (h > C.h) C.h = h;
        if (l > 0 && l < C.l) C.l = l;
      }
      c60 = z[1];
    });
    if (!(B.h > 0) || !(B.l < Infinity) || !(c60 > 0)) return;
    /* Skalen-Tage aussen vor (QS-Kriterium), damit nicht Konventionen gezaehlt werden */
    var rC = c60 / d1.c;
    if (Math.abs(B.h / d1.h - rC) <= SKALA_TOL && Math.abs(B.l / d1.l - rC) <= SKALA_TOL && Math.abs(rC - 1) > SKALA_TOL) { Z.skala++; return; }
    Z.tage++;

    function uneinig(agg) {
      if (!(agg.h > 0) || !(agg.l < Infinity)) return true;   /* keine umsatztragende Kerze = kein Extrem */
      return Math.abs(agg.h / d1.h - 1) > SCHWELLE || Math.abs(agg.l / d1.l - 1) > SCHWELLE;
    }
    var uA = uneinig(A), uB = uneinig(B), uC = uneinig(C);
    if (uA) Z.uneinigA++;
    if (uB) Z.uneinigB++;
    if (uC) Z.uneinigC++;
    if (uA && !uB) Z.nurAUneinig++;
    if (uB && !uA) Z.nurBUneinig++;

    /* Traegt eine UMSATZLOSE Kerze das B-Extrem? Dann entscheidet das 1d, was sie wert ist. */
    [[B.hK, 'h'], [B.lK, 'l']].forEach(function (pair) {
      var z = pair[0], seite = pair[1];
      if (!z || (z[2] || 0) > 0) return;                       /* nur Umsatz-0-Traeger */
      Z.extremVonUmsatzlos++;
      var lage = KL.kerzenLage(z[0], z[2] || 0);
      lageZaehl(lage, 'traegtExtrem');
      var wert = seite === 'h' ? B.h : B.l, ziel = seite === 'h' ? d1.h : d1.l;
      var passt = Math.abs(wert / ziel - 1) <= SCHWELLE;
      if (passt) { Z.extremUmsatzlosBestaetigt++; lageZaehl(lage, 'bestaetigt'); }
      else { Z.extremUmsatzlosWidersprochen++; lageZaehl(lage, 'widersprochen'); }
    });
  });
  if (Z.reihen % 100 === 0) console.log('  ' + Z.reihen + ' Reihen ...');
}

function pz(a, b) { return b ? (100 * a / b).toFixed(2) + ' %' : '-'; }
console.log('\n== AGGREGATIONS-VERGLEICH ==  Stichprobe jede ' + JEDE + '. Reihe');
console.log('Reihen ' + Z.reihen + ' (ohne 1d: ' + Z.ohne1d + '), Tage ' + Z.tage + ', Skalen-Tage uebersprungen ' + Z.skala);
console.log('');
console.log('Aggregation A (nur umsatztragende Kerzen): uneinig mit 1d ' + Z.uneinigA + '  = ' + pz(Z.uneinigA, Z.tage));
console.log('Aggregation B (alle Kerzen):              uneinig mit 1d ' + Z.uneinigB + '  = ' + pz(Z.uneinigB, Z.tage));
console.log('Aggregation C (alle ausser Lage nachhandel): uneinig mit 1d ' + Z.uneinigC + '  = ' + pz(Z.uneinigC, Z.tage));
console.log('   [C ist NICHT vorab festgelegt - sie entstand nach dem Piloten aus dessen Lagen-Zahlen.');
console.log('    Sie wird beziffert, nicht empfohlen; der Entscheid ueber die Aggregation ist keiner des Messlaufs.]');
console.log('  nur A uneinig (B stimmt): ' + Z.nurAUneinig + '   nur B uneinig (A stimmt): ' + Z.nurBUneinig);
console.log('');
console.log('Tagesextreme, die eine UMSATZLOSE Kerze traegt: ' + Z.extremVonUmsatzlos);
console.log('  davon vom 1d BESTAETIGT (Aggregation A verliert ein echtes Extrem): ' + Z.extremUmsatzlosBestaetigt + '  = ' + pz(Z.extremUmsatzlosBestaetigt, Z.extremVonUmsatzlos));
console.log('  davon vom 1d WIDERSPROCHEN (Aggregation B holt einen Stempel herein): ' + Z.extremUmsatzlosWidersprochen + '  = ' + pz(Z.extremUmsatzlosWidersprochen, Z.extremVonUmsatzlos));
console.log('');
console.log('Nach Kerzenlage (kerzenlage.js):');
Object.keys(Z.lagen).sort().forEach(function (l) {
  var x = Z.lagen[l];
  console.log('  ' + l.padEnd(12) + ' traegt Extrem ' + String(x.traegtExtrem).padStart(6) +
    '   bestaetigt ' + String(x.bestaetigt || 0).padStart(6) + ' (' + pz(x.bestaetigt || 0, x.traegtExtrem) + ')' +
    '   widersprochen ' + String(x.widersprochen || 0).padStart(6));
});
fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'), JSON.stringify(Z, null, 1));
console.log('\nlauf-<zeit>.json geschrieben. NICHTS umgestellt, keine Empfehlung.');
