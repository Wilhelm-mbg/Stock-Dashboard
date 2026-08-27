'use strict';
/* WEG 3 DER UEBERLEBENSLUECKE - Familienmitglied 2: UEBERNACHT (Schluss->Eroeffnung).
 * Werkzeug zur VORREGISTRIERUNG.md (+ Nachtrag 1) in diesem Ordner. Datenblind
 * gebaut VOR der 1d-Vollauf-Meldung; AUSGEFUEHRT wird erst danach (Lauf-Gate §6).
 *
 * Konventionen EXAKT wie Mitglied 1 (messe-weg3.js): CS/ADRC, Umsatzschnitt 5 Mio $
 * je Beobachtung, reiheKaputt auf Schluessen, letzte Kerze weg (#85), Ueberlebende
 * >=100 Kerzen, Verschwundene >=20, BREITE_MIN 20, Tage ab 2024-08-23,
 * delistet+1-Beschnitt. Neuer Baustein je Beobachtung (Balken [zeit, schluss,
 * umsatz, hoch, tief, eroeffnung]):
 *   UEBERNACHT rUN(t) = eroeffnung(t)/schluss(t-1) - 1     <- PRIMAER, wird beurteilt
 *   INTRADAY   rID(t) = schluss(t)/eroeffnung(t) - 1       <- NUR NACHRICHTLICH
 *   d_t = f_t * (Mittel_V - Mittel_S) * 100 auf rUN (anteils-gewichtet, Nachtrag 7)
 *
 * Waechter VOR jedem c-Hut: W4 Eroeffnungs-Plausibilitaet (ausserhalb [tief,hoch]
 * oder <=0 -> Zeile ungueltig; >2 % in einem Arm -> HALT), W3 Dropout (relativ
 * >10 Pp Arm-Differenz ODER absolut <90 % in einem Arm -> nicht messbar; Nachtrag 1),
 * W1 Kunstinjektion auf rUN, W2b Maschinen-Null. Familie ueberlebensluecke-wege,
 * 2 Tests, |t| >= 2,2414. */
var fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');

var REPO = 'C:/Users/Wilhe/Downloads/Stock-Dashboard';
var ARCHIV = process.env.ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var HIER = __dirname;
var WP = require(REPO + '/studien/messmaschine/strategien/wertpapierart.js');

var UMSATZ_MIN = 5e6, BREITE_MIN = 20, START_TAG = '2024-08-23';
var T_KRIT = 2.2414, Z80 = 0.8416;
var SEED = 20260827;
var W1_N = 200, W1_SHIFT = -0.0005;
var W2B_ZIEHUNGEN = 200;
var W3_REL = 0.10, W3_ABS = 0.90, W4_MAX = 0.02, EPS = 1e-6;

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

/* Beobachtungen einer Reihe: {t, rUN, rID, rTag}; W3/W4-Zaehlung je Reihe mitgefuehrt.
 * kandidat = Zeile besteht alle Mitglied-1-Filter (Schluesse, Liquiditaet, Fenster);
 * gueltig  = zusaetzlich Eroeffnung plausibel (W4). */
/* W4-Bedingung als EINE benannte Stelle - der Selbsttest unten prueft genau diese,
 * nicht einen Nachbau (Falle: "der Pruefstand prueft, was er nachbilden kann"). */
function eroeffnungPlausibel(z) {
  var h = z[3], l = z[4], o = z[5];
  return (o > 0) && (h > 0) && (l > 0) && (o >= l * (1 - EPS)) && (o <= h * (1 + EPS));
}
function w4Selbsttest() {
  var faelle = [
    ['Eroeffnung im Band', [0, 10, 100, 11, 9, 10.5], true],
    ['ueber dem Hoch', [0, 10, 100, 11, 9, 11.5], false],
    ['unter dem Tief', [0, 10, 100, 11, 9, 8.5], false],
    ['exakt = Hoch', [0, 10, 100, 11, 9, 11], true],
    ['exakt = Tief', [0, 10, 100, 11, 9, 9], true],
    ['null', [0, 10, 100, 11, 9, 0], false],
    ['fehlt', [0, 10, 100, 11, 9], false],
    ['negativ', [0, 10, 100, 11, 9, -1], false],
    ['knapp ueber Hoch (+0,01 %)', [0, 10, 100, 11, 9, 11.0011], false],
    ['knapp unter Tief (-0,01 %)', [0, 10, 100, 11, 9, 8.9991], false]
  ];
  var ok = 0;
  faelle.forEach(function (f) { if (eroeffnungPlausibel(f[1]) === f[2]) ok++; else console.log('  W4-Selbsttest FEHLER: ' + f[0]); });
  return { bestanden: ok === faelle.length, ok: ok, n: faelle.length };
}

