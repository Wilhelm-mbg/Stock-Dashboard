# ERGEBNIS — Faktor-ETF-Realitätsprobe: Hat ein käuflicher Faktor-/Smart-Beta-ETF über fünf Jahre verlässlich den S&P 500 geschlagen?

Kennung `faktor-etf-realitaet-2026-10/v1`. Regel und Fondsliste gesiegelt vor dem ersten Kurs (`REGEL.md`, Commit `7218e4d`), Rechner `b0cce7c`; Korrekturen nach dem Siegel unten (Abschnitt 6). Datenende 15.09.2026. Beschreibende Zahlen nach vorab festgelegter Regel — **keine Anlageberatung**.

## Kurzfassung

1. Nach der vorab festgelegten Regel (≥ 80 % der rollierenden 5-Jahres-Fenster vor SPY **und** vorn in A 2017–21 **und** in B 2021–26) sind von 103 Fonds 10 „verlässlich vorn": Wachstum 9 von 14, Momentum 1 von 7 (nur SPMO), **alle übrigen Faktoren 0 von 82** (Gleichgewicht, Qualität, niedrige Schwankung, Value, Dividende, Aktionärsrendite, kleine/mittlere Werte, Multifaktor, Moat, Free Cashflow, Fundamental-/Umsatzgewichtung).
2. Von den 27 verlangten US-ETFs: nur **QQQ und SPMO** (Nasdaq-100 bzw. S&P 500 Momentum). Zusatz: IVW, SCHG, MGK (alle Wachstum). In Deutschland kaufbar (UCITS, 58 Fonds): nur die fünf **Nasdaq-100-Fonds SXRV, EXXT, EQQQ, LYMS, 6AQQ** — gegen SPY und gegen den UCITS-S&P-500 SXR8.
3. US-ETFs sind für Privatanleger in der EU nicht kaufbar (kein Basisinformationsblatt). Für SPMO gibt es kein UCITS-Gegenstück; der MSCI-USA-Momentum-UCITS QDVA lag in 7 von 59 Fenstern vorn.
4. Die Regel verlangt keinen Mindestabstand: auch die reinen S&P-500-Kontrollen **IVV und VOO** bestehen sie (85 % bzw. 99 % der Fenster, Median +0,04 / +0,06 Pp p. a.) — allein, weil sie billiger sind als SPY. „Verlässlich vorn" heißt also nicht „deutlich vorn".
5. Nasdaq-100-UCITS: in A +9,9 bis +10,5 Pp p. a., in B nur +1,2 bis +1,5; ihre Yahoo-Historie beginnt erst 2008/2010, also mitten in der Technologie-Ära. QQQ seit 1999 zeigt den Rest: schlechtestes Fenster −17,7 Pp p. a. (Start 02/2000), Rückschlag gegen SPY −70 % (10.03.2000–05.09.2002), 1 von 5 nicht überlappenden Fünfjahresblöcken hinten.
6. Fünf Jahre Vorsprung sind wenige unabhängige Beobachtungen: SPMO hat zwei nicht überlappende Blöcke, die Nasdaq-UCITS drei. Ein Anteil von 80 % aus überlappenden Fenstern ist kein Beleg für die Zukunft.
7. Überlebensverzerrung: 156 seit 2010 geschlossene Faktor-/Smart-Beta-ETFs belegt (123 US, 33 UCITS), meist wegen zu wenig Vermögen nach schwacher Entwicklung — die gezählten Überlebenden sind im Schnitt zu gut.
8. Prüfung: Factsheets in 98 Stichproben −0,22 bis +0,31 Pp p. a. (Median −0,005); zweiter, unabhängiger Rechner trifft alle 157 verglichenen Größen; 161 Yahoo-Ausschüttungsfehler mit Anbieterbeleg nachgetragen.

## 1. Zählung

| Art | Fonds | verlässlich vorn | nicht verlässlich vorn | zu jung | verlässlich vorn sind |
|---|---|---|---|---|---|
| Vom Auftrag verlangt (US) | 27 | 2 | 24 | 1 | QQQ, SPMO |
| Zusatz (US) | 18 | 3 | 15 | 0 | IVW, SCHG, MGK |
| UCITS (in DE kaufbar) | 58 | 5 | 41 | 12 | SXRV, EXXT, EQQQ, LYMS, 6AQQ |
| Kontrollen | 4 | 2 | 2 | 0 | IVV, VOO |

Kontrollen haben kein Urteil im Sinne der Frage (REGEL A1); ihre Zeile zeigt, was die Regel misst.

## 2. Alle Fonds

Abstand = Rendite p. a. Fonds − Rendite p. a. Maßstab in Prozentpunkten (Gesamtertrag mit Ausschüttungen, nach Fondskosten). Fenster = alle rollierenden 5-Jahres-Fenster mit Monatsstart ab dem ersten Monat beider Reihen bis Ende August 2026. Rückschlag = größter Fall der Reihe Fonds/Maßstab gegenüber ihrem Höchststand. UCITS: gegen SPY in USD (EZB-Kurs) und gegen SXR8 in EUR; „verlässlich vorn" verlangt beide (REGEL A1/C6).

#### US-ETFs gegen SPY (Auftrag, Zusatz, Kontrollen)

