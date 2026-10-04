---
tags: [befund]
---
# Belegstand

> ## **Belegte handelbare Kanten: NULL.**
> Stand 03.09.2026. Das ist seit Wochen der Stand und er ist ehrlich.
> **Neu seit 02.09.:** Für **31 von 52** gemessenen Varianten ist zusätzlich die **Größe
> ausgeschlossen** — obere 95-%-Grenze unter der CFD-Hürde 0,1247 Pp. Siehe Abschnitt
> „Größen-Ausschlüsse" unten.
> **Neu am 03.09.:** Die Kassa-Hürde ist **gemessen** statt angenommen (55.455 Zeitpunkte,
> [kosten.md](kosten.md)) — und sie ist **klassenspezifisch, Faktor 3,5 zwischen den
> Klassen**. Von den 31 sind damit **2 wieder offen** (beide glockendruck, belegte Klasse),
> 14 endgültig zu, 15 unentschieden mangels belegter Klasse. **„Wieder offen" ist eine
> Größenaussage, kein Ertragsbeleg** — die Zahl der belegten Kanten bleibt **NULL**.
> **Neu am 08.09.:** Die **Signalstudie auf Minutenbasis** (5m/15m, 45.096 Dateien, 2,37 Mrd Kerzen, 7.299 Reihen mit 4.993 Verschwundenen, Kassa-Hürde je Klasse) findet **0 von 144 Konfigurationen**, die auch nur das Entdeckungstor bestehen — bei sauberen Placebos und einer Auflösung, die eine Kante von 0,02 Pp gesehen hätte. Die bekannten Intraday-Detektoren sind auf 5- und 15-Minuten-Basis unter Kassa-Kosten **gemessen tot**. 1m ist nicht gemessen. Abschnitt „Signalstudie Minuten" unten.

