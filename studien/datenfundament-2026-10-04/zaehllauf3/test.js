'use strict';
/* TEST der Regeln des dritten Zaehllaufs (Auftrag Nr. 90) - nur Kunstfaelle, kein Netz, kein Cache, nichts auf E:.
 * Aufruf:  node test.js      (Ausgang 0 = alles gruen)
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var U = require('./t4-universum.js');
var E = require('./t4-einstufen.js');
var E2 = require('../phase2/t4-einstufen.js');
var A2 = require('../phase2/t4-auswerten.js');
var W = require('./wortlaut.js');
var TX = require('./texte.js');
var ED = require('./t4-edgar.js');
var LF = require('./lauf.js');

var gut = 0, schlecht = 0;
function ok(b, was) { if (b) gut++; else { schlecht++; console.log('FEHLER: ' + was); } }
function gleich(a, b, was) { ok(JSON.stringify(a) === JSON.stringify(b), was + ' - ist ' + JSON.stringify(a) + ', soll ' + JSON.stringify(b)); }

var ANKER = '2022-12-29';
function tg(n) { return G.tagPlus(ANKER, n); }
var RK = { reihe: 'K', basis: 'K', ordner: 'K', art: 'CS', gruppe: 'verschwunden', letzterKursArchiv: 1, massnahmeEnde: null, endeMassnahmen: [], polygonEintraege: [],
  polygonFirma: { cik: '1', name: 'Kunst AG', bis: tg(1), tage: 1 }, letzterBalken: ANKER };
function R(mehr) { return Object.assign({}, RK, mehr || {}); }
var ZP = { cik: '1', sicherheit: 'stark', weg: 'polygon-cik' }, ZF = { cik: '1', sicherheit: 'mittel', weg: 'fts-mehrheit' };
function S(l, mehr) { return Object.assign({ cik: '1', name: 'Kunst AG', sic: '1000', einreichungen: l }, mehr || {}); }
function st(r, z, s, texte, aus) {
  var O = Object.assign({}, E.ALLE_AN, { text: function (a) { var t = (texte || {})[a]; return t === undefined ? null : t === false ? { fehlt: 1 } : { text: t }; } });
  (aus || []).forEach(function (k) { O[k] = 0; });
  return E.stufeEin(r, z, s, {}, 0, null, O);
}
function gb(u) { return [u.grund, u.beleg]; }
var TITEL = 'Item 3.01 Notice of Delisting or Failure to Satisfy a Continued Listing Rule or Standard; Transfer of Listing.\n';
var ENDE = '\nItem 9.01 Financial Statements and Exhibits.\n(d) Exhibits\nSIGNATURE\nPursuant to the requirements of the Securities Exchange Act of 1934 the registrant has duly caused this report to be signed.\n';
var TV = 'FORM 8-K\n' + TITEL + 'On December 20, 2022, in connection with the consummation of the merger, the Company notified Nasdaq and requested that trading of the shares be suspended.' + ENDE;
var TR = 'FORM 8-K\n' + TITEL + 'On December 20, 2022, the Company received a letter from Nasdaq stating that the Company is not in compliance with the minimum bid price requirement.' + ENDE;
var TE = 'FORM 8-K\n' + TITEL + 'On December 20, 2022, the Board approved the voluntary delisting of the common stock from the New York Stock Exchange.' + ENDE;
var TM = 'FORM 8-K\n' + TITEL + 'Following the consummation of the transaction the Company cured the deficiency noted by the Staff.' + ENDE;
var TN = 'FORM 8-K\n' + TITEL + 'On December 20, 2022, the Company notified the exchange that its shares will cease to trade.' + ENDE;
function k301(d, a, it) { return { f: '8-K', d: d, a: a || 'A1', it: it || '3.01,9.01' }; }

/* ---- 1 V2: die fuenf Zeilen der Tabelle ---- */
gleich(gb(st(R(), ZP, S([k301(tg(-9))]), { A1: TV })), ['uebernahme', 'edgar-8K-3.01-vollzug'], '1.1 V2 Zeile 1: Vollzug, 3.01 neun Tage vor dem Anker -> Uebernahme');
var fernV = st(R(), ZP, S([k301(tg(-89))]), { A1: TV });
gleich([fernV.grund, fernV.beleg, fernV.wortlaut, fernV.wortlaut_unklar, fernV.v2_zeile], ['zwangs-delisting', 'edgar-8K-3.01', 'vollzug', 1, 5], '1.2 V2 Zeile 1 Gegenfall: Vollzug 89 Tage vor dem Anker -> Zeile 5 (wortlaut_unklar)');
gleich(gb(st(R(), ZP, S([k301(tg(-89))]), { A1: TR })), ['zwangs-delisting', 'edgar-8K-3.01-ruege'], '1.3 V2 Zeile 2: Ruege, auch fern vom Anker -> Zwangs-Delisting');
gleich(gb(st(R(), ZP, S([k301(tg(-9))]), { A1: TE })), ['freiwillig', 'edgar-8K-3.01-eigener-entschluss'], '1.4 V2 Zeile 3: eigener Entschluss -> freiwillig');
gleich(gb(st(R(), ZP, S([k301(tg(-9)), { f: 'DEFM14A', d: tg(-180), a: 'P1', it: '' }]), { A1: TM })), ['uebernahme', 'edgar-8K-3.01+prospekt'], '1.5 V2 Zeile 4: mehrdeutig + Fusionsbeleg 180 Tage vor dem Anker -> Uebernahme');
gleich(gb(st(R(), ZP, S([k301(tg(-9)), { f: 'DEFM14A', d: tg(-181), a: 'P1', it: '' }]), { A1: TM })), ['zwangs-delisting', 'edgar-8K-3.01'], '1.6 V2 Zeile 4 Gegenfall: Fusionsbeleg 181 Tage vor dem Anker zaehlt nicht');
gleich(gb(st(R(), ZP, S([k301(tg(-9)), { f: '8-K', d: tg(-4), a: 'A5', it: '5.01' }]), { A1: TN })), ['uebernahme', 'edgar-8K-3.01+5.01'], '1.7 V2 Zeile 4: nichts + Punkt 5.01 in einem 8-K fuenf Tage danach');
gleich(gb(st(R(), ZP, S([k301(tg(-9)), { f: '8-K', d: tg(-3), a: 'A5', it: '5.01' }]), { A1: TN })), ['zwangs-delisting', 'edgar-8K-3.01'], '1.8 V2 Zeile 4 Gegenfall: 5.01 sechs Tage danach zaehlt nicht');
gleich(gb(st(R(), ZP, S([k301(tg(-9), 'A1', '3.01,5.01')]), { A1: TN })), ['uebernahme', 'edgar-8K-3.01+5.01'], '1.9 V2 Zeile 4: 5.01 im selben 8-K');
gleich(gb(st(R(), ZP, S([k301(tg(-40), 'A1', '3.01,5.01')]), { A1: TN })), ['zwangs-delisting', 'edgar-8K-3.01'], '1.10 V2 Zeile 4 Gegenfall: 3.01 mehr als 30 Tage vom Anker');
var u5 = st(R(), ZP, S([k301(tg(-9)), { f: '25', d: tg(2), a: 'F1', it: '' }]), { A1: TN });
gleich([u5.grund, u5.beleg, u5.wortlaut, u5.wortlaut_unklar, u5.emittent_formular25, u5.regel], ['zwangs-delisting', 'edgar-8K-3.01', 'nichts', 1, 'EDGAR:F1 (25 ' + tg(2) + ')', 11], '1.11 V2 Zeile 5: nichts, kein Hinweis -> Zwangs-Delisting mit wortlaut_unklar; Felder der Zeile');
gleich([st(R(), ZP, S([k301(tg(-9))]), {}).wortlaut_stand, st(R(), ZP, S([k301(tg(-9))]), { A1: false }).wortlaut_stand, st(R(), ZP, S([k301(tg(-9))]), { A1: 'FORM 8-K\nItem 8.01 Other Events.\nText.' }).wortlaut_stand],
  ['text-fehlt', 'nicht-zu-holen', 'abschnitt-nicht-gefunden'], '1.12 Text noch nicht geholt / nicht zu holen / Abschnitt nicht gefunden -> Klasse nichts mit Stand');
