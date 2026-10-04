# Lader-Störungen: archiv.js

**Lader:** `archiv.js`, das Renderer-Kursarchiv im Electron-Store (`Archiv.fuege/serie/speichere/bereiche/abdeckung/dollarVolTag/ohneStempel`, `TAGE_MAX`) · **Stand:** 61dca2c · **Tests:** `pruefberichte/lader-stoerungen/archiv.test.js` (Präfix AR, 14 Tests) · **Lauf:** `node pruefberichte/lader-stoerungen/archiv.test.js` → 9 zeigen eine Abweichung, 5 keinen Unterschied, 0 kaputt; 0 Netzversuche, 0 Schreibversuche außerhalb; Rückgabewert 0; Laufzeit unter 1 s.

## Kurzfassung

1. **A – CFD-Rückfall im 60m-Scan (AR-6):** Capital-Stundenkerzen aus Randstunden (08–12 und 21–23 UTC) bleiben in der Aktienreihe. Bei kurzer Yahoo-Basis kippt die gelernte Rasterphase auf :00, und Regel 2 löscht **alle** Yahoo-Kerzen (35 von 35). Der 60m-Scan (Voreinstellung rsi2seit) rechnet auf dieser Reihe.
2. **A – Kürzel-Neuvergabe (AR-4) und Split (AR-7):** Eine neue Firma wird ohne Bruchmarke an die alte gehängt; die fremden Kerzen erfüllen dabei das 261er-Tor des Scans. Ein rückwirkend bereinigter Abruf erzeugt −75 % an der Grenze des Abruffensters. `reiheUnplausibel` greift erst unter −80 % und fängt beides nicht.
3. **A – Nicht-Kurse (AR-11):** Kurse 0, NaN (wird zu 0), negativ und null sowie Hoch < Tief gehen ungeprüft in den Store. Der Zulauf ist heute weitgehend vorgefiltert, der Capital-Rückfall lässt aber `bid 0` durch.
4. **B – Messbasis:** Ein Quote-Stempel zur Schlusszeit bleibt auf 1m/5m/15m dauerhaft stehen (AR-3; das bestätigt Befund R3 im Wiki). Abgemeldete Reihen sammeln Phantomtage (AR-8). Geht die Rechneruhr ein Jahr vor, wird das ganze 1m-Archiv gelöscht und so geschrieben (AR-12). Ein einmal gesetzter cap-Bereich verwirft gute Yahoo-Umsätze (AR-5).
5. **C:** Ein `fuege` während eines laufenden `storeSet` verliert die dirty-Marke (AR-14).
6. **Kein Unterschied** bei S1 (leere Antwort), beim S2-Normalfall (Stempel, laufende Kerze, Morgen, 1m), bei S8 (Zeitumstellung), bei S9–S11 und bei der Speicher-Drossel. S3 und S5 treffen nicht zu.

**Bedingung für alle A-Befunde:** Das Buch ist das Intraday-Depot in `depot.js`. Es handelt nur bei `D.intraday.enabled`; die Voreinstellung ist `false` (depot.js:38: `mode 'rsi2seit', interval '60m'`). Ist der Handel aus, laufen dieselben Kerzen nur ins Schattenbuch, in die benannten Regeln und in den Edge-Wächter. Ob der Handel bei Wilhelm an ist, konnte der Test nicht sehen, weil der Datenordner gesperrt war.

## Verbraucher

**Wer schreibt (`fuege`):**
- Intraday-Scan, depot.js:2823. Kommt die Antwort aus dem Capital-Rückfall (depot.js:2603), wird sie mit `'cap'` gekennzeichnet (depot.js:2824).
- Krypto-Sammler, depot.js:2347.
- Capital-Backfill, depot.js:4930: `'cap'`, vorher auf die Sitzung gefiltert (depot.js:4927).
- Messlauf `loadLabData`, depot.js:4968: btMode, also nie Capital.
- 1m-Nachtsammlung, depot.js:6275.
- backfill.js:193 (60m-Nachholer) und backfill.js:271 (`'cap'`).
- `markiere`: backfill.js:109 und backfill.js:123.
- `speichere(false)` gedrosselt: depot.js:2828.

