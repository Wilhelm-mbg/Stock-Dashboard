# Archiv-Zusammenführung, Stufe Z0 — Sicherung und Vermessung

03.09.2026, Rolle Berechnungen. Auftrag: `wiki/archiv-zusammenfuehrung.md` §5, Z0.
**Kein App-Code wurde geändert.** Neu sind `tools/store-sichern.js`, `tools/archiv-vergleich.js`
und dieser Ordner. Rohdaten: `vergleich.json` (alle Zahlen je Symbol), `vergleich-tabellen.md`
(die vom Werkzeug erzeugten Tabellen, hier gekürzt zitiert).

Alle Zahlen unten sind gemessen. Die Stichprobe ist eine Stichprobe (12 + 2 Symbole je
Intervall); was sie nicht sehen kann, steht in §6.

## 1. Sicherung des Renderer-Stores

| | |
|---|---|
| Quelle | `C:/Users/Wilhe/AppData/Roaming/Markt-Dashboard/store/bars_*.json` — die App **lief** (4 Prozesse), letzter Schreibvorgang der Quelle 13:36 Ortszeit, Sicherung 13:39 |
| Ziel | `E:/Markt-Dashboard-Archiv/store-sicherung-2026-09-03/` + `manifest.json` |
| Dateien | **799** (200 × 1m, 200 × 5m, 200 × 15m, 199 × 60m) |
| Bytes | **272.031.058** (259,4 MB) |
| Prüfsumme | SHA-256 je Datei im Manifest; jede Kopie zurückgelesen und verglichen, als JSON geparst, Quelle danach erneut gehasht |
| Nicht sicherbar | **0** — kein einziger Wiederholungsversuch nötig |
| Dauer | 6 s |

Verfahren in `tools/store-sichern.js` (Pfade als Argumente, kein `os.homedir()`). Die Quelle
wurde nur gelesen, nie geschrieben, nie umbenannt.

