# REGEL — Momentum-Buch absichern: Gegenprobe 2017 bis 2021, zweiter unabhängiger Lauf, eine Variante gegen die Klumpung (Auftrag Nr. 78)

Kennung `momentum-korb-2026-10-04/v1`. Diese Datei ist **vor dem Lauf** geschrieben und mit Code (`korb.js`) und Tests (`test.js`)
zusammen committet (Siegel). Teil A ist §1 und §1a des Auftrags `uebergabe/auftrag-momentum-absichern-2026-10-04.md` (Fassung nach
Zweitleser, mit den Nachträgen des PM), **wörtlich** und unverändert. Teil B nennt die Fundstellen. Teil C hält fest, wie der Code die
Stellen liest, die Teil A offen lässt. Teil D nennt die Prüfungen. Nach dem Siegel wird an A, B und C nichts mehr geändert; was nicht
geht, wird gemeldet, nicht angepasst.

Beschreibende Zahlen nach vorher festgelegter Regel, mit Zufallsbereich — kein Urteil über eine Kante. Alles Simulation mit
virtuellem Kapital, keine Anlageberatung.

## Teil A — die Regel, wörtlich

### §1 Die Regel (vom PM festgelegt, bevor es eine Zahl gibt — nicht ändern; was nicht geht, melden statt anpassen)

1. **Grundregel:** alles wie in `studien/massstab-rueckblick-2026-10-04/REGEL.md` Teil A und Teil C (Panel v2.2 mit den verschwundenen Reihen;
   das Buch mit `mfhandel.js` nachgespielt: `momentumZiel`, `planeUmschichtung`, `fuehreAus` mit 20 Basispunkten je Seite, `bewerte`; Stichtag =
   Panel-Handelstag vor dem Ausführungstag, Handel zur Eröffnung, nächster Ausführungstag der 63. Panel-Handelstag danach; Reihenende nach der
   Hauptregel des Prüfstands; Gesamtertrag auf beiden Seiten; SPY aus dem Panel ohne Kosten; alle Lesarten aus Teil C). Startkapital 100.000.
2. **Der Korb 187** (wörtlich wie in `pm-korb148/REGEL-KORB148.md`): an jedem Stichtag bekommt `momentumZiel` nur die **187 Aktienreihen mit dem
   höchsten Median-Tagesumsatz** (Median über die 20 Balken bis einschließlich Stichtag — die Größe, die `momentumZiel` in `rangfolge[i].umsatz`
   ausweist) unter denen, die es auf dem vollen Panel zulässt (mindestens 253 Zeilen, nicht veraltet, Stärke berechenbar, Median-Tagesumsatz
   ≥ 100 Mio $). Bei gleichem Umsatz entscheidet der Name (aufsteigend). Auf diese 187 wird `momentumZiel` unverändert angewandt
   (Zielzahl 19). 187 ist die Zahl der Werte, die die App führt (vom PM am Bestand gezählt; das Buch hält 19 Positionen). Vom PM vorgeprüft:
   an allen Stichtagen ab 2017 sind zwischen 396 und 923 Werte zulässig — der Korb ist immer voll.
3. **Zwei Fenster.** **A:** erster Ausführungstag **04.01.2017** (Stichtag 03.01.2017 = der 253. Panel-Tag, der früheste, an dem die Regel
   rangieren kann) bis Schluss **15.09.2021** — 1.183 Handelstage, 18 volle Perioden und eine angebrochene. **B:** 16.09.2021 bis 15.09.2026
   wie im amtlichen Rückblick.
4. **Die Läufe — genau diese fünf, keine weiteren:**

   | Lauf | Fenster | Korb | Mechanik | Rolle |
   |---|---|---|---|---|
   | **A-187** | A | 187 | wie die App | **die Gegenprobe — Hauptzahl dieses Auftrags** |
   | A-breit | A | alle zulässigen | wie die App | nachrichtlich (das Gegenstück zum amtlichen Rückblick) |
   | **B-187** | B | 187 | wie die App | **zweiter, unabhängiger Lauf** zur Vorab-Rechnung des PM |
   | A-187-gleich | A | 187 | Gleichgewicht | Variante |
   | B-187-gleich | B | 187 | Gleichgewicht | Variante |

   Je Lauf: die Zahl für den ersten Ausführungstag des Fensters (k = 0) **und** die 63 Startphasen (erster Ausführungstag k Panel-Handelstage
   später, k = 0 … 62, Ende gleich), dazu Periodenstreuung für k = 0 (Mittel, Standardfehler, 95-%-Band mit dem t-Wert), größter Rückschlag
   (k = 0 und Spanne über die Phasen), Kalenderjahre, gezahlte Kosten, größtes Gewicht einer Position, Zahl der gehaltenen Werte.
