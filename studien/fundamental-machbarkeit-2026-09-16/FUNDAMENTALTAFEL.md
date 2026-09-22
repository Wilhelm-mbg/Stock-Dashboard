# Fundamentaltafel 2016–2026 aus den SEC Financial Statement Data Sets — punkt-in-zeit (16.09.2026)

**Auftrag:** `uebergabe/auftrag-fundamentaltafel-2026-09-16.md`. **Gemessen wurde nichts** — das ist die Tafel, die der
Querschnitts-Prüfstand für „gedrückt, aber liefert" lesen wird. Alle Zahlen dieses Berichts erzeugt `bericht-tafel.js`
aus `_stand.json` (Bau) und `test-fundamental.json` (Prüfungen); nichts ist abgetippt. Kennung `fundamentaltafel-2026-09-16/v1`.

## In einem Absatz

**158.516 Zeilen** (je eine je 10-K/10-Q der Panel-CIKs, 2014q1–2026q2, davon 50 FSDS-Quartale, die ersten acht als Vorlauf) für
**6.003 CIKs** des 7.299-Reihen-Panels (77 Reihen ohne CIK), aus 2.290.771 Erst-Fakten. Regel „erste Veröffentlichung gilt":
251.233 spätere Wiederholungen mit anderem Wert wurden **nicht übernommen** (9,6 % aller Wiederholungen),
die 20 Handproben gegen die SEC-API bestätigen an neudargestellten Fällen: die Tafel trägt den ersten Wert mit dem ersten
Einreichungsdatum, `companyfacts`/`frames` tragen in 19 von 20 Fällen den späteren. Fundamental-Momentum liegt in
85,3 % der Zeilen vor; je Kalenderjahr haben 71,5 % (2019) bzw. 77,1 % (2024) der aktiven Panelreihen
mindestens ein Filing mit FM, in der Klasse ab1000 94,7 % bzw. 88,6 %. Leser `fundamental-lesen.js` mit
Sperrklinke: 532 von 1000 Zufallszugriffen geliefert, 0 Verstöße. Zweitbau bitgleich (16/16 Dateien). Alle 8 Prüfungen bestanden.

## 1. Bau

**Quelle.** `https://www.sec.gov/files/dera/data/financial-statement-data-sets/<jjjjqn>.zip`, 50 Quartale 2014q1–2026q2 (2026q3 noch 404: die SEC stellt das
Paket erst nach Quartalsende bereit). Roh unter `E:/Markt-Dashboard-Archiv/edgar-fsds/<q>.zip` (Beleg) und `<q>/sub.txt`, `<q>/num.txt`;
tag.txt/pre.txt wurden für die neuen Quartale gar nicht erst entpackt. `laden.js` prüft jede Datei beim Laden (ZIP-Größe = Content-Length des
Servers, sub/num-Größe = Eintrag im ZIP-Verzeichnis, erst `.teil`, dann umbenannt); die Nachprüfung `laden-pruefen.js` wiederholt das für die
42 Quartale 2016q1–2026q2: 0 Fehler, 0 `.teil`-Reste (die geplante Aufgabe lief zweimal an; drei Kollisionen beim Umbenennen
standen im Log, alle Dateien sind intakt). Die acht Vorlauf-Quartale 2014q1–2015q4 wurden danach mit demselben `laden.js` geladen (Log: 0 Fehler).

**Vorlauf 2014–2015.** Der Auftrag nennt 2016q1 als Start. Ein Handelstag im Januar 2016 braucht aber das 10-K vom Herbst 2015,
und das Fundamental-Momentum braucht acht Quartale Geschichte; ohne Vorlauf hatte 2016 im ersten Bau FM in 52 % der Zeilen gegen
72–78 % ab 2017. Deshalb sind 2014q1–2015q4 als Vorlauf geladen; ihre Filings stehen in `tafel-2014/2015.jsonl` und werden vom
Leser für frühe 2016er-Tage geliefert.

**Schritte** (alle im Studienordner, alle deterministisch): `laden.js` → `auszug.js` (je Quartal die periodischen Berichte aller
Registranten aus sub.txt und die Zeilen der Zieltags ohne Segmente aus num.txt → `edgar-fsds/auszug/<q>-sub.tsv`, `<q>-num.tsv`)
→ `klassen.js` (Umsatzklasse je Reihe und Kalenderjahr) → `bauen.js` (Tafel) → `stand.js` (`_stand.json`) → `test-fundamental.js` → `bericht-tafel.js`.
Bau in 23 s.

**Filings.** Periodische Berichte aller Registranten in den Auszügen: 328.199 (US-Standard 317.633, 20-F/40-F 10.566).
Panel-CIKs: **158.516 10-K/10-Q-Familie aufgenommen** (10-K 39.352, 10-K/A 1.350, 10-KT 84, 10-KT/A 4, 10-Q 115.987, 10-Q/A 1.711, 10-QT 27, 10-QT/A 1),
**4.931 20-F/40-F nur gezählt** (`fundamentaltafel/_auslaend.json`). Verworfen: 3 mit filed < period (Plausibilitätsfilter),
0 ohne gültiges Datum, 0 doppelte Akzessionen. Rangordnung = (filed, accepted, adsh) über alle Quartale; Quartalsgrenzen in
filed-Ordnung verletzt: 0, Rangumkehr beim Einfügen: 0 (beides muss 0 sein, sonst wäre „erste Veröffentlichung" nicht die erste).

**Fakten** (Konzernwert: segments leer, coreg leer): 4.958.973 Auszugszeilen der Panel-Filings → 2.290.771 Erst-Fakten (cik, Tag, ddate, qtrs),
2.361.864 spätere Wiederholungen mit gleichem Wert, **251.233 Neudarstellungen** (anderer Wert, nicht übernommen). Verworfen: 4.088 Fremdwährung/falsche Einheit,
41.174 Zins-Tags bei Nicht-Finanz-SIC, 1.382 qtrs > 4 oder Datum ungültig, 8.461 nicht numerisch. Doppelte Schlüssel mit
verschiedenem Wert INNERHALB eines Filings: 0.

**Zuordnungstabelle** (`zuordnung.js`; Reihenfolge = Priorität; Verwendung = Rohwert zum Stichtag über alle Zeilen):

| Größe | Tags in Priorität (Verwendung) | Regel |
| --- | --- | --- |
| umsatz | Revenues (52.230), RevenueFromContractWithCustomerExcludingAssessedTax (42.675), RevenueFromContractWithCustomerIncludingAssessedTax (7.035), SalesRevenueNet (16.727), SalesRevenueGoodsNet (3.940), SalesRevenueServicesNet (1.705), RevenuesNetOfInterestExpense (524), InterestAndDividendIncomeOperating (9.744), RegulatedAndUnregulatedOperatingRevenue (627), OperatingLeasesIncomeStatementLeaseRevenue (399), RevenueMineralSales (103), OilAndGasRevenue (316), InterestIncomeExpenseNet (1.422), HealthCareOrganizationRevenue (182), RealEstateRevenueNet (478) | Fluss zum Stichtag, qtrs 4 (10-K) bzw. 1 (10-Q); Interest-Tags nur SIC 6000–6799 |
| netto | NetIncomeLoss (143.450), ProfitLoss (10.049), NetIncomeLossAvailableToCommonStockholdersBasic (3.120), IncomeLossFromContinuingOperations (107) | Fluss zum Stichtag, qtrs 4 (10-K) bzw. 1 (10-Q) |
| operativ | OperatingIncomeLoss (123.390) | Fluss zum Stichtag, qtrs 4 (10-K) bzw. 1 (10-Q) |
| umsatzkosten | CostOfRevenue (26.475), CostOfGoodsAndServicesSold (40.520), CostOfGoodsSold (10.327), CostOfServices (1.940), CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization (3.250) | Fluss zum Stichtag, qtrs 4 (10-K) bzw. 1 (10-Q) |
| fue | ResearchAndDevelopmentExpense (50.918), ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost (3.142), ResearchAndDevelopmentExpenseSoftwareExcludingAcquiredInProcessCost (527) | Fluss zum Stichtag, qtrs 4 (10-K) bzw. 1 (10-Q) |
| vermoegen | Assets (0) | Bestand qtrs 0 zum Stichtag |
| eigenkapital | StockholdersEquity (0), StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest (0), PartnersCapital (0), MembersEquity (0) | Bestand qtrs 0 zum Stichtag |
| aktien | EntityCommonStockSharesOutstanding (67), CommonStockSharesOutstanding (105.265), WeightedAverageNumberOfSharesOutstandingBasic (30.316), WeightedAverageNumberOfDilutedSharesOutstanding (376), CommonStockSharesIssued (6.234) | dei-Deckblatt im Fenster [period, filed]; Bilanzbestand genau period; gewichtete Zahlen als Fluss zum Stichtag; Issued als letzter Ausweg |

Fallbacks: Nettoergebnis nicht `NetIncomeLoss` in 13.276 Zeilen, Eigenkapital nicht `StockholdersEquity` in 9.430, Aktienzahl je Tag siehe Tabelle
(die Deckblatt-Zahl `dei:EntityCommonStockSharesOutstanding` steht in 67 Zeilen — sie fehlt in num.txt, wie in der Machbarkeit gesehen).

**Quartalsfluss je Stichtag und 4-Quartals-Summen.** Für jedes Filing werden acht Stichtage D0 = period, D1 … D7 (je drei Monate
zurück, Monatsende) gebildet und je Größe der Quartalswert mit nur zu diesem Rang bekannten Fakten bestimmt: direkt (qtrs 1), sonst
mit demselben Tag Jahr minus drei Vorquartale (Auftrag), Jahr minus 9-Monats-YTD, YTD-Differenzen. Wege über alle Zeilen × 8 Stichtage:

| Größe | direkt | Jahr − 3 Quartale | Jahr − YTD3 | YTD2 − Q1 | YTD3 − YTD2 | YTD3 − 2Q | Lücke je Stichtag D0…D7 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| umsatz | 928.135 | 125.242 | 8.058 | 830 | 1.113 | 21 | 21.726 / 25.134 / 27.638 / 28.525 / 21.110 / 24.314 / 27.036 / 29.246 |
| netto | 1.042.259 | 144.413 | 5.355 | 1.917 | 1.847 | 55 | 2.042 / 6.093 / 9.552 / 11.570 / 5.410 / 9.247 / 12.685 / 15.683 |
| operativ | 767.642 | 152.985 | 5.494 | 1.274 | 1.267 | 36 | 35.998 / 40.176 / 43.704 / 45.602 / 38.017 / 41.933 / 45.456 / 48.544 |

4Q-Summe nur, wenn alle vier Stichtage da sind: Lücken Umsatz 32.639, Netto 13.126, operativ 47.440 von 158.516 Zeilen;
Vorjahresfenster (D4…D7): 31.437 / 16.437 / 49.616. Der Weg „Jahr − YTD3" geht über den Auftrag hinaus (dort: „sonst Lücke");
er ist je Quartal mit `y` markiert, damit der Prüfstand ihn ausschließen kann, wenn er die strenge Regel will.