gleich(gb(st(R(), ZP, S([k301(tg(-9))]), { A1: TV }, ['V2'])), ['zwangs-delisting', 'edgar-8K-3.01'], '1.13 V2 aus: jedes 3.01 ist Zwangs-Delisting (zweiter Lauf)');
var bedarf = {}; E.stufeEin(R(), ZP, S([k301(tg(-9))]), {}, 0, null, Object.assign({}, E.ALLE_AN, { text: function () { return null; }, bedarf: bedarf }));
gleich(bedarf, { A1: '1' }, '1.14 fehlender Text kommt mit der CIK in den Bedarf');

/* ---- 2 V3: Fenster der Abmelde-Meldung, Grenzen ---- */
function v3(n) { return st(R(), ZP, S([k301(tg(n))]), { A1: TR }).grund; }
gleich([v3(-180), v3(-181), v3(30), v3(31)], ['zwangs-delisting', 'unbekannt', 'zwangs-delisting', 'unbekannt'], '2.1 V3: 180 Tage davor und 30 danach zaehlen, 181 und 31 nicht');
gleich(st(R(), ZP, S([k301(tg(-181))]), { A1: TR }, ['V3']).grund, 'zwangs-delisting', '2.2 V3 aus: das 3.01 181 Tage vor dem Anker zaehlt wieder (Fenster 550/300)');
gleich(st(R(), ZP, S([k301(tg(-200), 'A0'), k301(tg(60), 'A2'), k301(tg(-100), 'A1')]), { A1: TR, A0: TV, A2: TV }).quelle, 'EDGAR:A1 (8-K ' + tg(-100) + ')', '2.3 V3: das naechste INNERHALB des Fensters, nicht das naechste ueberhaupt (60 Tage danach liegt naeher, zaehlt aber nicht)');

