# Notiz R1 — Faber 10 Monate (nur Signal)

Stand 05.10.2026, 00:59 (Uhr aus `date`). Regel: REGEL.md §4.1 (Siegel 6f9d06f). Simulation, **keine Anlageberatung**.
Auf echten Daten ist hier **nur das Signal** gerechnet — keine Buchwerte, keine Erträge, keine Endwerte (der eine Lauf kommt vom
Auftraggeber).

## Dateien

| Datei | Inhalt |
|---|---|
| `regel-R1.js` | `{ name: 'R1', titel, art: 'monatlich', signal(D, opt), details(D, opt) }`. Aufruf `node studien/trendfilter-messung-2026-10/regel-R1.js` schreibt `signale-R1.json`. |
| `test-R1.js` | Kunstdaten mit Sollwerten von Hand + zweiter, eigener Weg auf echten Daten + Abgleich von `signale-R1.json`. Ergebnis **65 grün, 0 rot**. |
| `signale-R1.json` | Wechsel-Monatsenden mit P/SMA10 (ungerundet), Wechsel je Fenster aus dem Ziel-Feld. Keine Kurse. |

## Lesarten im Code (alle aus der REGEL abgeleitet, keine neue Wahl)

1. P = TR_SPY(M), SMA10 = Mittel von TR_SPY an M, M−1, …, M−9; **P > SMA10 → SPY, sonst Geld** — Gleichstand also Geld.
2. M−k = Monatsende k **Kalendermonate** vor M (`K.monatsendeVor`, wie M₋₁₂ bei R2). Fehlt eines davon oder hat SPY dort keinen
   Gesamtertrag → `null`. Auf dem echten Kalender gibt es keine Lücke: 404 Monatsenden 01/1993–08/2026, 09/2026 (am 15.09.
   abgeschnitten) keins (Test). Eine Lücke in Kunstdaten macht das Buch laut scheitern (`kein Ziel`), statt still über neun Werte zu
   mitteln (Test Fall D).
3. Das erste Monatsende 29.01.1993 ist zugleich die erste SPY-Zeile (TR = 1, definiert) und zählt mit. Erste Entscheidung am
   **29.10.1993**, Ziel ab 01.11.1993; 395 von 404 Monatsenden berechenbar.
4. Ausführung am Tag nach M über `K.monatlich` (Ziel am Monatsende selbst noch alt). Das Signal liest nur SPY; ob die Geld-Reihe
   schon handelt, prüft es nicht (alle Starttage liegen lange nach dem ersten Kurs von BIL 30.05.2007 bzw. SHY 30.07.2002).

## Tests (`node studien/trendfilter-messung-2026-10/test-R1.js` → 65 grün, 0 rot)

Kunstdaten (Rechenweg im Kommentar der Testdatei; TR = Schluss/64 exakt darstellbar, Gleichstand bitgenau):
zehntes Monatsende berechenbar, neuntes `null` (A, C); **M zählt mit** und **genau zehn Werte** — an 2000-11-25 gibt nur das richtige
Fenster SPY, ohne M / elf / neun Werte gäben Geld (A); **Gleichstand → Geld**, Gegenprobe 101 > 100,1 → SPY (A, A2);
**Ausschüttung** 5 am Ex-Tag: reiner Kurs 99 < 99,9 (unter dem Mittel), Gesamtertrag 1,0415625 > 1,00415625 → SPY, ohne
Ausschüttung BIL (B, B0); **Ausführung erst am Tag nach M** im Ziel-Feld und im Buch (`K.simuliere` auf Kunstdaten: Wechsel
2000-12-05, 2001-02-05, 2001-05-05); **Starttag mitten im Monat** hält das Signal des letzten Monatsendes (Erstkauf SPY am
2001-01-15, BIL am 2001-03-15); **SHY wirkt** (Ziel-Feld und Buch); **kein Blick voraus** — alle Kurse nach M auf 1 plus eine
Ausschüttung danach: Signale bis M bitgleich, Ziel-Feld bis zum nächsten Monatsende gleich, ab da anders (Gegenprobe, A3).

