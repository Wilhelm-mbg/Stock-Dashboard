# Steuer-Umsetzung 2026-10: Was bleibt nach Steuern und Kosten?

*Modellrechnung mit virtuellem Kapital — keine Steuer- und keine Anlageberatung. Unabhängig vom lokalen Auftrag Nr. 82 gerechnet, nichts daran angeglichen. Stand 04.10.2026, Zweig `pruefung/steuer-umsetzung`. Kein Studienurteil: die Zahl der belegten handelbaren Kanten bleibt **NULL** (`wiki/belegstand.md`).*

## Kurzfassung

1. **Nötiger Vorsprung vor Steuern, damit das Einzelaktienbuch (a) nach Steuern den thesaurierenden S&P-500-ETF (c) schlägt: rund 1,0 Pp p. a.** (Fenster 1: 1,02; Fenster 2: 1,10). Gegen den Momentum-ETF (b): 0,9 Pp (Fenster 1) bzw. 1,4 Pp (Fenster 2). Gemeint ist die Rendite nach Kosten und TER, vor Steuern.
2. Über alle Empfindlichkeiten (Umschlag halb/doppelt, Kosten 10/20/40 Bp, Kirchensteuer, Euro-Dollar ±10 %) liegt die Schwelle gegen (c) zwischen **0,84 und 1,44 Pp p. a.**, gegen (b) zwischen 0,71 und 1,91 Pp.
3. Euro-Endvermögen nach Steuern mit Verkauf am Ende (Fenster 1, aus 100.000 $): (a) **181.524 €**, (b) 135.125 €, (c) 143.676 €. Fenster 2: (a) 186.939 €, (b) 184.460 €, (c) 166.736 €.
4. Ohne Verkauf am Ende (latente Steuer nicht abgezogen) liegen die ETFs näher am Buch, weil ihre Steuer fast ganz am Schluss fällig würde (Fenster 1: 205.043 / 145.456 / 155.817 €).
5. Die Steuerbremse des Buchs ist **gut doppelt so groß wie die des ETF**: Fenster 1 4,2 Pp p. a. gegen 1,85 Pp bei (c). Der Unterschied bei den tatsächlichen Renditen beträgt **2,4 Pp p. a. (Fenster 1) bzw. 1,8 Pp (Fenster 2)**. Das **bestätigt das Projektmodell (rund 2,4 Pp) im Fenster 1**, im Fenster 2 liegt es etwas darunter.
6. **Die 2,4 Pp und die 1,0 Pp sind verschiedene Größen:** 2,4 Pp ist der Steuerunterschied bei den *tatsächlichen* (hohen) Renditen; die Gewinnschwelle ist der Vorsprung *am Gleichstand*, wo das Buch weniger Gewinn zu versteuern hat. Wer „2,4 Pp Vorsprung nötig" liest, überschätzt die Hürde um mehr als das Doppelte.
7. Der **tatsächliche** Rückblick-Vorsprung des Buchs (7,7 Pp gegen (c) im Fenster 1; 4,6 Pp im Fenster 2) liegt weit über der Schwelle. Das sagt nichts über die Zukunft: der Korb ist mit dem Wissen von heute gewählt, getragen von wenigen Werten, nach dem Belegstand vom Zufall nicht zu unterscheiden.
8. Größte Unsicherheiten: Verlustverrechnung und Auswahl der Verkäufe (Modell, kalibriert an 156 Verkäufen / 3.092 $ Kosten), Fenster 2 mit heutigem Steuerrecht gerechnet, Momentum-ETF-Rendite aus Factsheets mit benachbarten Fenstern. Siehe „Grenzen".

## Annahmen und Quellen

Die Recherchen liegen als Dateien neben dem Modell: `studien/steuer-umsetzung-2026-10/teil1-steuerrecht.md` (Steuerrecht, Quellen je Zeile, [P]/[S] gekennzeichnet), `teil2-kosten.md` (Gebühren, TER), `teil2b-etf-renditen-fx.md` (ETF-Renditen, EZB-Kurse). Modell: `modell.js`, Tests `test.js` (41 Zusicherungen grün), Lauf `lauf.js`, Parameter `parameter.json`, Rohergebnis `ergebnis.json`, Tabellen `tabellen.js`.

