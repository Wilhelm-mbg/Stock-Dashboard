# Prüfbericht „Live gegen Messung" — Intraday-Depot (`rsi2seit`), Stand `61dca2c`, 04.10.2026

**Kurzfassung**
1. **Signal stimmt, Handel nicht.** RSI(2)-im-Kanal wird mit derselben Funktion auf denselben fertigen Yahoo-60m-Kerzen (261 Vorlauf) gerechnet wie gemessen (F1-01/03/18). Ein- und Ausstieg, Haltedauer, Stopp und Auswahl weichen ab.
2. **Haltedauer ist nicht die gemessene:** live 9 statt 8 Kerzen (`depot.js:2914`); das 2-Tage-Schutznetz (`depot.js:2901`) schließt jede Freitags-/Feiertagsposition am Montag früh nach 1–5 statt 8 Kerzen.
3. **Signal auf der 15:30-Kerze** (36 % aller gemessenen Signale) wird erst am nächsten Morgen zum Eröffnungskurs gekauft, nicht zum Schluss der Signalkerze (`depot.js:2846`).
4. **Gemessen ohne Stopp, live Not-Stopp −20 %** (`depot.js:2484/2903`); Bestandsdepots handeln per Migration den **Hebelschein** (81 Bp, Hebel 20,6) statt der gemessenen Aktie (`depotmigration.js:89`).
5. **Zwölf Live-Filter, die die Messung nicht kennt** (Liquidität, Zahlen-/Event-Blackout, Edge-Pause, Symbolsperre, Kosten-Check, Abklingzeit 120 min, maxPos 8, Verlustserie halbiert Größe, Kill-Switch, Folgesignale entfallen). Gehandelt werden 99 statt 2.874 Werte.
6. **Veraltete/fehlende Daten:** Ausstiege und Not-Stopp laufen auf bis zu 20 h alten Kerzen ohne Hinweis (`depot.js:2846`). Ist das Archiv leer, bleibt eine offene Position ohne Stopp und Zeitausstieg liegen (`depot.js:2864`). Positionen außerhalb des Scan-Universums werden nie gestoppt und zum Einstand bewertet (`depot.js:2008`). Ein Geldkurs 0 über Capital löst den Stopp aus (`capital.js:252`).
7. **Anzeige:** Wo sie aus dem Protokoll liest, stimmt sie (+0,021 Pp, „nicht entscheidbar", Kosten 0,10, netto −0,079). Daneben stehen an sieben sichtbaren Orten Altzahlen ohne Fundstelle: **+0,147 Pp, 162/99 Werte, +0,235, +0,017, −96 %**. Zweimal steht dort „Vorsprung über der Aktien-Kostenhürde", obwohl das Protokoll netto −0,079 Pp ausweist (`index.html:1701`, `strategien.js:36-40`).
8. **Zählung:** 63 Kleinsttests, **46 zeigen eine Abweichung**. Befunde: 29 Klasse A (Geld/Positionen, ohne Doppelzählung F3-09/10, davon 4 nur mit Schalter oder Rückfallweg), 18 Klasse B, 6 Klasse C. App-Code ist unverändert.

Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.

---

## Gegenstand und Soll

Regel im Depot: „Umkehr · RSI(2) im Seitwärtskanal · nur Long · Basiswert", 60m, Ausstieg nach 8 Handelsstunden, Not-Stopp
(`depot.js:5060`, `modeParams` ab `depot.js:2525`). Das **Soll** ist die gemessene Regel, nie der Live-Code:
`studien/messmaschine/strategien/rsi2seit.js` (8 Kerzen 60m, Long, Kosten 5 Bp je Seite, ohne Stopp, 261 Kerzen Vorlauf),
Einstieg zum Schluss der Signalkerze (`studien/messmaschine/messmaschine.js:200-207`), Ausstieg zum Schluss der 8. Folgekerze
(`messmaschine.js:1014`), Protokoll `studien/messmaschine/protokolle/rsi2seit-2026-08-26.json`. Belegstand
(`wiki/belegstand.md:265`): **nicht entscheidbar** — +0,021 Pp je Signal, Tagesmittel +0,054 (se 0,065, Band [−0,073; 0,182]),
MCP-Varianten obere Grenzen 0,083–0,118 Pp. Regime-Teil (+0,148/−0,169) nicht neu gemessen (`belegstand.md:416`).

Die Einzelberichte mit allen Fundstellen beider Seiten:
- Frage 1 — Regel: [`live-gegen-messung-intraday/frage1-regel.md`](live-gegen-messung-intraday/frage1-regel.md)
- Frage 2 — Anzeige: [`live-gegen-messung-intraday/frage2-anzeige.md`](live-gegen-messung-intraday/frage2-anzeige.md)
- Frage 3 — Daten: [`live-gegen-messung-intraday/frage3-daten.md`](live-gegen-messung-intraday/frage3-daten.md)

## Methode

`depot.js` läuft in den Tests **echt** in einer vm-Sandbox, zusammen mit den echten Modulen `quant.js`, `risiko.js`,
`boerse.js`, `archiv.js`, `kurse.js` und `capital.js`. Ersetzt sind nur die Ränder: feste Uhr (Date ersetzt, TZ Europe/Berlin,
New-Yorker Kalender), Speicher im Arbeitsspeicher, Kursabruf als Attrappe mit Kunstkerzen und Oberfläche als Stummel. Der
Quelltext wird unverändert gelesen. Die Sandbox hängt nur vor `init().catch(` eine Zeile an, die `intradayScan` herausreicht;
fehlt diese Stelle, bricht der Test ab, statt still nichts zu prüfen. Anzeige-Texte werden durch Ausführen der textbildenden
Funktionen mit den echten Protokollen erzeugt; statische Texte werden als String-Literal gelesen. Jede Textmarke wirft, statt
`-1` zu liefern.

## Frage 1 — Handelt das Depot die gemessene Regel?

| Kennung | Bew. | Live (Datei:Zeile) | Befund |
|---|---|---|---|
| F1-01 | = | depot.js:2826-2868, 3045 | Gleiche Signalfunktion, gleiche fertige Yahoo-60m-Kerzen (:30-Stempel), ≥ 261 Kerzen Vorlauf |
| F1-03 | = | depot.js:2858, quant.js:2740 | Laufende Kerze wird nicht als Signalkerze gelesen |
| F1-04 | **A** | depot.js:2754-2755, 2846 | Signal auf der 15:30-Kerze: Kauf erst am nächsten Morgen zum Eröffnungskurs (betrifft 38.163 von 104.900 gemessenen Signalen) |
| F1-05 | B | depot.js:2846, 3272-3276 | Einstieg zum Spot beim ersten Scan (≈ Folge-Eröffnung) statt zum Schluss der Signalkerze |
| F1-06 | **A** | depot.js:2914-2916 | 9 statt 8 Kerzen gehalten: die erste Folgekerze beginnt vor `openT` und zählt nie mit |
| F1-07 | **A** | depot.js:2901 | 2-Tage-Schutznetz schließt Wochenend-Positionen Montag früh nach 5 (Freitag 15:31: nach 1) Kerzen, F3-10 |
| F1-08 | **A** | depot.js:2901 | Feiertag + Wochenende (Karfreitag): Schließung nach 1 Kerze |
| F1-09 | **A** | depot.js:2484, 2903, 3286 | Not-Stopp −20 % live, gemessen ohne Stopp (MCP-Variante live nicht vorhanden) |
| F1-10/11 | = | depot.js:2531, 2316 | Kein Ziel, kein Nachziehstopp; Kosten 5 Bp je Seite wie gemessen |
| F1-12 | **A** | depotmigration.js:89, depot.js:3234 | Bestandsdepots ohne Instrument-Feld → Hebelschein (81 Bp je Seite, Hebel 20,6) statt Aktie |
| F1-13 | B | depot.js:3176-3177 | Verlustserie halbiert die Größe ab 3 Verlusten, sperrt ab 5 |
| F1-14 | B | depot.js:3307-3322 | Gleich große Trades bilden das Mittel je Signal (+0,021) ab, das Urteil steht auf dem Tagesmittel (+0,054) |
| F1-15 | **A** | depot.js:2880-2957 | Folgesignal bei offener Position entfällt (gemessen zählt jedes) |
| F1-16 | **A** | risiko.js:63, depot.js:3243 | Deckel maxPos 8 / Klumpen: von 12 gleichzeitigen Signalen nur 8 eröffnet |
| F1-17/18/25 | = | depot.js:3115, 2858, 38 | Tagesschluss-Sperre greift nicht (Übernacht erlaubt); Zeitzonenwochen US/EU ohne Abweichung; Regime-Filter Vorgabe aus |
| F1-19…24, 30, 31 | **A** | depot.js:2874/3155, 3127-3138, 3088-3094, 2877, 2774/3116, 3296-3298, 2524-2535/2956, 2795 | Live-Filter ohne Gegenstück in der Messung: Liquidität 50 Mio $, Zahlen-Blackout 30 h, Edge-Pause, Symbolsperre, Event-Blackout ±45 min, Kosten-Check, Abklingzeit 120 min / 10 je Tag, Kill-Switch |
| F1-26 | B | depot.js:1954, renderer.js:24 | Gemessen auf 2.874 Werten, gehandelt auf 99 (DAX-Pool liegt nicht im US-Archiv) |
| F1-27 | A (bedingt) | depot.js:2598-2606 | Yahoo stumm + Capital verbunden: Volumenbestätigung auf CFD-Volumen |
| F1-28 | A (Schalter) | depot.js:2768 | Mit `kryptoHandeln` wird rsi2seit auf Krypto gehandelt (nicht gemessen) |
| F1-29 | **A** | depot.js:2877 | Sperre eines Werts mit offener Position setzt den Zeitausstieg aus (nach 14 Kerzen noch offen) |
| F1-02 | C | depot.js:3045-3049, 2431 | ZTHR live 2,0 statt 1,5 — für rsi2seit wirkungslos (0 von 4.195 Kerzen) |

## Frage 2 — Was zeigt die Oberfläche, stimmt jede Zahl?

Aus dem Protokoll gelesen und **stimmig**: Protokoll-Auswahl (08-26, +0,021, 4.116 Signaltage, F2-01), Kostenhürde 0,100 / netto
−0,079 (F2-03), Haltedauer „8 Handelsstunden (gemessen)", Stand-Chip „nicht entscheidbar", `strategien.js:44` (+0,148/−0,169 mit
Vermerk), Not-Stopp nicht als gemessen behauptet.

| Kennung | Bew. | Datei:Zeile | Befund |
|---|---|---|---|
| F2-02 | B | depot.js:663-666 | Regelkopf zeigt neben der Protokollzahl fest „+0,065 Pp … 6.509 Trades, 675 Tage, Rohkante +0,170" (08-23 überholt bzw. ohne Quelle) |
| F2-04 | B | depot.js:5813, 5824 | Ohne Protokoll: „+0,147 Pp auf 8 Handelsstunden"; bei Hebelschein „−96 %" — beides ohne Fundstelle |
| F2-05 | B | index.html:1690, 1701-1703 | „162 Werte: +0,147 Pp, in beiden Zeithälften positiv" (Entdeckung −0,011); **„Vorsprung liegt über der Aktien-Kostenhürde (0,10 %)" — Protokoll netto −0,079** |
| F2-06 | B | index.html:1747-1749 | „99 gemessene Werte", „gemessen +0,235 statt +0,147" — kein Protokoll; derselbe Reiter nennt 162 |
| F2-07 | B | index.html:2382 | „(gemessen, nicht bestätigt)" — das Urteil heißt „nicht entscheidbar" |
| F2-08 | B | strategien.js:26, 35, 36-40 | „stirbt die Kante (−96 %)"; „Kontrollmessung 23.08." mit Zahlen, die zu keinem Protokoll passen; +0,147, t 4,1, PF 1,23 ohne Fundstelle; „ÜBER der Basiswert-Hürde" im Präsens |
| F2-09 | B | explorer.js:203 | „+0,017", „trägt erst mit der Erlaubnis", „Hauptstrategie" gegen „nicht entscheidbar" |
| F2-11 | B | depot.js:6228-6230, 1504, 6422-6452, app-shell.js:1119 | Edge-Wächter: „t über Symbole … im Rahmen der Studie", „gemessener Vorsprung verfallen": eine andere Größe als das Protokoll (dort t über Tage geclustert) und eine Studie ohne Fundstelle. Diese Größe steuert die Einstiegspause (F1-21) |
| F2-12 | B | app-shell.js:1285 | „−96 %" ohne Fundstelle |
| F2-02a, F2-10, F2-10a | C | depot.js:711, index.html:1755, depot.js:3105 | „8 Stunden" statt Handelsstunden; Regime +0,15/−0,17 ohne Vermerk „nicht neu gemessen" |
| F2-13 | C | depot.js:476/1969/2643/3167/5073/5789/6119/7188, quant.js:1793-1806 | Altzahlen und „belegte Hauptstrategie" in Kommentaren |
| F2-01a | C | CLAUDE.md | beschreibt noch „größtes Bestätigungs-t"; der Code wählt heute nach Urteil, erst dann nach t |

## Frage 3 — Handelt das Depot auf fehlenden oder veralteten Daten?

Schutz **greift**: Abrufausfall → kein Ausstieg ohne Kurs, Meldung, später Ausstieg zum frischen Kurs (F3-02); Signalkerze älter
als 3 Kerzenlängen → „Kursdaten veraltet" (F3-05); Vorlauf < 261 → kein Signal (F3-13); Edge-Wächter ohne Messbasis pausiert
nicht (F3-14).

| Kennung | Bew. | Datei:Zeile | Befund |
|---|---|---|---|
| F3-01 | **A** | depot.js:2864 (vor 2880), 2823; archiv.js:304-312 | Leeres Archiv: „Kursreihe zu kurz" überspringt auch die offene Position, also kein Not-Stopp und kein Zeitausstieg. Wirft das Archiv beim Lesen, bricht jeder Scan für alle Werte ab, und der Fehler bleibt im Cache |
| F3-03 | **A** | depot.js:2846, risiko.js:35-44 | Not-Stopp/Ausstieg auf 20 h alter Kerze, ohne Kennzeichnung (Altersgrenze nur für Einstiege) |
| F3-04 | **A** | risiko.js:40-44, depot.js:3156 | `barsFrisch` misst ab Kerzen**beginn** (180 min): Einstieg bis 120 min nach Schluss der Signalkerze, obwohl die Quelle hängt |
| F3-06/07 | A (nur Regime an) | depot.js:2652-2672, 3101-3116 | Fehlt SPY, fällt der Filter offen (30 min gespeichert); 28 Tage alte SPY-Kerzen werden ohne Alterscheck benutzt |
| F3-08 | **A** | depot.js:2840-2845, 2864 | Archiv + 1-Monats-Abruf mit 59 Tagen Lücke: Signal auf der zusammengestückelten Reihe |
| F3-11 | **A** | depot.js:1915, 106, 2795 | Neustart am neuen Tag: Tagesstart zu Einstandskursen, Kill-Switch löst auf dem Verlust von gestern aus |
| F3-12 | **A** | capital.js:252-253 | Geldkurs 0 über Capital ungeprüft (Mittel 50,05) → Not-Stopp; über Yahoo verworfen |
| F3-15 | **A** | depot.js:146-151, 2818 | Kill-Switch stellt Position ohne frischen Abruf zum 187 min alten Kurs glatt |
| F3-16 | **A** | depot.js:2008-2018, 2880 | Offene Positionen außerhalb des Scan-Universums: nie abgerufen, nie gestoppt, zum Einstand bewertet |
| F3-09/10 | A | depot.js:2915, 2901 | = F1-06 / F1-07 (aus Sicht Lücken/Wochenende) |

## Kleinsttests

`pruefberichte/live-gegen-messung-intraday.test.js` (Läufer) mit den drei Teildateien unter `live-gegen-messung-intraday/`.
Jeder Test druckt genau eine Zeile „ZEIGT ABWEICHUNG: …" oder „kein Unterschied: …". Kunstdaten, feste Uhr, kein Netz, nicht
in `npm test`. `PRUEF_WURZEL=<Ordner>` prüft einen anderen Stand.

```bash
node pruefberichte/live-gegen-messung-intraday.test.js         # 63 Tests, 46 zeigen eine Abweichung (Stand 61dca2c)
node pruefberichte/live-gegen-messung-intraday.test.js F3-     # nur Frage 3
```

Lauf am 04.10.2026 auf `61dca2c`: 63 Tests, 46 zeigen eine Abweichung, 0 sind kaputt. `npx eslint pruefberichte/` meldet
keine Befunde. `npm test`: 7 Tests rot, auf `61dca2c` ohne diesen Zweig dieselben 7 — sie hängen am fehlenden Datenordner
dieses Containers (Universum, Messmaschinen-Falle), nicht an diesem Bericht.

## Was dieser Bericht nicht sagt

Er misst keinen Ertrag und keine Kante. Ob die Abweichungen das Ergebnis des Depots heben oder senken, ist nicht untersucht.
Er stellt nur fest, dass das Live-Buch eine **andere** Regel handelt als die gemessene. Damit lässt sich sein Verlauf nicht als
Vorwärtstest von `rsi2seit` lesen. Die Messung selbst steht auf „nicht entscheidbar" (`wiki/belegstand.md:265`), ein Beleg liegt
also auch für die gemessene Regel nicht vor.
