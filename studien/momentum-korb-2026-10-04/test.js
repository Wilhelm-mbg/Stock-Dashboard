'use strict';
/* Pruefungen zu Auftrag Nr. 78 (§2). Aufruf aus der Repo-Wurzel:
 *   node --max-old-space-size=6144 studien/momentum-korb-2026-10-04/test.js
 * Teil I uebernimmt die Pruefungen des amtlichen Rueckblicks (Nr. 74, dort test.js) und faehrt sie gegen DIESEN Rechner (korb.js).
 * Teil II prueft, was neu ist: Korbauswahl, Mechanik Gleichgewicht, Fenster A, SPY-Ergaenzung, kein Blick voraus fuer den Korb,
 * die beiden Kunstfaelle fuer die Saetze aus §1.7. Die Sollwerte der Kunstfaelle sind von Hand gerechnet (Rechenweg in den Kommentaren).
 * Der Teil auf dem echten Panel gibt keine Ertraege der fuenf Laeufe aus: Aufbau der Fenster, Korbauswahl an EINEM Stichtag,
 * Zaehlung der SPY-Ausschuettungen, die Gegenprobe des PM fuer SPY (Zahl aus dem Auftrag) und die Selbstpruefung (§1.8). */
var path = require('path');
var S = require('./korb.js');
var REPO = path.resolve(__dirname, '..', '..');
var R = require(path.join(REPO, 'studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js'));
var MH = require(path.join(REPO, 'mfhandel.js'));
var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 0.006 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function wirft(name, f) { var w = false; try { f(); } catch (e) { w = true; } ok(name, w); }

/* ---------- Kunstpanel (wie im amtlichen test.js) ---------- */
function kunstTafel(tage, reihen) {
  var rows = [];
  reihen.forEach(function (r, s) { r.zeilen.forEach(function (z) { rows.push([z[0], s, z[1], z[2], z[3], z[4]]); }); });
  rows.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  var n = rows.length, g = { n: n, tag: new Int32Array(n), sym: new Uint16Array(n), rohSchluss: new Float64Array(n), bSchluss: new Float64Array(n),
    bEroeffnung: new Float64Array(n), umsatz: new Float64Array(n) };
  rows.forEach(function (r, i) { g.tag[i] = r[0]; g.sym[i] = r[1]; g.rohSchluss[i] = r[2]; g.bSchluss[i] = r[3]; g.bEroeffnung[i] = r[4]; g.umsatz[i] = r[5]; });
  var nTage = tage.length, nSym = reihen.length, i;
  var tagVon = new Int32Array(nTage).fill(-1), tagBis = new Int32Array(nTage).fill(-1);
  for (i = 0; i < n; i++) { var t = g.tag[i]; if (tagVon[t] < 0) tagVon[t] = i; tagBis[t] = i + 1; }
  var zaehl = new Int32Array(nSym + 1);
  for (i = 0; i < n; i++) zaehl[g.sym[i] + 1]++;
  for (var s = 0; s < nSym; s++) zaehl[s + 1] += zaehl[s];
  var symStart = Int32Array.from(zaehl), symZeilen = new Int32Array(n), fuell = Int32Array.from(zaehl);
  for (i = 0; i < n; i++) symZeilen[fuell[g.sym[i]]++] = i;
  function zeileVon(sym, tag) {
    if (tag < 0 || tag >= nTage) return -1;
    var a = tagVon[tag], b = tagBis[tag];
    if (a < 0) return -1;
    while (a < b) { var m = (a + b) >> 1; if (g.sym[m] < sym) a = m + 1; else b = m; }
    return (a < tagBis[tag] && g.sym[a] === sym) ? a : -1;
  }
  var symName = reihen.map(function (r) { return r.reihe; }), symIdx = {};
  symName.forEach(function (nm, j) { symIdx[nm] = j; });
  return { g: g, kal: { tage: tage }, maxTag: nTage - 1, nTage: nTage, nSym: nSym, tagVon: tagVon, tagBis: tagBis, symStart: symStart, symZeilen: symZeilen,
    zeileVon: zeileVon, symName: symName, symIdx: symIdx, endeGrund: reihen.map(function (r) { return r.ende_grund || null; }),
    stand: { kennung: 'kunst', symbole: reihen.map(function (r) { return { reihe: r.reihe, ordner: r.reihe, lebend: r.ende_grund ? 0 : 1, referenz: !!r.referenz, ende_grund: r.ende_grund || null }; }) },
    letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; } };
}
function wochentage(n) {
  var aus = [], d = new Date(Date.UTC(2020, 0, 1));
  while (aus.length < n) { var w = d.getUTCDay(); if (w !== 0 && w !== 6) aus.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
  return aus;
}
var NT = 327, TAGE = wochentage(NT);          /* Tage 0..326; Stichtag 252, Ausfuehrung 253 und 316, Ende 326 */
function pad(j) { return 'S' + ('00' + j).slice(-3); }
/** Schluss und Eroeffnung der Kunstaktie j am Tag t. opt.s9: Schluss von S009 an den Tagen 253..314; opt.ende: Schluss der gehaltenen am Tag 326. */
function kurs(j, t, opt) {
  var c, o;
  if (t < 200) c = 100;
  else if (t <= 252) c = 200 - j;
  else if (j <= 9) c = t <= 314 ? (j === 9 ? opt.s9 : 105) : t === 315 ? 110 : t <= 325 ? 115 : opt.ende;
  else if (j === 10) c = t <= 315 ? 104 : t <= 325 ? 105 : 110;
  else c = 50;
  o = c;
  if (t === 253 && j <= 10) o = 100;
  if (t === 316) { if (j <= 9) o = 110; if (j === 10) o = 100; }
  return [c, o];
}
function spyKurs(t) {
  var c = t < 200 ? 300 : t <= 252 ? 3000 : t <= 314 ? 420 : t === 315 ? 440 : t <= 325 ? 460 : 484;
  return [c, t === 253 ? 400 : t === 316 ? 440 : c];
}
/** opt wie im amtlichen test.js; neu: opt.spy(t) -> [Schluss, Eroeffnung] ersetzt spyKurs, opt.ergaenzungen / opt.protokoll fuer die SPY-Ergaenzung. */
function kunst(opt) {
  opt = opt || {};
  var o2 = { s9: opt.s9 || 95, ende: opt.ende || 121 }, reihen = [], nA = opt.nAktien || 102;
  for (var j = 0; j < nA; j++) {
    var name = pad(j), letzte = opt.enden && opt.enden[name] ? opt.enden[name][0] : NT - 1, zeilen = [], f = (opt.rohFaktor && opt.rohFaktor[name]) || 1;
    for (var t = 0; t <= letzte; t++) {
      var k = kurs(j, t, o2), z = [t, k[0] * f, k[0], k[1], 2e8];
      if (opt.aendern) opt.aendern(name, t, z);
      zeilen.push(z);
    }
    reihen.push({ reihe: name, zeilen: zeilen, ende_grund: opt.enden && opt.enden[name] ? opt.enden[name][1] : null });
  }
  var sz = [];
  for (var t2 = 0; t2 < NT; t2++) { var ks = (opt.spy && opt.spy(t2)) || spyKurs(t2); sz.push([t2, ks[0], ks[0], ks[1], 2e8]); }
  reihen.push({ reihe: 'SPY', zeilen: sz, referenz: opt.spyAlsAktie ? false : true });
  var T = kunstTafel(TAGE, reihen), Q = R.vorbereiten(T);
  return { T: T, Q: Q, M: S.Massnahmen(T, Q, opt.leser || function () { return null; }, opt.ergaenzungen || {}, opt.protokoll || null) };
}
var HAUPT = K.EMPFINDLICHKEIT[0].totalverlust, MILDE = K.EMPFINDLICHKEIT[2].totalverlust;
function lauf(P, extra) {
  var o = { startTag: 253, endTag: NT - 1, totalverlust: HAUPT };
  Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
  return S.simuliere(P.T, P.Q, P.M, o);
}
function pos(L, name) { return L.buch.positionen.filter(function (p) { return p.sym === name; })[0]; }
function wertAm(L, tag) { return L.tage.filter(function (x) { return x.tag === tag; })[0]; }

/* ================= Teil I: die Pruefungen des amtlichen Rueckblicks, gegen diesen Rechner ================= */

/* ===== 1. Grundfall, von Hand =====
 * Tag 253: Ziel S000..S009 (Staerke 100 % .. 91 %), Eroeffnung je 100. Budget 100000/10 = 10000 -> 100 Stueck, je 100*100*1,002 = 10020.
 * Neun Kaeufe = 90180, Rest 9820; der zehnte (S009) wird verkleinert: floor(9820/100,2*10000)/10000 = 98,0039 Stueck = 9819,99078 -> Bargeld 0,00922.
 * Kosten 0,002 * (90000 + 9800,39) = 199,60078. Schluss Tag 253: 900*105 + 98,0039*95 + 0,00922 = 103810,37972.
 * Schluss Tag 315 (alle 110): 99000 + 10780,429 + 0,00922 = 109780,43822 -> Periode 1: +9,78044 %; SPY 400 -> 440 = +10 %.
 * Tag 316: Ziel S000..S008 + S010. Verkauf S009: 98,0039*110*0,998 = 10758,868142 -> Bargeld 10758,877362. Kauf S010 zu 100: Budget 10978,04 reicht nicht,
 * floor(10758,877362/100,2*10000)/10000 = 107,3740 Stueck = 10758,8748 -> Bargeld 0,002562. Kosten 21,560858 + 21,4748.
 * Schluss Tag 326: 900*121 + 107,3740*110 + 0,002562 = 120711,142562; SPY 250*484 = 121000. */
var G = kunst(), L = lauf(G), kz = R.kennzahlen(G.Q, L);
ok('Ziel am Stichtag 252 = S000..S009', JSON.stringify(S.zielAm(G.T, G.Q, 252, null).ziel) === JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(pad)));
ok('zulaessig 102, Zielzahl 10', L.umschichtungen[0].zulaessig === 102 && L.umschichtungen[0].zielzahl === 10);
nah('Schluss Tag 253', L.tage[0].buch, 103810.38);
nah('Periode 1 Endwert Buch', L.perioden[0].buchEnde, 109780.44);
nah('Periode 1 Ertrag Buch', L.perioden[0].buch, 9.78044, 1e-4);
nah('Periode 1 Ertrag SPY', L.perioden[0].spy, 10, 1e-9);
nah('Periode 1 Abstand', L.perioden[0].abstand, -0.21956, 1e-4);
nah('Kosten erste Umschichtung (20 Bp auf den Kauf)', L.umschichtungen[0].kosten, 199.60078, 1e-6);
nah('Kosten zweite Umschichtung (20 Bp auf Verkauf und Kauf)', L.umschichtungen[1].kosten, 21.560858 + 21.4748, 1e-6);
nah('Kosten gesamt', L.zaehler.kosten, 242.636438, 1e-6);
ok('zweite Umschichtung: 1 Verkauf, 1 Kauf, 9 gehalten', L.umschichtungen[1].verkaeufe === 1 && L.umschichtungen[1].kaeufe === 1 && L.umschichtungen[1].gehalten === 9);
ok('Position im Ziel nicht gehandelt (Stueck 100, seit Tag 253)', [0, 1, 2, 3, 4, 5, 6, 7, 8].every(function (j) { var p = pos(L, pad(j)); return p && p.stueck === 100 && p.seit === G.Q.ms[253]; }));
ok('S009 verkauft, S010 gekauft mit 107,3740 Stueck', !pos(L, 'S009') && pos(L, 'S010').stueck === 107.374);
nah('Bargeld am Ende', L.buch.cash, 0.002562, 1e-6);
nah('Endwert Buch', L.endBuch, 120711.14);
nah('Endwert SPY', L.endSpy, 121000, 1e-6);
ok('zwei Perioden, die letzte angebrochen', L.perioden.length === 2 && L.perioden[1].angebrochen === true && !L.perioden[0].angebrochen);
nah('angebrochene Periode Buch', L.perioden[1].buch, (120711.14 / 109780.44 - 1) * 100, 1e-6);
nah('angebrochene Periode SPY', L.perioden[1].spy, 10, 1e-9);
ok('Ausfuehrungstage 253 und 316', L.umschichtungen[0].ausfuehrungstag === TAGE[253] && L.umschichtungen[1].ausfuehrungstag === TAGE[316] && L.umschichtungen[1].stichtag === TAGE[315]);
ok('Einstand = Eroeffnung des Folgetags (100*1,002), nicht Schluss des Stichtags (200)', Math.abs(pos(L, 'S000').einstand - 100.2) < 1e-9 && G.T.g.bSchluss[G.T.zeileVon(0, 252)] === 200);
nah('Gesamtertrag Buch', kz.buchGesamt, 20.71114, 1e-4);
ok('schlaegt: nein (Buch 120711 < SPY 121000)', kz.schlaegt === false && kz.abstandPa < 0);
nah('p. a. passt zum Gesamtertrag', Math.pow(1 + kz.buchPa / 100, kz.jahre), L.endBuch / R.START, 1e-9);
var KJ = R.kalenderjahre(G.T, L);   /* Tag 261 = 31.12.2020: 103810,38 -> 2020: +3,81038 % */
ok('Kalenderjahre 2020 und 2021', KJ.length === 2 && KJ[0].jahr === '2020' && KJ[1].jahr === '2021' && TAGE[261] === '2020-12-31');
nah('Kalenderjahr 2020 Buch', KJ[0].buch, 3.81038, 1e-4);
nah('Kalenderjahre verkettet = Gesamtertrag', (1 + KJ[0].buch / 100) * (1 + KJ[1].buch / 100), L.endBuch / R.START, 1e-9);
nah('mittlerer Bargeldanteil klein', L.tage.reduce(function (a, x) { return a + x.bar / x.buch; }, 0) / L.tage.length, 0, 1e-6);

