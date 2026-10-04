# REGEL — Kleinstpositionen im Momentum-Buch abstellen: die Rückblicke mit Regel K nachrechnen (Auftrag Nr. 85, Schritt 2)

Kennung `momentum-korb-kleinst-2026-10-04/v1`. Diese Datei ist **vor dem Lauf** geschrieben und mit Laufskript (`kleinst.js`) und Tests
(`test.js`) zusammen committet (Siegel). Teil A ist §1, §3 und der Nachtrag §6 des Auftrags
`uebergabe/auftrag-kleinstpositionen-2026-10-04.md`, **wörtlich** und unverändert (der Nachtrag geht dem übrigen Text vor). Teil B nennt
die Fundstellen. Teil C hält fest, wie Code und Zähler die Stellen lesen, die Teil A offen lässt. Teil D nennt die Prüfungen. Nach dem
Siegel wird an A, B und C nichts mehr geändert; was nicht geht, wird gemeldet, nicht angepasst.

Beschreibende Zahlen nach vorher festgelegter Regel — kein Urteil über das Buch und keines über eine Kante. Alles Simulation mit
virtuellem Kapital, keine Anlageberatung.

## Teil A — die Regel, wörtlich

### §1 Die Regel K (vom PM festgelegt — nicht ändern; was nicht geht, melden statt anpassen)

- **K1 — kein Kleinstkauf.** `fuehreAus(buch, plan, nowMs, kostenBp, opts)`: ist `opts.kleinstAnteil > 0` und liegt der Wert eines
  Kaufs **nach** dem Verkleinern (`o.stueck × o.kurs`) unter `opts.kleinstAnteil × o.budget`, wird er **nicht** ausgeführt (keine
  Position, kein Eintrag in `trades`, `o.stueck = 0`). Ein Kauf ohne `o.budget` ist von K1 nicht betroffen.
- **K2 — ein Kleinstbestand gilt nicht als gehalten.** `planeUmschichtung(ziel, buch, preise, opts)`: ist `opts.kleinstAnteil > 0`, so
  ist eine gehaltene Position mit Kurs, deren Wert unter `opts.kleinstAnteil × (wert / ziel.length)` liegt, ein Kleinstbestand: sie kommt
  in `verkaufen` (wird ganz verkauft), und ist ihr Wert ein Ziel, wird er wie ein nicht gehaltenes Ziel in `kaufen` geplant — an seiner
  Stelle in der Rangfolge der Zielliste. `wert` (Depotwert zu den Kursen des Plans) bleibt definiert wie bisher. Eine Position ohne Kurs
  bleibt, wie sie ist. Die Rückgabe nennt die Kleinstbestände zusätzlich in einem neuen Feld `kleinst: [sym…]`.
- **Schalter:** ohne `opts` oder mit `kleinstAnteil` 0 verhalten sich beide Funktionen **zeichengleich wie heute** (Vorgabe aus).
  `buchKonfig()` bekommt das Feld `kleinstAnteil: 0` mit Kommentar (Wert für die App nach der Abnahme: 0,05). `mfdepot.js` wird in
  diesem Auftrag **nicht** geändert.
- **Maß:** 5 % (`kleinstAnteil = 0,05`) in der Nachrechnung. Keine anderen Werte ausprobieren.

### §3 Schritt 2 — Nachrechnung (Regel vor der Zahl)

Neuer Ordner `studien/momentum-korb-kleinst-2026-10-04/`. Gerechnet wird mit dem **Rechner aus Nr. 78** (`korb.js`, unverändert, per
`require`) und dem **Handelscode der App mit eingeschalteter Regel**: dein Laufskript hängt sich vor dem Laden von `korb.js` an
`mfhandel.planeUmschichtung` und `mfhandel.fuehreAus` und reicht `{ kleinstAnteil: 0.05 }` durch (eine Hülle, die nur das Argument
ergänzt — die Funktionen selbst sind die aus Schritt 1). **Selbstprüfung (Pflicht, sonst kein Lauf):** mit `kleinstAnteil` 0 ergibt
dieselbe Hülle für k = 0 genau die Endwerte aus `studien/momentum-korb-2026-10-04/ergebnis.json` (A-187, A-breit, B-187) und
165.209,66 $ gegen 181.193,87 $ für den breiten Korb im Fenster B.

