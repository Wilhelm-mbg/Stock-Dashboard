# Faktorzelle `groesse`

Erzeugt 2026-09-22T20:26:35.874Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.7 s, RSS max 1183 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** ln(Marktwert in $), Marktwert = roh.aktien (juengstes Filing mit filed < t, Tor 456 Tage) x rohSchluss (unbereinigter Schlusskurs am Signaltag t); hoeher = groesser; Kontrollgroesse, kein Signal  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.0622 | 0.2485 | 0.25 | 0.31 | 0.6963 | 92 |
| Dezil oben − Universum, **netto** | 0.0657 | 0.2485 | 0.27 | 0.33 | 0.6962 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.2476 | 0.7905 | -0.31 | - | 2.2147 | 92 |
| Long − Short, netto | -0.2251 | 0.7904 | -0.29 | - | 2.2144 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 592.6 |
| Dezil oben / unten (Mittel) | 59.7 / 58.8 |
| Dezil unten − Universum brutto / netto | 0.3097 / 0.2908 Pp |
| Umschlag Dezil / Universum je Monat | 6.4 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0039 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 3 (1) / 9 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.3701 (n 75) / -1.2771 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.0921 | -0.0898 | 0.2800 | -0.33 | 0.7846 | 0.0277 (12) |  |
| 2018 | 12 | 0.5200 | 0.5225 | 0.3686 | 1.48 | 1.0328 | 0.0514 (12) |  |
| 2019 | 12 | -0.2570 | -0.2543 | 0.5372 | -0.49 | 1.5051 | 0.0069 (12) |  |
| 2020 | 12 | -0.5756 | -0.5713 | 1.2511 | -0.48 | 3.5051 | -0.0324 (12) |  |
| 2021 | 12 | 0.2289 | 0.2334 | 0.8488 | 0.29 | 2.3779 | 0.0222 (12) |  |
| 2022 | 12 | 0.0600 | 0.0643 | 0.4322 | 0.16 | 1.2108 | 0.0539 (12) |  |
| 2023 | 12 | 0.1706 | 0.1748 | 0.7669 | 0.24 | 2.1485 | 0.0093 (12) |  |
| 2024 | 8 | 0.6328 | 0.6363 | 0.7862 | 0.87 | 2.2027 | 0.0876 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.4260 Pp (se 0.6237, t 0.71, MDE₈₀ 1.7473, n 12), brutto 0.4221 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0258, se 0.0156, t 1.65, MDE₈₀ 0.0438, n 92**; letzte 12 Signaltage 0.0753 (n 12); Paare je Signaltag im Mittel 592.6.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 74.5 % (4928/6615) | 80.6 % (1033/1282) | 93.4 % (142/152) | 75.8 % (6103/8049) |
| 2018 | 75.1 % (5105/6797) | 78.8 % (1165/1478) | 92.2 % (200/217) | 76.2 % (6470/8492) |
| 2019 | 75.8 % (5011/6615) | 81.8 % (1203/1471) | 89.5 % (213/238) | 77.2 % (6427/8324) |
| 2020 | 75.0 % (5074/6766) | 81.5 % (1573/1930) | 83.8 % (305/364) | 76.7 % (6952/9060) |
| 2021 | 74.9 % (5416/7231) | 78.9 % (1924/2437) | 84.1 % (427/508) | 76.3 % (7767/10176) |
| 2022 | 76.7 % (5452/7111) | 85.4 % (2281/2670) | 83.9 % (437/521) | 79.3 % (8170/10302) |
| 2023 | 78.6 % (5351/6807) | 88.2 % (1888/2140) | 83.6 % (250/299) | 81.0 % (7489/9246) |
| 2024 | 79.4 % (3556/4477) | 85.9 % (1356/1578) | 86.0 % (228/265) | 81.3 % (5140/6320) |
| **alle** | 76.1 % | 82.9 % | 85.9 % | 77.9 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.5994 Pp, t 2.43, n 92; IC 0.0905 (t 5.78, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto 0.0788 Pp, t 0.68, n 92; IC 0.0089 (se 0.0045, t 1.99) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 69969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `groesse-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `groesse.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

