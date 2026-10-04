Vorab-Rechnung des PM, **eine Rechnung ohne unabhängige Gegenprobe:** Mit einem Korb wie in der App (je Stichtag die 187 umsatzstärksten Aktien, Zielzahl 19) schlägt die Regel des Momentum-Buchs den S&P 500 im Rückblick über fünf Jahre (16.09.2021 bis 15.09.2026) nach Kosten: **ja** — Buch +154,9 % (+20,59 % p. a.), S&P 500 +81,2 % (+12,63 % p. a.), Abstand +7,96 Pp p. a.; Startphasen: 62 von 63 vor dem Markt (−0,01 bis +19,07 Pp p. a.) — **bei einem größten Rückschlag von −56,9 %** gegen −24,5 % beim S&P 500.

*Regel: `REGEL-KORB148.md` (vor dem Lauf festgelegt, Siegel `c0d3f30`; Nachtrag 1 zur Korbgröße vor dem berichtigten Lauf, `fddcf18`). Skript `pm-korb148.js`, Zahlen in `ergebnis-korb187.json` (berichtigt) und `ergebnis-korb148.json` (erster Lauf). Beschreibende Zahl, kein Urteil über eine Kante. Alles Simulation, keine Anlageberatung.*

## Die drei Körbe nebeneinander

| | breiter Markt (amtlich, Nr. 74) | 187 umsatzstärkste (berichtigt) | 148 umsatzstärkste (erster Lauf, Zählfehler) |
|---|---|---|---|
| zulässige Werte / Zielzahl / gehalten | 515–923 / 52–92 / 48–78 | 187 / 19 / 14–19 | 148 / 15 / 12–15 |
| Buch gesamt (p. a.) | +65,2 % (+10,57 %) | **+154,9 % (+20,59 %)** | +95,1 % (+14,31 %) |
| S&P 500 gesamt (p. a.) | +81,2 % (+12,63 %) | +81,2 % (+12,63 %) | +81,2 % (+12,63 %) |
| Abstand p. a. (Start 16.09.2021) | **−2,06 Pp** | **+7,96 Pp** | +1,68 Pp |
| Startphasen vor dem Markt | 41 von 63 | 62 von 63 | 63 von 63 |
| Abstand über die Startphasen (Min / Median / Max) | −3,47 / +1,62 / +7,89 | −0,01 / +8,25 / +19,07 | +1,68 / +10,54 / +16,97 |
| Abstand je Periode: Mittel ± Standardfehler (95-%-Band) | +0,63 ± 3,07 (−5,79 bis +7,05) | +4,29 ± 4,94 (−6,06 bis +14,64) | +2,98 ± 4,95 (−7,37 bis +13,34) |
| Perioden vor dem Markt | 8 von 20 | 9 von 20 | 9 von 20 |
| größter Rückschlag des Buchs (über die Phasen) | −40,2 % (−36 bis −45) | **−56,9 %** (−38,9 bis −56,9) | −57,6 % (−39,7 bis −57,6) |
| größtes Gewicht einer Position | 4,2 % | 22,6 % | 30,5 % |

## Korb 187 im Einzelnen

| Jahr | Buch | S&P 500 |
|---|---|---|
| 2021 (ab 16.09.) | −11,4 % | +6,9 % |
| 2022 | −32,5 % | −18,2 % |
| 2023 | +6,1 % | +26,2 % |
| 2024 | +77,5 % | +24,9 % |
| 2025 | +60,9 % | +17,7 % |
| 2026 (bis 15.09.) | +40,7 % | +11,7 % |

20 Umschichtungen, Kosten 3.156 $ auf 100.000 $ Start (20 Basispunkte je Seite), Ausschüttungen 4.109 $ (148 Buchungen), ein Reihenende, kein Tag mit zu
kleinem Korb, Bargeld im Mittel 0,56 %. Letzte Periode (25.06.–15.09.2026): Buch −24,8 % gegen +3,3 %.

## Was die Zahl trägt und was nicht

- **Der Korb ist nicht die Liste der App.** Von den 187 Werten der App stehen am letzten Stichtag 118 in diesem Korb. Die übrigen 69 Plätze belegen
  die am meisten gehandelten Aktien des Tages — und gerade die haben das Ergebnis gemacht: am längsten im Buch waren MSTR, NVDA, PLTR (je 9 Perioden),
  SMCI, CVNA, APP, HOOD (je 6), dazu zeitweise AMC, GME, MARA, RIOT, COIN, IONQ, OKLO, RKLB. Bis auf NVDA führt die App keinen dieser Namen.
- **Die Gewinne stammen aus 2024 bis 2026**, die ersten 15 Monate kosteten das Buch mehr als die Hälfte (−11 % und −33 % gegen +7 % und −18 %).
- **Vom Zufall nicht zu unterscheiden:** der Abstand je Periode ist +4,3 Pp bei einem Standardfehler von 4,9 — das Band schließt null ein. Dass fast
  alle 63 Startphasen vorn liegen, ist kein zweiter Beleg: sie teilen sich dieselben fünf Jahre.
- **Die Antwort hängt am Korb:** dieselbe Regel liegt auf dem breiten Markt 2 Pp p. a. hinter dem S&P 500, auf den 187 meistgehandelten 8 Pp davor.
- **Geprüft vom PM selbst:** der breite Korb trifft im selben Lauf die amtliche Hauptzahl (+65,32 % / +81,19 %); 118 Positions-Perioden gegen die
  Tagesdaten der App (Yahoo): mittlere Abweichung 0,43 Pp, vier über 2 Pp (Ölwerte mit hohen Ausschüttungen, die Yahoo einrechnet); Tagessprünge über
  40 % nur an drei echten Ereignistagen (SAVA, UPST, APP); Split-Bereinigungen in der Haltezeit sechsmal, alle ohne Sprung.
- **Nicht geprüft:** ein zweiter, unabhängig geschriebener Lauf fehlt (so vereinbart: er folgt, wenn auf die Zahl hin echtes Geld eingesetzt werden soll).

## Berichtigung

Der erste Lauf rechnete mit 148 Werten — ein Zählfehler des PM (sein Zählskript ließ 39 Reihen mit Kursen vor 1973 aus). Die App führt 187 Werte,
Zielzahl 19; das Buch hält 19 Positionen. Nachtrag 1 der Regel wurde vor dem berichtigten Lauf committet; beide Ergebnisse stehen oben.
