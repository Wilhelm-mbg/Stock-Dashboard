# Lagebild-Export für das Management-Tool

Die App schreibt neben `analyse-daten.json` jetzt ein vollständiges Lagebild in den Datenordner: `lagebild.json`
(alles, was Heute, Markt, Regeln und Betrieb zeigen – Bücher mit der Zeile „Gegen den Markt" und dem Rückblick
wörtlich wie auf der Karte, Protokoll aller drei Bücher, Marktkacheln, Radar, Antwort-Seite, Gesundheit) und
`markt-chart/<Kürzel>.json` mit den Kerzen der Watchlist, der Buch-Positionen und der zuletzt im Viewer geöffneten
Werte. Während der US-Handelszeiten alle 2 Minuten, sonst alle 10, nach jeder Depot-Änderung sofort. Davon liest der
Reiter „Markt" im Management-Tool. Nichts aus den Einstellungen oder Zugangsdaten gelangt in die Dateien; der Handel
selbst ist unverändert. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
