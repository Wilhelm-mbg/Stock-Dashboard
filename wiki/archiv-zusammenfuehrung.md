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
| Z1 Zielformat & Fassade | Dateiformat um `quellen` erweitern (kerzenquelle.js, mit Migration der `capBereiche`); `window.Archiv` liest über IPC aus den Dateien, Rückfall Store; Äquivalenztest Datei = Store auf allen gemeinsamen Stempeln außer der laufenden Kerze | offen |
| Z2 Leser umhängen | Reihenfolge: zucht → strategiechart → Abdeckung/Export → Edge-Wächter (60m) → loadLabData → **intradayScan zuletzt** (Einzelentscheid); je Schritt Vergleichslauf | offen |
| Z3 Schreiber umhängen | kryptoSammeln → pilotMessen (1m) → loadLabData → backfill/capBackfill → intradayScan; Schreiben über den Hauptprozess, atomar, mit Sammler-Sperre | offen |
| Z4 Store stilllegen | erst wenn 1m-Tiefe in den Dateien liegt und kein Leser mehr am Store hängt; `tools/sicherung.js` anpassen; `tools/`-Variablen `STORE` umbenennen | offen |

## 6. Entscheidungen, die Wilhelm gehören

1. **Die laufende Kerze:** Heute hält der Store sie absichtlich für den Live-Scan. Im Zielbild hält
   das Archiv nur fertige Kerzen, der Scan hängt seinen frischen Abruf im Speicher an. Das ändert
   den Handelspfad um eine Zeile — Einzelentscheid vor Z2-Schritt 6.
2. **Vereinigungsregel je Feld** (kommt aus Z0): Datei-Wert oder Store-Wert bei Abweichung?
3. **Was mit den Capital-Spannen geschieht** (heute in [5] von `capital.js`, nie gespeichert): eigenes
   Feld oder verwerfen.

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
