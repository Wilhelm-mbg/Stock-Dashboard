'use strict';
/* TEST der Regeln von Phase 2a (Auftrag Nr. 86) - nur Kunstfaelle, kein Netz, nichts auf E: geschrieben oder gelesen.
 * Aufruf:  node test.js      (Ausgang 0 = alles gruen)
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var P = require('./p2.js');
var KV = require('./kopien-v2.js');
var L2 = require('./leser2.js');
var U = require('./t4-universum.js');
var E = require('./t4-einstufen.js');
var E79 = require('../t2-einstufen.js');
var ED = require('./t4-edgar.js');
var A = require('./t4-auswerten.js');
var KP = require(path.join(G.PRUEFSTAND, 'konfig.js'));

var gut = 0, schlecht = 0;
function ok(b, was) { if (b) gut++; else { schlecht++; console.log('FEHLER: ' + was); } }
function gleich(a, b, was) { ok(JSON.stringify(a) === JSON.stringify(b), was + ' - ist ' + JSON.stringify(a) + ', soll ' + JSON.stringify(b)); }

/* ---- 1 Teil 1: Lebenszeit-Regel am Rand ---- */
var tage = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02'];
var kal = G.kalenderAus(tage), ENDE = '2026-10-02';
function mt(tag) { return Date.parse(tag + 'T18:00:00Z'); }            // 14:00 New Yorker Zeit
function zeile(letzter, opt) { return P.lebenszeitZeile([{ jahr: 2026, erster: mt('2026-01-05'), letzter: mt(letzter), tage: 100 }], opt, ENDE, kal, 10); }
gleich([zeile('2026-09-18').abstandHandelstage, zeile('2026-09-18').lebend], [10, 1], '1.1 genau 10 Handelstage vor dem Ende: noch lebend');
gleich([zeile('2026-09-17').abstandHandelstage, zeile('2026-09-17').lebend], [11, 0], '1.2 11 Handelstage vor dem Ende: abgegangen');
gleich(zeile('2026-10-02').lebend, 1, '1.3 Minuten bis zum Ende: lebend');
gleich(zeile('2026-10-02', { erloschen: true }).lebend, 0, '1.4 erloschener Traeger ist nie lebend');
gleich([P.lebenszeitZeile([], {}, ENDE, kal, 10).lebend, P.lebenszeitZeile([], {}, ENDE, kal, 10).letzterMinutentag], [0, null], '1.5 ohne Minuten nicht lebend');
gleich(P.panelDeckel(ENDE, kal, 10), '2026-09-17', '1.6 Panel-Deckel: 11 Handelstage vor dem Ende (02.10.2026 -> 17.09.2026)');
gleich(P.lebenszeitZeile([{ jahr: 2019, erster: mt('2019-01-02'), letzter: mt('2019-10-25'), tage: 200 }, { jahr: 2026, erster: mt('2026-08-27'), letzter: mt('2026-10-01'), tage: 20 }], { schnittMs: Date.UTC(2023, 10, 6), erloschen: true }, ENDE, kal, 10).jahre, [2019], '1.7 Jahre mit Datei: nur die des Traegers');
gleich(G.etTag(Date.UTC(2022, 11, 30, 0, 59)), '2022-12-29', '1.8 letzter Minutentag ist der New Yorker Tag');

