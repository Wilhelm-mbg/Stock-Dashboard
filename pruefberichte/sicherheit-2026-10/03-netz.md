# 03 – Netz (Sicherheits-Durchsicht 2026-10)

Zweig `pruefung/sicherheit-2026-10`, Stand des Quelltexts am 04.10.2026. Ich habe nur gelesen;
zu keinem der genannten Hosts wurde eine Verbindung aufgebaut. Zwei Verhaltensbelege (N1, N2)
stammen aus lokalen Nachbauten gegen `127.0.0.1` (Skripte im Abschnitt „Nachweise“). App-Code
ist unverändert.

## Kurzfassung

1. **mittel – N1** Drei Yahoo/GitHub-Abrufe im Hauptprozess (`main.js:104`, `:210`, `:505`) brechen große Antworten mit `req.destroy()` ab, ohne das Promise aufzulösen. Der Aufruf hängt dann für immer. Das trifft unter anderem den Kursabruf `yahoo-quotes` mit 400 Kürzeln je Anfrage und vollen Quote-Objekten. Lokal nachgewiesen.
2. **niedrig – N2** `brokerFetch` (`main.js:1129–1137`) prüft den Host in der URL, übernimmt aber die Kopfzeilen des Renderers ungeprüft, `Host` eingeschlossen. Node leitet daraus SNI und Host-Kopf ab. Die Regel „nur Demo/Paper“ hält deshalb nur auf IP-Ebene. Lokal nachgewiesen. Ausnutzbar wäre das nur mit einem übernommenen Renderer und nur, wenn Live- und Demo-Host dasselbe Frontend teilen.
3. **niedrig – N3** `tools/massive.js:62–69,112`: Die nächste Seite kommt als `next_url` aus der Antwort. Der Bearer-Schlüssel geht an den Host, den diese Antwort nennt; der Host wird nicht geprüft.
4. **niedrig – N4** Mehrere Abrufe haben keine Größengrenze: `earnings-kalender` (`main.js:2287`), `secJson` (`main.js:874`, mit gzip ohne Deckel), `kerzenquelle.js:256` und `tools/massive.js`. Ihre Timeouts messen Leerlauf, keine Gesamtdauer.
5. **niedrig – N5** Die Werkzeuge `tools/alpaca-*.js` benutzen das globale `fetch`. Es folgt Weiterleitungen auch auf andere Hosts und schickt dabei die Kopfzeilen `APCA-API-*` mit. Ein `Retry-After` ohne Obergrenze kann den Lauf beliebig lange anhalten.
6. **niedrig – N6** `bugs.js:248–253`: Ob eine Fehlermeldung schon angekommen ist, entscheidet ein Textvergleich mit den Texten öffentlicher Issues. Wer ein Issue mit passender ID anlegt, unterdrückt damit den Nachversand.
7. **niedrig – N7** Die GDELT-Studien (`studien/…/gkg-*.js`) laden über `http://`. Betroffen ist nur die Datenintegrität der Studien, nicht die App.
8. **Positiv:** In App-Code, Werkzeugen und Studien kommt kein `rejectUnauthorized:false` vor, kein `NODE_TLS_REJECT_UNAUTHORIZED` und kein `certificate-error`- oder `setCertificateVerifyProc`-Handler. Die App selbst spricht kein `http://` und kein `ws://`. `eval`, `new Function` und `vm` gibt es nicht. Capital.com und Alpaca sind fest auf die Demo- bzw. Paper-Hosts gelegt, und keine Einstellung und keine Umgebungsvariable schaltet auf live. Schlüssel stehen nie in Query-Strings.

---

## 1. Host-Tabelle (App, `tools/`, Studien am Rande)

Ermittelt mit `grep -rnoE "(https?|wss?)://[^'\"\` )]+" --include=*.js --include=*.html . --exclude-dir=node_modules`.
Zusätzlich habe ich alle Stellen mit `https.get`, `https.request`, `fetch(` und `hostname:` von Hand nachverfolgt.

### 1a. Im ausgelieferten Paket (Wurzel-`*.js`, `markt/`, `index.html`)

