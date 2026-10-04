# Frage 1 — Handelt das Intraday-Depot genau die gemessene Regel `rsi2seit`?

Prüfzweig `pruefung/live-gegen-messung-intraday`, Stand `a582416`. Prüfer-Sitzung; kein App-Code geändert.
Simulation mit virtuellem Kapital, keine Anlageberatung.

**Bewertung:** **A** = falsches Geld / andere Positionen als gemessen · **B** = falsche Anzeige / Messung ·
**C** = Schönheit · **=** = kein Unterschied (geprüft und übereinstimmend).

**Kleinsttests:** `node pruefberichte/live-gegen-messung-intraday/frage1-regel.test.js` — jeder Test druckt
genau eine Zeile `ZEIGT ABWEICHUNG: …` oder `kein Unterschied: …`. Der Live-Pfad (`depot.js intradayScan`)
läuft dort **echt** in einer vm-Sandbox (Quelltext unverändert gelesen; nur Speichern/Zeichnen/Schattenbuch/
Universum/Termin-Abruf sind Attrappen), mit gestellter Uhr (`Date` ersetzt), Kunstkerzen und ohne Netz.
Die Soll-Seite kommt aus `studien/messmaschine/strategien/rsi2seit.js` + `messmaschine.js`.

**Die gemessene Regel** (`rsi2seit.js:6-25`, `messmaschine.js:200-207, 222-231, 1010-1015`, Protokoll
`protokolle/rsi2seit-2026-08-26.json`): Signal `Q.einstiegSignal(bars, i, P)` mit
`P = {ENTRY:'rsi2seit', LINE:'ema', period:20, confirmBps:15, ZTHR:1.5, MINQ:0, CHAN/MTF/TREND:false}`,
nur Long, 60m-Kerzen, **jede** Signalkerze zählt (104.900 Signale auf 2.874 Werten), Einstieg zum
**Schluss der Signalkerze**, Ausstieg zum **Schluss der 8. Folgekerze**, **kein Stop**, Kosten 2 × 5 Bp,
Vorlauf 261 Kerzen, kein Regime-, Liquiditäts- oder sonstiger Filter.

---

## F1-01 — Signal: Kerzenquelle, Kerzenzeit, Vorlauf, RSI — **=** kein Unterschied
- Messung: `rsi2seit.js:21-24` → `quant.js:1748` `einstiegSignal` → `rsiExtremSignal(win)` (`quant.js:946`,
  RSI(2) aus `quant.js:33`, EMA100 über das 261-Kerzen-Fenster) + `kanalUeber(bars, ci-200, ci)` (`quant.js:2419`)
  + Volumen > 1,3 × Mittel der 50 Vorkerzen. Vorlauf `messmaschine.js:94` (261).
- Live: `depot.js:2826-2868` Abruf 60m (`fetchIntradayYahoo`, `depot.js:2607`, `bereinigt:false`, Yahoo-Stempel
  Kerzenbeginn :30), gemischt mit dem App-Archiv (`archS.slice(-800)`), `Q.fertigeBars` (`quant.js:2740`),
  Sperre `< 261` (`depot.js:2864`), dann **dieselbe** Funktion `Q.einstiegSignal` (`depot.js:3045-3049`).
- Kerzengrenzen: beide Seiten Yahoo-Stundenkerzen 9:30/10:30/…/15:30 NY (letzte halbstündig). Keine
  Aggregation aus 5m. Das Fenster wird in `einstiegSignal` selbst auf 261 Kerzen geschnitten — `slice(-800)` ändert nichts.
- Test **F1-01** fährt einen Handelstag durch den echten Scan: live steigt beim ersten Scan nach Schluss
  genau der Kerze ein, auf der `rsi2seit.js` das Signal sieht.

## F1-02 — Parameter des Signals (ZTHR 2,0 statt 1,5) — **C** (wirkungslos)
- Messung `rsi2seit.js:6-7`: `ZTHR: 1.5`. Live `depot.js:3045-3049`: `ZTHR: zOf(cfg.confirmBps)` = `zOf(15)` = **2,0**
  (`depot.js:2431`); ebenso Edge-Wächter `depot.js:6171-6172` und benannte Regeln `depot.js:558-560`.
- Für `ENTRY:'rsi2seit'` liest `einstiegSignal` weder `ZTHR` noch `LINE`/`confirmBps` (`quant.js:1814-1836`);
  CHAN/MTF/TREND sind auf beiden Seiten `false` (`cfg.channel/mtf = true` im Depot wirken nur für `wave`/1m).
- Test **F1-02**: beide Parametersätze (der Live-Satz aus dem Quelltext von `depot.js` gelesen) auf
  5 × 900 Kunstkerzen — 0 verschiedene Signale. Der Unterschied ist eine Falle für später (würde jemand
  `kapitulation` mit demselben Objekt messen, wirkte ZTHR sofort) — daher C, nicht „=“.
- Nebenbefund: `period` > 65 verlängert das Fenster über 261 (`quant.js:1750`); mit `period 80` auf den
  Kunstkerzen trotzdem 0 Abweichungen (EMA eingeschwungen).

