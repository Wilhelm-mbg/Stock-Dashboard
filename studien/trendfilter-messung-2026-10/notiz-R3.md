# Notiz R3 — Signal „200 Tage nach Siegel, 1-%-Band“

Stand 05.10.2026 00:55 (Uhr aus `date`). Rolle: Signal der Regel R3 nach `REGEL.md` §4.3/§4.4/§7 N3 (Siegel 6f9d06f). Nur das
Signal; auf echten Daten wurde **kein** Buch, kein Ertrag, kein Endwert gerechnet. Simulation, keine Anlageberatung.

## Dateien

- `regel-R3.js` — `{ name: 'R3', titel, art: 'taeglich', signal, details }` (+ `lauf`, `fensterWechsel` für Test und JSON).
  Als Skript (`node studien/trendfilter-messung-2026-10/regel-R3.js`) schreibt es `signale-R3.json`.
- `test-R3.js` — `node studien/trendfilter-messung-2026-10/test-R3.js` aus der Repo-Wurzel: **83 grün, 0 rot**.
- `signale-R3.json` — Wechseltage mit C/SMA200 (6 Stellen), keine Kurse.

## Lesarten, die ich festgelegt habe (keine weicht von der REGEL ab)

1. `SMA200(d)` = (c[d−199] + … + c[d]) / 200, jedes Mittel neu summiert, Vergleich wörtlich `C <= 0.99 * sma` bzw.
   `C >= 1.01 * sma`. Anfang am Index 199 (1993-11-11) ohne Band: `C > SMA` → investiert. C/SMA am Anfang 1,025861 → SPY.
2. `ziel[d+1]` = Zustand nach dem Schluss von d; `ziel[0..199] = null`. Der Zustand am letzten Tag (15.09.2026) hat kein
   Ziel-Feld mehr; ein Wechsel an diesem Tag stünde in `details` mit `ausfuehrung: null` (kommt bei Haupt nicht vor).
3. `details` liefert nur echte Wechsel `{ tag (Signaltag), i, ausfuehrung, verhaeltnis, von, neu }`; der Anfangszustand ist kein
   Wechsel und steht in `lauf(D, opt).anfang`. `lauf.js` ordnet `details` über `x.tag` = Signaltag zu — passt.
4. Das Ziel ist `opt.geld` auch an Tagen, an denen die Geldreihe noch keinen Kurs hat (BIL vor 2007-05-30). Das Signal hängt
   nur an SPY; in A, B und im Zusatz (ab 2003-10-01, SHY) ohne Wirkung.
5. „Wechsel ab 2003-01“ = Signaltag ≥ 2003-01-01. Fensterzählung: Ausführungstage i mit s < i ≤ e und ziel[i] ≠ ziel[i−1]
   (s = erster Starttag, Erstkauf zählt nicht, §3.3) — dieselbe Zählung wie `K.simuliere`.

## Ergebnis (nur Signal)

Wechsel seit 1993: Haupt 96, N3 222. **Haupt ab 2003: 71 Wechsel** (Haupt und Ersatz an denselben Tagen, nur BIL ↔ SHY —
in `regel-R3.js` und im Test Tag für Tag geprüft). **N3 ab 2016: 61 Wechsel.** Zustand nach dem Schluss 15.09.2026: SPY.

| Fenster (Start k = 0 bis Ende) | Zustand am Start | Wechsel Haupt | Wechsel N3 |
|---|---|---|---|
| A 2017-01-04 … 2021-09-15 (1.183 Handelstage) | SPY | **14** | **26** |
| B 2021-09-16 … 2026-09-15 (1.254 Handelstage) | SPY | **14** | **32** |

Wechsel der Hauptlesart 2016–2026 (Signaltag = Schluss; Ausführung = Eröffnung des nächsten SPY-Handelstags):

