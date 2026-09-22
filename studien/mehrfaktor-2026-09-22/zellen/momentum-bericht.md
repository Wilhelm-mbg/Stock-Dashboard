# Faktorzelle `momentum`

Erzeugt 2026-09-22T13:28:54.908Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 2.7 s, RSS max 1048 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** 100 * (bSchluss(21 Panelzeilen vor t) / bSchluss(252 Panelzeilen vor t) - 1) in Pp; hoeher = besser (12-1-Momentum)  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2 (v2.1), Spalte bSchluss

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.8655 | 0.5328 | 1.63 | 1.74 | 1.4927 | 92 |
| Dezil oben − Universum, **netto** | 0.8472 | 0.5328 | 1.60 | 1.70 | 1.4927 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 1.2325 | 0.8445 | 1.47 | - | 2.3659 | 92 |
| Long − Short, netto | 1.2334 | 0.8444 | 1.47 | - | 2.3656 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 760.3 |
| Dezil oben / unten (Mittel) | 76.5 / 75.6 |
| Dezil unten − Universum brutto / netto | -0.3670 / -0.3861 Pp |
| Umschlag Dezil / Universum je Monat | 31.1 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0257 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 44 (0) / 10 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.8372 (n 75) / 0.8914 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.4094 | 0.3914 | 0.6101 | 0.67 | 1.7091 |  |
| 2018 | 12 | 0.4796 | 0.4605 | 1.2068 | 0.40 | 3.3809 |  |
| 2019 | 12 | 0.6684 | 0.6471 | 1.0559 | 0.64 | 2.9581 |  |
| 2020 | 12 | 3.4130 | 3.3944 | 1.1807 | 3.00 | 3.3080 |  |
| 2021 | 12 | 0.4902 | 0.4746 | 2.9407 | 0.17 | 8.2386 |  |
| 2022 | 12 | 0.6869 | 0.6717 | 1.3988 | 0.50 | 3.9187 |  |
| 2023 | 12 | -0.2321 | -0.2528 | 0.7813 | -0.34 | 2.1889 |  |
| 2024 | 8 | 1.0800 | 1.0629 | 2.0012 | 0.57 | 5.6065 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.5043 Pp (se 1.3583, t 0.39, MDE₈₀ 3.8055, n 12), brutto 0.5220 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 99.9 % (6610/6615) | 100.0 % (1282/1282) | 100.0 % (152/152) | 99.9 % (8044/8049) |
| 2018 | 100.0 % (6794/6797) | 99.9 % (1477/1478) | 100.0 % (217/217) | 100.0 % (8488/8492) |
| 2019 | 100.0 % (6612/6615) | 100.0 % (1471/1471) | 100.0 % (238/238) | 100.0 % (8321/8324) |
| 2020 | 100.0 % (6764/6766) | 100.0 % (1930/1930) | 100.0 % (364/364) | 100.0 % (9058/9060) |
| 2021 | 99.9 % (7227/7231) | 100.0 % (2437/2437) | 100.0 % (508/508) | 100.0 % (10172/10176) |
| 2022 | 100.0 % (7108/7111) | 100.0 % (2670/2670) | 100.0 % (521/521) | 100.0 % (10299/10302) |
| 2023 | 100.0 % (6805/6807) | 100.0 % (2139/2140) | 100.0 % (299/299) | 100.0 % (9243/9246) |
| 2024 | 100.0 % (4477/4477) | 100.0 % (1578/1578) | 100.0 % (265/265) | 100.0 % (6320/6320) |
| **alle** | 100.0 % | 100.0 % | 100.0 % | 100.0 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.9206 Pp, t 1.78, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto 0.1624 Pp, t 1.54, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser nicht benutzt | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `momentum-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `momentum.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

