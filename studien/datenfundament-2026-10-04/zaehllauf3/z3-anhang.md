# Anhang zu ZAEHLLAUF3.md (erzeugt von t4-auswerten.js, Stand 2026-10-04T13:15:36.971Z, Wortlaut-Fassung 2)

## Matrix Grund alte Tafel (Zeile) -> Grund dritter Lauf (Spalte), 4996 Zeilen

| alt \ Lauf 3 | umbenennung-ticker | uebernahme | fusion-aktientausch | insolvenz | spac-ende | zwangs-delisting | freiwillig | abgemeldet-anlass-offen | ausgesetzt | unbekannt | Summe |
|---|---|---|---|---|---|---|---|---|---|---|---|
| umbenennung-ticker | 1317 | . | . | . | **3** | **6** | . | **1** | **2** | **1** | 1330 |
| uebernahme | **1** | 1555 | **5** | . | **4** | **27** | **10** | **19** | **4** | **28** | 1653 |
| fusion-aktientausch | **1** | **10** | 297 | . | **1** | **1** | . | . | . | . | 310 |
| insolvenz | . | **4** | . | 331 | . | **12** | . | **6** | . | **4** | 357 |
| spac-ende | . | . | **1** | . | 270 | **1** | **1** | **1** | **1** | **1** | 276 |
| zwangs-delisting | **3** | **52** | **2** | **7** | **55** | 273 | **71** | **35** | **6** | **43** | 547 |
| freiwillig | . | **13** | **1** | **1** | **6** | **8** | 13 | **258** | **6** | **5** | 311 |
| unbekannt | **1** | **25** | . | **4** | **4** | **9** | **9** | **49** | **4** | 107 | 212 |
| *54 neue Reihen* | 4 | 6 | 3 | 1 | . | 35 | 4 | 1 | . | . | 54 |

## Matrix Grund zweiter Lauf (Zeile) -> Grund dritter Lauf (Spalte), 5050 Zeilen

| Lauf 2 \ Lauf 3 | umbenennung-ticker | uebernahme | fusion-aktientausch | insolvenz | spac-ende | zwangs-delisting | freiwillig | abgemeldet-anlass-offen | ausgesetzt | unbekannt | Summe |
|---|---|---|---|---|---|---|---|---|---|---|---|
| umbenennung-ticker | 1322 | . | . | . | . | . | . | . | . | . | 1322 |
| uebernahme | **1** | 1556 | **4** | . | . | . | . | **2** | . | . | 1563 |
| fusion-aktientausch | **1** | **10** | 301 | . | . | . | . | . | . | . | 312 |
| insolvenz | . | . | . | 333 | . | . | . | **2** | . | . | 335 |
| spac-ende | . | . | **1** | **1** | 290 | . | . | . | . | . | 292 |
| zwangs-delisting | **2** | **50** | **1** | . | **52** | 369 | **95** | **15** | **17** | **27** | 628 |
| freiwillig | . | **1** | . | **1** | . | . | 12 | **9** | . | . | 23 |
| abgemeldet-anlass-offen | . | **10** | **1** | **1** | . | . | **1** | 322 | . | **2** | 337 |
| unbekannt | **1** | **38** | **1** | **8** | **1** | **3** | . | **20** | **6** | 160 | 238 |

## 20 gezogene Kipp-Faelle gegen den zweiten Lauf (Saat `z3-kipp`, von 298)

