# Szenario c2 - wie c1, zusaetzlich Split 2:1 mit Ex-Tag MONTAG 23.11. in einem verkauften, einem bleibenden und einem neu zu kaufenden Wert

Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), 1440 Takte zu 5 Minuten von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55, 611 Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.

## Ergebnis in einer Zeile

**6 Abweichung(en) vom Soll:** endbuch-positionen, endbuch-cash, erhaltung, punkt-wert-2026-11-20, punkt-wert-2026-11-23, punkt-wert-2026-11-24

## Umschichtung

- Eintraege `mfrebal-*` im tuneLog: **1** (Soll 1), Zeit laut App-Uhr 2026-11-23 09:35 (automatik)
- Ausfuehrungstag / Stichtag (Soll aus der Welt): 2026-11-23 / 2026-11-20; Journalzeile nennt {"ausfuehrungstag":"23.11.2026","stichtag":"20.11.2026"}
- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): 2026-11-23 09:35 (Uhr 09:35) x18
- Kurse der Trades: 18x Eroeffnung des Tages 2026-11-23
- Trades je Wert: 18 Werte, hoechstens 1 Trade(s) je Wert
- Korb/Ziel: Soll 190 von 193 zulaessig, Zielzahl 19; App (korbVerlauf) {"t":1795444500000,"zulaessig":190,"geprueft":192,"ziel":19}
- Bargeld vorher 0.11 | Soll nach Handel 0 (+ Ausschuettungen Soll 58.82) | App am Ende 29.5
- Positionen: vorher 19, App am Ende 19, Soll 19
- Erhaltung (Eroeffnungskurse): {"wertSollVorOpen":116222.41,"wertSollNachOpen":116003.61,"kostenSoll":218.8,"kostenAusTrades":206.54,"notional":103271.04}
- Tagespunkte (Schluessel tag, Wert, Soll): 2026-11-20 116279.02 (Soll 110114.08, Diff 6164.94, geschrieben 2026-11-20 16:20); 2026-11-23 113146.41 (Soll 116232.9, Diff -3086.49, geschrieben 2026-11-23 16:20); 2026-11-24 113431.41 (Soll 116525.36, Diff -3093.95, geschrieben 2026-11-24 16:20)
- Kapitalmassnahmen gebucht: split SCHW Ex 2026-11-20 09:30 gebucht 2026-11-20 16:20 2:1 Stueck 29.5947->59.1894; div ELV Ex 2026-11-23 09:30 gebucht 2026-11-23 16:20 29.49; split NVDA Ex 2026-11-23 09:30 gebucht 2026-11-23 16:20 2:1 Stueck 29.5269->59.0538

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

- **endbuch-positionen**: 9 Positionen weichen vom Soll ab: LUV ist 55.0949 soll 58.1923; XEL ist 55.4863 soll 58.6057; NKE ist 54.893 soll 57.9791; COF ist 55.1097 soll 58.2079; NET ist 55.0228 soll 58.1162; CCI ist 55.0661 soll 58.1619
- **endbuch-cash**: Bargeld am Ende 29.5 gegen Soll 58.82 (Differenz -29.32)
- **erhaltung**: Kosten aus den Trades der App 206.54 gegen Soll 218.8 (Wert vor 116222.41, nach 116003.61 zu Eroeffnungskursen)
- **punkt-wert-2026-11-20**: Tagespunkt 2026-11-20: Wert 116279.02 gegen Soll 110114.08 (Differenz 6164.94)
- **punkt-wert-2026-11-23**: Tagespunkt 2026-11-23: Wert 113146.41 gegen Soll 116232.9 (Differenz -3086.49)
- **punkt-wert-2026-11-24**: Tagespunkt 2026-11-24: Wert 113431.41 gegen Soll 116525.36 (Differenz -3093.95)

## Journal der Umschichtung (App-Text)

> Momentum-Depot umgeschichtet: 9 Verkäufe, 9 Käufe auf das stärkste Zehntel (19 Werte). Ausführungstag 23.11.2026, Rangfolge auf den Schlusskursen des Stichtags 20.11.2026, gehandelt zur Eröffnung. Kosten 20 Bp je Seite. Korb: 190 von 192 Werten zulässig (Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken). Nicht im Korb oder ohne frische Kurse: AME, KO

## Trades (Weltzeit NY)

| Zeit | Art | Wert | Stueck | Kurs |
|---|---|---|---|---|
| 2026-11-23 09:35 | verkauf | WELL | 29.3196 | 104.7328 |
| 2026-11-23 09:35 | verkauf | TXN | 58.6627 | 104.2315 |
| 2026-11-23 09:35 | verkauf | CL | 58.5985 | 104.9636 |
| 2026-11-23 09:35 | verkauf | APTV | 58.3621 | 105.2186 |
| 2026-11-23 09:35 | verkauf | ABBV | 58.2587 | 104.3385 |
| 2026-11-23 09:35 | verkauf | FCX | 57.9493 | 104.2443 |
| 2026-11-23 09:35 | verkauf | KLAC | 58.1097 | 104.3263 |
| 2026-11-23 09:35 | verkauf | WMB | 57.8283 | 103.9806 |
| 2026-11-23 09:35 | verkauf | FIS | 58.1715 | 104.2973 |
| 2026-11-23 09:35 | kauf | LUV | 55.0949 | 105.1165 |
| 2026-11-23 09:35 | kauf | XEL | 55.4863 | 104.3749 |
| 2026-11-23 09:35 | kauf | NKE | 54.893 | 105.503 |
| 2026-11-23 09:35 | kauf | COF | 55.1097 | 105.0883 |
| 2026-11-23 09:35 | kauf | NET | 55.0228 | 105.2541 |
| 2026-11-23 09:35 | kauf | CCI | 55.0661 | 105.1715 |
| 2026-11-23 09:35 | kauf | DIS | 54.8735 | 105.5406 |
| 2026-11-23 09:35 | kauf | MMC | 55.3592 | 104.6146 |
| 2026-11-23 09:35 | kauf | WDAY | 49.4135 | 105.2598 |

## Takte mit Ereignis (nur Takte, in denen sich etwas aenderte)

- 2026-11-20 16:20 [0 Abrufe]: Journal mfmass-momentum: Momentum-Buch: Split gebucht: SCHW 2 : 1; Punkt 2026-11-20 116279.02; Massnahme split SCHW 2:1
- 2026-11-23 09:35 [29 Abrufe]: Journal mfrebal: Momentum-Rebalancing: 18 Orders; 18 Trades
- 2026-11-23 16:20 [0 Abrufe]: Journal mfmass-momentum: Momentum-Buch: Ausschüttungen gutgeschrieben: 1 Buchung, Summe 29,49 $ | Momentum-Buch: Split gebucht: NVDA 2 : 1; Punkt 2026-11-23 113146.41; Massnahme div ELV 29.49; Massnahme split NVDA 2:1
- 2026-11-24 16:20 [0 Abrufe]: Punkt 2026-11-24 113431.41

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
