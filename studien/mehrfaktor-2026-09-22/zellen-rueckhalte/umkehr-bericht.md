# Faktorzelle `umkehr`

Erzeugt 2026-09-23T20:41:26.917Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 5.5 s, RSS max 1099 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** -100 * (bSchluss(t) / bSchluss(21 Panelzeilen vor t) - 1) in Pp, gedreht (Verlierer des letzten Monats oben); null bei fehlender Zeile am Signaltag, fehlender 21. Vorzeile oder Nenner <= 0  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.0275 | 0.3978 | 0.07 | 0.15 | 1.1145 | 116 |
| Dezil oben − Universum, **netto** | -0.0335 | 0.3978 | -0.08 | -0.01 | 1.1144 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.2755 | 0.6025 | -0.46 | - | 1.6880 | 116 |
| Long − Short, netto | -0.2763 | 0.6025 | -0.46 | - | 1.6879 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 798.9 |
| Dezil oben / unten (Mittel) | 80.4 / 79.5 |
| Dezil unten − Universum brutto / netto | 0.3030 / 0.2427 Pp |
| Umschlag Dezil / Universum je Monat | 84.7 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0687 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 15 (0) / 14 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | -0.3748 (n 96) / 1.6048 (n 20) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.2783 | 0.2204 | 0.7113 | 0.32 | 1.9927 | 0.0168 (12) |  |
| 2018 | 12 | 0.0960 | 0.0302 | 0.5010 | 0.06 | 1.4036 | 0.0150 (12) |  |
| 2019 | 12 | 0.9103 | 0.8444 | 0.6995 | 1.26 | 1.9598 | 0.0534 (12) |  |
| 2020 | 12 | 0.3800 | 0.3156 | 2.0648 | 0.16 | 5.7849 | -0.0579 (12) |  |
| 2021 | 12 | -0.0412 | -0.1003 | 1.5657 | -0.07 | 4.3864 | 0.0096 (12) |  |
| 2022 | 12 | -2.0593 | -2.1166 | 1.5610 | -1.42 | 4.3734 | -0.0281 (12) |  |
| 2023 | 12 | 1.5028 | 1.4408 | 1.8164 | 0.83 | 5.0889 | 0.0242 (12) |  |
| 2024 | 12 | -0.0988 | -0.1576 | 0.7997 | -0.21 | 2.2403 | -0.0044 (12) |  |
| 2025 | 12 | 0.0009 | -0.0598 | 0.5896 | -0.11 | 1.6518 | -0.0212 (12) |  |
| 2026 | 8 | -1.0545 | -1.1114 | 1.1425 | -1.04 | 3.2008 | -0.0573 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto -0.7201 Pp (se 0.8370, t -0.90, MDE₈₀ 2.3450, n 12), brutto -0.6630 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel -0.0032, se 0.0147, t -0.22, MDE₈₀ 0.0412, n 116**; letzte 12 Signaltage -0.0564 (n 12); Paare je Signaltag im Mittel 798.9.

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
| 2024 | 100.0 % (6676/6676) | 100.0 % (2351/2351) | 100.0 % (412/412) | 100.0 % (9439/9439) |
| 2025 | 100.0 % (7327/7327) | 100.0 % (3165/3165) | 100.0 % (684/684) | 100.0 % (11176/11176) |
| 2026 | 100.0 % (5096/5096) | 100.0 % (2642/2642) | 100.0 % (666/666) | 100.0 % (8404/8404) |
| **alle** | 100.0 % | 100.0 % | 100.0 % | 100.0 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto -15.5326 Pp, t -48.60, n 116; IC -0.9531 (t -357.90, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **GEFALLEN** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto 0.0563 Pp, t 0.56, n 116; IC -0.0010 (se 0.0033, t -0.29) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser nicht benutzt | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `umkehr-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `umkehr.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: nicht benutzt.