**Abgeleitet je Filing:** roa = netto4Q / Vermögen(D0); roaVor = netto4Q_vor / Vermögen(D4); **fm = roa − roaVor** (Novy-Marx 2015);
umsatzWachstum = umsatz4Q / umsatz4Q_vor − 1. Vorhanden: roa 145.173, fm 135.156, umsatzWachstum 122.743 Zeilen.

**Zuordnung CIK → Kürzel** aus `panel.json` der Machbarkeit: lebende Reihen über die SEC-Tickertabelle (ein lebendes Kürzel zeigt
auf den lebenden Registranten — die Falle betrifft wiederverwendete Kürzel Verschwundener), verschwundene über die zeitgefensterte
Volltext-Zuordnung von `verschwundene-gruende-2026-09-12/edgar/` (Sicherheit stark/mittel/schwach wird in `_reihen.json` mitgeführt;
1.003 schwache Zuordnungen). Mehrere Kürzel je CIK (Umfirmierung) stehen als Liste `sym` in der Zeile.

**Ablage** `fundamentaltafel/` (nicht im Repo, 13 Jahresdateien nach filed-Jahr, 303 MB): `tafel-<jahr>.jsonl`, je Zeile
`{sym, cik, sic, sektor, form, period, filed, accepted, fy, fp, q, adsh, roh{umsatz, netto, operativ, umsatzkosten, fue, vermoegen, eigenkapital, aktien, qtrs},
rohTags, quartale{umsatz, netto, operativ: [D0…D7]}, wege, quartalsTags, summe4q{…, …Vor}, vermoegenVor, abgeleitet{roa, roaVor, fm, umsatzWachstum},
marken{luecken, erstVonFrueher, nettoFallback, eigenkapitalFallback, aktienFallback}}`; dazu `_reihen.json` (Kürzel → CIK), `_auslaend.json`,
`_neudarstellungen.json` (251.233 Fälle mit erstem und späterem Wert), `_bau.json` (Zähler, SHA-256). Im Repo: Skripte, `_stand.json`, dieser Bericht.

## 2. Deckung je Umsatzklasse × Jahr

