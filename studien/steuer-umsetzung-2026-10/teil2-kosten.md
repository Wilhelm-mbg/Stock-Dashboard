# Teil 2: Handelskosten eines deutschen Privatanlegers (Stand 2026-10-04)

Abrufdatum aller Quellen: **2026-10-04**. "nicht belegt" heißt: keine Quelle gefunden, die die Zahl trägt. Nichts geraten.

**Methodische Einschränkung:** Seiten wurden über WebFetch/WebSearch gelesen, also als maschinelle Zusammenfassung, nicht als Originaltext. Mehrere Primärseiten waren nicht abrufbar (Trade Republic Preisseite 404, Scalable /preise 404, IBKR 403, ING 503). Jede Zahl ist deshalb mit Belegstärke markiert: **P** = Anbieterseite selbst (über Zusammenfassung), **S** = Sekundärquelle (Vergleichsportal, Presse). Vor einer Verwendung in der Simulation sollten die P-losen Zahlen am Originalverzeichnis gegengeprüft werden.

## 0. Korrekturen an der Auftragsliste (wichtig)

| Angabe im Auftrag | Befund | Quelle |
|---|---|---|
| IE00BD1F4M44 = iShares Edge MSCI USA **Momentum** | Falsch. Das ist der **Value Factor** (WKN A2AP35). Der **USA Momentum Factor** ist **IE00BD1F4N50** (WKN A2AP36), TER 0,20 %. | justETF IE00BD1F4M44 / IE00BD1F4N50 |
| IE00BP3QZ825 MSCI World Momentum, TER 0,30 % | ISIN stimmt (WKN A12ATF), aber TER laut justETF **0,25 %**, nicht 0,30 %. | justETF IE00BP3QZ825 |
| IE00BM67HT60 = Xtrackers S&P 500 | Falsch. Das ist **Xtrackers MSCI World Information Technology 1C** (TER 0,25 %). Xtrackers S&P 500 1C EUR Hedged ist IE00BM67HW99 (TER 0,05 %). Einen unabgesicherten thesaurierenden Xtrackers-S&P-500-UCITS mit eigener ISIN habe ich nicht belegt. | justETF IE00BM67HT60 / IE00BM67HW99 |

## 1. Ordergebühren pro Order, Ordergröße 5.000 EUR

Basispunkte (bp) = Gebühr / 5.000 EUR x 10.000. Ohne Spread, ohne Devisen, ohne Fremdspesen, sofern nicht genannt.

