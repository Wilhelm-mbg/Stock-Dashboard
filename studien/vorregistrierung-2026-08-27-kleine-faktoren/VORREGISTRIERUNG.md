# Vorregistrierung — Kleine Split-Faktoren: die benannte Blindstelle des §2-Joins

**Stand:** 27.08.2026 ~15:2x, vor jedem Urteils-Rechenschritt. **Rolle:** Berechnungen.
**Auftrag:** PM (»die CBSH-Blindstelle — deine eigene benannte Reichweiten-Grenze«).
Der §2-Join sieht nur Sprünge mit Faktor ≥ 2 bzw. ≤ 0,5; Aktiendividenden (Massive
führt sie als 1:1,0x-Splits) und mittlere Splits (3:2 = 0,667) fallen durch.

## 0. Machbarkeit ZUERST (Brille 9) — und sie fällt gespalten aus

Gemessen auf 61 Reihen / 310.007 Handelstagen (Stichprobe jede 48. Reihe des
1d-Archivs), **vor jeder Ereignis-Zuordnung**:

| Prüfform | f = 0,667 | f = 0,909 | f = 1,077 | f = 1,031 | f = 0,988 |
|---|---|---|---|---|---|
| **relative Toleranz ±10 %** (Join-Form) | 0,03 % | 99,8 % | 99,7 % | 99,3 % | 99,2 % |
| absolute Toleranz ±0,002 | 0,001 % | 0,18 % | 0,34 % | 3,2 % | 11,7 % |

**Zwei Befunde, beide vor dem Lauf:**

1. **Die relative Toleranz ist bei Faktoren nahe 1 ein Werkzeugfehler.** |q/f−1| ≤ 0,10
   heißt bei f ≈ 1: »die Tagesrendite liegt zwischen −7 % und +13 %« — das trifft auf
   99 % aller Tage zu. Eine Prüfung, die fast immer wahr ist, prüft nichts
   (dieselbe Form wie »Bestätigung war eine Behauptung«). **Für kleine Faktoren wird
   deshalb die ABSOLUTE Toleranz |q − f| ≤ 0,002 verwendet** — hiermit fixiert.
2. **Messbarkeit hängt am einzelnen Faktor, nicht an der Datenmenge.** Je näher an 1,
   desto dichter das Rauschen: f = 0,988 (1,2-%-Ereignis) ist mit 11,7 % Zufallsrate
   strukturell **nicht** entscheidbar; f = 0,909 (9 %) mit 0,18 % dagegen scharf.
   Mehr Daten helfen dagegen nicht — ein 1-%-Ereignis in einer Reihe, die täglich um
   2 % schwankt, hinterlässt keine identifizierbare Signatur.

## 1. Beurteilbarkeits-Gate (vorab, je Ereignis)

Ein Ereignis wird **nur beurteilt**, wenn seine Zufalls-Trefferwahrscheinlichkeit im
±1-Handelstag-Fenster p = 1 − (1 − rate(f))³ **< 5 %** ist (rate(f) aus derselben
Stichprobe, absolute Toleranz). Alle anderen bekommen ausdrücklich
**»strukturell nicht entscheidbar (Faktor zu nah an 1)«** — kein Urteil, keine
Vermutung. Die Quote der so ausgeschlossenen Ereignisse wird berichtet.

## 2. Anordnung

- **Kandidaten:** alle Split-Ereignisse mit |f − 1| ≥ 0,01 und Faktor zwischen 0,5
  und 2 (also unterhalb der Join-Schwelle) aus dem Analytiker-Sweep
  (`studien/analytiker/2026-08-27/einzelspruenge/`, 257 Dateien).
- **Sprünge:** alle Tagesübergänge der zugehörigen 1d-Reihe.
- **Klassen wie im Join** (Nachtrag-4-Semantik): **F** = Datum ±1 HT UND
  |q − f| ≤ 0,002 → Anpassungsfehler der 1d-Seite; **F?** = Datum trifft, Faktor
  nicht; **U** = kein Bezug. F-ECHO entfällt (bei kleinen Faktoren wäre es reines
  Rauschen — die Echo-Prüfung braucht einen Faktor, den der Markt nicht täglich
  erzeugt).
- **Nullwert:** Σ p_i über die beurteilten Ereignisse (analytisch, aus der gemessenen
  Rate je Faktor). **Kein Ergebnis ohne diese Zahl daneben.**

## 3. Entscheidungsregeln

- **Klasse belegt**, wenn beobachtete F-Zahl den Nullwert deutlich übersteigt
  (≥ Nullwert + 3·√Nullwert, Poisson-Näherung, hiermit fixiert).
- **nicht belegt**, wenn F-Zahl im Nullwert-Bereich liegt.
- **strukturell nicht entscheidbar** für jedes Ereignis unterhalb des Gates —
  und wenn ALLE Ereignisse darunter fallen, ist das das Ergebnis des Laufs.

## 4. Sperrliste

Keine Änderung am §2-Join oder seiner Tabelle (eigener Lauf, eigene Registrierung) ·
keine Archiv-Reparatur · kein Urteil über Ereignisse ohne Massive-Beleg · Ergebnis
nur in diesen Ordner · **die Faktor-2-Schwelle des Joins bleibt, wie sie war** (sie
war für ihre Faktoren korrekt; diese Messung ergänzt sie, sie korrigiert sie nicht).

*Gesehene Zahlen: Sweep-Zählung (204 Splits, 33 mit |f−1| < 0,5, davon 19 im Band
0,85–1,15, 13 bei ≈ 0,667), die Machbarkeits-Raten oben. Keine Datums-Zuordnung,
keine F-Zahl.*

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
