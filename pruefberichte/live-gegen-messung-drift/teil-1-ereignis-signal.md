# Live gegen Messung — Ergebnis-Drift, Teil 1: Ereignis-Quelle, Zeitpunkt, Signal und Auswahl

Durchsicht vom 04.10.2026, Zweig `pruefung/live-gegen-messung-drift`. Teil 1 von 3.
Simulation mit virtuellem Kapital, keine Anlageberatung.

**Soll** ist die gemessene Regel: `studien/vorregistrierung-2026-10-04-ergebnis-drift/` (VORREGISTRIERUNG.md A2–A5 und
Teil C 1; `ereignisse.js`, `zehntel.js`, `konfig.js`) mit den Bausteinen der Machbarkeit
`studien/ergebnis-drift-ereignis-2026-10-04/` (`zeit.js`, `ueberraschung.js`, `zuordnung.js`, Lesart `utc` aus
`zeitpruefung.json`) und dem Universum des Prüfstands (`studien/querschnitt-pruefstand-2026-09-13/pruefstand.js`, `konfig.js`).
**Ist** ist die App: `drift.js`, `driftui.js`, `main.js` (earnings-fetch), `mfdepot.js` (Takt des Drift-Buchs),
`mfhandel.js` (`driftAbgleich`, nur soweit es Auswahl und Einstiegstag betrifft).

Kleinsttests: `pruefberichte/live-gegen-messung-drift/teil-1-ereignis-signal.tests.js` (19 Tests, nur Kunstdaten, feste
Uhr, kein Netz). Aufruf aus der Repo-Wurzel: `node pruefberichte/live-gegen-messung-drift/teil-1-ereignis-signal.tests.js [E…]`.
Stand des Laufs: **17 × „ZEIGT ABWEICHUNG“, 2 × „kein Unterschied“** (E6, E17), mit `TZ=UTC`, `TZ=America/New_York` und
`TZ=Pacific/Auckland` dieselbe Ausgabe (Prüfsumme gleich).

Bewertung: **A** = falsches Geld bzw. falsche Positionen, **B** = falsche Anzeige oder Messung, **C** = Schönheit/Randfall.

## Tabelle

