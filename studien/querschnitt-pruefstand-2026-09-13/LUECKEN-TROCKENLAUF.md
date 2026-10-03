# Lücken-Trockenlauf: verklebte Reihen im Panel v2.1 (Auftrag Nr. 64, Phase 1)

*Erzeugt von `luecken-trockenlauf.js` aus `luecken-kandidaten.json` — jede Zahl und jede Tabelle stammt aus dem Lauf. Nur gelesen, nichts am Panel geändert, nichts entschieden.*

**Kurz:** Panel `voll/` (9.904.017 Zeilen, 7.338 Reihen, bis 2026-09-15) hat **141 Lücken > 90 Kalendertage in 140 Reihen**. Maschinell belegt sind 37 (Fall I 31, II 2, III 4); **104 bleiben Fall IV**, weil die lokalen Quellen den Emittenten vor der Lücke nicht kennen. Die Regel „Polygon-Delisting in der Lücke" trifft **0** Fälle, und der Kursanschluss trägt an den fünf bekannten Fällen nicht (3 von 5).

## 1. Dateiformate (selbst festgestellt)

**`massive/verschwundene.json`** (Quelle `api.massive.com/v3/reference/tickers?active=false&market=stocks`): Kopf `stand`, `quelle`, `seiten`, `abgebrochen`, `gesamt`, `aktienartig`, `hinweis` plus `eintraege` (Liste, 6.921 von 23.422 gemeldeten, nur aktienartige). Je Eintrag `sym`, `name`, `boerse`, `art`, `waehrung`, `von`, `bis`, `cik`. Das Delisting-Datum ist `bis` (gesetzt bei 6.707); **`von` ist bei allen leer** (gesetzt bei 0). 6.896 verschiedene Kürzel; 25 Kürzel stehen zweimal, davon 0 mit anderem Namen oder anderer `cik` — es sind Seitendubletten (`bis` gleich oder um einen Tag versetzt), kein zweiter Emittent. **Folge:** die Datei führt je Kürzel genau einen Emittenten, den letzten nicht mehr aktiven Inhaber. „Mehrere Einträge je Kürzel = mehrere Emittenten" kommt nicht vor; ohne `von` ist „Name davor ≠ Name danach" aus dieser Datei nicht prüfbar; ist das Kürzel heute aktiv (SN, MBLY, DOW, CART), gibt es keinen Eintrag.

**`alpaca-massnahmen/<SYM>.json`**: Kopf `sym`, `stand`, `quelle`, `von`, `bis`, `saetze`, `anwendbar`, `ohneFaktor` (BBBY zusätzlich `gemesseneFaktoren`). Ein `name_changes`-Satz trägt `_art`, `id`, `old_symbol`, `new_symbol`, `old_cusip`, `new_cusip`, `process_date` — `process_date` ist das einzige Datumsfeld. Belege aus drei Dateien:

- `HCP.json`: `{"_art":"name_changes","id":"aeb6a11a-695c-448c-a221-5e8e4332d010","new_cusip":"42250P103","new_symbol":"PEAK","old_cusip":"42250P103","old_symbol":"HCP","process_date":"2019-11-06"}`
- `BBBY.json`: `{"_art":"name_changes","id":"6897e3b8-61a9-4097-a66a-ae0818171bff","new_cusip":"690370101","new_symbol":"NXH","old_cusip":"690370101","old_symbol":"BBBY","process_date":"2026-08-17"}`
- `BBBY.json`: `{"_art":"name_changes","id":"bfd38d6e-fde6-4bc2-aa2b-e95ee6b9a154","new_cusip":"690370101","new_symbol":"BBBY","old_cusip":"690370101","old_symbol":"BYON","process_date":"2025-08-29"}`
- `OVV.json`: `{"_art":"name_changes","id":"6034029c-88d1-41a9-b686-b5ee457d822f","new_cusip":"69047Q102","new_symbol":"OVV","old_cusip":"69047Q102","old_symbol":"ECA","process_date":"2020-01-27"}`

Zusätzlich gelesen, weil Polygon und `name_changes` allein fast nichts tragen (§4): die CUSIP-Felder aller Satzarten (`cusip`, `old_cusip`/`new_cusip`, `acquiree_cusip`, `source_cusip`), Übernahme- und Wertlos-Sätze (`*_mergers` mit `acquiree_symbol`/`effective_date`, `worthless_removals`), `spin_offs` (`new_symbol`, `ex_date`) — über **alle** 8.345 Maßnahmendateien, damit auch Sätze in der Datei der Gegenseite zählen — und das Yahoo-Tagesarchiv `archiv1d/bars_1d_<SYM>.json` (`series[0][0]` = erster Balken; Yahoo führt nur die Historie des heutigen Inhabers eines Kürzels). `_lebenszeit.json` (`werte[SYM]`: `ersterMinutentag`, `letzterMinutentag`, `minutentage`, `wiederverwendet`, `zweiteReihe`) kennt nur die drei Archiv-Fälle AAC, CAPA, JONE; sein Schnitt fällt in 0 der 141 Lücken. Der Eintrag steht je Lücke in der JSON.

