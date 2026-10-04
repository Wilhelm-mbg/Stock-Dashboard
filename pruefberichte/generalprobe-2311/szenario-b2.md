# Szenario b2 - Teilausfall: 45 Werte leer (HTTP 200 leer / 429-Drosselung) bis 11:00 NY

Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), 1440 Takte zu 5 Minuten von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55, 782 Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.

## Ergebnis in einer Zeile

**5 Abweichung(en) vom Soll:** endbuch-positionen, endbuch-cash, erhaltung, punkt-wert-2026-11-23, punkt-wert-2026-11-24

## Umschichtung

- Eintraege `mfrebal-*` im tuneLog: **1** (Soll 1), Zeit laut App-Uhr 2026-11-23 09:35 (automatik)
- Ausfuehrungstag / Stichtag (Soll aus der Welt): 2026-11-23 / 2026-11-20; Journalzeile nennt {"ausfuehrungstag":"23.11.2026","stichtag":"20.11.2026"}
- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): 2026-11-23 09:35 (Uhr 09:35) x11; 2026-11-23 11:00 (Uhr 11:00) x7
- Kurse der Trades: 18x Eroeffnung des Tages 2026-11-23
- Trades je Wert: 18 Werte, hoechstens 1 Trade(s) je Wert
- Korb/Ziel: Soll 190 von 193 zulaessig, Zielzahl 19; App (korbVerlauf) {"t":1795444500000,"zulaessig":190,"geprueft":192,"ziel":19}
- Bargeld vorher 0.09 | Soll nach Handel 0 (+ Ausschuettungen Soll 0) | App am Ende 14163.63
- Positionen: vorher 19, App am Ende 19, Soll 19
- Erhaltung (Eroeffnungskurse): {"wertSollVorOpen":116222.41,"wertSollNachOpen":116003.61,"kostenSoll":218.8,"kostenAusTrades":190.53,"notional":95264.89}
- Tagespunkte (Schluessel tag, Wert, Soll): 2026-11-20 116279.03 (Soll 116279.03, Diff 0, geschrieben 2026-11-20 16:20); 2026-11-23 116205.39 (Soll 116174.09, Diff 31.3, geschrieben 2026-11-23 16:20); 2026-11-24 116463.45 (Soll 116466.55, Diff -3.1, geschrieben 2026-11-24 16:20)

## Pruefungen, die stimmen

- genau ein Eintrag mfrebal-* im tuneLog (um 2026-11-23 09:35 Uhrzeit der App-Uhr)
- kein Wert mit mehr als einem Trade (18 Werte gehandelt, 18 Trades)
- alle 18 Trades zur Eroeffnung des Ausfuehrungstags 2026-11-23 (nie Schluss, nie laufender Kurs, nie spaeterer Kurs)
- Journalzeile: Stichtag 20.11.2026 (Soll 20.11.2026)
- keine verlorene Position (9 verkaufte/ausgebuchte, alle mit Trade belegt)
- Bargeld in keinem der 1440 Takte negativ
- keine Statuszeile mit "Fehler"
- Karte ohne Fehler/NaN/undefined
- ein Tagespunkt je abgeschlossenem Handelstag: 2026-11-20, 2026-11-23, 2026-11-24

## Abweichungen

- **endbuch-positionen**: 9 Positionen weichen vom Soll ab: NET ist 42.7066 soll 58.1162; CCI ist 42.7402 soll 58.1619; DIS ist 42.5907 soll 57.9584; MMC ist 42.9677 soll 58.4715; WDAY ist 42.7043 soll 53.7243; LUV ist 42.7625 soll 58.1923
- **endbuch-cash**: Bargeld am Ende 14163.63 gegen Soll 0 (Differenz 14163.62)
- **erhaltung**: Kosten aus den Trades der App 190.53 gegen Soll 218.8 (Wert vor 116222.41, nach 116003.61 zu Eroeffnungskursen)
- **punkt-wert-2026-11-23**: Tagespunkt 2026-11-23: Wert 116205.39 gegen Soll 116174.09 (Differenz 31.3)
- **punkt-wert-2026-11-24**: Tagespunkt 2026-11-24: Wert 116463.45 gegen Soll 116466.55 (Differenz -3.1)

## Journal der Umschichtung (App-Text)