/* ---- 3 V3b: fruehe Ruege + 25-NSE am Anker ---- */
function v3b(n301, text, f25, n25, aus) { return st(R(), ZP, S([k301(tg(n301)), { f: f25, d: tg(n25), a: 'N1', it: '' }]), { A1: text }, aus); }
gleich(gb(v3b(-300, TR, '25-NSE', 5)), ['zwangs-delisting', 'edgar-8K-3.01-ruege-frueh+25-NSE'], '3.1 V3b: Ruege 300 Tage vor dem Anker + 25-NSE fuenf Tage danach');
gleich([v3b(-300, TR, '25-NSE', 5).datum, v3b(-300, TR, '25-NSE', 5).regel, v3b(-300, TR, '25-NSE', 5).wortlaut], [tg(5), 12, 'ruege'], '3.2 V3b: Datum = Formular der Boerse, Regel 12, Wortlaut-Feld');
gleich(gb(v3b(-300, TN, '25-NSE', 5)), ['abgemeldet-anlass-offen', 'edgar-formular25'], '3.3 V3b Gegenfall: fruehes 3.01 ohne Ruege-Wortlaut -> Regel 13');
gleich(gb(v3b(-300, TR, '25', 5)), ['abgemeldet-anlass-offen', 'edgar-formular25'], '3.4 V3b Gegenfall: Formular 25 des Emittenten ist nicht das der Boerse');
gleich(gb(v3b(-300, TR, '25-NSE', 31)), ['abgemeldet-anlass-offen', 'edgar-formular25'], '3.5 V3b Gegenfall: 25-NSE 31 Tage nach dem Anker');
gleich([v3b(-181, TR, '25-NSE', -30).regel, v3b(-550, TR, '25-NSE', 30).regel, v3b(-551, TR, '25-NSE', 5).regel, v3b(-300, TR, '25-NSE', 5, ['V3b']).regel], [12, 12, 13, 13], '3.6 V3b Grenzen 181 und 550 Tage; 551 nicht; V3b aus -> Regel 13');

/* ---- 4 V5 i: Mantelgesellschaft ---- */
function mantel(kurs, sic, aus) { return st(R({ letzterKursArchiv: kurs }), ZP, S([k301(tg(-9))], { sic: sic }), { A1: TR }, aus); }
gleich([gb(mantel(8, '6770')), mantel(8, '6770').wortlaut, mantel(8, '6770').regel], [['spac-ende', 'edgar-mantel+8K-3.01'], 'ruege', 9], '4.1 V5 i: SIC 6770, Kurs 8,00, 3.01 nach V3 -> spac-ende');
gleich([mantel(7.99, '6770').grund, mantel(null, '6770').grund, mantel(10, '1000').grund, mantel(10, '6770', ['V5i']).grund], ['zwangs-delisting', 'zwangs-delisting', 'zwangs-delisting', 'zwangs-delisting'], '4.2 V5 i Gegenfaelle: 7,99 $, Kurs fehlt, andere SIC, Regel aus -> Regel 11 nach Wortlaut');
gleich(st(R({ letzterKursArchiv: 10 }), ZP, S([k301(tg(-181))], { sic: '6770' }), { A1: TR }).grund, 'unbekannt', '4.3 V5 i Gegenfall: 3.01 ausserhalb von V3');

