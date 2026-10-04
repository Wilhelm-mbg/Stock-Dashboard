# Lader-Störungen: Wie reagieren die Lader auf bekannte Störungen der Quellen? (Oktober 2026)

Stand `61dca2c` (main), Zweig `pruefung/lader-stoerungen`, 05.10.2026. App-Code unverändert. Simulation mit virtuellem Kapital, keine Anlageberatung.

## Kurzfassung

- **83 Kleinsttests über sechs Lader: 55 zeigen eine Abweichung (12 A, 27 B, 16 C), 28 keinen Unterschied, 0 kaputt; 0 Netz- und 0 Schreibversuche außerhalb, zwei Läufe zeichengleich.**
- **A, Momentum-Buch (kurse.js):** Die flache Quote-Stempel-Kerze (o=h=l=c, Umsatz 0) passiert `Kurse.zerlege` ungeprüft. Folgen: Der Tag steht doppelt, die Umschichtung wird einen Tag zu früh fällig (KU-2). 19 von 19 Käufen laufen zum laufenden Kurs statt zur Eröffnung (KU-5). An Thanksgiving wird gekauft (KU-6). Eine erloschene Position wird nie ausgebucht (KU-9).
- **A, Momentum-Buch (kurse.js):** Ein neu vergebenes Kürzel ersetzt die Reihe still, die Position wird zum Kurs der fremden Firma bewertet (KU-10). `meta.symbol ≠ angefragt` wird nicht geprüft (KU-13). Unsortierte oder doppelte Stempel liefern den falschen Tag (KU-14). Ein teilweise fehlendes `adjclose` verwirft gültige Zeilen, das Buch sieht dann den Vortag (KU-8).
- **A, nur bei eingeschaltetem Intraday-Handel (Voreinstellung aus, depot.js:38; archiv.js → Scanner depot.js:2843):** Kurs 0, NaN, negativ und Hoch < Tief landen im Store (AR-11). Beim CFD-Rückfall kippt das Raster und löscht alle Yahoo-Kerzen (AR-6). Ein Split erzeugt einen Sprung von −75 % (AR-7). Eine neue Firma wird an die alte gehängt (AR-4).
- **B, schwerster Fund im Dateiarchiv:** Eine abgeschnittene Archivdatei wird still mit dem Abruffenster überschrieben, die Geschichte ist weg, und geschrieben wird nicht atomar (KQ-14, kerzenquelle.js:759/1188/1197).
- **B, Archive und Messung:** Der laufende Tagesbalken wird archiviert (KQ-4). Erloschene Reihen sammeln Phantomtage und gelten als „auf Stand“ (KQ-8, AR-8, SR-4). Feiertagskerzen bleiben stehen (KQ-10). Splits erzeugen Sprungpaare (KQ-7, LS-7). Auf Xetra-60m werden 16 von 18 Kerzen verworfen (KQ-9).
- **B, Sammlung:** Ab 8 toten Werten am Kopf der Schlange bricht die Runde ab, ohne Stillstandsmeldung (SR-2). Die Dringlichkeit des 1m-Fensters wird an der jüngsten Reihe gemessen, die übrigen Werte verlieren unbemerkt Minuten (SR-10). Ein Feiertag gilt als abgeschlossener Handelstag (SR-7).
- **Alpaca-Weg (livesammler, alpacaarchiv) höchstens B, weil kein Buch `alpaca1m` liest.** Hoch < Tief und ein fehlendes `v` (wird zu 0) werden geschrieben (AA-15, AA-9, LS-14). Zwilling und Kürzel-Neuvergabe werden nicht erkannt (AA-6, AA-8, LS-6).
- **Richtig:** HTTP 200 mit leerem Inhalt zerstört in keinem Lader den Bestand (KU-1, KQ-1, LS-1, AA-1, AR-1); darunter leidet nur die Fälligkeit (SR-1, SR-2). Ebenso richtig: der Intraday-Quote-Stempel (KQ-3, AR-2, LS-3), die Zeitumstellung (KU-3, LS-9, AA-10, AR-9), Halbtage (LS-11, AA-12, SR-8) und Dividenden ohne Kurs (KU-12, KQ-13).
- **Hebel:** Eine Prüfung an einer einzigen Stelle, `Kurse.zerlege` bzw. `hole` für 1d, schließt 4 der 8 A-Funde im Momentum-Buch (KU-2, KU-5, KU-13, KU-14): je New-Yorker Tag ein Balken, flache Umsatz-0-Kerze hinter einem Balken desselben Tags verwerfen und zählen, sortieren und entdoppeln, `meta.symbol` prüfen. Kennzeichnet sie zusätzlich jede flache Umsatz-0-Endkerze, schließt sie auch KU-6 und KU-9.
- **Grenze:** Die Tests belegen fehlende Sperren an nachgebauten Antworten. Wie oft Yahoo und Alpaca diese Formen wirklich liefern, ist nicht gemessen.

