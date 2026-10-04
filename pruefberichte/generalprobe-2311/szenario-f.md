# Szenario f - Montag 23.11. ist kein Handelstag (Feiertag, SPY ohne Balken)

Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), 1440 Takte zu 5 Minuten von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55, 784 Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.

## Ergebnis in einer Zeile

**Keine Abweichung vom Soll** (REGEL.md §1.2-§1.5, Teil C).

## Umschichtung

- Eintraege `mfrebal-*` im tuneLog: **1** (Soll 1), Zeit laut App-Uhr 2026-11-24 09:35 (automatik)
- Ausfuehrungstag / Stichtag (Soll aus der Welt): 2026-11-24 / 2026-11-20; Journalzeile nennt {"ausfuehrungstag":"24.11.2026","stichtag":"20.11.2026"}
- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): 2026-11-24 09:35 (Uhr 09:35) x18
- Kurse der Trades: 18x Eroeffnung des Tages 2026-11-24
- Trades je Wert: 18 Werte, hoechstens 1 Trade(s) je Wert
- Korb/Ziel: Soll 190 von 193 zulaessig, Zielzahl 19; App (korbVerlauf) {"t":1795530900000,"zulaessig":190,"geprueft":192,"ziel":19}
- Bargeld vorher 0.09 | Soll nach Handel 0.01 (+ Ausschuettungen Soll 0) | App am Ende 0.01
- Positionen: vorher 19, App am Ende 19, Soll 19
- Erhaltung (Eroeffnungskurse): {"wertSollVorOpen":116222.43,"wertSollNachOpen":116003.63,"kostenSoll":218.8,"kostenAusTrades":218.8,"notional":109400.23}
- Tagespunkte (Schluessel tag, Wert, Soll): 2026-11-20 116279.05 (Soll 116279.05, Diff 0, geschrieben 2026-11-20 16:20); 2026-11-24 116174.1 (Soll 116174.1, Diff 0, geschrieben 2026-11-24 16:20)

## Pruefungen, die stimmen

- genau ein Eintrag mfrebal-* im tuneLog (um 2026-11-24 09:35 Uhrzeit der App-Uhr)
- kein Wert mit mehr als einem Trade (18 Werte gehandelt, 18 Trades)
- alle 18 Trades zur Eroeffnung des Ausfuehrungstags 2026-11-24 (nie Schluss, nie laufender Kurs, nie spaeterer Kurs)
- Journalzeile: Stichtag 20.11.2026 (Soll 20.11.2026)
- Positionen und Stueckzahlen am Ende (19) gleich dem Soll (MFHandel-Funktionen und von Hand)
- Bargeld am Ende 0.01 = Soll 0.01
- keine verlorene Position (9 verkaufte/ausgebuchte, alle mit Trade belegt)
- Bargeld in keinem der 1440 Takte negativ
- keine Statuszeile mit "Fehler"
- Karte ohne Fehler/NaN/undefined
- Erhaltung: Wert zu Eroeffnungskursen vor 116222.43 - Kosten 218.8 = nach 116003.63; Kosten der App-Trades 218.8
- ein Tagespunkt je abgeschlossenem Handelstag: 2026-11-20, 2026-11-24

## Abweichungen

Keine.

## Journal der Umschichtung (App-Text)

> Momentum-Depot umgeschichtet: 9 Verkäufe, 9 Käufe auf das stärkste Zehntel (19 Werte). Ausführungstag 24.11.2026, Rangfolge auf den Schlusskursen des Stichtags 20.11.2026, gehandelt zur Eröffnung. Kosten 20 Bp je Seite. Korb: 190 von 192 Werten zulässig (Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken). Nicht im Korb oder ohne frische Kurse: AME, KO

## Trades (Weltzeit NY)

| Zeit | Art | Wert | Stueck | Kurs |
|---|---|---|---|---|
| 2026-11-24 09:35 | verkauf | WELL | 58.5003 | 104.9816 |
| 2026-11-24 09:35 | verkauf | TXN | 58.5243 | 104.478 |
| 2026-11-24 09:35 | verkauf | CL | 58.4608 | 105.2108 |
| 2026-11-24 09:35 | verkauf | APTV | 58.2256 | 105.4654 |
| 2026-11-24 09:35 | verkauf | ABBV | 58.1229 | 104.5822 |
| 2026-11-24 09:35 | verkauf | FCX | 57.8149 | 104.4867 |
| 2026-11-24 09:35 | verkauf | KLAC | 57.9755 | 104.5678 |
| 2026-11-24 09:35 | verkauf | WMB | 57.6953 | 104.2203 |
| 2026-11-24 09:35 | verkauf | FIS | 58.0383 | 104.5366 |
| 2026-11-24 09:35 | kauf | LUV | 58.0441 | 105.3849 |
| 2026-11-24 09:35 | kauf | XEL | 58.4577 | 104.6393 |
| 2026-11-24 09:35 | kauf | NKE | 57.8337 | 105.7682 |
| 2026-11-24 09:35 | kauf | COF | 58.0631 | 105.3504 |
| 2026-11-24 09:35 | kauf | NET | 57.9727 | 105.5146 |
| 2026-11-24 09:35 | kauf | CCI | 58.0194 | 105.4297 |
| 2026-11-24 09:35 | kauf | DIS | 57.8177 | 105.7976 |
| 2026-11-24 09:35 | kauf | MMC | 58.3306 | 104.8672 |
| 2026-11-24 09:35 | kauf | WDAY | 53.5958 | 105.512 |

## Takte mit Ereignis (nur Takte, in denen sich etwas aenderte)

- 2026-11-20 16:20 [0 Abrufe]: Punkt 2026-11-20 116279.05
- 2026-11-24 09:35 [29 Abrufe]: Journal mfrebal: Momentum-Rebalancing: 18 Orders; 18 Trades
- 2026-11-24 16:20 [0 Abrufe]: Punkt 2026-11-24 116174.1

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
