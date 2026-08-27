'use strict';
/* Tueftler, 27.08.2026 - Machbarkeit von "Weg 3" der Ueberlebensluecke.
 *
 * HINTERGRUND. Am 26.08. habe ich die Luecke beziffert (>= 12,7 % des Querschnitts,
 * ausschliesslich Nicht-Ueberlebende) und drei Wege vorgeschlagen. Weg 3 lautet:
 * auf den bereits beschafften 1.164 Verschwundenen die RICHTUNG der Verzerrung
 * messen. Ich habe damals selbst hingeschrieben, ob zwei Jahre dafuer reichen,
 * gehoere VOR den Lauf gerechnet. Das ist diese Rechnung.
 *
 * ES WIRD NICHTS GEMESSEN. Gezaehlt werden Tage, Reihen und Streuungen - die
 * Groessen, aus denen die Aufloesung folgt. Der MITTELWERT der Differenzreihe,
 * also die Antwort selbst, wird nie ausgegeben: die berichtete Streuung kommt aus
 * den ERSTEN DIFFERENZEN, sd(d_t - d_t-1)/sqrt(2), und die sind mittelwertfrei.
 * Zum Vergleich laeuft die gewoehnliche Streuung mit (sie braucht den Mittelwert
 * intern, gibt ihn aber nicht aus); stehen beide dicht beieinander, ist die Reihe
 * seriell unauffaellig und der erste Schaetzer belastbar.
 *
 * Konventionen wie in zaehle-nachtstoss.js: Art CS/ADRC, Umsatzschnitt 5 Mio $,
 * reiheKaputt, letzte Kerze weg (#85) - beide Seiten gleich behandelt.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var ARCHIV = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var UMSATZ_MIN = 5e6;
var BREITE_MIN = 20;
var T_KRIT = 2.2414;
var Z80 = 0.8416;

var ARTEN = (function () {
  try {
    var j = JSON.parse(fs.readFileSync(path.join(DATEN, 'wertpapierarten.json'), 'utf8'));
    if (j && j.arten && Object.keys(j.arten).length > 1000) return j.arten;
  } catch (e) {}
  return null;
})();
function artVon(sym) {
  if (!ARTEN) return null;
  return ARTEN[sym] || ARTEN[sym.replace(/-/g, '.')] || null;
}
function istAktieArchiv(sym) {
  if (sym.indexOf('-USD') !== -1) return false;
  if (!ARTEN) return true;
  var a = artVon(sym);
  return a === 'CS' || a === 'ADRC';
}
function reiheKaputt(bars, iKurs) {
  var maxKurs = 0;
  for (var i = 0; i < bars.length; i++) {
    var c = bars[i][iKurs];
    if (c > maxKurs) maxKurs = c;
    if (i > 0) {
      var v = bars[i - 1][iKurs];
      if (v > 0 && c > 0) { var r = c / v - 1; if (r > 4 || r < -0.8) return 'Sprung'; }
    }
  }
  return maxKurs > 100000 ? 'Kurs' : null;
}
function sd(a) {
  var n = a.length; if (n < 2) return NaN;
  var m = 0, i; for (i = 0; i < n; i++) m += a[i]; m /= n;
  var s = 0; for (i = 0; i < n; i++) { var d = a[i] - m; s += d * d; }
  return Math.sqrt(s / (n - 1));
}
/* Mittelwertfreie Streuung: die erste Differenz loescht jede Verschiebung.
 * Bewusst OHNE Mittelwertabzug auf den Differenzen - der wuerde die Lage
 * teilweise zurueckholen. */
