# Vorwärtstest-Plan Momentum-Buch (04.10.2026)

*Planungsbericht, keine Messung und keine Anlageberatung. Alles Simulation. Die Entscheidung trifft der Anleger. Zahlen aus `studien/vorwaertstest-plan-2026-10/` (`rechner.js`, `test.js` mit 109 grünen Zusicherungen, `ergebnis.json`, `tracking-error.md`, `literatur.md`).*

## Kurzfassung

1. **Die Rendite kann den Vorsprung nicht beweisen, auch nach Jahren nicht.** Das Buch schwankt gegenüber dem S&P 500 um etwa 13–21 % im Jahr (eigener Rückblick: 24–44 %). Dagegen ist ein Vorsprung von 7 Pp im Jahr klein.
2. **Nach 12 Monaten** sähe man einen Vorsprung erst ab etwa 42 Pp im Jahr (Spanne 32–52). Nach 24 Monaten ab etwa 30 Pp, nach 5 Jahren ab etwa 19 Pp.
3. **Um +7 Pp von null zu trennen,** müsste man 21–56 Jahre warten (Mitte 37). Mit dem Schwankungswert aus dem eigenen Rückblick wären es 75 bis über 240 Jahre.
4. **Nach 12 Monaten ist auch ein Buch, das wirklich +7 Pp bringt,** in etwa jedem dritten Fall hinter dem S&P 500 (34 %). Nach 24 Monaten noch in 28 %. Ein Rückstand nach einem Jahr widerlegt also nichts, ein Vorsprung beweist nichts.
5. **Die Rückblickzahl selbst ist weich.** Ihr Zufallsbereich ist ±11 bis ±20 Pp im Jahr. Rechnet man sie vorsichtig zusammen (Annahme: wahrer Vorsprung meist zwischen −3 und +3 Pp), bleiben etwa +0,5 Pp übrig. Bei großzügiger Annahme sind es etwa +3 bis +4 Pp.
6. **Was ein kurzer Test leisten kann:** prüfen, ob das Buch so handelt wie gemessen. Das ist genau messbar (Kurse, Kosten, Ausschüttungen, Reihenenden, Auswahl der Werte) und braucht keine Jahre. Vorschläge in Abschnitt 3.
7. **Abbruch nach Rendite ist keine Statistik, sondern eine Risikogrenze.** Ein Abbruch bei −30 % vom Höchststand träfe auch ein funktionierendes Buch im ersten Jahr in rund der Hälfte bis drei Vierteln der Fälle. Der Rückblick sah in allen 126 Startvarianten mindestens −36 %, schlimmstenfalls −57 %.
8. **Abbruch nach Umsetzung ist scharf prüfbar:** Abweichung der Kurse, der Kosten, der Auswahl, nicht gebuchte Teilungen. Das ist die eigentliche Sicherung.
9. **Entscheidungsweg:** Indexfonds als Vorgabe, dann der Umsetzungstest, dann ein Momentum-ETF, dann erst ein kleiner, abgegrenzter Betrag im eigenen Buch. Keine Stufe wird durch die Rendite „bewiesen". Jede Stufe hängt an Kriterien und an einem Betrag, dessen Verlust (bis −57 %, im Einzelfall mehr) tragbar ist.
10. **Wichtig vorab:** Die Kriterien binden erst, wenn der Anleger sie annimmt und sie vor der Umschichtung am 23.11.2026 festgeschrieben sind.

## 1. Was ein Vorwärtstest von 3, 6, 12, 24 Monaten zeigen kann

### 1.1 Tracking Error (Schwankung des Abstands zum S&P 500)

Quelle: `studien/vorwaertstest-plan-2026-10/tracking-error.md`.