## 2. Gegenprobe der Zählung

| Schwelle (Kal.-Tage) | PM-Zählung 22.09. | Reihen (Zeilenlisten) | Reihen (zweiter Weg: ein Durchlauf in Panelordnung) | Lücken | Basis-Kürzel |
|---|---|---|---|---|---|
| > 90 | 140 | 140 | 140 | 141 | 138 |
| > 180 | 121 | 121 | 121 | 121 | 120 |
| > 365 | 101 | 101 | 101 | 101 | 101 |

Die drei Zahlen stimmen. Es sind 141 Lücken in 140 Reihen, weil eine Reihe zwei Lücken hat; 2 Lücken liegen in bestehenden `~2`-Reihen, 6 in Reihen, die schon eine `~2`-Reihe haben (Auskunft, kein Kriterium).

## 3. Kursanschluss an fünf bekannten Fällen — trägt nicht, wird nicht verwendet

Kriterium: `rohSchluss` nach / vor der Lücke in [0,5; 2,0] = „schließt an" (spräche für III), außerhalb = „schließt nicht an" (spräche für I/II). Fünfter Fall eigener Wahl: EBR (Eletrobras-ADR; die Lücke 17.05.–13.10.2016 ist nach meiner Kenntnis die NYSE-Aussetzung wegen des verspäteten Jahresberichts — **ohne Netz nicht nachgeprüft**).

| Reihe | Lücke | rohSchluss vor → nach | Verhältnis | Kriterium sagt | erwartet | trägt | maschineller Fall (Beleg) |
|---|---|---|---|---|---|---|---|
| SN | 1.623 | 0,36 → 42,31 | ×117,30 | schließt nicht an | I | ja | I (yahoo-beginnt-nach-luecke) |
| MBLY | 1.882 | 62,73 → 29,29 | ×0,47 | schließt nicht an | II | ja | I (yahoo-beginnt-nach-luecke) |
| CHK | 229 | 11,85 → 44,99 | ×3,80 | schließt nicht an | II | ja | II (cusip-neues-papier) |
| DOW | 579 | 66,08 → 56,00 | ×0,85 | schließt an | II | **nein** | I (yahoo-beginnt-nach-luecke) |
| EBR | 149 | 1,95 → 6,66 | ×3,42 | schließt nicht an | III | **nein** | IV (kein Beleg in den lokalen Quellen) |

**3 von 5.** DOW (×0,85) liegt im Anschlussbereich, obwohl es ein neues Papier ist; EBR (×3,42) liegt außerhalb, obwohl es dieselbe Notierung sein soll; MBLY (×0,47) liegt nur knapp außerhalb. Gegenprobe an den 37 maschinell belegten Lücken: von 33 Trennfällen (I/II) schließen **8** an (STR, GIG~2, GAINL, MLAC, DOW, HYAC~2, EVER, SAMA), von 4 III-Fällen schließt 1 nicht an (BSGM). Grund: Mantelgesellschaften notieren um 10 $, Vorzugs- und Anleihepapiere um 25 $ — ein neuer Emittent „schließt" dort von selbst an. **Das Kriterium geht deshalb in keine Einordnung ein**; das Verhältnis steht nur als Spalte in den Tabellen.

## 4. Einordnung Fall I–IV: Regeln und Zähler

Fall **I** = anderer Emittent oder neues Papier, Trennung belegt (ob es dieselbe Firma ist, bleibt unbelegt); **II** = derselbe Emittent belegt, neues Papier; **III** = dasselbe Papier belegt; **IV** = kein Beleg oder Belege widersprechen sich. Reihenfolge: Trenn- und Gleich-Beleg zugleich → IV; Abspaltung oder „CUSIP neues Papier" → II; sonst irgendein Trenn-Beleg → I; sonst Gleich-Beleg → III; sonst IV.

| Fall | Lücken |
|---|---|
| I | 31 |
| II | 2 |
| III | 4 |
| IV | 104 |

