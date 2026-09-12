'use strict';
/* KONFIGURATION der Studie Trendwende II (VORREGISTRIERUNG.md, 12.09.2026).
 *
 * HERKUNFT: Muster und gemeinsame Zahlen aus studien/vorregistrierung-2026-09-06-signale-minuten/konfig.js
 * (v4, 07.09.2026) - Kalender, Umsatzklassen, Kassa-Huerden, Split, Lebend-Regel, Cent-Boden, Massnahmenfenster,
 * Zulaessigkeit kommen per require VON DORT (unveraendert wiederverwendet, nicht kopiert), damit beide Studien
 * dieselbe Huerde und denselben Kalender meinen. Eigen sind: Detektortabelle (detektoren.js), fuenf Haltedauern
 * (mit Uebernacht), Schein-Huerden, Aktualitaets-Tor, Jahresscheiben, Regime, Zellenlayout, Kennung.
 *
 * Alles, was die Vorregistrierung als Zahl festlegt, steht hier GENAU EINMAL - messen.js, auswerten.js und
 * test.js lesen es von hier. test.js haelt die Zahlen gegen die Quellen (wiki/kosten.md, BERICHT.md, kosten.js,
 * liquide.js, hauptstudie.js) und wird rot, wenn sie abweichen.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var path = require('path');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');
var MINUTEN = path.join(REPO, 'studien', 'vorregistrierung-2026-09-06-signale-minuten');
var KANAL = path.join(REPO, 'studien', 'vorregistrierung-2026-09-08-trendkanal-tage');
var KM = require(path.join(MINUTEN, 'konfig.js'));

/* ---------- Aus der Minutenstudie, unveraendert (§1) ---------- */
var ORTE = KM.ORTE, archivWurzel = KM.archivWurzel;
var FENSTER = KM.FENSTER, BESTAETIGUNG_AB = KM.BESTAETIGUNG_AB, REGIME_AB = KM.REGIME_AB, LEBEND_AB = KM.LEBEND_AB, SPLIT_ANTEIL = KM.SPLIT_ANTEIL;
var MIN_REST_MIN = KM.MIN_REST_MIN, COOLDOWN_MIN = KM.COOLDOWN_MIN, DICHTE_MIN = KM.DICHTE_MIN, PAAR_FENSTER_MIN = KM.PAAR_FENSTER_MIN;
var ZEITRAHMEN = KM.ZEITRAHMEN, RICHTUNGEN = KM.RICHTUNGEN;
var KLASSEN = KM.KLASSEN, UMSATZ_FENSTER = KM.UMSATZ_FENSTER, klasseIndex = KM.klasseIndex, huerdeFenster = KM.huerdeFenster;
var CENT_BODEN_USD = KM.CENT_BODEN_USD, centBodenPp = KM.centBodenPp, ueberCentBoden = KM.ueberCentBoden;
var MASSNAHMEN_FENSTER_TAGE = KM.MASSNAHMEN_FENSTER_TAGE, MASSNAHMEN_ARTEN = KM.MASSNAHMEN_ARTEN, ENDE_ARTEN = KM.ENDE_ARTEN;
var kalender = KM.kalender;

/* ---------- Haltedauern (§3): fuenf, die letzte ueber Nacht ---------- */
var HALTEDAUERN = [
  { key: '15m', min: 15 },
  { key: '1h', min: 60 },
  { key: '3h', min: 180 },
  { key: 'schluss', min: null },                              // Schluss der letzten regulaeren Kerze (Nachtrag 1.14 dort)
  { key: 'naechste', min: null, uebernacht: true },           // Eroeffnung der ersten regulaeren Kerze des naechsten Kalender-Handelstags
];
var H_UEBERNACHT = 4;

/* ---------- Schein-Huerden (§4): Konstanten aus studien/signalstudie-2026-08/BERICHT.md, Tabelle
 * "Produkt | Hebel | 3 h | 1 Tag | 1 Woche | 3 Wochen" (Pp des Basiswerts je Umlauf). test.js liest die Tabelle
 * aus der Datei und haelt diese Zahlen dagegen. 15m und 1h bekommen den 3-h-Wert (Untergrenze der Tabelle). */
