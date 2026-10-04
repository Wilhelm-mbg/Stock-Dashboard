'use strict';
/* Pruefungen zur Faktor-ETF-Realitaetsprobe (Kennung faktor-etf-realitaet-2026-10/v1).
 *   node studien/faktor-etf-realitaet-2026-10/test.js [--roh <ordner mit Rohdaten>]
 * Teil I   Kunstreihen mit von Hand gerechneten Sollwerten (kein Netz, keine Rohdaten noetig).
 * Teil II  Klinken an der gesiegelten Fondsliste (fonds.json) und am Ordner (keine Rohdaten im Repo).
 * Teil III (nur mit --roh) echte Reihen: Gegenproben mit Zahlen, die VOR dieser Studie feststanden.
 * Teil IV  (sobald ergebnis.json existiert) Ergebnis in sich stimmig: Urteil folgt aus den Zahlen,
 *          ERGEBNIS.md-Tabelle = ergebnis.json. */
var fs = require('fs');
var path = require('path');
var R = require('./rechnen.js');
var ORDNER = __dirname;

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 1e-9 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function wirft(name, f) { var w = false; try { f(); } catch (e) { w = true; } ok(name, w); }
var argRoh = process.argv.indexOf('--roh') > 0 ? process.argv[process.argv.indexOf('--roh') + 1] : null;

/* ---------- Kunstreihen ---------- */
function werktage(von, bis) {
  var out = []; var t = Date.parse(von + 'T00:00:00Z'); var e = Date.parse(bis + 'T00:00:00Z');
  for (; t <= e; t += 86400000) { var w = new Date(t).getUTCDay(); if (w !== 0 && w !== 6) out.push(new Date(t).toISOString().slice(0, 10)); }
  return out;
}
function sek(d, uhr) { return Date.parse(d + 'T' + (uhr || '14:30:00') + 'Z') / 1000; }
/* baut eine Yahoo-Antwort; schluss(i, d) liefert den Schluss, div: {datum: betrag} */
function kunstYahoo(tage, schluss, div, extra) {
  var ts = [], c = [], adj = [];
  tage.forEach(function (d, i) { ts.push(sek(d)); c.push(schluss(i, d)); });
  /* adjclose nach Yahoo-Art: Faktor 1 - D/C(t-1) fuer alle Tage vor dem Ex-Tag */
  var f = c.map(function () { return 1; });
  for (var i = 1; i < tage.length; i++) if (div && div[tage[i]]) { var k = 1 - div[tage[i]] / c[i - 1]; for (var j = 0; j < i; j++) f[j] *= k; }
  for (i = 0; i < c.length; i++) adj.push(c[i] == null ? null : c[i] * f[i]);
  var ev = { dividends: {} };
  Object.keys(div || {}).forEach(function (d) { ev.dividends[sek(d)] = { amount: div[d], date: sek(d) }; });
  if (extra && extra.cg) { ev.capitalGains = {}; Object.keys(extra.cg).forEach(function (d) { ev.capitalGains[sek(d)] = { amount: extra.cg[d], date: sek(d) }; }); }
  return { chart: { result: [{ meta: { symbol: 'KUNST', currency: (extra && extra.waehrung) || 'USD', exchangeName: 'PCX', exchangeTimezoneName: (extra && extra.tz) || 'America/New_York' },
    timestamp: ts, events: ev, indicators: { quote: [{ close: c }], adjclose: [{ adjclose: adj }] } }], error: null } };
}

/* ===== Teil I ===== */

/* 1. Datum in Boersenzeit */
ok('NY: 15.09.2021 13:30 UTC -> 2021-09-15', R.lokalesDatum(sek('2021-09-15', '13:30:00'), 'America/New_York') === '2021-09-15');
ok('NY: 03.01.2017 14:30 UTC -> 2017-01-03', R.lokalesDatum(sek('2017-01-03', '14:30:00'), 'America/New_York') === '2017-01-03');
ok('Berlin: 15.09.2021 07:00 UTC -> 2021-09-15', R.lokalesDatum(sek('2021-09-15', '07:00:00'), 'Europe/Berlin') === '2021-09-15');
ok('Berlin: 31.12.2020 23:30 UTC -> 2021-01-01', R.lokalesDatum(sek('2020-12-31', '23:30:00'), 'Europe/Berlin') === '2021-01-01');
ok('monatPlus 2021-11 + 60 = 2026-11', R.monatPlus('2021-11', 60) === '2026-11');
ok('monatPlus 2019-12 + 1 = 2020-01', R.monatPlus('2019-12', 1) === '2020-01');
ok('letzter Kalendertag Feb 2024 = 29.', R.letzterKalendertag('2024-02') === '2024-02-29');
ok('jahreZurueck 2024-02-29 - 5 = 2019-02-28', R.jahreZurueck('2024-02-29', 5) === '2019-02-28');
ok('jahreZurueck 2026-06-30 - 5 = 2021-06-30', R.jahreZurueck('2026-06-30', 5) === '2021-06-30');
ok('Fenster A wie im Auftrag', R.FENSTER.A.start === '2017-01-04' && R.FENSTER.A.ende === '2021-09-15');
ok('Fenster B wie im Auftrag', R.FENSTER.B.start === '2021-09-16' && R.FENSTER.B.ende === '2026-09-15');
ok('Schwelle 80 %, 60 Monate, Datenende 15.09.2026', R.SCHWELLE_ANTEIL === 0.8 && R.ROLL_MONATE === 60 && R.DATENENDE === '2026-09-15');

