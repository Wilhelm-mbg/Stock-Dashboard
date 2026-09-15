# Ergebnis — Querschnitts-Prüfstand, **Teil 3**: Trend reiten

Erzeugt 2026-09-15T22:36:47.977Z von `bericht-teil3.js` aus `teil3-ergebnis.json` (Lauf 2026-09-15T22:28:27.462Z, 8 s).
Vorregistrierung: **`VORREGISTRIERUNG-TEIL3.md`** (erster Commit, vor jeder Zahl). Konfiguration `querschnitt-pruefstand-2026-09-13/teil3/v1`,
Panel `querschnitt-pruefstand-2026-09-13/panel/v1`, 9.899.585 Tageszeilen, 7300 Reihen, bis 2026-09-11.
Alle Renditen sind **Kursrenditen ohne Ausschüttungen**; Kasse verzinst sich mit null. Alles Simulation mit virtuellem Kapital, **keine Anlageberatung**.

## Urteil in vier Zeilen

| Frage | Antwort |
|---|---|
| Hält die Maschine auf dem erweiterten Universum (Leck, Klinke, Orakel, Zufall, Identität, Regression)? | **ja** — alle Kontrollen bestanden |
| Bildet V0 den bekannten Faktor ab (Long-Short gegen Frenchs `Mom`)? | **bestanden** — ρ = 0.812 über 114 Monate (Schranke ≥ 0,5) |
| Besteht eine Absicherung den gepaarten Vergleich (kleinerer Rückgang **und** nicht signifikant schlechter)? | **keine** — V1 und V3 sind signifikant schlechter; V1 hat sogar den größeren Rückgang; V2 und V3 halbieren zwar Rückgang bzw. Streuung, verlieren aber signifikant Rendite |
| Zielportfolio | **V0 Grundlinie** — 115 Dateien unter `zielportfolio/momentum-v0/` (115 Umschichtungen, 0 Regimewechsel). **Die Absicherung trägt nicht** — geschrieben wird die Grundlinie. |

## 1. Kontrollen auf dem erweiterten Universum (§T3.6)

| Kontrolle | Schranke (vorab) | Ergebnis | Urteil |
|---|---|---|---|
| Leck-Sperrklinke der Maschine | Leck-Probe > 0, saubere Probe 0, V0-Lauf 0 | 90595 / 0 / 0 | **bestanden** |
| Sperrklinke der Überlagerung | V1/V2/V3 sauber 0; präparierte Fälle > 0 und ungültig | sauber 0/0/0; präpariert V1 2408 (Regime an t+1), V2 112 (Fenster bis t+1) | **bestanden** |
| Orakel `orakelTag/monat` | brutto und netto ≥ 2 Pp (nur Pp-Schranke) | brutto +4.015, netto +3.954 Pp (t 11.9, Mittel/sd 1.10 nachrichtlich) | **bestanden** |
| Orakel `orakelPeriode/monat` | brutto ≥ 5 Pp, Mittel/sd ≥ 1, t ≥ 8 | brutto +20.123 Pp, Mittel/sd 3.05, t 33.0 | **bestanden** |
| Zufall, 12 Ziehungen | \|Mittel\| < 0.25 Pp brutto und netto+Kosten; ≤ 3 Ziehungen \|t\| ≥ 3 | -0.0256 / -0.0164 Pp (Schranke = 8.0 se des Mittels); 0 Ziehungen | **bestanden** |
| Identität V0-Überlagerung = Maschine (T3-P1) | Tagesreihe 1e-9, Kosten 1e-12 | 2409 Tage, max \|Abw\| 1.1e-14 / 1.1e-14 | **bestanden** |
| Regression `klassen [2, 3]` = Teil 2 (T3-P12) | netto +1,609984 Pp auf 1e-9 | +1.609984 Pp | **bestanden** |

**Alle Kontrollen bestanden.** Die Maschine ist auf dem erweiterten Universum verrohrungsgeprüft.