## Wie geprüft

- Je Lader eine Testdatei unter `pruefberichte/lader-stoerungen/<lader>.test.js`, gemeinsamer Läufer `pruefberichte/lader-stoerungen.test.js`, gemeinsame Hilfen `pruefberichte/lader-stoerungen/hilfen.js`. Aufruf aus der Repo-Wurzel:
  `node pruefberichte/lader-stoerungen.test.js` (alle), `… KU KQ-3` (Kennungsanfang), `PRUEF_WURZEL=<Ordner> …` (anderer Stand).
- Jeder Test druckt genau eine Zeile `ZEIGT ABWEICHUNG: [ID] …` oder `kein Unterschied: [ID] …`, das Soll folgt aus der Störung, nicht aus dem Code. Jeder Test weist nach, dass er seinen Weg betreten hat (zählende Attrappe), sonst `TEST KAPUTT`. Feste Uhr statt `Date.now()`.
- **Sperren in `hilfen.js`, vor jedem App-Modul geladen:** Netz (http/https/net/tls/dns/fetch/child_process) wirft. Jede schreibende fs-Verrichtung außerhalb eines frischen Wegwerf-Ordners unter `%TEMP%` wirft. `MD_DATEN` und `MD_ALPACA_WURZEL` zeigen in den Wegwerf-Ordner, `MD_ARCHIV*`-Zeiger werden geleert. Nach jedem Test setzt der Läufer Datenordner und Alpaca-Wurzel zurück.
- **Lauf am 05.10.2026:** `--- 83 Tests: 55 zeigen Abweichung, 28 kein Unterschied, 0 kaputt; Netzversuche 0, Schreibversuche ausserhalb 0`, Rückgabewert 0. Der zweite Lauf ist zeichengleich. eslint mit der Repo-Konfiguration: 0 Befunde.
- **Bewertung:**
  - **A:** Falsche Kurse landen im Store und erreichen ein Buch.
  - **B:** Falsche Anzeige oder Messung, auch Archive, die kein Buch speisen.
  - **C:** Schönheit, also Meldung oder Zähler, ohne Datenschaden.
  - **–:** Kein Unterschied.
- **Wege zum Buch:** Momentum- und Drift-Buch holen ihre Kurse selbst über `Kurse.hole` (mittelfrist.js:71 → `mf_tagesdaten`, mfdepot.js:266 Ausführungskurs). Das Intraday-Depot rechnet auf `Archiv.serie` (depot.js:2843). Das Dateiarchiv (`kerzenquelle.js`) und das Alpaca-Archiv (`alpaca1m`) liest kein Buch, nur Viewer, Marktkarte und Studien. Deren Obergrenze ist deshalb B.

## Ergebnis je Störung

