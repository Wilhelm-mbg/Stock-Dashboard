# Notiz R2 — Antonacci GEM: Signal, Tests, Quelle

Stand 05.10.2026, 00:57 (Uhr aus `date`). Regel: `REGEL.md` §4.2, §4.4, §7.2 (N2, N5), Siegel 6f9d06f. Simulation, keine
Anlageberatung. Diese Notiz enthält **nur das Signal** — keine Buchwerte, keine Erträge, keine Endwerte auf echten Daten
(der eine Lauf nach §9.2 kommt vom Auftraggeber).

## Dateien

| Datei | Inhalt |
|---|---|
| `regel-R2.js` | `{ name: 'R2', titel: 'Antonacci GEM', art: 'monatlich', signal(D, opt), details(D, opt) }`, dazu `entscheide`, `wechselImFenster` für Tests. `node studien/trendfilter-messung-2026-10/regel-R2.js --signale` schreibt `signale-R2.json`. |
| `test-R2.js` | `node studien/trendfilter-messung-2026-10/test-R2.js` → **115 grün, 0 rot** (Rückgabewert 1 bei rot). |
| `signale-R2.json` | Nur Signal: 12-Monats-Gesamterträge an Monatsenden, Ziele, Wechsel-Monatsenden, Signalzählung je Fenster, knappe Entscheide (< 0,5 Pp). Keine Kurse. |

Umsetzung genau nach §4.2: am Monatsende M `r_X = TR_X(M) / TR_X(M₋₁₂) − 1` mit `M₋₁₂ = K.monatsendeVor(D, M, 12)`, TR aus
`kern.js`. `r_SPY > r_Geld` (strikt) → SPY falls `r_SPY ≥ r_Intl`, sonst Nicht-US; sonst AGG. N5: Gewinner G (SPY bei `r_SPY ≥
r_Intl`), `r_G > r_Geld` → G, sonst AGG. Null, wenn `M₋₁₂ = −1` oder einer der sechs TR-Werte NaN ist. Ausführung über
`K.monatlich` (Entscheid von M gilt ab dem ersten Handelstag nach M; Starttag s erhält das letzte Monatsende vor s).
`details` liefert je Monatsende des Kalenders `{ tag, rSpy, rGeld, rIntl, ziel }` (Renditen einzeln `null`, wo nicht berechenbar).
Die Regel prüft **nicht**, ob die Zielreihe schon handelt (AGG erst ab 29.09.2003) — das regelt `K.ersterZusatzTag`; auf
echten Daten ist das Ersatz-Ziel vor Oktober 2003 ohnehin nie AGG (Juli/August 2003: SPY, September 2003: EFA).

## Tests (115 grün, 0 rot)

Kunstdaten über `K.baueDaten`, Sollwerte von Hand (Rechenweg im Kommentar je Teil):
1. **Vier Ausgänge** (SPY; Nicht-US; AGG mit beiden Aktien unter Geld; AGG mit Nicht-US vorn, aber SPY unter Geld) mit `r`-Werten
   auf 1e-12, Ziel-Feld Tag für Tag für Haupt und N5; Haupt/N5 verschieden genau im Mai 2021 (21 Tage).
2. **Ausführung am Tag nach dem Monatsende**, **Starttag mitten im Monat** (17.03.2021 → ACWX vom 26.02.; Buch auf Kunstdaten:
   Wert zum Schluss = 100.000 / 1,002), Start am Monatsende selbst, Start am Tag danach; Signalzählung = Wechsel des Buchs.
3. **Gleichstände** bitgenau (Kurse mit exakten Quotienten 1,25): `r_SPY = r_Geld` → AGG (Haupt und N5); `r_SPY = r_Intl` → SPY.
4. **Ausschüttungen** über TR: SPY-Kurs −4 %, mit Ausschüttung +1 % → SPY statt AGG; BIL nur über Ausschüttung; Ex-Tag am Samstag
   auf Montag gebucht; Ausschüttung nach dem Monatsende wirkt nicht zurück; Gegenprobe ohne Ausschüttungen → AGG.
