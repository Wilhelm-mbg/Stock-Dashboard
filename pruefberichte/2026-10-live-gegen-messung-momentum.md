# Prüfbericht: Live gegen Messung — Momentum-Buch (04.10.2026)

Geprüfter Stand: `450daed` (Wiki: Stand v8.45.0). Nur gelesen, nichts geändert. Kleinsttests:
`node pruefberichte/live-gegen-messung-momentum.test.js [Nummer]` (21 Tests: 1–19 mit Kunstdaten, 20–21 auf echten Kennzahl-Dateien aus `studien/`; kein Netz).
**Zweite Fassung:** nach einer Gegenprüfung durch vier unabhängige Durchläufe, einem Vergleich mit der Studie vom
02.09.2026 und einer Suche nach Messdaten. Was sich gegenüber der ersten Fassung geändert hat, steht am Ende.
Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

**Die fünf schwersten Funde**

1. **F1 (A)** Ein teilweise gescheiterter Kursabruf ersetzt den gespeicherten Bestand. Umgeschichtet wird dann auf dem Rest. Gehaltene Werte ohne Daten bleiben eine Periode liegen; fehlen alle, gibt es 0 Orders, und der 63-Tage-Takt beginnt trotzdem neu. Test 1, 2, 17.
2. **F2 (A)** Liefert die Quelle für einen gehaltenen Wert nichts mehr (Übernahme, Delisting), wird er nie verkauft und zum Einstand bewertet. Die Messung bucht ihn am ersten Tag aus. Test 3.
3. **F3 (A, Zusammensetzung)** Die App rangiert auf Kursen **mit** Ausschüttungen, alle drei Messungen auf Kursen **ohne**. Auf echten Stärken reicht 1 Pp Vorsprung an 75 von 116 Stichtagen für einen Tausch an der Grenze; der Ertrag ändert sich laut Modell im Mittel kaum. Test 4, 20.
4. **F4 (A, klein)** Die App kauft zum letzten gespeicherten Balken (bis rund 26 h alt), die Messung zur Eröffnung nach dem Stichtag; das Alter wird nicht gegen die Uhr geprüft. Nach einem vorhandenen Protokoll bringt das dem Buch rund +0,1 Pp im Jahr. Test 5, 6.
5. **F9 (B, entscheidend für Nr. 76)** Die Zeile „Gegen den Markt“ rechnet ab Anlage des Buchs (25.08.), nicht ab der ersten liquiden Umschichtung (um den 23.11.). Der geplante Vorwärtstest liest damit vor allem das Portfolio der alten, breiten Regel. Test 18.

---

## Prüfliste

Messung = Rückblick Nr. 74 und Korb Nr. 78. Die Studie vom 02.09. (Grundlage der Oberflächen-Sätze) hat eine eigene Tabelle unter F10.