| Messung (Datei:Zeile) | App (Datei:Zeile) | Abweichung | Bew. |
|---|---|---|---|
| VORREG. A3 (Z. 33); `ueberraschung.js:17-26`; `ereignisse.js:38` | `main.js:161`, `main.js:246-256`; `drift.js:226-249` | **E1** Überraschung = Zeitreihen-SUE des Nettoergebnisses aus der Tafel; App = Yahoo-Konsens-Überraschung des EPS in % | A |
| VORREG. A4 (Z. 38); `zeit.js:63-79` | `drift.js:46-50`, `drift.js:76-78` | **E2** Meldung während des Handels: Messung nächster Handelstag, App derselbe Tag | B |
| VORREG. A4 (Z. 38) „Kauf zur Eröffnung“ | `drift.js:268-275` (`einstieg: b[j][1]`); Reihe ohne Eröffnung (`driftui.js:118-120`, `mfdepot.js:479`) | **E3** Einstieg zum Schluss des Reaktionstags statt zur Eröffnung des Einstiegstags; vorbörslich liegt der Sprung des Meldetags in der App vor dem Einstieg | A |
| `zeit.js:72-79` mit der SEC-Annahmezeit (sekundengenau) | `drift.js:61-78`, `drift.js:285-300` | **E4** Stempel ohne Uhrzeit (04:00/05:00 UTC): App immer +1 Tag; vorbörsliche Meldungen einen Handelstag zu spät | A |
| `zeit.js:50-55`, `:74-79` (frei → erster Handelstag ab Datum) | `drift.js:55-59` + `:78` | **E5** Wochenende/Feiertag mit Uhrzeit ≥ 20 UTC: App zählt nach dem Vorwärtssprung noch einen Tag dazu | C |
| `zeit.js:20-28` (Intl, America/New_York) | `drift.js:76-78` (feste Grenze 20 UTC) | **E6** Gegenprobe Sommer-/Winterzeit außerhalb der Handelszeit: kein Unterschied | – |
| VORREG. A7 (Z. 71-72) „mit Einstiegstag heute“ | `mfhandel.js:497`, `:530-551`; `mfdepot.js:483-487` | **E7** Buch kauft Signale bis 5 Handelstage alt zum dann aktuellen Kurs | A |
| VORREG. A3 (Z. 34-35); `konfig.js:30` `ANTEIL 0.1` | `drift.js:40`, `:142-143`; gesperrt in `driftui.js:260-266` | **E8** Fünftel (0,20) statt Zehntel (0,10) | A |
| VORREG. A3, `konfig.js:30` `VERGLEICH_MINDESTENS 200` | `drift.js:42`, `:138` | **E9** Mindestzahl 40 statt 200 | A |
| VORREG. A3, C 1; `zehntel.js:41-43` (E−63…E−1) | `drift.js:39`, `:137` (mi ≥ E−120, inkl. E) | **E10** Fenster 120 statt 63 Handelstage | A |
| VORREG. C 1 (Z. 152-153); `zehntel.js:38-43` | `drift.js:121`, `:135-140` | **E11** Ereignisse desselben Tags gehören in der App zur Vergleichsmenge; Ergebnis hängt an der Reihenfolge der Kürzel | A |
| `zehntel.js:14-17`, `:53` (Wert ≥ Perzentil) | `drift.js:140-143` (Anteil strikt kleinerer) | **E12** Gleichstand: App wertet gleiche Werte als „unten“, Messung als „oben“ | A |
| `zehntel.js:14-17` (lineare Interpolation) | `drift.js:140-142` | **E13** Rangregel ohne Gleichstand: Randfälle kippen auch bei gleichen Parametern | A (Randfälle) |
| VORREG. A1, A6 (A nur Größe), A7 (Buch kauft nur oben) | `drift.js:143`, `:271`; `mfhandel.js:546-550` | **E14** App handelt das untere Fünftel als Leerverkauf | A |
| VORREG. A1, A2; `ereignisse.js:82-88`, `konfig.js:31`; Prüfstand `konfig.js:101-102` | `mfdepot.js:476-481`; `drift.js:94-100` | **E15** App ohne Umsatzklassen; Universum und Vergleichsmenge = Mittelfrist-Bestand mit Terminen | A |
| Prüfstand `pruefstand.js:118`, `konfig.js:106` (`MIN_VORTAGE 250`) | `drift.js:100` (`b.length < 100`, ganze Reihe) | **E16** Mindestlänge 100 Balken der ganzen Reihe statt 250 Vortage am Stichtag | B |
| Ereignisse nur aus eingereichten 8-K; `zeit.js:74-79` (−1 ohne Folgetag) | `drift.js:108`, `:229-232`; `driftui.js:50-63` | **E17** Gegenprobe Termine in der Zukunft: kein Unterschied | – |
| `zuordnung.js:13-16`, `:60-82` (eine Hauptmeldung je Zeile); `ereignisse.js:93-95` | `driftui.js:34-45` (`mische`), `:83`; `drift.js:98-119` | **E18** Dubletten nur am UTC-Datum erkannt: eine Meldung mit zwei Stempeln wird zwei Ereignisse | B |
| ein Kalender (Panel) für Ereignis und Vergleichsmenge, Teil C 1 | `drift.js:96`, `:109-111`; `mfdepot.js:70-76`; `driftui.js:132` | **E19** Fehlt der jüngste Tag in der SPY-Reihe (`drift_markt`), fällt das Ereignis heraus | C |

## Funde

