'use strict';
/* WEG 3 DER UEBERLEBENSLUECKE - unbedingte Richtung, Schluss-zu-Schluss.
 * Werkzeug zur VORREGISTRIERUNG.md (Commit 27db7db + Nachtrag 7) in diesem Ordner.
 *
 * Spiegelt die Konventionen von studien/tueftler/werkzeug/zaehle-lueckenfenster.js
 * EXAKT (CS/ADRC, Umsatzschnitt 5 Mio $ je Beobachtung, reiheKaputt, letzte Kerze
 * weg (#85), Ueberlebende >=100 Kerzen, Verschwundene >=20, BREITE_MIN 20,
 * Tage ab 2024-08-23) - dieselben Ladepfade, dieselbe Differenzreihe:
 *   d_t = f_t * (Mittel_V - Mittel_S) * 100   (ANTEILS-GEWICHTET, Nachtrag 7)
 * Streuung primaer aus ersten Differenzen (mittelwertfrei), gewoehnlich als Gegenprobe.
 *
 * Ablauf: Klassifizierungs-Waechter -> Wachhund(1d) -> W1 Kunstinjektion ->
 * W2b Maschinen-Null -> (nur mit --kohorte:) der eine echte Lauf.
 * Waechter-Modus liest von den Verschwundenen nur Metadaten/Filterzaehlung.
 */
var fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');

var REPO = 'C:/Users/Wilhe/Downloads/Stock-Dashboard';
var ARCHIV = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var HIER = __dirname;
var WP = require(REPO + '/studien/messmaschine/strategien/wertpapierart.js');

