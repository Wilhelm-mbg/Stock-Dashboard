'use strict';
/* Trendfilter-Messung - Regel R1 "Faber 10 Monate" (REGEL.md §1 und §4.1, Siegel 6f9d06f).
 *
 * An jedem Monatsende M (letzter SPY-Handelstag eines Kalendermonats; der abgeschnittene letzte Datentag ist keins, kern.js L5):
 *   P     = TR_SPY(M)       Gesamtertragsindex von SPY (Schluss + Ausschuettungen, REGEL §2.5; gerechnet in kern.baueDaten)
 *   SMA10 = Mittel von TR_SPY an den zehn Monatsenden M, M-1, ..., M-9 (M eingeschlossen)
 *   P > SMA10 -> 'SPY', sonst -> opt.geld ('BIL' Hauptlesart, 'SHY' Ersatz). Gleichstand P = SMA10 heisst "nicht darueber" -> Geld.
 * Ausfuehrung zur Eroeffnung des ersten Handelstags nach M: das leistet K.monatlich (ziel am Monatsende selbst ist noch das alte).
 * M-k ist das Monatsende k Kalendermonate vor M (K.monatsendeVor, wie M-12 bei R2). Fehlt eines der zehn Monatsenden in den Daten
 * oder hat SPY dort keinen Gesamtertragswert, ist die Regel an M nicht berechenbar: Entscheidung null. Auf dem echten SPY-Kalender
 * hat jeder Kalendermonat von 01/1993 bis 08/2026 ein Monatsende (404 Stueck, in test-R1.js geprueft); die erste Entscheidung
 * faellt am zehnten Monatsende, dem 29.10.1993, gehalten ab der Eroeffnung des 01.11.1993.
 * Das Signal liest nur SPY. Ob die Geld-Reihe am Signaltag schon handelt, prueft die Regel nicht - das Buch beginnt in A, B und im
 * Zusatz lange nach dem ersten Kurs von BIL bzw. SHY.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node studien/trendfilter-messung-2026-10/regel-R1.js [--daten <ordner>]
 * schreibt signale-R1.json: NUR das Signal (Monatsenden mit Zielwechsel und P/SMA10, Zahl und Tage der Wechsel je Fenster aus dem
 * Ziel-Feld). Keine Buchwerte, keine Ertraege, keine Kursreihen.
 */
var fs = require('fs');
var path = require('path');
var K = require('./kern.js');

var MONATE = 10;

function geldAus(opt) {
  var g = opt && opt.geld;
  if (typeof g !== 'string' || !g || g === 'SPY') throw new Error('R1: opt.geld fehlt oder ist ungueltig: ' + JSON.stringify(g));
  return g;
}

/** Entscheidung am Monatsende m: { verhaeltnis: P / SMA10, ziel } oder null (nicht berechenbar). */
function entscheide(D, m, geld) {
  var tr = D.reihen.SPY.tr;
  var summe = 0;
  for (var k = 0; k < MONATE; k++) {
    var j = K.monatsendeVor(D, m, k);
    if (j < 0 || !(tr[j] > 0)) return null;
    summe += tr[j];
  }
  var p = tr[m];
  var sma = summe / MONATE;
  return { verhaeltnis: p / sma, ziel: p > sma ? 'SPY' : geld };
}

/** Ziel-Feld der Laenge D.n: ziel[i] = Reihe ab der Eroeffnung von Tag i ('SPY' oder opt.geld), null solange nicht berechenbar. */
function signal(D, opt) {
  var geld = geldAus(opt);
  return K.monatlich(D, function (m) {
    var e = entscheide(D, m, geld);
    return e ? e.ziel : null;
  });
}

/** Je Monatsende (auch die nicht berechenbaren am Anfang): { tag, verhaeltnis: P / SMA10 oder null, ziel oder null }. */
function details(D, opt) {
  var geld = geldAus(opt);
  var aus = [];
  for (var m = 0; m < D.n; m++) {
    if (!D.monatsende[m]) continue;
    var e = entscheide(D, m, geld);
    aus.push({ tag: D.tage[m], verhaeltnis: e ? e.verhaeltnis : null, ziel: e ? e.ziel : null });
  }
  return aus;
}

module.exports = { name: 'R1', titel: 'Faber 10 Monate', art: 'monatlich', signal: signal, details: details };

/* ---------------- signale-R1.json (nur Signal) ---------------- */

/** Monatsenden mit Zielwechsel im Bereich [von, bis] (JJJJ-MM), dazu der Zustand am Monatsende davor. */
function wechselMonatsenden(D, det, von, bis) {
  var vorher = null;
  var liste = [];
  for (var k = 0; k < det.length; k++) {
    var x = det[k];
    var monat = x.tag.slice(0, 7);
    if (monat < von) { vorher = x; continue; }
    if (monat > bis) break;
    var alt = k > 0 ? det[k - 1].ziel : null;
    if (x.ziel !== alt) {
      liste.push({ monatsende: x.tag, ausfuehrung: D.tage[D.idx[x.tag] + 1], von: alt, nach: x.ziel, verhaeltnis: x.verhaeltnis });
    }
  }
  return {
    von: von, bis: bis,
    zustandDavor: vorher && { monatsende: vorher.tag, ziel: vorher.ziel, verhaeltnis: vorher.verhaeltnis },
    zahl: liste.length,
    wechsel: liste
  };
}

