# ERGEBNIS — Drei klassische Trendfilter gegen den S&P 500 nach Kosten

Kennung `trendfilter-messung-2026-10/v1` · Regel `REGEL.md` (Siegel `6f9d06f`, 05.10.2026 00:33, vor dem ersten Kursabruf) ·
Code vor dem Lauf `697e6f3` · Lauf 05.10.2026 01:10, nach Korrektur 1 (`8715b4a`, nur eine nachrichtliche Zusatz-Zeile) um 01:18 wiederholt · Simulation mit virtuellem Kapital, vor Steuern, **keine Anlageberatung**.

## Kurzfassung

1. **Urteil nach der Entscheidregel (REGEL §5.3): alle drei Regeln „schlägt SPY nicht“** — in beiden Fenstern an keinem der je 22 Starttage vorn, der Median überall negativ.
2. **Fenster A** (04.01.2017–15.09.2021, SPY +17,77 % p. a.): Faber 10 Monate **−7,09 Pp p. a.**, Antonacci GEM **−10,04**, 200 Tage **−7,89**. **Fenster B** (16.09.2021–15.09.2026, SPY +12,63 % p. a.): **−7,70 / −3,10 / −3,10** Pp p. a.
3. **Rückschlag** (Regel gegen SPY): A −23,9 / −33,7 / −26,6 % gegen −33,7 %; B −26,4 / −21,6 / −17,4 % gegen −24,5 % — der versprochene Schutz ist klein und nicht verlässlich (GEM 2020 und Faber 2022 nicht flacher als SPY).
4. **Zeit unter Wasser** ist bei allen Regeln länger als bei SPY: A 833 / 720 / 469 Tage gegen 204; B 919 / 863 / 760 gegen 709 — die Regeln steigen nach schnellen Einbrüchen zu spät wieder ein.
5. **Placebo** (je 1.000 Läufe mit derselben Wechselzahl zu zufälligen Tagen): Läufe über der Regel A 372 / 973 / 363, B 761 / 634 / 242 von 1.000 — kein beständiger Vorteil der Zeitwahl; GEM lag 2017–2021 hinter 97 % der Zufallsläufe.
6. **Wechsel je Jahr** (jeder Wechsel ist ein Verkauf, nach deutscher Abgeltungsteuer also ein Steuerereignis; nicht modelliert): A 1,70 / 1,70 / 2,98, B 2,40 / 1,80 / 2,80.
7. **Zusatz 2003–2026** (4.522 rollierende 5-Jahres-Fenster, Ersatzreihen SHY und EFA, entscheidet nicht): vorn in 27,6 / 24,0 / 27,7 % der Fenster — fast nur in denen mit Start 2003–2008, die den Einbruch 2008/09 enthalten; ab Start 2009 in keinem. Der schlechteste Rückschlag über alle Fenster ist deutlich flacher (−29,0 / −35,7 / −26,2 % gegen −55,3 %).
8. **Gesamtlauf 01.10.2003–15.09.2026** (mit 2008): +8,15 / +8,51 / +7,44 % p. a. gegen SPY +11,21 % — auch über 23 Jahre mit zwei großen Krisen 2,7 bis 3,8 Pp p. a. hinten.
9. **Nachrichtliche Lesarten** (Ausführung zum Schluss wie im Original, SHY/EFA, ohne Band, ohne Kosten, GEM-Variante) ändern nichts: überall 0 von 22 Starttagen vorn.
10. **Geprüft:** ein zweiter, unabhängig geschriebener Rechner trifft jeden Endwert (Start am ersten Tag und alle Starttage, beide Fenster, alle Regeln; dazu N1–N5 beim Start am ersten Tag und den Gesamtlauf) auf den Cent und stimmt in allen 4.522 Zusatzfenstern überein; die Datenprüfung fand vier belegte Yahoo-Fehler, Wirkung höchstens 0,007 Pp p. a., kein Urteil ändert sich.

Die Vermutung aus REGEL §10 („schlägt SPY nicht“, Schutz vor allem in Fenstern mit 2008) ist eingetroffen.

## Was gemessen wurde

- **R1 Faber 10 Monate** (Faber 2007): am Monatsende SPY-Gesamtertrag über dem Mittel der letzten zehn Monatsenden → SPY, sonst Geld (BIL).
- **R2 Antonacci GEM** (Dual Momentum Investing, 2014): 12-Monats-Gesamtertrag SPY gegen Geld (BIL); liegt SPY vorn, das stärkere aus SPY und ACWX, sonst AGG. Antonaccis FAQ bestätigt die Reihenfolge („absolutes Momentum zuerst, am S&P 500“, Buch S. 98; `notiz-R2.md`).
- **R3 200 Tage** (Siegel, Stocks for the Long Run): täglich SPY-Schluss gegen den 200-Tage-Durchschnitt mit 1-%-Band, außerhalb Geld (BIL).
- Alle: Handel zur Eröffnung des nächsten Handelstags, 20 Basispunkte je Seite, Ausschüttungen auf beiden Seiten, Maßstab SPY halten ohne Kosten; Daten aus der öffentlichen Yahoo-Chart-Schnittstelle (Rohkurse nicht im Repo; `laden.js` holt sie, `pruefsummen.json` sichert sie).

