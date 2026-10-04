# 01 – Zugangsdaten und Git-Historie (Sicherheits-Durchsicht 2026-10)

Stand: 04.10.2026, Zweig `pruefung/sicherheit-2026-10` (HEAD wie `main` zum Prüfzeitpunkt),
volle Historie: 1.603 Commits, 15 Fernzweige (inkl. `origin/radar`), 160 Tags, nicht flach.
Nur gelesen, kein Netz, keine Zugänge benutzt. **Kein echtes Geheimnis steht in diesem Bericht.**

## Kurzfassung

1. **HOCH – Das GitHub-Sende-Token steckt im öffentlichen Installer** (`package.json` `build.files` → `telemetrie.json` in `app.asar`, unverschlüsselt). Wer `Markt-Dashboard-Setup.exe` von den öffentlichen Releases (oder ein Actions-Artefakt) lädt, kann es mit `asar extract` auslesen und **unter der Identität des Eigentümer-Kontos** Issues anlegen, ändern, schließen. Bewusster, dokumentierter Kompromiss – die Schwere ergibt sich aus „handelt als Eigentümer" und „öffentlich, dauerhaft in allen alten Releases".
2. **MITTEL – Sicherungspaket nimmt die Alpaca-Schlüssel mit**: `tools/sicherung.js:43` schließt nur `capKey/capId/capPass` aus, nicht `alpKey/alpSecret` (Alpaca kam am 02.09. dazu, die Ausschlussliste vom 25.08. wurde nie nachgezogen).
3. **NIEDRIG – Fehlermeldungstext (`nachricht`) wird nicht von Pfaden bereinigt**, nur die Stapelspur (`bugs.js:45`); landet im öffentlichen Issue.
4. **NIEDRIG – Windows-Benutzername und Datenordner** stehen in 241 Dateien am HEAD (meist `studien/`, `FEHLERMELDUNGEN-AUFTRAG.md`, `.claude/skills`); Gmail-Adresse des Eigentümers in 9 Quelltexten (SEC-User-Agent, auch im ausgelieferten `stammdaten.js`) und in 1.551 Commit-/Tag-Metadaten.
5. **NIEDRIG** – `.gitignore` deckt nur `telemetrie.json`, nicht `.env`/`*.pem`/`settings.json`; Schlüssel-Fallback auf Klartext, wenn safeStorage fehlt; Teil-Echo in `TELEMETRIE_GRUND` bei kaputter `telemetrie.json`.
6. **Git-Historie: keine echten Geheimnisse gefunden** (keine GitHub-, Alpaca-, Capital-Schlüssel, keine privaten Schlüssel, keine Store-/Konto-Dumps). Alle Treffer sind Platzhalter, Testwerte oder Tickersymbole.

---

## Wie die Zugangsdaten in die App kommen (Bestandsaufnahme)

| Zugang | Quelle | Ablage | Weg nach außen |
|---|---|---|---|
| Capital.com-Demo (`capKey`, `capId`, `capPass`) | Einstellungsdialog (`index.html:2798-2808`, Felder `type=password` außer `capId`) | `%APPDATA%/Markt-Dashboard/store/settings.json`, je Feld `safeStorage` (`main.js:1251-1265`, `{__enc:'v1',d:…}`), Klartext-Rückfall | Renderer `capital.js:33,61` → IPC `cap-fetch` → `brokerFetch` mit Host-Zaun nur `demo-api-capital.backend-capital.com` (`main.js:1123,1155`) |
| Alpaca-Paper (`alpKey`, `alpSecret`) | Einstellungsdialog (`index.html:2833-2838`) | wie oben | `alpaca.js:65` und Hauptprozess `main.js:1599-1604` → `alpFetch`, Zaun `paper-api.alpaca.markets`, `data.alpaca.markets` |
| Alpaca für Studien/Werkzeuge | Umgebungsvariablen `ALPACA_KEY`/`ALPACA_SECRET`, nur in `studien/vorregistrierung-2026-09-02-spannen-historisch/schluessel.js` | nicht gespeichert | `verdecken()` + Klinke in test-v6 |
| GitHub-Sende-Token (Diagnose/Fehler) | `telemetrie.json` neben den App-Dateien; im CI aus Secret `TELEMETRIE_JSON`; von Hand via `tools/release.js:584` | **im Installer (`app.asar`), Klartext** | `main.js:497` Bearer an `api.github.com/repos/<repo>/issues` |
| GitHub-Token Werkzeuge | `git credential fill` (`tools/radar-hochladen.js:41`) | nur im Speicher | nicht ausgegeben |