## F1-03 — Unfertige laufende Kerze — **=** kein Unterschied
- Messung: jede `bars[i]` des Archivs ist eine fertige Kerze (`messmaschine.js:995-1003`).
- Live: `depot.js:2858` `Q.fertigeBars(bars, 60, now)` (`quant.js:2740-2745`) wirft jede Kerze ab, deren Stempel
  jünger als 60 min ist; Ausstiegszählung und Signal laufen beide auf `sigBars`.
- Test **F1-03**: 30 min in der Signalkerze liefert der Abruf die Kerze schon mit ihren Endwerten — live 0 Einstiege,
  nach Kerzenschluss 1. (Nebenwirkung der Stempel-plus-60-min-Regel siehe F1-04.)

## F1-04 — Signal auf der Schlusskerze 15:30–16:00: Einstieg erst am nächsten Morgen — **A**
- Messung: Einstieg zum Schluss der Signalkerze (`messmaschine.js:200-207`, Konvention `schlusskerze`, Protokoll C8),
  also 16:00 NY. Laut Protokoll `rsi2seit-2026-08-26.json` (Feld `positionen`) liegen **38.163 von 104.900
  Signalen (36 %)** auf dieser Kerze („6G“).
- Live: Die 15:30-Kerze ist nur 30 min lang, `fertigeBars` hält sie bis 16:30 für unfertig (`quant.js:2743`); ab 16:00
  ist `marketOpen()` falsch und der Scan kehrt sofort zurück (`depot.js:2754-2755`). Das Signal wird erst am nächsten
  Handelstag ab 9:30 gelesen und zum **Kurs des Morgens** gekauft (`depot.js:2846` Spot = letzter Kurs der Abrufreihe).
  Die ganze erste Stunde lang gilt die gestrige Schlusskerze als „jüngste fertige“. Gleiches an Halbtagen (13:00).
- Folge: live wird genau die Übernachtlücke (S9 „Einstiegslücke“ der Messung) **nicht** mitgenommen, die die Messung
  in ihrem Ertrag enthält — bei einem Drittel aller Signale.
- Test **F1-04**: Signal Mi 10.06.2026 15:30 — Messung kauft 16:00 zu 103,84; live Do 9:31 zu 105,92 (+2,0 % Kunstlücke).

## F1-05 — Einstiegskurs innerhalb der Sitzung: Spot beim Scan statt Schluss der Signalkerze — **B**
- Messung: `einstiegKurs(b, i, 'schlusskerze')` = `bars[i][1]` (`messmaschine.js:200-207`).
- Live: `entrySpot = spot` = letzter Kurs der Abrufreihe beim ersten Scan nach Kerzenschluss = Kurs in der laufenden
  Folgekerze (`depot.js:2846`, `3355ff`), `entry = spot × (1 + 0,0005)` (`depot.js:3274-3275`). Das ist der
  Konvention nach `folgeEroeffnung`, nicht `schlusskerze`. Innerhalb der Sitzung ist der Abstand am echten Markt im
  Mittel ~0 (Zweig E, `messmaschine.js:189-193`: −0,00003 Pp) — deshalb B (andere Konvention, kleine Größe); über
  Nacht ist es F1-04.
- Test **F1-05**: Kunstverlauf mit +0,3 % Folge-Eröffnung — live kauft genau dort, nicht zum Schluss.

## F1-06 — Ausstieg: 9 statt 8 Kerzen, und zum Spot danach — **A**
- Messung: `ausstiegKurs(b, i + 8, 'schluss')` = Schluss der **8.** Folgekerze (`messmaschine.js:222-231, 1014`).
- Live (`depot.js:2906-2917`): zählt fertige Kerzen mit Stempel `> open.openT`. `openT` ist die Scanzeit nach
  Kerzenschluss (z. B. 10:31), die erste Folgekerze trägt den Stempel 10:30 und **zählt nie mit**. Ausgestiegen wird,
  wenn die **9.** Folgekerze fertig ist, zum Spot des nächsten Scans (`depot.js:2956`, `closeTrade` `depot.js:2098`).
- Liegt die 9. Folgekerze auf 15:30, wird sie erst um 16:30 „fertig“ — dann ist die Börse zu, der Ausstieg rutscht
  auf den nächsten Morgen (Übernachtlücke, wie F1-04 auf der Ausstiegsseite).
- Test **F1-06**: Signal Di 09.06.2026 10:30 — Messung raus Mi 12:30 (8 Kerzen); live Mi 13:31 nach 9 Kerzen.

## F1-07 — Wochenende: 2-Tage-Schutznetz schließt vor der 8. Kerze — **A**
- Messung: 8 Handelskerzen, Kalender egal.
- Live: `depot.js:2901` — `open.uebernacht && now - open.openT > 2 Tage` (bei `maxHoldMin` < 1000, also rsi2seit)
  → „Schutzschließung“; diese Prüfung steht **vor** der Kerzenzählung. Jede Position, deren 8 Kerzen über ein
  Wochenende reichen (Signal Do-Nachmittag bis Fr), wird Montag beim ersten Scan geschlossen.
