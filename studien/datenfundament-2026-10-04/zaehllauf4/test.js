'use strict';
/* TEST der Regeln des vierten Zaehllaufs (Auftrag Nr. 92) - nur Kunstfaelle, kein Netz, kein Cache, kein Panel, nichts auf E:.
 * Je Aenderung (V9 mit a, b, c einzeln; E1 bis E7) ein Kunstfall und ein Gegenfall, dazu die Grenzen (45 von 60, 75 %,
 * 5 Handelstage, 8,00 $ roh, 30 Tage) und die Gegenprobe "alle Aenderungen aus = Einstufung des dritten Laufs".
 * Aufruf:  node test.js      (Ausgang 0 = alles gruen)
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var U = require('./t4-universum.js');
var E = require('./t4-einstufen.js');
var E3L = require('../zaehllauf3/t4-einstufen.js');
var W = require('./wortlaut.js');
var ED = require('./t4-edgar.js');
var ZW = require('./zwilling.js');
var A = require('./t4-auswerten.js');
var LF = require('./lauf.js');

var gut = 0, schlecht = 0;
function ok(b, was) { if (b) gut++; else { schlecht++; console.log('FEHLER: ' + was); } }
function gleich(a, b, was) { ok(JSON.stringify(a) === JSON.stringify(b), was + ' - ist ' + JSON.stringify(a) + ', soll ' + JSON.stringify(b)); }

var ANKER = '2022-12-29';
function tg(n) { return G.tagPlus(ANKER, n); }
var RK = { reihe: 'K', basis: 'K', ordner: 'K', art: 'CS', gruppe: 'verschwunden', letzterKursArchiv: 1, letzterKursRoh: 1, massnahmeEnde: null, endeMassnahmen: [], polygonEintraege: [],
  polygonFirma: { cik: '1', name: 'Kunst AG', bis: tg(1), tage: 1 }, letzterBalken: ANKER, zwilling: null };
function R(mehr) { return Object.assign({}, RK, mehr || {}); }
var ZP = { cik: '1', sicherheit: 'stark', weg: 'polygon-cik' }, ZF = { cik: '1', sicherheit: 'mittel', weg: 'fts-mehrheit' };
function S(l, mehr) { return Object.assign({ cik: '1', name: 'Kunst AG', sic: '1000', einreichungen: l }, mehr || {}); }
function texter(texte) { return function (a) { var t = (texte || {})[a]; return t === undefined ? null : t === false ? { fehlt: 1 } : { text: t }; }; }
function st(r, z, s, texte, aus) {
  var O = Object.assign({}, E.ALLE_AN, { text: texter(texte) });
  (aus || []).forEach(function (k) { O[k] = 0; });
  return E.stufeEin(r, z, s, {}, 0, null, O);
}
function gb(u) { return [u.grund, u.beleg]; }
var TITEL = 'Item 3.01 Notice of Delisting or Failure to Satisfy a Continued Listing Rule or Standard; Transfer of Listing.\n';
var ENDE = '\nItem 9.01 Financial Statements and Exhibits.\n(d) Exhibits\nSIGNATURE\nPursuant to the requirements of the Securities Exchange Act of 1934 the registrant has duly caused this report to be signed.\n';
var TV = 'FORM 8-K\n' + TITEL + 'On December 20, 2022, in connection with the consummation of the merger, the Company notified Nasdaq and requested that trading of the shares be suspended.' + ENDE;
var TR = 'FORM 8-K\n' + TITEL + 'On December 20, 2022, the Company received a letter from Nasdaq stating that the Company is not in compliance with the minimum bid price requirement.' + ENDE;
var TE = 'FORM 8-K\n' + TITEL + 'On December 20, 2022, the Board approved the voluntary delisting of the common stock from the New York Stock Exchange.' + ENDE;
var TN = 'FORM 8-K\n' + TITEL + 'On December 20, 2022, the Company notified the exchange that its shares will cease to trade.' + ENDE;
function k301(d, a, it) { return { f: '8-K', d: d, a: a || 'A1', it: it || '3.01,9.01' }; }
function nse(n, a) { return { f: '25-NSE', d: tg(n), a: a || 'N1', it: '' }; }

/* ---- 1 V9: Zwilling, reine Pruefung (zwilling.js) ---- */
function reihe(n, ab, f) { var r = { tage: [], roh: [], verh: [] }; for (var i = 0; i < n; i++) { r.tage.push(ab + i); r.roh.push(10 + i / 100); r.verh.push(1 + i / 1000); } if (f) f(r); return r; }
var D60 = reihe(60, 100), C = reihe(70, 95);   // C: Tage 95..164, D: 100..159 -> gleiche Kurse? nein - erst angleichen
function wie(D, extraVor, extraNach, f) { var r = { tage: [], roh: [], verh: [] }; var a = D.tage[0] - extraVor, n = D.tage.length + extraVor + extraNach;
  for (var i = 0; i < n; i++) { var t = a + i, j = ZW.finde(D.tage, t); r.tage.push(t); r.roh.push(j >= 0 ? D.roh[j] : 99); r.verh.push(j >= 0 ? D.verh[j] : 1); } if (f) f(r); return r; }