Positiv festgehalten: Schlüssel gehen nie in URLs/Query-Strings (nur Kopfzeilen), `alpaca.js:47-51` und `main.js:1609-1615` verdecken Schlüssel in jedem ausgehenden Text, Capital-Fehler werden nur als `errorCode`/HTTP-Status geführt (`capital.js:41`), `diagnose-config` gibt das Token nie an den Renderer (`main.js:475-479`), Diagnose ist Weißliste ohne Einstellungen-Felder außer `kiVeto` (`diagnose.js:84`), kein `console.log` in `alpaca.js`, `capital.js`, `main.js`, `preload.js`, `renderer.js`, `kosten.js`. Electron: `contextIsolation:true`, `nodeIntegration:false`, `sandbox:true` (`main.js:2442-2444`), CSP `script-src 'self'` (`index.html:5`).

---

## Funde

### F1 – GitHub-Sende-Token im öffentlichen Installer · **hoch**

- **Ort:** `package.json` `build.files` enthält `"telemetrie.json"`; `.github/workflows/build.yml` Schritt „Diagnose-Rueckkanal einlegen" schreibt Secret `TELEMETRIE_JSON` nach `telemetrie.json` und lädt den Installer als Release-Asset **und** als Actions-Artefakt hoch; `tools/release.js:584-585` kopiert die lokale Datei in den Baubaum; Laden in `main.js:441-471`, Einsatz `main.js:497`.
- **Auslöser:** Jeder Download eines Release-Installers (öffentliches Repo) oder Actions-Artefakts (jeder angemeldete GitHub-Nutzer).
- **Möglicher Schaden:** Ein feingranulares PAT handelt **als das Eigentümer-Konto**. Mit „Issues: Read and write" (Vorlage `telemetrie.json.vorlage`) kann ein Dritter im Namen des Eigentümers Issues anlegen (Spam, Phishing-Links, rufschädigender Text), alle Issues schließen/umbenennen/umbeschriften, Kommentare bearbeiten und damit auch den Rückkanal `bugs.js:statusAbgleich` vergiften (der Status lokaler Meldungen wird aus Issue-Labels/-Zustand abgeleitet). Ist das Token breiter zugeschnitten als die Vorlage verlangt (nicht prüfbar ohne das Token), wächst der Schaden entsprechend (z. B. `contents:write` → Code/Releases → Lieferkette über den Autoupdater). Das Token liegt in **jedem alten Installer dauerhaft**, Löschen eines Release ändert daran nichts, nur Widerruf.
- **Nachweis (ohne Geheimnis):** `grep -n '"telemetrie.json"' package.json`; an einem heruntergeladenen Installer: `7z x Markt-Dashboard-Setup.exe` → `npx @electron/asar list resources/app.asar | grep telemetrie` (nur Existenz prüfen, Inhalt nicht ausgeben).
- **Behebung:** (1) Zuschnitt des aktiven Tokens prüfen: nur dieses Repo, nur Issues, Ablaufdatum gesetzt. (2) Mittelfristig kein Token im Client: entweder nur noch der Browser-Weg (vorausgefülltes Issue, existiert schon), oder ein kleiner Weiterleitungsdienst (z. B. Cloudflare Worker/GitHub App mit Installations-Token), der nur `POST issues` mit Label-Weißliste und Ratenlimit annimmt; alternativ ein eigenes Bot-Konto statt des Eigentümer-Kontos. (3) Actions-Artefakt-Upload für Dispatch-Läufe ohne Release entfernen oder `retention-days: 1` setzen. (4) Nach Umstellung das alte Token widerrufen.

### F2 – Alpaca-Schlüssel landen im Sicherungspaket · **mittel**

