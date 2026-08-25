# Vorregistrierung: Querschnitts-Kontrolle — 25.08.2026

**Geschrieben, bevor die zweite Kontrolle implementiert war.** Es gibt zu diesem Zeitpunkt
keinen Messcode für sie im Repo.

> **Offenlegung vorweg, weil sie das Gewicht dieser Studie bestimmt.** Ein Pilot eines
> Prüfagenten ist auf demselben Archiv bereits gelaufen und hat se-Gewinne von 1,3× bis
> 21,6× berichtet. Die unten festgelegten Schwellen (1,5 / 1,2 / 1,3) sind **nach** diesem
> Blick gesetzt. Diese Studie wird deshalb als **Eichung** geführt, nicht als
> Kandidatenprüfung — sie misst das Messgerät, nicht den Markt. Ein „Ja" begründet keine
> Handelsentscheidung.

---

## 1. Die Frage

Um welchen Faktor sinkt der Standardfehler des tagesgeclusterten Überschusses, wenn die
Erwartung nicht das Langfristmittel desselben Werts ist (A7), sondern das Mittel **aller
anderen Werte zur selben Kerzenzeit**?

Der Grund, warum das die wichtigste offene Frage ist: Die A7-Kontrolle zieht das
Langfristmittel des Symbols ab, **nicht den Marktzug des Tages**. Der bleibt vollständig im
Überschuss stehen — und er ist es, der die Tagesstreuung auf rund 2,8 Pp treibt. Daraus
folgt die Auflösungswand: Eine Kante in Größe der Kostenhürde (0,10 Pp) bräuchte rund 4.900
Bestätigungs-Signaltage. Fällt die Streuung um Faktor 3, fällt der nötige Umfang um Faktor 9.

Zweite, nachgeordnete Frage: **verschiebt sich dabei der Punktschätzer?** Falls ja, misst
mindestens eine der beiden Kontrollen etwas anderes als gedacht.

## 2. Datenbasis

`E:/Markt-Dashboard-Archiv/archiv1d` (2.965 Reihen) und `archiv60m` (2.885 Reihen).
Bestehender Korpus: **38 Varianten aus 21 Protokollen, 10 Strategien**, jede einmal mit
beiden Kontrollen gefahren.

Die zweite Erwartung wird **in `messmaschine.js` neben `baueKontrolle` gebaut**, nicht als
eigenes Skript (D1: kein Nachbau des Messgeschirrs). Sie erbt zwingend:

- dieselbe **Stutzung** an den 1-%-Quantilen jedes Topfes (F1),
- dieselbe **Trennung je Hälfte** (A5),
- denselben Ausstieg und dieselbe Haltedauer,
- die **Auslassung des eigenen Werts** (leave-one-out): das Symbol darf nicht in seiner
  eigenen Kontrolle stehen. Bei n ≈ 1.500 wäre der Fehler klein — aber „klein genug"
  ist in diesem Projekt schon zweimal falsch gewesen (A6, F2). Er wird exakt gerechnet.

## 3. Vorab-Einteilung der Strategien — aus den Quelldateien, nicht aus den Ergebnissen

| Klasse | Kriterium |
|---|---|
| **TIMING** | Strategie liest zur Signalbildung keinen Kurs **oder** kauft am Ereignistag mehr als 20 % des zulässigen Universums |
| **AUSWAHL** | Querschnittsrang: sie wählt *zwischen* Werten |

Das ist keine Feinheit, sondern der Kern: `monatswende-breit` kauft 1.653 von 2.213 Werten
(75 %). Für sie **ist** das Mittel der anderen Werte praktisch das eigene Portfolio — die
Querschnitts-Kontrolle hat dort per Konstruktion nahezu null Macht und wird den Überschuss
gegen null drücken. **Das steht vorher fest und wird nicht als Befund gewertet.**

Die Verzerrungsaussage (Endpunkt 2) fällt **ausschließlich auf der AUSWAHL-Teilmenge**.

Die Einteilung wird **vor dem Lauf** in `EINTEILUNG.md` festgeschrieben, mit je einem Satz
Begründung aus der Strategiedatei.

## 4. Endpunkte

**Primär — `f`, kein Nulltest.**
`f = se(A7) / se(Querschnitt)`, Median über die 38 Varianten. Unsicherheit per
Block-Bootstrap über **Kalenderjahre** (nicht über Tage — Jahre sind die Blöcke, in denen
Marktregime zusammenhängen). Zusätzlich ausgewiesen: **wie viele der 38 Varianten dadurch
ein `delta80` unter 0,10 Pp erreichen** — heute sind es 4.

**Sekundär — ein gezählter Test.**
`D = Überschuss(A7) − Überschuss(Querschnitt)`, **gepaart über dieselben Signale**,
tagesgeclustert, nur auf der AUSWAHL-Teilmenge gepoolt. Nullwert exakt 0.

Weil `D` gepaart gebildet wird, fällt die gemeinsame Marktvarianz heraus; `se(D)` ist damit
eine **gemessene** Größe, keine geschätzte. Erwartet 0,05–0,15 Pp, obere Schranke
2 × 0,148 = 0,296 Pp.

## 5. Entscheidungsregel — vorab

| | |
|---|---|
| **JA** (Querschnitts-Kontrolle wird Pflichtangabe) | Median `f` ≥ **1,5** **und** unteres Bootstrap-Ende > **1,2** |
| **NEIN** (die Wand ist hart) | oberes Bootstrap-Ende < **1,3** — dann wird in `CLAUDE.md` eingetragen, dass Methode nichts mehr bringt und nur noch unabhängige Tage helfen |
| dazwischen | unentschieden; kein Eintrag in beide Richtungen |

**Verzerrung:** `|D|` über der eigenen MDE auf der AUSWAHL-Teilmenge → Katalogeintrag —
aber **nicht** als „A7 ist falsch", sondern als: *wer einen großen Teil des Universums
gleichzeitig kauft, misst Markt-Timing; beide Kontrollen ausweisen und benennen, welche
Frage die Strategie stellt.*

**Ungültig, wenn der Placebo anschlägt.** Und der Placebo muss hier **auch in der Zeit
gewürfelt** werden, nicht nur im Querschnitt — sonst erbt er den Monatswende-Effekt, und
seine wahre Antwort wäre nicht null.

## 6. Testzahl

**1 Test.** Schwelle |t| ≥ 1,96.

`f` ist ein Verhältnis zweier gemessener Standardfehler und hat keine Nullhypothese; die
38 Einzelwerte je Variante sind **beschreibend** und werden ausdrücklich nicht einzeln
beurteilt. Wer sie einzeln beurteilte, hätte 38 Tests.

## 7. Was diese Studie ausdrücklich nicht sagt

Ein „Ja" heißt **nicht**, dass eine Strategie funktioniert. Es heißt, dass die Messung
schärfer wird — und schärfer messen kann ebenso gut bedeuten, dass bisherige „nicht
entscheidbar" zu **„widerlegt"** werden. Das ist der wahrscheinlichere Ausgang: Von 38
Bestätigungs-Varianten haben 2 ein |t| über 2, unter reinem Rauschen wären 1,73 zu erwarten.

Wird die Kontrolle Pflicht, sind **alle bisherigen Läufe zu wiederholen**, und ihre
Protokolle gelten bis dahin nur mit dem alten Standardfehler.

---

*Geschrieben vor dem ersten Lauf und vor der Implementierung. Ergebnis in `ERGEBNIS.md`.*