/* ---- 2 Teil 3: Leser - welche Datei gilt, und der Abbruch bei veralteter Kopie ---- */
var R1 = { letzter: 1000 }, kurz = { letzter: 900 }, lang = { letzter: 1000 };
gleich(L2.wahl('X/2026.json', { v2: true, alt: true }, { roh: R1, v2: lang, alt: kurz }), { kopie: 'v2', quelle: 'bereinigt' }, '2.1 v2-Kopie reicht so weit wie die Rohdatei: v2 (auch wenn die alte Kopie veraltet ist)');
gleich(L2.wahl('X/2026.json', { v2: false, alt: true }, { roh: R1, alt: lang }), { kopie: 'alt', quelle: 'bereinigt' }, '2.2 keine v2-Kopie, alte Kopie reicht: alte Kopie');
gleich(L2.wahl('X/2026.json', { v2: false, alt: false }, { roh: R1 }), { kopie: null, quelle: 'roh' }, '2.3 gar keine Kopie: die Rohdatei IST die bereinigte');
var w1 = L2.wahl('X/2026.json', { v2: false, alt: true }, { roh: R1, alt: kurz });
ok(w1.veraltet && w1.veraltet.kopie === 'alt' && !w1.kopie, '2.4 alte Kopie kuerzer als die Rohdatei: Abbruch statt Lesen');
var w2 = L2.wahl('X/2026.json', { v2: true, alt: true }, { roh: R1, v2: kurz, alt: lang });
ok(w2.veraltet && w2.veraltet.kopie === 'v2', '2.5 veraltete v2-Kopie: Abbruch - kein stilles Ausweichen auf die alte Kopie oder roh');
ok(L2.wahl('X/2026.json', { v2: false, alt: true }, { roh: undefined, alt: lang }).veraltet.grund.indexOf('nicht pruefbar') === 0, '2.6 fehlt der Manifest-Eintrag, ist die Kopie nicht pruefbar: Abbruch');
var f1 = L2.fehlerVeraltet('X/2026.json', { kopie: 'alt', kopieEnde: mt('2026-09-03'), rohEnde: mt('2026-10-02') });
ok(f1 instanceof Error && f1.code === 'LESER2_KOPIE_VERALTET' && f1.message.indexOf('2026-09-03') > 0 && f1.message.indexOf('2026-10-02') > 0 && /nicht still/.test(f1.message), '2.7 die Meldung nennt beide Enden und sagt, dass nicht still ausgewichen wird');
ok(L2.KENNUNG === P.KENNUNG_LESER && /leser2/.test(L2.KENNUNG), '2.8 eigene Kennung im Modul');

/* ---- 3 Teil 2: verworfener Split-Satz ---- */
gleich([P.SPERRE_MIN_LOG, P.SPERRE_ANTEIL], [KP.SPLIT_SPERRE_MIN_LOG, KP.SPLIT_SPERRE_ANTEIL], '3.1 Massstab ist die Split-Sperre des Panels (K.SPLIT_SPERRE_*)');
gleich([P.zeigtSprung(4.1, 0.25), P.zeigtSprung(0.98, 0.25), P.zeigtSprung(0.5, 2), P.zeigtSprung(1.01, 1.05), P.zeigtSprung(0.3, 0.25)], [true, false, true, true, false], '3.2 zeigtSprung wie im Trockenlauf (T5)');
var EX = '2020-06-01', EX2 = '2020-06-02', msEx = KV.wirkungMs(EX), msEx2 = KV.wirkungMs(EX2);
gleich(new Date(msEx).toISOString(), '2020-06-01T04:00:00.000Z', '3.3 Wirkung ab dem ersten Moment des New Yorker Tages (Sommerzeit: 04:00 UTC)');
gleich(new Date(KV.wirkungMs('2020-12-01')).toISOString(), '2020-12-01T05:00:00.000Z', '3.4 ... im Winter 05:00 UTC');
var satz = { art: 'reverse_splits', datum: EX, ms: msEx, faktor: 0.1, herkunft: 'quelle new_rate/old_rate' };
var guter = { art: 'forward_splits', datum: '2021-03-01', ms: KV.wirkungMs('2021-03-01'), faktor: 2, herkunft: 'quelle new_rate/old_rate' };
var roh = [[msEx - 86400000, 5, 100, 5, 5, 5], [msEx + 36000000, 5.1, 100, 5.1, 5.1, 5.1], [msEx2 + 36000000, 5.2, 100, 5.2, 5.2, 5.2]];
var v1 = KV.v2Faktoren([satz, guter], [{ ex: EX, art: 'reverse_splits', faktor: 0.1, rohZeigtSprung: false, sprungAmNachbartag: null }]);
gleich([v1.anwendbar.length, v1.anwendbar[0].datum, v1.verworfen.length, v1.verworfen[0].datum], [1, '2021-03-01', 1, EX], '3.5 Satz ohne Sprung in der Rohdatei wird verworfen, der richtige Satz der Reihe bleibt');
var alt1 = KV.ableiten(roh, [satz, guter]), neu1 = KV.ableiten(roh, v1.anwendbar);
gleich(neu1.map(function (k) { return k[1]; }), [2.5, 2.55, 2.6], '3.6 v2 traegt vor dem verworfenen Ex-Tag nur den Faktor des uebrigen Satzes (roh / 2)');
gleich(alt1[0][1], 25, '3.7 die alte Kopie trug dort roh / (0,1 x 2)');
var c1 = KV.vergleiche(neu1, alt1, v1, 'a');
gleich([c1.gleich, c1.geaendert, c1.geaendertWieErwartet, c1.geaendertUnerwartet, c1.geaendertNachExTag], [2, 1, 1, 0, 0], '3.8 Vergleich: davor = alte Kopie x Faktor, ab dem Ex-Tag gleich');
gleich(KV.v2Faktoren([satz], []).anwendbar[0].datum, EX, '3.9 Gegenfall: ein nie abgelehnter Satz wird angewandt wie er ist');