C = wie(D60, 5, 5);
var p = ZW.pruefe(D60, C);
gleich([p.a, p.b, p.bGleich, p.bTage, p.c, p.cTage, p.ok], [true, true, 60, 60, true, 5, true], '1.1 V9: gleiche Kurse, fuenf Tage Nachlauf -> Zwilling');
gleich(ZW.pruefe(D60, wie(D60, 0, 5, function (r) { r.roh[59] = 99; })).a, false, '1.2 V9 (a) Gegenfall: roher Schluss am letzten Tag anders');
gleich(ZW.pruefe(D60, wie(D60, 0, 5, function (r) { r.verh[58] = r.verh[58] * 1.001; })).a, false, '1.3 V9 (a) Gegenfall: Verhaeltnis Eroeffnung/Schluss am vorletzten Tag anders');
var pt = ZW.pruefe(D60, wie(D60, 0, 5, function (r) { r.verh[57] = r.verh[57] * (1 + 1e-12); }));
gleich([pt.a, pt.aExakt], [true, false], '1.4 V9 (a): Rundung im 12. Stellenwert gilt als gleich (Toleranz 1e-9), nicht exakt');
gleich(ZW.pruefe(D60, wie(D60, 0, 5, function (r) { for (var i = 0; i < 15; i++) r.roh[i] = 99; })).b, true, '1.5 V9 (b) Grenze: 45 von 60 gleich -> ja');
var p44 = ZW.pruefe(D60, wie(D60, 0, 5, function (r) { for (var i = 0; i < 16; i++) r.roh[i] = 99; }));
gleich([p44.a, p44.b, p44.bGleich, p44.ok], [true, false, 44, false], '1.6 V9 (b) Gegenfall: 44 von 60 -> kein Zwilling, obwohl (a) gilt');
var D20 = reihe(20, 100);
gleich([ZW.pruefe(D20, wie(D20, 0, 5, function (r) { for (var i = 0; i < 5; i++) r.roh[i] = 99; })).b, ZW.pruefe(D20, wie(D20, 0, 5, function (r) { for (var i = 0; i < 6; i++) r.roh[i] = 99; })).b, ZW.bNoetig(20), ZW.bNoetig(4), ZW.bNoetig(60), ZW.bNoetig(500)],
  [true, false, 15, 3, 45, 45], '1.7 V9 (b) kurze Reihe: 75 % (15 von 20 ja, 14 nein); noetig bei 4 / 60 / 500 Tagen');
