# Mutationsluecken der Buecher: Kleinsttests in die Testreihe uebernommen (05.10.2026, Zweig test/mutation-luecken)

**Kurzfassung**
- Die 281 Zusicherungen vom Zweig `pruefung/mutation-buecher` stehen in `test-mutation-buecher.js` und laufen ueber `test-v6.js` Abschnitt 101 bei jedem `npm test` mit. Am App-Code wurde nichts geaendert.
- Die Gesamtzahl der Pruefungen in `test-v6.js` steigt von 5.443 (aus dem neuen Zaehler zurueckgerechnet) auf **5.725** (281 neue Zusicherungen plus eine Sammelzeile). `test-v6.js` gibt die Zahl jetzt am Ende selbst aus. Bisherige Pruefungen sind unveraendert. In diesem Container sind dieselben 7 wie auf main rot, weil hier Datendateien fehlen. eslint meldet 0 Fehler, test-channel ist gruen.
- **Getoetete Mutanten:** vorher **287 von 462**, nachher **445 von 462**. Beide Laeufe in diesem Container mit demselben Harness; ein Absturz von test-v6 zaehlt als getoetet.
- **Die 123 Luecken sind alle getoetet.**
  - 118 davon toeten die neuen Zusicherungen, als rote `MB`-Zeilen in test-v6.
  - Die uebrigen 5 (C-07, C-08, C-15, C-29, D-184) toetete test-v6 schon auf main durch einen Absturz. Der alte Harness hat das nicht gesehen. Die echte Zahl der Luecken war also **118**.
- **Von den 24 aequivalenten Mutanten** ueberleben 12. Die anderen 12 (D-08, D-61, D-66, D-71, D-148, D-153, D-155, D-157, D-158, D-178, D-180, D-189) toeten die neuen Tests ueber kuenstliche Eingaben. Das sind Vertragstests, keine Fehlerfunde.
- **Zweiter Blick auf die 24:** keine echte Luecke. 19 sind bestaetigt aequivalent, 5 praktisch aequivalent. Offen bleibt D-71 (Abruf `1h` statt `1d`): ob Yahoos erste Stundeneroeffnung gleich der Tageseroeffnung ist, ist ohne Netz nicht entscheidbar. Wenn nicht, waere das HOCH. Die Zusicherung, die `interval: '1d'` festnagelt, bleibt deshalb stehen.
- **Der alte Bericht hat 34 Mutanten faelschlich als getoetet gezaehlt** (Rauschen, siehe Befunde). Die neuen Tests toeten 28 davon, ein weiterer (C-63) stuerzt schon auf main ab. 5 ueberleben: C-83, C-84 und C-93 sind byte-gleich mit den aequivalenten B-68, B-69 und B-74; D-196 entspricht D-197; A-33 ist praktisch aequivalent.

## Tabelle vorher / nachher

Vorher ist main (61dca2c), nachher dieser Zweig (3f0338d). Gezaehlt ist der Endstand nach den Einzel-Nachlaeufen.

| | Mutanten | getoetet vorher | getoetet nachher | ueberleben nachher |
|---|---|---|---|---|
| Luecken laut Bericht | 123 | 5 (Absturz, s. u.) | **123** | 0 |
| aequivalent laut Bericht | 24 | 0 | 12 (kuenstliche Eingaben) | 12 |
| laut Bericht getoetet, tatsaechlich Rauschen | 34 | 1 (C-63, Absturz) | 29 | 5 |
| im Bericht und hier getoetet | 281 | 281 | 281 | 0 |
| **gesamt** | **462** | **287** | **445** | **17** |

Je Gruppe nachher, getoetet/ueberlebt: A 59/1, B 95/7, C 91/7, D 200/2.

Die 17 Ueberlebenden:

| Kennungen | Einordnung |
|---|---|
| B-10, B-38, B-64, B-68, B-69, B-74, B-98, C-21, C-57, C-76, C-78, D-197 | bestaetigt aequivalent |
| C-83, C-84, C-93 | byte-gleich mit B-68, B-69, B-74 |
| D-196 | `slice(-750)` bei genau 750 Eintraegen ergibt dieselbe Liste, wie D-197 |
| A-33 | siehe unten |

**A-33** (`>=` → `>` in `rebalanceFaellig`) unterscheidet sich nur bei einem Balken, der genau um 00:00 New York gestempelt ist. Tagesbalken tragen 09:30. Ausserdem hat die Funktion im App-Pfad keinen Aufrufer; der Takt rechnet mit `faelligkeit()`. Einordnung: praktisch aequivalent.

