# Markt-Dashboard

Windows-Desktop-App (Electron) für Marktüberblick und eine **Trading-Simulation mit virtuellem Kapital**.

> Simulation, keine Anlageberatung. Es wird kein echtes Geld gehandelt. Optionsscheine werden per Black-Scholes synthetisch bewertet (Hebel und Zeitwertverfall realistisch, aber keine echten Emittenten-Preise).

## Funktionen

- **Dashboard**: Big Tech, Chip-Sektor, Indizes, Wirtschaftskalender und Markt-News
- **Aktien-Explorer**: freie Suche, Charts von 1 Tag bis Max., Kennzahlen, News, KI-Analyse
- **Simulations-Depot**: Stunden-Strategie (News-Sentiment + Technik + Elliott-Wellen) und Intraday-Strategien (Ausbrüche, Scalping, Rücksetzer, Wellenreiter mit Trendkanal, ORB)
- **Analyse-Zentrale**: prüft alle Modi per Walk-Forward, schleift Parameter nach und gibt eine Empfehlung mit Übernehmen-Knopf
- **Risikomanagement**: Positionslimits, Tagesverlust-Limit, Event-Blackout, Meide-Stunden, Notbremse nach Verlustserien
- **Lokale KI (optional)**: Ollama prüft jeden geplanten Trade als letzte Instanz (Veto oder Positionsgrößen-Anpassung)
- **Analyse-Export**: schreibt Kennzahlen, Trades, Kursdaten und Telemetrie nach `Downloads/Markt-Dashboard-Daten`

## Installation

Unter [Releases](../../releases) die aktuelle `Markt-Dashboard-Setup.exe` herunterladen und ausführen. Windows SmartScreen meldet einen unbekannten Herausgeber, da die Datei nicht signiert ist: „Weitere Informationen" und dann „Trotzdem ausführen".

## Datenquellen

Kurse über die inoffizielle Yahoo-Finance-Schnittstelle (bis zu 15 Minuten verzögert), News über Google News. Optional Capital.com **Demo**-Konto zum Spiegeln der Signale — der Live-Handelsserver ist in der App bewusst nicht freigeschaltet.