- Test **F1-07**: Signal Fr 12.06.2026 10:30 — Messung raus Mo 12:30 nach 8 Kerzen; live Mo 9:31 nach 5.

## F1-08 — Feiertag: dasselbe Netz, noch früher — **A**
- Wie F1-07; mit Feiertag vor dem Wochenende fallen die Positionen schon nach einer Kerze heraus.
- Test **F1-08**: Signal Do 02.04.2026 14:30 (Karfreitag zu, `boerse.js`) — Messung raus Mo 06.04. 16:00; live Mo 9:31
  nach **1** Kerze.

## F1-09 — Not-Stopp −20 % — **A** (selten)
- Messung: `rsi2seit.js` hat kein `stopNiveau` → reiner Zeitausstieg (`messmaschine.js:1018-1031`, Protokoll
  `ausstieg.art: "Zeit"`). Die MCP-Variante (`rsi2seit-mcp.js`) ist eine **andere**, separat gemessene Regel; live gibt
  es keinen MCP-Stopp.
- Live: `modeParams` `depot.js:2524-2535` → `sl: slOf(c)` = −(scalpSL 20)/100 = **−0,20** (`depot.js:2484`), gesetzt am
  Trade (`depot.js:3286`, `sl: slT`), geprüft gegen den Geldkurs `depot.js:2903`. Mit `scalpSL:'auto'` wäre es
  `Q.autoStop` (Volatilität × Hebel). Dazu der Capital-Demo-Spiegel mit Stop-Level (nur Spiegel, kein Buchgeld).
- Test **F1-09**: −22 % drei Kerzen nach dem Einstieg, Erholung bis zur 8. — live raus nach 3 Kerzen zu −22 %,
  Messung −1 %.

## F1-10 — Kein Gewinnziel, kein Nachziehstopp — **=** kein Unterschied
- Messung: nur Zeit. Live: `modeParams` rsi2seit `tp: null, trail: 0` (`depot.js:2531-2532`), `exitMode 'zeit'`
  ohne Signal-Ausstieg (`depot.js:2938-2941`). Die Depot-Vorgaben `tp 0,35` / `scalpTrail 15` greifen nicht.
- Test **F1-10**: +40 % und Rückfall — Ausstieg nur über „Haltedauer“.

## F1-11 — Kosten: 5 Bp je Seite auf dem Basiswert — **=** kein Unterschied
- Messung: `kosten.spanneBp 5` → `2 × 5 Bp` je Umlauf, abgezogen vom Brutto (`messmaschine.js:983, 1083`).
- Live (`instrument:'basis'`): Brief `spot × 1,0005` (`depot.js:3272-3276`, `basisSpanne` `depot.js:2316-2319`), Geld
  `spot × 0,9995` (`bidOf` `depot.js:2026-2029`), `orderFee 0`. Multiplikativ statt additiv: < 0,001 Bp.
- Test **F1-11**: gebuchte Rendite pnl/cost gegen Mess-Formel auf denselben Spots — Differenz 0,000 Bp.

## F1-12 — Instrument: Schein statt Aktie bei Bestandsdepots — **A** (einstellungsabhängig)
- Messung: Aktie, linear, 5 Bp. Live: `istBasis = cfg.instrument === 'basis'` (`depot.js:3234`); sonst
  ATM-Schein (Profil `atm60_b`) mit Modell-Spanne, Hebel, Zeitwert, Vega. **`depotmigration.js:89` setzt bei jedem
  Bestandsdepot, das das Feld noch nicht hatte, ausdrücklich `instrument:'schein'`** — Neuinstallationen bekommen
  `'basis'` (`depot.js:38`).
- Test **F1-12**: mit `'schein'` — Spanne 81 Bp je Seite, Hebel 20,6 statt 5 Bp / Hebel 1.

## F1-13 — Positionsgröße: Verlustserie halbiert, ab 5 Verlusten Sperre — **B**
- Messung: jedes Signal gleich gewichtet (`roh.push` je Signal, `messmaschine.js:1050-1052`).
- Live: fest 3 % des Depots je Trade (`sizing:'fix'`, `depot.js:3307-3322`) — entspricht gleichen Gewichten. Aber
  `lsFactor 0,5` ab 3 Verlusten am Tag (`depot.js:3177`), Sperre ab 5 (`depot.js:3176`). Mit `sizing` als Zahl:
  Risiko-Größe `equity × R % / max(0,08, |sl|)` — bei festem sl ebenfalls gleich. `positionsWert` (`depot.js:532`) bildet
  das für die Anzeige wörtlich ab (beim Basiswert ohne Deckel, beim Schein mit).
- Test **F1-13**: derselbe Einstieg mit Verlustserie 3 — Einsatz 1.500 $ statt 3.000 $.

