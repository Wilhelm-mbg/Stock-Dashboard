# Abschnitts-Läufer für test-v6.js, Laufzeiten, Werkzeug-Mängel (Zweig `werkzeug/testlaeufer`, 05.10.2026)

## Kurzfassung

- **Neu:** `node test-v6.js --abschnitt <Nummer|Text|Bereich|lfd:n>` und `--nur-geaendert` (dazu `--liste`, `--zeiten`, `--trocken`, `--gegen <ref>`), umgesetzt in `tools/testlaeufer.js`. Ohne Schalter läuft test-v6.js wie bisher; der Läufer wird dann nicht geladen.
- **Laufzeit vorher:** voller Lauf **45,0 s** (Median aus 3, abwechselnd gemessen; der Rechner war mit anderen Sitzungen belegt).
- **Laufzeit nachher:** ein Abschnitt allein **0,9 s** (`--abschnitt 16`), `--abschnitt 72` 0,8 s. `--nur-geaendert` für die Werkzeug-Änderungen dieses Zweigs dauert **3,0 s** (6 von 132 Abschnitten, 221 Prüfungen). Der volle Lauf dauert 45,5 s, mit 67 neuen Prüfungen.
- **Allein-Läufe:** Jeder der 132 Abschnitte läuft allein grün, im Median in 0,8 s; 124 davon brauchen unter 2 s.
- **Gegenprobe:** Der volle Lauf ist gleich geblieben. Vorher und nachher sind es je 5.440 sichtbare Haken, dieselben Zeilen in derselben Reihenfolge, bis auf Rauschen, das an zwei Läufen des alten Stands gemessen wurde. Der Endstand hat 5.507 Haken (5.440 + 67 neue). Ohne die 71 neuen Zeilen ist seine Ausgabe gleich der alten.
- **Fünf teuerste Abschnitte** (Rechenzeit am Stück, von 42 s): 35) Spannen-Studie 16,4 s · 44) Messmaschine 9,9 s · 34) Momentum 3,5 s · 69) Sammler verhungert nicht 3,4 s nach der Sync-Phase · 98) Live gleich Messung 2,3 s.
- **Vorschläge dazu:** zwei Kindprozesse nicht mehr synchron abwarten (gemessen 51 → 31 s), dazu zwei Datumsschleifen merken (gemessen −1,5 s und −1,0 s), alle mit derselben Prüfung. Zusammen geschätzt ~45–49 s → ~27 s. Umgesetzt ist davon nichts.
- **Werkzeug-Mängel:** `tools/ui-struktur.js` sammelt jetzt h4. `tools/ui-aufnahmen.js` kennt `--volltext`, und die Zählung „Klappen zu“ hängt nicht mehr an `offsetParent`. Dazu kommt Abschnitt 102 mit 18 Prüfungen. Die eslint-Warnung ist weg (0 Fehler, 0 Warnungen). Die Schein-Position im Kunstdepot ist bewusst nicht gemacht.
- **Fund:** 11 Prüfungen laufen in jedem vollen Lauf, ihre Zeile erscheint aber nie: `studien/alpaca-vollsammlung-2026-09/probe-massnahmen.js:147` schluckt stdout. Ausgeführt werden 5.451, sichtbar sind 5.440. Das ist nicht behoben, weil es die Ausgabe ändern würde (siehe §5).
- **Prüfungen:** `npx eslint .` ergibt 0/0, `node test-channel.js` ist grün, `node test-v6.js` ist grün mit 5.507 Haken. Commits: d82d7fc, e36a21c, 569a2ab und dieser Bericht.

---

## 1. Der Abschnitts-Läufer

**Aufruf** (aus der Repo-Wurzel; die Hilfe steht im Kopf von `tools/testlaeufer.js`):

