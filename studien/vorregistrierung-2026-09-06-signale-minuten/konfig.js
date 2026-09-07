'use strict';
/* KONFIGURATION der Signalstudie Minuten (VORREGISTRIERUNG.md + Nachtrag 1, 06./07.09.2026).
 *
 * Alles, was die Vorregistrierung als Zahl festlegt, steht hier GENAU EINMAL - messen.js,
 * auswerten.js und test.js lesen es von hier. Wer eine Zahl aendert, aendert die Studie;
 * test.js haelt die Zahlen gegen die Quellen (wiki/kosten.md, kosten.js, liquide.js,
 * messgeschirr.js) und wird rot.
 *
 * Dazu das ZELLENLAYOUT: die Messung legt keine Signale auf die Platte, sondern Summen
 * (n, Summe, Quadratsumme, Summe der Einstiegsfenster-Huerde) je (Reihe, Richtung, Haltedauer,
 * ET-Tag, Umsatzklasse, lebend). "Reihe" ist hier eine Zeile der Zellentabelle: Kandidat
 * (Detektor x Zeitrahmen), Placebo A (gleichverteilt, zufaellige Richtung) oder Placebo B
 * (gepaart: gleiches 30-Minuten-Fenster und gleiche Richtung wie das echte Signal).
 * Der Topf (alle zulaessigen Kerzen, Long-Ertrag) hat ein eigenes, kleineres Feld.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');

/* ---------- Orte (nur lesen) ---------- */
function archivWurzel() {
  return process.env.MD_ALPACA_WURZEL || 'E:/Markt-Dashboard-Archiv';
}
var ORTE = {
  roh: function () { return path.join(archivWurzel(), 'alpaca1m'); },
  bereinigt: function () { return path.join(archivWurzel(), 'alpaca1m-bereinigt'); },
  massnahmen: function () { return path.join(archivWurzel(), 'alpaca-massnahmen'); },
};

/* ---------- Datenfenster und Schnitte (§2, §5, §7c) ---------- */
var FENSTER = { von: '2016-01-01', bis: '2026-08-31' };      // ET-Tage, beide einschliesslich
var BESTAETIGUNG_AB = '2023-02-07';                          // §5: erster Bestaetigungstag (2/3-Regel, aus dem Kalender)
var REGIME_AB = '2021-01-01';                                // §5: Bestaetigung wird allein ab hier geurteilt
var LEBEND_AB = '2026-08-17';                                // §7c: letzter Balken >= diesem ET-Tag => lebend
var SPLIT_ANTEIL = 2 / 3;                                    // August-Regel Tier B

/* ---------- Zulaessigkeit und Haltedauern (§2; August: MIN_REST, COOLDOWN, HORIZONTE) ---------- */
var MIN_REST_MIN = 30;                                       // Minuten Sitzung nach Ende der Signalkerze
var COOLDOWN_MIN = 60;                                       // je (Reihe, Detektor, Zeitrahmen): t_i - t_letztes < 60 min => gesperrt
var DICHTE_MIN = 0.8;                                        // Nachtrag 1: Tag zaehlt nur mit >= 80 % der 1m-Sollkerzen (August-Regel)
var ZEITRAHMEN = [{ key: '1m', min: 1 }, { key: '5m', min: 5 }, { key: '15m', min: 15 }];
var HALTEDAUERN = [{ key: '1h', min: 60 }, { key: '3h', min: 180 }, { key: 'schluss', min: null }];
var RICHTUNGEN = [{ key: 'long', dir: 1 }, { key: 'short', dir: -1 }];
var PAAR_FENSTER_MIN = 30;                                   // Placebo B: 30-Minuten-Fenster der Signalkerze

/* ---------- Umsatzklassen und Kassa-Huerde (§3, Nachtrag 1; kosten.js UMSATZ_KLASSEN, wiki/kosten.md) ----------
 * huerde        = Fenster mitte ab 2021 (massgeblich, §3)
 * huerdeSchluss = Fenster schluss ab 2021 (Nachtrag 03.09. in kosten.md)
 * huerdeEroeffnung = mitte ab 2021 x (eroeffnung/mitte, alle Jahre gepoolt: 2,68 / 2,46 / 2,07 / 1,81) */