/* ---- 5 V5 iii: ausgesetzt ---- */
var spaet = [{ bis: tg(200), name: 'Kunst AG Common Stock', cik: '1' }];
var a1 = st(R({ polygonFirma: null, polygonEintraege: spaet }), ZF, S([k301(tg(-9))]), { A1: TR });
gleich([a1.grund, a1.beleg, a1.regel, a1.wortlaut, a1.ausgesetzt.tageNachAnker], ['ausgesetzt', 'ausgesetzt', 10, 'ruege', 200], '5.1 V5 iii: kein Eintrag am Anker, Polygon-Abgang 200 Tage danach -> ausgesetzt (vor Regel 11), Wortlaut-Feld gefuellt');
gleich([st(R({ polygonFirma: null, polygonEintraege: [{ bis: tg(90), name: 'Kunst AG', cik: '1' }] }), ZF, null, {}).grund, st(R({ polygonEintraege: spaet }), ZP, null, {}).grund], ['unbekannt', 'unbekannt'], '5.2 V5 iii Gegenfaelle: genau 90 Tage danach; Polygon-Eintrag am Anker vorhanden');
var neuV = st(R({ polygonFirma: null, polygonEintraege: [{ bis: tg(200), name: 'Fremd Corp', cik: '9' }] }), ZP, S([k301(tg(-9))]), { A1: TR });
gleich([neuV.grund, neuV.kuerzel_neu_vergeben.kuerzel_neu_vergeben], ['zwangs-delisting', 1], '5.3 V5 iii Ausnahme: spaeterer Eintrag mit anderer CIK und fremdem Namen -> Kuerzel neu vergeben, nicht ausgesetzt');
gleich(st(R({ polygonFirma: null, polygonEintraege: [{ bis: tg(200), name: 'Kunst AG New', cik: '9' }] }), ZP, S([]), {}).grund, 'ausgesetzt', '5.4 andere CIK, aber der Name passt -> ausgesetzt');
function mEnde(rolle, n) { return [{ art: 'cash_mergers', ex: tg(n), id: 'm1', rate: 3, neuesKuerzel: null, rolle: rolle }]; }
gleich([st(R({ polygonFirma: null, endeMassnahmen: mEnde('abgebend', 200) }), ZF, null, {}).grund, st(R({ polygonFirma: null, endeMassnahmen: mEnde('aufnehmend', 200) }), ZF, null, {}).grund,
  st(R({ polygonFirma: null, endeMassnahmen: mEnde('abgebend', 200) }), ZF, null, {}, ['V5iii']).grund], ['ausgesetzt', 'unbekannt', 'unbekannt'], '5.5 V5 iii ueber eine spaete Ende-Massnahme (nur abgebende Seite); Regel aus');

/* ---- 6 V7: Formular 25 der nach V1 bestimmten Firma, gleich auf welchem Weg ---- */
var nur25 = S([{ f: '25-NSE', d: tg(1), a: 'B1', it: '' }]);
gleich([gb(st(R(), ZF, nur25, {})), st(R(), ZF, nur25, {}, ['V7']).grund, st(R(), ZP, nur25, {}, ['V7']).grund], [['abgemeldet-anlass-offen', 'edgar-formular25'], 'unbekannt', 'abgemeldet-anlass-offen'], '6.1 V7: auch von der Firma aus der Suche; V7 aus = R-c (nur Polygon-Firma)');
gleich(gb(st(R(), ZF, S([{ f: '15-12G', d: tg(10), a: 'B3', it: '' }]), {})), ['freiwillig', 'edgar-formular15'], '6.2 Formular 15 allein bleibt freiwillig');

/* ---- 7 V8: Ende-Massnahme am Anker, abgebende Seite ---- */
var jung = { art: 'name_changes', ex: tg(500), id: 'n2', rate: null, neuesKuerzel: 'K' };
var em = [{ art: 'name_changes', ex: tg(1), id: 'n1', rate: null, neuesKuerzel: 'KV', rolle: 'abgebend' }, { art: 'name_changes', ex: tg(500), id: 'n2', rate: null, neuesKuerzel: 'K', rolle: 'aufnehmend' }];
var u8 = st(R({ massnahmeEnde: jung, endeMassnahmen: em }), ZP, null, {});
gleich([u8.grund, u8.nachfolger, u8.quelle, st(R({ massnahmeEnde: jung, endeMassnahmen: em }), ZP, null, {}, ['V8']).grund], ['umbenennung-ticker', 'KV', 'alpaca-massnahmen:n1', 'unbekannt'], '7.1 V8: die fruehere Umbenennung am Anker statt der juengsten der Datei (Muster CLVR); V8 aus -> wie im zweiten Lauf');
var aufn = { art: 'stock_mergers', ex: tg(2), id: 's1', rate: null, neuesKuerzel: 'K' };
gleich([st(R({ massnahmeEnde: aufn, endeMassnahmen: [Object.assign({ rolle: 'aufnehmend' }, aufn)] }), ZP, null, {}).grund, st(R({ massnahmeEnde: aufn, endeMassnahmen: [Object.assign({ rolle: 'aufnehmend' }, aufn)] }), ZP, null, {}, ['V8']).grund],
  ['unbekannt', 'fusion-aktientausch'], '7.2 V8 Gegenfall: nur die aufnehmende Seite zaehlt nicht (Muster SSY); im zweiten Lauf war das ein Aktientausch');
