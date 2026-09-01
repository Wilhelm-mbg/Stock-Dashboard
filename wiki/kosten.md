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

## Monatshaltedauer, ausgefüllt am Momentum-Korb (gemessen 02.09.2026)

63 Handelstage sind **91,5 Kalendernächte** (88–97): F·H = 0,0247 × 91,5 = **2,26 Pp je
Umlauf** — **die Finanzierung allein übersteigt die gesamte gemessene Kante (+1,54 Pp)**.
K (0,110) ist daneben Nebensache: 54 % des Korbs werden aus der Vorperiode gehalten, effektiv
0,05 Pp. Und K gilt für Mega-Caps — vom Momentum-Korb liegen **2,6 % über 1 Mrd $**, 24,5 %
über 100 Mio $, **18,2 % unter 5 Mio $** Tagesumsatz. Für die Kassa-Annahme (0,06,
10.000-$-Positionen in liquiden Werten) gilt dasselbe: für ein Fünftel des Korbs sicher nicht.
*Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md`*

## Der Befund, der daraus folgt

Bei glockendruck: Grenzertrag **+0,007 Pp je Zusatznacht** gegen **0,0247 Pp** Finanzierung.
**Kein H bringt die Kante über die Kosten.** Und im liquiden Teil (≥1 Mrd $), wo die Kosten
messbar und niedriger wären, **stirbt der Effekt** (t 0,68).

> ### Die ~~allgemeine~~ Lehre **der Übernacht-Familie**: **Der Effekt lebt, wo er nicht handelbar ist.**
> Das erklärt, warum Übernacht-Anomalien in der Literatur existieren und trotzdem niemand
> davon lebt. **Als Filter in die Machbarkeitsprüfung übernommen.**
>
> **Eingegrenzt 02.09.2026:** Für **Monats-Momentum gilt sie nicht.** Der Korb nur aus Werten
> ≥ 100 Mio $ Tagesumsatz (Punkt-in-Zeit) trägt **+1,835 Pp je Umlauf** gegen +1,541 breit,
> gepaart +0,29 (t 0,69) — nicht schwächer, eher stärker. Die Lehre ist dort gemessen, wo
> sie steht (glockendruck, ≥ 1 Mrd $, t 0,68), und darf nicht pauschal auf Monatshaltedauer
> übertragen werden. *Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-liquide/ERGEBNIS.md`*
