# Notiz: der Zwischenlauf zählt nicht

**Geschrieben, bevor die vollständige Messung vorliegt.** Der Zeitstempel dieses
Commits ist der Beleg. Genau darum geht es.

## Was passiert ist

Während der Aufbau des großen Archivs lief (3.263 Werte, rund eine Stunde), habe ich
die Messkette technisch geprüft — auf dem, was zu dem Zeitpunkt da war: **630 Werte**.
Zweck war ausdrücklich, Fehler in der Kette zu finden (sechselementige Kerzen,
ETF-Ordner, SPY-Zugriff), nicht ein Ergebnis zu erzeugen.

Die Probe kam so heraus:

| Variante | Signale | Überschuss | MDE | t | Urteil |
|---|---|---|---|---|---|
| V0 nur der Auslöser | 3.204 | +0,510 | 0,546 | 1,87 | nicht entscheidbar |
| V1 + Liquidität | 3.167 | +0,486 | 0,544 | 1,79 | nicht entscheidbar |
| V2 + Regime-Tor | 1.602 | **+1,206** | 0,960 | **2,51** | **BESTÄTIGT** |

Zum ersten Mal steht in diesem Projekt „bestätigt" unter einer Messung.

## Warum das trotzdem nicht zählt

**Erstens: Das Universum ist keine Stichprobe, sondern ein Anfangsstück.** Die
Abrufliste ist nach Umsatz sortiert; die 630 fertigen Werte sind die *größten*.
Das ist eine systematische Auswahl, keine zufällige.

**Zweitens: Der Punktschätzer springt zu stark.** Von 191 auf 630 Werte wandert er
von +0,201 auf +0,510 Pp. Bei einem stabilen Effekt müsste die MDE fallen und der
Schätzer ungefähr stehen bleiben. Er tut das Gegenteil — passend zu den
Teilstichproben von gestern (+0,617 / +0,017 / +0,632 / +0,201 bei 24 / 48 / 96 /
191 Werten). Die +1,206 liegen mitten in diesem Streubereich.

**Drittens: Die Hälften widersprechen sich weiter.** Entdeckung −0,284 Pp,
Bestätigung +1,206. Ein Effekt, der in der ersten Hälfte negativ und in der zweiten
stark positiv ist, ist kein Effekt, sondern ein Zeitraum.

**Viertens, und das ist der eigentliche Grund: Ich habe jetzt dieselben drei Tests
auf zwei Datenmengen gefahren.** Wer den günstigeren Lauf berichtet, hat die
Datenmenge ausgewählt, die das gewünschte Ergebnis liefert. Das ist Fehlertyp B7
(nachträgliches Weglassen), nur eine Ebene höher — man lässt nicht Fälle weg,
sondern ganze Läufe.

## Die Festlegung

**Es zählt die Messung auf dem vollständigen Universum.** Sie ist die dritte und
letzte; danach wird an dieser These nichts mehr gerechnet, egal wie sie ausgeht.

Die Bonferroni-Schwelle steigt entsprechend: Aus 3 vorregistrierten Tests werden
faktisch **9 Testläufe** (3 Varianten × 3 Datenstände: 191, 630, vollständig). Die
Läufe sind stark abhängig — dieselben Tage, geschachtelte Universen —, also wäre 9
zu streng. Aber 3 ist zu lässig. **Berichtet wird beides:** das Urteil bei 3 Tests
(Schwelle 2,39) und bei 9 (Schwelle 2,77).

Kommt V2 auch auf dem vollen Universum über 2,77, ist das der erste ernstzunehmende
Kandidat dieses Projekts. Kommt es nur über 2,39, steht im Bericht „grenzwertig, und
die Schwelle ist umstritten" — nicht „bestätigt".

## Was daran unangenehm ist

Die Versuchung, hier aufzuhören und den Fund zu melden, ist der Grund, warum diese
Notiz vor dem Ergebnis geschrieben wird. Eine Regel, die man erst nach dem Ergebnis
aufstellt, ist keine Regel.
