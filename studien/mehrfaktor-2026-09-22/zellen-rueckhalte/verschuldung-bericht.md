# Faktorzelle `verschuldung`

Erzeugt 2026-09-23T20:42:51.576Z von `zelle.js` (mehrfaktor-2026-09-22/zelle/v1.1). Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9904017 Zeilen, 7338 Reihen, bis 2026-09-15). Klassen 50-250 / 250-1000 / ab1000. Signaltage 116 (2017-01-03 … 2026-08-03), erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags. **Rückhaltefenster ab 2024-09-01: GEÖFFNET.** Lauf 7.5 s, RSS max 1266 MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Definition:** (roh.vermoegen - roh.eigenkapital) / roh.vermoegen aus dem juengsten Filing mit filed < t (Bestaende D0, Tor 456 Tage); Verhaeltnis, hoeher = staerker verschuldet (Werte > 1 bei negativem Eigenkapital sind echte Werte); Kontrollgroesse, kein Signal  
**Quellen:** Panel querschnitt-pruefstand-2026-09-13/panel/v2; Fundamentaltafel fundamentaltafel-2026-09-16/v1

## 1. Einzelmessung (Diagnose, kein Urteil)

Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag 21; MDE₈₀ = 2.8016 × se.

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.3891 | 0.1472 | 2.65 | 2.83 | 0.4125 | 116 |
| Dezil oben − Universum, **netto** | 0.3868 | 0.1472 | 2.64 | 2.81 | 0.4124 | 116 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0.2926 | 0.3754 | 0.78 | - | 1.0518 | 116 |
| Long − Short, netto | 0.2962 | 0.3755 | 0.79 | - | 1.0519 | 116 |

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) | 798.9 |
| davon mit Wert (Mittel) | 675.8 |
| Dezil oben / unten (Mittel) | 68.0 / 67.1 |
| Dezil unten − Universum brutto / netto | 0.0964 / 0.0906 Pp |
| Umschlag Dezil / Universum je Monat | 11.3 % / 8.3 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0.0100 / 0.0077 Pp |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 15 (0) / 5 |
| Signaltage unter 100 Mitgliedern (übersprungen) | 0 |
| Regime (SPY über / unter EMA200), netto | 0.3867 (n 96) / 0.3872 (n 20) Pp |

### Jahresscheiben (netto, Dezil oben − Universum)

| Jahr | n | brutto | netto | se | t | MDE₈₀ | IC (n) | |
|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0.7608 | 0.7573 | 0.4997 | 1.58 | 1.4000 | 0.0105 (12) |  |
| 2018 | 12 | 0.3692 | 0.3663 | 0.3983 | 0.96 | 1.1159 | 0.0179 (12) |  |
| 2019 | 12 | 0.5003 | 0.4975 | 0.3239 | 1.60 | 0.9073 | 0.0074 (12) |  |
| 2020 | 12 | 0.4126 | 0.4095 | 0.6314 | 0.68 | 1.7689 | -0.0236 (12) |  |
| 2021 | 12 | 0.6715 | 0.6701 | 0.5606 | 1.25 | 1.5705 | 0.0443 (12) |  |
| 2022 | 12 | -0.3109 | -0.3127 | 0.4759 | -0.69 | 1.3333 | 0.0591 (12) |  |
| 2023 | 12 | 0.5053 | 0.5025 | 0.4736 | 1.11 | 1.3269 | -0.0087 (12) |  |
| 2024 | 12 | 1.0585 | 1.0567 | 0.2887 | 3.82 | 0.8089 | 0.0537 (12) |  |
| 2025 | 12 | -0.0056 | -0.0069 | 0.2845 | -0.03 | 0.7970 | 0.0079 (12) |  |
| 2026 | 8 | -0.3009 | -0.3014 | 0.6843 | -0.47 | 1.9172 | 0.0067 (8) | dünn |

**Letzte 250 Tage** (Signaltag ≥ 2025-08-04): netto -0.4016 Pp (se 0.4622, t -0.91, MDE₈₀ 1.2950, n 12), brutto -0.4010 Pp.

**Rang-IC** (Spearman je Signaltag zwischen Rohwert (nur Mitglieder mit Wert) und Halteperioden-Rendite je Mitglied aus `halte`, brutto; se = sd/√n über die Signaltage): **Mittel 0.0179, se 0.0089, t 2.00, MDE₈₀ 0.0251, n 116**; letzte 12 Signaltage -0.0077 (n 12); Paare je Signaltag im Mittel 675.8.