function beobachtungen(b, w) {
  var beob = [];
  for (var i = 1; i < b.length; i++) {
    var c = b[i][1], cv = b[i - 1][1], vol = b[i][2] || 0;
    if (!(c > 0) || !(cv > 0)) continue;
    if (!(c * vol >= UMSATZ_MIN)) continue;
    var t = tag(b[i][0]);
    if (t < START_TAG) continue;
    w.kandidat++;
    var o = b[i][5];
    if (!eroeffnungPlausibel(b[i])) { w.ungueltig++; continue; }
    w.gueltig++;
    beob.push({ t: t, rUN: o / cv - 1, rID: c / o - 1, rTag: c / cv - 1 });
  }
  return beob;
}

function ladeUeberlebende(w) {
  var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; });
  var reihen = {}, zaehl = { genutzt: 0, verworfen: 0 };
  dateien.forEach(function (f) {
    var sym = f.slice(8, -5);
    if (!WP.istAktie(sym)) return;
    var j; try { j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); } catch (e) { return; }
    var b = j.bars || j.series || [];
    if (b.length < 100) { zaehl.verworfen++; return; }
    b = b.slice(0, b.length - 1);                     /* #85 */
    if (reiheKaputt(b, 1)) { zaehl.verworfen++; return; }
    zaehl.genutzt++;
    var beob = beobachtungen(b, w);
    if (beob.length) reihen[sym] = beob;
  });
  return { reihen: reihen, zaehl: zaehl };
}
function tageAus(reihenListe, feld, shiftJeTag) {
  var tage = {};
  reihenListe.forEach(function (beob) {
    beob.forEach(function (x) { (tage[x.t] || (tage[x.t] = [])).push(shiftJeTag ? x[feld] + shiftJeTag : x[feld]); });
  });
  return tage;
}
function differenzreihe(tageS, tageV) {
  var alle = Object.keys(tageS).sort();
  var diff = [], anteil = [], roh = [], tageOhneV = 0;
  for (var d = 0; d < alle.length; d++) {
    var T = alle[d], S = tageS[T], V = tageV[T] || [];
    if (S.length < BREITE_MIN) continue;
    if (!V.length) { tageOhneV++; continue; }
    var f = V.length / (V.length + S.length);
    diff.push(f * (mittel(V) - mittel(S)) * 100);
    roh.push((mittel(V) - mittel(S)) * 100);
    anteil.push(f);
  }
  var sdFD = sdErsteDifferenz(diff), N = diff.length;
  var m = N ? mittel(diff) : NaN, se = sdFD / Math.sqrt(N);
  return { mittel: m, mittelRoh: N ? mittel(roh) : NaN, sdFD: sdFD, sdGew: sd(diff), se: se,
           t: se > 0 ? m / se : NaN, N: N, tageOhneV: tageOhneV, fMittel: N ? mittel(anteil) : NaN,
           delta80: (T_KRIT + Z80) * se };
}
function druckeBlock(name, E) {
  console.log(name);
  console.log('  Paartage ' + E.N + ' (ohne V: ' + E.tageOhneV + ')   c_gew ' + pp(E.mittel) + ' Pp   se ' + pp(E.se) +
    '   t ' + (isNaN(E.t) ? '-' : E.t.toFixed(2)) + '   delta80 ' + pp(E.delta80) +
    '   sigma FD/gew ' + pp(E.sdFD) + '/' + pp(E.sdGew) + '   f-Mittel ' + (100 * E.fMittel).toFixed(2) + ' %' +
    '   c_roh ' + pp(E.mittelRoh) + ' Pp');
}
function quote(w) { return w.kandidat ? w.gueltig / w.kandidat : NaN; }
function druckeW34(name, w) {
  console.log('  ' + name + ': Kandidaten ' + w.kandidat + '  gueltig ' + w.gueltig + ' (' + (100 * quote(w)).toFixed(2) + ' %)  W4-ungueltig ' + w.ungueltig + ' (' + (w.kandidat ? (100 * w.ungueltig / w.kandidat).toFixed(2) : '-') + ' %)');
}