Echte Daten, **zweiter Weg** (eigener TR als fortlaufendes Produkt direkt aus `laden.lies`, eigene Monatsenden = letzte Zeile je
Kalendermonat, eigenes Mittel älteste zuerst): an **allen 404 Monatsenden 1993–2026** (davon 392 in 1994–2026), Haupt- und
Ersatzlesart, dasselbe Ziel; P/SMA10 beider Wege relativ gleich auf < 1e-12; knappste Entscheidung 1993–2026 am 30.09.2004 mit
P/SMA10 = 1,00043 — weit über dem Rundungsrauschen. Ex-Tage ohne SPY-Zeile: 0. `signale-R1.json` stimmt Eintrag für Eintrag mit
dem zweiten Weg (Listen, Zustand davor, Wechseltage A/B, Startreihe).

**Mutationsprobe** (Kopie im Kratzordner, Repo unberührt): 11 von 11 absichtlich falschen Fassungen werden rot — `>=` statt `>`,
ohne M, 9 bzw. 11 Monate, Kurs statt Gesamtertrag, P vom Tag nach M, Ausführung schon am Monatsende, Geld fest BIL, ein echter
Monat (2020-02) gekippt, Nenner 10 bei 9 Werten, `null` erst ab dem elften Monatsende.
**Lint:** ESLint 9.39.5 mit den Studien-Regeln aus `eslint.config.mjs` (Kopie der Konfiguration, weil der Klon kein `node_modules`
hat): 0 Fehler, 0 Warnungen.

## Signal auf echten Daten

**Hauptlesart (BIL), Monatsenden mit Zielwechsel 2016-01 bis 2026-08** — Zustand davor 31.12.2015: SPY (1,0035). 22 Wechsel:

| Monatsende | Ausführung (Eröffnung) | Wechsel | P/SMA10 |
|---|---|---|---|
| 29.01.2016 | 01.02.2016 | SPY → BIL | 0,9580 |
| 31.03.2016 | 01.04.2016 | BIL → SPY | 1,0280 |
| 31.10.2018 | 01.11.2018 | SPY → BIL | 0,9883 |
| 30.11.2018 | 03.12.2018 | BIL → SPY | 1,0076 |
| 31.12.2018 | 02.01.2019 | SPY → BIL | 0,9247 |
| 28.02.2019 | 01.03.2019 | BIL → SPY | 1,0202 |
| 31.05.2019 | 03.06.2019 | SPY → BIL | 0,9969 |
| 28.06.2019 | 01.07.2019 | BIL → SPY | 1,0630 |
| 28.02.2020 | 02.03.2020 | SPY → BIL | 0,9890 |
| 29.05.2020 | 01.06.2020 | BIL → SPY | 1,0216 |
| 28.02.2022 | 01.03.2022 | SPY → BIL | 0,9866 |
| 31.03.2022 | 01.04.2022 | BIL → SPY | 1,0151 |
| 29.04.2022 | 02.05.2022 | SPY → BIL | 0,9285 |
| 30.11.2022 | 01.12.2022 | BIL → SPY | 1,0121 |
| 30.12.2022 | 03.01.2023 | SPY → BIL | 0,9652 |
| 31.01.2023 | 01.02.2023 | BIL → SPY | 1,0362 |
| 31.10.2023 | 01.11.2023 | SPY → BIL | 0,9909 |
| 30.11.2023 | 01.12.2023 | BIL → SPY | 1,0677 |
| 31.03.2025 | 01.04.2025 | SPY → BIL | 0,9791 |
| 30.05.2025 | 02.06.2025 | BIL → SPY | 1,0210 |
| 31.03.2026 | 01.04.2026 | SPY → BIL | 0,9848 |
| 30.04.2026 | 01.05.2026 | BIL → SPY | 1,0711 |

