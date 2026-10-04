# Datenprüfung Trendfilter-Messung (REGEL §2.6)

**Kurzfassung** (Yahoo-Rohdaten unverändert; Vorlauf A = 31.12.2015–03.01.2017, nur Schlüsse; Zusatz inkl. Vorlauf ab 30.09.2002; „N2“ = nur nachrichtlich):
| Reihe | Vorlauf A | A | B | Zusatz 2003–2026 |
|---|---|---|---|---|
| SPY | taugt | taugt mit Vorbehalt | taugt | taugt mit Vorbehalt |
| BIL | taugt | taugt | taugt | – |
| SHY | taugt (N2) | taugt (N2) | taugt (N2) | taugt mit Vorbehalt |
| ACWX | taugt | taugt | taugt | – |
| EFA | taugt (N2) | taugt (N2) | taugt (N2) | taugt mit Vorbehalt |
| AGG | – | taugt mit Vorbehalt | taugt | taugt mit Vorbehalt |
Kalender lückenlos (0 fehlende/überzählige Tage); SPY-Handelstage A 1.183 / B 1.254, Starttage 22 / 22; erster Zusatz-Tag 01.10.2003. Vorbehalte (belegte Yahoo-Fehler, je auf 100.000 $): SPY 01.02.2017 Eröffnung an Ausführungstag R1/R2 -0,32 % (≈ 315 $); AGG 01.11.2018 Ausschüttung doppelt 0,25 % (≈ 245 $); SPY 02.02.2017 Eröffnung an Starttag 0,18 % (≈ 185 $); SPY 23.01.2017 Eröffnung an Starttag 0,17 % (≈ 172 $). Mit Schlüssen bzw. Ausschüttungen der zweiten Quelle kippt kein Monatssignal (R1 128, R2 117 Monatsenden ab 2016); der R3-Zustand weicht an 0 von 2.690 Tagen ab.

Erzeugt von `datenpruefung.js` am 2026-10-05 01:13 Berlin (Laufzeit 4,5 s); alle Zählungen in `datenpruefung.json`. Prüfsummen der Rohantworten: SPY gleich, BIL gleich, SHY gleich, ACWX gleich, EFA gleich, AGG gleich. Zweite Quelle: E:/Markt-Dashboard-Archiv. Simulation, keine Anlageberatung.

Urteilsregel: **taugt nicht** bei fehlenden Tagen, fehlenden oder nicht positiven Schlüssen im gebrauchten Zeitraum; **mit Vorbehalt**, wenn ein Befund eine Zahl des Urteils um ≥ 0,1 % des Bestands (≈ 100 $ auf 100.000 $) verschieben kann, ein Signal mit der zweiten Quelle kippt oder (Zusatz) die Jahre 2002–2015 ohne zweite Quelle sind. Gründe je Zelle in `urteil`.

| Reihe | Zeitraum | Rolle | Urteil | Gründe |
|---|---|---|---|---|
| SPY | Vorlauf A | Signale R1–R3 (nur Schluss) | taugt | – |
| SPY | Fenster A | Maßstab, R1–R3 | taugt mit Vorbehalt | 23.01.2017 Eröffnung an Starttag 0,17 % (≈ 172 $); 01.02.2017 Eröffnung an Ausführungstag R1/R2 + Starttag -0,32 % (≈ 315 $); 02.02.2017 Eröffnung an Starttag 0,18 % (≈ 185 $) |
| SPY | Fenster B | Maßstab, R1–R3 | taugt | – |
| SPY | Zusatz inkl. Vorlauf | Zusatz: Maßstab, R1–R3 | taugt mit Vorbehalt | 23.01.2017 Eröffnung an Starttag 0,17 % (≈ 172 $); 01.02.2017 Eröffnung an Ausführungstag R1/R2 + Starttag -0,32 % (≈ 315 $); 02.02.2017 Eröffnung an Starttag 0,18 % (≈ 185 $); 2002–2015 ohne zweite Quelle; Eröffnung = Vortagsschluss an 24 Tagen 10/2003–2015, davon 2 Monatsanfänge (zum Vergleich 2016–2026: 19 von 28 solchen Tagen von der zweiten Quelle als veraltet bestätigt) |
| SPY | SPY-Vorgeschichte (nur Gedächtnis von R3) | Gedächtnis R3 (nur Schluss) | taugt | – |
| BIL | Vorlauf A | Signal R2 (nur Schluss) | taugt | – |
| BIL | Fenster A | Geld R1–R3, Signal R2 | taugt | – |
| BIL | Fenster B | Geld R1–R3, Signal R2 | taugt | – |
| SHY | Vorlauf A | nur N2 (Schluss) | taugt | – |
| SHY | Fenster A | nur N2 | taugt | – |
| SHY | Fenster B | nur N2 | taugt | – |
| SHY | Zusatz inkl. Vorlauf | Zusatz: Geld | taugt mit Vorbehalt | 2002–2015 ohne zweite Quelle; Eröffnung = Vortagsschluss an 373 Tagen 10/2003–2015, davon 4 Monatsanfänge (zum Vergleich 2016–2026: 0 von 295 solchen Tagen von der zweiten Quelle als veraltet bestätigt) |
| ACWX | Vorlauf A | Signal R2 (nur Schluss) | taugt | – |
| ACWX | Fenster A | Nicht-US R2 | taugt | – |
| ACWX | Fenster B | Nicht-US R2 | taugt | – |
| EFA | Vorlauf A | nur N2 (Schluss) | taugt | – |
| EFA | Fenster A | nur N2 | taugt | – |
| EFA | Fenster B | nur N2 | taugt | – |
| EFA | Zusatz inkl. Vorlauf | Zusatz: Nicht-US | taugt mit Vorbehalt | 2002–2015 ohne zweite Quelle; Eröffnung = Vortagsschluss an 37 Tagen 10/2003–2015, davon 1 Monatsanfänge (zum Vergleich 2016–2026: 7 von 32 solchen Tagen von der zweiten Quelle als veraltet bestätigt) |
| AGG | Fenster A | Anleihen R2 | taugt mit Vorbehalt | 01.11.2018 Ausschüttung: Yahoo = 2,001 × Alpaca (Yahoo doppelt) 0,25 % (≈ 245 $) |
| AGG | Fenster B | Anleihen R2 | taugt | – |
| AGG | Zusatz inkl. Vorlauf | Zusatz: Anleihen R2 (ab 29.09.2003) | taugt mit Vorbehalt | 01.11.2018 Ausschüttung: Yahoo = 2,001 × Alpaca (Yahoo doppelt) 0,25 % (≈ 245 $); 2002–2015 ohne zweite Quelle; Eröffnung = Vortagsschluss an 130 Tagen 10/2003–2015, davon 2 Monatsanfänge (zum Vergleich 2016–2026: 2 von 69 solchen Tagen von der zweiten Quelle als veraltet bestätigt) |

## 1 Aufbau

| Reihe | Börse | Zeilen | erster Tag | letzter Tag | nach 15.09.2026 (abgeschnitten) | doppelt | Wochenende | Uhrzeit NY | Ausschüttungen (nach Ende) | Splits |
|---|---|---|---|---|---|---|---|---|---|---|
| SPY | NYSEArca | 8.477 | 29.01.1993 | 02.10.2026 | 13 (16.09.2026–02.10.2026) | 0 | 0 | 09:30: 8477 | 136 (18.09.2026) | – |
| BIL | NYSEArca | 4.868 | 30.05.2007 | 02.10.2026 | 13 (16.09.2026–02.10.2026) | 0 | 0 | 09:30: 4868 | 128 (01.10.2026) | 2017-11-30 1:2 |
| SHY | NasdaqGM | 6.084 | 30.07.2002 | 02.10.2026 | 13 (16.09.2026–02.10.2026) | 0 | 0 | 09:30: 6084 | 290 (01.10.2026) | – |
| ACWX | NasdaqGM | 4.657 | 01.04.2008 | 02.10.2026 | 13 (16.09.2026–02.10.2026) | 0 | 0 | 09:30: 4657 | 37 (0) | – |
| EFA | NYSEArca | 6.312 | 27.08.2001 | 02.10.2026 | 13 (16.09.2026–02.10.2026) | 0 | 0 | 09:30: 6312 | 47 (0) | 2005-06-09 3:1 |
| AGG | NYSEArca | 5.790 | 29.09.2003 | 02.10.2026 | 13 (16.09.2026–02.10.2026) | 0 | 0 | 09:30: 5790 | 276 (01.10.2026) | – |

Ausschüttungsstempel: SPY 09:30 ×136; BIL 09:30 ×128; SHY 09:30 ×290; ACWX 09:30 ×37; EFA 09:30 ×47; AGG 09:30 ×276 – Ex-Tag nach New Yorker Datum ist damit eindeutig. Zeitstempel unsortiert oder doppelt: 0/0/0/0/0/0.

Je Zeitraum (gebrauchte Zeiträume; R3V nur SPY): Zeilen, fehlende Kurse, Spannenfehler.

| Reihe | Zeitraum | Zeilen | SPY-Tage | SPY-Tage vor Erstnotiz | fehlende Tage | überzählige Tage | ohne Schluss/Eröffnung | nicht positiv | Hoch < Tief | O/C außerhalb Spanne | Umsatz 0 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SPY | R3V | 2.436 | 2.436 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| SPY | Z | 6.028 | 6.028 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| SPY | AV | 254 | 254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| SPY | A | 1.183 | 1.183 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| SPY | B | 1.254 | 1.254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| BIL | Z | 4.855 | 6.028 | 1173 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| BIL | AV | 254 | 254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| BIL | A | 1.183 | 1.183 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| BIL | B | 1.254 | 1.254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| SHY | Z | 6.028 | 6.028 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| SHY | AV | 254 | 254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| SHY | A | 1.183 | 1.183 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| SHY | B | 1.254 | 1.254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| ACWX | Z | 4.644 | 6.028 | 1384 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| ACWX | AV | 254 | 254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| ACWX | A | 1.183 | 1.183 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| ACWX | B | 1.254 | 1.254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| EFA | Z | 6.028 | 6.028 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| EFA | AV | 254 | 254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| EFA | A | 1.183 | 1.183 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| EFA | B | 1.254 | 1.254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| AGG | Z | 5.777 | 6.028 | 251 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| AGG | AV | 254 | 254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| AGG | A | 1.183 | 1.183 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |
| AGG | B | 1.254 | 1.254 | 0 | 0 | 0 | 0/0 | 0 | 0 | 0/0 | 0 |

