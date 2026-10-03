'use strict';
/* PRUEFUNGEN der Zaehlung (Auftrag Nr. 65) - jede mit Gegenprobe, die rot wird, wenn die Logik bricht.
 * Aufruf: node studien/kapitulation-neu-2026-10-03/test.js   (liest nur Kopfdateien des Archivs: Kalender, Symboltafel)
 */
var Z = require('./zaehlen.js');
var gut = 0, rot = 0;
function ok(b, was) { if (b) gut++; else { rot++; console.log('ROT: ' + was); } }

/* 1. 60m-Gitter: 390 Minuten ab Sitzungsbeginn -> 7 Kerzen, die letzte 30 Minuten; Stempel = Eimeranfang; Schluss = letzter Kurs. */
var auf = Date.UTC(2024, 0, 3, 14, 30), k1 = [];
for (var m = 0; m < 390; m++) k1.push([auf + m * 60000, 100 + m, 10]);
var bars = [], vol = Z.verdichte60(k1, { von: 0, bis: 389, auf: auf }, bars);
ok(bars.length === 7, '7 Stundenkerzen je vollem Tag');
ok(bars[0][0] === auf && bars[6][0] === auf + 6 * 3600000, 'Stempel = Eimeranfang');
ok(bars[0][1] === 159 && bars[6][1] === 489, 'Schluss = letzte Minute des Eimers');
ok(bars[0][2] === 600 && bars[6][2] === 300 && vol === 3900, 'Stueckzahlen summiert, letzte Kerze 30 Minuten');
var halb = []; Z.verdichte60(k1, { von: 0, bis: 209, auf: auf }, halb);
ok(halb.length === 4, 'Gegenprobe Halbtag: 210 Minuten -> 4 Kerzen, nicht 7');

/* 2. Regime: Urteil der letzten SPY-Kerze STRENG vor dem Signalstempel; vor 200 Kerzen kein Urteil = Tor offen. */
var spy = [];
for (var q = 0; q < 400; q++) spy.push([q * 3600000, q < 300 ? 100 + q : 400 - 3 * (q - 300), 1]);
var R = Z.regimeAus(spy);
ok(R.offen(spy[100][0]) === true, 'ohne Urteil (unter 200 Kerzen) laesst das Tor durch');
ok(R.offen(spy[299][0]) === false, 'steigender Markt: Tor zu');
ok(R.ueber[399] === false && R.offen(spy[399][0] + 1) === true, 'gefallener Markt: Tor offen');
var kipp = -1; for (q = 201; q < 400; q++) if (R.ueber[q] === false && R.ueber[q - 1] === true) { kipp = q; break; }
ok(kipp > 0 && R.offen(spy[kipp][0]) === false && R.offen(spy[kipp][0] + 1) === true, 'Gegenprobe: zeitgleiche SPY-Kerze zaehlt NICHT (streng davor)');

/* 3. Stichprobe: feste Saat, Schichtung im Verhaeltnis des Archivs. */
var alle = []; for (q = 0; q < 7299; q++) alle.push({ reihe: 'R' + String(q).padStart(4, '0'), lebend: q < 2306 ? 1 : 0 });
var s1 = Z.stichprobe(alle, 400), s2 = Z.stichprobe(alle, 400);
ok(s1.length === 400 && s1.filter(function (r) { return r.lebend; }).length === 126, '400 Reihen, davon 126 lebend (2.306 von 7.299)');
ok(s1.map(function (r) { return r.reihe; }).join() === s2.map(function (r) { return r.reihe; }).join(), 'dieselbe Saat zieht dieselben Reihen');
ok(new Set(s1.map(function (r) { return r.reihe; })).size === 400, 'Gegenprobe: keine Reihe doppelt');

/* ===================== PHASE 2 (Auftrag Nr. 68): Ertragsstufe - NUR KUNSTDATEN, kein Ertrag eines echten Signals =====================
 * Kunst-Ausloeser: eine ungerade Stueckzahl markiert die Signalkerze (haengt nur an der Kerze selbst, sieht also nie nach vorn). */
