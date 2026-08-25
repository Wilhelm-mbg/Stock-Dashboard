'use strict';
/* MOMENTUM OHNE UEBERLAPPUNG.
 *
 * WOZU. Die bisherige Messung eroeffnet an JEDEM Handelstag eine 63-Tage-Position. Ueber
 * 20 Jahre sind das 5.038 Beobachtungen - aber jede teilt 62 von 63 Tagen mit ihrer
 * Nachbarin. B10 (Newey-West ueber 62 Verzoegerungen) korrigiert das, und der
 * Standardfehler waechst dabei um Faktor 6,42: aus t = 4,74 wurde t = 0,74.
 *
 * Das ist keine Schwaeche der Strategie, sondern der MESSANORDNUNG. Die Abhilfe ist eine
 * andere Anordnung, keine andere Statistik: ein Depot, das auf festem Kalender alle 63
 * Handelstage umschichtet. Dann sind die Beobachtungen ECHT unabhaengig - vier im Jahr,
 * ueber 20 Jahre achtzig. Wenig, aber ehrlich, und ohne Ueberlappungskorrektur.
 *
 * Genau diese Konstruktion faehrt mfhandel.js bereits als virtuelles Buch
 * (rebalanceFaellig: tage >= 63; ziel = staerkste 10 %). Sie ist nie durch die Muehle
 * gegangen.
 *
 * DIE RASTERLAGE (B9). 63 Handelstage Abstand heisst: es gibt 63 moegliche Startphasen,
 * und sich eine auszusuchen waere ein verdeckter Mehrfachtest. Die Vorregistrierung legt
 * deshalb EINE Phase fest, und zwar ohne Wahl: die erste Umschichtung liegt auf dem
 * ersten Handelstag, an dem das Merkmal ueberhaupt gebildet werden kann (Index 252).
 * Die anderen 62 Phasen werden mitgerechnet und ANGEZEIGT - als Streubild, nicht als
 * Tests. Sie sagen, wie stark das Ergebnis an der Phase haengt.
 *
 * Aufruf:
 *   node studien/momentum-nichtueberlappend/messen.js --haelfte=entdeckung
 *   node studien/momentum-nichtueberlappend/messen.js --haelfte=bestaetigung
 * Ohne Angabe wird NICHTS ausgegeben - die Haelfte muss man benennen, damit man nicht
 * versehentlich in die Bestaetigung schaut.
 */
var fs = require('fs'), path = require('path');

var ARCHIV = process.env.MD_ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var WP = require('../messmaschine/strategien/wertpapierart.js');

var RUECKBLICK = 231, LUECKE = 21, HALTEN = 63, ANTEIL = 0.10;
var MINDEST_WERTE = 100;
var SCHNITT = '2006-08-14';        // derselbe Schnitt wie in der Maschine

var arg = {};
process.argv.slice(2).forEach(function (a) {
  var m = /^--([a-z]+)=?(.*)$/.exec(a); if (m) arg[m[1]] = m[2] || true;
});
if (!arg.haelfte || ['entdeckung', 'bestaetigung', 'beide'].indexOf(arg.haelfte) < 0) {
  console.error('Bitte --haelfte=entdeckung | bestaetigung | beide angeben.');
  console.error('Die Haelfte muss man benennen - sonst schaut man versehentlich in die Bestaetigung.');
  process.exit(2);
}

/* ---------- Laden ---------- */
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return /^bars_1d_.+\.json$/.test(f); });
var U = {}, zeitachse = {};
dateien.forEach(function (f) {
  var sym = f.slice(8, -5);
  if (!WP.istAktie(sym)) return;
  var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); } catch (e) { return; }
  var b = j && j.series;
  if (!b || b.length < RUECKBLICK + LUECKE + HALTEN + 10) return;
  /* F1: Reihen mit unmoeglichen Spruengen ganz verwerfen - dieselbe Regel wie in der
   * Maschine, sonst misst dieses Werkzeug etwas anderes als sie. */
  var maxKurs = 0, kaputt = false;
  for (var i = 0; i < b.length; i++) {
    var c = b[i][1];
    if (!(c > 0)) continue;
    if (c > maxKurs) maxKurs = c;
    if (i > 0 && b[i - 1][1] > 0) {
      var r = c / b[i - 1][1] - 1;
      if (r > 4 || r < -0.8) { kaputt = true; break; }
    }
  }
  if (kaputt || maxKurs > 100000) return;
  U[sym] = b;
  b.forEach(function (k) { zeitachse[k[0]] = 1; });
});
var TAGE = Object.keys(zeitachse).map(Number).sort(function (a, b) { return a - b; });
var syms = Object.keys(U);