**Wer liest – und welcher Weg zu einem Buch führt:**

| Leser | Datei:Zeile | Wirkung | Stufe |
|---|---|---|---|
| Intraday-Scan | depot.js:2842–2843 `bars = archS.slice(-800)` → depot.js:2858 `sigBars = Q.fertigeBars(...)` → Tor depot.js:2864 (≥ 261 Kerzen) → Einstieg `Q.einstiegSignal(sigBars …)` depot.js:3029/3045 → Kauf depot.js:3413–3414 (`D.positions.push(trade)`); Ausstiege auf sigBars: Haltedauer zählt Kerzen depot.js:2916, `closeTrade` depot.js:2956 | Kauf/Verkauf im Intraday-Depot. Kaufkurs und Stopp bleiben der frische Abruf (`spot`, depot.js:2846) – das Archiv bestimmt **ob/wann**, nicht **zu welchem Kurs** | **A** (wenn `enabled`), sonst Schattenbuch depot.js:2869 / Regeln depot.js:2872 = B |
| Edge-Wächter | depot.js:6178 `Archiv.serie('60m', …)`, Schutz `reiheUnplausibel` depot.js:6150 (nur r > 4 oder r < −0,8, Kurs ≤ 0) → Arm-Pause depot.js:3088 | sperrt oder öffnet den Handelsarm rsi2seit/Kapitulation | A-nah (Handelssperre), sonst B |
| Messlauf | depot.js:4969 Serie, depot.js:4972–4973 `dollarVolTag` (nur wenn der frische Abruf fehlt), Filter depot.js:4977 (`dv == null` → nicht filtern) | Messung, Labor | B |
| Abdeckung | depot.js:6558–6559 → `EXPORT_ABDECKUNG` (Analyse-Export) | Anzeige/Export | B |
| Krypto-Stand | depot.js:2372 | Anzeige | B |
| Tiefensuche | zucht.js:46 („handelt nichts“) | Messung | B |
| Strategie-Chart | strategiechart.js:160 | Anzeige | B |
| Kennzeichnung | backfill.js:95/102/104 | Messbasis | B |
| Archiv-Grafik | main.js:1886/1891 (`ArchivKern.tageVon/abdeckungBild`) | Anzeige | B |

**Momentum- und Drift-Buch** (`mittelfrist.js`, `mfdepot.js`, `mfhandel.js`): Keiner dieser Lader liest `archiv.js` (kein Aufruf von `Archiv.serie/fuege`). Es gibt keinen Weg vom Kursarchiv zu diesen Büchern.

## Tabelle