| Störung | kurse | kerzenquelle | livesammler | alpacaarchiv | archiv | sammelrunde |
|---|---|---|---|---|---|---|
| S1 HTTP 200, leerer Inhalt | KU-1 – | KQ-1 –, KQ-2 C | LS-1 –, LS-2 C | AA-1 – | AR-1 – | SR-1 C, SR-2 B |
| S2 Quote-Stempel / laufende Kerze | KU-2 **A**, KU-4 –, KU-5 **A** | KQ-3 – | LS-3 –, LS-4 B | AA-2 –, AA-3 C | AR-2 –, AR-3 B | SR-4 B |
| S3 Tagesbalken: Stempel = Eröffnung | KU-3 – | KQ-4 B | LS-5 – | AA-4 – | n. z. | SR-5 – |
| S4 Kürzel gehört neuer Firma | KU-10 **A**, KU-13 **A** | KQ-5 B | LS-6 B | AA-5 –, AA-6 B | AR-4 **A** | SR-9 C |
| S5 Vorgänger-Reihe / Zwilling | n. z. | KQ-6 B | n. z. | AA-7 B, AA-8 B | n. z. | n. z. |
| S6 bereinigt/roh vermischt | KU-7 B, KU-8 **A** | KQ-7 B | LS-7 B | n. z. (tools/) | AR-5 B, AR-6 **A**, AR-7 **A** | n. z. |
| S7 abgemeldete Reihen, flache Kerzen | KU-9 **A** | KQ-8 B | LS-8 C | AA-9 B | AR-8 B | SR-4 B, SR-2 B |
| S8 Zeitzonen-Wechsel | KU-3 – | KQ-9 B (Xetra) | LS-9 – | AA-10 – | AR-9 – | SR-6 C |
| S9 Feiertage | KU-6 **A** | KQ-10 B | LS-10 C | AA-11 C | AR-10 – | SR-7 B |
| S10 halbe Handelstage | n. z. | KQ-11 B | LS-11 – | AA-12 – | AR-10 – | SR-8 – |
| S11 Kursaussetzung | KU-11 C | KQ-12 C | LS-12 C | AA-13 C | AR-10 – | SR-3 – |
| S12 Dividende/Split ohne Kurs | KU-12 – | KQ-13 – | n. z. | n. z. | n. z. | n. z. |
| Weitere: Symbol, Zeitraum, Stempel, Form, Datei | KU-13 **A**, KU-14 **A** | KQ-14 B | LS-13 –, LS-14 B, LS-15 C | AA-14 C, AA-15 B, AA-16 – | AR-11 **A**, AR-12 B, AR-13 –, AR-14 C | SR-10 B |

„n. z.“ heißt, die Störung trifft auf diesen Lader nicht zu. Die Begründung steht im Einzelbericht.

## Funde, schwerste zuerst

### A: falsche Kurse im Store, die ein Buch erreichen

