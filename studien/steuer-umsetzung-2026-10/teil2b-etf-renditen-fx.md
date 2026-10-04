# Teil 2b: Momentum-ETF gegen S&P 500, Renditen und EUR/USD

Abruf aller Quellen: 04.10.2026. Keine Anlageberatung, Simulation. Was nicht belegt ist, steht als "nicht belegt". Eigene Rechnungen sind als solche gekennzeichnet.

## 0. Befunde vorab

1. **Die ISIN IE00BD1F4M44 ist nicht der Momentum-ETF.** Laut justETF-Seitentitel ist sie der *iShares Edge MSCI USA Value Factor UCITS ETF* (WKN A2AP35). Der Momentum-ETF (USD, thesaurierend) hat IE00BD1F4N50. Quelle: https://www.justetf.com/en/etf-profile.html?isin=IE00BD1F4M44 und iShares-Factsheet unter 3. Die Tickerangaben IS3R/IWFM sind nicht belegt. Belegt sind IUMO (LSE, USD), QDVA (Xetra, EUR) und IUMF (LSE, GBP).
2. **Die exakten Fenster 16.09.2021 bis 15.09.2026 und 04.01.2017 bis 15.09.2021 sind nicht belegbar.** Dafür bräuchte es Tageskurse der Fonds. Stooq und Yahoo waren aus dieser Umgebung nicht erreichbar. Ersatz sind die nächstliegenden belegten Fenster, in jeder Tabelle benannt.
3. Die iShares-Factsheets rechnen in **USD** (Fondswährung). Reine EUR-Renditen der Fonds stehen dort nicht. Die EUR-Spalten unten sind **meine Umrechnung** aus USD-Rendite und EZB-Jahresendkursen. Sie ersetzen keine EUR-Anteilsklasse.

## 1. EUR/USD-Referenzkurse der EZB (USD je 1 EUR)

Quelle: EZB-Datenportal, SDMX-Abfrage `https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?...&format=csvdata`, abgerufen 04.10.2026. Der Server lieferte mehrfach 504, die Werte kamen nach Wiederholung.

| Datum | Kurs | Anmerkung |
|---|---|---|
| 04.01.2017 | 1,0437 | 03.01.: 1,0385, 05.01.: 1,0501 |
| 15.09.2021 | 1,1824 | 14.09.: 1,1814 |
| 16.09.2021 | 1,1763 | 17.09.: 1,1780 |
| 15.09.2026 | 1,1539 | 14.09.: 1,1551, 16.09.: 1,1537 |
| 02.10.2026 (letzter Stand der Seite) | 1,1225 | Quelle: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/eurofxref-graph-usd.en.html, abgerufen 04.10.2026 |

Jahresendwerte (letzter Handelstag, gleiche Abfrage):

| Jahresende | Kurs |
|---|---|
| 30.12.2016 | 1,0541 |
| 29.12.2017 | 1,1993 |
| 31.12.2018 | 1,1450 |
| 31.12.2019 | 1,1234 |
| 31.12.2020 | 1,2271 |
| 31.12.2021 | 1,1326 |
| 30.12.2022 | 1,0666 |
| 29.12.2023 | 1,1050 |
| 31.12.2024 | 1,0389 |
| 31.12.2025 | 1,1750 |

Währungseffekt auf EUR-Basis (eigene Rechnung aus den Tabellenwerten):

| Fenster | USD-Veränderung gegen EUR | Wirkung auf EUR-Rendite p. a. |
|---|---|---|
| 04.01.2017 bis 15.09.2021 (1,0437 auf 1,1824) | USD schwächer um 11,7 % | etwa minus 2,5 Pp p. a. |
| 16.09.2021 bis 15.09.2026 (1,1763 auf 1,1539) | USD stärker um 1,9 % | etwa plus 0,4 Pp p. a. |
| 15.09.2021 bis 15.09.2026 (1,1824 auf 1,1539) | USD stärker um 2,5 % | etwa plus 0,5 Pp p. a. |

Die Wirkung ist ein Näherungswert, weil die Fonds-Zeitfenster nicht mit den Kursterminen deckungsgleich sind.

## 2. Wertentwicklung

### 2a. Belegte Fondswerte (USD, Gesamtertrag mit Wiederanlage, NAV-Basis, Stand 31.08.2026)