| Herkunft | Zeitraum | TE p. a. | Art |
|---|---|---|---|
| Ken French, oberstes Momentum-Dezil (hunderte Werte) minus Markt | 2017–2021 | 11,8 % | gemessen (Datei, CRSP-Stand 08/2026) |
| dasselbe | 2021–2026 | 19,0 % | gemessen |
| dasselbe | 2003–2026 | 13,1 % | gemessen |
| Aufschlag auf nur 19 Werte (Einzelwertrisiko 25–40 % je Wert, Näherung σ/√19) | | +1 bis +3 Pp | **geschätzt** |
| **Spanne für das 19-Werte-Buch** | | **13 / 17 / 21 %** (niedrig / mittel / hoch) | Schätzung |
| Eigener Rückblick A-187 (2017–21), aus 19 Periodenabständen | | 24,3 % | abgeleitet aus `momentum-korb-2026-10-04/ergebnis.json` |
| Eigener Rückblick B-187 (2021–26), aus 20 Periodenabständen | | 44,2 % | abgeleitet |

- Die ETF-Zahlen aus Suchtreffern (MTUM 2,1 %, QMOM 2,4 %, SPMO 2,2 %) sind Abweichungen vom **eigenen** Index, nicht vom S&P 500. Sie sind hier nicht verwendet. MTUM- und SPMO-Originale und AQR-Papiere waren nicht abrufbar.
- **Der eigene Rückblick liegt 1,5- bis 2-fach über den öffentlichen Daten.** Ungeklärt. Mögliche Gründe: Mechanik des Buchs mit leeren Plätzen und Kleinstpositionen (Nr. 85), wenige Werte, Ausreißer-Perioden (2020, 2024), Messdefinition (Audit-Punkt 21). Die Streuung dieser Schätzung selbst liegt bei etwa ±16 %. Bis das geklärt ist, rechnet der Plan mit 17 % als Mitte und 24 % als Belastungsfall. 44 % ist durch öffentliche Daten nicht gestützt.

### 1.2 Kleinste nachweisbare Überrendite (Pp p. a., Sicherheit 5 % einseitig, Trennschärfe 80 %)

Formel: MDE = (z₉₅ + z₈₀) · TE / √(Jahre) mit z₉₅ = 1,645, z₈₀ = 0,842. Annahme: Monate unabhängig, Normalverteilung (mit t₄-Rändern verändert sich wenig, siehe `ergebnis.json`).

| TE | 3 Mon. | 6 Mon. | 12 Mon. | 24 Mon. | 36 Mon. | 60 Mon. |
|---|---|---|---|---|---|---|
| 13 % | 64,6 | 45,7 | 32,3 | 22,9 | 18,7 | 14,5 |
| **17 %** | 84,5 | 59,8 | **42,3** | **29,9** | 24,4 | **18,9** |
| 21 % | 104,4 | 73,8 | 52,2 | 36,9 | 30,1 | 23,4 |
| 24,3 % (Rückblick A) | 120,9 | 85,5 | 60,4 | 42,7 | 34,9 | 27,0 |

Zweiseitig (Sicherheit 5 % beidseitig) ist alles etwa 12 % größer (TE 17 %, 12 Mon.: 47,6).

### 1.3 Wie lange, um +7 Pp von null zu trennen (80 % Trennschärfe, einseitig)

| TE | +7 Pp | +4 Pp | +2 Pp |
|---|---|---|---|
| 13 % | 21,3 Jahre | 65 Jahre | 261 Jahre |
| **17 %** | **36,5 Jahre** | 112 Jahre | 447 Jahre |
| 21 % | 55,6 Jahre | 170 Jahre | 682 Jahre |
| 24,3 % (Rückblick A) | 74,5 Jahre | 228 Jahre | 913 Jahre |
| 44,2 % (Rückblick B) | 247 Jahre | 755 Jahre | 3.021 Jahre |

Trennschärfe (Wahrscheinlichkeit, einen wahren Vorsprung von +7 Pp bei 5 % einseitig zu erkennen):

| TE | 3 Mon. | 12 Mon. | 24 Mon. | 60 Mon. |
|---|---|---|---|---|
| 13 % | 8 % | 13 % | 19 % | 33 % |
| 17 % | 8 % | 11 % | 14 % | 23 % |
| 21 % | 7 % | 9 % | 12 % | 18 % |