| Host | Zweck | Datei:Zeile | Protokoll | Auth mitgeschickt? |
|---|---|---|---|---|
| `demo-api-capital.backend-capital.com` | Capital.com **Demo**: Sitzung, Konto, Orders | `capital.js:5,33,60,68`, `app-shell.js:1449–1465`; Weg `cap-fetch` → `main.js:1125,1154,1157` | https | ja: `X-CAP-API-KEY`, nach dem Login `CST`/`X-SECURITY-TOKEN`; Login-Körper `identifier`/`password` |
| `paper-api.alpaca.markets` | Alpaca **Paper**: Konto, Uhr, Orders, Kalender | `alpaca.js:22`, `app-shell.js:1498–1512`, `main.js:1664`; Weg `alp-fetch` → `main.js:1128,1155,1158` | https | ja: `APCA-API-KEY-ID`/`APCA-API-SECRET-KEY` (Kopfzeilen) |
| `data.alpaca.markets` | 1-Minuten-Balken (Live-Sammler), Daten | `alpaca.js:23`, `livesammler.js:45,352–358` → `main.js:1755–1762` | https | ja: dieselben Alpaca-Kopfzeilen (derselbe Anbieter, also sachlich nötig) |
| `query1.finance.yahoo.com` | Chart, Suche, Screener, Ergebniskalender (POST) | `main.js:133,2276`, `kerzenquelle.js:312`, `bestand.js:97`, `renderer.js:851` | https | Cookie und Crumb (Yahoo-Sitzung, kein Benutzergeheimnis) |
| `query2.finance.yahoo.com` | Crumb, `/v7/finance/quote`, quoteSummary | `main.js:95,201,944` | https | Cookie und Crumb |
| `fc.yahoo.com` | nur das Sitzungs-Cookie | `main.js:88` | https | nein |
| `feeds.finance.yahoo.com` | RSS-Schlagzeilen je Wert | `depot.js:1793` (über `fetch-text`) | https | nein |
| `news.google.com` | RSS-Nachrichten | `renderer.js:43,44,1317` (über `fetch-text`) | https | nein |
| `api.github.com` | (a) Issues lesen (Abgleich/Update) über `fetch-text`; (b) Diagnose-Issue anlegen | (a) `bugs.js:248`; (b) `main.js:490–497` | https | (a) nein; (b) ja: `Authorization: Bearer <Telemetrie-Token>` (Token im Build, siehe Bericht 01) |
| `raw.githubusercontent.com` | Radar/Insider-Ablage (Zweig `radar`), nur Anzeige | `main.js:538,542,549` | https | nein |
| `data.sec.gov`, `www.sec.gov` | Stammdaten (Stückzahlen, Branchen) | `stammdaten.js:82–85`, `main.js:858–884` (Host-Prüfung `:864`) | https | nein (nur User-Agent mit Kontakt) |
| `api.onvista.de` | Optionsschein-Suche (WKN) | `wkn.js:36` (über `fetch-text`) | https | nein |
| GitHub Releases (`github.com`, `objects.githubusercontent.com`) | Auto-Update über electron-updater | `main.js:2501`, `package.json:57–63` | https | nein (öffentliches Repo); Integrität siehe Bericht 04 |
| `github.com` | Issue-Seite im Browser öffnen (`shell.openExternal`) | `bugs.js:204`, `main.js:1110–1118` | https | nein |
| `www.finanzen.net`, `www.onvista.de` | nur Links zum Anklicken, kein Abruf | `depot.js:1069–1070` | https | nein |

Die Wege, über die der Renderer ins Netz kommt:
- `fetch-text` (`main.js:35–65`): nur GET, nur `https:`, Host-Liste `main.js:20–33`. Weiterleitungen werden bis zu dreimal verfolgt. Jede Stufe läuft erneut durch dieselbe Host-Prüfung, weil der Aufruf rekursiv über `fetchText` geht. Grenze 8 MB, 15 s Leerlauf-Timeout. Keine Auth.
- `cap-fetch` und `alp-fetch` (`main.js:1129–1158`): Methode, URL, Kopfzeilen und Körper bestimmt der Renderer, geprüft werden nur Protokoll und Host (siehe N2). Weiterleitungen werden nicht verfolgt, weil Node `https.request` das nicht tut. Grenze 8 MB, 20 s.
- `earnings-fetch`, `earnings-kalender`, `yahoo-quotes`, `markt-sec-*`, `read-spekulationen` und `read-insider`: Ziel-URL fest im Hauptprozess, vom Renderer kommen nur Kürzel. Diese Kürzel werden bereinigt (`main.js:131,926`).