| ID | Störung | Reaktion heute | Testzeile | Bewertung | Datei:Zeile | Vorschlag |
|---|---|---|---|---|---|---|
| AR-1 | S1 leere Antwort (0 Kerzen, null, nur Stempel) | verwirft (kein Laden, kein Schreiben, Bestand bleibt) | archiv.test.js:132 | – (Nebenbefund C) | archiv.js:324 | `fuege` sollte `{ neu }` zurückgeben, damit Zähler neue statt gelieferte Kerzen zeigen. |
| AR-2 | S2 Quote-Stempel + laufende Kerze im Handel (5m, 1m, Morgen) | behält richtig (Stempel weg, fertige Kerze ersetzt laufende) | archiv.test.js:160 | – | archiv.js:110, archiv.js:51 | – |
| AR-3 | S2 Quote-Stempel genau zur Schlusszeit (20:00/21:00/18:00 UTC) | schreibt still falsch (1m/5m/15m dauerhaft; 60m verworfen) | archiv.test.js:207 | B (A, sobald der Scanner auf 1m/5m/15m steht) | archiv.js:119, archiv.js:122 | Eintrag mit Umsatz 0 und H = T = S genau zur Sitzungsschlusszeit laut Kalender (`window.Boerse`) nicht übernehmen – die Grundregel aus wiki §6, die Migration und Datei schon anwenden. |
| AR-4 | S4 Kürzel-Neuvergabe | schreibt still falsch (neue Firma an alte gehängt, keine Bruchmarke) | archiv.test.js:240 | A | archiv.js:337, archiv.js:51; depot.js:2843, :2864, :6150 | Bei Lücke > 20 Handelstage ohne gemeinsamen Stempel den Altbestand abtrennen (eigener Schlüssel) und melden, statt anzuhängen. |
| AR-5 | S6 cap-Bereich bleibt nach Yahoo-Ersatz | verwirft Gutes (`dollarVolTag` = null statt 782 Mio $/Tag) | archiv.test.js:267 | B | archiv.js:280, archiv.js:51, archiv.js:326 | Quelle je Kerze führen (wie Z1) oder den Bereich beim Ersetzen durch eine Nicht-cap-Kerze um deren Stempel verkleinern. |
| AR-6 | S6 CFD-Rückfall 60m: Randstunden, Rasterphase | schreibt still falsch (Randstunden bleiben) und verwirft Gutes (Yahoo gelöscht) | archiv.test.js:289 | A | archiv.js:103, archiv.js:126; depot.js:2824, :4927, :2843 | CFD-Kerzen in `fuege(…,'cap')` auf die Börsensitzung filtern (`Backfill.istSitzung`) und die Rasterphase nur aus Nicht-cap-Kerzen lernen. |
| AR-7 | S6 Split: bereinigter Abruf über unbereinigtem Bestand | schreibt still falsch (−75 % an der Fenstergrenze) | archiv.test.js:326 | A | archiv.js:51, archiv.js:337; depot.js:6150, :2843 | Gemeinsame Stempel vergleichen: konstanter Faktor ≠ 1 ⇒ Altbestand umrechnen oder Mischung verweigern und melden. |
| AR-8 | S7 abgemeldete Reihe sammelt flache Abrufkerzen | schreibt still falsch (3 Phantomkerzen, Abdeckung 5 statt 2 Tage) | archiv.test.js:359 | B | archiv.js:110, archiv.js:122; depot.js:6558 | Flache Kerzen ohne Umsatz an einem späteren Tag als dem letzten Umsatz der Reihe nicht übernehmen (Unterscheider: Reihe hat aufgehört). |
| AR-9 | S8 Sommer-/Winterzeit | behält richtig | archiv.test.js:384 | – | archiv.js:90–100 | – |
| AR-10 | S9–S11 Feiertag, Halbtag, Kursaussetzung | behält richtig (Abdeckung 3, Kerzen ohne Umsatz bleiben, `dollarVolTag` stimmt) | archiv.test.js:410 | – | archiv.js:156–166, archiv.js:272–284 | – |
| AR-11 | Kurs 0/NaN/negativ/null, Hoch < Tief | schreibt still falsch (5 von 5 im Store, NaN → 0) | archiv.test.js:437 | A (Zulauf heute großteils vorgefiltert) | archiv.js:50–51, archiv.js:224; capital.js:253 | In `fuege` dieselbe `kursOk`-Regel wie kurse.js anwenden und Hoch/Tief tauschen. |
| AR-12 | TAGE_MAX bei falscher Rechneruhr (+1 Jahr) | verwirft Gutes (2.340 → 0 Kerzen, so geschrieben) | archiv.test.js:464 | B | archiv.js:141, archiv.js:337 | Kappen relativ zur jüngsten Kerze (Bestand ∪ Abruf) statt zu `Date.now()`; liegt die Uhr > 30 Tage vor der jüngsten Kerze, nicht kappen und melden. |
| AR-13 | Speicher-Drossel (10 Min) und Absturz | behält richtig (Verlust < 10 Min, nachladbar) | archiv.test.js:485 | – | archiv.js:363 | – |
| AR-14 | `fuege` während eines laufenden `storeSet` | verwirft Gutes (dirty gelöscht, 2 Kerzen nicht geschrieben) | archiv.test.js:510 | C | archiv.js:366, archiv.js:384 | Je Eintrag eine Fassungsnummer führen und dirty nur löschen, wenn sie seit dem Abzug unverändert ist. |

