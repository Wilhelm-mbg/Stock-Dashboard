# Gruppe g4 – UCITS: Gleichgewicht, Qualität, Niedrige Schwankung, Value, Wachstum (Nasdaq-100), Momentum

> **Hinweis des Projektleiters (Endstand):** Dieser Gruppenbericht entstand beim Laden und Prüfen, also VOR den Korrekturen nach dem Siegel (benannte Ausschüttungs-Ergänzungen C2, USD-Werte in EUR-Reihen K2, Faktor-100-Brüche K3). Die Prüfbefunde gelten; einzelne Zahlen in den Tabellen hier können davon abweichen. Maßgeblich sind `ERGEBNIS.md` und `ergebnis.json`; `gruppe-gN.json` ist mit dem Endstand neu gerechnet.


Studie `faktor-etf-realitaet-2026-10/v1`, Datenende 15.09.2026. Rechner: `rechnen.js` (Fassung K1b), Lauf `node rechnen.js --roh <ROH> --gruppe g4 --aus gruppe-g4.json`. Stand dieses Berichts: 2026-10-05 01:37. Alle Tabellenzahlen sind per Skript aus `gruppe-g4.json`, `factsheet-g4.json` bzw. dem Börsenvergleich (Kratzordner, gleiche Rechenfunktionen) erzeugt. Beschreibende Zahlen nach vorab festgelegter Regel – keine Anlageberatung.

Abstand = Rendite p. a. Fonds − Maßstab in Prozentpunkten. Gegen SPY in USD (EZB-Kurs), gegen SXR8 in EUR. Klasse „Welt“: der Vergleich mit dem S&P 500 mischt Faktor und Region (UCITS-Zusatz 6); das Urteil kommt trotzdem aus dem Rechner.

## 1. Ergebnis je Fonds

### 1a. Gegen SPY (USD)

| Gruppe | Fonds | Klasse | Symbol | Daten ab | Urteil | A | B | 5-J.-Fenster vorn | Median | schlechtester (Start) | Rückschlag gg. SPY |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Gleichgewicht | **XDEW** | gleicher Index | XDEW.DE | 15.08.2014 | nicht verlässlich vorn | −3,26 | −4,35 | 0/85 (0 %) | −2,93 | −5,83 (05/2021) | −34,3 % |
| Gleichgewicht | **SP2Q** | gleicher Index | SP2Q.DE | 09.04.2021 | nicht beurteilbar (zu jung) | – | −4,34 | 0/5 (0 %) | −4,74 | −5,79 (05/2021) | −27,7 % |
| Qualität | **QDVB** | gleicher Index | QDVB.DE | 24.10.2016 | nicht verlässlich vorn | −0,36 | −1,91 | 2/59 (3 %) | −1,07 | −2,27 (08/2021) | −19,6 % |
| Qualität | **UBUT** | US-Faktor | UBUT.DE | 22.09.2015 | nicht verlässlich vorn | +3,35 | −0,63 | 50/72 (69 %) | +1,02 | −2,54 (03/2020) | −21,0 % |
| Qualität | **IS3Q** | Welt | IS3Q.DE | 06.10.2014 | nicht verlässlich vorn | −1,47 | −3,17 | 0/83 (0 %) | −2,78 | −7,09 (10/2014) | −43,7 % |
| Qualität | **XDEQ** | Welt | XDEQ.DE | 11.09.2014 | nicht verlässlich vorn | −1,38 | −3,16 | 0/84 (0 %) | −2,53 | −3,69 (10/2020) | −45,5 % |
| Niedrige Schwankung | **XMVU** | gleicher Index | XMVU.L | 08.11.2016 | nicht verlässlich vorn | −4,32 | −5,73 | 0/58 (0 %) | −5,06 | −7,46 (05/2019) | −44,2 % |
| Niedrige Schwankung | **MIVU** | gleicher Index | MIVU.PA | 25.04.2017 | nicht beurteilbar (zu jung) | – | −5,81 | 0/53 (0 %) | −5,76 | −7,77 (05/2019) | −47,2 % |
| Niedrige Schwankung | **SPY1** | gleicher Index | SPY1.DE | 04.10.2012 | nicht verlässlich vorn | −6,51 | −7,85 | 9/107 (8 %) | −4,92 | −10,02 (05/2019) | −63,2 % |
| Niedrige Schwankung | **IBCK** | US-Faktor | IBCK.DE | 30.11.2012 | nicht verlässlich vorn | −4,40 | −4,02 | 8/106 (8 %) | −3,58 | −8,00 (01/2013) | −51,0 % |
| Niedrige Schwankung | **UBUR** | US-Faktor | UBUR.DE | 23.09.2015 | nicht verlässlich vorn | −4,62 | −6,96 | 0/72 (0 %) | −4,66 | −7,90 (05/2021) | −46,3 % |
| Niedrige Schwankung | **IQQ0** | Welt | IQQ0.DE | 30.11.2012 | nicht verlässlich vorn | −7,02 | −7,34 | 0/106 (0 %) | −6,59 | −10,87 (01/2013) | −67,4 % |
| Niedrige Schwankung | **XDEB** | Welt | XDEB.DE | 05.09.2014 | nicht verlässlich vorn | −7,03 | −7,28 | 0/84 (0 %) | −7,27 | −10,17 (05/2019) | −63,3 % |
| Value | **QDVI** | gleicher Index | QDVI.DE | 24.10.2016 | nicht verlässlich vorn | −7,06 | +4,15 | 4/59 (7 %) | −5,62 | −8,76 (12/2019) | −45,0 % |
| Value | **UBU5** | US-Faktor | UBU5.DE | 11.04.2012 | nicht verlässlich vorn | −7,83 | −2,42 | 0/113 (0 %) | −4,16 | −7,74 (04/2012) | −56,4 % |
| Value | **ZPRU** | US-Faktor | ZPRU.DE | 18.02.2015 | nicht verlässlich vorn | −6,83 | +0,92 | 1/79 (1 %) | −4,97 | −8,73 (07/2017) | −50,6 % |
| Value | **UBUS** | US-Faktor | UBUS.DE | 23.09.2015 | nicht verlässlich vorn | −3,81 | −4,24 | 1/72 (1 %) | −2,54 | −6,20 (05/2021) | −34,3 % |
| Value | **IS3S** | Welt | IS3S.DE | 06.10.2014 | nicht verlässlich vorn | −10,11 | +4,47 | 7/83 (8 %) | −7,82 | −11,88 (08/2015) | −63,3 % |
| Value | **XDEV** | Welt | XDEV.DE | 11.09.2014 | nicht verlässlich vorn | −10,15 | +4,67 | 7/84 (8 %) | −7,85 | −11,17 (08/2015) | −63,1 % |
| Wachstum | **MWOT** | gleicher Index | MWOW.DE | 07.10.2024 | nicht beurteilbar (zu jung) | – | – | – | – | – | −18,3 % |
| Wachstum | **SXRV** | gleicher Index | CSNDX.SW | 26.01.2010 | verlässlich vorn | +10,40 | +1,33 | 139/140 (99 %) | +4,54 | −0,06 (08/2020) | −24,1 % |
| Wachstum | **EXXT** | gleicher Index | EXXT.DE | 02.01.2008 | verlässlich vorn | +10,34 | +1,19 | 152/164 (93 %) | +3,94 | −6,86 (06/2008) | −45,0 % |
| Wachstum | **EQQQ** | gleicher Index | EQQQ.DE | 02.01.2008 | verlässlich vorn | +10,54 | +1,34 | 150/164 (91 %) | +4,08 | −6,82 (07/2008) | −45,3 % |
| Wachstum | **EQQX** | gleicher Index | EQQX.DE | 14.04.2021 | nicht beurteilbar (zu jung) | – | +1,55 | 5/5 (100 %) | +1,92 | +1,24 (07/2021) | −24,3 % |
| Wachstum | **LYMS** | gleicher Index | UST.PA | 02.01.2008 | verlässlich vorn | +9,88 | +1,52 | 164/164 (100 %) | +3,72 | +0,09 (08/2020) | −24,4 % |
| Wachstum | **6AQQ** | gleicher Index | ANX.PA | 08.06.2010 | verlässlich vorn | +10,51 | +1,50 | 135/135 (100 %) | +4,67 | +0,06 (08/2020) | −24,3 % |
| Wachstum | **XNAS** | gleicher Index | XNAS.DE | 27.01.2021 | nicht beurteilbar (zu jung) | – | +1,45 | 8/8 (100 %) | +1,16 | +0,25 (02/2021) | −24,4 % |
| Momentum | **QDVA** | gleicher Index | QDVA.DE | 24.10.2016 | nicht verlässlich vorn | +3,40 | −1,64 | 7/59 (12 %) | −3,09 | −5,77 (05/2018) | −30,9 % |
| Momentum | **IS3R** | Welt | IS3R.DE | 06.10.2014 | nicht verlässlich vorn | +2,09 | −1,11 | 28/83 (34 %) | −1,97 | −5,02 (05/2018) | −34,3 % |
| Momentum | **XDEM** | Welt | XDEM.DE | 05.09.2014 | nicht verlässlich vorn | +2,31 | −1,05 | 28/84 (33 %) | −1,82 | −4,91 (05/2018) | −39,3 % |