## F1-14 — Welche Zahl das Live-Buch nachbildet: je Signal, nicht Tagesmittel — **B**
- Messung: Urteil, t und MDE über das **Tagesmittel** (`messmaschine.js:118, 1065`, B1: Tage gleich gewichtet).
- Live: gleich große Trades → das Buch verdient das **Mittel je Signal** (Protokoll-Feld `jeSignal`).
- Im Protokoll (Bestätigung) liegen beide weit auseinander: Tagesmittel **+0,054 %**, je Signal **+0,021 %**. Wer das
  Live-Buch gegen das Tagesmittel hält, erwartet das 2,6-Fache dessen, was gleich große Trades aus derselben Messung
  nachbilden würden (abgesehen von F1-04 … F1-31).
- Test **F1-14**: Kleinstbeispiel durch `_intern.tagesMittel` / `_intern.jeSignal` der Maschine + Protokollzahlen.

## F1-15 — Folgesignale desselben Werts — **A**
- Messung: jede Signalkerze ein eigener Fall, auch bei laufendem Fenster (überlappend, B10; `messmaschine.js:995-1003`).
- Live: offene Position → nur verwalten, `continue` (`depot.js:2880-2957`); nach Ein- **und** Ausstieg 120 min
  Abklingzeit je Wert (`depot.js:3208-3209`, gesetzt `depot.js:2956` und am Einstieg), `maxPerDay 10` (`depot.js:3162`).
- Test **F1-15**: zwei Signale (10:30 und 11:30) — Messung 2 Fälle, live 1 Einstieg.

## F1-16 — Viele Werte gleichzeitig: Deckel 8 — **A**
- Messung: kein Deckel. Live: `canOpen` → `risiko.js:50-64` `maxPos 8` (zählt **alle** offenen Depot-Positionen, auch
  anderer Bücher), Klumpen-Deckel 8 gleichgerichtete (`depot.js:3243-3251`), Halbleiter-Deckel 4 (`depot.js:3255-3270`),
  `maxPerDay 10`, `exposurePct 40`. Welche 8 von 12 drankommen, entscheidet die Reihenfolge der Symbolliste.
- Test **F1-16**: 12 gleiche Werte, 12 Signale auf derselben Kerze — live 8 („Risiko-Limit x4“).

## F1-17 — Tagesschluss-Sperre — **=** kein Unterschied
- `isNearUsClose` (`depot.js:2705-2718`, sommerzeit- und halbtagsfest) sperrt nur ohne Übernacht-Erlaubnis
  (`depot.js:3115`); rsi2seit hat `uebernacht:true`. Keine Vor-/Nachbörse (kein `prePost` im Abruf).
- Test **F1-17**: erster Scan erst 15:50 — Einstieg erfolgt.

## F1-18 — Zeitzone / Sommerzeit-Wochen US≠EU — **=** kein Unterschied
- Kerzenstempel sind UTC-ms, `fertigeBars` rechnet in ms, Börsenöffnung aus `quant.js` (`usSommerzeit`,
  `minutenSeitOeffnung`), Börsentage aus `boerse.js`. Berliner Wanduhr nur bei `avoidHours`, von dem rsi2seit
  ausgenommen ist (`depot.js:3140-3152`). Tageszähler (`maxPerDay`, Verlustserie) laufen auf UTC-Datum — Wechsel
  20:00 NY, nach Börsenschluss.
- Test **F1-18**: 10.03.2026 (US Sommer, EU Winter) und 27.10.2026 (umgekehrt), Rechneruhr Europe/Berlin — Einstieg
  Kerzenschluss + 1 min, Ausstieg nach derselben Kerzenzahl wie in einer normalen Woche (die Zahl selbst ist F1-06).

## F1-19 … F1-24, F1-31 — Live-Filter, die die Messung nicht hat — **A**
Die Messung nimmt jedes Signal (`messmaschine.js:995-1003`). Live fallen Signale heraus durch:

| Kennung | Filter | Live-Stelle | Test |
|---|---|---|---|
| F1-19 | Tagesumsatz < `minDollarVol` 50 Mio $ (aus der 1-Monats-Reihe) | `depot.js:2874, 3155` | **F1-19** |
| F1-20 | Ergebnistermin innerhalb 30 h (Fr 78 h), nur bekannte Termine | `depot.js:3127-3138` | **F1-20** |
| F1-21 | Edge-Wächter-Pause (eigene 120-Tage-Messung mit 120-min-Abklingzeit und Drift-Kontrolle, `depot.js:6164-6215`; Pause `depot.js:6413-6418`) | `depot.js:3088-3094` | **F1-21** |
| F1-22 | Symbolsperre „Verlustbringer“ (≥ 6 Trades, Verlust, ≤ 34 % Treffer) | `depot.js:1417-1437, 2877` | **F1-22** |
| F1-23 | Event-Blackout FOMC/CPI/NFP ± 45 min (Vorgabe `blackout:'block'`) | `depot.js:2774, 3116` | **F1-23** |
| F1-24 | Kosten-Check (Streuung × √8 ≥ 1,5 × Umlaufkosten) | `depot.js:3287-3298`, `quant.js:1675` | **F1-24** |
| F1-31 | Kill-Switch Tagesverlust 3 %: sperrt **und** stellt alles glatt | `depot.js:2795`, `134` | **F1-31** |
| — | Veraltet-Prüfung `barsFrisch`, Reihe < 261 Kerzen, Abruffehler | `depot.js:3156-3161, 2864` | (Datenqualität, nicht getestet) |