/* ===== 2. Reihenende: S001 endet am Tag 270 (Insolvenz -> 0), S002 am Tag 280 (Uebernahme -> letzter Kurs 105, ohne Kosten) =====
 * Tag 271: 103810,37972 - 100*105 = 93310,37972. Tag 281: 10500 wandern in das Bargeld, Wert bleibt 93310,37972, Bargeld 10500,00922.
 * milde: auch S001 zum letzten Kurs -> Wert bleibt 103810,37972. */
var E1 = kunst({ enden: { S001: [270, 'insolvenz'], S002: [280, 'uebernahme'] } }), LE = lauf(E1), LM = lauf(E1, { totalverlust: MILDE });
nah('Tag 270 noch voll', wertAm(LE, 270).buch, 103810.38);
nah('Tag 271 Insolvenz = Wert 0', wertAm(LE, 271).buch, 93310.38);
nah('Tag 281 Uebernahme = letzter Kurs', wertAm(LE, 281).buch, 93310.38);
nah('Tag 281 Bargeld 10500,00922 (ohne Verkaufskosten)', wertAm(LE, 281).bar, 10500.00922, 1e-6);
ok('zwei Reihenenden mit Grund', LE.reihenenden.length === 2 && LE.reihenenden[0].reihe === 'S001' && LE.reihenenden[0].totalverlust && LE.reihenenden[0].gutschrift === 0 &&
  LE.reihenenden[0].tag === TAGE[271] && LE.reihenenden[1].reihe === 'S002' && !LE.reihenenden[1].totalverlust && LE.reihenenden[1].gutschrift === 10500);
nah('milde: Tag 281 ohne Totalverlust', wertAm(LM, 281).buch, 103810.38);
/* zuWenig: 100 Aktien, S050 endet am Tag 300 -> am Stichtag 315 nur 99 zulaessig -> keine Umschichtung, Tage 316..326 = 11 Versuche */
var LZ = lauf(kunst({ nAktien: 100, enden: { S050: [300, 'uebernahme'] } }));
ok('zuWenig: 11 Tage gezaehlt, eine Umschichtung, eine Periode', LZ.zaehler.zuWenigTage === 11 && LZ.zaehler.umschichtungen === 1 && LZ.perioden.length === 1);

/* ===== 3. Ausschuettungen =====
 * S000 (roh = 2 x bereinigt): Ex-Tag 260, rate 2,10, rohSchluss Vortag 210 -> Satz 1 %; Bargeld 100 * 105 * 0,01 = 105,00. Schluss Tag 260: 103810,37972 + 105 = 103915,37972.
 * Nicht zaehlen: S000 Ex-Tag 253 (Kauftag, zur Eroeffnung gekauft), S000 Ex-Tag 250 (vor dem Kauf), S050 (nie gehalten), Satz anderer Art, SPY Ex-Tag 253.
 * S009: Ex-Tag 316 (Verkaufstag; ueber die Nacht gehalten) rate 1,10 / 110 = 1 % -> 98,0039*110*0,01 = 107,80429, gutgeschrieben NACH dem Handel.
 * Tag 316: Wert 105,00922 + 99000 + 10780,429 = 109885,43822; Bargeld nach Verkauf 10863,877362; S010: floor(10863,877362/100,2*10000)/10000 = 108,4219 = 10863,87438
 * -> Bargeld 0,002982 + 107,80429 = 107,807272. Ende: 108900 + 108,4219*110 + 107,807272 = 120934,216272.
 * SPY: Ex-Tag 300, rate 4,20 / 420 = 1 % -> 250*420*0,01 = 1050, zum Schluss 420 wieder angelegt = +2,5 Stueck -> 252,5*484 = 122210. */
