# 01 Momentum-Fonds: Regel, Kosten, Gesamtertrag, Rückschlag (Stand Abruf 2026-10-04)

Simulation/Recherche, keine Anlageberatung, keine Kauf-/Verkaufsempfehlung.
Texte aus Webseiten sind als Daten behandelt.

## Methode und Datenlage (wichtig)

- Zeitreihen: Yahoo Finance Chart-API (v8), **Tagesschlusskurse, `adjclose`** (Ausschüttungen wiederangelegt).
  Abruf 2026-10-04, Beispiel: `https://query2.finance.yahoo.com/v8/finance/chart/MTUM?period1=1483228800&period2=1790000000&interval=1d&events=div`.
  Der CSV-Download (`/v7/finance/download`) lieferte 401, stooq.com brach die Verbindung ab (beides 2026-10-04).
- Rechnung: `01-berechnung.js`; Ergebnisse `01-momentum-fonds.csv` / `.json`.
- **Fensterkonvention (Annahme, gekennzeichnet):** Basis ist der Schlusskurs des letzten Handelstags VOR dem Fensterbeginn, damit der erste Fenstertag voll zählt. Fenster A: Basis 03.01.2017 -> Ende 15.09.2021. Fenster B: Basis 15.09.2021 -> Ende 15.09.2026. Fenster A ist also 04.01.2017–15.09.2021 inkl. Rendite des 04.01.; B 16.09.2021–15.09.2026.
- Max. Rückschlag = größter Schlusskurs-Rückgang vom Hoch im Fenster (Hoch ab Basis), auf `adjclose`.
- Thesaurierende UCITS-Fonds (Acc): Kurs = Gesamtertrag (Yahoo zeigt 0 Dividenden, adjclose = close). Plausibel, aber nicht gegen Anbieter-Factsheet gegengeprüft: **offen**.
- Yahoo-`adjclose` ist eine Drittquelle, kein Anbieter-NAV. Gegenprüfung gegen Anbieter-Renditetabellen: **offen** (Rate-Limit der Suchwerkzeuge, Factsheet-Tabellen waren nur als Excerpt ohne Zahlen).
- UCITS-Börsenkurse in EUR (Xetra, `.DE`) schließen um 17:30 MEZ, SPY um 16:00 New York: kleine Zeitversatz-Unschärfe. USD-Listings (London `.L`, Swiss `.SW`) sind mit SPY in USD direkt vergleichbar, schließen aber ebenfalls zu anderen Uhrzeiten.
- Währung: EURUSD (Yahoo `EURUSD=X`) Änderung A: +13,0 % (Euro stärker), B: -2,4 % (Euro schwächer). Heißt: SPY in EUR umgerechnet: A +91,0 %, B +85,4 % (statt USD +115,8 % / +80,9 %). Die EUR-Fonds A-Zahlen sind daher mit "SPY in EUR" zu vergleichen, nicht mit SPY in USD. SPY-in-EUR rechnet nur auf Tagen, an denen Kurs und FX-Wert beide vorliegen (Datumslücken möglich, Näherung).
- Alle Fenster sind Rückblick auf vergangene Kurse, kein Hinweis auf Zukünftiges. Ein Fenstervergleich zweier Zeiträume ist kein statistischer Test (keine MDE/Cluster-t gerechnet).

## Ergebnis-Tabelle (Gesamtertrag mit Ausschüttungen, Tagesdaten)

| Fonds (Ticker, Währung) | Fenster A Ertrag | A max. Rückschlag | Fenster B Ertrag | B max. Rückschlag |
|---|---|---|---|---|
| **SPY** (USD) Benchmark | +115,8 % | -33,7 % (19.02.–23.03.2020) | +80,9 % | -24,5 % (03.01.–12.10.2022) |
| SPY umgerechnet in EUR (Näherung) | +91,0 % | -33,1 % | +85,4 % | -23,8 % |
| QMOM (USD) | +110,6 % | -39,1 % | +45,4 % | -26,8 % (16.11.2021–26.10.2023) |
| MTUM (USD) | +152,3 % | -34,1 % | +74,1 % | -32,3 % (03.11.2021–17.06.2022) |
| SPMO (USD) | +144,9 % | -31,0 % | +141,0 % | -22,7 % (04.01.–26.09.2022) |
| PDP (USD) | +123,9 % | -34,7 % | +41,7 % | -33,9 % (08.11.2021–26.09.2022) |
| iShares Edge MSCI USA Momentum UCITS USD Acc, **IUMO.L (USD, London)** | +145,3 % | -33,8 % | +68,4 % | -31,9 % |
| dasselbe Papier, **QDVA.DE (EUR, Xetra)** | +116,8 % | -33,3 % | +72,3 % | -25,6 % (19.02.–09.04.2025) |
| iShares Edge MSCI World Momentum UCITS Acc, **IWMO.L (USD, London)** | +133,8 % | -31,5 % | +72,4 % | -29,6 % |
| dasselbe Papier, **IS3R.DE (EUR, Xetra)** | +106,0 % | -30,8 % | +76,4 % | -23,6 % |
| Xtrackers MSCI World Momentum UCITS 1C, **XDEM.SW (USD, Swiss)** | +136,7 % | -31,5 % | +72,3 % | -29,8 % |
| dasselbe Papier, **XDEM.DE (EUR, Xetra)** | +107,8 % | -30,9 % | +77,0 % | -23,5 % |

