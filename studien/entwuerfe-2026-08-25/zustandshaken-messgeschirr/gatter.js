'use strict';
/* Drei Gatter auf derselben Tagesreihe:
 *   ECHT      - die Pausentage des simulierten Edge-Waechters
 *   ZUKUNFT   - ein Gatter mit Vorgriff (pausiert genau die schlechten Tage)  -> positive Kontrolle
 *   PLACEBO   - ein Gatter ohne jeden Ergebnisbezug, gleiche Pausenquote,
 *               gleiche Episodenlaenge, nur verschoben                       -> Nullpunkt
 * Endpunkt jeweils: die GEPAARTE Tagesdifferenz gated - ungated.
 * Zusaetzlich: Standardfehler ueber EPISODEN statt ueber Tage. */
var fs = require('fs');
var MM = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/messmaschine/messmaschine.js');
var R = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
var SIM = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
var H = 8;
var schwelle = MM._intern.bonferroniSchwelle(1);
var schnitt = R.schnittTag;

var pauseTag = {};
SIM.protokoll.forEach(function (p) { if (p.pauseAktiv) pauseTag[p.tag] = 1; });

function st(werte, lags) {
  var s = MM._intern.statistik(werte, lags == null ? H - 1 : lags);
  s.d80 = s.se > 0 ? (schwelle + MM.VERFAHREN.zPower80) * s.se : null;
  return s;
}
function zeile(name, s, extra) {
  console.log('  ' + name.padEnd(22) + ' n ' + String(s.n).padStart(4) +
    ' | Mittel ' + (s.mittel * 100).toFixed(4).padStart(9) + ' Pp' +
    ' | se ' + (s.se * 100).toFixed(4).padStart(8) +
    ' | MDE ' + (s.mde * 100).toFixed(4).padStart(8) +
    ' | d80 ' + (s.d80 * 100).toFixed(4).padStart(8) +
    ' | t ' + (s.t != null ? s.t.toFixed(2).padStart(6) : '     -') + (extra || ''));
}

/* Episoden aus einer Maske ueber die Handelstage der Bestaetigungshaelfte. */
function episoden(tage, maske) {
  var ep = [], lauf = null;
  tage.forEach(function (t, k) {
    if (maske[t]) { if (!lauf) lauf = { von: t, bis: t, tage: 0 }; lauf.bis = t; lauf.tage++; }
    else if (lauf) { ep.push(lauf); lauf = null; }
  });
  if (lauf) ep.push(lauf);
  return ep;
}