var saetze = {
  S000: [{ _art: 'cash_dividends', ex_date: TAGE[260], rate: 2.10 }, { _art: 'cash_dividends', ex_date: TAGE[253], rate: 5 }, { _art: 'cash_dividends', ex_date: TAGE[250], rate: 5 },
    { _art: 'forward_splits', ex_date: TAGE[262], rate: 5 }],
  S009: [{ _art: 'cash_dividends', ex_date: TAGE[316], rate: 1.10, special: true }],
  S050: [{ _art: 'cash_dividends', ex_date: TAGE[260], rate: 9 }],
  SPY: [{ _art: 'cash_dividends', ex_date: TAGE[300], rate: 4.20 }, { _art: 'cash_dividends', ex_date: TAGE[253], rate: 7 }],
};
var D = kunst({ rohFaktor: { S000: 2 }, leser: function (n) { return saetze[n] || null; } }), LD = lauf(D), LK = lauf(D, { ausschuettungen: false });
nah('Ausschuettung als Bargeld am Ex-Tag 260', wertAm(LD, 260).bar, 105.00922, 1e-6);
nah('Schluss Tag 260 mit Ausschuettung', wertAm(LD, 260).buch, 103915.38);
nah('Tag 259 noch ohne', wertAm(LD, 259).bar, 0.00922, 1e-6);
ok('zwei Ausschuettungen gebucht (ausserhalb der Haltezeit zaehlt nicht)', LD.zaehler.ausschuettungen === 2);
nah('Summe der Ausschuettungen', LD.zaehler.ausschuettungSumme, 105 + 107.80429, 1e-6);
ok('S010 nach Ausschuettung 108,4219 Stueck (Ex-Tag 316 erst nach dem Handel gutgeschrieben)', pos(LD, 'S010').stueck === 108.4219);
nah('Bargeld am Ende mit Ausschuettung', LD.buch.cash, 107.807272, 1e-6);
nah('Endwert Buch mit Ausschuettungen', LD.endBuch, 120934.22);
ok('SPY: eine Ausschuettung (Ex-Tag am Kauftag zaehlt nicht)', LD.zaehler.spyAusschuettungen === 1);
nah('SPY mit Wiederanlage', LD.endSpy, 122210, 1e-6);
ok('Positionen mit Datei 2, ohne 9', LD.zaehler.positionenMitDatei === 2 && LD.zaehler.positionenOhneDatei === 9 && LD.zaehler.positionen === 11);
nah('reiner Kursertrag Buch', LK.endBuch, 120711.14);
nah('reiner Kursertrag SPY', LK.endSpy, 121000, 1e-6);
var a260 = R.ausschuettungenAm(D.T, D.Q, D.M, 0, 260);
ok('dieselbe Satz-Funktion: rate / rohSchluss des Vortags', a260.length === 1 && Math.abs(a260[0].satz - 0.01) < 1e-12 && a260[0].basis === 105);

/* ===== 4. Kein Blick voraus ===== */
function rang(P, s) { return JSON.stringify(MH.momentumZiel(R.rohMapAm(P.T, P.Q, s), { nowMs: P.Q.ms[s] }).rangfolge); }
function stoer(ab) { return function (name, t, z) { if (t > ab) { var f = 1 + ((t * 7 + name.charCodeAt(3)) % 13); z[1] *= f; z[2] *= f; z[3] *= f; z[4] = 1; } }; }
ok('Kurse/Umsaetze nach dem Stichtag 252 aendern die Rangfolge nicht', rang(G, 252) === rang(kunst({ aendern: stoer(252) }), 252));
ok('ebenso am Stichtag 315', rang(G, 315) === rang(kunst({ aendern: stoer(315) }), 315));
var GP = kunst({ aendern: function (name, t, z) { if (name === 'S050' && t === 231) { z[1] = z[2] = z[3] = 1000; } } });
ok('Gegenprobe: ein Kurs VOR dem Stichtag aendert das Ziel', rang(G, 252) !== rang(GP, 252) && S.zielAm(GP.T, GP.Q, 252, null).ziel[0] === 'S050');
ok('Gegenprobe: dieselbe Stoerung ab Tag 231 (im Fenster der Staerke) aendert die Rangfolge', rang(G, 252) !== rang(kunst({ aendern: stoer(230) }), 252));

/* ===== 5. Referenzreihe nie im Ziel ===== */
ok('SPY (Staerke 900 %) nicht in der rohMap', !('SPY' in R.rohMapAm(G.T, G.Q, 252)) && !('SPY' in R.rohMapAm(G.T, G.Q, 315)));
ok('SPY in keinem Ziel des Laufs', [252, 315].every(function (s) { return S.zielAm(G.T, G.Q, s, null).ziel.indexOf('SPY') < 0; }));
var GA = kunst({ spyAlsAktie: true });
ok('Gegenprobe: ohne das Merkmal stuende SPY an der Spitze', MH.momentumZiel(R.rohMapAm(GA.T, GA.Q, 252), { nowMs: GA.Q.ms[252] }).ziel[0] === 'SPY');
wirft('Klinke wirft bei Referenzreihe im Ziel', function () { R.klinkeReferenz(G.T, G.Q, ['S000', 'SPY']); });

/* ===== 6. Die beiden Kunstfaelle der Fehlerform (amtlicher Rueckblick) =====
 * SPY-gleich: S009 laeuft wie die anderen (105) -> Ziel bleibt, kein zweiter Handel. Ende 998,0039*121 + 0,00922 = 120758,48112 gegen 121000:
 * Abstand = -(199,60078 * 1,21) / 1000 = -0,24152 Pp = minus Kosten. Vorsprung: Schluss 133,1 statt 121 -> 132834,33 > 121000. */
var LS = lauf(kunst({ s9: 105 })), kzS = R.kennzahlen(G.Q, LS);
ok('SPY-gleich: zweite Umschichtung ohne Handel', LS.umschichtungen[1].verkaeufe === 0 && LS.umschichtungen[1].kaeufe === 0 && LS.umschichtungen[1].kosten === 0);
nah('SPY-gleich: Endwert', LS.endBuch, 120758.48);
nah('SPY-gleich: Abstand = minus Kosten', kzS.buchGesamt - kzS.spyGesamt, -LS.zaehler.kosten * 1.21 / 1000, 1e-3);
ok('SPY-gleich: schlaegt nein', kzS.schlaegt === false);
var LV = lauf(kunst({ s9: 105, ende: 133.1 })), kzV = R.kennzahlen(G.Q, LV);
nah('Vorsprung: Endwert', LV.endBuch, 132834.33);
ok('Vorsprung: schlaegt ja, Abstand p. a. > 0', kzV.schlaegt === true && kzV.abstandPa > 0);

/* ===== 7. Zufallsbereich: Rechenregeln ===== */
var SP = S.startphasen(G.T, G.Q, G.M, 253, NT - 1, 3, { totalverlust: HAUPT });
ok('Startphasen: k = 0 ist die Hauptzahl, Starttage 253/254/255', SP.phasen.length === 3 && Math.abs(SP.phasen[0].abstandPa - kz.abstandPa) < 1e-12 &&
  SP.phasen[1].start === TAGE[254] && SP.phasen[2].start === TAGE[255] && SP.minimum <= SP.median && SP.median <= SP.maximum);
var PS = R.periodenstreuung([1, 2, 3, 6].map(function (v) { return { abstand: v }; }));   /* Mittel 3, s = sqrt(14/3) = 2,160247, SE 1,080123, t(3) = 3,182 */
nah('Periodenstreuung Mittel', PS.mittel, 3, 1e-12); nah('Standardfehler', PS.standardfehler, 1.080123, 1e-6);
nah('95-%-Band', PS.band95[1] - PS.band95[0], 2 * 3.182 * 1.080123, 1e-5);
nah('Median ungerade/gerade', R.median([5, 1, 9]) + R.median([4, 1, 2, 3]), 5 + 2.5, 1e-12);
nah('groesster Rueckschlag', R.maxRueckschlag([100, 120, 90, 130, 117]), -25, 1e-9);

/* ================= Teil II: was in Nr. 78 neu ist ================= */

/* ===== 9. Korbauswahl am Kunstpanel (§1.2, §1a.1) =====
 * 130 Aktien. Umsatz: S000..S099 = 500 Mio - j Mio (verschieden), ausser S003 = 150 Mio; S100..S119 = 300 Mio bei Kurs 100 an den Tagen 233..252
 * (Stueck 3 Mio, exakt gleicher Umsatz -> Gleichstand); S120..S129 = 90 Mio (unter der Schwelle). S125: an 9 der 20 Balken 9 Mrd -> Median 90 Mio
 * (bleibt draussen); S126: an 10 der 20 Balken 9 Mrd -> Median = sortiert[10] = 9 Mrd (zulaessig, umsatzstaerkster Wert).
 * Zulaessig: S000..S119 und S126 = 121. Korb 110 = S126, S000..S099 ohne S003 (99), aus dem Gleichstand die ersten nach Name S100..S109 (10).
 * Ziel im Korb: max(5, round(11)) = 11 nach Staerke (200-j)/100-1 -> S000, S001, S002, S004..S011. Breit: 12 -> S000..S011. */