### 1b. Gegen SXR8 (EUR)

| Fonds | A | B | 5-J.-Fenster vorn | Median | schlechtester (Start) | Rückschlag gg. SXR8 | Urteil gg. SXR8 allein |
|---|---|---|---|---|---|---|---|
| **XDEW** | −2,90 | −4,28 | 0/85 (0 %) | −2,61 | −5,73 (05/2021) | −32,1 % | nicht verlässlich vorn |
| **SP2Q** | – | −4,27 | 0/5 (0 %) | −4,40 | −5,69 (05/2021) | −26,8 % | nicht beurteilbar (zu jung) |
| **QDVB** | −0,08 | −1,84 | 6/59 (10 %) | −0,78 | −1,92 (05/2021) | −16,8 % | nicht verlässlich vorn |
| **UBUT** | +3,52 | −0,55 | 52/72 (72 %) | +1,38 | −1,70 (03/2020) | −12,5 % | nicht verlässlich vorn |
| **IS3Q** | −1,16 | −3,10 | 0/83 (0 %) | −2,38 | −6,93 (10/2014) | −41,8 % | nicht verlässlich vorn |
| **XDEQ** | −1,08 | −3,09 | 0/84 (0 %) | −2,14 | −3,50 (10/2020) | −43,3 % | nicht verlässlich vorn |
| **XMVU** | −3,94 | −5,68 | 0/58 (0 %) | −4,81 | −7,28 (10/2020) | −42,2 % | nicht verlässlich vorn |
| **MIVU** | – | −5,75 | 0/53 (0 %) | −5,57 | −7,41 (10/2020) | −46,3 % | nicht beurteilbar (zu jung) |
| **SPY1** | −6,07 | −7,80 | 13/107 (12 %) | −4,47 | −9,81 (01/2020) | −62,1 % | nicht verlässlich vorn |
| **IBCK** | −4,02 | −3,96 | 17/106 (16 %) | −3,30 | −7,91 (01/2013) | −49,5 % | nicht verlässlich vorn |
| **UBUR** | −4,23 | −6,90 | 0/72 (0 %) | −4,43 | −7,82 (05/2021) | −45,0 % | nicht verlässlich vorn |
| **IQQ0** | −6,56 | −7,29 | 0/106 (0 %) | −6,36 | −10,83 (01/2013) | −66,3 % | nicht verlässlich vorn |
| **XDEB** | −6,57 | −7,23 | 0/84 (0 %) | −6,99 | −10,15 (06/2019) | −62,5 % | nicht verlässlich vorn |
| **QDVI** | −6,60 | +4,25 | 4/59 (7 %) | −5,39 | −8,69 (12/2019) | −40,3 % | nicht verlässlich vorn |
| **UBU5** | −7,36 | −2,34 | 0/113 (0 %) | −3,95 | −7,80 (04/2012) | −55,1 % | nicht verlässlich vorn |
| **ZPRU** | −6,38 | +1,01 | 1/79 (1 %) | −4,85 | −8,60 (07/2017) | −47,8 % | nicht verlässlich vorn |
| **UBUS** | −3,44 | −4,18 | 3/72 (4 %) | −2,34 | −6,11 (05/2021) | −32,5 % | nicht verlässlich vorn |
| **IS3S** | −9,57 | +4,58 | 7/83 (8 %) | −7,60 | −11,37 (08/2015) | −62,4 % | nicht verlässlich vorn |
| **XDEV** | −9,61 | +4,78 | 7/84 (8 %) | −7,64 | −10,69 (11/2016) | −62,0 % | nicht verlässlich vorn |
| **MWOT** | – | – | – | – | – | −13,0 % | nicht beurteilbar (zu jung) |
| **SXRV** | +10,38 | +1,43 | 130/130 (100 %) | +4,97 | +0,28 (08/2020) | −21,7 % | verlässlich vorn |
| **EXXT** | +10,32 | +1,28 | 130/130 (100 %) | +4,86 | +0,04 (08/2020) | −21,2 % | verlässlich vorn |
| **EQQQ** | +10,52 | +1,43 | 129/130 (99 %) | +5,07 | −0,95 (09/2014) | −35,9 % | verlässlich vorn |
| **EQQX** | – | +1,65 | 5/5 (100 %) | +2,42 | +1,71 (08/2021) | −20,7 % | nicht beurteilbar (zu jung) |
| **LYMS** | +9,88 | +1,61 | 130/130 (100 %) | +4,43 | +0,43 (08/2020) | −20,7 % | verlässlich vorn |
| **6AQQ** | +10,49 | +1,59 | 130/130 (100 %) | +5,16 | +0,40 (08/2020) | −20,9 % | verlässlich vorn |
| **XNAS** | – | +1,55 | 8/8 (100 %) | +1,60 | +0,59 (01/2021) | −21,1 % | nicht beurteilbar (zu jung) |
| **QDVA** | +3,58 | −1,56 | 7/59 (12 %) | −2,97 | −5,43 (05/2018) | −29,9 % | nicht verlässlich vorn |
| **IS3R** | +2,30 | −1,03 | 29/83 (35 %) | −2,00 | −4,66 (05/2018) | −33,1 % | nicht verlässlich vorn |
| **XDEM** | +2,51 | −0,96 | 32/84 (38 %) | −1,64 | −4,55 (05/2018) | −38,1 % | nicht verlässlich vorn |

Zählung: verlässlich vorn 5 (SXRV, EXXT, EQQQ, LYMS, 6AQQ); nicht verlässlich vorn 20; nicht beurteilbar (zu jung) 5 (SP2Q, MIVU, MWOT, EQQX, XNAS).

### 1c. Symbolwahl und Börsenvergleich (UCITS-Zusatz 1 und 2)

Je Kandidatenreihe mit mindestens einem Jahr Daten: Abstand A und B gegen SPY in USD, wie `rechnen.js` aufbereitet (Sprungpaare, K1b). * = gewählte Reihe. Spanne = größter minus kleinster Abstand über die Notizen ohne nachgewiesenen Datenfehler (Messrauschen der Notiz).