## Einzelheiten

**AR-1 (S1).**
- *Serie:* Bestand 78 5m-Kerzen vom 02.10. Dann `fuege` mit `[]`, mit `null` und mit nur dem Quote-Stempel (1 Eintrag), danach `speichere(true)`.
- *Soll* (aus der Störung): Der Bestand bleibt unverändert, es wird nicht geschrieben.
- *Ist:* Wie Soll. `fuege` kehrt bei weniger als 2 Einträgen zurück, bevor überhaupt geladen wird (archiv.js:324). Positivkontrolle: Eine echte Antwort über dieselbe Strecke schreibt genau einmal, liefert +3 Kerzen und lässt den Stempel weg.
- *Nebenbefund C:* `fuege` gibt nichts zurück. Die Aufrufer zählen deshalb gelieferte statt neuer Kerzen (z. B. `stat.kerzen += fd.series.length`, depot.js:2348). „Neu = 0“ (Stillstand) ist von „angekommen“ nicht zu unterscheiden.

**AR-2 (S2 Normalfall).**
- *5m:*
  - Um 13:47:27 kommen 13:30, 13:35, die laufende 13:40 und ein Stempel 13:47:27.
  - Um 13:52:05 kommen die fertige 13:40, die laufende 13:45 und ein Stempel.
- *1m:*
  - Fr 19:59:30: Stempel 30 s nach der letzten Minute.
  - Mo 13:30:40: Morgen nach der Nachtlücke.
  - 13:32:00: Stempel genau auf der vollen Minute.
  - 13:33:10: Die echte 13:32-Kerze kommt.
- *Soll:* Kein Stempel bleibt; die fertige Fassung gewinnt.
- *Ist:* Wie Soll. Krumme Stempel fallen durch Regel 1 (archiv.js:110). Bei gleichem Stempel gewinnt der neue Abruf (archiv.js:51). Der Stempel auf der vollen Minute bleibt nur bis zur echten Kerze stehen; das ist die Positivkontrolle für den Ersetzungsweg.

**AR-3 (S2 Schlussstempel).**
- *Serie:* Je Intervall drei Sitzungen, jeweils mit angehängtem Quote-Stempel zur Schlusszeit:
  - Sommer 02.10., Schluss 20:00:00
  - Winter 02.11., Schluss 21:00:00
  - Halbtag 27.11., Schluss 18:00:00
- *Soll:* Nicht übernehmen. Das folgt aus wiki/archiv-zusammenfuehrung.md §6 Grundregel („Quote-Kerzen nach Sitzungsschluss (Kalender, nicht 20:00) werden nicht übernommen“). Befund R3 zeigt dieselbe Ablagerung im echten Store: 65/79/53/0 Quote-Kerzen um 20:00.
- *Ist:*
  - 1m, 5m und 15m behalten je 3 von 3.
  - 60m verwirft 3 von 3: Das Raster liegt dort auf :30, also greift Regel 1b.
  - Auf 1m/5m/15m liegt die Schlusszeit **auf** dem Raster. Regel 1b greift nur daneben (archiv.js:119); sonst gilt der Eintrag als eigene Kerze (archiv.js:122).
  - Kein späterer Abruf ersetzt den Eintrag, weil Yahoo keine reguläre Kerze zur Schlusszeit liefert. Er ist also dauerhaft.
- *Weg:*
  - Messlauf auf 1m/5m/15m (depot.js:4969): B.
  - Steht der Scanner auf 1m/5m/15m (`cfg.interval`, depot.js:2842), wird der Eintrag eine Extra-Kerze in sigBars. Er verfälscht dann RSI(2) und die Kerzenzählung der Haltedauer (depot.js:2916): A.
  - Bei der Voreinstellung 60m tritt das nicht auf.

