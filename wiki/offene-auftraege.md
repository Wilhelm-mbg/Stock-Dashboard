# Offene Aufträge

*Stand 01.09.2026. Wer einen Auftrag übernimmt, streicht ihn hier und trägt das Ergebnis in die
betroffene Wiki-Seite ein — mit Fundstelle.*

## Läuft / als Nächstes

*Reihenfolge umgestellt 01.09. abends (Wilhelms Entscheid), Begründung in [entscheide.md](entscheide.md).*

| Auftrag | Zustand |
|---|---|
| **Paper-Konto beim Aktienbroker** | **Voraussetzung für alles Weitere — Wilhelms Handlung.** Danach: Kostenmessung dort spiegeln (gleiches Protokollformat wie am Capital-Demo). Erst damit werden die ~0,06 Pp Aktienkosten aus einer Annahme ein Messwert |
| **Wiedervorlage klein (~150k)** | Obergrenzen der restlichen ~20 Messungen (`tools/obergrenzen-bericht.js`) + Depot-Kandidatenliste: welche real-aber-kleinen Kanten lägen über Aktien- aber unter CFD-Kosten? Ergebnis nach `studien/wiedervorlage-<datum>/` |
| Momentum-Messung | **VERTAGT** bis Aktienkosten gemessen sind. Auf CFD ist sie rechnerisch ein Nein (63 Tage ≈ 90 Nächte × 0,0247 Pp ≈ 2,2 Pp Finanzierung gegen ~1–1,5 Pp Literatur-Überschuss) — siehe [kosten.md](kosten.md) |
| ~~Konservativitäts-Audit~~ | **GESTRICHEN**: die zu konservativen Formeln betreffen die Messgenauigkeit, unser Problem ist die Kantengröße — ein besserer Standardfehler macht +0,021 Pp nicht zu 0,10 % |
| ~~News-Sentiment gratis messen~~ | ✅ **ERLEDIGT 01.09.** — NEIN, kein Blindbefund (`studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md`) |
| Drei ungenutzte Endpunkte einsammeln | Dividenden, unadjustierte Kurse, Splits bis 1987 — gratis erreichbar, ungenutzt |
| `dat[0]`-Falle schließen | Sperre vor jedem Tarifwechsel, betrifft das eingefrorene Universum |

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
