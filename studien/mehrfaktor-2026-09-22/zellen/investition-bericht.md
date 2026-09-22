# Faktorzelle `investition`

Erzeugt 2026-09-22T20:27:11.402Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.6 s, RSS max 1171 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** -100 * (roh.vermoegen / vermoegenVor - 1) in Pp: Vermoegenswachstum ueber vier Quartale (Assets am Stichtag D0 gegen Assets am Stichtag D4 = vier Quartale davor, Zeilenfeld vermoegenVor) aus dem juengsten 10-K/10-Q mit filed vor dem Signaltag, gedreht - hoeher = weniger Vermoegenswachstum = besser; null, wenn Filing fehlt oder ein Bestand fehlt oder <= 0 ist  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.1410 | 0.2599 | 0.55 | 0.39 | 0.7283 | 92 |
| Dezil oben − Universum, **netto** | 0.1309 | 0.2600 | 0.51 | 0.35 | 0.7285 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.1143 | 0.5392 | -0.21 | - | 1.5107 | 92 |
| Long − Short, netto | -0.1153 | 0.5393 | -0.21 | - | 1.5108 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 633.9 |
| Dezil oben / unten (Mittel) | 63.8 / 62.9 |
| Dezil unten − Universum brutto / netto | 0.2552 / 0.2462 Pp |
| Umschlag Dezil / Universum je Monat | 20.2 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0175 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 18 (1) / 11 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.0154 (n 75) / 0.6406 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.3689 | -0.3794 | 0.5884 | -0.67 | 1.6485 | -0.0579 (12) |  |
| 2018 | 12 | -0.0798 | -0.0892 | 0.4154 | -0.22 | 1.1637 | -0.0358 (12) |  |
| 2019 | 12 | -0.2081 | -0.2156 | 0.4070 | -0.55 | 1.1403 | -0.0392 (12) |  |
| 2020 | 12 | -0.1256 | -0.1382 | 0.7940 | -0.18 | 2.2245 | -0.0789 (12) |  |
| 2021 | 12 | 2.1052 | 2.0963 | 1.2724 | 1.72 | 3.5647 | 0.0576 (12) |  |
| 2022 | 12 | 0.4071 | 0.3970 | 0.6170 | 0.67 | 1.7286 | 0.0926 (12) |  |
| 2023 | 12 | -0.1508 | -0.1617 | 0.6830 | -0.25 | 1.9135 | -0.0214 (12) |  |
| 2024 | 8 | -0.7475 | -0.7581 | 0.3375 | -2.40 | 0.9457 | -0.0181 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto -0.3602 Pp (se 0.5098, t -0.74, MDE₈₀ 1.4281, n 12), brutto -0.3489 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel -0.0124, se 0.0135, t -0.92, MDE₈₀ 0.0378, n 92**; letzte 12 Signaltage -0.0144 (n 12); Paare je Signaltag im Mittel 633.9.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 78.8 % (5214/6615) | 88.2 % (1131/1282) | 93.4 % (142/152) | 80.6 % (6487/8049) |
| 2018 | 81.0 % (5507/6797) | 88.0 % (1301/1478) | 93.1 % (202/217) | 82.5 % (7010/8492) |
| 2019 | 81.9 % (5419/6615) | 90.3 % (1329/1471) | 92.4 % (220/238) | 83.7 % (6968/8324) |
| 2020 | 81.2 % (5493/6766) | 89.9 % (1735/1930) | 90.7 % (330/364) | 83.4 % (7558/9060) |
| 2021 | 79.7 % (5766/7231) | 88.6 % (2158/2437) | 87.2 % (443/508) | 82.2 % (8367/10176) |
| 2022 | 80.5 % (5724/7111) | 90.8 % (2425/2670) | 90.4 % (471/521) | 83.7 % (8620/10302) |
| 2023 | 82.5 % (5616/6807) | 93.0 % (1990/2140) | 91.6 % (274/299) | 85.2 % (7880/9246) |
| 2024 | 83.4 % (3733/4477) | 92.3 % (1456/1578) | 92.1 % (244/265) | 86.0 % (5433/6320) |
| **alle** | 81.0 % | 90.3 % | 90.7 % | 83.4 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.0440 Pp, t 0.18, n 92; IC -0.0133 (t -1.02, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1154 Pp, t -0.93, n 92; IC 0.0043 (se 0.0038, t 1.12) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `investition-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `investition.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