**AR-4 (S4).**
- *Serie:* Firma 1 unter XYZ hat 434 Stundenkerzen um 50 \$ (05.01.–31.03.2026). Nach einem Neustart kommt Firma 2 unter XYZ mit 154 Kerzen um 12 \$ (Yahoo-Fenster 1mo, September).
- *Soll* (aus der Störung): Die neue Reihe hängt nicht stumm an der alten; es braucht eine Bruchmarke oder eine Trennung.
- *Ist:*
  - Die Serie hat 588 Kerzen, Lücke 154 Tage, Sprung −76 %.
  - Es gibt keinen Bereich und keine Marke. `fuege` mischt nur nach Zeitstempel (archiv.js:337, archiv.js:51).
- *Weg:*
  - Das Scan-Fenster `slice(-800)` (depot.js:2843) trägt alle 434 alten Kerzen.
  - Allein hätte Firma 2 mit 154 Kerzen das Tor von 261 Kerzen nicht bestanden (depot.js:2864, „Signal wäre nicht das gemessene“). Mit den alten Kerzen besteht sie es, und rsi2seit rechnet EMA100 und Kanal über zwei Firmen.
  - `reiheUnplausibel` (depot.js:6150) prüft nur r < −0,8 und lässt −0,76 durch.
- *Interne Schlüssel:* `key(iv, sym)` (archiv.js:301) ist rein, also nach einem Neustart gleich. Zeichen außerhalb `[\w.^-]` werden zu `_`. „BRK.B“ und „BRK-B“ sind daher zwei Reihen. Das wurde nicht getestet; es ist ein Hinweis, falls Quellen verschiedene Schreibweisen liefern.

**AR-5 (S6, cap-Bereich).**
- *Serie:*
  - Capital-Backfill liefert 156 5m-Kerzen (01.–02.10.) als `[t, mid, 3]` mit `'cap'`.
  - Danach liefert der Messlauf von Yahoo dieselben Stempel mit Umsatz 100.000.
- *Soll:* Die Kerzen sind jetzt Yahoo-Kerzen, und ihre Umsätze zählen. Das stützt Wiki R2 („capBereiche heißt war einmal CFD“; 8 von 12 Bereichen sind Yahoo-identisch).
- *Ist:* Alle 156 Kerzen sind Yahoo-Kerzen (5 Felder, Umsatz 1e5), der Bereich bleibt aber stehen. `dollarVolTag` überspringt alles (archiv.js:280) und ergibt `null` statt 782 Mio \$/Tag.
- *Weg:* Im Messlauf gilt `dv == null` als „nicht filtern“ (depot.js:4977). Ein Wert, der die Liquiditätsgrenze verfehlt, geht so ungefiltert in die Messung. Das wirkt nur, wenn dort der frische Abruf fehlt (depot.js:4973). Stufe B.

**AR-6 (S6, CFD-Rückfall 60m).**
- *Serie:*
  - Yahoo 60m auf :30. Fall „kurz“: 5 Tage (35 Kerzen, eine neu ins Universum gekommene Reihe). Fall „lang“: 30 Tage.
  - Darauf der Scan-Rückfall `CapAPI.prices`: 16 Stundenkerzen je Tag, 08:00–23:00 UTC auf :00, als `[t, mid, vol]`, gekennzeichnet mit `'cap'`.
- *Soll:*
  - Die Yahoo-Kerzen bleiben vollständig.
  - Die Aktienreihe nimmt keine Kerzen außerhalb der Sitzung auf. Der Capital-Backfill filtert dafür eigens (depot.js:4927); der Scan-Rückfall (depot.js:2603, depot.js:2824) tut es nicht.
- *Ist, kurz:*
  - `rasterPhase` lernt :00, weil 80 CFD- gegen 35 Yahoo-Kerzen stehen (archiv.js:103).
  - Jede Yahoo-Kerze steht 30 Minuten nach einer CFD-Kerze. Regel 2 („Raster schlägt Reihenfolge“, archiv.js:126) entfernt so 35 von 35 Yahoo-Kerzen.
  - 50 Kerzen liegen außerhalb der Sitzung.
