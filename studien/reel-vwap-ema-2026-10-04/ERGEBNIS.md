# Ergebnis Auftrag Nr. 89: VWAP-Trend und EMA-Stapel auf QQQ, SPY, IWM

**Hauptlauf (R1 „VWAP-Trend", QQQ, Fassung N, 29.09.2023–30.09.2026, 753 Handelstage):** **hält nicht** — mittlerer Tagesertrag bei c = 0: +3,15 Basispunkte (t +1,07), bei c = 0,25: −5,19 Basispunkte (t −1,69); verträgt Kosten bis c* = 0,09 Basispunkte je Seite; bei geschätzten 1,0 Basispunkten je Seite bleibt −54,0 % p. a. (Hürde geschätzt, nicht gemessen). Ohne Kosten +7,0 % p. a., bei c = 0,25 −13,4 % p. a.; 16,7 Trades je Tag, Tagesumsatz das 33,4-Fache des Vermögens; Kaufen-und-Halten im selben Fenster +27,1 % p. a. (Kursertrag, ohne Ausschüttungen).

**Eichung am Papier** (R1, QQQ, Fassung P, Kosten „Papier", 02.01.2018–28.09.2023): Gesamtertrag +677 % (Papier +671 %), 23.190 Trades (rund 21.967), Trefferquote 17,0 % (rund 17 %), größter Rückschlag 8,4 % (9,4 %), Sharpe 2,11 (2,1), 1445 Handelstage — im Rahmen (Trades 20.000–24.000, Trefferquote 15–19 %, Gesamtertrag +300 % bis +1.200 %).

**Fenster W-Nach (29.09.2023–30.09.2026), Fassung N** — ein Hauptlauf (erste Zeile), die anderen fünf Zeilen nachrichtlich:

| Regel | Wert | Satz | p. a. c=0 | p. a. c=0,25 | p. a. c=1,0 | t c=0 | t c=0,25 | c* (Bp) | Trades/Tag | größter Rückschlag c=0,25 | Kaufen-und-Halten p. a. |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R1 VWAP-Trend | QQQ | hält nicht | +7,0 % | −13,4 % | −54,0 % | +1,07 | −1,69 | 0,09 | 16,7 | 36,0 % | +27,1 % |
| R1 VWAP-Trend | SPY | hält nicht | +0,4 % | −19,2 % | −57,9 % | +0,20 | −3,57 | 0,01 | 17,2 | 47,4 % | +21,0 % |
| R1 VWAP-Trend | IWM | hält nicht | −11,0 % | −27,9 % | −61,6 % | −0,98 | −2,89 | −0,12 | 16,6 | 65,8 % | +15,9 % |
| R2 EMA-Stapel | QQQ | hält nicht | +0,8 % | −15,5 % | −50,2 % | +0,26 | −2,36 | 0,02 | 14,0 | 41,2 % | +27,1 % |
| R2 EMA-Stapel | SPY | hält nicht | +0,8 % | −15,6 % | −50,4 % | +0,26 | −3,23 | 0,02 | 14,1 | 39,8 % | +21,0 % |
| R2 EMA-Stapel | IWM | hält nicht | −11,5 % | −25,7 % | −56,1 % | −1,44 | −3,63 | −0,16 | 13,9 | 63,7 % | +15,9 % |

**Ereignis-Sicht** (W-Nach; Ertrag ab der nächsten Eröffnung über H Minuten in Signalrichtung, abzüglich des Tageszeit-Mittels; Basispunkte, in Klammern t über Tage gebündelt):
- R1 (Seitenwechsel am VWAP): QQQ [11.736 Ereignisse]: H5 +0,02 (+0,2), H15 +0,08 (+0,7), H30 +0,04 (+0,3), H60 +0,25 (+1,7) · SPY [12.074 Ereignisse]: H5 −0,06 (−1,0), H15 +0,02 (+0,3), H30 −0,09 (−1,0), H60 +0,21 (+2,1) · IWM [11.656 Ereignisse]: H5 −0,21 (−1,8), H15 −0,12 (−1,0), H30 −0,14 (−1,0), H60 +0,18 (+1,0).
- R2 (Eintritt in long oder short): QQQ [10.381 Ereignisse]: H5 −0,03 (−0,2), H15 +0,09 (+0,4), H30 +0,04 (+0,1), H60 +0,36 (+0,6) · SPY [10.433 Ereignisse]: H5 −0,02 (−0,2), H15 −0,23 (−1,1), H30 +0,11 (+0,4), H60 +0,79 (+1,8) · IWM [10.322 Ereignisse]: H5 −0,17 (−1,1), H15 −0,19 (−0,6), H30 −0,04 (−0,1), H60 −0,02 (−0,0).
- Einordnung: 24 Zellen im Urteilsfenster, größtes t dem Betrag nach +2,1; bei 24 Zellen läge die Schwelle nach Bonferroni bei |t| ≈ 3,1. Die Zellen sind beschreibend, kein Urteil.

**Grenzen.** Gemessen ist der Basiswert, nicht die Option: Optionskurse fehlen, die Options-Hürde von 1,0 Basispunkten je Seite ist vom PM geschätzt, nicht gemessen. Fassung P ist nicht ausführbar und dient nur der Eichung; Fassung N handelt zur nächsten Eröffnung ohne Spanne, Kosten gehen allein über c ein. Short ohne Leihgebühr, kein Zins auf Bargeld, Bruchstücke erlaubt, kein Hebel. R2 ist ein Nachbau der im Reel genannten Zutaten durch den PM, nicht die Regel aus dem Reel. Ein Hauptlauf; die elf Nebenläufe im Urteilsfenster stehen nachrichtlich daneben und zählen nicht als weitere Belege. Kurse roh (SIP), Kaufen-und-Halten ohne Ausschüttungen. Datenlücken wurden gehandelt, wie sie sind: QQQ am 02. und 03.05.2018 nur die Kerze 09:30 (kein Handel an diesen Tagen), QQQ am 22.02.2016 340 Kerzen, SPY und IWM am 12.08.2019 nur bis 15:31 bzw. 15:30, vier Tage im März 2020 je 376 Kerzen (Handelsunterbrechung). Beschreibende Zahlen nach vorher festgelegter Regel (REGEL.md, Siegel 3c96c2d); keine Anlageberatung.
