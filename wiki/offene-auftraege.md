# Offene Aufträge

*Stand 01.09.2026. Wer einen Auftrag übernimmt, streicht ihn hier und trägt das Ergebnis in die
betroffene Wiki-Seite ein — mit Fundstelle.*

## Läuft / als Nächstes

| Auftrag | Zustand |
|---|---|
| ~~Gratis-Prüfung der Datenschnittstelle~~ | ✅ **ERLEDIGT 01.09.** — `studien/datentarif-2026-09-01/GRATIS-PRUEFUNG.md`, Commit `04298ee`. Befund: der Kaufgrund ist entfallen, siehe [datenquellen.md](datenquellen.md) |
| **News-Sentiment gratis messen** | **Der nächste Auftrag.** Die Klasse ist auf der Basisstufe messbar (Faktor 8,7). Universum muss aus **Großwerten** bestehen. Vorregistrierung nötig; die alte von 31.08. gilt für einen anderen Korpus und wird nicht umgedeutet |
| Drei ungenutzte Endpunkte einsammeln | Dividenden, unadjustierte Kurse, Splits bis 1987 — alle gratis erreichbar, keiner wird heute genutzt |
| `dat[0]`-Falle schließen | Sperre vor jedem künftigen Tarifwechsel, betrifft das eingefrorene Universum. *Fundstelle: `GRATIS-PRUEFUNG.md`* |

## Aus der Landkarte empfohlen (noch nicht beauftragt)

1. **Weitere Übernacht-Bauformen** — einzige Klasse unter der Wand, aber vier von vier bisher
   NEIN, und der glockendruck-Befund („der Effekt lebt, wo er nicht handelbar ist") ist ein
   harter Vorbehalt
2. **Monats-Momentum nicht überlappend** — das `mfdepot`-Buch lief laut
   `studien/OBERGRENZEN-BEFUND.md` nie durch die volle Prüfung
3. **Insider-Käufe (Form 4)** — EDGAR-Infrastruktur liegt fertig im Haus, kostet nichts

## Bekannte Baustellen (klein, unbeauftragt)

- **`AUMN` und `BURU`** — von der In-Regel-Prüfung gesperrt (Quelle rundete Sub-Cent-Kurse neu).
  Stehen unverändert, `stand` noch 2026-08-25. Von Hand klären, falls ihr Eröffnungskurs
  gebraucht wird. *Fundstelle: `uebergabe/universum-herkunft-2026-08-31.md`*
- **`.release-bau-log.txt`** im Wurzelverzeichnis — Diagnose-Rückstand, nicht committen, kann
  gelöscht werden.
- **Sicherung `massive-sicherung-2026-08-27/`** — Gegenprüfung ist gefahren, darf nach
  Wilhelms Entscheid weg.
- **Retry-Härtung in `tools/release.js`** — die Netz-Gegenprobe von `--hoch` bricht bei
  GitHub-Verbindungsabbruch ab, nachdem alles Wesentliche schon durch ist. Kein Schaden,
  Ärgernis. *Vorschlag der Release-Wache, 31.08.*
- **Out-of-Sample-Pflicht** — steht in keiner Sperrklinke, siehe
  [messmethodik.md](messmethodik.md).
- **Renderer-Zusammenschluss `drawBig`/`chart.js`** — bewusst offen (chart.js kann keine
  Kerzen). *Fundstelle: `uebergabe/oberflaeche-2026-09-01.md`*