> **Neu am 09.09.:** Der **Trendkanal auf Tagesbasis** (7.299 Aktien inkl. 4.801 verschwundene, 6,08 Mio Wert-Tage, 1,31 Mio Trades, Haltedauer 5/10/20 Tage und „bis Kanalbruch") ist gemessen: **kein Kanal-Einstieg schlägt den Topf.** Der Abschnittskanal der App ist als Einstieg **in jeder Umsatzklasse zu** (Rücklauf an die untere Linie: t −3,4 bis −4,3 gegen den Topf); der Ausbruch verdient roh nur die Marktdrift und bleibt unter ihr. Die einzigen drei Tor-1-Kandidaten (Donchian 55, Rücklauf long) sind in der Entdeckung ein Ausreißer-Mittel (t = 1,0) und in der Bestätigung deutlich negativ. Abschnitt unten.
> **Neu am 23.09.:** Die **Mehrfaktor-Kombination** (sieben vorab festgelegte Signale — Momentum, niedrige Schwankung, Bewertung, Ertragskraft, Investition, Gewinnüberraschung, F&E — gleichgewichtet als Rangkombination, 92 Monate 2017–2024, registrierter Test: Rang-IC) ist **nicht entscheidbar unterhalb von IC 0,05** (gemessen IC 0,012, t 0,69). Das Dezil oben netto liegt bei −0,18 Pp mit MDE₈₀ 0,74 — nichts Handelbares, nichts Ausgeschlossenes. Die Zahl der belegten Kanten bleibt **NULL**; die Zahl der belegten Informationssignale ebenfalls.
> **Neu am 03.10.:** Die **Nachrichten-Stimmung** (GDELT-Ton je Symbol und Tag als Rang im Querschnitt, Klassen 250–1.000 und ab 1.000 Mio $, 2.396 Signaltage 2017–2026, Haltedauer 1/3/5 Tage) ist gemessen: **zwölfmal „nicht belegt"**, brutto zwischen −0,036 und +0,045 Pp (|t| ≤ 1,5). Bei einem Tag Haltedauer liegt die obere 95-%-Grenze des Brutto-Effekts bei +0,006 Pp — weit unter der Kassa-Hürde 0,062: **in der Größe ausgeschlossen**. Die Zahl der belegten Kanten bleibt **NULL**.
> **Neu am 03.10. (Kapitulation):** Die Kapitulation V2 ist auf dem sauberen Minutenarchiv (7.299 Aktien mit 4.993 verschwundenen) im nie gemessenen Fenster 2016 … 25.09.2023 neu gemessen: **netto −0,024 Pp je Signaltag, Band [−0,649; +0,601], 528 Signaltage — die behauptete Größe (+1,107 Pp) ist zurückgewiesen.** Vermerk: das Urteil hängt an der Buchung der Verschwundenen (strenge Regel: nicht entscheidbar). Das alte Fenster ergibt auf sauberem Archiv +0,395 Pp (t 1,39). Die Scoreboard-Zeile `kapitulation` (alte Maschine, +1,107) ist überholt.

## Kapitulation V2, Neumessung (03.10.2026) — in der behaupteten Größe zurückgewiesen

| Sache | Zahl | Fundstelle |
|---|---|---|
| **Urteilsgröße** (Tagesmittel netto gegen den Tagestopf, Fenster bis 2023-09-25) | **−0,024 Pp**, se 0,319 (größte aus naiv 0,275 / Hansen-Hodrick 0,294 / Blöcke 0,319), Band **[−0,649; +0,601]**, MDE₈₀ 0,894; brutto +0,062 | `studien/kapitulation-neu-2026-10-03/ERGEBNIS.md`, `lauf/stufe-b.json`, Vorregistrierung §11 (Siegel `594273e`, Lauf `6997c59`) |
| Umfang | 528 Signaltage, 6.054 Signale (Median 5 je Signaltag, Maximum 319), 15,9 % auf später Verschwundenen, 5 Totalverlust-Buchungen | `lauf/zaehlung.json` |
| Empfindlichkeit Verschwundene (Pflichtvermerk) | streng (Totalverlust auch für unbekannt/freiwillig): −0,083 Pp, MDE₈₀ 1,158 → „nicht entscheidbar"; letzter Kurs für alle: −0,012 Pp | `lauf/nachrichtlich.json` |
| Kontrollen | Nullpunkt t −0,58, Placebo ohne Kursbezug t −0,20, Leck-Klinke 0 Abweichungen, Strategiedatei zeichengleich mit dem Protokoll vom 26.08. | `lauf/*.json` |
| Nachrichtlich | altes Fenster (26.09.2023 … 24.08.2026) auf sauberem Archiv +0,395 Pp (t 1,39), nur lebend +0,359; Hälften des Bestätigungsfensters −0,399 / +0,306; gegen die Kontrolle des alten Protokolls −0,187 | `lauf/nachrichtlich.json` |

**Lesart:** Der große Wert des alten Protokolls (+1,107 Pp bei 98 Tagen) hält weder im unberührten Fenster noch — in dieser Größe — auf sauberem Archiv im alten Fenster. Über Kosten-Tauglichkeit sagt die Messung nichts (se 0,319 gegen Hürden von 0,05–0,16 Pp): ein kleiner Effekt in Hürdengröße ist weder belegt noch ausgeschlossen. PM-Nachrechnung aus den Rohjournalen mit eigenem Code: identisch (−0,0238 Pp, 528 Signaltage, 6.054 Signale).

## Rückblick über fünf Jahre: Momentum-Regel gegen den S&P 500 (04.10.2026) — breiter Markt 2021–2026: nicht geschlagen; Korb der 187 umsatzstärksten in zwei Fenstern vorn (Median +7,6 und +8,4 Pp p. a.), getragen von je einem Schub; vom Zufall nicht zu unterscheiden

*Keine Studie mit Urteil über eine Kante, sondern die beschreibende Zahl zu Wilhelms Regel vom 04.10.2026 („nach Kosten den S&P 500 schlagen — Rückblick fünf Jahre, dann einige Monate Vorwärtstest"). Regel vor der Zahl festgelegt, ein Lauf.*

| Sache | Zahl | Fundstelle |
|---|---|---|
| **Hauptzahl** (Start 16.09.2021, Ende 15.09.2026, 20 Basispunkte je Seite, Gesamtertrag auf beiden Seiten) | Buch **+65,2 % (10,57 % p. a.)** gegen SPY **+81,2 % (12,63 % p. a.)** → **−2,06 Pp p. a. — „schlägt den Markt: nein"** | `studien/massstab-rueckblick-2026-10-04/ERGEBNIS.md`, `ergebnis.json` (Siegel `152cc07`, Ergebnis `cf6e718`) |
| Zufallsbereich: 63 Startphasen | Abstand **−3,47 bis +7,89 Pp p. a.**, Median +1,62; **41 von 63** vor dem Markt (Starttage 0–27 und 58–62 um null oder darunter, 28–57 deutlich darüber) | `ergebnis.json` → `zufallsbereich.startphasen` |
| Zufallsbereich: Periodenstreuung (Start 16.09.2021) | +0,63 Pp je Periode, Standardfehler 3,07, 95-%-Band −5,79 bis +7,05; 8 von 20 Perioden vor dem Markt | ebd. |
| Größter Rückschlag | Buch **−40,2 %** gegen SPY −24,5 % (über die 63 Phasen −36 bis −45 %) | `ergebnis.json` → `haupt`; Phasen: Gegenprobe des PM |
| Letzte Periode 25.06.–15.09.2026 | Buch **−25,1 %** gegen SPY +3,3 % — echter Einbruch der Vorjahressieger (Median der Positionen etwa −28 %, kein Sprung aus einer Bereinigung); bis 24.06.2026 stand das Buch bei 220.500 $ gegen 175.400 $ | Übergabe; Gegenprobe des PM Position für Position |
| Kalenderjahre (Buch / SPY) | 2021 ab 16.09.: −3,4 / +6,9 · 2022: −16,9 / −18,2 · 2023: +9,4 / +26,2 · 2024: +42,2 / +24,9 · 2025: +31,4 / +17,7 · 2026 bis 15.09.: +0,7 / +11,7 | `ERGEBNIS.md` |
| **Was gemessen wurde** | die Regel des Buchs (mit den Funktionen der App nachgespielt) auf **allen liquiden Aktien des Panels** mit den verschwundenen: 515–923 zulässige Werte, Zielzahl 52–92, gehalten 48–78. **Das Buch der App wählt aus 187 großen Werten** (Zielzahl 19, im Buch 19 Positionen) — das ist ein anderer Korb. *(Hier stand zuerst „148, Zielzahl 15": Zählfehler des PM, berichtigt 04.10.2026.)* | Fehler im Auftrag des PM (§1.7 „weitgehend dieselbe Menge" war nicht nachgesehen); App-Bestand am 04.10. gelesen |
| Vorwärtstest des Buchs der App | seit 25.08.2026: Momentum **+14,7 %** gegen SPY +0,8 % (Kurs, beide ohne Ausschüttungen), Drift −0,6 %; 38 Tagespunkte bis 04.10.2026 | Kopie des App-Bestands, `massstab.js` und von Hand |

**Lesart:** Nach der vorher festgelegten Hauptzahl schlägt die Regel den S&P 500 **nicht**; über die 63 Starttage liegt sie in zwei Dritteln der Fälle vorn, im Mittel leicht, bei fast doppelt so tiefem Rückschlag — der Unterschied zwischen „ja" und „nein" ist die Lage der Umschichtungstage im Quartal, also Zufall. Ein klares „schlägt den Markt" ist das nicht. Für den Korb, den die App wirklich handelt (wenige große Werte), sagt die Zahl nichts Sicheres; ein Rückblick auf der heutigen Liste der App wäre durch die Auswahl geschönt. Zwei unabhängige Rechnungen (Studien-Chat, PM) stimmen in der Hauptzahl überein (−2,06 / −2,05 Pp p. a.).

**Nachtrag 04.10.2026 09:44 — Vorab-Rechnung des PM mit einem Korb wie in der App (eine Rechnung, ohne unabhängige Gegenprobe; Wilhelms Entscheid „Ich rechne es selbst vor"):** je Stichtag nur die **187 umsatzstärksten** Aktien des Panels (so viele Werte führt die App; Zielzahl 19), sonst dieselbe Regel und derselbe Rechner, der die amtliche Hauptzahl getroffen hat. Regel vor der Zahl (`studien/massstab-rueckblick-2026-10-04/pm-korb148/REGEL-KORB148.md`, Siegel `c0d3f30`, Nachtrag 1 `fddcf18`), Ergebnis `142fd35`.

| Korb | Buch (p. a.) | S&P 500 (p. a.) | Abstand p. a. | Startphasen vorn (Min / Median / Max) | Abstand je Periode | größter Rückschlag |
|---|---|---|---|---|---|---|
| breiter Markt, 515–923 Werte (amtlich, Nr. 74) | +65,2 % (10,57 %) | +81,2 % (12,63 %) | **−2,06 Pp** | 41 von 63 (−3,47 / +1,62 / +7,89) | +0,63 ± 3,07 | −40,2 % |
| **187 umsatzstärkste** (Vorab-Rechnung, berichtigt) | **+154,9 % (20,59 %)** | +81,2 % (12,63 %) | **+7,96 Pp** | 62 von 63 (−0,01 / +8,25 / +19,07) | +4,29 ± 4,94 | **−56,9 %** |
| 148 umsatzstärkste (erster Lauf, Zählfehler) | +95,1 % (14,31 %) | +81,2 % (12,63 %) | +1,68 Pp | 63 von 63 (+1,68 / +10,54 / +16,97) | +2,98 ± 4,95 | −57,6 % |

**Lesart der Vorab-Rechnung:** Mit dem engeren Korb liegt die Regel im Rückblick deutlich vor dem S&P 500 — nach der vorher festgelegten Hauptzahl „ja". Drei Dinge gehören dazu: (1) **der Korb ist nicht die Liste der App** — nur 118 ihrer 187 Werte stehen darin, und das Ergebnis machten gerade die anderen (am längsten im Buch: MSTR, NVDA, PLTR, SMCI, CVNA, APP, HOOD; zeitweise AMC, GME, MARA, RIOT, COIN, IONQ, OKLO — bis auf NVDA führt die App keinen davon); (2) **der Weg dorthin:** 2021 ab September −11 %, 2022 −33 %, größter Rückschlag −57 %, einzelne Position bis 23 % des Buchs; die Gewinne stammen aus 2024 bis 2026; (3) **vom Zufall nicht zu unterscheiden:** +4,3 Pp je Periode bei einem Standardfehler von 4,9, 20 Perioden, ein Fenster. Die Antwort hängt am Korb: breit −2 Pp p. a., eng +8 Pp p. a. Für die Liste, die die App wirklich handelt, gibt es keinen sauberen Rückblick (die Liste ist mit dem Wissen von heute gewählt). Vom PM geprüft: der breite Korb trifft im selben Lauf die amtliche Zahl; 118 Positions-Perioden gegen Yahoo im Mittel 0,43 Pp Abweichung; keine Sprünge aus Bereinigungen. **Ein zweiter, unabhängiger Lauf steht aus** und ist vereinbart, bevor auf diese Zahl hin echtes Geld eingesetzt wird.

**Nachtrag 04.10.2026 (Nr. 78, abgenommen 12:57) — Gegenprobe auf 2017 bis 2021, zweiter unabhängiger Lauf, Variante „Gleichgewicht".** Regel vor der Zahl (Siegel `bbe4586`), ein Lauf (`756a9c1`), `studien/momentum-korb-2026-10-04/` (`REGEL.md`, `ERGEBNIS.md`, `ergebnis.json`). Die beiden vorher festgelegten Sätze: **Gegenprobe A-187 „hält"**; **zweiter Lauf B-187 „bestätigt die Vorab-Rechnung"** (gemeint ist der Rechner, nicht das Buch).

| Lauf | Buch (p. a.) | S&P 500 (p. a.) | Abstand p. a., Start am ersten Tag | Startphasen vorn (Min / Median / Max) | Abstand je Periode | größter Rückschlag Buch / S&P 500 | größtes Gewicht |
|---|---|---|---|---|---|---|---|
| **A-187** — 04.01.2017–15.09.2021, 187 umsatzstärkste, Mechanik der App | +157,5 % (22,32 %) | +115,5 % (17,77 %) | **+4,55 Pp** | 62 von 63 (−0,36 / **+7,59** / +15,14) | +2,06 ± 2,79 | −49,0 % / −33,8 % | 20,1 % |
| A-breit — dasselbe Fenster, alle zulässigen (396–631) | +216,0 % (27,77 %) | +115,5 % (17,77 %) | +10,00 Pp | 61 von 63 (−2,07 / +7,52 / +14,21) | +2,98 ± 2,66 | −42,4 % / −33,8 % | 8,3 % |
| **B-187** — 16.09.2021–15.09.2026, zweiter Rechner | +154,9 % (20,59 %) | +81,2 % (12,63 %) | **+7,96 Pp** | 62 von 63 (−0,01 / **+8,36** / +19,91) | +4,29 ± 4,94 | −56,9 % / −24,5 % | 22,6 % |
| A-187-gleich — alle Ziele je Umschichtung gleich gewichtet | +188,9 % (25,35 %) | +115,5 % (17,77 %) | +7,58 Pp | 63 von 63 (+0,91 / +8,73 / +16,12) | +2,39 ± 2,25 | −42,0 % / −33,8 % | 16,4 % |
| B-187-gleich | +125,1 % (17,64 %) | +81,2 % (12,63 %) | +5,00 Pp | 57 von 63 (−4,66 / +5,43 / +21,51) | +3,19 ± 4,34 | −55,8 % / −24,5 % | 14,1 % |

**Lesart.** (1) Der Vorsprung des Korbs 187 steht in beiden Fenstern, **aber er stammt je aus einem Schub**: 2017–2021 aus dem Jahr 2020 (die eine Periode ab 07.04.2020 bringt +40,4 Pp, alle 19 Perioden zusammen +39,1; bis Ende 2019 lag das Buch mit +35,0 % gegen +51,0 % hinten, in vier von fünf Kalenderjahren ebenso), 2021–2026 aus 2024/25 (bis Ende 2023 −36,6 % gegen +10,4 %; die Periode ab 19.09.2024 bringt +53,0 von +85,8 Pp). (2) **Vom Zufall nicht zu unterscheiden:** das 95-%-Band des Abstands je Periode schließt in allen fünf Läufen null ein; die 63 Startphasen teilen sich dieselben Jahre und sind kein zweiter Nachweis. (3) **Die Antwort hängt am Korb, und die Richtung wechselt:** 2017–2021 war der breite Markt besser (+10,00 gegen +4,55 Pp p. a.), 2021–2026 der Korb 187 (+7,96 gegen −2,06). (4) Rückschlag −49 % und −57 % gegen −34 % und −24 % beim S&P 500. (5) „Gleichgewicht" bringt keinen einheitlichen Vorteil (2017–2021 besser, 2021–2026 schlechter), senkt aber das größte Gewicht. (6) Alles vor Steuern (→ Nr. 82). **Nicht geprüft:** keine zweite Kursquelle und keine Sprung-Durchsicht für 2017–2021; Ausschüttungen der Aktien ohne zweite Quelle. Der Korb ist nicht die Liste der App.

**Abnahme des PM.** Siegel vor Ergebnis, Code nach dem Siegel unverändert; `test.js` selbst gefahren (169 grün). **Eigener Rechner des PM, Zahlen um 12:19 festgehalten — vor der Lieferung um 12:42** (Kratzordner `pm-nr78-gegenrechnung.json`, sha256 `9e70fa19b096ab14…`): S&P 500 in allen Läufen auf den Cent gleich; B-187 254.875,85 $ gegen 254.872,40 $; beide Gleichgewichts-Läufe in allen 63 Phasen auf höchstens 0,14 Pp p. a. gleich; A-187 an allen 19 Umschichtungstagen auf 0,01 % gleich — erst in der letzten Periode laufen die Rechner auseinander (257.544 $ gegen 252.946 $). **Aufgeklärt bis zur einzelnen Position:** im Rechner des PM blieb am 08.04.2021 eine Kleinstposition von 0,0001 Stück FCX hängen (Cent-Beträge Bargeld, weil er Ausschüttungen vor statt nach dem Handel gutschreibt); damit galt FCX am 08.07.2021 als gehalten, das Geld ging an PINS, und PINS fiel am 30.07.2021 nach Zahlen um 18 %. Zahl der Phasen vorn in allen fünf Läufen gleich (62 / 61 / 62 / 63 / 57), beide Sätze gleich. Maßgeblich ist der Rechner des Agenten (er folgt der Regel aus Nr. 74 und trifft deren Zahl auf den Cent).

**Fund des PM bei dieser Abnahme: die Mechanik des Buchs lässt Plätze leer und erzeugt Kleinstpositionen (→ Nr. 85).** Mit dem amtlichen Rechner mitgezählt (Lauschstelle um `fuehreAus`, Endwerte unverändert), über alle 63 Startphasen:

| Lauf | Umschichtungen | davon mit zu wenig Bargeld | geplante Käufe voll | verkleinert | Kleinstkauf (unter 5 % des Budgets) | ganz ausgefallen |
|---|---|---|---|---|---|---|
| A-187 | 1.183 | **1.070** | 10.106 | 983 | 318 | 1.064 |
| A-breit | 1.183 | 1.137 | 24.170 | 1.021 | 705 | 6.554 |
| B-187 | 1.254 | **1.123** | 10.051 | 1.043 | 466 | 1.993 |

Ursache: Gewinner werden nie zurückgestutzt, jeder neue Kauf bekommt aber Depotwert / Zielzahl — die Verkaufserlöse reichen nicht. `fuehreAus` verkleinert dann bis auf 0,0001 Stück (Beispiele im Lauf A-187: MRO 0,0003 Stück = 0,6 Cent statt 7.020 $; im Lauf B-187: SOUN, HIMS, BABA, JOBY, AAOI), und `planeUmschichtung` hält die Kleinstposition danach für eine volle und stockt nie auf — der Platz bleibt leer, solange der Wert Ziel ist. Je Umschichtung fallen im Schnitt ein bis zwei Ziele ganz aus (die mit der schwächsten Stärke, weil in Rangfolge gekauft wird). **Folgen:** (a) die Zahl je Starttag ist zerbrechlich — zwei richtige Rechner weichen in einzelnen Phasen um bis zu 3,4 Pp p. a. ab; **die ruhige Zahl ist der Median der Phasen**; (b) das Buch der App verhält sich genauso: heute 19 Positionen, keine unter 4.600 $, Bargeld 0 (vom PM am Bestand gelesen) — die erste Umschichtung ist um den 23.11.2026 fällig. Gemessen ist damit genau diese Mechanik; ob sie bleibt, entscheidet Wilhelm.

**Nachtrag 04.10.2026 (Nr. 81) — der Maßstab der App nach dem Umbau, am echten Bestand nachgerechnet.** Seit Nr. 81 nimmt die App den Markt aus der bereinigten SPY-Reihe (mit Ausschüttungen). Am echten Bestand (Kopie, mit `massstab.js` und von Hand): Momentum +14,7 % · S&P 500 **+0,7 %** · Abstand +14,0 Pp; Drift −0,6 % · +0,7 % · −1,3 Pp (seit 25.08.2026, Stand 04.10.). **Aus dem Minutenarchiv gerechnet** ist der Markt seit dem Kaufzeitpunkt des Buchs (25.08.2026 18:15 UTC, SPY 764,83 $) um +0,63 % gestiegen, mit der Ausschüttung vom 18.09.2026 (1,889 $) um **+0,88 %**. Die App zeigt 0,14 Pp weniger, weil sie dem ersten Verlaufspunkt den Tagesbalken des 25.08. zuordnet — der trägt den Stempel der Eröffnung, aber den Schlusskurs (765,83 $), also einen Stand knapp zwei Stunden nach dem Kauf. Vorher (Nr. 73) stand dort +0,8 % als Kursertrag ab dem Schluss des Vortags (763,46 $). Beide Abweichungen liegen bei 0,1 bis 0,2 Pp und ändern am Bild nichts; der Anfang wird mit dem nächsten App-Auftrag berichtigt (Nr. 87). Die Bücher buchen weiter keine Ausschüttungen — so beschriftet. **Dazu ein Fund aus Nr. 81, der den Vorwärtstest verfälschen kann:** ein Split in einer gehaltenen Position wird nicht gebucht (Stückzahl bleibt, der bereinigte Kurs fällt — Scheinverlust); bisher ist kein Fall eingetreten (alle 19 Positionen zum Kaufwert 5.074 bis 5.274 $, heute 4.630 bis 7.621 $).

**Nachtrag 04.10.2026 (Nr. 82, abgenommen 14:01) — derselbe Rückblick nach Steuern: deutsches Privatdepot gegen einen thesaurierenden Indexfonds. Rechenmodell mit Annahmen, keine Steuerberatung.** Regel vor der Zahl (Siegel `669b093`), ein Lauf (`872a090`), `studien/nach-steuern-2026-10-04/` (`REGEL.md`, `ERGEBNIS.md`, `ergebnis.json`).

| Lauf | Lesart | Buch p. a. | Indexfonds p. a. | Abstand p. a. | Startphasen vorn | Median des Abstands |
|---|---|---|---|---|---|---|
| **Korb 187, 2017–2021** | vor Steuern (Nr. 78) | +22,32 % | +17,77 % | +4,55 Pp | 62 von 63 | +7,59 Pp |
|  | nach Steuern, bleibt stehen | +19,76 % | +17,35 % | +2,42 Pp | 56 von 63 | +3,62 Pp |
|  | **nach Steuern, alles verkauft** | +18,75 % | +14,83 % | **+3,92 Pp** | 60 von 63 | **+5,13 Pp** |
| **Korb 187, 2021–2026** | vor Steuern (Nr. 78) | +20,59 % | +12,63 % | +7,96 Pp | 62 von 63 | +8,36 Pp |
|  | nach Steuern, bleibt stehen | +18,64 % | +12,15 % | +6,49 Pp | 57 von 63 | +5,90 Pp |
|  | **nach Steuern, alles verkauft** | +16,67 % | +10,40 % | **+6,26 Pp** | 60 von 63 | **+6,06 Pp** |
| breiter Markt, 2017–2021 | vor Steuern (Nr. 78) | +27,77 % | +17,77 % | +10,00 Pp | 61 von 63 | +7,52 Pp |
|  | nach Steuern, alles verkauft | +21,59 % | +14,83 % | +6,77 Pp | 59 von 63 | +4,43 Pp |
| breiter Markt, 2021–2026 | vor Steuern (Nr. 74) | +10,57 % | +12,63 % | −2,06 Pp | 41 von 63 | +1,62 Pp |
|  | nach Steuern, alles verkauft | +8,20 % | +10,40 % | −2,20 Pp | 37 von 63 | +0,66 Pp |

**Lesart.** (1) Nach Steuern bleibt der Korb 187 in beiden Fenstern vor dem Indexfonds; die Steuer nimmt dem Vorsprung im Median der Startphasen rund 2,3 bis 2,5 Pp p. a. (+7,59 → +5,13 und +8,36 → +6,06). Der breite Markt 2021–2026 bleibt hinten. (2) Die Steuer bremst das Buch im Median um 3,3 bis 5,4 Pp p. a., den Fonds um 2,2 bis 2,9 — das Buch versteuert jeden Gewinn bei jeder Umschichtung (gezahlt 44.460 $ und 41.565 $ auf 100.000 $ Startkapital), der Fonds fast erst beim Verkauf (Vorabpauschalen 165 $ und 1.056 $, Endverkauf 20.524 $ und 13.373 $). (3) „Bleibt stehen" vergleicht ein versteuertes Buch mit einem weitgehend unversteuerten Fonds — deshalb ist der Abstand dort kleiner. (4) Im Fenster 2021–2026 zahlt das Buch bis 2024 keine Aktiensteuer (Verlustvortrag aus 2022 bis −48.466 $). (5) Die Zahl für den ersten Starttag ist auch hier zerbrechlich (das besteuerte Buch ist nach dem ersten Verkauf ein anderes Buch); die ruhige Zahl ist der Median. (6) Alle Vorbehalte des Rückblicks gelten weiter: je Fenster ein Schub, Rückschlag −49 % und −57 %, der Korb ist nicht die Liste der App, je Periode vom Zufall nicht zu unterscheiden.

**Annahmen des Modells (vom PM festgelegt):** Steuersatz 26,375 %, kein Sparer-Pauschbetrag, heutiges Steuerrecht für alle Jahre, Dollar wie Euro gerechnet (kein Wechselkurs); Buch mit der Mechanik der App, Steuer zwischen Verkäufen und Käufen, Aktien-Verlusttopf mit laufender Abrechnung im Jahr, Ausschüttungen netto; Fonds: Kurs des SPY, Ausschüttungen zu 85 % wieder angelegt, 0,07 % Kosten im Jahr, Vorabpauschale mit den amtlichen Basiszinsen 2018–2026 (2017: 0,59 % ist eine Annahme, Wirkung 76 $), Teilfreistellung 30 %, ohne Kauf- und Verkaufskosten.

**Abnahme des PM.** Siegel vor Ergebnis; `test.js` selbst gefahren (160 grün); mit Steuersatz 0 trifft der Rechner alle 4 × 63 Phasen aus Nr. 78 und Nr. 74 auf den Cent. **Eigene Gegenrechnung des PM** (eigene Steuerschicht auf dem eigenen Nachspieler; Modell um 13:34 festgelegt, Korb 187 / 2017–2021 um 13:36 gerechnet — vor der Lieferung um 13:52; die drei übrigen Läufe um 13:58 ohne Änderung am Modell): der **Fonds stimmt in beiden Fenstern auf den Dollar** (Steuer 20.689 $ und 14.429 $; +14,83 % und +10,40 % p. a.); Korb 187 / 2021–2026 beim ersten Starttag gleich (+16,67 %, +6,26 Pp, Steuer 41.564 $ gegen 41.565 $); breiter Markt +6,92 gegen +6,77 und −2,23 gegen −2,20 Pp; Korb 187 / 2017–2021 +2,96 gegen +3,92 Pp (der Rechner des PM nimmt dort ab dem 08.04.2021 den anderen Pfad, siehe Nr. 78). Startphasen vorn nach Steuern: 60 / 61 / 59 / 38 gegen 60 / 60 / 59 / 37; Median: +5,23 / +6,09 / +4,37 / +0,83 gegen +5,13 / +6,06 / +4,43 / +0,66 Pp p. a.

**Nachtrag 04.10.2026 (Nr. 85, abgenommen 14:46) — derselbe Rückblick mit Regel K gegen Kleinstpositionen: „Regel K kann in die App".** Regel K (Wilhelms Entscheid „nur Kleinstpositionen abstellen"): kein Kauf unter 5 % des Platzwerts; ein Bestand unter 5 % des Platzwerts gilt nicht als gehalten. Regel vor der Zahl (Siegel `b58e64a`), ein Lauf (`b71fbd1`), `studien/momentum-korb-kleinst-2026-10-04/` (`REGEL.md`, `ERGEBNIS.md`, `ergebnis.json`). Die Regel steht als **ausgeschalteter** Schalter in `mfhandel.js` (`157b5dd`); die App rechnet bis Nr. 87 unverändert.

| Lauf (ohne → mit Regel K) | Abstand p. a., Start am ersten Tag | Startphasen vorn (von 63) | Median des Abstands | größter Rückschlag | Kleinstkäufe | ausgefallene Käufe | leere Plätze je Umschichtung |
|---|---|---|---|---|---|---|---|
| Korb 187, 2017–2021 | +4,55 → +5,69 Pp | 62 → 63 | +7,59 → **+7,32** | −49,0 → −49,0 % | 318 → 0 | 1.064 → 1.566 | 1,37 → 1,36 von 19 |
| Korb 187, 2021–2026 | +7,96 → +7,51 Pp | 62 → 61 | +8,36 → **+8,25** | −56,9 → −56,9 % | 466 → 0 | 1.993 → 2.617 | 2,11 → 2,10 von 19 |
| breiter Markt, 2017–2021 | +10,00 → +9,87 Pp | 61 → 61 | +7,52 → +7,07 | −42,4 → −42,1 % | 705 → 0 | 6.554 → 7.700 | 6,64 → 6,61 von 48 |
| breiter Markt, 2021–2026 | −2,06 → −2,19 Pp | 41 → 41 | +1,62 → +1,76 | −40,2 → −40,2 % | 1.052 → 0 | 14.259 → 16.093 | 13,01 → 13,00 von 67 |

**Lesart.** (1) Die vorher festgelegte Marke (Median mit Regel höchstens 2,0 Pp p. a. unter dem ohne) ist in allen vier Läufen eingehalten: −0,26 / −0,12 / −0,45 / +0,14. (2) **Regel K räumt das Buch auf, sie füllt es nicht:** die Plätze bleiben gleich oft leer, weil das Bargeld weiter fehlt (Gewinner werden nicht gestutzt) — aus dem Kleinstkauf wird ein ausgefallener Kauf. Das entspricht dem Entscheid; wer die Plätze füllen wollte, müsste gleich gewichten (abgelehnt). (3) Die einzelne Startphase verschiebt sich um bis zu −3,1 / +2,4 Pp p. a.; die ruhige Zahl bleibt der Median. (4) Mit Regel K verschwindet der Unterschied zwischen dem Rechner der Studie und dem des PM (er hing an einem Kleinstbestand, siehe Nachtrag Nr. 78).

**Abnahme des PM.** Änderung in `mfhandel.js` Zeile für Zeile gelesen (ohne Schalter dieselbe Rechnung in derselben Reihenfolge); `test-v6.js` selbst gefahren (5.255 grün, 0 rot; vorher 5.220), `test-channel.js`, Lint, Studientest (80 grün); Siegel vor dem Lauf (Git-Zeit 14:25:39, Lauf ab 14:25:49). **Eigene Gegenrechnung mit Regel K** im Rechner des PM (eigene Ziel-, Ausschüttungs- und Bewertungslogik, Handelsmechanik aus der App): Korb 187 / 2017–2021 Endwert 269.034 $ gegen 269.037 $ der Studie, 63 von 63 vorn, Median +7,32, Spanne +0,92 bis +15,08 — alles gleich; Korb 187 / 2021–2026 250.120 $ gegen 250.123 $, 61 von 63, Median +8,25, Spanne −1,25 bis +18,42 — alles gleich; breiter Markt beim Start am ersten Tag 314.563 $ gegen 314.561 $ und 164.334 $ gegen 164.275 $. Verbrauch 426k bei 250k (Abrechnung; Chat schätzte 200k).

**Nachtrag 04.10.2026 (15:35) — doppelte Vorgänger-Reihen im Panel, Wirkung auf diesen Rückblick nachgerechnet.** Im Tages-Panel v2.2 stehen 310 abgegangene Reihen doppelt (die Quelle liefert unter dem neuen Kürzel die Geschichte des alten mit; [datenquellen.md](datenquellen.md), Abschnitt „Dritter Zähllauf", [fehlerformen.md](fehlerformen.md)). Eigener Rechner des PM, Mechanik der App mit Regel K, die 310 Reihen aus dem Universum genommen: **Korb 187, 2017–2021: Median der 63 Startphasen +7,27 statt +7,32 Pp p. a., 63 von 63 vorn, Start am ersten Tag +5,32 statt +5,69; Korb 187, 2021–2026: unverändert (+8,25, 61 von 63, +7,51).** Der Befund des Rückblicks steht; die Läufe auf dem breiten Markt sind nicht nachgerechnet.

**Nachtrag 04.10.2026 (17:37) zum Nachtrag „doppelte Vorgänger-Reihen":** die Zahl 310 war zu klein (Rechenweise des PM, siehe [datenquellen.md](datenquellen.md), Abschnitt „Vierter Zähllauf"); mit allen 388 Zwillingen (Toleranz 1e-9) aus dem Universum genommen: Korb 187, 2017–2021, mit Regel K: **Median der 63 Startphasen weiter +7,27 Pp p. a.**, 63 von 63 vorn; der Start am ersten Tag sinkt auf +4,72 (mit Zwillingen +5,69); 2021–2026 unverändert (+8,25, 61 von 63). Der Befund steht; die Einzelzahl je Starttag bleibt zerbrechlich, die ruhige Zahl ist der Median.

## Ergebnis-Drift tagesgenau (04.10.2026) — gemessen: **nicht entscheidbar**; das Buch endet knapp vor dem S&P 500, aber im Bereich des Zufalls — **kein Vorwärtstest**

**Messung (Nr. 88, abgenommen 04.10.2026 14:42) — Wilhelms Regel: ein Test über die letzten fünf Jahre als Buch gegen den S&P 500, Regel vor der Zahl.** `studien/vorregistrierung-2026-10-04-ergebnis-drift/` (`VORREGISTRIERUNG.md`, `ERGEBNIS.md`, `ergebnis.json`; Siegel `8567df4` um 14:30:24, der eine Lauf 14:30:31 bis 14:30:57, Ergebnis `435d747`, keine Korrektur). Fenster: Einstiegstage 16.09.2021 bis 15.09.2026, 14.184 Meldungen von 1.248 Firmen der Klassen 50-250, 250-1000, ab1000; die Jahre 2017 bis 15.09.2021 bleiben verschlossen (kein zweiter Blick).

| Größe | Ergebnis |
|---|---|
| **Buch gegen den S&P 500** (40 gleich große Plätze; Kauf des obersten Zehntels der Überraschung zur Eröffnung nach der Meldung, Verkauf 60 Handelstage später, Rest in SPY, nach Kosten) | Buch **+84,2 %** (13,01 % p. a.) gegen S&P 500 +81,2 % (12,63 % p. a.) — Abstand **+0,38 Pp p. a.**, +3.043 $ auf 100.000 $ |
| Zufallsbereich | 200 Bücher mit einer Zufallszahl an Stelle der Überraschung: Mitte +56,6 %, 5 %–95 %: +34,4 bis +88,2 %. **16 von 200 liegen über dem Buch** — die Regel verlangt für einen Vorwärtstest höchstens 10 → **kein Vorwärtstest angezeigt** |
| Woran der Abstand hängt | die zehn größten Positionen tragen zusammen 28.349 $ (ohne sie −3,34 Pp p. a.); in 59 von 200 Zufallsbüchern ist diese Summe größer. 2023 und 2024 lag das Buch 15 und 13 Pp hinter dem Index, 2022, 2025 und 2026 davor. Größter Rückschlag −21,6 % (S&P 500 −24,5 %) |
| Stufe 1, 60 Handelstage (gegen das Mittel der Umsatzklasse am selben Tag) | oberstes gegen unterstes Zehntel +2,09 Pp (t 1,67); Kaufseite +1,57 Pp, nach Kosten **+1,39 Pp (t 1,97**, obere 95-%-Schranke +2,78 Pp); alle Melder −0,01 Pp; Kaufseite gegen alle Melder +1,58 Pp (t 2,72). Das Tor (t ≥ 2,5 für beide Größen) ist verfehlt, die Schranke liegt nicht unter 1 Pp → **nicht entscheidbar** |
| 20 Handelstage (daneben, entscheidet nichts) | +1,18 Pp (t 2,22); Kaufseite nach Kosten +0,43 Pp (t 1,21) |
| Selbstprüfung | Placebo (letzte Ziffer der Akzessionsnummer) +0,23 und +0,93 eigene Fehler (Soll ±2); Positivkontrolle 78,5 % (Soll ab 65 %) |
| Auflösung | blind bestimmt 1,91 Pp (Abstand) und 1,49 Pp (Kaufseite) über 60 Tage; mit den Fehlern der echten Zuteilung 3,5 und 2,0 Pp — die Überraschungen ballen sich stärker nach Tagen als eine Zufallszahl |

**Lesart.** (1) Nach Wilhelms Maßstab ist das **kein Beleg**: das Buch endet einen Hauch vor dem Index, aber jedes zwölfte Zufallsbuch auch. (2) Gegen andere Melder ist die Kaufseite auffällig (+1,58 Pp über 60 Tage, t 2,72), gegen den Index nicht: wer in diesem Fenster nach Quartalsmeldungen in diesen Klassen kaufte, lag im Mittel weit hinter dem S&P 500 (Zufallsbücher in der Mitte +56,6 % gegen +81,2 %) — die Überraschung holt diesen Rückstand gerade auf. (3) „Nicht entscheidbar" heißt hier: ein Effekt bis rund 2,8 Pp je 60 Tage ist nicht ausgeschlossen, einer über 1 Pp nicht belegt.

**Grenzen.** Ein Fenster, eine Regel, ein Lauf. Meldungen nur bis 30.06.2026 (die Bilanz-Tafel endet dort), danach läuft das Buch in SPY aus. Überraschung aus dem später eingereichten Bericht, kein Analysten-Konsens. 44 % der Meldungen des obersten Zehntels verfielen, weil alle 40 Plätze besetzt waren — das Buch kauft, was in der Meldesaison zuerst kommt. **Eröffnungskurs am Meldetag:** der Kurs des Tagesbalkens und die erste Minute ab 09:30 weichen in zehn Stichproben des PM im Mittel um 0,8 % voneinander ab (bis 1,8 %, in beide Richtungen) — rund das Zehnfache der angenommenen Kosten je Seite; die +0,38 Pp p. a. liegen weit darin.

**Abnahme des PM.** Siegel vor dem Lauf (Git-Zeiten; der Blind-Modus lädt die Überraschung nicht — am Code nachgelesen); `test.js` selbst gefahren (158 grün). **Eigene Nachrechnung nach dem Lauf, mit derselben Regel:** Zehntel-Zuteilung neu geschrieben — 0 Abweichungen bei 25.298 Ereignissen; das Buch aus dem Regeltext neu geschrieben — Endwert 184.237,35 $ auf den Cent, alle Zähler gleich (756 Käufe, 615 + 10 verfallen, 18 schon gehalten, 752 Verkäufe, 4 Reihenenden, Kosten 3.810 + 217 $); Mittelwerte der Stufe 1 für beide Haltedauern gleich; Maßstab 181.193,87 $; die 16 von 200 nachgezählt; an zehn Käufen den Einstiegstag gegen die Annahmezeit nachgesehen (alle richtig) und die Kurse gegen die Rohminuten gehalten. Gemeinsam mit der Studie und deshalb nicht unabhängig: Panel, Ereignismenge, Ausschüttungsdaten, die Fehlerrechnung der Stufe 1. Verbrauch 400k bei 400k (Abrechnung; Chat schätzte 250k).

**Machbarkeit (Nr. 80), Stand vor der Messung:**

*Keine Messung. Meldezeiten der Quartalszahlen von der SEC geholt, blind gezählt, Auflösung bestimmt (Nr. 80, `studien/ergebnis-drift-ereignis-2026-10-04/MACHBARKEIT.md`, `7dd6329`). Wilhelm hat am 04.10.2026 entschieden zu messen — das Ergebnis steht darüber.*

| Sache | Zahl |
|---|---|
| Meldungen (8-K Punkt 2.02, 2016–2026) | 126.907 bei 4.341 Firmen, alle mit Annahmezeit der SEC; 38 % vor Handelsbeginn, 6 % im Handel, 56 % nach Handelsschluss. Zeitprüfung 10 von 10 gegen den Kopf der Einreichung (die Annahmezeit ist Weltzeit). |
| Ereignisse für eine Messung | **25.298** in den Klassen 50-250, 250-1000, ab1000 (1.418 Firmen, 1.876 Einstiegstage, 2017 bis 15.09.2026); 7,8 % von später verschwundenen Firmen; 2016 fällt weg (250 Vortage des Universums). |
| Überraschung | Zeitreihen-Größe wie das Feld `sue` (kein Analysten-Konsens), aus dem Bericht, der in 54 % der Fälle erst nach dem Meldetag eingereicht wurde. |
| **Auflösung (80 % Macht)** | Abstand oberstes gegen unterstes Zehntel: 0,44 / 0,69 / 1,11 / 2,45 Pp über 1 / 5 / 20 / 60 Handelstage. **Kaufseite (oberstes Zehntel gegen das Klassenmittel — die Seite, die Wilhelm handeln könnte): 0,31 / 0,48 / 0,78 / 1,63 Pp.** Jede Meldung gleich gewichtet: Kaufseite 0,23 / 0,33 / 0,59 / 1,07. Zuschlag für Ballung: rund ein Viertel. |
| Kosten | 0,08 bis 0,21 Pp je Umlauf (Einstieg zur Eröffnung), im Mittel 0,19 — nicht das Hindernis. |
| Erwartung aus der Literatur (**aus dem Gedächtnis des Modells, nicht nachgeschlagen**) | früher rund 4 Pp Abstand und 2 Pp Kaufseite über 60 Tage; in liquiden Werten seit den 2000ern stark geschrumpft. Die alte Größe läge über der Auflösung, die halbe darunter (Macht auf der Kaufseite dann 4 bis 41 %). |
| Tore | die Projektregel „Entdeckung ≥ 4 × Bestätigungs-MDE" verlangte hier 10,5 Pp und ist für keinen erwarteten Effekt passierbar — der Entwurf der Vorregistrierung schlägt zwei andere Fassungen vor. |

**Grenzen:** die Uhrzeit der Pressemitteilung ist nicht zu haben (Einstieg immer zur nächsten Eröffnung; die erste Reaktion ist nie Teil des Ertrags); ausländische Werte ohne 8-K und 203 Firmen mit Wechsel der SEC-Kennung fehlen; die Größe misst gegen das Klassenmittel, nicht gegen den S&P 500 — dafür bräuchte es ein Buch mit Kapitalbindung (Entwurf §11). **Abnahme des PM:** 132 Prüfungen selbst gefahren; Blindheit am Code nachgelesen (die Auflösung nimmt nur Tag, Quartal und bereinigten Ertrag entgegen); Auszug und Zeitprüfung an Apple und JPMorgan nachgesehen; die naiven Fehler und die Kostenzeile nachgerechnet.

## VWAP-Trend und EMA-Stapel auf QQQ, SPY, IWM, Minutenkerzen (04.10.2026) — die veröffentlichte Regel stimmt in ihrem Fenster und hält auf den drei Jahren danach nicht

*Anlass: Wilhelm zeigte ein Instagram-Reel (fünf Options-Bots auf QQQ, SPY und IWM; Signale laut Autor VWAP und EMA 9/21/50 auf 1-Minuten-Kerzen; Gewinnzähler „+66.559 $ in 23 Handelstagen") und bat, die Strategien zu prüfen. Die Regeln des Reels sind nicht bekannt; gemessen ist der Kern am Basiswert. Regel vor der Zahl — Auftrag Nr. 89R (im Studienordner und in den Commits „Nr. 89"; die Nummer wurde am selben Tag von der ersten PM-Sitzung ein zweites Mal vergeben), `studien/reel-vwap-ema-2026-10-04/` (`REGEL.md`, `ERGEBNIS.md`, `ergebnis.json`), erstes Siegel `3c96c2d`, Siegel des abschließenden Laufs `aa32c79`, Ergebnis `4920f2b`. Keine Studie mit Urteil „belegt": beschreibende Zahlen nach vorher festgelegten Sätzen.*

| Sache | Zahl |
|---|---|
| **Eichung am Papier** (Zarattini/Aziz, SSRN 4631351: VWAP-Trend auf QQQ, 02.01.2018–28.09.2023, 0,0005 $ je Aktie, keine Slippage) | +677 % bei 23.190 Trades, Trefferquote 17,0 %, größter Rückschlag 8,4 %, Sharpe 2,11 — das Papier nennt +671 %, rund 21.967, rund 17 %, 9,4 %, 2,1 |
| **Hauptlauf: VWAP-Trend, QQQ, Handel zur nächsten Eröffnung, 29.09.2023–30.09.2026 (vom Papier nicht gesehen)** | **„hält nicht"** — ohne Kosten +7,0 % p. a. (+3,15 Basispunkte je Tag, t 1,07), 0,19 Basispunkte je Trade bei 16,7 Trades je Tag; **Kostengrenze 0,09 Basispunkte je Seite**; bei 0,25 Basispunkten −13,4 % p. a. (t −1,69), bei 1,0 −54,0 % p. a.; Kaufen-und-Halten +27,1 % p. a. |
| dasselbe Fenster, nachrichtlich | VWAP-Trend: SPY +0,4 % p. a. ohne Kosten (t 0,20), IWM −11,0 % (t −0,98). EMA-Stapel (EMA 9/21/50 plus VWAP — Nachbau des PM, nicht die Regel des Reels): QQQ +0,8 % (t 0,26), SPY +0,8 %, IWM −11,5 %. Alle fünf „hält nicht"; bei 0,25 Basispunkten −15,5 % bis −27,9 % p. a. |
| Fenster des Papiers, Handel zur nächsten Eröffnung | QQQ +44,8 % p. a. ohne Kosten (t 5,85), Kostengrenze 0,48 Basispunkte je Seite; bei 0,25 Basispunkten +18,3 % p. a. (t 2,71), bei 1,0 −35,5 % p. a. SPY: Kostengrenze 0,18, IWM 0,23 |
| davor, 04.01.2016–29.12.2017 | QQQ +1,8 % p. a. ohne Kosten (t 0,34) — der Effekt fehlt |
| Ereignis-Sicht im Urteilsfenster (Ertrag über 5, 15, 30, 60 Minuten nach dem Signal, abzüglich des Tageszeit-Mittels) | 24 Zellen, größtes t 2,1 (VWAP-Wechsel SPY, 60 Minuten, +0,21 Basispunkte); für 24 Zellen läge die Schwelle bei etwa 3,1 |

**Lesart.** (1) **Das Papier stimmt in seinem Fenster** — von zwei unabhängig geschriebenen Rechnern am eigenen Minutenarchiv nachgebaut. (2) **Der Vorteil ist winzig und auf dieses Fenster beschränkt:** rund 1 Basispunkt je Trade 2018–2023, davor nichts, danach 0,19 Basispunkte je Trade und von null nicht zu unterscheiden. (3) **Bei 17 Trades am Tag entscheidet die Reibung alles:** im Urteilsfenster trägt die Regel 0,09 Basispunkte je Seite; selbst im Fenster des Papiers kippt sie bei 1,0 Basispunkten ins Minus. (4) QQQ einfach zu halten brachte im Urteilsfenster +27,1 % p. a. **Nicht gemessen:** die Regeln des Reels selbst (unbekannt — das Folge-Reel liegt hinter der Instagram-Anmeldung), die Options-Seite (Optionskurse fehlen; die Hürde von 1,0 Basispunkten je Seite ist eine Schätzung des PM), die Annahme 0,25 Basispunkte für die Aktie, „Buy the Dip" und „Theta Gang". Der Gewinnzähler des Reels ist damit weder bestätigt noch widerlegt — er ist kein Beleg, und die genannten Zutaten tragen ihn nach dieser Messung nicht.

**Abnahme des PM (zweite Sitzung, 13:43).** Eigene Gegenrechnung, unabhängig geschrieben, Zahlen um 13:19 festgehalten (Log-Commit `7bce3aa`, 13:20) — vor dem ersten Siegel des Agenten (13:32): alle 252 Läufe verglichen, größte Abweichung 0,03 im t, 8 Trades, 0,0014 Basispunkte in der Kostengrenze; Hauptlauf Gesamtertrag +22,37 % in beiden Rechnern, Kostengrenze 0,0944 in beiden; alle sechs Sätze gleich. `test.js` selbst gefahren (99 grün). Eine Korrektur des Agenten nach dem ersten Lauf (Trefferquote bei Ertrag genau null), Diff gelesen: nur die Zählung der Gewinner, alle Erträge unverändert. Datenlücke im Archiv: QQQ am 02. und 03.05.2018 nur je eine reguläre Kerze (im Fenster der Eichung, nicht im Urteilsfenster).


**Nachtrag 04.10.2026 (Nr. 89R-2, abgenommen 17:11) — die Regeln aus dem Folge-Reel: drei Auslöser und seine Ausstiegsstruktur.** Wilhelm nahm am Nachmittag das Folge-Reel auf, in dem der Autor seine Regeln erklärt (Optionen mit einem Tag Laufzeit am Kurs; Auslöser: Kerzenschluss über/unter VWAP, über/unter EMA 50, Ausbruch aus den ersten 15 Minuten; VWAP-Kreuze übersprungen, wenn EMA 9 und 21 eng liegen; Ausstiege nach ATR; Gewinn-Tagesziel; laut Einblendung Gewinnsicherung ab +6 % auf die Option, Verkauf bei 40 % Rückgabe, Verlustbremse aus). `studien/reel-ausloeser-struktur-2026-10-04/` (Siegel `d18cc2c`, Korrektur nur am Berichtstext `4965f2c`, Ergebnis `9476c32`), Urteilsfenster 29.09.2023–30.09.2026. Die Option ist über den Basiswert genähert (Delta 0,5, Prämie 0,49 % des Kurses, Stopp 17 % der Prämie = 1 R, Kosten 1 % der Prämie; Filter-Schwelle 0,5 ATR, 5 Minuten Pause — alles Annahmen des PM).

| Sache | Zahl |
|---|---|
| **Ereignis-Sicht** (QQQ, alle drei Auslöser, Ertrag 5 Minuten nach dem Signal, abzüglich der Tageszeit) | **„kein Richtungsvorteil"** — −0,11 Basispunkte, Standardfehler 0,05, t −2,22 (29.779 Ereignisse); von 90 Zellen (3 Werte × 5 Auslöser × 6 Haltezeiten) 13 mit |t| ≥ 2, alle negativ, keine über der Schwelle für 90 Zellen; das VWAP-Kreuz trifft Teil 1 genau |
| **Struktur-Sicht, QQQ** — Bot mit seinen Auslösern | 7.033 Trades (9,3 je Tag), Trefferquote 72,9 %, Gewinner +0,37 R / Verlierer −1,04 R, **−0,012 R je Trade** (t −1,37), 53 % grüne Tage, schlechtester Tag −8,8 R, in keinem der 32 Blöcke zu 23 Handelstagen alle Tage grün |
| dieselben Zeitpunkte, Richtung gewürfelt (200 Läufe) | −0,012 R je Trade [−0,026; +0,002], Trefferquote rund 73 %, 53 % [49; 56] grüne Tage, 23 grüne Tage in Folge in 0 % der Blöcke — **„die Auslöser tragen gegenüber gewürfelter Richtung nichts bei"** |
| gewürfelte Zeitpunkte und Richtung | −0,017 R je Trade [−0,032; −0,003], 54 % grüne Tage, 0 % der Blöcke |
| SPY, IWM; Fenster davor (nachrichtlich) | überall derselbe Satz; SPY −0,039 R je Trade (t −4,6), IWM −0,009 R; 2018–2023 IWM +0,030 R gegen eine Zufallsgrenze von +0,030 (am Rand), QQQ +0,009 R |

**Lesart.** (1) Seine Auslöser zeigen keine Richtung an — eher leicht gegen die Folgebewegung. (2) **Die hohe Trefferquote macht allein die Ausstiegsstruktur:** kleines gesichertes Gewinnziel, weiter Stopp — mit gewürfelter Richtung ebenso rund 73 % Gewinner. (3) Mit „Feierabend beim Gewinnziel, keine Verlustbremse" endet nur gut die Hälfte der Tage grün; 23 grüne Tage in Folge kamen in keinem Wert, keinem Fenster und keinem der Zufallsläufe vor. Das Bild aus dem Reel (alle Tage grün, steigend) entsteht aus dieser Mechanik nicht. **Grenzen:** Option nur genähert (kein Gamma, kein Zeitwertverlust, keine echten Optionskurse); Ausstiege werden genau an Stoppkurs bzw. Marke gefüllt — an Kunstreihen um +0,009 bis +0,066 R je Trade zu günstig, für Bot und Kontrollen gleich (die absoluten R-Zahlen sind also eher zu gut); die vier Annahmen oben sind gesetzt, nicht aus dem Reel. **Abnahme des PM (zweite Sitzung).** Eigene Gegenrechnung, unabhängig geschrieben (eigener Leser, keine Bausteine des Agenten), Zahlen um 16:45 festgehalten (Log `2e1b465`), Siegel des Agenten 17:05: Auslöser-Zählungen in allen drei Werten gleich (QQQ 108.049 „Alle"), alle 270 Zellen der Ereignis-Sicht auf die letzte Stelle gleich, Bot in allen 9 Wert-Fenster-Läufen gleich (Trades, R je Trade, t, grüne Tage, schlechtester Tag, Blöcke); die Zufallsläufe weichen nur im Würfel ab (Mediane auf ±0,002 R). 94 Prüfungen selbst gefahren; die Korrektur nach dem ersten Lauf ändert nur den Berichtstext.

## Nachrichten-Stimmung, Tagesdesign (03.10.2026) — nicht belegt, in 9 von 12 Tests in der Größe ausgeschlossen

| Test (Klassen 2+3 gepoolt) | Δ̄ brutto | se | obere 95-%-Grenze | Hürde (ein Umlauf) | Größe |
|---|---|---|---|---|---|
| Ton-Rang · 1 Tag · Dezil gegen Universum | −0,016 | 0,011 | +0,006 | 0,062 | **ausgeschlossen** |
| Ton-Rang · 1 Tag · Long-Short | +0,011 | 0,021 | +0,052 | 0,124 | **ausgeschlossen** |
| Ton-Rang · 3 Tage · Dezil | −0,036 | 0,023 | +0,009 | 0,062 | **ausgeschlossen** |
| Ton-Rang · 3 Tage · Long-Short | +0,001 | 0,049 | +0,097 | 0,124 | **ausgeschlossen** |
| Ton-Rang · 5 Tage · Dezil | −0,033 | 0,036 | +0,038 | 0,062 | **ausgeschlossen** |
| Ton-Rang · 5 Tage · Long-Short | −0,014 | 0,079 | +0,141 | 0,124 | offen |
| Ton-Änderung · 1 Tag · Dezil | −0,002 | 0,013 | +0,023 | 0,062 | **ausgeschlossen** |
| Ton-Änderung · 1 Tag · Long-Short | +0,010 | 0,020 | +0,049 | 0,124 | **ausgeschlossen** |
| Ton-Änderung · 3 Tage · Dezil | −0,002 | 0,024 | +0,045 | 0,062 | **ausgeschlossen** |
| Ton-Änderung · 3 Tage · Long-Short | +0,031 | 0,039 | +0,107 | 0,124 | **ausgeschlossen** |
| Ton-Änderung · 5 Tage · Dezil | +0,003 | 0,030 | +0,062 | 0,062 | an der Hürde — offen |
| Ton-Änderung · 5 Tage · Long-Short | +0,045 | 0,052 | +0,147 | 0,124 | offen |

Fundstelle: `studien/nachrichten-stimmung-tage-2026-09-19/ERGEBNIS.md`, `protokoll.json`, Vorregistrierung §13 und Nachtrag 4. Das registrierte Urteil lautet in allen zwölf Tests „nicht belegt: nichts oberhalb von <MDE₈₀>"; die Spalte „Größe" ist die Lesart des PM aus der Urteilstafel (obere Grenze = Δ̄ brutto + 1,96 × se, drei Stellen). **Einschränkungen:** Placebo 1 und das Abdeckungstor sind im Lauf gefallen — nach Durchsicht Fehler der Kriterien (Schranke unter einem Standardfehler; künftiger Ton folgt dem Kurs; drei Klassen-Jahre mit 77–80 % statt 80 % Abdeckung), nicht der Messung; die Hauptzelle ist vom PM unabhängig nachgerechnet (identisch). Nur 105 von 220–400 Universumsmitgliedern tragen an einem Tag einen definierten Ton; Klasse 1 und kleinere Werte sind nicht gemessen. Nebenbeobachtung ohne Urteil: der Ton der **Zukunft** hängt mit der heutigen Rendite zusammen (Long-Short t 2,1 … 2,9) — Nachrichten folgen dem Kurs.

## Mehrfaktor-Kombination (Runde 1b, 23.09.2026) — nicht entscheidbar

| Sache | Zahl | Fundstelle |
|---|---|---|
| **Rang-IC der Kombination** (der eine registrierte Test) | **0,0124**, se 0,0180, **t 0,69**, MDE₈₀ **0,0505**; erwartet 0,02–0,03 → „nicht entscheidbar unterhalb von IC 0,0505" (Tor V2 war vorab gefallen: Faktor 5 über dem Kunstfeld-Boden) | `studien/mehrfaktor-2026-09-22/ERGEBNIS-KOMBINATION.md`, Vorregistrierung §12 (Siegel `71f8da3`, Lauf `9bc3563`) |
| Dezil oben − Universum netto (Diagnose) | **−0,176 Pp**, se 0,265, MDE₈₀ 0,743, Umschlag 29 %, Kosten 0,024 Pp | dieselbe Zelle |
| Einzelfelder (Diagnose, v1.1-Zellen) | Dezil netto: Momentum +0,85 (MDE 1,49), Ertragskraft +0,29 (0,67), SUE +0,15 (0,48), Investition +0,13 (0,73), Schwankung −0,25 (1,09), Bewertung −0,20 (1,04), F&E −0,15 (2,11); Kontrolle Verschuldung +0,46 (0,47, t_HH 3,1 — Kontrolle, kein Signal) | `zellen/*-bericht.md`, `wiki/mehrfaktor-vorpruefung.md` |
| Nullpunkt | Orakel IC exakt 1, Zufall-Boden IC 0,0106 / Dezil 0,31 Pp, Placebo Symbole, Leck-Klinke — alle bestanden, 13 Zellen + Kombination | `pruefung/kombination-pruefungen.json` |
| Datenfunde nebenbei | Fundamentaltafel v1.1 (Aktien-Skala 330 CIKs, 414 falsche Kürzel→CIK, 17 Einheitenfehler), Panel: 101 verklebte Reihen (Nr. 58 offen) | `wiki/offene-auftraege.md` Nr. 58–60 |

**Lesart:** Die Kombination trägt keine messbare Information über die Rangfolge der nächsten Monatsrenditen — bei einer Auflösung, die einen IC von 0,05 bräuchte, während die Literatur 0,04–0,06 vor Zerfall nennt. Das ist die Auflösungswand in ihrer Querschnittsform: 92 Monate reichen weder für ein Dezil (MDE 0,74 Pp) noch für den IC. **Rückhaltefenster (§8, 23.09. 22:46, `4fe9c89`):** 24 Signaltage 2024-09…2026-08, IC 0,0095 (se 0,0255, t 0,37, MDE₈₀ 0,072) — nach §8 „bestätigt" (gleiches Vorzeichen), der Sache nach Rauschen; Dezil oben netto −0,30 Pp (MDE₈₀ 1,22). Gesamtreihe 116 Monate: IC 0,0118, t 0,78, MDE₈₀ 0,043. Die 92 Monate vor 2024-09 reproduzieren die versiegelte Zelle exakt. **Ergebnis der Studie: nicht entscheidbar — kein belegtes Informationssignal, keine handelbare Kante.**

## Widerlegt (gemessen tot)

| Sache | Zahl | Fundstelle |
|---|---|---|
| **News-Sentiment (Übernacht, Großwerte)** | **b = +0,0070 Pp/Score-Punkt, t = 0,31** — mitten im Placebo-Band. Selbst die Obergrenze des 90-%-Bandes liegt **Faktor 8,5 unter der CFD-Hürde** (und 4,1 unter der Aktienhürde). 33.307 Beobachtungen, 1.338 Tages-Cluster, 233.625 Meldungen. **Gilt für überlebende Großwerte über Nacht mit der Scorer-Funktion aus `quant.js` — nicht für Nebenwerte, andere Fenster oder andere Scorer.** | `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md` |
| Stunden-Strategie (Technik-Score) | **t = −11,6** — Kontraindikator, nicht nur wirkungslos | Gedächtnisprotokoll + `#hourlyEnabled` steht in der App als „widerlegt – abgeschaltet" |
| glockendruck-nacht | **Effekt stirbt in liquiden Werten** (≥1 Mrd $: H=1 +0,023 Pp, t 0,68). *Ergänzt 02.09.:* breit H=1 ist **real und gedeckelt** — Band [0,021, **0,068**] Pp, liegt vollständig unter der CFD-Hürde | `studien/vorregistrierung-2026-09-01-glockendruck-haltedauer/`, Commit `6263f1b` · Obergrenze: `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2 |
| nachtstoss-umkehr | Gegenrichtung; Richtungssäule von den eigenen Autoren zurückgenommen | `studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/ERGEBNIS.md` |
| abgabedruck-nacht | — | `studien/vorregistrierung-2026-08-27-abgabedruck-nacht/ERGEBNIS.md` |
| Supertrend-Regelwerk | EMA-/RSI-Filter tragen null, halbieren aber die Signale | `studien/63-supertrend/` |
| Abschnittskanäle **als Bedingung** | −0,17 Pp, t = −4,1 → nur Anzeige | Gedächtnisprotokoll |
| Monatswende | war Marktzeitgeschäft, nicht Saisonalität | Gedächtnisprotokoll |
| Krypto-Dip-Modi, Bullenflagge | verlieren bzw. widerlegt | Gedächtnisprotokoll |
| Große Signalstudie | **0 von 51 Detektoren bestätigt**, 3.372 Tests | `studien/signalstudie-2026-08/` |

**Die Übernacht-Familie ist komplett durchgemessen: vier von vier NEIN.** *Ergänzt 02.09.:* und
**die Größe ist gedeckelt** — alle H=1-Varianten (abgabedruck, nachtstoss, glockendruck; breit,
Zeitschnitte bis 2020 / ab 2021, liquide) haben obere Grenzen zwischen −0,010 und 0,091 Pp,
also unter der CFD-Hürde; nur glockendruck H≥3 ist zu grob gemessen („nicht messbar").
*Fundstelle: `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2*

## Nicht entscheidbar (ruht — weder belegt noch widerlegt)

| Sache | Zahl | Fundstelle |
|---|---|---|
| `rsi2seit` (RSI2 im Seitwärtskanal) | Überschuss **+0,021 Pp je Signal**, real, unter jeder Beweisschwelle. *Ergänzt 02.09.:* dieselbe Variante hat ein **Tagesmittel +0,054** (se 0,065, Band [−0,073, 0,182]) — zwei Skalen aus einem Protokoll, nur das Tagesmittel hat einen Standardfehler. **Mit MCP-Stop (5 Varianten): alle obere Grenzen 0,083–0,118 Pp → gegen CFD geschlossen**, Punkte 0,039–0,059 unter der Kassa-Annahme | `studien/messmaschine/protokolle/rsi2seit-2026-08-26.json`, `rsi2seit-mcp-2026-08-26.json` · `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2/§1.4 |
| **Momentum-Buch (Monats-Momentum, H=63)** | t fiel von 4,74 auf **0,74** nach Korrektur. *Ergänzt 02.09.:* obere Grenzen **2,0–4,3 Pp**, untere −0,9 bis −1,5 — das Band schließt **nichts** aus. ~~Vertagt bis Aktienkosten gemessen (Entscheid 01.09.)~~ **GEMESSEN 02.09. (Auftrag, nicht überlappend, 79 unabhängige Perioden): „nicht entscheidbar" am CFD-Gefäß.** Brutto **+1,541 Pp je Umlauf** (se 0,732, t 2,10), CFD-Hürde K + F·91,5 Nächte = 2,370 → **netto −0,829 (t −1,13)**; **Obergrenze netto +0,605 Pp je Umlauf**; ein NEIN bräuchte ~60 Jahre. Netto CFD in **allen 63 Rasterlagen negativ**. Kassa-Zeile (**Annahme 0,06**, nachrichtlich): netto +1,481, t 2,02 — unter der Familienschwelle 2,576, In-Sample, **18 % des Korbs unter 5 Mio $ Umsatz, nur 2,6 % über 1 Mrd $** → kein Urteil. Placebo +0,23 (t 1,12), Positivkontrolle 1,0000. Überlebensverzerrung: Weg-3-Wert **nicht übertragbar** (63-Tage-Vorzeichen negativ, Korb-Δ gemischt). *Ergänzt 02.09., liquide Fassung (Korb nur ≥ 100 Mio $ Median-Tagesumsatz, Punkt-in-Zeit, 40 von 400 Werten):* **„LEBT" nach registrierter Regel — In-Sample und am Rand.** Brutto **+1,835 Pp je Umlauf** (se 0,911, t 2,02, 79 Perioden, 1 Test), Band **[+0,050, +3,620]**; gepaart liquide − breit **+0,29 (t 0,69)** — der liquide Korb ist **nicht schwächer** als der breite, die glockendruck-Lehre gilt hier nicht. Etiketten: untere Grenze 0,05 über null; bei Familienschwelle 2,638 schließt das Band null ein; LEBT-Regel in **18 von 63 Rasterlagen**; ohne 2020er +0,40 Pp (54 Perioden). **Kein „belegt".** Gefäße nachrichtlich: CFD netto −0,535 (Obergrenze netto +1,25), Kassa (**Annahme**) netto +1,775, t 1,95 — Liquiditäts-Vorbehalt weg, In-Sample und Annahme bleiben, kein Urteil. Placebo +0,24 (t 0,74), Positivkontrolle 1,0000, W0 exakt. **Buch seit 02.09.2026 auf liquidem Korb — ab hier Out-of-Sample** (Wilhelms Entscheid 02.09.): das App-Buch rechnet exakt die gemessene Konfiguration (231/21/63, stärkste 10 %, Korb nur Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken, Punkt-in-Zeit, mindestens 100 Werte; Schwelle nominal, Drift nachrichtlich als Korbgröße je Umschichtung). Umstellung greift bei der nächsten regulären Umschichtung und steht als Handlung im Journal; die erste Umschichtung auf dem Korb datiert das Buch selbst (»Vorwärtstest seit«). Sperrklinke test-v6 Block 34: Fenster und Korbregel gegen `lauf-2026-09-01-22-52.json`, Äquivalenz zum Studienwerkzeug auf Kunst- und Archivdaten (Symbolmengen). Bekannte Abweichung: Universum des Buchs 193 Werte (Studie 2.213) | `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md` · liquide: `studien/vorregistrierung-2026-09-02-momentum-liquide/ERGEBNIS.md` · älter: `studien/momentum-nichtueberlappend/`, `studien/OBERGRENZEN-BEFUND.md`, `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.3a |
| Ergebnis-Drift-Buch | t 1,7–2,0 nach Zeitzonen-Korrektur | Protokolle im Datenordner |
| Trendwende-/Winkel-Detektor | Netto unentscheidbar. *Ergänzt 02.09.:* in der Maschine (winkelbestaetigt/winkelgrad, je 5 Schwellen) **alle 10 Punktschätzer negativ**, 9 von 10 obere Grenzen unter 0,1247 Pp — die Long-Seite ist als Größe ausgeschlossen | `studien/33-winkel-detektor/` · `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2 |
| `kapitulation` (Kapitulations-Dip, 60m, H=26) | **Überholt 03.10.2026 — Neumessung auf sauberem Archiv: in der behaupteten Größe zurückgewiesen (netto −0,024 Pp, Band [−0,649; +0,601], 528 Signaltage; Abschnitt „Kapitulation V2, Neumessung").** Alt: V2 (≥50 Mio $ + Regime) **+1,107 Pp**, Band [0,094, 2,120], aber nur **98 Bestätigungstage**, t 2,14 unter Familienschwelle, Urteil „nicht bestätigt"; V0/V1 Bänder schließen null ein. **Dip-Familie wird vom Archiv um −3,78 Pp je Signaltag beschönigt** — der Punkt ist eher zu hoch | `studien/messmaschine/protokolle/kapitulation-2026-08-26.json`, `studien/verzerrungsrichtung-2026-08-26/ERGEBNIS.md` · `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.3a |

## Größen-Ausschlüsse (Obergrenzen, Stand 02.09.2026)

„Nicht entscheidbar" ist eine Nicht-Aussage. Die obere 95-%-Grenze (`tagesmittel + 1,96 × se`,
beides im Protokoll) macht daraus eine Größenaussage: **„dort liegt nichts über X."** Keine
neue Messung — nur vorhandene Protokolle neu gelesen mit `tools/obergrenzen-bericht.js`.

