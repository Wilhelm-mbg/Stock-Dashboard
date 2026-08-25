# Querschnitts-Eichung — Ergebnis, 25.08.2026

**Urteil: UNENTSCHIEDEN.** Die vorregistrierte Entscheidungsregel liefert weder Ja noch
Nein. Sie wird nicht nachträglich verschoben.

| | vorregistriert verlangt | gemessen | |
|---|---|---|---|
| **JA** | Median `f` ≥ 1,5 **und** unteres Bootstrap-Ende > 1,2 | 1,410 / 1,250 | **nicht erfüllt** |
| **NEIN** | oberes Bootstrap-Ende < 1,3 | 2,073 | **nicht erfüllt** |

24 Varianten aus 9 Strategien. Median `f = se(A7) / se(Querschnitt)` = **1,410**,
Cluster-Bootstrap über 9 Strategien (5.000 Ziehungen): **1,250 bis 2,073**.

Der Median verfehlt die Ja-Schwelle um 0,09. Damit wird die Querschnitts-Kontrolle
**nicht** zur Pflichtangabe, und in `CLAUDE.md` wird auch **nicht** eingetragen, dass die
Wand hart sei. Beides wäre über die Daten hinausgeschossen.

---

## Das Werkzeug funktioniert — die Probe ist bestanden

Vorab festgeschrieben war: Wo eine Strategie fast das ganze Universum kauft, **muss** der
Querschnitts-Überschuss gegen null gehen; täte er es nicht, wäre die Implementierung
falsch.

| | Überschuss gegen A7 | gegen den Querschnitt |
|---|---|---|
| `monatswende-breit` V0 | +0,1497 Pp | **+0,0186 Pp** |
| `monatswende-breit` V1 | +0,1548 Pp | **+0,0225 Pp** |
| `t3-stundendrift` V0 | +0,0018 Pp | +0,0059 Pp |
| `t3-stundendrift` V1 | +0,0088 Pp | +0,0093 Pp |

Genau so vorhergesagt, genau so eingetreten. Dazu `f` = 14,8 und 15,1 bei `monatswende` —
der Standardfehler fällt um Faktor fünfzehn, weil nach Abzug des Marktzugs von einer
Strategie, die 75 % des Marktes kauft, fast nichts übrig bleibt.

**Das ist mehr als eine Werkzeugprobe.** Es sagt, was die Monatswende ist: **ein
Marktzeitgeschäft, keine Auswahl.** Die ganzen +0,15 Pp waren der Markt, der zum
Monatswechsel steigt — gegen den Markt gemessen bleiben 0,02 Pp. Das erklärt den Effekt
vollständig, ohne dass irgendein Wert besser gelaufen wäre als ein anderer.

## Der Gewinn ist echt, aber er reißt die Wand nicht ein

| | Median `delta80` | Varianten unter der CFD-Hürde (0,10 Pp) |
|---|---|---|
| A7 (bisher) | 0,266 Pp | 7 von 24 |
| Querschnitt | **0,165 Pp** | **9 von 24** |

Zwei Varianten mehr kommen in Reichweite einer handelbaren Kante. Der Plan hatte auf
Faktor 3 gehofft — bei Faktor 3 wäre `delta80` eines täglich feuernden Signals unter die
Kostenhürde gefallen. Bei 1,41 fällt es nicht.

## Warum der Median so niedrig ausfällt — beschreibend, nicht getestet

Der Faktor hängt stark am Zeitrahmen, und das war nicht vorregistriert. Es steht hier als
**Beobachtung**, nicht als Befund:

| Zeitrahmen | n | Median `f` | Spanne |
|---|---|---|---|
| `1d` | 8 | **2,209** | 1,40 – 15,12 |
| `60m` | 16 | **1,272** | 1,01 – 2,26 |

Physikalisch plausibel: Der Marktzug eines **Tages** ist ein viel größerer Anteil der
Tagesstreuung eines Werts als der Marktzug einer **Stunde** an der Stundenstreuung. Auf
Tagesdaten halbiert die Querschnitts-Kontrolle den Standardfehler beinahe; auf 60m bringt
sie rund ein Viertel.

Der Gesamt-Median von 1,410 ist deshalb kein Naturgesetz, sondern eine Folge davon, dass
**zwei Drittel der gemessenen Varianten aus 60m-Strategien stammen**. Wer diese Zahl
zitiert, zitiert die Zusammensetzung des Korpus mit.

Daraus **keine** neue Regel abzuleiten ist Absicht. Eine Aufteilung nach Zeitrahmen war
nicht angemeldet; sie nachträglich zur Entscheidungsgrundlage zu machen, wäre genau der
Griff, den die Mühle verbietet. Wer die Frage „bringt die Querschnitts-Kontrolle auf
Tagesdaten genug?" beantwortet haben will, muss sie **vorher** anmelden.

