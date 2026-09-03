# Die zwei Kursarchive — Karte, Risiken, Plan der Zusammenführung

*Stand 03.09.2026 (PM). Entscheid Wilhelm 03.09. (Formular): **zusammenführen**, nicht nur
benennen. Grundlage: Code-Karte vom 03.09. (Explore-Agent, Zeilenanker Stand dieses Tags),
`uebergabe/oberflaeche-stufe4-2026-09-03.md` §5.1. Alle Zahlen unten sind gemessen, nicht
geschätzt, sofern nicht anders gesagt.*

## 1. Befund: es sind ZWEI Archive, nicht drei — und eines ist auf 1 Minute die einzige Kopie

| # | Archiv | Ort | Intervalle | Umfang 03.09.2026 |
|---|---|---|---|---|
| **(1) Renderer-Store** | `archiv.js` → `store/bars_<iv>_<sym>.json` unter `%APPDATA%/Markt-Dashboard/store` (eine Datei je Symbol×Intervall) | 1m, 5m, 15m, 60m | 799 Dateien, **259 MB**; je 200 Reihen bei 1m/5m/15m, 199 bei 60m |
| **(2) Dateisammlung** | `kerzenquelle.js` → `<Zeiger>/archiv<iv>/[etf/]bars_<iv>_<sym>.json`; die Zeigerdateien `archiv1d-pfad.txt`/`archiv60m-pfad.txt` im Datenordner zeigen auf **`E:/Markt-Dashboard-Archiv/`** | 1m, 5m, 15m, 60m, **1d** | 1d 2.965+31 ETF (1,3 GB), 60m 2.885+31 (1,3 GB), 5m/15m 491+31, 1m klein |

**Das vermutete dritte „Studienarchiv auf E:" ist (2).** `kerzenquelle.js:82–90` löst alle
Intervallordner als Geschwister des Zeigerziels auf; App-Sammler (`main.js sammelLauf`),
`tools/yahoo-60m-holen.js` und `tools/archiv-nachladen.js` schreiben dieselben Dateien mit
demselben Code. `wiki/datenquellen.md` führt sie als eine Familie — **der Renderer-Store kommt
dort gar nicht vor.**

**Asymmetrie (AAPL, 03.09.):** 60m Store 740 Tage / Datei 736 Tage (Store ⊂ Datei in der
Breite: 199 gegen 2.885 Reihen). **1m: Store 69 Tage, Datei 12 Tage** — Yahoo gibt nur 7 Tage
zurück, der Store ist dort **unwiederbringlich die einzige Kopie**. `tools/sicherung.js:86`
schließt `bars_*.json` von der Sicherung aus („die App lädt sie selbst nach") — **für 1m
falsch.**

## 2. Formate und die vier echten Datenrisiken

| | (1) Store | (2) Datei |
|---|---|---|
| Hülle | `{ series, updatedAt, capBereiche? }` | `{ sym, quelle, format, waehrung, boerse, stand, series }` |
| Kerze | **5** Felder `[t, schluss, umsatz, hoch, tief]` | **6** Felder `[…, eroeffnung]` |
| Genauigkeit | 7 signifikante Stellen (`schlank()`), Volumen gerundet | Rohwerte |
| Zeit | ms UTC, Eimer-Öffnung, derselbe Parser `kurse.js:121` | identisch |
| Letzte Kerze | **enthält die laufende Kerze bewusst** (`archiv.js:322`) | **schneidet sie ab** (`fertigeKerze()`, #85) |
| Raster | Phase aus der Reihe gelernt, löscht nur bei Konflikt | festes Gitter, löscht unbedingt |
| Quellmarke | `capBereiche` (CFD-Volumen von Capital, Faktor ~400–500) — **388 von 799 Reihen**, auf 1m/5m je 133 von 200 | **Feld existiert nicht** |
| Element [5] | `capital.js:325` schreibt dort die **Geld-Brief-Spanne** (erreicht den Store nur nicht, weil `schlank()` sie abschneidet) | **Eröffnungskurs** |
| Schreiben | atomar (tmp+rename), `.defekt`-Rettung, Backups | nacktes `writeFileSync`, Sperre `_laeuft.json` (PID+Rechner+6 h) |
| Symbolname | `.`→`_` (`BRK.B` = `BRK_B`), nicht umkehrbar | unverändert |

**Die vier Risiken, die eine naive Vereinigung zu Datenschaden machen:**
- **R1 Element [5]:** Spanne (Capital) gegen Eröffnung (Datei). Eine 6-Feld-Vereinigung verwechselt beides.
- **R2 `capBereiche`:** ohne das Feld mischt die Datei CFD- und Börsenvolumen — der Schaden, gegen den `kerzenquelle.js` gebaut wurde (66 unbrauchbare Reihen, siehe [fehlerformen.md](fehlerformen.md)); `dollarVolTag()` liefert `null` statt einer falschen Zahl nur, wenn die Marke da ist.
- **R3 laufende Kerze:** Store und Datei sind an der letzten Kerze nie deckungsgleich; die Store-Reihe wandert mit jedem Abruf.
- **R4 Felder/Genauigkeit:** nur die Richtung Datei→Store ist verlustfrei; `===`-Vergleiche zweier Fassungen schlagen fehl.

## 3. Leser und Schreiber des Stores (alle über `window.Archiv`, alle im Renderer)

**Leser (9):** `intradayScan()` `depot.js:2713` (5m, `slice(-800)`, Signal ab 261; **Handelspfad**) ·
`loadLabData()` `:4686` (1m/5m/15m/60m, >200; Nachtmessung) · Edge-Wächter `edgeZustand()` `:5871`
(60m, ≥300) · `zucht.js:46` · `zeigeKryptoStand()` `:2243` · `strategiechart.js:160` ·
`backfill.js` (60m Referenz) · Abdeckung → `EXPORT_ABDECKUNG` `depot.js:6251` · `berichte.js:241/259`.

**Lesen den Store NICHT:** `btpool.js`/`bt-worker.js` (Karte wird hereingereicht), `backtestui.js`
(`hist_*`), `wendeui.js`, `explorer.js`, Marktkarte, Regime-Tor (`spyTrendAuf()` direkt Yahoo).

**Schreiber (alle über `Archiv.fuege()` → `storeSet`):** `intradayScan()` (5m, Marke `'cap'` nur bei
Capital-Quelle) · `loadLabData()` · `pilotMessen()` (1m-Nachtsammlung, 7 Tage) · `kryptoSammeln()` ·
`backfill.js` Stufe 0 (60m, Yahoo, **ohne** `'cap'` — Klinke 38) und Hauptlauf (1m/5m/15m, `'cap'`) ·
`capBackfill()` `depot.js:4647`.

**Namensfalle in `tools/`:** `abdeckung-pruefen.js`, `stammdaten-holen.js:73`, `wertpapierarten-holen.js:82`,
`massive-verschwundene.js:81` lesen `bars_60m_*` aus dem **Datei**archiv über Variablen namens `STORE`.

**Sperrklinken (test-v6), die wörtlich am Store hängen:** 33) 3199–3207 (`window.Archiv.serie(cfg.interval` /
`archS.slice(-800)` / `Archiv.fuege(cfg.interval`), 34) 3170, 32) 3111–3164 (`capBereiche`, `dollarVolTag` → `null`),
38) 3827–3828, 43) 6133, 63) 10532–10537 (`fertigeKerze` NUR in `kerzenquelle.js`), 63) 11667–11674 (TABU-Regex
gegen Sammler-Dateien), 66) 13325–13483. Sie werden umgeschrieben, nie abgeschwächt.

