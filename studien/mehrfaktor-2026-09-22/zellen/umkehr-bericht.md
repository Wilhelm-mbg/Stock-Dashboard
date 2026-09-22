# Faktorzelle `umkehr`

Erzeugt 2026-09-22T13:30:41.452Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 2.6 s, RSS max 1047 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** -100 * (bSchluss(t) / bSchluss(21 Panelzeilen vor t) - 1) in Pp, gedreht (Verlierer des letzten Monats oben); null bei fehlender Zeile am Signaltag, fehlender 21. Vorzeile oder Nenner <= 0  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.1571 | 0.4839 | 0.33 | 0.32 | 1.3556 | 92 |
| Dezil oben − Universum, **netto** | 0.0954 | 0.4839 | 0.20 | 0.19 | 1.3556 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.2656 | 0.6644 | 0.40 | - | 1.8614 | 92 |
| Long − Short, netto | 0.2654 | 0.6644 | 0.40 | - | 1.8613 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 760.5 |
| Dezil oben / unten (Mittel) | 76.5 / 75.6 |
| Dezil unten − Universum brutto / netto | -0.1085 / -0.1700 Pp |
| Umschlag Dezil / Universum je Monat | 84.6 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0692 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 13 (0) / 14 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.2796 (n 75) / 1.7497 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.2783 | 0.2204 | 0.7113 | 0.32 | 1.9927 |  |
| 2018 | 12 | 0.0960 | 0.0302 | 0.5010 | 0.06 | 1.4036 |  |
| 2019 | 12 | 0.9103 | 0.8444 | 0.6995 | 1.26 | 1.9598 |  |
| 2020 | 12 | 0.3800 | 0.3156 | 2.0648 | 0.16 | 5.7849 |  |
| 2021 | 12 | -0.0412 | -0.1003 | 1.5657 | -0.07 | 4.3864 |  |
| 2022 | 12 | -2.0593 | -2.1166 | 1.5610 | -1.42 | 4.3734 |  |
| 2023 | 12 | 1.5028 | 1.4408 | 1.8164 | 0.83 | 5.0889 |  |
| 2024 | 8 | 0.2060 | 0.1452 | 1.0658 | 0.15 | 2.9858 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto -0.2717 Pp (se 0.9537, t -0.30, MDE₈₀ 2.6718, n 12), brutto -0.2115 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 100.0 % (6615/6615) | 100.0 % (1282/1282) | 100.0 % (152/152) | 100.0 % (8049/8049) |
| 2018 | 100.0 % (6797/6797) | 100.0 % (1478/1478) | 100.0 % (217/217) | 100.0 % (8492/8492) |
| 2019 | 100.0 % (6615/6615) | 100.0 % (1471/1471) | 100.0 % (238/238) | 100.0 % (8324/8324) |
| 2020 | 100.0 % (6766/6766) | 100.0 % (1930/1930) | 100.0 % (364/364) | 100.0 % (9060/9060) |
| 2021 | 100.0 % (7231/7231) | 100.0 % (2437/2437) | 100.0 % (508/508) | 100.0 % (10176/10176) |
| 2022 | 100.0 % (7111/7111) | 100.0 % (2670/2670) | 100.0 % (521/521) | 100.0 % (10302/10302) |
| 2023 | 100.0 % (6807/6807) | 100.0 % (2140/2140) | 100.0 % (299/299) | 100.0 % (9246/9246) |
| 2024 | 100.0 % (4477/4477) | 100.0 % (1578/1578) | 100.0 % (265/265) | 100.0 % (6320/6320) |
| **alle** | 100.0 % | 100.0 % | 100.0 % | 100.0 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -15.0750 Pp, t -42.91, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto 0.0659 Pp, t 0.65, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser nicht benutzt | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `umkehr-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `umkehr.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

