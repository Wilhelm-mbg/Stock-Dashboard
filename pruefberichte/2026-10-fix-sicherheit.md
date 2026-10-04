# Behebung Sicherheits-Durchsicht 2026-10 (Zweig `fix/sicherheit-2026-10`, Basis `main` 61dca2c)

1. **Renderer startet keinen beliebigen Code mehr – behoben.** `write-strategie` und `mess-lauf` prüfen den Inhalt (`strategiepruefung.js`: nur die App-Vorlage, kein require/process/eval/Netz …), `mess-lauf` lehnt Verknüpfungen ab und startet nur nach Bestätigung im **nativen** Dialog (Prüfsumme in `userData/strategie-freigaben.json`, außerhalb des Store). Baukasten-Regeln und Vorlagen-Strategien laufen weiter; die Inhaltsprüfung ist eine Hürde, die Grenze ist der Dialog.
2. **HTML-Injektion – behoben.** Schein-Finder (Name, Kennung, Währung) escapt, `wkn.js` säubert am Eingang, `U.esc` escapt `'`, Rückfälle in `marktui`/`marktkarteui` geben nie Rohtext aus, `depot.js` Messdatum. Weitere Fundstellen mit Fremdtext: keine (Durchsicht aller innerHTML-Verkettungen).
3. **openExternal – behoben.** Erlaubte Hosts (news.google.com, finance.yahoo.com, github.com, finanzen.net, onvista.de, sec.gov) öffnen direkt, alles andere nur nach nativer Rückfrage mit voller Adresse; Benutzerteil, Port und Namensanhängsel bleiben zu.
4. **Hängende Abrufe – behoben.** `holeSitz`, `jsonGet`, `diagnose-send` lösen über der Grenze auf. Offen (niedrig, N4): Abrufe ganz ohne Größengrenze (`earnings-kalender`, `secJson`, `kerzenquelle`).
5. **Sicherung – behoben.** `alpKey`/`alpSecret` in `NIEMALS`; ein Test hält die Liste deckungsgleich mit `GEHEIME_FELDER`.
6. **.gitignore – behoben.** `.env`, `.env.*`, `*.pfx`, `*.p12`, `*.key`, `*.pem`.
7. **Signierte Updates – geplant**, nicht umgesetzt: [07-updater-plan.md](fix-sicherheit-2026-10/07-updater-plan.md). Sofort (1–2 h, Wilhelm): Immutable Releases, Tag-Ruleset, Environment-Freigabe; dann Ed25519-Signatur über `verifyUpdateCodeSignature` (~17 h) und Installer-gegen-Commit in `release.js` (~11 h).
8. **Electron – geprüft, nicht angehoben:** [08-electron-anhebung.md](fix-sicherheit-2026-10/08-electron-anhebung.md). Ziel 42 (älteste gepflegte); in der Kopie gleiche Testergebnisse, App startet; nichts im App-Code bricht. Zu tun ~1–1,5 h: Versionsfeld, CI auf Node 22, Windows-Installer und Update einmal echt prüfen. Entscheid: Wilhelm.
9. **Prüfung:** `npm test` enthält jetzt `test-sicherheit.js` (24) und `test-sicherheit-xss.js` (17); gegen den alten Stand 15 bzw. 13 rot, jetzt grün. eslint 0 Fehler, test-channel grün, test-v6 unverändert (dieselben 7 umgebungsbedingten Fehlschläge wie auf `main`).
10. **Nicht Teil dieses Zweigs:** Token in `telemetrie.json` (widerruft der Eigentümer), F4 (Schlüssel im Renderer), F5, F7–F14, N2–N7, CI/Release (C1–C4, R1–R5).

---

## Einzelheiten je Fund

### 1 – write-strategie / mess-lauf (F1, hoch)
- `main.js` `write-strategie`: `StrategiePruefung.inhaltPruefen` vor dem Schreiben.
- `main.js` `mess-lauf`: Riegel 2b (`lstat`/`realpath`), Riegel 4 (Inhalt), Riegel 5 (`strategieFreigeben`: `dialog.showMessageBox`, Kennung, Größe, Prüfsumme; erneute Frage bei geändertem Inhalt). Die Messmaschine selbst und Läufe über `node studien/messmaschine/messen.js` sind unverändert.
- Grenze der Inhaltsprüfung: eine Wortliste, keine Sandbox. Deshalb ist der Dialog die eigentliche Sperre. Weitergehend (offen): `utilityProcess` statt `ELECTRON_RUN_AS_NODE`, danach Fuses (F9).
- Test: `test-sicherheit.js` lädt `main.js` mit nachgebautem Electron und ruft die echten Handler auf (bösartiger Code, getarnter Code, Vorlage, Dialog nein/ja, Wiederholung ohne Frage, geänderter Inhalt, alle Baukasten-Muster).

### 2 – HTML-Injektion (F3, F10, mittel)
- `scheinfinder.js:242,394,528`, `wkn.js` (`klartext`, ISO-Währung), `app-shell.js:13`, `marktui.js:27`, `marktkarteui.js:20`, `depot.js:946`.
- Gesehen und bewusst gelassen (nur interne Konstanten): `calendar.js:97`, `app-shell.js:99`, `depot.js:747/3689/5907/6580`, `scoreboard.js:319/424`, `bugs.js:123`, `wendeui.js:219`, `backtestui.js:175`. Schönheitsfehler: `depot.js:4552` kürzt nach dem Escapen.
- Test: `test-sicherheit-xss.js` (Zeilenbau aus `scheinfinder.js` mit `CALL<img …>` und `<a href…>EUR</a>`, `wkn.js` direkt, Rückfälle mit/ohne `window.U`).

### 3 – openExternal (F6, mittel)
- `main.js` `externErlaubt`/`externOeffnen`, benutzt von `setWindowOpenHandler` und `will-navigate`. Es läuft immer nur eine Rückfrage zugleich, Spam verfällt. Der IPC-Kanal `open-external` war schon auf GitHub beschränkt und bleibt so.

### 4 – Abrufe (N1, mittel)
- `main.js` `holeSitz` (4 KB), `jsonGet` (2 MB), `diagnose-send` (1 MB). Test gegen einen lokalen Server, der die Grenze überschreitet und die Verbindung offen hält.

### 5/6 – Sicherung, .gitignore
- `tools/sicherung.js` `NIEMALS`. Test erzeugt ein Paket mit nachgebautem `powershell.exe` (nur außerhalb Windows) und prüft `settings.json` darin.
- `.gitignore`: Test über `git check-ignore`.
