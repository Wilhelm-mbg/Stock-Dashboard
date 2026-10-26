'use strict';
/* Momentum 12-1 ueber Monate mit Halte-Band 40 - Form `korb` (FORM.md §3), Auftrag Nr. 125b (Vorregistrierung des PM, 26.10.2026).
 * REGEL.md nennt jeden Parameter mit Begruendung und Fundstelle. Simulation mit virtuellem Kapital, keine Anlageberatung.
 *
 * Die Zielfunktion IST das App-Buch: mfhandel.js momentumZiel (Live = Messung) - kein eigenes Rangmass, keine Kopie. Dazu kommen nur zwei Dinge:
 *  1. Schnitt am Stichtag: Zeilen mit Zeit > opts.nowMs werden vor dem Aufruf entfernt. momentumZiel nimmt die LETZTE Zeile jeder Reihe als
 *     "heute" (nowMs prueft nur das Alter) - ohne den Schnitt saehe eine Regel, die Zeilen nach dem Stichtag bekommt, in die Zukunft
 *     (Zweitleser 6). Im Pruefstrassen-Lauf ist der Schnitt wirkungslos (rueckblick.js rohMapAm schneidet schon am Stichtag); test.js prueft beides.
 *  2. Klinke auf das Band: anzahl 20 und halteBand 40 MUESSEN vom Adapter kommen (korb.js zielMitAnzahl, korb-kosten.js bandOpts); fehlen sie,
 *     liefe das Buch mit 40 Positionen statt 20 aus einer Rangliste von 40 - deshalb lauter Abbruch statt stiller Abweichung.
 * Die Auswahl mit dem Bestand (gehalten bis Platz 40, aufgefuellt in Rangfolge bis 20) trifft mfhandel.js zielMitBand in der Huelle
 * (Nr. 125a B2) - die Zielfunktion liefert nur die Rangliste OHNE Bestand (korb.js speichert Ziele je Stichtag fuer alle Startphasen und Buecher).
 * Universum: konfigurationen[0].korb = 100 -> korb.js korbWaehlen nimmt die 100 umsatzstaerksten ZULAESSIGEN Werte aus `rangfolge` (20-Balken-
 * Median-Dollarumsatz, Gleichstand nach Kuerzel) und ruft die Zielfunktion ein zweites Mal nur mit diesen 100 (Schritt d). */
var path = require('path');
var crypto = require('crypto');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
var KAND = require('./kandidat.json');
var P = KAND.params, KONF = KAND.konfigurationen[0], TAG_MS = 86400000;

/** Nur Zeilen mit Zeit <= nowMs; eine Reihe ganz ohne solche Zeile faellt weg (wie rohMapAm: "noch keine Zeile bis s"). Zeilen sind zeitlich sortiert. */
function schnitt(roh, nowMs) {
  var aus = {};
  Object.keys(roh).forEach(function (sym) {
    var r = roh[sym];
    if (!r || !r.length) { aus[sym] = r; return; }
    if (r[r.length - 1][0] <= nowMs) { aus[sym] = r; return; }
    var e = r.length;
    while (e > 0 && !(r[e - 1][0] <= nowMs)) e--;
    if (e > 0) aus[sym] = r.slice(0, e);
  });
  return aus;
}
/** Stichtag, Zielzahl und Band muessen vom Adapter kommen - sonst kein Lauf. */
function optsPruefen(o, wer) {
  if (!(o && o.nowMs > 0)) throw new Error('KLINKE: ' + wer + ' ohne Stichtag (opts.nowMs)');
  if (o.anzahl !== KONF.anzahl || o.halteBand !== P.halteBand) {
    throw new Error('KLINKE: ' + wer + ' verlangt anzahl ' + KONF.anzahl + ' und halteBand ' + P.halteBand + ' vom Adapter (bekommen ' + o.anzahl + ' / ' + o.halteBand + ') - ohne Band kein Lauf');
  }
}
/** Die vorregistrierten Zahlen ausdruecklich an momentumZiel (test.js haelt sie gegen mfhandel.js buchKonfig: Live = Messung). */
function zielOpts(o) {
  return { nowMs: o.nowMs, anzahl: KONF.anzahl, halteBand: P.halteBand, rueckblick: P.rueckblick, luecke: P.luecke, umsatzMin: P.umsatzMin,
    umsatzFenster: P.umsatzFenster, minWerte: P.mindestWerte, maxAlterMs: P.maxAlterTage * TAG_MS };
}

/** Zielfunktion: Rangliste der 40 staerksten (12-1, App-Buch) in Rangfolge, anzahl 20 im Feld `anzahl`; rangfolge/korb fuer die Korbauswahl. */
function zielfunktion(roh, opts) {
  optsPruefen(opts, 'zielfunktion');
  return MH.momentumZiel(schnitt(roh, opts.nowMs), zielOpts(opts));
}

/** Placebo: dieselben zulaessigen Werte (gleiche Filter, gleiche rangfolge -> gleiches Universum), Zufallsrang je Stichtag aus
 *  sha256(placeboWort|nowMs|Kuerzel) (wie adapter/korb.js zufallsZiel, Nr. 100), Rangliste derselben Laenge (halteBand) - das Band wirkt in der Huelle
 *  genauso wie beim Kandidaten. Die Staerke geht in die Auswahl nicht ein. */
function placeboZiel(roh, opts) {
  optsPruefen(opts, 'placeboZiel');
  if (!opts.placeboWort) throw new Error('KLINKE: placeboZiel ohne placeboWort');
  var r = MH.momentumZiel(schnitt(roh, opts.nowMs), zielOpts(opts));
  if (r.zuWenig) return r;
  var h = function (s) { return crypto.createHash('sha256').update(opts.placeboWort + '|' + opts.nowMs + '|' + s).digest('hex'); };
  var z = r.rangfolge.map(function (p) { return { sym: p.sym, h: h(p.sym) }; })
    .sort(function (a, b) { return a.h < b.h ? -1 : a.h > b.h ? 1 : (a.sym < b.sym ? -1 : a.sym > b.sym ? 1 : 0); })
    .slice(0, r.ziel.length).map(function (x) { return x.sym; });
  return Object.assign({}, r, { ziel: z, placebo: true });
}

module.exports = { zielfunktion: zielfunktion, placeboZiel: placeboZiel, schnitt: schnitt, zielOpts: zielOpts, PARAMS: P, KONF: KONF };