| ID | Störung | Reaktion heute | Datei:Zeile (Kette) | Vorschlag |
|---|---|---|---|---|
| KU-2 | S2 Stempel-Kerze hinter dem Tagesbalken | schreibt still falsch: Tag 2× in `mf_tagesdaten`/`mf_bezug`, fällig 1 Tag zu früh | kurse.js:168 → mittelfrist.js:77 → mfhandel.js:343 | zerlege bei 1d: je NY-Tag ein Balken; flache Umsatz-0-Kerze hinter Balken desselben Tags verwerfen, als `stempelKerzen` zählen |
| KU-5 | S2+S11 laufender Balken ohne Eröffnung | schreibt still falsch: 19/19 Käufe zum laufenden Kurs | kurse.js:166 → mfdepot.js:268 → :423 | `eroeffnung()` nur aus Balken mit Umsatz > 0 |
| KU-6 | S9 Feiertag mit Stempel-Kerze des Tages | schreibt still falsch: Umschichtung an Thanksgiving | kurse.js:189 → mfdepot.js:290 | Handelstag-Beleg nur durch SPY-Balken mit Umsatz > 0 |
| KU-9 | S7 abgemeldete Reihe mit Phantom-Kerze | behält Müll: Reihe endet nie, Position wird nie ausgebucht | kurse.js:168 → mfdepot.js:217 → mfhandel.js:434 | Reihenende am letzten Balken mit Umsatz > 0 messen |
| KU-10 | S4 Kürzel neu vergeben | schreibt still falsch: Reihe ganz ersetzt, Bewertung zum Kurs der fremden Firma | mittelfrist.js:219 → mfdepot.js:244/247 | gemeinsame Tage mit dem Bestand vergleichen; Median-Verhältnis außerhalb 0,5–2 ohne Split → alte Reihe behalten, melden |
| KU-13 | Antwort für anderes Symbol | schreibt still falsch | kurse.js:194/257 → mittelfrist.js:77 | `hole()` verwirft und zählt Antworten mit `meta.symbol` ≠ angefragt (normiert) |
| KU-14 | doppelte/unsortierte Stempel | schreibt still falsch: binäre Suche greift falschen Tag | kurse.js:148–168 → mfhandel.js:306 | zerlege sortiert, entdoppelt (letzter gewinnt), zählt beides |
| KU-8 | S6 adjclose teilweise null | verwirft Gutes: Zeile weg, Buch sieht Vortag | kurse.js:150 → mittelfrist.js:77 → mfdepot.js:244/286 | mit `mitRoh` am `close` festmachen, fehlendes adjclose als null mitgeben, getrennt zählen |
| AR-11 | Kurs 0/NaN/negativ/null, Hoch < Tief | schreibt still falsch (5/5 im Store) | archiv.js:51/224, Zulauf capital.js:253 → depot.js:2843 | in `fuege` dieselbe `kursOk`-Regel wie kurse.js, Hoch/Tief tauschen |
| AR-6 | S6 CFD-Rückfall 60m | schreibt still falsch: Randstunden bleiben; Rasterkipp löscht 35/35 Yahoo-Kerzen | archiv.js:103/126, depot.js:2824 | cap-Kerzen auf die Börsensitzung filtern; Rasterphase nur aus Nicht-cap-Kerzen lernen |
| AR-7 | S6 Split zwischen zwei Abrufen | schreibt still falsch: −75 % an der Fenstergrenze | archiv.js:51, depot.js:6150 | gemeinsame Stempel vergleichen; konstanter Faktor ≠ 1 → umrechnen oder verweigern und melden |
| AR-4 | S4 neue Firma an alte gehängt | schreibt still falsch: −76 %, keine Bruchmarke; fremde Kerzen erfüllen das 261er-Tor | archiv.js:337, depot.js:2843/2864 | Lücke > 20 Handelstage ohne gemeinsamen Stempel → Altbestand abtrennen, melden |

AR-4, AR-6, AR-7 und AR-11 gelten als A nur, wenn der Intraday-Handel eingeschaltet ist (`D.intraday.enabled`, Voreinstellung aus). Sonst fließen dieselben Kerzen in Schattenbuch, benannte Regeln und Edge-Wächter, sind also B. Ob der Handel bei Wilhelm eingeschaltet ist, hat der Test nicht gesehen.

### B: falsche Anzeige oder Messung

