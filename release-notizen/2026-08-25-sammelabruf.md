# Die Marktkarte zeigt jetzt doppelt so viele Werte — und lädt trotzdem schneller

Bisher holte die App jeden Kurs einzeln. Für die Marktkarte mit ihren 600 Werten waren
das 600 Anfragen für ein einziges Bild — deshalb war sie träge und durfte nicht im
Hintergrund nachladen.

Kurse lassen sich auch gebündelt abrufen: bis zu 800 Wertpapiere in **einer** Anfrage.
Nachgemessen sind 800 Kürzel in 3,4 Sekunden; die App bündelt in Blöcken zu 400.

Was sich dadurch ändert:

- Die Karte steht jetzt per Vorgabe auf **1200 Werten** statt 600. Das kostet drei
  Anfragen statt zwölfhundert. Auch „alle mit Stammdaten" (1719 Werte) ist damit
  bezahlbar — fünf Anfragen.
- Sie **lädt im Hintergrund nach**, alle fünf Minuten, auch wenn ein anderer Reiter offen
  ist. Nur bei unsichtbarem Fenster pausiert sie.
- Ein gescheiterter Kursabruf steht jetzt in der Statuszeile, statt stillschweigend eine
  halbe Karte zu zeigen.

Der gebündelte Abruf steht als allgemeines Werkzeug bereit, nicht nur für die Karte —
alles, was viele Kurse auf einmal braucht, kann ihn benutzen.
