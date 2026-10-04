'use strict';
/* Pruefungen zur Zielfunktion "aktionaersrendite" (blind festgelegt 04.10.2026). Aufruf aus der Repo-Wurzel:
 *   node studien/kandidaten-blind-2026-10/aktionaersrendite/test.js
 * Nur Kunstdaten, keine Kursdaten. Sollwerte von Hand gerechnet (Rechenweg im Kommentar). Jede Pruefung haengt an einer Regelzeile:
 * wird die Zeile ausgebaut, wird die genannte Pruefung rot. Wo moeglich gibt es eine Gegenprobe ueber opts-Ueberschreibung
 * (Regel abgeschaltet => das Gegenteil muss eintreten). Exit-Code 1 bei jedem Fehler. */
var Z = require('./ziel.js');
var zielfunktion = Z.zielfunktion, placeboZiel = Z.placeboZiel;

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 1e-12 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function gleich(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

var TAGMS = 86400000;
function dt(s) { return Date.parse(s + 'T00:00:00Z'); }
var NOW = dt('2020-06-30');                       /* Stichtag der meisten Pruefungen */

/* ---------- Bausteine ---------- */
/** Kursreihe: n Kalendertage bis `bis`, Kurs 100, 2e6 Stueck (Umsatz 200 Mio $). o.luecke: Indizes, die fehlen; o.letzter: letzter Kurs; o.extra: Zeilen dazu. */
function reihe(o) {
  o = o || {};
  var bis = o.bis == null ? NOW : o.bis, n = o.n || 25, kurs = o.kurs == null ? 100 : o.kurs, st = o.stueck == null ? 2e6 : o.stueck, drop = o.luecke || [], rows = [];
  for (var k = 0; k < n; k++) {
    if (drop.indexOf(k) >= 0) continue;
    rows.push([bis - (n - 1 - k) * TAGMS, (k === n - 1 && o.letzter != null) ? o.letzter : kurs, st]);
  }
  return o.extra ? rows.concat(o.extra) : rows;
}
function rec(filed, pe, form, dauer, werte, sic) { var r = { filed: filed, periodEnde: pe, form: form, werte: werte }; if (dauer != null) r.dauer = dauer; if (sic != null) r.sic = sic; return r; }
/** Werte einer Meldung; null = Tag fehlt. x.fin: Pflicht-Tag (null = fehlt, sonst Standard -1e8); x.aktien: Deckblatt-Aktienzahl. */
function w(D, B, E, x) {
  x = x || {};
  var o = {};
  if (D != null) o.PaymentsOfDividendsCommonStock = D;
  if (B != null) o.PaymentsForRepurchaseOfCommonStock = B;
  if (E != null) o.ProceedsFromIssuanceOfCommonStock = E;
  if (x.fin !== null) o.NetCashProvidedByUsedInFinancingActivities = x.fin === undefined ? -1e8 : x.fin;
  if (x.aktien != null) o.EntityCommonStockSharesOutstanding = x.aktien;
  return o;
}
/** Standardfirma: 10-K 2019 (Jahreswerte D, B, E), Q1 2020 und Q1 2019 mit gleichen Quartalswerten (Jahr/4) => TTM = Jahreswerte.
 *  Aktien 100 Mio, Kurs 100 => Marktkapitalisierung 1e10; 1 Pp Rendite = 1e8 $. */
function std(D, B, E, o) {
  o = o || {};
  var sic = o.sic === undefined ? 3571 : o.sic, ak = o.aktien === undefined ? 100e6 : o.aktien;
  var q = function (v) { return v == null ? null : v / 4; };
  return [rec('2020-02-20', '2019-12-31', '10-K', 4, w(D, B, E, { aktien: ak }), sic),
    rec('2020-05-05', '2020-03-31', '10-Q', 1, w(q(D), q(B), q(E), { aktien: ak })),
    rec('2019-05-06', '2019-03-31', '10-Q', 1, w(q(D), q(B), q(E)))];
}
/** Nur Jahresmeldung (kurz) - fuer grosse Universen. */
function kurz(B) { return [rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, B, null, { aktien: 100e6 }), 3571)]; }

/** Eine Firma X plus ein Koeder PP (Rendite 5 %), damit X auch mit Rendite <= 0 in rangfolge steht. */
function solo(recs, o, ro) {
  o = o || {};
  var roh = { X: reihe(ro), PP: reihe() }, fund = { X: recs, PP: std(0, 5e8, 0) };
  var opts = { nowMs: NOW, fundamental: fund, minWerte: 1, minZiel: 1 };
  Object.keys(o).forEach(function (k) { opts[k] = o[k]; });
  var r = zielfunktion(roh, opts);
  r.x = r.rangfolge.filter(function (p) { return p.sym === 'X'; })[0] || null;
  r.grund = (r.verworfen.filter(function (v) { return v.sym === 'X'; })[0] || {}).grund || null;
  return r;
}
function enthaelt(s, t) { return typeof s === 'string' && s.indexOf(t) >= 0; }

/* ================= 1. Konstanten der Regel ================= */
ok('KONFIG: hoechstens 30 Positionen', Z.KONFIG.maxZiel === 30);
ok('KONFIG: Dezil (0,1) wie das Buch der App', Z.KONFIG.anteil === 0.1);
ok('KONFIG: Korbregel wie liquide.js (100 Mio $, 20 Balken, 100 Werte)', Z.KONFIG.umsatzMin === 100000000 && Z.KONFIG.umsatzFenster === 20 && Z.KONFIG.minWerte === 100);
ok('KONFIG: Karenz 1 Tag, Finanzwerte SIC 6000-6999', Z.KONFIG.karenzTage === 1 && gleich(Z.KONFIG.sicAusschluss, [6000, 6999]));
ok('zielzahl = min(30, max(5, round(0,1 x n)))', Z.zielzahl(100, Z.KONFIG) === 10 && Z.zielzahl(20, Z.KONFIG) === 5 && Z.zielzahl(294, Z.KONFIG) === 29 && Z.zielzahl(295, Z.KONFIG) === 30 && Z.zielzahl(5000, Z.KONFIG) === 30);