## Lesart

1. **Warum die Regeln verlieren:** 2017–2026 hatte vor allem schnelle Einbrüche mit schneller Erholung (Ende 2018, Frühjahr 2020, Frühjahr 2025). Ein Trendfilter steigt erst nach dem Fall aus und erst nach der Erholung wieder ein — Faber verkaufte am 02.03.2020 und kaufte am 01.06.2020 zurück, GEM verkaufte am 01.04.2020 (nach dem Tiefpunkt) in Anleihen und kaufte am 01.06.2020 zurück. 2019 brachte SPY +31,2 %, die Regeln +5,2 / +15,0 / +18,5 %; 2023 SPY +26,2 %, die Regeln +8,5 bis +9,2 %. Der lange Abschwung 2022 war zu mild und zu zerfahren, um das aufzuholen.
2. **Schutz gibt es — aber nur in tiefen, langen Abschwüngen, und er kostet in allen anderen Jahren.** In den Fenstern mit 2008 liegen die Regeln vorn und ihr Rückschlag ist deutlich flacher (schlechtester Wert −26 bis −36 % gegen −55 %); über den ganzen Zeitraum 2003–2026, der 2008 und 2020 enthält, bleiben sie trotzdem 2,7 bis 3,8 Pp p. a. hinter SPY. Gleichzeitig dauert es nach Rückschlägen bei den Regeln meist länger als bei SPY, bis ein alter Höchststand wieder erreicht ist (Median der Zusatzfenster 590–711 Tage gegen 280).
3. **Placebo:** Im Fenster A wählen Faber und 200 Tage die Zeitpunkte etwas besser als der Zufall (Median der Zufallsläufe −8,5 und −9,3 Pp gegen −7,1 und −7,9), aber auch die Zufallsläufe mit derselben Zahl Wechsel liegen fast immer hinter SPY (vor SPY nur 3,1 bzw. 1,7 % der Läufe) — schon das Aussteigen an sich kostet in diesen Jahren. GEM lag in A hinter 97 % der Zufallsläufe, Faber in B hinter 76 %; 200 Tage in B vor 76 %. Ein beständiger Vorteil der Zeitwahl ist nicht zu sehen.
4. **Steuern** (nicht modelliert, Einschätzung): jeder Wechsel verwirklicht Gewinne, Kaufen-und-Halten schiebt die Steuer bis zum Verkauf auf. Bei 1,7 bis 3 Verkäufen im Jahr spricht das eher zusätzlich gegen die Regeln.

## Grenzen

- **Zwei Fenster, überwiegend Aufwärtsmarkt.** 2017–2026 enthält keinen Abschwung wie 2000–2002 oder 2008; genau dort liegt der bekannte Nutzen solcher Regeln (Zusatz). Die Entscheidregel des Auftrags fragt aber nach 2017–2026.
- **Zusatz mit Ersatzreihen:** SHY (1–3-jährige Staatsanleihen) brachte 2008 +6,6 % gegen +1,6 % bei BIL (Schatzwechsel; aus denselben Daten) — das schönt die Regeln in den Fenstern mit 2008 eher; EFA statt ACWX. Die Fenster überlappen fast vollständig und sind kein unabhängiger Nachweis.
- **Daten:** eine Quelle (Yahoo); zweite Quelle (Alpaca-Minutenarchiv, Alpaca-Maßnahmen) nur ab 2016, für 2003–2015 keine. Kurse in US-Dollar, ohne Wechselkurs; ein Anleger in Deutschland würde vermutlich UCITS-ETFs mit anderen Kosten benutzen. 20 Basispunkte je Seite sind eine Annahme.
- **Ausschüttungen** werden am Ex-Tag zum Schluss ohne Kosten wieder angelegt (auf beiden Seiten gleich).
- **Quellen:** Faber in der Fassung von 2013 gelesen (die Fassung von 2007 über ihre Zitate), Antonacci über seine FAQ (das Buch nicht), Siegel über Inhaltsverzeichnis und Sekundärquellen (`notiz-R1.md`, `notiz-R2.md`, `notiz-R3.md`).

<!-- TABELLEN-ANFANG (erzeugt von bericht.js aus ergebnis.json - nicht von Hand aendern) -->

## 1 Urteil nach der Entscheidregel (REGEL §5.3)

