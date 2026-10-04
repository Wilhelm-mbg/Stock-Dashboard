# Prüfbericht: Live gegen Messung — Momentum-Buch (04.10.2026)

Geprüfter Stand: `450daed` (Wiki: Stand v8.45.0). Nur gelesen, nichts geändert. Kleinsttests:
`node pruefberichte/live-gegen-messung-momentum.test.js [Nummer]` (Kunstdaten, kein Netz, 15 Tests).
Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

**Die fünf schwersten Funde**

1. **F1 (A)** Scheitert der tägliche Kursabruf ganz oder halb, überschreibt die App den gespeicherten Bestand trotzdem. Danach: keine oder eine falsche Umschichtung, Buch zum Einstand bewertet, 26 h kein neuer Versuch. Test 1, 2.
2. **F2 (A)** Liefert die Quelle für einen gehaltenen Wert nichts mehr (Übernahme, Delisting, Kürzelwechsel), bleibt die Position für immer im Buch — nie verkauft, zum Einstand bewertet. Die Messung bucht sie am ersten Tag aus. Test 3.
3. **F3 (A)** Die App rangiert auf Kursen **mit** Ausschüttungen (Yahoo-adjclose), die Messung auf Kursen **ohne**. Ein ausschüttender Wert an der Grenze kommt live ins Ziel, in der Messung nicht. Test 4.
4. **F4 (A)** Die App kauft zum letzten gespeicherten Balken (Vortagsschluss oder Zwischenstand der laufenden Sitzung), die Messung zur Eröffnung nach dem Stichtag. Ein Alterslimit gegen die Uhr gibt es nicht. Test 5, 6.
5. **F5 (B)** Im Verlaufspunkt stammen Buchwert und Marktwert aus zwei verschieden alten Beständen. Ein Buch, das genau den Markt hält, steht dann mit −2,0 Pp da. Test 7.

---

## Prüfliste

