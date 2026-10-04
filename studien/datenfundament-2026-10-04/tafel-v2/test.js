'use strict';
/* TEST der Gruende-Tafel v2 (Auftrag Nr. 92, Schritt 2) - Kunstfaelle fuer B1, B2, B3 je mit Gegenfall und Grenze, dazu die
 * Gegenprobe "alle drei aus = Einstufung des vierten Laufs" an Kunstfaellen und Pruefungen der Handeintrags-Datei.
 * Kein Netz, kein Panel, nichts auf E:. Aufruf:  node test.js      (Ausgang 0 = alles gruen)
 */
var path = require('path');
var G = require('../gemeinsam.js');
var E = require('../zaehllauf4/t4-einstufen.js');
var ZW = require('../zaehllauf4/zwilling.js');
var ZV = require('./zwilling-v2.js');
var T2 = require('./tafel-v2.js');

var gut = 0, schlecht = 0;
function ok(b, was) { if (b) gut++; else { schlecht++; console.log('FEHLER: ' + was); } }
function gleich(a, b, was) { ok(JSON.stringify(a) === JSON.stringify(b), was + ' - ist ' + JSON.stringify(a) + ', soll ' + JSON.stringify(b)); }

/* ---------- Kunstreihen ---------- */
function reihe(n, ab) { var r = { tage: [], roh: [], verh: [] }; for (var i = 0; i < n; i++) { r.tage.push(ab + i); r.roh.push(10 + i / 100); r.verh.push(1 + i / 1000); } return r; }
/** C wie D, extraNach Tage weiter; f(r) aendert C. */
function wie(D, extraNach, f) {
  var r = { tage: [], roh: [], verh: [] };
  for (var i = 0; i < D.tage.length + extraNach; i++) { var t = D.tage[0] + i, j = ZW.finde(D.tage, t); r.tage.push(t); r.roh.push(j >= 0 ? D.roh[j] : 99); r.verh.push(j >= 0 ? D.verh[j] : 1); }
  if (f) f(r);
  return r;
}
var D60 = reihe(60, 100);
/** C mit Split: die ersten k Tage des Fensters traegt C das 10-Fache des rohen Schlusses von D (Faktor je Tag aus fk). */
function split(k, fk) { return wie(D60, 5, function (r) { for (var i = 0; i < k; i++) r.roh[i] = r.roh[i] * (fk ? fk(i) : 10); }); }

