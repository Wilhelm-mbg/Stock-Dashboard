# Mutationstest VORHER (unveraenderte Testreihe von main, 61dca2c)

Stand 04.10.2026. Worktree `/tmp/claude-0/wt-main` (detached 61dca2c), Harness `pruefberichte/mutation-buecher/harness.js` dorthin kopiert, **keine** `pruefberichte/mutation-buecher.test.js` und keine `teil-*.test.js` im Baum. Geprueft: test-v6.js, test-channel.js, pruefberichte/live-gegen-messung-momentum.test.js. 462 Mutanten (A 60, B 102, C 98, D 202), in 3 Scheiben (Rundlauf, je 154) parallel, danach Nachlaeufe einzeln.

## Zahlen (Endstand nach Nachlaeufen)

| Gruppe | getoetet | ueberlebt | ungueltig | alt (Bericht) getoetet / ueberlebt |
|---|---|---|---|---|
| A | 39 | 21 | 0 | 40 / 20 |
| B | 69 | 33 | 0 | 83 / 19 |
| C | 48 | 50 | 0 | 65 / 33 |
| D | 125 | 77 | 0 | 127 / 75 |
| **gesamt** | **281** | **181** | **0** | 315 / 147 |

- Ungueltig: 0 (alle 462 `suche`-Stellen eindeutig bzw. mit `nr`, alle Mutanten syntaktisch gueltig).
- Alle 147 alten Ueberlebenden ueberleben auch hier (davon die 24 aequivalenten vollstaendig). Kein alter Ueberlebender wird jetzt getoetet.
- Neu: **34 alte Kills ueberleben** auf dieser Testreihe. Jeder davon geht im alten Rohergebnis auf Rauschen oder auf die neuen Kleinsttests zurueck (Liste unten). Ueberlebende damit 181 = 24 aequivalent + 123 alte Luecken + 34 bisher als getoetet gefuehrte.

## Basis und Rauschquelle

- Basislauf test-v6 hier: **17** rote Zeilen, nicht 7: 7 wegen fehlender Datendateien + 10 Zeilen "89.5 electron-updater ... im Baum", weil der Harness `node_modules` nicht in die Arbeitskopie kopiert. Die alten Laeufe hatten ebenfalls 17 - gleiche Bezugsmenge.
- **Flake: test-v6 "84.4 fehlend, neu und nachgewachsen werden je einzeln genannt"** (test-v6.js Z. 20126, tools/alpaca-manifest.js Z. 151/190). Manifest-`stand` und der `stand` der neu geschriebenen Jahresdatei kommen beide aus `new Date().toISOString()` (ms-Aufloesung), geprueft wird streng `s > manStand`. Fallen beide in dieselbe Millisekunde, landet AAA nicht in `nachgewachsen` und die Zeile ist rot. Rate hier: 1 von 8 Basislaeufen, 6 von 90 Mutanten im Einzel-Nachlauf.
- Scheibe 1 hat den Flake **im Basislauf** gefangen (Basis 18 statt 17). Dadurch galt jeder Mutant dieser Scheibe, dessen Lauf den Flake nicht hatte, als getoetet mit Grund "test-v6: Exit 1" (eine Basiszeile fehlt, keine neue). Das betraf fast alle Ueberlebenden der Scheibe (Rohstand Scheibe 1: 149 getoetet / 5 ueberlebt). Dasselbe Muster steckt in den alten Laeufen B-ergebnis-7 und C-ergebnis-5 (Basis 18).
- In Scheiben 2/3 tauchte der Flake umgekehrt als "1 neu rot, z.B. 84.4 ..." auf.

## Nachlaeufe

1. `vorher-nachlauf-1.json`: 90 Mutanten einzeln (alle Abweichungen beider Richtungen + alle Kills, deren einziger Grund "test-v6: Exit 1" oder genau eine neue rote Zeile 84.4 war). Basis 17. Ergebnis 6 getoetet / 84 ueberlebt; die 6 Kills (B-10, B-94, C-29, C-37, D-127, D-158) wieder nur durch 84.4.
2. `vorher-nachlauf-2.json`: diese 6 erneut: B-10, C-29, C-37, D-158 ueberleben; B-94 und D-127 erneut nur 84.4.
3. `vorher-nachlauf-3-B-94.json`, `vorher-nachlauf-3-D-127.json`: je einzeln: beide ueberleben. Beide Mutationen beruehren den Manifest-Code nicht (B-94: `nachfassen` geaendert ohne entfallen; D-127: korbVerlauf zulaessig/geprueft vertauscht).

Kein Kill im Endstand haengt allein am Flake (Pruefung: kein GETOETET mit einzigem Grund "Exit 1" oder nur 84.4).

## Abweichungen zum alten Urteil (34, alle alt getoetet -> jetzt ueberlebt)

Grund jetzt: in allen Faellen `gruende: []` (identische Unterschrift wie die Basis), bestaetigt im Einzel-Nachlauf (Basis 17). Spalte "alter Grund" aus den alten Rohergebnissen *-ergebnis-*.json.

