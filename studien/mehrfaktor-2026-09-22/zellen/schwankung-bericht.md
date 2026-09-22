# Faktorzelle `schwankung`

Erzeugt 2026-09-22T13:30:26.979Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 2.7 s, RSS max 1047 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** -sd(rendite) ueber die 252 Panelzeilen z, zurueck(z,1) .. zurueck(z,251) bis einschliesslich Signaltag (Stichproben-sd, Nenner 251), gedreht: hoeher = ruhiger; Einheit Pp der Panel-Spalte rendite; null bei fehlender Zeile am Signaltag, unvollstaendigem Fenster oder nicht endlicher Rendite  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | -0.2453 | 0.3889 | -0.63 | -0.63 | 1.0896 | 92 |
| Dezil oben − Universum, **netto** | -0.2493 | 0.3890 | -0.64 | -0.64 | 1.0897 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.8356 | 1.0641 | -0.79 | - | 2.9811 | 92 |
| Long − Short, netto | -0.8323 | 1.0641 | -0.79 | - | 2.9811 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 760.3 |
| Dezil oben / unten (Mittel) | 76.5 / 75.6 |
| Dezil unten − Universum brutto / netto | 0.5904 / 0.5829 Pp |
| Umschlag Dezil / Universum je Monat | 14.0 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0116 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 17 (0) / 41 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.1573 (n 75) / -2.0433 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.3341 | -0.3385 | 0.6008 | -0.59 | 1.6832 |  |
| 2018 | 12 | 0.8866 | 0.8813 | 0.6428 | 1.43 | 1.8009 |  |
| 2019 | 12 | -0.4344 | -0.4379 | 1.1549 | -0.40 | 3.2356 |  |
| 2020 | 12 | -1.7955 | -1.8027 | 1.4309 | -1.32 | 4.0089 |  |
| 2021 | 12 | -0.2300 | -0.2330 | 1.2183 | -0.20 | 3.4131 |  |
| 2022 | 12 | 1.1840 | 1.1815 | 0.8858 | 1.39 | 2.4818 |  |
| 2023 | 12 | -1.6832 | -1.6856 | 1.4252 | -1.24 | 3.9928 |  |
| 2024 | 8 | 0.7894 | 0.7850 | 0.9241 | 0.91 | 2.5891 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.2161 Pp (se 0.8714, t 0.26, MDE₈₀ 2.4414, n 12), brutto 0.2200 Pp.

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
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.0325 Pp, t 0.08, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.0502 Pp, t -0.47, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser nicht benutzt | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `schwankung-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `schwankung.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

