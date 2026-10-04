# Anhang zu PHASE2A.md, Teil 4 (erzeugt von t4-auswerten.js, Stand 2026-10-04T11:57:31.376Z)

## Matrix Grund alt (Zeile) -> Grund neu (Spalte), alle 4996 Zeilen der alten Tafel

| alt \ neu | umbenennung-ticker | uebernahme | fusion-aktientausch | insolvenz | spac-ende | zwangs-delisting | freiwillig | abgemeldet-anlass-offen | unbekannt | Summe |
|---|---|---|---|---|---|---|---|---|---|---|
| umbenennung-ticker | 1317 | . | . | **1** | **1** | **9** | . | . | **2** | 1330 |
| uebernahme | . | 1508 | **1** | . | **4** | **58** | **2** | **24** | **56** | 1653 |
| fusion-aktientausch | . | . | 308 | . | **1** | **1** | . | . | . | 310 |
| insolvenz | . | **4** | . | 321 | **1** | **12** | **1** | **6** | **12** | 357 |
| spac-ende | . | . | . | . | 270 | **4** | . | . | **2** | 276 |
| zwangs-delisting | **1** | **15** | . | **7** | **6** | 463 | . | **24** | **31** | 547 |
| freiwillig | . | **8** | . | **1** | **5** | **20** | 19 | **236** | **22** | 311 |
| unbekannt | . | **23** | . | **4** | **4** | **21** | **1** | **46** | 113 | 212 |
| *neue Reihen* | 4 | 5 | 3 | 1 | . | 40 | . | 1 | . | 54 |

## Die 30 groessten Kipp-Faelle (von 342; "gross" = meiste Zeilen in Klasse 1-3 unter den letzten 250 Panel-Zeilen)

