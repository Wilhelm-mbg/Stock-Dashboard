'use strict';
/* Auftrag Nr. 122 (23.10.2026): Massstab Nasdaq-100 mit Dividenden, brutto und nach deutscher Steuer, SPY nachrichtlich; dazu das
 * Momentum-Buch (Regel K, Panel v2.3) nach Steuer mit dem Steuerrechner aus Nr. 82 (studien/nach-steuern-2026-10-04/steuer.js - nur geladen,
 * nie geaendert). Rechenmodell, keine Steuerberatung.
 * Datenquelle QQQ: im Tagesarchiv archiv1d gibt es KEINE Reihe QQQ (nur QQQE/QQQI/QQQM/TQQQ/SQQQ); genommen wird die rohe Minutenreihe
 * E:/Markt-Dashboard-Archiv/alpaca1m/QQQ (Alpaca SIP, adjustment=raw, 2016-2026; QQQ hatte in diesem Zeitraum keinen Split) und die
 * Ausschuettungen aus alpaca-massnahmen/QQQ.json. Eroeffnung = Eroeffnung der 09:30-Kerze, Schluss = Eroeffnung der 16:00-Kerze (sonst Schluss
 * der letzten Kerze vor 16:00; wiki: Tagesschluss aus Minuten). Dieselbe Rechnung fuer SPY aus alpaca1m/SPY ist die Gegenprobe gegen den
 * SPY-Massstab des Panels.
 * Kosten des Buchs: der Steuerrechner kennt nur EINEN Satz je Seite. Eingesetzt wird je Lauf und Kostenlage der EFFEKTIVE Satz aus rechnen.js
 * (gezahlte Kosten / gehandeltes Volumen bei k = 0) - eine Naeherung, deren Fehler vor Steuern mit ausgewiesen wird.
 *   node --max-old-space-size=6144 studien/momentum-wiedervorlage-2026-10-23/massstab.js */
process.env.RUECKBLICK_PANEL = 'v2.3';
var fs = require('fs');
var path = require('path');
var REPO = path.resolve(__dirname, '..', '..');
var KS = require(path.join(REPO, 'studien', 'momentum-korb-kleinst-2026-10-04', 'kleinst.js'));
var R = KS.R, MH = KS.MH;
var STEUER = path.join(REPO, 'studien', 'nach-steuern-2026-10-04', 'steuer.js');
var SIEGEL = JSON.parse(fs.readFileSync(path.join(REPO, 'studien', 'momentum-korb-v23-2026-10-04', 'ergebnis.json'), 'utf8'));
var RECHNEN = null;                /* ergebnis.json von rechnen.js, gelesen erst in Teil 2 */
var ARCHIV = 'E:/Markt-Dashboard-Archiv';
var TER_QQQ = 0.0020;              /* Invesco QQQ Trust, quellen.md */
var ETF = { name: 'Xtrackers Nasdaq 100 UCITS ETF 1C', isin: 'IE00BMFKG444', ter: 0.0020 };
var SZ = ['alt-20bp', 'eroeffnung-fixed-100k', 'kassa-fixed-100k'];

