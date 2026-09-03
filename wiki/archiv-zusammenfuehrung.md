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
| **Z0 Sicherung & Vermessung** | Store vollständig nach E: sichern (259 MB, Prüfsumme); Überlappung Store ⋂ Datei stempelweise messen (12 Symbole je Intervall: gemeinsame Stempel, Abweichungen in schluss/umsatz/hoch/tief, getrennt für Reihen mit `capBereiche`, Abstand der letzten Kerze); Befund als `studien/archiv-zusammenfuehrung-2026-09/BEFUND.md`; Vorschlag der Vereinigungsregel je Feld. **Kein App-Code.** | **beauftragt 03.09.** |
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
