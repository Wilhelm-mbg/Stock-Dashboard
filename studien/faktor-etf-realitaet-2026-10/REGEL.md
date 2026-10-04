# REGEL — Faktor-ETF-Realitätsprobe: Hat ein käuflicher Faktor-/Smart-Beta-ETF über fünf Jahre verlässlich den S&P 500 geschlagen?

Kennung `faktor-etf-realitaet-2026-10/v1`. Diese Datei und `fonds.json` sind geschrieben und committet (**Siegel**), **bevor ein
einziger Kurs geladen wurde** — weder ein Fondskurs noch ein Wechselkurs. Die UCITS-Gegenstücke wurden ohne Blick auf Renditen
gesucht (Rechercheauftrag: Renditen ignorieren, alle Fonds nach der Regel in B3 aufnehmen; Recherche-Protokoll
`ucits-recherche.md`). Nach dem Siegel werden Liste und Regeln nicht mehr geändert. Was nicht geht, wird gemeldet, nicht angepasst.
Ein Fehler im Code wird benannt, behoben, wiederholt und in `ERGEBNIS.md` unter „Korrekturen" vermerkt. Ein Ergebnis, das nicht
gefällt, ist kein Fehler.

Beschreibende Zahlen nach vorher festgelegter Regel — **keine Anlageberatung**, kein „kaufen".

## Teil A — Frage und Entscheidungsregel

**A0. Aus dem Auftrag, wörtlich:**

> FRAGE DES ANLEGERS: Er steckt echtes Geld nur in etwas, das nach Kosten den S&P 500 schlägt, sonst in einen S&P-500-Indexfonds.
> Gibt es ein einfaches, KÄUFLICHES Produkt (Faktor- oder Smart-Beta-ETF), das das über fünf Jahre verlässlich geschafft hat?

> Kennzahlen: Gesamtertrag mit Ausschüttungen nach Fondskosten (Kurs adjclose bzw. Schluss + Ausschüttungen), (a) Fenster A
> 04.01.2017–15.09.2021 und B 16.09.2021–15.09.2026, (b) ALLE rollierenden 5-Jahres-Fenster mit Monatsstart ab Auflage des jüngeren
> der beiden: Anteil der Fenster vor SPY, Median und schlechtester Abstand p. a., größter Rückschlag gegen SPY; (c)
> Überlebensverzerrung benennen (geschlossene Fonds fehlen – suche, welche Faktor-ETFs seit 2010 geschlossen wurden, und nenne sie).
> Entscheidung vorab: als „verlässlich vorn" gilt nur, was in mindestens 80 % der 5-Jahres-Fenster vor SPY liegt UND in beiden
> Fenstern A und B vorn ist.

**A1. Die Urteilssätze je Fonds — genau drei, vorab festgelegt:**

- **„verlässlich vorn"**: Anteil der rollierenden 5-Jahres-Fenster (Teil C4) mit Gesamtertrag Fonds > Gesamtertrag SPY **≥ 80 %**
  **und** Fonds > SPY in Fenster A **und** Fonds > SPY in Fenster B.
- **„nicht verlässlich vorn"**: A, B und die rollierenden Fenster sind berechenbar, mindestens eine der drei Bedingungen ist verfehlt.
- **„nicht beurteilbar (zu jung)"**: Fenster A oder B ist nicht berechenbar (Reihe beginnt nach dem 03.01.2017 oder hat an einem
  Fensterrand eine Lücke von mehr als 10 Kalendertagen). Die Zahlen werden trotzdem ausgewiesen, soweit berechenbar.
- „Vorn" heißt **strikt größer**. Gleichstand zählt als nicht vorn.
- **UCITS-Fonds (B3)** sind nur dann „verlässlich vorn", wenn die drei Bedingungen **sowohl gegen SPY** (in USD) **als auch gegen
  SXR8** (iShares Core S&P 500 UCITS, Xetra, in EUR) erfüllt sind — Begründung C6. Das macht die Regel nur strenger, nie milder;
  beide Vergleiche werden immer vollständig ausgewiesen.
- Die Kurzfassung nennt die Fonds „verlässlich vorn" getrennt nach (i) vom Auftrag verlangt (B1), (ii) Zusatz (B2), (iii) UCITS (B3),
  jeweils mit dem Hinweis, ob ein deutscher Privatanleger den Fonds kaufen kann (C8). Kontrollen (B2, B3) bekommen kein Urteil im
  Sinne der Frage, sondern dienen als Eichung (C7).
- Kein Mindestabstand: die Regel des Auftrags verlangt keinen. Der Median des Abstands steht deshalb immer daneben; die Kontrollen
  IVV/VOO zeigen, wie wenig für „vorn" reicht.

## Teil B — Die Fondsliste (vor dem ersten Kurs festgelegt; maschinenlesbar in `fonds.json`)

Spalte „Lauf" = welcher Agent die Reihe lädt, prüft und rechnet (g1–g5).

### B1. Vom Auftrag verlangt — 27 US-ETFs

| Gruppe | Kürzel | Fonds | Lauf |
|---|---|---|---|
| Gleichgewicht | RSP | Invesco S&P 500 Equal Weight ETF | g1 |
| Qualität | QUAL | iShares MSCI USA Quality Factor ETF | g1 |
| Qualität | SPHQ | Invesco S&P 500 Quality ETF | g1 |
| Niedrige Schwankung | USMV | iShares MSCI USA Min Vol Factor ETF | g1 |
| Niedrige Schwankung | SPLV | Invesco S&P 500 Low Volatility ETF | g1 |
| Multifaktor | LRGF | iShares U.S. Equity Factor ETF | g1 |
| Multifaktor | GSLC | Goldman Sachs ActiveBeta U.S. Large Cap Equity ETF | g1 |
| Moat | MOAT | VanEck Morningstar Wide Moat ETF | g1 |
| Free Cashflow | COWZ | Pacer US Cash Cows 100 ETF | g1 |
| Value | VLUE | iShares MSCI USA Value Factor ETF | g2 |
| Value | IWD | iShares Russell 1000 Value ETF | g2 |
| Value | RPV | Invesco S&P 500 Pure Value ETF | g2 |
| Wachstum | IWF | iShares Russell 1000 Growth ETF | g2 |
| Wachstum | QQQ | Invesco QQQ Trust (Nasdaq-100) | g2 |
| Momentum | MTUM | iShares MSCI USA Momentum Factor ETF | g2 |
| Momentum | SPMO | Invesco S&P 500 Momentum ETF | g2 |
| Momentum | QMOM | Alpha Architect U.S. Quantitative Momentum ETF | g2 |
| Momentum | PDP | Invesco Dorsey Wright Momentum ETF | g2 |
| Dividende | SCHD | Schwab U.S. Dividend Equity ETF | g3 |
| Dividende | VIG | Vanguard Dividend Appreciation ETF | g3 |
| Dividende | DGRO | iShares Core Dividend Growth ETF | g3 |
| Dividende | VYM | Vanguard High Dividend Yield ETF | g3 |
| Aktionärsrendite | PKW | Invesco BuyBack Achievers ETF | g3 |
| Aktionärsrendite | SYLD | Cambria Shareholder Yield ETF | g3 |
| Kleine Werte | IJR | iShares Core S&P Small-Cap ETF | g3 |
| Kleine Werte | IWM | iShares Russell 2000 ETF | g3 |
| Kleine Werte | AVUV | Avantis U.S. Small Cap Value ETF | g3 |