## 4. Zielbild

**Ein Archiv: die Dateisammlung auf E:, Format erweitert.** Kerze bleibt 6 Felder mit
[5] = Eröffnung; die Hülle bekommt `quellen` (Bereiche mit Quelle `yahoo`/`capital`, Nachfolger von
`capBereiche`) und Spannen aus Capital wandern in ein eigenes Feld, nie in [5]. **Das Archiv hält
nur fertige Kerzen** (#85); die laufende Kerze bleibt im Speicher des Lesers. Alle Renderer-Zugriffe
laufen über die Fassade `window.Archiv`, die im Hauptprozess liest und schreibt (Muster:
`main.js archivAbdeckung()`), mit atomarem Schreiben und einer gemeinsamen Sperre mit dem Sammler.
Der Store wird zuletzt stillgelegt, nachdem die 1m-Tiefe nachweislich übernommen ist.

**Grundsätze:** Leser zuerst, Schreiber zuletzt (solange nur gelesen wird, ist jeder Schritt
umkehrbar). Nach jedem umgehängten Leser ein Vergleichslauf: alte gegen neue Quelle, dieselben
Signale, dieselben Zahlen — sonst Halt. Der Live-Scan zuletzt (Handelscode, Wilhelms Einzelentscheid
je Schritt). Nichts wird gelöscht, bevor es nicht an anderer Stelle nachweislich liegt.

## 5. Stufen

| Stufe | Inhalt | Zustand |
|---|---|---|
| **Z0 Sicherung & Vermessung** | Store vollständig nach E: sichern (259 MB, Prüfsumme); Überlappung Store ⋂ Datei stempelweise messen (12 Symbole je Intervall: gemeinsame Stempel, Abweichungen in schluss/umsatz/hoch/tief, getrennt für Reihen mit `capBereiche`, Abstand der letzten Kerze); Befund als `studien/archiv-zusammenfuehrung-2026-09/BEFUND.md`; Vorschlag der Vereinigungsregel je Feld. **Kein App-Code.** | **geliefert 03.09.** — Sicherung 799/799 (259,4 MB, SHA-256, `E:/Markt-Dashboard-Archiv/store-sicherung-2026-09-03/`), Befund und Vorschlag in `studien/archiv-zusammenfuehrung-2026-09/BEFUND.md`, Kernzahlen in §7, Übergabe `uebergabe/archiv-z0-2026-09-03.md` |
| **Z1 Zielformat, Migrationswerkzeug, Nachholer** | Dateiformat 2 mit `quellen` je Kerze (kerzenquelle.js); `tools/archiv-migration.js` (Regel je Kerze nach §6, Trockenlauf, Äquivalenztest); Alpaca-Probe und `tools/alpaca-balken-holen.js` | **Format geliefert 03.09.**, Klinken grün (3.127); **Migration gezählt, nicht geschrieben** — Vorbedingung R5 nicht committet, das Werkzeug verweigert `--schreiben` selbst; **Probe gebaut, nicht gefahren** (Wilhelms Schlüssel); Nachholer gebaut, 1.679 Abrufe gezählt. Befund `studien/archiv-zusammenfuehrung-2026-09/Z1-BEFUND.md`, Übergabe `uebergabe/archiv-z1-2026-09-03.md`. **Neu: Krypto passt auch nach dem R5-Fix nicht durch das 60m-Raster** (§7) |
| **Z1c Alpaca-Vollsammlung** | `tools/alpaca-vollsammlung.js`: 1Min-SIP-Balken 2016–heute für eingefrorenes Universum + Verschwundene (Lebenszeit aus den Balken, Kürzel-Wiederverwendung als `~2`-Reihe) + 31 ETFs, ohne Krypto; alle Handelsstunden mit Sitzungsmarke; Format 2 mit Quelle `alpaca`, eine Datei je Symbol-Jahr unter `alpaca1m/`, Manifest, fortsetzbar, Ringverteilung jüngstes Jahr zuerst, Bremse 170/min (Rate teilt sich mit kosten.js); Kontrollen im Testlauf (≈390 Balken je Tag, Yahoo-Äquivalenz, Feiertag = 0, Lebenszeit) | **GEBAUT und im Testlauf bestanden 03.09.** — Werkzeug, Maßnahmen-Probe, Sperrklinken und Gegenproben stehen; **Vollauf noch nicht gefahren** (nachts in Wilhelms Terminal). Universum **8.345 Werte** (3.232 Universum + 31 ETF + 5.082 Verschwundene; die 31 ETFs stehen sämtlich schon im Universum, 258 Werte in beiden Listen = eine Reihe, und die Verschwundenen-Liste führt 18 Kürzel doppelt). **Gezählt statt geschätzt:** Phase L gefahren (8.345 Abrufe, 0 Fehler) — die Quelle führt **8.055** Werte, 290 nicht (davon 184 restlos alle Kürzel mit Kleinbuchstaben: Bezugsrechte und Vorzüge schreibt Alpaca anders); **3 Fälle Kürzel-Wiederverwendung** (AAC, CAPA, JONE — alle drei Kürzel diesen August neu vergeben). Stichprobe von 60 Symbol-Jahren: **242,6 Balken je Handelstag, 46,3 Bytes je Kerze** → **2,9 Mrd Kerzen, 343.639 Abrufe, 33,7 Stunden, 134,6 GB** über 52.892 Symbol-Jahre. **Phase M gefahren** (8.345 Abrufe, 0 Fehler, 111.523 Sätze): 1.480 Werte (17,7 %) bekommen eine bereinigte Kopie, **177 (2,1 %) keine** (Abspaltung ohne Kursfaktor) — die Lücke ist damit beziffert statt benannt. **Maßnahmen-Endpunkt trägt auf der Gratisstufe und reicht bis 2016** — Splits mit exaktem Faktor (MNST 1→2 ex 11.08.2026 = **2,000**, dieselbe Zahl wie die Skalenreparatur unabhängig aus den Kursen), **Abspaltungen ohne Kursfaktor** (nur Stückverhältnis, an 7 Fällen geprüft) → betroffene Werte bleiben aus der bereinigten Kopie und werden gelistet. Testlauf: MNST roh/Yahoo **2,000000** vor dem Split / **1,000000** danach, bereinigt/Yahoo **0 von 64 Tagen** außerhalb 0,999–1,001 (max 1,45·10⁻⁸); SPGI roh/Yahoo **1,057000** vor der Abspaltung; 390 reguläre Balken je Volltag, **210 an allen drei Halbtagen**; 801.442 Stempel auf der vollen Minute, 0 Verstöße; Placebo 10 Feiertage, 0 reguläre Balken. **13 Gegenproben, 13-mal rot.** Befund `studien/alpaca-vollsammlung-2026-09/BEFUND.md`, Format und Fallen in [datenquellen.md](datenquellen.md) |
| **Z1-Schreiben: Migration ausgeführt** | `--schreiben` 03.09. 17:41 (PM), `--aequivalenz` danach | **erledigt 03.09.** — 653 Dateien, 34 neu, übernommen 434.869 / 257.060 / 78.413 / 144.827, Rasterverlust 0; Äquivalenz unverändert gegen Z1 (Protokolle im Studienordner). Der Store bleibt bis Z4 unangetastet |
| **Z1-Nachholer ausgeführt** | `--holen` 03.09. 17:48–17:58 (PM, Schlüssel aus Wilhelms Benutzerprofil an den Prozess durchgereicht, nie angezeigt), `--pruefen` danach | **erledigt, mit Befund:** 1.507 Aufgaben, 1.896 Abrufe, 0 Fehler, 2.954.499 Balken geschrieben (die `:00`-Kerzen, die das alte Raster gelöscht hatte, plus cap-Bereiche). Prüfung: 1m Quelle stimmt (238/95.144 über 0,1 %, max 0,38 %); 5m/15m formal ABWEICHUNG (2,1 %) — **Ursache: zwei Werte mit Kapitalmaßnahme im Fenster: MNST Split 2:1 am 11.08.2026 (Verhältnis 0,5 an 577 Bereichsgrenzen, 66 % der Kerzen), SPGI Abspaltung ~Anfang Juli (Faktor 0,92–0,95 an 241 Grenzen).** Yahoo rechnet Intraday rückwirkend um, Alpaca `adjustment=raw` nicht → in `bars_{1m,5m,15m}_MNST/SPGI.json` liegen Alpaca-Kerzen auf der falschen Skala (Sprungpaare, siehe [[skalenfehler-sprungpaare]]). IDXX/BIIB/NXPI 2,2–2,95 % mit max < 0,7 % = Rauschen wie ARM. Übrige 65 Werte normal. Protokolle `nachholer-holen-2026-09-03.log`, `nachholer-pruefen-2026-09-03.log`, je Wert in `E:/Markt-Dashboard-Archiv/alpaca-balken-fortschritt.json` (`vergleichSym`). **Vollsammlung wartet auf Entscheid zur Skalenkonvention (§6 Punkt 8).** |
| **Z1-Skalenreparatur (MNST, SPGI)** | `skalen-probe-alpaca.js` (welche Bereinigung entspricht Yahoo?), `--ersetze-alpaca` in `tools/alpaca-balken-holen.js`, Skalenprüfung in `--pruefen` | **erledigt 03.09.** — **Keine Alpaca-Bereinigung entspricht Yahoo** (§6 Punkt 8, Tabelle in [datenquellen.md](datenquellen.md)); nach Kriterium K4 der Probe wird `raw` geholt und mit dem **je Wert und Tag geeichten** Faktor gerechnet. Eichung gemessen: **MNST 2,000000 bis 10.08., 1 ab 11.08.; SPGI 1,057000 bis 30.06., 1 ab 01.07.** — Umsatz unangetastet (Yahoo bereinigt Intraday nur die Kurse). **46.955 Kerzen in sechs Dateien ersetzt** (1m 22.617/22.614, 5m je 732, 15m je 130), Stempelmenge unverändert, 9.212 Yahoo-Kerzen Feld für Feld gleich, kein Umsatz geändert, keine Kerze hat die Quelle gewechselt. Sicherung vorher nach `E:/Markt-Dashboard-Archiv/sicherung-vor-ersetzen-2026-09-03/` (SHA-256, zurückgelesen). **Skalenabweichungen 68 → 0**, durchgefallene Werte 5 → 3 (BIIB/IDXX/NXPI, reines Rauschen wie bisher), alle drei Intervalle jetzt „Quelle stimmt" (über 0,1 %: 15m 2.063 → 297, 5m 5.819 → 929, 1m 238). Protokolle `ersetzen-{trockenlauf-,}2026-09-03.{json,log}`, `pruefen-nach-ersetzen-2026-09-03.log`, unabhängige `ersetzen-nachpruefung-2026-09-03.log` (gegen die Sicherung, dazu das Tagesarchiv als dritte Quelle) |
| Z1b Fassade | `window.Archiv` liest über IPC aus den Dateien, Rückfall Store; Äquivalenztest je umgehängtem Leser | offen |
| Z2 Leser umhängen | Reihenfolge: zucht → strategiechart → Abdeckung/Export → Edge-Wächter (60m) → loadLabData → **intradayScan zuletzt** (Einzelentscheid); je Schritt Vergleichslauf | offen |
| Z3 Schreiber umhängen | kryptoSammeln → pilotMessen (1m) → loadLabData → backfill/capBackfill → intradayScan; Schreiben über den Hauptprozess, atomar, mit Sammler-Sperre | offen |
| Z4 Store stilllegen | erst wenn 1m-Tiefe in den Dateien liegt und kein Leser mehr am Store hängt; `tools/sicherung.js` anpassen; `tools/`-Variablen `STORE` umbenennen | offen |

## 6. Entscheidungen, die Wilhelm gehören

**Entschieden 03.09.2026 (Formular nach Z0):**

1. **Grundregel angenommen:** Datei gewinnt bei gemeinsamem Stempel in schluss/hoch/tief/umsatz; laufende Kerze und Quote-Kerzen nach Sitzungsschluss (Kalender, nicht „20:00") werden nicht übernommen; Quelle je Kerze aus dem Vergleich (`quellen`-Bereiche, verdichtet).
2. **CFD-markierte Store-Kerzen: verwerfen und neu holen.** Die 1m-Tiefe (2,9 Mio cap-markierte Kerzen, Herkunft vor dem 18.08. nicht feststellbar) kommt nicht ins Archiv. Ersatz: **Alpaca-SIP-Minutenbalken** (`/v2/stocks/bars`, `timeframe=1Min`, `feed=sip`, gratis seit 2016 wie die Quotes) — Probe Schritt 0 in Z1; fällt sie durch, bleibt die 1m-Tiefe bei den 23 % Yahoo-Kerzen, und das steht dann hier.
   *Nachtrag Z1 (03.09.):* Die Probe liegt als `studien/archiv-zusammenfuehrung-2026-09/probe-alpaca-balken.js` (AAPL, MU, ARM, ORCL, BRK.B × 2016/2020/2024/2026 × 1Min/5Min/1Hour; Kriterien im Code **vor** dem Lauf: kein Tarif-Nein, geliefertes = angefragtes Jahr, Stempel = Balkenöffnung auf 09:30 ET laut `/v2/calendar`, 380–390 Balken je Tag, gegen die Yahoo-Datei Schluss median ≤ 0,1 % und Umsatz-Faktor 0,8–1,25, ARM vor 09/2023 leer). **Noch nicht gefahren** — sie braucht Wilhelms Schlüssel. Ihr Urteil landet als `probe-alpaca-balken-ergebnis.json` und ist die maschinelle Freigabe für `tools/alpaca-balken-holen.js` (1.679 Abrufe gezählt, ~10 min). Das Ergebnis wird hier nachgetragen, sobald es eins gibt.
   *Ergebnis der Probe (03.09. 16:22 MESZ, Wilhelms Terminal, `probe-alpaca-balken-ergebnis.json`):* **`bestanden: false` — ein Kriterium von acht gefallen, die übrigen sieben bestanden.** Tarifabweisungen 0, Netzfehler 0, falsches Jahr 0, 54 Abrufe mit Balken / 6 leer (ARM vor 09/2023, wie erwartet), Öffnung als Stempel ja, 390 reguläre 1Min-Balken je Tag, Vor-/Nachbörse kommt mit (AAPL 2016: 117 vor, 112 nach), Tiefe 2016–2024 ja. Umsatz-Faktor Median 1,000–1,009 (alle fünf Werte). Schluss gegen die Yahoo-1m-Datei am 27.08.2026: Median-Abweichung 1,5–3,2 · 10⁻⁸ bei allen fünf Werten, Maximum ORCL 2 · 10⁻⁷, BRK.B 0,05 %, AAPL 0,02 %, MU 0,10 %, **ARM 0,18 % — und bei ARM liegen 9 von 383 Minutenkerzen über 0,1 % (2,35 %), erlaubt waren 2 % (7,66); auf 5Min 2 von 72 (2,8 %).** 1Hour: Alpaca legt Stundenbalken auf `:00`, Yahoo auf `:30` → 0 gemeinsame Stempel, nicht vergleichbar (für die Vollsammlung egal, sie holt 1Min und leitet ab). `BRK-B` ist bei Alpaca ungültig, `BRK.B` liefert.
   **Entscheid Wilhelm (03.09., Formular): Freigeben mit Nachtrag.** Begründung des PM: das gefallene Kriterium ist die Anzahl der Ausreißer bei EINEM volatilen Wert an EINEM Tag, um zwei Kerzen; Lage und Streuung sind bei allen fünf Werten praktisch null. Auflagen: (1) diese Zahlen stehen hier, BEVOR etwas geholt wird; (2) `tools/alpaca-balken-holen.js` bekommt eine ausdrückliche Freigabe-Datei mit Wilhelms Entscheid statt eines geänderten Probe-Urteils — das Urteil der Probe bleibt `false`, wie gemessen; (3) der Nachholer prüft nach dem Lauf über alle 133 Werte (`--pruefen`), Kriterium wie die Probe je Wert; fallen dort mehr als 10 % der Werte durch, stoppt die Vollsammlung, bis das erklärt ist. Alternativen „Probe erweitern" und „beim Nein bleiben" verworfen.
   ***Auflagen erledigt (03.09.2026, Bau):*** die Freigabe-Datei liegt als `studien/archiv-zusammenfuehrung-2026-09/probe-alpaca-balken-freigabe.json` ({freigegeben: true, durch: "Wilhelm", datum: "2026-09-03", probeErzeugt: "2026-09-03T14:22:25.241Z"}, exakt an den `erzeugt`-Stempel der Ergebnisdatei gebunden — eine neue Probe entwertet sie von selbst), `freigabe()` in `tools/alpaca-balken-holen.js` liest beide Dateien nur, ändert keine, zeigt die Bannerzeile bei jedem Start, und `--pruefen` urteilt zusätzlich je Wert nach der Stoppregel aus Auflage 3.
3. **Capital-Spannen: eigenes Hüllenfeld `spannen`** (Tagesmediane, Form wie `archiv.js spannenJeTag()`).
4. **Krypto: eigener Ordner `archiv<iv>/krypto/`**, gleiches Format, Quelle `yahoo`.
6. **Rasterregel Krypto (PM, 03.09., technischer Entscheid):** die Minute-0-Regel des Rasters gilt nur für 60m-Aktien/ETF (Gitter `:30`, Schluss `:00`); für 1m/5m/15m (Gitter enthält `:00` jede Stunde) und für Krypto (Gitter `:00` rund um die Uhr, kein Sitzungsschluss) entfällt sie — dort fängt allein `aufGitter()` die Stempel. Ein Stempel, der exakt auf eine Gitterstelle fällt, bleibt dort das Restrisiko (bei 5m jeder 5., bei Krypto-60m jeder 60.); das ist die Lage, die vor `f9462e4` für alle Intervalle galt.
8. **Skalenkonvention (offen, 03.09. abends):** Die Prüfung des Nachholers deckte auf, dass Yahoo-Intraday split- und spin-off-bereinigt ist, Alpaca-raw nicht. Folgen: (a) MNST/SPGI-Alpaca-Bereiche sind falsch skaliert und werden ersetzt (Alpaca-Bereiche über `quellen` identifizierbar, neu holen mit der Bereinigung, die Yahoo entspricht — empirisch prüfen: `adjustment=split` gegen Yahoo bei MNST UND SPGI); (b) die Vollsammlung braucht eine Konvention: **roh + Kapitalmaßnahmen-Tabelle** (append-only, jede Bereinigung ableitbar) oder bereinigt (Yahoo-Konvention, aber jede künftige Maßnahme ändert die ganze Historie). **Entscheid Wilhelm (03.09. abends, Formular): BEIDES** — Vollsammlung roh (`alpaca1m/`) + Kapitalmaßnahmen-Tabelle (Alpaca corporate actions) + bereinigte Kopie (`alpaca1m-bereinigt/`), die lokal aus beidem abgeleitet wird (kein zweiter Abruf; bei neuer Maßnahme nur der betroffene Wert neu abgeleitet). Für die Yahoo-Mischdateien (Nachholer) gilt die Yahoo-Konvention: MNST/SPGI-Alpaca-Bereiche werden ersetzt (erledigt 03.09.). *Nachtrag 03.09. spät:* Abspaltungen liefern in der Maßnahmen-Tabelle keinen Kursfaktor (Z1c-Befund) — **Wilhelm erlaubt den Zweitabruf** je betroffenem Wert (Faktor = `all ÷ dividend`, Herkunft `gemessen`), Auftrag folgt nach Phase M. Hinweis: die Yahoo-Dateien selbst haben dasselbe Problem schon vor Alpaca — „Datei gewinnt" hält nach einem Split die alten Kerzen auf alter Skala, nur die neu geholten sind umgerechnet.
   ***(a) ERLEDIGT 03.09.2026 (Bau) — und die Antwort auf „welche Bereinigung?" lautet: keine.*** Gemessen an vier Fällen (MNST/SPGI × ein Tag vor / ein Tag nach der Maßnahme) mit allen vier Einstellungen, je 72 gemeinsame Stempel, Kriterien K1–K4 im Code **vor** dem Lauf (`studien/archiv-zusammenfuehrung-2026-09/skalen-probe-alpaca.js`, Ergebnis `skalen-probe-ergebnis.json`, Tabelle in [datenquellen.md](datenquellen.md)): `split` trifft den Split (1,00005) und verfehlt die Abspaltung (1,05700) — **und halbiert den Umsatz (0,5001), weil Yahoo Intraday die Kurse bereinigt, die Umsätze aber nicht**; `dividend`/`all` verschieben auch den Kontrolltag *nach* der Maßnahme (0,99776), Yahoo bereinigt Intraday nicht um Dividenden. Nach K4 gilt deshalb: **`raw` holen, mit dem gemessenen Faktor rechnen** — und der Faktor wird je Wert und Tag neu geeicht (Median raw/Yahoo an gemeinsamen Stempeln der 5m-Datei, zu Stufen verdichtet), nicht aus der Probe übernommen. Ein Faktor, der aus einem Tag stammt und auf 70 angewandt wird, wäre eine Behauptung. Ergebnis der Eichung: **MNST 2,000000 (05.26.–10.08.) → 1 (ab 11.08.), SPGI 1,057000 (05.26.–30.06.) → 1 (ab 01.07.)**, Umsatzfaktor beide Male glatt 1 (gemessen 0,996–1,001, innerhalb der 5-%-Ruhezone). Die fünf Tage 26.05.–01.06. haben keinen eigenen Anker (dort führt die 5m-Datei keine Yahoo-Kerzen) und **erben** die Stufe des Nachbarn; das Werkzeug bricht ab, statt zu raten, wenn die Nachbarn verschiedene Stufen tragen. Die Reparatur ist gefahren, die Zahlen stehen in §5, Zeile „Z1-Skalenreparatur". **Der zweite Halbsatz des Hinweises oben ist damit auch gemessen:** Yahoos eigene Intraday-Datei ist nach einem Split in sich uneinheitlich (Kurs halbiert, Umsatz roh) — das trifft `dollarVolTag()` und jede Rechnung, die beides multipliziert, unabhängig von Alpaca. Eigener Auftrag, hier nur benannt.
   ***(b)+(c) GEBAUT 03.09.2026 (Bau) — und die Konvention steht, mit einer benannten Lücke.*** `tools/alpaca-vollsammlung.js` sammelt roh (`alpaca1m/`), holt die Maßnahmen (`alpaca-massnahmen/`) und leitet die bereinigte Kopie lokal ab (`alpaca1m-bereinigt/`). **Der Maßnahmen-Endpunkt `/v1/corporate-actions` trägt auf der Gratisstufe und reicht bis 2016** (AAPL-Split 31.08.2020, NVDA-Split 20.07.2021). Ein **Split** trägt `old_rate`/`new_rate`, und das Verhältnis IST der Kursfaktor — MNST 1→2 ex 11.08.2026 = **2,000**, exakt die Zahl, die die Skalenreparatur am Vortag unabhängig aus den Kursen gemessen hat (zwei Wege, ein Ergebnis). Eine **Abspaltung** trägt `source_rate`/`new_rate`, und das ist ein **Stückverhältnis, kein Kursfaktor**: an sieben Fällen geprüft (GE→WAB 0,005371, GE→GEHC 0,33333, GE→GEV 0,25, MMM→SOLV 0,25, T→WBD 0,24192, SPGI→MBGL 1,0) — kein Sonderfall, sondern die Form. Der gemessene Kursfaktor bei SPGI war 1,057; aus „ein Stück je Stück" ist er nicht auszurechnen. **Folge:** Werte mit Abspaltung bleiben aus der bereinigten Kopie AUS und werden in `alpaca1m-bereinigt/_regel.json` gelistet — der Faktor wird nicht aus der Rohreihe geraten. *Offene Chance (eigener Auftrag, nicht umgesetzt):* das Verhältnis `adjustment=all` ÷ `adjustment=dividend` isoliert Split und Abspaltung und ergäbe für SPGI 1,0572 — zwei Zusatzabrufe je betroffenem Wert, also ein zweiter Abruf, den diese Konvention ausdrücklich ausschließt. Wilhelms Entscheid.
7. **Alles sammeln (Wilhelm, 03.09.):** siehe [entscheide.md](entscheide.md) — Nachholer bleibt, dazu Stufe Z1c Vollsammlung.
5. **Offen bleibt der Einzelentscheid zur laufenden Kerze im Live-Scan** (Z2, Schritt 6): das Archiv hält nur fertige Kerzen, der Scan hängt seinen Abruf im Speicher an.

**Vorbedingung vor Z1: Rasterfilter-Fix (R5) ist beauftragt** — sonst löscht der nächste Sammler-Lauf die übernommenen Kerzen wieder.
*Stand 03.09. 14:30 (Z1):* **nicht committet** (`rasterFilter()` unverändert seit `f9462e4`). `tools/archiv-migration.js` prüft das am Verhalten (`r5Behoben()`) und verweigert `--schreiben`; der Trockenlauf beziffert den Schaden ohne Fix: 42.886 `:00`-Kerzen der 15m-**Datei** und 48.324 der 5m-Übernahme würden gelöscht (§7). **Zusatz:** ein Fix, der die Minute-0-Regel nur auf 60m beschränkt, rettet die Aktien, nicht die 60m-Krypto-Reihen (rund um die Uhr auf `:00`, 95,8 % würden fallen) — Entscheid 4 braucht eine Rasterregel, die Krypto kennt.
*Stand 03.09. (PM, Abnahme Z1):* die Fix-Sitzung war nie gestartet worden. **Neu beauftragt** mit Krypto-Regel (§6 Punkt 6): Fühler `r5Behoben()` in `tools/archiv-migration.js` um Krypto-60m erweitern, Trockenlauf danach wiederholen (Soll: Verlust Datei/Übernahme durch Raster ≈ 0, Krypto 60m übernehmbar).
***ERLEDIGT 03.09.2026 (Bau).*** `rasterFilter(serie, intervall, sym)` kennt das Symbol; die Minute-0-Regel gilt nur für 60m-Nicht-Krypto, das Symbol kommt über `zusammenfuehren(…, {sym})` vom Sammler und von der Migration. `r5Behoben()` fragt jetzt **vier** Dinge (1m/5m/15m frei · 60m-Aktie weiter gefiltert · 60m-Krypto frei) und fällt auf einen Fix, der nur die Intervalle trennt, nicht mehr herein. Trockenlauf wiederholt, Soll erreicht — Zahlen in §8a. **Nicht ausgeliefert:** die installierte App sammelt bis zum nächsten Release mit dem alten Code weiter (Release-Notiz liegt).

## 7. Vermessung (Z0, 03.09.2026)

*Fundstelle: `studien/archiv-zusammenfuehrung-2026-09/BEFUND.md` (Rohdaten `vergleich.json`),
Werkzeuge `tools/store-sichern.js`, `tools/archiv-vergleich.js` (Positivkontrolle A–D vor jedem
Lauf). Stichprobe 13 Paare je Intervall, Saat 20260903, gegen die Store-Sicherung, nie den
lebenden Store. SPY fehlt im Store.*

| Intervall | gemeinsame Stempel | davon in `capBereiche` | echte Abweichungen außerhalb cap (schluss/hoch/tief/umsatz) | echt innerhalb cap |
|---|---|---|---|---|
| 1m | 42.797 | 4.527 | 30 / 39 / 44 / 898 von 38.270 | 2.057 / 2.229 / 2.262 / 3.163 von 4.527 |
| 5m | 57.751 | 4.104 | 6 / 27 / 22 / 998 von 53.647 | 0 |
| 15m | 19.792 | 7.410 | 10 / 12 / 4 / 451 von 12.382 | 2.724 / 2.845 / 2.864 / 3.081 von 7.410 |
| 60m | 51.100 | 678 | 34 / 40 / 43 / 123 von 50.422 | 0 |

- **R4 bestätigt, und harmlos:** außerhalb der `capBereiche` sind 95–96 % aller
  Preisunterschiede die 7-Stellen-Rundung des Stores; der Rest (≤ 0,1 % der Stempel) liegt
  unter 0,8 % und ist Yahoos Nachkorrektur, beim Umsatz Faktor 1,00. `signifikant(Datei, 7)
  === Store` trägt als Äquivalenztest.
- **R2 ist anders als gedacht: `capBereiche` heißt „war einmal CFD".** Von 12 markierten
  Paaren mit Überlappung halten **4** wirklich CFD-Daten (Umsatz-Faktor Datei/Store 250–1.300,
  Preis median 0,01–0,04 %, max 3,4 % im Tief) und **8** Yahoo-identische — `mischeBars()`
  überschreibt bei gleichem Stempel, `capBereiche` wird nie verkleinert. Eine bereichsweise
  Migration nach `quellen` wäre in 8 von 12 Fällen falsch; die Quelle muss je Kerze aus dem
  Vergleich abgeleitet werden.
- **Die 1m-Tiefe ist zu 76,6 % cap-markiert** (2,92 von 3,81 Mio Kerzen in 200 Reihen; 167
  Reihen tiefer als Yahoos 7 Tage; alle Bereiche enden 21.08.). Für die Zeit vor dem 18.08.
  gibt es keine zweite Quelle — ob das CFD-Kerzen sind, ist dort nicht feststellbar.
- **R3 bestätigt:** bei 7 von 13 (5m) und 7 von 10 (60m) Paaren lief die letzte Store-Kerze
  bei `updatedAt` noch; dazu Quote-Kerzen (Umsatz 0, H = T = S) um 20:00 auf beiden Seiten
  (Store 65/79/53/0, Datei 25/13/3/40).
- **R5, neu — die Datei wirft Sitzungskerzen weg:** `kerzenquelle.js rasterFilter()` (Z. 383,
  seit `f9462e4` 27.08.) lässt Minute 0 nur als späteste Kerze des UTC-Tages zu. Auf dem
  60m-Gitter (`:30`) ist das richtig; **auf 5m und 1m löscht es jede volle Stunde 14:00–19:00**
  — 6 von 78 Kerzen je Tag auf 5m (7,7 %), 6 von 390 auf 1m, für Bestand und Neuware. Die
  15m-Datei hat ihre `:00` nur noch, weil sie seit 26.08. nicht geschrieben wurde. Der Store ist
  für diese Kerzen die einzige Quelle. **Muss vor Z1 korrigiert werden**, sonst löscht der
  nächste Lauf die übernommenen Kerzen wieder. App-Code, in Z0 nicht angefasst.
  **BEHOBEN 03.09.2026** (Entscheid §6 Punkt 6): `rasterFilter(serie, intervall, sym)` wendet die
  Minute-0-Regel nur noch auf **60m und nur auf Nicht-Krypto** an; überall sonst fängt allein
  `aufGitter()` die Stempel. Das Symbol wird über `zusammenfuehren(…, {sym})` durchgereicht
  (Sammler `sammle()`, `tools/archiv-migration.js vereinige()`). Restrisiko, benannt: ein
  Abrufstempel, der exakt auf eine Gitterstelle fällt, bleibt stehen — bei 5m jeder 5., bei 1m
  jeder, bei Krypto-60m jeder 60.; das ist die Lage vor `f9462e4`. Trockenlauf danach in §8.
  Klinken: test-v6 Block 63, Abschnitt „R5" (13 Zusicherungen); beide Gegenproben (alte Regel für
  alle Intervalle / Regel ganz ausgebaut) in isolierter Kopie einmal rot gesehen.
  **Der lebende Sammler in der installierten App fährt bis zum nächsten Release den alten Code**
  — Release-Notiz `release-notizen/2026-09-03-raster-loescht-keine-sitzungskerzen.md` liegt, keine
  Version, kein Build.
- **60m-Randstunden:** die 723 Store-Stempel im Fenster sind Capitals 08:00–12:00 und 23:00
  UTC (ORCL, ARM, QCOM, alle in `capBereiche`), auf dem `:00`-Gitter statt Yahoos `:30`.
- **Symbolnamen:** kein Store-Name enthält `_`; Yahoo liefert `BRK-B`, `safeName()` lässt
  den Bindestrich durch, die Datei führt `BRK.B` — Abbildung eindeutig. Ohne Datei: 8 Krypto-
  Reihen (`-USD`) je Intervall, dazu EA (1m), CCEP/CSGP/FAST/NET (5m/15m).
- **Vorschlag der Vereinigungsregel** (BEFUND §5, **Wilhelm entscheidet**): Datei gewinnt bei
  jedem gemeinsamen Stempel in allen vier Feldern; Kerzen nur im Store kommen hinzu, innerhalb
  `capBereiche` je Kerze als `capital` gekennzeichnet; laufende Kerze und Quote-Kerzen nicht;
  [5] = Eröffnung aus der Datei, sonst `null`; Capital-Spanne in ein eigenes Hüllenfeld
  `spannen` oder verwerfen. Reihenfolge: erst `rasterFilter()`, dann Migration, dann
  Äquivalenztest.

## 8. Vermessung Z1 (03.09.2026) — Trockenlauf der Migration über alle 799 Reihen

*Fundstelle: `studien/archiv-zusammenfuehrung-2026-09/Z1-BEFUND.md` (Rohdaten
`migration-zaehlung.json`, `aequivalenz-vor-migration.json`), Werkzeug `tools/archiv-migration.js`
(Kontrollen A–H vor jedem Lauf). Gegen die Store-Sicherung, nie den lebenden Store; nichts geschrieben.*

| Intervall | gemeinsam (Datei gewinnt) | laufend | unvollständig | Quote am Schluss | cap (verworfen) | **übernehmen** (Aktien / Krypto) | Verlust Datei durch heutiges Raster | Verlust Übernahme durch heutiges Raster |
|---|---|---|---|---|---|---|---|---|
| 1m | 548.621 | 0 | 0 | 593 | 2.824.780 | 434.869 (210.424 / 224.445) | 40 | 13.962 |
| 5m | 813.006 | 50 | 0 | 604 | 73.389 | 257.060 (90.156 / 166.904) | 0 | 62.236 |
| 15m | 285.923 | 62 | 0 | 629 | 16.120 | 78.416 (22.760 / 55.656) | **42.886** | 19.163 |
| 60m | 975.052 | 70 | 723 | 0 | 0 | 144.827 (2.507 / 142.320) | 0 | **136.376** (alles Krypto) |

- **Regel je Kerze wörtlich nach §6**, Sitzungsschluss aus dem Kalender (`boerse.js`, Sommerzeit
  über `America/New_York`): 21:00 UTC im Winter, 18:00 UTC am Halbtag, null am Feiertag. Alle
  Quote-Kerzen liegen **am** Schluss, keine danach; eine 20:00-Kerze mit Umsatz wäre übernommen.
- **unvollständig (723)** = die Drei-Feld-Kerzen von ARM/ORCL/QCOM ab 16.07. 23:00 UTC, Capitals
  Randstunden, alle in `capBereiche`.
- **R5 beziffert:** je 5m-Reihe 420 der 852 nur-Store-Kerzen (70 Tage × 6 volle Stunden); die
  15m-Datei verlöre beim Schreiben 357 Kerzen je Reihe — deshalb verweigert das Werkzeug.
- **Krypto:** 95,8 % der 60m-Krypto-Kerzen fallen durch die Minute-0-Regel des 60m-Rasters, auch
  nach einem R5-Fix, der nur 1m/5m/15m freigibt. Braucht einen Entscheid (§6, Vorbedingung).

### 8a. Derselbe Trockenlauf NACH dem R5-Fix (03.09.2026)

*Gleicher Aufruf, gleiche Sicherung, nichts geschrieben:
`node tools/archiv-migration.js E:/…/store-sicherung-2026-09-03 E:/Markt-Dashboard-Archiv --zaehlen`.
Bericht `studien/archiv-zusammenfuehrung-2026-09/migration-zaehlung-nach-r5.{json,md}` — die alten
Zahlen oben bleiben stehen. `r5Behoben()` sagt jetzt „behoben"; Kontrollen A–H bestanden.*

| Intervall | übernehmen (Aktien / Krypto) | Verlust Datei (Raster) **vorher → jetzt** | Verlust Übernahme (Raster) **vorher → jetzt** |
|---|---|---|---|
| 1m | 434.869 (210.424 / 224.445) | 40 → **0** | 13.962 → **0** |
| 5m | 257.060 (90.156 / 166.904) | 0 → **0** | 62.236 → **0** |
| 15m | 78.416 (22.760 / 55.656) | 42.886 → **3** | 19.163 → **0** |
| 60m | 144.827 (2.507 / 142.320) | 0 → **0** | 136.376 → **0** |

- **Alle anderen Spalten unverändert** (gemeinsam, laufend, unvollständig, Quote am Schluss, cap,
  neue Dateien 34, Krypto 8 je Intervall) — der Fix ändert nur, was das Raster wegnimmt.
- **Die drei 15m-Kerzen sind kein Rest der Minute-0-Regel**, sondern die Arbeit, für die das
  Raster da ist: `EOG 2026-08-26T16:56`, `SMCI …T16:28`, `T …T16:54` — krumme Abrufstempel, alle
  mit Umsatz 0, keiner auf dem Viertelstundengitter. Z0 hatte 8 solcher Stempel im 15m-Archiv
  gezählt, davon 0 mit Umsatz.
- **60m-Krypto ist damit übernehmbar:** 142.320 Kerzen in 8 neuen Dateien unter
  `archiv60m/krypto/` (17.790 je Reihe), Verlust 0.
- **Nach wie vor nichts geschrieben.** `--schreiben` fährt Wilhelm nach der Alpaca-Probe.
- **Äquivalenz vor der Migration** (`signifikant(Datei, 7) === Store`, alle gemeinsamen Stempel
  außer dem letzten): Schluss-Nachkorrekturen 245 / 141 / 179 / 1.504 von 548.474 / 812.935 /
  285.889 / 974.923 (≤ 0,15 % der Stempel außerhalb cap, max. 1,16 %); Umsatz 1,5–2,7 %;
  innerhalb cap getrennt gezählt, nicht beurteilt. Deckt sich mit Z0.
- **Nachholer gezählt:** 1.507 Aufgaben, 1.679 Abrufe (1m 833, 5m 457, 15m 389), ~10 min bei
  180/min — läuft nur mit bestandener Probe.