| Art | Gruppe | Fonds | Daten ab | A Abstand p. a. | B Abstand p. a. | 5-J.-Fenster vor SPY | Median p. a. | schlechtester p. a. (Start) | größter Rückschlag gg. SPY | Urteil |
|---|---|---|---|---|---|---|---|---|---|---|
| Auftrag | Gleichgewicht | **RSP** | 01.05.2003 | −2,85 | −4,11 | 99/220 (45 %) | −0,48 | −5,59 (05/2021) | −30,7 % | nicht verlässlich vorn |
| Auftrag | Qualität | **QUAL** | 18.07.2013 | +0,02 | −1,75 | 29/98 (30 %) | −0,46 | −1,87 (05/2021) | −13,0 % | nicht verlässlich vorn |
| Auftrag | Qualität | **SPHQ** | 06.12.2005 | −1,00 | −0,36 | 101/189 (53 %) | +0,07 | −6,12 (01/2006) | −33,4 % | nicht verlässlich vorn |
| Auftrag | Niedrige Schwankung | **USMV** | 20.10.2011 | −3,88 | −5,51 | 24/119 (20 %) | −2,50 | −7,11 (10/2020) | −42,2 % | nicht verlässlich vorn |
| Auftrag | Niedrige Schwankung | **SPLV** | 05.05.2011 | −6,09 | −7,41 | 18/124 (15 %) | −3,01 | −9,36 (06/2019) | −51,9 % | nicht verlässlich vorn |
| Auftrag | Multifaktor | **LRGF** | 30.04.2015 | −4,51 | +0,90 | 13/77 (17 %) | −2,97 | −4,77 (11/2016) | −21,6 % | nicht verlässlich vorn |
| Auftrag | Multifaktor | **GSLC** | 21.09.2015 | +0,14 | −1,23 | 1/72 (1 %) | −0,63 | −1,34 (06/2021) | −9,3 % | nicht verlässlich vorn |
| Auftrag | Moat | **MOAT** | 25.04.2012 | +1,18 | −3,69 | 79/113 (70 %) | +0,62 | −5,59 (05/2021) | −27,6 % | nicht verlässlich vorn |
| Auftrag | Free Cashflow | **COWZ** | 22.12.2016 | −2,33 | −0,68 | 47/57 (82 %) | +1,47 | −3,42 (06/2021) | −32,3 % | nicht verlässlich vorn |
| Auftrag | Value | **VLUE** | 18.04.2013 | −6,65 | +4,52 | 5/101 (5 %) | −4,59 | −8,23 (12/2019) | −41,3 % | nicht verlässlich vorn |
| Auftrag | Value | **IWD** | 26.05.2000 | −7,47 | −0,89 | 56/256 (22 %) | −1,41 | −7,58 (11/2016) | −45,1 % | nicht verlässlich vorn |
| Auftrag | Value | **RPV** | 07.03.2006 | −9,52 | −0,14 | 75/186 (40 %) | −0,97 | −11,47 (08/2015) | −48,0 % | nicht verlässlich vorn |
| Auftrag | Wachstum | **IWF** | 26.05.2000 | +7,33 | −1,18 | 202/256 (79 %) | +1,39 | −8,05 (06/2000) | −39,7 % | nicht verlässlich vorn |
| Auftrag | Wachstum | **QQQ** | 10.03.1999 | +10,93 | +1,34 | 228/270 (84 %) | +4,12 | −17,72 (02/2000) | −70,3 % | verlässlich vorn |
| Auftrag | Momentum | **MTUM** | 18.04.2013 | +3,97 | −0,86 | 50/101 (50 %) | −0,13 | −5,33 (05/2018) | −29,8 % | nicht verlässlich vorn |
| Auftrag | Momentum | **SPMO** | 12.10.2015 | +3,29 | +6,66 | 61/71 (86 %) | +2,09 | −2,36 (07/2018) | −19,4 % | verlässlich vorn |
| Auftrag | Momentum | **QMOM** | 02.12.2015 | −0,61 | −4,82 | 21/69 (30 %) | −1,60 | −10,72 (01/2021) | −46,6 % | nicht verlässlich vorn |
| Auftrag | Momentum | **PDP** | 01.03.2007 | +0,92 | −5,38 | 41/174 (24 %) | −1,60 | −8,26 (12/2020) | −37,0 % | nicht verlässlich vorn |
| Auftrag | Dividende | **SCHD** | 20.10.2011 | −1,74 | −2,62 | 16/119 (13 %) | −0,91 | −6,01 (10/2020) | −38,0 % | nicht verlässlich vorn |
| Auftrag | Dividende | **VIG** | 02.05.2006 | −1,41 | −2,39 | 46/184 (25 %) | −1,49 | −3,89 (10/2020) | −31,2 % | nicht verlässlich vorn |
| Auftrag | Dividende | **DGRO** | 12.06.2014 | −1,98 | −1,67 | 18/87 (21 %) | −1,36 | −3,99 (12/2019) | −22,6 % | nicht verlässlich vorn |
| Auftrag | Dividende | **VYM** | 16.11.2006 | −7,18 | −0,62 | 55/178 (31 %) | −1,22 | −6,92 (11/2016) | −36,4 % | nicht verlässlich vorn |
| Auftrag | Aktionärsrendite | **PKW** | 20.12.2006 | −2,82 | −1,07 | 80/177 (45 %) | −0,29 | −6,33 (08/2015) | −28,3 % | nicht verlässlich vorn |
| Auftrag | Aktionärsrendite | **SYLD** | 14.05.2013 | −1,32 | −3,10 | 51/100 (51 %) | +0,11 | −8,30 (03/2015) | −38,1 % | nicht verlässlich vorn |
| Auftrag | Kleine Werte | **IJR** | 26.05.2000 | −5,98 | −5,86 | 147/256 (57 %) | +0,93 | −8,17 (05/2021) | −45,7 % | nicht verlässlich vorn |
| Auftrag | Kleine Werte | **IWM** | 26.05.2000 | −5,38 | −6,09 | 117/256 (46 %) | −0,53 | −9,13 (02/2021) | −49,2 % | nicht verlässlich vorn |
| Auftrag | Kleine Werte | **AVUV** | 26.09.2019 | – | −0,03 | 13/24 (54 %) | +0,49 | −3,07 (05/2021) | −35,0 % | nicht beurteilbar (zu jung) |
| Zusatz | Fundamentalgewichtung | **PRF** | 20.12.2005 | −4,78 | +0,83 | 62/189 (33 %) | −0,68 | −5,22 (08/2015) | −24,9 % | nicht verlässlich vorn |
| Zusatz | Umsatzgewichtung | **RWL** | 07.03.2008 | −3,72 | +1,34 | 80/162 (49 %) | −0,10 | −4,55 (08/2015) | −20,5 % | nicht verlässlich vorn |
| Zusatz | Multifaktor | **QUS** | 16.04.2015 | −0,98 | −1,85 | 3/77 (4 %) | −1,11 | −2,68 (05/2021) | −17,6 % | nicht verlässlich vorn |
| Zusatz | Value | **IVE** | 26.05.2000 | −6,85 | −1,11 | 45/256 (18 %) | −1,62 | −7,01 (11/2016) | −40,5 % | nicht verlässlich vorn |
| Zusatz | Value | **VTV** | 30.01.2004 | −6,17 | −0,14 | 19/212 (9 %) | −1,28 | −6,18 (11/2016) | −35,6 % | nicht verlässlich vorn |
| Zusatz | Wachstum | **IVW** | 26.05.2000 | +5,68 | +0,14 | 208/256 (81 %) | +1,00 | −5,34 (06/2000) | −29,5 % | verlässlich vorn |
| Zusatz | Wachstum | **VUG** | 30.01.2004 | +7,19 | −0,68 | 197/212 (93 %) | +1,52 | −0,70 (02/2021) | −21,7 % | nicht verlässlich vorn |
| Zusatz | Wachstum | **SCHG** | 04.01.2010 | +7,51 | +0,36 | 137/140 (98 %) | +2,07 | −0,15 (06/2011) | −20,8 % | verlässlich vorn |
| Zusatz | Wachstum | **MGK** | 27.12.2007 | +8,08 | +0,38 | 161/165 (98 %) | +1,66 | −0,52 (11/2011) | −23,0 % | verlässlich vorn |
| Zusatz | Dividende | **NOBL** | 10.10.2013 | −3,32 | −6,43 | 11/95 (12 %) | −2,60 | −8,79 (05/2021) | −43,0 % | nicht verlässlich vorn |
| Zusatz | Dividende | **SDY** | 15.11.2005 | −6,70 | −5,04 | 65/190 (34 %) | −0,98 | −7,71 (05/2021) | −44,4 % | nicht verlässlich vorn |
| Zusatz | Dividende | **DVY** | 07.11.2003 | −7,90 | −2,14 | 39/214 (18 %) | −1,97 | −8,25 (11/2016) | −44,6 % | nicht verlässlich vorn |
| Zusatz | Dividende | **HDV** | 31.03.2011 | −10,65 | +0,06 | 6/126 (5 %) | −4,05 | −10,58 (11/2016) | −50,6 % | nicht verlässlich vorn |
| Zusatz | Dividende | **SPHD** | 26.10.2012 | −11,30 | −5,05 | 9/107 (8 %) | −5,42 | −11,78 (11/2016) | −54,8 % | nicht verlässlich vorn |
| Zusatz | Dividende | **DGRW** | 22.05.2013 | −1,55 | −0,86 | 40/100 (40 %) | −0,26 | −2,13 (10/2020) | −18,6 % | nicht verlässlich vorn |
| Zusatz | Mittlere Werte | **IJH** | 26.05.2000 | −5,31 | −4,71 | 132/256 (52 %) | +0,14 | −6,26 (08/2015) | −39,7 % | nicht verlässlich vorn |
| Zusatz | Kleine Werte | **VBR** | 30.01.2004 | −8,18 | −3,31 | 86/212 (41 %) | −0,92 | −9,48 (08/2015) | −43,2 % | nicht verlässlich vorn |
| Zusatz | Kleine Werte | **IJS** | 28.07.2000 | −8,55 | −4,82 | 125/254 (49 %) | −0,04 | −9,21 (09/2015) | −50,6 % | nicht verlässlich vorn |
| Kontrolle | Kontrolle | **IVV** | 19.05.2000 | +0,06 | +0,07 | 218/256 (85 %) | +0,04 | −0,09 (09/2008) | −4,2 % | verlässlich vorn |
| Kontrolle | Kontrolle | **VOO** | 09.09.2010 | +0,07 | +0,06 | 131/132 (99 %) | +0,06 | −0,00 (03/2018) | −1,6 % | verlässlich vorn |

#### UCITS gegen SPY (in USD) und gegen SXR8 (in EUR)