## 2. Abdeckung (Anteil des Universums mit Wert)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 80.4 % (5320/6615) | 89.5 % (1148/1282) | 93.4 % (142/152) | 82.1 % (6610/8049) |
| 2018 | 81.6 % (5546/6797) | 89.1 % (1317/1478) | 93.1 % (202/217) | 83.2 % (7065/8492) |
| 2019 | 82.6 % (5465/6615) | 91.7 % (1349/1471) | 93.3 % (222/238) | 84.5 % (7036/8324) |
| 2020 | 81.7 % (5528/6766) | 91.0 % (1756/1930) | 91.2 % (332/364) | 84.1 % (7616/9060) |
| 2021 | 80.3 % (5805/7231) | 89.5 % (2180/2437) | 87.4 % (444/508) | 82.8 % (8429/10176) |
| 2022 | 81.3 % (5778/7111) | 91.6 % (2447/2670) | 90.6 % (472/521) | 84.4 % (8697/10302) |
| 2023 | 83.2 % (5662/6807) | 93.5 % (2001/2140) | 91.6 % (274/299) | 85.8 % (7937/9246) |
| 2024 | 84.0 % (5607/6676) | 92.5 % (2175/2351) | 92.5 % (381/412) | 86.5 % (8163/9439) |
| 2025 | 82.0 % (6011/7327) | 92.7 % (2934/3165) | 92.5 % (633/684) | 85.7 % (9578/11176) |
| 2026 | 82.2 % (4187/5096) | 92.8 % (2451/2642) | 93.7 % (624/666) | 86.4 % (7262/8404) |
| **alle** | 81.9 % | 91.6 % | 91.8 % | 84.6 % |

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 19.8932 Pp, sd 6.67, Mittel/sd 2.98, t 32.25, n 116; Long − Short 36.1516 Pp; IC (x = y aus `halte`) 1.0000000000, min 1.0000000000, n 116; nachrichtlich IC des Dezil-Orakels (orakelPeriode) gegen y 0.9997 | Dezil − Universum ≥ 5 Pp (horizontgleich, Teil 3), Mittel/sd ≥ 1, t ≥ 8; Long − Short ≥ 20 Pp (Δ Teil 4); \|IC − 1\| < 1e-9 (Mittel und jeder Signaltag); nachrichtlich einseitig 20 Pp: verfehlt | **bestanden** |
| Placebo 1 — Werte +21 Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto 0.3718 Pp, t 2.55, n 116; IC 0.0162 (t 1.80, nur Diagnose) | \|t\| < 3 (\|Mittel\| < 0.25 Pp: nein, nachrichtlich) | **bestanden** |
| Placebo 2 — Symbole je Signaltag permutiert | brutto -0.1985 Pp, t -1.79, n 116; IC -0.0016 (se 0.0033, t -0.48) | \|t\| < 3 für Dezil und IC (\|Mittel\| < 0.25 Pp: ja, nachrichtlich) | **bestanden** |
| Zufall × 12 | Mittel brutto 0.0006, netto+Kosten 0.0083 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0.1011 Pp. IC: Mittel -0.0007, se je Ziehung 0.0033, \|t\| ≥ 3 in 0 | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen; IC: \|Mittel\| < 0.01, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1; Leser 92668 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | **bestanden** |

**MDE-Boden aus den Zufallsdezilen:** 0.2833 Pp je Monat (2.8016 × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils 90.4 %. **MDE-Boden des IC aus den Zufallsziehungen:** 0.0094 (2.8016 × mittlere se(IC) einer Ziehung; ein echtes Signal streut über die Zeit stärker, Faktor 2–4).

Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.

**Nullpunkt gesamt: bestanden.** Details, Placebo-Werte und Periodenreihen: `verschuldung-nullpunkt.json`.

## 4. Rang- und Dezilregel

Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `verschuldung.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.

**Rang-IC** (Vorregistrierung Nachtrag 3): je Signaltag Paare (x, y) — Feldzelle: Mitglieder mit Wert; Kombination: alle Mitglieder, Aufgefüllte mit mittlerem Rang —, beide Seiten frisch gerankt (Gleichstand = mittlerer Rang), Pearson der Ränge; kein IC unter 100 Paaren. y = Halteperioden-Rendite des Mitglieds aus derselben Haltefunktion wie Dezil und Universum (`halte` mit einem Mitglied: Eröffnung(a) → Eröffnung(a′), Tote = Totalverlust, brutto, Pp). Fundamentaltafel: `fundamentaltafel-2026-09-16/v1.1`.