### B2. Zusatz (nicht verlangt) — 18 weitere große US-Faktor-/Stil-ETFs und zwei Kontrollen

Ausgewählt, ohne einen Kurs anzusehen, als die bekanntesten Vertreter derselben Faktoren mit langer Historie, damit die Antwort
nicht an der Auswahl des Auftrags hängt. Sie werden in der Kurzfassung **getrennt** gezählt.

| Gruppe | Kürzel | Fonds | Lauf |
|---|---|---|---|
| Fundamentalgewichtung | PRF | Invesco FTSE RAFI US 1000 ETF | g1 |
| Umsatzgewichtung | RWL | Invesco S&P 500 Revenue ETF | g1 |
| Multifaktor | QUS | SPDR MSCI USA StrategicFactors ETF | g1 |
| Value | IVE | iShares S&P 500 Value ETF | g2 |
| Value | VTV | Vanguard Value ETF | g2 |
| Wachstum | IVW | iShares S&P 500 Growth ETF | g2 |
| Wachstum | VUG | Vanguard Growth ETF | g2 |
| Wachstum | SCHG | Schwab U.S. Large-Cap Growth ETF | g2 |
| Wachstum | MGK | Vanguard Mega Cap Growth ETF | g2 |
| Dividende | NOBL | ProShares S&P 500 Dividend Aristocrats ETF | g3 |
| Dividende | SDY | SPDR S&P Dividend ETF | g3 |
| Dividende | DVY | iShares Select Dividend ETF | g3 |
| Dividende | HDV | iShares Core High Dividend ETF | g3 |
| Dividende | SPHD | Invesco S&P 500 High Dividend Low Volatility ETF | g3 |
| Dividende | DGRW | WisdomTree U.S. Quality Dividend Growth Fund | g3 |
| Mittlere Werte | IJH | iShares Core S&P Mid-Cap ETF | g3 |
| Kleine Werte | VBR | Vanguard Small-Cap Value ETF | g3 |
| Kleine Werte | IJS | iShares S&P Small-Cap 600 Value ETF | g3 |
| **Kontrolle** | IVV | iShares Core S&P 500 ETF (gleicher Index wie SPY) | g1 |
| **Kontrolle** | VOO | Vanguard S&P 500 ETF (gleicher Index wie SPY) | g1 |

### B3. UCITS-Gegenstücke (in Deutschland kaufbar)

Recherche ohne Blick auf Renditen: 95 in Deutschland handelbare UCITS-ETFs mit Quelle je Fonds (`ucits-recherche.md/.json`;
Stammdaten von der justETF-Profilseite, Yahoo-Symbole nur über den Such-Endpunkt ohne Kurse). **Mechanische Auswahl** (`fonds-bauen.js`):

1. **Nur Fonds mit Auflage bis 31.08.2021** — ein jüngerer Fonds hat bis August 2026 kein einziges 5-Jahres-Fenster. Die 19 jüngeren stehen unten mit Namen.
2. **Eine Anteilsklasse je Fonds**: die mit der frühesten Auflage (längste Historie desselben Portfolios); bei gleichem Datum die
   thesaurierende, dann die mit Xetra-Kürzel. 16 zweite Klassen fallen so weg (unten).
