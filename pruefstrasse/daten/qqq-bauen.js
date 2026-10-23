'use strict';
/* Nr. 121-2b B.1: Tagesreihe eines Index-ETF (QQQ = Nasdaq-100 mit Dividenden; SPY nur als Kreuzprobe) aus den ROHEN Minutenkerzen des Archivs.
 * Weg wie Nr. 122 (studien/momentum-wiedervorlage-2026-10-23/massstab.js tagesreihe - die Studie bleibt unveraendert):
 *   - Quelle E:/Markt-Dashboard-Archiv/alpaca1m/<SYM>/<Jahr>.json (Alpaca SIP, adjustment=raw), Feldfolge [zeit, schluss, umsatz, hoch, tief, eroeffnung]
 *     (geprueft, sonst Abbruch). ZEITSTEMPEL: Millisekunden seit 1970 UTC, Zahl > 1e12 - geprueft je Datei (erste/letzte Kerze, monoton); Sekunden
 *     oder Text brechen ab ("ZEITSTEMPEL"). Zeitzone New York nach nyVersatzStunden (Kopie Nr. 122: 2. Sonntag im Maerz 07:00 UTC bis 1. Sonntag im
 *     November 06:00 UTC = -4 h, sonst -5 h).
 *   - Handelstag = Kalendertag des Archivkalenders alpaca1m/_kalender.json (open/close je Tag); Halbtag = close 13:00 -> ausgewiesen (halb: true).
 *   - Eroeffnung = Eroeffnung der ersten Kerze ab 09:30 (spaetestens 10:00, sonst kein Tag); Schluss = Eroeffnung der Kerze zur Schlusszeit (16:00 bzw.
 *     13:00 am Halbtag; Wiki-Regel "Tagesschluss aus Minuten"); fehlt sie: Schluss der letzten Kerze vor der Schlusszeit (Feld schlussArt). Abweichung
 *     zu Nr. 122: dort ohne Halbtag-Regel (am Halbtag nahm sie die letzte Kerze vor 16:00, also eine nachboersliche).
 *   - Ausschuettungen aus alpaca-massnahmen/<SYM>.json (cash_dividends), DEDUPLIZIERT nach (Ex-Tag, Betrag) - QQQ fuehrt 2022-09-19 doppelt (Nr. 122 Fund);
 *     jeder entfernte Doppelsatz steht in "doppelt". Benannte Ergaenzungen wie korb.js ERGAENZUNGEN (SPY 2018-06-15) - gelesen, nicht geaendert.
 *   - bereinigt (Gesamtertrag, Ausschuettung am Ex-Tag zum Schluss wieder angelegt, nur Vergangenheit): cb_0 = c_0, cb_t = cb_(t-1) x (c_t + D_t) / c_(t-1).
 * Aufruf: node pruefstrasse/daten/qqq-bauen.js [--sym QQQ] [--archiv E:/Markt-Dashboard-Archiv] [--aus pruefstrasse/daten/qqq-tage.json]
 * NUR LESEN auf dem Archiv. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');

var FELDER = '[zeit, schluss, umsatz, hoch, tief, eroeffnung]';
/** Kopie aus Nr. 122 massstab.js (US-Sommerzeit). */
function nyVersatzStunden(ms) {
  var d = new Date(ms), j = d.getUTCFullYear();
  function sonntag(monat, n) { var t = new Date(Date.UTC(j, monat, 1)); var wd = t.getUTCDay(); return 1 + ((7 - wd) % 7) + 7 * (n - 1); }
  var a = Date.UTC(j, 2, sonntag(2, 2), 7), e = Date.UTC(j, 10, sonntag(10, 1), 6);
  return ms >= a && ms < e ? -4 : -5;
}
/** New-York-Datum und Minute des Tages einer Kerze. */
function nyZeit(ms) { var lok = new Date(ms + nyVersatzStunden(ms) * 3600000); return { datum: lok.toISOString().slice(0, 10), min: lok.getUTCHours() * 60 + lok.getUTCMinutes() }; }
function minuteVon(hhmm) { var p = String(hhmm).split(':'); return +p[0] * 60 + +p[1]; }
/** Zeitstempel-Pruefung einer Datei: Zahl in ms (> 1e12, < 4e12), streng monoton. */
function zeitPruefen(series, datei) {
  if (!series.length) return { n: 0 };
  var a = series[0][0], b = series[series.length - 1][0];
  if (typeof a !== 'number' || !(a > 1e12 && b < 4e12)) throw new Error('ZEITSTEMPEL: ' + datei + ' erste Kerze ' + JSON.stringify(a) + ' ist keine Millisekundenzahl (Sekunden/Text?)');
  for (var i = 1; i < series.length; i++) if (!(series[i][0] > series[i - 1][0])) throw new Error('ZEITSTEMPEL: ' + datei + ' nicht monoton bei ' + i);
  return { n: series.length, erste: new Date(a).toISOString(), letzte: new Date(b).toISOString() };
}

