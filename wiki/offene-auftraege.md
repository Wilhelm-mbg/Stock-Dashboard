# Offene Aufträge

*Stand 01.09.2026. Wer einen Auftrag übernimmt, streicht ihn hier und trägt das Ergebnis in die
betroffene Wiki-Seite ein — mit Fundstelle.*

## Läuft / als Nächstes

*Reihenfolge umgestellt 01.09. abends (Wilhelms Entscheid), Begründung in [entscheide.md](entscheide.md).*

| Auftrag | Zustand |
|---|---|
| ~~**Momentum-Buch auf liquiden Korb**~~ | ✅ **ERLEDIGT 02.09.** — Buch rechnet exakt die gemessene Konfiguration (`liquide.js` + `momentum.js`, gelesen von `mfhandel.js`); Sperrklinke test-v6 Block 34 (Zahlen gegen `lauf-*.json`, Äquivalenz zum Studienwerkzeug auf Kunst- und Archivdaten, Gegenprobe 50 Mio $ → rot); Umstellung als Handlung im Journal, greift bei der nächsten regulären Umschichtung; Antwort-Seite „lebt (In-Sample, am Rand) – Vorwärtstest seit …" aus Studienregister + Buch. Reine Simulation. `uebergabe/momentum-buch-liquide-2026-09-02.md`, Release folgt durch die Wache |
| ~~**Aktien-Kostenmessung am Alpaca-Paper-Konto**~~ | ✅ **GEBAUT 02.09. (abends)** — `alpaca.js` neben `capital.js`, `kosten.js` führt beide Gefäße getrennt (`gefaess`), Umsatzklassen aus einer Stelle, Teilfüllung verwirft, Übernacht-Runde cls→opg, Automat im Capital-Takt; 2.757 Zusicherungen grün, Gegenprobe je Klinke rot, UI-Probe grün. **Offen: Wilhelms Klick** — Schlüssel in App-Einstellungen → „Alpaca-Paper" → „Verbindung testen" → „Messung aktivieren" + Speichern. Ergebnis in [kosten.md](kosten.md) (Abschnitt „Aktien-Gefäß Alpaca"), `uebergabe/alpaca-kostenmessung-2026-09-02.md`; Release durch die Wache. *War:* ~~**Entschieden 02.09. (Wilhelm): Alpaca.** Paper-Konto nur mit E-Mail, REST-Schnittstelle direkt aus der App, Füllung am NBBO → die **Spanne** wird gemessen (die unbekannte Größe; Provision ist ein Tarif, den man nachliest). **Zwei Schritte:** (1) Wilhelm legt das Paper-Konto an und trägt Schlüssel-ID + Geheimnis in die App-Einstellungen ein — nie in Code, Log, Commit; (2) Chat baut den Alpaca-Adapter neben `capital.js` und lässt `kosten.js` ihn als zweites Gefäß mit demselben Protokollformat führen. **Anforderungen aus der Wiedervorlage 02.09.:** nach Umsatzklassen schichten (5–50 / 50–250 / 250–1.000 Mio $ + ≥ 1 Mrd als Kontrolle, je ≥ 10 Runden), Symbole aus der tatsächlichen Signalliste, **eine Übernacht-Runde** Schlussauktion→Folgeeröffnung, Positionsgröße protokollieren (`studien/wiedervorlage-2026-09-02/BERICHT.md` §2.3). **Bekannte Grenzen der Simulation:** kein Marktimpact, keine Warteschlange, zufällige Teilfüllungen (~10 % der Orders, als Runde verwerfen). Recherche: [datenquellen.md](datenquellen.md) → Broker-Schnittstellen~~ |
| ~~**Wiedervorlage klein (~150k)**~~ | ✅ **ERLEDIGT 02.09.** — 52 Varianten, **31 gegen CFD (0,1247 Pp) geschlossen**; Depot-Kandidatenliste: **NEIN**, kein Kandidat zwischen den Hürden (ein Grenzfall glockendruck H=2 +0,0604, stirbt liquide). `studien/wiedervorlage-2026-09-02/BERICHT.md`, eingearbeitet in [belegstand.md](belegstand.md) |
| ~~**Momentum, liquide Fassung (Korb ≥ 100 Mio $)**~~ | ✅ **GEMESSEN 02.09.** — **„LEBT" nach registrierter Regel, In-Sample und am Rand:** brutto +1,835 Pp je Umlauf (se 0,911, t 2,02, 79 Perioden), Band [+0,050, +3,620]; gepaart gegen breit +0,29 (t 0,69) — **nicht schwächer als breit**, die glockendruck-Lehre gilt für Momentum nicht. Bei Familienschwelle 2,638 schließt das Band null ein, 18 von 63 Lagen erfüllen die Regel. Kassa (Annahme) t 1,95, kein Urteil. `studien/vorregistrierung-2026-09-02-momentum-liquide/ERGEBNIS.md`, eingearbeitet in [belegstand.md](belegstand.md) |
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