/* 2. Yahoo lesen: Nullzeilen raus, doppeltes Datum -> spaetere Zeile, Ereignisse */
var tg = ['2021-09-13', '2021-09-14', '2021-09-15'];
var j1 = kunstYahoo(tg, function (i) { return [100, null, 102][i]; }, { '2021-09-15': 1 });
j1.chart.result[0].timestamp.push(sek('2021-09-15', '19:59:00')); j1.chart.result[0].indicators.quote[0].close.push(103); j1.chart.result[0].indicators.adjclose[0].adjclose.push(103);
var y1 = R.leseYahoo(j1);
ok('Nullschluss uebersprungen', y1.ohneSchluss === 1 && y1.tage.length === 2);
ok('doppeltes Datum: spaetere Zeile gilt', y1.doppelt === 1 && y1.tage[1].c === 103);
ok('Dividende gelesen, Datum in NY-Zeit', y1.div.length === 1 && y1.div[0].d === '2021-09-15' && y1.div[0].betrag === 1);
wirft('Antwort ohne Kerzen wirft', function () { R.leseYahoo({ chart: { result: [{ meta: {}, timestamp: [] }], error: null } }); });
wirft('Fehlerantwort wirft', function () { R.leseYahoo({ chart: { result: null, error: { code: 'Not Found' } } }); });

/* 3. Gesamtertrag von Hand: 100 -> 101 mit 1 Ausschuettung -> (101+1)/100 = 1,02; dann 99 -> 1,02*99/101 */
var tr = R.gesamtertrag([{ d: 'a', c: 100 }, { d: 'b', c: 101 }, { d: 'c', c: 99 }], new Map([['b', 1]]));
nah('TR Tag 2 = 1,02', tr[1].v, 1.02);
nah('TR Tag 3 = 1,02*99/101', tr[2].v, 1.02 * 99 / 101);

/* 4. Zuordnung: Ereignis am Samstag -> Montag (verschoben), vor Reihenbeginn -> ausserhalb */
var zt = [{ d: '2021-09-10' }, { d: '2021-09-13' }];
var z = R.ordneZu(zt, [{ d: '2021-09-11', betrag: 0.5 }, { d: '2021-09-01', betrag: 9 }, { d: '2021-09-20', betrag: 7 }]);
ok('Samstag -> Montag', z.map.get('2021-09-13') === 0.5 && z.verschoben === 1);
ok('vor Beginn und nach Ende: ausserhalb, nicht gebucht', z.ausserhalb === 2 && z.map.size === 1);

/* 5. Kapitalgewinn, der schon als Dividende gefuehrt wird, zaehlt einmal; ein anderer zaehlt */
var au = R.ausschuettungen({ div: [{ d: 'x', betrag: 1 }], cg: [{ d: 'x', betrag: 1 }, { d: 'y', betrag: 2 }] });
ok('Kapitalgewinn-Doppel einmal, eigener Kapitalgewinn gebucht', au.cgDoppelt === 1 && au.liste.length === 2);

/* 6. Fensterrendite: Start = Schluss vor dem Starttag, Ende = letzter Schluss <= Ende */
var tage = werktage('2016-12-01', '2026-09-30');
var reiheF = tage.map(function (d, i) { return { d: d, v: Math.pow(1.0004, i) }; });
var fA = R.fensterRendite(reiheF, '2017-01-04', '2021-09-15');
ok('Fenster A: Start 03.01.2017, Ende 15.09.2021', fA.von === '2017-01-03' && fA.bis === '2021-09-15');
var iS = tage.indexOf('2017-01-03'), iE = tage.indexOf('2021-09-15');
nah('Fenster A Rendite = 1,0004^(Tage) - 1', fA.r, Math.pow(1.0004, iE - iS) - 1, 1e-12);
var fB = R.fensterRendite(reiheF, '2021-09-16', '2026-09-15');
var fGanz = reiheF[tage.indexOf('2026-09-15')].v / reiheF[iS].v;
nah('A und B verketten sich zum Ganzen', (1 + fA.r) * (1 + fB.r), fGanz, 1e-12);
ok('junge Reihe (Beginn 2017-06) -> Fenster A nicht berechenbar', R.fensterRendite(reiheF.filter(function (x) { return x.d >= '2017-06-01'; }), '2017-01-04', '2021-09-15') === null);
ok('Reihe endet 2021-08-01 -> Fenster A nicht berechenbar (Rand zu weit)', R.fensterRendite(reiheF.filter(function (x) { return x.d <= '2021-08-01'; }), '2017-01-04', '2021-09-15') === null);
nah('Jahre A nominal = (15.09.2021 - 03.01.2017)/365,25', R.jahreNominal('2017-01-04', '2021-09-15'), 1716 / 365.25, 1e-12);

