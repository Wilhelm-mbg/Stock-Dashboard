'use strict';
/* Pruefungen der vorregistrierten Messung Ergebnis-Drift (Auftrag Nr. 88, §2). Vor dem Siegel gruen.
 *   node test.js            Kunstdaten und Kunstpanel (kein Panel, keine Ueberraschung); dazu die Pruefungen der Machbarkeit
 *                           und - sobald blind.json da ist - die Pruefungen am echten Panel (Massstab 181.193,87 $ usw.).
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var KF = require('./konfig.js');
var ZE = require('./zehntel.js');
var GR = require('./groessen.js');
var BU = require('./buch.js');
var ME = require('./messung.js');
var EV = require('./ereignisse.js');
var LA = require('./lauf.js');
var RB = require(path.join(KF.RUECKBLICK, 'rueckblick.js'));
var AU = ME.AU;

var N = 0, ROT = 0;
function ok(bed, name) { N++; if (!bed) { ROT++; process.stdout.write('ROT  ' + name + '\n'); } }
function gleich(a, b, name) { ok(a === b, name + ' (ist ' + JSON.stringify(a) + ', soll ' + JSON.stringify(b) + ')'); }
function nahe(a, b, tol, name) { ok(Math.abs(a - b) <= tol, name + ' (ist ' + a + ', soll ' + b + ' +- ' + tol + ')'); }
function wirft(fn, name) { var w = false; try { fn(); } catch (e) { w = true; } ok(w, name); }
function quelle(datei) { return fs.readFileSync(path.join(__dirname, datei), 'utf8'); }
function ohneKommentare(t) { return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); }

/* ====================== 1. Die Pruefungen der Machbarkeit gelten weiter ====================== */
var mb = cp.spawnSync(process.execPath, [path.join(KF.MACHBARKEIT, 'test.js')], { encoding: 'utf8' });
ok(mb.status === 0 && /GRUEN/.test(mb.stdout), 'Machbarkeit: test.js gruen (Zeit, Zuordnung, Ueberraschung, Blindheit der Aufloesung): ' + String(mb.stdout).trim().split('\n').pop());

/* ====================== 2. Feste Zahlen der Regel ====================== */
gleich([KF.FENSTER_VON, KF.FENSTER_BIS, KF.H_HAUPT, KF.H_ZWEIT, KF.PLAETZE, KF.HALTEN, KF.START, KF.TOR_T, KF.ZUFALL_LAEUFE, KF.VERGLEICH_TAGE, KF.VERGLEICH_MINDESTENS].join('|'),
  '2021-09-16|2026-09-15|60|20|40|60|100000|2.5|200|63|200', 'Fenster, Haltedauern, Plaetze, Start, Tor, Laeufe, Vergleichsmenge wie im Auftrag');
gleich(KF.KOSTEN_UMLAUF_PP.slice(1).join('|') + '|' + KF.SPY_KOSTEN_BP, '0.21|0.134|0.081|0.5', 'Kosten je Umlauf je Klasse und SPY-Handel wie im Auftrag');
var PKK = require(path.join(KF.REPO, 'studien', 'querschnitt-pruefstand-2026-09-13', 'konfig.js')).KLASSEN;
[1, 2, 3].forEach(function (k) { nahe(PKK[k].huerdeEroeffnung, KF.KOSTEN_UMLAUF_PP[k], 0.0005, 'Kosten Klasse ' + PKK[k].name + ' gleich der Eroeffnungs-Huerde des Pruefstands (gerundet)'); });
var quME = ohneKommentare(quelle('messung.js')), quLA = ohneKommentare(quelle('lauf.js')), quEV = ohneKommentare(quelle('ereignisse.js'));
ok(/plaetze: KF\.PLAETZE, halten: KF\.HALTEN, kostenPp: KF\.KOSTEN_UMLAUF_PP, spyBp: KF\.SPY_KOSTEN_BP/.test(quME), 'das Buch laeuft mit den Zahlen aus konfig.js (40 Plaetze, 60 Tage)');
ok(/fenster: KF\.VERGLEICH_TAGE, mindestens: KF\.VERGLEICH_MINDESTENS, anteil: KF\.ANTEIL/.test(quME), 'die Zuteilung laeuft mit 63 Tagen, 200, einem Zehntel');