| Regel | A: Start am 1. Tag | A: Starttage vorn | A: Median | B: Start am 1. Tag | B: Starttage vorn | B: Median | **Urteil** |
|---|---|---|---|---|---|---|---|
| R1 Faber 10 Monate | −7,09 Pp (hinten) | 0 von 22 | −7,16 Pp | −7,70 Pp (hinten) | 0 von 22 | −7,82 Pp | **schlägt SPY nicht** |
| R2 Antonacci GEM | −10,04 Pp (hinten) | 0 von 22 | −10,13 Pp | −3,10 Pp (hinten) | 0 von 22 | −3,14 Pp | **schlägt SPY nicht** |
| R3 200 Tage (Siegel, 1-%-Band) | −7,89 Pp (hinten) | 0 von 22 | −7,96 Pp | −3,10 Pp (hinten) | 0 von 22 | −3,14 Pp | **schlägt SPY nicht** |

- R1 verfehlt: A: beim Start am ersten Tag nicht vorn (−7,09 Pp); A: nur 0 von 22 Starttagen vorn (unter 70 %); A: Median −7,16 Pp p. a., nicht über null; B: beim Start am ersten Tag nicht vorn (−7,70 Pp); B: nur 0 von 22 Starttagen vorn (unter 70 %); B: Median −7,82 Pp p. a., nicht über null.
- R2 verfehlt: A: beim Start am ersten Tag nicht vorn (−10,04 Pp); A: nur 0 von 22 Starttagen vorn (unter 70 %); A: Median −10,13 Pp p. a., nicht über null; B: beim Start am ersten Tag nicht vorn (−3,10 Pp); B: nur 0 von 22 Starttagen vorn (unter 70 %); B: Median −3,14 Pp p. a., nicht über null.
- R3 verfehlt: A: beim Start am ersten Tag nicht vorn (−7,89 Pp); A: nur 0 von 22 Starttagen vorn (unter 70 %); A: Median −7,96 Pp p. a., nicht über null; B: beim Start am ersten Tag nicht vorn (−3,10 Pp); B: nur 0 von 22 Starttagen vorn (unter 70 %); B: Median −3,14 Pp p. a., nicht über null.

## 2 Fenster A, Start am ersten Tag (04.01.2017 bis 15.09.2021, 1.715 Kalendertage)

| | Endwert (100.000 $) | p. a. | Abstand | größter Rückschlag | längste Zeit unter Wasser | Tage unter Wasser | Wechsel (je Jahr) | Kosten |
|---|---|---|---|---|---|---|---|---|
| SPY halten | 215.548,40 $ | +17,77 % | – | −33,7 % | 204 Tage (20.09.2018–12.04.2019) | 81 % | – | 0 $ |
| R1 Faber 10 Monate | 161.020,23 $ | +10,68 % | −7,09 Pp | −23,9 % | 833 Tage (20.09.2018–31.12.2020) | 88 % | 8 (1,70) | 3.766,93 $ |
| R2 Antonacci GEM | 141.841,27 $ | +7,73 % | −10,04 Pp | −33,7 % | 720 Tage (26.01.2018–16.01.2020) | 91 % | 8 (1,70) | 3.834,92 $ |
| R3 200 Tage (Siegel, 1-%-Band) | 155.669,62 $ | +9,88 % | −7,89 Pp | −26,6 % | 469 Tage (20.09.2018–02.01.2020) | 88 % | 14 (2,98) | 6.736,37 $ |

**Placebo** (1.000 Läufe je Regel: dieselbe Folge von Reihen, dieselbe Zahl Wechsel, zufällige Tage; REGEL §6) und **alle Starttage** (REGEL §5.2):

| Regel | Abstand der Regel | Placebo: Median [5 %; 95 %] | Placebo vor SPY | Placebo-Läufe über der Regel | Starttage: Min / Median / Max | Starttage vorn | Rückschlag über die Starttage |
|---|---|---|---|---|---|---|---|
| R1 | −7,09 Pp | −8,54 Pp [−15,28; −1,32] | 3,1 % | 372 von 1.000 | −7,22 / −7,16 / −7,09 Pp | 0 von 22 | −23,9 % bis −23,9 % |
| R2 | −10,04 Pp | −3,20 Pp [−9,10; +2,67] | 17,2 % | 973 von 1.000 | −10,22 / −10,13 / −10,04 Pp | 0 von 22 | −33,7 % bis −33,7 % |
| R3 | −7,89 Pp | −9,27 Pp [−16,79; −2,66] | 1,7 % | 363 von 1.000 | −8,02 / −7,96 / −7,89 Pp | 0 von 22 | −26,6 % bis −26,6 % |

**Wechsel** (Ausführungstag zur Eröffnung: von → nach; jeder Wechsel ist ein Verkauf — nach deutscher Abgeltungsteuer ein Steuerereignis, hier nicht modelliert):

