# Prüfbericht: Live gegen Messung — Momentum-Buch (04./05.10.2026)

Geprüft: `450daed` (Runden 1–2) und der heutige main `61dca2c` (Runde 3, nach den Umbauten Nr. 85–96). Tests: `pruefberichte/live-gegen-messung-momentum-runde2.test.js` (Tests 16–34, gegen main) und die übernommene Abnahme-Datei `pruefberichte/live-gegen-messung-momentum.test.js` (1–15). Simulation, keine Anlageberatung.

**Die fünf schwersten Funde auf dem heutigen main**

1. **M1 (A, selten, je Fall groß)** Fällt der Ex-Tag eines Splits auf den Ausführungstag, verkauft die App die alte Stückzahl zum schon geteilten Kurs; der Split wird nie nachgebucht (Kunstfall: −6,25 % des Buchs). Test 26.
2. **M2 (A)** Fehlt beim Umschichten die Eröffnung gehaltener Werte, fallen die Käufe mangels Geld aus und werden nie nachgeholt; das Geld liegt eine Periode (im Extrem 0 von 19 Zielen, 97.607 $ in bar). Test 24, 29, 30.
3. **M5 (A, künftig)** Werte, die die Quelle nicht mehr liefert, behalten ihre alte Reihe und zählen gegen die 95-%-Schwelle. Ab dem zehnten solchen Wert schichtet das Buch nie mehr um. Test 31.
4. **F9 (B, entscheidend für Nr. 76)** „Gegen den Markt“ rechnet ab Anlage des Buchs (25.08.), nicht ab der ersten Umschichtung mit der liquiden Regel; laut Wiki liest der Vorwärtstest damit vor allem die alte Regel. Test 18, 23.
5. **M3 (A, klein, systematisch)** Eine Ausschüttung auf eine Position, die zur Eröffnung des Ex-Tags verkauft wird, geht verloren; die Messung schreibt sie gut. Test 28.

---

## Lage

Die erste Fassung (Stand `450daed`) fand fünf schwere Abweichungen (F1–F5). Eine zweite Runde mit sieben unabhängigen Durchläufen bestätigte sie, präzisierte sie und fand F9–F13. Noch während der zweiten Runde hat main mit Nr. 85, 87, 91, 93, 94, 95 und 96 das Buch umgebaut und meine Testdatei als Abnahme übernommen (Nr. 93 Teil 4a). Auf main meldet diese Abnahme bei den Tests 1–10 und 12–15 „kein Unterschied“; F1–F6 und F8 sind dort behoben. Diese dritte Fassung prüft deshalb main: was von der zweiten Runde noch steht, und was der Umbau neu eingebracht hat. Die ausführliche zweite Fassung zu `450daed` steht im Commit `0425152`.

Zwei Durchläufe arbeiteten an main: einer prüfte jeden Fund der zweiten Runde und portierte die Tests, einer griff den Umbau an. Ich habe jeden Beleg selbst laufen lassen und die tragenden Fundstellen nachgelesen.

---

## Prüfliste auf main (`61dca2c`)

Messung = Rückblick Nr. 74 (`studien/massstab-rueckblick-2026-10-04/REGEL.md`, `rueckblick.js`) und Korb Nr. 78; Regel K misst `studien/momentum-korb-kleinst-2026-10-04/REGEL.md`.