| Gruppe | Fonds | ISIN | Symbol | Daten ab | gg. SPY A | gg. SPY B | gg. SPY Fenster vorn | gg. SXR8 A | gg. SXR8 B | gg. SXR8 Fenster vorn | gg. SXR8 Median | Rückschlag gg. SXR8 | Urteil |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Gleichgewicht | **XDEW** | IE00BLNMYC90 | XDEW.DE | 15.08.2014 | −3,26 | −4,35 | 0/85 (0 %) | −2,90 | −4,28 | 0/85 (0 %) | −2,61 | −32,1 % | nicht verlässlich vorn |
| Gleichgewicht | **SP2Q** | IE00BNGJJT35 | SP2Q.DE | 09.04.2021 | – | −4,34 | 0/5 (0 %) | – | −4,27 | 0/5 (0 %) | −4,40 | −26,8 % | nicht beurteilbar (zu jung) |
| Qualität | **QDVB** | IE00BD1F4L37 | QDVB.DE | 24.10.2016 | −0,36 | −1,91 | 2/59 (3 %) | −0,08 | −1,84 | 6/59 (10 %) | −0,78 | −16,8 % | nicht verlässlich vorn |
| Qualität | **UBUT** | IE00BX7RRJ27 | UBUT.DE | 22.09.2015 | +3,35 | −0,63 | 50/72 (69 %) | +3,52 | −0,55 | 52/72 (72 %) | +1,38 | −12,5 % | nicht verlässlich vorn |
| Qualität | **IS3Q** | IE00BP3QZ601 | IS3Q.DE | 06.10.2014 | −1,47 | −3,17 | 0/83 (0 %) | −1,16 | −3,10 | 0/83 (0 %) | −2,38 | −26,3 % | nicht verlässlich vorn |
| Qualität | **XDEQ** | IE00BL25JL35 | XDEQ.DE | 11.09.2014 | −1,38 | −3,16 | 0/84 (0 %) | −1,08 | −3,09 | 0/84 (0 %) | −2,14 | −26,8 % | nicht verlässlich vorn |
| Niedrige Schwankung | **XMVU** | IE00BDB7J586 | XMVU.L | 08.11.2016 | −4,32 | −5,73 | 0/58 (0 %) | −3,94 | −5,68 | 0/58 (0 %) | −4,81 | −42,2 % | nicht verlässlich vorn |
| Niedrige Schwankung | **MIVU** | LU1589349734 | MIVU.PA | 25.04.2017 | – | −5,81 | 0/53 (0 %) | – | −5,75 | 0/53 (0 %) | −5,57 | −44,2 % | nicht beurteilbar (zu jung) |
| Niedrige Schwankung | **SPY1** | IE00B802KR88 | SPY1.DE | 04.10.2012 | −6,51 | −7,85 | 9/107 (8 %) | −6,07 | −7,80 | 13/107 (12 %) | −4,47 | −53,1 % | nicht verlässlich vorn |
| Niedrige Schwankung | **IBCK** | IE00B6SPMN59 | IBCK.DE | 30.11.2012 | −4,40 | −4,02 | 8/106 (8 %) | −4,02 | −3,96 | 17/106 (16 %) | −2,74 | −37,6 % | nicht verlässlich vorn |
| Niedrige Schwankung | **UBUR** | IE00BX7RQY03 | UBUR.DE | 23.09.2015 | −4,62 | −6,96 | 0/72 (0 %) | −4,23 | −6,90 | 0/72 (0 %) | −4,43 | −45,0 % | nicht verlässlich vorn |
| Niedrige Schwankung | **IQQ0** | IE00B8FHGS14 | IQQ0.DE | 30.11.2012 | −7,02 | −7,34 | 0/106 (0 %) | −6,56 | −7,29 | 0/106 (0 %) | −6,09 | −55,9 % | nicht verlässlich vorn |
| Niedrige Schwankung | **XDEB** | IE00BL25JN58 | XDEB.DE | 05.09.2014 | −7,03 | −7,28 | 0/84 (0 %) | −6,57 | −7,23 | 0/84 (0 %) | −6,99 | −52,8 % | nicht verlässlich vorn |
| Value | **QDVI** | IE00BD1F4M44 | QDVI.DE | 24.10.2016 | −7,06 | +4,15 | 4/59 (7 %) | −6,60 | +4,25 | 4/59 (7 %) | −5,39 | −40,3 % | nicht verlässlich vorn |
| Value | **UBU5** | IE00B78JSG98 | UBU5.DE | 11.04.2012 | −7,83 | −2,42 | 0/113 (0 %) | −7,36 | −2,34 | 0/113 (0 %) | −3,92 | −41,4 % | nicht verlässlich vorn |
| Value | **ZPRU** | IE00BSPLC520 | ZPRU.DE | 18.02.2015 | −6,83 | +0,92 | 1/79 (1 %) | −6,38 | +1,01 | 1/79 (1 %) | −4,85 | −42,5 % | nicht verlässlich vorn |
| Value | **UBUS** | IE00BX7RR706 | UBUS.DE | 23.09.2015 | −3,81 | −4,24 | 1/72 (1 %) | −3,44 | −4,18 | 3/72 (4 %) | −2,34 | −32,5 % | nicht verlässlich vorn |
| Value | **IS3S** | IE00BP3QZB59 | IS3S.DE | 06.10.2014 | −10,11 | +4,47 | 7/83 (8 %) | −9,57 | +4,58 | 7/83 (8 %) | −7,60 | −52,3 % | nicht verlässlich vorn |
| Value | **XDEV** | IE00BL25JM42 | XDEV.DE | 11.09.2014 | −10,15 | +4,67 | 7/84 (8 %) | −9,61 | +4,78 | 7/84 (8 %) | −7,64 | −51,3 % | nicht verlässlich vorn |
| Wachstum | **MWOT** | IE0005E8B9S4 | MWOW.DE | 07.10.2024 | – | – | – | – | – | – | – | −13,0 % | nicht beurteilbar (zu jung) |
| Wachstum | **SXRV** | IE00B53SZB19 | CSNDX.SW | 26.01.2010 | +10,40 | +1,33 | 139/140 (99 %) | +10,38 | +1,43 | 130/130 (100 %) | +4,97 | −21,7 % | verlässlich vorn |
| Wachstum | **EXXT** | DE000A0F5UF5 | EXXT.DE | 02.01.2008 | +10,34 | +1,19 | 163/164 (99 %) | +10,32 | +1,28 | 130/130 (100 %) | +4,88 | −21,2 % | verlässlich vorn |
| Wachstum | **EQQQ** | IE0032077012 | EQQQ.DE | 02.01.2008 | +10,54 | +1,34 | 163/164 (99 %) | +10,52 | +1,43 | 130/130 (100 %) | +5,07 | −21,0 % | verlässlich vorn |
| Wachstum | **EQQX** | IE00BNRQM384 | EQQX.DE | 14.04.2021 | – | +1,55 | 5/5 (100 %) | – | +1,65 | 5/5 (100 %) | +2,42 | −20,7 % | nicht beurteilbar (zu jung) |
| Wachstum | **LYMS** | LU1829221024 | UST.PA | 02.01.2008 | +9,88 | +1,52 | 164/164 (100 %) | +9,88 | +1,61 | 130/130 (100 %) | +4,43 | −20,7 % | verlässlich vorn |
| Wachstum | **6AQQ** | LU1681038243 | ANX.PA | 08.06.2010 | +10,51 | +1,50 | 135/135 (100 %) | +10,49 | +1,59 | 130/130 (100 %) | +5,16 | −20,9 % | verlässlich vorn |
| Wachstum | **XNAS** | IE00BMFKG444 | XNAS.DE | 27.01.2021 | – | +1,45 | 8/8 (100 %) | – | +1,55 | 8/8 (100 %) | +1,60 | −21,1 % | nicht beurteilbar (zu jung) |
| Momentum | **QDVA** | IE00BD1F4N50 | QDVA.DE | 24.10.2016 | +3,40 | −1,64 | 7/59 (12 %) | +3,58 | −1,56 | 7/59 (12 %) | −2,97 | −29,9 % | nicht verlässlich vorn |
| Momentum | **IS3R** | IE00BP3QZ825 | IS3R.DE | 06.10.2014 | +2,09 | −1,11 | 29/83 (35 %) | +2,30 | −1,03 | 30/83 (36 %) | −1,77 | −25,2 % | nicht verlässlich vorn |
| Momentum | **XDEM** | IE00BL25JP72 | XDEM.DE | 05.09.2014 | +2,31 | −1,05 | 27/84 (32 %) | +2,51 | −0,96 | 32/84 (38 %) | −1,64 | −25,0 % | nicht verlässlich vorn |
| Dividende/Aktionärsrendite | **SPYD** | IE00B6YX5D40 | SPYD.DE | 14.10.2011 | −7,05 | −5,50 | 2/119 (2 %) | −6,60 | −5,44 | 7/119 (6 %) | −3,54 | −45,6 % | nicht verlässlich vorn |
| Dividende/Aktionärsrendite | **WTDM** | IE00BZ56RG20 | WTDM.DE | 21.06.2016 | −1,95 | −1,21 | 2/63 (3 %) | −1,63 | −1,12 | 9/63 (14 %) | −0,98 | −23,1 % | nicht verlässlich vorn |
| Dividende/Aktionärsrendite | **WTEU** | IE00BQZJBQ63 | WTEU.DE | 21.10.2014 | −11,08 | −1,66 | 0/83 (0 %) | −10,51 | −1,59 | 0/83 (0 %) | −6,17 | −56,9 % | nicht verlässlich vorn |
| Dividende/Aktionärsrendite | **FUSA** | IE00BYXVGY31 | FUSA.DE | 03.01.2019 | – | −0,94 | 0/32 (0 %) | – | −0,86 | 0/32 (0 %) | −1,51 | −16,8 % | nicht beurteilbar (zu jung) |
| Dividende/Aktionärsrendite | **HDLV** | IE00BWTN6Y99 | HDLV.L | 11.05.2015 | −11,84 | −5,68 | 0/76 (0 %) | −11,25 | −5,62 | 0/76 (0 %) | −7,48 | −56,8 % | nicht verlässlich vorn |
| Dividende/Aktionärsrendite | **EXX5** | DE000A0D8Q49 | EXX5.DE | 02.01.2008 | −8,95 | −3,24 | 13/164 (8 %) | −8,44 | −3,17 | 7/130 (5 %) | −3,10 | −47,2 % | nicht verlässlich vorn |
| Dividende/Aktionärsrendite | **QDVD** | IE00BKM4H312 | QDVD.DE | 13.06.2014 | −7,33 | −0,45 | 0/87 (0 %) | −6,86 | −0,37 | 0/87 (0 %) | −4,11 | −33,1 % | nicht verlässlich vorn |
| Dividende/Aktionärsrendite | **BBCK** | IE00BLSNMW37 | BBCK.DE | 24.10.2014 | −3,99 | −1,46 | 0/83 (0 %) | −3,62 | −1,38 | 0/83 (0 %) | −3,29 | −32,7 % | nicht verlässlich vorn |
| Kleine Werte | **IUS3** | IE00B2QWCY14 | IUS3.DE | 09.05.2008 | −6,53 | −6,30 | 35/160 (22 %) | −6,09 | −6,24 | 22/130 (17 %) | −3,48 | −47,0 % | nicht verlässlich vorn |
| Kleine Werte | **SMLK** | IE00BH3YZ803 | USML.L | 29.01.2019 | – | −5,86 | 0/32 (0 %) | – | −5,80 | 0/32 (0 %) | −5,61 | −40,5 % | nicht beurteilbar (zu jung) |
| Kleine Werte | **ZPRR** | IE00BJ38QD84 | R2US.L | 30.06.2014 | −5,79 | −6,35 | 2/87 (2 %) | −5,36 | −6,30 | 2/87 (2 %) | −6,14 | −46,4 % | nicht verlässlich vorn |
| Kleine Werte | **XRS2** | IE00BJZ2DD79 | XRS2.DE | 06.03.2015 | −5,79 | −6,46 | 2/78 (3 %) | −5,37 | −6,40 | 2/78 (3 %) | −6,44 | −50,8 % | nicht verlässlich vorn |
| Kleine Werte | **RS2K** | LU1681038672 | RS2K.PA | 07.01.2014 | −5,79 | −6,40 | 2/92 (2 %) | −5,36 | −6,34 | 2/92 (2 %) | −6,02 | −49,8 % | nicht verlässlich vorn |
| Kleine Werte | **SC0K** | IE00B60SX402 | SC0K.DE | 31.03.2009 | −5,69 | −6,33 | 6/150 (4 %) | −5,27 | −6,27 | 2/130 (2 %) | −4,44 | −63,4 % | nicht verlässlich vorn |
| Kleine Werte | **ZPRV** | IE00BSPLC413 | ZPRV.DE | 18.02.2015 | −7,18 | −1,35 | 8/79 (10 %) | −6,72 | −1,27 | 9/79 (11 %) | −2,62 | −46,6 % | nicht verlässlich vorn |
| Kleine Werte | **SXRG** | IE00B3VWM098 | CSUSS.MI | 01.07.2009 | −4,28 | −6,08 | 13/146 (9 %) | −3,89 | −6,02 | 5/130 (4 %) | −3,36 | −44,2 % | nicht verlässlich vorn |
| Kleine Werte | **QDVC** | IE00BD1F4K20 | QDVC.DE | 24.10.2016 | −2,89 | −6,99 | 0/59 (0 %) | −2,54 | −6,94 | 0/59 (0 %) | −3,81 | −37,2 % | nicht verlässlich vorn |
| Kleine Werte | **IS3T** | IE00BP3QZD73 | IS3T.DE | 06.10.2014 | −6,29 | −7,14 | 0/83 (0 %) | −5,85 | −7,09 | 0/83 (0 %) | −7,42 | −50,0 % | nicht verlässlich vorn |
| Moat | **GMVM** | IE00BQQP9H09 | GMVM.DE | 16.10.2015 | +0,80 | −8,23 | 12/71 (17 %) | +1,04 | −8,18 | 15/71 (21 %) | −1,56 | −41,0 % | nicht verlässlich vorn |
| Moat | **VVGM** | IE00BL0BMZ89 | VVGM.DE | 09.07.2020 | – | −6,09 | 0/14 (0 %) | – | −6,04 | 0/14 (0 %) | −5,35 | −30,8 % | nicht beurteilbar (zu jung) |
| Multifaktor | **IBCY** | IE00BZ0PKS76 | IFSU.L | 04.09.2015 | −5,00 | −0,86 | 0/72 (0 %) | −4,60 | −0,77 | 0/72 (0 %) | −3,68 | −26,6 % | nicht verlässlich vorn |
| Multifaktor | **GACA** | IE00BJ5CNR11 | GACA.DE | 11.10.2019 | – | −1,45 | 0/23 (0 %) | – | −1,37 | 0/23 (0 %) | −1,23 | −22,3 % | nicht beurteilbar (zu jung) |
| Multifaktor | **QVMP** | IE00BDZCKK11 | QVMP.DE | 16.06.2017 | – | +1,20 | 22/51 (43 %) | – | +1,30 | 27/51 (53 %) | +0,02 | −20,4 % | nicht beurteilbar (zu jung) |
| Multifaktor | **USFM** | IE00BDGV0308 | USFM.L | 19.06.2018 | – | −2,49 | 0/39 (0 %) | – | −2,42 | 0/39 (0 %) | −2,41 | −20,2 % | nicht beurteilbar (zu jung) |
| Multifaktor | **FLXU** | IE00BF2B0P08 | FLXU.DE | 15.09.2017 | – | −1,58 | 4/48 (8 %) | – | −1,50 | 6/48 (13 %) | −1,72 | −25,0 % | nicht beurteilbar (zu jung) |
| Multifaktor | **IBCZ** | IE00BZ0PKT83 | IBCZ.DE | 04.09.2015 | −5,06 | −1,24 | 0/72 (0 %) | −4,66 | −1,16 | 0/72 (0 %) | −5,18 | −43,0 % | nicht verlässlich vorn |
| Multifaktor | **HWWD** | IE00BKZGB098 | HWWD.L | 08.07.2014 | −4,16 | −1,20 | 0/86 (0 %) | −3,78 | −1,12 | 0/86 (0 %) | −4,19 | −36,7 % | nicht verlässlich vorn |
| Fundamentalgewichtung | **6PSA** | IE00B23D8S39 | 6PSA.DE | 20.08.2009 | −5,17 | +0,33 | 1/145 (1 %) | −4,76 | +0,42 | 5/130 (4 %) | −2,00 | −49,6 % | nicht verlässlich vorn |
| Kontrolle | **SXR8** | IE00B5BMR087 | SXR8.DE | 01.11.2010 | −0,27 | −0,09 | 10/130 (8 %) | ±0,00 | ±0,00 | 0/130 (0 %) | ±0,00 | 0,0 % | nicht verlässlich vorn |
| Kontrolle | **P500** | IE00B3YCGJ38 | SPXS.L | 25.05.2010 | −0,13 | +0,14 | 30/136 (22 %) | +0,14 | +0,23 | 107/130 (82 %) | +0,15 | −8,3 % | nicht verlässlich vorn |