gleich([ZW.pruefe(D60, wie(D60, 0, 5)).c, ZW.pruefe(D60, wie(D60, 0, 4)).c, ZW.pruefe(D60, wie(D60, 0, 4)).cTage], [true, false, 4], '1.8 V9 (c) Grenze: fuenf Handelstage Nachlauf ja, vier nein');
var pg = ZW.pruefe(D60, wie(D60, 3, 0));
gleich([pg.a, pg.gleichesEnde, pg.c, pg.ok], [true, true, false, false], '1.9 V9: gleiches Ende ist kein Fall (gesondert gezaehlt)');
gleich(ZW.pruefe(reihe(2, 100), wie(reihe(2, 100), 0, 9)).zuKurz, 1, '1.10 V9: Reihe mit weniger als drei Tagen kann keinen Zwilling haben');
gleich(ZW.doppelte(D60, wie(D60, 0, 5, function (r) { for (var i = 0; i < 10; i++) r.roh[i] = 99; })), 50, '1.11 doppelte Zeilen: Tage mit gleichem rohem Schluss');
gleich(ZW.waehle([{ name: 'X', p: { ok: true, bGleich: 50, cTage: 9 } }, { name: 'Y', p: { ok: true, bGleich: 55, cTage: 5 } }, { name: 'Z', p: { ok: false, bGleich: 60, cTage: 99 } }]).name, 'Y', '1.12 Wahl: nur wer a, b, c erfuellt; dann die meisten gleichen Tage');
/* V9 in der Einstufung */
var ZWI = { ok: true, name: 'KNEU', ende: tg(0), bGleich: 60, bTage: 60, cTage: 900, doppelte: 1200 };
var mBar = [{ art: 'cash_mergers', ex: tg(1), id: 'c1', rate: 5, rolle: 'abgebend' }];
var u9 = st(R({ zwilling: ZWI, endeMassnahmen: mBar }), ZP, S([k301(tg(-9))]), { A1: TR });
gleich([u9.grund, u9.beleg, u9.regel, u9.zwilling, u9.doppelt, u9.nachfolger], ['umbenennung-ticker', 'zwilling-im-archiv', 'Z', 'KNEU', true, 'KNEU'], '1.13 V9 vor allem anderen, auch vor einer Baruebernahme bei Alpaca');
gleich([st(R({ zwilling: ZWI, endeMassnahmen: mBar }), ZP, null, {}, ['V9']).grund, st(R({ endeMassnahmen: mBar }), ZP, null, {}).grund], ['uebernahme', 'uebernahme'], '1.14 V9 Gegenfaelle: Regel aus; kein Zwilling');

/* ---- 2 E1: Insolvenz-Kuerzel ---- */
function um(basis, neu, aus) { return st(R({ basis: basis, reihe: basis, endeMassnahmen: [{ art: 'name_changes', ex: tg(1), id: 'n1', neuesKuerzel: neu, rolle: 'abgebend' }] }), ZP, null, {}, aus); }
gleich([um('ABCD', 'ABCDQ').beleg, um('WE', 'WEWKQ').beleg, um('AB', 'ABQ').beleg, um('ABC', 'ABCQ').beleg], ['q-kuerzel', 'q-kuerzel', 'q-kuerzel', 'q-kuerzel'], '2.1 E1: fuenf Zeichen mit Q; altes Kuerzel plus Q (3 und 4 Zeichen)');
gleich([gb(um('DMYD', 'IONQ')), um('ADES', 'ARQ').grund, um('ABC', 'XYZQ').grund], [['umbenennung-ticker', 'alpaca-name_changes'], 'umbenennung-ticker', 'umbenennung-ticker'], '2.2 E1 Gegenfall: vier Zeichen mit Q, nicht altes plus Q -> Regel 1 (IONQ, ARQ)');
gleich([um('DMYD', 'IONQ', ['E1']).beleg, E.qKuerzel('IONQ', 'DMYD', { E1: 0 }), E.qKuerzel('ABCDEQ', 'X', { E1: 1 }), E.qKuerzel('BRK-BQ', 'BRK-B', { E1: 1 })], ['q-kuerzel', true, false, true], '2.3 E1 aus = dritter Lauf; sechs Zeichen nein; Punkt/Bindestrich');

