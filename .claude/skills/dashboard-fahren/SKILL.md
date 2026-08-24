---
name: dashboard-fahren
description: Startet das Markt-Dashboard im Browser, klickt es fern und fotografiert es; nimmt die Kursabrufe auf und baut daraus eine bedienbare Einzeldatei. Nutzen, wenn die App gestartet, gezeigt, per Screenshot belegt oder ohne Electron bedienbar gemacht werden soll. Use when asked to run, start, screenshot, demo or drive the dashboard app.
---

Die App ist Electron. Auf einem Rechner ohne Bildschirm – Container, CI, entfernte
Sitzung – gibt es also nichts zu sehen, und `npm start` bringt nur „Missing X server".

Der Weg hier ist ein anderer: `index.html` laeuft in einem normalen Chromium, und
`api-shim.mjs` legt die Electron-Bruecke `window.api` darunter. Die Oberflaeche merkt
davon nichts, die Kurse sind echt.

## Voraussetzungen

```bash
npm i -D playwright        # bringt seinen eigenen Chromium mit
```

Ein global installiertes Playwright wird ebenfalls gefunden. Sonst nichts – kein
xvfb, keine System-Bibliotheken, kein Electron-Download.

## Fernsteuern

```bash
node .claude/skills/dashboard-fahren/driver.mjs
```

Dann Zeile fuer Zeile:

```
start                 # Server + Chromium + Bruecken-Nachbau
warte 20              # die Kacheln fuellen sich ueber etwa 20 Sekunden
wegklicken            # Erststart-Frage nach Diagnosedaten schliessen
bild heute            # Screenshot nach .bilder/
reiter depot
explorer NVDA
netz                  # Abrufe, Fehlabrufe, Skriptfehler
ende
```

| Befehl | Wirkung |
|---|---|
| `start` | App laden |
| `warte [s]` | warten, bis Daten da sind (Standard 10) |
| `wegklicken` | Diagnose-Banner schliessen |
| `reiter <name>` | `dashboard`, `strategien`, `depot`, `werkzeuge`, `messung` |
| `explorer <sym>` | Wert im Aktien-Explorer oeffnen |
| `klick <css>` | Element ueber das DOM anklicken |
| `text [css]` | Text eines Bereichs ausgeben |
| `eval <js>` | Ausdruck in der Seite auswerten |
| `bild [name]` | Screenshot, Fenster und ganze Seite |
| `netz` | Abrufe, Fehlabrufe, Skriptfehler |
| `sichern [datei]` | alle Abrufe als `schnappschuss.json` wegschreiben |
| `ende` | schliessen |

Fuer den Einsatz aus einer anderen Sitzung heraus laesst sich der Treiber in tmux
legen und mit `send-keys` fuettern:

```bash
tmux new-session -d -s dash -x 200 -y 50
tmux send-keys -t dash 'node .claude/skills/dashboard-fahren/driver.mjs' Enter
timeout 20 bash -c 'until tmux capture-pane -t dash -p | grep -q "dashboard>"; do sleep 0.2; done'
tmux send-keys -t dash 'start' Enter
tmux capture-pane -t dash -p
```

## Bedienbare Einzeldatei bauen

Kein Netz, kein Electron, trotzdem klickbar: die Abrufe aufzeichnen und mitliefern.

```bash
# im Treiber: start, warte 25, wegklicken, alle Reiter und Werte durchgehen, dann
sichern schnappschuss.json

# danach
node --max-old-space-size=6000 .claude/skills/dashboard-fahren/bundle.mjs \
  schnappschuss.json dashboard.html --seite
```

Heraus kommt eine Datei mit allen 21 Skripten, der gepackten Aufzeichnung und dem
Bruecken-Nachbau im Schnappschuss-Modus. Reiter, Explorer, Zeitraeume, Einstellungen
und Depot funktionieren; die Kurse stehen auf dem Stand der Aufnahme. Ohne `--seite`
entsteht ein Rumpf ohne `<html>`/`<head>`/`<body>`, wie ihn der Artifact-Dienst
verlangt.

| Schalter | Wirkung |
|---|---|
| `--seite` | vollstaendiges HTML-Dokument statt Rumpf |
| `--kerzen=N` | Kursreihen auf die letzten N Punkte stutzen (Standard 500, `0` laesst alles) |
| `--grenze=N` | Antworten ueber N KB weglassen (Standard 150) |

Die Groesse entscheidet sich an diesen beiden Zahlen. Eine volle Aufzeichnung wiegt
mehrere hundert Megabyte – die Strategien holen Kurshistorie ab 1962 und zwei Jahre
Stundenkerzen fuer Dutzende Werte. Mit `--kerzen=300` bleiben von 919 Abrufen rund
32 MB, gepackt 8,4 MB, Datei 9,6 MB. Der Artifact-Dienst nimmt bis 16 MB; der
Buendler warnt, wenn er darueber landet.

Depot und Einstellungen landen in dieser Betriebsart im `localStorage` des
Betrachters (Praefix `md:`), nicht in Dateien. Der CSV-Export der Depot-Ansicht laeuft
ueber die Faehigkeit `downloads` des Betrachters – beim Veroeffentlichen also
`capabilities: {downloads: true}` mitgeben, sonst bleibt der Knopf still.

## Fallstricke

- **Yahoo antwortet 429 ohne Browser-Kennung.** Der Treiber schickt denselben
  User-Agent wie `main.js`. Wer den weglaesst, bekommt leere Kacheln und haelt es
  faelschlich fuer einen Fehler der App.
- **`file://` reicht nicht.** `index.html` traegt eine Meta-CSP mit `default-src
  'self'`; ueber `file://` laedt kein einziges Skript. Der Treiber bringt deshalb
  einen eigenen Mini-Server auf 127.0.0.1 mit (Port ueber `PORT` einstellbar).
- **Die Erststart-Frage nach Diagnosedaten** erscheint nach vier Sekunden und legt
  sich ueber die halbe Seite – vor jedem Screenshot `wegklicken`.
- **Ueber das DOM klicken, nicht ueber Koordinaten.** Die App zeichnet Charts auf
  Canvas-Flaechen, die Treffer sonst abfangen. `klick` und `explorer` tun das schon.
- **Ergebnistermine bleiben leer.** Yahoos Kalender-Endpunkt verlangt Cookie und
  Crumb ueber einen POST aus dem Hauptprozess; der Nachbau kann das nicht.
  Capital.com und Ollama sind aus demselben Grund abgeschaltet.
- **Im Schnappschuss-Modus wandern Zeitstempel.** Yahoo haengt an Chart-Abrufe
  `period1`/`period2`. Der Nachbau sucht deshalb ersatzweise nach gleicher URL-Basis
  mit gleichem `range` und `interval` – sonst waere jeder Chart am Tag nach der
  Aufnahme leer.