**Die Läufe — genau diese vier:** A-187, A-breit, B-187, B-breit (alle Mechanik der App; die Variante „Gleichgewicht" benutzt
`fuehreAus` nicht und wird nicht nachgerechnet). Je Lauf k = 0 und die 63 Startphasen, je **ohne** und **mit** Regel K. Dazu je Lauf,
über alle 63 Phasen: geplante Käufe voll / verkleinert (5–95 % des Budgets) / Kleinstkauf (unter 5 %) / ausgefallen; verkaufte und neu
gekaufte Kleinstbestände; Zahl der gehaltenen Werte (von–bis); gezahlte Kosten.

**Die Sätze, die am Ende stehen (vorher festgelegt):** je Lauf „Mit Regel K: Abstand p. a. bei k = 0 … (ohne: …), … von 63 Startphasen
vorn (ohne: …), Median … Pp p. a. (ohne: …), größter Rückschlag … % (ohne: …); Kleinstkäufe 0 (ohne: …), ausgefallene Käufe … (ohne:
…)." **Prüfmarke für das Einschalten in der App (Regel des PM):** liegt in **keinem** der vier Läufe der Median der 63 Abstände mit
Regel K um mehr als 2,0 Pp p. a. **unter** dem Median ohne Regel, lautet der Schlusssatz „Regel K kann in die App"; sonst „Regel K
verschlechtert den Rückblick — der PM fragt Wilhelm". Kein Urteil über das Buch, keine Wörter „belegt" oder „bestätigt".

**Ablauf:** `REGEL.md` (§1 und §3 wörtlich, dazu deine Lesarten), Laufskript, `test.js` (Hülle reicht den Schalter durch; Selbstprüfung;
mit Regel K entsteht in keinem Lauf ein Kauf unter 5 % des Budgets; Zähler an einem Kunstfall von Hand) → **Siegel-Commit 2** → der eine
Lauf → `ergebnis.json`, `ERGEBNIS.md` (eine Seite: Schlusssatz, die vier Sätze, eine Tabelle ohne/mit) → **Commit 3**. Ein Fehler im Code
wird benannt, behoben, wiederholt und unter `korrekturen` vermerkt; ein Ergebnis, das nicht gefällt, ist kein Fehler.

### §6 Nachtrag des PM nach dem Zweitleser (04.10.2026) — geht dem Text oben vor

**6.1 Die Hülle wirkt — vom PM geprüft.** `require` gibt jedem Aufrufer dasselbe Modulobjekt, und der Rechner ruft die Funktionen zur
Laufzeit über dieses Objekt. Der PM hat am 04.10.2026 `mfhandel.fuehreAus` vor dem Laden von `korb.js` durch eine zählende Hülle ersetzt:
jeder Kauf aller 63 Phasen lief hindurch, die Endwerte blieben auf den Cent die aus `ergebnis.json`. Für `planeUmschichtung` weist
`test.js` dasselbe nach (die Hülle zählt ihre Aufrufe; Zahl = Zahl der Umschichtungen des Laufs).

**6.2 Woher die Zahlen „ohne Regel" kommen.** Aus **deinem** Lauf mit `kleinstAnteil` 0 — alle 63 Phasen je Lauf werden zweimal
gerechnet, ohne und mit Regel. Die Selbstprüfung hält nur k = 0 gegen die alten Dateien: A-187, A-breit, B-187 gegen
`studien/momentum-korb-2026-10-04/ergebnis.json` (`laeufe[<Name>].haupt.buchEnde` und `.spyEnde`); B-breit gegen `selbstpruefung.buchEnde`
(165.209,66) und `.spyEnde` (181.193,87 — der Endwert des S&P 500 im Fenster B) in derselben Datei.