| Punkt | Messung | App | gleich? |
|---|---|---|---|
| Universum | alle Aktienreihen des Panels mit den verschwundenen (REGEL §1.2/§1.7) bzw. je Stichtag die 187 umsatzstärksten (Korb-REGEL §1.2 Z. 20–25) | feste Liste mit 193 Namen (`mittelfrist.js:8-20`); mindestens vier liefert Yahoo nicht mehr (HES, BK, MMC, FI, `mittelfrist.js:126-127`); Reihen bis 500 Balken fallen weg (`mittelfrist.js:48`) | nein — bekannt (Nr. 5); neu: 500-Balken-Hürde (F8) |
| Mindestzahl | 100 zulässige Werte (REGEL Teil B Z. 79) | 100 (`liquide.js:35`, `mfhandel.js:90`) | gleich; bei rund 189 lieferbaren Werten bleibt ein Puffer von ~89 (F1) |
| Rangfolge 231 / 21 | `momentumZiel` der App (REGEL §1.2 Z. 17–21) | dieselbe Funktion (`mfhandel.js:45-95`, Stärke Z. 76) | gleich |
| Kurs der Rangfolge | `bSchluss`: Splits und Abspaltungen ja, Ausschüttungen nein (`rueckblick.js:73`; `pruefstand.js:35`; `dividenden.js:4-5`) | Yahoo-adjclose: Splits **und** Ausschüttungen (`mittelfrist.js:41`, `kurse.js:74-75, 96-98`) | **nein (F3)** |
| Lücken in der Reihe | zählt Zeilen, nicht Kalendertage | ebenso; unbrauchbare Kurse verwirft der Lader (`kurse.js:104`) | gleich |
| Liquiditätsfilter | Dollar-Umsatz roh, 20 Balken | adjclose × Stück, 20 Balken (`liquide.js:54`) | fast gleich (unter 1 %, wirkt nur an der Schwelle) |
| Haltedauer: Zählung | 63. Panel-Handelstag nach dem Ausführungstag (`rueckblick.js:210`, REGEL §1.3 Z. 34) | SPY-Balken mit Stempel nach der **Uhrzeit** der letzten Umschichtung (`mfhandel.js:179`, `mfdepot.js:152, 166`) | **nein (F6)**: auf der Uhr 62 oder 63; stockt, solange die SPY-Reihe nicht aufgefrischt wird |
| Auslöser | Kalender des Panels | Takt alle 30 min und 12 s nach dem Start (`mfdepot.js:584-585`), wenn fällig und Buch an; Knopf „jetzt umschichten“ handelt sofort und setzt den Takt neu (`mfdepot.js:163-166, 578`) | anders (Knopf: C) |
| doppelt / gar nicht | — | zwei Takte am Tag: kein zweiter Handel (Test 15). `zuWenig`: nächster Takt versucht es neu, wie die Messung am nächsten Tag (REGEL Z. 35). App tagelang aus: Umschichtung beim nächsten Start, der Takt verschiebt sich dauerhaft. Teilausfall: Umschichtung mit 0 Orders zählt als volle (F1) | teils |
| Zeitzone / UTC-Grenze | Tag = Mitternacht UTC (REGEL Teil C.2) | Verlaufspunkt je UTC-Tag (`mfdepot.js:235-236`); Fälligkeit über ms-Stempel | kein eigener Fund; die Tageszeit wirkt über F5 und F6 |
| Feiertage | Panel-Handelstage | Balken der SPY-Reihe | gleich |
| Handelskurs | Eröffnung des Ausführungstags (`rueckblick.js:187`, REGEL §1.3 Z. 32) | letzter Balken des Tagesbestands (`mfdepot.js:45, 165`) | **nein (F4)** |
| Alter des Kurses | Kurs desselben Tages | 7 Tage, gemessen am jüngsten Balken **desselben** Bestands (`mfdepot.js:153`, `mfhandel.js:52-53, 68`); Nachladen erst ab 26 h (`mfdepot.js:66`) | **nein (F4)** |
| Kosten je Seite | 20 Bp (`rueckblick.js:18`) | 20 Bp (`mfdepot.js:165`) | gleich (Test 14) |
| Bargeld | `fuehreAus` der App | dieselbe Funktion; Verkäufe vor Käufen; vier Stellen | gleich; in 20.000 Zufallsfällen nie negativ (Test 13); Kleinstpositionen bekannt (Nr. 1) |
| Ziel ohne Kurs | nicht gekauft (REGEL §1.3 Z. 32–33) | kommt nicht vor: jedes Ziel hat seinen letzten Balken | gleich im Ergebnis |
| Position ohne Kurs | Umschichtung: gehalten. Bewertung: **letzter Schluss, nie Einstand** (REGEL §1.3 Z. 36, `rueckblick.js:226-234`) | Umschichtung: gehalten (`mfhandel.js:108`). Bewertung: **Einstand** (`mfhandel.js:168`) | **nein (F1, F2)** |
| Wert verschwindet | am ersten Tag ohne Zeile ausgebucht: letzter Schluss, 0 bei Insolvenz/Zwangs-Delisting (REGEL §1.4, `rueckblick.js:157-171`) | ohne Daten: zum Einstand, nie verkauft; mit alter Reihe: zur nächsten Umschichtung zum alten Kurs mit Kosten verkauft, nie 0 | **nein (F2)** |
| Leere / halbe Antwort | vollständiges Panel | jeder Fehler endet als „weg“; geschrieben wird trotzdem (`mittelfrist.js:98, 116-123`), gezählt erst danach (`:139`) | **nein (F1)** |
| Zeitraum des Vergleichs | Buch und SPY starten am selben ersten Ausführungstag, beide mit der gemessenen Regel (REGEL §1.6, §1.8) | ab Anlage des Buchs (`mfdepot.js:353`: `angelegt`), auch über Zeit mit alter Regel oder mit ausgeschaltetem Buch | **nein (F9)** |
| Gespeicherter Zustand | — | fehlt `letztesRebalanceT` → sofort fällig (`mfhandel.js:177`); Zurücksetzen schaltet das Buch ein (F11); Sicherungsgeneration nur bei unlesbarer Datei, markiert (C) | F11, sonst kein Fund mit Geldfolge |
| Bewertung / Tagesverlauf | Buch und SPY täglich zum selben Schluss (`rueckblick.js:215-236`) | Buchseite des Tagespunkts eingefroren, Marktseite bei jedem Lesen aus der aktuellen SPY-Reihe neu bestimmt (`massstab.js:123-124`, `mfdepot.js:351-353`) | **nein (F5)** |
| Texte `studienurteile.js` | ERGEBNIS.md Nr. 74 | alle 8 Zahlen des Rückblicks stimmen (Test 10) | gleich |
| Texte Oberfläche | belegstand.md, ERGEBNIS.md | alte Zahlen ohne Fundstelle; „exakt die gemessene Konfiguration“ | **nein (F7, F10)** |

---

## Funde nach Schwere

### A — verändert das Ergebnis des Buchs

