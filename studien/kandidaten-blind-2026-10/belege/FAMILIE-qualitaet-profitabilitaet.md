# Familie: Qualität/Profitabilität (long only, Bilanzdaten) — Literaturbeleg

Stand 04.10.2026. Simulation, keine Anlageberatung. Kennzeichnung: **[Q]** = in dieser Sitzung aus der Quelle gelesen,
**[W]** = nur Websuche-Zusammenfassung, **[G]** = Gedächtniswissen, nicht geprüft.

## 0. Abgrenzung zum Mehrfaktor-Lauf (vorab, offen)

- Der verworfene Lauf (sieben Signale inkl. Ertragskraft/Investition/Bewertung/Schwankung) enthält Profitabilität bereits.
  Eine Einzelregel „Gross Profits/Assets" ist daher **kein unabhängiger Beleg**, sondern eine Teilmenge davon. Sie trägt
  nur dann eigenen Beleg, wenn sie als *einzige* Kennzahl, mit Vorregistrierung und eigener Kontrolle gemessen wird.
- Piotroski-F, Mohanram-G, Sloan-Accruals und QMJ sind Mehrkomponenten-Scores; ihre Komponenten (Ertragskraft, Cashflow-Qualität,
  Verschuldung) überlappen die sieben Signale. Fundamental-Momentum (Piotroski-Teile ΔROA, ΔMargin) ist A∧B-nah, also ausgeschlossen.
- Ehrliche Einstufung: Nur **GP/A als Reinform** (Novy-Marx) ist hinreichend verschieden von den übrigen. Selbst das ist
  fraglich, weil „Ertragskraft" im Mehrfaktor-Lauf eng korreliert sein dürfte (Novy-Marx/Medhat: Qualitätsfaktoren laden
  zu rund 0,5 auf Profitabilität [Q]). Das Mehrfaktor-Ergebnis „nicht entscheidbar" gilt wahrscheinlich auch hier (MDE).

## 1. Exakte Regeln mit Fundstelle

**Novy-Marx 2013, JFE 108(1) „The Other Side of Value" (NBER w15940, Apr. 2010) [Q]**
- Kennzahl: (REVT − COGS) / AT (Compustat) = Bruttogewinn/Bilanzsumme. SEC-Entsprechung [G, SEC-Tag-Namen nicht geprüft]:
  `GrossProfit` (oft fehlend, dann `Revenues`/`RevenueFromContractWithCustomer…` − `CostOfRevenue`/`CostOfGoodsAndServicesSold`),
  Nenner `Assets`. Bei Quartalsdaten TTM aus 4 Quartalen; Bilanzsumme am Quartalsende (Novy-Marx: Jahreswert).
- Universum: ohne Finanzwerte (SIC 6xxx), NYSE-Breakpoints, Juli 1963 – Dez. 2009, jährliche Rebalancierung Ende Juni,
  Buchhaltungsdaten mindestens 6 Monate verzögert (Look-ahead-Schutz) [Q].
- Large-Cap-Variante (Tab. 7, [Q]): 500 größte Nicht-Finanzwerte, Terzile nach GP/A, **jährlich** im Juni; Long-Short-Kombi
  GP/A+B/M: je 150 Titel. Für Einzelregel: oberes Terzil = 150 Titel, nicht ≤30.
- Zeitversatz für dieses Projekt (Vorschlag, nicht aus Quelle): SEC-`filed`-Datum + Karenz (z. B. +2 Handelstage), nie
  `period`-Datum; Novy-Marx' 6 Monate sind für Quartalsdaten zu konservativ, aber ein Beleg für einen kürzeren Versatz fehlt.

**Asness–Frazzini–Pedersen 2019, Rev. Acc. Stud. 24(1), 34–112 „Quality Minus Junk" [Q]**
- Score = z(Profitabilität + Wachstum + Sicherheit [+ Ausschüttung]); Profitabilität = z(GPOA, ROE, ROA, CFOA, GMAR, −ACC);
  Wachstum = 5-Jahres-Änderungen derselben (ohne ACC); Sicherheit = Beta, Leverage, O-/Z-Score, ROE-Volatilität. Rangbasierte z-Werte.
- Dezile, US-NYSE-Breakpoints, wertgewichtet, **monatliche** Rebalancierung; Bilanzdaten Fiskaljahr t−1 → Juni t. US 07/1957–12/2016.
- Ein Siebener-Mix: klar Überlappung mit dem verworfenen Mehrfaktor-Lauf. Nicht als eigene Regel führen.

