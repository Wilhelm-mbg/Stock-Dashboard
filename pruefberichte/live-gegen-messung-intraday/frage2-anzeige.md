# Frage 2 — Was zeigt die Oberfläche über die Regel des Intraday-Depots (`rsi2seit`), und stimmt jede Zahl?

Prüfzweig `pruefung/live-gegen-messung-intraday`, Stand `a582416`. Prüfer-Sitzung, kein App-Code geändert.
Bewertung: **A** = falsches Geld / falsche Positionen, **B** = falsche Anzeige / Messung, **C** = Schönheit
(auch: Zahl steht nur in einem Kommentar).

Kleinsttests: `node pruefberichte/live-gegen-messung-intraday/frage2-anzeige.test.js`
(eine Zeile je Test; `PRUEF_WURZEL=<ordner>` prüft einen anderen Stand). Die Text-erzeugenden
Funktionen aus `depot.js` (`kantenAusProtokollen`, `regelKopfAnzeigen`, `huerdeAnzeigen`,
`renderKlartext`, `edgeZustand`, `scanKopfText`, `renderIntradayKarte`) laufen dort herausgeschnitten
in einer Sandbox mit fester Uhr, echten Protokollen aus `studien/messmaschine/protokolle/` und
echtem `studienurteile.js`; die Soll-Werte werden aus `wiki/belegstand.md` und dem Protokoll gelesen.

## Das Soll

| Größe | Wert | Fundstelle |
|---|---|---|
| Urteil | **nicht entscheidbar** (`bestesUrteil: nicht-entscheidbar`) | `wiki/belegstand.md:265`, `rsi2seit-2026-08-26.json` |
| Überschuss je Signal (Bestätigung) | **+0,021 Pp** | ebd. `ergebnisse[0].bestaetigung.ueberschuss.jeSignal` |
| Tagesmittel / se / Band | +0,054 / 0,065 / [−0,073; 0,182] | ebd. |
| Entdeckung je Signal | **−0,011 Pp** (Tagesmittel +0,055) | ebd. `entdeckung.ueberschuss` |
| Kosten je Umlauf / netto je Signal | 0,10 Pp (5 Bp je Seite) / **−0,079 Pp** | ebd. `kosten`, `nettoJeSignalBestaetigung` |
| Haltedauer / Ausstieg | 8 Kerzen 60m, Zeit-Ausstieg, **kein Stopp** | ebd. `strategie.haltedauerKerzen`, `ausstieg` |
| Universum | 2.874 Werte (Überlebende), 730 Handelstage | ebd. `universum` |
| MCP-Varianten | obere Grenzen 0,083–0,118 Pp | `rsi2seit-mcp-2026-08-26.json`, `belegstand.md:322-329` |
| Regime, RSI-Teil | +0,148 über / −0,169 unter EMA200 — **nicht neu gemessen, weder bestätigt noch widerlegt** | `belegstand.md:415-416` (Vermerk 04.10.) |
| Belegstand gesamt | **null belegte Kanten** | `CLAUDE.md` |

`+0,147 Pp`, `t = 4,1`, `162 Werte`, `99 Werte`, `+0,235`, `+0,017`, `−96 %`, `+0,23 %`, `−0,08 %`
stehen **weder** in `belegstand.md` **noch** in einem `rsi2seit`-Protokoll. `FEHLERTYPEN.md` D2 führt
„0,11 / 0,147 / 0,170" ausdrücklich als drei Werte derselben Kante in Umlauf.

## Befunde