var SCHEINE = [
  { key: 'bv1', name: 'Schein BV 1,0 ATM 60 T', berichtZeile: /Schein ATM 60 T, BV 1,0/, hebel: 9.8, kurz: 0.05, tag: 0.16 },
  { key: 'standard', name: 'Standard-Schein ATM 21 T', berichtZeile: /Schein ATM 21 T \(Standard\)/, hebel: 16.2, kurz: 0.23, tag: 0.42 },
];
function schein(key) { return SCHEINE.filter(function (s) { return s.key === key; })[0]; }
/** Schein-Huerde je Produkt und Haltedauer: 'schluss' und 'naechste' = Tageswert, sonst 3-h-Wert. */
function scheinHuerde(key, hKey) { var s = schein(key); return (hKey === 'schluss' || hKey === 'naechste') ? s.tag : s.kurz; }

/* ---------- Detektoren (§2) ----------
 * NACHTRAG 3 (12.09.2026, Entscheid PM): der Trendfolge-Detektor (August-Funktion `kanaltrend`, hier bis dahin W8)
 * ist gestrichen - er ist nach Code eine EMA20-Kreuzung in Kanalrichtung, also Trendfolge und kein Wende-Detektor.
 * Damit acht Detektoren, 15 Detektor-Richtungen, 225 Konfigurationen. */
