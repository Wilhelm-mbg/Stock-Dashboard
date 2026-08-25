## Aufgeräumte Oberfläche: Leerzustände, Sammelzeilen, weniger Wiederholung

Vier Stellen, an denen die App mehr Fläche brauchte als Aussage — der erste von drei
Blöcken aus dem Struktur-Audit vom 25. August.

**Listen sagen nicht mehr dreißigmal dasselbe.** Der Signal-Monitor zeigte an ruhigen
Tagen für jeden Wert dieselbe Zeile, der Trendfinder bei frischem Archiv für jeden Wert
dieselbe Absage. Wiederholt sich ein Grund mehr als fünfmal, steht jetzt eine Zeile mit
Zähler da, und die Einzelzeilen liegen wörtlich in einer Klappe darunter. Der Grund
selbst wird nicht umformuliert: nur die Zahl, die sich von Wert zu Wert unterscheidet,
weicht einem Auslassungszeichen — die gemessene Konstante bleibt stehen. Zeilen mit
Wechsel-Signal, Trendkanal oder eröffneter Position werden nie gebündelt.

**Leere Flächen sagen jetzt, was zu tun ist.** Der Strategie-Chart zeigte vor dem ersten
Laden eine schwarze Fläche mit vollständiger Legende — eine Beschriftung für Linien, die
es noch nicht gab. Unter den Filtern des Schein-Finders stand gar nichts. Beide haben
jetzt einen Satz. Schlägt das Laden fehl, bleibt der Satz stehen, statt eine leere Fläche
freizugeben.

**Kein Entwickler-Jargon mehr im Endnutzer-Text.** Marktkarte und Messungs-Karte
schickten Anwender auf `node`-Befehle und einen vollen Windows-Pfad — beides braucht
Quellordner und Node, die eine installierte App nicht hat. Der Weg über den Knopf steht
jetzt vorn, der Ordner in der Sprache der App; der Befehl und der vollständige Pfad sind
unverändert erhalten, aber unter „Für Entwickler" einsortiert.

**Fremdtexte brechen nicht mehr mitten im Wort ab.** Die Begründungen des
Spekulations-Radars wurden hart bei 240 Zeichen geschnitten; der Satz endete einfach, und
man konnte nicht erkennen, ob die Quelle schlecht war oder die Anzeige gekürzt hat.
Gekappt wird jetzt an der Wortgrenze mit sichtbarem „…" — und nur dort, wo wirklich etwas
fehlt.

**Kleinigkeiten, die trotzdem falsch waren:** Die Kostenhürde stand im Raster der
Auswahlfelder und brach auf Wortbreite um. „Alle Bücher zurücksetzen" stand neben
„Speichern"; der Knopf hat jetzt einen eigenen Abschnitt „Gefahrenzone" und ist gesperrt,
bis ein Haken gesetzt ist — die Sicherung vor dem Löschen und die Rückfrage mit den
konkreten Zahlen bleiben unverändert. Die Überschrift „Drei Zeithorizonte, drei getrennte
Strategien" zählte falsch (es sind vier Karten plus Fußnote) und heißt jetzt „Die
Strategien im Überblick". Zwei Statustexte verwiesen auf die Seite, auf der sie selbst
standen, und nennen jetzt den Knopf, der die Daten wirklich holt. Die Spalte „Ort" der
Strategien-Liste zeigte in jeder Zeile denselben Wert und erscheint nur noch, wenn es
mehr als einen gibt.

**Sichtbar unter 750 px:** Die Watchlist steht jetzt vor Archiv und Signal-Monitor.

---

### Für die Release-Wache

37 neue Zusicherungen in `test-v6.js` (Abschnitte 56, 57, 58 und drei bestehende
Abschnitte). Sie prüfen Verhalten statt Textmarken: der Bündelungs-Baustein und die
Kappungs-Hilfe werden aus der Quelle geschnitten und ausgeführt, der Leerzustand des
Mittelfrist-Depots schlägt seine Knopfbeschriftung im Markup nach.

**Ein Fehler im Ablauf, der in den Bestand gehört:** Commit `edcc203` („Kostenhürde,
Gefahrenzone, Watchlist-Spalte") enthält 74 Zeilen `test-v6.js`, die nicht von dieser
Sitzung stammen — Block 47 der Winkel-Studie lag beim `git add` unfertig im geteilten
Arbeitsbaum. Inhaltlich vollständig und grün, nur unter der falschen Überschrift; die
Studien-Sitzung hat es in ihrer eigenen Notiz ebenfalls vermerkt. Nicht zurückgedreht,
weil andere Sitzungen den Stand längst gezogen haben.
