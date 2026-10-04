# Live gegen Messung: das Ergebnis-Drift-Buch (Oktober 2026)

## Kurzfassung

1. **Nein, das Drift-Buch handelt nicht wie gemessen.** Es handelt nicht die Regel der Messung Nr. 88. Gemessen ist: oberstes **Zehntel** einer Überraschung aus den Bilanzzahlen, **nur Kauf**, 40 Plätze, Rest in SPY. Die App handelt **oberstes und unterstes Fünftel** einer Yahoo-Konsens-Überraschung, **mit Leerverkauf**, jede Position zu 5 % des Buchwerts und den Rest als Bargeld (E1, E8, E14/K8, K1, K2).
2. **Das freie Geld liegt bar statt in SPY (K2, A).** Steigt der Markt um 10 % ohne Signal, steht die App bei 100.000 $, die Messung bei 110.000 $. Im Messfenster lagen im Mittel 10,5 % des Kapitals außerhalb der Aktien.
3. **Die Leerverkäufe sind fast kostenfrei gebucht (K10, A).** Die Kosten stecken im Einstand, und `2 × Einstand − Kurs` macht daraus einen Gewinn: ein Umlauf kostet 0,01 $ statt 9,99 $.
4. **Der Kurs ist falsch (E3/K4, E2/K5, A).** Die App kauft und verkauft zum jüngsten **Schluss**, die Messung zur **Eröffnung**. Bei einer Meldung während des Handels kauft die App den Schluss desselben Tages, die Messung erst die Eröffnung des nächsten.
5. **Ein- und Ausstieg hängen an der Uhr des Takts statt am Handelstag (K6, K11, K12, E7/K13, A).** Gehalten wird 86,9 Kalendertage (Tag 61 bis 63) statt 60 Handelstagen. Nach einer Pause der App wird zum Kurs des Takts gehandelt. Signale älter als 5 Handelstage verfallen. Was in der Messung mangels Platz verfiel, kauft die App bis zu 5 Tage später nach.
6. **Auswahl (E8–E13, A):** Die Vergleichsmenge ist anders: 120 Tage einschließlich des Meldetags, mindestens 40, gegen 63 Tage davor, mindestens 200. Gleichstand landet auf der Leerverkaufsseite. Die Reihenfolge der Käufe richtet sich nach der Schlüsselfolge statt nach Annahmezeit, Überraschung und Kürzel (K3). Ob gekauft wird, hängt sogar von der alphabetischen Reihenfolge ab (E11).
7. **Weitere Abweichungen (A):** Das Universum ignoriert die Umsatzklassen; im Test wird ein Wert mit 10 Mio $ Tagesumsatz gekauft (E15). Die Kosten sind einheitlich 10 Bp statt je Klasse plus SPY-Handel (K7). Eine Insolvenz bucht die App fünf Balken später zum letzten Schluss statt am nächsten Handelstag zu 0 (K9).
8. **Anzeige (B):** An den sichtbarsten Stellen stehen alte Belege: „+10,44 % p. a., t = 3,04", „8,44 statt 14,07 % p. a.", „t 1,7–2,0", „oberstes Fünftel", „es braucht beide Beine" (T1–T4, T6). „Neu rechnen" nennt jedes t ≥ 2 „überzufällig" (T5). Das Urteil der Stufe 1, „nicht entscheidbar", steht nirgends in der App.
9. **Was stimmt:** die Rückblick-Zeile (alle 10 Zahlen gegen `ergebnis.json`) mit dem Satz „nicht die Regel dieses Buchs" an beiden Stellen; der Vergleich der Karte mit dem SPY-Gesamtertrag; keine doppelte Firma; Ausschüttungsanspruch über Nacht, Splits, kein Kredit; gleicher Betrag je Kauf am Tag (T7–T10, K15–K19, E6, E17).
10. **Folge:** Die App hat das bereits gesagt (BUCH_SATZ: „seine eigene Regel … ist nicht gemessen"). Diese Durchsicht macht daraus 41 belegte Einzelabweichungen. Ein Buch, das die Messung nachspielt, wäre eine Neufassung von `drift.js`/`driftAbgleich`, kein Flicken. Diese Entscheidung liegt bei Wilhelm und dem PM.
11. Tests: `node pruefberichte/live-gegen-messung-drift.test.js` → **52 Tests: 41 ZEIGT ABWEICHUNG, 11 kein Unterschied, 0 defekt** (Stand main `61dca2c`).

*Simulation mit virtuellem Kapital. Keine Anlageberatung. Kein App-Code geändert.*

---

## Auftrag und Vorgehen

Gefragt war: Handelt die App so, wie die Messung gerechnet hat? Das Soll ist die gemessene Regel `studien/vorregistrierung-2026-10-04-ergebnis-drift/`: VORREGISTRIERUNG.md Teil A und C, die Rechner `buch.js`, `zehntel.js`, `ereignisse.js` und `konfig.js` sowie die Bausteine der Machbarkeit `studien/ergebnis-drift-ereignis-2026-10-04/` (`zeit.js`, `ueberraschung.js`, `zuordnung.js`). Das Ist ist der App-Code: `drift.js`, `driftui.js`, `main.js` (earnings-fetch), der Drift-Teil von `mfdepot.js` und `mfhandel.js` sowie die Anzeige in `studienurteile.js`, `bestandui.js`, `app-shell.js`, `strategien.js` und `index.html`. Aufbau und Strenge folgen `pruefberichte/live-gegen-messung-momentum.test.js`.

Die Durchsicht lief in drei Teilen parallel. Jeder Teil hat einen eigenen Bericht mit der Tabelle „Messung (Datei:Zeile) | App (Datei:Zeile) | Abweichung | Bewertung" und einen Absatz je Fund:

| Teil | Bericht | Tests | Ergebnis |
|---|---|---|---|
| 1 Ereignis, Zeitpunkt, Signal | `live-gegen-messung-drift/teil-1-ereignis-signal.md` | `…/teil-1-ereignis-signal.tests.js` (E1–E19) | 17 Abweichungen, 2 Gegenproben |
| 2 Buchführung | `live-gegen-messung-drift/teil-2-buchfuehrung.md` | `…/teil-2-buchfuehrung.tests.js` (K1–K19) | 14 Abweichungen, 5 Gegenproben |
| 3 Anzeige | `live-gegen-messung-drift/teil-3-anzeige.md` | `…/teil-3-anzeige.tests.js` (T1–T14) | 10 Abweichungen, 4 Gegenproben |

Jeder Test läuft mit Kunstdaten auf fester Uhr, ohne Netz und ohne Schlüssel, und druckt genau eine Zeile. Wo es ging, laufen dieselben Kunstdaten durch den Rechner der Messung und durch die Funktion der App. K2 und K11 fahren den Takt von `mfdepot.js` in einer vm-Sandbox. Die Ausgabe ist unter `TZ=UTC`, `America/New_York`, `America/Los_Angeles` und `Pacific/Auckland` gleich. `PRUEF_WURZEL=<Ordner>` prüft einen anderen Stand.

Bewertung: **A** heißt falsches Geld oder falsche Positionen, **B** falsche Anzeige oder Messung, **C** Schönheit.

## Alle Funde, schwerste zuerst

Zeilenangaben beziehen sich auf main `61dca2c`. VR steht für `studien/vorregistrierung-2026-10-04-ergebnis-drift/VORREGISTRIERUNG.md`.

### A: falsches Geld, falsche Positionen

| Kennung | Messung | App | Abweichung (Zahl aus dem Kleinsttest) |
|---|---|---|---|
| E14 / K8 | VR A1, A7 nur Kaufseite; buch.js:48 | drift.js:143, :271; mfhandel.js:517, :548, :563 | Leerverkauf des untersten Fünftels; zahlt Ausschüttungen; bei +20 % ≈ −999 $ auf 4.995 $, wo die Messung nicht handelt |
| K10 | (Folge der App-Rechnung) | mfhandel.js:548, :517, :563 | Kosten des Leerverkaufs heben sich in `2 × Einstand − Kurs` auf: 0,01 $ statt 9,99 $ je Umlauf |
| K2 | VR A7 Start in SPY, Rest und Erlöse in SPY; buch.js:63, :69-73 | mfdepot.js:103-105 `buchInit`; mfhandel.js:519, :547 | Rest bar ohne Ertrag: SPY +10 % ohne Signal → App 100.000 $, Messung 110.000 $ |
| K1 | VR A7 40 Plätze, Buchwert/40; konfig.js:50 | mfhandel.js:499 `budgetAnteil 0.05`, :542-545 | 40 Signale: Messung 40 × 2.500 $, App 20 × 4.995 $ + Rest, 19 verworfen |
| E1 | ueberraschung.js:17-26 (SUE aus der Tafel); ereignisse.js:38 | main.js:161, :248; drift.js:226-249 (Yahoo-Konsens %) | Anderes Signal: im Test kehrt sich die Rangfolge zweier Firmen um |
| E8 | konfig.js:30 Anteil 0,10 | drift.js:40 `anteil 0.20`; driftui.js:260-266 | Fünftel statt Zehntel: das 85. Perzentil kauft die App, die Messung nicht |
| E3 / K4 | VR A4 Kauf zur Eröffnung; buch.js:131 | drift.js:273; mfdepot.js:48; mfhandel.js:536, :548 | Schluss statt Eröffnung: Kauf zu 110 statt 105 (−4,5 % Stück); Kurssprung des Meldetags liegt vor dem Einstieg |
| E2 / K5 | zeit.js:72-79 (nach 09:30 NY → nächster Tag) | drift.js:76-78 (erst ab 20 UTC) | Meldung im Handel: App am Schluss desselben Tags; 390/390 Handelsminuten im Sommer, 330/390 im Winter anders |
| E4 | zeit.js:72-79 mit SEC-Annahmezeit | drift.js:61-78 (04/05:00 UTC → +1 Tag) | Vorbörsliche Meldung ohne Uhrzeit im Stempel: App kauft einen Handelstag zu spät |
| K6 | VR A4 Verkauf nach 60 Handelstagen; buch.js:109 | mfhandel.js:508-509 | Kalendertage × 252/365: Verkauf am 61. statt 60. Handelstag (ohne Feiertage erst am 63.) |
| K11 | VR A7 (Eröffnung des Tages) | mfdepot.js:941; mfhandel.js:497, :508-519 | Nach 3 Tagen Pause: Kauf zu 116 statt 105, Verkauf zu 45 statt 50 (−5.000 $ auf 1.000 Stück) |
| K12 / E7 | VR A7 nur am Einstiegstag | mfhandel.js:530-532 | Signal > 5 Handelstage alt verworfen (die Messung hatte gekauft); ≤ 5 Tage alt zum heutigen Kurs gekauft |
| K13 | VR A7 / buch.js:133, :135 Verfall | mfhandel.js:530, :545 | Was in der Messung verfiel, kauft die App bis 5 Tage später nach |
| K3 | VR A7 Annahmezeit → Überraschung → Kürzel; buch.js:22 | drift.js:121, :281 | Reihenfolge am Tag nach Schlüsselfolge: Messung kauft ZZZ, App AAA |
| E9 / E10 | konfig.js:30 (min 200); zehntel.js:41-43 (E−63…E−1) | drift.js:42 (min 40), :137 (120 Tage incl. Tag) | Andere Vergleichsmenge: Signal, wo die Messung keines hat |
| E11 | VR C1, zehntel.js:38-43 (Tag ausgeschlossen) | drift.js:121, :135-140 | Ereignisse desselben Tags zählen mit: Kauf hängt an der Kürzelreihenfolge |
| E12 / E13 | zehntel.js:14-17, :53 (Perzentil, ≥) | drift.js:140-143 (strikt kleiner) | Gleichstand → „unten"/Leerverkauf statt „oben"; Randfälle kippen |
| E15 | konfig.js:31, ereignisse.js:82-88 (Umsatzklassen) | mfdepot.js:476-481 | Umsatz nie gelesen: Wert mit 10 Mio $ Tagesumsatz wird gekauft |
| K7 | VR A4, C8; konfig.js:37-38 | mfhandel.js:495 | 0,200 Pp je Umlauf statt 0,220 / 0,144 / 0,091 Pp (+ SPY-Handel) |
| K9 | VR A7 Reihenende, buch.js:84-96 | mfhandel.js:426-438 | Insolvenz: Messung 0 $ am nächsten Tag, App 500 $ fünf Balken später |

### B: falsche Anzeige oder Messung

| Kennung | Stelle | Abweichung |
|---|---|---|
| T1 | index.html:2349 | Messkasten „Gemessen ab 2015: +10,44 % p. a. bei t = 3,04" (21.08., vor der Zeitzonen-Korrektur), Nr. 88 nicht genannt |
| T2 | app-shell.js:1252-1257 | i-Fenster: +10,44 %/t 3,04, „oberstes Fünftel", „es braucht beide Beine" (gemessen ist nur die Kaufseite) |
| T3 | app-shell.js:1095 | „8,44 statt 14,07 % p.a." und „beide halten über die volle Historie" (Stand 23.08.) |
| T4 | strategien.js:107, :111-112 | Stand-Chip und Belegstand mit „t = 1,7–2,0" und „+10,44 %"; Stufe 1 der Nr. 88 nirgends in der App |
| T5 | driftui.js:157-172 | „Neu rechnen" zeigt „Ertrag p. a. (marktneutral)" und nennt jedes t ≥ 2 „überzufällig" (das Tor der Messung liegt bei 2,5) |
| T6 | index.html:2299-2317; driftui.js:278 | Felder „20 %" und „120 Tage" als „(geprüft)", 10 Bp |
| T11 | mfhandel.js:476 | Journal beim Reihenende eines Leerverkaufs: „hätte die Messung 0 gebucht" (die Messung hat keine Leerverkäufe) |
| E16 | drift.js:100 (100 Balken) gegen pruefstand.js:118 (250 Vortage) | Mindestlänge der Reihe |
| E18 | driftui.js:34-45 `mische` (UTC-Datum) | Eine Meldung mit zwei Stempeln → zwei Ereignisse |
| K14 | mfhandel.js:510-514, :433, :562 | Reihe fehlt im Bestand: die Position bleibt offen und steht zum Einstand (10.010 $ statt 8.000 $) |

### C: Schönheit

E5 (Wochenende oder Feiertag ab 20 UTC: ein Tag zu viel, drift.js:55-59/:78), E19 (SPY-Reihe hinkt einen Tag hinterher, das jüngste Ereignis fällt heraus, drift.js:109-111), T12 (Journal: Begründung „jünger als 5 Handelstage" ohne Messung, mfdepot.js:500-501), T13 (Kopfkommentare drift.js:15-31 und mfdepot.js:12-13 mit überholten Belegen, Regel D2), T14 (wiki/belegstand.md:267 „t 1,7–2,0" gegen den eigenen Abschnitt zu Nr. 88).

### Gegenproben ohne Unterschied

E6 (Sommer- und Winterzeit außerhalb der Handelszeit: 4.192 Minuten gleich), E17 (Termine in der Zukunft erzeugen kein Signal), K15 (schon gehaltene Firma), K16 (Ausschüttungsanspruch über Nacht), K17 (Split), K18 (kein Kredit), K19 (gleicher Betrag je Kauf am Tag), T7 (Rückblick-Zeile = `ergebnis.json`), T8 (BUCH_SATZ an beiden Stellen), T9 (Karte gegen den SPY-Gesamtertrag), T10 (Kennzeichnung „short" im Bestand).

## Lesart

Die Messung Nr. 88 ist ein Rückblick auf eine **andere** Regel als die des Buchs. Die App sagt das an der Karte selbst: „seine eigene Regel (Kauf und Leerverkauf, 60 Handelstage) ist nicht gemessen". Die Funde unter A sind deshalb keine Fehler einer Umsetzung, die die Messung treffen wollte. Sie sind die vollständige Liste dessen, was an einem Buch zu ändern wäre, das sie treffen soll. Drei davon sind auch nach der eigenen Regel des Buchs falsch und unabhängig von einer Neufassung:

- K10: Die Leerverkaufskosten werden als Gewinn gebucht.
- K6: Die Haltedauer folgt der Kalenderuhr statt den Handelstagen.
- E11: Ob gekauft wird, hängt von der Reihenfolge der Kürzel ab.

Unter B ist das Wichtigste: Die App zeigt an ihren sichtbarsten Stellen Belege vom 21. und 23.08., die nach dem Belegstand nicht mehr gelten, aber nirgends das Urteil der Messung, „nicht entscheidbar".

**Grenzen.** Die Durchsicht ist rein statisch: Kunstdaten und Quelltext, keine echten Kurse und keine Yahoo-Abrufe. Ob die Yahoo-Überraschung in echten Daten anders rangiert als die SUE, ist nur an einem Kunstfall gezeigt, nicht gezählt. ESLint lief nicht (im Container fehlt `node_modules`). Die Tests hängen nicht an `npm test`.
