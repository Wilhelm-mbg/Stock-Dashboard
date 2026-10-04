# Szenario d2 - ein gehaltener, im Ziel bleibender Wert hat seine letzte Kerze am Mittwoch 18.11.

Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), 1440 Takte zu 5 Minuten von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55, 611 Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.

## Ergebnis in einer Zeile

**5 Abweichung(en) vom Soll:** endbuch-positionen, endbuch-cash, erhaltung, punkt-wert-2026-11-23, punkt-wert-2026-11-24

## Umschichtung

- Eintraege `mfrebal-*` im tuneLog: **1** (Soll 1), Zeit laut App-Uhr 2026-11-23 09:35 (automatik)
- Ausfuehrungstag / Stichtag (Soll aus der Welt): 2026-11-23 / 2026-11-20; Journalzeile nennt {"ausfuehrungstag":"23.11.2026","stichtag":"20.11.2026"}
- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): 2026-11-23 09:35 (Uhr 09:35) x18
- Kurse der Trades: 18x Eroeffnung des Tages 2026-11-23
- Trades je Wert: 18 Werte, hoechstens 1 Trade(s) je Wert
- Korb/Ziel: Soll 190 von 193 zulaessig, Zielzahl 19; App (korbVerlauf) {"t":1795444500000,"zulaessig":190,"geprueft":192,"ziel":19}
- Bargeld vorher 0.09 | Soll nach Handel 5723.12 (+ Ausschuettungen Soll 0) | App am Ende 2489.32
- Positionen: vorher 19, App am Ende 19, Soll 18
- Erhaltung (Eroeffnungskurse): {"wertSollVorOpen":116157.72,"wertSollNachOpen":115938.06,"kostenSoll":219.66,"kostenAusTrades":213.83,"notional":106915.89}
- Tagespunkte (Schluessel tag, Wert, Soll): 2026-11-20 116245.94 (Soll 116245.94, Diff 0, geschrieben 2026-11-20 16:20); 2026-11-23 116129.46 (Soll 116122.73, Diff 6.73, geschrieben 2026-11-23 16:20); 2026-11-24 116398.65 (Soll 116399.02, Diff -0.37, geschrieben 2026-11-24 16:20)

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

- **endbuch-positionen**: 10 Positionen weichen vom Soll ab: ELV ist 58.9786 soll 0; LUV ist 55.078 soll 58.1599; XEL ist 55.4693 soll 58.5731; NKE ist 54.8762 soll 57.9468; COF ist 55.0927 soll 58.1755; NET ist 55.0059 soll 58.0839
- **endbuch-cash**: Bargeld am Ende 2489.32 gegen Soll 5723.12 (Differenz -3233.8)
- **erhaltung**: Kosten aus den Trades der App 213.83 gegen Soll 219.66 (Wert vor 116157.72, nach 115938.06 zu Eroeffnungskursen)
- **punkt-wert-2026-11-23**: Tagespunkt 2026-11-23: Wert 116129.46 gegen Soll 116122.73 (Differenz 6.73)
- **punkt-wert-2026-11-24**: Tagespunkt 2026-11-24: Wert 116398.65 gegen Soll 116399.02 (Differenz -0.37)

## Journal der Umschichtung (App-Text)

> Momentum-Depot umgeschichtet: 9 Verkäufe, 9 Käufe auf das stärkste Zehntel (19 Werte). Ausführungstag 23.11.2026, Rangfolge auf den Schlusskursen des Stichtags 20.11.2026, gehandelt zur Eröffnung. Kosten 20 Bp je Seite. Korb: 190 von 192 Werten zulässig (Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken). Nicht im Korb oder ohne frische Kurse: AME, KO Ohne Eröffnungskurs nicht handelbar (Ziel nicht gekauft, Position bis zur nächsten Umschichtung gehalten): ELV

## Trades (Weltzeit NY)

| Zeit | Art | Wert | Stueck | Kurs |
|---|---|---|---|---|
| 2026-11-23 09:35 | verkauf | WELL | 58.6393 | 104.7328 |
| 2026-11-23 09:35 | verkauf | TXN | 58.6627 | 104.2315 |
| 2026-11-23 09:35 | verkauf | CL | 58.5985 | 104.9636 |
| 2026-11-23 09:35 | verkauf | APTV | 58.3621 | 105.2186 |
| 2026-11-23 09:35 | verkauf | ABBV | 58.2587 | 104.3385 |
| 2026-11-23 09:35 | verkauf | FCX | 57.9493 | 104.2443 |
| 2026-11-23 09:35 | verkauf | KLAC | 58.1097 | 104.3263 |
| 2026-11-23 09:35 | verkauf | WMB | 57.8283 | 103.9806 |
| 2026-11-23 09:35 | verkauf | FIS | 58.1715 | 104.2973 |
| 2026-11-23 09:35 | kauf | LUV | 55.078 | 105.1165 |
| 2026-11-23 09:35 | kauf | XEL | 55.4693 | 104.3749 |
| 2026-11-23 09:35 | kauf | NKE | 54.8762 | 105.503 |
| 2026-11-23 09:35 | kauf | COF | 55.0927 | 105.0883 |
| 2026-11-23 09:35 | kauf | NET | 55.0059 | 105.2541 |
| 2026-11-23 09:35 | kauf | CCI | 55.0491 | 105.1715 |
| 2026-11-23 09:35 | kauf | DIS | 54.8566 | 105.5406 |
| 2026-11-23 09:35 | kauf | MMC | 55.3422 | 104.6146 |
| 2026-11-23 09:35 | kauf | WDAY | 55.003 | 105.2598 |

## Takte mit Ereignis (nur Takte, in denen sich etwas aenderte)

- 2026-11-20 16:20 [0 Abrufe]: Punkt 2026-11-20 116245.94
- 2026-11-23 09:35 [29 Abrufe]: Journal mfrebal: Momentum-Rebalancing: 18 Orders; 18 Trades
- 2026-11-23 16:20 [0 Abrufe]: Punkt 2026-11-23 116129.46
- 2026-11-24 16:20 [0 Abrufe]: Punkt 2026-11-24 116398.65

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

BEFUND (Klasse B/A wie d). Hier ist der Wert, dessen Reihe am 18.11. endet, ein im Ziel bleibender Wert (ELV). REGEL: ausgebucht am Donnerstag, am Montag als Ziel ohne Kurs nicht gekauft - Bargeld 5.723 $ bleibt liegen, 18 Positionen. App: Position bleibt (19 Positionen), ihr Wert fehlt im Platzwert, die Kaeufe sind kleiner, Bargeld 2.489 $. Beide Seiten halten Geld ungenutzt, aber verschieden viel und verschieden lang; die App bucht erst Mittwoch 25.11. aus.
