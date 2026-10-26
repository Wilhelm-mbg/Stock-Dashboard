# Familie: Dual Momentum (Antonacci) und Trendfilter (Faber 10-Monats-SMA), Monatstakt, long only, US-ETFs

Stand der Recherche: 04.10.2026. Markierung: [Q] = aus gelesener Quelle, [S] = nur aus Suchtreffer-Zusammenfassung (Seite nicht selbst gelesen), [G] = Gedächtniswissen/Schätzung, ungeprüft.
Ausdrücklich kein Beleg im Sinne der Mühle: nichts hier ist im Projekt gemessen. Belegstand der Kanten bleibt null.

## 1. Regeln, wörtlich

**Faber (2007; Update 02/2013), "A Quantitative Approach to Tactical Asset Allocation"** [Q: gelesen als PDF von mebfaber.com/wp-content/uploads/2016/05/SSRN-id962461.pdf, SSRN 962461]
- "BUY RULE: Buy when monthly price > 10-month SMA. SELL RULE: Sell and move to cash when monthly price < 10-month SMA."
- Ausführung: "All entry and exit prices are on the day of the signal at the close. The model is only updated once a month on the last day of the month."
- "All data series are total return series including dividends"; Cash = 90-Tage-T-Bills; "Taxes, commissions, and slippage are excluded."
- Universum (5 Klassen, Indizes, keine ETFs): US-Aktien (S&P 500), MSCI EAFE, 10J-Staatsanleihen, GSCI-Rohstoffe, NAREIT; gleich gewichtet, 1973-2012.
- Selbstauskunft: Das Modell sei im Schnitt zu ca. 30 % in Cash; Zeitraum nach 2005 gilt als "out of sample" (Fig. 16, nur als Bild, Zahlen nicht extrahierbar).

**Antonacci, "Absolute Momentum: A Simple Rule-Based Strategy and Universal Trend-Following Overlay" (SSRN 2244633)** [Q: PDF gelesen]
- "absolute momentum [is] positive when the excess return (asset return less the Treasury bill return) over the formation (look back) period is positive"; sonst "exit the asset and switch into 90-day U.S. Treasury bills".
- "We reevaluate and adjust positions monthly." Formationsperiode 12 Monate ("Best results cluster at 12 months").
- Kosten: "We deduct 20 basis points for transaction costs for each switch into or out of Treasury bills." Für Monats-Rebalancing keine Kosten abgezogen. (Das 20-Bp-Modell des Auftrags entspricht also der Quelle.)

**GEM / Dual Momentum (Antonacci 2012/2014 Buch "Dual Momentum Investing")** [S, über quantifiedstrategies.substack.com, einvestingforbeginners.com; Originaltext nicht selbst gelesen]
- Monatsende: 12-Monats-Gesamtrendite S&P 500 gegen MSCI ACWI ex US vergleichen, Sieger wählen; ist dessen 12-Monats-Rendite > T-Bill-Rendite, 100 % in den Sieger, sonst Aggregate Bonds. ETFs in Nachbauten: SPY, ACWX (oder VXUS/EFA), AGG (oder BND). Trades etwa 1,35 pro Jahr.

**Moskowitz-Ooi-Pedersen (2012, JFE), "Time Series Momentum"** [S: SSRN 2089463 per Suche; nicht gelesen]
- 12-Monats-Rendite positiv: long, negativ: short, Haltedauer 1 Monat, Positionen auf Volatilität skaliert; 58 liquide **Futures**, nicht ETFs, mit Leerverkauf. Für "long only, US-ETFs" nur indirekt übertragbar (Antonacci-Absolutmomentum ist die Long-only-Variante).

## 2. Berichtete Größen