## 2 Kalender

- SPY gegen die NYSE-Regeln (Feiertage samt Ersatztagen, Juneteenth ab 2022, MLK ab 1998, Sonderschließungen 1994, 2001, 2004, 2007, 2012, 2018, 2025), 29.01.1993–15.09.2026: Werktage ohne SPY-Zeile und ohne Feiertag **0**, SPY-Zeilen an NYSE-Feiertagen **0**. Der SPY-Kalender ist also genau der NYSE-Kalender.
- SPY-Handelstage: A (04.01.2017–15.09.2021) **1.183**, B (16.09.2021–15.09.2026) **1.254**, Vorlauf A 254, Zusatz inkl. Vorlauf 6.028. Monatsenden bis August 2026: 404.
- Starttage nach §5.2: A **22** (04.01.2017–03.02.2017), B **22** (16.09.2021–15.10.2021) – je 22 wie erwartet.
- Erster möglicher Zusatz-Tag (§7.1): **01.10.2003**. Begründung aus den Daten: R1 hat ab dem Monatsende 29.10.1993 zehn Monatsenden, R3 ab 30.11.1993 200 Schlüsse; R2 mit SHY/EFA ist erst ab 31.07.2003 (M-12 = 31.07.2002) berechenbar (SHY ab 30.07.2002); AGG hat erst ab 29.09.2003 Kurse, das erste Monatsende mit AGG-Schluss ist 30.09.2003 → erster SPY-Handelstag danach. Starttage des Zusatzes bis 16.09.2021: 4.522.
- Jede Reihe gegen den SPY-Kalender: in jedem Zeitraum **0 fehlende und 0 überzählige Tage** (Tabelle oben), auch keine Ex-Tage außerhalb des Kalenders (Abschnitt 5). Der Vorlauf von B (31.08.2020–15.09.2021) liegt in A.
- R3 hat ein Gedächtnis (Band, Zustand ab 1993); dafür zählen nur die SPY-Schlüsse 29.01.1993–27.09.2002 (R3V): 2.436 Zeilen, fehlend 0, ohne Schluss 0, Schluss-Sprünge > 7 % 27.10.1997 -7,25 %, 31.08.1998 -7,13 %, Sprungpaare 0.

## 3 Verdächtige Kurse

Grenzen: Aktien-ETFs |r| > 7 %, Anleihen-/Geld-ETFs |r| > 1,5 %. Sprungpaar: beide Beträge > halbe Grenze, entgegengesetzt, netto < 0,3 × kleinerer Betrag. Eröffnungs-Ausreißer: Eröffnung mehr als die halbe Grenze über (unter) Vortags- **und** Tagesschluss. In Klammern die SPY-Bewegung desselben Tages.

| Reihe | Zeitraum | Schluss-Sprünge | Lücken Schluss→Eröffnung | Sprungpaare | Eröffnungs-Ausreißer | O = C / O = Vortags-C / flach |
|---|---|---|---|---|---|---|
| SPY | R3V | 2 | 1 | 0 | 0 | 47 / 106 / 0 |
| SPY | Z | 13 | 3 | 8 | 0 | 38 / 53 / 0 |
| SPY | AV | 0 | 0 | 0 | 0 | 1 / 10 / 0 |
| SPY | A | 5 | 2 | 3 | 0 | 10 / 14 / 0 |
| SPY | B | 1 | 0 | 0 | 0 | 1 / 4 / 0 |
| BIL | Z | 0 | 0 | 0 | 2 | 2134 / 1882 / 11 |
| BIL | AV | 0 | 0 | 0 | 0 | 119 / 135 / 0 |
| BIL | A | 0 | 0 | 0 | 0 | 511 / 501 / 1 |
| BIL | B | 0 | 0 | 0 | 0 | 585 / 264 / 5 |
| SHY | Z | 0 | 1 | 0 | 1 | 687 / 683 / 0 |
| SHY | AV | 0 | 0 | 0 | 0 | 25 / 28 / 0 |
| SHY | A | 0 | 0 | 0 | 0 | 188 / 181 / 0 |
| SHY | B | 0 | 0 | 0 | 0 | 118 / 86 / 0 |
| ACWX | Z | 19 | 8 | 8 | 5 | 91 / 67 / 1 |
| ACWX | AV | 1 | 1 | 0 | 0 | 10 / 2 / 0 |
| ACWX | A | 4 | 3 | 1 | 0 | 26 / 14 / 0 |
| ACWX | B | 1 | 0 | 0 | 0 | 19 / 25 / 0 |
| EFA | Z | 18 | 7 | 10 | 4 | 75 / 72 / 0 |
| EFA | AV | 1 | 1 | 0 | 0 | 6 / 7 / 0 |
| EFA | A | 4 | 3 | 1 | 0 | 21 / 20 / 0 |
| EFA | B | 1 | 0 | 0 | 1 | 9 / 5 / 0 |
| AGG | Z | 28 | 3 | 6 | 5 | 157 / 199 / 0 |
| AGG | AV | 0 | 0 | 0 | 0 | 5 / 8 / 0 |
| AGG | A | 7 | 0 | 1 | 2 | 41 / 38 / 0 |
| AGG | B | 3 | 1 | 1 | 2 | 31 / 23 / 0 |

Einzelne Tage in Vorlauf A, A und B; in Klammern SPY am selben Tag und „2. Q.“ = Abweichung Yahoo gegen die zweite Quelle an diesem Tag (Schluss bzw. Eröffnung). Alle diese Tage bestätigt die zweite Quelle: an keinem weicht sie um mehr als 0,95 % ab, die Sprünge selbst sind ein Vielfaches davon – es sind echte Markttage (Brexit 2016, März 2020, 2022, April 2025).

- SPY A: Sprünge 09.03.2020 -7,81 % (SPY -7,81; 2. Q. -0,07), 12.03.2020 -9,57 % (SPY -9,57; 2. Q. 0,00), 13.03.2020 8,55 % (SPY 8,55; 2. Q. -0,60), 16.03.2020 -10,94 % (SPY -10,94; 2. Q. 0,17), 24.03.2020 9,06 % (SPY 9,06; 2. Q. -0,18); Lücken Schluss→Eröffnung 09.03.2020 -7,45 % (2. Q. 0,00), 16.03.2020 -10,45 % (2. Q. 0,00); Paare 10.03.2020/11.03.2020 5,17/-4,87 % (SPY 5,17/-4,87), 12.03.2020/13.03.2020 -9,57/8,55 % (SPY -9,57/8,55), 17.03.2020/18.03.2020 5,40/-5,06 % (SPY 5,40/-5,06)
- SPY B: Sprünge 09.04.2025 10,50 % (SPY 10,50; 2. Q. 0,95)
- ACWX AV: Sprünge 24.06.2016 -7,69 % (SPY -3,59; 2. Q. -0,03); Lücken Schluss→Eröffnung 24.06.2016 -7,30 % (2. Q. 0,00)
- ACWX A: Sprünge 09.03.2020 -8,00 % (SPY -7,81; 2. Q. -0,15), 12.03.2020 -11,13 % (SPY -9,57; 2. Q. 0,00), 16.03.2020 -10,95 % (SPY -10,94; 2. Q. 0,00), 24.03.2020 8,38 % (SPY 9,06; 2. Q. 0,00); Lücken Schluss→Eröffnung 12.03.2020 -7,38 % (2. Q. 0,11), 16.03.2020 -11,27 % (2. Q. 0,00), 24.03.2020 7,13 % (2. Q. 0,00); Paare 26.03.2020/27.03.2020 3,98/-3,72 % (SPY 5,84/-2,98)
- ACWX B: Sprünge 09.04.2025 7,09 % (SPY 10,50; 2. Q. 0,00)
- EFA AV: Sprünge 24.06.2016 -8,59 % (SPY -3,59; 2. Q. 0,00); Lücken Schluss→Eröffnung 24.06.2016 -8,19 % (2. Q. -0,03)
- EFA A: Sprünge 09.03.2020 -7,76 % (SPY -7,81; 2. Q. 0,07), 12.03.2020 -10,99 % (SPY -9,57; 2. Q. 0,02), 16.03.2020 -10,32 % (SPY -10,94; 2. Q. 0,00), 24.03.2020 8,47 % (SPY 9,06; 2. Q. 0,00); Lücken Schluss→Eröffnung 12.03.2020 -7,58 % (2. Q. -0,02), 16.03.2020 -11,94 % (2. Q. -0,36), 24.03.2020 7,59 % (2. Q. 0,00); Paare 17.03.2020/18.03.2020 4,87/-5,73 % (SPY 5,40/-5,06)
- EFA B: Sprünge 09.04.2025 7,72 % (SPY 10,50; 2. Q. 0,00); Eröffnungs-Ausreißer (zu Vortags-/Tagesschluss) 08.04.2025 3,58/3,93 % (2. Q. 0,00)
- AGG A: Sprünge 12.03.2020 -4,00 % (SPY -9,57; 2. Q. 0,00), 13.03.2020 1,57 % (SPY 8,55; 2. Q. 0,00), 16.03.2020 1,67 % (SPY -10,94; 2. Q. 0,00), 17.03.2020 -2,59 % (SPY 5,40; 2. Q. 0,00), 18.03.2020 -3,81 % (SPY -5,06; 2. Q. 0,00), 19.03.2020 2,23 % (SPY 0,21; 2. Q. -0,02), 23.03.2020 2,37 % (SPY -2,56; 2. Q. 0,00); Paare 25.02.2021/26.02.2021 -0,92/0,81 % (SPY -2,41/-0,52); Eröffnungs-Ausreißer (zu Vortags-/Tagesschluss) 09.03.2020 1,20/1,33 % (2. Q. 0,00), 24.03.2020 -0,99/-1,81 % (2. Q. 0,00)
- AGG B: Sprünge 13.06.2022 -1,64 % (SPY -3,80; 2. Q. 0,00), 28.09.2022 1,61 % (SPY 1,97; 2. Q. 0,00), 10.11.2022 2,15 % (SPY 5,50; 2. Q. 0,00); Lücken Schluss→Eröffnung 10.11.2022 1,51 % (2. Q. 0,00); Paare 06.11.2024/07.11.2024 -0,78/0,76 % (SPY 2,49/0,77); Eröffnungs-Ausreißer (zu Vortags-/Tagesschluss) 16.06.2022 -0,87/-1,11 % (2. Q. 0,00), 13.10.2022 -1,31/-1,00 % (2. Q. 0,00)
- Zusatz 2002–2015 (ohne zweite Quelle): ACWX hat in den ersten Handelswochen (April 2008) Eröffnungen bis +25 % über Vortags- und Tagesschluss (04.04.2008, 08.04.2008, 10.04.2008, 07.10.2008, 11.11.2008) – Fehldrucke, aber ACWX wird im Zusatz nicht benutzt. Übrige Zusatz-Funde liegen in den Krisenmonaten 2007–2009 mit gleichgerichteter SPY-Bewegung (Liste in der JSON).

