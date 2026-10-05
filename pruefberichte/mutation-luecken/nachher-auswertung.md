# Harness-Nachweis NACHHER: Commit 3f0338d (test/mutation-luecken)

Stand 05.10.2026. Worktree `/tmp/claude-0/wt-nach` (detached 3f0338d). Harness = unveränderte Kopie von
`mb/pruefberichte/mutation-buecher/harness.js`, abgelegt unter `wt-nach/pruefberichte/mutation-luecken/`
zusammen mit `{A,B,C,D}-mutanten.json`. Auf 3f0338d liegen diese Dateien nicht im Baum. Ich habe sie deshalb hineinkopiert,
nicht eingecheckt. `pruefberichte/mutation-buecher.test.js` gibt es im Worktree **nicht**. Der Harness prüft also nur
test-v6.js, test-channel.js und den Kleinsttest. Die neuen Zusicherungen wirken nur über test-v6 Abschnitt 101 (MB-Zeilen).

Lauf: 462 Mutanten in 2 Scheiben (gerade/ungerade), `nachher-1.json` / `nachher-2.json`, Logs `nachher-{1,2}.log`.

## Basis

- Die Basis hat 17 rote Zeilen in test-v6: 7 wegen fehlender Datendateien und 10 vom Typ „89.5 electron-updater …“,
  weil der Harness `node_modules` nicht kopiert. Der Exit-Code ist 1. Von den 281 MB-Zeilen sind alle grün.
- Scheibe 1 hatte im **ersten** Start in der Basis den 84.4-Ausreißer gefangen (18 Zeilen). Ich habe sie nach 2 Mutanten
  abgebrochen und neu gestartet. Danach haben beide Scheiben 17.

## Zahlen (endgültig, nach Nachläufen; ein Absturz von test-v6 zählt als getötet)

| Gruppe | getötet | überlebt | ungültig |
|---|---|---|---|
| A (60) | 59 | 1 | 0 |
| B (102) | 95 | 7 | 0 |
| C (98) | 91 | 7 | 0 |
| D (202) | 200 | 2 | 0 |
| **gesamt (462)** | **445** | **17** | **0** |

So hat der Harness selbst gezählt: 441 getötet, 21 überlebt. Nach Abzug der beiden Rausch-Tötungen (C-29, D-197) misst er streng
439 / 23 (A 59/1, B 95/7, C 86/12, D 199/3). Die Differenz zu 445 sind die 6 Absturz-Mutanten, siehe unten.

## Überlebende (17)

| Kennung | Datei | Funktion | Beschreibung | Herkunft |
|---|---|---|---|---|
| A-33 | mfhandel.js | rebalanceFaellig | Balken genau an der Grenze zaehlt nicht | aus den 34 |
| B-10 | mfhandel.js | planeUmschichtung | Neukauf-Stueck: budget > 0 zu >= 0 | äquivalent |
| B-38 | mfhandel.js | fuehreAus | Erloes mit o.stueck statt Positionsbestand | äquivalent |
| B-64 | mfhandel.js | Uhr | Stunde ohne %24 | äquivalent |
| B-68 | mfhandel.js | Uhr | nyZeit Startschaetzung 4h | äquivalent |
| B-69 | mfhandel.js | Uhr | nyZeit nur eine Iteration | äquivalent |
| B-74 | mfhandel.js | Uhr | bestandFrisch: at 0 gilt gueltig | äquivalent |
| B-98 | mfhandel.js | offen* | nachfassen: budget >= 0 | äquivalent |
| C-21 | mfhandel.js | bucheMassnahmen | fehlende barZeit nicht abgefangen | äquivalent |
| C-57 | mfhandel.js | punktTag | Verlaufspunkt: heute in UTC | äquivalent |
| C-76 | mfhandel.js | nyTeile | 24-Uhr-Normierung entfernt | äquivalent |
| C-78 | mfhandel.js | tagPlus | tagPlus + 1 Stunde | äquivalent |
| C-83 | mfhandel.js | nyZeit | nyZeit Startschaetzung 4 h | aus den 34 (gleiche Mutation wie B-68) |
| C-84 | mfhandel.js | nyZeit | nyZeit: nur ein Korrekturschritt | aus den 34 (gleiche Mutation wie B-69) |
| C-93 | mfhandel.js | bestandFrisch | Ladezeit 0 gilt als moeglich frisch | aus den 34 (Gegenstück zu B-74) |
| D-196 | mfdepot.js | tagespunkt | Kappung ab >= 750 statt > 750 | aus den 34 (Gegenstück zu D-197) |
| D-197 | mfdepot.js | takt | Korbverlauf-Kappung >= 120 statt > 120 | äquivalent |

