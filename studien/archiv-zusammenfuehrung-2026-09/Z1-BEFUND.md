# Archiv-Zusammenführung, Stufe Z1 — Zielformat, Migrationswerkzeug, Alpaca-Nachholer

03.09.2026, Rolle Bau + Berechnungen. Auftrag: `wiki/archiv-zusammenfuehrung.md` §5 Z1 (ohne
Fassade — die ist Z1b). Renderer-Code (`archiv.js`, `depot.js`, `backfill.js`) unberührt; geändert
`kerzenquelle.js`, `test-v6.js`; neu `tools/archiv-migration.js`, `tools/alpaca-balken-holen.js`,
`probe-alpaca-balken.js` (hier), die Zählungen `migration-zaehlung.{json,md}`,
`aequivalenz-vor-migration.{json,md}`, `vergleich-nach-z1.{json,md}`.

**Kurz:** Das Format steht und ist geprüft. Die Migration ist gezählt, **nicht geschrieben** — die
Vorbedingung (Rasterfilter R5) ist am 03.09. 14:30 nicht committet, und der Trockenlauf beziffert,
was ein Schreiben ohne sie kosten würde (§3.3). Die Alpaca-Probe ist gebaut, aber **nicht
gefahren** — sie braucht Wilhelms Schlüssel. Der Nachholer ist gebaut und verweigert ohne
bestandene Probe. Alles hier Gezählte ist gezählt, nichts geschätzt.

## 1. Vorbedingung R5 — nicht erfüllt, maschinell geprüft

`kerzenquelle.js rasterFilter()` steht unverändert auf `f9462e4` (27.08.): Minute 0 nur als
späteste Kerze des UTC-Tages, auf jedem Intervall. Kein `rasterfilter-fix-*.md` im
Übergabeordner, kein Commit, kein Zweig (`git ls-remote --heads`), keine fremden Änderungen im
Arbeitsbaum. Der Auftrag sagt „prüfen, sonst abbrechen". Abgebrochen wurde **das Schreiben**; alles,
was nichts schreibt, wurde gebaut und gemessen. Die Prüfung ist keine Textmarke: `r5Behoben()`
in `tools/archiv-migration.js` legt einen Kunsttag (78 Kerzen 5m, 13:30–19:55, plus Schluss) durch
`KQ.rasterFilter` und verlangt, dass alle sechs vollen Stunden stehen bleiben; `--schreiben` und
`--holen` verweigern sonst. Kontrolle G belegt, dass der Fühler beide Zustände unterscheidet
(alte Regel nachgebaut → nein, korrigierte → ja).

## 2. Zielformat (kerzenquelle.js, Format 2)

| Feld | Inhalt |
|---|---|
| `format` | **2** (Format 1 trug hier die Feldliste als Text; die steht jetzt unter `felder`) |
| `felder` | `[zeit, schluss, umsatz, hoch, tief, eroeffnung]` — unverändert sechs Felder, [5] Eröffnung oder `null` |
| `quellen` | `[{ von, bis, quelle, abgeleitet? }]`, Bereiche über Stempel (ms, beide einschließlich), verdichtet über die **vereinigte** Reihe; `quelle` ∈ `yahoo`/`alpaca`/`capital`; `abgeleitet` = `bestand` (Datei ohne quellen gelesen) oder `vergleich-z0` (Migration) |
| `spannen` | optional `{ "YYYY-MM-DD": { n, med } }` — Form von `archiv.js spannenJeTag()`; nie in [5] |

**Quellenpflicht:** `zusammenfuehren(alt, neu, iv, { quellenAlt, quelleNeu, abgeleitetNeu })`
wirft bei nichtleerem `neu` ohne zulässige `quelleNeu`; `satz(sym, iv, serie, meta)` wirft ohne
`meta.quellen`, bei Bereichen, die nicht jede Kerze decken, bei einer Kerze mit ≠ 6 Feldern und
bei unzulässiger Quelle. Fehler, keine Warnung. `huelleLesen(datei)` liest Format 1 und 2; ohne
`quellen` gilt der Bestand als `yahoo` mit Marke `bestand`. Der Sammler (`sammle()`) liest die
Hülle ganz, vereinigt mit `quelleNeu: 'yahoo'` und schreibt `quellen` und `spannen` zurück — beim
ersten Lauf nach dem Release bekommt jede berührte Datei Format 2. Bereiche sind über Stempel
definiert: ein später eingeschobener Alpaca-Balken teilt einen Yahoo-Bereich in zwei (geprüft).