**Hinweis zu `tools/sicherung.js` (nicht geändert):** Zeile 86 des Zettels und die
Auswahllisten in Zeilen 39–41 schließen `bars_*.json` aus („die App lädt sie selbst nach").
Für 1m ist das falsch: Yahoo gibt 7 Tage zurück, der Store hält bis zu **70 Handelstage**
(§3.4). Diese Sicherung ist die erste Kopie dieser Tiefe.

## 2. Positivkontrolle des Vergleichswerkzeugs

`node tools/archiv-vergleich.js --kontrolle` — läuft vor jedem echten Vergleich, ohne Bestehen
keine Zahl. Vier Kunst-Paare, alle bestanden:

| Paar | Einbau | Soll | Ist |
|---|---|---|---|
| A | identische Reihe, Store 5-Feld gerundet, Datei 6-Feld roh, eine laufende Kerze im Store | 0 echte Abweichungen, 1 laufende Kerze | 0 echt, 2.000 Rundungsfälle (Zweig nachweislich durchlaufen), 1 laufend, Abstand 5 min |
| B | Umsatz × 500 auf Kerzen 100–199, als `capBereiche` markiert | genau dieser Bereich, alles „innen", Faktor 500 | Bereich exakt getroffen, 100 innen / 0 außen, Median-Faktor 500,0 |
| B′ | dasselbe **ohne** Markierung | dieselben 100 „außen" | 0 innen / 100 außen — die Trennung ist keine Tautologie |
| C | ein Schlusskurs um 10 ppm verschoben | genau 1 echte Abweichung | 1 echt im Feld schluss, 10,3 ppm |
| D | zwei Stempel in der Datei entfernt | 2 nur Store, im Fenster, nach Phase gezählt | 2, regulär |

## 3. Vermessung der Überlappung

Stichprobe: je Intervall 6 Symbole **mit** `capBereiche` im Store und 6 **ohne**, gezogen mit
Saat **20260903** (mulberry32, je Intervall versetzt), dazu AAPL und SPY. Gezogen wurde nur aus
Reihen, die auf beiden Seiten liegen. **SPY fehlt im Store** — der Store hält keine ETF-Reihe
unter diesem Namen —, deshalb 13 Paare je Intervall statt 14; auf 60m gibt es nur **3** Reihen
mit `capBereiche` (statt 6 ziehbaren), dort sind es 10 Paare. Vergleichsseite: die Sicherung aus §1, nie der
lebende Store.

Definitionen: „gemeinsam" = derselbe Stempel (ms UTC) auf beiden Seiten. Eine Abweichung ist
**durch Rundung erklärt**, wenn der Store-Wert exakt `signifikant(Datei, 7)` bzw. beim Umsatz
`Math.round(Datei)` ist; **≤ 1 ppm**, wenn nur Gleitkomma-Rauschen bleibt; sonst **echt**.
„Fenster" = der Zeitraum, den beide Seiten abdecken; Stempel, die nur eine Seite hält, zählen
nur dort als Rasterunterschied.

### 3.1 Übersicht

| Intervall | Store-Reihen | davon mit Datei | Paare | gemeinsame Stempel | davon in capBereiche | nur Store (gesamt / im Fenster) | nur Datei (gesamt / im Fenster) | laufende Kerzen | Stempelkerzen Store / Datei |
|---|---|---|---|---|---|---|---|---|---|
| 1m | 200 | 191 | 13 | 42.797 | 4.527 | 167.631 / 709 | 14.574 / 61 | 0 | 65 / 25 |
| 5m | 200 | 188 | 13 | 57.751 | 4.104 | 10.032 / 4.877 | 2.166 / 0 | 7 | 79 / 13 |
| 15m | 200 | 188 | 13 | 19.792 | 7.410 | 2.309 / 32 | 371 / 0 | 3 | 53 / 3 |
| 60m | 199 | 191 | 10 | 51.100 | 678 | 898 / 723 | 250 / 23 | 7 | 0 / 40 |

„Stempelkerze" = Umsatz 0 und hoch = tief = schluss (die Quote-Kerze der Quelle). „Laufende
Kerze" = Store-Kerze, deren Eimer zum Zeitpunkt `updatedAt` noch offen war (Stempel + Dauer >
`updatedAt`).

### 3.2 Abweichungen auf gemeinsamen Stempeln

Summe über die Paare. `n` = gemeinsame Stempel mit numerischem Wert auf beiden Seiten.

| Intervall | Lage | Feld | n | durch Rundung erklärt | echt | max. rel. Abw. (echt) | Median Faktor Store/Datei (Umsatz, echt) |
|---|---|---|---|---|---|---|---|
| 1m | in capBereiche | schluss | 4.527 | 2.370 | **2.057** | 0,360 % | |
| 1m | in capBereiche | hoch | 4.527 | 2.207 | **2.229** | 1,794 % | |
| 1m | in capBereiche | tief | 4.527 | 2.166 | **2.262** | 0,462 % | |
| 1m | in capBereiche | umsatz | 4.527 | 0 | **3.163** | 100 % | 0,004 |
| 1m | außerhalb | schluss | 38.270 | 36.628 | 30 | 0,091 % | |
| 1m | außerhalb | hoch | 38.270 | 36.434 | 39 | 0,210 % | |
| 1m | außerhalb | tief | 38.270 | 36.563 | 44 | 0,195 % | |
| 1m | außerhalb | umsatz | 38.270 | 0 | 898 | 100 % | 1,00 |
| 5m | in capBereiche | alle vier | 4.104 | 3.839–3.937 | **0** | – | – |
| 5m | außerhalb | schluss / hoch / tief | 53.647 | 50.852–51.395 | 6 / 27 / 22 | 0,089 % | |
| 5m | außerhalb | umsatz | 53.647 | 0 | 998 | 100 % | 1,00 |
| 15m | in capBereiche | schluss | 7.410 | 4.523 | **2.724** | 0,527 % | |
| 15m | in capBereiche | hoch | 7.410 | 4.352 | **2.845** | 2,326 % | |
| 15m | in capBereiche | tief | 7.410 | 4.330 | **2.864** | 3,371 % | |
| 15m | in capBereiche | umsatz | 7.410 | 0 | **3.081** | 100 % | 0,003 |
| 15m | außerhalb | schluss / hoch / tief | 12.382 | 11.686–11.866 | 10 / 12 / 4 | 0,294 % | |
| 15m | außerhalb | umsatz | 12.382 | 0 | 451 | 96 % | 1,00 |
| 60m | in capBereiche | alle vier | 678 | 633–643 | **0** | – | – |
| 60m | außerhalb | schluss / hoch / tief | 50.422 | 47.401–48.237 | 34 / 40 / 43 | 0,800 % | |
| 60m | außerhalb | umsatz | 50.422 | 0 | 123 | 100 % | 1,00 |