function auswerten(titel, reihe) {
  var idxB = [];
  reihe.tage.forEach(function (t, k) { if (t >= schnitt) idxB.push(k); });
  var tageB = idxB.map(function (k) { return reihe.tage[k]; });
  var werteB = idxB.map(function (k) { return reihe.mittel[k]; });
  var N = tageB.length;
  console.log('\n########## ' + titel + '  (' + N + ' Bestaetigungstage mit Signal) ##########');
  zeile('UNGATED', st(werteB));

  function gatter(name, maske, lags) {
    var diff = tageB.map(function (t, k) { return maske[t] ? -werteB[k] : 0; });
    var nnz = diff.filter(function (x) { return x !== 0; }).length;
    var s = st(diff, lags);
    var ep = episoden(tageB, maske);
    zeile(name, s, '  | ' + nnz + ' Tage in ' + ep.length + ' Episoden [' + ep.map(function (e) { return e.tage; }).join(',') + ']');
    return { s: s, diff: diff, ep: ep, nnz: nnz };
  }

  /* --- ECHT --- */
  var echt = gatter('ECHT (Waechter)', pauseTag);

  /* Standardfehler ueber EPISODEN: jede Episode ein Block, dazwischen Nullen.
   * Ein Block ist die kleinste Einheit, die unabhaengig wiederholt werden koennte -
   * innerhalb einer Episode ist die Entscheidung dieselbe, nicht 20 neue. */
  var epSummen = echt.ep.map(function (e) {
    var s = 0;
    tageB.forEach(function (t, k) { if (t >= e.von && t <= e.bis && pauseTag[t]) s += echt.diff[k]; });
    return s / N;   // Beitrag dieser Episode zum Gesamtmittel
  });
  console.log('  Episoden-Beitraege zum Mittel (Pp): ' + epSummen.map(function (x) { return (x * 100).toFixed(4); }).join(' | '));
  if (epSummen.length >= 2) {
    var m = epSummen.reduce(function (a, b) { return a + b; }, 0);
    var mu = m / epSummen.length;
    var va = epSummen.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / (epSummen.length - 1);
    var seEp = Math.sqrt(va * epSummen.length) ;   // se der SUMME ueber Episoden
    console.log('  Ueber EPISODEN gerechnet: Summe ' + (m * 100).toFixed(4) + ' Pp, se ' + (seEp * 100).toFixed(4) +
      ' Pp, t ' + (seEp > 0 ? (m / seEp).toFixed(2) : '-') + '  (Freiheitsgrade: ' + (epSummen.length - 1) + ')');
  } else {
    console.log('  Ueber EPISODEN: nur ' + epSummen.length + ' Episode - kein Standardfehler schaetzbar.');
  }

  /* --- ZUKUNFT: pausiert genau die Tage mit negativem Ueberschuss (Vorgriff) --- */
  var zMaske = {};
  tageB.forEach(function (t, k) { if (werteB[k] < 0) zMaske[t] = 1; });
  gatter('ZUKUNFT (Vorgriff)', zMaske);

  /* --- ZUKUNFT-SCHWACH: nur so viele Tage wie der echte Waechter, die schlechtesten --- */
  var ord = tageB.map(function (t, k) { return { t: t, w: werteB[k] }; }).sort(function (a, b) { return a.w - b.w; });
  var zsMaske = {};
  var zielN = echt.nnz;
  for (var q = 0; q < zielN && q < ord.length; q++) zsMaske[ord[q].t] = 1;
  gatter('ZUKUNFT (nur ' + zielN + ' Tage)', zsMaske);

  /* --- PLACEBO: dieselben Episodenlaengen, aber an anderer Stelle. Jede
   * moegliche Verschiebung einmal - das ist die Nullverteilung des Endpunkts. --- */
  var laengen = echt.ep.map(function (e) { return e.tage; });
  var werte = [];
  for (var v = 1; v < N; v++) {
    var pm = {};
    var pos = 0;
    /* Startpunkte der echten Episoden um v Tage verschoben (zyklisch). */
    echt.ep.forEach(function (e) {
      var start = tageB.indexOf(e.von);
      for (var q2 = 0; q2 < e.tage; q2++) pm[tageB[(start + v + q2) % N]] = 1;
    });
    var d = tageB.map(function (t, k) { return pm[t] ? -werteB[k] : 0; });
    var mu2 = d.reduce(function (a, b) { return a + b; }, 0) / N;
    werte.push(mu2);
  }
  werte.sort(function (a, b) { return a - b; });
  function qtl(p) { return werte[Math.min(werte.length - 1, Math.floor(p * werte.length))]; }
  var echtMittel = echt.s.mittel;
  var extremer = werte.filter(function (x) { return Math.abs(x) >= Math.abs(echtMittel); }).length;
  console.log('  PLACEBO-Gatter (' + werte.length + ' Verschiebungen, gleiche Episodenlaengen):');
  console.log('    Nullverteilung des Endpunkts (Pp): 5% ' + (qtl(0.05) * 100).toFixed(4) +
    ' | Median ' + (qtl(0.5) * 100).toFixed(4) + ' | 95% ' + (qtl(0.95) * 100).toFixed(4) +
    ' | min ' + (werte[0] * 100).toFixed(4) + ' | max ' + (werte[werte.length - 1] * 100).toFixed(4));
  console.log('    Streuung der Nullverteilung: se_empirisch ' +
    (Math.sqrt(werte.reduce(function (a, b) { return a + b * b; }, 0) / werte.length -
      Math.pow(werte.reduce(function (a, b) { return a + b; }, 0) / werte.length, 2)) * 100).toFixed(4) + ' Pp');
  console.log('    Der ECHTE Wert (' + (echtMittel * 100).toFixed(4) + ' Pp) wird von ' + extremer +
    ' von ' + werte.length + ' Verschiebungen betragsmaessig erreicht oder uebertroffen  ->  p = ' +
    (extremer / werte.length).toFixed(3));
}

auswerten('LIVE-UNIVERSUM (' + R.universumLive + ' Werte - was der Waechter wirklich gatet)', R.live);
auswerten('GANZES ARCHIV (' + R.universumAlle + ' Werte)', R.alle);