## 2. Universum und Grundlinie V0 (§T3.2)

| Größe | Wert |
|---|---|
| Perioden (Monate) | 115 (2017-02 … 2026-08) |
| Universum je Umschichtung (Mittel) | **782** Papiere — Klassen 50-250 / 250-1000 / ab1000: 562 / 185 / 35 |
| Dezil (Mittel) | **77.7** Papiere — 51.3 / 19.9 / 6.5 |
| Umschlag V0 | 32.0 % je Monat (Vorprüfung 29,3 %) |
| Kosten V0 (gemessen) | 0.0261 Pp je Monat (Vorprüfung 0,018 … 0,025) |
| Tote im gehaltenen Dezil | 56 über 115 Perioden, davon 0 Totalverlust |
| Verworfen je Umschichtung (Summe): Klasse / Quelle / Cent-Boden / Vortage / Qualität / Ausführung / Rang NaN | 356.609 / 0 / 1.574 / 7.662 / 12.952 / 39 / 652 |

### V0 gegen Universum und gegen SPY — Kontext, kein Test

| Vergleich | brutto (Pp/Monat) | netto (Pp/Monat) | se (Monate) | t (Monate) | t (Tage, HH Lag 21) | **MDE₈₀** (Pp/Monat) | Dividendenzeile |
|---|---|---|---|---|---|---|---|
| V0 − Universum (Maschine, Hauptgröße) | +1.1190 | +1.1022 | 0.4949 | +2.24 | +2.36 | 1.387 | -0.0744 (übertragen aus Teil 2) |
| V0 − Universum (Überlagerung) | +1.1190 | +1.1022 | 0.4949 | +2.24 | +2.36 | 1.387 | — |
| **V0 − SPY** | +1.0008 | +0.9747 | 0.5466 | +1.79 | +1.91 | 1.531 | -0.0642 (Spanne -0.089 … -0.039; SPY-Rendite **Annahme** 1,6 %) |

Eigene Reihen, netto je Monat: V0 +2.1422 Pp (sd 8.30), Universum +1.0401 Pp (sd 5.54), SPY +1.1675 Pp (sd 4.76).
Die Dividendenzeile gegen das Universum ist die Teil-2-Messung (−0,0744 Pp je Monat, t −6,4) mal Zeit im Markt — **übertragen**, nicht neu gemessen;
gegen SPY ist die Dezil-Rendite (0,83 % je Jahr) Messung aus Teil 2 und die SPY-Rendite eine Annahme (1,3 … 1,9 %). Beide Zeilen sind klein gegen den Überschuss.

## 3. Außen-Prüfstein: Long-Short gegen Frenchs `Mom` (§T3.7)

| Größe | Wert |
|---|---|
| **ρ (Pearson, Versatz 0, Feld `lsBrutto`)** | **0.8121** über 114 Monate (2017-02 … 2026-07) |
| ρ (Spearman) | 0.7946 |
| Versatz −1 / 0 / +1 | -0.105 / 0.812 / -0.082 — Maximum bei 0 |
| β (unsere Reihe auf `Mom`), Vorzeichen gleich | 1.569 (se 0.107), 94 von 114 |
| je Kalenderjahr | 2017 0.84, 2018 0.93, 2019 0.84, 2020 0.96, 2021 0.77, 2022 0.40, 2023 0.91, 2024 0.73, 2025 0.78, 2026 0.93 |
| Diagnose (nachrichtlich): Long − Universum / Short − Universum | 0.504 / -0.759 |
| **Urteil** | **bestanden** (Schranken ≥ 0,5 bestanden · 0,2–0,5 teilweise · < 0,2 gefallen) |

Vom Referenzfaktor stehen hier nur abgeleitete Größen; die Werte selbst bleiben außerhalb des Repos. Teil 2 lieferte auf dem engen Universum 0,73 in derselben Fassung — das erweiterte Universum hat den Gleichlauf **nicht** verschlechtert.