| Punkt | Messung | main | gleich? |
|---|---|---|---|
| Kurs der Rangfolge | `bSchluss`: Splits, keine Ausschüttungen | Spalte 1 = roher, splitbereinigter Schluss (`mittelfrist.js:71-77`) | gleich (Abnahme-Test 4) |
| Stichtag, Füllkurs | Schluss des Stichtags, Handel zur Eröffnung (REGEL §1.3) | Eröffnung roh (`mfdepot.js:266`), laufender Balken bleibt draußen (`mittelfrist.js:81`) | gleich (Test 6) |
| Haltedauer | 63. Panel-Tag nach dem Ausführungstag | 63. SPY-Balken nach dem Ausführungstag (`mfhandel.js:343`) | gleich (Test 8); aber still verspätet bei SPY-Ausfall (M6) |
| Ladeschutz | vollständiges Panel | Bestand wird nur ersetzt, wenn mindestens 95 % geliefert sind (`mittelfrist.js:159-166, 225-238`); Stichtag nur mit 95 % Kursen (`mfhandel.js:354-370`) | gleich im Ergebnis (Test 1, 2); tote Reihen zählen mit (M5) |
| Splits und Ausschüttungen | im Maßstab des Panels; Ausschüttung gutgeschrieben, wer über die Nacht vor dem Ex-Tag hielt (REGEL Teil C.3) | gebucht bis zum letzten Balken im Bestand (`mfhandel.js:611-617`), vor dem Planen (`mfdepot.js:384`) | **nein am Ausführungstag** (M1, M3) |
| Reihenende | am ersten Tag ohne Zeile ausgebucht, 0 bei Insolvenz (REGEL §1.4) | nach 5 Handelstagen zum letzten Schluss, nie 0 — offengelegte Abweichung (`mfhandel.js:418-426`) | Preis gleich (Test 3); Platz leer, wenn es in diese 5 Tage fällt (M2) |
| Fehlende Eröffnung | im Panel hat jede Zeile ihre Eröffnung | Nachfassen bis 16:00 New York, nur für Werte ohne Kurs (`mfhandel.js:744-760`) | **nein** (M2, M4) |
| Vergleich mit dem Markt | Buch und SPY starten am selben ersten Ausführungstag mit der gemessenen Regel (REGEL §1.6, §1.8) | ganzer Verlauf ab Anlage (`mfdepot.js:633-641`, `massstab.js:209-211`) | **nein** (F9) |
| Kosten, Bargeld | 20 Bp, Verkäufe vor Käufen | dieselben (Test 13, 14) | gleich |
| Texte | ERGEBNIS.md, belegstand.md | „exakt“ ersetzt durch „Parameter wie gemessen“; „Seit 02.09.2026 handelt das Buch …“ und „Out-of-Sample-Beleg“ stehen noch (F10); alte Zahlen als „überholt“ markiert (F7) | teils |

---

## Funde auf main nach Schwere

A = verändert, was das Buch kauft, verkauft oder wie es bewertet. B = verändert Anzeige oder Vergleich. C = Randfall, selten oder klein. Alle Fundstellen „main“ beziehen sich auf `61dca2c`.

### A

**M1 · Split mit Ex-Tag am Ausführungstag** *(neu auf main)*
- *Messung:* Eröffnung und Stückzahl stehen im selben bereinigten Maßstab (`rueckblick.js:189-195`, `pruefstand.js:38`).
- *main:* Gebucht wird nur bis zum letzten Balken im Bestand (`mfhandel.js:617`: `t <= bis`). Der Balken des Ausführungstags fehlt, weil der laufende Balken abgeschnitten wird (`mittelfrist.js:81`). Die Eröffnung kommt roh, also schon geteilt (`mfdepot.js:266`). Geplant und gehandelt wird also mit der alten Stückzahl (`mfdepot.js:422-423`); die verkaufte Position ist danach weg, der Split wird nie nachgebucht.
- *Szenario* (Test 26): 100 Stück, Split 2:1 am Ausführungstag, Eröffnung 48,40 $. Messung: 200 × 48,40 = 9.662 $. App: 100 × 48,40 = 4.831 $ — **−6,25 % des Buchs**. Ein Umkehr-Split auf einem gehaltenen Ziel bläht dagegen Depotwert und Platzwert auf (1:10: Depotwert im Plan 56.867 → 103.739 $).
- *Folge:* dauerhafter Verlust oder Scheingewinn. Selten, je Fall groß; Momentum-Gewinner sind typische Split-Kandidaten.