**6.3 „Kauf ohne `budget`" (K1).** `planeUmschichtung` setzt `budget` immer. K1 greift genau dann, wenn `o.budget > 0` ist; ein Kauf mit
fehlendem oder nicht positivem `budget` (ein anderer Aufrufer, eine leere Zielliste) läuft wie heute.

**6.4 Das neue Feld `kleinst`** in der Rückgabe von `planeUmschichtung` braucht in diesem Auftrag nur dein Zähler; die App liest es erst
im nächsten Auftrag (Anzeige im Journal des Buchs).

**6.5 Start:** dieser Auftrag beginnt erst, wenn der Studien-Chat Nr. 82 fertig ist (er lädt `mfhandel.js` bei jedem Lauf) — der PM
startet dich entsprechend; du musst darauf nicht achten.

## Teil B — Fundstellen und gelesene Konstanten

| Größe | Wert | Fundstelle |
|---|---|---|
| Handelscode mit Regel K (Schritt 1) | `buchKonfig` (Feld `kleinstAnteil: 0`), `planeUmschichtung(ziel, buch, preise, opts)`, `fuehreAus(buch, plan, nowMs, kostenBp, opts)` | `mfhandel.js` Z. 29–40, Z. 104–150, Z. 152–191 (Commit `157b5dd`) |
| K2 im Code | `p.stueck * k < kl * budget` mit `budget = wert / ziel.length` | `mfhandel.js` Z. 129–137 |
| K1 im Code | `kl > 0 && o.budget > 0 && o.stueck * o.kurs < kl * o.budget` → `o.stueck = 0; return` — nach dem Verkleinern | `mfhandel.js` Z. 183 |
| Tests zu Schritt 1 | Abschnitt 95, 35 Prüfungen, davon sechs Gegenproben | `test-v6.js` Z. 22490–22840 |
| Rechner aus Nr. 78 | `simuliere`, `startphasen`, `zielAm`, `Massnahmen`, `dateiLeser`, `fensterTage`, `spyKlinken`, `ERGAENZUNGEN`, `KORB_N`, `FENSTER` — nur gerufen | `studien/momentum-korb-2026-10-04/korb.js` (583 Zeilen, unverändert) |
| amtlicher Rechner | `kennzahlen`, `maxRueckschlag`, `median`, `vorbereiten`, `PHASEN`, `KOSTEN_BP`, `START` — nur gerufen | `studien/massstab-rueckblick-2026-10-04/rueckblick.js` |
| Regel der Läufe | Fenster A 04.01.2017–15.09.2021 (1.183 Handelstage), Fenster B 16.09.2021–15.09.2026 (1.254); Korb 187 oder alle zulässigen; 20 Basispunkte je Seite; Startkapital 100.000; 63 Startphasen; Reihenenden nach der Hauptregel; Ausschüttungen mit der SPY-Ergänzung | `studien/momentum-korb-2026-10-04/REGEL.md` Teil A und C |
| Sollwerte der Selbstprüfung | A-187 257.543,65 $ / 215.535,73 $; A-breit 316.042,41 $ / 215.535,73 $; B-187 254.875,85 $ / 181.193,87 $; B-breit 165.209,66 $ / 181.193,87 $ (Buch / S&P 500) | `studien/momentum-korb-2026-10-04/ergebnis.json` → `laeufe[…].haupt`, `selbstpruefung` |
| Zählung des PM ohne Regel | A-187: 1.183 Umschichtungen, 1.070 mit zu wenig Bargeld, 10.106 voll, 983 verkleinert, 318 Kleinstkäufe, 1.064 ausgefallen; A-breit: 1.183 / 1.137 / 24.170 / 1.021 / 705 / 6.554; B-187: 1.254 / 1.123 / 10.051 / 1.043 / 466 / 1.993 | `wiki/belegstand.md`, Abschnitt „Rückblick über fünf Jahre", Nachtrag Nr. 78 („Fund des PM bei dieser Abnahme") |
| Kosten im Aufruf der App | `MH.fuehreAus(d.mfBuch, plan, now, 20)`; `planeUmschichtung` zweimal mit drei Argumenten — die App reicht den Schalter nicht durch | `mfdepot.js` Z. 162, 165, 184 (unverändert) |