**Krypto:** `istKryptoSym()` (`-USD` am Ende), `ordnerFuer()` → `archiv<iv>/krypto/`,
`archivDateien()` sieht den Ordner. Gleiches Format.

**Eine Nebenwirkung, benannt:** eine Reihe ohne vorhandene Datei lief bisher am Raster vorbei
(erst der zweite Lauf filterte sie); jetzt läuft auch die erste Fassung durch `zusammenfuehren()`.
Damit sind erste und spätere Fassung gleich behandelt — bis R5 behoben ist, heißt das auch: die
erste Fassung einer neuen 5m-/1m-Reihe verliert ihre `:00`-Kerzen sofort statt beim zweiten Lauf.

**Klinken (Block 63, „Format 2"):** 25 Zusicherungen am Verhalten (Formatnummer, beide
Schreiber ohne Quelle → Fehler, unzulässige Quelle → Fehler, Verdichtung, Teilung eines Bereichs,
sieben/fünf Felder → Fehler, `spannen` rührt [5] nicht an, kein `[5] =` im Modul, Rückwärtslesen
Format 1/2, `ohneQuelle()`, Sammler-Schreibpfad, Krypto-Ordner). Block 35 ist auf die zwei neuen
Alpaca-Aufrufer ausgeweitet (Zugang nur über `schluessel.js`, keine Umgebungslesung außer `MD_`,
`sag` durch `verdecken()`, nur `feed=sip`, Leck-Test der Balken-Probe gegen einen Server, der die
Kopfzeilen zurückspiegelt). Die TABU-Klinke (Handelslogik) prüft beide neuen Werkzeuge mit.
`npm test`: **3.127 Zusicherungen, grün.** Gegenproben: §6.

## 3. Migration — gezählt, nicht geschrieben

`node tools/archiv-migration.js <Sicherung> E:/Markt-Dashboard-Archiv --zaehlen` (Kontrollen A–H
davor, alle bestanden). Regel je Kerze wörtlich nach §6 der Karte; Reihenfolge der Prüfung:
gemeinsam → laufend → unvollständig → quote-nach-schluss → cap → außerhalb Gitter → übernehmen.
Sitzungsschluss aus `boerse.js` (Feiertage, Halbtage 13:00 ET) mit Sommerzeit über
`America/New_York` — 21:00 UTC im Winter, 18:00 UTC am Halbtag nach Thanksgiving, `null` am
03.07.2026. Krypto ohne Kalenderregel. Der Trockenlauf rechnet die Vereinigung im Speicher durch,
also **mit** Raster — die zwei Verlust-Spalten sind der Preis von R5.

### 3.1 Zählung je Grund und Intervall (alle 799 Reihen der Sicherung)

| Intervall | gemeinsam (Datei gewinnt) | laufend | unvollständig | Quote am Schluss / danach | cap (verworfen, Entscheid 2) | außerhalb Gitter | **übernehmen** (Aktien / Krypto) | neue Dateien |
|---|---|---|---|---|---|---|---|---|
| 1m | 548.621 | 0 | 0 | 593 / 0 | **2.824.780** | 0 | **434.869** (210.424 / 224.445) | 8 (Krypto) |
| 5m | 813.006 | 50 | 0 | 604 / 0 | 73.389 | 0 | **257.060** (90.156 / 166.904) | 9 (Krypto + NET) |
| 15m | 285.923 | 62 | 0 | 629 / 0 | 16.120 | 0 | **78.416** (22.760 / 55.656) | 9 (Krypto + NET) |
| 60m | 975.052 | 70 | 723 | 0 / 0 | 0 | 0 | **144.827** (2.507 / 142.320) | 8 (Krypto) |