| Schalter | Wirkung |
|---|---|
| `--abschnitt 72` | alle Abschnitte mit der Nummer 72 (doppelte Nummern wie 44 laufen alle) |
| `--abschnitt 17b 44 Wachhund` / `17b,44` | mehrere Abschnitte; Text = Teil des Kopfes, Groß/klein und Umlaute egal |
| `--abschnitt 90-100` | Nummernbereich, 97b gehört dazu |
| `--abschnitt "44) Design"` / `lfd:57` | genau einer (laufende Nummer aus `--liste`) |
| `--nur-geaendert [--gegen <ref>]` | Abschnitte, deren Quelldateien sich gegenüber main geändert haben |
| `--liste` | Gliederung: laufende Nummer, Nummer, Zeilen, Kopf, erkannte Quelldateien |
| `--zeiten` | alles (oder die Auswahl), mit Laufzeit und Prüfzahl je Abschnitt am Ende |
| `--trocken` | nur zeigen, was laufen würde |

Ein Teil-Lauf endet mit der Zeile `Abschnitts-Lauf: N Pruefungen in k von 132 Abschnitten, f fehlgeschlagen, t s - KEIN voller Lauf; vor dem Push: npm test`. Die Rückgabewerte sind dieselben wie beim vollen Lauf: 0 heißt grün, 1 heißt rot oder abgestürzt. Dazu kommt 2 für einen Aufruffehler, etwa ein Muster ohne Treffer.

**Wie er arbeitet.**
- test-v6.js prüft in den ersten Zeilen, ob einer der Schalter da ist. Nur dann übergibt es an `tools/testlaeufer.js` in einem eigenen Prozess und endet sofort mit dessen Rückgabewert.
- Der Läufer liest die Datei mit espree, das mit eslint kommt. Er gliedert sie in einen Vorspann (bis Zeile 41), 132 Abschnitte und den Schluss (`Promise.all(offeneProben)`).
  - Ein Abschnitt beginnt an einem obersten `console.log('<Kopf>')` oder an einer obersten IIFE, deren erste Anweisung ein solcher Kopf ist.
  - IIFEs ohne eigenen Kopf gehören zum Abschnitt davor.
- Nicht gewählte Abschnitte werden durch ihre Zeilenumbrüche ersetzt. Ausgeführt wird per `vm` mit `__filename`, `__dirname` und `require` von test-v6.js. Die Zeilennummern bleiben dabei gleich, sodass ein Stapel auf die echte Zeile zeigt (Abschnitt 101 prüft das).
- **Abhängigkeiten:** Sechs frühe Abschnitte benutzen oberste Variablen anderer Abschnitte, z. B. `t0` aus Abschnitt 1 in 3, 3b und dem Abschnitt „38) Audit“ oder `barsO` aus 3 in 4–6.
  - eslint-scope findet diese Bezüge. Der Läufer nimmt den liefernden Abschnitt mit und nennt ihn im Kopf des Laufs („mitgenommen“).
- **`--nur-geaendert`** wählt Abschnitte nach drei Wegen aus:
  - Geänderte Dateien sind `git diff --name-only <Abzweig von main>` plus ungetrackte Dateien. Auf main selbst ist die Basis `origin/main`.
  - Ein Abschnitt ist betroffen, wenn er eine dieser Dateien nennt: als Zeichenkette (`__dirname + '/depot.js'`), im Fließtext oder als Regex-Literal. Dazu zählt auch eine Datei, die eine genannte per `require()` nachlädt, und eine, die der Vorspann für eine benutzte Variable lädt (`Q` → quant.js).
  - In test-v6.js selbst zählen die geänderten Zeilen. Sind Vorspann oder Schluss geändert, laufen alle Abschnitte. Dateien, die kein Abschnitt nennt, werden ausdrücklich gelistet.
  - Größenordnung je geänderter Datei: quant.js 53 Abschnitte, depot.js 54, index.html 58, kerzenquelle.js 33, momentum.js 9, mfhandel.js 7, tools/release.js 4 (von 132).
- **Grenze:** Zustand, den ein Abschnitt zur Laufzeit hinterlässt (Dateien, Modulzustand), sieht der Läufer nicht. Deshalb ist jeder Abschnitt einmal allein gefahren worden (§2). Ein Teil-Lauf ersetzt den vollen Lauf vor dem Push nicht, und er sagt das auch.
- `tools/testvergleich.js` vergleicht zwei volle Läufe (§2). Er ist für den nächsten Umbau gedacht, der an keiner Prüfung etwas ändern soll.