## 4. Die vier Varianten (§T3.3/§T3.4)

| Variante | brutto | netto | Umschlag (davon Schalten) | Kosten (Pp) | Zeit im Markt | Schaltungen | Monate in Kasse | **max. Rückgang** | schlechtestes 12-M-Fenster | Sharpe | vs Universum netto (t, MDE₈₀) | vs SPY netto (t, MDE₈₀) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **V0 Grundlinie** | +2.168 | +2.142 | 32.0 % (0.0 %) | 0.0261 | 100.0 % | 0 | 0 | **37.4 %** (2020-02-19 → 2020-03-18) | -22.5 % (2021-07…2022-06) | 0.89 | +1.102 (t +2.24, MDE 1.39) | +0.975 (t +1.79, MDE 1.53) |
| **V1 Regime-Schalter** | +1.403 | +1.358 | 56.1 % (28.7 %) | 0.0448 | 83.0 % | 66 | 20 | **37.6 %** (2021-02-09 → 2023-10-23) | -27.0 % (2018-10…2019-09) | 0.63 | +0.318 (t +0.53, MDE 1.69) | +0.191 (t +0.32, MDE 1.70) |
| **V2 Volatilitaetsbremse** | +1.032 | +1.015 | 21.1 % (0.0 %) | 0.0172 | 58.4 % | 0 | 0 | **30.6 %** (2020-02-19 → 2020-03-18) | -11.1 % (2018-10…2019-09) | 0.81 | -0.025 (t -0.07, MDE 0.96) | -0.153 (t -0.47, MDE 0.91) |
| **V3 Regime + Bremse** | +0.733 | +0.706 | 33.8 % (15.5 %) | 0.0272 | 50.6 % | 66 | 20 | **21.0 %** (2018-09-28 → 2019-10-02) | -20.6 % (2018-10…2019-09) | 0.60 | -0.334 (t -0.76, MDE 1.23) | -0.462 (t -1.16, MDE 1.12) |
| Universum (gleichgewichtet) | +1.049 | +1.040 | 10.2 % | 0.0092 | 100 % | — | — | 39.8 % (2020-02-20 → 2020-03-23) | -24.2 % (2019-04…2020-03) | 0.65 | — | -0.127 (t -0.70, MDE 0.51) |
| SPY (Kursreihe, ohne Kosten) | +1.168 | +1.168 | 0.0 % | 0.0000 | 100 % | — | — | 34.2 % (2020-02-19 → 2020-03-23) | -19.3 % (2022-01…2022-12) | 0.85 | — | — |

Alle Zahlen je Monat in Pp, n = 115 Monate; Umschlag und Kosten enthalten das Ein- und Ausschalten. Zeit im Markt = mittlerer Einsatz über die Handelstage.
V2/V3: Anlaufregel (weniger als 60 V0-Tage) in 3 Perioden mit e = 1; σ₆₀ der V0-Reihe lag zwischen 14.2 und 70.6 % je Jahr (Median 27.8 %) — gegen ein Ziel von 15 % steht die Bremse die meiste Zeit bei e ≈ 0,5.
V1/V3: 66 Regimewechsel mitten im Monat (je Jahr: 2018 12, 2019 3, 2020 8, 2022 22, 2023 13, 2025 6, 2026 2); geteilte Grenztage: max. Abweichung der Zerlegung vom Schluss-zu-Schluss-Mittel 6.2e-2 Pp, unteilbare Fälle 0. Regimewert fehlte 0-mal.

## 5. Die gepaarten Vergleiche gegen V0 (§T3.5) — das Urteil

„Besser" heißt vorab: **kleinerer maximaler Rückgang** und **nicht signifikant schlechtere Nettorendite** (t ≥ −1,96, naiv auf den Monaten **und** Hansen-Hodrick auf den Tagen).