/* ================= 2. Formel von Hand: Vier-Quartale-Summe =================
 * Firma YT, Stichtag 30.06.2020, Kurs 100, Aktien 100e6 => Marktkap 1e10. Anker = Q1 2020 (periodEnde 31.03.2020, dauer 1, eingereicht 05.05.2020).
 *   Q1 2020 (kumuliert 1 Quartal): D 12e6, B 50e6, E 5e6     10-K 2019 (dauer 4): D 40e6, B 200e6, E 20e6     Q1 2019: D 8e6, B 30e6, E 4e6
 *   TTM = Q1 2020 + Jahr 2019 - Q1 2019:  D = 12+40-8 = 44e6;  B = 50+200-30 = 220e6;  E = 5+20-4 = 21e6
 *   Netto = 44e6 + 220e6 - 21e6 = 243e6;  Rendite = 243e6 / 1e10 = 0,0243.
 *   Gegenproben: nur das letzte Quartal waere (12+50-5)e6 / 1e10 = 0,0057; nur das letzte Geschaeftsjahr (40+200-20)e6 / 1e10 = 0,022. */
var YT = [rec('2020-02-20', '2019-12-31', '10-K', 4, w(40e6, 200e6, 20e6, { aktien: 100e6 }), 3571),
  rec('2020-05-05', '2020-03-31', '10-Q', 1, w(12e6, 50e6, 5e6, { aktien: 100e6 })),
  rec('2019-05-06', '2019-03-31', '10-Q', 1, w(8e6, 30e6, 4e6))];
var s1 = solo(YT);
ok('YT zulaessig', s1.x !== null);
nah('YT Dividende TTM 44e6', s1.x.dividende, 44e6, 1e-3);
nah('YT Rueckkauf TTM 220e6', s1.x.rueckkauf, 220e6, 1e-3);
nah('YT Emission TTM 21e6', s1.x.emission, 21e6, 1e-3);
nah('YT Ausschuettung = D + B = 264e6', s1.x.ausschuettung, 264e6, 1e-3);
nah('YT Marktkapitalisierung 1e10 (Kurs 100 x 100e6)', s1.x.marktkap, 1e10, 1e-3);
nah('YT Netto-Rendite 0,0243', s1.x.rendite, 0.0243, 1e-12);
ok('YT: nicht das letzte Quartal (0,0057) und nicht das Geschaeftsjahr (0,022)', Math.abs(s1.x.rendite - 0.0057) > 1e-3 && Math.abs(s1.x.rendite - 0.022) > 1e-4);
ok('YT: Anker Q1 2020, Dauer 1', s1.x.ankerPeriodenende === '2020-03-31' && s1.x.ankerDauer === 1);
ok('YT: Rendite ohne Emission waere groesser (Emission wird abgezogen)', (s1.x.ausschuettung / s1.x.marktkap) > s1.x.rendite);
/* Halbjahr (dauer 2), Stichtag 15.09.2020: H1 2020 (periodEnde 30.06.2020, eingereicht 05.08.2020) B 130e6; Jahr 2019 B 200e6; H1 2019 B 90e6
 * => TTM B = 130 + 200 - 90 = 240e6; Rendite 0,024. Jahresabstand zum Anker 182 Tage (= 2 x 91,25 +- 15), Vorjahr 366 Tage. */
var N2 = dt('2020-09-15');
var H2 = [rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, 200e6, null, { aktien: 100e6 }), 3571),
  rec('2020-08-05', '2020-06-30', '10-Q', 2, w(null, 130e6, null, { aktien: 100e6 })),
  rec('2019-08-06', '2019-06-30', '10-Q', 2, w(null, 90e6, null))];
var s2 = solo(H2, { nowMs: N2 }, { bis: N2 });
nah('Halbjahr: TTM Rueckkauf 240e6', s2.x.rueckkauf, 240e6, 1e-3);
nah('Halbjahr: Rendite 0,024', s2.x.rendite, 0.024, 1e-12);
/* Neun Monate (dauer 3), Stichtag 30.11.2020: 9M 2020 (periodEnde 30.09.2020) B 190e6; Jahr 2019 B 200e6; 9M 2019 B 150e6 => 190+200-150 = 240e6 */
var N3 = dt('2020-11-30');
var H3 = [rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, 200e6, null, { aktien: 100e6 }), 3571),
  rec('2020-11-05', '2020-09-30', '10-Q', 3, w(null, 190e6, null, { aktien: 100e6 })),
  rec('2019-11-06', '2019-09-30', '10-Q', 3, w(null, 150e6, null))];
var s3 = solo(H3, { nowMs: N3 }, { bis: N3 });
nah('Neun Monate: TTM Rueckkauf 240e6', s3.x.rueckkauf, 240e6, 1e-3);
/* 10-K als Anker (dauer 4): Stichtag 30.04.2020 nach der Jahresmeldung (20.02.), vor Q1 (05.05.): Anker = 10-K, Wert = Jahreswert, kein Vorjahr noetig */
var s4 = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, w(30e6, 250e6, 10e6, { aktien: 100e6 }), 3571)], { nowMs: dt('2020-04-30') }, { bis: dt('2020-04-30') });
nah('10-K-Anker: (30 + 250 - 10)e6 / 1e10 = 0,027', s4.x.rendite, 0.027, 1e-12);
ok('10-K-Anker: Dauer 4', s4.x.ankerDauer === 4 && s4.x.ankerPeriodenende === '2019-12-31');
/* 52/53-Wochen-Jahr: Q1 endet 02.04.2020, Q1 2019 am 30.03.2019 (369 Tage Abstand, innerhalb 365 +- 15); 10-K 28.12.2019 (96 Tage vor Anker, 91,25 +- 15) */
var W52 = [rec('2020-02-20', '2019-12-28', '10-K', 4, w(null, 200e6, null, { aktien: 100e6 }), 3571),
  rec('2020-05-05', '2020-04-02', '10-Q', 1, w(null, 50e6, null, { aktien: 100e6 })), rec('2019-05-06', '2019-03-30', '10-Q', 1, w(null, 30e6, null))];
nah('52/53-Wochen: Periodenenden innerhalb der Toleranz => TTM 220e6', solo(W52).x.rueckkauf, 220e6, 1e-3);
var W52b = [rec('2020-02-20', '2019-12-28', '10-K', 4, w(null, 200e6, null, { aktien: 100e6 }), 3571),
  rec('2020-05-05', '2020-04-02', '10-Q', 1, w(null, 50e6, null, { aktien: 100e6 })), rec('2019-05-06', '2019-02-01', '10-Q', 1, w(null, 30e6, null))];