| Regel | spricht für | Schwelle und Zielbereich | trifft | davon allein (einziger Beleg) | Beispiele |
|---|---|---|---|---|---|
| `cusip6-verschieden` | I | CUSIP-Emittentennummer (erste 6 Stellen) des jüngsten Satzes der Maßnahmendatei vor der Lücke ≠ des frühesten danach (Sätze je im eigenen Abschnitt ±60 Kalendertage) | 7 | 1 | LB, GIG~2, EMCG, MLAC, FGMC, HYAC~2 |
| `polygon-delisting-in-luecke` | I | Polygon-`bis` (verschwundene.json) liegt in [letzter Tag vor der Lücke − 10 Kalendertage; erster Tag danach) | 0 | 0 | – |
| `namechange-A` | I | `name_changes` Regel A (old_symbol = Kürzel ≠ new_symbol) mit `process_date` in [letzter Tag − 60 Kalendertage; erster Tag danach) | 2 | 0 | GIG~2, HYAC~2 |
| `namechange-B` | I | `name_changes` Regel B (new_symbol = Kürzel ≠ old_symbol) mit `process_date` in (letzter Tag vor; erster Tag danach + 60 Kalendertage] | 7 | 7 | STR, REE, CVT, CERE, FREE, ESGL |
| `uebernahme-wertlos` | I | Übernahme- (`*_mergers`, acquiree_symbol = Kürzel) oder Wertlos-Satz (`worthless_removals`) mit Datum in [letzter Tag − 60 Kalendertage; erster Tag danach) | 4 | 1 | MLAC, FGMC, HYAC~2, SAMA |
| `abspaltung-auf-kuerzel` | II | `spin_offs` mit new_symbol = Kürzel und Ex-Tag in (letzter Tag vor; erster Tag danach + 60 Kalendertage] | 0 | 0 | – |
| `yahoo-beginnt-nach-luecke` | I | erster Balken des Yahoo-Tagesarchivs (`archiv1d/bars_1d_<SYM>.json`) liegt in (letzter Tag vor der Lücke; erster Tag danach + 10 Kalendertage] | 18 | 16 | LINE, MBLY, SN, CART, LB, PARA |
| `cusip-neues-papier` | II | CUSIP-Emittentennummer (6 Stellen) vor = nach der Lücke, volle CUSIP (9 Stellen) verschieden | 2 | 2 | GAINL, CHK |
| `cusip9-gleich` | III | volle CUSIP (9 Stellen) des jüngsten Satzes vor der Lücke = des frühesten danach | 2 | 2 | MINM, BSGM |
| `yahoo-reicht-vor-luecke` | III | erster Balken des Yahoo-Tagesarchivs liegt am oder vor dem letzten Tag vor der Lücke (in (−∞; letzter Tag vor]) | 2 | 2 | SMCI, BTBT |

- **Polygon-Delisting in der Lücke: 0 Treffer.** Lage der Polygon-Einträge zur Lücke: nach 118, ohne-datum 3; 20 Lücken ohne Eintrag. Der Eintrag beschreibt den Inhaber **nach** der Lücke (JMG = JM Group, delistet 2026), nie den davor.
- **`name_changes`:** im Fenster ±60 Tage bei 10 Lücken, Regel A oder B greift bei 9 (davon 0 nur in der Datei der Gegenseite; der Rest steht in der eigenen Datei und ist für v2.1 sichtbar). v2.1 hat die 7 Regel-B-Fälle trotzdem nicht getrennt, weil `process_date` **nach** dem ersten Balken des neuen Papiers liegt (Kalendertage: STR 2, REE 7, CVT 12, CERE 1, FREE 27, ESGL 17, XL 2) und die Lücke „vor dem ersten Tag ab Datum" dann 0 ist.
- **CUSIP** beidseits der Lücke bekannt bei 11 Lücken; **Yahoo-Datei** vorhanden bei 20 (nur heute aktive Kürzel). Abspaltungs-Sätze auf das Kürzel im Regelfenster: 0 — über alle Dateien gesucht, auch für DOW (aus DWDP).
- **Klasse nach der Lücke:** bei 138 von 141 Lücken trägt die erste Zeile danach dieselbe Klasse wie die letzte davor — das Umsatzfenster läuft über die Zeilen der Reihe und damit über die Lücke.
- **Fall IV (104):** 102 haben einen Polygon-Eintrag mit `bis` nach der Lücke (Inhaber danach bekannt, davor nicht), 34 davon tragen „Acquisition" im Namen (Mantelgesellschaft — Hinweis, kein Beleg); 29 der IV-Lücken sind ≤ 365 Tage lang. Kein Widerspruch zwischen Trenn- und Gleich-Beleg kam vor.

**Die 4 belegten III-Fälle** (eine Trennung wäre hier falsch oder zumindest Geschmackssache):