**Eröffnung = Vortagsschluss je Jahr** (Hinweis auf veraltete Eröffnungskurse; bei BIL/SHY ist Gleichheit wegen der kleinen Tagesbewegung unter einem Cent normal):

| Jahr | SPY | BIL | SHY | ACWX | EFA | AGG |
|---|---|---|---|---|---|---|
| 1993 | 33 / 233 | – | – | – | – | – |
| 1994 | 24 / 252 | – | – | – | – | – |
| 1995 | 12 / 252 | – | – | – | – | – |
| 1996 | 10 / 254 | – | – | – | – | – |
| 1997 | 10 / 253 | – | – | – | – | – |
| 1998 | 5 / 252 | – | – | – | – | – |
| 1999 | 3 / 252 | – | – | – | – | – |
| 2000 | 4 / 252 | – | – | – | – | – |
| 2001 | 3 / 248 | – | – | – | 2 / 83 | – |
| 2002 | 2 / 252 | – | 3 / 107 | – | 2 / 252 | – |
| 2003 | 3 / 252 | – | 19 / 252 | – | 4 / 252 | 2 / 65 |
| 2004 | 1 / 252 | – | 29 / 252 | – | 6 / 252 | 22 / 252 |
| 2005 | 0 / 252 | – | 33 / 252 | – | 3 / 252 | 15 / 252 |
| 2006 | 8 / 251 | – | 21 / 251 | – | 2 / 251 | 15 / 251 |
| 2007 | 4 / 251 | 32 / 149 | 19 / 251 | – | 5 / 251 | 12 / 251 |
| 2008 | 1 / 253 | 63 / 253 | 12 / 253 | 0 / 191 | 3 / 253 | 9 / 253 |
| 2009 | 0 / 252 | 94 / 252 | 20 / 252 | 2 / 252 | 3 / 252 | 2 / 252 |
| 2010 | 1 / 252 | 122 / 252 | 22 / 252 | 3 / 252 | 2 / 252 | 14 / 252 |
| 2011 | 2 / 252 | 132 / 252 | 32 / 252 | 2 / 252 | 1 / 252 | 7 / 252 |
| 2012 | 0 / 250 | 151 / 250 | 69 / 250 | 5 / 250 | 2 / 250 | 10 / 250 |
| 2013 | 2 / 252 | 132 / 252 | 46 / 252 | 5 / 252 | 3 / 252 | 11 / 252 |
| 2014 | 2 / 252 | 130 / 252 | 32 / 252 | 6 / 252 | 4 / 252 | 5 / 252 |
| 2015 | 1 / 252 | 127 / 252 | 33 / 252 | 3 / 252 | 2 / 252 | 6 / 252 |
| 2016 | 10 / 252 | 134 / 252 | 28 / 252 | 2 / 252 | 7 / 252 | 8 / 252 |
| 2017 | 13 / 251 | 121 / 251 | 27 / 251 | 4 / 251 | 7 / 251 | 9 / 251 |
| 2018 | 0 / 251 | 84 / 251 | 33 / 251 | 2 / 251 | 5 / 251 | 2 / 251 |
| 2019 | 1 / 252 | 76 / 252 | 25 / 252 | 5 / 252 | 3 / 252 | 10 / 252 |
| 2020 | 0 / 253 | 120 / 253 | 56 / 253 | 0 / 253 | 4 / 253 | 12 / 253 |
| 2021 | 0 / 252 | 133 / 252 | 47 / 252 | 5 / 252 | 1 / 252 | 6 / 252 |
| 2022 | 0 / 251 | 87 / 251 | 13 / 251 | 4 / 251 | 1 / 251 | 4 / 251 |
| 2023 | 1 / 250 | 30 / 250 | 11 / 250 | 8 / 250 | 1 / 250 | 4 / 250 |
| 2024 | 3 / 252 | 27 / 252 | 11 / 252 | 4 / 252 | 1 / 252 | 6 / 252 |
| 2025 | 0 / 250 | 54 / 250 | 29 / 250 | 5 / 250 | 2 / 250 | 5 / 250 |
| 2026 | 0 / 176 | 33 / 176 | 15 / 176 | 2 / 176 | 0 / 176 | 3 / 176 |

Gegenprobe 2016–2026 (zweite Quelle): Tage mit Yahoo-Eröffnung = Vortagsschluss, an denen die erste reguläre Minute der zweiten Quelle um > 0,05 % abweicht (= bestätigt veraltet): SPY 19 von 28 (18.04.2016 0,31 %, 15.06.2016 -0,24 %, 16.06.2016 0,49 %, 01.07.2016 0,06 %, 20.07.2016 -0,26 %, 05.08.2016 -0,37 %, 21.10.2016 0,44 %, 07.11.2016 -1,37 %, 23.01.2017 0,17 %, 01.02.2017 -0,32 %, 02.02.2017 0,18 %, 08.02.2017 0,14 %, 09.02.2017 -0,14 %, 23.03.2017 0,12 %, 03.05.2017 0,19 %, 17.05.2017 0,83 %, 10.07.2017 0,07 %, 11.07.2017 0,08 %, 03.10.2017 -0,06 %); BIL 0 von 899; SHY 0 von 295; ACWX 1 von 41 (09.01.2018 0,14 %); EFA 7 von 32 (28.09.2016 -0,27 %, 29.09.2016 0,25 %, 10.10.2016 -0,17 %, 08.12.2016 0,19 %, 05.09.2017 0,25 %, 12.09.2017 -0,18 %, 29.09.2017 -0,19 %); AGG 2 von 69 (10.10.2016 0,10 %, 08.04.2019 0,06 %).

## 4 Splits

- **BIL 30.11.2017 (1:2, Vorkurse × 2,0000)**: Schluss zum Vortag um den Stichtag 27.11.2017 0,000 %, 28.11.2017 0,044 %, 29.11.2017 -0,022 %, 30.11.2017 0,000 %, 01.12.2017 -0,066 %, 04.12.2017 0,011 %, 05.12.2017 0,011 % – kein Sprung, die Kurse sind bereinigt. Ausschüttungsrendite (auf den Vortagsschluss) vor dem Stichtag 01.08.2017 0,070 %, 01.09.2017 0,072 %, 02.10.2017 0,070 %, 01.11.2017 0,076 %; danach 01.12.2017 0,072 %, 19.12.2017 0,090 %, 01.02.2018 0,094 %, 01.03.2018 0,086 %. Verhältnis der Renditen vorher/nachher 0,81 (bei fremder Basis wäre es 0,50 bzw. 2,00): **gleiche Basis**. Rundungsprobe der 43 Beträge vor dem Stichtag: geteilt durch den Kursfaktor auf drei Stellen rund 43, selbst rund 43.
- **EFA 09.06.2005 (3:1, Vorkurse × 0,3333)**: Schluss zum Vortag um den Stichtag 06.06.2005 0,661 %, 07.06.2005 0,510 %, 08.06.2005 -0,368 %, 09.06.2005 0,395 %, 10.06.2005 -0,381 %, 13.06.2005 -0,344 %, 14.06.2005 -0,115 % – kein Sprung, die Kurse sind bereinigt. Ausschüttungsrendite (auf den Vortagsschluss) vor dem Stichtag 23.12.2002 1,877 %, 16.12.2003 0,359 %, 22.12.2003 1,180 %, 23.12.2004 1,513 %; danach 23.12.2005 1,821 %, 21.12.2006 2,068 %, 24.12.2007 2,492 %, 25.06.2008 1,857 %. Verhältnis der Renditen vorher/nachher 0,69 (bei fremder Basis wäre es 3,00 bzw. 0,33): **gleiche Basis**. Rundungsprobe der 6 Beträge vor dem Stichtag: geteilt durch den Kursfaktor auf drei Stellen rund 5, selbst rund 1 – die Beträge sind nachweislich umgerechnet.
- BIL gegen die Rohkurse der zweiten Quelle (nicht splitbereinigt, vor dem 30.11.2017 × 2): 28.11.2017 Faktor 2, Abweichung 0,0000 % (ohne Faktor 100,00 %); 29.11.2017 Faktor 2, Abweichung 0,0000 % (ohne Faktor 100,00 %); 30.11.2017 Faktor 1, Abweichung 0,0000 % (ohne Faktor 0,00 %); 01.12.2017 Faktor 1, Abweichung 0,0000 % (ohne Faktor 0,00 %). Die Ausschüttungsbeträge vor dem Split stimmen mit Alpaca × 2 überein (Abschnitt 6a; Yahoo rundet den Rohbetrag auf drei Stellen und verdoppelt dann).

## 5 Ausschüttungen