**F1 · Ein gescheiterter Kursabruf ersetzt den Bestand**
- *Messung:* rechnet jeden Tag auf dem vollständigen Panel (REGEL §1.2). Fehlt einer gehaltenen Reihe die Zeile, gilt ihr letzter Schluss (REGEL §1.3 Z. 36, Klinke `rueckblick.js:234`).
- *App:* `ladeUniversum` beginnt mit leerem `roh` (`mittelfrist.js:98`) und holt 193 Reihen einzeln. Jeder Fehler endet als „weg“: Netzfehler und Zeitüberschreitung (`main.js:48, 60-61`), HTTP 200 mit leerem Körper (`kurse.js:87`), zweimal 429 (`kurse.js:173-176, 202`). Danach wird **immer** geschrieben (`mittelfrist.js:123`), erst dann gezählt (`:139`). Ein Schutz fehlt; Sicherungsgenerationen gibt es nur für `depot` (`main.js:1279`).
- **Zweig Teilausfall (A).** Test 2: 45 Werte ohne Daten → Umschichtung auf 148 statt 193 Werten, Ziel 15 statt 19, 4 Positionen der vollen Rechnung fehlen, 3 alte Positionen ohne Kurs bleiben 63 Tage liegen. Test 17: Fehlen alle 19 gehaltenen Werte (40 Werte vom Listenanfang, z. B. beim Aufwachen), wird mit **0 Ausführungen** umgeschichtet. `letztesRebalanceT` wird trotzdem neu gesetzt (`mfdepot.js:165-166`), das Buch steht eine weitere Periode still. Das Journal widerspricht sich dabei: „0 Orders“ neben „15 Käufe“ (`mfdepot.js:176-178` zählt geplante, nicht ausgeführte Käufe).
- **Zweig Totalausfall (B plus Verzug).** Test 1: Bestand 193 → 0 Werte, Stand „jetzt“. Die fällige Umschichtung wird verschoben, bis der nächste Ladeversuch nach 26 h gelingt (`mfdepot.js:66`); die Messung versucht es bei `zuWenig` ebenfalls am nächsten Tag (REGEL Z. 35). Bis dahin: Bewertung zum Einstand (Kunstdaten: 88.834 $ statt 97.891 $). Jeder neue UTC-Tag in dieser Zeit schreibt einen Tagespunkt zum Einstand, der bleibt. Von den drei Auslöse-Stellen greift keine: `mfdepot.js:69` (Stand gilt als frisch), `:132-135` (`roh = {}` gilt als vorhanden, `:41`), `:157-161` (nur bei fehlenden Stückzahlen).
- *Sichtbar ist es teilweise:* `mfdStatus` zeigt „Kurse vom 1.1.1970“ (`mfdepot.js:493`, `juengster = 0`), die Karte „Ohne frischen Kurs (zum Einstand bewertet)“ (`:534`) und „kein Korb“ (`:516`). `mfStatus` meldet „0 von 193 … vermutlich übernommen oder umbenannt“ (`mittelfrist.js:133-136`) — irreführend, die Ursache ist das Netz. Der Knopf „Daten holen und rechnen“ lädt nach einem Totalausfall neu, nach einem Teilausfall innerhalb von 20 h nicht (`mittelfrist.js:104, 225`).
- *Nicht gemessen:* wie oft das vorkommt. „Yahoo drosselt nach etwa 200 Anfragen“ (`kurse.js:36-38`) ist ein Code-Kommentar, keine Messung. Die Dollarbeträge kommen aus Kunstdaten.

**F2 · Ein verschwundener Wert bleibt zum Einstand im Buch**
- *Messung:* Am ersten Handelstag nach der letzten Zeile wird die Position ausgebucht: zum letzten Schluss, bei Insolvenz oder Zwangs-Delisting zu 0 (REGEL §1.4, `rueckblick.js:157-171`). Das Geld wird in der nächsten Umschichtung angelegt.
- *App:* Liefert Yahoo nichts mehr, fehlt der Wert im neu aufgebauten Bestand (`mittelfrist.js:98, 117-118`) und damit in `preise` (`mfdepot.js:45`, einzige Quelle). `planeUmschichtung` hält ihn (`mfhandel.js:108`) und lässt ihn aus dem Depotwert für die Budgets heraus (`:109`). `bewerte` setzt den Einstand an (`:168`). Einen gezielten Ausweg gibt es nicht: keinen Ersatzkurs, keine Abbildung von Kürzelwechseln, kein Ausbuchen. Es bleibt nur „Alle Bücher zurücksetzen“ (`depot.js:7738-7759`).
- *Szenario* (Test 3; der Gegenprüfer hat es mit echtem Lader und Takt nachgestellt, HES): 100 Stück, Einstand 100,20 $, letzter Kurs 130 $. Nach 3 Umschichtungen steht die Position noch im Buch, bewertet mit **10.020 $**. Die Messung hätte **13.000 $** gutgeschrieben (Übernahme) bzw. **0 $** (Insolvenz).
- *Sichtbar* ist der Zustand als „Ohne frischen Kurs (zum Einstand bewertet)“ (`mfdepot.js:534`) und im Journal (`:182`). Jeder Tagespunkt speichert den Einstandswert (`:232, 241`).
- *Dauerhaft* nur, wenn die Quelle gar nichts mehr liefert. Liefert sie die alte Reihe weiter, fällt der Wert nach 7 Tagen aus der Rangfolge und wird zur nächsten Umschichtung zum alten Schluss mit 20 Bp verkauft, bei Insolvenz nie zu 0 (auf Kunstdaten nachgestellt). Welcher Fall eintritt, ist nicht geprüft; „nichts“ belegt das Repo für HES (`mittelfrist.js:126-127`).
- *Häufigkeit:* In den Läufen mit dem Korb 187 gab es 1 Reihenende je fünf Jahre (Korb-ERGEBNIS Z. 38), im breiten Rückblick 16 (ERGEBNIS Nr. 74 Z. 21). Für die feste App-Liste vermutlich mehr: sie hat schon vier solche Namen.

