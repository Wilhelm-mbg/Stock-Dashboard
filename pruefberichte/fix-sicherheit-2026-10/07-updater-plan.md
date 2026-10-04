# Plan Fund 7: signierte Updates und Installer gegen Commit prüfen

Stand `main` 61dca2c, electron-updater 6.8.9, electron-builder 26.15.3. Grundlage: `pruefberichte/sicherheit-2026-10/04-updater-release.md` (U1, U2, R1–R3, C1–C4) auf `origin/pruefung/sicherheit-2026-10`. Das hier ist nur ein Plan, nichts davon ist umgesetzt.

## Kurzfassung

1. **Sofort, 1–2 h, nur Handgriffe Wilhelms (a):** Immutable Releases, Tag-Ruleset `v*` und eine Environment mit Freigabe einrichten. Das schließt das Überschreiben von Assets (C2) und schreibende CI-Tokens aus. Gegen den PAT auf Wilhelms Rechner hilft es erst, wenn R1 (Token-Trennung) erledigt ist.
2. **Eigentliche Lösung für U1, 16–20 h (b):** eine Ed25519-Signatur über `{version, sha512, commit}`. Der Schlüssel liegt offline, und nur Wilhelm gibt ihn mit seiner Passphrase frei. Der öffentliche Schlüssel steckt in `main.js`. Die Prüfung läuft über den öffentlichen Hook `verifyUpdateCodeSignature`, und zwar *vor* `update-downloaded` und *vor* dem Quit-Handler.
3. **Nachweis „Installer = Commit“, 10–12 h (c):** In `release.js` die Suite nach dem Bau mit `DIST` laufen lassen, `app.asar` gegen `git ls-tree HEAD` vergleichen, den sha512 in `bau-stand.json` festhalten und mit `npm ci` statt Junction bauen. Das schützt vor Pannen und lokalen Fremdbauten, nicht vor einem Angreifer auf dem Rechner der Wache.
4. **Authenticode (d), später und nur ergänzend:** Azure Trusted Signing kostet etwa 10 $ im Monat. Die Zulassung von Einzelpersonen außerhalb von USA/Kanada ist ungewiss, und `CSC_LINK` (.pfx) passt für neue Zertifikate nicht mehr. Es beseitigt SmartScreen-Warnungen, ersetzt (b) aber nicht.
5. **Reihenfolge:** (a) und R1 → Workflow-Härtung (C1/C2/C4) → (c) → (b) mit Probelauf → U2-Standard überdenken → (d) optional.

## Ausgangslage (belegt)

- `main.js:2498-2517`: `setupUpdater()` setzt `autoDownload` und `autoInstallOnAppQuit` auf `!updAus` (2508–2509). `update-downloaded` (2515) meldet nur. Geprüft wird alle 6 h (2568).
- Die Signaturprüfung findet nicht statt. `NsisUpdater.js:84-99` gibt `null` zurück, sobald `app-update.yml` keinen `publisherName` trägt. electron-builder schreibt ihn nur, wenn signiert wird (`app-builder-lib/out/publish/PublishManager.js:202-207`). Übrig bleibt der sha512 aus `latest.yml` im selben Release.
- Einspielen: `BaseUpdater.js:28-36` ruft nach dem Download `dispatchUpdateDownloaded` und **danach** `addQuitHandler()` auf. Dieser registriert sich nur, wenn `autoInstallOnAppQuit` in diesem Moment wahr ist (70). Beim Beenden prüft er die Variable erneut (79) und ruft dann `install(true,false)` auf (88).
- Der Hook ist `NsisUpdater.js:22-29`, ein öffentlicher Setter `verifyUpdateCodeSignature(publisherNames, pfad) => Promise<string|null>`. Er wird in der Download-Aufgabe aufgerufen (52–57). Liefert er einen Text statt `null`, folgen `removeTempDirIfAny()` und der Fehler `ERR_UPDATER_INVALID_SIGNATURE`. Es gibt dann kein `update-downloaded` und keinen Quit-Handler.
- Lücke im Hook: `AppUpdater.js:604-607` – liegt eine passende Datei schon im Cache, geht es direkt zu `done(false)`, **ohne** die Aufgabe und damit ohne den Hook.
- Bauen: `release.js:560-580` hängt `node_modules` per Junction ein. `npm test` läuft **vor** dem Bau (593), Bau 596, `paketQs` 606, `bau-stand.json` nur mit HEAD (157–161, 609), `DIST`-Abkürzung 627, Hochladen 715/718.
- CI: `.github/workflows/build.yml:46` hat global `contents: write`, Zeile 47 hängt mit `upload --clobber` an.
- Test-v6 sichert in `test-v6.js:7720` nur „nicht abgeschaltet“ zu.
- Die README behauptet „Installer wird nur von GitHub Actions gebaut“. Laut C2 sind alle Assets von v8.43–8.45 von Hand hochgeladen, die Aussage ist also zu korrigieren.

