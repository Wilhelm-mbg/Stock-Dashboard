'use strict';
/* Pruefungen des gemeinsamen Rechners kern.js an Kunstdaten mit von Hand gerechneten Sollwerten (REGEL.md §2-§8).
 * Aufruf aus der Repo-Wurzel: node studien/trendfilter-messung-2026-10/test-kern.js
 * Die Sollwerte der Buchfaelle sind mit den Formeln aus REGEL §3 einzeln nachgerechnet (Rechenweg in den Kommentaren). */
var K = require('./kern.js');

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('ROT  ' + name); } }
function nah(name, ist, soll, tol) {
  var b = Math.abs(ist - soll) <= (tol == null ? 1e-6 : tol);
  if (!b) console.log('   ist ' + ist + ' soll ' + soll);
  ok(name, b);
}
function wirft(name, f) { var w = false; try { f(); } catch (e) { w = true; } ok(name, w); }

/** Kunstreihe im Format von laden.lies: zeilen [[tag, o, c], ...], div [[tag, betrag], ...]. */
function reihe(sym, zeilen, div) {
  return { sym: sym, zeilen: zeilen.map(function (z) { return { tag: z[0], o: z[1], c: z[2] }; }),
    div: (div || []).map(function (d) { return { tag: d[0], betrag: d[1] }; }) };
}

/* ---------- Fall 1: Erstkauf, Wechsel, Kosten, Ausschuettung (REGEL §3.2-§3.4) ----------
 * Tage t0..t3 = 02.01., 03.01., 06.01., 07.01.2020. SPY: o/c 100/100, 110/108, 107/106, 105/104; Ausschuettung 2,00 am t2.
 * BIL: 50/50, 50/50,5, 50,5/50,4, 50,4/50,6; Ausschuettung 0,10 am t3. Ziel: SPY, BIL, BIL, SPY.
 * t0: Stueck SPY = 100000/(100*1,002) = 998,003992015968; Wert 99800,3992015968; Kosten 199,6007984031894.
 * t1: Verkauf 998,004*110 = 109780,43912175648, Erloes *0,998 = 109560,87824351297, Kauf /1,002 = 109342,19385580136,
 *     Stueck BIL = /50 = 2186,843877116027; Wert *50,5 = 110435,61579435937.
 * t2: SPY-Ausschuettung gehoert nicht dem Buch (Vortag BIL); Wert *50,4 = 110216,93140664777.
 * t3: BIL-Ausschuettung 2186,8439*0,10 = 218,68438771160274 gehoert dem Buch (ueber Nacht gehalten, zur Eroeffnung verkauft);
 *     Verkauf 2186,8439*50,4 -> Erloes 109996,49754383447 -> Stueck SPY /1,002/105 = 1045,4947014906802;
 *     Ausschuettung zum Schluss in SPY: +218,6844/104 -> 1047,5974359879071; Wert *104 = 108950,13334274234.
 * Kosten gesamt 1077,833814484645. Massstab: 1000 Stueck; am t2 2,00 je Stueck = 2000 $ zu 106 -> 1018,8679245283018; t3 *104 = 105962,26415094339. */
var tage1 = ['2020-01-02', '2020-01-03', '2020-01-06', '2020-01-07'];
var D1 = K.baueDaten({
  SPY: reihe('SPY', [[tage1[0], 100, 100], [tage1[1], 110, 108], [tage1[2], 107, 106], [tage1[3], 105, 104]], [[tage1[2], 2]]),
  BIL: reihe('BIL', [[tage1[0], 50, 50], [tage1[1], 50, 50.5], [tage1[2], 50.5, 50.4], [tage1[3], 50.4, 50.6]], [[tage1[3], 0.1]])
}, '2026-09-15');
var z1 = ['SPY', 'BIL', 'BIL', 'SPY'];
var l1 = K.simuliere(D1, z1, 0, 3, {});
nah('F1 Wert t0', l1.werte[0], 99800.39920159681);
nah('F1 Wert t1 nach Wechsel', l1.werte[1], 110435.61579435937);
nah('F1 Wert t2 (fremde Ausschuettung zaehlt nicht)', l1.werte[2], 110216.93140664777);
nah('F1 Endwert (Ausschuettung trotz Verkauf am Ex-Tag)', l1.endwert, 108950.13334274234);
nah('F1 Kosten', l1.kosten, 1077.833814484645);
ok('F1 Erstkauf SPY am t0, kein Wechsel', l1.erstkauf.reihe === 'SPY' && l1.erstkauf.tag === tage1[0]);
ok('F1 zwei Wechsel mit Tagen', l1.wechsel.length === 2 && l1.wechsel[0].tag === tage1[1] && l1.wechsel[0].nach === 'BIL' && l1.wechsel[1].tag === tage1[3] && l1.wechsel[1].nach === 'SPY');
ok('F1 eine Ausschuettung gebucht', l1.ausschuettungen === 1);
ok('F1 keine fehlenden Kurse', l1.fehlend.length === 0);
var m1 = K.massstab(D1, 0, 3);
nah('F1 Massstab Endwert', m1.lauf.endwert, 105962.26415094339);
nah('F1 Massstab ohne Kosten', m1.lauf.kosten, 0);
ok('F1 Massstab ist gemerkt', K.massstab(D1, 0, 3) === m1);