**In-Sample/Autorenwerte (vor Kosten bzw. mit 20 Bp)**
- Antonacci Tab. 2, 1974-2012 [Q]: MSCI US mit AbsMom 12,26 % p.a., Vol 11,57, Sharpe 0,55, MaxDD -22,9 % gegen ohne 11,62 %, 15,74, 0,37, -50,65 %. EAFE: 10,39 % mit gegen 11,56 % ohne (Rendite niedriger, Risiko deutlich niedriger). Median über 8 Klassen 10,25 gegen 9,90 % p.a. Befund: Rendite etwa gleich, Gewinn liegt im Risiko.
- GEM 1974-2013 [S, einvestingforbeginners]: 17,43 % gegen S&P 500 12,34 % p.a. (Autorenwert, Indexdaten, Kosten unklar).
- Faber S&P 500 1901-2012 [S, Suchzusammenfassung]: CAGR 10,66 % gegen 9,75 % Buy&Hold, Vol 15,4 gegen 19,9 %; ca. 70 % investiert, unter einem Round-Trip pro Jahr. Faber selbst über 5 Klassen 1973-2012 [S]: 10,5 % gegen 9,9 %. Er schreibt, nach Kosten bleibe das risikoadjustierte Ergebnis besser, "though timing falls short on an absolute return measure" [Q, im Kontext Siegel/DJIA, S. 20 des Updates].

**Nach Veröffentlichung / unabhängig**
- Faber-Update 2013 [Q, Selbstauskunft des Autors, nicht unabhängig]: Out-of-sample 2006-2012 schlug das Timing Buy&Hold um "over two percentage points per year", bei nur 3 von 7 Jahren Mehrrendite (2006-2012 enthält die Krise 2008, also einen günstigen Test für jeden Trendfilter).
- GEM nach 2009 [S, einvestingforbeginners + Suchzusammenfassung]: "since 2009 this strategy has underperformed the S&P 500 by wide margin"; 2010-2019 +11,6 % gegen +13,6 % S&P 500, 2020-2023 +8,4 % gegen +12,1 % (Drittanbieter-Angabe, Methode und Kosten unbekannt). Tiefster GEM-Drawdown seit 55 Jahren 2021-2023 in der Defensive: -21,6 % (Dez. 2021 bis Okt. 2023) [S].
- Neuere Replikation: Petit, "Global Equities Momentum, 1971-2026" (SSRN 7427878) [S, Abstract nicht abrufbar, 403]: GEM 15,18 % gegen 11,27 % passiv (1971-2026), MaxDD -21,7 % gegen -50,9 %; "underperformed a passive index by 4.8 points a year since 2010" (Formulierung aus Suchzusammenfassung, Bezugsgröße unklar). Die Langfristzahl ist also von den Jahren vor 2000 getragen.
- strategyindex.io [Q, gelesen]: GEM (VOO/VXUS/BND) 2016-2026: CAGR 12,3 %, MaxDD -17,8 %, Sharpe 0,72, Vol 12,5 %, "zero transaction slippage". Kein SPY-Vergleich auf der Seite. Dual-Momentum-Variante 10,9 %, -18,2 %.
- backtestedstrategies.com [Q, gelesen]: Nachbau SPY/ACWX/AGG, Vergleichsgröße ist nicht SPY, sondern 45/28/27-Portfolio. Vorschau 2021-2025: 10,6 % gegen 8,6 %; Seite sagt, der volle Zeitraum 2010-2025 "reverses that recent-window headline" (GEM dort schlechter). Kosten nicht genannt.
- Allocate Smartly: Seiten nicht abrufbar (404). Kein Beleg von dort.

**Gegen SPY 2017-2026 (mit Ausschüttungen)**: Kein Beleg mit offengelegten Kosten gefunden. Nur Drittseiten: GEM 12,3 % p.a. 2016-2026 ohne Kosten [Q]. SPY-Gesamtrendite 2017-2026 liegt nach meiner Erinnerung grob bei 14-15 % p.a. [G, ungeprüft, im Projekt aus kursdaten.json nachrechnen]. Dann hätte GEM SPY in dem Zeitraum um etwa 2 Pp p.a. verfehlt, vor Kosten. Das passt zu den Quellen: Trendfilter und Dual Momentum senken Drawdown, nicht Rendite. In einer langen Hausse ohne tiefen Einbruch (2017-2019, 2023-2026) kostet die Absicherung Rendite.

