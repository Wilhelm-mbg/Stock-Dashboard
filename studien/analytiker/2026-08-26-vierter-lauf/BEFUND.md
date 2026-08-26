# Analytiker-Befund, 26.08.2026, vierter Lauf (außerplanmäßig, ~09:00)

Außerplanmäßiger Lauf während der laufenden Neumessung (Master, Maschine 1.2.0).
Bewusst leicht gehalten: **kein Aufruf der Messmaschine**, keine schweren Rechnungen
parallel zum Messlauf des Masters — geprüft wurde ausschließlich aus den abgelegten
Zahlen. Schwerpunkt: die frischen Protokolle des Neumessungs-Laufs unabhängig
nachrechnen (das ist der D-Block in seiner heute sinnvollsten Form; eine eigene
Kanten-Neuberechnung liefe dem laufenden Lauf in die Quere und würde ihn nur doppeln).

## D (angepasst): Frische Protokolle der Neumessung — **bestanden, 17 von 17**

`protokoll-nachrechnung.js` + `protokoll-nachrechnung-ausgabe.txt` in diesem Ordner.
Eigene Normalquantil-Referenz (Acklam + Halley über eigene erfc; Selbstkontrolle:
zwei Literaturwerte |Abw| ≤ 5e−7, Rundlauf tests=1..7 |Abw| ≤ 1e−12). Ein dritter
Literatur-Stützwert stand zuerst aus dem Gedächtnis und war um 2e−4 falsch — ersetzt
durch den Rundlauf, nicht geglättet.

Zum Prüfzeitpunkt lagen 6 der 12 Protokolle vor (das sechste, rsi2seit-mcp, kam
während des Laufs herein):

1. **Maschinen-Stand einheitlich:** alle 6 tragen `1.2.0 @ 6a7d9e29db6f` — die
   Sperre auf `messmaschine.js` hält, unabhängig vom PM nachgezählt.
2. **Urteile je Variante:** alle 17 Varianten aus `bestaetigung.ueberschuss`
   unabhängig nachgefällt (MDE-Hürde, Bonferroni-Schwelle aus `tests`, Vorzeichen)
   — **0 Abweichungen** gegen `urteile[]`.
3. **#91 im Feld bestätigt:** `delta80` (rel. Abw ≤ 4,5e−9) und `aussicht.tage80`
   für alle Varianten exakt reproduziert — gerechnet gegen die **Bonferroni-Schwelle**.
   Gegenprobe: die alte Formel (zAlpha 1,96) hätte z. B. kapitulation V2 168 statt
   224 Tage gemeldet, momentum V3 395.853 statt 562.398.
4. **Placebos:** |t| ≤ 1,25 über alle 6 Protokolle (−0,23 … +1,25), MDEs ausgewiesen
   (0,131 … 1,915 Pp) — kein Maschinenfehler sichtbar.
5. **bestesUrteil je Protokoll:** Rangfolge nachvollzogen, deckungsgleich. Die
   PM-Tabelle von 09:30 (224/3.803/4.116/13.257/33.683) stimmt mit den Dateien überein.

## FUND: die `bestesUrteil`-Rangfolge kann `widerlegt` verdecken (Issue, s. u.)

`messmaschine.js:1214–1215` aggregiert die Variantenurteile über eine Rangfolge, in
der **`widerlegt` an letzter Stelle** steht und **`bestaetigt-aber-nullpunkt-verschoben`
gar nicht vorkommt**. Gegenprobe (`bestesurteil-gegenprobe.txt`, Aggregation isoliert
nachgestellt):

| Variantenurteile | bestesUrteil | Problem |
|---|---|---|
| widerlegt + nicht-entscheidbar | nicht-entscheidbar | signifikant NEGATIVE Variante wird als „Lineal zu grob" gemeldet |
| widerlegt + nicht-messbar | nicht-messbar | dito, noch härter |
| bestaetigt + widerlegt | bestaetigt | Gegenläufigkeit der Varianten stumm |
| nur nullpunkt-verschoben | **nicht-messbar** | Fallback greift; faktisch falsches Etikett, Maschinenproblem unsichtbar |

