# Faktorzelle `verschuldung`

Erzeugt 2026-09-22T13:32:29.728Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 4.7 s, RSS max 1184 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** (roh.vermoegen - roh.eigenkapital) / roh.vermoegen aus dem juengsten Filing mit filed < t (Bestaende D0, Tor 456 Tage); Verhaeltnis, hoeher = staerker verschuldet (Werte > 1 bei negativem Eigenkapital sind echte Werte); Kontrollgroesse, kein Signal  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.4279 | 0.1571 | 2.74 | 3.13 | 0.4403 | 92 |
| Dezil oben − Universum, **netto** | 0.4249 | 0.1572 | 2.72 | 3.11 | 0.4403 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.4742 | 0.4276 | 1.11 | - | 1.1980 | 92 |
| Long − Short, netto | 0.4771 | 0.4277 | 1.12 | - | 1.1983 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 646.0 |
| Dezil oben / unten (Mittel) | 65.1 / 64.2 |
| Dezil unten − Universum brutto / netto | -0.0462 / -0.0521 Pp |
| Umschlag Dezil / Universum je Monat | 11.7 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0105 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 18 (1) / 6 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.3806 (n 75) / 0.6205 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.5286 | 0.5245 | 0.4454 | 1.23 | 1.2478 |  |
| 2018 | 12 | 0.3031 | 0.2993 | 0.4505 | 0.69 | 1.2620 |  |
| 2019 | 12 | 0.4165 | 0.4129 | 0.3086 | 1.40 | 0.8646 |  |
| 2020 | 12 | 0.4364 | 0.4335 | 0.5545 | 0.82 | 1.5534 |  |
| 2021 | 12 | 0.7328 | 0.7309 | 0.5359 | 1.42 | 1.5014 |  |
| 2022 | 12 | -0.1959 | -0.1981 | 0.4468 | -0.46 | 1.2517 |  |
| 2023 | 12 | 0.5021 | 0.4987 | 0.4272 | 1.22 | 1.1969 |  |
| 2024 | 8 | 0.8356 | 0.8338 | 0.2942 | 3.03 | 0.8242 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.8236 Pp (se 0.2812, t 3.06, MDE₈₀ 0.7877, n 12), brutto 0.8259 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 81.8 % (5410/6615) | 90.5 % (1160/1282) | 93.4 % (142/152) | 83.4 % (6712/8049) |
| 2018 | 82.5 % (5608/6797) | 89.9 % (1328/1478) | 93.1 % (202/217) | 84.1 % (7138/8492) |
| 2019 | 83.3 % (5513/6615) | 92.0 % (1354/1471) | 93.3 % (222/238) | 85.2 % (7089/8324) |
| 2020 | 82.9 % (5607/6766) | 91.3 % (1762/1930) | 91.2 % (332/364) | 85.0 % (7701/9060) |
| 2021 | 81.6 % (5897/7231) | 90.0 % (2194/2437) | 87.4 % (444/508) | 83.9 % (8535/10176) |
| 2022 | 82.2 % (5846/7111) | 92.2 % (2461/2670) | 90.6 % (472/521) | 85.2 % (8779/10302) |
| 2023 | 84.0 % (5721/6807) | 93.5 % (2001/2140) | 91.6 % (274/299) | 86.5 % (7996/9246) |
| 2024 | 84.4 % (3780/4477) | 92.3 % (1457/1578) | 93.2 % (247/265) | 86.8 % (5484/6320) |
| **alle** | 82.8 % | 91.5 % | 91.1 % | 84.9 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.4227 Pp, t 2.66, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2614 Pp, t -2.05, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `verschuldung-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `verschuldung.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

