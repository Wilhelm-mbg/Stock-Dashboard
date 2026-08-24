# Markt-Dashboard

Windows-Desktop-App (Electron) für Marktüberblick und eine **Trading-Simulation mit virtuellem Kapital**.

> Simulation, keine Anlageberatung. Es wird kein echtes Geld gehandelt. Optionsscheine werden per Black-Scholes synthetisch bewertet: Hebel, Zeitwertverfall, Volatilitäts-Smile und der Vola-Einbruch nach Ergebnisterminen sind abgebildet, echte Emittenten-Preise nicht. Smile und Termin-Struktur sind Modellannahmen in der üblichen Größenordnung und **nicht an Emittentenkursen kalibriert** – der App fehlen dafür echte Scheinpreise über mehrere Basispreise. Der Zinssatz ist mit 2 % angenommen.

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

## Signatur und Update-Kette

Der Installer ist **nicht signiert**, und die App sagt das auch selbst (Einstellungen →
Automatische Updates). Was das konkret heißt:

| | Zustand |
|---|---|
| Transport | HTTPS zu GitHub |
| Integrität des Downloads | electron-updater prüft die SHA-512 aus `latest.yml` – fängt einen kaputten oder abgebrochenen Download |
| Herkunft des Pakets | **ungeprüft** – `latest.yml` und Installer stammen aus demselben Release |
| Herausgeber | **ungeprüft** – kein Code-Signing-Zertifikat, Windows SmartScreen warnt beim ersten Start |

Die gesamte Vertrauenskette hängt damit an einem Punkt: **wer in dieses Repository
schreiben darf.** Wer dort ein Release anlegt, kann eine Version veröffentlichen, die
jede laufende Installation ohne Nachfrage einspielt. Eine Prüfsumme gegen eine Datei aus
demselben Release ändert daran nichts – sie schützt gegen Übertragungsfehler, nicht gegen
den Absender.

Was stattdessen trägt, und was nachprüfbar ist:

- Der Installer wird **nur** von GitHub Actions gebaut, aus dem Commit, auf den der Tag
  zeigt (`.github/workflows/build.yml`). `npm ci` statt `npm install` – dieselbe Lockdatei
  ergibt dasselbe Paket.
- Nach dem Build läuft die Testsuite ein zweites Mal **gegen das gebaute Paket**:
  Abschnitt 31 von `test-v6.js` vergleicht jede ausgelieferte Datei byteweise mit der
  Quelle und die Paketversion mit dem Tag. Ein Paket, das nicht zum Commit passt, wird rot.
- Der Update-Kanal ist auf `Wilhelm-mbg/Stock-Dashboard` festgenagelt (`package.json`,
  `build.publish`), nicht auf eine Adresse aus den Einstellungen.
- Wer das nicht will, entfernt in den Einstellungen den Haken bei „Neue Versionen selbst
  herunterladen" – dann kommt nichts ungefragt herein.

### Wenn doch signiert werden soll

Der Bauschritt nimmt die üblichen electron-builder-Variablen bereits entgegen. Es sind
zwei Repository-Geheimnisse nötig, sonst **keine** Codeänderung:

| Geheimnis | Inhalt |
|---|---|
| `CSC_LINK` | die `.pfx`-Datei, base64-kodiert (oder eine URL darauf) |
| `CSC_KEY_PASSWORD` | das Kennwort dazu |

Sind sie gesetzt, signiert electron-builder den Installer und electron-updater prüft bei
jedem Update zusätzlich den Herausgebernamen gegen die Signatur. Sind sie leer, baut
derselbe Schritt genau wie heute; der Lauf schreibt in beiden Fällen hin, was er getan hat.

Was ein Zertifikat kostet (Stand 2026): ein OV-Zertifikat rund 200–400 € im Jahr, ein
EV-Zertifikat 300–600 €, beides mit Identitätsprüfung und seit 2023 nur noch auf Hardware
(Token oder HSM) – ein HSM ist die Voraussetzung dafür, dass eine CI überhaupt signieren
kann. Nur ein EV-Zertifikat räumt die SmartScreen-Warnung sofort weg; ein OV-Zertifikat
muss sich den Ruf erst erarbeiten.

## Datenquellen

Kurse über die inoffizielle Yahoo-Finance-Schnittstelle (bis zu 15 Minuten verzögert), News über Google News. Optional Capital.com **Demo**-Konto zum Spiegeln der Signale — der Live-Handelsserver ist in der App bewusst nicht freigeschaltet.
