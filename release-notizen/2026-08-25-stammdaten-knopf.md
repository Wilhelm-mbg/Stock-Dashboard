## Die Marktkarte holt ihre Daten jetzt selbst

Beim ersten Öffnen der Marktkarte stand bisher nur ein Befehl für die Kommandozeile —
eine Sackgasse für jeden ohne Entwicklungsumgebung. Jetzt steht dort ein Knopf
**Jetzt holen**: Er besorgt Branche und Aktienanzahl direkt von der US-Börsenaufsicht,
mit Fortschrittsanzeige, einmalig ein bis zwei Minuten. Danach nie wieder.

Der Weg über `node tools/stammdaten-holen.js` bleibt und ist weiterhin der bessere,
wenn alle Werte des Archivs auf einmal gemeint sind statt nur die, die die Karte zeigt.
Beide benutzen ab jetzt dieselbe Rechnung — die Zuordnung Branche-zu-Sektor stand vorher
an zwei Stellen und wäre früher oder später auseinandergelaufen.