### Anmerkungen zu einzelnen Zeilen

- **QQQ:** Reihe ab 10.03.1999 erst nach Korrektur K1b (K1 hatte echte Bewegungen 2000/01 als Datenbruch gelesen). Zwei Ausschüttungen gestrichen, eine nachgetragen, acht Beträge ersetzt (C2).
- **SPMO:** 2015–2017 kaum gehandelt (viele unveränderte Schlusskurse); drei fehlende Invesco-Ausschüttungen nachgetragen. Das Urteil hält auch ohne die ersten Monate (Gruppenbericht g2).
- **IVW:** Knapp: 208 von 256 Fenstern bei 205 nötigen, B nur +0,14 Pp; jede Ausschüttung gegen iShares geprüft.
- **IWF:** Verfehlt 80 % um drei Fenster (202/256) und liegt in B −1,18 Pp hinten.
- **VUG:** Vanguard nennt nur die letzten sechs Ausschüttungen; Lücken davor (vermutlich 12/2014 wie bei VOO/MGK) sind nicht prüfbar. Das Urteil hängt an B (−0,68 Pp), nicht an den Fenstern.
- **MGK:** Ausschüttung 12/2014 fehlt bei Yahoo (über die Vanguard-Jahresrendite 2014 bestätigt, Betrag vom Anbieter nicht genannt, daher nicht nachgetragen) — MGK ist eher etwas zu schlecht gerechnet.
- **SYLD:** 21 Ausschüttungen 09/2013–09/2018 fehlten bei Yahoo (Cambria-Historie) und sind nachgetragen: A von −2,12 auf −1,32 Pp p. a.
- **IVV / VOO:** IVV: Zusatzeintrag 16.12.2003 gestrichen, 23.03.2016 nachgetragen; VOO: Ausschüttung 12/2014 aus der Jahressumme des Jahresberichts abgeleitet (einziger abgeleiteter Betrag, markiert). Ohne diese Korrekturen 179/256 bzw. 82/132 Fenster.
- **SCHD, VIG, VYM, VBR, AVUV, VTV, VUG, MGK:** Ausschüttungshistorie beim Anbieter nicht vollständig abrufbar (Schwab HTTP 403; Vanguard/Avantis nur letzte Zahlungen) — Yahoo-Ausschüttungen ungeprüft; Factsheets stimmen auf ±0,05 Pp p. a.
- **SXRV:** Gerechnet über CSNDX.SW (SIX, USD): die Xetra-Reihe beginnt 101 Tage nach Auflage (C6). Mit SXRV.DE gleiches Urteil (Gruppenbericht g4).
- **EXXT, EQQQ:** Yahoo führt 2008 USD-Kurse in der EUR-Reihe (EQQQ.DE springt bis 08/2009 hin und her) — Korrektur K2. EXXT: acht Ausschüttungen 2008–2013 nachgetragen. EQQQ vor 2013 beim Anbieter nicht prüfbar.
- **LYMS, 6AQQ:** Pariser Notizen (UST.PA, ANX.PA) mit der Historie der verschmolzenen Lyxor-Vorgänger.
- **MWOT:** „Zu jung" ist hier eine Datenlücke: Yahoo führt die Historie des Lyxor-Vorgängers (bis 07/2024) unter keinem der Symbole.
- **WTEU:** Anfangsabschnitt 10/2014–03/2015 vermutlich in USD (K2 greift nicht, weil EURUSD beim Austritt unter 1,1275 lag) — Fenster mit Start bis 03/2015 und der Rückschlag sind unsicher; A/B nicht betroffen.
- **SXRG, SC0K, 6PSA:** Sehr unsaubere Yahoo-Reihen (dutzende USD-Tage, von K2 umgerechnet) — Fenster und Rückschläge nur grob; A und B weit hinten, das Urteil hängt nicht daran.
- **EXX5:** Endkurs B lag bei Yahoo in USD (02.–23.09.2026); nach K2 B −3,24 statt −0,06 Pp p. a.
- **P500:** Kontrolle: SPXS.L am 02.01.2014 um Faktor 100 (Korrektur K3). Gegen SXR8 107/130 Fenster, A +0,14, B +0,23 Pp — die Swap-Bauform allein (keine 15 % Quellensteuer) erfüllt die Regel gegen SXR8.
- **HWWD:** Strategiewechsel am 25.10.2017 (Marktgewicht → Multifaktor, laut HSBC).
- **Klasse „Welt":** IS3Q, XDEQ, IQQ0, XDEB, IS3S, XDEV, IS3R, XDEM, BBCK, IS3T, VVGM, IBCZ, HWWD bilden MSCI-World-/Welt-Faktoren ab; der Vergleich mit dem S&P 500 mischt Faktor und Region.
- **ausgeschlossen:** HSBC MSCI USA Quality (IE00B5WFQ436) — bildete bis 2025 den breiten MSCI USA ab (REGEL B3).