function korbAendern(extra) {
  return function (name, t, z) {
    var j = +name.slice(1), u = j <= 99 ? 5e8 - j * 1e6 : j <= 119 ? 3e8 : 9e7;
    if (j === 3) u = 1.5e8;
    if (j >= 100 && j <= 119 && t >= 233 && t <= 252) { z[1] = z[2] = z[3] = 100; }
    if (j === 125 && t >= 244 && t <= 252) u = 9e9;
    if (j === 126 && t >= 243 && t <= 252) u = 9e9;
    z[4] = u;
    if (extra) extra(name, t, z, j);
  };
}
function menge(a) { return JSON.stringify(a.slice().sort()); }
var KP = kunst({ nAktien: 130, aendern: korbAendern() }), kb = S.zielAm(KP.T, KP.Q, 252, null), k110 = S.zielAm(KP.T, KP.Q, 252, 110);
var sollKorb = ['S126'];
for (var jk = 0; jk <= 109; jk++) if (jk !== 3) sollKorb.push(pad(jk));
ok('breit: 121 zulaessig von 130, Zielzahl 12 = S000..S011', kb.zulaessig === 121 && kb.geprueft === 130 && JSON.stringify(kb.ziel) === JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(pad)));
ok('Korb 110 = die 110 umsatzstaerksten der zulaessigen', k110.korb.length === 110 && menge(k110.korb) === menge(sollKorb));
ok('Gleichstand nach Name: S100..S109 im Korb, S110..S119 nicht', [100, 101, 105, 109].every(function (j) { return k110.korb.indexOf(pad(j)) >= 0; }) &&
  [110, 111, 115, 119].every(function (j) { return k110.korb.indexOf(pad(j)) < 0; }));
ok('Gleichstand ist exakt (Umsatz der Gleichstandsgruppe identisch)', k110.korbUmsatz[k110.korb.indexOf('S100')] === k110.korbUmsatz[k110.korb.indexOf('S109')] && k110.korbUmsatz[k110.korb.indexOf('S100')] === 3e8);
ok('Schritt (d): genau 110 zulaessige von 110 geprueften, breit 121', k110.zulaessig === 110 && k110.geprueft === 110 && k110.zulaessigBreit === 121);
ok('Zielliste aus dem Korb: 11 Werte, S003 (stark, aber umsatzschwach) fehlt', JSON.stringify(k110.ziel) === JSON.stringify([0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11].map(pad)));
ok('Median = oberer der beiden mittleren: S126 (10 von 20 Balken hoch) fuehrt den Korb an, S125 (9 von 20) bleibt draussen', k110.korb[0] === 'S126' && k110.korb.indexOf('S125') < 0);
ok('kein Wert unter der Schwelle im Korb', [120, 121, 122, 123, 124, 125, 127, 128, 129].every(function (j) { return k110.korb.indexOf(pad(j)) < 0; }));
var rf = MH.momentumZiel(R.rohMapAm(KP.T, KP.Q, 252), { nowMs: KP.Q.ms[252] }).rangfolge;
ok('kleines N (100): nur zulaessige, die umsatzstaerksten', S.korbWaehlen(rf, 100).every(function (p) { return p.umsatz >= 1e8 && +p.sym.slice(1) < 120 || p.sym === 'S126'; }) && S.korbWaehlen(rf, 100).length === 100);
ok('N ueber der Zahl der zulaessigen (125): es wird nicht mit Werten unter der Schwelle aufgefuellt', S.korbWaehlen(rf, 125).length === 121);
wirft('Klinke: Korb nicht voll (125 verlangt, 121 zulaessig)', function () { S.zielAm(KP.T, KP.Q, 252, 125); });
ok('korbWaehlen: Umsatz absteigend, bei Gleichstand Name aufsteigend', JSON.stringify(S.korbWaehlen([{ sym: 'B', umsatz: 5 }, { sym: 'D', umsatz: 1 }, { sym: 'A', umsatz: 5 }, { sym: 'C', umsatz: 7 }], 3).map(function (p) { return p.sym; })) === '["C","A","B"]');
var LKb = lauf(KP, { korb: 110 });
ok('Nachlauf mit Korb: 110 zulaessig, Zielzahl 11, S003 nie gehalten', LKb.umschichtungen[0].zulaessig === 110 && LKb.umschichtungen[0].zielzahl === 11 && LKb.umschichtungen[0].zulaessigBreit === 121 &&
  LKb.haltezeiten.every(function (h) { return h.reihe !== 'S003'; }) && !!pos(LKb, 'S011') && LKb.umschichtungen.length === 2);
ok('Nachlauf breit auf demselben Panel haelt S003', lauf(KP).haltezeiten.some(function (h) { return h.reihe === 'S003'; }));

/* ===== 10. Kein Blick voraus fuer die Korbauswahl ===== */
function korbAm(P, s, n) { return JSON.stringify(S.zielAm(P.T, P.Q, s, n).korb); }
function stoerNach(ab) { return function (name, t, z, j) { if (t > ab) { var f = 1 + ((t * 7 + j) % 13); z[1] *= f; z[2] *= f; z[3] *= f; z[4] = 1 + ((t * 31 + j * 17) % 7) * 1e9; } }; }
ok('Umsaetze und Kurse nach dem Stichtag 252 aendern den Korb nicht', korbAm(KP, 252, 110) === korbAm(kunst({ nAktien: 130, aendern: korbAendern(stoerNach(252)) }), 252, 110));
ok('ebenso am Stichtag 315', korbAm(KP, 315, 110) === korbAm(kunst({ nAktien: 130, aendern: korbAendern(stoerNach(315)) }), 315, 110));
var KG = kunst({ nAktien: 130, aendern: korbAendern(function (name, t, z) { if (name === 'S003' && t >= 233 && t <= 252) z[4] = 9e9; }) });
ok('Gegenprobe: ein Umsatz VOR dem Stichtag aendert den Korb (S003 kommt hinein)', korbAm(KP, 252, 110) !== korbAm(KG, 252, 110) && S.zielAm(KG.T, KG.Q, 252, 110).korb.indexOf('S003') >= 0);
ok('Gegenprobe: dieselbe Stoerung ab Tag 240 (im Umsatzfenster) aendert den Korb', korbAm(KP, 252, 110) !== korbAm(kunst({ nAktien: 130, aendern: korbAendern(stoerNach(240)) }), 252, 110));

/* ===== 11. Mechanik Gleichgewicht (§1.5), von Hand =====
 * Fall G1: wie der Grundfall, aber am Tag 316 eroeffnet S008 bei 88 (Untergewicht) und S007 hat keine Eroeffnung (Ziel ohne Kurs).
 * Tag 253 wie im Grundfall (alles Neukauf): S000..S008 je 100 Stueck, S009 98,0039, Bargeld 0,00922.
 * Tag 316, Ziel S000..S008 + S010. Depotwert zu Eroeffnungskursen OHNE S007: 0,00922 + 7*11000 + 100*88 + 98,0039*110 = 96580,43822; Budget 9658,043822.
 * Verkaeufe: S009 ganz: 10780,429*0,998 = 10758,868142. S000..S006 je (11000 - 9658,043822)/110 = 12,19960 -> 12,1996 Stueck = 1341,956 Volumen,
 *   Erloes 1339,272088, sieben Stueck: 9374,904616. Bargeld 0,00922 + 10758,868142 + 9374,904616 = 20133,781978.
 * Kaeufe in Zielreihenfolge: S007 ohne Kurs -> nicht gehandelt (100 Stueck bleiben). S008: (9658,043822 - 8800)/88 = 9,75050 -> 9,7505 Stueck,
 *   858,044*1,002 = 859,760088 -> Bargeld 19274,02189. S010 neu: 96,5804 Stueck zu 100 = 9658,04*1,002 = 9677,35608 -> Bargeld 9596,66581.
 * Kosten = 0,002 * (10780,429 + 7*1341,956 + 858,044 + 9658,04) = 0,002 * 30690,205 = 61,38041.
 * Ende (Schluss 121, S010 110): 7*87,8004*121 + 100*121 + 109,7505*121 + 96,5804*110 + 9596,66581
 *   = 74366,9388 + 12100 + 13279,8105 + 10623,844 + 9596,66581 = 119967,25911. Groesstes Gewicht: S008 am Tag 326 = 13279,8105 / 119967,26.
 * Dieselbe Tafel mit der Mechanik der App: nur S009 raus, S010 mit 96,5804 Stueck hinein -> Bargeld 1081,521282; Ende 9*12100 + 10623,844 + 1081,521282 = 120605,365282. */
