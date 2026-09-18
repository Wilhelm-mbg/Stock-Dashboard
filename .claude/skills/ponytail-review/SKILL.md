---
name: ponytail-review
description: >
  Code review focused exclusively on over-engineering. Finds what to delete:
  reinvented standard library, unneeded dependencies, speculative abstractions,
  dead flexibility. One line per finding: location, what to cut, what replaces
  it. Use when the user says "review for over-engineering", "what can we
  delete", "is this over-engineered", "simplify review", or invokes
  /ponytail-review. Complements correctness-focused review, this one only
  hunts complexity.
---

> **Regeln dieses Repos (gehen vor):** Kein Push, keine Versionsnummer, kein Release — das macht die Release-Wache. Sperrklinken in `test-v6.js` werden nie gelockert. Studien nur mit Vorregistrierung. Übergabe als Datei mit Tokenverbrauch. Nur eigene Dateien committen. Keine neuen Abhängigkeiten, keine Schlüssel in Dateien. **Alle Ausgaben dieses Skills auf Deutsch.**
> **Angepasst für dieses Repo:** Sperrklinken, Gegenproben (`gegen…(`), Placebo-Läufe und die erklärenden Kommentare zu Fehlerformen sind nie `yagni:` oder `delete:` — sie sind das Messinstrument. Das eingebaute `/simplify` wendet Änderungen an; dieser Skill listet nur.
> Quelle: DietrichGebert/ponytail, `skills/ponytail-review/SKILL.md`, Stand e3ba2aa (14.09.2026), MIT-Lizenz (Copyright (c) 2026 DietrichGebert); übernommen am 18.09.2026.

Review diffs for unnecessary complexity. One line per finding: location, what
to cut, what replaces it. The diff's best outcome is getting shorter.

## Format

`L<line>: <tag> <what>. <replacement>.`, or `<file>:L<line>: ...` for
multi-file diffs. Write the finding text in German.

Tags:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

## Examples

❌ "This EmailValidator class might be more complex than necessary, have you
considered whether all these validation rules are needed at this stage?"

✅ `L12-38: stdlib: 27-Zeilen-Validator. "@" im Text, eine Zeile; die echte Prüfung ist die Bestätigungsmail.`

✅ `L4: native: Datumsbibliothek für einen Aufruf. Intl.DateTimeFormat, 0 Abhängigkeiten.`

✅ `depot.js:L88: yagni: Schnittstelle mit einer Implementierung. Einbetten, bis eine zweite existiert.`

✅ `L52-71: delete: Wiederhol-Hülle um einen idempotenten lokalen Aufruf. Nichts ersetzt sie.`

## Scoring

End with the only metric that matters: `netto: -<N> Zeilen möglich.`

If there is nothing to cut, say `Schon schlank. Fertig.` and stop.

## Boundaries

Scope: over-engineering and complexity only. Correctness bugs, security holes,
and performance are explicitly out of scope. Route them to `/code-review` or
`/security-review`, not this one. A single assertion in `test-v6.js` with its
counter-probe is the ponytail minimum, not bloat, never flag it for deletion.
Does not apply the fixes, only lists them.