| Variante | Δ netto (Pp/Monat) | se (Monate) | t (Monate) | t (Tage, HH) | **MDE₈₀** (Pp/Monat) | MDD V | MDD V0 | ΔMDD (Pp) | kleinerer MDD | nicht signifikant schlechter | **Urteil** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **V1 Regime-Schalter** | -0.7838 | 0.3820 | -2.06 | -2.86 | 1.070 | 37.6 % | 37.4 % | +0.21 | ✗ | ✗ | **nicht bestanden** |
| **V2 Volatilitaetsbremse** | -1.1275 | 0.4201 | -2.70 | -2.88 | 1.177 | 30.6 % | 37.4 % | -6.87 | ✓ | ✗ | **nicht bestanden** |
| **V3 Regime + Bremse** | -1.4363 | 0.5115 | -2.82 | -3.44 | 1.433 | 21.0 % | 37.4 % | -16.42 | ✓ | ✗ | **nicht bestanden** |

Lesart der MDE-Spalte: eine Verschlechterung unter ≈ 1,96 · se (V1 0.75, V2 0.82, V3 1.00 Pp je Monat) hätte der Test **nicht** als „schlechter" erkannt — die drei Verschlechterungen liegen alle darüber.

## 6. Krisentafel (§T3.4) — Wilhelms Härtetest

Je Fenster: verkettete Nettorendite, maximaler Rückgang **innerhalb** des Fensters, Zeit im Markt. Für V1–V3 daneben die gepaarte Monatsdifferenz zu V0 mit MDE₈₀ — bei 3 bis 10 Monaten ist sie groß, und genau das steht hier.

### Q4 2018 (2018-10 … 2018-12, 3 Monate)

| Reihe | Rendite | max. Rückgang im Fenster | Zeit im Markt | Δ zu V0 (Pp/Monat) | se | **MDE₈₀** |
|---|---|---|---|---|---|---|
| V0 Grundlinie | -25.4 % | 30.0 % | 100 % | — | — | — |
| V1 Regime-Schalter | -28.1 % | 27.6 % | 30 % | -1.23 | 4.39 | 12.31 |
| V2 Volatilitaetsbremse | -16.3 % | 18.4 % | 59 % | +3.43 | 2.43 | 6.82 |
| V3 Regime + Bremse | -19.5 % | 19.0 % | 21 % | +2.22 | 4.65 | 13.03 |
| Universum (gleichgewichtet) | -18.1 % | 21.3 % | 100 % | — | — | — |
| SPY (Kursreihe, ohne Kosten) | -15.8 % | 19.7 % | 100 % | — | — | — |

### Crash 2020 (2020-02 … 2020-04, 3 Monate)

| Reihe | Rendite | max. Rückgang im Fenster | Zeit im Markt | Δ zu V0 (Pp/Monat) | se | **MDE₈₀** |
|---|---|---|---|---|---|---|
| V0 Grundlinie | -5.9 % | 37.4 % | 100 % | — | — | — |
| V1 Regime-Schalter | -11.5 % | 19.5 % | 32 % | -3.30 | 10.48 | 29.37 |
| V2 Volatilitaetsbremse | -12.2 % | 30.6 % | 64 % | -3.29 | 6.47 | 18.13 |
| V3 Regime + Bremse | -10.4 % | 18.5 % | 31 % | -2.91 | 10.84 | 30.37 |
| Universum (gleichgewichtet) | -16.1 % | 39.8 % | 100 % | — | — | — |
| SPY (Kursreihe, ohne Kosten) | -11.8 % | 34.2 % | 100 % | — | — | — |

### Momentum-Einbruch 2020-11 bis 2021-06 (2020-11 … 2021-06, 8 Monate)