var M = require('./messen.js'), fs = require('fs'), os = require('os'), path = require('path');
var ST = require('../querschnitt-pruefstand-2026-09-13/statistik.js');
var REGIME_OFFEN = { offen: function () { return true; } }, OHNE_SPLITS = { je: {}, liste: [] }, H = Z.H, VOR = Z.VOR, TMP = [];
function istSignal(b, i) { return b[i][2] % 2 === 1; }
function tmp() { var d = fs.mkdtempSync(path.join(os.tmpdir(), 'kapitulation-test-')); TMP.push(d); return d; }
function wirft(f, muster) { try { f(); } catch (e) { return muster.test(e.message); } return false; }
function gauss(rng) { return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng()); }
function kunstKal(n) { var aus = [], d = Date.UTC(2017, 0, 2); while (aus.length < n) { var w = new Date(d).getUTCDay(); if (w !== 0 && w !== 6) aus.push(new Date(d).toISOString().slice(0, 10)); d += 86400000; } return aus; }
/** Kunstreihe: 7 Stundenkerzen je Tag um 100 $, gemeinsamer Marktanteil je Kerze + eigenes Rauschen. o: { tage, vol, rausch, markt }. */
function kunstReihe(name, kal, saat, o) {
  var rng = ST.mulberry32(ST.fnv(saat + '|' + name)), bars = [], oeff = [], barTag = [], tage = [], kurs = 100, nT = o.tage || kal.length, v = o.vol || 200000;
  for (var t = 0; t < nT; t++) {
    var p = kal[t].split('-').map(Number), auf = Date.UTC(p[0], p[1] - 1, p[2], 14, 30);
    for (var h = 0; h < 7; h++) {
      oeff.push(kurs * (1 + 0.0002 * gauss(rng)));
      kurs *= 1 + (o.markt ? o.markt[t * 7 + h] : 0) + (o.rausch == null ? 0.0005 : o.rausch) * gauss(rng);
      bars.push([auf + h * 3600000, kurs, v]); barTag.push(t);
    }
    tage.push({ tag: kal[t], ki: t, t0: auf, close: kurs, vol: 7 * v });
  }
  return { bars: bars, oeff: oeff, barTag: barTag, tage: tage, sperr: new Set(), angewandt: new Set(), fehl: [], dateien: 0, bytes: 0, msLesen: 0 };
}
/** Signale mit Wahrscheinlichkeit p je zulaessiger Kerze; Effekt X als Spitze genau der Ausstiegskerze (trifft nur den Ertrag des Signals). */
function pflanze(d, rng, p, X) {
  var sig = []; for (var i = VOR; i < d.bars.length - H; i++) if (rng() < p) sig.push(i);
  sig.forEach(function (i) { d.bars[i][2] += 1; d.bars[i + H][1] *= 1 + X; });
  return sig;
}
function kunstSatz(saat, n, tageN, p, X, o) {
  var kal = kunstKal(tageN), rng = ST.mulberry32(ST.fnv(saat)), markt = new Float64Array(tageN * 7), liste = [];
  for (var q = 0; q < markt.length; q++) markt[q] = 0.003 * gauss(rng);
  for (q = 0; q < n; q++) {
    var cls = o && o.gemischt && q % 2 ? 2 : 1, name = 'K' + String(q).padStart(3, '0'), d = kunstReihe(name, kal, saat, { markt: markt, rausch: o && o.rausch, vol: cls === 2 ? 1000000 : 200000 });
    liste.push({ R: { reihe: name, lebend: 1 }, d: d, cls: cls, sig: pflanze(d, rng, p, X) });
  }
  return { kal: kal, liste: liste };
}
function zaehleKunst(e) { var siegel = null, r = Z.zaehleReihe(e.R, REGIME_OFFEN, e.splits || OHNE_SPLITS, { d: e.d, signal: istSignal, voll: function (aus, x) { siegel = M.ertragsstufe(aus, x, e.R, e.grund); } }); delete r.msLesen; return { r: r, siegel: siegel || { reihe: e.R.reihe, ert: [] } }; }
function imSpeicher(satz) { var reihen = [], siegel = new Map(); satz.liste.forEach(function (e) { var x = zaehleKunst(e); reihen.push(x.r); siegel.set(e.R.reihe, x.siegel); }); return { reihen: reihen, siegel: siegel }; }
var SPY_KUNST = []; for (q = 0; q < 300; q++) SPY_KUNST.push([Date.UTC(2016, 0, 4) + q * 3600000, 300 - q, 1]);
function kunstLauf(dir, satz) {
  var teile = path.join(dir, 'teile'), zz = '', ee = '', karte = {}; fs.mkdirSync(teile, { recursive: true });
  satz.liste.forEach(function (e) { var x = zaehleKunst(e); zz += JSON.stringify(x.r) + '\n'; ee += JSON.stringify(x.siegel) + '\n'; karte[e.R.reihe] = e.d.bars; });
  fs.writeFileSync(path.join(teile, 'teil-0-von-1.zaehl.ndjson'), zz); fs.writeFileSync(path.join(teile, 'teil-0-von-1.ertrag.ndjson'), ee);
  fs.writeFileSync(path.join(teile, 'teil-0-von-1.fertig'), JSON.stringify({ reihen: satz.liste.length }));
  return { dir: dir, kal: satz.kal, spy: function () { return SPY_KUNST; }, lade: function (n) { return karte[n]; }, signal: istSignal };
}
/** VON HAND, unabhaengig von messen.js: je Signal Ertrag minus Mittel aller Topfkerzen des Tags und der Klasse (ohne Reihentage mit
 *  Signal), minus Huerde der Klasse; Tagesmittel; Mittel ueber Signaltage. Ergebnis in Pp. */
