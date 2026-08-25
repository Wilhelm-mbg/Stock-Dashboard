# Der Reiter Messung zeigt jetzt alle Strategien, nicht eine

Strategien entstehen an zwei Stellen: Der Baukasten in der App legt sie im Datenordner
ab, gemessen werden die Dateien im Projektverzeichnis. Angezeigt wurde bisher nur der
erste Ort — im Reiter Messung stand **eine** Strategie, während dreizehn existierten.

Neu ist dort eine Liste mit allen: wo die Regel liegt, wie oft sie gemessen wurde, wann
zuletzt, und was dabei herauskam. Damit stehen Regel und Ergebnis endlich nebeneinander
statt in zwei verschiedenen Ansichten.

Wichtiger als das, was die Liste zeigt, ist das, was sie **benennt**. Drei Lücken, die
vorher unsichtbar waren:

- **Protokoll ohne Datei** — das Ergebnis liegt vor, die Regel dahinter ist nicht mehr
  auffindbar. Es lässt sich dann nicht nachrechnen.
- **Nur im Datenordner** — die Regel ist nicht mitgesichert. Geht der Ordner verloren,
  ist sie weg.
- **Nie gemessen** — es gibt die Regel, aber kein Ergebnis. Das ist etwas anderes als
  ein schlechtes Ergebnis.

Findet die App das Projektverzeichnis nicht — in der installierten Fassung ist es nicht
mitverpackt —, sagt sie das ausdrücklich, statt stillschweigend die Hälfte wegzulassen.
Ein Zettel `quelle-pfad.txt` im Datenordner darf darauf zeigen, wie schon beim
Kursarchiv.

Geschrieben wird weiterhin ausschließlich in den Datenordner; gelesen wird jetzt an
beiden Orten.