### 1b. Nur Werkzeuge (`tools/`, nicht im Paket, `package.json:23–31`)

| Host | Zweck | Datei:Zeile | Protokoll | Auth? |
|---|---|---|---|---|
| `data.alpaca.markets` (v1/v2), `paper-api.alpaca.markets` | Vollsammlung, Balken, Splitfaktoren | `tools/alpaca-vollsammlung.js:69–71,169`, `tools/alpaca-balken-holen.js:61–62,117`, `tools/alpaca-abspaltungsfaktor.js:85,151` | https (globales `fetch`) | ja, `APCA-API-*` |
| `api.massive.com` (oder **Host aus `next_url`**) | Massive-REST (Basis-Stufe) | `tools/massive.js:24,62–70,112` | https | ja, `Authorization: Bearer` |
| `api.github.com` | Radar hochladen | `tools/radar-hochladen.js:43,59,64` | https | ja, `token` aus `git credential fill` |
| `www.sec.gov` | EDGAR, Form 4, 13F | `tools/edgar.js:24,53,69`, `tools/insider-holen.js:115`, `tools/beteiligungen-holen.js:73` | https | nein |
| Yahoo (`query1/2`) | Archiv nachladen, Split-Prüfung | `tools/archiv-fremdreihe-nachladen.js:99`, `tools/split-verzug-pruefen.js:72`, `tools/abmeldungen-pflegen.js:43` | https | nein |

### 1c. Studien (am Rande)
`data.sec.gov`, `efts.sec.gov`, `www.sec.gov`, `data.alpaca.markets`, `paper-api.alpaca.markets`, `query1.finance.yahoo.com` über https; **`data.gdeltproject.org` über `http://`** (N7).

---

## 2. Geprüfte Punkte ohne Befund