function vonHand(satz) {
  var sigTage = {}, topf = {}, sig = [], tage = {};
  satz.liste.forEach(function (e, s) { e.sig.forEach(function (i) { sigTage[s + '|' + e.d.barTag[i]] = 1; }); });
  satz.liste.forEach(function (e, s) {
    for (var i = VOR; i < e.d.bars.length - H; i++) {
      var t = e.d.barTag[i], r = e.d.bars[i + H][1] / e.d.bars[i][1] - 1, k = t + '|' + e.cls;
      if (sigTage[s + '|' + t]) { if (istSignal(e.d.bars, i)) sig.push([t, k, r, e.cls === 2 ? 0.0647 : 0.0854]); continue; }
      var z = topf[k] || (topf[k] = [0, 0]); z[0]++; z[1] += r;
    }
  });
  sig.forEach(function (x) { var z = tage[x[0]] || (tage[x[0]] = [0, 0, 0]), b = 100 * (x[2] - topf[x[1]][1] / topf[x[1]][0]); z[0]++; z[1] += b; z[2] += b - x[3]; });
  var k = Object.keys(tage), sb = 0, sn = 0; k.forEach(function (t) { sb += tage[t][1] / tage[t][0]; sn += tage[t][2] / tage[t][0]; });
  return { tage: k.length, signale: sig.length, brutto: sb / k.length, netto: sn / k.length };
}
function lesJ(dir, n) { return JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')); }

/* 4. (a) Eingepflanzter Effekt +2 Pp wird in der Groesse gefunden; netto = brutto - Huerde stimmt von Hand; die Kette urteilt. */
var satzA = kunstSatz('kunst-a', 120, 100, 1 / 600, 0.02), dirA = tmp(), ctxA = kunstLauf(dirA, satzA), ergA = M.stufen(ctxA), handA = vonHand(satzA);
var bA = lesJ(dirA, 'stufe-b.json'), aA = lesJ(dirA, 'stufe-a.json'), GA = M.ladeLauf(dirA), zA = M.baueTopf(GA.reihen), TA = M.tagesreihe(zA, M.signalListe(GA.reihen, M.oeffneSiegel(dirA), 'haupt'), 'haupt');
ok(handA.signale >= 50 && Math.abs(bA.brutto.mittelPp - 2) < 0.15, '(a) eingepflanzte +2 Pp gefunden: ' + bA.brutto.mittelPp + ' aus ' + handA.signale + ' Signalen');
ok(Math.abs(M.mom(TA.brutto).mittel - handA.brutto) < 1e-4 && bA.brutto.signaltage === handA.tage, '(a) brutto gleich der Rechnung von Hand (' + handA.brutto + ')');
ok(Math.abs(M.mom(TA.netto).mittel - (M.mom(TA.brutto).mittel - 0.0854)) < 1e-9 && Math.abs(M.mom(TA.netto).mittel - handA.netto) < 1e-4, '(a) netto = brutto - 0,0854 Pp (Klasse 50-250), von Hand');
ok(ergA.urteil && ergA.urteil.form === 'bestätigt' && /^Bestätigt: V2 netto \+1,9\d\d Pp je Signaltag, Band \[\+/.test(ergA.urteil.satz), '(a) Satzform bestaetigt: ' + (ergA.urteil && ergA.urteil.satz));
var satz0 = kunstSatz('kunst-a', 120, 100, 1 / 600, 0), T0 = imSpeicher(satz0);
ok(Math.abs(M.mom(M.tagesreihe(M.baueTopf(T0.reihen), M.signalListe(T0.reihen, T0.siegel, 'haupt'), 'haupt').brutto).mittel) < 0.15, '(a) Gegenprobe: dieselben Signale ohne Einpflanzung liegen bei null, nicht bei 2');
ok(lesJ(dirA, 'nullpunkt.json').bestanden && lesJ(dirA, 'placebo.json').bestanden && lesJ(dirA, 'zaehlung.json').v2.gesamt.signale === handA.signale, 'Kette: Zaehlung, Nullpunkt und Placebo liegen vor dem Mittel auf der Platte');
ok(lesJ(dirA, 'kosten.json').klassenMix['50-250'].signale === handA.signale && Math.abs(lesJ(dirA, 'kosten.json').mittlereHuerdeJeSignalPp - 0.0854) < 1e-9, 'Tor 5: Klassen-Mix und Huerde im Bericht');

/* 5. (b) Zufallssignal => ungefaehr null, |t| < 2; gemischte Klassen: brutto und netto von Hand. */
var satzB = kunstSatz('kunst-b', 120, 100, 1 / 300, 0, { gemischt: true }), SB = imSpeicher(satzB), TB = M.tagesreihe(M.baueTopf(SB.reihen), M.signalListe(SB.reihen, SB.siegel, 'haupt'), 'haupt'), mB = M.mom(TB.brutto), handB = vonHand(satzB);
ok(mB.n > 40 && Math.abs(mB.t) < 2 && Math.abs(mB.mittel) < 0.15, '(b) Zufallssignal: Mittel ' + mB.mittel + ', t ' + mB.t);
ok(Math.abs(mB.mittel - handB.brutto) < 1e-4 && Math.abs(M.mom(TB.netto).mittel - handB.netto) < 1e-4 && TB.zaehler.signale === handB.signale, '(b) zwei Klassen: brutto und netto gleich der Rechnung von Hand');
ok(mB.se >= mB.seNaiv && mB.se >= (mB.seHH || 0) && mB.se >= (mB.seBlock || 0), 'se = die groesste aus naiv, Hansen-Hodrick, Bloecken');
var ts = []; for (q = 0; q < 12; q++) { var Sq = imSpeicher(kunstSatz('kunst-b' + q, 60, 100, 1 / 300, 0)); ts.push(M.mom(M.tagesreihe(M.baueTopf(Sq.reihen), M.signalListe(Sq.reihen, Sq.siegel, 'haupt'), 'haupt').brutto).t); }
ok(Math.max.apply(null, ts.map(Math.abs)) < 3 && ts.filter(function (t) { return Math.abs(t) >= 2; }).length <= 2 && Math.abs(ts.reduce(function (x, y) { return x + y; }, 0) / 12) < 1, '(b) zwoelf Saaten: kein |t| >= 3, hoechstens zwei |t| >= 2 (' + ts.map(function (t) { return t.toFixed(1); }).join(' ') + ')');
var bedB = M.bedarfAus(SB.reihen, satzB.kal), nB = M.torZeile('null', 's', M.baueTopf(SB.reihen), M.nullpunktListe(M.baueTopf(SB.reihen), bedB, 'saat-x')), pB = M.torZeile('placebo', 's', M.baueTopf(SB.reihen), M.placeboListe(M.baueTopf(SB.reihen), bedB, satzB.kal, 'saat-x'));
ok(nB.eintraege === handB.signale && pB.eintraege === handB.signale && Math.abs(nB.t) < 3 && Math.abs(pB.t) < 3, 'Nullpunkt und Placebo: so viele Einstiege wie Signale je Tag, t ' + nB.t + ' / ' + pB.t);
ok(JSON.stringify(M.nullpunktListe(M.baueTopf(SB.reihen), bedB, 'saat-x')) === JSON.stringify(M.nullpunktListe(M.baueTopf(SB.reihen), bedB, 'saat-x')) && JSON.stringify(M.nullpunktListe(M.baueTopf(SB.reihen), bedB, 'saat-x')) !== JSON.stringify(M.nullpunktListe(M.baueTopf(SB.reihen), bedB, 'saat-y')), 'Gegenprobe: gleiche Saat zieht gleich, andere Saat anders');

/* 6. (c) Leck-Klinke: Praefix-Lauf = Ganz-Lauf; Regime-Kerze streng vor dem Signal. */
var eC = satzA.liste.filter(function (e) { return e.sig.length >= 2; })[0], kC = M.leckKlinke(eC.d.bars, istSignal, SPY_KUNST);
ok(kC.feuer === eC.sig.length && kC.abweichungAusloeser === 0 && kC.abweichungRegime === 0, '(c) sauberer Ausloeser: Praefix = ganze Reihe');
ok(M.leckKlinke(eC.d.bars, function (b, i) { return i + 1 < b.length && b[i + 1][2] % 2 === 1; }, SPY_KUNST).abweichungAusloeser > 0, '(c) Gegenprobe: ein Ausloeser, der eine Kerze nach vorn sieht, faellt auf');
var spyC = eC.d.bars.map(function (b, i) { return [b[0], i < eC.sig[0] ? 100 + i : 50, 1]; }), rC = Z.regimeAus(spyC);
var leckRegime = { zeit: rC.zeit, ueber: rC.ueber, offen: function (ms) { var j = -1; for (var i = 0; i < rC.zeit.length && rC.zeit[i] <= ms; i++) j = i; return (j >= 0 ? rC.ueber[j] : null) !== true; } };
ok(M.leckKlinke(eC.d.bars, istSignal, spyC).abweichungRegime === 0 && M.leckKlinke(eC.d.bars, istSignal, spyC, leckRegime).abweichungRegime > 0, '(c) Gegenprobe: ein Regime, das die zeitgleiche SPY-Kerze kennt, faellt auf');
var lA = lesJ(dirA, 'leck-klinke.json');
ok(lA.bestanden && lA.reihen === 20 && lA.abweichungen === 0 && lA.ausloeserGeprueft > 0, 'Kette: Leck-Klinke an 20 Reihen, jede mit Signal');

/* 7. (d) Eine Reihe, die in der Haltedauer endet, wird nach §7 gebucht - beide Regeln, Signal und Topf. */
var kalD = kunstKal(100);
function endeFall(grund, lebend) { var d = kunstReihe('ENDE', kalD, 'kunst-d', { tage: 60 }), i = d.bars.length - 10; d.bars[i][2] += 1; var x = zaehleKunst({ R: { reihe: 'ENDE', lebend: lebend }, d: d, grund: grund }); x.d = d; x.i = i; x.m = new Map([['ENDE', x.siegel]]); return x; }
function wert(x, regel) { var l = M.signalListe([x.r], x.m, regel); return l.length ? l[0].wert : null; }
function topfKerzen(r) { var n = 0, e = 0; r.topf.forEach(function (x) { n += x.length - 4; e += x[3]; }); return [n, e]; }
var f1 = endeFall('insolvenz', 0), f2 = endeFall('freiwillig', 0), f3 = endeFall(null, 1), letzter = Math.round((f1.d.bars[f1.d.bars.length - 1][1] / f1.d.bars[f1.i][1] - 1) * 1e6);
ok(wert(f1, 'haupt') === -1e6 && wert(f1, 'milde') === letzter && wert(f1, 'streng') === -1e6, '(d) Insolvenz: Totalverlust in der Hauptzahl, letzter Kurs nur unter "milde"');
ok(wert(f2, 'haupt') === letzter && wert(f2, 'streng') === -1e6 && f2.r.grund === 'freiwillig', '(d) freiwillig: letzter Kurs in der Hauptzahl, Totalverlust nur unter "streng"');
ok(f3.siegel.ert.length === 0 && f3.r.sig.length === 1 && f3.r.grund === null, '(d) Gegenprobe: lebende Reihe am Archivende - gezaehlt, aber ohne Ertrag (nichts wird erfunden)');
ok(topfKerzen(f1.r).join() === '152,19' && topfKerzen(f3.r).join() === '133,0', '(d) Topf: 19 Kerzen der endenden Reihe bleiben drin (ohne den Signaltag), bei der lebenden keine');
var zD = M.baueTopf([f1.r]).get(59 * 8 + f1.r.topf[f1.r.topf.length - 1][1] + 1);
ok(zD.n === 7 && zD.s.haupt === -7e6 && zD.s.milde !== -7e6 && Math.abs(zD.s.milde) < 2e5, '(d) Topf bucht die endende Reihe wie das Signal: -100 % in der Hauptzahl, letzter Kurs unter "milde"');

/* 8. (e) Sperrliste §8 greift fuer Signal UND Topf: 26 Kerzen vor bis 261 nach der ersten Kerze des Ex-Tags. */
function splitFall(mit) {
  var d = kunstReihe('SPLT', kalD, 'kunst-e', {}); [300, 330, 400, 650].forEach(function (i) { d.bars[i][2] += 1; });
  return zaehleKunst({ R: { reihe: 'SPLT', lebend: 1 }, d: d, splits: mit ? { je: { SPLT: [{ reihe: 'SPLT', ex: kalD[45], art: 'reverse_splits', faktor: 0.5 }] }, liste: [] } : OHNE_SPLITS });
}
var s1 = splitFall(true), s0 = splitFall(false);
ok(s1.r.sig.map(function (s) { return s[5]; }).join() === '1,2,3,0' && s1.siegel.ert.length === 1 && s1.siegel.ert[0][0] === 3, '(e) drei Signale im Sperrfenster tragen keinen Ertrag, das vierte ausserhalb schon');
ok(topfKerzen(s1.r)[0] === 118 && s1.r.topf.every(function (e) { return e[0] <= 41 || (e[0] === 82 && e.length === 8) || e[0] > 82; }), '(e) Topf: keine Kerze aus dem Sperrfenster 289 ... 576 (118 bleiben, vom Tag 82 nur die vier Kerzen danach)');
ok(s0.siegel.ert.length === 4 && topfKerzen(s0.r)[0] === 385, '(e) Gegenprobe ohne Sperrliste: vier Signale mit Ertrag, 385 Topfkerzen');

/* 9. (f) Zwei-Stufen-Sperre: Stufe B verweigert ohne Stufe A auf der Platte und bei MDE80 > 1,107 Pp. */
var dirF = tmp(), ctxF = kunstLauf(dirF, satzA), GF = M.ladeLauf(dirF), zF = M.baueTopf(GF.reihen), pA = path.join(dirF, 'stufe-a.json');
ok(wirft(function () { M.stufeB(ctxF, GF.reihen, zF); }, /SPERRE: Stufe A liegt nicht/), '(f) ohne stufe-a.json rechnet Stufe B nicht');
fs.writeFileSync(pA, JSON.stringify({ mde80: 1.2, stufeBGesperrt: true }));
ok(wirft(function () { M.stufeB(ctxF, GF.reihen, zF); }, /SPERRE: MDE80/), '(f) MDE80 1,2 Pp > 1,107: das Mittel bleibt zu');
fs.writeFileSync(pA, JSON.stringify({ mde80: 1.2, stufeBGesperrt: false }));
ok(wirft(function () { M.stufeB(ctxF, GF.reihen, zF); }, /SPERRE: MDE80/), '(f) eine von Hand umgelegte Flagge oeffnet nicht - die Zahl entscheidet');
var aF = M.stufeA(ctxF, GF.reihen, zF); fs.writeFileSync(pA, JSON.stringify(aF));
ok(!/"(mittel\w*|band\w*|t)":/i.test(JSON.stringify(aF)) && aF.signaltage === handA.tage && aF.se > 0 && Math.abs(aF.mde80 - M.Z80 * M.mom(TA.netto).se) < 1e-12, '(f) Stufe A traegt N, se und MDE80 - kein Mittel, kein Band, kein t');
ok(typeof M.stufeB(ctxF, GF.reihen, zF).netto.mittelPp === 'number' && JSON.stringify(aA.se) === JSON.stringify(aF.se), '(f) Gegenprobe: mit Stufe A auf der Platte und MDE80 <= 1,107 oeffnet Stufe B');
var satzN = kunstSatz('kunst-n', 30, 100, 1 / 800, 0, { rausch: 0.03 }), dirN = tmp(), ergN = M.stufen(kunstLauf(dirN, satzN));
ok(ergN.urteil && ergN.urteil.form === 'nicht entscheidbar' && !fs.existsSync(path.join(dirN, 'stufe-b.json')) && lesJ(dirN, 'stufe-a.json').stufeBGesperrt === true, '(f) Kette bei grosser Streuung: nicht entscheidbar, keine stufe-b.json' + (ergN.abbruch ? ' (Abbruch ' + ergN.abbruch.abbruchIn + ')' : ''));
ok(!/mittelPp|band95/.test(fs.readFileSync(path.join(dirN, 'nachrichtlich.json'), 'utf8')), '(f) gesperrt: die nachrichtlichen Zeilen tragen nur N und se');
M.bericht(dirN, dirN); M.bericht(dirA, dirA);
var eN = fs.readFileSync(path.join(dirN, 'ERGEBNIS.md'), 'utf8'), eA = fs.readFileSync(path.join(dirA, 'ERGEBNIS.md'), 'utf8');
ok(/das Mittel wurde nicht geöffnet/.test(eN) && eA.indexOf('**' + ergA.urteil.satz + '**') > 0 && !/kante|handelbar/i.test(eN + eA + JSON.stringify(lesJ(dirA, 'protokoll.json'))), 'Bericht: Urteilssatz zuerst, die verbotenen Woerter stehen nirgends');

/* 10. Abbruch, Wiederaufnahme, Totalverlust-Liste, Strategiedatei. */
var dirX = tmp(); kunstLauf(dirX, satzN); fs.writeFileSync(path.join(dirX, 'abbruch.json'), JSON.stringify({ abbruchIn: 'Tor 2 Nullpunkt' }));
ok(M.stufen({ dir: dirX, kal: satzN.kal }).abbruch.abbruchIn === 'Tor 2 Nullpunkt' && !fs.existsSync(path.join(dirX, 'stufe-a.json')), 'nach einem Abbruch in Tor 2-4 rechnet ein neuer Start nicht weiter');
var jd = path.join(dirX, 'j.ndjson'); fs.writeFileSync(jd, '{"reihe":"A","x":1}\n{"reihe":"B","x":2}\n{"reihe":"C","x":');
ok(Array.from(M.leseJournal(jd).keys()).join() === 'A,B', 'Wiederaufnahme: die zerrissene letzte Zeile zaehlt nicht, die Reihe wird neu gerechnet');
fs.appendFileSync(path.join(dirX, 'teile', 'teil-0-von-1.zaehl.ndjson'), fs.readFileSync(path.join(dirX, 'teile', 'teil-0-von-1.zaehl.ndjson'), 'utf8').split('\n')[0] + '\n');
ok(wirft(function () { M.ladeLauf(dirX); }, /Zeilen, erwartet|doppelt/), 'Gegenprobe: eine doppelt gefuehrte Reihe haelt die Auswertung an');
var kt = fs.readFileSync(path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13', 'konfig.js'), 'utf8');
['haupt', 'streng', 'milde'].forEach(function (k) {
  var m = kt.match(new RegExp("key: '" + k + "'[^\\n]*totalverlust: \\[([^\\]]*)\\]")), l = m ? m[1].split(',').map(function (s) { return s.trim().replace(/'/g, ''); }).filter(Boolean).sort().join() : null;
  ok(l === Object.keys(M.REGELN[k]).sort().join(), 'Totalverlust-Liste "' + k + '" gleich K.EMPFINDLICHKEIT im Pruefstand (' + l + ')');
});
var sp = M.strategiePruefung();
ok(sp.zeichengleich && sp.sha256 === sp.sha256QuelleImProtokoll, 'Strategiedatei zeichengleich mit der Quelle im Protokoll (sha256 ' + sp.sha256.slice(0, 16) + ')');
TMP.forEach(function (d) { fs.rmSync(d, { recursive: true, force: true }); });

console.log(gut + ' gruen, ' + rot + ' rot');
process.exit(rot ? 1 : 0);
