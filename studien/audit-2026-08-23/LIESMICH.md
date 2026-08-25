# Audit vom 23.08.2026 — Archiv

`AUDIT-2026-08-23.md` lag bis zum 25.08.2026 im Wurzelverzeichnis. Dort sah es aus wie
ein Nachschlagewerk und war keines mehr: Seine Zahlen beschreiben ausdrücklich den
**Ausgangszustand vom 23.08.** und passen auf den heutigen Code nirgends mehr — `depot.js`
war damals 8.639 Zeilen lang, die App hatte fünf Reiter, `index.html` trug null
`aria-`/`role`-Attribute. Heute sind es sechs Reiter und 28 `role=`-Attribute.

Als **Beleg** für die 92 Befunde ist das Dokument weiterhin wertvoll. Deshalb verschoben
und nicht gelöscht — mit `git mv`, damit die sechs Commits Historie (`bbe1792` bis
`cfe7406`) an der Datei hängen bleiben.

## Wozu die Nummern noch gebraucht werden

Tests und Quelltext verweisen mit Kürzeln auf die Nummerierung **in diesem Dokument**:

- `test-v6.js` — „Audit 22", „Audit 25/26/27", „Stufe 4 des Audits" an neun Stellen
- `chart.js:4`, `messfenster.js:4` — beide entstanden aus Punkt 22 (`depot.js` schneiden)
- `depot.js` — zwei Verweise auf Befunde der Stufe 3

Wer eines dieser Kürzel auflösen will, findet die Langfassung in
`AUDIT-2026-08-23.md`, Abschnitt „Umsetzungsstand" (Zeile 8–28) und den Stufen 1–4.

## Was daraus noch offen ist

Zwei Punkte stehen laut der eigenen Umsetzungsstand-Tabelle weiterhin offen. Sie sind in
`CLAUDE.md` als lebende Notiz eingetragen, damit sie mit dem Umzug nicht aus dem Blick
fallen:

| Punkt | Stand |
|---|---|
| **21 — Messung an den Live-Pfad angleichen** (gleicher Vorlauf, gleiches Instrument) | offen, gehört zur Handelslogik |
| **Stufe 4 — Update-Signatur** | ohne Zertifikat nicht lösbar; Zustand offengelegt in App, README und Bauplan, Signieren als Handgriff vorbereitet (`CSC_LINK`) |

Alles Übrige ist erledigt: Stufe 1 in `fa53f6c`, Stufe 2 in PR #61 (`04dd5ae`), die
Punkte 22–28 in `984bb2a`, `a3a21fa`, `a743d87`, `b701a54`, `9076fba`, `aae844a` und
`01cc415`, Stufe 4 in `e80f66d`.

Ebenfalls weiterhin gültig: **Teil 6 — „Was nicht angefasst werden sollte"** (Zeile
703–716 im Bericht). Die dort genannten Stellen sind als vorbildlich eingestuft, nicht
als unfertig.
