# Sicherheits-Durchsicht 2026-10 — Schwerpunkt 5: Handelspfade

Stand: 2026-10-04, Zweig `pruefung/sicherheit-2026-10`, Commit `61dca2c`. Nur gelesen, keine
Verbindung zu Alpaca oder Capital.com. Die Nachweise laufen lokal mit gemocktem `https`/`alpFetch`
bzw. gegen einen TLS-Server auf 127.0.0.1 (Skripte: Scratchpad `s5/t1-hosts.js`, `t2-sni.js`,
`t3-timeout.js`).

## Kurzfassung

1. **Kein Live-Pfad im heutigen Code.** Die Hosts sind fest codiert, und `main.js` lässt nur
   `paper-api`/`data.alpaca.markets` und `demo-api-capital…` durch. Getestet mit 6 Umgehungs-URLs,
   alle abgewiesen. Es gibt keinen Schalter, keine Umgebungsvariable und keine Einstellung für Live.
2. **Mittel – automatische Orders ohne Bestätigung je Order:** Nach dem Opt-in laufen Orders allein
   über Zeitgeber (60 s / 30 s). Auf Capital.com gibt es dafür keinen eigenen Aus-Schalter. Sie gehen
   nur aufs Papier- bzw. Demokonto, es entsteht also kein Geldschaden.
3. **Mittel – keine Idempotenz:** Keine `client_order_id` und kein Abgleich nach einem Timeout. Eine
   angenommene, aber unbeantwortete Order gilt als gescheitert (nachgewiesen). Die Übernacht-Runde
   wiederholt sie dann jede Minute, und es können verwaiste oder sogar Short-Positionen entstehen.
4. **Niedrig – der Host-Kopf geht ungeprüft durch:** Der Renderer kann über `alp-fetch`/`cap-fetch`
   einen eigenen `Host`-Kopf setzen. Node nimmt daraus auch den SNI-Namen (lokal nachgewiesen). Die
   Host-Liste schützt dann nur noch auf IP-Ebene. Ausnutzbar wäre das nur mit Code im Renderer und
   mit Live-Schlüsseln.
5. **Niedrig – verwaiste Demo- und Paper-Positionen:** Das entsteht bei einer fehlenden Bestätigung,
   beim Depot-Reset, bei einem Absturz zwischen POST und Speichern oder bei einem Wettlauf zwischen
   Öffnen und Schließen. Die Kostenrunde auf Capital öffnet **ohne Stop**.
6. **Niedrig – keine Obergrenze in der API-Schicht:** Die Menge bestimmt allein der Aufrufer.
   `Math.max(1, …)` kauft auch bei sehr teuren Werten 1 Stück.

## 1. Tabelle aller ordererzeugenden Pfade

