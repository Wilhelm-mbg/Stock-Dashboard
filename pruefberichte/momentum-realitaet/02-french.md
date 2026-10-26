# 02 Ken-French-Datenbibliothek: Momentum (Big-High, Hi PRIOR) gegen Markt

Stand: 2026-10-04. Reine Messung historischer Daten, keine Anlageberatung. Alle Renditen in Prozent, monatlich, US-Dollar, **vor Kosten**, ohne Steuern, ohne Handelsreibung.

## Quellen (abgerufen 2026-10-04, Basis https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/)
| Datei | URL (ab Basis) | Stand laut Server (Last-Modified) | Stand laut Dateikopf |
|---|---|---|---|
| 6_Portfolios_ME_Prior_12_2_CSV.zip (Datei 6_Portfolios_ME_Prior_12_2.csv) | ftp/6_Portfolios_ME_Prior_12_2_CSV.zip | 25.09.2026 21:55 GMT | CRSP-Datenbank 202608 |
| 10_Portfolios_Prior_12_2_CSV.zip (Datei 10_Portfolios_Prior_12_2.csv) | ftp/10_Portfolios_Prior_12_2_CSV.zip | 25.09.2026 21:55 GMT | CRSP 202608 |
| F-F_Research_Data_Factors_CSV.zip (Datei F-F_Research_Data_Factors.csv) | ftp/F-F_Research_Data_Factors_CSV.zip | 25.09.2026 21:55 GMT | CRSP 202608 |

Die Dateinamen wurden auf der Seite data_library.html geprueft (alle drei dort verlinkt). Ein "Stand" je Datei steht auf der Seite selbst nicht gesondert; massgeblich sind Last-Modified und der Dateikopf. Download ohne Sperre, TLS-Pruefung blieb an.

## Benutzte Tabellen
- (a) 6er-Datei (2x3 Groesse x Momentum): Spalte **BIG HiPRIOR** (grosse Gewinner). Wertgewichtet = Tabelle "Average Value Weighted Returns -- Monthly"; gleichgewichtet = "Average Equal Weighted Returns -- Monthly". Firmenzahl: "Number of Firms in Portfolios".
- (b) 10er-Datei: Spalte **Hi PRIOR** (oberstes Zehntel, Prior-Rendite -12 bis -2 Monate). Wertgewichtet = "Value Weight Returns -- Monthly"; gleichgewichtet = "Average Equal Weighted Returns -- Monthly". Firmenzahl: "Number of Firms in Portfolios".
- (c) Faktoren: Mkt-RF und RF aus der ersten (monatlichen) Tabelle. **Markt = Mkt-RF + RF** (alle US-Aktien, wertgewichtet, CRSP).

## Zeitraeume
Letzter verfuegbarer Monat in allen drei Dateien: **August 2026 (202608)**. Der September 2026 fehlt (Fenster B endet im Original am 15.09.2026, also ist B hier um den Rest August/September-Anfang kuerzer bzw. ohne September).
- A: 01/2017 bis 09/2021, 57 Monate.
- B: 10/2021 bis 08/2026, 59 Monate.
- B2 (nur zum Laengenvergleich, gekennzeichnet): 10/2021 bis 06/2026, 57 Monate = gleiche Laenge wie A.