/* 7. Vergleich: gleiche Reihe -> nicht vorn (strikt), Abstand 0 */
var vg = R.fensterVergleich(reiheF, reiheF, '2017-01-04', '2021-09-15');
ok('Gleichstand ist nicht vorn', vg.berechenbar && vg.vorn === false && vg.abstandPa === 0);
var reiheS = tage.map(function (d, i) { return { d: d, v: Math.pow(1.0003, i) }; });
var vg2 = R.fensterVergleich(reiheF, reiheS, '2021-09-16', '2026-09-15');
ok('schnellere Reihe vorn in B', vg2.vorn === true && vg2.abstandPa > 0);

/* 8. Rollierend: Fonds ab 2016-12-01, Massstab laenger -> Startmonat 2016-12, letzter 2021-08 (Ende 2026-08 <= 15.09.2026) */
var ro = R.rollierend(reiheF, tage.map(function (d, i) { return { d: d, v: Math.pow(1.0003, i) }; }).concat([]), '2026-09-15');
ok('rollierend: 57 Fenster 2016-12 .. 2021-08', ro.n === 57 && ro.erstesFenster === '2016-12' && ro.letztesFenster === '2021-08');
ok('rollierend: alle vorn, Anteil 1', ro.vorn === 57 && ro.anteil === 1);
var f0 = ro.fenster[0];
ok('rollierend: erstes Fenster von Monatsende 2016-12 bis Monatsende 2021-12', f0.von === '2016-12-30' && f0.bis === '2021-12-31');
nah('rollierend: Abstand p. a. = Differenz der 5-Jahres-Raten', f0.abstandPa, Math.pow(1 + f0.fonds, 0.2) - Math.pow(1 + f0.mass, 0.2), 1e-15);
/* Luecke: ein Monatsende fehlt im Fonds -> Fenster faellt weg und wird gezaehlt */
var mitLuecke = reiheF.filter(function (x) { return x.d.slice(0, 7) !== '2018-03'; });
var ro2 = R.rollierend(mitLuecke, reiheS, '2026-09-15');
ok('Luecke im Monat 2018-03: zwei Fenster fehlen (Start 2018-03 und Ende 2018-03 = Start 2013-03 gibt es nicht -> eins)', ro2.fehlend === 1 && ro2.n === 56);
/* Median und schlechtester Wert von Hand: abwechselnd vorn/hinten */
var wechsel = tage.map(function (d, i) { var m = Number(d.slice(5, 7)); return { d: d, v: Math.pow(1.0003, i) * (1 + (m % 2 ? 0.02 : -0.02)) }; });
var ro3 = R.rollierend(wechsel, reiheS, '2026-09-15');
ok('wechselnd: Start- und Endmonat haben gleiche Paritaet (60 Monate) -> Abstand 0 bis auf Rundung', ro3.fenster.every(function (x) { return Math.abs(x.abstandPa) < 1e-12; }) && Math.abs(ro3.median) < 1e-12);
ok('Anteil ist vorn/n', ro3.anteil === ro3.vorn / ro3.n);
var abl = ro.fenster.map(function (x) { return x.abstandPa; }).sort(function (a, b) { return a - b; });
ok('schlechtester = Minimum, bester = Maximum, Median = mittlerer Wert (57 Fenster -> Platz 29)', ro.schlechtester === abl[0] && ro.bester === abl[56] && ro.median === abl[28]);
ok('nicht ueberlappende Fenster: Start 2016-12 (60 Monate weiter gibt es keins)', ro.nichtUeberlappend.length === 1 && ro.nichtUeberlappend[0].start === '2016-12');

/* 9. Rueckschlag von Hand: 1, 2, 1, 3 -> -50 % von Tag 2 bis Tag 3 */
var rs = R.rueckschlag([{ d: '1', v: 1 }, { d: '2', v: 2 }, { d: '3', v: 1 }, { d: '4', v: 3 }]);
ok('Rueckschlag -50 % (Spitze 2, Tal 3)', rs.tiefe === -0.5 && rs.spitze === '2' && rs.tal === '3');
var rr = R.rueckschlagRelativ([{ d: '2020-01-01', v: 1 }, { d: '2020-01-02', v: 1.1 }, { d: '2020-01-03', v: 1.1 }], [{ d: '2020-01-01', v: 1 }, { d: '2020-01-02', v: 1 }, { d: '2020-01-03', v: 1.375 }], '2026-09-15');
nah('relativer Rueckschlag: 1,1 -> 0,8 = -27,27 %', rr.tiefe, 0.8 / 1.1 - 1, 1e-12);

/* 10. Urteil */
var Av = { berechenbar: true, vorn: true }, Ah = { berechenbar: true, vorn: false }, An = { berechenbar: false };
ok('Urteil: alles erfuellt -> verlaesslich vorn', R.urteil(Av, Av, { n: 10, anteil: 0.8 }).satz === 'verlässlich vorn');
ok('Urteil: 79,9 % -> nicht', R.urteil(Av, Av, { n: 10, anteil: 0.799 }).satz === 'nicht verlässlich vorn');
ok('Urteil: A hinten -> nicht', R.urteil(Ah, Av, { n: 10, anteil: 1 }).satz === 'nicht verlässlich vorn');
ok('Urteil: B hinten -> nicht', R.urteil(Av, Ah, { n: 10, anteil: 1 }).satz === 'nicht verlässlich vorn');
ok('Urteil: A nicht berechenbar -> zu jung', R.urteil(An, Av, { n: 10, anteil: 1 }).satz === 'nicht beurteilbar (zu jung)');

