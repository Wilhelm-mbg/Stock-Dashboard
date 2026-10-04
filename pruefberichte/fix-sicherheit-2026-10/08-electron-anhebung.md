# Fund 8: Electron 37 → 42 anheben (Probe in einer Kopie, 04.10.2026)

Grundlage: Repo-Stand `61dca2c` (HEAD), per `git archive` nach `scratchpad/electron-kopie` kopiert.
Im Repo selbst wurde nichts geändert.

## Kurzfassung

- **Zielversion: Electron 42 (42.11.10)**, die älteste der drei gepflegten Hauptversionen 42/43/44.
  Sie bringt Chromium 148.0.7778.280 und Node 24.19.0. Electron 37.10.3 hat Chromium 138 und Node 22.
- **Die Tests bleiben in der Kopie gleich.** eslint: 0 Fehler und 1 Warnung, auf beiden Versionen gleich.
  test-channel: 76 bestanden, 0 fehlgeschlagen. test-v6: 5425 bestanden, 7 fehlgeschlagen, auf 37 und 42
  mit denselben 7 Zeilen. Diese 7 Fehler gibt es schon auf 37. Sie hängen an der Umgebung der Kopie (Datenordner
  und Universum fehlen) und haben mit Electron nichts zu tun.
  Zusätzlich lief die Suite unter dem in Electron 42 eingebauten Node 24 (`ELECTRON_RUN_AS_NODE=1`), mit
  demselben Ergebnis. Mit `DIST` gegen ein gebautes Windows-Paket waren es 5430 bestanden und dieselben 7 fehlgeschlagen.
- **Der Start kommt hoch.** Unter xvfb mit `--no-sandbox`, leerem HOME und totem Proxy, also ohne Netz und
  ohne Broker-Schlüssel, lädt die Seite auf 37 und auf 42 gleich. Abgefragt über CDP: Titel „Markt-Dashboard",
  59 `window.api`-Funktionen, 2666 DOM-Elemente, `appVersion()` = 8.45.0, Starthema gesetzt, keine Fehler
  oder Deprecation-Meldungen im Log.
- **Der Paketbau läuft.** `electron-builder --win dir --x64` hat unter Linux mit electron 42.11.10 ohne Fehler gebaut.
  Den NSIS-Installer und den Update-Weg konnte ich unter Linux nicht prüfen.
- **Fundstellen: 13 geprüft. 0 brechen sicher, 3 sind zu prüfen, 10 sind nicht betroffen.** Was zu tun bleibt, betrifft
  Werkzeuge und CI, nicht den App-Code. Im App-Code wird keine der 23 Breaking Changes aus 38 bis 42 benutzt.

## 1. Welche Hauptversionen gepflegt sind (Belege)

`npm view electron dist-tags`: `latest 44.5.1`, `44-x-y 44.5.1`, `43-x-y 43.7.7`, `42-x-y 42.11.10`,
`41-x-y 41.10.7`, `alpha 45.0.0-alpha.14`.
`npm view electron time --json`, Erscheinen von x.0.0 und letzte Ausgabe je Hauptversion:

| Hauptversion | x.0.0 erschienen | letzte Ausgabe | Stand |
|---|---|---|---|
| 44 | 25.08.2026 | 44.5.1 am 30.09.2026 | gepflegt (neueste) |
| 43 | 30.06.2026 | 43.7.7 am 30.09.2026 | gepflegt |
| **42** | 06.05.2026 | **42.11.10 am 30.09.2026** | **gepflegt (älteste)** |
| 41 | 11.03.2026 | 41.10.7 am 25.08.2026 | nicht mehr gepflegt: letzte Ausgabe am Tag von 44.0.0 |
| 37 | 24.06.2025 | 37.10.3 am 26.11.2025 | seit über 10 Monaten ohne Ausgabe |

Electron pflegt die drei neuesten stabilen Hauptversionen, das sind 44, 43 und 42. Dazu passen die Daten:
42 und 43 bekamen am 30.09. noch Ausgaben, 41 seit dem Erscheinen von 44.0.0 keine mehr.

## 2. Ablauf in der Kopie

