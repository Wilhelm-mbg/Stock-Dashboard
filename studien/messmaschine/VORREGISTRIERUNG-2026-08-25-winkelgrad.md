# Vorregistrierung: Der Winkel als Gewicht (Felix, Issues #33 und #36)

**Geschrieben am 25.08.2026, BEVOR gerechnet wurde.** Das ist der Zweck des Dokuments:
Regel, Parameter und Urteilsschwelle stehen fest, bevor irgendeine Zahl vorliegt. Wer
danach etwas ändert, schreibt eine neue Registrierung — er korrigiert nicht diese.

## Woher die Regel kommt

Felix am 22.08.2026 in #36, wörtlich:

> „Jeder bestätigte Trend, über einem ‚Gewinnwinkel' des Kurses zur Horizontalen, sollte
> ein Kaufsignal auslösen. Flacher Winkel, kein Kauf, es sei denn, keine Kosten. Stärker
> Winkel: kleiner Kauf, starker Winkel: starker Kauf. Weitere Regel: Je stärker der
> Winkel umso intensiver müssen später weitere Signale hinzugezogen werden, um den besten
> Ausstiegspunkt zu finden."

Das ist zugleich die Antwort auf die Frage, die in **#33** offen stand. Dort hieß es nach
der Neubewertung des Winkel-Detektors:

> „Die Signale feuern nach festen 10–16 Kerzen, unabhängig davon, *wie stark* der alte
> Trend war. Der Winkel des Vortrends geht nur als Schwelle (≥ 0,5) ein, nicht als
> Gewicht. Wenn du das anders haben willst — sag mir vorab genau wie, dann registriere
> ich es als zweiten Test, bevor ich rechne."

Felix hat es gesagt. Das hier ist die Registrierung.

## Die Regel, exakt

**Auslöser.** An jeder fertigen Kerze `i` wird über die letzten `FENSTER` Kerzen ein Kanal
gerechnet (`Q.kanalUeber`). Liefert er einen Kanal, gilt der Trend als *bestätigt* — die
Funktion verlangt dafür Berührungen an beiden Rändern und ein Varianzverhältnis, das einen
Zufallspfad ausschließt. Sonst kein Signal.

**Winkel.** `winkel = steigung × n / breite` — dieselbe Definition wie in der
Winkel-Studie zu #33, damit die Ergebnisse vergleichbar bleiben. Die Normierung auf die
Kanalbreite ist der Grund, warum ein 300-Dollar-Wert und ein 20-Dollar-Wert überhaupt
denselben Maßstab haben.

**Einstieg.** Long, wenn `winkel ≥ SCHWELLE`. Nur long — die Short-Seite ist in dieser
Bibliothek mehrfach als nicht tragend gemessen worden, und sie hier mitzunehmen würde die
Zahl der Tests verdoppeln, ohne dass eine These dahinterstünde.

**Ausstieg.** Fest nach `HALTEN` Kerzen. **Felix' zweite Regel — je steiler der Winkel,
desto mehr zusätzliche Signale für den Ausstieg — wird NICHT geprüft.** Sie ist ein
eigener Gedanke und bräuchte eine eigene Registrierung; sie hier mitzumessen hieße, zwei
Dinge gleichzeitig zu ändern und hinterher nicht zu wissen, welches gewirkt hat.

**Positionsgröße.** Felix' „kleiner Kauf / starker Kauf" ist bewusst **nicht** als
Gewichtung gebaut. Eine Gewichtung verändert nicht, ob eine Kante existiert, sondern nur,
wie stark man auf sie setzt — und sie macht das Ergebnis von einer zweiten, ungemessenen
Entscheidung abhängig. Stattdessen wird der Winkel in **Stufen** gemessen. Trägt die Idee,
muss der Überschuss mit der Stufe **steigen**; genau das ist Felix' Behauptung, und genau
so ist sie prüfbar.

## Parameter, festgelegt

| | |
|---|---|
| Zeitrahmen | 60 Minuten |
| Fenster für den Kanal | 40 Kerzen |
| Haltedauer | 8 Kerzen |
| Vorlauf | 261 Kerzen |
| Richtung | nur long |
| Universum | Unternehmensaktien (`WP.istAktie`) |
| Kosten | 5 Basispunkte je Seite |

**Die geprüften Stufen (das sind die Tests):**

| Variante | Schwelle |
|---|---|
| S0 | ≥ 0,0 — jeder bestätigte Trend, als Nullpunkt |
| S05 | ≥ 0,5 — die Schwelle aus #33 |
| S10 | ≥ 1,0 |
| S15 | ≥ 1,5 |
| S20 | ≥ 2,0 |

**Fünf Tests.** Die Bonferroni-Schwelle liegt damit bei t ≈ 2,58 statt 1,96.

## Was als Bestätigung gilt — vor dem Rechnen festgelegt

Die Idee gilt als **bestätigt**, wenn **beides** zutrifft:

