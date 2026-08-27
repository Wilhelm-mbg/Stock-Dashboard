# Entscheidungsvorlage: Anbieter historischer Tageskurse (zweite Quelle)

**Analytiker, 27.08.2026, ~10:00. Auftrag von Wilhelm über den PM.** Reine
Zusammenstellung — nichts angemeldet, nichts gekauft, keine Zugangsdaten verwendet.
Jede Angabe trägt ihre Fundstelle; wo ich Punkt 2 (Anpassungsstand) nicht sicher
belegen konnte, steht **unklar**. Preise und Abdeckungsangaben veralten — vor einer
Entscheidung die Fundstelle aufrufen.

**Wofür die zweite Quelle gebraucht wird (die vier Stränge):**
(S1) die 132 historischen Skalenwechsel → braucht **tiefe Historie**;
(S2) der konstante Versatz 60m/1d bei RGR/SITC/B/WHLR → braucht **Split-/Dividenden-
EREIGNISSE als Datensatz oder unangepasste Rohkurse** (eine dritte angepasste Meinung
hilft nicht); (S3) Überlebensverzerrung (≥ 12,7 % fehlen) → braucht **abgemeldete
Papiere**; (S4) Abgleich der Anpassungsstände → braucht dasselbe wie S2.

---

## Übersichtstabelle

| Anbieter | 1. Historie | 2. ⭐ Anpassungsstand / Rohkurse | 3. Preis (Gratisstufe) | 4. Abgemeldete |
|---|---|---|---|---|
| **Massive** (ehem. Polygon; **Schlüssel liegt schon im Haus**) | Free 2 J. · $29 5 J. · $79 10 J. · $199 20+ J. | **Ja, stark**: Flat Files grundsätzlich unangepasst; REST wahlweise; Dividenden-Anpassung wird gar nicht angeboten; **Splits & Dividenden als eigene Endpunkte** | Free: 2 J. EOD, 5 Calls/min, **inkl. Reference/Corporate Actions** | **Ja** (All-Tickers-Endpunkt `active=false`) |
| **Norgate Data** | Platinum ab **1990** · Diamond ab **1950** (Silver 10 J./Gold 20 J. ohne Abgemeldete) | **Ja**: Anpassungsmodus wählbar inkl. `None`; `OriginalCloseTimeSeries` (unangepasster Schluss); Dividenden- und Kapitalereignis-Reihen | **unklar** — nur interaktiver Preisrechner, keine statische Preisangabe; 3-Wochen-Test | **Ja** (nur Platinum/Diamond), Spezialist für Überlebensverzerrungs-freie Daten |
| **Tiingo** | 30+ Jahre | **Ja**: je Tag Rohfelder (open…close) UND adj-Felder UND **`splitFactor` + `divCash`** | Free: 500 Symbole/Monat, 1.000 Calls/Tag · Power **$30/Monat** | **unklar** für EOD-Kurse — permaTicker-Konzept für „delisted or recycled symbols" existiert (Fundamentals-Doku), EOD-Umfang nicht belegt |
| **EODHD** | 30+ Jahre (Beispiel Ford ab 1972) | **Ja**: `close` „not adjusted" + `adjusted_close`; eigene **Splits-&-Dividends-API**. Achtung: `volume` ist splitbereinigt | Free: 20 Calls/Tag · EOD-Plan **€19,99/Monat** | **Ja** (eigene Delisted-API; belegtes Abrufbeispiel TWTR nach Delisting) |
| **Alpha Vantage** | 20+ Jahre | **Teilweise**: `TIME_SERIES_DAILY` = „raw (as-traded)" und **frei**; adjusted + Split-/Dividenden-Ereignisse nur Premium | Free: 25 Calls/Tag · Premium ab **$49,99/Monat** | **unklar** — `LISTING_STATUS` liefert eine Delisted-LISTE; ob Kursreihen für abgemeldete Ticker abrufbar sind, nicht belegt |
| **Sharadar** (über Nasdaq Data Link) | „back to the 90s" | **Ja** (laut Publisher-Seite): „Adjusted and unadjusted End of day prices, dividends and corporate actions" | **unklar** — Preisseiten nur interaktiv, keine statische Angabe | **Ja**: „Active and delisted … nearly completely free of survivorship bias" |
| **Databento** | Kurse erst **ab 2018** | Ja (roh, unangepasst; Corporate-Actions-Datensatz ab 2018-05, Delistings als Ereignistyp) | Kurse ab $0,40/GB · Corporate Actions **$299/Monat** | Ja (verfolgt Papiere über das Delisting hinaus) |

## Fundstellen

