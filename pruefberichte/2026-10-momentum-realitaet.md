# Realitätsprobe Momentum-Buch (04.10.2026)

*Simulation, keine Anlageberatung. Nur Zahlen und Grenzen. Eigene Zahlen stammen aus dem Auftrag und `wiki/belegstand.md` und wurden hier nicht neu gerechnet (keine Kursdaten des Projekts im Sandkasten).*

## Kurzfassung

1. **Einschätzung: „nicht entscheidbar", mit klarer Tendenz „zu schön" für die Aussage „Momentum schlägt den Markt deutlich".**
2. Die Höhe der Zahlen für den Korb 187 liegt **innerhalb der Spanne investierbarer Produkte**: A +159 % (MTUM +152, SPMO +145), B +150 % (SPMO +141).
3. Aber nur **ein** US-Fonds (SPMO) hielt in B mit; MTUM +74, QMOM +45, PDP +42 %, UCITS-Momentum +68 bis +77 % (USD) liegen **unter** SPY (+81 %). In A schlugen MTUM/SPMO/IUMO den SPY, QMOM nicht.
4. Das Buch bekam seine Rendite mit **deutlich tieferem Rückschlag** als SPMO (−49/−57 % gegen −31/−23 %). Gleiche Höhe, mehr Risiko: Hinweis auf Konzentration (19 gegen 100 Werte) und Einzelwerte (MSTR, PLTR, …), nicht auf einen besseren Faktor.
5. French (Big-High, wertgewichtet, vor Kosten) liegt **auf Marktniveau** (A +117,8 gegen +115,1 %; B +82,5 gegen +82,1 %). Hi-PRIOR-Dezil wertgewichtet: A +138, B +138 %, aber B ohne die Monate 04+05/2026: +50 %. Gleichgewichtetes Dezil B: +22,5 %.
6. **Auffällig und ungeklärt:** unser „breiter Markt" in A (+231 %, nach Kosten) liegt weit über jeder investierbaren und jeder French-Reihe (höchstens +153 %). Gegenprobe 2017–2021 ohne zweite Kursquelle und ohne Sprung-Durchsicht (Belegstand) → zuerst prüfen.
7. Literatur: Anomalie-Renditen sinken nach Publikation im Mittel um 58 % (26 % davon schon außerhalb der Stichprobe), Momentum-Einzelwert nicht gelesen. US-Aktienfonds liefern ~7 % p. a. weniger als Papier-Momentum (Patton/Weller). QMOM seit 2015: 10,6 % p. a. gegen 13,7 % für den Vergleichsindex (Anbieterbericht).
8. Was die Literatur **nicht** beantwortet: Nettoeffekt von 11-1, ~20 Großwerten, vierteljährlich, long-only; 20 Werte gegen Dezil; Überlebensverzerrung. Alles **offen**.
9. Tragende Erklärungen in dieser Reihenfolge: Schub (2020; 2024/25) und Konzentration, dann Fensterwahl; Kosten (20 Bp) und Überlebensverzerrung sind **nicht** gemessen worden.
10. Grenzen: zwei Fenster, kein Test (keine MDE, kein Cluster-t), Yahoo-adjclose nicht gegen Factsheets geprüft, French nur bis 08/2026.

## 1. Vergleich der Gesamterträge (A: 04.01.2017–15.09.2021, B: 16.09.2021–15.09.2026)

Alle Prozent = Gesamtertrag mit Ausschüttungen; max. Rückschlag in Klammern. Rohdaten: `momentum-realitaet/04-vergleich.csv`/`.json`.

| Reihe | A | B |
|---|---|---|
| **Unser Korb 187** (19 Positionen, nach 20 Bp je Seite) | +159,2 % (−49,0) | +150,1 % (−56,9) |
| Unser breiter Markt (~700) | +231,2 % | +64,0 % |
| SPY (unsere Quelle) | +115,5 % (−33,8) | +81,2 % (−24,5) |
| SPY (Yahoo adjclose, Gegenprobe) | +115,8 % (−33,7) | +80,9 % (−24,5) |
| SPMO | +144,9 % (−31,0) | +141,0 % (−22,7) |
| MTUM | +152,3 % (−34,1) | +74,1 % (−32,3) |
| QMOM | +110,6 % (−39,1) | +45,4 % (−26,8) |
| PDP | +123,9 % (−34,7) | +41,7 % (−33,9) |
| iShares USA Momentum UCITS (USD-Listing) | +145,3 % (−33,8) | +68,4 % (−31,9) |
| iShares USA Momentum UCITS (EUR, Xetra) | +116,8 % (−33,3) | +72,3 % (−25,6) |
| iShares / Xtrackers World Momentum (USD) | +133,8 / +136,7 % | +72,4 / +72,3 % |
| SPY in EUR (Näherung) | +91,0 % | +85,4 % |
| French Big-High, wertgew. (Monatsenden, vor Kosten)* | +117,8 % (−18,3) | +82,5 % (−24,1) |
| French Hi PRIOR, wertgew.* | +138,0 % (−21,9) | +137,6 % (−31,2) |
| French Hi PRIOR, gleichgew.* | +153,5 % (−30,0) | +22,5 % (−32,0) |
| French Markt (Mkt-RF+RF)* | +115,1 % (−20,2) | +82,1 % (−24,8) |