| Reihe | Anker (alt -> neu) | alt: Grund (Beleg, Datum) | alter Beleg | neu: Grund (Beleg, Datum) | neuer Beleg | Firma | Ursache | Hinweise | neuer Beleg: Tage zum Anker | Zeilen K1-3 (letzte 250) |
|---|---|---|---|---|---|---|---|---|---|---|
| DWDP | 2019-05-31 | uebernahme (edgar-8K-2.01+prospekt, 2019-04-02) | 0001193125-19-095134 (8-K 2019-04-02) | unbekannt (edgar-ohne-signal, -) | - | DOW CHEMICAL CO /DE/ -> DuPont de Nemours, Inc. | R-a+R-b | - | - | 250 |
| AET | 2018-11-28 | uebernahme (edgar-8K-2.01+prospekt, 2018-11-28) | 0001122304-18-000178 (8-K 2018-11-28) | unbekannt (edgar-ohne-signal, -) | - | AETNA INC /PA/ -> AETNA SERVICES INC /CT/ | R-a | alte-firma-traegt-polygon-namen | - | 250 |
| RTN | 2020-04-02 | uebernahme (edgar-8K-2.01+prospekt, 2020-04-03) | 0001193125-20-097237 (8-K 2020-04-03) | unbekannt (edgar-ohne-signal, -) | - | RAYTHEON CO/ -> RAYTHEON CO | R-a | alte-firma-traegt-polygon-namen | - | 250 |
| DISCA | 2022-04-08 | uebernahme (edgar-8K-2.01+prospekt, 2022-04-12) | 0001193125-22-103051 (8-K 2022-04-12) | unbekannt (edgar-ohne-signal, -) | - | Warner Bros. Discovery, Inc. -> DISCOVERY COMMUNICATIONS INC | R-a | - | - | 250 |
| SBNY | 2025-03-21 -> 2023-03-13 | insolvenz (edgar-8K-1.03, 2024-01-17) | 0001193125-24-008952 (8-K 2024-01-17) | unbekannt (edgar-ohne-signal, -) | - | Core Scientific, Inc./tx -> Signature Bank Corp | Anker+R-a | - | - | 250 |
| DISCK | 2022-04-08 | uebernahme (edgar-8K-2.01+prospekt, 2022-04-12) | 0001193125-22-103051 (8-K 2022-04-12) | unbekannt (edgar-ohne-signal, -) | - | Warner Bros. Discovery, Inc. -> DISCOVERY COMMUNICATIONS INC | R-a | - | - | 250 |
| FRC | 2023-04-28 | freiwillig (edgar-formular15, 2023-08-30) | 0000950157-23-000914 (15-12G 2023-08-30) | unbekannt (edgar-ohne-signal, -) | - | PACIFIC GAS & ELECTRIC Co -> FIRST REPUBLIC BANK | R-a | - | - | 250 |
| BCR | 2017-12-28 | zwangs-delisting (edgar-8K-3.01, 2017-12-29) | 0001193125-17-383532 (8-K 2017-12-29) | unbekannt (edgar-ohne-signal, -) | - | BARD C R INC /NJ/ -> BARD C R INC (PRED) | R-a | polygon-name-passt-nicht | - | 250 |
| BHI | 2017-07-03 | uebernahme (edgar-8K-2.01+prospekt, 2017-01-06) | 0000950103-17-000207 (8-K 2017-01-06) | abgemeldet-anlass-offen (edgar-formular25, 2017-07-05) | 0000876661-17-000381 (25-NSE 2017-07-05) | Baker Hughes Holdings LLC | R-b | - | +2 | 250 |
| ETP | 2018-10-18 | uebernahme (edgar-8K-2.01+prospekt, 2018-10-19) | 0001193125-18-303200 (8-K 2018-10-19) | zwangs-delisting (edgar-8K-3.01, 2017-04-28) | 0001193125-17-148998 (8-K 2017-04-28) | Energy Transfer Operating, L.P. -> Energy Transfer, LP | R-a | alte-firma-traegt-polygon-namen, 3.01-mit-5.01, beleg-fern-vom-anker | -538 | 250 |
| HRS | 2019-06-28 | uebernahme (edgar-8K-2.01+prospekt, 2019-07-01) | 0001140361-19-012139 (8-K 2019-07-01) | unbekannt (edgar-ohne-signal, -) | - | L3HARRIS TECHNOLOGIES, INC. /DE/ -> HARRIS CORP | R-a | - | - | 250 |
| LVLT | 2017-10-31 | uebernahme (edgar-8K-2.01+prospekt, 2017-11-01) | 0001193125-17-329395 (8-K 2017-11-01) | unbekannt (edgar-ohne-signal, -) | - | Level 3 Parent, LLC -> EXPEDITORS INTERNATIONAL OF WASHINGTON INC | R-a | polygon-name-passt-nicht, alte-firma-traegt-polygon-namen | - | 250 |
| SLW | 2017-05-15 | zwangs-delisting (edgar-8K-3.01, 2017-08-08) | 0001193125-17-251307 (8-K 2017-08-08) | unbekannt (edgar-ohne-signal, -) | - | NEUSTAR INC -> Wheaton Precious Metals Corp. | R-a | - | - | 250 |
| SNI | 2018-03-06 | uebernahme (edgar-8K-2.01+prospekt, 2018-03-06) | 0001193125-18-072063 (8-K 2018-03-06) | unbekannt (edgar-ohne-signal, -) | - | Scripps Networks Interactive, Inc. -> ENERGY FOCUS, INC/DE | R-a | polygon-name-passt-nicht, alte-firma-traegt-polygon-namen | - | 250 |
| SYMC | 2019-11-04 | zwangs-delisting (edgar-8K-3.01, 2018-08-13) | 0001193125-18-247320 (8-K 2018-08-13) | unbekannt (edgar-ohne-signal, -) | - | Gen Digital Inc. -> NEXLAND INC | R-a | polygon-name-passt-nicht | - | 250 |
| WYN | 2018-05-31 | freiwillig (edgar-formular25, 2017-02-09) | 0001354457-17-000028 (25-NSE 2017-02-09) | unbekannt (edgar-ohne-signal, -) | - | Service Properties Trust -> Travel & Leisure Co. | R-a+R-c | - | - | 250 |
| YNDX | 2024-08-19 -> 2022-02-28 | umbenennung-ticker (alpaca-name_changes, 2024-08-21) | alpaca-massnahmen:5487d127-ede6-4644-a537-c8e1e18d2a4d | unbekannt (massnahme-passt-nicht, -) | - | - | Anker | - | - | 250 |
| QVCA | 2018-03-09 | uebernahme (edgar-8K-2.01+prospekt, 2018-03-15) | 0001104659-18-017857 (8-K 2018-03-15) | unbekannt (edgar-ohne-signal, -) | - | Old QVC Group, Inc. -> Liberty Expedia Holdings, Inc. | R-a | - | - | 237 |
| PF | 2018-10-25 | zwangs-delisting (edgar-8K-3.01, 2019-03-01) | 0001600132-19-000047 (8-K 2019-03-01) | uebernahme (edgar-8K-2.01+prospekt, 2018-10-26) | 0001193125-18-308612 (8-K 2018-10-26) | Bellerophon Therapeutics, Inc. -> PINNACLE FOODS INC. | R-a | - | +1 | 216 |
| ESV | 2019-07-30 | uebernahme (edgar-8K-2.01+prospekt, 2019-04-11) | 0001104659-19-020867 (8-K 2019-04-11) | zwangs-delisting (edgar-8K-3.01, 2020-04-21) | 0000314808-20-000052 (8-K 2020-04-21) | Valaris Ltd | R-b | 3.01-mit-fusionsbeleg, beleg-fern-vom-anker | +266 | 206 |
| WNR | 2017-06-01 | uebernahme (edgar-8K-2.01+prospekt, 2016-09-20) | 0001193125-16-713970 (8-K 2016-09-20) | zwangs-delisting (edgar-8K-3.01, 2017-06-02) | 0001193125-17-193141 (8-K 2017-06-02) | Western Refining, Inc. | R-b | 3.01-mit-fusionsbeleg | +1 | 171 |
| MDSO | 2019-10-28 | uebernahme (edgar-8K-2.01+prospekt, 2019-10-28) | 0001140361-19-019146 (8-K 2019-10-28) | unbekannt (edgar-ohne-signal, -) | - | Medidata Solutions, Inc. -> ICF International, Inc. | R-a | polygon-name-passt-nicht, alte-firma-traegt-polygon-namen | - | 112 |
| KATE | 2017-07-11 | freiwillig (edgar-formular15, 2018-01-24) | 0000785786-18-000008 (15-12B 2018-01-24) | uebernahme (edgar-8K-2.01+prospekt, 2017-07-11) | 0001567619-17-001421 (8-K 2017-07-11) | PLEXUS CORP -> Kate Spade & Co | R-a | - | 0 | 95 |
| OZRK | 2018-07-13 | uebernahme (edgar-8K-2.01+prospekt, 2017-06-26) | 0001564590-17-012994 (8-K 2017-06-26) | zwangs-delisting (edgar-8K-3.01, 2017-06-26) | 0001564590-17-012994 (8-K 2017-06-26) | BANK OF THE OZARKS INC | R-b | 3.01-mit-fusionsbeleg, beleg-fern-vom-anker | -382 | 76 |
| SWFT | 2017-09-08 | freiwillig (edgar-formular25, 2017-09-11) | 0000876661-17-000513 (25-NSE 2017-09-11) | uebernahme (edgar-8K-2.01+prospekt, 2017-09-11) | 0001144204-17-047372 (8-K 2017-09-11) | Knight-Swift Transportation Holdings Inc. | R-c | - | +3 | 49 |
| JAH | 2016-04-15 | uebernahme (edgar-8K-2.01+prospekt, 2015-11-02) | 0001193125-15-362500 (8-K 2015-11-02) | zwangs-delisting (edgar-8K-3.01, 2016-04-15) | 0001193125-16-543023 (8-K 2016-04-15) | JARDEN CORP | R-b | 3.01-mit-fusionsbeleg, 3.01-mit-5.01 | 0 | 32 |
| ISIL | 2017-02-23 | uebernahme (edgar-8K-2.01+prospekt, 2017-02-27) | 0001193125-17-057480 (8-K 2017-02-27) | unbekannt (edgar-ohne-signal, -) | - | INTERSIL CORP/DE -> IXI Mobile, Inc. | R-a | polygon-name-passt-nicht, alte-firma-traegt-polygon-namen | - | 31 |
| ESL | 2019-03-13 | insolvenz (edgar-8K-1.03, 2018-10-15) | 0001193125-18-298778 (8-K 2018-10-15) | uebernahme (edgar-8K-2.01+prospekt, 2019-03-14) | 0000033619-19-000003 (8-K 2019-03-14) | SEARS HOLDINGS CORP -> ESTERLINE TECHNOLOGIES CORP | R-a | - | +1 | 24 |
| GRUB | 2022-03-11 | uebernahme (edgar-8K-2.01+prospekt, 2021-06-15) | 0001193125-21-190684 (8-K 2021-06-15) | abgemeldet-anlass-offen (edgar-formular25, 2022-03-04) | 0000950157-22-000237 (25 2022-03-04) | GrubHub Inc. -> Just Eat Takeaway.com N.V. | R-a+R-b | - | -7 | 16 |
| SODA | 2018-12-04 | zwangs-delisting (edgar-8K-3.01, 2018-03-13) | 0001575051-18-000024 (8-K 2018-03-13) | abgemeldet-anlass-offen (edgar-formular25, 2018-12-06) | 0001354457-18-000500 (25-NSE 2018-12-06) | Sisecam Resources LP -> SodaStream International Ltd. | R-a | - | +2 | 10 |