/* Gegenprobe zu F1: wer die Reihe erst zur Eroeffnung des Ex-Tags kauft, bekommt nichts. Ziel SPY ab t2 (Kauf am Ex-Tag t2). */
var l1b = K.simuliere(D1, ['BIL', 'BIL', 'SPY', 'SPY'], 0, 3, {});
ok('F1b Kauf am Ex-Tag: keine SPY-Ausschuettung', l1b.ausschuettungen === 0);

/* ---------- Fall 2: immer SPY = Massstab / 1,002 (Nullpunkt) ---------- */
var l2 = K.simuliere(D1, K.konstant(D1, 'SPY'), 0, 3, {});
nah('F2 immer SPY = Massstab / 1,002', l2.endwert, m1.lauf.endwert / 1.002, 1e-7);
ok('F2 keine Wechsel', l2.wechsel.length === 0);
var l2b = K.simuliere(D1, K.konstant(D1, 'SPY'), 0, 3, { kosten: 0 });
nah('F2 ohne Kosten = Massstab', l2b.endwert, m1.lauf.endwert, 1e-7);

/* ---------- Fall 3: N1 - Wechsel zum Schluss des Signaltags ----------
 * Ziel wie F1 (SPY, BIL, BIL, SPY): mit Ausfuehrung zum Schluss wird SPY->BIL am Schluss von t0 (Signaltag fuer t1) gehandelt
 * und BIL->SPY am Schluss von t2. t0: Erstkauf zur Eroeffnung 998,003992015968 SPY; Schluss t0: Verkauf zu 100 -> Erloes
 * 99600,7984031936*... = 998,004*100*0,998 = 99600,79840319361, Kauf BIL /1,002/50 = 1988,0399681276. Wert t0 = 1988,04*50 = 99402,0
 * t1: 1988,04*50,5; t2: Schluss: BIL->SPY: 1988,04*50,4*0,998/1,002/106 = Stueck SPY; SPY-Ausschuettung am t2 gehoert dem Buch NICHT
 * (Vortag BIL). t3: BIL-Ausschuettung am t3 gehoert dem Buch NICHT (am Schluss t2 verkauft). Endwert = Stueck SPY * 104. */
var l3 = K.simuliere(D1, z1, 0, 3, { ausfuehrung: 'schluss' });
var u3 = 100000 / 1.002 / 100;
var b3 = u3 * 100 * 0.998 / 1.002 / 50;
var s3 = b3 * 50.4 * 0.998 / 1.002 / 106;
nah('F3 N1 Wert t0 (Wechsel zum Schluss)', l3.werte[0], b3 * 50);
nah('F3 N1 Endwert', l3.endwert, s3 * 104);
ok('F3 N1 Wechseltage = Signaltage', l3.wechsel.length === 2 && l3.wechsel[0].tag === tage1[0] && l3.wechsel[1].tag === tage1[2]);
ok('F3 N1 keine Ausschuettung', l3.ausschuettungen === 0);
/* N1 am Endtag: kein Wechsel zum Schluss des letzten Tages */
var l3b = K.simuliere(D1, ['SPY', 'SPY', 'SPY', 'BIL'], 0, 2, { ausfuehrung: 'schluss' });
ok('F3 N1 kein Wechsel am Schluss des Endtags', l3b.wechsel.length === 0);

/* ---------- Fall 4: fehlende Kurse (§3.5, Lesart L3) ----------
 * BIL ohne Eroeffnung am t1 -> Wechsel zum Schluss t1 (gezaehlt). BIL ganz ohne Zeile am t1 -> Wechsel am t2 (gezaehlt). */