- **Ort:** `tools/sicherung.js:43` `const NIEMALS = ['capKey', 'capId', 'capPass'];` – es fehlen `alpKey`, `alpSecret` (Liste stammt aus `92b32a3` vom 25.08., Alpaca-Felder kamen mit `cd502c5` am 02.09.; `main.js:1251` `GEHEIME_FELDER` kennt alle fünf). Ebenso `LIESMICH.txt`-Text Z. 84 und `einspielen()` Z. 147.
- **Auslöser:** `node tools/sicherung.js` → ZIP in `Downloads`, laut Kommentar „per USB-Stick oder Mail auf einen anderen Rechner".
- **Möglicher Schaden:** Die Alpaca-Felder wandern mit. Im Normalfall als safeStorage-Blob (auf Windows an Benutzer+Rechner gebunden, anderswo nicht entschlüsselbar) – dann gering. War `safeStorage` beim Speichern nicht verfügbar, stehen sie **im Klartext** im ZIP. Zusätzlich funktional: beim Einspielen überschreibt der Blob aus dem Paket die Alpaca-Felder der Zielmaschine (nur Capital-Felder werden gerettet) → dort nicht entschlüsselbar.
- **Nachweis:** `grep -n "NIEMALS" tools/sicherung.js` vs. `grep -n "GEHEIME_FELDER =" main.js`.
- **Behebung:** `NIEMALS` aus derselben Quelle wie `GEHEIME_FELDER` speisen (oder `alpKey`, `alpSecret` ergänzen) und einen Test in test-v6 ergänzen, der beide Listen vergleicht.

### F3 – Fehlertext (`nachricht`) im öffentlichen Issue ungefiltert · **niedrig**

- **Ort:** `bugs.js:43-47` – `stapel` läuft durch `pfadeKuerzen()`, `nachricht` (bis 500 Zeichen) nicht. Geht über `issueVon()` (`bugs.js:151-153`) und `diagnose.js:240` (`fehler`) in öffentliche Issues.
- **Auslöser:** Ein unbehandelter Fehler/Rejection, dessen Meldung einen Pfad trägt (z. B. `ENOENT … 'C:\Users\<Name>\…'` aus einem IPC-Aufruf, `Error invoking remote method …`).
- **Schaden:** Windows-Benutzername (oft Klarname) von Testern öffentlich – genau das, was `pfadeKuerzen` verhindern soll.
- **Nachweis:** Im DevTools-Fenster `Promise.reject(new Error("open 'C:\\Users\\Max\\x'"))`, dann „Fehler melden" → Vorschau/Issue-Text enthält den Pfad.
- **Behebung:** `nachricht: pfadeKuerzen(nachricht)` und Test mit vergiftetem Pfad im Meldetext.

### F4 – Persönliche Daten im öffentlichen Repo · **niedrig**

- **Windows-Benutzername + Ordnerstruktur:** `git grep -lE 'Users[\\/]+Wilhe' HEAD | wc -l` → 241 Dateien (u. a. `FEHLERMELDUNGEN-AUFTRAG.md:17-18`, `tools/alpaca-vollsammlung.js:92`, `.claude/skills/*`, viele `studien/**`-JSON mit `C:/Users/<Name>/AppData/Local/Temp/claude/…`-Scratchpad-Pfaden, z. B. `studien/querschnitt-pruefstand-2026-09-13/pruefung-v22-*.json`, Commit `f7017ccb4a`). Verrät Benutzername, Laufwerke (`E:/Markt-Dashboard-Archiv`), Ordnerlayout. Kein Zugang, aber Erleichterung für gezieltes Phishing/Social-Engineering.
- **Gmail-Adresse des Eigentümers:** in 9 Quelltexten als SEC-User-Agent-Kontakt (`stammdaten.js:23`, `tools/edgar.js:17`, mehrere `studien/**`), in 1.478 Autor-/Committer-Metadaten, 72 Tags und 1 Commit mit Autor „Claude" + Eigentümer-Adresse. `stammdaten.js` wird ausgeliefert (`*.js` in `build.files`) → **jede fremde Installation** fragt SEC EDGAR mit der Kontaktadresse des Eigentümers an (SEC sperrt bei Überlast nach User-Agent; Beschwerden landen beim Eigentümer).
- **Dritte:** Eine fremde Gmail-Adresse in `studien/nachrichten-stimmung-machbarkeit-2026-09-19/lesenotizen-literatur.md:61` (Kontakt eines Datenanbieters, öffentlich – unkritisch); Vorname eines Testers in Commit-Betreff `92b32a3`.
- **Behebung:** Für künftige Commits `git config user.email 113207507+Wilhelm-mbg@users.noreply.github.com` und GitHub „Block command line pushes that expose my email"; User-Agent der App auf eine Projektadresse/Issue-URL umstellen bzw. vom Nutzer eintragen lassen; Pfade in Studien-Protokollen relativ schreiben. Historie umschreiben ist hier unverhältnismäßig (Adresse ist ohnehin in jedem Clone/Fork).

