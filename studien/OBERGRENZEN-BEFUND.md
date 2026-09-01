# Was die 25 Messungen ausschließen — und wo wir blind sind

> **Nachtrag 02.09.2026:** Die Zählung „5 von 25" ist überholt — inzwischen 52 Varianten, gegen die CFD-Hürde 0,1247 Pp (K + eine Nacht Finanzierung) **31 geschlossen**. Fortsetzung und Depot-Kandidatenliste: `studien/wiedervorlage-2026-09-02/BERICHT.md`. Dieser Text bleibt als Stand vom 25.08. stehen.

25.08.2026. Erzeugt mit `node tools/obergrenzen-bericht.js`. Keine neue Messung: die
obere Grenze ist `tagesmittel + 1,96 × se`, beides steht seit jeher im Protokoll.

## Warum das überhaupt etwas ändert

„Nicht entscheidbar" ist eine Nicht-Aussage. Sie klingt wie *„wir wissen es nicht"* —
und oft stimmt etwas Stärkeres: *wir wissen, dass dort nichts Großes ist.*

Ein Lauf mit +0,048 Pp und einem Standardfehler von 0,025 Pp hat eine obere Grenze von
0,097 Pp. Er hat damit **ausgeschlossen**, dass dort eine Kante über 0,10 Pp liegt. Das
ist ein Befund. Er stand in keinem Protokoll ausgeschrieben.

## Erledigt: 5 von 25

Bei einer Hürde von 0,10 Pp je Umlauf (CFD/Aktie) liegt die obere Grenze unter der Hürde:

| | obere Grenze |
|---|---|
| `t3-stundendrift` V0 | 0,021 Pp |
| `t3-stundendrift` V1 | 0,034 Pp |
| `rsi2seit-mcp` V0 | 0,083 Pp |
| `rsi2seit-mcp` V1 | 0,085 Pp |
| `rsi2seit-mcp` V2 | 0,097 Pp |

Diese fünf müssen nie wieder durchsucht werden. Selbst der optimistischste mit den Daten
verträgliche Wert trägt die Kosten nicht. Beim **Standard-Schein** (0,23 Pp) sind es 13 von 25.

## Offen: 20 von 25 — und die Verteilung ist das Interessante

| Strategie | H | gemessen | obere Grenze |
|---|---|---|---|
| `momentum` V2 | 63 | +1,687 | **4,264 Pp** |
| `momentum` V0 | 63 | +1,160 | **3,373 Pp** |
| `momentum` V1 | 63 | +0,576 | **2,480 Pp** |
| `kapitulation` V2 | 26 | +1,108 | 2,120 Pp |
| `momentum` V3 | 63 | +0,277 | 2,008 Pp |
| `kapitulation` V0 | 26 | +0,535 | 1,243 Pp |
| … | | | |
| `rsi2seit-mcp` V0 | 8 | +0,039 | 0,083 Pp |

**Das Muster ist eindeutig und es ist kein Zufall:** Je länger die Haltedauer, desto weiter
die Grenze. Die kurz gehaltenen 60m-Strategien sind eng gemessen und größtenteils erledigt.
Die lang gehaltenen sind kaum gemessen.

Bei `momentum` liegt der **gemessene** Überschuss in allen vier Varianten über der
Kostenhürde — 0,28 bis 1,69 Pp je Umlauf gegen 0,10 Pp. Das ist **kein Beleg**: der
Standardfehler ist so groß, dass auch null im Band liegt. Aber es ist der einzige Ort im
ganzen Korpus, an dem die Arithmetik aufgehen könnte und an dem wir fast nichts wissen.

## Korrektur einer eigenen Aussage

Ich hatte behauptet, die Kosten fräßen 22 bis 176 Prozentpunkte im Jahr und wir hätten
„an der falschen Stelle gesucht". **Diese Zahlen waren falsch.** Sie unterstellten, jede
Strategie sei durchgehend im Markt (252/H Umläufe im Jahr). Tatsächlich feuert
`quartalsschub-betrag` 0,6-mal je Wert und Jahr, nicht 50-mal.

Eine zweite Rechnung, die die tatsächliche Signalzahl benutzte, hatte den umgekehrten
Fehler: Sie zählte bei `momentum` überlappende Signaltage als getrennte Umläufe.

**Beide Jahreszahlen hängen an einer Annahme über die Depotkonstruktion, die die Maschine
gar nicht kennt.** Die Tabelle oben braucht diese Annahme nicht: Die Hürde fällt je Umlauf
an, der gemessene Überschuss ist ebenfalls je Umlauf, beide stehen auf derselben Skala.

Was von der ursprünglichen Aussage übrig bleibt: Kurze Haltedauern haben mehr Umläufe und
zahlen deshalb häufiger. Was nicht übrig bleibt: die Größenordnung, und damit die
Behauptung, das allein erkläre das Scheitern.

## Was daraus folgt

Nicht „mehr Detektoren", sondern **das Gegenteil**: Der Korpus enthält genau eine Stelle,
an der eine große Kante noch möglich ist — und sie ist deshalb möglich, weil sie so
schlecht gemessen ist.

`momentum` ist schlecht gemessen aus einem bekannten Grund: **B10.** 63-Tage-Haltedauern
überlappen, Newey-West korrigiert über 62 Verzögerungen, und der Standardfehler wächst um
Faktor 6,42 (t 4,74 → 0,74). Das ist keine Schwäche der Strategie, sondern der
Messanordnung: Wer jeden Tag eine 63-Tage-Position eröffnet, hat pro Jahr 252 stark
abhängige Beobachtungen, nicht 252 unabhängige.

**Die bekannte Abhilfe ist eine andere Messanordnung, keine andere Statistik:** ein Depot,
das auf festem Kalender alle 63 Handelstage umschichtet. Dann gibt es vier **echt
unabhängige** Beobachtungen im Jahr, über 20 Jahre achtzig — wenig, aber ehrlich, und ohne
Überlappungskorrektur.

Genau diese Konstruktion läuft in `mfdepot.js` bereits als virtuelles Buch
(*„MOMENTUM stärkstes Zehntel, Rebalancing alle 63 Handelstage"*). Sie ist nie durch die
Mühle gegangen.

**Das ist die nächste Messung.** Sie sucht nichts Neues; sie misst das Einzige richtig, was
noch offen ist.
