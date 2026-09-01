# Kostenstruktur

**Kosten sind klassenspezifisch. Es gibt keine pauschale Zahl.**

## Die Kostenformel

    Gesamtkosten = K (Runde, einmalig) + F (Finanzierung je Nacht) × H (Haltedauer)

*Fundstelle: Nachtrag `384cd10`, eingearbeitet vor jedem Ertragsblick*

**Der Kern:** Längeres Halten verteilt nur die **Runde** über mehr Nächte. Die **Finanzierung
fällt jede Nacht neu an.** Deshalb rettet kein H eine zu kleine Kante.

## Je Gefäß

| Gefäß | Kosten | Quelle |
|---|---|---|
| **CFD gehebelt** | K + **0,0247 Pp je Nacht** (Capital.com 4 % p.a. + Benchmark) | `studien/vorregistrierung-2026-09-01-glockendruck-haltedauer/` |
| CFD ungehebelt (1:1) | nur K — laut Quelle finanzierungsbefreit; **reicht trotzdem nicht** | dieselbe |
| **Kassa-Aktie (echter Broker)** | ≈ **0,06 Pp konstant**, keine Übernachtfinanzierung | dieselbe, nachrichtliche Spalte |
| **Hebelschein** | **0,23 Pp je 3 Stunden** | `studien/signalstudie-2026-08/` — tötete alles Intraday |

## Die gemessene Runde (Stand 01.09.2026)

    20 Aktien-Runden ueber 3 Tage    Median 0,0857 %   p75 0,1103 %   max 0,2525 %

**⚠ ETIKETT: FREIGABESCHWELLE UNERFÜLLT.** *16 der 20 stammen aus EINER Minute, nur EINE
Marktlage (trend-auf) ist erfasst. Verlangt sind ≥20 Runden über ≥2 Tage UND ≥2 Marktlagen.*

**Und die Stichprobe schöpft aus dem falschen Ende:** Messbasis ausnahmslos **≥1,6 Mrd $**
Tagesumsatz (`RC_NOT_ENOUGH_MARGIN` blockte QCOM/TSLA/MU/ABBV, „Kein Markt" MS). Die
glockendruck-Auswahl liegt bei **69 Mio $ Median** — Faktor ~150 darunter.

> **Also: 0,10 % ist für die Milliarden-Klasse passend und für unsere Kandidaten-Universen
> optimistisch.** *Fundstelle: `uebergabe/kosten-angriff` bzw. Commit `6263f1b`.*

## Der Befund, der daraus folgt

Bei glockendruck: Grenzertrag **+0,007 Pp je Zusatznacht** gegen **0,0247 Pp** Finanzierung.
**Kein H bringt die Kante über die Kosten.** Und im liquiden Teil (≥1 Mrd $), wo die Kosten
messbar und niedriger wären, **stirbt der Effekt** (t 0,68).

> ### Die allgemeine Lehre: **Der Effekt lebt, wo er nicht handelbar ist.**
> Das erklärt, warum Übernacht-Anomalien in der Literatur existieren und trotzdem niemand
> davon lebt. **Als Filter in die Machbarkeitsprüfung übernommen.**
