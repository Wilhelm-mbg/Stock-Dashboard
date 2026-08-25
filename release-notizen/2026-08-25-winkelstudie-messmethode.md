# Winkel-Studie: Messmethode korrigiert, Befund steht

**Keine Änderung an der App** — Studien, Vorregistrierungen und ein Testblock. Für die
Release-Notiz relevant, weil ein neuer Test (Block 47) dazugekommen ist und weil der
Befund eine offene Frage aus #33/#36 schließt.

## Kurz

Der erste Winkel-Detektor nannte einen Trend „bestätigt", sobald `Q.kanalUeber`
irgendetwas lieferte. Die Funktion prüft aber nichts — in 20.000 Zufallspfaden gab sie
kein einziges Mal `null`. Der Detektor feuerte auf **52,7 % aller Kerzen**.

Ersatz `winkelbestaetigt.js`: Kanal über 33 Kerzen, geprüft an den 8 folgenden, die er
nie gesehen hat. Feuert auf 6,6 %. Ergebnis: **nicht bestätigt**, Überschuss auf allen
fünf Stufen negativ, die steilste Stufe die schlechteste.

## Was in die Release-Notiz gehört

- Neuer Test **Block 47** in `test-v6.js`: zählt nach, wie oft ein Detektor tatsächlich
  feuert, statt seinen Kommentar zu glauben. Läuft in jedem `npm test`.
- Neue Studiendateien unter `studien/messmaschine/` (zwei Registrierungen, ein Befund,
  ein Protokoll).
- **Issue #80** neu: Kanal-Güte 75/100 für reines Rauschen steht so auch in der
  Oberfläche (`explorer.js`, `depot.js`). Nicht angefasst — Anzeige-Entscheidung.

## Nicht vergessen

Der Testblock kam durch einen fremden `git add -A` schon in Commit `edcc203` mit, unter
fremder Überschrift. Inhaltlich vollständig, nur nicht dort dokumentiert.