**F3 · Ausschüttungen stecken live in der Rangfolge, in den Messungen nicht**
- *Messung:* Alle drei Messungen geben Kurse ohne Dividenden an `momentumZiel`. Nr. 74/78: `bSchluss` des Panels (`rueckblick.js:73`, `korb.js:107`). Das Panel bereinigt nur Splits und Abspaltungen (`lesen-panel.js:59, 115-131`, `paneldaten.js:207-214`, `pruefstand.js:35`, ausdrücklich `dividenden.js:4-5, 13-14`). Die Studie vom 02.09. lief auf `archiv1d`, das `kerzenquelle.js:330` mit `bereinigt: false` füllt.
- *App:* `holeTage` lädt mit `bereinigt: true` (`mittelfrist.js:41`), also Yahoo-adjclose mit Dividenden (`kurse.js:74-75, 96-98`). Einen zweiten Weg in die Tagesdaten gibt es nicht (einziger Schreiber `mittelfrist.js:66-70`). Belege aus dem Projekt: SPY über denselben Lader, Kursertrag +16,80 %, aus adjclose +17,39 % (`massstab.js:20-25`); für Einzelaktien „Ölwerte mit hohen Ausschüttungen, die Yahoo einrechnet“ (`pm-korb148/ERGEBNIS-KORB.md:44`).
- *Wirkung:* `(1 + Stärke)` wird mit `1/(1 − Satz)` je Ex-Tag im Fenster multipliziert, absolut also etwa `+(1 + Stärke) · Satz`. Test 4: W107, Kursstärke 1,170 (Platz 13 von 120, Ziel 12), drei Ausschüttungen zu je 1,5 %, bereinigt 1,271 → live im Ziel, W108 raus; in der Messung umgekehrt.
- *Größe, grob gemessen* (Test 20, echte Stärken ohne Ausschüttungen aus `studien/mehrfaktor-2026-09-22/zellen-rueckhalte/momentum.json`, 116 Monatsstichtage 2017–2026, geschnitten mit der App-Liste): Der Letzte im Ziel liegt im Median nur **0,69 Pp** vor dem Ersten draußen. Ein Ausschüttungsvorsprung von 1 Pp im Rückblickfenster reicht an **75 von 116** Stichtagen für einen Tausch (0,5 Pp: 42, 2 Pp: 104). Zum Maßstab: das liquide Universum zahlt rund 1,7 % im Jahr, also ~1,6 Pp im Fenster, das Momentum-Zehntel 0,83 % (`querschnitt-pruefstand-2026-09-13/ERGEBNIS-TEIL2.md:132-134`).
- *Größe, Modell* (Daten-Durchlauf, Streuung der Ausschüttungen angenommen, nicht gemessen): 0,3 bis 1,0 getauschte Namen je Umschichtung, an 26 % bis 70 % der Umschichtungen mindestens einer; zum Vergleich kauft das Buch regulär 8 bis 9 von 19 Namen neu. Die Folgerendite ändert sich im Mittel nicht (0,00 bis 0,10 Pp), streut aber um 0,6 bis 1,1 Pp je Periode. Die Zusammensetzung ändert sich also oft, der Ertrag im Mittel kaum; exakt messbar wäre es mit den Ausschüttungsdateien auf Platte E (`dividenden.js` zeigt, wie man sie liest).
- *Ergänzung zu Nr. 3:* Die Seiten sind vertauscht. Die Messung rangiert **ohne** Ausschüttungen und schreibt sie dem Buch **gut** (REGEL §1.5). Die App rangiert **mit** und schreibt sie **nicht** gut.
- `test-v6.js` Block 34 (Z. 3211-3412) kann das nicht sehen: Beide Seiten bekommen dort dieselben Kursreihen; geprüft werden Formeln, Parameter und Symbolmengen.

**F4 · Gehandelt wird der letzte gespeicherte Balken, nicht die Eröffnung**
- *Messung:* Ziel aus den Schlusskursen des Stichtags, Handel zur Eröffnung des Ausführungstags (REGEL §1.3 Z. 31–33, `rueckblick.js:187-192`).
- *App:* `preise` ist der letzte Balken jeder Reihe im Tagesbestand (`mfdepot.js:45`), zu genau diesem Kurs wird gehandelt (`:165`). Einen zweiten Kursweg gibt es nicht. Der Takt stößt das Nachladen erst ab 26 h an (`:66`) und wartet nicht darauf (`:69`). Der Lader selbst hält Daten nur 20 h für frisch (`mittelfrist.js:104`); dieser Widerspruch lässt die Ladezeit täglich um gut 2 h wandern. Die 7-Tage-Prüfung misst gegen den jüngsten Balken **desselben** Bestands (`mfdepot.js:153`), nicht gegen die Uhr; auch der Knopf prüft das Alter nicht.
- *Wie alt realistisch:* im Takt höchstens rund 26 h (plus Ladezeit). Der Fall mit 31 Tage alten Kursen aus Test 5 ist nur über Sonderwege erreichbar: erster Takt nach dem Start, neues Buch, Zurücksetzen (F11) oder Knopf.
- *Laufende Sitzung (Vermutung):* Lädt die App während der US-Sitzung, ist der letzte Balken kein endgültiger Schluss. Wie Yahoo ihn genau liefert (Stempel, Umsatz), belegt das Repo nicht. `kurse.js:126-130` beschreibt für ein altes Fenster eine angehängte Kerze mit Stempel 20:00 und Umsatz 0. Möglich sind zwei Zeilen am selben Tag; das würde die zeilenbasierten Fenster um eins verschieben. Test 6(b) zeigt nur, dass der Lader innerhalb des Fensters nichts wegschneidet.
- *Szenario* (Test 6a): Lücke von Schluss 100 $ auf Eröffnung 103 $ → die App kauft 998,0 statt 968,9 Stück (+3,0 %).
- *Größe, grob gemessen* (aus einem vorhandenen Protokoll, bisher nirgends zitiert): Für das stärkste Zehntel (231/21) liegt zwischen Schluss und nächster Eröffnung im Mittel **+0,0945 %**, gegen alle Kerzen zentriert **+0,0573 Pp** (`studien/messmaschine/protokolle/momentum-2026-08-26.json:807-815`, Zeile S9, 1.212.217 Fälle, 2.213 überlebende US-Aktien 1986–2026, ohne Fehlerband). Weil die App zum Schluss füllt, bekommt sie diese Lücke bei jedem Neukauf geschenkt. Mit 40–45 % Umschlag je Seite schätzt der Daten-Durchlauf daraus einen Vorteil von rund **+0,02 bis +0,03 Pp je Umschichtung** (etwa +0,1 Pp im Jahr), rund 1–2 % des gemessenen Abstands. Nicht messbar: Füllen einen Tag zu alt oder zum Zwischenstand.
- *Folge:* Der Füllkurs war beim Handel nicht mehr zu haben. Die Richtung ist nach dem Protokoll leicht **zugunsten** des Buchs, die Größe klein.

