# Faktorzelle `kombination`

Erzeugt 2026-09-23T20:45:10.675Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 4.8 s, RSS max 1303 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** Gleichgewichtete Rangkombination nach VORREGISTRIERUNG-KOMBINATION.md §5 (REGISTRIERT 23.09.2026 22:16, Siegel 71f8da3; Auftrag Nr. 62): Kombinationsrang = Summe w_f R_f / Summe w_f über momentum, schwankung, bewertung, ertragskraft, investition, sue, fue (Gewichte {"momentum":1,"schwankung":1,"bewertung":1,"ertragskraft":1,"investition":1,"sue":1,"fue":1}); fehlendes Feld = mittlerer Rang (n+1)/2, Auffüllungen je Dezil gezählt; Kontrollen nur berichtet: groesse, verschuldung. Teststatistik: mittlerer Rang-IC über die Signaltage (Nachtrag 3); Dezil oben, Long-Short, Dezil unten, Jahresscheiben, Regime sind Diagnose.  
**Quellen:** zellen/momentum.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:41:20.967Z, Tafel nicht benutzt); zellen/schwankung.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:41:33.208Z, Tafel nicht benutzt); zellen/bewertung.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:41:49.149Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/ertragskraft.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:42:04.918Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/investition.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:42:20.006Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/sue.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:42:28.007Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/fue.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:42:35.826Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/groesse.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:41:41.551Z, Tafel fundamentaltafel-2026-09-16/v1.1); zellen/verschuldung.json (mehrfaktor-2026-09-22/zelle/v1.1, Stand 2026-09-23T20:42:51.576Z, Tafel fundamentaltafel-2026-09-16/v1.1)

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | -0.1859 | 0.2281 | -0.82 | -0.83 | 0.6391 | 116 |
| Dezil oben − Universum, **netto** | -0.2022 | 0.2281 | -0.89 | -0.90 | 0.6389 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | -0.2266 | 0.6045 | -0.38 | - | 1.6936 | 116 |
| Long − Short, netto | -0.2265 | 0.6044 | -0.38 | - | 1.6934 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 798.9 |
| Dezil oben / unten (Mittel) | 80.4 / 79.4 |
| Dezil unten − Universum brutto / netto | 0.0407 / 0.0243 Pp |
| Umschlag Dezil / Universum je Monat | 29.6 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0240 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 7894 / 5294 |
| Tote im Dezil oben (Totalverlust) / Lücken | 24 (0) / 11 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.0485 (n 96) / -1.4051 (n 20) Pp |

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
| 2024 | 12 | 0.6366 | 0.6196 | 0.3922 | 1.65 | 1.0988 | 0.0477 (12) |  |
| 2025 | 12 | -0.7549 | -0.7716 | 0.5755 | -1.40 | 1.6123 | -0.0110 (12) |  |
| 2026 | 8 | 0.2894 | 0.2772 | 0.8948 | 0.33 | 2.5070 | 0.0463 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto 0.0695 Pp (se 0.6483, t 0.11, MDE₈₀ 1.8163, n 12), brutto 0.0833 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0118, se 0.0152, t 0.78, MDE₈₀ 0.0426, n 116**; letzte 12 Signaltage 0.0346 (n 12); Paare je Signaltag im Mittel 798.9.

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
| Placebo 1 — Werte +21 Handelstage | übersprungen: Placebo Versatz gehoert in die Feldzellen; eine Kombination hat an t + 21 keine Werte | — | — |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.0659 Pp, t -0.64, n 116; IC -0.0001 (se 0.0032, t -0.04) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser nicht benutzt | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `kombination-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `kombination.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: nicht benutzt.