## Teil C — Lesarten (vor dem Lauf festgelegt)

1. **Der Schalter und „zeichengleich".** Aus ist die Regel ohne `opts`, mit `{}`, `null`, `kleinstAnteil` 0, negativ oder keine Zahl.
   Dann trägt die Rückgabe von `planeUmschichtung` **kein** Feld `kleinst` — sie ist Zeichen für Zeichen die alte. Bei eingeschalteter
   Regel steht `kleinst` immer da, als Liste (auch leer). `test-v6.js` 95.1 hält beide Funktionen ohne Schalter gegen die eingefrorene
   Fassung vor Nr. 85 (bestehende Fälle, Kleinstkauf von Hand, 400 Zufallsfälle).
2. **K2 — Platzwert, Schwelle, Depotwert.** Platzwert = `wert / ziel.length`, genau die Zahl, die der Plan als `budget` in jeden Kauf
   schreibt. `wert` = Bargeld + alle Positionen **mit** Kurs zu den Kursen des Plans; ein Kleinstbestand zählt mit, wie bisher. „Unter"
   heißt echt kleiner: eine Position mit genau 5 % des Platzwerts bleibt gehalten. Bei leerer Zielliste ist der Platzwert 0 (wie `budget`
   im Code): dann heißt nichts Kleinstbestand, und alles mit Kurs wird verkauft wie immer.
3. **K2 — das Feld `kleinst` und die Reihenfolgen.** `kleinst` nennt **alle** Kleinstbestände in der Reihenfolge der Positionen — auch
   den eines Nicht-Ziels (er wird ohnehin verkauft). In `verkaufen` steht ein Kleinstbestand an der Stelle seiner Position, in `kaufen`
   an der Stelle seines Rangs in der Zielliste (nicht am Ende). Ein Ziel, das Kleinstbestand war, wird mit dem vollen Platzwert geplant.