gleich(st(R({ endeMassnahmen: [{ art: 'cash_mergers', ex: tg(-80), id: 'c1', rate: 5, rolle: 'abgebend' }, { art: 'cash_mergers', ex: tg(2), id: 'c2', rate: 7, rolle: 'abgebend' }, { art: 'cash_mergers', ex: tg(31), id: 'c3', rate: 9, rolle: 'abgebend' }] }), ZP, null, {}).preis_je_aktie, 7, '7.3 V8: von mehreren im Fenster die dem Anker naechste; 31 Tage danach liegt ausserhalb');
gleich(st(R({ endeMassnahmen: [{ art: 'name_changes', ex: tg(1), id: 'q1', neuesKuerzel: 'KUNQ', rolle: 'abgebend' }] }), ZP, null, {}).beleg, 'q-kuerzel', '7.4 Regel 0 (Q-Kuerzel) ueber V8');
gleich([U.rolle({ _art: 'stock_mergers', acquiree_symbol: 'LGF.A', acquirer_symbol: 'LION' }, 'LGF-A'), U.rolle({ _art: 'stock_mergers', acquiree_symbol: 'RHEP', acquirer_symbol: 'SSY' }, 'SSY'), U.rolle({ _art: 'name_changes', old_symbol: 'CLVV', new_symbol: 'CLVR' }, 'CLVR'),
  U.rolle({ _art: 'redemptions', symbol: 'K' }, 'K'), U.rolle({ _art: 'worthless_removals', symbol: 'X' }, 'K')], ['abgebend', 'aufnehmend', 'aufnehmend', 'abgebend', 'fremd'], '7.5 Rolle: Punkt und Bindestrich gleichgesetzt');
var eml = U.endeMassnahmen([{ _art: 'cash_mergers', id: 'x', acquiree_symbol: 'K', process_date: '2022-12-30', rate: 1 }, { _art: 'cash_dividends', id: 'd', ex_date: '2022-01-01' }, { _art: 'redemptions', symbol: 'K', process_date: '2021-01-01' }],
  [{ _art: 'cash_mergers', id: 'x', acquiree_symbol: 'K', process_date: '2022-12-30', rate: 2 }, { _art: 'redemptions', symbol: 'K', process_date: '2021-01-01' }], 'K');
gleich(eml.map(function (m) { return [m.art, m.ex, m.rate, m.woher]; }), [['redemptions', '2021-01-01', null, 'alt'], ['redemptions', '2021-01-01', null, 'nachtrag'], ['cash_mergers', '2022-12-30', 2, 'nachtrag-ersetzt-alt']], '7.6 Nachtrag: gleiche id -> der Nachtrag gilt; Satz ohne id ist ein eigener Satz; nur Ende-Arten');
gleich(LF.v8Vergleich(R({ massnahmeEnde: jung, endeMassnahmen: em })).sorte, 'nur-neu', '7.7 Aussenpruefung V8: juengste ausserhalb, fruehere im Fenster');

/* ---- 8 Rangfolge: zwei Regeln greifen ---- */
gleich(gb(st(R({ endeMassnahmen: mEnde('abgebend', 2) }), ZP, S([k301(tg(-9))]), { A1: TR })), ['uebernahme', 'alpaca-cash_mergers'], '8.1 Regel 2 (Baruebernahme) vor Regel 11 (Ruege)');
gleich(gb(st(R({ letzterKursArchiv: 10, polygonFirma: null, polygonEintraege: spaet }), ZP, S([k301(tg(-9))], { sic: '6770' }), { A1: TR })), ['spac-ende', 'edgar-mantel+8K-3.01'], '8.2 Regel 9 (Mantel) vor Regel 10 (ausgesetzt)');
gleich(gb(st(R(), ZP, S([k301(tg(-9)), { f: '8-K', d: tg(-20), a: 'I1', it: '1.03' }], { sic: '6770' }), { A1: TV })), ['insolvenz', 'edgar-8K-1.03'], '8.3 Regel 4 (8-K 1.03) vor den Regeln 9 und 11');
gleich(gb(st(R(), ZP, S([k301(tg(-9)), { f: '25-NSE', d: tg(1), a: 'B1', it: '' }]), { A1: TE })), ['freiwillig', 'edgar-8K-3.01-eigener-entschluss'], '8.4 Regel 11 vor Regel 13 (Formular 25)');
var quelltext = String(E.urteil), marken = ["'q-kuerzel'", "'alpaca-name_changes'", "'alpaca-' + E.art", "'alpaca-stock_mergers'", "'edgar-8K-1.03'", "'edgar-8K-2.01+prospekt'", "'alpaca-redemptions'", "'edgar-mantel+abmeldung'", "'alpaca-worthless_removals'",
  "'edgar-mantel+8K-3.01'", "beleg: 'ausgesetzt'", "'edgar-8K-3.01-vollzug'", "'edgar-8K-3.01-ruege-frueh+25-NSE'", "'edgar-formular25'", "'edgar-formular15'", "grund: 'unbekannt'"];
var orte = marken.map(function (m) { return quelltext.indexOf(m); });
ok(orte.every(function (o, i) { return o > 0 && (i === 0 || o > orte[i - 1]); }), '8.5 Rangfolge 0 bis 15 steht in dieser Reihenfolge in urteil() - Orte ' + orte.join(','));