**M2 · Fehlende Eröffnung gehaltener Werte: die Käufe werden nie nachgeholt** *(neu auf main)*
- *Messung:* Erst wird verkauft, dann mit dem Erlös gekauft; im Panel hat jede Zeile ihre Eröffnung (`rueckblick.js:189-195`).
- *main:* Der Depotwert für die Budgets zählt nur Positionen **mit** Kurs (`mfhandel.js:123-127`). Fehlt die Eröffnung gehaltener Werte, sind die Budgets zu klein, Käufe fallen mangels Geld aus. `offeneAuftraege` merkt sich nur Werte **ohne** Kurs (`mfhandel.js:744-755`), also die Verkäufe. Das Nachfassen verkauft später, kauft aber nichts (`mfhandel.js:777`).
- *Szenarien:* Test 24: um 10:00 New York fehlt die Eröffnung aller 19 gehaltenen Werte → „0 Orders“, um 10:30 werden die Verkäufe nachgefasst, am Ende **0 von 19 Zielwerten, 97.607 $ in bar** für 62 Handelstage. Test 29: ein Wert ohne Eröffnung um 09:36 → ein Ziel fällt aus, 4.990 $ liegen eine Periode, das Journal meldet „Damit ist nichts mehr offen“. Test 30: eine Reihe endet in den fünf Handelstagen vor der Umschichtung → der Verkauf kann nie gefüllt werden, ausgebucht wird erst danach (`mfhandel.js:426, 436`), 5.000 $ liegen bis zur nächsten Umschichtung.
- *Folge:* leere Plätze für ein Quartal, genau in den Fällen, für die das Nachfassen (Nr. 94) gebaut wurde. Wie oft Eröffnungen fehlen, ist nicht gemessen. *Vermutung:* gehaltene Werte werden nach den Zielen abgefragt, eine Drosselung träfe also zuerst die Verkäufe.

**M3 · Ausschüttung auf eine am Ex-Tag verkaufte Position geht verloren** *(neu auf main)*
- *Messung:* „ein Verkauf zur Eröffnung des Ex-Tags zählt noch“ (REGEL Teil C.3, Z. 99; `rueckblick.js:180-184`).
- *main:* Gebucht wird nur auf gehaltene Positionen (`mfhandel.js:611`) und nur bis zum letzten Balken (`:617`), vor dem Handel (`mfdepot.js:384`). Am Ausführungstag fehlt der Balken des Ex-Tags; danach ist die Position verkauft.
- *Szenario* (Test 28): 100 Stück mit 1,00 $ und ein Kleinstbestand (1 Stück, 2,00 $, nach Regel K2 verkauft und neu gekauft) → Messung 102,00 $, App 0 $, auch am Folgetag.
- *Folge:* systematisch gegen das Buch, je Fall klein.

**M4 · Keine Eröffnung bis 16:00: 0 Orders, der 63-Tage-Takt beginnt trotzdem neu** *(Rest von F1)*
- *main:* Der Ladeweg (F1) und der Widerspruch im Journal sind behoben (`mfdepot.js:432-436`). Liefert die Quelle am Ausführungstag aber bis 16:00 New York keine Eröffnungen, endet der Tag mit 0 Orders, und `letztesRebalanceT`/`letzteAusfuehrungTag` werden trotzdem gesetzt (`mfdepot.js:439-440`, Nachfassen bis 16:00: `mfhandel.js:758-760, 816-821`). Test 25: 19 alte Positionen bleiben, nächste Umschichtung erst nach 62 Handelstagen.
- *Messung:* schichtet an diesem Tag auf vollen Daten um.

**M5 · Tote Reihen zählen gegen die 95-%-Schwelle** *(neu auf main; heute vermutlich C, künftig A)*
- *main:* Ein Wert ohne Antwort behält seine alte Reihe für immer (`mittelfrist.js:244-251`). Der Ladeschutz nimmt `weg` aus dem Nenner (`mittelfrist.js:163`), `stichtagPruefen` nicht (`mfhandel.js:366`).
- *Szenario* (Test 31): 189 lieferbare Werte; mit 9 toten Reihen wird umgeschichtet, mit 10 nicht mehr — obwohl der Abruf angenommen wird und `momentumZiel` 179 zulässige Werte hätte. Der Hinweis lautet „Tageskurse nicht frisch genug … Nachladen angestoßen“, Nachladen hilft aber nicht. Vorübergehende Ausfälle zählen gegen dasselbe Budget.
- *Messung:* keine solche Schwelle; veraltete Reihen wirft `momentumZiel` hinaus.
- *Vermutung:* Die schon toten Namen der Liste (HES, BK, MMC, FI; laut Archiv auch AVB, EQR) stehen nicht im Bestand, weil der alte Lader sie vor dem Umbau verworfen hat. Jeder künftige Abgang bleibt dagegen stehen.