| # | Pfad (Datei:Zeile) | Auslöser | Bestätigung | Konto | Grenzen / Menge |
|---|---|---|---|---|---|
| P1 | Intraday-Spiegel öffnen `depot.js:3419-3466` → `CapAPI.openPosition` (`capital.js:175`) | `setInterval` 30 s → `intradayScan()` (`depot.js:7670-7680`), außerdem sofort beim Einschalten (`depot.js:7380`) | Nein, nicht je Order. Opt-in: `capEnabled` (Standard aus, `app-shell.js:1346`) **und** `D.intraday.enabled` (Standard aus, `depot.js:38`) | Capital **Demo** | `sizeC = equity·budgetPct·5/spot` (`depot.js:3434`), keine feste Obergrenze. Tageslimit `maxPerDay`, Kill-Switch und `canOpen()` gelten für das Simulationsdepot (`depot.js:3162-3171`). SL/TP werden mitgegeben. Mit `kryptoHandeln` läuft das rund um die Uhr. |
| P2 | Intraday-Spiegel schließen `depot.js:2140-2152` → `CapAPI.closePosition` | jedes `closeTrade` (Stop, Ziel, Zeit, Tagesschluss) im Scan | Nein | Capital Demo | nur wenn `capDealId` vorhanden ist; kein zweiter Versuch |
| P3 | Kostenrunde von Hand `depot.js:6994-7037` → `kostenRundeMessen` (`kosten.js:391`) | Klick auf „Kostenrunde messen" | **Ja**, `window.confirm` (`depot.js:7024`) | Capital Demo oder Alpaca **Paper** | Capital etwa 200 $ (`kosten.js:438`), Alpaca `max(1, floor(200/mid))` Stück (`kosten.js:555`). Sperre `RUNDE_LAEUFT`. |
| P4 | Messautomat Capital `kosten.js:1212-1245` | `setInterval` 60 s (`depot.js:7710`) plus einmal nach 90 s beim Start | Nein. Opt-in nur über `capEnabled`. **Kein Aus-Schalter in der Oberfläche** (nur `D.kostenAutomat === false` im Store) | Capital Demo | 1 Runde je Handelstag (`heuteSchonGemessen`), etwa 200 $, Öffnen **ohne SL/TP** (`kosten.js:443`), bis zu 3 Versuche nur bei MARGIN (Größe wird halbiert). Endet, sobald `automatFertig()` erfüllt ist. |
| P5 | Messautomat Alpaca, Tagesrunde `kosten.js:1171-1201` | gleicher 60-s-Takt | Nein. Opt-in `alpEnabled` (Standard aus). Aus-Schalter „Automat Alpaca", Standard **an** (`kosten.js:1172`) | Alpaca Paper | 1 Runde je Handelstag, Kauf und Verkauf zum Markt, je 20 s Zeitlimit; bei Teilfüllung Storno und `DELETE /positions/{sym}` |
| P6 | Übernacht-Runde Alpaca `kosten.js:813-985` (Kauf `cls` 15:44–15:49 ET oder Markt 15:58; Verkauf `opg` 08:00–09:26 ET oder Markt ab 09:31; Storno; Glattstellen) | gleicher 60-s-Takt, Zustand liegt dauerhaft in `MESSUNG.uebernacht` und läuft nach einem Neustart weiter | Nein (wie P5) | Alpaca Paper | 1 offene Übernacht-Position; `max(1, floor(200/mid))` Stück (`kosten.js:836`) |
| P7 | Roh-IPC `alp-fetch` / `cap-fetch` (`main.js:1157-1158`, `preload.js:42-43`) | jeder Code im Renderer | Nein: beliebige Methode, beliebiger Pfad, beliebiger Kopf | nur die erlaubten Hosts (Paper, Demo) | keine |

Keine weiteren Stellen. `mfhandel.js`, `mfdepot.js`, `livesammler.js`, `sammelrunde.js`,
`sammelplan.js`, `vormarkt.js`, `liveablage.js`, `risiko.js` und `scheinwahl.js` rufen keine
Broker-Order auf. Die Alpaca-Aufrufe im Hauptprozess (`main.js:1664`, `main.js:1761`) und in
`tools/alpaca-*.js` sind ausschließlich `GET` (Kalender, Kerzen). Die drei übrigen `POST` in
`main.js` (136, 493, 2279) gehen an Yahoo bzw. GitHub. `studien/` wird von der App nicht geladen.

## 2. Live gegen Paper/Demo

- **Alpaca:** `alpaca.js:22` setzt fest `https://paper-api.alpaca.markets/v2`, `app-shell.js:1498`
  ebenso. Durchgesetzt wird das im Hauptprozess: `main.js:1128`
  `ALP_HOSTS = new Set(['paper-api.alpaca.markets', 'data.alpaca.markets'])`, geprüft in
  `brokerFetch` (`main.js:1133`) mit `https:` und exaktem Hostnamen. Es gibt keine Prüfung des
  Schlüssel-Präfixes (PK/AK) und keinen Kontotyp-Test. Das ist aber nicht nötig: Ein Live-Schlüssel
  scheitert am Paper-Host mit 401/403, und der Verbindungstest meldet das (`app-shell.js:1504`).
  Gespeichert wird trotzdem, auch ohne bestandenen Test. Danach scheitert jeder Aufruf. Das schadet
  nicht.