/* ---- 9 V1: Namensprobe, zweiter Registrant ---- */
gleich([Z3.namensprobe({ name: 'ALTABA INC.' }, 'Altaba Inc. Common Stock', 'AABA'), Z3.namensprobe({ name: 'NEU CORP', frueher: ['ALMOST FAMILY INC'] }, 'Almost Family Inc', 'AFAM'), Z3.namensprobe({ name: 'XY HOLDING', tickers: ['BRK.B'] }, 'Berkshire', 'BRK-B'),
  Z3.namensprobe({ name: 'AMERICAN EAGLE OUTFITTERS INC' }, 'Almost Family Inc', 'AFAM'), Z3.namensprobe(null, 'X', 'X'), Z3.namensprobe({ fehlt: true }, 'X', 'X')], ['passt', 'frueher', 'kuerzel', 'nichts', 'ohne-auszug', 'ohne-auszug'], '9.1 V1 Namensprobe: passt / frueherer Name / Kuerzel / nichts / ohne Auszug');
[['ALTABA INC.', 'Altaba Inc. Common Stock'], ['AMERICAN EAGLE OUTFITTERS INC', 'Almost Family Inc'], ['BARD C R INC /NJ/', 'C.R. Bard, Inc.'], ['Aetna Services Inc /CT/', 'Aetna Inc']].forEach(function (p) {
  ok(Z3.nameAehnlich(p[0], p[1]) === A2.nameAehnlich(p[0], p[1]), '9.2 Namensvergleich wie in ../phase2/t4-auswerten.js: ' + p[0]); });
var beide = E.vereinige(S([k301(tg(-100), 'A1')]), { cik: '2', name: 'Kunst Holding', sic: '6770', frueher: [], einreichungen: [k301(tg(-5), 'A2'), k301(tg(-100), 'A1')] });
gleich([beide.einreichungen.length, beide.name, beide.sic, beide.ciks, st(R(), ZP, beide, { A1: TR, A2: TV }).beleg], [2, 'Kunst AG', '1000', ['1', '2'], 'edgar-8K-3.01-vollzug'], '9.3 V1 zweiter Registrant: Vereinigung, je Akzession einmal, das dem Anker naechste 3.01 kommt aus dem zweiten Auszug');
gleich([st(R(), ZP, S([k301(tg(-100), 'A1')]), { A1: TR }).beleg, E.vereinige(null, S([])).cik, E.vereinige(S([]), { fehlt: true }).cik], ['edgar-8K-3.01-ruege', '1', '1'], '9.4 V1 Gegenfall: ohne zweiten Auszug bleibt das 3.01 des ersten');
var pe = [{ bis: '2019-10-07', name: 'Kunst Inc', cik: '0000000001' }, { bis: '2024-03-01', name: 'Andere Inc', cik: '0000000002' }, { bis: '2019-10-03', name: 'Ohne CIK', cik: null }];
gleich([U.polygonFirma(pe, '2019-10-02', 45).cik, U.polygonFirma(pe, '2019-08-23', 45).tage, U.polygonFirma(pe, '2019-08-22', 45)], ['0000000001', 45, null], '9.5 Polygon-Eintrag: mit CIK, hoechstens 45 Tage am Anker (unveraendert)');

/* ---- 10 Abschnittssuche an Kunsttexten ---- */
gleich([W.klasse(TV).klasse, W.klasse(TR).klasse, W.klasse(TE).klasse, W.klasse(TM).klasse, W.klasse(TN).klasse], ['vollzug', 'ruege', 'eigener-entschluss', 'mehrdeutig', 'nichts'], '10.1 Abschnitt da: die fuenf Klassen; der amtliche Titel allein ist weder Ruege noch eigener Entschluss');
gleich([W.klasse('FORM 8-K\nItem 2.01 Completion of Acquisition.\nThe merger was consummated.\nSIGNATURE').abschnitt, W.klasse('').klasse], [0, 'nichts'], '10.2 Abschnitt fehlt -> nichts, Abschnitt nicht gefunden');
var verweis = 'FORM 8-K\nIntroductory Note\nOn December 20, 2022 the offer expired and all shares were accepted for payment.\nItem 2.01 Completion of Acquisition or Disposition of Assets.\nParent acquired the Company for cash.\n' + TITEL
  + 'The information set forth in Item 2.01 of this Current Report on Form 8-K is incorporated herein by reference. On December 20, 2022, the Company notified Nasdaq and requested that Nasdaq file a Form 25 with the Securities and Exchange Commission to remove the shares from listing.' + ENDE;
gleich([W.klasse(verweis).klasse, W.abschnitt(verweis).verwiesen], ['nichts', ['2.01']], '10.3a Verweis auf Punkt 2.01: der verwiesene Abschnitt wird mitgelesen (hier ohne Treffer)');
gleich([W.klasse(verweis.replace('in Item 2.01 of', function () { return 'in the Introductory Note and in Item 2.01 of'; })).klasse, W.abschnitt(verweis.replace('in Item 2.01 of', function () { return 'in the Introductory Note and in Item 2.01 of'; })).verwiesen],
  ['vollzug', ['2.01', 'Vorbemerkung']], '10.3b Verweis auf die Vorbemerkung: dort steht der Vollzug');
