# Ergebnis — Kleine Split-Faktoren: kein Anpassungsfehler belegt; die Klasse zerfällt in messbar und strukturell blind

**Gemessen:** 27.08.2026 ~21:3x, Rolle Berechnungen. Vorregistrierung + Machbarkeit
vorab (Commit 2ef4100). **Kein Kanten-Urteil, nichts am Archiv geändert, die
Faktor-2-Schwelle des §2-Joins bleibt unverändert.**

## Urteil

**Nicht belegt: F = 0 bei einem Nullwert von 0,13 (Schwelle 1,20).** Von 25
Kandidaten-Ereignissen (Faktor zwischen 0,5 und 2, |f−1| ≥ 1 %) passierten 20 das
Beurteilbarkeits-Gate; keines davon zeigt am Ereignisdatum ±1 Handelstag einen
Sprung des passenden Faktors. Ein Fall ist F? (LEN 22.04.2003: f = 0,9091, Sprung
0,9368 — Datum trifft, Faktor um 3 Pp daneben). **Die Blindstelle des §2-Joins ist
damit vermessen und leer: In dem Bereich, den er nicht sieht, verbergen sich in
diesem Bestand keine unangepassten Ereignisse.**

## Der eigentliche Fund: die Grenze liegt am Faktor, nicht an der Datenmenge

Zufalls-Trefferrate je Faktor (61 Reihen, 372.341 Tagesübergänge, absolute
Toleranz ±0,002):

| Ereignisgröße | Beispiel-Faktor | Zufallsrate/Tag | beurteilbar? |
|---|---|---|---|
| 33 % (3:2-Split) | 0,667 | 0,001 % | ja, messerscharf |
| 9 % | 0,909 | 0,18 % | ja |
| 7,7 % | 1,077 | 0,34 % | ja |
| 3 % | 1,031 | 3,2 % | grenzwertig |
| **1,2 %** (Aktiendividende) | **0,988** | **11,7 %** | **nein — strukturell blind** |

**Fünf Ereignisse (LYG, LEN, SCCO ×2, QGEN) fallen unter das Gate und bekommen
kein Urteil**, sondern »strukturell nicht entscheidbar«: Ein 1-%-Ereignis in einer
Reihe, die täglich um 2 % schwankt, hinterlässt keine unterscheidbare Signatur.
**Mehr Daten helfen dagegen nicht** — anders als bei der Auflösungswand ist das
keine Frage der Stichprobengröße, sondern der Trennschärfe des Merkmals selbst.
Die vom Analytiker gemeldeten SCCO-Quartals-Aktiendividenden (~0,99) liegen
vollständig in diesem blinden Bereich.

## Zwei Werkzeugfehler, beide vor dem Urteil gefunden

1. **Die relative Toleranz des großen Joins ist bei kleinen Faktoren wertlos.**
   |q/f−1| ≤ 0,10 heißt bei f ≈ 1: »Tagesrendite zwischen −7 % und +13 %« — trifft
   auf **99 % aller Tage** zu. Deshalb wurde vorab auf absolute Toleranz umgestellt
   (in der Registrierung, vor dem Lauf).
2. **Der erste Lauf meldete »KLASSE BELEGT« — und das war ein Artefakt.** Der eine
   F-Treffer (NWG 30.08.2022) kam über eine **inverse** Faktor-Prüfung, die mein
   Code aus dem großen Join übernommen hatte, **die die Registrierung aber nicht
   vorsieht** (dort steht `|q − f| ≤ 0,002`, ohne Alternative). Der reale Sprung war
   **−7,2 %**, während ein fehlender 14:13-Anpassungssprung **+7,7 %** sein müsste —
   eine gewöhnliche Bankaktien-Bewegung, in der falschen Richtung als Beleg gezählt.
   Nach Rückführung des Codes auf den registrierten Wortlaut: F = 0.
   *Im großen Join ist die inverse Prüfung korrekt (dort kippen Konventionen
   zwischen Quellen und die Faktoren 4/8/30 machen Zufallstreffer unmöglich); bei
   Faktoren nahe 1 verdoppelt sie die Zufallsfläche. Dieselbe Zeile Code, zwei
   verschiedene Bedeutungen.*

## Grenzen

Kandidatenmenge = 25 Ereignisse aus dem Analytiker-Sweep (257 Reihen); für Reihen
außerhalb des Sweeps ist nichts gemessen. CBSH selbst war nicht im Sweep-Bestand —
seine 22 Einträge liegen der Größe nach (~1,05) im strukturell blinden Bereich und
wären auch mit Daten nicht entscheidbar. Die Zufallsraten stammen aus einer
Universums-Stichprobe; für einzelne volatile Reihen liegen sie höher (der
NWG-Fall zeigt es).

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
