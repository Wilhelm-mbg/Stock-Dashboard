# Szenario d - ein gehaltener, zu verkaufender Wert hat seine letzte Kerze am Mittwoch 18.11.

Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), 1440 Takte zu 5 Minuten von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55, 687 Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.

## Ergebnis in einer Zeile

**4 Abweichung(en) vom Soll:** endbuch-positionen, erhaltung, punkt-wert-2026-11-23, punkt-wert-2026-11-24

## Umschichtung

- Eintraege `mfrebal-*` im tuneLog: **1** (Soll 1), Zeit laut App-Uhr 2026-11-23 09:35 (automatik)
- Ausfuehrungstag / Stichtag (Soll aus der Welt): 2026-11-23 / 2026-11-20; Journalzeile nennt {"ausfuehrungstag":"23.11.2026","stichtag":"20.11.2026"}
- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): 2026-11-23 09:35 (Uhr 09:35) x17
- Kurse der Trades: 17x Eroeffnung des Tages 2026-11-23
- Trades je Wert: 17 Werte, hoechstens 1 Trade(s) je Wert
- Korb/Ziel: Soll 190 von 193 zulaessig, Zielzahl 19; App (korbVerlauf) {"t":1795444500000,"zulaessig":190,"geprueft":192,"ziel":19}
- Bargeld vorher 0.09 | Soll nach Handel 0.01 (+ Ausschuettungen Soll 0) | App am Ende 0.01
- Positionen: vorher 19, App am Ende 20, Soll 19
- Erhaltung (Eroeffnungskurse): {"wertSollVorOpen":116186.78,"wertSollNachOpen":115980.31,"kostenSoll":206.47,"kostenAusTrades":194.28,"notional":97141.84}
- Tagespunkte (Schluessel tag, Wert, Soll): 2026-11-20 116248 (Soll 116248, Diff 0, geschrieben 2026-11-20 16:20); 2026-11-23 116173.95 (Soll 116150.81, Diff 23.14, geschrieben 2026-11-23 16:20); 2026-11-24 116451.18 (Soll 116443.21, Diff 7.97, geschrieben 2026-11-24 16:20)

## Pruefungen, die stimmen

- genau ein Eintrag mfrebal-* im tuneLog (um 2026-11-23 09:35 Uhrzeit der App-Uhr)
- kein Wert mit mehr als einem Trade (17 Werte gehandelt, 17 Trades)
- alle 17 Trades zur Eroeffnung des Ausfuehrungstags 2026-11-23 (nie Schluss, nie laufender Kurs, nie spaeterer Kurs)
- Journalzeile: Stichtag 20.11.2026 (Soll 20.11.2026)
- Bargeld am Ende 0.01 = Soll 0.01
- keine verlorene Position (8 verkaufte/ausgebuchte, alle mit Trade belegt)
- Bargeld in keinem der 1440 Takte negativ
- keine Statuszeile mit "Fehler"
- Karte ohne Fehler/NaN/undefined
- ein Tagespunkt je abgeschlossenem Handelstag: 2026-11-20, 2026-11-23, 2026-11-24

## Abweichungen

- **endbuch-positionen**: 10 Positionen weichen vom Soll ab: WELL ist 58.6393 soll 0; LUV ist 55.1173 soll 58.1744; XEL ist 55.5089 soll 58.5878; NKE ist 54.9154 soll 57.9613; COF ist 55.1321 soll 58.1901; NET ist 55.0452 soll 58.0984
- **erhaltung**: Kosten aus den Trades der App 194.28 gegen Soll 206.47 (Wert vor 116186.78, nach 115980.31 zu Eroeffnungskursen)
- **punkt-wert-2026-11-23**: Tagespunkt 2026-11-23: Wert 116173.95 gegen Soll 116150.81 (Differenz 23.14)
- **punkt-wert-2026-11-24**: Tagespunkt 2026-11-24: Wert 116451.18 gegen Soll 116443.21 (Differenz 7.97)

## Journal der Umschichtung (App-Text)

