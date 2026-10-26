# Tracking Error eines 19-Werte-Momentum-Buchs gegen den S&P 500 (Schätzung aus öffentlichen Daten)

Stand 04.10.2026. Status: Zwischenstand, wird fortlaufend ergänzt. Simulation, keine Anlageberatung.
Kennzeichnung: **[GEMESSEN]** = selbst aus heruntergeladenen Dateien gerechnet; **[SCHÄTZUNG]** = Annahme/Gedächtnis, nicht belegt.

## 1. Gemessen: Ken-French-Daten (heruntergeladen am 04.10.2026, CRSP-Stand 202608)

Quellen (alle abgerufen, Rechenskript: `/tmp/.../scratchpad/f/te.py`, nicht im Repo):
- https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/10_Portfolios_Prior_12_2_CSV.zip (Top-Dezil „Hi PRIOR", Monatsrenditen, value-weighted = VW und equal-weighted = EW)
- https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip (Markt = Mkt-RF + RF)
- https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Momentum_Factor_CSV.zip (Mom-Faktor, Long-Short)

Methode: Überrendite = Top-Dezil minus Markt (monatlich, arithmetisch), TE = SD × √12. „Quartal" = 3 Monate aufgezinst, nicht überlappend, SD je Quartal; p.a. = ×2 (√4).
Wichtige Einschränkung: Das Dezil ist Prior 12-2 (nicht exakt 11-1/12-1), monatlich neu sortiert (nicht vierteljährlich), enthält **hunderte Werte inkl. Klein-/Mittelwerte** (NYSE-Breakpoints, ganzes CRSP-Universum), Markt ist CRSP-Gesamtmarkt, nicht S&P 500. Das ist also der **diversifizierte** Momentum-Anteil, die Untergrenze für ein 19-Werte-Buch.

| Quelle | Zeitraum | Monate | TE p. a. (SD Überrendite) | Beta zum Markt | Überrendite p. a. | Quartals-SD (Pp) → p. a. |
|---|---|---|---|---|---|---|
| FF Top-Dezil VW | 2017-01 – 2021-06 | 54 | **11,3 %** | 1,04 | +3,1 | 5,2 → 10,4 |
| FF Top-Dezil VW | 2017-01 – 2021-12 | 60 | **11,8 %** | 1,01 | +0,1 | 5,9 → 11,7 |
| FF Top-Dezil VW | 2021-07 – 2026-08 | 62 | **19,0 %** | 1,33 | +7,6 | 14,5 → 29,0 |
| FF Top-Dezil VW | 2022-01 – 2025-12 | 48 | 13,5 % | 1,18 | +6,1 | 7,6 → 15,1 |
| FF Top-Dezil VW | 2017-01 – 2026-08 | 116 | 15,9 % | 1,19 | +5,5 | 11,1 → 22,1 |
| FF Top-Dezil VW | 2003-01 – 2026-08 | 284 | 13,1 % | 1,15 | +3,1 | 8,2 → 16,3 |
| FF Top-Dezil VW | 1994-01 – 2026-08 | 392 | 13,7 % | 1,15 | +4,2 | 7,8 → 15,6 |
| FF Top-Dezil EW | 2017-01 – 2021-12 | 60 | 15,6 % | 1,18 | +1,7 | nicht ausgewertet |
| FF Top-Dezil EW | 2021-07 – 2026-08 | 62 | 14,6 % | 1,16 | −7,9 | nicht ausgewertet |
| FF Top-Dezil VW | nur 2020 | 12 | 8,7 % | 0,96 | +17,5 | – |
| FF Top-Dezil VW | nur 2024 | 12 | 12,8 % | 1,31 | +25,8 | – |

(EW-Zeilen: nur Monats-TE hier eingetragen.)

Residual-TE nach Marktbeta-Bereinigung ist fast identisch zur TE (z. B. 11,8 % vs. 11,8 %; 19,0 % vs. 18,3 %): der Großteil der Abweichung ist **nicht Marktbeta, sondern Stil-/Faktorrisiko** (Momentum-Wetten auf Sektoren, Crash/Reversal).
Mom-Faktor (Long-Short) zur Einordnung: SD 13,8 % p. a. (2017–21), 14,1 % (2021-07 ff.), 16,7 % (1994 ff.).

Befund: **Die TE ist zeitvariabel und in 2021–26 etwa 1,6-fach so hoch wie in 2017–21** (11,8 → 19,0 % p. a. beim diversifizierten Dezil; Beta stieg von 1,0 auf 1,3). Das geht in die gleiche Richtung wie der Projekt-Rückblick (Faktor 1,8).

## 2. Veröffentlichte ETF-Zahlen (Websuche, 04.10.2026) – NICHT als TE gegen den S&P 500 verwendbar

| Quelle | Angabe | Bewertung |
|---|---|---|
| MTUM, Seeking Alpha / Trackinsight (https://seekingalpha.com/symbol/MTUM/risk) | 3-Jahres-TE 2,14 % | Vermutlich gegen den **eigenen Index** (MSCI USA Momentum SR), nicht gegen S&P 500. Misst Replikationsgüte, nicht aktives Risiko. Unbrauchbar. |
| QMOM (Alpha Architect), Seeking Alpha / Suchsnippet (https://seekingalpha.com/symbol/QMOM/risk) | TE 1 J. 2,57 %, 3 J. 2,35 %, 5 J. 3,23 % | Bezugsgröße unklar, bei ≈50 gleichgewichteten Titeln und 3-J.-Rendite 19,7 % p. a. (Fondsseite, Stand 30.09.2026) gegen S&P 500 völlig unplausibel niedrig. Unbrauchbar. |
| SPMO, Suchsnippet (https://seekingalpha.com/symbol/SPMO/risk) | TE 1 J. 1,44 %, 3 J. 2,20 %, 5 J. 2,70 %; Beta 1,21–1,29; Vola 17,9 % | Bei Beta 1,2–1,3 gegen S&P 500 sind 2,2 % TE nicht möglich; offenbar gegen eigenen Index. Nur Beta/Vola taugen als Beleg für „Beta > 1". |
| Alpha-Architect-Fondsseite QMOM (https://funds.alphaarchitect.com/qmom) | nur Renditen (Stand 30.09.2026: 1 J. 12,34 %, 3 J. 19,74 %, 5 J. 8,89 %, 10 J. 11,92 % p. a., NAV); **keine** TE-/Active-Share-/Beta-Angabe | Rendite ja, TE nein. |
| MTUM-Factsheet (iShares), SPMO-Prospekt, AQR-Papiere, veröffentlichte Active-Share-Zahlen | **nicht abgerufen / nicht abrufbar** in dieser Sitzung | Keine Zahl eingetragen. Aus Gedächtnis: Momentum-ETFs auf Large-Cap haben Active Share grob 70–90 %, bei QMOM höher; **nicht belegt**. |

Fazit: aus den ETF-Quellen lässt sich keine belastbare TE gegen den S&P 500 entnehmen. Tragfähig sind nur die selbst gerechneten Ken-French-Werte (Abschnitt 1). Die Suchsnippets sind Sekundärquellen (KI-Zusammenfassung von Webseiten), nicht an den Originalen geprüft.

## 3. Skalierung auf 19 Werte (Konzentration)

Ansatz [SCHÄTZUNG, Modell nachvollziehbar]: Die Dezil-TE aus Abschnitt 1 ist Faktor-/Stilrisiko plus Rest-Idiosynkrasie eines sehr breiten Portfolios. Für N gleichgewichtete Titel gilt für den idiosynkratischen Teil näherungsweise σ_idio,Portfolio ≈ σ_idio,Einzelwert / √N (Unkorreliertheit der Residuen, gleiche Gewichte).
- σ_idio,Einzelwert gegen Markt+Faktoren: für US-Großwerte grob **25–40 % p. a.** (Annahme aus Gedächtnis, hier nicht gemessen; Momentum-Gewinner liegen eher oben, Namen wie TSLA/NVDA/PLTR weit darüber).
- 19 Werte: 30 / √19 = **6,9 % p. a.** (25 → 5,7; 40 → 9,2).
- Das VW-Dezil ist selbst nicht unendlich diversifiziert (Mega-Caps dominieren, effektives N grob 50–100, Annahme). Zuwachs deshalb: TE₁₉ = √(TE_Dezil² + σ²·(1/19 − 1/N_eff)).

Ergebnis [rechnerisch aus obigen Annahmen] (Spanne über σ = 25/30/40 % und N_eff = 60 bzw. ∞):

| Basis | TE Dezil | TE 19 Werte |
|---|---|---|
| 2017–2021 | 11,8 % | **12,7 – 14,9 %** |
| 2021–2026 | 19,0 % | **19,6 – 21,1 %** |
| 2017–2026 | 15,9 % | 16,6 – 18,4 % |
| 1994–2026 | 13,7 % | 14,5 – 16,5 % |

Lehre: Quadratisch addiert, bringt die Konzentration nur +1 bis +3 Pp. **Der Haupttreiber ist Faktor-/Regimerisiko, nicht Stock-Picking.** Nicht abgebildet: Fat Tails einzelner Titel (ein 5-%-Gewicht mit +300 % im Jahr verschiebt die Buch-Überrendite um 15 Pp), vierteljährliche statt monatliche Umschichtung (macht Positionen länger veraltet, eher mehr Risiko), 11-1 statt 12-2 (kaum Unterschied), S&P 500 statt CRSP-Gesamtmarkt (Großwert-Momentum hat gegen S&P 500 eher etwas weniger Marktbeta-Abweichung, aber Sektorkonzentration in Tech).

## 4. Abgleich mit dem Projekt-Rückblick

Umrechnung geprüft [GEMESSEN/rechnerisch]:
- SD je Periode = SE × √n: 2,79 × √19 = **12,16 Pp**; 4,94 × √20 = **22,09 Pp**. Stimmt.
- Jährlich: 63 Handelstage ≈ ¼ Jahr, also × √4 = 2: **24,3 bzw. 44,2 Pp**. Stimmt (setzt unkorrelierte Perioden voraus).
- Statistische Unsicherheit: bei n = 19–20 Perioden hat jede SD-Schätzung ±16 % Standardfehler (≈ 1/√(2(n−1))), also 2017–21: grob 20–28, 2021–26: 37–51 Pp p. a.

Vergleich mit den Ken-French-Quartalswerten (nicht überlappend, SD je Quartal):

| Zeitraum | Projekt (19 Werte) je Periode | FF-Dezil VW je Quartal | implizit nötige Konzentrations-SD je Periode | entspricht σ_idio je Einzelwert |
|---|---|---|---|---|
| 2017–21 | 12,2 Pp | 5,9 Pp | √(12,2² − 5,9²) = 10,7 Pp (≈ 21 % p. a.) | ≈ 21 × √19 ≈ 93 % p. a. |
| 2021–26 | 22,1 Pp | 14,5 Pp | √(22,1² − 14,5²) = 16,7 Pp (≈ 33 % p. a.) | ≈ 145 % p. a. |

Einordnung:
- Der Rückblick liegt **das 1,5- bis 2-Fache** über der Dezil-TE und lässt sich durch Konzentration allein **nicht** erklären (nötige Einzelwert-Idiosynkrasie 90–145 % ist unrealistisch). Mögliche Ursachen (nicht geprüft, zur Klärung): (a) Definition des „Abstands" (Abstand zu was? Instrument/Vorlauf – vgl. Audit-Punkt 21 – Hebel- oder Schein-Instrument, Kosten?), (b) Ausreißer-Perioden mit Einzeltiteln (2020: TSLA/Tech-Schub; 2024: NVDA), die bei n = 19–20 die SD dominieren, (c) überlappende oder unterschiedlich lange Perioden, (d) Auswahl nur aus den größten Werten mit höherer Titelvola als das breite Dezil.
- 2020/2024: Das breite Dezil lieferte 2020 **+17,5 Pp** und 2024 **+25,8 Pp** Überrendite (Jahreswerte, selbst gerechnet) bei Beta ≈ 1,0 bzw. 1,3. Solche Schübe sind **Mittelwertverschiebungen** von rund 4–6 Pp je Quartal, also etwa eine halbe Quartals-SD. Sie erklären, dass die SD im Zeitraum 2021–26 höher ausfällt (2021-07 ff. 19 % statt 11,8 %), aber nicht den vollen Faktor 44 vs. 24.
- Konsistent ist die **Richtung**: 2021–26 ist deutlich riskanter als 2017–21 (FF: ×1,6, Projekt: ×1,8). Die Größenordnung im Projekt (24/44 Pp p. a.) ist als **Obergrenze/Stressfall** lesbar, nicht als Normalfall.
- Konsequenz für die Vorwärtstest-Planung: Wer die Projekt-SD (24–44 Pp) nimmt, verlangt viel längere Beobachtung als bei 13–20 Pp (Stichprobenzahl ∝ σ²: Faktor ≈ 3–5).

## 5. Was gemessen und was nicht ist

- Gemessen: alle Zahlen in Abschnitt 1 und die Rechnungen in 3 und 4 (rechnerisch) auf Basis der Ken-French-Dateien.
- Geschätzt/Gedächtnis: σ_idio je Einzelwert 25–40 %, N_eff des VW-Dezils, Active-Share-Spannen, Aussagen zu Fat Tails.
- Sekundär, ungeprüft, unverwendet: ETF-TE-Zahlen aus Suchsnippets (Abschnitt 2).
- Nicht abrufbar: MTUM-/SPMO-Originalfactsheets, AQR-Papiere, Active-Share-Zahlen.
- Grenzen der FF-Reihe: Prior 12-2 monatlich, Gesamtmarkt-CRSP, enthält Klein-/Mittelwerte; überschätzt oder unterschätzt ein 19-Werte-S&P-500-Buch in beide Richtungen.

## Empfohlene Eingaben für den Rechner

TE (annualisierte SD der Überrendite, 19-Werte-Buch gegen S&P 500):

| Szenario | TE p. a. | Begründung |
|---|---|---|
| niedrig | **13 %** | ruhiges Regime 2017–21 (Dezil 11,8 %) plus Konzentrationszuschlag |
| mittel | **17 %** | langfristig/gemischt 2017–26 (Dezil 15,9 %, 1994 ff. 13,7 %) plus Zuschlag |
| hoch | **21 %** | Regime 2021–26 (Dezil 19,0 %) plus Zuschlag, entspricht auch ca. 10,5 Pp je Quartal |

Zusätzlich als Stresstest, nicht als Standard: **24 %** (Projekt-Rückblick 2017–21); der Wert 44 % (2021–26) ist durch öffentliche Daten nicht gestützt und sollte nur nach Klärung der Definition des „Abstands" (Abschnitt 4) verwendet werden.