ok('Vorjahres-Quartal weit ausserhalb der Toleranz => nicht berechenbar, Rueckfall auf 10-K (200e6)', solo(W52b).x.rueckkauf === 200e6 && solo(W52b).x.ankerDauer === 4);

/* ================= 3. Rueckfallkette der Tags ================= */
var kette1 = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, { NetCashProvidedByUsedInFinancingActivities: -1, PaymentsOfDividends: 2e8, PaymentsForRepurchaseOfEquity: 3e8, ProceedsFromIssuanceOrSaleOfEquity: 0.5e8, CommonStockSharesOutstanding: 100e6 }, 3571)]);
ok('Kette: PaymentsOfDividends, PaymentsForRepurchaseOfEquity, ProceedsFromIssuanceOrSaleOfEquity, CommonStockSharesOutstanding werden genommen',
  kette1.x && kette1.x.dividende === 2e8 && kette1.x.rueckkauf === 3e8 && kette1.x.emission === 0.5e8 && kette1.x.aktien === 100e6);
nah('Kette: Rendite (2 + 3 - 0,5)e8 / 1e10 = 0,045', kette1.x.rendite, 0.045, 1e-12);
ok('Kette: Tag-Namen im Ergebnis', kette1.x.tags.dividende === 'PaymentsOfDividends' && kette1.x.tags.rueckkauf === 'PaymentsForRepurchaseOfEquity' && kette1.x.tags.emission === 'ProceedsFromIssuanceOrSaleOfEquity');
var kette2 = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, { NetCashProvidedByUsedInFinancingActivities: -1, PaymentsOfDividendsCommonStock: 2e8, PaymentsOfDividends: 3e8, PaymentsOfOrdinaryDividends: 4e8, WeightedAverageNumberOfSharesOutstandingBasic: 100e6 }, 3571)]);
ok('Kette: der ERSTE Tag zaehlt, nicht die Summe (keine Doppelzaehlung: 2e8, nicht 9e8)', kette2.x.dividende === 2e8 && kette2.x.tags.dividende === 'PaymentsOfDividendsCommonStock');
ok('Aktienkette: nur gewichtete Aktienzahl da => sie wird genommen', kette2.x.aktien === 100e6);
var kette3 = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, { NetCashProvidedByUsedInFinancingActivities: -1, PaymentsOfDividends: 40e6, EntityCommonStockSharesOutstanding: 100e6 }, 3571),
  rec('2020-05-05', '2020-03-31', '10-Q', 1, { NetCashProvidedByUsedInFinancingActivities: -1, PaymentsOfDividendsCommonStock: 99e6, PaymentsOfDividends: 12e6, EntityCommonStockSharesOutstanding: 100e6 }),
  rec('2019-05-06', '2019-03-31', '10-Q', 1, { NetCashProvidedByUsedInFinancingActivities: -1, PaymentsOfDividendsCommonStock: 98e6, PaymentsOfDividends: 8e6 })]);
/* Der erste Tag (...CommonStock) steht im Anker, fehlt aber im 10-K => TTM nicht berechenbar => naechster Tag: 12 + 40 - 8 = 44e6 */
ok('Kette: erster Tag nicht berechenbar => naechster Tag der Kette (PaymentsOfDividends, 44e6)', kette3.x.dividende === 44e6 && kette3.x.tags.dividende === 'PaymentsOfDividends');
var nullz = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, null, null, { aktien: 100e6 }), 3571)]);
ok('kein Fluss-Tag ausgewiesen => 0 (Nicht-Zahler), aber zulaessig; Rendite 0', nullz.x && nullz.x.rendite === 0 && nullz.x.tags.dividende === null && nullz.x.tags.rueckkauf === null);
ok('Rendite 0 ist nie Ziel', nullz.ziel.indexOf('X') < 0 && nullz.ziel.indexOf('PP') >= 0);
ok('Aktienzahl: Deckblatt (dei) vor Bilanz-Tag, wenn beide da', solo([rec('2020-02-20', '2019-12-31', '10-K', 4, { NetCashProvidedByUsedInFinancingActivities: -1, EntityCommonStockSharesOutstanding: 100e6, CommonStockSharesOutstanding: 50e6 }, 3571)]).x.aktien === 100e6);

/* ================= 4. Vorzeichen ================= */
/* Negative Dividendenzahlung (-5e8, Vorzeichenfehler) => 0; mit Betrag waere Rendite 0,05 und Platz 1 */
var neg = solo(std(-5e8, 0, 0));
ok('negative Zahlung => 0 gesetzt (nicht Betrag)', neg.x.dividende === 0 && neg.x.rendite === 0);
ok('Vorzeichenkorrektur gezaehlt', neg.korb.vorzeichenKorrigiert === 1);
ok('negative Zahlung macht nicht zum Ziel', neg.ziel.indexOf('X') < 0);
/* TTM rechnerisch negativ: Q1 2020 B 0, Q1 2019 B 100e6, 10-K B 50e6 => 0 + 50 - 100 = -50e6 => 0 */
var neg2 = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, 50e6, null, { aktien: 100e6 }), 3571), rec('2020-05-05', '2020-03-31', '10-Q', 1, w(null, 0, null, { aktien: 100e6 })), rec('2019-05-06', '2019-03-31', '10-Q', 1, w(null, 100e6, null))]);
ok('negative Vier-Quartale-Summe => 0', neg2.x.rueckkauf === 0 && neg2.korb.vorzeichenKorrigiert === 1);
/* Emission dominiert: E 2e8, sonst nichts => Rendite -0,02, zulaessig, nie Ziel */
var emi = solo(std(0, 0, 2e8));
nah('Netto-Emission: Rendite -0,02', emi.x.rendite, -0.02, 1e-12);
ok('Netto-Emission ist nie Ziel', emi.ziel.indexOf('X') < 0);