**E1 — Quelle der Überraschung (A).** Die Messung bildet die Überraschung als `(netto D0 − netto D4) / sd(netto D0…D7)`
aus der Bilanz-Tafel (VORREGISTRIERUNG.md A3, `ueberraschung.js:17-26`, gerufen in `ereignisse.js:38`). Die App nimmt
Yahoos `epssurprisepct` aus dem tiefen Kalender (`main.js:161`) bzw. `surprisePercent.raw × 100` aus `earningsHistory`
(`main.js:248`, gepaart in `drift.js:226-249`): Konsens-Abweichung des Gewinns je Aktie in %. Das ist eine andere Größe
(Konsens statt Vorjahresquartal, EPS statt Nettoergebnis, Prozent statt Streuungseinheiten, bei Schätzungen nahe null
unbeschränkt). Folge: Die App sortiert andere Meldungen nach oben als die gemessene Regel; was gemessen wurde, wird nicht
gehandelt. Test **E1**: Firma X schlägt den Konsens (+25 %), fällt aber gegen das Vorjahr (SUE −3,06); Firma Y verfehlt
(−8 %), steigt aber (SUE +1,76) — die Rangfolge kehrt sich um.

**E2 — Meldung während des Handels (B).** Messung: Annahme ab 09:30:00 New York → nächster Handelstag, Kauf zur
Eröffnung (`zeit.js:72-79`). App: Reaktionstag = derselbe Tag, solange die UTC-Stunde < 20 ist (`drift.js:76-78`), gemeint
ist dessen Schluss (`drift.js:46-50`). Im Sommer weichen alle 390 Handelsminuten im Tagesindex ab, im Winter 330 von 390
(15:00–16:00 EST gilt der App wegen der festen 20-UTC-Grenze schon als „nach Schluss“). Folge fürs Geld gering, solange
die App wirklich zum Schluss einstiege (Schluss D liegt zeitlich kurz vor Eröffnung D+1) — aber Tageszählung, Vergleichsmenge
und „seitTagen“ sind um einen Tag verschoben. Test **E2**.

**E3 — Einstieg zum Schluss statt zur Eröffnung (A).** Messung kauft zur Eröffnung des Einstiegstags (A4). Die App-Reihen
tragen gar keine Eröffnung (`driftui.js:118-120`, `mfdepot.js:479`: `[t, schluss, stück, …]`); `Drift.heute` setzt
`einstieg = b[r][1]`, den Schluss des Reaktionstags (`drift.js:268-275`), und das Buch kauft zum aktuellen Kurs des Takts.
Bei einer vorbörslichen Meldung (07:00 EDT) wählen beide denselben Tag, aber die Messung hat die Bewegung dieses Tags im
Ertrag, die App steigt erst nach ihr ein. Test **E3**: Eröffnung 100, Schluss 108 → Messung 100, App 108.

**E4 — Stempel ohne Uhrzeit (A).** Rund 60 % der Yahoo-Termine stehen auf 04:00/05:00 UTC (Mitternacht New York); die App
legt sie pauschal einen Tag später (`drift.js:61-78`, ausgewiesen in `stempelBilanz`, `drift.js:285-300`). Die Messung
kennt die sekundengenaue SEC-Annahmezeit. Für eine vorbörsliche Meldung kauft die Messung am Meldetag zur Eröffnung, die App
einen Handelstag später (zum Schluss) — sie verpasst zwei Sitzungen der Reaktion; für eine nachbörsliche stimmt der Tag.
Test **E4**.

**E5 — Wochenende/Feiertag (C).** Liegt das UTC-Datum nicht im Kursindex, springt die App vorwärts auf den nächsten
Handelstag (`drift.js:55-59`) und addiert danach wegen Stunde ≥ 20 noch einen Tag (`:78`). Messung: erster Handelstag ab
dem Datum (`zeit.js:74-79`). Sa 17:30 EDT → App Di statt Mo; Feiertag 03.07. 17:00 EDT → App Di statt Mo. Selten. Test **E5**.

**E6 — Gegenprobe Sommer-/Winterzeit (kein Unterschied).** Außerhalb der New Yorker Handelszeit (und ohne die
Mitternachtsstempel aus E4) liefern App und Messung in Sommer, Winter und den Wochen nach beiden Umstellungen für alle
4.192 geprüften Minuten denselben Einstiegstag; die feste 20-UTC-Grenze schadet nur innerhalb der Handelszeit (E2).
Vorbörslich 07:00 EDT = 11:00 UTC: beide derselbe Tag. Test **E6**.

