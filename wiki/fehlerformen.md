# Bekannte Fehlerformen

> ## **Die Krankheit des Tages: eine Prüfung, die grün wird, weil sie etwas anderes prüft,
> als man glaubt.**
> An einem einzigen Tag (27.08.2026) trat sie in **neun** Erscheinungsformen auf. **Jede wurde
> von einer Gegenprobe gefunden, keine von Verdacht.**

## Die Formen

| Form | Beispiel |
|---|---|
| **Prüfung prüft etwas anderes** | Ein Test war rot, weil die Maschine schon früher verweigerte — die geprüfte Schranke wurde nie erreicht. Nur `verweigert === true` zu prüfen hätte GRÜN ergeben. **Immer auf den GRUND prüfen.** |
| **Test mit Verfallsdatum** | Wachhund-Tests bauten Kunstkerzen mit festem Datum, fragten aber mit der echten Uhr → ab ~28.08. rot aus dem falschen Grund. Blockierte ein Release. |
| **Tautologische Prüfung** | `git merge-base --is-ancestor <Prüfstand> <Tag>` — ein Prüfstand ist IMMER Vorfahr. Prüfte nichts. |
| **Nullbefund vom toten Werkzeug** | Ein Prüfling, der nie feuert, besteht jeden Leertest. **Deshalb Positivkontrolle.** |
| **„0 gefunden" vs. „nichts zu durchsuchen"** | Von außen ununterscheidbar. Ein leeres Archiv meldet „0 Abmeldungen" statt „kein Archiv". |
| **Behauptung statt Bestätigung** | `kanalUeber` verwarf nie — die „Bestätigung" konnte nicht ablehnen. **Bestätigung gehört außerhalb des Rechenfensters.** |
| **Geteilter Kurs** | Teilt das Signal einen Kurs mit der Zielgröße, entsteht ein Scheineffekt in behaupteter Richtung. |
| **Sperrklinke frisst ihren Kommentar** | Der erklärende Kommentar nennt den verbotenen Bezeichner → grün im Bauplan, rot im Repo. |
| **Zähler mit Schwelle** | `FAKTOR_MIN = 2` schnitt **53 %** der bekannten Skalenfälle weg, bevor die Logik anlief. Er meldete keine Null, sondern eine kleinere Zahl — **die aussah wie ein Ergebnis.** |

## Formen bei der Deutung

- **Regel überlebt ihre Grundlage.** Ein Entscheid war richtig, als er fiel; die Voraussetzung
  entfiel, der Entscheid galt weiter. *Fünf Fälle an einem Tag.*
- **Formel trägt sich selbst weiter.** *„Zwei validierte Kanten"* lief wochenlang durch Code,
  Befunde und Gedächtnis, nachdem die Grundlage weg war. **Deshalb Zitierpflicht im Wiki.**
- **Reichweite geht verloren.** *„Die Rückanpassung funktioniert fast immer"* — gemessen war
  nur der Bereich ab Faktor 2, und genau dort liegen Kapitalmaßnahmen NICHT.
- **Auswahl statt Zufall.** Die 16 Kostenrunden aus einer Minute waren **eine Klickfolge**, kein
  Pech der Marktlage. *Pech wiederholt sich vielleicht nicht, ein Verfahren schon.*
- **Abweichung ohne Nullerwartung deuten.** Ein Modellfehler wurde als Signaleigenschaft
  gedeutet — bis der Placebo dieselbe Abweichung zeigte.
- **Aggregator-Datum ist kein Beleg.** Ein zehn Wochen alter Deal erschien als Montagsmeldung.
  **Gegenprobe ist EDGAR.**

## Werkzeug-eigene Fallen

- **Windows-Pfade in `node -e`:** Backslashes überleben Bash-Quoting nicht — und der Fehler
  bestätigt sich selbst, weil das Kontroll-Lesen denselben Pfad nimmt.
- **`@($null).Count` ist 1 in PowerShell** — ein falscher Feldname meldet nicht „fehlt",
  sondern „genau eins".
- **Bash `date` läuft anders als die Windows-Uhr.** Zeitstempel immer aus `Get-Date` oder
  `git log --format=%ci`.
- **`writeFileSync` überschreibt** — `vereinigen()` ist der einzige Weg, frisch gewinnt.
- **Code im Repo ≠ Code im Paket.** `tools/` wird nicht ausgeliefert; ein Aufruf dort läuft in
  der App **still** ins Leere.
- **Fest verdrahtete Pfade** (`E:/…`) funktionieren nur auf einer Maschine.