| Punkt | Messung (Rückblick Nr. 74, Korb Nr. 78) | App | gleich? |
|---|---|---|---|
| Universum | alle Aktienreihen des Panels mit den verschwundenen (REGEL §1.2/§1.7) bzw. je Stichtag die 187 umsatzstärksten (Korb-REGEL §1.2 Z. 20–25) | feste Liste mit 193 Namen (`mittelfrist.js:8-20`); einige liefert Yahoo nicht mehr (HES, BK, MMC, FI, `mittelfrist.js:126-127`); Reihen bis 500 Balken fallen weg (`mittelfrist.js:48`) | nein — bekannt (Nr. 5); neu: 500-Balken-Hürde (F8) |
| Mindestzahl | 100 zulässige Werte (REGEL Teil B Z. 79) | 100 (`liquide.js:35`, `mfhandel.js:90`) | gleich; bei ~187 Werten fehlt aber nur ein Puffer von ~87 (F1) |
| Rangfolge 231 / 21 | `momentumZiel` der App (REGEL §1.2 Z. 17–21) | dieselbe Funktion (`mfhandel.js:76`) | gleich |
| Kurs der Rangfolge | `bSchluss`: Splits ja, Ausschüttungen nein (`rueckblick.js:73`; Prüfstand-VORREGISTRIERUNG Z. 106–108) | Yahoo-adjclose: Splits **und** Ausschüttungen (`mittelfrist.js:41`, `kurse.js:74-75, 96-98`) | **nein (F3)** |
| Lücken in der Reihe | zählt Zeilen, nicht Kalendertage | ebenso; unbrauchbare Kurse verwirft der Lader (`kurse.js:104`) | gleich |
| Liquiditätsfilter | Dollar-Umsatz roh, 20 Balken | adjclose × Stück, 20 Balken (`liquide.js:54`); während der Sitzung zählt ein Teil-Tag mit | fast gleich (Rest in F4) |
| Haltedauer: Zählung | 63. Panel-Handelstag nach dem Ausführungstag (`rueckblick.js:210`, REGEL §1.3 Z. 34) | Balken der SPY-Reihe, deren Stempel nach der **Uhrzeit** der letzten Umschichtung liegt (`mfhandel.js:179`, `mfdepot.js:152, 166`) | **nein (F6)**: auf der Uhr ±1 Tag; still keine Umschichtung, wenn die SPY-Reihe alt ist |
| Auslöser | Kalender des Panels | Takt alle 30 min und 12 s nach dem Start (`mfdepot.js:584-585`), wenn fällig und Buch an; Knopf „jetzt umschichten“ handelt sofort und setzt den Takt neu (`mfdepot.js:163-166, 578`) | anders (Knopf: C) |
| doppelt / gar nicht | — | zwei Takte am Tag: kein zweiter Handel (Test 15). `zuWenig`: nächster Takt versucht es neu, wie die Messung am nächsten Tag. App tagelang aus: Umschichtung beim nächsten Start, der Takt verschiebt sich dauerhaft. Alte SPY-Reihe: gar nicht (F6) | teils |
| Zeitzone / UTC-Grenze | Tag = Mitternacht UTC (REGEL Teil C.2) | Verlaufspunkt je UTC-Tag (`mfdepot.js:235-236`); Fälligkeit über ms-Stempel | kein eigener Fund; die Tageszeit wirkt über F5 und F6 |
| Feiertage | Panel-Handelstage | Balken der SPY-Reihe | gleich |
| Handelskurs | Eröffnung des Ausführungstags (`rueckblick.js:187`, REGEL §1.3 Z. 32) | letzter Balken des Tagesbestands (`mfdepot.js:45, 165`) | **nein (F4)** |
| Alter des Kurses | Kurs desselben Tages | 7 Tage, gemessen am jüngsten Balken **desselben** Bestands (`mfdepot.js:153`, `mfhandel.js:68`); Nachladen erst ab 26 h (`mfdepot.js:66`) | **nein (F4)** |
| Kosten je Seite | 20 Bp (`rueckblick.js:18`) | 20 Bp (`mfdepot.js:165`) | gleich (Test 14) |
| Bargeld | `fuehreAus` der App | dieselbe Funktion; Verkäufe vor Käufen; vier Stellen | gleich; in 20.000 Zufallsfällen nie negativ (Test 13); Kleinstpositionen bekannt (Nr. 1) |
| Ziel ohne Kurs | nicht gekauft (REGEL §1.3 Z. 32–33) | kommt nicht vor: jedes Ziel hat seinen letzten Balken | gleich im Ergebnis |
| Position ohne Kurs | Umschichtung: gehalten. Bewertung: **letzter Schluss, nie Einstand** (REGEL §1.3 Z. 36, `rueckblick.js:226-234`) | Umschichtung: gehalten (`mfhandel.js:108`). Bewertung: **Einstand** (`mfhandel.js:168`) | **nein (F1, F2)** |
| Wert verschwindet | am ersten Tag ohne Zeile ausgebucht: letzter Schluss, 0 bei Insolvenz/Zwangs-Delisting (REGEL §1.4, `rueckblick.js:157-171`) | ohne Daten: für immer zum Einstand; mit alter Reihe: bis zur nächsten Umschichtung zum alten Kurs, dann mit Kosten verkauft, nie 0 | **nein (F2)** |
| Leere / halbe Antwort | vollständiges Panel | fehlende Werte fallen aus dem Bestand; geschrieben wird trotzdem (`mittelfrist.js:116-123`), geprüft erst danach (`:139`) | **nein (F1)** |
| Gespeicherter Zustand | — | fehlt `letztesRebalanceT` → sofort fällig (`mfhandel.js:177`, gewollt); fehlt `konfig` → Journalzeile, kein Handel (`mfdepot.js:102-117`); `trades` auf 400 gekürzt (`mfhandel.js:156`, nur Anzeige) | kein Fund mit Geldfolge |
| Bewertung / Tagesverlauf | Buch und SPY täglich zum selben Schluss (`rueckblick.js:215-236`) | Buch zum letzten Balken des Tagesbestands, SPY zum jüngsten Balken vor der Punktzeit aus einer anders alten Reihe (`mfdepot.js:232-246`, `massstab.js:46-53`) | **nein (F5)** |
| Texte `studienurteile.js` | ERGEBNIS.md Nr. 74 | alle 8 Zahlen des Rückblicks stimmen (Test 10) | gleich |
| Texte Oberfläche | belegstand.md, ERGEBNIS.md | alte Zahlen ohne Fundstelle; „exakt die gemessene Konfiguration“ | **nein (F7)** |

---

## Funde nach Schwere

### A — verändert das Ergebnis des Buchs

