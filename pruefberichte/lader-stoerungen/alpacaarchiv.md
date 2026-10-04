# Lader-Störungen: alpacaarchiv.js

Lader `alpacaarchiv.js` (Schreibroutine des Alpaca-Minutenarchivs `alpaca1m/<ORDNER>/<JAHR>.json`), Stand **61dca2c**.
Tests: `pruefberichte/lader-stoerungen/alpacaarchiv.test.js` (Präfix AA, 16 Tests, < 0,5 s, Rückgabewert 0, 0 Netz-/Schreibversuche).

**Kurzfassung** (schwerste zuerst; kein A, weil kein Buch aus `alpaca1m` liest):
1. **B – Kürzel-Neuvergabe (AA-6):** Kennt `_lebenszeit.json` die zweite Reihe noch nicht, hängt `jahrSchreiben` die Kerzen der neuen Firma an die Datei der alten an. Im Test waren das 183 Tage Lücke und Kurs ×24,9 an der Naht, ohne Bruchmarke. Der Nachlauf fragt erloschene Reihen ungefiltert weiter ab.
2. **B – zerrissene Lebenszeit (AA-7):** Ist `_lebenszeit.json` unlesbar, fällt `reiheFuer`/`reiheAus` still auf die erloschene Erstbelegung zurück. Dorthin zeigen dann der Viewer und die Live-Runde, die ihre Tagesablage in diesen Ordner schreibt.
3. **B – Annehmer zu großzügig (AA-9, AA-15):** Flache Kerzen mit Umsatz 0 werden angenommen, ein fehlendes oder negatives `v` wird still zu 0. Auch Balken mit Hoch < Tief gehen dauerhaft ins Archiv.
4. **B – Zwilling (AA-8):** Steht dieselbe Geschichte unter zwei Kürzeln (CPRI = KORS), wird das weder erkannt noch gemeldet.
5. **C (4×):** Unfertige oder korrigierte Kerzen werden still übersprungen (AA-3). Ein Kalender, der den Tag nicht deckt, schreibt „ausserhalb“ fest (AA-11). Kursaussetzungen bekommen keine Marke (AA-13). Ältere, doppelte und abweichende Kerzen landen ununterschieden in einer einzigen Zahl `uebersprungen` (AA-14).
6. **Richtig (7×):** leere Antwort, Raster/0/NaN im Annehmer, Jahresgrenze ET, Ordnernamen (Groß-/Kleinschreibung, CON, BRK.B/BRK-B), Zeitumstellung, Halbtag, Journal nach Absturz, abgeschnittene Datei, Kopf-Feld anderer Länge.

## Verbraucher

**Wer schreibt Jahresdateien?**
Nur das Werkzeug `tools/alpaca-vollsammlung.js` (wird nicht ausgeliefert):
- Vollsammlung: `jahrHolen`, tools/alpaca-vollsammlung.js:754
- nächtlicher Nachlauf: tools/alpaca-vollsammlung.js:1349-1350

Die Live-Runde der App schreibt seit dem 09.09. **nicht** in Jahresdateien, sondern in die Tagesablage `alpaca1m/<ORD>/_live.jsonl` (main.js:1764-1769). Den Ordner dafür bestimmt sie über `alpacaarchiv.reiheAus`/`ordnerAus` (main.js:1750, 1767-1768). Abgesichert ist das über die Aufrufer:
- Annehmer `kerzeAus` und `sichten` (livesammler.js:367-389)
- fertig-Grenze jetzt − 16 min (livesammler.js:120)
- Abrufende jetzt − 30 min (tools/alpaca-vollsammlung.js:211-213 `abrufEnde`, :1254-1264 `nachholEnde`)

