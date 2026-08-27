'use strict';
/* Analytiker 27.08.2026: gegenlaeufige Sprungpaare im Tagesarchiv finden.
 * Die QS zaehlte 141 (9 im 60m-Fenster, 132 ausserhalb); ihr Werkzeug und ihre
 * Schwellen sind nicht abgelegt. Deshalb EIGENE, offengelegte Definition:
 *   Sprung  = Tagesschluss-Verhaeltnis r mit |log2 r| >= LOG2MIN
 *   Paar    = zwei Spruenge derselben Reihe mit entgegengesetztem Vorzeichen,
 *             der zweite hoechstens FENSTER Handelstage nach dem ersten,
 *             und die Faktoren heben sich grob auf (Produkt in [1/TOL, TOL]).
 *   Jeder Sprung gehoert zu hoechstens einem Paar (gierig, zeitlich sortiert).
 * Kalibrierung: LOG2MIN/FENSTER/TOL werden ueber eine kleine Tabelle berichtet,
 * damit sichtbar ist, wie nah die eigene Definition an der QS-Zahl liegt.
 * NUR LESEN. */
var fs = require('fs'), path = require('path');
var D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var GRENZE60M = '2024-08-27';   // aelteste 60m-Abdeckung (~730 Tage rollend)

var dateien = fs.readdirSync(D).filter(function (f) { return /^bars_1d_.*\.json$/.test(f); });

function finde(LOG2MIN, FENSTER, TOL) {
  var paare = [];
  dateien.forEach(function (f) {
    var j; try { j = JSON.parse(fs.readFileSync(path.join(D, f), 'utf8')); } catch (e) { return; }
    var s = j.series; if (!Array.isArray(s) || s.length < 5) return;
    var sym = j.sym || f.replace(/^bars_1d_|\.json$/g, '');
    var spruenge = [];
    for (var i = 1; i < s.length; i++) {
      var a = s[i - 1][1], b = s[i][1];
      if (!(a > 0) || !(b > 0)) continue;
      var l = Math.log2(b / a);
      if (Math.abs(l) >= LOG2MIN) spruenge.push({ i: i, d: new Date(s[i][0]).toISOString().slice(0, 10), l: l, r: b / a });
    }
    var benutzt = {};
    for (var p = 0; p < spruenge.length; p++) {
      if (benutzt[p]) continue;
      for (var q = p + 1; q < spruenge.length; q++) {
        if (benutzt[q]) continue;
        var A = spruenge[p], B = spruenge[q];
        if (B.i - A.i > FENSTER) break;
        if (A.l * B.l >= 0) continue;
        var prod = Math.abs(A.l + B.l);           // log-Summe ~0 = Faktoren heben sich auf
        if (Math.pow(2, prod) > TOL) continue;
        benutzt[p] = benutzt[q] = 1;
        paare.push({ sym: sym, d1: A.d, r1: A.r, d2: B.d, r2: B.r, tage: B.i - A.i });
        break;
      }
    }
  });
  return paare;
}

/* Kalibrierungstabelle */
console.log('LOG2MIN  FENSTER  TOL   Paare  im60mFenster  ausserhalb');
[[0.9, 250, 1.35], [1.0, 250, 1.35], [0.9, 120, 1.35], [1.0, 120, 1.25], [0.85, 250, 1.5], [1.0, 500, 1.35]].forEach(function (k) {
  var p = finde(k[0], k[1], k[2]);
  var im = p.filter(function (x) { return x.d1 >= GRENZE60M; }).length;
  console.log(String(k[0]).padEnd(8) + String(k[1]).padEnd(8) + String(k[2]).padEnd(5) + ' ' +
    String(p.length).padStart(5) + '  ' + String(im).padStart(8) + '  ' + String(p.length - im).padStart(8));
});