/* ---- 3 E2 und E7: Mantel ---- */
function mantel(name, sic, roh, archiv, l, texte, aus, mehr) {
  return st(R(Object.assign({ letzterKursRoh: roh, letzterKursArchiv: archiv }, mehr || {})), ZP, S(l || [k301(tg(-9))], { sic: sic, name: name }), texte || { A1: TR }, aus);
}
var mn = mantel('Foo Acquisition Corp', '1000', 8, 8);
gleich([mn.grund, mn.beleg, mn.regel, mn.mantel_merkmal, mn.mantel_weg, mn.wortlaut], ['spac-ende', 'edgar-mantel+8K-3.01', 9, 'name-edgar', '8K-3.01-v3', 'ruege'], '3.1 E2: Mantel-Name, roher Kurs 8,00 $, 3.01 nach V3 -> spac-ende (Regel 9)');
gleich(['Bar Blank Check Co', 'Baz Merger Corp', 'Qux Merger Sub Inc', 'Ares Capital Corp'].map(function (n) { return mantel(n, '1000', 10, 10).grund; }), ['spac-ende', 'spac-ende', 'spac-ende', 'spac-ende'], '3.2 E2: die fuenf Namensmuster (ohne Gross- und Kleinschreibung)');
gleich([mantel('Neu Inc', '1000', 10, 10, null, null, null, {}).grund, st(R({ letzterKursRoh: 10 }), ZP, S([k301(tg(-9))], { sic: '1000', name: 'Neu Inc', frueher: ['OLD ACQUISITION CORP'] }), { A1: TR }).mantel_merkmal,
  st(R({ letzterKursRoh: 10, polygonFirma: { cik: '1', name: 'Kunst Merger Corp. Units', bis: tg(1), tage: 1 } }), ZP, S([k301(tg(-9))], { name: 'Kunst AG' }), { A1: TR }).mantel_merkmal],
  ['zwangs-delisting', 'name-frueher', 'name-polygon'], '3.3 E2: kein Mantel-Name -> Regel 11; frueherer Name; Polygon-Name');
gleich([mantel('Foo Acquisition Corp', '1000', 7.99, 10).grund, mantel('Foo Acquisition Corp', '6770', 7.99, 10).grund, mantel('Foo Acquisition Corp', '6770', 8, 7.99).grund, mantel('Foo Acquisition Corp', '6770', null, 10).grund],
  ['zwangs-delisting', 'zwangs-delisting', 'spac-ende', 'zwangs-delisting'], '3.4 E7 Grenze: roh 7,99 $ kein Mantel (auch bei bereinigt 10 $ und SIC 6770); roh 8,00 $ bei bereinigt 7,99 $ ja; ohne rohen Kurs nein');
gleich([mantel('Foo Acquisition Corp', '1000', 10, 10, null, null, ['E2']).grund, mantel('Foo Acquisition Corp', '6770', 7.99, 10, null, null, ['E7']).grund], ['zwangs-delisting', 'spac-ende'], '3.5 E2 aus: nur SIC 6770; E7 aus: bereinigter Kurs');
gleich(gb(mantel('Foo Acquisition Corp', '1000', 10, 10, null, { A1: TV })), ['spac-ende', 'edgar-mantel+8K-3.01'], '3.6 E2: Regel 9 vor dem Wortlaut - auch ein Vollzug am Anker ist spac-ende');
var mf = mantel('Bar Merger Corp', '1000', 10, 10, [k301(tg(-300)), nse(5)]);
gleich([mf.grund, mf.mantel_weg, mf.datum, mantel('Bar Merger Corp', '1000', 10, 10, [k301(tg(-300))]).grund, mantel('Bar Merger Corp', '1000', 10, 10, [k301(tg(-300)), nse(5)], { A1: TN }).grund, mantel('Foo Acquisition Corp', '1000', 10, 10, [k301(tg(-300)), nse(5)]).beleg],
  ['spac-ende', 'ruege-frueh+25-NSE', tg(5), 'unbekannt', 'abgemeldet-anlass-offen', 'edgar-mantel+abmeldung'], '3.7 E2 zweite Bedingung: fruehe Ruege + 25-NSE am Anker; ohne Formular nicht; ohne Ruege-Wortlaut nicht (-> Regel 13); Regel 7 bleibt davor');