var D4 = K.baueDaten({
  SPY: reihe('SPY', [[tage1[0], 100, 100], [tage1[1], 110, 108], [tage1[2], 107, 106], [tage1[3], 105, 104]]),
  BIL: reihe('BIL', [[tage1[0], 50, 50], [tage1[1], null, 50.5], [tage1[2], 50.5, 50.4], [tage1[3], 50.4, 50.6]])
}, '2026-09-15');
var l4 = K.simuliere(D4, ['SPY', 'BIL', 'BIL', 'BIL'], 0, 3, {});
ok('F4 Eroeffnung fehlt: Schluss genommen und gezaehlt', l4.wechsel.length === 1 && l4.wechsel[0].tag === tage1[1] && l4.fehlend.length === 1);
nah('F4 Kaufpreis = Schluss 50,5', l4.werte[1], 100000 / 1.002 / 100 * 110 * 0.998 / 1.002 / 50.5 * 50.5);
var D4b = K.baueDaten({
  SPY: reihe('SPY', [[tage1[0], 100, 100], [tage1[1], 110, 108], [tage1[2], 107, 106], [tage1[3], 105, 104]]),
  BIL: reihe('BIL', [[tage1[0], 50, 50], [tage1[2], 50.5, 50.4], [tage1[3], 50.4, 50.6]])
}, '2026-09-15');
var l4b = K.simuliere(D4b, ['SPY', 'BIL', 'BIL', 'BIL'], 0, 3, {});
ok('F4b ohne Zeile: Wechsel verschoben auf t2', l4b.wechsel.length === 1 && l4b.wechsel[0].tag === tage1[2] && l4b.fehlend.length === 1);
nah('F4b am t1 noch SPY bewertet', l4b.werte[1], 100000 / 1.002 / 100 * 108);
var l4c = K.simuliere(D4b, ['BIL', 'BIL', 'BIL', 'BIL'], 0, 3, {});
ok('F4c gehaltene Reihe ohne Zeile: letzter Schluss, gezaehlt', l4c.werte[1] === l4c.werte[0] && l4c.fehlend.some(function (f) { return f.art === 'Bewertung zum letzten Schluss'; }));

/* ---------- Fall 5: Kalender, Gesamtertragsindex, Monatsenden (§2.4, §2.5, Lesart L5) ---------- */
var tage5 = ['2020-01-30', '2020-01-31', '2020-02-03', '2020-02-28', '2020-03-02', '2020-03-31', '2020-04-01'];
var D5 = K.baueDaten({
  SPY: reihe('SPY', tage5.map(function (t, i) { return [t, 100 + i, 100 + i]; }), [['2020-02-01', 1]]),
  BIL: reihe('BIL', tage5.slice(2).map(function (t) { return [t, 10, 10]; }), [['2020-02-28', 0.5]])
}, '2026-09-15');
ok('F5 Monatsenden 31.01., 28.02., 31.03.; letzter Tag keins', D5.monatsende[1] === 1 && D5.monatsende[3] === 1 && D5.monatsende[5] === 1 && D5.monatsende[6] === 0 && D5.monatsende[0] === 0);
/* Ausschuettung am Samstag 01.02. -> am Montag 03.02. gebucht: TR(03.02.) = TR(31.01.) * (102 + 1) / 101 */
nah('F5 TR mit verschobenem Ex-Tag', D5.reihen.SPY.tr[2] / D5.reihen.SPY.tr[1], 103 / 101);
ok('F5 Verschiebung gezaehlt', D5.zaehlung.exTagVerschoben.length === 1);
nah('F5 TR BIL: Ausschuettung 0,5 bei Kurs 10', D5.reihen.BIL.tr[3] / D5.reihen.BIL.tr[2], 10.5 / 10);
ok('F5 TR vor der ersten Zeile NaN', isNaN(D5.reihen.BIL.tr[1]) && D5.reihen.BIL.tr[2] === 1);
ok('F5 monatsendeVor zwei Monate', K.monatsendeVor(D5, 5, 2) === 1 && K.monatsendeVor(D5, 5, 1) === 3 && K.monatsendeVor(D5, 5, 3) === -1);
var zm = K.monatlich(D5, function (m) { return 'M' + m; });
ok('F5 monatlich: Ziel ab dem Tag nach dem Monatsende', zm[0] === null && zm[1] === null && zm[2] === 'M1' && zm[3] === 'M1' && zm[4] === 'M3' && zm[6] === 'M5');
wirft('F5 doppelter Tag bricht ab', function () {
  K.baueDaten({ SPY: reihe('SPY', [['2020-01-02', 1, 1], ['2020-01-02', 1, 1]]) });
});