## 20 zufaellig gezogene Kipp-Faelle (Saat `t4-kipp`)

| Reihe | Anker (alt -> neu) | alt: Grund (Beleg, Datum) | alter Beleg | neu: Grund (Beleg, Datum) | neuer Beleg | Firma | Ursache | Hinweise | neuer Beleg: Tage zum Anker | Zeilen K1-3 (letzte 250) |
|---|---|---|---|---|---|---|---|---|---|---|
| WYN | 2018-05-31 | freiwillig (edgar-formular25, 2017-02-09) | 0001354457-17-000028 (25-NSE 2017-02-09) | unbekannt (edgar-ohne-signal, -) | - | Service Properties Trust -> Travel & Leisure Co. | R-a+R-c | - | - | 250 |
| ZEAL | 2022-09-29 | uebernahme (edgar-8K-2.01+prospekt, 2022-02-14) | 0001171843-22-001000 (8-K 2022-02-14) | abgemeldet-anlass-offen (edgar-formular25, 2022-09-20) | 0001104659-22-101563 (25 2022-09-20) | FIRST MID BANCSHARES, INC. -> Zealand Pharma A/S | R-a+R-b | - | -9 | 0 |
| SMTA | 2019-12-31 | uebernahme (edgar-8K-2.01+prospekt, 2019-09-24) | 0001193125-19-252544 (8-K 2019-09-24) | zwangs-delisting (edgar-8K-3.01, 2019-12-11) | 0001193125-19-310981 (8-K 2019-12-11) | SMTA Liquidating Trust | R-b | 3.01-mit-fusionsbeleg | -20 | 0 |
| HSTO | 2024-11-13 -> 2023-10-04 | insolvenz (q-kuerzel, 2024-11-15) | alpaca-massnahmen:d8d3b77a-d0fd-42c7-a914-3d27634df161 | zwangs-delisting (edgar-8K-3.01, 2023-09-26) | 0000950170-23-049922 (8-K 2023-09-26) | Histogen Inc. | Anker | - | -8 | 0 |
| ELOS | 2017-07-14 | freiwillig (edgar-formular25, 2017-07-17) | 0001354457-17-000132 (25-NSE 2017-07-17) | unbekannt (edgar-ohne-signal, -) | - | Syneron Medical Ltd. -> DALTON GREINER HARTMAN MAHER & CO | R-a+R-c | polygon-name-passt-nicht, alte-firma-traegt-polygon-namen | - | 0 |
| OAKS | 2018-05-25 | zwangs-delisting (edgar-8K-3.01, 2018-06-08) | 0001558370-18-005196 (8-K 2018-06-08) | abgemeldet-anlass-offen (edgar-formular25, 2019-02-14) | 0000876661-19-000134 (25-NSE 2019-02-14) | Apex Global Brands Inc. -> Lument Finance Trust, Inc. | R-a | beleg-fern-vom-anker | +265 | 0 |
| VRNG | 2016-05-06 | uebernahme (edgar-8K-2.01+prospekt, 2015-10-16) | 0001144204-15-059695 (8-K 2015-10-16) | zwangs-delisting (edgar-8K-3.01, 2016-03-17) | 0001144204-16-088581 (8-K 2016-03-17) | XWELL, Inc. | R-b | 3.01-mit-fusionsbeleg, beleg-fern-vom-anker | -50 | 0 |
| RSYS | 2018-12-11 | uebernahme (edgar-8K-2.01+prospekt, 2018-12-11) | 0000873044-18-000197 (8-K 2018-12-11) | unbekannt (edgar-ohne-signal, -) | - | RADISYS CORP -> PARNASSUS INVESTMENTS, LLC | R-a | polygon-name-passt-nicht, alte-firma-traegt-polygon-namen | - | 0 |
| TMPO | 2023-12-12 -> 2023-11-01 | insolvenz (q-kuerzel, 2023-12-14) | alpaca-massnahmen:f950797a-d2be-49ae-aee8-61aba862c1c2 | zwangs-delisting (edgar-8K-3.01, 2023-08-23) | 0001104659-23-094401 (8-K 2023-08-23) | Tempo Automation Holdings, Inc. | Anker | beleg-fern-vom-anker | -70 | 0 |
| PKBO | 2025-03-21 -> 2023-01-09 | uebernahme (edgar-8K-2.01+prospekt, 2024-11-14) | 0000950170-24-127099 (8-K 2024-11-14) | zwangs-delisting (edgar-8K-3.01, 2023-01-09) | 0001193125-23-004066 (8-K 2023-01-09) | Peak Bio, Inc. | Anker+R-b | 3.01-mit-fusionsbeleg | 0 | 0 |
| RACY | 2024-04-30 -> 2023-01-11 | spac-ende (edgar-mantel+abmeldung, 2024-06-03) | 0001354457-24-000380 (25-NSE 2024-06-03) | zwangs-delisting (edgar-8K-3.01, 2023-01-19) | 0001213900-23-003767 (8-K 2023-01-19) | Relativity Acquisition Corp | Anker | - | +8 | 0 |
| BBOX | 2019-01-04 | uebernahme (edgar-8K-2.01+prospekt, 2019-01-07) | 0001193125-19-003796 (8-K 2019-01-07) | unbekannt (edgar-ohne-signal, -) | - | BLACK BOX CORP -> LOMBARDIA CAPITAL PARTNERS LLC | R-a | polygon-name-passt-nicht, alte-firma-traegt-polygon-namen | - | 0 |
| QVCGB | 2026-04-17 -> 2025-05-27 | insolvenz (q-kuerzel+edgar-8K-1.03, 2026-04-17) | 0001104659-26-044521 (8-K 2026-04-17) | zwangs-delisting (edgar-8K-3.01, 2025-05-16) | 0001104659-25-049822 (8-K 2025-05-16) | Old QVC Group, Inc. | Anker | - | -11 | 0 |
| SNAK | 2017-12-14 | uebernahme (edgar-8K-2.01+prospekt, 2017-12-14) | 0001193125-17-369121 (8-K 2017-12-14) | unbekannt (edgar-ohne-signal, -) | - | INVENTURE FOODS, INC. -> CECO ENVIRONMENTAL CORP | R-a | polygon-name-passt-nicht, alte-firma-traegt-polygon-namen | - | 0 |
| LG | 2016-04-28 | zwangs-delisting (edgar-8K-3.01, 2015-12-21) | 0001647488-15-000235 (8-K 2015-12-21) | unbekannt (edgar-ohne-signal, -) | - | Rich Pharmaceuticals, Inc. -> SPIRE MISSOURI INC | R-a | - | - | 0 |
| ACER | 2024-10-17 -> 2023-11-08 | uebernahme (edgar-8K-2.01+prospekt, 2023-11-20) | 0001193125-23-280679 (8-K 2023-11-20) | fusion-aktientausch (alpaca-stock_mergers, 2023-11-21) | alpaca-massnahmen:d7e20bed-2eb0-486f-a9b4-d6220bc28072 | Acer Therapeutics Inc. | Anker | - | +13 | 0 |
| SIGM | 2018-08-24 | uebernahme (edgar-8K-2.01+prospekt, 2018-04-25) | 0001437749-18-007622 (8-K/A 2018-04-25) | zwangs-delisting (edgar-8K-3.01, 2018-08-03) | 0001437749-18-014443 (8-K 2018-08-03) | SIGMA DESIGNS INC | R-b | 3.01-mit-fusionsbeleg | -21 | 0 |
| AFAQ | 2022-12-22 | uebernahme (edgar-8K-2.01+prospekt, 2022-06-02) | 0001193125-22-166249 (8-K 2022-06-02) | spac-ende (edgar-mantel+abmeldung, 2022-12-22) | 0001354457-22-000774 (25-NSE 2022-12-22) | biote Corp. -> AF Acquisition Corp. | R-a+R-b | - | 0 | 0 |
| MFRI | 2017-03-20 | zwangs-delisting (edgar-8K-3.01, 2017-01-03) | 0001002135-17-000003 (8-K 2017-01-03) | unbekannt (edgar-ohne-signal, -) | - | WESTELL TECHNOLOGIES INC -> Perma-Pipe International Holdings, Inc. | R-a | - | - | 0 |
| RAAS | 2023-05-16 | uebernahme (edgar-8K-2.01+prospekt, 2023-01-25) | 0001213900-23-005151 (8-K 2023-01-25) | abgemeldet-anlass-offen (edgar-formular25, 2023-10-25) | 0001143362-23-000447 (25-NSE 2023-10-25) | Ondas Inc. -> Cloopen Group Holding Ltd | R-a+R-b | beleg-fern-vom-anker | +162 | 0 |

