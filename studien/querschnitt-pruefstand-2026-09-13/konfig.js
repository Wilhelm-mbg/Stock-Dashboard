'use strict';
/* KONFIGURATION des Querschnitts-Pruefstands Teil 1 (VORREGISTRIERUNG.md, 13.09.2026).
 *
 * HERKUNFT: Umsatzklassen, Kassa-Huerden, Cent-Boden, Wertpapierart-Filter, Kalender und Massnahmenfenster
 * kommen per require aus studien/vorregistrierung-2026-09-09-trendwende-ii/konfig.js (die ihrerseits aus
 * der Minutenstudie liest) - unveraendert wiederverwendet, nicht kopiert, damit beide Studien dieselbe
 * Huerde und denselben Kalender meinen. Eigen sind: Datenfenster, Panelformat, Umschichtung,
 * Portfoliobildung, Kostenformel, se-Regel, die drei Kontrollen mit ihren Schranken, Ausbuchungsregeln.
 *
 * Alles, was die Vorregistrierung als Zahl festlegt, steht hier GENAU EINMAL. test.js haelt die Zahlen
 * gegen die Quellen und wird rot, wenn sie abweichen.
 *
 * NUR LESEN auf dem Archiv. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');
var TW = path.join(REPO, 'studien', 'vorregistrierung-2026-09-09-trendwende-ii');
var MINUTEN = path.join(REPO, 'studien', 'vorregistrierung-2026-09-06-signale-minuten');
var GRUENDE = path.join(REPO, 'studien', 'verschwundene-gruende-2026-09-12');
var KT = require(path.join(TW, 'konfig.js'));
var KM = KT.KM;

/* ---------- Aus der Trendwende-/Minutenstudie, unveraendert (§0) ---------- */
var ORTE = KM.ORTE, archivWurzel = KM.archivWurzel;
var KLASSEN = KM.KLASSEN, klasseIndex = KM.klasseIndex;
var CENT_BODEN_USD = KM.CENT_BODEN_USD, centBodenPp = KM.centBodenPp, ueberCentBoden = KM.ueberCentBoden;
var MASSNAHMEN_FENSTER_TAGE = KM.MASSNAHMEN_FENSTER_TAGE, MASSNAHMEN_ARTEN = KM.MASSNAHMEN_ARTEN;
var DICHTE_MIN = KM.DICHTE_MIN;                              // 0,8 - August-Regel

/* ---------- Datenfenster (§1.1): 2016 bis zum letzten VOLLSTAENDIGEN Handelstag des Archivs ---------- */
var FENSTER_VON = '2016-01-01';
var FENSTER_BIS_MAX = '2026-12-31';                          // echte Obergrenze kommt aus dem Archivstand
var REFERENZ = ['SPY'];                                      // nie im Universum (§1.1)

/* ---------- Kalender (eigene Fassung: eigenes Fenster, sonst dieselbe Quelle) ---------- */
var KAL = null;
function kalender() {
  if (KAL) return KAL;
  var p = path.join(ORTE.roh(), '_kalender.json');
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  var tage = Object.keys(j.tage).filter(function (t) { return t >= FENSTER_VON && t <= FENSTER_BIS_MAX; }).sort();
  var idx = {}; tage.forEach(function (t, i) { idx[t] = i; });
  KAL = { tage: tage, idx: idx, close: j.tage };
  return KAL;
}

/* ---------- Panelformat (§1.2) ---------- */
var PANEL_KENNUNG = 'querschnitt-pruefstand-2026-09-13/panel/v1';
var SPALTEN = ['sym', 'tag', 'roh_schluss', 'roh_eroeffnung', 'faktor', 'rendite', 'umsatz_reg', 'umsatz_auktion', 'klasse', 'marken', 'kerzen'];
var M_QUELLE_REIN = 1, M_SCHLUSS_ERSATZ = 2, M_DICHTE_OK = 4, M_MASSNAHME_NAH = 8,
    M_LETZTER_TAG = 16, M_STEMPEL_TAG = 32, M_EROEFFNUNG_ERSATZ = 64, M_KEINE_RENDITE = 128;
var MARKEN_NAMEN = { 1: 'QUELLE_REIN', 2: 'SCHLUSS_ERSATZ', 4: 'DICHTE_OK', 8: 'MASSNAHME_NAH',
  16: 'LETZTER_TAG', 32: 'STEMPEL_TAG', 64: 'EROEFFNUNG_ERSATZ', 128: 'KEINE_RENDITE' };