/* Je Symbol ein Zeiger auf die gemeinsame Zeitachse, damit Tage vergleichbar sind. */
var IDX = {};
syms.forEach(function (s) {
  var m = new Map();
  U[s].forEach(function (k, i) { m.set(k[0], i); });
  IDX[s] = m;
});

/* ---------- Eine Rasterlage durchrechnen ---------- */
function laufe(phase, haelfte) {
  var perioden = [];
  for (var t = 252 + phase; t + HALTEN < TAGE.length; t += HALTEN) {
    var ms = TAGE[t], msEnde = TAGE[t + HALTEN];
    var hf = tagVon(ms) < SCHNITT ? 'entdeckung' : 'bestaetigung';
    if (haelfte !== 'beide' && hf !== haelfte) continue;

    /* Merkmal und Folgerendite je Wert, beides nur aus dieser Zeitachse. */
    var kandidaten = [];
    for (var si = 0; si < syms.length; si++) {
      var s = syms[si], b = U[s], im = IDX[s];
      var i = im.get(ms), iE = im.get(msEnde);
      if (i == null || iE == null) continue;
      var von = i - RUECKBLICK - LUECKE, bis = i - LUECKE;
      if (von < 0) continue;
      var a = b[von][1], m2 = b[bis][1], p0 = b[i][1], p1 = b[iE][1];
      if (!(a > 0) || !(m2 > 0) || !(p0 > 0) || !(p1 > 0)) continue;
      kandidaten.push({ sym: s, staerke: m2 / a - 1, folge: p1 / p0 - 1 });
    }
    if (kandidaten.length < MINDEST_WERTE) continue;

    kandidaten.sort(function (x, y) { return y.staerke - x.staerke; });
    var n = Math.max(1, Math.round(kandidaten.length * ANTEIL));
    var korb = kandidaten.slice(0, n);

    var mKorb = 0; korb.forEach(function (k) { mKorb += k.folge; }); mKorb /= korb.length;
    var mAlle = 0; kandidaten.forEach(function (k) { mAlle += k.folge; }); mAlle /= kandidaten.length;

    perioden.push({ tag: tagVon(ms), hf: hf, n: kandidaten.length, korb: korb.length,
                    korbRendite: mKorb, marktRendite: mAlle, ueberschuss: mKorb - mAlle });
  }
  return perioden;
}

/* ---------- Statistik: gewoehnlich, weil nichts ueberlappt ---------- */
function statistik(werte) {
  var n = werte.length;
  if (n < 3) return null;
  var m = 0; werte.forEach(function (x) { m += x; }); m /= n;
  var v = 0; werte.forEach(function (x) { v += (x - m) * (x - m); }); v /= (n - 1);
  var se = Math.sqrt(v / n);
  return { n: n, mittel: m, sd: Math.sqrt(v), se: se, t: se > 0 ? m / se : null };
}

/* ---------- Ausgabe ---------- */
var pp = function (x) { return x == null ? '–' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(3)); };

console.log('MOMENTUM OHNE UEBERLAPPUNG — Haelfte: ' + arg.haelfte);
console.log(syms.length + ' Werte im Universum, ' + TAGE.length + ' Handelstage, Schnitt ' + SCHNITT);
console.log('Staerkste ' + (ANTEIL * 100) + ' %, Rueckblick ' + RUECKBLICK + ' + Luecke ' + LUECKE +
            ', Haltedauer ' + HALTEN + ', Umschichtung auf festem Kalender.\n');