Quellen (alle abgerufen 04.10.2026):
- IUMO: https://www.blackrock.com/gls-download/literature/fact-sheet/iumo-ishares-edge-msci-usa-momentum-factor-ucits-etf-fund-fact-sheet-en-lu.pdf
- IWMO: https://www.blackrock.com/gls-download/literature/fact-sheet/iwmo-ishares-edge-msci-world-momentum-factor-ucits-etf-fund-fact-sheet-en-fi.pdf
- CSPX: https://www.blackrock.com/gls-download/literature/fact-sheet/cspx-ishares-core-s-p-500-ucits-etf-fund-fact-sheet-en-lu.pdf

| Produkt | YTD | 1 J | 3 J p. a. | 5 J p. a. | seit Auflegung p. a. |
|---|---|---|---|---|---|
| IUMO USA Momentum (IE00BD1F4N50) | 21,13 | 25,76 | 26,21 | 10,94 | 15,59 (seit 13.10.2016) |
| IWMO World Momentum (IE00BP3QZ825) | 18,04 | 24,65 | 25,89 | 11,60 | 13,60 (seit 03.10.2014) |
| CSPX S&P 500 (IE00B5BMR087), Index | 12,88 | 19,96 | 20,57 | 12,31 | 14,01 |
| CSPX S&P 500, Fonds | 12,96 | 20,10 | 20,73 | 12,49 | 14,26 (seit 19.05.2010) |

**Differenz Momentum minus S&P 500 (Fonds gegen Fonds, USD, Pp p. a.):**

| | 1 J | 3 J | 5 J |
|---|---|---|---|
| IUMO minus CSPX | +5,66 | +5,48 | **minus 1,55** |
| IWMO minus CSPX | +4,55 | +5,16 | **minus 0,89** |

Das 5-Jahres-Fenster endet am 31.08.2026 und beginnt am 31.08.2021. Es ist das nächstliegende belegte Fenster zu 16.09.2021 bis 15.09.2026. Auf EUR-Basis ergibt sich über das exakte Fenster ein Aufschlag von etwa 0,4 Pp p. a. für alle drei Produkte gleichermaßen (siehe 1). Die Differenz bleibt damit etwa gleich (nicht belegt als eigene Zahl, nur Näherung).

### 2b. Indexwerte MSCI USA Momentum (Stand 30.09.2026, USD, netto)

Quelle: https://www.msci.com/documents/10199/255599/msci-usa-momentum-index-usd-net.pdf, abgerufen 04.10.2026.

| Index | 1 J | YTD | 3 J p. a. | 5 J p. a. | 10 J p. a. |
|---|---|---|---|---|---|
| MSCI USA Momentum | 26,07 | 27,94 | 30,70 | 12,96 | 15,84 |
| MSCI USA (Elternindex) | 14,96 | 12,34 | 22,45 | 12,86 | 14,75 |

- Der S&P 500 ist auf diesem Stand nicht belegt. Die Factsheet-Zahlen von CSPX (31.08.2026) und MSCI (30.09.2026) sind **nicht direkt vergleichbar**. Der Septemberwert ist im Rückblick stärker, weil der Momentum-Index im September +5,58 % machte.
- Der Index wurde am 15.02.2013 aufgelegt, davor sind es Rückrechnungen (Backtest). Ein Hinweis im Factsheet selbst.
- Die ETF-Kalenderjahre (2018 bis 2025) liegen innerhalb von 0,2 Pp am Index "MSCI USA Momentum Factor Net". Der ETF folgt also diesem Index. Die Gleichheit von "MSCI USA Momentum" und "Momentum Factor" im Namen habe ich nicht gesondert verifiziert, aber 2023 bis 2025 stimmen (8,98 / 31,99 / 17,34 Index gegen 9,00 / 31,91 / 17,33 ETF).

### 2c. MTUM (US-Ersatz)

Quelle: https://www.ishares.com/us/literature/fact-sheet/mtum-ishares-msci-usa-momentum-factor-etf-fund-fact-sheet-en-us.pdf, Stand 30.06.2026, abgerufen 04.10.2026. NAV, USD.

| 1 J | 3 J p. a. | 5 J p. a. | 10 J p. a. | seit Auflegung p. a. |
|---|---|---|---|---|
| 43,70 | 34,58 | 15,94 | 17,58 | 16,79 |

Kalenderjahre: 2021 13,45, 2022 minus 18,23, 2023 9,10, 2024 32,88, 2025 22,10.