function g1Aendern(name, t, z) { if (t === 316 && name === 'S008') z[3] = 88; if (t === 316 && name === 'S007') z[3] = 0; }
var G1 = kunst({ aendern: g1Aendern }), LG = lauf(G1, { mechanik: 'gleich' }), u1 = LG.umschichtungen[1];
ok('Gleichgewicht, erste Umschichtung = Neukauf wie die App (Kosten 199,60078, 10 Positionen)', Math.abs(LG.umschichtungen[0].kosten - 199.60078) < 1e-6 && LG.umschichtungen[0].positionenDanach === 10 && LG.umschichtungen[0].teilverkaeufe === 0);
ok('G1: 1 Verkauf, 7 Teilverkaeufe, 1 Aufstockung, 1 Neukauf, 1 ohne Kurs, 10 Positionen', u1.verkaeufe === 1 && u1.teilverkaeufe === 7 && u1.aufstockungen === 1 && u1.kaeufe === 1 && u1.ohneKurs === 1 && u1.positionenDanach === 10);
ok('G1: Teilverkauf eines Gewinners auf 87,8004 Stueck', [0, 1, 2, 3, 4, 5, 6].every(function (j) { return pos(LG, pad(j)).stueck === 87.8004; }));
ok('G1: Ziel ohne Kurs (S007) nicht gehandelt, 100 Stueck', pos(LG, 'S007').stueck === 100);
ok('G1: Aufstocken S008 auf 109,7505 Stueck', pos(LG, 'S008').stueck === 109.7505);
ok('G1: Neukauf S010 mit 96,5804 Stueck, S009 verkauft', pos(LG, 'S010').stueck === 96.5804 && !pos(LG, 'S009'));
nah('G1: Kosten auf jedes Volumen (20 Bp auf 30690,205)', u1.kosten, 61.38041, 1e-6);
nah('G1: Bargeld am Ende (der Anteil von S007 bleibt Bargeld)', LG.buch.cash, 9596.66581, 1e-6);
nah('G1: Endwert', LG.endBuch, 119967.26);
ok('G1: groesstes Gewicht S008 am letzten Tag', LG.maxGewicht.reihe === 'S008' && LG.maxGewicht.tag === TAGE[326] && Math.abs(LG.maxGewicht.anteil - 13279.8105 / 119967.26) < 1e-9);
var LGa = lauf(G1);
nah('G1 mit der Mechanik der App: Endwert 120605,37 (kein Nachjustieren)', LGa.endBuch, 120605.37);
ok('G1 mit der Mechanik der App: S000..S008 unveraendert 100 Stueck, S010 96,5804', [0, 1, 2, 3, 4, 5, 6, 7, 8].every(function (j) { return pos(LGa, pad(j)).stueck === 100; }) && pos(LGa, 'S010').stueck === 96.5804 &&
  LGa.umschichtungen[1].teilverkaeufe === 0 && LGa.umschichtungen[1].aufstockungen === 0);
/* Grundfall, groesstes Gewicht: Tage 253..314 je 10500 / 103810,38 = 10,1146 % (spaeter kleiner) */
ok('Grundfall (App): groesstes Gewicht 10500 / 103810,38 am Tag 253', Math.abs(L.maxGewicht.anteil - 10500 / 103810.38) < 1e-9 && L.maxGewicht.tag === TAGE[253]);
/* Ausschuettung am Umschichtungstag: Anspruch nach der Stueckzahl ueber die Nacht (100), nicht nach dem Handel.
 * S008 (aufgestockt auf 109,7505) und S000 (teilverkauft auf 87,8004), Ex-Tag 316, rate 1,10 / 110 = 1 % -> je 100*110*0,01 = 110; zusammen 220, nach dem Handel gutgeschrieben. */
var G1d = kunst({ aendern: g1Aendern, leser: function (n) { return n === 'S008' || n === 'S000' ? [{ _art: 'cash_dividends', ex_date: TAGE[316], rate: 1.10 }] : null; } }), LGd = lauf(G1d, { mechanik: 'gleich' });
nah('G1 mit Ausschuettung am Umschichtungstag: Summe 220 (Stueckzahl ueber die Nacht)', LGd.zaehler.ausschuettungSumme, 220, 1e-6);
nah('G1 mit Ausschuettung: Bargeld am Ende 9816,66581, Stueckzahlen unveraendert', LGd.buch.cash, 9816.66581, 1e-6);
ok('G1 mit Ausschuettung: der Handel des Tages sieht das Geld noch nicht', pos(LGd, 'S010').stueck === 96.5804 && pos(LGd, 'S008').stueck === 109.7505);
/* Fall G2: neues Ziel S010 ohne Eroeffnung am Tag 316. Depotwert 0,00922 + 9*11000 + 10780,429 = 109780,43822; Budget 10978,043822.
 * S000..S008 je (11000 - 10978,043822)/110 = 0,19960 -> 0,1996 Stueck = 21,956 Volumen, Erloes 21,912088 (neun: 197,208792); S009 ganz: 10758,868142.
 * Bargeld 10956,086154; S010 wird nicht gekauft - sein Anteil bleibt Bargeld. Kosten 0,002 * (9*21,956 + 10780,429) = 21,956066.
 * Ende: 9*99,8004*121 + 10956,086154 = 108682,6356 + 10956,086154 = 119638,721754. */
var G2 = kunst({ aendern: function (name, t, z) { if (t === 316 && name === 'S010') z[3] = 0; } }), LG2 = lauf(G2, { mechanik: 'gleich' }), u2 = LG2.umschichtungen[1];
ok('G2: neues Ziel ohne Kurs nicht gekauft (9 Positionen, 9 Teilverkaeufe, 1 ohne Kurs)', u2.kaeufe === 0 && u2.verkaeufe === 1 && u2.teilverkaeufe === 9 && u2.ohneKurs === 1 && u2.positionenDanach === 9 && !pos(LG2, 'S010'));
nah('G2: sein Anteil bleibt Bargeld', LG2.buch.cash, 10956.086154, 1e-6);
nah('G2: Kosten', u2.kosten, 21.956066, 1e-6);
nah('G2: Endwert', LG2.endBuch, 119638.72);
/* gleichgewicht() fuer sich: winzige Abweichung (unter einer halben Zehntausendstel-Aktie) wird nicht gehandelt; unbekannte Mechanik wirft */
var bk = { cash: 0, positionen: [{ sym: 'X', stueck: 10, einstand: 10, seit: 0 }, { sym: 'Y', stueck: 10, einstand: 10, seit: 0 }] }, eg = S.gleichgewicht(bk, ['X', 'Y'], { X: 100, Y: 100.0001 }, 1, 20);
ok('Gleichgewicht: Abweichung unter der Stueckelung -> kein Handel', eg.volumen === 0 && bk.positionen[0].stueck === 10 && bk.positionen[1].stueck === 10 && bk.cash === 0);
wirft('unbekannte Mechanik wirft', function () { lauf(G, { mechanik: 'anders' }); });

/* ===== 12. SPY-Ergaenzung am Kunstpanel: genau einmal gebucht =====
 * SPY 250 Stueck zu 400. Ergaenzung Ex-Tag 290, rate 2,10 / 420 = 0,5 % -> 250*420*0,005 = 525 -> +1,25 Stueck = 251,25.
 * Datei: Ex-Tag 300, rate 4,20 / 420 = 1 % -> 251,25*420*0,01 = 1055,25 -> +2,5125 Stueck = 253,7625 -> Ende 253,7625*484 = 122821,05.
 * Steht der ergaenzte Satz schon in der Datei, bleibt es bei 122821,05 (doppelt waeren es 255,025*484 = 123432,10). */