- *Ist, lang:* Die Yahoo-Kerzen bleiben 35 von 35, aber 40 CFD-Randstunden (08–12 und 21–23 UTC) bleiben in der Reihe. Das ist die Lage, die Wiki-Befund R2 im Store gezählt hat („Capitals 08:00–12:00 und 23:00“).
- *Weg:*
  - Der Scan rechnet auf `archS.slice(-800)` (depot.js:2843). Bei der Voreinstellung 60m/rsi2seit ist das A.
  - Die Kennzeichnung als `'cap'` schützt nur `dollarVolTag`, nicht die Signale.
  - Der echte Rückfall liefert bis zu 500 Kerzen, also mehrere Wochen. Die Wirkung ist entsprechend größer.

**AR-7 (S6, Split).**
- *Serie:*
  - Bestand 60m um 400 \$ (03.08.–25.09.), gesammelt vor dem Split.
  - Split 4:1 ex 28.09.
  - Der Abruf danach (range 1mo, ab 02.09.) liefert die Vor-Split-Tage bereinigt (÷4) und danach Kurse um 100.
- *Soll:* Kein Sprung dort, wo der Markt keinen gemacht hat. Die 126 gemeinsamen Stempel mit konstantem Faktor 0,25 sind die Signatur, aus der sich der Altteil umrechnen ließe.
- *Ist:*
  - Neu gewinnt stumm (archiv.js:51).
  - Der größte Sprung ist −75 % am 02.09. um 13:30, also an der Grenze des Abruffensters, ohne Ereignis.
  - Am echten Split-Tag zeigt die Reihe 0 %.
- *Weg:*
  - `reiheUnplausibel` (depot.js:6150) fängt −75 % nicht und würde erst ab 5:1 greifen.
  - Der Scan rechnet auf der Reihe (depot.js:2843): A. Das gilt für Werte, die nur im Scan-Universum stehen (60m range 1mo).
  - Bei Werten im Messuniversum überschreibt der Messlauf (btRange 730d) den größten Teil; der Sprung wandert dann ans alte Ende der Reihe.
  - 1m/5m/15m: Der Sprung sitzt an der Grenze des 7-Tage- bzw. 60-Tage-Fensters, im Messlauf: B.
  - Yahoos Intraday-Umsätze bleiben unbereinigt (wiki/datenquellen.md:199). `dollarVolTag` des bereinigten Teils wird damit zu klein. Das wurde nicht eigens getestet.

**AR-8 (S7).**
- *Serie:* Eine 1m-Reihe endet am Fr 02.10. um 19:59. Nachtsammlungen am 05., 06. und 07.10. liefern den Bestand und je eine flache Kerze ohne Umsatz auf voller Minute (22:14, 22:15, 22:16). Am 08.10. kommt ein krummer Stempel um 22:17:31.
- *Soll:* Keine Phantomkerzen. Der Unterscheider ist laut Störung, dass die Reihe aufgehört hat, nicht die Form.
- *Ist:*
  - Es bleiben 3 Phantomkerzen, die Abdeckung zeigt 5 Tage statt 2.
  - `ohneStempel` prüft nur Sekunde, Raster und Abstand (archiv.js:110, archiv.js:119, archiv.js:122), nie, ob die Reihe aufgehört hat.
  - Nur der krumme Stempel fällt; das ist die Positivkontrolle.
- *Weg:* Abdeckung → Analyse-Export (depot.js:6558). Im Messlauf landet die Reihe nur, solange das Symbol im Universum steht. B, im Bestand selten (pro Abruf greift es nur, wenn der Stempel auf voller Minute liegt).

**AR-9 (S8).**
- *Serie:* 60m und 5m über das Ende der US-Sommerzeit (01.11.2026): Do/Fr 29.–30.10. Sommerzeit, Mo/Di 02.–03.11. Winterzeit. Angehängt sind Schlussstempel um 20:00 bzw. 21:00 (60m, neben dem Raster) und krumme Stempel (5m).
- *Soll:* Die Phase bleibt :30, keine Kerze geht verloren, die Stempel fallen.
- *Ist:* Wie Soll: 28 von 28 und 312 von 312 Kerzen, je 4 UTC-Tage. Die Stunde Versatz ist ein Vielfaches jeder Kerzenlänge.