5. **Mechanik „Gleichgewicht" (die eine Variante gegen die Klumpung):** an jedem Ausführungstag werden **alle** Zielwerte auf
   `Depotwert / Zielzahl` gestellt — Übergewichtete werden teilverkauft, Untergewichtete aufgestockt, Nicht-mehr-Ziele ganz verkauft; Verkäufe
   vor Käufen, 20 Basispunkte auf jedes gehandelte Volumen, Depotwert zu Eröffnungskursen. Ein Ziel ohne Eröffnungskurs wird nicht gehandelt
   (wie in `planeUmschichtung`), sein Anteil bleibt Bargeld. Das ist **nicht** die Mechanik der App (sie justiert Gehaltenes nie nach) und wird
   deshalb eigens gerechnet und eigens geprüft; die Zielliste kommt weiter aus `momentumZiel`.
6. **SPY-Ausschüttungen vollständig machen.** Im Maßnahmen-Archiv (`E:/Markt-Dashboard-Archiv/alpaca-massnahmen/SPY.json`, nur lesen) **fehlt
   die Ausschüttung vom 15.06.2018** (2018 stehen drei Sätze, in allen anderen Jahren 2017 bis 2025 vier; vom PM gefunden). Sie wird mit
   **1,2456 $** am Ex-Tag 15.06.2018 ergänzt — im Code als benannte Ergänzung mit diesem Vermerk, nicht in der Datei. Gegenprobe des PM: von
   Schluss 03.01.2017 bis Schluss 15.09.2021 ergibt Panel plus Ausschüttungen mit der Ergänzung +115,95 %, die bereinigte Yahoo-Reihe +115,81 %,
   ohne Ergänzung +114,98 %. Klinke: SPY hat im Fenster A 18 und im Fenster B 20 Ausschüttungen, in jedem vollen Kalenderjahr vier.
   Für die gehaltenen Aktien wird nichts ergänzt; fällt bei einer eine fehlende Quartalszahlung auf, in der Übergabe melden.
7. **Die Sätze, die am Ende stehen (vorher festgelegt):**
   - **Gegenprobe A-187:** „**hält**", wenn bei k = 0 Buch > SPY **und** in mehr als 31 der 63 Startphasen Buch > SPY; „**hält nicht**", wenn
     bei k = 0 Buch < SPY **und** in weniger als 32 Phasen Buch > SPY; sonst „**gemischt**". Dazu immer der Abstand in Pp p. a. (k = 0,
     Minimum / Median / Maximum der Phasen) und der größte Rückschlag.
   - **Zweiter Lauf B-187:** „**bestätigt die Vorab-Rechnung**", wenn bei k = 0 Buch > SPY und der Median der 63 Abstände höchstens 2,0 Pp p. a.
     vom Median der Vorab-Rechnung (+8,25 Pp p. a.) entfernt liegt; sonst „weicht ab" mit Betrag. Hintergrund, damit du nicht nach einem Fehler
     suchst, wo keiner ist: zwei richtige Rechner weichen in einzelnen Phasen um bis zu ±1,7 Pp p. a. voneinander ab, weil einige hundert Dollar
     Bargeld (Zeitpunkt der Gutschrift einer Ausschüttung) entscheiden, ob beim Umschichten ein Wert mehr gekauft wird — deshalb zählt der
     Median, nicht die einzelne Phase. Die Vorab-Rechnung für k = 0: Buch +154,9 %, SPY +81,2 %, Abstand +7,96 Pp p. a.
   - **Variante:** kein Urteilssatz — die beiden Mechaniken nebeneinander (Abstand, Rückschlag, größtes Gewicht, Kosten).
