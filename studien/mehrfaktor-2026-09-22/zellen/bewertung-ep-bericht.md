# Faktorzelle `bewertung-ep`

Erzeugt 2026-09-22T20:26:53.563Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.6 s, RSS max 1171 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** E/P = summe4q.netto (Nettoergebnis der vier Quartale D0..D3 des juengsten 10-K/10-Q mit filed < t, Tor 456 Tage; null wenn ein Quartal fehlt) / (roh.aktien desselben Filings x rohSchluss(t), unbereinigt); Verhaeltnis, hoeher = besser; negatives Netto ist ein Wert; nachrichtlich, nicht gewichtet  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | -0.0715 | 0.2980 | -0.24 | -0.24 | 0.8348 | 92 |
| Dezil oben − Universum, **netto** | -0.0803 | 0.2980 | -0.27 | -0.27 | 0.8350 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.1894 | 0.5418 | -0.35 | - | 1.5180 | 92 |
| Long − Short, netto | -0.1909 | 0.5419 | -0.35 | - | 1.5182 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 576.6 |
| Dezil oben / unten (Mittel) | 58.0 / 57.3 |
| Dezil unten − Universum brutto / netto | 0.1179 / 0.1106 Pp |
| Umschlag Dezil / Universum je Monat | 19.0 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0163 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 8 (0) / 10 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.2214 (n 75) / 0.5422 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.5045 | -0.5105 | 0.5163 | -1.03 | 1.4463 | 0.0244 (12) |  |
| 2018 | 12 | -0.4793 | -0.4878 | 0.4161 | -1.22 | 1.1658 | -0.0489 (12) |  |
| 2019 | 12 | -0.4421 | -0.4528 | 0.8210 | -0.58 | 2.3002 | -0.0333 (12) |  |
| 2020 | 12 | -1.1326 | -1.1437 | 1.4580 | -0.82 | 4.0848 | -0.0791 (12) |  |
| 2021 | 12 | 0.9905 | 0.9804 | 0.7097 | 1.44 | 1.9882 | 0.0671 (12) |  |
| 2022 | 12 | 0.0892 | 0.0797 | 0.9199 | 0.09 | 2.5771 | 0.0907 (12) |  |
| 2023 | 12 | 0.5922 | 0.5868 | 0.6946 | 0.88 | 1.9459 | -0.0091 (12) |  |
| 2024 | 8 | 0.5082 | 0.4986 | 0.7667 | 0.70 | 2.1481 | 0.0464 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.2610 Pp (se 0.5963, t 0.46, MDE₈₀ 1.6705, n 12), brutto 0.2692 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0056, se 0.0155, t 0.36, MDE₈₀ 0.0435, n 92**; letzte 12 Signaltage 0.0288 (n 12); Paare je Signaltag im Mittel 576.6.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 70.1 % (4636/6615) | 74.8 % (959/1282) | 93.4 % (142/152) | 71.3 % (5737/8049) |
| 2018 | 73.0 % (4962/6797) | 76.3 % (1128/1478) | 92.2 % (200/217) | 74.1 % (6290/8492) |
| 2019 | 74.3 % (4917/6615) | 79.2 % (1165/1471) | 88.7 % (211/238) | 75.6 % (6293/8324) |
| 2020 | 73.6 % (4978/6766) | 77.1 % (1488/1930) | 81.9 % (298/364) | 74.7 % (6764/9060) |
| 2021 | 73.6 % (5320/7231) | 76.3 % (1860/2437) | 83.3 % (423/508) | 74.7 % (7603/10176) |
| 2022 | 75.2 % (5344/7111) | 83.7 % (2235/2670) | 80.4 % (419/521) | 77.6 % (7998/10302) |
| 2023 | 76.9 % (5233/6807) | 86.2 % (1844/2140) | 82.6 % (247/299) | 79.2 % (7324/9246) |
| 2024 | 77.7 % (3479/4477) | 85.0 % (1342/1578) | 83.4 % (221/265) | 79.8 % (5042/6320) |
| **alle** | 74.2 % | 80.2 % | 84.3 % | 75.8 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -1.2555 Pp, t -3.92, n 92; IC -0.0400 (t -2.49, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.0782 Pp, t -0.64, n 92; IC 0.0065 (se 0.0044, t 1.47) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `bewertung-ep-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `bewertung-ep.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