## 3. Was die „verlässlich vorn"-Fonds gemeinsam haben

Alle zehn sind **große US-Wachstums- oder Momentumwerte** — in den Jahren 2009–2026 dieselben wenigen Technologiekonzerne. Kein Fonds eines anderen Faktors erfüllt die Regel. Die nicht überlappenden Fünfjahresblöcke (erstes Fenster, dann je 60 Monate weiter):

| Fonds | Blöcke (Start: Abstand p. a.) | ganze Zeit Abstand p. a. | Rückschlag Fonds / SPY absolut |
|---|---|---|---|
| QQQ | 03/1999: −6,15; 03/2004: +2,09; 03/2009: +3,80; 03/2014: +5,80; 03/2019: +5,69 | +2,18 (ab 10.03.1999) | −83 % / −55 % |
| SPMO | 10/2015: +2,74; 10/2020: +4,36 | +3,96 (ab 12.10.2015) | −31 % / −34 % |
| IVW | 05/2000: −4,33; 05/2005: +0,53; 05/2010: +1,31; 05/2015: +3,28; 05/2020: +0,76 | +0,26 (ab 26.05.2000) | −57 % / −55 % |
| SCHG | 01/2010: +1,29; 01/2015: +2,27; 01/2020: +4,50 | +2,11 (ab 04.01.2010) | −35 % / −34 % |
| MGK | 12/2007: +1,90; 12/2012: +0,81; 12/2017: +0,61 | +2,35 (ab 27.12.2007) | −48 % / −53 % |
| SXRV | 01/2010: +4,06; 01/2015: +5,20; 01/2020: +4,62 | +4,44 (ab 26.01.2010) | −35 % / −34 % |
| EXXT | 01/2008: +4,88; 01/2013: +5,48; 01/2018: +2,41 | +4,40 (ab 02.01.2008) | −49 % / −52 % |
| EQQQ | 01/2008: +4,16; 01/2013: +5,61; 01/2018: +2,58 | +4,38 (ab 02.01.2008) | −50 % / −52 % |
| LYMS | 01/2008: +4,30; 01/2013: +4,48; 01/2018: +2,42 | +3,92 (ab 02.01.2008) | −50 % / −52 % |
| 6AQQ | 06/2010: +4,07; 06/2015: +8,09; 06/2020: +1,67 | +4,54 (ab 08.06.2010) | −35 % / −34 % |