| Größe | Wert im Modell | Beleg |
|---|---|---|
| Abgeltungsteuer + Soli | 26,375 %; Kirchensteuer 8 %/9 %: 27,82 %/27,99 % | teil1 §1 [S] |
| Sparerpauschbetrag | 801 € bis 2022, 1.000 € ab 2023, Einzelperson; jede Strategie bekommt ihn für sich allein | teil1 §2 |
| Aktienverlusttopf | Aktienverluste nur mit Aktiengewinnen, Vortrag unbegrenzt; Dividenden getrennt | teil1 §3 [S/P] |
| Währung | Gewinn in € = Verkaufserlös in € minus Anschaffung in € (Kurs je Los); Währungsgewinn wird mitbesteuert | teil1 §4 (nur [S] Haufe) |
| US-Quellensteuer | 15 % (W-8BEN), voll auf die deutsche Steuer angerechnet, soweit Steuer anfällt | teil1 §5 |
| Teilfreistellung | 30 % Aktienfonds, auch auf die Vorabpauschale; für UCITS angenommen | teil1 §6/§7: **auf die Vorabpauschale „widersprüchlich, nicht belegt"** — angewandt nach § 20 InvStG; Gesetzestext nicht selbst gelesen (gesetze-im-internet.de war nicht erreichbar) |
| Vorabpauschale | 70 % × Basiszins × Jahresanfangswert, gedeckelt auf Wertzuwachs, im Anschaffungsjahr zeitanteilig; wird vom Verkaufsgewinn abgezogen (**Anrechnung beim Verkauf: nicht belegt**, nach § 19 InvStG angenommen); Steuer aus dem Fonds entnommen | teil1 §7 |
| Basiszins | 2021 −0,45 %, 2022 −0,05 %, 2023 2,55 %, 2024 2,29 %, 2025 2,53 %, 2026 3,20 % (BMF, [P] nur 2026); 2018 0,87 %, 2019 0,52 %, 2020 0,07 % [S] (Suche); **2017 = Wert 2018 angenommen** | teil1 §7; Websuche 04.10. |
| Fondsinterne Quellensteuer | in den veröffentlichten Fondsrenditen schon enthalten (Eichung auf Fondsrenditen) | teil2b |
| Kosten Buch | 20 Bp je Seite (Vorgabe des Auftrags; gemessen 10,4 Bp); Devisenaufschlag 0 im Basisfall (in den 20 Bp enthalten gedacht), Sonderfall 35 Bp je Seite (Stiftung Warentest 0,3–0,4 %) | teil2 |
| Kosten ETF | TER (c) 7 Bp, (b) 20 Bp (in den Factsheet-Renditen enthalten); Spread ein-/ausstiegsseitig 3 Bp **angenommen, nicht belegt** (Order selbst ca. 1 €, vernachlässigbar) | teil2 |
| Euro-Dollar | EZB: 16.09.2021 1,1763; 15.09.2026 1,1539; Jahresendwerte als Zwischenpunkte; 04.01.2017 1,0437; 15.09.2021 1,1824 | teil2b §1 |
| Buchrenditen | Gesamtertrag nach 20 Bp, vor Steuern: Fenster 1 +150,1 %, Fenster 2 +159,2 % (Vorgabe); Verlauf je Kalenderjahr nach dem 187er-Korb (`pm-korb148/ergebnis-korb187.json`, `momentum-korb-2026-10-04/ergebnis.json`), gestaucht auf diese Summen; Dividendenrendite 1,44 % p. a. | Auftrag; Projektdaten |
| (c) S&P-500-ETF | Fenster 1: CSPX-Fonds, 5 J p. a. 12,49 % (USD, Stand 31.08.2026; Fenster endet am 15.09.); Fenster 2: CSPX-Kalenderjahre 2017–2020 aus den Factsheets, 2021 bis 15.09. = Projekt-SPY +20,6 % | teil2b |
| (b) Momentum-ETF | IUMO (IE00BD1F4**N50**, nicht …M44, das ist der Value-ETF): Fenster 1 5 J p. a. 10,94 % (USD); Fenster 2 Kalenderjahre 2017–2020, 2021-Teilstück **angenommen** (9,1 %) | teil2b |
| Modell des Buchs | 18 Positionen, Umschichtung alle 3 Monate (20 Umschichtungen in 5 Jahren), Auswahl der Verkäufe nach schwächster Relativrendite der letzten 4 Quartale mit Rauschen; Streuung σ = 0,30 je Quartal, Umschlag 31 % des Werts je Umschichtung. **Eichung:** 156,1 Verkäufe (berichtet 156), 174,8 Käufe (173), Kosten 2.999 $ (3.092 $) | `kalib.js`, `ergebnis.json` |
| Zufall | 300 Läufe, gemeinsame Zufallszahlen für alle Szenarien, Startwert fest | `parameter.json` |