| ID | Störung | Reaktion heute | Datei:Zeile | Vorschlag |
|---|---|---|---|---|
| KQ-14 | abgeschnittene Archivdatei | verwirft Gutes: still mit dem Fenster überschrieben, Geschichte weg; nicht atomar | kerzenquelle.js:759/1188/1197 | Datei, die existiert, aber nicht lesbar ist, als Fehler „Archivdatei unlesbar“ verbuchen, nicht schreiben; atomar schreiben (tmp + rename) |
| SR-2 | S1/S7 tote Werte am Kopf | steht still: ab 8 toten Werten bricht die Runde ab, 1d-Archiv wartet, keine Meldung | kerzenquelle.js:1172/1233 → sammelplan.js:276 → sammelrunde.js:40/156 | Fehler bei vorhandenem Stand als leeren Versuch buchen (`versucht`), dann ruht der Wert |
| SR-10 | 1m-Fenster rollt | verwirft Gutes: Dringlichkeit an der jüngsten Reihe, andere verlieren Minuten | kerzenquelle.js:1059, sammelplan.js:321 | Lücke aus dem ältesten `bisTag` der fälligen Werte messen, `verloren` je Wert zählen |
| KQ-4 | S3 laufender Tagesbalken | schreibt still falsch: 3 von 4 Stempelformen archiviert | kerzenquelle.js:289/371 | bei 1d ohne `currentTradingPeriod` die Kerze des laufenden NY-Tags verwerfen |
| KQ-8 / SR-4 / AR-8 | S7 erloschene Reihe | behält Müll: Phantomtage, `bisTag` rückt vor, Reihe „auf Stand“ | kerzenquelle.js:289/1222/983, archiv.js:110/122 | `bisTag` und Annahme an der letzten Kerze mit Umsatz festmachen (wie abmeldungen.js:48) |
| KQ-10 | S9 Feiertagskerze | behält Müll dauerhaft | kerzenquelle.js:289/656 | Kerzen an NYSE-Feiertagen (`Boerse.feiertagAn`) verwerfen |
| SR-7 | S9 Feiertag | Feiertag gilt als abgeschlossener Handelstag | kerzenquelle.js:962/1222 | `letzterAbgeschlossenerHandelstag` über boerse.js rechnen |
| KQ-11 | S10 Halbtag | verwirft Gutes: Schlusskerze fällt bei späteren Umsatz-0-Kerzen | kerzenquelle.js:500 | `spaetesteJeTag` nur aus Kerzen mit Umsatz > 0 |
| KQ-9 | S8 Xetra-60m | verwirft Gutes: 16 von 18 Kerzen | kerzenquelle.js:485/500 | Minute-0-Regel nur bei :30-Gitter des Tages |
| KQ-7 / LS-7 | S6 Split | schreibt still falsch: Sprungpaar ×4 in der Datei; Viewer reiht bereinigt + roh (×10) | kerzenquelle.js:659/313, main.js:2160/2181 | Verhältnis an gleichen Stempeln prüfen; Tagesablage nur an rohe Jahresdatei hängen |
| KQ-5 / LS-6 / AA-6 | S4 Neuvergabe | schreibt still falsch: neue Firma an alte Reihe (×23,8) | kerzenquelle.js:334/659, livesammler.js:72, main.js:1767, alpacaarchiv.js:155/688 | `firstTradeDate` bzw. Naht prüfen (Abstand + Faktor) und „Neuvergabe?“ melden |
| KQ-6 | S5 `meta.symbol` ≠ angefragt, BRK.B/BRK-B | schreibt still falsch: Zwilling | kerzenquelle.js:330/238/793 | `meta.symbol` gegen `yahooName(sym)` prüfen, Dateiname aus einer Schreibweise |
| AA-7 / AA-8 | S5 Zwilling, zerrissene Lebenszeit | meldet nicht; fällt still auf erloschene Reihe | alpacaarchiv.js:143/647 | Lesefehler als `{ok:false}`; Fingerabdruck je Datei, Zwilling melden |
| AA-9 / AA-15 / LS-14 | flache Kerze ohne `v`, Hoch < Tief | schreibt still falsch | alpacaarchiv.js:227/228 | `kerzeAus`: `v > 0` und `l ≤ min(o,c) ≤ max(o,c) ≤ h` verlangen, sonst `form` |
| AR-3 | S2 Stempel genau zur Schlusszeit (1m/5m/15m) | behält Müll dauerhaft (A, sobald Scanner dort) | archiv.js:119/122 | Umsatz 0 und H = T = S zur Sitzungsschlusszeit laut Kalender nicht übernehmen |
| AR-5 | S6 cap-Bereich | verwirft Gutes: `dollarVolTag` null | archiv.js:280 | Quelle je Kerze führen oder Bereich beim Ersetzen verkleinern |
| AR-12 | Rechneruhr ein Jahr vor | verwirft Gutes: 2.340 → 0 Kerzen | archiv.js:141/337 | relativ zur jüngsten Kerze kappen; Uhr > 30 Tage vor → nicht kappen, melden |
| KU-7 | S6 adjclose fehlt ganz | schreibt still falsch: fällt auf close, `feld` liest niemand | kurse.js:144 → driftui.js:120 | Aufrufer prüfen `kd.feld === 'adjclose'` |
| LS-4 | S2 App-Uhr vor → 403 | schreibt angeschnittene Randminute | livesammler.js:486, main.js:1795 | `end` behalten, Grenze zurückziehen, im Panel nennen |