## Angreifer-Modell (für die Spalten „deckt ab“)

- **A1 – Release-Schreiber:** kann Release-Assets ändern oder ein neues Release anlegen, etwa über das `GITHUB_TOKEN` der CI, ein npm-Paket in der CI oder ein gestohlenes Token mit `contents: write`.
- **A2 – Repo-Kontrolle:** kann pushen und Tags setzen, etwa über Wilhelms PAT aus `git credential fill` oder einen Agenten nach Issue-Injektion (R1).
- **A3 – Rechner der Wache:** Code läuft auf Wilhelms Rechner mit seinen Rechten, z. B. über ein verseuchtes `node_modules` (R3) oder eine Version per Shell-Injektion (R4).
- **A0 – Panne ohne Absicht:** veralteter oder fremder Build, Wettlauf zwischen CI und Wache.

## (a) GitHub-Einstellungen – nur Handgriffe des Eigentümers

**Schritte:**
1. Settings → General → Releases → „Enable release immutability“ einschalten. Veröffentlichte Releases sind danach unveränderlich, Assets und Tag eingeschlossen. Entwürfe bleiben änderbar, deshalb passt der Ablauf in `release.js` (Entwurf → upload → `--draft=false`, 684–718) weiter.
2. Settings → Rules → Rulesets → Tag-Ruleset für `refs/tags/v*` anlegen: Erstellen, Aktualisieren und Löschen sind eingeschränkt. Bypass erhält nur die Rolle „Repository admin“.
3. Environment `release` mit „Required reviewers: Wilhelm-mbg“ und „Deployment branches and tags: nur `v*`“ anlegen.
4. 2FA prüfen. Unter „Fine-grained tokens“ den Zuschnitt des Diagnose-Tokens prüfen (U3).
**Was es abdeckt:**
- A1 über das CI-Token: Das Ersetzen von Assets ist gesperrt (schließt C2-B), Tags lassen sich nicht anlegen.
- A0-Wettlauf: Ein `--clobber` nach der Veröffentlichung scheitert.
**Was es nicht abdeckt:**
- A2: Ein Bypass für Wilhelm gilt auch für jeden, der seinen PAT benutzt. Die Freigabe der Environment lässt sich mit einem PAT, der Repo-Rechte hat, auch über die API erteilen.
- Ein *neues* Release mit höherer Version.
- Folge: Erst zusammen mit R1 wird daraus eine Grenze, also Release-Rechte nur noch über ein eigenes Token oder über die CI mit Freigabe, und Agenten bekommen nur Issues: Read.
**Aufwand:** 1 h für die Klicks, 0,5 h für die Probe (versuchen, ein Asset eines alten Releases zu ersetzen; muss scheitern).
**Risiko:** Ein fehlgeschlagener Lauf von `--hoch` nach der Veröffentlichung lässt sich nicht mehr reparieren. Dann bleibt nur eine neue Patchversion. Das ist gewollt.
**Begleitende Dateiänderung (a2, 2–3 h, eigener Auftrag), `.github/workflows/build.yml`:** `permissions: {contents: read}` global, `write` nur im Release-Job mit `environment: release`; `persist-credentials: false`; Werte über `env:` statt `${{ }}`, Tag gegen `^v\d+\.\d+\.\d+$` (C4); `--clobber` streichen, bei vorhandenem Release abbrechen (C2); Dispatch-Release nur auf `refs/heads/main`; Actions auf SHA pinnen.
Dazu die Zusicherungen in `test-v6.js` anpassen, die `planQ` per Textmarke lesen (ca. 7690–7725). **Vor** der Reparatur des roten Prüfjobs (C3).