/* ================= 5. Anker, Rueckfall, Luecken in den Bilanzdaten ================= */
/* Q1 2020 da, Q1 2019 fehlt => Anker 1 nicht berechenbar => Anker 2 (10-K 2019, 182 Tage alt): B 3e8 => 0,03 */
var gap = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, 3e8, null, { aktien: 100e6 }), 3571), rec('2020-05-05', '2020-03-31', '10-Q', 1, w(null, 0.5e8, null, { aktien: 100e6 }))]);
nah('Luecke im Vorjahresquartal => Rueckfall auf den 10-K: Rendite 0,03', gap.x.rendite, 0.03, 1e-12);
ok('Rueckfall: Anker 31.12.2019, Dauer 4', gap.x.ankerPeriodenende === '2019-12-31' && gap.x.ankerDauer === 4);
var onlyq = solo([rec('2020-05-05', '2020-03-31', '10-Q', 1, w(null, 0.5e8, null, { aktien: 100e6 }), 3571)]);
ok('nur ein Quartal, kein Jahr, kein Vorjahr => nicht zulaessig mit Grund', onlyq.x === null && enthaelt(onlyq.grund, 'Zahlungsstroeme nicht berechenbar'));
/* 10-Q ohne dauer: nicht geraten. Mit Raten (dauer 1): 90 + 200 - 30 = 260e6; ohne: Anker 10-K => 200e6 */
var dl = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, 200e6, null, { aktien: 100e6 }), 3571), rec('2020-05-05', '2020-03-31', '10-Q', null, w(null, 90e6, null, { aktien: 100e6 })), rec('2019-05-06', '2019-03-31', '10-Q', null, w(null, 30e6, null))]);
ok('10-Q ohne dauer wird fuer Fluesse nicht benutzt (200e6, nicht 260e6)', dl.x.rueckkauf === 200e6 && dl.x.ankerDauer === 4);
/* veraltet: einzige Jahresmeldung 2018 (546 Tage alt > 460) */
var alt = [rec('2019-02-20', '2018-12-31', '10-K', 4, w(null, 2e8, null, { aktien: 100e6 }), 3571)];
ok('Bilanz aelter als 460 Tage => nicht zulaessig mit Grund', solo(alt).x === null && enthaelt(solo(alt).grund, 'Bilanz veraltet'));
ok('Gegenprobe maxBilanzAlterTage 1000 => zulaessig', solo(alt, { maxBilanzAlterTage: 1000 }).x !== null);
/* ohne Pflicht-Tag */
var nf = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, 2e8, null, { fin: null, aktien: 100e6 }), 3571)]);
ok('ohne Cashflow-Pflicht-Tag => nicht zulaessig (fehlend heisst nicht 0)', nf.x === null && enthaelt(nf.grund, 'Cashflow-Ausweis fehlt'));
/* Formen, die nicht zaehlen */
ok('Form 8-K wird ignoriert => keine Bilanzdaten', solo([rec('2020-02-20', '2019-12-31', '8-K', 4, w(null, 2e8, null, { aktien: 100e6 }), 3571)]).x === null);
ok('ungueltiges Datum wird ignoriert => keine Bilanzdaten', solo([rec('2020-13-45', '2019-12-31', '10-K', 4, w(null, 2e8, null, { aktien: 100e6 }), 3571)]).x === null);
/* Aktienzahl */
var ns = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, { NetCashProvidedByUsedInFinancingActivities: -1, PaymentsForRepurchaseOfCommonStock: 2e8 }, 3571)]);
ok('Aktienzahl fehlt => nicht zulaessig', ns.x === null && enthaelt(ns.grund, 'Aktienzahl fehlt'));
ok('Aktienzahl 0 oder negativ zaehlt als fehlend', solo(std(0, 2e8, 0, { aktien: 0 })).x === null && solo(std(0, 2e8, 0, { aktien: -5 })).x === null);
/* juengste Aktienzahl: 10-K 100e6, Q1 80e6 => 80e6 => Marktkap 8e9; Rendite 2e8 / 8e9 = 0,025 */
var fr = solo([rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, 2e8, null, { aktien: 100e6 }), 3571), rec('2020-05-05', '2020-03-31', '10-Q', 1, w(null, 0.5e8, null, { aktien: 80e6 })), rec('2019-05-06', '2019-03-31', '10-Q', 1, w(null, 0.5e8, null))]);
ok('juengste sichtbare Aktienzahl (80e6) gilt', fr.x.aktien === 80e6);
nah('Rendite mit juengster Aktienzahl: 2e8 / 8e9 = 0,025', fr.x.rendite, 0.025, 1e-12);

/* ================= 6. Kein Blick voraus (Bilanz) mit Gegenproben =================
 * Q1 2020: B 1e8, Q1 2019: B 0,25e8, 10-K B 3e8. Mit Q1 sichtbar: 1 + 3 - 0,25 = 3,75e8 => 0,0375. Ohne Q1 (nur 10-K): 0,03. */