/* ---------- Fall 6: Kennzahlen (§3.8, §8) ----------
 * Kalender 10 Tage (02., 03., 06.-10., 13.-15.01.2020); Werte 100000, 110000, 99000, 105000, 111000, 90000, 95000, 112000, 100000, 100000.
 * groesster Rueckschlag 90000/111000 - 1 = -18,918918...%; Spitze 08.01. (Index 4), Tief 09.01. (Index 5).
 * Unter Wasser: Index 2-3 (seit Spitze Index 1 = 03.01., erholt Index 4 = 08.01.: 5 Tage), Index 5-6 (seit 08.01., erholt Index 7
 * = 13.01.: 5 Tage), Index 8-9 (seit 13.01. bis Ende 15.01., nicht erholt: 2 Tage). Laengste: 5 Tage 03.01.-08.01. (die zuerst
 * gefundene; die zweite ist gleich lang, nicht laenger). Unter Wasser 6 von 10 Tagen. p. a.: Endwert = Startkapital -> 0. */
var D6 = { tage: ['2020-01-02', '2020-01-03', '2020-01-06', '2020-01-07', '2020-01-08', '2020-01-09', '2020-01-10', '2020-01-13', '2020-01-14', '2020-01-15'] };
var w6 = Float64Array.from([100000, 110000, 99000, 105000, 111000, 90000, 95000, 112000, 100000, 100000]);
var k6 = K.kennzahlen(D6, w6, 0, 9);
nah('F6 groesster Rueckschlag', k6.maxRueckschlag, 90000 / 111000 - 1, 1e-12);
ok('F6 Rueckschlag Spitze/Tief', k6.rueckschlagSpitze === '2020-01-08' && k6.rueckschlagTief === '2020-01-09');
ok('F6 laengste Zeit unter Wasser', k6.unterWasser.tage === 5 && k6.unterWasser.von === '2020-01-03' && k6.unterWasser.bis === '2020-01-08' && k6.unterWasser.erholt === true);
nah('F6 Anteil Tage unter Wasser', k6.anteilTageUnterWasser, 0.6, 1e-12);
nah('F6 p. a. bei Endwert = Startkapital', k6.pa, 0, 1e-12);
ok('F6 Kalendertage', k6.kalendertage === 13);
/* offene Strecke: Werte fallen ab Index 2 und erholen sich nie (seit 03.01. bis 15.01. = 12 Tage) */
var w6b = Float64Array.from([100000, 101000, 99000, 98000, 97000, 96000, 95000, 94000, 93000, 92000]);
var k6b = K.kennzahlen(D6, w6b, 0, 9);
ok('F6b nicht erholt bis zum Ende', k6b.unterWasser.erholt === false && k6b.unterWasser.von === '2020-01-03' && k6b.unterWasser.bis === '2020-01-15' && k6b.unterWasser.tage === 12);
nah('F6b p. a. ueber 13 Kalendertage', k6b.pa, Math.pow(0.92, 365.25 / 13) - 1, 1e-12);
/* Start unter dem Startkapital: Strecke beginnt am Starttag */
var w6c = Float64Array.from([99000, 99500, 100000, 100000, 100000, 100000, 100000, 100000, 100000, 100000]);
var k6c = K.kennzahlen(D6, w6c, 0, 9);
ok('F6c Strecke ab dem Starttag, erholt bei Gleichstand', k6c.unterWasser.von === '2020-01-02' && k6c.unterWasser.bis === '2020-01-06' && k6c.unterWasser.tage === 4);
var kj = K.kalenderjahre({ tage: ['2020-12-30', '2020-12-31', '2021-01-04', '2021-12-31', '2022-01-03'] },
  [101000, 102000, 103000, 110000, 99000], [100500, 100000, 101000, 120000, 121000], 0, 4);
ok('F6 Kalenderjahre', kj.length === 3 && Math.abs(kj[0].regel - 0.02) < 1e-12 && Math.abs(kj[1].regel - (110000 / 102000 - 1)) < 1e-12 &&
  Math.abs(kj[2].spy - (121000 / 120000 - 1)) < 1e-12 && Math.abs(kj[0].spy - 0) < 1e-12);