/* ---------- Tagesreihe aus Minuten ---------- */
function nyVersatzStunden(ms) {           /* US-Sommerzeit: 2. Sonntag im Maerz 07:00 UTC bis 1. Sonntag im November 06:00 UTC */
  var d = new Date(ms), j = d.getUTCFullYear();
  function sonntag(monat, n) { var t = new Date(Date.UTC(j, monat, 1)); var wd = t.getUTCDay(); return 1 + ((7 - wd) % 7) + 7 * (n - 1); }
  var a = Date.UTC(j, 2, sonntag(2, 2), 7), e = Date.UTC(j, 10, sonntag(10, 1), 6);
  return ms >= a && ms < e ? -4 : -5;
}
function tagesreihe(sym) {
  var tage = {};
  fs.readdirSync(path.join(ARCHIV, 'alpaca1m', sym)).filter(function (f) { return /^\d{4}\.json$/.test(f); }).sort().forEach(function (f) {
    var D = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'alpaca1m', sym, f), 'utf8'));
    if (D.felder !== '[zeit, schluss, umsatz, hoch, tief, eroeffnung]') throw new Error('KLINKE: Feldfolge ' + D.felder);
    D.series.forEach(function (b) {
      var lok = new Date(b[0] + nyVersatzStunden(b[0]) * 3600000), datum = lok.toISOString().slice(0, 10), min = lok.getUTCHours() * 60 + lok.getUTCMinutes();
      var t = tage[datum] = tage[datum] || { datum: datum, auf: NaN, aufMin: 9999, s16: NaN, letzt: NaN, letztMin: -1 };
      if (min >= 570 && min < 960 && min < t.aufMin) { t.aufMin = min; t.auf = b[5]; }
      if (min === 960) t.s16 = b[5];
      if (min >= 570 && min < 960 && min > t.letztMin) { t.letztMin = min; t.letzt = b[1]; }
    });
  });
  var dv = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'alpaca-massnahmen', sym + '.json'), 'utf8')).saetze || [], ausJe = {};
  /* Doppelte Saetze (gleicher Ex-Tag, gleicher Betrag, anderes process_date - QQQ 2022-09-19 steht zweimal) werden EINMAL gezaehlt */
  var doppelt = [], gesehen = {};
  dv.forEach(function (x) {
    if (x._art !== 'cash_dividends' || !(Number(x.rate) > 0)) return;
    var key = x.ex_date + '|' + Number(x.rate);
    if (gesehen[key]) { doppelt.push(key); return; }
    gesehen[key] = true;
    (ausJe[x.ex_date] = ausJe[x.ex_date] || []).push(Number(x.rate));
  });
  /* dieselbe benannte Ergaenzung wie der Rueckblick (korb.js ERGAENZUNGEN: SPY 2018-06-15 1,2456 $ fehlt in der Alpaca-Datei) */
  var erg = (KS.S.ERGAENZUNGEN || {})[sym] || [], ergaenzt = 0;
  erg.forEach(function (x) { if (!ausJe[x.ex_date]) { ausJe[x.ex_date] = [x.rate]; ergaenzt++; } });
  var jeJahr = {}; Object.keys(ausJe).forEach(function (k) { jeJahr[k.slice(0, 4)] = (jeJahr[k.slice(0, 4)] || 0) + 1; });
  var splits = dv.filter(function (x) { return /split/.test(x._art); }).length;
  var reihe = Object.keys(tage).sort().map(function (k) { var t = tage[k]; return { datum: k, eroeffnung: t.auf, schluss: t.s16 > 0 ? t.s16 : t.letzt, aus: ausJe[k] || [], aufMin: t.aufMin }; })
    .filter(function (x) { return x.eroeffnung > 0 && x.schluss > 0 && x.aufMin <= 600; });
  var nichtGefunden = Object.keys(ausJe).filter(function (k) { return !tage[k]; });
  return { reihe: reihe, splits: splits, ausschuettungen: Object.keys(ausJe).length, ergaenzt: ergaenzt, doppelt: doppelt, jeJahr: jeJahr, exTagOhneKerze: nichtGefunden };
}
function ausschnitt(reihe, von, bis) { return reihe.filter(function (x) { return x.datum >= von && x.datum <= bis; }); }
/** Gesamtertrag mit voll wieder angelegten Ausschuettungen (Kauf zur Eroeffnung des Starttags, Ex-Tag am Starttag zaehlt nicht) - wie der SPY-Massstab. */
function gesamt(rs) {
  var st = 1 / rs[0].eroeffnung;
  rs.forEach(function (x, i) { if (i > 0) x.aus.forEach(function (a) { st += st * a / x.schluss; }); });
  return st * rs[rs.length - 1].schluss;
}
function jahre(von, bis) { return (Date.parse(bis + 'T00:00:00Z') - Date.parse(von + 'T00:00:00Z')) / (365.25 * 86400000); }
function pa(f, j) { return (Math.pow(f, 1 / j) - 1) * 100; }