| Reihe | Lücke (Kal.-Tage) | letzter Tag vor → erster nach | Zeilen vor / nach | rohSchluss vor → nach | Umsatz 20 Z. vor / nach (Mio $) | Klasse vor / nach | ~2 | `name_changes` ±60 T. | Polygon (Name, `bis`, Lage zur Lücke) | Yahoo ab | Fall | Beleg |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SMCI | 510 | 2018-08-22 → 2020-01-14 | 665 / 1.676 | 15,65 → 27,00 (×1,73) | 29,34 / 8,53 | 0 / 0 | – | nein | kein Eintrag | 2007-03-29 | **III** | yahoo-reicht-vor-luecke |
| MINM | 314 | 2024-07-23 → 2025-06-02 | 766 / 26 | 2,85 → 4,66 (×1,64) | 0,37 / 0,43 | -1 / -1 | – | Regel A: MINM→FIEE 2025-07-10 (außerhalb des Regelfensters) | Minim, Inc. Common Stock, 2025-07-10 (nach) | – | **III** | cusip9-gleich |
| BTBT | 142 | 2019-11-04 → 2020-03-25 | 398 / 1.627 | 0,40 → 0,33 (×0,83) | 0,09 / 2,06 | -1 / -1 | – | nein | kein Eintrag | 2018-03-20 | **III** | yahoo-reicht-vor-luecke |
| BSGM | 134 | 2024-06-11 → 2024-10-23 | 1.439 / 221 | 0,47 → 1,00 (×2,13) | 0,36 / 0,62 | -1 / -1 | – | nein | BioSig Technologies, Inc. Common Stock, 2025-09-12 (nach) | – | **III** | cusip9-gleich |

## 5. Die 30 längsten Lücken