/* ---------- Umsatzklasse (§1.5): Median der 60 Handelstage VOR dem Tag, mindestens 40 davon da ---------- */
var UMSATZ_FENSTER = 60, UMSATZ_MIN_TAGE = 40;

/* ---------- Universum (§2.1) ---------- */
var UNIVERSUM_KLASSEN = [2, 3];                              // 250-1000 und ab1000
var MIN_VORTAGE = 250;
var MIN_UNIVERSUM = 100;                                     // Periode zaehlt nur ab 100 Papieren (10 je Dezil)
/** Punkt 3 des Universums: Cent-Boden je Umlauf darf die Klassenhuerde nicht ueberschreiten. */
function centBodenOk(rohKurs, klasse) { return !ueberCentBoden(rohKurs, klasse); }
/** Mindestkurs, den Punkt 3 fuer eine Klasse bedeutet (nur fuer Bericht und Pruefung). */
function mindestKurs(klasse) { return 100 * CENT_BODEN_USD / KLASSEN[klasse].huerde; }

/* ---------- Portfolios (§2.2) ---------- */
var DEZIL = 10;
function dezilGroesse(n) { return Math.max(1, Math.floor(n / DEZIL)); }

/* ---------- Umschichtung (§2.3) ---------- */
var FREQUENZEN = [{ key: 'woche', name: 'woechentlich', lag: 5 }, { key: 'monat', name: 'monatlich', lag: 21 }];

/* ---------- Kosten (§2.5) ---------- */
/** Kosten einer Umschichtung in Pp: 0,5 x Summe |dw| x Huerde der Klasse je Papier. */
function huerdeVon(klasse, fenster) {
  var k = KLASSEN[klasse];
  return fenster === 'eroeffnung' ? k.huerdeEroeffnung : k.huerde;
}

/* ---------- Statistik (§2.6) ---------- */
var SE_ABWEICHUNG_MARKE = 1.5;                               // Marke, wenn HH/naiv um mehr als Faktor 1,5 auseinanderliegen
var JAHRE = []; for (var jj = 2016; jj <= 2026; jj++) JAHRE.push(jj);
var JAHR_MIN_PERIODEN = 10;
var AKTUELL_TAGE = 250;
var EMA_N = 200;                                             // Regime SPY ueber/unter EMA200 (§2.7)

/* ---------- Kontrollen (§3) ---------- */
/* NACHTRAG 4 (13.09., am Kunstsatz gefunden, vor dem echten Panel): die t-Schranke des Orakels war ohne
 * Ruecksicht auf die Zahl der Perioden gesetzt (monatlich ~113 statt ~495) und fiel bei einwandfreier
 * Maschine. Skalenfrei formuliert: der Effekt muss mindestens EINE Perioden-Standardabweichung gross sein;
 * t steht daneben, mit einem absoluten Boden. Die Pp-Schranken bleiben unveraendert. */
var ORAKEL_MIN_PP = 2.0, ORAKEL_MIN_SD = 1.0, ORAKEL_T_BODEN = 8, ORAKEL_H_MIN_PP_WOCHE = 5.0;
var ORAKEL_MIN_T_ALT = 20;                                   // gefallenes Kriterium, bleibt ausgewiesen
/* NACHTRAG 4: die Pp-Schranke gilt fuer das MITTEL der zwoelf Ziehungen (dort 7,0 / 4,1 se); die EINZELNE
 * Ziehung wird skalenfrei nach |t| < 3 beurteilt. Gemessene se je Ziehung: 0,050 Pp (Woche, n 495) und
 * 0,21 Pp (Monat, n 113) - die alte Einzelschranke 0,25 Pp sass bei 1,2 se, also im Rauschen. */
var ZUFALL_SCHRANKE = { woche: 0.10, monat: 0.25 };          // Pp, Mittel der Ziehungen, brutto wie netto
var ZUFALL_T_EINZELN = 3, ZUFALL_ZIEHUNGEN = 12, ZUFALL_MAX_FEHLER = 3;
var ZUFALL_SAAT = 'querschnitt-2026-09-13';
var MOM_UEBERSPRINGEN = 21, MOM_FENSTER = 252;               // 12-1: Schluss(t-21) / Schluss(t-252)

