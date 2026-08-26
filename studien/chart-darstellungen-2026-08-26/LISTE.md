# Was bei einem einzigen Chart-Zeichner wegfiele — die Liste zu Entscheid 3a

**Für Wilhelm, 26.08.2026.** Du hast entschieden: erst eine Liste der betroffenen
Darstellungen, dann der Entscheid über Stufe F (2) — „ein einziger Chart-Renderer".
Das hier ist die Liste. **Sie enthält keine Empfehlung** — nur was es gibt, was es
kann, was bei einer Zusammenlegung davon verloren ginge und ob es Ersatz gäbe.

Erhoben durch Lesen aller Zeichenfunktionen, nicht per Textsuche. Die Vorab-Zählung
des PM (sieben Funktionen) war doppelt zu korrigieren:

- **Eine der sieben ist gar kein eigener Zeichner:** die Backtest-Kurve
  (`backtestui.js drawEquity`) ruft nur den gemeinsamen Zeichner auf. Drei
  Darstellungen laufen **heute schon** über den gemeinsamen Zeichner — dort
  fällt bei einer Zusammenlegung nichts weg.
- **Zwei Zeichner fehlten in der Zählung:** die Mini-Kurven auf den Karten
  (`renderer.js`) und die Ertragskurve über den Depot-Kacheln (`depot.js
  renderEquity`).

Es bleiben **sechs eigenständige Zeichenwerke, sichtbar an zehn Stellen der App.**
Geprüft und nicht betroffen, weil keine Kurvenbilder: Marktkarte (Kacheln),
Scoreboard, Messband-Karte, Bestandsliste — alles Tabellen oder Textkarten.

---

## Die zehn Stellen

„Der gemeinsame Zeichner" ist der, den heute schon Nr. 3, 5 und 7 benutzen
(`chart.js`): mehrere Linien übereinander, Wertachse, Zeitachse, gestrichelte
Vergleichslinie, Legende, und beim Zeigen mit der Maus ein Hinweiskästchen mit
allen Werten zum Zeitpunkt.

| Nr. | Wo in der App | Was die Darstellung kann | Was bei Zusammenlegung wegfiele | Gibt es Ersatz? |
|---|---|---|---|---|
| 1 | **Heute → Überblick**, die sechs Markt-Kacheln | Mini-Kurve ohne Achsen und Rahmen, bewusst klein; beim Zeigen mit der Maus Wert und Datum | Die bewusste Schlichtheit: mit Achsen und Beschriftung wären die Kacheln überladen | Der gemeinsame Zeichner müsste einen „nackten" Mini-Modus lernen; sein Maus-Hinweis kann das Gleiche schon |
| 2 | **Heute → Beobachtung**, die Karten je Wert | Dieselbe Mini-Kurve, etwas größer | Wie Nr. 1 | Wie Nr. 1 |
| 3 | **Regeln → Regelbuch**, „Depot gegen Buy & Hold" | Mehrere Linien, Legende, Maus-Hinweis | **Nichts** — läuft heute schon über den gemeinsamen Zeichner | — |
| 4 | **Regeln → Chart**, der Strategie-Chart | Kurs mit zwei Leitlinien, Trendkanäle als exakte Bänder (mit Markierung, welche Kerze den Kanal bestimmt hat; ein Kanal darf links aus dem Bild ragen), Überdehnungsband, **anklickbare Signalpunkte**, die mit der Signalliste und der Messung gekoppelt sind | Kanäle, Band und Klick-Kopplung — nichts davon kann der gemeinsame Zeichner. Dazu grundsätzlicher: dieses Bild rechnet mit **derselben Rechnung wie die Messmaschine** — es zeigt exakt das, was die Regel sieht | Kein Ersatz vorhanden; der gemeinsame Zeichner müsste alles davon erst lernen. Einen Maus-Hinweis hat dieses Bild heute nicht — der käme als Gewinn dazu |
| 5 | **Regeln → Autopilot**, die Backtest-Kurven | Mehrere Ergebnislinien mit Legende und Startkapital-Linie | **Nichts** — läuft heute schon über den gemeinsamen Zeichner | — |
| 6 | **Regeln → Chart**, der Indikator-Streifen unter dem Strategie-Chart | Indikatorverlauf (z. B. RSI) mit **eingefärbter Auslösezone**: man sieht, ab wo die Regel scharf ist | Die Auslösezone | Kein Ersatz; müsste gelernt werden |
| 7 | **Vermögen → Depot**, „Depotverlauf (seit Start der Simulation)" | Depotkurve mit Achsen, Fläche, Startkapital-Linie, Maus-Hinweis | **Nichts** — läuft heute schon über den gemeinsamen Zeichner | — |
| 8 | **Vermögen → Depot**, die Ertragskurve über den Kacheln | Schlichte Fläche mit drei Kopfzahlen (Verlauf, Hoch, max. Rücksetzer), erst ab 5 Punkten | Die Kopfzahlen-Kopfzeile als Einheit mit dem Bild — die Kurve selbst zeigt **dieselben Daten wie Nr. 7** (siehe Befund B2) | Nr. 7 zeigt die Daten bereits, mit Achsen und Maus-Hinweis; die drei Kopfzahlen müssten umziehen |
| 9 | **Vermögen → Depot**, das aufklappbare Positions-Detail | Zeichnet mit dem Strategie-Chart-Zeichner (Nr. 4) und markiert den **eigenen Einstieg** in der Kerzenreihe | Wie Nr. 4 — es ist derselbe Zeichner | Wie Nr. 4 |
| 10 | **Werkzeuge → Aktien-Explorer**, der große Kurs-Chart | Das Schwergewicht: **Linien- oder Kerzendarstellung** umschaltbar, **Zoom mit dem Mausrad** (die Kerze unterm Zeiger bleibt stehen), Durchschnittslinien 50/200 mit Ehrlichkeitsregel („erst ab 210 Kerzen — sonst steht es dabei"), Golden/Death-Cross-Ringe samt Messhinweis, Trendkanäle in zwei Spielarten (mit Güte als Durchsichtigkeit und dem „Kanal-Verzug"-Satz: wie viel der Bewegung beim Melden schon vorbei war), Unterstützung/Widerstand (dieselben Größen, auf die die Automatik reagiert), Volumen-Balken, anklickbare Signal-Dreiecke mit Liste und Detail, eigenes Fadenkreuz | So gut wie alles in dieser Zelle — der gemeinsame Zeichner kann davon **nichts**. Es ist die mit Abstand längste Verlustliste | Kein Ersatz vorhanden; jede Fähigkeit müsste einzeln nachgebaut werden |
| 11 | **Werkzeuge → Trendfinder**, das Chart je geprüftem Wert | Zwei Trendkanäle als **gefüllte Bänder** (der alte gestrichelt, der junge voll und nach Richtung gefärbt), Senkrechte an den Wendepunkten mit Beschriftung, Markierung der Bestätigungskerze | Bänder, Wende-Senkrechten, Richtungsfärbung | Kein Ersatz; müsste gelernt werden |