var KLASSEN = [
  { name: '5-50',     von: 5e6,   bis: 50e6,     huerde: 0.1569, huerdeSchluss: 0.1025, eroeffnungFaktor: 2.68 },
  { name: '50-250',   von: 50e6,  bis: 250e6,    huerde: 0.0854, huerdeSchluss: 0.0540, eroeffnungFaktor: 2.46 },
  { name: '250-1000', von: 250e6, bis: 1e9,      huerde: 0.0647, huerdeSchluss: 0.0409, eroeffnungFaktor: 2.07 },
  { name: 'ab1000',   von: 1e9,   bis: Infinity, huerde: 0.0449, huerdeSchluss: 0.0329, eroeffnungFaktor: 1.81 },
];
KLASSEN.forEach(function (k) { k.huerdeEroeffnung = Math.round(k.huerde * k.eroeffnungFaktor * 10000) / 10000; });
var UMSATZ_FENSTER = 20;                                     // liquide.js KORB.fenster; §3: Balkentage d-20..d-1
function klasseIndex(medianUsd) {
  if (!(medianUsd >= 0) || !isFinite(medianUsd)) return -1;
  for (var i = 0; i < KLASSEN.length; i++) if (medianUsd >= KLASSEN[i].von && medianUsd < KLASSEN[i].bis) return i;
  return -1;
}
/** Huerde nach dem Einstiegsfenster (Nachtrag 1, nachrichtliche zweite Nettogroesse):
 *  Einstiegskerze beginnt vor 10:00 ET => eroeffnung; ab 15:30 ET => schluss; sonst mitte. */
function huerdeFenster(klasse, minutenSeit0930) {
  var k = KLASSEN[klasse];
  if (minutenSeit0930 < 30) return k.huerdeEroeffnung;
  if (minutenSeit0930 >= 360) return k.huerdeSchluss;
  return k.huerde;
}

/* ---------- Kapitalmassnahmen (§8) ---------- */
var MASSNAHMEN_FENSTER_TAGE = 10;                            // +- Handelstage um den Ex-Tag
var MASSNAHMEN_ARTEN = ['forward_splits', 'reverse_splits', 'unit_splits', 'spin_offs'];
var ENDE_ARTEN = ['name_changes', 'cash_mergers', 'stock_mergers', 'stock_and_cash_mergers', 'worthless_removals', 'redemptions'];

/* ---------- Detektoren (§1, Nachtrag 1): die 13 der August-Tabelle, per require ---------- */
var DETEKTOR_KEYS = ['rsi2', 'rsi2seit', 'kapitulation', 'reversion', 'pullback', 'donchian', 'squeeze',
  'kanaltrend', 'wave', 'orb', 'signalCross', 'vwap-abstand', 'wendepunkt-trendwechsel'];
var FAMILIEN = {
  dip: ['rsi2', 'rsi2seit', 'kapitulation', 'reversion', 'vwap-abstand'],
  ausbruch: ['donchian', 'squeeze', 'orb', 'kanaltrend', 'signalCross', 'pullback', 'wave'],
  wende: ['wendepunkt-trendwechsel'],
};
/* Zeitrahmen EXPLIZIT statt 'auto' (Nachtrag 1): auf 1m gilt die 1m-Definition der Tabelle
 * (rsi2 mit 5-Min-Bestaetigung, reversion und wendepunkt auf der Tagesreihe), auf 5m/15m nicht -
 * unabhaengig davon, was barMinVon aus einer duennen Reihe liest. */
var PARAM_JE_ZR = {
  '1m':  { rsi2: { mtf: true },  reversion: { tagesreihe: true },  'wendepunkt-trendwechsel': { tagesreihe: true } },
  '5m':  { rsi2: { mtf: false }, reversion: { tagesreihe: false }, 'wendepunkt-trendwechsel': { tagesreihe: false } },
  '15m': { rsi2: { mtf: false }, reversion: { tagesreihe: false }, 'wendepunkt-trendwechsel': { tagesreihe: false } },
};
/* Aufruf-Fensterung (Nachtrag 1, Laufzeit): vwap-abstand liest bars[0..i] und wird damit quadratisch;
 * uebergeben wird ein Fenster, das an einem Tagesanfang beginnt und mindestens FENSTER_MIN_KERZEN vor i
 * enthaelt - die kumulative VWAP setzt je UTC-Tag neu auf, reversionSignal braucht 80 Abstaende + 20.
 * Gleichheit mit dem vollen Praefix prueft test.js Signal fuer Signal. */