**F11 · „Alle Bücher zurücksetzen“ schaltet das Momentum-Buch still ein** *(besteht; selten)*
- *main:* `depot.js:7753` setzt `D = defaultDepot()` mit `momentumAn: true` (`depot.js:40`), die Rückfrage (`depot.js:7745-7749`) nennt das nicht. Der nächste Takt kauft zur Eröffnung, der Vorwärtstest beginnt mit diesem Kauf (`mfdepot.js:447`). Test 19: 19 Käufe, Gegenprobe mit dem vorigen Schalter „aus“: 0. Test 22: bis zum nächsten Takt zeigt die Karte 123.655 $ neben „Buch noch nicht angelegt“, der Kopf +23,66 % für das gelöschte Buch (`STAND` wird nicht geleert).

**F13 · Speichern scheitert für einen Teil: Ausbuchen zum alten Kurs** *(besteht, auf main schwerer; selten)*
- *main:* `tagesdatenSchreiben` prüft die Rückgabe von `storeSet` nicht (`mittelfrist.js:97-117`); der Lader hält den Bestand für frisch. Test 16: Teil 3 ist 14 Tage alt → gehaltene Position FTV als „Reihenende“ zu 104,75 $ statt 115,22 $ ausgebucht; die Umschichtung sperrt die 95-%-Regel.

### B

**F9 · Der Vergleich mit dem Markt beginnt mit der Anlage des Buchs** *(besteht)*
- *main:* `MFDepot.vergleich` gibt den ganzen Verlauf weiter und liest `liquideSeit` nicht (`mfdepot.js:633-641`); der Zeitraum beginnt am ersten Punkt (`massstab.js:209-211`). Laut `studienurteile.js:97-98` ist genau diese Zeile der Vorwärtstest. Das Buch schreibt Tagespunkte auch im Zustand „aus“ (`mfdepot.js:379, 398`).
- *Lage laut Wiki (Bestand nicht eingesehen):* angelegt und gekauft am 25.08.2026, vor der liquiden Regel vom 02.09.; erste Umschichtung danach um den 23.11. Nr. 76 will genau diese Zeile ablesen (`wiki/offene-auftraege.md:22`).
- *Szenario:* Test 18: Buch bis zur liquiden Umschichtung −5 %, danach wie der Markt → Karte **−5,1 Pp**, ab der ersten liquiden Umschichtung **+0,0 Pp**. Test 23 (echte Takte, Buch „aus“ angelegt, 44 Tagespunkte in bar): −5,2 statt −0,2 Pp; Gegenprobe −0,2 = Soll.
- *Richtig wäre:* ab `liquideSeit`, mit dem letzten Tagespunkt davor als Bezug.

**F10 · Studie 02.09.: „Parameter wie gemessen“ stimmt, „Out-of-Sample-Beleg“ nicht** *(verändert)*
- „exakt“ ist ersetzt (`strategien.js:79, 87`, `app-shell.js:1232`, `index.html:2228`). Es bleiben „Seit 02.09.2026 handelt das Buch …“ und „jede weitere Umschichtung ist ein Out-of-Sample-Beleg“ (`strategien.js:87`, `app-shell.js:1232`). Die Studie misst eine andere Größe (gleichgewichtetes Zehntel minus gleichgewichtetes liquides Universum, brutto, `studien/vorregistrierung-2026-09-02-momentum-liquide/messen.js:206-216`), die das Buch nirgends festhält; eine Periode streut um rund 8 Pp gegen eine Kante von 1,8 Pp; eine Auswerteregel ist nicht vorregistriert. Laut Wiki hat das Buch die liquide Fassung noch nicht gehandelt (F9).
- *Testlücke:* `test-v6.js:3397-3404` prüft nur das unsichtbare Feld `zahlen` des Etiketts; dieselben Zahlen stehen als fester Text in `strategien.js:87`, und den prüft kein Test.

