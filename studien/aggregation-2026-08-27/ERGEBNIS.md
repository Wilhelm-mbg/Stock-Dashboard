# Ergebnis — Aggregations-Differenz: die 3,22 % sind ein Aggregations-Artefakt, und die teurere Variante ist die scheinbar vorsichtige

**Gemessen:** 27.08.2026 ~23:0x, Rolle Berechnungen. Auftrag PM (»3,22 % gegen 6,67 % —
welche Aggregation ist die richtige und was kostet die falsche?«). Werkzeug
`messe-aggregation.js` in diesem Ordner, nur lesend. **Nichts umgestellt, keine
Empfehlung** (Auflage 4) — der Aggregations-Entscheid ist keiner des Messlaufs.

**Datenbasis:** Hauptlauf über jede 6. Reihe — **479 Reihen, 349.692 Tage**
(2 ohne 1d-Gegenstück, 232 Skalen-Tage ausgenommen). Der Pilot (73 Reihen) zeigte
dieselben Verhältnisse; beide Läufe liegen als `lauf-*.json` daneben.

## Auflage 3 zuerst — die Frage, die die anderen wichtig macht

**Die Messmaschine aggregiert überhaupt nicht auf Tage.** Sie liest 60m-Kerzen
sequenziell; `sitzungsPosition`/`sitzungsSchicht` (messmaschine.js:317 ff.) zählen
alle vorhandenen Kerzen durch, **ohne Umsatzfilter**, und bilden nie ein Tageshoch
oder -tief. **Die Aggregations-Differenz steht damit in keinem Messprotokoll** — sie
betrifft die Diagnose-Werkzeuge (Zensus, Populationslauf, mein Extreme-Lauf), nicht
die Kanten-Urteile. Das nimmt der Frage die Dringlichkeit, nicht die Bedeutung.

*(Eine Nebenwirkung bleibt und ist nicht Teil dieses Auftrags: Weil die Maschine
umsatzlose Kerzen als Positionen mitzählt, kann eine solche Kerze das »G« der
Sitzungsschicht sein — das betrifft G-Anteile in Studien, nicht Tagesextreme.)*

## Auflage 1+2 — beide Aggregationen nebeneinander, und was jede kostet

| Aggregation | uneinig mit archiv1d (> 0,2 %) |
|---|---|
| **A — nur umsatztragende Kerzen** (Zensus-Zuschnitt) | **2,96 %** |
| **B — alle Kerzen** (mein Extreme-Lauf) | **2,58 %** |
| *C — alle außer Lage »nachhandel«* (nicht vorab festgelegt, s. u.) | *2,53 %* |

Fälle, in denen sich A und B unterscheiden: **1.786-mal ist nur A uneinig** (B stimmt
mit dem Tagesarchiv), **484-mal nur B**. Der Pilot (jede 40. Reihe) traf mit 3,20 %
die berichtete Zensus-Zahl 3,22 % fast genau; im größeren Lauf liegt A bei 2,96 %.
**Die Differenz zwischen den Diagnose-Läufen ist damit als Aggregations-Artefakt
identifiziert**, nicht als Messfehler. (Die 6,67 % des Populationslaufs sind hiermit
nicht erklärt; dessen Zuschnitt ist mir nicht bekannt.)

**Was Aggregation A kostet — die Kernzahl:** In **5.977** Fällen trägt eine
**umsatzlose** Kerze das Tagesextrem. Davon werden **5.283 = 88,4 % vom 1d-Archiv
bestätigt** — echte Extreme, die A wegwirft. Nur 694 = 11,6 % werden widersprochen
(Stempel, die B hereinholt). **Die scheinbar vorsichtige Aggregation ist die teurere:
Sie verliert siebenmal mehr echte Information, als sie an Stempeln vermeidet.**

## Der eigentliche Fund: es kommt auf die Lage an, nicht auf den Umsatz

Aufschlüsselung mit `kerzenlage.js` (vorhandenes Instrument, kein Nachbau):

| Lage der umsatzlosen Kerze | trägt Extrem | davon bestätigt | widersprochen |
|---|---|---|---|
| **sitzung** (umsatzlose Stunde *im* Handel) | 4.277 | **4.247 = 99,3 %** | 30 |
| **nachhandel** (Umsatz 0 nach Sitzungsende) | 1.693 | 1.029 = 60,8 % | 664 |
| schlusskurs (20:00-Familie) | 7 | 7 = 100 % | 0 |

**Umsatz ist der falsche Unterscheider.** Eine umsatzlose Stunde *innerhalb* der
Sitzung trägt zu **99,3 %** ein echtes Extrem — dort fehlt der Umsatz, weil in einem
illiquiden Wert nicht gehandelt wurde, nicht weil die Kerze unecht wäre. Die gemischte
Klasse ist allein »nachhandel« (60,8 % echt, und sie stellt mit 664 Fällen **96 % aller
Stempel**) — und genau sie ist über die **Lage** identifizierbar, ohne den Umsatz zu
befragen. *Die Lage »auktion« taucht nicht auf, weil Auktionskerzen Umsatz > 0 tragen
und deshalb nicht in diese Zählung fallen; die 20:00-Schlusskurs-Familie setzt mit 7
von 5.977 Fällen praktisch nie ein Tagesextrem.* Der Pilot zeigte dieselbe Struktur
(97,7 % / 60,8 %) — die 60,8 % der Nachhandels-Klasse sind über beide Läufe stabil.

**Variante C** (alle Kerzen außer »nachhandel«) folgt aus diesen Zahlen und ist
deshalb ausdrücklich **datengetrieben entstanden, nicht vorab festgelegt** — sie wird
beziffert, damit der Entscheid die dritte Möglichkeit kennt, und ist keine
Empfehlung.

## Grenzen

Der Vergleichsmaßstab ist das 1d-Archiv, und das ist **nicht** die Wahrheit: Bei
Uneinigkeit hat es laut QS-Stichprobe nur in rund der Hälfte der Fälle recht (10:9
gegen 60m). Die Zahlen oben messen also **Übereinstimmung mit dem Tagesarchiv**, nicht
Richtigkeit. Bei *Einigkeit* ist die Lage anders — dort hat Massive in 8 von 8 Fällen
beide bestätigt, weshalb »bestätigt« hier belastbarer ist als »widersprochen«.
Skalen-Tage sind nach dem QS-Kriterium ausgenommen, damit keine Konventionsfälle
mitgezählt werden.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
