# Faktorzelle `ertragskraft-roa`

Erzeugt 2026-09-23T20:42:12.647Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 7.3 s, RSS max 1260 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** abgeleitet.roa des juengsten Filings (filed < Signaltag) = summe4q.netto / roh.vermoegen D0, von der Tafel gebildet; Verhaeltnis, hoeher = besser; null wenn nicht ausgewiesen. Nachrichtlich, nicht gewichtet  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.1471 | 0.1915 | 0.77 | 0.80 | 0.5364 | 116 |
| Dezil oben − Universum, **netto** | 0.1432 | 0.1915 | 0.75 | 0.78 | 0.5364 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.3025 | 0.5759 | -0.53 | - | 1.6135 | 116 |
| Long − Short, netto | -0.2997 | 0.5759 | -0.52 | - | 1.6134 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 661.9 |
| Dezil oben / unten (Mittel) | 66.7 / 65.8 |
| Dezil unten − Universum brutto / netto | 0.4496 / 0.4429 Pp |
| Umschlag Dezil / Universum je Monat | 14.1 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0116 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 8 (0) / 8 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.1844 (n 96) / -0.0547 (n 20) Pp |

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
| 2024 | 12 | 0.4061 | 0.4013 | 0.5028 | 0.83 | 1.4087 | 0.0094 (12) |  |
| 2025 | 12 | -0.4572 | -0.4606 | 0.3494 | -1.38 | 0.9788 | -0.0162 (12) |  |
| 2026 | 8 | 0.1429 | 0.1408 | 0.5923 | 0.25 | 1.6595 | 0.0214 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto -0.0607 Pp (se 0.4342, t -0.15, MDE₈₀ 1.2164, n 12), brutto -0.0579 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0227, se 0.0114, t 1.99, MDE₈₀ 0.0319, n 116**; letzte 12 Signaltage -0.0010 (n 12); Paare je Signaltag im Mittel 661.9.

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
| 2024 | 82.4 % (5503/6676) | 91.5 % (2152/2351) | 89.8 % (370/412) | 85.0 % (8025/9439) |
| 2025 | 81.0 % (5935/7327) | 90.9 % (2877/3165) | 89.6 % (613/684) | 84.3 % (9425/11176) |
| 2026 | 81.0 % (4128/5096) | 91.4 % (2416/2642) | 91.0 % (606/666) | 85.1 % (7150/8404) |
| **alle** | 80.4 % | 89.3 % | 89.8 % | 82.9 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.2865 Pp, t 1.53, n 116; IC 0.0279 (t 2.41, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1226 Pp, t -0.93, n 116; IC 0.0014 (se 0.0037, t 0.38) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 92668 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `ertragskraft-roa-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `ertragskraft-roa.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