Beim Umsatz zählt „durch Rundung erklärt" nur `Math.round`; die Datei liefert ganze Zahlen,
deshalb steht dort 0 und alles Ungleiche ist echt. Werte ≤ 1 ppm: 15 Fälle über alle
Intervalle, vernachlässigbar.

**Lesart je Lage:**

- **Außerhalb der capBereiche** sind die Preise praktisch identisch: 95–96 % der Stempel
  unterscheiden sich nur durch die 7-Stellen-Rundung des Stores, der Rest (0,01–0,1 % der
  Stempel) um höchstens 0,8 %. Beim Umsatz weichen 1–2 % der Stempel ab, Faktor 1,00,
  Median 0,1–2,5 % — das ist Yahoos Nachkorrektur fertiger Kerzen, die die nächtlich
  abgerufene Datei eher trägt als der Store. Ausreißer 60m FDX (33/39/43/120 echt, max 0,59 %)
  — ein einziges Symbol trägt fast alle 60m-Preisabweichungen.
- **Innerhalb der capBereiche** zerfällt die Stichprobe in zwei Sorten, siehe §3.3.

### 3.3 Der Befund zu `capBereiche`: die Marke sagt „war einmal CFD", nicht „ist CFD"

12 markierte Symbol×Intervall-Paare haben gemeinsame Stempel innerhalb ihrer `capBereiche`
(bei den übrigen 11 markierten Paaren der Stichprobe endet der Bereich vor dem Fenster der
Datei). **Nur 4 davon halten dort tatsächlich CFD-Daten**, 8 halten Yahoo-identische Daten:

| Intervall | Symbol | gemeinsame Stempel in cap | schluss echt | Median rel. Abw. schluss | max hoch / tief | Umsatz echt | Faktor Datei / Store |
|---|---|---|---|---|---|---|---|
| 1m | AZN | 1.520 | 1.253 | 0,012 % | 1,79 % / 0,46 % | 1.520 (alle) | **270** |
| 1m | CPRT | 1.487 | 804 | 0,015 % | 0,19 % / 0,19 % | 1.487 (alle) | **1.280** |
| 15m | BIIB | 1.482 | 1.427 | 0,042 % | 2,33 % / 3,37 % | 1.482 (alle) | **340** |
| 15m | CEG | 1.482 | 1.297 | 0,016 % | 0,20 % / 0,20 % | 1.482 (alle) | **250** |
| 1m | PLD | 1.520 | 0 | – | – | 156 | 1,01 (Nachkorrektur) |
| 15m | USB | 1.482 | 0 | – | – | 117 | 1,00 |
| 15m | SPGI, DHR | je 1.482 | 0 | – | – | 0 | – |
| 5m | ISRG | 4.104 | 0 | – | – | 0 | – |
| 60m | ORCL, ARM, QCOM | je 226 | 0 | – | – | 0 | – |