| Prüfung | Ergebnis | Beleg |
|---|---|---|
| `http://` / `ws://` / `wss://` in App und Werkzeugen | keine Treffer (nur Studien, N7) | `grep -rnE "http://\|ws://\|wss://" --include=*.js --exclude-dir=node_modules --exclude-dir=studien .` |
| `rejectUnauthorized`, `NODE_TLS_REJECT_UNAUTHORIZED`, `setCertificateVerifyProc`, `certificate-error`, `ignore-certificate`, eigene `https.Agent` | keine Treffer, auch nicht in `studien/` | `grep -rnE "rejectUnauthorized\|NODE_TLS\|setCertificateVerifyProc\|certificate-error\|new https?\.Agent" --include=*.js --exclude-dir=node_modules .` |
| Capital.com live (`api-capital.backend-capital.com`) | kommt nirgends vor. `CAP_HOSTS` enthält nur Demo (`main.js:1125`), und kein Schalter ändert `BASE` (`capital.js:5`, `app-shell.js:1449` als Konstante) | `grep -rn "api-capital.backend" --include=*.js . \| grep -v demo-api` → leer |
| Alpaca live (`api.alpaca.markets`) | kommt nur im Kommentar `main.js:1126` vor. `ALP_HOSTS` = Paper + Daten (`main.js:1128`), `test-v6.js:12538` sichert die Zeile ab | wie oben |
| Umgebungsvariablen, die Hosts umschalten | keine. `process.env` in den Netzdateien betrifft nur `MD_LIVE_KUNST` (nur ungepackt, `main.js:1712`) und `MD_DATEN` (Datenordner, `kerzenquelle.js:87`) | `grep -nE "process\.env\." main.js alpaca.js capital.js livesammler.js kerzenquelle.js` |
| Schlüssel in Query-Strings | keine. Alpaca, Capital, Massive und GitHub senden den Schlüssel immer als Kopfzeile. Der Yahoo-Crumb steht in der Query, ist aber kein Benutzergeheimnis | `grep -rnE "[?&](key\|token\|apikey\|secret)=" --include=*.js --exclude-dir=node_modules --exclude-dir=studien .` |
| Schlüssel an fremde Hosts (App) | nein. Alpaca-Schlüssel gehen nur über `alpFetch` an die Alpaca-Liste, Capital-Schlüssel nur über `capFetch`. Fehlertexte laufen durch `ohneGeheimnis` (`main.js:1610`) | — |
| Weiterleitungen mit Auth (App) | `fetch-text` folgt Weiterleitungen, schickt aber keine Auth und bleibt in der Host-Liste. Die Broker-Wege folgen keinen Weiterleitungen | `main.js:51–54`, `main.js:1139` |
| `eval` / `new Function` / `vm.runIn*` im App-Code | keine (nur ein Prüfbericht-Test benutzt `vm`) | `grep -rnE "eval\(\|new Function\|vm\.run" --include=*.js --exclude-dir=node_modules --exclude-dir=studien .` |
| `require()` mit dynamischem Pfad aus Antwortdaten | keiner. Dynamische `require` gibt es nur mit festem `path.join(__dirname/WURZEL, '<fest>')` in den Werkzeugen. `scoreboard.js:918` erzeugt Quelltext mit `STOCK_DASHBOARD_QUELLE` aus der lokalen Umgebung, nicht aus Netzdaten | — |
| Dateipfade aus Antwortinhalten | nein. Der Live-Sammler verwirft Kürzel, die nicht im Block stehen (`livesammler.js:376`, „fremd“), und Ordnernamen laufen durch `ordnerName` (`alpacaarchiv.js:80–86`). Für das Nachrichtenarchiv prüft `symOk` (`nachrichtenablage.js:52,140`) mit `^[A-Z0-9][A-Z0-9.\-]{0,15}$`, ohne `/` und ohne führenden Punkt | — |
| JSON.parse von Netzantworten ohne try/catch | in der App nur `main.js:1667` (`liveKalender`). Der Aufrufer `liveRunde` fängt das ab (`try` ab `main.js:1736`). Alle anderen Stellen haben try/catch | `grep -n "JSON.parse" main.js` |
| RSS-Antworten im DOM | maskiert (`renderer.js:1309` mit `U.esc` und `safeUrl`), dazu eine strenge CSP in `index.html:5`. Die Einzelheiten gehören zu Bericht 02 | — |

---

## 3. Funde

### N1 – Hängende Abrufe nach Abbruch großer Antworten (mittel)

- **Stellen:**
  - `main.js:210` `jsonGet` (benutzt von `yahoo-quotes` `main.js:944` und `holeAktuell`): `if (d.length > 2*1024*1024) req.destroy();`
  - `main.js:104` `holeSitz` (Crumb): `if (d.length > 4096) req2.destroy();`
  - `main.js:505` `diagnose-send`: `if (d.length > 1e6) req.destroy();`
- **Auslöser:** Die Antwort wird größer als die Grenze. `req.destroy()` ohne Fehlerargument löst weder `end` noch `error` aus, und `timeout` kommt auch nicht mehr. Das Promise bleibt für immer offen.
- **Möglicher Schaden:** Ein IPC-Aufruf kehrt nie zurück. Bei `yahoo-quotes` hieße das: der Reiter Markt bzw. die Marktkarte bekommt keine Kurse mehr und meldet keinen Fehler. Das ist genau die Form „still leer“, gegen die der Code sonst vorgeht. Wahrscheinlich ist der Fall nicht völlig: `QUOTE_BLOCK = 400` (`main.js:914`) fragt 400 Kürzel ohne `fields=` ab, die Antwort enthält also vollständige Quote-Objekte. Bei einigen KB je Wert liegt das in der Nähe von 2 MB. Gemessen habe ich das nicht, denn Netzabrufe waren ausgeschlossen. Auch eine Fehlerseite statt Crumb (über 4 KB) lässt `holeSitz` hängen, und alle Aufrufer warten mit.
- **Kleinster Nachweis:** lokaler Nachbau, siehe Abschnitt Nachweise (`destroy-probe.js`). Ausgabe mit Node 22: `ERGEBNIS: Promise nach 5 s NICHT aufgeloest (haengt)`.
- **Behebung:** Vor dem Abbruch auflösen, genau wie es `fetchText` (`main.js:57`) und `brokerFetch` (`main.js:1142`) schon tun, also `{ req.destroy(); resolve(null); }`, und bei `holeSitz` `resolve({cookie:null,crumb:null})`. Zusätzlich die Antwortgröße von `/v7/finance/quote` einmal protokollieren und über `fields=` die gebrauchten Felder anfordern. Als Test eignet sich ein lokaler Server mit einer Antwort über der Grenze; die Funktion muss dann innerhalb des Timeouts `null` liefern.