/** Wechsel im Fenster f beim Start am ersten Tag (k = 0), aus dem Ziel-Feld gezaehlt: jeder Tag i in (s, e] mit ziel[i] != ziel[i-1]. */
function fensterWechsel(D, ziel, f) {
  var s = K.starttage(D, f)[0];
  var e = K.endIndex(D, f.ende);
  var tage = [];
  for (var i = s + 1; i <= e; i++) {
    if (ziel[i] === ziel[i - 1]) continue;
    if (!D.monatsende[i - 1]) throw new Error('Zielwechsel nicht am Tag nach einem Monatsende: ' + D.tage[i]);
    tage.push({ ausfuehrung: D.tage[i], signaltag: D.tage[i - 1], von: ziel[i - 1], nach: ziel[i] });
  }
  return { start: D.tage[s], ende: D.tage[e], zielAmStart: ziel[s], wechsel: tage.length, tage: tage };
}

function schreibeSignale(ordner, ausDatei) {
  var D = K.ladeDaten(ordner);
  var detH = details(D, K.HAUPT);
  var detE = details(D, K.ERSATZ);
  var zielH = signal(D, K.HAUPT);
  var zielE = signal(D, K.ERSATZ);
  var berechenbar = detH.filter(function (x) { return x.ziel !== null; });
  var knapp = detH.filter(function (x) { return x.ziel !== null && x.tag >= '2016-01' && Math.abs(x.verhaeltnis - 1) < 0.01; })
    .map(function (x) { return { monatsende: x.tag, verhaeltnis: x.verhaeltnis, ziel: x.ziel }; });
  var naechster = berechenbar.reduce(function (a, x) { return Math.abs(x.verhaeltnis - 1) < Math.abs(a.verhaeltnis - 1) ? x : a; });
  var pruef = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefsummen.json'), 'utf8'));
  var aus = {
    kennung: 'trendfilter-messung-2026-10/v1',
    regel: 'R1', titel: 'Faber 10 Monate',
    hinweis: 'Nur das Signal (REGEL §4.1). Keine Buchwerte, keine Ertraege, keine Kurse. verhaeltnis = TR_SPY(M) / Mittel TR_SPY(M..M-9), ungerundet. ' +
      'Simulation, keine Anlageberatung.',
    daten: { quelle: 'daten/SPY.json (Yahoo-Chart), Abruf ' + pruef.abgerufenUtc, shaKanonischSPY: pruef.reihen.SPY.shaKanonisch,
      kalender: D.tage[0] + ' bis ' + D.tage[D.n - 1], monatsenden: detH.length, ersteEntscheidung: berechenbar[0].tag,
      letztesMonatsende: detH[detH.length - 1].tag },
    knappsteEntscheidung1993bis2026: { monatsende: naechster.tag, verhaeltnis: naechster.verhaeltnis, ziel: naechster.ziel },
    hauptlesart: Object.assign({ geld: K.HAUPT.geld }, wechselMonatsenden(D, detH, '2016-01', '2026-08')),
    ersatz: Object.assign({ geld: K.ERSATZ.geld, bemerkung: 'Zeitpunkte unabhaengig von der Geld-Reihe; 2016 steht auch in der Hauptlesart' },
      wechselMonatsenden(D, detE, '2003-01', '2016-12')),
    knappAb2016: { schwelle: '|verhaeltnis - 1| < 0,01', monatsenden: knapp },
    fenster: {
      A: fensterWechsel(D, zielH, K.FENSTER.A),
      B: fensterWechsel(D, zielH, K.FENSTER.B)
    },
    fensterErsatz: {
      A: fensterWechsel(D, zielE, K.FENSTER.A).wechsel,
      B: fensterWechsel(D, zielE, K.FENSTER.B).wechsel
    }
  };
  fs.writeFileSync(ausDatei, JSON.stringify(aus, null, 2) + '\n');
  return aus;
}

if (require.main === module) {
  var i = process.argv.indexOf('--daten');
  var ordner = i >= 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : path.join(__dirname, 'daten');
  var a = schreibeSignale(ordner, path.join(__dirname, 'signale-R1.json'));
  console.log('signale-R1.json geschrieben: Hauptlesart ' + a.hauptlesart.zahl + ' Wechsel-Monatsenden 2016-01..2026-08, Ersatz ' +
    a.ersatz.zahl + ' (2003-01..2016-12); Fenster A ' + a.fenster.A.wechsel + ' Wechsel, B ' + a.fenster.B.wechsel + ' Wechsel');
}