var ra = st(R({ letzterKursRoh: 2, letzterKursArchiv: 4, endeMassnahmen: [{ art: 'cash_mergers', ex: tg(1), id: 'c', rate: 3, rolle: 'abgebend' }] }), ZP, null, {});
gleich([ra.aufschlag_pp, st(R({ letzterKursRoh: 2, letzterKursArchiv: 4, endeMassnahmen: ra ? [{ art: 'cash_mergers', ex: tg(1), id: 'c', rate: 3, rolle: 'abgebend' }] : [] }), ZP, null, {}, ['E7']).aufschlag_pp, ra.letzter_kurs_roh], [50, -25, 2], '3.8 E7: Aufschlag gegen den rohen Kurs; E7 aus: bereinigt');

/* ---- 4 E3: fruehe Ruege ---- */
function r11(n301, text, mehr, aus) { return st(R(), ZP, S([k301(tg(n301))].concat(mehr || [])), { A1: text || TR }, aus); }
gleich([gb(r11(-30)), gb(r11(30)), r11(-30).regel], [['zwangs-delisting', 'edgar-8K-3.01-ruege'], ['zwangs-delisting', 'edgar-8K-3.01-ruege'], 11], '4.1 E3 Grenze: Ruege 30 Tage vor oder nach dem Anker -> Regel 11');
gleich([r11(-31).grund, r11(-180).grund, gb(r11(-31, TR, [nse(5)])), r11(-31, TR, [nse(5)]).regel], ['unbekannt', 'unbekannt', ['zwangs-delisting', 'edgar-8K-3.01-ruege-frueh+25-NSE'], 12], '4.2 E3: Ruege 31 bzw. 180 Tage davor greift in Regel 11 nicht; mit 25-NSE -> Regel 12');
gleich([r11(-550, TR, [nse(-30)]).regel, r11(-551, TR, [nse(5)]).regel, r11(-100, TR, [nse(31)]).grund, r11(-100, TR, [nse(-31)]).grund], [12, 13, 'unbekannt', 'unbekannt'], '4.3 E3 Grenzen Regel 12: 550 Tage ja, 551 nein (-> Regel 13); 25-NSE 31 Tage am Anker nein (und E5 haelt Regel 13 zu)');
gleich([gb(r11(-100, TR, [], ['E3'])), r11(-300, TR, [nse(5)], ['E3']).regel, r11(-100, TR, [nse(5)], ['E3']).regel], [['zwangs-delisting', 'edgar-8K-3.01-ruege'], 12, 11], '4.4 E3 aus = dritter Lauf: Ruege 100 Tage davor ist Regel 11');
var zwei = st(R(), ZP, S([k301(tg(-40), 'A1'), k301(tg(-200), 'A2'), nse(5)]), { A1: TN, A2: TR }), drei = st(R(), ZP, S([k301(tg(-100), 'A1'), k301(tg(-300), 'A2'), nse(5)]), { A1: TR, A2: TR });
gleich([zwei.grund, zwei.quelle, drei.grund, drei.quelle], ['abgemeldet-anlass-offen', 'EDGAR:A1 (8-K ' + tg(-40) + ')', 'zwangs-delisting', 'EDGAR:A1 (8-K ' + tg(-100) + ')'],
  '4.5 E3: das naechste 3.01 nach V3 ohne Ruege entscheidet in Regel 11 (Zeile 5) vor einer frueheren Ruege; von zwei fruehen Rueggen nimmt Regel 12 die dem Anker naechste');
gleich(gb(st(R(), ZP, S([k301(tg(-40), 'A1'), k301(tg(-60), 'A2'), nse(5)]), { A1: TR, A2: TN })), ['zwangs-delisting', 'edgar-8K-3.01-ruege-frueh+25-NSE'], '4.6 E3: das naechste 3.01 nach V3 ist eine fruehe Ruege -> Regel 12, nicht Regel 11');