var ERG = { SPY: [{ ex_date: TAGE[290], rate: 2.10 }] }, pr1 = { ergaenzt: 0, schonInDerDatei: 0 }, pr2 = { ergaenzt: 0, schonInDerDatei: 0 };
var spyDatei = [{ _art: 'cash_dividends', ex_date: TAGE[300], rate: 4.20 }];
var LX1 = lauf(kunst({ leser: function (n) { return n === 'SPY' ? spyDatei : null; }, ergaenzungen: ERG, protokoll: pr1 }));
var LX2 = lauf(kunst({ leser: function (n) { return n === 'SPY' ? spyDatei.concat([{ _art: 'cash_dividends', ex_date: TAGE[290], rate: 2.10 }]) : null; }, ergaenzungen: ERG, protokoll: pr2 }));
var LX0 = lauf(kunst({ leser: function (n) { return n === 'SPY' ? spyDatei : null; } }));
nah('Ergaenzung fehlt in der Datei: einmal gebucht (SPY 122821,05)', LX1.endSpy, 122821.05, 1e-6);
ok('Ergaenzung fehlt in der Datei: 2 Ausschuettungen, Protokoll 1 ergaenzt', LX1.zaehler.spyAusschuettungen === 2 && pr1.ergaenzt === 1 && pr1.schonInDerDatei === 0);
nah('Satz steht schon in der Datei: nicht doppelt (SPY 122821,05)', LX2.endSpy, 122821.05, 1e-6);
ok('Satz steht schon in der Datei: 2 Ausschuettungen, Protokoll 0 ergaenzt, 1 schon da', LX2.zaehler.spyAusschuettungen === 2 && pr2.ergaenzt === 0 && pr2.schonInDerDatei === 1);
nah('ohne Ergaenzung: SPY 122210', LX0.endSpy, 122210, 1e-6);
wirft('Klinke: zwei Ergaenzungen am selben Ex-Tag', function () { S.mitErgaenzung(function () { return []; }, { SPY: [{ ex_date: 'x', rate: 1 }, { ex_date: 'x', rate: 1 }] }, null)('SPY'); });
ok('die benannte Ergaenzung ist SPY, Ex-Tag 15.06.2018, 1,2456 $', JSON.stringify(S.ERGAENZUNGEN) === '{"SPY":[{"ex_date":"2018-06-15","rate":1.2456}]}');

/* ===== 13. Die Saetze aus §1.7: beide Kunstfaelle der Fehlerform und die Grenzen =====
 * Korb 100 von 102 (Umsatz (300-j) Mio -> S000..S099), Zielzahl 10, 63 Startphasen (Starttage 253..315, Ende 326).
 * "haelt": alle Aktien ab Tag 253 taeglich +1 % (Eroeffnung = Schluss des Vortags), SPY steht bei 400 -> Buch in allen 63 Phasen vorn.
 * "haelt nicht": Aktien stehen bei 100, SPY taeglich +1 % -> Buch (minus Kosten) in keiner Phase vorn. */
function satzPanel(aktieSteigt) {
  var w = function (t) { return Math.pow(1.01, t - 252); };
  return kunst({ aendern: function (name, t, z) {
    z[4] = (300 - +name.slice(1)) * 1e6;
    if (t > 252) { z[1] = z[2] = aktieSteigt ? 100 * w(t) : 100; z[3] = aktieSteigt ? 100 * w(t - 1) : 100; }
  }, spy: function (t) { return t > 252 ? (aktieSteigt ? [400, 400] : [400 * w(t), 400 * w(t - 1)]) : null; } });
}
function satzFall(P) {
  var o = { totalverlust: HAUPT, korb: 100 }, L0 = lauf(P, o), SPh = S.startphasen(P.T, P.Q, P.M, 253, NT - 1, 63, o);
  return { L: L0, SP: SPh, satz: S.satzGegenprobe(L0.endBuch, L0.endSpy, SPh.vorDemMarkt, SPh.anzahl) };
}
var FH = satzFall(satzPanel(true)), FN = satzFall(satzPanel(false));
ok('Kunstfall "haelt": k = 0 vorn, 63 von 63 Phasen vorn', FH.L.endBuch > FH.L.endSpy && FH.SP.vorDemMarkt === 63 && FH.satz === 'hält');
ok('Kunstfall "haelt": Korb 100, Zielzahl 10, Startphasen 253..315', FH.L.umschichtungen[0].zulaessig === 100 && FH.L.umschichtungen[0].zielzahl === 10 && FH.SP.phasen[62].start === TAGE[315] && FH.SP.minimum > 0);
ok('Kunstfall "haelt nicht": k = 0 hinten, 0 von 63 Phasen vorn', FN.L.endBuch < FN.L.endSpy && FN.SP.vorDemMarkt === 0 && FN.satz === 'hält nicht' && FN.SP.maximum < 0);
nah('Kunstfall "haelt nicht": das Buch verliert nur die Kosten (100000 -> 99800,40)', FN.L.endBuch, 99800.4, 0.011);
/* Rueckschlag je Phase: im Fall mit Insolvenz (Abschnitt 2) faellt das Buch von 103810,38 auf 93310,38 = -10,1146 % */
var SPE = S.startphasen(E1.T, E1.Q, E1.M, 253, NT - 1, 3, { totalverlust: HAUPT });
nah('Rueckschlag je Startphase (k = 0: -10,1146 %)', SPE.phasen[0].rueckschlagBuch, (93310.38 / 103810.38 - 1) * 100, 1e-6);
ok('Rueckschlag-Spanne der Phasen geordnet (kleinster zuerst)', SPE.rueckschlagSpanne[0] >= SPE.rueckschlagSpanne[1] && SPE.rueckschlagSpanne[1] === SPE.phasen[0].rueckschlagBuch && SPE.rueckschlagSpanne[0] < -10);
/* groesstes Gewicht k = 0: nach der Insolvenz 10500 / 93310,38 = 11,2528 %; k = 1 von Hand: S009 am Tag 326 = 103,162*121 / 103598,5 = 12,05 % */
nah('groesstes Gewicht je Startphase in Prozent (k = 0: 11,2528 %)', SPE.phasen[0].maxGewicht, 10500 / 93310.38 * 100, 1e-6);
nah('groesstes Gewicht k = 1 (12,05 %)', SPE.phasen[1].maxGewicht, 12.05, 0.005);
ok('Satz: k = 0 vorn und 32 Phasen -> haelt; 31 Phasen -> gemischt', S.satzGegenprobe(2, 1, 32, 63) === 'hält' && S.satzGegenprobe(2, 1, 31, 63) === 'gemischt');
ok('Satz: k = 0 hinten und 31 Phasen -> haelt nicht; 32 Phasen -> gemischt', S.satzGegenprobe(1, 2, 31, 63) === 'hält nicht' && S.satzGegenprobe(1, 2, 32, 63) === 'gemischt');
ok('Satz: Gleichstand bei k = 0 zaehlt als nicht vorn (§1a.2)', S.satzGegenprobe(1, 1, 31, 63) === 'hält nicht' && S.satzGegenprobe(1, 1, 40, 63) === 'gemischt');
wirft('Satz verlangt 63 Phasen', function () { S.satzGegenprobe(2, 1, 3, 3); });
ok('zweiter Lauf: vorn und Median 8,25 +- 2,0 -> bestaetigt die Vorab-Rechnung (Grenzen eingeschlossen)', S.satzZweiterLauf(2, 1, 10.25).urteil === 'bestätigt die Vorab-Rechnung' &&
  S.satzZweiterLauf(2, 1, 6.25).urteil === 'bestätigt die Vorab-Rechnung' && S.satzZweiterLauf(2, 1, 8.25).differenzMedianPp === 0);
ok('zweiter Lauf: Median weiter als 2,0 entfernt -> weicht ab, mit Betrag', S.satzZweiterLauf(2, 1, 10.26).urteil === 'weicht ab' && S.satzZweiterLauf(2, 1, 6.24).urteil === 'weicht ab' &&
  Math.abs(S.satzZweiterLauf(2, 1, 5.25).differenzMedianPp + 3) < 1e-12);
ok('zweiter Lauf: k = 0 nicht vorn -> weicht ab, auch bei passendem Median', S.satzZweiterLauf(1, 2, 8.25).urteil === 'weicht ab' && S.satzZweiterLauf(1, 1, 8.25).k0Vorn === false);
ok('genau fuenf Laeufe, Korb 187, Fenster A und B', S.LAEUFE.length === 5 && S.LAEUFE.map(function (l) { return l.name; }).join(',') === 'A-187,A-breit,B-187,A-187-gleich,B-187-gleich' && S.KORB_N === 187 &&
  S.LAEUFE.filter(function (l) { return l.mechanik === 'gleich'; }).length === 2 && S.LAEUFE.filter(function (l) { return l.korb === 187; }).length === 4);
/* Trockenlauf des Berichts am Kunstpanel: einLauf fuer alle fuenf Laeufe (Korb 100 statt 187), Saetze, ERGEBNIS-Text.
 * Im Fall "haelt" liegt der Median der Abstaende weit ueber 8,25 +- 2,0 -> der zweite Satz lautet "weicht ab" (prueft den Zweig mit Betrag). */