1. `npm ci` auf 37. Die Binärdatei wurde heruntergeladen (postinstall). Danach eslint, test-channel und test-v6 als Ausgangsstand.
2. `npm install --save-dev electron@^42.11.10`. Dabei wurde **keine Binärdatei geladen**, weil es ab 42 kein postinstall mehr gibt
   (siehe Tabelle). Ich habe sie mit `node node_modules/electron/install.js` nachgeholt, und der Download lief durch.
   `ELECTRON_SKIP_BINARY_DOWNLOAD` brauchte ich nicht. Auf 42 hat die Variable ohnehin keine Wirkung mehr.
3. Dieselben drei Läufe auf 42. Danach liefen test-channel und test-v6 noch einmal unter `ELECTRON_RUN_AS_NODE=1`, also mit Node 24.
4. Kurzstart auf 37 und auf 42, jeweils 25 s unter `xvfb-run`, und Abfrage über `--remote-debugging-port`.
5. `npx electron-builder --win dir --x64 --publish never` und danach `DIST=… node test-v6.js`.
6. Die Lockdatei weicht nach der Anhebung in 249 Zeilen ab. Neu sind `@electron/get` 5.1.0 und
   `@electron-internal/extract-zip` statt `extract-zip`, außerdem `@types/node` ^24. `npm audit` meldet auf 37 8 Lücken „high",
   auf 42 noch 6.

## 3. Tabelle

Die Quellen sind `docs/breaking-changes.md` (electron/electron, main), Abschnitte 38.0 bis 42.0, und der Abgleich mit dem Code.
Zeilenangaben beziehen sich auf HEAD `61dca2c`.