**Wer liest?**
- **Viewer 1m:** IPC `archiv-kerzen` → main.js:2155-2172 (`reiheFuer` → `ordnerFuer` → erst `alpaca1m-bereinigt`, sonst `alpaca1m`), dazu die Tagesablage (main.js:2175-2184). Die Sitzungen der Tageskerzen kommen aus `sitzungJeKerze` (main.js:2087). Weiter über preload.js:74 → explorer.js:728 (Chart) und explorer.js:1871 (Karte „Im Archiv“).
- **Viewer 5m/15m/1h:** aus den Minuten gebildet, main.js:2090-2134 (`reiheFuer` main.js:2094).
- **Studien:** z. B. studien/vorregistrierung-2026-09-06-signale-minuten/lesen.js:161 nimmt nur Kerzen aus Bereichen `sitzung === 'regulaer'`.
- **Manifest/Lücken:** tools/alpaca-manifest.js:238 (`lueckenRechnen`, nur tageweise).

**Weg zu einem Buch:** keiner.
- test-v6.js:19966-19970 sichert zu, dass kein Oberflächen- oder Strategiemodul `alpaca1m` kennt.
- `grep` über mittelfrist.js, mfdepot.js, mfhandel.js und depot.js findet weder `alpaca1m` noch `AlpacaArchiv` noch `archivKerzen`. `archivKerzen` wird nur in explorer.js verwendet (Anzeige).
- Die Live-Menge enthält zwar die Depot-Positionen (main.js:1646). Bewertet, gestoppt und gehandelt wird aber über Yahoo und kurse.js, nicht über dieses Archiv.

**Obergrenze damit B.**

## Tabelle