- **R1** (Erstkauf SPY; Tage: BIL 12,2 %, SPY 87,8 %): 01.11.2018 SPY→BIL · 03.12.2018 BIL→SPY · 02.01.2019 SPY→BIL · 01.03.2019 BIL→SPY · 03.06.2019 SPY→BIL · 01.07.2019 BIL→SPY · 02.03.2020 SPY→BIL · 01.06.2020 BIL→SPY
- **R2** (Erstkauf SPY; Tage: ACWX 23,2 %, AGG 6,8 %, SPY 70,0 %): 01.06.2017 SPY→ACWX · 01.06.2018 ACWX→SPY · 02.01.2019 SPY→AGG · 01.03.2019 AGG→SPY · 01.04.2020 SPY→AGG · 01.06.2020 AGG→SPY · 01.06.2021 SPY→ACWX · 01.07.2021 ACWX→SPY
- **R3** (Erstkauf SPY; Tage: BIL 11,5 %, SPY 88,5 %): 12.10.2018 SPY→BIL · 17.10.2018 BIL→SPY · 24.10.2018 SPY→BIL · 08.11.2018 BIL→SPY · 13.11.2018 SPY→BIL · 04.12.2018 BIL→SPY · 06.12.2018 SPY→BIL · 19.02.2019 BIL→SPY · 28.02.2020 SPY→BIL · 03.03.2020 BIL→SPY · 04.03.2020 SPY→BIL · 05.03.2020 BIL→SPY · 09.03.2020 SPY→BIL · 28.05.2020 BIL→SPY

**Kalenderjahre** (Regel / SPY; erstes Jahr ab Starttag, letztes bis Endtag):

| Jahr | R1 | R2 | R3 | SPY |
|---|---|---|---|---|
| 2017 | +20,3 % | +18,9 % | +20,3 % | +20,6 % |
| 2018 | −8,1 % | −8,3 % | −6,9 % | −4,6 % |
| 2019 | +5,2 % | +15,0 % | +18,5 % | +31,2 % |
| 2020 | +14,8 % | −2,1 % | −2,7 % | +18,4 % |
| 2021 | +20,6 % | +15,6 % | +20,6 % | +20,6 % |

## 3 Fenster B, Start am ersten Tag (16.09.2021 bis 15.09.2026, 1.825 Kalendertage)

| | Endwert (100.000 $) | p. a. | Abstand | größter Rückschlag | längste Zeit unter Wasser | Tage unter Wasser | Wechsel (je Jahr) | Kosten |
|---|---|---|---|---|---|---|---|---|
| SPY halten | 181.193,89 $ | +12,63 % | – | −24,5 % | 709 Tage (03.01.2022–13.12.2023) | 87 % | – | 0 $ |
| R1 Faber 10 Monate | 127.172,89 $ | +4,93 % | −7,70 Pp | −26,4 % | 919 Tage (03.01.2022–10.07.2024) | 94 % | 12 (2,40) | 4.868,86 $ |
| R2 Antonacci GEM | 157.624,64 $ | +9,53 % | −3,10 Pp | −21,6 % | 863 Tage (03.01.2022–15.05.2024) | 91 % | 9 (1,80) | 4.119,39 $ |
| R3 200 Tage (Siegel, 1-%-Band) | 157.638,54 $ | +9,54 % | −3,10 Pp | −17,4 % | 760 Tage (03.01.2022–02.02.2024) | 90 % | 14 (2,80) | 6.107,45 $ |

**Placebo** (1.000 Läufe je Regel: dieselbe Folge von Reihen, dieselbe Zahl Wechsel, zufällige Tage; REGEL §6) und **alle Starttage** (REGEL §5.2):

| Regel | Abstand der Regel | Placebo: Median [5 %; 95 %] | Placebo vor SPY | Placebo-Läufe über der Regel | Starttage: Min / Median / Max | Starttage vorn | Rückschlag über die Starttage |
|---|---|---|---|---|---|---|---|
| R1 | −7,70 Pp | −5,33 Pp [−10,44; +0,14] | 5,8 % | 761 von 1.000 | −7,87 / −7,82 / −7,70 Pp | 0 von 22 | −26,4 % bis −26,4 % |
| R2 | −3,10 Pp | −2,32 Pp [−6,43; +1,64] | 18,7 % | 634 von 1.000 | −3,17 / −3,14 / −3,10 Pp | 0 von 22 | −21,6 % bis −21,6 % |
| R3 | −3,10 Pp | −5,65 Pp [−11,12; −0,07] | 4,9 % | 242 von 1.000 | −3,16 / −3,14 / −3,10 Pp | 0 von 22 | −17,4 % bis −17,4 % |

**Wechsel** (Ausführungstag zur Eröffnung: von → nach; jeder Wechsel ist ein Verkauf — nach deutscher Abgeltungsteuer ein Steuerereignis, hier nicht modelliert):