(function () {
  var P = satzPanel(true), regeln = { haupt: HAUPT, streng: K.EMPFINDLICHKEIT[1].totalverlust, milde: MILDE };
  var E = { kennung: 'kunst', panelKennung: 'kunst', korrekturen: [], laeufe: {}, saetze: {}, selbstpruefung: { buchEnde: 1, spyEnde: 2, sollBuch: 1, sollSpy: 2, bestanden: true },
    spy: { jeFenster: { A: 18, B: 20 }, ergaenzt: 1, schonInDerDatei: 0 } };
  S.LAEUFE.forEach(function (def) {
    E.laeufe[def.name] = S.einLauf(P.T, P.Q, P.M, { name: def.name, fenster: def.fenster, korb: def.korb ? 100 : null, mechanik: def.mechanik, rolle: def.rolle }, 253, NT - 1, regeln, null);
  });
  S.saetzeBilden(E);
  var zeilen = S.ergebnisText(E).split('\n'), a = E.laeufe['A-187'], gl = E.laeufe['A-187-gleich'], tab = zeilen.filter(function (z) { return z.charAt(0) === '|'; });
  ok('Trockenlauf: erste Zeile ist der Satz zur Gegenprobe mit Urteil und Zahlen', zeilen[0].indexOf('Gegenprobe A-187') === 0 && zeilen[0].indexOf('**hält**') > 0 && zeilen[0].indexOf('63 von 63 Startphasen vorn') > 0 &&
    E.saetze.gegenprobe.urteil === 'hält');
  ok('Trockenlauf: zweite Zeile ist der Satz zum zweiten Lauf (hier: weicht ab, mit Betrag)', zeilen[2].indexOf('Zweiter Lauf B-187') === 0 && zeilen[2].indexOf('**weicht ab** (Median um +') > 0 &&
    E.saetze.zweiterLauf.urteil === 'weicht ab' && E.saetze.zweiterLauf.k0Vorn === true);
  ok('Trockenlauf: eine Tabelle mit allen fuenf Laeufen', tab.length >= 16 && tab[0].indexOf('**A-187** | **A-breit** | **B-187** | **A-187-gleich** | **B-187-gleich**') > 0 &&
    tab.every(function (z) { return z.split('|').length === 8; }));
  ok('Trockenlauf: je Lauf 63 Phasen, k = 0 = Hauptzahl, Periodenstreuung, Kalenderjahre, groesstes Gewicht, gehaltene Werte', S.LAEUFE.every(function (def) {
    var l = E.laeufe[def.name];
    return l.zufallsbereich.startphasen.phasen.length === 63 && Math.abs(l.zufallsbereich.startphasen.phasen[0].abstandPa - l.haupt.abstandPa) < 1e-9 && l.zufallsbereich.periodenstreuung.n === 2 &&
      l.kalenderjahre.length === 2 && l.haupt.groesstesGewicht.prozent > 9 && l.haupt.gehalteneWerte[1] === 10 && l.nachrichtlich.kursertrag.buchGesamt === l.haupt.buchGesamt;
  }));
  ok('Trockenlauf: die Variante handelt anders (Teilverkaeufe und Aufstockung), die App-Mechanik nicht', gl.haupt.teilverkaeufe > 0 && gl.haupt.aufstockungen > 0 && a.haupt.teilverkaeufe === 0 && a.haupt.aufstockungen === 0 &&
    gl.haupt.kostenGezahlt > a.haupt.kostenGezahlt && gl.mechanik === 'Gleichgewicht' && a.mechanik === 'wie die App');
})();

/* Diagnose der Ausschuettungsluecken (nachrichtlich): 65 Handelstage = 91 Kalendertage. S000 zahlt an den Tagen 0, 65, 130, 260, 325 - die Zahlung
 * am Tag 195 fehlt (Abstand 182 Tage); S001 zahlt lueckenlos. Gemeldet wird nur S000 und nur fuer eine Haltezeit, die die Luecke schneidet. */
(function () {
  var mk = function (tage) { return tage.map(function (t) { return { _art: 'cash_dividends', ex_date: TAGE[t], rate: 0.1 }; }); };
  var P = kunst({ leser: function (n) { return n === 'S000' ? mk([0, 65, 130, 260, 325]) : n === 'S001' ? mk([0, 65, 130, 195, 260, 325]) : null; } });
  var hz = [{ reihe: 'S000', von: 253, bis: 326 }, { reihe: 'S001', von: 253, bis: 326 }], lu = S.ausschuettungsLuecken(P.T, P.Q, P.M, hz, 4);
  ok('Luecken-Diagnose: fehlende Quartalszahlung in der Haltezeit gemeldet (S000, 182 Tage), lueckenloser Zahler nicht', lu.length === 1 && lu[0].reihe === 'S000' && lu[0].tage === 182 &&
    lu[0].exVorher === TAGE[130] && lu[0].exNachher === TAGE[260]);
  ok('Luecken-Diagnose: Haltezeit nach der Luecke wird nicht gemeldet; unter der Mindestzahl an Ex-Tagen keine Meldung', S.ausschuettungsLuecken(P.T, P.Q, P.M, [{ reihe: 'S000', von: 270, bis: 326 }], 4).length === 0 &&
    S.ausschuettungsLuecken(P.T, P.Q, P.M, hz).length === 0);
})();

/* ================= Teil III: echtes Panel (kein Ertrag der fuenf Laeufe) ================= */
var PR = require(path.join(R.PRUEFSTAND, 'pruefstand.js'));
var T = PR.Tafel(R.PANEL_ORDNER), Q = R.vorbereiten(T), g = T.g;

/* ===== 8. (amtlich) rohMap an einem Stichtag, 30 Werte ===== */
var erster = R.tagAb(T, Q, R.FENSTER_VON), s0 = Q.ptage[Q.ord[erster] - 1];
ok('Fenster B: erster Tag 16.09.2021, letzter Panel-Tag 15.09.2026, 1254 Handelstage', String(T.kal.tage[erster]) === R.FENSTER_VON && String(T.kal.tage[T.maxTag]) === R.FENSTER_BIS &&
  Q.ord[T.maxTag] - Q.ord[erster] + 1 === 1254);
var roh = R.rohMapAm(T, Q, s0), erg = MH.momentumZiel(roh, { nowMs: Q.ms[s0] });
ok('echtes Panel: Rangfolge gebildet (nicht zuWenig)', !erg.zuWenig && erg.rangfolge.length >= 100);
var probe = erg.rangfolge.slice().sort(function (a, b) { return a.sym < b.sym ? -1 : 1; }).slice(0, 30), stimmtSt = 0, stimmtU = 0;
probe.forEach(function (p) {
  var sym = T.symIdx[p.sym], z = T.symZeilen[R.endeBis(T, sym, s0) - 1];
  var z21 = T.zurueck(z, 21), z252 = T.zurueck(z, 252);
  if (Math.abs(p.staerke - (g.bSchluss[z21] / g.bSchluss[z252] - 1)) < 1e-12) stimmtSt++;
  var u = [];
  for (var k = 0; k < 20; k++) u.push(g.umsatz[k === 0 ? z : T.zurueck(z, k)]);
  u.sort(function (a, b) { return a - b; });
  if (Math.abs(p.umsatz / u[10] - 1) < 1e-9) stimmtU++;
});
ok('30 Werte: Staerke = bSchluss vor 21 Zeilen / bSchluss vor 252 Zeilen - 1', probe.length === 30 && stimmtSt === 30);
ok('30 Werte: Umsatz = Median der 20 Panel-Umsaetze', stimmtU === 30);
ok('echtes Panel: keine Referenzreihe in rohMap und Ziel', !('SPY' in roh) && erg.ziel.every(function (n) { return !T.stand.symbole[T.symIdx[n]].referenz; }) &&
  T.stand.symbole.filter(function (x) { return x.referenz; }).every(function (x) { return !(x.reihe in roh); }));
ok('echtes Panel: SPY ist Referenzreihe mit Zeile am ersten und letzten Fenstertag', T.stand.symbole[T.symIdx.SPY].referenz === true && T.zeileVon(T.symIdx.SPY, erster) >= 0 && T.zeileVon(T.symIdx.SPY, T.maxTag) >= 0);
ok('Kostensatz und Konfiguration des Buchs', R.KOSTEN_BP === 20 && MH.buchKonfig().halten === 63 && MH.buchKonfig().mindestWerte === 100 && MH.buchKonfig().umsatzMin === 1e8);

/* ===== 14. Fenster A und B am echten Panel ===== */
var F = null;
try { F = S.fensterTage(T, Q); } catch (e) { console.log('   ' + e.message); }
ok('Fenster-Klinken laufen durch (A: 04.01.2017-15.09.2021, 1183 Tage; B: 16.09.2021-15.09.2026, 1254 Tage)', !!F);
if (!F) { console.log(gut + ' Pruefungen gruen, ' + schlecht + ' rot - Abbruch, die Fenster stehen nicht'); process.exit(1); }
var sA = Q.ptage[252];
ok('Panel beginnt am 04.01.2016; der 253. Panel-Tag ist der 03.01.2017, der Tag danach der 04.01.2017', String(T.kal.tage[Q.ptage[0]]) === '2016-01-04' && String(T.kal.tage[sA]) === '2017-01-03' &&
  !!F && F.A.von === Q.ptage[253] && String(T.kal.tage[F.A.von]) === '2017-01-04');