- **Capital.com:** `capital.js:5` und `app-shell.js:1449` setzen fest `demo-api-capital…`, und
  `main.js:1125` erlaubt nur diesen Host. Ein Konto wird nicht gewechselt (`PUT /session`); es gilt
  das Standardkonto der Demo-Sitzung.
- **Tests:** `test-v6.js:1510`, `12538` und `12571` halten die Host-Listen und die Paper-URLs fest.
- **Nachweis** (`t1-hosts.js`, `brokerFetch` wörtlich aus `main.js` geschnitten, `https` gemockt):

```
ABGEWIESEN alp https://api.alpaca.markets/v2/orders
ABGEWIESEN alp https://paper-api.alpaca.markets@api.alpaca.markets/v2/orders
ABGEWIESEN alp https://api.alpaca.markets/v2/orders#paper-api.alpaca.markets
ABGEWIESEN alp http://paper-api.alpaca.markets/v2/orders
ABGEWIESEN alp https://PAPER-API.alpaca.markets./v2/orders
ABGEWIESEN cap https://api-capital.backend-capital.com/api/v1/positions
DURCH      alp https://paper-api.alpaca.markets/v2/orders
```

  Weiterleitungen folgt `brokerFetch` nicht (es ist ein reines `https.request`). Ein 30x kann
  also nicht auf den Live-Host umleiten.

**Urteil:** Im gegenwärtigen Code gibt es keinen Pfad zu einem Live-Konto. Die einzige
Einschränkung steht in Fund F3.

## 3. Funde

### F1 — Automatische Orders ohne Bestätigung je Order; für Capital kein Aus-Schalter (mittel)

- **Wo:** `depot.js:3419-3466` (P1), `depot.js:7670-7680` (Takt), `kosten.js:1212-1245` (P4),
  `kosten.js:1171-1201` und `813-985` (P5/P6), `depot.js:7710` (Takt 60 s).
- **Auslöser:** Zeitgeber. Nach dem einmaligen Opt-in (Häkchen in den Einstellungen) gehen ohne
  weitere Nutzeraktion echte Orders an die Broker-API, auch direkt nach dem App-Start (90 s) und
  in der Übernacht-Runde vor der Börseneröffnung.
- **Zustimmungstext gegen Verhalten:** Das Capital-Häkchen (`index.html:2810`) nennt
  „Intraday-Signale … ausführen“. Der tägliche Messautomat (P4) öffnet aber zusätzlich und
  unabhängig von `D.intraday.enabled` eine Position **ohne Stop**. Einen eigenen Aus-Schalter gibt
  es dafür nicht, das Alpaca-Gegenstück hat einen (`index.html:2187`, `kostenAutomatAlpChk`). Der
  Automat Alpaca steht nach dem Opt-in standardmäßig auf an.
- **Möglicher Schaden:** Es geht nur um Papier- und Demogeld, ein Geldverlust ist nicht möglich.
  Nutzer finden aber Positionen auf ihrem Demo- bzw. Paper-Konto, die sie nicht selbst ausgelöst
  haben. Das ist ein Vertrauens- und Transparenzthema. Ob der Rahmen „Simulation“ trägt, hängt
  daran, dass Live technisch ausgeschlossen bleibt (siehe F3).
- **Kleinster Nachweis:** Codezitat `kosten.js:1216`
  `if (!D || D.kostenAutomat === false) return;`. In der Oberfläche setzt nichts dieses Feld
  (`grep kostenAutomat\b` findet nur `kosten.js:1136`, `kosten.js:1216` und einen Kommentar).