/* ---- 1 B1: Zusatz zu (b) ---- */
var p1 = ZV.pruefe(D60, split(30));
gleich([p1.a, p1.b, p1.bGleich, p1.ok], [true, false, 30, false], '1.1 B1 Ausgang: Split 30 Tage vor dem Ende - ohne Zusatz scheitert (b) (30 von 60)');
gleich([p1.b1.ungleich, p1.b1.fest, p1.b1.vorStueck, p1.bGleichB1, p1.bB1, p1.okB1], [30, true, true, 60, true, true], '1.2 B1: Verhaeltnis fest (10) -> alle 60 Tage gleich, Zwilling');
var p2 = ZV.pruefe(D60, split(30, function (i) { return 10 + i / 100; }));
gleich([p2.b1.fest, p2.bGleichB1, p2.okB1], [false, 30, false], '1.3 B1 Gegenfall: Verhaeltnis wandert (10,00 .. 10,29) -> kein Zwilling');
var p3 = ZV.pruefe(D60, split(30, function (i) { return i === 7 ? 10 * (1 + 0.9e-6) : 10; }));
gleich([p3.b1.fest, p3.okB1], [true, true], '1.4 B1 Grenze: Abweichung 0,9e-6 -> fest');
var p4 = ZV.pruefe(D60, split(30, function (i) { return i === 7 ? 10 * (1 + 1.1e-6) : 10; }));
gleich([p4.b1.fest, p4.okB1], [false, false], '1.5 B1 Grenze: Abweichung 1,1e-6 -> nicht fest');
gleich(ZV.B1_TOL, 1e-6, '1.6 B1: Toleranz 1e-6');
var p5 = ZV.pruefe(D60, split(30), false), p5z = ZW.pruefe(D60, split(30));
gleich([p5.ok, p5.okB1, p5.bGleich, p5.bGleichB1], [p5z.ok, p5z.ok, p5z.bGleich, p5z.bGleich], '1.7 B1 aus (b1 = false) = Pruefung des vierten Laufs');
var p6 = ZV.pruefe(D60, wie(D60, 5, function (r) { r.roh[59] = r.roh[59] * 10; r.roh[58] = r.roh[58] * 10; r.roh[57] = r.roh[57] * 10; }));
gleich([p6.a, p6.okB1], [false, false], '1.8 B1 aendert (a) nicht: an den drei letzten Tagen muss der rohe Schluss gleich sein');
var p7 = ZV.pruefe(D60, split(30, function () { return 10; }));
var p7c = ZV.pruefe(D60, wie(D60, 4, function (r) { for (var i = 0; i < 30; i++) r.roh[i] = r.roh[i] * 10; }));
gleich([p7.okB1, p7c.bB1, p7c.c, p7c.okB1], [true, true, false, false], '1.9 B1 aendert (c) nicht: vier Tage Nachlauf reichen auch mit festem Verhaeltnis nicht');
var D20 = reihe(20, 100);
var p8 = ZV.pruefe(D20, wie(D20, 5, function (r) { for (var i = 0; i < 12; i++) r.roh[i] = r.roh[i] / 4; }));
gleich([p8.bGleich, p8.bNoetig, p8.b, p8.bGleichB1, p8.okB1], [8, 15, false, 20, true], '1.10 B1 kurze Reihe (20 Tage, Reverse-Split 1:4) -> Zwilling');
var p9 = ZV.pruefe(D60, wie(D60, 5, function (r) { for (var i = 0; i < 30; i += 2) r.roh[i] = r.roh[i] * 10; }));
gleich([p9.b1.fest, p9.b1.vorStueck, p9.okB1], [true, false, true], '1.11 Lesart: festes Verhaeltnis zaehlt auch, wenn die ungleichen Tage kein Stueck vor den gleichen bilden (nur ausgewiesen)');
var kw = [{ name: 'X', p: { ok: false, okB1: true, bGleich: 30, bGleichB1: 60, cTage: 9 } }, { name: 'Y', p: { ok: true, okB1: true, bGleich: 50, bGleichB1: 50, cTage: 5 } }];
gleich([ZV.waehle(kw, false).name, ZV.waehle(kw, true).name], ['Y', 'X'], '1.12 Wahl: ohne B1 wie Lauf 4, mit B1 nach den gleichen Tagen mit Zusatz');
var pv = { bis: '2020-01-31', zeilen: 60, zwilling: null, zwillingB1: 'X', kandidaten: [{ name: 'X', bGleich: 30, bGleichB1: 60, bTage: 60, cTage: 9, doppelte: 30, b1: { fest: true } }] };
gleich([T2.zwillingInfo(pv, false), T2.zwillingInfo(pv, true).name, T2.zwillingInfo(pv, true).b1Zusatz, T2.zwillingInfo(pv, true).ende], [null, 'X', 1, '2020-01-31'],
  '1.13 zwillingInfo: ohne B1 kein Zwilling, mit B1 X (Zusatz gekennzeichnet)');

/* ---- 2 B2: Namensprobe nur Kennzeichen ---- */
var ANKER = '2022-12-29';
function tg(n) { return G.tagPlus(ANKER, n); }
var RK = { reihe: 'K', basis: 'K', ordner: 'K', art: 'CS', gruppe: 'verschwunden', letzterKursArchiv: 1, letzterKursRoh: 1, massnahmeEnde: null, endeMassnahmen: [], polygonEintraege: [],
  polygonFirma: null, letzterBalken: ANKER, zwilling: null };