### B — verändert Anzeige oder Vergleich

**F9 · Der Vorwärtstest misst bis zur ersten liquiden Umschichtung die alte Regel** *(neu, aus der Gegenprüfung)*
- *Messung:* Buch und SPY starten am selben ersten Ausführungstag, beide mit der gemessenen Regel (REGEL §1.6, §1.8; Korb-REGEL §1.1).
- *App:* `vergleich()` übergibt `angelegt`, nicht `liquideSeit` (`mfdepot.js:351-353`); der Zeitraum beginnt am ersten Verlaufspunkt (`massstab.js:131-135`). Laut `studienurteile.js:97-98` ist genau diese Zeile der Vorwärtstest. Die Umstellung auf die liquide Fassung setzt nur `liquideSeit = null` (`mfdepot.js:112-115`); Buch, Verlauf und Positionen bleiben. Den Vorwärtstest datiert die Oberfläche anderswo richtig mit `liquideSeit` (`strategien.js:351-352`, „ab der nächsten Umschichtung“). Dieselbe Zahl lesen Kopf, Bücher-Verlauf und Wochenbericht (`depot.js:4021, 4078-4083`, `berichte.js:424`).
- *Lage laut Wiki (Bestand nicht selbst gesehen):* Das Buch wurde am 25.08.2026 angelegt und gekauft (`wiki/fehlerformen.md:245`, `belegstand.md:86`), vor der liquiden Regel vom 02.09. Die erste liquide Umschichtung ist um den 23.11. fällig. Nr. 76 will „nach der nächsten Umschichtung“ genau diese Zeile ablesen (`wiki/offene-auftraege.md:22`). Die Zahl „+14,7 % seit 25.08.“ (`belegstand.md:48`) ist deshalb kein Vorwärtstest der liquiden Regel.
- *Szenario* (Test 18): Buch bis zur liquiden Umschichtung −5 %, danach genau wie der Markt. Die Karte zeigt **−5,1 Pp**, ab `liquideSeit` gerechnet wären es **0,0 Pp**. Ebenso, wenn ein Buch im Zustand „aus“ angelegt wird (`mfdepot.js:149`): der Gegenprüfer kommt mit 44 Tagespunkten in bar auf −5,0 statt −0,2 Pp.
- *Folge:* Die Zahl, an der Wilhelm über echtes Geld entscheiden will, enthält Monate mit einer anderen Regel. Der alte Zeitraum bleibt dauerhaft darin (bis die 750-Punkte-Grenze ihn abschneidet).

**F10 · Die Studie vom 02.09. misst eine andere Größe als das Buch** *(neu)*
Oberfläche: „exakt die gemessene liquide Konfiguration“ / „das Buch handelt seither exakt diese Konfiguration – jede weitere Umschichtung ist ein Out-of-Sample-Beleg“ (`strategien.js:79, 87`, `app-shell.js:1229`, ähnlich `mfdepot.js:517`, `index.html:2224`). Grundlage ist `studien/vorregistrierung-2026-09-02-momentum-liquide/`.

| Punkt | Studie 02.09. | Buch der App | gleich? |
|---|---|---|---|
| Parameter (231/21/63, 10 %, 100 Mio $, 20 Balken, Median, mindestens 100) | `messen.js:43-44, 188-201` | `momentum.js:44-47`, `liquide.js:32-43` | gleich |
| Universum | `archiv1d`, 2.213 Reihen, nur Überlebende, zuletzt 950 liquide (`messen.js:141-156`, ERGEBNIS Z. 115-124) | 193 Namen | nein |
| Kursbasis | Yahoo-Schluss ohne Dividenden (`kerzenquelle.js:330`) | adjclose mit Dividenden | nein (F3) |
| Gewichtung | gleichgewichtetes Zehntel, jede Periode neu (`messen.js:206-216`) | nur neue Ziele bekommen Depotwert / Zielzahl, Gehaltenes wird nie nachjustiert (`mfhandel.js:116-121`) | nein |
| Kennzahl | Korb minus gleichgewichtetes liquides Universum, brutto, je Periode (`messen.js:212-216`) | Depotwert netto gegen SPY-Gesamtertrag | nein |
| Kosten | brutto; netto nur als Annahme 0,06 / 0,110 Pp (`messen.js:49-51`) | 20 Bp je Seite auf den Umsatz | nein |
| Ein-/Ausstieg | Schluss t / Schluss t+63 (`messen.js:190-194`) | letzter gespeicherter Balken | Konvention gleich, Umsetzung nicht (F4) |