**M6 · SPY-Ausfall: Umschichtung still bis zu drei Handelstage verspätet, mit falschem Grund** *(neu auf main)*
- *main:* SPY wird als letzter Wert abgerufen (`mittelfrist.js:215`); scheitert er, wird die alte SPY-Reihe mit neuem Stand geschrieben (`mittelfrist.js:249-251`), ohne Eintrag in „weg“ oder einer Statuszeile. Gezählt wird an dieser Reihe, veraltet gilt sie erst ab vier Werktagen (`mfhandel.js:340-343`). Test 32: fällig am 01.12., umgeschichtet am 04.12. mit „3 Handelstage verspätet (die App lief am fälligen Tag nicht …)“ (`mfdepot.js:457`), obwohl die App lief.
- *Messung:* am 63. Panel-Tag (`rueckblick.js:218`).

**M7 · Bestand während der Sitzung am Ex-Tag eines Splits geladen: falscher Tagespunkt** *(neu auf main; A, wenn am selben Tag gehandelt wird)*
- *main:* `mittelfrist.js:81` zusammen mit `mfhandel.js:617`. Test 27: liefert die Quelle die Vergangenheit schon geteilt und das Ereignis mit dem Stempel des Ex-Tags, wird der Split nicht gebucht, der Kurs aber halbiert: Tagespunkt 5.126 $ statt 10.251 $, dauerhaft. *Vermutung:* dass Yahoo die Historie während der Sitzung des Ex-Tags schon bereinigt, ist nicht geprüft.

**F12 · Journalzeilen des Momentum-Buchs fließen in Intraday-Auswertungen** *(besteht, mehr Zeilenarten)*
- „Was hat gewirkt?“ (`depot.js:1592-1621`) und `renderKlartext` (`depot.js:5881-5883`) behandeln auch `mfrebal-`, `mfkonfig-`, neu `mfmass-`, `mfende-`, `mfoffen-ende-`, `mfnach-` (`mfdepot.js:200, 220, 316, 328`) als Einstellungen der Intraday-Automatik. Belegt nur im Nachbau eines Durchlaufs.

**F7 · Alte Zahlen in der Oberfläche** *(verändert)*
- Die Zahlen (52 %, 8 von 22 Jahren, „2024 −0,1 % gegen +7,4 %“, +5,4 Pp, 14 von 22, 93 von 96) stehen weiter (`strategien.js:89-91`, `app-shell.js:1238-1239`, `index.html:2221-2222`), seit Nr. 91 aber unter dem Kopf „Überholt: gemessen nur an Werten, die es heute noch gibt …“. Abnahme-Test 11 meldet sie erwartungsgemäß.

### C

- **M8 · Ladevorgang über 16:15 New York** (Test 33): `mittelfrist.js:81` schneidet je Wert mit der Uhr dieses Abrufs, `:251` setzt den Stand auf das Ende. Beginnt das Laden 16:14, fehlt den ersten 9 Werten der Balken des Tages; am Folgetag gilt der Bestand als frisch, und die 9 rangieren mit dem Vortag.
- **M9 · Sieben-Tage-Grenze über den Herbstwechsel** (Test 34): Stempel 13:30 UTC im Sommer, 14:30 UTC im Winter (`mfhandel.js:76`); eine Reihe genau 7 Kalendertage hinter dem Stichtag wirft die App hinaus, die Messung (Mitternacht UTC) nicht.
- **V1 · Abspaltungen** (Vermutung, kein Test): Das Panel bereinigt um gemessene Abspaltungen (`pruefstand.js:38`), die App kennt nur Splits und Bardividenden und hat keine Sperre gegen einen Split ohne Kurssprung (das Panel hat eine). Offline nicht prüfbar.
- **Knopf „jetzt umschichten“** bei eingeschaltetem Buch: handelt ohne Rückfrage und setzt den Takt neu (`mfdepot.js:414-418, 439-440`; Rückfrage nur bei „aus“).
- **Diagnose-Export** (`diagnose.js:224-226`): enthält den abgelegten SPY-Stand (Kursertrag), die App rechnet mit Gesamtertrag.
- **`tools/sicherung.js --einspielen` bei laufender App** (Vermutung): prüft nicht, ob die App läuft (`:131-155`).
- **Code-Kommentare gegen Regel D2:** `mfhandel.js:4-6`, `depot.js:39`.