### N2 – Der Host-Kopf des Renderers umgeht die Host-Liste der Broker auf SNI- und HTTP-Ebene (niedrig)

- **Stelle:** `main.js:1129–1139`. Geprüft wird `u.hostname` gegen `CAP_HOSTS`/`ALP_HOSTS`, danach geht `h = Object.assign({}, headers)` unverändert an `https.request(u, { headers: h })`. Methode und Kopfzeilen kommen über `cap-fetch`/`alp-fetch` (`preload.js` `capFetch`/`alpFetch`) aus dem Renderer.
- **Auslöser:** Ein Renderer, etwa nach einer XSS, ruft `window.api.capFetch('GET', 'https://demo-api-capital.backend-capital.com/…', { Host: 'api-capital.backend-capital.com', … })` auf, bei Alpaca entsprechend mit `Host: api.alpaca.markets`. Node verbindet sich per TCP mit dem erlaubten Host, nimmt aber den **SNI-Namen und den Host-Kopf aus der Kopfzeile**. Auch die Zertifikatsprüfung läuft dann gegen diesen Namen.
- **Möglicher Schaden:** Teilen Demo- und Live-Host ein Frontend (CDN, Load Balancer), erreicht die Anfrage den Live-Dienst. Damit wäre die in CLAUDE.md verlangte Regel „nur demo-api-capital…“ verletzt. Praktisch bremsen das drei Dinge: Der Renderer müsste erst übernommen werden (CSP, Sandbox, siehe Bericht 02). Gespeichert sind nur Demo- bzw. Paper-Schlüssel, und die App sagt selbst, dass Live- und Demo-Schlüssel verschieden sind (`app-shell.js:1457,1505`). Ob die Frontends geteilt sind, habe ich nicht geprüft (keine Netzabfrage).
- **Kleinster Nachweis:** lokaler TLS-Nachbau (`host-probe.js`) mit URL-Host `localhost` und Kopfzeile `Host: api.alpaca.markets`. Ausgabe: `Server sah: SNI = api.alpaca.markets | Host-Kopf = api.alpaca.markets`.
- **Behebung:** In `brokerFetch` die Kopfzeilen auf eine Erlaubnisliste je Anbindung beschränken (Alpaca: `APCA-API-KEY-ID`, `APCA-API-SECRET-KEY`, `Accept`; Capital: `X-CAP-API-KEY`, `CST`, `X-SECURITY-TOKEN`, `Version`, `Accept`). Mindestens `host`, `connection`, `transfer-encoding` und `content-length` ohne Rücksicht auf Groß- und Kleinschreibung verwerfen. Dazu `servername: u.hostname` ausdrücklich setzen. Die Methode ebenfalls auf GET/POST/PUT/DELETE/PATCH begrenzen. Als Test: `brokerFetch` mit `{Host:'x'}` an einen lokalen Server, der den empfangenen Host-Kopf zurückgibt.

### N3 – Massive: Bearer-Schlüssel an einen Host, den die Antwort bestimmt (niedrig)

