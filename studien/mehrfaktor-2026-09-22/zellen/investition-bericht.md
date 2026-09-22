# Faktorzelle `investition`

Erzeugt 2026-09-22T13:30:32.876Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 4.5 s, RSS max 1165 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** -100 * (roh.vermoegen / vermoegenVor - 1) in Pp: Vermoegenswachstum ueber vier Quartale (Assets am Stichtag D0 gegen Assets am Stichtag D4 = vier Quartale davor, Zeilenfeld vermoegenVor) aus dem juengsten 10-K/10-Q mit filed vor dem Signaltag, gedreht - hoeher = weniger Vermoegenswachstum = besser; null, wenn Filing fehlt oder ein Bestand fehlt oder <= 0 ist  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.1176 | 0.2580 | 0.46 | 0.29 | 0.7228 | 92 |
| Dezil oben − Universum, **netto** | 0.1074 | 0.2581 | 0.42 | 0.26 | 0.7230 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.0605 | 0.5346 | -0.11 | - | 1.4976 | 92 |
| Long − Short, netto | -0.0616 | 0.5346 | -0.12 | - | 1.4977 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 640.5 |
| Dezil oben / unten (Mittel) | 64.5 / 63.6 |
| Dezil unten − Universum brutto / netto | 0.1780 / 0.1690 Pp |
| Umschlag Dezil / Universum je Monat | 20.3 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0176 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 20 (1) / 12 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.0073 (n 75) / 0.6137 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.3260 | -0.3371 | 0.5615 | -0.63 | 1.5732 |  |
| 2018 | 12 | -0.0894 | -0.0987 | 0.4189 | -0.25 | 1.1737 |  |
| 2019 | 12 | -0.1939 | -0.2017 | 0.4113 | -0.51 | 1.1523 |  |
| 2020 | 12 | -0.3070 | -0.3194 | 0.7982 | -0.42 | 2.2362 |  |
| 2021 | 12 | 2.0483 | 2.0393 | 1.2666 | 1.68 | 3.5484 |  |
| 2022 | 12 | 0.3897 | 0.3797 | 0.6176 | 0.64 | 1.7303 |  |
| 2023 | 12 | -0.1204 | -0.1314 | 0.6730 | -0.20 | 1.8855 |  |
| 2024 | 8 | -0.7499 | -0.7606 | 0.3224 | -2.52 | 0.9032 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto -0.3488 Pp (se 0.5002, t -0.73, MDE₈₀ 1.4013, n 12), brutto -0.3376 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 80.2 % (5304/6615) | 89.2 % (1143/1282) | 93.4 % (142/152) | 81.9 % (6589/8049) |
| 2018 | 81.9 % (5570/6797) | 88.8 % (1312/1478) | 93.1 % (202/217) | 83.4 % (7084/8492) |
| 2019 | 82.7 % (5468/6615) | 90.7 % (1334/1471) | 92.4 % (220/238) | 84.4 % (7022/8324) |
| 2020 | 82.4 % (5578/6766) | 90.2 % (1741/1930) | 90.7 % (330/364) | 84.4 % (7649/9060) |
| 2021 | 81.0 % (5860/7231) | 89.3 % (2176/2437) | 87.2 % (443/508) | 83.3 % (8479/10176) |
| 2022 | 81.5 % (5793/7111) | 91.4 % (2440/2670) | 90.4 % (471/521) | 84.5 % (8704/10302) |
| 2023 | 83.4 % (5675/6807) | 93.0 % (1990/2140) | 91.6 % (274/299) | 85.9 % (7939/9246) |
| 2024 | 84.0 % (3759/4477) | 92.3 % (1456/1578) | 92.1 % (244/265) | 86.4 % (5459/6320) |
| **alle** | 82.0 % | 90.7 % | 90.7 % | 84.2 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.0308 Pp, t 0.13, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1079 Pp, t -0.87, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `investition-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `investition.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