### Was `test-v6.js` auf main nicht abdeckt (laut Durchlauf am Umbau)

Kein Test verbindet einen Ex-Tag mit einem Handel zur Eröffnung (M1, M3) oder einem während der Sitzung geladenen Bestand (M7); keiner enthält einen Split oder Umkehr-Split am Ausführungstag oder eine Abspaltung. 98.1 prüft nicht, dass SPY mit neuem Stand behalten wird (M6), und nicht, dass sich tote Reihen ansammeln (M5). 98.4 prüft keine Umschichtung innerhalb der fünf Tage (M2, Test 30). 98.5 prüft keinen Ladevorgang über 16:15 (M8). 99 prüft keinen offenen Verkauf, der die Käufe unterfinanziert (M2).

---

## Runden 1–2 (Stand `450daed`) und was daraus auf main wurde

| Fund (450daed) | Kern | main |
|---|---|---|
| F1 | gescheiterter Kursabruf ersetzt den Bestand | **behoben** (95-%-Ladeschutz); Rest siehe M4, M5 |
| F2 | verschwundener Wert bleibt zum Einstand im Buch | **behoben** (ausgebucht nach 5 Tagen zum letzten Schluss, nie 0 — offengelegt); Rest siehe M2 |
| F3 | Rangfolge mit Ausschüttungen, Messung ohne | **behoben** (roher Schluss) |
| F4 | Füllkurs = letzter gespeicherter Balken statt Eröffnung | **behoben** (Eröffnung, Nachfassen) |
| F5 | Buch- und Marktwert im Tagespunkt verschieden alt | **behoben** (Nr. 91) |
| F6 | Haltedauer hängt an Uhrzeit und SPY-Auffrischung | **behoben** (Ausführungstag); Rest siehe M6 |
| F7 | alte Zahlen in der Oberfläche | **verändert** (als überholt markiert) |
| F8 | Lader verwirft Reihen bis 500 Balken | **behoben** |
| F9 | Vergleich ab Anlage | **besteht** |
| F10 | Studie 02.09. ≠ Buch-Mechanik, Etikett-Prüfung blind | **verändert** („exakt“ weg), Rest besteht |
| F11 | Zurücksetzen schaltet das Buch ein | **besteht** |
| F12 | Journalzeilen in Intraday-Auswertung | **besteht** |
| F13 | storeSet ungeprüft | **besteht**, schwerer |

**Gemessene Größen (vom Code unabhängig, weiter gültig für den Vergleich mit Rückblicken):**
- *F3* (Test 20, echte Stärken ohne Ausschüttungen aus `studien/mehrfaktor-2026-09-22/zellen-rueckhalte/momentum.json`, 116 Monatsstichtage 2017–2026, App-Liste): Der Letzte im Ziel liegt im Median nur **0,69 Pp** vor dem Ersten draußen; 1 Pp Ausschüttungsvorsprung im Rückblickfenster reicht an **75 von 116** Stichtagen für einen Tausch. Das Universum zahlt rund 1,7 % im Jahr, das Momentum-Zehntel 0,83 % (`studien/querschnitt-pruefstand-2026-09-13/ERGEBNIS-TEIL2.md:132-134`). Ein Modell mit angenommener Streuung ergab 0,3 bis 1,0 getauschte Namen je Umschichtung und im Mittel keinen Ertragsunterschied (nicht im Testskript).
- *F4* (Protokoll, bisher nirgends zitiert): Für das stärkste Zehntel einer verwandten Regel (Fenster 210 statt 231 Tage, tägliche Signale) liegt zwischen Schluss und nächster Eröffnung im Mittel +0,0945 %, gegen alle Kerzen bereinigt +0,0573 Pp (`studien/messmaschine/protokolle/momentum-2026-08-26.json:807-815`). Grob hochgerechnet bekam das alte Buch damit rund +0,1 Pp im Jahr geschenkt.
- *F8* (Test 21): 9 junge Werte der App-Liste standen in ihrem ersten Jahr im stärksten Zehntel der App-Liste (Paneldaten, monatlich, ohne Umsatzfilter), das der alte Lader nicht gerankt hätte — 78 Namens-Monate an 36 von 116 Stichtagen.