| Reihe | Anker | Lauf 2: Grund (Beleg, Datum) | Lauf 3: Grund (Beleg, Datum) | Regel | Ursache | Firma Lauf 2 -> Lauf 3 | letzter Kurs | Wortlaut | K1-3 |
|---|---|---|---|---|---|---|---|---|---|
| FOGO | 2018-04-04 | zwangs-delisting (edgar-8K-3.01, 2018-04-05) | uebernahme (edgar-8K-3.01-vollzug, 2018-04-05) | 11 | V2 | Fogo de Chao, Inc. | 15.75 | vollzug | 0 |
| MAPS | 2026-04-24 | zwangs-delisting (edgar-8K-3.01, 2026-04-07) | freiwillig (edgar-8K-3.01-eigener-entschluss, 2026-04-07) | 11 | V2 | WM TECHNOLOGY, INC. | 0.3738 | eigener-entschluss | 0 |
| AC | 2025-09-04 | zwangs-delisting (edgar-8K-3.01, 2025-08-15) | freiwillig (edgar-8K-3.01-eigener-entschluss, 2025-08-15) | 11 | V2 | Associated Capital Group, Inc. | 30.92 | eigener-entschluss | 0 |
| BAS | 2019-12-02 | zwangs-delisting (edgar-8K-3.01, 2019-12-03) | abgemeldet-anlass-offen (edgar-formular25, 2020-08-21) | 13 | V1+V7 | BASIC ENERGY SERVICES, INC. -> GS Finance Corp. | 0.4325 | - | 0 |
| HHGC | 2024-10-02 | zwangs-delisting (edgar-8K-3.01, 2024-07-30) | spac-ende (edgar-mantel+8K-3.01, 2024-07-30) | 9 | V5i | HHG Capital Corp | 11.1201 | ruege | 0 |
| CIZN | 2023-12-14 | zwangs-delisting (edgar-8K-3.01, 2023-12-07) | freiwillig (edgar-8K-3.01-eigener-entschluss, 2023-12-07) | 11 | V2 | CITIZENS HOLDING CO /MS/ | 8.85 | eigener-entschluss | 0 |
| YHOO | 2017-06-16 | zwangs-delisting (edgar-8K-3.01, 2017-05-03) | unbekannt (nichts, -) | 15 | V1 | FIELDPOINT PETROLEUM CORP -> - | 52.68 | - | 250 |
| MRTX | 2024-01-22 | fusion-aktientausch (alpaca-stock_mergers, 2024-01-25) | uebernahme (alpaca-stock_and_cash_mergers, 2024-01-24) | 2 | V8 | Mirati Therapeutics, Inc. | 58.7 | - | 104 |
| TBCP | 2023-12-08 | zwangs-delisting (edgar-8K-3.01, 2023-11-13) | spac-ende (edgar-mantel+8K-3.01, 2023-11-13) | 9 | V5i | Thunder Bridge Capital Partners III Inc. | 10.21 | ruege | 0 |
| IDI | 2016-09-23 | zwangs-delisting (edgar-8K-3.01, 2016-09-14) | freiwillig (edgar-8K-3.01-eigener-entschluss, 2016-09-14) | 11 | V2 | Fluent, Inc. | 5 | eigener-entschluss | 0 |
| MBT | 2022-02-25 | zwangs-delisting (edgar-8K-3.01, 2021-11-15) | ausgesetzt (ausgesetzt, -) | 10 | V5iii | CohBar, Inc. -> MOBILE TELESYSTEMS PUBLIC JOINT STOCK Co | 5.5 | - | 0 |
| ADK | 2017-09-29 | zwangs-delisting (edgar-8K-3.01, 2016-06-06) | unbekannt (edgar-ohne-signal, -) | 15 | V3 | REGIONAL HEALTH PROPERTIES, INC | 0.91 | - | 0 |
| DUNE | 2023-12-21 | uebernahme (edgar-8K-2.01+prospekt, 2023-12-28) | umbenennung-ticker (alpaca-name_changes, 2023-12-22) | 1 | V8 | Global Gas Corp | 4.05 | - | 0 |
| OFED | 2023-07-31 | zwangs-delisting (edgar-8K-3.01, 2023-07-20) | freiwillig (edgar-8K-3.01-eigener-entschluss, 2023-07-20) | 11 | V2 | Oconee Federal Financial Corp. | 13.52 | eigener-entschluss | 0 |
| DS | 2022-12-30 | zwangs-delisting (edgar-8K-3.01, 2022-12-14) | freiwillig (edgar-8K-3.01-eigener-entschluss, 2022-12-14) | 11 | V2 | Drive Shack Inc. | 0.1676 | eigener-entschluss | 0 |
| CUO | 2020-05-11 | zwangs-delisting (edgar-8K-3.01, 2020-05-01) | freiwillig (edgar-8K-3.01-eigener-entschluss, 2020-05-01) | 11 | V2 | CONTINENTAL MATERIALS CORP | 8.63 | eigener-entschluss | 0 |
| RACY | 2023-01-11 | zwangs-delisting (edgar-8K-3.01, 2023-01-19) | abgemeldet-anlass-offen (edgar-formular25, 2023-09-14) | 13 | V7 | Relativity Acquisition Corp -> GOLDMAN SACHS GROUP INC | 12.28 | - | 0 |
| SBII | 2022-11-29 | zwangs-delisting (edgar-8K-3.01, 2022-10-18) | spac-ende (edgar-mantel+8K-3.01, 2022-10-18) | 9 | V5i | Sandbridge X2 Corp | 10.15 | ruege | 0 |
| CFCB | 2017-06-09 | zwangs-delisting (edgar-8K-3.01, 2017-06-14) | uebernahme (edgar-8K-3.01-vollzug, 2017-06-14) | 11 | V2 | CENTRUE FINANCIAL CORP | 27.73 | vollzug | 0 |
| AGII | 2018-05-04 | zwangs-delisting (edgar-8K-3.01, 2018-04-23) | freiwillig (edgar-8K-3.01-eigener-entschluss, 2018-04-23) | 11 | V2 | Argo Group International Holdings, Inc. | 58.85 | eigener-entschluss | 0 |

## Die 14 Reihen des zweiten Laufs (PHASE2A.md, Klasse 1-3)

