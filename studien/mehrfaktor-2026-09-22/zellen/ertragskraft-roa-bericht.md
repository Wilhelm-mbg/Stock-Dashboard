# Faktorzelle `ertragskraft-roa`

Erzeugt 2026-09-22T13:29:55.039Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 4.6 s, RSS max 1180 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** abgeleitet.roa des juengsten Filings (filed < Signaltag) = summe4q.netto / roh.vermoegen D0, von der Tafel gebildet; Verhaeltnis, hoeher = besser; null wenn nicht ausgewiesen. Nachrichtlich, nicht gewichtet  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.2109 | 0.2305 | 0.92 | 0.93 | 0.6459 | 92 |
| Dezil oben − Universum, **netto** | 0.2068 | 0.2305 | 0.90 | 0.91 | 0.6459 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.0326 | 0.6780 | -0.05 | - | 1.8995 | 92 |
| Long − Short, netto | -0.0299 | 0.6780 | -0.04 | - | 1.8994 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 631.8 |
| Dezil oben / unten (Mittel) | 63.6 / 62.7 |
| Dezil unten − Universum brutto / netto | 0.2435 / 0.2367 Pp |
| Umschlag Dezil / Universum je Monat | 13.9 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0116 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 8 (0) / 9 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.3190 (n 75) / -0.2885 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.4642 | 0.4617 | 0.3069 | 1.57 | 0.8598 |  |
| 2018 | 12 | 0.2626 | 0.2584 | 0.3419 | 0.79 | 0.9577 |  |
| 2019 | 12 | 0.5234 | 0.5196 | 0.2635 | 2.06 | 0.7381 |  |
| 2020 | 12 | 0.0634 | 0.0590 | 1.0272 | 0.06 | 2.8777 |  |
| 2021 | 12 | 0.0723 | 0.0687 | 0.9542 | 0.08 | 2.6734 |  |
| 2022 | 12 | -0.7442 | -0.7485 | 0.6912 | -1.13 | 1.9364 |  |
| 2023 | 12 | 0.7733 | 0.7683 | 0.5322 | 1.51 | 1.4909 |  |
| 2024 | 8 | 0.3024 | 0.2970 | 0.7415 | 0.43 | 2.0773 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.0076 Pp (se 0.5744, t 0.01, MDE₈₀ 1.6093, n 12), brutto 0.0135 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 77.6 % (5134/6615) | 84.7 % (1086/1282) | 93.4 % (142/152) | 79.0 % (6362/8049) |
| 2018 | 80.8 % (5495/6797) | 87.6 % (1295/1478) | 93.1 % (202/217) | 82.3 % (6992/8492) |
| 2019 | 82.3 % (5447/6615) | 89.5 % (1316/1471) | 92.4 % (220/238) | 83.9 % (6983/8324) |
| 2020 | 81.8 % (5536/6766) | 86.7 % (1674/1930) | 89.8 % (327/364) | 83.2 % (7537/9060) |
| 2021 | 80.6 % (5830/7231) | 87.4 % (2131/2437) | 86.6 % (440/508) | 82.6 % (8401/10176) |
| 2022 | 81.0 % (5757/7111) | 90.2 % (2408/2670) | 87.1 % (454/521) | 83.7 % (8619/10302) |
| 2023 | 82.5 % (5616/6807) | 91.4 % (1957/2140) | 90.6 % (271/299) | 84.8 % (7844/9246) |
| 2024 | 82.8 % (3709/4477) | 91.4 % (1443/1578) | 90.6 % (240/265) | 85.3 % (5392/6320) |
| **alle** | 81.1 % | 88.8 % | 89.5 % | 83.1 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.3530 Pp, t 1.58, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1089 Pp, t -0.73, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `ertragskraft-roa-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `ertragskraft-roa.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