Einordnung nur als Zahl: Gegen SPY (USD) lag in Fenster A jeder Fonds außer QMOM (und die EUR-Listings, die gegen SPY-in-EUR zu lesen sind) vorn bzw. gleich; in Fenster B lag nur SPMO vor SPY, alle anderen dahinter. In EUR gerechnet (die drei EUR-Listings QDVA, IS3R, XDEM.DE gegen SPY-in-EUR): in A lagen alle drei vor SPY-EUR (+116,8 / +106,0 / +107,8 % gegen +91,0 %), in B alle drei dahinter (+72,3 / +76,4 / +77,0 % gegen +85,4 %). Die Währung ändert die Rangfolge, nicht nur die Höhe.

Hinweis zu QMOM/SPMO: beide Fonds bestanden in beiden Fenstern (QMOM Start 01.12.2015, SPMO Start 09.10.2015): kein "nicht vorhanden". Kein Fonds fehlt in Fenster A: IUMO/QDVA (Start 13.10.2016), IWMO/IS3R (03.10.2014), XDEM (05.09.2014) existierten vor dem 04.01.2017.
Ausnahme: **First Trust US Momentum UCITS (FTMO.L/FTGM.DE)** erst ab 05.08.2024 handelbar -> Fenster A und B "nicht vorhanden" (B nur teilweise). Nicht weiter ausgewertet.

## Regel je Fonds, Kosten, Quellen

Alle Quellen Abruf 2026-10-04.

### QMOM, Alpha Architect U.S. Quantitative Momentum ETF (aktiv, USD)
- (a) Regel: US-gelistete Werte; mehrstufige quantitative, regelbasierte Methode des Sub-Advisers wählt rund 50 bis 200 Titel mit dem höchsten relativen Momentum; Herstellerseite nennt monatliches Rebalancing. **Gewichtung: offen** (Beschreibung nennt keine). Aktiver Fonds mit Index-ähnlichem Regelwerk, kein Indexfonds.
- (b) Kostenquote 0,28 % (Herstellerseite und Yahoo-Zusammenfassung). Abweichende Angabe 0,49 % auf sumgrowth.com (Drittseite, nicht übernommen).
- Start 01.12.2015.
- Quellen: https://funds.alphaarchitect.com/qmom/ ; https://finance.yahoo.com/quote/QMOM/ ; https://www.sumgrowth.com/etf-profile/invest-in-QMOM-etf.html

### MTUM, iShares MSCI USA Momentum Factor ETF (USD)
- (a) Regel: Index MSCI USA Momentum (Mutterindex MSCI USA, 513 Werte), 125 Konstituenten, Auswahl nach Preismomentum (laut justETF-Beschreibung der Welt-Variante: 6- und 12-Monats-Anstieg), Gewichtung aus Momentum-Wert kombiniert mit Marktkapitalisierung (Excerpt sumgrowth, gekürzt), Anpassung halbjährlich (sumgrowth; Sonderrebalancing bei Momentum-Wechsel nicht verifiziert: **offen**).
- (b) Kostenquote 0,15 % (Factsheet 30.06.2026). Start 16.04.2013.
- Quellen: https://www.msci.com/www/fact-sheet/msci-usa-momentum-index/07827627 ; https://www.ishares.com/us/literature/fact-sheet/mtum-ishares-msci-usa-momentum-factor-etf-fund-fact-sheet-en-us.pdf ; https://www.sumgrowth.com/etf-profile/invest-in-MTUM-etf.html

### SPMO, Invesco S&P 500 Momentum ETF (USD)
- (a) Regel: Index S&P 500 Momentum; Werte aus dem S&P 500 mit hohem Momentum-Score; 100 Werte (Stand 01.10.2026); Rekonstitution und Rebalancing zweimal jährlich am dritten Freitag im März und September; Gewichtung nach Marktkapitalisierung mal Momentum-Score.
- (b) Kostenquote 0,13 % (netto = brutto). Start 09.10.2015.
- Quelle: https://www.invesco.com/us/en/financial-products/etfs/invesco-sp-500-momentum-etf.html ; https://www.spglobal.com/spdji/en/indices/dividends-factors/sp-500-momentum-index/