/* ---- 5 E4: unklarer Wortlaut ---- */
var u4 = r11(-9, TN);
gleich([u4.grund, u4.beleg, u4.regel, u4.v2_zeile, u4.wortlaut_unklar], ['abgemeldet-anlass-offen', 'edgar-8K-3.01-unklar', 11, 5, 1], '5.1 E4: Regel 11 Zeile 5 -> abgemeldet-anlass-offen');
gleich([gb(r11(-9, TN, [], ['E4'])), r11(-89, TV).grund, r11(-9, TE).grund], [['zwangs-delisting', 'edgar-8K-3.01'], 'abgemeldet-anlass-offen', 'freiwillig'], '5.2 E4 aus = dritter Lauf; Vollzug fern vom Anker ist Zeile 5; eigener Entschluss bleibt freiwillig');

/* ---- 6 E5: Formular 25 ohne Abmelde-Meldung ---- */
function f25(n, aus) { return st(R(), ZF, S([{ f: '25-NSE', d: tg(n), a: 'B1', it: '' }]), {}, aus); }
gleich([f25(30).grund, f25(-30).grund, f25(31).grund, f25(-31).grund, f25(-300).grund, f25(-300, ['E5']).grund], ['abgemeldet-anlass-offen', 'abgemeldet-anlass-offen', 'unbekannt', 'unbekannt', 'unbekannt', 'abgemeldet-anlass-offen'], '6.1 E5 Grenze 30 Tage; fern vom Anker -> unbekannt; E5 aus = dritter Lauf');
gleich(gb(st(R(), ZF, S([{ f: '25', d: tg(-100), a: 'B1', it: '' }, { f: '15-12G', d: tg(-90), a: 'B2', it: '' }]), {})), ['freiwillig', 'edgar-formular15'], '6.2 E5: fernes Formular 25 -> weiter zu Formular 15');

/* ---- 7 E6: Namensprobe der Suchfirma ---- */
var pa = { name: 'Symantec Corp' };
gleich([ED.e6Probe({ name: 'BROADCOM INC.', frueher: [], tickers: ['AVGO'] }, pa, 'SYMC'), ED.e6Probe({ name: 'Gen Digital Inc.', frueher: ['NORTONLIFELOCK INC.', 'SYMANTEC CORP'] }, pa, 'SYMC'), ED.e6Probe({ name: 'X', tickers: ['SYMC'] }, pa, 'SYMC'), ED.e6Probe(null, pa, 'SYMC')],
  [{ ok: false, probe: 'nichts' }, { ok: true, probe: 'frueher' }, { ok: true, probe: 'kuerzel' }, { ok: false, probe: 'ohne-auszug' }], '7.1 E6: Broadcom faellt durch; frueherer Name und Kuerzel bestehen; ohne Auszug faellt durch');
var ohneCik = R({ polygonFirma: null, polygonEintraege: [{ bis: tg(45), name: 'Kunst AG', cik: null }] }), weit = R({ polygonFirma: null, polygonEintraege: [{ bis: tg(46), name: 'Kunst AG', cik: '1' }] });
gleich([ED.betroffen(R(), { weg: 'fts-mehrheit', cik: '9' }), ED.betroffen(R(), { weg: 'polygon-cik', cik: '1' }), ED.betroffen(ohneCik, { weg: 'fts-knapp', cik: '9' }), ED.betroffen(weit, { weg: 'fts-knapp', cik: '9' }), ED.betroffen(R(), { weg: 'fts-leer', cik: null })],
  [true, false, true, false, false], '7.2 E6 betroffen: Suchfirma mit Polygon-Eintrag am Anker (auch ohne CIK, Grenze 45 Tage); nicht bei Polygon-CIK, nicht ohne Firma');
gleich([Z3.polygonAmAnker(ohneCik).name, Z3.polygonAmAnker(weit), Z3.polygonAmAnker(R()).mitCik], ['Kunst AG', null, 1], '7.3 Polygon-Eintrag am Anker: hoechstens 45 Tage; der Eintrag mit CIK nach R-a geht vor');

