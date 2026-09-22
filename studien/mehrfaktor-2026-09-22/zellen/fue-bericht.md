# Faktorzelle `fue`

Erzeugt 2026-09-22T20:27:23.043Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.5 s, RSS max 1193 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** roh.fue / roh.umsatz desselben Filings (juengstes 10-K/10-Q mit filed < t, Aktualitaets-Tor 456 Tage): F&E-Aufwand durch Umsatz, gleiche qtrs, darum ohne Jahresrate; Verhaeltnis, hoeher = besser; null ohne ausgewiesenes F&E (nie 0), ohne Umsatz oder bei Umsatz <= 0; ausgewiesenes F&E = 0 ist ein Wert; nichts gekappt  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | -0.1374 | 0.7514 | -0.18 | -0.13 | 2.1050 | 92 |
| Dezil oben − Universum, **netto** | -0.1456 | 0.7514 | -0.19 | -0.14 | 2.1050 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.2123 | 0.8952 | 0.24 | - | 2.5080 | 92 |
| Long − Short, netto | 0.2061 | 0.8953 | 0.23 | - | 2.5082 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 213.3 |
| Dezil oben / unten (Mittel) | 21.5 / 21.2 |
| Dezil unten − Universum brutto / netto | -0.3496 / -0.3517 Pp |
| Umschlag Dezil / Universum je Monat | 17.5 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0158 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 11 (0) / 5 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.5984 (n 75) / 1.8519 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | 1.6377 | 1.6304 | 1.2036 | 1.41 | 3.3720 | 0.0117 (12) |  |
| 2018 | 12 | 0.8464 | 0.8401 | 0.9696 | 0.91 | 2.7164 | 0.0841 (12) |  |
| 2019 | 12 | 0.9994 | 0.9922 | 1.2978 | 0.80 | 3.6360 | 0.0505 (12) |  |
| 2020 | 12 | 3.2418 | 3.2331 | 1.6412 | 2.06 | 4.5979 | 0.0756 (12) |  |
| 2021 | 12 | -1.4441 | -1.4592 | 3.1110 | -0.49 | 8.7157 | -0.0657 (12) |  |
| 2022 | 12 | -6.2608 | -6.2712 | 2.3742 | -2.76 | 6.6516 | -0.1436 (12) |  |
| 2023 | 12 | 2.2025 | 2.1980 | 2.4003 | 0.96 | 6.7248 | 0.0530 (12) |  |
| 2024 | 8 | -3.4139 | -3.4198 | 2.0111 | -1.82 | 5.6344 | -0.0644 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto -1.5442 Pp (se 1.9297, t -0.84, MDE₈₀ 5.4064, n 12), brutto -1.5390 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0029, se 0.0209, t 0.14, MDE₈₀ 0.0587, n 92**; letzte 12 Signaltage -0.0163 (n 12); Paare je Signaltag im Mittel 213.3.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 21.3 % (1410/6615) | 34.2 % (438/1282) | 57.9 % (88/152) | 24.1 % (1936/8049) |
| 2018 | 22.2 % (1508/6797) | 34.8 % (514/1478) | 64.5 % (140/217) | 25.5 % (2162/8492) |
| 2019 | 23.3 % (1544/6615) | 38.6 % (568/1471) | 68.1 % (162/238) | 27.3 % (2274/8324) |
| 2020 | 24.2 % (1640/6766) | 40.5 % (782/1930) | 54.4 % (198/364) | 28.9 % (2620/9060) |
| 2021 | 23.9 % (1729/7231) | 39.8 % (971/2437) | 52.2 % (265/508) | 29.1 % (2965/10176) |
| 2022 | 24.1 % (1713/7111) | 38.7 % (1032/2670) | 50.5 % (263/521) | 29.2 % (3008/10302) |
| 2023 | 25.0 % (1702/6807) | 41.5 % (889/2140) | 59.9 % (179/299) | 30.0 % (2770/9246) |
| 2024 | 25.4 % (1135/4477) | 36.9 % (583/1578) | 65.7 % (174/265) | 29.9 % (1892/6320) |
| **alle** | 23.6 % | 38.5 % | 57.3 % | 28.1 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -0.1399 Pp, t -0.18, n 92; IC 0.0005 (t 0.02, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.0366 Pp, t -0.18, n 92; IC 0.0006 (se 0.0079, t 0.07) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `fue-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `fue.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