8. **Selbstprüfung vor dem Lauf (Pflicht):** dein Rechner ergibt für den **breiten Korb im Fenster B** mit der Mechanik der App genau die
   amtliche Zahl (Endwert 165.209,66 $ gegen 181.193,87 $) — sonst kein Lauf. Das ist keine sechste Variante.
9. **Ein Lauf.** `REGEL.md` (dieser §1 wörtlich, dazu Fundstellen und deine Lesarten), Code und Tests committen (**Siegel-Commit**), dann die
   fünf Läufe in einem Durchgang, dann Ergebnis committen. Ein Fehler im Code wird benannt, behoben, wiederholt und unter `korrekturen`
   vermerkt. Ein Ergebnis, das nicht gefällt, ist kein Fehler. Kein anderes N, kein anderes Fenster, keine dritte Mechanik.

### §1a Klärungen (nach Zweitleser, bindend — gehören mit in `REGEL.md`)

1. **Korbauswahl, Schritt für Schritt:** (a) `rohMap` für alle Aktienreihen des Panels bilden wie im amtlichen Rückblick; (b) `momentumZiel`
   darauf rufen — sein Ergebnis `rangfolge` enthält genau die zulässigen Werte, je mit `sym` und `umsatz` (Median-Tagesumsatz); (c) diese
   Liste nach `umsatz` absteigend sortieren, bei gleichem Umsatz nach `sym` aufsteigend, die ersten 187 nehmen; (d) eine zweite `rohMap` nur
   mit diesen 187 Reihen bilden und `momentumZiel` **noch einmal** rufen — dessen `ziel` (19 Werte) ist die Zielliste. Meldet schon Schritt (b)
   `zuWenig`, gilt die Regel des Buchs (kein Handel, nächster Tag). Klinke: Schritt (d) meldet genau 187 zulässige Werte.
2. **Gleichstand im Urteilssatz:** „vorn" heißt strikt Buch > SPY (Endwerte). Sind die Endwerte bei k = 0 gleich, zählt das als **nicht** vorn —
   der Satz lautet dann „hält nicht" oder „gemischt" je nach Zahl der Phasen, genau wie bei Buch < SPY.
3. **Die SPY-Ergänzung technisch:** im Leser der Ausschüttungen wird für die Reihe SPY ein Satz `{ ex_date: '2018-06-15', rate: 1.2456 }`
   hinzugefügt, als benannte Konstante im Code mit Vermerk (Grund, Gegenprobe des PM); er gilt in allen Läufen (im Fenster B liegt er außerhalb).
   Steht der Satz eines Tages doch in der Datei, darf er nicht doppelt zählen (Klinke: höchstens ein Satz je Ex-Tag aus der Ergänzung).
4. **„Der 253. Panel-Tag"** ist absolut gezählt: das Panel beginnt am 04.01.2016, sein 253. Handelstag ist der 03.01.2017 — der erste Tag, an
   dem eine Reihe 253 Zeilen haben kann. Vom PM am Panel nachgesehen.
5. **„Größtes Gewicht einer Position":** das Maximum über alle Handelstage des Laufs von (Wert der größten Position zum Schluss) geteilt durch
   (Buchwert zum Schluss).
6. **Startphasen im Fenster A:** erster Ausführungstag k Panel-Handelstage nach dem 04.01.2017 (k = 0 … 62), Ende für alle 15.09.2021;
   p. a. jeweils über die eigene Dauer, wie im amtlichen Rückblick.
7. **Verbrauch:** gemeint ist der Tokenverbrauch deiner Sitzung. Kannst du ihn nicht ablesen, schreibe deine Schätzung und den Satz „Abrechnung
   trägt der PM nach".

### Gemeinsame Regeln des PM für die fünf gleichzeitigen Chats (gehen dem Text oben vor), soweit sie die Abgabe betreffen