| Signaltag | Ausführung | neu | C/SMA200 |
|---|---|---|---|
| 2016-03-17 | 2016-03-18 | SPY | 1,013317 |
| 2016-06-27 | 2016-06-28 | BIL | 0,987386 |
| 2016-06-29 | 2016-06-30 | SPY | 1,021878 |
| 2018-10-11 | 2018-10-12 | BIL | 0,98521 |
| 2018-10-16 | 2018-10-17 | SPY | 1,014474 |
| 2018-10-23 | 2018-10-24 | BIL | 0,989487 |
| 2018-11-07 | 2018-11-08 | SPY | 1,017906 |
| 2018-11-12 | 2018-11-13 | BIL | 0,987758 |
| 2018-12-03 | 2018-12-04 | SPY | 1,012105 |
| 2018-12-04 | 2018-12-06 | BIL | 0,979331 |
| 2019-02-15 | 2019-02-19 | SPY | 1,011455 |
| 2020-02-27 | 2020-02-28 | BIL | 0,97764 |
| 2020-03-02 | 2020-03-03 | SPY | 1,015077 |
| 2020-03-03 | 2020-03-04 | BIL | 0,98581 |
| 2020-03-04 | 2020-03-05 | SPY | 1,026791 |
| 2020-03-06 | 2020-03-09 | BIL | 0,975778 |
| 2020-05-27 | 2020-05-28 | SPY | 1,012964 |
| 2022-01-25 | 2022-01-26 | BIL | 0,982769 |
| 2022-01-31 | 2022-02-01 | SPY | 1,016556 |
| 2022-02-14 | 2022-02-15 | BIL | 0,98829 |
| 2022-03-25 | 2022-03-28 | SPY | 1,013618 |
| 2022-04-11 | 2022-04-12 | BIL | 0,981508 |
| 2023-01-23 | 2023-01-24 | SPY | 1,012401 |
| 2023-03-10 | 2023-03-13 | BIL | 0,981563 |
| 2023-03-21 | 2023-03-22 | SPY | 1,016006 |
| 2023-10-25 | 2023-10-26 | BIL | 0,987519 |
| 2023-11-02 | 2023-11-03 | SPY | 1,017082 |
| 2025-03-10 | 2025-03-11 | BIL | 0,98005 |
| 2025-05-12 | 2025-05-13 | SPY | 1,016589 |
| 2026-03-20 | 2026-03-23 | BIL | 0,98214 |
| 2026-04-08 | 2026-04-09 | SPY | 1,018701 |

(2018-12-04 → Ausführung 2018-12-06: am 05.12.2018 war die Börse geschlossen, der SPY-Kalender hat den Tag nicht.)

## Plausibilität

- **2008:** letzter Ausstieg Signaltag 2007-12-14 (C/SMA 0,9894), draußen bis zum Wiedereinstieg 2009-06-01 (1,0205), 366
  Handelstage. 2008 kein einziger Wechsel: das höchste C/SMA des Jahres war 1,00136 (2008-05-19) — unter dem Band; N3 kaufte an
  dem Tag für einen Tag (Wechsel 2008-05-19/20). Davor 2007 sieben Wechsel (August/November/Dezember hin und her).
- **2020:** Ausstieg 2020-02-27, dann drei Wechsel in vier Tagen (02.–04.03.), endgültig draußen ab Signal 2020-03-06,
  Wiedereinstieg 2020-05-27 (Ausführung 28.05.).
- **2022:** Ausstieg 2022-01-25, zurück 31.01., raus 14.02., zurück 25.03., raus 2022-04-11, Wiedereinstieg erst 2023-01-23
  (196 Handelstage draußen).
- **Fehlsignale** (reine Signalzählung, ohne Kursvergleich — ob ein kurzer Ausflug Geld gekostet hat, ist eine Ertragsfrage für
  den Hauptlauf): Ausstiege, denen der Wiedereinstieg binnen ≤ 21 Handelstagen (≈ 1 Monat) folgt.
  - Haupt A: 7 Ausstiege, davon **5** kurz (Dauern 3, 11, 14, 49, 2, 1, 56 Handelstage); Haupt B: 7 Ausstiege, davon **4** kurz
    (4, 28, 196, 7, 6, 44, 12).
  - N3 A: 13 Ausstiege, 11 kurz; N3 B: 16 Ausstiege, 12 kurz. Das Band halbiert ungefähr die Wechsel (A 14 statt 26, B 14 statt 32).
  - Haupt ab 2003: 35 Ausstiege, 23 binnen ≤ 21, 31 binnen ≤ 63 Handelstagen; nur 4 lange Pausen (2007-12 → 2009-06,
    2011-08 → 2012-01, 2015-12 → 2016-03, 2022-04 → 2023-01).

## Gleitkomma und zweiter Weg

- Alle 8.464 Yahoo-Schlusskurse von SPY sind exakte float32-Werte (`Math.fround(c) === c`). Damit ist jede 200er-Summe in double
  **exakt**, unabhängig von der Reihenfolge; die SMA trägt nur die eine Rundung von `/ 200`. Der zweite Weg (eigene Reihe aus
  `laden.lies`, Summe abwärts, eigener Automat, Vergleich nach Datum) liefert an **allen 8.264 Tagen mit Ziel** (1993-11-12 …
  2026-09-15; Haupt, Ersatz, N3, N3-Ersatz) dasselbe Ziel; SMA-Abweichung 0.
- **Grenzfälle |C/SMA − 0,99| < 1e-9 oder |C/SMA − 1,01| < 1e-9: 0.** Knappster Abstand zu 1,01: 7,6e-7 (2005-03-29), zu 0,99:
  4,8e-5 (2011-11-15). Keine Entscheidung hängt an der Rundung.

## Tests (test-R3.js, 83 grün, 0 rot)