## 2. Gegenprobe: der volle Lauf ist unverändert

- **Verfahren:** `node tools/testvergleich.js vorher-1.txt nachher.txt --rauschen vorher-2.txt`.
  - Zwei Läufe desselben Stands sind nicht zeichengleich: Zufallsordner aus `mkdtemp`, angehängte Messwerte (ms, PID, Zufallszahlen) und die Reihenfolge asynchroner Zeilen am Ende wechseln.
  - Als Rauschen gilt nur, was schon zwischen zwei Läufen des alten Stands wechselte. Das sind 11 Anhänge (z. B. „Mutation trifft scalpSL viel oefter als period [203 vs 41]“, „87.3 … Prozessnummer“) und die Reihenfolge ab Zeile 5.676.
  - Alles davor wird streng in Reihenfolge verglichen, der Rest als Menge der Zeilen.
- **Nach dem Läufer-Commit d82d7fc:** gleich. 5.798 = 5.798 Zeilen, 5.440 = 5.440 Haken, kein ❌, keine Zeile nur vorher oder nur nachher.
- **Endstand 569a2ab:** 5.869 Zeilen und 5.507 Haken.
  - Nur vorher: 0 Zeilen. Nur nachher: 71 Zeilen, nämlich die Köpfe von 101/102, zwei Leerzeilen und 67 Prüfungen.
  - Ohne diese 71 Zeilen ist die Ausgabe auch in der Reihenfolge gleich der alten.
- **Allein-Läufe:** Alle 132 Abschnitte liefen je einzeln (`--zeiten --abschnitt lfd:N`), alle mit Rückgabewert 0 und „ALLE TESTS BESTANDEN“.
  - Die Prüfzahlen der Einzelläufe summieren sich auf **5.518**. Das ist genau die Zahl der `ok()`-Aufrufe im vollen Lauf.
  - Jede Prüfung gehört also genau einem Abschnitt und läuft mit, wenn er allein läuft. Asynchrone Prüfungen werden über AsyncLocalStorage dem Abschnitt zugerechnet, der sie angestoßen hat.
- **Gegenproben am Läufer** (Abschnitt 101, in Kindprozessen):
  - Eine rote Kunstprüfung ergibt 1.
  - Ein Absturz ergibt ≠ 0, und der Stapel zeigt die echte Zeile.
  - Eine asynchrone rote Prüfung wird abgewartet und ergibt 1.
  - Ein Muster ohne Treffer ergibt 2.
  - Ein von außen beendeter Lauf ist nie 0.
  - testvergleich bemerkt eine fehlende Prüfung, einen neuen Anhang und eine vertauschte Reihenfolge.
- **Die Zahl 5.441:** Im geteilten Arbeitsbaum liegen `telemetrie.json` und ein Build. Dort läuft eine Prüfung mehr, die hier nur einen Hinweis „ℹ … liegt hier nicht“ ausgibt. Im frischen Klon sind es 5.440.

## 3. Laufzeiten je Abschnitt

**Vorher/nachher.** Gemessen am 05.10. nacheinander und abwechselnd, mit je 23–25 node.exe anderer Sitzungen nebenher:

| Lauf | Läufe (ms) | Median | Prüfungen |
|---|---|---:|---:|
| voller Lauf vorher (61dca2c) | 45.612 / 44.957 / 43.831 | 45,0 s | 5.440 |
| voller Lauf nachher (569a2ab) | 45.525 / 45.062 / 45.631 | 45,5 s | 5.507 |
| `--abschnitt 16` | 873 / 824 / 871 | 0,9 s | 9 |
| `--abschnitt 72` | 915 / 836 / 837 | 0,8 s | 42 |
| `--nur-geaendert --gegen d82d7fc` (Werkzeug-Änderung: 66, 71, 72, 73, 101, 102) | 2.996 / 3.023 / 3.009 | 3,0 s | 221 |
| jeder Abschnitt einzeln (132 Läufe) | min 743, max 17.354 | 0,8 s | – |