**F1 · Ein gescheiterter Kursabruf überschreibt den Bestand**
- *Messung:* rechnet jeden Tag auf dem vollständigen Panel (REGEL §1.2). Fehlt einer gehaltenen Reihe die Zeile, gilt ihr letzter Schluss (REGEL §1.3 Z. 36, Klinke `rueckblick.js:234`).
- *App:* `ladeUniversum` holt 193 Reihen einzeln. Jede Reihe ohne Daten kommt auf die Liste „weg“ (`mittelfrist.js:117-118`). Danach wird **immer** geschrieben (`:123`), erst dann wird gezählt (`:139`). Der neue Stand trägt die Zeit „jetzt“. `kurseFrischHalten` lädt deshalb 26 h nicht neu (`mfdepot.js:66`). Die zweite Auslöse-Stelle greift nur bei fehlenden Stückzahlen (`mfdepot.js:157`).
- *Szenario Totalausfall* (Rechner wacht auf, WLAN noch nicht da; Test 1): Der Bestand fällt von 193 auf 0 Werte. Der nächste Takt findet die Umschichtung fällig, führt sie aber nicht aus (`zuWenig`). Er schreibt den Tagespunkt mit **88.834 $ (Einstand)**, die Messung hätte **97.891 $** (letzter Schluss). Nachladen angestoßen: 0×. Gegenprobe mit funktionierendem Abruf: die Umschichtung läuft. Nebenwirkung: `driftui.js:110` braucht mindestens 30 Werte, sonst frischt es auch die SPY-Reihe nicht auf (dann F6).
- *Szenario halbe Antwort* (45 Werte am Listenende ohne Daten, z. B. HTTP 200 leer oder zweimal 429 — Yahoo drosselt nach etwa 200 Anfragen, `kurse.js:36-38`; Test 2): Es wird auf 148 statt 193 Werten umgeschichtet. Das Ziel hat 15 statt 19 Werte, 4 Positionen der vollen Rechnung fehlen. 3 alte Positionen ohne Kurs werden nicht verkauft und bleiben eine ganze Periode (63 Tage) liegen.
- *Folge:* falsche oder ausgefallene Umschichtung. Bewertung und Tagespunkt zum Einstand — der Punkt bleibt für immer im Verlauf.

**F2 · Ein verschwundener Wert bleibt für immer zum Einstand im Buch**
- *Messung:* Am ersten Handelstag nach der letzten Zeile wird die Position ausgebucht: zum letzten Schluss, bei Insolvenz oder Zwangs-Delisting zu 0 (REGEL §1.4, `rueckblick.js:157-171`). Das Geld wird in der nächsten Umschichtung angelegt.
- *App:* Liefert Yahoo nichts mehr, fehlt der Wert im Bestand und damit in `preise`. `planeUmschichtung` hält ihn („ohne Kurs kein Handel“, `mfhandel.js:108`) und lässt ihn aus dem Depotwert für die Budgets heraus (`:109`). `bewerte` setzt den Einstand an (`:168`). Einen Ausweg gibt es nicht: die Position wird nie verkauft.
- *Szenario* (Test 3): 100 Stück, Einstand 100,20 $, letzter Kurs 130 $. Nach 3 Umschichtungen steht die Position noch im Buch, bewertet mit **10.020 $**. Die Messung hätte **13.000 $** gutgeschrieben (Übernahme) bzw. **0 $** (Insolvenz).
- *Häufigkeit:* In den Läufen mit dem Korb 187 gab es 1 Reihenende je fünf Jahre (Korb-ERGEBNIS Z. 38), im breiten Rückblick 16 (ERGEBNIS Nr. 74 Z. 21). Jeder Fall ist dauerhaft.
- *Vermutung, nicht geprüft:* Liefert Yahoo die alte Reihe noch eine Zeit lang, fliegt der Wert nach 7 Tagen aus der Rangfolge. Er wird dann zur nächsten Umschichtung zum alten Kurs mit 20 Bp verkauft — bei einer Insolvenz nie zu 0.