> Momentum-Depot umgeschichtet: 8 Verkäufe, 9 Käufe auf das stärkste Zehntel (19 Werte). Ausführungstag 23.11.2026, Rangfolge auf den Schlusskursen des Stichtags 20.11.2026, gehandelt zur Eröffnung. Kosten 20 Bp je Seite. Korb: 190 von 192 Werten zulässig (Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken). Nicht im Korb oder ohne frische Kurse: AME, KO Um 09:35 New York noch ohne Eröffnung, offen – die App fasst heute bis 16:00 New York zur Eröffnung dieses Tages nach: Verkauf WELL.

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
| 2026-11-23 09:35 | kauf | LUV | 55.1173 | 105.1165 |
| 2026-11-23 09:35 | kauf | XEL | 55.5089 | 104.3749 |
| 2026-11-23 09:35 | kauf | NKE | 54.9154 | 105.503 |
| 2026-11-23 09:35 | kauf | COF | 55.1321 | 105.0883 |
| 2026-11-23 09:35 | kauf | NET | 55.0452 | 105.2541 |
| 2026-11-23 09:35 | kauf | CCI | 55.0884 | 105.1715 |
| 2026-11-23 09:35 | kauf | DIS | 54.8958 | 105.5406 |
| 2026-11-23 09:35 | kauf | MMC | 55.3817 | 104.6146 |
| 2026-11-23 09:35 | kauf | WDAY | 20.178 | 105.2598 |

## Takte mit Ereignis (nur Takte, in denen sich etwas aenderte)