| Reihe | Lücke (Kal.-Tage) | letzter Tag vor → erster nach | Zeilen vor / nach | rohSchluss vor → nach | Umsatz 20 Z. vor / nach (Mio $) | Klasse vor / nach | ~2 | `name_changes` ±60 T. | Polygon (Name, `bis`, Lage zur Lücke) | Yahoo ab | Fall | Beleg |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| JMG | 3.533 | 2016-04-08 → 2025-12-10 | 67 / 24 | 12,01 → 5,60 (×0,47) | 0,78 / 5,73 | -1 / -1 | – | nein | JM Group Limited, 2026-06-15 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| LINE | 2.985 | 2016-05-23 → 2024-07-25 | 98 / 537 | 0,18 → 80,78 (×448,78) | 1,37 / 274,35 | -1 / -1 | – | nein | kein Eintrag | 2024-07-25 | **I** | yahoo-beginnt-nach-luecke |
| NUTR | 2.915 | 2017-08-22 → 2025-08-15 | 413 / 38 | 41,80 → 3,91 (×0,09) | 6,10 / 5,59 | -1 / -1 | – | nein | Nusatrip Incorporated Common Stock, 2026-08-12 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| JUNE | 2.487 | 2017-06-26 → 2024-04-17 | 255 / 271 | 25,02 → 4,06 (×0,16) | 0,07 / 1,41 | -1 / -1 | – | nein | Junee Limited Ordinary Shares, ohne Datum (ohne-datum) | – | **IV** | kein Beleg in den lokalen Quellen |
| PHH | 2.277 | 2018-10-03 → 2024-12-27 | 694 / 208 | 11,00 → 4,07 (×0,37) | 1,52 / 0,93 | -1 / -1 | – | nein | Park Ha Biological Technology Co., Ltd. , 2025-10-28 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| AHL | 2.275 | 2019-02-14 → 2025-05-08 | 785 / 199 | 42,74 → 32,50 (×0,76) | 62,50 / 19,16 | 0 / 0 | – | nein | Aspen Insurance Holdings Limited, 2026-02-25 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| THRX | 2.099 | 2016-01-08 → 2021-10-07 | 5 / 591 | 9,81 → 18,58 (×1,89) | 8,27 / 8,15 | -1 / -1 | – | nein | Theseus Pharmaceuticals, Inc. Common Sto, 2024-02-15 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| STR | 2.089 | 2016-09-16 → 2022-06-06 | 179 / 803 | 25,06 → 28,76 (×1,15) | 44,89 / 9,72 | 0 / 0 | – | Regel B: FLMN→STR 2022-06-08 | Sitio Royalties Corp., 2025-08-19 (nach) | – | **I** | namechange-B |
| CHAC | 2.030 | 2019-10-28 → 2025-05-19 | 74 / 207 | 10,55 → 9,90 (×0,94) | 0,61 / 2,44 | -1 / -1 | – | nein | Crane Harbor Acquisition Corp. Class A O, 2026-03-27 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| REE | 1.974 | 2016-02-26 → 2021-07-23 | 38 / 1.242 | 0,15 → 10,21 (×67,62) | 0,03 / 3,79 | -1 / -1 | – | Regel B: VCVC→REE 2021-07-30 | REE Automotive Ltd. Class A Ordinary Sha, 2026-07-07 (nach) | – | **I** | namechange-B |
| SYT | 1.911 | 2018-01-05 → 2023-03-31 | 505 / 502 | 92,90 → 7,25 (×0,08) | 1,06 / 0,35 | -1 / -1 | – | nein | SYLA Technologies Co., Ltd. American Dep, 2025-05-29 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| MBLY | 1.882 | 2017-08-31 → 2022-10-26 | 420 / 974 | 62,73 → 29,29 (×0,47) | 56,93 / 97,14 | 1 / 1 | – | nein | kein Eintrag | 2022-10-26 | **I** | yahoo-beginnt-nach-luecke |
| SMLR | 1.875 | 2016-08-10 → 2021-09-28 | 130 / 1.080 | 1,54 → 127,13 (×82,59) | 0,07 / 4,29 | -1 / -1 | – | nein | Semler Scientific, Inc., 2026-01-20 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| CVT | 1.837 | 2016-11-28 → 2021-12-09 | 229 / 380 | 36,00 → 9,75 (×0,27) | 33,35 / 1,87 | 0 / 0 | – | Regel B: DGNS→CVT 2021-12-21 | Cvent Holding Corp. Common Stock, 2023-06-16 (nach) | – | **I** | namechange-B |
| SWIN | 1.784 | 2018-10-19 → 2023-09-07 | 404 / 525 | 30,50 → 6,08 (×0,20) | 0,12 / 10,74 | -1 / -1 | – | nein | Solowin Holdings Class A Ordinary Share, 2025-10-10 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| ANAC | 1.758 | 2016-06-23 → 2021-04-16 | 120 / 404 | 99,20 → 9,89 (×0,10) | 348,97 / 0,20 | 1 / 1 | – | nein | Arctos NorthStar Acquisition Corp., 2023-02-27 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| TRTL | 1.728 | 2016-12-16 → 2021-09-09 | 106 / 627 | 9,81 → 9,70 (×0,99) | 0,20 / 1,05 | -1 / -1 | – | nein | TortoiseEcofin Acquisition Corp. III, 2024-07-23 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| HRT | 1.680 | 2017-03-24 → 2021-10-29 | 256 / 667 | 4,09 → 17,25 (×4,22) | 0,01 / 20,55 | -1 / -1 | – | nein | HireRight Holdings Corporation, 2024-07-01 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| SN | 1.623 | 2019-02-19 → 2023-07-31 | 787 / 785 | 0,36 → 42,31 (×117,30) | 0,75 / 64,55 | -1 / -1 | – | nein | kein Eintrag | 2023-07-31 | **I** | yahoo-beginnt-nach-luecke |
| ATMR | 1.599 | 2016-11-11 → 2021-03-29 | 70 / 189 | 6,65 → 9,90 (×1,49) | 0,08 / 0,54 | -1 / -1 | – | nein | Altimar Acquisition Corp. II, 2021-12-27 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| BITE | 1.566 | 2016-12-22 → 2021-04-06 | 229 / 646 | 28,15 → 9,80 (×0,35) | 0,08 / 1,27 | -1 / -1 | – | nein | Bite Acquisition Corp., 2024-07-01 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| EAC | 1.564 | 2016-11-18 → 2021-03-01 | 224 / 498 | 0,15 → 9,96 (×68,64) | 0,16 / 0,93 | -1 / -1 | – | nein | Edify Acquisition Corp. Class A Common S, 2024-03-12 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| CERE | 1.552 | 2016-07-29 → 2020-10-28 | 145 / 944 | 0,40 → 9,88 (×24,89) | 0,10 / 1,98 | -1 / -1 | – | Regel B: ARYB→CERE 2020-10-29 | Cerevel Therapeutics Holdings, Inc. Comm, 2024-08-02 (nach) | – | **I** | namechange-B |
| FREE | 1.525 | 2016-04-22 → 2020-06-25 | 77 / 1.033 | 1,15 → 10,10 (×8,78) | 0,37 / 11,75 | -1 / -1 | – | Regel B: ACTT→FREE 2020-07-22 | Whole Earth Brands, Inc. Class A Common , 2024-08-06 (nach) | – | **I** | namechange-B |
| GLAC | 1.498 | 2019-10-28 → 2023-12-04 | 158 / 244 | 7,02 → 10,05 (×1,43) | 0,77 / 2,21 | -1 / -1 | – | nein | Global Lights Acquisition Corp Ordinary , 2025-04-07 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| NSR | 1.485 | 2017-08-07 → 2021-08-31 | 402 / 240 | 33,50 → 7,05 (×0,21) | 12,76 / 0,12 | 0 / 0 | – | nein | Nomad Royalty Company Ltd., 2022-08-16 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| ISLE | 1.428 | 2017-05-01 → 2021-03-29 | 334 / 339 | 22,98 → 9,70 (×0,42) | 18,93 / 0,86 | -1 / -1 | – | nein | Isleworth Healthcare Acquisition Corpora, 2022-08-29 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| BWV | 1.408 | 2018-04-12 → 2022-02-18 | 172 / 463 | 77,50 → 57,40 (×0,74) | 0,05 / 2,30 | -1 / -1 | – | nein | Blue Water Biotech, Inc. Common Stock, 2023-12-22 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| OB | 1.395 | 2017-09-27 → 2021-07-23 | 438 / 974 | 18,10 → 20,00 (×1,11) | 2,45 / 8,00 | -1 / -1 | – | nein | Outbrain Inc. Common Stock, 2025-06-10 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| TRMR | 1.362 | 2017-09-25 → 2021-06-18 | 436 / 644 | 3,68 → 17,92 (×4,87) | 1,36 / 11,30 | -1 / -1 | – | nein | Tremor International Ltd. American Depos, 2024-01-10 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |

