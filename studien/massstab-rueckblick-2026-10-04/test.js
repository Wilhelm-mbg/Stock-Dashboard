'use strict';
/* Pruefungen zu Auftrag Nr. 74 (§2). Aufruf aus der Repo-Wurzel:
 *   node --max-old-space-size=6144 studien/massstab-rueckblick-2026-10-04/test.js
 * Die Sollwerte der Kunstfaelle sind von Hand gerechnet (Rechenweg in den Kommentaren). Der Teil auf dem echten Panel
 * prueft nur die rohMap an EINEM Stichtag und 30 Werten und gibt keine Ertraege aus. */
var path = require('path');
var R = require('./rueckblick.js');
var REPO = path.resolve(__dirname, '..', '..');
var MH = require(path.join(REPO, 'mfhandel.js'));
var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 0.006 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function wirft(name, f) { var w = false; try { f(); } catch (e) { w = true; } ok(name, w); }

/* ---------- Kunstpanel ---------- */
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
  for (var t2 = 0; t2 < NT; t2++) { var ks = spyKurs(t2); sz.push([t2, ks[0], ks[0], ks[1], 2e8]); }
  reihen.push({ reihe: 'SPY', zeilen: sz, referenz: opt.spyAlsAktie ? false : true });
  var T = kunstTafel(TAGE, reihen), Q = R.vorbereiten(T);
  return { T: T, Q: Q, M: R.Massnahmen(T, Q, opt.leser || function () { return null; }) };
}
var HAUPT = K.EMPFINDLICHKEIT[0].totalverlust, MILDE = K.EMPFINDLICHKEIT[2].totalverlust;
function lauf(P, extra) {
  var o = { startTag: 253, endTag: NT - 1, totalverlust: HAUPT };
  Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
  return R.simuliere(P.T, P.Q, P.M, o);
}
function pos(L, name) { return L.buch.positionen.filter(function (p) { return p.sym === name; })[0]; }
function wertAm(L, tag) { return L.tage.filter(function (x) { return x.tag === tag; })[0]; }

/* ===== 1. Grundfall, von Hand =====
 * Tag 253: Ziel S000..S009 (Staerke 100 % .. 91 %), Eroeffnung je 100. Budget 100000/10 = 10000 -> 100 Stueck, je 100*100*1,002 = 10020.
 * Neun Kaeufe = 90180, Rest 9820; der zehnte (S009) wird verkleinert: floor(9820/100,2*10000)/10000 = 98,0039 Stueck = 9819,99078 -> Bargeld 0,00922.
 * Kosten 0,002 * (90000 + 9800,39) = 199,60078. Schluss Tag 253: 900*105 + 98,0039*95 + 0,00922 = 103810,37972.
 * Schluss Tag 315 (alle 110): 99000 + 10780,429 + 0,00922 = 109780,43822 -> Periode 1: +9,78044 %; SPY 400 -> 440 = +10 %.
 * Tag 316: Ziel S000..S008 + S010. Verkauf S009: 98,0039*110*0,998 = 10758,868142 -> Bargeld 10758,877362. Kauf S010 zu 100: Budget 10978,04 reicht nicht,
 * floor(10758,877362/100,2*10000)/10000 = 107,3740 Stueck = 10758,8748 -> Bargeld 0,002562. Kosten 21,560858 + 21,4748.
 * Schluss Tag 326: 900*121 + 107,3740*110 + 0,002562 = 120711,142562; SPY 250*484 = 121000. */
var G = kunst(), L = lauf(G), kz = R.kennzahlen(G.Q, L);
ok('Ziel am Stichtag 252 = S000..S009', JSON.stringify(R.zielAm(G.T, G.Q, 252).ziel) === JSON.stringify([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(pad)));
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
ok('Gegenprobe: ein Kurs VOR dem Stichtag aendert das Ziel', rang(G, 252) !== rang(GP, 252) && R.zielAm(GP.T, GP.Q, 252).ziel[0] === 'S050');
ok('Gegenprobe: dieselbe Stoerung ab Tag 231 (im Fenster der Staerke) aendert die Rangfolge', rang(G, 252) !== rang(kunst({ aendern: stoer(230) }), 252));

/* ===== 5. Referenzreihe nie im Ziel ===== */
ok('SPY (Staerke 900 %) nicht in der rohMap', !('SPY' in R.rohMapAm(G.T, G.Q, 252)) && !('SPY' in R.rohMapAm(G.T, G.Q, 315)));
ok('SPY in keinem Ziel des Laufs', [252, 315].every(function (s) { return R.zielAm(G.T, G.Q, s).ziel.indexOf('SPY') < 0; }));
var GA = kunst({ spyAlsAktie: true });
ok('Gegenprobe: ohne das Merkmal stuende SPY an der Spitze', MH.momentumZiel(R.rohMapAm(GA.T, GA.Q, 252), { nowMs: GA.Q.ms[252] }).ziel[0] === 'SPY');
wirft('Klinke wirft bei Referenzreihe im Ziel', function () { R.klinkeReferenz(G.T, G.Q, ['S000', 'SPY']); });

/* ===== 6. Die beiden Kunstfaelle der Fehlerform =====
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
var SP = R.startphasen(G.T, G.Q, G.M, 253, NT - 1, 3, HAUPT);
ok('Startphasen: k = 0 ist die Hauptzahl, Starttage 253/254/255', SP.phasen.length === 3 && Math.abs(SP.phasen[0].abstandPa - kz.abstandPa) < 1e-12 &&
  SP.phasen[1].start === TAGE[254] && SP.phasen[2].start === TAGE[255] && SP.minimum <= SP.median && SP.median <= SP.maximum);
var PS = R.periodenstreuung([1, 2, 3, 6].map(function (v) { return { abstand: v }; }));   /* Mittel 3, s = sqrt(14/3) = 2,160247, SE 1,080123, t(3) = 3,182 */
nah('Periodenstreuung Mittel', PS.mittel, 3, 1e-12); nah('Standardfehler', PS.standardfehler, 1.080123, 1e-6);
nah('95-%-Band', PS.band95[1] - PS.band95[0], 2 * 3.182 * 1.080123, 1e-5);
nah('Median ungerade/gerade', R.median([5, 1, 9]) + R.median([4, 1, 2, 3]), 5 + 2.5, 1e-12);
nah('groesster Rueckschlag', R.maxRueckschlag([100, 120, 90, 130, 117]), -25, 1e-9);

/* ===== 8. Echtes Panel: rohMap an einem Stichtag, 30 Werte (keine Ertraege) ===== */
var PR = require(path.join(R.PRUEFSTAND, 'pruefstand.js'));
var T = PR.Tafel(R.PANEL_ORDNER), Q = R.vorbereiten(T), g = T.g;
var erster = R.tagAb(T, Q, R.FENSTER_VON), s0 = Q.ptage[Q.ord[erster] - 1];
ok('Fenster: erster Tag 16.09.2021, letzter Panel-Tag 15.09.2026, 1254 Handelstage', String(T.kal.tage[erster]) === R.FENSTER_VON && String(T.kal.tage[T.maxTag]) === R.FENSTER_BIS &&
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

console.log(gut + ' Pruefungen gruen, ' + schlecht + ' rot');
process.exit(schlecht ? 1 : 0);