/* ---- 8 Gegenprobe: alle Aenderungen aus = dritter Lauf ---- */
var alleAus = Object.assign({}, E.ALLE_AN, LF.NEUE_AUS);
var faelle = [[R(), S([k301(tg(-9))]), { A1: TN }], [R(), S([k301(tg(-100))]), { A1: TR }], [R({ letzterKursArchiv: 10, letzterKursRoh: 2 }), S([k301(tg(-9))], { sic: '6770' }), { A1: TR }], [R({ letzterKursArchiv: 10 }), S([k301(tg(-9))], { name: 'Foo Acquisition Corp' }), { A1: TR }],
  [R(), S([k301(tg(-300)), nse(5)]), { A1: TR }], [R(), S([k301(tg(-40)), nse(5)]), { A1: TR }], [R(), S([{ f: '25-NSE', d: tg(-200), a: 'B', it: '' }]), {}], [R({ endeMassnahmen: [{ art: 'name_changes', ex: tg(1), id: 'n', neuesKuerzel: 'IONQ', rolle: 'abgebend' }] }), null, {}],
  [R({ zwilling: ZWI }), S([k301(tg(-9))]), { A1: TV }], [R(), S([k301(tg(-89))]), { A1: TV }]];
faelle.forEach(function (f, i) {
  [ZP, ZF].forEach(function (z) {
    var o4 = Object.assign({}, alleAus, { text: texter(f[2]) }), o3 = Object.assign({}, E3L.ALLE_AN, { text: texter(f[2]) });
    gleich(gb(E.stufeEin(f[0], z, f[1], {}, 0, null, o4)), gb(E3L.stufeEin(f[0], z, f[1], {}, 0, null, o3)), '8.1 alle Aenderungen aus = Einstufung des dritten Laufs (Fall ' + i + ', ' + z.weg + ')');
  });
});

/* ---- 9 die Kopie gegen den dritten Lauf: jede geaenderte Zeile traegt eine Marke ---- */
var orig = fs.readFileSync(path.join(Z3.Z3ORDNER, 't4-einstufen.js'), 'utf8').split(/\r?\n/), kop = fs.readFileSync(path.join(Z3.HIER, 't4-einstufen.js'), 'utf8').split(/\r?\n/);
var imOrig = {}, inKop = {}; orig.forEach(function (l) { imOrig[l] = 1; }); kop.forEach(function (l) { inKop[l] = 1; });
var neueZeilen = kop.filter(function (l) { return !imOrig[l]; }), fehlende = orig.filter(function (l) { return !inKop[l]; });
var jeMarke = { V9: 0, E1: 0, E2: 0, E3: 0, E4: 0, E5: 0, E7: 0, RAHMEN4: 0, ohne: [] };
neueZeilen.forEach(function (l) {
  var m = /\/\/ ((?:V\d\w*|E\d|RAHMEN4)(?: (?:V\d\w*|E\d|RAHMEN4))*)(?::.*)?$/.exec(l) || (/^\/\/ RAHMEN4/.test(l) ? [0, 'RAHMEN4'] : null);
  var neu = m ? m[1].split(' ').filter(function (k) { return jeMarke[k] !== undefined; }) : [];
  if (!neu.length) { jeMarke.ohne.push(l.slice(0, 80)); return; }
  neu.forEach(function (k) { jeMarke[k]++; });
});
gleich(jeMarke.ohne, [], '9.1 jede geaenderte Zeile der Kopie traegt eine Marke des vierten Laufs (V9 E1 E2 E3 E4 E5 E7 RAHMEN4)');
console.log('   Umfang: ' + neueZeilen.length + ' neue oder geaenderte Zeilen, ' + fehlende.length + ' Zeilen des dritten Laufs ersetzt; je Marke ' + JSON.stringify(jeMarke).replace(/,"ohne":\[\]/, ''));
['ms', 'tage', 'imFenster', 'leer', 'fenster', 'akz', 'emittent25', 'hat501', 'endeFuer', 'ausgesetzt', 'vereinige', 'wortlautVon'].forEach(function (n) { ok(String(E[n]) === String(E3L[n]), '9.2 Funktion ' + n + '() wortgleich mit dem dritten Lauf'); });
ok(fs.readFileSync(path.join(Z3.HIER, 'wortlaut.js'), 'utf8') === fs.readFileSync(path.join(Z3.Z3ORDNER, 'wortlaut.js'), 'utf8') && W.FASSUNG === 2, '9.3 Wortlisten unveraendert (wortlaut.js gleich dem dritten Lauf, Fassung 2)');
var quelltext = String(E.urteil), marken = ["'zwilling-im-archiv'", "'q-kuerzel'", "'alpaca-name_changes'", "'alpaca-' + E.art", "'alpaca-stock_mergers'", "'edgar-8K-1.03'", "'edgar-8K-2.01+prospekt'", "'alpaca-redemptions'", "'edgar-mantel+abmeldung'", "'alpaca-worthless_removals'",
  "'edgar-mantel+8K-3.01'", "beleg: 'ausgesetzt'", "'edgar-8K-3.01-vollzug'", "'edgar-8K-3.01-unklar'", "'edgar-8K-3.01-ruege-frueh+25-NSE'", "'edgar-formular25'", "'edgar-formular15'", "grund: 'unbekannt'"];
