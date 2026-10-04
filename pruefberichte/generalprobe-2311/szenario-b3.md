# Szenario b3 - Teilausfall (45 Werte leer) von Mo 09:30 bis Di 10:00 NY: auch das Nachladen am Montagabend scheitert

Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), 1440 Takte zu 5 Minuten von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55, 5263 Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.

## Ergebnis in einer Zeile

**5 Abweichung(en) vom Soll:** endbuch-positionen, endbuch-cash, erhaltung, punkt-wert-2026-11-23, punkt-wert-2026-11-24

## Umschichtung

- Eintraege `mfrebal-*` im tuneLog: **1** (Soll 1), Zeit laut App-Uhr 2026-11-23 09:35 (automatik)
- Ausfuehrungstag / Stichtag (Soll aus der Welt): 2026-11-23 / 2026-11-20; Journalzeile nennt {"ausfuehrungstag":"23.11.2026","stichtag":"20.11.2026"}
- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): 2026-11-23 09:35 (Uhr 09:35) x11
- Kurse der Trades: 11x Eroeffnung des Tages 2026-11-23
- Trades je Wert: 11 Werte, hoechstens 1 Trade(s) je Wert
- Korb/Ziel: Soll 190 von 193 zulaessig, Zielzahl 19; App (korbVerlauf) {"t":1795444500000,"zulaessig":190,"geprueft":192,"ziel":19}
- Bargeld vorher 0.09 | Soll nach Handel 0 (+ Ausschuettungen Soll 0) | App am Ende 13809.9
- Positionen: vorher 19, App am Ende 18, Soll 19
- Erhaltung (Eroeffnungskurse): {"wertSollVorOpen":116222.41,"wertSollNachOpen":116003.61,"kostenSoll":218.8,"kostenAusTrades":117.76,"notional":58878.05}
- Tagespunkte (Schluessel tag, Wert, Soll): 2026-11-20 116279.03 (Soll 116279.03, Diff 0, geschrieben 2026-11-20 16:20); 2026-11-23 116293.42 (Soll 116174.09, Diff 119.33, geschrieben 2026-11-24 10:20); 2026-11-24 116543.9 (Soll 116466.55, Diff 77.35, geschrieben 2026-11-24 16:20)

## Pruefungen, die stimmen

- genau ein Eintrag mfrebal-* im tuneLog (um 2026-11-23 09:35 Uhrzeit der App-Uhr)
- kein Wert mit mehr als einem Trade (11 Werte gehandelt, 11 Trades)
- alle 11 Trades zur Eroeffnung des Ausfuehrungstags 2026-11-23 (nie Schluss, nie laufender Kurs, nie spaeterer Kurs)
- Journalzeile: Stichtag 20.11.2026 (Soll 20.11.2026)
- keine verlorene Position (6 verkaufte/ausgebuchte, alle mit Trade belegt)
- Bargeld in keinem der 1440 Takte negativ
- keine Statuszeile mit "Fehler"
- Karte ohne Fehler/NaN/undefined
- ein Tagespunkt je abgeschlossenem Handelstag: 2026-11-20, 2026-11-23, 2026-11-24

## Abweichungen