| Reihe | alte Tafel | Lauf 2 | Lauf 3 (Beleg, Datum, Firma) | Regel | Weg / Namensprobe | Wortlaut | Ursache | Totalverlust (Haupt) |
|---|---|---|---|---|---|---|---|---|
| YHOO | unbekannt (nichts, -) | zwangs-delisting (edgar-8K-3.01, FIELDPOINT PETROLEUM CORP) | unbekannt (nichts, -, -) | 15 | fts-mehrheit / nichts | - | V1 | nein |
| DVMT | unbekannt (nichts, -) | zwangs-delisting (edgar-8K-3.01, Dell Technologies Inc.) | uebernahme (edgar-8K-3.01-vollzug, 2018-12-28, Dell Technologies Inc.) | 11 | polygon-cik / passt | vollzug | V2 | nein |
| ETP | uebernahme (edgar-8K-2.01+prospekt, Energy Transfer Operating, L.P.) | zwangs-delisting (edgar-8K-3.01, Energy Transfer, LP) | uebernahme (edgar-8K-2.01+prospekt, 2018-10-19, Energy Transfer, LP) | 5 | polygon-cik / passt + Energy Transfer Operating, L.P. | - | V1 | nein |
| ESV | uebernahme (edgar-8K-2.01+prospekt, Valaris Ltd) | zwangs-delisting (edgar-8K-3.01, Valaris Ltd) | unbekannt (edgar-ohne-signal, -, Valaris Ltd) | 15 | polygon-cik / frueher | - | V3 | nein |
| WNR | uebernahme (edgar-8K-2.01+prospekt, Western Refining, Inc.) | zwangs-delisting (edgar-8K-3.01, Western Refining, Inc.) | uebernahme (edgar-8K-3.01-vollzug, 2017-06-02, Western Refining, Inc.) | 11 | polygon-cik / passt | vollzug | V2 | nein |
| OZRK | uebernahme (edgar-8K-2.01+prospekt, BANK OF THE OZARKS INC) | zwangs-delisting (edgar-8K-3.01, BANK OF THE OZARKS INC) | abgemeldet-anlass-offen (edgar-formular25, 2017-06-26, BANK OF THE OZARKS INC) | 13 | polygon-cik / passt | - | V3 | nein |
| JAH | uebernahme (edgar-8K-2.01+prospekt, JARDEN CORP) | zwangs-delisting (edgar-8K-3.01, JARDEN CORP) | uebernahme (edgar-8K-3.01-vollzug, 2016-04-15, JARDEN CORP) | 11 | polygon-cik / passt | vollzug | V2 | nein |
| SBNY | insolvenz (edgar-8K-1.03, Core Scientific, Inc./tx) | unbekannt (edgar-ohne-signal, Signature Bank Corp) | unbekannt (edgar-ohne-signal, -, Signature Bank Corp) | 15 | polygon-cik / passt | - | - | nein |
| BCR | zwangs-delisting (edgar-8K-3.01, BARD C R INC /NJ/) | unbekannt (edgar-ohne-signal, BARD C R INC (PRED)) | uebernahme (edgar-8K-3.01-vollzug, 2017-12-29, BARD C R INC /NJ/) | 11 | fts-mehrheit / nichts | vollzug | V1+V2 | nein |
| SLW | zwangs-delisting (edgar-8K-3.01, NEUSTAR INC) | unbekannt (edgar-ohne-signal, Wheaton Precious Metals Corp.) | unbekannt (edgar-ohne-signal, -, Wheaton Precious Metals Corp.) | 15 | polygon-cik / frueher | - | - | nein |
| SYMC | zwangs-delisting (edgar-8K-3.01, Gen Digital Inc.) | unbekannt (edgar-ohne-signal, NEXLAND INC) | uebernahme (edgar-8K-2.01+prospekt, 2019-11-04, Broadcom Inc.) | 5 | fts2-geprueft / nichts | - | V1 | nein |
| PF | zwangs-delisting (edgar-8K-3.01, Bellerophon Therapeutics, Inc.) | uebernahme (edgar-8K-2.01+prospekt, PINNACLE FOODS INC.) | uebernahme (edgar-8K-2.01+prospekt, 2018-10-26, PINNACLE FOODS INC.) | 5 | polygon-cik / passt | - | - | nein |
| ESL | insolvenz (edgar-8K-1.03, SEARS HOLDINGS CORP) | uebernahme (edgar-8K-2.01+prospekt, ESTERLINE TECHNOLOGIES CORP) | uebernahme (edgar-8K-2.01+prospekt, 2019-03-14, ESTERLINE TECHNOLOGIES CORP) | 5 | polygon-cik / passt | - | - | nein |
| SODA | zwangs-delisting (edgar-8K-3.01, Sisecam Resources LP) | abgemeldet-anlass-offen (edgar-formular25, SodaStream International Ltd.) | abgemeldet-anlass-offen (edgar-formular25, 2018-12-06, SodaStream International Ltd.) | 13 | polygon-cik / passt | - | - | nein |

