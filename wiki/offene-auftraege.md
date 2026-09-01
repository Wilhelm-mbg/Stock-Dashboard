# Offene Aufträge

*Stand 01.09.2026. Wer einen Auftrag übernimmt, streicht ihn hier und trägt das Ergebnis in die
betroffene Wiki-Seite ein — mit Fundstelle.*

## Läuft / als Nächstes

*Reihenfolge umgestellt 01.09. abends (Wilhelms Entscheid), Begründung in [entscheide.md](entscheide.md).*

| Auftrag | Zustand |
|---|---|
| **Paper-Konto beim Aktienbroker** | **Voraussetzung für alles Weitere — Wilhelms Handlung.** Danach: Kostenmessung dort spiegeln (gleiches Protokollformat wie am Capital-Demo). Erst damit werden die ~0,06 Pp Aktienkosten aus einer Annahme ein Messwert. *Anforderung aus der Wiedervorlage 02.09.:* **nach Umsatzklassen schichten** (5–50 / 50–250 / 250–1.000 Mio $ + ≥1 Mrd als Kontrolle, je ≥10 Runden), Symbole aus der tatsächlichen Signalliste, **eine Übernacht-Runde** Schlussauktion→Folgeeröffnung mitmessen, Positionsgröße protokollieren — sonst misst man wieder nur Mega-Caps, in denen der einzige reale Effekt nicht existiert (`studien/wiedervorlage-2026-09-02/BERICHT.md` §2.3) |
| ~~**Wiedervorlage klein (~150k)**~~ | ✅ **ERLEDIGT 02.09.** — 52 Varianten, **31 gegen CFD (0,1247 Pp) geschlossen**; Depot-Kandidatenliste: **NEIN**, kein Kandidat zwischen den Hürden (ein Grenzfall glockendruck H=2 +0,0604, stirbt liquide). `studien/wiedervorlage-2026-09-02/BERICHT.md`, eingearbeitet in [belegstand.md](belegstand.md) |
| **Momentum, liquide Fassung (Korb ≥ 100 Mio $)** | **Beauftragt 02.09.** Neue Vorregistrierung, gleiche Anordnung wie `studien/vorregistrierung-2026-09-02-momentum-messung/`, nur Korbfilter vorab. Frage: überlebt der Effekt dort, wo man ihn kaufen kann? |
| ~~Momentum-Messung~~ | ~~**VERTAGT** bis Aktienkosten gemessen sind. Auf CFD ist sie rechnerisch ein Nein (63 Tage ≈ 90 Nächte × 0,0247 Pp ≈ 2,2 Pp Finanzierung gegen ~1–1,5 Pp Literatur-Überschuss)~~ ✅ **GEMESSEN 02.09. per Auftrag** (CFD als Urteil, Kassa als Annahme): **„nicht entscheidbar"** — *nicht* „rechnerisch ein Nein": der Punkt (netto −0,83) liegt unter der Hürde, aber die Obergrenze brutto (+2,98) über ihr; **Obergrenze netto +0,605 Pp je Umlauf**, NEIN erst in ~60 Jahren erreichbar. `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md`, eingearbeitet in [belegstand.md](belegstand.md). **Offen geblieben (nicht gemessen, wäre neue Registrierung): liquide Fassung** (Korb nur ≥ 100 Mio $) — 18 % des Korbs liegen unter 5 Mio $ Umsatz |
| ~~Konservativitäts-Audit~~ | **GESTRICHEN**: die zu konservativen Formeln betreffen die Messgenauigkeit, unser Problem ist die Kantengröße — ein besserer Standardfehler macht +0,021 Pp nicht zu 0,10 % |
| ~~News-Sentiment gratis messen~~ | ✅ **ERLEDIGT 01.09.** — NEIN, kein Blindbefund (`studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/ERGEBNIS.md`) |
| Drei ungenutzte Endpunkte einsammeln | Dividenden, unadjustierte Kurse, Splits bis 1987 — gratis erreichbar, ungenutzt |
| `dat[0]`-Falle schließen | Sperre vor jedem Tarifwechsel, betrifft das eingefrorene Universum |

## Aus der Landkarte empfohlen (noch nicht beauftragt)

1. **Weitere Übernacht-Bauformen** — einzige Klasse unter der Wand, aber vier von vier bisher
   NEIN, und der glockendruck-Befund („der Effekt lebt, wo er nicht handelbar ist") ist ein
   harter Vorbehalt
2. ~~**Monats-Momentum nicht überlappend** — das `mfdepot`-Buch lief laut
   `studien/OBERGRENZEN-BEFUND.md` nie durch die volle Prüfung~~ ✅ **erledigt 02.09.**
   (`studien/vorregistrierung-2026-09-02-momentum-messung/`)
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