\*Monatsdaten, Fenster 01/2017–09/2021 und 10/2021–**08/2026** (September fehlt); Rückschlag nur auf Monatsenden, daher nicht mit den Tageswerten vergleichbar. Hi PRIOR enthält ~330–460 Firmen, Big-High ~220–300 – nicht ~19.

Die Fenster stimmen: SPY weicht zwischen unserer Quelle und Yahoo um 0,3 Pp ab.

### Empfindlichkeit von French B (eigene Nachrechnung aus `02-french-monatsrenditen.csv`)

| Reihe | B bis 08/2026 | B ohne 04+05/2026 | B bis 12/2025 | 2026 (Jan–Aug) |
|---|---|---|---|---|
| Hi PRIOR wertgew. | +137,6 % | +50,3 % | +71,1 % | +38,8 % |
| Big-High wertgew. | +82,5 % | +44,5 % | +53,3 % | +19,0 % |
| Hi PRIOR gleichgew. | +22,5 % | +3,4 % | +10,4 % | +11,0 % |
| Markt | +82,1 % | +57,0 % | +61,5 % | +12,7 % |

Zwei Monate (Hi PRIOR wertgew. +31,7 % im April, +20,0 % im Mai 2026) tragen mehr als die Hälfte des Ergebnisses. Die Annual-Tabelle der Datei zeigt für 2026 Hi PRIOR +247 %; die Monatswerte verketten sich nur zu +38,8 %. Diese Abweichung ist **ungeklärt**; vorläufige CRSP-Monate können revidiert werden. Der Juli 2026 (−15,4 % im Dezil) passt zu dem Momentum-Einbruch, den die Presse meldet (s. 3).

## 2. Passen unsere Zahlen?

| Frage | Befund | Gewicht |
|---|---|---|
| Liegt der Korb 187 im Rahmen investierbarer Produkte? | Ja in der Höhe (A zwischen MTUM und SPMO; B nahe SPMO). | Beschreibend |
| Ist „Momentum schlägt SPY" bei investierbaren Produkten der Regelfall? | A: ja bei MTUM, SPMO, IUMO; B: nur SPMO. QMOM und PDP in B weit zurück. Im Mittel der Fonds kein klarer Vorsprung. | Zwei Fenster, korrelierte Fonds, kein Test |
| Ist der Korb im Risiko vergleichbar? | Nein: Rückschlag −49/−57 % gegen −23 bis −39 % der Fonds. Größte Gewichte 20–23 % (Belegstand). | Aus Belegstand und Fondsdaten |
| Passt der breite Markt in A (+231 %)? | **Nein.** Mehr als jeder Fonds (max. +152) und jede French-Reihe (max. +153) bei einem Universum, das dem Hi-PRIOR-Dezil ähnlich sein soll. | Ungeklärt, prüfen |
| Passt der breite Markt in B (+64 %)? | Zwischen French gleichgewichtet (+22,5) und wertgewichtet (+138). Unser Universum (≥100 Mio $ Umsatz) schließt die Mikrowerte aus, die das EW-Dezil enthält. | Plausibel, aber nicht belegt |

## 3. Erklärungen – was trägt, was nicht

| Erklärung | Beleg | Stand |
|---|---|---|
| **Ein Schub je Fenster** (2020; 2024/25) | Belegstand: Periode ab 07.04.2020 +40,4 Pp, ab 19.09.2024 +53,0 von +85,8 Pp. French B: ohne zwei Monate −87 Pp im Hi-PRIOR-Dezil. SPMO/MTUM-Lücke in B zeigt, dass die Konstruktion zählt. | **trägt** |
| **Konzentration / Einzelwerte** | Rückschlag; MSTR, NVDA, PLTR, SMCI, CVNA, APP, HOOD am längsten im Buch (Belegstand). Literatur zu 20 Werten gegen Dezil: nur Anbieterblog, vor Kosten, Studienbasis unbekannt (Top 50 17,36 % gegen Top 500 12,12 % CAGR). | **trägt teilweise**; Wirkung auf Rendite offen |
| **Fensterwahl** | Richtung wechselt: breit A besser als Korb, breit B schlechter. Zwei Fenster, ein 5-Jahres-Rückblick. | **trägt** |
| **Überlebensverzerrung** | Kein Beleg gefunden (nur unprüfbare Blogs). Für A gibt es keine zweite Kursquelle. | **offen**; kann den A-Breit-Wert erklären, nicht belegt |
| **Kosten** | 20 Bp je Seite sind in unseren Zahlen enthalten, French und ETF-Zahlen nicht (ETF: Kostenquote 0,13–0,62 % je Jahr, Handelskosten im Fonds-NAV). Novy-Marx/Velikov: UMD netto 0,37 %/Monat bei gestaffelt vierteljährlichem Umschichten (Long-Short, Spreads). | trägt **nicht** für den Abstand, Richtung bleibt offen |
| **Universum Großwerte** | Fama/French 2008 (vor 2015): Momentum-Spread je Monat Groß 0,66 % gegen Mikro 1,37 % (wertgewichtet). | schwächt die Erwartung, nicht gemessen |