ok('Fenster A endet am 15.09.2021, dem Handelstag vor Fenster B', !!F && String(T.kal.tage[F.A.bis]) === '2021-09-15' && Q.ord[F.A.bis] + 1 === Q.ord[F.B.von] && F.B.von === erster);
ok('Fenster A: 18 volle Perioden und eine angebrochene mit 49 Handelstagen (Ausfuehrungstage 253 + 63 j bis 1435)', Math.floor((Q.ord[F.A.bis] - Q.ord[F.A.von]) / 63) === 18 && (Q.ord[F.A.bis] - Q.ord[F.A.von]) % 63 === 48);
var zA = S.zielAm(T, Q, sA, S.KORB_N), bA = S.zielAm(T, Q, sA, null);
ok('Stichtag 03.01.2017: Korb voll (187 von 187 zulaessig), Zielzahl 19', zA.zulaessig === 187 && zA.geprueft === 187 && zA.ziel.length === 19 && zA.korb.length === 187 && bA.zulaessig >= 187);
ok('Stichtag 03.01.2017: kein Wert mit weniger als 253 Zeilen im Ziel und im Korb', zA.korb.concat(zA.ziel).every(function (n) { var i = T.symIdx[n]; return R.endeBis(T, i, sA) - T.symStart[i] >= 253; }));
ok('Stichtag 03.01.2017: Ziel ist Teil des Korbs, keine Referenzreihe', zA.ziel.every(function (n) { return zA.korb.indexOf(n) >= 0 && !T.stand.symbole[T.symIdx[n]].referenz; }));

/* ===== 15. Korbauswahl am echten Panel, Stichtag 03.01.2017: von Hand (ohne momentumZiel) aus den Panel-Zeilen nachgerechnet ===== */
function zulaessigVonHand(s) {
  var aus = [];
  for (var sym = 0; sym < T.nSym; sym++) {
    if (T.stand.symbole[sym].referenz) continue;
    var a = T.symStart[sym], e = R.endeBis(T, sym, s);
    if (e - a < 253) continue;                                                       /* Mindestlaenge */
    var z = T.symZeilen[e - 1];
    if (Q.ms[s] - Q.ms[g.tag[z]] > 7 * 86400000) continue;                           /* veraltet */
    if (!(g.bSchluss[z] > 0) || !(g.bSchluss[T.symZeilen[e - 22]] > 0) || !(g.bSchluss[T.symZeilen[e - 253]] > 0)) continue;
    var u = [];
    for (var q = e - 20; q < e; q++) u.push(g.umsatz[T.symZeilen[q]]);
    u.sort(function (x, y) { return x - y; });
    if (!(u[10] >= 1e8)) continue;                                                   /* Median-Tagesumsatz >= 100 Mio $ */
    aus.push({ sym: T.symName[sym], umsatz: u[10] });
  }
  return aus.sort(function (x, y) { return y.umsatz - x.umsatz || (x.sym < y.sym ? -1 : 1); });
}
var hand = zulaessigVonHand(sA);
ok('von Hand: gleich viele zulaessige Werte wie momentumZiel', hand.length === bA.zulaessig);
ok('von Hand: dieselben 187 Werte in derselben Reihenfolge', hand.length >= 188 && JSON.stringify(hand.slice(0, 187).map(function (x) { return x.sym; })) === JSON.stringify(zA.korb));
ok('von Hand: fuenf Werte (Rang 1, 2, 94, 186, 187) mit demselben Median-Umsatz', [0, 1, 93, 185, 186].every(function (i) { return Math.abs(zA.korbUmsatz[i] / hand[i].umsatz - 1) < 1e-9; }));
ok('von Hand: der 188. Wert hat weniger Umsatz als der 187., alle Korbwerte >= 100 Mio $', hand[187].umsatz < hand[186].umsatz && zA.korbUmsatz[186] >= 1e8 && zA.korbUmsatz[0] >= zA.korbUmsatz[186]);

/* ===== 16. SPY-Ausschuettungen am echten Panel (Massnahmen-Archiv nur gelesen) ===== */
var prot = { ergaenzt: 0, schonInDerDatei: 0 }, M = S.Massnahmen(T, Q, S.dateiLeser(null), S.ERGAENZUNGEN, prot), M0 = S.Massnahmen(T, Q, S.dateiLeser(null), {}, null);
var spy = T.symIdx.SPY, zMit = F ? S.spyZaehlung(T, Q, M, F) : null, zOhne = F ? S.spyZaehlung(T, Q, M0, F) : null, tErg = R.tagAb(T, Q, '2018-06-15');
ok('SPY mit Ergaenzung: 18 Ausschuettungen im Fenster A, 20 im Fenster B', !!zMit && zMit.jeFenster.A === 18 && zMit.jeFenster.B === 20);
ok('SPY mit Ergaenzung: in jedem vollen Kalenderjahr 2017 bis 2025 vier', !!zMit && [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].every(function (j) { return zMit.jeJahr[j] === 4; }));
ok('SPY ohne Ergaenzung: 17 im Fenster A, 2018 nur drei', !!zOhne && zOhne.jeFenster.A === 17 && zOhne.jeFenster.B === 20 && zOhne.jeJahr[2018] === 3);
ok('die ergaenzte Ausschuettung steht genau einmal am 15.06.2018 (1,2456 $)', String(T.kal.tage[tErg]) === '2018-06-15' && JSON.stringify(M(spy).nachTag[tErg]) === '[1.2456]' && !M0(spy).nachTag[tErg] &&
  prot.ergaenzt === 1 && prot.schonInDerDatei === 0);
var klinkeOk = false;
try { S.spyKlinken(T, Q, M, F); klinkeOk = true; } catch (e2) { console.log('   ' + e2.message); }
ok('SPY-Klinken laufen durch', klinkeOk);
wirft('SPY-Klinken werfen ohne die Ergaenzung', function () { S.spyKlinken(T, Q, M0, F); });
/* Gegenprobe des PM (§1.6): Schluss 03.01.2017 bis Schluss 15.09.2021, Wiederanlage am Ex-Tag zum Schluss: mit Ergaenzung +115,95 %, ohne +114,98 % */
function spyGesamt(Mx) {
  var st = 1;
  for (var o = 253; o <= Q.ord[F.A.bis]; o++) {
    var d = Q.ptage[o], z = T.zeileVon(spy, d);
    R.ausschuettungenAm(T, Q, Mx, spy, d).forEach(function (a) { st += st * a.basis * a.satz / g.bSchluss[z]; });
  }
  return (st * g.bSchluss[T.zeileVon(spy, F.A.bis)] / g.bSchluss[T.zeileVon(spy, sA)] - 1) * 100;
}
nah('Gegenprobe des PM: SPY mit Ergaenzung +115,95 %', F ? spyGesamt(M) : NaN, 115.95);
nah('Gegenprobe des PM: SPY ohne Ergaenzung +114,98 %', F ? spyGesamt(M0) : NaN, 114.98);

/* ===== 17. Selbstpruefung (§1.8): breiter Korb, Fenster B, Mechanik der App = die amtliche Zahl ===== */
var LB = S.simuliere(T, Q, M, { startTag: F.B.von, endTag: F.B.bis, totalverlust: HAUPT });
ok('Selbstpruefung: Endwert Buch 165.209,66 $', Math.round(LB.endBuch * 100) === 16520966);
ok('Selbstpruefung: Endwert SPY 181.193,87 $', Math.round(LB.endSpy * 100) === 18119387);
var LR = R.simuliere(T, Q, R.Massnahmen(T, Q), { startTag: F.B.von, endTag: F.B.bis, totalverlust: HAUPT });
ok('Selbstpruefung: jeder der 1254 Tageswerte (Buch, SPY, Bargeld) gleich dem amtlichen Rechner', LB.tage.length === 1254 && LR.tage.length === 1254 &&
  LB.tage.every(function (x, i) { return x.tag === LR.tage[i].tag && x.buch === LR.tage[i].buch && x.spy === LR.tage[i].spy && x.bar === LR.tage[i].bar; }));
ok('Selbstpruefung: Umschichtungen, Kosten, Reihenenden, Ausschuettungen gleich', LB.zaehler.umschichtungen === LR.zaehler.umschichtungen && LB.zaehler.kosten === LR.zaehler.kosten &&
  LB.reihenenden.length === LR.reihenenden.length && LB.zaehler.ausschuettungen === LR.zaehler.ausschuettungen && LB.zaehler.spyAusschuettungen === 20 && LB.zaehler.kaeufe === LR.zaehler.kaeufe);

console.log(gut + ' Pruefungen gruen, ' + schlecht + ' rot');
process.exit(schlecht ? 1 : 0);