var zwei = 'FORM 8-K\nItem 2.01 and Item 3.01. Completion of Acquisition or Disposition of Assets; Notice of Delisting or Failure to Satisfy a Continued Listing Rule or Standard; Transfer of Listing.\nAt the effective time each share was converted into the right to receive cash.' + ENDE;
var stapel = 'FORM 8-K\nItem 2.01 Completion of Acquisition or Disposition of Assets.\n' + TITEL + 'Item 3.03 Material Modification to Rights of Security Holders.\nItem 5.01 Changes in Control of Registrant.\nOn December 20, 2022 Merger Sub merged with and into the Company.' + ENDE;
gleich([W.klasse(zwei).klasse, W.klasse(stapel).klasse, W.abschnitt(stapel).gestapelt], ['vollzug', 'vollzug', 2], '10.4 zwei Punkte in einer Ueberschrift; gestapelte Ueberschriften: der folgende Text zaehlt');
gleich(W.klasse('FORM 8-K\n' + TITEL + 'The Company notified the exchange.\nSIGNATURE\nThe merger was consummated.').klasse, 'nichts', '10.5 nach der Unterschrift wird nicht gelesen');
ok(W.klasse(TR).auszug.length <= 300 && W.klasse(TR).auszug.indexOf('\n') < 0 && /not in compliance/.test(W.klasse(TR).auszug), '10.6 Auszug: hoechstens 300 Zeichen um den ersten Treffer, ohne Zeilenumbruch');
var hd = TX.hauptdokument('<SEC-DOCUMENT>x\n<DOCUMENT>\n<TYPE>8-K\n<SEQUENCE>1\n<TEXT>\n<html><body><p>Item 3.01</p><div>Text &amp; mehr&#160;hier&nbsp;<b>fett</b></div><script>var x;</script></body></html>\n</TEXT>\n</DOCUMENT>\n<DOCUMENT><TYPE>EX-99.1<TEXT>Anhang</TEXT></DOCUMENT>');
gleich([hd.typ, hd.text], ['8-K', 'Item 3.01\nText & mehr hier fett'], '10.7 gespeichert wird nur das Hauptdokument, ohne Auszeichnung');
/* Fassung 2 (nach der Lernprobe) */
function mit(titel, text) { return W.klasse('FORM 8-K\n' + titel + text + ENDE); }
gleich([mit('Item\n3.01. Notice\nof Delisting or Failure to Satisfy a Continued Listing Rule or Standard; Transfer of Listing.\n', 'The Company is not in compliance with the rule.').klasse, mit('Item\n3.01\n', 'Text ohne Treffer.').abschnitt], ['ruege', 1], '10.8 Fassung 2: "Item" und Nummer in zwei Zeilen');
gleich([mit('Item 3.01 Notice of Delisting of Failure to Satisfy a Continued Listing Rule or Standard; Transfer of Listing.\n', 'Nothing here.').klasse, mit('Item 3.01 Notice of Delisting or Failure to Satisfy a Continuing Listing Rule or Standard; Transfer of Listing.\n', 'Nothing here.').klasse,
  mit('Item 3.01 Notice of Delisting or Failure to Satisfy a Continued Listing Rule or Stand; Transfer of Listing\n', 'Nothing here.').klasse], ['nichts', 'nichts', 'nichts'], '10.9 Fassung 2: der Titel mit Tippfehlern ist kein Treffer');
gleich([mit(TITEL, 'The Company notified NASDAQ that the Merger had closed and requested that trading be suspended.').klasse, mit(TITEL, 'The Company received written notice from Nasdaq that it would delist the shares.').klasse,
  mit(TITEL, 'The Company announced that it intends to file a Form 25 with the Commission.').klasse, mit(TITEL, 'The board of directors authorized the delisting of the common stock.').klasse, mit(TITEL, 'Each unit was purchased pursuant to the call right.').klasse],
  ['vollzug', 'ruege', 'eigener-entschluss', 'eigener-entschluss', 'vollzug'], '10.10 Fassung 2: die Zusaetze der Wortlisten');
gleich(W.FASSUNG, 2, '10.11 Fassung der Wortlisten');