function sdErsteDifferenz(a) {
  if (a.length < 3) return NaN;
  var s = 0, m = 0;
  for (var i = 1; i < a.length; i++) { var d = a[i] - a[i - 1]; s += d * d; m++; }
  return Math.sqrt(s / m / 2);
}
function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }
function mittel(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
function med(a) { var b = a.slice().sort(function (x, y) { return x - y; }); return b[Math.floor(b.length / 2)]; }

/* ---------- 1. Verschwundene ---------- */
var tdOrdner = path.join(DATEN, 'tagesdaten');
var tdDateien = fs.readdirSync(tdOrdner).filter(function (f) { return f.slice(-5) === '.json'; });

/* ---------- 2. Ueberlebensarchiv ---------- */
var archivDateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
var archivSym = {};
archivDateien.forEach(function (f) { archivSym[f.slice(8, -5)] = f; });

var JETZT = Date.parse(process.env.HEUTE || '2026-08-27T00:00:00Z');
var FENSTER_TAGE = 730;
var randTag = tag(JETZT - FENSTER_TAGE * 86400000);

var tageS = {};
var symbolS = 0, verworfenS = 0;
var archivLetzterTag = {};
for (var ai = 0; ai < archivDateien.length; ai++) {
  var symA = archivDateien[ai].slice(8, -5);
  if (!istAktieArchiv(symA)) continue;
  var jA;
  try { jA = JSON.parse(fs.readFileSync(path.join(ARCHIV, archivDateien[ai]), 'utf8')); } catch (e) { continue; }
  var bA = jA.bars || jA.series || [];
  if (bA.length < 100) { verworfenS++; continue; }
  bA = bA.slice(0, bA.length - 1);
  if (reiheKaputt(bA, 1)) { verworfenS++; continue; }
  symbolS++;
  archivLetzterTag[symA] = tag(bA[bA.length - 1][0]);
  for (var i = 1; i < bA.length; i++) {
    var c = bA[i][1], cv = bA[i - 1][1], vol = bA[i][2] || 0;
    if (!(c > 0) || !(cv > 0)) continue;
    if (!(c * vol >= UMSATZ_MIN)) continue;
    var t = tag(bA[i][0]);
    if (t < '2024-08-23') continue;
    (tageS[t] || (tageS[t] = [])).push(c / cv - 1);
  }
}

/* ---------- 3. Querschnitt der Verschwundenen + Falsch-Positive ---------- */
var tageV = {};
var symbolV = 0, verworfenV = 0, ohneArt = 0, falschPositiv = [];
var kerzenGesamt = 0, kerzenVorRand = 0, monat = {};
for (var vi = 0; vi < tdDateien.length; vi++) {
  var jV;
  try { jV = JSON.parse(fs.readFileSync(path.join(tdOrdner, tdDateien[vi]), 'utf8')); } catch (e) { continue; }
  var symV = jV.sym;
  var bV = jV.series || [];
  kerzenGesamt += bV.length;
  for (var q = 0; q < bV.length; q++) if (tag(bV[q][0]) < randTag) kerzenVorRand++;
  if (archivSym[symV] && archivLetzterTag[symV] && archivLetzterTag[symV] >= '2026-08-15') {
    falschPositiv.push({ sym: symV, delistetLaut: jV.delistet, archivBis: archivLetzterTag[symV] });
  }
  var aV = artVon(symV);
  if (!aV) ohneArt++;
  if (ARTEN && aV && aV !== 'CS' && aV !== 'ADRC') { verworfenV++; continue; }
  if (bV.length < 20) { verworfenV++; continue; }
  bV = bV.slice(0, bV.length - 1);
  if (reiheKaputt(bV, 1)) { verworfenV++; continue; }
  symbolV++;
  for (var k = 1; k < bV.length; k++) {
    var cV = bV[k][1], cvV = bV[k - 1][1], volV = bV[k][2] || 0;
    if (!(cV > 0) || !(cvV > 0)) continue;
    if (!(cV * volV >= UMSATZ_MIN)) continue;
    var tV = tag(bV[k][0]);
    (tageV[tV] || (tageV[tV] = [])).push(cV / cvV - 1);
    monat[tV.slice(0, 7)] = (monat[tV.slice(0, 7)] || 0) + 1;
  }
}

/* ---------- 4. Differenzreihe ---------- */
var tageAlle = Object.keys(tageS).sort();
var diff = [], anteil = [], nS = [], nV = [], tageOhneV = 0;
for (var d = 0; d < tageAlle.length; d++) {
  var T = tageAlle[d];
  var S = tageS[T], V = tageV[T] || [];
  if (S.length < BREITE_MIN) continue;
  if (!V.length) { tageOhneV++; continue; }
  var f = V.length / (V.length + S.length);
  diff.push(f * (mittel(V) - mittel(S)) * 100);
  anteil.push(f); nS.push(S.length); nV.push(V.length);
}

var sdFD = sdErsteDifferenz(diff);
var sdGew = sd(diff);
var N = diff.length;
var se = sdFD / Math.sqrt(N);
var delta80 = (T_KRIT + Z80) * se;
function noetig(x) { return Math.ceil(Math.pow((T_KRIT + Z80) * sdFD / x, 2)); }
function r5(x) { return Math.round(x * 1e5) / 1e5; }

var out = {
  erzeugt: new Date().toISOString(),
  frage: 'Reichen die beschafften Verschwundenen, um die RICHTUNG der Ueberlebensverzerrung zu entscheiden?',
  hinweis: 'Zaehlung und Streuung, keine Messung. Der Mittelwert der Differenzreihe wird nicht ausgegeben.',
  fenster: { randTagHeute: randTag, rollendeTage: FENSTER_TAGE },
  archiv: { pfad: ARCHIV, reihenGenutzt: symbolS, reihenVerworfen: verworfenS },
  verschwundene: {
    dateien: tdDateien.length, kerzenGesamt: kerzenGesamt,
    kerzenSchonAusDemFenster: kerzenVorRand,
    reihenGenutzt: symbolV, reihenVerworfen: verworfenV, ohneArtEintrag: ohneArt,
    falschPositivAnzahl: falschPositiv.length,
    falschPositiv: falschPositiv.sort(function (a, b) { return a.sym < b.sym ? -1 : 1; })
  },
  querschnitt: {
    handelstageMitBeidenSeiten: N,
    tageOhneVerschwundene: tageOhneV,
    anteilVerschwundeneMedian_Prozent: Math.round(med(anteil) * 10000) / 100,
    anteilVerschwundeneMax_Prozent: Math.round(Math.max.apply(null, anteil) * 10000) / 100,
    breiteUeberlebendeMedian: med(nS),
    breiteVerschwundeneMedian: med(nV)
  },
  aufloesung_schlussZuSchluss: {
    sigmaDifferenzreihe_Pp_ersteDifferenz: r5(sdFD),
    sigmaDifferenzreihe_Pp_gewoehnlich: r5(sdGew),
    se_Pp: r5(se),
    delta80_Pp: r5(delta80),
    vorhandeneHandelstage: N,
    noetigeHandelstage_fuer_0_04Pp: noetig(0.04),
    noetigeHandelstage_fuer_0_10Pp: noetig(0.10)
  },
  monatsbelegung: monat
};
var ziel = path.join(__dirname, '..', 'daten', 'zaehlung-lueckenfenster-2026-08-27.json');
fs.writeFileSync(ziel, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
console.log('geschrieben: ' + ziel);
