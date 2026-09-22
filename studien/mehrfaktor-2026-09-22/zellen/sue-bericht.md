# Faktorzelle `sue`

Erzeugt 2026-09-22T20:27:17.249Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.6 s, RSS max 1171 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** (quartale.netto[0] − quartale.netto[4]) / sd(quartale.netto[0…7], Stichproben-sd n−1) des jüngsten 10-K/10-Q mit filed strikt vor dem Signaltag (Tor 456 Tage); Verhältnis (standardisierte Gewinnüberraschung), höher = besser; null bei fehlendem Filing, fehlendem Quartal oder sd = 0  
**Quellen:** Fundamentaltafel fundamentaltafel-2026-09-16/v1 (quartale.netto D0…D7, wege.netto, über sicht.fundamentalAm); Panel querschnitt-pruefstand-2026-09-13/panel/v2 (nur sicht.zeileAm: Zeile am Signaltag vorhanden)

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.1723 | 0.1695 | 1.02 | 1.04 | 0.4748 | 92 |
| Dezil oben − Universum, **netto** | 0.1502 | 0.1696 | 0.89 | 0.91 | 0.4752 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.2451 | 0.3588 | 0.69 | - | 1.0052 | 92 |
| Long − Short, netto | 0.2456 | 0.3588 | 0.69 | - | 1.0051 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 624.9 |
| Dezil oben / unten (Mittel) | 63.0 / 62.0 |
| Dezil unten − Universum brutto / netto | -0.0729 / -0.0954 Pp |
| Umschlag Dezil / Universum je Monat | 36.5 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0296 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 14 (0) / 6 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.0771 (n 75) / 0.4726 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.2679 | 0.2475 | 0.3812 | 0.68 | 1.0679 | 0.0250 (12) |  |
| 2018 | 12 | -0.4793 | -0.5033 | 0.3100 | -1.70 | 0.8686 | -0.0124 (12) |  |
| 2019 | 12 | 0.2748 | 0.2493 | 0.3579 | 0.73 | 1.0026 | -0.0039 (12) |  |
| 2020 | 12 | -0.0066 | -0.0282 | 0.5876 | -0.05 | 1.6463 | -0.0041 (12) |  |
| 2021 | 12 | -0.1781 | -0.2035 | 0.4882 | -0.44 | 1.3678 | 0.0302 (12) |  |
| 2022 | 12 | 0.0648 | 0.0439 | 0.5673 | 0.08 | 1.5894 | 0.0222 (12) |  |
| 2023 | 12 | 0.8012 | 0.7811 | 0.4592 | 1.78 | 1.2864 | -0.0011 (12) |  |
| 2024 | 8 | 0.8640 | 0.8467 | 0.7155 | 1.27 | 2.0046 | 0.0427 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.8764 Pp (se 0.4951, t 1.85, MDE₈₀ 1.3871, n 12), brutto 0.8951 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0110, se 0.0096, t 1.14, MDE₈₀ 0.0270, n 92**; letzte 12 Signaltage 0.0280 (n 12); Paare je Signaltag im Mittel 624.9.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 76.1 % (5034/6615) | 83.8 % (1074/1282) | 93.4 % (142/152) | 77.6 % (6250/8049) |
| 2018 | 79.8 % (5426/6797) | 86.9 % (1284/1478) | 93.1 % (202/217) | 81.4 % (6912/8492) |
| 2019 | 81.5 % (5390/6615) | 89.1 % (1311/1471) | 92.4 % (220/238) | 83.1 % (6921/8324) |
| 2020 | 80.7 % (5457/6766) | 86.4 % (1668/1930) | 89.8 % (327/364) | 82.3 % (7452/9060) |
| 2021 | 79.1 % (5717/7231) | 86.6 % (2111/2437) | 86.4 % (439/508) | 81.2 % (8267/10176) |
| 2022 | 80.0 % (5692/7111) | 89.4 % (2387/2670) | 86.6 % (451/521) | 82.8 % (8530/10302) |
| 2023 | 81.8 % (5565/6807) | 91.4 % (1957/2140) | 90.6 % (271/299) | 84.3 % (7793/9246) |
| 2024 | 82.2 % (3680/4477) | 91.4 % (1443/1578) | 90.6 % (240/265) | 84.9 % (5363/6320) |
| **alle** | 80.0 % | 88.3 % | 89.4 % | 82.2 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.6169 Pp, t 3.67, n 92; IC 0.0358 (t 3.51, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1021 Pp, t -0.86, n 92; IC -0.0044 (se 0.0038, t -1.15) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `sue-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `sue.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