- **Behebung:** Einen eigenen Schalter „Automat Capital“ einführen, Standard aus. Der
  Häkchen-Text soll den Automaten ausdrücklich nennen. Die Automaten sollten nach dem Opt-in
  standardmäßig aus sein, oder es kommt eine einmalige Rückfrage beim ersten automatischen Lauf.
  In der Kostenrunde einen Schutz-Stop setzen.

### F2 — Keine Idempotenz: Timeout nach angenommener Order führt zu Doppelorders oder verwaisten Positionen (mittel)

- **Wo:** `alpaca.js:122-128` (`marktOrder`), `alpaca.js:233-243` (`auktionsOrder`),
  `capital.js:181-185`, `main.js:1139` (`timeout: 20000`, danach `status 0`).
- **Auslöser:** Ein Netz-Timeout oder ein Verbindungsabbruch, nachdem der Broker die Order schon
  angenommen hat. Kein Body enthält eine `client_order_id`, und es wird nicht nachgesehen
  (`GET /orders:by_client_order_id`, `GET /positions`).
- **Folgen je Pfad:**
  - P6 Verkauf `opg` (`kosten.js:919-927`): `!ov.ok` ohne `tifAbgelehnt` lässt den Zustand auf
    `gehalten`. Der nächste 60-s-Takt im Fenster 08:00–09:26 ET setzt erneut eine Verkaufsorder ab,
    und das bis zu rund 86-mal. Füllt die erste, „verlorene“ Order zur Eröffnung, steht der Zustand
    weiter auf `gehalten`. Am Folgetag geht eine weitere Verkaufsorder über `stueck` auf eine
    leere Position. Auf einem Paper-Margin-Konto ergibt das eine **Leerverkaufsposition**, obwohl
    `alpaca.js:210` zusagt, dass keine Leerverkäufe abgesetzt werden. Das ist plausibel aus dem Code
    abgeleitet; das Broker-Verhalten wurde nicht live geprüft.
  - P6 Kauf `cls` und P5: Ein Timeout gilt als „abgelehnt“. Die Position liegt dann unbemerkt auf
    dem Konto und wird nie verkauft.
  - P1 und P4 (Capital): `ok:false, msg 'HTTP 0'`. Die Demo-Position bleibt offen, bei P4 ohne
    Stop.
  - Absturz zwischen POST und `messungSchreiben()` (`kosten.js:826-862`): `uebernachtZuletzt` ist
    dann noch nicht gespeichert. Ein Neustart im selben Fenster 15:44–15:49 ET kauft ein zweites
    Mal.
- **Kleinster Nachweis** (`t3-timeout.js`, `alpaca.js` unverändert geladen, `alpFetch` gemockt;
  der Broker nimmt an, die Antwort geht verloren):

```
Ergebnis 1: {"ok":false,"msg":"HTTP 0 – Timeout"}
Ergebnis 2: {"ok":false,"msg":"HTTP 0 – Timeout","tifAbgelehnt":false}
  POST /orders {"symbol":"AAPL","qty":"1","side":"buy","type":"market","time_in_force":"day"}
  POST /orders {"symbol":"AAPL","qty":"1","side":"sell","type":"market","time_in_force":"opg"}
client_order_id gesetzt? false
Beim Broker tatsaechlich angenommene Orders: 2 - App haelt beide fuer gescheitert.
```

- **Behebung:** Jede Order bekommt eine deterministische `client_order_id`, zum Beispiel
  `md-<runde>-<seite>-<tag>`. Bei `status 0` oder 5xx wird vor jeder Wiederholung per
  `GET /v2/orders:by_client_order_id` nachgesehen. Vor einem Verkauf `opg` bzw. vor
  `closePosition` wird `AlpAPI.position(sym)` gegen `st.stueck` geprüft; ist die Position 0, wird
  die Runde verworfen statt verkauft. Bei Capital nach einem Timeout `GET /positions` nach Epic und
  Größe absuchen. Den Zustand **vor** dem POST als `phase: 'kauf-gesendet'` sichern.