## (b) Eigene Ed25519-Signatur ohne CA

**Format:**
- `tools/signieren.js` (Schritt 6) hängt zwei Felder an `latest.yml` an: `markt_signiert` (die exakten Bytes eines JSON-Texts `{"v":1,"version":"8.46.0","sha512":"<base64 wie in latest.yml>","commit":"<40 Zeichen>","repo":"Wilhelm-mbg/Stock-Dashboard"}`) und `markt_signatur` (Ed25519 über genau diese Bytes, base64).
- Geprüft werden also die Bytes, es gibt keine Kanonisierung. `Provider.js:91-103` gibt das YAML unverändert durch, die Zusatzfelder kommen daher in `update-available` an.
- Alternative: ein eigenes Asset `update-signatur.json`. Das kostet einen zweiten Abruf samt Umleitung zu `objects.githubusercontent.com` und hat keinen Vorteil.
**Schlüssel:**
- `tools/signieren.js schluessel` erzeugt das Paar mit `crypto.generateKeyPairSync('ed25519')`.
- Den privaten Schlüssel als PKCS8-PEM mit Passphrase (aes-256-cbc) auf einem USB-Stick ablegen, eine **zweite** Kopie mit eigenem Schlüsselpaar (Reserve) offline, z. B. im Safe.
- Nie in `~/.ssh`, im Repo, in Umgebungsvariablen oder im Credential-Speicher. Die Passphrase tippt Wilhelm interaktiv ein (TTY, kein Argument, keine Umgebungsvariable). Ein Agent kann das nicht.
- Stufe 2 (+4 h): YubiKey 5.7+ (PIV kann Ed25519) über PKCS#11.
**Schritte:**
1. `package.json` `build.publish[0]`: `"publisherName": ["Markt-Dashboard-Ed25519"]` setzen. Damit landet ein Name in `app-update.yml`, und `NsisUpdater.verifySignature` ruft den Hook überhaupt erst auf. Ein explizit gesetzter Wert bleibt erhalten (`PublishManager.js:202`). Das ist zugleich **fail-closed**: Fehlt der Hook, prüft der PowerShell-Standard auf Authenticode „Markt-Dashboard-Ed25519“ und verwirft.
2. `main.js` in `setupUpdater()` (nach 2510): `const UPD_SCHLUESSEL = ['<pem1>', '<pem2-reserve>']`; Den Listener `update-available` erweitern: `updInfo = i` merken; `autoUpd.verifyUpdateCodeSignature = async (_namen, pfad) => updPruefen(updInfo, pfad)`; `updPruefen` gibt `null` oder einen Grund zurück. Es prüft: beide Felder vorhanden; `crypto.verify(null, bytes, key, sig)` mit **einem** der eingebetteten Schlüssel; `version === updInfo.version` und größer als `app.getVersion()`; `repo` stimmt; `sha512(pfad)` (gestreamt) gleich dem signierten Wert; Sobald die App selbst Authenticode trägt (d), zusätzlich den Standardprüfer aufrufen, nicht ersetzen.
3. **Cache-Lücke** (`AppUpdater.js:604-607`): Im Listener `update-downloaded` (2515) `i.downloadedFile` noch einmal prüfen. Synchron, ca. 0,3–0,5 s für einen sha512 über etwa 90 MB. Bei Fehler **im Listener selbst** `autoUpd.autoInstallOnAppQuit = false` setzen, dann registriert `addQuitHandler` gar nicht erst (`BaseUpdater.js:32-33,70`). Außerdem `updState` auf einen Fehler setzen, damit auch `update-install` (2539) verweigert; Asynchron reicht nicht, weil der Quit-Handler sonst schon steht; Einfachere Alternative: Beim Start den Cache-Ordner `%LOCALAPPDATA%\markt-dashboard-updater\pending` leeren.
4. `update-set-auto` (2548): Darf `autoInstallOnAppQuit` nicht wieder auf `true` setzen, wenn die letzte Prüfung fehlschlug.
5. Fehlertext für `ERR_UPDATER_INVALID_SIGNATURE`: „Update verworfen: nicht vom Herausgeber signiert – bitte melden“, kein stilles Weiterlaufen.
6. `tools/signieren.js signieren <dist>`, aufgerufen von Wilhelm zwischen `--bauen` und `--hoch`: liest `bau-stand.json` (Commit, sha512 aus (c)) und `latest.yml`; prüft, dass beide übereinstimmen und dass HEAD gleich Commit ist; zeigt Version, Commit, sha512 und `git log -1` an und **fragt nach der Passphrase**; schreibt die zwei Felder
7. `release.js --hoch` (vor 715): verweigert, wenn die Signatur fehlt oder sich nicht gegen den in `main.js` **des Commits** eingebetteten Schlüssel prüfen lässt.
8. README, Einstellungstext (`index.html:2965`) und `test-v6.js` 7653/7720 anpassen. Die Aussage „nicht signiert“ bleibt für Authenticode wahr. Neu ist „Updates tragen eine eigene Signatur“.
**Rollout:**
- **Erste Version N mit Prüfung kommt ungeprüft auf die Rechner.** Alte Clients (≤ 8.45) prüfen nichts. Wer vor N ein falsches „N“ ausliefert, gewinnt weiter. Dagegen hilft nichts außer, N schnell auszuliefern.
- N selbst wird schon signiert. Alte Clients ignorieren die Zusatzfelder, die Kette wird so einmal echt durchlaufen.
- Clients, die nie aktualisieren, bleiben offen.
- **Probelauf vor N ist Pflicht.** Ein fehlerhafter Prüfer in N verwirft jedes spätere Update, und Abhilfe gibt es dann nur per Hand-Installation. Deshalb: ein Testbau mit `dev-app-update.yml` und `forceDevUpdateConfig` gegen ein Test-Repo oder einen lokalen `generic`-Server; auf Windows vier Fälle: gut, falsche Signatur, falscher sha512, alte Version; erst danach N bauen.
- **Schlüsselverlust:** Es sind zwei Schlüssel eingebettet. Ist einer verloren, signiert der andere und liefert eine Version mit neuer Liste aus; Sind beide weg, gibt es kein Auto-Update mehr. Dann in der App bzw. README auf die Hand-Installation verweisen, analog `UPD_PAKETFEHLER` in `main.js:2493`; Rotation geschieht immer mit einem Release, das vom **alten** Schlüssel signiert ist und die neue Liste enthält.
- **Kompromittierter Schlüssel:** Mit dem Reserveschlüssel sofort eine Version N+1 ausliefern, die ihn entfernt. Der Angreifer kann bis dahin ebenfalls ausliefern; Immutable Releases plus Ruleset (a) verkleinern das Zeitfenster.
- Bewusst **kein** Notschalter in den Einstellungen, der die Prüfung abschaltet. Er wäre selbst die Lücke.
**Was es abdeckt:**
- A1 vollständig.
- A2, solange der Schlüssel nicht auf dem Rechner liegt: Ein Agent kann taggen und hochladen, aber nicht signieren.
- Wettlauf C2: Ein CI-Build ohne Signatur wird von den Clients verworfen. Damit gibt es faktisch nur noch einen Ausspielweg.
**Was es nicht abdeckt:**
- A3 in dem Moment, in dem Wilhelm signiert. Er signiert, was `signieren.js` ihm anzeigt; wer `release.js` oder `node_modules` manipuliert hat, legt ihm einen fremden Installer zum Signieren vor. Gegenmittel ist (c) sowie „signieren auf einem zweiten Rechner“.
- Clients ≤ N-1.
- SmartScreen.
**Aufwand ≈ 17 h** (+4 h YubiKey): Hook mit Cache-Prüfung 4, `signieren.js` 3, `release.js` 1, Tests 3, Windows-Probelauf 4, Texte 1, Schlüsselzeremonie 1.
**Tests:**
- Neues `test-updater-signatur.js` in `npm test`: `updPruefen` als reine Funktion mit einem Test-Schlüsselpaar gegen gut, manipulierte Bytes, falsche Version, kleinere Version, falsches Repo, fremden Schlüssel und fehlende Felder.
- Zusicherungen in `test-v6.js`: `publisherName` steht in `build.publish[0]`; `verifyUpdateCodeSignature =` wird auf eine Funktion gesetzt; eingebettete Schlüssel sind gültige Ed25519-PEM; `release.js` ruft die Signaturprüfung vor `gh release upload` auf
- Nach dem Bau prüfen, dass `win-unpacked/resources/app-update.yml` den `publisherName` trägt.