/** Ausschuettungen je Ex-Tag (dedupliziert nach Ex-Tag + Betrag) aus den Saetzen der Massnahmen-Datei; erg = benannte Ergaenzungen [{ex_date, rate}]. */
function ausschuettungen(saetze, erg) {
  var je = {}, gesehen = {}, doppelt = [], ergaenzt = [];
  (saetze || []).forEach(function (x) {
    if (x._art !== 'cash_dividends' || !(Number(x.rate) > 0)) return;
    var key = x.ex_date + '|' + Number(x.rate);
    if (gesehen[key]) { doppelt.push({ exTag: x.ex_date, betrag: Number(x.rate), processDate: x.process_date }); return; }
    gesehen[key] = true; (je[x.ex_date] = je[x.ex_date] || []).push(Number(x.rate));
  });
  (erg || []).forEach(function (x) { if (!je[x.ex_date]) { je[x.ex_date] = [x.rate]; ergaenzt.push(x); } });
  return { je: je, doppelt: doppelt, ergaenzt: ergaenzt };
}

/**
 * Tage aus Kerzen. kerzen = [[ms, schluss, umsatz, hoch, tief, eroeffnung], ...] (sortiert), kal = { 'JJJJ-MM-TT': { open, close } }, aus = je Ex-Tag [Betraege].
 * Liefert { tage: [{ d, o, c, cb, aus, halb, schlussArt }], ohneEroeffnung, ohneSchluss, exTagOhneTag }.
 */
function tageAus(kerzen, kal, aus) {
  var je = {};
  kerzen.forEach(function (b) {
    var z = nyZeit(b[0]), k = kal[z.datum]; if (!k) return;
    var t = je[z.datum] || (je[z.datum] = { auf: NaN, aufMin: 9999, s: NaN, letzt: NaN, letztMin: -1, sMin: minuteVon(k.close), halb: k.close !== '16:00' });
    if (z.min >= 570 && z.min < t.sMin && z.min < t.aufMin) { t.aufMin = z.min; t.auf = b[5]; }
    if (z.min === t.sMin) t.s = b[5];
    if (z.min >= 570 && z.min < t.sMin && z.min > t.letztMin) { t.letztMin = z.min; t.letzt = b[1]; }
  });
  var tage = [], ohneE = [], ohneS = [];
  Object.keys(je).sort().forEach(function (d) {
    var t = je[d];
    if (!(t.auf > 0) || t.aufMin > 600) { ohneE.push(d); return; }
    var c = t.s > 0 ? t.s : t.letzt, art = t.s > 0 ? 'eroeffnung-' + (t.halb ? '13:00' : '16:00') : 'schluss-letzte-vor-' + (t.halb ? '13:00' : '16:00');
    if (!(c > 0)) { ohneS.push(d); return; }
    tage.push({ d: d, o: t.auf, c: c, aus: aus[d] || [], halb: t.halb || undefined, schlussArt: art });
  });
  var cb = null;
  tage.forEach(function (x, i) {
    if (i === 0) cb = x.c;
    else { var D = 0; x.aus.forEach(function (a) { D += a; }); cb = cb * (x.c + D) / tage[i - 1].c; }
    x.cb = cb;
  });
  var da = {}; tage.forEach(function (x) { da[x.d] = 1; });
  return { tage: tage, ohneEroeffnung: ohneE, ohneSchluss: ohneS, exTagOhneTag: Object.keys(aus).filter(function (d) { return !da[d]; }) };
}

