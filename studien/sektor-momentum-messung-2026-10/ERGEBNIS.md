# ERGEBNIS — Sektor-Momentum (die drei stärksten von elf SPDR-Sektor-Fonds, alle 21 Handelstage, gleich gewichtet) gegen den S&P 500 nach Kosten

## Kurzfassung

1. **Urteil nach der REGEL: „schlägt nicht" — vorn nur in Fenster B.** Kein Momentum-Befund. Das ist Fehlschlag (a) aus REGEL Teil D; „schlägt nicht" heißt nicht „kein Effekt".
2. **Fenster A** (04.01.2017–15.09.2021): Buch 174.598 $ (+74,6 %, +12,60 % p. a.) gegen SPY 215.548 $ (+115,5 %, +17,77 % p. a.) → **−5,17 Pp p. a.**; **0 von 63** Startphasen vorn; Median −6,74 Pp p. a. (−11,36 bis −4,10). Größter Rückschlag −30,0 % gegen −33,7 %.
3. **Fenster B** (16.09.2021–15.09.2026): Buch 219.648 $ (+119,6 %, +17,06 % p. a.) gegen SPY 181.194 $ (+81,2 %, +12,63 % p. a.) → **+4,42 Pp p. a.**; **63 von 63** vorn; Median +3,73 Pp p. a. (+0,46 bis +6,34). Rückschlag −16,1 % gegen −24,5 %.
4. Je Periode (21 Handelstage) schließt das 95-%-Band in beiden Fenstern 0 ein (A −0,39 ± 0,28 Pp, B +0,30 ± 0,34 Pp): **vom Zufall nicht zu unterscheiden**. B lebt vor allem von 2022 (Buch +10,2 % gegen −18,2 %); 2023, 2024 und 2025 lag das Buch hinten.
5. **Placebo** (drei zufällige Sektoren, sonst alles gleich): A −2,94 Pp p. a. (0 von 63, Median −6,67), B −5,64 Pp p. a. (1 von 63, Median −5,77) — kein Vorsprung. Kandidat gegen Placebo: A bei k = 0 hinten (−2,23), 35 von 63, Median +0,25; B 63 von 63, Median +9,66.
6. **Zusatz 2000–2026 ohne Urteil** (ohne Umsatzschwelle; mit der Schwelle von 100 Mio $ kann die Regel erst ab 02.08.2007 rangieren): Buch +8,44 % p. a. gegen SPY +8,18 % (+0,26 Pp), aber nur 24 von 63 Startphasen vorn, Median −0,26; Rückschlag −46,9 % gegen −55,2 %. Mit Schwelle ab 2007: −0,30 Pp p. a., 1 von 63 vorn.
7. **Rollierende Fünfjahresfenster:** 5.462 Starttage 2000–2021: Buch vorn in **33,8 %**, Median **−1,22 Pp p. a.**, schlechtestes −12,64 Pp (08.09.2016–07.09.2021), bestes +8,70 Pp (26.07.2000–25.07.2005). Mit Schwelle (3.557 Starttage ab 2007): 15,4 % vorn, Median −2,50.
8. **Geprüft:** zwei unabhängige Rechner gleich auf den Cent (alle 4 Läufe, jede Umschichtung, jeder Tag); Daten ohne Lücke gegen das Buch; SPY trifft die Panel-Zahlen auf höchstens 0,04 Pp; der Weg über `adjclose` ändert den Abstand um höchstens 0,08 Pp.
9. **Grenzen:** ein Parametersatz, eine Kursquelle (Yahoo), vor Steuern, Auflösung je Fenster rund ±3,4 bis 4,1 Pp p. a. (ein Standardfehler) — sicher erkennbar wären erst rund 9–12 Pp p. a. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