| Jahr | SPY | BIL | SHY | ACWX | EFA | AGG |
|---|---|---|---|---|---|---|
| 1993 | 4 | – | – | – | – | – |
| 1994 | 4 | – | – | – | – | – |
| 1995 | 4 | – | – | – | – | – |
| 1996 | 4 | – | – | – | – | – |
| 1997 | 4 | – | – | – | – | – |
| 1998 | 4 | – | – | – | – | – |
| 1999 | 4 | – | – | – | – | – |
| 2000 | 4 | – | – | – | – | – |
| 2001 | 4 | – | – | – | 2 | – |
| 2002 | 4 | – | 5 | – | 1 | – |
| 2003 | 4 | – | 13 | – | 2 | 3 |
| 2004 | 5 | – | 12 | – | 1 | 12 |
| 2005 | 4 | – | 12 | – | 1 | 12 |
| 2006 | 4 | – | 12 | – | 1 | 12 |
| 2007 | 4 | 7 | 12 | – | 1 | 12 |
| 2008 | 4 | 12 | 12 | 1 | 2 | 12 |
| 2009 | 4 | 11 | 12 | 2 | 2 | 12 |
| 2010 | 4 | 0 | 12 | 2 | 2 | 12 |
| 2011 | 4 | 1 | 12 | 2 | 2 | 12 |
| 2012 | 4 | 0 | 11 | 1 | 2 | 12 |
| 2013 | 4 | 0 | 12 | 2 | 2 | 12 |
| 2014 | 4 | 0 | 12 | 2 | 2 | 12 |
| 2015 | 4 | 0 | 12 | 2 | 2 | 12 |
| 2016 | 4 | 2 | 12 | 2 | 2 | 12 |
| 2017 | 4 | 12 | 12 | 2 | 2 | 12 |
| 2018 | 4 | 12 | 12 | 3 | 2 | 12 |
| 2019 | 4 | 12 | 12 | 2 | 2 | 12 |
| 2020 | 4 | 5 | 12 | 2 | 2 | 12 |
| 2021 | 4 | 0 | 12 | 3 | 3 | 12 |
| 2022 | 4 | 9 | 12 | 2 | 2 | 12 |
| 2023 | 4 | 12 | 12 | 2 | 2 | 12 |
| 2024 | 4 | 12 | 12 | 2 | 2 | 12 |
| 2025 | 4 | 12 | 12 | 2 | 2 | 12 |
| 2026 | 2 | 8 | 8 | 1 | 1 | 8 |

- **SPY**: 135 Ex-Tage bis 15.09.2026, erwartet 4 je volles Jahr. Abweichende Jahre: 2004: 5. Fehlende Monate: 0. Sonst mehrfach belegte Monate: keine. Ex-Tag kein SPY-Tag / ohne Zeile der Reihe / an der ersten Zeile: 0 / 0 / 0; nicht positive Beträge 0. Rendite je Ausschüttung Median 0,440 %, höchstens 0,805 %.
- **BIL**: 127 Ex-Tage bis 15.09.2026, erwartet 12 je volles Jahr (Monatszahler: Dezember mit zwei Ex-Tagen in 9 Jahren, der Januar entfällt dann planmäßig). Abweichende Jahre: 2009: 11, 2010: 0, 2011: 1, 2012: 0, 2013: 0, 2014: 0, 2015: 0, 2016: 2, 2020: 5, 2021: 0, 2022: 9. Fehlende Monate: 104 (2010-01, 2010-02, 2010-03, 2010-04, 2010-05, 2010-06, 2010-07, 2010-08, 2010-09, 2010-10, 2010-11, 2010-12, …). Sonst mehrfach belegte Monate: keine. Ex-Tag kein SPY-Tag / ohne Zeile der Reihe / an der ersten Zeile: 0 / 0 / 0; nicht positive Beträge 0. Rendite je Ausschüttung Median 0,175 %, höchstens 0,460 %.
- **SHY**: 289 Ex-Tage bis 15.09.2026, erwartet 12 je volles Jahr (Monatszahler: Dezember mit zwei Ex-Tagen in 23 Jahren, der Januar entfällt dann planmäßig). Abweichende Jahre: 2003: 13, 2012: 11. Fehlende Monate: 1 (2012-11). Sonst mehrfach belegte Monate: 2003-12 (2003-12-01 (0,132 %), 2003-12-16 (0,407 %), 2003-12-31 (0,141 %)). Ex-Tag kein SPY-Tag / ohne Zeile der Reihe / an der ersten Zeile: 0 / 0 / 0; nicht positive Beträge 0. Rendite je Ausschüttung Median 0,136 %, höchstens 0,689 %; über dem Dreifachen des Medians: 01.12.2009 0,689 %.
- **ACWX**: 37 Ex-Tage bis 15.09.2026, erwartet 2 je volles Jahr. Abweichende Jahre: 2012: 1, 2018: 3, 2021: 3. Fehlende Monate: 0. Sonst mehrfach belegte Monate: 2018-12 (2018-12-18 (0,847 %), 2018-12-28 (0,050 %)); 2021-12 (2021-12-13 (1,458 %), 2021-12-30 (0,153 %)). Ex-Tag kein SPY-Tag / ohne Zeile der Reihe / an der ersten Zeile: 0 / 0 / 0; nicht positive Beträge 0. Rendite je Ausschüttung Median 1,400 %, höchstens 1,863 %.
- **EFA**: 47 Ex-Tage bis 15.09.2026, erwartet 2 je volles Jahr. Abweichende Jahre: 2002: 1, 2004: 1, 2005: 1, 2006: 1, 2007: 1, 2021: 3. Fehlende Monate: 0. Sonst mehrfach belegte Monate: 2003-12 (2003-12-16 (0,359 %), 2003-12-22 (1,180 %)); 2021-12 (2021-12-13 (1,710 %), 2021-12-30 (0,206 %)). Ex-Tag kein SPY-Tag / ohne Zeile der Reihe / an der ersten Zeile: 0 / 0 / 0; nicht positive Beträge 0. Rendite je Ausschüttung Median 1,513 %, höchstens 2,492 %.
- **AGG**: 275 Ex-Tage bis 15.09.2026, erwartet 12 je volles Jahr (Monatszahler: Dezember mit zwei Ex-Tagen in 22 Jahren, der Januar entfällt dann planmäßig). Abweichende Jahre: keine. Fehlende Monate: 0. Sonst mehrfach belegte Monate: keine. Ex-Tag kein SPY-Tag / ohne Zeile der Reihe / an der ersten Zeile: 0 / 0 / 0; nicht positive Beträge 0. Rendite je Ausschüttung Median 0,254 %, höchstens 0,593 %.
- Einordnung der Lücken: BIL zahlte 2010–2015 und von Mitte 2020 bis Anfang 2022 nichts (Geldmarktzins unter den Kosten des Fonds) – im Fenster A/B betrifft das nur eine Ertragsquelle nahe null. SHY ohne November 2012 (Nachbarmonate ≈ 0,02 % des Kurses), EFA 2004–2007 und ACWX 2012 nur eine Ausschüttung je Jahr: vor 2016 ohne zweite Quelle nicht prüfbar, Größenordnung je Fall unter 1 %.

**Gesamtertrag aus Schluss + Ausschüttung (REGEL §2.5) gegen `adjclose`.** „Tag max“ = größte Abweichung der Tagesrenditen; „Rest Yahoo-Verfahren“ = dieselbe Abweichung, wenn man die Ausschüttung wie Yahoo (Faktor 1 − D/C(t−1)) statt wie §2.5 einrechnet – ist sie ≈ 0, enthält `adjclose` genau die gemeldeten Ausschüttungen und der Rest ist reiner Verfahrensunterschied; „Faktor“ = TR-Wachstum / adjclose-Wachstum − 1 über den Zeitraum.

| Reihe | Zeitraum | Tag max | Tage > 0,01 % / > 0,1 % | Rest Yahoo-Verfahren max | Faktor |
|---|---|---|---|---|---|
| SPY | AV | 18.03.2016 -0,0020 % (Ex-Tag) | 0 / 0 | -0,0001 % | 0,0030 % |
| SPY | A | 20.03.2020 0,0264 % (Ex-Tag) | 2 / 0 | -0,0001 % | 0,0474 % |
| SPY | B | 16.12.2022 0,0055 % (Ex-Tag) | 0 / 0 | 0,0000 % | 0,0190 % |
| SPY | Z | 20.03.2020 0,0264 % (Ex-Tag) | 5 / 0 | -0,0001 % | 0,0544 % |
| BIL | AV | 09.11.2016 0,0001 % | 0 / 0 | 0,0001 % | 0,0000 % |
| BIL | A | 24.01.2018 0,0001 % | 0 / 0 | 0,0001 % | -0,0003 % |
| BIL | B | 01.06.2023 -0,0002 % (Ex-Tag) | 0 / 0 | 0,0001 % | -0,0040 % |
| BIL | Z | 01.10.2007 -0,0004 % (Ex-Tag) | 0 / 0 | 0,0001 % | – |
| SHY | AV | 25.08.2016 -0,0001 % | 0 / 0 | -0,0001 % | 0,0003 % |
| SHY | A | 01.08.2019 -0,0005 % (Ex-Tag) | 0 / 0 | 0,0001 % | 0,0000 % |
| SHY | B | 01.08.2025 -0,0016 % (Ex-Tag) | 0 / 0 | -0,0001 % | -0,0027 % |
| SHY | Z | 16.12.2003 -0,0019 % (Ex-Tag) | 0 / 0 | 0,0002 % | -0,0113 % |
| ACWX | AV | 22.06.2016 -0,0008 % (Ex-Tag) | 0 / 0 | 0,0000 % | -0,0006 % |
| ACWX | A | 19.06.2018 0,0150 % (Ex-Tag) | 3 / 0 | -0,0001 % | 0,0114 % |
| ACWX | B | 09.06.2022 0,0382 % (Ex-Tag) | 6 / 0 | 0,0000 % | 0,0808 % |
| ACWX | Z | 21.06.2012 0,0515 % (Ex-Tag) | 17 / 0 | -0,0001 % | – |
| EFA | AV | 22.06.2016 0,0012 % (Ex-Tag) | 0 / 0 | 0,0000 % | 0,0010 % |
| EFA | A | 19.06.2018 0,0181 % (Ex-Tag) | 3 / 0 | 0,0000 % | 0,0107 % |
| EFA | B | 09.06.2022 0,0464 % (Ex-Tag) | 6 / 0 | 0,0000 % | 0,0995 % |
| EFA | Z | 21.06.2012 0,0612 % (Ex-Tag) | 20 / 0 | 0,0001 % | -0,0035 % |
| AGG | AV | 01.03.2016 0,0006 % (Ex-Tag) | 0 / 0 | -0,0001 % | 0,0021 % |
| AGG | A | 01.08.2019 -0,0019 % (Ex-Tag) | 0 / 0 | 0,0001 % | -0,0011 % |
| AGG | B | 01.11.2023 -0,0033 % (Ex-Tag) | 0 / 0 | 0,0001 % | -0,0080 % |
| AGG | Z | 03.11.2008 0,0068 % (Ex-Tag) | 0 / 0 | -0,0002 % | – |