## F1-25 — Regime-Zuteilung SPY > EMA200 — **=** in der Vorgabe
- Messung `rsi2seit` hat kein Regime. Live `regimeZuteilung: false` (`depot.js:38`), Filter nur wenn eingeschaltet
  (`depot.js:3101-3113`). `wiki/belegstand.md:409-418` führt R-TREND als „eingebaut“ — das ist ein **Schalter**, und der
  Vermerk vom 04.10. sagt, dass t = 3,2 die Zuteilung nicht mehr belegt. Eingeschaltet wäre es ein zusätzlicher Filter (A).
- Test **F1-25**: Vorgabe aus, kein SPY-Abruf, Einstieg erfolgt.

## F1-26 — Universum: 2.874 gemessen, 99 gehandelt — **B**
- Messung: alles im 60m-Archiv außer `-USD` (`messmaschine.js:801`; Protokoll `universum.werte 2874`, Überlebende).
- Live: 15 Basis-Kacheln (`renderer.js:24-40`) + Pool `auto` 84 Werte (`depot.js:1954-1957`; wahlweise
  `volatil`/`sp100`/`ndx100`/`dax`, `depot.js:1965-1977` — **DAX-Werte liegen gar nicht im gemessenen US-Archiv**) +
  Watchlist. Die Messung beschreibt einen Mittelwert über 2.874 meist kleinere Werte, gehandelt wird auf ~99 Großwerten.
- Test **F1-26**: zählt beide Listen aus dem Quelltext — 99 gegen 2.874.

## F1-27 — Capital-Rückfall: Signal auf CFD-Kerzen — **A** (bedingt)
- Messung: Yahoo-Archiv (Börsenvolumen). Live: liefert Yahoo nichts und ist das Demo-Konto verbunden, kommen die Kerzen
  von Capital.com (`depot.js:2598-2606`) und gehen markiert ins Archiv (`depot.js:2826-2827`). Die
  Volumenbestätigung des Signals rechnet dann auf CFD-Volumen.
- Test **F1-27**: gleiche Schlusskurse, CFD-Volumen flach — kein Signal live.

## F1-28 — Krypto im Live-Universum — **A** (Schalter `kryptoHandeln`, Vorgabe aus)
- Messung schließt `-USD` aus (`rsi2seit.js:19`, `messmaschine.js:801`). Live hängt `kryptoHandeln` acht Krypto-Werte an
  (`depot.js:2768`) und handelt dort denselben Modus — mit 10 Bp und Wanduhr- statt Kerzen-Haltedauer (`depot.js:2918`).
- Test **F1-28**: Einstieg auf BTC-USD.

## F1-29 — Sperre eines Werts mit offener Position setzt den Zeitausstieg aus — **A**
- Live: die Symbolsperre (`depot.js:2877`) steht **vor** der Verwaltung offener Positionen (`depot.js:2880ff`) und
  springt mit `continue`. Wird ein Wert mit offener Position gesperrt (Hand-Sperre, oder automatisch), wird diese
  Position weder nach 8 Kerzen noch per Stop geschlossen — nur noch der Kill-Switch erreicht sie. (Die Sperre der
  Position *vor* dem Kauf ist F1-22.) Messung: Ausstieg nach 8 Kerzen, immer.
- Test **F1-29**: Wert direkt nach dem Einstieg gesperrt — nach 14 Kerzen noch offen.

## F1-30 — Abklingzeit 120 min, Tageslimit 10 — **A** (Teil von F1-15/F1-16)
- Live `modeParams` rsi2seit (`depot.js:2524-2535`): `cooldownMin 120`, `maxPerDay 10`, `maxHoldMin 480`, `sl −0,2`;
  Abklingzeit auch nach dem **Ausstieg** gesetzt (`depot.js:2956`). Ein neues Signal desselben Werts in den zwei
  Stunden nach dem Zeitausstieg wird nicht gehandelt; die Messung kennt keine Abklingzeit.
- Test **F1-30**: liest `modeParams` aus der Sandbox und die Setzstelle aus dem Quelltext.

## Nicht beteiligt / ohne eigenen Test
- `openTrade` (`depot.js:2053`) gehört zur **Stunden-Strategie** (Scheine, `strategy:'hourly'`); der Intraday-Pfad
  eröffnet inline in `intradayScan` (`depot.js:3355`). `kerzenquelle.js`, `bestand.js`, `bestandui.js`, `strategien.js`
  werden vom Intraday-Handelspfad nicht benutzt (kein Aufruf in `depot.js`).
- Kapitulations-Zusatz (`kapiZusatz`, `depot.js:3058-3065`): handelt im rsi2seit-Modus eine **andere** Regel mit 26 Kerzen;
  Vorgabe aus, die Migration schaltet ihn aus (`depotmigration.js:181`). Eingeschaltet: A.
