<!-- PM-STAND
letzter-bericht: 2026-08-25 21:30
gesehener-tag: v8.33.0
-->

# Projektstand

**Diese Tafel schreibt der Projekt-Manager, nicht du.** Sie ist der Kanal zwischen Wilhelm
und den Sitzungen: hier steht, was entschieden ist, was gerade läuft und was als Nächstes
ansteht. Lies sie beim Start; trag dich unter „Läuft gerade" ein, wenn du Dateien belegst.

Wenn du hier etwas änderst, dann nur deine eigene Zeile unter „Läuft gerade".

---

## Stand: 25.08.2026, 21:30

Ausgeliefert ist **v8.33.0**. Arbeitsbaum sauber, nichts Ungepushtes, alle Tests grün
(2074 Zusicherungen), UI-Probe grün (5 Reiter, 16 Pillen).

Der Struktur-Plan vom 25.08. (`studien/struktur-plan-2026-08-25/PLAN.md`) ist damit zu
großen Teilen abgearbeitet:

| Stufe | Inhalt | Stand |
|---|---|---|
| A | Politur, Sammelzeilen, Leerzustände, Kleintexte | fertig |
| B | Navigation gehört der Shell | fertig |
| C | Mittelfrist, Meine Papiere, Marktkarte als Pille | fertig |
| D | Bausteinkasten, Info-Register | fertig |
| E | `depot.js` zerlegen — sieben Blöcke | fertig (9.972 → 6.988 Zeilen) |
| E-Rest | `init()` dritteln, Speicher-Nebeneffekt aus `render()` | **offen** |
| F | Ein Chart-Renderer, Barrierefreiheit, Theme ohne Blitz | **offen** |

Dazu die Zusatzpunkte 3–12 der Kritik: fertig.

---

## Aufträge

*Was freigegeben ist und noch niemand macht. Wer eine Zeile nimmt, trägt sich unter
„Läuft gerade" ein und streicht sie hier.*

- **#76 — die sieben gesammelten Fehler vom 25.08. reparieren** (inkl. #76.2, die zu enge
  fetch-Refspec von origin). Warum: gemeldete Fehler, freigegeben durch die Hausregel
  „Reparatur von Warnsignalen“. Dateien: laut Issue #76, je Fehler einzeln committen.
  *(zugeteilt vom Projekt-Manager, 25.08. 21:45 — noch von niemandem genommen)*

---

## Läuft gerade

*Wer welche Dateien belegt. Trag dich ein, bevor du anfängst; nimm dich raus, wenn du
fertig bist.*

- *(nichts belegt)*

---

## Entschieden

*Entscheidungen von Wilhelm, mit Datum. Eine Entscheidung, die nur in einem Chatverlauf
steht, ist nach zwei Stunden verloren.*

- **25.08.2026** — Stufe C des Struktur-Plans wird gebaut, einschließlich Marktkarte als
  Pille unter „Heute".
- **25.08.2026** — Stufe D Punkt 6 (Erklärtexte ins Info-Register) wird gebaut; das
  Diagnose-Banner kommt auf das Dialog-Muster, **kein** Onboarding.
- **25.08.2026** — Kommerzielles und Mehrbenutzer sind vorerst kein Thema. Das Werkzeug
  ist für Wilhelm allein; Schwerpunkt sind Werkzeuge, Bedienbarkeit, Optik und ein
  vollständiger Marktüberblick.
- **25.08.2026** — Der Projekt-Manager darf Unstrittiges selbst zuteilen; alles, was die
  Handelslogik berührt, neu ist oder Geld kostet, wird vorgelegt.

---

## Wartet auf Wilhelm

*Fragen, an denen Arbeit hängt.*

- *(keine offenen Fragen)*

---

## Was nicht angefasst wird

Gilt unabhängig von dieser Tafel und steht ausführlich in `CLAUDE.md`:

- **Handelslogik** — `intradayScan`, Autopilot- und Edge-Ring, `SETUPS`, `modeParams`,
  Gates, die `window.confirm`-Gatter vor `takt()` und der Demo-Order. Nur mit eigenem,
  abgesprochenem Auftrag.
- **Versionen und Releases** — die vergibt die Release-Wache, keine Sitzung.
- **`telemetrie.json`** wird nie committet. `git clean -xdf` wird nie ausgeführt.