**E7 — Später Einstieg (A).** Das Buch der Messung kauft eine Meldung nur an ihrem Einstiegstag (A7). `driftAbgleich`
eröffnet jedes Signal bis `seitTagen ≤ 5` (`mfhandel.js:497`, `:530`) zum Kurs des Takts. Folge: Einstiege bis fünf
Handelstage nach dem gemessenen Zeitpunkt, mit einem Kurs, der die ersten Tage der Drift schon enthält. Test **E7**
(Grenzziehung des Buchs gehört auch in Teil 2).

**E8 — Fünftel statt Zehntel (A).** `STANDARD.anteil = 0.20` (`drift.js:40`, `:142-143`), im Tab gesperrt auf genau
diesen Wert (`driftui.js:260-266`); die Messung handelt das oberste Zehntel (`konfig.js:30`, A3). Die Hälfte der
App-Käufe (80.–90. Perzentil) liegt außerhalb der gemessenen Gruppe. Test **E8**.

**E9 — Mindestzahl der Vergleichsmenge (A).** App 40 (`drift.js:42`, `:138`), Messung 200 (A3, `konfig.js:30`). Bei
100 Vergleichswerten handelt die App, die Messung gibt kein Signal. Test **E9**.

**E10 — Fensterlänge (A).** App: alle Ereignisse mit Markt-Index ≥ E−120 (`drift.js:137`, inklusive Tag E),
Messung E−63…E−1 (`zehntel.js:41-43`). Ältere Werte verschieben die Grenze: Wert 200 ist in der App „oben“, in der
Messung „Mitte“; mit Fenster 63 stimmt die App wieder. Test **E10**.

**E11 — Ereignisse desselben Tags (A).** Die App sortiert nur nach Markt-Index (`drift.js:121`) und vergleicht mit allen
früheren Einträgen des Arrays (`:140`) — also auch mit denen desselben Tags, die zufällig vorher stehen; die Reihenfolge
ergibt sich aus `Object.keys` der Terminliste. Die Messung schließt den Tag selbst aus (C 1, `zehntel.js:38-43`). Test
**E11**: BBB wird bei Reihenfolge BBB,AAA gekauft, bei AAA,BBB nicht; die Messung mit denselben Zahlen in beiden Fällen
gleich.

**E12 — Gleichstand (A).** App: `p = Anteil strikt kleinerer Werte` (`drift.js:140-141`); Messung: Wert ≥ 90.
Perzentil (`zehntel.js:53`). Ein Wert, der den Vergleichswerten gleicht, ist in der App „unten“ (Leerverkauf), in der
Messung „oben“. Begünstigt durch die Rundung auf 0,01 % (`drift.js:248`) und häufige 0,00-%-Meldungen. Test **E12**
(Kunstfall mit lauter gleichen Werten).

**E13 — Rangregel ohne Gleichstand (A, nur Randfälle).** Auch bei gleichem Anteil, Fenster und Mindestzahl unterscheidet
sich „Anteil strikt kleiner ≥ 0,9“ von „≥ Perzentil mit linearer Interpolation“ (`zehntel.js:14-17`): 179,05 ist bei
Werten 0…199 in der App oben, in der Messung Mitte (p90 = 179,1); unten ebenso. Test **E13**.

**E14 — Short-Seite (A).** Die App gibt für das untere Fünftel „verkaufen“ aus (`drift.js:143`, `:271`), und das Buch
bucht einen Leerverkauf (`mfhandel.js:546-550`). In der Messung geht das unterste Zehntel nur in die Größe A ein; das Buch
der Stufe 2 kauft ausschließlich das oberste Zehntel (A7). Die halbe App-Position ist ungemessen. Test **E14**.