**Mechanismus (aus dem Code, durch die Zahlen bestätigt):** `archiv.js mischeBars()` ersetzt
bei gleichem Stempel die alte Kerze durch die neue; `capBereiche` wird nur erweitert
(`bereicheMerge`), nie verkleinert. Holt `loadLabData()` oder der Scan später Yahoo-Kerzen für
denselben Zeitraum, überschreiben sie die CFD-Kerzen — die Marke bleibt. Wo Yahoo den Stempel
nie liefert (60m: Capitals Randstunden 08:00–12:00 und 23:00 UTC, §3.5), bleibt die CFD-Kerze.

**Folge für R2 und die Vereinigung:** `capBereiche` 1:1 nach `quellen: capital` zu übertragen,
würde in der Stichprobe 8 von 12 Bereichen mit Börsendaten als CFD kennzeichnen und
`dollarVolTag()` dort grundlos `null` liefern lassen. Umgekehrt ist die Marke dort, wo sie
zutrifft, unverzichtbar: Faktor 250–1.300 beim Umsatz, Preisabweichung im Median
0,01–0,04 %, im Extrem 3,4 % (Tief). Die Marke muss je Kerze aus dem Vergleich abgeleitet
werden, nicht aus dem Bereich (§5).

### 3.4 Tiefe beider Seiten

| Intervall | Store (Stichprobe: n / Kalendertage / Handelstage) | Datei | Store, alle Reihen: Handelstage min / Mittel / max |
|---|---|---|---|
| 1m | mit cap: 23.265–27.102 / 87–99 / **62–70**; ohne cap: 3.901–6.641 / 13–22 / **10–17** | 2.538–4.610 / 8–15 / **7–12** | 0 / 47,3 / 70 — **167 von 200 Reihen tiefer als die Datei (> 12 Handelstage)**, 132 Reihen ≥ 60 |
| 5m | 4.681–5.471 / 87–99 / 60–70 | 4.609 / 91 / 64 | 13 / 65,5 / 73 |
| 15m | 1.561–1.831 / 87–99 / 60–70 | 1.546–1.561 / 85 / 60 | 13 / 65,4 / 73 |
| 60m | 5.088–5.400 / 1.061–1.077 / 730–740 | 5.135 / 1.071 / 736 | 720 / 734,8 / 743 |

**Die 1m-Tiefe ist zu drei Vierteln CFD-markiert.** Über alle 200 1m-Reihen: 3.808.863 Kerzen,
davon **2.918.593 (76,6 %) innerhalb von `capBereiche`**. Alle `capBereiche` enden spätestens
**21.08.2026 19:59 UTC** (1m, 5m, 15m gleichermaßen) — seither speist Capital nichts mehr ein.
Nach §3.3 ist unbekannt, welcher Teil dieser 2,9 Mio Kerzen wirklich CFD-Kerzen sind: für die
Zeit vor dem 18.08. gibt es **keine zweite Quelle**, gegen die man das messen könnte. Auf 5m
und 15m liegen 30 % der Store-Kerzen in `capBereiche`, auf 60m 0,1 % (3 Reihen).