| Broker / Platz | Gebühr je Order | Rechnung bei 5.000 EUR | bp | Beleg | Quelle |
|---|---|---|---|---|---|
| Trade Republic, Bestpreis-Ausführung | 1,00 EUR pauschal | 1,00 | 2,0 | P/S | ms-aktuell.de (Umstellung 2026), trusted.de |
| Trade Republic, Direktpreis (Börse wählbar) | 2,00 EUR | 2,00 | 4,0 | S | ms-aktuell.de |
| Scalable Free Broker, EIX | 0,99 EUR | 0,99 | 2,0 | S | justETF Scalable-Seite |
| Scalable Free Broker, gettex | 0,99 EUR bis 31.08.2026, **ab 01.09.2026 1,99 EUR** | 1,99 | 4,0 | S | justETF-Suchtreffer; nicht am Original geprüft |
| Scalable Prime+ (4,99 EUR/Monat) | 0,00 EUR ab 250 EUR Ordervolumen | 0,00 | 0,0 | S | justETF Scalable-Seite |
| Interactive Brokers, US-Aktie, Fixed | 0,005 USD je Aktie, min. 1 USD, max. 1 % Handelswert | siehe Hinweis | ca. 1-3 | S | IBKR-Suchtreffer (commissions-home) |
| Interactive Brokers, US-Aktie, Tiered | 0,0035 USD je Aktie (Stufe bis 0,0005) plus Börsen-/Clearing-/Regulierungsgebühren | nicht berechenbar | nicht belegt | S | IBKR-Suchtreffer |
| comdirect, Ausland (u. a. USA) | 7,90 EUR + 0,25 %, min. 12,90, max. 62,90 | 7,90 + 12,50 = 20,40 | 40,8 | P | comdirect.de/wertpapierhandel/konditionen.html |
| comdirect, Inland (Börsenplatz) | 4,90 EUR + 0,25 %, min. 9,90, max. 59,90 | 4,90 + 12,50 = 17,40 | 34,8 | P | dieselbe Seite; Entgelt für Direkthandel Tradegate/gettex dort nicht gesondert ausgewiesen, nicht belegt |
| ING Direkt-Depot, Börse/Direkthandel/Ausland | 4,90 EUR + 0,25 %, max. 69,90; Direkthandel ohne Börsenentgelt, Xetra +2,90 | 4,90 + 12,50 = 17,40 | 34,8 | S | ing.de-Suchtreffer (PLV); Seite lieferte 503, Auslandszuschläge nicht belegt |
| DKB, Aktien bis 5.000 EUR | 10,00 EUR (bis 5.000), 15,00 (bis 20.000), 30,00 (darüber) plus Handelsplatzentgelt 0 bis 20 EUR | 10,00 (Tradegate: +0) | 20,0 bis 60,0 | S | bankdaten.de/dkb, capitalo; bei exakt 5.000,00 EUR gilt die untere Stufe |
| Consorsbank, Direkthandel | 4,95 EUR + 0,25 %, min. 9,95, max. 69 | 4,95 + 12,50 = 17,45 | 34,9 | S | Suchtreffer (Consorsbank-Preisverzeichnis), nicht am Original geprüft |
| Consorsbank, US-Börsen | 19,95 EUR + 0,25 %, max. 69 | 19,95 + 12,50 = 32,45 | 64,9 | S | dito |
| flatex, Inlandsplätze (Tradegate, gettex, L&S) | 5,90 EUR + 2,00 EUR Fremdkostenpauschale | 7,90 | 15,8 | S | bankdaten.de/flatex, aktien.net |
| flatex, USA/Kanada | ab 2,90 EUR + 2,00 EUR Pauschale + Spreads, bis 40.000 EUR; darüber +0,04 % | 4,90 | 9,8 | S | aktien.net (Suchtreffer); Verkauf US-Aktien +0,00218 % laut bankdaten.de |

Hinweis IBKR: 5.000 EUR sind bei einem Kurs von z. B. 200 USD rund 25-30 Aktien, 0,005 x ~28 = 0,14 USD, also greift das Minimum von 1 USD. Das ist rund 0,9 EUR oder etwa 1,7 bp. Der EUR/USD-Kurs ist hier eine Annahme, nicht belegt. Börsen-/Regulierungsgebühren (z. B. SEC-Fee beim Verkauf) sind nicht belegt.

Hinweis Scalable: Free Broker hat Ordergebühr, aber das Angebot "ETFs ab 250 EUR gebührenfrei" betrifft nur Prime+ bzw. Aktionsliste (S, justETF).

## 2. Devisenspanne EUR/USD bei US-Aktien

| Fall | Kosten | bp bei 5.000 EUR | Beleg | Quelle |
|---|---|---|---|---|
| IBKR, IDEAL-FX | 0,08-0,20 bp über Interbankkurs, plus Kommission 0,002 % mit Minimum 2 USD | Minimum 2 USD greift: ca. 1,7 EUR, etwa 3-4 bp | S | rankia.de, IBKR-Suchtreffer, mustachianpost.com (Beispiel "CHF 1,78 für ~CHF 15.000"). Eine IBKR-Seite warb zusätzlich mit "0,03 % FX rates" (Suchtreffer-Titel); Widerspruch zu 0,002 %, nicht aufgelöst |
| Handel in EUR an Tradegate/gettex/Trade Republic | keine ausgewiesene Devisengebühr, Spread steckt im EUR-Preis | nicht belegt | S | trusted.de |
| Trade Republic, Fremdwährungsgebühr | 0,25 % auf Wechselkurs bei USD/GBP/CHF-Papieren, nur für Dividenden/Fremdwährungsvorgänge genannt | 25 bp, falls zutreffend | S | trusted.de-Suchtreffer; Geltungsbereich bei Kauf unklar, nicht belegt |
| Banken allgemein (Auslandsorder in USD) | Stiftung Warentest: Umrechnungsentgelte "typischerweise 0,3-0,4 %" | 30-40 bp | S | test.de "Auslandsaktien: US-Aktien günstig in Deutschland kaufen" |
| Banken 0,5-1,5 % (Annahme im Auftrag) | nicht belegt | | | keine Quelle gefunden |
| Beispiel 0,25 % Wechselgebühr | 125 EUR bei 50.000 EUR | 25 bp | S | test.de-Suchtreffer (Depotkosten-Artikel) |

