# OmniRoute — installiert als Backup, nirgends angeschlossen

*Stand 18.09.2026, nachgetragen am selben Tag (native Module, physischer Ort). Lizenz: MIT (Copyright 2026 diegosouzapw). Quelle: https://github.com/diegosouzapw/OmniRoute*

## Was es ist und warum nur Backup

OmniRoute ist ein selbst gehostetes KI-Gateway: eine OpenAI-/Anthropic-kompatible Schnittstelle
auf `http://localhost:20128/v1`, hinter der laut Projekt 357 Anbieter und über 1.200 Modelle
liegen, mit automatischem Wechsel bei Ausfall und gebündelten Gratis-Kontingenten.

**Entscheid von Wilhelm, 18.09.2026:** OmniRoute wird **als Backup** aufgenommen — trotz der
Einschätzung „derzeit kein Anwendungsfall" (`E:/Mühlwerk/wiki/analysen/2026-09-18-vier-github-werkzeuge.md`).
**Nur installieren und dokumentieren, nirgends anschließen.** Die App ruft heute kein Modell auf,
Claude Code läuft über das Abo. Nichts im Repo, in der App oder in Claude Code zeigt auf OmniRoute.

## Installationsweg, Version, Befund

| | |
|---|---|
| Installiert | `omniroute@3.8.50` aus der npm-Registry, global (`npm install -g`), 1.164 Pakete — seit 18.09.2026 nachmittags **mit** Installationsskripten und nativen Modulen (Befund unten) |
| Gelesener Quellstand | Klon `--depth 1` vom 18.09.2026, Commit `7cc454d9` (package.json 3.8.51 — die Registry hing einen Patch hinterher) |
| Docker | nicht installiert → npm global, wie vom Projekt als „One command, any OS" empfohlen |
| Node/npm | v24.18.0 / 11.16.0 (Projekt verlangt Node ≥ 22.22.2 oder ≥ 24) |
| Erster Befehl (Nr. 40, 18.09. mittags) | `$env:OMNIROUTE_SKIP_POSTINSTALL='1'; npm install -g omniroute --ignore-scripts --omit=optional` — kein Skript lief |
| Zweiter Befehl (18.09., 14:57–15:00) | `npm uninstall -g omniroute`, dann `npm install -g omniroute@3.8.50 --foreground-scripts --loglevel verbose` — Skripte liefen, Rückgabewert 0, 3 Minuten. (Deinstallation vorweg, weil npm Installationsskripte nur für neu abgelegte Pakete ausführt; `--foreground-scripts` zeigt die Skriptausgabe nur an, ändert nichts am Ablauf) |

### Wo die Installation wirklich liegt (Befund 18.09.)

