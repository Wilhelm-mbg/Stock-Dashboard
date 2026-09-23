# Faktorzelle `fue-marktwert`

Erzeugt 2026-09-23T20:42:43.587Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 7.3 s, RSS max 1273 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** (roh.fue * 4 / roh.qtrs) / (roh.aktien * rohSchluss[t]): F&E des juengsten Filings (filed < t, Tor 456 Tage) auf Jahresrate durch Marktwert = Aktienzahl des Filings x unbereinigter Schlusskurs am Signaltag; Verhaeltnis, hoeher = besser; null ohne ausgewiesenes F&E, bei qtrs weder 1 noch 4, Aktienzahl fehlend oder <= 0, Kurs <= 0; nachrichtlich, nicht gewichtet  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.7528 | 0.4439 | 1.70 | 2.00 | 1.2437 | 116 |
| Dezil oben − Universum, **netto** | 0.7415 | 0.4438 | 1.68 | 1.97 | 1.2435 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.4839 | 0.5296 | 0.92 | - | 1.4837 | 116 |
| Long − Short, netto | 0.4803 | 0.5295 | 0.91 | - | 1.4836 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 219.1 |
| Dezil oben / unten (Mittel) | 22.1 / 21.8 |
| Dezil unten − Universum brutto / netto | 0.2689 / 0.2612 Pp |
| Umschlag Dezil / Universum je Monat | 21.3 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0190 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 10 (1) / 4 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.4699 (n 96) / 2.0451 (n 20) Pp |

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
| 2024 | 12 | -1.6461 | -1.6578 | 0.8085 | -2.14 | 2.2651 | -0.0307 (12) |  |
| 2025 | 12 | 1.2369 | 1.2264 | 1.1490 | 1.11 | 3.2190 | -0.0066 (12) |  |
| 2026 | 8 | 3.0799 | 3.0651 | 2.4267 | 1.35 | 6.7986 | 0.0796 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto 3.4379 Pp (se 1.6713, t 2.15, MDE₈₀ 4.6822, n 12), brutto 3.4508 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0065, se 0.0111, t 0.58, MDE₈₀ 0.0312, n 116**; letzte 12 Signaltage 0.0685 (n 12); Paare je Signaltag im Mittel 219.1.

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
| 2024 | 25.1 % (1675/6676) | 35.0 % (823/2351) | 65.0 % (268/412) | 29.3 % (2766/9439) |
| 2025 | 26.4 % (1934/7327) | 32.3 % (1023/3165) | 63.0 % (431/684) | 30.3 % (3388/11176) |
| 2026 | 27.4 % (1394/5096) | 31.0 % (820/2642) | 64.6 % (430/666) | 31.5 % (2644/8404) |
| **alle** | 23.2 % | 34.4 % | 59.4 % | 27.4 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -2.3371 Pp, t -5.57, n 116; IC -0.0922 (t -8.23, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2621 Pp, t -1.32, n 116; IC -0.0027 (se 0.0056, t -0.48) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 92668 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `fue-marktwert-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `fue-marktwert.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