Die Devisenspannen der einzelnen Banken (comdirect, ING, DKB, Consors, flatex) sind **nicht belegt**; die Preisverzeichnisse nannten sie in den abgerufenen Zusammenfassungen nicht.

## 3. Bid-Ask-Spreads liquider US-Large-Caps

| Größe | Wert | Beleg | Quelle |
|---|---|---|---|
| Large Caps allgemein, mittlerer quoted Spread | "rund 6 bp" | S, schwach | Suchzusammenfassung, Primärseite nicht identifiziert |
| NYSE-Titel vs. Nasdaq (Gesamthandelskosten) | 17,51 bp bzw. +3,15 bp teurer an Nasdaq | S, **veraltet** | institutionalinvestor.com, Datum nicht belegt |
| Apple, Microsoft, Nvidia einzeln, 2025/2026 | nicht belegt | | |
| Spreads auf Tradegate/gettex für US-Aktien | nicht belegt | | |

Der Spread ist die größte Lücke dieser Recherche. Für die Simulation: Annahme muss als Annahme gekennzeichnet werden. Der Wert 0,04 Pp je Umlauf (4 bp) für Aktien aus CLAUDE.md ("gemessen an 15 US-Großwerten 2026") ist die einzige im Projekt vorhandene Messung und hier **nicht extern bestätigt**.

## 4. Thesaurierende S&P-500-UCITS: TER und Fondsstand

Stand der Fondsgrößen laut justETF: 31.08.2026 (Datum für iShares und Xtrackers MSCI World IT genannt, für Vanguard nicht angegeben).

| Fonds | ISIN | TER | Fondsgröße | Auflage | Replikation | Quelle |
|---|---|---|---|---|---|---|
| iShares Core S&P 500 UCITS ETF USD (Acc) | IE00B5BMR087 | 0,07 % | 136,0 Mrd. EUR (31.08.2026) | 19.05.2010 | physisch voll | justETF; finanzen.net nannte 129,3 Mrd. EUR (Datum nicht belegt) |
| Vanguard S&P 500 UCITS ETF USD Acc | IE00BFMXXD54 | 0,07 % | 32,0 Mrd. EUR (Datum nicht belegt) | 14.05.2019 | physisch voll | justETF |
| Xtrackers S&P 500 UCITS ETF 1C EUR Hedged | IE00BM67HW99 | 0,05 % | 446 Mio. EUR | 27.02.2015 | physisch voll | justETF; **währungsgesichert**, nicht mit den anderen vergleichbar |
| Amundi Core S&P 500 UCITS ETF Acc | IE000UBAW7M3 | 0,03 % (justETF) bzw. 0,05 % (finanzen.net-Suchtreffer): **Widerspruch** | nur 23 Mio. EUR | 10.04.2025 | physisch voll | justETF; sehr jung und klein |
| Amundi S&P 500 Swap UCITS ETF EUR Acc | LU1681048804 | 0,15 % | 2,9 Mrd. EUR | 08.06.2010 | **synthetisch (Swap)** | justETF |
| Xtrackers S&P 500 Swap | nicht recherchiert | nicht belegt | | | | |

## 5. Thesaurierende Momentum-ETF

