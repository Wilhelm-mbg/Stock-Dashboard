'use strict';
/* TEST der Gruende-Tafel v2.1 (Auftrag Nr. 92, Schritt 2b) - Kunstfaelle fuer die Ruecknahme von B2 (E6 verwirft wieder) mit
 * Gegenfall, Handeintrag ueber einer verworfenen Firma, nachfolger_im_archiv, die Handeintrags-Datei v2 (38) und - wenn gebaut -
 * die Tafel v2.1 selbst (Kennung, Gegenproben, Totalverlust Klasse 1-3). Kein Netz, kein Panel, nichts auf E:.
 * Aufruf:  node test-v21.js      (Ausgang 0 = alles gruen)
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var E = require('../zaehllauf4/t4-einstufen.js');
var T2 = require('./tafel-v2.js');
var T21 = require('./tafel-v21.js');

var gut = 0, schlecht = 0;
function ok(b, was) { if (b) gut++; else { schlecht++; console.log('FEHLER: ' + was); } }
function gleich(a, b, was) { ok(JSON.stringify(a) === JSON.stringify(b), was + ' - ist ' + JSON.stringify(a) + ', soll ' + JSON.stringify(b)); }

/* ---- 1 B2 zurueckgenommen ---- */
var ANKER = '2022-12-29';
function tg(n) { return G.tagPlus(ANKER, n); }
var RK = { reihe: 'K', basis: 'K', ordner: 'K', art: 'CS', gruppe: 'verschwunden', letzterKursArchiv: 1, letzterKursRoh: 1, massnahmeEnde: null, endeMassnahmen: [], polygonEintraege: [],
  polygonFirma: null, letzterBalken: ANKER, zwilling: null };
function R(mehr) { return Object.assign({}, RK, mehr || {}); }
var S103 = { cik: '1', name: 'Kunst AG', sic: '1000', einreichungen: [{ f: '8-K', d: tg(-5), a: 'B1', it: '1.03,9.01' }] };
var Z4 = { cik: null, name: null, weg: 'e6-keine-firma', sicherheit: null, fertig: 1, e6betroffen: 1, e6: { probe: 'nichts', polygonName: 'Kunst Holding', verworfen: { cik: '1', name: 'Kunst AG', weg: 'fts-mehrheit' } } };
var Z3K = { cik: '1', name: 'Kunst AG', weg: 'fts-mehrheit', sicherheit: 'mittel', fertig: 1 };
function ctx(mehr) { return Object.assign({ pv: null, z4: Z4, z3: Z3K, S4: null, S3: S103, hand: {}, hatBalken: {}, lebendAb: 0, bd: null, O: Object.assign({}, E.ALLE_AN, { text: function () { return null; } }) }, mehr || {}); }
gleich(T21.B_AN, { B1: 1, B2: 0, B3: 1 }, '1.1 v2.1: B1 an, B2 aus (E6 verwirft), B3 an');
var v = T2.stufeV2(R(), T21.B_AN, ctx()), mit = T2.stufeV2(R(), { B1: 1, B2: 1, B3: 1 }, ctx());
gleich([v.grund, v.cik || null, v.e6_name_passt, v.zuordnung_b2], ['unbekannt', null, undefined, undefined], '1.2 E6 verwirft: die verworfene Suchfirma traegt nichts bei (wie Lauf 4)');
gleich([mit.grund, mit.cik], ['insolvenz', '1'], '1.3 Gegenfall B2 an: die verworfene Firma kaeme zurueck (Tafel v2)');
var nb = T2.stufeV2(R(), T21.B_AN, ctx({ z4: Object.assign({}, Z3K, { e6betroffen: 0 }), S4: S103, S3: null }));
gleich([nb.grund, nb.cik], ['insolvenz', '1'], '1.4 nicht von E6 betroffen: Zuordnung des vierten Laufs wirkt unveraendert');

/* ---- 2 Handeintrag ueber einer verworfenen Firma ---- */
var H = { K: { reihe: 'K', anker: ANKER, grund: 'insolvenz', quelle: 'daten', beleg: 'EDGAR 8-K 1.03 (Kunst AG)', anmerkung: 'E6 hatte die richtige Firma verworfen' } };
var h1 = T2.stufeV2(R(), T21.B_AN, ctx({ hand: H }));
gleich([h1.grund, h1.regel, h1.beleg, h1.quelle, h1.handeintrag.nachRegeln.grund, h1.cik || null], ['insolvenz', 'H', 'handeintrag', 'handeintrag-v2:daten', 'unbekannt', null],
  '2.1 Handeintrag setzt den Grund, die Regeln (E6 verwerfend) bleiben nachlesbar, keine fremde Firma');
var h2 = T2.stufeV2(R(), T21.B_AN, ctx({ hand: { K: Object.assign({}, H.K, { grund: 'umbenennung-ticker', quelle: 'wissen' }) } }));
gleich([h2.grund, h2.quelle], ['umbenennung-ticker', 'handeintrag-v2:wissen'], '2.2 Handeintrag mit Quelle wissen (wie CHU)');