/* ---------- Ausbuchung verschwundener Reihen (§3.6) ---------- */
var TOTALVERLUST_GRUENDE = { insolvenz: true, 'zwangs-delisting': true };
var EMPFINDLICHKEIT = [
  { key: 'haupt', name: 'Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust)', totalverlust: ['insolvenz', 'zwangs-delisting'] },
  { key: 'streng', name: 'streng (zusaetzlich unbekannt + freiwillig)', totalverlust: ['insolvenz', 'zwangs-delisting', 'unbekannt', 'freiwillig'] },
  { key: 'milde', name: 'milde (kein Totalverlust, immer letzter Kurs)', totalverlust: [] },
];
var GRUENDE_DATEI = path.join(GRUENDE, 'verschwundene-gruende.json');
var GR = null;
/** Grund und Datum je Reihe aus der Grundstudie (nur lesen). */
function gruende() {
  if (GR) return GR;
  var j = JSON.parse(fs.readFileSync(GRUENDE_DATEI, 'utf8'));
  var m = {};
  (j.reihen || []).forEach(function (r) { m[r.reihe] = { grund: r.grund, datum: r.datum, letzter_balken: r.letzter_balken }; });
  GR = { karte: m, n: j.n, zaehler: j.zaehler, kennung: j.kennung };
  return GR;
}

/* ---------- Stempelkerzen (§1.7): Form, nicht Umsatz ---------- */
/** kerze = [zeit, schluss, umsatz, hoch, tief, eroeffnung]. */
function istStempelkerze(k) { return k[2] === 0 && k[1] === k[3] && k[1] === k[4] && k[1] === k[5]; }

/* ---------- TEIL 2 (VORREGISTRIERUNG-TEIL2.md, 15.09.2026) ---------- */
/* Fenster der vier vorregistrierten Rangfunktionen (§T2.3), in PANELZEILEN der jeweiligen Reihe. */
var K1_FENSTER = 5;                                          // Kurzfrist-Umkehr: Schluss(t)/Schluss(t-5)
var K2_FENSTER = 60;                                         // tiefe Volatilitaet: sd der 60 Tagesrenditen t..t-59
var K3_FENSTER = 250;                                        // 52-Wochen-Hoch: Maximum ueber t-249..t
var K4_FENSTER = 60, K4_MIN_TAGE = 40;                        // Umsatzschock: Median ueber t-60..t-1
/* Testzahl und Bonferroni (§T2.3): 4 Rangfunktionen x 2 Frequenzen = 8, zweiseitig alpha 0,05.
 * alpha/8 = 0,00625 => kritischer Betrag z = Phi^-1(1 - 0,00625/2) = Phi^-1(0,996875) = 2,7344.
 * test.js rechnet diesen Wert gegen eine unabhaengige Normalverteilungsrechnung nach. */
var TESTZAHL = 8, BONFERRONI_ALPHA = 0.05, BONFERRONI_T = 2.734;
/* Mischhuerde je Umlauf fuer die Kostenvorpruefung (§T2.3.2), GEMESSEN in Teil 1:
 * Momentum monatlich Umschlag 0,293 => Kosten 0,0184 Pp => 0,0628 Pp je Umlauf. */
var HUERDE_MISCH_PP = 0.063;
/* Schranken des Aussen-Pruefsteins (§T2.2.4) */
var AUSSEN_RHO_STARK = 0.5, AUSSEN_RHO_SCHWACH = 0.2, AUSSEN_JAHR_MIN_MONATE = 6;
/* Tore fuer das Zielportfolio (§T2.4) */
var TOR_JAHRE_NEGATIV_MAX = 3, TOR_JAHR_ANTEIL_MAX = 0.60;

