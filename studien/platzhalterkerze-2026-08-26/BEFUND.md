# #96 — die „Platzhalterkerze" ist keine. Sie ist der offizielle Schlusskurs.

**26.08.2026, gezählt über alle 2.916 Reihen des Stundenarchivs (14,8 Mio Kerzen).**
Nichts gelöscht, nichts eingebaut. Auflage 4 des Projekt-Managers — „zählen, bevor
gelöscht wird" — ist eingetreten, und zwar deutlicher als beim ersten Mal.

## Das Ergebnis in einem Satz

Die flache Kerze um 20:00 UTC trägt **den offiziellen Schlusskurs des Tages**. Yahoo
meldet dafür keinen Umsatz, weil die Schlussauktion nicht als Umsatz der Stunde geführt
wird. Eine Löschregel hätte den wichtigsten Kurs des Tages entfernt.

## Die Gegenprobe, die es entscheidet

Für den 25.08.2026 wurde für 395 Werte die 20:00-Kerze des Stundenarchivs gegen den
Schlusskurs aus dem **Tagesarchiv** gehalten — zwei getrennte Reihen:

| | Werte | Anteil |
|---|---|---|
| 20:00-Kerze näher am Tagesschluss | **309** | 78,2 % |
| 19:30-Kerze näher | **0** | 0,0 % |
| beide gleich weit (19:30 trifft ihn auch) | 86 | 21,8 % |

**In keinem einzigen Fall ist die letzte reguläre Stunde näher am Tagesschluss.** Die
20:00-Kerze trifft ihn in 309 Fällen auf 0,000 % genau.

Beispiele:

```
A     Tagesschluss 154,7700   19:30 154,7800 (0,006 %)   20:00 154,7700 (0,000 %)
AAL   Tagesschluss  13,9500   19:30  13,9650 (0,108 %)   20:00  13,9500 (0,000 %)
AAOI  Tagesschluss 113,1500   19:30 113,1100 (0,035 %)   20:00 113,1500 (0,000 %)
```

## Warum die naheliegenden Regeln alle falsch gewesen wären

| Regel | trifft | davon **mit Umsatz** — jede wäre ein gelöschter Handel |
|---|---|---|
| Umsatz 0 **und** völlig flach (Vorgabe des PM) | 3.440 | 0, aber **429 echte Leerstunden mitten in der Sitzung** (FSEC 50, PAAA 42, BILZ 33 …) |
| Gitterbeginn **nach** dem letzten Eimer des Tages | 23.325 | **1.171** — Schlussauktionen an Halbtagen (24.12., 03.07., 29.11.) |
| beides zusammen | 2.924 | 0 — aber **76,3 % tragen einen ANDEREN Kurs als die Vorkerze** |

Die letzte Zeile war der Wendepunkt. Wäre die Kerze ein Platzhalter, müsste sie den
Schluss der Vorkerze wiederholen. Sie tut es in nur 23,7 % der Fälle; 302 der 2.924
weichen um mehr als 0,1 % ab, die größte um 2,93 % (INDV, 24.11.2023). Das ist kein
Rauschen — das ist die Auktion.

## Die Hypothese der QS ist widerlegt

„Der Platzhalter ist die **letzte Kerze der Reihe** und trägt den **Schlusskurs der
Vorkerze**":

* letzte Kerze der Reihe: **87 von 3.440** (2,5 %)
* Schlusskurs der Vorkerze: **742 von 3.440** (21,6 %)

Beides trägt nicht.

## Zwei eigene Fehlversuche, die dazugehören

1. „Sitzungsschluss" als **letzten Eimer-Beginn mit Umsatz** gerechnet — ergibt 19:30,
   die Kerze liegt aber bei 20:00. Die Hypothese kam mit 3,2 % heraus und war in
   Wahrheit gar nicht gefragt worden.
2. Dann „letzter Eimer-Beginn **+ 60 min**" — ergibt 20:30, weil der letzte Eimer des
   Tages **kürzer** ist als das Gitter (19:30 bis 20:00). Die Regel traf 21.180 Kerzen,
   davon 1.858 mit Umsatz.

Der Sitzungsschluss lässt sich aus dem Gitter nicht als Uhrzeit ableiten. Die dritte
Fassung kommt ohne Uhrzeit aus und vergleicht nur Positionen.

## Was tatsächlich stört

Nicht die Kerze, sondern ihre **Form**: Umsatz 0 und Hoch=Tief=Eröffnung=Schluss. Jede
Auswertung, die Stunden zählt oder Umsatz filtert, sieht eine leere Stunde, wo der
Tagesschluss steht. Wer sie als Kerze mitzählt, bekommt acht statt sieben Stunden je
Handelstag.

**Das ist eine Frage der Auswertung, nicht der Ablage.** Wilhelms Satz „wir brauchen
alle kerzen keine platzhalter" spricht nach dieser Messung **für das Behalten**: es ist
keine Platzhalterkerze.

## Zahlenwerk

* Archiv `E:/Markt-Dashboard-Archiv/archiv60m`, 2.916 Reihen, 14.797.688 Kerzen
* 732 Handelstage; der laufende Tag bleibt außen vor (dort ist das Archiv halb geholt —
  daran ist Fehlversuch 2 hängengeblieben)
* Gitterzeiten: 13:30–19:30 im Sommer, 14:30–20:30 im Winter; dazu 20:00 (Sommerschluss,
  0,0 % mit Umsatz), 18:00 und 17:00 (Halbtage, 4,4 % bzw. 6,0 % mit Umsatz)
* 2.870 der 2.924 Treffer liegen auf **einem** Tag (25.08.2026) — je Reihe genau eine