**Warnung:** MTUM weicht von IUMO ab (2025: 22,10 gegen 17,33). MTUM ist **kein** brauchbarer Ersatz für die Historie des UCITS. Er folgt offenbar einer anderen Indexvariante. Das ist hier nicht verifiziert. Auflegung MTUM 16.04.2013 laut Suchtreffer, nicht aus dem Factsheet-Text geprüft. Das 5-Jahres-Fenster endet am 30.06.2026 und ist nicht mit dem 31.08. vergleichbar.

### 2d. Kalenderjahre 2017 bis 2025 (USD, Gesamtertrag, Prozent)

Quellen: dieselben Factsheets wie 2a, Index aus 2b.

| Jahr | IUMO USA Mom. | MSCI USA Mom. (Index) | IWMO World Mom. | CSPX S&P 500 | IUMO minus CSPX (Pp) |
|---|---|---|---|---|---|
| 2017 | 37,16 | 37,24 | 31,91 | 21,40 | +15,76 |
| 2018 | minus 1,96 | minus 2,02 | minus 2,97 | minus 4,72 | +2,76 |
| 2019 | 27,34 | 27,44 | 27,44 | 31,02 | minus 3,68 |
| 2020 | 29,12 | 29,18 | 27,90 | 18,02 | +11,10 |
| 2021 | 12,51 | 12,64 | 14,31 | 28,36 | minus 15,85 |
| 2022 | minus 17,78 | minus 17,87 | minus 17,87 | minus 18,35 | +0,57 |
| 2023 | 9,00 | 8,98 | 11,56 | 25,92 | minus 16,92 |
| 2024 | 31,91 | 31,99 | 29,80 | 24,69 | +7,22 |
| 2025 | 17,33 | 17,34 | 21,23 | 17,58 | minus 0,25 |
| 2026 YTD (31.08.) | 21,13 | 27,94 (Index, 30.09.) | 18,04 | 12,96 | +8,17 (gleicher Stichtag) |

2026 YTD für 2026 ist nur bis 31.08. vergleichbar, 2016 ist bei IUMO "-" (Auflegung 13.10.2016, kein volles Jahr).

### 2e. Eigene Rechnung: Fenster aus Kalenderjahren (Näherung)

Verkettete Kalenderjahre der Tabelle 2d. EUR-Basis: (1 + USD-Rendite) mal (Kurs Jahresanfang / Kurs Jahresende) minus 1, mit den Jahresendkursen aus 1. Das ist keine Fonds-EUR-Rendite, nur ein Währungsumrechnung.

| Fenster | Produkt | USD kumuliert % | USD p. a. % | EUR kumuliert % | EUR p. a. % |
|---|---|---|---|---|---|
| 2017 bis 2020 (4 J, nächstes Fenster zu 04.01.2017 bis 15.09.2021) | IUMO | 121,1 | 21,94 | 89,9 | 17,39 |
| | IWMO | 108,6 | 20,18 | 79,2 | 15,70 |
| | CSPX | 78,9 | 15,65 | 53,6 | 11,33 |
| 2022 bis 2025 (4 J, nächstes Fenster zu 16.09.2021 bis 15.09.2026, ohne 2021 und 2026) | IUMO | 38,7 | 8,52 | 33,7 | 7,53 |
| | IWMO | 44,2 | 9,58 | 39,0 | 8,58 |
| | CSPX | 50,7 | 10,80 | 45,3 | 9,79 |
| 2021 bis 2025 (5 J) | IUMO | 56,1 | 9,31 | 63,0 | 10,26 |
| | IWMO | 64,8 | 10,51 | 72,1 | 11,47 |
| | CSPX | 93,5 | 14,11 | 102,1 | 15,11 |
| 2017 bis 2025 (9 J) | IUMO | 245,0 | 14,75 | 209,5 | 13,38 |
| | IWMO | 243,8 | 14,71 | 208,4 | 13,33 |
| | CSPX | 246,1 | 14,79 | 210,5 | 13,41 |

**Differenz Momentum-ETF (IUMO) minus S&P 500 (CSPX), Pp p. a.:**

| Fenster | USD | EUR |
|---|---|---|
| 2017 bis 2020 | +6,29 | +6,06 |
| 2022 bis 2025 | minus 2,28 | minus 2,26 |
| 2021 bis 2025 | minus 4,80 | minus 4,85 |
| 2017 bis 2025 | minus 0,04 | minus 0,03 |
| 5 J bis 31.08.2026 (belegt, 2a) | minus 1,55 | etwa gleich (Näherung) |

