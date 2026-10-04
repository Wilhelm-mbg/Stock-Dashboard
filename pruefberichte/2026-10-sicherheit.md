# Sicherheits-Durchsicht 2026-10 (Stand main `61dca2c`, 04.10.2026)

**Kurzfassung – schwerste zuerst.** Kein Weg zu echten Live-Orders, keine echten Geheimnisse in der Git-Historie (1.603 Commits, 15 Zweige, 160 Tags).
1. **HOCH – Updates werden still eingespielt, und zwar ohne Signatur** (`main.js:2509,2567-2568`). Geprüft wird nur der `sha512`-Wert aus `latest.yml` im selben GitHub-Release. Wer dort schreiben darf, bringt Code auf alle Rechner. → U1 in [04](sicherheit-2026-10/04-updater-release.md)
2. **HOCH – Das GitHub-Token zum Senden steckt im öffentlichen Installer** (`package.json:30` legt `telemetrie.json` ins asar). Jeder kann damit als Eigentümer Issues anlegen, ändern oder schließen. Das Token kann nur widerrufen werden, weil es in alten Installern dauerhaft lesbar bleibt. → [01](sicherheit-2026-10/01-zugangsdaten-historie.md)
3. **HOCH – Issues sind Prompt-Injektion mit Schreibzugriff:** Wache und PM lesen öffentliche Issues und holen dabei per `git credential fill` ein Token, das pushen und Releases anlegen darf. Zusammen mit (1) reicht das für ein Update auf alle Rechner. → R1 in [04](sicherheit-2026-10/04-updater-release.md)
4. **HOCH – Skript im Renderer führt zu beliebigem Code:** `write-strategie` speichert beliebiges JS, `mess-lauf` startet es per `fork` mit `ELECTRON_RUN_AS_NODE` (`main.js:620,811`). Damit ist die Sandbox ausgehebelt. → F1 in [02](sicherheit-2026-10/02-electron-haertung.md)
5. **HOCH – Electron 37.10.3 bekommt seit Jan. 2026 keine Sicherheitsupdates mehr** (aktuell 44.x). `npm audit --omit=dev` übersieht das, weil Electron unter devDependencies steht. → [06](sicherheit-2026-10/06-abhaengigkeiten.md)
6. **MITTEL – Automatische Orders (Paper/Demo) ohne `client_order_id`:** Nach einem Timeout kann eine Order doppelt abgesetzt werden, die Übernacht-Runde verkauft dann minütlich erneut. Für den Capital-Automaten gibt es keinen eigenen Aus-Schalter. → [05](sicherheit-2026-10/05-handelspfade.md)
7. **MITTEL – CI:** `contents: write` gilt global, `--clobber` kann Installer der Wache überschreiben, und der Prüfjob ist dauerhaft rot. Diese Lücke muss geschlossen sein, bevor die CI repariert wird. Außerdem: Installer werden nicht gegen den Commit geprüft. → C1–C3, R2 in [04](sicherheit-2026-10/04-updater-release.md)
8. **MITTEL – weiter:** HTML-Injektion im Schein-Finder über onvista-Namen (`scheinfinder.js:394`); entschlüsselte Broker-Schlüssel im Renderer; `openExternal` öffnet jede `https://`-Adresse; Abrufe hängen ewig bei Antwort über der Obergrenze (`main.js:210`); Alpaca-Schlüssel fehlen in der Ausschlussliste der Sicherung (`tools/sicherung.js:43`).
9. NIEDRIG: Benutzername und Gmail-Adresse sind im Repo öffentlich (letztere auch als SEC-User-Agent in `stammdaten.js`), `.gitignore` deckt `.env`/`*.pfx` nicht ab, `Host`-Kopf geht ungeprüft durch, CSP-Lücken; Einzelheiten in den Teilberichten.

