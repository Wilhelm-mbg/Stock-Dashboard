'use strict';
/* ZWEIG E DER EINSTIEGSKONVENTION — E1 (Aequivalenz je Zelle) und E3 (Schichtungspflicht).
 *
 * Gemessen wird die Luecke L = Eroeffnung[i+1] / Schluss[i] - 1: was es kostet, dass die
 * Maschine zum SCHLUSS der Signalkerze einsteigt statt zum ersten handelbaren Kurs danach.
 *
 * E1 fragt: Ist das INNERHALB einer Sitzung folgenlos? Vorregistrierte Marge +-0,010 Pp
 *    (= 10 % der Kostenhuerde), Intervall L +- 2,241 * se, und zwar in JEDER Zelle
 *    (Haelfte x Sitzungsposition) - nicht aggregiert. Der Grund steht in der
 *    Vorregistrierung: die Aggregatzahl -0,000054 Pp ist eine Ausloeschung.
 * E3 fragt: Braucht die Sitzungsgrenze eine eigene Schicht? Regel: sd(GRENZE) >= 3 * sd(INNEN).
 *
 * DER STANDARDFEHLER IST TAGESGECLUSTERT. Millionen Einzelfaelle an einem Tag sind keine
 * Millionen Beobachtungen - sie teilen denselben Marktzug. Je Zelle wird deshalb erst je
 * Tag gemittelt, dann ueber die Tage.
 *
 * Aufruf: node studien/vorregistrierung-2026-08-25-einstiegskonvention/messen-E.js
 */
var fs = require('fs'), path = require('path');

var ARCHIV = process.env.MD_ARCHIV60M || 'E:/Markt-Dashboard-Archiv/archiv60m';
var VORLAUF = 261;
var SCHNITT = '2025-03-12';       // derselbe Schnitt, den die Maschine auf archiv60m setzt
var MARGE = 0.00010;              // +-0,010 Pp, vorregistriert
var Z = 2.241;                    // zweiseitig, Testzahl 2

/* F1 wie in der Messmaschine - dieselben Grenzen, sonst misst dieses Werkzeug ein
 * anderes Universum als sie. */
function reiheKaputt(b) {
  var maxKurs = 0;
  for (var i = 0; i < b.length; i++) {
    var c = b[i][1];
    if (!(c > 0)) return true;
    if (c > maxKurs) maxKurs = c;
    if (i > 0) { var v = b[i - 1][1]; if (v > 0) { var r = c / v - 1; if (r > 4 || r < -0.8) return true; } }
  }
  return maxKurs > 100000;
}
function positionen(b) {
  var p = new Int16Array(b.length), letzter = null, k = 0;
  for (var i = 0; i < b.length; i++) {
    var d = new Date(b[i][0]);
    var tag = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    if (tag !== letzter) { letzter = tag; k = 0; } else { k++; }
    p[i] = k;
  }
  return p;
}
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

/* zelle -> tag -> {s, n}; dazu die Streuung JE FALL fuer E3. */
var zellen = {};
var jeFall = { INNEN: { n: 0, s: 0, s2: 0 }, GRENZE: { n: 0, s: 0, s2: 0 },
               GRENZE1TAG: { n: 0, s: 0, s2: 0 } };
var reihen = 0, verworfen = 0;

fs.readdirSync(ARCHIV).filter(function (f) { return /^bars_60m_.+\.json$/.test(f); })
  .forEach(function (f) {
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); } catch (e) { return; }
    var b = j && j.series;
    if (!b || b.length < VORLAUF + 2) return;
    if (reiheKaputt(b)) { verworfen++; return; }
    reihen++;
    var P = positionen(b);
    for (var i = VORLAUF; i < b.length - 1; i++) {
      var schluss = b[i][1], auf = b[i + 1][5];
      if (!(schluss > 0) || !(auf > 0)) continue;
      var L = auf / schluss - 1;
      var grenze = P[i + 1] === 0;
      var tag = tagVon(b[i][0]);
      var hf = tag < SCHNITT ? 'entdeckung' : 'bestaetigung';

      var g = grenze ? jeFall.GRENZE : jeFall.INNEN;
      g.n++; g.s += L; g.s2 += L * L;
      if (grenze) {
        var abstand = Math.round((b[i + 1][0] - b[i][0]) / 86400000);
        if (abstand <= 1) { var g1 = jeFall.GRENZE1TAG; g1.n++; g1.s += L; g1.s2 += L * L; }
      }

      /* E1 misst NUR innerhalb der Sitzung. */
      if (grenze) continue;
      var key = hf + '|' + P[i];
      var zt = zellen[key] || (zellen[key] = {});
      var e = zt[tag] || (zt[tag] = { s: 0, n: 0 });
      e.s += L; e.n++;
    }
  });