| Reihe | Rendite | max. Rückgang im Fenster | Zeit im Markt | Δ zu V0 (Pp/Monat) | se | **MDE₈₀** |
|---|---|---|---|---|---|---|
| V0 Grundlinie | +72.7 % | 33.1 % | 100 % | — | — | — |
| V1 Regime-Schalter | +72.7 % | 33.1 % | 100 % | +0.00 | 0.00 | 0.00 |
| V2 Volatilitaetsbremse | +27.7 % | 11.2 % | 35 % | -4.55 | 2.94 | 8.24 |
| V3 Regime + Bremse | +27.7 % | 11.2 % | 35 % | -4.55 | 2.94 | 8.24 |
| Universum (gleichgewichtet) | +46.3 % | 5.9 % | 100 % | — | — | — |
| SPY (Kursreihe, ohne Kosten) | +29.9 % | 4.1 % | 100 % | — | — | — |

### Baisse 2022 (2022-01 … 2022-10, 10 Monate)

| Reihe | Rendite | max. Rückgang im Fenster | Zeit im Markt | Δ zu V0 (Pp/Monat) | se | **MDE₈₀** |
|---|---|---|---|---|---|---|
| V0 Grundlinie | +1.2 % | 24.3 % | 100 % | — | — | — |
| V1 Regime-Schalter | -10.2 % | 17.2 % | 27 % | -1.52 | 2.52 | 7.06 |
| V2 Volatilitaetsbremse | +1.9 % | 9.8 % | 43 % | -0.25 | 1.63 | 4.57 |
| V3 Regime + Bremse | -4.9 % | 8.3 % | 12 % | -1.00 | 2.68 | 7.51 |
| Universum (gleichgewichtet) | -17.6 % | 25.5 % | 100 % | — | — | — |
| SPY (Kursreihe, ohne Kosten) | -18.1 % | 25.4 % | 100 % | — | — | — |

## 7. Jahresscheiben und Aktualität (netto, Pp je Monat)

| Jahr | n | V0 | se V0 | **MDE₈₀ V0** | V1 | V2 | V3 | Universum | SPY |
|---|---|---|---|---|---|---|---|---|---|
| 2017 | 11 | +1.11 | 0.74 | 2.09 | +1.11 | +0.86 | +0.86 | +1.26 | +1.47 |
| 2018 | 12 | -0.55 | 2.33 | 6.52 | -0.70 | +0.07 | -0.15 | -0.99 | -0.58 |
| 2019 | 12 | +2.65 | 1.74 | 4.87 | +1.12 | +1.20 | +0.57 | +2.37 | +2.39 |
| 2020 | 12 | +6.06 | 3.42 | 9.57 | +4.27 | +1.53 | +1.43 | +2.33 | +1.59 |
| 2021 | 12 | +1.99 | 3.14 | 8.80 | +1.99 | +0.78 | +0.78 | +1.60 | +2.05 |
| 2022 | 12 | -0.15 | 2.51 | 7.05 | -1.49 | -0.06 | -0.73 | -1.43 | -1.57 |
| 2023 | 12 | +2.04 | 1.85 | 5.18 | +1.07 | +1.40 | +0.76 | +1.53 | +1.80 |
| 2024 | 12 | +3.07 | 2.40 | 6.73 | +3.07 | +1.77 | +1.77 | +1.06 | +1.91 |
| 2025 | 12 | +3.11 | 2.26 | 6.33 | +1.79 | +1.80 | +1.25 | +1.33 | +1.31 |
| 2026 *(dünn)* | 8 | +1.91 | 3.66 | 10.26 | +1.33 | +0.66 | +0.42 | +1.51 | +1.41 |

| letzte 250 Handelstage (ab 2025-09-12) | n | netto (Pp/Monat) | se | t | **MDE₈₀** |
|---|---|---|---|---|---|
| V0 Grundlinie | 11 | +1.689 | 2.932 | +0.60 | 8.21 |
| V1 Regime-Schalter | 11 | +1.269 | 3.016 | +0.44 | 8.45 |
| V2 Volatilitaetsbremse | 11 | +0.832 | 1.229 | +0.71 | 3.44 |
| V3 Regime + Bremse | 11 | +0.658 | 1.266 | +0.55 | 3.55 |
| Universum (gleichgewichtet) | 11 | +1.331 | 0.764 | +1.83 | 2.14 |
| SPY (Kursreihe, ohne Kosten) | 11 | +1.334 | 1.143 | +1.22 | 3.20 |