*(Elf Zeilen für zehn Stellen: Nr. 4 und Nr. 6 sind zwei Bilder an einer Stelle.)*

---

## Befunde beim Lesen (keine Urteile)

**B1 — Die Zusammenlegung ist an drei Stellen längst passiert.** Backtest,
Depot-gegen-Buy&Hold und Depotverlauf zeichnen seit der Zerlegung über denselben
gemeinsamen Zeichner. Der Streitfall ist also kleiner als „sieben Renderer":
es geht real um vier Spezial-Zeichner (Strategie-Chart samt Indikator-Streifen,
Explorer, Trendfinder, Mini-Kurven) und eine Doppelung (B2).

**B2 — Eine Kurve ist doppelt.** Auf „Vermögen → Depot" stehen zwei Bilder
**derselben Daten** direkt untereinander: die Ertragskurve über den Kacheln
(Nr. 8) und der Depotverlauf (Nr. 7). Einziger inhaltlicher Unterschied: Nr. 8
hat die drei Kopfzahlen, Nr. 7 hat Achsen und Maus-Hinweis.

**B3 — Es gibt zwei unvereinbare Zeitachsen, und beide sind mit Absicht so.**
Der gemeinsame Zeichner setzt Punkte **nach der Uhr** — richtig für Depot- und
Backtest-Kurven. Strategie-Chart, Explorer und Trendfinder setzen Punkte **nach
Kerzen**: jede Kerze gleich breit, Nächte und Wochenenden herausgerechnet. Legte
man Kursbilder auf die Uhr-Achse, bestünde ein Stundenkerzen-Bild über zwei
Wochen zu rund zwei Dritteln aus Übernacht-Lücken. Ein einziger Zeichner müsste
also beide Betriebsarten beherrschen — das ist möglich, aber es ist der Kern
dessen, was „ein Renderer" wirklich bedeutet, und nicht folgenfrei zu übergehen.

**B4 — Was die Vielfalt heute kostet** (der Vollständigkeit halber, denn das ist
die andere Seite der Rechnung): jede Farb- oder Thema-Änderung und jeder
Achsen-Fehler ist sechsfach zu pflegen; drei der sechs Zeichenwerke haben je eine
eigene Fadenkreuz-/Hinweis-Logik, die Mini-Kurven eine vierte.

---

*Für die Entwickler, außerhalb der Anwendersicht: die sechs Zeichenwerke sind
`chart.js drawLines` (gemeinsam; Nutzer Nr. 3/5/7 inkl. `backtestui.js
drawEquity` als dünner Aufruf), `explorer.js drawBig`/`drawAktuell` (Nr. 10),
`strategiechart.js drawStrategieChart` (Nr. 4/9) und `drawStrategieIndikator`
(Nr. 6), `wendeui.js zeichneWendeChart` (Nr. 11), `renderer.js sparkSVG`
(Nr. 1/2), `depot.js renderEquity` (Nr. 8). Auftrag 3a, nur Liste — kein Code
geändert.*
