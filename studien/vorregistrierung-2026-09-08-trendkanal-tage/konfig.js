'use strict';
/* KONFIGURATION der Studie Trendkanal auf Tagesbasis (VORREGISTRIERUNG.md, 08.09.2026).
 *
 * Alles, was die Vorregistrierung als Zahl festlegt, steht hier GENAU EINMAL - tagesbalken.js, kanaele.js,
 * messen.js, auswerten.js und test.js lesen es von hier. Wer eine Zahl aendert, aendert die Studie; test.js haelt
 * die Zahlen gegen die Quellen (wiki/kosten.md, kosten.js, liquide.js, quant.js) und wird rot.
 *
 * Kalender, Umsatzklassen, Huerden, Split, Lebend-Regel und Datenorte kommen per require aus der Minutenstudie
 * (studien/vorregistrierung-2026-09-06-signale-minuten/konfig.js und lesen.js) - UNVERAENDERT wiederverwendet,
 * nicht kopiert, damit beide Studien dieselbe Hürde und denselben Kalender meinen.
 *
 * ZELLENLAYOUT: die Messung legt keine Trades auf die Platte, sondern Summen je Zelle
 * (Art x Konfiguration x Richtung x Ausstieg x Einstiegstag x Umsatzklasse x lebend). Art = Kandidat, Kandidat im
 * Regime "SPY ueber EMA200" (nachrichtlich), Placebo A, Placebo B. Der Topf (alle zulaessigen Wert-Tage, Long-Ertrag
 * je Dauer 1..61) hat ein eigenes Feld.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var path = require('path');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');
var MINUTEN = path.join(REPO, 'studien', 'vorregistrierung-2026-09-06-signale-minuten');
var KM = require(path.join(MINUTEN, 'konfig.js'));      // Kalender, Klassen, Huerden, Split, Orte
var L = require(path.join(MINUTEN, 'lesen.js'));        // Reihen, Massnahmen, Rohfaktor, ET-Zeit

/* ---------- Datenfenster und Schnitte (§0.1, §8) - aus der Minutenstudie, hier nur benannt ---------- */
var FENSTER = { von: '2016-01-04', bis: '2026-08-31' };                 // erster/letzter Handelstag des Kalenders
var BESTAETIGUNG_AB = KM.BESTAETIGUNG_AB;                                // 2023-02-07
var REGIME_AB = KM.REGIME_AB;                                            // 2021-01-01
var LEBEND_AB = KM.LEBEND_AB;                                            // 2026-08-17

/* ---------- Umsatzklassen und Kassa-Huerde (§2) ---------- */
var KLASSEN = KM.KLASSEN;                                                // name, von, bis, huerde (mitte ab 2021), eroeffnungFaktor
var UMSATZ_FENSTER = KM.UMSATZ_FENSTER;                                  // 20 Balkentage d-20..d-1
var klasseIndex = KM.klasseIndex;
var CENT_BODEN_USD = KM.CENT_BODEN_USD;                                  // 0,005 $ je Umlauf
var centBodenPp = KM.centBodenPp, ueberCentBoden = KM.ueberCentBoden;
var MASSNAHMEN_FENSTER_TAGE = KM.MASSNAHMEN_FENSTER_TAGE;                // +-10 Handelstage

/* ---------- Tageskerze (§1) ---------- */
var SCHLUSS_KANDIDATEN = ['c1', 'c2', 'c3'];    // c1 Eroeffnung 16:00-Kerze, c2 Schluss 16:00-Kerze, c3 Schluss 15:59-Kerze
/* Die WAHL des Schlusses trifft die Kreuzprobe gegen Yahoo nach der Regel in §1.2 (kleinster Median; Toleranz Median
 * <= 0,03 Pp, P95 <= 0,30 Pp). Bis die Kreuzprobe gelaufen ist, steht hier der Kandidat des Auftrags; die Wahl wird als
 * datierter Nachtrag eingetragen und hier gesetzt. messen.js liest den gewaehlten Kandidaten aus den Tagesdateien. */
var SCHLUSS_WAHL = process.env.MD_TK_SCHLUSS || 'c1';
/* Nachtrag 2 (08.09., vor der ersten Zelle): bei Gleichstand der Mediane (< 0,002 Pp; beide Kandidaten treffen den
 * Yahoo-Schluss an mehr als der Haelfte der Tage exakt, der Median ist dann 0 und blind) entscheidet das kleinere P95,
 * dann der kleinere Anteil > 0,1 Pp, erst dann der Vorrang. Die urspruengliche Regel (Vorrang allein) haette c2 gewaehlt
 * und die Toleranz verfehlt, obwohl c1 sie einhaelt - ein Kontrollkriterium, das den besseren Kandidaten durchfallen laesst. */