| Fonds | Notiz (Währung, Daten ab, A / B) | Spanne A | Spanne B | ausgeschlossen (Datenfehler der Notiz) |
|---|---|---|---|---|
| **XDEW** | *XDEW.DE (EUR, 15.08.2014, −3,26 / −4,35); XDEW.L (USD, 04.04.2016, −3,64 / −4,23); XDEW.SW (CHF, 27.08.2014, −0,20 / −6,16); XDEW.MI (EUR, 10.06.2014, −4,28 / −4,36) | 0,39 | 0,12 | XDEW.SW: eingefrorene, gerundete CHF-Kurse (42,00 am 30.12.2016 und 03.01.2017); XDEW.MI: USD-Werte als EUR bis mindestens 2017 (Verhältnis zu XDEW.DE = EURUSD) |
| **SP2Q** | *SP2Q.DE (EUR, 09.04.2021, – / −4,34); SPEQ.L (USD, 06.04.2021, – / −4,31) | – | 0,03 | – |
| **QDVB** | *QDVB.DE (EUR, 24.10.2016, −0,36 / −1,91); IUQA.L (USD, 13.10.2016, +4,84 / −1,89) | – | – | IUQA.L: GBP-Werte als USD bis Anfang 2017 (Verhältnis zu QDVB.DE ≈ 0,80) |
| **UBUT** | *UBUT.DE (EUR, 22.09.2015, +3,35 / −0,63); UBUT.AS (EUR, 23.02.2016, +3,33 / −0,63); UQLTD.SW (CHF, 26.08.2015, +3,27 / −0,59) | 0,08 | 0,04 | – |
| **IS3Q** | *IS3Q.DE (EUR, 06.10.2014, −1,47 / −3,17); IWQU.L (USD, 06.10.2014, −1,55 / −3,15) | 0,08 | 0,02 | – |
| **XDEQ** | *XDEQ.DE (EUR, 11.09.2014, −1,38 / −3,16); XDEQ.L (GBp, 11.09.2014, −1,55 / −3,12); XDEQ.SW (USD, 11.09.2014, −1,30 / −3,27) | 0,25 | 0,14 | – |
| **XMVU** | *XMVU.L (USD, 08.11.2016, −4,32 / −5,73) | – | – | – |
| **MIVU** | MIVU.DE (EUR, 02.11.2018, – / −5,80); *MIVU.PA (EUR, 25.04.2017, – / −5,81) | – | 0,01 | – |
| **SPY1** | *SPY1.DE (EUR, 04.10.2012, −6,51 / −7,85); LOWV.L (USD, 03.10.2012, −6,59 / −7,84) | 0,08 | 0,01 | – |
| **IBCK** | *IBCK.DE (EUR, 30.11.2012, −4,40 / −4,02); SPMV.L (USD, 30.11.2012, −4,51 / −3,99) | 0,11 | 0,03 | – |
| **UBUR** | *UBUR.DE (EUR, 23.09.2015, −4,62 / −6,96); UC95.L (GBp, 23.09.2015, +287,22 / +346,64); UBUR.AS (EUR, 23.02.2016, −4,63 / −7,01) | 0,01 | 0,05 | UC95.L: GBP- und GBp-Werte gemischt |
| **IQQ0** | *IQQ0.DE (EUR, 30.11.2012, −7,02 / −7,34); MVOL.L (USD, 30.11.2012, −7,08 / −7,32) | 0,06 | 0,02 | – |
| **XDEB** | *XDEB.DE (EUR, 05.09.2014, −7,03 / −7,28); XDEB.MI (EUR, 09.09.2015, – / −7,28) | – | 0,00 | – |
| **QDVI** | *QDVI.DE (EUR, 24.10.2016, −7,06 / +4,15); IUVL.L (USD, 13.10.2016, −7,11 / +4,14) | 0,05 | 0,01 | – |
| **UBU5** | *UBU5.DE (EUR, 11.04.2012, −7,83 / −2,42); USVUSY.SW (USD, 11.04.2012, −7,98 / −2,31) | 0,15 | 0,11 | – |
| **ZPRU** | *ZPRU.DE (EUR, 18.02.2015, −6,83 / +0,92); USVL.L (USD, 18.02.2015, −6,92 / +0,96) | 0,09 | 0,05 | – |
| **UBUS** | *UBUS.DE (EUR, 23.09.2015, −3,81 / −4,24); UBUS.AS (EUR, 23.02.2016, −3,81 / −4,21); UPVLD.SW (CHF, 09.03.2017, – / −4,17) | 0,00 | 0,08 | – |
| **IS3S** | *IS3S.DE (EUR, 06.10.2014, −10,11 / +4,47); IWVL.L (USD, 06.10.2014, −10,29 / +4,49) | 0,18 | 0,01 | – |
| **XDEV** | *XDEV.DE (EUR, 11.09.2014, −10,15 / +4,67); XDEV.L (GBp, 11.09.2014, −10,28 / +4,69); XDEV.SW (USD, 11.09.2014, −10,16 / +4,64); XDEV.MI (EUR, 17.09.2015, −10,13 / +4,65) | 0,15 | 0,05 | – |
| **MWOT** | *MWOW.DE (EUR, 07.10.2024, – / –); MWOT.L (GBP, 18.02.2025, – / –) | – | – | – |
| **SXRV** | SXRV.DE (EUR, 07.05.2010, +10,50 / +1,32); *CSNDX.SW (USD, 26.01.2010, +10,40 / +1,33) | 0,10 | 0,01 | – |
| **EXXT** | *EXXT.DE (EUR, 02.01.2008, +10,34 / +1,19) | – | – | – |
| **EQQQ** | *EQQQ.DE (EUR, 02.01.2008, +10,54 / +1,34); EQQQ.L (GBp, 02.01.2009, +10,36 / +1,39); EQQQ.SW (USD, 05.01.2009, +10,42 / +1,35); EQQQ.MI (EUR, 02.01.2008, +10,56 / +1,34) | 0,20 | 0,05 | – |
| **EQQX** | *EQQX.DE (EUR, 14.04.2021, – / +1,55); EQQS.L (USD, 22.03.2021, – / +1,58) | – | 0,03 | – |
| **LYMS** | LYMS.DE (EUR, 04.01.2016, +10,03 / +1,51); *UST.PA (EUR, 02.01.2008, +9,88 / +1,52) | 0,15 | 0,01 | – |
| **6AQQ** | 6AQQ.DE (EUR, 19.04.2018, – / +1,50); *ANX.PA (EUR, 08.06.2010, +10,51 / +1,50) | – | 0,00 | – |
| **XNAS** | *XNAS.DE (EUR, 27.01.2021, – / +1,45); XNAS.L (USD, 21.01.2021, – / +9,14); XNAS.SW (CHF, 21.01.2021, – / +1,46); XNAS.MI (EUR, 17.02.2021, – / +1,45) | – | 0,02 | XNAS.L: GBP-Werte als USD im Jahr 2021 (Verhältnis zu XNAS.DE ≈ 0,71) |
| **QDVA** | *QDVA.DE (EUR, 24.10.2016, +3,40 / −1,64); IUMO.L (USD, 13.10.2016, +3,24 / −1,62) | 0,17 | 0,03 | – |
| **IS3R** | *IS3R.DE (EUR, 06.10.2014, +2,09 / −1,11); IWMO.L (USD, 06.10.2014, +2,01 / −1,08) | 0,08 | 0,03 | – |
| **XDEM** | *XDEM.DE (EUR, 05.09.2014, +2,31 / −1,05); XDEM.L (GBp, 05.09.2014, +2,15 / −1,01); XDEM.SW (USD, 05.09.2014, +2,32 / −1,10); XDEM.MI (EUR, 25.09.2015, +2,33 / −1,05) | 0,18 | 0,10 | – |

Yahoo-Namen der gewählten Reihen (Feld `kandidaten[].yahooName`): XDEW → XDEW.DE „Xtrackers S&P 500 Equal Weight UCITS ETF 1C“; SP2Q → SP2Q.DE „Invesco S&P 500 Equal Weight Index ETF Acc“; QDVB → QDVB.DE „iShares Edge MSCI USA Quality Factor UCITS ETF USD (Acc)“; UBUT → UBUT.DE „UBS Factor MSCI USA Quality Screened UCITS ETF USD dis“; IS3Q → IS3Q.DE „iShares Edge MSCI World Quality Factor UCITS ETF USD (Acc)“; XDEQ → XDEQ.DE „Xtrackers MSCI World Quality UCITS ETF 1C“; XMVU → XMVU.L „Xtrackers MSCI USA Minimum Volatility UCITS ETF 1D“; MIVU → MIVU.PA „Amundi Index Solutions - Amundi MSCI USA Minimum Volatility Factor UCITS ETF“; SPY1 → SPY1.DE „State Street SPDR S&P 500 Low Volatility UCITS ETF“; IBCK → IBCK.DE „iShares Edge S&P 500 Minimum Volatility UCITS ETF USD (Acc)“; UBUR → UBUR.DE „UBS Factor MSCI USA Low Volatility UCITS ETF USD dis“; IQQ0 → IQQ0.DE „iShares Edge MSCI World Minimum Volatility UCITS ETF USD (Acc)“; XDEB → XDEB.DE „Xtrackers MSCI World Minimum Volatility UCITS ETF 1C“; QDVI → QDVI.DE „iShares Edge MSCI USA Value Factor UCITS ETF USD (Acc)“; UBU5 → UBU5.DE „UBS MSCI USA Value UCITS ETF USD dis“; ZPRU → ZPRU.DE „State Street SPDR MSCI USA Value UCITS ETF USD Acc“; UBUS → UBUS.DE „UBS Factor MSCI USA Prime Value Screened UCITS ETF USD dis“; IS3S → IS3S.DE „iShares Edge MSCI World Value Factor UCITS ETF USD (Acc)“; XDEV → XDEV.DE „Xtrackers MSCI World Value UCITS ETF 1C“; MWOT → MWOW.DE „Amundi Russell 1000 Growth UCITS ETF Acc“; SXRV → CSNDX.SW „iShares NASDAQ 100 UCITS ETF USD (Acc)“; EXXT → EXXT.DE „iShares NASDAQ-100 UCITS ETF (DE)“; EQQQ → EQQQ.DE „Invesco EQQQ NASDAQ-100 UCITS ETF“; EQQX → EQQX.DE „Invesco NASDAQ-100 Swap UCITS ETF Acc“; LYMS → UST.PA „Amundi Core Nasdaq-100 Swap UCITS ETF Acc“; 6AQQ → ANX.PA „Amundi Index Solutions - Amundi Nasdaq-100 Swap ETF EUR Acc“; XNAS → XNAS.DE „Xtrackers NASDAQ 100 UCITS ETF 1C“; QDVA → QDVA.DE „iShares Edge MSCI USA Momentum Factor UCITS ETF USD (Acc)“; IS3R → IS3R.DE „iShares Edge MSCI World Momentum Factor UCITS ETF USD (Acc)“; XDEM → XDEM.DE „Xtrackers MSCI World Momentum UCITS ETF 1C“.

## 2. Prüfbefunde je Fonds (REGEL C7, K1b, UCITS-Zusatz)

Prüfskripte im Kratzordner (nicht im Repo): `pruefe.js` (Listen a–e je Fonds), `divwaehrung.js` (Ausschüttungsbeträge je Börsenplatz), `boersen-voll.js` (alle Kennzahlen je Notiz), `bereinigt.js` (Wirkungsschätzung der USD-Werte). Alle benutzen `rechnen.js` (`leseRohdatei`, `bereite`, `vergleiche`, `kontext`).

### 2.0 Was für alle Reihen der Gruppe gilt