**Rechenweg in drei Sätzen.** Jede Rendite wird als Kalenderjahres-Verlauf vorgegeben und so verschoben, dass die Rechnung *ohne* Steuer genau das vorgegebene Ergebnis trifft (Test: Abweichung unter 0,2 %). Danach laufen Steuern durch: beim Buch Los für Los mit Steuer beim Verkauf (Jahreskonto, Verlusttopf, Dividenden mit Anrechnung), bei den ETF Vorabpauschale jedes Januar und Besteuerung des Rests beim Verkauf. Die Gewinnschwelle ist die jährliche Zusatzrendite, die (a) braucht, damit sein Endvermögen nach Steuern dem des ETF gleicht; angegeben wird sie als Unterschied der Renditen vor Steuern (nach Kosten).

## Ergebnisse

### Fenster 1: 16.09.2021 – 15.09.2026

Startkapital 100.000 $ = 85.012 € (EZB-Kurs am Starttag), 5,00 Jahre.

**Endvermögen in €** (Mittel über 300 Zufallsläufe des Buchmodells; (b), (c) deterministisch)

| | (a) Einzelaktienbuch | (b) Momentum-ETF | (c) S&P-500-ETF |
|---|---|---|---|
| vor Steuern, nach Kosten | 216.743 | 145.550 | 156.006 |
| nach Steuern, **mit Verkauf am Ende** | **181.524** | **135.125** | **143.676** |
| nach Steuern, **ohne Verkauf** (Marktwert, latente Steuer nicht abgezogen) | 205.043 | 145.456 | 155.817 |
| gezahlte Steuer insgesamt (laufend + Schlussverkauf bzw. Vorabpauschalen) | 32.372 | 10.400 | 12.297 |
| Rendite p. a. vor Steuern (nach Kosten) | 20,60 % | 11,36 % | 12,92 % |
| Rendite p. a. nach Steuern, mit Verkauf | 16,40 % | 9,72 % | 11,07 % |
| Steuerbremse in Pp p. a. (vor minus nach Steuern) | 4,20 | 1,64 | 1,85 |

Streuung des Buchmodells über die Zufallsläufe (10 %–90 %-Band, mit Verkauf): 180.554 – 182.591 € (das ist nur Modellrauschen aus der Positionsauswahl, keine Marktunsicherheit).

**Gewinnschwelle: nötiger Vorsprung vor Steuern** (Rendite p. a. von (a) minus Rendite p. a. des ETF, beide nach Kosten bzw. TER, vor Steuern, in Pp p. a.; (a) wird dazu um eine gleichbleibende Jahresrendite verschoben, bis das Endvermögen nach Steuern dem des ETF entspricht)

| | gegen (b) Momentum-ETF | gegen (c) S&P-500-ETF |
|---|---|---|
| nötiger Vorsprung vor Steuern | **0,88 Pp** | **1,02 Pp** |
| tatsächlicher Vorsprung des Buchs im Fenster (Rückblick) | 9,24 Pp | 7,68 Pp |
| Steuerlast-Unterschied bei den tatsächlichen Renditen (Steuerbremse (a) minus ETF) | 2,56 Pp p. a. | 2,36 Pp p. a. |

**Empfindlichkeit** (Endvermögen in € nach Steuern mit Verkauf; Schwelle = nötiger Vorsprung vor Steuern in Pp p. a.)

