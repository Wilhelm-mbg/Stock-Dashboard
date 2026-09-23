# Faktorzelle `investition`

Erzeugt 2026-09-23T20:42:20.006Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 6.9 s, RSS max 1243 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** -100 * (roh.vermoegen / vermoegenVor - 1) in Pp: Vermoegenswachstum ueber vier Quartale (Assets am Stichtag D0 gegen Assets am Stichtag D4 = vier Quartale davor, Zeilenfeld vermoegenVor) aus dem juengsten 10-K/10-Q mit filed vor dem Signaltag, gedreht - hoeher = weniger Vermoegenswachstum = besser; null, wenn Filing fehlt oder ein Bestand fehlt oder <= 0 ist  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.2407 | 0.2152 | 1.12 | 0.94 | 0.6028 | 116 |
| Dezil oben − Universum, **netto** | 0.2308 | 0.2152 | 1.08 | 0.90 | 0.6029 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.1125 | 0.4768 | -0.24 | - | 1.3359 | 116 |
| Long − Short, netto | -0.1139 | 0.4768 | -0.24 | - | 1.3359 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 670.3 |
| Dezil oben / unten (Mittel) | 67.4 / 66.6 |
| Dezil unten − Universum brutto / netto | 0.3532 / 0.3447 Pp |
| Umschlag Dezil / Universum je Monat | 20.4 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0176 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 24 (1) / 11 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.1256 (n 96) / 0.7359 (n 20) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.3689 | -0.3794 | 0.5884 | -0.67 | 1.6485 | -0.0579 (12) |  |
| 2018 | 12 | -0.0798 | -0.0892 | 0.4154 | -0.22 | 1.1637 | -0.0358 (12) |  |
| 2019 | 12 | -0.2081 | -0.2156 | 0.4070 | -0.55 | 1.1403 | -0.0392 (12) |  |
| 2020 | 12 | -0.1256 | -0.1382 | 0.7940 | -0.18 | 2.2245 | -0.0789 (12) |  |
| 2021 | 12 | 2.1052 | 2.0963 | 1.2724 | 1.72 | 3.5647 | 0.0576 (12) |  |
| 2022 | 12 | 0.4071 | 0.3970 | 0.6170 | 0.67 | 1.7286 | 0.0926 (12) |  |
| 2023 | 12 | -0.1508 | -0.1617 | 0.6830 | -0.25 | 1.9135 | -0.0214 (12) |  |
| 2024 | 12 | -0.4226 | -0.4334 | 0.3035 | -1.49 | 0.8503 | -0.0331 (12) |  |
| 2025 | 12 | 0.6737 | 0.6652 | 0.5390 | 1.29 | 1.5101 | -0.0032 (12) |  |
| 2026 | 8 | 0.7449 | 0.7355 | 0.2966 | 2.65 | 0.8310 | 0.0535 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto 0.8719 Pp (se 0.2985, t 3.05, MDE₈₀ 0.8362, n 12), brutto 0.8818 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel -0.0086, se 0.0115, t -0.75, MDE₈₀ 0.0321, n 116**; letzte 12 Signaltage 0.0407 (n 12); Paare je Signaltag im Mittel 670.3.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 78.8 % (5214/6615) | 88.2 % (1131/1282) | 93.4 % (142/152) | 80.6 % (6487/8049) |
| 2018 | 81.0 % (5507/6797) | 88.0 % (1301/1478) | 93.1 % (202/217) | 82.5 % (7010/8492) |
| 2019 | 81.9 % (5419/6615) | 90.3 % (1329/1471) | 92.4 % (220/238) | 83.7 % (6968/8324) |
| 2020 | 81.2 % (5493/6766) | 89.9 % (1735/1930) | 90.7 % (330/364) | 83.4 % (7558/9060) |
| 2021 | 79.7 % (5766/7231) | 88.6 % (2158/2437) | 87.2 % (443/508) | 82.2 % (8367/10176) |
| 2022 | 80.5 % (5724/7111) | 90.8 % (2425/2670) | 90.4 % (471/521) | 83.7 % (8620/10302) |
| 2023 | 82.5 % (5616/6807) | 93.0 % (1990/2140) | 91.6 % (274/299) | 85.2 % (7880/9246) |
| 2024 | 83.5 % (5574/6676) | 92.3 % (2171/2351) | 91.7 % (378/412) | 86.1 % (8123/9439) |
| 2025 | 81.7 % (5983/7327) | 91.9 % (2908/3165) | 92.3 % (631/684) | 85.2 % (9522/11176) |
| 2026 | 81.8 % (4168/5096) | 92.5 % (2443/2642) | 91.7 % (611/666) | 85.9 % (7222/8404) |
| **alle** | 81.2 % | 90.8 % | 91.2 % | 83.9 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.1967 Pp, t 0.95, n 116; IC -0.0099 (t -0.89, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1256 Pp, t -1.12, n 116; IC 0.0037 (se 0.0033, t 1.13) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 92668 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `investition-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `investition.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

