# Faktorzelle `ertragskraft`

Erzeugt 2026-09-23T20:42:04.918Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 7.4 s, RSS max 1260 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** ((roh.umsatz - roh.umsatzkosten) * 4 / roh.qtrs) / roh.vermoegen des juengsten Filings (filed < Signaltag): Bruttogewinn des Filings auf Jahresrate durch Vermoegen D0, Verhaeltnis, hoeher = besser; null wenn umsatz/umsatzkosten/vermoegen fehlt, vermoegen <= 0 oder qtrs nicht 1/4  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.1620 | 0.2218 | 0.73 | 0.69 | 0.6213 | 116 |
| Dezil oben − Universum, **netto** | 0.1561 | 0.2217 | 0.71 | 0.66 | 0.6212 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.4737 | 0.4174 | 1.14 | - | 1.1694 | 116 |
| Long − Short, netto | 0.4740 | 0.4174 | 1.14 | - | 1.1694 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 437.3 |
| Dezil oben / unten (Mittel) | 44.0 / 43.5 |
| Dezil unten − Universum brutto / netto | -0.3118 / -0.3179 Pp |
| Umschlag Dezil / Universum je Monat | 16.0 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0136 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 7 (0) / 5 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.1064 (n 96) / 0.3943 (n 20) Pp |

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
| 2024 | 12 | 0.9800 | 0.9751 | 0.6965 | 1.46 | 1.9515 | 0.0444 (12) |  |
| 2025 | 12 | -0.9637 | -0.9674 | 0.6652 | -1.52 | 1.8636 | -0.0215 (12) |  |
| 2026 | 8 | -0.5698 | -0.5719 | 1.1941 | -0.51 | 3.3455 | 0.0113 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto -0.8239 Pp (se 0.8483, t -1.01, MDE₈₀ 2.3767, n 12), brutto -0.8212 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0253, se 0.0104, t 2.44, MDE₈₀ 0.0290, n 116**; letzte 12 Signaltage -0.0092 (n 12); Paare je Signaltag im Mittel 437.3.

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
| 2024 | 54.4 % (3633/6676) | 59.3 % (1393/2351) | 75.7 % (312/412) | 56.6 % (5338/9439) |
| 2025 | 53.1 % (3889/7327) | 60.0 % (1899/3165) | 70.5 % (482/684) | 56.1 % (6270/11176) |
| 2026 | 52.2 % (2661/5096) | 60.7 % (1604/2642) | 71.5 % (476/666) | 56.4 % (4741/8404) |
| **alle** | 52.1 % | 59.8 % | 70.4 % | 54.7 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.2626 Pp, t 1.22, n 116; IC 0.0334 (t 3.30, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2211 Pp, t -1.60, n 116; IC -0.0035 (se 0.0043, t -0.83) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 92668 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `ertragskraft-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `ertragskraft.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