var FENSTER_MIN_KERZEN = 110;
var GEFENSTERT = { 'vwap-abstand': true };
var TABELLE = null;
function detektoren() {
  if (TABELLE) return TABELLE;
  var tab = require(path.join(REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'));
  TABELLE = DETEKTOR_KEYS.map(function (k) {
    var d = tab.filter(function (x) { return x.key === k; })[0];
    if (!d) throw new Error('Detektor fehlt in der August-Tabelle: ' + k);
    return d;
  });
  return TABELLE;
}
/** Parameter eines Detektors fuer einen Zeitrahmen: Tabelle plus explizite Zeitrahmen-Setzung. */
function paramsFuer(D, zrKey) {
  var extra = (PARAM_JE_ZR[zrKey] || {})[D.key];
  return extra ? Object.assign({}, D.params || {}, extra) : (D.params || {});
}

/* ---------- Kalender der Quelle (ET-Handelstage im Fenster) ---------- */
var KAL = null;
function kalender() {
  if (KAL) return KAL;
  var p = path.join(ORTE.roh(), '_kalender.json');
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  var tage = Object.keys(j.tage).filter(function (t) { return t >= FENSTER.von && t <= FENSTER.bis; }).sort();
  var idx = {}; tage.forEach(function (t, i) { idx[t] = i; });
  var cut = Math.floor(tage.length * SPLIT_ANTEIL);
  KAL = { tage: tage, idx: idx, close: j.tage, bestaetigungAb: tage[cut], nEnt: cut, nBes: tage.length - cut };
  return KAL;
}

/* ---------- Zellenlayout ---------- */
var N_DET = DETEKTOR_KEYS.length, N_ZR = ZEITRAHMEN.length, N_H = HALTEDAUERN.length, N_K = KLASSEN.length;
var N_KAND = N_DET * N_ZR;                                   // 39
var ARTEN = ['kandidat', 'placeboA', 'placeboB'];
var N_REIHEN = ARTEN.length * N_KAND;                        // 117
function kandIndex(detIdx, zrIdx) { return detIdx * N_ZR + zrIdx; }
/** art: 0 Kandidat, 1 Placebo A (gleichverteilt, Zufallsrichtung), 2 Placebo B (gepaart). `true` = 1. */
function reiheIndex(kand, art) { var a = art === true ? 1 : (art || 0); return a * N_KAND + kand; }
/* Zelle: ((((reihe*2+dir)*N_H+h)*nTage+tag)*N_K+klasse)*2+lebend */
function zelle(nTage, reihe, dirIdx, h, tag, klasse, lebend) {
  return ((((reihe * 2 + dirIdx) * N_H + h) * nTage + tag) * N_K + klasse) * 2 + lebend;
}
function zellenZahl(nTage) { return N_REIHEN * 2 * N_H * nTage * N_K * 2; }
/* Topf: (((zr*N_H+h)*nTage+tag)*N_K+klasse)*2+lebend */
function topfZelle(nTage, zrIdx, h, tag, klasse, lebend) {
  return (((zrIdx * N_H + h) * nTage + tag) * N_K + klasse) * 2 + lebend;
}
function topfZahl(nTage) { return N_ZR * N_H * nTage * N_K * 2; }

/* Kennung der Konfiguration, damit ein Checkpoint nie mit einer anderen Studie verwechselt wird. */
var KONFIG_KENNUNG = 'signale-minuten-2026-09-06/v2/' + N_DET + 'x' + N_ZR + 'x' + N_H + 'x' + N_K + 'x' + ARTEN.length;

module.exports = {
  REPO: REPO, HIER: HIER, ORTE: ORTE, archivWurzel: archivWurzel,
  FENSTER: FENSTER, BESTAETIGUNG_AB: BESTAETIGUNG_AB, REGIME_AB: REGIME_AB, LEBEND_AB: LEBEND_AB, SPLIT_ANTEIL: SPLIT_ANTEIL,
  MIN_REST_MIN: MIN_REST_MIN, COOLDOWN_MIN: COOLDOWN_MIN, DICHTE_MIN: DICHTE_MIN, PAAR_FENSTER_MIN: PAAR_FENSTER_MIN,
  ZEITRAHMEN: ZEITRAHMEN, HALTEDAUERN: HALTEDAUERN, RICHTUNGEN: RICHTUNGEN,
  KLASSEN: KLASSEN, UMSATZ_FENSTER: UMSATZ_FENSTER, klasseIndex: klasseIndex, huerdeFenster: huerdeFenster,
  MASSNAHMEN_FENSTER_TAGE: MASSNAHMEN_FENSTER_TAGE, MASSNAHMEN_ARTEN: MASSNAHMEN_ARTEN, ENDE_ARTEN: ENDE_ARTEN,
  DETEKTOR_KEYS: DETEKTOR_KEYS, FAMILIEN: FAMILIEN, detektoren: detektoren, paramsFuer: paramsFuer, PARAM_JE_ZR: PARAM_JE_ZR,
  FENSTER_MIN_KERZEN: FENSTER_MIN_KERZEN, GEFENSTERT: GEFENSTERT,
  kalender: kalender,
  N_DET: N_DET, N_ZR: N_ZR, N_H: N_H, N_K: N_K, N_KAND: N_KAND, N_REIHEN: N_REIHEN, ARTEN: ARTEN,
  kandIndex: kandIndex, reiheIndex: reiheIndex, zelle: zelle, zellenZahl: zellenZahl, topfZelle: topfZelle, topfZahl: topfZahl,
  KONFIG_KENNUNG: KONFIG_KENNUNG,
};