function mitQ1(filed) { return [rec('2020-02-20', '2019-12-31', '10-K', 4, w(null, 3e8, null, { aktien: 100e6 }), 3571), rec(filed, '2020-03-31', '10-Q', 1, w(null, 1e8, null, { aktien: 100e6 })), rec('2019-05-06', '2019-03-31', '10-Q', 1, w(null, 0.25e8, null))]; }
nah('eingereicht am Vortag des Stichtags (29.06.) => sichtbar: 0,0375', solo(mitQ1('2020-06-29')).x.rendite, 0.0375, 1e-12);
nah('eingereicht AM Stichtag (30.06.) => Karenz, NICHT sichtbar: 0,03', solo(mitQ1('2020-06-30')).x.rendite, 0.03, 1e-12);
nah('Gegenprobe karenzTage 0: am Stichtag eingereicht => sichtbar 0,0375', solo(mitQ1('2020-06-30'), { karenzTage: 0 }).x.rendite, 0.0375, 1e-12);
nah('eingereicht nach dem Stichtag (05.07.) => nicht sichtbar: 0,03', solo(mitQ1('2020-07-05')).x.rendite, 0.03, 1e-12);
var N10 = dt('2020-07-10');
nah('Gegenprobe: am 10.07. ist dieselbe Meldung sichtbar: 0,0375', solo(mitQ1('2020-07-05'), { nowMs: N10 }, { bis: N10 }).x.rendite, 0.0375, 1e-12);
ok('Meldung nach dem Stichtag kommt auch nicht als Aktienzahl durch', solo(mitQ1('2020-07-05')).x.aktien === 100e6);
/* nur eine Meldung, die erst nach dem Stichtag kommt => keine Bilanzdaten */
var spaet = solo([rec('2020-07-05', '2019-12-31', '10-K', 4, w(null, 2e8, null, { aktien: 100e6 }), 3571)]);
ok('einzige Meldung nach dem Stichtag => nicht zulaessig (keine Bilanzdaten)', spaet.x === null && enthaelt(spaet.grund, 'keine Bilanzdaten'));
/* Korrekturen: 10-K/A mit anderem B (6e8), eingereicht 01.04.2020 => gilt (juengste Einreichung <= Stichtag): TTM = Jahreswert 6e8 => 0,06 (Q1 gleich) */
function mitKorr(filedA, werteA) {
  var r = std(0, 3e8, 0);
  r.push(rec(filedA, '2019-12-31', '10-K/A', 4, werteA, 3571));
  return r;
}
nah('Korrektur 10-K/A vor dem Stichtag ersetzt das Original: 0,06', solo(mitKorr('2020-04-01', w(0, 6e8, 0, { aktien: 100e6 }))).x.rendite, 0.06, 1e-12);
nah('Korrektur nach dem Stichtag (01.07.) zaehlt nicht: 0,03', solo(mitKorr('2020-07-01', w(0, 6e8, 0, { aktien: 100e6 }))).x.rendite, 0.03, 1e-12);
nah('Korrektur ohne den Tag (nur andere Tags) ersetzt nichts: 0,03', solo(mitKorr('2020-04-01', { Assets: 1 })).x.rendite, 0.03, 1e-12);
/* Kursreihe: Zeilen nach dem Stichtag zaehlen nicht (Kurs 1000 am 01.07.) */
var vor = solo(std(0, 3e8, 0), {}, { extra: [[NOW + TAGMS, 1000, 2e6]] });
nah('Zeile nach dem Stichtag ignoriert: Marktkap 1e10 (Kurs 100)', vor.x.marktkap, 1e10, 1e-3);
nah('Gegenprobe: ohne Filter waere der Kurs 1000 => Marktkap 1e11 (Rechnung)', 1000 * 100e6, 1e11, 1e-3);

/* ================= 7. Marktkapitalisierung: Tag und Rueckfall ================= */
var m3 = solo(std(0, 3e8, 0), {}, { bis: NOW - 3 * TAGMS, letzter: 120 });
nah('Rueckfall: letzte Zeile 3 Tage vor dem Stichtag (Kurs 120) => Marktkap 1,2e10', m3.x.marktkap, 1.2e10, 1e-3);
nah('Rendite dann 3e8 / 1,2e10 = 0,025', m3.x.rendite, 0.025, 1e-12);
ok('letzte Zeile genau 7 Tage alt => noch zulaessig', solo(std(0, 3e8, 0), {}, { bis: NOW - 7 * TAGMS }).x !== null);
var m8 = solo(std(0, 3e8, 0), {}, { bis: NOW - 8 * TAGMS });
ok('letzte Zeile 8 Tage alt => veraltet, raus', m8.x === null && enthaelt(m8.grund, 'Kurse veraltet (8 Tage alt)'));
var m0 = solo(std(0, 3e8, 0), {}, { letzter: 0 });
ok('Kurs 0 am Stichtag => raus mit Grund', m0.x === null && enthaelt(m0.grund, 'Kurs <= 0'));
ok('Kurs negativ => raus mit Grund', solo(std(0, 3e8, 0), {}, { letzter: -4 }).x === null && enthaelt(solo(std(0, 3e8, 0), {}, { letzter: -4 }).grund, 'Kurs <= 0'));
var kurzr = solo(std(0, 3e8, 0), {}, { n: 19 });
ok('19 Zeilen (< 20) => zu kurze Reihe', kurzr.x === null && enthaelt(kurzr.grund, 'zu kurze Kursreihe (19 von 20'));
ok('Gegenprobe minZeilen 10 => zulaessig', solo(std(0, 3e8, 0), { minZeilen: 10 }, { n: 19 }).x !== null);
ok('Luecken in der Reihe (5 Tage fehlen mitten drin, 20 Zeilen bleiben) => zulaessig', solo(std(0, 3e8, 0), {}, { luecke: [5, 6, 7, 8, 9] }).x !== null);
ok('Luecken, so dass 19 Zeilen bleiben => zu kurz', solo(std(0, 3e8, 0), {}, { luecke: [5, 6, 7, 8, 9, 10] }).x === null);
var ill = solo(std(0, 3e8, 0), {}, { stueck: 1e5 });
ok('Median-Tagesumsatz 10 Mio $ => raus (Umsatzregel)', ill.x === null && enthaelt(ill.grund, 'Median-Tagesumsatz'));
ok('Gegenprobe umsatzMin 0 => zulaessig', solo(std(0, 3e8, 0), { umsatzMin: 0 }, { stueck: 1e5 }).x !== null);
ok('Umsatz genau 100 Mio $ => zulaessig (>=)', solo(std(0, 3e8, 0), {}, { stueck: 1e6 }).x !== null);
ok('Umsatz knapp darunter => raus', solo(std(0, 3e8, 0), {}, { stueck: 0.99e6 }).x === null);

/* ================= 8. Finanzwerte, Einheiten ================= */
[[6021, false], [6000, false], [6999, false], [5999, true], [7000, true], [null, true]].forEach(function (p) {
  var s = solo(std(0, 3e8, 0, { sic: p[0] }));
  ok('SIC ' + p[0] + (p[1] ? ' zulaessig' : ' ausgeschlossen (Finanzwert)'), p[1] ? s.x !== null : (s.x === null && enthaelt(s.grund, 'Finanzwert (SIC ' + p[0] + ')')));
});
ok('Gegenprobe sicAusschluss null => Finanzwert zulaessig', solo(std(0, 3e8, 0, { sic: 6021 }), { sicAusschluss: null }).x !== null);
ok('Finanzwerte gezaehlt', solo(std(0, 3e8, 0, { sic: 6798 })).korb.finanzwerte === 1);
var tiny = solo(std(0, 1e6, 0, { aktien: 1e5 }));
ok('Marktkap 1e7 (Aktienzahl in Tausend?) => Einheitenverdacht', tiny.x === null && enthaelt(tiny.grund, 'Einheitenverdacht'));
ok('Gegenprobe minMarktkap 0 => zulaessig', solo(std(0, 1e6, 0, { aktien: 1e5 }), { minMarktkap: 0 }).x !== null);
var big = solo(std(0, 1.5e10, 0));
ok('Netto-Rendite 150 % => Einheiten-/Vorzeichenverdacht, raus', big.x === null && enthaelt(big.grund, 'Netto-Rendite 150 %'));
ok('Gegenprobe maxRendite unendlich => zulaessig', solo(std(0, 1.5e10, 0), { maxRendite: Infinity }).x !== null);
ok('genau 100 % ist noch zulaessig', solo(std(0, 1e10, 0)).x !== null);
ok('Emission 150 % (Rendite -1,5) => ebenfalls raus', solo(std(0, 0, 1.5e10)).x === null);

