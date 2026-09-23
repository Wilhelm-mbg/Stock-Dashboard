# Faktorzelle `fue`

Erzeugt 2026-09-23T20:42:35.826Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 7.3 s, RSS max 1273 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** roh.fue / roh.umsatz desselben Filings (juengstes 10-K/10-Q mit filed < t, Aktualitaets-Tor 456 Tage): F&E-Aufwand durch Umsatz, gleiche qtrs, darum ohne Jahresrate; Verhaeltnis, hoeher = besser; null ohne ausgewiesenes F&E (nie 0), ohne Umsatz oder bei Umsatz <= 0; ausgewiesenes F&E = 0 ist ein Wert; nichts gekappt  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.3752 | 0.6885 | 0.55 | 0.63 | 1.9288 | 116 |
| Dezil oben − Universum, **netto** | 0.3671 | 0.6884 | 0.54 | 0.62 | 1.9287 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.6606 | 0.8172 | 0.81 | - | 2.2895 | 116 |
| Long − Short, netto | 0.6547 | 0.8172 | 0.80 | - | 2.2895 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 229.3 |
| Dezil oben / unten (Mittel) | 23.1 / 22.8 |
| Dezil unten − Universum brutto / netto | -0.2854 / -0.2875 Pp |
| Umschlag Dezil / Universum je Monat | 17.6 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0158 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 17 (0) / 5 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.1006 (n 96) / 2.6121 (n 20) Pp |

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
| 2024 | 12 | 0.0652 | 0.0569 | 2.3904 | 0.02 | 6.6969 | 0.0030 (12) |  |
| 2025 | 12 | 1.4585 | 1.4532 | 2.0171 | 0.75 | 5.6511 | -0.0139 (12) |  |
| 2026 | 8 | 1.3210 | 1.3132 | 3.2704 | 0.43 | 9.1625 | -0.0101 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto 1.5191 Pp (se 2.4536, t 0.65, MDE₈₀ 6.8741, n 12), brutto 1.5261 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0049, se 0.0182, t 0.27, MDE₈₀ 0.0510, n 116**; letzte 12 Signaltage -0.0107 (n 12); Paare je Signaltag im Mittel 229.3.

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
| 2024 | 25.6 % (1711/6676) | 36.5 % (858/2351) | 65.0 % (268/412) | 30.1 % (2837/9439) |
| 2025 | 26.2 % (1922/7327) | 33.1 % (1048/3165) | 62.4 % (427/684) | 30.4 % (3397/11176) |
| 2026 | 26.7 % (1362/5096) | 31.8 % (840/2642) | 64.3 % (428/666) | 31.3 % (2630/8404) |
| **alle** | 24.2 % | 36.8 % | 59.5 % | 28.7 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.3585 Pp, t 0.51, n 116; IC 0.0029 (t 0.16, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1236 Pp, t -0.69, n 116; IC -0.0015 (se 0.0066, t -0.22) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 92668 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `fue-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `fue.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