- 2026-11-20 16:20 [0 Abrufe]: Punkt 2026-11-20 116248
- 2026-11-23 09:35 [29 Abrufe]: Journal mfrebal: Momentum-Rebalancing: 17 Orders; 17 Trades; Positionen 19 -> 20
- 2026-11-23 09:40 [1 Abrufe]: offen
- 2026-11-23 09:45 [1 Abrufe]: offen
- 2026-11-23 09:50 [1 Abrufe]: offen
- 2026-11-23 09:55 [1 Abrufe]: offen
- 2026-11-23 10:00 [1 Abrufe]: offen
- 2026-11-23 10:05 [1 Abrufe]: offen
- 2026-11-23 10:10 [1 Abrufe]: offen
- 2026-11-23 10:15 [1 Abrufe]: offen
- 2026-11-23 10:20 [1 Abrufe]: offen
- 2026-11-23 10:25 [1 Abrufe]: offen
- 2026-11-23 10:30 [1 Abrufe]: offen
- 2026-11-23 10:35 [1 Abrufe]: offen
- 2026-11-23 10:40 [1 Abrufe]: offen
- 2026-11-23 10:45 [1 Abrufe]: offen
- 2026-11-23 10:50 [1 Abrufe]: offen
- 2026-11-23 10:55 [1 Abrufe]: offen
- 2026-11-23 11:00 [1 Abrufe]: offen
- 2026-11-23 11:05 [1 Abrufe]: offen
- 2026-11-23 11:10 [1 Abrufe]: offen
- 2026-11-23 11:15 [1 Abrufe]: offen
- 2026-11-23 11:20 [1 Abrufe]: offen
- 2026-11-23 11:25 [1 Abrufe]: offen
- 2026-11-23 11:30 [1 Abrufe]: offen
- 2026-11-23 11:35 [1 Abrufe]: offen
- 2026-11-23 11:40 [1 Abrufe]: offen
- 2026-11-23 11:45 [1 Abrufe]: offen
- 2026-11-23 11:50 [1 Abrufe]: offen
- 2026-11-23 11:55 [1 Abrufe]: offen
- 2026-11-23 12:00 [1 Abrufe]: offen
- 2026-11-23 12:05 [1 Abrufe]: offen
- 2026-11-23 12:10 [1 Abrufe]: offen
- 2026-11-23 12:15 [1 Abrufe]: offen
- 2026-11-23 12:20 [1 Abrufe]: offen
- 2026-11-23 12:25 [1 Abrufe]: offen
- 2026-11-23 12:30 [1 Abrufe]: offen
- 2026-11-23 12:35 [1 Abrufe]: offen
- 2026-11-23 12:40 [1 Abrufe]: offen
- 2026-11-23 12:45 [1 Abrufe]: offen
- 2026-11-23 12:50 [1 Abrufe]: offen
- 2026-11-23 12:55 [1 Abrufe]: offen
- 2026-11-23 13:00 [1 Abrufe]: offen
- 2026-11-23 13:05 [1 Abrufe]: offen
- 2026-11-23 13:10 [1 Abrufe]: offen
- 2026-11-23 13:15 [1 Abrufe]: offen
- 2026-11-23 13:20 [1 Abrufe]: offen
- 2026-11-23 13:25 [1 Abrufe]: offen
- 2026-11-23 13:30 [1 Abrufe]: offen
- 2026-11-23 13:35 [1 Abrufe]: offen
- 2026-11-23 13:40 [1 Abrufe]: offen
- 2026-11-23 13:45 [1 Abrufe]: offen
- 2026-11-23 13:50 [1 Abrufe]: offen
- 2026-11-23 13:55 [1 Abrufe]: offen
- 2026-11-23 14:00 [1 Abrufe]: offen
- 2026-11-23 14:05 [1 Abrufe]: offen
- 2026-11-23 14:10 [1 Abrufe]: offen
- 2026-11-23 14:15 [1 Abrufe]: offen
- 2026-11-23 14:20 [1 Abrufe]: offen
- 2026-11-23 14:25 [1 Abrufe]: offen
- 2026-11-23 14:30 [1 Abrufe]: offen
- 2026-11-23 14:35 [1 Abrufe]: offen
- 2026-11-23 14:40 [1 Abrufe]: offen
- 2026-11-23 14:45 [1 Abrufe]: offen
- 2026-11-23 14:50 [1 Abrufe]: offen
- 2026-11-23 14:55 [1 Abrufe]: offen
- 2026-11-23 15:00 [1 Abrufe]: offen
- 2026-11-23 15:05 [1 Abrufe]: offen
- 2026-11-23 15:10 [1 Abrufe]: offen
- 2026-11-23 15:15 [1 Abrufe]: offen
- 2026-11-23 15:20 [1 Abrufe]: offen
- 2026-11-23 15:25 [1 Abrufe]: offen
- 2026-11-23 15:30 [1 Abrufe]: offen
- 2026-11-23 15:35 [1 Abrufe]: offen
- 2026-11-23 15:40 [1 Abrufe]: offen
- 2026-11-23 15:45 [1 Abrufe]: offen
- 2026-11-23 15:50 [1 Abrufe]: offen
- 2026-11-23 15:55 [1 Abrufe]: offen
- 2026-11-23 16:00 [0 Abrufe]: Journal mfoffen-ende: Momentum-Buch: Nachfassen beendet, liegen geblieben ohne Eröffnung: Verkauf WELL
- 2026-11-23 16:20 [0 Abrufe]: Punkt 2026-11-23 116173.95
- ... und 1 weitere Takte mit Ereignis

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

## Einordnung

BEFUND (Klasse B, H-d-reihenende-fuenf-tage; Budgetanteil: Klasse A, H-b2-budget-ohne-kurs). Der gehaltene, nicht im Ziel stehende Wert (WELL) hat seine letzte Kerze am Mittwoch 18.11. REGEL §1.4 buchte ihn am Donnerstag 19.11. zum letzten Schluss aus; die App wartet absichtlich fuenf Handelstage (mfhandel.js, "BEWUSSTE ABWEICHUNG"). Am Montag hat sie erst drei, also: kein Eroeffnungskurs, der Verkauf wird als "offen" gemerkt und um 16:00 aufgegeben, die Position bleibt, am Ende 20 statt 19 Positionen. Ihr Wert fehlt im Platzwert, die Kaeufe sind 55 statt 58 Stueck. Der Rest der Umschichtung stimmt, auch die Kurse (alle Eroeffnung).