- **Laden:** 118 Symbole; 3 nicht ladbar, auch nach Wiederholung (Yahoo antwortet mit HTTP 200 ohne Kerzen): `XDEQ.SG`, `IE00BDB7J586.SG`, `IE0005E8B9S4.SG`. Die Regionalbörsen `.DU/.MU/.HM/.HA` liefern bei allen Fonds nur einen Tag (02.10.2026) und spielen für die Wahl keine Rolle.
- **Yahoo-Namen (Zusatz 1):** Die gewählte Reihe trägt bei allen 30 Fonds den Namen des richtigen Fonds (Anbieter, Index, Anteilsklasse; Liste unter 1c). Bei keinem Fonds gehört ein Kürzel einem fremden Fonds. Eine Sperre ist nicht nötig.
- **Splits, Kapitalgewinne:** keine in allen gewählten Reihen. Verschobene oder außerhalb liegende Ausschüttungen: keine.
- **Sprungpaare (a):** 62 Tage entfernt (28 davon bei EQQQ), alle plausibel Fehlkurse. Der Kurs liegt jeweils um den Faktor EURUSD (bzw. 1/EURUSD) neben beiden Nachbartagen. 10 Reihen haben ein Sprungpaar am **24.10.2025** (XDEQ, MIVU, IBCK, IQQ0, XDEB, UBU5, XDEV, EXXT, EQQX, XDEM). An diesem Tag hat Yahoo in vielen Xetra-/Paris-Reihen den USD-Wert eingetragen.
- **Systematischer Datenfehler (e2):** Yahoo führt in EUR-Reihen **USD-Werte**, also Kurs × EURUSD. Das betrifft ganze Anfangsabschnitte nach Notierungsbeginn und einzelne Tage. In 11 Reihen gilt das für den **05.06.2017** (Pfingstmontag): +12,3 bis +13,2 %, am Folgetag zurück. Das Muster wird unter „Bruch“ gelistet. Es wird aber nicht entfernt: Bei den Einzeltagen liegt r(t) unter 15 %, bei den Abschnitten fehlt der eingefrorene Lauf, den K1b für eine Kürzung verlangt. A, B und das Urteil berührt es in g4 bei keinem Fonds (alle Fensterränder 03.01.2017, 15.09.2021, 15.09.2026 sind sauber). Betroffen sind Monatsenden in den ersten Monaten (rollierende Fenster), der relative Rückschlag (Spitze auf einem USD-Wert) und das schlechteste Fenster. Die Wirkung je Fonds steht unten. Gemessen ist sie am Vergleich mit einer sauberen Zweitnotiz (gleiche Rechnung, `boersen-voll.js`) und an einer Schätzung, die die USD-Tage zurückrechnet (`bereinigt.js`). Kein Urteil kippt.
- **Ausschüttungshistorie bei Yahoo beginnt erst 2013/2014** (EUR-Notizen 2014, SIX 2013). Für die vor 2008 bzw. 2012 aufgelegten Ausschütter EXXT, EQQQ und UBU5 fehlen die frühen Zahlungen (Wirkung bei den Fonds).
- **Datenbeginn gegen Auflage (c):** Wo die gewählte Reihe deutlich nach der Auflage beginnt (EXXT, EQQQ, LYMS, MWOT), liegt das an Yahoo (Historie ab 2008 bzw. Notierungsbeginn). Die Wahl folgt C6.

### 2.1 Je Fonds

**XDEW** (XDEW.DE): a) keine. b) keine. c) keine Lücke; Beginn 15.08.2014, 66 Tage nach Auflage (10.06.2014). d) thesaurierend, keine Ereignisse. e) adjclose 0,000/0,000 Pp. e2/e3) keine. Börsen: XDEW.L beginnt nach K1b-Schnitt erst am 04.04.2016 (5 Brüche, eingefrorener Anfang). XDEW.SW (eingefrorene, gerundete CHF-Kurse) und XDEW.MI (bis mindestens 2017 USD-Werte) sind als Notizen unbrauchbar. **Unauffällig.**

**SP2Q** (SP2Q.DE): a–e unauffällig, Beginn 09.04.2021 (3 Tage nach Auflage) → zu jung für A.

**QDVB** (QDVB.DE): a, b, c, d, e2 unauffällig; e) 0,000. e3) 24 eingefrorene Läufe 06/2017–02/2019 (bis 29 Handelstage, dünner Xetra-Handel). Keiner liegt an einem Rand von A/B. Monatsenden 2017/18 sind teils veraltet (Rauschen in den Fenstern). Die Zweitnotiz IUQA.L führt bis Anfang 2017 GBP-Werte als USD. Am 03.01.2017 steht ein echter USD-Wert dazwischen (Sprungpaar). Dadurch ist IUQA.L in A unbrauchbar (+4,84 statt −0,36), in B gleich (−1,89 gegen −1,91).

**UBUT** (UBUT.DE, ausschüttend):
- b/e2) 25.03.2020 +10,76 % (SPY +1,50 %). Der Schluss am 23. und 24.03. ist mit 19,294 gleich, am 24.03. gab es keinen Handel. Der Sprung holt den US-Anstieg vom 24.03. (SPY +9,1 %) nach: echt, kein Datenfehler, an keinem Fensterrand.
- c) keine Lücke; Beginn 22.09.2015 (27 Tage). e3) 36 eingefrorene Läufe 2017–2019.
- d) 22 Ausschüttungen, 2 je Jahr (Jan./Feb. und Jul./Aug.) lückenlos 2016–2026, Quote 0,19–0,84 % (alle im Band). Die Beträge sind in EUR umgerechnet, kein Fremdwährungsbetrag: UBUT.AS hat identische Beträge, der Quotient zu UQLTD.SW (CHF) ist 1/EURCHF.
- e) −0,008/−0,004.
- Index heute MSCI USA Quality Advanced Target Select (ESG-Variante, laut UBS-Factsheet).
- **Unauffällig.**

**IS3Q** (IS3Q.DE):
- a) Sprungpaare 14.10.2014 (19,14 zwischen 24,13 und 23,91) und 21.11.2014 (26,12 zwischen 20,78 und 21,02): Fehlkurse, zu Recht entfernt.
- b/e2) 16.10., 21.10., 22.10., 30.10., 03.11.2014 (±20–30 %, Markt ≈ 0) sind **Datenfehler**: USD-Werte in der EUR-Reihe, Verhältnis ≈ EURUSD 1,27. Ebenso 05./06.06.2017 (31,05 zwischen 27,53 und 27,46; Verhältnis 1,128 = EURUSD).
- Wirkung: Das Monatsende Oktober 2014 (31.10.: 25,78 statt ≈ 20,3) ist ein USD-Wert. Deshalb ist das Fenster 2014-10 das „schlechteste“ (−7,09 statt −3,94 wie bei IWQU.L). Der relative Rückschlag liegt bei −43,7 % statt −30,3 % (IWQU.L). A, B und der Anteil 0/83 sind unberührt.
- c) keine Lücke; Beginn 06.10.2014 (3 Tage). d) keine Ereignisse. e) 0,000.

**XDEQ** (XDEQ.DE):
- a) Sprungpaare 07.10.2014 und 24.10.2025: USD-Werte, entfernt.
- b/e2) 25.09.2014 −22,2 %: Datenfehler, davor (11.–24.09.2014) USD-Werte. Dazu 05./06.06.2017.
- e3) eingefroren 04.–10.10.2017.
- Wirkung: relativer Rückschlag −45,5 % (Spitze 12.09.2014) statt −29,4 % (XDEQ.SW). Fensterzahlen gleich (0/84).
- c, d, e unauffällig.

**XMVU** (XMVU.L, USD, ausschüttend):
- a/b/e2) keine. c) keine Lücke; Beginn = Auflage 08.11.2016. e3) 17 eingefrorene Läufe 12/2017–09/2018 (bis 34 Handelstage, dünner LSE-Handel).
- d) 14 Ausschüttungen: 2018–2021 je eine (April/Mai), 2022 zwei (April, August), seit 2023 zwei (Februar, August). Die erste ist vom 09.04.2018. Quote 0,58–2,04 % (alle im Band). Den Musterwechsel jährlich → halbjährlich habe ich nicht gegen die DWS-Historie geprüft. Die Factsheet-Abweichung (−0,07 Pp) spricht gegen fehlende Zahlungen 2021–2026.
- e) +0,008/−0,003. Einzige Notiz mit Historie, daher keine Spanne.

**MIVU** (MIVU.PA, zu jung; MIVU.DE erst ab 02.11.2018):
- a) Sprungpaare 20.07.2017 und 24.10.2025.
- b/e2) 18./19.07.2017 sind USD-Werte. Die ersten Tage (25.04.–12.05.2017) sind laut Schätzung ebenfalls USD-Werte. Wirkung nur auf den Rückschlag (−47,2 % statt ≈ −44,7 %).
- e3) 3 kurze Läufe 2024/25. d) keine Ereignisse. e) 0,000.

**SPY1** (SPY1.DE):
- b/e2) 05.10.2012 −23,0 %: Der erste Tag (04.10.2012) ist ein USD-Wert. 02./03.01.2013 (+36 %/−24 %): USD-Wert am 02.01. Dazu 05./06.06.2017. Alle drei sind **Datenfehler**.
- Wirkung: Rückschlag −63,2 % (Spitze 02.01.2013) statt −54,0 % (LOWV.L). Fenster 9/107 wie LOWV.L.
- e3) 3 Läufe Nov./Dez. 2017. c, d, e unauffällig.