**F3 · Ausschüttungen stecken live in der Rangfolge, in der Messung nicht**
- *Messung:* Die Stärke kommt aus `bSchluss` (`rueckblick.js:73`). Das ist eine Reihe, die Splits bereinigt, aber **keine Dividenden** (Prüfstand-VORREGISTRIERUNG Z. 106–108; REGEL §1.5: „das Panel führt keine Ausschüttungen“).
- *App:* `holeTage` lädt mit `bereinigt: true` (`mittelfrist.js:41`), also Yahoo-adjclose: Splits **und** Dividenden (`kurse.js:74-75, 96-98`). Dass adjclose die Ausschüttungen enthält, hat das Projekt selbst gemessen: SPY 06.04.–02.10.2026, Kursertrag +16,80 %, aus adjclose +17,39 % (`massstab.js:20-25`). Jede Ausschüttung im Rückblickfenster hebt die Stärke um ungefähr ihren Satz.
- *Szenario* (Test 4): 120 Werte, das Ziel sind 12. W107 hat eine Kursstärke von 1,170 (Platz 13) und drei Ausschüttungen zu je 1,5 % im Fenster. Bereinigt steigt die Stärke auf 1,271. Live ist W107 im Ziel und W108 fliegt raus; in der Messung ist es umgekehrt.
- *Folge:* An der Grenze des Zehntels bevorzugt das Buch ausschüttende Werte. Wie oft das echte Ziele ändert, ist nicht gemessen.
- *Ergänzung zu Nr. 3:* Die beiden Seiten sind genau vertauscht. Die Messung rangiert **ohne** Ausschüttungen und schreibt sie dem Buch **gut** (§1.5). Die App rangiert **mit** Ausschüttungen und schreibt sie **nicht** gut.

**F4 · Gehandelt wird der letzte gespeicherte Balken, nicht die Eröffnung — ohne Alterslimit gegen die Uhr**
- *Messung:* Das Ziel kommt aus den Schlusskursen des Stichtags. Gehandelt wird zur Eröffnung des Ausführungstags (REGEL §1.3 Z. 31–33, `rueckblick.js:187-192`).
- *App:* `preise` ist der letzte Balken jeder Reihe im Tagesbestand (`mfdepot.js:45`), gehandelt wird zu genau diesem Kurs (`:165`). Der Bestand wird erst ab 26 h Alter neu geladen (`:66`). Der Ladevorgang läuft nebenher, der Takt wartet nicht darauf (`:69`). Die 7-Tage-Prüfung misst gegen den jüngsten Balken **desselben** Bestands (`nowMs: daten.juengster`, `:153`), nicht gegen die Uhr. Lädt die App während der US-Sitzung, behält der Lader den laufenden Tagesbalken (`kurse.js:140-142` schneidet nur außerhalb des Fensters; Stempel 13:30 UTC, Kurs = jetzt).
- *Szenario* (Test 5, 6): Ist der Bestand 31 Tage alt, entsteht trotzdem ein Ziel mit 12 Werten und 12 Käufen zu den alten Schlusskursen; gegen die Uhr gemessen wären alle 120 Reihen „veraltet“. Bei einer Lücke von Schluss 100 $ auf Eröffnung 103 $ kauft die App 998,0 statt 968,9 Stück (+3,0 %). Ein Abruf um 16:00 UTC liefert als letzten Balken einen Zwischenstand mit Teil-Umsatz.
- *Realistisches Alter:* Wer morgens umschichtet, kauft zum Vortagsschluss. Lag das letzte Laden vor der US-Eröffnung und unter 26 h zurück, ist es der Schluss davor (einen Handelstag älter als nötig). Auch der Knopf „jetzt umschichten“ prüft das Alter nicht.
- *Folge:* Der Füllkurs ist einer, der zum Zeitpunkt des Handels nicht mehr zu haben war. Richtung und Größe sind nicht gemessen; die Zeile S9 „Einstiegslücke“ der Messmaschine misst genau diese Größe für andere Signale.

### B — verändert Anzeige oder Vergleich

**F5 · Buch und Markt im selben Verlaufspunkt sind verschieden alt** *(ergänzt Nr. 4)*
- *Messung:* Buch und SPY werden täglich zum selben Schluss bewertet (`rueckblick.js:215-236`).
- *App:* Der Tagespunkt entsteht beim ersten Takt des UTC-Tags (`mfdepot.js:235-246`). Der Buchwert kommt aus dem Tagesbestand (Nachladen ab 26 h, `:66`). Der Marktwert kommt seit Nr. 81 aus der jüngsten SPY-Reihe, zum jüngsten Balken vor der Punktzeit (`massstab.js:46-53, 65`). Diese Reihe frischt `driftui.js` getrennt auf (ab 20 h, alle 6 h angestoßen; `driftui.js:116`, `mfdepot.js:591-596`). Nr. 4 betrifft nur den ersten Punkt und nur die Marktseite. Hier hat die Buchseite eine eigene Uhr, an **jedem** Punkt.
- *Szenario:* Der Nutzer startet Dienstag 06:00 UTC. Der Tagesbestand stammt von Montag 08:00 UTC, vor der US-Eröffnung, enthält also den Freitagsschluss; mit 22 h gilt er als frisch. Die SPY-Reihe enthält den Montag. Der Punkt vergleicht Buch (Freitag) mit Markt (Montag). Test 7: Ein Buch, das Stück für Stück den Markt hält, zeigt **0,00 % gegen +2,00 %, Abstand −2,0 Pp**. Gegenprobe mit gleich alten Daten: 0,0 Pp.
- *Folge:* Jeder Vergleichswert trägt am Anfang und am Ende den Fehler eines Handelstags (Marktbewegung gegen Buchbewegung). Die Punkte bleiben so gespeichert.