- **Quote-Kerzen** liegen ausnahmslos **am** Sitzungsschluss (20:00 UTC, Umsatz 0, flach), keine
  danach. Eine 20:00-Kerze **mit** Umsatz wäre übernommen worden (Kontrolle E) — es gab keine.
- **unvollständig (60m, 723):** ARM, ORCL, QCOM je 241 Drei-Feld-Kerzen ab 16.07. 23:00 UTC — genau
  Capitals Randstunden aus Z0 §3.5 Befund 2; sie liegen alle in `capBereiche` und wären auch
  als `cap` verworfen worden.
- **laufend** 0/50/62/70: die Kerzen, deren Eimer bei `updatedAt` offen war (#85).
- Keine mehrdeutige Abbildung; `BRK-B` → `BRK.B` bei genau einem Treffer. EA, CCEP, CSGP, FAST
  haben inzwischen eine 1m-/5m-Datei (der 1m-Lauf vom 03.09. 07:01 holte 519 Werte); nur NET
  hat auf 5m/15m keine.

### 3.2 Was die Vereinigung im Speicher ergibt

| Intervall | dazu (netto) | Verlust **Datei** durch das Raster | Verlust **Übernahme** durch das Raster (Aktien / Krypto) |
|---|---|---|---|
| 1m | 420.867 | 40 (NET) | 13.962 (10.218 / 3.744) |
| 5m | 194.824 | 0 | 62.236 (48.324 / 13.912) |
| 15m | 16.367 | **42.886** (357 je Reihe, 120 Reihen) | 19.163 (5.251 / 13.912) |
| 60m | 8.451 | 0 | **136.376** (0 / 136.376) |

### 3.3 Drei Befunde aus dem Trockenlauf

1. **R5 in Zahlen.** Auf 5m sind es je Reihe 420 der 852 nur-Store-Kerzen (70 Tage × 6 volle
   Stunden), die das heutige Raster beim Schreiben wieder entfernte; auf 15m würde der Lauf der
   **Datei selbst** 42.886 Kerzen nehmen — die `:00`-Kerzen, die sie nur noch hat, weil sie seit
   26.08. nicht geschrieben wurde. Das ist der Datenschaden, den die Vorbedingung verhindert;
   deshalb verweigert `--schreiben`, statt zu warnen.
2. **Krypto passt nicht durch das Raster — auch nach dem R5-Fix nicht, wie er beschrieben ist.**
   Yahoos Krypto-Stundenkerzen liegen rund um die Uhr auf `:00`; die Minute-0-Regel des 60m-Rasters
   lässt je UTC-Tag eine davon stehen: 136.376 von 142.320 Kerzen (95,8 %) fielen. Auf 1m/5m/15m
   fallen die vollen Stunden (R5). Ein Fix, der die Minute-0-Regel nur auf 60m beschränkt, rettet
   die Aktien, nicht die 60m-Krypto-Reihen. `rasterFilter()` kennt das Symbol nicht; Entscheid 4
   (eigener Ordner) braucht also eine Rasterregel, die für Krypto jede volle Stunde als Gitter
   nimmt — **Wilhelms/PMs Entscheid, vor dem Krypto-Teil der Migration.** Das Werkzeug kann
   Krypto mit `--symbole` ausklammern.
3. **Nichts wurde geschrieben.** Sicherung unangetastet (Manifest-Prüfsummen unverändert, die
   Dateien wurden nur gelesen), lebender Store weder gelesen noch geschrieben (Pfadprüfung im
   Werkzeug), keine Datei auf E: verändert.

### 3.4 Äquivalenztest (vor der Migration; auf gemeinsamen Stempeln danach identisch)

`--aequivalenz`: alle Reihen mit Datei, alle gemeinsamen Stempel außer dem letzten des Stores,
`signifikant(Datei, 7) === Store` (Umsatz `Math.round`). Abweichungen nach Grund.

| Intervall | Reihen mit Datei | gemeinsam | Feld | gleich roh | gleich nach Rundung | cap | ≤ 1 ppm | Nachkorrektur | max. |
|---|---|---|---|---|---|---|---|---|---|
| 1m | 191 | 548.474 | schluss | 21.679 | 485.131 | 41.419 | 0 | **245** | 0,145 % |
| | | | umsatz | 481.387 | 0 | 54.347 | 0 | 12.740 | Faktor ≠ 1 |
| 5m | 188 | 812.935 | schluss | 29.338 | 674.600 | 108.856 | 0 | **141** | 0,483 % |
| | | | umsatz | 665.486 | 0 | 131.232 | 4 | 16.213 | |
| 15m | 188 | 285.889 | schluss | 10.164 | 236.137 | 39.409 | 0 | **179** | 0,419 % |
| | | | umsatz | 230.290 | 0 | 47.825 | 37 | 7.737 | |
| 60m | 191 | 974.923 | schluss | 39.326 | 934.093 | 0 | 0 | **1.504** | 1,158 % |
| | | | umsatz | 968.659 | 0 | 0 | 62 | 6.202 | |

Hoch/Tief liegen auf demselben Niveau (max. 4,753 % bei je einem 5m-/15m-Stempel). Lesart wie in
Z0: außerhalb `capBereiche` erklärt die 7-Stellen-Rundung fast alles, der Rest (0,04–0,15 % der
Stempel im Schluss) ist Yahoos Nachkorrektur; im Umsatz 1,5–2,7 %. Innerhalb `capBereiche`
bleibt die Sorte „war einmal CFD" — der Test zählt sie getrennt, entscheidet dort nichts. Volle
Tabelle: `aequivalenz-vor-migration.md`. Nach einem Schreiben ändert sich an gemeinsamen
Stempeln nichts (Datei gewinnt); die übernommenen Stempel sind dann per Konstruktion gleich.

### 3.5 `tools/archiv-vergleich.js` erneut, Saat 20260903

Identisch mit Z0 (`vergleich-nach-z1.md` gegen `vergleich-tabellen.md`): 42.797 / 57.751 /
19.792 / 51.100 gemeinsame Stempel, dieselben Abweichungszahlen. Erwartet — es wurde nichts
migriert; die Stichprobenpaare haben sich seit 13:39 nicht verändert.

## 4. Alpaca-Balken-Probe (Schritt 0) — gebaut, nicht gefahren

`probe-alpaca-balken.js`: AAPL, MU, ARM, ORCL, BRK.B × 2016-06-01, 2020-06-03, 2024-06-05,
2026-08-27 × 1Min, 5Min, 1Hour (60 Abrufe + Kalender + `BRK-B`-Gegenprobe). Prüft HTTP-Status,
Tarif (401/403/422), Ratengrenze, geliefertes = angefragtes Jahr (iex-Falle), Sekunde 0, erster
regulärer Balken = Öffnung laut `/v2/calendar`, Vor-/Nachbörse, Balkenzahl (390/78), gegen die
Yahoo-Datei desselben Tags: gemeinsame Stempel, Schluss (Median, Max, Anteil > 0,1 %),
Umsatz-Faktor; ARM 2016/2020 muss leer sein. Kriterien stehen im Code **vor** dem Lauf; das
Urteil (`urteil.bestanden`) geht als `probe-alpaca-balken-ergebnis.json` auf die Platte und ist die
Freigabe für den Nachholer. Zugang nur über `schluessel.js` der Spannen-Studie; Leck-Test
bestanden (in der Suite). **Wilhelm startet sie:**

    node studien/archiv-zusammenfuehrung-2026-09/probe-alpaca-balken.js

## 5. Alpaca-Nachholer (Schritt 3) — gebaut, verweigert ohne Freigabe

`tools/alpaca-balken-holen.js`: Symbole aus `manifest.json` ohne Krypto, je Reihe die
`capBereiche` ihrer Store-Datei, 1Min/5Min/15Min, `feed=sip&adjustment=raw`, reguläre Sitzung
laut `/v2/calendar`, iex-Wache (Balken außerhalb des angefragten Zeitraums werden gezählt und
verworfen), **Datei gewinnt** (gemeinsame Stempel werden verglichen, nicht überschrieben — das
ist die Äquivalenzkontrolle Alpaca gegen Yahoo, `--pruefen`), Schreiben nur über
`zusammenfuehren()`/`satz()` mit Quelle `alpaca`, atomar, unter Sammler-Sperre, Ratenbremse
180/min, fortsetzbar (`E:/Markt-Dashboard-Archiv/alpaca-balken-fortschritt.json`). Kontrollen
A–E bestanden.

**Gezählt:** 1m 133 Symbole / 661 Aufgaben / 833 Abrufe · 5m 133 / 457 / 457 · 15m 119 / 389 /
389 — **1.507 Aufgaben, 1.679 Abrufe, ~10 min** bei 180/min, plus ein Kalenderabruf. Wilhelm
startet ihn (nach bestandener Probe und R5-Fix):

    node tools/alpaca-balken-holen.js E:/Markt-Dashboard-Archiv/store-sicherung-2026-09-03 E:/Markt-Dashboard-Archiv --holen

## 6. Gegenproben

Jede neue Zusicherung wurde in einer **isolierten Kopie** (`git archive` + die geänderten Dateien,
nie der geteilte Arbeitsbaum) einmal gezielt gebrochen und die Suite gefahren: **28 Eingriffe,
26 sofort rot, 2 zunächst grün — beide Klinken geschärft, danach 28 von 28 rot.**

- **G20 (Leck-Test der Balken-Probe ohne `verdecken()`) blieb grün**, weil die drei Leck-Tests
  in Block 35 dieselbe Zusage abwarteten und verschachtelt liefen: der erste, der `stdout`
  zurücksetzte, riss die Haken der anderen mit — der Z1-Test bestand mit der verdeckten Ausgabe
  des Nachbarn. Das betraf auch den zusatzC-Leck-Test (Bestand). Jetzt eine Kette
  (`leckDurchreiche` → `leckSpannen` → `leckZ1` → zusatzC). Form: „die Prüfung, die etwas anderes
  prüft" — nachgetragen in `wiki/fehlerformen.md`.
- **G17 (Nachholer schreibt mit Quelle `yahoo` statt `alpaca`) blieb grün**, weil die Klinke das
  Wort in der ganzen Datei suchte und die Positivkontrolle es auch enthält; sie sitzt jetzt am
  Schreibpfad und verlangt zudem, dass kein anderes `quelleNeu` vorkommt.

Liste der Eingriffe (Datei → gebrochen → rot gewordene Zusicherung): Formatnummer, Quellenpflicht
in `zusammenfuehren()` und `satz()`, Sieben-Feld-Kerze, `[5]`-Zuweisung, Marke `bestand`,
Krypto-Ordner (zwei), Sammler-Quelle, cap-Regel (zwei Klinken), Quote-am-Schluss, R5-Wache,
Marke `vergleich-z0`, direktes `writeFileSync`, `feed=iex`, Freigabe-Wache, Quelle am Schreibpfad,
Sitzungsgrenze `[open, close)` (zwei), Umgebungs-Alias, `sag` ohne Verdeckung (zwei), eigener
Schlüsselzugang, TABU-Wort, Verdichtung ohne Ableitungsmarke, iex-Zeitraumwache, Herkunft je Kerze.

## 7. Was NICHT gemacht wurde

- **Kein Schreiben in die Dateisammlung** (R5 nicht behoben; Werkzeug verweigert selbst).
- **Keine Probe, kein Nachholer-Lauf** (Schlüssel bei Wilhelm).
- **Kein Nachtrag in §6 Punkt 2** mit einem Probe-Ergebnis — es gibt keins; dort steht, was
  die Probe prüft und wo ihr Urteil landet.
- **Keine Fassade** (`window.Archiv`), kein Renderer-Code, kein Handelscode.
- **Drei-Feld-Kerzen** (723, alle 60m, alle cap) werden auch künftig nicht übernommen.
- **Krypto-Migration** hängt an der Rasterregel (§3.3, Punkt 2).
- **`tools/sicherung.js`** schließt `bars_*.json` weiter aus (Z0-Hinweis, nicht Z1).