## Leseliste: alle 5 Reihen mit Klasse 1-3, die im dritten Lauf in der Hauptlesart Totalverlust sind

| Reihe | Anker | Grund | Beleg (Datum) | Firma | letzter Kurs | Lauf 2 | K1-3 | Wortlaut | Auszug |
|---|---|---|---|---|---|---|---|---|---|
| SIVB | 2023-03-10 | insolvenz | edgar-8K-1.03 (2023-03-10) | SVB FINANCIAL GROUP | 105.95 | insolvenz | 250 | - | - |
| SAVE | 2024-11-15 | insolvenz | q-kuerzel+edgar-8K-1.03 (2024-11-18) | Spirit Aviation Holdings, Inc. | 1.08 | insolvenz | 66 | - | - |
| NKLA | 2025-02-25 | insolvenz | q-kuerzel+edgar-8K-1.03 (2025-02-19) | Nikola Corp | 0.183 | insolvenz | 62 | - | - |
| NOVA | 2025-06-09 | insolvenz | q-kuerzel (2025-06-10) | - | 0.2202 | insolvenz | 16 | - | - |
| CCCX | 2026-02-13 | insolvenz | q-kuerzel (2026-02-17) | Infleqtion, Inc. | 13.66 | insolvenz | 11 | - | - |

## Totalverlust (Hauptlesart) gegen den zweiten Lauf geaendert, mit Klasse 1-3

| Reihe | Richtung | Lauf 2 | Lauf 3 | Beleg | K1-3 | K2-3 |
|---|---|---|---|---|---|---|
| DVMT | weg | zwangs-delisting | uebernahme | edgar-8K-3.01-vollzug | 250 | 0 |
| ETP | weg | zwangs-delisting | uebernahme | edgar-8K-2.01+prospekt | 250 | 0 |
| POT | weg | zwangs-delisting | uebernahme | edgar-8K-3.01-vollzug | 250 | 0 |
| SHPG | weg | zwangs-delisting | uebernahme | edgar-8K-3.01-vollzug | 250 | 0 |
| YHOO | weg | zwangs-delisting | unbekannt | nichts | 250 | 250 |
| ESV | weg | zwangs-delisting | unbekannt | edgar-ohne-signal | 206 | 0 |
| WNR | weg | zwangs-delisting | uebernahme | edgar-8K-3.01-vollzug | 171 | 0 |
| OZON | weg | zwangs-delisting | ausgesetzt | ausgesetzt | 91 | 0 |
| GXP | weg | zwangs-delisting | uebernahme | edgar-8K-3.01-vollzug | 78 | 0 |
| CVC | weg | zwangs-delisting | uebernahme | edgar-8K-3.01-vollzug | 77 | 0 |
| OZRK | weg | zwangs-delisting | abgemeldet-anlass-offen | edgar-formular25 | 76 | 0 |
| UBNT | weg | zwangs-delisting | freiwillig | edgar-8K-3.01-eigener-entschluss | 40 | 0 |
| JAH | weg | zwangs-delisting | uebernahme | edgar-8K-3.01-vollzug | 32 | 0 |
| DWA | weg | zwangs-delisting | uebernahme | edgar-8K-3.01-vollzug | 25 | 0 |

## Regel 11: Klasse des Wortlauts x Hinweise

| Klasse | Reihen | Grund | mit Fusionsbeleg (180/30) | mit Formular 25 des Emittenten | 3.01 hoechstens 30 Tage am Anker | unter 1 | 1-5 | 5-8 | 8-13 | ueber 13 | ohne Kurs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| vollzug | 40 | uebernahme 38, zwangs-delisting 2 | 14 | 5 | 38 | 2 | 3 | 2 | 5 | 28 | 0 |
| ruege | 333 | zwangs-delisting 333 | 21 | 56 | 283 | 215 | 68 | 11 | 24 | 15 | 0 |
| mehrdeutig | 9 | uebernahme 5, zwangs-delisting 4 | 7 | 2 | 7 | 2 | 0 | 0 | 4 | 3 | 0 |
| eigener-entschluss | 94 | freiwillig 94 | 14 | 90 | 89 | 27 | 25 | 7 | 15 | 20 | 0 |
| nichts | 29 | zwangs-delisting 24, uebernahme 5 | 3 | 9 | 27 | 10 | 9 | 3 | 3 | 4 | 0 |

## Pruefprobe: 40 Reihen der Regel 11 (Saat `z3-pruef`), Klasse gegen meine Lesart des Auszugs

