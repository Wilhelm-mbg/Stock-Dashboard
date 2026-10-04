Im Rückblick über fünf Jahre (16.09.2021 bis 15.09.2026) schlägt das Momentum-Buch den S&P 500 nach Kosten: **nein** — Buch +65,2 % (+10,57 % p. a.), S&P 500 +81,2 % (+12,63 % p. a.), Abstand −2,06 Pp p. a.; Startphasen: 41 von 63 vor dem Markt (−3,47 bis +7,89 Pp p. a.)

*Auftrag Nr. 74, Kennung `massstab-rueckblick-2026-10-04/v1`, Panel `querschnitt-pruefstand-2026-09-13/panel/v2.2`. Beschreibende Zahl nach der Regel in `REGEL.md` (vor dem Lauf festgelegt), kein Urteil über eine Kante. Alles Simulation, keine Anlageberatung.*

**Zufallsbereich.** Startphasen (63 Starttage, Ende für alle 15.09.2026): Abstand Minimum −3,47 / Median +1,62 / Maximum +7,89 Pp p. a.; 41 von 63 Phasen mit Buch > SPY. Periodenstreuung für k = 0: 20 Perioden, mittlerer Abstand +0,63 Pp je Periode, Standardfehler 3,07 Pp, 95-%-Band −5,79 bis +7,05 Pp (t = 2,093); 8 von 20 Perioden vor SPY.

| | Buch | S&P 500 (SPY) | Abstand |
|---|---|---|---|
| Gesamtertrag | +65,21 % | +81,19 % | −15,98 Pp |
| p. a. (4,997 Jahre) | +10,57 % | +12,63 % | −2,06 Pp |
| 2021 | −3,42 % | +6,88 % | −10,30 Pp |
| 2022 | −16,89 % | −18,16 % | +1,27 Pp |
| 2023 | +9,38 % | +26,20 % | −16,81 Pp |
| 2024 | +42,17 % | +24,86 % | +17,31 Pp |
| 2025 | +31,44 % | +17,71 % | +13,73 Pp |
| 2026 | +0,69 % | +11,67 % | −10,98 Pp |
| größter Rückschlag (Tagesschlüsse) | −40,16 % | −24,51 % | |
| nachrichtlich: reiner Kursertrag p. a. | +9,13 % | +11,11 % | −1,98 Pp |
| Ertrag aus Ausschüttungen p. a. | +1,44 Pp | +1,52 Pp | |

**Das Buch.** 20 Umschichtungen (570 Käufe, 483 Verkäufe), gezahlte Kosten 3348 $ bei 20 Basispunkten je Seite (mfdepot.js Zeile 158: MH.fuehreAus(d.mfBuch, plan, now, 20)); Tage mit `zuWenig`: 0; zulässige Werte je Umschichtung 515 bis 923, Zielzahl 52 bis 92; mittlerer Bargeldanteil 0,77 %. Reihenenden im Buch: 16 (uebernahme 11, umbenennung-ticker 3, fusion-aktientausch 1, null 1), davon als Totalverlust gebucht 0, als lebend geführt ohne Ende-Grund 1. Nachrichtlich: Regel „streng“ −2,06 Pp p. a., „milde“ −2,06 Pp p. a.

**Ausschüttungen.** Buch: 570 gehaltene Positionen, davon 570 mit und 0 ohne Maßnahmen-Datei; 493 Ausschüttungen gebucht (4797 $, größter Einzelsatz 19,32 %). SPY: 20 Ausschüttungen, Summe der Sätze je Anteil 34,07 $.

**Grenzen.** Ein Fenster, ein Parametersatz, 20 Perioden; die Zahl beschreibt die Vergangenheit dieses einen Buchs und trägt den Zufallsbereich oben. Der Korb ist das Panel (alle Aktienreihen mit den verschwundenen), nicht die Liste der App. Perioden, Umschichtungen, alle 63 Abstände und die Reihenenden stehen in `ergebnis.json`. Korrekturen nach dem Siegel: keine.

**Nachtrag nach dem Lauf (Diagnose des Chats; keine neue Messung, keine Zahl oben geändert).** (1) Die Hauptzahl hängt an der letzten, angebrochenen Periode (25.06.–15.09.2026): Buch −25,1 % gegen SPY +3,3 %; zum Schluss des 24.06.2026 stand das Buch bei 220.500 $ gegen rund 175.400 $ beim Maßstab. Nachgesehen: 71 Positionen, Median −27,7 %, 9 im Plus, kein Tagessprung unter −35 % (kein Sprung aus einer Split-Bereinigung), größtes Gewicht 4,2 %. (2) Der „Ertrag aus Ausschüttungen p. a." des Buchs (+1,44 Pp) ist nach Lesart C.7 die Differenz zweier Nachläufe und enthält einen Pfadeffekt; die gebuchten Ausschüttungen selbst sind 0,81 % p. a. des mittleren Buchwerts (117.997 $). (3) Das Buch hält weniger Werte als die Zielzahl (48 bis 78 gegen 52 bis 92): `fuehreAus` kauft in Zielreihenfolge, bis das Bargeld verbraucht ist. (4) Ein Reihenende ohne Ende-Grund: POWL (letzte Zeile 03.09.2026, im Panel als lebend geführt), zum letzten Kurs ausgebucht (1.707 $).