| ID | Störung | Reaktion heute | Testzeile | Bewertung | Datei:Zeile | Vorschlag |
|----|---------|----------------|-----------|-----------|-------------|-----------|
| AA-1 | S1 HTTP 200 leer (`{"bars":{}}`, `null`) | behält richtig: keine leere Datei, Kopf/Stand bytegleich | alpacaarchiv.test.js:74 | - | alpacaarchiv.js:667 | – |
| AA-2 | S2 Stempel mit Sekunden/ms, Kurs 0/NaN | verwirft (im Annehmer) | alpacaarchiv.test.js:103 | - | alpacaarchiv.js:226, 227 | Gürtel zum Hosenträger: `kerzenPruefen` (alpacaarchiv.js:602) prüft zusätzlich `t % 60000` und `kursOk`; direkt übergeben geht das heute durch. |
| AA-3 | S2 unfertige Kerze / spätere Korrektur | schreibt still falsch (keine eigene fertig-Grenze; Korrektur still übersprungen) | alpacaarchiv.test.js:133 | C | alpacaarchiv.js:688, 602 | `jahrSchreiben` verweigert Kerzen mit `t > jetzt − 16 min` (Vorgabe, Aufrufer kann enger setzen) und zählt einen gleichen Stempel mit anderem Inhalt als `abweichend`, getrennt von `uebersprungen`. |
| AA-4 | S3 31.12. 19:00 ET = 01.01. 00:00 UTC | behält richtig (ET-Jahr, Gegenrichtung verweigert) | alpacaarchiv.test.js:163 | - | alpacaarchiv.js:211, 215 | – |
| AA-5 | S4 Kürzel → Ordner (BRK.B/BRK-B, HIW/HIw, CON, Neustart ohne `_symbole.json`) | behält richtig | alpacaarchiv.test.js:187 | - | alpacaarchiv.js:80 | – |
| AA-6 | S4 Kürzel neu vergeben, Lebenszeit kennt `~2` noch nicht | schreibt still falsch (neue Firma an die Datei der alten, ohne Bruchmarke) | alpacaarchiv.test.js:218 | B | alpacaarchiv.js:155, 688 | Beim Anhang die Naht prüfen: mehr als 10 Handelstage Abstand zur letzten Kerze **und** Schlusskursfaktor außerhalb 0,5–2 → `ok:false`, Grund „Naht: mögliche Kürzel-Neuvergabe“, bis die Lebenszeit die Reihe `~2` führt. |
| AA-7 | S5 `_lebenszeit.json` zerrissen | meldet nicht; fällt still auf die erloschene Reihe | alpacaarchiv.test.js:247 | B | alpacaarchiv.js:143, 155 | `lebenszeitDatei` gibt bei Lese-/Parse-Fehler `{ok:false, grund}` zurück, und die Aufrufer (main.js:1750, 2094, 2156) setzen dann für wiederverwendbare Kürzel aus, statt die Erstbelegung zu nehmen. |
| AA-8 | S5 Zwilling (CPRI trägt die Geschichte von KORS) | meldet nicht (beide angenommen) | alpacaarchiv.test.js:272 | B | alpacaarchiv.js:647 | tools/alpaca-manifest.js legt je Datei einen Fingerabdruck der ersten 390 Kerzen (Stempel + Schluss) ab und meldet gleiche Fingerabdrücke unter verschiedenen Kürzeln als Zwilling. |
| AA-9 | S7 flache Kerzen mit Umsatz 0; `v` fehlt oder ist negativ | schreibt still falsch (angenommen, `v` → 0 erfunden) | alpacaarchiv.test.js:291 | B | alpacaarchiv.js:228 | `kerzeAus` verwirft Balken ohne gültiges `v > 0` als `form`, statt 0 einzusetzen. |
| AA-10 | S8 Zeitumstellung 08.03./01.11.2026 | behält richtig (15 Stempel, Soll von Hand in UTC) | alpacaarchiv.test.js:313 | - | alpacaarchiv.js:244 | – |
| AA-11 | S9 Feiertag / Kalender deckt den Tag nicht / leerer Kalender `{}` | Feiertag richtig; sonst schreibt still falsch („ausserhalb“ dauerhaft) | alpacaarchiv.test.js:340 | C | alpacaarchiv.js:652, 256 | `jahrSchreiben` bekommt den ganzen Kalender `{von, bis, tage}` und verweigert über `kalenderDeckt` jede Kerze, deren ET-Tag nicht gedeckt ist – wie bei `kal = null`. |
| AA-12 | S10 Halbtag 27.11.2026 | behält richtig (13:00 ET → „nach“) | alpacaarchiv.test.js:365 | - | alpacaarchiv.js:258 | – |
| AA-13 | S11 Kursaussetzung mitten in der Sitzung | behält Daten richtig, meldet nicht (ein durchgehender Bereich „regulaer“) | alpacaarchiv.test.js:385 | C | alpacaarchiv.js:270; tools/alpaca-manifest.js:238 | `lueckenRechnen` ergänzt je Tag die längste Lücke innerhalb der regulären Sitzung (Minuten), damit Aussetzungen auffindbar sind. |
| AA-14 | Anhang: älter als die jüngste Kerze, doppelt mit anderem Inhalt, unsortiert | sortiert richtig; verwirft Gutes (fehlende Minute verloren); meldet nicht getrennt | alpacaarchiv.test.js:405 | C | alpacaarchiv.js:689, 655 | Die Rückgabe trennt `uebersprungen` in `vorhanden`, `abweichend`, `aelter` (fehlte, nicht einsortiert) und `doppeltImEingang`. Der Nachlauf protokolliert `aelter > 0`. |
| AA-15 | Hoch < Tief (Hoch < Schluss) | schreibt still falsch | alpacaarchiv.test.js:431 | B | alpacaarchiv.js:227 | `kerzeAus` verwirft Balken mit `h < max(o,c)` oder `l > min(o,c)` als `form`. |
| AA-16 | Absturz im Anhang (Journal), abgeschnittene Datei, `stand` anderer Länge | verwirft/repariert richtig und meldet | alpacaarchiv.test.js:449 | - | alpacaarchiv.js:663, 532, 594 | – |