/* ---------- TEIL 3 (VORREGISTRIERUNG-TEIL3.md, 16.09.2026) ---------- */
/* Erweitertes Universum (§T3.2): 50-250, 250-1000, ab1000. K.UNIVERSUM_KLASSEN bleibt fuer Teil 1/2 [2, 3]. */
var UNIVERSUM_KLASSEN_TEIL3 = [1, 2, 3];
/* V2 Volatilitaetsbremse (§T3.3): e = min(1, ZIEL / sigma), sigma = sd der V0-Tagesrenditen ueber FENSTER Tage x sqrt(252). */
var V2_VOL_ZIEL = 15, V2_VOL_FENSTER = 60, HANDELSTAGE_JAHR = 252;
var KASSE_ZINS = 0;                                          // Kasse verzinst sich mit null (§T3.2)
/* MDE-Konvention (§T3.4): MDE80 = (z_0.975 + z_0.80) * se = (1.95996 + 0.84162) * se. test-teil3 rechnet nach. */
var MDE_FAKTOR = 2.8016;
/* Gepaarte Vergleiche (§T3.5): "signifikant schlechter" = t < -1.96 (naiv auf Monaten UND Hansen-Hodrick auf Tagen). */
var PAAR_T_SCHLECHTER = -1.96, PAAR_LAG_TAGE = 21, SCHLECHTESTES_FENSTER_MONATE = 12;
/* Krisenfenster (§T3.4), nach Kalendermonat des Ausfuehrungstags, einschliesslich. */
var KRISEN = [
  { key: '2018Q4', name: 'Q4 2018', von: '2018-10', bis: '2018-12', monate: 3 },
  { key: '2020crash', name: 'Crash 2020', von: '2020-02', bis: '2020-04', monate: 3 },
  { key: '2020-11_2021-06', name: 'Momentum-Einbruch 2020-11 bis 2021-06', von: '2020-11', bis: '2021-06', monate: 8 },
  { key: '2022', name: 'Baisse 2022', von: '2022-01', bis: '2022-10', monate: 10 },
];
/* Kontrollen monatlich auf dem erweiterten Universum (§T3.6). orakelTag: nur die Pp-Schranke (ORAKEL_MIN_PP);
 * orakelPeriode/monat (horizontgleich): Pp-Schranke, Mittel/sd >= ORAKEL_MIN_SD, t >= ORAKEL_T_BODEN. */
var ORAKEL_PERIODE_MONAT_MIN_PP = 5.0;
/* Dividendenzeile (§T3.7): Teil-2-Messung uebertragen; SPY-Rendite ist ANNAHME mit Spanne. */
var DIVIDENDE_LUECKE_DEZIL_UNI_PP = -0.0744, DIVIDENDE_DEZIL_JAHR = 0.83;
var SPY_DIVIDENDE_JAHR = { min: 1.3, mitte: 1.6, max: 1.9 };
/* Vorpruefung (§T3.8): Erwartungen, gegen die die Messung gehalten wird. */
var VORPRUEFUNG_TEIL3 = { umschlagV0: 0.293, kostenV0Spanne: [0.0184, 0.0250], mdeV0UniSpanne: [0.91, 1.74],
  paarSe: { v1: 0.23, v2: 0.14, v3: 0.27 }, seAbweichungFaktor: 1.5 };

var KONFIG_KENNUNG = 'querschnitt-pruefstand-2026-09-13/v1';
var KONFIG_KENNUNG_TEIL2 = 'querschnitt-pruefstand-2026-09-13/teil2/v1';
var KONFIG_KENNUNG_TEIL3 = 'querschnitt-pruefstand-2026-09-13/teil3/v1';

