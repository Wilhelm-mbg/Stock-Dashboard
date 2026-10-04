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
  ok('SPY: vier Ausschuettungen je volles Kalenderjahr 2000-2025', (function () {
    var r = R.leseRohdatei(argRoh, 'SPY'); var z = {};
    r.div.forEach(function (x) { var j = x.d.slice(0, 4); z[j] = (z[j] || 0) + 1; });
    for (var j = 2000; j <= 2025; j++) if (z[j] !== 4) { console.log('   SPY ' + j + ': ' + z[j]); return false; }
    return true;
  })());
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