function R(mehr) { return Object.assign({}, RK, mehr || {}); }
function S(l) { return { cik: '1', name: 'Kunst AG', sic: '1000', einreichungen: l }; }
var S103 = S([{ f: '8-K', d: tg(-5), a: 'B1', it: '1.03,9.01' }]);
var Z4 = { cik: null, name: null, weg: 'e6-keine-firma', sicherheit: null, fertig: 1, e6betroffen: 1, e6: { probe: 'nichts', polygonName: 'Kunst Holding', verworfen: { cik: '1', name: 'Kunst AG', weg: 'fts-mehrheit' } } };
var Z3K = { cik: '1', name: 'Kunst AG', weg: 'fts-mehrheit', sicherheit: 'mittel', fertig: 1 };
function ctx(mehr) { return Object.assign({ pv: null, z4: Z4, z3: Z3K, S4: null, S3: S103, hand: {}, hatBalken: {}, lebendAb: 0, bd: null, O: Object.assign({}, E.ALLE_AN, { text: function () { return null; } }) }, mehr || {}); }
var b2an = T2.stufeV2(R(), { B1: 0, B2: 1, B3: 0 }, ctx()), b2aus = T2.stufeV2(R(), { B1: 0, B2: 0, B3: 0 }, ctx());
gleich([b2an.grund, b2an.beleg, b2an.cik, b2an.e6_name_passt, b2an.zuordnung_b2], ['insolvenz', 'edgar-8K-1.03', '1', false, 'zuordnung-lauf3'], '2.1 B2: verworfene Suchfirma wird genommen, Kennzeichen e6_name_passt false');
gleich([b2aus.grund, b2aus.cik, b2aus.e6_name_passt], ['unbekannt', null, undefined], '2.2 B2 aus: wie der vierte Lauf (Firma verworfen -> unbekannt)');
var nb = T2.stufeV2(R(), { B1: 0, B2: 1, B3: 0 }, ctx({ z4: Object.assign({}, Z3K, { e6betroffen: 0 }), S4: S103, z3: Object.assign({}, Z3K, { cik: '2' }), S3: null }));
gleich([nb.grund, nb.cik, nb.e6_name_passt], ['insolvenz', '1', undefined], '2.3 B2 Gegenfall: nicht von E6 betroffen -> Zuordnung des vierten Laufs bleibt, kein Kennzeichen');
gleich([T2.zuordnungB2(Z4, Z3K, 1) === Z3K, T2.zuordnungB2(Z4, Z3K, 0) === Z4, T2.zuordnungB2(Z4, undefined, 1) === Z4, T2.zuordnungB2(Z4, Z4, 1) === Z4], [true, true, true, true],
  '2.4 zuordnungB2: nur betroffen und mit Zuordnung des dritten Laufs');
var Zp = { cik: '7', e6betroffen: 1, e6: { probe: 'passt' } };
gleich([T2.e6NamePasst(Z4, '1'), T2.e6NamePasst(Zp, '7'), T2.e6NamePasst(Zp, '8'), T2.e6NamePasst({ e6betroffen: 0, cik: '1' }, '1'),
  T2.e6NamePasst({ cik: '5', e6betroffen: 1, e6abgelehnt2: [{ cik: '9' }] }, '9'), T2.e6NamePasst({ cik: '5', e6betroffen: 1, e6durchgang1: { verworfen: { cik: '4' } } }, '4')],
  [false, true, null, null, false, false], '2.5 e6NamePasst: verworfen (Durchgang 1, 2) -> false, geprueft und behalten -> true, sonst null');

/* ---- 3 B3: Handeintraege vor allen Regeln ---- */
var H = { K: { reihe: 'K', anker: ANKER, grund: 'insolvenz', quelle: 'wissen', beleg: 'Kunstbeleg', anmerkung: 'Kunst' } };
var h1 = T2.stufeV2(R(), { B1: 0, B2: 0, B3: 1 }, ctx({ hand: H }));
gleich([h1.grund, h1.beleg, h1.regel, h1.quelle, h1.handeintrag.nachRegeln.grund, h1.handeintrag.ankerPasst, h1.datum], ['insolvenz', 'handeintrag', 'H', 'handeintrag-v2:wissen', 'unbekannt', true, ANKER],
  '3.1 B3: Handeintrag ersetzt "unbekannt", Grund der Regeln bleibt nachlesbar');