Nach dem Mühle-Grundsatz „MDE vor dem Urteil": die Frage liegt weit unter der Auflösung. **Antwort: „nicht entscheidbar", nicht „kein Effekt".**

### 1.4 Wo landet der Abstand nach n Monaten (Szenario TE 17 %)

| Wahrer Vorsprung | Monate | 5 % | 25 % | Median | 75 % | 95 % | Abstand < 0 |
|---|---|---|---|---|---|---|---|
| +7 Pp | 12 | −21,0 | −4,5 | +7,0 | +18,5 | +35,0 | 34 % |
| +7 Pp | 24 | −25,5 | −2,2 | +14,0 | +30,2 | +53,5 | 28 % |
| 0 Pp | 12 | −28,0 | −11,5 | 0 | +11,5 | +28,0 | 50 % |
| 0 Pp | 24 | −39,5 | −16,2 | 0 | +16,2 | +39,5 | 50 % |
| −2 Pp | 12 | −30,0 | −13,5 | −2,0 | +9,5 | +26,0 | 55 % |

(Kumulierter Abstand in Pp. Fette Ränder, t₄, ändern die Zahlen um 1–3 Punkte, siehe `ergebnis.json`.) Ein Buch mit +7 Pp und eines mit 0 Pp sehen nach zwölf Monaten fast gleich aus.

### 1.5 Wie weich ist die Rückblickzahl selbst

Rückblick: +7,3 Pp p. a. (2017–21) und +8,3 Pp p. a. (2021–26). Standardfehler je Fenster 11,2 bzw. 19,8 Pp p. a. Beide Zeiträume sind je von einem Schub getragen (2020; 2024/25). Mit Schrumpfung zu null (Normal-Normal, Prior-Streuung ist eine **Annahme**):

| Annahme: wahrer Vorsprung streut um null mit | Mittel nachher | 90-%-Bereich | P(> 0) | P(> 4 Pp) |
|---|---|---|---|---|
| 2 Pp | +0,3 | −2,9 bis +3,5 | 56 % | 3 % |
| **3 Pp** | **+0,7** | −4,1 bis +5,4 | 59 % | 12 % |
| 5 Pp | +1,6 | −5,7 bis +8,9 | 64 % | 29 % |
| 10 Pp | +3,9 | −7,6 bis +15,3 | 71 % | 49 % |

