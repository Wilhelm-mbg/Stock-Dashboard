# Vorregistrierung `quartalsschub-betrag` — Neubau, 25.08.2026

> **Dies ist eine NEUE Vorregistrierung, kein eingelöster Test.** Der Quelltext des am
> selben Tag vorregistrierten Kandidaten B ist verloren (siehe `VORREGISTRIERUNG.md`,
> Abschnitt 6). Was hier steht, ist aus der überlieferten *Beschreibung* neu gebaut. Die
> Operationalisierung wähle **ich**, heute — genau die Freiheit, die eine Vorregistrierung
> sonst wegnimmt. Deshalb wird sie hier vollständig festgeschrieben, bevor gemessen wird.

## 1. Die These

Ein Wert, der drei Monate lang gefallen ist, trägt vor seinem Quartalstermin eine
aufgestaute Ergebnisunsicherheit. Wer sein Risikobudget daran gebunden hat — der
Fondsmanager, der die Position vor dem Termin gedeckelt hat, das Risikobuch, das die
Ereignisvolatilität limitiert, der Verwalter, der vor seinem Ausschuss keine ungelöste
Lage halten darf —, gibt dieses Budget erst wieder frei, wenn die Zahl da ist **und groß
genug war, um die Unsicherheit tatsächlich aufzulösen**. Eine Meldung nahe der Schätzung
löst nichts auf. Wirksam ist der **Betrag** der Überraschung, nicht ihr Vorzeichen.

Auf der Entdeckungshälfte war das gemessen: nach demselben Kursverfall zahlt eine
Überraschung von −5 % *mehr* als eine von +5 % (+1,619 gegen +0,870 Pp je Signal), −20 %
zahlt +2,507 Pp, und \|Überraschung\| < 5 % zahlt nichts (+0,095 Pp, t 0,47).

## 2. Was überliefert ist — und was ich wählen muss

**Überliefert** (steht in `VORREGISTRIERUNG.md`, aus dem Verdichterbericht):

| | |
|---|---|
| Zeitrahmen | `1d` |
| Haltedauer | 5 Kerzen |
| `leseFensterKerzen` | 80 |
| Richtung | long |
| V1 | \|Überraschung\| ≥ 5 %, Verfall ≤ −2 % |
| V2 | \|Überraschung\| ≥ 5 %, Verfall ≤ −5 % |
| Entdeckung V1 | +1,155 Pp (t 3,91) |
| Entdeckung V2 | +1,266 Pp (t 3,71) |

**Von mir gewählt** — jede dieser Festlegungen ist ein Freiheitsgrad, und jede ist hier
begründet, damit sie nachher nicht verschoben werden kann:

1. **Überraschung** = Spalte 3 aus `drift_termine.json`. Die Zeilen sind
   `[Datum, Schätzung, Ist, Überraschung %]` — autoritativ aus dem schreibenden Code
   ([driftui.js:82](../../driftui.js)), nicht aus den Werten erraten.
2. **Verfall** = Rendite über die **63 Handelskerzen vor dem Termin** (drei Monate). Der
   überlieferte `leseFensterKerzen: 80` stützt genau diese Länge: 63 plus Rand.
   Gemessen wird bis zur **letzten Kerze vor** dem Terminzeitpunkt — die Termin­bewegung
   selbst gehört nicht in den Filter.
3. **Einstieg** = Schluss der **ersten Handelskerze nach** dem Terminzeitpunkt. Zahlen
   erscheinen üblicherweise nach Börsenschluss; so ist die Meldung beim Einstieg
   öffentlich, und der Ankündigungssprung ist **nicht** enthalten. Die These handelt vom
   Nachlauf über Tage, nicht vom Sprung.
4. **Ein Einstieg je Termin.** Kein zweiter Einstieg in derselben Meldung.
5. **Universum** = `CS`/`ADRC` wie bei Kandidat A, zusätzlich beschränkt auf die 189
   Symbole mit Terminarchiv.

## 3. Testzahl und Schwelle

| | |
|---|---|
| Varianten | 2 |
| **Tests** | **2** |
| **Schwelle** | **\|t\| ≥ 2,50** |

Bei zwei Tests wäre Bonferroni **2,24**. Ich bleibe trotzdem bei **2,50**, und das ist
Absicht: Diese These ist nicht frisch — ihr Entdeckungsbefund ist mir bekannt, und sie ist
schon einmal an dieser Latte angemeldet worden. Die Schwelle zu senken, weil der
Neubau nur zwei Varianten hat, wäre ein Griff zu meinen Gunsten. Im Zweifel die strengere
Latte.

## 4. Die Annahmebedingung für den Neubau — vorab, nicht nachher

Der Lauf liefert beide Hälften. **Die Entdeckungshälfte ist hier kein Befund, sondern die
Probe, ob der Nachbau die überlieferte Strategie überhaupt trifft.**

> **Der Neubau gilt als gelungen, wenn der Überschuss auf der Entdeckungshälfte für V1
> zwischen +0,58 und +2,31 Pp liegt** (Faktor 2 um die überlieferten +1,155 Pp) **und das
> Vorzeichen stimmt.**

Liegt er außerhalb, ist meine Operationalisierung eine **andere Strategie** als die
überlieferte. Dann wird das Ergebnis der Bestätigungshälfte **nicht als Test gewertet** und
der Neubau als gescheitert gemeldet — ich werde die Parameter dann *nicht* nachjustieren
und erneut laufen lassen, denn jeder weitere Lauf sieht die Bestätigungshälfte erneut.

## 5. Auflagen (aus der ursprünglichen Vorregistrierung übernommen)

1. **Rauchprobe vor dem Urteil**: Die Maschine fängt Würfe aus `signal()` ab und meldet
   dann still „null Signale". Eine Zahl nahe null ist ein Werkzeugfehler, keine
   Widerlegung. Erwartet werden einige tausend Signale.
2. **Über Tage clustern**, nicht über Handel — die Maschine tut das per Tagesmittel.
3. **Schwanzanteil auf der Netto-Summe**, 1-%-Grenze.
4. **Kostenannahme** 0,10 % je Umlauf auf dem Basiswert.
5. **Die Selbstprüfung muss bestehen** (Placebo im Rahmen der eigenen Auflösung).

## 6. Was dieser Lauf nicht kann

Das Terminarchiv umfasst **189 Symbole**, nicht die 1.198 der ursprünglichen Suche. Die
Auflösung wird dadurch schlechter als die dort vorausgesagten ≈ 0,26 Pp. Sollte das
Ergebnis „nicht entscheidbar" lauten, ist das mit hoher Wahrscheinlichkeit eine Aussage
über die **Datenmenge**, nicht über die These — und dann wäre der nächste Schritt, das
Terminarchiv zu verbreitern, nicht die Strategie zu ändern.

---

*Geschrieben vor dem ersten Lauf. Ergebnis in `ERGEBNIS-quartalsschub-betrag.md`.*
