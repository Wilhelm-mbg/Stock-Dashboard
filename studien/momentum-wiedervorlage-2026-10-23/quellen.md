# Quellen — Auftrag Nr. 122 (alle abgerufen am 23.10.2026)

## Web

| Zahl | Wert | URL | Abruf |
|---|---|---|---|
| IBKR Ireland, US-Aktien, **Fixed** | 0,005 USD je Stück, mindestens 1,00 USD, höchstens 1 % des Handelswerts je Order | https://www.interactivebrokers.ie/en/pricing/commissions-stocks.php | 23.10.2026 (curl, Seite „Commissions Stocks \| Interactive Brokers Ireland") |
| IBKR Ireland, US-Aktien, **Tiered** (≤ 300.000 Stück im Monat) | 0,0035 USD je Stück, mindestens 0,35 USD; Fußnote „Tiered commissions will be capped at 0.5% of trade value" (Tabelle nennt 1 %) | ebd. | 23.10.2026 |
| Regulierungsabgaben (beide Modelle) | SEC Transaction Fee 0,0000206 × Verkaufswert; FINRA Trading Activity Fee 0,00 USD je verkauftem Stück (Fußnote: Gebührenpause 01.10.–31.12.2026); FINRA CAT 0,000003 USD je Stück | ebd. | 23.10.2026 |
| Tiered: Clearing / Pass-Through | NSCC, DTC 0,00020 USD je Stück; NYSE Pass-Through 0,000175 × Provision; FINRA Pass-Through 0,00056 × Provision | ebd. | 23.10.2026 |
| Tiered: Börsengebühr | NASDAQ ≥ 1 $: Entnahme von Liquidität 0,0030 USD je Stück (Zugabe −0,0013); NASDAQ „Opening and Closing – Other" 0,0011 USD | https://www.interactivebrokers.ie/en/accounts/fees/INETstkfee.php?nhf=T | 23.10.2026 |
| IBKR Ireland, Deutschland (für den UCITS-ETF) | Fixed SmartRouting 0,05 % des Werts, mindestens 3,00 EUR; Direct Routing GETTEX 0,05 %, mindestens 3,00 EUR; Tiered 0,05 %, mindestens 1,25 EUR, höchstens 29 EUR (zzgl. Börsengebühren) | https://www.interactivebrokers.ie/en/pricing/commissions-stocks.php (Abschnitt Germany) | 23.10.2026 |
| Devisenumtausch EUR→USD | 0,20 Basispunkte × Handelswert, mindestens 2,00 USD (Tier I) | https://www.interactivebrokers.ie/en/pricing/commissions-spot-currencies.php | 23.10.2026 |
| US-ETFs für EWR-Privatkunden gesperrt (PRIIPs/KID) | IBKR-Wissensdatenbank: ohne KID muss der Handel für EWR-/UK-Privatkunden gesperrt werden; Ausweg: europäischer ETF desselben Anbieters, CFD, Status Professional | https://ibkb.interactivebrokers.com/node/2993 · https://ibkb.interactivebrokers.com/de/node/3324 | 23.10.2026 (Websuche, Seiten nicht einzeln geladen) |
| EUR/USD | 1,1205 (EZB-Referenzkurs 22.10.2026) | https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml | 23.10.2026 |
| QQQ Gesamtkostenquote | 0,20 % (Vanguard-Profil, brutto, Stand 31.01.2025); Datenseiten nennen heute 0,18 % — für die Fenster bis 15.09.2026 gilt 0,20 % als Annahme | https://investor.vanguard.com/investment-products/etfs/profile/qqq · https://seekingalpha.com/symbol/QQQ/expenses | 23.10.2026 (Websuche) |
| Xtrackers Nasdaq 100 UCITS ETF 1C | IE00BMFKG444, thesaurierend, TER 0,20 %, Fondsgröße 2.624 Mio. EUR, Fondswährung USD, physisch, Irland, aufgelegt 21.01.2021; Xetra EUR (XNAS), gettex EUR, LSE USD/GBP; Kalenderjahre in EUR 2022 −28,43 / 2023 +49,25 / 2024 +33,49 / 2025 +6,67 % | https://www.justetf.com/de/etf-profile.html?isin=IE00BMFKG444 | 23.10.2026 |
| iShares Nasdaq 100 UCITS ETF (Acc) | IE00B53SZB19, thesaurierend, TER 0,30 %, 26.049 Mio. EUR, USD, physisch, Irland, 26.01.2010; Xetra EUR (SXRV), gettex EUR, LSE USD/GBX; 2022 −28,50 / 2023 +49,07 / 2024 +33,29 / 2025 +6,58 % | https://www.justetf.com/de/etf-profile.html?isin=IE00B53SZB19 | 23.10.2026 |
| Invesco EQQQ Nasdaq-100 UCITS ETF Acc | IE00BFZXGZ54, thesaurierend, TER 0,30 %, 4.424 Mio. EUR, USD, physisch, Irland, 24.09.2018; Xetra EUR (EQQB), gettex EUR, SIX USD; 2022 −28,46 / 2023 +49,10 / 2024 +33,34 / 2025 +6,59 % | https://www.justetf.com/de/etf-profile.html?isin=IE00BFZXGZ54 | 23.10.2026 |
| Amundi Core Nasdaq-100 Swap UCITS ETF Acc (nachrichtlich, vierter) | LU1829221024, thesaurierend, TER 0,22 %, 6.460 Mio. EUR, USD, **synthetisch (Swap)**, Luxemburg; Xetra EUR/USD (LYMS); 2022 −28,15 / 2023 +49,55 / 2024 +33,96 / 2025 +6,42 % | https://www.justetf.com/de/etf-profile.html?isin=LU1829221024 | 23.10.2026 |