Die Rangfolge ist unter **beiden** denkbaren Lesarten in sich inkonsistent: als
„günstigstes erreichtes Urteil" müsste `nicht-bestaetigt` (gemessen, trägt nicht)
HINTER `nicht-entscheidbar` (keine Aussage) stehen — steht es aber nicht; als
„informativstes Urteil" gehört `widerlegt` neben `bestaetigt` an die Spitze — steht
aber ganz hinten.

**Warum jetzt:** Heute tritt keiner der Fälle auf (Bestandsaufnahme über alle 32
abgelegten Protokolle, 76 Variantenurteile: 70 nicht-entscheidbar, 5 nicht-bestaetigt,
1 nicht-messbar). Aber `bestesUrteil` ist bereits tragend (scoreboard.js:148/172/725
sortiert und zeigt danach, messband.js:66 und depot.js:744 als Rückfall), sechs
weitere Protokolle laufen gerade ein, und die heutige Regel (1a) macht `bestesUrteil`
**vor der nächsten Auslieferung** zur maßgeblichen Anzeige. Der erste `widerlegt`-Lauf
einer Mehrvarianten-Strategie würde still hinter einem freundlicheren Etikett
verschwinden — dieselbe Fehlerklasse, die heute schon zweimal (PM-Tabelle, 1a) eine
Etage höher korrigiert wurde, nur eine Etage tiefer.

## A. Code gegen Protokoll (Schnellcheck) — bestanden

Seit dem 03:15-Lauf sind an Code nur d689e62 (Lanczos-Konstanten, Testdatei),
e3998b1 (#91, Planungszahl) und 4276380 (#90, Laufband-CSS) dazugekommen — keine
Belegtexte. Die Tafel-Korrektur des PM (4bd1f44: kapitulation von (1a) nicht
betroffen, winkelbestaetigt schon) deckt sich mit meiner Zählung: bei kapitulation
trägt die stärkste-t-Variante (V2) selbst das `nicht-bestaetigt`; bei
winkelbestaetigt-2026-08-25 (4× nicht-entscheidbar, 1× nicht-bestaetigt) zeigt die
Max-t-Auswahl das freundlichere Urteil — der bekannte, zugeteilte Fund (1a).

## B. Placebo — nicht neu gefahren (bewusst)

Die Maschine hat sich seit dem sauberen Placebo von 03:15 nur um #91 (reine
Planungszahl, kein Signalpfad) und den `codeStand`-Stempel geändert; ein neuer Lauf
hätte dem Master CPU weggenommen. Stattdessen: die placebo-Blöcke aller 6 frischen
Protokolle geprüft (Punkt 4 oben) — die Maschine misst ihren Nullpunkt jetzt in
jedem Lauf selbst mit, und alle sechs sind sauber.

## C. Live gleich Messung — bestanden

Store der installierten App (v8.33.2 zur Prüfzeit; v8.33.3 wurde während dieses
Laufs von der Wache getaggt): intraday mode rsi2seit, 60m, confirmBps 15,
scalpHold 480, instrument basis, kapiZusatz an, regimeZuteilung an — deckungsgleich
mit der Messkonfiguration, unverändert gegen 03:15.

## E. Annahmen-Drift — unverändert

Kostenmessung Demo-Konto: weiterhin genau **1 Runde** (AAPL, 0,042 %) — seit fünf
Tagen keine neue Runde; kein Urteil möglich (~20 Runden vorgesehen). Der
freigegebene Auktionskosten-Auftrag (3a) wird diese Messung ohnehin anfassen —
erwähnt, nicht gemeldet.

## Maßstäbe dieses Laufs

Kein Code, kein Test, keine Konfiguration geändert; Messmaschine nicht aufgerufen.
Geprüft: 6 Protokolle × (Urteile, delta80, tage80, Placebo, Stand), 6 synthetische
Aggregationsfälle, 32 Protokolle Bestandsaufnahme. Der Fund ist ein Logik-, kein
Statistikbefund — MDE entfällt, die Gegenprobe ist deterministisch nachstellbar.
Nächste Nacht (03:15): **D über die dann vollständigen 12 frischen Protokolle**
(Archiv reicht dann ggf. bis 25.08.) — sonst F-Rotation Punkt 3 (Clusterung über Tage).