## 6 Zweite Quelle

### 6a Alpaca-Maßnahmen (Barausschüttungen ab 2016)

Betrag anders = Verhältnis Yahoo/Alpaca (Alpaca vor einem Split mit dem Kursfaktor umgerechnet); nur Yahoo / nur Alpaca = Ausschüttung in % des Vortagsschlusses.

| Reihe | abgedeckt | Yahoo / Alpaca | gleich | Betrag anders | nur Yahoo | nur Alpaca | andere Maßnahmen |
|---|---|---|---|---|---|---|---|
| SPY | 01.01.2016 .. 03.09.2026 | 42 / 40 | 39 | 17.12.2021 Yahoo = 0,998 × Alpaca | 18.03.2016 (0,513 %); 15.06.2018 (0,447 %) | – | – |
| BIL | 01.01.2016 .. 15.09.2026 | 96 / 95 | 94 | 01.09.2022 Yahoo = 1,004 × Alpaca | 01.03.2022 (0,024 %) | – | reverse_splits 30.11.2017 2→1 |
| SHY | 01.01.2016 .. 15.09.2026 | 128 / 128 | 127 | – | 01.08.2016 (0,060 %) | – | – |
| ACWX | 01.01.2016 .. 03.09.2026 | 23 / 23 | 23 | – | – | – | – |
| EFA | 01.01.2016 .. 03.09.2026 | 22 / 22 | 22 | – | – | – | – |
| AGG | 01.01.2016 .. 15.09.2026 | 128 / 128 | 126 | 01.11.2018 Yahoo = 2,001 × Alpaca | 01.08.2016 (0,183 %) | 14.12.2017 (0,091 %) | – |

Lesart: „gleich“ = gleicher Ex-Tag und Betrag bis auf Yahoos Rundung auf drei Stellen. **Doppelt geführt bei Yahoo: AGG 01.11.2018: Yahoo = 2,001 × Alpaca** – die Nachbarmonate liegen beim einfachen Betrag (Einzelheiten in Abschnitt 7). Fälle „nur Yahoo“ 2016 und SPY 15.06.2018 sind bekannte Lücken bei Alpaca; die übrigen Fälle stehen in Abschnitt 7 mit ihrer Größe.

### 6b Alpaca-Minutenarchiv (Rohkurse, SIP)

Aufbau: je Kürzel und Jahr eine Datei (Format 2, Felder [Zeit ms UTC, Schluss, Umsatz, Hoch, Tief, Eröffnung], Quelle durchweg „alpaca“, fremde Kerzen 0). Eröffnung = O der ersten regulären Minute ab 09:30 New York; Tagesschluss-Kandidaten: C1 = O der Schlusskerze (16:00, an Halbtagen 13:00), C2 = C der Schlusskerze, C3 = C der letzten regulären Minute. Halbtage nach NYSE-Regel; gegen den Sitzungskalender der SPY-Datei geprüft: 12.08.2019: letzte reguläre SPY-Kerze 15:31, Schluss laut Regel 16:00 (Lücke in den SPY-Minuten, nicht im Kalender). Tage, an denen die zweite Quelle den Schluss nicht hat (letzte Kerze > 5 min vor Schluss, keine Schlusskerze): SPY 1, BIL 1, SHY 0, ACWX 1, EFA 1, AGG 1 (nicht verglichen). Fehlende Tage in der zweiten Quelle: SPY 0, BIL 0, SHY 0, ACWX 0, EFA 0, AGG 0; Tage nur in der zweiten Quelle: SPY 0, BIL 0, SHY 0, ACWX 0, EFA 0, AGG 0.

**Projektwissen „amtlicher Schluss = O der 16:00-Kerze“ selbst geprüft** (2016–2026, Betrag der relativen Abweichung zu Yahoo, Median / 95-%-Punkt / 99-%-Punkt in %):

| Reihe | C1 = O 16:00 | C2 = C 16:00 | C3 = C letzte reguläre | ohne 16:00-Kerze |
|---|---|---|---|---|
| SPY | 0,0091 / 0,0299 / 0,0682 | 0,0292 / 0,1202 / 0,2114 | 0,0084 / 0,0303 / 0,0681 | 1 |
| BIL | 0,0000 / 0,0000 / 0,0000 | 0,0000 / 0,0109 / 0,0219 | 0,0055 / 0,0219 / 0,0219 | 18 |
| SHY | 0,0000 / 0,0123 / 0,0359 | 0,0000 / 0,0123 / 0,0362 | 0,0062 / 0,0239 / 0,0361 | 1 |
| ACWX | 0,0000 / 0,0430 / 0,0823 | 0,0000 / 0,0000 / 0,0550 | 0,0189 / 0,0690 / 0,1083 | 177 |
| EFA | 0,0000 / 0,0381 / 0,0672 | 0,0151 / 0,0885 / 0,1668 | 0,0149 / 0,0451 / 0,0753 | 1 |
| AGG | 0,0000 / 0,0000 / 0,0203 | 0,0000 / 0,0178 / 0,0596 | 0,0092 / 0,0267 / 0,0468 | 1 |

Befund: Für die NYSE-Arca-Werte BIL, EFA, AGG trifft C1 am besten; bei SPY liegen C1 und C3 gleichauf (Median ≈ 0,009 %); bei den Nasdaq-Werten ACWX und SHY trifft C2 (Schluss der 16:00-Kerze) mindestens so gut – dort kommt die Schlussauktion nicht als erster Abschluss der Minute. Gerechnet wird unten mit C1 (sonst C3); bei Abweichungen > 0,2 % steht dabei, ob ein anderer Kandidat passt.

**Kennzahlen Yahoo gegen zweite Quelle** (Betrag der relativen Abweichung in %: Median / 99-%-Punkt / Maximum; n Tage):

| Reihe | Zeitraum | Tage | Eröffnung | Schluss (C1, sonst C3) | Eröffnung > 0,5 % | Schluss > 0,2 % | erste Kerze nach 09:30 |
|---|---|---|---|---|---|---|---|
| SPY | 2016-2026 | 2690 | 0,0000 / 0,0555 / 1,3715 | 0,0091 / 0,0682 / 0,9458 | 2 | 5 | 0 |
| SPY | AV2016 | 253 | 0,0000 / 0,4367 / 1,3715 | 0,0100 / 0,0575 / 0,1038 | 1 | 0 | 0 |
| SPY | A | 1183 | 0,0000 / 0,1444 / 0,8316 | 0,0106 / 0,0935 / 0,6446 | 1 | 4 | 0 |
| SPY | B | 1254 | 0,0000 / 0,0117 / 0,0228 | 0,0076 / 0,0453 / 0,9458 | 0 | 1 | 0 |
| BIL | 2016-2026 | 2690 | 0,0000 / 0,0055 / 0,0219 | 0,0000 / 0,0055 / 0,0328 | 0 | 0 | 4 |
| BIL | AV2016 | 253 | 0,0000 / 0,0109 / 0,0219 | 0,0000 / 0,0219 / 0,0328 | 0 | 0 | 2 |
| BIL | A | 1183 | 0,0000 / 0,0109 / 0,0219 | 0,0000 / 0,0000 / 0,0219 | 0 | 0 | 2 |
| BIL | B | 1254 | 0,0000 / 0,0055 / 0,0109 | 0,0000 / 0,0055 / 0,0109 | 0 | 0 | 0 |
| SHY | 2016-2026 | 2690 | 0,0000 / 0,0122 / 0,0464 | 0,0000 / 0,0359 / 0,1896 | 0 | 0 | 0 |
| SHY | AV2016 | 253 | 0,0000 / 0,0000 / 0,0234 | 0,0000 / 0,0352 / 0,0472 | 0 | 0 | 0 |
| SHY | A | 1183 | 0,0000 / 0,0119 / 0,0464 | 0,0000 / 0,0361 / 0,1896 | 0 | 0 | 0 |
| SHY | B | 1254 | 0,0000 / 0,0123 / 0,0124 | 0,0000 / 0,0247 / 0,1449 | 0 | 0 | 0 |
| ACWX | 2016-2026 | 2690 | 0,0000 / 0,1041 / 0,3238 | 0,0000 / 0,0789 / 0,4757 | 0 | 6 | 3 |
| ACWX | AV2016 | 253 | 0,0000 / 0,0025 / 0,1742 | 0,0000 / 0,0823 / 0,1010 | 0 | 0 | 2 |
| ACWX | A | 1183 | 0,0000 / 0,1054 / 0,2302 | 0,0000 / 0,0954 / 0,4757 | 0 | 5 | 0 |
| ACWX | B | 1254 | 0,0000 / 0,0850 / 0,3238 | 0,0000 / 0,0683 / 0,4692 | 0 | 1 | 1 |
| EFA | 2016-2026 | 2690 | 0,0000 / 0,0458 / 0,4573 | 0,0000 / 0,0672 / 0,2839 | 0 | 1 | 0 |
| EFA | AV2016 | 253 | 0,0000 / 0,1883 / 0,2705 | 0,0171 / 0,0523 / 0,0529 | 0 | 0 | 0 |
| EFA | A | 1183 | 0,0000 / 0,1431 / 0,4573 | 0,0000 / 0,0778 / 0,1681 | 0 | 0 | 0 |
| EFA | B | 1254 | 0,0000 / 0,0257 / 0,0514 | 0,0000 / 0,0546 / 0,2839 | 0 | 1 | 0 |
| AGG | 2016-2026 | 2690 | 0,0000 / 0,0646 / 0,5670 | 0,0000 / 0,0203 / 0,1853 | 1 | 0 | 0 |
| AGG | AV2016 | 253 | 0,0000 / 0,0725 / 0,0987 | 0,0000 / 0,0444 / 0,0534 | 0 | 0 | 0 |
| AGG | A | 1183 | 0,0000 / 0,0975 / 0,5670 | 0,0000 / 0,0185 / 0,1853 | 1 | 0 | 0 |
| AGG | B | 1254 | 0,0000 / 0,0104 / 0,1407 | 0,0000 / 0,0181 / 0,0319 | 0 | 0 | 0 |