var UMSATZ_MIN = 5e6, BREITE_MIN = 20, START_TAG = '2024-08-23';
var T_KRIT = 2.2414, Z80 = 0.8416;        /* Familie ueberlebensluecke-wege, 2 Tests */
var SEED = 20260827;
var W1_N = 200, W1_SHIFT = -0.0005;       /* -0,05 Pp je Tag, ~6x delta80 */
var W2B_ZIEHUNGEN = 200;

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }
function mittel(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
function sd(a) { var n = a.length; if (n < 2) return NaN; var m = mittel(a), s = 0; for (var i = 0; i < n; i++) { var d = a[i] - m; s += d * d; } return Math.sqrt(s / (n - 1)); }
function sdErsteDifferenz(a) { if (a.length < 3) return NaN; var s = 0, m = 0; for (var i = 1; i < a.length; i++) { var d = a[i] - a[i - 1]; s += d * d; m++; } return Math.sqrt(s / m / 2); }
function reiheKaputt(bars, iKurs) {
  var maxKurs = 0;
  for (var i = 0; i < bars.length; i++) {
    var c = bars[i][iKurs];
    if (c > maxKurs) maxKurs = c;
    if (i > 0) { var v = bars[i - 1][iKurs]; if (v > 0 && c > 0) { var r = c / v - 1; if (r > 4 || r < -0.8) return 'Sprung'; } }
  }
  return maxKurs > 100000 ? 'Kurs' : null;
}
function pp(x) { return x == null || isNaN(x) ? '-' : ((x >= 0 ? '+' : '') + x.toFixed(4)); }

function wachhundOk() {
  var r = cp.spawnSync(process.execPath, [REPO + '/tools/archiv-wachhund.js', 'archiv1d'], { encoding: 'utf8', timeout: 300000 });
  console.log('[Wachhund archiv1d] Exit ' + r.status);
  if (r.status !== 0) { console.error('ABBRUCH: Wachhund Exit ' + r.status + '.'); return false; }
  return true;
}

/* ---------- Ueberlebende laden: Tagesrenditen je Tag (wie Zaehlung, Reihen behalten) ---------- */
function ladeUeberlebende() {
  var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
  var reihen = {}, zaehl = { genutzt: 0, verworfen: 0 };
  dateien.forEach(function (f) {
    var sym = f.slice(8, -5);
    if (!WP.istAktie(sym)) return;
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); } catch (e) { return; }
    var b = j.bars || j.series || [];
    if (b.length < 100) { zaehl.verworfen++; return; }
    b = b.slice(0, b.length - 1);                     /* #85: letzte Kerze weg */
    if (reiheKaputt(b, 1)) { zaehl.verworfen++; return; }
    zaehl.genutzt++;
    var beob = [];                                    /* [{t, r}] nur gueltige Beobachtungen */
    for (var i = 1; i < b.length; i++) {
      var c = b[i][1], cv = b[i - 1][1], vol = b[i][2] || 0;
      if (!(c > 0) || !(cv > 0)) continue;
      if (!(c * vol >= UMSATZ_MIN)) continue;
      var t = tag(b[i][0]);
      if (t < START_TAG) continue;
      beob.push({ t: t, r: c / cv - 1 });
    }
    if (beob.length) reihen[sym] = beob;
  });
  return { reihen: reihen, zaehl: zaehl };
}
function tageAus(reihenListe, shiftJeTag) {
  var tage = {};
  reihenListe.forEach(function (beob) {
    beob.forEach(function (x) { (tage[x.t] || (tage[x.t] = [])).push(shiftJeTag ? x.r + shiftJeTag : x.r); });
  });
  return tage;
}
/* ---------- Differenzreihe (exakt Zeile 149-158 der Zaehlung) ---------- */
function differenzreihe(tageS, tageV) {
  var alle = Object.keys(tageS).sort();
  var diff = [], anteil = [], roh = [], tageOhneV = 0, datum = [];
  for (var d = 0; d < alle.length; d++) {
    var T = alle[d], S = tageS[T], V = tageV[T] || [];
    if (S.length < BREITE_MIN) continue;
    if (!V.length) { tageOhneV++; continue; }
    var f = V.length / (V.length + S.length);
    diff.push(f * (mittel(V) - mittel(S)) * 100);
    roh.push((mittel(V) - mittel(S)) * 100);
    anteil.push(f); datum.push(T);
  }
  var sdFD = sdErsteDifferenz(diff), sdGew = sd(diff), N = diff.length;
  var m = N ? mittel(diff) : NaN, se = sdFD / Math.sqrt(N);
  return { mittel: m, mittelRoh: N ? mittel(roh) : NaN, sdFD: sdFD, sdGew: sdGew, se: se,
           t: se > 0 ? m / se : NaN, N: N, tageOhneV: tageOhneV, fMittel: N ? mittel(anteil) : NaN,
           delta80: (T_KRIT + Z80) * se };
}
function druckeBlock(name, E, stempel) {
  console.log(name + (stempel ? '  [' + stempel + ']' : ''));
  console.log('  Paartage ' + E.N + ' (ohne V: ' + E.tageOhneV + ')   c_gew ' + pp(E.mittel) + ' Pp   se ' + pp(E.se) +
    '   t ' + (isNaN(E.t) ? '-' : E.t.toFixed(2)) + '   delta80 ' + pp(E.delta80) +
    '   sigma FD/gew ' + pp(E.sdFD) + '/' + pp(E.sdGew) + '   f-Mittel ' + (100 * E.fMittel).toFixed(2) + ' %' +
    '   c_roh ' + pp(E.mittelRoh) + ' Pp');
}

/* ================= Ablauf ================= */
var modus = process.argv.indexOf('--kohorte') >= 0 ? 'kohorte' : 'waechter';
console.log('== messe-weg3 ==  Modus ' + modus + '  Familie ueberlebensluecke-wege (2 Tests, |t|>=' + T_KRIT + ')  Seed ' + SEED);
if (!WP.klassifizierungDa()) { console.error('ABBRUCH: Klassifizierung fehlt - Universum waere ungefiltert.'); process.exit(2); }
if (!wachhundOk()) process.exit(2);

console.log('Lade Ueberlebende ...');
var U = ladeUeberlebende();
var uSyms = Object.keys(U.reihen);
console.log('Ueberlebende: ' + U.zaehl.genutzt + ' genutzt, ' + U.zaehl.verworfen + ' verworfen, mit Beobachtungen: ' + uSyms.length);