| Hürde | geschlossen von 52 Varianten |
|---|---|
| ~~0,06 Pp (Kassa-Aktie, **Annahme**)~~ | ~~18~~ — **überholt 03.09.**: die Kassa-Hürde ist gemessen und liegt je Klasse bei 0,0449 bis 0,1569 Pp, siehe [kosten.md](kosten.md) und den Abschnitt darunter |
| 0,10 Pp (CFD-Runde ohne Nacht) | 26 |
| **0,1247 Pp (CFD gehebelt, 1 Nacht)** | **31** — 21 offen |
| 0,23 Pp (Standard-Schein) | 40 |

**Die 21 Offenen sind zwei Gruppen:** (a) 12 mit Punkt über der Hürde und Band bis unter null —
momentum, kapitulation, quartalsschub, monatswende, monatsende: **ungemessen, nicht
„vielversprechend"**; (b) 9 mit Punkt unter der Hürde, nur der Rand ragt darüber — glockendruck
H≥2, rsi2seit Zeit-Ausstieg, t1/t2: **zu grob gemessen**, bei t1 V2 und t2 ist die je-Signal-Zahl
sogar negativ (B2). *Fundstelle: `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.3*

### Wiedervorlage an der **gemessenen** Kassa-Hürde (03.09.2026)

Die 31 gegen die CFD-Hürde 0,1247 Pp geschlossenen Varianten, gehalten gegen die am
03.09.2026 gemessene Kassa-Hürde **ihrer Umsatzklasse** statt gegen eine Annahme.
*Fundstelle: `studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS.md` §5 ·
Obergrenzen aus `studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2 · Hürden in
[kosten.md](kosten.md).*