**AR-10 (S9–S11).**
- *Serie (5m, Winterzeit):*
  - Mi 25.11. voller Tag.
  - Do 26.11. Feiertag (Thanksgiving), keine Kerzen.
  - Fr 27.11. Halbtag mit 42 Kerzen.
  - Mo 30.11. mit Aussetzung 16:00–17:00 UTC (12 Kerzen fehlen) und davor vier flachen Kerzen ohne Umsatz auf dem Raster.
- *Soll:* Abdeckung 3 Tage; Kerzen ohne Umsatz bleiben („Umsatz ist der falsche Unterscheider“); `dollarVolTag` = Summe(Kurs × Umsatz) / Tage mit Umsatz.
- *Ist:* Wie Soll: 186 von 186 Kerzen, Abdeckung 3, 4 von 4 flache Kerzen behalten, `dollarVolTag` exakt.

**AR-11 (Nicht-Kurse).**
- *Serie:* Eine 5m-Sitzung, in der fünf Kerzen kaputt sind: Schluss 0, NaN, −5 und null sowie eine Kerze mit Hoch 99 < Tief 101.
- *Soll:* Das dauerhafte Archiv nimmt das nicht auf. Es gilt dieselbe Regel wie `kursOk` in kurse.js (endlich und > 0, eine Quelle der Regel laut depot.js:2590–2596); Hoch und Tief werden getauscht wie in `kurse.js zerlege`.
- *Ist:* Alle 5 stehen im Store. `schlank()` macht aus NaN eine 0 (archiv.js:224). `fuege` prüft nur die Länge (archiv.js:50–51).
- *Zulauf:* Der Yahoo-Weg ist vorgefiltert (kurse.js `kursOk`). Der Capital-Rückfall filtert nur `bid == null` und erzeugt bei `bid 0` ohne `ask` den Kurs 0 (capital.js:253).
- *Weg:* Scan (depot.js:2843): RSI(2) und EMA auf einer 0. A bei geringer Reichweite. Der Edge-Wächter verwirft solche Reihen (depot.js:6150, `!(c > 0)`).

**AR-12 (TAGE_MAX gegen falsche Uhr).**
- *Serie:* Bestand 1m 28.09.–02.10. (1.950 Kerzen) plus der frische Abruf vom 05.10. (390). Ein Lauf mit richtiger Uhr, einer mit Uhr 05.10.2027.
- *Soll:* Die Kappung verwirft nichts nach einer Uhr, die den Daten widerspricht.
- *Ist:* Richtige Uhr: 2.340 Kerzen. Falsche Uhr: 0 Kerzen, und genau so geschrieben. Die Kappung rechnet relativ zu `Date.now()` (archiv.js:141), und `fuege` übergibt keine Bezugszeit (archiv.js:337).
- *Weg:* 1m-Kerzen, die älter als 7 Tage sind, kann Yahoo nicht nachliefern; der Verlust ist endgültig. Messbasis: B.

**AR-13 (Speicher-Drossel).**
- *Ablauf:*
  - 14:00 `fuege` + `speichere(false)` schreibt.
  - 14:03 `fuege` (+ die 14:00-Kerze) + `speichere(false)` wird zurückgehalten (archiv.js:363).
  - Absturz, also neue Instanz auf demselben Store: 6 statt 7 Kerzen.
  - Erster Scan nach dem Start (5m range 5d): 8 von 8.
- *Soll:* Der Verlust bleibt auf die Drosselzeit begrenzt und ist nachladbar.
- *Ist:* Wie Soll.