**IBCK** (IBCK.DE):
- a) Sprungpaar 24.10.2025.
- b/e2) 18.02.2013 (−25 %), 06.03.2013 (+30 %), 22.07.2013 (−24 %) sind **Datenfehler**: 30.11.2012–15.02.2013 und 06.03.–19.07.2013 sind USD-Werte (Verhältnis 1,30–1,33 = EURUSD).
- Wirkung: Die Monatsenden 11/2012–01/2013 und 03–06/2013 sind verfälscht, die Fenster mit diesen Startmonaten zu schlecht. Schlechtestes Fenster −8,00 (01/2013) statt −5,92 (10/2020, SPMV.L), Median −3,58 statt −3,06, Rückschlag −51,0 % statt −39,1 %. Anteil gegen SPY 8/106 wie SPMV.L, gegen SXR8 17/106 (SPMV.L 15/106).
- c, d, e unauffällig.

**UBUR** (UBUR.DE, ausschüttend):
- a/b/e2) keine.
- c) Lücke 30.06.–31.07.2017 (31 Tage ohne Kurs); Beginn 23.09.2015 (28 Tage).
- e3) 23 eingefrorene Läufe 07/2017–05/2020 (bis 61 Handelstage, z. B. 18.12.2017–15.03.2018). Monatsenden 2017–2019 sind veraltet (Rauschen; Urteil bei 0/72 nicht berührt).
- d) 22 Ausschüttungen, 2 je Jahr lückenlos, Quote 0,63–0,99 %. Beträge wie UBUR.AS (EUR, umgerechnet). Die Zahlung vom 31.07.2017 bezieht sich wegen der Lücke auf den Schluss vom 30.06.2017.
- e) **adjclose A +0,191 Pp p. a. (> 0,10).** Ursache: Yahoos adjclose bucht die Ausschüttung vom 31.07.2017 (0,134861 EUR = 0,83 %) nicht, der Faktor adj/close springt an diesem Tag nicht. Alle anderen 21 Zahlungen stimmen. Der Hauptweg bucht sie, ist also richtig. Kein Befund gegen den Rechner.
- Notiz UC95.L: GBP und GBp gemischt, unbrauchbar.

**IQQ0** (IQQ0.DE):
- a) Sprungpaar 24.10.2025.
- b/e2) 18.02.2013, 06.03.2013 und 18.04.2013 sind **Datenfehler**: USD-Werte vom 30.11.2012–15.02.2013 und 06.03.–17.04.2013. Dazu 05./06.06.2017.
- Wirkung: Median −6,59 statt −6,22 (MVOL.L), schlechtestes Fenster −10,87 (01/2013) statt −10,22 (05/2019), Rückschlag −67,4 % statt −58,0 %. Anteil 0/106 gleich.
- c, d, e unauffällig.

**XDEB** (XDEB.DE):
- a) Sprungpaare 30.09., 31.10., 05.11.2014 und 24.10.2025: USD-Werte, entfernt.
- b/e2) 25.09.2014 −22,0 %: davor (05.–24.09.2014) USD-Werte. Dazu 05./06.06.2017.
- Wirkung: Rückschlag −63,3 % (Spitze 05.09.2014) statt ≈ −54,8 % (Schätzung). Fenster unberührt.
- e3) 2 kurze Läufe 2017. XDEB.SW hat Daten erst ab 23.09.2026, XDEB.MI ab 2015 (B gleich).

**QDVI** (QDVI.DE): b) 12.03.2020 −10,1 % (SPY −9,6 %) und 24.03.2020 +10,3 % (SPY +9,1 %): echt, kein Bruch. e3) 2 Läufe 2017. a, c, d, e unauffällig. **Unauffällig.**

**UBU5** (UBU5.DE, ausschüttend):
- a) Sprungpaare 02.07.2012, 19.07.2012 und 24.10.2025.
- b/e2) 13.06.2012 −20,5 %: **Datenfehler**, 11.04.–12.06.2012 sind USD-Werte. Wirkung: Fenster 04–05/2012 zu schlecht, schlechtestes −7,74 (04/2012) statt −7,61 (12/2016, USVUSY.SW). Rückschlag −56,4 % statt −44,3 %. Anteil 0/113 gleich.
- d) 26 Ausschüttungen, 2 je Jahr ab 31.01.2014, Quote 0,67–1,39 %.
  - Die Zahlung vom 06.02.2025 (1,22 %, 1,3595 EUR) ist echt: Die SIX-Notiz hat 1,4097 USD am selben Tag.
  - Die Beträge sind korrekt umgerechnet (Quotient zu USVUSY.SW = 1/EURUSD).
  - **Es fehlen die zwei Zahlungen 2013** (31.01. und 31.07.2013; bei USVUSY.SW vorhanden, umgerechnet 0,3824 und 0,3840 EUR). Wirkung, geschätzt mit diesen zwei Zahlungen: A, B und der Median sind unverändert. Das beste Fenster steigt von −1,75 auf −1,29, das schlechteste wechselt auf −7,54 (11/2016). Das Urteil ist unberührt.
- e) −0,005/−0,004.

**ZPRU** (ZPRU.DE):
- b/e2) 17 Brüche, alle **Datenfehler**:
  - 20.02.2015 −12 %: der 18./19.02.2015 sind USD-Werte.
  - 05./06.06.2017.
  - Juli 2017: vom 03.07. bis 01.08.2017 wechselt die Reihe fast täglich zwischen EUR- und USD-Werten. Das Monatsende 31.07.2017 ist ein USD-Wert (36,01 statt ≈ 30,9).
- Wirkung: Fenster 07/2017 wird mit −8,73 zum schlechtesten, sonst wäre es −8,00 (12/2019, USVL.L). Rückschlag −50,6 % (Spitze 31.07.2017) statt −46,1 %. Anteil 1/79 gleich.
- e3) 54 eingefrorene Läufe 2017–2020 (dünner Handel). c, d, e unauffällig.
- Laut Factsheet folgte der Fonds bis 11.07.2018 dem MSCI USA Value Weighted Index.

**UBUS** (UBUS.DE, ausschüttend):
- b) 09.03.2020 −10,3 % (SPY −7,8 %, Vortag eingefroren): echt, kein Bruch.
- e3) 52 eingefrorene Läufe 2017–2020.
- d) 21 Ausschüttungen; **2024 nur eine (Februar 2024 fehlt)**. Diese Zahlung fehlt auch an UBUS.AS und UPVLD.SW. Der Kurs fiel am Ex-Tag der Schwesterfonds (01.02.2024) um −0,92 %, wie die thesaurierenden Value-Fonds QDVI (−1,07 %) und ZPRU (−1,17 %). Ausschütter mit Ex-Tag fielen stärker (UBU5 −1,83 % bei 1,04 % Ausschüttung). Dazu nennt justETF für 2024 nur EUR 0,22. Beides spricht dafür, dass es keine Zahlung gab. Bei UBS ist das nicht überprüfbar (ubs.com HTTP 403).
- Quote der übrigen Zahlungen 0,60–1,05 %. e) −0,014/−0,003.

**IS3S** (IS3S.DE):
- a) Sprungpaare 14.10., 22.10. und 21.11.2014.
- b/e2) 20.10.2014 (USD-Werte davor) und 05./06.06.2017 sind Datenfehler. 12.03.2020 −11,0 % ist echt (SPY −9,6 %).
- Wirkung: Rückschlag −63,3 % statt −53,7 % (IWVL.L). Fenster 7/83 (IWVL.L 6/83).
- c, d, e unauffällig.

**XDEV** (XDEV.DE):
- a) Sprungpaare 30.09., 08.10., 09.10., 31.10.2014 und 24.10.2025.
- b/e2) Datenfehler: 22.09.2014 (USD-Werte 11.–19.09.2014), 10./13./21./23.10.2014 und 05./06.06.2017. 12.03.2020 ist echt.
- Wirkung: Rückschlag −63,1 % (Spitze 12.09.2014) statt −52,3 % (XDEV.SW). Fenster 7/84 gleich.
- c, d, e unauffällig.

**MWOT** (MWOW.DE, zu jung): Keine Kandidatenreihe hat Historie vor Oktober 2024. MWOW.DE beginnt am 07.10.2024, MWOT.DE am 22.09.2026 (in USD), MWOT.L am 18.02.2025 (GBP). `IE0005E8B9S4.SG` ist nicht ladbar. Die Historie des Vorgängers seit 2011 (Lyxor Russell 1000 Growth, FR0011119171, verschmolzen am 09.07.2024) steht unter keinem der Kandidaten (siehe Befunde).

**SXRV** (CSNDX.SW, USD; gewählt nach C6, weil SXRV.DE erst 101 Tage nach Auflage beginnt):
- a/b/e2) keine.
- c) Lücke 23.12.2025–05.01.2026 (13 Tage). Das Dezember-Monatsende liegt damit 8 Tage vor dem 31.12., innerhalb der Toleranz.
- e3) eingefroren 13.–31.01.2023 (13 Tage): Das Monatsende Januar 2023 ist veraltet, das Fenster 2018-01 endet auf einem alten Kurs. Ein zweiter Lauf 10.–20.11.2025 liegt an keinem Rand.
- d, e unauffällig.
- SXRV.DE hat einen Datenfehler im Oktober 2010 (schlechtestes Fenster dort −3,81, nur in dieser Notiz).

