# Kostenbuch Bigdata.com — Chancen-Karte 16.09.2026

Deckel: 120 Einheiten (Schluss bei Guthaben ≤ 830,61). Guthaben über `bigdata_help` (kostenlos).
Quelle aller Zahlen: Bigdata.com (https://bigdata.com), Stand 16.09.2026.

| Nr | Werkzeug | Zweck | Guthaben danach | Verbrauch | Rohdatei |
|---:|---|---|---:|---:|---|
| 0 | bigdata_help | Guthaben zu Beginn (erster Versuch: ERR_CONNECTION_CLOSED, zweiter ok) | 950,6124 | 0 | roh/00-help-start.json |
| 1 | bigdata_market_tearsheet | Phase 1: Kursentwicklung aller 11 Sektor-ETFs, Renditen, Rohstoffe, Faktoren | 933,9524 | 16,66 | roh/01-market-tearsheet.md |
| 2 | bigdata_search smart (15 Chunks, 4 Teilanfragen) | Phase 1: Sektor-Bewertung vs. Geschichte — nur Index-Ebene gefunden | 916,8428 | 17,11 (ggf. inkl. Nr. 3, Reihenfolge der Abfrage unsicher) | roh/02-suche-sektorbewertung.md |
| 3 | bigdata_search smart (0 Treffer) | Phase 1: Strategen-Sicht Sektoren — Smart-Modus lenkte auf nicht abonniertes Research | 913,6428 | 3,20 | roh/03-suche-strategen-leer.md |

Kalibrierung nach Nr. 0–3: Kosten skalieren mit gelieferten Token je Quellklasse (Nr. 2: 3.318 Token → 17,11; Nr. 3: 4.000 Web-Token, 0 Chunks → 3,20). Premium-Nachrichten/Podcasts ≈ 8 Einheiten je 1.000 Token, Web ≈ 0,8. Markt-Tearsheet 16,66 pauschal. Zwischenstand nach Nr. 3: 36,97 verbraucht, 83,03 bis zum Deckel.
| 4 | bigdata_search fast news_public (2.444 Web-Token) | Phase 1/2: Zyklischer Konsum — Gründe, Ertragslage | — | ≈ 1,96 | roh/04-suche-zykl-konsum.md |
| 5 | bigdata_search fast news_public (2.780 Web-Token) | Phase 1/2: Versorger — Zinsen, Rechenzentren, Prognosen | 909,4636 | ≈ 2,22 (4+5 gemessen: 4,18) | roh/05-suche-versorger.md |
| 6 | bigdata_search fast news_public (3.057 Web-Token) | Phase 1/2: Kommunikation | — | ≈ 2,45 | roh/06-suche-kommunikation.md |
| 7 | bigdata_search fast news_public (2.906 Web-Token) | Phase 1: Finanzen | — | ≈ 2,32 | roh/07-suche-finanzen.md |
| 8 | bigdata_search fast news_public (2.847 Web-Token) | Phase 1: Immobilien | — | ≈ 2,28 | roh/08-suche-immobilien.md |
| 9 | bigdata_search fast news_public (2.563 Web-Token) | Phase 1: Gewinne je Sektor Q2 2026, Flüsse | (nächste Messung) | ≈ 2,05 (6–9 zusammen ≈ 9,10) | roh/09-suche-gewinne-je-sektor.md |

Preisregel bestätigt: Web-Token kosten 0,8 Einheiten je 1.000 (Nr. 4+5: 5.224 Token → 4,18). Zwischenstand nach Nr. 9 (rechnerisch): ≈ 50,25 verbraucht, ≈ 69,75 bis zum Deckel.
| — | bigdata_help | Messung nach Nr. 9: 900,3652 → Nr. 6–9 kosteten zusammen 9,10 (bestätigt) | 900,3652 | 0 | — |
| 10 | bigdata_screen_companies (Utilities, US, > 20 Mrd $, > 1 Mio Stück, limit 15) | Phase 2: tragende liquide Versorger mit rp_entity_id | (nächste Messung) | ? | roh/10-screen-versorger.md |
| 11 | bigdata_search fast news_public (2.257 Web-Token) | Phase 1: ETF-Flüsse je Sektor August 2026 | — | ≈ 1,81 | roh/11-suche-etf-fluesse.md |
| 12 | bigdata_search fast news_public (2.623 Web-Token) | Phase 1: Energie-/Tech-Hype, übrige Sektoren | — | ≈ 2,10 | roh/12-suche-energie-tech.md |
| — | bigdata_help | Messung nach Nr. 12: 896,4612 → Nr. 10–12 kosteten 3,90 = exakt die Web-Token der zwei Suchen ⇒ **Screen (Nr. 10) kostenlos** | 896,4612 | 0 | — |
| 13 | bigdata_search fast news_public (3.001 Web-Token) | Phase 2: Versorger — Gegenthese (Capex, Rechenzentren, Regulierung) | — | ≈ 2,40 | roh/13-suche-versorger-gegenthese.md |
| 14 | bigdata_search fast news_public (3.176 Web-Token) | Phase 2: Zyklischer Konsum — Verbraucherlage | — | ≈ 2,54 | roh/14-suche-verbraucher.md |
| 15 | bigdata_search fast news_public (2.969 Web-Token) | Phase 2: Kommunikation — Gegenthese (Capex, Kartell) | — | ≈ 2,38 | roh/15-suche-kommunikation-gegenthese.md |
| 16 | bigdata_events_calendar economic (US, HIGH, 16.09.–20.11.) | Phase 2: datierte Makro-Katalysatoren | (nächste Messung) | ? | roh/16-wirtschaftskalender-us.md |
| — | bigdata_help | Messung nach Nr. 16: 888,0824 → Nr. 13–16 kosteten 8,38; davon Suchen 7,32 ⇒ **Wirtschaftskalender 1,06** | 888,0824 | 0 | — |
| 17 | bigdata_screen_companies ×2 (Consumer Cyclical > 40 Mrd $, Communication Services > 20 Mrd $) | Phase 2: tragende liquide Werte mit rp_entity_id | — | 0 (Screens kostenlos) | roh/17-screens-konsum-kommunikation.md |
| 18 | find_securities GOOGL | Alphabet-ID (im Screen null) | — | ? | roh/18-kalender-portfolio.md |
| 19 | bigdata_events_calendar corporate (18 IDs, earnings-call, 16.09.–30.11.) | Phase 2: Berichtstermine | — | ? | roh/18-kalender-portfolio.md |
| 20 | bigdata_portfolio_tearsheet (18 IDs; PRICE, EPS_SURPRISE, PRICE_TARGET, SENTIMENT) | Phase 1/2: Stimmungszahlen, Gewinnüberraschung, Kursziele | (nächste Messung) | ? | roh/18-kalender-portfolio.md |
| — | bigdata_help | Messung nach Nr. 20: 885,4882 → Nr. 17–20 kosteten zusammen 2,59 (Screens 0, find_securities 250 KG-Token, Kalender ≈ 1, Portfolio-Grid Rest) | 885,4882 | 0 | — |

## Abschluss
- Guthaben zu Beginn 950,6124, am Ende **885,4882** → Verbrauch **65,12 Einheiten** (Deckel 120 eingehalten).
- 21 kostenpflichtige Aufrufe (3 Screens mit 0 gemessen) + 9 kostenlose Guthabenabfragen.
- Aufteilung: Markt-Tearsheet 16,66 · Smart-Suchen 20,31 (davon 3,20 für 0 Treffer) · Schnell-Suchen 24,17 · Kalender ≈ 2,3 · find_securities + Portfolio-Grid ≈ 1,4.
- Lehre: Smart-Modus fächert in 4–5 Teilanfragen auf und zieht Premium-Quellen (≈ 8 je 1.000 Token); Schnellmodus mit `news_public` kostet ≈ 2,2 je Suche; Screens sind gratis; Tearsheets ≈ 16,7 pauschal.