Alle Tage mit Eröffnung > 0,5 % bzw. Schluss > 0,2 % (2016–2026):

- SPY 07.11.2016 **Eröffnung** -1,371 % (erste Kerze der zweiten Quelle 09:30): Yahoo-Eröffnung = Vortagsschluss (veraltet)
- SPY 17.05.2017 **Eröffnung** 0,832 % (erste Kerze der zweiten Quelle 09:30): Yahoo-Eröffnung = Vortagsschluss (veraltet)
- SPY 13.03.2020 **Schluss** -0,598 % gegen C1 (gegen C1/C2/C3 -0,598/-0,285/-0,594 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -0,649/7,909 %): innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,2851 %)
- SPY 17.03.2020 **Schluss** -0,645 % gegen C1 (gegen C1/C2/C3 -0,645/0,477/-0,547 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -1,315/6,635 %): innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,4769 %)
- SPY 18.03.2020 **Schluss** -0,407 % gegen C1 (gegen C1/C2/C3 -0,407/0,448/-0,419 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -3,370/5,254 %): innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,4067 %)
- SPY 19.03.2020 **Schluss** -0,270 % gegen C1 (gegen C1/C2/C3 -0,270/0,062/-0,270 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -2,777/3,570 %): innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,0624 %)
- SPY 09.04.2025 **Schluss** 0,946 % gegen C1 (gegen C1/C2/C3 0,946/0,794/0,966 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle 0,419/11,271 %): ÜBER dem Hoch der regulären Sitzung der zweiten Quelle (um 0,419 %), nur in der Schlusskerze (Auktion/Nachbörse) gehandelt (nächster Schluss-Kandidat 0,7937 %)
- ACWX 01.06.2017 **Schluss** 0,281 % gegen C1 (gegen C1/C2/C3 0,281/0,216/0,281 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle 0,281/0,760 %): ÜBER dem Hoch der regulären Sitzung der zweiten Quelle (um 0,281 %), nur in der Schlusskerze (Auktion/Nachbörse) gehandelt (nächster Schluss-Kandidat 0,2159 %)
- ACWX 11.03.2020 **Schluss** -0,225 % gegen C1 (gegen C1/C2/C3 -0,225/0,000/-0,225 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -2,724/0,502 %): deckt sich mit einem Schluss-Kandidaten der zweiten Quelle (nächster Schluss-Kandidat 0 %)
- ACWX 17.03.2020 **Schluss** -0,476 % gegen C1 (gegen C1/C2/C3 -0,476/0,000/-0,140 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -0,463/4,741 %): deckt sich mit einem Schluss-Kandidaten der zweiten Quelle (nächster Schluss-Kandidat 0 %)
- ACWX 25.03.2020 **Schluss** 0,271 % gegen C1 (gegen C1/C2/C3 0,271/0,000/0,108 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -1,255/3,731 %): deckt sich mit einem Schluss-Kandidaten der zweiten Quelle (nächster Schluss-Kandidat 0 %)
- ACWX 31.03.2020 **Schluss** 0,293 % gegen C1 (gegen C1/C2/C3 0,293/0,000/0,213 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -0,712/1,319 %): deckt sich mit einem Schluss-Kandidaten der zweiten Quelle (nächster Schluss-Kandidat 0 %)
- ACWX 01.04.2024 **Schluss** 0,469 % gegen C1 (gegen C1/C2/C3 0,469/0,356/0,450 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle 0,000/0,734 %): innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,3562 %)
- EFA 09.03.2022 **Schluss** -0,284 % gegen C1 (gegen C1/C2/C3 -0,284/-0,171/-0,241 %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle -0,665/1,576 %): innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,1706 %)
- AGG 12.03.2020 **Eröffnung** -0,567 % (erste Kerze der zweiten Quelle 09:30): innerhalb der Spanne der ersten Minute der zweiten Quelle

**Ausführungstage R1/R2** (erster Handelstag jedes Monats; A ab Februar 2017): Abweichung der Yahoo-Eröffnung gegen die zweite Quelle in %. Zusammenfassung: A: SPY max -0,3154 % (01.02.2017), > 0,05 %: 1; BIL max 0,0109 % (01.02.2021), > 0,05 %: 0; ACWX max 0,0000 % (01.02.2017), > 0,05 %: 0; AGG max 0,1079 % (01.08.2019), > 0,05 %: 3 — B: SPY max -0,0089 % (01.02.2022), > 0,05 %: 0; BIL max 0,0055 % (01.05.2024), > 0,05 %: 0; ACWX max 0,0197 % (01.08.2023), > 0,05 %: 0; AGG max 0,0711 % (01.07.2026), > 0,05 %: 1.

| Monat | Tag | SPY | BIL | ACWX | AGG | SHY (N2) | EFA (N2) |
|---|---|---|---|---|---|---|---|
| A 2017-02 | 01.02.2017 | -0,3154 **veraltet** | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2017-03 | 01.03.2017 | 0,0042 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2017-04 | 03.04.2017 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2017-05 | 01.05.2017 | -0,0042 | 0,0000 | 0,0000 | 0,0460 | 0,0000 | 0,0000 |
| A 2017-06 | 01.06.2017 | 0,0041 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2017-07 | 03.07.2017 | -0,0123 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2017-08 | 01.08.2017 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | -0,0148 |
| A 2017-09 | 01.09.2017 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2017-10 | 02.10.2017 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0146 |
| A 2017-11 | 01.11.2017 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2017-12 | 01.12.2017 | -0,0038 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | -0,1431 |
| A 2018-01 | 02.01.2018 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-02 | 01.02.2018 | 0,0107 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-03 | 01.03.2018 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-04 | 02.04.2018 | -0,0038 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-05 | 01.05.2018 | -0,0114 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-06 | 01.06.2018 | 0,0037 | 0,0000 | 0,0000 | -0,0094 | 0,0000 | 0,0000 |
| A 2018-07 | 02.07.2018 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-08 | 01.08.2018 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-09 | 04.09.2018 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-10 | 01.10.2018 | -0,0069 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-11 | 01.11.2018 | -0,0074 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2018-12 | 03.12.2018 | 0,0071 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2019-01 | 02.01.2019 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2019-02 | 01.02.2019 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2019-03 | 01.03.2019 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2019-04 | 01.04.2019 | -0,0035 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2019-05 | 01.05.2019 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0150 |
| A 2019-06 | 03.06.2019 | -0,0036 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2019-07 | 01.07.2019 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0059 | 0,0000 |
| A 2019-08 | 01.08.2019 | 0,0000 | 0,0000 | 0,0000 | 0,1079 | 0,0000 | 0,0000 |
| A 2019-09 | 03.09.2019 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2019-10 | 01.10.2019 | 0,0000 | 0,0000 | 0,0000 | 0,0621 | 0,0000 | 0,0000 |
| A 2019-11 | 01.11.2019 | 0,0033 | 0,0000 | 0,0000 | 0,0975 | 0,0000 | 0,0000 |
| A 2019-12 | 02.12.2019 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2020-01 | 02.01.2020 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | -0,0143 |
| A 2020-02 | 03.02.2020 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2020-03 | 02.03.2020 | 0,0034 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2020-04 | 01.04.2020 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0231 | 0,0387 |
| A 2020-05 | 01.05.2020 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0231 | 0,0000 |
| A 2020-06 | 01.06.2020 | 0,0033 | 0,0000 | 0,0000 | 0,0000 | 0,0058 | 0,0000 |
| A 2020-07 | 01.07.2020 | 0,0032 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2020-08 | 03.08.2020 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2020-09 | 01.09.2020 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2020-10 | 01.10.2020 | 0,0000 | 0,0000 | 0,0000 | 0,0170 | 0,0000 | -0,0156 |
| A 2020-11 | 02.11.2020 | 0,0000 | 0,0000 | 0,0000 | -0,0341 | -0,0046 | 0,0000 |
| A 2020-12 | 01.12.2020 | 0,0027 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2021-01 | 04.01.2021 | 0,0000 | 0,0000 | 0,0000 | 0,0424 | 0,0000 | 0,0000 |
| A 2021-02 | 01.02.2021 | 0,0000 | 0,0109 | 0,0000 | 0,0085 | 0,0058 | 0,0000 |
| A 2021-03 | 01.03.2021 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | -0,0133 |
| A 2021-04 | 01.04.2021 | 0,0000 | 0,0000 | 0,0000 | -0,0176 | 0,0000 | 0,0000 |
| A 2021-05 | 03.05.2021 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0058 | 0,0000 |
| A 2021-06 | 01.06.2021 | 0,0000 | 0,0000 | 0,0000 | -0,0350 | 0,0000 | 0,0000 |
| A 2021-07 | 01.07.2021 | 0,0093 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2021-08 | 02.08.2021 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| A 2021-09 | 01.09.2021 | -0,0044 | 0,0000 | 0,0000 | 0,0000 | 0,0023 | 0,0000 |
| B 2021-10 | 01.10.2021 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2021-11 | 01.11.2021 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2021-12 | 01.12.2021 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0058 | 0,0000 |
| B 2022-01 | 03.01.2022 | -0,0042 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2022-02 | 01.02.2022 | -0,0089 | 0,0000 | 0,0000 | 0,0000 | 0,0059 | 0,0000 |
| B 2022-03 | 01.03.2022 | 0,0000 | 0,0000 | 0,0000 | 0,0181 | 0,0059 | 0,0000 |
| B 2022-04 | 01.04.2022 | -0,0022 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2022-05 | 02.05.2022 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2022-06 | 01.06.2022 | 0,0048 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2022-07 | 01.07.2022 | 0,0080 | 0,0000 | 0,0000 | 0,0000 | 0,0060 | 0,0000 |
| B 2022-08 | 01.08.2022 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2022-09 | 01.09.2022 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2022-10 | 03.10.2022 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2022-11 | 01.11.2022 | 0,0000 | 0,0051 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2022-12 | 01.12.2022 | -0,0073 | 0,0000 | 0,0000 | 0,0000 | 0,0062 | -0,0147 |
| B 2023-01 | 03.01.2023 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2023-02 | 01.02.2023 | -0,0002 | 0,0000 | 0,0000 | 0,0000 | 0,0024 | 0,0000 |
| B 2023-03 | 01.03.2023 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0062 | 0,0000 |
| B 2023-04 | 03.04.2023 | -0,0024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2023-05 | 01.05.2023 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2023-06 | 01.06.2023 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2023-07 | 03.07.2023 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | -0,0138 |
| B 2023-08 | 01.08.2023 | 0,0000 | 0,0000 | 0,0197 | 0,0000 | 0,0000 | 0,0000 |
| B 2023-09 | 01.09.2023 | 0,0000 | 0,0011 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2023-10 | 02.10.2023 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2023-11 | 01.11.2023 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2023-12 | 01.12.2023 | 0,0022 | 0,0000 | 0,0000 | 0,0000 | 0,0123 | 0,0069 |
| B 2024-01 | 02.01.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-02 | 01.02.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-03 | 01.03.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-04 | 01.04.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-05 | 01.05.2024 | 0,0000 | 0,0055 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-06 | 03.06.2024 | 0,0000 | 0,0011 | 0,0000 | 0,0000 | 0,0000 | -0,0123 |
| B 2024-07 | 01.07.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | -0,0127 |
| B 2024-08 | 01.08.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-09 | 03.09.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-10 | 01.10.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-11 | 01.11.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2024-12 | 02.12.2024 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-01 | 02.01.2025 | 0,0000 | 0,0055 | 0,0000 | 0,0000 | 0,0061 | 0,0000 |
| B 2025-02 | 03.02.2025 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-03 | 03.03.2025 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-04 | 01.04.2025 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-05 | 01.05.2025 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-06 | 02.06.2025 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0061 | 0,0000 |
| B 2025-07 | 01.07.2025 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-08 | 01.08.2025 | 0,0000 | 0,0055 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-09 | 02.09.2025 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0060 | 0,0000 |
| B 2025-10 | 01.10.2025 | 0,0015 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-11 | 03.11.2025 | 0,0015 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2025-12 | 01.12.2025 | 0,0015 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2026-01 | 02.01.2026 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2026-02 | 02.02.2026 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0060 | 0,0000 |
| B 2026-03 | 02.03.2026 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0097 |
| B 2026-04 | 01.04.2026 | 0,0031 | 0,0000 | 0,0000 | 0,0000 | 0,0061 | 0,0000 |
| B 2026-05 | 01.05.2026 | 0,0000 | 0,0055 | 0,0000 | 0,0000 | 0,0061 | 0,0000 |
| B 2026-06 | 01.06.2026 | 0,0026 | 0,0000 | 0,0014 | 0,0000 | 0,0000 | 0,0000 |
| B 2026-07 | 01.07.2026 | 0,0054 | 0,0000 | 0,0000 | 0,0711 | 0,0000 | 0,0000 |
| B 2026-08 | 03.08.2026 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 | 0,0000 |
| B 2026-09 | 01.09.2026 | -0,0026 | 0,0000 | 0,0000 | 0,0000 | -0,0122 | 0,0000 |

