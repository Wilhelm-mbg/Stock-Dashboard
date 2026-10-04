# Schwerpunkt 6: Abhängigkeiten

Stand: 04.10.2026, Zweig `pruefung/sicherheit-2026-10`, package.json 8.45.0.
Umgebung der Prüfung: Node v22.22.0, npm 10.9.4. Kein `node_modules` vorhanden; alle
Prüfungen liefen gegen die Lockdatei (`--package-lock-only`). Nichts geändert, kein
`npm audit fix`.

## Kurzfassung

1. **HOCH – Electron 37.10.3 ist seit Januar 2026 ohne Support.** Die Laufzeit der App (Chromium 138, Node, V8) bekommt seit dem 26.11.2025 keine Sicherheitsfixes mehr; unterstützt sind 42/43/44 (aktuell 44.5.1). 37 Advisories offen, davon eines direkt erreichbar (Autostart, GHSA-jfqx-fxh3-c62j). Die gute Härtung des Fensters senkt die Ausnutzbarkeit, ersetzt aber keine Patches.
2. **MITTEL – Electron steht in `devDependencies`, wird aber ausgeliefert.** `npm audit --omit=dev` meldet deshalb nur js-yaml und verschweigt die schwerste Lücke; jede Prüfung „nur Laufzeit" ist so blind.
3. **NIEDRIG – js-yaml@4.3.0 (Laufzeit, via electron-updater):** zwei CPU-DoS-Advisories (GHSA-5p4m-2wfm-xmqj, GHSA-2883-xcg3-v3hh). Erreichbar nur über `latest.yml` aus dem eigenen GitHub-Release – wer das kontrolliert, kann ohnehin einen fremden Installer ausliefern.
4. **NIEDRIG – sechs Entwicklungs-Advisories** (extract-zip, @xmldom/xmldom, fast-uri, undici, http-cache-semantics, brace-expansion), alle nur auf der Baumaschine, nicht im Installer; Eingaben stammen aus eigener Konfiguration bzw. prüfsummengesicherten Downloads.
5. **NIEDRIG – CI baut mit Node 20 (EOL seit 30.04.2026)**, Actions per Tag statt SHA, kein Dependabot.
6. **Unauffällig:** lockfileVersion 3, alle 400 Einträge `https://registry.npmjs.org/` mit sha512-`integrity`, keine git+/http-Quellen, keine pre/postinstall-Skripte im Projekt, Installskripte nur bei `electron` und `electron-winstaller` (beide dev), keine typosquat-verdächtigen Namen. electron-builder 26.15.3 und electron-updater 6.8.9 sind die aktuellen Versionen.

## Bestand

| | |
|---|---|
| `package.json` dependencies | `electron-updater ^6.8.9` (einzige Laufzeitabhängigkeit) |
| devDependencies | `electron ^37.2.0` (Lock 37.10.3), `electron-builder ^26.15.3`, `eslint ^9.39.0` (Lock 9.39.5), `globals ^15.15.0` |
| Skripte | `start`, `test`, `lint` – kein `preinstall`/`install`/`postinstall`/`prepare` |
| Lockdatei | `lockfileVersion: 3`, 400 Pakete, 16 Laufzeit (+ electron-updater selbst), 384 dev |
| Laufzeit-Baum | argparse, builder-util-runtime 9.7.0, debug, electron-updater 6.8.9, fs-extra 10.1.0, jsonfile, semver 7.7.4, universalify, graceful-fs, js-yaml 4.3.0, lazy-val, lodash.escaperegexp, lodash.isequal, ms, sax 1.6.1, tiny-typed-emitter |
| Quellen | 400/400 `resolved` auf `https://registry.npmjs.org/`, 400/400 mit `sha512-`-Integrity |
| `hasInstallScript` | `electron@37.10.3` (package-lock.json:2063), `electron-winstaller@5.4.0` (:2278) – beide dev |
| `.npmrc` | keine |
| CI | `npm ci` (gut: Lock wird nicht fortgeschrieben), Node 20, `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` |

Nachweis:

```bash
node -e 'const p=require("./package-lock.json").packages;for(const[k,v]of Object.entries(p)){if(!k)continue;
 if(!/^https:\/\/registry\.npmjs\.org\//.test(v.resolved||""))console.log("Quelle",k);
 if(!/^sha512-/.test(v.integrity||""))console.log("Integrity",k);
 if(v.hasInstallScript)console.log("Installskript",k,v.version)}'
```