Kunstdaten über `K.baueDaten`, Sollwerte von Hand (Rechenweg im Kommentar): Länge/erster Tag (200 vs. 201 Kurse), Anfangszustand
(C knapp über/unter/gleich SMA), Fenster genau 200 Tage einschließlich d (Gegenrechnung 199, 201 und „ohne d“ liefert anders),
Bänder exakt getroffen (0,99 × 100 = 99 und 1,01 × 100 = 101 sind in IEEE-754 exakt) und knapp daneben, Hysterese in beiden
Zuständen, Ausführung am Folgetag (auch durchs Buch von `kern.js` auf Kunstdaten), N3 ohne Gedächtnis, Ausschüttungen ohne Wirkung
(mit Empfindlichkeitsprobe: auf `tr` wäre das Signal anders), `opt.geld = 'SHY'`, kein Blick voraus (Kurse nach d verfälscht).
Echte Daten: zweiter Weg an jedem Tag, Kalender gleich, `details` = Wechsel im Ziel-Feld, kein Blick voraus an 92 Schnitten
(abgeschnitten und verfälscht), `signale-R3.json` gegen Neuberechnung. Mutationsprobe im Kratzordner (nicht im Repo): 15 von 15
absichtlich eingebauten Fehlern (Fenster 199/ohne d, /199, < statt ≤, > statt ≥, Anfang mit Band, N3 ≥, Ausführung am Signaltag
oder zwei Tage später, Gesamtertrag statt Kurs, Geld fest BIL, Band 2 %, Band verdreht, N3 mit Gedächtnis) werden rot.
Lint: `eslint` ist im Klon nicht installiert; `node --check` sauber, `'use strict'`, CommonJS, jeder Pfad läuft im Test.

## Quelle (Siegel, Stocks for the Long Run, 5. Aufl. 2014)

- **Fundstelle:** Kapitel 20 „Technical Analysis and Investing with the Trend“, S. 311–323; Abschnitte „Moving Averages“ S. 316,
  „Testing the Dow Jones Moving-Average Strategy“ S. 317, „Back-Testing the 200-Day Moving Average“ S. 318 (Inhaltsverzeichnis der
  5. Auflage, Scan der ZBW: https://www.gbv.de/dms/zbw/768494753.pdf). Den Buchtext selbst konnte ich **nicht** einsehen (archive.org
  sperrt die Ausgabe 2014); alles Weitere aus Sekundärquellen.
- **Bestätigt (Sekundärquellen):** Dow Jones Industrial Average; 200-Tage-Durchschnitt; Band **1 % beim Kauf UND beim Verkauf**;
  Signal am **Schlusskurs** — Faber (2013, über die Vorauflage 1886–2006): Kauf, wenn der Dow „closed at least 1 percent above the
  200-day moving average“, Verkauf bei Schluss mindestens 1 % darunter, dann **Schatzwechsel** (Treasury bills)
  (https://mebfaber.com/2013/06/07/qtaa-paper-update-manage-your-risk-4/). Zeitraum der 5. Aufl. 1886–2012; dort laut
  Sekundärquellen 9,7 % p. a. Timing gegen 9,4 % Kaufen-und-Halten, mit Transaktionskosten 8,1 % (Globe and Mail, Validea).
- **Nicht bestätigt:** (a) „Kursindex ohne Dividenden als Signal“ steht in keiner gefundenen Quelle ausdrücklich; es folgt nur
  daraus, dass der DJIA ein reiner Kursindex ist und die Regel den Indexstand mit seinem Durchschnitt vergleicht. (b) **Handel
  zum Schluss des Signaltags**: keine Quelle sagt, wann gehandelt wird — nur, dass das Signal am Schluss entsteht. (c) Ob die
  Renditen Dividenden enthalten: nicht gesehen. (REGEL §1 nennt (b) als Original; das ist damit unbelegt, ändert aber nichts an
  der Hauptlesart, die ohnehin zur nächsten Eröffnung handelt; N1 bleibt nachrichtlich.)
- **Widerspruch zur REGEL:** keiner gefunden. Randnotizen: Faber nennt das Buch mit 1886–2006 „2008 … 5/E“ — nach den
  Ausgabedaten ist das die 4. Aufl. (Nov. 2007); die 5. Aufl. (Jan. 2014) reicht bis 2012, die Regelparameter sind laut den
  Quellen gleich. Wikipedia fasst zusammen, der Durchschnitt verbessere beim Dow weder Rendite noch Risiko — das betrifft das
  Ergebnis, nicht die Regel, und widerspricht Fabers Wiedergabe.

## kern.js

Kein Fehler gefunden. Für R3 geprüft: Kalender aus SPY-Zeilen mit Schluss > 0 (streng steigend), `c` ohne Lücken auf dem
Kalender; `simuliere` handelt `ziel[i]` zur Eröffnung von i, Erstkauf kein Wechsel, ein 'BIL'-Ziel vor dem ersten BIL-Kurs
würde als „kein Kurs, verschoben“ gezählt (in A/B nicht erreichbar); Placebo „taeglich“ zieht aus (s, e]; Fenster-Starttage
und Endtage; Zusatz-Ende fünf Jahre minus ein Tag. Nichts an `kern.js` geändert.