/* ---- 11 die Kopie der Einstufung gegen das Original aus Nr. 86: welche Zeilen sind anders? ---- */
var orig = fs.readFileSync(path.join(Z3.P2, 't4-einstufen.js'), 'utf8').split(/\r?\n/), kop = fs.readFileSync(path.join(Z3.HIER, 't4-einstufen.js'), 'utf8').split(/\r?\n/);
var imOrig = {}, inKop = {}; orig.forEach(function (l) { imOrig[l] = 1; }); kop.forEach(function (l) { inKop[l] = 1; });
var neueZeilen = kop.filter(function (l) { return !imOrig[l]; }), fehlende = orig.filter(function (l) { return !inKop[l]; });
var jeMarke = { V1: 0, V2: 0, V3: 0, V3b: 0, V5i: 0, V5iii: 0, V7: 0, V8: 0, RAHMEN3: 0, ohne: [] };
neueZeilen.forEach(function (l) {
  var m = /\/\/ ((?:V1|V2|V3b|V3|V5iii|V5i|V7|V8|RAHMEN3)(?: (?:V1|V2|V3b|V3|V5iii|V5i|V7|V8))*)$/.exec(l) || (/^\/\/ RAHMEN3/.test(l) ? [0, 'RAHMEN3'] : null);
  if (!m) { jeMarke.ohne.push(l.slice(0, 80)); return; }
  m[1].split(' ').forEach(function (k) { jeMarke[k]++; });
});
gleich(jeMarke.ohne, [], '11.1 jede geaenderte Zeile der Kopie traegt eine Marke');
gleich([neueZeilen.length, fehlende.length, jeMarke.V1, jeMarke.V2, jeMarke.V3, jeMarke.V3b, jeMarke.V5i, jeMarke.V5iii, jeMarke.V7, jeMarke.V8, jeMarke.RAHMEN3], [143, 38, 9, 42, 13, 10, 5, 22, 1, 19, 23], '11.2 Umfang der Aenderung: 143 neue oder geaenderte Zeilen (V1 9, V2 42, V3 13, V3b 10, V5i 5, V5iii 22, V7 1, V8 19 - eine Zeile traegt V5iii und V8 -, Rahmen 23), 38 Zeilen des Originals ersetzt');
['ms', 'tage', 'imFenster', 'leer', 'fenster', 'akz', 'emittent25'].forEach(function (n) { ok(String(E2[n] || '').length > 20 ? String(E[n]) === String(E2[n]) : true, '11.3 Funktion ' + n + '() wortgleich mit dem Original'); });
ok(String(E.fenster) === String(E2.fenster) && String(E.imFenster) === String(E2.imFenster), '11.4 fenster() und imFenster() sind wortgleich mit dem zweiten Lauf');
var RA = Object.assign({}, RK, { massnahmeEnde: { art: 'cash_mergers', ex: tg(1), id: 'x1', rate: 10, neuesKuerzel: null }, letzterKursArchiv: 9.5 });
gleich([E.stufeEin(RA, {}, null, {}, 0, null, Object.assign({}, E.ALLE_AN, { V8: 0 })).grund, E2.stufeEin(RA, {}, null, {}, 0, null).grund], ['uebernahme', 'uebernahme'], '11.5 mit V8 aus liest die Kopie die juengste Massnahme wie das Original');
var alleAus = { V1: 0, V2: 0, V3: 0, V3b: 0, V5i: 0, V5iii: 0, V7: 0, V8: 0 };
[S([k301(tg(-200))]), S([k301(tg(-9)), { f: '25', d: tg(2), a: 'F1', it: '' }], { sic: '6770' }), nur25, S([{ f: '8-K', d: tg(-10), a: 'A1', it: '2.01' }, { f: 'S-4', d: tg(-90), a: 'A2', it: '' }])].forEach(function (s, i) {
  [ZP, ZF].forEach(function (z) { gleich(gb(E.stufeEin(R({ letzterKursArchiv: 10 }), z, s, {}, 0, null, alleAus)), gb(E2.stufeEin(R({ letzterKursArchiv: 10 }), z, s, {}, 0, null)), '11.6 alle Regeln aus = Einstufung des zweiten Laufs (Fall ' + i + ', ' + z.weg + ')'); });
});

/* ---- 12 Rahmen: Takt, Obergrenze, Kursband, Stichprobe ---- */
ok(1000 / ED.MIN_ABSTAND_MS <= 5 && ED.MIN_ABSTAND_SUCHE_MS >= 350 && ED.SPERRE_WARTEN_MS === 600000 && Z3.MAX_ANFRAGEN === 3000, '12.1 hoechstens 5 Anfragen je Sekunde, zehn Minuten bei Sperre, Obergrenze 3.000');
gleich([0.99, 1, 4.99, 5, 7.99, 8, 13, 13.01, null].map(Z3.band), ['unter 1', '1-5', '1-5', '5-8', '5-8', '8-13', '8-13', 'ueber 13', 'ohne Kurs'], '12.2 Kursbaender');
var liste = []; for (var i = 0; i < 100; i++) liste.push({ n: 'R' + (i < 10 ? '0' : '') + i });
gleich(G.ziehe(liste, 30, 'z3-lern', function (x) { return x.n; }), G.ziehe(liste.slice().reverse(), 30, 'z3-lern', function (x) { return x.n; }), '12.3 gleiche Saat, gleiche Ziehung');

console.log((schlecht ? 'ROT' : 'GRUEN') + ': ' + gut + ' bestanden, ' + schlecht + ' gefallen');
process.exit(schlecht ? 1 : 0);
