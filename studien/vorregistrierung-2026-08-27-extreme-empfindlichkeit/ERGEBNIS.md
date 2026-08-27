# Ergebnis — Extreme-Empfindlichkeit: der Stopp-Pfad wird berührt, die Kante wird nicht verschoben

**Gemessen:** 27.08.2026 ~15:0x–16:0x, Rolle Berechnungen. Auftrag PM (die von der QS
als »Messung der Mess-Seite« abgegebene Frage). Vorregistrierung da47a89, Treiber
c91c34c — beide **vor** dem Lauf committet. Maschine 1.6.1, ein Lauf, vier
Kinderprozesse. Rohdaten: `<strategie>-A/B.json`, `vergleich.json`,
`strittige-zaehlung.json`.

## Urteil

**rsi2seit-mcp: verschiebt nicht messbar. kapitulation (Negativkontrolle):
bestanden.** Die strittigen Hoch/Tief-Tage kosten die gemessene Kante nichts, was
mit dieser Datenmenge nachweisbar wäre.

| Variante (mcp) | Überschuss A → B | Δ | delta80_A | Verhältnis |
|---|---|---|---|---|
| Var0 (0,9) | +0,0330 → +0,0329 | −0,0001 | 0,0795 | 795× darunter |
| Var1 (0,75) | +0,0351 → +0,0351 | ±0,0000 | 0,0813 | — |
| Var2 (0,5) | +0,0434 → +0,0432 | −0,0002 | 0,0874 | 437× |
| Var3 (0,25) | +0,0511 → +0,0506 | −0,0005 | 0,0965 | 193× |
| Var4 (0,1) | +0,0558 → +0,0549 | −0,0010 | 0,1037 | 104× |

Alle Urteile unverändert (5× nicht-entscheidbar), kein Etikettenwechsel, auch kein
Randflackern. Placebo-t beider Arme unauffällig (1,053 / 1,058).
**Negativkontrolle kapitulation:** Δ = ±0,0000 in allen drei Varianten, Ausstiegsart
»Zeit«, Haltedauer exakt 26 Kerzen in beiden Armen — die schlusskurs-blinde Strategie
ist buchstäblich unberührt, das Geschirr misst also nicht sich selbst.

## Der Nullbefund ist NICHT trivial — der Mechanismus wirkt nachweislich

Die entscheidende Gegenprobe (»hat der Stopp-Pfad die strittigen Extreme überhaupt
berührt?«) fällt positiv aus: **Die mittlere Haltedauer steigt in ALLEN fünf
Varianten**, und zwar monoton mit der Stopp-Enge:

| mcp | Haltedauer A → B | Verschiebung | Summe |
|---|---|---|---|
| 0,9 | 2,5174 → 2,5204 | +3,00 ‰ Kerzen | 315 Kerzen |
| 0,75 | 2,6405 → 2,6438 | +3,31 ‰ | 347 |
| 0,5 | 3,0629 → 3,0676 | +4,75 ‰ | 499 |
| 0,25 | 3,5646 → 3,5697 | +5,09 ‰ | 534 |
| 0,1 | 3,8307 → 3,8360 | +5,29 ‰ | 555 |

**Richtung und Ordnung sind exakt die vorhergesagten:** Ohne den strittigen Tief-Docht
löst der Trailing-Stopp später aus, die Position hält länger — und je enger der
Stopp (kleineres mcp), desto größer die Wirkung. Der QS-Mechanismus (»ein zu tiefes
Tief löst einen Stopp aus, den es nie gab«) ist damit **im Messpfad nachgewiesen**;
er ist nur zu selten und zu klein, um die Kante zu bewegen. Größenordnung: rund
300–550 Kerzen auf 104.968 Signale.

## Datenlage der Neutralisierung

2.885 Reihen (7 ohne 1d-Gegenstück unverändert), **2.101.792 Tage verglichen**,
strittig auf dem Hoch 28.222 / auf dem Tief 26.896 = **2,62 % der Tage**,
5.574 Skalen-Tage übersprungen, **45.138 Kerzen chirurgisch neutralisiert** in
2.680 Reihen. Das reproduziert den QS-Zensus unabhängig (dort 2.101.732 Tage /
3,05 % echte Widersprüche) mit anderem Werkzeug.

**Differenz zum Zensus: 60 Tage (0,003 %).** Zwei Erklärungen sind gemessen
ausgeschlossen: Die Reihenmenge ist identisch (2.885 − 7 = **2.878**, exakt die
QS-Zahl), und der Archivstand war es auch (zwischen beiden Läufen wurde keine
einzige Archivdatei geschrieben). Die Differenz liegt also in den Zählregeln — ich
zähle einen Tag nur bei gültigem Hoch UND Tief auf beiden Seiten und habe 60 Tage
mehr. **Ursache nicht abschließend geklärt** (das QS-Werkzeug liegt nicht im Repo);
ohne Belang für dieses Ergebnis.

## Deutungsgrenzen

- Die Neutralisierung ist eine **Obergrenze**: Sie entfernt auf den betroffenen
  Kerzen auch echte Docht-Information, und bei rund der Hälfte der strittigen Tage
  ist ohnehin das 1d die falsche Seite (QS: 10:9). Der wahre Einfluss ist kleiner.
- Gemessen wurden **zwei** Strategien. rsi2seit-mcp ist der einzige Hoch/Tief-Leser
  unter den belegten (Code-Durchsicht vor der Registrierung: alle Einstiegszweige
  lesen nur Schlüsse); für unbelegte oder künftige Strategien mit Ausbrüchen oder
  Kanalgrenzen gilt der Befund **nicht** — dort müsste neu gemessen werden.
- Kein Kanten-Urteil: rsi2seit-mcp bleibt in beiden Armen »nicht-entscheidbar«.

## Was daraus folgt

**Für die Mess-Seite ist die Hoch/Tief-Frage entschärft** — die 3 % strittigen Tage
verschieben kein Messergebnis. **Für die Live-Seite folgt daraus nichts**: Dort wird
ein einzelner Stopp an einem einzelnen Tag ausgelöst, nicht ein Mittelwert über
100.000 Signale gebildet. Ob die Stopp-REGEL robuster gebaut werden sollte (etwa auf
Schlusskurs statt Tief), ist eine eigene Frage und war ausdrücklich nicht Teil dieses
Laufs.

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