/** Eine Reihe aus dem Archiv bauen (nur lesen). */
function baue(sym, archiv, opt) {
  opt = opt || {};
  var ord = path.join(archiv, 'alpaca1m', sym), dateien = fs.readdirSync(ord).filter(function (f) { return /^\d{4}\.json$/.test(f); }).sort();
  var kalJ = JSON.parse(fs.readFileSync(path.join(archiv, 'alpaca1m', '_kalender.json'), 'utf8')), kerzen = [], zeit = {};
  dateien.forEach(function (f) {
    var D = JSON.parse(fs.readFileSync(path.join(ord, f), 'utf8'));
    if (D.felder !== FELDER) throw new Error('KLINKE: Feldfolge ' + D.felder + ' in ' + f);
    zeit[f] = zeitPruefen(D.series, f);
    for (var i = 0; i < D.series.length; i++) kerzen.push(D.series[i]);
  });
  var M = JSON.parse(fs.readFileSync(path.join(archiv, 'alpaca-massnahmen', sym + '.json'), 'utf8'));
  var A = ausschuettungen(M.saetze, opt.ergaenzungen || []);
  var T = tageAus(kerzen, kalJ.tage, A.je), letzte = kerzen.length ? new Date(kerzen[kerzen.length - 1][0]).toISOString() : null;
  return {
    kennung: 'pruefstrasse/daten/' + sym.toLowerCase() + '-tage/v1', sym: sym, erzeugt: new Date().toISOString(), erzeugtVon: 'pruefstrasse/daten/qqq-bauen.js (Nr. 121-2b)',
    quelle: { kerzen: 'alpaca1m/' + sym + '/<Jahr>.json (' + dateien.length + ' Dateien, Alpaca SIP adjustment=raw)', massnahmen: 'alpaca-massnahmen/' + sym + '.json (Stand ' + M.stand + ')', kalender: 'alpaca1m/_kalender.json', letzteKerze: letzte },
    zeitstempel: { format: 'Millisekunden seit 1970 UTC (Zahl > 1e12), je Datei geprueft, streng monoton', zeitzone: 'New York nach nyVersatzStunden (Kopie Nr. 122)', dateien: zeit },
    regel: { eroeffnung: 'Eroeffnung der ersten Kerze ab 09:30 (bis 10:00)', schluss: 'Eroeffnung der Kerze zur Schlusszeit (16:00, Halbtag 13:00); sonst Schluss der letzten Kerze davor', bereinigt: 'cb_t = cb_(t-1) x (c_t + D_t) / c_(t-1), cb_0 = c_0 (Gesamtertrag)' },
    ausschuettungen: Object.keys(A.je).sort().map(function (d) { return { exTag: d, betraege: A.je[d] }; }), doppelt: A.doppelt, ergaenzt: A.ergaenzt,
    halbtage: T.tage.filter(function (x) { return x.halb; }).map(function (x) { return x.d; }), ohneEroeffnung: T.ohneEroeffnung, ohneSchluss: T.ohneSchluss, exTagOhneTag: T.exTagOhneTag,
    von: T.tage.length ? T.tage[0].d : null, bis: T.tage.length ? T.tage[T.tage.length - 1].d : null, n: T.tage.length,
    spalten: ['d', 'o', 'c', 'cb', 'aus', 'halb', 'schlussArt'], tage: T.tage,
  };
}

module.exports = { nyVersatzStunden: nyVersatzStunden, nyZeit: nyZeit, zeitPruefen: zeitPruefen, ausschuettungen: ausschuettungen, tageAus: tageAus, baue: baue, FELDER: FELDER };

if (require.main === module) {
  var arg = function (n, v) { var i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : v; };
  var sym = arg('--sym', 'QQQ'), archiv = arg('--archiv', 'E:/Markt-Dashboard-Archiv'), aus = arg('--aus', path.join(__dirname, sym.toLowerCase() + '-tage.json'));
  var erg = []; try { erg = (require(path.join(__dirname, '..', '..', 'studien', 'momentum-korb-2026-10-04', 'korb.js')).ERGAENZUNGEN || {})[sym] || []; } catch (e) { erg = []; }
  var E = baue(sym, archiv, { ergaenzungen: erg });
  fs.writeFileSync(aus, JSON.stringify(E, function (k, v) { return typeof v === 'number' && k !== '' ? Math.round(v * 1e8) / 1e8 : v; }) + '\n');
  console.log(sym + ': ' + E.n + ' Tage ' + E.von + '..' + E.bis + ', Halbtage ' + E.halbtage.length + ', Ausschuettungen ' + E.ausschuettungen.length + ', doppelt ' + JSON.stringify(E.doppelt) + ', ergaenzt ' + E.ergaenzt.length +
    ', ohne Eroeffnung ' + E.ohneEroeffnung.length + ', ohne Schluss ' + E.ohneSchluss.length + ', Ex-Tag ohne Tag ' + JSON.stringify(E.exTagOhneTag) + ' -> ' + aus);
}
