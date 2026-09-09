## Der Live-Sammler hält die Oberfläche nicht mehr an

Seit dem 08.09. zeigte das Fenster während der US-Sitzung alle fünf Minuten für rund vier Minuten
„Keine Rückmeldung": die Live-Runde hängte ihre Kerzen synchron an 2.750 Jahresdateien an, und
der Hauptprozess, der auch das Fenster bedient, wartete dabei auf die Festplatte. Jetzt schreibt
die Runde nur noch eine kleine Tagesablage je Wert (`_live.jsonl` neben der Jahresdatei, ein
halbes Megabyte je Runde statt 148 MB), merkt sich den Stand in `_livestand.json` und fasst weder
Jahresdateien noch die Archivsperre an. Alles läuft über asynchrone Dateizugriffe; gemessen in
der isolierten Probe mit 2.000 Werten sank die längste Blockade des Hauptprozesses von 1,8 s auf
16 ms. Die Jahresdateien schreibt wie bisher allein der Nachlauf um 23:30.

Der Viewer sieht den laufenden Tag weiter: 1m sowie 5m/15m/1h aus Alpaca-Minuten lesen
Jahresdatei plus Tagesablage. Und der Abrufplan zählt am Deckel jetzt Sitzungsminuten statt
Wanduhr-Minuten, sodass nach einem Wochenende nicht mehr nur zwei bis vier Blöcke je Runde
geholt werden.