function lauf() {
  var t0 = Date.now(), E = { kennung: 'momentum-wiedervorlage-2026-10-23/massstab/v1', erzeugt: new Date().toISOString(), quelle: {}, fenster: {}, steuer: {}, gegenprobe: {} };
  var Q = tagesreihe('QQQ'), SP = tagesreihe('SPY');
  E.quelle = { QQQ: { tage: Q.reihe.length, von: Q.reihe[0].datum, bis: Q.reihe[Q.reihe.length - 1].datum, ausschuettungen: Q.ausschuettungen, jeJahr: Q.jeJahr, ergaenzt: Q.ergaenzt, doppelt: Q.doppelt, splits: Q.splits, exTagOhneKerze: Q.exTagOhneKerze },
    SPY: { tage: SP.reihe.length, ausschuettungen: SP.ausschuettungen, jeJahr: SP.jeJahr, ergaenzt: SP.ergaenzt, doppelt: SP.doppelt, splits: SP.splits, exTagOhneKerze: SP.exTagOhneKerze } };
  console.log('QQQ', JSON.stringify(E.quelle.QQQ), 'SPY', JSON.stringify(E.quelle.SPY));

  /* ---------- Teil 1: Massstab brutto je Fenster und Startphase ---------- */
  ['A-187', 'B-187'].forEach(function (lname) {
    var f = SIEGEL.laeufe[lname].fenster, ph = SIEGEL.laeufe[lname].mit.startphasen.phasen, fen = lname.charAt(0);
    var aus = { von: f.von, bis: f.bis, phasen: [] };
    ph.forEach(function (p) {
      var rq = ausschnitt(Q.reihe, p.start, f.bis), rs = ausschnitt(SP.reihe, p.start, f.bis), j = jahre(p.start, f.bis);
      if (rq[0].datum !== p.start || rq[rq.length - 1].datum !== f.bis) throw new Error('KLINKE: QQQ ohne Tag ' + p.start + '/' + f.bis);
      var gq = gesamt(rq), gs = gesamt(rs);
      aus.phasen.push({ k: p.k, start: p.start, jahre: j, qqqGesamt: (gq - 1) * 100, qqqPa: pa(gq, j), spyMinGesamt: (gs - 1) * 100, spyMinPa: pa(gs, j), spyPanelPa: p.spyPa, spyPanelGesamt: p.spyGesamt });
    });
    var a0 = aus.phasen[0];
    aus.k0 = a0;
    aus.gegenprobeSpy = { maxAbweichungPaPp: Math.max.apply(null, aus.phasen.map(function (x) { return Math.abs(x.spyMinPa - x.spyPanelPa); })),
      k0: { minuten: a0.spyMinGesamt, panel: a0.spyPanelGesamt } };
    E.fenster[fen] = aus;
    console.log('Fenster ' + fen + ': QQQ ' + a0.qqqGesamt.toFixed(2) + ' % (' + a0.qqqPa.toFixed(2) + ' p. a.), SPY Minuten ' + a0.spyMinGesamt.toFixed(2) + ' / Panel ' + a0.spyPanelGesamt.toFixed(2) +
      ' %; groesste Abweichung SPY p. a. ueber 63 Phasen ' + aus.gegenprobeSpy.maxAbweichungPaPp.toFixed(3) + ' Pp');
  });
  fs.writeFileSync(path.join(__dirname, 'massstab.json'), JSON.stringify(E, null, 1));
  if (process.argv.indexOf('--nur-brutto') >= 0) return;

  /* ---------- Teil 2: nach Steuer. Regel K ueber eine schlichte Huelle (planen und ausfuehren mit kleinstAnteil 0,05) ---------- */
  RECHNEN = JSON.parse(fs.readFileSync(path.join(__dirname, 'ergebnis.json'), 'utf8'));
  if (!RECHNEN.vollstaendig) throw new Error('KLINKE: rechnen.js ist nicht fertig');
  var V = KS.vorbereitung();
  MH.planeUmschichtung = function (z, b, p) { return KS.ECHT.planeUmschichtung(z, b, p, { kleinstAnteil: KS.ANTEIL }); };
  MH.fuehreAus = function (b, plan, ms, bp) { return KS.ECHT.fuehreAus(b, plan, ms, bp, { kleinstAnteil: KS.ANTEIL }); };
  var bp0 = R.KOSTEN_BP;
  SZ.forEach(function (szName) {
    E.steuer[szName] = {};
    KS.LAEUFE.forEach(function (def) {
      var t1 = Date.now(), r = RECHNEN.ergebnisse[szName][def.name], bp = szName === 'alt-20bp' ? 20 : r.k0.bpJeSeiteEffektiv;
      delete require.cache[require.resolve(STEUER)];
      R.KOSTEN_BP = bp;
      var ST = require(STEUER);
      R.KOSTEN_BP = bp0;
      var F = V.F[def.fenster], fen = def.fenster, ph = SIEGEL.laeufe[def.name].mit.startphasen.phasen, aus = [];
      var parQ = ST.mit(ST.MODELL, { kostenPa: ETF.ter - TER_QQQ }), parS = ST.MODELL;
      /* Gegenprobe vor Steuern bei k = 0: Steuerrechner mit Satz 0 gegen den Rueckblick (alt: gegen das Siegel auf das Bit; neu: gegen rechnen.js) */
      var L0 = ST.simuliere(V.T, V.Q, V.M, { startTag: F.von, endTag: F.bis, totalverlust: V.haupt, korb: def.korb, mechanik: 'app', steuersatz: 0 });
      var vorSoll = szName === 'alt-20bp' ? SIEGEL.laeufe[def.name].mit.k0.buchEnde : r.k0.buchEnde;
      for (var k = 0; k < 63; k++) {
        var st = V.Q.ptage[V.Q.ord[F.von] + k], start = String(V.T.kal.tage[st]);
        if (start !== ph[k].start) throw new Error('KLINKE: Startphase ' + k + ' ' + start + ' / ' + ph[k].start);
        var L1 = ST.simuliere(V.T, V.Q, V.M, { startTag: st, endTag: F.bis, totalverlust: V.haupt, korb: def.korb, mechanik: 'app', steuersatz: ST.MODELL.steuersatz });
        var j = ST.jahreVon(V.Q, st, F.bis);
        var rq = ausschnitt(Q.reihe, start, SIEGEL.laeufe[def.name].fenster.bis);
        var fq = ST.fonds(rq, R.START, parQ), fs0 = ST.fonds(ST.spyReihe(V.T, V.Q, V.M, st, F.bis), R.START, parS);
        aus.push({ k: k, start: start, buchB: ST.pa(L1.endBuchVerkauft, j), buchA: ST.pa(L1.endBuch, j), nasdaqB: ST.pa(fq.endB, j), nasdaqA: ST.pa(fq.endA, j), spyB: ST.pa(fs0.endB, j),
          steuerBuch: L1.steuer.gesamtB, steuerNasdaq: fq.gesamtB, steuerSpy: fs0.gesamtB });
      }
      var med = function (f) { return R.median(aus.map(f)); };
      E.steuer[szName][def.name] = { bpJeSeite: bp, vorSteuernK0: { steuerrechner: L0.endBuch, soll: vorSoll, abweichung: L0.endBuch - vorSoll, bitgleich: L0.endBuch === vorSoll },
        k0: aus[0], median: { buchB: med(function (x) { return x.buchB; }), nasdaqB: med(function (x) { return x.nasdaqB; }), spyB: med(function (x) { return x.spyB; }),
          abstandNasdaqB: med(function (x) { return x.buchB - x.nasdaqB; }), abstandSpyB: med(function (x) { return x.buchB - x.spyB; }) },
        vornGegenNasdaqB: aus.filter(function (x) { return x.buchB > x.nasdaqB; }).length, vornGegenSpyB: aus.filter(function (x) { return x.buchB > x.spyB; }).length, phasen: aus };
      var s = E.steuer[szName][def.name];
      console.log(szName + ' ' + def.name + ' (' + bp.toFixed(2) + ' Bp): vor Steuern k0 ' + L0.endBuch.toFixed(2) + ' / Soll ' + vorSoll.toFixed(2) + '; nach Steuer k0 Buch ' + aus[0].buchB.toFixed(2) +
        ' Nasdaq ' + aus[0].nasdaqB.toFixed(2) + ' SPY ' + aus[0].spyB.toFixed(2) + '; Median Abstand Nasdaq ' + s.median.abstandNasdaqB.toFixed(2) + ' SPY ' + s.median.abstandSpyB.toFixed(2) +
        ' (' + ((Date.now() - t1) / 1000).toFixed(0) + ' s)');
      fs.writeFileSync(path.join(__dirname, 'massstab.json'), JSON.stringify(E, null, 1));
    });
  });
  /* Fonds-Ertrag vor Steuer (nachrichtlich): Nasdaq-UCITS mit 85 % Wiederanlage und TER-Aufschlag, Satz 0 */
  E.laufzeitSekunden = Math.round((Date.now() - t0) / 1000);
  E.vollstaendig = true;
  fs.writeFileSync(path.join(__dirname, 'massstab.json'), JSON.stringify(E, null, 1));
  console.log('fertig', E.laufzeitSekunden, 's');
}
module.exports = { tagesreihe: tagesreihe, gesamt: gesamt, nyVersatzStunden: nyVersatzStunden };
if (require.main === module) lauf();
