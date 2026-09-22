# Faktorzelle `fue-marktwert`

Erzeugt 2026-09-22T20:27:28.920Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.6 s, RSS max 1193 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** (roh.fue * 4 / roh.qtrs) / (roh.aktien * rohSchluss[t]): F&E des juengsten Filings (filed < t, Tor 456 Tage) auf Jahresrate durch Marktwert = Aktienzahl des Filings x unbereinigter Schlusskurs am Signaltag; Verhaeltnis, hoeher = besser; null ohne ausgewiesenes F&E, bei qtrs weder 1 noch 4, Aktienzahl fehlend oder <= 0, Kurs <= 0; nachrichtlich, nicht gewichtet  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.4692 | 0.4971 | 0.95 | 1.17 | 1.3926 | 92 |
| Dezil oben − Universum, **netto** | 0.4580 | 0.4970 | 0.93 | 1.15 | 1.3924 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.4940 | 0.5685 | 0.87 | - | 1.5927 | 92 |
| Long − Short, netto | 0.4912 | 0.5684 | 0.87 | - | 1.5925 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 200.7 |
| Dezil oben / unten (Mittel) | 20.2 / 19.9 |
| Dezil unten − Universum brutto / netto | -0.0248 / -0.0332 Pp |
| Umschlag Dezil / Universum je Monat | 21.0 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0188 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 8 (1) / 4 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.1129 (n 75) / 1.9803 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.9693 | 0.9572 | 0.8163 | 1.22 | 2.2869 | -0.0029 (12) |  |
| 2018 | 12 | 1.5379 | 1.5284 | 0.8681 | 1.84 | 2.4321 | 0.0222 (12) |  |
| 2019 | 12 | 1.0818 | 1.0712 | 0.8236 | 1.36 | 2.3074 | 0.0314 (12) |  |
| 2020 | 12 | 0.9352 | 0.9245 | 1.3985 | 0.69 | 3.9180 | -0.0283 (12) |  |
| 2021 | 12 | 0.2931 | 0.2792 | 1.4279 | 0.20 | 4.0005 | 0.0402 (12) |  |
| 2022 | 12 | -2.4545 | -2.4647 | 1.0874 | -2.37 | 3.0464 | -0.0566 (12) |  |
| 2023 | 12 | 3.2705 | 3.2601 | 2.3843 | 1.43 | 6.6798 | 0.0406 (12) |  |
| 2024 | 8 | -3.0536 | -3.0668 | 0.8109 | -4.04 | 2.2717 | -0.0546 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto -1.5465 Pp (se 1.0162, t -1.59, MDE₈₀ 2.8469, n 12), brutto -1.5338 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0013, se 0.0123, t 0.11, MDE₈₀ 0.0344, n 92**; letzte 12 Signaltage -0.0162 (n 12); Paare je Signaltag im Mittel 200.7.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 20.3 % (1341/6615) | 32.2 % (413/1282) | 57.9 % (88/152) | 22.9 % (1842/8049) |
| 2018 | 20.3 % (1382/6797) | 31.9 % (471/1478) | 64.5 % (140/217) | 23.5 % (1993/8492) |
| 2019 | 21.4 % (1413/6615) | 33.7 % (496/1471) | 67.6 % (161/238) | 24.9 % (2070/8324) |
| 2020 | 22.1 % (1496/6766) | 35.2 % (679/1930) | 51.6 % (188/364) | 26.1 % (2363/9060) |
| 2021 | 22.4 % (1618/7231) | 35.4 % (862/2437) | 52.6 % (267/508) | 27.0 % (2747/10176) |
| 2022 | 23.5 % (1669/7111) | 36.7 % (981/2670) | 49.7 % (259/521) | 28.2 % (2909/10302) |
| 2023 | 24.4 % (1662/6807) | 40.0 % (856/2140) | 59.9 % (179/299) | 29.2 % (2697/9246) |
| 2024 | 24.7 % (1107/4477) | 35.6 % (562/1578) | 65.7 % (174/265) | 29.2 % (1843/6320) |
| **alle** | 22.3 % | 35.5 % | 56.8 % | 26.4 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -2.3412 Pp, t -4.72, n 92; IC -0.0929 (t -7.46, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2892 Pp, t -1.26, n 92; IC -0.0039 (se 0.0067, t -0.58) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `fue-marktwert-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `fue-marktwert.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