| Änderung | Electron-Version | betroffene Stelle Datei:Zeile | bricht? | nötige Anpassung | Aufwand |
|---|---|---|---|---|---|
| Versionsfeld anheben | 42 | package.json:15 (`"electron": "^37.2.0"`), package-lock.json | ja (Pflicht) | `^42.11.10` eintragen, Lock mit `npm install` neu erzeugen und mitcommitten | 5 min |
| Kein `postinstall`-Download mehr. Die Binärdatei kommt beim ersten `npx electron`, `ELECTRON_SKIP_BINARY_DOWNLOAD` entfällt | 42 | package.json:10 (`"start": "electron ."`), tools/*-probe.js, tools/ui-*.js (Aufruf per `npx electron`) | prüfen | Nichts bricht: der erste Start lädt nach, `npx install-electron --no` lädt vorab. Offline oder hinter Proxy kommt der Download jetzt erst beim ersten Start statt bei `npm ci` | 10 min |
| `electron` 42, `@electron/get` 5 und `extract-zip` verlangen Node ≥ 22.12.0 | 42 | .github/workflows/build.yml:47 (`node-version: '20'` in beiden Jobs) | prüfen | `npm ci` auf Node 20 gibt nur eine EBADENGINE-Warnung aus, und die Tests brauchen die Binärdatei nicht. electron-builder bringt sein eigenes `@electron/get` 3.1.0 mit. Sauber wäre `node-version: '22'` in beiden Jobs. Die lokale Node-Version auf Wilhelms Rechner für `npm start` kenne ich nicht | 10 min |
| Node 22 → 24 im Hauptprozess und in der Messmaschine (fork mit `ELECTRON_RUN_AS_NODE`) | 38–42 | main.js:811–816 (fork), tools/release.js:452 | nein | Keine entfernten Node-APIs gefunden (`url.parse`, `new Buffer`, `util.is*`, `fs.rmdir`, `SlowBuffer`, `punycode`). Die Suite läuft unter Node 24 von Electron gleich | – |
| Chromium 138 → 148, Verhalten bei `file://` | 38–42 | main.js:2456 (`loadFile`), main.js:2467–2474 (`will-navigate`), scoreboard.js:635–642 (`navigator.clipboard` mit Ausweichweg) | nein | Der Kurzstart lädt `file://…/index.html` gleich, Sperre und Ausweichweg bleiben | – |
| `window.open`-Popups sind immer in der Größe veränderbar | 39 | main.js:2458–2461 (`setWindowOpenHandler` → immer `deny`) | nein | entfällt, es wird kein Popup geöffnet | – |
| `clipboard`-Modul im Renderer veraltet | 40 | depot.js:1077, scheinfinder.js:507/562/587, scoreboard.js:641 | nein | Dort wird das Web-API `navigator.clipboard` benutzt, nicht das Electron-Modul | – |
| macOS-Benachrichtigungen über `UNNotification`, nur mit Signatur | 42 | depot.js:979/993, renderer.js:671/788 (`new Notification`) | nein | Betrifft nur macOS, gebaut wird nur Windows (package.json `win`/`nsis`) | – |
| `--host-rules` veraltet, `MacCatap…`-Schalter | 39 | tools/*-probe.js, tools/ui-*.js (`appendSwitch('disable-features','CalculateNativeWinOcclusion')` u. a.) | nein | Diese Schalter stehen nicht auf der Liste. Ob sie unter Chromium 148 noch wirken, wäre bei den Probe-Werkzeugen zu sehen | – |
| Entfernt oder veraltet, im Code nicht benutzt: `clearStorageData({quotas})` (42), `createFromNamedImage`-Array (42), OSR-Skalierung 1.0 (42), PDF ohne eigenes WebContents (41), Ursachen bei Cookie-`changed` (41), `showHiddenFiles` unter Linux (41), OSR-`paint`-Struktur und `desktopCapturer`-Plist (39), `plugin-crashed`, `webFrame.routingId`/`findFrameByRoutingId` (38) | 38–42 | grep über *.js, markt/*.js, tools/*.js, index.html: kein Treffer | nein | – | – |
| Linux/macOS: `ELECTRON_OZONE_PLATFORM_HINT` und `ORIGINAL_XDG_CURRENT_DESKTOP` entfernt, Wayland als Standard, macOS 11 entfällt | 38 | keine (Ziel ist Windows x64). Kurzstarts in der Entwicklung unter Linux/Wayland laufen nativ unter Wayland | nein | höchstens `--ozone-platform=x11` für Werkzeuge unter Wayland | – |
| Electron-APIs ohne Änderung in 38–42: `safeStorage` (main.js:1255/1264), `setLoginItemSettings` (main.js:288–299), `Tray`/`Menu` (main.js:2410–2415), `requestSingleInstanceLock` (main.js:17), BrowserWindow mit `sandbox`/`contextIsolation`/`additionalArguments` (main.js:2423–2445), preload mit `contextBridge` und `ipcRenderer.invoke`/`on` (preload.js:2–94) | – | wie angegeben | nein | Keine Änderung, der Kurzstart bestätigt preload und Bridge (59 Funktionen) | – |
| electron-builder 26.15.3 und electron-updater 6.8.9 mit Electron 42 | 42 | package.json:16/70, tools/release.js:596 | prüfen | Unter Linux erkennt `--win dir` electronVersion=42.11.10 und baut. NSIS-Installer, `latest.yml` und ein echter Update-Durchlauf 37→42 auf Windows sind ungeprüft. Ab 42 braucht man Windows 10 oder neuer, das gilt seit Electron 23 unverändert | 30–60 min (ein CI-Lauf mit `workflow_dispatch` ohne Veröffentlichen, dann Installer und Update auf einem Windows-Rechner) |

## 4. Liste der nötigen Arbeiten und Aufwand

1. Versionsfeld und Lockdatei anheben (package.json:15). **5 min**
2. CI auf `node-version: '22'` stellen (build.yml:47, beide Jobs). Lokal Node ≥ 22.12 sicherstellen. **10 min**
3. Den geänderten Binär-Download zur Kenntnis nehmen. Wer die Probe-Werkzeuge offline benutzt, lädt vorab mit `npx install-electron --no`. **10 min**
4. Windows-Installer über CI bauen lassen, ohne zu veröffentlichen, und auf Windows Start, Tray, Autostart, safeStorage-Entschlüsselung
   gespeicherter Schlüssel und einen Update-Durchlauf prüfen. Das ist der einzige Teil, den diese Probe nicht abdeckt. **30–60 min**
5. Optional die Probe-Werkzeuge (tools/*-probe.js) einmal unter 42 laufen lassen, wegen der Chromium-Schalter. **15 min**

Gesamt etwa **1–1,5 h**. Im App-Code ist nach diesem Abgleich keine Änderung nötig.

## Rohdaten (im Scratchpad)

`l37-*.txt` und `l42-*.txt` (eslint, channel, v6), `l42node-*.txt` (Läufe unter Node 24 von Electron), `l42dist-v6.txt`,
`start37.txt` und `start42.txt`, `build42.txt`, `breaking.md` (geladen von raw.githubusercontent.com, main).