(Beide Fenster zusammengefasst nach Inverse-Varianz: +7,5 ± 9,7.) Die Literatur stützt den Abschlag: McLean/Pontiff finden −26 % außerhalb der Stichprobe und −58 % nach Veröffentlichung (die „−32 %" sind deren Differenz, kein eigener Abschlag). Chen findet 20–36 % Zerfall. Für eine aus wenigen Varianten gewählte Regel wie diese ist ein Abschlag über 50 % eine Einschätzung, keine Messung (`literatur.md`, Abschnitt F).

## 2. Was ein kurzer Vorwärtstest stattdessen leisten kann

Der Test prüft, **ob das Buch handelt wie gemessen**. Die Messung des Rückblicks gilt nur für genau diese Mechanik. Stand 04.10.: das Buch hält 19 Positionen (Einstand 5.074 bis 5.274 $), Bargeld 0, erste Umschichtung um den 23.11.2026, danach etwa alle 63 Handelstage (Feb., Mai, Aug. 2027). Nach 3 / 6 / 12 / 24 Monaten liegen damit 1 / 2 / 4 / 8 Umschichtungen vor. Die Umsetzung lässt sich schon nach der ersten prüfen.

Je Umschichtung ist eine **Zahl** auszuweisen:

| Prüfgröße | Wie gemessen | Vorgeschlagenes Kriterium (Vorschlag, vom Anleger anzunehmen) | Begründung der Schwelle |
|---|---|---|---|
| **P1 Auswahl** | Zielliste des Buchs gegen unabhängige Neuberechnung (zweiter Rechner nach `REGEL.md`) | höchstens 2 von 19 Namen verschieden, Rangreihenfolge der oberen 5 gleich | Rückblick-Rechner stimmten an allen 19 Umschichtungstagen auf 0,01 % überein; zwei Namen entsprechen der Rangkante |
| **P2 Preis** | Ausführungskurs gegen Eröffnungskurs des Handelstags aus unabhängiger Quelle (Minutenarchiv), je Position in Basispunkten | Median ≤ 10 Bp, kein Wert > 50 Bp | Messung nimmt Eröffnungskurse an. Kosten sind 20 Bp je Seite angesetzt. Umsatz je Umschichtung etwa 40–45 % je Seite, Kostenlast im Rückblick etwa 0,35–0,7 Pp p. a. (5.053 $ in 4,7 Jahren bzw. 3.156 $ in 5 Jahren, grob). **10 Bp mehr je Seite kosten damit etwa 0,2–0,4 Pp p. a.** |
| **P3 Kosten** | tatsächlich gezahlte Kosten je Seite gegen 20 Bp | bei echtem Geld ≤ 30 Bp je Seite; Hochrechnung der Gesamtabweichung (P2 + P3) ≤ 1 Pp p. a. | etwa ein Siebtel des behaupteten Vorsprungs |
| **P4 Ausschüttungen** | Werden Dividenden der 19 Werte gebucht oder wenigstens ausgewiesen, S&P 500 mit Ausschüttung gerechnet? | **ja, gebucht** (heute buchen die Bücher keine; Marktseite seit Nr. 81 mit) | sonst steht dem Markt mit Ausschüttung ein Buch ohne gegenüber. Größe nicht nachgemessen |
| **P5 Reihenenden** | Teilungen, Übernahmen, Umbenennungen, Handelsaussetzung in gehaltenen Werten | **kein ungebuchter Fall** (null Toleranz) | Nr. 81: ein ungebuchter Split erzeugt Scheinverlust. Bisher kein Fall |
| **P6 Platzbelegung** | Positionen unter 5 % des Zielbetrags, leere Plätze | ausweisen. Stand: keine Position unter 4.600 $ | Nr. 85: Mechanik erzeugt Kleinstpositionen; die Zahl je Startphase ist deshalb zerbrechlich |
| **P7 Marktstand** | Kaufzeitpunkt und Anfangsstand des Vergleichs | gleicher Zeitpunkt, Abweichung ≤ 0,05 Pp | Nr. 81: 0,14 Pp Anfangsabweichung bekannt, Berichtigung steht aus (Nr. 87) |

Mehr leistet ein kurzer Test nicht. Er kann **Mängel beweisen** (Abweichung von der Messung), aber keinen Vorsprung. Wichtig: wenn P1–P7 bestanden sind, ist nur die Umsetzung bestätigt. Der Rückblick bleibt vom Zufall nicht zu trennen (`wiki/belegstand.md`: belegte Kanten: null).

## 3. Abbruchregeln vorab

### 3.1 Warum nicht „Abstand nach n Monaten"

Die Gewinn-/Verlustschwelle trennt ein funktionierendes von einem wertlosen Buch kaum (Tabelle 1.4). Rückstand binnen 12 Monaten bei TE 17 %, kumuliert in Pp, Wahrscheinlichkeit irgendwann erreicht (Monatsschritte):

| Rückstand | wahr +7 Pp | wahr 0 Pp |
|---|---|---|
| 10 Pp | 32 % | 46 % |
| 20 Pp | 10 % | 18 % |
| 25 Pp | 5 % | 10 % |
| 40 Pp | 0,4 % | 1,3 % |

Mit dem Rückblick-Wert 24,3 % statt 17 % (Belastungsfall) sind es nach 12 Monaten bei −25 Pp 16 % (wahr +7) gegen 24 % (wahr 0), bei −40 Pp 4 % gegen 7 %. Die Regel trennt „funktioniert" und „wertlos" nur schwach. Sie begrenzt Schaden, sie urteilt nicht. Ein Wald-Test (SPRT, H₀ = 0 gegen H₁ = +7 Pp, α 5 %, β 20 %) braucht beim Mittelwert im Median 232 Monate, bei TE 21 etwa 345. Ein jederzeit gültiges Konfidenzband liegt bei wahr +7 und TE 17 nach 600 Monaten erst in 50 % der Fälle über null. Beides ist für diese Frage ungeeignet.

### 3.2 Vorgeschlagene Grenzen, aus der Verteilung des Rückblicks

Rückblick (je 63 Startphasen, die sich dieselben Jahre teilen und daher kein zweiter Nachweis sind):

| Größe | A-187 (2017–21) | B-187 (2021–26) |
|---|---|---|
| größter Rückschlag des Buchs (über 63 Phasen) | −49,0 % (−35,8 bis −53,0) | −56,9 % (−38,9 bis −56,9) |
| größter Rückschlag S&P 500 | −33,8 % | −24,5 % |
| Phasen mit Rückschlag ≤ −35 % | 63 von 63 | 63 von 63 |
| Phasen mit Rückschlag ≤ −50 % | 17 von 63 | 5 von 63 |
| Abstand je Periode (63 Tage), schlechtester / Median | −18,9 / +0,3 Pp | −28,1 / −5,1 Pp |
| Abstand je 4 Perioden hintereinander, schlechtester / schlechtestes Zehntel | −8,8 / −4,8 Pp | −37,8 / −24,5 Pp |
| 6 von 16 bzw. 6 von 17 Jahresfenstern negativ | ja | ja |
| größter Rückstand vom Hoch der Abstandsreihe | −20 Pp | −62 Pp |

Aus diesen Zahlen und der Rechnung in 3.1 folgen **Vorschläge**. Die Schwellen sind Setzungen des Plans, keine Messungen:

| Stufe | Auslöser | Folge | Begründung |
|---|---|---|---|
| **U (Umsetzung)** | P5 verletzt (ungebuchter Fall), P1 oder P2 verfehlt in 2 Umschichtungen hintereinander, P3-Hochrechnung > 1 Pp p. a. | **Halt**: keine neuen Käufe, kein weiteres echtes Geld, bis der Fehler behoben und die Umschichtung nachgerechnet ist | scharf prüfbar, eine Beobachtung genügt; die Streuung der Prüfgrößen ist klein gegen die Schwelle |
| **V1 (Warnung)** | Rückschlag des Buchs −35 % vom Höchststand | nur Prüfung: stimmt P1–P7? Liegt der S&P 500 ebenfalls im Minus? **Kein Stopp** | im Rückblick in allen 126 Startvarianten erreicht, also kein Zeichen für „Kante weg". Ein Stopp bei −30 % träfe ein funktionierendes Buch (Vol 35–45 %, +8 Pp) im ersten Jahr zu 47–77 % (bei −35 %: 37–62 %) |
| **V2 (Stopp für echtes Geld)** | Rückschlag −50 % **oder** 12-Monats-Rückstand von −25 Pp gegen den S&P 500, je vom Höchststand bzw. Start | echte Beträge auflösen, virtuelles Buch weiterlaufen lassen | −50 % wurde im Rückblick von 17 bzw. 5 von 63 Phasen erreicht (je im selben Einbruch). Bei einem funktionierenden Buch (Vol 35–45 %, +8 Pp) tritt −50 % binnen 12 Monaten in 7–23 % der Fälle auf. Rückstand −25 Pp: binnen 12 Monaten 5–16 % (wahr +7), 10–24 % (wahr 0) |
| **V3 (Endgrenze)** | Rückschlag −57 % (schlimmster Fall im Rückblick) oder 12-Monats-Rückstand −40 Pp | virtuelles Buch zur Prüfung, keine Rückkehr zu echtem Geld ohne neue Prüfung | jenseits von allem, was der Rückblick gesehen hat |

Noch einmal ehrlich: V1–V3 begrenzen den Verlust. Sie sagen **nicht**, ob das Buch eine Kante hat. Wer V2 auslöst und das Buch danach weiterlaufen lässt, hat im Mittel keinen statistischen Schaden. Wer sie auslöst und Geld abzieht, nimmt in Kauf, dass ein funktionierendes Buch mit der in der Tabelle genannten Wahrscheinlichkeit mit aufgegeben wird. Die Grenze zwischen −50 % und der Tragfähigkeit des Anlegers entscheidet der Anleger.

Nicht als Abbruch geeignet: ein Abstand nach 3 oder 6 Monaten (Spanne ±14 bis ±20 Pp allein durch Zufall, Tabelle 1.4), ein Gewinn-Ziel vor dem Ende.

## 4. Entscheidungsweg in Stufen

Nur Kriterien und Zahlen. Die Entscheidung trifft der Anleger. Keine Stufe wird dadurch freigegeben, dass die Rendite des Vorwärtstests „bewiesen" hätte. Das kann sie in den nächsten Jahren nicht (Abschnitt 1).

| Stufe | Was gilt | Auslöser für die nächste Stufe | Was die Stufe auslöst |
|---|---|---|---|
| **0 Indexfonds (Vorgabe)** | gesamtes Anlagegeld bleibt im breiten Indexfonds | — | Die Vergleichsgröße. Jede andere Stufe muss nach Kosten und Steuern gegen sie bestehen. Der S&P-500-Vergleich ohne Kosten und Steuern ist nur Hilfsgröße. |
| **1 Virtueller Test bis zur Umsetzungsprüfung** | Buch läuft weiter; P1–P7 je Umschichtung ausweisen | **mindestens 2 Umschichtungen** (23.11.2026 und etwa Feb. 2027) mit allen P1–P7 bestanden, keine U-Meldung. Besser: 4 Umschichtungen (12 Monate) | Nichts mit echtem Geld. Es entsteht der Nachweis, dass die Umsetzung stimmt (nicht, dass die Kante existiert). Auch offen: Klärung des Tracking-Error-Unterschieds 17 % gegen 24–44 %, Ausschüttungen buchen. |
| **2 Momentum-ETF** | falls Interesse an Momentum besteht: zunächst als börsengehandeltes Produkt mit eigener Kostenzeile, nicht als Einzelwertbuch | Kosten (laufende Kosten plus Spread) und Nachbildungsabweichung aus dem Datenblatt des Produkts selbst prüfen (diese Zahlen sind hier **nicht** belegt: QMOM/MTUM-Kostenzeilen nicht abgerufen) | Produkt mit vielen Werten (geringeres Einzelwertrisiko als 19 Werte), Umsetzungsrisiko beim Anbieter, kein Rechenfehlerrisiko im eigenen Buch. Auch hier gilt: die Kante ist nicht belegt (Literatur: Zerfall 26–58 % nach Veröffentlichung). |
| **3 Eigenes Buch mit kleinem echtem Geld** | nur nach Stufe 1 bestanden; Betrag so klein, dass ein Totalverlust einzelner Werte und ein Rückschlag bis −57 % ohne Folge für Lebensplanung tragbar sind | vorher schriftlich festgelegt: Betrag, U, V1–V3, Prüfdatum, Vergleichsstand (Indexfonds mit gleichem Betrag) | Es entsteht ein echter Messpunkt für P2/P3 (Kosten und Preise in Wirklichkeit statt Annahme). Aus der Rendite entsteht kein Beweis. |

Erwartungswert zum Abwägen (Annahmen, keine Zusage): Mit der Schrumpfung in 1.5 bleibt als plausible Spanne etwa +0,5 bis +4 Pp p. a. gegen den S&P 500, bei Rückschlägen bis −57 % (S&P: −25 bis −34 %) und einer Kostenlast der Umsetzung von 0,35–0,7 Pp p. a. (Rückblick). Das ist weniger als die ursprüngliche +7 bis +8 Pp. Die Größenordnung des Kostenabzugs liegt im Rückblick teilweise schon in den Zahlen (20 Bp je Seite), nicht aber Steuern (Nr. 82) und Ausschüttungen.

## 5. Methode und Grenzen

- **Rechner:** `studien/vorwaertstest-plan-2026-10/rechner.js` (Node, ohne Abhängigkeiten, deterministische Zufallsfolge mit festem Seed), `node test.js` (109 Zusicherungen, geschlossene Formeln gegen Monte Carlo, Quantile gegen Tafelwerte). Aufruf: `node rechner.js` oder `node rechner.js --json`.
- **Annahmen:** unabhängige Monate, konstante Schwankung, Normalverteilung (ersatzweise t₄), keine Volatilitätscluster. Echte Reihen haben Cluster und Autokorrelation (Momentum-Einbrüche geschehen beim Marktanstieg), was die Unsicherheit eher erhöht.
- **TE-Spanne 13/17/21 % ist eine Schätzung** aus Ken-French-Daten (Dezil mit hunderten Werten, gemessen) plus einem Aufschlag für 19 Werte (geschätzt). Der eigene Rückblick liegt höher und ist unerklärt. Wer mit 24,3 % rechnet (Belastungsfall), verlängert die Wartezeit auf das 2-fache.
- **Prior-Streuung** der Schrumpfung (2–10 Pp) ist eine Setzung. Das Ergebnis hängt an ihr (Tabelle 1.5).
- **Abbruchgrenzen** V1–V3 und Prüfschwellen P1–P7 sind Vorschläge. Sie sind aus dem Rückblick begründet, aber nicht gemessen.
- **Nicht untersucht:** Steuern (Nr. 82), tatsächliche Preis-/Kostenabweichung im Handel mit echtem Geld (keine Quelle für Retail-Slippage gefunden), Dividenden der Einzelwerte (Größe nicht nachgemessen).
- **Offen aus CLAUDE.md:** Audit-Punkt 21 (Messung an Live-Pfad angleichen). Er berührt P2 und die TE-Frage.
- Keine App-Änderung, keine Issues, kein `main`.

## 6. Quellen

Eigene Dateien: `wiki/belegstand.md`, `wiki/messmethodik.md`, `studien/momentum-korb-2026-10-04/` (`ergebnis.json`), `studien/massstab-rueckblick-2026-10-04/`, `studien/vorwaertstest-plan-2026-10/tracking-error.md`, `literatur.md`.

Öffentlich (Lesestatus und Details in `tracking-error.md` und `literatur.md`):
- Kenneth R. French, Data Library (Mom, Momentum-Dezile, Market-Rf), CRSP-Stand 08/2026 – gemessen.
- McLean & Pontiff (2016), „Does Academic Research Destroy Stock Return Predictability?", Journal of Finance – Volltext gelesen.
- Chen (2021), Zerfall veröffentlichter Prädiktoren – gelesen.
- Jegadeesh & Titman (1993) – gelesen. Daniel & Moskowitz (2016), „Momentum Crashes" – gelesen.
- Bailey & López de Prado, Deflated Sharpe Ratio; Bailey et al., Minimum Backtest Length – gelesen (Formeln als Bild, nur Text gesehen).
- Harvey & Liu, „Backtesting" – gelesen. Harvey/Liu/Zhu, „…and the Cross-Section of Expected Returns" – nur Abstract.
- Howard et al., Konfidenzfolgen; Johari et al., always-valid Inferenz (mSPRT) – gelesen.
- Lo (2002); Kaminski & Lo, „When Do Stop-Loss Rules Stop Losses?"; Bessembinder; Asness/Moskowitz/Pedersen; Frazzini/Israel/Moskowitz; Barroso & Santa-Clara; Page (CUSUM) – nur Abstract oder Zusammenfassung gesehen. Zahlen daraus sind **nicht** übernommen.
- Seeking-Alpha-Suchtreffer zu QMOM/MTUM/SPMO – nicht verwendet (Abweichung vom eigenen Index).