/* ================= Ablauf ================= */
var modus = process.argv.indexOf('--kohorte') >= 0 ? 'kohorte' : 'waechter';
console.log('== messe-weg3-uebernacht ==  Modus ' + modus + '  Familie ueberlebensluecke-wege (2 Tests, |t|>=' + T_KRIT + ')  Seed ' + SEED);
if (!WP.klassifizierungDa()) { console.error('ABBRUCH: Klassifizierung fehlt.'); process.exit(2); }
var w4st = w4Selbsttest();
console.log('W4-Selbsttest (Positivkontrolle des Waechters): ' + w4st.ok + '/' + w4st.n + ' -> ' + (w4st.bestanden ? 'BESTANDEN (eine Null von W4 ist eine belegte Null)' : 'DEFEKT'));
if (!w4st.bestanden) { console.error('ABBRUCH: W4 faengt nicht, was er fangen soll.'); process.exit(3); }
if (!wachhundOk()) process.exit(2);

console.log('Lade Ueberlebende ...');
var wS = { kandidat: 0, gueltig: 0, ungueltig: 0 };
var U = ladeUeberlebende(wS);
var uSyms = Object.keys(U.reihen);
console.log('Ueberlebende: ' + U.zaehl.genutzt + ' genutzt, ' + U.zaehl.verworfen + ' verworfen, mit Beobachtungen: ' + uSyms.length);
druckeW34('W3/W4 Ueberlebenden-Arm', wS);
if (wS.kandidat && wS.ungueltig / wS.kandidat > W4_MAX) {
  console.error('\nW4-HALT: >2 % unplausible Eroeffnungen im Ueberlebenden-Arm. Kein c-Hut. Befund melden.');
  process.exit(3);
}

/* ---------- W1 Kunstinjektion auf rUN ---------- */
console.log('\n-- W1 Kunstinjektion (' + W1_N + ' Pseudo-Verschwundene, Shift ' + (W1_SHIFT * 100).toFixed(2) + ' Pp/Tag auf rUN) --');
var rnd = mulberry32(SEED);
var gemischt = uSyms.slice();
for (var i = gemischt.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t0 = gemischt[i]; gemischt[i] = gemischt[j]; gemischt[j] = t0; }
var markiert = gemischt.slice(0, W1_N), markiertSet = {};
markiert.forEach(function (s) { markiertSet[s] = 1; });
var tageS_rest = tageAus(uSyms.filter(function (s) { return !markiertSet[s]; }).map(function (s) { return U.reihen[s]; }), 'rUN');
var tageV_kunst = tageAus(markiert.map(function (s) { return U.reihen[s]; }), 'rUN', W1_SHIFT);
var Ek = differenzreihe(tageS_rest, tageV_kunst);
var soll = Ek.fMittel * W1_SHIFT * 100;
var verh = Ek.mittel / soll;
var w1ok = soll < 0 && Ek.mittel < 0 && verh >= 0.7 && verh <= 1.3;
console.log('Sollwert ' + pp(soll) + ' Pp   gemessen ' + pp(Ek.mittel) + '   Verhaeltnis ' + verh.toFixed(3) +
  '   (t ' + Ek.t.toFixed(2) + ', Paartage ' + Ek.N + ')  -> ' + (w1ok ? 'BESTANDEN' : 'VERFEHLT'));

