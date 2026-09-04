---
tags: [steuerung]
---
# Wiki — Index

**Das hier ist die ABGELEITETE Ebene. Sie ist nie autoritativ.**
Jede Aussage trägt ihre Fundstelle. Im Streitfall gilt die Fundstelle, nicht diese Seite.

**Lies diese Seiten statt `PROJEKTSTAND.md`** — die Tafel ist ein chronologisches Log
(638 KB / ~9.959 Zeilen) und als Nachschlagewerk unbrauchbar geworden. Sie bleibt als
**Archiv** bestehen und wird nicht gelöscht.

## Vier Gruppen (Farben im Graphen)

| Gruppe | Farbe | Frage | Seiten |
|---|---|---|---|
| **Steuerung** | rot | Was steht an, was ist entschieden, wie arbeiten wir? | [offene-auftraege.md](offene-auftraege.md) · [erledigt.md](erledigt.md) · [entscheide.md](entscheide.md) · [betrieb.md](betrieb.md) · [log.md](log.md) · dieser Index |
| **Befund** | grün | Was wissen wir, gemessen? | [belegstand.md](belegstand.md) · [kosten.md](kosten.md) · [ueberlebensverzerrung.md](ueberlebensverzerrung.md) · [aufloesungswand.md](aufloesungswand.md) |
| **Lehre** | gelb | Wie messen wir, und woran sind wir gescheitert? | [messmethodik.md](messmethodik.md) · [fehlerformen.md](fehlerformen.md) |
| **Bauplan** | blau | Wie sind Daten und App gebaut, wohin gehen sie? | [datenquellen.md](datenquellen.md) · [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) · [oberflaeche.md](oberflaeche.md) · [aufnahmen/struktur.md](aufnahmen/struktur.md) |

Die Gruppe steht als `tags:` im Kopf jeder Seite; die Farbgruppen des Obsidian-Graphen fragen
`tag:#steuerung` usw. ab (Einstellung in `.obsidian/graph.json`, nicht im Repo).

## Seiten

| Seite | Beantwortet |
|---|---|
| [belegstand.md](belegstand.md) | Was ist belegt, was widerlegt, was offen? **Zuerst lesen.** |
| [offene-auftraege.md](offene-auftraege.md) | Was gerade ansteht, in Reihenfolge |
| [entscheide.md](entscheide.md) | Wilhelms Entscheide, die weitergelten — und was noch offen ist |
| [erledigt.md](erledigt.md) | Register abgeschlossener Aufträge mit Fundstelle |
| [betrieb.md](betrieb.md) | Orte, Rollen, Aufträge und Budgets, Release, lange Läufe |
| [aufloesungswand.md](aufloesungswand.md) | Warum die meisten Fragen mit unseren Daten unbeantwortbar sind |
| [kosten.md](kosten.md) | Was Handeln kostet — je Gefäß, Umsatzklasse und Haltedauer |
| [ueberlebensverzerrung.md](ueberlebensverzerrung.md) | Wie sehr unser Archiv lügt, und in welche Richtung |
| [datenquellen.md](datenquellen.md) | Welche Daten wir haben, welche Fenster, welcher Anbieter, welches Format |
| [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) | Die zwei Kursarchive — Karte, Risiken, Stufen Z0–Z4, Vermessungen |
| [oberflaeche.md](oberflaeche.md) | Wie die App aussehen soll — Ist, Befund, Zielbild „vier Bildschirme", Stufen |
| [aufnahmen/struktur.md](aufnahmen/struktur.md) | Wie die App JETZT aussieht — Baum aller Reiter, Pillen, Blöcke mit Aufnahmen (je Reiter ein Ordner) |
| [messmethodik.md](messmethodik.md) | Wie wir messen, damit das Ergebnis etwas wert ist |
| [fehlerformen.md](fehlerformen.md) | Die Fehler, die uns wiederholt passiert sind |
| [log.md](log.md) | Wann dieses Wiki was geändert hat |

## Regeln für jeden, der hier schreibt

1. **Zitierpflicht.** Jede Aussage nennt ihre Rohquelle (`studien/…`, Commit, `uebergabe/…`).
   Ohne Fundstelle keine Aussage. Fehlt die Fundstelle, steht ausdrücklich
   *„Gedächtnisprotokoll, keine Fundstelle im Repo"* daneben.
2. **Urteile werden WÖRTLICH übernommen, nie umformuliert.** „nicht entscheidbar" ist weder
   „vielversprechend" noch „tot".
3. **Aktualisieren statt anhängen.** Eine Seite wird umgeschrieben; die Chronologie steht in
   `log.md` und im Archiv. Erledigte Aufträge wandern nach `erledigt.md`, entschiedene Fragen
   aus „Offen" in den passenden Abschnitt von `entscheide.md`.
4. **Lint:** Wer eine Seite anfasst, prüft sie gegen ihre Fundstellen. Widersprüche werden
   gemeldet, nicht geglättet.
5. **Jede Seite trägt ihre Gruppe** als `tags:` im Kopf (steuerung · befund · lehre · bauplan).