- **Massive:** Preise/Stufen inkl. „Reference data and corporate actions" im Free-Tier: <https://massive.com/pricing> (polygon.io leitet dorthin um). Rohdaten: „All stock Flat Files contain unadjusted data" <https://massive.com/docs/flat-files/stocks/overview>. Anpassung: „both adjusted and unadjusted for splits, … not … for dividends" <https://massive.com/knowledge-base/article/is-massives-stock-data-adjusted-for-splits-or-dividends>. Abgemeldete: <https://massive.com/docs/rest/stocks/overview> („use the All Tickers endpoint with active=false"). Splits/Dividenden-Endpunkte: <https://massive.com/blog/new-splits-and-dividends-endpoints>.
- **Norgate:** Pakete/Tiefen/Abgemeldete: <https://norgatedata.com/prices.php> (Silver/Gold ohne, Platinum „back to 1990", Diamond „back to 1950", jeweils „Delisted securities"). Anpassungsmodi `None/CapitalReconstructions/…/All`, `NorgateOriginalCloseTimeSeries()`, Dividenden-/Kapitalereignis-Reihen: <https://norgatedata.com/amibroker-usage.php>. Überlebensverzerrungs-Spezialist: <https://norgatedata.com/>. Einordnung Dritter (US-Historie bis 1925, Windows-Pflicht): <https://quantpedia.com/best-historical-market-data-providers/>.
- **Tiingo:** Preise/Gratisgrenzen: <https://www.tiingo.com/about/pricing>. Felder „Both raw prices and adjusted prices", `splitFactor`, `divCash`: <https://www.tiingo.com/documentation/end-of-day>. permaTicker für „delisted or recycled symbols": <https://www.tiingo.com/documentation/fundamentals>.
- **EODHD:** Preise: <https://eodhd.com/pricing>. Felder (`close` not adjusted, `adjusted_close`, `volume` splitbereinigt), 30+ Jahre: <https://eodhd.com/financial-apis/api-for-historical-data-and-volumes>. Abgemeldete inkl. Abrufbeispiel TWTR: <https://eodhd.com/financial-academy/financial-faq/survivorship-bias-free-financial-analysis>.
- **Alpha Vantage:** „raw (as-traded)" frei, adjusted premium, 20+ Jahre, LISTING_STATUS: <https://www.alphavantage.co/documentation/>. Preise: <https://www.alphavantage.co/premium/>.
- **Sharadar:** „Active and delisted coverage extends back to the 90s … nearly completely free of survivorship bias": <https://sharadar.com/>. „Adjusted and unadjusted End of day prices, dividends and corporate actions": <https://data.nasdaq.com/publishers/SHARADAR>.
- **Databento:** Kurse seit 2018, ab $0,40/GB: <https://databento.com/equities>. Corporate Actions ab 2018-05, Delisting-Verfolgung: <https://databento.com/docs/venues-and-datasets/corporate-actions>; $299/Monat: <https://databento.com/blog/corporate-actions>.

## Was zu welchem Strang passt (Lesart des Analytikers, keine Empfehlung zu kaufen)

- **S2/S4 (Versatz-Schiedsrichter, Split-Ereignisse):** Die billigste Gegenprobe liegt
  vermutlich schon im Haus — **der vorhandene Massive-Schlüssel** (tools/
  massive-tagesdaten.js). Die Preisseite führt Reference-Daten/Corporate Actions im
  Free-Tier; ob der vorhandene Schlüssel die Splits-/Dividenden-Endpunkte tatsächlich
  freischaltet, ist **unklar** und wäre ein einzelner lesender Probeabruf (RGR, SITC,
  B, WHLR, BYND — fünf Abfragen). Zweitbilligste: **Tiingo Free** (splitFactor je Tag,
  500 Symbole/Monat reichen für jede Stichprobe).
- **S1 (132 Skalenwechsel):** braucht Historie deutlich über 730 Tage MIT
  Ereignis-/Rohdaten: EODHD (€19,99), Tiingo ($30), Massive $199 (20+ J.), Norgate
  Platinum, Sharadar. Für eine reine Stichprobe der 132 Fälle reicht ggf. schon eine
  Gratisstufe (Tiingo: 500 Symbole/Monat; EODHD: 20 Calls/Tag → ~7 Tage für 132).
- **S3 (Überlebensverzerrung):** Die einzigen mit ausdrücklich belegter
  Abgemeldete-KURS-Abdeckung in der Breite: **Norgate Platinum/Diamond** (ab
  1990/1950) und **Sharadar** (ab den 90ern) — beide ohne statische Preisangabe —
  sowie **EODHD** (Delisted-API, Tiefe je Papier unklar). Massive führt abgemeldete
  Ticker, aber die Kurstiefe hängt an der bezahlten Stufe.
- **Nicht geeignet für die historische Frage:** Databento (Kurse erst ab 2018).

## Nicht recherchiert (der Vollständigkeit halber genannt, ohne Beleg)

- **CRSP** (akademischer Standard für überlebensverzerrungsfreie US-Historie) — nur
  über Instituts-/WRDS-Lizenzen; für dieses Projekt vermutlich unzugänglich. Nicht
  geprüft.
- **Stooq** (frei) — Anpassungsstand und Abgemeldeten-Abdeckung nicht geprüft.

## Ehrlichkeits-Vermerk

Alle „Ja"-Angaben in Spalte 2 stammen aus Anbieter-Doku, nicht aus eigenen Abrufen —
die Auflage war „keine Anmeldung". Ob eine Doku-Zusage im Datenbestand wirklich trägt
(z. B. splitFactor-Vollständigkeit bei Tiingo in den 90ern), weiß man erst nach einer
Stichprobe. Empfohlener nächster Schritt, falls Wilhelm eine Quelle wählt: erst die
Gratisstufe gegen die fünf bekannten Versatz-Fälle (RGR, SITC, B, WHLR, BYND) und
zehn der 132 Skalenwechsel halten, dann entscheiden.