Tracking-Differenz: auf den abgerufenen justETF-Seiten nicht ausgewiesen; die Anbieterseiten wurden nicht abgerufen (offener Punkt). Ersatzweise ist die Spanne der Kalenderjahre der vier ETFs gegeneinander genannt (gleiche Währung EUR).

## Protokolle und Dateien im Repo / Archiv

| Zahl | Wert | Fundstelle |
|---|---|---|
| Kassa-Spanne je Umlauf (Fenster `mitte`, ab 2021) | 5-50 Mio $ 0,1569 · 50-250 0,0854 · 250-1000 0,0647 · ab 1000 0,0449 Pp | `wiki/kosten.md` „Kassa-Hürde je Umsatzklasse und Jahr"; `studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS.md` |
| Eröffnungsfaktor | 2,68 / 2,46 / 2,07 / 1,81 (eroeffnung / mitte, alle Jahre gepoolt) | `studien/vorregistrierung-2026-09-06-signale-minuten/konfig.js` `KLASSEN`; `wiki/kosten.md` „Je Klasse × Fenster" |
| Median-Kurs je Klasse (für die Tabelle) | 35,67 / 68,47 / 110,34 / 170,87 $ | `wiki/kosten.md` „Je Klasse × Fenster" |
| Umsatzklasse | Median-Tagesumsatz der 20 Balken vor dem Stichtag (`liquide.js` KORB.fenster), nominal | `wiki/kosten.md` Tabelle Alpaca; `konfig.js` `UMSATZ_FENSTER` |
| Demo-Konto bestätigte 0,10 % | 0,104 | `wiki/kosten.md`, Gedächtnis „Datensammlung: drei stille Deckel" |
| alter Kostensatz | 20 Bp je Seite (`mfdepot.js` Zeile 158) | `studien/massstab-rueckblick-2026-10-04/rueckblick.js` `KOSTEN_FUNDSTELLE` |
| Ausführungszeitpunkt des Rückblicks | Eröffnungskurs des Ausführungstags (`preise[name] = g.bEroeffnung[z]`) | `studien/momentum-korb-2026-10-04/korb.js` Schritt 3; `rueckblick.js` Schritt 3 |
| gesiegelter Stand | Kennung `momentum-korb-v23-2026-10-04/v1`, Panel v2.3 Bau 2c | `studien/momentum-korb-v23-2026-10-04/ergebnis.json` |
| Steuermodell | Satz 26,375 %, Teilfreistellung 30 %, Basisertrag × 0,7, Wiederanlage 85 %, Basiszins 2017 (Annahme) 0,59 · 2018 0,87 · 2019 0,52 · 2020 0,07 · 2021 −0,45 · 2022 −0,05 · 2023 2,55 · 2024 2,29 · 2025 2,53 · 2026 3,20 % | `studien/nach-steuern-2026-10-04/steuer.js` `MODELL` (Nr. 82) |
| Zufallsbücher | Rang 15 von 201 (A), 3 von 201 (B) | `wiki/belegstand.md` Nachtrag Nr. 100; `studien/momentum-zufall-2026-10/ERGEBNIS.md` |
| QQQ-Kurse | Minutenbalken Alpaca SIP, `adjustment=raw`, 2016–2026 | `E:/Markt-Dashboard-Archiv/alpaca1m/QQQ/<Jahr>.json` (nur gelesen) |
| QQQ-Ausschüttungen | Alpaca corporate-actions | `E:/Markt-Dashboard-Archiv/alpaca-massnahmen/QQQ.json` (nur gelesen) |
