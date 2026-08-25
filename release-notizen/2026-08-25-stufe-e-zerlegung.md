# Innen aufgeräumt: die Riesendatei ist zerlegt – außen ändert sich nichts

Die zentrale Programmdatei (depot.js) war auf fast 10.000 Zeilen gewachsen; sieben
in sich geschlossene Bereiche sind jetzt eigene Dateien: Trendfinder, Signal-Chart,
Berichte (Retro, Wochenreport, Analyse-Export, Messbericht), Kursarchiv-Auffüllen,
Backtest samt Worker-Pool, Kostenmessung/Spannen und die nächtliche Tiefensuche.
Alles ist wörtlich umgezogen, nichts umformuliert; Bedienung, Messungen und Handel
bleiben unverändert. Für künftige Fehlersuchen und Umbauten ist jeder Bereich jetzt
einzeln les- und prüfbar – und ein neues Prüfwerkzeug (tools/ui-probe.js) klickt
nach jedem Umbau automatisch alle Reiter und Unterseiten durch.