var DETEKTOR_KEYS = ['W1a', 'W1b', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
var NUR_LONG = { W3: true };
var FAMILIEN = {
  'wende-winkel': ['W1a', 'W1b', 'W2'],
  'wende-struktur': ['W4', 'W5', 'W6', 'W7'],
  dip: ['W3'],
};
/* Zeitrahmen EXPLIZIT (Nachtrag 1.10 dort): W2 auf 1m Tagesreihe, 5m/15m fortlaufend. */
var PARAM_JE_ZR = {
  '1m': { W2: { tagesreihe: true } },
  '5m': { W2: { tagesreihe: false } },
  '15m': { W2: { tagesreihe: false } },
};
var TABELLE = null;
function detektoren() {
  if (TABELLE) return TABELLE;
  var tab = require(path.join(HIER, 'detektoren.js')).TABELLE;
  TABELLE = DETEKTOR_KEYS.map(function (k) {
    var d = tab.filter(function (x) { return x.key === k; })[0];
    if (!d) throw new Error('Detektor fehlt in detektoren.js: ' + k);
    return d;
  });
  return TABELLE;
}
function paramsFuer(D, zrKey) {
  var extra = (PARAM_JE_ZR[zrKey] || {})[D.key];
  return extra ? Object.assign({}, D.params || {}, extra) : (D.params || {});
}

/* ---------- Statistik (§6-§9) ---------- */
var Z_POWER80 = 0.8416;
var TOR1_FAKTOR = 4;
var MIN_BES_TAGE = 30;
var BAND_T = 3, BAND_PP = 0.045;                             // Placebo intraday gepoolt: |t| < 3 und |Mittel| < 0,045 Pp (Auftrag §2d)
var SE_ERWARTET_NAECHSTE = 0.0038;                           // Uebernacht-Placebo: |Mittel| < 3 x se_erwartet; Pilot 12.09.2026 (Nachtrag 2): se gepoolt 1m 0,0017 / 5m 0,0023 / 15m 0,0038 - der groesste Wert
var JEDE_KLASSE_ZU = KLASSEN[KLASSEN.length - 1].huerde;    // 0,0449
var AKTUELL_TAGE = 250, AKTUELL_MIN_TAGE = 10, AKTUELL_T_MIN = -2;   // Aktualitaets-Tor (§7.4)
/* NACHTRAG 4 (§19.3): Tor "Uhrzeit-Versatz". |haltezeit_kand / haltezeit_topf − 1| > 0,15 verhindert `belegt` fuer die
 * Haltedauern, deren Haltezeit an der Uhrzeit haengt ("bis Schluss", "naechste Eroeffnung"). VERSATZ_TOLERANZ ist die
 * Pruefschranke fuer die festen Haltedauern (dort ist der Versatz konstruktionsgemaess 0, Gitterluecken ausgenommen). */
var UHRZEIT_VERSATZ_MAX = 0.15, UHRZEIT_TOR_H = ['schluss', 'naechste'], VERSATZ_TOLERANZ = 0.05;
function uhrzeitTorGilt(hKey) { return UHRZEIT_TOR_H.indexOf(hKey) !== -1; }
var VORWAERTS_MIN_TAGE = 30, VORWAERTS_T = 2.0;                        // Kandidat fuer den Vorwaertstest (§7)
var JAHRE = []; for (var jj = 2016; jj <= 2026; jj++) JAHRE.push(jj);
var JAHR_MIN_TAGE = 10, TREND_MIN_TAGE = 30, TREND_MIN_JAHRE = 4;     // Jahresscheiben (§9)
var EMA_N = 200;                                                       // Regime SPY ueber/unter EMA200 (§9c)
var HH_LAG_UEBERNACHT = 2;                                             // Hansen-Hodrick Rechteck bis Lag 1 (§6) - L in der Notation der Kanalstudie
function lagVon(h) { return HALTEDAUERN[h].uebernacht ? HH_LAG_UEBERNACHT : 1; }
/* Planzahlen aus §11 (delta80 in Pp, k1 = 5), zum Danebenstellen. */
var PLAN = { '15m': { sd: 0.25, mde: 0.017, delta80: 0.029 }, '1h': { sd: 0.45, mde: 0.030, delta80: 0.051 }, '3h': { sd: 0.70, mde: 0.047, delta80: 0.080 }, schluss: { sd: 0.80, mde: 0.054, delta80: 0.091 }, naechste: { sd: 1.00, mde: 0.067, delta80: 0.114 } };

/* ---------- Zellenlayout (§10) - dieselben Formeln wie in der Minutenstudie ---------- */
var N_DET = DETEKTOR_KEYS.length, N_ZR = ZEITRAHMEN.length, N_H = HALTEDAUERN.length, N_K = KLASSEN.length;
var N_KAND = N_DET * N_ZR;                                   // 27
var ARTEN = ['kandidat', 'placeboA', 'placeboB'];
var N_REIHEN = ARTEN.length * N_KAND;                        // 81
function kandIndex(detIdx, zrIdx) { return detIdx * N_ZR + zrIdx; }
function reiheIndex(kand, art) { var a = art === true ? 1 : (art || 0); return a * N_KAND + kand; }
function zelle(nTage, reihe, dirIdx, h, tag, klasse, lebend) { return ((((reihe * 2 + dirIdx) * N_H + h) * nTage + tag) * N_K + klasse) * 2 + lebend; }
function zellenZahl(nTage) { return N_REIHEN * 2 * N_H * nTage * N_K * 2; }
function topfZelle(nTage, zrIdx, h, tag, klasse, lebend) { return (((zrIdx * N_H + h) * nTage + tag) * N_K + klasse) * 2 + lebend; }
function topfZahl(nTage) { return N_ZR * N_H * nTage * N_K * 2; }
/* Kurszelle: n, Σ Einstiegskurs (roh), Zahl ueber dem Cent-Boden und - NACHTRAG 3 - Σ EINSTIEGSLUECKE in Pp,
 * gemessen in Handelsrichtung: dir · (Eroeffnung_{i+1} − Schluss_i) / Schluss_i · 100 (die Richtung steckt im Index). */
function kursZelle(nTage, kand, dirIdx, tag, klasse, lebend) { return ((((kand * 2 + dirIdx) * nTage + tag) * N_K + klasse) * 2) + lebend; }
function kursZahl(nTage) { return N_KAND * 2 * nTage * N_K * 2; }
/* Haltezeitzelle (NACHTRAG 4, §19.2): wie die Kurszelle, aber MIT Haltedauer - die Haltezeit haengt an ihr. Zwei
 * Felder (Zahl der Beobachtungen, Σ Haltezeit in Sitzungsminuten). Nur Kandidaten, keine Placebos. */
function hzZelle(nTage, kand, dirIdx, h, tag, klasse, lebend) { return ((((((kand * 2 + dirIdx) * N_H + h) * nTage + tag) * N_K + klasse) * 2)) + lebend; }
function hzZahl(nTage) { return N_KAND * 2 * N_H * nTage * N_K * 2; }
var N_KONFIG = (2 * N_DET - Object.keys(NUR_LONG).length) * N_ZR * N_H;   // 225 (Nachtrag 3: ohne W8)

var KONFIG_KENNUNG = 'trendwende-ii-2026-09-09/v3/' + N_DET + 'x' + N_ZR + 'x2x' + N_H + 'x' + N_K + 'x' + ARTEN.length + '+kurs+luecke+haltezeit+schein+jahre';

module.exports = {
  REPO: REPO, HIER: HIER, MINUTEN: MINUTEN, KANAL: KANAL, KM: KM, ORTE: ORTE, archivWurzel: archivWurzel,
  FENSTER: FENSTER, BESTAETIGUNG_AB: BESTAETIGUNG_AB, REGIME_AB: REGIME_AB, LEBEND_AB: LEBEND_AB, SPLIT_ANTEIL: SPLIT_ANTEIL,
  MIN_REST_MIN: MIN_REST_MIN, COOLDOWN_MIN: COOLDOWN_MIN, DICHTE_MIN: DICHTE_MIN, PAAR_FENSTER_MIN: PAAR_FENSTER_MIN,
  ZEITRAHMEN: ZEITRAHMEN, HALTEDAUERN: HALTEDAUERN, H_UEBERNACHT: H_UEBERNACHT, RICHTUNGEN: RICHTUNGEN,
  KLASSEN: KLASSEN, UMSATZ_FENSTER: UMSATZ_FENSTER, klasseIndex: klasseIndex, huerdeFenster: huerdeFenster,
  CENT_BODEN_USD: CENT_BODEN_USD, centBodenPp: centBodenPp, ueberCentBoden: ueberCentBoden,
  MASSNAHMEN_FENSTER_TAGE: MASSNAHMEN_FENSTER_TAGE, MASSNAHMEN_ARTEN: MASSNAHMEN_ARTEN, ENDE_ARTEN: ENDE_ARTEN,
  SCHEINE: SCHEINE, schein: schein, scheinHuerde: scheinHuerde,
  DETEKTOR_KEYS: DETEKTOR_KEYS, NUR_LONG: NUR_LONG, FAMILIEN: FAMILIEN, PARAM_JE_ZR: PARAM_JE_ZR, detektoren: detektoren, paramsFuer: paramsFuer,
  Z_POWER80: Z_POWER80, TOR1_FAKTOR: TOR1_FAKTOR, MIN_BES_TAGE: MIN_BES_TAGE, BAND_T: BAND_T, BAND_PP: BAND_PP, SE_ERWARTET_NAECHSTE: SE_ERWARTET_NAECHSTE, JEDE_KLASSE_ZU: JEDE_KLASSE_ZU,
  AKTUELL_TAGE: AKTUELL_TAGE, AKTUELL_MIN_TAGE: AKTUELL_MIN_TAGE, AKTUELL_T_MIN: AKTUELL_T_MIN, VORWAERTS_MIN_TAGE: VORWAERTS_MIN_TAGE, VORWAERTS_T: VORWAERTS_T,
  UHRZEIT_VERSATZ_MAX: UHRZEIT_VERSATZ_MAX, UHRZEIT_TOR_H: UHRZEIT_TOR_H, VERSATZ_TOLERANZ: VERSATZ_TOLERANZ, uhrzeitTorGilt: uhrzeitTorGilt,
  JAHRE: JAHRE, JAHR_MIN_TAGE: JAHR_MIN_TAGE, TREND_MIN_TAGE: TREND_MIN_TAGE, TREND_MIN_JAHRE: TREND_MIN_JAHRE, EMA_N: EMA_N, HH_LAG_UEBERNACHT: HH_LAG_UEBERNACHT, lagVon: lagVon, PLAN: PLAN,
  kalender: kalender,
  N_DET: N_DET, N_ZR: N_ZR, N_H: N_H, N_K: N_K, N_KAND: N_KAND, N_REIHEN: N_REIHEN, ARTEN: ARTEN, N_KONFIG: N_KONFIG,
  kandIndex: kandIndex, reiheIndex: reiheIndex, zelle: zelle, zellenZahl: zellenZahl, topfZelle: topfZelle, topfZahl: topfZahl, kursZelle: kursZelle, kursZahl: kursZahl, hzZelle: hzZelle, hzZahl: hzZahl,
  KONFIG_KENNUNG: KONFIG_KENNUNG,
};