*Regel `kandidaten-blind-2026-10/sektor-momentum/v1` (REGEL.md, ziel.js, test.js aus `c903255`, ohne Kursdaten geschrieben, unverändert per Merge `bc91128`). Lesarten in [ZUSATZ.md](ZUSATZ.md) (Siegel 1 `f2f4b67`, 05.10.2026 00:30:59, vor dem ersten Kurs). Simulator, Tests, zweiter Rechner und Datenprüfung vor dem Lauf committet (Siegel 2 `0984eb4`, 01:18:30); der eine Lauf 01:18:33–01:18:52 auf `0984eb4`. Korrekturen nach dem Siegel: keine. Alle Tabellen maschinell in [ERGEBNIS-tabellen.md](ERGEBNIS-tabellen.md), alle Zahlen in `ergebnis.json`.*

## Urteil (REGEL Teil D, ZUSATZ §3)

| Fenster | k = 0: Buch > SPY | Startphasen Buch > SPY (≥ 45) | Median des Abstands (> 0) | Zwischenurteil |
|---|---|---|---|---|
| A | nein (−5,17 Pp p. a.) | 0 von 63 | −6,74 Pp p. a. | nicht vorn (keine der drei Bedingungen) |
| B | ja (+4,42 Pp p. a.) | 63 von 63 | +3,73 Pp p. a. | vorn (alle drei Bedingungen) |

„Schlägt SPY" verlangt alle drei Bedingungen in A **und** B → **schlägt nicht (vorn nur in Fenster B)**. Kandidat gegen Placebo (dieselben drei Bedingungen, nur für einen Momentum-Befund von Belang): A k = 0 nein, 35 von 63, Median +0,25 Pp p. a.; B ja, 63 von 63, Median +9,66 Pp p. a. — in beiden Fenstern alle drei: nein. Kein Fenster „nicht ausführbar": 0 `zuWenig`-Tage in allen Läufen.

## Die Fenster im Einzelnen (Start am ersten Tag, k = 0)

| | A: Kandidat | A: Placebo | A: SPY | B: Kandidat | B: Placebo | B: SPY |
|---|---|---|---|---|---|---|
| Endwert (Start 100.000 $) | 174.597,93 $ | 191.410,22 $ | 215.548,40 $ | 219.647,60 $ | 140.176,83 $ | 181.193,89 $ |
| Gesamtertrag | +74,60 % | +91,41 % | +115,55 % | +119,65 % | +40,18 % | +81,19 % |
| p. a. | +12,60 % | +14,83 % | +17,77 % | +17,06 % | +6,99 % | +12,63 % |
| Abstand zu SPY p. a. | **−5,17 Pp** | −2,94 Pp | – | **+4,42 Pp** | −5,64 Pp | – |
| Startphasen vorn; Min / Median / Max (Pp p. a.) | 0 von 63; −11,36 / −6,74 / −4,10 | 0 von 63; −14,23 / −6,67 / −0,02 | – | 63 von 63; +0,46 / +3,73 / +6,34 | 1 von 63; −13,49 / −5,77 / +0,72 | – |
| Abstand je Periode: Mittel ± SE (95-%-Band) | −0,39 ± 0,28 (−0,95 bis +0,17) | −0,18 ± 0,35 (−0,87 bis +0,52) | – | +0,30 ± 0,34 (−0,39 bis +0,99) | −0,42 ± 0,35 (−1,13 bis +0,28) | – |
| Perioden vorn | 28 von 57 | 27 von 57 | – | 34 von 60 | 24 von 60 | – |
| größter Rückschlag (Spanne der 63 Phasen) | −30,0 % (−36,0 bis −30,0) | −39,0 % (−45,6 bis −30,8) | −33,7 % | −16,1 % (−18,3 bis −15,4) | −28,4 % (−35,7 bis −18,3) | −24,5 % |
| gezahlte Kosten (57 bzw. 60 Umschichtungen) | 7.240,81 $ | 21.732,91 $ | 0 $ | 7.757,67 $ | 18.381,95 $ | 0 $ |
| zulässige Fonds je Umschichtung | 9–11 | 9–11 | – | 11 | 11 | – |

t-Werte nach ZUSATZ §2.6: 2,0032 (56 Freiheitsgrade, A) und 2,0010 (59, B). Gehalten werden immer genau drei Fonds; im Fenster A war XLK am häufigsten im Buch (40 von 57 Umschichtungen), im Fenster B XLC und XLK (je 31 von 60) und XLE (29). XLRE lag zu Beginn von A unter der Umsatzschwelle (03.01.2017: 57 Mio $), XLC rangiert erst ab Mitte 2019 — daher 9 bis 11 zulässige Fonds in A.