`npm audit --package-lock-only --json`: 8 Pakete „high", 0 critical. `--omit=dev`: nur js-yaml.

---

## F6-1 Electron 37.10.3 – außerhalb des Supports (HOCH)

- **Paket:** `electron@37.10.3`, package-lock.json:2063; package.json `"electron": "^37.2.0"` unter `devDependencies`.
- **Status:** 37.10.3 ist der letzte 37er (veröffentlicht 2025-11-26). Electron unterstützt die letzten drei Hauptlinien; mit 40.0.0 (2026-01-16) fiel 37 heraus. Heute: 42.11.10 / 43.7.7 / 44.5.1 (`latest`). Die App liegt **sieben Hauptversionen** und rund zehn Monate Chromium-/V8-Sicherheitsfixes zurück.
- **Advisories (npm audit, 37 Stück, Fix erst ab 41.10.6 bzw. 44.5.1).** Gegen den Code gehalten:

| Advisory | Thema | Erreichbar? |
|---|---|---|
| GHSA-jfqx-fxh3-c62j | Unquoted executable path in `app.setLoginItemSettings` (Windows) | **Ja** – `main.js:295` setzt Autostart mit `path: process.execPath` (`main.js:282`). Ausnutzbar nur, wenn ein Angreifer in einen Elternordner des Pfads mit Leerzeichen schreiben darf (z. B. `C:\Users\Max.exe` bei Nutzer „Max Mustermann"); normaler Nutzer darf das nicht → praktisch gering. |
| GHSA-h7rp-cf8h-j98x, GHSA-ff2p-hmqr-hxm4 | Context-Isolation-Umgehung / contextBridge-Setter | Nur mit fremdem JS im Renderer. Die App benutzt `contextBridge` (`preload.js:18`), CSP `script-src 'self'` (index.html:5) sperrt eingeschleuste Skripte. Bedeutung: fällt die CSP (XSS über 249 `innerHTML`-Stellen + CSP-Lücke), wäre die Brücke zum Hauptprozess nicht mehr sicher. |
| GHSA-hq2x-r82h-9wj4, GHSA-gr2m-v5gq-v685, GHSA-9f4c-93c8-jc8g, GHSA-f3pv-wv63-48x8, GHSA-v93f-fgjr-hjrj | Popup/Sandbox-Vererbung, window.open | Nein – `setWindowOpenHandler` gibt immer `deny` (`main.js:2458-2461`). |
| GHSA-9qh4-3jw8-366w | `<webview>` + Worker-Node | Nein – kein `webviewTag`, kein `<webview>`. |
| GHSA-v3j7-r9gq-3gjw, GHSA-j84w-jfhq-vhvj, GHSA-4p4r-m79c-wq3v, GHSA-v64r-4m7r-3mvq | Protokoll-Handler, webRequest | Nein – kein `protocol.*`, kein `webRequest`, Netz läuft über Node-`https` im Hauptprozess (`main.js:10`). |
| GHSA-5c9j-mhmv-5xgx | `shell.openPath` Nullbyte | Nein – nur `openExternal` mit `https://`-Prüfung. |
| GHSA-3c8v-cfp5-9885 | second-instance OOB-Read | Nur macOS/Linux; die App wird nur für Windows gebaut (`main.js:2555` nutzt das Ereignis). |
| GHSA-mwmh-mq4g-g6gr, GHSA-5rqw-r77c-jp79, GHSA-vv43-5jgx-7qv8 | Protokoll-Registrierung, macOS | Nein. |
| GHSA-8337-3p73-46f4, GHSA-jjp3-mq3x-295m, GHSA-532v-xpq5-8h95 u. a. | Use-after-free in nicht genutzten APIs | Nicht erkennbar genutzt. |

- **Auslöser / Schaden für den Anleger:** Der schwerere Teil steht nicht in npm audit: die nicht eingespielten **Chromium- und V8-Fixes** seit Chromium 138. Jede Speicherlücke im Renderer, die über angezeigte Fremddaten (Nachrichtentexte, Kursnamen) angestoßen werden kann, bleibt offen. Der Renderer ist sandboxed, mit Context Isolation, ohne Node, CSP ohne Fremdskripte, ohne externe Bilder, Navigation auf die eigene Startseite gesperrt (`main.js:2440-2475`) – das ist gute Härtung und der Grund, warum heute **kein direkter Ausnutzungspfad** belegt ist. Gelingt einer, liegen im Hauptprozess die Capital.com-Demo-Zugangsdaten (safeStorage), Depotdaten und der Autostart-Eintrag.
- **Schwere:** **hoch** (strukturell: ausgelieferte Laufzeit ohne Sicherheitsupdates); konkrete Ausnutzbarkeit derzeit gering.
- **Nachweis:**
  ```bash
  node -p 'require("./package-lock.json").packages["node_modules/electron"].version'   # 37.10.3
  npm view electron dist-tags.latest dist-tags.42-x-y        # 44.5.1, 42.11.10
  npm view electron time --json | grep -E '"(37\.10\.3|40\.0\.0)"'
  npm audit --package-lock-only | grep -A3 '^electron'
  ```
- **Behebung:** Auf eine unterstützte Linie heben (mindestens 42.x, besser 44.x), danach `npm test` und die UI-Sonden (`tools/*-probe.js`). Brüche zwischen 37 und 44 vorher in den Electron-Breaking-Changes nachsehen. Danach Routine: bei jeder Hauptversion von Electron nachziehen (siehe F6-6).

## F6-2 Electron als devDependency – Laufzeitprüfung wird blind (MITTEL)

- **Ort:** package.json, `devDependencies.electron`.
- **Befund:** Das ist bei electron-builder üblich (es verlangt es so) und technisch richtig – aber `npm audit --omit=dev` meldet dadurch **nur js-yaml** und verschweigt F6-1. Auch `tools/release.js:291` (`npm ls --omit=dev`) beschreibt nur die JS-Pakete im asar, nicht die mitgelieferte Electron-Laufzeit.
- **Schaden:** indirekt – wer nur auf „Laufzeit-Audit grün" schaut, liefert eine EOL-Laufzeit aus.
- **Schwere:** mittel (Prozessfehler, verdeckt F6-1).
- **Nachweis:** `npm audit --package-lock-only --omit=dev` → 1 Fund (js-yaml), Electron fehlt.
- **Behebung:** Kein Umzug in `dependencies` (electron-builder lehnt das ab). Stattdessen eine eigene Prüfung: Electron-Hauptversion gegen `npm view electron dist-tags.latest` vergleichen und bei Abstand > 2 rot werden (z. B. in `tools/release.js --pruefen` oder in der CI).

## F6-3 js-yaml@4.3.0 im Installer (NIEDRIG)

- **Paket:** `js-yaml@4.3.0`, package-lock.json:3389; gezogen von `electron-updater@6.8.9` (`"js-yaml": "^4.1.0"`, :2215ff.), ebenso von electron-builder (dev).
- **Advisories:** GHSA-5p4m-2wfm-xmqj (quadratische CPU bei `!!omap`, behoben 4.3.1), GHSA-2883-xcg3-v3hh (`maxTotalMergeKeys` begrenzt CPU nicht, behoben 4.3.2).
- **Auslöser:** electron-updater parst damit `latest.yml` aus dem GitHub-Release `Wilhelm-mbg/Stock-Dashboard` über HTTPS.
- **Schaden:** Hänger/hohe CPU beim Update-Check. Voraussetzung ist ein manipuliertes `latest.yml` – wer das schreiben kann, kann auch Installer und Prüfsumme austauschen (siehe Schwerpunkt 4). Die Lücke fügt diesem Angreifer nichts hinzu.
- **Schwere:** niedrig.
- **Nachweis:** `npm audit --package-lock-only --omit=dev`; `npm ls --package-lock-only js-yaml`.
- **Behebung:** `npm update js-yaml` (4.3.2 liegt im Bereich `^4.1.0`, nur Lockdatei ändert sich), danach `npm ci && npm test`.

## F6-4 Entwicklungsabhängigkeiten mit Advisories (NIEDRIG, nicht im Installer)

Alle laufen nur auf der Baumaschine (lokal bzw. GitHub Actions `windows-latest`). Dort liegen allerdings `CSC_LINK`, `GH_TOKEN` und `TELEMETRIE_JSON` an – Bauwerkzeuge sind deshalb nicht bedeutungslos.

| Paket@Version (Lock-Zeile) | Pfad | Advisories | Erreichbarkeit | Schwere |
|---|---|---|---|---|
| `extract-zip@2.0.1` (:2647) | electron → extract-zip | GHSA-jmr9-qjv8-65gv, GHSA-7pqw-9j4j-h8q3 (Symlink-Pfadtraversal, 8.1) | Entpackt beim `npm ci` das Electron-ZIP; `@electron/get` prüft es vorher gegen die SHASUMS256 aus dem Paket (sumchecker). Nur ein manipuliertes ZIP mit passender Prüfsumme wäre gefährlich. Fix nur mit neuerem Electron. | niedrig |
| `@xmldom/xmldom@0.8.13` (:1043) | electron-builder → app-builder-lib → plist | 10 Advisories (Injection/ReDoS) | plist nur für macOS-Builds; die App baut nur Windows NSIS. | niedrig |
| `fast-uri@3.1.4` (:2689) | app-builder-lib → ajv | 7 Advisories (Host-Verwechslung, SSRF) | ajv validiert die eigene `build`-Konfiguration, keine fremden URIs. | niedrig |
| `undici@6.28.0` (:4785) | @electron/rebuild → node-gyp | GHSA-3wwx-pv8p-q78v, GHSA-r53p-7pc4-xj5r, GHSA-rfgv-xxqx-mfg5 | node-gyp lädt Header nur bei nativen Modulen; die App hat keine. | niedrig |
| `http-cache-semantics@4.2.0` (:3193) | electron → @electron/get → got → cacheable-request | GHSA-ch52-4w7c-c8xp | Ein Download, kein geteilter Cache. | niedrig |
| `brace-expansion` (mehrere Kopien) | minimatch in eslint, asar, glob, filelist | GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895, GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p (DoS) | Muster stammen aus eigener Konfiguration. | niedrig |

- **Nachweis:** `npm audit --package-lock-only --json`; Pfade mit `npm ls --package-lock-only <paket>`.
- **Behebung:** Außer extract-zip lassen sich alle innerhalb der semver-Bereiche anheben (`npm update` bzw. gezielt), extract-zip erledigt sich mit F6-1. Ohne Eile, aber im selben Zug wie F6-1.

## F6-5 Installskripte und Lieferkette (NIEDRIG / unauffällig)

- `hasInstallScript` nur bei `electron@37.10.3` (lädt das Electron-Binary von GitHub, prüft gegen SHASUMS) und `electron-winstaller@5.4.0` (Squirrel-Ziel, hier ungenutzt, kommt über `electron-builder-squirrel-windows` mit). Beide sind die bekannten offiziellen Pakete.
- Alle 400 Paketnamen durchgesehen: nur bekannte Pakete des electron-/eslint-/got-Ökosystems, keine Tippfehler-Namen (Liste: `node -e 'console.log(Object.keys(require("./package-lock.json").packages).join("\n"))'`).
- Keine `git+`, `http:`, `file:`- oder Tarball-Quellen; alle mit sha512-Integrity – `npm ci` bricht bei Abweichung ab.
- `npm audit signatures` war ohne `node_modules` nicht ausführbar; Vorschlag: einmal nach `npm ci` laufen lassen.
- **Schwere:** niedrig, kein Fund.
- **Empfehlung (optional):** In der CI `npm ci --ignore-scripts` plus explizites `node node_modules/electron/install.js` ist möglich, bringt bei nur zwei bekannten Installskripten aber wenig.

## F6-6 Pflege: Node 20 in der CI, Actions per Tag, kein Dependabot (NIEDRIG)

- `.github/workflows/build.yml:47`: `node-version: '20'` – Node 20 ist seit 30.04.2026 EOL. Baut den Installer (`npx electron-builder`) mit einer Node-Laufzeit ohne Fixes; lokal läuft 22.
- `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4` per verschiebbarem Tag statt Commit-SHA; der Job hat Zugriff auf `CSC_LINK`, `CSC_KEY_PASSWORD`, `TELEMETRIE_JSON` und `GH_TOKEN`.
- Kein `.github/dependabot.yml` – genau deshalb ist Electron unbemerkt aus dem Support gelaufen.
- **Schwere:** niedrig.
- **Nachweis:** `grep -o "node-version: '[0-9]*'" .github/workflows/build.yml`; `ls .github/dependabot.yml`.
- **Behebung:** Node 22 (oder 24) in der CI; Actions auf SHA pinnen; Dependabot für `npm` und `github-actions` einrichten (wöchentlich, Electron-Hauptversionen als eigene PRs).

## Randnotiz (anderer Schwerpunkt)

`package.json` → `build.files` enthält `telemetrie.json`, und die CI legt es aus dem Geheimnis `TELEMETRIE_JSON` vor dem Bau ein: der Sendeschlüssel liegt damit im ausgelieferten asar jedes Installers. Gehört zu Schwerpunkt 1/3 und wird hier nicht bewertet.
