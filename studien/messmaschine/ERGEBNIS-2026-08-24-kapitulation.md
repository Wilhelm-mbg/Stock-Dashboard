# Ergebnis „Kapitulations-Dip", 24.08.2026

Zur Vorregistrierung: [VORREGISTRIERUNG-2026-08-24-kapitulation.md](VORREGISTRIERUNG-2026-08-24-kapitulation.md),
festgeschrieben in Commit `40d6a37` **vor** der ersten Messung.

## Urteil

**Nicht entscheidbar — alle drei Tests.** Und anders als bei allem, was vorher
gemessen wurde, liegt das nicht daran, dass kein Effekt da wäre. Es liegt daran, dass
der gemessene Effekt von **sechs Trades** getragen wird.

| | Signale | Überschuss | MDE | t | je Signal netto | Urteil |
|---|---|---|---|---|---|---|
| V0 nur der Auslöser | 1.151 | +0,201 | 0,695 | 0,58 | **+0,355** | nicht entscheidbar |
| V1 + Liquidität | 1.142 | +0,208 | 0,694 | 0,60 | +0,353 | nicht entscheidbar |
| V2 + Regime-Tor | 512 | **+0,904** | 1,261 | 1,43 | **+0,842** | nicht entscheidbar |

Prozentpunkte, Bestätigungshälfte, Kontrolle nach A7 (261 Kerzen ausgelassen).
Bonferroni-Schwelle für |t| bei 3 Tests: **2,39**. Eichung gegen 20 Nullarchive:
bestanden (Verzerrung −0,125 ± 0,125 bzw. +0,061 ± 0,202 — von null nicht zu
unterscheiden).

## Warum die große Zahl nichts wert ist

`+0,355 Pp netto je Signal` ist die attraktivste Zahl, die in diesem Projekt je aus
einer Messung kam — dreieinhalbmal die Kostenhürde. Sie hält keiner Betrachtung stand:

```
Bestätigungshälfte, 676 Trades
  Mittel Überschuss        +0,455 Pp
  Median                   +0,291 Pp
  ohne die besten 1 %      +0,196 Pp
  ohne die besten 5 %      −0,505 Pp
  nur die besten 5 %      +18,587 Pp
  Anteil positiv             52,1 %
  Hälfte des Ertrags aus     6 Trades  (0,9 %)
```

Über beide Hälften: **vier von 1.151 Trades** (0,3 %) tragen die Hälfte. Größter
Einzeltrade AFRM am 04.04.2025 mit +29,6 Pp, schlechtester DLTR am 29.08.2024 mit
−27,0 Pp.

Damit bestätigt sich die Warnung, die seit dem 21.08. im Quelltext von `quant.js`
steht — **und gegen die gepaarte Kontrolle fällt sie schärfer aus** als damals gegen
die Drift-Basislinie: nicht „unter die Basislinie", sondern auf −0,505 Pp.

Dazu widersprechen sich die Hälften im Vorzeichen: Entdeckung −0,233 Pp je Signal,
Bestätigung +0,455. Die Studie von damals sagte „beide Hälften positiv"; gegen diese
Kontrolle gilt das nicht.

## Wie instabil die Zahl ist

Teilstichproben des Universums, sonst identische Messung:

| Werte | Signale | Bestätigungstage | Überschuss | MDE |
|---|---|---|---|---|
| 24 | 145 | 53 | +0,617 | 1,509 |
| 48 | 288 | 77 | +0,017 | 1,315 |
| 96 | 586 | 125 | +0,632 | 0,890 |
| 191 | 1.151 | 177 | +0,201 | 0,695 |

Der Punktschätzer springt zwischen +0,02 und +0,63, je nachdem welche Werte man
zieht. Das ist keine Messung, das ist ein Streubild.

## Lässt sich das jemals entscheiden?

Gemessen, nicht geschätzt: **MDE ~ Werte^−0,39.** Bei völlig unabhängigen Werten wäre
die Steigung −0,50, bei perfektem Gleichlauf 0,00. Der Gleichlauf kostet also etwas,
aber weitere Werte helfen weiterhin deutlich.

Um den Überschuss von +0,201 Pp aufzulösen, müsste die MDE um Faktor 3,5 fallen:

- **über Tage:** 2.110 Bestätigungstage statt 177 — rund **17 Jahre Archiv**.
- **über Werte:** rund **4.478 Werte** statt 191.

Der zweite Weg ist der gangbare. Das laufende Nachladen der verschwundenen Werte über
die Massive-Schnittstelle zielt genau dorthin — allerdings auf Tagesdaten; für diese
Kante bräuchte es 60-Minuten-Kerzen.

## Was beim Lesen des Live-Pfads herauskam