| Reihe | Klasse | meine Lesart | stimmt | Tage zum Anker | Kursband | Anmerkung |
|---|---|---|---|---|---|---|
| TBIO | eigener-entschluss | eigener-entschluss | ja | -17 | 1-5 | - |
| WINT | ruege | ruege | ja | 0 | unter 1 | - |
| GMBL | eigener-entschluss | eigener-entschluss | ja | 0 | 1-5 | - |
| BSTG | ruege | ruege | ja | 1 | unter 1 | - |
| IONM | ruege | ruege | ja | 0 | 1-5 | - |
| TCPI | ruege | ruege | ja | 1 | 1-5 | - |
| AATC | eigener-entschluss | eigener-entschluss | ja | -8 | 1-5 | - |
| WBB | eigener-entschluss | eigener-entschluss | ja | -17 | ueber 13 | - |
| AXLA | ruege | ruege | ja | -5 | 1-5 | - |
| BSFC | ruege | ruege | ja | 0 | unter 1 | - |
| SISI | ruege | ruege | ja | 2 | 5-8 | - |
| RXII | ruege | ruege | ja | -3 | unter 1 | - |
| WTER | ruege | ruege | ja | -69 | unter 1 | - |
| TBLT | ruege | ruege | ja | 0 | 1-5 | - |
| BLPH | ruege | ruege | ja | 0 | unter 1 | - |
| POT | vollzug | vollzug | ja | 4 | ueber 13 | - |
| RVLT | ruege | ruege | ja | -1 | unter 1 | - |
| MICR | eigener-entschluss | eigener-entschluss | ja | -18 | 1-5 | - |
| GSVC | ruege | ruege | ja | -114 | 5-8 | Klasse stimmt (Ruege wegen verspaeteter Jahresmeldung, 114 Tage vor dem Anker) - als GRUND vermutlich falsch: die Ruege wurde geheilt, die Reihe endet aus anderem Anlass. Kein Fehler der Wortliste, sondern der Regel (Ruege ohne Bestaetigung der Abmeldung) |
| SBSA | nichts (kein Abschnitt) | unlesbar | **nein** | 0 | 1-5 | Abschnitt nicht gefunden - kein Auszug, nichts zu lesen (Fehlgriff der Abschnittssuche) |
| SDT | ruege | ruege | ja | 1 | unter 1 | - |
| RAS | ruege | ruege | ja | 0 | unter 1 | - |
| BLT | vollzug | vollzug | ja | 4 | 8-13 | - |
| PRST | ruege | ruege | ja | 0 | unter 1 | - |
| TLIS | eigener-entschluss | ruege | **nein** | -7 | 1-5 | Fehlgriff: 'voluntary' stammt aus 'voluntary petition under Chapter 11' - das ist die angekuendigte Insolvenz mit erwarteter Abmeldung, kein eigener Entschluss zur Abmeldung |
| AGII | eigener-entschluss | eigener-entschluss | ja | -11 | ueber 13 | Klasse stimmt (Wechsel der Boerse) - 'freiwillig' ist hier ein Boersenwechsel, kein Rueckzug |
| ANTH | ruege | ruege | ja | 0 | unter 1 | - |
| VYNT | eigener-entschluss | eigener-entschluss | ja | -18 | unter 1 | - |
| SALM | ruege | ruege | ja | -20 | unter 1 | Klasse stimmt (Ruege wegen des Mindestkurses), danach aber freiwilliger Rueckzug mit Formular 25 des Emittenten - die Tabelle laesst die Ruege gewinnen (wie QVCGB in der Lernprobe) |
| TEAR | ruege | ruege | ja | -1 | unter 1 | - |
| SPHS | ruege | ruege | ja | 0 | unter 1 | - |
| DS | eigener-entschluss | eigener-entschluss | ja | -16 | unter 1 | - |
| ENSV | ruege | ruege | ja | -141 | unter 1 | - |
| SXE | ruege | ruege | ja | 1 | unter 1 | - |
| WCFB | eigener-entschluss | eigener-entschluss | ja | -10 | 8-13 | - |
| EQGP | mehrdeutig | vollzug | **nein** | -10 | ueber 13 | Fehlgriff: der Titel steht ohne Artikel ('Failure to Satisfy Continued Listing Rule') und wird nicht entfernt -> 'mehrdeutig' statt 'vollzug' (Abfindung der Anteilseigner); der Grund kommt ueber den Fusionsbeleg trotzdem als Uebernahme heraus |
| ZIVO | ruege | ruege | ja | 3 | 1-5 | - |
| FNCX | ruege | ruege | ja | 1 | unter 1 | - |
| KBNT | eigener-entschluss | eigener-entschluss | ja | -1 | unter 1 | - |
| DHAI | ruege | ruege | ja | 0 | unter 1 | - |

## Ausgesetzte Werte (Regel 10), alle 23