Ein Teil-Lauf kostet ~0,7 s Grundlast für Prozessstart, Gliederung und Scope-Analyse plus die Laufzeit der gewählten Abschnitte. Lange dauern allein nur die Abschnitte aus der Rangliste unten.

**Messbedingungen.**
- Node 24.18, 16 logische Kerne, 23–32 node.exe anderer Sitzungen nebenher. Volle Läufe schwanken deshalb zwischen 41 und 52 s.
- Zwei unabhängige Messungen stimmen überein:
  - `node test-v6.js --zeiten` aus dem Läufer.
  - Ein eigenes Messgeschirr des Laufzeit-Agenten mit 3 Läufen, 3 CPU-Profilen und Mikromessungen.
- „sync“ ist Rechenzeit am Stück; währenddessen kann nichts anderes laufen, sie zählt also voll.
- Die Dauer einer asynchronen Zusage zählt nicht als Kosten. Sie enthält die ganze restliche Sync-Phase, in der sie gar nicht laufen kann. Gezählt wird statt dessen ihre Rechenzeit nach der Sync-Phase (aus dem Profil).

| Rang | Abschnitt (lfd im Läufer) | Kosten | Prüf. | Woran es liegt |
|---:|---|---:|---:|---|
| 1 | 35) Spannen-Studie (lfd 94) | 16,4–16,8 s | 157 | Kindprozess `tools/alpaca-balken-holen.js --pruefen` per `spawnSync`, 12–13 s über das echte Archiv auf E: |
| 2 | 44) Messmaschine, Scoreboard … (lfd 50) | 9,9–10,6 s | 245 | Kindprozess `studien/messmaschine/test-messmaschine.js` per `spawnSync`, 10–11 s; alle anderen 244 Prüfungen ~0,1 s |
| 3 | 34) Momentum: Live-Buch … (lfd 40) | 3,5–3,6 s | 26 | Stichtag-Suche mit `toISOString` über 1,5 Mio echte Tagesbalken (Z. ~3362) |
| 4 | 69) Sammler verhungert nicht (lfd 99) | 0,06 s + 3,4 s danach | 63 | 248 Runden mit ~2.000 kleinen Dateilesungen, laufen nach der Sync-Phase auf dem Hauptfaden |
| 5 | 98) Live gleich Messung (lfd 128) | 1,2–1,5 s + 0,8 s danach | 43 | `MH.nyZeit()` 107.165-mal für 300 verschiedene Tage (`st()`, Z. ~23829) |
| 6 | Trendfolge-Modus (lfd 25) | 1,8–2,1 s | 6 | `Q.backtestIntraday` in quant.js (Produktivcode) |
| 7 | Wachhund: steht das Kursarchiv still? (lfd 85) | 1,8–1,9 s | 51 | ~2.200 Lesungen kleiner Temp-Dateien |
| 8 | 89) Paket-QS (lfd 118) | 1,2–2,9 s | 32 | `execSync('npm ls …')` |

Die ersten fünf tragen ~75 % der Laufzeit. Neu dazu kommt Abschnitt 101 mit 0,9 s, vor allem Gliederung und Scope-Analyse von test-v6.js; seine Kindprozesse laufen asynchron nebenher.

**Vorschläge.** In keinem wird eine Prüfung entfernt, eine Toleranz gelockert oder ein Datensatz verkleinert. Umgesetzt ist keiner, das ist ein eigener Auftrag.

1. **35) und 44): die Kindprozesse asynchron starten.** `child_process.execFile` statt `spawnSync`, mit denselben Argumenten, demselben Arbeitsordner, Timeout und derselben Regex auf stdout. Die Prüfung steht im Rückruf und wird mit `probe()` registriert.
   - `!fehler` bei execFile ist dieselbe Bedingung wie `status === 0`.
   - Das `--pruefen`-Kind wertete den Exit-Status schon bisher nicht aus und tut es dann auch nicht.
   - Gemessen im Geschirr (beide Kinder vorgezogen, Ergebnis an die unveränderte Prüfung übergeben): **51,2 → 30,5 s**, dieselben 5.440 Prüfnamen, alle grün.
   - Das `--pruefen`-Kind wird danach zum Engpass (13–14 s) und sollte so früh wie möglich starten.
