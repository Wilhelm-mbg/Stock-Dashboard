## Sicherung und Umzug auf einen anderen Rechner

Neu: `node tools/sicherung.js --erstellen` legt ein Paket in den Download-Ordner —
**558 KB statt 320 MB**. Darin ist nur das Unersetzliche: Depot, eigene Papiere,
Ergebnistermine, Stammdaten. Die 300 MB Kursdateien bleiben draußen, die lädt die App
selbst wieder nach.

**Zugangsdaten sind nicht drin.** Ein Sicherungspaket wandert per Stick oder Mail auf
andere Rechner; API-Schlüssel haben darin nichts verloren, auch nicht die eines
Demo-Kontos. Auf der neuen Maschine einmal unter Werkzeuge → Einstellungen eintragen.

Zurückspielen mit `--einspielen <datei>`; der bisherige Stand wird dabei zur Seite gelegt,
nicht überschrieben. `--ansehen <datei>` zeigt, was drin ist, ohne etwas zu verändern.