## (c) Installer gegen den Commit prüfen (`tools/release.js`)

**Schritte:**
1. **`npm ci` statt Junction** (560–580): im Baubaum `npm ci --prefer-offline`. Vorher prüfen, ob `--ignore-scripts` reicht: electron-builder holt Electron selbst aus dem eigenen Cache, die Tests brauchen kein Electron-Binary. `baubaumWeg()` (219–230) wird dadurch einfacher, weil keine Junction mehr zu lösen ist. Zusätzlich `npm audit signatures`.
2. **Suite nach dem Bau** mit `DIST=<BAUBAUM>/dist` (nach 606), wie in der CI (`build.yml:47`, „Tests gegen das gebaute Paket“). Damit wird Abschnitt 31 (`test-v6.js:3015-3105`) hart statt übersprungen.
3. **Vollvergleich `app.asar` ↔ Git:** neue Funktion `paketGegenCommit(dist)`; `asar.listPackage` über alle Einträge außerhalb von `node_modules/`, und für jeden: Bytes gleich `git show HEAD:<pfad>`; Erlaubt außerhalb von Git ist nur `telemetrie.json` (namentlich); Für `node_modules/*/package.json`: `version` gleich `package-lock.json`; `app.asar.unpacked` ebenso.
4. **Setup.exe statt nur `win-unpacked`:** Mit `7zip-bin` (liegt bei electron-builder) `$PLUGINSDIR/app-64.7z` aus der Setup.exe entpacken und dessen `resources/app.asar` per sha256 mit `win-unpacked` vergleichen. Heute prüft `paketQs` (410–416) nur `win-unpacked`, ausgeliefert wird aber die exe.
5. **`bau-stand.json`** (157–161) bekommt zusätzlich: `setupSha512`, `asarSha256`, `lockSha256`; `pruefungen: ["npm test+DIST", "paketGegenCommit", "setup-entpackt"]`
6. **`bauStandPruefen`** (162–183) verlangt `sha512(setup) === setupSha512 === latest.yml.sha512`.
7. **`process.env.DIST ||` (627) streichen** oder nur mit `--von-hand` zulassen.
8. Die Version gegen `/^\d+\.\d+\.\d+$/` prüfen und `execFileSync` mit Argument-Array verwenden (R4; dieselbe Stelle, kostet 1 h extra).
**Grenze:** Bytegleichheit der Setup.exe ist nicht erreichbar, weil NSIS Zeitstempel einbaut. Darum wird der **Inhalt** verglichen, nicht die exe; den Hash der exe hält `bau-stand.json` fest.
**Was es abdeckt:**
- A0: veralteter Build, fremdes `dist`, verändertes `node_modules`.
- Liefert den Beleg, den CLAUDE.md heute nur behauptet.
- Liefert (b) die Grundlage dessen, was signiert wird.
**Was es nicht abdeckt:** A3, weil der Prüfer auf demselben Rechner läuft wie der Angreifer, sowie A1 und A2 nach dem Hochladen.
**Aufwand ≈ 11 h:** `npm ci` samt Windows-Timing 3, Suite mit `DIST` 1–2, `paketGegenCommit` 4, Setup entpacken 2, `bau-stand`/`DIST` 1.
**Risiko:** `npm ci` verlängert jeden Bau um 1–3 min. Abschnitt 31 kann mit `DIST` erstmals rot werden; dann die Ursache klären, nicht die Zusicherung lockern.
**Tests:** Probe mit einer absichtlich geänderten Datei in `dist/win-unpacked/resources/app.asar` (über `@electron/asar`): `--hoch` muss abbrechen. Ebenso mit einer ausgetauschten Setup.exe und einem `bau-stand.json` ohne sha512.