Die 1m-**Datei** hält 2.964 Reihen, in der Stichprobe mit 7–12 Handelstagen (Stand 03.09. 07:02) — die Sammlung
läuft also, anders als `wiki/datenquellen.md` („RUHT") sagt. Die 15m-Datei steht seit
**26.08. 16:27** still (Stand-Feld; in der Stichprobe letzte Kerze 26.08.); der Store führt
15m bis 02.09. weiter.

### 3.5 Raster: Stempel, die nur eine Seite hält (im gemeinsamen Fenster)

| Intervall | vor 13:30 UTC | 13:30–20:00 | ab 20:00 | häufigste Uhrzeiten (S = nur Store, D = nur Datei) |
|---|---|---|---|---|
| 1m | 0 | 712 | 58 | 14:00 S ×105, 15:00 ×105, 16:00 ×105, 17:00 ×106, 18:00 ×106, 19:00 ×106 |
| 5m | 0 | 4.812 | 65 | 14:00 S ×802, 15:00 ×802, 16:00 ×802, 17:00 ×802, 18:00 ×802, 19:00 ×802 |
| 15m | 0 | 0 | 32 | 20:00 S ×32 |
| 60m | 495 | 1 | 250 | 08:00 S ×99, 09:00 ×99, 10:00 ×99, 11:00 ×99, 12:00 ×99, 23:00 ×78; 20:00 D ×4 je Symbol |

**Befund 1 — die 5m- und 1m-Datei hält keine volle Stunde innerhalb der Sitzung.** AAPL 5m
am 27.08.: Datei 13:30 … 13:55, **14:05** …; Store … 13:55, **14:00**, 14:05 …. Minutenverteilung
der ganzen 5m-Datei: `:05` 384-mal, `:00` **1-mal** (der Sitzungsschluss); Store `:00`
431-mal. Ursache: `kerzenquelle.js rasterFilter()` (Zeile 383, Commit `f9462e4`, 27.08.2026
02:22) lässt Minute 0 nur als **späteste Kerze ihres UTC-Tages** zu — gedacht gegen Yahoos
Quote-Stempel auf einer zufälligen vollen Stunde, gebaut am 60m-Archiv, wo das Gitter auf
`:30` liegt und Minute 0 tatsächlich nur der Schluss ist. Auf 5m und 1m ist jede volle
Stunde eine Gitterkerze. **Verlust: 6 von 78 Kerzen je Handelstag auf 5m (7,7 %), 6 von 390
auf 1m (1,5 %), und zwar auf beiden Seiten jeder Vereinigung** — der Filter gilt für Bestand
und Neuware. Die 15m-Datei hat ihre `:00`-Kerzen noch (357-mal, gleich oft wie `:15`), weil sie
seit dem 26.08. nicht mehr geschrieben wurde; der nächste Lauf entfernt sie. Der Store ist für
diese Kerzen derzeit die einzige Quelle. *Der Filter ist App-Code und wurde nicht angefasst.*

**Befund 2 — 60m: Capitals Randstunden.** Die 723 Store-Stempel im Fenster sind zu 100 % die
drei `capBereiche`-Reihen ORCL, ARM, QCOM (je 241 innerhalb ihrer Bereiche) und liegen bei
08:00–12:00 UTC und 23:00 — Handelszeiten des CFD, die Yahoo nie liefert. Sie sitzen zudem auf
dem `:00`-Gitter, während Yahoos 60m-Gitter auf `:30` liegt.

**Befund 3 — Stempelkerzen und Schluss.** Der Store hält auf 15m die 20:00-Kerze (Umsatz 0,
hoch = tief = schluss) an 32 Tagen, die Datei nicht; auf 60m umgekehrt hält die Datei je Symbol
vier 20:00-Kerzen, die der Store nicht hat. Beide Seiten führen solche Quote-Kerzen (Store
65/79/53/0, Datei 25/13/3/40) — sie sind keine Sitzungskerzen.

**Verkürzte Handelstage:** in den Top-Tagen der Rasterunterschiede taucht der einzige Halbtag im
Fenster (03.07.2026) nicht auf; die häufigsten Tage (21., 24., 26.–28.08.) sind die Tage, an
denen der Store mehr Stempel hält als die Datei (Befund 1 plus Store-Reihen, die die Datei erst
später bekam). Kein Halbtags-Muster gefunden.

### 3.6 Die letzte Kerze (#85)

| Intervall | Abstand letzte Store-Kerze − letzte Datei-Kerze | Store-Kerze lief noch bei `updatedAt` |
|---|---|---|
| 1m | 0 bis −2 min bei 6 Reihen (beide 02.09. 20:00); −7 bis −12 Tage bei 6 Reihen, die der Store seit 21./24./26.08. nicht mehr berührt; +7 Tage bei NET (Datei endet 26.08.) | 0 von 13 |
| 5m | **+1.440 min** (ein Tag) bei 7 Reihen — die Datei wird nächtlich geholt, der Store beim Scan; −6 bis −8 Tage bei 6 unberührten Reihen | **7 von 13** |
| 15m | +7 Tage bei 6 Reihen (Datei seit 26.08. still); −2 bis −5 Tage bei 7 Reihen | 3 von 13 |
| 60m | +1.410 min bei 6 Reihen; −5 bis −11 Tage bei 4 unberührten Reihen | **7 von 10** |

Die letzte Store-Kerze ist bei 5m und 60m in der Mehrzahl eine, deren Eimer beim letzten
Schreiben noch offen war — sie trägt den Stand von `updatedAt`, nicht den Schluss. Zusätzlich
ist die 20:00-Kerze auf 5m/1m eine Quote-Kerze (Umsatz 0). Beides deckt sich mit
`archiv.js:321` („die laufende Kerze bleibt bewusst drin").

Der Store ist auf 1m/5m/15m **kein gleichmäßig gepflegtes Archiv**: nur Reihen, die Scan oder
Nachtmessung gerade berühren, laufen weiter; die übrigen stehen seit dem Tag ihres letzten
Abrufs (21.–27.08.). Die Datei wird je Intervall als Ganzes geholt.

### 3.7 Symbolnamen

| Intervall | Store-Reihen | direkt | Zeichen getauscht | keine Datei | mehrdeutig | Namen mit `_` |
|---|---|---|---|---|---|---|
| 1m | 200 | 190 | 1 (BRK-B → BRK.B) | 9 (8 × `-USD`, EA) | 0 | **0** |
| 5m | 200 | 187 | 1 | 12 (8 × `-USD`, CCEP, CSGP, FAST, NET) | 0 | 0 |
| 15m | 200 | 187 | 1 | 12 (dieselben) | 0 | 0 |
| 60m | 199 | 190 | 1 | 8 (8 × `-USD`) | 0 | 0 |

**Die Falle aus der Karte tritt nicht auf:** kein Store-Name enthält `_`. `main.js safeName()`
ersetzt zwar `.` durch `_`, aber Yahoos Symbol ist `BRK-B` mit Bindestrich, den `safeName()`
durchlässt. Die Datei führt denselben Wert als `BRK.B`; die Abbildung `-` → `.` ist eindeutig
(kein zweiter Treffer). Krypto (`-USD`) gibt es nur im Store — dort ist der Store die einzige
Kopie, wie bei 1m.

## 4. Was die Zahlen für die vier Risiken bedeuten

| Risiko | Befund |
|---|---|
| R1 Element [5] | Der Store hat kein [5] (alle 799 Dateien 5-Feld, Kontrolle A bestätigt die Rundungsregel). Die Datei führt die Eröffnung. Keine Verwechslung im Bestand — sie entstünde erst beim Zusammenführen. |
| R2 `capBereiche` | Marke ist über-inklusiv (8 von 12 markierten Bereichen mit Überlappung halten Börsendaten) und zugleich dort, wo sie stimmt, gravierend (Faktor 250–1.300). Bereichsweise Übernahme ist falsch, kerzenweise Ableitung nötig. |
| R3 laufende Kerze | bestätigt: 7/13 (5m), 7/10 (60m) Store-Endkerzen liefen noch; dazu Quote-Kerzen um 20:00 auf beiden Seiten. |
| R4 Felder/Genauigkeit | bestätigt: 95–96 % aller Preisunterschiede sind die 7-Stellen-Rundung; `===` scheitert, `signifikant(Datei, 7) === Store` trägt (Kontrolle A: 2.000 von 2.000). |

Neu, nicht in der Karte: **R5 Rasterverlust der Datei** (§3.5, Befund 1) — nicht das Zusammenführen ist die Gefahr, sondern dass die Datei heute 7,7 % der 5m-Sitzungskerzen wegwirft, auch beim Einspielen fremder Kerzen.

## 5. Vorschlag der Vereinigungsregel je Feld

**Das ist ein Vorschlag. Wilhelm entscheidet** (§6 der Karte, Punkte 2 und 3). Jede Regel nennt
die Messung, auf der sie steht.

| Feld / Frage | Vorschlag | Grund (Messung) |
|---|---|---|
| **Stempelmenge** | Vereinigung beider Stempelmengen. Kerzen, die nur der Store hält, kommen in die Datei — **unter der Bedingung, dass `rasterFilter()` vorher die Minute-0-Regel auf 60m beschränkt** (auf 5m/1m/15m ist jede volle Stunde Gitter). Ohne diese Korrektur löscht der nächste Lauf die übernommenen Kerzen wieder. | §3.5 Befund 1: 6 Kerzen je Tag auf 5m/1m nur im Store |
| **schluss, hoch, tief** bei gemeinsamem Stempel | **Datei gewinnt**, immer. Außerhalb cap: rohe Genauigkeit statt 7 Stellen, und die spätere Nachkorrektur. Innerhalb cap: Börsenkurs statt CFD-Mitte. | §3.2: Rundung erklärt 95–96 %; Reste ≤ 0,8 %; cap-Abweichung bis 3,4 % |
| **umsatz** bei gemeinsamem Stempel | **Datei gewinnt.** | §3.2: Faktor 1,00 außen (Nachkorrektur), Faktor 250–1.300 in echten CFD-Bereichen |
| **Kerzen nur im Store**, innerhalb `capBereiche` | übernehmen, aber je Kerze als `capital` kennzeichnen; **Umsatz dieser Kerzen nicht in Umsatzgrößen einrechnen** (`dollarVolTag()` → `null` bleibt). Alternative, wenn Wilhelm CFD-Kerzen nicht im Archiv will: verwerfen und die 1m-Tiefe auf die 23,4 % außerhalb cap beschränken. | §3.4: 76,6 % der 1m-Tiefe; §3.3: unbekannter Anteil echt CFD |
| **Kerzen nur im Store**, außerhalb `capBereiche` | übernehmen als `yahoo` — mit einer Ausnahme: laufende Kerze und Quote-Kerzen (unten). | §3.2 außen: identisch bis auf Rundung |
| **`capBereiche` → `quellen`** | **nicht bereichsweise migrieren.** Vorschlag: `quellen: [{ von, bis, quelle: 'capital' \| 'yahoo', abgeleitet: 'vergleich-z0' }]`, erzeugt **je Kerze** bei der Migration: gemeinsamer Stempel → `yahoo` (Datei gewinnt ohnehin); nur Store und innerhalb cap → `capital`; nur Store und außerhalb → `yahoo`. Zusammenhängende gleiche Kerzen werden zu einem Bereich verdichtet. Künftige Schreiber tragen die Quelle beim Schreiben ein; die Fassade lehnt Kerzen ohne Quelle ab. | §3.3: 8 von 12 Bereichen falsch, wenn bereichsweise |
| **Element [5]** | **Eröffnung aus der Datei.** Für Kerzen, die nur der Store liefert: `null` (nicht der Schluss — `kurse.js` `offenRoh`, Messmaschine C7 warnt dann sichtbar). **Capital-Spanne nie in [5].** | Karte §2; `capital.js:325` |
| **Capital-Spanne** | eigenes Hüllenfeld `spannen: { "YYYY-MM-DD": { n, med } }` — genau die Form, die `archiv.js spannenJeTag()` heute schon erzeugt und `depot.js` in `D.spannen.tage` führt. Oder verwerfen; beides kostet keine Kerze. | `archiv.js:236` |
| **Laufende Kerze** | **nicht übernehmen.** Bei der Migration jede Store-Kerze mit Stempel + Dauer > `updatedAt` verwerfen; die Datei hält nur fertige Kerzen (`fertigeKerze()`), der Live-Scan hängt seinen frischen Abruf im Speicher an (Karte §6, Punkt 1). | §3.6: 7/13 auf 5m, 7/10 auf 60m |
| **Quote-Kerzen** (Umsatz 0, hoch = tief = schluss, Minute 0 nach Sitzungsschluss) | von beiden Seiten **nicht** vereinigen. Vorsicht: die 20:00-Kerze auf 60m ist an Halbtagen die Schlussauktion (`kerzenquelle.js` Phantom-Dochte) — die Regel muss „nach Sitzungsschluss laut Kalender" prüfen, nicht „20:00". Das ist Wilhelms Entscheid, denn heute hält die Datei 40 davon auf 60m. | §3.5 Befund 3 |
| **Symbolname** | Datei-Schreibweise (`BRK.B`); Abbildung `-` → `.` nur, wenn genau ein Treffer (heute: genau einer). Krypto bekommt einen eigenen Ordner oder bleibt draußen — Wilhelms Entscheid. | §3.7 |
| **60m-Randstunden** (Capital 08:00–12:00, 23:00 UTC) | nur mit Quelle `capital` übernehmen — oder verwerfen; sie liegen auf einem anderen Gitter (`:00` statt `:30`) und `rasterFilter()` würde sie heute löschen. | §3.5 Befund 2 |

Reihenfolge, die aus den Messungen folgt: erst `rasterFilter()` korrigieren (sonst frisst die
Datei die Übernahme), dann Migration mit kerzenweiser Quellenableitung, dann Äquivalenztest
`signifikant(Datei, 7) === Store` auf allen gemeinsamen Stempeln außer der letzten (Z1).

## 6. Was NICHT gemessen wurde

- **Die 1m-Tiefe vor dem 18.08.2026** (rund 3,4 Mio der 3,8 Mio Store-Kerzen): keine zweite Quelle, kein Vergleich möglich. Ob die 2,9 Mio cap-markierten Kerzen CFD-Kerzen sind, ist für diesen Zeitraum **nicht feststellbar** — die Stichprobe zeigt nur, dass beides vorkommt.
- **Reihen ohne Datei-Gegenstück**: Krypto (8 Reihen je Intervall), EA, CCEP, CSGP, FAST, NET. Für sie gilt: der Store ist die einzige Kopie, und nichts hier sagt, ob er stimmt.
- **SPY** fehlt im Store; die zweite Kontrolle bestand nur aus AAPL.
- **Ob Capitals Kurse „falsch" sind.** Gemessen ist der Abstand zur Yahoo-Kerze desselben Stempels, nicht der zum wahren Börsenkurs. Yahoos eigene Nachkorrekturen (Faktor 1,00 beim Umsatz) sind nicht gegen eine dritte Quelle geprüft.
- **Halbtage** nur über die Top-Tage der Rasterunterschiede; kein Kalenderabgleich.
- **Das Tagesarchiv (1d)** und `massive/` — nicht Teil von Z0.
- **Wirkung auf Leser** (Signale, Edge-Wächter, Scan) — das ist Z2, nicht Z0.
- **Ob die Sicherung vollständig ist** im Sinne von „alle Reihen, die es je gab": 799 ist die Zahl der Dateien am 03.09. 13:39. Reihen, die die App vorher gelöscht hat, sind nicht drin.
- Die Stichprobe hat **13 Paare je Intervall**; die Anteile in §3.3 (4 von 12) sind Anteile einer Stichprobe, keine Grundgesamtheits-Zahl.

## 7. Dateien

| | |
|---|---|
| `tools/store-sichern.js` | Sicherung mit Manifest, Pfade als Argumente |
| `tools/archiv-vergleich.js` | Vermessung, `--kontrolle`, nur lesend, verweigert ohne `manifest.json` |
| `studien/archiv-zusammenfuehrung-2026-09/vergleich.json` | alle Messwerte je Symbol |
| `studien/archiv-zusammenfuehrung-2026-09/vergleich-tabellen.md` | Tabellen des Werkzeugs, ungekürzt |
| `E:/Markt-Dashboard-Archiv/store-sicherung-2026-09-03/manifest.json` | 799 Prüfsummen |