**Piotroski 2000, JAR 38 [G]**: 9 binäre Signale (ROA>0, CFO>0, ΔROA>0, CFO>NI, ΔLeverage<0, ΔCurrent Ratio>0, keine Neuemission, ΔMarge>0,
ΔUmschlag>0); nur im obersten Book-to-Market-Quintil; Kauf bei F=8–9. Parameter nicht nachgelesen [G].
**Fama–French 2015, JFE 116 [G/W]**: OP = (Umsatz − COGS − SG&A − Zinsaufwand)/Buchwert Eigenkapital; 2×3-Sorts, 30./70. NYSE-Perzentil,
jährlich Juni. In Novy-Marx/Medhat 2025 bestätigt, dort PROF = Operating Profit unpunished for R&D [Q].
**Sloan 1996 [G]**, **Mohanram 2005 [W]** (G-Score 0–8, nur Low-B/M, 6–8 long, jährlich): Details nicht aus Primärquelle gelesen.

## 2. Berichtete Größen

| Befund | Zahl | Status |
|---|---|---|
| GP/A, 1963–2009, alle Größen, Dezil/Quintil Long-Short | 0,33–0,40 %/Monat brutto; FF3-Alpha 0,55 %/Mon. (t 4,75) | [Q] Novy-Marx 2013 Tab. 4; Taxonomy-Tab. 3 |
| GP/A **Large Cap** (500 größte), Terzil H−L | 0,28 %/Mon. (t 2,05), FF3-Alpha 0,42 (t 3,90); Terzil High 0,63 vs. Low 0,34 %/Mon. Exzess | [Q] Novy-Marx 2013 Tab. 7 |
| Long-only-Anteil am Large-Cap-Kombi-Ergebnis | 58 % der Gewinne long (0,41 %/Mon. Marktrendite der Großwerte) | [Q] ebd. |
| Handelskosten GP/A (Dezil L/S, wertgew., 1963–2013) | Umschlag 1,96 (jährl.), Kosten 0,03 %/Mon.; netto 0,37 (t 2,74), Alpha 0,51 | [Q] Novy-Marx/Velikov RFS 2016, Tab. 3 |
| GP/A ist kostenmäßig „billig" | Strategien <50 % Monatsumschlag überleben Kosten; Profitabilität hat größte Kapazität | [Q]/[W] ebd. |
| Nach Veröffentlichung (PROF, FF-ähnlich, 2×3, wertgew.) | 0,31 %/Mon. bis 2006 vs. **0,60 %/Mon. 2007–2023** (Differenz t 2,02) | [Q] Novy-Marx/Medhat NBER w33601, 2025 |
| QMJ US 1957–2016 (L/S, groß+klein) | 0,29 %/Mon. (t 3,62), 4-Faktor-Alpha 0,60 | [Q] AFP Tab. 4 |
| QMJ-Dezil 10 (long only, wertgew.) | Exzess 0,70 %/Mon., CAPM-Alpha 0,20 (t 5,9), 4F-Alpha 0,46 → ca. 2,4 bzw. 5,5 Pp/Jahr | [Q] AFP Tab. 3; Alpha ≠ Überschuss gegen SPY |
| QMJ-Größeneffekt | „etwas größerer Preis der Qualität bei Großwerten" (Preis, nicht Rendite) | [Q] AFP S. 204 |
| McLean–Pontiff 2016 (97 Prädiktoren) | −26 % out-of-sample, −58 % nach Veröffentlichung | [W] JF 71 |
| Hou–Xue–Zhang 2020 „Replicating Anomalies" | Piotroski-F **scheitert** (NYSE-Breakpoints, wertgew.); 64 % von 447 Anomalien insignifikant | [W] RFS 33 |
| Piotroski F, 2005–2015, long only (F=8–9) | Rohrendite 30,9 %/J. (monatl.), mit Liquiditätsfilter und 0,7 % Rundlauf-Kosten „praktisch unprofitabel"; Portfolio 3–9 Titel | [Q] Krauß/Krüger/Beerstecher 2015 (Kleinwerte, AAII-Daten) |
| Sloan-Accruals | Nach 2002 nicht mehr verlässlich positiv (Hedgefonds-Kapital) | [W] Green/Hand/Soliman, Mgmt Sci 2011 |
| Mohanram G-Score | Original: stärker bei großen, viel analysierten Firmen; keine unabhängige US-Nachprüfung nach 2005 gefunden | [W] |