**`zOf(15) = 2,0`, nicht 1,5.** Vorprobe auf 40 Werten: 237 Signale mit 2,0 gegen 421
mit 1,5 — **78 % mehr**. Hätte ich den Wert wie bei `rsi2seit` übernommen (wo ZTHR gar
nicht in den Auslöser eingeht), hätte ich eine andere Strategie gemessen als die App
handelt. Das wäre der fünfte Fall dieser Fehlerart gewesen; diesmal vor der Messung
gefunden.

**Das Regime-Tor wirkt stark.** Es wirft 55 % der Signale weg und verdoppelt den
Überschuss je Signal (0,45 → 0,94 Pp). Von allem, was heute und gestern gemessen
wurde, ist das der einzige Kandidat, der nur noch Faktor 1,4 von der Auflösungsgrenze
entfernt liegt. Zur Vorsicht gehört: Mein Regime-Nachbau ist ausdrücklich eine
Näherung — SPY fehlt im 60m-Archiv, nachgebildet über die Tages-Marktreihe mit EMA29
statt der Stunden-EMA200. Und 55 Bestätigungstage sind knapp über der Grenze von 30.

**Der Liquiditätsfilter tut nichts.** 1.151 → 1.142 Signale. Alle 191 Archivwerte
liegen über 50 Mio $ Tagesumsatz.

## Der Ausstieg — geklärt, gegen meine eigene Vermutung

Im ersten Wurf stand hier, die Messung laufe ohne Stop, live aber mit einem, und
**die Asymmetrie wirke zugunsten der Strategie**. Das war eine Vermutung, und sie
war falsch. Nachgezählt (rein beschreibend, kein Test — es wird kein Überschuss
gegen eine Kontrolle gerechnet):

| Stop | getroffen | Ergebnis dieser Trades **ohne** Stop | mit Stop | Wirkung je Signal |
|---|---|---|---|---|
| −20 % (live) | 11 von 1.151 (0,96 %) | −12,40 % | −20 % | **−0,073 Pp** |
| −15 % | 31 (2,69 %) | −12,02 % | −15 % | −0,080 Pp |
| −10 % | 112 (9,73 %) | −7,07 % | −10 % | −0,285 Pp |
| −5 % | 370 (32,15 %) | −2,58 % | −5 % | −0,778 Pp |

Der Live-Stop steht bei **−20 %** (`slOf` liest `scalpSL: 20`, nicht das Feld
`sl: -0.25` — auch das hatte ich zuerst falsch genannt). Er greift in **11 von 1.151
Trades**, und diese elf endeten ohne ihn im Mittel bei −12,40 %. Er schneidet also
Positionen ab, die sich überwiegend wieder erholen, und kostet rund **0,073 Pp je
Signal**.

Und das gilt für jede Verschärfung, monoton: −5 % würde 32 % aller Trades treffen und
−0,778 Pp kosten — mehr als der gesamte gemessene Überschuss.

Die beiden Einzeltrades zeigen, warum:

```
DLTR 2024-08-29 (schlechtester)  Zwischentief −29,52 % nach 24 Kerzen  →  Ende −26,96 %
AFRM 2025-04-04 (bester)         Zwischentief  −5,00 % nach  6 Kerzen  →  Ende +30,25 %
```

Der beste Trade des ganzen Datensatzes wäre bei einem −5-%-Stop ausgestoppt worden.

**Damit entfällt der geplante vierte Test.** Die Richtung ist eindeutig und über alle
vier Stufen monoton; es gibt nichts zu optimieren. Was hier gemessen wurde, bestätigt
die Entwurfsentscheidung, die seit dem 21.08. in `quant.js` steht („KEIN Gewinnziel,
kein Deckel — wer die Ausreisser kappt, behaelt nur die Messer") — jetzt gegen die
gepaarte Kontrolle, statt nur behauptet.

Einschränkung, die dazugehört: Diese Rechnung läuft über **beide** Hälften und ist
deskriptiv. Sie taugt, weil jede Stufe in dieselbe Richtung zeigt — ein Rosinenpicken
ist hier nicht möglich. Für ein Urteil wäre sie es nicht.

## Was das für den laufenden Handel heißt

Nichts wurde abgeschaltet. „Nicht entscheidbar" heißt **nicht** „funktioniert nicht" —
es heißt, dass diese Datenmenge die Frage nicht beantworten kann. Die Entscheidung
über den Live-Handel liegt bei Wilhelm; die Messung liefert die Grundlage, nicht das
Urteil darüber.

Was sie liefert: Wer diese Kante handelt, handelt eine Verteilung, bei der 0,9 % der
Trades die Hälfte des Ertrags tragen — in beide Richtungen. Das ist eine Aussage über
das Risiko, und die ist belastbar, auch wenn die Aussage über den Ertrag es nicht ist.