**Die Erwartung ist erfüllt:** Von den 24 Äquivalenten sind genau die 12 erwarteten getötet (D-08 D-61 D-66 D-71 D-148 D-153
D-155 D-157 D-158 D-178 D-180 D-189). Die übrigen 12 (B-10 B-38 B-64 B-68 B-69 B-74 B-98 C-21 C-57 C-76 C-78 D-197) überleben.
test-mutation-buecher.js allein lässt genau diese 12 grün. Die 5 Überlebenden aus den 34 sind inhaltlich Zwillinge der Äquivalenten.

## Die 123 Lücken-Mutanten

Herleitung: Basis sind die alten Ergebnisse `mb/…/*-ergebnis-<n>.json`, numerisch sortiert, spätere Dateien überschreiben
(B-9/B-10 sind Wiederholungen und haben Vorrang). Das ergibt 462 Mutanten, davon 315 getötet und 147 überlebt; deckungsgleich mit
`alt-gesamt.json`. 147 Überlebende minus 24 Äquivalente = **123**. Geprüft.

- **Getötet: 123 / 123.**
- **Tötungsquelle**
  - **118** über MB-Zeilen in test-v6 (Abschnitt 101).
    - Bei 105 zeigt `gruende` direkt eine MB-Zeile.
    - Bei 13 zeigt `gruende` „84.4 …“ als erste neue rote Zeile. Grund: Der Harness sortiert die Zeilen lexikografisch, und „8…“
      steht vor „M…“. Ein Nachlauf mit vollständiger Rotliste (`harness-voll.js`, `voll-{1,2}.json`) belegt bei allen 13 neue
      rote MB-Zeilen: A-39 B-60 C-13 C-34 C-47 C-56 C-71 D-46 D-56 D-128 D-135 D-173 D-195.
  - **5** durch einen **Absturz von test-v6 vor Abschnitt 101**: C-07, C-08, C-15, C-29, D-184. Die Tötung läuft also nicht über
    MB-Zeilen. Der Harness wertet sie als UEBERLEBT (C-29 wertet er als „getötet“, aber nur über die Rauschzeile 84.4).
    Einzeln nachgelaufen: Der Harness sagt wieder UEBERLEBT.
    - Ein direkter test-v6-Lauf endet mit einer nicht abgefangenen TypeError in einem älteren Abschnitt (C-07/C-08: `reading 'join'`
      in 96.4 `pruefeBuchung`; C-15/D-184: `reading 'length'`; C-29: `reading 'stueck'`). Danach fehlen Abschnitt 101 und die
      Abschlusszeile.
    - test-mutation-buecher.js allein tötet alle fünf.
- **Gegenprobe:** test-mutation-buecher.js allein (`mb-direkt.json`, Basis 281 grün / 0 rot) tötet alle 123.

### Harness-Blindheit (wichtig, betrifft auch VORHER)

Die Basis endet bereits mit Exit 1, und alle 17 Basis-Rotzeilen (die letzte steht bei Zeile ≈5157) liegen vor diesen
Absturzstellen. Ein Mutant, der test-v6 dahinter abbrechen lässt, hat deshalb dieselbe Rotmenge und denselben Exit-Code wie die Basis.
Der Harness wertet ihn als „überlebt“.