**Ersatz (SHY), 2003-01 bis 2016-12** — Zustand davor 31.12.2002: SHY (0,9230). 15 Wechsel: 30.04.2003 → SPY (1,0476);
31.08.2004 → SHY (0,9968); 30.09.2004 → SPY (1,0004); **31.12.2007 → SHY (0,9903)**; **30.06.2009 → SPY (1,0327)**; 30.06.2010 → SHY
(0,9487); 30.07.2010 → SPY (1,0078); 31.08.2010 → SHY (0,9596); 30.09.2010 → SPY (1,0396); 31.08.2011 → SHY (0,9502); 31.01.2012 →
SPY (1,0387); 31.08.2015 → SHY (0,9637); 30.10.2015 → SPY (1,0221); 29.01.2016 → SHY (0,9580); 31.03.2016 → SPY (1,0280).
Die Zeitpunkte hängen nicht an der Geld-Reihe (Test: Ersatz zeitgleich mit der Hauptlesart).

**Wechsel je Fenster, aus dem Ziel-Feld gezählt (Signalzählung, kein Ertrag):** Fenster **A** (04.01.2017–15.09.2021): **8**
(01.11.2018 … 01.06.2020); Fenster **B** (16.09.2021–15.09.2026): **12** (01.03.2022 … 01.05.2026). Startreihe in beiden SPY. In den
Monat der verschobenen Starttage fällt kein Wechsel: alle 22 Starttage je Fenster beginnen in SPY mit denselben 8 bzw. 12 Wechseln.
Ersatzlesart: ebenfalls 8 / 12.

**Knappe Entscheide in A/B** (|P/SMA10 − 1| < 1 %): 30.11.2018 1,0076 (SPY), 31.01.2019 0,9948 (blieb BIL), 31.05.2019 0,9969
(BIL), 31.10.2023 0,9909 (BIL). Empfindlichkeit gegen eine einzelne falsche SPY-Ausschüttung, an der knappsten Stelle nachgerechnet
(nur Signal): die März-Ausschüttung 2019 (Ex-Tag 15.03., 1,233 $ bei Kurs 281,31) **doppelt** gebucht → 31.05.2019 P/SMA10 = 0,99991
(bleibt BIL, knapp), **fehlend** → 0,99389 (BIL). Die Datenprüfung (Gesamtertrag gegen `adjclose`) bleibt trotzdem wichtig.
Gegenprobe zur Wirkung des Gesamtertrags (nur Signal): mit reinem Kurs statt TR
entschieden 5 Monatsenden seit 2003 anders (30.07.2004, 30.09.2004, 29.04.2005, 28.05.2010, 31.12.2015 — jeweils TR: SPY, Kurs:
Geld), **keines zwischen 2016-12 und 2026-08**; für das Signal in A und B ist die Wahl Kurs/Gesamtertrag also ohne Folge.

## Plausibilität (gegen allgemein Bekanntes — aus dem Gedächtnis des Modells, nicht nachgeschlagen)

- **2000–2003:** Ausstieg 29.09.2000 (Hoch des S&P 500 im Jahr 2000), kurzer Wiedereinstieg 03–04/2002, Rückkehr 30.04.2003
  (Bärenmarkt-Tief Okt. 2002 / März 2003). Passt.
- **2007–2009:** Ausstieg 31.12.2007 (Hoch Okt. 2007), Wiedereinstieg 30.06.2009 (Tief März 2009). Passt zum bekannten Bild der
  Regel: draußen über den Großteil des Abschwungs, drei bis vier Monate zu spät zurück.
- **2020:** Ausstieg 28.02.2020, ausgeführt 02.03.2020 — nach dem ersten Einbruch Ende Februar, vor dem Tief vom 23.03.2020;
  zurück 29.05.2020. Passt.
- **2022:** Ausstieg 28.02.2022 (Bärenmarkt ab Januar), ein Monat Fehlsignal (zurück 31.03., wieder raus 29.04.), Fehlsignal
  11–12/2022, zurück 31.01.2023. Passt zu einem Jahr mit mehreren Zwischenerholungen.
