# Faktorzelle `groesse`

Erzeugt 2026-09-22T13:32:24.344Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.0 s, RSS max 1181 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** ln(Marktwert in $), Marktwert = roh.aktien (juengstes Filing mit filed < t, Tor 456 Tage) x rohSchluss (unbereinigter Schlusskurs am Signaltag t); hoeher = groesser; Kontrollgroesse, kein Signal  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.0423 | 0.2447 | 0.17 | 0.24 | 0.6855 | 92 |
| Dezil oben − Universum, **netto** | 0.0455 | 0.2446 | 0.19 | 0.25 | 0.6854 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.2234 | 0.7731 | -0.29 | - | 2.1660 | 92 |
| Long − Short, netto | -0.2021 | 0.7730 | -0.26 | - | 2.1656 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 598.9 |
| Dezil oben / unten (Mittel) | 60.2 / 59.6 |
| Dezil unten − Universum brutto / netto | 0.2658 / 0.2476 Pp |
| Umschlag Dezil / Universum je Monat | 6.9 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0044 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 6 (1) / 9 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.3474 (n 75) / -1.2863 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.3060 | -0.3045 | 0.3060 | -1.04 | 0.8573 |  |
| 2018 | 12 | 0.3697 | 0.3719 | 0.3377 | 1.15 | 0.9461 |  |
| 2019 | 12 | -0.2032 | -0.2008 | 0.5392 | -0.39 | 1.5107 |  |
| 2020 | 12 | -0.4031 | -0.3995 | 1.2616 | -0.33 | 3.5346 |  |
| 2021 | 12 | 0.1759 | 0.1800 | 0.7635 | 0.25 | 2.1390 |  |
| 2022 | 12 | 0.0799 | 0.0839 | 0.4246 | 0.21 | 1.1895 |  |
| 2023 | 12 | 0.1743 | 0.1784 | 0.7693 | 0.24 | 2.1554 |  |
| 2024 | 8 | 0.6556 | 0.6587 | 0.8122 | 0.87 | 2.2754 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.4528 Pp (se 0.6400, t 0.74, MDE₈₀ 1.7931, n 12), brutto 0.4492 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 75.9 % (5018/6615) | 81.5 % (1045/1282) | 93.4 % (142/152) | 77.1 % (6205/8049) |
| 2018 | 76.0 % (5167/6797) | 79.6 % (1176/1478) | 92.2 % (200/217) | 77.0 % (6543/8492) |
| 2019 | 76.5 % (5059/6615) | 82.1 % (1208/1471) | 89.5 % (213/238) | 77.8 % (6480/8324) |
| 2020 | 76.2 % (5153/6766) | 81.8 % (1579/1930) | 83.8 % (305/364) | 77.7 % (7037/9060) |
| 2021 | 76.1 % (5504/7231) | 79.5 % (1938/2437) | 84.1 % (427/508) | 77.3 % (7869/10176) |
| 2022 | 77.6 % (5518/7111) | 85.8 % (2292/2670) | 83.9 % (437/521) | 80.1 % (8247/10302) |
| 2023 | 79.5 % (5410/6807) | 88.2 % (1888/2140) | 83.6 % (250/299) | 81.6 % (7548/9246) |
| 2024 | 80.0 % (3582/4477) | 85.9 % (1356/1578) | 86.0 % (228/265) | 81.7 % (5166/6320) |
| **alle** | 77.1 % | 83.3 % | 85.9 % | 78.7 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.6223 Pp, t 2.57, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto 0.0945 Pp, t 0.80, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `groesse-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `groesse.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