## Was geaendert ist
- `test-mutation-buecher.js` (neu): die 281 Zusicherungen, inhaltlich unveraendert. Die vier lokalen `pruefe()` sind durch eines ersetzt, das wie `ok()` in test-v6 ausgibt (✅/❌) und mitzaehlt.
  - Die Datei endet mit einer eigenen Abschlusszeile.
  - Bleibt die asynchrone Kette von Teil D haengen, wird das rot und nicht still uebergangen.
  - Eine eigene Datei, weil Teil D `mfdepot.js` asynchron in einer vm-Sandbox mit Attrappen laufen laesst. Als Kindprozess beruehrt das die Module von test-v6 nicht (Muster: `test-messmaschine.js`, Abschnitt 44).
- `test-v6.js`, an zwei Stellen:
  - `ok()` zaehlt die bestandenen Pruefungen mit.
  - Abschnitt 101 startet `test-mutation-buecher.js` und schickt jede Zeile als `MB …` durch `ok()`. Eine Sammelzeile verlangt Exit 0, mindestens 281 gruene Zeilen und die Abschlusszeile.
  - Am Ende steht vor der bisherigen Schlusszeile `N Pruefungen, M bestanden`. Die Schlusszeile selbst ist unveraendert.
- `pruefberichte/mutation-luecken/`:
  - `harness.js` mit einem Nachtrag: fehlt die Abschlusszeile von test-v6 (Absturz), gilt der Mutant als getoetet; Beleg an C-07, D-184 und B-10.
  - die vier Mutantenlisten
  - `vorher-auswertung.md`, `nachher-auswertung.md`, `zweiter-blick.md`
  - `vorher-gesamt.json` und `nachher-gesamt.json`: Urteile des alten Harness ohne Absturzerkennung; die Korrekturen stehen in den Auswertungen.
  - Pfade unter `/tmp/claude-0/` in diesen Dateien bezeichnen Arbeitsdateien des Laufs und sind nicht mit eingecheckt.

## Befunde am Messgeschirr (nur berichtet, nicht behoben)
1. **Wackelnde Zusicherung 84.4** in test-v6 („fehlend, neu und nachgewachsen …“).
   - Ursache: `tools/alpaca-manifest.js` setzt beide `stand`-Zeitstempel mit `new Date().toISOString()` und vergleicht streng mit `>`. Fallen Manifest und Nachschreiben in dieselbe Millisekunde, wird die Zeile rot.
   - Haeufigkeit: in Ruhe 1 von 5 Laeufen in dieser Sitzung, unter Last etwa 20 von 462.
   - Folgen: Sie hat im alten Lauf Kills vorgetaeuscht. Und wenn sie im Basislauf einer Scheibe kippt, gelten fast alle Mutanten dieser Scheibe als getoetet.
   - Sie betrifft auch die CI. Ein Fix gehoert in Test oder Werkzeug, nicht in diesen Zweig.
2. **Lastabhaengige Zeitmessung** „Zeichenzeit fuer 390 Kerzen“: unter Last 229 bis 641 ms gegen eine Grenze von 100 ms. Drei Scheinkills im alten Lauf (B-85, C-31, D-142).
3. **Der Harness sah keine Abstuerze**, solange die Basis schon rot war. Behoben in der Kopie unter `mutation-luecken/`, siehe oben.
4. **Die 34 Scheinkills des alten Berichts**, nach Ursache (Liste in `vorher-auswertung.md`):

| Ursache | Anzahl |
|---|---|
| verfaelschte Basis (18 statt 17 rote Zeilen) | 16 |
| allein Zusicherung 84.4 | 6 |
| allein die neuen Tests, die beim alten Lauf schon im Baum lagen | 8 |
| allein die Zeitmessung | 3 |
| Absturz | 1 |

## Pruefen
`node test-v6.js` (5.725 Pruefungen; hier 7 rot wie auf main wegen fehlender Datendateien), `npx eslint .` (0 Fehler, 1 Warnung wie auf main), `node test-channel.js` (gruen), `node test-mutation-buecher.js` (281/281).
Nachweis wiederholen (dauert lange, 2 bis 3 Scheiben parallel): `node pruefberichte/mutation-luecken/harness.js <liste.json> <aus.json> /tmp/mut-x`.

Keine Release-Notiz: fuer Anwender aendert sich nichts. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