| Szenario | (a) | (b) | (c) | Schwelle gg. (b) | Schwelle gg. (c) |
|---|---|---|---|---|---|
| Basis | 181.524 | 135.125 | 143.676 | 0,88 | 1,02 |
| Umschlag halb | 184.830 | 135.125 | 143.676 | 0,86 | 0,97 |
| Umschlag doppelt | 174.607 | 135.125 | 143.676 | 1,05 | 1,28 |
| Kosten 10 Bp je Seite | 183.767 | 135.125 | 143.676 | 0,88 | 1,02 |
| Kosten 20 Bp je Seite (Basis) | 181.524 | 135.125 | 143.676 | 0,88 | 1,02 |
| Kosten 40 Bp je Seite | 177.115 | 135.125 | 143.676 | 0,88 | 1,01 |
| Devisenaufschlag Bank 35 Bp je Seite zusätzlich | 173.885 | 135.125 | 143.676 | 0,88 | 1,01 |
| Kirchensteuer 8 % | 179.605 | 134.555 | 143.003 | 0,95 | 1,09 |
| Kirchensteuer 9 % | 179.371 | 134.485 | 142.920 | 0,95 | 1,10 |
| Euro-Dollar-Endkurs −10 % (Dollar stärker) | 198.328 | 148.299 | 157.789 | 1,07 | 1,21 |
| Euro-Dollar-Endkurs +10 % (Dollar schwächer) | 167.692 | 124.346 | 132.130 | 0,71 | 0,84 |

**Annahme zum Momentum-ETF (b)** (nur (b) und die Schwelle gegen (b) ändern sich)

| Annahme | (b) Endvermögen € | Schwelle gg. (b) Pp |
|---|---|---|
| IUMO gemessen (Basis) | 135.125 | 0,88 |
| Momentum-ETF −2 Pp p. a. gegen Basis | 123.837 | 0,70 |
| Momentum-ETF +2 Pp p. a. gegen Basis | 147.607 | 1,07 |
| Momentum-ETF = S&P-500-Fonds (Aufschlag 0) | 143.676 | 1,02 |

### Fenster 2: 04.01.2017 – 15.09.2021

Startkapital 100.000 $ = 95.813 € (EZB-Kurs am Starttag), 4,70 Jahre.

**Endvermögen in €** (Mittel über 300 Zufallsläufe des Buchmodells; (b), (c) deterministisch)

| | (a) Einzelaktienbuch | (b) Momentum-ETF | (c) S&P-500-ETF |
|---|---|---|---|
| vor Steuern, nach Kosten | 219.215 | 203.887 | 182.321 |
| nach Steuern, **mit Verkauf am Ende** | **186.939** | **184.460** | **166.736** |
| nach Steuern, **ohne Verkauf** (Marktwert, latente Steuer nicht abgezogen) | 204.656 | 203.948 | 182.375 |
| gezahlte Steuer insgesamt (laufend + Schlussverkauf bzw. Vorabpauschalen) | 30.200 | 19.427 | 15.585 |
| Rendite p. a. vor Steuern (nach Kosten) | 19,28 % | 17,45 % | 14,69 % |
| Rendite p. a. nach Steuern, mit Verkauf | 15,30 % | 14,97 % | 12,52 % |
| Steuerbremse in Pp p. a. (vor minus nach Steuern) | 3,98 | 2,48 | 2,16 |

Streuung des Buchmodells über die Zufallsläufe (10 %–90 %-Band, mit Verkauf): 186.300 – 187.680 € (das ist nur Modellrauschen aus der Positionsauswahl, keine Marktunsicherheit).

**Gewinnschwelle: nötiger Vorsprung vor Steuern** (Rendite p. a. von (a) minus Rendite p. a. des ETF, beide nach Kosten bzw. TER, vor Steuern, in Pp p. a.; (a) wird dazu um eine gleichbleibende Jahresrendite verschoben, bis das Endvermögen nach Steuern dem des ETF entspricht)