1. **Monotonie.** Der Netto-Überschuss steigt über die fünf Stufen. Nicht „irgendeine
   Stufe ist gut" — das wäre der beste von fünf und damit nichts wert. Felix' Behauptung
   ist ausdrücklich, dass ein *stärkerer* Winkel *besser* ist.
2. **Eine Stufe trägt nach Kosten**, mit t über Tage geclustert ≥ 2,58.

Sie gilt als **widerlegt**, wenn der Überschuss über die Stufen fällt oder flach bleibt.

Sie gilt als **nicht entscheidbar**, wenn die kleinste nachweisbare Wirkung (MDE) über
dem liegt, was plausibel zu erwarten wäre. **Die MDE wird VOR dem Urteil ausgewiesen** —
das ist in dieser Bibliothek der häufigste Ausgang, und ihn als „kein Effekt" zu lesen
wäre der Fehler, gegen den die halbe Fehlerliste geschrieben ist.

## Was diese Messung nicht kann

- **Sie prüft 60-Minuten-Kerzen.** Felix' ursprüngliches Bild (#33) war der 1- und
  5-Minuten-Chart. Das 1m-Archiv hat 63 Handelstage; die Vorregistrierung zu #33 nennt 77
  als Mindestmaß. In etwa drei Wochen ist derselbe Test dort möglich — dies hier ist die
  Frage auf dem Zeitrahmen, für den die Daten reichen.
- **Sie prüft keinen Ausstieg.** Siehe oben.
- **Ein „nicht entscheidbar" ist eine Aussage über die Daten, nicht über die Idee.**

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*

---

## NACHTRAG vom 25.08.2026, nach dem Lauf — die Regel oben bleibt, der Grund dafür nicht

Diese Registrierung wird **nicht** korrigiert; das verbietet ihr eigener erster Absatz.
Was hier steht, ist ein Nachtrag: Der Abschnitt „Auslöser" begründet das Wort *bestätigt*
mit einer Eigenschaft von `Q.kanalUeber`, **die es nicht hat.**

Nachgemessen: `kanalUeber` hat drei `return null`, alle technisch (< 16 Kerzen, fehlender
Kurs, Nenner 0). In **20.000 Zufallspfaden kam kein einziges `null`**. Güte, r² und
Berührungen werden als *Felder* zurückgegeben, nicht geprüft. Und sie taugten auch als
Gatter nicht: Die Kanten *sind* das 92.-/8.-Perzentil genau der Abweichungen, an denen
sie geprüft werden — „Berührung an beiden Rändern" kann nicht scheitern (Minimum über
8.000 Rauschläufe: 4 bei Soll 2). Rauschen bekommt Güte-Median 75 und heißt zu 35 %
„trend: auf".

**Was der Lauf deshalb gemessen hat:** „Über 40 Kerzen lässt sich eine Gerade legen,
deren normierte Steigung ≥ Schwelle ist." Der Detektor feuerte auf rund der **Hälfte
aller Kerzen** (S0: 5.547.482 Signale bei 2.201 Werten).

**Das Ergebnis, unverändert festgehalten** (Bestätigungshälfte, t über 328 Tage
geclustert):

| Stufe | Signale | Überschuss | t | MDE |
|---|---|---|---|---|
| S0 | 5.547.482 | — | — | 0,1319 Pp |
| S05 | 3.074.054 | −0,0548 Pp | −0,95 | 0,1158 Pp |
| S10 | 2.061.478 | −0,0620 Pp | −1,08 | 0,1143 Pp |
| S15 | 1.295.989 | −0,0701 Pp | −1,20 | 0,1169 Pp |

**Urteil: nicht entscheidbar** — jeder Überschuss liegt unter seiner MDE. Der Lauf hätte
eine echte Kante erst ab rund 0,198 Pp mit 80 % Wahrscheinlichkeit gezeigt.

Der Überschuss *fällt* zwar monoton über die Stufen, was nach dem Abschnitt „Was als
Bestätigung gilt" ein **widerlegt** wäre. Das wird hier **nicht** ausgesprochen, aus zwei
Gründen: die Stufen sind ineinander geschachtelt und damit hochkorreliert, und keine
einzelne Zahl erreicht auch nur ihre MDE — ein Trend aus fünf nicht nachweisbaren Zahlen
ist selbst nicht nachweisbar.

**Für Felix' Frage ist dieser Lauf keine Antwort**, weil er ihre Voraussetzung nie
geprüft hat. Der zweite Anlauf steht in
`VORREGISTRIERUNG-2026-08-25-winkelbestaetigt.md`, dort liegt die Bestätigung
außerhalb des Fensters, aus dem der Kanal gerechnet wird.

*Gefunden auf Wilhelms Nachfrage „prüfe im nachgang deine messmethode" — nicht von
selbst. Ein Detektor, der auf jeder zweiten Kerze feuert, hätte beim Schreiben auffallen
müssen.*