## Der sekundäre Endpunkt: die zwei Lesarten widersprechen sich

Genau der Fall, für den beide vorab festgeschrieben wurden.

| Menge | n | D = Überschuss(A7) − Überschuss(Querschnitt) | Median |
|---|---|---|---|
| **AUSWAHL-primär** (`momentum`, `quartalsschub`) | 6 | −0,822 / −0,485 / −1,135 / −0,243 / +0,057 / +0,072 | **−0,364 Pp** |
| **AUSWAHL-streng** (`quartalsschub`) | 2 | +0,057 / +0,072 | **+0,064 Pp** |

**Entgegengesetzte Vorzeichen**, und der Unterschied ist allein `momentum`. Dort wird der
Überschuss gegen den Querschnitt **größer**, nicht kleiner (V0: +1,160 → +1,982 Pp).

Die naheliegende Lesart: `momentum` kauft überdurchschnittlich schwankende Werte; die
A7-Kontrolle zieht deren eigenes Langfristmittel ab, der Querschnitt zieht den Markt ab.
Läuft der Markt in der Haltezeit schlecht, sieht ein Momentum-Korb gegen den Markt besser
aus als gegen sich selbst.

Das ist eine **Vermutung, keine Messung.** Was gemessen ist: die beiden Kontrollen
beantworten verschiedene Fragen, und bei `momentum` fällt die Antwort messbar
unterschiedlich aus. Damit greift die vorregistrierte Formulierung:

> *Wer einen großen Teil des Universums gleichzeitig kauft, misst Markt-Timing; beide
> Kontrollen ausweisen und benennen, welche Frage die Strategie stellt.*

`momentum` kauft 24,5 % des Universums und sitzt damit genau in dieser Grauzone — der
Grund, warum die Einteilung vorher in zwei Lesarten festgeschrieben wurde. Sie hat sich
gelohnt: Hätte ich mich für eine entschieden, stünde hier jetzt ein Vorzeichen ohne
Gegenrede.

## Abweichung von der Vorregistrierung

Angemeldet war ein **Block-Bootstrap über Kalenderjahre**. Der braucht Standardfehler je
Jahr, die die Maschine nicht ausgibt; sie dafür mitten in der Studie umzubauen wäre
schlechter gewesen. Gelaufen ist ein **Cluster-Bootstrap über Strategien** — ganze
Strategien gezogen, nicht einzelne Varianten, weil Varianten derselben Strategie nicht
unabhängig sind. Gleiche Frage, eher konservativer (9 Cluster gegen 40 Jahre). Die
Schwellen blieben unverändert.

Ob das Ergebnis daran hängt: Das untere Band liegt bei 1,250 gegen eine Ja-Schwelle von
1,2 — die Ja-Bedingung scheitert **nicht** am Bootstrap, sondern am Median (1,410 gegen
1,5). Ein anderer Bootstrap hätte das Urteil nicht gedreht.

---

## Was daraus folgt

1. **Die Querschnitts-Kontrolle bleibt eingebaut und wird in jedem Protokoll berichtet** —
   als Eichzahl, nicht als urteilende Kontrolle. Das Urteil fällt weiter gegen A7. Sie
   kostet nichts und hat auf Anhieb erklärt, was die Monatswende wirklich ist.
2. **Kein Eintrag in `CLAUDE.md` in die eine oder andere Richtung.** Weder „Pflichtangabe"
   noch „die Wand ist hart".
3. **Die Auflösungswand steht.** Sie ist um rund ein Drittel niedriger, aber sie steht.
   Eine Kante in Größe der Kostenhürde bleibt mit diesem Archiv nicht bestätigbar.
4. **Rang 2 des Plans wird dadurch wichtiger**: Wenn Methode die Wand nicht einreißt,
   bleibt die Frage, ob die Zahlen dahinter überhaupt richtig sind — 1.037 delistete
   Reihen liegen ungenutzt auf der Platte, und kein Messcode liest den Ordner.

## Ein Wort zur Erwartung

Der Pilot hatte se-Gewinne „von 1,3× bis 21,6×" berichtet. Beides ist eingetreten — nur
liegt der **Median** bei 1,41, und die großen Faktoren stehen genau dort, wo sie nichts
wert sind: bei den Strategien, die fast das ganze Universum kaufen und deren Überschuss
dabei mit verschwindet.

Das ist die übliche Form, in der ein Pilot täuscht: Er zeigt die Spannweite und nicht,
wo in der Spannweite die Fälle liegen, auf die es ankommt. Dass die Studie trotzdem
vorregistriert wurde — mit offengelegtem Pilot-Blick und als Eichung statt als
Kandidatenprüfung — ist der Grund, warum das hier auffällt statt als Erfolg verbucht zu
werden.