2. **34) Momentum: Stichtag als Zahl vergleichen.** `lo = Date.parse(tag + 'T00:00:00Z')`, dann `lo ≤ t < lo + 86400000` statt `toISOString().slice(0,10) === tag`.
   - Gemessen: Die Suche sinkt von 1.548 ms auf 4,5 ms, mit identischem Index in 189 von 189 Reihen.
   - Für jeden gültigen Stempel sind beide Bedingungen gleichwertig.
3. **69) Sammler: beide Szenarien in einen `worker_threads`-Worker.** Die Zusicherungen gehen per `postMessage` an den Hauptfaden, der `ok()` ruft. Es bleiben dieselben 124 + 124 Runden, nur der Faden wechselt.
   - Geschätzt −3,4 s, nicht gemessen.
   - Als Nebennutzen ist der modulweite Zustand von kerzenquelle.js dort isoliert.
4. **98) Live gleich Messung: `st(tag)` je Tag merken.** `nyZeit` ist eine reine Funktion des Tages.
   - Gemessen: 1.000 ms → 15 ms, alle 375 Kunstreihen JSON-gleich.
5. **Nicht lohnend:** Quelldateien einmal lesen und zwischenspeichern. depot.js und index.html werden je 78-mal gelesen, das kostet aber nur ~0,6 s je Lauf.
   - Größer sind ~5 s für Lesungen kleiner Temp-Dateien (0,6 ms je Datei, vermutlich Echtzeitscanner, nicht geprüft). Das ist eine Rechner-Einstellung und Wilhelms Entscheid.

**Geschätzte Wirkung von 1–4: ~49 s → ~26–28 s.** Davon sind 1, 2 und 4 gemessen.

**Vor 1 und 3 muss §5 behoben sein.** Wer Prüfungen in die Async-Phase verlegt, legt sie genau in das Fenster, in dem heute Zeilen verschwinden.

## 4. Werkzeug-Mängel (wiki/offene-auftraege.md, Bekannte Baustellen)

- **(a) `tools/ui-struktur.js`** sammelt `h2, h3, h4, details`.
  - h4 hat eine eigene Marke `◦`, die die Legende erklärt. Die Tiefe kommt wie bei h2/h3 aus den Klappen darüber, eine h4 im `<summary>` bleibt Titel der Klappe.
  - `wiki/aufnahmen/struktur.md` zeigt die h4 erst nach dem nächsten Lauf am Fenster.
- **(c) `tools/ui-aufnahmen.js --volltext`** legt je Block zusätzlich `text` ab, also den ganzen gezählten Text; beim Rest außerhalb der Blöcke ebenso.
  - Ohne Schalter bleibt `laufzeit.json` Zeichen für Zeichen gleich. Geprüft ist das an der abgelegten Datei mit 21.996 Zeichen.
  - Die Schalter stehen jetzt im Kopfkommentar.
- **(d) „Klappen zu“ ohne `offsetParent`:** Die Funktion `zugeklappt(n)` fragt `details.open`. Beide Zählungen (Blockmessung und Dauertext-Lauf) benutzen sie.
  - Beim nächsten `--messung` können die Zahlen im Durchgang „zu“ nur kleiner werden. Der Durchgang „offen“ ist unverändert, die Klinke F10 kann daran nicht rot werden.
- **(i) eslint-Warnung** „Unused eslint-disable directive“ in test-v6.js: Die Direktive ist durch einen gewöhnlichen Kommentar ersetzt, die Zeilenzahl ist gleich. `npx eslint .` ergibt 0 Fehler und 0 Warnungen.
- **Tests:** Abschnitt 102 mit 18 Prüfungen. Die Messcodes werden aus der Quelle geschnitten und gegen ein Kunst-DOM ohne Electron ausgeführt.
  - Gegenprobe gegen den alten Stand: 13 Prüfungen rot. Die 5 dort grünen (Invarianten) macht je ein gezielter Eingriff rot.