**Kalenderjahre, Buch gegen SPY (%):** A: 2017 (ab 04.01.) +12,8 / +20,6 · 2018 −6,3 / −4,6 · 2019 +25,1 / +31,2 · 2020 +21,7 / +18,4 · 2021 (bis 15.09.) +8,6 / +20,6. B: 2021 (ab 16.09.) +7,4 / +6,9 · 2022 +10,2 / −18,2 · 2023 +18,0 / +26,2 · 2024 +18,5 / +24,9 · 2025 +9,2 / +17,7 · 2026 (bis 15.09.) +21,5 / +11,7. In A lag das Buch nur 2020 vorn, in B 2021, 2022 und 2026.

**Lesart.** Die Regel wechselt mit dem Fenster: 2017–2021 in allen 63 Startphasen deutlich hinter dem S&P 500, 2021–2026 in allen 63 vorn — genau der Fenster-Wechsel, den REGEL Teil D vorab für wahrscheinlicher hielt als ein Urteil. Der Vorsprung in B stammt im Wesentlichen aus einem Jahr (2022, Energie und Defensive vorn, Abstand +28,4 Pp). Je Periode ist keiner der beiden Abstände vom Zufall zu unterscheiden. Das Placebo liegt in beiden Fenstern hinter SPY: gleich gewichtete Sektoren gegen den kapitalgewichteten, techlastigen Index haben in 2017–2026 nicht geholfen; die Regel schlägt das Placebo in B deutlich, in A nur im Median knapp.

## Zusatz ohne Urteil: 2000 bis 2026 und rollierende Fünfjahresfenster (ZUSATZ §5)

| Langlauf bis 15.09.2026 | Regel mit Schwelle 100 Mio $ | ohne Schwelle |
|---|---|---|
| erster Ausführungstag (erster Tag ab 03.01.2000 mit mindestens 6 zulässigen Fonds) | 02.08.2007 | 03.01.2000 |
| Buch / SPY (Endwert, p. a.) | 694.868 $ (+10,67 %) / 732.298 $ (+10,97 %) | 869.357 $ (+8,44 %) / 815.947 $ (+8,18 %) |
| Abstand p. a., k = 0: Kandidat / Placebo | −0,30 / −3,27 Pp | +0,26 / −4,84 Pp |
| Startphasen vorn; Median | 1 von 63; −1,70 Pp | 24 von 63; −0,26 Pp |
| Abstand je Periode: Mittel ± SE (95-%-Band) | −0,04 ± 0,17 (−0,37 bis +0,29; 230 Perioden) | +0,00 ± 0,13 (−0,26 bis +0,26; 320 Perioden) |
| größter Rückschlag Buch / SPY | −46,9 % / −55,2 % | −46,9 % / −55,2 % |
| Kandidat gegen Placebo: k = 0 / Phasen / Median | vorn / 63 von 63 / +4,03 Pp | vorn / 63 von 63 / +2,87 Pp |

| Rollierende Fünfjahresfenster (je Starttag ein eigener Nachlauf) | mit Schwelle (ab 2007) | ohne Schwelle (ab 2000) |
|---|---|---|
| Zahl der Fenster | 3.557 | 5.462 |
| Kandidat vor SPY | 15,4 % (547) | 33,8 % (1.844) |
| Median des Abstands (10-%- / 90-%-Punkt) | −2,50 Pp p. a. (−5,98 / +0,61) | −1,22 Pp p. a. (−5,21 / +2,93) |
| schlechtestes Fenster | −12,64 Pp (08.09.2016–07.09.2021) | −12,64 Pp (08.09.2016–07.09.2021) |
| bestes Fenster | +6,48 Pp (10.09.2021–09.09.2026) | +8,70 Pp (26.07.2000–25.07.2005) |
| Placebo vor SPY; Median | 4,1 %; −4,80 Pp | 16,9 %; −3,51 Pp |
| Kandidat vor Placebo; Median | 71,9 %; +2,15 Pp | 75,0 %; +2,23 Pp |