/* 11. Sprungpaare: Fehlkurs 100 -> 120 -> 100 erkannt; echte Bewegung 100 -> 85 -> 80 nicht */
var sp = R.sprungpaare([{ d: '1', c: 100 }, { d: '2', c: 120 }, { d: '3', c: 100 }, { d: '4', c: 85 }, { d: '5', c: 80 }]);
ok('Sprungpaar erkannt, echte Bewegung nicht', sp.length === 1 && sp[0].d === '2');
var sp2 = R.sprungpaare([{ d: '1', c: 100 }, { d: '2', c: 1 }, { d: '3', c: 100 }]);
ok('Faktor-100-Fehler (Pence/Pfund) erkannt', sp2.length === 1);
var sp3 = R.sprungpaare([{ d: '1', c: 100 }, { d: '2', c: 88 }, { d: '3', c: 95 }]);
ok('-12 % / +8 % ist kein Sprungpaar', sp3.length === 0);

/* 12. Waehrung: EZB-Kurse sind Fremdwaehrung je 1 EUR */
var ezb = { USD: [{ d: '2020-01-01', w: 1.1 }, { d: '2020-01-03', w: 1.2 }], GBP: [{ d: '2020-01-01', w: 0.85 }] };
nah('EUR -> USD: *1,1', R.wechselFaktor('EUR', 'USD', ezb)('2020-01-02'), 1.1);
nah('EUR -> USD am 03.01.: *1,2', R.wechselFaktor('EUR', 'USD', ezb)('2020-01-03'), 1.2);
nah('USD -> EUR: /1,1', R.wechselFaktor('USD', 'EUR', ezb)('2020-01-02'), 1 / 1.1);
nah('GBp -> USD: /100 * 1,1/0,85', R.wechselFaktor('GBp', 'USD', ezb)('2020-01-02'), 1.1 / 0.85 / 100);
ok('vor dem ersten EZB-Kurs: kein Faktor (NaN)', isNaN(R.wechselFaktor('EUR', 'USD', ezb)('2019-12-31')));
var csv = 'KEY,FREQ,CURRENCY,TIME_PERIOD,OBS_VALUE\nEXR.D.USD.EUR.SP00.A,D,USD,1999-01-05,1.1790\nEXR.D.USD.EUR.SP00.A,D,USD,1999-01-04,1.1789\n';
var ez = R.leseEzb(csv);
ok('EZB-CSV gelesen und sortiert', ez.length === 2 && ez[0].d === '1999-01-04' && ez[1].w === 1.179);

/* 13. Symbolwahl UCITS: erstes Symbol mit Beginn <= 92 Tage nach Auflage, sonst laengste Historie */
var w1 = R.waehleSymbol([{ symbol: 'X.DE', erster: '2016-03-01' }, { symbol: 'X.L', erster: '2015-11-01' }], '2015-12-15');
ok('Symbolwahl: .DE innerhalb 92 Tagen gewinnt trotz kuerzerer Historie', w1.symbol === 'X.DE');
var w2 = R.waehleSymbol([{ symbol: 'X.DE', erster: '2017-03-01' }, { symbol: 'X.L', erster: '2015-11-01' }], '2015-12-15');
ok('Symbolwahl: .DE zu spaet -> .L (laengste Historie)', w2.symbol === 'X.L');

/* 14. Ganze Kette auf einer Kunstantwort: Gesamtertrag aus Schluss + Ausschuettung trifft adjclose */
var t2 = werktage('2016-06-01', '2026-09-30');
var divs = {}; t2.forEach(function (d, i) { if (i % 63 === 40) divs[d] = 0.5; });
var y2 = R.leseYahoo(kunstYahoo(t2, function (i) { return 100 * Math.pow(1.0003, i) * (1 + 0.01 * Math.sin(i / 7)); }, divs));
var b2 = R.bereite(y2);
ok('Kunstreihe: alle Ausschuettungen gebucht, keine verschoben', b2.pruefung.ausschuettungen === Object.keys(divs).length && b2.pruefung.ausschuettungVerschoben === 0);
ok('Kunstreihe: Abgleich adjclose in A und B unter 0,01 Pp p. a.', Math.abs(b2.pruefung.abgleichAdjclose.A.differenzPa) < 1e-4 && Math.abs(b2.pruefung.abgleichAdjclose.B.differenzPa) < 1e-4);
var y3 = R.leseYahoo(kunstYahoo(t2, function (i) { return 100 * Math.pow(1.0003, i); }, {}));
var b3 = R.bereite(y3);
var v3 = R.vergleiche(b2.tr, b3.tr, '2026-09-15');
ok('Vergleich liefert A, B, rollierend, Rueckschlaege, Urteil', v3.A.berechenbar && v3.B.berechenbar && v3.rollierend.n > 0 && typeof v3.rueckschlagGegenMassstab.tiefe === 'number' && typeof v3.urteil.satz === 'string');
ok('Fonds = Massstab + Ausschuettungen -> in jedem Fenster vorn', v3.rollierend.anteil === 1 && v3.A.vorn && v3.B.vorn && v3.urteil.satz === 'verlässlich vorn');
var rb = R.renditeBisStichtag(b2.tr, '2026-06-30', 5);
ok('Factsheet-Rendite: von 30.06.2021 bis 30.06.2026', rb.von === '2021-06-30' && rb.bis === '2026-06-30');

