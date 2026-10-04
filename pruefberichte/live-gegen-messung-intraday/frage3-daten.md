# Frage 3 — Handelt das Intraday-Depot (rsi2seit) auf fehlenden oder veralteten Daten?

Pruefzweig `pruefung/live-gegen-messung-intraday`. Pruefer-Sitzung, kein App-Code geaendert.
Bewertung: **A** = falsches Geld / falsche Positionen, **B** = falsche Anzeige / Messung, **C** = Schoenheit.

Kleinsttests: `node pruefberichte/live-gegen-messung-intraday/frage3-daten.test.js`

Stand: alle 16 Kleinsttests laufen ohne Absturz durch (< 1 s), 11 zeigen eine Abweichung, 5 bestaetigen einen Schutz.

Pruefweg: `depot.js` laeuft echt in einer vm-Sandbox (mit den echten `quant.js`, `risiko.js`, `boerse.js`,
`archiv.js`, fuer F3-12 `capital.js`); ersetzt sind nur Uhr, Speicher, Kursabruf (Yahoo-Antwort aus
Kunstkerzen, zerlegt vom echten `kurse.js`) und Oberflaeche. `intradayScan` wird von aussen aufgerufen.
Zeilennummern: Stand des Pruefzweigs (HEAD f27317e, `depot.js` 7833 Zeilen, unveraendert gegen HEAD).

## Befunde

### F3-01 — A — Archiv leer oder unlesbar: offene Position ohne Not-Stopp und ohne Zeit-Ausstieg
- **Ort:** `depot.js:2864-2868` (`continue` bei `sigBars.length < 261`) steht VOR dem Positionsmanagement `depot.js:2880-2958`.
- **Pfad:** Der Abruf (`range=1mo`) liefert rund 150 Stundenkerzen; die Tiefe kommt nur aus dem Archiv
  (`depot.js:2840-2845`). Ist das Archiv leer (Neuinstallation mit uebernommenem Depot, defekte Archivdatei —
  `main.js:1290-1313` raeumt sie beiseite und liefert `null`), wird das Symbol mit "Kursreihe zu kurz"
  uebersprungen — **samt offener Position**: kein Not-Stopp, kein Zeit-Ausstieg, kein 2-Tage-Schutznetz.
  Das haelt an, bis das Archiv durch Scans wieder 261 Kerzen hat (bei 7 Kerzen je Tag rund 16 Handelstage).
  Nur der Kill-Switch greift noch. Die Begruendung an der Stelle ("Signal waere nicht das gemessene") gilt dem
  Einstieg, nicht dem Ausstieg.
- **Nebenpfad (b):** Wirft `api.storeGet` beim Archivlesen (IPC-Fehler), behaelt `lade()` das
  abgelehnte Versprechen im Cache (`archiv.js:304-312`), und `depot.js:2823` (`await window.Archiv.fuege`) steht ohne `try` — jeder
  folgende Scan bricht als Ganzes ab ("Scan-Fehler"), fuer **alle** Symbole, bis zum Neustart. In der Praxis selten
  (`main.js` faengt Lesefehler selbst ab), aber dann total.
- **Gegenprobe:** Archiv mit 490 Kerzen: Position wird geschlossen.
- **Kleinsttest:** `F3-01 Archiv leer/unlesbar: offene Position bekommt weder Not-Stopp noch Zeit-Ausstieg`