QQQ und IVW reichen bis 1999/2000 zurück und zeigen den Preis: ein Fünfjahresblock (Start 1999/2000) deutlich hinten. Die UCITS-Reihen beginnen erst 2008/2010 und enthalten diesen Block nicht.

## 4. Kontrollen

| Kontrolle | gegen | A | B | Fenster vorn | Median p. a. | was sie zeigt |
|---|---|---|---|---|---|---|
| IVV | SPY | +0,06 | +0,07 | 218/256 (85 %) | +0,04 | gleicher Index, 0,03 % statt 0,0945 % Kosten |
| VOO | SPY | +0,07 | +0,06 | 131/132 (99 %) | +0,06 | dasselbe bei Vanguard |
| SXR8 | SPY (USD) | −0,27 | −0,09 | 10/130 (8 %) | −0,33 | UCITS-Zwilling: 15 % Quellensteuer auf US-Dividenden, Zeitversatz Xetra |
| P500 | SXR8 (EUR) | +0,14 | +0,23 | 107/130 (82 %) | +0,15 | Swap-UCITS ohne Quellensteuerabzug |

Eichung (REGEL C7.6/7) bestanden: SPY Fenster A +115,91 % (Gegenprobe Nr. 78: +115,81 % Yahoo-bereinigt), B +80,97 % (Nr. 88: +81,2 %), gegen den S&P 500 Total Return Index −0,10 / −0,11 Pp p. a.; IVV/VOO gegen SPY in A und B je unter 0,15 Pp. Die 80-%-Regel wird von Fonds bestanden, deren wahrer Vorsprung null bis ein Zehntel Prozentpunkt ist — sie trennt „billiger" nicht von „besser".

## 5. Überlebensverzerrung (c)

Belegt (je Fonds mit geöffneter Quelle, `geschlossene-fonds.md`): **156 Faktor-/Smart-Beta-ETFs seit 2010 geschlossen**, 123 US-gelistete und 33 UCITS. Wellen: Russell 2012 (25 Fonds), iShares 2018 (13 Faktorfonds), Invesco 2020 (rund 20 Faktorfonds unter 42 Schließungen), John Hancock 2022 (10 Multifaktor-Sektorfonds), Morgan Stanley 2024 (alle 6 Smart-Beta-UCITS). Grund fast immer: zu wenig Vermögen. Zählungen: Morningstar meldet für die USA 2020 73 Schließungen bei 21 Neuauflagen strategischer Beta-Produkte und rund 179 geschlossene Faktorstrategien in fünf Jahren bis 2021; „The Smart Beta Mirage" (Huang/Song/Xiang, JFQA 2024) misst rund +3 % Mehrrendite der Indizes in der Rückrechnung, aber −0,5 bis −1 % nach dem ETF-Start. Die Liste ist nicht erschöpfend; Kurse der geschlossenen Fonds wurden nicht geladen. **Richtung:** Die hier gerechneten Fonds sind die Überlebenden — und zusätzlich die heute bekannten (Bekanntheitsverzerrung). Beides macht das Bild zu gut, nicht zu schlecht.

## 6. Datenprüfung und Korrekturen nach dem Siegel

Alle Korrekturen wirken für alle Fonds gleich, sind im Code benannt und getestet (`test.js`), und keine ändert ein Urteil eines Fonds aus Auftrag, Zusatz oder UCITS-Liste (nachgerechnet: ohne C2 und K2 dieselben zehn). Es kippen nur die Kontrollen IVV (179 → 218 von 256 Fenstern) und VOO (82 → 131 von 132) — durch fehlende bzw. überzählige Yahoo-Ausschüttungen, die bei einem Vorsprung von Hundertstelpunkten den Ausschlag geben.

- **K1 / K1b** (`d311da7`, `194c1b9`): SXR8.DE beginnt bei Yahoo mit eingefrorenen Kursen bis 29.10.2010 → Reihe ab 01.11.2010. Die erste Fassung K1 verwarf auch echte Bewegungen (QQQ 2000/01); K1b verwirft einen Anfang nur nach ≥ 5 gleichen Schlusskursen und wurde vor jeder Auswertung eingesetzt.
- **C2 benannte Ergänzungen** (`ergaenzungen.json`): 161 nachgewiesene Abweichungen der Yahoo-Ausschüttungen von den Anbieterhistorien (102 fehlt, 49 ersetzen, 10 streichen), 107 Fonds abgeglichen; systematisch: Invesco-Septemberausschüttungen 2020/2021 fehlen, iShares-Zusatzeinträge 16.12.2003, SYLD 2013–2018 fehlt ganz, UCITS-Ausschüttungen vor 2013/14 fehlen. Nicht prüfbar: VTV, VUG, MGK, SCHD, VIG, VYM, AVUV, VBR, UBUT, XMVU, UBUR, UBU5, UBUS, EQQQ, WTEU, HDLV, BBCK, QVMP, USFM, HWWD, 6PSA. Bei den US-Fonds mit nachgetragenen Ausschüttungen sank die Factsheet-Abweichung dadurch auf höchstens 0,02 Pp p. a. (z. B. RPV −0,14 → −0,017, RWL −0,10 → −0,016).
- **K2 USD-Werte in EUR-Reihen**: Yahoo führt in Xetra-/Mailand-/Paris-Notizen tage- bis monateweise Kurs × EURUSD; erkannt am Sprung um genau den EZB-Kurs (Einzeltage ab EURUSD 1,083, Abschnitte ab 1,1275), umgerechnet statt verworfen; geprüft an sauberen Zweitnotizen (EQQQ.DE gegen EQQQ.MI: 163/164 Fenster, Rückschlag −24,4 % gegen −24,9 %). Zwei lockerere Vorfassungen lasen Zeitversatz-Tage (2020, 2022, Wahltag 06.11.2024) als USD-Werte und wurden verworfen.
- **K3 Faktor-100-Brüche**: ein Tagesverhältnis von genau 1/100 oder 100 (SPXS.L 02.01.2014, USFM.L 29.08.2025) wird als Einheiten-/Splitfehler zurückgerechnet.
- Weitere Befunde ohne Korrektur: SPY 15.11.2004 Sonderausschüttung echt (fünf statt vier im Jahr); SPY-Schluss 06.01.2000 verdächtig (kein Monatsende); umsatzlose Tage bei SPMO 2015–17, QUS 2015–16, CSNDX.SW; SXR8 und alle Fensterränder A/B der „verlässlich vorn"-Fonds frei von nachgewiesenen Fehlern.

## 7. Factsheet-Stichproben (REGEL C9)