/* ================= 9. Universum, Rang, Ziel ================= */
/* UNI: 12 Firmen Y01..Y12 mit Rueckkauf (13-i) x 1e8 => Rendite (13-i) %: Y01 12 %, ..., Y12 1 %; M1: D 1e8, B 2e8, E 0,5e8 => 2,5e8/1e10 = 2,5 %;
 * Z1, Z2: keine Zahlungen (0); N1: Emission 2e8 => -2 %. Zulaessig 16 => Ziel = min(30, max(5, round(1,6) = 2)) = 5 => Y01..Y05. */
function uni(nowMs) {
  var roh = {}, fund = {}, i, name;
  for (i = 1; i <= 12; i++) { name = 'Y' + (i < 10 ? '0' : '') + i; roh[name] = reihe({ bis: nowMs }); fund[name] = std(0, (13 - i) * 1e8, 0); }
  roh.M1 = reihe({ bis: nowMs }); fund.M1 = std(1e8, 2e8, 0.5e8);
  roh.Z1 = reihe({ bis: nowMs }); fund.Z1 = std(null, null, null);
  roh.Z2 = reihe({ bis: nowMs }); fund.Z2 = std(null, null, null);
  roh.N1 = reihe({ bis: nowMs }); fund.N1 = std(0, 0, 2e8);
  roh.FIN = reihe({ bis: nowMs }); fund.FIN = std(0, 5e8, 0, { sic: 6021 });
  roh.ILL = reihe({ bis: nowMs, stueck: 1e5 }); fund.ILL = std(0, 5e8, 0);
  roh.NODATA = reihe({ bis: nowMs });
  roh.SHORT = reihe({ bis: nowMs, n: 10 }); fund.SHORT = std(0, 5e8, 0);
  roh.STALE = reihe({ bis: nowMs - 10 * TAGMS }); fund.STALE = std(0, 5e8, 0);
  roh.NEGK = reihe({ bis: nowMs, letzter: -1 }); fund.NEGK = std(0, 5e8, 0);
  roh.NOSH = reihe({ bis: nowMs }); fund.NOSH = std(0, 5e8, 0, { aktien: null });
  roh.TINY = reihe({ bis: nowMs }); fund.TINY = std(0, 1e6, 0, { aktien: 1e5 });
  roh.BIG = reihe({ bis: nowMs }); fund.BIG = std(0, 1.5e10, 0);
  roh.LATE = reihe({ bis: nowMs }); fund.LATE = [rec('2020-12-31', '2019-12-31', '10-K', 4, w(0, 5e8, 0, { aktien: 100e6 }), 3571)];
  roh.SPY = reihe({ bis: nowMs });                                  /* Referenz ohne Bilanzdaten */
  fund.GHOST = std(0, 9e8, 0);                                      /* Bilanzdaten ohne Kursreihe */
  return { roh: roh, fund: fund };
}
var U = uni(NOW), R = zielfunktion(U.roh, { nowMs: NOW, fundamental: U.fund, minWerte: 5 });
ok('Ziel = Y01..Y05 (die fuenf hoechsten Netto-Renditen)', gleich(R.ziel, ['Y01', 'Y02', 'Y03', 'Y04', 'Y05']));
ok('Rangfolge absteigend: Y01..Y10, M1, Y11, Y12, Z1, Z2, N1', gleich(R.rangfolge.map(function (p) { return p.sym; }), ['Y01', 'Y02', 'Y03', 'Y04', 'Y05', 'Y06', 'Y07', 'Y08', 'Y09', 'Y10', 'M1', 'Y11', 'Y12', 'Z1', 'Z2', 'N1']));
nah('Y01 = 0,12', R.rangfolge[0].rendite, 0.12, 1e-12);
nah('Y10 = 0,03', R.rangfolge[9].rendite, 0.03, 1e-12);
nah('M1 = (1 + 2 - 0,5)e8 / 1e10 = 0,025 (Dividende + Rueckkauf - Emission)', R.rangfolge[10].rendite, 0.025, 1e-12);
ok('Nullzahler und Netto-Emittent stehen unten, nicht im Ziel', R.ziel.indexOf('Z1') < 0 && R.ziel.indexOf('N1') < 0 && R.rangfolge[15].sym === 'N1');
ok('Gleichstand Z1/Z2 (beide 0): Kuerzel aufsteigend', R.rangfolge[13].sym === 'Z1' && R.rangfolge[14].sym === 'Z2');
ok('zulaessig 16, geprueft 27 (alle Schluessel von roh)', R.korb.zulaessig === 16 && R.korb.geprueft === Object.keys(U.roh).length && R.korb.geprueft === 27);
ok('zulaessig + uebersprungen = geprueft', R.korb.zulaessig + R.uebersprungen.length === R.korb.geprueft && R.verworfen.length === R.uebersprungen.length);
ok('nicht zuWenig', !R.zuWenig);
var gruende = { FIN: 'Finanzwert', ILL: 'Median-Tagesumsatz', NODATA: 'keine Bilanzdaten', SHORT: 'zu kurze Kursreihe', STALE: 'Kurse veraltet', NEGK: 'Kurs <= 0', NOSH: 'Aktienzahl fehlt',
  TINY: 'Einheitenverdacht', BIG: 'Netto-Rendite', LATE: 'keine Bilanzdaten', SPY: 'keine Bilanzdaten' };