/* ---- 4 Teil 2: verschobener Ex-Tag ---- */
var v2 = KV.v2Faktoren([satz], [{ ex: EX, art: 'reverse_splits', faktor: 0.1, rohZeigtSprung: false, sprungAmNachbartag: { tagVor: EX, tagAb: EX2, versatzHandelstage: 1, verhaeltnis: 9.8 } }]);
gleich([v2.anwendbar.length, v2.anwendbar[0].datum, v2.anwendbar[0].datumQuelle, v2.anwendbar[0].verschoben, v2.verworfen.length], [1, EX2, EX, 1, 0], '4.1 Sprung einen Handelstag nach dem Satz: angewandt mit dem Ex-Tag auf dem Tag des Sprungs');
var alt2 = KV.ableiten(roh, [satz]), neu2 = KV.ableiten(roh, v2.anwendbar);
gleich([alt2[1][1], Math.round(neu2[1][1] * 1e6) / 1e6, neu2[2][1]], [5.1, 51, 5.2], '4.2 die alte Kopie war am Tag im Satz unbereinigt (falsch), v2 teilt ihn durch den Faktor; der Tag des Sprungs bleibt roh');
var c2 = KV.vergleiche(neu2, alt2, v2, 'a');
gleich([c2.gleich, c2.geaendert, c2.geaendertWieErwartet, c2.geaendertNachExTag], [2, 1, 1, 0], '4.3 genau ein Tag aendert sich');
var v3 = KV.v2Faktoren([{ art: 'forward_splits', datum: '2023-02-28', ms: KV.wirkungMs('2023-02-28'), faktor: 0.9 }], [{ ex: '2023-02-28', art: 'forward_splits', faktor: 0.9, sprungAmNachbartag: { tagAb: '2023-02-27', versatzHandelstage: -1 } }]);
gleich([v3.anwendbar.length, v3.verworfen.length], [0, 1], '4.4 Gegenfall MFH: Sprung nur am Tag DAVOR - nicht angewandt');
gleich([P.grosserSprung(1, 1.41, 0.4), P.grosserSprung(1, 1.39, 0.4), P.grosserSprung(1, 0.59, 0.4), P.grosserSprung(1, 0.61, 0.4), P.grosserSprung(0, 2, 0.4)], [true, false, true, false, false], '4.5 Sprung ueber 40 %, auf oder ab');
gleich(KV.sprungNach({ '2026-09-02': { o: 1, c: 1 }, '2026-09-03': { o: 3, c: 1 }, '2026-09-21': { o: 1, c: 0.23 }, '2026-09-22': { o: 2.03, c: 2 } }, '2026-09-03', 0.4).tagAb, '2026-09-22', '4.6 nur Spruenge NACH dem Ende der alten Kopie zaehlen (der vom 03.09. nicht)');
ok(KV.sprungNach({ '2026-09-03': { o: 1, c: 1 }, '2026-09-04': { o: 1.2, c: 1.2 } }, '2026-09-03', 0.4) === null, '4.7 Gegenfall: 20 % sind kein Sprung');
var threw = false; try { P.nurNeu('E:/Markt-Dashboard-Archiv/alpaca1m/A/2026.json'); } catch (e) { threw = true; }
ok(threw && P.nurNeu(P.BER2 + '/A/2026.json') && P.nurNeu(P.LZM), '4.8 Schreibschutz: nur die zwei neuen Ordner auf E:');

/* ---- 5 Teil 4, R-a: Firma = Polygon-CIK hoechstens 45 Tage vom Anker ---- */
var pe = [{ bis: '2019-10-07', name: 'Kunst Inc', cik: '0000000001' }, { bis: '2024-03-01', name: 'Andere Inc', cik: '0000000002' }, { bis: '2019-10-03', name: 'Ohne CIK', cik: null }];
gleich(U.polygonFirma(pe, '2019-10-02', 45), { cik: '0000000001', name: 'Kunst Inc', bis: '2019-10-07', tage: 5 }, '5.1 R-a: der Eintrag MIT CIK am Anker gilt (der ohne CIK nicht)');
gleich(U.polygonFirma(pe, '2019-08-23', 45).tage, 45, '5.2 R-a: genau 45 Tage zaehlen noch');
gleich(U.polygonFirma(pe, '2019-08-22', 45), null, '5.3 R-a Gegenfall: 46 Tage - keine Polygon-Firma, die Volltextsuche laeuft');
gleich(U.polygonFirma(pe, '2024-03-10', 45).cik, '0000000002', '5.4 R-a: wiederverwendetes Kuerzel - der Eintrag am Anker, nicht der fruehere Traeger');

