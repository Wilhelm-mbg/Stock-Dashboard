# Szenario d2 - ein gehaltener, im Ziel bleibender Wert hat seine letzte Kerze am Mittwoch 18.11.

Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), 1440 Takte zu 5 Minuten von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55, 611 Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.

## Ergebnis in einer Zeile

**Keine Abweichung vom Soll** (REGEL.md §1.2-§1.5, Teil C).

## Umschichtung

- Eintraege `mfrebal-*` im tuneLog: **1** (Soll 1), Zeit laut App-Uhr 2026-11-23 09:35 (automatik)
- Ausfuehrungstag / Stichtag (Soll aus der Welt): 2026-11-23 / 2026-11-20; Journalzeile nennt {"ausfuehrungstag":"23.11.2026","stichtag":"20.11.2026"}
- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): 2026-11-23 09:35 (Uhr 09:35) x18
- Kurse der Trades: 18x Eroeffnung des Tages 2026-11-23
- Trades je Wert: 18 Werte, hoechstens 1 Trade(s) je Wert
- Korb/Ziel: Soll 189 von 193 zulaessig, Zielzahl 19; App (korbVerlauf) {"t":1795444500000,"zulaessig":189,"geprueft":191,"ziel":19}
- Bargeld vorher 0.1 | Soll nach Handel 0 (+ Ausschuettungen Soll 0) | App am Ende 0
- Positionen: vorher 19, App am Ende 19, Soll 19
- Erhaltung (Eroeffnungskurse): {"wertSollVorOpen":116249.16,"wertSollNachOpen":116030.67,"kostenSoll":218.49,"kostenAusTrades":218.49,"notional":109246.99}
- Tagespunkte (Schluessel tag, Wert, Soll): 2026-11-20 116132.05 (Soll 116132.05, Diff 0, geschrieben 2026-11-20 16:20); 2026-11-23 116170.68 (Soll 116170.68, Diff 0, geschrieben 2026-11-23 16:20); 2026-11-24 116461.17 (Soll 116461.17, Diff 0, geschrieben 2026-11-24 16:20)

## Pruefungen, die stimmen

- genau ein Eintrag mfrebal-* im tuneLog (um 2026-11-23 09:35 Uhrzeit der App-Uhr)
- kein Wert mit mehr als einem Trade (18 Werte gehandelt, 18 Trades)
- alle 18 Trades zur Eroeffnung des Ausfuehrungstags 2026-11-23 (nie Schluss, nie laufender Kurs, nie spaeterer Kurs)
- Journalzeile: Stichtag 20.11.2026 (Soll 20.11.2026)
- Positionen und Stueckzahlen am Ende (19) gleich dem Soll (MFHandel-Funktionen und von Hand)
- Bargeld am Ende 0 = Soll 0
- keine verlorene Position (9 verkaufte/ausgebuchte, alle mit Trade belegt)
- Bargeld in keinem der 1440 Takte negativ
- keine Statuszeile mit "Fehler"
- Karte ohne Fehler/NaN/undefined
- Erhaltung: Wert zu Eroeffnungskursen vor 116249.16 - Kosten 218.49 = nach 116030.67; Kosten der App-Trades 218.49
- ein Tagespunkt je abgeschlossenem Handelstag: 2026-11-20, 2026-11-23, 2026-11-24

## Abweichungen

Keine.

## Journal der Umschichtung (App-Text)

> Momentum-Depot umgeschichtet: 9 Verkäufe, 9 Käufe auf das stärkste Zehntel (19 Werte). Ausführungstag 23.11.2026, Rangfolge auf den Schlusskursen des Stichtags 20.11.2026, gehandelt zur Eröffnung. Kosten 20 Bp je Seite. Korb: 189 von 191 Werten zulässig (Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken). Nicht im Korb oder ohne frische Kurse: AME, KO

## Trades (Weltzeit NY)

| Zeit | Art | Wert | Stueck | Kurs |
|---|---|---|---|---|
| 2026-11-23 09:35 | verkauf | TXN | 58.6627 | 104.2315 |
| 2026-11-23 09:35 | verkauf | CL | 58.5985 | 104.9636 |
| 2026-11-23 09:35 | verkauf | APTV | 58.3621 | 105.2186 |
| 2026-11-23 09:35 | verkauf | ABBV | 58.2587 | 104.3385 |
| 2026-11-23 09:35 | verkauf | FCX | 57.9493 | 104.2443 |
| 2026-11-23 09:35 | verkauf | KLAC | 58.1097 | 104.3263 |
| 2026-11-23 09:35 | verkauf | WMB | 57.8283 | 103.9806 |
| 2026-11-23 09:35 | verkauf | FIS | 58.1715 | 104.2973 |
| 2026-11-23 09:35 | verkauf | JPM | 58.2141 | 104.1788 |
| 2026-11-23 09:35 | kauf | ELV | 58.0151 | 105.4618 |
| 2026-11-23 09:35 | kauf | NVDA | 57.9869 | 105.5131 |
| 2026-11-23 09:35 | kauf | DASH | 58.7254 | 104.1862 |
| 2026-11-23 09:35 | kauf | ITW | 58.62 | 104.3736 |
| 2026-11-23 09:35 | kauf | ZTS | 58.2242 | 105.083 |
| 2026-11-23 09:35 | kauf | ADBE | 58.3924 | 104.7804 |
| 2026-11-23 09:35 | kauf | SPOT | 58.7733 | 104.1013 |
| 2026-11-23 09:35 | kauf | LIN | 58.6426 | 104.3334 |
| 2026-11-23 09:35 | kauf | EOG | 53.0251 | 104.9931 |

## Takte mit Ereignis (nur Takte, in denen sich etwas aenderte)

- 2026-11-20 16:20 [0 Abrufe]: Punkt 2026-11-20 116132.05
- 2026-11-23 09:35 [29 Abrufe]: Journal mfrebal: Momentum-Rebalancing: 18 Orders; 18 Trades
- 2026-11-23 16:20 [0 Abrufe]: Punkt 2026-11-23 116170.68
- 2026-11-24 16:20 [0 Abrufe]: Punkt 2026-11-24 116461.17

## Statuszeilen (verschiedene, mit Haeufigkeit)

- 1437x mfdStatus: Kurse vom TT.
- 3x mfdStatus: Kurse vom TT – nicht nach dem letzten Börsenschluss geladen, Nachladen angestoßen.
- 3x mfStatus: Lade Tageskurse … 10/194
- 3x mfStatus: Lade Tageskurse … 20/194
- 3x mfStatus: Lade Tageskurse … 30/194
- 3x mfStatus: Lade Tageskurse … 40/194
- 3x mfStatus: Lade Tageskurse … 50/194
- 3x mfStatus: Lade Tageskurse … 60/194
- 3x mfStatus: Lade Tageskurse … 70/194
- 3x mfStatus: Lade Tageskurse … 80/194
- 3x mfStatus: Lade Tageskurse … 90/194
- 3x mfStatus: Lade Tageskurse … 100/194
- 3x mfStatus: Lade Tageskurse … 110/194
- 3x mfStatus: Lade Tageskurse … 120/194
- 3x mfStatus: Lade Tageskurse … 130/194