/* ---------- W2b Maschinen-Null auf rUN ---------- */
console.log('\n-- W2b Maschinen-Null (' + W2B_ZIEHUNGEN + ' Ziehungen) --');
var rnd2 = mulberry32(SEED + 1);
var cZieh = [];
for (var z = 0; z < W2B_ZIEHUNGEN; z++) {
  var misch = uSyms.slice();
  for (var a = misch.length - 1; a > 0; a--) { var b2 = Math.floor(rnd2() * (a + 1)); var t1 = misch[a]; misch[a] = misch[b2]; misch[b2] = t1; }
  var armA = misch.slice(0, W1_N), armB = misch.slice(W1_N, 2 * W1_N);
  var E2 = differenzreihe(tageAus(armB.map(function (s) { return U.reihen[s]; }), 'rUN'),
                          tageAus(armA.map(function (s) { return U.reihen[s]; }), 'rUN'));
  if (!isNaN(E2.mittel)) cZieh.push(E2.mittel);
  if ((z + 1) % 50 === 0) console.log('  Ziehung ' + (z + 1) + '/' + W2B_ZIEHUNGEN);
}
var mZ = mittel(cZieh), sdZ = sd(cZieh), grenze = (T_KRIT + Z80) * sdZ / 4;
var w2ok = Math.abs(mZ) < grenze;
console.log('Mittel ' + pp(mZ) + ' Pp  sd ' + pp(sdZ) + '  Grenze ' + pp(grenze) + '  -> ' + (w2ok ? 'BESTANDEN' : 'VERFEHLT'));

var waechter = { gemessenAm: new Date().toISOString(), seed: SEED, ueberlebende: U.zaehl,
  W3W4_S: { kandidat: wS.kandidat, gueltig: wS.gueltig, ungueltig: wS.ungueltig, quote: quote(wS) },
  W1: { soll: soll, gemessen: Ek.mittel, verhaeltnis: verh, t: Ek.t, N: Ek.N, bestanden: w1ok },
  W2b: { mittel: mZ, sd: sdZ, grenze: grenze, ziehungen: cZieh.length, bestanden: w2ok } };
fs.writeFileSync(path.join(HIER, 'waechter-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'), JSON.stringify(waechter, null, 1));
if (!w1ok || !w2ok) { console.error('\nWaechter VERFEHLT - kein Kohortenlauf.'); process.exit(3); }
console.log('\nWaechter gruen.');
if (modus !== 'kohorte') { console.log('Kohortenlauf erst mit --kohorte (nach 1d-Vollauf-Meldung, Lauf-Gate §6).'); process.exit(0); }

/* ================= KOHORTE (ein Lauf) ================= */
console.log('\n== KOHORTE ==');
var tdOrdner = path.join(DATEN, 'tagesdaten');
var tdDateien = fs.readdirSync(tdOrdner).filter(function (f) { return f.slice(-5) === '.json'; });
var wV = { kandidat: 0, gueltig: 0, ungueltig: 0 };
var reihenV = [], zV = { genutzt: 0, verworfen: 0 };
tdDateien.forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(path.join(tdOrdner, f), 'utf8')); } catch (e) { return; }
  var sym = j.sym, b = j.series || [];
  if (!WP.istAktie(sym)) { zV.verworfen++; return; }
  if (b.length < 20) { zV.verworfen++; return; }
  if (j.delistet) { var ende = b.length - 1, cut = 0; while (ende > 0 && tag(b[ende][0]) > j.delistet) { ende--; cut++; } if (cut > 1) b = b.slice(0, ende + 2); }
  b = b.slice(0, b.length - 1);                        /* #85 */
  if (reiheKaputt(b, 1)) { zV.verworfen++; return; }
  zV.genutzt++;
  var beob = beobachtungen(b, wV);
  if (beob.length) reihenV.push(beob);
});
console.log('Verschwundene: ' + zV.genutzt + ' genutzt, ' + zV.verworfen + ' verworfen (von ' + tdDateien.length + ' Dateien)');
druckeW34('W3/W4 Verschwundenen-Arm', wV);
druckeW34('W3/W4 Ueberlebenden-Arm ', wS);