Beide Installationen liefen aus Sitzungen der Claude-Desktop-App heraus. Die App ist ein MSIX-Paket mit
Dateisystem-Virtualisierung: Schreibzugriffe ihrer Prozesse auf `%APPDATA%` landen im Overlay
`C:\Users\Wilhe\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\`, und nur diese Prozesse sehen
sie unter `C:\Users\Wilhe\AppData\Roaming\…` eingeblendet (`realpath` aus Node zeigt den Overlay-Pfad).
Nachgemessen mit einem Prozess **außerhalb** des App-Kontexts (WMI `Win32_Process.Create`, einmalig, nichts
Bleibendes): **`C:\Users\Wilhe\AppData\Roaming\npm` existiert dort nicht, `where omniroute` findet nichts.**
Physisch liegt alles in `…\LocalCache\Roaming\npm\` (`node_modules\omniroute`, Startdateien `omniroute.cmd`/`.ps1`).

Folge: Der Befehl `omniroute` ist **nur aus Prozessen der Claude-App** (Werkzeug-Chats) aufrufbar, nicht aus
Wilhelms eigener PowerShell. Der Datenordner `C:\Users\Wilhe\.omniroute\` liegt dagegen im echten Profil (nicht
virtualisiert). Soll OmniRoute für Wilhelm direkt erreichbar sein, müsste er `npm install -g omniroute@3.8.50`
selbst in seiner PowerShell ausführen — Entscheid und Hand von Wilhelm, nicht getan.

### Warum zuerst ohne Skripte (Nr. 40) und was die Skripte bei der Nachinstallation taten

Die Installationsskripte tun Dinge, die Nr. 40 als Haltepunkt nannte: `scripts/build/postinstall.mjs` lädt im
Fehlfall einen Binärbaustein über `node-pre-gyp` nach und ruft `npm rebuild`; das Warm-up `scripts/postinstall.mjs`
darf nach `~/.omniroute/runtime/` schreiben; optionale Module (`keytar`, `better-sqlite3`, `onnxruntime-node`,
`wreq-js`, …) laden vorgebaute Binärdateien von GitHub. **Wilhelm hat am 18.09.2026 per Formular entschieden, die
Skripte bewusst laufen zu lassen** — wissend, dass dabei vorgebaute Binärdateien von GitHub/Drittseiten geladen
und ausgeführt werden. Ergebnis, gemessen am vollständigen Log
(`C:\Users\Wilhe\AppData\Local\Temp\claude\omniroute\install-native.log`, 2.642 Zeilen):

**10 Installationsskripte liefen, alle mit Rückgabewert 0:** `omniroute@3.8.50 postinstall`, `keytar@7.9.0 install`,
`koffi@2.16.3 install`, `@parcel/watcher@2.6.0 install`, `@swc/core@1.16.2 postinstall`, `esbuild@0.28.2 postinstall`,
`onnxruntime-node@1.24.3` und `@1.30.0 postinstall`, `protobufjs@7.6.6 postinstall`, `tls-client-node@0.2.0 postinstall`.

**Von außerhalb der npm-Registry geladen — genau zwei Dateien:**

1. `keytar` über `prebuild-install`: `https://github.com/atom/node-keytar/releases/download/v7.9.0/keytar-v7.9.0-napi-v3-win32-x64.tar.gz`
   (HTTP 200, 221.340 Bytes) → npm-Cache `…\npm-cache\_prebuilds\`, entpackt nach
   `node_modules\keytar\build\Release\keytar.node` (707.584 Bytes). Ladeprobe: Modul lädt.
2. `tls-client-node`: das OmniRoute-Postinstall meldete „native binary missing … attempting repair … fetched
   successfully" und legte `node_modules\tls-client-node\bin\tls-client-windows-64-1.16.0.dll` an (27.843.480 Bytes).
   Die URL steht nicht im Log; das Skript fragt `https://api.github.com/repos/bogdanfinn/tls-client/releases` ab
   (GitHub-Releases des Go-Projekts tls-client).

Alle anderen Skripte luden nichts (ihre Binärdateien kamen in den Registry-Tarballs mit). `node-pre-gyp` und
`npm rebuild` kamen nicht zum Zug.