Anbieterwert der 5-Jahres-Rendite p. a. zum Stichtag gegen unseren Wert aus derselben Reihe (Endstand mit allen Korrekturen; „Gruppe" = Wert vor den Korrekturen). 98 verglichen, 9 nicht erreichbar; Abweichung −0,22 bis +0,31 Pp p. a., Median −0,005. Über 0,30: ZPRR +0,31 (London am 31.08. geschlossen, mit der Xetra-Notiz −0,11). UCITS-Factsheets nennen meist nur den NAV (US-Schluss); der Xetra-Schluss liegt 4½ Stunden früher — daher die etwas größere Streuung.

| Fonds | Symbol | Stichtag | Art | Währung | Anbieter 5 J. p. a. | unser 5 J. p. a. | Abweichung (Pp) |
|---|---|---|---|---|---|---|---|
| RSP | RSP | 31.08.2026 | Marktpreis | USD | 8,82 % | 8,81 % | −0,01 |
| QUAL | QUAL | 30.06.2026 | Marktpreis | USD | 11,87 % | 11,87 % | ±0,00 |
| SPHQ | SPHQ | 31.08.2026 | Marktpreis | USD | 12,49 % | 12,49 % | ±0,00 |
| USMV | USMV | 30.06.2026 | Marktpreis | USD | 7,30 % | 7,30 % | ±0,00 |
| SPLV | SPLV | 31.08.2026 | Marktpreis | USD | 5,33 % | 5,33 % | ±0,00 |
| LRGF | LRGF | 30.06.2026 | Marktpreis | USD | 13,65 % | 13,64 % | −0,01 |
| GSLC | GSLC | 31.08.2026 | Marktpreis | USD | 11,40 % | 11,41 % | +0,01 |
| MOAT | MOAT | 30.09.2026 | Marktpreis | USD | 8,88 % | 8,89 % | +0,01 |
| COWZ | COWZ | 30.06.2026 | Marktpreis | USD | 9,87 % | 9,88 % | +0,01 |
| PRF | PRF | 31.08.2026 | Marktpreis | USD | 13,26 % | 13,25 % | −0,01 |
| RWL | RWL | 31.08.2026 | Marktpreis | USD | 13,75 % | 13,73 % | −0,02 |
| QUS | QUS | 31.08.2026 | Marktpreis | USD | 10,79 % | 10,80 % | +0,01 |
| IVV | IVV | 30.06.2026 | Marktpreis | USD | 13,33 % | 13,33 % | ±0,00 |
| VOO | VOO | 30.09.2026 | Marktpreis | USD | 13,76 % | 13,77 % | +0,01 |
| VLUE | VLUE | 30.06.2026 | Marktpreis | USD | 16,79 % | 16,79 % | ±0,00 |
| IWD | IWD | 30.06.2026 | Marktpreis | USD | 10,97 % | 10,97 % | ±0,00 |
| RPV | RPV | 31.08.2026 | Marktpreis | USD | 12,00 % | 11,98 % | −0,02 |
| IWF | IWF | 30.06.2026 | Marktpreis | USD | 13,51 % | 13,51 % | ±0,00 |
| QQQ | QQQ | 31.08.2026 | Marktpreis | USD | 14,20 % | 14,22 % | +0,01 |
| MTUM | MTUM | 30.06.2026 | Marktpreis | USD | 15,92 % | 15,92 % | ±0,00 |
| SPMO | SPMO | 31.08.2026 | Marktpreis | USD | 19,66 % | 19,66 % | ±0,00 |
| QMOM | QMOM | 30.09.2026 | Marktpreis | USD | 8,89 % | 8,88 % | −0,01 |
| PDP | PDP | 31.08.2026 | Marktpreis | USD | 7,53 % | 7,52 % | −0,01 |
| IVE | IVE | 30.06.2026 | Marktpreis | USD | 11,09 % | 11,09 % | ±0,00 |
| VTV | VTV | 30.09.2026 | Marktpreis | USD | 12,43 % | 12,44 % | +0,01 |
| IVW | IVW | 30.06.2026 | Marktpreis | USD | 14,34 % | 14,34 % | ±0,00 |
| VUG | VUG | 30.09.2026 | Marktpreis | USD | 13,88 % | 13,87 % | −0,01 |
| SCHG | SCHG | 31.08.2026 | Marktpreis | USD | 13,26 % | 13,26 % | ±0,00 |
| MGK | MGK | 30.09.2026 | Marktpreis | USD | 15,12 % | 15,10 % | −0,02 |
| SCHD | SCHD | 30.06.2026 | – | – | nicht erreichbar | 8,51 % | – |
| VIG | VIG | 30.09.2026 | Marktpreis | USD | 10,73 % | 10,73 % | ±0,00 |
| DGRO | DGRO | 30.06.2026 | Marktpreis | USD | 11,02 % | 11,02 % | ±0,00 |
| VYM | VYM | 30.09.2026 | Marktpreis | USD | 11,64 % | 11,64 % | ±0,00 |
| PKW | PKW | 31.08.2026 | Marktpreis | USD | 10,98 % | 10,99 % | +0,01 |
| SYLD | SYLD | 30.06.2026 | Marktpreis | USD | 6,73 % | 6,73 % | −0,01 |
| IJR | IJR | 30.06.2026 | Marktpreis | USD | 7,30 % | 7,30 % | ±0,00 |
| IWM | IWM | 30.06.2026 | Marktpreis | USD | 6,87 % | 6,87 % | ±0,00 |
| AVUV | AVUV | 30.09.2026 | Marktpreis | USD | 11,16 % | 11,16 % | ±0,00 |
| NOBL | NOBL | 31.08.2026 | Marktpreis | USD | 6,40 % | 6,40 % | −0,01 |
| SDY | SDY | 31.08.2026 | Marktpreis | USD | 7,41 % | 7,42 % | +0,01 |
| DVY | DVY | 30.06.2026 | Marktpreis | USD | 9,93 % | 9,93 % | ±0,00 |
| HDV | HDV | 30.06.2026 | Marktpreis | USD | 11,11 % | 11,11 % | ±0,00 |
| SPHD | SPHD | 31.08.2026 | Marktpreis | USD | 7,79 % | 7,80 % | +0,02 |
| DGRW | DGRW | 31.08.2026 | Marktpreis | USD | 11,58 % | 11,58 % | ±0,00 |
| IJH | IJH | 30.06.2026 | Marktpreis | USD | 9,05 % | 9,05 % | ±0,00 |
| VBR | VBR | 30.09.2026 | Marktpreis | USD | 8,71 % | 8,71 % | ±0,00 |
| IJS | IJS | 30.06.2026 | Marktpreis | USD | 7,07 % | 7,07 % | ±0,00 |
| XDEW | XDEW.DE | 30.09.2026 | NAV | USD | 8,25 % | 8,17 % | −0,08 |
| SP2Q | SP2Q.DE | 31.08.2026 | NAV | USD | 8,51 % | 8,42 % | −0,10 |
| QDVB | QDVB.DE | 30.09.2026 | NAV | USD | 12,08 % | 12,06 % | −0,02 |
| UBUT | UBUT.DE | 31.08.2026 | NAV | USD | 12,16 % | 11,99 % | −0,17 |
| IS3Q | IS3Q.DE | 30.09.2026 | NAV | USD | 10,75 % | 10,78 % | +0,03 |
| XDEQ | XDEQ.DE | 30.09.2026 | NAV | USD | 10,78 % | 10,81 % | +0,03 |
| XMVU | XMVU.L | 30.09.2026 | NAV | USD | 7,21 % | 7,15 % | −0,07 |
| MIVU | MIVU.PA | – | – | – | nicht erreichbar | – | – |
| SPY1 | SPY1.DE | 31.08.2026 | NAV | USD | 4,86 % | 4,79 % | −0,07 |
| IBCK | IBCK.DE | 30.09.2026 | NAV | USD | 9,23 % | 9,23 % | ±0,00 |
| UBUR | UBUR.DE | – | – | – | nicht erreichbar | – | – |
| IQQ0 | IQQ0.DE | 30.09.2026 | NAV | USD | 5,56 % | 5,58 % | +0,02 |
| XDEB | XDEB.DE | 30.09.2026 | NAV | USD | 5,62 % | 5,66 % | +0,04 |
| QDVI | QDVI.DE | 30.09.2026 | NAV | USD | 17,03 % | 16,98 % | −0,05 |
| UBU5 | UBU5.DE | 31.08.2026 | NAV | USD | 10,03 % | 9,89 % | −0,14 |
| ZPRU | ZPRU.DE | 31.08.2026 | NAV | USD | 13,14 % | 12,97 % | −0,17 |
| UBUS | UBUS.DE | – | – | – | nicht erreichbar | – | – |
| IS3S | IS3S.DE | 30.09.2026 | NAV | USD | 17,37 % | 17,43 % | +0,06 |
| XDEV | XDEV.DE | 30.09.2026 | NAV | USD | 17,55 % | 17,60 % | +0,06 |
| MWOT | MWOW.DE | – | – | – | nicht erreichbar | – | – |
| SXRV | CSNDX.SW | 30.09.2026 | NAV | USD | 16,07 % | 16,04 % | −0,03 |
| EXXT | EXXT.DE | 30.09.2026 | NAV | USD | 15,94 % | 15,91 % | −0,03 |
| EQQQ | EQQQ.DE | 31.08.2026 | NAV | USD | 14,00 % | 13,81 % | −0,19 |
| EQQX | EQQX.DE | 31.08.2026 | NAV | USD | 14,22 % | 14,02 % | −0,20 |
| LYMS | UST.PA | 31.08.2026 | NAV | USD | 14,18 % | 14,01 % | −0,17 |
| 6AQQ | ANX.PA | 31.08.2026 | NAV | EUR | 14,53 % | 14,45 % | −0,08 |
| XNAS | XNAS.DE | 30.09.2026 | NAV | USD | 16,19 % | 16,17 % | −0,03 |
| QDVA | QDVA.DE | 30.09.2026 | NAV | USD | 12,95 % | 12,82 % | −0,13 |
| IS3R | IS3R.DE | 30.09.2026 | NAV | USD | 13,25 % | 13,20 % | −0,05 |
| XDEM | XDEM.DE | 30.09.2026 | NAV | USD | 13,31 % | 13,24 % | −0,07 |
| SPYD | SPYD.DE | 31.08.2026 | NAV | USD | 6,92 % | 6,83 % | −0,09 |
| WTDM | WTDM.DE | 31.08.2026 | NAV | USD | 11,43 % | 11,21 % | −0,22 |
| WTEU | WTEU.DE | 31.08.2026 | NAV | USD | 10,88 % | 10,67 % | −0,21 |
| FUSA | FUSA.DE | 02.10.2026 | unklar (Plattformwert) | GBP | 12,74 % | 12,91 % | +0,17 |
| HDLV | HDLV.L | 30.09.2026 | NAV | USD | 6,25 % | 6,13 % | −0,12 |
| EXX5 | EXX5.DE | 30.09.2026 | NAV | USD | 8,56 % | 8,47 % | −0,09 |
| QDVD | QDVD.DE | 30.09.2026 | NAV | USD | 12,53 % | 12,47 % | −0,06 |
| BBCK | BBCK.DE | 30.09.2026 | NAV | USD | 10,82 % | 10,85 % | +0,03 |
| IUS3 | IUS3.DE | 30.09.2026 | NAV | USD | 5,63 % | 5,47 % | −0,16 |
| SMLK | USML.L | 30.09.2026 | NAV | USD | 6,07 % | 5,92 % | −0,16 |
| ZPRR | R2US.L | 31.08.2026 | NAV | USD | 6,41 % | 6,72 % | +0,31 |
| XRS2 | XRS2.DE | – | – | – | nicht erreichbar | – | – |
| RS2K | RS2K.PA | 31.08.2026 | NAV | EUR | 6,75 % | 6,72 % | −0,04 |
| SC0K | SC0K.DE | 30.09.2026 | NAV | USD | 5,97 % | 5,91 % | −0,06 |
| ZPRV | ZPRV.DE | 31.08.2026 | NAV | USD | 11,26 % | 11,12 % | −0,14 |
| SXRG | CSUSS.MI | 30.09.2026 | NAV | USD | 6,36 % | 6,20 % | −0,17 |
| QDVC | QDVC.DE | 30.09.2026 | NAV | USD | 5,72 % | 5,70 % | −0,02 |
| IS3T | IS3T.DE | 30.09.2026 | NAV | USD | 5,87 % | 5,91 % | +0,04 |
| GMVM | GMVM.DE | 30.09.2026 | NAV | USD | 4,32 % | 4,27 % | −0,05 |
| VVGM | VVGM.DE | 30.09.2026 | NAV | USD | 7,10 % | 6,99 % | −0,11 |
| IBCY | IFSU.L | 30.09.2026 | NAV | USD | 12,74 % | 12,65 % | −0,09 |
| GACA | GACA.DE | – | – | – | nicht erreichbar | – | – |
| QVMP | QVMP.DE | 30.09.2026 | NAV | USD | 14,16 % | 14,05 % | −0,11 |
| USFM | USFM.L | – | – | – | nicht erreichbar | – | – |
| FLXU | FLXU.DE | – | – | – | nicht erreichbar | – | – |
| IBCZ | IBCZ.DE | 30.09.2026 | NAV | USD | 12,41 % | 12,42 % | +0,01 |
| HWWD | HWWD.L | 31.08.2026 | NAV | USD | 11,60 % | 11,82 % | +0,22 |
| 6PSA | 6PSA.DE | 30.09.2026 | NAV | USD | 12,96 % | 12,92 % | −0,04 |
| SXR8 | SXR8.DE | 30.09.2026 | NAV | USD | 13,48 % | 13,42 % | −0,07 |
| P500 | SPXS.L | 30.09.2026 | NAV | USD | 13,69 % | 13,66 % | −0,02 |

## 8. Zweiter Rechner (REGEL C10)

Ein unabhängiger Agent hat aus `REGEL.md` eigenen Code geschrieben (`zweitrechner/zweit.js`), die Kurse selbst geladen und SPY, SPMO, SCHD, XDEW sowie alle zehn „verlässlich vorn"-Fonds gerechnet (UCITS auch gegen SXR8). Abgleich `vergleich-zweit.js` (Rechenweg gegen Rechenweg, ohne die Datenkorrekturen nach dem Siegel, die er nicht kennt): **157 von 157 Größen innerhalb der Toleranz** (0,05 Pp p. a., ±1 Fenster, 0,5 Pp Rückschlag), die meisten auf vier Nachkommastellen gleich. Er fand unabhängig dieselben Datenfehler (fehlende Ausschüttungen QQQ/SPMO/MGK, USD-Kurse in EQQQ.DE/EXXT.DE).

## 9. Grenzen

- **Überlebens- und Bekanntheitsverzerrung** (Abschnitt 5): das Bild ist zu gut.
- **Überlappende Fenster:** 60 aufeinanderfolgende Fenster teilen 59 Monate; hinter „130 von 130" stehen drei unabhängige Fünfjahresblöcke.
- **Viele Fonds, ein Regime:** alle Treffer sind US-Großwerte mit Technologie-Schwerpunkt; ein anderes Jahrzehnt (2000–2009) kehrte das Bild um (QQQ, IVW).
- **Kein Mindestabstand:** die Regel lässt reine Kostenvorteile als „verlässlich vorn" durch (IVV, VOO, P500 gegen SXR8).
- **Datenquelle Yahoo:** inoffiziell, Ausschüttungen lückenhaft, EUR-Notizen teils in USD; korrigiert, wo belegt (Abschnitt 6), sonst benannt. UCITS-Historie bei Yahoo erst ab 2008 (ältere Fonds) bzw. Notierungsbeginn.
- **Zeitversatz:** Xetra schließt 17:30 MEZ, SPY 22:00 MEZ — darum der zweite Maßstab SXR8.
- **Steuern und Handelskosten** nicht gerechnet (Teilfreistellung für Aktienfonds gleich; Spanne/Ordergebühr einmalig, beim S&P-500-Fonds ebenso).
- **Vergangenheit:** fünf Jahre vorn sagen nichts Sicheres über die nächsten fünf.

## 10. Dateien

`REGEL.md` (Siegel), `fonds.json`/`fonds-bauen.js` (Liste), `ucits-recherche.*` (UCITS-Suche), `laden.js` (Lader; Rohdaten nicht im Repo, Prüfsummen in `pruefsummen-*.json`), `rechnen.js` (Rechner), `test.js` (Prüfungen), `gruppe-g1…g5.json/.md` (Laden, Prüfen, Rechnen je Gruppe), `factsheet-*.json`, `factsheet-nachrechnen.js`, `ergaenzungen-*.json`/`ergaenzungen-bauen.js`, `geschlossene-fonds.*`, `zweitrechner/` (zweiter Rechner, `vergleich.json`), `zusammenfuehren.js`, `ergebnis.json`, `tabellen.md`, dieses Dokument (`ergebnis-schreiben.js`).
