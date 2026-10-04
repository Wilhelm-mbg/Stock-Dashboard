# Szenario e - die App startet erst Montag 15:50 NY (5-Minuten-Raster ab 15:50)

Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), 386 Takte zu 5 Minuten von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55, 611 Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.

## Ergebnis in einer Zeile

**Keine Abweichung vom Soll** (REGEL.md §1.2-§1.5, Teil C).

## Umschichtung

- Eintraege `mfrebal-*` im tuneLog: **1** (Soll 1), Zeit laut App-Uhr 2026-11-23 15:55 (automatik)
- Ausfuehrungstag / Stichtag (Soll aus der Welt): 2026-11-23 / 2026-11-20; Journalzeile nennt {"ausfuehrungstag":"23.11.2026","stichtag":"20.11.2026"}
- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): 2026-11-23 15:55 (Uhr 15:55) x18
- Kurse der Trades: 18x Eroeffnung des Tages 2026-11-23
- Trades je Wert: 18 Werte, hoechstens 1 Trade(s) je Wert
- Korb/Ziel: Soll 190 von 193 zulaessig, Zielzahl 19; App (korbVerlauf) {"t":1795467300000,"zulaessig":190,"geprueft":192,"ziel":19}
- Bargeld vorher 0.09 | Soll nach Handel 0 (+ Ausschuettungen Soll 0) | App am Ende 0
- Positionen: vorher 19, App am Ende 19, Soll 19
- Erhaltung (Eroeffnungskurse): {"wertSollVorOpen":116222.41,"wertSollNachOpen":116003.61,"kostenSoll":218.8,"kostenAusTrades":218.8,"notional":109400.24}
- Tagespunkte (Schluessel tag, Wert, Soll): 2026-11-20 116279.03 (Soll 116279.03, Diff 0, geschrieben 2026-11-23 15:55); 2026-11-23 116174.09 (Soll 116174.09, Diff 0, geschrieben 2026-11-23 16:55); 2026-11-24 116466.55 (Soll 116466.55, Diff 0, geschrieben 2026-11-24 16:20)

## Pruefungen, die stimmen

- genau ein Eintrag mfrebal-* im tuneLog (um 2026-11-23 15:55 Uhrzeit der App-Uhr)
- kein Wert mit mehr als einem Trade (18 Werte gehandelt, 18 Trades)
- alle 18 Trades zur Eroeffnung des Ausfuehrungstags 2026-11-23 (nie Schluss, nie laufender Kurs, nie spaeterer Kurs)
- Journalzeile: Stichtag 20.11.2026 (Soll 20.11.2026)
- Positionen und Stueckzahlen am Ende (19) gleich dem Soll (MFHandel-Funktionen und von Hand)
- Bargeld am Ende 0 = Soll 0
- keine verlorene Position (9 verkaufte/ausgebuchte, alle mit Trade belegt)
- Bargeld in keinem der 386 Takte negativ
- keine Statuszeile mit "Fehler"
- Karte ohne Fehler/NaN/undefined
- Erhaltung: Wert zu Eroeffnungskursen vor 116222.41 - Kosten 218.8 = nach 116003.61; Kosten der App-Trades 218.8
- ein Tagespunkt je abgeschlossenem Handelstag: 2026-11-20, 2026-11-23, 2026-11-24

## Abweichungen

Keine.

## Journal der Umschichtung (App-Text)

> Momentum-Depot umgeschichtet: 9 Verkäufe, 9 Käufe auf das stärkste Zehntel (19 Werte). Ausführungstag 23.11.2026, Rangfolge auf den Schlusskursen des Stichtags 20.11.2026, gehandelt zur Eröffnung. Kosten 20 Bp je Seite. Korb: 190 von 192 Werten zulässig (Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken). Nicht im Korb oder ohne frische Kurse: AME, KO

## Trades (Weltzeit NY)

| Zeit | Art | Wert | Stueck | Kurs |
|---|---|---|---|---|
| 2026-11-23 15:55 | verkauf | WELL | 58.6393 | 104.7328 |
| 2026-11-23 15:55 | verkauf | TXN | 58.6627 | 104.2315 |
| 2026-11-23 15:55 | verkauf | CL | 58.5985 | 104.9636 |
| 2026-11-23 15:55 | verkauf | APTV | 58.3621 | 105.2186 |
| 2026-11-23 15:55 | verkauf | ABBV | 58.2587 | 104.3385 |
| 2026-11-23 15:55 | verkauf | FCX | 57.9493 | 104.2443 |
| 2026-11-23 15:55 | verkauf | KLAC | 58.1097 | 104.3263 |
| 2026-11-23 15:55 | verkauf | WMB | 57.8283 | 103.9806 |
| 2026-11-23 15:55 | verkauf | FIS | 58.1715 | 104.2973 |
| 2026-11-23 15:55 | kauf | LUV | 58.1923 | 105.1165 |
| 2026-11-23 15:55 | kauf | XEL | 58.6057 | 104.3749 |
| 2026-11-23 15:55 | kauf | NKE | 57.9791 | 105.503 |
| 2026-11-23 15:55 | kauf | COF | 58.2079 | 105.0883 |
| 2026-11-23 15:55 | kauf | NET | 58.1162 | 105.2541 |
| 2026-11-23 15:55 | kauf | CCI | 58.1619 | 105.1715 |
| 2026-11-23 15:55 | kauf | DIS | 57.9584 | 105.5406 |
| 2026-11-23 15:55 | kauf | MMC | 58.4715 | 104.6146 |
| 2026-11-23 15:55 | kauf | WDAY | 53.7243 | 105.2598 |

## Takte mit Ereignis (nur Takte, in denen sich etwas aenderte)

- 2026-11-23 15:55 [29 Abrufe]: Journal mfrebal: Momentum-Rebalancing: 18 Orders; 18 Trades; Punkt 2026-11-20 116279.03
- 2026-11-23 16:55 [0 Abrufe]: Punkt 2026-11-23 116174.09
- 2026-11-24 16:20 [0 Abrufe]: Punkt 2026-11-24 116466.55

## Statuszeilen (verschiedene, mit Haeufigkeit)

- 10x mfdStatus: Kurse vom TT – nicht nach dem letzten Börsenschluss geladen, Nachladen angestoßen.
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
- 3x mfStatus: Lade Tageskurse … 140/194

## Einordnung

Gegenprobe ohne Befund. Start Montag 15:50: der Bestand ist vom Donnerstag (nicht frisch gegen die Uhr), der erste Takt laedt nach, der zweite (15:55) schichtet zur Eroeffnung des Montags um - 5 Minuten vor Schluss, aber zum richtigen Kurs. Der Freitagspunkt wird vor dem Handel geschrieben.