**Starttage** (Kauf zur Eröffnung, Maßstab immer SPY): A SPY max -0,3154 % (01.02.2017), BIL max 0,0000 % (04.01.2017), ACWX max 0,0000 % (04.01.2017), AGG max 0,0000 % (04.01.2017); B SPY max 0,0023 % (23.09.2021), BIL max 0,0000 % (16.09.2021), ACWX max 0,0000 % (16.09.2021), AGG max 0,0000 % (16.09.2021). **Endtage** (Schluss): 15.09.2021 SPY 0,0045, BIL 0,0000, SHY 0,0000, ACWX 0,0000, EFA 0,0000, AGG -0,0215; 15.09.2026 SPY 0,0013, BIL 0,0000, SHY 0,0000, ACWX 0,0000, EFA 0,0000, AGG 0,0000 (%).

**Monatsend-Schlüsse 2016-01 bis 2026-08** (Signaltage; 128 Monate): SPY Median 0,0146 %, max -0,1328 % (29.03.2018), > 0,05 %: 11; BIL Median 0,0000 %, max 0,0219 % (28.04.2017), > 0,05 %: 0; SHY Median 0,0000 %, max 0,0491 % (30.11.2022), > 0,05 %: 0; ACWX Median 0,0000 %, max 0,2930 % (31.03.2020), > 0,05 %: 17; EFA Median 0,0159 %, max -0,1681 % (31.03.2020), > 0,05 %: 16; AGG Median 0,0000 %, max -0,0520 % (31.03.2020), > 0,05 %: 1. Der Monatsend-Schluss 31.12.2015 (Bezug des ersten R2-Signals in A) liegt vor der zweiten Quelle.

**Kipp-Probe** (nur Signale nach REGEL §4, keine Erträge): Variante „Schluss“ – jeder Yahoo-Schluss ab 2016 durch den der zweiten Quelle ersetzt (Ausschüttungen Yahoo): R1 0 von 128 Monatsenden anders, R2 0 von 117, R2 mit N2-Reihen 0 von 117, R3-Zone (unter/im/über dem 1-%-Band) an 1 von 2.690 Tagen (04.03.2016), R3-Zustand (investiert/draußen, mit Gedächtnis ab 1993) an 0 von 2.690 Tagen. Variante „Ausschüttung“ – Yahoo-Schlüsse, abweichende Beträge durch Alpaca ersetzt, Alpaca-only ergänzt: R1 0, R2 0, R2 (N2) 0 anders. Damit hängen die Signale der Hauptlesart in Vorlauf A, A und B an keiner Stelle an der Wahl der Quelle; die Datenabweichungen wirken nur über Ausführungskurse und Ausschüttungen (Abschnitt 7).

### 6c Dritte Quelle

Stooq-CSV https://stooq.com/q/d/l/?s=spy.us&i=d (Abruf von Hand am 05.10.2026, nichts gespeichert): nicht erreichbar: die Antwort ist eine HTML-Seite mit JavaScript-Rechenaufgabe (Bot-Schutz) statt CSV; nicht umgangen, weggelassen. Die Jahre 2002–2015 bleiben damit ohne Gegenprobe.

## 7 Einordnung: Befunde, die eine Zahl des Urteils berühren könnten

Regel: Kurse gelistet ab 0,05 % (50 $ auf 100.000 $; Schlüsse nur, wenn kein Kandidat der zweiten Quelle auf 0,05 % passt), Ausschüttungs-Abweichungen alle; Vorbehalt ab 0,1 % in einer Reihe der Hauptlesart bei belegtem Yahoo-Fehler (Eröffnung veraltet oder außerhalb der ersten Minute, Ausschüttung abweichend) oder bei gekipptem Signal; $ = Betrag × 100.000 $ (wächst mit dem Bestand); Pp p. a. = Betrag / Fensterjahre (A 4,70, B 5,00). Nichts wird repariert; die Wirkung rechnet der Rechner später nachrichtlich mit dem Wert der zweiten Quelle (REGEL §2.6).