/* 15. Korrektur K1: eingefrorener Anfang mit ungedecktem Sprung wird verworfen; spaeter Bruch nur gelistet; echter Marktsturz kein Bruch */
var t5 = werktage('2010-05-03', '2014-12-31');
var markt5 = t5.map(function (d, i) { return { d: d, v: Math.pow(1.0003, i) * (d === '2012-06-04' ? 1 : 1) }; });
var y5 = R.leseYahoo(kunstYahoo(t5, function (i, d) { return d < '2010-11-01' ? 96.95 : (d >= '2013-05-01' ? 2 : 1) * 73 * Math.pow(1.0003, i); }, {}));
var b5 = R.bereite(y5, markt5);
ok('K1: Reihe beginnt am Bruchtag 01.11.2010 (eingefrorener Anfang verworfen)', b5.pruefung.anfangVerworfenBis === '2010-11-01' && b5.tr[0].d === '2010-11-01');
ok('K1: spaeterer Bruch (01.05.2013, Faktor 2) gelistet, nicht verworfen', b5.pruefung.brueche.some(function (x) { return x.d === '2013-05-01' && !x.verworfenBis; }) && b5.tr.length === t5.filter(function (d) { return d >= '2010-11-01'; }).length);
ok('K1: eingefrorener Lauf erkannt (>= 5 Tage gleicher Schluss)', R.eingefroren(y5.tage).length === 1 && R.eingefroren(y5.tage)[0].von === '2010-05-03');
var markt6 = t5.map(function (d, i) { return { d: d, v: (d >= '2011-08-08' ? 0.85 : 1) * Math.pow(1.0003, i) }; });
var y6 = R.leseYahoo(kunstYahoo(t5, function (i, d) { return (d >= '2011-08-08' ? 0.86 : 1) * 50 * Math.pow(1.0003, i); }, {}));
var b6 = R.bereite(y6, markt6);
ok('K1: -14 % bei Markt -15 % ist kein Bruch, Reihe bleibt ganz', b6.pruefung.brueche.length === 0 && b6.pruefung.anfangVerworfenBis === null && b6.pruefung.grosseBewegungen.length === 1);
ok('ohne Markt keine Brueche (SPY selbst)', R.bereite(y5).pruefung.brueche.length === 0);
/* K1b: echte Bewegung eines konzentrierten Fonds (+16,8 % bei Markt +4,8 %, wie QQQ am 03.01.2001) ohne eingefrorenen Lauf davor:
 * gelistet, aber NICHT verworfen */
var t7 = werktage('1999-03-10', '2003-12-31');
var markt7 = t7.map(function (d, i) { return { d: d, v: (d >= '2001-01-03' ? 1.048 : 1) * Math.pow(1.0002, i) }; });
var y7 = R.leseYahoo(kunstYahoo(t7, function (i, d) { return (d >= '2001-01-03' ? 1.168 : 1) * 80 * Math.pow(1.0002, i) * (1 + 0.001 * (i % 3)); }, {}));
var b7 = R.bereite(y7, markt7);
ok('K1b: echter Sprung ohne eingefrorenen Lauf davor -> gelistet, Reihe bleibt ab 1999 ganz', b7.pruefung.brueche.length === 1 && b7.pruefung.anfangVerworfenBis === null && b7.tr[0].d === '1999-03-10');

/* 16. Benannte Ergaenzungen (REGEL C2): fehlt / streichen / ersetzen, mit Schutz gegen Doppelbuchung */
var rg = { div: [{ d: '2020-03-20', betrag: 0.5 }, { d: '2020-06-19', betrag: 0.6 }, { d: '2003-12-16', betrag: 0.278 }], cg: [] };
var eg = R.ergaenze(rg, 'X', [
  { symbol: 'X', ex: '2020-09-21', art: 'fehlt', betrag: 0.4 },
  { symbol: 'X', ex: '2020-03-23', art: 'fehlt', betrag: 0.5 },
  { symbol: 'X', ex: '2003-12-16', art: 'streichen', yahooBetrag: 0.278 },
  { symbol: 'X', ex: '2020-06-19', art: 'ersetzen', betrag: 0.66, yahooBetrag: 0.6 },
  { symbol: 'X', ex: '2019-01-01', art: 'streichen', yahooBetrag: 9 },
  { symbol: 'Y', ex: '2020-01-01', art: 'fehlt', betrag: 1 }]);