- **R1** (Erstkauf SPY; Tage: BIL 21,9 %, SPY 78,1 %): 01.03.2022 SPY→BIL · 01.04.2022 BIL→SPY · 02.05.2022 SPY→BIL · 01.12.2022 BIL→SPY · 03.01.2023 SPY→BIL · 01.02.2023 BIL→SPY · 01.11.2023 SPY→BIL · 01.12.2023 BIL→SPY · 01.04.2025 SPY→BIL · 02.06.2025 BIL→SPY · 01.04.2026 SPY→BIL · 01.05.2026 BIL→SPY
- **R2** (Erstkauf SPY; Tage: ACWX 22,4 %, AGG 21,7 %, SPY 55,9 %): 01.06.2022 SPY→AGG · 03.07.2023 AGG→SPY · 01.11.2023 SPY→ACWX · 01.12.2023 ACWX→SPY · 01.05.2025 SPY→ACWX · 02.06.2025 ACWX→SPY · 01.07.2025 SPY→ACWX · 01.08.2025 ACWX→SPY · 03.11.2025 SPY→ACWX
- **R3** (Erstkauf SPY; Tage: BIL 23,7 %, SPY 76,3 %): 26.01.2022 SPY→BIL · 01.02.2022 BIL→SPY · 15.02.2022 SPY→BIL · 28.03.2022 BIL→SPY · 12.04.2022 SPY→BIL · 24.01.2023 BIL→SPY · 13.03.2023 SPY→BIL · 22.03.2023 BIL→SPY · 26.10.2023 SPY→BIL · 03.11.2023 BIL→SPY · 11.03.2025 SPY→BIL · 13.05.2025 BIL→SPY · 23.03.2026 SPY→BIL · 09.04.2026 BIL→SPY

**Kalenderjahre** (Regel / SPY; erstes Jahr ab Starttag, letztes bis Endtag):

| Jahr | R1 | R2 | R3 | SPY |
|---|---|---|---|---|
| 2021 | +6,7 % | +6,7 % | +6,7 % | +6,9 % |
| 2022 | −22,2 % | −16,9 % | −11,0 % | −18,2 % |
| 2023 | +9,2 % | +8,5 % | +9,2 % | +26,2 % |
| 2024 | +24,9 % | +24,9 % | +24,9 % | +24,9 % |
| 2025 | +11,5 % | +14,6 % | +12,4 % | +17,7 % |
| 2026 | +0,7 % | +14,4 % | +8,2 % | +11,7 % |

## 4 Zusatz 2003–2026: alle rollierenden 5-Jahres-Fenster (Ersatzreihen SHY, EFA; entscheidet nicht)

Starttage 01.10.2003 bis 16.09.2021, je Fenster fünf Jahre. Die Fenster überlappen fast vollständig — kein unabhängiger Nachweis.

| Regel | Fenster | vorn | Abstand Median [10 %; 90 %] | Min / Max | Rückschlag Median Regel / SPY | schlechtester Regel / SPY | flacher als SPY | Zeit unter Wasser Median Regel / SPY | Wechsel je Jahr (Median) |
|---|---|---|---|---|---|---|---|---|---|
| R1 | 4.522 | 27,6 % | −5,63 Pp [−8,91; +8,18] | −14,08 / +15,26 | −20,8 % / −33,7 % | −29,0 % / −55,3 % | 61,4 % | 711 / 280 Tage | 1,40 |
| R2 | 4.522 | 24,0 % | −7,47 Pp [−11,65; +10,34] | −19,48 / +21,72 | −23,1 % / −33,7 % | −35,7 % / −55,3 % | 29,4 % (640 Fenster gleich) | 707 / 280 Tage | 1,80 |
| R3 | 4.522 | 27,7 % | −4,85 Pp [−7,89; +3,57] | −13,30 / +8,24 | −17,9 % / −33,7 % | −26,2 % / −55,3 % | 86,6 % | 590 / 280 Tage | 3,20 |

Je Startjahr (Anteil der Fenster vorn / Median des Abstands in Pp p. a.):

| Startjahr | Fenster | R1 vorn / Median | R2 vorn / Median | R3 vorn / Median |
|---|---|---|---|---|
| 2003 | 64 | 100 % / +10,29 | 100 % / +16,87 | 92 % / +3,15 |
| 2004 | 252 | 100 % / +10,04 | 100 % / +16,00 | 100 % / +3,21 |
| 2005 | 252 | 100 % / +9,91 | 100 % / +10,46 | 100 % / +3,40 |
| 2006 | 251 | 100 % / +6,36 | 100 % / +6,73 | 100 % / +3,34 |
| 2007 | 251 | 100 % / +4,20 | 100 % / +2,91 | 100 % / +3,59 |
| 2008 | 253 | 71 % / +1,38 | 6 % / −3,19 | 74 % / +2,13 |
| 2009 | 252 | 0 % / −6,28 | 0 % / −11,91 | 0 % / −5,23 |
| 2010 | 252 | 0 % / −6,07 | 0 % / −8,19 | 0 % / −4,66 |
| 2011 | 252 | 0 % / −5,62 | 0 % / −9,41 | 0 % / −5,19 |
| 2012 | 250 | 0 % / −3,64 | 0 % / −7,14 | 0 % / −5,06 |
| 2013 | 252 | 0 % / −3,61 | 0 % / −5,01 | 0 % / −4,13 |
| 2014 | 252 | 0 % / −8,79 | 0 % / −7,05 | 0 % / −6,56 |
| 2015 | 252 | 0 % / −8,96 | 0 % / −10,90 | 0 % / −8,76 |
| 2016 | 252 | 0 % / −6,37 | 0 % / −9,99 | 0 % / −7,29 |
| 2017 | 251 | 0 % / −6,74 | 0 % / −9,89 | 0 % / −6,71 |
| 2018 | 251 | 0 % / −8,98 | 0 % / −12,18 | 0 % / −7,83 |
| 2019 | 252 | 0 % / −5,58 | 0 % / −10,49 | 0 % / −6,42 |
| 2020 | 253 | 0 % / −6,35 | 0 % / −6,30 | 0 % / −3,29 |
| 2021 | 178 | 0 % / −8,39 | 0 % / −5,46 | 0 % / −3,84 |