## 6. 20 zufällige Lücken der übrigen 111 (Saat `luecken-2026-10-03`, Reihenfolge nach SHA-256 von Saat|Kennung)

| Reihe | Lücke (Kal.-Tage) | letzter Tag vor → erster nach | Zeilen vor / nach | rohSchluss vor → nach | Umsatz 20 Z. vor / nach (Mio $) | Klasse vor / nach | ~2 | `name_changes` ±60 T. | Polygon (Name, `bis`, Lage zur Lücke) | Yahoo ab | Fall | Beleg |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| IPOD | 972 | 2022-10-14 → 2025-06-12 | 473 / 141 | 10,04 → 10,04 (×1,00) | 12,52 / 0,50 | -1 / -1 | – | nein | Dune Acquisition Corporation II Class A , 2026-05-27 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| CRC | 105 | 2020-07-15 → 2020-10-28 | 1.038 / 1.476 | 1,18 → 15,00 (×12,71) | 3,97 / 3,77 | -1 / -1 | – | nein | kein Eintrag | 2020-10-28 | **I** | yahoo-beginnt-nach-luecke |
| GIG | 289 | 2017-04-03 → 2018-01-17 | 315 / 285 | 3,07 → 9,64 (×3,14) | 1,80 / 2,84 | -1 / -1 | hat GIG~2 | nein | GigCapital7 Corp. Class A Ordinary Share, 2026-05-26 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| MR | 1.093 | 2016-03-03 → 2019-03-01 | 42 / 432 | 27,94 → 16,00 (×0,57) | 37,51 / 1,81 | 0 / 0 | – | nein | Montage Resources Corporation Common Sto, 2020-11-16 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| BTU | 357 | 2016-04-12 → 2017-04-04 | 69 / 2.375 | 2,07 → 27,25 (×13,16) | 7,93 / 34,03 | 0 / 0 | – | nein | kein Eintrag | 2017-04-03 | **I** | yahoo-beginnt-nach-luecke |
| BLNG | 1.260 | 2018-04-09 → 2021-09-20 | 83 / 257 | 33,44 → 9,70 (×0,29) | 0,03 / 1,02 | -1 / -1 | – | nein | Belong Acquisition Corp. Class A Common , 2023-07-27 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| DO | 705 | 2020-04-24 → 2022-03-30 | 1.085 / 610 | 0,95 → 7,50 (×7,91) | 9,14 / 11,21 | 0 / 0 | – | nein | Diamond Offshore Drilling, Inc., 2024-09-05 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| AGC | 830 | 2018-08-24 → 2020-12-01 | 667 / 253 | 5,69 → 11,89 (×2,09) | 0,85 / 0,52 | -1 / -1 | – | nein | Altimeter Growth Corp. Class A Ordinary , 2021-12-02 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| HYAC~2 | 477 | 2022-05-26 → 2023-09-15 | 214 / 565 | 9,02 → 10,17 (×1,13) | 2,01 / 1,49 | -1 / -1 | ist ~2-Reihe | Regel A: HYAC→BTMD 2022-06-14 | Haymaker Acquisition Corp. 4, 2026-04-09 (nach) | – | **I** | cusip6-verschieden + namechange-A + uebernahme-wertlos |
| HONIV | 229 | 2025-10-29 → 2026-06-15 | 5 / 9 | 200,99 → 180,01 (×0,90) | 4,74 / 97,50 | -1 / -1 | – | nein | Honeywell International Inc. Common Stoc, 2026-06-29 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| DOW | 579 | 2017-08-31 → 2019-04-02 | 420 / 1.874 | 66,08 → 56,00 (×0,85) | 278,86 / 479,71 | 1 / 1 | – | nein | kein Eintrag | 2019-03-20 | **I** | yahoo-beginnt-nach-luecke |
| MEG | 1.283 | 2017-01-17 → 2020-07-23 | 262 / 1.451 | 18,51 → 22,00 (×1,19) | 42,23 / 10,50 | 0 / 0 | – | nein | Montrose Environmental Group, Inc., 2026-05-04 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| CNDA | 1.316 | 2018-03-16 → 2021-10-22 | 483 / 580 | 17,22 → 9,96 (×0,58) | 0,14 / 1,13 | -1 / -1 | – | nein | Concord Acquisition Corp II, 2024-09-04 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| AAC | 517 | 2019-10-25 → 2021-03-25 | 961 / 657 | 0,48 → 9,87 (×20,56) | 0,16 / 1,49 | -1 / -1 | hat AAC~2 | nein | Ares Acquisition Corporation, 2023-11-07 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| ONE | 601 | 2016-08-04 → 2018-03-28 | 149 / 971 | 5,15 → 10,80 (×2,10) | 2,66 / 6,87 | -1 / -1 | – | nein | OneSmart International Education Group L, 2022-05-02 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| FGMC | 536 | 2023-08-25 → 2025-02-11 | 233 / 346 | 4,82 → 9,65 (×2,00) | 0,65 / 0,91 | -1 / -1 | – | nein | FG Merger II Corp. Common stock, 2026-07-20 (nach) | – | **I** | cusip6-verschieden + uebernahme-wertlos |
| FMCI | 202 | 2018-02-22 → 2018-09-12 | 174 / 395 | 8,30 → 9,57 (×1,15) | 2,74 / 2,42 | -1 / -1 | – | nein | Forum Merger II Corporation Class A Comm, 2020-10-16 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| EXXI | 312 | 2016-04-22 → 2017-02-28 | 77 / 267 | 0,13 → 32,50 (×250,00) | 1,93 / 1,08 | -1 / -1 | – | nein | Energy XXI Gulf Coast, Inc. Common Stock, 2018-03-21 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| DDMX | 321 | 2020-03-12 → 2021-01-27 | 151 / 204 | 9,10 → 10,24 (×1,13) | 0,07 / 0,65 | -1 / -1 | – | nein | DD3 Acquisition Corp. II Class A Common , 2021-12-01 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |
| LVNTB | 126 | 2017-08-25 → 2017-12-29 | 46 / 2 | 59,88 → 54,30 (×0,91) | 0,01 / 0,01 | -1 / -1 | – | nein | Liberty Interactive Corporation Series B, 2018-03-12 (nach) | – | **IV** | kein Beleg in den lokalen Quellen |