| | gegen (b) Momentum-ETF | gegen (c) S&P-500-ETF |
|---|---|---|
| nötiger Vorsprung vor Steuern | **1,41 Pp** | **1,10 Pp** |
| tatsächlicher Vorsprung des Buchs im Fenster (Rückblick) | 1,83 Pp | 4,59 Pp |
| Steuerlast-Unterschied bei den tatsächlichen Renditen (Steuerbremse (a) minus ETF) | 1,50 Pp p. a. | 1,82 Pp p. a. |

**Empfindlichkeit** (Endvermögen in € nach Steuern mit Verkauf; Schwelle = nötiger Vorsprung vor Steuern in Pp p. a.)

| Szenario | (a) | (b) | (c) | Schwelle gg. (b) | Schwelle gg. (c) |
|---|---|---|---|---|---|
| Basis | 186.939 | 184.460 | 166.736 | 1,41 | 1,10 |
| Umschlag halb | 189.781 | 184.460 | 166.736 | 1,26 | 1,01 |
| Umschlag doppelt | 180.770 | 184.460 | 166.736 | 1,91 | 1,44 |
| Kosten 10 Bp je Seite | 189.135 | 184.460 | 166.736 | 1,42 | 1,10 |
| Kosten 20 Bp je Seite (Basis) | 186.939 | 184.460 | 166.736 | 1,41 | 1,10 |
| Kosten 40 Bp je Seite | 182.628 | 184.460 | 166.736 | 1,41 | 1,09 |
| Devisenaufschlag Bank 35 Bp je Seite zusätzlich | 179.455 | 184.460 | 166.736 | 1,41 | 1,09 |
| Kirchensteuer 8 % | 185.165 | 183.397 | 165.883 | 1,53 | 1,18 |
| Kirchensteuer 9 % | 184.949 | 183.267 | 165.779 | 1,54 | 1,19 |
| Euro-Dollar-Endkurs −10 % (Dollar stärker) | 203.757 | 202.932 | 183.254 | 1,74 | 1,39 |
| Euro-Dollar-Endkurs +10 % (Dollar schwächer) | 173.088 | 169.347 | 153.222 | 1,13 | 0,84 |

**Annahme zum Momentum-ETF (b)** (nur (b) und die Schwelle gegen (b) ändern sich)

| Annahme | (b) Endvermögen € | Schwelle gg. (b) Pp |
|---|---|---|
| IUMO gemessen (Basis) | 184.460 | 1,41 |
| Momentum-ETF −2 Pp p. a. gegen Basis | 169.553 | 1,16 |
| Momentum-ETF +2 Pp p. a. gegen Basis | 200.834 | 1,69 |
| Momentum-ETF = S&P-500-Fonds (Aufschlag 0) | 166.736 | 1,10 |

## Lesart der Tabellen

- **Wirkungsvoll sind Umschlag, Devisenaufschlag und Dollarkurs**, nicht die Kirchensteuer: Doppelter Umschlag senkt (a) im Fenster 1 um rund 7.000 €, ein Devisenaufschlag von 35 Bp je Seite um rund 7.600 €. Kirchensteuer kostet (a) rund 2.000 €, die ETF rund 600–800 €.
- Die Schwelle hängt **kaum an den Kosten**: Kosten stehen schon in „nach Kosten"; sie verschieben das Endvermögen, aber nicht den nötigen Vorsprung nach Kosten. Brutto vor Kosten braucht (a) entsprechend mehr.
- Die Schwelle gegen (b) hängt an der **Annahme zur Momentum-ETF-Rendite**: von 0,70 Pp (−2 Pp) bis 1,07 Pp (+2 Pp) im Fenster 1. Je besser (b), desto höher die Hürde, weil bei höherem Gleichstandsniveau mehr Gewinn zu versteuern ist.
- Fenster 2 (Dollar schwächer, Momentum-ETF stark): (a) liegt nur 2.500 € vor (b) und fällt im Szenario „Umschlag doppelt" hinter (b) zurück (180.770 gegen 184.460 €).

## Grenzen (nicht verschweigen)