| Stufe | Reihe | Fenster | Tag | Befund | Größe | $ auf 100.000 $ | Pp p. a. | Wirkt wie |
|---|---|---|---|---|---|---|---|---|
| **Vorbehalt** | SPY | A | 23.01.2017 | Eröffnung an Starttag – Yahoo-Eröffnung = Vortagsschluss (veraltet) | 0,1723 % | 172 | 0,037 | Maßstab (Kauf am Starttag) und jede Regel, die SPY an diesem Tag kauft oder verkauft |
| **Vorbehalt** | SPY | A | 01.02.2017 | Eröffnung an Ausführungstag R1/R2 + Starttag – Yahoo-Eröffnung = Vortagsschluss (veraltet) | -0,3154 % | 315 | 0,067 | Maßstab (Kauf am Starttag) und jede Regel, die SPY an diesem Tag kauft oder verkauft |
| **Vorbehalt** | SPY | A | 02.02.2017 | Eröffnung an Starttag – Yahoo-Eröffnung = Vortagsschluss (veraltet) | 0,1849 % | 185 | 0,039 | Maßstab (Kauf am Starttag) und jede Regel, die SPY an diesem Tag kauft oder verkauft |
| **Vorbehalt** | AGG | A | 01.11.2018 | Ausschüttung: Yahoo = 2,001 × Alpaca (Yahoo doppelt) | 0,2454 % | 245 | 0,052 | Gesamtertrag von AGG am Ex-Tag, wenn AGG zum Vortagsschluss gehalten wird |
| Hinweis | SPY | AV | 18.03.2016 | Ausschüttung nur bei Yahoo | 0,5131 % | 513 | – | nur falls Yahoo irrt: Gesamtertrag am Ex-Tag zu hoch; Alpaca hat belegte Lücken (2016, SPY 15.06.2018), der Rhythmus der Reihe verlangt die Zahlung |
| Hinweis | SHY | AV | 01.08.2016 | Ausschüttung nur bei Yahoo | 0,0598 % | 60 | – | nur falls Yahoo irrt: Gesamtertrag am Ex-Tag zu hoch; Alpaca hat belegte Lücken (2016, SPY 15.06.2018), der Rhythmus der Reihe verlangt die Zahlung |
| Hinweis | AGG | AV | 01.08.2016 | Ausschüttung nur bei Yahoo | 0,1832 % | 183 | – | nur falls Yahoo irrt: Gesamtertrag am Ex-Tag zu hoch; Alpaca hat belegte Lücken (2016, SPY 15.06.2018), der Rhythmus der Reihe verlangt die Zahlung |
| Hinweis | SPY | A | 17.05.2017 | Eröffnung an einem Tag, an dem nur R3 handeln kann – Yahoo-Eröffnung = Vortagsschluss (veraltet) | 0,8316 % | 832 | 0,177 | nur wenn R3 an diesem Tag handelt; zustandsfreie Probe: R3 kann an diesem Tag NICHT handeln (Vortag im Band oder Zone unverändert) |
| Hinweis | ACWX | A | 01.06.2017 | Tagesschluss > 0,2 % neben der zweiten Quelle – ÜBER dem Hoch der regulären Sitzung der zweiten Quelle (um 0,281 %), nur in der Schlusskerze (Auktion/Nachbörse) gehandelt (nächster Schluss-Kandidat 0,2159 %) | 0,2808 % | 281 | 0,060 | nur Tagesbewertung des Bestands; kein Handel zu diesem Kurs |
| Hinweis | EFA | A | 01.12.2017 | Eröffnung an Ausführungstag R1/R2 – außerhalb der Spanne der ersten Minute der zweiten Quelle | -0,1431 % | 143 | 0,030 | nur wenn eine Regel EFA an diesem Tag kauft oder verkauft (nur N2, nachrichtlich) |
| Hinweis | AGG | A | 14.12.2017 | Ausschüttung nur bei Alpaca | -0,0914 % | 91 | 0,019 | falls Alpaca recht hat: Gesamtertrag am Ex-Tag bei Yahoo zu niedrig, wenn AGG zum Vortagsschluss gehalten wird |
| Hinweis | SPY | A | 28.02.2018 | Monatsend-Schluss (Signal R1/R2/R3) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,0958 %) | 0,1142 % | 114 | 0,024 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | EFA | A | 31.05.2018 | Monatsend-Schluss (Signal R2, nur N2) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,0576 %) | -0,0576 % | 58 | 0,012 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | SPY | A | 15.06.2018 | Ausschüttung nur bei Yahoo | 0,4470 % | 447 | 0,095 | nur falls Yahoo irrt: Gesamtertrag am Ex-Tag zu hoch; Alpaca hat belegte Lücken (2016, SPY 15.06.2018), der Rhythmus der Reihe verlangt die Zahlung |
| Hinweis | SPY | A | 31.12.2018 | Monatsend-Schluss (Signal R1/R2/R3) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,056 %) | -0,0780 % | 78 | 0,017 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | AGG | A | 01.08.2019 | Eröffnung an Ausführungstag R1/R2 – innerhalb der Spanne der ersten Minute der zweiten Quelle | 0,1079 % | 108 | 0,023 | nur wenn eine Regel AGG an diesem Tag kauft oder verkauft |
| Hinweis | AGG | A | 01.10.2019 | Eröffnung an Ausführungstag R1/R2 – innerhalb der Spanne der ersten Minute der zweiten Quelle | 0,0621 % | 62 | 0,013 | nur wenn eine Regel AGG an diesem Tag kauft oder verkauft |
| Hinweis | AGG | A | 01.11.2019 | Eröffnung an Ausführungstag R1/R2 – außerhalb der Spanne der ersten Minute der zweiten Quelle | 0,0975 % | 98 | 0,021 | nur wenn eine Regel AGG an diesem Tag kauft oder verkauft |
| Hinweis | EFA | A | 31.01.2020 | Monatsend-Schluss (Signal R2, nur N2) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,074 %) | -0,0740 % | 74 | 0,016 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | EFA | A | 28.02.2020 | Monatsend-Schluss (Signal R2, nur N2) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,1444 %) | -0,1444 % | 144 | 0,031 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | SPY | A | 13.03.2020 | Tagesschluss > 0,2 % neben der zweiten Quelle – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,2851 %) | -0,5979 % | 598 | 0,127 | R3-Entscheid dieses Tages (Kipp-Probe: R3-Zustand bleibt) und Tagesbewertung (Rückschlag); kein Handel zu diesem Kurs |
| Hinweis | SPY | A | 17.03.2020 | Tagesschluss > 0,2 % neben der zweiten Quelle – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,4769 %) | -0,6446 % | 645 | 0,137 | R3-Entscheid dieses Tages (Kipp-Probe: R3-Zustand bleibt) und Tagesbewertung (Rückschlag); kein Handel zu diesem Kurs |
| Hinweis | SPY | A | 18.03.2020 | Tagesschluss > 0,2 % neben der zweiten Quelle – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,4067 %) | -0,4067 % | 407 | 0,087 | R3-Entscheid dieses Tages (Kipp-Probe: R3-Zustand bleibt) und Tagesbewertung (Rückschlag); kein Handel zu diesem Kurs |
| Hinweis | SPY | A | 19.03.2020 | Tagesschluss > 0,2 % neben der zweiten Quelle – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,0624 %) | -0,2695 % | 270 | 0,057 | R3-Entscheid dieses Tages (Kipp-Probe: R3-Zustand bleibt) und Tagesbewertung (Rückschlag); kein Handel zu diesem Kurs |
| Hinweis | SPY | A | 29.05.2020 | Monatsend-Schluss (Signal R1/R2/R3) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,0526 %) | 0,0526 % | 53 | 0,011 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | ACWX | A | 30.10.2020 | Monatsend-Schluss (Signal R2) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,0666 %) | 0,0666 % | 67 | 0,014 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | SPY | B | 30.11.2021 | Monatsend-Schluss (Signal R1/R2/R3) – innerhalb der Sitzungsspanne, außerhalb der Schlusskerze (nächster Schluss-Kandidat -0,0614 %) | -0,0680 % | 68 | 0,014 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | SPY | B | 17.12.2021 | Ausschüttung: Yahoo = 0,998 × Alpaca | -0,0007 % | 1 | 0,000 | Gesamtertrag von SPY am Ex-Tag, wenn SPY zum Vortagsschluss gehalten wird und Signal R2 für zwölf Monate (Variante „Ausschüttung“ der Kipp-Probe) |
| Hinweis | BIL | B | 01.03.2022 | Ausschüttung nur bei Yahoo | 0,0241 % | 24 | 0,005 | nur falls Yahoo irrt: Gesamtertrag am Ex-Tag zu hoch; Alpaca hat belegte Lücken (2016, SPY 15.06.2018), der Rhythmus der Reihe verlangt die Zahlung |
| Hinweis | BIL | B | 01.09.2022 | Ausschüttung: Yahoo = 1,004 × Alpaca | 0,0006 % | 1 | 0,000 | Gesamtertrag von BIL am Ex-Tag, wenn BIL zum Vortagsschluss gehalten wird und Signal R2 für zwölf Monate (Variante „Ausschüttung“ der Kipp-Probe) |
| Hinweis | SPY | B | 30.11.2022 | Monatsend-Schluss (Signal R1/R2/R3) – ÜBER dem Hoch der regulären Sitzung der zweiten Quelle (um 0,032 %), nur in der Schlusskerze (Auktion/Nachbörse) gehandelt (nächster Schluss-Kandidat 0,0515 %) | 0,0540 % | 54 | 0,011 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | ACWX | B | 01.04.2024 | Tagesschluss > 0,2 % neben der zweiten Quelle – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,3562 %) | 0,4692 % | 469 | 0,094 | nur Tagesbewertung des Bestands; kein Handel zu diesem Kurs |
| Hinweis | SPY | B | 31.07.2024 | Monatsend-Schluss (Signal R1/R2/R3) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,0672 %) | 0,0672 % | 67 | 0,013 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | EFA | B | 28.02.2025 | Monatsend-Schluss (Signal R2, nur N2) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat -0,0735 %) | -0,0857 % | 86 | 0,017 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | SPY | B | 09.04.2025 | Tagesschluss > 0,2 % neben der zweiten Quelle – ÜBER dem Hoch der regulären Sitzung der zweiten Quelle (um 0,419 %), nur in der Schlusskerze (Auktion/Nachbörse) gehandelt (nächster Schluss-Kandidat 0,7937 %) | 0,9458 % | 946 | 0,189 | R3-Entscheid dieses Tages (Kipp-Probe: R3-Zustand bleibt) und Tagesbewertung (Rückschlag); kein Handel zu diesem Kurs |
| Hinweis | EFA | B | 30.04.2026 | Monatsend-Schluss (Signal R2, nur N2) – innerhalb der Spanne der Schlusskerze (nächster Schluss-Kandidat 0,0782 %) | 0,0978 % | 98 | 0,020 | wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: kein Signal kippt |
| Hinweis | AGG | B | 01.07.2026 | Eröffnung an Ausführungstag R1/R2 – innerhalb der Spanne der ersten Minute der zweiten Quelle | 0,0711 % | 71 | 0,014 | nur wenn eine Regel AGG an diesem Tag kauft oder verkauft |

Zusatz 10/2003–2015 (jeder Handelstag ist dort Starttag, keine Gegenprobe): Eröffnung = Vortagsschluss an SPY 24 von 3.085 Tagen (Monatsanfänge: 01.05.2006, 01.12.2006); SHY 373 von 3.085 Tagen (Monatsanfänge: 01.08.2012, 04.09.2012, 01.08.2014, 01.09.2015); EFA 37 von 3.085 Tagen (Monatsanfänge: 02.04.2007); AGG 130 von 3.085 Tagen (Monatsanfänge: 02.01.2004, 03.10.2011). Wirkung je betroffenem Fenster höchstens die Übernachtlücke dieses Tages (bei SPY typisch 0,1–0,5 %); der Zusatz entscheidet nichts.

## Verfahren

- Aufruf aus der Repo-Wurzel: `node studien/trendfilter-messung-2026-10/datenpruefung.js [--daten <ordner>] [--ohne-e] [--e <archiv>] [--aus <ordner>]`. Liest nur; E: wird jahresweise in einem Prozess gelesen.
- Handelstag = New Yorker Datum des Zeitstempels (`laden.js nyTag`); Kalender = SPY-Zeilen mit Schluss; alles nach dem 15.09.2026 bleibt außen vor. Gesamtertrag nach §2.5 nur zum Vergleich mit `adjclose`.
- In dieser Datei und in der JSON stehen nur relative Abweichungen (%), Verhältnisse, Tage, Zählungen und Einstufungen – keine absoluten Kurse und keine Beträge je Stück.