## 7. Wirkungszählung (zählt Zeilen, deutet keine Renditen)

Reihen-Tage, an denen ein Universumsmitglied (Klasse 1/2/3 aus `T.g.klasse`, ≥ 250 Zeilen Vorlauf) eine Lücke > 90 Kalendertage zwischen zwei seiner letzten 252 Zeilen hat (Zeile selbst mitgezählt):

| Jahr | betroffene Reihen-Tage | Reihen | Reihen-Tage des Universums | Anteil |
|---|---|---|---|---|
| 2017 | 36 | 1 | 177.586 | 0,020 % |
| 2018 | 0 | 0 | 189.728 | 0,000 % |
| 2019 | 258 | 2 | 186.101 | 0,139 % |
| 2020 | 99 | 4 | 209.074 | 0,047 % |
| 2021 | 416 | 9 | 247.750 | 0,168 % |
| 2022 | 213 | 5 | 245.189 | 0,087 % |
| 2023 | 200 | 1 | 223.303 | 0,090 % |
| 2024 | 359 | 4 | 237.970 | 0,151 % |
| 2025 | 32 | 2 | 282.286 | 0,011 % |
| 2026 | 0 | 0 | 222.261 | 0,000 % |
| **Summe** | **1.613** | 20 | 2.221.248 | 0,073 % |

Betroffene Reihen mit Tagen: DOW 251, MBLY 233, CHK 156, CART 136, CORZ 130, XL 130, DWAC 121, SN 76, NIO 68, XM 43, SE 36, LB 31, MON 31, PX 31, RICE 30, BTBT 26, DNB 25, ATHN 23, EDR 18, LINE 18.