## 4. Literatur seit 2015 (Auszug, Details in `03-literatur.md`)

| Aussage | Zahl | Quelle | gelesen |
|---|---|---|---|
| Nach Publikation niedrigere Renditen (97 Prädiktoren) | 58 % gesamt, 26 % out-of-sample, 32 % Publikationseffekt | McLean & Pontiff 2016 | Abstract |
| UMD, Handelskosten | 48,4 Bp/Monat; netto 0,37 %/Monat bei gestaffelt vierteljährlichem Umschichten (1973–2012) | Novy-Marx & Velikov 2016 | Volltext |
| Fonds gegen Papier-Momentum | −7,2 bis −7,6 % p. a.; Restprämie nicht von null verschieden | Patton & Weller 2020 | Volltext |
| Durchschnitts-Anomalie netto | 8 Bp/Monat | Chen & Velikov 2023 | Abstract |
| Crash-Risiko, Risikoskalierung | Sharpe 0,53 → 0,97 (1927–2011) | Barroso & Santa-Clara 2015 | Abstract + WP |
| QMOM seit 01.12.2015 | 10,64 % p. a. gegen 13,66 % (Index) | Anbieterbericht 09/2025 (Eigeninteresse) | Volltext |
| Momentum-Rotation Juli 2026 | schlechtester Monat eines Hochbeta-Momentum-Korbs seit 11/2000 | MarketWatch 31.07.2026 | Presse |

Hinweis: Die im Auftrag genannte Zuordnung „32 % statistisch" ist verdreht (siehe `03-literatur.md`). **Offen:** Crash-Größen 2020, 2022/23, 2025 für einen 11-1-Faktor; Momentum-Einzelzahl nach Publikation.

## 5. Offene Punkte (nächste Prüfungen)

1. A-Breit +231 % gegen alle Referenzen: zweite Kursquelle, Sprung-Durchsicht und Überlebens-Behandlung für 2017–2021 (vom Projekt selbst als nicht geprüft ausgewiesen).
2. Gegenrechnung des Korbs 187 in der Konstruktion von SPMO (100 Werte, Marktkap × Momentum) mit denselben Projektdaten: trennt „Faktor" von „Konzentration".
3. French-Monate 04–05/2026 und die Annual-Tabelle gegen eine zweite Quelle prüfen; Daily-Dateien für Tages-Rückschläge.
4. Anbieter-Factsheets gegen die Yahoo-Zahlen; Gewichtung und Takt von QMOM, PDP, XDEM, IWMO.
5. Kein Test auf Signifikanz gerechnet (MDE, Cluster-t, Testzahl) – diese Realitätsprobe ist beschreibend, kein Urteil im Sinne der Mühle.

## Quellen (alle abgerufen 04.10.2026)

- Fonds: Yahoo Finance Chart-API v8 (`query2.finance.yahoo.com/v8/finance/chart/<Ticker>`, adjclose); Anbieterseiten und Factsheets: Alpha Architect, iShares, Invesco, MSCI, S&P DJI, justETF – vollständige URLs je Fonds in `momentum-realitaet/01-momentum-fonds.md`.
- Faktordaten: Kenneth R. French Data Library, `https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/` – `6_Portfolios_ME_Prior_12_2_CSV.zip`, `10_Portfolios_Prior_12_2_CSV.zip`, `F-F_Research_Data_Factors_CSV.zip` (Last-Modified 25.09.2026, CRSP 202608); Details `momentum-realitaet/02-french.md`.
- Literatur: 20 Quellen mit URL in `momentum-realitaet/03-literatur-quellen.json` und `03-literatur.md`.
- Eigene Zahlen: `wiki/belegstand.md` (Rückblick über fünf Jahre), `studien/massstab-rueckblick-2026-10-04/`, `studien/momentum-korb-2026-10-04/`; Auftragstext vom 04.10.2026.
- Rohdaten und Skripte: `momentum-realitaet/01-*`, `02-*`, `03-*`, `04-vergleich.csv|json`.
