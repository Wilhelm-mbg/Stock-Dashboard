# Faktorzelle `ertragskraft`

Erzeugt 2026-09-22T20:26:59.566Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.7 s, RSS max 1187 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** ((roh.umsatz - roh.umsatzkosten) * 4 / roh.qtrs) / roh.vermoegen des juengsten Filings (filed < Signaltag): Bruttogewinn des Filings auf Jahresrate durch Vermoegen D0, Verhaeltnis, hoeher = besser; null wenn umsatz/umsatzkosten/vermoegen fehlt, vermoegen <= 0 oder qtrs nicht 1/4  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.3010 | 0.2396 | 1.26 | 1.24 | 0.6712 | 92 |
| Dezil oben − Universum, **netto** | 0.2944 | 0.2395 | 1.24 | 1.21 | 0.6711 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.8136 | 0.4453 | 1.84 | - | 1.2475 | 92 |
| Long − Short, netto | 0.8137 | 0.4453 | 1.84 | - | 1.2474 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 412.3 |
| Dezil oben / unten (Mittel) | 41.5 / 41.0 |
| Dezil unten − Universum brutto / netto | -0.5127 / -0.5193 Pp |
| Umschlag Dezil / Universum je Monat | 16.4 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0141 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 6 (0) / 5 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.3390 (n 75) / 0.0975 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.4723 | 0.4677 | 0.5673 | 0.86 | 1.5894 | 0.0480 (12) |  |
| 2018 | 12 | 0.1344 | 0.1293 | 0.5223 | 0.26 | 1.4634 | 0.0703 (12) |  |
| 2019 | 12 | 0.3099 | 0.3028 | 0.6386 | 0.50 | 1.7890 | 0.0384 (12) |  |
| 2020 | 12 | 0.8714 | 0.8638 | 0.9027 | 1.00 | 2.5289 | 0.0242 (12) |  |
| 2021 | 12 | 0.1419 | 0.1347 | 0.7413 | 0.19 | 2.0768 | 0.0223 (12) |  |
| 2022 | 12 | -0.4417 | -0.4490 | 0.7806 | -0.60 | 2.1868 | -0.0232 (12) |  |
| 2023 | 12 | 0.4411 | 0.4330 | 0.3951 | 1.14 | 1.1068 | 0.0342 (12) |  |
| 2024 | 8 | 0.5671 | 0.5623 | 0.9877 | 0.61 | 2.7671 | 0.0246 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.6209 Pp (se 0.6525, t 0.99, MDE₈₀ 1.8279, n 12), brutto 0.6270 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0301, se 0.0117, t 2.58, MDE₈₀ 0.0327, n 92**; letzte 12 Signaltage 0.0313 (n 12); Paare je Signaltag im Mittel 412.3.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 48.3 % (3198/6615) | 60.0 % (769/1282) | 68.4 % (104/152) | 50.6 % (4071/8049) |
| 2018 | 50.1 % (3407/6797) | 59.1 % (873/1478) | 73.7 % (160/217) | 52.3 % (4440/8492) |
| 2019 | 52.6 % (3478/6615) | 58.7 % (864/1471) | 76.5 % (182/238) | 54.3 % (4524/8324) |
| 2020 | 53.4 % (3612/6766) | 61.1 % (1179/1930) | 67.3 % (245/364) | 55.6 % (5036/9060) |
| 2021 | 51.7 % (3738/7231) | 59.7 % (1456/2437) | 64.6 % (328/508) | 54.3 % (5522/10176) |
| 2022 | 51.7 % (3678/7111) | 59.1 % (1577/2670) | 67.6 % (352/521) | 54.4 % (5607/10302) |
| 2023 | 53.9 % (3667/6807) | 60.4 % (1293/2140) | 72.2 % (216/299) | 56.0 % (5176/9246) |
| 2024 | 54.0 % (2417/4477) | 59.5 % (939/1578) | 77.0 % (204/265) | 56.3 % (3560/6320) |
| **alle** | 51.9 % | 59.7 % | 69.9 % | 54.2 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.4018 Pp, t 1.76, n 92; IC 0.0390 (t 3.44, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2559 Pp, t -1.69, n 92; IC -0.0026 (se 0.0049, t -0.54) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `ertragskraft-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `ertragskraft.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