5. **Zwölf Kalendermonate exakt** über den Jahreswechsel, mit fehlendem Juni 2020 im Kalender (unterscheidet Kalendermonate von
   „zwölf Monatsenden zurück"); M₋₁₂ fehlt → null.
6. **Zu kurze Reihe** → null (erste Zeile genau an M₋₁₂ ist berechenbar, einen Tag danach nicht); fehlende Reihe wirft.
7. Ersatzreihen über die Optionen. 8. Haupt/N5 verschieden genau bei `r_SPY ≤ r_Geld < r_Intl` (Zufallsdaten, 47 Monate).
9. **Kein Blick voraus**: für jedes der 47 Monatsenden alle Kurse und Ausschüttungen ab dem Ausführungstag gestört bzw. Daten danach
   abgeschnitten → Ziel bis einschließlich Ausführungstag und `details` bis M bitgleich (Haupt, N5, Ersatz). Gegenprobe: eine
   absichtlich spähende Regel (TR einen Tag nach M) wird in 27 von 47 Schnitten erwischt.
10. **Echte Daten, zweiter eigener Weg** (eigener TR je Reihe auf ihren eigenen Zeilen direkt aus `laden.lies`, eigene Monatsenden,
   M₋₁₂ = gleicher Monat im Vorjahr, eigene Entscheidung): Haupt 209, Ersatz 278, N5 209 berechenbare Monatsenden — **gleiches Ziel in
   jedem Monat**, Renditen bitgleich (größte Abweichung 0), Ziel-Feld an allen 8.464 Tagen gleich, kein Gleichstand näher als 1e-9.

Außerhalb des Repos (Kratzordner): **Mutationsprobe** — 12 absichtlich falsche Regeln (≥ statt >, > statt ≥, 11/13 Monate, Kurs
statt TR, Blick voraus, N5 ignoriert/immer, NaN nicht null, Geld statt Anleihen, …) werden alle rot. **Lint** mit der
Repo-Konfiguration (`eslint.config.mjs`, gleiche Datei): 0 Befunde. **Datenprobe** nur zur Plausibilität: 12-Monats-TR gegen
Yahoo-`adjclose` weicht höchstens 0,065 Pp ab (EFA 05/2013); mit `adjclose` gerechnet wäre **kein einziger** Entscheid anders
(Haupt, N5, Ersatz). `adjclose` steckt nicht im Rechner.

## Signal auf echten Daten (nur Signal)

**Erstes berechenbares Monatsende:** Haupt und N5 **30.04.2009** (ACWX ab 01.04.2008; Ziel AGG ab 01.05.2009); Ersatz/N2
**31.07.2003** (SHY ab 30.07.2002; Ziel SPY ab 01.08.2003). Nach dem ersten berechenbaren Monatsende kein Monat mehr null.
**Ziel am Starttag** A (04.01.2017) und B (16.09.2021): in allen Lesarten **SPY**. Letztes Monatsende 31.08.2026: Haupt/N5 ACWX,
Ersatz EFA.

**Wechsel aus dem Ziel-Feld** (Tage in (Starttag, Endtag] mit geändertem Ziel; Erstkauf zählt nicht):

| Lesart | Fenster A (04.01.2017–15.09.2021) | Fenster B (16.09.2021–15.09.2026) |
|---|---|---|
| **Haupt** (BIL/ACWX/AGG) | **8** | **9** |
| N5 (Gewinner) | 8 | 11 |
| N2 / Ersatz (SHY/EFA/AGG) | 8 | 12 |

**Wechsel-Monatsenden der Hauptlesart 2016–2026** (Renditen über 12 Monate in %, Gesamtertrag):

| Monatsende | Ausführung | von → nach | r_SPY | r_BIL | r_ACWX |
|---|---|---|---|---|---|
| 29.01.2016 | 01.02.2016 | SPY → AGG | −0,85 | −0,09 | −10,73 |
| 31.03.2016 | 01.04.2016 | AGG → SPY | 1,70 | −0,09 | −9,64 |
| 31.05.2017 | 01.06.2017 | SPY → ACWX | 17,44 | 0,21 | 18,10 |
| 31.05.2018 | 01.06.2018 | ACWX → SPY | 14,35 | 1,12 | 9,51 |
| 31.12.2018 | 02.01.2019 | SPY → AGG | −4,56 | 1,74 | −13,94 |
| 28.02.2019 | 01.03.2019 | AGG → SPY | 4,55 | 1,89 | −6,13 |
| 31.03.2020 | 01.04.2020 | SPY → AGG | −6,86 | 1,94 | −15,87 |
| 29.05.2020 | 01.06.2020 | AGG → SPY | 12,84 | 1,49 | −3,54 |
| 28.05.2021 | 01.06.2021 | SPY → ACWX | 40,25 | −0,04 | 42,25 |
| 30.06.2021 | 01.07.2021 | ACWX → SPY | 40,90 | −0,06 | 35,68 |
| 31.05.2022 | 01.06.2022 | SPY → AGG | −0,39 | −0,02 | −12,58 |
| 30.06.2023 | 03.07.2023 | AGG → SPY | 19,44 | 3,56 | 12,09 |
| 31.10.2023 | 01.11.2023 | SPY → ACWX | 10,00 | 4,72 | 12,67 |
| 30.11.2023 | 01.12.2023 | ACWX → SPY | 13,73 | 4,88 | 7,61 |
| 30.04.2025 | 01.05.2025 | SPY → ACWX | 11,87 | 4,80 | 12,54 |
| 30.05.2025 | 02.06.2025 | ACWX → SPY | 13,18 | 4,70 | 13,07 |
| 30.06.2025 | 01.07.2025 | SPY → ACWX | 14,94 | 4,64 | 17,99 |
| 31.07.2025 | 01.08.2025 | ACWX → SPY | 16,18 | 4,54 | 14,20 |
| 31.10.2025 | 03.11.2025 | SPY → ACWX | 21,40 | 4,30 | 25,10 |

**N5** weicht ab 2016 nur einmal ab: 28.04.2023 AGG → ACWX (r_SPY 2,68 < r_BIL 2,81 < r_ACWX 4,51), 31.05.2023 ACWX → AGG
(ACWX −1,19); vor 2016 nur der Wiedereinstieg 2009 einen Monat früher (30.09.2009 AGG → ACWX statt 30.10.2009).
**Ersatz/N2** (SHY statt BIL, EFA statt ACWX) weicht in A/B ab: Wechsel nach EFA 2017 einen Monat später (30.06.2017); **zusätzlich
AGG im September/Oktober 2019** (r_SHY 4,28 > r_SPY 2,74 — SHY trägt Kursgewinne aus fallenden Zinsen); keine Nicht-US-Phase im
Juni 2021; AGG erst ab 01.07.2022 statt 01.06.2022; EFA statt AGG im Mai/Juni 2023 und EFA im August–November 2023; 2026 noch
EFA → SPY (30.04.2026) und SPY → EFA (31.07.2026). Ersatz 2003–2016: SPY ab 01.08.2003, EFA ab 01.10.2003, **AGG ab 02.01.2008**
(31.12.2007: r_SPY 5,14 < r_SHY 7,35), zurück in Aktien (EFA) erst ab 02.11.2009, danach u. a. AGG 10/2011, 06/2012, 09–10/2015.
Alle Listen mit Renditen in `signale-R2.json`.

**Plausibilität (bekannte GEM-Phasen):** Anleihen 2008/2009 ✓ (Ersatz ab Januar 2008 bis Oktober 2009; Hauptlesart beginnt erst
04/2009 in AGG und geht mit dem ersten 12-Monats-Plus des S&P 500 (30.10.2009: +9,74 %) ab 02.11.2009 in ACWX). Ende 2018 → Anleihen, März 2019 zurück ✓.
Corona: Anleihen April/Mai 2020, Juni 2020 zurück ✓. 2022: Anleihen ab Juni 2022 bis Juni 2023 ✓ (Ersatz ab Juli 2022).
Nicht-US-Phasen 2017/18 (Schwellenländer-Jahr 2017) und 2025 (Nicht-US-Stärke) ✓.

**Knappe Entscheide der Hauptlesart ab 2016** (Abstand < 0,5 Pp, Liste in der JSON): u. a. **29.04.2022 SPY** mit r_SPY +0,04 % gegen
r_BIL −0,06 % (BIL nach Kosten negativ; mit einem Schatzwechsel-Index ohne Fondskosten wäre der Abstand kleiner, der Ausstieg
fiele womöglich einen Monat früher), 28.04.2023 und 31.05.2023 AGG (r_SPY 0,13 bzw. 0,24 Pp unter r_BIL), 30.05.2025 SPY gegen
ACWX (13,18 zu 13,07). Kein Entscheid liegt näher als 1e-9 an einem Gleichstand; Rundung entscheidet nichts.

## Quellenbefund (ohne Bigdata, ohne Firecrawl)

Gelesen 05.10.2026: Antonaccis eigene Website `optimalmomentum.com` (Seiten `/faq/` und `/global-equities-momentum/`) und sein
Arbeitspapier „Absolute Momentum: A Simple Rule-Based Strategy and Universal Trend-Following Overlay" (10.04.2014, gleiches Jahr
wie das Buch). **Das Buch selbst ist nicht eingesehen** (keine Vorschau erreichbar); die Aussagen zu den Buchseiten stammen vom
Autor selbst in seinem FAQ.