1. **Modellrechnung, nicht Steuerberatung.** Teilfreistellung auf die Vorabpauschale und Anrechnung der Vorabpauschale beim Verkauf sind nicht aus dem Primärtext belegt (siehe oben); ebenso ist die Anerkennung als Aktienfonds für die UCITS und die Währungsbesteuerung nur aus Sekundärquellen gestützt.
2. **Fenster 2 mit heutigem Recht gerechnet.** Vor 2018 galt für Fonds das alte Regime (Investmentsteuergesetz bis 2017, Stichtagsregel 31.12.2017). Das Fenster 2 ist deshalb eine Rechnung „was wäre, wenn heutiges Recht gälte", Basiszins 2017 angenommen, Pauschbetrag 801 €.
3. **Verkaufsauswahl modelliert.** Wie viel Gewinn die Verkäufe des echten Buchs realisieren, ist nicht gemessen. Das Modell wählt die Verlierer der letzten vier Quartale zuerst, kalibriert an Zahl der Verkäufe und Kosten (Kosten −3 % gegen die Meldung). Realisiert das echte Buch mehr Gewinn je Verkauf, sind die Steuern höher; die Empfindlichkeit „Umschlag doppelt" deckt einen Teil davon ab, nicht die Auswahl selbst.
4. **Pfad stammt aus anderem Korb.** Die Jahresverläufe stammen vom 187er-Korb (ohne Kleinstpositionsregel), gestaucht auf +150,1 % bzw. +159,2 %. Die Besteuerung hängt am Verlauf (frühe Verluste fließen in den Verlusttopf, späte Gewinne fallen gebündelt an); ein anderer Verlauf mit gleicher Summe gibt andere Steuern.
5. **ETF-Renditen sind Näherungen:** Factsheet-Fenster enden am 31.08.2026, nicht am 15.09.; USD-Fondsrenditen mit EZB-Kursen umgerechnet, keine EUR-Anteilsklassen; 2021-Teilstück des Momentum-ETF im Fenster 2 angenommen; Umschlagkosten im Momentum-Fonds **nicht belegt** (TER enthält sie nicht).
6. **Dividendenrendite:** der Auftrag nannte 1,3 % für SPY; das Projekt misst 1,52 % (Fenster 1) und 2,05 % (Fenster 2) aus den Ausschüttungen, Aggregatoren nennen aktuell 0,98–1,1 %. Auf (c) wirkt sie nicht, weil auf die veröffentlichte Fondsrendite geeicht wird; auf das Buch wirkt die Dividende des Modells (1,44 % angenommen, in Fenster 2 aus den Projektdaten nicht belastbar, dort steht ein negativer Wert in `momentum-korb-2026-10-04/ergebnis.json`).
7. **Ein Anleger, ein Konto:** jede Strategie bekommt den Pauschbetrag für sich; Ehegatten, Freistellungsaufträge bei mehreren Banken, Gegenrechnung mit anderen Gewinnen sind nicht modelliert. Verluste verrechnet die Bank im Jahr sofort und erstattet; das ist vereinfacht.
8. **Kein Beleg für eine Kante.** Der Rückblick-Vorsprung ist beschreibend; der Korb ist mit heutigem Wissen gewählt (`wiki/belegstand.md`, 04.10.2026). Die Schwelle ist die Hürde, die ein *künftiger* Vorsprung nehmen müsste, nicht ein Hinweis, dass er kommt. Nach der Mühle wäre schon der Nachweis eines Vorsprungs von 1 Pp p. a. bei 20 Perioden und einem Standardfehler von rund 5 Pp je Periode nicht entscheidbar.
9. Nicht verifiziert: die lokale Steuerrechnung (Auftrag Nr. 82); es wurde nichts angeglichen. Der Linter lief nicht (Abhängigkeiten in dieser Umgebung nicht installiert); `node test.js` ist grün.

## Dateien

`studien/steuer-umsetzung-2026-10/`: `modell.js`, `test.js`, `lauf.js`, `kalib.js`, `tabellen.js`, `parameter.json`, `ergebnis.json`, `tabellen.md`, `teil1-steuerrecht.md`, `teil2-kosten.md`, `teil2b-etf-renditen-fx.md`. Nachrechnen: `node test.js`, `node lauf.js` (rund 80 s), `node tabellen.js`.