| Fonds | ISIN | TER | Fondsgröße | Auflage | Positionen | Quelle |
|---|---|---|---|---|---|---|
| iShares Edge MSCI USA Momentum Factor UCITS ETF USD (Acc) | IE00BD1F4N50 | 0,20 % | **uneinheitlich**: 426 Mio. (trackingdifferences.com), 567 Mio. (justETF), 572 Mio. (etf.at), 661 Mio. (dasinvestment-Suchtreffer); Datum je Quelle nicht belegt | 13.10.2016 | 125-126 | justETF, etf.at, trackingdifferences.com |
| iShares Edge MSCI World Momentum Factor UCITS ETF USD (Acc) | IE00BP3QZ825 | 0,25 % | 5,62 Mrd. EUR (Aug. 2026) | Auflagedatum nicht abgerufen, nicht belegt | 352 | justETF |

Tracking-Differenz (publiziert): USA Momentum, "durchschnittlich 0,03 % p. a. seit 2017" laut trackingdifferences.com, das heißt besser als die TER, bei Messung gegen den Index mit dessen Bruttodividenden-Annahme ungeklärt. World Momentum: nicht abgerufen, **nicht belegt**. Umschlagkosten des Index (Momentum-Rebalancing, Halbjahres-Turnover) und die Transaktionskosten im Fonds: **nicht belegt**. Beide sind in der TER nicht enthalten und bei Momentum höher als bei S&P 500 zu erwarten, das ist aber nur eine Vermutung, kein Beleg.

Randbefunde justETF (ändern die Kostenfrage nicht, aber die Auswahl): Beide Momentum-Fonds sind auf wenige Titel konzentriert (Micron, Halbleiter), Volatilität 1 Jahr 26,3 % bzw. 20,5 %.

## 6. ETF-Orderkosten (Einmalkauf, Sparplan, Verkauf)

Einmalkauf und Verkauf kosten bei denselben Brokern grundsätzlich wie Aktienorders (Tabelle 1), sofern der Anbieter keine eigene ETF-Zeile hat. Eigene ETF-Zeile gefunden bei:

| Broker | Einmalkauf/Verkauf | Sparplan | bp bei 5.000 EUR (Einmal) | Quelle |
|---|---|---|---|---|
| Trade Republic | 1,00 EUR (Bestpreis), 2,00 EUR (Direktpreis) | 0 EUR Ausführung | 2,0 / 4,0 | ms-aktuell.de, trusted.de |
| Scalable Free Broker | 0,99 EUR (EIX), gettex ab 01.09.2026 1,99 EUR | 0 EUR, alle ca. 3.200 ETFs, ab 1 EUR | 2,0 / 4,0 | justETF |
| Scalable Prime+ | 0 EUR ab 250 EUR | 0 EUR | 0,0 | justETF |
| DKB | wie Aktien: 10 EUR bis 5.000 EUR | 1,50 EUR je Ausführung (511 ETFs gratis) | 20,0 | bankdaten.de/dkb, capitalo |
| comdirect | wie Aktien (Inland 17,40 EUR bei 5.000 EUR) | "1,5 %" der Rate laut Zusammenfassung, plausibel nur für Sparpläne mit Rate; nicht am Original geprüft | 34,8 | comdirect.de/wertpapierhandel/konditionen.html |
| flatex | Inland 5,90 + 2,00 EUR | Aktiensparplan 1 % der Rate; ETF-Sparplan nicht belegt | 15,8 | bankdaten.de/flatex |
| ING, Consorsbank | wie Aktien (Tabelle 1) | ETF-Sparplan nicht belegt | 34,8 bzw. 34,9 | s. o. |
| IBKR | europäische ETF: 0,05 %, min. 1,25 EUR (Suchtreffer, rankia.de) | kein Sparplan belegt | 5,0 | rankia.de |

## 7. Kurzfassung der Kostenparameter in Basispunkten (Ordergröße 5.000 EUR)

Einseitig (Kauf oder Verkauf). Umlauf = Kauf plus Verkauf, also doppelt.

