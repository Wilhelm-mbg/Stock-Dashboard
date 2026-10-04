# REGEL — Sektor-Momentum: die drei stärksten SPDR-Sektor-Fonds gegen den S&P 500 nach Kosten (Phase 3, blind festgelegt am 04.10.2026)

Kennung `kandidaten-blind-2026-10/sektor-momentum/v1`. Diese Datei ist **vor jeder Zahl** geschrieben; es wurde nichts gerechnet und es
liegen keine Kursdaten vor (`AUFTRAG-PHASE3.md`). Teil A ist die Regel, Teil B nennt Konstanten mit Fundstelle, Teil C hält fest, wie der Code
offene Stellen liest, Teil D nennt Prüfungen, Entscheidregel, Placebo und Erwartung. Beleg: `belege/FAMILIE-sektor-momentum.md` (Stand 04.10.2026).
Nach dem Siegel wird an A, B und C nichts mehr geändert. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Teil A — die Regel

1. **Universum:** eine **feste, vorab genannte Namensliste** der elf SPDR-Select-Sector-Fonds: `XLB, XLC, XLE, XLF, XLI, XLK, XLP, XLRE, XLU, XLV, XLY`.
   Die Liste wird nicht aus Daten gebildet. Ein Fonds **rangiert erst, wenn seine Reihe mindestens 253 Zeilen bis zum Stichtag hat** (Mindestlängenregel,
   dieselbe Zahl wie die Grundregel: 252 + 0 + 1). XLRE (Start 10.2015) hat sie ab dem 03.01.2017, XLC (Start 06.2018) erst im Lauf von 2019; bis dahin
   hat das Universum 9 bzw. 10 Fonds. Zulässig ist ein Fonds außerdem nur bei Median-Tagesumsatz ≥ 100 Mio $ (Median von Schluss × Stück über die 20 Balken
   bis zum Stichtag, wie `liquide.js`), nicht veralteter Reihe (letzte Zeile höchstens 7 Kalendertage vor dem Stichtag), positiven Kursen an beiden Enden
   des Rückblicks und ohne Lücke (Datenwächter, Teil C.3).
2. **Signal:** Gesamtrendite über **252 Handelstage bis zum Stichtag, ohne Überspringen**: `Schluss(Stichtag) / Schluss(Stichtag − 252 Zeilen) − 1`
   (bereinigte Schlusskurse). Rangfolge absteigend; Gleichstand: Kürzel aufsteigend.