**Nicht zutreffend:**
- **S6 (bereinigt/roh, Split-Faktor, Abspaltung):** alpacaarchiv.js nennt nur die Ordner (alpacaarchiv.js:52-53). Die bereinigte Kopie und die Faktoren entstehen in tools/alpaca-vollsammlung.js (`massnahmen`, :663 ff.) und tools/alpaca-abspaltungsfaktor.js, also nicht in diesem Lader.
- **S12 (Maßnahme an einem Tag ohne Kurs):** Die Maßnahmen schreibt dasselbe Werkzeug nach `alpaca-massnahmen/` (tools/alpaca-vollsammlung.js:689); alpacaarchiv.js liest sie nie.

## Einzelheiten

**AA-1 (S1).**
- Daten: Antworten `{bars:{}}`, `{bars:{LEER:null}}` und `null`, durch `kerzeAus`. Dazu eine Bestandsdatei mit 3 Kerzen; der zweite Aufruf läuft eine Stunde später auf der festen Uhr.
- Soll aus der Störung: Eine leere Antwort darf weder eine leere Jahresdatei anlegen (die als „Jahr leer“ gelesen würde) noch Stand oder `quellen.bis` fortschreiben.
- Ist: keine Datei, kein Ordner; die Bestandsdatei bleibt bytegleich, `geschrieben:false`. Der Leer-Zähler des Nachlaufs (`plan.leere`, tools/alpaca-vollsammlung.js:1355) liegt beim Werkzeug.

**AA-2 (S2, Raster).**
- Daten: 6 Balken; einer mit `13:31:30`, einer mit `.500`, einer mit Schluss 0, einer mit Eröffnung NaN.
- Ist: 2 von 6 angenommen, die Datei liegt auf dem Minutenraster.
- Nebenbefund: `jahrSchreiben` selbst prüft weder Raster noch Kurse (`kerzenPruefen` nur die Form). Eine direkt übergebene Kerze mit 30 s wird geschrieben. Heute gehen alle Aufrufer über `kerzeAus`.

**AA-3 (S2, unfertig).**
- Daten: Uhr 2026-10-05 16:00Z. Kerzen 15:50Z (Schluss 100, Umsatz 10) und 16:00Z, beide jünger als jetzt − 16 min. 40 Minuten später kommen die fertigen Fassungen (15:50Z: Schluss 101, Umsatz 900) plus 16:10Z.
- Soll: Ein Archiv, das nie überschreibt, darf nichts jenseits der fertig-Grenze annehmen (livesammler.js:120: 16 min; Werkzeug: 30 min). Eine abweichende Neulieferung muss es mindestens benennen.
- Ist: Beide unfertigen Kerzen werden geschrieben. Die fertige Fassung wird als `uebersprungen` gezählt, das Archiv behält Schluss 100 / Umsatz 10 für immer. Die Vollsammlung macht daraus sogar „unverändert“ (tools/alpaca-vollsammlung.js:758).
- Bewertung C: Die heutigen Aufrufer halten 30 min Abstand, und der Nachlauf fragt nie hinter den letzten Stempel zurück. Damit ist der Fall nur über eine Neusammlung des laufenden Jahres oder einen künftigen Aufrufer erreichbar.

**AA-4 (S3).**
- Daten: Kerzen 2025-12-31 20:59Z, 2026-01-01 00:00Z und 00:59Z (19:00/19:59 EST) sowie 2026-01-02 14:30Z. Das Soll steht von Hand in UTC.
- Ist: ET-Jahre 2025, 2025, 2025, 2026. `2025.json` hat die Bereiche „regulaer > nach“, dieselbe Kerze ins Jahr 2026 wird verweigert, die Grenze liegt bei 05:00Z.
- Der Aufrufer verteilt über `jahrVon` (livesammler.js:391-395).

**AA-5 (S4, Ordner).**
- Neun Kürzel, keine Kollision ohne Groß-/Kleinschreibung, kein Gerätename, kein Punkt am Ende.
- Die Vollsammlung bildet mit derselben Regel ab (`symbolAbbildung` = `ordnerName`, tools/alpaca-vollsammlung.js:138-147). Fehlt `_symbole.json` oder ist sie zerrissen, ergibt sich deshalb derselbe Ordner. Ein Neustart verschiebt nichts.
- HIW und HIw liegen auf der Windows-Platte getrennt, jede Datei mit ihrem eigenen `sym`.