/* W4 Kohorten-Halt, dann W3 (relativ + absolut, Nachtrag 1) - VOR jedem c-Hut */
if (wV.kandidat && wV.ungueltig / wV.kandidat > W4_MAX) {
  console.error('\nW4-HALT: >2 % unplausible Eroeffnungen im Verschwundenen-Arm. Kein c-Hut. Befund melden.');
  process.exit(3);
}
var qS = quote(wS), qV = quote(wV);
var w3rel = Math.abs(qS - qV) <= W3_REL, w3abs = qS >= W3_ABS && qV >= W3_ABS;
console.log('W3: Quoten S ' + (100 * qS).toFixed(2) + ' % / V ' + (100 * qV).toFixed(2) + ' %  Differenz ' + (100 * Math.abs(qS - qV)).toFixed(2) +
  ' Pp (Grenze 10)  Untergrenze 90 % je Arm -> relativ ' + (w3rel ? 'ok' : 'GERISSEN') + ', absolut ' + (w3abs ? 'ok' : 'GERISSEN'));
if (!w3rel || !w3abs) {
  console.error('\nW3-RISS: Lauf NICHT MESSBAR (differentieller bzw. symmetrischer Eroeffnungs-Ausfall). Kein c-Hut. Befund melden.');
  fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'),
    JSON.stringify({ gemessenAm: new Date().toISOString(), urteil: 'nicht messbar (W3)', qS: qS, qV: qV, waechter: waechter, verschwundene: zV }, null, 1));
  process.exit(3);
}

/* Zerlegungs-Identitaet als Konsistenz-Ausweis (kein Urteil) */
var maxAbw = 0, nId = 0;
reihenV.concat(uSyms.map(function (s) { return U.reihen[s]; })).forEach(function (beob) {
  beob.forEach(function (x) { var abw = Math.abs((1 + x.rUN) * (1 + x.rID) - (1 + x.rTag)); if (abw > maxAbw) maxAbw = abw; nId++; });
});
console.log('Zerlegungs-Identitaet (UN o ID = Tag): max. Abweichung ' + maxAbw.toExponential(2) + ' auf ' + nId + ' Beobachtungen (Ausweis, kein Urteil)');

var tageS_UN = tageAus(uSyms.map(function (s) { return U.reihen[s]; }), 'rUN');
var tageV_UN = tageAus(reihenV, 'rUN');
var E = differenzreihe(tageS_UN, tageV_UN);
druckeBlock('\nUEBERNACHT - GEWICHTETE DIFFERENZREIHE (Primaerendpunkt, wird beurteilt)', E);
var EID = differenzreihe(tageAus(uSyms.map(function (s) { return U.reihen[s]; }), 'rID'), tageAus(reihenV, 'rID'));
druckeBlock('INTRADAY - NUR NACHRICHTLICH (kein Urteil, keine Schwelle)', EID);

var urteil;
if (Math.abs(E.t) >= T_KRIT) urteil = 'Richtung belegt: ' + (E.mittel < 0 ? 'NEGATIV (Archiv beschoenigt ueber Nacht)' : 'POSITIV (Archiv untertreibt ueber Nacht)');
else if (Math.abs(E.mittel) + 1.645 * E.se < E.delta80) urteil = 'im Fenster ohne messbare Richtung';
else urteil = 'nicht entscheidbar mit diesen Daten';
console.log('\nURTEIL (R1-R3, nur Uebernacht): ' + urteil);
console.log('Sperrliste: kein Kanten-Urteil, keine Reparatur-/Gewichtungs-Empfehlung, Intraday nachrichtlich, 5-Mio-Deutungsgrenze wie Mitglied 1.');
var lauf = { gemessenAm: new Date().toISOString(), seed: SEED, waechter: waechter,
  W3: { qS: qS, qV: qV }, verschwundene: zV, identitaet: { maxAbweichung: maxAbw, n: nId },
  uebernacht: E, intradayNachrichtlich: EID, urteil: urteil,
  familie: { name: 'ueberlebensluecke-wege', tests: 2, schwelle: T_KRIT } };
fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'), JSON.stringify(lauf, null, 1));
console.log('lauf-<zeit>.json geschrieben. NICHTS an Archiven geaendert.');
