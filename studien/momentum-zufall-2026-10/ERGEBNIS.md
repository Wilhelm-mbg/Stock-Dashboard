# Momentum-Buch gegen 200 Zufallsbücher aus demselben Korb (Auftrag Nr. 100)

**Urteil nach der Regel: nicht entscheidbar.** Momentum-Buch über dem 95. Perzentil der Zufallsbücher: A nein, B ja; Median der Zufallsbücher vor SPY: A nein, B nein. Regel (vorab, `REGEL.md`, Siegel `7b0ddb2`): „die Auswahl trägt" nur bei Momentum über P95 in beiden Fenstern; „der Korb trägt", wenn das nicht gilt und der Median in beiden Fenstern vor SPY endet; sonst „nicht entscheidbar".

| Start am ersten Tag (k = 0), mit Regel K | **Fenster A** 04.01.2017–15.09.2021 | **Fenster B** 16.09.2021–15.09.2026 |
|---|---|---|
| Momentum-Buch, Endwert (Abstand zu SPY p. a.) | **259.238,74 $** (+4,72 Pp) | **250.123,14 $** (+7,51 Pp) |
| S&P 500 (SPY mit Ausschüttungen) | 215.535,73 $ | 181.193,87 $ |
| **Rang des Momentum-Buchs** (Zufallsbücher darüber) | **15 von 201** (14 von 200) | **3 von 201** (2 von 200) |
| Zufallsbücher: 95. Perzentil | 267.094,55 $ (+5,50 Pp) | 211.372,39 $ (+3,53 Pp) |
| Zufallsbücher: Median | 198.694,94 $ (−2,02 Pp) | 148.223,88 $ (−4,44 Pp) |
| Zufallsbücher: 5. Perzentil | 155.664,83 $ (−7,89 Pp) | 104.553,40 $ (−11,74 Pp) |
| Zufallsbücher: Minimum / Maximum | 135.590,76 / 353.698,37 $ | 89.194,90 / 281.640,49 $ |
| Anteil der Zufallsbücher vor SPY | 55 von 200 (27,5 %) | 28 von 200 (14,0 %) |
| Ganzer Korb gleich gewichtet (187 Ziele) gegen SPY | 240.023,51 $ (+2,73 Pp p. a.) — vor SPY | 162.482,33 $ (−2,43 Pp p. a.) — hinter SPY |
| größter Rückschlag: Momentum / Median der Zufallsbücher / ganzer Korb | −49,0 / −35,0 / −33,6 % | −56,9 / −35,6 / −30,9 % |

**Verteilung Fenster A** (Abstand der 200 Zufallsbücher zu SPY, Pp p. a.; Momentum-Buch +4,72): −12 bis −10: 3 · −10 bis −8: 6 · −8 bis −6: 11 · −6 bis −4: 43 · −4 bis −2: 39 · −2 bis +0: 43 · +0 bis +2: 24 · +2 bis +4: 12 · +4 bis +6: 12 · +6 bis +8: 4 · +10 bis +12: 1 · +12 bis +14: 2.

**Verteilung Fenster B** (Abstand der 200 Zufallsbücher zu SPY, Pp p. a.; Momentum-Buch +7,51): −16 bis −14: 2 · −14 bis −12: 4 · −12 bis −10: 23 · −10 bis −8: 24 · −8 bis −6: 22 · −6 bis −4: 33 · −4 bis −2: 35 · −2 bis +0: 29 · +0 bis +2: 10 · +2 bis +4: 11 · +4 bis +6: 4 · +6 bis +8: 2 · +10 bis +12: 1.

**Beschreibend — 63 Starttage (kein Urteil).** Fenster A: Momentum-Buch Median der 63 Abstände +7,27 Pp p. a. (63 von 63 vor SPY); die Bücher 1–50 im Median −1,18 (Spanne −2,64 bis +0,18), 0 von 50 Buch-Medianen über dem des Momentum-Buchs; je Starttag liegen im Median 1,0 der 50 Bücher vor dem Momentum-Buch, vor allen 50 in 27 von 63 Starttagen; 1229 von 3.150 Buch-Phasen vor SPY (39,0 %); ganzer Korb Median +2,97 (63 von 63 vor SPY). Fenster B: Momentum-Buch Median der 63 Abstände +8,25 Pp p. a. (61 von 63 vor SPY); die Bücher 1–50 im Median −5,35 (Spanne −6,73 bis −4,00), 0 von 50 Buch-Medianen über dem des Momentum-Buchs; je Starttag liegen im Median 0,0 der 50 Bücher vor dem Momentum-Buch, vor allen 50 in 51 von 63 Starttagen; 392 von 3.150 Buch-Phasen vor SPY (12,4 %); ganzer Korb Median −2,68 (0 von 63 vor SPY).

**Geprüft vor dem Lauf.** Selbstprüfung (Momentum-Buch mit Regel K, k = 0, im selben Prozess): A-187 259.238,74 $ gegen 215.535,73 $ (Nr. 96: 259.238,74 / 215.535,73 — getroffen); B-187 250.123,14 $ gegen 181.193,87 $ (Nr. 96: 250.123,14 / 181.193,87 — getroffen). Durchreich-Probe über den eigenen Zwischenspeicher: A-187 auf das Bit gleich, B-187 auf das Bit gleich. 63 Startphasen des Momentum-Buchs gegen Nr. 96: A 63 von 63 gleich, B 63 von 63 gleich. Ziehungen: 7.800 geprüft (Zahl, Korb, doppelt, Referenzreihe). Korrekturen nach dem Siegel: keine.

*Auftrag Nr. 100, Kennung `momentum-zufall-2026-10/v1`, Panel `querschnitt-pruefstand-2026-09-13/panel/v2.3` Bau 2c. Zufallsbuch = je Umschichtungstag 19 Werte ohne Zurücklegen aus den 187 zulässigen des Korbs (geseedet je Buch und Stichtag, `REGEL.md` Teil C 3; alle Listen für k = 0 in `ziehungen.json`); sonst alles wie das Momentum-Buch (Mechanik der App mit Regel K 5 %, 20 Bp je Seite, Takt 63, Ausschüttungen, Reihenenden, 100.000 $). Alle 200 Endwerte je Fenster in `ergebnis.json`. Alles Simulation, keine Anlageberatung.*