function statistik(werte) {
  var n = werte.length;
  if (n < 3) return null;
  var m = 0; werte.forEach(function (x) { m += x; }); m /= n;
  var v = 0; werte.forEach(function (x) { v += (x - m) * (x - m); }); v /= (n - 1);
  return { n: n, mittel: m, se: Math.sqrt(v / n) };
}
function sdJeFall(o) { var m = o.s / o.n; return Math.sqrt(o.s2 / o.n - m * m); }

var pp = function (x) { return (x >= 0 ? '+' : '') + (x * 100).toFixed(5); };

console.log('EINSTIEGSKONVENTION — Zweig E');
console.log(reihen + ' Reihen benutzt (' + verworfen + ' nach F1 verworfen), Schnitt ' + SCHNITT);
console.log('Vorregistriert: Marge +-' + (MARGE * 100).toFixed(3) + ' Pp, Intervall L +- ' + Z + ' * se, je Zelle.\n');

/* ---------- E1 ---------- */
var reihe = [];
Object.keys(zellen).sort().forEach(function (key) {
  var tage = Object.keys(zellen[key]);
  var mittelJeTag = tage.map(function (t) { var e = zellen[key][t]; return e.s / e.n; });
  var st = statistik(mittelJeTag);
  if (!st) return;
  var halb = Z * st.se;
  var drin = Math.abs(st.mittel) + halb <= MARGE;
  var faelle = tage.reduce(function (a, t) { return a + zellen[key][t].n; }, 0);
  reihe.push({ key: key, tage: st.n, faelle: faelle, mittel: st.mittel, se: st.se, halb: halb, drin: drin });
});

console.log('E1 — je Zelle (Haelfte x Sitzungsposition), tagesgeclustert:');
console.log('  Zelle'.padEnd(26) + 'Tage'.padStart(6) + 'Faelle'.padStart(12) + 'Mittel Pp'.padStart(12) +
            'Halbbreite'.padStart(12) + '   Intervall in der Marge?');
reihe.forEach(function (r) {
  console.log('  ' + r.key.padEnd(24) + String(r.tage).padStart(6) + String(r.faelle).padStart(12) +
    pp(r.mittel).padStart(12) + pp(r.halb).padStart(12) + '   ' + (r.drin ? 'ja' : 'NEIN'));
});
var raus = reihe.filter(function (r) { return !r.drin; });
console.log('\n  ' + (reihe.length - raus.length) + ' von ' + reihe.length + ' Zellen liegen ganz in der Marge.');
console.log('  URTEIL E1: ' + (raus.length === 0
  ? 'AEQUIVALENT - die Schluss-Konvention ist innerhalb der Sitzung folgenlos.'
  : raus.length + ' Zelle(n) verlassen die Marge -> fuer diese "nicht entscheidbar", Aggregataussage entfaellt.'));

/* ---------- E3 ---------- */
var sdI = sdJeFall(jeFall.INNEN), sdG = sdJeFall(jeFall.GRENZE), sdG1 = sdJeFall(jeFall.GRENZE1TAG);
console.log('\nE3 — Schichtungspflicht (Streuung JE FALL):');
console.log('  INNEN       n=' + String(jeFall.INNEN.n).padStart(9) + '   Mittel ' + pp(jeFall.INNEN.s / jeFall.INNEN.n) + '   sd ' + (sdI * 100).toFixed(4) + ' Pp');
console.log('  GRENZE      n=' + String(jeFall.GRENZE.n).padStart(9) + '   Mittel ' + pp(jeFall.GRENZE.s / jeFall.GRENZE.n) + '   sd ' + (sdG * 100).toFixed(4) + ' Pp');
console.log('  Verhaeltnis sd(GRENZE)/sd(INNEN) = ' + (sdG / sdI).toFixed(2) + '   Schwelle 3');
console.log('  URTEIL E3: ' + (sdG / sdI >= 3
  ? 'SCHICHTUNGSPFLICHT - die Sitzungsgrenze braucht eine eigene Schicht.'
  : 'die Sitzungsposition genuegt.'));
console.log('\n  Beschreibend, kein Test: GRENZE nur mit 1-Tages-Abstand (ohne Mehrtagesloecher)');
console.log('    n=' + jeFall.GRENZE1TAG.n + '   Mittel ' + pp(jeFall.GRENZE1TAG.s / jeFall.GRENZE1TAG.n) +
            '   sd ' + (sdG1 * 100).toFixed(4) + ' Pp   Verhaeltnis ' + (sdG1 / sdI).toFixed(2));
