# VORREGISTRIERUNG — Ergebnis-Drift tagesgenau: fünf Jahre, Stufe 1 (Mühle) und Stufe 2 (Buch gegen den S&P 500)

Kennung `vorregistrierung-2026-10-04-ergebnis-drift/v1`. Auftrag Nr. 88 vom 04.10.2026 (Wilhelms Entscheid „Messen nach deiner Regel").
**Registriert mit dem Siegel-Commit dieses Ordners — bevor ein Skript die Überraschung mit einem Ertrag zusammengebracht hat.** Bis zum
Siegel wurde ohne Überraschung gerechnet: an Kunstdaten und mit einer Zufallszahl an ihrer Stelle (`lauf.js --blind`, `blind.json`).
Grundlage: Machbarkeit Nr. 80 (`studien/ergebnis-drift-ereignis-2026-10-04/`) und ihr Entwurf; die dort offenen Fragen (§12) hat der PM
entschieden. Teil A ist die Regel, Teil B sind die blind nachgerechneten Zahlen, Teil C die Lesarten des Codes an den Stellen, die die
Regel offen lässt. Nach dem Siegel wird an A, B und C nichts geändert. Simulation mit virtuellem Kapital, keine Anlageberatung.

## Teil A — die Regel (vom PM festgelegt; nichts davon wird gewählt oder nachjustiert)

**A1 Frage.** Steigen US-Aktien der Umsatzklassen 50-250, 250-1000 und ab1000 in den Handelstagen nach einer Quartalsmeldung (8-K Punkt
2.02), deren Überraschung im obersten Zehntel liegt, stärker als (A) Aktien mit einer Überraschung im untersten Zehntel und (B) der
Durchschnitt ihrer Umsatzklasse am selben Tag — bleibt (B) nach Kosten übrig, und schlägt ein Buch, das nur die Kaufseite handelt, über
die letzten fünf Jahre nach Kosten den S&P 500?

**A2 Daten und Ereignisse — eingefroren.** Auszug `meldungen-202.tsv` der Machbarkeit, Bilanz-Tafel `fundamentaltafel-2026-09-16/v1.1`,
Panel `querschnitt-pruefstand-2026-09-13/panel/v2.2` (bis 15.09.2026). SHA-256:

| Eingabe | Prüfsumme |
|---|---|
| Auszug `meldungen-202.tsv` | `5a905ea6b22a7197691296cf722c20c91d6a224fe8a0922b4bb022b476741de3` |
| Tafel (14 Dateien: `_reihen.json`, `tafel-2014…2026.jsonl`; Summe über „Name:SHA-256"-Zeilen) | `1991468103346ffe44a3fdeaca021a454615c4c0adfd4692231b9bc0b7eea6df` |
| Panel (12 Dateien: `_stand.json`, `2016…2026.bin`; ebenso) | `a1349bfe88883cf8874c6eb42e9839f40cf11578be63f075073fbf0647d08324` |

Die Ereignismenge ist die der Machbarkeit (`rechnen.js`, dieselben Schritte in derselben Reihenfolge, über `ereignisse.js` gerufen):
Hauptmeldung nach `zuordnung.js` mit Überraschung nach `ueberraschung.js`, Einstiegstag nach `zeit.js`, Reihe und Universum des
Prüfstands am Handelstag vor dem Einstieg. Ein Ereignis gibt es nur, wo eine Tafelzeile und eine Panel-Zeile da sind; nichts wird
zusätzlich ausgeschlossen oder ergänzt. Erwartet und blind gezählt: **25.298 Ereignisse** der Hauptklassen. Die Klasse 5-50 ist nicht
Teil der Messung. **Benannte Lücken:** das Jahr 2016, die 203 Firmen mit Kennungswechsel (darunter XOM), ausländische Werte ohne 8-K,
861 Meldungen an getrennten Reihen.

**A3 Signal.** Überraschung = `(netto D0 − netto D4) / sd(netto D0…D7)` der zugeordneten Tafelzeile. **Zehntel punkt-in-zeit:**
Vergleichsmenge sind die Überraschungen aller Ereignisse mit Einstiegstag in den 63 Handelstagen **vor** dem Einstiegstag (mindestens
200, sonst kein Signal); oberstes Zehntel = Wert ≥ 90. Perzentil dieser Menge, unterstes = Wert ≤ 10. Perzentil. Nichts gekappt, keine
weiteren Filter, keine Varianten.

**A4 Einstieg, Haltedauer, Kosten.** Kauf zur Eröffnung des Einstiegstags (Annahme der 8-K vor 09:30:00 New York → derselbe Handelstag,
sonst der nächste), Verkauf zur Eröffnung H Handelstage später. **Hauptgröße H = 60, zweite Größe H = 20**; über das Urteil entscheidet
allein H = 60, H = 20 kann es weder retten noch kippen. Reihenende im Haltefenster wie im Prüfstand (Insolvenz und Zwangs-Delisting =
Totalverlust, sonst letzter Kurs). Kosten je Umlauf **0,210 / 0,134 / 0,081 Pp** für die Klassen 50-250 / 250-1000 / ab1000 (Klasse am
Handelstag vor dem Einstieg).

**A5 Fenster.** **Messfenster: Einstiegstage vom 16.09.2021 bis 15.09.2026.** Für die Größen der Stufe 1 gehen nur Ereignisse ein, deren
Haltefenster (H Tage) bis zum 15.09.2026 abgeschlossen ist. Die Ereignisse mit Einstiegstag in den 63 Handelstagen vor dem 16.09.2021
liefern nur ihre Überraschung für die Vergleichsmenge — ihr Ertrag wird nicht gebildet. **Einstiegstage vom 03.01.2017 bis 15.09.2021
bleiben verschlossen:** für sie wird in diesem Auftrag kein Ertrag mit der Überraschung zusammengebracht, auch nach dem Lauf wird für
diese Jahre nichts gerechnet oder berichtet (kein „zweiter Blick"; der entsprechende Satz des Entwurfs §8 entfällt). Im Code trägt ein
Ereignis vor dem Fenster nie einen Ertrag (`ereignisse.js`, Klinke in `messung.js`).

**A6 Stufe 1 — die Größen.** Kontrolle als Erwartung: das Mittel desselben Ertrags über alle Universumswerte derselben Klasse am selben
Tag; bereinigter Ertrag = Ertrag − Kontrolle. Schätzer: **Ereignis-Mittel** (jede Meldung gleich gewichtet). **A** = Mittel(oberstes
Zehntel) − Mittel(unterstes Zehntel); **B** = Mittel(oberstes Zehntel); **B netto** = B minus Kosten der Klasse; **M** = Mittel aller
Melder; **B − M**. Standardfehler: der größere aus 200 Zufalls-Zuteilungen (fester Startwert) und der Tagesreihe (Newey-West, Lag
H − 1); t = Größe / Fehler. **Tor: t ≥ 2,5 bei H = 60 für A und für B netto.** Die Projektregel „Entdeckung ≥ 4 × Bestätigungs-MDE"
gilt für diese Studie nicht (in der Machbarkeit am erwarteten Fall geprüft: unpassierbar); an ihre Stelle tritt Teil B.
- **Placebo ohne Kursbezug:** die letzte Ziffer der Akzessionsnummer als „Überraschung" (9 = oben, 0 = unten). Soll: A und B − M
  innerhalb von ±2 eigenen Standardfehlern.
- **Positivkontrolle:** ein eingepflanzter Abstand in Höhe der MDE muss in mindestens 65 % der Zufallsläufe t ≥ 2 erreichen.
- **Abbruch ohne Urteil**, wenn: (1) das Placebo außerhalb ±3 eigener Fehler liegt; (2) die Positivkontrolle unter 65 % bleibt; (3) die
  Ereigniszahl um mehr als 1 % von 25.298 abweicht; (4) ein Skript die Überraschung vor dem Siegel mit einem Ertrag zusammengebracht hat;
  (5) Tafel oder Panel eine andere Kennung (oder Prüfsumme) tragen. Kein Nachjustieren von Zehntel-Grenzen, Haltedauer, Klassen, Schätzer.
- **Urteil der Stufe 1:** **„belegt"**: das Tor ist für A und für B netto bei H = 60 passiert, Placebo und Positivkontrolle bestanden,
  und B − M > 0 (sonst ist B die Prämie des Meldens, nicht der Überraschung). **„nicht belegt"**: A oder B netto verfehlt das Tor und
  die obere 95-%-Schranke von B netto liegt unter 1 Pp über 60 Tage. **„nicht entscheidbar"**: das Tor ist verfehlt, aber die obere
  Schranke liegt nicht unter 1 Pp. Nie durch H = 20 allein, eine einzelne Klasse, ein einzelnes Jahr, die Seite A ohne B. Auch „belegt"
  wäre ein Befund über Erträge gegen das Klassenmittel — über den Maßstab entscheidet Stufe 2.

**A7 Stufe 2 — das Buch gegen den S&P 500** (wird im selben Lauf gerechnet, gleich wie Stufe 1 ausgeht).
- **Start:** 100.000 am 16.09.2021 zur Eröffnung vollständig in SPY (Panel; Gesamtertrag mit Ausschüttungen wie im Rückblick Nr. 74).
- **40 gleich große Plätze.** An jedem Handelstag zur Eröffnung, in dieser Reihenfolge: (1) Positionen, deren 60. Handelstag erreicht
  ist, werden verkauft; (2) Meldungen des obersten Zehntels mit Einstiegstag heute besetzen je einen freien Platz — Reihenfolge nach
  Annahmezeit (früheste zuerst; gleicher Zeitstempel auf die Sekunde: die größere Überraschung zuerst; sind auch die Überraschungen als
  Zahl genau gleich, das Kürzel aufsteigend). **Buchwert zur heutigen Eröffnung**, einmal je Tag bestimmt, nach den Verkäufen von (1)
  und vor den Käufen: SPY-Anteile × Eröffnungskurs des SPY + Summe der gehaltenen Aktien × ihr Eröffnungskurs heute (fehlt die
  Eröffnung: letzter Schlusskurs). Alle Käufe des Tages bekommen denselben Betrag = dieser Buchwert / 40, bezahlt durch Verkauf von SPY
  zur selben Eröffnung. **Kein Kredit, kein negativer SPY-Bestand:** reicht der SPY-Bestand für einen Kauf nicht ganz, wird mit dem
  gekauft, was da ist; ist er null, verfällt die Meldung (zählen). Sind alle Plätze besetzt, verfällt die Meldung (zählen). Kein Kauf
  ohne Eröffnungskurs (zählen). Eine Firma, die schon gehalten wird, wird nicht ein zweites Mal gekauft (zählen).
- **Kosten:** je Aktie die Hälfte der Umlauf-Kosten ihrer Klasse beim Kauf und die Hälfte beim Verkauf, auf das gehandelte Volumen;
  jeder SPY-Handel, der einen Aktienkauf bezahlt oder einen Erlös (Verkauf, Reihenende, Ausschüttung einer Aktie) anlegt, 0,5
  Basispunkte auf das Volumen (Annahme des PM). Die Wiederanlage der eigenen Ausschüttungen des SPY ist auf beiden Seiten kostenfrei.
- **Wann Geld in SPY geht:** jeder Betrag zum ersten Kurs nach seinem Entstehen. Erlöse aus Verkauf und Reihenende gehen zur selben
  Eröffnung in SPY; die Ausschüttung einer gehaltenen Aktie wird am Ex-Tag gutgeschrieben (Stückzahl über die Nacht, Betrag wie im
  Rückblick Nr. 74) und zum Schluss des Ex-Tags in SPY angelegt — dieselbe Regel wie die Wiederanlage im Maßstab.
- **Reihenende im Haltefenster:** Insolvenz und Zwangs-Delisting = Totalverlust, sonst letzter Kurs; gebucht am ersten Handelstag nach
  der letzten Zeile zur Eröffnung, der Erlös geht in SPY, der Platz wird frei.
- **Ende:** 15.09.2026 zum Schluss bewertet; offene Positionen zum Schlusskurs, ohne Verkaufskosten.
- **Maßstab:** 100.000 durchgehend in SPY ab derselben Eröffnung — muss **181.193,87 $** ergeben (die Zahl aus Nr. 74).
- **Zufallsbereich:** dasselbe Buch 200-mal mit einer Zufallszahl an Stelle der Überraschung (fester Startwert, dieselbe Zehntel-Regel;
  auch in der Reihenfolge am Tag steht die Zufallszahl an der Stelle der Überraschung).
- **Der Satz der Stufe 2:** „Im Rückblick über fünf Jahre (16.09.2021 bis 15.09.2026) schlägt das Ergebnis-Drift-Buch den S&P 500 nach
  Kosten: **ja / nein** — Buch … % (… % p. a.), S&P 500 +81,2 % (12,63 % p. a.), Abstand … Pp p. a.; von 200 Zufallsbüchern liegen …
  über dem Buch (Mitte … %, 5 %–95 %: … bis …)." **„ja" heißt Endwert Buch > Endwert SPY.** **Vorwärtstest angezeigt:** nur wenn „ja"
  **und** höchstens 10 der 200 Zufallsbücher über dem Buch liegen; sonst „kein Vorwärtstest angezeigt". Dazu immer: gekaufte und
  verfallene Meldungen, mittlere Zahl besetzter Plätze, Anteil des Kapitals in Aktien, gezahlte Kosten, größter Rückschlag von Buch und
  SPY, Kalenderjahre, die zehn Positionen mit dem größten Beitrag und wie viel vom Abstand an ihnen hängt.

**A8 Ein Lauf.** `lauf.js` startet nur nach dem Siegel (`siegel.js` prüft Git) und rechnet Stufe 1 und Stufe 2 in einem Durchgang;
danach `ERGEBNIS.md`, `ergebnis.json`, Ergebnis-Commit. Ein Fehler im Code wird benannt, behoben, der Lauf wiederholt und unter
`korrekturen` vermerkt; ein Ergebnis, das nicht gefällt, ist kein Fehler. Kein anderes Fenster, keine andere Haltedauer, keine andere
Platzzahl, kein anderer Schätzer.

## Teil B — blind nachgerechnet, vor dem Siegel (`blind.json`; die Überraschung blieb draußen)

**Zählung.** 25.298 Ereignisse der Hauptklassen (Abweichung von der Machbarkeit: 0; über alle vier Klassen 45.785). Davon **14.184 im
Messfenster** (954 Einstiegstage, 1.248 Firmen; Klassen 50-250 / 250-1000 / ab1000: 9.638 / 3.850 / 696; je Jahr 2021: 656 · 2022: 2.903 ·
2023: 2.683 · 2024: 2.803 · 2025: 3.274 · 2026: 1.865) und 11.114 davor (verschlossen; 706 davon in den 63 Handelstagen vor dem Fenster,
nur als Vergleichsmenge). Mit abgeschlossenem Haltefenster: 14.177 (H = 60) und 14.184 (H = 20). Vergleichsmenge je Einstiegstag: kleinste
444, Mitte 708,5, größte 1.309 — an keinem Tag unter 200, kein Ereignis ohne Signal.
**Vorab benannt, weil es aus der Zählung folgt:** der letzte Einstiegstag eines Ereignisses ist der **30.06.2026** (2026 je Monat: 209 ·
628 · 83 · 416 · 480 · 49) — die Bilanz-Tafel v1.1 endet mit den Berichten bis Ende Juni 2026. Von Juli bis 15.09.2026 kommen keine
neuen Meldungen; das Buch und die Zufallsbücher laufen dort aus ihren Positionen in SPY aus.

**Auflösung im Messfenster (Ereignis-Mittel, in Pp).** Streuung des bereinigten Ertrags über alle Ereignisse: 18,70 (H = 60), 10,49 (H = 20).
Fehler = der größere aus 200 Zufalls-Zuteilungen und der Tagesreihe (hier: Mittel über die Zufallsläufe); MDE = 2,8 × Fehler.

| H | Größe | Fehler Zufall | Fehler Tagesreihe | **MDE** |
|---:|---|---:|---:|---:|
| 60 | A | 0,682 | 0,659 | **1,91** |
| 60 | B und B netto | 0,443 | 0,533 | **1,49** |
| 60 | B − M | 0,443 | 0,440 | **1,24** |
| 20 | A | 0,365 | 0,380 | **1,06** |
| 20 | B und B netto | 0,259 | 0,313 | **0,88** |
| 20 | B − M | 0,259 | 0,256 | **0,73** |

Im obersten Zehntel im Mittel 1.434 Ereignisse an 497 Einstiegstagen; ihre Kosten im Mittel 0,183 Pp je Umlauf.

**Das Tor an den beiden Kunstfällen (H = 60, t ≥ 2,5 für A und für B netto).** Anteil der 200 Zufallsläufe, die passieren, wenn der
Effekt eingepflanzt wird (die Läufe um ihr eigenes Mittel zentriert — es geht nur ihre Streuung ein); daneben die Normalnäherung je Größe.

| Fall | A passiert | B netto passiert | **beide (das Tor)** | Normalnäherung A / B netto |
|---|---:|---:|---:|---|
| Nullfall | 0,5 % | 0 % | **0 %** | 0,6 % / 0,2 % |
| Kaufseite 2 Pp, Abstand 4 Pp | 100 % | 84 % | **84 %** | 100 % / 81,9 % |
| Kaufseite 2 Pp allein (Abstand 2 Pp) | 63 % | 84 % | **59 %** | 66,7 % / 81,9 % |
| Kaufseite 1 Pp, Abstand 2 Pp | 63 % | 15,5 % | **15 %** | 66,7 % / 16,7 % |
| Kaufseite 1 Pp allein (Abstand 1 Pp) | 15,5 % | 15,5 % | **8 %** | 15,1 % / 16,7 % |

Lesehilfe: das Tor hält den Nullfall zurück und lässt den Effekt der alten Größe (2 Pp Kaufseite) mit 59 bis 84 % durch; bei der halben
Größe (1 Pp) passiert es nur in 8 bis 15 % — „nicht entscheidbar" ist dann der wahrscheinlichste Ausgang und vor dem Start als
möglicher Ausgang akzeptiert. Positivkontrolle blind: eingepflanzte MDE 1,91 Pp → t ≥ 2 in 78,5 % (H = 60) und 79 % (H = 20) der Läufe.

**Stufe 2, blind.** Maßstab am Panel: 181.193,8652 $ (Soll 181.193,87 $ — getroffen). Buch ohne ein einziges Signal: derselbe Wert auf
den Cent und darunter. **Die 200 Zufallsbücher** (durften vor dem Siegel laufen, sie kennen die Überraschung nicht): Gesamtertrag in der
Mitte +56,6 %, 5 %–95 %: +34,4 bis +88,2 % (Endwerte 115.697 bis 202.686 $); **20 von 200 liegen über dem S&P 500** (+81,2 %). Je
Zufallsbuch in der Mitte 760 Käufe, im Mittel 36,3 von 40 Plätzen besetzt. Der Lauf rechnet dieselben 200 Bücher noch einmal und
vergleicht sie mit `blind.json` (Klinke).

## Teil C — Lesarten des Codes (vor dem Siegel festgelegt, wo Teil A eine Stelle offen lässt)

1. **Vergleichsmenge:** die Ereignisse der Messung (Hauptklassen) mit Einstiegstag E−63 … E−1 nach dem Index des Panel-Kalenders; das
   Ereignis selbst und alle Ereignisse desselben oder eines späteren Tags gehören nie dazu. **Perzentil** mit linearer Interpolation
   (Stelle p × (n − 1) der sortierten Menge). Ein Ereignis ohne Signal (Vergleichsmenge unter 200) zählt in keiner Größe, auch nicht in
   M, und wird nicht gekauft.
2. **M** ist das Mittel über alle Ereignisse mit Signal und abgeschlossenem Haltefenster (oben, unten, Mitte). **B netto** zieht je
   Ereignis die Kosten seiner Klasse ab. Die Kosten sind die gerundeten Zahlen des Auftrags (Prüfstand: 0,210084 / 0,133929 / 0,081269).
3. **Fehler der Tagesreihe für das Ereignis-Mittel:** je Handelstag d des Fensters die Summe der Abweichungen der Ereignisse dieses
   Einstiegstags vom Mittel ihrer Gruppe, geteilt durch die Gruppengröße (z_d; Tage ohne Ereignis zählen mit z_d = 0); Varianz =
   Σ z_d² + 2 Σ_{l=1…H−1} (1 − l/H) Σ z_d z_{d−l}. Bei A und B − M ist z_d die Differenz der beiden Gruppen (die Kovarianz am selben und
   an benachbarten Tagen ist enthalten). Mit einem Ereignis je Tag ist das der Newey-West-Fehler der Machbarkeit (Test).
   **Zufallsfehler:** Streuung der Größe über 200 Läufe; Lauf r zieht mit Startwert 20261004 + r je Ereignis eine Zufallszahl, Zuteilung
   nach derselben Zehntel-Regel. Für M gibt es nur den Fehler der Tagesreihe (M ist in allen Zufallsläufen gleich).
4. **Obere 95-%-Schranke** = B netto + 1,96 × Fehler (Konvention in `wiki/belegstand.md`). **MDE** = 2,8 × Fehler; für die blinde MDE und die
   Positivkontrolle ist der Tagesreihen-Fehler das Mittel über die Zufallsläufe.
5. **Placebo:** dieselbe Ereignismenge wie das Signal; eigener Fehler = der größere aus Zufallsfehler und Tagesreihe der
   Placebo-Zuteilung; geprüft werden A und B − M. **Positivkontrolle:** die MDE von A wird auf jeden Zufallslauf gelegt; t mit dem
   größeren aus Zufallsfehler und Tagesreihen-Fehler des Laufs.
6. **Urteil, nicht geregelter Fall:** ist das Tor passiert, aber das Placebo liegt außerhalb ±2 (und innerhalb ±3) eigener Fehler oder
   B − M ist nicht größer als 0, lautet das Urteil „nicht entscheidbar" mit genanntem Grund.
7. **Buch, Reihenfolge am Tag:** Reihenende, dann Verkäufe, dann der Buchwert, dann Käufe. Eine Meldung wird in dieser Reihenfolge
   geprüft und genau einmal gezählt: Firma schon gehalten (Firma = CIK) → ohne Eröffnungskurs → alle Plätze besetzt → SPY-Bestand null.
8. **Buch, Kosten:** Kaufbetrag = Volumen der Aktie; verkauft wird SPY im Volumen Kaufbetrag × (1 + halbe Umlaufkosten) / (1 − 0,00005)
   — Aktienkosten und SPY-Kosten kommen aus dem SPY-Bestand. Reicht er nicht, geht der ganze Rest in den Kauf (Volumen = Rest ×
   (1 − 0,00005) / (1 + halbe Umlaufkosten)). Verkauf: Erlös = Volumen × (1 − halbe Umlaufkosten); in SPY gehen Erlös × (1 − 0,00005).
   Ein Reihenende kostet auf der Aktienseite nichts (kein Handel), die Anlage des Erlöses in SPY kostet 0,5 Basispunkte.
9. **Verkauf ohne Eröffnungskurs:** hat die Reihe am 60. Handelstag keine Zeile oder keinen Eröffnungskurs, wird zur nächsten Eröffnung
   verkauft, an der es einen gibt (zählen); endet die Reihe vorher, gilt das Reihenende.
10. **Ausschüttungen:** Anspruch hat die Stückzahl über die Nacht — ein Kauf zur Eröffnung des Ex-Tags zählt nicht, ein Verkauf zur
    Eröffnung des Ex-Tags zählt noch; beim SPY im Buch ebenso (Bestand vor dem Handel des Tages). Funktionen und Daten des Rückblicks
    Nr. 74 (`rueckblick.js`: `Massnahmen`, `ausschuettungenAm`). Bewertung zum Schluss; fehlt die Zeile, gilt der letzte Schlusskurs.
11. **Beitrag einer Position:** jede ihrer Bewegungen (Kauf mit allen Kosten, Verkauf, Reihenende, Ausschüttungen) wird in SPY-Anteilen
    gebucht und mit dem Gesamtertrag des SPY auf den 15.09.2026 gerechnet; offene Positionen zählen mit ihrem Schlusswert. Die Summe der
    Beiträge ist genau Endwert Buch − Endwert Maßstab (Klinke). Daneben dieselbe Summe der zehn größten Beiträge in den 200 Zufallsbüchern.
12. **Kennzahlen:** p. a. geometrisch über Kalendertage / 365,25; Zufallsbereich über den Gesamtertrag in % (Mitte = Median, 5 % und
    95 % mit linearer Interpolation); größter Rückschlag und Kalenderjahre auf Tagesschlüssen mit den Funktionen von Nr. 74.
13. **Dieselben 200 Zufallsvektoren** liefern die Zufalls-Zuteilungen der Stufe 1 und die Zufallsbücher der Stufe 2.
14. **Der Schätzer der Kontrolle** (Klassen-Tagesmittel über alle Universumswerte der Klasse) und die Ertragsrechnung sind die der
    Machbarkeit (`rechnen.js` `ertraege`, Konvention `halte` des Prüfstands).

## Teil D — Prüfungen vor dem Siegel

`node test.js`: **158 Prüfungen grün** — die Prüfungen der Machbarkeit (Zeit, Zuordnung, Überraschung, Blindheit der Auflösung) als
Unterlauf; feste Zahlen der Regel; Blindheit (der Schalter für die Überraschung steht nur in `lauf.js` hinter dem Siegel; ohne ihn trägt
kein Ereignis den Wert; vor dem Fenster kein Ertrag); Zehntel punkt-in-zeit (Handfall, Fenstergrenzen, unter 200 kein Signal, kein
Ereignis des Einstiegstags oder danach in der Vergleichsmenge); Größen von Hand; beide Kunstfälle für das Tor an Kunstdaten (Nullfall
0 %, eingepflanzte 2 Pp Kaufseite 88 % bzw. allein 63,5 %); das Urteil an acht Fällen; das Buch von Hand am Kunstpanel (Start in SPY,
Kauf und SPY-Verkauf, Verkauf am 60. Handelstag, volle Plätze, schon gehaltene Firma, fehlender Eröffnungskurs, Reihenende mit und ohne
Totalverlust, Kosten je Klasse auf beiden Seiten und auf den SPY-Handel, Ausschüttung in SPY, Ende mit offenen Positionen, kein Kredit,
kein Kurs aus der Zukunft, Zerlegung der Beiträge); der Bericht an Kunstzahlen; und am echten Panel aus `blind.json`: **der Maßstab
trifft 181.193,87 $**, ohne Signal ist das Buch gleich dem Maßstab, zwei Zufallsbücher mit demselben Startwert sind gleich, die 30 Meldungen der Handprobe der Machbarkeit tragen dieselbe Reihe, denselben Einstiegstag und dieselbe Annahmezeit.
`npx eslint` über den Ordner: sauber.