- **Absolutes Momentum am S&P 500 oder am Gewinner?** FAQ, Antwort auf die Frage, warum ein Nachrechner manchmal Nicht-US statt
  Anleihen hielt: „I first determine absolute momentum using the S&P 500 index" (mit Verweis auf S. 98 des Buchs, Begründung: die
  USA führen die Weltaktienmärkte an). Dadurch sei man gelegentlich in Anleihen, obwohl Nicht-US-Aktien am stärksten sind. Auf
  S. 101 stehe ein Ablaufbild, das relatives Momentum **zuerst** anwendet, für Leser, die es so bevorzugen; beide Wege können
  kurzzeitig verschiedene Positionen ergeben. In einer zweiten FAQ-Antwort: bei nur US- und Nicht-US-Aktien sei es besser, das
  absolute Momentum zuerst anzuwenden. → **Hauptlesart der REGEL = Buch S. 98; N5 = Buch S. 101.** Kein Widerspruch zur gesiegelten
  Regel. Die gestreuten Netz-Zusammenfassungen, die den Gewinner prüfen, beschreiben die S.-101-Variante.
- **Schatzwechsel:** Seite GEM: absolutes Momentum sucht Renditen über denen von US-Schatzwechseln; FAQ: absolutes Momentum =
  Rendite des S&P 500 über dem risikolosen Zins. Im Arbeitspapier 2014 sind das die Monatsrenditen von 90-Tage-US-Schatzwechseln.
  → BIL (1–3 Monate) passt; **SHY (1–3 Jahre) ist keine Schatzwechsel-Reihe** und erzeugt die Abweichungen 2007/08 und 2019 (oben).