3. **Auswahl:** die **3 stärksten** (Zielzahl 3, Obergrenze der Aufgabe 30). Sind weniger als **6** Fonds zulässig, wird nicht gehandelt (`zuWenig`).
4. **Gewichtung und Mechanik: „Gleichgewicht"** wie `korb.js` (§1.5 und Teil C.3 von `momentum-korb-2026-10-04/REGEL.md`): an jedem Ausführungstag werden alle drei
   Zielwerte auf `Depotwert / 3` gestellt (Übergewichtete teilverkauft, Untergewichtete aufgestockt, Nicht-mehr-Ziele ganz verkauft; Verkäufe vor Käufen;
   20 Basispunkte auf jedes gehandelte Volumen). **Nicht** die Mechanik der App (`planeUmschichtung`/`fuehreAus`).
   *Begründung der einen Wahl:* Das Signal der Literatur ist ein gleichgewichtetes Top-3-Portfolio (Faber 2010; Arnott et al.) — mit der App-Mechanik würden
   bei nur drei Plätzen und monatlichem Wechsel Gewinner nie gestutzt, die Gewichte liefen auseinander, und das gemessene Depot wäre nicht mehr „Top 3
   gleich gewichtet". Bei drei Positionen ist die Nachjustierung billig. Das ist eine Studienmechanik; ob sie je in die App geht, entscheidet Wilhelm
   (er hat „alle Ziele gleich gewichten" für das Momentum-Buch der App am 04.10.2026 abgelehnt, `wiki/entscheide.md`).
5. **Takt:** Umschichtung alle **21 Panel-Handelstage** (≈ ein Monat; Faber: monatlich). Der nächste Ausführungstag ist der 21. Panel-Handelstag nach dem letzten
   ausgeführten. **Dies ist nicht der 63-Tage-Takt der Grundregel** — Teil C.1 nennt die Simulatorgrößen, die zu ändern sind.
6. **Zeitablauf wie in der Grundregel** (`massstab-rueckblick-2026-10-04/REGEL.md` Teil A §1.3–1.8 und Teil C): Stichtag = Panel-Handelstag vor dem Ausführungstag
   (Zielliste aus den Schlusskursen des Stichtags), Handel zur **Eröffnung des Ausführungstags**, tägliche Bewertung zum Schluss, Ausschüttungen am Ex-Tag
   (Maßnahmen-Archiv, Anspruch nach der Stückzahl über die Nacht vor dem Ex-Tag, Gutschrift nach dem Handel des Tages), Reihenende nach der Hauptregel des Prüfstands,
   Gesamtertrag auf beiden Seiten, Maßstab SPY aus dem Panel mit Ausschüttungen (samt der Ergänzung vom 15.06.2018, 1,2456 $) ohne Kosten, Startkapital 100.000.
   Meldet die Zielfunktion `zuWenig`, wird nicht umgeschichtet und am nächsten Handelstag neu versucht; solche Tage werden gezählt.
7. **Kosten:** 20 Basispunkte je Seite auf jedes gehandelte Volumen (Verkaufserlös × 0,998, Kaufpreis × 1,002).
8. **Fenster:** **A** erster Ausführungstag 04.01.2017 (Stichtag 03.01.2017 = der 253. Panel-Tag) bis Schluss 15.09.2021 — 1.183 Handelstage; **B** 16.09.2021 bis
   Schluss 15.09.2026 — 1.254 Handelstage. **63 verschobene Starttage** je Fenster: erster Ausführungstag k Panel-Handelstage nach dem Fensterbeginn,
   k = 0 … 62, Ende gleich; p. a. über die eigene Dauer. Die Hauptzahl je Fenster ist k = 0.
9. **Abgrenzung zum ausgeschlossenen 11-1-Aktien-Momentum (ein Absatz).** Ausgeschlossen ist das Momentum der **Einzelaktien** im Querschnitt (Rückblick 231 Tage mit
   21 Tagen Überspringen, die obersten zehn Prozent eines Korbs von mehreren hundert Aktien, 63-Tage-Takt), gemessen in `momentum-korb-2026-10-04` und im amtlichen
   Rückblick. Diese Regel ist ein **anderes Instrument, ein anderer Querschnitt und eine andere Quelle**: sie rangiert nur elf **Branchen-Fonds**, gleich gewichtet
   die drei stärksten, nach der Branchen-Momentum-Literatur (Moskowitz/Grinblatt 1999, „Do Industries Explain Momentum?"; ausführbar nach Faber 2010), die gerade
   behauptet, dass **Branchen**-Rendite Momentum trägt, das nach Kontrolle von Einzelaktien-Momentum bestehen bleibt. Sie hat kein Überspringen, 252 statt 231 Tage,
   21- statt 63-Tage-Takt, drei statt neunzehn Positionen und kommt ohne einen einzigen Einzelwert aus. Eine Überschneidung bleibt: Ein Sektor, der stark ist,
   enthält meist die Aktien, die auch im Aktien-Momentum oben stehen; die beiden Messungen sind deshalb **nicht unabhängig**, und ein Erfolg hier wäre keine zweite
   Bestätigung des Aktien-Momentums. Auch das Ergebnis des Aktien-Korbs wird hier nicht benutzt oder verändert.

## Teil B — Konstanten mit Fundstelle

| Größe | Wert | Fundstelle |
|---|---|---|
| Universum | XLB, XLC, XLE, XLF, XLI, XLK, XLP, XLRE, XLU, XLV, XLY | Belegdatei §1: CXO-Test mit neun SPDR-Sektoren XLB … XLY [Q]; XLRE und XLC sind die zwei später geschaffenen SPDR-Sektoren — **Zusatz dieser Studie** |
| Rückblick | 252 Handelstage (12 Monate), kein Überspringen | Faber (2010), SSRN 1585517: Beispiel 12 Monate, Top 3, gleichgewichtet, monatlich, ohne Überspringen — **[Q-indirekt]** (Quantpedia/CXO; Entwurf nicht selbst gelesen). Umrechnung 12 × 21 = 252 ist eine Konvention, keine Quellenzahl |
| Zahl gehaltener Sektoren | 3 | Faber (2010) Top 3 aus 10 [Q-indirekt]; Arnott/Clements/Kalesnik/Linnainmaa (2018, RFS 2023) Abschn. 3.2 Top 3 / Bottom 3 [Q-indirekt] |
| Takt | 21 Handelstage ≈ monatlich | Faber (2010) monatlich [Q-indirekt]; CXO-Test monatlich [Q]. Handelstage statt Kalendermonat wie in der Grundregel (Teil A §1.3) |
| Gewichtung | gleich | Faber (2010) [Q-indirekt]; Belegdatei §1 |
| Mindestzahl zulässiger Fonds | 6 | **Setzung dieser Studie, keine Literaturgröße** (Top 3 aus mindestens 6). Nicht optimiert |
| Datenwächter Lücke | ≤ 400 Kalendertage zwischen Zeile i − 252 und i (üblich 365–372) | **Setzung dieser Studie, keine Literaturgröße**; sie verhindert nur, dass eine Reihe mit fehlenden Monaten als „12 Monate" gilt |
| Umsatzschwelle | Median (`sortiert[n >> 1]`) von Schluss × Stück über 20 Balken ≥ 100.000.000 $ | `liquide.js` Z. 32–56 (`KORB`, `medianUmsatz`, `zulaessig`); Aufgabe: auch für ETFs |
| veraltet | letzte Zeile > 7 Kalendertage vor dem Stichtag | `mfhandel.js` Z. 52 und 68 |
| Mindestlänge | 253 Zeilen (252 + 0 + 1) | gleich `MH.buchKonfig()`: 231 + 21 + 1 (`mfhandel.js` Z. 65) — gleicher frühester Stichtag 03.01.2017 |
| Kosten / Startkapital / Startphasen | 20 Bp je Seite / 100.000 $ / 63 | Aufgabe; `mfdepot.js` Z. 158 |
| Fenster | A 04.01.2017–15.09.2021 (1.183 Handelstage), B 16.09.2021–15.09.2026 (1.254) | `momentum-korb-2026-10-04/REGEL.md` Teil B |
| Perioden | A: 56 volle à 21 Tage + 1 angebrochene (7 Tage) = 57; B: 59 volle + 1 angebrochene (15 Tage) = 60 | Rechnung 1.183 = 56 × 21 + 7; 1.254 = 59 × 21 + 15 |
| Beobachtungen im Beleg | MG (1999) Volltext nicht gelesen; **Überspringzeit „ca. eine Woche" nur aus dem Gedächtnis [G]** → nicht übernommen | Belegdatei §1 |
| Seed des Placebos | FNV-1a (32 Bit) über `sektor-momentum-placebo-v1|JJJJ-MM-TT` (Stichtag), Generator mulberry32, Fisher-Yates über die zulässigen Kürzel in aufsteigender Folge | `ziel.js` (`placeboZiel`); Wort und Verfahren vorab festgelegt, keine Literaturgröße |

**Unverifiziert (ausdrücklich):** (a) Fabers Parameter stammen aus Sekundärquellen, der Entwurf selbst wurde nicht gelesen; (b) die Überspringzeit bei MG ist [G] und wird
nicht benutzt; (c) 252 Handelstage als „12 Monate" ist Konvention; (d) die Zahl 6 und der Datenwächter 400 sind Setzungen; (e) der Primärtext von MG 1999 war nicht erreichbar.
Wer den Primärtext erreicht, prüft Rückblick, Überspringzeit und Takt dort nach und meldet eine Abweichung, statt die Regel nachträglich zu ändern.

**Nicht gerechnet (andere Fassungen der Literatur, vorab ausgeschlossen):** 6-1- und 1-1-Rückblick; 6-Monate-Halten mit Überlappung (Arnott et al.); ein Sektor statt drei (CXO);
Long-Short; Wertgewichtung; Kombination mehrerer Rückblicke; 10 Fama-French-Branchen statt SPDR-Fonds.

## Teil C — Lesarten des Codes (vor dem Lauf festgelegt)

1. **Zu ändernde Simulatorgrößen** (`korb.js` wird **nicht** geändert; ein Simulator `sektor.js` setzt es auf, wenn der Auftrag da ist).
   - **Takt 63 → 21:** `MH.buchKonfig().halten` ist 63 (`momentum.js` `STANDARD.halten`, gelesen in `mfhandel.js` Z. 29–33; `korb.js` Z. 180 `var halten = MH.buchKonfig().halten`,
     benutzt in Z. 262 `Q.ptage[o + halten]`). Zu setzen: `halten = 21` (nicht `MH.buchKonfig()` ändern — das ist die App). Die Zählung „21. Panel-Handelstag nach dem letzten ausgeführten"
     ist dieselbe wie bei 63. Fensterbeschreibung in `korb.js` (`FENSTER`): Zahl der Perioden 57 und 60 statt 19 und 20; die Klinken „18 volle Perioden und eine angebrochene" werden zu 56 und 59.
   - **Zielfunktion:** `MH.momentumZiel` (`korb.js` Z. 95 und 107) wird durch `zielfunktion` aus `ziel.js` ersetzt; die Korbauswahl (Schritte (b)–(d), Z. 88–100) entfällt. Die `rohMap` darf
     das ganze Panel enthalten — `zielfunktion` liest nur die elf Namen. Die Klinke Z. 371 (Zielzahl `max(5, round(Korb × 0,1))`) wird zu „Zielzahl 3". `R.klinkeReferenz` gilt weiter (SPY nicht im Ziel; er steht nicht in der Liste).
   - **t-Tabelle:** `T975` in `rueckblick.js` (Z. 26–27) reicht bis 30 Freiheitsgrade; gebraucht werden 56 (A, t ≈ 2,003) und 59 (B, t ≈ 2,001) — Tabellenwerte vor dem Lauf nachsehen und eintragen, **nicht** schätzen.
   - **Selbstprüfung §1.8** (165.209,66 $ gegen 181.193,87 $) gilt dem Aktien-Korb und entfällt; stattdessen die Pflichtprüfung: der SPY-Teil des Rechners trifft die bekannten SPY-Zahlen (+115,95 % in A mit Ergänzung).
   - **Gleichgewicht:** `gleichgewicht()` in `korb.js` (§1.5) wird unverändert benutzt, mit Zielzahl 3.
2. **Datenvorbehalt: Sektor-ETFs stehen evtl. nicht im Aktienpanel.** Das Panel v2.2 führt 7.479 Reihen, davon eine Referenzreihe (SPY); ob XLB … XLY darin stehen, ist **nicht geprüft**.
   `zielfunktion` verhält sich so: ein Kürzel der Liste, das in `roh` fehlt, ist **nicht zulässig** (`verworfen`: „nicht im Panel", `korb.geprueft` zählt es trotzdem mit); sind weniger als 6 Fonds zulässig, gilt
   `zuWenig: true`, `ziel: []`, es wird nicht gehandelt. **Fehlen die ETFs im Panel ganz, ist der Lauf nicht ausführbar** (Bargeld ohne Handel an jedem Tag) — das Ergebnis lautet dann „nicht ausführbar", **nie** „schlägt nicht".
   Der Simulator zählt die `zuWenig`-Tage und bricht ab, wenn es mehr als 5 % der Ausführungstage sind. Eine Quelle für fehlende ETF-Reihen (gleiches Format `[zeitMs, schlussBereinigt, umsatzStück]`, mit Splits/Ausschüttungen bereinigt) muss **vor** dem Siegel
   bestimmt werden; sie darf nicht nach dem Blick auf Erträge gewechselt werden.
3. **Datenwächter Lücke.** Eine Reihe mit 253 Zeilen, die zwischen Zeile i − 252 und i mehr als 400 Kalendertage überspannt, rangiert nicht (Grund „Lücke in der Reihe"). Ohne diese Zeile würde die Indexzählung
   (wie in `momentumZiel`) eine Lücke stillschweigend zu einem längeren Rückblick machen.
4. **Ausschüttungen der ETFs.** Sektor-Fonds zahlen vierteljährlich (Größenordnung 1–2 % im Jahr [G, ungeprüft]). Fehlt für einen gehaltenen Fonds die Maßnahmen-Datei (`alpaca-massnahmen/<ordner>.json`), zählt der Simulator den Fall
   (Grundregel: „keine Ausschüttung"). Das **benachteiligt das Buch gegen SPY**, der seine Ausschüttungen hat. Fehlen Dateien: Zahl berichten und das Urteil „schlägt nicht" mit dem Vermerk „Datenlücke gegen das Buch" tragen; ein „schlägt" bleibt gültig.
5. **Kein Blick voraus.** `zielfunktion` liest nur Zeilen mit Zeitstempel ≤ `opts.nowMs`; auch die Mindestlänge zählt nur diese. Bilanzdaten (`opts.fundamental`) werden **nicht** gelesen — die Regel hat keine. Die in der Aufgabe beschriebene Form
   (`{ KÜRZEL: [{ filed, periodEnde, form, werte }] }`) wird akzeptiert und ignoriert; eine Karenz entfällt.
6. **Placebo (Lesart vorab).** `placeboZiel`: derselbe Aufruf, dasselbe Universum, **dieselbe Zulässigkeit** (Länge, Veraltet, Kurs, Lücke, Umsatz, Mindestzahl), dieselbe Zielzahl 3, dieselbe Mechanik (Gleichgewicht), derselbe Takt — die Auswahl aber
   ein Zufallszug ohne Kursbezug: Seed aus Stichtag und festem Wort, Fisher-Yates über die zulässigen Kürzel aufsteigend, die ersten drei. **Ein Lauf, ein Seed.** Da das Placebo nur aus rund 9–11 Fonds zieht, ist es faktisch ein
   Zufalls-Sektor-Portfolio; es misst, was „irgendwelche drei Sektoren, gleich gewichtet, monatlich umgeschichtet" gegen den SPY (kapitalgewichtet, techlastig) bringt, einschließlich der Kosten der Umschichtung. Ein einzelner Zug streut stark; er ist eine
   Kontrolle auf grobe Fehler (Kostenbild, Datenfehler, SPY-Besonderheit), kein Schätzer.
7. **Bekannte Mechanik-Mängel (Wiedervorlage Nr. 85, `wiki/belegstand.md` Z. 76).** Das Buch der App lässt bei neun von zehn Umschichtungen Plätze leer (Gewinner werden nie gestutzt, `fuehreAus` verkleinert Käufe) und erzeugt Kleinstpositionen,
   die als „gehalten" zählen. Das trifft diese Studie **nur mittelbar**: die Mechanik „Gleichgewicht" stutzt und stockt auf, es entstehen keine leeren Plätze, wohl aber jeden Monat Handel auch bei kleinen Abweichungen (kein Toleranzband, keine Mindestordergröße) — das kostet
   und steht in den gezahlten Kosten. Ein Ziel ohne Eröffnungskurs wird nicht gehandelt, sein Anteil bleibt Bargeld (bei liquiden ETFs selten). Was Wilhelm zu Nr. 85 für die App entscheidet, ändert diese Regel nicht.
8. **Wirksame Zahl der Startphasen.** Bei 21-Tage-Takt und 63 Starttagen (k = 0 … 62) haben die Startphasen k, k + 21 und k + 42 **dieselben Umschichtungstage**, nur einen anderen Anfang. Die 63 Phasen enthalten damit nur etwa **21 unterschiedliche Taktlagen** — jede dreimal.
   „45 von 63" ist deshalb eine strengere Latte als bei 63-Tage-Takt, nicht eine unabhängigere.
9. **Alles andere wie in der Grundregel:** Zeitstempel = Mitternacht UTC des Panel-Tages, „7 Kalendertage" ganze Tage; Reihenende, Bewertung, Perioden, p. a., Rückschlag, Kalenderjahre wie `rueckblick.js` und `korb.js`.

## Teil D — Prüfungen, Entscheidregel, Placebo, Erwartung

**Prüfungen:** `node studien/kandidaten-blind-2026-10/sektor-momentum/test.js` (76 Prüfungen, alle grün; Kunstdaten mit von Hand gerechneten Sollwerten): Konstanten; Grundfall (Rangfolge, Ziel, Korb-Zählung, Form wie `momentumZiel`); kein Überspringen
(Zwischenkurse ändern nichts, Anfang ist genau Zeile i − 252); Gleichstand (Kürzel aufsteigend, unabhängig von Schlüssel- und Listenfolge); zu kurze Reihen (252/253, XLC erst mit 253 Zeilen, Zeile nach dem Stichtag zählt nicht zur Länge); veraltete Reihe (8 gegen 7 Tage);
Kurs ≤ 0 und NaN; Lücke (Spanne 452 gegen 352 Tage); Umsatzschwelle (unter, genau, Median als oberer der beiden mittleren, genau 20 Balken, Balken außerhalb ohne Wirkung, ohne Stückzahl, Gegenprobe gegen `liquide.js`); Mindestzahl (5 gegen 6, leeres Panel);
Fremdkürzel nie im Ziel; kein Blick voraus mit Gegenprobe und ohne Wirkung von `fundamental`; keine Mutation der Eingabe; Placebo (FNV-1a-Testwerte, Seed und Generator gegen eine unabhängige BigInt-Nachrechnung, Fisher-Yates von Hand, deterministisch, immer 3 verschiedene
zulässige Fonds, gleichverteilt, ohne Kursbezug, nie ein unzulässiger Fonds, derselbe Korb wie die Regel, `zuWenig` wie die Regel). Zusätzlich vor Abgabe durch gezielte Ausbau-Proben geprüft: Überspringen 21, Lückenregel, Blick voraus, Gleichstandsregel, Median-Index, Schwellenvergleich,
Veraltet-Grenze, Zielzahl, Mindestzahl, Seed, Placebo-Sortierung, Umsatzfenster und Kurs-≤-0-Regel machen je mindestens eine Prüfung rot.

**Entscheidregel (vorab, wörtlich der Aufgabe):** „**schlägt SPY**" nur, wenn **in beiden Fenstern** (A und B) (1) beim Start am ersten Tag (k = 0) Buch > SPY (strikt, Endwerte; Gleichstand = nicht vorn) **und** (2) in mindestens **45 von 63** Starttagen Buch > SPY **und**
(3) der **Median** des Abstands (Pp p. a.) über die 63 Starttage > 0. Sonst „schlägt nicht"; Zwischenurteile werden genannt: „vorn nur in Fenster A", „vorn nur in Fenster B", „k = 0 vorn, aber unter 45 Phasen" usw., je Fenster getrennt mit den drei Zahlen.
Dazu immer: Abstand je Periode (Mittel, Standardfehler, 95-%-Band) mit dem Vermerk, ob das Band 0 einschließt (dann „nicht vom Zufall zu unterscheiden"), größter Rückschlag, gezahlte Kosten, Zahl der `zuWenig`-Tage (Erwartung 0), Zahl der gehaltenen Fonds.
**Zusatz zur Aussage (ebenfalls vorab):** Das Urteil „schlägt SPY" wird erst **Momentum-Befund** genannt, wenn der Kandidat auch das **Placebo** nach denselben drei Bedingungen **und** in beiden Fenstern im Median der Starttage schlägt. Schlägt das Placebo SPY ähnlich, ist der Vorsprung ein Sektor-/Gewichtungseffekt
(gleich gewichtete Sektoren gegen kapitalgewichteten Index), kein Momentum. Das Placebo bekommt dieselben Tabellenzeilen, in derselben Tabelle.

**Erwartung vorab (aus der Belegdatei, ehrlich, nicht gerechnet).** Die Literatur liefert für Long-only-Top-3 aus SPDR-Sektoren **nach Kosten 2017–2026 keine belegte Größe**: die verwendbaren Studien enden 2015/2016, der Branchen-Effekt ist nach etwa 2000 deutlich schwächer (Arnott et al. [Q]),
im ETF-Zeitraum 2000–2007 verschwand er nach Kosten bei Long-Short fast überall [Q], und Du/Denning/Zhao (2014) finden für Sektor-ETFs nach 2000 „kein Momentum" [Q-Abstract]. Die Belegdatei schätzt den Überschuss gegen SPY netto auf **−4 bis +3 Pp p. a., Mitte um −0,5 bis −1 Pp** und die Wahrscheinlichkeit, SPY zu schlagen, auf
**30–40 %** — beides **[G, Urteil, nicht gemessen]**; der Kostenanteil (Umschlag 25–40 % je Monat, 0,3–0,8 Pp p. a. bei 20 Bp) ist eine ungeprüfte Schätzung, die Mechanik „Gleichgewicht" kostet eher mehr, weil sie jeden Monat nachjustiert.
**Sichtbarkeit:** Die Auflösung ist die Wand. Bei einer Streuung der Monatsabstände von etwa 2–3 Pp [G] liegt der Standardfehler des Mittels über 57–60 Perioden bei rund 0,3–0,4 Pp je Monat, also grob **3–5 Pp p. a.**; ein Effekt von 1–3 Pp p. a. ist darin **nicht erkennbar**, die kleinste sicher erkennbare Größe liegt
(80 %, 5 %) beim 2,8-Fachen davon, **grob 8–14 Pp p. a.** — ein Vielfaches dessen, was die Literatur erwarten lässt. Die Wahrscheinlichkeit, dass ein in der Literatur erwartbarer Effekt in **beiden** Fenstern nach der Entscheidregel sichtbar wird, ist gering (**unter 15 %** [G]); wahrscheinlicher ist
„schlägt nicht" durch Zufall und Kosten oder ein Fenster-Wechsel (A anders als B). Das Fenster 2017–2026 ist zudem techlastig: XLK und XLY tragen den S&P 500, ein Top-3, das 2018, 2020 oder 2022 in Defensive/Energie wechselt, hinkt in diesen Wendepunkten hinterher [G].
**Als Fehlschlag gilt:** (a) „schlägt nicht" nach der Entscheidregel; (b) „nicht ausführbar" (ETFs nicht im Panel); (c) ein „schlägt", das das Placebo gleichermaßen erreicht (dann kein Momentum-Befund); (d) mehr als 5 % `zuWenig`-Tage. Ein „schlägt nicht" ist kein Beleg für „kein Effekt" (Auflösung), ein „schlägt" in nur einem Fenster kein Beleg für eine Kante.
**Hauptrisiko:** der Datenvorbehalt (Teil C.2) — fehlen die ETF-Reihen oder ihre Ausschüttungen im Panel/Archiv, kippt die Messung zwischen „nicht ausführbar" und einem Urteil, das gegen das Buch verzerrt ist. Zweites Risiko: Konzentration auf drei Sektoren mit hohem Beta-Unterschied zu SPY; ein einziger Wende-Monat entscheidet ein Fenster.
**Das Ergebnis würde NICHT sagen:** nichts über das Aktien-Momentum (andere Regel, verwandte Aktien, Teil A §9), nichts über Branchen-Momentum in anderen Rückblicken, Takten oder als Long-Short, nichts über die Zukunft, nichts über ein Handeln in der App (keine Signale, keine Anlageberatung), und bei „schlägt nicht" nicht „es gibt keinen Effekt".
Da die Auflösung über der erwartbaren Größe liegt, wäre „nicht entscheidbar" nach `wiki/messmethodik.md` Punkt 1 der eigentlich zulässige Befund; die Regel hier misst das Buch gegen SPY, wie die Aufgabe es verlangt, und trägt dieses Urteil in den Zwischensätzen mit.