> Momentum-Depot umgeschichtet: 6 Verkäufe, 5 Käufe auf das stärkste Zehntel (19 Werte). Ausführungstag 23.11.2026, Rangfolge auf den Schlusskursen des Stichtags 20.11.2026, gehandelt zur Eröffnung. Kosten 20 Bp je Seite. Korb: 190 von 192 Werten zulässig (Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken). Nicht im Korb oder ohne frische Kurse: AME, KO Um 09:35 New York noch ohne Eröffnung, offen – die App fasst heute bis 16:00 New York zur Eröffnung dieses Tages nach: Verkäufe WELL, TXN, CL; Käufe LUV, XEL, NKE, COF. Ohne Eröffnungskurs nicht handelbar (Ziel nicht gekauft, Position bis zur nächsten Umschichtung gehalten): SCHW, ELV

## Trades (Weltzeit NY)

| Zeit | Art | Wert | Stueck | Kurs |
|---|---|---|---|---|
| 2026-11-23 09:35 | verkauf | APTV | 58.3621 | 105.2186 |
| 2026-11-23 09:35 | verkauf | ABBV | 58.2587 | 104.3385 |
| 2026-11-23 09:35 | verkauf | FCX | 57.9493 | 104.2443 |
| 2026-11-23 09:35 | verkauf | KLAC | 58.1097 | 104.3263 |
| 2026-11-23 09:35 | verkauf | WMB | 57.8283 | 103.9806 |
| 2026-11-23 09:35 | verkauf | FIS | 58.1715 | 104.2973 |
| 2026-11-23 09:35 | kauf | NET | 42.7066 | 105.2541 |
| 2026-11-23 09:35 | kauf | CCI | 42.7402 | 105.1715 |
| 2026-11-23 09:35 | kauf | DIS | 42.5907 | 105.5406 |
| 2026-11-23 09:35 | kauf | MMC | 42.9677 | 104.6146 |
| 2026-11-23 09:35 | kauf | WDAY | 42.7043 | 105.2598 |
| 2026-11-23 11:00 | verkauf | WELL | 58.6393 | 104.7328 |
| 2026-11-23 11:00 | verkauf | TXN | 58.6627 | 104.2315 |
| 2026-11-23 11:00 | verkauf | CL | 58.5985 | 104.9636 |
| 2026-11-23 11:00 | kauf | LUV | 42.7625 | 105.1165 |
| 2026-11-23 11:00 | kauf | XEL | 43.0663 | 104.3749 |
| 2026-11-23 11:00 | kauf | NKE | 42.6058 | 105.503 |
| 2026-11-23 11:00 | kauf | COF | 42.774 | 105.0883 |

## Takte mit Ereignis (nur Takte, in denen sich etwas aenderte)

- 2026-11-20 16:20 [0 Abrufe]: Punkt 2026-11-20 116279.03
- 2026-11-23 09:35 [33 Abrufe]: Journal mfrebal: Momentum-Rebalancing: 11 Orders; 11 Trades; Positionen 19 -> 18
- 2026-11-23 09:40 [10 Abrufe]: offen
- 2026-11-23 09:45 [10 Abrufe]: offen
- 2026-11-23 09:50 [10 Abrufe]: offen
- 2026-11-23 09:55 [10 Abrufe]: offen
- 2026-11-23 10:00 [10 Abrufe]: offen
- 2026-11-23 10:05 [10 Abrufe]: offen
- 2026-11-23 10:10 [10 Abrufe]: offen
- 2026-11-23 10:15 [10 Abrufe]: offen
- 2026-11-23 10:20 [10 Abrufe]: offen
- 2026-11-23 10:25 [10 Abrufe]: offen
- 2026-11-23 10:30 [10 Abrufe]: offen
- 2026-11-23 10:35 [10 Abrufe]: offen
- 2026-11-23 10:40 [10 Abrufe]: offen
- 2026-11-23 10:45 [10 Abrufe]: offen
- 2026-11-23 10:50 [10 Abrufe]: offen
- 2026-11-23 10:55 [10 Abrufe]: offen
- 2026-11-23 11:00 [7 Abrufe]: Journal mfnach: Momentum-Buch nachgefasst: Verkauf WELL zu 104,73 $; Verkauf TXN zu 104,23 $; Verkauf CL zu 104,96 $; Kauf LUV zu 105,12 $ (42,7625 Stück); Kauf XEL zu 104,37 $ (43,0663 Stück); Kauf NKE zu 105,50 $ (42,6058 Stück); Kauf COF zu 105,09 $ (42,774 Stück); 7 Trades; Positionen 18 -> 19
- 2026-11-23 16:20 [0 Abrufe]: Punkt 2026-11-23 116205.39
- 2026-11-24 16:20 [0 Abrufe]: Punkt 2026-11-24 116463.45

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