- Haltedauer `scalpHold` ist einstellbar (`depot.js:2533`): jeder Wert ≠ 480 ist eine andere als die gemessene Regel.
- Extra-Pool-Takt: Pool-Werte werden nur einmal je neuer Basis-Kerze abgefragt (`depot.js:1990-2005`) — das fällt auf
  den Kerzenbeginn, also auf denselben Zeitpunkt wie der Einstieg/Ausstieg; keine eigene Abweichung gefunden.

## Kurzliste
| Kennung | Bew. | Messung | Live | Ein Satz |
|---|---|---|---|---|
| F1-01 | = | rsi2seit.js:21-24, quant.js:1748/946/2419 | depot.js:2826-2868, 3045 | Gleiche Funktion auf denselben fertigen Yahoo-60m-Kerzen mit ≥ 261 Vorlauf. |
| F1-02 | C | rsi2seit.js:6 (ZTHR 1,5) | depot.js:3045-3049 (zOf → 2,0) | Parameter verschieden, für rsi2seit wirkungslos. |
| F1-03 | = | messmaschine.js:995 | depot.js:2858, quant.js:2740 | Laufende Kerze wird nicht als Signalkerze gelesen. |
| F1-04 | A | messmaschine.js:200-207 | depot.js:2754-2755, 2846; quant.js:2743 | Signale der 15:30-Kerze (36 %) werden erst am nächsten Morgen gekauft. |
| F1-05 | B | messmaschine.js:200-207 | depot.js:2846, 3272-3276 | Einstieg zum Spot nach Kerzenschluss statt zum Schluss. |
| F1-06 | A | messmaschine.js:222-231, 1014 | depot.js:2906-2917 | Live hält 9 statt 8 Kerzen. |
| F1-07 | A | messmaschine.js:1014 | depot.js:2901 | Wochenende: 2-Tage-Netz schließt Montag früh nach 5 Kerzen. |
| F1-08 | A | messmaschine.js:1014 | depot.js:2901 | Feiertag + Wochenende: nach 1 Kerze geschlossen. |
| F1-09 | A | rsi2seit.js (kein stopNiveau) | depot.js:2484, 2903, 3286 | Not-Stopp −20 % live, keiner gemessen. |
| F1-10 | = | rsi2seit.js | depot.js:2531-2532 | Kein Ziel, kein Nachziehstopp. |
| F1-11 | = | messmaschine.js:983, 1083 | depot.js:2316-2319, 2026-2029 | 5 Bp je Seite. |
| F1-12 | A | rsi2seit.js:20 | depot.js:3234, depotmigration.js:89 | Bestandsdepots handeln Schein statt Aktie. |
| F1-13 | B | messmaschine.js:1050 | depot.js:3176-3177 | Verlustserie halbiert/sperrt. |
| F1-14 | B | messmaschine.js:118, 1065 | depot.js:3307-3322 | Live = Mittel je Signal (+0,021 %), Urteil = Tagesmittel (+0,054 %). |
| F1-15 | A | messmaschine.js:995-1003 | depot.js:2880-2957 | Folgesignale bei offener Position entfallen. |
| F1-16 | A | messmaschine.js:995-1003 | risiko.js:63, depot.js:3243 | Höchstens 8 gleichzeitig. |
| F1-17 | = | — | depot.js:3115 | Tagesschluss-Sperre greift nicht. |
| F1-18 | = | messmaschine.js:333-345 | quant.js:1696-1717, depot.js:2858 | Keine Zeitzonen-Abweichung. |
| F1-19 | A | — | depot.js:2874, 3155 | Liquiditätsfilter. |
| F1-20 | A | — | depot.js:3127-3138 | Zahlen-Blackout. |
| F1-21 | A | — | depot.js:3088-3094 | Edge-Wächter-Pause. |
| F1-22 | A | — | depot.js:2877 | Symbolsperre vor dem Kauf. |
| F1-23 | A | — | depot.js:2774, 3116 | Event-Blackout. |
| F1-24 | A | — | depot.js:3296-3298 | Kosten-Check. |
| F1-25 | = | — | depot.js:38, 3101 | Regime-Filter in der Vorgabe aus. |
| F1-26 | B | messmaschine.js:801 | depot.js:1954, renderer.js:24 | 2.874 gemessen, 99 gehandelt. |
| F1-27 | A | messen.js (Yahoo-Archiv) | depot.js:2598-2606 | CFD-Kerzen im Rückfall. |
| F1-28 | A | messmaschine.js:801 | depot.js:2768 | Krypto per Schalter. |
| F1-29 | A | messmaschine.js:1014 | depot.js:2877 | Sperre friert offene Position ein. |
| F1-30 | A | — | depot.js:2524-2535, 2956 | Abklingzeit 120 min. |
| F1-31 | A | — | depot.js:2795 | Kill-Switch. |

## Bezug zu `wiki/belegstand.md`
- `:265` führt `rsi2seit` als „nicht entscheidbar“ mit **+0,021 Pp je Signal** und **Tagesmittel +0,054** — beide Zahlen
  stimmen mit dem Protokoll überein (F1-14 zeigt, welche davon das Live-Buch nachbildet).