module.exports = {
  REPO: REPO, HIER: HIER, TW: TW, MINUTEN: MINUTEN, GRUENDE: GRUENDE, KT: KT, KM: KM,
  ORTE: ORTE, archivWurzel: archivWurzel,
  KLASSEN: KLASSEN, klasseIndex: klasseIndex, CENT_BODEN_USD: CENT_BODEN_USD, centBodenPp: centBodenPp,
  ueberCentBoden: ueberCentBoden, centBodenOk: centBodenOk, mindestKurs: mindestKurs,
  MASSNAHMEN_FENSTER_TAGE: MASSNAHMEN_FENSTER_TAGE, MASSNAHMEN_ARTEN: MASSNAHMEN_ARTEN, DICHTE_MIN: DICHTE_MIN,
  FENSTER_VON: FENSTER_VON, FENSTER_BIS_MAX: FENSTER_BIS_MAX, REFERENZ: REFERENZ, kalender: kalender,
  PANEL_KENNUNG: PANEL_KENNUNG, SPALTEN: SPALTEN, MARKEN_NAMEN: MARKEN_NAMEN,
  M_QUELLE_REIN: M_QUELLE_REIN, M_SCHLUSS_ERSATZ: M_SCHLUSS_ERSATZ, M_DICHTE_OK: M_DICHTE_OK,
  M_MASSNAHME_NAH: M_MASSNAHME_NAH, M_LETZTER_TAG: M_LETZTER_TAG, M_STEMPEL_TAG: M_STEMPEL_TAG,
  M_EROEFFNUNG_ERSATZ: M_EROEFFNUNG_ERSATZ, M_KEINE_RENDITE: M_KEINE_RENDITE,
  UMSATZ_FENSTER: UMSATZ_FENSTER, UMSATZ_MIN_TAGE: UMSATZ_MIN_TAGE,
  UNIVERSUM_KLASSEN: UNIVERSUM_KLASSEN, MIN_VORTAGE: MIN_VORTAGE, MIN_UNIVERSUM: MIN_UNIVERSUM,
  DEZIL: DEZIL, dezilGroesse: dezilGroesse, FREQUENZEN: FREQUENZEN, huerdeVon: huerdeVon,
  SE_ABWEICHUNG_MARKE: SE_ABWEICHUNG_MARKE, JAHRE: JAHRE, JAHR_MIN_PERIODEN: JAHR_MIN_PERIODEN,
  AKTUELL_TAGE: AKTUELL_TAGE, EMA_N: EMA_N,
  ORAKEL_MIN_PP: ORAKEL_MIN_PP, ORAKEL_MIN_SD: ORAKEL_MIN_SD, ORAKEL_T_BODEN: ORAKEL_T_BODEN,
  ORAKEL_MIN_T_ALT: ORAKEL_MIN_T_ALT, ORAKEL_H_MIN_PP_WOCHE: ORAKEL_H_MIN_PP_WOCHE,
  ZUFALL_SCHRANKE: ZUFALL_SCHRANKE, ZUFALL_T_EINZELN: ZUFALL_T_EINZELN, ZUFALL_ZIEHUNGEN: ZUFALL_ZIEHUNGEN,
  ZUFALL_MAX_FEHLER: ZUFALL_MAX_FEHLER, ZUFALL_SAAT: ZUFALL_SAAT,
  MOM_UEBERSPRINGEN: MOM_UEBERSPRINGEN, MOM_FENSTER: MOM_FENSTER,
  TOTALVERLUST_GRUENDE: TOTALVERLUST_GRUENDE, EMPFINDLICHKEIT: EMPFINDLICHKEIT, GRUENDE_DATEI: GRUENDE_DATEI, gruende: gruende,
  istStempelkerze: istStempelkerze,
  K1_FENSTER: K1_FENSTER, K2_FENSTER: K2_FENSTER, K3_FENSTER: K3_FENSTER,
  K4_FENSTER: K4_FENSTER, K4_MIN_TAGE: K4_MIN_TAGE,
  TESTZAHL: TESTZAHL, BONFERRONI_ALPHA: BONFERRONI_ALPHA, BONFERRONI_T: BONFERRONI_T,
  HUERDE_MISCH_PP: HUERDE_MISCH_PP,
  AUSSEN_RHO_STARK: AUSSEN_RHO_STARK, AUSSEN_RHO_SCHWACH: AUSSEN_RHO_SCHWACH,
  AUSSEN_JAHR_MIN_MONATE: AUSSEN_JAHR_MIN_MONATE,
  TOR_JAHRE_NEGATIV_MAX: TOR_JAHRE_NEGATIV_MAX, TOR_JAHR_ANTEIL_MAX: TOR_JAHR_ANTEIL_MAX,
  KONFIG_KENNUNG: KONFIG_KENNUNG, KONFIG_KENNUNG_TEIL2: KONFIG_KENNUNG_TEIL2,
  UNIVERSUM_KLASSEN_TEIL3: UNIVERSUM_KLASSEN_TEIL3, V2_VOL_ZIEL: V2_VOL_ZIEL, V2_VOL_FENSTER: V2_VOL_FENSTER,
  HANDELSTAGE_JAHR: HANDELSTAGE_JAHR, KASSE_ZINS: KASSE_ZINS, MDE_FAKTOR: MDE_FAKTOR,
  PAAR_T_SCHLECHTER: PAAR_T_SCHLECHTER, PAAR_LAG_TAGE: PAAR_LAG_TAGE, SCHLECHTESTES_FENSTER_MONATE: SCHLECHTESTES_FENSTER_MONATE,
  KRISEN: KRISEN, ORAKEL_PERIODE_MONAT_MIN_PP: ORAKEL_PERIODE_MONAT_MIN_PP,
  DIVIDENDE_LUECKE_DEZIL_UNI_PP: DIVIDENDE_LUECKE_DEZIL_UNI_PP, DIVIDENDE_DEZIL_JAHR: DIVIDENDE_DEZIL_JAHR,
  SPY_DIVIDENDE_JAHR: SPY_DIVIDENDE_JAHR, VORPRUEFUNG_TEIL3: VORPRUEFUNG_TEIL3, KONFIG_KENNUNG_TEIL3: KONFIG_KENNUNG_TEIL3,
};