/* ---------- Fall 7: Datumshilfen, Statistik ---------- */
ok('F7 plusMonat', K.plusMonat('2017-01-04') === '2017-02-04' && K.plusMonat('2021-09-16') === '2021-10-16' && K.plusMonat('2021-12-15') === '2022-01-15');
ok('F7 fuenf Jahre minus ein Tag', K.fuenfJahreMinusTag('2021-09-16') === '2026-09-15' && K.fuenfJahreMinusTag('2003-10-01') === '2008-09-30' &&
  K.fuenfJahreMinusTag('2004-02-29') === '2009-02-28' && K.fuenfJahreMinusTag('2008-03-01') === '2013-02-28');
ok('F7 Kalendertage', K.tageZwischen('2021-09-16', '2026-09-15') === 1825 && K.tageZwischen('2017-01-04', '2021-09-15') === 1715);
ok('F7 Median gerade/ungerade', K.median([3, 1, 2]) === 2 && K.median([4, 1, 3, 2]) === 2.5);
ok('F7 Quantil Rangverfahren', K.quantil([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.05) === 1 && K.quantil([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95) === 10 &&
  K.quantil([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.10) === 1 && K.quantil([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.90) === 9);
ok('F7 FNV-1a', K.fnv1a('') === 0x811c9dc5 && K.fnv1a('a') === 0xe40c292c);
var r1 = K.mulberry32(1), r2 = K.mulberry32(1);
ok('F7 mulberry32 wiederholbar und in [0,1)', r1() === r2() && (function () { for (var q = 0; q < 1000; q++) { var x = r1(); if (!(x >= 0 && x < 1)) return false; } return true; })());
ok('F7 Cent', K.cent(181193.8749) === '181193.87' && K.cent(105962.26415094339) === '105962.26');

/* ---------- Fall 8: Starttage und Endtag ---------- */
var tage8 = [];
for (var d8 = Date.UTC(2017, 0, 2); d8 <= Date.UTC(2017, 1, 10); d8 += 86400000) { var w = new Date(d8).getUTCDay(); if (w > 0 && w < 6) tage8.push(new Date(d8).toISOString().slice(0, 10)); }
var D8 = { tage: tage8, n: tage8.length };
var st8 = K.starttage(D8, { start: '2017-01-04', startBis: '2017-02-04' });
ok('F8 Starttage 04.01. bis 03.02. (Wochentage ohne Feiertage: 23)', st8.length === 23 && tage8[st8[0]] === '2017-01-04' && tage8[st8[st8.length - 1]] === '2017-02-03');
ok('F8 endIndex auf oder vor dem Tag', tage8[K.endIndex(D8, '2017-02-05')] === '2017-02-03' && tage8[K.endIndex(D8, '2017-02-06')] === '2017-02-06');

/* ---------- Fall 9: Placebo (§6) ---------- */
var tage9 = [];
for (var d9 = Date.UTC(2019, 0, 2); tage9.length < 400; d9 += 86400000) { var w9 = new Date(d9).getUTCDay(); if (w9 > 0 && w9 < 6) tage9.push(new Date(d9).toISOString().slice(0, 10)); }
var D9 = K.baueDaten({
  SPY: reihe('SPY', tage9.map(function (t, i) { return [t, 100 + Math.sin(i / 7) * 5 + i * 0.05, 100 + Math.sin((i + 0.5) / 7) * 5 + i * 0.05]; })),
  BIL: reihe('BIL', tage9.map(function (t, i) { return [t, 50 + i * 0.001, 50 + i * 0.001]; })),
  AGG: reihe('AGG', tage9.map(function (t, i) { return [t, 20 + Math.cos(i / 11), 20 + Math.cos((i + 0.5) / 11)]; }))
}, '2026-09-15');
var z9 = K.monatlich(D9, function (m) { var x = m % 3; return x === 0 ? 'SPY' : (x === 1 ? 'BIL' : 'AGG'); });
var s9 = 30, e9 = 380;
var regel9 = K.simuliere(D9, z9, s9, e9, {});
var p9 = K.placebo(D9, z9, 'R9', 'X', 'monatlich', s9, e9, {}, 200);
ok('F9 Placebo: gleiche Zahl Wechsel wie die Regel', p9.wechselW === regel9.wechsel.length && p9.wechselW > 3);
ok('F9 Placebo: Folge der Reihen wie die Regel', p9.folge.length === regel9.wechsel.length + 1 && p9.folge[0] === regel9.erstkauf.reihe);
var p9b = K.placebo(D9, z9, 'R9', 'X', 'monatlich', s9, e9, {}, 200);
ok('F9 Placebo wiederholbar (feste Saat)', p9b.abstandMedian === p9.abstandMedian && p9b.mehrAlsRegel === p9.mehrAlsRegel && p9.saat === K.fnv1a('trendfilter-2026-10|R9|X'));
var wahl9 = K.waehlbareTage(D9, 'monatlich', s9, e9);
ok('F9 waehlbare Tage monatlich = erste Handelstage der Monate', wahl9.every(function (i) { return D9.monatsende[i - 1] === 1; }) && wahl9.length === z9.slice(s9 + 1, e9 + 1).filter(function (x, j) { return D9.monatsende[s9 + j] === 1; }).length);
ok('F9 waehlbare Tage taeglich', K.waehlbareTage(D9, 'taeglich', s9, e9).length === e9 - s9);
/* Zufallslauf: Ziel-Feld wechselt nur an gezogenen Tagen und haelt die Folge */
var feld9 = new Array(D9.n).fill(null);
K.placeboZiel(D9, 10, 20, ['A', 'B', 'C'], [12, 15], feld9);
ok('F9 placeboZiel', feld9[10] === 'A' && feld9[11] === 'A' && feld9[12] === 'B' && feld9[14] === 'B' && feld9[15] === 'C' && feld9[20] === 'C' && feld9[21] === null);
/* W = 0: das Placebo ist die Regel selbst */
var p9c = K.placebo(D9, K.konstant(D9, 'SPY'), 'R9', 'Y', 'monatlich', s9, e9, {}, 20);
ok('F9 W = 0: Placebo = Regel', p9c.istRegelSelbst === true && p9c.mehrAlsRegel === 0);
/* Verteilung der gezogenen Tage: ueber viele Laeufe liegt der Mittelwert nahe der Mitte der waehlbaren Tage (kein Saat-Fehler) */
var rng9 = K.mulberry32(K.fnv1a('pruefung'));
var summe = 0, zahl = 0;
for (var q9 = 0; q9 < 5000; q9++) { summe += wahl9[Math.floor(rng9() * wahl9.length)]; zahl++; }
nah('F9 Gleichverteilung grob', summe / zahl, (wahl9[0] + wahl9[wahl9.length - 1]) / 2, 15);

/* ---------- Fall 10: Entscheidregel (§5.3) ---------- */
function fx(k0, vorn, anzahl, med) { return { k0: { vorn: k0 }, starttage: { vorn: vorn, anzahl: anzahl, anteilVorn: vorn / anzahl, median: med } }; }
ok('F10 alles erfuellt -> schlaegt', K.urteil({ A: fx(true, 16, 22, 0.1), B: fx(true, 22, 22, 2) }).schlaegtSpy === true);
ok('F10 genau 70 % reicht', K.urteil({ A: fx(true, 7, 10, 0.1), B: fx(true, 7, 10, 0.1) }).schlaegtSpy === true);
ok('F10 15 von 22 (68 %) reicht nicht', K.urteil({ A: fx(true, 15, 22, 0.1), B: fx(true, 22, 22, 2) }).schlaegtSpy === false);
ok('F10 Median genau 0 reicht nicht', K.urteil({ A: fx(true, 22, 22, 0), B: fx(true, 22, 22, 2) }).schlaegtSpy === false);
ok('F10 k = 0 nicht vorn in B', K.urteil({ A: fx(true, 22, 22, 1), B: fx(false, 21, 22, 2) }).verfehlt.length === 1);
ok('F10 Satz', K.urteil({ A: fx(false, 0, 22, -1), B: fx(false, 0, 22, -1) }).satz === 'schlägt SPY nicht' && K.urteil({ A: fx(false, 0, 22, -1), B: fx(false, 0, 22, -1) }).verfehlt.length === 6);

/* ---------- Fall 11: Fenster und Zusatz an Kunstdaten ---------- */
var f11 = K.fensterMessen(D9, z9, { start: tage9[40], startBis: K.plusMonat(tage9[40]), ende: tage9[390] }, {});
ok('F11 Fenster: Starttage eines Monats', f11.starttage.anzahl >= 20 && f11.starttage.anzahl <= 23 && f11.starttage.erster === tage9[40]);
ok('F11 Fenster: k = 0 ist der erste Starttag', f11.k0.start === tage9[40] && f11.k0.ende === tage9[390] && f11.starttage.liste[0].abstandPp === f11.k0.abstandPp);
ok('F11 vorn = Endwert strikt groesser', f11.starttage.liste.every(function (x) { return x.vorn === (x.endwertRegel > x.endwertSpy); }));

console.log(gut + ' grün, ' + schlecht + ' rot');
process.exitCode = schlecht ? 1 : 0;