- `:409-418` R-TREND: siehe F1-25 — in der App ein Schalter, Vorgabe aus.

## Lauf (Stand `a582416`, `node pruefberichte/live-gegen-messung-intraday/frage1-regel.test.js`)
31 Tests: 23 „ZEIGT ABWEICHUNG“, 8 „kein Unterschied“ (F1-01, -02 [C, wirkungslos], -03, -10, -11, -17, -18, -25).

```
kein Unterschied: F1-01 Signal: dieselbe Kerze, dieselbe Funktion (rsi2seit.js gegen intradayScan) — Messung: Signal auf der Kerze 10.06. 11:30 NY; live: 1 Einstieg(e), erster um 10.06. 12:31 NY (= erster Scan nach Kerzenschluss ja)
kein Unterschied: F1-02 Kanal-/Signalparameter: Live-P (zOf) gegen gemessenes P (ZTHR 1,5) — Parameter verschieden in: ZTHR (live ZTHR 2, Messung 1.5); Signale auf 4.195 Kunstkerzen verschieden: 0 -> fuer rsi2seit wirkungslos. Nebenbefund: mit period 80 wichen 0 Kerzen ab (Fenster > 261).
kein Unterschied: F1-03 Unfertige laufende Kerze wird nicht als Signalkerze gelesen — Scan 30 min in der Signalkerze (Endwerte sichtbar): 0 Einstieg(e) (Soll 0); nach Kerzenschluss: 1 (Soll 1) - fertigeBars (quant.js) schneidet die laufende Kerze ab
ZEIGT ABWEICHUNG: F1-04 Signal auf der Schlusskerze (15:30): Einstieg erst am naechsten Morgen — Messung: Einstieg 10.06. 16:00 NY zu 103.84; live: 11.06. 09:31 NY zu 105.92 (+2.000 % = Uebernachtluecke, 18 h spaeter)
ZEIGT ABWEICHUNG: F1-05 Einstiegskurs innerhalb der Sitzung: Spot beim Scan statt Schluss der Signalkerze — Messung kauft zu Schluss(Signalkerze) 103.842, live zu Spot 104.154 (+0.300 %) = Eroeffnung der Folgekerze (Konvention folgeEroeffnung statt schlusskerze); Briefkurs 104.206 (+5 Bp)
ZEIGT ABWEICHUNG: F1-06 Ausstieg: Zahl der gehaltenen Kerzen und Ausstiegskurs — Messung: raus zum Schluss der 8. Folgekerze 10.06. 12:30 NY zu 103.646; live: 10.06. 13:31 NY nach 9 fertigen Folgekerzen zu 104.206 (+0.541 %), Grund "Haltedauer erreicht (8 Handelskerzen à 60 Min)"
ZEIGT ABWEICHUNG: F1-07 Ausstieg ueber das Wochenende (Signal Freitag) — Messung: raus 15.06. 12:30 NY nach 8 Kerzen; live: 15.06. 09:31 NY nach 5 Kerzen, Grund "Übernacht-Position über dem Schutznetz (2 Tage) – Schutzschließung"
ZEIGT ABWEICHUNG: F1-08 Ausstieg ueber Feiertag + Wochenende (Signal vor Karfreitag) — Messung: raus 06.04. 16:00 NY nach 8 Kerzen; live: 06.04. 09:31 NY nach 1 Kerzen, Grund "Übernacht-Position über dem Schutznetz (2 Tage) – Schutzschließung"
ZEIGT ABWEICHUNG: F1-09 Not-Stopp -20 % live, kein Stop in der Messung — Messung: kein Stop, raus nach 8 Kerzen zu -1.000 % brutto; live sl=-0.2, raus nach 3 Kerzen zu -22.000 %, Grund "Stop-Loss erreicht (-22 %)"
kein Unterschied: F1-10 Kein Gewinnziel und kein Nachziehstopp (wie gemessen) — live tp=null, trail=0, Ausstieg "Haltedauer erreicht (8 Handelskerzen à 60 Min)" (Soll: nur Zeit; Zeitpunkt siehe F1-06)
kein Unterschied: F1-11 Kosten: 5 Bp je Seite auf dem Basiswert — gebuchte Rendite -0.050 % gegen Mess-Formel -0.050 % (Differenz -0.000 Bp), basis=true, spx=0.0005
ZEIGT ABWEICHUNG: F1-12 Instrument Schein statt Aktie (Bestandsdepots) — live basis=false, Spanne je Seite 81 Bp (Messung 5), Hebel 20.6 (Messung 1)
ZEIGT ABWEICHUNG: F1-13 Positionsgroesse: Verlustserie halbiert das Gewicht eines Signals — Einsatz ohne Serie 3000 $ (= 3 % von 100.000), mit 3 Verlusten 1500 $ (Faktor 0.50); Messung: Faktor 1
ZEIGT ABWEICHUNG: F1-14 Gewichtung: Live-Buch = Mittel je Signal, Urteil = Tagesmittel — Kleinstbeispiel: Tagesmittel +0.400 % gegen je Signal (= gleich grosse Live-Trades) +0.100 %; Protokoll Bestaetigung: Tagesmittel +0.054 %, je Signal +0.021 %
ZEIGT ABWEICHUNG: F1-15 Mehrere Signale desselben Werts innerhalb der Haltedauer — Messung: 2 Signale (Kerzen 09.06. 10:30 NY und 09.06. 11:30 NY), jedes ein eigener Trade; live: 1 Einstieg(e) - das zweite Signal trifft auf die offene Position, die nur verwaltet wird (depot.js "if (open) { ... continue; }")
ZEIGT ABWEICHUNG: F1-16 Gleichzeitige Signale vieler Werte (Deckel) — Messung: 12 Signale = 12 Trades; live: 8 eroeffnet. Wartegruende: Risiko-Limit x4
kein Unterschied: F1-17 Tagesschluss-Sperre greift fuer rsi2seit nicht — Einstieg um 09.06. 15:50 NY trotz isNearUsClose (uebernacht=true)
kein Unterschied: F1-18 Zeitzone: Wochen mit verschiedener Sommerzeit US/EU — 10.3.: Einstieg 10.03. 11:31 NY (Kerzenschluss+1 min), Ausstieg nach 9 Kerzen; 27.10.: Einstieg 27.10. 11:31 NY (Kerzenschluss+1 min), Ausstieg nach 9 Kerzen - normale Woche: 9 Kerzen (die Kerzenzahl selbst ist F1-06)
ZEIGT ABWEICHUNG: F1-19 Liquiditaetsfilter minDollarVol 50 Mio $ je Tag — Wert mit ~3,5 Mio $ Tagesumsatz, Signal laut Messung vorhanden; live kein Einstieg: Zu wenig Liquidität x1
ZEIGT ABWEICHUNG: F1-20 Zahlen-Blackout (Ergebnistermin in den naechsten 30 h) — Termin am Folgetag vor Boersenbeginn; live kein Einstieg: Zahlen stehen an (10.6.2026) – kein Übernacht-Einstieg x1
ZEIGT ABWEICHUNG: F1-21 Edge-Waechter-Pause — edgePause gesetzt; live kein Einstieg: Edge-Wächter (RSI(2)): Vorsprung verfallen – neue Einstiege pausiert x1
ZEIGT ABWEICHUNG: F1-22 Symbolsperre "Verlustbringer" — symBlock gesetzt; live kein Einstieg: Symbol gesperrt (Verlustbringer) x1
ZEIGT ABWEICHUNG: F1-23 Event-Blackout (FOMC/CPI/NFP +-45 min, Vorgabe blackout "block") — Termin-Fenster aktiv; live kein Einstieg: Event-Blackout x1
ZEIGT ABWEICHUNG: F1-24 Kosten-Check (Bewegung muss 1,5 x Kosten decken) — ruhiger Wert (Stundenstreuung ~0,01 %), Signal laut Messung vorhanden; live kein Einstieg: Kosten-Check: Bewegung deckt Kosten nicht x1
kein Unterschied: F1-25 Regime-Zuteilung (SPY > EMA200) - Vorgabe aus — regimeZuteilung=false, SPY-Abrufe 0, Einstieg ja (eingeschaltet waere es ein Filter, den die Messung rsi2seit nicht hat)
ZEIGT ABWEICHUNG: F1-26 Universum: gemessen 2.874 Werte, live ~100 — Messung: 2874 Werte (Archiv-Store, Auswahl zum Messzeitpunkt (Ueberlebende)); live: 15 Basis + 84 Pool = 99 verschiedene Werte (+ Watchlist)
ZEIGT ABWEICHUNG: F1-27 Capital-Rueckfall: Signal auf CFD-Kerzen — Yahoo stumm, Capital liefert dieselben Schlusskurse mit CFD-Volumen (Messung auf Yahoo: Signal); live kein Einstieg: (kein Wartegrund - kein Signal) - die Volumenbestaetigung rechnet auf CFD-Volumen
ZEIGT ABWEICHUNG: F1-28 Krypto-Werte im Live-Universum (Schalter kryptoHandeln) — Messung: -USD nicht im Universum; live mit kryptoHandeln: 1 Einstieg(e) auf BTC-USD (Spanne 10 Bp)
ZEIGT ABWEICHUNG: F1-29 Sperre eines Werts mit offener Position setzt den Zeit-Ausstieg aus — Wert nach dem Einstieg gesperrt; nach 14 Kerzen ist die Position NOCH OFFEN (Messung: raus nach 8)
ZEIGT ABWEICHUNG: F1-30 Abklingzeit 120 min nach jedem Ein- und Ausstieg — modeParams rsi2seit: cooldownMin 120, maxPerDay 10, maxHoldMin 480, sl -0.2; Abklingzeit auch nach dem Ausstieg gesetzt: true (Messung: keine)
ZEIGT ABWEICHUNG: F1-31 Kill-Switch (Tagesverlust-Limit) sperrt Einstiege — Kill-Switch fuer heute aktiv; live kein Einstieg: Kill-Switch: Handel bis Tagesende gesperrt x1
```