Large-Cap-Hinweis: Der Effekt ist bei Großwerten kleiner als im Gesamtmarkt (H−L 0,28 gegenüber 0,33–0,40 %/Mon.; Piotroski/Mohanram-Erträge
stammen überwiegend aus Kleinwerten). Die Long-Only-Seite allein ist nur ein Teil davon und wird durch den Marktfaktor dominiert.
Eine Large-Cap-Long-only-Zahl **nach Kosten, 2010–2026, gegen SPY** habe ich nirgends gefunden.

Qualitäts-ETF als grober Praxisbeleg [W, Seite bestetf.net, Stichtag unklar]: QUAL (MSCI USA Sector Neutral Quality) 10-Jahres-Rendite 12,41 % vs. SPY
13,08 % p. a. (SPY schlägt QUAL); QUAL 2025 +12,65 %. Das ist ein Indexfonds mit hunderten Titeln, **keine** 30-Titel-Regel.

## 3. Ehrliche Einschätzung: schlägt GP/A-Long-only (≤30 Titel) SPY 2017–2026 nach 20 Bp je Seite?

- **Wahrscheinlichkeit: grob 25–35 %** (subjektive Schätzung, keine Messung). Erwartete Überrendite p. a. gegen SPY mit Dividenden: **−3 bis +1,5 Pp,
  Schwerpunkt um −1 Pp**.
- Für den Effekt: GP/A ist niedrig im Umschlag (jährlich ~2,0 laut Taxonomy → bei 20 Bp je Seite ≈ 0,1–0,2 Pp/Jahr Kosten, vernachlässigbar);
  PROF hielt nach 2007 stand (0,60 %/Mon., Long-Short, auch Kleinwerte). Hohe-GP-Großwerte sind teils Wachstumswerte (HML-Beta negativ [Q]).
- Dagegen: (a) Long-only-Alpha gegen den Markt ist klein (Größenordnung 2–3 Pp/J. historisch, **vor** McLean–Pontiff-Abzügen von 26–58 % [W]);
  (b) 2017–2026 führten Mega-Caps; Novy-Marx/Medhat nennen die „Magnificent Seven" als Treiber [Q]; ein gleichgewichteter oder nach GP/A
  gerankter 30er-Korb untergewichtet diese zwangsläufig, wenn sie bei GP/A (Bilanzsumme inflationiert durch Goodwill/Cash) nicht oben stehen [G];
  (c) Tracking Error eines 30er-Korbs ≈ 5–8 %/J. [G, Schätzwert] ⇒ Standardfehler der 9,5-Jahres-Überrendite ≈ 2–2,5 Pp, also ist selbst +1 Pp
  nicht von null trennbar. Die MDE liegt weit über jedem plausiblen wahren Effekt; Urteil wäre voraussichtlich „nicht entscheidbar".
- Piotroski/Sloan/Mohanram: eher niedriger (Hou–Xue–Zhang, Green et al.), nicht empfohlen.
- Die Branchenschieflage (Software/Pharma mit hohem GP/A) und Finanzwerte-Ausschluss (kein Bruttogewinn) sind Zusatzrisiken. [G]

## 4. Nicht belegt / offen

- Kein Nachbau **nach 2010** im Large-Cap-Universum, Long-only, **nach Kosten**, gegen SPY gefunden. Alle Kostenzahlen sind Long-Short/Dezil (Novy-Marx/Velikov).
- Primärtexte Piotroski 2000, Sloan 1996, Fama–French 2015, Hou–Xue–Zhang 2020, McLean–Pontiff 2016 und Mohanram 2005 nicht selbst gelesen (Websuche-Auszüge, Gedächtnis).
- SEC-Tag-Zuordnung (`GrossProfit`, `CostOfRevenue`, `Assets`, `NetCashProvidedByUsedInOperatingActivities`, `StockholdersEquity`) ist [G];
  Abdeckung von `GrossProfit` bei Großwerten und Vergleichbarkeit der TTM-Bildung aus Quartalsdaten ungeprüft.
- Konkrete Karenz gegen Look-ahead (filed + n Tage) hat keine Literaturquelle; Novy-Marx nutzt ≥6 Monate Verzug.
- Rundlauf-Kosten von 20 Bp je Seite sind projektseitig gesetzt; Taxonomy-Kosten (Effektivspreads, Großwerte) sind Schätzer, keine Ausführungsdaten.
- QUAL-Vergleich stammt von einer Aggregatorseite ohne Datumsstand; nicht als Beleg verwenden, nur als Größenordnung.
- 2017–2026-Eigenrechnung der Regel fehlt; die Wahrscheinlichkeit in Abschnitt 3 ist Urteil, kein Messwert.