Über die Startjahre: ohne Schwelle lag das Buch in fast allen Fenstern mit Start 2000, 2001, 2003 und 2004 vorn (100 / 99 / 92 / 84 %), in keinem mit Start 2012 bis 2016 und in 69 % mit Start 2021 (Tabelle je Startjahr in ERGEBNIS-tabellen.md). Am Stichtag 31.12.1999 lag der Median-Tagesumsatz der neun Fonds zwischen 0 und 21 Mio $; erst am 01.08.2007 erreichten sechs die 100 Mio $ — die frühen Jahre stehen deshalb nur in der Fassung ohne Schwelle. XLK schüttete bis 2007 seltener als vierteljährlich aus, 2000 und 2001 gar nicht, XLI 2001 dreimal (Datenprüfung) — das betrifft nur diesen Zusatz.

## Gesamtertrag auf zwei Wegen (Auftrag, ZUSATZ §4)

Hauptrechnung: Schluss + Ausschüttungen am Ex-Tag (Buch: Bargeld bis zur nächsten Umschichtung; SPY: Wiederanlage zum Schluss). Daneben dieselbe Rechnung auf `adjclose` (Ausschüttung sofort im selben Fonds), k = 0:

| | A: Hauptweg → adjclose | B: Hauptweg → adjclose |
|---|---|---|
| Kandidat | 174.597,93 → 174.870,58 $ (+0,037 Pp p. a.) | 219.647,60 → 220.352,42 $ (+0,075 Pp p. a.) |
| Placebo | 191.410,22 → 191.800,22 $ (+0,050 Pp p. a.) | 140.176,83 → 140.375,18 $ (+0,030 Pp p. a.) |
| SPY | 215.548,40 → 215.446,34 $ (−0,012 Pp p. a.) | 181.193,89 → 181.159,53 $ (−0,004 Pp p. a.) |
| Abstand Kandidat − SPY | −5,168 → −5,119 Pp p. a. | +4,423 → +4,502 Pp p. a. |

Der Unterschied kommt aus dem Zeitpunkt der Wiederanlage, nicht aus den Daten (in der Datenprüfung stimmt jede Stufe von `adjclose / close` mit einer Ausschüttung überein, Abweichung ≤ 1,2·10⁻⁶). Er ändert kein Urteil.

## Prüfungen

- **Zwei Rechner** (ZUSATZ §6): `sektor.js` (ruft `ziel.js`, `gleichgewicht` aus `korb.js`, die Kennzahlen aus `rueckblick.js` und `bewerte` aus `mfhandel.js` unverändert) und `zweitrechner.js` (nur aus den Regeltexten gebaut, ohne diesen Code zu lesen). Für k = 0 in A und B, Kandidat und Placebo: Endwerte von Buch und SPY gleich auf den Cent, alle 57 bzw. 60 Umschichtungen gleich (Tag, Stichtag, Ziel, Stückzahlen, Bargeld), alle 1.183 bzw. 1.254 Tageswerte von Buch und SPY gleich, Bargeld bis auf 1·10⁻¹³ $ (`vergleich-rechner.json`). Der zweite Rechner nennt 14 Lesart-Stellen; keine führte zu einer Abweichung.
- **Tests:** `test.js` dieses Ordners 211 grün (Kunstdaten, von Hand gerechnete Sollwerte; 83 von 86 gezielten Ausbau-Proben werden rot, die drei übrigen ändern nichts am Verhalten), `zweitrechner-test.js` 158 grün, `test.js` der REGEL 76 grün. Lint ohne Fehler.
- **Daten** ([DATENPRUEFUNG.md](DATENPRUEFUNG.md)): 12 Dateien einmal geladen (05.10.2026 00:31, `pruefsummen.json`), 0 entfallene oder doppelte Balken, 0 fehlende Fonds-Tage gegen den SPY-Kalender, Kalender A 1.183 / B 1.254 Handelstage und gleich dem Kalender des Tages-Panels. Splits 2:1 am 05.12.2025 (XLB, XLE, XLK, XLU, XLY) und XLF 19.09.2016 (Abspaltung XLRE): Kurse, Umsätze und Ausschüttungen in derselben Einheit. Keine Ausschüttung fehlt in A oder B (zweite Quelle Alpaca ab 2016). Yahoo führt die SPY-Ausschüttung vom 15.06.2018 selbst (1,246 $); die Ergänzung aus REGEL A.6 griff nicht. SPY-Pflichtprüfung: (i) +115,91 % gegen +115,95 %, (ii) 215.548,40 $ gegen 215.535,73 $, (iii) 181.193,89 $ gegen 181.193,87 $, (iv) 23,8670 / 34,0620 $ gegen 23,8656 / 34,0657 $ — alle in der Toleranz.
- **Bekannter Datenfehler, nachrichtlich:** an 17 Reihen-Tagen in A/B liegt Yahoos Eröffnungskurs außerhalb dessen, was laut Alpaca-Minuten gehandelt wurde (bis 1,15 %). Kein Ausführungstag bei k = 0 fällt darauf; mit der Minuten-Eröffnung an diesen Tagen ändern sich über alle Startphasen höchstens ein Median um 0,04 Pp und kein Urteil (`empfindlichkeit-eroeffnung.json`). Die Messung handelt wie festgelegt zum gelieferten Kurs.