- *Urteil:* Die Sätze stimmen **nur für die Parameter** — genau das hält `test-v6.js` Block 34. Für Universum, Gewichtung, Kursbasis, Kennzahl und Kosten stimmen sie nicht. „Seither“ stimmt auch nicht: das Buch hat die liquide Fassung noch nie gehandelt (F9). Ein „Out-of-Sample-Beleg“ für diese Studie entsteht im Buch nicht: die Studiengröße (Korb minus Universum) wird nirgends festgehalten (`korbVerlauf` speichert nur Zählungen), eine Auswerteregel ist nicht vorregistriert, und eine einzelne Periode streut um rund 8 Pp gegen eine Kante von 1,8 Pp (`lauf-2026-09-01-22-52.json`). Ein Vorwärtstest „Buch gegen S&P 500“ gehört zu Nr. 74/78, die die Buch-Mechanik gemessen haben.
- *Zahlen im Etikett* (`studienurteile.js:90-91`) stimmen alle mit ERGEBNIS.md und den Rohdaten (`urteil5.bruttoLiquide`: 1,83520 / 0,91064 / 2,01528 / 79 / 0,05037 / 3,62003). **Lücke:** `test-v6.js:3395-3404` prüft nur das unsichtbare Feld `zahlen`; angezeigt wird `befund` (`strategien.js:468`), und das prüft niemand. Der Satz in `studienurteile.js:29-30` („eine Zahl, die dort nicht steht, macht die Suite rot“) gilt also nur für das Feld.

**F5 · Im Verlaufspunkt ist die Buchseite eingefroren, die Marktseite nicht** *(ergänzt Nr. 4)*
- *Messung:* Buch und SPY werden täglich zum selben Schluss bewertet (`rueckblick.js:215-236`).
- *App:* Der Tagespunkt entsteht beim ersten Takt des UTC-Tags (`mfdepot.js:235-246`) und hält den Buchwert aus dem Tagesbestand fest; Punkte werden nie berichtigt (`:241, 244`). Die Marktseite wird dagegen bei **jedem** Lesen aus der aktuellen SPY-Reihe neu bestimmt (`massstab.js:123-124`, `marktAn` Z. 46-53: jüngster Balken mit Stempel nicht nach der Punktzeit). Sobald die Reihe nach Börsenschluss aufgefrischt ist, bekommt jeder Punkt den endgültigen Schluss der letzten Sitzung, die vor ihm eröffnet hat — die Buchseite nicht.
- *Szenario:* Start Dienstag 06:00 UTC, Tagesbestand von Montag 08:00 UTC (enthält den Freitagsschluss, gilt mit 22 h als frisch). Die SPY-Reihe wird gegen 06:02 aufgefrischt; ab dem nächsten Lesen vergleicht der Punkt von 06:00 Buch (Freitag) mit Markt (Montag). Test 7: Ein Buch, das genau den Markt hält, zeigt **−2,0 Pp** (die Kunstbewegung einer Sitzung); Gegenprobe mit gleich alten Daten 0,0 Pp. Der Test zeigt den Mechanismus, kein bestimmtes Datum.
- *Häufigkeit (Modell des Gegenprüfers, keine Messung):* Im Dauerbetrieb ist die Buchseite bei etwa 43 % der Tagespunkte eine Sitzung älter, bei 18 % eine Teil-Sitzung, bei 39 % gleich alt. Am Live-Punkt (`verlaufMitStand`, `mfdepot.js:332-342`) sind beide Vorzeichen möglich. Nr. 4 trifft jeden Punkt, der während einer Sitzung entsteht, nicht nur den ersten.
- *Folge:* Auf die Zahl wirken Anfangs- und Endpunkt. Am stärksten betroffen ist der Wochenbericht (`berichte.js:416-424`): er nimmt nur gespeicherte Punkte, also beide Enden.

**F6 · Die Haltedauer hängt an Tageszeit und Auffrischung der SPY-Reihe**
- *Messung:* Der nächste Ausführungstag liegt genau 63 Panel-Tage später (`rueckblick.js:210`).
- *App:* Gezählt werden SPY-Balken mit Stempel nach `letztesRebalanceT = now` (`mfhandel.js:179`, `mfdepot.js:166`). Test 8: Umschichtung um 10:00 UTC → nächste nach 62 Balken fällig, um 15:00 UTC → nach 63. Ob das zwischen den Füllkursen 62 oder 63 Tage sind, hängt am Alter des Tagesbestands (F4).
- Die SPY-Reihe frischt nur `driftui.js` auf (`:124`), und nur über `rechne()`, das mindestens 30 Werte in den Tagesdaten braucht (`:110`). Scheitert der Abruf, bleibt still die alte Reihe (`:121, 123, 126`). Neu versucht wird 90 s nach dem Start und dann alle 6 h (`mfdepot.js:591-596`). Test 9: Solange **jeder** Versuch scheitert, meldet `rebalanceFaellig` nur „nicht fällig“. Ist die Reihe älter als 5 Tage, zeigt die Karte „die bereinigte SPY-Reihe ist zu alt – deshalb der Kursertrag“ (`massstab.js:39, 64, 221, 227`) — ohne Bezug zur Umschichtung; „Nächster Takt“ bleibt unverändert (`mfdepot.js:413-418`).
- *Folge:* Die Umschichtung verschiebt sich. Ein langer Ausfall ist als Szenario nicht belegt.

**F11 · „Alle Bücher zurücksetzen“ schaltet das Momentum-Buch still ein** *(neu)*
- *App:* `depot.js:7753` setzt `D = defaultDepot()`, darin `momentumAn: true` (`depot.js:40`), egal wie der Schalter vorher stand. Die Rückfrage (`depot.js:7745-7749`) nennt das nicht. Der Bestandsschutz für alte Installationen (`depotmigration.js:83-88`) greift hier nicht. Der nächste Takt legt das Buch an, findet es sofort fällig (`letztesRebalanceT` 0) und kauft zu den gespeicherten Kursen (Alter nach F4 nicht geprüft).
- *Messung:* keine Entsprechung.
- *Szenario* (Test 19): Reset → erster Takt → Buch angelegt, 19 Käufe — auch wenn das Buch vorher aus war. Laut Gegenprüfer zeigen Karte und Kopf bis zum nächsten Takt noch den alten Stand, weil `STAND` im Speicher nicht geleert wird (`mfdepot.js:374`).