3. **Ausgeschlossen** (1): HSBC MSCI USA Quality UCITS ETF USD (IE00B5WFQ436) — bildete laut Recherche bis 2025 den breiten MSCI USA ab (Wechsel auf MSCI USA Sector Neutral Quality per Mitteilung vom 18.03.2025) - die Historie misst keinen Faktor.
4. Währungsgesicherte Klassen und reine ESG-Zwillinge hatte schon die Recherche weggelassen (dort „ausgeschlossen" mit Grund). Fonds, deren
   Index später auf eine ESG-/Paris-Variante gewechselt hat, bleiben drin und tragen den Vermerk (Spalte Bemerkung) — der Anleger hätte
   genau diesen Fonds gehalten.
5. Yahoo-Kandidaten je Fonds in fester Reihenfolge (Xetra `.DE`, London `.L`, Amsterdam `.AS`, Zürich `.SW`, Mailand `.MI`, Paris `.PA`,
   dann deutsche Regionalbörsen, ISIN-Symbole zuletzt), höchstens vier; die Wahl trifft C6.
6. Klasse: *gleicher Index* wie der US-Fonds, *US-Faktor* (derselbe Faktor auf US-Aktien, anderer Index), *Welt* (derselbe Faktor auf
   MSCI World/Welt — der Vergleich mit dem S&P 500 mischt hier Faktor und Region). Dazu zwei **Kontrollen**: SXR8 selbst gegen SPY und
   der synthetische Invesco S&P 500 UCITS (P500) gegen SXR8.

| Gruppe | Kennung | Fonds | ISIN | Auflage | Klasse | Ertrag | US-Gegenstück | Yahoo-Kandidaten | Lauf | Quelle | Bemerkung |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Gleichgewicht | **XDEW** | Xtrackers S&P 500 Equal Weight UCITS ETF 1C | IE00BLNMYC90 | 10.06.2014 | gleicher Index | thes. | RSP | XDEW.DE, XDEW.L, XDEW.SW, XDEW.MI | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BLNMYC90) |  |
| Gleichgewicht | **SP2Q** | Invesco S&P 500 Equal Weight UCITS ETF (Acc) | IE00BNGJJT35 | 06.04.2021 | gleicher Index | thes. | RSP | SP2Q.DE, SPEQ.L, SP2Q.DU, SP2Q.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BNGJJT35) | Physisch. |
| Qualität | **QDVB** | iShares Edge MSCI USA Quality Factor UCITS ETF USD (Acc) | IE00BD1F4L37 | 13.10.2016 | gleicher Index | thes. | QUAL | QDVB.DE, IUQA.L, QDVB.DU, QDVB.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BD1F4L37) | Gleicher Index wie QUAL. |
| Qualität | **UBUT** | UBS Factor MSCI USA Quality Screened UCITS ETF USD dis | IE00BX7RRJ27 | 26.08.2015 | US-Faktor | aussch. | QUAL | UBUT.DE, UBUT.AS, UQLTD.SW, UBUT.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BX7RRJ27) | Indexwechsel auf ESG-Low-Carbon-Variante zum 31.07. (Jahr in der Quelle nicht lesbar; Suchauszug etfstream). Davor MSCI USA Quality. Gehedgte Klassen ausgelasse (ESG-Filter) |
| Qualität | **IS3Q** | iShares Edge MSCI World Quality Factor UCITS ETF USD (Acc) | IE00BP3QZ601 | 03.10.2014 | Welt | thes. | QUAL | IS3Q.DE, IWQU.L, IS3Q.DU, IS3Q.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BP3QZ601) |  |
| Qualität | **XDEQ** | Xtrackers MSCI World Quality UCITS ETF 1C | IE00BL25JL35 | 11.09.2014 | Welt | thes. | QUAL | XDEQ.DE, XDEQ.L, XDEQ.SW, XDEQ.SG | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BL25JL35) |  |
| Niedrige Schwankung | **XMVU** | Xtrackers MSCI USA Minimum Volatility UCITS ETF 1D | IE00BDB7J586 | 08.11.2016 | gleicher Index | aussch. | USMV | XMVU.L, XMVU.DU, IE00BDB7J586.SG | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BDB7J586) | Gleicher Index wie USMV; jährliche Ausschüttung; kein Xetra-Listing laut justETF. |
| Niedrige Schwankung | **MIVU** | Amundi MSCI USA Minimum Volatility Factor UCITS ETF DR | LU1589349734 | 10.04.2017 | gleicher Index | thes. | USMV | MIVU.DE, MIVU.PA, MIVU.DU, MIVU.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=LU1589349734) | justETF meldet Replikation synthetisch (Unfunded Swap), obwohl der Name DR trägt - Widerspruch, ungeprüft. |
| Niedrige Schwankung | **SPY1** | SPDR S&P 500 Low Volatility UCITS ETF (State Street) | IE00B802KR88 | 03.10.2012 | gleicher Index | thes. | SPLV | SPY1.DE, LOWV.L, SPY1.DU, SPY1.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B802KR88) | Gleicher Index wie SPLV. Invesco-Gegenstück IE00BKW9SX35 nicht in DE, siehe ausgeschlossen. |
| Niedrige Schwankung | **IBCK** | iShares Edge S&P 500 Minimum Volatility UCITS ETF USD (Acc) | IE00B6SPMN59 | 30.11.2012 | US-Faktor | thes. | USMV/SPLV | IBCK.DE, SPMV.L, IBCK.DU, IBCK.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B6SPMN59) | Optimierungs-Index (wie USMV), aber auf S&P 500 statt MSCI USA. |
| Niedrige Schwankung | **UBUR** | UBS Factor MSCI USA Low Volatility UCITS ETF USD dis | IE00BX7RQY03 | 26.08.2015 | US-Faktor | aussch. | USMV | UBUR.DE, UC95.L, UBUR.AS, UBUR.DU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BX7RQY03) | Risikogewichteter Index, kein Minimum-Volatility-Optimierer. |
| Niedrige Schwankung | **IQQ0** | iShares Edge MSCI World Minimum Volatility UCITS ETF USD (Acc) | IE00B8FHGS14 | 30.11.2012 | Welt | thes. | USMV | IQQ0.DE, MVOL.L, IQQ0.DU, IQQ0.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B8FHGS14) |  |
| Niedrige Schwankung | **XDEB** | Xtrackers MSCI World Minimum Volatility UCITS ETF 1C | IE00BL25JN58 | 05.09.2014 | Welt | thes. | USMV | XDEB.DE, XDEB.SW, XDEB.MI, XDEB.DU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BL25JN58) |  |
| Value | **QDVI** | iShares Edge MSCI USA Value Factor UCITS ETF USD (Acc) | IE00BD1F4M44 | 13.10.2016 | gleicher Index | thes. | VLUE | QDVI.DE, IUVL.L, QDVI.DU, QDVI.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BD1F4M44) | Gleicher Index wie VLUE. |
| Value | **UBU5** | UBS MSCI USA Value UCITS ETF USD dis | IE00B78JSG98 | 11.04.2012 | US-Faktor | aussch. | IWD | UBU5.DE, USVUSY.SW, UBU5.DU, UBU5.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B78JSG98) | Stil-Index (Value-Hälfte des MSCI USA), halbjährliche Ausschüttung. |
| Value | **ZPRU** | SPDR MSCI USA Value UCITS ETF (State Street) | IE00BSPLC520 | 18.02.2015 | US-Faktor | thes. | IWD | ZPRU.DE, USVL.L, ZPRU.DU, ZPRU.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BSPLC520) | Wertgewichteter Index (Gewicht nach Value-Kennzahlen). |
| Value | **UBUS** | UBS Factor MSCI USA Prime Value Screened UCITS ETF USD dis | IE00BX7RR706 | 26.08.2015 | US-Faktor | aussch. | VLUE/RPV | UBUS.DE, UBUS.AS, UPVLD.SW, UBUS.DU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BX7RR706) | ESG-Indexwechsel wie beim Quality-Schwesterfonds (Datum offen). Kein Xetra in der justETF-Liste, Yahoo führt aber UBUS.DE (XETRA). (ESG-Filter) |
| Value | **IS3S** | iShares Edge MSCI World Value Factor UCITS ETF USD (Acc) | IE00BP3QZB59 | 03.10.2014 | Welt | thes. | VLUE | IS3S.DE, IWVL.L, IS3S.DU, IS3S.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BP3QZB59) |  |
| Value | **XDEV** | Xtrackers MSCI World Value UCITS ETF 1C | IE00BL25JM42 | 11.09.2014 | Welt | thes. | VLUE | XDEV.DE, XDEV.L, XDEV.SW, XDEV.MI | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BL25JM42) |  |
| Wachstum | **MWOT** | Amundi Russell 1000 Growth UCITS ETF Acc | IE0005E8B9S4 | 27.10.2011 | gleicher Index | thes. | IWF | MWOW.DE, MWOT.DE, MWOT.L, IE0005E8B9S4.SG | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE0005E8B9S4) | Auflagedatum stammt vom Vorgänger Lyxor Russell 1000 Growth UCITS ETF (FR0011119171), der am 09.07.2024 in diesen IE-Fonds verschmolzen wurde (Suchauszug). just |
| Wachstum | **SXRV** | iShares Nasdaq 100 UCITS ETF (Acc) | IE00B53SZB19 | 26.01.2010 | gleicher Index | thes. | QQQ | SXRV.DE, CSNDX.SW, SXRV.DU, SXRV.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B53SZB19) |  |
| Wachstum | **EXXT** | iShares Nasdaq 100 UCITS ETF (DE) | DE000A0F5UF5 | 27.03.2006 | gleicher Index | aussch. | QQQ | EXXT.DE, EXXT.DU, EXXT.MU, EXXT.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=DE000A0F5UF5) | Deutsches Sondervermögen (Domizil DE). |
| Wachstum | **EQQQ** | Invesco EQQQ Nasdaq-100 UCITS ETF | IE0032077012 | 02.12.2002 | gleicher Index | aussch. | QQQ | EQQQ.DE, EQQQ.L, EQQQ.SW, EQQQ.MI | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE0032077012) | Quartalsweise Ausschüttung. |
| Wachstum | **EQQX** | Invesco Nasdaq-100 Swap UCITS ETF Acc | IE00BNRQM384 | 22.03.2021 | gleicher Index | thes. | QQQ | EQQX.DE, EQQS.L, EQQX.DU, EQQX.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BNRQM384) | Synthetisch (Swap). |
| Wachstum | **LYMS** | Amundi Core Nasdaq-100 Swap UCITS ETF Acc | LU1829221024 | 07.09.2001 | gleicher Index | thes. | QQQ | LYMS.DE, UST.PA, LYMS.DU, LYMS.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=LU1829221024) | Synthetisch (Unfunded Swap). Auflagedatum 2001 liegt vor der ISIN-Vergabe (LU1829…) - vermutlich Historie des früheren Lyxor-Nasdaq-Fonds übernommen. |
| Wachstum | **6AQQ** | Amundi Nasdaq-100 Swap UCITS ETF EUR Acc | LU1681038243 | 08.06.2010 | gleicher Index | thes. | QQQ | 6AQQ.DE, ANX.PA, 6AQQ.MU, 6AQQ.HM | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=LU1681038243) | Synthetisch; Fondswährung EUR, laut justETF nicht währungsgesichert. Auflagedatum liegt vor der ISIN-Vergabe (LU1681…, ab 2017/18) - vermutlich Historie eines v |
| Wachstum | **XNAS** | Xtrackers Nasdaq 100 UCITS ETF 1C | IE00BMFKG444 | 21.01.2021 | gleicher Index | thes. | QQQ | XNAS.DE, XNAS.L, XNAS.SW, XNAS.MI | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BMFKG444) | Physisch. |
| Momentum | **QDVA** | iShares Edge MSCI USA Momentum Factor UCITS ETF USD (Acc) | IE00BD1F4N50 | 13.10.2016 | gleicher Index | thes. | MTUM | QDVA.DE, IUMO.L, QDVA.DU, QDVA.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BD1F4N50) | MTUM folgt seit 23.11.2020 der MSCI USA Momentum SR Variant (gleiche Auswahl, Umschichtung über drei Tage gestaffelt; Suchauszug SEC 497) - daher Mutterindex =  |
| Momentum | **IS3R** | iShares Edge MSCI World Momentum Factor UCITS ETF USD (Acc) | IE00BP3QZ825 | 03.10.2014 | Welt | thes. | MTUM | IS3R.DE, IWMO.L, IS3R.DU, IS3R.MU | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BP3QZ825) |  |
| Momentum | **XDEM** | Xtrackers MSCI World Momentum UCITS ETF 1C | IE00BL25JP72 | 05.09.2014 | Welt | thes. | MTUM | XDEM.DE, XDEM.L, XDEM.SW, XDEM.MI | g4 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BL25JP72) |  |
| Dividende/Aktionärsrendite | **SPYD** | SPDR S&P U.S. Dividend Aristocrats UCITS ETF USD Unhedged (Dist) | IE00B6YX5D40 | 14.10.2011 | gleicher Index | aussch. | SDY (NOBL) | SPYD.DE, UDVD.L, SPYD.HA | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B6YX5D40) | Gleicher Index wie SDY (nicht NOBL: S&P 500 Dividend Aristocrats hat kein UCITS-Gegenstück gefunden). Quartalsweise Ausschüttung. |
| Dividende/Aktionärsrendite | **WTDM** | WisdomTree US Quality Dividend Growth UCITS ETF USD Acc | IE00BZ56RG20 | 03.06.2016 | gleicher Index | thes. | DGRW | WTDM.DE, DGRA.L, WTDM.DU, WTDM.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BZ56RG20) | UCITS-Ausgabe des DGRW-Index (ggf. UCITS-Kappungsvariante, nicht geprüft). USD-Dist-Klasse IE00BZ56RD98 nur LSE/SIX, siehe ausgeschlossen. |
| Dividende/Aktionärsrendite | **WTEU** | WisdomTree US High Dividend UCITS ETF Dist (früher US Equity Income) | IE00BQZJBQ63 | 21.10.2014 | US-Faktor | aussch. | VYM/DHS | WTEU.DE, DHSD.L, WTEU.DU, WTEU.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BQZJBQ63) | Umbenannt (Yahoo führt noch den alten Namen US Equity Income); Datum der Umbenennung/des ESG-Filters offen. Quartalsweise Ausschüttung. (ESG-Filter) |
| Dividende/Aktionärsrendite | **FUSA** | Fidelity US Quality Income UCITS ETF ACC-USD | IE00BYXVGY31 | 27.03.2017 | US-Faktor | thes. | DGRW/VYM | FUSA.DE, FUSA.L, FUSA.HM, FUSA.SG | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BYXVGY31) | Qualität + Dividende. |
| Dividende/Aktionärsrendite | **HDLV** | Invesco S&P 500 High Dividend Low Volatility UCITS ETF | IE00BWTN6Y99 | 11.05.2015 | US-Faktor | aussch. | VYM (SPHD) | HDLV.L, HDLV.SW, HDLV.MI, HDLV.DU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BWTN6Y99) | Entspricht dem US-Fonds SPHD (nicht in der Gruppenliste). Quartalsweise Ausschüttung. |
| Dividende/Aktionärsrendite | **EXX5** | iShares Dow Jones US Select Dividend UCITS ETF (DE) | DE000A0D8Q49 | 28.09.2005 | US-Faktor | aussch. | SCHD/VYM (DVY) | EXX5.DE, EXX5.MI, EXX5.DU, EXX5.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=DE000A0D8Q49) | Index wie US-Fonds DVY; Dow-Jones-Dividendenfamilie, aber nicht der SCHD-Index (Dow Jones U.S. Dividend 100). |
| Dividende/Aktionärsrendite | **QDVD** | iShares MSCI USA Quality Dividend Advanced UCITS ETF USD (Dist) | IE00BKM4H312 | 06.06.2014 | US-Faktor | aussch. | VYM | QDVD.DE, QDIV.L, QDVD.DU, QDVD.HM | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BKM4H312) | Früher iShares MSCI USA Dividend IQ (Suchauszug); Index heute mit ESG-Auswahl (Advanced). Datum des Wechsels offen. Quartalsweise Ausschüttung. (ESG-Filter) |
| Dividende/Aktionärsrendite | **BBCK** | Invesco Global Buyback Achievers UCITS ETF | IE00BLSNMW37 | 24.10.2014 | Welt | aussch. | PKW (SYLD) | BBCK.DE, BUYB.L, BBCK.DU, BBCK.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BLSNMW37) | Welt-Version: Nasdaq US Buyback Achievers (PKW-Index) plus International Buyback Achievers. Quartalsweise Ausschüttung. |
| Kleine Werte | **IUS3** | iShares S&P SmallCap 600 UCITS ETF | IE00B2QWCY14 | 09.05.2008 | gleicher Index | aussch. | IJR | IUS3.DE, IDP6.L, IUS3.DU, IUS3.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B2QWCY14) | Halbjährliche Ausschüttung. |
| Kleine Werte | **SMLK** | Invesco S&P SmallCap 600 UCITS ETF | IE00BH3YZ803 | 28.01.2019 | gleicher Index | thes. | IJR | SMLK.DE, USML.L, SMLK.DU, SMLK.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BH3YZ803) | Synthetisch (Swap). |
| Kleine Werte | **ZPRR** | SPDR Russell 2000 U.S. Small Cap UCITS ETF (State Street) | IE00BJ38QD84 | 30.06.2014 | gleicher Index | thes. | IWM | ZPRR.DE, R2US.L, ZPRR.DU, ZPRR.HM | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BJ38QD84) |  |
| Kleine Werte | **XRS2** | Xtrackers Russell 2000 UCITS ETF 1C | IE00BJZ2DD79 | 06.03.2015 | gleicher Index | thes. | IWM | XRS2.DE, XRSU.L, XRS2.MI, XRS2.DU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BJZ2DD79) |  |
| Kleine Werte | **RS2K** | Amundi Russell 2000 UCITS ETF EUR (C) | LU1681038672 | 07.01.2014 | gleicher Index | thes. | IWM | RS2K.DE, RS2K.MI, RS2K.PA, RS2K.DU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=LU1681038672) | Synthetisch; laut justETF nicht währungsgesichert. Auflagedatum liegt vor der ISIN-Vergabe (LU1681…) - vermutlich Historie eines verschmolzenen Vorgängers. |
| Kleine Werte | **SC0K** | Invesco Russell 2000 UCITS ETF | IE00B60SX402 | 31.03.2009 | gleicher Index | thes. | IWM | SC0K.DE, RTYS.L, SC0K.DU, SC0K.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B60SX402) | Synthetisch (Swap). |
| Kleine Werte | **ZPRV** | SPDR MSCI USA Small Cap Value Weighted UCITS ETF (State Street) | IE00BSPLC413 | 18.02.2015 | US-Faktor | thes. | AVUV | ZPRV.DE, USSC.L, ZPRV.DU, ZPRV.HM | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BSPLC413) | Einziges US-only Small-Value-Gegenstück in DE. |
| Kleine Werte | **SXRG** | iShares MSCI USA Small Cap ESG Enhanced CTB UCITS ETF USD (Acc) | IE00B3VWM098 | 01.07.2009 | US-Faktor | thes. | IWM | SXRG.DE, CSUSS.MI, SXRG.DU, SXRG.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B3VWM098) | ESG-Index; Datum des Wechsels vom ursprünglichen Small-Cap-Index nicht geprüft. (ESG-Filter) |
| Kleine Werte | **QDVC** | iShares MSCI USA Mid-Cap Equal Weight UCITS ETF USD (Acc) (früher Edge MSCI USA Size Factor) | IE00BD1F4K20 | 13.10.2016 | US-Faktor | thes. | IJR/IWM | QDVC.DE, IUSZ.L, QDVC.DU, QDVC.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BD1F4K20) | Size-Faktor (Mid-Cap gleichgewichtet), keine Small Caps im engeren Sinn. Umbenennungsdatum offen. |
| Kleine Werte | **IS3T** | iShares MSCI World Mid-Cap Equal Weight UCITS ETF USD (Acc) (früher Edge MSCI World Size Factor) | IE00BP3QZD73 | 03.10.2014 | Welt | thes. | IJR/IWM | IS3T.DE, IWSZ.L, IS3T.DU, IS3T.HM | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BP3QZD73) | Welt-Size-Faktor der iShares-Edge-Familie, umbenannt. |
| Moat | **GMVM** | VanEck Morningstar US ESG Wide Moat UCITS ETF A | IE00BQQP9H09 | 16.10.2015 | US-Faktor | thes. | MOAT | GMVM.DE, MOAT.L, GMVM.DU, GMVM.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BQQP9H09) | Bis 17.12.2021 gleicher Index wie MOAT, danach ESG-Variante; Kohlenstoff-Filter am 15.12.2023 entfernt (Suchauszug VanEck). (ESG-Filter) |
| Moat | **VVGM** | VanEck Morningstar Global Wide Moat UCITS ETF | IE00BL0BMZ89 | 07.07.2020 | Welt | thes. | MOAT | VVGM.DE, GOAT.L, VVGM.DU, VVGM.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BL0BMZ89) |  |
| Multifaktor | **IBCY** | iShares STOXX USA Equity Multifactor UCITS ETF USD (Acc) | IE00BZ0PKS76 | 04.09.2015 | US-Faktor | thes. | LRGF | IFSU.L, IBCY.DU, IBCY.SG | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BZ0PKS76) | Früher iShares Edge MSCI USA Multifactor; Wechsel auf STOXX um den 22.01.2025 (verschoben vom 26.11.2024; Suchauszug). LRGF folgt einem STOXX-Faktorindex - Nähe (ESG-Filter) |
| Multifaktor | **GACA** | Goldman Sachs ActiveBeta Paris-Aligned Sustainable US Large Cap Equity UCITS ETF USD (Acc) | IE00BJ5CNR11 | 23.09.2019 | US-Faktor | thes. | GSLC | GACA.DE, GSLC.L, GACA.DU, GACA.MU | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BJ5CNR11) | Bis 10.09.2024 gleicher Index wie GSLC und Name ohne Paris-Aligned (Suchauszug GSAM); justETF zeigt noch den alten Indexnamen. (ESG-Filter) |
| Multifaktor | **QVMP** | Invesco S&P 500 QVM UCITS ETF | IE00BDZCKK11 | 18.05.2017 | US-Faktor | aussch. | LRGF/GSLC | QVMP.DE, PQVM.L, QVMP.DU, QVMP.HM | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BDZCKK11) | Quartalsweise Ausschüttung. |
| Multifaktor | **USFM** | UBS MSCI USA Select Factor Mix UCITS ETF USD dis | IE00BDGV0308 | 27.04.2017 | US-Faktor | aussch. | LRGF/GSLC | USFM.L, UEQE.DU, UEQE.MU, UEQE.HM | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BDGV0308) | Ausschüttende Klasse ist älter als die thesaurierende; halbjährlich. |
| Multifaktor | **FLXU** | Franklin U.S. Equity UCITS ETF (früher Franklin LibertyQ U.S. Equity) | IE00BF2B0P08 | 06.09.2017 | US-Faktor | thes. | LRGF/GSLC | FLXU.DE, FRUE.L, FLXU.L, FLXU.SW | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BF2B0P08) | Umbenennung (LibertyQ-Marke entfernt) zum 01.08.2022 (Suchauszug). Ob der heutige Index noch ein Multifaktor-Index ist, nicht bestätigt. |
| Multifaktor | **IBCZ** | iShares STOXX World Equity Multifactor UCITS ETF USD (Acc) | IE00BZ0PKT83 | 04.09.2015 | Welt | thes. | LRGF | IBCZ.DE, IFSW.L, IBCZ.DU, IBCZ.HM | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BZ0PKT83) | Früher iShares Edge MSCI World Multifactor (Indexwechsel auf STOXX wie USA-Schwester, Datum nicht geprüft). EUR-gehedgte Klasse ausgelassen. (ESG-Filter) |
| Multifaktor | **HWWD** | HSBC Multi-Factor Worldwide Equity UCITS ETF USD | IE00BKZGB098 | 04.07.2014 | Welt | aussch. | LRGF | HWWD.L, H41J.DU, IE00BKZGB098.SG | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00BKZGB098) | Quartalsweise Ausschüttung; kein Xetra-Listing laut justETF. |
| Fundamentalgewichtung | **6PSA** | Invesco RAFI US Fundamental Value UCITS ETF Dist (früher Invesco FTSE RAFI US 1000 UCITS ETF) | IE00B23D8S39 | 12.11.2007 | US-Faktor | aussch. | PRF | 6PSA.DE, 6PSA.DU, 6PSA.HM, 6PSA.HA | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B23D8S39) | Bis 23.03.2026 gleicher Index wie PRF damals; PRF selbst wechselte am 21.03.2025 auf RAFI Fundamental Select US 1000 (beides Suchauszug, Quilter-Mitteilung). Da |
| Kontrolle | **SXR8** | iShares Core S&P 500 UCITS ETF USD (Acc) | IE00B5BMR087 | 19.05.2010 | gleicher Index | thes. | SPY | SXR8.DE | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B5BMR087) | zweiter Massstab fuer UCITS (REGEL C6); als Kontrolle gegen SPY gerechnet |
| Kontrolle | **P500** | Invesco S&P 500 UCITS ETF (Acc, synthetisch) | IE00B3YCGJ38 | 20.05.2010 | gleicher Index | thes. | SPY | P500.DE, SPXS.L | g5 | [Quelle](https://www.justetf.com/de/etf-profile.html?isin=IE00B3YCGJ38) | Kontrolle: Swap-Bauform ohne Quellensteuerabzug gegen SXR8 (REGEL C6) |

**Zu jung (Auflage nach 31.08.2021, nicht gerechnet):** Xtrackers S&P 500 Equal Weight UCITS ETF 2D (IE000CXLGK86, 08.03.2023); iShares S&P 500 Equal Weight UCITS ETF USD (Acc) (IE000MLMNYS0, 02.08.2022); Invesco S&P 500 Equal Weight Swap UCITS ETF Acc (IE0000TZZ2B2, 14.01.2025); Invesco S&P 500 Quality UCITS ETF Acc (IE000E6TPCH9, 23.06.2025); Invesco S&P 500 Quality UCITS ETF Dist (IE000SNCKVM9, 23.06.2025); Vanguard Russell 1000 U.S. Value UCITS ETF USD Acc (IE000US24HF4, 07.07.2026); Vanguard Russell 1000 U.S. Growth UCITS ETF USD Acc (IE000J7AY5Y3, 07.07.2026); WisdomTree US Quality Growth UCITS ETF USD Unhedged Acc (IE000YGEAK03, 16.04.2024); Amundi Core Nasdaq-100 UCITS ETF Acc (IE000A2YGZU5, 03.03.2026); Xtrackers Nasdaq 100 Swap UCITS ETF 1C (IE000472H9T4, 09.07.2025); Xtrackers NASDAQ 100 Swap UCITS ETF 1D (IE000EXUE0G2, 09.07.2025); UBS Nasdaq-100 UCITS ETF USD acc (IE000SB4G4I4, 11.03.2025); UBS Nasdaq-100 UCITS ETF USD dis (IE0003RQ9F90, 11.03.2025); Franklin US Dividend Tilt UCITS ETF (Dis) (IE000Z4OBQK4, 14.01.2025); Franklin US Dividend Tilt UCITS ETF (Acc) (IE000HSER094, 14.01.2025); Vanguard Russell 2000 U.S. Small-Cap UCITS ETF USD Acc (IE000GTBEXG4, 07.07.2026); Avantis Global Small Cap Value UCITS ETF USD Acc (IE0003R87OG3, 25.09.2024); VanEck Morningstar US Wide Moat UCITS ETF A (IE0007I99HX7, 12.01.2024); VanEck Morningstar US SMID Moat UCITS ETF A (IE000SBU19F7, 12.01.2024).

**Zweite Anteilsklasse (nicht gerechnet, dasselbe Portfolio):** Invesco S&P 500 Equal Weight UCITS ETF Dist (IE00BM8QRY62, statt IE00BNGJJT35); iShares Edge MSCI USA Quality Factor UCITS ETF USD (Dist) (IE00BF2QSQ20, statt IE00BD1F4L37); iShares Edge S&P 500 Minimum Volatility UCITS ETF USD (Dist) (IE00BD93YH54, statt IE00B6SPMN59); iShares Edge MSCI World Minimum Volatility UCITS ETF USD (Dist) (IE00BMCZLJ20, statt IE00B8FHGS14); iShares Edge MSCI USA Value Factor UCITS ETF USD (Dist) (IE00BFF5RX68, statt IE00BD1F4M44); iShares Edge MSCI World Value Factor UCITS ETF USD (Dist) (IE00BFYTYS33, statt IE00BP3QZB59); Invesco EQQQ Nasdaq-100 UCITS ETF Acc (IE00BFZXGZ54, statt IE0032077012); Invesco Nasdaq-100 Swap UCITS ETF Dist (IE000RUF4QN8, statt IE00BNRQM384); Amundi Core Nasdaq-100 Swap UCITS ETF Dist (LU2197908721, statt LU1829221024); Amundi Nasdaq-100 Swap UCITS ETF USD Acc (LU1681038326, statt LU1681038243); iShares Edge MSCI USA Momentum Factor UCITS ETF USD (Dist) (IE00BFF5RZ82, statt IE00BD1F4N50); WisdomTree US High Dividend UCITS ETF Acc (IE00BD6RZT93, statt IE00BQZJBQ63); Fidelity US Quality Income UCITS ETF INC-USD (IE00BYXVGX24, statt IE00BYXVGY31); Amundi Russell 2000 UCITS ETF USD (LU1681038839, statt LU1681038672); iShares STOXX USA Equity Multifactor UCITS ETF USD (Dist) (IE00BG13YZ23, statt IE00BZ0PKS76); UBS MSCI USA Select Factor Mix UCITS ETF USD acc (IE00BDGV0415, statt IE00BDGV0308).

**Ohne in Deutschland handelbares Gegenstück laut Recherche:** COWZ (Free Cashflow: kein in DE handelbares Gegenstück); SYLD (Dividende/Aktionärsrendite: kein Gegenstück (einziges liquidiert)); PKW (Dividende/Aktionärsrendite: kein gleicher Index (nur Welt-Version)); QMOM (Momentum: kein gleicher Index); PDP (Momentum: kein gleicher Index); SPMO (Momentum: kein gleicher Index); SCHD (Dividende/Aktionärsrendite: kein gleicher Index); VIG (Dividende/Aktionärsrendite: kein gleicher Index); DGRO (Dividende/Aktionärsrendite: kein gleicher Index); VYM (Dividende/Aktionärsrendite: kein gleicher Index); NOBL (Dividende/Aktionärsrendite: kein gleicher Index); RPV (Value: kein gleicher Index); AVUV (Kleine Werte: kein gleicher Ansatz US-only); LRGF (Multifaktor: kein bestätigt gleicher Index); GSLC (Multifaktor: gleicher Index nur bis 10.09.2024); PRF (Fundamentalgewichtung: gleicher Index nur bis 21.03.2025).


### B4. Maßstab und Prüfgrößen

- **SPY** (SPDR S&P 500 ETF Trust) — der Maßstab für alle Fonds, Gesamtertrag in USD.
- **SXR8.DE** (iShares Core S&P 500 UCITS ETF USD (Acc), IE00B5BMR087, Xetra, EUR) — zweiter Maßstab nur für UCITS (C6).
- **^SP500TR** (S&P 500 Total Return Index bei Yahoo) — Prüfgröße für die Ausschüttungsrechnung von SPY (C7), kein Fonds.
- **EZB-Referenzkurse** USD, GBP, CHF je EUR (data-api.ecb.europa.eu, Reihe EXR.D.xxx.EUR.SP00.A) — für die Umrechnung der UCITS-Reihen.

## Teil C — Rechenregeln

**C1. Daten.** Kurse ausschließlich über die öffentliche Yahoo-Chart-Schnittstelle
`query1/query2.finance.yahoo.com/v8/finance/chart/<KÜRZEL>?interval=1d&events=div,splits,capitalGains&includeAdjustedClose=true`
(gesamte Historie bis zum Abruf; `capitalGains` zusätzlich zum Auftrag, damit Kapitalgewinn-Ausschüttungen nicht fehlen). Lader
`laden.js`. Eine Antwort ohne Kerzen gilt auch bei HTTP 200 als Fehlschlag und wird wiederholt. Die Rohantworten sind Daten Dritter
und werden **nicht** ins Repo committet; committet werden je Reihe SHA-256 der Rohbytes, Zeilenzahl, erster/letzter Tag, Zahl der
Ausschüttungen und Splits, Abrufzeit (`pruefsummen*.json`). Datenende der Auswertung: **Schluss 15.09.2026**; jüngere Kurse werden
nur für die Factsheet-Stichproben (C9) benutzt. Tagesdatum = Kalenderdatum des Kerzenstempels in der Zeitzone der Börse.

**C2. Gesamtertrag (Hauptweg: Schluss + Ausschüttungen).** `close` der Schnittstelle ist split-bereinigt, nicht
ausschüttungsbereinigt. Je Reihe: `TR(t) = TR(t−1) · (close(t) + D(t)) / close(t−1)`, `TR(erster Tag) = 1`; `D(t)` = Summe der
Ausschüttungen (Dividenden und Kapitalgewinne; ein Kapitalgewinn mit gleichem Datum und Betrag wie eine Dividende zählt einmal),
gebucht am ersten Handelstag mit Datum ≥ Ereignisdatum, wieder angelegt zum Schluss dieses Tages. Fondskosten (TER) stecken im
Kurs. **Kontrollweg adjclose:** dieselben Fenster aus `adjclose` gerechnet; die Differenz zum Hauptweg in A und B wird je Fonds in
Pp p. a. ausgewiesen. Liegt sie über 0,10 Pp p. a., klärt der Gruppenagent die Ursache. Es entscheidet der Hauptweg; eine
nachweislich fehlende oder falsche Ausschüttung bei Yahoo (Beleg: Ausschüttungshistorie des Anbieters) wird als **benannte
Ergänzung** mit Quelle im Code nachgetragen und unter „Korrekturen" vermerkt — nie stillschweigend.

**C3. Fenster A und B.** Fenster [S, E]: Startwert = Schluss am letzten Handelstag **vor** S, Endwert = Schluss am letzten Handelstag
**≤** E; A = 04.01.2017–15.09.2021 (Start = Schluss 03.01.2017), B = 16.09.2021–15.09.2026 (Start = Schluss 15.09.2021), A und B
verketten sich lückenlos. Liegt der gefundene Handelstag mehr als 10 Kalendertage vor dem Sollrand, ist das Fenster nicht
berechenbar. Rendite p. a. mit der nominalen Länge (Tage von Schluss vor S bis E, / 365,25), für Fonds und SPY dieselbe;
**Abstand p. a.** = Rendite p. a. Fonds − Rendite p. a. SPY in Prozentpunkten.

**C4. Rollierende 5-Jahres-Fenster.** Monatsende zu Monatsende: Start = Schluss am letzten Handelstag eines Monats m, Ende = Schluss am
letzten Handelstag des Monats m + 60. Erster Startmonat = der Monat, in dem die **jüngere** der beiden Reihen (Fonds oder Maßstab)
ihren ersten Kurs hat (d. h. das erste Fenster beginnt mit dem ersten Monatsanfang nach der Auflage); letzter Endmonat = August 2026
(der letzte volle Monat vor dem Datenende). Liegt ein Monatsende einer Reihe mehr als 10 Kalendertage vor dem Kalender-Monatsende
(Lücke), fällt das Fenster weg und wird als „fehlend" gezählt. Je Fonds: Zahl der Fenster n, Zahl und **Anteil vor SPY**, **Median**,
**schlechtester** (mit Startmonat) und bester Abstand p. a. (Abstand = (1+R_Fonds)^(1/5) − (1+R_SPY)^(1/5)). Nachrichtlich: die nicht
überlappenden Fenster (erstes Fenster, dann je 60 Monate weiter) — sie zeigen, wie wenige unabhängige Beobachtungen hinter dem Anteil
stehen.

**C5. Rückschläge.** **Größter Rückschlag gegen SPY**: relative Reihe Gesamtertrag Fonds / Gesamtertrag SPY auf den Handelstagen des
Fonds (SPY: letzter Wert ≤ Tag), vom ersten gemeinsamen Tag bis 15.09.2026; tiefster Fall gegenüber dem vorherigen Höchststand, mit
Datum von Spitze und Tal. Nachrichtlich: größter Rückschlag des Fonds und von SPY selbst im selben Zeitraum.

**C6. UCITS.** *Symbolwahl:* je Fonds sind in `fonds.json` die Yahoo-Symbole in fester Reihenfolge eingetragen (Xetra `.DE` zuerst).
Genommen wird das erste Symbol, dessen Reihe höchstens 92 Tage nach dem Auflagedatum beginnt; gibt es keins, das mit der längsten
Historie. Diese Wahl hängt nur am Datenbeginn, nie an Renditen. *Anteilsklasse:* je Fonds die mit der frühesten Auflage (B3,
Punkt 2). Bei ausschüttenden Klassen gilt C2 mit den Ausschüttungen der Reihe; Prüfung: Ausschüttung / Vortagsschluss je Zahlung
zwischen 0,05 % und 3 % — sonst Verdacht auf Fremdwährungsbetrag (z. B. USD-Betrag an einer EUR-Notiz), Klärung mit der
Ausschüttungshistorie des Anbieters, Korrektur als benannte Ergänzung (Betrag mit dem EZB-Kurs am Ex-Tag umgerechnet). *Name:* der
Name in den Yahoo-Metadaten der gewählten Reihe muss zum Fonds passen (Kürzel können an verschiedenen Börsen verschiedenen Fonds
gehören); passt er nicht, gilt das Symbol als nicht ladbar und die Wahl geht zum nächsten Kandidaten. *Währung:* gegen SPY wird die UCITS-Reihe mit dem EZB-Referenzkurs des Handelstags (letzter Kurs ≤ Tag) in
USD umgerechnet; gegen SXR8 wird in EUR gerechnet (Xetra gegen Xetra, keine Umrechnung). *Warum zwei Maßstäbe:* (1) Zeitversatz —
der Xetra-Schluss (17:30 MEZ) liegt mitten im New Yorker Handel, der SPY-Schluss 4½ Stunden später; jeder Fensterrand trägt
deshalb ein Rauschen von der Größe einer halben US-Handelssitzung. SXR8 hat denselben Zeitstempel. (2) Quellensteuer — irische
UCITS erhalten US-Dividenden mit 15 % Abzug, der SPY-Gesamtertrag aus Schluss + Ausschüttung ist brutto. SXR8 trägt denselben
Abzug. (3) Die echte Alternative des Anlegers ist ein UCITS-S&P-500-Fonds, nicht SPY. Die Kontrolle **Invesco S&P 500 UCITS
(synthetisch, SC0J)** zeigt, wie viel allein die Bauform (Swap statt Quellensteuer) gegen SXR8 ausmacht.

**C7. Datenprüfungen (Pflicht, je Reihe im Gruppenbericht `gruppe-gN.md`).**
1. *Sprungpaare*: |r(t)| > 15 %, r(t+1) mit Gegenvorzeichen und |r(t+1)| > 10 %, (1+r(t))(1+r(t+1)) in [0,97; 1,03] → Schluss am Tag
   t ist ein Fehlkurs und wird entfernt (die Ausschüttung des Tages wandert auf den nächsten Handelstag). Jede Entfernung wird
   gelistet.
2. Alle Tagesbewegungen über 10 % werden gelistet und gegen den Markt des Tages eingeordnet (März 2020 usw.).
3. Lücken über 7 Kalendertage; Datenbeginn gegen Auflagedatum.
4. Ausschüttungen: Zahl je Kalenderjahr (Muster des Fonds: monatlich/quartalsweise/jährlich), auf einen anderen Tag verschobene,
   außerhalb der Reihe liegende; Kapitalgewinne; Splits (Vor-/Nach-Split-Kurs und Ausschüttungsbetrag müssen zusammenpassen).
5. Abgleich adjclose (C2).
6. *Eichung SPY*: Fenster A innerhalb 0,3 Pp der Gegenprobe aus Nr. 78 (+115,81 %, Yahoo bereinigt, Schluss 03.01.2017–15.09.2021),
   Fenster B innerhalb 0,5 Pp von +81,2 % (Nr. 88); vier Ausschüttungen je volles Kalenderjahr. SPY gegen ^SP500TR: Rückstand in A und
   B zwischen 0 und 0,25 Pp p. a. (Kosten 0,0945 % plus Bargeldbremse des Trusts), sonst die Ausschüttungsrechnung prüfen.
7. *Eichung Kontrollen*: IVV und VOO gegen SPY in A und B je |Abstand| < 0,15 Pp p. a.; SXR8 gegen SPY (in USD) nachrichtlich.
   Verfehlt eine Eichung, wird nicht weitergerechnet, bevor die Ursache benannt ist.

**C8. Kaufbarkeit.** US-domizilierte ETFs (B1, B2) sind für Privatanleger in der EU in der Regel **nicht kaufbar**: ohne
Basisinformationsblatt nach der PRIIPs-Verordnung (EU) Nr. 1286/2014 dürfen Banken sie Kleinanlegern nicht verkaufen (Quellen:
justETF, „US-domiciled ETFs: why they are no longer available from many online brokers",
https://www.justetf.com/en/news/etf/us-domiciled-etfs.html; LYNX, „Basisinformationsblatt",
https://www.lynxbroker.de/service/produkte-und-regularien/regularien/basisinformationsblatt/). Kaufbar sind die UCITS-Fonds aus B3.
Ein „verlässlich vorn" bei einem US-Fonds beantwortet die Frage des Anlegers deshalb nur über sein UCITS-Gegenstück.

**C9. Factsheet-Stichproben.** Je Fonds, für den eine Anbieterangabe erreichbar ist (Ziel: alle 27 Fonds aus B1 versuchen, dazu so
viele UCITS wie erreichbar): die 5-Jahres-Rendite p. a. laut Anbieter zum Stichtag D (Marktpreis bevorzugt, sonst NAV; Stichtag,
Art und URL notieren) gegen unseren Wert aus derselben Reihe (`node rechnen.js --roh … --symbol … --stichtag D [--waehrung USD]`:
Schluss am letzten Handelstag ≤ D minus 5 Jahre bis Schluss am letzten Handelstag ≤ D) in der Währung der Anbieterangabe.
**Abweichung je Fonds in Pp p. a.** wird immer genannt; auffällig ab |0,30| Pp p. a. → Ursache suchen (Ausschüttung fehlt? NAV
gegen Kurs? Zeitversatz?). Die Hauptzahlen ändern sich nur bei nachgewiesenem Datenfehler (C2).

**C10. Zweiter Rechner.** Ein unabhängiger Agent schreibt eigenen Code **nur aus dieser REGEL.md** (ohne `rechnen.js` anzusehen), lädt
die Rohdaten selbst und rechnet SPY (A, B absolut) und drei Fonds gegen SPY: **SPMO**, **SCHD** und **den ersten UCITS-Fonds der
Gruppe Gleichgewicht in B3** (ersatzweise der erste UCITS-Fonds in B3) — A, B, rollierende Fenster (n, vorn, Median, schlechtester),
relativer Rückschlag. Dazu jeder Fonds, der am Ende „verlässlich vorn" ist. **Übereinstimmung**: Abstände auf 0,05 Pp p. a., Zahl der
Fenster vor SPY auf ±1, Rückschlag auf 0,5 Pp; sonst wird die Ursache bis zum einzelnen Tag aufgeklärt und berichtet.

**C11. Überlebensverzerrung (c).** Ein eigener Agent sucht geschlossene, liquidierte oder verschmolzene Faktor-/Smart-Beta-ETFs seit
2010 (US und UCITS) mit Quelle je Fonds (`geschlossene-fonds.md/.json`), ohne Kurse. Das Ergebnis nennt sie und ordnet ein, in welche
Richtung ihr Fehlen die Zahlen verschiebt. Zusätzlich benannt: die **Bekanntheitsverzerrung** — die Liste besteht aus Fonds, die
heute bekannt und groß sind, oft gerade wegen ihrer Vergangenheit.

## Teil D — Ablauf

1. Siegel: diese Datei und `fonds.json` (dazu die Recherche-Protokolle der UCITS-Suche) committen und den Zweig
   `messung/faktor-etf-realitaet` nach GitHub schieben — **vor** dem ersten Kurs.
2. Lader, Rechner und Tests (`laden.js`, `rechnen.js`, `test.js`; Tests nur an Kunstreihen) committen — immer noch vor dem ersten Kurs.
3. Laden, Prüfen, Rechnen je Gruppe g1–g5 durch parallele Agenten (`gruppe-gN.json`, `gruppe-gN.md`, `factsheet-gN.json`,
   `pruefsummen-gN.json`); zweiter Rechner (`zweitrechner/`); geschlossene Fonds (`geschlossene-fonds.*`).
4. `ERGEBNIS.md` (Kurzfassung oben, höchstens 15 Zeilen; Tabelle aller Fonds; Grenzen) und `ergebnis.json`; `test.js` grün; Push.

## Teil E — Grenzen, die schon vor dem ersten Kurs feststehen

- **Überlebensverzerrung**: geschlossene Fonds fehlen; sie wurden meist nach schwacher Entwicklung geschlossen — die Liste der
  Überlebenden ist im Schnitt zu gut.
- **Bekanntheitsverzerrung**: der Auftrag nennt Fonds, die heute bekannt sind; Bekanntheit folgt oft der guten Vergangenheit.
- **Überlappende Fenster**: aufeinanderfolgende 5-Jahres-Fenster teilen 59 von 60 Monaten; 100 Fenster sind keine 100 Belege,
  sondern eher zwei bis vier unabhängige.
- **Viele Fonds**: bei rund 80 geprüften Reihen erfüllt mancher die Regel auch durch Zufall.
- **Yahoo** ist keine amtliche Quelle; dagegen stehen die Prüfungen C7, die Factsheets C9 und der zweite Rechner C10.
- **Steuern** sind nicht gerechnet (Teilfreistellung für Aktienfonds gilt für Faktor-ETF und S&P-500-Fonds gleich; Unterschiede
  durch Ausschüttung gegen Thesaurierung und Vorabpauschale bleiben offen). **Handelskosten** (Spanne, Ordergebühr) sind nicht
  gerechnet — sie fallen einmalig an und für den S&P-500-Fonds ebenso.
- **Vergangenheit**: fünf Jahre vorn sagen nichts Sicheres über die nächsten fünf.