### F5 – `.gitignore` deckt nur das eine Geheimnis · **niedrig**

- **Ort:** `.gitignore` – nur `telemetrie.json`; nicht `.env*`, `*.pem`, `*.pfx`/`*.p12` (Signatur-Vorbereitung `CSC_LINK`!), `settings.json`, `fehlermeldungen.json`, `*.bak*`, `store/`. Studien lesen `ALPACA_KEY/SECRET` aus der Umgebung – wer dafür eine `.env` im Repo anlegt, hat sie ungeschützt; ein Codesignatur-Zertifikat im Baum ebenso. `tools/release.js:547` prüft nur `/telemetrie/`.
- **Nachweis:** `git check-ignore -v .env cert.pfx settings.json` → keine Ausgabe.
- **Behebung:** Muster ergänzen; optional Pre-Commit-Hook/CI-Schritt mit `gitleaks`.

### F6 – Klartext-Rückfall und Geheimnisse im Renderer · **niedrig**

- **Ort:** `main.js:1252-1258` speichert im Klartext, wenn `safeStorage.isEncryptionAvailable()` falsch ist (Windows praktisch immer verfügbar; Linux ohne Schlüsselbund nicht). `store-get` (`main.js:1290-1294`) liefert entschlüsselte Schlüssel an den Renderer; `app-shell.js:1407` schreibt sie in die Passwortfelder. Eine Code-Ausführung im Renderer hätte sie – dank CSP/Sandbox derzeit kein bekannter Weg.
- **Behebung:** Beim Rückfall sichtbar warnen statt still Klartext; mittelfristig Broker-Aufrufe ganz in den Hauptprozess ziehen (wie `main.js:1599` es für Alpaca schon tut), damit der Renderer die Schlüssel nie sieht.

### F7 – Teil-Echo der `telemetrie.json` in den öffentlichen Diagnosetext · **niedrig**

