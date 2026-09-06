# Das Minutenarchiv läuft während der Sitzung mit (Live-Sammler über Alpaca)

Während der US-Sitzung – Vor- und Nachbörse eingeschlossen – holt die App alle fünf
Minuten die fertigen Minutenbalken von Alpaca (SIP, 15 Minuten verzögert, dazu eine
Minute Sicherheit) für die umsatzstärksten 500 Werte, die Watchlist, offene Positionen
und den Wert im Aktien-Viewer, und hängt sie an das Alpaca-Minutenarchiv an. Nichts wird
überschrieben, die laufende Minute wird nie geschrieben; Nachtlauf und Live-Sammler
teilen sich eine Sperre.

**Der Viewer sieht es sofort.** Sind die Alpaca-Minuten jünger als das Archiv eines
Zeitrahmens, bildet der Viewer 5-Minuten-, 15-Minuten- und Stundenkerzen daraus – auf dem
Sitzungsgitter (09:30, 10:30 …, Nachbörse ab 16:00, Halbtage ab 13:00). Die Fußzeile sagt
dann „Alpaca-Minuten, verdichtet, bis 15:42 ET". Yahoo bleibt für den Rest der Rückfall.

**Im Kursarchiv** (Werkzeuge → Betrieb) steht eine neue Zeile: wie viele Werte, wann die
letzte Runde lief, bis wann die Minuten reichen, wie viele Abrufe eine Runde kostet, und
ob die Quelle gedrosselt hat. Daneben der Schalter „Live-Sammler" (Vorgabe an). Ohne
Alpaca-Zugang in den App-Einstellungen bleibt er aus und sagt es.

Die Strategien lesen weiterhin Yahoo; gehandelt wird aus alldem nichts. Alles Simulation,
keine Anlageberatung.