**Gesamtlauf** 01.10.2003 bis 15.09.2026 (ein Start, nachrichtlich):

| | Endwert | p. a. | Abstand | größter Rückschlag | längste Zeit unter Wasser | Wechsel (je Jahr) |
|---|---|---|---|---|---|---|
| SPY halten | 1.147.360,96 $ | +11,21 % | – | −55,2 % (09.10.2007–09.03.2009) | 1.773 Tage (09.10.2007–16.08.2012) | – |
| R1 | 603.957,91 $ | +8,15 % | −3,07 Pp | −29,0 % (03.01.2022–13.03.2023) | 1.015 Tage (23.04.2010–01.02.2013) | 34 (1,48) |
| R2 | 651.737,92 $ | +8,51 % | −2,71 Pp | −35,3 % (20.09.2018–23.03.2020) | 1.001 Tage (03.01.2022–30.09.2024) | 39 (1,70) |
| R3 | 519.587,01 $ | +7,44 % | −3,77 Pp | −26,2 % (19.02.2020–11.06.2020) | 1.043 Tage (05.03.2004–12.01.2007) | 70 (3,05) |

## 5 Nachrichtliche Lesarten (REGEL §7.2; entscheiden nicht)

| Regel | Lesart | A: Start am 1. Tag | A: vorn / Median | A: Rückschlag | B: Start am 1. Tag | B: vorn / Median | B: Rückschlag | Wechsel A / B |
|---|---|---|---|---|---|---|---|---|
| R1 | Haupt Hauptlesart (entscheidet) | −7,09 Pp | 0/22 / −7,16 | −23,9 % | −7,70 Pp | 0/22 / −7,82 | −26,4 % | 8 / 12 |
| R1 | N1 Ausfuehrung zum Schluss des Signaltags (wie im Original) | −6,17 Pp | 0/22 / −6,23 | −21,3 % | −7,77 Pp | 0/22 / −7,88 | −26,3 % | 8 / 12 |
| R1 | N2 Ersatzreihen SHY statt BIL, EFA statt ACWX | −6,77 Pp | 0/22 / −6,83 | −23,7 % | −8,39 Pp | 0/22 / −8,51 | −29,0 % | 8 / 12 |
| R1 | N4 ohne Kosten | −6,29 Pp | 0/22 / −6,35 | −22,1 % | −6,65 Pp | 0/22 / −6,75 | −24,6 % | 8 / 12 |
| R2 | Haupt Hauptlesart (entscheidet) | −10,04 Pp | 0/22 / −10,13 | −33,7 % | −3,10 Pp | 0/22 / −3,14 | −21,6 % | 8 / 9 |
| R2 | N1 Ausfuehrung zum Schluss des Signaltags (wie im Original) | −8,38 Pp | 0/22 / −8,46 | −33,7 % | −3,68 Pp | 0/22 / −3,73 | −22,1 % | 8 / 9 |
| R2 | N2 Ersatzreihen SHY statt BIL, EFA statt ACWX | −10,60 Pp | 0/22 / −10,70 | −35,3 % | −5,83 Pp | 0/22 / −5,91 | −28,4 % | 8 / 12 |
| R2 | N4 ohne Kosten | −9,26 Pp | 0/22 / −9,34 | −33,7 % | −2,26 Pp | 0/22 / −2,30 | −20,9 % | 8 / 9 |
| R2 | N5 absolutes Momentum auf den Gewinner angewandt | −10,04 Pp | 0/22 / −10,13 | −33,7 % | −3,90 Pp | 0/22 / −3,96 | −24,4 % | 8 / 11 |
| R3 | Haupt Hauptlesart (entscheidet) | −7,89 Pp | 0/22 / −7,96 | −26,6 % | −3,10 Pp | 0/22 / −3,14 | −17,4 % | 14 / 14 |
| R3 | N1 Ausfuehrung zum Schluss des Signaltags (wie im Original) | −6,55 Pp | 0/22 / −6,61 | −21,4 % | −3,77 Pp | 0/22 / −3,82 | −19,5 % | 14 / 14 |
| R3 | N2 Ersatzreihen SHY statt BIL, EFA statt ACWX | −7,63 Pp | 0/22 / −7,70 | −26,2 % | −3,83 Pp | 0/22 / −3,89 | −20,5 % | 14 / 14 |
| R3 | N3 ohne Band (Schluss > SMA200 -> SPY, sonst Geld) | −7,56 Pp | 0/22 / −7,63 | −21,8 % | −6,50 Pp | 0/22 / −6,60 | −26,8 % | 26 / 32 |
| R3 | N4 ohne Kosten | −6,52 Pp | 0/22 / −6,58 | −24,8 % | −1,82 Pp | 0/22 / −1,84 | −14,7 % | 14 / 14 |