**EXXT** (EXXT.DE, ausschüttend, einzige Notiz mit Historie):
- c) Beginn 02.01.2008 (Auflage 27.03.2006).
- b/e2) 02.01.2009 −26,9 % (SPY +4,5 %) ist ein **Datenfehler**: Das ganze Jahr 2008 ist in USD-Werten geführt (Verhältnis zu EQQQ.MI 1,44 ≈ EURUSD).
- a) Sprungpaar 24.10.2025.
- Wirkung: Die Fenster mit Start 2008 sind zu schlecht (schlechtestes −6,86, Start 06/2008). Der relative Rückschlag gegen SPY (−45,0 %, 15.07.2008–02.01.2009) ist ein Artefakt. Schätzung: 153/164 statt 152/164. A, B und die SXR8-Werte (ab 11/2010) sind unberührt.
- d) Ich habe die Anbieterhistorie geprüft (iShares, 72 Termine seit 2006, Quelle unten):
  - Alle 46 Yahoo-Zahlungen ab 2014 stimmen mit dem Anbieter überein (EUR = USD/EZB, Abweichung < 2 %). Umgekehrt gibt es keine Yahoo-Zahlung ohne Gegenstück.
  - Die fehlenden September-Termine (2020, 2023–2026) sind beim Anbieter Nullzahlungen. Die Quoten unter 0,05 % (7 Fälle) sind echte kleine Zahlungen.
  - **Es fehlen 8 Zahlungen 2008–2013** (Ex-Tage 16.06.2008, 15.06.2009, 15.06.2010, 15.06.2011, 15.06.2012, 17.06.2013, 16.09.2013, 16.12.2013; zusammen 0,598 USD). Wirkung: 153/164 statt 152/164, Median +0,23 Pp. A und B sind unverändert.
- e) 0,000/−0,001.

**EQQQ** (EQQQ.DE, ausschüttend; EQQQ.DE und EQQQ.MI beginnen beide am 02.01.2008, daher wird die erste in der Liste gewählt):
- b/e2) 29 Brüche, alle **Datenfehler**:
  - Das Jahr 2008 ist komplett in USD-Werten geführt (Verhältnis zu EQQQ.MI 1,435).
  - Januar bis August 2009 wechseln USD- und EUR-Werte, im Frühjahr fast täglich (letzte USD-Einzelwerte 27.07., 14.08., 21.08.2009); weitere einzelne USD-Werte am 29.07.2010, 12.04., 02.06., 07.06.2011, 28.05.2012 sowie 23./26.09.2014. Insgesamt 28 Sprungpaare entfernt.
  - 06./07.01.2011, 29./30.08.2011.
  - 30.09.–29.10.2014 sind USD-Werte; das Monatsende September 2014 ist ein USD-Wert.
  - 05./06.06.2017.
- Die Bewegungen am 29.09., 13.10. und 28.10.2008 sind echte Marktbewegungen. c) Lücke 12.–20.03.2009 (8 Tage).
- Wirkung im Vergleich mit EQQQ.MI (gleicher Fonds, sauber):
  - gegen SPY 150/164 statt 163/164, schlechtestes Fenster −6,82 (07/2008) statt −0,09 (08/2020);
  - gegen SXR8 129/130 statt 130/130, schlechtestes −0,95 (09/2014) statt +0,25, Rückschlag −35,9 % statt −21,4 %.
  - A/B (+10,54/+1,34) und das Urteil sind unberührt.
- d) 52 Ausschüttungen ab 2014, 4 je Jahr. 2014 sind es 5, weil die Termine verschoben sind (03.01. und 29.12.). Die Beträge sind identisch mit EQQQ.MI und gleich dem USD-Betrag von EQQQ.SW geteilt durch EURUSD.
- **Ausschüttungen vor 2014 fehlen.** EQQQ.SW zeigt vier Zahlungen 2013. Schätzung mit diesen vier: Median +0,16 Pp, Anteil unverändert. Für 2008–2012 ist nichts belegt (Invesco-Seite nicht erreichbar).
- e) +0,004/+0,002.

**EQQX** (EQQX.DE, zu jung): a) Sprungpaar 24.10.2025; sonst unauffällig. EQQS.L hat Datenfehler am Anfang (Rückschlag −99 %), A/B sind dort aber gleich.

**LYMS** (UST.PA): Gewählt wegen der längsten Historie. Der Name passt (Amundi Core Nasdaq-100 Swap UCITS ETF Acc), laut Amundi-Factsheet ist das der Pariser Ticker UST FP. LYMS.DE beginnt erst 2016.
- b/e2) 14.10.2008 +11,9 % (SPY −1,5 %) und 29.10.2008 +10,6 % (SPY −0,7 %): Das sind Tage im Oktober 2008 mit ±10 % Bewegung. Der Pariser Schluss liegt vor dem US-Schluss. Der 13.10.2008 (3,78, fast unverändert trotz +11 % in den USA) wirkt veraltet, der Sprung holt ihn nach. Der Kurs hat nur 2 Dezimalen bei ≈ 3,8 EUR. Einordnung: echt (Zeitversatz bzw. veralteter Vortag), kein Datenfehler, an keinem Fensterrand.
- 71 Kerzen ohne Schluss werden verworfen. d, e unauffällig.

**6AQQ** (ANX.PA): Beginn = Auflage 08.06.2010; a–e unauffällig.

**XNAS** (XNAS.DE, zu jung): unauffällig. XNAS.L führt 2021 GBP-Werte als USD (B +9,14) und ist unbrauchbar.

**QDVA** (QDVA.DE):
- e3) Rand gleich Vortag am **15.09.2021 (A-Ende = B-Start)**: Der Schluss ist gleich dem vom 14.09., vermutlich gab es keinen Handel. Das verschiebt die Bewegung eines Tages zwischen A und B. Die Kette A+B bleibt gleich; IUMO.L kommt auf A +3,24 / B −1,62, also gleiche Vorzeichen.
- 6 eingefrorene Läufe 2017. Sonst unauffällig.

**IS3R** (IS3R.DE):
- a) Sprungpaare 14.10., 20.10., 21.11. und 01.12.2014.
- b/e2) **Datenfehler:**
  - 22.10., 30.10. und 03.11.2014.
  - 08./11.05.2015: USD-Wert am 08.05. (27,62 zwischen 24,18 und 24,81, Verhältnis 1,14 ≈ EURUSD).
  - 05./06.06.2017.
- Wirkung: Das Monatsende Oktober 2014 ist ein USD-Wert. Das Fenster 2014-10 zählt deshalb fälschlich als „hinten“ (geschätzt 29/83 statt 28/83; IWMO.L 28/83). Rückschlag −34,3 % statt −26,8 % (IWMO.L). Urteil unberührt.

**XDEM** (XDEM.DE):
- a) Sprungpaare 30.09., 08.10., 31.10., 03.11.2014 und 24.10.2025.
- b/e2) Datenfehler: 25.09.2014 (USD-Werte 05.–24.09.2014), 21./23.10., 04./06.11.2014 und 05./06.06.2017.
- Wirkung: Rückschlag −39,3 % (Spitze 05.09.2014) statt −25,3 % (XDEM.SW). Fenster 28/84 wie XDEM.SW.
- e3) 1 Lauf 2017.

## 3. Factsheet-Stichproben (REGEL C9)

Unser Wert: `node rechnen.js --roh <ROH> --symbol <SYM> --stichtag <D> --waehrung <W>` (Feld j5.pa), gleiche Reihe wie im Urteil. Abweichung = unser − Anbieter (Pp p. a.); auffällig ab |0,30|. Alle Anbieterangaben sind NAV-Renditen; die Abweichung enthält deshalb den Zeitversatz Börsenschluss (Xetra/Paris/SIX/LSE) gegen NAV-Zeitpunkt an beiden Rändern.