**AA-6 (S4, Neuvergabe).**
- Daten: `_lebenszeit.json` vom 15.03. mit `AAC` (letzter Tagesbalken 02.03.), **ohne** `AAC~2`. Datei der alten Firma mit 5 Kerzen um 10 $ am 02.03., dann 5 Kerzen der neuen Firma um 250 $ am 01.09.
- Soll: Der eigene Kommentar des Moduls sagt, zwei Unternehmen dürfen nie still in einer Reihe stehen (alpacaarchiv.js:122-127). Wilhelm: „nach Brücken-Neustart zeigt ein Kürzel auf eine andere Firma“.
- Ist: `reiheFuer` → `AAC`. Der Anhang ist `ok:true`, `quellen` bleibt ein einziger Bereich, das Ergebnis trägt keinen Hinweis. Das Modul prüft weder Abstand noch Kurssprung an der Naht, und auch nicht, ob `sym` im Dateirumpf zum Aufrufer passt.
- Weg: Der Nachlauf filtert erloschene Reihen **nicht** (tools/alpaca-vollsammlung.js:1292, nur `!wiederverwendet`) und fragt ab dem letzten Stempel. Sobald die Quelle unter dem Kürzel wieder Balken liefert, gehen sie über :1349-1350 in die alte Datei. Von dort sehen sie Viewer 1m (main.js:2156-2166), 5m/15m/1h (main.js:2094-2118) und Studien. **B**, kein Buch.
- Grenze: Die Lücke wird erst geschlossen, wenn Phase L die Lebenszeit neu baut. Wie oft das geschieht, ist nicht geprüft.

**AA-7 (S5, Lebenszeit).**
- Daten: Eine heile Lebenszeit mit `AAC` (`wiederverwendet`) und `AAC~2` liefert `AAC~2` (Positivkontrolle). Danach dieselbe Datei auf 60 % abgeschnitten, Änderungszeit fest versetzt.
- Ist: `reiheFuer` → `AAC` (Ordner der erloschenen Firma). `lebenszeitDatei` liefert `{stand:null, werte:{}}`, ohne Grund (alpacaarchiv.js:143).
- Weg:
  - Der Viewer liest den falschen Ordner (main.js:2156, 2094).
  - Die Live-Runde rechnet mit `lzWerte = (lz && lz.werte) || {}` (main.js:1750) und schreibt über `reiheAus` (main.js:1767-1768) die heutigen Minuten der laufenden Firma in die Tagesablage des erloschenen Ordners – sofern der Wert über Watchlist, Position oder Viewer in der Menge steht. Das widerspricht dem Kommentar main.js:1641-1642 („sammelt dann weniger, aber nie das Falsche“).
  - Der Nachlauf bricht bei fehlender Lebenszeit dagegen richtig ab (tools/alpaca-vollsammlung.js:1281-1284).
- **B.**

**AA-8 (S5, Zwilling).**
- Daten: 5 identische Kerzen vom 28.12.2018 unter KORS und unter CPRI.
- Soll: Den Zwilling erkennen oder melden. Bekannt ist er von den Tagesbalken (382 doppelte Panel-Abschnitte).
- Ist: Beide werden ohne Hinweis angenommen. Das Manifest führt einen SHA-256 je Datei, der Kopf trägt aber `sym`, also unterscheiden sich die Prüfsummen.
- Weg: Studien über das Archiv zählen die Geschichte doppelt. **B.**
- Grenze: Ob Alpaca die Minutengeschichte des Vorgängers unter dem neuen Kürzel liefert, ist nicht gemessen; der Test zeigt nur die Reaktion, falls es so ist.