Object.keys(gruende).forEach(function (s) {
  var v = R.verworfen.filter(function (x) { return x.sym === s; })[0];
  ok(s + ' raus mit Grund "' + gruende[s] + '"', !!v && enthaelt(v.grund, gruende[s]) && R.rangfolge.every(function (p) { return p.sym !== s; }) && R.ziel.indexOf(s) < 0);
});
ok('Referenzreihe SPY nie im Ziel; GHOST (nur in fundamental) taucht nirgends auf', R.ziel.indexOf('SPY') < 0 && R.rangfolge.concat(R.verworfen).every(function (p) { return p.sym !== 'GHOST'; }));
ok('Ziel nur aus zulaessigen Werten', R.ziel.every(function (s) { return R.rangfolge.some(function (p) { return p.sym === s; }); }));
ok('staerke = rendite, umsatz gesetzt (korb.js-Form)', R.rangfolge.every(function (p) { return p.staerke === p.rendite && p.umsatz >= 1e8; }));
ok('Korb-Zaehler: ohneBilanz 3 (NODATA, LATE, SPY), finanzwerte 1, ohneAktien 1, einheitenverdacht 2', R.korb.ohneBilanz === 3 && R.korb.finanzwerte === 1 && R.korb.ohneAktien === 1 && R.korb.einheitenverdacht === 2);
ok('korb.positiv = 13', R.korb.positiv === 13);
/* Eingabereihenfolge egal */
var rev = {}; Object.keys(U.roh).reverse().forEach(function (k) { rev[k] = U.roh[k]; });
ok('Reihenfolge der Schluessel in roh aendert das Ergebnis nicht', gleich(zielfunktion(rev, { nowMs: NOW, fundamental: U.fund, minWerte: 5 }).ziel, R.ziel));
/* ohne fundamental */
var of = zielfunktion(U.roh, { nowMs: NOW, minWerte: 5 });
ok('ohne opts.fundamental: nichts zulaessig => zuWenig, ziel leer', of.zuWenig === true && of.ziel.length === 0 && of.korb.zulaessig === 0);
/* zuWenig bei kleinem Universum */
var zw = zielfunktion(U.roh, { nowMs: NOW, fundamental: U.fund, minWerte: 17 });
ok('16 zulaessig, minWerte 17 => zuWenig, ziel und rangfolge leer', zw.zuWenig === true && zw.ziel.length === 0 && zw.rangfolge.length === 0);
ok('zuWenig traegt trotzdem korb und verworfen', zw.korb.zulaessig === 16 && zw.verworfen.length === 11);
ok('minWerte 16 => noch genug', !zielfunktion(U.roh, { nowMs: NOW, fundamental: U.fund, minWerte: 16 }).zuWenig);
/* weniger als 5 positive */
var kleinRoh = {}, kleinF = {};
['A1', 'A2', 'A3'].forEach(function (s, i) { kleinRoh[s] = reihe(); kleinF[s] = std(0, (3 - i) * 1e8, 0); });
['B1', 'B2', 'B3', 'B4', 'B5'].forEach(function (s) { kleinRoh[s] = reihe(); kleinF[s] = std(null, null, null); });
var kl = zielfunktion(kleinRoh, { nowMs: NOW, fundamental: kleinF, minWerte: 5 });
ok('8 zulaessig, aber nur 3 mit Rendite > 0 (< minZiel 5) => zuWenig, kein Auffuellen mit Nullzahlern', kl.zuWenig === true && kl.ziel.length === 0 && kl.korb.zulaessig === 8);
/* Gleichstand an der Ziel-Grenze: 7 Positive: 7,6,5,4 % und drei mit 3 % (TC, TB, TA, in dieser Eingabereihenfolge); Ziel 5 => vierter...fuenfter Platz: TA */
var tr = {}, tf = {};
[['P7', 7], ['P6', 6], ['P5', 5], ['P4', 4], ['TC', 3], ['TB', 3], ['TA', 3]].forEach(function (p) { tr[p[0]] = reihe(); tf[p[0]] = std(0, p[1] * 1e8, 0); });
var tz = zielfunktion(tr, { nowMs: NOW, fundamental: tf, minWerte: 5 });
ok('Gleichstand an der Grenze: Kuerzel aufsteigend entscheidet (TA kommt, TB und TC nicht), nicht die Eingabereihenfolge', gleich(tz.ziel, ['P7', 'P6', 'P5', 'P4', 'TA']));
ok('Rangfolge der Gleichstaende: TA, TB, TC', gleich(tz.rangfolge.slice(4).map(function (p) { return p.sym; }), ['TA', 'TB', 'TC']));

/* ================= 10. Standardschwelle 100 und Obergrenze 30 ================= */
function viele(n) {
  var roh = {}, fund = {};
  for (var i = 0; i < n; i++) { var s = 'V' + ('000' + i).slice(-3); roh[s] = reihe(); fund[s] = kurz((i + 1) * 1e6); }   /* Rendite (i+1) x 1e-4 */
  return { roh: roh, fund: fund };
}
var v99 = viele(99), r99 = zielfunktion(v99.roh, { nowMs: NOW, fundamental: v99.fund });
ok('99 zulaessige (Standard-minWerte 100) => zuWenig, nicht handeln', r99.zuWenig === true && r99.ziel.length === 0 && r99.korb.zulaessig === 99);
var v100 = viele(100), r100 = zielfunktion(v100.roh, { nowMs: NOW, fundamental: v100.fund });
ok('100 zulaessige => nicht zuWenig, Zielzahl 10 (Dezil)', !r100.zuWenig && r100.ziel.length === 10);
ok('Ziel sind die 10 hoechsten (V099..V090)', r100.ziel[0] === 'V099' && r100.ziel[9] === 'V090');
var v294 = viele(294), r294 = zielfunktion(v294.roh, { nowMs: NOW, fundamental: v294.fund });
ok('294 zulaessige => Zielzahl 29 (round(29,4))', r294.ziel.length === 29);
var v295 = viele(295), r295 = zielfunktion(v295.roh, { nowMs: NOW, fundamental: v295.fund });
ok('295 zulaessige => Zielzahl 30 (round(29,5))', r295.ziel.length === 30);
var v400 = viele(400), r400 = zielfunktion(v400.roh, { nowMs: NOW, fundamental: v400.fund });
ok('400 zulaessige => hoechstens 30 Positionen (Obergrenze, nicht 40)', r400.ziel.length === 30 && r400.korb.zulaessig === 400);
ok('Gegenprobe maxZiel 50 => 40 (das Dezil)', zielfunktion(v400.roh, { nowMs: NOW, fundamental: v400.fund, maxZiel: 50 }).ziel.length === 40);
ok('Ziel = die 30 hoechsten Renditen, absteigend', r400.ziel[0] === 'V399' && r400.ziel[29] === 'V370');