---

## Korrekturen gegenüber der zweiten Fassung

Aus der Gegenlesung der zweiten Fassung übernommen (Stand `450daed`, dort mit Commit `0425152` einzusehen):
- Der `befund` des Vorwärtstest-Etiketts wird nicht angezeigt; angezeigt wird der feste Text in `strategien.js:87` (F10).
- Das Übernacht-Protokoll gilt für eine verwandte Regel mit 210-Tage-Fenster, nicht für 231/21 (F4-Größe).
- Ob Yahoos Tagesschluss splitbereinigt ist, ist nicht belegt; der Kommentar in `mittelfrist.js:38-40` (450daed) nahm das Gegenteil an. Das Verwerfen meines Split-Zusatztests war voreilig. Auf main stellt sich die Frage für das Buch nicht mehr in dieser Form (Spalte 1 und Ereignisse kommen aus derselben Antwort).
- Zeilenzitate berichtigt: Kopf `depot.js:4097-4103`, Bestandsschutz `depotmigration.js:87-91`, `SICHERUNG_STORES` `main.js:1278`, Split-Filter `lesen-panel.js:60`; volle Studienpfade.
- F9 betrifft den Wochenbericht nicht (er rechnet nur die letzte Woche); „`angelegt`“ bestimmt in `massstab.js` nur den Bezug, der Zeitraum beginnt in jedem Fall am ersten Punkt.
- Die Zählung der Durchläufe: zweite Runde = drei Gegenprüfungen (F1/F6, F2/F3, F4/F5), eine Suche außerhalb von `mfdepot.js`/`mfhandel.js`, ein Vergleich mit der Studie vom 02.09., eine Datensuche, eine Gegenlesung; dritte Runde = zwei Durchläufe an main, ein Durchlauf zum Portieren der Belege.

---

## Nicht geprüft

- **Electron nicht gestartet.** Alle Module liefen in einer vm-Sandbox mit Attrappen für Speicher, Kursabruf, Uhr und `U`. Das Verhalten der Zeitgeber beim Aufwachen ist nicht geprüft.
- **Echte Yahoo-Antworten** nicht geprüft (Abruf verboten): ob Eröffnungen am Ausführungstag ausfallen (M2, M4) und wie oft; ob Yahoo die Historie während der Sitzung des Ex-Tags schon bereinigt (M7); wie Abspaltungen geliefert werden (V1).
- **Echter App-Bestand** (`depot.json`) nicht gesehen. Aussagen zum echten Buch (Kauf 25.08., noch keine liquide Umschichtung, keine toten Reihen im Bestand) stammen aus dem Wiki oder sind als Vermutung gekennzeichnet.
- **Größe von M1–M3 im Betrieb:** nicht gemessen; es fehlen die Maßnahmen- und Kursarchive auf Platte E.
- **Nur im Durchlauf, nicht im Testskript:** der Nachbau zu F12, das Modell zu F3, die Hochrechnung zu F4, „rund 10 von 19 Namen“ (App-Liste gegen die 187 größten).
- **Drift-Buch** — außerhalb des Auftrags.
- **Testlauf:** `node test-channel.js` grün. `node test-v6.js` ist auf main wie auf `450daed` schon ohne diesen Zweig rot (CI: dieselben 5 Fehlschläge); die Ursachen habe ich nicht untersucht. Bestehende Dateien habe ich nicht geändert; die Abnahme-Datei auf main bleibt unverändert. `npx eslint .` ohne Fehler; die Runde-2-Datei ist auch mit den strengen Regeln des Repos sauber.
