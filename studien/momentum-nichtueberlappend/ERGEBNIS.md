# Momentum ohne Überlappung — Ergebnis, 25.08.2026

**Urteil der Eichung: JA.** Newey-West über 62 Verzögerungen war rund **54 % zu
konservativ**. Für lange Haltedauern ist die nicht überlappende Anordnung die richtige
Messanordnung.

**Urteil über Momentum: unverändert unbelegt.** Dieser Lauf darf dazu nichts sagen, und
sagt es auch nicht.

## Der Endpunkt

`g = se(überlappend, Newey-West) / se(nicht überlappend)`, Bestätigungshälfte:

| | vorregistriert verlangt | gemessen | |
|---|---|---|---|
| **JA** | `g` bei Phase 0 ≥ 1,5 **und** Minimum über alle 63 Lagen ≥ 1,2 | **1,543** / **1,342** | **erfüllt** |
| NEIN | Maximum über alle Lagen < 1,3 | 1,921 | nicht erfüllt |

Über alle 63 Rasterlagen: Minimum 1,342, Median 1,569, Maximum 1,921. Der Befund hängt
nicht an der Phasenwahl.

## Die beiden Anordnungen nebeneinander

| | überlappend (Newey-West) | nicht überlappend |
|---|---|---|
| Beobachtungen | 4.975 Tage, jede teilt 62 von 63 Tagen mit der Nachbarin | **79 echt unabhängige** Perioden |
| Überschuss je Umlauf | +1,160 Pp | **+1,537 Pp** |
| Standardfehler | 1,129 Pp | **0,732 Pp** |
| t | 1,03 | **2,10** |

Der Punktschätzer bleibt stabil (+1,16 gegen +1,54 Pp) — es ist dieselbe Größe, nur anders
gemessen. Was sich ändert, ist ausschließlich die Genauigkeit. **Das ist das Merkmal einer
Anordnungsfrage und nicht eines Effekts**: Hätte der Wechsel den Punktschätzer verschoben,
wäre eine der beiden Anordnungen verzerrt gewesen und der Vergleich wertlos.

Zum Vergleich die Entdeckungshälfte, vorab gemessen: überlappend se 1,223, nicht
überlappend 0,873 — `g` = 1,40. Beide Hälften geben dieselbe Antwort.

## Was das ausdrücklich NICHT heißt

Der Lauf gibt für die Bestätigungshälfte t = 2,10 aus. **Das ist kein Beleg für Momentum**,
aus vier Gründen gleichzeitig — drei standen vorab in der Vorregistrierung, der vierte
kommt aus der Testfamilie:

1. **Die Bestätigungshälfte war schon gesehen.** Die überlappende Messung lief am 24./25.08.
   darauf. Eine zweite Auswertung derselben Daten ist kein zweiter Beleg.
2. **Das S4-Tor ist gerissen** — Entdeckung 3,304 gegen geforderte 4 × 1,747 = 6,99 Pp.
3. **Die Anordnung wurde gewechselt, nachdem die erste ein unerwünschtes Ergebnis geliefert
   hatte.** Das ist der Kern von post-hoc, auch wenn der Wechsel gut begründet ist und der
   Grund (B10) lange vorher feststand.
4. **Selbst nominell reicht es nicht.** Die Momentum-Familie hat vier Varianten; ihre
   Bonferroni-Schwelle ist **2,50**, nicht 1,96. t = 2,10 liegt darunter. Gemessen wurde
   hier nur die Live-Variante — die anderen drei existieren weiter.

Der Belegstand von Momentum bleibt: **nicht widerlegt, aber unbelegt.**

## Was daraus folgt

**Für die Messmaschine:** Bei Haltedauern, die einen nennenswerten Teil des Signalabstands
ausmachen, ist Newey-West nicht die Antwort, sondern eine Notlösung. Wo eine nicht
überlappende Anordnung möglich ist, ist sie vorzuziehen — sie braucht keine Korrektur,
weil es nichts zu korrigieren gibt. Der Preis sind wenige Beobachtungen, und der ist
ehrlich: 79 unabhängige Perioden sind 79, nicht 4.975.

**Für Momentum:** Es braucht eine neue, sauber vorregistrierte Prüfung auf Daten, die
niemand gesehen hat. Die einzige solche Hälfte ist die Zukunft. Konkret hieße das: Regel
eingefroren (stärkste 10 %, Rückblick 231, Lücke 21, Haltedauer 63, feste Umschichtung),
Kosten eingefroren, **Enddatum vorab genannt**, MDE vorab gerechnet.

Die Zahl dazu, aus diesem Lauf: se = 0,732 Pp bei 79 Perioden über 20 Jahre, also rund
vier Perioden im Jahr. Eine Vorwärtsprobe sieht bei gleicher Streuung
`delta80 = 2,80 × 6,506/√n` Pp:

| Laufzeit | Perioden | delta80 |
|---|---|---|
| 1 Jahr | 4 | 9,1 Pp je Umlauf |
| 3 Jahre | 12 | 5,3 Pp |
| 5 Jahre | 20 | 4,1 Pp |
| 20 Jahre | 79 | 2,1 Pp |

Der gemessene Überschuss liegt bei 1,5 Pp je Umlauf. **Eine Vorwärtsprobe bräuchte
Jahrzehnte** — das ist die ehrliche Antwort, und sie sollte gesagt werden, bevor jemand
eine startet und drei Jahre später „nicht entscheidbar" liest.

Was stattdessen ginge: das Buch in `mfdepot.js` läuft ohnehin. Es kostet nichts, sammelt
Vorwärtsdaten und ist als Simulation ehrlich — solange niemand seine Zwischenstände als
Beleg liest.