/* ---- 6 Teil 4, R-b: 8-K 2.01 nur hoechstens 30 Tage vor oder nach dem Anker ---- */
var RK = { reihe: 'K', basis: 'K', ordner: 'K', art: 'CS', gruppe: 'verschwunden', letzterKursArchiv: 1, massnahmeEnde: null, letzterBalken: '2022-12-29' };
var ZP = { cik: '1', sicherheit: 'stark', weg: 'polygon-cik' }, ZF = { cik: '1', sicherheit: 'mittel', weg: 'fts-mehrheit' };
function S(l) { return { name: 'Kunst AG', sic: '1000', einreichungen: l }; }
var nah = S([{ f: '8-K', d: '2022-12-10', a: 'A1', it: '2.01,9.01' }, { f: 'DEFM14A', d: '2022-10-01', a: 'A2', it: '' }]);
var fern = S([{ f: '8-K', d: '2022-11-01', a: 'A1', it: '2.01,9.01' }, { f: 'DEFM14A', d: '2022-10-01', a: 'A2', it: '' }]);
var danach = S([{ f: '8-K', d: '2023-01-27', a: 'A1', it: '2.01' }, { f: 'S-4', d: '2022-10-01', a: 'A2', it: '' }]);
gleich([E.stufeEin(RK, ZP, nah, {}, 0, null).grund, E.stufeEin(RK, ZP, danach, {}, 0, null).grund], ['uebernahme', 'uebernahme'], '6.1 R-b: Vollzug 19 Tage vor bzw. 29 Tage nach dem Anker zaehlt');
gleich([E.stufeEin(RK, ZP, fern, {}, 0, null).grund, E.stufeEin(RK, ZP, fern, {}, 0, null).beleg], ['unbekannt', 'edgar-ohne-signal'], '6.2 R-b Gegenfall: Vollzug 58 Tage vor dem Anker zaehlt nicht mehr');
gleich(E79.stufeEin(RK, ZP, fern, {}, 0, null).grund, 'uebernahme', '6.3 ... in der Kopie aus Nr. 79 (Fenster 550 Tage) war derselbe Fall eine Uebernahme');
var fernMit301 = S(fern.einreichungen.concat([{ f: '8-K', d: '2022-12-28', a: 'A3', it: '3.01,5.01' }]));
gleich(E.stufeEin(RK, ZP, fernMit301, {}, 0, null).grund, 'zwangs-delisting', '6.4 Folge von R-b (Befund des Trockenlaufs): mit einem 8-K 3.01 am Anker wird aus der fernen Uebernahme ein Zwangs-Delisting');
gleich(E.VOLLZUG_TAGE, 30, '6.5 die Schwelle steht als Konstante');

/* ---- 7 Teil 4, R-c: Formular 25 ohne 8-K 3.01 ---- */
var nur25 = S([{ f: '25-NSE', d: '2022-12-30', a: 'B1', it: '' }]);
var u25 = E.stufeEin(RK, ZP, nur25, {}, 0, null);
gleich([u25.grund, u25.beleg, u25.datum], ['abgemeldet-anlass-offen', 'edgar-formular25', '2022-12-30'], '7.1 R-c: Formular 25 der Polygon-Firma ohne 8-K 3.01 -> abgemeldet-anlass-offen');
gleich(E79.stufeEin(RK, ZP, nur25, {}, 0, null).grund, 'freiwillig', '7.2 ... in der Kopie aus Nr. 79 hiess das freiwillig');
var uF = E.stufeEin(RK, ZF, nur25, {}, 0, null);
gleich([uF.grund, uF.beleg, !!uF.formular25_ohne_aussenanker], ['unbekannt', 'edgar-ohne-signal', true], '7.3 R-c Gegenfall: Formular 25 einer Firma aus der Volltextsuche zaehlt nicht (wird als Feld mitgefuehrt)');
gleich(E.stufeEin(RK, ZP, S([{ f: '25-NSE', d: '2022-12-30', a: 'B1', it: '' }, { f: '8-K', d: '2022-12-20', a: 'B2', it: '3.01' }]), {}, 0, null).grund, 'zwangs-delisting', '7.4 R-c Gegenfall: mit 8-K 3.01 bleibt es beim Zwangs-Delisting');
gleich([E.stufeEin(RK, ZF, S([{ f: '15-12G', d: '2023-01-10', a: 'B3', it: '' }]), {}, 0, null).grund, E.stufeEin(RK, ZF, S([{ f: '15-12G', d: '2023-01-10', a: 'B3', it: '' }]), {}, 0, null).beleg], ['freiwillig', 'edgar-formular15'], '7.5 Formular 15 allein bleibt freiwillig (sonst nichts geaendert)');
gleich(E.stufeEin(RK, ZP, S([{ f: '25', d: '2022-12-30', a: 'B4', it: '' }, { f: '8-K', d: '2022-12-20', a: 'B2', it: '3.01' }]), {}, 0, null).signale.f25_emittent, 'EDGAR:B4 (25 2022-12-30)', '7.6 Zusatzfeld: Formular 25 des Emittenten (Typ 25, nicht 25-NSE)');