### C: Schönheit (Meldung, Zähler)

KU-11 Umsatz null → 0 (kurse.js:167) · KQ-2 `stand.ohne` bleibt nach Erfolg stehen (kerzenquelle.js:1172/1222) · KQ-12 Docht nicht im Protokoll (:708/1192) · LS-2 `next_page_token` ohne Balken frisst den Deckel (livesammler.js:500) · LS-8 erloschene Reihe jede Runde gefragt (:548) · LS-10 Sonderschließung nur im Quellkalender (:126) · LS-12 Wert ruht nach Aussetzung bis 16:00 (:279) · LS-15 Doppel bei Seitenüberlappung (:498) · AA-3 unfertige Kerze wird festgeschrieben, Korrektur übersprungen (alpacaarchiv.js:688) · AA-11 Tag ohne Kalender dauerhaft „ausserhalb“ (:652/256) · AA-13 Aussetzung ohne Lückenmarke (:270) · AA-14 `uebersprungen` mischt vier Fälle (:689/655) · AR-14 dirty-Marke geht verloren (archiv.js:384) · SR-1 leere 200-Antwort: Wert bleibt ewig fällig (sammelrunde.js:40) · SR-6 Tagesende fest 20:30 UTC (kerzenquelle.js:962) · SR-9 `stand.json` bucht die neue Firma als Fortschritt der alten (kerzenquelle.js:1010). Vorschläge stehen in den Einzelberichten.

## Einzelberichte

Je Lader ein Bericht mit Verbrauchern, Tabelle und Einzelheiten je ID (nachgebaute Antwort, Soll, Ist, Weg zum Buch):
[kurse](lader-stoerungen/kurse.md) · [kerzenquelle](lader-stoerungen/kerzenquelle.md) · [livesammler](lader-stoerungen/livesammler.md) · [alpacaarchiv](lader-stoerungen/alpacaarchiv.md) · [archiv](lader-stoerungen/archiv.md) · [sammelrunde](lader-stoerungen/sammelrunde.md)

## Grenzen und nächste Gegenproben

- **Häufigkeit nicht gemessen.** Alle Antworten sind nach Störungskatalog und Codekommentaren nachgebaut. Ob Yahoo eine flache Umsatz-0-Kerze hinter einen 1d-Balken desselben Tags hängt (KU-2), unsortierte Stempel liefert (KU-14) oder `meta.symbol` abweicht (KU-13), belegt der Test nicht. Er belegt nur, dass keine Sperre davorsteht. Erste Gegenprobe: im Bestand `mf_tagesdaten` (Kopie, nur lesen) doppelte NY-Tage und Umsatz-0-Endbalken zählen.
- **SR-2 auf der echten Platte:** Im `laeufe.log` nach `ABGEBROCHEN: 8 Fehlschlaege` bei `verarbeitet=8` suchen und tote Werte mit Stand zählen. Nicht gemacht, weil der Auftrag keine Kursdaten von der Platte erlaubte.
- **Intraday-Handel:** Ob `D.intraday.enabled` bei Wilhelm an ist, entscheidet, ob AR-4, AR-6, AR-7 und AR-11 A oder B sind.
- **Nicht geprüft:** `depot.js:1773` `getHistory` (Intraday-Depot, 1d roh), `holeViele` und `marktkarteui.js`, Währungswechsel, ob `alpaca1m-bereinigt` nachts neu abgeleitet wird, ein zweiter Schreiber mit liegendem Journal.
- **Die Formulierung „nach Brücken-Neustart zeigt ein Kürzel auf eine andere Firma“** wurde als Kürzel-Neuvergabe an der Quelle geprüft (S4). Zusätzlich wurden die internen Zuordnungen Kürzel → Ordner/Index geprüft, die ein Neustart neu baut: alpacaarchiv `ordnerName`/`abbildung` (AA-5) und die Stillstandsbremse (SR-9). Beide zeigen nach einem Neustart nicht auf eine andere Reihe.
