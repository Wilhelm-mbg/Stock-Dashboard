# Faktorzelle `kombination`

Erzeugt 2026-09-23T20:34:37.676Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 92 (2017-01-03 … 2024-08-01), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: versiegelt (24 Signaltage zurückgehalten).** Lauf 5.4 s, RSS max 1245 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** Gleichgewichtete Rangkombination nach VORREGISTRIERUNG-KOMBINATION.md §5 (REGISTRIERT 23.09.2026 22:16, Siegel 71f8da3; Auftrag Nr. 62): Kombinationsrang = Summe w_f R_f / Summe w_f über momentum, schwankung, bewertung, ertragskraft, investition, sue, fue (Gewichte {"momentum":1,"schwankung":1,"bewertung":1,"ertragskraft":1,"investition":1,"sue":1,"fue":1}); fehlendes Feld = mittlerer Rang (n+1)/2, Auffüllungen je Dezil gezählt; Kontrollen nur berichtet: groesse, verschuldung. Teststatistik: mittlerer Rang-IC über die Signaltage (Nachtrag 3); Dezil oben, Long-Short, Dezil unten, Jahresscheiben, Regime sind Diagnose.  
**Quellen:** zellen/momentum.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:26:22.513Z, Tafel nicht benutzt); zellen/schwankung.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:26:29.970Z, Tafel nicht benutzt); zellen/bewertung.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:26:47.702Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/ertragskraft.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:26:59.566Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/investition.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:27:11.402Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/sue.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:27:17.249Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/fue.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:27:23.043Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/groesse.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:26:35.874Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/verschuldung.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-22T20:26:41.802Z, Tafel fundamentaltafel-2026-09-16/v1.1)

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | -0.1594 | 0.2653 | -0.60 | -0.57 | 0.7431 | 92 |
| Dezil oben − Universum, **netto** | -0.1759 | 0.2652 | -0.67 | -0.64 | 0.7429 | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.1410 | 0.7045 | -0.20 | - | 1.9738 | 92 |
| Long − Short, netto | -0.1406 | 0.7044 | -0.20 | - | 1.9734 | 92 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 760.5 |
| davon mit Wert (Mittel) | 760.5 |
| Dezil oben / unten (Mittel) | 76.5 / 75.6 |
| Dezil unten − Universum brutto / netto | -0.0184 / -0.0353 Pp |
| Umschlag Dezil / Universum je Monat | 29.4 % / 7.9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0239 / 0.0075 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 5933 / 4078 |
| Tote im Dezil oben (Totalverlust) / Lücken | 20 (0) / 11 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.0761 (n 75) / -1.2873 (n 17) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | -0.0405 | -0.0570 | 0.4492 | -0.13 | 1.2586 | -0.0178 (12) |  |
| 2018 | 12 | -0.2405 | -0.2561 | 0.2727 | -0.98 | 0.7640 | 0.0310 (12) |  |
| 2019 | 12 | -0.4567 | -0.4752 | 0.7306 | -0.68 | 2.0469 | -0.0361 (12) |  |
| 2020 | 12 | -2.0735 | -2.0887 | 0.8664 | -2.52 | 2.4272 | -0.0686 (12) |  |
| 2021 | 12 | 0.4115 | 0.3934 | 0.7467 | 0.55 | 2.0920 | 0.0543 (12) |  |
| 2022 | 12 | 1.3100 | 1.2958 | 0.7263 | 1.86 | 2.0348 | 0.1115 (12) |  |
| 2023 | 12 | -0.7819 | -0.7993 | 1.0393 | -0.80 | 2.9116 | -0.0277 (12) |  |
| 2024 | 8 | 0.9743 | 0.9583 | 0.3471 | 2.95 | 0.9724 | 0.0729 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0.6985 Pp (se 0.3882, t 1.88, MDE₈₀ 1.0876, n 12), brutto 0.7145 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0124, se 0.0180, t 0.69, MDE₈₀ 0.0505, n 92**; letzte 12 Signaltage 0.0536 (n 12); Paare je Signaltag im Mittel 760.5.

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
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 92; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage | übersprungen: Placebo Versatz gehoert in die Feldzellen; eine Kombination hat an t + 21 keine Werte | — | — |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1495 Pp, t -1.27, n 92; IC -0.0009 (se 0.0036, t -0.26) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto -0.0168, netto+Kosten -0.0093 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1104 Pp. IC: Mittel -0.0006, se je Ziehung 0.0038, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser nicht benutzt | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.3094 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.3 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0106 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `kombination-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `kombination.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: nicht benutzt.