**Zuerst tun:** Token widerrufen bzw. Zuschnitt prüfen, Immutable Releases und ein Tag-Ruleset einschalten, für das Lesen von Issues ein Token nur mit Leserecht nehmen, Electron auf ≥ 42 anheben.

---

## Teilberichte

| Nr. | Schwerpunkt | Datei | Schwerste Funde |
|---|---|---|---|
| 01 | Zugangsdaten, Git-Historie | [01-zugangsdaten-historie.md](sicherheit-2026-10/01-zugangsdaten-historie.md) | Token im Installer (hoch); Alpaca-Schlüssel in der Sicherung (mittel) |
| 02 | Electron-Härtung, IPC, XSS | [02-electron-haertung.md](sicherheit-2026-10/02-electron-haertung.md) | Renderer→RCE über `mess-lauf` (hoch); Electron EOL (hoch); HTML-Injektion Schein-Finder (mittel) |
| 03 | Netz | [03-netz.md](sicherheit-2026-10/03-netz.md) | hängende Promises bei Größengrenze (mittel); kein `http://`, kein abgeschaltetes TLS |
| 04 | Updater, Release, CI | [04-updater-release.md](sicherheit-2026-10/04-updater-release.md) | unsigniertes Auto-Update (hoch); Issue-Injektion → Release-Token (hoch); CI-Rechte/`--clobber` (mittel) |
| 05 | Handels-Pfade | [05-handelspfade.md](sicherheit-2026-10/05-handelspfade.md) | kein Live-Pfad; Automatik ohne Einzelbestätigung und ohne Idempotenz (mittel) |
| 06 | Abhängigkeiten | [06-abhaengigkeiten.md](sicherheit-2026-10/06-abhaengigkeiten.md) | Electron 37 EOL, 37 Advisories (hoch); js-yaml (niedrig) |

## Was hält

- **Fenster:** `contextIsolation`, `nodeIntegration:false` und `sandbox` sind gesetzt, die CSP erlaubt nur `script-src 'self'`. Navigation ist gesperrt, `window.open` wird abgelehnt. Es gibt kein `eval`/`new Function` und keine generische IPC-Durchreichung.
- **Broker-Hosts:** Capital.com ist fest auf den Demo-Host gesetzt, Alpaca fest auf Paper. Beides wird im Hauptprozess erneut geprüft, auch nach Weiterleitungen. Einen Schalter auf Live gibt es nicht.
- **Netz:** Kein `rejectUnauthorized:false` und kein `certificate-error`-Handler. Schlüssel gehen nur in Kopfzeilen, nie in URLs.
- **Schlüssel:** Sie liegen per safeStorage verschlüsselt (bei fehlendem safeStorage aber Klartext-Rückfall). Die Diagnose nutzt eine Weißliste.
- **Lockdatei:** Alle Pakete kommen über https von registry.npmjs.org und tragen sha512-Prüfsummen. Es gibt keine eigenen Installskripte.

## Vorgehen und Grenzen

- **Ablauf:** Sechs parallele Prüfer, einer je Schwerpunkt. Nur gelesen, kein App-Code geändert, keine echten Zugänge und keine Broker-Hosts benutzt.
- **Nachweise:** Sie liefen lokal: gemocktes `https`, TLS-Server auf 127.0.0.1, node-Proben. Die Skripte gehören nicht ins Repo.
- **Netzzugriffe:** Ins Netz gingen nur `npm audit --package-lock-only`, `npm view`/`npm pack` (electron-updater-Quelle) und Lesezugriffe auf Metadaten des eigenen Repos über die GitHub-API.
- **Nicht prüfbar:** der tatsächliche Zuschnitt des Tokens hinter `TELEMETRIE_JSON`, die Rechte der Credential auf Wilhelms Rechner, Inhalte bereits gesendeter Issues, und ob die Broker-Frontends Live und Paper/Demo teilen (relevant für den `Host`-Kopf-Fund).
- **Geheimnisse:** Echte Geheimnisse stehen in keinem Bericht. Es wurden auch keine gefunden.
