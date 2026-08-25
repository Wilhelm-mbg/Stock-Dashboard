## Marktkarte: der ganze Markt auf einen Blick

Ein neuer Reiter zeigt hunderte Werte als Kachelkarte — jedes Rechteck ein Unternehmen,
die Fläche seine Größe, die Farbe der heutige Kurs, gruppiert nach Branche. Damit sieht
man in einer Sekunde, ob heute der ganze Markt nachgibt oder nur ein Sektor. Größe und
Farbe werden bei jeder Aktualisierung neu gerechnet, nicht gespeichert. Wie viele Werte
gezeigt werden, lässt sich einstellen.

Es ist eine Übersicht, kein Signal: An dieser Karte ist nichts gemessen, und sie sortiert
nichts nach „bestem Sektor“. Ausländische Emittenten fehlen bewusst — bei ihnen passt die
gemeldete Aktienzahl nicht zum gehandelten Papier, und eine falsche Größe wäre schlimmer
als eine fehlende.

Damit die Karte etwas anzeigen kann, muss einmal `node tools/stammdaten-holen.js` laufen —
das holt Branche und Aktienanzahl von der US-Börsenaufsicht. Ohne diese Daten nennt der
Reiter genau diesen Befehl, statt leer zu bleiben.