Für IWMO minus CSPX: 2017 bis 2020 +4,53 USD, 2022 bis 2025 minus 1,22 USD, 2021 bis 2025 minus 3,60 USD, 2017 bis 2025 minus 0,08 USD (eigene Rechnung aus 2d).

Lesart (nur Beschreibung, kein Urteil): Über neun Jahre ist der Abstand praktisch null. Er besteht aus einer starken Phase 2017 bis 2020 und einer schwachen 2021 bis 2023, dann wieder stärker 2024 bis 2026. Die Zahlen sind ein Pfad, keine Messung nach den Regeln der Mühle (kein Cluster-t, keine MDE).

## 3. Auflegung und Historie

Quellen: Factsheets aus 2a, Abruf 04.10.2026.

| Produkt | Fonds-/Anteilsklassen-Auflegung | Echte Historie ab | Bemerkung |
|---|---|---|---|
| IUMO USA Momentum USD acc (IE00BD1F4N50) | 13.10.2016 | 13.10.2016 | 2016 ohne Wert im Factsheet. 2017 ist ein volles echtes Jahr |
| IUMD USA Momentum USD dist (IE00BFF5RZ82) | 21.02.2018 (Anteilsklasse), Fonds 13.10.2016 | 2019 ist erstes volles Jahr im Factsheet | 5 J p. a. 10,94 wie IUMO, seit Auflegung 13,02 |
| IWMO World Momentum USD acc (IE00BP3QZ825) | 03.10.2014 | 03.10.2014 | 2016: 4,05 |
| MSCI USA Momentum Index | 15.02.2013 | 15.02.2013 | davor Backtest |
| MTUM | 16.04.2013 (Suchtreffer, nicht im Factsheet geprüft) | nicht belegt | |

Der Start 04.01.2017 liegt knapp drei Monate nach der Auflegung von IUMO. Eine Indexrückrechnung wird für beide UCITS in diesem Zeitraum nicht gebraucht. Für einen Start vor dem 13.10.2016 wäre bei IUMO nur der Index belegbar. Ob die Nettorendite des Index die ETF-Kosten (TER 0,20 %) enthält, ist nicht belegt. Die ETF-Zahlen liegen im Schnitt etwas unter dem Index.

## 4. Dividendenrenditen (für die Quellensteuer-Reibung)

| Größe | Rendite | Stand | Quelle |
|---|---|---|---|
| MSCI USA Momentum Index | 0,87 % | 30.09.2026 | MSCI-Factsheet (2b) |
| MSCI USA Index | 1,11 % | 30.09.2026 | MSCI-Factsheet (2b) |
| S&P 500 | 1,1 % | August 2026 | Suchtreffer-Zusammenfassung "S&P Dow Jones Indices" (Primärquelle nicht geöffnet, Zwischenstand) |
| MTUM, 12 Monate nachlaufend | 0,54 % | 30.06.2026 | Suchtreffer-Zusammenfassung zum Factsheet, nicht im Volltext geprüft |
| MTUM, 30-Tage-SEC-Rendite | 0,67 % | 30.06.2026 | MTUM-Factsheet (2c) |

Eigene Rechnung, **Annahme** 15 % US-Quellensteuer auf Dividenden (für diese Recherche nicht belegt, aus dem Gedächtnis, bitte prüfen): Momentum 0,87 % mal 15 % = rund 0,13 Pp p. a.; S&P 500 1,1 % mal 15 % = rund 0,17 Pp p. a. Der Unterschied zwischen beiden ist damit etwa 0,04 Pp p. a. und liegt weit unter der Streuung der Renditedifferenzen in 2e. Ob die Fonds die Quellensteuer unterschiedlich tragen, ist nicht belegt.

## 5. Offene Punkte

- Tageskurse beider Fenster (exakt 16.09.2021 bis 15.09.2026 und 04.01.2017 bis 15.09.2021) für IUMO, IWMO, CSPX: nicht belegt. Quelle wäre iShares-Kursverlauf oder eine Börsendatenabfrage, die hier nicht lief.
- EUR-Renditen der Fonds aus EUR-Anteilsklassen oder Xetra-Kursen (QDVA, SXR8): nicht belegt.
- Ticker IS3R und IWFM: nicht belegt.
- S&P 500 Indexwert zum 30.09.2026 und Primärquelle der 1,1 % Dividendenrendite: nicht belegt.
- Ob MTUM und IUMO dieselbe Indexvariante tracken: nicht belegt, die Zahlen sprechen dagegen.