Was eine Trennung bewegt (Zeilen nach der Lücke wechseln in eine Nachfolge-Reihe; „unreif" = weniger als 250 Zeilen seit der Lücke):

| Trennung an | Lücken | Reihen | Zeilen wechseln die Reihe | davon zunächst unreif | davon heute als reif gezählt | davon heute im Universum (Klasse 1–3) |
|---|---|---|---|---|---|---|
| Fall I + II (belegt) | 33 | 33 | 34.329 | 8.250 | 6.851 | 1.258 |
| Fall I, II, IV (alle außer belegtem III) | 137 | 136 | 91.600 | 31.013 | 24.355 | 1.579 |
| jeder Lücke > 90 Tage | 141 | 140 | 95.150 | 31.760 | 25.102 | 1.604 |
| jeder Lücke > 365 Tage | 101 | 101 | 63.289 | 23.429 | 18.611 | 1.388 |

## 8. Kurzlücken 30–90 Kalendertage (nur gezählt)

231 Lücken in 136 Reihen; 16 dieser Reihen haben auch eine Lücke > 90. Nach Länge: 30-45 Tage: 165, 46-60 Tage: 44, 61-75 Tage: 16, 76-90 Tage: 6. Lücken je Reihe: 1 Lücke(n): 95 Reihen, 2 Lücke(n): 27 Reihen, 3 Lücke(n): 3 Reihen, 5+ Lücke(n): 11 Reihen.

## 9. Vorschlag für Phase 2 (nur Text, entscheidet der PM)

1. **Regel:** jede Lücke > 90 Kalendertage zwischen zwei aufeinanderfolgenden Panelzeilen trennt die Reihe — ohne Beleg-Bedingung. Begründung aus den Zahlen: ein Beleg-Kriterium ließe 104 von 141 Lücken ungetrennt (darunter aus der Wirkungsliste in §7: DWAC, XM, MON, PX, RICE, DNB, ATHN, EDR), während die Gegenrichtung nur 4 belegte III-Fälle kostet; eine fälschlich getrennte Aussetzung verliert 250 Zeilen Reife und die erste Rendite, eine fälschlich verklebte Reihe rechnet eine Rendite über zwei Papiere. Ob die 4 III-Fälle (SMCI, MINM, BTBT, BSGM) als Ausnahmeliste ungetrennt bleiben, ist die erste PM-Entscheidung.
2. **Erwartete neue Reihen:** 141 (jede Lücke > 90) bzw. 137 (ohne belegtes III), zusätzlich zu den 38 Trennungen aus v2.1. Bei 7 Basis-Kürzeln reicht `~2` nicht (schon eine `~2`-Reihe oder zwei Lücken): AAC, CPAA, GIG, HYAC, ISRL, LCA, LEXEB — dort braucht es `~3` (bei GIG, HYAC auch `~4`), und der PM muss festlegen, ob chronologisch neu nummeriert wird (bestehende `~2` hieße dann `~3`) oder die neue Reihe die nächste freie Nummer bekommt.
3. **Änderungen:** `kuerzelwechsel.js` — Trennungen nicht mehr nur aus `name_changes`-Kandidaten, sondern aus den Lücken des vorhandenen Panels (dieses Skript liefert Reihe, letzter Tag vor, erster Tag nach); `entscheiden()` lässt heute je Reihe nur die früheste Trennung zu, nötig sind mehrere. `paneldaten.js` — `symbole()` hält je Reihe ein einzelnes `base.trennung` und vergibt `~2`, ersatzweise `~3`; `zeilenAus()` schaltet `symIdx` einmal um; beides muss eine Liste tragen. Die Muster `/~2$/` in `kuerzelwechsel.js` und `paneldaten.js` müssen `~3` kennen. `K.WECHSEL_MIN_LUECKE_TAGE` (60 **Handels**tage ab `process_date`) bekäme eine zweite Konstante in **Kalender**tagen — zwei Einheiten, zwei Namen.
4. **Regressionspins, die sich bewegen müssen:** `K.REGRESSION23_ERWARTET` braucht einen Eintrag für die neue Panel-Kennung (Teil-2-Zahl aus einem frischen Kontrollenlauf, wie bei v2.1); `K.PANEL_KENNUNG` selbst; die Teil-3- und Teil-4-Ergebnisdateien und `vergleich`-Zahlen; `test.js` Abschnitt 16 (prüft am echten Panel) und die Reihenzahl 7.338 → 7.479. Erwartete Größe der Bewegung: 1.613 von 2.221.248 Reihen-Tagen des Universums (0,073 %).
5. **Laufzeit:** laut v2.1-Übergabe (`panel-rueckwaerts-splits-2026-09-18.md`) Vollbau v2.0 02:05–04:07 in sechs Teilen, danach Vereinen, Kernprüfung, vier Suiten und das Nachrechnen von Teil 1, 3, 4 — „mehrere Stunden" trifft es. Ein Teilbau über `--reihen` genügt nicht allein, weil neue Reihen die sortierte Symboltabelle (Index je Reihe) für alle Blöcke verschieben.

## 10. Was sich nicht umsetzen ließ (Befunde, keine Abwandlungen)

- „Polygon-Name davor ≠ Name danach": nicht prüfbar, die Datei führt je Kürzel einen Namen und kein `von`.
- „Delisting-Datum liegt in der Lücke": umsetzbar, trifft 0 von 141.
- Kursanschluss [0,5; 2,0]: trägt an 3 von 5 bekannten Fällen, nicht verwendet.
- Fall I gegen II (derselbe Emittent, neu zugelassen): nur über die CUSIP-Emittentennummer entscheidbar, und die ist bei 11 von 141 Lücken beidseits bekannt. MBLY und DOW (erwartet II) landen deshalb in I; für die Trennung ist der Unterschied folgenlos.
- Die Klasse direkt nach der Lücke stammt aus dem Umsatzfenster des **alten** Papiers (Spalte „Klasse vor / nach" ist fast überall gleich) — eine weitere Folge der Verklebung, die mit der Trennung verschwindet.
- Über die 141 Lücken hinaus nicht untersucht: Emittentenwechsel **ohne** Lücke (vom Lückenkriterium grundsätzlich nicht erfasst), weitere unbelegte Aussetzungen unter Fall IV (EBR und EBR.B wären von der Regel in §9 mitbetroffen) und die 231 Kurzlücken.