/* Die vorregistrierte Rasterlage: Phase 0. */
var haupt = laufe(0, arg.haelfte);
var st = statistik(haupt.map(function (p) { return p.ueberschuss; }));
if (!st) { console.log('Zu wenige Perioden.'); process.exit(0); }

console.log('VORREGISTRIERTE RASTERLAGE (Phase 0)');
console.log('  Perioden (unabhaengig):  ' + st.n);
console.log('  Ueberschuss je Periode:  ' + pp(st.mittel) + ' Pp');
console.log('  Streuung je Periode:     ' + pp(st.sd) + ' Pp');
console.log('  Standardfehler:          ' + pp(st.se) + ' Pp');
console.log('  t:                       ' + (st.t == null ? '–' : st.t.toFixed(2)));
console.log('  MDE (2 x se):            ' + pp(2 * st.se) + ' Pp');
console.log('  delta80 (Schwelle 1,96): ' + pp((1.959964 + 0.8416212) * st.se) + ' Pp');

var korbM = 0, marktM = 0;
haupt.forEach(function (p) { korbM += p.korbRendite; marktM += p.marktRendite; });
console.log('  Korb ' + pp(korbM / haupt.length) + ' gegen Markt ' + pp(marktM / haupt.length) + ' Pp je Periode');

/* Die anderen 62 Lagen - Streubild, keine Tests. */
var alle = [];
for (var ph = 0; ph < HALTEN; ph++) {
  var s2 = statistik(laufe(ph, arg.haelfte).map(function (p) { return p.ueberschuss; }));
  if (s2) alle.push({ phase: ph, mittel: s2.mittel, t: s2.t, n: s2.n });
}
alle.sort(function (a, b) { return a.mittel - b.mittel; });
console.log('\nALLE 63 RASTERLAGEN — Streubild, ausdruecklich KEINE Tests');
console.log('  Ueberschuss:  Minimum ' + pp(alle[0].mittel) + '   Median ' +
  pp(alle[Math.floor(alle.length / 2)].mittel) + '   Maximum ' + pp(alle[alle.length - 1].mittel) + ' Pp');
var ts = alle.map(function (a) { return a.t; }).sort(function (a, b) { return a - b; });
console.log('  t:            Minimum ' + ts[0].toFixed(2) + '   Median ' +
  ts[Math.floor(ts.length / 2)].toFixed(2) + '   Maximum ' + ts[ts.length - 1].toFixed(2));
/* g = se(ueberlappend, Newey-West) / se(nicht ueberlappend), je Rasterlage GEPAART.
 * Der Vergleichswert stammt aus dem Protokoll der ueberlappenden Messung und wird als
 * Umgebungsvariable hereingegeben, damit dieses Werkzeug ihn nicht selbst waehlt. */
var SE_UEBER = process.env.MD_SE_UEBERLAPPEND ? Number(process.env.MD_SE_UEBERLAPPEND) : null;
if (SE_UEBER) {
  var gs = alle.map(function (a) { var se = a.t ? Math.abs(a.mittel / a.t) : null; return se ? SE_UEBER / (se * 100) : null; })
               .filter(function (x) { return x != null; }).sort(function (x, y) { return x - y; });
  var g0se = Math.abs(st.mittel / st.t) * 100;
  console.log('\nENDPUNKT g = se(ueberlappend) / se(nicht ueberlappend)');
  console.log('  Vergleichswert se(ueberlappend): ' + SE_UEBER.toFixed(4) + ' Pp (aus dem Protokoll)');
  console.log('  g bei der vorregistrierten Phase 0: ' + (SE_UEBER / g0se).toFixed(3));
  console.log('  ueber alle Lagen:  Minimum ' + gs[0].toFixed(3) + '   Median ' + gs[Math.floor(gs.length/2)].toFixed(3) + '   Maximum ' + gs[gs.length-1].toFixed(3));
}
var ueber = alle.filter(function (a) { return a.t >= 1.96; }).length;
console.log('  ' + ueber + ' von ' + alle.length + ' Lagen haetten fuer sich genommen t >= 1,96 -');
console.log('  genau deshalb ist die Lage VORAB festgelegt und nicht ausgesucht.');