/* ---- 3 nachfolger_im_archiv ---- */
var u1 = { regel: 'U', nachfolger: 'X', nachfolger_im_archiv: 0 }; T21.nachfolgerImArchiv(u1, { regel: 'U', nachfolger: 'X', nachfolger_im_archiv: 1 });
var u2 = { regel: 'U', nachfolger: 'Y', nachfolger_im_archiv: 0 }; T21.nachfolgerImArchiv(u2, { regel: 'U', nachfolger: 'X', nachfolger_im_archiv: 1 });
var u3 = { regel: 'H', nachfolger: 'X', nachfolger_im_archiv: 0 }; T21.nachfolgerImArchiv(u3, { regel: 'U', nachfolger: 'X', nachfolger_im_archiv: 1 });
gleich([u1.nachfolger_im_archiv, u2.nachfolger_im_archiv, u3.nachfolger_im_archiv], [1, null, 0], '3.1 nachfolger_im_archiv: aus Lauf 4 bei gleicher Regel/Nachfolger, sonst null; Handeintrag unberuehrt');

/* ---- 4 Handeintrags-Datei v2 (nur lesen) ---- */
var HJ = G.json(path.join(G.HIER, 'handeintraege-v2', 'handeintraege.json'));
var GR = ['umbenennung-ticker', 'uebernahme', 'fusion-aktientausch', 'insolvenz', 'spac-ende', 'zwangs-delisting', 'freiwillig', 'abgemeldet-anlass-offen', 'ausgesetzt', 'unbekannt'];
var namen = HJ.eintraege.map(function (h) { return h.reihe; });
gleich([HJ.kennung, HJ.eintraege.length, namen.filter(function (n, i) { return namen.indexOf(n) === i; }).length], ['datenfundament-2026-10-04/handeintraege-v2/v2', 38, 38], '4.1 Handeintraege v2: 38, jede Reihe einmal');
gleich(T21.NEU5.filter(function (n) { return namen.indexOf(n) === -1; }), [], '4.2 die fuenf neuen (BNK, CVO, OTIV, SGBK, CHU) stehen in der Datei');
gleich(HJ.eintraege.filter(function (h) { return GR.indexOf(h.grund) === -1 || ['daten', 'wissen'].indexOf(h.quelle) === -1 || !h.beleg || !/^\d{4}-\d\d-\d\d$/.test(h.anker); }).map(function (h) { return h.reihe; }), [],
  '4.3 Handeintraege: bekannter Grund, Quelle daten/wissen, Beleg und Anker vorhanden');

/* ---- 5 Die gebaute Tafel v2.1 (falls vorhanden) ---- */
var TP = path.join(__dirname, 'verschwundene-gruende-v21.json'), ZP = path.join(__dirname, 'v21-zahlen.json');
if (fs.existsSync(TP) && fs.existsSync(ZP)) {
  var T = G.json(TP), ZZ = G.json(ZP), je = {};
  T.reihen.forEach(function (r) { je[r.reihe] = r; });
  gleich([T.kennung, T.n, T.reihen.length], [T21.KENNUNG, 5050, 5050], '5.1 Tafel v2.1: Kennung, 5.050 Reihen');
  gleich(namen.filter(function (n) { return !je[n] || je[n].regel !== 'H'; }), [], '5.2 alle 38 Handeintraege stehen mit Regel H');
  gleich([ZZ.lauf.gp1.gleich, ZZ.lauf.gp1.verglichen, ZZ.lauf.gp1.anders.length], [5012, 5012, 0], '5.3 GP1: mit B2 an = Tafel v2 ausser den 38 Handeintraegen');
  gleich([ZZ.lauf.gp2.unerklaert.length, ZZ.lauf.gp2.gleich + ZZ.lauf.gp2.nurB1.length + ZZ.lauf.gp2.nurHand.length], [0, 5050], '5.4 GP2: E6 verwerfend ohne die fuenf = Lauf 4 + B1 + 33');
  gleich(ZZ.totalverlust.haupt.klasse123, ['FRC', 'NKLA', 'NOVA', 'SAVE', 'SBNY', 'SIVB'], '5.5 Hauptlesart Klasse 1-3: genau SIVB, SBNY, FRC, SAVE, NKLA, NOVA');
  gleich(['ERB', 'VISI'].filter(function (n) { return ['insolvenz', 'zwangs-delisting'].indexOf(je[n].grund) !== -1; }), [], '5.6 ERB und VISI nicht mehr in der Hauptlesart');
  gleich(T.reihen.filter(function (r) { return r.zuordnung_b2; }).length, 0, '5.7 keine Zeile traegt eine B2-Zuordnung');
} else console.log('(Tafel v2.1 noch nicht gebaut - Teil 5 uebersprungen)');

console.log(gut + ' gruen, ' + schlecht + ' rot');
process.exit(schlecht ? 1 : 0);