| Kennung | jetzt | alter Grund (Rohergebnis) |
|---|---|---|
| A-33 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Flake 84.4 (A-ergebnis-4.json) |
| B-52 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Flake 84.4 (B-ergebnis-4.json) |
| B-67 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch neue Kleinsttests (teil-B.test.js lag im alten Lauf B-ergebnis-6.json schon im Baum) |
| B-70 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch neue Kleinsttests (teil-B.test.js lag im alten Lauf B-ergebnis-6.json schon im Baum) |
| B-71 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch neue Kleinsttests (teil-B.test.js lag im alten Lauf B-ergebnis-6.json schon im Baum) |
| B-72 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch neue Kleinsttests (teil-B.test.js lag im alten Lauf B-ergebnis-6.json schon im Baum) |
| B-73 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch neue Kleinsttests (teil-B.test.js lag im alten Lauf B-ergebnis-6.json schon im Baum) |
| B-75 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch neue Kleinsttests (teil-B.test.js lag im alten Lauf B-ergebnis-6.json schon im Baum) |
| B-76 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch neue Kleinsttests (teil-B.test.js lag im alten Lauf B-ergebnis-6.json schon im Baum) |
| B-77 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch neue Kleinsttests (teil-B.test.js lag im alten Lauf B-ergebnis-6.json schon im Baum) |
| B-85 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Zeitmessung "Zeichenzeit fuer 390 Kerzen" unter Last ([259.1 ms], B-ergebnis-7.json) |
| B-87 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (B-ergebnis-7.json) = Basis hatte den 84.4-Flake |
| B-89 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (B-ergebnis-7.json) = Basis hatte den 84.4-Flake |
| B-90 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (B-ergebnis-7.json) = Basis hatte den 84.4-Flake |
| B-92 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Flake 84.4 (B-ergebnis-8.json) |
| C-31 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Zeitmessung "Zeichenzeit fuer 390 Kerzen" unter Last ([229.5 ms], C-ergebnis-2.json) |
| C-49 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Flake 84.4 (C-ergebnis-3.json) |
| C-61 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Flake 84.4 (C-ergebnis-4.json) |
| C-63 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 17 rote Zeilen (C-ergebnis-4.json) (Basis 17; vermutlich ebenfalls Flake, keine neue rote Zeile) |
| C-81 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-82 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-83 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-84 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-88 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-90 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-91 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-93 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-94 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-95 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-96 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-97 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| C-98 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen (C-ergebnis-5.json) = Basis hatte den 84.4-Flake |
| D-142 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Zeitmessung "Zeichenzeit fuer 390 Kerzen" unter Last ([641.4 ms], D-ergebnis-5.json) |
| D-196 | UEBERLEBT (Hauptlauf + Nachlauf 1) | alter Kill nur durch Flake 84.4 (D-ergebnis-7.json) |

Zusammengefasst: 6 x alter Kill nur durch Flake 84.4; 8 x alter Kill nur durch neue Kleinsttests; 3 x alter Kill nur durch Zeitmessung "Zeichenzeit fuer 390 Kerzen" unter Last; 16 x alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 18 rote Zeilen; 1 x alter Kill nur "test-v6: Exit 1" ohne neue rote Zeile bei Basis 17 rote Zeilen.

Anders herum (alt ueberlebt, jetzt getoetet): **keine** nach den Nachlaeufen. Im Hauptlauf waren es 56 (47 "Exit 1" aus Scheibe 1 mit Flake-Basis, 9 "1 neu rot 84.4"), alle im Einzel-Nachlauf ueberlebt.

## Die 181 ueberlebenden Kennungen

- **A** (21): A-10 A-12 A-13 A-14 A-20 A-25 A-29 A-31 A-32 A-33* A-34 A-35 A-36 A-38 A-39 A-46 A-52 A-53 A-54 A-55 A-60
- **B** (33): B-10(aeq) B-23 B-34 B-35 B-38(aeq) B-41 B-42 B-52* B-53 B-54 B-56 B-59 B-60 B-61 B-64(aeq) B-67* B-68(aeq) B-69(aeq) B-70* B-71* B-72* B-73* B-74(aeq) B-75* B-76* B-77* B-85* B-87* B-89* B-90* B-92* B-94 B-98(aeq)
- **C** (50): C-07 C-08 C-11 C-12 C-13 C-15 C-16 C-19 C-21(aeq) C-28 C-29 C-30 C-31* C-34 C-35 C-37 C-38 C-42 C-47 C-49* C-50 C-51 C-52 C-54 C-56 C-57(aeq) C-58 C-61* C-63* C-70 C-71 C-72 C-73 C-74 C-76(aeq) C-78(aeq) C-80 C-81* C-82* C-83* C-84* C-88* C-90* C-91* C-93* C-94* C-95* C-96* C-97* C-98*
- **D** (77): D-01 D-02 D-03 D-04 D-05 D-06 D-08(aeq) D-10 D-27 D-28 D-29 D-31 D-36 D-39 D-42 D-43 D-46 D-47 D-51 D-55 D-56 D-57 D-58 D-59 D-61(aeq) D-63 D-65 D-66(aeq) D-71(aeq) D-74 D-79 D-84 D-86 D-88 D-89 D-99 D-114 D-117 D-118 D-121 D-122 D-124 D-126 D-127 D-128 D-132 D-134 D-135 D-136 D-137 D-141 D-142* D-143 D-148(aeq) D-153(aeq) D-154 D-155(aeq) D-157(aeq) D-158(aeq) D-159 D-161 D-164 D-173 D-178(aeq) D-180(aeq) D-184 D-187 D-188 D-189(aeq) D-191 D-192 D-194 D-195 D-196* D-197(aeq) D-201 D-202

(aeq) = laut Bericht aequivalent (24); * = im Bericht als getoetet gefuehrt (34); ohne Zeichen = alte echte Luecke (123).

## Dateien

- `/tmp/claude-0/harness/vorher-gesamt.json` (id -> urteil, Endstand)
- Rohlaeufe `vorher-1..3.json/.log`, Nachlaeufe `vorher-nachlauf-1.json`, `-2.json`, `-3-B-94.json`, `-3-D-127.json`
- Scheiben `scheibe-1..3.json`, Bezug `alt-gesamt.json` (aus den Tabellen der *-bericht.md), `alt-aeq.json`