**AA-9 (S7).**
- Daten: ein echter Balken um 19:58Z (Umsatz 1200), danach 4 flache Balken mit `v:0`, einer ohne `v` und einer mit `v:-5`.
- Soll: Alpaca-Minutenbalken entstehen aus Handel. Eine flache Kerze mit Umsatz 0 ist die bekannte Stempel-Kerze („Abgemeldete Reihen sammeln Stempel“), ein fehlendes `v` ist unbekannt, nicht null.
- Ist: Alle 6 stehen im Archiv. `kerzeAus` setzt bei fehlendem oder negativem `v` still 0 ein (alpacaarchiv.js:228); der `form`-Zähler von `sichten` sieht davon nichts.
- **B** (Viewer-Chart, Umsatz- und Dichtemessungen in Studien).
- Grenze: Ob Alpaca je `v:0` liefert, ist nicht gemessen.

**AA-10 (S8).**
- Vier Handelstage um die beiden Umstellungen und ein Sonntag; das Soll steht in UTC von Hand (EST −5, EDT −4).
- Alle 15 Bereiche sind richtig. `etTag(2026-11-02 01:00Z)` = 2026-11-01.

**AA-11 (S9).**
- (a) Thanksgiving bei deckendem Kalender → „ausserhalb“, behalten und gezählt: richtig.
- (b) Ein Kalender, der am 27.11. endet, und (c) ein leerer Kalender `{}`: Der Handelstag 30.11. wird als „ausserhalb“ geschrieben, `ok:true`, dauerhaft (das Archiv schreibt Bereiche nie neu).
- Studien nehmen nur „regulaer“ (lesen.js:161). Der Tag fiele dort still heraus.
- Nur `kal = null` wird verweigert (alpacaarchiv.js:652).
- **C**, weil `kalenderHolen` nur einen deckenden Kalender zurückgibt oder wirft (tools/alpaca-vollsammlung.js:554-559). Kein heutiger Aufrufer erreicht (b) oder (c) beim Schreiben.
- Der Viewer reicht bei fehlender `_kalender.json` `{}` an `sitzungJeKerze` (main.js:2087). Das wirkt nur auf die Anzeige der Tageskerzen und wird nicht gespeichert.

**AA-12 (S10).**
- Kalender 27.11. mit Schluss 13:00: 12:59 → regulaer, 13:00 und 15:59 → nach; am Folgetag 13:00 → regulaer. Richtig.

**AA-13 (S11).**
- Daten: Kerzen 09:30-09:34 und 13:00-13:04 ET, dazwischen 205 Minuten Aussetzung.
- Ist: Die Datei führt einen einzigen Bereich „regulaer 13:30-17:04Z“. `_luecken.json` entsteht hier nicht und zählt ohnehin nur fehlende **Tage** (tools/alpaca-manifest.js:238).
- Es werden keine Kerzen erfunden: Fehlen heißt bei Alpaca „kein Handel“. **C.**

**AA-14 (Anhang).**
- Daten: Bestand 13:30, 13:31, 13:33, 13:34 (13:32 fehlt). Eingang unsortiert: 13:36, 13:32, 13:31 (Schluss 99 statt 2), 13:35 (6) und 13:35 (66).
- Ist:
  - Sortiert richtig.
  - 13:32 ist verloren: ein Anhang sortiert nicht ein, so gewollt (alpacaarchiv.js:18-20).
  - 13:31 mit anderem Inhalt wird übersprungen.
  - Beim doppelten Stempel gewinnt die erste Kerze (6).
  - Die Rückgabe nennt nur `uebersprungen=3`.
- **C:** Der Verlust ist Entwurf; es fehlt die Meldung, dass eine echte Minute verloren ging.

**AA-15.**
- Daten: Balken mit `h = 9,5`, `l = 10,5` bei Schluss 10.
- Ist: `kerzeAus` prüft nur `kursOk` je Feld (alpacaarchiv.js:227). Die verkehrte Kerze steht im Archiv und im Viewer-Chart; Spannenmaße in Studien rechnen mit ihr. **B.**