- **Nicht gemacht: (b) dauerhafte Schein-Position in `tools/kunstdepot.js`.** Sie ändert die Ausgangslage aller abgelegten Aufnahmen (Positionstabelle, Kacheln, `heute/*.png`), den von Klinke F10 (Abschnitt 73) gelesenen Block und die Bildlauf-Messung aus Abschnitt 71. Dafür braucht es einen eigenen Entscheid.

## 5. Fund: elf Prüfungen, die niemand sieht

- **Befund:** In jedem vollen Lauf ruft die Suite `ok()` **5.451**-mal auf, auf stdout stehen aber nur **5.440** Haken. Gefunden hat das der Zähler des Läufers; die Laufzeitmessung kam unabhängig davon zum selben Ergebnis.
- Die 11 fehlenden Zeilen sind asynchrone Prüfungen aus vier Abschnitten, z. B. „87.15 F4 Gegenprobe …“, „(a) Keine Adresse traegt eine Kennung“ und „Lader: bleibt es bei 429 …“.
- **Ursache:** `studien/alpaca-vollsammlung-2026-09/probe-massnahmen.js` Zeile 147 hängt `process.stdout.write = function (t) { gesammelt += t; return true; }` ein, ohne durchzureichen, und wartet dabei. Was andere asynchrone Abschnitte in diesem Fenster schreiben, verschwindet.
- `fails` zählt weiter. Ein Fehlschlag dort ergäbe also „1 TEST(S) FEHLGESCHLAGEN“ ohne ein sichtbares ❌.
- Es ist dieselbe Falle, die test-v6.js für `probe.js` schon prüft (Abschnitt 64, „Der stdout-Haken des Leck-Tests reicht durch“).
- **Vorschlag:** Wie in probe.js durchreichen (`gesammelt += String(t); return echtesSchreiben(t);`), dazu dieselbe Klinke für probe-massnahmen.js. Danach sind 11 Zeilen mehr sichtbar.
- Das ist bewusst nicht in diesem Zweig, weil der Auftrag einen unveränderten vollen Lauf verlangt.

## 6. Offen und Hinweise

- **Wiki (PM):** In `wiki/offene-auftraege.md` sind aus „Bekannte Baustellen“ erledigt:
  - der Abschnitts-Läufer,
  - (a), (c) und (i),
  - der offsetParent-Teil der QS-Werkzeugbefunde,
  - die eslint-Zeile 47.
  - Offen bleiben (b) und der Fund aus §5.
- **CLAUDE.md** nennt test-v6.js als „über 1500 Zusicherungen“ und kennt den Läufer nicht. Ein Satz wie „Zwischendurch `node test-v6.js --nur-geaendert`; vor dem Push immer `npm test`“ würde den Läufer in jeder Sitzung nutzbar machen. Das ist nicht geändert, weil der Auftrag auf Tests und tools/ begrenzt war.
- **Einmal am Fenster:** `ui-struktur.js` und `ui-aufnahmen.js --kunstdaten --messung` fahren, damit `struktur.md` die h4 zeigt und `laufzeit.json` die korrigierte Zählung „zu“ trägt.
- **Abhängigkeit des Läufers:** espree, eslint-scope und eslint-visitor-keys kommen mit eslint, also aus den devDependencies und nicht direkt. Fehlen sie, bricht ein Teil-Lauf mit klarer Meldung ab (Rückgabewert 2). Der volle Lauf hängt nicht daran.

## 7. Commits auf `werkzeug/testlaeufer` (abgezweigt von main 61dca2c)

| Commit | Inhalt |
|---|---|
| d82d7fc | Läufer (`tools/testlaeufer.js`), Haken in test-v6.js, `tools/testvergleich.js`, eslint-Warnung |
| e36a21c | Werkzeug-Mängel (a), (c), (d) in `tools/ui-struktur.js` und `tools/ui-aufnahmen.js` |
| 569a2ab | Abschnitt 101 (49 Prüfungen, Läufer) und 102 (18 Prüfungen, Werkzeuge); Läufer: asynchrone Zurechnung, Basis auf main |
| (dieser) | dieser Bericht |

App-Code ist nicht geändert: keine Datei in der Wurzel außer test-v6.js, nichts unter `markt/`, kein index.html, kein package.json.