## Ergebnis (Start 100; annualisiert = geometrisch; Drawdown = groesster Rueckgang vom Hoechststand der **Monatsend**-Werte, kein Tages-Drawdown)
| Reihe | Fenster | Endwert | Gesamtertrag | p.a. | Max. Drawdown (Monatsende) |
|---|---|---|---|---|---|
| Big-High VW | A | 217,76 | +117,76 % | 17,80 % | -18,31 % (03/2020) |
| Big-High EW | A | 195,64 | +95,64 % | 15,18 % | -36,91 % (03/2020) |
| Hi PRIOR VW | A | 238,04 | +138,04 % | 20,03 % | -21,89 % (12/2018) |
| Hi PRIOR EW | A | 253,48 | +153,48 % | 21,63 % | -29,95 % (03/2020) |
| Markt | A | 215,12 | +115,12 % | 17,50 % | -20,22 % (03/2020) |
| Big-High VW | B | 182,50 | +82,50 % | 13,02 % | -24,14 % (09/2022) |
| Big-High EW | B | 122,19 | +22,19 % | 4,16 % | -32,94 % (09/2022) |
| Hi PRIOR VW | B | 237,61 | +137,61 % | 19,25 % | -31,21 % (06/2022) |
| Hi PRIOR EW | B | 122,52 | +22,52 % | 4,22 % | -31,98 % (10/2023) |
| Markt | B | 182,12 | +82,12 % | 12,97 % | -24,84 % (09/2022) |
| Big-High VW | B2 | 190,47 | +90,47 % | 14,53 % | -24,14 % |
| Big-High EW | B2 | 119,40 | +19,40 % | 3,80 % | -32,94 % |
| Hi PRIOR VW | B2 | 281,07 | +181,07 % | 24,30 % | -31,21 % |
| Hi PRIOR EW | B2 | 138,57 | +38,57 % | 7,11 % | -31,98 % |
| Markt | B2 | 177,57 | +77,57 % | 12,85 % | -24,84 % |

Kernbefund: In A lag Big-High VW nur knapp ueber dem Markt (17,80 vs. 17,50 % p.a.), in B (bis 08/2026) praktisch gleich (13,02 vs. 12,97 %). Das Hi-PRIOR-Dezil VW lag in beiden Fenstern vorn, aber mit tieferem Drawdown in B (-31 vs. -25 %). Gleichgewichtet schnitt Momentum in B deutlich schlechter ab (rund 4 % p.a.) als der wertgewichtete Markt.

## Firmenzahlen (Tabelle "Number of Firms in Portfolios")
- Big-High: 262 (01/2017), 224 (09/2021), 218 (10/2021), 301 (08/2026); Mittel A 348, Mittel B 315.
- Hi PRIOR: 321 (01/2017), 342 (09/2021), 333 (10/2021), 462 (08/2026); Mittel A 434, Mittel B 370.
Also **mehrere hundert Firmen**, nicht "dutzende": deutlich breiter als der Korb von rund 19 Werten. Der Korb ist konzentriert, die French-Portfolios diversifiziert; Streuung und Drawdown sind nicht vergleichbar. Wertgewichtet wird zudem von wenigen Riesenwerten bestimmt.

## Auffaelligkeiten und Grenzen
- Ein Teil von B haengt an wenigen Monaten: Hi PRIOR VW **04/2026 +31,71 %** und **05/2026 +20,04 %** (Big-High VW 04/2026 +17,80 %). Ohne diese Monate waere das B-Ergebnis stark anders; B2 (bis 06/2026) enthaelt beide. Die Datei ist in den letzten Monaten ungewoehnlich volatil (Jahreswert 2026 fuer Hi PRIOR in der Annual-Tabelle: +247 %, Lo PRIOR -43 %); ich habe diese Werte nicht geglaettet oder angezweifelt, aber vor einer Ableitung sollte man sie gegen eine zweite Quelle pruefen. Vorlaeufige/junge CRSP-Monate koennen revidiert werden.
- Die Portfolios sind **nicht handelbar** wie berechnet: monatliche Neubildung, keine Kosten, keine Leerverkaufs- oder Produkthuerden, Mikrowerte im EW-Dezil (EW-Zahlen sind klein-wert-lastig).
- Drawdown nur auf Monatsende-Basis; Tageswerte (Daily-Dateien existieren) wuerden tiefere Werte zeigen.
- Momentum-Signal der Daten: Prior-Rendite Monat -12 bis -2; unser Korb kann anders definiert sein.
- Zeitraum ist Rueckblick, keine Aussage ueber die Zukunft. Fenster A und B sind weder vorregistriert noch getrennt Entdeckung/Bestaetigung: deskriptiv, kein Mueller-Urteil ("belegt" o. ae.).
- Kein Vergleich zu Zinsen/Risikoadjustierung gerechnet (nur Rendite und Drawdown).

## Dateien
Skript `02-french-rechnen.py` (Aufruf: `python3 02-french-rechnen.py <Verzeichnis mit den drei entpackten Ordnern>`), Auszug `02-french-monatsrenditen.csv`, Ergebnisse `02-french.json`.