## Geaenderte Totalverlust-Eigenschaft (Insolvenz, Zwangs-Delisting) mit Klasse 1-3: alle 14 Reihen

| Reihe | Anker | Richtung | alt (Grund, Beleg, Datum, Firma) | neu (Grund, Beleg, Datum, Firma) | Ursache | Hinweise | Zeilen K1-3 | Zeilen K2-3 |
|---|---|---|---|---|---|---|---|---|
| YHOO | 2017-06-16 | kommt-hinzu | unbekannt (nichts, -, -) | zwangs-delisting (edgar-8K-3.01, 2017-05-03, FIELDPOINT PETROLEUM CORP) | R-a | polygon-name-passt-nicht, beleg-fern-vom-anker | 250 | 250 |
| SBNY | 2023-03-13 | faellt-weg | insolvenz (edgar-8K-1.03, 2024-01-17, Core Scientific, Inc./tx) | unbekannt (edgar-ohne-signal, -, Signature Bank Corp) | Anker+R-a | - | 250 | 48 |
| BCR | 2017-12-28 | faellt-weg | zwangs-delisting (edgar-8K-3.01, 2017-12-29, BARD C R INC /NJ/) | unbekannt (edgar-ohne-signal, -, BARD C R INC (PRED)) | R-a | polygon-name-passt-nicht | 250 | 0 |
| DVMT | 2018-12-27 | kommt-hinzu | unbekannt (nichts, -, -) | zwangs-delisting (edgar-8K-3.01, 2018-12-28, Dell Technologies Inc.) | R-a | 3.01-mit-fusionsbeleg | 250 | 0 |
| ETP | 2018-10-18 | kommt-hinzu | uebernahme (edgar-8K-2.01+prospekt, 2018-10-19, Energy Transfer Operating, L.P.) | zwangs-delisting (edgar-8K-3.01, 2017-04-28, Energy Transfer, LP) | R-a | alte-firma-traegt-polygon-namen, 3.01-mit-5.01, beleg-fern-vom-anker | 250 | 0 |
| SLW | 2017-05-15 | faellt-weg | zwangs-delisting (edgar-8K-3.01, 2017-08-08, NEUSTAR INC) | unbekannt (edgar-ohne-signal, -, Wheaton Precious Metals Corp.) | R-a | - | 250 | 0 |
| SYMC | 2019-11-04 | faellt-weg | zwangs-delisting (edgar-8K-3.01, 2018-08-13, Gen Digital Inc.) | unbekannt (edgar-ohne-signal, -, NEXLAND INC) | R-a | polygon-name-passt-nicht | 250 | 0 |
| PF | 2018-10-25 | faellt-weg | zwangs-delisting (edgar-8K-3.01, 2019-03-01, Bellerophon Therapeutics, Inc.) | uebernahme (edgar-8K-2.01+prospekt, 2018-10-26, PINNACLE FOODS INC.) | R-a | - | 216 | 0 |
| ESV | 2019-07-30 | kommt-hinzu | uebernahme (edgar-8K-2.01+prospekt, 2019-04-11, Valaris Ltd) | zwangs-delisting (edgar-8K-3.01, 2020-04-21, Valaris Ltd) | R-b | 3.01-mit-fusionsbeleg, beleg-fern-vom-anker | 206 | 0 |
| WNR | 2017-06-01 | kommt-hinzu | uebernahme (edgar-8K-2.01+prospekt, 2016-09-20, Western Refining, Inc.) | zwangs-delisting (edgar-8K-3.01, 2017-06-02, Western Refining, Inc.) | R-b | 3.01-mit-fusionsbeleg | 171 | 0 |
| OZRK | 2018-07-13 | kommt-hinzu | uebernahme (edgar-8K-2.01+prospekt, 2017-06-26, BANK OF THE OZARKS INC) | zwangs-delisting (edgar-8K-3.01, 2017-06-26, BANK OF THE OZARKS INC) | R-b | 3.01-mit-fusionsbeleg, beleg-fern-vom-anker | 76 | 0 |
| JAH | 2016-04-15 | kommt-hinzu | uebernahme (edgar-8K-2.01+prospekt, 2015-11-02, JARDEN CORP) | zwangs-delisting (edgar-8K-3.01, 2016-04-15, JARDEN CORP) | R-b | 3.01-mit-fusionsbeleg, 3.01-mit-5.01 | 32 | 0 |
| ESL | 2019-03-13 | faellt-weg | insolvenz (edgar-8K-1.03, 2018-10-15, SEARS HOLDINGS CORP) | uebernahme (edgar-8K-2.01+prospekt, 2019-03-14, ESTERLINE TECHNOLOGIES CORP) | R-a | - | 24 | 0 |
| SODA | 2018-12-04 | faellt-weg | zwangs-delisting (edgar-8K-3.01, 2018-03-13, Sisecam Resources LP) | abgemeldet-anlass-offen (edgar-formular25, 2018-12-06, SodaStream International Ltd.) | R-a | - | 10 | 0 |