/* ====================== 3. Blindheit ====================== */
gleich((quLA.match(/mitUeberraschung/g) || []).length, 1, 'lauf.js setzt den Schalter fuer die Ueberraschung an genau einer Stelle');
ok(/mitUeberraschung: !blind/.test(quLA), 'die Ueberraschung wird nur ausserhalb des Blind-Modus geladen');
ok(quLA.indexOf('siegel = SI.pruefe()') > 0 && quLA.indexOf('siegel = SI.pruefe()') < quLA.indexOf('ME.lade('), 'lauf.js prueft das Siegel, BEVOR geladen wird');
ok(/if \(!blind\) \{\s*siegel = SI\.pruefe\(\)/.test(quLA), 'ohne --blind gibt es keinen Weg am Siegel vorbei');
['zehntel.js', 'groessen.js', 'buch.js', 'messung.js', 'siegel.js'].forEach(function (d) {
  ok(!/\.u\b|ueberraschung\.js|ausZeile/.test(ohneKommentare(quelle(d)).replace(/mitUeberraschung/g, '')), d + ' fasst die Ueberraschung nicht an');
});
ok(/if \(opt\.mitUeberraschung === true && u\.grund === 'ok'\) k\.u = u\.wert/.test(quEV), 'ereignisse.js gibt den Wert nur mit dem Schalter mit');
gleich((quEV.match(/u\.wert/g) || []).length, 1, 'ereignisse.js fasst den Wert der Ueberraschung an genau einer Stelle an');
ok(/if \(E >= ertragAb\) \{/.test(quEV) && /else for \(h = 0; h < nH; h\+\+\) abn\[h\]\.push\(NaN\)/.test(quEV), 'Ertraege werden nur ab dem ersten Fenstertag gebildet, davor NaN');
/* Kunstfall fuer den Schalter: eine Firma, eine Meldung, eine Tafelzeile */
(function () {
  var zeile = { form: '10-Q', period: '2024-03-31', filed: '2024-05-02', quartale: { netto: [10, 8, 6, 4, 2, 0, -2, -4] } };
  var FT = { meta: { ciks: { 7: ['X'] } }, alleFilings: function () { return [zeile]; }, cikVon: function (n) { return n === 'X' ? 7 : null; } };
  var meld = function () { return [{ cik: 7, a: '0000000007-24-000019', t: '2024-05-01T20:05:00.000Z', d: '2024-05-01', f: '8-K', i: '2.02' }]; };
  var kal = { tage: ['2024-04-30', '2024-05-01', '2024-05-02', '2024-05-03'], idx: { '2024-04-30': 0, '2024-05-01': 1, '2024-05-02': 2, '2024-05-03': 3 }, close: {} };
  var sym = [{ reihe: 'X', referenz: false }, { reihe: 'SPY', referenz: true }];
  var ohne = EV.kandidatenAus(FT, meld(), 'utc', kal, sym, {}), mit = EV.kandidatenAus(FT, meld(), 'utc', kal, sym, { mitUeberraschung: true });
  gleich(ohne.kandidaten.length + '|' + ('u' in ohne.kandidaten[0]) + '|' + ohne.kandidaten[0].hatUeberraschung + '|' + ohne.kandidaten[0].E, '1|false|true|2', 'ohne Schalter: Ereignis ohne Feld u, Einstieg am naechsten Handelstag');
  nahe(mit.kandidaten[0].u, 8 / Math.sqrt(24), 1e-12, 'mit Schalter: die Ueberraschung haengt am Ereignis');
  gleich(JSON.stringify(ohne.cikJeReihe), '[7,null]', 'Referenzreihe bekommt keine Firma');
})();
wirft(function () { EV.ereignisseAus({ g: {}, nSym: 0, symName: [], stand: { symbole: [] } }, { kandidaten: [], cikJeReihe: [] }, { horizonte: [20, 60] }); }, 'ohne ersten Fenstertag wird kein Ertrag gebildet (wirft)');

/* ====================== 4. Zehntel punkt-in-zeit ====================== */
nahe(ZE.perzentil(Float64Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0.9), 9.1, 1e-12, 'Perzentil 90 von 1..10 (lineare Interpolation) = 9,1');
nahe(ZE.perzentil(Float64Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 0.1), 1.9, 1e-12, 'Perzentil 10 von 1..10 = 1,9');
(function () {
  /* 200 Vergleichswerte 1..200 am Tag 99, vier Ereignisse am Tag 100: P90 = 1 + 0,9 x 199 = 180,1; P10 = 20,9 */
  var tag = [], wert = [], i;
  for (i = 1; i <= 200; i++) { tag.push(99); wert.push(i); }
  [181, 180, 20, 21].forEach(function (w) { tag.push(100); wert.push(w); });
  var gr = {}, zt = ZE.zuteilen(Int32Array.from(tag), Float64Array.from(wert), { abTag: 100, fenster: 63, mindestens: 200, anteil: 0.1, grenzen: gr });
  gleich([zt[200], zt[201], zt[202], zt[203]].join(','), '1,0,-1,0', 'Handfall: 181 oben, 180 Mitte, 20 unten, 21 Mitte');
  nahe(gr[100].p90, 180.1, 1e-9, 'P90 der Vergleichsmenge'); nahe(gr[100].p10, 20.9, 1e-9, 'P10 der Vergleichsmenge');
  gleich(zt[0], ZE.VOR_FENSTER, 'Ereignisse vor dem Fenster bekommen kein Signal');
  /* unter 200: kein Signal */
  var zt2 = ZE.zuteilen(Int32Array.from(tag.slice(1)), Float64Array.from(wert.slice(1)), { abTag: 100, fenster: 63, mindestens: 200, anteil: 0.1 });
  gleich([zt2[199], zt2[200], zt2[201], zt2[202]].join(','), '-2,-2,-2,-2', '199 Vergleichswerte: kein Signal');
  /* Fenstergrenze: Tag E-63 gehoert dazu, Tag E-64 nicht; derselbe Tag und spaetere nie */
  var t3 = [], w3 = [];
  for (i = 0; i < 100; i++) { t3.push(36); w3.push(1000 + i); }      /* E - 64: draussen */
  for (i = 0; i < 100; i++) { t3.push(37); w3.push(i); }             /* E - 63: drin */
  for (i = 0; i < 100; i++) { t3.push(99); w3.push(100 + i); }       /* E - 1: drin */
  for (i = 0; i < 50; i++) { t3.push(100); w3.push(5000 + i); }      /* E selbst: draussen */
  for (i = 0; i < 50; i++) { t3.push(101); w3.push(9000 + i); }      /* E + 1: draussen */
  var g3 = {}, z3 = ZE.zuteilen(Int32Array.from(t3), Float64Array.from(w3), { abTag: 100, fenster: 63, mindestens: 200, anteil: 0.1, grenzen: g3 });
  gleich(g3[100].n + '|' + g3[100].vonTag + '|' + g3[100].bisTag, '200|37|99', 'Vergleichsmenge des Tags 100: genau die Tage 37 bis 99');
  nahe(g3[100].p90, 179.1, 1e-9, 'P90 nur aus den Tagen 37..99 (0..199)');
  gleich(g3[101].n + '|' + g3[101].vonTag + '|' + g3[101].bisTag, '150|99|100', 'Tag 101: Tag 37 faellt heraus, Tag 100 kommt dazu - kein Ereignis des eigenen oder eines spaeteren Tags');
  gleich(z3[300], 1, 'Ereignis am Tag 100 mit Wert 5000: oben');
  gleich(z3[350], ZE.KEIN_SIGNAL, 'Tag 101 mit 150 Vergleichswerten: kein Signal');
  /* kein Blick voraus: Werte ab Tag E aendern -> Grenzen des Tags E unveraendert */
  var w4 = w3.slice(); for (i = 300; i < 400; i++) w4[i] = -7777;
  var g4 = {}; ZE.zuteilen(Int32Array.from(t3), Float64Array.from(w4), { abTag: 100, fenster: 63, mindestens: 200, anteil: 0.1, grenzen: g4 });
  gleich(g4[100].p90 + '|' + g4[100].p10, g3[100].p90 + '|' + g3[100].p10, 'geaenderte Werte am und nach dem Einstiegstag aendern die Grenzen des Tags nicht');
  wirft(function () { ZE.zuteilen(Int32Array.from([1, 2]), Float64Array.from([NaN, 1]), { abTag: 2, fenster: 63, mindestens: 1, anteil: 0.1 }); }, 'nicht endlicher Signalwert wirft');
})();

/* ====================== 5. Groessen der Stufe 1 ====================== */
(function () {
  /* Handfall: 6 Ereignisse an 3 Tagen; oben x = 4 und 2 (Kosten 0,21 und 0,081), unten -3 und 1, Mitte 0 und 2 */
  var ev = { tag: Int32Array.from([10, 10, 11, 11, 12, 12]), x: Float64Array.from([4, -3, 2, 0, 1, 2]), kosten: Float64Array.from([0.21, 0.21, 0.081, 0.134, 0.21, 0.21]) };
  var zt = Int8Array.from([1, -1, 1, 0, -1, 0]), G = GR.groessen(ev, zt, { lag: 0, tagVon: 10, tagBis: 12 });
  nahe(G.B, 3, 1e-12, 'B = Mittel oben = 3'); nahe(G.A, 4, 1e-12, 'A = 3 - (-1) = 4'); nahe(G.M, 1, 1e-12, 'M = Mittel aller sechs = 1'); nahe(G.BM, 2, 1e-12, 'B - M = 2');
  nahe(G.Bnetto, 3 - (0.21 + 0.081) / 2, 1e-12, 'B netto = B minus mittlere Huerde der gekauften Klassen');
  /* Tagesreihe ohne Lag: B: z = (4-3)/2, (2-3)/2, 0 -> Wurzel(0,5); A: z = 0,5 - (-2/2) = 1,5; -0,5; -(2/2) = -1 -> Wurzel(3,5) */
  nahe(G.nw.B, Math.sqrt(0.5), 1e-12, 'Tagesreihen-Fehler von B von Hand'); nahe(G.nw.A, Math.sqrt(3.5), 1e-12, 'Tagesreihen-Fehler von A von Hand (mit der Kovarianz am selben Tag)');
  /* kein Signal und NaN zaehlen nirgends mit */
  var G2 = GR.groessen({ tag: Int32Array.from([10, 10, 11, 11, 12, 12, 12, 12]), x: Float64Array.from([4, -3, 2, 0, 1, 2, 99, NaN]), kosten: Float64Array.from([0.21, 0.21, 0.081, 0.134, 0.21, 0.21, 0.21, 0.21]) },
    Int8Array.from([1, -1, 1, 0, -1, 0, -2, 1]), { lag: 0, tagVon: 10, tagBis: 12 });
  gleich(G2.nAlle + '|' + G2.nOben + '|' + G2.B + '|' + G2.M, '6|2|3|1', 'Ereignis ohne Signal und Ereignis ohne abgeschlossenes Haltefenster gehen nicht ein');
  /* ein Ereignis je Tag: der Tagesreihen-Fehler ist der Newey-West-Fehler der Machbarkeit */
  var rnd = AU.zufallsquelle(3), n = 300, tag = new Int32Array(n), x = new Float64Array(n), k = new Float64Array(n), z1 = new Int8Array(n).fill(1), vor = 0;
  for (var i = 0; i < n; i++) { tag[i] = 50 + i; vor = 0.6 * vor + rnd() - 0.5; x[i] = vor; }
  nahe(GR.groessen({ tag: tag, x: x, kosten: k }, z1, { lag: 19, tagVon: 50, tagBis: 349 }).nw.B, AU.neweyWest(x, 19), 1e-12, 'ein Ereignis je Tag: gleich neweyWest der Machbarkeit (Lag 19)');
  ok(GR.groessen({ tag: tag, x: x, kosten: k }, z1, { lag: 19, tagVon: 50, tagBis: 349 }).nw.B > 1.5 * GR.groessen({ tag: tag, x: x, kosten: k }, z1, { lag: 0, tagVon: 50, tagBis: 349 }).nw.B,
    'ueberlappende Fenster (Autokorrelation) vergroessern den Fehler deutlich');
  wirft(function () { GR.groessen(ev, zt, { lag: 0, tagVon: 11, tagBis: 12 }); }, 'Ereignis ausserhalb der Tagesreihe wirft');
  /* der groessere Fehler gilt */
  var mf = GR.mitFehler({ A: 2, B: 1, Bnetto: 0.8, BM: 0.5, M: 0.5, nw: { A: 0.5, B: 0.9, Bnetto: 0.9, BM: 0.2, M: 0.1 } }, { zufall: { A: 1, B: 0.4, Bnetto: 0.4, BM: 0.4 } });
  gleich(mf.fehler.A + '|' + mf.fehler.B + '|' + mf.quelle.A + '|' + mf.quelle.B + '|' + mf.t.A, '1|0.9|zufall|tagesreihe|2', 'Fehler = der groessere aus Zufall und Tagesreihe; t = Wert / Fehler');
})();

/* ---------- beide Kunstfaelle fuer das Tor, Positivkontrolle ---------- */
(function () {
  var rnd = AU.zufallsquelle(77), nT = 1200, jeTag = 13, vorT = 63, n = (nT + vorT) * jeTag;
  function normal() { var u = 0; for (var q = 0; q < 12; q++) u += rnd(); return u - 6; }
  var tag = new Int32Array(n), x = new Float64Array(n), kosten = new Float64Array(n), i, tagEffekt = 0;
  for (i = 0; i < n; i++) {
    var t = Math.floor(i / jeTag);
    if (i % jeTag === 0) tagEffekt = 2 * normal();
    tag[i] = t; kosten[i] = 0.19; x[i] = t < vorT ? NaN : 19 * normal() + tagEffekt;
  }
  var ord = ZE.ordnung(tag), ev = { tag: tag, x: x, kosten: kosten }, laeufe = [];
  for (var r = 0; r < 200; r++) {
    var w = ME.zufallswerte(n, r), zt = ZE.zuteilen(tag, w, { abTag: vorT, fenster: 63, mindestens: 200, anteil: 0.1, ord: ord });
    laeufe.push(GR.groessen(ev, zt, { lag: 59, tagVon: vorT, tagBis: vorT + nT - 1 }));
  }
  var zf = GR.zufallsFehler(laeufe), m = GR.mde(zf, KF.MDE_FAKTOR);
  var nul = GR.torAnteil(laeufe, zf, 0, 0, KF.TOR_T), zwei = GR.torAnteil(laeufe, zf, 4, 2, KF.TOR_T), allein = GR.torAnteil(laeufe, zf, 2, 2, KF.TOR_T);
  ok(nul.beide <= 0.02 && nul.A <= 0.03, 'Tor am Nullfall: hoechstens rund 1 % passieren (A allein ' + nul.A + ', A und B netto ' + nul.beide + ')');
  ok(zwei.beide >= 0.5, 'Tor bei eingepflanzten 2 Pp Kaufseite (Abstand 4 Pp): Anteil ' + zwei.beide + ' (A ' + zwei.A + ', B netto ' + zwei.Bnetto + ')');
  process.stdout.write('     Kunstfall Tor: Nullfall ' + (100 * nul.beide).toFixed(1) + ' %, 2 Pp Kaufseite mit 4 Pp Abstand ' + (100 * zwei.beide).toFixed(1) + ' %, 2 Pp Kaufseite allein ' + (100 * allein.beide).toFixed(1) +
    ' % (Kunstdaten: Fehler A ' + m.A.fehler.toFixed(3) + ', B ' + m.B.fehler.toFixed(3) + ')\n');
  nahe(zf.zufall.B / (19.1 / Math.sqrt(laeufe[0].nOben)), 1, 0.25, 'Kunstdaten: Zufallsfehler von B nahe Streuung / Wurzel(n oben)');
  var pk = ME.positivkontrolle(laeufe, zf);
  ok(pk.bestanden && pk.anteil > 0.65 && pk.anteil < 0.95, 'Positivkontrolle: eingepflanzte MDE erreicht t >= 2 in rund 80 % (ist ' + pk.anteil + ')');
  gleich(laeufe[0].nAlle, nT * jeTag, 'alle Fenster-Ereignisse haben ein Signal (Vergleichsmenge 819)');
  /* eingepflanzt in die Daten selbst: die Groessen finden den Effekt wieder */
  var w0 = ME.zufallswerte(n, 0), zt0 = ZE.zuteilen(tag, w0, { abTag: vorT, fenster: 63, mindestens: 200, anteil: 0.1, ord: ord });
  var g0 = GR.groessen(ev, zt0, { lag: 59, tagVon: vorT, tagBis: vorT + nT - 1 }), gp = GR.groessen(ev, zt0, { lag: 59, tagVon: vorT, tagBis: vorT + nT - 1, pflanzeOben: 2, pflanzeUnten: 2 });
  nahe(gp.A - g0.A, 4, 1e-9, 'eingepflanzt +2 oben, -2 unten: A steigt um genau 4'); nahe(gp.B - g0.B, 2, 1e-9, 'B steigt um genau 2'); nahe(gp.nw.A, g0.nw.A, 1e-9, 'der Tagesreihen-Fehler aendert sich durch die Pflanzung nicht');
  gleich(JSON.stringify(Array.from(ME.zufallswerte(50, 7))), JSON.stringify(Array.from(ME.zufallswerte(50, 7))), 'Zufallswerte: derselbe Startwert gibt dieselbe Folge');
  ok(ME.zufallswerte(50, 7)[0] !== ME.zufallswerte(50, 8)[0], 'anderer Lauf, andere Folge');
})();

/* ---------- das Urteil ---------- */
(function () {
  function u(o) { var b = { tA: 3, tBnetto: 3, Bnetto: 1.5, fehlerBnetto: 0.5, BM: 1, placeboTA: 0.5, placeboTBM: -1, positivAnteil: 0.8 }; Object.keys(o).forEach(function (k) { b[k] = o[k]; }); return ME.urteil(b); }
  gleich(u({}).urteil, 'belegt', 'Tor fuer A und B netto, Placebo, Positivkontrolle, B - M > 0: belegt');
  gleich(u({ tA: 2.49 }).urteil, 'nicht entscheidbar', 'A verfehlt das Tor, Schranke 2,48 Pp: nicht entscheidbar');
  gleich(u({ tBnetto: 1, Bnetto: 0.3, fehlerBnetto: 0.3 }).urteil, 'nicht belegt', 'B netto verfehlt, obere Schranke 0,888 Pp unter 1 Pp: nicht belegt');
  nahe(u({ tBnetto: 1, Bnetto: 0.3, fehlerBnetto: 0.3 }).obereSchrankeBnetto, 0.888, 1e-12, 'obere 95-%-Schranke = Wert + 1,96 x Fehler');
  gleich(u({ tBnetto: 1, Bnetto: 0.5, fehlerBnetto: 0.5 }).urteil, 'nicht entscheidbar', 'B netto verfehlt, Schranke 1,48 Pp: nicht entscheidbar');
  gleich(u({ BM: -0.1 }).urteil, 'nicht entscheidbar', 'Tor passiert, aber B - M nicht groesser 0: nicht belegt als Ueberraschung -> nicht entscheidbar');
  gleich(u({ placeboTA: 2.5 }).urteil, 'nicht entscheidbar', 'Placebo zwischen 2 und 3 Fehlern: nicht entscheidbar');
  gleich(u({ placeboTBM: -3.1 }).urteil, 'kein Urteil (Abbruch)', 'Placebo ausserhalb 3 Fehlern: Abbruch');
  gleich(u({ positivAnteil: 0.6 }).urteil, 'kein Urteil (Abbruch)', 'Positivkontrolle unter 65 %: Abbruch');
  ok(/var U = ME\.urteil\(\{ tA: s60\.t\.A, tBnetto: s60\.t\.Bnetto, Bnetto: s60\.Bnetto, fehlerBnetto: s60\.fehler\.Bnetto, BM: s60\.BM, placeboTA: s60\.placebo\.tA, placeboTBM: s60\.placebo\.tBM,\s*positivAnteil: s60\.positivkontrolle\.anteil \}\)/.test(quLA),
    'das Urteil nimmt nur Groessen von H = 60 - H = 20 kann es weder retten noch kippen');
})();

/* ====================== 6. Das Buch von Hand am Kunstpanel ====================== */
/* reihen: [{ name, ref, grund, klasse, kurse: { tag: [Eroeffnung, Schluss] } }]; Kalender = aufeinanderfolgende Tage ab 2024-01-01 */
function kunstPanel(nTage, reihen) {
  var z = [], t, s;
  for (t = 0; t < nTage; t++) for (s = 0; s < reihen.length; s++) if (reihen[s].kurse[t]) z.push([s, t, reihen[s].kurse[t][0], reihen[s].kurse[t][1]]);
  var n = z.length, g = { n: n, tag: new Int32Array(n), sym: new Uint16Array(n), bEroeffnung: new Float64Array(n), bSchluss: new Float64Array(n), rohSchluss: new Float64Array(n) };
  var tagVon = new Int32Array(nTage).fill(-1), tagBis = new Int32Array(nTage).fill(-1), jeSym = reihen.map(function () { return []; });
  z.forEach(function (r, i) { g.sym[i] = r[0]; g.tag[i] = r[1]; g.bEroeffnung[i] = r[2]; g.bSchluss[i] = r[3]; g.rohSchluss[i] = r[3]; if (tagVon[r[1]] < 0) tagVon[r[1]] = i; tagBis[r[1]] = i + 1; jeSym[r[0]].push(i); });
  var symStart = [0], symZeilen = [];
  jeSym.forEach(function (l) { l.forEach(function (i) { symZeilen.push(i); }); symStart.push(symZeilen.length); });
  var tage = []; for (t = 0; t < nTage; t++) tage.push(new Date(Date.UTC(2024, 0, 1 + t)).toISOString().slice(0, 10));
  var symIdx = {}; reihen.forEach(function (r, i) { symIdx[r.name] = i; });
  var T = { g: g, nTage: nTage, maxTag: nTage - 1, nSym: reihen.length, kal: { tage: tage }, tagVon: tagVon, tagBis: tagBis, symStart: Int32Array.from(symStart), symZeilen: Int32Array.from(symZeilen),
    symName: reihen.map(function (r) { return r.name; }), symIdx: symIdx, endeGrund: reihen.map(function (r) { return r.grund || null; }),
    stand: { symbole: reihen.map(function (r) { return { reihe: r.name, ordner: r.name, referenz: !!r.ref }; }) },
    zeileVon: function (sym, tag) { for (var i = tagVon[tag] < 0 ? 0 : tagVon[tag]; tagVon[tag] >= 0 && i < tagBis[tag]; i++) if (g.sym[i] === sym) return i; return -1; },
    letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; } };
  return T;
}
function kurse(n, f) { var o = {}; for (var t = 0; t < n; t++) { var k = f(t); if (k) o[t] = k; } return o; }
function buchAm(T, meldungen, opt, saetze) {
  var Q = RB.vorbereiten(T), M = RB.Massnahmen(T, Q, function (name) { return (saetze || {})[name] || []; });
  var DIV = function (sym, d) { return RB.ausschuettungenAm(T, Q, M, sym, d); };
  var o = { startTag: 0, endTag: T.maxTag, start: 100000, plaetze: 2, halten: 3, kostenPp: KF.KOSTEN_UMLAUF_PP, spyBp: KF.SPY_KOSTEN_BP, totalverlust: { insolvenz: true, 'zwangs-delisting': true }, spy: T.symIdx.SPY, detail: true };
  Object.keys(opt || {}).forEach(function (k) { o[k] = opt[k]; });
  return { b: BU.simuliere(T, Q, DIV, meldungen, o), m: BU.massstab(T, Q, DIV, o) };
}
function meldung(T, name, E, zeit, wert, klasse, cik) { return { E: E, sym: T.symIdx[name], cik: cik === undefined ? 100 + T.symIdx[name] : cik, klasse: klasse === undefined ? 1 : klasse, zeit: zeit, wert: wert, name: name }; }
var s = 0.00005, SPYK = function (t) { return [100 + t, 100.5 + t]; };

/* --- A: Start in SPY, ein Kauf, Verkauf am 3. Handelstag (Kunst-Haltedauer), Kosten Klasse 50-250 auf beiden Seiten und auf den SPY-Handel --- */
(function () {
  var XO = [50, 50, 50, 52, 55, 60, 61, 62], XC = [50, 50, 51, 53, 56, 60, 61, 62];
  var T = kunstPanel(8, [{ name: 'SPY', ref: true, kurse: kurse(8, SPYK) }, { name: 'X', kurse: kurse(8, function (t) { return [XO[t], XC[t]]; }) }]);
  var leer = buchAm(T, []);
  gleich(leer.b.endwert, leer.m.endwert, 'ohne ein einziges Signal ist das Buch gleich dem Massstab');
  nahe(leer.m.endwert, 1000 * 107.5, 1e-9, 'Start: 100.000 zur Eroeffnung des ersten Tags in SPY (1.000 Anteile zu 100), Ende zum Schluss 107,5');
  var R = buchAm(T, [meldung(T, 'X', 2, 10, 1)]), b = R.b, c2 = 0.210 / 200;
  var K = 1000 * 102 / 2, S = K * (1 + c2) / (1 - s), erloes = (K / 50) * 60 * (1 - c2), anteile = 1000 - S / 102 + erloes * (1 - s) / 105;
  gleich(b.handel.map(function (h) { return h.art + '@' + h.tag; }).join(','), 'kauf@2,verkauf@5', 'Kauf am Einstiegstag, Verkauf am 3. Handelstag danach');
  nahe(b.handel[0].volumen, 51000, 1e-9, 'Kaufbetrag = Buchwert zur Eroeffnung / Plaetze = 102.000 / 2'); nahe(b.handel[0].stueck, 1020, 1e-9, 'Stueckzahl = Kaufbetrag / Eroeffnungskurs 50');
  nahe(b.handel[0].spyVerkauft, S, 1e-9, 'der Kauf wird durch Verkauf von SPY bezahlt: Kaufbetrag + halbe Umlaufkosten, geteilt durch (1 - 0,5 Basispunkte)');
  nahe(b.handel[1].volumen, 61200, 1e-9, 'Verkauf zur Eroeffnung 60'); nahe(b.handel[1].kosten, 61200 * c2, 1e-9, 'halbe Umlaufkosten beim Verkauf');
  nahe(b.zaehler.kostenAktien, 51000 * c2 + 61200 * c2, 1e-9, 'Aktienkosten: je die Haelfte von 0,210 Pp beim Kauf und beim Verkauf');
  nahe(b.zaehler.kostenSpy, S * s + erloes * s, 1e-9, 'SPY-Kosten: 0,5 Basispunkte auf den Verkauf fuer den Kauf und auf die Anlage des Erloeses');
  nahe(b.endwert, anteile * 107.5, 1e-7, 'Endwert von Hand: SPY-Anteile nach Kauf und Verkauf mal Schlusskurs');
  nahe(b.beitragSumme, b.endwert - R.m.endwert, 1e-7, 'Zerlegung: Beitrag der Position = Abstand zum Massstab'); nahe(b.massstabEnde, R.m.endwert, 1e-7, 'Massstab aus der Zerlegung gleich Massstab');
  gleich(b.zaehler.gekauft + '|' + b.zaehler.verkauft + '|' + b.offeneAmEnde, '1|1|0', 'ein Kauf, ein Verkauf, am Ende nichts offen');
  nahe(b.tage[2].buch, (1000 - S / 102) * 102.5 + 1020 * 51, 1e-7, 'Bewertung am Kauftag zum Schluss');
  /* Kosten der anderen Klassen */
  [2, 3].forEach(function (kl) {
    var bk = buchAm(T, [meldung(T, 'X', 2, 10, 1, kl)]).b;
    nahe(bk.zaehler.kostenAktien, (51000 + 61200) * KF.KOSTEN_UMLAUF_PP[kl] / 200, 1e-9, 'Aktienkosten der Klasse ' + kl + ' auf beiden Seiten');
  });
  /* Ende mit offener Position: Schlusskurs, keine Verkaufskosten */
  var off = buchAm(T, [meldung(T, 'X', 6, 10, 1)]).b, K6 = 1000 * 106 / 2, S6 = K6 * (1 + c2) / (1 - s);
  nahe(off.endwert, (1000 - S6 / 106) * 107.5 + (K6 / 61) * 62, 1e-7, 'Ende mit offener Position: zum Schlusskurs, ohne Verkaufskosten'); gleich(off.offeneAmEnde, 1, 'eine Position offen am Ende');
  nahe(off.beitragSumme, off.endwert - R.m.endwert, 1e-7, 'Zerlegung auch mit offener Position');
  /* kein Kurs aus der Zukunft: Schlusskurse des Kauftags und alle spaeteren Kurse aendern -> der Kauf bleibt derselbe */
  var T2 = kunstPanel(8, [{ name: 'SPY', ref: true, kurse: kurse(8, function (t) { return t < 2 ? SPYK(t) : (t === 2 ? [102, 180] : [300 + t, 310 + t]); }) },
    { name: 'X', kurse: kurse(8, function (t) { return t < 2 ? [XO[t], XC[t]] : (t === 2 ? [50, 5] : [7, 8]); }) }]);
  var b2 = buchAm(T2, [meldung(T2, 'X', 2, 10, 1)]).b;
  gleich(JSON.stringify(b2.handel[0]), JSON.stringify(b.handel[0]), 'kein Kurs aus der Zukunft: der Kauf haengt nicht am Schlusskurs des Tags und an keinem spaeteren Kurs');
  ok(b.handel.every(function (h) { var zl = T.zeileVon(T.symIdx[h.name], h.tag); return h.kurs === T.g.bEroeffnung[zl] && h.spyKurs === 100 + h.tag; }), 'jeder Handel nimmt die Eroeffnung des Handelstags (Aktie und SPY)');
  wirft(function () { buchAm(T, [meldung(T, 'X', 9, 10, 1)]); }, 'Meldung ausserhalb des Fensters wirft');
})();

/* --- B: Reihenfolge am Tag, volle Plaetze, schon gehaltene Firma, fehlender Eroeffnungskurs, Buchwert einmal je Tag --- */
(function () {
  var flach = function () { return [20, 20]; };
  var T = kunstPanel(6, [{ name: 'SPY', ref: true, kurse: kurse(6, SPYK) }, { name: 'V', kurse: kurse(6, flach) }, { name: 'W', kurse: kurse(6, flach) }, { name: 'X', kurse: kurse(6, flach) },
    { name: 'Y', kurse: kurse(6, flach) }, { name: 'U', kurse: kurse(6, function (t) { return t === 3 ? null : [20, 20]; }) }]);
  var ml = [meldung(T, 'Y', 2, 100, 1.0), meldung(T, 'X', 2, 100, 2.0), meldung(T, 'W', 2, 50, 0.1), meldung(T, 'V', 2, 100, 2.0),
    meldung(T, 'W', 3, 10, 5, 1), meldung(T, 'U', 3, 20, 5, 1)];
  var b = buchAm(T, ml, { plaetze: 3, halten: 60 }).b;
  gleich(b.handel.filter(function (h) { return h.art === 'kauf'; }).map(function (h) { return h.name; }).join(','), 'W,V,X', 'Reihenfolge: frueheste Annahmezeit zuerst; gleiche Sekunde: groesserer Wert, dann Kuerzel');
  gleich(b.zaehler.verfallenPlaetzeVoll, 1, 'alle Plaetze besetzt: die Meldung Y verfaellt');
  gleich(b.zaehler.schonGehalten + '|' + b.zaehler.ohneEroeffnung, '1|1', 'schon gehaltene Firma wird nicht noch einmal gekauft; ohne Eroeffnungskurs kein Kauf');
  gleich(b.handel[0].volumen + '|' + b.handel[1].volumen, '34000|34000', 'alle Kaeufe eines Tags bekommen denselben Betrag = Buchwert / Plaetze (Buchwert einmal je Tag, nicht nach jedem Kauf neu)');
  nahe(b.handel[1].buchwert, 102000, 1e-9, 'Buchwert zur Eroeffnung vor den Kaeufen');
  ok(b.handel[2].teil && b.handel[2].volumen < 34000 && b.spyStueckEnde === 0, 'der dritte von drei Kaeufen bekommt nur den Rest des SPY-Bestands (die Kosten der ersten beiden fehlen): Teilkauf, kein Kredit');
  gleich(b.zaehler.gekauft + b.zaehler.verfallenPlaetzeVoll + b.zaehler.verfallenKeinSpy + b.zaehler.schonGehalten + b.zaehler.ohneEroeffnung, b.zaehler.meldungen, 'jede Meldung wird genau einmal gezaehlt');
  gleich(b.plaetzeMittel, (0 + 0 + 3 + 3 + 3 + 3) / 6, 'mittlere Zahl besetzter Plaetze');
  /* zwei Linien derselben Firma (gleiche cik) am selben Tag: nur die erste */
  var b3 = buchAm(T, [meldung(T, 'X', 2, 100, 1, 1, 55), meldung(T, 'Y', 2, 101, 1, 1, 55)]).b;
  gleich(b3.zaehler.gekauft + '|' + b3.zaehler.schonGehalten, '1|1', 'dieselbe Firma wird am selben Tag nicht zweimal gekauft');
})();

/* --- C: Reihenende mit und ohne Totalverlust; der Platz wird frei; Verkauf vor Kauf am selben Tag --- */
(function () {
  function panel(grund) {
    return kunstPanel(7, [{ name: 'SPY', ref: true, kurse: kurse(7, SPYK) }, { name: 'X', grund: grund, kurse: kurse(7, function (t) { return t <= 2 ? [50, t === 2 ? 40 : 50] : null; }) },
      { name: 'Y', kurse: kurse(7, function () { return [10, 10]; }) }]);
  }
  /* ein Platz: der Kauf nimmt den ganzen SPY-Bestand (Teilkauf, weil die Kosten aus demselben Bestand kommen) */
  var T = panel('uebernahme'), c2 = 0.210 / 200, V1 = 1000 * 101 * (1 - s) / (1 + c2);
  var b = buchAm(T, [meldung(T, 'X', 1, 10, 1), meldung(T, 'Y', 3, 10, 1)], { plaetze: 1, halten: 60 }).b;
  gleich(b.handel.map(function (h) { return h.art + ':' + h.name + '@' + h.tag; }).join(','), 'kauf:X@1,reihenende:X@3,kauf:Y@3', 'Reihenende am ersten Handelstag nach der letzten Zeile; der Platz wird frei und am selben Tag neu besetzt');
  var erloes = (V1 / 50) * 40;
  nahe(b.handel[0].volumen, V1, 1e-7, 'ein Platz: Kaufvolumen = ganzer SPY-Bestand abzueglich der Kosten');
  nahe(b.handel[1].volumen, erloes, 1e-7, 'ohne Totalverlust: letzter Schlusskurs 40, keine Aktienkosten');
  nahe(b.handel[2].buchwert, erloes * (1 - s), 1e-7, 'der Erloes geht zur selben Eroeffnung in SPY (0,5 Basispunkte) und zaehlt im Buchwert des Tags');
  nahe(b.zaehler.kostenAktien, V1 * c2 + b.handel[2].volumen * c2, 1e-7, 'Reihenende kostet auf der Aktienseite nichts');
  gleich(b.zaehler.reihenenden + '|' + b.zaehler.totalverluste, '1|0', 'ein Reihenende, kein Totalverlust');
  var bt = buchAm(panel('insolvenz'), [meldung(T, 'X', 1, 10, 1)], { plaetze: 2, halten: 60 }).b;
  nahe(bt.endwert, (1000 - 50500 * (1 + c2) / (1 - s) / 101) * 106.5, 1e-7, 'Insolvenz: Totalverlust, es bleibt nur der SPY-Rest');
  gleich(bt.zaehler.totalverluste + '|' + bt.offeneAmEnde + '|' + bt.handel[1].art + '@' + bt.handel[1].tag, '1|0|totalverlust@3', 'Totalverlust am ersten Handelstag nach der letzten Zeile gebucht, Platz frei');
  var bz = buchAm(panel('zwangs-delisting'), [meldung(T, 'X', 1, 10, 1)], { plaetze: 2, halten: 60 }).b;
  gleich(bz.endwert, bt.endwert, 'Zwangs-Delisting wie Insolvenz');
  /* Verkauf (Schritt 1) vor Kauf (Schritt 3): bei einem Platz wird am 3. Handelstag verkauft und derselbe Platz neu besetzt - auch von derselben Firma */
  var T4 = kunstPanel(7, [{ name: 'SPY', ref: true, kurse: kurse(7, SPYK) }, { name: 'Y', kurse: kurse(7, function () { return [10, 10]; }) }]);
  var b4 = buchAm(T4, [meldung(T4, 'Y', 1, 10, 1), meldung(T4, 'Y', 4, 10, 1)], { plaetze: 1, halten: 3 }).b;
  gleich(b4.handel.map(function (h) { return h.art + '@' + h.tag; }).join(','), 'kauf@1,verkauf@4,kauf@4', 'erst verkaufen, dann kaufen: der Platz ist am selben Tag wieder frei');
  nahe(b4.handel[2].volumen, b4.handel[2].buchwert * (1 - s) / (1 + 0.210 / 200), 1e-7, 'bei einem Platz geht der ganze Buchwert nach dem Verkauf in den neuen Kauf (abzueglich der Kosten)');
})();

/* --- D: Ausschuettungen: Aktie -> zum Schluss des Ex-Tags in SPY; SPY -> kostenfrei wieder in SPY; Kauf am Ex-Tag ohne Anspruch --- */
(function () {
  var T = kunstPanel(7, [{ name: 'SPY', ref: true, kurse: kurse(7, SPYK) }, { name: 'X', kurse: kurse(7, function () { return [50, 50]; }) }, { name: 'Y', kurse: kurse(7, function () { return [10, 10]; }) }]);
  var saetze = { X: [{ _art: 'cash_dividends', ex_date: '2024-01-04', rate: 0.5 }], Y: [{ _art: 'cash_dividends', ex_date: '2024-01-04', rate: 1 }], SPY: [{ _art: 'cash_dividends', ex_date: '2024-01-05', rate: 2 }] };
  var R = buchAm(T, [meldung(T, 'X', 1, 10, 1), meldung(T, 'Y', 3, 10, 1)], { plaetze: 4, halten: 60 }, saetze), b = R.b, c2 = 0.210 / 200;
  var K1 = 1000 * 101 / 4, n1 = 1000 - K1 * (1 + c2) / (1 - s) / 101, stX = K1 / 50;
  var B3 = n1 * 103 + stX * 50, K3 = B3 / 4, n3 = n1 - K3 * (1 + c2) / (1 - s) / 103, divX = stX * 0.5, n3s = n3 + divX * (1 - s) / 103.5;
  var n4 = n3s + n3s * 2 / 104.5;
  gleich(b.zaehler.ausschuettungen, 1, 'nur die ueber die Nacht gehaltene Aktie bekommt die Ausschuettung (Kauf am Ex-Tag zaehlt nicht)');
  nahe(b.zaehler.ausschuettungSumme, divX, 1e-9, 'Betrag = Stueckzahl x Satz (wie im Rueckblick Nr. 74)');
  nahe(b.tage[3].buch, n3s * 103.5 + stX * 50 + (K3 / 10) * 10, 1e-7, 'die Ausschuettung der Aktie wird zum SCHLUSS des Ex-Tags in SPY angelegt (0,5 Basispunkte)');
  nahe(b.spyStueckEnde, n4, 1e-9, 'Ausschuettung des SPY auf die Stueckzahl ueber die Nacht, kostenfrei zum Schluss wieder angelegt');
  nahe(R.m.endwert, (1000 + 1000 * 2 / 104.5) * 106.5, 1e-7, 'Massstab mit Ausschuettung von Hand');
  nahe(b.massstabEnde, R.m.endwert, 1e-7, 'Zerlegung traegt die Ausschuettung des SPY'); nahe(b.beitragSumme, b.endwert - R.m.endwert, 1e-7, 'Zerlegung mit Ausschuettungen: Summe der Beitraege = Abstand');
  var leer = buchAm(T, [], {}, saetze);
  gleich(leer.b.endwert, leer.m.endwert, 'ohne Signal gleich dem Massstab - auch mit Ausschuettung des SPY');
  /* Verkauf zur Eroeffnung des Ex-Tags: Anspruch besteht noch */
  var bv = buchAm(T, [meldung(T, 'X', 0, 10, 1)], { plaetze: 4, halten: 3 }, saetze).b;
  gleich(bv.handel.map(function (h) { return h.art + '@' + h.tag; }).join(','), 'kauf@0,verkauf@3,ausschuettung@3', 'Verkauf zur Eroeffnung des Ex-Tags: die Ausschuettung kommt noch');
})();

/* --- E: kein Kredit, kein negativer SPY-Bestand --- */
(function () {
  var T = kunstPanel(5, [{ name: 'SPY', ref: true, kurse: kurse(5, function () { return [100, 100]; }) }, { name: 'X', kurse: kurse(5, function (t) { return t < 2 ? [50, 50] : [150, 150]; }) },
    { name: 'Y', kurse: kurse(5, function () { return [10, 10]; }) }, { name: 'Z', kurse: kurse(5, function () { return [10, 10]; }) }]);
  var c2 = 0.210 / 200, n1 = 1000 - 50000 * (1 + c2) / (1 - s) / 100;
  var b = buchAm(T, [meldung(T, 'X', 1, 10, 1), meldung(T, 'Y', 2, 10, 1), meldung(T, 'Z', 2, 20, 1)], { plaetze: 3, halten: 60, start: 100000 }).b;
  /* Tag 1: Kaufbetrag 33.333,33; Tag 2: X = 150 -> Buchwert = SPY + 3 x Einstand */
  var K1 = 100000 / 3, nA = 1000 - K1 * (1 + c2) / (1 - s) / 100, B2 = nA * 100 + (K1 / 50) * 150;
  nahe(b.handel[1].buchwert, B2, 1e-7, 'Buchwert am Tag 2 mit der verdreifachten Position');
  ok(B2 / 3 * (1 + c2) / (1 - s) < nA * 100, 'Kunstfall: der erste Kauf des Tags ist noch voll bezahlbar');
  var rest = nA * 100 - (B2 / 3) * (1 + c2) / (1 - s);
  nahe(b.handel[2].spyVerkauft, rest, 1e-7, 'reicht der SPY-Bestand nicht ganz, wird mit dem gekauft, was da ist');
  nahe(b.handel[2].volumen, rest * (1 - s) / (1 + c2), 1e-7, 'Teilkauf: Volumen = Rest abzueglich der Kosten'); gleich(b.handel[2].teil + '|' + b.zaehler.teilkauf, 'true|1', 'Teilkauf gezaehlt');
  gleich(b.spyStueckEnde, 0, 'der SPY-Bestand ist danach genau null, nie negativ');
  ok(n1 > 0, 'Hilfsgroesse');
  var T5 = kunstPanel(5, [{ name: 'SPY', ref: true, kurse: kurse(5, function () { return [100, 100]; }) }, { name: 'X', kurse: kurse(5, function (t) { return t < 2 ? [50, 50] : [150, 150]; }) },
    { name: 'Y', kurse: kurse(5, function () { return [10, 10]; }) }, { name: 'Z', kurse: kurse(5, function () { return [10, 10]; }) }, { name: 'W', kurse: kurse(5, function () { return [10, 10]; }) }]);
  var b5 = buchAm(T5, [meldung(T5, 'X', 1, 10, 1), meldung(T5, 'Y', 2, 10, 1), meldung(T5, 'Z', 2, 20, 1), meldung(T5, 'W', 2, 30, 1)], { plaetze: 4, halten: 60 }).b;
  gleich(b5.zaehler.gekauft + '|' + b5.zaehler.teilkauf + '|' + b5.zaehler.verfallenKeinSpy + '|' + b5.zaehler.verfallenPlaetzeVoll, '3|1|1|0', 'ist der SPY-Bestand null, verfaellt die Meldung (gezaehlt), obwohl ein Platz frei ist');
  nahe(b5.beitragSumme, b5.abstand, 1e-7, 'Zerlegung auch bei Teilkauf');
})();

/* --- F: Verkauf verschoben (kein Eroeffnungskurs am 3. Handelstag); Bewertung in der Luecke zum letzten Schlusskurs --- */
(function () {
  var T = kunstPanel(8, [{ name: 'SPY', ref: true, kurse: kurse(8, function () { return [100, 100]; }) }, { name: 'X', kurse: kurse(8, function (t) { return t === 4 ? null : [50 + t, 51 + t]; }) }]);
  var b = buchAm(T, [meldung(T, 'X', 1, 10, 1)], { plaetze: 2, halten: 3 }).b, st = 50000 / 51;
  gleich(b.handel.map(function (h) { return h.art + '@' + h.tag; }).join(','), 'kauf@1,verkauf@5', 'ohne Eroeffnungskurs am Verkaufstag: Verkauf zur naechsten Eroeffnung');
  gleich(b.zaehler.verkaufVerschoben + '|' + b.zaehler.lueckentage, '1|1', 'verschobener Verkauf und Lueckentag gezaehlt');
  nahe(b.tage[4].aktien, st * 54, 1e-7, 'in der Luecke gilt der letzte Schlusskurs'); nahe(b.handel[1].kurs, 55, 1e-12, 'verkauft wird zur Eroeffnung des Folgetags');
})();

/* --- G: 40 Plaetze, 60 Handelstage (die Zahlen der Regel) --- */
(function () {
  var reihen = [{ name: 'SPY', ref: true, kurse: kurse(70, function () { return [100, 100]; }) }], ml = [], i;
  for (i = 0; i < 45; i++) reihen.push({ name: 'A' + (i < 10 ? '0' : '') + i, kurse: kurse(70, function () { return [10, 10]; }) });
  var T = kunstPanel(70, reihen);
  for (i = 0; i < 45; i++) ml.push(meldung(T, reihen[i + 1].name, 1, i, 1));
  var b = buchAm(T, ml, { plaetze: KF.PLAETZE, halten: KF.HALTEN }).b;
  gleich(b.zaehler.gekauft + '|' + b.zaehler.verfallenPlaetzeVoll + '|' + b.zaehler.maxPlaetze, '40|5|40', '40 Plaetze: die 41. bis 45. Meldung verfaellt');
  nahe(b.handel[0].volumen, 2500, 1e-9, 'Kaufbetrag = 100.000 / 40');
  ok(b.handel.filter(function (h) { return h.art === 'verkauf'; }).every(function (h) { return h.tag === 61; }) && b.zaehler.verkauft === 40, 'Verkauf am 60. Handelstag nach dem Einstieg (Tag 1 -> Tag 61)');
  ok(b.zaehler.teilkauf >= 1 && b.spyStueckEnde >= 0, 'die Kosten zehren den SPY-Bestand auf: der letzte Kauf ist ein Teilkauf, kein Kredit');
  var b2 = buchAm(T, ml, { plaetze: KF.PLAETZE, halten: KF.HALTEN }).b;
  gleich(b2.endwert, b.endwert, 'zwei Laeufe mit denselben Eingaben sind gleich');
})();

/* ====================== 7. Der Bericht (Kunstzahlen) ====================== */
(function () {
  function s1(H) { return { H: H, nOben: 1500, nUnten: 1490, nAlle: 15000, A: 1.2, B: 0.8, Bnetto: 0.61, M: 0.1, BM: 0.7, kostenOben: 0.19, fehler: { A: 0.7, B: 0.5, Bnetto: 0.5, BM: 0.45, M: 0.2 }, t: { A: 1.71, B: 1.6, Bnetto: 1.22, BM: 1.56, M: 0.5 },
    obereSchrankeBnetto: 1.59, mdeA: 1.96, mdeB: 1.4, placebo: { A: 0.1, BM: -0.2, tA: 0.14, tBM: -0.44 }, positivkontrolle: { eingepflanzt: 1.96, anteil: 0.8, bestanden: true } }; }
  var E = { kennung: KF.KENNUNG, siegel: { commit: 'abcdef1234' }, korrekturen: [], zaehlungen: { imMessfenster: 16000, ereignisseHauptklassen: 25298 },
    urteil: ME.urteil({ tA: 1.71, tBnetto: 1.22, Bnetto: 0.61, fehlerBnetto: 0.5, BM: 0.7, placeboTA: 0.14, placeboTBM: -0.44, positivAnteil: 0.8 }), stufe1: { H60: s1(60), H20: s1(20) },
    stufe2: { schlaegt: false, buchEnde: 170000, spyEnde: 181193.87, buchGesamt: 70, spyGesamt: 81.19, buchPa: 11.2, spyPa: 12.63, abstandPa: -1.43, jahre: 4.997,
      zufall: { buecher: 200, ueberDemBuch: 60, mitteGesamt: 65, p5Gesamt: 50, p95Gesamt: 80, ueberDemMassstab: 9 }, vorwaertstestAngezeigt: false, meldungenObersteZehntel: 1600, gekauft: 700, teilkauf: 3,
      verfallenPlaetzeVoll: 880, verfallenKeinSpy: 0, schonGehalten: 20, ohneEroeffnung: 0, verkauft: 650, verkaufVerschoben: 1, reihenenden: 10, totalverluste: 0, offeneAmEnde: 40, plaetzeMittel: 33.1, plaetzeMax: 40,
      aktienAnteilMittel: 80.2, kostenAktien: 4000, kostenSpy: 200, kostenGesamt: 4200, rueckschlagBuch: -30, rueckschlagSpy: -24.5, kalenderjahre: [{ jahr: '2021', buch: 1, spy: 2, abstand: -1 }],
      abstandDollar: -11193.87, top10: [{ reihe: 'AAA', einstieg: '2023-05-04', beitrag: 2500 }], top10Summe: 20000, endeOhneTop10: 150000, abstandPaOhneTop10: -4, zufallTop10: { mitte: 18000, p5: 12000, p95: 30000, groesserAlsImBuch: 70 } } };
  var text = LA.bericht(E), zeilen = text.split('\n');
  ok(zeilen[0].indexOf('Im Rückblick über fünf Jahre (16.09.2021 bis 15.09.2026) schlägt das Ergebnis-Drift-Buch den S&P 500 nach Kosten: **nein** — Buch +70,0 % (11,20 % p. a.), S&P 500 +81,2 % (12,63 % p. a.), Abstand −1,43 Pp p. a.; von 200 Zufallsbüchern liegen 60 über dem Buch (Mitte +65,0 %, 5 %–95 %: +50,0 bis +80,0 %).') === 0,
    'erste Zeile ist der festgelegte Satz der Stufe 2');
  ok(/\*\*Kein Vorwärtstest angezeigt\.\*\*$/.test(zeilen[0]), 'der Satz endet mit der Aussage zum Vorwaertstest');
  ok(/^Urteil der Stufe 1 .*\*\*nicht entscheidbar\*\*/.test(zeilen[2]), 'zweite Zeile ist das Urteil der Stufe 1');
  gleich((text.replace('**nicht entscheidbar**', '').match(/belegt|bestätigt|bestaetigt/g) || []).length, 0, 'die Woerter des Urteils stehen im Bericht nur im Urteil');
  ok(text.length < 6500, 'der Bericht bleibt eine Seite (' + text.length + ' Zeichen)');
  E.stufe2.schlaegt = true; E.stufe2.vorwaertstestAngezeigt = true;
  ok(/\*\*ja\*\*/.test(LA.bericht(E).split('\n')[0]) && /\*\*Vorwärtstest angezeigt\.\*\*$/.test(LA.bericht(E).split('\n')[0]), 'ja und Vorwaertstest angezeigt werden so geschrieben');
  ok(/vorwaertstestAngezeigt: ja && ueber <= KF\.VORWAERTSTEST_HOECHSTENS/.test(quLA) && /ja = b\.endwert > MS\.endwert/.test(quLA), 'ja heisst Endwert Buch > Endwert SPY; Vorwaertstest nur bei ja und hoechstens 10 Zufallsbuechern darueber');
})();

/* ====================== 8. Pruefungen am echten Panel (aus blind.json, vor dem Siegel gerechnet) ====================== */
var bj = path.join(__dirname, 'blind.json');
if (!fs.existsSync(bj)) ok(false, 'blind.json fehlt - erst `node --max-old-space-size=6144 lauf.js --blind` laufen lassen');
else {
  var B = JSON.parse(fs.readFileSync(bj, 'utf8')), P = B.pruefungenAmPanel;
  ok(P.massstabTrifft && Math.abs(P.massstabEnde - 181193.87) < 0.005, 'der Massstab trifft 181.193,87 $ (ist ' + P.massstabEnde.toFixed(4) + ')');
  ok(P.buchOhneSignalGleichMassstab, 'echtes Panel: ohne ein einziges Signal ist das Buch gleich dem Massstab');
  ok(P.zufallsbuchZweimalGleich, 'echtes Panel: zwei Zufallsbuecher mit demselben Startwert sind gleich');
  ok(P.zerlegungStimmt && P.plaetzeNieUeber && P.spyNieNegativ, 'echtes Panel: Zerlegung stimmt, nie mehr als 40 Plaetze, SPY-Bestand nie negativ');
  ok(P.handprobeMachbarkeit === 30 && P.handprobeGleich === 30, 'die 30 Meldungen der Handprobe der Machbarkeit: dieselbe Reihe, derselbe Einstiegstag, dieselbe Annahmezeit (' + P.handprobeGleich + ' von ' + P.handprobeMachbarkeit + ')');
  ok(Math.abs(B.zaehlungen.abweichung) <= 0.01,'Ereigniszahl ' + B.zaehlungen.ereignisseHauptklassen + ' gegen erwartet 25.298 (Abbruchregel 3)');
  gleich(B.zaehlungen.vergleichsmenge.verletzungenPunktInZeit, 0, 'echte Ereignisse: kein Ereignis des Einstiegstags oder danach in einer Vergleichsmenge');
  var t60 = B.blind.H60.tor;
  ok(t60[0].anteilLaeufe.beide <= 0.02, 'Tor am Nullfall im Messfenster: hoechstens rund 1 % (ist ' + t60[0].anteilLaeufe.beide + ')');
  ok(B.blind.H60.positivkontrolle.anteil >= 0.65, 'Positivkontrolle im Messfenster (blind): ' + B.blind.H60.positivkontrolle.anteil);
  gleich(B.zufallsbuecher.endwerte.length, 200, '200 Zufallsbuecher gerechnet');
  ok(/OHNE Ueberraschung/.test(B.hinweis), 'blind.json ist ohne Ueberraschung gerechnet');
}

process.stdout.write((ROT ? 'ROT: ' + ROT + ' von ' : 'GRUEN: ') + N + ' Pruefungen\n');
process.exitCode = ROT ? 1 : 0;
