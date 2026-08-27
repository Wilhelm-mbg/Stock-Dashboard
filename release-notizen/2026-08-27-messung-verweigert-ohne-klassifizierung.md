# Die Messmaschine misst nicht mehr blind, wenn die Wertpapier-Referenz fehlt

Bisher galt: Fehlt die Datei, die Aktien von Fonds und Testpapieren unterscheidet,
ließ der Universumsfilter stillschweigend alles durch — eine Messung wäre dann auf
dem ganzen Archiv gelaufen (rund dreimal so viele Reihen), und kein Protokollfeld
hätte es festgehalten. Die eigens dafür gebaute Sichtbarkeits-Abfrage wurde von
keinem einzigen Werkzeug benutzt.

Jetzt verweigert die Maschine in diesem Fall die Messung mit klarer Begründung, und
jedes neue Protokoll hält den Zustand der Referenz ausdrücklich fest — auch wenn er
gesund ist. Ein Protokoll ohne dieses Feld ist damit als »vor dieser Version
entstanden« erkennbar (Maschine 1.6.0).

An den Messwerten ändert sich nichts: Die Referenz war in allen bisherigen Läufen
nachweislich vorhanden und gesund.
