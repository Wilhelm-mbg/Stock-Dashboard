## Der Live-Sammler führt jetzt alle Werte mit, die das Archiv kennt

Bisher lief die Minutensammlung während der US-Sitzung für 500 Werte (die Liste
„top500"). Jetzt sind es **alle Reihen, die das Alpaca-Archiv heute noch führt** —
zurzeit 3.067 —, dazu wie bisher Watchlist, Werte mit offener Position und der Wert,
der gerade im Aktien-Explorer offen ist. Welche Werte das sind, sagt das Archiv selbst
(seine Lebenszeit-Datei), nicht mehr eine mitgeführte Namensliste: ein Wert, den das
Archiv kennt, fällt damit nicht mehr still heraus.

Möglich wurde das durch einen Umbau darunter. Ein Anhang an eine Jahresdatei hat die
Datei bisher vollständig kopiert — bei 500 Werten rund 1,8 GB alle fünf Minuten, bei
allen Werten wären es 8 GB gewesen, auf einer Festplatte zu viel. Jetzt wird an Ort und
Stelle angehängt, abgesichert durch ein Reparaturjournal: für alle 3.067 Werte
**156 MB je Runde statt 8.020 MB** — und ein Absturz mitten im Schreiben wird beim
nächsten Start vollständig zurückgenommen, byteidentisch.

Im Betriebs-Reiter unter „Kursarchiv" steht die geschriebene Menge jetzt in der Zeile
des Live-Sammlers: „… · geschrieben 12 MB in 0,8 s".