## 8. Die Vorprüfungen gegen die Messung (§T3.8)

| Größe | vorab geschätzt | gemessen | Befund |
|---|---|---|---|
| Umschlag V0 je Monat | 29.3 % | 32.0 % | stimmt |
| Kosten V0 je Monat | 0.0184 … 0.0250 Pp | 0.0261 Pp | stimmt (Dezil überwiegend 50-250, Faktor Kante/Kosten 43) |
| MDE₈₀ V0 gegen Universum | 0.91 … 1.74 Pp | 1.39 Pp (se 0.495) | in der Spanne — die √(22/80)-Skalierung war zu optimistisch, die Faktorstreuung schrumpft nicht mit |
| se der Paardifferenz V1 − V0 | 0.23 Pp | 0.382 Pp (Faktor 1.66) | **falsche Vorprüfung** — V1 schaltet 66-mal statt ~16-mal, die Kasse-Anteile sind größer und die Monatsstreuung von V0 ist 8,3 statt 6 Pp |
| se der Paardifferenz V2 − V0 | 0.14 Pp | 0.420 Pp (Faktor 3.00) | **falsche Vorprüfung** — e liegt bei ~0,5 statt 0,8 und die V0-Streuung bei 8,3 statt 6 Pp |
| se der Paardifferenz V3 − V0 | 0.27 Pp | 0.512 Pp (Faktor 1.89) | **falsche Vorprüfung** — beide Fehler zusammen |
| Regimewechsel V1 | ~1,7 je Jahr | 6.9 je Jahr | **falsche Vorprüfung** — ein täglicher EMA200-Schalter ohne Hysterese pendelt in Seitwärtsphasen; 2022 allein 22 Wechsel |

## 9. Zielportfolio (§T3.10)

Geschrieben für **V0 Grundlinie**: 115 Dateien unter `zielportfolio/momentum-v0/` — je Umschichtung Datum, Signaltag, Einsatzquote, Regimezustand, σ₆₀, Kürzel, Gewicht, Klasse. **Die Absicherung trägt nicht**; geschrieben ist die Grundlinie V0 mit Einsatz 1 — das ist das vorregistrierte Ergebnis für diesen Fall, kein Ausfall. Die Dateien sind Simulationsausgabe und die Schnittstelle zum Momentum-Buch des Mittelfrist-Depots, keine Anlageempfehlung.

## 10. Was Teil 3 **nicht** sagt

- „Momentum > 0" wurde nicht getestet; V0 gegen Universum (t +2.24) und gegen SPY (t +1.79) stehen als Kontext mit MDE₈₀ 1.39 bzw. 1.53 Pp je Monat — gegen SPY ist der Überschuss **nicht** auf 5 % gesichert.
- „Nicht bestanden" heißt für V2 und V3 nicht, dass sie wertlos sind: sie senken den Rückgang und die Streuung, aber nach der vorregistrierten Regel kostet das signifikant Rendite. Eine andere Dosierung (z. B. Vol-Ziel 25 %, EMA mit Hysterese) wäre eine **neue** Vorregistrierung, kein Nachlegen hier.
- Die Absicherungskosten sind gemessen, die verpasste Rendite ist der eigentliche Preis: V1 verliert -0.78 Pp je Monat bei 83 % Zeit im Markt.
- Alle Reihen sind Kursrenditen; die Dividendenzeilen sind übertragen bzw. Annahme (§2) und klein gegen die Effekte.
- Long-Short (Außen-Prüfstein) verlangt Leihe und ist im Projekt gesperrt — es dient hier nur der Verrohrungsprüfung.