- **endbuch-positionen**: 12 Positionen weichen vom Soll ab: WELL ist 58.6393 soll 0; TXN ist 58.6627 soll 0; CL ist 58.5985 soll 0; NET ist 42.7066 soll 58.1162; CCI ist 42.7402 soll 58.1619; DIS ist 42.5907 soll 57.9584
- **endbuch-cash**: Bargeld am Ende 13809.9 gegen Soll 0 (Differenz 13809.9)
- **erhaltung**: Kosten aus den Trades der App 117.76 gegen Soll 218.8 (Wert vor 116222.41, nach 116003.61 zu Eroeffnungskursen)
- **punkt-wert-2026-11-23**: Tagespunkt 2026-11-23: Wert 116293.42 gegen Soll 116174.09 (Differenz 119.33)
- **punkt-wert-2026-11-24**: Tagespunkt 2026-11-24: Wert 116543.9 gegen Soll 116466.55 (Differenz 77.35)

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
- 2026-11-23 11:00 [10 Abrufe]: offen
- 2026-11-23 11:05 [10 Abrufe]: offen
- 2026-11-23 11:10 [10 Abrufe]: offen
- 2026-11-23 11:15 [10 Abrufe]: offen
- 2026-11-23 11:20 [10 Abrufe]: offen
- 2026-11-23 11:25 [10 Abrufe]: offen
- 2026-11-23 11:30 [10 Abrufe]: offen
- 2026-11-23 11:35 [10 Abrufe]: offen
- 2026-11-23 11:40 [10 Abrufe]: offen
- 2026-11-23 11:45 [10 Abrufe]: offen
- 2026-11-23 11:50 [10 Abrufe]: offen
- 2026-11-23 11:55 [10 Abrufe]: offen
- 2026-11-23 12:00 [10 Abrufe]: offen
- 2026-11-23 12:05 [10 Abrufe]: offen
- 2026-11-23 12:10 [10 Abrufe]: offen
- 2026-11-23 12:15 [10 Abrufe]: offen
- 2026-11-23 12:20 [10 Abrufe]: offen
- 2026-11-23 12:25 [10 Abrufe]: offen
- 2026-11-23 12:30 [10 Abrufe]: offen
- 2026-11-23 12:35 [10 Abrufe]: offen
- 2026-11-23 12:40 [10 Abrufe]: offen
- 2026-11-23 12:45 [10 Abrufe]: offen
- 2026-11-23 12:50 [10 Abrufe]: offen
- 2026-11-23 12:55 [10 Abrufe]: offen
- 2026-11-23 13:00 [10 Abrufe]: offen
- 2026-11-23 13:05 [10 Abrufe]: offen
- 2026-11-23 13:10 [10 Abrufe]: offen
- 2026-11-23 13:15 [10 Abrufe]: offen
- 2026-11-23 13:20 [10 Abrufe]: offen
- 2026-11-23 13:25 [10 Abrufe]: offen
- 2026-11-23 13:30 [10 Abrufe]: offen
- 2026-11-23 13:35 [10 Abrufe]: offen
- 2026-11-23 13:40 [10 Abrufe]: offen
- 2026-11-23 13:45 [10 Abrufe]: offen
- 2026-11-23 13:50 [10 Abrufe]: offen
- 2026-11-23 13:55 [10 Abrufe]: offen
- 2026-11-23 14:00 [10 Abrufe]: offen
- 2026-11-23 14:05 [10 Abrufe]: offen
- 2026-11-23 14:10 [10 Abrufe]: offen
- 2026-11-23 14:15 [10 Abrufe]: offen
- 2026-11-23 14:20 [10 Abrufe]: offen
- 2026-11-23 14:25 [10 Abrufe]: offen
- 2026-11-23 14:30 [10 Abrufe]: offen
- 2026-11-23 14:35 [10 Abrufe]: offen
- 2026-11-23 14:40 [10 Abrufe]: offen
- 2026-11-23 14:45 [10 Abrufe]: offen
- 2026-11-23 14:50 [10 Abrufe]: offen
- 2026-11-23 14:55 [10 Abrufe]: offen
- 2026-11-23 15:00 [10 Abrufe]: offen
- 2026-11-23 15:05 [10 Abrufe]: offen
- 2026-11-23 15:10 [10 Abrufe]: offen
- 2026-11-23 15:15 [10 Abrufe]: offen
- 2026-11-23 15:20 [10 Abrufe]: offen
- 2026-11-23 15:25 [10 Abrufe]: offen
- 2026-11-23 15:30 [10 Abrufe]: offen
- 2026-11-23 15:35 [10 Abrufe]: offen
- 2026-11-23 15:40 [10 Abrufe]: offen
- 2026-11-23 15:45 [10 Abrufe]: offen
- 2026-11-23 15:50 [10 Abrufe]: offen
- 2026-11-23 15:55 [10 Abrufe]: offen
- 2026-11-23 16:00 [0 Abrufe]: Journal mfoffen-ende: Momentum-Buch: Nachfassen beendet, liegen geblieben ohne Eröffnung: Verkäufe WELL, TXN, CL; Käufe LUV, XEL, NKE, COF
- 2026-11-24 10:20 [0 Abrufe]: Punkt 2026-11-23 116293.42
- ... und 1 weitere Takte mit Ereignis

## Statuszeilen (verschiedene, mit Haeufigkeit)

- 1221x mfdStatus: Kurse vom TT.
- 219x mfdStatus: Kurse vom TT – nicht nach dem letzten Börsenschluss geladen, Nachladen angestoßen.
- 21x mfStatus: Lade Tageskurse … 10/194
- 21x mfStatus: Lade Tageskurse … 20/194
- 21x mfStatus: Lade Tageskurse … 30/194
- 21x mfStatus: Lade Tageskurse … 40/194
- 21x mfStatus: Lade Tageskurse … 50/194
- 21x mfStatus: Lade Tageskurse … 60/194
- 21x mfStatus: Lade Tageskurse … 70/194
- 21x mfStatus: Lade Tageskurse … 80/194
- 21x mfStatus: Lade Tageskurse … 90/194
- 21x mfStatus: Lade Tageskurse … 100/194
- 21x mfStatus: Lade Tageskurse … 110/194
- 21x mfStatus: Lade Tageskurse … 120/194
- 21x mfStatus: Lade Tageskurse … 130/194

## Einordnung

Wie b2, aber die Quelle bleibt bis Dienstag 10:00 teilweise down. Folgen: (1) das Nachfassen um 16:00 gibt auf - 3 Verkaeufe und 4 Kaeufe bleiben liegen, die drei Verkaufswerte stehen danach 63 Handelstage im Buch (REGEL: "ohne Kurs kein Handel" - bei einer Quellenstoerung ist das ein anderer Fall als bei fehlenden Daten); (2) das Laden am Montagabend wird von ladenAnnehmen abgelehnt (148 von 193 < 95 %), der Bestand vom Freitag bleibt stehen, jede Stunde ein neuer Versuch mit je 194 Abrufen (21 Ladeversuche im Lauf), der Montagspunkt entsteht erst Dienstag 10:20; (3) dieselbe Budget-Abweichung wie b2 (13.809,90 $ Bargeld).