/* ---- 8 die Kopie der Einstufung: welche Zeilen sind gegenueber dem Original aus Nr. 79 anders? ---- */
var orig = fs.readFileSync(path.join(G.HIER, 't2-einstufen.js'), 'utf8').split(/\r?\n/), kop = fs.readFileSync(path.join(P.HIER, 't4-einstufen.js'), 'utf8').split(/\r?\n/);
var imOrig = {}, inKop = {}; orig.forEach(function (l) { imOrig[l] = 1; }); kop.forEach(function (l) { inKop[l] = 1; });
var neueZeilen = kop.filter(function (l) { return !imOrig[l]; }), fehlende = orig.filter(function (l) { return !inKop[l]; });
var jeMarke = { 'R-a': 0, 'R-b': 0, 'R-c': 0, RAHMEN: 0, ohne: [] };
neueZeilen.forEach(function (l) {
  var m = /\/\/ (R-a R-c|R-a|R-b|R-c|RAHMEN)$/.exec(l) || (/^\/\/ RAHMEN/.test(l) ? [0, 'RAHMEN'] : null);
  if (!m) { jeMarke.ohne.push(l.slice(0, 80)); return; }
  m[1].split(' ').forEach(function (k) { jeMarke[k]++; });
});
gleich(jeMarke.ohne, [], '8.1 jede geaenderte Zeile der Kopie traegt eine Marke (R-a, R-b, R-c oder RAHMEN)');
gleich([neueZeilen.length, fehlende.length, jeMarke['R-a'], jeMarke['R-b'], jeMarke['R-c'], jeMarke.RAHMEN], [43, 16, 1, 2, 5, 36], '8.2 Umfang der Aenderung: 43 neue oder geaenderte Zeilen (R-a 1, R-b 2, R-c 5 - eine Zeile traegt R-a und R-c -, Rahmen 36), 16 Zeilen des Originals ersetzt');
function funktionen(datei) {
  var t = fs.readFileSync(datei, 'utf8'), aus = {};
  ['ms', 'tage', 'imFenster', 'leer', 'fenster', 'akz'].forEach(function (n) {
    var a = t.indexOf('\nfunction ' + n + '('), b = t.indexOf('\n}\n', a), eine = t.indexOf('\n', a + 1);
    aus[n] = (t.slice(a, eine).indexOf('}') > 0 && t.slice(a, eine).trim().slice(-1) === '}') ? t.slice(a, eine).trim() : t.slice(a, b + 2).trim();
  });
  return aus;
}
var fo = funktionen(path.join(G.GRUENDE, 'einstufen.js')), fk = funktionen(path.join(P.HIER, 't4-einstufen.js'));
Object.keys(fo).forEach(function (n) { ok(fo[n].length > 20 && fo[n] === fk[n], '8.3 Funktion ' + n + '() ist wortgleich mit dem Original vom 12.09.'); });
gleich(E.stufeEin(Object.assign({}, RK, { massnahmeEnde: { art: 'cash_mergers', ex: '2022-12-30', id: 'x1', rate: 10, neuesKuerzel: null }, letzterKursArchiv: 9.5 }), {}, null, {}, 0, null).grund, 'uebernahme', '8.4 unveraendert: die Massnahme der Quelle am Anker schlaegt alles andere');