| Reihe | Anker | letzter Kurs | Polygon-Abgang (Tage nach Anker) | Ende-Massnahme danach | Wortlaut 3.01 | Firma | Lauf 2 | K1-3 |
|---|---|---|---|---|---|---|---|---|
| AHI | 2024-01-31 | 1.5 | 2024-07-30 (181) | - | - | - | zwangs-delisting | 0 |
| BABY | 2019-07-25 | 26.75 | 2023-03-09 (1323) | - | - | - | zwangs-delisting | 0 |
| BOWN | 2025-07-15 | 9.19 | 2025-11-03 (111) | - | mehrdeutig | Bowen Acquisition Corp | zwangs-delisting | 0 |
| CCIH | 2019-05-17 | 0.8839 | 2019-09-06 (112) | - | - | ChinaCache International Holdings Ltd. | zwangs-delisting | 0 |
| CIAN | 2022-02-25 | 3.4 | 2023-03-16 (384) | - | - | - | zwangs-delisting | 0 |
| DSKX | 2016-04-04 | 0.6699 | 2016-12-23 (263) | - | ruege | DS HEALTHCARE GROUP, INC. | zwangs-delisting | 0 |
| EMPG | 2025-10-08 | 17.36 | 2026-07-27 (292) | - | - | Empro Group Inc. | unbekannt | 0 |
| HHR | 2022-02-25 | 15.03 | 2023-06-08 (468) | - | - | - | zwangs-delisting | 0 |
| HOFV | 2025-06-26 | 0.8749 | - | cash_mergers 2025-12-31 | ruege | Hall of Fame Resort & Entertainment Co | zwangs-delisting | 0 |
| JMG | 2026-01-15 | 6.61 | 2026-06-15 (151) | - | - | - | unbekannt | 0 |
| MBT | 2022-02-25 | 5.5 | 2022-07-13 (138) | cash_mergers 2026-04-27 | - | MOBILE TELESYSTEMS PUBLIC JOINT STOCK Co | zwangs-delisting | 0 |
| MTL | 2022-02-25 | 2.25 | 2022-12-07 (285) | - | - | Mechel PAO | zwangs-delisting | 0 |
| NTP | 2022-05-23 | 4.215 | 2022-11-18 (179) | - | - | NAM TAI PROPERTY INC. | zwangs-delisting | 0 |
| NUTR | 2025-10-08 | 9 | 2026-08-12 (308) | - | - | NUSATRIP Inc | zwangs-delisting | 0 |
| OZON | 2022-02-25 | 11.6 | 2023-06-08 (468) | - | - | - | zwangs-delisting | 91 |
| PTNM | 2025-10-03 | 10.39 | 2026-07-16 (286) | - | - | Pitanium Ltd | unbekannt | 0 |
| QIWI | 2022-02-28 | 5.67 | 2024-07-18 (871) | - | - | - | zwangs-delisting | 0 |
| QMMM | 2025-09-26 | 119.4 | 2026-08-14 (322) | - | - | QMMM Holdings Ltd | unbekannt | 0 |
| SDM | 2025-09-26 | 1.85 | 2026-06-29 (276) | - | - | Smart Digital Group Ltd | unbekannt | 0 |
| TCGL | 2026-01-30 | 172.84 | 2026-06-15 (136) | - | - | TechCreate Group Ltd. | zwangs-delisting | 0 |
| TIO | 2023-11-13 | 0.69 | 2024-03-01 (109) | name_changes 2024-03-01 -> TIOG | - | - | zwangs-delisting | 0 |
| VRTB | 2017-03-29 | 2581.5 | - | cash_mergers 2023-09-22 | eigener-entschluss | Vestin Realty Mortgage II, Inc | zwangs-delisting | 0 |
| YNDX | 2022-02-28 | 18.94 | - | name_changes 2024-08-21 -> NBIS | - | - | unbekannt | 250 |

Nicht als ausgesetzt gezaehlt, weil das Kuerzel neu vergeben ist (4): CO (JPMORGAN CHASE & CO / spaeter Global Cord Blood Corporation (2023-06-08); jetzt abgemeldet-anlass-offen); OPT (Innovator ETFs Trust / spaeter Opthea Limited American Depositary Shares (2025-11-20); jetzt abgemeldet-anlass-offen); RACY (GOLDMAN SACHS GROUP INC / spaeter Relativity Acquisition Corp. Class A Common Stock (2024-05-02); jetzt abgemeldet-anlass-offen); TFG (Ascent Solar Technologies, Inc. / spaeter The Fortegra Group, Inc. (2024-02-08); jetzt zwangs-delisting)

## Mantelgesellschaften: SIC 6770 mit 8-K 3.01 nach V3, die am Kurs scheitern (1)

| Reihe | Anker | letzter Kurs | Grund | Beleg | Wortlaut | Firma |
|---|---|---|---|---|---|---|
| GLST | 2025-03-07 | 6.56 | zwangs-delisting | edgar-8K-3.01-ruege | ruege | Global Star Acquisition Inc. |

## Regel 12 (fruehe Ruege + 25-NSE), alle 8

