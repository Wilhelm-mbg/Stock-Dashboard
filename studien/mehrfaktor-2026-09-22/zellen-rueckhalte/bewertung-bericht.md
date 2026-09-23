# Faktorzelle `bewertung`

Erzeugt 2026-09-23T20:41:49.149Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 7.1 s, RSS max 1252 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** B/M = roh.eigenkapital (Bestand D0 des juengsten 10-K/10-Q mit filed < t, Tor 456 Tage) / (roh.aktien desselben Filings x rohSchluss(t), unbereinigt); Verhaeltnis, hoeher = billiger = besser; negatives Eigenkapital ist ein Wert; null bei fehlender Groesse, aktien <= 0 oder rohSchluss <= 0  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | -0.0241 | 0.3145 | -0.08 | -0.09 | 0.8810 | 116 |
| Dezil oben − Universum, **netto** | -0.0300 | 0.3145 | -0.10 | -0.10 | 0.8810 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.5863 | 0.4553 | -1.29 | - | 1.2756 | 116 |
| Long − Short, netto | -0.5877 | 0.4552 | -1.30 | - | 1.2754 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 626.6 |
| Dezil oben / unten (Mittel) | 63.1 / 62.3 |
| Dezil unten − Universum brutto / netto | 0.5622 / 0.5577 Pp |
| Umschlag Dezil / Universum je Monat | 15.3 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0136 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 11 (0) / 9 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.0767 (n 96) / 0.1943 (n 20) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.9336 | -0.9375 | 0.9635 | -1.02 | 2.6994 | -0.0788 (12) |  |
| 2018 | 12 | -0.7695 | -0.7750 | 0.4979 | -1.63 | 1.3949 | -0.0891 (12) |  |
| 2019 | 12 | -0.8352 | -0.8403 | 0.7711 | -1.14 | 2.1603 | -0.0593 (12) |  |
| 2020 | 12 | -0.8915 | -0.8976 | 1.8671 | -0.50 | 5.2309 | -0.0762 (12) |  |
| 2021 | 12 | 1.7281 | 1.7247 | 1.1653 | 1.55 | 3.2646 | 0.0642 (12) |  |
| 2022 | 12 | 0.2367 | 0.2308 | 0.7288 | 0.33 | 2.0419 | 0.0594 (12) |  |
| 2023 | 12 | 0.4584 | 0.4515 | 0.8258 | 0.57 | 2.3135 | -0.0173 (12) |  |
| 2024 | 12 | -0.5186 | -0.5241 | 0.7039 | -0.78 | 1.9719 | -0.0343 (12) |  |
| 2025 | 12 | 0.4147 | 0.4069 | 0.8328 | 0.51 | 2.3333 | 0.0122 (12) |  |
| 2026 | 8 | 1.3156 | 1.3058 | 0.7948 | 1.76 | 2.2266 | 0.0565 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto 1.0313 Pp (se 0.5785, t 1.86, MDE₈₀ 1.6209, n 12), brutto 1.0409 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel -0.0188, se 0.0152, t -1.24, MDE₈₀ 0.0425, n 116**; letzte 12 Signaltage 0.0516 (n 12); Paare je Signaltag im Mittel 626.6.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 74.1 % (4900/6615) | 80.6 % (1033/1282) | 93.4 % (142/152) | 75.5 % (6075/8049) |
| 2018 | 74.6 % (5069/6797) | 78.8 % (1165/1478) | 92.2 % (200/217) | 75.8 % (6434/8492) |
| 2019 | 75.3 % (4980/6615) | 81.8 % (1203/1471) | 89.5 % (213/238) | 76.8 % (6396/8324) |
| 2020 | 74.5 % (5044/6766) | 81.1 % (1565/1930) | 83.2 % (303/364) | 76.3 % (6912/9060) |
| 2021 | 74.4 % (5381/7231) | 78.8 % (1921/2437) | 84.1 % (427/508) | 76.0 % (7729/10176) |
| 2022 | 76.3 % (5426/7111) | 85.3 % (2277/2670) | 83.9 % (437/521) | 79.0 % (8140/10302) |
| 2023 | 78.3 % (5327/6807) | 88.2 % (1888/2140) | 83.6 % (250/299) | 80.7 % (7465/9246) |
| 2024 | 79.0 % (5272/6676) | 86.0 % (2021/2351) | 85.0 % (350/412) | 81.0 % (7643/9439) |
| 2025 | 77.5 % (5678/7327) | 86.9 % (2750/3165) | 88.2 % (603/684) | 80.8 % (9031/11176) |
| 2026 | 77.5 % (3949/5096) | 87.3 % (2306/2642) | 91.1 % (607/666) | 81.7 % (6862/8404) |
| **alle** | 76.1 % | 84.1 % | 87.0 % | 78.4 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -1.7418 Pp, t -5.46, n 116; IC -0.0900 (t -6.00, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.2447 Pp, t -2.41, n 116; IC 0.0007 (se 0.0034, t 0.19) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 92668 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `bewertung-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `bewertung.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

