# Faktorzelle `bewertung-ep`

Erzeugt 2026-09-22T13:31:06.112Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 4.8 s, RSS max 1165 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** E/P = summe4q.netto (Nettoergebnis der vier Quartale D0..D3 des juengsten 10-K/10-Q mit filed < t, Tor 456 Tage; null wenn ein Quartal fehlt) / (roh.aktien desselben Filings x rohSchluss(t), unbereinigt); Verhaeltnis, hoeher = besser; negatives Netto ist ein Wert; nachrichtlich, nicht gewichtet  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | -0.1392 | 0.2973 | -0.47 | -0.48 | 0.8330 | 92 |
| Dezil oben − Universum, **netto** | -0.1477 | 0.2974 | -0.50 | -0.50 | 0.8333 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.2409 | 0.5386 | -0.45 | - | 1.5091 | 92 |
| Long − Short, netto | -0.2422 | 0.5387 | -0.45 | - | 1.5093 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 582.9 |
| Dezil oben / unten (Mittel) | 58.7 / 57.9 |
| Dezil unten − Universum brutto / netto | 0.1017 / 0.0944 Pp |
| Umschlag Dezil / Universum je Monat | 18.5 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0160 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 21 (1) / 10 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.2944 (n 75) / 0.4995 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.6923 | -0.7000 | 0.5690 | -1.28 | 1.5942 |  |
| 2018 | 12 | -0.4337 | -0.4424 | 0.4817 | -0.96 | 1.3494 |  |
| 2019 | 12 | -0.7569 | -0.7682 | 0.7829 | -1.02 | 2.1933 |  |
| 2020 | 12 | -0.9472 | -0.9578 | 1.4825 | -0.67 | 4.1534 |  |
| 2021 | 12 | 0.8045 | 0.7963 | 0.6386 | 1.30 | 1.7890 |  |
| 2022 | 12 | 0.0357 | 0.0281 | 0.8791 | 0.03 | 2.4628 |  |
| 2023 | 12 | 0.7016 | 0.6959 | 0.7528 | 0.97 | 2.1091 |  |
| 2024 | 8 | 0.3319 | 0.3233 | 0.6945 | 0.50 | 1.9456 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.2379 Pp (se 0.5510, t 0.45, MDE₈₀ 1.5437, n 12), brutto 0.2455 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 71.4 % (4726/6615) | 75.7 % (971/1282) | 93.4 % (142/152) | 72.5 % (5839/8049) |
| 2018 | 73.9 % (5024/6797) | 77.1 % (1139/1478) | 92.2 % (200/217) | 74.9 % (6363/8492) |
| 2019 | 75.1 % (4965/6615) | 79.5 % (1170/1471) | 88.7 % (211/238) | 76.2 % (6346/8324) |
| 2020 | 74.7 % (5057/6766) | 77.4 % (1494/1930) | 81.9 % (298/364) | 75.6 % (6849/9060) |
| 2021 | 74.8 % (5408/7231) | 76.9 % (1874/2437) | 83.3 % (423/508) | 75.7 % (7705/10176) |
| 2022 | 76.1 % (5410/7111) | 84.1 % (2246/2670) | 80.4 % (419/521) | 78.4 % (8075/10302) |
| 2023 | 77.7 % (5292/6807) | 86.2 % (1844/2140) | 82.6 % (247/299) | 79.9 % (7383/9246) |
| 2024 | 78.3 % (3505/4477) | 85.0 % (1342/1578) | 83.4 % (221/265) | 80.2 % (5068/6320) |
| **alle** | 75.1 % | 80.6 % | 84.3 % | 76.6 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -1.2775 Pp, t -4.06, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.0221 Pp, t -0.18, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `bewertung-ep-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `bewertung-ep.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