| Reihe | Anker | fruehes 8-K 3.01 | Formular 25-NSE | letzter Kurs | Lauf 2 | K1-3 | Auszug |
|---|---|---|---|---|---|---|---|
| ADAL | 2023-05-02 | EDGAR:0001193125-21-363747 (8-K 2021-12-21) | EDGAR:0001354457-23-000334 (25-NSE 2023-05-02) | 10.475 | zwangs-delisting (edgar-8K-3.01) | 0 | e SEC, the Company received a notice from The Nasdaq Stock Market LLC ("Nasdaq") stating that the Company was not in compliance with the periodic filing requirements for continued listing set forth in Nasdaq Listing Rule 5250(c)(1). Nasdaq's listing rules provide the Company with 60 calendar days fr |
| FSSI | 2022-12-07 | EDGAR:0001140361-21-020265 (8-K 2021-06-09) | EDGAR:0001354457-22-000691 (25-NSE 2022-12-07) | 10.08 | zwangs-delisting (edgar-8K-3.01) | 0 | m the Listing Qualifications Department of The Nasdaq Stock Market LLC ("Nasdaq") stating that the Company is not in compliance with Nasdaq Listing Rule 5250(c)(1) (the "Rule") because it had not timely filed the Form 10-Q with the SEC. The Rule requires listed companies to timely file all required  |
| HCCH | 2020-12-09 | EDGAR:0001213900-20-003962 (8-K 2020-02-14) | EDGAR:0001354457-20-000775 (25-NSE 2020-12-10) | 23.31 | zwangs-delisting (edgar-8K-3.01) | 0 |  from the Listing Qualifications Department of the Nasdaq Stock Market ("Nasdaq") stating that the Company is not in compliance with Listing Rule 5550(a)(3), which requires the Company to maintain at least 300 public holders for continued listing on Nasdaq. In accordance with Nasdaq Listing Rule 581 |
| HCII | 2022-12-21 | EDGAR:0001193125-22-029775 (8-K 2022-02-07) | EDGAR:0001354457-22-000769 (25-NSE 2022-12-21) | 10.08 | zwangs-delisting (edgar-8K-3.01) | 0 |  that the Staff had determined to initiate procedures to delist the Company's securities due to the Company's non-compliance, following the termination of the phase-in period provided under Nasdaq Listing Rule 5615(b)(1), with the continued listing requirements as set forth in Nasdaq Listing Rules 5 |
| HORI | 2023-03-10 | EDGAR:0001140361-22-030974 (8-K 2022-08-26) | EDGAR:0001354457-23-000169 (25-NSE 2023-03-10) | 10.4 | zwangs-delisting (edgar-8K-3.01) | 0 |  Qualifications Department of The Nasdaq Stock Market LLC ("Nasdaq") notifying the Company that because it is delinquent in filing its Quarterly Report on Form 10-Q for the period ended June 30, 2022 (the "Form 10-Q"), it was not in compliance with Nasdaq Listing Rule 5250(c)(1) (the "Listing Rule") |
| LEGA | 2023-03-14 | EDGAR:0001213900-22-042425 (8-K 2022-07-28) | EDGAR:0001354457-23-000174 (25-NSE 2023-03-14) | 10.22 | zwangs-delisting (edgar-8K-3.01) | 0 | quirements as set forth in Listing Rule 5605. The staff of Nasdaq (the "Staff") determined that the Company's non-compliance was due to the resignation of Ms. Margaret C. Whitman from the Company's Board of Directors (the "Board") as of July 15, 2022. The Staff determined that it is necessary and ap |
| ORGN | 2026-07-01 | EDGAR:0001802457-25-000070 (8-K 2025-10-07) | EDGAR:0001354457-26-000608 (25-NSE 2026-06-23) | 0.9501 | zwangs-delisting (edgar-8K-3.01) | 0 | ny that, based on the previous 30 consecutive business days, its common stock no longer met the minimum $1.00 bid price required by the continuous listing requirements Nasdaq Listing Rule 5550(a)(2) (the "Minimum Bid Requirement"). Therefore, in accordance with Nasdaq's listing rule 5810(c)(3)(A), t |
| VYGG | 2022-10-05 | EDGAR:0001104659-21-076740 (8-K 2021-06-04) | EDGAR:0000876661-22-000813 (25-NSE 2022-10-06) | 10.05 | zwangs-delisting (edgar-8K-3.01) | 0 | the "Company") received a notice from the New York Stock Exchange (the "NYSE") indicating that the Company is not in compliance with Section 802.01E of the NYSE Listed Company Manual because the Company did not timely file its Quarterly Report on Form 10-Q for the quarter ended March 31, 2021 (the " |

## Liste fuer den Handeintrag (V6): Klasse 1-3 und unbekannt, 18 Reihen

| Reihe | Anker | Polygon-Name | letzter Kurs | Beleg | gelesene Firma (Weg) | alte Tafel | Lauf 2 | Massnahmen-Dateien | K1-3 |
|---|---|---|---|---|---|---|---|---|---|
| CTRP | 2019-11-04 | Ctrip.com International, Ltd. | 34.93 | edgar-ohne-signal | Trip.com Group Ltd (polygon-cik, Probe frueher) | unbekannt (-) | unbekannt | kein Ende-Satz | 250 |
| DISCA | 2022-04-08 | Discovery, Inc. Series A Common Stock | 24.43 | edgar-ohne-signal | DISCOVERY COMMUNICATIONS INC (polygon-cik, Probe passt) | uebernahme (Warner Bros. Discovery, Inc.) | unbekannt | kein Ende-Satz | 250 |
| DISCK | 2022-04-08 | Discovery, Inc. Series C Common Stock | 24.42 | edgar-ohne-signal | DISCOVERY COMMUNICATIONS INC (polygon-cik, Probe passt) | uebernahme (Warner Bros. Discovery, Inc.) | unbekannt | kein Ende-Satz | 250 |
| DWDP | 2019-05-31 | DowDuPont Inc. | 30.51 | edgar-ohne-signal | DuPont de Nemours, Inc. (polygon-cik, Probe frueher) | uebernahme (DOW CHEMICAL CO /DE/) | unbekannt | kein Ende-Satz | 250 |
| FRC | 2023-04-28 | First Republic Bank | 3.5 | edgar-ohne-signal | FIRST REPUBLIC BANK (polygon-cik, Probe passt) | freiwillig (PACIFIC GAS & ELECTRIC Co) | unbekannt | kein Ende-Satz | 250 |
| HRS | 2019-06-28 | Harris | 189 | edgar-ohne-signal | HARRIS CORP (polygon-cik, Probe passt) | uebernahme (L3HARRIS TECHNOLOGIES, INC. /DE/) | unbekannt | kein Ende-Satz | 250 |
| KORS | 2018-12-31 | Michael Kors Holding Lmtd | 37.88 | edgar-ohne-signal | Capri Holdings Ltd (polygon-cik, Probe frueher) | unbekannt (Capri Holdings Ltd) | unbekannt | kein Ende-Satz | 250 |
| SBNY | 2023-03-13 | Signature Bank | 70 | edgar-ohne-signal | Signature Bank Corp (polygon-cik, Probe passt) | insolvenz (Core Scientific, Inc./tx) | unbekannt | kein Ende-Satz | 250 |
| SLW | 2017-05-15 | Silver Wheaton | 20.94 | edgar-ohne-signal | Wheaton Precious Metals Corp. (polygon-cik, Probe frueher) | zwangs-delisting (NEUSTAR INC) | unbekannt | kein Ende-Satz | 250 |
| VRX | 2018-07-13 | Valeant Pharmaceuticals Intl | 23.4 | edgar-ohne-signal | VALEANT PHARMACEUTICALS INTERNATIONAL (polygon-cik, Probe passt) | unbekannt (-) | unbekannt | kein Ende-Satz | 250 |
| WYN | 2018-05-31 | Wyndham Worldwide Corp | 108.44 | edgar-ohne-signal | Travel & Leisure Co. (polygon-cik, Probe frueher) | freiwillig (Service Properties Trust) | unbekannt | kein Ende-Satz | 250 |
| YHOO | 2017-06-16 | Yahoo Inc | 52.68 | nichts | - (fts-mehrheit, Probe nichts) | unbekannt (-) | zwangs-delisting | kein Ende-Satz | 250 |
| QVCA | 2018-03-09 | Liberty Interactive Corporation QVC Group Common Stock Series A | 27.93 | edgar-ohne-signal | Liberty Expedia Holdings, Inc. (polygon-cik, Probe passt) | uebernahme (Old QVC Group, Inc.) | unbekannt | kein Ende-Satz | 237 |
| ESV | 2019-07-30 | Ensco Rowan plc | 8.28 | edgar-ohne-signal | Valaris Ltd (polygon-cik, Probe frueher) | uebernahme (Valaris Ltd) | zwangs-delisting | kein Ende-Satz | 206 |
| SWHC | 2016-12-30 | Smith & Wesson Holding Corporation | 21.08 | edgar-ohne-signal | SMITH & WESSON BRANDS, INC. (polygon-cik, Probe passt) | unbekannt (SMITH & WESSON BRANDS, INC.) | unbekannt | kein Ende-Satz | 44 |
| MHFI | 2016-04-27 | MCGRAW-HILL FINANCIAL INC COM | 108 | edgar-ohne-signal | S&P Global Inc. (polygon-cik, Probe frueher) | unbekannt (-) | unbekannt | kein Ende-Satz | 40 |
| LGF | 2016-12-08 | Lions Gate Entertainment | 26.06 | edgar-ohne-signal | Lions Gate Entertainment Corp (polygon-cik, Probe passt) | unbekannt (-) | unbekannt | kein Ende-Satz | 30 |
| LUK | 2018-05-23 | Leucadia National | 23.48 | edgar-ohne-signal | Jefferies Financial Group Inc. (polygon-cik, Probe frueher) | unbekannt (-) | unbekannt | kein Ende-Satz | 11 |