**F6 · Die Haltedauer hängt an Tageszeit und Alter der SPY-Reihe**
- *Messung:* Der nächste Ausführungstag liegt genau 63 Panel-Tage später (`rueckblick.js:210`).
- *App:* Gezählt werden SPY-Balken mit Stempel nach `letztesRebalanceT = now` (`mfhandel.js:179`, `mfdepot.js:166`). Eine Umschichtung um 10:00 UTC macht die nächste nach 62 Balken fällig, eine um 15:00 UTC nach 63 (Test 8, C). Ob 62 Balken auf der Uhr auch 63 Tage zwischen den Füllkursen sind, hängt am Alter des Tagesbestands (F4). Schwerer wiegt: Endet die SPY-Reihe, weil sie nicht aufgefrischt wird (Abruf scheitert → `driftui.js:121/126` behält still die alte; oder nach F1), meldet `rebalanceFaellig` nur „nicht fällig“. Test 9: 129 Handelstage nach der letzten Umschichtung kommt immer noch kein Handel, und weder Grund noch Alter werden angezeigt. Die Karte schreibt weiter „nach 63 Handelstagen · letzte Umschichtung …“ (`mfdepot.js:413-418`).
- *Folge:* Die Umschichtung verschiebt sich still. Bleibt die Reihe lange aus, ist die Folge A.

**F7 · Texte der Oberfläche: Zahlen ohne Fundstelle, und „exakt wie gemessen“ stimmt nicht**
- `studienurteile.js` (Rückblick-Eintrag) ist sauber: alle 8 Zahlen stehen so in ERGEBNIS.md Nr. 74 (Test 10).
- Ohne Gegenstück in belegstand.md und den beiden ERGEBNIS.md (Test 11): „52 %“ größter Rückschlag (`index.html:2217`, `strategien.js:91`, `app-shell.js:1231`), „8 von 22 Jahren“ (`index.html:2218`, `strategien.js:91`, `app-shell.js:1232`), „2024 lag es bei −0,1 % gegen +7,4 %“ (`app-shell.js:1232`), „+20,3 % p. a. … +5,4 Pp“, „14 von 22 Jahren“, „93 von 96“ (`strategien.js:89-90`). Das sind Zahlen der alten Studie (197 Werte, gegen den Durchschnitt derselben Werte). Neben der Karte mit dem Rückblick (2024: Buch +42,17 %, SPY +24,86 %, ERGEBNIS Nr. 74 Z. 14) liest sich „2024: −0,1 % gegen +7,4 %“ als Widerspruch; ein Hinweis auf den anderen Maßstab fehlt.
- „Exakt die gemessene liquide Konfiguration“ (`app-shell.js:1229`, `strategien.js:79, 87`) und „Konfiguration wie gemessen“ (`mfdepot.js:517`, `index.html:2224`): Das gilt für die Parameter, nicht für Kursbasis (F3), Füllkurs (F4), Bewertung (F1/F2) und Haltedauer (F6). Der Satz „jede weitere [Umschichtung] ist ein Out-of-Sample-Beleg“ setzt aber genau diese Gleichheit voraus.

### C — Randfall ohne Geldfolge

