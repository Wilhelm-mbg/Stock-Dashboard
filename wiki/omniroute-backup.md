# OmniRoute — installiert als Backup, nirgends angeschlossen

*Stand 18.09.2026. Lizenz: MIT (Copyright 2026 diegosouzapw). Quelle: https://github.com/diegosouzapw/OmniRoute*

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
| Installiert | `omniroute@3.8.50` aus der npm-Registry, global im Benutzerprofil (`C:\Users\Wilhe\AppData\Roaming\npm\node_modules\omniroute`), 1.164 Pakete |
| Gelesener Quellstand | Klon `--depth 1` vom 18.09.2026, Commit `7cc454d9` (package.json 3.8.51 — die Registry hing einen Patch hinterher) |
| Docker | nicht installiert → npm global, wie vom Projekt als „One command, any OS" empfohlen |
| Node/npm | v24.18.0 / 11.16.0 (Projekt verlangt Node ≥ 22.22.2 oder ≥ 24) |
| Befehl | `$env:OMNIROUTE_SKIP_POSTINSTALL='1'; npm install -g omniroute --ignore-scripts --omit=optional` |

**Warum nicht der reine Standardbefehl `npm install -g omniroute`:** Die Installationsskripte tun
zwei Dinge, die der Auftrag als Haltepunkt nennt — festgehalten, nicht ausgeführt:

1. `scripts/build/postinstall.mjs` kopiert native Bausteine (`better-sqlite3`, `wreq-js`, `sql.js`,
   `node-machine-id`) innerhalb des Paketordners um — unkritisch. Passt der SQLite-Baustein nicht
   (das Paket liefert ihn für Linux x64), versucht es aber **einen vorgebauten Binärbaustein über
   `node-pre-gyp` von einer Drittseite zu laden** und danach `npm rebuild` mit Build-Werkzeugen.
2. `scripts/postinstall.mjs` („Warm-up") **schreibt außerhalb des Paketordners** nach
   `~/.omniroute/runtime/`. Das Projekt dokumentiert selbst den Schalter `OMNIROUTE_SKIP_POSTINSTALL=1`.
3. Die optionalen Abhängigkeiten `better-sqlite3`, `keytar`, `onnxruntime-node`, `wreq-js`,
   `@huggingface/transformers`, `sqlite-vec`, `@atjsh/llmlingua-2`, `js-tiktoken` bringen eigene
   Installationsskripte mit, die vorgebaute Binärdateien von GitHub-Releases nachladen.
4. `prepare` ruft husky (nur im Quellbaum wirksam, nicht bei der Registry-Installation).

Mit `--ignore-scripts --omit=optional` läuft **kein** Installationsskript, npm lädt nur Tarballs aus
der Registry. Die Folge ist vom Projekt vorgesehen (README, Abschnitt npm): ohne `better-sqlite3`
fällt es auf `node:sqlite` (Node ≥ 22) bzw. das gebündelte `sql.js` zurück — der Probelauf unten
bestätigt, dass die Datenbank so angelegt wird. Es fehlen dadurch nur Nebenfunktionen: der
OS-Schlüsselbund (`keytar`), die TLS-Tarnung für OAuth-/Cookie-Anbieter (`wreq-js`) und die
„ultra"-Kompressionsstufe (`onnxruntime`, `llmlingua`). Für ein Backup ohne Konto ist nichts davon nötig.

## Port

Standardport **20128** (Verwaltungsoberfläche und API auf demselben Port). Vor dem Probelauf frei
(`netstat -ano | findstr :20128` leer). Anderer Port: `--port <zahl>` oder Umgebungsvariable `PORT`.

**Achtung, eigener Warnhinweis des Programms beim Start:** es lauscht auf `0.0.0.0` **ohne
Schlüsselpflicht** für `/v1/*` — jedes Gerät im Netz, das den Rechner erreicht, könnte Anfragen auf
hinterlegte Anbieter absetzen. Deshalb unten immer mit `OMNIROUTE_SERVER_HOST=127.0.0.1` starten
(laut Hinweis des Programms; die Variable wurde im Probelauf nicht gesetzt und nicht nachgemessen).

## Start und Stopp (PowerShell oder cmd, wörtlich)

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

- Datenordner `C:\Users\Wilhe\.omniroute\` (Vorgabe; `DATA_DIR` überschreibt). Nach dem Probelauf
  6 MB: `storage.sqlite` (+ `-wal`/`-shm`), `logs\application\`, `db_backups\`, `server\`.
- Konfigurationsdatei `C:\Users\Wilhe\.omniroute\.env`. Beim ersten Start hat das Programm dort
  selbst einen `STORAGE_ENCRYPTION_KEY` erzeugt (lokaler Datenbank-Schlüssel, kein Anbieter-Schlüssel;
  nichts wurde von Hand eingetragen). Vorlage aller Variablen: `.env.example` im Paket
  (`JWT_SECRET`, `API_KEY_SECRET`, `INITIAL_PASSWORD` — Vorgabe `CHANGEME` — `REQUIRE_API_KEY`, `DATA_DIR`).
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

## Was zum Anschließen fehlen würde (nur benannt, nichts davon getan)

1. Ein Anmelden an der Oberfläche (`http://localhost:20128/dashboard`) und dort ein Anbieterkonto mit
   Schlüssel — Wilhelms Hand, und je Anbieter die Frage nach den Nutzungsbedingungen.
2. `REQUIRE_API_KEY=true` plus ein Gateway-Schlüssel für `/v1/*`, damit nicht jeder im Netz mitfährt.
3. Einen Aufrufer: die App ruft kein Modell auf; Claude Code läuft über das Abo. `omniroute
   setup-claude` würde die Claude-Code-Einstellungen umschreiben — nicht ausgeführt.
4. Etwas, das es startet: kein Dienst, keine Aufgabe, kein Autostart — bewusst nicht angelegt.

## Deinstallation

```powershell
npm uninstall -g omniroute
Remove-Item -Recurse -Force "$env:USERPROFILE\.omniroute"
Remove-Item -Force "$env:USERPROFILE\.config\configstore\update-notifier-omniroute.json"
```