- **Ort:** `main.js:473` `TELEMETRIE_GRUND = 'Fehler beim Laden: ' + e.message` → `diagnose-config.grund` → `diagnose.js:307` `sendeweg` (öffentliches Issue) und `bugs.js:209-212`.
- **Auslöser:** Syntaxfehler in `telemetrie.json`. V8 zitiert bei „Unexpected token" bis zu ~10 Zeichen um die Fehlerstelle (geprüft mit Node 22 und Fantasiewert: `Unexpected token 'z', ..."jk" ,"x": z}"`). Steht der Fehler direkt hinter dem Token, gehen dessen letzte Zeichen mit.
- **Schaden:** nur Bruchstück (≤ 10 Zeichen), allein nicht verwertbar.
- **Behebung:** Nur `e.name` bzw. „JSON ungültig (Zeile/Spalte)" ausgeben.

### Hinweis (kein Fund) – Freitexte in Diagnose/Fehlermeldung

`diagnose.js:204` schickt `grund` (Ausstiegsgrund, 60 Zeichen Freitext) mit; die Texte stammen aus `risiko.js`/`depot.js` und enthalten nach Stichprobe keine Symbole. Der Meldetext des Nutzers geht offen ins Issue – das Formular sagt das an (`index.html:2919`). Der automatische Nachversand alter, nur lokal gespeicherter Meldungen beim Start (`bugs.js:231-283`) sendet ohne erneute Rückfrage öffentlich; Einwilligung lag beim Absenden vor, aber unter dem Hinweis „bleibt nur auf diesem Rechner" (Text `bugs.js:211`) – Wortlaut prüfen.

---

## Geprüft, nichts gefunden

| Prüfung | Befehl (aus der Repo-Wurzel) | Ergebnis |
|---|---|---|
| Typische Token-Muster in allen Diffs aller Refs (GitHub `ghp_/github_pat_/gho_/ghs_/ghu_`, Alpaca `PK…/AK…`, private Schlüssel, Slack, Google, `sk-`) | `git log --all -p --no-color -G'(ghp_\|github_pat_\|gho_\|ghs_\|ghu_\|PK[A-Z0-9]{16,}\|AK[A-Z0-9]{16,}\|BEGIN (RSA \|OPENSSH \|EC )?PRIVATE\|xox[bp]-\|AIza…\|sk-…)' -- . ':!package-lock.json'` + awk-Auszug der +/- Zeilen | nur Platzhalter `github_pat_HIER_EINFUEGEN` (`telemetrie.json.vorlage`, Commits `7fdfa8a2b4`, `dc103337c5`), `github_pat_...` in Kommentar `main.js` (`1c5dcea1b0`), `AKTIEN…` (Wort) in Studien-JSON |
| Literale Zuweisungen an Schlüssel-/Passwortfelder | `grep -iE "(api[_-]?key\|secret\|passw\|token\|capKey\|alpSecret…)\s*[:=]\s*['\"][A-Za-z0-9_+/=.-]{12,}"` über alle hinzugefügten Zeilen | nur Feldnamen-Zuordnung (`app-shell.js`) und Platzhalter |
| Literale Auth-Kopfzeilen / Zugang in URL | `grep -E "Bearer [A-Za-z0-9_.-]{15,}\|X-CAP-API-KEY…\|APCA-API-…\|X-SECURITY-TOKEN…\|CST…\|https?://user:pass@"` | nichts |
| Hoch-entropische Zeichenketten 16–48 Zeichen (Groß+Klein+Ziffer) in Quelltext-Diffs | grep -P mit Lookaheads | 49 Treffer, alle deutsche Bezeichner oder Testwerte (`ZZTESTGEHEIM…`, `ZZTESTKENNUNG…` in `probe-alpaca-balken.js`), `V2EnhancedOrganizations` (GDELT-Feldname) |
| JSON-Historie (ohne `package-lock`) auf Token/Konto-Felder/Pfade | `git log --all -p -- '*.json'` + awk | `"APCA"` = Tickersymbol; nur Windows-Pfade (→ F4) |
| Jemals hinzugefügte verdächtige Dateinamen (`.env`, `*.pem/.key/.p12/.pfx`, `id_rsa`, `telemetrie.json`, `settings.json`, `depot.json`, `fehlermeldungen.json`, `*.bak`, `store/`, `*config*.json`, Konto/Auszug) | `git log --all --name-only --diff-filter=A \| grep -iE …` | nur `auszug.js` (Code), `studien/momentum-korb-kleinst-2026-10-04/diagnose.json` (Studienzähler, keine Nutzerdaten) |
| Gelöschte Dateien | `git log --all --diff-filter=D --name-only` (167 Pfade) | Release-Notizen, Studien, `ollama.js`, `pw-smoke.js` – keine Geheimnis-Dateien |
| Store-/Fehlermeldungs-Dumps, Installations-Kennungen | `grep -P "inst-[a-z0-9]{10,}"`, `git log --all -S'"fehlerprotokoll"' -- '*.json'` | nichts |
| Kontonummern, Kontonamen, `identifier` mit Wert | grep über hinzugefügte Zeilen | nichts; erwähnte Guthaben sind Bigdata.com-Verbrauchseinheiten bzw. virtuelles Demo-Geld |
| Commit-Nachrichten und Tag-Metadaten | `git log --all --format='%h %B' \| grep -E 'ghp_\|github_pat_\|PK…\|Bearer\|password='` | nur Platzhalter-Erwähnung |
| CI-Workflow-Historie | `git log --all -p -- .github \| grep -iE 'token\|secret\|password\|key'` | nur `${{ secrets.* }}`-Bezüge, keine Literale |
| Stashes / weitere Refs | `git stash list`, `git for-each-ref` | keine |
| Lokale `telemetrie.json` im Baum | `ls telemetrie.json` | nicht vorhanden; `.gitignore` greift |
| Schlüssel in URLs/Query-Strings | Durchsicht `alpaca.js`, `capital.js`, `main.js:1599-1770` | nur Kopfzeilen |
| Werkzeug-Token (`radar-hochladen.js`, `release.js`) | Durchsicht | aus `git credential fill`, nicht ausgegeben |

Grenzen: Inhalte der GitHub-Issues (bereits gesendete Diagnosen/Fehlermeldungen) und der Release-Assets wurden mangels Netz nicht geprüft; ebenso nicht der tatsächliche Zuschnitt des aktiven Sende-Tokens.