- **Stelle:** `tools/massive.js:62–70` (`roh` nimmt jede URL, die mit `http` beginnt, und setzt `host: u.host`) zusammen mit `:112` (`url = j.next_url`).
- **Auslöser:** Eine Antwort, die echt manipuliert ist oder von einem Zwischenglied umgeschrieben wurde, setzt `next_url` auf einen fremden Host.
- **Möglicher Schaden:** Der Massive-Schlüssel (`Authorization: Bearer`) geht an diesen Host. Das Protokoll bleibt https, weil immer das Modul `https` benutzt wird. Ein `next_url` mit `http://…` würde trotzdem per TLS an Port 443 des genannten Hosts gehen. Betroffen sind nur Werkzeuge, die von Hand gestartet werden; die App enthält `tools/` nicht.
- **Kleinster Nachweis:** Code lesen; `node -e` mit einem Ersatz für `https.get`, das `opts.host` protokolliert und `{results:[],next_url:'https://andere.example/x'}` liefert. Die zweite Anfrage geht dann an `andere.example` und trägt `Authorization`.
- **Behebung:** In `roh` vor dem Abruf `if (u.protocol !== 'https:' || u.hostname !== HOST) throw …`.

### N4 – Abrufe ohne Größengrenze und nur mit Leerlauf-Timeout (niedrig)

- **Stellen:** `main.js:2287–2289` (`earnings-kalender`: `roh += d` ohne Deckel), `main.js:874` (`secJson`: Teile ohne Deckel, gzip/deflate werden ohne Grenze entpackt), `kerzenquelle.js:256` (`hole`: ohne Deckel), `tools/massive.js:73`. Node-`timeout` bzw. `setTimeout` auf dem Request (`kerzenquelle.js:260`, `main.js:43ff.`) misst die Leerlaufzeit des Sockets, nicht die Gesamtdauer.
- **Auslöser:** sehr große oder tröpfelnde Antworten bzw. eine gzip-Bombe vom (vertrauenswürdigen) Host.
- **Möglicher Schaden:** Speicherdruck im Hauptprozess oder im Sammel-Kindprozess; Abrufe, die sehr lange offen bleiben. Bei SEC/Yahoo ist der Host vertrauenswürdig, der Anlass also gering. `companyfacts` ist schon regulär viele MB groß.
- **Kleinster Nachweis:** Code lesen; lokaler Server, der alle 10 s ein Byte schickt: `kerzenquelle.hole` löst nie aus.
- **Behebung:** Einen gemeinsamen Abruf-Helfer mit Bytegrenze (auch nach dem Entpacken, z. B. `zlib.createGunzip({ maxOutputLength })` bzw. Zählen im `data`-Handler) und einer Gesamtfrist (`AbortSignal.timeout` oder eigener Zeitgeber) einführen.

### N5 – Werkzeuge mit `fetch`: Weiterleitungen nehmen Alpaca-Kopfzeilen mit; `Retry-After` ohne Grenze (niedrig)

- **Stellen:** `tools/alpaca-vollsammlung.js:169,178`, `tools/alpaca-balken-holen.js:117,126`, `tools/alpaca-abspaltungsfaktor.js:151,158`.
- **Auslöser:** (a) `data.alpaca.markets` antwortet mit 30x auf einen anderen Host. Das globale `fetch` (undici) folgt standardmäßig. Bei einer Weiterleitung auf einen anderen Ursprung entfernt es nach dem Fetch-Standard nur `Authorization` und ähnliche Kopfzeilen, eigene Kopfzeilen wie `APCA-API-SECRET-KEY` bleiben. (b) `Retry-After: 999999999` wird ungeprüft mit 1000 multipliziert und abgewartet.
- **Möglicher Schaden:** (a) Paper-Schlüssel gehen an den Ziel-Host der Weiterleitung. (b) Der Lauf steht still. Betroffen sind nur Werkzeuge; dazu müsste der Anbieter selbst oder ein Zwischenglied fehlerhaft oder bösartig antworten.
- **Kleinster Nachweis:** Code lesen (kein `redirect:` im Options-Objekt).
- **Behebung:** `fetch(url, { redirect: 'error', … })` setzen und `Retry-After` begrenzen (z. B. `Math.min(warte, 120)`).

### N6 – Nachversand von Fehlermeldungen lässt sich über öffentliche Issues unterdrücken (niedrig)