- Weitere bekannte Abschwünge getroffen: 08/1998 (Russland/LTCM), 08/2011, 08/2015 und 01/2016, Q4 2018 (mit Fehlsignal
  11/2018), 05/2019, 10/2023, 03/2025 (vor dem Zollschock Anfang April 2025). **03–04/2026** liegt jenseits dessen, was das Modell
  sicher weiß — nicht beurteilt.

## Quelle (Faber) — geprüft per WebSearch/WebFetch, ohne Bigdata/Firecrawl

SSRN-Abstract 962461 antwortet mit HTTP 403. Frei lesbar war die Fassung auf Fabers eigener Seite
`https://mebfaber.com/wp-content/uploads/2016/05/SSRN-id962461.pdf` — laut Titelseite die **Update-Fassung Februar 2013** (Mai 2006
Arbeitspapier, Frühjahr 2007 JWM, Updates Feb. 2009 und Feb. 2013). Die Fassung von 2007 selbst habe ich **nicht** gelesen.

- **S. 21:** „Buy when monthly price > 10-month SMA“ / Verkauf in Geld, wenn darunter.
- **S. 22, Regel 1:** Ein- und Ausstieg zum Schluss des Signaltags; Prüfung nur am letzten Tag des Monats → **bestätigt** (REGEL
  weicht bewusst ab — nächste Eröffnung —, das Original läuft als N1).
- **S. 22, Regel 2:** alle Reihen sind Gesamtertragsreihen mit Ausschüttungen, monatlich → **bestätigt**: das Signal wird auf dem
  Gesamtertrag gerechnet. FAQ S. 58: bei Yahoo „adjusted numbers“ benutzen.
- **S. 22, Regel 3:** Geld = **90-Tage-Treasury-Bills** in der Fassung 2013. Die Dokumentation von `quantstrat::stratFaber`, die
  die frühere Fassung zitiert, nennt „90-day commercial paper“ — REGEL §1 („90-Tage-Geldmarktpapiere“) folgt der frühen Fassung.
  Kein Widerspruch zur Regel (BIL = 1–3-Monats-Schatzwechsel liegt sogar näher an der Fassung 2013), nur zur Kenntnis.
- **Nicht geregelt in der Quelle:** der Gleichstand (Kauf bei >, Verkauf bei <) und ob der 10-Monats-Durchschnitt den laufenden
  Monat enthält. Die REGEL legt beides fest (Gleichstand → Geld; M eingeschlossen = übliches einfaches Mittel). Ein exakter
  Gleichstand kommt auf den echten Daten nicht vor (knappster Abstand 0,043 %).
- **Kein Widerspruch zur gesiegelten REGEL gefunden.**
- Nebenfund für R3 (nicht meine Regel, nur gemeldet): S. 20 beschreibt Siegels Test als DJIA 1886–2006, Kauf bei Schluss mindestens
  1 % über dem 200-Tage-Durchschnitt, Verkauf und **Treasury Bills**, wenn mindestens 1 % darunter — bestätigt Band und „außerhalb
  Schatzwechsel“; Faber nennt dafür aber das Buch „2008 … 5/E“ mit 1886–2006, die REGEL die 5. Aufl. 2014 mit 1886–2012.

## kern.js

**Keinen Fehler gefunden.** Für R1 nachgesehen: Kalender und Monatsenden (L5, letzter Datentag kein Monatsende), Gesamtertragsindex
nach §2.5 (Ex-Tag ohne Zeile auf den nächsten Tag mit Kurs; Ausschüttung am ersten Tag wirkt nicht, weil TR dort 1 ist),
`monatsendeVor`, `monatlich` (Ziel am Monatsende noch alt), `starttage`/`endIndex` (22 Starttage je Fenster), `simuliere` für
Erstkauf und Wechseltage auf Kunstdaten. Der zweite Weg (eigener TR, eigene Monatsenden) bestätigt die Monatsenden von `kern.js` und
das daraus gerechnete P/SMA10 an allen 404 Monatsenden (relativ < 1e-12).