- **Rückblick:** zwölf Monate. Arbeitspapier 2014: Bestwerte häufen sich bei 12 Monaten, deshalb 12 Monate, kein ausgelassener
  Monat; FAQ: der 12-Monats-Rückblick habe die meiste Bestätigung außerhalb der Stichprobe. Monatliche Prüfung, Ergebnisse auf
  Monatsschlusskursen (= N1). Gesamterträge mit wiederangelegten Ausschüttungen ✓.
- **Reihen:** Seite GEM: S&P 500, MSCI ACWI ex-US (vor 1989 MSCI World ex-US), Barclays Capital US Aggregate Bond (vor 1976
  Ibbotson Intermediate Government) → SPY, ACWX, AGG passen. Das FAQ nennt EAFE statt ACWI ex-US ausdrücklich schlechter (weniger
  Streuung, deutlich geringerer Ertrag seit 1989) → EFA (Ersatz/N2, Zusatz) weicht vom Original stärker ab als nur im Namen.
- Gleichstände legt die Quelle nicht fest; „strikt größer" für Geld und „≥" für SPY gegen Nicht-US stehen nur in der REGEL.

## kern.js (nicht geändert)

**Kein Fehler gefunden**, der das R2-Signal berührt. Geprüft: `baueDaten` (Kalender, Ausschüttungs-Verschiebung, TR),
`monatsendeVor`, `monatlich`, `simuliere` (Erstkauf, Wechsel, Kosten, Ausschüttungsanspruch), `waehlbareTage`/`placebo`,
`ersterZusatzTag`. Auf echten Daten: 0 Lücken, 0 verschobene oder verworfene Ex-Tage, 0 Zeilen außerhalb des SPY-Kalenders,
404 Monatsenden (01/1993–08/2026). `kern.js` wurde während dieser Arbeit um 00:45 geändert (Zeilen 488–491: `fensterListe` in
`zusatz`); das berührt R2 nicht, alle Tests liefen danach. Zwei Stellen, die REGEL anders lesen könnte, ohne Wirkung auf diesen Lauf:
1. Zeile 113: in einer **Lücke** einer Reihe wird TR fortgeschrieben; fehlte eine Zeile genau an M₋₁₂, rechnete R2 mit dem Vortag
   statt „nicht berechenbar" (§4.2: „Fehlt einer Reihe der Wert an M₋₁₂"). Echte Daten: 0 Lücken → keine Wirkung.
2. Zeile 141: `monatlich` reicht ein `null` mitten in der Geschichte weiter, `simuliere` wirft dann (Zeile 198). Echte Daten: kein
   null-Monat nach dem ersten berechenbaren → keine Wirkung.