var dz = eg.reihe.div.map(function (x) { return x.d + ':' + x.betrag; }).join(' ');
ok('Ergaenzung: fehlt nachgetragen, Doppel nicht gebucht, gestrichen, ersetzt, fremdes Symbol ignoriert', dz === '2020-03-20:0.5 2020-06-19:0.66 2020-09-21:0.4');
ok('Ergaenzung: Protokoll nennt nicht angewandte Eintraege mit Grund', eg.log.length === 5 && eg.log.filter(function (x) { return !x.angewandt; }).length === 2);
ok('Ergaenzung: Rohliste bleibt unveraendert', rg.div.length === 3 && rg.div[1].betrag === 0.6);

/* 17. Korrektur K2 (USD-Werte in EUR-Reihen) */
var t8 = werktage('2008-01-02', '2010-12-31');
var markt8 = t8.map(function (d, i) { return { d: d, v: 100 * Math.pow(1.0002, i) }; });
var fx14 = function () { return 1.4; };
/* (a) Anfangsabschnitt bis 30.06.2008 in USD, dazu ein Einzeltag 15.03.2010 in USD */
var y8 = R.leseYahoo(kunstYahoo(t8, function (i, d) { var eur = 50 * Math.pow(1.0002, i) * 1.4; return (d < '2008-07-01' || d === '2010-03-15') ? eur * 1.4 : eur; }, {}, { waehrung: 'EUR', tz: 'Europe/Berlin' }));
var b8 = R.bereite(y8, markt8, fx14);
var ab8 = b8.pruefung.usdAbschnitte;
ok('K2: Anfangsabschnitt bis 30.06.2008 und Einzeltag 15.03.2010 erkannt', ab8.length === 2 && ab8[0].art === 'Anfang' && ab8[0].bis === '2008-06-30' && ab8[1].art === 'Einzeltag' && ab8[1].von === '2010-03-15');
ok('K2: nach der Umrechnung keine Sprungpaare/Brueche mehr, Reihe ganz', b8.pruefung.brueche.length === 0 && b8.tr[0].d === '2008-01-02' && b8.pruefung.anfangVerworfenBis === null);
nah('K2: Gesamtertrag ueber die ganze Reihe = reine Kursentwicklung', b8.tr[b8.tr.length - 1].v, Math.pow(1.0002, t8.length - 1), 1e-9);
/* (b) echte Bewegung bei kleinem Kurs (EURUSD 1,07 < 1,1275): +6 % ohne Markt bleibt stehen */
var y9 = R.leseYahoo(kunstYahoo(t8, function (i, d) { return 50 * (d >= '2009-11-06' ? 1.06 : 1); }, {}, { waehrung: 'EUR', tz: 'Europe/Berlin' }));
ok('K2: +6 % bei EURUSD 1,07 wird nicht umgerechnet', R.bereite(y9, markt8, function () { return 1.07; }).pruefung.usdAbschnitte.length === 0);
/* (c) eingefrorener Anfang, dann Sprung um den Kurs: nicht umrechnen, K1b schneidet */
var y10 = R.leseYahoo(kunstYahoo(t8, function (i, d) { return d < '2008-03-03' ? 70 : 50 * Math.pow(1.0002, i); }, {}, { waehrung: 'EUR', tz: 'Europe/Berlin' }));
var b10 = R.bereite(y10, markt8, fx14);
ok('K2: eingefrorener Anfang wird nicht umgerechnet, K1b verwirft ihn', b10.pruefung.usdAbschnitte.length === 0 && b10.pruefung.anfangVerworfenBis === '2008-03-03');
/* (d) USD-Reihe bleibt unberuehrt */
var y11 = R.leseYahoo(kunstYahoo(t8, function (i, d) { return (d === '2010-03-15' ? 1.4 : 1) * 50; }, {}));
ok('K2: Reihe in USD wird nicht angefasst', R.bereite(y11, markt8, fx14).pruefung.usdAbschnitte.length === 0);