## 6 Zweiter Rechner (REGEL §9.1)

| Regel | Fenster | Endwert Regel: Lauf / zweiter Rechner | Endwert SPY: Lauf / zweiter Rechner | Wechsel gleich | Starttage gleich |
|---|---|---|---|---|---|
| R1 | A | 161020.23 / 161020.23 $ | 215548.40 / 215548.40 $ | ja | alle 22 auf den Cent |
| R1 | B | 127172.89 / 127172.89 $ | 181193.89 / 181193.89 $ | ja | alle 22 auf den Cent |
| R2 | A | 141841.27 / 141841.27 $ | 215548.40 / 215548.40 $ | ja | alle 22 auf den Cent |
| R2 | B | 157624.64 / 157624.64 $ | 181193.89 / 181193.89 $ | ja | alle 22 auf den Cent |
| R3 | A | 155669.62 / 155669.62 $ | 215548.40 / 215548.40 $ | ja | alle 22 auf den Cent |
| R3 | B | 157638.54 / 157638.54 $ | 181193.89 / 181193.89 $ | ja | alle 22 auf den Cent |

Nachrichtliche Teile, nach dem Lauf vom zweiten Rechner mit eigenem Code nachgerechnet: Lesarten N1–N5 beim Start am ersten Tag 22 von 22 auf den Cent gleich (mit Wechselzahl); Gesamtlauf 2003–2026 3 von 3 auf den Cent; alle 4.522 Zusatzfenster in Zahl, vorn, Median, schlechtestem Rückschlag und „flacher/gleich“ (mit Toleranz) 3 von 3 Regeln gleich; Stichprobe 24 von 24 Fenstern einzeln gleich.

## 7 Daten und Lauf

- Lauf: 2026-10-04T23:18:29.348Z (UTC), Node v24.18.0, Git-Stand beim Lauf `8715b4a`, Dauer 3,0 s; Siegel `6f9d06f`.
- Rohdaten: Yahoo-Chart, abgerufen 2026-10-04T22:34:22.000Z; kanonische Auszüge gegen `pruefsummen.json` geprüft (SPY 3e24a46f28ed, BIL b10f0f249a3f, SHY 82db57f648fa, ACWX d918ccd244cc, EFA 04826a95e650, AGG 6ad9f47432cb).
- Kalender: 8.464 SPY-Handelstage 29.01.1993–15.09.2026; erster Zusatz-Tag 01.10.2003.
- Fälle mit fehlendem Kurs beim Start am ersten Tag (Erwartung 0): R1A 0, R1B 0, R2A 0, R2B 0, R3A 0, R3B 0. Verschobene Ex-Tage: 0.
- Code-Prüfsummen (SHA-256, erste 12 Zeichen): kern.js eee1fe0f0c2c, laden.js fb1f4265d9e9, lauf.js a3d8ba751a83, regel-R1.js 9731cf55b992, regel-R2.js 53a9acc6c684, regel-R3.js 22a9aab8c178.
- Korrekturen: Nr. 1 (erster Lauf 05.10.2026 01:10 (Code 697e6f3), gefunden beim Abgleich des Zusatzes mit dem zweiten Rechner (R2: 1.514 gegen 1.510 Fenster „flacher als SPY“)): kern.js zusatz/fassen verglich die Rueckschlaege strikt; haelt eine Regel SPY ueber den ganzen groessten Rueckschlag, sind beide mathematisch gleich und Gleitkomma-Rauschen (1e-16) entschied „flacher“ (R2: 184 von 640 solchen Fenstern; R1, R3: keine). Behoben: flacher = mehr als 1e-9 flacher; |Differenz| <= 1e-9 zaehlt als gleich (eigene Zahl gleichWieSpy). Wirkung: nur die nachrichtliche Zusatz-Zeile „flacher als SPY“ (gesamt und je Startjahr); alle anderen Zahlen unveraendert (gegen den ersten Lauf verglichen, siehe ERGEBNIS.md).