## (d) Authenticode – Azure Trusted Signing

**Schritte:**
1. Azure-Konto mit Trusted-Signing-Account (Basic ca. 9,99 $ im Monat, 5.000 Signaturen) und Identitätsprüfung; **Offen:** Die Zulassung von Einzelpersonen galt bei meinem Wissensstand nur für USA und Kanada. Ohne Firma oder Gewerbe mit Historie ggf. nicht verfügbar; vor jeder Arbeit klären; Alternativen: SignPath Foundation (kostenlos für OSS, mit Antrag) oder ein OV-Zertifikat auf Token (200–400 € im Jahr, README:88).
2. In electron-builder 26 `win.azureSignOptions` (endpoint, certificateProfileName, codeSigningAccountName) mit Entra-App-Credentials als CI-Secrets setzen. **`CSC_LINK` greift dafür nicht.** Es ist der .pfx-Weg, und seit 2023 gibt es neue Zertifikate nur auf Hardware, nicht als .pfx. README 74–92 und `build.yml` Z. 32–38 entsprechend korrigieren.
3. Damit setzt electron-builder `publisherName` selbst (`PublishManager.js:204`). Den Hook aus (b) so umbauen, dass er erst den Standardprüfer und dann Ed25519 aufruft.
4. Signiert wird in der CI (A1 mit CI-Zugriff kann dann signieren) **oder** lokal bei der Wache (A3 kann signieren). Deshalb Authenticode allein nicht als Update-Grenze nehmen.
**Was es abdeckt:** SmartScreen und die Herkunftsanzeige beim Erstinstallieren, also den Download über die Releases-Seite, den (b) nicht erfasst.
**Was es nicht abdeckt:** wer die Signier-Credentials erreicht (CI-Secrets bzw. Azure-Login auf dem Wache-Rechner).
**Aufwand:** 6–10 h plus Wartezeit für die Validierung (Tage), dazu laufende Kosten von etwa 120 $ im Jahr.