- **Stelle:** `bugs.js:248–253`. Gelesen werden die letzten 100 Issues des öffentlichen Repos; enthält ein Issue-Text `| <id> |`, gilt die Meldung als angekommen. Die ID ist `'bug' + Date.now() + '-' + rand(1000)` (`main.js:354`).
- **Auslöser:** Ein Dritter legt Issues mit passenden Zeilen an, etwa mit einem Bereich von Zeitstempeln.
- **Möglicher Schaden:** Echte Fehlermeldungen von Anwendern werden lokal als „übermittelt“ markiert und nie gesendet. Der Schaden betrifft die Integrität der Rückmeldungen, nicht ihre Vertraulichkeit. Der Aufwand ist hoch und der Nutzen für einen Angreifer gering.
- **Behebung:** Nur Issues zählen, die vom Telemetrie-Konto oder vom Eigentümer stammen (`user.login` prüfen), oder eine zufällige ID mit 128 Bit verwenden.

### N7 – Studien laden GDELT über `http://` (niedrig)

- **Stellen:** `studien/gdelt-abdeckung-2026-09-19/gkg-zaehlen.js:83,158`, `studien/nachrichten-stimmung-tage-2026-09-19/datenbau/gkg-tage.js:321`.
- **Auslöser:** Jemand im Netzweg schaltet sich in die erste, unverschlüsselte Anfrage ein. Die Weiterleitung ist auf `data.gdeltproject.org` begrenzt, ein `http://`-Ziel ist aber erlaubt.
- **Möglicher Schaden:** Untergeschobene Studiendaten, also verfälschte Messergebnisse. Schlüssel werden nicht übertragen, und die App ist nicht betroffen.
- **Behebung:** Gleich `https://data.gdeltproject.org/…` anfragen; laut Kommentar leitet der Server ohnehin dorthin weiter. Die Weiterleitungs-Regel auf `^https://` einschränken.

### Hinweise (keine eigenen Funde, Verweis)
- **Integrität der Radar- und Insider-Ablage** (`main.js:538–557`): Gelesen wird ohne Signatur aus dem Zweig `radar`. Wer auf das Repo schreiben darf, bestimmt also, was angezeigt wird (nur Anzeige, Text maskiert). Das ist akzeptabel, solange es wirklich nur Anzeige bleibt.
- **Auto-Update ohne Code-Signatur:** Die Integrität hängt allein an HTTPS und am GitHub-Konto. Einzelheiten stehen in Bericht 04.
- **Telemetrie-Token im Paket:** Es geht nur an `api.github.com` und damit an den richtigen Host. Wie weit es reicht, steht in Bericht 01. Die Vorlage verlangt ausschließlich „Issues: read/write“.

---

## Nachweise (lokal, ohne Außenverbindung)

Die Skripte liegen im Scratchpad der Sitzung und sind nicht im Repo. Zum Nachstellen lassen sie sich wie folgt anlegen.

**destroy-probe.js (N1):**
```js
const http = require('http');
const srv = http.createServer((q, s) => { s.writeHead(200); const b = Buffer.alloc(65536, 120); let n = 0;
  const t = setInterval(() => { s.write(b); if (++n > 100) { clearInterval(t); s.end(); } }, 1); });
srv.listen(0, '127.0.0.1', () => {
  const p = new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:' + srv.address().port + '/', { timeout: 3000 }, (res) => {
      let d = ''; res.setEncoding('utf8');
      res.on('data', (c) => { d += c; if (d.length > 1024 * 1024) req.destroy(); });  // Muster main.js:210
      res.on('end', () => resolve('end'));
    });
    req.on('timeout', () => { req.destroy(); resolve('timeout'); });
    req.on('error', (e) => resolve('error ' + e.code));
  });
  const w = setTimeout(() => { console.log('haengt'); process.exit(0); }, 5000);
  p.then((x) => { console.log('aufgeloest', x); clearTimeout(w); process.exit(0); });
});
```
Ergebnis (Node v22.22.0): `haengt`.

**host-probe.js (N2):** Ein lokaler `https.createServer` mit selbstsigniertem Zertifikat gibt `req.socket.servername` und `req.headers.host` aus. Der Client ruft `https.request(new URL('https://localhost:<port>/v2/account'), { headers: { Host: 'api.alpaca.markets' }, rejectUnauthorized: false })` auf. Das `rejectUnauthorized:false` steht **nur** im Probeaufbau, wegen des selbstsignierten Zertifikats. Ergebnis: `SNI = api.alpaca.markets | Host-Kopf = api.alpaca.markets`.
