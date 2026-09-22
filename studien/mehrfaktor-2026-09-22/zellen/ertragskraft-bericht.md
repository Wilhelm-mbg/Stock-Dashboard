# Faktorzelle `ertragskraft`

Erzeugt 2026-09-22T13:32:03.946Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 4.6 s, RSS max 1180 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** ((roh.umsatz - roh.umsatzkosten) * 4 / roh.qtrs) / roh.vermoegen des juengsten Filings (filed < Signaltag): Bruttogewinn des Filings auf Jahresrate durch Vermoegen D0, Verhaeltnis, hoeher = besser; null wenn umsatz/umsatzkosten/vermoegen fehlt, vermoegen <= 0 oder qtrs nicht 1/4  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.3019 | 0.2403 | 1.26 | 1.24 | 0.6732 | 92 |
| Dezil oben − Universum, **netto** | 0.2954 | 0.2403 | 1.24 | 1.21 | 0.6731 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.8503 | 0.4494 | 1.90 | - | 1.2592 | 92 |
| Long − Short, netto | 0.8505 | 0.4494 | 1.90 | - | 1.2591 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 412.8 |
| Dezil oben / unten (Mittel) | 41.5 / 41.1 |
| Dezil unten − Universum brutto / netto | -0.5484 / -0.5551 Pp |
| Umschlag Dezil / Universum je Monat | 16.4 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0140 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 7 (0) / 5 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.3372 (n 75) / 0.1110 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.4504 | 0.4462 | 0.5662 | 0.82 | 1.5862 |  |
| 2018 | 12 | 0.1596 | 0.1547 | 0.5391 | 0.30 | 1.5103 |  |
| 2019 | 12 | 0.3099 | 0.3028 | 0.6386 | 0.50 | 1.7890 |  |
| 2020 | 12 | 0.8714 | 0.8638 | 0.9027 | 1.00 | 2.5289 |  |
| 2021 | 12 | 0.1267 | 0.1194 | 0.7518 | 0.17 | 2.1061 |  |
| 2022 | 12 | -0.4224 | -0.4299 | 0.7764 | -0.58 | 2.1751 |  |
| 2023 | 12 | 0.4411 | 0.4330 | 0.3951 | 1.14 | 1.1068 |  |
| 2024 | 8 | 0.5671 | 0.5623 | 0.9877 | 0.61 | 2.7671 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.6209 Pp (se 0.6525, t 0.99, MDE₈₀ 1.8279, n 12), brutto 0.6270 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 48.5 % (3208/6615) | 60.0 % (769/1282) | 68.4 % (104/152) | 50.7 % (4081/8049) |
| 2018 | 50.2 % (3412/6797) | 59.3 % (877/1478) | 73.7 % (160/217) | 52.4 % (4449/8492) |
| 2019 | 52.6 % (3481/6615) | 59.1 % (869/1471) | 76.5 % (182/238) | 54.4 % (4532/8324) |
| 2020 | 53.4 % (3615/6766) | 61.1 % (1179/1930) | 67.3 % (245/364) | 55.6 % (5039/9060) |
| 2021 | 51.7 % (3740/7231) | 59.7 % (1456/2437) | 64.6 % (328/508) | 54.3 % (5524/10176) |
| 2022 | 51.8 % (3683/7111) | 59.1 % (1578/2670) | 67.6 % (352/521) | 54.5 % (5613/10302) |
| 2023 | 53.9 % (3670/6807) | 60.4 % (1293/2140) | 72.2 % (216/299) | 56.0 % (5179/9246) |
| 2024 | 54.0 % (2417/4477) | 59.5 % (939/1578) | 77.0 % (204/265) | 56.3 % (3560/6320) |
| **alle** | 51.9 % | 59.8 % | 69.9 % | 54.3 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.4012 Pp, t 1.76, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2560 Pp, t -1.69, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `ertragskraft-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `ertragskraft.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