var KREUZPROBE = { medianMaxPp: 0.03, p95MaxPp: 0.30, sprungPp: 5, gleichstandPp: 0.002, vorrang: ['c2', 'c1', 'c3'], gleichstand: ['p95', 'ueber01', 'vorrang'] };
var FLAG = { oSpaet: 1, c16fehlt: 2, massnahmen: 4 };

/* ---------- Kanaele (§3) ---------- */
var K1 = { fenster: 250, minTage: 20, minBeruehrungen: 3, minGuete: 50 };   // Abschnittskanal der App: kanalSegmente auf dem Jahresfenster
var K2 = { N: 40, sdFaktor: 2, r2Min: 0.5, tMin: 2.0 };                     // Regressionskanal, Linien +-2 sd (Nachtrag 1)
var K3 = { N: [20, 55], confirmBps: 15 };                                   // Donchian; confirmBps = Live-Parameter der App (August-Detektor)
var TOUCH = 0.15;                                                           // Beruehrungs-Toleranz: 15 % der Kanalbreite (kanalUeber)
var LINIEN = [
  { key: 'K1', art: 'K1' },
  { key: 'K2', art: 'K2' },
  { key: 'K3-20', art: 'K3', N: 20 },
  { key: 'K3-55', art: 'K3', N: 55 },
];
var EINSTIEGE = [{ key: 'E1', name: 'Ausbruch', versatz: 2 }, { key: 'E2', name: 'Ruecklauf', versatz: 1 }];   // versatz = Einstiegstag - Signaltag
var RICHTUNGEN = [{ key: 'long', dir: 1 }, { key: 'short', dir: -1 }];
var AUSSTIEGE = [{ key: 'H5', h: 5 }, { key: 'H10', h: 10 }, { key: 'H20', h: 20 }, { key: 'bruch', h: null, max: 60 }];
var HAUPT_AUSSTIEGE = ['H5', 'H10'];                                        // §12: H = 20 und Kanalbruch nur Obergrenze
var COOLDOWN_TAGE = 5;                                                      // je (Reihe, Linie, Einstieg, Richtung)
var POT_MAX_DAUER = 61;                                                     // Topf je Dauer 1..61 Handelstage
var EMA_N = 200;                                                            // Regime: SPY-Schluss ueber EMA200

/* ---------- Statistik (§7, §10, §11) ---------- */
var Z_POWER80 = 0.8416;
var TOR1_FAKTOR = 4;
var MIN_BES_TAGE = 30;
var MIN_N_EFF = 20;
var BAND_T = 3, BAND_PP = KLASSEN[KLASSEN.length - 1].huerde;               // Placebo gepoolt: |t| < 3 und |Mittel| < 0,0449 Pp
var JEDE_KLASSE_ZU = KLASSEN[KLASSEN.length - 1].huerde;
/* Planzahlen aus §12 (delta80 in Pp bei k1 = 1, Annahme sigma_idio 2,5 Pp/Tag), zum Danebenstellen. */
var PLAN = { H5: { k20: 0.26, k60: 0.15, k200: 0.083 }, H10: { k20: 0.52, k60: 0.30, k200: 0.17 }, H20: { k20: 1.04, k60: 0.60, k200: 0.33 } };

/* ---------- Kalender ---------- */
var KAL = null;
function kalender() {
  if (KAL) return KAL;
  var k = KM.kalender();
  if (k.tage[0] !== FENSTER.von || k.tage[k.tage.length - 1] !== FENSTER.bis) throw new Error('Kalender der Minutenstudie deckt ' + k.tage[0] + '..' + k.tage[k.tage.length - 1] + ', registriert ist ' + FENSTER.von + '..' + FENSTER.bis);
  if (k.bestaetigungAb !== BESTAETIGUNG_AB) throw new Error('Kalender-Split ' + k.bestaetigungAb + ' != registriert ' + BESTAETIGUNG_AB);
  KAL = k;
  return k;
}