| Position | Wert je Seite | Beleg |
|---|---|---|
| Order Trade Republic / Scalable (EIX) | 2,0 bp (gettex Scalable ab 09/2026: 4,0 bp) | S |
| Order Scalable Prime+ | 0 bp | S |
| Order IBKR US-Aktie | ca. 1-3 bp (Annahme Kurs 200 USD) | S |
| Order flatex (Tradegate/gettex / US) | 15,8 bp / 9,8 bp | S |
| Order DKB (Tradegate) | 20,0 bp | S |
| Order comdirect, ING, Consors (Inland/Direkt) | 34,8-34,9 bp | P/S |
| Order comdirect / Consors an US-Börse | 40,8 / 64,9 bp | P / S |
| Devisen IBKR | ca. 3-4 bp (Mindestgebühr 2 USD dominiert) | S |
| Devisen Banken (Warentest) | 30-40 bp | S |
| Devisen Trade Republic / Gettex / Tradegate | nicht belegt (Spread im Preis) | |
| Bid-Ask US-Large-Cap | ca. 6 bp laut schwacher Quelle, sonst nicht belegt | S, schwach |
| TER S&P 500 Acc (iShares/Vanguard) | 7 bp p. a. | P (justETF) |
| TER S&P 500 Amundi Core | 3 bp p. a. (Widerspruch 5 bp) | P (justETF) |
| TER USA Momentum (IE00BD1F4N50) | 20 bp p. a. | P |
| TER World Momentum (IE00BP3QZ825) | 25 bp p. a. | P |
| Tracking-Differenz USA Momentum | 3 bp p. a. besser als Index, seit 2017 | S |
| Umschlagkosten Momentum-ETF | nicht belegt | |

## Quellenverzeichnis (alle abgerufen am 2026-10-04)

- https://www.justetf.com/de/etf-profile.html?isin=IE00B5BMR087, ...IE00BFMXXD54, ...IE00BM67HT60, ...IE00BM67HW99, ...IE000UBAW7M3, ...LU1681048804, ...IE00BD1F4M44, ...IE00BD1F4N50, ...IE00BP3QZ825
- https://www.finanzen.net/etf/laender/ishares-core-sp-500-etf-ie00b5bmr087 (Suchtreffer)
- https://www.trackingdifferences.com/ETF/ISIN/IE00BD1F4N50
- https://www.etf.at/suche/ie00bd1f4n50/ (Zusammenfassung, Fondsgröße abweichend)
- https://ms-aktuell.de/?p=139088 (Trade Republic, Umstellung Juli 2026)
- https://trusted.de/trade-republic-kosten (Suchtreffer)
- https://www.justetf.com/de/online-broker-vergleich/scalable-capital-etf-depot-erfahrungen.html
- https://www.comdirect.de/wertpapierhandel/konditionen.html
- https://www.ing.de/wertpapiere/direkt-depot/konditionen/ (Suchtreffer, Abruf 503)
- https://www.bankdaten.de/dkb/depot.html, https://www.capitalo.de/anbieter/dkb/produkte/depot
- https://www.bankdaten.de/flatex/flatex-aktienhandel.html, https://www.aktien.net/flatex
- https://www.test.de/Auslandsaktien-US-Aktien-guenstig-in-Deutschland-kaufen-5788125-0/
- https://rankia.de/broker/interactive-brokers-gebuehren-erfahrungen-kosten, https://www.mustachianpost.com/de/wie-man-bei-interactive-brokers-wahrungen-konvertiert/
- IBKR Preisseiten (interactivebrokers.ie/en/pricing/commissions-home.php) nur als Suchtreffer, Direktabruf 403
- Consorsbank Preisverzeichnis nur als Suchtreffer (consorsbank.de), nicht direkt abgerufen

## Offene Lücken

1. Spreads liquider US-Large-Caps auf US-Börsen und auf Tradegate/gettex (Kernlücke).
2. Devisenaufschläge der Banken je Haus, Trade-Republic-Fremdwährungsgebühr bei Kauf.
3. Originaltexte von Trade Republic, Scalable, IBKR, ING, Consorsbank (Primärseiten nicht abrufbar).
4. Umschlag- und Transaktionskosten der Momentum-ETF, Tracking-Differenz World Momentum.
5. Xtrackers S&P 500 unabgesichert thesaurierend (korrekte ISIN).