3f0338d ändert test-v6.js nur im Kopf und in Abschnitt 101. Dieselben Abstürze treten also **auch auf main** auf. C-07, C-08,
C-15, C-29, D-184 und C-63 hat die bestehende Reihe schon vorher getötet (npm test rot, keine Abschlusszeile). Sie sind keine
echten Lücken. Die VORHER-Zahl „123 Lücken“ enthält damit 5 Scheinlücken, und unter den 34 steckt mit C-63 eine weitere.

Abhilfe für den Harness: Fehlt die Abschlusszeile `\d+ Pruefungen, \d+ bestanden`, gilt der Mutant als getötet.

## Die 34 (vorher vom alten Bericht als getötet gezählt, auf main mit unveränderter Reihe überlebend)

| Kennung | nachher | Quelle |
|---|---|---|
| B-87 B-92 B-85 B-67 B-70 B-71 B-73 B-75 B-76 B-77 | getötet | MB (direkt in `gruende`) |
| C-81 C-82 C-88 C-90 C-91 C-94 C-95 C-96 C-97 C-98 C-49 C-61 C-31 | getötet | MB (direkt in `gruende`) |
| D-142 | getötet | MB (direkt in `gruende`) |
| B-89 B-90 B-52 B-72 | getötet | MB (Anzeige 84.4 nur Sortierung; volle Rotliste zeigt MB-Zeilen) |
| C-63 | getötet | **Absturz** von test-v6 (`reading 'stueck'`) vor Abschnitt 101; schon auf main. MB allein: rot |
| A-33 C-83 C-84 C-93 D-196 | **überlebt** | Kein Absturz, MB 281 grün. A-33 wurde einzeln einmal über 84.4 allein „getötet“ (Rauschen) |

Ergebnis: 28 getötet über MB, 1 durch Absturz, 5 überleben.

## Die 315 vorher Getöteten

Weiter getötet sind 309. Die 6 Abweichungen A-33, C-63, C-83, C-84, C-93 und D-196 gehören alle zu den 34. Ihre alten Tötungen waren
Basis- oder Ausreißer-Rauschen: „Exit 1“ ohne neue Zeile, oder 84.4 als einzige neue Zeile. C-63 zählt nachher durch den
Absturz als getötet. Es gibt keine weitere Abweichung.

## Nachläufe und Rauschen

- C-29 (Erstlauf: nur 84.4 neu): Einzeln überlebt er den Harness, beim Direktlauf stürzt test-v6 ab (siehe oben).
- D-197 (Erstlauf: nur 84.4 neu): Einzeln überlebt er, MB bleibt grün. Er ist äquivalent.
- A-33: im Hauptlauf überlebt, einzeln nur über 84.4 „getötet“. Er gilt als überlebt.
- D-155 (äquivalent, erwartet getötet): getötet über die Abschnitt-101-Sammelzeile „test-mutation-buecher.js laeuft vollstaendig
  durch … 167 gruen, 0 rot, Exit 1“. test-mutation-buecher.js bricht dabei ab. MB allein: rot.
- D-66, D-157, D-178: Die Anzeige zeigt 84.4, es gibt aber je 3 neue rote Zeilen. MB allein: rot.
- Der 84.4-Ausreißer kippte in diesem Lauf (unter Last, 5 bis 6 parallele Prozesse auf 4 Kernen) viel häufiger als „selten“: in
  rund 20 von 462 Mutantenläufen und in einer Basis.
- Die Nachläufe liefen in Listen zu je 6 Mutanten, nicht einzeln. Jeder Mutant wird dabei einzeln eingesetzt und
  zurückgesetzt, und die Basis wird neu gemessen.

## Dateien

- `nachher-gesamt.json`: id → {urteil, gruende}. Für korrigierte Mutanten zusätzlich harnessUrteil, harnessGruende und nachlauf.
- `nachher-{1,2}.json/.log`: Rohläufe. `nachlauf-{1,2}.json/.log`: Nachläufe. `voll-{1,2}.json`: volle Rotlisten.
  `absturz-{1,2}.log/.json`: Absturzprüfung. `mb-direkt.json`, `mb-direkt-34.json`: test-mutation-buecher.js allein.
- Skripte: `alt-luecken.js`, `nachher-eval.js`, `mb-direkt.js`, `absturz.js`.