/* ===== Teil II: Klinken an fonds.json und am Ordner ===== */
var FJ = path.join(ORDNER, 'fonds.json');
if (fs.existsSync(FJ)) {
  var fonds = JSON.parse(fs.readFileSync(FJ, 'utf8')).fonds;
  var pflicht = ['RSP', 'QUAL', 'SPHQ', 'USMV', 'SPLV', 'VLUE', 'IWD', 'RPV', 'IWF', 'QQQ', 'MTUM', 'SPMO', 'QMOM', 'PDP', 'SCHD', 'VIG', 'DGRO', 'VYM', 'PKW', 'SYLD', 'IJR', 'IWM', 'AVUV', 'COWZ', 'MOAT', 'LRGF', 'GSLC'];
  pflicht.forEach(function (k) {
    ok('Pflichtfonds ' + k + ' genau einmal, als Auftrag markiert', fonds.filter(function (f) { return f.id === k && f.auftrag === true && f.art === 'US'; }).length === 1);
  });
  ok('jede Kennung eindeutig', new Set(fonds.map(function (f) { return f.id; })).size === fonds.length);
  ok('jeder Fonds hat Gruppe, Lauf g1..g5 und mindestens ein Yahoo-Symbol', fonds.every(function (f) { return f.gruppe && /^g[1-5]$/.test(f.lauf) && Array.isArray(f.yahoo) && f.yahoo.length > 0; }));
  ok('jeder UCITS-Fonds hat ISIN, Auflage und Quelle', fonds.filter(function (f) { return f.art === 'UCITS'; }).every(function (f) { return /^[A-Z]{2}[A-Z0-9]{9}\d$/.test(f.isin) && /^\d{4}-\d{2}-\d{2}$/.test(f.auflage) && /^https?:\/\//.test(f.quelle); }));
  ok('mindestens ein UCITS-Fonds', fonds.some(function (f) { return f.art === 'UCITS'; }));
  ok('SPY ist Massstab und nicht in der Fondsliste', !fonds.some(function (f) { return f.id === 'SPY'; }));
}
/* Benannte Ergaenzungen: jede mit Symbol aus fonds.json, Datum, Art, Betrag und Quelle */
var EGJ = path.join(ORDNER, 'ergaenzungen.json');
if (fs.existsSync(EGJ) && fs.existsSync(FJ)) {
  var alleSym = new Set(['SPY', 'SXR8.DE']);
  JSON.parse(fs.readFileSync(FJ, 'utf8')).fonds.forEach(function (f) { f.yahoo.forEach(function (s) { alleSym.add(s); }); });
  var eg2 = JSON.parse(fs.readFileSync(EGJ, 'utf8')).eintraege;
  ok('ergaenzungen.json: jeder Eintrag vollstaendig (Symbol bekannt, Datum, Art, Betrag, Quelle)', eg2.every(function (e) {
    var g = alleSym.has(e.symbol) && /^\d{4}-\d{2}-\d{2}$/.test(e.ex) && ['fehlt', 'streichen', 'ersetzen'].indexOf(e.art) >= 0 &&
      (e.art === 'streichen' || e.betrag > 0) && (e.art === 'fehlt' || e.yahooBetrag > 0) && /^https?:\/\//.test(e.quelle_url || '');
    if (!g) console.log('   unvollstaendig: ' + JSON.stringify(e));
    return g;
  }));
}
/* Keine Rohantworten der Yahoo-Schnittstelle im Studienordner (Daten Dritter) */
var verdaechtig = [];
(function lauf(d) {
  fs.readdirSync(d).forEach(function (n) {
    var p = path.join(d, n);
    if (fs.statSync(p).isDirectory()) return lauf(p);
    if (!/\.(json|csv|txt)$/.test(n)) return;
    var s = fs.readFileSync(p, 'utf8');
    if (s.indexOf('"indicators"') >= 0 || s.indexOf('"adjclose":[') >= 0 || s.indexOf('OBS_VALUE') >= 0) verdaechtig.push(n);
  });
})(ORDNER);
ok('keine Rohdaten (Yahoo-Antworten, EZB-CSV) im Studienordner' + (verdaechtig.length ? ': ' + verdaechtig.join(', ') : ''), verdaechtig.length === 0);

/* ===== Teil III: echte Reihen (nur mit --roh) ===== */
if (argRoh) {
  var spy = R.bereite(R.leseRohdatei(argRoh, 'SPY'));
  var sA = R.fensterRendite(spy.tr, '2017-01-04', '2021-09-15');
  /* Gegenprobe des PM aus Nr. 78 (REGEL.md dort, Paragraph 1.6), vor dieser Studie festgehalten:
   * SPY Schluss 03.01.2017 bis Schluss 15.09.2021, bereinigte Yahoo-Reihe +115,81 %, Panel+Ausschuettungen +115,95 %. */
  nah('SPY Fenster A (Gesamtertrag) innerhalb 0,3 Pp der Gegenprobe Nr. 78 (+115,81 % Yahoo-bereinigt)', sA.r * 100, 115.81, 0.3);
  var sB = R.fensterRendite(spy.tr, '2021-09-16', '2026-09-15');
  /* Nr. 88 (Ergebnis-Drift, 04.10.2026): S&P 500 (SPY, Gesamtertrag) 16.09.2021-15.09.2026 +81,2 % */
  nah('SPY Fenster B innerhalb 0,5 Pp von +81,2 % (Nr. 88)', sB.r * 100, 81.2, 0.5);
  /* REGEL C7.6 verlangt vier je volles Jahr. Gemessen: 2004 sind es fuenf - die Sonderausschuettung vom 15.11.2004
   * (0,351 $; Microsofts Sonderdividende). Beleg, dass sie echt ist und nicht doppelt zaehlt: SPY gegen ^SP500TR im
   * Kalenderjahr 2004 -0,18 Pp (2003 -0,51, 2005 -0,09) - ohne sie laege SPY ~0,5 Pp weiter zurueck. Benannt in ERGEBNIS.md. */
  ok('SPY: vier Ausschuettungen je volles Kalenderjahr 1994-2025, 2004 fuenf (Sonderausschuettung 15.11.2004)', (function () {
    var r = R.leseRohdatei(argRoh, 'SPY'); var z = {};
    r.div.forEach(function (x) { var j = x.d.slice(0, 4); z[j] = (z[j] || 0) + 1; });
    for (var j = 1994; j <= 2025; j++) if (z[j] !== (j === 2004 ? 5 : 4)) { console.log('   SPY ' + j + ': ' + z[j]); return false; }
    return r.div.some(function (x) { return x.d === '2004-11-15' && Math.abs(x.betrag - 0.351) < 1e-9; });
  })());
  /* K1 an der Eichung gefunden: SXR8.DE beginnt bei Yahoo mit eingefrorenen Kursen (92,67 / 96,95) bis 29.10.2010 */
  if (fs.existsSync(path.join(argRoh, R.dateiname('SXR8.DE')))) {
    var sx = R.bereite(R.leseRohdatei(argRoh, 'SXR8.DE'), spy.tr);
    ok('SXR8.DE: Anfang bis 01.11.2010 verworfen (K1), danach keine Brueche', sx.pruefung.anfangVerworfenBis === '2010-11-01' && sx.pruefung.brueche.filter(function (x) { return !x.verworfenBis; }).length === 0);
  }
  ok('SPY: keine Sprungpaare', spy.pruefung.sprungpaare.length === 0);
  /* REGEL.md C7.6: SPY liegt gegen den S&P 500 Total Return Index in A und B zwischen 0 und 0,25 Pp p. a. zurueck */
  if (fs.existsSync(path.join(argRoh, R.dateiname('^SP500TR')))) {
    var idx = R.bereite(R.leseRohdatei(argRoh, '^SP500TR'));
    ['A', 'B'].forEach(function (k) {
      var v = R.fensterVergleich(spy.tr, idx.tr, R.FENSTER[k].start, R.FENSTER[k].ende);
      var rueck = -v.abstandPa * 100;
      if (!(rueck > 0 && rueck < 0.25)) console.log('   SPY gegen ^SP500TR ' + k + ': ' + rueck.toFixed(3) + ' Pp p. a.');
      ok('SPY gegen ^SP500TR, Fenster ' + k + ': Rueckstand zwischen 0 und 0,25 Pp p. a.', rueck > 0 && rueck < 0.25);
    });
  }
  /* REGEL.md C7.7: IVV und VOO gegen SPY je |Abstand| < 0,15 Pp p. a. in A und B */
  ['IVV', 'VOO'].forEach(function (s) {
    if (!fs.existsSync(path.join(argRoh, R.dateiname(s)))) return;
    var b = R.bereite(R.leseRohdatei(argRoh, s));
    ['A', 'B'].forEach(function (k) {
      var v = R.fensterVergleich(b.tr, spy.tr, R.FENSTER[k].start, R.FENSTER[k].ende);
      if (!(Math.abs(v.abstandPa) < 0.0015)) console.log('   ' + s + ' gegen SPY ' + k + ': ' + (v.abstandPa * 100).toFixed(3));
      ok('Eichung ' + s + ' gegen SPY, Fenster ' + k + ': |Abstand| < 0,15 Pp p. a.', Math.abs(v.abstandPa) < 0.0015);
    });
  });
}

/* ===== Teil IV: Ergebnis in sich stimmig (sobald vorhanden) ===== */
var EJ = path.join(ORDNER, 'ergebnis.json');
if (fs.existsSync(EJ)) {
  var E = JSON.parse(fs.readFileSync(EJ, 'utf8'));
  var liste = E.fonds || [];
  ok('ergebnis.json: Kennung', E.kennung === R.KENNUNG);
  liste.forEach(function (f) {
    if (!f.gegenSPY) return;
    var g = f.gegenSPY;
    var sollUS = R.urteil(g.A, g.B, g.rollierend).satz;
    if (f.art !== 'UCITS') ok('Urteil folgt aus den Zahlen: ' + f.id, f.urteil === sollUS);
    else {
      var s2 = f.gegenSXR8 ? R.urteil(f.gegenSXR8.A, f.gegenSXR8.B, f.gegenSXR8.rollierend).satz : null;
      var soll = sollUS.indexOf('nicht beurteilbar') === 0 ? sollUS : (sollUS === 'verlässlich vorn' && s2 === 'verlässlich vorn' ? 'verlässlich vorn' : 'nicht verlässlich vorn');
      ok('Urteil UCITS folgt aus beiden Vergleichen: ' + f.id, f.urteil === soll);
    }
    if (g.rollierend && g.rollierend.n) ok('Anteil = vorn/n: ' + f.id, Math.abs(g.rollierend.anteil - g.rollierend.vorn / g.rollierend.n) < 1e-12);
  });
  var MD = path.join(ORDNER, 'ERGEBNIS.md');
  if (fs.existsSync(MD)) {
    var md = fs.readFileSync(MD, 'utf8');
    liste.forEach(function (f) {
      if (!f.gegenSPY || !f.zeile) return;
      ok('ERGEBNIS.md enthaelt die Tabellenzeile von ' + f.id + ' wie in ergebnis.json', md.indexOf(f.zeile) >= 0);
    });
  }
}

console.log(gut + ' Pruefungen gruen, ' + schlecht + ' rot');
process.exit(schlecht ? 1 : 0);