Klasse = Median des Dollar-Umsatzes über die Handelstage des Kalenderjahres (≥ 40 Umsatztage, sonst „dünn"), wie Prüfstand §1.5.
Spalten in Prozent der aktiven Reihen der Klasse: Bericht = mindestens ein 10-K/10-Q mit `filed` im Jahr (nur das trägt die Tafel);
20-F/40-F = nur gezählt; Umsatz/Netto/Vermögen/Aktien = Rohwert zum Stichtag in einem Filing des Jahres; 4Q-Netto = vollständige
4-Quartals-Summe; FM = Fundamental-Momentum vorhanden. 2016 ist trotz Vorlauf dünner (Quartalswerte vor 2014 fehlen).

**ab1000**

| Jahr | aktiv | mit CIK | Bericht | 20-F/40-F | Umsatz | Netto | Vermögen | Aktien | 4Q-Netto | FM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2016 | 10 | 100 % | 100 % | 0 % | 100 % | 100 % | 100 % | 100 % | 100 % | 100 % |
| 2017 | 12 | 100 % | 91,7 % | 8,3 % | 91,7 % | 91,7 % | 91,7 % | 91,7 % | 91,7 % | 91,7 % |
| 2018 | 18 | 100 % | 94,4 % | 5,6 % | 94,4 % | 94,4 % | 94,4 % | 94,4 % | 94,4 % | 94,4 % |
| 2019 | 19 | 100 % | 94,7 % | 5,3 % | 94,7 % | 94,7 % | 94,7 % | 89,5 % | 94,7 % | 94,7 % |
| 2020 | 32 | 100 % | 93,8 % | 6,3 % | 93,8 % | 93,8 % | 93,8 % | 90,6 % | 90,6 % | 90,6 % |
| 2021 | 46 | 100 % | 89,1 % | 8,7 % | 89,1 % | 89,1 % | 89,1 % | 87 % | 87 % | 87 % |
| 2022 | 38 | 100 % | 92,1 % | 5,3 % | 92,1 % | 92,1 % | 92,1 % | 86,8 % | 89,5 % | 89,5 % |
| 2023 | 23 | 100 % | 91,3 % | 4,3 % | 91,3 % | 91,3 % | 91,3 % | 82,6 % | 91,3 % | 91,3 % |
| 2024 | 35 | 100 % | 91,4 % | 5,7 % | 91,4 % | 91,4 % | 91,4 % | 82,9 % | 88,6 % | 88,6 % |
| 2025 | 60 | 100 % | 91,7 % | 6,7 % | 91,7 % | 91,7 % | 91,7 % | 88,3 % | 88,3 % | 88,3 % |
| 2026 | 86 | 100 % | 94,2 % | 4,7 % | 94,2 % | 94,2 % | 94,2 % | 91,9 % | 93 % | 91,9 % |

**250-1000**

| Jahr | aktiv | mit CIK | Bericht | 20-F/40-F | Umsatz | Netto | Vermögen | Aktien | 4Q-Netto | FM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2016 | 116 | 100 % | 88,8 % | 4,3 % | 87,1 % | 88,8 % | 88,8 % | 82,8 % | 86,2 % | 86,2 % |
| 2017 | 107 | 100 % | 92,5 % | 2,8 % | 91,6 % | 92,5 % | 92,5 % | 86 % | 88,8 % | 88,8 % |
| 2018 | 137 | 100 % | 88,3 % | 5,1 % | 87,6 % | 88,3 % | 88,3 % | 82,5 % | 85,4 % | 85,4 % |
| 2019 | 123 | 100 % | 94,3 % | 4,1 % | 94,3 % | 94,3 % | 94,3 % | 90,2 % | 88,6 % | 88,6 % |
| 2020 | 183 | 100 % | 88 % | 7,1 % | 88 % | 88 % | 88 % | 82,5 % | 82 % | 82 % |
| 2021 | 224 | 100 % | 90,6 % | 8 % | 90,2 % | 90,6 % | 90,6 % | 86,2 % | 86,2 % | 84,4 % |
| 2022 | 232 | 100 % | 93,5 % | 6 % | 93,1 % | 93,5 % | 93,5 % | 89,7 % | 90,9 % | 90,9 % |
| 2023 | 187 | 100 % | 92 % | 6,4 % | 92 % | 92 % | 92 % | 88,2 % | 89,3 % | 89,3 % |
| 2024 | 214 | 100 % | 92,5 % | 6,5 % | 92,5 % | 92,5 % | 92,5 % | 88,8 % | 90,7 % | 90,2 % |
| 2025 | 292 | 100 % | 93,2 % | 5,8 % | 92,5 % | 93,2 % | 93,2 % | 89,4 % | 92,1 % | 91,4 % |
| 2026 | 349 | 100 % | 92,6 % | 6,6 % | 92 % | 92,6 % | 92,6 % | 88,8 % | 91,1 % | 91,1 % |

**50-250**

| Jahr | aktiv | mit CIK | Bericht | 20-F/40-F | Umsatz | Netto | Vermögen | Aktien | 4Q-Netto | FM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2016 | 579 | 100 % | 81,9 % | 1,9 % | 78,8 % | 81,5 % | 81,5 % | 77,9 % | 78,9 % | 78,9 % |
| 2017 | 615 | 99,8 % | 82,3 % | 2,9 % | 79 % | 82 % | 81,8 % | 77,9 % | 79,7 % | 79 % |
| 2018 | 635 | 99,8 % | 82,8 % | 8,7 % | 81,3 % | 82,4 % | 82,2 % | 78,3 % | 80,6 % | 79,8 % |
| 2019 | 603 | 99,8 % | 84,2 % | 9,5 % | 83,9 % | 83,9 % | 83,9 % | 79,1 % | 81,6 % | 81,4 % |
| 2020 | 677 | 99,9 % | 83,3 % | 10 % | 82,4 % | 82,9 % | 82,9 % | 78,3 % | 80,1 % | 80,1 % |
| 2021 | 791 | 99,9 % | 82 % | 11,9 % | 80,8 % | 81,5 % | 81,5 % | 78 % | 77,6 % | 76,5 % |
| 2022 | 726 | 99,7 % | 82,5 % | 13,1 % | 81,5 % | 82,2 % | 82,1 % | 79,2 % | 80,2 % | 79,8 % |
| 2023 | 699 | 99,9 % | 84,8 % | 12,2 % | 83,7 % | 84,5 % | 84,5 % | 81,5 % | 83,1 % | 83 % |
| 2024 | 729 | 99,9 % | 86,3 % | 11,8 % | 85,2 % | 86 % | 85,9 % | 83 % | 84,1 % | 83,8 % |
| 2025 | 812 | 99,8 % | 84,4 % | 14,2 % | 83,1 % | 84,1 % | 84 % | 81,4 % | 83,4 % | 82,9 % |
| 2026 | 869 | 99,8 % | 84,3 % | 12,9 % | 82,4 % | 84 % | 83,8 % | 80,7 % | 82,9 % | 82,6 % |

**5-50**

| Jahr | aktiv | mit CIK | Bericht | 20-F/40-F | Umsatz | Netto | Vermögen | Aktien | 4Q-Netto | FM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2016 | 1.379 | 99,6 % | 79,1 % | 3,2 % | 75,6 % | 78,8 % | 78,8 % | 74,3 % | 75,9 % | 75,1 % |
| 2017 | 1.460 | 99,7 % | 80,1 % | 2,7 % | 76 % | 79,6 % | 79,8 % | 74,9 % | 76,5 % | 76,1 % |
| 2018 | 1.493 | 99,7 % | 81,2 % | 9,5 % | 79,2 % | 80,8 % | 80,8 % | 75,6 % | 77,3 % | 76,6 % |
| 2019 | 1.438 | 99,7 % | 80,2 % | 10,8 % | 78,4 % | 80 % | 80 % | 76 % | 78 % | 77,5 % |
| 2020 | 1.465 | 99,7 % | 79,6 % | 10,4 % | 74,1 % | 79,3 % | 79,4 % | 72,9 % | 74,5 % | 73,6 % |
| 2021 | 1.685 | 99,7 % | 79,7 % | 9,7 % | 75,3 % | 79,4 % | 79,6 % | 74,7 % | 72,9 % | 69,6 % |
| 2022 | 1.508 | 99,7 % | 81,6 % | 10,8 % | 78,2 % | 81,2 % | 81,3 % | 77,9 % | 79,4 % | 78,2 % |
| 2023 | 1.479 | 99,7 % | 82,1 % | 12 % | 79,1 % | 81,9 % | 81,8 % | 78,6 % | 80,1 % | 79,8 % |
| 2024 | 1.453 | 99,7 % | 82 % | 13,4 % | 77,6 % | 81,8 % | 81,8 % | 78,7 % | 80,4 % | 80 % |
| 2025 | 1.211 | 99,7 % | 83,8 % | 13 % | 79,9 % | 83,6 % | 83,6 % | 80,3 % | 82,9 % | 82,2 % |
| 2026 | 949 | 99,6 % | 84,7 % | 13,3 % | 80,6 % | 84,6 % | 84,6 % | 81,1 % | 83,2 % | 83,2 % |

**unter5**

| Jahr | aktiv | mit CIK | Bericht | 20-F/40-F | Umsatz | Netto | Vermögen | Aktien | 4Q-Netto | FM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2016 | 1.835 | 99,6 % | 77 % | 3,8 % | 69,2 % | 76,6 % | 76,8 % | 72,4 % | 73,4 % | 72,5 % |
| 2017 | 1.752 | 99,5 % | 76,5 % | 4,1 % | 69,3 % | 76,3 % | 76,4 % | 71,9 % | 72,6 % | 71,7 % |
| 2018 | 1.647 | 99,5 % | 73,6 % | 10,6 % | 67,2 % | 73,5 % | 73,4 % | 69 % | 69,2 % | 67,4 % |
| 2019 | 1.626 | 99,5 % | 72,1 % | 11,6 % | 64,9 % | 72 % | 71,9 % | 68,3 % | 68,8 % | 67,9 % |
| 2020 | 1.505 | 99,5 % | 70,6 % | 11,8 % | 61 % | 70,4 % | 70,5 % | 64,8 % | 66,3 % | 64,6 % |
| 2021 | 1.698 | 99,6 % | 74,7 % | 10,1 % | 50,6 % | 74,5 % | 74,4 % | 59,1 % | 60 % | 50,1 % |
| 2022 | 1.717 | 99,5 % | 76,1 % | 12,8 % | 54 % | 75,7 % | 75,9 % | 63,6 % | 73,2 % | 63,9 % |
| 2023 | 1.414 | 99,4 % | 74,1 % | 14,6 % | 60,3 % | 74,1 % | 74,1 % | 68,5 % | 72,4 % | 71,5 % |
| 2024 | 999 | 99 % | 72,9 % | 15,5 % | 61 % | 72,8 % | 72,8 % | 69,7 % | 71,6 % | 70,4 % |
| 2025 | 650 | 98,5 % | 72 % | 15,8 % | 57,1 % | 72 % | 71,8 % | 67,8 % | 70,3 % | 67,4 % |
| 2026 | 249 | 99,2 % | 75,9 % | 10,8 % | 59 % | 75,9 % | 75,5 % | 66,3 % | 73,1 % | 68,3 % |

**duenn**

| Jahr | aktiv | mit CIK | Bericht | 20-F/40-F | Umsatz | Netto | Vermögen | Aktien | 4Q-Netto | FM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2016 | 292 | 100 % | 65,1 % | 4,5 % | 55,5 % | 64,4 % | 64,7 % | 57,2 % | 57,9 % | 54,5 % |
| 2017 | 328 | 99,1 % | 61,6 % | 3 % | 49,4 % | 61,3 % | 61,3 % | 50,9 % | 50,3 % | 48,5 % |
| 2018 | 297 | 99,3 % | 63 % | 7,4 % | 45,5 % | 62,3 % | 62,3 % | 49,5 % | 49,8 % | 44,4 % |
| 2019 | 340 | 98,2 % | 58,5 % | 6,8 % | 35,3 % | 57,9 % | 58,5 % | 41,8 % | 43,2 % | 38,2 % |
| 2020 | 401 | 99 % | 63,1 % | 3 % | 23,9 % | 58,6 % | 62,8 % | 33,4 % | 30,7 % | 26,7 % |
| 2021 | 549 | 99,5 % | 79,4 % | 2 % | 20,8 % | 77,8 % | 79,4 % | 38,6 % | 23,7 % | 17,3 % |
| 2022 | 611 | 99,3 % | 82,8 % | 3,8 % | 16,9 % | 81,5 % | 82,5 % | 40,9 % | 66,3 % | 23,6 % |
| 2023 | 628 | 98,2 % | 74,5 % | 2,2 % | 20,1 % | 74,2 % | 74,2 % | 35,2 % | 70,1 % | 64,3 % |
| 2024 | 399 | 97,5 % | 72,2 % | 3,3 % | 24,1 % | 72,2 % | 72,2 % | 44,1 % | 66,4 % | 63,2 % |
| 2025 | 219 | 92,2 % | 57,5 % | 5,5 % | 26 % | 57,1 % | 57,1 % | 41,1 % | 53,9 % | 50,2 % |
| 2026 | 139 | 92,1 % | 45,3 % | 5,8 % | 28,8 % | 45,3 % | 45,3 % | 39,6 % | 43,9 % | 42,4 % |

**gesamt**

| Jahr | aktiv | mit CIK | Bericht | 20-F/40-F | Umsatz | Netto | Vermögen | Aktien | 4Q-Netto | FM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2016 | 4.211 | 99,7 % | 77,9 % | 3,4 % | 72,2 % | 77,5 % | 77,7 % | 73,1 % | 74,3 % | 73,5 % |
| 2017 | 4.274 | 99,6 % | 77,9 % | 3,3 % | 72,1 % | 77,5 % | 77,6 % | 72,6 % | 73,7 % | 73 % |
| 2018 | 4.227 | 99,6 % | 77,5 % | 9,5 % | 72,8 % | 77,2 % | 77,1 % | 71,9 % | 73,1 % | 71,6 % |
| 2019 | 4.149 | 99,5 % | 76,3 % | 10,3 % | 70,9 % | 76,1 % | 76,1 % | 71,1 % | 72,5 % | 71,5 % |
| 2020 | 4.263 | 99,6 % | 75,9 % | 9,9 % | 66,8 % | 75,3 % | 75,7 % | 67,7 % | 68,8 % | 67,5 % |
| 2021 | 4.993 | 99,7 % | 78,9 % | 9,3 % | 62,6 % | 78,5 % | 78,7 % | 66,6 % | 64,6 % | 59,1 % |
| 2022 | 4.832 | 99,6 % | 80,6 % | 10,7 % | 63,2 % | 80,1 % | 80,3 % | 69 % | 76,3 % | 67,2 % |
| 2023 | 4.430 | 99,5 % | 79,4 % | 11,2 % | 66,1 % | 79,2 % | 79,2 % | 70,1 % | 77,2 % | 75,9 % |
| 2024 | 3.829 | 99,3 % | 80,1 % | 12,1 % | 70,1 % | 79,9 % | 79,9 % | 74,1 % | 78 % | 77,1 % |
| 2025 | 3.244 | 99 % | 80,8 % | 12,6 % | 73,8 % | 80,6 % | 80,6 % | 76,4 % | 79,5 % | 78,2 % |
| 2026 | 2.641 | 99,3 % | 83 % | 11,4 % | 78,4 % | 82,9 % | 82,8 % | 78,8 % | 81,4 % | 80,8 % |

**Reproduktion der Machbarkeit (2019q2, 2024q2, Prüfung P2).** Reihen mit US-Standardbericht je Klasse: gleich bis auf die verworfenen
Filings mit filed < period (2019q2: 0, 2024q2: 1). Werte Zeile für Zeile (adsh) gegen `deckung-reihen.json`:
- 2019q2: gleich Umsatz 2.858, Vermögen 3.090, Aktien 2.664; durch „erste Veröffentlichung" anders {"umsatz":25,"vermoegen":7,"aktien":0}; Regelunterschied Aktienzahl 37 (Machbarkeit nahm die erste Dateizeile der gewichteten Zahl, die Tafel qtrs = Sollquartal); unerklärt anders: 0.
- 2024q2: gleich Umsatz 2.707, Vermögen 3.187, Aktien 2.739; durch „erste Veröffentlichung" anders {"umsatz":19,"vermoegen":6,"aktien":1}; Regelunterschied Aktienzahl 44 (Machbarkeit nahm die erste Dateizeile der gewichteten Zahl, die Tafel qtrs = Sollquartal); unerklärt anders: 0.

## 3. Verteilungen

**filed − period je Formulartyp** (Tage; Panel-Filings sind liquider als der FSDS-Durchschnitt der Machbarkeit):

| Form | n | p10 | Median | p90 | Mittel | > 45 Tage | > 90 Tage |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| K | 39.352 | 46 | 59 | 89 | 64,6 | 90,2 % | 5,8 % |
| KA | 1.350 | 72 | 146 | 384 | 204,6 | 99,6 % | 82,6 % |
| KT | 84 | 56 | 74 | 120 | 87,8 | 98,8 % | 21,4 % |
| KTA | 4 | 124 | 497 | 524 | 354,0 | 100 % | 100 % |
| Q | 115.987 | 28 | 37 | 45 | 38,1 | 6,8 % | 0,8 % |
| QA | 1.711 | 46 | 140 | 393 | 188,7 | 90 % | 67 % |
| QT | 27 | 39 | 45 | 192 | 90,1 | 48,1 % | 33,3 % |
| QTA | 1 | 63 | 63 | 63 | 63,0 | 100 % | 0 % |

(K = 10-K, KA = 10-K/A, KT = 10-KT, Q = 10-Q, QA = 10-Q/A, QT = 10-QT.) **Monatsend-Rundung:** der Instanzname in sub.txt trägt den echten
Stichtag; er weicht von `period` in 10,9 % der Filings ab (17.240 von 158.516; ohne Datum im Namen 13.948), je Form: K 9,6 %, KA 6,3 %, KT 13,1 %, KTA 0 %, Q 11,4 %, QA 7,9 %, QT 3,7 %, QTA 0 %.
Median der Verschiebung – — für jede Verknüpfung mit Originaldaten ±7 Tage Toleranz.

**Fundamental-Momentum je Jahr** (Zeilen nach filed-Jahr; fm in Prozentpunkten des Vermögens):

| Jahr | Zeilen | mit FM | Lücke FM | FM Median | FM P5 | FM P95 | ROA Median | Umsatzwachstum Median |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2014 | 11.272 | 2.475 | 78 % | 0,06 Pp | -14,78 Pp | 18,05 Pp | 2,51 Pp | 6,87 Pp |
| 2015 | 12.073 | 10.998 | 8,9 % | -0,02 Pp | -29,71 Pp | 23,45 Pp | 1,62 Pp | 5,96 Pp |
| 2016 | 12.231 | 11.262 | 7,9 % | -0,14 Pp | -43,63 Pp | 21,47 Pp | 1,04 Pp | 3,74 Pp |
| 2017 | 12.456 | 11.270 | 9,5 % | 0,04 Pp | -34,36 Pp | 35,74 Pp | 1,13 Pp | 5,79 Pp |
| 2018 | 12.422 | 11.471 | 7,7 % | 0,22 Pp | -27,88 Pp | 34,65 Pp | 1,29 Pp | 8,95 Pp |
| 2019 | 12.222 | 11.357 | 7,1 % | 0,08 Pp | -34,43 Pp | 27,93 Pp | 1,36 Pp | 7,47 Pp |
| 2020 | 12.214 | 11.209 | 8,2 % | -0,49 Pp | -38,45 Pp | 29,93 Pp | 0,75 Pp | 2,21 Pp |
| 2021 | 14.548 | 11.270 | 22,5 % | 0,54 Pp | -21,16 Pp | 47,06 Pp | 0,96 Pp | 5,20 Pp |
| 2022 | 15.361 | 12.143 | 20,9 % | 0,25 Pp | -42,94 Pp | 29,88 Pp | 1,30 Pp | 15,66 Pp |
| 2023 | 13.950 | 13.034 | 6,6 % | -0,40 Pp | -65,85 Pp | 24,77 Pp | 1,06 Pp | 9,61 Pp |
| 2024 | 12.776 | 12.261 | 4 % | -0,12 Pp | -61,97 Pp | 37,69 Pp | 1,05 Pp | 4,65 Pp |
| 2025 | 11.620 | 11.189 | 3,7 % | -0,05 Pp | -50,34 Pp | 45,42 Pp | 1,33 Pp | 4,69 Pp |
| 2026 | 5.371 | 5.217 | 2,9 % | 0,05 Pp | -44,02 Pp | 52,74 Pp | 1,71 Pp | 6,00 Pp |

**Handrechnung (P4)** an drei Firmen über je acht Filings, unabhängig aus den Auszügen nachgerechnet (Quartals-Netto direkt oder Jahr − 3 Quartale, Vermögen zum Stichtag und vier Quartale früher):

*JPM* (CIK 19617): 8 von 8 stimmen

| Form | period | filed | netto4Q | Vermögen | ROA | ROA vor | FM (Hand) | FM (Tafel) | Wege |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 10-Q | 2024-06-30 | 2024-08-02 | 54.026.000.000 | 4.143.003.000.000 | 1,30 Pp | 1,24 Pp | 0,07 Pp | 0,07 Pp | ddjdddjd |
| 10-Q | 2024-09-30 | 2024-10-30 | 53.773.000.000 | 4.210.048.000.000 | 1,28 Pp | 1,31 Pp | -0,04 Pp | -0,04 Pp | dddjdddj |
| 10-K | 2024-12-31 | 2025-02-14 | 58.471.000.000 | 4.002.814.000.000 | 1,46 Pp | 1,28 Pp | 0,18 Pp | 0,18 Pp | jdddjddd |
| 10-Q | 2025-03-31 | 2025-05-01 | 59.695.000.000 | 4.357.856.000.000 | 1,37 Pp | 1,23 Pp | 0,14 Pp | 0,14 Pp | djdddjdd |
| 10-Q | 2025-06-30 | 2025-08-05 | 56.533.000.000 | 4.552.482.000.000 | 1,24 Pp | 1,30 Pp | -0,06 Pp | -0,06 Pp | ddjdddjd |
| 10-Q | 2025-09-30 | 2025-11-04 | 58.028.000.000 | 4.560.205.000.000 | 1,27 Pp | 1,28 Pp | -0,00 Pp | -0,00 Pp | dddjdddj |
| 10-K | 2025-12-31 | 2026-02-13 | 57.048.000.000 | 4.424.900.000.000 | 1,29 Pp | 1,46 Pp | -0,17 Pp | -0,17 Pp | jdddjddd |
| 10-Q | 2026-03-31 | 2026-05-01 | 58.899.000.000 | 4.900.475.000.000 | 1,20 Pp | 1,37 Pp | -0,17 Pp | -0,17 Pp | djdddjdd |

*AAPL* (CIK 320193): 8 von 8 stimmen

| Form | period | filed | netto4Q | Vermögen | ROA | ROA vor | FM (Hand) | FM (Tafel) | Wege |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 10-Q | 2024-06-30 | 2024-08-02 | 101.956.000.000 | 331.612.000.000 | 30,75 Pp | 28,28 Pp | 2,46 Pp | 2,46 Pp | dddjdddj |
| 10-K | 2024-09-30 | 2024-11-01 | 93.736.000.000 | 364.980.000.000 | 25,68 Pp | 27,51 Pp | -1,83 Pp | -1,83 Pp | jdddjddd |
| 10-Q | 2024-12-31 | 2025-01-31 | 96.150.000.000 | 344.085.000.000 | 27,94 Pp | 28,55 Pp | -0,60 Pp | -0,60 Pp | djdddjdd |
| 10-Q | 2025-03-31 | 2025-05-02 | 97.294.000.000 | 331.233.000.000 | 29,37 Pp | 29,75 Pp | -0,38 Pp | -0,38 Pp | ddjdddjd |
| 10-Q | 2025-06-30 | 2025-08-01 | 99.280.000.000 | 331.495.000.000 | 29,95 Pp | 30,75 Pp | -0,80 Pp | -0,80 Pp | dddjdddj |
| 10-K | 2025-09-30 | 2025-10-31 | 112.010.000.000 | 359.241.000.000 | 31,18 Pp | 25,68 Pp | 5,50 Pp | 5,50 Pp | jdddjddd |
| 10-Q | 2025-12-31 | 2026-01-30 | 117.777.000.000 | 379.297.000.000 | 31,05 Pp | 27,94 Pp | 3,11 Pp | 3,11 Pp | djdddjdd |
| 10-Q | 2026-03-31 | 2026-05-01 | 122.575.000.000 | 371.082.000.000 | 33,03 Pp | 29,37 Pp | 3,66 Pp | 3,66 Pp | ddjdddjd |

*AAOI* (CIK 1158114): 8 von 8 stimmen

| Form | period | filed | netto4Q | Vermögen | ROA | ROA vor | FM (Hand) | FM (Tafel) | Wege |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 10-Q | 2024-06-30 | 2024-08-06 | -72.097.000 | 348.040.000 | -20,72 Pp | -19,37 Pp | -1,35 Pp | -1,35 Pp | ddjdddjd |
| 10-Q | 2024-09-30 | 2024-11-07 | -80.901.000 | 409.972.000 | -19,73 Pp | -16,70 Pp | -3,03 Pp | -3,03 Pp | dddjdddj |
| 10-K | 2024-12-31 | 2025-02-28 | -186.733.000 | 547.032.000 | -34,14 Pp | -14,40 Pp | -19,73 Pp | -19,73 Pp | jdddjddd |
| 10-Q | 2025-03-31 | 2025-05-08 | -172.735.000 | 644.668.000 | -26,79 Pp | -17,93 Pp | -8,86 Pp | -8,86 Pp | djdddjdd |
| 10-Q | 2025-06-30 | 2025-08-07 | -155.718.000 | 796.850.000 | -19,54 Pp | -20,72 Pp | 1,17 Pp | 1,17 Pp | ddjdddjd |
| 10-Q | 2025-09-30 | 2025-11-06 | -155.897.000 | 978.528.000 | -15,93 Pp | -19,73 Pp | 3,80 Pp | 3,80 Pp | dddjdddj |
| 10-K | 2025-12-31 | 2026-02-26 | -38.228.000 | 1.168.423.000 | -3,27 Pp | -34,14 Pp | 30,86 Pp | 30,86 Pp | jdddjddd |
| 10-Q | 2026-03-31 | 2026-05-07 | -43.337.000 | 1.565.879.000 | -2,77 Pp | -26,79 Pp | 24,03 Pp | 24,03 Pp | djdddjdd |

## 4. Neudarstellungen

251.233 Schlüssel (cik, Tag, ddate, qtrs) wurden später mit anderem Wert wieder eingereicht — je Größe: aktien 44.663, eigenkapital 40.754, fue 7.785, netto 54.840, operativ 33.982, umsatz 34.736, umsatzkosten 17.790, vermoegen 16.683;
je Form des späteren Filings: K 96.335, KA 9.297, KT 321, KTA 11, Q 135.111, QA 10.090, QT 60, QTA 8. Die meisten sind Vergleichszahlen im nächsten 10-Q/10-K (aufgegebene
Geschäftsbereiche, Umgliederungen, Abspaltungen), nicht /A-Korrekturen. **Die Tafel trägt in allen Fällen den ersten Wert.**

**20 Handproben gegen die SEC-API (P7, `companyconcept`, 20 Anfragen, Cache `edgar-fsds/api-cache/`):** 20 von 20 bestanden — Tafelwert = erster Wert mit erstem `filed`,
die API führt beide Einreichungen mit denselben Werten und Daten. Der Eintrag mit `frame` (das, was `companyfacts`/`frames` als Wert der Periode liefern)
trägt in 19 Fällen NICHT die Erstveröffentlichung (in 17 genau den späteren Wert). Kandidaten: 47.201 Fälle mit ≥ 1 % Abweichung, gewählt eine je Firma, liquide Klassen zuerst, über die Jahre verteilt.

| Reihe | Klasse | Tag | Stichtag | qtrs | Tafel (erster Wert, filed) | später (Wert, filed) | API frame-Wert | ok |
| --- | --- | --- | --- | ---: | --- | --- | --- | --- |
| GE | ab1000 | Revenues | 2016-06-30 | 1 | 33.494.000.000 (2016-08-01, 10-Q) | 2.771.000.000 (2017-02-24, 10-K) | 33.494.000.000 CY2016Q2 | ja |
| BAC | ab1000 | NetIncomeLoss | 2016-03-31 | 1 | 2.680.000.000 (2016-05-02, 10-Q) | 3.472.000.000 (2017-05-02, 10-Q) | 3.472.000.000 CY2016Q1 | ja |
| MSFT | ab1000 | OperatingIncomeLoss | 2017-06-30 | 4 | 22.326.000.000 (2017-08-02, 10-K) | 29.025.000.000 (2018-08-03, 10-K) | 29.025.000.000 CY2017 | ja |
| AMD | ab1000 | NetIncomeLoss | 2017-12-31 | 4 | 43.000.000 (2018-02-27, 10-K) | -33.000.000 (2019-02-08, 10-K) | -33.000.000 CY2017 | ja |
| BA | ab1000 | Assets | 2017-12-31 | 0 | 92.333.000.000 (2018-02-12, 10-K) | 112.362.000.000 (2018-04-25, 10-Q) | 112.362.000.000 CY2017Q4I | ja |
| GOOG | ab1000 | OperatingIncomeLoss | 2018-12-31 | 4 | 26.321.000.000 (2019-02-05, 10-K) | 27.524.000.000 (2020-02-04, 10-K) | 27.524.000.000 CY2018 | ja |
| PFE | ab1000 | NetIncomeLoss | 2020-12-31 | 4 | 9.616.000.000 (2021-02-25, 10-K) | 9.159.000.000 (2022-02-24, 10-K) | 9.159.000.000 CY2020 | ja |
| JNJ | ab1000 | RevenueFromContractWithCustomerExcludingAssessedTax | 2021-12-31 | 4 | 93.775.000.000 (2022-02-17, 10-K) | 78.740.000.000 (2024-02-16, 10-K) | 78.740.000.000 CY2021 | ja |
| SQ | ab1000 | Assets | 2021-12-31 | 0 | 13.925.764.000 (2022-02-24, 10-K) | 15.026.360.000 (2022-08-04, 10-Q) | 15.026.360.000 CY2021Q4I | ja |
| COIN | ab1000 | Assets | 2023-12-31 | 0 | 206.982.953.000 (2024-02-15, 10-K) | 14.753.901.000 (2025-02-13, 10-K) | 14.753.901.000 CY2023Q4I | ja |
| TSLA | ab1000 | NetIncomeLoss | 2024-03-31 | 1 | 1.129.000.000 (2024-04-24, 10-Q) | 1.390.000.000 (2025-04-23, 10-Q) | 1.390.000.000 CY2024Q1 | ja |
| APP | ab1000 | RevenueFromContractWithCustomerExcludingAssessedTax | 2024-12-31 | 4 | 4.709.248.000 (2025-02-27, 10-K) | 3.224.058.000 (2026-02-19, 10-K) | 3.224.058.000 CY2024 | ja |
| CRWD | ab1000 | NetIncomeLoss | 2025-01-31 | 4 | -19.271.000 (2025-03-10, 10-K) | -15.241.000 (2026-03-05, 10-K) | -12.566.000 CY2024 | ja |
| CRM | 250-1000 | OperatingIncomeLoss | 2017-01-31 | 4 | 64.228.000 (2017-03-06, 10-K) | 218.000.000 (2019-03-08, 10-K) | 218.000.000 CY2016 | ja |
| DD | 250-1000 | Revenues | 2018-12-31 | 4 | 85.977.000.000 (2019-02-11, 10-K) | 22.594.000.000 (2020-02-14, 10-K) | 16.378.000.000 CY2018 | ja |
| NKLA | 250-1000 | NetIncomeLoss | 2020-03-31 | 1 | -124.540 (2020-05-11, 10-Q) | -33.146.000 (2021-02-25, 10-K) | -33.146.000 CY2020Q1 | ja |
| LVS | 250-1000 | OperatingIncomeLoss | 2020-03-31 | 1 | 55.000.000 (2020-04-24, 10-Q) | 6.000.000 (2021-04-23, 10-Q) | 6.000.000 CY2020Q1 | ja |
| CCIV | 250-1000 | OperatingIncomeLoss | 2021-06-30 | 1 | -562.194 (2021-08-16, 10-Q) | -248.919.000 (2022-08-03, 10-Q) | -248.919.000 CY2021Q2 | ja |
| MARA | 250-1000 | OperatingIncomeLoss | 2023-03-31 | 1 | -3.858.000 (2023-05-10, 10-Q) | 122.076.000 (2024-05-09, 10-Q) | 122.076.000 CY2023Q1 | ja |
| WDAY | 250-1000 | NetIncomeLoss | 2023-04-30 | 1 | 136.000 (2023-05-25, 10-Q) | 0 (2024-05-29, 10-Q) | 0 CY2023Q1 | ja |

## 5. Prüfungen (`test-fundamental.js`, 52 s)

- bestanden — P1a Sperrklinke konstruiert
- bestanden — P1b 1000 Zufallszugriffe: 532 von 1000 geliefert, 0 Verstoesse
- bestanden — P2 Reproduktion Machbarkeit
- bestanden — P3 Abstand filed-period und Rundung: 10-Q Median 37 Tage, 10-K 59, gerundet 10.9 %
- bestanden — P4 Handrechnung Fundamental-Momentum
- bestanden — P5 Verteilung Fundamental-Momentum: FM in 85.3 % der Zeilen
- bestanden — P7 Handproben SEC-API: 20 von 20 bestanden, frame ohne Erstwert in 19
- bestanden — P6 Determinismus: 16/16 Tafeldateien und 4/4 Auszugsdateien bitgleich

Leck-Probe im Einzelnen: konstruiertes Filing mit filed = tag wirft (true), filed = tag − 1 liefert (true); die Suche liefert am Einreichungstag
das Vorgänger-Filing (a) und am Folgetag das neue (b). 1000 Zufallszugriffe (Kürzel × Handelstag 2016–2026, Saat 20260916): 532 geliefert,
326 ohne Filing vor dem Tag, 127 veraltet (Aktualitäts-Tor 456 Tage), 15 ohne CIK; Protokoll 1000 Einträge, 0 mit filed ≥ tag.
Determinismus: Zweitbau in einen anderen Ordner (24 s) — 16 von 16 Dateien SHA-256-gleich; Zweitauszug 2019q2/2024q2 aus den Roh-Quartalen 4/4 gleich.

## 6. Sektorschlüssel

GICS haben wir nicht; `sic` aus sub.txt (je Filing, kann sich ändern) wird nach den zehn SIC-Divisionen gruppiert (`zuordnung.js sektorVonSic`):

| Division | SIC | Zeilen | CIKs |
| --- | --- | ---: | ---: |
| Landwirtschaft | 100–999 | 518 | 23 |
| Bergbau/Oel | 1000–1499 | 6.319 | 209 |
| Bau | 1500–1799 | 2.240 | 66 |
| Verarbeitendes Gewerbe | 2000–3999 | 61.512 | 1.945 |
| Transport/Versorger/Kommunikation | 4000–4999 | 11.346 | 357 |
| Grosshandel | 5000–5199 | 3.645 | 111 |
| Einzelhandel | 5200–5999 | 8.193 | 252 |
| Finanzen/Immobilien | 6000–6799 | 38.276 | 1.868 |
| Dienstleistungen | 7000–8999 | 25.979 | 990 |
| Oeffentliche Verwaltung | 9100–9999 | 0 | 0 |
| ohne SIC | – | 488 | 35 |

Für den Prüfstand ist das grob (Verarbeitendes Gewerbe ist eine Division); feinere Schnitte sind über die zweistellige SIC (Major Group, `sic` steht in jeder Zeile) möglich.

## 7. Was diese Tafel nicht weiß

- **Vorab-Meldungen per 8-K.** Die Quartalszahl ist meist **Wochen vor** dem 10-Q per Pressemeldung (8-K Item 2.02) bekannt — 10-Q Median 37 Tage nach Stichtag, die Pressemeldung oft 1–3 Wochen früher. Die Tafel nimmt bewusst das spätere `filed` des 10-Q: konservativ (nie zu früh), aber ein Ranking, das am 10-Q-Tag reagiert, kommt später als der Markt. Wer das braucht, muss die 8-K-Daten aus dem Volltextindex dazuladen — die Tafel hat sie nicht.
- **20-F/40-F** (ausländische Emittenten, ADR, kanadische CS): 4.931 Panel-Filings nur gezählt (`_auslaend.json`), nicht aufgenommen — IFRS-Tags, Fremdwährung, jährlich. Die liquiden Klassen verlieren dadurch je Jahr die Reihen in Spalte 20-F/40-F der Deckungstafel.
- **Dividenden, Aktienrückkäufe, Cashflow** stehen nicht in der Tafel (Tags nicht aufgenommen); Kapitalmaßnahmen, Ausschüttungsrendite und B/M-Nenner brauchen andere Quellen (Aktienzahl ist die Bilanzzahl, Mehrklassen-Emittenten melden je Klasse in Segmenten).
- **Fremdwährungs-Filer** in 10-K/10-Q (uom ≠ USD): 4.088 Zeilen verworfen, keine Umrechnung.
- **CIK-Zuordnung** verschwundener Reihen: 1.003 „schwach", CIK-Wechsel bei Umstrukturierungen (APA, ABC → COR) — die Sicherheit steht in `_reihen.json`, der Prüfstand kann schwache Zuordnungen ausschließen.
- **Umsatz-Tag-Wildwuchs:** firmeneigene Umsatz-Tags (≈ 3 % der Filings, Machbarkeit) sind verloren; Umsatzkosten nur zu 52,1 % der Zeilen (Bruttoprofitabilität bleibt lückig).
- **Verzug der Quelle:** die SEC stellt ein FSDS-Quartal ≈ 2 Wochen nach Quartalsende bereit; 2026q3 fehlt (404). Filings seit 01.07.2026 sind nicht in der Tafel — für den laufenden Rand braucht es den täglichen EDGAR-Index. Der Prüfstand darf die Tafel nur bis 30.06.2026 als vollständig ansehen.
- **Uhrzeit:** `accepted` steht in der Zeile; nutzbar ist ein Filing ab dem Handelstag NACH `filed` (der Leser liefert nur filed < tag). Filings nach 17:30 ET tragen ohnehin den Folgetag.
- **Der Weg „Jahr − YTD3"** und die YTD-Differenzen gehen über die Auftragsregel hinaus (Markierung `y`, `2`, `3`, `4` in `wege`), Anteil siehe §1.
- **Neudarstellungen sind nicht in den Zeilen** markiert (das wäre ein Blick in die Zukunft); sie stehen nur in `_neudarstellungen.json` für Diagnosen.

## 8. Anschluss

Leser: `var F = require('studien/fundamental-machbarkeit-2026-09-16/fundamental-lesen.js'); var t = F.oeffne(); t.fundamentalAm('AAPL', '2024-05-06')` → Zeile oder null;
`t.protokoll()` für die Sperrklinke, `t.zaehler` (geliefert / ohne Filing / veraltet / ohne Reihe), Option `{maxAlterTage: null}` schaltet das Aktualitäts-Tor ab.
Nächster Auftrag (Prüfstand): Rangfunktion „gedrückt, aber liefert" über `abgeleitet.fm` und die Kursdrift, Vorregistrierung mit Klassen, Aktualitäts-Tor und Umgang mit `y`-Wegen.

## 9. v1.1 (22.09.2026) — vier Datenkorrekturen, Auftrag Nr. 60

**Anlass:** die neun Feld-Agenten der Mehrfaktor-Studie (Nr. 49–57) fanden in v1 vier Fehlerarten (Aktienzahlen in Tausend/Millionen,
falsche Kürzel→CIK-Zuordnungen, Filings in falscher Einheit, Vorjahresbestand aus der Hülle). **Kennung** `fundamentaltafel-2026-09-16/v1.1`
(`bauen.js`, `_reihen.json`, `_bau.json`; der Leser `fundamental-lesen.js` weist jede andere Tafel-Kennung ab). Bau 40 s, Zweitbau bitgleich
(P6). Die Tafel v1 liegt unverändert unter `fundamentaltafel-v1/` (nur auf der Platte). Alle Zahlen dieses Abschnitts stammen aus `_bau.json`
(Block `v11`, im Repo als `_stand.json` → `v11`), `test-fundamental.json` und `vergleich-v1-v11.json`; Regeln im Wortlaut:
`uebergabe/auftrag-fundamentaltafel-v11-2026-09-22.md` §2. **v1.1: 149.078 Zeilen für 5.648 CIKs** (v1: 158.516 / 6.003), 2.162.421 Erst-Fakten,
230.323 Neudarstellungen; FM in 127.111 Zeilen (85,3 %).

**Regeln in Kurzform und Reihenfolge im Bau.** (2b) *Zuordnung, vor allem anderen:* jede Reihe mit `sicherheit` schwach/mittel wird über den
Namen geprüft — Registrant (Spalte `name` des jüngsten Filings der CIK in den sub-Auszügen) gegen den Marktnamen der Reihe. Marktname aus
`Markt-Dashboard-Daten/massive/verschwundene.json` (Polygon-Referenzliste `reference/tickers?active=false`, Stand 23.08.2026), Feld `name` —
die EDGAR-Volltextzuordnung der Studie `verschwundene-gruende-2026-09-12` hat **mit dem Kürzel** gesucht (`edgar-lauf.js ftsKuerzel`), ihr Feld
`name` ist der gefundene Registrant und damit nicht unabhängig; `panel.json → reihen[].name` wurde deshalb nicht benutzt. Normalisierung: Kleinschreibung,
`/MD/`-Zusätze und Satzzeichen weg, Rechtsformen/Füllwörter (inc corp corporation co company ltd limited plc holdings holding group the trust lp llc nv sa
ag incorporated) und Wertpapierbezeichnungen der Marktliste (common stock class ordinary shares share depositary receipts adr ads each representing unit
units of and) entfernt, Token < 2 Zeichen weg. Jaccard ≥ 0,5 **oder** erstes Token gleich und ≥ 4 Zeichen ⇒ bestätigt, sonst verworfen (`cik: null`,
`sicherheit: 'verworfen'`, `grund`); ohne Registrant ⇒ `ungeprueft`. Verworfene CIKs bekommen keine Tafelzeilen, außer eine andere Reihe trägt dieselbe
CIK bestätigt. (2c) *Einheit, vor dem Einfügen in den Faktenspeicher:* eigener `Assets`-Wert des Filings (qtrs 0, ddate = period) gegen beide
Nachbar-Filings der CIK > Faktor 100 in derselben Richtung, oder am Reihenanfang/-ende gegen den einzigen Nachbarn **und** den CIK-Median ⇒
verdächtig; ohne Assets dieselbe Prüfung mit der Umsatz-Gruppe. Alle Fakten des adsh werden beim Laden übersprungen; die Zeile bleibt mit
`roh` = null und `marken.einheit = 'verdacht'`. (2a) *Aktien-Skala, nach `aktienzahl(f)`:* Regel A je CIK und Tag (Median von log10 über alle Filings
mit diesem Tag, unteres mittleres Element; ab 3 Filings wird ein Wert mit Abstand ≥ 2,5 um 1000^k skaliert, k = round((m − l)/3) ∈ {−2,−1,1,2});
danach Regel B je Filing mit dem Außenanker Marktwert = aktien × unbereinigter Panel-Schluss (`T.g.rohSchluss`) am letzten Handelstag ≤ filed, bis 10
Handelstage zurück, erstes Kürzel der Reihe mit Kurs: Marktwert/Vermögen < 10⁻³ ⇒ 1000^k mit k ∈ {1,2} und dem Quotienten am nächsten an 1, sofern danach
in [0,003; 300], sonst `aktien = null`; > 3.000 sinngemäß mit k ∈ {−1,−2}; kein Kurs / kein Vermögen ⇒ Marke, keine Regel B. Verbleibende Sprünge > 30
werden gezählt (Befund). (2d) *Vorjahresbestand aus der Hülle:* liegt `Assets` an D4 um mehr als Faktor 1000 vom Vermögen D0 entfernt, wird `vermoegenVor`
null; reißt einer der Stichtage D4…D7 die Grenze, werden `summe4q.*Vor` null (damit `roaVor`, `fm`, `umsatzWachstum`); `marken.d4 = 'huelle'`.
Marken je Zeile: `marken.aktienSkala` (null | {regel:'A', faktor} | {regel:'B', faktor[, nachA]} | {regel:'B', verworfen} | {regel:'B', ohneKurs} |
{regel:'B', ohneVermoegen}), `marken.einheit` (null | 'verdacht'), `marken.d4` (null | 'huelle'); in `_reihen.json` je Reihe `pruefung`
(bestaetigt | verworfen | ungeprueft | tabelle; null ohne CIK), bei verworfen `grund`, bei geprüften `marktname`, `registrant`, `jaccard`.

**Zähler je Korrektur.**

| Korrektur | Ergebnis |
| --- | --- |
| 2b Zuordnung | schwach 1.003: bestätigt 335, verworfen 294, ungeprüft 374; mittel 2.428: bestätigt 1.648, verworfen 682, ungeprüft 98; stark 1.508 ungeprüft (Regel), Tabelle 2.283, ohne CIK 77. Ungeprüft = 470 ohne Filing der CIK im Auszug + 2 leer nach Normalisierung (ohne Marktnamen: 0). **976 verworfen → 355 CIKs ohne Reihe → 9.438 Zeilen weniger**; `X` → null (HSBC USA INC /MD/ ≠ United States Steel Corporation). Diagnose: bei **693 der 976** passt ein *früherer* Name derselben CIK (Umfirmierung, SPAC-Fusion); Polygon-CIK gegen Zuordnungs-CIK: 4.814 verglichen, 3.875 gleich, 939 anders (verworfen ∧ anders 264, bestätigt ∧ anders 94); 62 nur über das erste Token bestätigt; unter den 1.494 „starken" Reihen passen 408 Namen ebenfalls nicht (nur gezählt). |
| 2c Einheit | **368 verdächtig** (alle über Assets, 0 über Umsatz): 17 gegen beide Nachbarn, 1 Reihenende + Median (HRC 10-K filed 2021-11-12: 4.999,1 gegen 4,57 Mrd), **350 Reihenanfang + Median** (erste Filings von Vor-Börsengang-Hüllen: OGS 1 $, MDT 46.000 $, PLNT 1.000 $, AMCR 130 $, TW 100 $ …); einseitige Sprünge > 100 (Hüllen, bleiben) 474; ohne Nachbarn 12; ohne Prüfung 627; 3.166 Fakten übersprungen; 1.014 spätere Zeilen derselben CIKs mit Folgeänderung (erste Veröffentlichung rückt auf das nächste Filing). |
| 2a Aktien-Skala | Regel A 726 (512 aufwärts, 214 abwärts, davon 33 danach von Regel B zurückgedreht), 4 außerhalb k, 834 Zeilen in Gruppen < 3 Filings; Regel B 173 (168 aufwärts, **5 abwärts — alle mit Vermögen < 1 Mio $**), verworfen 0; ohne Kurs 29.055 (20.463 vor 2016-01-04, 8.592 ohne Kurs am filed-Tag trotz Kürzel im Panel), ohne Vermögen 280, Aktienzahl ≤ 0: 196. **Sprünge > 30 zwischen Nachbar-Filings: 898 → 341** (165 beide Seiten mit Kurs, 47 an der Grenze 2015/2016, 123 sonst ohne Kurs, 7 ohne Vermögen). Zeilen mit Aktienzahl 133.735 (v1 142.258). |
| 2d D4 Hülle | 969 Zeilen markiert (303 über D4, 666 nur über D5–D7); 595 davon mit Wertänderung gegen v1 (336 × `vermoegenVor` → null), 374 mit schon leerem Vorjahresfenster. Kein `vermoegenVor/vermoegen` außerhalb [10⁻³, 10³] mehr (0 von 132.690). |

**Vorher/Nachher (`vergleich-v1-v11.js`, jede Zeile nach adsh):** 149.078 Zeilen v1.1, **0 unerwartet geändert**; nur in v1: 9.438 (alle durch
verworfene Zuordnung), nur in v1.1: 0; `einheit: 'verdacht'` 368 + 1.014 Folgeänderungen; `sym`-Liste geändert 12.351 (verworfene Kürzel entfernt);
`roh.aktien` geändert 833 (Regel A 692, Regel B 141, verworfen 0) + 33 Marken ohne Wertänderung (Regel A × Regel B = 1, z. B. COP); Vorjahresfelder
geändert 1.051 (595 Hülle, Rest Folgeänderungen). Deckung „Aktien" (Definition §2) v1 gegen v1.1 — v1.1 liegt tiefer, weil verworfene Reihen ohne
CIK zählen:

| Klasse | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ab1000 v1 | 100 % | 91,7 % | 94,4 % | 89,5 % | 90,6 % | 87 % | 86,8 % | 82,6 % | 82,9 % | 88,3 % | 91,9 % |
| ab1000 v1.1 | 100 % | 91,7 % | 94,4 % | 89,5 % | 90,6 % | 87 % | 86,8 % | 82,6 % | 82,9 % | 88,3 % | 91,9 % |
| 250-1000 v1 | 82,8 % | 86 % | 82,5 % | 90,2 % | 82,5 % | 86,2 % | 89,7 % | 88,2 % | 88,8 % | 89,4 % | 88,8 % |
| 250-1000 v1.1 | 80,2 % | 83,2 % | 81 % | 89,4 % | 81,4 % | 85,3 % | 89,2 % | 88,2 % | 88,8 % | 89,4 % | 88,8 % |
| 50-250 v1 | 77,9 % | 77,9 % | 78,3 % | 79,1 % | 78,3 % | 78 % | 79,2 % | 81,5 % | 83 % | 81,4 % | 80,7 % |
| 50-250 v1.1 | 75,1 % | 75,3 % | 76,2 % | 77,3 % | 76,5 % | 76,1 % | 77,7 % | 80,4 % | 82,2 % | 81 % | 80,7 % |
| 5-50 v1 | 74,3 % | 74,9 % | 75,6 % | 76 % | 72,9 % | 74,7 % | 77,9 % | 78,6 % | 78,7 % | 80,3 % | 81,1 % |
| 5-50 v1.1 | 70,3 % | 71,4 % | 71,9 % | 73 % | 69,9 % | 70,2 % | 76 % | 77,6 % | 78,3 % | 79,6 % | 80,8 % |
| unter5 v1 | 72,4 % | 71,9 % | 69 % | 68,3 % | 64,8 % | 59,1 % | 63,6 % | 68,5 % | 69,7 % | 67,8 % | 66,3 % |
| unter5 v1.1 | 60,1 % | 59,2 % | 56,3 % | 55,9 % | 53,5 % | 48,4 % | 55,7 % | 61,6 % | 66 % | 66,5 % | 65,9 % |
| duenn v1 | 57,2 % | 50,9 % | 49,5 % | 41,8 % | 33,4 % | 38,6 % | 40,9 % | 35,2 % | 44,1 % | 41,1 % | 39,6 % |
| duenn v1.1 | 44,9 % | 39,3 % | 35 % | 29,7 % | 20,7 % | 21,5 % | 26,8 % | 24,8 % | 31,6 % | 38,4 % | 33,8 % |
| gesamt v1 | 73,1 % | 72,6 % | 71,9 % | 71,1 % | 67,7 % | 66,6 % | 69 % | 70,1 % | 74,1 % | 76,4 % | 78,8 % |
| gesamt v1.1 | 65,1 % | 64,9 % | 64,3 % | 63,9 % | 61,2 % | 59,2 % | 63,5 % | 65,9 % | 71,6 % | 75,6 % | 78,3 % |

**Prüfungen (`test-fundamental.js --ohne-api`, 79 s + Zweitbau 48 s):** P1a/P1b bestanden (442 von 1.000 geliefert — v1 532, weil 976 Reihen
keine CIK mehr haben —, 0 Verstöße); P2 bestanden — Abweichungen zur Machbarkeit nur dort, wo eine Korrektur wirkt (2019q2: 93 Reihen / 103 Filings
durch Zuordnung, Aktien-Skala 17 A + 4 B, Einheit 5; 2024q2: 13 / 17, 11 A + 5 B, 3; unerklärt 0); P3 (gerundet 11,4 %), P4 (24 von 24), P5 (85,3 %)
bestanden; P6 Zweitbau 16/16 Tafeldateien und 4/4 Auszugsdateien bitgleich; **P7 übersprungen** (`--ohne-api`, kein Netz laut Auftrag);
**P8 FEHLER**: Marktwerte am jüngsten 10-K vor 2026-03-01 — MCD 2,38·10¹¹ (Regel A ×10⁶), KO 3,44·10¹¹, PCAR 6,58·10¹⁰, TEVA 4,15·10¹⁰, AAPL 3,99·10¹²
ok, **COP 1,36·10⁸ statt 1–1,5·10¹¹** (Regel A hat den richtigen Stück-Wert 1.252.042.000 an die Tausender-Mehrheit der CIK angeglichen, Faktor 0,001;
Regel B fängt ihn bei Quotient 1,12·10⁻³ knapp nicht mehr), BRK.A/BRK.B nicht prüfbar (Aktienzahl null — Mehrklassen-Emittent, Stück je Klasse in
Segmenten), AAPL 10-Q 2014-04-24 → 861.745.000 (Regel A ×1000) ok, **Sprünge > 30 nach Korrektur 341 von 898 = 38 % statt < 5 %**; P9 bestanden
(`X` → null, F 37996 / T 732717 / A 1090872 unverändert, 0 Tabellen-Reihen verändert); P10 bestanden (HRC markiert, 0 Sprünge gegen beide Nachbarn > 100
in der Tafel, 474 Hüllen einseitig); P11 bestanden — **gemessen als Ergebnis, nicht als Marke**: AMCR (1 Zeile, v1 FM −3,59·10⁶) und TW (3 Zeilen, v1 FM
−1,59·10⁶) sind bereinigt, aber über 2c (ihre Hüllen-Filings 2019-03-31 mit Assets 130 $ bzw. 100 $ sind die ersten Filings der CIK und fielen unter
„Reihenanfang + Median"), nicht über 2d; P12 bestanden (Kennung v1.1, der Leser weist `fundamentaltafel-v1/` ab).

**Befunde und Grenzen (Regeln wie beauftragt gebaut, nicht abgewandelt — Entscheide siehe Übergabe):**

- *2b:* die Regel „jüngstes Filing der CIK" verwirft Umfirmierungen und SPAC-Fusionen mit richtiger CIK (693 von 976; z. B. DPW → Hyperscale Data,
  SONA → Primis, ACTD → Opal Fuels); Vergleich gegen **alle** Namen, die die CIK je in sub.txt trug, ließe 283 verworfen. Die Regel „erstes Token ≥ 4"
  bestätigt „Bank …"/„American …" allein über das erste Wort (62 Fälle, z. B. AEL → American National Group). Plural/Tippfehler (RLH „Red Lions"
  gegen „RED LION") fallen durch.
- *2c:* die Randklausel „Reihenanfang + Median" trifft 350 erste Filings von Hüllen — das sind die SPAC-/Spin-off-Hüllen, die die Klausel „beide
  Nachbarn" bewusst stehen lassen sollte; nur 18 Fälle sind isolierte Einheitenfehler (Erwartung 15–40). Bei HRC ist nur `Assets` D0 falsch, Umsatz
  (3,02 Mrd) und Vorjahresbilanz (4,67 Mrd) desselben adsh sind richtig — die Regel „alle Fakten des adsh" wirft sie mit.
- *2a:* Regel A gleicht an die **Mehrheit** an — steht die Mehrheit in Tausend (COP, AVP, ATRI …), wird der richtige Stück-Wert falsch (214 Abwärts-
  Angleichungen); Regel B mit Schwelle 10⁻³ fängt Tausender-Fehler nur, wenn der wahre Quotient Marktwert/Vermögen < 1 ist (COP 1,1, ATRI/EVER/TEM
  4–10 bleiben; 238 Zeilen im Band [10⁻³, 10⁻²), davon 3 CIKs durchgängig); Regel B abwärts (> 3.000) korrigierte 5-mal falsch, alle bei
  Hüllen-Vermögen < 1 Mio $ (LG, STO, TRTN, SRAX); vor 2016-01-04 gibt es keinen Panel-Kurs — 20.463 Zeilen ohne Regel B, an der Grenze 2015/2016
  entstehen 47 Sprünge (MCD 712,9 bleibt in den Zeilen 2014–2015 in Millionen); Regel A mit Abstand 2,5 verfehlt Einzelfehler in CIKs, deren
  Aktienzahl über die Jahre selbst um Faktor > 100 wanderte (EKSO 60.832 zwischen 60 und 62 Mio).
- *2d:* wirkt nur auf das Vorjahresfenster; sitzt die Hülle in D1…D3 (erste Filings nach einer Fusion), bleibt die laufende 4Q-Summe gemischt.