> **„Wieder offen" heißt: obere Grenze > Kassa-Hürde ihrer Klasse.** Das ist eine
> **Größenaussage, kein Ertragsbeleg** — eine wieder offene Variante ist nicht besser
> geworden, sie ist nur nicht mehr durch die Kosten erledigt. **Belegt ist keine davon.**

**Zuordnung, Regel vor dem Lauf (Registrierung §8):** Die Protokolle führen die Liquidität
ihres Universums nicht (geprüft an `glockendruck-nacht-n-2026-09-01.json`). Wo der Bericht
sie ausdrücklich belegt, steht sie; sonst wird gegen **alle vier** Hürden ausgewiesen und das
Universum als *unbekannt* markiert. **Es wird nicht geraten und nicht die günstigste Klasse
gewählt.** Belegt sind nur zwei Fundstellen: glockendruck breit → Universum-Median 69 Mio $
→ Klasse 50-250; die `*l`-Varianten → ausdrücklich „liquide ≥ 1 Mrd $" → Klasse ab1000.

Verwendete Hürden (Fenster `mitte`, ab 2021): 5-50 = **0,1569** · 50-250 = **0,0854** ·
250-1000 = **0,0647** · ab1000 = **0,0449** Pp.
**Nachtrag 03.09.2026 — für die Übernacht-Familie** (`*-nacht-*`, `nachtstoss-umkehr-*`,
`abgabedruck-nacht-*`, 12 Zeilen) gilt nach Registrierung §8 das Fenster **`schluss`**, ab
2021: 5-50 = **0,1025** · 50-250 = **0,0540** · 250-1000 = **0,0409** · ab1000 = **0,0329** Pp
(Band in [kosten.md](kosten.md)). In diesen 12 Zeilen ist das `mitte`-Urteil durchgestrichen
und das `schluss`-Urteil dahintergestellt; die ja/nein-Spalten zeigen den `schluss`-Stand,
geänderte Zellen mit dem alten Wert durchgestrichen. Zuordnungsregel unverändert.
*Fundstelle: `studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS-NACHTRAG.md` §2.*

