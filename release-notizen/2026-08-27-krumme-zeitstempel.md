# Kurs-Zeitstempel, die nicht ins Raster passen, kommen nicht mehr ins Archiv

Die Kursquelle liefert gelegentlich Einträge, deren Uhrzeit nicht auf das Raster der
gewählten Auflösung passt — bei Stundenkerzen etwa 15:12 statt 15:30. Das sind
Kursstempel, keine Kerzen. Die App erkennt sie jetzt und lässt sie beim Einlesen weg;
vorhandene werden beim nächsten Abruf mit ausgeräumt.

Gemessen über alle vier Archive: 151 solcher Einträge bei Stundenkerzen, 8 bei
15-Minuten-, 14 bei 5-Minuten-Kerzen — **und keiner davon trug Umsatz**. Bei
Minutenkerzen hilft die Uhrzeit prinzipiell nicht weiter, weil dort jede Minute ins
Raster passt; das ist die Grenze dieser Prüfung und steht so im Programm.

**Die Schlusskerze des Tages gehört ausdrücklich dazu und bleibt.** Sie sieht einer
fehlerhaften Kerze zum Verwechseln ähnlich — keine Umsatzangabe, Hoch gleich Tief — trägt
aber den offiziellen Schlusskurs. Im Stundenarchiv sind das 4.147 Kerzen.
