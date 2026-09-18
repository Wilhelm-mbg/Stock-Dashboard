---
name: ponytail-debt
description: >
  Harvest every `ponytail:` comment in the codebase into a debt ledger, so the
  deliberate shortcuts and deferrals ponytail leaves behind get tracked instead
  of rotting into "later means never". Use when the user says "ponytail debt",
  "/ponytail-debt", "what did ponytail defer", "list the shortcuts", "ponytail
  ledger", or "what did we mark to do later". One-shot report, changes nothing.
---

> **Regeln dieses Repos (gehen vor):** Kein Push, keine Versionsnummer, kein Release. Sperrklinken in `test-v6.js` werden nie gelockert. Nur eigene Dateien committen. **Alle Ausgaben dieses Skills auf Deutsch.**
> **Angepasst für dieses Repo:** Die Marke `ponytail:` steht in JavaScript-Kommentaren (`//` und `/* */`); Text dahinter ist deutsch. `node_modules/`, `dist/`, `.git/` und die Kursarchive werden übersprungen. Das Register wird nur auf Wunsch als Datei abgelegt — dann unter `wiki/ponytail-schulden.md`, nie in der Wurzel.
> Quelle: DietrichGebert/ponytail, `skills/ponytail-debt/SKILL.md`, Stand e3ba2aa (14.09.2026), MIT-Lizenz (Copyright (c) 2026 DietrichGebert); übernommen am 18.09.2026.

Every deliberate ponytail shortcut is marked with a `ponytail:` comment naming
its ceiling and upgrade path. This collects them into one ledger so a deferral
can't quietly become permanent.

## Scan

Grep the repo for comment markers, skipping `node_modules`, `.git`, `dist`, and build
output:

`grep -rnE '(//|/\*|#) ?ponytail:' . --include=*.js --include=*.mjs --include=*.html --include=*.cmd --include=*.md`

Each hit is one ledger row. The comment prefix keeps prose that merely mentions
the convention out of the ledger. (`CLAUDE.md` and `wiki/ponytail-probe.md`
describe the convention; hits there are not debt.)

## Output

One row per marker, grouped by file, in German:

`<datei>:<zeile>, <was vereinfacht wurde>. Grenze: <die genannte Grenze>. Ausbau: <der Auslöser zum Wiedervorlegen>.`

The convention is `ponytail: <Grenze>, <Ausbau wenn …>`, so pull the ceiling
and the trigger straight from the comment. Want an owner per row too? add
`git blame -L<line>,<line>`.

Flag the rot risk: any `ponytail:` comment that names no upgrade path or
trigger gets an `ohne-Auslöser` tag, those are the ones that silently rot.

End with `<N> Marken, <M> ohne Auslöser.` Nothing found: `Keine ponytail:-Schulden. Register leer.`

## Boundaries

Reads and reports only, changes nothing. To persist it, ask and it writes the
ledger to `wiki/ponytail-schulden.md`. One-shot.