| Strategie | V | obere Grenze | Universum | offen gegen 5-50 | 50-250 | 250-1000 | ab1000 | Urteil |
|---|---|---|---|---|---|---|---|---|
| `t1-zwangsglattstellung` | 1 (k=2) | 0,1220 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `rsi2seit-mcp` | 4 (MCP 10 %) | 0,1180 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `glockendruck-nacht-h2` | 0 | 0,1140 | 50-250 | ~~nein~~ **ja** | ja | ja | ja | ~~mitte: wieder offen (50-250)~~ → **schluss: wieder offen** (50-250) |
| `rsi2seit-mcp` | 3 (MCP 25 %) | 0,1100 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `t1-zwangsglattstellung` | 0 (k=1,5) | 0,1100 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `rsi2seit-mcp` | 2 (MCP 50 %) | 0,0970 | *unbekannt* | nein | ja | ja | ja | hängt an der Klasse (3 von 4) |
| `glockendruck-nacht-h1l` | 0 (liquide) | 0,0910 | ab1000 | nein | ja | ja | ja | ~~mitte: wieder offen (ab1000)~~ → **schluss: wieder offen** (ab1000) |
| `rsi2seit-mcp` | 1 (MCP 75 %) | 0,0840 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| `rsi2seit-mcp` | 0 (MCP 90 %) | 0,0830 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| `winkelgrad` | 0 (S0) | 0,0770 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| `glockendruck-nacht-n` | 0 | 0,0680 | 50-250 | nein | ~~nein~~ **ja** | ja | ja | ~~mitte: endgültig zu (50-250)~~ → **schluss: wieder offen** (50-250) |
| `winkelgrad` | 1 (S05) | 0,0670 | *unbekannt* | nein | nein | ja | ja | hängt an der Klasse (2 von 4) |
| `winkelbestaetigt` | 0 (S0) | 0,0630 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `nachtstoss-umkehr-t` | 0 | 0,0599 | *unbekannt* | nein | ~~nein~~ **ja** | ~~nein~~ **ja** | ja | ~~mitte: hängt an der Klasse (1 von 4)~~ → **schluss: hängt an der Klasse (3 von 4)** |
| `winkelgrad` | 2 (S10) | 0,0580 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `winkelbestaetigt` | 1 (S05) | 0,0580 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `winkelgrad` | 3 (S15) | 0,0490 | *unbekannt* | nein | nein | nein | ja | hängt an der Klasse (1 von 4) |
| `nachtstoss-umkehr-n-regime` | 1 (ab 2021) | 0,0450 | *unbekannt* | nein | nein | ~~nein~~ **ja** | ja | ~~mitte: hängt an der Klasse (1 von 4)~~ → **schluss: hängt an der Klasse (2 von 4)** |
| `winkelgrad` | 4 (S20) | 0,0440 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `abgabedruck-nacht-n-regime` | 1 (ab 2021) | 0,0390 | *unbekannt* | nein | nein | nein | ~~nein~~ **ja** | ~~mitte: endgültig zu, in jeder Klasse~~ → **schluss: hängt an der Klasse (1 von 4)** |
| `abgabedruck-nacht-n-regime` | 0 (bis 2020) | 0,0340 | *unbekannt* | nein | nein | nein | ~~nein~~ **ja** | ~~mitte: endgültig zu, in jeder Klasse~~ → **schluss: hängt an der Klasse (1 von 4)** |
| `t3-stundendrift` | 1 (k=2) | 0,0330 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `glockendruck-nacht-t` | 0 | 0,0320 | 50-250 | nein | nein | nein | nein | ~~mitte: endgültig zu (50-250)~~ → **schluss: endgültig zu** (50-250) |
| `abgabedruck-nacht-t` | 0 | 0,0270 | *unbekannt* | nein | nein | nein | nein | ~~mitte: endgültig zu, in jeder Klasse~~ → **schluss: endgültig zu**, in jeder Klasse |
| `abgabedruck-nacht-n` | 0 | 0,0270 | *unbekannt* | nein | nein | nein | nein | ~~mitte: endgültig zu, in jeder Klasse~~ → **schluss: endgültig zu**, in jeder Klasse |
| `winkelbestaetigt` | 2 (S10) | 0,0230 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `t3-stundendrift` | 0 (k=1) | 0,0210 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `winkelbestaetigt` | 3 (S15) | 0,0200 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |
| `nachtstoss-umkehr-n` | 0 | 0,0000 | *unbekannt* | nein | nein | nein | nein | ~~mitte: endgültig zu, in jeder Klasse~~ → **schluss: endgültig zu**, in jeder Klasse |
| `nachtstoss-umkehr-n-regime` | 0 (bis 2020) | -0,0060 | *unbekannt* | nein | nein | nein | nein | ~~mitte: endgültig zu, in jeder Klasse~~ → **schluss: endgültig zu**, in jeder Klasse |
| `winkelbestaetigt` | 4 (S20) | -0,0100 | *unbekannt* | nein | nein | nein | nein | **endgültig zu**, in jeder Klasse |