/* ---------- W1: Kunstinjektion (Positivkontrolle) ---------- */
console.log('\n-- W1 Kunstinjektion (' + W1_N + ' Pseudo-Verschwundene, Shift ' + (W1_SHIFT * 100).toFixed(2) + ' Pp/Tag) --');
var rnd = mulberry32(SEED);
var gemischt = uSyms.slice();
for (var i = gemischt.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t0 = gemischt[i]; gemischt[i] = gemischt[j]; gemischt[j] = t0; }
var markiert = gemischt.slice(0, W1_N), markiertSet = {};
markiert.forEach(function (s) { markiertSet[s] = 1; });
var tageS_rest = tageAus(uSyms.filter(function (s) { return !markiertSet[s]; }).map(function (s) { return U.reihen[s]; }));
var tageV_kunst = tageAus(markiert.map(function (s) { return U.reihen[s]; }), W1_SHIFT);
var Ek = differenzreihe(tageS_rest, tageV_kunst);
/* Sollwert exakt: je Paartag f_t * W1_SHIFT * 100; ohne Blick auf c: aus f-Reihe der Kunstrechnung */
var soll = Ek.fMittel * W1_SHIFT * 100;
var verh = Ek.mittel / soll;
var w1ok = soll < 0 && Ek.mittel < 0 && verh >= 0.7 && verh <= 1.3;
console.log('Sollwert ' + pp(soll) + ' Pp   gemessen ' + pp(Ek.mittel) + '   Verhaeltnis ' + verh.toFixed(3) +
  '   (t ' + Ek.t.toFixed(2) + ', Paartage ' + Ek.N + ')  -> ' + (w1ok ? 'BESTANDEN' : 'VERFEHLT'));
console.log('  (W1 prueft die Differenz-Arithmetik samt Gewichtung, nicht die Kohortenauswahl.)');

/* ---------- W2b: Maschinen-Null (zwei identisch gezogene Pseudo-Arme) ---------- */
console.log('\n-- W2b Maschinen-Null (' + W2B_ZIEHUNGEN + ' Ziehungen) --');
var rnd2 = mulberry32(SEED + 1);
var cZieh = [];
for (var z = 0; z < W2B_ZIEHUNGEN; z++) {
  var misch = uSyms.slice();
  for (var a = misch.length - 1; a > 0; a--) { var b2 = Math.floor(rnd2() * (a + 1)); var t1 = misch[a]; misch[a] = misch[b2]; misch[b2] = t1; }
  var armA = misch.slice(0, W1_N), armB = misch.slice(W1_N, 2 * W1_N);
  var tA = tageAus(armA.map(function (s) { return U.reihen[s]; }));
  var tB = tageAus(armB.map(function (s) { return U.reihen[s]; }));
  var E2 = differenzreihe(tB, tA);   /* A als Pseudo-V gegen B als Pseudo-S: beide gleich gebaut */
  if (!isNaN(E2.mittel)) cZieh.push(E2.mittel);
  if ((z + 1) % 50 === 0) console.log('  Ziehung ' + (z + 1) + '/' + W2B_ZIEHUNGEN);
}
var mZ = mittel(cZieh), sdZ = sd(cZieh), grenze = (T_KRIT + Z80) * sdZ / 4;
var w2ok = Math.abs(mZ) < grenze;
console.log('Mittel ' + pp(mZ) + ' Pp  sd ' + pp(sdZ) + '  Grenze ' + pp(grenze) + '  -> ' + (w2ok ? 'BESTANDEN' : 'VERFEHLT'));

var waechter = { gemessenAm: new Date().toISOString(), seed: SEED, ueberlebende: U.zaehl,
  W1: { soll: soll, gemessen: Ek.mittel, verhaeltnis: verh, t: Ek.t, N: Ek.N, bestanden: w1ok },
  W2b: { mittel: mZ, sd: sdZ, grenze: grenze, ziehungen: cZieh.length, bestanden: w2ok } };