### F3 — Ein vom Renderer gesetzter `Host`-Kopf umgeht die Host-Liste auf TLS- und HTTP-Ebene (niedrig)

- **Wo:** `main.js:1137` `const h = Object.assign({}, headers || {});`, dann
  `https.request(u, { headers: h })`. Die Kopfzeilen kommen ungefiltert aus dem IPC
  (`main.js:1157-1158`, `preload.js:42-43`).
- **Mechanik:** Die Host-Liste prüft nur `new URL(url).hostname`. Setzt der Aufrufer
  `Host: api.alpaca.markets`, baut Node die TCP-Verbindung zur IP des Paper-Hosts auf, schickt aber
  **SNI und Host-Kopf des Live-Hosts**. Node leitet den Servernamen in `calculateServerName` aus
  dem Host-Kopf ab. Beantworten Paper und Live dieselben Frontends (CDN oder Load Balancer mit
  `*.alpaca.markets`-Zertifikat) bzw. Demo und Live bei Capital, landet die Anfrage beim
  Live-Dienst. Ob die Broker so routen, wurde **nicht** geprüft (keine Netzverbindung erlaubt).
- **Kleinster Nachweis:**
  - `t1-hosts.js`:
    `an https.request: Ziel-Host=paper-api.alpaca.markets  Kopf Host=api.alpaca.markets`, ebenso
    für Capital.
  - `t2-sni.js` (Node-`https` gegen einen TLS-Server auf 127.0.0.1, URL-Host `localhost`,
    Kopf `Host: api.alpaca.markets`):
    `Server sieht SNI: api.alpaca.markets` / `Server sieht Host-Kopf: api.alpaca.markets | Methode POST /v2/orders`.
- **Voraussetzungen, darum niedrig:** (a) Code-Ausführung im Renderer. Das ist schwer, denn es
  gelten `contextIsolation`, `sandbox` und die CSP `script-src 'self'` (`main.js:2442-2444`,
  `index.html:5`). (b) Es müssen Live-Schlüssel gespeichert sein. Paper- und Demo-Schlüssel lehnt
  der Live-Dienst ab. (c) Die Broker müssen tatsächlich so routen. Die Host-Liste ist aber die
  **einzige** technische Barriere zum Live-Konto, und die App verspricht „Ein Live-Handel ist aus
  dieser App nicht möglich“ (`app-shell.js:872`).
- **Behebung:**
  - In `brokerFetch` nur eine Positivliste von Köpfen durchlassen: `APCA-API-KEY-ID`,
    `APCA-API-SECRET-KEY`, `X-CAP-API-KEY`, `CST`, `X-SECURITY-TOKEN`. `Host` und alle übrigen
    Köpfe verwerfen, `servername: u.hostname` ausdrücklich setzen.
  - Weiter gehend: die Roh-IPC (P7) durch fachliche IPC ersetzen (`alp-order(sym, side, qty, tif)`
    mit Methoden- und Pfad-Positivliste und Mengendeckel im Hauptprozess).
  - Einen Test in `test-v6.js` ergänzen, der einen `Host`-Kopf an `alpFetch` übergibt und prüft,
    dass er verworfen wird.

### F4 — Verwaiste Demo- und Paper-Positionen ohne Abgleich (niedrig)

