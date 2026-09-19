## Die App sammelt Schlagzeilen jetzt für rund 1.000 Werte ohne Deckel

Das Nachrichten-Archiv holt alle sechs Stunden die Yahoo-Schlagzeilen für die Klassen 1–3 des
Tages-Panels (1.020 Werte, Liste in `Markt-Dashboard-Daten/nachrichten-universum.json`; fehlt
die Datei, bleibt es bei den bisherigen 17 Werten) und legt sie je Wert und Jahr unter
`Markt-Dashboard-Daten/nachrichten/<Kürzel>/<Jahr>.jsonl` ab — nur angehängt, ohne die alte
Grenze von 400 Einträgen. Die bisherigen Einträge aus dem Store werden beim ersten Lauf einmal
übernommen. Geschrieben wird im Hintergrund, die Oberfläche bleibt dabei bedienbar (gemessen:
Antwortzeit unter 60 ms). Nichts davon wird bewertet, nichts gehandelt — das Archiv ist nur
die Voraussetzung dafür, dass eine Nachrichten-Stimmung irgendwann messbar wird.