/* ================= 11. Placebo ================= */
var P = placeboZiel(U.roh, { nowMs: NOW, fundamental: U.fund, minWerte: 5 });
var pool = R.rangfolge.map(function (p) { return p.sym; });
ok('Placebo: gleiche Rueckgabeform (ziel, rangfolge, korb, zuWenig nicht gesetzt)', Array.isArray(P.ziel) && Array.isArray(P.rangfolge) && P.korb.zulaessig === 16 && !P.zuWenig && P.placebo === true);
ok('Placebo: dieselbe Zielzahl wie die Regel (5)', P.ziel.length === R.ziel.length && P.ziel.length === 5);
ok('Placebo: nur Werte aus demselben zulaessigen Universum, keine Doppelten', P.ziel.every(function (s) { return pool.indexOf(s) >= 0; }) && new Set(P.ziel).size === P.ziel.length);
ok('Placebo: keine unzulaessigen Werte (FIN, ILL, BIG, SPY, ...)', P.ziel.every(function (s) { return ['FIN', 'ILL', 'NODATA', 'SHORT', 'STALE', 'NEGK', 'NOSH', 'TINY', 'BIG', 'LATE', 'SPY', 'GHOST'].indexOf(s) < 0; }));
ok('Placebo: deterministisch (zweimal gleich)', gleich(placeboZiel(U.roh, { nowMs: NOW, fundamental: U.fund, minWerte: 5 }).ziel, P.ziel));
ok('Placebo: unabhaengig von der Eingabereihenfolge in roh', gleich(placeboZiel(rev, { nowMs: NOW, fundamental: U.fund, minWerte: 5 }).ziel, P.ziel));
ok('Placebo: nicht die Regel-Auswahl (Auswahl hat mit der Rendite nichts zu tun)', !gleich(P.ziel.slice().sort(), R.ziel.slice().sort()));
var union = {}, verschieden = false, ersterZiel = null;
for (var dd = 0; dd < 12; dd++) {
  var nd = NOW + dd * TAGMS, Ud = uni(nd), Pd = placeboZiel(Ud.roh, { nowMs: nd, fundamental: Ud.fund, minWerte: 5 });
  Pd.ziel.forEach(function (s) { union[s] = true; });
  if (ersterZiel === null) ersterZiel = Pd.ziel; else if (!gleich(Pd.ziel, ersterZiel)) verschieden = true;
  ok('Placebo Tag ' + dd + ': Groesse 5, nur zulaessige', Pd.ziel.length === 5 && Pd.ziel.every(function (s) { return pool.indexOf(s) >= 0; }));
}
ok('Placebo: der Seed haengt am Stichtag (andere Tage, andere Ziehung)', verschieden);
ok('Placebo zieht aus ALLEN zulaessigen (auch Nullzahler/Emittenten kommen vor, ueber 12 Tage)', !!(union.Z1 || union.Z2 || union.N1));
ok('Placebo: ueber 12 Tage kommen mehr als die 5 Regel-Titel vor (echte Streuung)', Object.keys(union).length > 8);
ok('Placebo: anderes Seed-Wort, andere Ziehung', !gleich(placeboZiel(U.roh, { nowMs: NOW, fundamental: U.fund, minWerte: 5, placeboWort: 'anderes-wort' }).ziel, P.ziel));
ok('Seed = FNV-1a(Wort|Stichtag): zwei Stichtage, zwei Seeds; gleicher Stichtag, gleicher Seed', Z.samen(NOW, 'w') !== Z.samen(NOW + TAGMS, 'w') && Z.samen(NOW, 'w') === Z.samen(NOW + 3600000, 'w') && P.seed === Z.samen(NOW, Z.KONFIG.placeboWort));
ok('FNV-1a 32 Bit: Testvektor "a" = 0xe40c292c, "" = 0x811c9dc5', Z.hash32('a') === 0xe40c292c && Z.hash32('') === 0x811c9dc5);
ok('mulberry32: eingefrorener Wert fuer Seed hash32("x") = 0,4801359330303967 (einmal berechnet, jetzt Festwert)', Z.mulberry32(Z.hash32('x'))() === 0.4801359330303967);
var zr = Z.mulberry32(12345), zs = []; for (var q = 0; q < 1000; q++) zs.push(zr());
ok('mulberry32: 1000 Zahlen in [0,1)', zs.every(function (x) { return x >= 0 && x < 1; }));
ok('Placebo bei zuWenig: ebenfalls zuWenig, leer', placeboZiel(U.roh, { nowMs: NOW, fundamental: U.fund, minWerte: 17 }).zuWenig === true && placeboZiel(U.roh, { nowMs: NOW, fundamental: U.fund, minWerte: 17 }).ziel.length === 0);
ok('Placebo bei < 5 positiven: ebenfalls zuWenig (gleiche Zielzahl-Regel)', placeboZiel(kleinRoh, { nowMs: NOW, fundamental: kleinF, minWerte: 5 }).zuWenig === true);
var P400 = placeboZiel(v400.roh, { nowMs: NOW, fundamental: v400.fund });
ok('Placebo im grossen Universum: genau 30 (Obergrenze), alle zulaessig, keine Doppelten', P400.ziel.length === 30 && new Set(P400.ziel).size === 30 && P400.ziel.every(function (s) { return v400.roh[s]; }));
ok('Placebo im grossen Universum: nicht die 30 mit der hoechsten Rendite', P400.ziel.indexOf('V399') < 0 || P400.ziel.indexOf('V398') < 0 || P400.ziel.indexOf('V397') < 0);

/* ================= Ende ================= */
console.log(gut + ' Pruefungen gruen, ' + schlecht + ' rot');
if (schlecht) process.exit(1);
