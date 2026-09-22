# Faktorzelle `fue-marktwert`

Erzeugt 2026-09-22T13:32:26.513Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.2 s, RSS max 1189 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** (roh.fue * 4 / roh.qtrs) / (roh.aktien * rohSchluss[t]): F&E des juengsten Filings (filed < t, Tor 456 Tage) auf Jahresrate durch Marktwert = Aktienzahl des Filings x unbereinigter Schlusskurs am Signaltag; Verhaeltnis, hoeher = besser; null ohne ausgewiesenes F&E, bei qtrs weder 1 noch 4, Aktienzahl fehlend oder <= 0, Kurs <= 0; nachrichtlich, nicht gewichtet  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.4850 | 0.4924 | 0.99 | 1.25 | 1.3796 | 92 |
| Dezil oben − Universum, **netto** | 0.4728 | 0.4924 | 0.97 | 1.22 | 1.3794 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.5773 | 0.5896 | 0.98 | - | 1.6520 | 92 |
| Long − Short, netto | 0.5737 | 0.5896 | 0.98 | - | 1.6519 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 201.2 |
| Dezil oben / unten (Mittel) | 20.3 / 20.0 |
| Dezil unten − Universum brutto / netto | -0.0923 / -0.1009 Pp |
| Umschlag Dezil / Universum je Monat | 22.1 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0197 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 10 (1) / 4 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.1313 (n 75) / 1.9793 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.8798 | 0.8649 | 0.7201 | 1.25 | 2.0173 |  |
| 2018 | 12 | 1.2838 | 1.2729 | 0.8887 | 1.50 | 2.4897 |  |
| 2019 | 12 | 0.6723 | 0.6596 | 0.9137 | 0.75 | 2.5598 |  |
| 2020 | 12 | 1.6793 | 1.6677 | 1.3742 | 1.27 | 3.8500 |  |
| 2021 | 12 | 0.1597 | 0.1456 | 1.3655 | 0.11 | 3.8256 |  |
| 2022 | 12 | -2.3736 | -2.3846 | 1.0486 | -2.38 | 2.9377 |  |
| 2023 | 12 | 3.2568 | 3.2468 | 2.4086 | 1.41 | 6.7481 |  |
| 2024 | 8 | -2.7590 | -2.7721 | 0.8185 | -3.62 | 2.2931 | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto -1.3502 Pp (se 0.9922, t -1.42, MDE₈₀ 2.7797, n 12), brutto -1.3375 Pp.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 20.4 % (1352/6615) | 32.2 % (413/1282) | 57.9 % (88/152) | 23.0 % (1853/8049) |
| 2018 | 20.5 % (1396/6797) | 32.1 % (475/1478) | 64.5 % (140/217) | 23.7 % (2011/8492) |
| 2019 | 21.4 % (1415/6615) | 34.1 % (501/1471) | 67.6 % (161/238) | 25.0 % (2077/8324) |
| 2020 | 22.2 % (1499/6766) | 35.2 % (679/1930) | 51.6 % (188/364) | 26.1 % (2366/9060) |
| 2021 | 22.4 % (1619/7231) | 35.4 % (862/2437) | 52.6 % (267/508) | 27.0 % (2748/10176) |
| 2022 | 23.5 % (1674/7111) | 36.8 % (982/2670) | 49.7 % (259/521) | 28.3 % (2915/10302) |
| 2023 | 24.5 % (1665/6807) | 40.0 % (856/2140) | 59.9 % (179/299) | 29.2 % (2700/9246) |
| 2024 | 24.7 % (1107/4477) | 35.6 % (562/1578) | 65.7 % (174/265) | 29.2 % (1843/6320) |
| **alle** | 22.4 % | 35.6 % | 56.8 % | 26.5 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -2.3714 Pp, t -4.84, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2685 Pp, t -1.18, n 92 | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %.

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `fue-marktwert-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `fue-marktwert.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

