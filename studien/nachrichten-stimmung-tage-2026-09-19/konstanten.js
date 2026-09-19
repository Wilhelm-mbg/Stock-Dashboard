'use strict';
/* Nachrichten-Stimmung, Tagesdesign (Nr. 45): jede Zahl der Vorregistrierung genau einmal.
 * Kassa-Hürden je Klasse kommen NICHT von hier, sondern aus einer Stelle: `konfig.js` des Prüfstands (`huerdeVon`),
 * das sie aus der Spannen-Studie übernimmt (Kl. 2 = 250-1000: 0,0647 / Kl. 3 = ab1000: 0,0449 Pp je Umlauf).
 * Entwurf — nicht registriert, bis Wilhelm freigibt. Simulation, keine Anlageberatung. */
var path = require('path');
var K = require(path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13', 'konfig.js'));

module.exports = {
  KENNUNG: 'nachrichten-stimmung-tage-2026-09-19/v1',   // registriert 19.09.2026 (Wilhelms Freigabe), Inhalt = v0-entwurf a2290da
  KENNUNG_VORPRUEFUNG: 'nachrichten-stimmung-tage-2026-09-19/vorpruefung/v1',
  SAAT_VORPRUEFUNG: 'nachrichten-stimmung-tage-2026-09-19',
  KLASSEN: [2, 3],                              // Prüfstand-Indizes: 2 = 250-1000, 3 = ab1000 Mio $ Tagesumsatz (ABDECKUNG.md §f: ja / ja)
  FENSTER_VON: '2017-01-01', FENSTER_BIS: '2026-08-31',
  HALTEDAUERN: [1, 3, 5],                       // registriert
  HALTEDAUER_NACHRICHTLICH: 21,                 // Brücke zur Machbarkeit, kein Urteil
  MIN_ARTIKEL: 3,                               // je Symbol-Tag, sonst Signal undefiniert
  MIN_UNIVERSUM_JE_TAG: 20,                     // Tag fällt für die Gruppe weg, wenn weniger Papiere
  SCHNITT_ET: '16:00:00',                       // Crawl-Stempel (ET) muss ≤ sein — sonst nicht Tag t
  MIN_DATEIEN_JE_TAG: 48,                       // 50 % von 96 15-min-Dateien, sonst Tag undefiniert
  BLOCK_AUSFALL: ['2025-06-15', '2025-07-01'],  // einschließlich beider Enden (ABDECKUNG.md §0)
  GLEITFENSTER_TAGE: 20,                        // Änderung gegen das 20-Tage-Mittel des Symbols (Tage mit definiertem Signal)
  MIN_GLEITFENSTER: 10,                         // mindestens so viele definierte Vortage, sonst Änderung undefiniert
  TESTZAHL: 12,                                 // 2 Größen × 3 Haltedauern × 2 Portfolios
  T_SCHWELLE: 3,                                // t_HH ≥ 3 (strenger als z_Bonf(12) = 2,865)
  MDE_FAKTOR_T3: 3 + 0.8416,                    // MDE80 an der Schwelle t ≥ 3: (3 + z_0,80) · se
  MDE_FAKTOR: K.MDE_FAKTOR,                     // 2,8016 (Konvention seit 15.09.)
  AKTUALITAET_TAGE: 250,
  PLACEBO_VERSATZ_TAGE: 21, PLACEBO_ZIEHUNGEN: 12,
  PLACEBO_SCHRANKE_MITTEL_PP: 0.02, PLACEBO_MAX_T3: 3,   // |Mittel je Periode| < 0,02 Pp (Tagesskala), höchstens 3 von 12 mit |t| ≥ 3
  ORAKEL_MIN_DELTA_PP: { 1: 2.5, 3: 4.0, 5: 5.0 }, ORAKEL_MIN_T: 8,
  NULLPUNKT_MAX_T: 3,                           // Zufallsdezil: |t| unter der Null < 3 in jeder Zelle
  VORPRUEFUNG_TOLERANZ: 1.5,                    // Reproduktion der Paar-sd innerhalb Faktor 1,5
  huerdeVon: K.huerdeVon
};