<!-- TABELLEN-ENDE -->

## 8 Datenprüfung (REGEL §2.6) und Wirkung der Befunde

Vollständig in `DATENPRUEFUNG.md` und `datenpruefung.json` (eigener Prüfer, liest nur). Kalender lückenlos (0 fehlende, überzählige
oder doppelte Tage in allen gebrauchten Zeiträumen), alle Zeitstempel 09:30 New York, Splits von BIL (30.11.2017) und EFA (09.06.2005)
in Kursen und Ausschüttungen gleich bereinigt, Gesamtertrag aus Schluss und Ausschüttung gegen `adjclose` nach Yahoos eigenem
Verfahren auf 0,0002 % gleich; mit den Schlüssen und Ausschüttungen der zweiten Quelle kippt kein Signal (R1 128, R2 117 Monatsenden,
R3 an 0 von 2.690 Tagen). **Vier belegte Yahoo-Fehler** mit möglicher Wirkung: veraltete SPY-Eröffnungen am 23.01.2017, 01.02.2017 und
02.02.2017 (Starttage im Fenster A) und eine doppelt gebuchte AGG-Ausschüttung am 01.11.2018. **Nachrichtlich nachgerechnet**
(`wirkung-datenbefunde.js`, `wirkung-datenbefunde.json`, Wert der zweiten Quelle an diesen Stellen): die drei betroffenen Starttage
verschieben sich um bis zu 674 $ (SPY) und 504 $ (Regel), der Abstand um höchstens 0,007 Pp p. a.; Start am ersten Tag, Mediane,
Zahl der Starttage vorn, Zusatz und alle drei Urteile bleiben gleich. Die AGG-Ausschüttung trifft keinen Lauf (AGG wird über diesen
Ex-Tag nirgends gehalten).

## 9 Korrekturen und Abweichungen vom Ablauf

- **Korrektur 1 am Rechner** (Einzelheiten oben in Abschnitt 7 und in `ergebnis.json` unter `korrekturen`): der erste Lauf (01:10, Code `697e6f3`)
  zählte im Zusatz bei GEM 184 Fenster als „Rückschlag flacher als SPY“, in denen beide Rückschläge mathematisch gleich sind (GEM hielt
  SPY über den ganzen Rückschlag; Gleitkomma-Rauschen von 10⁻¹⁶ entschied). Gefunden beim Abgleich mit dem zweiten Rechner, der an
  derselben Stelle anders rauschte (1.510 statt 1.514). Behoben in `8715b4a` (Gleichstand bis 10⁻⁹, eigene Zahl „gleich“), Lauf
  um 01:18 wiederholt. **Gegen den ersten Lauf Feld für Feld verglichen:** geändert sind nur diese Zeile (GEM 33,5 % → 29,4 %, dazu je
  Startjahr) und die neuen Felder „flacher“/„gleich“; alle anderen Zahlen sind bit-gleich, die Fensterliste `zusatz-fenster.json`
  bytegleich. Urteile, Fenster A/B, Placebo und Lesarten sind nicht berührt.
- **`test.js` nach dem ersten Lauf:** 23 Abgleiche mit dem zweiten Rechner (Rückschlag, Anteil Tage unter Wasser, Kalenderjahre) waren
  rot, alle mit Abständen unter 5·10⁻¹¹ — `ergebnis.json` speichert Kommazahlen auf zehn Stellen, die Zusicherung verglich auf 10⁻¹².
  Die Zusicherung maß die Ablage, nicht die Rechnung; Toleranz auf 10⁻⁹ gesetzt (Endwerte weiter auf den Cent). Stand jetzt:
  196 grün, 0 rot.
- **Nach dem ersten Lauf ergänzt:** der zweite Rechner hat auf Bitte die nachrichtlichen Teile (N1–N5, Gesamtlauf, alle Zusatzfenster)
  nachgerechnet; seine Zahlen für Fenster A und B standen vor dem ersten Lauf fest (Commit `697e6f3`, 01:10:06; Lauf 01:10:11).
- **Datenprüfung:** gibt nach einer Nacharbeit keine absoluten Kurse mehr aus (nur relative Abweichungen), Inhalt sonst gleich.
- **Ohne Rohdaten** (frischer Klon, `daten/` steht nicht im Repo) überspringen `test-R1.js` und `test-R3.js` ihren Teil auf echten Daten
  jetzt mit Hinweis, statt ihn rot zu zählen (wie `test-R2.js`); mit Rohdaten unverändert. Wiederholen: `node studien/trendfilter-messung-2026-10/laden.js`
  holt die Rohdaten neu und schreibt `pruefsummen.json` neu — `git diff` auf diese Datei zeigt, ob Yahoo die Vergangenheit seither geändert hat
  (Feld `shaKanonisch`); `laden.js --pruefen` hält vorhandene Rohdaten gegen die Datei. Danach `lauf.js`, `test.js`, `bericht.js`.
