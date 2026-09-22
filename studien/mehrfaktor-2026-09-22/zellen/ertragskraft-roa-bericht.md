# Faktorzelle `ertragskraft-roa`

Erzeugt 2026-09-22T20:27:05.503Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.6 s, RSS max 1187 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** abgeleitet.roa des juengsten Filings (filed < Signaltag) = summe4q.netto / roh.vermoegen D0, von der Tafel gebildet; Verhaeltnis, hoeher = besser; null wenn nicht ausgewiesen. Nachrichtlich, nicht gewichtet  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.2054 | 0.2308 | 0.89 | 0.90 | 0.6466 | 92 |
| Dezil oben − Universum, **netto** | 0.2012 | 0.2308 | 0.88 | 0.89 | 0.6466 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.0779 | 0.6798 | -0.12 | - | 1.9045 | 92 |
| Long − Short, netto | -0.0753 | 0.6798 | -0.11 | - | 1.9044 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 625.5 |
| Dezil oben / unten (Mittel) | 63.0 / 62.1 |
| Dezil unten − Universum brutto / netto | 0.2832 / 0.2765 Pp |
| Umschlag Dezil / Universum je Monat | 14.0 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0116 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 7 (0) / 8 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.3163 (n 75) / -0.3062 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.4450 | 0.4422 | 0.3204 | 1.44 | 0.8976 | 0.0672 (12) |  |
| 2018 | 12 | 0.2752 | 0.2708 | 0.3472 | 0.81 | 0.9726 | 0.0265 (12) |  |
| 2019 | 12 | 0.4982 | 0.4945 | 0.2708 | 1.91 | 0.7587 | 0.0112 (12) |  |
| 2020 | 12 | 0.1037 | 0.0994 | 1.0275 | 0.10 | 2.8786 | -0.0142 (12) |  |
| 2021 | 12 | 0.0276 | 0.0239 | 0.9459 | 0.03 | 2.6500 | 0.0556 (12) |  |
| 2022 | 12 | -0.7626 | -0.7670 | 0.6948 | -1.15 | 1.9466 | 0.0503 (12) |  |
| 2023 | 12 | 0.7909 | 0.7860 | 0.5261 | 1.56 | 1.4738 | 0.0149 (12) |  |
| 2024 | 8 | 0.2949 | 0.2895 | 0.7480 | 0.41 | 2.0956 | 0.0306 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.0358 Pp (se 0.5705, t 0.07, MDE₈₀ 1.5982, n 12), brutto 0.0416 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0303, se 0.0135, t 2.24, MDE₈₀ 0.0379, n 92**; letzte 12 Signaltage 0.0078 (n 12); Paare je Signaltag im Mittel 625.5.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 76.3 % (5044/6615) | 83.8 % (1074/1282) | 93.4 % (142/152) | 77.8 % (6260/8049) |
| 2018 | 79.9 % (5433/6797) | 86.9 % (1284/1478) | 93.1 % (202/217) | 81.5 % (6919/8492) |
| 2019 | 81.6 % (5399/6615) | 89.1 % (1311/1471) | 92.4 % (220/238) | 83.3 % (6930/8324) |
| 2020 | 80.7 % (5457/6766) | 86.4 % (1668/1930) | 89.8 % (327/364) | 82.3 % (7452/9060) |
| 2021 | 79.4 % (5741/7231) | 86.9 % (2117/2437) | 86.6 % (440/508) | 81.5 % (8298/10176) |
| 2022 | 80.0 % (5690/7111) | 89.7 % (2396/2670) | 87.1 % (454/521) | 82.9 % (8540/10302) |
| 2023 | 81.6 % (5557/6807) | 91.4 % (1957/2140) | 90.6 % (271/299) | 84.2 % (7785/9246) |
| 2024 | 82.3 % (3683/4477) | 91.4 % (1443/1578) | 90.6 % (240/265) | 84.9 % (5366/6320) |
| **alle** | 80.1 % | 88.4 % | 89.5 % | 82.3 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.3334 Pp, t 1.49, n 92; IC 0.0361 (t 2.62, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1307 Pp, t -0.87, n 92; IC 0.0030 (se 0.0043, t 0.70) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `ertragskraft-roa-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `ertragskraft-roa.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