/* ---- 9 Auswertung ---- */
function v(ag, ng) { return A.vergleiche(ag === undefined ? null : { grund: ag, datum: 'd', quelle: 'q' }, { grund: ng, datum: 'd', quelle: 'q' }); }
gleich([v('freiwillig', 'abgemeldet-anlass-offen'), v('uebernahme', 'zwangs-delisting'), v('uebernahme', 'unbekannt'), v('unbekannt', 'abgemeldet-anlass-offen'), v(undefined, 'insolvenz'), v('insolvenz', 'insolvenz'), v('zwangs-delisting', 'abgemeldet-anlass-offen')],
  ['umbenannt-R-c', 'kippt', 'kippt-verliert-grund', 'unbekannt-bekommt-grund', 'neu', 'gleich', 'kippt'], '9.1 freiwillig -> abgemeldet-anlass-offen ist eine Umbenennung, kein Kipp-Fall');
gleich(A.ursachen({ anker_diff_tage: 813, cik: '2', zuordnungsweg: 'polygon-cik', letzter_balken: '2022-12-29', alt: { cik: '1', beleg: 'edgar-8K-2.01+prospekt', datum: '2022-01-01', grund: 'uebernahme' } }), ['Anker', 'R-a', 'R-b'], '9.2 Ursachen eines Kipp-Falls');
gleich(A.ursachen({ anker_diff_tage: 0, cik: '1', zuordnungsweg: 'polygon-cik', letzter_balken: '2022-12-29', alt: { cik: '1', beleg: 'edgar-8K-3.01', datum: '2022-12-20', grund: 'zwangs-delisting' } }), [], '9.3 Gegenfall: keine Regel beruehrt - der Unterschied kaeme aus dem Datenstand');
gleich([A.tvIn('insolvenz', ['insolvenz', 'zwangs-delisting']), A.tvIn('abgemeldet-anlass-offen', ['insolvenz', 'zwangs-delisting']), A.tvIn(null, ['insolvenz'])], [true, false, false], '9.4 Totalverlust-Eigenschaft');
gleich([A.nameAehnlich('ALTABA INC.', 'Altaba Inc. Common Stock'), A.nameAehnlich('AMERICAN EAGLE OUTFITTERS INC', 'Almost Family Inc'), A.nameAehnlich('BARD C R INC /NJ/', 'C.R. Bard, Inc.')], [true, false, false], '9.5 Namensvergleich ist grob: gleiche Firma, fremde Firma - und eine Schreibvariante, die er NICHT erkennt (deshalb Leseliste, kein Urteil)');

/* ---- 10 EDGAR: Takt und fremder Cache ---- */
ok(1000 / ED.MIN_ABSTAND_MS <= 6 && ED.MIN_ABSTAND_SUCHE_MS >= 350, '10.1 Takt: hoechstens 6 Anfragen je Sekunde, Volltextsuche mindestens 350 ms');
gleich(ED.SPERRE_WARTEN_MS, 600000, '10.2 bei 429/403 zehn Minuten warten');
function ausz(n, aelt, geholt) { return { n: n, geholt: geholt || '2026-09-12T16:00:00Z', einreichungen: [{ d: '2026-01-05' }, { d: aelt }] }; }
gleich([ED.deckt(ausz(300, '2019-01-01'), '2015-01-01', '2020-01-01').ok, ED.deckt(ausz(1000, '2021-06-01'), '2021-01-01', '2023-06-01').ok, ED.deckt(ausz(1000, '2020-06-01'), '2021-01-01', '2023-06-01').ok,
  ED.deckt(ausz(300, '2019-01-01'), '2025-01-01', '2027-03-01').ok, ED.deckt(null, '2021-01-01', '2023-06-01').ok],
  [true, false, true, false, false], '10.3 fremder Auszug gilt nur, wenn er das Fenster nachweislich deckt (Regel aus Nr. 79)');

/* ---- 11 Stichprobe mit fester Saat ---- */
var liste = []; for (var i = 0; i < 100; i++) liste.push({ n: 'R' + (i < 10 ? '0' : '') + i });
gleich(G.ziehe(liste, 20, 't4-kipp', function (x) { return x.n; }), G.ziehe(liste.slice().reverse(), 20, 't4-kipp', function (x) { return x.n; }), '11.1 gleiche Saat, gleiche Ziehung');

console.log((schlecht ? 'ROT' : 'GRUEN') + ': ' + gut + ' bestanden, ' + schlecht + ' gefallen');
process.exit(schlecht ? 1 : 0);