| Fonds | Symbol | Stichtag | Art | Währung | Anbieter 5 J. p. a. | unser 5 J. p. a. | Abweichung | Quelle / Bemerkung |
|---|---|---|---|---|---|---|---|---|
| XDEW | XDEW.DE | 30.09.2026 | NAV | USD | 8,25 % | 8,17 % | −0,08 | [Quelle](https://etf.dws.com/en-gb/IE00BLNMYC90/) DWS-Produktseite, Tabelle "Discrete" (Jahresrenditen Sep-Sep auf Monatsend-NAV, USD): -14 / 13.07 / 28.19 / 7.37 / 11.07 %; 5-J.-Wert = Verkettung der fuenf Jahre |
| SP2Q | SP2Q.DE | 31.08.2026 | NAV | USD | 8,51 % | 8,42 % | −0,09 | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/IE00BNGJJT35-factsheet.pdf) Invesco-Factsheet (dt., Stand 31.08.2026, Kopie bei finanzfluss; etf.invesco.com leitet auf die US-Seite um): kumuliert 5 J. 50,45 % (NAV, USD) |
| QDVB | QDVB.DE | 30.09.2026 | NAV | USD | 12,08 % | 12,06 % | −0,02 | [Quelle](https://www.blackrock.com/uk/individual/products/285209/ishares-edge-msci-usa-quality-factor-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| UBUT | UBUT.DE | 31.08.2026 | NAV | USD | 12,16 % | 11,99 % | −0,18 | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/IE00BX7RRJ27-factsheet.pdf) UBS-Factsheet "Daten per Ende August 2026" (Kopie bei finanzfluss; ubs.com antwortet mit HTTP 403): Jahresrenditen Sep-Aug -19,00 / 25,43 / 27,85 / 8,32 / 26,16 % (USD), verkettet; zweite Notiz UQLTD.SW 12,03 % |
| IS3Q | IS3Q.DE | 30.09.2026 | NAV | USD | 10,75 % | 10,78 % | +0,03 | [Quelle](https://www.blackrock.com/uk/individual/products/270054/ishares-msci-world-quality-factor-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| XDEQ | XDEQ.DE | 30.09.2026 | NAV | USD | 10,78 % | 10,81 % | +0,03 | [Quelle](https://etf.dws.com/en-gb/IE00BL25JL35/) DWS-Produktseite, Tabelle "Discrete" (Jahresrenditen Sep-Sep auf Monatsend-NAV, USD): -20.81 / 24.58 / 35 / 8.73 / 15.21 %; 5-J.-Wert = Verkettung der fuenf Jahre |
| XMVU | XMVU.L | 30.09.2026 | NAV | USD | 7,21 % | 7,15 % | −0,07 | [Quelle](https://etf.dws.com/en-gb/IE00BDB7J586/) DWS-Produktseite, Tabelle "Discrete" (Jahresrenditen Sep-Sep auf Monatsend-NAV, USD): -9.11 / 11.29 / 28.18 / 5.49 / 3.58 %; 5-J.-Wert = Verkettung der fuenf Jahre; ausschuettende Klasse, NAV-Gesamtertrag |
| MIVU | MIVU.PA | – | – | – | – | – | – | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/LU1589349734-factsheet.pdf) nicht ausgelesen: Amundi-Factsheet-Kopie geladen (Text nur ueber die Seitenbilder lesbar), aus Aufwandsgruenden beim zu jungen Fonds ausgelassen |
| SPY1 | SPY1.DE | 31.08.2026 | NAV | USD | 4,86 % | 4,79 % | −0,07 | [Quelle](https://www.ssga.com/library-content/products/factsheets/etfs/emea/israel/factsheet-is-en_gb-spy1-gy.pdf) State-Street-Factsheet 31.08.2026, Annualised Returns, Fund Net (NAV, USD); zweite Notiz LOWV.L 5,03 % |
| IBCK | IBCK.DE | 30.09.2026 | NAV | USD | 9,23 % | 9,23 % | ±0,00 | [Quelle](https://www.blackrock.com/uk/individual/products/251383/ishares-sp-500-minimum-volatility-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| UBUR | UBUR.DE | – | – | – | – | – | – | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/IE00BX7RQY03-factsheet.pdf) nicht ausgelesen: ubs.com HTTP 403; Factsheet-Kopie bei finanzfluss vorhanden (nur ueber Seitenbilder lesbar), aus Aufwandsgruenden ausgelassen |
| IQQ0 | IQQ0.DE | 30.09.2026 | NAV | USD | 5,56 % | 5,58 % | +0,02 | [Quelle](https://www.blackrock.com/uk/individual/products/251382/ishares-msci-world-minimum-volatility-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| XDEB | XDEB.DE | 30.09.2026 | NAV | USD | 5,62 % | 5,66 % | +0,04 | [Quelle](https://etf.dws.com/en-gb/IE00BL25JN58/) DWS-Produktseite, Tabelle "Discrete" (Jahresrenditen Sep-Sep auf Monatsend-NAV, USD): -12.34 / 10.76 / 23.43 / 6.86 / 2.62 %; 5-J.-Wert = Verkettung der fuenf Jahre |
| QDVI | QDVI.DE | 30.09.2026 | NAV | USD | 17,03 % | 16,98 % | −0,05 | [Quelle](https://www.blackrock.com/uk/individual/products/285207/ishares-edge-msci-usa-value-factor-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| UBU5 | UBU5.DE | 31.08.2026 | NAV | USD | 10,03 % | 9,89 % | −0,14 | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/IE00B78JSG98-factsheet.pdf) UBS-Factsheet "Daten per Ende August 2026" (Kopie bei finanzfluss; ubs.com HTTP 403): Jahresrenditen Sep-Aug -5,20 / 6,87 / 22,08 / 7,87 / 20,89 % (USD), verkettet; zweite Notiz USVUSY.SW 10,04 % |
| ZPRU | ZPRU.DE | 31.08.2026 | NAV | USD | 13,14 % | 12,97 % | −0,17 | [Quelle](https://www.ssga.com/library-content/products/factsheets/etfs/emea/israel/factsheet-is-en_gb-zpru-gy.pdf) State-Street-Factsheet 31.08.2026, Annualised Returns, Fund Net (NAV, USD); zweite Notiz USVL.L 13,23 % (+0,09). Factsheet: bis 11.07.2018 MSCI USA Value Weighted Index |
| UBUS | UBUS.DE | – | – | – | – | – | – | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/IE00BX7RR706-factsheet.pdf) nicht ausgelesen: ubs.com HTTP 403; Factsheet-Kopie bei finanzfluss vorhanden (nur ueber Seitenbilder lesbar), aus Aufwandsgruenden ausgelassen |
| IS3S | IS3S.DE | 30.09.2026 | NAV | USD | 17,37 % | 17,43 % | +0,06 | [Quelle](https://www.blackrock.com/uk/individual/products/270048/ishares-msci-world-value-factor-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| XDEV | XDEV.DE | 30.09.2026 | NAV | USD | 17,55 % | 17,60 % | +0,06 | [Quelle](https://etf.dws.com/en-gb/IE00BL25JM42/) DWS-Produktseite, Tabelle "Discrete" (Jahresrenditen Sep-Sep auf Monatsend-NAV, USD): -19.22 / 28.33 / 19.32 / 21.61 / 49.18 %; 5-J.-Wert = Verkettung der fuenf Jahre |
| MWOT | MWOW.DE | – | – | – | – | – | – | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/IE0005E8B9S4-factsheet.pdf) nicht vergleichbar: unsere Reihe beginnt 07.10.2024 (kein 5-J.-Wert); Factsheet nicht ausgelesen |
| SXRV | CSNDX.SW | 30.09.2026 | NAV | USD | 16,07 % | 16,04 % | −0,03 | [Quelle](https://www.blackrock.com/uk/individual/products/253741/ishares-nasdaq-100-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| EXXT | EXXT.DE | 30.09.2026 | NAV | USD | 15,94 % | 15,91 % | −0,03 | [Quelle](https://www.blackrock.com/at/privatanleger/produkte/251896/) iShares-Seite (AT), Tabelle "Annualisiert" (Gesamtrendite NAV, USD), Stand 30.09.2026; ishares.com/de zeigt die Tabelle nicht |
| EQQQ | EQQQ.DE | 31.08.2026 | NAV | USD | 14,00 % | 13,81 % | −0,19 | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/IE0032077012-factsheet.pdf) Invesco-Factsheet (dt., Stand 31.08.2026, Kopie bei finanzfluss): kumuliert 5 J. 92,56 % (NAV, USD); zweite Notiz EQQQ.SW 13,94 % (-0,06). Abstand vor allem Zeitversatz Xetra-Schluss gegen NAV am 31.08.2021/2026 |
| EQQX | EQQX.DE | 31.08.2026 | NAV | USD | 14,22 % | 14,02 % | −0,20 | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/IE00BNRQM384-factsheet.pdf) Invesco-Factsheet (dt., Stand 31.08.2026, Kopie bei finanzfluss): kumuliert 5 J. 94,38 % (NAV, USD); Zeitversatz wie EQQQ |
| LYMS | UST.PA | 31.08.2026 | NAV | USD | 14,18 % | 14,01 % | −0,17 | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/LU1829221024-factsheet.pdf) Amundi-Factsheet 31.08.2026 (Kopie bei finanzfluss): kumuliert 5 J. (31.08.2021-31.08.2026) 94,04 %, Anteilsklassenwaehrung USD; LYMS.DE 13,98 %. Zeitversatz Paris-Schluss gegen NAV |
| 6AQQ | ANX.PA | 31.08.2026 | NAV | EUR | 14,53 % | 14,45 % | −0,08 | [Quelle](https://assets.finanzfluss.de/hippoverse/documents/LU1681038243-factsheet.pdf) Amundi-Factsheet 31.08.2026 (Kopie bei finanzfluss): kumuliert 5 J. 97,02 % (NAV, EUR-Klasse); 6AQQ.DE 14,43 % |
| XNAS | XNAS.DE | 30.09.2026 | NAV | USD | 16,19 % | 16,17 % | −0,03 | [Quelle](https://etf.dws.com/en-gb/IE00BMFKG444/) DWS-Produktseite, Tabelle "Discrete" (Jahresrenditen Sep-Sep auf Monatsend-NAV, USD): -24.96 / 34.86 / 37.02 / 23.55 / 23.63 %; 5-J.-Wert = Verkettung der fuenf Jahre |
| QDVA | QDVA.DE | 30.09.2026 | NAV | USD | 12,95 % | 12,82 % | −0,13 | [Quelle](https://www.blackrock.com/uk/individual/products/285208/ishares-edge-msci-usa-momentum-factor-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| IS3R | IS3R.DE | 30.09.2026 | NAV | USD | 13,25 % | 13,20 % | −0,05 | [Quelle](https://www.blackrock.com/uk/individual/products/270051/ishares-msci-world-momentum-factor-ucits-etf) iShares-Produktseite, Tabelle "Average annual returns" (Total Return NAV, USD), Stand 30.09.2026 |
| XDEM | XDEM.DE | 30.09.2026 | NAV | USD | 13,31 % | 13,24 % | −0,07 | [Quelle](https://etf.dws.com/en-gb/IE00BL25JP72/) DWS-Produktseite, Tabelle "Discrete" (Jahresrenditen Sep-Sep auf Monatsend-NAV, USD): -23.11 / 12.57 / 45.42 / 20.38 / 23.26 %; 5-J.-Wert = Verkettung der fuenf Jahre |

26 von 30 Fonds verglichen; Spanne der Abweichungen −0,20 bis +0,06 Pp p. a.; auffällig (|≥ 0,30|): 0.

## 4. Befunde für den Projektleiter

Kein Befund ändert ein Urteil. Bei allen Fonds mit berechenbaren Fenstern sind A und B frei von nachgewiesenen Datenfehlern, gemessen am Vergleich mit einer zweiten Notiz und an den Factsheets.

1. **Yahoo führt in EUR-Reihen USD-Werte** (Kurs × EURUSD). Das betrifft Anfangsabschnitte und Einzeltage, die K1b nicht kürzt, weil kein eingefrorener Lauf vorausgeht. Nachweis: Der Kurs verhält sich zum Nachbartag bzw. zur sauberen Zweitnotiz wie der EZB-Kurs EURUSD des Tages.
   - Betroffen sind in g4: IS3Q, XDEQ, MIVU, SPY1, IBCK, IQQ0, XDEB, UBU5, ZPRU, IS3S, XDEV, EXXT, EQQQ, IS3R, XDEM.
   - Einzeltage: 05.06.2017 in 11 Reihen, 24.10.2025 in 10 Reihen (dort als Sprungpaar entfernt).
   - Wirkung (offiziell → saubere Zweitnotiz):
     - Rückschlag gegen den Maßstab bis 14 Pp zu tief, z. B. XDEM −39,3 → −25,3 %, XDEQ −45,5 → −29,4 %, IS3Q −43,7 → −30,3 %, IBCK −51,0 → −39,1 %.
     - Schlechtestes Fenster verfälscht bei IS3Q (−7,09 → −3,94), IBCK (−8,00 → −5,92), IQQ0, UBU5, ZPRU und EQQQ (−6,82 → −0,09; gegen SXR8 −0,95 → +0,25).
     - Fensteranteil: EQQQ gegen SPY 150/164 → 163/164 (EQQQ.MI), gegen SXR8 129/130 → 130/130; EXXT 152 → ≈ 153/164; IS3R 28 → ≈ 29/83; IBCK gegen SXR8 17 → 15/106.
   - Ob korrigiert wird (z. B. als benannte Ergänzung: USD-Tage durch Kurs/EURUSD ersetzen oder auf die saubere Zweitnotiz wechseln), entscheidest du. Die Wirkungsschätzung steht in `kratz-g4/bereinigt-g4.json` und `kratz-g4/boersen-voll-g4.json`.
2. **Fehlende Ausschüttungen vor 2014** (Yahoo-Ereignishistorie beginnt bei EUR-Notizen 2014):
   - **EXXT**, nachgewiesen über die Anbieterhistorie (iShares, https://www.blackrock.com/at/privatanleger/produkte/251896/ishares-nasdaq100-ucits-etf-de-fund/1509774438714.ajax?tab=distributions&fileType=json&subtab=table). Es fehlen 8 Zahlungen: 16.06.2008 0,0398; 15.06.2009 0,0224; 15.06.2010 0,0250; 15.06.2011 0,0356; 15.06.2012 0,1733; 17.06.2013 0,222962; 16.09.2013 0,038869; 16.12.2013 0,040188 USD (in EUR mit dem EZB-Kurs am Ex-Tag). Wirkung: A und B 0,00 Pp p. a. (liegen nach 2014); rollierend 152 → 153/164, Median +0,23 Pp. Ab 2014 stimmen alle 46 Zahlungen mit dem Anbieter überein.
   - **EQQQ**: Die 4 Zahlungen 2013 fehlen an EQQQ.DE, an EQQQ.SW sind sie vorhanden (02.01., 27.03., 03.07., 02.10.2013). Wirkung: Median +0,16 Pp, sonst nichts. Für 2008–2012 gibt es keinen Beleg; die Invesco-Seite leitet auf die US-Seite um.
   - **UBU5**: Die 2 Zahlungen 2013 (31.01., 31.07.2013) sind an USVUSY.SW vorhanden. Wirkung: bestes Fenster +0,46 Pp, Median 0.
   - Nachauftrag „benannte Ergänzungen“: Die Datei `ergaenzungen-g4.json` enthält nur die 8 belegten EXXT-Zahlungen (art „fehlt“). EQQQ, XMVU und die vier UBS-Fonds sind beim Anbieter „nicht prüfbar“: Invesco zeigt nur die jüngste Zahlung, DWS keine Historie, ubs.com antwortet mit HTTP 403. Die 23 thesaurierenden Reihen führen bei Yahoo keine Ausschüttung.
3. **MWOT (Amundi Russell 1000 Growth)**: Keiner der vier Kandidaten trägt die Historie vor Oktober 2024 (Verschmelzung vom Lyxor-Vorgänger FR0011119171 am 09.07.2024). „Zu jung“ ist damit eine Datenlücke bei Yahoo, kein Merkmal des Fonds (Auflage laut fonds.json 27.10.2011). Eine Kandidatenreihe des Vorgängers fehlt in fonds.json.
4. **Zweitnotizen mit Währungsfehlern** (nicht gewählt, nur für den Fall eines Wechsels):
   - XDEW.MI: USD-Werte als EUR bis mindestens 2017.
   - IUQA.L (bis Anfang 2017) und XNAS.L (2021): GBP-Werte als USD.
   - UC95.L: GBP und GBp gemischt.
   - XDEW.SW: eingefrorene, gerundete CHF-Kurse.
5. **SXRV wird über CSNDX.SW gerechnet** (SIX, USD; C6, weil SXRV.DE erst 101 Tage nach Auflage beginnt). Die Notiz ist dünn gehandelt: Lauf 13.–31.01.2023 eingefroren, Lücke 23.12.2025–05.01.2026. SXRV.DE kommt auf A +10,50, B +1,32, 129/136 gegen SPY (Datenfehler 10/2010) bzw. 130/130 gegen SXR8. Das Urteil ist in beiden Notizen gleich.
6. **QDVA**: Am 15.09.2021 (A-Ende/B-Start) ist der Schluss gleich dem Vortag. Das verschiebt einen Tag Bewegung zwischen A und B; das Vorzeichen ändert sich nicht (IUMO.L: A +3,24, B −1,62).
7. **UBUR adjclose +0,191 Pp p. a. in A**: Die Ursache ist Yahoos adjclose, das die Ausschüttung vom 31.07.2017 auslässt. Der Hauptweg ist richtig. **UBUS**: Februar 2024 ohne Ausschüttung; das ist plausibel echt (Kursverhalten, justETF), bei UBS aber nicht prüfbar (HTTP 403).
8. **Verdacht auf Fehler im Rechner: keiner.** Eine Anmerkung: `brueche()` vergleicht Tagesrenditen einer EUR-Reihe mit SPY in USD, ohne Währungsbereinigung. Bei der 8-Pp-Schwelle ist das unschädlich, fällt aber in Phasen mit großen EURUSD-Sprüngen ins Gewicht.

**Ergebnis g4:** Verlässlich vorn sind gegen SPY und gegen SXR8 nur die fünf Nasdaq-100-Fonds mit Historie vor 2017: SXRV, EXXT, EQQQ, LYMS und 6AQQ (Klasse „gleicher Index“ wie QQQ, in Deutschland handelbar). Alle Faktorfonds (Gleichgewicht, Qualität, Niedrige Schwankung, Value, Momentum; US und Welt) sind nicht verlässlich vorn. Zu jung sind SP2Q, MIVU, MWOT, EQQX und XNAS, wobei EQQX und XNAS in allen ihren 5 bzw. 8 Fenstern vorn liegen.
