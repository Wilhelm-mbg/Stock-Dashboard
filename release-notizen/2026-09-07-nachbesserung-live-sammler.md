## Der Live-Sammler sammelt jetzt wirklich den ganzen Tag

Der Live-Sammler holt seit gestern alle fünf Minuten die fertigen Alpaca-Minuten ins
Archiv. Eine unabhängige Prüfung in der Nacht hat gezeigt, dass er am ersten echten
Handelstag **fast nichts** geholt hätte: seine erste Runde fällt auf 04:16 New Yorker
Zeit, und in der Vorbörse handeln die meisten Werte gar nicht. Wer drei Runden lang
still war, wurde bis zum nächsten Tag zurückgestellt — nach dem Muster der
tatsächlichen Kurse vom 3. September hätte das **96 von 100 Kursminuten des regulären
Handels** gekostet, quer durch die Liste bis zu LLY, JPM, V, UNH und BRK.B.

Die Regel war für erloschene Werte gedacht und trifft jetzt auch nur die: **stillstehen
kann ein Wert erst im regulären Handel** — oder wenn er an diesem Tag schon einmal
gehandelt hat. Und **um 09:30 ist jeder wieder dabei**, nicht erst am nächsten Tag.
Dieselbe Rechnung noch einmal: von den Kursminuten des regulären Handels fehlt jetzt
**keine einzige**.

**In der Statuszeile des Panels** steht deshalb neu, wie viele Werte gerade auf dem
neuesten Stand sind und wie viele ruhen:

> Alpaca live: 3067 Werte · 2900 aktuell · 40 ruhend · letzte Runde 17:02 · bis 10:44 ET · Abrufe je Runde 17 · geschrieben 12 MB in 0,8 s

Dort erscheint jetzt auch, wenn die Obergrenze von 150 Abrufen je Runde greift (das war
bisher unsichtbar) und wenn die Quelle sich beschwert hat.

**Der Chart zeigt die letzte Stunde des Tages sofort.** Bisher endete der
Stunden-Chart nach Handelsschluss bei 14:30 und die 15:30-Kerze erschien erst mit dem
ersten Balken der Nachbörse — bei Werten ohne Nachbörsenhandel gar nicht bis zum
nächtlichen Lauf. Jetzt schließt die letzte Periode einer Sitzung, sobald ihre letzte
Minute da ist: **15:30 mit dem 15:59-Balken**, am Halbtag 12:30, in der Vorbörse 09:00.

**Und bei Kürzeln, die ein zweites Unternehmen bekommen haben** (AAC, CAPA, JONE),
zeigte der Minuten-Chart die Datei der erloschenen Reihe, während 5m/15m/1h die
laufende lasen. Jetzt lesen alle dieselbe.

### Unter der Haube, ohne sichtbare Wirkung

* Die **Archivsperre** wird jetzt so gesetzt, dass sie das Dateisystem vergibt und
  nicht die Reihenfolge zweier Programme — zwei Schreiber konnten sie vorher
  gleichzeitig „haben" und dabei eine Jahresdatei zerreißen. Gelöst wird nur noch die
  eigene. Auch die Vollsammlung schreibt jetzt unter dieser Sperre.
* Ein **Fehler an einer einzelnen Datei** kostet nur noch diesen Wert. Vorher endete
  die ganze Runde an derselben Stelle — auch für alle Werte, die schon geholt waren.
* Eine **Antwort ohne einen einzigen Kurs** gilt als Fehler der Quelle, nicht als
  Aussage über die Werte. Fällt die Quelle eine Viertelstunde aus, holt der Sammler
  danach nach, statt still zu bleiben.
* Die **letzte Runde des Tages** fragt bis 19:59 statt bis 19:55.
* Bei größerem Rückstand wird nicht mehr mitten in einer Abruffolge abgebrochen (und
  alles Geholte verworfen), sondern **weniger Zeit auf einmal** geholt — die nächste
  Runde macht dort weiter.
* Der nächtliche Nachlauf **überschreibt den Fortschritt nicht mehr** mit einer
  älteren Fassung, und seine Windows-Aufgabe meldet einen Fehler auch als Fehler.