**Was das OmniRoute-Postinstall sonst schrieb (alles im Paketordner):** `playwright-core/lib/coreBundle.js` gepatcht
(„Android patch"); `@swc/helpers`, `sql.js`, `node-machine-id` und 4 LLMLingua-Pakete nach `dist/node_modules` kopiert;
**eine `.env` im Paketordner** aus `.env.example` erzeugt (47 Schlüssel, `JWT_SECRET` und `API_KEY_SECRET` selbst
erzeugt — siehe Konfiguration). Das Warm-up lief still und legte **keinen** `~/.omniroute/runtime/`-Ordner an (auch
nach dem Probelauf nicht vorhanden).

**SQLite:** `better-sqlite3` 13.0.3 ist im OmniRoute-Tarball mit flachen `prebuilds/<os>-<arch>.node` für
8 Plattformen gebündelt, hat kein eigenes Installationsskript und lud nichts nach. Ladeprobe im Paketordner:
`require('better-sqlite3')` öffnet eine Datenbank, SQLite 3.53.4. Nachtrag zu Nr. 40: diese Prebuilds lagen schon
bei der Installation ohne Skripte im Paket; die dortige Aussage „fällt auf `node:sqlite` zurück" war aus der README
gefolgert, nicht am Treiber gemessen. Gemessen ist der Treiber erst jetzt (Probelauf 2).

npm-Hinweis am Ende: „10 packages have install scripts not yet covered by allowScripts" — reine Anzeige von
npm 11.16, nichts wurde freigeschaltet oder gesperrt.

## Port

Standardport **20128** (Verwaltungsoberfläche und API auf demselben Port). Vor dem Probelauf frei
(`netstat -ano | findstr :20128` leer). Anderer Port: `--port <zahl>` oder Umgebungsvariable `PORT`.

**Achtung, eigener Warnhinweis des Programms beim Start:** es lauscht auf `0.0.0.0` **ohne
Schlüsselpflicht** für `/v1/*` — jedes Gerät im Netz, das den Rechner erreicht, könnte Anfragen auf
hinterlegte Anbieter absetzen. Deshalb unten immer mit `OMNIROUTE_SERVER_HOST=127.0.0.1` starten
(laut Hinweis des Programms; in Probelauf 2 gesetzt, die Bindeadresse selbst wurde nicht nachgemessen).

## Start und Stopp (PowerShell oder cmd, wörtlich)

**Gilt nur in Prozessen der Claude-App** (Werkzeug-Chats) — siehe „Wo die Installation wirklich liegt";
aus Wilhelms eigener PowerShell gibt es den Befehl `omniroute` nicht.

```powershell
$env:OMNIROUTE_SERVER_HOST = '127.0.0.1'
omniroute serve --port 20128 --daemon      # Hintergrund, PID-Datei unter ~/.omniroute
omniroute status                           # Offline-Status: Version, DB, Konfiguration
omniroute stop                             # beendet Server und Aufseher-Prozess
```

Ohne `--daemon` läuft der Server im Vordergrund (Strg+C beendet). Aus der **Git-Bash** verbiegt die
`omniroute`-Startdatei den Pfad (`C:\Program Files\Git\Users\…` → MODULE_NOT_FOUND); dort direkt:

```bash
node "$APPDATA/npm/node_modules/omniroute/bin/omniroute.mjs" serve --port 20128 --daemon
node "$APPDATA/npm/node_modules/omniroute/bin/omniroute.mjs" stop
```

Nie aufrufen: `omniroute autostart` (legt einen Autostart an), `omniroute setup-claude` und die
übrigen `setup-*`/`configure`/`run` (schreiben in die Konfiguration von Claude Code und anderen
Werkzeugen — das wäre „anschließen"), `omniroute login`/`oauth` (Konto).

## Konfiguration und Datenpfad

- Datenordner `C:\Users\Wilhe\.omniroute\` (Vorgabe; `DATA_DIR` überschreibt) — im echten Profil, nicht
  virtualisiert. Inhalt: `.env`, `storage.sqlite` (+ `-wal`/`-shm`), `logs\application\app.log`, `db_backups\`,
  `server\.pid`. Kein `runtime\`.
- **Zwei `.env`-Dateien, beide werden beim Start geladen** (Startlog „Loaded env from …"):
  1. `C:\Users\Wilhe\.omniroute\.env` — vom Programm beim ersten Start (Nr. 40) erzeugter `STORAGE_ENCRYPTION_KEY`
     (lokaler Datenbank-Schlüssel, kein Anbieter-Schlüssel, nichts von Hand eingetragen; unverändert seit 14:19).
  2. `<Paketordner>\.env` — vom Installationsskript am 18.09. um 15:00 aus `.env.example` erzeugt: 47 Schlüssel,
     darunter selbst erzeugte `JWT_SECRET` und `API_KEY_SECRET` (lokale Signaturgeheimnisse), `PORT=20128`,
     `REQUIRE_API_KEY=false`, `INITIAL_PASSWORD` mit Vorgabe. Das Programm warnt beim Start, dass der
     `STORAGE_ENCRYPTION_KEY` dieser Datei ignoriert wird, weil die Datei im Datenordner ihn zuerst gesetzt hat —
     Vorrang hat der Datenordner. Werte werden hier nicht zitiert.
- Jeder CLI-Aufruf fragt über `update-notifier` die npm-Registry nach neuen Versionen und merkt sich
  das in `C:\Users\Wilhe\.config\configstore\update-notifier-omniroute.json`.
- Nichts davon liegt im Repo, in der App oder im Live-Speicher der App.

## Welche Anbieter gebündelt werden (Projektdoku, Stand 17./18.09.2026)

Laut README (18.09.2026) und `docs/reference/PROVIDER_REFERENCE.md` (generiert 17.09.2026):
**357 registrierte Anbieter**, davon 152 mit Gratis-Kontingent; das Chat-Modellregister deckt
229 Anbieter mit 1.283 Modellkennungen; der Gratis-Katalog führt 491 Modellzeilen, 35 wiederkehrende
Kontingent-Pools und 54 schlüssellose „free forever"-Anbieter (das Projekt nennt selbst, dass das
verschiedene Nenner sind). Beispiele: OpenAI, Anthropic, Google (Gemini), Mistral, DeepSeek, Groq,
Kimi/Moonshot, Cerebras, Together, OpenRouter, Ollama (lokal), xAI Grok, dazu Cloud-Agenten
(Codex Cloud, Cursor, Devin, Jules) und ein schlüsselloser „OpenCode Free", der ab Werk in der
`auto`-Kombination steckt — ein Chat-Aufruf ohne jede Einstellung ginge also sofort auf ein fremdes
Gratis-Kontingent. Genau deshalb hat der Probelauf **keinen** Chat-Aufruf abgesetzt.

## Nutzungsbedingungen — klarer Hinweis

**Das Bündeln fremder Gratis-Kontingente verstößt bei manchen Anbietern gegen deren
Nutzungsbedingungen.** Das Projekt führt das selbst: `docs/reference/FREE_TIERS.md` hat eine
„ToS attention table" (Stand 17.06.2026, Teilprüfung 02.09.2026); das README zählt 13 Anbieter als
„avoid". Beispiele aus der Tabelle: Google Antigravity (verbietet Zugriff über Drittwerkzeuge/Proxys
per OAuth ausdrücklich), AI21 (kein Weitergeben des API-Zugangs), Blackbox, Coze (nur persönlich,
kein Weiterreichen). **Die Markierung ist nur ein Hinweis, kein Routing-Filter:** markierte Anbieter
bleiben laut Doku in Routing und Fallback enthalten. Wer OmniRoute anschließt, entscheidet je Anbieter
selbst — und haftet selbst.

**Hier ist kein Konto angelegt und kein Schlüssel hinterlegt.** Keine Anmeldung, kein OAuth, kein
Anbieter-Schlüssel, nirgends.

## Probelauf 18.09.2026 (ohne Schlüssel, ohne Login)

Start `serve --port 20128 --daemon`: Antwort nach ~8 s. Aufrufe mit curl, ohne Schlüssel:

| Aufruf | Antwort |
|---|---|
| `GET /api/health/ping` | **200** `{"status":"ok","timestamp":"2026-09-18T12:19:46.922Z","latencyMs":0}` |
| `GET /api/v1/models` | **200** `{"object":"list","data":[{"id":"auto/best-coding","object":"model",…,"owned_by":"combo",…` |
| `GET /v1/models` | **401** `{"error":{"message":"Authentication required","type":"invalid_api_key",…` |
| `GET /` | **307** → `/dashboard` (nicht besucht; die Oberfläche verlangt ein Passwort — nicht angemeldet) |

Danach `omniroute stop` → „Server stopped." Geprüft: Port 20128 lauscht nicht mehr (nur
TIME_WAIT-Reste), kein Prozess mit `omniroute` in der Befehlszeile, **kein** Eintrag in
`HKCU\…\CurrentVersion\Run`/`RunOnce`, im Autostart-Ordner oder in `schtasks /Query`; im Repo keine
Änderung. Die Verwaltungsoberfläche braucht ein Konto (Passwort, Vorgabe `INITIAL_PASSWORD=CHANGEME`)
— festgehalten, nicht benutzt.

## Probelauf 2, 18.09.2026 nach der Nachinstallation (ohne Schlüssel, ohne Login)

Start mit `OMNIROUTE_SERVER_HOST=127.0.0.1` über `node …/bin/omniroute.mjs serve --port 20128 --daemon`
(PID gemeldet; erste Ping-Antwort nach ~21 s; ein zweiter, kurzer Start im Vordergrund meldete
„OmniRoute is running! (started in 7.0s)"). Aufrufe mit curl, ohne Schlüssel:

| Aufruf | Antwort |
|---|---|
| `GET /api/health/ping` | **200** `{"status":"ok","timestamp":"2026-09-18T13:05:47.114Z","latencyMs":1}` |
| `GET /api/v1/models` | **401** `{"error":{"message":"Authentication required","type":"invalid_api_key",…` — **in Nr. 40 war das 200.** Unterschiede zu Nr. 40: die neue `.env` im Paketordner (erzeugte `JWT_SECRET`/`API_KEY_SECRET`) und `OMNIROUTE_SERVER_HOST=127.0.0.1`; welcher Punkt das 401 auslöst, ist nicht nachgemessen |
| `GET /v1/models` | **401** (wie Nr. 40) |
| `GET /api/health` | **200**, kein Treiberfeld in der Antwort |

**Treiber:** die Startausgabe der CLI enthält keine `[DB] Driver:`-Zeile (die schreibt nur der Serverprozess).
Belege für das native SQLite: (1) `better-sqlite3\prebuilds\win32-x64.node` vorhanden und im Paketordner ladbar
(SQLite 3.53.4); (2) `~/.omniroute/logs/application/app.log` führt einen `SqliteError` mit Stack durch
`better-sqlite3\lib\methods\wrappers.js` — die Fehlerklasse von better-sqlite3, nicht von `node:sqlite`. Der eine
Eintrag: `[Cleanup] Error cleaning compression_run_telemetry: no such table` (Aufräumlauf auf einer Tabelle, die
in dieser Datenbank nicht existiert; keine Folgen sichtbar). Kein Warm-up-Ordner `~/.omniroute/runtime/`.

**Stopp und Reste:** `stop` → „Server stopped." Danach Port 20128 nur noch `WARTEND` (TIME_WAIT), kein
`node`-Prozess mit `omniroute`, `HKCU\…\Run` und `RunOnce` ohne Eintrag, Autostart-Ordner nur `Ollama.lnk`
(vorbestehend, nicht OmniRoute), `schtasks /Query` ohne `omni`-Treffer, Repo unverändert. Kein Chat-Aufruf
abgesetzt, kein Login, kein Konto, kein Schlüssel.

## Was zum Anschließen fehlen würde (nur benannt, nichts davon getan)

1. Ein Anmelden an der Oberfläche (`http://localhost:20128/dashboard`) und dort ein Anbieterkonto mit
   Schlüssel — Wilhelms Hand, und je Anbieter die Frage nach den Nutzungsbedingungen.
2. `REQUIRE_API_KEY=true` plus ein Gateway-Schlüssel für `/v1/*`, damit nicht jeder im Netz mitfährt.
3. Einen Aufrufer: die App ruft kein Modell auf; Claude Code läuft über das Abo. `omniroute
   setup-claude` würde die Claude-Code-Einstellungen umschreiben — nicht ausgeführt.
4. Etwas, das es startet: kein Dienst, keine Aufgabe, kein Autostart — bewusst nicht angelegt.

## Deinstallation

Aus einem Werkzeug-Chat der Claude-App (nur dort sind `omniroute` und `npm -g` mit dieser Installation sichtbar):

```powershell
npm uninstall -g omniroute
Remove-Item -Recurse -Force "$env:USERPROFILE\.omniroute"
Remove-Item -Force "$env:USERPROFILE\.config\configstore\update-notifier-omniroute.json"
```

Physischer Ort des Pakets (auch aus Wilhelms PowerShell löschbar):
`C:\Users\Wilhe\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\npm\` (Ordner `node_modules\omniroute`
plus die `omniroute*`-Startdateien). Das geladene keytar-Archiv liegt im npm-Cache, aus Sicht der App unter
`C:\Users\Wilhe\AppData\Local\npm-cache\_prebuilds\` (physisch vermutlich ebenfalls im LocalCache-Overlay, nicht nachgemessen).