Kein Eintrag in `wiki/log.md` (das Log schreibt der PM bei der Abnahme; die Zeilen stehen in der Übergabe unter „Für das Log"). Nur die
Dateien dieses Ordners anfassen und committen, Commit in einem Befehl mit Pfadangabe, kein Push. Platte E: nur lesen, ein Prozess je Lauf.

## Teil B — Fundstellen und gelesene Konstanten

| Größe | Wert | Fundstelle |
|---|---|---|
| Grundregel | Teil A und Teil C des amtlichen Rückblicks | `studien/massstab-rueckblick-2026-10-04/REGEL.md` (Kennung `massstab-rueckblick-2026-10-04/v1`) |
| amtlicher Rechner | `rohMapAm`, `ausschuettungenAm`, `Massnahmen`, `kennzahlen`, `maxRueckschlag`, `kalenderjahre`, `periodenstreuung`, `median`, `tagAb`, `endeBis`, `klinkeReferenz`, `vorbereiten` — von `korb.js` nur gerufen | `studien/massstab-rueckblick-2026-10-04/rueckblick.js` (400 Zeilen) |
| Buch der App | `momentumZiel`, `planeUmschichtung`, `fuehreAus`, `bewerte`, `buchKonfig` — nur gerufen | `mfhandel.js` Z. 29–171 |
| Rückblick / Lücke / Halten / Anteil | 231 / 21 / 63 / 0,1 | `MH.buchKonfig()` (`mfhandel.js` Z. 29–33) |
| Korbregel der App | Median-Tagesumsatz ≥ 100.000.000 $ über 20 Balken, mindestens 100 zulässige Werte; Median = `sortiert[n >> 1]` | `liquide.js` Z. 32–43 |
| `rangfolge[i].umsatz` | `z.umsatz` aus `Li.zulaessig` = Median von Kurs × Stück über die 20 Balken bis zum Stichtag | `mfhandel.js` Z. 81–87, `liquide.js` Z. 48–56 |
| Zielzahl | `max(5, round(Anzahl × 0,1))` — bei 187 Werten 19 | `mfhandel.js` Z. 92 |
| Neukauf / Verkleinern | `round(budget / kurs × 10000) / 10000` Stück; reicht das Bargeld nicht: `floor(bargeld / (kurs × (1 + k)) × 10000) / 10000` | `mfhandel.js` Z. 120 und Z. 144–148 |
| Kosten | 20 Basispunkte je Seite | `mfdepot.js` Z. 158 (Fundstelle des amtlichen Rückblicks), `R.KOSTEN_BP` |
| Reihenende | Hauptregel: Totalverlust bei `insolvenz`, `zwangs-delisting`; nachrichtlich „streng", „milde" | `konfig.js` `EMPFINDLICHKEIT` des Prüfstands |
| Panel | Kennung `querschnitt-pruefstand-2026-09-13/panel/v2.2`; 7.479 Reihen, davon 1 Referenzreihe (`SPY`, Ordner `SPY`); 2.690 Panel-Handelstage; erster Tag 04.01.2016 (Ordnungszahl 0), 03.01.2017 = Ordnungszahl 252 (der 253. Tag), 04.01.2017 = 253, 15.09.2021 = 1435, 16.09.2021 = 1436, letzter Tag 15.09.2026 = 2689 | Struktur-Sonde des Chats vor dem Siegel (nur Aufbau, keine Erträge) |
| Fenster A | 04.01.2017 bis 15.09.2021: 1435 − 253 + 1 = 1.183 Handelstage; Ausführungstage 253 + 63 j, j = 0 … 18 → 19 Perioden, die letzte angebrochen (49 Handelstage) | dieselbe Sonde, Auftrag §1.3 |
| Fenster B | 16.09.2021 bis 15.09.2026: 1.254 Handelstage, 20 Perioden | amtlicher Rückblick |
| Maßnahmen-Datei SPY | Felder `sym, stand, quelle, von, bis, saetze, anwendbar, ohneFaktor`; `von` 2016-01-01, `bis` 2026-12-31; 40 Sätze `cash_dividends`: 2016 drei, 2017 vier, **2018 drei** (16.03., 21.09., 21.12. — der Juni fehlt), 2019 bis 2025 je vier, 2026 zwei | `E:/Markt-Dashboard-Archiv/alpaca-massnahmen/SPY.json` (nur gelesen) |
| SPY-Ergänzung | `{ ex_date: '2018-06-15', rate: 1.2456 }` | Auftrag §1.6, §1a.3; im Code `ERGAENZUNGEN` |
| Selbstprüfung | 165.209,66 $ gegen 181.193,87 $ | Auftrag §1.8 (amtliche Zahl) |
| Vorab-Rechnung des PM | k = 0: Buch +154,9 %, SPY +81,2 %, Abstand +7,96 Pp p. a.; Median der 63 Abstände +8,25 Pp p. a.; Toleranz 2,0 Pp p. a. | Auftrag §1.7; `pm-korb148/ERGEBNIS-KORB.md` (gelesen: nur diese Datei und `REGEL-KORB148.md`) |
| Startkapital / Startphasen / Korb | 100.000 / 63 / 187 | Auftrag §1.1, §1.4, §1.2 |

## Teil C — Lesarten des Codes (vor dem Lauf festgelegt)

1. **Aufbau und Unabhängigkeit.** `korb.js` baut auf dem amtlichen Rechner `rueckblick.js` auf und ruft dessen Funktionen (Teil B); der
   Nachlauf `simuliere` ist dort auf den breiten Korb und die Mechanik der App festgelegt und steht deshalb hier als eigene Fassung mit
   denselben sechs Schritten in derselben Reihenfolge und denselben Ausdrücken, erweitert um Korb und Mechanik. Dass die Fassung für
   „breit / wie die App" dasselbe rechnet, zeigt die Selbstprüfung. `pm-korb148.js` und die JSON-Dateien des PM sind nicht gelesen und
   nicht benutzt. Die Prüfsumme von `rueckblick.js` steht in `ergebnis.json`.
2. **Korbauswahl (§1.2, §1a.1).** Sortiert wird nach `rangfolge[i].umsatz`, wie `momentumZiel` es ausweist, absteigend; bei exakt gleichem
   Umsatz nach `sym` aufsteigend (einfacher Zeichenvergleich). Die zweite `rohMap` enthält die 187 Reihen **in der Reihenfolge des Panels**
   (bei gleicher Stärke entscheidet sie über den Rang, wie im amtlichen Rückblick Lesart C.1). Klinken: der Korb hat genau 187 Namen;
   Schritt (d) meldet `zulaessig` = `geprueft` = 187 und nicht `zuWenig`; die Zielzahl ist 19; keine Referenzreihe im Ziel. Ist der Korb an
   einem Stichtag nicht voll, bricht der Lauf ab und der Fall wird gemeldet (keine Anpassung). Meldet Schritt (b) `zuWenig`, wird nicht
   umgeschichtet und am nächsten Handelstag neu versucht (Regel des Buchs); solche Tage werden gezählt.
3. **Mechanik „Gleichgewicht" (§1.5) im Einzelnen.** *Depotwert* = Bargeld plus alle Positionen **mit** Eröffnungskurs, zu Eröffnungskursen
   (wie `planeUmschichtung`: eine Position ohne Kurs wird gehalten und zählt nicht mit). *Budget* = Depotwert / Zielzahl, wobei die
   Zielzahl die Länge der Zielliste ist (auch Ziele ohne Kurs zählen — ihr Anteil bleibt Bargeld). *Zuerst die Verkäufe:* jede Position mit
   Kurs, die nicht mehr Ziel ist, ganz; jede Zielposition über dem Budget um `(Wert − Budget) / Kurs` Stück. *Dann die Käufe in der
   Reihenfolge der Zielliste:* jedes Ziel mit Kurs unter dem Budget wird um `(Budget − Wert) / Kurs` Stück gekauft oder aufgestockt.
   Stückzahlen auf vier Nachkommastellen gerundet wie in der App; eine Differenz, die auf 0 Stück rundet, wird nicht gehandelt. Reicht das
   Bargeld für einen Kauf nicht, wird er verkleinert wie in `fuehreAus` (abgerundet auf vier Stellen, was das Bargeld samt Kosten trägt) —
   wegen der Kosten trifft das in der Regel den letzten Kauf der Zielliste, genau wie bei der App. Kosten: Verkaufserlös = Volumen × 0,998,
   Kaufpreis = Volumen × 1,002 (20 Basispunkte auf jedes gehandelte Volumen); Klinke: gezahlte Kosten = 0,002 × gehandeltes Volumen.
   Kein Toleranzband, keine Mindestordergröße, keine weitere Optimierung. Reihenende, Ausschüttungen, Bewertung, Perioden wie bei der App.
4. **Ausschüttung und Gleichgewicht.** Anspruch nach der Stückzahl, die über die Nacht vor dem Ex-Tag gehalten wurde (Stückzahl vor dem
   Handel des Tages): ein Aufstocken zur Eröffnung des Ex-Tags zählt nicht mit, ein Teilverkauf zur Eröffnung des Ex-Tags zählt noch —
   dieselbe Lesart wie C.3 des amtlichen Rückblicks; gutgeschrieben wird nach dem Handel des Tages.
5. **Größtes Gewicht (§1a.5)** je Handelstag: größter Positionswert zum Schluss (fehlt die Zeile: letzter Schlusskurs) geteilt durch den
   Buchwert zum Schluss aus `bewerte` (auf Cent gerundet); berichtet wird das Maximum über die Tage für k = 0, dazu nachrichtlich die Spanne
   der Maxima über die 63 Phasen. **Zahl der gehaltenen Werte:** Positionen im Buch nach jeder Umschichtung, kleinste und größte Zahl (k = 0).
6. **SPY-Ergänzung (§1.6, §1a.3).** Schlüssel ist der Ordner der Reihe im Maßnahmen-Archiv (`SPY`; Klinke: der Maßstab liegt in diesem
   Ordner). Der Satz wird nur angehängt, wenn die Datei für denselben Ex-Tag keinen Satz der Art `cash_dividends` führt; je Ex-Tag höchstens
   ein Satz aus der Ergänzung (Klinke). Klinken vor dem Lauf: Ex-Tage nach dem ersten Fenstertag bis zum letzten (so bucht der Maßstab):
   18 im Fenster A, 20 im Fenster B; in jedem Kalenderjahr 2017 bis 2025 vier; kein Ex-Tag mit zwei Sätzen; im Lauf bucht der Maßstab bei
   k = 0 genau 18 und 20. Für Aktien wird nichts ergänzt.
7. **Die Sätze (§1.7, §1a.2)** rechnet der Code auf den ungerundeten Endwerten. „Phasen vorn" zählt alle 63 Phasen, k = 0 eingeschlossen.
   Gegenprobe: „hält" bei k = 0 vorn und mehr als 31 Phasen vorn; „hält nicht" bei k = 0 nicht vorn (auch Gleichstand) und weniger als 32
   Phasen vorn; sonst „gemischt". Zweiter Lauf: „bestätigt die Vorab-Rechnung" bei k = 0 vorn und |Median − 8,25| ≤ 2,0 (Grenze
   eingeschlossen); sonst „weicht ab", genannt wird Median − 8,25 in Pp p. a. und, falls das Buch bei k = 0 nicht vorn liegt, auch das.
   Die Variante bekommt keinen Satz.
8. **Je Lauf (§1.4):** k = 0 mit der Hauptregel für Reihenenden; die 63 Startphasen (jede mit eigener Dauer für p. a., Ende gleich), je
   Phase Abstand, „vorn", größter Rückschlag und größtes Gewicht; Periodenstreuung für k = 0 über alle Perioden einschließlich der
   angebrochenen (Fenster A: 19 Perioden, t = 2,101; Fenster B: 20, t = 2,093); Kalenderjahre (2021 ist zwischen den Fenstern geteilt);
   Kosten als Wert zu Eröffnungskursen vor minus nach dem Handel. Nachrichtlich für k = 0 wie im amtlichen Rückblick (dort C.7): reiner
   Kursertrag beider Seiten, Reihenenden „streng" und „milde". Das sind Lesarten desselben Laufs, keine weiteren Läufe.
9. **Selbstprüfung (§1.8).** `korb.js` rechnet vor den fünf Läufen den breiten Korb im Fenster B mit der Mechanik der App für k = 0 und
   vergleicht die auf Cent gerundeten Endwerte mit 165.209,66 $ und 181.193,87 $; bei Abweichung bricht es ab. `test.js` vergleicht zusätzlich
   jeden der 1.254 Tageswerte (Buch, SPY, Bargeld) mit `simuliere` des amtlichen Rechners.
10. **Diagnosen, die keine Zahl ändern** (für die Übergabe): Reihenenden mit Grund und Merkmal „als lebend geführt"; Ziele und Positionen ohne
    Kurs bei der Umschichtung; Positionen ohne Maßnahmen-Datei; Dateien, deren `von` nach dem Kauftag liegt; jede gebuchte Ausschüttung mit
    einem Satz über 15 % des Vortageskurses einzeln (gezählt wird sie trotzdem — nichts wird gefiltert, wie im amtlichen Rückblick C.4);
    mögliche fehlende Quartalszahlungen gehaltener Reihen nach einer Heuristik (Reihen mit mindestens 8 Ex-Tagen im Panel und einem
    Median-Abstand von 80 bis 100 Kalendertagen: gemeldet wird ein Abstand über 150 Tage, der eine Haltezeit schneidet — ein Hinweis, kein Befund).
11. **Nicht behoben, nur genannt** (Auftrag §4): bekannte Mängel des Panels (Nr. 72: abgegangene Werte als lebend ohne Ende-Grund;
    Kürzel-Umbenennungen enden als Reihe). Fälle im Buch stehen in `ergebnis.json` unter `reihenenden` und in der Übergabe.

## Teil D — Prüfungen vor dem Lauf (`test.js`, 169 Prüfungen, vor dem Siegel grün)

- **Übernommen** aus dem amtlichen Rückblick, gegen diesen Rechner gefahren: Grundfall von Hand (Periode, Kosten, nicht gehandelte
  Position, angebrochene Periode), Reihenende mit Wert 0 und letztem Kurs, `zuWenig`, Ausschüttung im Buch und beim Maßstab, kein Blick
  voraus mit Gegenprobe, Referenzreihe nie im Ziel, die beiden Kunstfälle (SPY-gleich, Vorsprung), Rechenregeln des Zufallsbereichs,
  `rohMap` am echten Panel an einem Stichtag und 30 Werten.
- **Korbauswahl** am Kunstpanel (die N umsatzstärksten; exakter Gleichstand nach Name; genau N zulässige in Schritt (d); kein Wert unter
  der Schwelle bei kleinem N und kein Auffüllen bei zu großem N; Median = oberer der beiden mittleren; ein starker, aber umsatzschwacher
  Wert fehlt im Ziel) und am echten Panel am Stichtag 03.01.2017 (alle zulässigen Werte ohne `momentumZiel` aus den Panel-Zeilen
  nachgerechnet: dieselben 187 in derselben Reihenfolge; fünf Werte mit demselben Median-Umsatz; der 188. liegt darunter).
- **Mechanik Gleichgewicht** von Hand: Teilverkauf eines Gewinners, Aufstocken, Neukauf, Kosten auf jedes Volumen, gehaltenes Ziel ohne
  Kurs, neues Ziel ohne Kurs (Anteil bleibt Bargeld), Ausschüttung am Umschichtungstag nach der Stückzahl über die Nacht, kein Handel unter
  der Stückelung; Gegenstück mit der Mechanik der App auf derselben Tafel; größtes Gewicht von Hand.
- **Fenster A** am echten Panel (04.01.2016 / 03.01.2017 = 253. Tag / 04.01.2017 / 15.09.2021 / 1.183 Tage / 18 volle Perioden und eine
  angebrochene; kein Wert mit weniger als 253 Zeilen in Korb und Ziel).
- **SPY-Ergänzung:** am Kunstpanel genau einmal gebucht (fehlt in der Datei / steht in der Datei); am echten Archiv 18 und 20, je Jahr
  vier, ohne Ergänzung 17 und 2018 nur drei; Gegenprobe des PM getroffen (+115,95 % mit, +114,98 % ohne).
- **Kein Blick voraus für die Korbauswahl** mit zwei Gegenproben.
- **Die Sätze aus §1.7:** ein Kunstpanel, das „hält" ergibt (63 von 63 Phasen vorn), eines, das „hält nicht" ergibt (0 von 63), dazu die
  Grenzen (31/32 Phasen, Gleichstand, Median 8,25 ± 2,0) und ein Trockenlauf des ganzen Berichts am Kunstpanel.
- **Selbstprüfung** (§1.8) auf den Cent und Tag für Tag gegen den amtlichen Rechner.