**Zählung (wörtlich aus `ERGEBNIS.md` §5, Stand vor dem Nachtrag):** von den **4 Varianten mit belegtem Universum**
sind **2 wieder offen** (`glockendruck-nacht-h2`, 0,1140 gegen 0,0854 in 50-250;
`glockendruck-nacht-h1l`, 0,0910 gegen 0,0449 in ab1000), **2 endgültig zu**
(`glockendruck-nacht-n` 0,0680 und `glockendruck-nacht-t` 0,0320, beide 50-250).
Von den **27 mit unbekanntem Universum** sind **12 in jeder Klasse zu** — das ist das robuste
Teilergebnis —, **0 in jeder Klasse offen**, und **15 hängen daran, wo ihr Universum liegt**.

~~**Also: 2 offen, 14 zu, 15 unentschieden, weil die Klasse unbekannt ist.**~~
**Nach dem Nachtrag (Übernacht-Familie gegen `schluss`, die übrigen 19 unverändert gegen
`mitte`): 3 offen, 11 zu, 17 unentschieden.** Nur Übernacht-Familie: vorher 2 / 8 / 2 →
nachher **3 / 5 / 4** (offen / zu / unentschieden, 12 Zeilen). Fünf Urteile haben sich
geändert: `glockendruck-nacht-n` von endgültig zu nach **wieder offen** (0,0680 > 0,0540 in
50-250); `nachtstoss-umkehr-t` und `nachtstoss-umkehr-n-regime` (ab 2021) hängen an mehr
Klassen; `abgabedruck-nacht-n-regime` (beide Regime) sind nicht mehr in jeder Klasse zu,
sondern hängen an der Klasse `ab1000`. **Keine der unentschiedenen bekommt ein Urteil, und
keine wird der günstigsten Klasse zugeschlagen.** „Wieder offen" ist eine **Größenaussage,
kein Ertragsbeleg** — belegte Kanten bleiben NULL.

> **⚠ Der Cent-Boden-Vorbehalt gilt auch hier** (Registrierung §9a): für die liquiden Klassen
> ist „die Hürde der Umsatzklasse" **keine Liquiditätsaussage**, sondern zu einem großen Teil
> eine Aussage über den Aktienkurs. Eine Variante, die gegen `ab1000` wieder offen ist, ist es
> auf teuren Aktien; auf billigen nicht. Siehe [kosten.md](kosten.md).

> ~~**⚠ Die Übernacht-Familie steht hier gegen die MITTAGS-Hürde.**~~ **Erledigt mit dem
> Nachtrag 03.09.2026** (`ERGEBNIS-NACHTRAG.md` §1–2): die Schluss-Hürde ist je Regime mit
> Cluster-Bootstrap-Band gerechnet und auf die 12 Übernacht-Zeilen angewandt (oben). Zusatz B
> bleibt, was er ist: der Abstand Schlussauktion → Folgeeröffnung (Median **0,486 Pp**) ist
> nach `ERGEBNIS.md` §6 ausdrücklich **keine Kostengröße**. Und die Schluss-Hürde deckt nur
> den **Kauf** im Schlussfenster — der Verkauf in der Folgeeröffnung steht im teureren
> Eröffnungsfenster; auch das ist kein Ertragsbeleg.

### Depot-Kandidatenliste — Antwort: **NEIN**

> ⚠ ~~**Die ~0,06 Pp Kassa-Hürde ist eine ANNAHME**~~ **Überholt 03.09.2026: die Kassa-Hürde
> ist gemessen** und klassenspezifisch (0,0449 bis 0,1569 Pp, [kosten.md](kosten.md)). Die
> Rechnung dieses Abschnitts steht noch gegen die alte Annahme 0,06 und ist **nicht** gegen
> die gemessenen Hürden neu aufgestellt worden — das wäre eine neue Auswertung, sie steht in
> [offene-auftraege.md](offene-auftraege.md). **Diese Liste begründet kein JA.**

Zwischen Kassa-Annahme (0,06) und CFD-Hürde (0,1247) liegt als Punktschätzer mit unterer Grenze
über null **genau eine** Variante: glockendruck H=2 breit, **+0,0604 Pp** — 0,0004 über der
Annahme, je Signal 0,054 darunter, **liquide −0,002** (t −0,04). glockendruck H=3/H=5 (+0,065 /
+0,071) sind „nicht messbar" (null im Band). Alles Reale (glockendruck H=1 +0,044, rsi2seit
+0,021 je Signal) liegt **unter** der Kassa-Annahme; alles potenziell Große ist ungemessen.
**Es gibt derzeit keinen Kandidaten, für den sich ein echtes Kassa-Depot rechnerisch lohnen
könnte.** Ein Kassa-Depot ändert die Arithmetik nur für die 63-Tage-Klasse (Finanzierung ~2,2 Pp
entfällt) — das bestätigt die Reihenfolge des Entscheids vom 01.09., verschiebt sie nicht.
*Fundstelle: `studien/wiedervorlage-2026-09-02/BERICHT.md` Teil 2*

## Nicht messbar (Werkzeug oder Daten reichen nicht)

| Sache | Grund | Fundstelle |
|---|---|---|
| ~~News-Sentiment~~ | ~~**⚠ ÜBERHOLT 01.09.2026** — das Urteil „es fehlt Faktor 75" galt für das App-Archiv (35 Beobachtungen an 10 Zeitpunkten). Auf der **Gratisstufe** des Anbieters stehen **2.367 Zeitpunkte** zur Verfügung → auf Großwerten ~22.600 Beobachtungen gegen nötige ~2.600 = **Faktor 8,7. Die Klasse ist messbar, die Messung steht aus.**~~ **ERLEDIGT 01.09.2026 abends: die Messung ist gelaufen, das Urteil lautet NEIN — Zeile jetzt unter „Widerlegt".** *Und die 2.367 Zeitpunkte waren zu optimistisch: das sind Handelstage, nicht Tage mit Nachrichten. Nutzbar sind **1.338** (Abdeckung vor Mai 2021 unter 10 %).* | Urteil: `studien/vorregistrierung-2026-08-31-news-sentiment/ERGEBNIS.md` · Überholung: `studien/datentarif-2026-09-01/GRATIS-PRUEFUNG.md` · Korrektur: `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/VORREGISTRIERUNG.md` Nachtrag 1 |
| Optionen, Value/Quality, Index-Aufnahmen, Dividendentermine, Saisonalität, Intraday | strukturell, siehe [datenquellen.md](datenquellen.md) | `studien/landkarte-2026-09-01/LANDKARTE.md` |

## Validierte BEDINGUNGEN (keine Strategien!)

Diese haben eine unabhängige Re-Validierung überlebt. **Sie sagen, WANN etwas erlaubt ist —
sie sind selbst kein Einstieg.**