**AR-14 (Flush-Wettlauf).**
- *Ablauf:* Während `speichere` auf `storeSet` wartet (IPC; der Datensatz ist beim Aufruf schon festgelegt, archiv.js:366), mischt ein Scan zwei Kerzen in dieselbe Reihe.
- *Soll:* Die Reihe bleibt als geändert markiert, und der nächste `speichere` schreibt sie.
- *Ist:*
  - Nach dem `await` wird `e.dirty = false` gesetzt (archiv.js:384).
  - Der zweite `speichere(true)` schreibt nicht (1 statt 2 Schreibvorgänge).
  - Nach einem Neustart fehlen 2 von 12 Kerzen.
  - Das heilt erst beim nächsten `fuege` derselben Reihe.
- *Weg:* Der Scan mischt dieselben 60m-Reihen alle 30 s bis 5 Min neu (depot.js:2823) und heilt sich damit selbst. Die 1m-Nachtsammlung mischt je Wert einmal pro Nacht, und die nächste Nacht holt die 7 Tage erneut. Darum C.

## Nicht geprüft / Grenzen

- **S3 (Tagesbalken-Stempel) trifft nicht zu.** `archiv.js` führt keine Tagesbalken: `TAGE_MAX` kennt nur 1m/5m/15m/60m (archiv.js:36–41), und alle Aufrufer übergeben nur diese Intervalle (`INTERVAL_CFG`, depot.js:2293–2298; backfill.js:99 und :146, depot.js:4907).
- **S5 (Zwilling) trifft nicht zu.** `archiv.js` führt je Schlüssel `bars_<iv>_<sym>` (archiv.js:301) eine eigene Reihe und mischt nie über Schlüssel hinweg. Es kann einen Zwilling also nicht erzeugen, nur einen gelieferten getreu ablegen. Der bekannte Fall entsteht bei Alpaca-Vorgängerreihen (alpacaarchiv).
- **Reihenfolge der Abrufe:** „Neu gewinnt“ heißt bei `fuege` „zuletzt gemischt“, nicht „zuletzt abgerufen“. Käme ein älterer Abruf mit laufender Kerze nach dem fertigen an (etwa aus einem Zwischenspeicher), überschriebe er die fertige Fassung. Dafür gibt es keinen Beleg im Code; nicht getestet.
- **60m-Halbtag:** Der Code behauptet, Yahoos 18:00-Stundenkerze mit Spanne bleibe stehen (archiv.js:86–89, 116–118). Steht davor eine 17:30-Kerze, entscheidet Regel 2 gegen sie, weil 30 min < 54 min. Ohne echte Halbtagsantwort lässt sich das nicht prüfen.
- **Stempelzeit abgemeldeter Intraday-Reihen** (Abrufzeit oder letzte Handelszeit) ist nicht gemessen. AR-8 nimmt den ungünstigen Fall (volle Minute am Abruftag); bei krummen Sekunden greift Regel 1.
- **Verbraucher nur gelesen,** depot.js nicht geladen. Die Ketten zu den Büchern sind Code-Belege, keine Läufe. Ob bei Wilhelm der Intraday-Handel an ist, ist unbekannt (Datenordner gesperrt).
- **Nicht eigens geprüft:** `spannenJeTag`, `tagesBild/abdeckungBild`, die 7-Stellen-Rundung in `schlank`, `markiere`, `flushFehler` (der `{ok:false}`-Weg ist im Code schon behandelt, archiv.js:377–383), Krypto 24/7 (Phase 0, kein eigener Test).

## Wünsche an hilfen.js

- **Zählende Store-Attrappe:** `H.storeAttrappe(store)` mit zählendem `storeGet/storeSet`, JSON-Kopie beim Aufruf (wie IPC) und einem Haken, der während `storeSet` läuft. Lokal als `neuesArchiv()` nachgebaut.
- **Kerzenbauer für US-Sitzungen in UTC:** Sommer-/Winterzeit, Halbtag, 60m auf :30, Lücken, Werktage. Lokal als `sitzung()`, `sitzungen()` und `werktage()` nachgebaut.
- **`H.zeileVon` mit „n-tem Vorkommen“:** Für mehrdeutige Anker fehlt das; z. B. steht `e.capBereiche = bereicheMerge(...)` zweimal in archiv.js und `D.positions.push(trade);` zweimal in depot.js.