fs.writeFileSync(path.join(HIER, 'waechter-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'), JSON.stringify(waechter, null, 1));
if (!w1ok || !w2ok) { console.error('\nWaechter VERFEHLT - kein Kohortenlauf.'); process.exit(3); }
console.log('\nWaechter gruen.');
if (modus !== 'kohorte') { console.log('Kohortenlauf erst mit --kohorte nach PM-Rueckmeldung.'); process.exit(0); }

/* ================= KOHORTE (ein Lauf) ================= */
console.log('\n== KOHORTE ==');
var tdOrdner = path.join(DATEN, 'tagesdaten');
var tdDateien = fs.readdirSync(tdOrdner).filter(function (f) { return f.slice(-5) === '.json'; });
var tageV = {}, zV = { genutzt: 0, verworfen: 0 };
tdDateien.forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(path.join(tdOrdner, f), 'utf8')); } catch (e) { return; }
  var sym = j.sym, b = j.series || [];
  if (!WP.istAktie(sym)) { zV.verworfen++; return; }
  if (b.length < 20) { zV.verworfen++; return; }
  /* Guertel und Hosentraeger (Nachtrag 7.3): Kerzen nach delistet+1 fallen - redundant zum Umsatzschnitt */
  if (j.delistet) { var ende = b.length - 1, cut = 0; while (ende > 0 && tag(b[ende][0]) > j.delistet) { ende--; cut++; } if (cut > 1) b = b.slice(0, ende + 2); }
  b = b.slice(0, b.length - 1);                        /* #85 */
  if (reiheKaputt(b, 1)) { zV.verworfen++; return; }
  zV.genutzt++;
  for (var k = 1; k < b.length; k++) {
    var c = b[k][1], cv = b[k - 1][1], vol = b[k][2] || 0;
    if (!(c > 0) || !(cv > 0)) continue;
    if (!(c * vol >= UMSATZ_MIN)) continue;
    (tageV[tag(b[k][0])] || (tageV[tag(b[k][0])] = [])).push(c / cv - 1);
  }
});
console.log('Verschwundene: ' + zV.genutzt + ' genutzt, ' + zV.verworfen + ' verworfen (von ' + tdDateien.length + ' Dateien)');
var tageS_alle = tageAus(uSyms.map(function (s) { return U.reihen[s]; }));
var E = differenzreihe(tageS_alle, tageV);
druckeBlock('WEG 3 - GEWICHTETE DIFFERENZREIHE (Primaerendpunkt)', E);

var urteil;
if (Math.abs(E.t) >= T_KRIT) urteil = 'Richtung belegt: ' + (E.mittel < 0 ? 'NEGATIV (Archiv beschoenigt)' : 'POSITIV (Archiv untertreibt)');
else if (Math.abs(E.mittel) + 1.645 * E.se < E.delta80) urteil = 'im Fenster ohne messbare Richtung';
else urteil = 'nicht entscheidbar mit diesen Daten';
console.log('\nURTEIL (R1-R3): ' + urteil);
console.log('Nachrichtlich (kein Urteil): c_gew gegen Anker 0,04/0,10 Pp: ' + pp(E.mittel) + ' Pp ist das ' +
  (Math.abs(E.mittel) / 0.04).toFixed(2) + '- bzw. ' + (Math.abs(E.mittel) / 0.10).toFixed(2) + '-fache; ' +
  'GEWICHTETE Groesse (B13-Vermerk), c_roh ' + pp(E.mittelRoh) + ' Pp bei f-Mittel ' + (100 * E.fMittel).toFixed(2) + ' %.');
console.log('Sperrliste: kein Kanten-Urteil, kein E1-Leiserstellen, keine Uebernacht-Aussage, Fenster 2024-08..2026-08, Stichprobe ~' + zV.genutzt + ' von 6.921.');
var lauf = { gemessenAm: new Date().toISOString(), seed: SEED, waechter: waechter, verschwundene: zV,
  ergebnis: E, urteil: urteil, familie: { name: 'ueberlebensluecke-wege', tests: 2, schwelle: T_KRIT } };
fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'), JSON.stringify(lauf, null, 1));
console.log('lauf-<zeit>.json geschrieben.');