**F7 · Texte der Oberfläche: Zahlen ohne Fundstelle**
- Ohne Gegenstück in belegstand.md und den beiden ERGEBNIS.md (Test 11): „52 %“ größter Rückschlag (`index.html:2217`, `strategien.js:91`, `app-shell.js:1231`), „8 von 22 Jahren“ (`index.html:2218`, `strategien.js:91`, `app-shell.js:1232`), „2024 lag es bei −0,1 % gegen +7,4 %“ (`app-shell.js:1232`), „+20,3 % p. a. … +5,4 Pp“, „14 von 22 Jahren“, „93 von 96“ (`strategien.js:89-90`). Das sind Zahlen der alten Studie (197 Werte, gegen den Durchschnitt derselben Werte). Neben der Karte mit dem Rückblick (2024: Buch +42,17 %, SPY +24,86 %, ERGEBNIS Nr. 74 Z. 14) liest sich „2024: −0,1 % gegen +7,4 %“ als Widerspruch.
- Zu „exakt die gemessene Konfiguration“ siehe F10.

**F12 · Journalzeilen des Momentum-Buchs fließen in Intraday-Auswertungen** *(neu, Beleg nur im Durchlauf des Gegenprüfers)*
- „Was hat gewirkt?“ (`depot.js:1592-1611`) schneidet die Bewertungsfenster an jeder Journalzeile, auch an `mfrebal-` und `mfkonfig-`, und bewertet sie mit Intraday-Trades. Ein Nachbau zeigt: die Umschichtungszeile bekommt aus 6 Intraday-Trades das Urteil „wirkt“, das Fenster der Autopilot-Änderung davor schrumpft von 11 auf 5 Trades. `renderKlartext` zeigt bei der Intraday-Strategie „Zuletzt eingestellt von … Momentum-Rebalancing“ (`depot.js:5882-5883`).

### C — Randfall ohne Geldfolge

- **F8 · Mindestlänge 500 statt 253.** `holeTage` legt nur Reihen mit mehr als 500 Balken ab (`mittelfrist.js:48`), die Regel rankt ab 253 Zeilen (`mfhandel.js:65`). Test 12: ARM mit 400 Balken landet auf „weg“. *Heute C, historisch nicht:* Test 21 zählt auf echten Stärken 2017–2026, dass 9 junge Werte der App-Liste in ihrem ersten Jahr im Messziel standen, das die App nicht gerankt hätte — **78 Namens-Monate an 36 von 116 Stichtagen** (MDB, OKTA und NET je 12, CRWD 10, ARM 5 …). Für den Vergleich Buch gegen Rückblick zählt das; im Betrieb wirkt es erst wieder bei einer Neuaufnahme in die Liste. *Ergänzt Nr. 5.*
- **F13 · Speichern scheitert für einen Teil** (Platte voll; Test 16): Der Index meldet „frisch“, ein Teil trägt noch 13 Tage alte Reihen. 25 Werte fallen als „veraltet“ aus der Rangfolge, eine gehaltene Position würde zu 104,75 $ statt 115,22 $ verkauft. `tagesdatenSchreiben` prüft die Rückgabe von `storeSet` nicht (`mittelfrist.js:66-68`).
- **Rückfall ohne adjclose:** Fehlt adjclose, nimmt `kurse.js:96-99` still den Schluss, und `holeTage` verwirft das Feld `feld`. Weil Yahoo-Schlusskurse schon splitbereinigt sind, rangiert der Wert dann nur ohne Ausschüttungen — F3 innerhalb derselben Rangfolge. Ob Yahoo adjclose je weglässt, ist nicht geprüft.
- **Knopf „jetzt umschichten“** bei eingeschaltetem Buch: handelt ohne Rückfrage und setzt den 63-Tage-Takt neu (`mfdepot.js:163-166, 572-578`).
- **Reihenende mit Kosten:** Liefert die Quelle die alte Reihe, verkauft die App mit 20 Bp; die Messung bucht ohne Verkaufskosten aus (REGEL §1.4).
- **Wochenbericht ohne `an`** (`berichte.js:424`): ein abgeschaltetes Buch bekommt dort eine Prozentzahl, während Kopf und Karte „aus“ zeigen.
- **Diagnose-Export** (`diagnose.js:224-226`): Die Reihe enthält den abgelegten SPY-Stand (Kursertrag), die App rechnet mit Gesamtertrag. Wer extern vergleicht, bekommt eine andere Zahl.
- **`tools/sicherung.js --einspielen` bei laufender App** (Vermutung, nicht in Electron geprüft): prüft nicht, ob die App läuft (`:131-155`). Das nächste Speichern überschreibt das eingespielte `depot.json`, das eingespielte alte `drift_markt.json` bleibt und wird bis zur nächsten Auffrischung gezählt.
- **Code-Kommentare gegen Regel D2:** `mfhandel.js:4` („die zwei am besten belegten Effekte“, +5,4 Pp) und `depot.js:39` („die belegten Mittelfrist-Bücher“). In der Oberfläche steht das nicht.
- **Hinweis, kein Fehler:** `studienurteile.js:102-103` nimmt „nur einen zweifach gerechneten Rückblick“ auf. Mit Nr. 78 (B-187 „bestätigt die Vorab-Rechnung“) ist das für den Korb 187 erfüllt; der Eintrag fehlt. Das entscheidet der PM.

### Ergänzungen zu den bekannten Punkten