- **F8 · Mindestlänge 500 statt 253.** `holeTage` legt nur Reihen mit mehr als 500 Balken ab (`mittelfrist.js:48`), die Regel rankt ab 253 Zeilen (`mfhandel.js:65`, REGEL Teil B Z. 81). Test 12: ARM mit 400 Balken landet auf „weg“. Ein neu gelisteter Wert der Liste fehlt so rund ein Jahr länger als in der Messung. *Ergänzt Nr. 5.*
- **Knopf „jetzt umschichten“** bei eingeschaltetem Buch: handelt ohne Rückfrage und setzt den 63-Tage-Takt neu (`mfdepot.js:163-166, 572-578`). Das ist gewollt, aber für den Vorwärtstest ein Bruch im Takt.
- **Reihenende mit Kosten:** Liefert die Quelle die alte Reihe, verkauft die App mit 20 Bp; die Messung bucht ohne Verkaufskosten aus (REGEL §1.4).
- **Code-Kommentar gegen Regel D2:** `mfhandel.js:4` nennt Momentum noch einen der „zwei am besten belegten Effekte“ (+5,4 Pp). In der Oberfläche steht das nicht.
- **Hinweis, kein Fehler:** `studienurteile.js:102-103` nimmt „nur einen zweifach gerechneten Rückblick“ auf. Mit Nr. 78 (B-187 „bestätigt die Vorab-Rechnung“) ist das für den Korb 187 erfüllt; der Eintrag fehlt. Das entscheidet der PM.

### Ergänzungen zu den bekannten Punkten

- **Nr. 3 (Ausschüttungen):** Die Seiten sind vertauscht, siehe F3.
- **Nr. 4 (erster Punkt des Maßstabs):** Es trifft jeden Punkt, und auch die Buchseite ist zeitversetzt, siehe F5.
- **Nr. 5 (Liste ≠ Korb):** Die Liste hat 193 Namen; mindestens vier liefert die Quelle nicht mehr. Dazu kommt die 500-Balken-Hürde (F8). Fallen bei einem Teilausfall Werte weg, schrumpft das Ziel weiter (Test 2: 15 statt 19).

---

## Nicht geprüft

- **Electron nicht gestartet.** `mittelfrist.js`, `mfdepot.js` und `studienurteile.js` liefen in einer vm-Sandbox mit Attrappen für Speicher, Kursabruf und `U`. Echtes IPC (`main.js` `fetch-text`, `store-get/set`) habe ich nur gelesen.
- **Echte Yahoo-Antworten** nicht geprüft (Abruf verboten): ob für übernommene Werte nichts oder die alte Reihe kommt (F2); ob adjclose bei einzelnen Werten fehlt. Dann fällt `kurse.js:96-99` still auf den rohen Schluss zurück, und die Rangfolge mischt bereinigte und unbereinigte Reihen — eine Vermutung.
- **Größe von F3 und F4 auf echten Daten** nicht gemessen: das Panel liegt auf Platte E, nicht in diesem Container.
- **Echter App-Bestand** (`depot.json`) nicht gesehen: ob heute eine Position ohne Kurs im Buch steht oder Tagespunkte zum Einstand existieren.
- **Schreibfehler beim Speichern** (Platte voll): `tagesdatenSchreiben` prüft das Ergebnis von `storeSet` nicht (`mittelfrist.js:66-68`). Vermutlich entsteht dann ein Bestand aus alten und neuen Teilen; nicht getestet.
- **Drift-Buch** (`driftAbgleich`) — außerhalb des Auftrags.
- **Vorwärtstest-Zahlen** (+14,7 % in belegstand.md, Studie vom 02.09. in `studienurteile.js`) nicht nachgerechnet; die zweite hält `test-v6.js` gegen die Rohdaten.
- **Wiki:** Einen Abschnitt „Live driftet von der Messung weg“ gibt es in `wiki/fehlerformen.md` unter diesem Namen nicht. Gelesen habe ich die Formen-Tabelle, „Die Notlösung für Cent-Beträge …“, „Der Tagesbalken trägt den Stempel …“ und `wiki/messmethodik.md` Punkt 11.
- **Testlauf:** `node test-channel.js` grün. `node test-v6.js` hat schon **vor** meiner Arbeit 8 Fehlschläge (`test-messmaschine.js` bricht in Abschnitt 2 mit einem TypeError ab; 47b; Universum 1m/60m; Schreibschutz der Universumsdatei — ich laufe als root; `listeBauen("top500")` ohne Datenordner `massive/`; 84.4). Danach drei weitere Läufe — zwei mit und einer ohne meine Dateien — mit je denselben 7: 84.4 war nur im allerersten Lauf rot. Die Ursachen habe ich nicht untersucht; ein Teil ist sichtbar umgebungsbedingt. Bestehende Dateien habe ich nicht geändert. `npx eslint .` ohne Fehler; die neue Testdatei ist zusätzlich mit den strengen Regeln des Repos (`no-undef` u. a.) sauber.
