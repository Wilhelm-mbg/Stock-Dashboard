# Faktorzelle `sue`

Erzeugt 2026-09-22T13:34:13.409Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 4.6 s, RSS max 1165 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** (quartale.netto[0] − quartale.netto[4]) / sd(quartale.netto[0…7], Stichproben-sd n−1) des jüngsten 10-K/10-Q mit filed strikt vor dem Signaltag (Tor 456 Tage); Verhältnis (standardisierte Gewinnüberraschung), höher = besser; null bei fehlendem Filing, fehlendem Quartal oder sd = 0  
**Quellen:** Fundamentaltafel fundamentaltafel-2026-09-16/v1 (quartale.netto D0…D7, wege.netto, über sicht.fundamentalAm); Panel querschnitt-pruefstand-2026-09-13/panel/v2 (nur sicht.zeileAm: Zeile am Signaltag vorhanden)

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.1575 | 0.1694 | 0.93 | 0.96 | 0.4747 | 92 |
| Dezil oben − Universum, **netto** | 0.1353 | 0.1696 | 0.80 | 0.83 | 0.4751 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.2509 | 0.3564 | 0.71 | - | 0.9986 | 92 |
| Long − Short, netto | 0.2512 | 0.3564 | 0.71 | - | 0.9984 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 631.0 |
| Dezil oben / unten (Mittel) | 63.6 / 62.6 |
| Dezil unten − Universum brutto / netto | -0.0934 / -0.1159 Pp |
| Umschlag Dezil / Universum je Monat | 36.6 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0297 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 18 (0) / 6 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.0582 (n 75) / 0.4754 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.2534 | 0.2328 | 0.3674 | 0.66 | 1.0294 |  |
| 2018 | 12 | -0.4763 | -0.5004 | 0.3057 | -1.71 | 0.8566 |  |
| 2019 | 12 | 0.2022 | 0.1766 | 0.3588 | 0.51 | 1.0051 |  |
| 2020 | 12 | 0.0160 | -0.0057 | 0.5913 | -0.01 | 1.6565 |  |
| 2021 | 12 | -0.1983 | -0.2240 | 0.5002 | -0.47 | 1.4013 |  |
| 2022 | 12 | 0.0716 | 0.0505 | 0.5632 | 0.09 | 1.5780 |  |
| 2023 | 12 | 0.7886 | 0.7686 | 0.4678 | 1.72 | 1.3107 |  |
| 2024 | 8 | 0.8258 | 0.8085 | 0.7115 | 1.21 | 1.9934 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.8202 Pp (se 0.4933, t 1.74, MDE₈₀ 1.3819, n 12), brutto 0.8389 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 77.5 % (5124/6615) | 84.7 % (1086/1282) | 93.4 % (142/152) | 78.9 % (6352/8049) |
| 2018 | 80.7 % (5488/6797) | 87.6 % (1295/1478) | 93.1 % (202/217) | 82.3 % (6985/8492) |
| 2019 | 82.2 % (5438/6615) | 89.5 % (1316/1471) | 92.4 % (220/238) | 83.8 % (6974/8324) |
| 2020 | 81.8 % (5536/6766) | 86.7 % (1674/1930) | 89.8 % (327/364) | 83.2 % (7537/9060) |
| 2021 | 80.3 % (5805/7231) | 87.2 % (2125/2437) | 86.4 % (439/508) | 82.2 % (8369/10176) |
| 2022 | 80.9 % (5753/7111) | 89.8 % (2397/2670) | 86.6 % (451/521) | 83.5 % (8601/10302) |
| 2023 | 82.6 % (5621/6807) | 91.4 % (1957/2140) | 90.6 % (271/299) | 84.9 % (7849/9246) |
| 2024 | 82.8 % (3706/4477) | 91.4 % (1443/1578) | 90.6 % (240/265) | 85.3 % (5389/6320) |
| **alle** | 81.0 % | 88.7 % | 89.4 % | 83.0 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.6100 Pp, t 3.67, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.0879 Pp, t -0.75, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `sue-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `sue.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