## Grenzen

Ein Parametersatz (12 Monate, drei Fonds, 21 Tage, gleich gewichtet), zwei Fenster und ein Zusatz; die 63 Startphasen teilen sich dieselben Jahre und haben bei 21-Tage-Takt nur 21 verschiedene Taktlagen (REGEL C.8). Eine Kursquelle (Yahoo; Schlusskurse gegen Alpaca-Minuten im Mittel höchstens 0,013 % daneben). Vor Steuern; Kosten 20 Bp je Seite auf jedes gehandelte Volumen, keine Spannen-Messung. Die Auflösung liegt weit über der Größe, die die Literatur erwarten ließ (REGEL Teil D: −4 bis +3 Pp p. a.): ein Standardfehler je Fenster entspricht rund 3,4 (A) und 4,1 (B) Pp p. a. Das Ergebnis sagt nichts über Aktien-Momentum, andere Rückblicke oder Takte, die Zukunft oder ein Handeln in der App.

## Dateien

| Datei | Inhalt |
|---|---|
| `ZUSATZ.md` | die Lesarten, vor dem ersten Kurs committet (Siegel 1) |
| `laden.js`, `pruefsummen.json` | Ladeskript (Yahoo v8/chart) und SHA-256 der zwölf Rohdateien; die Rohdaten liegen nicht im Repo |
| `datenpruefung.js`, `datenpruefung.json`, `DATENPRUEFUNG.md` | Datenprüfung (nur Bericht) |
| `sektor.js`, `lauf.js`, `test.js` | Simulator, der eine Lauf, Prüfungen |
| `zweitrechner.js`, `zweitrechner-test.js`, `zweitrechner.json` | unabhängiger zweiter Rechner, Ausgabe k = 0 |
| `ergebnis.json`, `ERGEBNIS-tabellen.md`, `rollierend.json` | alle Zahlen, die Tabellen, je rollierendes Fenster die Abstände |
| `abschluss.js`, `vergleich-rechner.json` | Vergleich der Rechner; danach Tagesreihen und Endwerte je Fenster aus den Ausgaben entfernt (Umformung der Kurse, Daten Dritter) |
| `empfindlichkeit-eroeffnung.js`, `empfindlichkeit-eroeffnung.json` | nachrichtlich: Wirkung der fehlerhaften Eröffnungskurse |

Nachrechnen: `node laden.js` (oder eigene Kopie mit denselben Prüfsummen), `node test.js`, `node lauf.js`, `node zweitrechner.js --lauf`, `node abschluss.js`, je aus der Repo-Wurzel mit Pfad `studien/sektor-momentum-messung-2026-10/`.
