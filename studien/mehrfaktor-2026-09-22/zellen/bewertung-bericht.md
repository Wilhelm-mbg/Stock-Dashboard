# Faktorzelle `bewertung`

Erzeugt 2026-09-22T13:31:00.927Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 4.6 s, RSS max 1127 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** B/M = roh.eigenkapital (Bestand D0 des juengsten 10-K/10-Q mit filed < t, Tor 456 Tage) / (roh.aktien desselben Filings x rohSchluss(t), unbereinigt); Verhaeltnis, hoeher = billiger = besser; negatives Eigenkapital ist ein Wert; null bei fehlender Groesse, aktien <= 0 oder rohSchluss <= 0  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | -0.1938 | 0.3716 | -0.52 | -0.52 | 1.0410 | 92 |
| Dezil oben − Universum, **netto** | -0.1992 | 0.3716 | -0.54 | -0.53 | 1.0412 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.6659 | 0.5361 | -1.25 | - | 1.5020 | 92 |
| Long − Short, netto | -0.6660 | 0.5361 | -1.25 | - | 1.5020 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 596.2 |
| Dezil oben / unten (Mittel) | 59.9 / 59.2 |
| Dezil unten − Universum brutto / netto | 0.4721 / 0.4668 Pp |
| Umschlag Dezil / Universum je Monat | 14.4 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0129 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 17 (1) / 10 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.3956 (n 75) / 0.6674 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | -1.0218 | -1.0267 | 0.8984 | -1.19 | 2.5168 |  |
| 2018 | 12 | -0.7818 | -0.7873 | 0.5675 | -1.45 | 1.5900 |  |
| 2019 | 12 | -0.9662 | -0.9714 | 0.8083 | -1.26 | 2.2645 |  |
| 2020 | 12 | -0.3873 | -0.3933 | 1.9508 | -0.21 | 5.4654 |  |
| 2021 | 12 | 1.4270 | 1.4234 | 1.1442 | 1.30 | 3.2057 |  |
| 2022 | 12 | 0.2077 | 0.2017 | 0.6916 | 0.30 | 1.9375 |  |
| 2023 | 12 | 0.5757 | 0.5694 | 0.7535 | 0.79 | 2.1111 |  |
| 2024 | 8 | -0.8084 | -0.8138 | 0.8872 | -0.98 | 2.4857 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto -0.0690 Pp (se 0.7252, t -0.10, MDE₈₀ 2.0317, n 12), brutto -0.0634 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 75.4 % (4990/6615) | 81.5 % (1045/1282) | 93.4 % (142/152) | 76.7 % (6177/8049) |
| 2018 | 75.5 % (5131/6797) | 79.6 % (1176/1478) | 92.2 % (200/217) | 76.6 % (6507/8492) |
| 2019 | 76.0 % (5028/6615) | 82.1 % (1208/1471) | 89.5 % (213/238) | 77.5 % (6449/8324) |
| 2020 | 75.7 % (5123/6766) | 81.4 % (1571/1930) | 83.2 % (303/364) | 77.2 % (6997/9060) |
| 2021 | 75.6 % (5469/7231) | 79.4 % (1935/2437) | 84.1 % (427/508) | 77.0 % (7831/10176) |
| 2022 | 77.2 % (5492/7111) | 85.7 % (2288/2670) | 83.9 % (437/521) | 79.8 % (8217/10302) |
| 2023 | 79.1 % (5386/6807) | 88.2 % (1888/2140) | 83.6 % (250/299) | 81.4 % (7524/9246) |
| 2024 | 79.6 % (3563/4477) | 85.9 % (1356/1578) | 86.0 % (228/265) | 81.4 % (5147/6320) |
| **alle** | 76.7 % | 83.2 % | 85.8 % | 78.4 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -1.6699 Pp, t -4.41, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2341 Pp, t -2.08, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `bewertung-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `bewertung.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

