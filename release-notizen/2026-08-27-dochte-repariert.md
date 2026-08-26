# Kaputte Dochte werden repariert, statt Kerzen zu löschen

An sieben verkürzten US-Handelstagen liefert die Kursquelle Stunden ohne einen einzigen
gehandelten Anteil, deren **Hoch oder Tief** trotzdem weit außerhalb der Tagesspanne
liegt — bei einem Wert 5 % unter dem tatsächlichen Tagestief. Das trifft alles, was Hoch
und Tief liest: Kanalkanten, Spannen, Stopps.

Die App bringt diese Werte ab sofort beim Einlesen in Ordnung. **Sie löscht dabei nichts.**
Hoch und Tief werden auf den tatsächlichen Kurs der Stunde gesetzt; Schlusskurs, Umsatz
und Zeitstempel bleiben unverändert. Über das ganze Stundenarchiv gemessen: 13.528
Dochte in Ordnung gebracht, **keine einzige Kerze verloren, kein einziger Schlusskurs
verändert**.

**Warum nicht gelöscht wird, obwohl das naheliegender aussah:** Eine Löschregel hätte in
der Stichprobe jede fünfte Kerze entfernt, die *auf die letzte Stelle* der offizielle
Tagesschlusskurs ist. An einem verkürzten Handelstag endet die Sitzung früher, und die
Kerze an dieser Stelle **ist** die Schlussauktion. Hochgerechnet wären rund 7.500
Schlusskurse verloren gewesen — dauerhaft.

Zwei Fälle bleiben ausdrücklich unangetastet: Stunden ohne Umsatz, die *innerhalb* der
Tagesspanne liegen (das sind echte Handelspausen in wenig gehandelten Papieren), und
Tage, an denen es keine Vergleichsspanne gibt. Wo sich nichts entscheiden lässt, wird
nichts geändert.

Außerdem erkennt die App jetzt Kurs-Zeitstempel, die nicht auf das Raster der gewählten
Auflösung passen, und lässt sie nicht mehr ins Archiv. Die Schlusskerze des Tages gehört
ausdrücklich dazu und bleibt.
