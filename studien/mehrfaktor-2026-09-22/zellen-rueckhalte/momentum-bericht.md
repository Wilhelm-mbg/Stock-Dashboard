# Faktorzelle `momentum`

Erzeugt 2026-09-23T20:41:20.967Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 5.5 s, RSS max 1100 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** 100 * (bSchluss(21 Panelzeilen vor t) / bSchluss(252 Panelzeilen vor t) - 1) in Pp; hoeher = besser (12-1-Momentum)  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2 (v2.1), Spalte bSchluss

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 1.0721 | 0.5004 | 2.15 | 2.30 | 1.4018 | 116 |
| Dezil oben − Universum, **netto** | 1.0547 | 0.5004 | 2.12 | 2.27 | 1.4018 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 1.4120 | 0.7499 | 1.89 | - | 2.1009 | 116 |
| Long − Short, netto | 1.4135 | 0.7498 | 1.89 | - | 2.1005 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 798.6 |
| Dezil oben / unten (Mittel) | 80.3 / 79.4 |
| Dezil unten − Universum brutto / netto | -0.3399 / -0.3587 Pp |
| Umschlag Dezil / Universum je Monat | 30.5 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0251 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 58 (0) / 12 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.8557 (n 96) / 2.0102 (n 20) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.4094 | 0.3914 | 0.6101 | 0.67 | 1.7091 | 0.0075 (12) |  |
| 2018 | 12 | 0.4796 | 0.4605 | 1.2068 | 0.40 | 3.3809 | 0.0279 (12) |  |
| 2019 | 12 | 0.6684 | 0.6471 | 1.0559 | 0.64 | 2.9581 | 0.0043 (12) |  |
| 2020 | 12 | 3.4130 | 3.3944 | 1.1807 | 3.00 | 3.3080 | 0.0462 (12) |  |
| 2021 | 12 | 0.4902 | 0.4746 | 2.9407 | 0.17 | 8.2386 | -0.0563 (12) |  |
| 2022 | 12 | 0.6869 | 0.6717 | 1.3988 | 0.50 | 3.9187 | 0.0774 (12) |  |
| 2023 | 12 | -0.2321 | -0.2528 | 0.7813 | -0.34 | 2.1889 | -0.0185 (12) |  |
| 2024 | 12 | 2.5918 | 2.5743 | 1.5824 | 1.70 | 4.4332 | 0.0649 (12) |  |
| 2025 | 12 | 1.8576 | 1.8435 | 1.6315 | 1.18 | 4.5708 | 0.0158 (12) |  |
| 2026 | 8 | -0.0017 | -0.0131 | 2.8577 | -0.00 | 8.0062 | -0.0260 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto 1.1711 Pp (se 2.1322, t 0.57, MDE₈₀ 5.9736, n 12), brutto 1.1828 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0157, se 0.0174, t 0.90, MDE₈₀ 0.0489, n 116**; letzte 12 Signaltage 0.0034 (n 12); Paare je Signaltag im Mittel 798.6.

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
| 2024 | 100.0 % (6675/6676) | 100.0 % (2351/2351) | 100.0 % (412/412) | 100.0 % (9438/9439) |
| 2025 | 99.9 % (7323/7327) | 100.0 % (3165/3165) | 99.9 % (683/684) | 100.0 % (11171/11176) |
| 2026 | 100.0 % (5096/5096) | 100.0 % (2642/2642) | 100.0 % (666/666) | 100.0 % (8404/8404) |
| **alle** | 100.0 % | 100.0 % | 100.0 % | 100.0 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 1.1808 Pp, t 2.40, n 116; IC 0.0244 (t 1.38, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto 0.0943 Pp, t 1.02, n 116; IC 0.0001 (se 0.0032, t 0.04) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser nicht benutzt | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `momentum-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `momentum.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: nicht benutzt.