### F3-02 — kein Unterschied (Schutz greift) — Abruf scheitert bei offener Position
- **Ort:** `depot.js:2776-2791` (Sofort-Nachversuch, `exitBlind`, Monitorgrund), `depot.js:2833` (`if (!fd) continue`).
- **Pfad:** Ohne Kursantwort wird die Position weder bewertet noch geschlossen, aber gemeldet ("Kursquelle gestört –
  offene Position ohne frische Bewertung"; nach zwei Scans ohne jede Antwort Warnband). Kommt die Quelle zurueck,
  wird zum **frischen** Kurs geschlossen, nicht rueckwirkend. Folge fuer die Messung: die Haltedauer verlaengert sich um
  die Ausfallzeit (im Test "9 Handelskerzen" statt 8) — derselbe Effekt nach Ruhezustand/Neustart. Kein Archiv-Ersatz:
  scheitert der Abruf, rechnet der Scan auch nicht auf alten Archivkerzen weiter (das Archiv wird nur zusammen mit
  einer frischen Antwort benutzt). Einen Kurs-Cache gibt es im Ladepfad nicht (`kurse.js` `hole` → `main.js:35 fetchText`).
- **Kleinsttest:** `F3-02 Abruf scheitert bei offener Position: ...`

### F3-03 — A — Veraltete Reihe: Not-Stopp und Ausstieg zum alten Kurs, ohne Kennzeichnung
- **Ort:** `depot.js:2846` (`spot` = letzte Kerze der Antwort), Ausstiegsregeln `depot.js:2893-2920`; `risiko.js:35-44`
  (`barsFrisch` gilt ausdruecklich nur fuer Einstiege, `depot.js:3156`).
- **Pfad:** Liefert die Quelle eine Reihe, deren letzte Kerze 20 h alt ist (Handelsaussetzung, haengende Quelle,
  Capital-Ersatzweg), loest der Not-Stopp auf diesem Kurs aus und bucht ihn als Ausstiegskurs. Weder `why` noch der
  Monitor sagen, dass der Kurs alt ist. Ein Einstieg auf denselben Daten waere abgelehnt worden. Die Asymmetrie ist
  gewollt (lieber schliessen als blind halten) — es fehlt aber die Kennzeichnung, und der gebuchte Kurs war zu dieser
  Zeit nicht handelbar. Soll: frischer Kurs oder sichtbar "zum veralteten Kurs geschlossen".
- **Kleinsttest:** `F3-03 Veraltete Reihe: Not-Stopp/Ausstieg zum alten Kurs, ohne Kennzeichnung`

### F3-04 — A — Einstieg auf eine Signalkerze, die schon bis zu 120 min geschlossen ist
- **Ort:** `risiko.js:40-44` (`barsFrisch`: Alter ab **Kerzenbeginn**, Grenze 3 × 60 min), Aufruf `depot.js:3156`;
  `Q.fertigeBars` `quant.js:2740`.
- **Pfad:** Liefert die Quelle die Kerzen nach der Signalkerze nicht (Verzug), gilt die Signalkerze bis 180 min nach
  ihrem Beginn als frisch — also bis 120 min nach ihrem Schluss, obwohl die naechste Kerze laengst fertig sein muesste.
  Das Depot steigt dann ein, im Test zum Schlusskurs der Signalkerze (99,65), der zu dieser Uhrzeit nicht mehr
  handelbar ist (haengt ein Live-Kurs an, zu einem Kurs bis zu zwei Stunden nach dem Signal). Die Messung steigt zum
  Schluss der Signalkerze ein. Soll: Signal nur, solange die Signalkerze die juengste fertige Kerze nach der Uhr ist
  (Alter ab Kerzen**schluss** < 1 Kerzenlaenge).
  Verwandt, ohne Datenfehler: wird ein Signal von einem Filter (z. B. Positionslimit) abgelehnt und gibt der Filter
  innerhalb der Stunde nach, steigt das Depot auf dieselbe Signalkerze bis zu 59 min spaeter zum dann aktuellen Kurs ein.
- **Kleinsttest:** `F3-04 Einstieg auf eine Signalkerze, die schon 110 Minuten geschlossen ist (Quelle im Verzug)`

### F3-05 — kein Unterschied (Schutz greift) — Signalkerze aelter als 3 Kerzenlaengen
- **Ort:** `depot.js:3156-3161`. 200 min nach Kerzenbeginn: kein Einstieg, Monitor "Kursdaten veraltet", `HEALTH.staleBars`.
  Die Uhr ist die Wanduhr (`Date.now()`), verglichen mit dem Stempel der letzten Kerze der **Archivreihe** (die
  Archivreihe ist von Yahoos Quote-Stempel bereinigt, `archiv.js ohneStempel`).
- **Kleinsttest:** `F3-05 Schutz greift: Signalkerze aelter als 3 Kerzenlaengen wird nicht gehandelt`

### F3-06 — A (nur bei eingeschalteter Regime-Zuteilung) — SPY fehlt: Regime-Filter faellt offen
- **Ort:** `depot.js:2652-2672` (`spyTrendAuf`: ohne Anker `auf = null`, 30 min zwischengespeichert),
  `depot.js:3101-3116` (bei `null` blockt keiner der beiden Zweige).
- **Pfad:** Scheitert der SPY-Abruf (oder liefert er ≤ 220 Kerzen), handelt rsi2seit ungefiltert — auch dort, wo der
  Filter mit Daten blocken wuerde (Test: SPY unter EMA200 → blockiert; SPY-Abruf scheitert → Einstieg). Das Ergebnis
  "kein Anker" bleibt 30 min stehen, auch wenn SPY danach wieder kommt. Keine Meldung. Im Code als "Basis-Verhalten"
  begruendet; die Regime-Zuteilung ist aber gerade als Schutz vor dem Regime gemessen, in dem rsi2seit verliert.
  Voreinstellung `regimeZuteilung: false` — betrifft nur, wer sie eingeschaltet hat.
- **Kleinsttest:** `F3-06 Regime-Filter an, SPY-Abruf scheitert: rsi2seit handelt ungefiltert`

### F3-07 — A (nur bei eingeschalteter Regime-Zuteilung) — Regime-Filter auf alten SPY-Kerzen
- **Ort:** `depot.js:2661-2668`: `fertigeBars` + EMA200 auf der Antwort, **kein** Alterscheck der letzten SPY-Kerze.
- **Pfad:** Endet die SPY-Antwort vor 28 Tagen (damals Aufwaertstrend), gilt das Regime als "auf" und rsi2seit
  handelt; auf den frischen Daten (Absturz) haette der Filter geblockt. Keine Meldung.
- **Kleinsttest:** `F3-07 Regime-Filter rechnet auf SPY-Kerzen, die einen Monat alt sind`

### F3-08 — A — Luecke in der 60m-Reihe: Signal auf zusammengestueckelten Kerzen
- **Ort:** `depot.js:2840-2845` (Archiv statt Abruf, sobald laenger), `depot.js:2864` (Laengenpruefung zaehlt nur Kerzen);
  `backfill.js:180-185` fuellt nur Archive unter 400 Kerzen nach.
- **Pfad:** War die App rund zwei Monate aus, endet das Archiv vor 300 Handelsstunden; der Abruf (`range=1mo`) bringt die
  letzten 150. Zusammen sind es genug Kerzen (≥ 261), aber EMA100 und der 200-Kerzen-Kanal spannen ueber eine Luecke von
  59 Kalendertagen. Im Test: auf der durchgehenden Reihe kein Signal, live ein Einstieg. Feiertage und Halbtage sind
  dagegen harmlos — sie fehlen in der Messreihe genauso. Soll: Luecke erkennen (Kerzenabstand gegen Handelskalender)
  und erst nach dem Auffuellen (btRange 730d) handeln.
- **Kleinsttest:** `F3-08 Luecke von 300 Handelsstunden im Archiv: Signal auf der zusammengestueckelten Reihe`

### F3-09 — A — Zeit-Ausstieg haelt 9 statt 8 Kerzen (Regelbefund, Hinweis an Frage 1)
- **Ort:** `depot.js:2915` zaehlt Kerzen mit Beginn **nach** `openT`; `openT` = Scanzeit nach Schluss der Signalkerze, also
  nach dem Beginn der 1. Kerze danach — diese zaehlt nie. Messung: `c[i+8]/c[i]` (z. B. `depot.js:6201`, Edge-Waechter).
- **Pfad:** Live wird zum Schluss der 9. Kerze nach dem Signal verkauft (die App meldet dabei "8 Handelskerzen").
  Luecken (Handelsstopp, fehlende Stunde) verlaengern Messung und Live gleich, weil beide Kerzen zaehlen — dort kein
  zusaetzlicher Unterschied.
- **Kleinsttest:** `F3-09 Zeit-Ausstieg zaehlt ab dem Einstiegszeitpunkt: 9 statt 8 Kerzen gehalten`

### F3-10 — A — Freitags-Einstieg: 2-Tage-Schutznetz verkauft Montag zur Eroeffnung (Hinweis an Frage 1)
- **Ort:** `depot.js:2901` (`now - openT > 2 Tage` → Schutzschliessung) steht in der `else if`-Kette **vor** dem Zeit-Ausstieg.
- **Pfad:** Das Netz ist fuer "App war pausiert" gedacht, misst aber Kalenderzeit. Jede rsi2seit-Position, die ueber ein
  Wochenende (oder einen Feiertag) muss, ist am Montag aelter als 48 h und wird beim ersten Scan nach der Eroeffnung
  verkauft — im Test nach 1 von 8 Kerzen, zum Montags-Eroeffnungskurs; die Messung haelt bis Montagsschluss. Auch
  nach einem Ruhezustand ueber 2 Kalendertage wird zum frischen Kurs (nicht rueckwirkend) verkauft — das ist das Soll;
  falsch ist nur, dass es bei laufender App jede Freitagsposition trifft.
- **Kleinsttest:** `F3-10 Freitags-Einstieg: Schutznetz schliesst Montag zur Eroeffnung statt nach 8 Handelsstunden`

### F3-11 — A — Neustart am neuen Tag: Tagesstart zu Einstandskursen, Kill-Switch auf dem Verlust von gestern
- **Ort:** `depot.js:1915-1926` (`spotOf`: Ticker → `LASTBARS` → sonst `entrySpot` ueber `equityNow` `depot.js:2040-2047`),
  `depot.js:106-109` (`ensureDay`), `depot.js:2795` (`killSwitchPruefen` VOR dem Fuellen von `LASTBARS`, `depot.js:2818`);
  ebenso `render()` beim Start (`depot.js:3558`).
- **Pfad:** Nach einem Neustart ist `LASTBARS` leer. Fuer Werte ausserhalb der Kurs-Kachelliste (Pool, Watchlist) bewertet
  `equityNow` zum Einstand, und genau dieser Wert wird beim ersten Aufruf des Tages zum Tagesstart. Im Test: gekauft zu
  100, Montagsschluss 92; Dienstag Tagesstart 99.960 $ statt 96.763 $ — im zweiten Scan loest der Kill-Switch mit
  "-3,2 %" aus und stellt alles glatt, ohne dass sich heute ein Kurs bewegt hat. Umgekehrt (Positionen gestern
  gestiegen) loest er zu spaet aus. (Positionsgroesse im Test 20 % je Wert, damit die 3-%-Schwelle sichtbar wird;
  der Versatz selbst ist die Summe der Bewegung aller offenen Positionen seit Einstand.)
- **Kleinsttest:** `F3-11 Neustart am neuen Tag: Tagesstart zu Einstandskursen, Kill-Switch loest auf den Verlust von gestern aus`

### F3-12 — A — Fehldruck (Geldkurs 0) ueber den Capital-Ersatzweg loest den Not-Stopp aus
- **Ort:** `capital.js:252-253` (`if (!c || c.bid == null) continue; mid = (bid + ask) / 2`), Ersatzweg `depot.js:2598-2606`.
- **Pfad:** Faellt Yahoo aus und ist Capital.com verbunden, kommen die Kerzen ungeprueft: Geld 0 / Brief 100,05 ergibt
  50,05 — der Not-Stopp verkauft dazu ("-50 %"). Ueber Yahoo wird dieselbe 0 von `kurse.js kursOk` verworfen, die
  Position bleibt (richtig). Genau der Nullkurs-Zwischenfall, gegen den `kursOk` eingefuehrt wurde, auf dem zweiten Weg.
  (Getestet mit dem echten `capital.js`, Netz durch eine Attrappe von `api.capFetch` ersetzt.)
- **Kleinsttest:** `F3-12 Fehldruck (Geldkurs 0) ueber den Capital-Ersatzweg loest den Not-Stopp aus; ueber Yahoo nicht`

### F3-13 — kein Unterschied (Schutz greift) — Vorlauf unter 261 Kerzen
- **Ort:** `depot.js:2864-2868`. Kein Signal, kein Einstieg, Monitor "Kursreihe zu kurz (200 < 261 Kerzen)". (Die
  Kehrseite fuer offene Positionen ist F3-01.)
- **Kleinsttest:** `F3-13 Schutz greift: Vorlauf unter 261 Kerzen - kein Signal, kein Einstieg`

### F3-14 — kein Unterschied — Edge-Waechter ohne Messbasis
- **Ort:** `depot.js:6164-6233` (`edgeZustand` misst aus dem 60m-**Archiv**, nicht aus den Messprotokollen),
  Pausenentscheidung `depot.js:6379` (`verfall` braucht `nSym >= 5`), Sperre im Scan `depot.js:3088-3094`.
- **Pfad:** Leeres Archiv → "erst 0 rsi2seit-Signale im 60m-Archiv" (Meldung, keine Zahl) → keine Pause → Signale werden
  gehandelt. Das ist die gemessene Regel ohne Zusatzwaechter, also kein Unterschied zur Messung. Die Messprotokolle
  im Datenordner steuern den Handel nicht (nur Anzeige, `depot.js:779-800`). Hinweis ohne Test: ein stehendes Archiv
  (keine neuen Kerzen) ergibt `zuwachs = 0`, dann pausiert der Waechter auch bei zweimaligem Verfall nicht (`depot.js:6412`, gewollt).
- **Kleinsttest:** `F3-14 Edge-Waechter ohne Messbasis: meldet "erst 0 Signale", pausiert nicht, Handel laeuft`

### F3-15 — A — Kill-Switch schliesst eine Position ohne frischen Kurs zum alten Kurs; sieht frische Kurse erst einen Scan spaeter
- **Ort:** `depot.js:146-151` (`spotOf(p.sym) || p.entrySpot`, geschlossen wird alles mit Kurs > 0), `spotOf` → `LASTBARS`
  (nur bei erfolgreichem Abruf erneuert, `depot.js:2818`); `depot.js:2793-2795` (Kommentar "mit den eben geladenen,
  frischen Kursen" — tatsaechlich mit denen des Vorscans).
- **Pfad:** AAA-Abruf scheitert seit 13:35, BBB faellt. Im Scan 13:35 loest der Kill-Switch nicht aus (er rechnet mit den
  Kursen von 10:35), erst 13:37. Dann stellt er AAA zu dessen Kurs von 10:35 (187 min alt) glatt. Die Meldung des
  Kill-Switch sagt, Positionen ohne aktuellen Kurs blieben offen — das trifft nur zu, wenn es nie einen Kurs gab.
- **Kleinsttest:** `F3-15 Kill-Switch schliesst eine Position ohne frischen Kurs zum 3 Stunden alten Kurs`

### F3-16 — A — Offene Position ausserhalb des Scan-Universums: nie abgerufen, nie gestoppt
- **Ort:** `depot.js:2008-2018` (`scanUniverse`: Basis + Watchlist + Screener-Treffer **von heute** + Extra-Pool
  **einmal je Kerze**), Positionsmanagement nur innerhalb der Symbolschleife (`depot.js:2880`).
- **Pfad:** Steht der Wert einer offenen Position nicht (mehr) im Universum — Watchlist-Eintrag entfernt, Pool umgestellt,
  Screener-Treffer von gestern (rsi2seit haelt ueber Nacht) —, wird fuer ihn nie ein Kurs geholt: kein Not-Stopp, kein
  Zeit-Ausstieg, kein Schutznetz; `equityNow` bewertet ihn zum Einstand (Test: 2.997 $ statt 2.098 $). Fuer Werte aus
  dem Extra-Pool gilt abgeschwaecht dasselbe zwischen zwei Pool-Durchsichten (`extra60mFenster` `depot.js:1990-2004`).
  Soll: die Symbole aller offenen Positionen gehoeren in jeden Scan.
- **Kleinsttest:** `F3-16 Offene Position ausserhalb des Scan-Universums: nie abgerufen, nie gestoppt, zum Einstand bewertet`

## Kurzantworten auf die gestellten Fragen

| Frage | Antwort |
|---|---|
| Kursabruf scheitert, Cache/Archiv mit alten Kerzen? | Kein Cache im Ladepfad; das Archiv wird nur zusammen mit einer frischen Antwort benutzt. Ohne Antwort: kein Handel, gemeldet (F3-02). Aber: Bewertung und Kill-Switch nehmen `LASTBARS` des letzten Erfolgs (F3-15, F3-11). |
| Alter der letzten Kerze geprueft? | Nur fuer Einstiege, gegen die Wanduhr, ab Kerzen**beginn**, Grenze 180 min (F3-04/F3-05). Nicht fuer Ausstiege (F3-03), nicht fuer SPY (F3-07). |
| Einstieg/Ausstieg zu altem Schluss? | Einstieg bis 120 min nach Signalschluss (F3-04); Ausstieg zu beliebig altem Kurs (F3-03, F3-15). |
| Luecken in der 60m-Reihe? | Zeit-Ausstieg zaehlt Kerzen wie die Messung (gleich lang bei Luecken), haelt aber 9 statt 8 (F3-09); Signal ueber grosse Luecken (F3-08). |
| SPY fehlt/alt? | Filter faellt offen bzw. rechnet auf alten Daten (F3-06, F3-07). |
| Edge-Waechter ohne Protokoll? | Misst aus dem Archiv, nicht aus Protokollen; ohne Messbasis keine Pause (F3-14). |
| Not-Stopp mit veraltetem Kurs? | Ausgeloest ja (F3-03, F3-12 Fehldruck); nicht ausgeloest, wenn Archiv leer (F3-01) oder Wert nicht im Universum (F3-16). |
| Neustart/Ruhezustand? | Ausstieg zum frischen Kurs (F3-02), Schutznetz nach 2 Kalendertagen (F3-10 trifft auch jede Freitagsposition); Tagesstart des Kill-Switch zu Einstandskursen (F3-11). |
| Vorlauf < 261? | Kein Signal (F3-13), aber auch kein Ausstieg (F3-01). |
| Nullen/NaN? | Yahoo-Weg verwirft sie (`kurse.js kursOk`), Capital-Weg nicht (F3-12). |
