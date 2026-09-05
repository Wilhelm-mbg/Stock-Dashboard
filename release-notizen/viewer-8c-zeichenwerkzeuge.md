# Zeichenwerkzeuge im Aktien-Viewer (Viewer 8c, 05.09.2026)

Im Kerzenchart lässt sich jetzt zeichnen. Links neben dem Chart steht eine senkrechte
Werkzeugleiste wie im Vorbild; gezeichnet wird mit **Klick-Klick**, nicht mit Ziehen.

**Die Werkzeuge.** Linie, Horizontale, Vertikale, Rechteck, Pfeil, Text, Pinsel und ein
Messwerkzeug. Dazu fünf Fibonacci-Werkzeuge in einem Untermenü: Retracement,
trendbasierte Erweiterung, Kanal, Zeitzonen und Fächer – mit den neun gewohnten Niveaus
von 0 bis 261,8. Tastenkürzel wie im Vorbild, wo es dort welche gibt: **Alt+F** für
Fibonacci, **Alt+Umschalt+R** für das Rechteck, sonst der Anfangsbuchstabe. Esc bricht
ab, Entf löscht.

**Das Messwerkzeug** zeigt dieselbe Box wie das Vorbild: Kursdifferenz absolut und in
Prozent, die Zahl der Kerzen, die Dauer und das gehandelte Volumen dazwischen – mit
Pfeil über die gemessene Strecke. Sie verschwindet beim nächsten Klick.

**Der Magnet** hat drei Stufen. *Aus* lässt jeden Punkt, wo er gesetzt wurde. *Schwach*
fängt nur, wenn der Punkt ohnehin schon nahe an Eröffnung, Hoch, Tief oder Schluss der
Kerze liegt. *Stark* fängt immer. Gefangen wird beides – Kurs **und** Zeitpunkt der
Kerze: ein Punkt auf dem Hoch, aber zwischen zwei Kerzen, sitzt auf nichts.

**Jede Zeichnung merkt sich Zeit und Kurs, nie Pixel.** Deshalb bleibt sie beim Zoomen
und Blättern an ihrem Kurs stehen, statt mit dem Bild zu verrutschen – und deshalb gilt
sie auch in jedem Zeitrahmen: eine Linie, die auf dem Tageschart gezogen wurde, liegt
auf dem Stundenchart an derselben Stelle.

**Gespeichert wird je Wert.** Ein Wertwechsel lädt die Zeichnungen des neuen Kürzels,
der Rückweg findet die alten wieder. Über zwei Knöpfe am Fuß der Leiste lassen sie sich
als JSON-Datei ausgeben und wieder einlesen.

**Stil je Zeichnung.** Wer eine Zeichnung anklickt, bekommt ein kleines Feld oben rechts
im Chart: Farbe, Linienbreite, Linienart – bei einer Beschriftung auch ihr Text. Punkte
lassen sich an ihren Griffen nachträglich fassen und verschieben, die ganze Zeichnung
ebenso. „Sperren" und „Ausblenden" gelten für alle Zeichnungen des Werts.

**Der Papierkorb fragt zweimal.** Ein Rückgängig gibt es nicht, und ein Fehlklick soll
keine Stunde Arbeit kosten: der erste Klick schärft, der zweite löscht.

**Gezeichnet wird auf einer eigenen Ebene** über den Kerzen – der Chart selbst bleibt
unverändert. Solange ein Werkzeug die Maus hält, blättert und zoomt der Chart nicht;
lässt man es los, geht beides wieder wie zuvor.

**Aus einer Zeichnung folgt nichts.** Sie ist Anzeige – kein Signal, keine Bedingung,
kein Auftrag. Gemessen ist an keinem dieser Niveaus etwas, und gehandelt wird aus dem
Viewer weiterhin nichts.

*Nicht gebaut (Entscheid 05.09.): Elliott-Wellen, harmonische Muster, Gann,
Kreise und Spiralen, Emojis, Alarme.*