- **Nr. 3 (Ausschüttungen):** Die Seiten sind vertauscht, siehe F3.
- **Nr. 4 (erster Punkt des Maßstabs):** Es trifft jeden Punkt, der während einer Sitzung entsteht, und die Buchseite ist zusätzlich eingefroren (F5).
- **Nr. 5 (Liste ≠ Korb):** 193 Namen, mindestens vier liefert die Quelle nicht mehr (`mittelfrist.js:126-127`). Laut `studien/datenfundament-2026-10-04/t1-reihen.json` enden im Panel zusätzlich AVB (14.08.2026) und EQR (17.08.2026), Gruppe „abgang“ — ob Yahoo sie noch liefert, ist nicht geprüft; wenn nicht, gilt für sie F2. Dazu die 500-Balken-Hürde (F8). Bei Teilausfall schrumpft das Ziel weiter (Test 2: 15 statt 19). Grob gemessen teilen das Ziel aus der App-Liste und das Ziel aus den 187 größten Werten (nach Marktwert, Ersatz für den Umsatz-Korb) im Mittel nur rund 10 von 19 Namen (Daten-Durchlauf).

---

## Gegenprüfung: was sich gegenüber der ersten Fassung geändert hat

Vier unabhängige Durchläufe haben F1 bis F6 angegriffen, einer hat die Stellen außerhalb von `mfdepot.js`/`mfhandel.js` gesucht, einer die Studie vom 02.09. verglichen. **Widerlegt wurde keiner der Funde; ein falsches Zeilenzitat wurde nicht gefunden.** Korrigiert:

- **F1:** Beim Totalausfall wird die Umschichtung **verschoben** (bis rund 26,5 h), sie fällt nicht aus; dieser Zweig ist B plus Verzug. Neu und schwerer: die Umschichtung mit 0 Orders setzt den Takt neu (Test 17). Ergänzt: dritte Auslöse-Stelle, Knopf, sichtbare Spuren.
- **F2:** Ursache `mittelfrist.js:98` ergänzt; „kein Ausweg“ → „kein gezielter Ausweg“; „dauerhaft“ nur, wenn die Quelle nichts liefert.
- **F3:** Formel berichtigt, stärkerer Beleg (`ERGEBNIS-KORB.md:44`), gilt gegen alle drei Messungen; Schwere als „A (Zusammensetzung), Ertragswirkung unbelegt“.
- **F4:** Der 31-Tage-Fall ist nur über Sonderwege erreichbar, realistisch höchstens rund 26 h. Die Form des Sitzungsbalkens ist Vermutung; Test 6(b) ist kein Beleg dafür.
- **F5:** Mechanismus umgeschrieben (eingefrorene Buchseite, nachträglich neu gelesene Marktseite), Szenario richtiggestellt, Wochenbericht ergänzt.
- **F6:** Neuversuch alle 6 h und Hinweis „zu alt“ ab 5 Tagen ergänzt; „nie“ gilt nur, solange jeder Versuch scheitert.
- **Neu:** F9 bis F13.
- **Gemessen statt vermutet:** Größe von F3 (Test 20), F4 (Protokoll S9) und F8 (Test 21) auf echten Kennzahl-Dateien.
- **Verworfen:** ein Zusatztest, der bei fehlendem adjclose einen unbereinigten Split annahm. Yahoo-Schlusskurse sind splitbereinigt; übrig bleibt die Randnotiz unter C.

---

## Nicht geprüft

- **Electron nicht gestartet.** `mittelfrist.js`, `mfdepot.js` und `studienurteile.js` liefen in einer vm-Sandbox mit Attrappen für Speicher, Kursabruf und `U`. Echtes IPC habe ich gelesen, nicht ausgeführt; das Verhalten der Zeitgeber beim Aufwachen aus dem Ruhezustand ist nicht geprüft.
- **Echte Yahoo-Antworten** nicht geprüft (Abruf verboten): ob für übernommene Werte nichts oder die alte Reihe kommt (F2); wie der Balken der laufenden Sitzung aussieht (F4); ob adjclose je fehlt.
- **Größe von F3 und F4:** nur grob gemessen (Kennzahl-Dateien in `studien/`, siehe dort). Exakt bräuchte es die Ausschüttungsdateien (`alpaca-massnahmen/`) und Tageskurse mit Eröffnung (`archiv1d`) — beide auf Platte E, nicht in diesem Container. F1, F5, F6 bräuchten den echten App-Bestand mit Zeitstempeln.
- **Echter App-Bestand** (`depot.json`) nicht gesehen. Die Aussagen zum Stand des echten Buchs (gekauft 25.08., noch keine liquide Umschichtung) stammen aus dem Wiki.
- **Drift-Buch** (`driftAbgleich`) — außerhalb des Auftrags.
- **Wiki:** Einen Abschnitt „Live driftet von der Messung weg“ gibt es in `wiki/fehlerformen.md` unter diesem Namen nicht. Gelesen habe ich die Formen-Tabelle, „Die Notlösung für Cent-Beträge …“, „Der Tagesbalken trägt den Stempel …“ und `wiki/messmethodik.md` Punkt 11.
- **Testlauf:** `node test-channel.js` grün. `node test-v6.js` hat schon **vor** meiner Arbeit Fehlschläge, lokal 7 (im allerersten Lauf 8), in der CI 5 — auf `main` (`450daed`) dieselben 5 mit demselben Wortlaut. Die Ursachen habe ich nicht untersucht; ein Teil ist sichtbar umgebungsbedingt. Bestehende Dateien habe ich nicht geändert. `npx eslint .` ohne Fehler; die Testdatei ist zusätzlich mit den strengen Regeln des Repos (`no-undef` u. a.) sauber.
