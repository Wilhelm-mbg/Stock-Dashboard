## Das Kursarchiv lädt künftig von selbst nach

Bisher wurden die Kursdaten von Hand geholt – und weil ein Lauf ohne den richtigen
Schalter „Nichts zu tun" meldete und zufrieden endete, stand das Archiv zwei Tage still,
ohne dass es jemandem auffiel.

Es gibt jetzt **einen Befehl**, der beides nachlädt, anschließend prüft und bei einem
Befund eine datierte Meldedatei in den Datenordner schreibt. Damit lässt sich eine
nächtliche Aufgabe einrichten, deren Verhalten im Fehlerfall vorher ausprobiert wurde –
und nicht erst dann, wenn es darauf ankommt.

**Während des Nachladens ist das Archiv nicht kaputt, sondern gemischt** – ein Teil neu,
ein Teil alt. Genau das sieht gesund aus. Der Lauf setzt deshalb eine Sperre, und wer in
dieser Zeit fragt, bekommt „wird gerade geschrieben" statt eines Urteils, auf das kein
Verlass wäre.

Und die Sperre kann einen Absturz überleben: Sie trägt einen Zeitstempel und gilt nach
sechs Stunden als verwaist. Dann blockiert sie nichts mehr – wird aber ausdrücklich
gemeldet, denn ein abgestürzter Lauf ist selbst ein Befund. Beim Erproben ist genau das
einmal passiert.