- **Wo und Auslöser:**
  - `capital.js:203`: `ok:true, dealId:null`, wenn `GET /confirms` scheitert. In P1 schließt
    `closeTrade` dann nie (`depot.js:2140`). In P4 scheitert `closePosition(null)`
    (`kosten.js:462`), und die Position bleibt **ohne Stop** offen. Gemeldet wird beides,
    automatisch bereinigt wird nichts.
  - P1: Der Spiegel öffnet asynchron, `tr.capDealId` wird erst im `then` gesetzt
    (`depot.js:3450`). Schließt die Simulation vorher, wird nichts geschlossen. Dasselbe gilt für
    einen Absturz zwischen POST und `save()`.
  - P2: Schlägt `closePosition` fehl, gibt es keinen zweiten Versuch (`depot.js:2142-2150`).
  - Depot-Reset (`depot.js:7745-7754`): `D = defaultDepot()` verwirft offene Positionen mit
    `capDealId`, ohne sie beim Broker zu schließen.
  - Nirgends gibt es einen Start-Abgleich gegen `GET /positions` (Alpaca und Capital).
- **Möglicher Schaden:** Das Demo- oder Paper-Konto füllt sich mit Positionen, die niemand
  beaufsichtigt. Die Kostenmessung wird verzerrt (Margin-Ablehnungen). Geld ist nicht betroffen.
- **Nachweis:** Codezitate wie oben.
- **Behebung:** Beim Start und täglich `GET /positions` mit den bekannten Kennungen abgleichen und
  Fremdes anzeigen bzw. schließen lassen. Beim Reset die gespiegelten Positionen schließen oder
  nachfragen. Bei Capital nach einem fehlenden Confirm `dealReference` erneut abfragen.

### F5 — Keine Mengen- und Betragsgrenze in der API-Schicht (niedrig)

- **Wo:** `alpaca.js:213` (`Math.max(1, …)`, kein Deckel), `alpaca.js:234`, `capital.js:178`
  (`size` ungeprüft). Die Aufrufer begrenzen weich: `kosten.js:555/836` kauft mindestens 1 Stück,
  also auch bei sehr teuren Werten (ein Wert über 200 $ ergibt immer 1 Stück, ohne Obergrenze im
  Preis). `depot.js:3434` skaliert mit `budgetPct`, das in der Oberfläche einstellbar ist.
- **Schaden:** Gering, nur Papier- und Demogeld. Es fehlt aber eine letzte Verteidigungslinie
  falls P7 (Roh-IPC) oder ein Rechenfehler eine absurde Menge erzeugt.
- **Behebung:** Einen Deckel im Hauptprozess einziehen, etwa Gegenwert höchstens 1.000 $ je Order
  und höchstens N Orders je Tag. Wird er überschritten, wird abgewiesen und protokolliert.

## 4. Fehlerfälle im Überblick

| Fall | Verhalten heute | Bewertung |
|---|---|---|
| Teilfüllung (Alpaca) | Rest stornieren und `DELETE /positions/{sym}`, die Runde wird verworfen (`alpaca.js:134-142`). Scheitert das Glattstellen, kommt ein Hinweis „von Hand prüfen“. | gelöst, kein erneuter Kauf |
| Order nicht gefüllt nach 20 s | stornieren, nachlesen, bei Teilfüllung glattstellen | gelöst |
| Timeout beim POST | gilt als gescheitert, kein Abgleich, P6 wiederholt minütlich | **F2** |
| 401 bei Capital | einmal neu anmelden und den Aufruf wiederholen (`capital.js:63-72`). Unkritisch, denn ein 401 wurde nicht ausgeführt. | ok |
| Absturz mitten in der Runde | Tagesrunde: `gemessenAm` liegt nur im Speicher, `heuteSchonGemessen` zählt nur abgelegte Runden. Ein Neustart nach POST, aber vor dem Ablegen, misst am selben Tag erneut. Übernacht: siehe F2. | niedrig (in F2) |
| Parallele Runden | eine gemeinsame Sperre `RUNDE_LAEUFT` (`kosten.js:386-401`); `intradayScan` hat eine eigene Sperre mit 10-Minuten-Wächter | ok |
| MARGIN-Ablehnung (Capital, P4) | bis zu 3 Versuche mit halber Größe, nur bei MARGIN | ok, ein abgelehnter Versuch erzeugt keine Doppelorder |