| Kennung | Datei:Zeile | Wortlaut (gekürzt) | sichtbar | Soll (Fundstelle) | Urteil | Bew. |
|---|---|---|---|---|---|---|
| F2-01 | depot.js:787-870 `kantenAusProtokollen` | liest `rsi2seit-2026-08-26.json`: nicht entscheidbar, +0,021 Pp, Aussicht 4.116 Signaltage | (Quelle) | Protokoll 08-26 | **stimmt** | – |
| F2-01a | CLAUDE.md, Abschnitt „Studienläufe" | „`depot.js` wählt daraus die Variante mit dem **größten** Bestätigungs-t" | nein (Doku) | Code wählt seit 26.08. die Variante mit dem Urteil des Protokolls, Gleichstand → größtes t | weicht ab (nur Doku; bei rsi2seit 1 Variante) | C |
| F2-02 | depot.js:663-666 (`BELEG.rsi2seit.txt`), gezeigt durch :687 `b = { stand: pk.urteil, txt: b.txt }` | Regelkopf „Beleg: nicht entscheidbar – **+0,065 Pp** Überschuss … (**6.509 Trades, 675 Tage**). Die Rohkante von **+0,170 Pp** …" — direkt darunter „Aus dem Messprotokoll vom 2026-08-26: Überschuss je Signal +0,021 Pp" | ja | 08-26: Tagesmittel +0,054, je Signal +0,021, 104.881 Signale/692 Tage, Roh +0,151. 6.509/675/+0,170 stammen aus dem überholten Protokoll 08-23; +0,065 steht in keinem Protokoll (08-23 Gesamt-Überschuss +0,070) | **weicht ab** — der fest verdrahtete Satz bleibt stehen, auch wenn das Protokoll geladen ist; zwei Überschuss-Zahlen in einer Zeile | B |
| F2-02a | depot.js:711 | Regelkopf „Haltedauer: 8 Stunden" | ja | 8 Kerzen 60m = 8 **Handels**stunden (Live-Ausstieg zählt Handelskerzen, depot.js:2916) | Zahl stimmt, Wort ungenau (Klartext sagt richtig „Handelsstunden") | C |
| F2-03 | depot.js:906-968 `huerdeAnzeigen` | „Kostenhürde 0,100 Pp je Umlauf · Aktie 1x · Haltedauer 8 h … Überschuss je Signal +0,021 Pp → netto −0,079 Pp … Urteil der Messmaschine: nicht entscheidbar" | ja | 0,10 / +0,021 / −0,079 | **stimmt** | – |
| F2-04 | depot.js:5813 | ohne Protokoll im Datenordner: „Backtest vor der Kontrollmessung: **+0,147 Pp** auf 8 Handelsstunden …" | ja, nur ohne Protokoll | keine Fundstelle; Protokoll +0,021 | weicht ab (gekennzeichnet als veraltbar, aber Zahl ohne Beleg; mit Protokoll stimmt der Satz) | B |
| F2-04a | depot.js:5824 | bei Hebelschein: „der **gemessene Vorsprung** liegt UNTER der Scheinhürde, mit Schein … **−96 %**" | ja | kein Vorsprung belegt; −96 % ohne Fundstelle | weicht ab | B |
| F2-05 | index.html:1685-1691 | „Gemessen über **162 Werte: +0,147 Prozentpunkte** auf 8 Handelsstunden über die übliche Drift hinaus, **in beiden Zeithälften positiv**." | ja (Erklärung „Was hier gehandelt wird") | 2.874 Werte, +0,021 je Signal, Entdeckungshälfte je Signal **−0,011**, nicht entscheidbar | **weicht ab** | B |
| F2-05a | index.html:1700-1703 | „Der **gemessene Vorsprung liegt über der Aktien-Kostenhürde (0,10 %)** und unter der Optionsschein-Hürde (0,21 %) – mit Schein … −96 %. … streng bis Handelsschluss −0,08 %, mit einer Nacht +0,23 %." | ja | +0,021 < 0,10 → netto −0,079; 0,21 / −96 / −0,08 / +0,23 ohne Fundstelle | **weicht ab** (Gegenteil des Protokolls) | B |
| F2-06 | index.html:1747-1749 | „Standard (**99 gemessene Werte**)", „Volatiles Drittel (33 Werte – **gemessen +0,235 statt +0,147 Pp**)", title: „die 99 Werte, auf denen gemessen wurde (rund 5 handelbare Signale am Tag)" | ja | Protokoll: 2.874 Werte; keine Teilmessung „volatiles Drittel"; derselbe Reiter nennt zwei Zeilen höher 162 Werte | **weicht ab** | B |
| F2-07 | index.html:2382 | Strategie-Chart-Auswahl „RSI(2) im Seitwärtskanal (**gemessen, nicht bestätigt**)" | ja | Urteil „nicht entscheidbar"; „nicht bestätigt" ist ein **anderes** Maschinenurteil (depot.js:692-706 erklärt den Unterschied ausdrücklich) | weicht ab | B |
| F2-07a | index.html:1826 | Haltedauer-Option „8 h (RSI2-Seitwärts, gemessen)" (480 min) | ja | 8 Kerzen 60m | stimmt | – |
| F2-08 | strategien.js:26 | Instrument-Zeile „mit Schein **stirbt die Kante** (−96 %)" | ja (Karte) | keine Kante belegt; −96 % ohne Fundstelle | weicht ab | B |
| F2-08a | strategien.js:28 | Stand-Chip „gemessen – gegen Kontrolle nicht entscheidbar" | ja | nicht entscheidbar | stimmt | – |
| F2-08b | strategien.js:35 | Beleg „KONTROLLMESSUNG 23.08.2026: … **+0,024 Pp** bei MDE **0,182** … je Signal **−0,045** … 62 %" | ja (i-Knopf) | weder 08-26 (+0,054 / 0,130 / +0,021) noch 08-23 (+0,028 / 0,183 / −0,041) | weicht ab (veraltet und nicht einmal das genannte Protokoll) | B |
| F2-08c | strategien.js:36-40 | „+0,147 Pp auf 8 h, t = 4,1 … 99 von 162 Werten"; „Der Vorsprung liegt **ÜBER** der Basiswert-Hürde (0,10 %) … PF 1,23 (+0,23 %) … Schein −96 %"; „Call-Seite +0,075 %, Put −0,099 %"; „36 Monate, t ≈ 0,5" | ja (i-Knopf) | keine Fundstelle; Gegenwartsaussage widerspricht netto −0,079 | weicht ab — als „Messungen VOR dieser Kontrolle … Verlauf" eingeleitet, aber ohne „Überholt"-Kopf (anders als Momentum, Nr. 91) | B |
| F2-08d | strategien.js:44 | Regime: „RSI-Teil (… altes Archiv, seither nicht neu gemessen): +0,148 / −0,169" | ja | belegstand.md:416 | **stimmt** | – |
| F2-09 | explorer.js:203 | „Roh ein Münzwurf (**+0,017** Prozentpunkte). **Trägt** erst mit der Erlaubnis … – das ist die **Hauptstrategie**; … nicht entscheidbar." | ja (Aktien-Explorer) | +0,017 ohne Fundstelle; „trägt" widerspricht „nicht entscheidbar" | weicht ab | B |
| F2-10 | index.html:1755 (title Regime-Schalter) | „RSI(2) im Seitwärtskanal **trägt nur über** der 200er-Linie (+0,15 Pp, darunter −0,17)" | ja (Tooltip) | Zahlen stimmen gerundet; belegstand: RSI-Teil „nicht neu gemessen – weder bestätigt noch widerlegt" (nur „altes Archiv" steht dabei) | Zahl stimmt, Aussage zu stark | C |
| F2-10a | depot.js:3105 | Signal-Monitor: „Regime: … pausiert (**verliert dort −0,17 Pp**)" | ja | −0,169, nicht neu gemessen | Zahl stimmt, als Tatsache formuliert | C |
| F2-11 | depot.js:6228-6230 (`edgeZustand`) | „Edge-Wächter (rsi2seit, letzte 120 Tage, Archiv): … Überschuss +x Pp/8 h · **t über Symbole** … → **im Rahmen der Studie**" | ja (Autopilot-Log) | Protokoll: Kontrolle `erwartung-symbol-stunde`, t über **Tage** geclustert; die „Studie" (+0,147, t 4,1) hat keine Fundstelle | weicht ab — andere Größe, anderes t, Bezug auf unbelegte Studie | B |
| F2-11a | depot.js:1504, 6422, 6428, 6452; app-shell.js:1119 | Warnband/Journal/Meldung „der **gemessene Vorsprung** ist … verfallen", „Vorsprung wieder positiv"; Pillentext „ob der Überschuss … **noch trägt**" | ja | es gibt keinen belegten Vorsprung, der verfallen könnte | weicht ab (Wortlaut). Hinweis für Frage 1: die Einstiegs-Pause hängt an dieser Nicht-Protokoll-Größe | B |
| F2-12 | app-shell.js:1285 | „… deren Vorsprung unter der Schein-Kostenhürde liegt … mit Schein im Backtest bei **−96 %**" | ja | ohne Fundstelle | weicht ab | B |
| F2-12a | app-shell.js:1272, 1306 | „8 Handelsstunden bei RSI(2) im Seitwärtskanal („gemessen")" | ja | 8 Kerzen 60m | stimmt | – |
| F2-13 | depot.js:476 (+0,073), 1969 (+0,235/+0,147), 2643 (+0,148, t=1,9), 3167 (+0,147), 5073 („BELEGTE Strategie"), 5789 („belegte Hauptstrategie"), 6119 („den belegten Edge"), 7188 (+0,017); quant.js:1793-1806 (+0,017, +0,147, t = 4,1, +0,235); strategiechart.js:105/213; backfill.js:178 | Kommentare | nein | – | alte Zahlen/Wörter nur im Kommentar | C |
| F2-14 | depot.js:4113 `scanKopfText`, :3939 `renderIntradayKarte` | „14:50" / Depotwert, Positionen, Status | ja | – | keine Regelzahl, kein Beleg-Wort — stimmt | – |
| F2-15 | depot.js:718 Regelkopf „Not-Stop 20 %"; :5819 Klartext „Ausstieg nach 8 Handelsstunden, darunter nur ein Not-Stop" | ja | Messung ohne Stopp (`ausstieg.art: Zeit`); Anzeige behauptet für den Stopp keine Messung | stimmt (Abweichung Live↔Messung selbst ist Frage 1) | – |

Weitere geprüfte, stimmige Stellen: backtestui.js:38 (keine Zahl), strategiechart.js:273 (nur Name),
app-shell.js:1169/1299 (keine Regelzahl), index.html:1671 / strategien.js:225 („gemessene Einstellungen" —
die Konfiguration ist die gemessene), depot.js:7196-7199 Auslöser-Gruppen („Gemessen, aber nicht belegt" aus dem Protokoll).

## Zusammenfassung

Die **aus dem Protokoll gelesenen** Anzeigen stimmen alle (Regelkopf-Fußzeile, Kostenhürde, Klartext
mit Protokoll, Auslöser-Gruppen, Stand-Chip). Daneben stehen an **sieben sichtbaren Orten** fest
verdrahtete Zahlen aus der Zeit vor der Kontrollmessung (+0,147 / 162 / 99 / +0,235 / +0,017 / −96 % /
+0,23 % / −0,08 %), die in keinem Protokoll und nicht in `belegstand.md` stehen — und zwei davon
behaupten in der Gegenwart das Gegenteil des Protokolls („Vorsprung liegt über der Aktien-Kostenhürde",
index.html:1701 und strategien.js:37; Protokoll: netto −0,079 Pp). Der Regelkopf zeigt im selben Feld
zwei verschiedene Überschuss-Zahlen (+0,065 fest, +0,021 aus dem Protokoll). Kein Befund der Klasse A
in der Anzeige selbst; der Edge-Wächter entscheidet über Einstiegs-Pausen an einer Größe, die nicht die
Protokollgröße ist (Hinweis an Frage 1).

## Lauf vom 04.10.2026 (Stand a582416)

```
kein Unterschied: F2-00 Soll-Grundlage — belegstand.md:265 und rsi2seit-2026-08-26.json stimmen
kein Unterschied: F2-01 Protokoll-Auswahl — +0,021 Pp, nicht entscheidbar, 4116 Signaltage
ZEIGT ABWEICHUNG: F2-02 Regelkopf "Beleg" — +0,065 / 6.509 / 675 / +0,170 ohne Gegenstück
kein Unterschied: F2-03 Kostenhürde — 0,100 / +0,021 / −0,079 wie im Protokoll
ZEIGT ABWEICHUNG: F2-04 Klartext — ohne Protokoll +0,147; mit Schein −96 %
ZEIGT ABWEICHUNG: F2-05 index.html "Was hier gehandelt wird" — 162, +0,147, Zeithälften, über Hürde
ZEIGT ABWEICHUNG: F2-06 Beobachtungs-Pool — 99, +0,235, +0,147
ZEIGT ABWEICHUNG: F2-07 Auswahl — "nicht bestätigt" statt "nicht entscheidbar"
ZEIGT ABWEICHUNG: F2-08 Strategie-Karte — 6 Belege mit Zahlen ohne Fundstelle
ZEIGT ABWEICHUNG: F2-09 Explorer — +0,017, "Hauptstrategie", "Trägt"
ZEIGT ABWEICHUNG: F2-10 Regime — index.html:1755, depot.js:3105 ohne Vermerk
ZEIGT ABWEICHUNG: F2-11 Edge-Wächter — "im Rahmen der Studie", "gemessener Vorsprung", t über Symbole
ZEIGT ABWEICHUNG: F2-12 app-shell.js — −96 %
ZEIGT ABWEICHUNG: F2-13 Kommentare — nur C
kein Unterschied: F2-14 Scan-Kopf, Intraday-Karte
kein Unterschied: F2-15 Not-Stopp / Ausstieg
```
(gekürzt; der volle Wortlaut steht in der Ausgabe des Testlaufs)

Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
