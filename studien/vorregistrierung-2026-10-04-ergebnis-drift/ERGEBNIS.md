Im Rückblick über fünf Jahre (16.09.2021 bis 15.09.2026) schlägt das Ergebnis-Drift-Buch den S&P 500 nach Kosten: **ja** — Buch +84,2 % (13,01 % p. a.), S&P 500 +81,2 % (12,63 % p. a.), Abstand +0,38 Pp p. a.; von 200 Zufallsbüchern liegen 16 über dem Buch (Mitte +56,6 %, 5 %–95 %: +34,4 bis +88,2 %). **Kein Vorwärtstest angezeigt.**

Urteil der Stufe 1 (Abstand zum Klassen-Tagesmittel, Ereignis-Mittel, Tor t ≥ 2,5 bei H = 60 für A und B netto): **nicht entscheidbar** — H = 60: A +2,09 Pp (t 1,67), B +1,57 Pp (t 2,23), B netto +1,39 Pp (t 1,97, obere 95-%-Schranke +2,78 Pp), M −0,01 Pp, B − M +1,58 Pp (t 2,72); daneben H = 20: A +1,18 Pp (t 2,22), B +0,60 Pp (t 1,71), B netto +0,43 Pp (t 1,21, obere 95-%-Schranke +1,12 Pp), M +0,04 Pp, B − M +0,56 Pp (t 1,85). (Tor verfehlt, obere 95-%-Schranke von B netto nicht unter 1 Pp.)

*Auftrag Nr. 88, Kennung `vorregistrierung-2026-10-04-ergebnis-drift/v1`, Regel in `VORREGISTRIERUNG.md` (Siegel-Commit `8567df4`, vor dem Lauf). Einstiegstage 03.01.2017 bis 15.09.2021 bleiben verschlossen. Simulation mit virtuellem Kapital, keine Anlageberatung.*

| Stufe 1 | n oben / unten / alle | A | B | B netto | M | B − M | Fehler A / B netto | t A / B netto | obere Schranke B netto | MDE A / B (blind) |
|---|---|---|---|---|---|---|---|---|---|---|
| H = 60 | 1397 / 1429 / 14177 | +2,09 | +1,57 | +1,39 | −0,01 | +1,58 | 1,25 / 0,71 | 1,67 / 1,97 | +2,78 | 1,91 / 1,49 |
| H = 20 | 1399 / 1429 / 14184 | +1,18 | +0,60 | +0,43 | +0,04 | +0,56 | 0,53 / 0,35 | 2,22 / 1,21 | +1,12 | 1,06 / 0,88 |

Alle Größen in Pp über die Haltedauer; Kosten des obersten Zehntels im Mittel 0,179 Pp je Umlauf. Fehler = der größere aus 200 Zufalls-Zuteilungen und der Tagesreihe (Newey-West, Lag H − 1).

**Placebo und Positivkontrolle (H = 60).** Placebo (letzte Ziffer der Akzessionsnummer): A +0,16 Pp (+0,23 eigene Fehler), B − M +0,41 Pp (+0,93 eigene Fehler) — Soll innerhalb ±2: eingehalten. Positivkontrolle: ein eingepflanzter Abstand von 1,91 Pp (MDE) erreicht t ≥ 2 in 78,5 % der Zufallsläufe (mindestens 65 %): bestanden. H = 20: Placebo A +0,92 / B − M +1,32 eigene Fehler, Positivkontrolle 79,0 %.

| Stufe 2 | Buch | S&P 500 (SPY) | Abstand |
|---|---|---|---|
| Endwert aus 100.000 $ | 184.237 $ | 181.194 $ | +3.043 $ |
| p. a. (4,997 Jahre) | +13,01 % | +12,63 % | +0,38 Pp |
| 2021 | +5,19 % | +6,88 % | −1,70 Pp |
| 2022 | −10,91 % | −18,16 % | +7,25 Pp |
| 2023 | +11,13 % | +26,20 % | −15,07 Pp |
| 2024 | +12,24 % | +24,86 % | −12,63 Pp |
| 2025 | +25,91 % | +17,71 % | +8,20 Pp |
| 2026 | +25,18 % | +11,67 % | +13,51 Pp |
| größter Rückschlag (Tagesschlüsse) | −21,57 % | −24,51 % | |

**Das Buch.** 1399 Meldungen des obersten Zehntels: 756 gekauft (davon 28 mit dem Rest des SPY-Bestands), 615 verfallen (alle Plätze besetzt), 10 verfallen (kein SPY-Bestand), 18 Firma schon gehalten, 0 ohne Eröffnungskurs. 752 Verkäufe am 60. Handelstag (0 verschoben mangels Eröffnungskurs), 4 Reihenenden (davon 0 Totalverlust), 0 offen am Ende. Im Mittel 36,1 von 40 Plätzen besetzt (höchstens 40), 89,5 % des Kapitals in Aktien. Gezahlte Kosten 4.027 $ (Aktien 3.810 $, SPY-Handel 217 $). Zufallsbücher: 20 von 200 über dem S&P 500.

**Die zehn Positionen mit dem größten Beitrag** tragen zusammen 28.349 $ zum Abstand von +3.043 $; ohne sie stünde das Buch bei 155.888 $ (−3,34 Pp p. a. gegen den S&P 500). In den Zufallsbüchern beträgt dieselbe Summe in der Mitte 25.143 $ (5 %–95 %: 19.315 bis 38.914 $), in 59 von 200 ist sie größer als im Buch. CRDO 2026-03 +3.492 · TTMI 2026-02 +3.303 · ALAB 2025-05 +3.105 · STLD 2022-01 +2.937 · NUE 2022-01 +2.807 · GEV 2026-01 +2.738 · IMGN 2023-11 +2.627 · UPST 2025-05 +2.563 · AMD 2026-02 +2.417 · TENB 2026-04 +2.360.

**Grenzen.** Ein Fenster, eine Regel, ein Lauf. Zeitreihen-Überraschung aus dem später eingereichten Bericht, kein Analysten-Konsens; Annahmezeit der SEC statt Uhrzeit der Mitteilung; 2016, die ausländischen Werte ohne 8-K und 203 Firmen mit Kennungswechsel fehlen; SPY-Handelskosten 0,5 Basispunkte sind eine Annahme. Stufe 1 misst gegen das Klassen-Tagesmittel, Stufe 2 gegen den Index mit Kapitalbindung. Ereignisse: 14184 im Messfenster (25298 seit 2017, erwartet 25298). Korrekturen nach dem Siegel: keine. Alle Zahlen in `ergebnis.json`.