var orte = marken.map(function (m) { return quelltext.indexOf(m); });
ok(orte.every(function (o, i) { return o > 0 && (i === 0 || o > orte[i - 1]); }), '9.4 Rangfolge Z, 0 bis 15 steht in dieser Reihenfolge in urteil() - Orte ' + orte.join(','));

/* ---- 10 Rahmen ---- */
ok(1000 / ED.MIN_ABSTAND_MS <= 5 && ED.MIN_ABSTAND_SUCHE_MS >= 350 && ED.SPERRE_WARTEN_MS === 600000 && Z3.MAX_ANFRAGEN === 500, '10.1 hoechstens 5 Anfragen je Sekunde, zehn Minuten bei Sperre, Obergrenze 500');
var mj = { series: [[Date.UTC(2022, 11, 29, 20, 59), 1.5, 10, 1, 1, 1], [Date.UTC(2022, 11, 29, 21, 30), 1.7, 10, 1, 1, 1], [Date.UTC(2022, 11, 30, 15, 0), 9, 10, 1, 1, 1]],
  sitzungen: [{ von: Date.UTC(2022, 11, 29, 14, 30), bis: Date.UTC(2022, 11, 29, 20, 59), sitzung: 'regulaer' }, { von: Date.UTC(2022, 11, 29, 21, 0), bis: Date.UTC(2022, 11, 30, 0, 0), sitzung: 'nach' }, { von: Date.UTC(2022, 11, 30, 14, 30), bis: Date.UTC(2022, 11, 30, 21, 0), sitzung: 'regulaer' }] };
gleich([U.letzteMinute(mj, ANKER).schluss, U.letzteMinute(mj, '2022-12-30').schluss, U.letzteMinute(mj, '2022-12-28')], [1.5, 9, null], '10.2 E7: letzter Minutenschluss = letzte regulaere Kerze am oder vor dem Anker');
gleich([A.ursachen({ ohne: { E3: 1, E5: 1 } }), A.ursachen({ ohne: {} }), A.vergleiche({ grund: 'zwangs-delisting' }, { grund: 'abgemeldet-anlass-offen' })], [['E3', 'E5'], ['zusammen'], 'kippt'], '10.3 Ursachen eines Kipp-Falls; Vergleich');
gleich([Z3.mantelName({ name: 'X' }, 'Y Blank Check'), Z3.mantelName({ name: 'Acquisitions Inc' }, null), Z3.mantelName(null, null)], ['polygon', 'edgar', null], '10.4 Mantel-Name: Polygon-Name; Teilwort (so steht es im Auftrag); nichts');

console.log((schlecht ? 'ROT' : 'GRUEN') + ': ' + gut + ' bestanden, ' + schlecht + ' gefallen');
process.exit(schlecht ? 1 : 0);