var h2 = T2.stufeV2(R({ reihe: 'L' }), { B1: 0, B2: 0, B3: 1 }, ctx({ hand: H }));
gleich([h2.grund, h2.handeintrag], ['unbekannt', undefined], '3.2 B3 Gegenfall: Reihe ohne Handeintrag bleibt bei den Regeln');
var ZWI = { ok: true, name: 'KNEU', ende: tg(0), bGleich: 60, bTage: 60, cTage: 900, doppelte: 1200, zeilen: 600 };
var h3 = T2.stufeV2(R({ zwilling: ZWI }), { B1: 0, B2: 0, B3: 1 }, ctx({ hand: { K: Object.assign({}, H.K, { grund: 'uebernahme', nachfolger: 'X' }) } }));
gleich([h3.grund, h3.nachfolger, h3.handeintrag.nachRegeln.regel, h3.handeintrag.nachRegeln.beleg], ['uebernahme', 'X', 'Z', 'zwilling-im-archiv'], '3.3 B3 geht auch dem Zwilling (Regel Z) vor');
var h4 = T2.stufeV2(R(), { B1: 0, B2: 0, B3: 0 }, ctx({ hand: H }));
gleich([h4.grund, h4.handeintrag], ['unbekannt', undefined], '3.4 B3 aus: der Handeintrag wirkt nicht');
var h5 = T2.handAuflegen({ grund: 'unbekannt', datum: null }, { reihe: 'K', anker: '2020-01-02', grund: 'freiwillig', quelle: 'daten', beleg: 'b' }, R());
gleich([h5.datum, h5.handeintrag.ankerPasst], ['2020-01-02', false], '3.5 B3: ohne Datum der Regeln gilt der Anker des Eintrags; abweichender Anker wird gekennzeichnet');

/* ---- 4 Gegenprobe an Kunstfaellen: alle drei aus = Einstufung des vierten Laufs ---- */
var faelle = [[R(), ctx()], [R({ zwilling: ZWI }), ctx({ z4: Z3K, S4: S103 })], [R(), ctx({ z4: Z3K, S4: S103, hand: H })]];
faelle.forEach(function (f, i) {
  var a = T2.stufeV2(f[0], { B1: 0, B2: 0, B3: 0 }, f[1]), b = E.stufeEin(f[0], f[1].z4, f[1].S4, {}, 0, null, f[1].O);
  b.zwilling_info = f[0].zwilling || null;
  gleich(a, b, '4.' + (i + 1) + ' Gegenprobe: B1, B2, B3 aus = stufeEin des vierten Laufs');
});

/* ---- 5 Die Handeintrags-Datei (nur lesen) ---- */
var HJ = G.json(path.join(G.HIER, 'handeintraege-v2', 'handeintraege.json')), GR = ['umbenennung-ticker', 'uebernahme', 'fusion-aktientausch', 'insolvenz', 'spac-ende', 'zwangs-delisting', 'freiwillig', 'abgemeldet-anlass-offen', 'ausgesetzt', 'unbekannt'];
var namen = HJ.eintraege.map(function (h) { return h.reihe; });
/* 5.1 (Nr. 92 Schritt 2c): die Datei hat seit e7757ce 38 Eintraege (Fassung v2). Geprueft wird, dass die 33 Eintraege der Fassung v1
 * (Commit f9cc14a, aus git gelesen) unveraendert enthalten sind, jede Reihe der Datei einmal. */
var HJ1 = JSON.parse(require('child_process').execSync('git show f9cc14a:studien/datenfundament-2026-10-04/handeintraege-v2/handeintraege.json', { cwd: G.HIER, encoding: 'utf8' }));
var jetzt = {}; HJ.eintraege.forEach(function (h) { jetzt[h.reihe] = h; });
gleich([HJ1.kennung, HJ1.eintraege.length, HJ1.eintraege.filter(function (h) { return JSON.stringify(jetzt[h.reihe]) !== JSON.stringify(h); }).map(function (h) { return h.reihe; }),
  namen.filter(function (n, i) { return namen.indexOf(n) === i; }).length === namen.length],
  ['datenfundament-2026-10-04/handeintraege-v2/v1', 33, [], true], '5.1 Handeintraege: die 33 der Fassung v1 unveraendert enthalten, jede Reihe einmal');
gleich(HJ.eintraege.filter(function (h) { return GR.indexOf(h.grund) === -1 || ['daten', 'wissen'].indexOf(h.quelle) === -1 || !h.beleg || !/^\d{4}-\d\d-\d\d$/.test(h.anker); }).map(function (h) { return h.reihe; }), [],
  '5.2 Handeintraege: bekannter Grund, Quelle daten/wissen, Beleg und Anker vorhanden');

console.log(gut + ' gruen, ' + schlecht + ' rot');
process.exit(schlecht ? 1 : 0);