### PDP, Invesco Dorsey Wright Momentum ETF (USD)
- (a) Regel: Index Dorsey Wright Technical Leaders; rund 100 US-Werte aus Nasdaq US Large Cap / Mid Cap Index nach relativer Stärke (proprietäre Methode); vierteljährlich neu zusammengesetzt; 101 Werte (02.10.2026). **Gewichtung: offen.**
- (b) Kostenquote 0,62 %. Start 01.03.2007 (Indexstart-Datum der Seite).
- Quelle: https://www.invesco.com/us/en/financial-products/etfs/invesco-dorsey-wright-momentum-etf.html

### iShares Edge MSCI USA Momentum Factor UCITS ETF USD (Acc), IUMO / QDVA (UCITS, Irland)
- (a) Regel: sucht den MSCI USA Momentum Index nachzubilden (Teilmenge von MSCI USA mit steigendem Preistrend; Indexzahl 125 laut MSCI-Factsheet des US-Index, für den UCITS nicht separat verifiziert); Gewichtung/Takt wie MTUM-Index (vermutet, **Schätzung**).
- (b) TER 0,20 %. Start Anteilsklasse 13.10.2016. Währung des Fonds USD. **Handelswährung:** IUMO.L (London) USD; QDVA.DE (Xetra) EUR. Thesaurierend.
- Währungseffekt: das EUR-Listing hält denselben USD-Fonds; EUR-Kurs schwankt mit EURUSD (A: +13 % Euro stärker drückte den EUR-Ertrag, B: -2,4 % hob ihn leicht). Die Spalten oben zeigen den Unterschied (A +145,3 % USD vs. +116,8 % EUR).
- Quellen: https://www.blackrock.com/lu/individual/en/products/285208/ishares-edge-msci-usa-momentum-factor-ucits-etf ; https://www.ishares.com/uk/individual/en/products/285208/ishares-edge-msci-usa-momentum-factor-ucits-etf ; https://www.justetf.com/en/etf-profile.html?isin=IE00BFF5RZ82 (Dist-Variante, TER 0,20 %, Start 21.02.2018)

### iShares Edge MSCI World Momentum Factor UCITS ETF (Acc), IWMO / IS3R, ISIN IE00BP3QZ825 (UCITS, Irland)
- (a) Regel: MSCI World Momentum Index, hohe Preis-Momentum-Werte aus 23 Industrieländern (Auswahl nach Anstieg über 6 und 12 Monate); 352 Positionen; Replikation per Sampling (physisch); thesaurierend. Gewichtung/Takt: **offen** (MSCI-Methodikdokument wegen Rate-Limit nicht abgerufen).
- (b) TER 0,25 %. Start 03.10.2014. Fondswährung USD; **Handelswährung** IWMO.L USD, IS3R.DE EUR.
- Quelle: https://www.justetf.com/en/etf-profile.html?isin=IE00BP3QZ825

### Xtrackers MSCI World Momentum UCITS ETF 1C, XDEM, ISIN IE00BL25JP72 (UCITS, Irland)
- (a) Regel: MSCI World Momentum Index; vollständige Replikation (laut justETF-Vergleichstabelle), thesaurierend. Zahl der Werte, Takt, Gewichtung: **offen**.
- (b) TER 0,25 %. Start 05.09.2014. Fondswährung USD; **Handelswährung** XDEM.SW USD, XDEM.DE EUR (auch XDEM.L GBp, XDEM.MI EUR).
- Quellen: https://www.justetf.com/en/how-to/invest-in-momentum-etfs.html ; https://www.justetf.com/en/etf-profile.html?isin=IE00BL25JP72. ; https://etfatlas.com/etf-details/IE00BL25JP72

## Was es nicht gibt bzw. nicht gefunden wurde

- "IUSM" ist kein iShares-Momentum-Ticker: IUSM.DE ist laut Yahoo ein iShares $ Treasury Bond 7-10yr Fonds. Der gemeinte USA-Momentum-UCITS ist IUMO/QDVA.
- Ein **Invesco S&P 500 Momentum UCITS ETF** und ein **Xtrackers MSCI USA Momentum UCITS ETF** wurden in der justETF-Momentum-Vergleichsliste (Stand 07.09.2026) und den Yahoo-Suchen nicht gefunden: Existenz **nicht belegt**, kein Ertragsvergleich. Quelle: https://www.justetf.com/en/how-to/invest-in-momentum-etfs.html
- Weitere World-Momentum-UCITS (nicht ausgewertet): Xtrackers MSCI World Momentum ESG, iShares MSCI World Momentum Factor Advanced (IE000L5NW549), Amundi MSCI World Momentum Advanced; alle jünger. Quelle: justETF-Seite oben.

## Lücken

1. Anbieter-Gegenprüfung der Yahoo-adjclose-Zahlen (Factsheet-Renditetabellen): offen.
2. Gewichtung/Takt für QMOM, PDP, XDEM, IWMO: offen; MTUM-Takt nur aus Drittseite.
3. Monatsenden-Alternative nicht nötig (Tagesdaten vorhanden).
4. Kein Test auf Signifikanz: zwei Fenster, ein Fonds je Fenster, Fonds sind hoch korreliert und Faktorbeta nicht bereinigt.