**E15 — Universum (A).** Messung: Klassen 50–250 / 250–1000 / ab1000 Mio $ Median-Tagesumsatz (`konfig.js:31`,
`ereignisse.js:82-88`, Klasse über 60 Vortage, Prüfstand `konfig.js:101-102`); die Vergleichsmenge sind alle Melder dieser
Klassen. App: alle Werte des Mittelfrist-Bestands `daten.roh`, die Termine im Archiv haben (`mfdepot.js:476-481`); die
Umsatzspalte wird nie gelesen. Folge: andere Grundgesamtheit (nur der Bestand, vorwiegend Großwerte), damit andere
Zehntelgrenzen und andere Positionen. Test **E15**: ein Wert mit 10 Mio $ Tagesumsatz (Klasse 5-50, nicht im Universum)
wird gekauft.

**E16 — Mindestlänge (B).** App: Reihe mit mindestens 100 Balken insgesamt (`drift.js:100`) — im Rückblick einschließlich
der Zukunft. Messung: 250 Vortage am Stichtag (`pruefstand.js:118`, `MIN_VORTAGE`). Ein Ereignis nach 145 Balken Vorlauf
handelt die App; in der Messung ist der Wert nicht im Universum. Live (`heute`) betrifft das nur junge Werte. Test **E16**.

**E17 — Gegenprobe Termine in der Zukunft (kein Unterschied).** Ein Termin nach dem letzten Kurstag mit Zahlen erzeugt in
`ereignisse` kein Ereignis (`drift.js:108`), `paareAktuell` lehnt ihn mit fester Uhr ab (`:229-232`); eine Meldung am
letzten Tag nach Schluss wartet auf den nächsten Balken — wie in der Messung, deren Einstieg die nächste Eröffnung ist.
Test **E17**.

**E18 — Doppelte Termine (B).** `mische` erkennt Dubletten nur am UTC-Datum (`driftui.js:34-45`). Trägt dieselbe Meldung
zwei Stempel an verschiedenen UTC-Tagen (tiefer Kalender 16:05 EDT = 20:05 UTC; frischer Teil `earningsCallDate` 20:00 EDT
= 00:00 UTC des Folgetags, `driftui.js:83`), entstehen zwei Ereignisse am selben Reaktionstag: die Vergleichsmenge zählt
die Meldung doppelt, `heute` listet zwei Zeilen (das Buch eröffnet dank „schon im Buch“ nur eine). Bei gleichem UTC-Datum
gewinnt der ältere Eintrag mit Zahlen — auch wenn er nur ein Datum ohne Uhrzeit trägt (verstärkt E4). Messung: eine
Hauptmeldung je Tafelzeile (`zuordnung.js:13-16`, `:60-82`) und je Reihe und Tag höchstens ein Ereignis
(`ereignisse.js:93-95`). Test **E18**.

**E19 — Markt-Index-Abbildung (C).** Die App legt jedes Ereignis auf den Index der SPY-Reihe (`drift.js:96`, `:109-111`)
und verwirft es, wenn der Tag dort fehlt. Im Takt kommt die SPY-Reihe aus `drift_markt` (`mfdepot.js:70-76`), die nur
der Drift-Tab schreibt und bis zu 20 Stunden zwischenspeichert (`driftui.js:132`). Hinkt sie dem Kursbestand einen Tag
nach, fällt das jüngste Ereignis bis zur nächsten Auffrischung heraus, und `seitTagen` zählt gegen die alte Reihe.
Messung: ein Panel-Kalender für alles. Test **E19**.

## Nicht geprüft / Grenzen dieser Durchsicht

- Zuordnung Meldung → Quartal (`zuordnung.js`) gegen `paareAktuell` (`drift.js:226-249`, Abstand ≤ 120 Tage nach
  Quartalsende) nur im Text verglichen: die Quellen (SEC gegen Yahoo) sind nicht deckungsgleich, ein Kunstvergleich hätte
  nur die eigene Annahme geprüft.
- Haltedauer, Kosten, Platzzahl und Buchwert gehören zu Teil 2 und 3; E7 und E14 berühren das Buch nur, soweit Auswahl und
  Einstiegstag betroffen sind.
- Der Rückblick im Drift-Tab (`drift.js` `durchlauf`) teilt `ereignisse`/`zuordnen` mit `heute`; jeder Fund in E8–E13,
  E15, E16 und E18 gilt dort ebenso (Anzeige, B).