## 3. Ehrliche Einschätzung (alles [G]-Schätzung, nicht gemessen)

Zielgröße: SPY nach 20 Bp je Seite über 5 Jahre in BEIDEN Fenstern (2017-09/2021 und 09/2021-09/2026) schlagen.
- Fenster 1 enthält den Einbruch 2020, Fenster 2 das Bärenjahr 2022. Ein Filter, der Drawdowns abfängt, kann gewinnen, wenn er 2020/2022 rechtzeitig draußen ist; beide Einbrüche waren aber kurz (2020 etwa ein Monat, V-Erholung; GEM wurde laut Quelle 2020 "whiplashed" [S]) bzw. wurden spät erkannt. Anteil mit Kosten gegen SPY vermutlich unter 50 % je Fenster.
- Wahrscheinlichkeit, SPY in beiden Fenstern zu schlagen: etwa 10-20 % für GEM/Dual Momentum, 10-15 % für Faber-5-Klassen (die Diversifikation in Anleihen/Rohstoffe/REITs/EAFE bremst gegen einen reinen US-Aktien-Lauf, weil das Vergleichsmaß SPY ist). Die Fenster sind überlappungsfrei, aber SPY-Stärke 2023-2026 und Rendite-Verzicht in Cash korrelieren; 10-20 % ist daher eher obere Grenze.
- Erwartete Größe gegen SPY je Fenster: Spanne -4 bis +1 Pp p.a. nach Kosten, Mittelpunkt etwa -2 Pp. Begründung: Drittseiten zeigen 2010-2023 Rückstand zwischen 2 und 4,8 Pp [S]; Kosten selbst klein (0,3-1,1 Trades/Jahr x 40 Bp, also grob 0,1-0,4 Pp p.a., nach Antonacci-Zahlen [Q]). Der Rückstand ist Absicherungsprämie, nicht Kostenproblem. Risikoadjustiert (Sharpe, Drawdown) deutlich besser; das ist aber nicht das Ziel "SPY schlagen".
- Hauptrisiko: Hausse ohne tiefen, langen Einbruch; dazu Whipsaw (2020, 2022-2023: GEM Drawdown -21,6 % in der Defensive [S], weil Anleihen 2022 gleichzeitig fielen). Zweites Risiko: Bekanntheit der Regel (Antonacci 2012, Faber 2007), kein Nachweis einer Restkante nach Veröffentlichung.
- Mühle: Nur zwei Fenster, effektiv wenige unabhängige Marktzyklen; MDE gegen Tagestreuung unbrauchbar, die Frage "schlägt SPY" ist bei 5 Jahren und Monatsrebalancing mit etwa 60-120 Beobachtungen pro Fenster praktisch nicht entscheidbar. Als Handelsregel für das Projekt taugt die Familie höchstens als Risikoüberlagerung, nicht als Renditekante; das passt zum früheren Projektbefund (SPY>EMA200 kostete Rendite).

## 4. Nicht belegt

- Kein unabhängiger, kostenbereinigter Nachbau mit SPY-Vergleich über 2017-2026 gefunden (Allocate Smartly, Optimal Momentum, quantifiedstrategies: 404/403/Bot-Sperre; Petit-SSRN-Abstract nicht lesbar).
- Faber-Zahlen für Fig. 13/16 (Bilder) nicht extrahierbar; die genannten CAGR-Werte stammen aus Suchzusammenfassungen [S].
- GEM-Originalbuch und Moskowitz-Paper nicht selbst gelesen; Regeltext GEM aus Sekundärquellen.
- SPY-Gesamtrenditen 2017-2026 und die Rückstände 2010-2023 nicht selbst nachgerechnet; Drittseiten ohne offengelegte Methode.
- Keine Zahl zur Wahrscheinlichkeit ist aus Daten abgeleitet; sie ist ein begründetes Urteil. Nachrechnen im Projekt bräuchte ETF-Monatsdaten (SPY, ACWX/EFA, AGG, BIL) mit Ausschüttungen, 20 Bp je Seite, Vorregistrierung vorher.