## Empfehlung und Reihenfolge

1. **Diese Woche:** (a) einschalten (1,5 h, Wilhelm); Parallel R1: Agenten bekommen ein Token nur mit Issues: Read, das Release-Token liegt nicht mehr im allgemeinen Credential-Speicher. Ohne R1 bleibt (a) gegen A2 wirkungslos.
2. **a2** Workflow-Härtung (C1/C2/C4), **bevor** jemand C3 (roten Prüfjob) repariert.
3. **(c)** in `release.js`: schafft den sha512 im Bau-Stand, auf den (b) aufsetzt, und macht die Aussage in CLAUDE.md wahr.
4. **(b)** mit Probelauf auf Windows, dann Version N ausliefern; Bis N live ist, U2 entschärfen: `autoInstallOnAppQuit` standardmäßig `false` setzen, also „geladen, Einspielen per Knopf“ (`main.js:2509`); Danach den Standard zurücksetzen.
5. **(d)** nur, wenn SmartScreen oder Vertrauen beim Erstinstallieren wichtig werden. Klären, ob Wilhelm zugelassen wird, bevor Zeit hineingeht.
**Gesamt ohne (d):** etwa 32 h Code und Probe, dazu 2–3 h Handgriffe Wilhelms und eine Schlüsselzeremonie.
**Offen und von Wilhelm zu entscheiden:**
- Wo liegt der Signierschlüssel (USB mit Passphrase oder YubiKey)?
- Signiert er jede Version selbst? Das ist gewollt, weil es eine menschliche Freigabe bedeutet.
- Werden Releases künftig nur noch über die CI oder nur noch über `release.js` ausgeliefert (C2)?

