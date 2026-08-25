# Einteilung der Strategien — festgeschrieben vor dem Lauf

Die Vorregistrierung verlangt eine Einteilung in TIMING und AUSWAHL **aus den
Quelldateien, nicht aus den Ergebnissen**. Hier steht sie, mit den beiden objektiven
Größen, aus denen sie folgt, und mit einem Konflikt, den ich vorher auflösen muss.

## Die zwei Kriterien, gemessen

| Strategie | nutzt `rang`? | Anteil des Universums je Signaltag |
|---|---|---|
| `momentum` | **ja** | 24,5 % |
| `quartalsschub-betrag` | **ja** | 1,1 % |
| `kapitulation` | nein | 3,0 % |
| `rsi2seit` | nein | 5,4 % |
| `rsi2seit-mcp` | nein | 5,3 % |
| `t1-zwangsglattstellung` | nein | 6,1 % |
| `t2-umsatzschock` | nein | 3,8 % |
| `monatswende-breit` | nein | **74,7 %** |
| `monatsende-kauf` | nein | **100,0 %** |
| `t3-stundendrift` | nein | **128,1 %** ¹ |

¹ Über 100 %, weil auf 60m mehrere Kerzen je Symbol und Tag feuern. Der Anteil ist als
Signale-je-Signaltag durch Universumsgröße gerechnet; für die Einteilung genügt das —
`t3` feuert erkennbar auf praktisch allem.

## Der Konflikt, und wie ich ihn auflöse

Die Regel im Plan lautet: TIMING = *liest keinen Kurs* **oder** *kauft mehr als 20 % des
Universums*. Nach dem Buchstaben fällt **`momentum` mit 24,5 % in TIMING** — obwohl es
eine Querschnitts-Rangstrategie ist und damit der Prototyp von AUSWAHL.

Der Zweck der Klasse TIMING ist in der Vorregistrierung ausdrücklich genannt: dort hat die
Querschnitts-Kontrolle *„per Konstruktion nahezu null Macht"*. Das trifft bei 74,7 % zu
(dann ist das Mittel der anderen Werte praktisch das eigene Portfolio). Bei 24,5 % trifft
es nicht zu — drei Viertel des Universums stehen weiterhin als Vergleich zur Verfügung.

**Ich löse das nicht, indem ich mich für eine Lesart entscheide.** Wer eine Regel nach dem
Blick auf die Zahlen zurechtbiegt, hat sie nicht angewandt. Stattdessen werden **beide
Lesarten vorab festgeschrieben und beide berichtet**:

| Menge | Definition | Mitglieder |
|---|---|---|
| **AUSWAHL-primär** | nutzt Querschnittsrang | `momentum`, `quartalsschub-betrag` |
| **AUSWAHL-streng** | Rang **und** ≤ 20 % des Universums | `quartalsschub-betrag` |

Stimmen beide überein, ist der Punkt erledigt. Weichen sie ab, ist genau das die
Information — und sie wird als solche gemeldet, nicht weginterpretiert.

## Wo die Kontrolle per Konstruktion machtlos ist

`monatswende-breit` (74,7 %), `monatsende-kauf` (100 %) und `t3-stundendrift` (128 %)
kaufen praktisch das ganze Universum. Für sie **ist** das Mittel der anderen Werte das
eigene Portfolio; der Querschnitts-Überschuss muss dort gegen null gehen.

**Das steht vorher fest und wird nicht als Befund gewertet.** Es ist im Gegenteil eine
Probe auf das Werkzeug: Geht der Überschuss dieser drei *nicht* gegen null, ist die
Implementierung falsch.

## Für den primären Endpunkt

`f = se(A7) / se(Querschnitt)` wird über **alle 38 Varianten** gebildet — die Einteilung
betrifft nur den sekundären Endpunkt (die Verzerrungsfrage). Zusätzlich wird `f` je Klasse
ausgewiesen, weil die Erwartung sich unterscheidet: Bei den drei Universumskäufern sollte
`f` groß sein (der Marktzug wird herausgerechnet und es bleibt fast nichts), bei den
selektiven Strategien ist die interessante Frage, ob `f` groß bleibt.