/* ---------- Zellenlayout ---------- */
var N_L = LINIEN.length, N_E = EINSTIEGE.length, N_A = AUSSTIEGE.length, N_K = KLASSEN.length;
var N_KONF = N_L * N_E;                                                     // 8 Konfigurationen ohne Richtung/Ausstieg
var N_KONFIG_GESAMT = N_KONF * 2 * N_A;                                     // 64 (§10)
var ARTEN = ['kandidat', 'regime', 'placeboA', 'placeboB'];
var FELDER = ['n', 'su', 'sr', 'ss', 'dn', 'ds', 'sd'];                    // n, Summe dir*(rLong-Topf), Summe r, Summe dir*(rLong-rSPY), Delisting n, Delisting Summe r, Summe Dauer
function konfIndex(linie, einstieg) { return linie * N_E + einstieg; }
/* Zelle: ((((((art*N_KONF+konf)*2+dir)*N_A+a)*nTage+tag)*N_K+klasse)*2+lebend */
function zelle(nTage, art, konf, dirIdx, a, tag, klasse, lebend) {
  return (((((art * N_KONF + konf) * 2 + dirIdx) * N_A + a) * nTage + tag) * N_K + klasse) * 2 + lebend;
}
function zellenZahl(nTage) { return ARTEN.length * N_KONF * 2 * N_A * nTage * N_K * 2; }
/* Topf: (((tag*POT_MAX_DAUER+(dauer-1))*N_K+klasse)*2+lebend */
function topfZelle(nTage, tag, dauer, klasse, lebend) { return ((tag * POT_MAX_DAUER + (dauer - 1)) * N_K + klasse) * 2 + lebend; }
function topfZahl(nTage) { return nTage * POT_MAX_DAUER * N_K * 2; }
/* Kurs-Zellen (Cent-Boden, §11d): nur Kandidaten, ohne Ausstieg: (((konf*2+dir)*nTage+tag)*N_K+klasse)*2+lebend */
function kursZelle(nTage, konf, dirIdx, tag, klasse, lebend) { return (((konf * 2 + dirIdx) * nTage + tag) * N_K + klasse) * 2 + lebend; }
function kursZahl(nTage) { return N_KONF * 2 * nTage * N_K * 2; }

var KONFIG_KENNUNG = 'trendkanal-tage-2026-09-08/v1/' + N_L + 'x' + N_E + 'x2x' + N_A + 'x' + N_K + 'x' + ARTEN.length + '+topf61+kurs';

module.exports = {
  REPO: REPO, HIER: HIER, MINUTEN: MINUTEN, KM: KM, L: L, ORTE: KM.ORTE,
  FENSTER: FENSTER, BESTAETIGUNG_AB: BESTAETIGUNG_AB, REGIME_AB: REGIME_AB, LEBEND_AB: LEBEND_AB,
  KLASSEN: KLASSEN, UMSATZ_FENSTER: UMSATZ_FENSTER, klasseIndex: klasseIndex,
  CENT_BODEN_USD: CENT_BODEN_USD, centBodenPp: centBodenPp, ueberCentBoden: ueberCentBoden, MASSNAHMEN_FENSTER_TAGE: MASSNAHMEN_FENSTER_TAGE,
  SCHLUSS_KANDIDATEN: SCHLUSS_KANDIDATEN, SCHLUSS_WAHL: SCHLUSS_WAHL, KREUZPROBE: KREUZPROBE, FLAG: FLAG,
  K1: K1, K2: K2, K3: K3, TOUCH: TOUCH, LINIEN: LINIEN, EINSTIEGE: EINSTIEGE, RICHTUNGEN: RICHTUNGEN, AUSSTIEGE: AUSSTIEGE, HAUPT_AUSSTIEGE: HAUPT_AUSSTIEGE,
  COOLDOWN_TAGE: COOLDOWN_TAGE, POT_MAX_DAUER: POT_MAX_DAUER, EMA_N: EMA_N,
  Z_POWER80: Z_POWER80, TOR1_FAKTOR: TOR1_FAKTOR, MIN_BES_TAGE: MIN_BES_TAGE, MIN_N_EFF: MIN_N_EFF, BAND_T: BAND_T, BAND_PP: BAND_PP, JEDE_KLASSE_ZU: JEDE_KLASSE_ZU, PLAN: PLAN,
  kalender: kalender,
  N_L: N_L, N_E: N_E, N_A: N_A, N_K: N_K, N_KONF: N_KONF, N_KONFIG_GESAMT: N_KONFIG_GESAMT, ARTEN: ARTEN, FELDER: FELDER,
  konfIndex: konfIndex, zelle: zelle, zellenZahl: zellenZahl, topfZelle: topfZelle, topfZahl: topfZahl, kursZelle: kursZelle, kursZahl: kursZahl,
  KONFIG_KENNUNG: KONFIG_KENNUNG,
};