4. **K1 — was geprüft wird.** Jeder Kauf mit `o.budget > 0`, nach dem Schritt des Verkleinerns (auch ein Kauf, der nicht verkleinert
   wurde): fällt weg, wenn `o.stueck × o.kurs < kleinstAnteil × o.budget` („unter" heißt echt kleiner; genau 5 % wird ausgeführt). Wegfall
   heißt: `o.stueck = 0`, keine Position, kein Trade, das Bargeld bleibt, die Rückgabe zählt ihn nicht als Ausführung. Die folgenden
   Käufe sehen dasselbe Bargeld.
5. **Die Hülle.** `kleinst.js` ersetzt `mfhandel.planeUmschichtung` und `mfhandel.fuehreAus` vor dem Laden von `korb.js` durch eine
   Hülle, die die Funktionen der App mit dem zusätzlichen Argument `{ kleinstAnteil: … }` ruft — **dieselbe** Hülle für „ohne" (0) und
   „mit" (0,05) — und dabei mitzählt. Sie ändert kein Ergebnis: `test.js` hält die Hülle gegen den direkten Aufruf der App-Funktionen
   (zeichengleich). Klinken der Hülle (Abbruch des Laufs): kein gesetzter Schalter; das Feld `kleinst` passt nicht zum Schalter; die
   eigene Zählung der Kleinstbestände weicht vom Feld `kleinst` ab; das Schritt für Schritt mitgerechnete Bargeld ist nicht auf das Bit
   das des Buchs; **mit Regel K entsteht ein Kauf unter 5 % des Platzwerts**; ohne Regel fällt ein bezahlbarer Kauf aus; die Hülle wird
   nicht genau einmal je Umschichtung gerufen (planen und ausführen); die mitgezählten Kosten weichen von denen des Rechners ab.
6. **Die vier Läufe.** A-187, A-breit, B-187, B-breit — Fenster, Korb, Mechanik der App, Reihenenden nach der Hauptregel, Ausschüttungen
   mit SPY-Ergänzung, Kosten 20 Basispunkte je Seite: alles wie in Nr. 78, mit dessen Rechner. Je Lauf und Fassung (erst ohne, dann mit):
   k = 0 mit `simuliere`, dann die 63 Startphasen mit `startphasen` (Phase 0 ist k = 0; Klinke: derselbe Abstand). Die Zielliste eines
   Stichtags hängt nicht vom Buch ab und wird vom Rechner je Stichtag einmal gebildet — beide Fassungen sehen dieselben Ziele. **Nicht**
   gerechnet werden die nachrichtlichen Lesarten aus Nr. 78 (reiner Kursertrag, „streng", „milde"), Periodenstreuung und Kalenderjahre:
   der Auftrag verlangt sie nicht. Sonst ändert Regel K nichts: Gehaltenes wird nicht aufgestockt, Gewinner werden nicht gestutzt.
7. **Die Zähler** (je Lauf und Fassung, summiert über alle Umschichtungen der 63 Startphasen; dazu dieselben für k = 0 allein). Jeder
   **geplante Kauf** (Eintrag in `plan.kaufen`) wird nach der Ausführung genau einmal eingeordnet, nach seinem Wert `o.stueck × o.kurs`
   gegen den Platzwert `o.budget`: **voll** ab 95 %; **verkleinert** von 5 % bis unter 95 %; **Kleinstkauf** über 0 und unter 5 % (derselbe
   Vergleich wie K1); **ausgefallen** bei `o.stueck = 0` — getrennt nach „mangels Bargeld" (auch 0,0001 Stück waren nicht bezahlbar) und
   „nach K1" (es wären Stücke bezahlbar gewesen). Ein Kauf, der wegen der Kosten nur 98 % des Platzwerts erreicht, zählt damit als voll.
   **Mit zu wenig Bargeld:** Umschichtungen, bei denen mindestens ein Kauf nicht mit der geplanten Stückzahl ausgeführt wurde.
   **Kleinstbestände:** gehaltene Positionen mit Kurs unter 5 % des Platzwerts bei der Planung, von der Hülle selbst gezählt (ohne Regel:
   die eines Ziels gelten als gehalten; mit Regel: **verkauft**), **neu gekauft** = der Kauf des Ziels wurde ausgeführt. **Gehaltene
   Werte:** Positionen im Buch nach der Umschichtung, kleinste bis größte Zahl. Dazu **leere Plätze:** Ziele, zu denen das Buch nach der
   Umschichtung keine Position von mindestens 5 % des Platzwerts hält (eine Zielposition ohne Kurs gilt als besetzt). **Kosten:**
   0,002 × gehandeltes Volumen (Verkäufe und Käufe); für k = 0 die Zahl des Rechners, über die Phasen das Mittel.
8. **Die Sätze.** Je Lauf der Wortlaut aus §3. „Abstand p. a. bei k = 0" und „größter Rückschlag" stammen aus k = 0 (Rückschlag des
   Buchs auf den Tagesschlusswerten); „von 63 Startphasen vorn" zählt strikt Endwert Buch > Endwert S&P 500, k = 0 eingeschlossen;
   „Median" ist der Median der 63 Abstände in Pp p. a.; „Kleinstkäufe" und „ausgefallene Käufe" sind die Zähler über alle 63 Phasen.
   Zahlen auf zwei Nachkommastellen (Rückschlag eine), gerechnet wird ungerundet.
9. **Die Prüfmarke.** Je Lauf Median ohne minus Median mit, ungerundet. Ist die Differenz in mindestens einem der vier Läufe **größer**
   als 2,0 Pp p. a., lautet der Schlusssatz „Regel K verschlechtert den Rückblick — der PM fragt Wilhelm"; sonst (auch bei genau 2,0)
   „Regel K kann in die App". Der Schlusssatz ist die Marke für das Einschalten, kein Urteil über das Buch.
10. **Selbstprüfung.** Vor den Läufen rechnet `kleinst.js` alle vier Läufe für k = 0 mit `kleinstAnteil` 0 durch die Hülle und hält
    Buch und S&P 500 auf den Cent gegen die Sollwerte (Teil B; gelesen aus `ergebnis.json` von Nr. 78, Klinke auf 165.209,66 $ und
    181.193,87 $). Trifft einer nicht, gibt es keinen Lauf.
11. **Vergleiche, nachrichtlich (keine Klinke, kein Abbruch).** (a) Die 63 Abstände ohne Regel gegen die alten Ergebnisdateien (A-187,
    A-breit, B-187: Nr. 78; B-breit: amtlicher Rückblick Nr. 74) — Zahl der gleichen und größte Abweichung. (b) Die eigene Zählung ohne
    Regel gegen die Tabelle des PM (Teil B). Eine Abweichung wird gemeldet, nicht angeglichen; die Definitionen in Punkt 7 stehen fest.
12. **Was nicht geprüft wird.** Keine zweite Kursquelle, keine Sprung-Durchsicht, keine Änderung an Panel, Korb oder Fenster — das
    gilt wie in Nr. 78. Die 63 Startphasen teilen sich dieselben Jahre; der Vergleich ohne/mit ist ein Vergleich zweier Mechaniken auf
    denselben Daten, kein Nachweis für oder gegen das Buch.

## Teil D — Prüfungen vor dem Lauf (`test.js`, 80 Prüfungen, vor dem Siegel grün)

- **Teil I — Hülle und Zähler von Hand:** die Hülle sitzt auf dem Modulobjekt des Rechners; ohne Schalter rechnet sie nicht; mit
  Schalter aus und an ist sie zeichengleich zum direkten Aufruf der App-Funktionen (drei Handfälle); K1 und K2 kommen an; alle Zähler an
  drei Handfällen (Kleinstkauf, Kleinstbestand arm und reich) von Hand; fünf Klinken schlagen an (Kleinstkauf trotz Regel, fehlendes
  Feld, übersehener Kleinstbestand, ausgefallener Kauf ohne Regel, Ausführung ohne Plan).
- **Teil II — Kunstpanel durch den Rechner aus Nr. 78:** 102 Kunstaktien, zwei Umschichtungen, ohne und mit Regel von Hand gerechnet
  (Endwert, Bargeld, Stückzahlen, alle Zähler, Kosten); die Hülle je Umschichtung genau einmal gerufen; ein ganzer Lauf mit 63 Phasen
  (74 Umschichtungen): mit Regel K in keiner Phase ein Kauf unter 5 % des Platzwerts, ohne Regel gibt es sie (Gegenprobe).
- **Teil III — Sätze und Prüfmarke:** Grenzen der Prüfmarke (1,99 / genau 2,0 / 2,004 / 2,01 Pp; ein Lauf von vieren; negative
  Mediane); der Satz im Wortlaut; Trockenlauf des Berichts am Kunstpanel (Schlusssatz, vier Sätze, eine Tabelle, keines der
  Urteilswörter, unter 60 Zeilen).
- **Teil IV — echtes Panel, nur ohne Regel, nur k = 0:** die vier Endwerte der Selbstprüfung auf den Cent; die Hülle wird je
  Umschichtung genau einmal gerufen (19 im Fenster A, 20 im Fenster B, planen und ausführen). Mit eingeschalteter Regel wird am echten
  Panel vor dem Siegel nichts gerechnet.