**AA-16.**
- (a) Absturz mitten im Schwanz (`opt.abbruchBei: 'im-schwanz'`): Die Datei ist zerrissen, das Journal liegt. `letzterStempel` liefert dem Leser `null` statt eines falschen Stempels. Der nächste Anhang spielt das Journal zurück. Ergebnis: dieselbe Reihe, Bereiche und `quellen` wie eine in einem Zug geschriebene Datei, das Journal ist weg.
- (b) Eine halbe Datei ohne Journal wird verweigert („Marke "sitzungen" … nicht gefunden“) und bleibt unberührt.
- (c) `stand` ohne Millisekunden (20 statt 24 Zeichen) wird verweigert („Kopf: stand liesse sich nicht gleich lang ersetzen“) und bleibt unberührt. Der Nachlauf sammelt das in `erg.fehler`.

## Nicht geprüft / Grenzen

- **Aufrufer nicht ausgeführt:** tools/alpaca-vollsammlung.js (Vollsammlung, Nachlauf, Phase L, `massnahmen`) und die Live-Runde nicht ausgeführt; die Ketten sind aus dem Code belegt. Die Live-Runde und ihre Tagesablage prüft der livesammler-Agent.
- **Quelle nicht gemessen:** ob Alpaca `v:0`, Hoch < Tief oder die Minutengeschichte eines Vorgängers unter einem neuen Kürzel liefert (AA-8, AA-9, AA-15). Die Tests zeigen nur die Reaktion.
- **Zweiter Schreiber nicht geprüft:** ein lebender fremder Prozess mit liegendem Journal (`journalFremdLebend`) braucht einen zweiten Prozess; `child_process` ist gesperrt.
- **Platte nicht geprüft:** echtes Plattenverhalten (Reihenfolge von NTFS-rename und fsync, Stromausfall); geprüft ist nur die Logik des Journals.
- **Kalender-Cache:** `kalenderHolen` erneuert einen zwischengespeicherten Kalender nie, solange er den Zeitraum deckt (tools/alpaca-vollsammlung.js:558). Später angekündigte Schließungen oder Halbtage fehlen dann im Kalender – nur gelesen, nicht getestet.
- **Lebenszeit aus Tagesbalken (Nr. 72):** `reiheAus` nutzt nur den Schlüssel `~2`. `erster`/`letzter` wertet dieses Modul nicht aus; sie wirken in livesammler.js `gefuehrteReihen` und im Lebenszeitfilter von `jahrHolen` (tools/alpaca-vollsammlung.js:736-742).
- **Viewer-Naht (Hinweis für S6):** Der Viewer reiht die **bereinigte** Jahresdatei und die **rohe** Tagesablage aneinander (main.js:2160-2183). Nach einem Split am selben Tag mischt der Chart zwei Skalen. Das liegt nicht in diesem Lader und ist nicht getestet.

## Wünsche an hilfen.js

- **`H.mitUhr` verschachtelt:** stellt nach dem Lauf die **echte** Uhr wieder her, nicht die vorige. Ein verschachtelter Aufruf (zweite feste Uhr innerhalb eines Tests) verliert so die äußere feste Uhr. Lokal nachgebaut als `mitWurzelUhr`. Wunsch: `global.Date` auf den Wert vor dem Aufruf zurücksetzen.
- **Umgebungsvariable je Test:** `H.mitUmgebung({ MD_ALPACA_WURZEL: … }, fn)` setzt sie und stellt sie danach zurück. Lokal nachgebaut als `mitWurzel`.
- **Rückgabefelder vergleichen:** `H.zusatzFelder(obj, bekannteListe)` für die Frage „meldet der Lader etwas über seine dokumentierten Felder hinaus?“. Der erste Entwurf prüfte die Feldnamen per Muster, und `/sprung/` traf `uebersprungen` – die Testmarken-Falle; AA-6 meldete dadurch fälschlich „kein Unterschied“. Lokal gelöst mit der festen Liste `FELDER_JS`.