- **SPY > EMA200 als Gate:** +0,098 Pp, **t = 2,6** — eingebaut
- **Regime-Zuteilung R-TREND:** **t = 3,2** — eingebaut (`rsi2seit` über der EMA200, Kapitulation darunter)
  **Vermerk 04.10.2026 (PM):** Die Zahl stammt aus der Regime-Studie vom 21.08.2026 (altes Archiv ohne verschwundene Reihen; die Skripte lagen im Kratzordner einer früheren Sitzung und sind nicht im Repo — heute nicht nachrechenbar) und maß **beide Teile zusammen** (`rsi2seit` nur über, Kapitulation nur unter der EMA200, gegen die feste Einstellung). Der Kapitulations-Teil ist seit der Neumessung vom 03.10.2026 in der behaupteten Größe zurückgewiesen (Abschnitt „Kapitulation V2, Neumessung"); t = 3,2 ist damit **kein Beleg der Zuteilung als Ganzes mehr**. Der RSI-Teil für sich (in der App genannt: +0,148 Pp über, −0,169 Pp unter der Linie) ist nicht neu gemessen — weder bestätigt noch widerlegt. In der App (Auftrag Nr. 71, Wilhelm 04.10.): Kapitulation per Voreinstellung aus, der Regime-Schalter bleibt; unter der Linie ist dann Pause.

Siehe [messmethodik.md](messmethodik.md) für die Frage, warum eine Bedingung leichter zu belegen
ist als eine Strategie.

## Signalstudie Minuten, 5m/15m — **NEIN mit Auflösung** (08.09.2026) · **1m nachgemessen 11.09.: ebenfalls NEIN, Familie geschlossen**

> **Nachtrag 11.09.2026 — der 1m-Lauf** (acht Teile, 09.09. 09:57 – 11.09. 07:57 mit drei Unterbrechungen, 45.096 Dateien, 2,37 Mrd Kerzen, Rückgabewert 0 überall): 75 Konfigurationen auf 1m gemessen, **k₁ = 0, belegt 0, handelbar 0**; Größenaussagen **64 „in jeder Klasse zu", 9 „in seiner Klasse zu", nur 2 „offen"** (Kapitulation long bis Schluss: Entdeckung netto +0,04 Pp bei t 1,7, Bestätigung netto **+0,003** bei t 0,1, obere Grenze 0,16; Kapitulation long 3 h: Bestätigung −0,03). Placebos 0 von 3 Bändern gefallen, 0 Einzel-Placebos. Die Auflösung auf 1m ist die feinste der Studie (delta80 der dichten Regeln 0,05–0,08 Pp) — das Nein ist gemessen, nicht Blindheit.
> **Gesamtbericht über alle 16 Teile** (`ergebnis-gesamt-2026-09-11/ERGEBNIS.md`): 234 Konfigurationen (13 Detektoren × 1m/5m/15m × long/short × 1 h / 3 h / bis Schluss), **k₁ = 0, k₂ = 0, belegt 0, handelbar 0**; 161 „in jeder Klasse zu", 41 „in seiner Klasse zu", 17 „offen" — **alle 17 in der Bestätigung netto ≤ +0,003 Pp**, 16 davon negativ. Damit ist die Frage „bekannte Regeln, schnell gehandelt, Kassa-Kosten" auf allen drei Minuten-Zeitrahmen abschließend beantwortet: **Nein.** Berichtskopien `ergebnis-1m-2026-09-11/`, Zellen (4 GB) unter `E:/Markt-Dashboard-Archiv/studien-zellen/signale-minuten-1m-2026-09-11/`.

Vorregistriert vor der ersten Rechnung (Studienordner, Nachträge 1–3), Messgerät mit 81 eigenen Prüfungen abgenommen, Vollauf 07.09. 20:34 – 08.09. 13:15 in acht Teilen. Ergebnis: `studien/vorregistrierung-2026-09-06-signale-minuten/ergebnis-5m15m-2026-09-08/ERGEBNIS.md`.

| Größe | Wert |
|---|---|
| Daten | 45.096 Symbol-Jahre, 122 GB, **2,37 Mrd** reguläre Minutenkerzen, 7.299 Aktien (nur CS/ADRC), davon **4.993 verschwunden** |
| Konfigurationen | 13 Detektoren der August-Studie × 5m/15m × long/short × 1 h / 3 h / bis Schluss = **144** (dazu 90 auf 1m: **nicht gemessen**) |
| Kosten | Kassa-Hürde je Umsatzklasse des Wert-Tages (0,157 / 0,085 / 0,065 / 0,045 Pp je Umlauf) |
| Tor 1 bestanden (k₁) | **0** — Entdeckung ≥ 4 × MDE der Bestätigung: niemand |
| belegt / handelbar | **0 / 0** |
| Größenaussagen | 97 „in jeder Klasse zu", 32 „in seiner Klasse zu", **15 „offen"** — alle 15 mit **negativem** Netto in der Bestätigung |
| Bestes Brutto | vwap-abstand 5m long bis Schluss 0,152 Pp je Signal (Entdeckung), Hürde 0,120 → Netto +0,024 bei t = 1,4; Bestätigung Netto **−0,014**. Kapitulation 5m long 3 h: Brutto 0,148, Bestätigung Netto −0,038 |
| Placebo | 9 von 9 gepoolte Bänder gehalten, 0 von 144 Einzel-Placebos gefallen; Intraday-Drift ≈ 0 |
| Auflösung realisiert | dichteste Konfiguration (rsi2 long 5m 1 h): se_B 0,0057 Pp, MDE_B 0,011, **delta80 0,016** (Plan 0,058); Median delta80 0,022–0,060 |
| Überlebensverzerrung | Differenz alle − lebend: Dip −0,002 … −0,009 Pp, Ausbruch +0,001 … +0,004, Wende ±0,01 — das Archiv mit den Verschwundenen schließt die Lücke ([ueberlebensverzerrung.md](ueberlebensverzerrung.md)) |
| Cent-Boden | 0,2–2,6 % der Signale je Klasse darüber — irrelevant |
| Ausgelassen | 83 Dateien („Datei fehlt", alle in `_luecken.json`), 0 Wachhund, 0 Detektorfehler |

**Lesart.** Die Kante gibt es brutto (0,13–0,15 Pp je Signal bei den besten Konfigurationen), die Kassa-Kosten sind größer, und in der Bestätigung ab 2023 schrumpft das Brutto weiter. Das ist dieselbe Lehre wie im August ([signalstudie-2026-08](../studien/signalstudie-2026-08/BERICHT.md): Produkthürde), jetzt aber mit einem Messgerät, das scharf genug war: **das Nein ist gemessen, nicht Blindheit.** Für 1m gilt weiterhin „nicht gemessen".

**Was das Ergebnis nicht sagt:** nichts über neue Detektoren oder andere Parameter, nichts über Übernacht, 60m, CFD oder Scheine; die notierte Spanne ist eine Untergrenze der Kosten (Schlupf, Tiefe nicht enthalten) — ein realer Handel wäre also eher schlechter.

## Trendkanal auf Tagesbasis — **NEIN, der App-Kanal ist als Einstieg geschlossen** (09.09.2026)

Vorregistriert vor der ersten Rechnung (`studien/vorregistrierung-2026-09-08-trendkanal-tage/VORREGISTRIERUNG.md`, Nachträge 1–2), Messgerät mit 71 Prüfungen vom PM abgenommen, Tageskerzen aus dem Alpaca-Minutenarchiv (Eröffnung = 09:30-Kerze, Schluss = Eröffnung der 16:00-Kerze, Kreuzprobe gegen Yahoo: Median 0,0000 Pp). Aggregation 09.09. 08:49–09:55 in vier Teilen (45.107 Jahresdateien, 122 GB, 0 Fehler), Messung 09:57–10:04. Bericht: `studien/vorregistrierung-2026-09-08-trendkanal-tage/ergebnis-2026-09-09/ERGEBNIS.md`; Zellen und Tageskerzen gesichert unter `E:/Markt-Dashboard-Archiv/studien-zellen/trendkanal-tage-2026-09-09/`.

| Größe | Wert |
|---|---|
| Daten | 7.299 Aktien (nur CS/ADRC, davon **4.801 verschwunden**) + SPY, 2016–2026-08-31, **6.076.201** zulässige Wert-Tage mit Umsatzklasse; Bestätigung 2023-02-07 bis 2026-08-31 (894 Tage), Urteil ab 2021 |
| Konfigurationen | 4 Linien (K1 Abschnittskanal der App „ausgebaut", K2 Regression 40 T ±2 sd, K3 Donchian 20 / 55) × 2 Einstiege (E1 bestätigter Ausbruch, E2 Rücklauf an die untere Linie) × long/short × 4 Ausstiege (5 / 10 / 20 Tage, bis Kanalbruch) = **64**; 1.306.373 Trades, Cooldown sperrte 1.805.372 weitere Kandidaten |
| Hauptgröße | **Überschuss gegen den Topf** derselben Zelle (Einstiegstag, Dauer, Klasse, lebend) minus Kassa-Hürde; se Hansen-Hodrick (überlappende Haltedauern) |
| Tor 1 bestanden (k₁) | **3** — alle Donchian 55 / Rücklauf / long (5, 10, 20 Tage): Entdeckung +3,83 Pp je Trade bei **t = 1,0** (Ausreißer-Mittel), Bestätigung **−0,47 / −0,77 / −0,89 Pp** (t −3,3 / −3,2 / −2,0) → „nicht entscheidbar" nach Tor 2, als Größe „in jeder Klasse zu" (5, 10 T) |
| Tor 2 / belegt / handelbar | **0 / 0 / 0** — delta80 im dichtesten Fall 0,23 Pp (K1 Rücklauf long, 80 Trades je Tag) gegen Hürde 0,12; die Vorrechnung „H ≥ 10 nicht entscheidbar" hielt, „H = 5 knapp entscheidbar" nicht (Pilot-Hochrechnung 0,085 war 2,7-mal zu fein: fette Ränder, gemeinsame Tage) |
| **App-Kanal K1 als Einstieg** | Rücklauf long (Kauf an der unteren Linie): Bestätigung **−0,24 / −0,32 / −0,47 / −0,32 Pp** gegen den Topf (t −3,4 / −2,6 / −2,4 / −4,3) → **in jeder Klasse zu**. Ausbruch long: −0,20 / −0,20 / −0,11 / −0,40 (5 T: „in seiner Klasse zu"); roh +1,70 Pp bis Kanalbruch bei Topf +1,36 — **der Ausbruch verdient weniger als der Markt** |
| Regression K2, Donchian 20 | Rücklauf long −0,21 … +0,12 Pp, Ausbruch long −0,04 … +0,34, alle \|t\| ≤ 1,7 → „offen" (Auflösung), nichts positiv mit Aussagekraft |
| Short | nie handelbar (Leihe nicht gemessen); nichts mit t > 1,6; Ausbrüche short in K3 mit −4 bis −17 Pp Mittel (Pennystock-Explosionen, se riesig) |
| Größenaussagen | **8 „in jeder Klasse zu"** (K1 Rücklauf long ×4, Donchian-55 Rücklauf long 5/10 T, Donchian-20 Ausbruch long 5 T, Donchian-55 Ausbruch short Kanalbruch), 2 „in seiner Klasse zu", **54 „offen"** — die Studie kann kleine Kanten unter ~0,5 Pp je Trade bei 10–20 Tagen nicht ausschließen, nur sagen: keine ist positiv sichtbar |
| Placebo | Placebo A gepoolt: alle 8 \|t\| ≤ 1,9; **6 von 8 verfehlen die absolute Schranke 0,045 Pp** — die Schranke stammt aus der Minutenstudie (se dort 0,006–0,03 Pp) und liegt hier bei se 0,04–0,16 Pp im Rauschen (→ fehlerformen.md). Einzel-Placebos: 1 von 64 mit \|t\| > 3. Placebo B (gleiche Klasse, gleicher Tag) als Kand − PlB je Zeile ausgewiesen |
| Überleben | Δ alle − lebend bei den Long-Rückläufen −0,03 … −0,12 Pp (klein, das Archiv trägt die Verschwundenen); bei Ausbruch long bis Kanalbruch **+0,3 … +0,7** — Delisting-Ausstiege mit +29 Pp Mittel (Übernahmen), 0,9 % der Trades |
| Vorbehalte | 16:00-Kerze fehlt bei **21,8 / 23,5 / 13,1 / 4,5 %** der Wert-Tage je Klasse (Schluss = 15:59-Kerze, Median-Abweichung 0,02 Pp — klein gegen 0,2–0,9 Pp Effekte); Delisting-Ausstiege 0,1–1,3 %; 4 Trades ohne Topfzelle; Cooldown 5 Tage halbiert die Signalmenge |
| Erwartungen vorab | Wilhelm „der ausgebaute Kanal trägt": **nein**. PM „E1 ≈ null/negativ, E2 klein positiv unter der Hürde": E1 ja, E2 **nicht** positiv. Studien-Chat „E1 brutto 0,1–0,3 Pp, E2 ≈ null, Überleben groß negativ bei 20 T": Überleben **klein** |

**Lesart:** Auf Tagesbasis mit Wochen-Haltedauer ist der Trendkanal keine Kante, sondern eine Verpackung für „long sein": die rohen Erträge der Ausbrüche sind positiv, weil der Markt steigt (Topf +0,31 Pp je 5 Tage, +1,36 je 20 Tage in der Bestätigung), und sie liegen **unter** dem, was ein zufälliger Wert derselben Klasse am selben Tag gebracht hätte. Der Kauf an der unteren Kanallinie der App ist mit t bis −4,3 die schlechteste der gemessenen Regeln. Was die Studie **nicht** sagen kann: dass es keine Kante von 0,3 Pp bei 10 oder 20 Tagen gibt — dafür reicht die Auflösung nicht, und das war vorab so gerechnet. Zusammen mit dem August (Abschnittskanal als Bedingung −0,17 Pp, t −4,1) und der Minutenstudie (Donchian-Ausbruch intraday t −15 bis −19) ist der Kanal jetzt auf drei Zeitskalen gemessen: **Anzeige ja, Einstieg nein.**

### Jahresscheiben (12.09.2026, nachrichtlich, post hoc — kein Urteil)

Auf Wilhelms Frage „nur ein Handelsjahr betrachten?" wurden alle Zellen der Minutenstudie und der Kanalstudie je Kalenderjahr und für die letzten 250 Handelstage gelesen (`ergebnis-5m15m-2026-09-08/JAHRESSCHEIBEN.md`, `ergebnis-1m-2026-09-11/JAHRESSCHEIBEN.md`, `trendkanal-tage/ergebnis-2026-09-09/JAHRESSCHEIBEN.md`). Befund: **kein Jahr, in dem eine Familie der Minutenstudie im Mittel positiv wäre**; letzte 250 Tage −0,085 / −0,148 / −0,136 Pp netto (Dip / Ausbruch / Wende auf 5m/15m), auf 1m −0,099 / −0,139 / −0,101; positive Konfigurationen 0–2 %, nur in den Crash-Jahren 2020 und 2022 mehr (Dip 41 % bzw. 33 %). Kanalstudie: 2020 als einziges Jahr mit t > 2 beim Rücklauf-Kauf (+3,9 Pp) — der Ausreißer, der die Donchian-55-Entdeckung trug. Die Zeitachse zeigt Ausreißer-Jahre, keine junge Kante. Ab jetzt Pflichttabelle jeder Studie, mit Aktualitäts-Tor (entscheide.md 09.09.).

### Warum die Verschwundenen verschwunden sind — und warum das die Delisting-Gewinne erklärt (12.09.2026)

Tafel: `studien/verschwundene-gruende-2026-09-12/` (EDGAR-belegt, 4,2 % unbekannt). Sie beantwortet die Frage, die die Kanalstudie aufgeworfen hatte: dort brachten Delisting-Ausstiege bei Ausbruch-Long im Mittel **+29 Pp**, und es war offen, ob das Übernahmeprämien sind.

**Antwort: nein, jedenfalls nicht am Ausstieg.** Der Median-Aufschlag zwischen dem gezahlten Barpreis und dem letzten Kurs im Archiv beträgt über 787 Barfusionen **+0,029 Pp** — praktisch null (ATVI 95,00 gegen 94,42; TWTR 54,20 gegen 53,80; VMW 142,50 gegen 142,52). **Die Prämie wird am Ankündigungstag bezahlt, Wochen vorher.** Wer am Tag des Delistings aussteigt, bekommt nichts geschenkt.

Woher die +29 Pp dann kommen, zeigt der **Endlauf** (Rendite der letzten 60 Balkentage vor dem letzten Balken, aus denselben Tagesdateien; kein Trade, nur die Bewegung, in die ein Delisting-Ausstieg hineinlief):

| Grund | Reihen | Median Endlauf (Pp) | Mittel (Pp) |
|---|---:|---:|---:|
| Übernahme | 1.635 | +4,91 | +22,74 |
| Aktientausch | 309 | +1,92 | +6,39 |
| SPAC-Ende | 273 | +4,74 | +6,06 |
| Kürzelwechsel | 1.301 | −2,46 | +16,07 |
| freiwillig | 309 | +1,30 | −1,29 |
| **Zwangs-Delisting** | 544 | **−21,44** | −17,69 |
| **Insolvenz** | 357 | **−72,97** | −56,78 |

**Lesart:** Die Delisting-Gewinne der Kanalstudie sind der *Anlauf* zur Übernahme, nicht der Ausstieg — und ihm steht der Endlauf der Insolvenzen mit −73 Pp gegenüber. Wer die Verschwundenen aus einer Messung lässt, schneidet beide Enden weg und sieht weder das eine noch das andere. Das ist die quantitative Fassung von [[ueberlebensverzerrung-ist-der-killer]]. **Für Strategien folgt daraus nichts Handelbares:** die Prämie liegt vor dem Ereignis, und wer sie fangen will, misst Ankündigungen, nicht Kurse.

**Zwei Nebenbefunde, die Messungen betreffen:** (1) 153 Insolvenzen standen im Maßnahmen-Archiv als „Umbenennung" (Q-Kürzel wie AMRS→AMRSQ) — genau die Fälle mit −73 Pp Endlauf; wer Kürzelwechsel pauschal als „lebt weiter" führt, verliert sie. (2) Am **21.03.2025 enden 77 Reihen auf einmal** (nächsthäufigster Tag: 13) — zu gutem Teil eine Grenze der Sammlung, kein Marktereignis; 37 davon sind unbelegt. **Geklärt 04.10.2026 (PM, Nr. 70/72):** der 21.03.2025 ist das Ende des **Tagesbalken-Nachlebens** bei der Quelle, kein Abgangsdatum — bei 74 der 77 Reihen liegt der letzte Minutentag (= letzter Börsenhandel) mehr als fünf Tage früher (AATC 29.12.2022, ADXS 22.12.2021). `letzter_balken` der Gründe-Tafel ist der letzte Tagesbalken und liegt bei 223 von 4.996 Reihen mehr als 90 Tage zu spät; 39 abgegangene Reihen fehlen der Tafel ganz, weil sie über die Tagesbalken noch als lebend gelten. Abgeschlossene Messungen sind nicht berührt (keine der 39 je in Klasse 1–3); Korrektur ist Nr. 72.

### W7 (RSI-Divergenz): drei Artefakt-Erklärungen überlebt, am Vollauf gescheitert (12./13.09.2026)

> **Nachtrag 13.09., der alles darunter einordnet:** der Vollauf über **7.299 Aktien** ist durch und sagt **Nein** — 225 Konfigurationen, **k₁ = 0, belegt 0**, keine passiert Tor 1. Die Zahlen darunter stammen aus dem Piloten über **19 Reihen** und sind nicht falsch, sie gelten nur für ein anderes Universum. Entscheidend ist die **Kassa-Hürde**: 0,0593 im Piloten gegen **0,1222** im Vollauf, weil 60 % der Signale aus der illiquidesten Klasse kommen (0,157 Pp je Umlauf). Dazu fällt der rohe Überschuss von 0,2160 auf 0,1384. Aus u = 0,1567 wird 0,0162 gegen eine Schranke von 0,0728. **Die Artefakt-Gegenproben bleiben gültig** — W7 ist kein Messfehler, es ist zu klein für die Spanne. Offen: dieselbe Rechnung **je Umsatzklasse** (läuft).

#### Der Pilotstand vom 12.09. (19 Reihen)

**Achtung, das sind 19 Aktien.** Der Pilot entscheidet über das Messgerät, nie über die Kante; der Vollauf über 7.299 Aktien läuft seit dem 12.09. 21:52. Trotzdem gehört der Stand hierher, weil es der erste Fall im Projekt ist, in dem eine Regel alle vorregistrierten Gegenproben übersteht.

Geprüft und **widerlegt** wurden drei Erklärungen, jede vom PM vermutet und jede an den bestellten Zahlen gestorben:

| Erklärung | Messung | Befund |
|---|---|---|
| Spannen-Rückprall am Signalschluss | Einstiegslücke je Kurszelle (Nachtrag 3) | 0,004 Pp = 2–6 % des Bruttos |
| Uhrzeit des Vergleichstopfs | Haltezeit Kandidat gegen Topf (Nachtrag 4) | Versatz in **beiden** Richtungen +0,19 ⇒ müsste den Short **bestrafen**; Beitrag ≈ 1 % von u |
| Verzerrter Einstiegskurs | Einstieg 1 und 5 Kerzen später, Ausstieg fest (Nachtrag 5) | 18 von 24 Zeilen „widerlegt"; erste Kerze auf 1m in 9 von 10 Zeilen **negativ** |

**Stärkste Konfiguration: W7, 5m, long, 3 h Haltedauer.** u in jedem Kalenderjahr positiv:

| Jahr | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 | letzte 250 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| u (Pp) | 0,085 | 0,035 | 0,134 | 0,101 | 0,281 | 0,178 | 0,267 | 0,156 | 0,103 | 0,121 | 0,080 | **0,110** |
| t | 4,13 | 2,16 | 4,81 | 4,04 | 4,99 | 5,32 | 6,63 | 4,97 | 3,36 | 3,81 | 2,32 | **3,52** |

Bestätigungszeitraum: brutto 0,1433 · **netto (Aktie) 0,0842** · u 0,1138 bei t 7,35 · Schein BV 1 netto 0,0933 (t 4,04) · Standard-Schein zu. Aktualitäts-Tor bestanden, Lücken-Tor bestanden, Uhrzeit-Tor gilt nicht (feste Haltedauer).

Die zweite belegte Zeile (W7 1m long bis Schluss, u 0,0359 bei t 6,35) ist in den **letzten 250 Tagen schon netto negativ** (u 0,0132 bei t 1,19, netto −0,0423) — sie zeigt, wie schnell das kippt. Offen bleibt nach dem Vollauf der **mitverzögerte Topf** (Placebo B und Topf laufen bisher bei k = 0 mit).

### Nachtrag 13.09.: dieselben Zellen je Umsatzklasse — die Kante ist überall gleich groß, nur der Preis nicht

Bericht `studien/vorregistrierung-2026-09-09-trendwende-ii/ERGEBNIS-KLASSEN.md` (keine neue Messung, dieselben `_zellen.bin`). **Nachträglich gestellte Frage** — kann per Registrierung nie „belegt" ergeben, höchstens einen Kandidaten für den Vorwärtstest; Testzahl 900 statt 225.

| Klasse | Hürde je Umlauf | Tor 1 bestanden (von 225) | W7 5m long 3h: u_B | t |
|---|---:|---:|---:|---:|
| 5-50 | 0,1569 | **0** | −0,0297 | −3,10 |
| 50-250 | 0,0854 | 2 | 0,0321 | 3,51 |
| 250-1000 | 0,0647 | 4 | 0,0485 | 4,63 |
| **ab1000** | **0,0449** | **9** | **0,1283** | **7,78** |
| *gepoolt* | *0,1222* | *0* | *−0,0005* | *−0,06* |

**Der eigentliche Befund steht erst da, wenn man die Kosten herausrechnet.** Die rohe Trennung `r̄(nach Long) − r̄(nach Short)` = Spiegel-Summe + K_long + K_short, W7 5m:

| | 5-50 | 50-250 | 250-1000 | ab1000 |
|---|---:|---:|---:|---:|
| bis Schluss | 0,317 | 0,289 | 0,290 | **0,427** |
| drei Stunden | 0,235 | 0,214 | 0,212 | **0,326** |

**Die drei billigeren Klassen trennen gleich gut.** Was sich zwischen ihnen um das Dreieinhalbfache unterscheidet, ist die Spanne, nicht die Kante. Die scheinbare Monotonie der Spiegel-Summe über die Klassen war zum größten Teil die fallende Hürde (`K_l+K_s` fällt von 0,314 auf 0,090). Nur `ab1000` trennt wirklich schärfer (Faktor 1,33–1,54) — auf 26.430 Signalen.

**Warum trotzdem kein Ja:** die drei saubersten Zeilen (Tor 1, Uhrzeit-Tor, Lücken-Tor bestanden) fallen über **Tor 2**, die Auflösungswand — in der liquidesten Klasse ist die Hürde klein (0,0449) und die Stichprobe dünn, die auflösbare Differenz (0,0804) also größer als die Hürde. Das ist „nicht entscheidbar", nicht „nein". Dazu: alle 15 Zeilen kommen von **einem** Detektor, 10 fallen über das Uhrzeit-Tor, und die beiden Zeilen, die jedes Tor bestehen, haben in den letzten 250 Tagen t < 1.

**Profil, das gegen Wilhelms Ziel spricht:** die Trennung **je Stunde** fällt (5m: 0,173 → 0,121 → 0,074 Pp/h von 15 min über 1 h auf 3 h). Der Vorsprung entsteht früh und läuft aus — das Profil eines **Rückpralls**, nicht einer Wende, die einen neuen Trend eröffnet. Für „jeden Trend mitnehmen" ist das die falsche Sorte Signal, und es ist genau die Sorte, der die Spanne am meisten wehtut.

### Querschnitt über Tage, erste vier Kandidaten: NEIN (15.09.2026)

Bericht `studien/querschnitt-pruefstand-2026-09-13/ERGEBNIS-TEIL2.md`. Universum liquide (Klassen 250-1000 und ab1000, ~220 Werte), Top-Dezil gegen das gleichgewichtete Universum, Umschichtung wöchentlich und monatlich, Kosten gemessen, 2017-02 bis 2026-08. Testzahl 8, Bonferroni |t| ≥ 2,734.

| Rangfunktion | Woche: netto / t | Monat: netto / t | Umschlag |
|---|---:|---:|---:|
| Kurzfrist-Umkehr (5 Tage) | +0,151 / 1,19 | +0,233 / 0,47 | 85–86 % |
| tiefe Volatilität (60 Tage) | −0,118 / −1,23 | −0,322 / −0,91 | 15–32 % |
| nahe am 52-Wochen-Hoch | −0,066 / −0,73 | −0,242 / −0,75 | 53–74 % |
| Umsatzschock mit Richtung | −0,173 / **−2,36** | −0,446 / −1,65 | 86–90 % |

**Sechs von acht Zeilen zeigen in die falsche Richtung** — das ist kein knappes Verfehlen, sondern in der registrierten Richtung widerlegt. Die einzige Zeile mit richtigem Vorzeichen ist die **Kurzfrist-Umkehr**, also die Fortsetzung des W7-Befunds aus Trendwende II — aber bei t 1,19 und 0,47 weit von jeder Aussage entfernt. **Kein Zielportfolio geschrieben.**

**Warum dieser Nullbefund mehr wert ist als die vier davor:** die Maschine ist von außen geprüft. Das Orakel findet seine Kante (t 8,8 bis 52,9), die Leck-Klinke meldet 111.406 Verstöße im präparierten Fall und 0 in allen acht Kandidatenläufen, und die Momentum-Reihe läuft mit Kenneth Frenchs veröffentlichtem Faktor mit — als Long-Short gerechnet ρ = 0,73. Ein „nichts gefunden" heißt hier zum ersten Mal wirklich „da ist nichts", nicht „wir haben nicht hingesehen".

> **ZURÜCKGENOMMEN 15.09. (PM, auf Wilhelms Nachfrage):** Der Satz darüber ist falsch. Die **Mindestgröße, die diese acht Zeilen mit 80 % Wahrscheinlichkeit gefunden hätten**, liegt bei **11,6 bis 23,5 % je Jahr** über dem Universum nach Kosten (MDE = (2,734 + 0,8416) · se; Woche 0,26–0,45 Pp je Woche, Monat 0,97–1,76 Pp je Monat). Eine Kante von 4 % im Jahr war damit **unsichtbar**. Der haltbare Satz lautet: *da ist nichts in der Größenordnung von zwölf Prozent aufwärts*. Eine geprüfte Maschine schützt nicht vor zu wenig Auflösung — das sind zwei verschiedene Dinge. Rechnung dazu: für eine 4-%-Kante bräuchte man bei der Streuung eines 22-Werte-Dezils gegen das Universum (sd ≈ 5,3 Pp je Monat) rund **270 Jahre** Daten; häufiger umschichten hilft nicht, die Wochenstreuung skaliert mit. **Weitere Rangfunktionen in dieser Bauart sind deshalb sinnlos.** Auswege: Streuung drücken (markt- und branchenneutraler Vergleich statt gegen das Universum), oder die Ereignis-Achse, wo Effekte je Ereignis 1–5 Pp groß sind und pro Ereignis einmal bezahlt werden.

### Trend reiten: Momentum lebt auf 782 Werten — die Absicherungen kosten mehr, als sie schützen (16.09.2026)

Bericht `studien/querschnitt-pruefstand-2026-09-13/ERGEBNIS-TEIL3.md`. Universum Klassen 50-250 / 250-1000 / ab1000 (~782 Werte je Umschichtung), Momentum 12-1, monatlich, oberstes Dezil (78 Werte), long only, Kosten gemessen (0,026 Pp/Monat bei 32 % Umschlag), 2017-02 bis 2026-08.

| Variante | netto Pp/Monat | Δ zu V0 | t (gepaart) | MDD | Zeit im Markt | Urteil |
|---|---:|---:|---:|---:|---:|---|
| **V0** Momentum pur | **+2,14** | — | — | 37,4 % | 100 % | Grundlinie |
| V1 Regime-Schalter (SPY > EMA200) | +1,36 | −0,78 | −2,06 | **37,6 %** | 30–100 % | nicht bestanden |
| V2 Volatilitätsbremse (15 %-Ziel) | +1,02 | −1,13 | −2,70 | 30,6 % | 58 % | nicht bestanden |
| V3 beides | +0,71 | −1,44 | −2,82 | **21,0 %** | ~30 % | nicht bestanden |

**Was steht:** Momentum ist extern verankert — die Long-Short-Reihe läuft mit Kenneth Frenchs `Mom` bei **ρ = 0,81** (Teil 2 auf 220 Werten: 0,73). V0 gegen das Universum +1,12 Pp/Monat bei t 2,26 und MDE 1,39 — für sich allein **nicht** aufgelöst; die Existenz des Effekts trägt die Literatur, nicht unsere Stichprobe.

**Was nicht steht: die Absicherung.** Alle drei Varianten verlieren signifikant Rendite (0,8 bis 1,4 Pp/Monat). V1 schützt nicht einmal — der Regime-Schalter pendelt (66 Schaltungen, 22 allein 2022) und hat am Ende den **größeren** Rückgang. V3 halbiert den Rückgang (21 statt 37 %), zahlt dafür aber zwei Drittel der Rendite.

**Der strukturelle Befund, der Wilhelms Crash-Frage beantwortet:** im Fenster 2020-11 bis 2021-06 ist V1 **identisch** mit V0, weil SPY die ganze Zeit über seiner EMA200 stand. Ein Marktregime-Schalter kann gegen einen Momentum-Einbruch prinzipiell nicht schützen — der passiert, wenn der Markt *steigt* und die Verlierer explodieren. Was er kann: den echten Crash abfedern (2020-02…04: Rückgang 19 statt 37 %). Was er kostet: jede Seitwärtsphase (2022: −10,2 % gegen +1,2 %).

**Zielportfolio:** `zielportfolio/momentum-v0/<monat>.json`, 115 Dateien — die Schnittstelle zum Momentum-Buch des Mittelfrist-Depots (das bisher auf 193 Werten läuft; 51 der 78 Dezilwerte liegen in der Klasse 50-250). **Offener Entscheid:** Rendite (V0) gegen Rückgang (V3).

### „Gedrückt, aber liefert": NEIN — und zwar mit Auflösung (18.09.2026)

Bericht `studien/querschnitt-pruefstand-2026-09-13/ERGEBNIS-TEIL4.md`. Frage (Wilhelm 16.09.): Werte, deren Kurs zwölf Monate hinter dem Markt liegt (A), aber deren Gewinne beschleunigen (B, Fundamental-Momentum aus den SEC-Bilanzen, punkt-in-zeit) — schlagen sie die gedrückten Werte, die nicht liefern?

| | Δ netto je 120 Tage | se (HH) | t | MDE₈₀ | 95-%-Obergrenze |
|---|---:|---:|---:|---:|---:|
| A∧B gegen A∧¬B, gepaart, 111 Monate | **−0,84 Pp** | 1,18 | −0,71 | 3,32 | **+1,48 Pp** |

**Das ist der erste Nullbefund dieses Projekts, der etwas ausschließt.** Die Literatur nennt 3–6 Pp je 120 Tage; die Obergrenze liegt bei 1,48. Nicht „nicht gefunden", sondern **„nicht in dieser Größe vorhanden"** — in liquiden US-Werten 2017–2026, mit Bilanzzahlen ab dem Einreichungstag. Die Eichung bestätigt es: das Fundamental-Momentum allein (B-Quintil gegen Pool) bringt +1,18 Pp bei MDE 2,30 — auch für sich nichts Auflösbares.

**Was das für Wilhelms Idee heißt:** „liefert schon, bevor der Kurs es zeigt" ist am Markt **nicht** übersehen — jedenfalls nicht in dem, was in den Bilanzen steht. Die Zahl ist im Kurs, wenn sie im 10-Q steht. Was dieser Test nicht prüft: Informationen, die **nicht** in Bilanzen stehen (Produkte, Verträge, Patente) — das ist Einzelfirmen-Recherche, keine Messung. Alle Kontrollen bestanden: Orakel +38 Pp (t 18), Placebo −0,24, Leck-Klinken 0 Verstöße bei 92.191 Leser-Zugriffen, Vorprüfung des PM reproduziert.
