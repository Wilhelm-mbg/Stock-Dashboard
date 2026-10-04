# Gruppe g5 — UCITS Dividende/Aktionärsrendite, Kleine Werte, Moat, Multifaktor, Fundamentalgewichtung, Kontrollen

> **Hinweis des Projektleiters (Endstand):** Dieser Gruppenbericht entstand beim Laden und Prüfen, also VOR den Korrekturen nach dem Siegel (benannte Ausschüttungs-Ergänzungen C2, USD-Werte in EUR-Reihen K2, Faktor-100-Brüche K3). Die Prüfbefunde gelten; einzelne Zahlen in den Tabellen hier können davon abweichen. Maßgeblich sind `ERGEBNIS.md` und `ergebnis.json`; `gruppe-gN.json` ist mit dem Endstand neu gerechnet.


Stand 2026-10-05 01:43. Kennung `faktor-etf-realitaet-2026-10/v1`. Rechner `rechnen.js` mit Korrektur K1b (Lauf 01:12, um 01:47 mit
dem aktuellen Stand wiederholt — Tabelle identisch; ohne `ergaenzungen.json` — die Ausschüttungs-Ergänzungen dieser Gruppe stehen getrennt in `ergaenzungen-g5.json`, Wirkung unten).
Rohdaten bis Schluss 02.10.2026, Auswertung bis 15.09.2026. Beschreibende Zahlen nach vorab festgelegter Regel, keine Anlageberatung.

**Laden:** 30 Fonds, 112 Yahoo-Symbole (SXR8.DE vom Projektleiter). Nicht ladbar (zweimal versucht, Antwort ohne Kerzen):
`FUSA.SG`, `IE00BKZGB098.SG`. Die Regionalbörsen (`.DU`, `.MU`, `.HM`, `.HA`) liefern meist nur den letzten Tag (1 Kerze) und
kommen für die Symbolwahl nicht in Frage. Prüfskripte: Kratzordner `kratz-g5/` (`pruefen.js`, `quervergleich2.js`,
`sonderfaelle.js`, `aussch-abgleich.js`, `ergaenzungen-bauen.js`).

## (1) Ergebnis je Fonds (Zahlen aus `gruppe-g5.json`, Abstände in Pp p. a.)

| Fonds | Klasse | Symbol | Daten ab | Urteil | gegen SPY: A / B (Pp p. a.) | vorn/n | Median | schlechtester (Start) | gegen SXR8: A / B | vorn/n | Median | schlechtester (Start) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SPYD | gleicher Index | SPYD.DE | 2011-10-14 | nicht verlässlich vorn | -7,05 / -5,50 | 0/119 | -3,97 | -8,09 (2021-05) | -6,59 / -5,44 | 3/119 | -3,54 | -8,01 (2021-05) |
| WTDM | gleicher Index | WTDM.DE | 2016-06-21 | nicht verlässlich vorn | -1,95 / -1,21 | 2/63 | -1,30 | -3,33 (2020-10) | -1,63 / -1,12 | 9/63 | -0,98 | -3,14 (2020-10) |
| WTEU | US-Faktor | WTEU.DE | 2014-10-21 | nicht verlässlich vorn | -11,08 / -1,66 | 0/83 | -6,50 | -11,19 (2016-10) | -10,51 / -1,59 | 0/83 | -6,29 | -10,86 (2016-10) |
| FUSA | US-Faktor | FUSA.DE | 2019-01-03 | nicht beurteilbar (zu jung) | – / -0,94 | 0/32 | -1,85 | -2,69 (2020-01) | – / -0,86 | 0/32 | -1,51 | -2,69 (2020-01) |
| HDLV | US-Faktor | HDLV.L | 2015-05-11 | nicht verlässlich vorn | -11,84 / -5,68 | 0/76 | -7,83 | -12,26 (2016-10) | -11,25 / -5,62 | 0/76 | -7,48 | -11,93 (2016-10) |
| EXX5 | US-Faktor | EXX5.DE | 2008-01-02 | nicht verlässlich vorn | -8,95 / -0,06 | 2/164 | -3,48 | -13,68 (2008-12) | -8,44 / +0,03 | 0/130 | -3,20 | -8,88 (2016-11) |
| QDVD | US-Faktor | QDVD.DE | 2014-06-13 | nicht verlässlich vorn | -7,33 / -0,56 | 0/87 | -4,38 | -7,70 (2016-10) | -6,86 / -0,47 | 0/87 | -4,11 | -7,42 (2016-10) |
| BBCK | Welt | BBCK.DE | 2014-10-24 | nicht verlässlich vorn | -3,99 / -1,46 | 0/83 | -3,77 | -9,33 (2017-07) | -3,62 / -1,38 | 0/83 | -3,40 | -9,22 (2017-07) |
| IUS3 | gleicher Index | IUS3.DE | 2008-05-09 | nicht verlässlich vorn | -6,53 / -6,42 | 27/160 | -2,98 | -8,87 (2021-02) | -6,09 / -6,36 | 19/130 | -3,48 | -8,59 (2021-05) |
| SMLK | gleicher Index | USML.L | 2019-01-29 | nicht beurteilbar (zu jung) | – / -5,86 | 0/32 | -5,83 | -8,38 (2021-01) | – / -5,80 | 0/32 | -5,61 | -8,15 (2021-05) |
| ZPRR | gleicher Index | R2US.L | 2014-06-30 | nicht verlässlich vorn | -5,79 / -6,35 | 2/87 | -6,42 | -9,55 (2021-02) | -5,36 / -6,30 | 2/87 | -6,14 | -9,17 (2021-01) |
| XRS2 | gleicher Index | XRS2.DE | 2015-03-06 | nicht verlässlich vorn | -5,79 / -6,46 | 2/78 | -6,73 | -9,65 (2021-02) | -5,37 / -6,40 | 2/78 | -6,44 | -9,23 (2021-02) |
| RS2K | gleicher Index | RS2K.PA | 2014-01-07 | nicht verlässlich vorn | -5,79 / -6,40 | 2/92 | -6,30 | -9,60 (2021-02) | -5,36 / -6,34 | 2/92 | -6,02 | -9,18 (2021-02) |
| SC0K | gleicher Index | SC0K.DE | 2009-03-31 | nicht verlässlich vorn | -5,69 / -6,33 | 5/150 | -4,48 | -10,00 (2009-09) | -5,27 / -6,27 | 2/130 | -4,44 | -9,18 (2021-02) |
| ZPRV | US-Faktor | ZPRV.DE | 2015-02-18 | nicht verlässlich vorn | -7,18 / -1,35 | 8/79 | -2,92 | -11,33 (2015-03) | -6,72 / -1,27 | 9/79 | -2,62 | -11,19 (2015-03) |
| SXRG | US-Faktor | CSUSS.MI | 2009-07-01 | nicht verlässlich vorn | -4,28 / -6,08 | 9/146 | -3,36 | -8,33 (2014-07) | -3,89 / -6,02 | 5/130 | -3,46 | -8,50 (2014-07) |
| QDVC | US-Faktor | QDVC.DE | 2016-10-24 | nicht verlässlich vorn | -2,89 / -6,99 | 0/59 | -4,01 | -7,71 (2021-05) | -2,54 / -6,94 | 0/59 | -3,81 | -7,63 (2021-05) |
| IS3T | Welt | IS3T.DE | 2014-10-06 | nicht verlässlich vorn | -6,29 / -7,14 | 0/83 | -7,68 | -9,94 (2019-06) | -5,85 / -7,09 | 0/83 | -7,42 | -9,98 (2019-06) |
| GMVM | US-Faktor | GMVM.DE | 2015-10-16 | nicht verlässlich vorn | +0,80 / -8,23 | 12/71 | -1,66 | -10,70 (2021-05) | +1,04 / -8,18 | 15/71 | -1,56 | -10,64 (2021-05) |
| VVGM | Welt | VVGM.DE | 2020-07-09 | nicht beurteilbar (zu jung) | – / -6,09 | 0/14 | -5,57 | -7,34 (2021-05) | – / -6,04 | 0/14 | -5,35 | -7,26 (2021-05) |
| IBCY | US-Faktor | IFSU.L | 2015-09-04 | nicht verlässlich vorn | -5,00 / -0,86 | 0/72 | -3,88 | -5,40 (2018-05) | -4,60 / -0,77 | 0/72 | -3,68 | -5,05 (2018-05) |
| GACA | US-Faktor | GACA.DE | 2020-04-28 | nicht beurteilbar (zu jung) | – / -1,45 | 0/17 | -1,59 | -2,67 (2020-10) | – / -1,37 | 0/17 | -1,30 | -2,48 (2020-10) |
| QVMP | US-Faktor | QVMP.DE | 2017-06-16 | nicht beurteilbar (zu jung) | – / +1,20 | 22/51 | -0,28 | -3,49 (2018-06) | – / +1,30 | 27/51 | +0,02 | -2,98 (2018-06) |
| USFM | US-Faktor | USFM.L | 2018-06-19 | nicht beurteilbar (zu jung) | – / -2,49 | 0/39 | -2,64 | -3,76 (2021-05) | – / -2,42 | 0/39 | -2,41 | -3,74 (2021-05) |
| FLXU | US-Faktor | FLXU.DE | 2017-09-15 | nicht beurteilbar (zu jung) | – / -1,58 | 4/48 | -2,07 | -4,60 (2019-12) | – / -1,50 | 6/48 | -1,72 | -4,47 (2019-12) |
| IBCZ | Welt | IBCZ.DE | 2015-09-04 | nicht verlässlich vorn | -5,06 / -1,24 | 0/72 | -5,36 | -7,11 (2018-05) | -4,66 / -1,16 | 0/72 | -5,18 | -6,79 (2018-05) |
| HWWD | Welt | HWWD.L | 2014-07-08 | nicht verlässlich vorn | -4,16 / -1,20 | 0/86 | -4,40 | -5,97 (2017-07) | -3,78 / -1,12 | 0/86 | -4,19 | -5,95 (2017-10) |
| 6PSA | US-Faktor | 6PSA.DE | 2009-08-20 | nicht verlässlich vorn | -5,17 / +0,33 | 1/145 | -2,18 | -9,68 (2011-08) | -4,76 / +0,42 | 5/130 | -2,01 | -9,61 (2011-08) |
| SXR8 | gleicher Index | SXR8.DE | 2010-11-01 | (Kontrolle) | -0,27 / -0,09 | 10/130 | -0,33 | -1,03 (2011-09) | (gegen sich selbst) | – | – | – |
| P500 | gleicher Index | SPXS.L | 2010-05-25 | (Kontrolle) | -0,13 / +0,14 | 29/136 | -0,23 | -70,87 (2010-06) | +0,14 / +0,23 | 88/130 | +0,14 | -72,29 (2011-08) |

**Urteile (aus dem Rechner):** verlässlich vorn: **keiner**. Nicht verlässlich vorn: 21 Fonds (SPYD, WTDM, WTEU, HDLV, EXX5, QDVD,
BBCK, IUS3, ZPRR, XRS2, RS2K, SC0K, ZPRV, SXRG, QDVC, IS3T, GMVM, IBCY, IBCZ, HWWD, 6PSA). Zu jung: 7 (FUSA, SMLK, VVGM, GACA, QVMP,
USFM, FLXU). Kein Fonds ist in A **und** B vorn; am nächsten: GMVM (A +0,80, B −8,23), 6PSA (A −5,17, B +0,33), QVMP (zu jung,
B +1,20, 22/51). Der Rechner schreibt bei SXR8 und P500 „nicht verlässlich vorn" — sie sind Kontrollen ohne Urteil im Sinne der Frage.

**Klasse „Welt"** (BBCK, IS3T, VVGM, IBCZ, HWWD): der Vergleich mit SPY bzw. SXR8 mischt Faktor und Region (HWWD: Referenz MSCI ACWI,
also auch Schwellenländer). Das Urteil kommt trotzdem aus dem Rechner.

**Kontrollen (Zusatz Punkt 5):**
- **SXR8 gegen SPY (USD):** A −0,27, B −0,09 Pp p. a.; 10 von 130 Fenstern vorn (7,7 %), Median −0,33, schlechtester −1,03 (2011-09).
  Das ist die Lücke aus Quellensteuer (15 % auf US-Dividenden) plus Zeitversatz Xetra-Schluss gegen US-Schluss; jeder UCITS-Fonds
  startet gegen SPY mit rund −0,1 bis −0,3 Pp p. a. Rückstand.
- **P500 (synthetisch) gegen SXR8 (EUR):** A +0,14, B +0,23; laut Rechner 88/130 Fenster vorn (67,7 %), Median +0,14, schlechtester
  −72,29 — die schlechtesten 44 Fenster sind ein Datenfehler (Split, siehe Befund 2). Mit korrigierten Kursen (Reihe vor dem
  02.01.2014 durch 100 geteilt; nur Schätzung im Kratzordner): **107/130 vorn (82,3 %)**, Median +0,15, schlechtester −0,39 (2011-01) —
  die Swap-Bauform war gegen SXR8 in A, in B und in > 80 % der Fenster vorn. Gegen SPY: A −0,13, B +0,14, korrigiert 30/136 (22,1 %),
  Median −0,20, schlechtester −0,88.

**Wirkung der nachgewiesenen Datenfehler auf die Tabelle** (Schätzung im Kratzordner, Rechner unverändert; Einzelheiten in (2) und (4)):
EXX5 B gegen SPY −0,06 → **−3,24**, gegen SXR8 +0,03 → **−3,17** (USD-Kurs am B-Endtag); EXX5 Fenster 2/164 → 10/164 (fehlende
Ausschüttungen 2008–2013 + USD-Tage); IUS3 27/160 → 41/160 vor SPY, B −6,42 → −6,30; SPYD 0/119 → 2/119 (gegen SXR8 3 → 7);
QDVD B −0,56 → −0,45; P500 siehe oben. **Kein Urteil ändert sich.**

## (2) Prüfbefunde je Fonds

Gemeinsames Muster vorab, weil es fast alle Xetra- und Mailand-Reihen betrifft: **Yahoo führt an EUR-Notizen tageweise oder über
Wochen den USD-Kurs statt des EUR-Kurses** (Nachweis je Tag: Verhältnis EUR-Notiz / USD-Notiz derselben Anteilsklasse = EZB-Kurs
EUR/USD auf ±2,5 %). Typische Phasen: die ersten Wochen nach Notierungsbeginn (2008, 2009/10, Okt.–Dez. 2014, Feb. 2015), Juni–August
2017 (wechselnd Tag für Tag), einzelne Tage (05.06.2017, 24.10.2025) und **EXX5.DE 02.–23.09.2026**. Einzeltage entfernt die
Sprungpaar-Regel, mehrtägige Phasen nicht; der Bruchtest (K1/K1b) listet nur den Ein- und Austritt. Prüfung dafür: `quervergleich2.js`
(gewählte Reihe gegen jede andere Notiz desselben Fonds, in EUR). Betroffen sind die Ränder A/B nur bei EXX5 (B-Ende), sonst
Monatsenden der rollierenden Fenster und die Rückschläge.

Ausschüttungs-Quote (Ausschüttung / Vortagsschluss) lag bei allen ausschüttenden Reihen zwischen 0,05 % und 3 %; **keine USD-Beträge an
EUR-Notizen** gefunden (Abgleich EUR-Betrag gegen USD-Betrag/EZB, alle innerhalb 1 % außer 12.03.2020: +1,4 %, Umrechnungskurs).
Abgleich adjclose: alle |Differenz| < 0,04 Pp p. a. außer USFM (s. u.). Yahoo-Name der gewählten Reihe passt bei allen 30 Fonds
(Anbieter, Index, Klasse); kein Symbol zu sperren.

- **SPYD** (SPYD.DE, Auflage 14.10.2011, Daten ab Auflage). a) Sprungpaar 27.10.2011 (19,06 → 26,82 → 19,00; Fehlkurs) entfernt.
  b) 23.03.2020 −10,4 % bei SPY −2,6 % über dieselben Tage: echt (Corona-Tief, Xetra-Schluss vor dem US-Schluss des 20.03.). c) keine
  Lücken. d) quartalsweise, 2014–2025 je 4, 2026 bis Sept. 3; **2011-12 bis 2013-12 fehlen 9 Zahlungen** (SSGA-Historie; UDVD.L hat
  2013, 2011/12 fehlen dort auch); 18.03.2019 bei Yahoo am Ankündigungstag 11.03.2019 gebucht. Quote 0,38–0,76 %. e) adjclose 0,03/0,00.
  Börsenvergleich (USD): SPYD.DE A −7,05 / B −5,50, UDVD.L −7,14 / −5,49 → Spanne A 0,09, B 0,02 Pp.
- **WTDM** (WTDM.DE, Auflage 03.06.2016, Daten +18 T). a)/b)/e2) keine. c) keine. e3) viele eingefrorene Läufe 2017–2020 (illiquide
  Xetra-Notiz, bis 28 Tage), nicht an Rändern A/B. thesaurierend, Yahoo 0 Ausschüttungen. Börse: DGRA.L B −1,19 (A nicht berechenbar,
  K1b schneidet DGRA.L bis 09.02.2018) → Spanne B 0,02.
- **WTEU** (WTEU.DE, Auflage 21.10.2014). a) 3 Sprungpaare (28.07./02.08.2017, 24.10.2025; USD-Kurs) entfernt. b)/e2) 16 Brüche, alle
  Datenfehler: USD-Kurs-Phase 21.10.2014–25.02.2015 (Austritt 03.03.2015 −10,9 %), Einzeltage 18.06./02.10.2015, Juni–Aug. 2017 täglich
  wechselnd (Austritt 07.08.2017). Monatsenden 31.10.2014 und 31.07.2017 betroffen; Wirkung: Median −6,50 → −6,32, vorn 0/83 unverändert.
  e3) eingefrorene Läufe 2017–2020. d) quartalsweise (2015: 3, sonst 4), Quote 0,59–1,18 %; Anbieterhistorie nicht abrufbar. Börse
  (DHSD.L): A 0,09, B 0,15 Pp.
- **FUSA** (FUSA.DE, Auflage 27.03.2017). e2) Bruch 03.01.2019 −11,1 % nach 18 eingefrorenen Schlüssen → **Anfang verworfen bis
  03.01.2019** (K1b); davor FUSA.DE teils USD-Kurs (17.–31.12.2018) und eingefroren. Die Symbolwahl fiel auf FUSA.DE (Datenbeginn
  03.04.2017), der K1b-Schnitt kommt danach — FUSA.L läge sauber ab 27.03.2017 vor (n 53 statt 32). Zu jung bleibt der Fonds so oder so.
  Börse: FUSA.L B −0,90 → Spanne B 0,04.
- **HDLV** (HDLV.L, Auflage 11.05.2015, ab Auflage). b) 12.03.2020 −11,8 % (SPY −9,6 %) echt. Sonst keine Befunde; HDLV.L stimmt an allen
  Tagen mit HDLV.MI überein. d) quartalsweise, Quote 0,25–1,29 %, letzte Zahlung (10.09.2026, 0,3291 USD) = Invesco. Börse: HDLV.L
  −11,84/−5,68, HDLV.SW −12,15/−5,65, HDLV.MI −11,76/−5,71 → Spanne A 0,39 (HDLV.SW), B 0,06.
- **EXX5** (EXX5.DE, Auflage 28.09.2005, Yahoo erst ab 02.01.2008 → längste Historie). a) Sprungpaare 06.02.2009, 06.05.2011,
  24.10.2025 entfernt. b)/e2) 14 Brüche, alle Datenfehler (USD-Kurs): Phasen 2008 (vielfach), 17.–30.12.2008, Feb. 2009, 24.08.–
  01.09.2010, 02.06.2011, 20.10.–03.12.2014 und **02.–23.09.2026** (EXX5.DE = EXX5.MI × EZB-Kurs 1,15–1,17). **Der B-Endkurs 15.09.2026
  (115,04) ist ein USD-Kurs** (EUR wäre 99,72, EXX5.MI) → B gegen SPY −0,06 statt **−3,24**, gegen SXR8 +0,03 statt **−3,17**;
  „B vorn gegen SXR8" ist falsch. Rand A-Start 03.01.2017 = Vortag (nur Hinweis, EXX5.MI gleichauf). Monatsenden 2008-03/05/06/12,
  2010-08, 2014-10/11 betroffen. d) quartalsweise (2016/2017 je 5 mit Sonderausschüttungen, auch bei iShares); **2008–2013 fehlen 15
  Zahlungen** (iShares-Historie; EXX5.MI ebenso), 15.01.2015 +1,04 % (Kurs). Börse: EXX5.DE A −8,95 / B −0,06, EXX5.MI −8,92 / −3,24 →
  **Spanne B 3,18 Pp = der Datenfehler**.
- **QDVD** (QDVD.DE, Auflage 06.06.2014, +7 T). Keine Kursbefunde (0 markierte Tage gegen QDIV.L). d) halbjährlich (fonds.json sagt
  „quartalsweise" — laut iShares halbjährlich, Yahoo ebenso); **14.08.2025 (0,2569 USD) fehlt** an QDVD.DE und QDIV.L → B −0,56 → −0,45.
  Quote 0,37–1,48 %. Börse: Spanne A 0,07, B 0,03.
- **BBCK** (BBCK.DE, Auflage 24.10.2014). a) 4 Sprungpaare (Juli/Aug. 2017, 24.10.2025) entfernt. e2) 9 Brüche, alle Datenfehler: USD-Kurs
  vom Notierungsbeginn 24.10. bis 03.12.2014 (Austritt 04.12.2014 −19,6 %) und Juni–Aug. 2017. Monatsenden 28.11.2014 und **31.07.2017**
  (USD) → der „schlechteste" Wert −9,33 (Start 2017-07) ist künstlich; ohne die USD-Tage −7,00 (2014-10), vorn 0/83 bleibt. e3) viele
  eingefrorene Läufe 2017–2018. d) quartalsweise, Quote 0,12–1,08 %, letzte Zahlung = Invesco. Börse (BUYB.L): A 0,07, B 0,01.
- **IUS3** (IUS3.DE, Auflage 09.05.2008, ab Auflage). a) Sprungpaar 26.05.2008 (11,38) entfernt. b) 01.12.2008 −10,9 % (SPY −8,9 %),
  12.03.2020 −10,3 % echt. e2) Bruch 02.01.2009 −35,9 % (SPY +4,5 %): Austritt aus einer **USD-Kurs-Phase Mai–Dez. 2008** und Beginn
  eines **60 Tage eingefrorenen Kurses 11,38 (02.01.–26.03.2009)** — beides Datenfehler. Monatsenden 2008-05/07/09/10/11/12 in USD →
  Fenster mit Start 2008 zu schlecht. Rand A-Start 03.01.2017 = Vortag (Hinweis). d) halbjährlich, Quote 0,35–0,65 %; **fehlend: 12
  Zahlungen 2008–2013 und 15.01.2026 (0,5785 USD)** (iShares; IDP6.L hat 2013 und 2026-01). Wirkung beider Fehler: 27/160 → 41/160,
  Median −2,98 → −2,59, B −6,42 → −6,30. Börse (IDP6.L): A 0,06, B 0,12 (= die fehlende Januar-Zahlung).
- **SMLK** (USML.L, Auflage 28.01.2019; SMLK.DE erst ab 14.04.2021). b) 12.03.2020 echt. Keine Befunde. Börse: Spanne B 0,01.
- **ZPRR** (R2US.L, Auflage 30.06.2014; ZPRR.DE erst ab 10.11.2014). b) 12.03.2020 echt. Keine Befunde, stimmt mit ZPRR.DE überein.
  Börse: A 0,10, B 0,03.
- **XRS2** (XRS2.DE, ab Auflage 06.03.2015). a) 24.10.2025 entfernt. e2) 05./06.06.2017 USD-Tag (Datenfehler, ohne Wirkung). USD-Tage
  März/April 2015. Börse (XRSU.L, XRS2.MI): A 0,08, B 0,04.
- **RS2K** (RS2K.PA, Auflage 07.01.2014; RS2K.DE/.MI erst ab März 2018). Keine Befunde; RS2K.PA stimmt mit .DE und .MI überein (0 Tage
  > 5 %). Börse: B 0,02. Hinweis: Auflagedatum stammt vom Vorgänger (fonds.json), die Paris-Reihe reicht bis dahin zurück.
- **SC0K** (SC0K.DE, ab Auflage 31.03.2009). a) 19 Sprungpaare 2010–2013 und 24.10.2025 entfernt. b)/e2) 43 Brüche: USD-Kurs-Phasen
  April 2009, **18.12.2009–04.05.2010 (fast durchgehend)**, viele Einzeltage 2010–2011; außerdem 10.03./25.03.2020 (eingefrorene Kurse
  im Crash, verzögerte echte Bewegung). Monatsenden 2009-09, 2009-12, 2010-02/03/04 in USD → schlechtester −10,00 (2009-09) künstlich
  (ohne USD-Tage −9,61, 2021-02); relativer Rückschlag gegen SXR8 −65,2 % → −50,7 %. Börse (RTYS.L): A 0,09, B 0,01.
- **ZPRV** (ZPRV.DE, ab Auflage 18.02.2015). e2) 20.02.2015 −12,0 % = Austritt aus USD-Kurs (18./19.02.2015), 05./06.06.2017 USD-Tag.
  Relativer Rückschlag gegen SPY −52,3 % (Spitze 19.02.2015 = USD-Tag) → ohne −47,8 %. Börse (USSC.L): A 0,08, B 0,02.
- **SXRG** (CSUSS.MI, Auflage 01.07.2009; SXRG.DE erst ab 01.12.2009). a) 28 Sprungpaare entfernt. b)/e2) 87 Brüche, fast alle
  USD-Kurs-Tage 2010–2017 (Mailand). **Die Reihe beginnt mit USD-Kursen: 01.07.–15.10.2009** (Bruch 16.10.2009 −33,9 %, nicht von K1b
  erfasst, da kein eingefrorener Lauf davor; Kurs/EZB-Kurs schließt nahtlos an). Folge: relativer Rückschlag gegen SPY −62,0 % mit
  Spitze 22.09.2009 ist künstlich; Monatsenden 2010-01, 2014-07, 2016-01, 2016-04 in USD. c) Lücke 31.07.–11.08.2014 (11 T), nicht an
  einem Rand. Mit beiden Reparaturen: gegen SPY 11/145, Median −3,24, Rückschlag −59,2 %; gegen SXR8 5/130, −44,2 %. SXRG.DE (sauber):
  A −4,29 / B −6,09, 3/138. Börse: A 0,02, B 0,01. Index heute ESG/CTB (Wechseldatum offen, fonds.json).
- **QDVC** (QDVC.DE, Auflage 13.10.2016, +11 T). b) 09.03.2020 −12,5 % (SPY −7,8 % über dieselben Tage, Mid-Caps) echt. e3) eingefroren
  06.07.–22.08.2017 (34 T) u. a.; Monatsende 30.11.2016 weicht 5–8 % von IUSZ.L ab (eingefrorener Kurs). Ohne Wirkung. Börse: A 0,08, B 0,00.
- **IS3T** (IS3T.DE, Auflage 03.10.2014, +3 T). a) 6 Sprungpaare Okt.–Dez. 2014 entfernt. e2) 5 Brüche (23.10.2014, 08./11.05.2015,
  05./06.06.2017), USD-Tage — Datenfehler, Wirkung nur am Rückschlag (−61,3 → −60,6 %). Börse (IWSZ.L): A 0,07, B 0,02.
- **GMVM** (GMVM.DE, ab Auflage 16.10.2015). Keine Brüche; USD-Kurs-Tage 16.10.–09.11.2015 (Monatsende 30.10.2015) → 12/71 → 13/71
  ohne sie (gegen SXR8 15 → 16). Index bis 17.12.2021 wie MOAT, danach ESG-Variante (fonds.json). Börse (MOAT.L): A 0,07, B 0,02.
- **VVGM** (VVGM.DE, Auflage 07.07.2020, +2 T). Keine Befunde. Börse (GOAT.L): B 0,02.
- **IBCY** (IFSU.L — einzige Reihe mit Historie, Auflage 04.09.2015). Keine Brüche. e3) eingefrorene Läufe Dez. 2017–Mai 2018. 09.04.2025
  weicht relativ zu SPY 9 % ab: Zeitversatz (US-Rally nach dem Londoner Schluss), echt. Hinweis: IBCY.SG heißt bei Yahoo „iShares
  FactorSelect MSCI USA", BlackRock führt das Produkt 277532 teils schon unter diesem Namen — weiterer Index-/Namenswechsel, kein
  fremder Fonds.
- **GACA** (GACA.DE, Auflage 23.09.2019). e2) Brüche 28.02.2020 und 28.04.2020 nach eingefrorenen Läufen (4/22 T) → Anfang verworfen
  bis 28.04.2020 (K1b). GSLC.L läge ab Auflage vor (n 23 statt 17). Zu jung. Börse: B 0,01.
- **QVMP** (QVMP.DE, Auflage 18.05.2017, +29 T). e2) 07.04.2020 +10,4 % nach eingefrorenem Kurs 06.04. (verzögerte echte Bewegung).
  c) Lücke 20.–31.07.2017 (11 T), nicht an einem Rand. e3) viele eingefrorene Läufe 2017–2019. d) quartalsweise, Quote 0,17–0,53 %,
  letzte Zahlung = Invesco. Zu jung (A nicht berechenbar). Börse (PQVM.L): B 0,01.
- **USFM** (USFM.L in GBp, Auflage 27.04.2017). a) Sprungpaare 29.08.2025 (27,295 = Pfund statt Pence) und 24.10.2025 (USD-Kurs)
  entfernt. e2) 4 Brüche 2017/2018; Anfang verworfen bis 19.06.2018 (36 eingefrorene Schlüsse davor). d) halbjährlich, 19 Zahlungen
  in Pence (Quote 0,32–0,77 %; 2 vor dem neuen Datenbeginn liegen „außerhalb"). **e) adjclose weicht in B um 1,38 Pp p. a. ab:**
  Yahoos adjclose wendet die Pence-Ausschüttungen praktisch nicht an (Anpassungsfaktor je Zahlung ≈ 0,99995 statt ≈ 0,995 — Betrag offenbar als Pfund statt Pence gelesen) — Fehler im
  Kontrollweg, der Hauptweg (Schluss + Ausschüttung, beide in Pence) ist richtig. Einzige Reihe; Zu jung.
- **FLXU** (FLXU.DE, Auflage 06.09.2017, +9 T). Keine Brüche. e3) eingefrorene Läufe 2017–2018. Börse (FRUE.L, FLXU.L in GBP, FLXU.SW in
  CHF): B 0,05. Zu jung.
- **IBCZ** (IBCZ.DE, ab Auflage 04.09.2015). a) 24.10.2025 entfernt. e2) 10.09.2015 (Austritt USD-Kurs der ersten Tage), 05./06.06.2017.
  e3) Rand A-Ende/B-Start 15.09.2021 = Vortag (IFSW.L gleichauf, Spanne B 0,01). Börse: A 0,07, B 0,01.
- **HWWD** (HWWD.L, Auflage 04.07.2014, +4 T; einzige Reihe). Keine Brüche. e3) eingefrorene Läufe Dez. 2017–Sept. 2018. d) quartalsweise,
  Quote 0,24–0,85 %. **Laut HSBC-Factsheet wurde die Strategie am 25.10.2017 von Marktkapitalisierung auf Multifaktor umgestellt** —
  Fenster A und alle Fenster mit Start vor Nov. 2017 messen teils einen breiten Weltfonds (Befund 6).
- **6PSA** (6PSA.DE, Auflage 12.11.2007; Yahoo ab 02.01.2008). e2) 61 Brüche; Anfang verworfen bis 20.08.2009 (eingefrorener Lauf); 49
  Sprungpaare 2010–2013 entfernt; verbleibend 80 Tage, die relativ zu SPY > 7 % abweichen (USD-Kurs-Tage 2009–2013, ohne Zweitnotiz
  gegen den SPY-Verlauf geprüft), darunter die Monatsenden 2010-06, 2011-08, 2013-04 → schlechtester −9,68 (2011-08) künstlich, ohne
  diese Tage −5,78 (2015-09). d) quartalsweise ab 2014 (2014: 5, Termin-Wechsel Jan.→Dez.), Quote 0,27–0,58 %, letzte = Invesco;
  **vor 2014 führt Yahoo keine Ausschüttung**, obwohl die Reihe ab 2009 gilt (Verdacht, ohne Anbieterbeleg). Index seit 23.03.2026
  RAFI US Fundamental Value (fonds.json).
- **SXR8** (Kontrolle; SXR8.DE). Bruch 01.11.2010 nach eingefrorenem Anfang → Reihe ab 01.11.2010 (K1). Sonst sauber; einziger
  auffälliger Tag 09.04.2025 (Zeitversatz, relativer Rückschlag gegen SPY −16,9 % ist dieser eine Tag; ohne ihn −12,2 %).
- **P500** (Kontrolle; SPXS.L gewählt, P500.DE erst ab 25.10.2012). **Bruch 02.01.2014 −99 %** (SPY −1 %): der Fonds hat am 15.12.2025
  im Verhältnis 1:100 gesplittet; Yahoo führt kein Split-Ereignis und hat SPXS.L nur bis 02.01.2014 zurück angepasst (vorher Kurse
  ≈ 300 USD, danach ≈ 3). P500.DE ist gar nicht angepasst (Bruch 15.12.2025, 1152,70 → 11,57 EUR) → dort B −67,73. Lücke SPXS.L
  02.–14.07.2014 (12 T), nicht an einem Rand. Börse: A 0,09; B 67,87 (P500.DE) bzw. 0,02 nach Split-Korrektur.

## (3) Factsheet-Stichproben (`factsheet-g5.json`)

26 von 30 Fonds mit Anbieterwert; nicht erreichbar: XRS2 (DWS lädt Zahlen nur per Skript, Factsheet ohne Wertentwicklung), GACA
(GSAM, nur per Skript), USFM (UBS), FLXU (Franklin). Alle Anbieterwerte sind NAV in USD (RS2K: EUR) zum 30.09.2026 (iShares, Invesco,
VanEck) bzw. 31.08.2026 (SSGA, WisdomTree, HSBC, Amundi); unsere Werte aus der Börsennotiz, in die Anbieterwährung umgerechnet.

| Fonds | Symbol | Stichtag | Anbieter 5J p. a. | unser | Abw. Pp |
|---|---|---|---|---|---|
| SPYD | SPYD.DE | 31.08.2026 | 6,92 | 6,83 | −0,09 |
| WTDM | WTDM.DE | 31.08.2026 | 11,43¹ | 11,20 | −0,23 |
| WTEU | WTEU.DE | 31.08.2026 | 10,88¹ | 10,67 | −0,21 |
| FUSA | FUSA.DE | 02.10.2026² | 12,74 (GBP) | 12,91 | +0,17 |
| HDLV | HDLV.L | 30.09.2026 | 6,26 | 6,13 | −0,13 |
| EXX5 | EXX5.DE | 30.09.2026 | 8,56 | 8,47 | −0,09 |
| QDVD | QDVD.DE | 30.09.2026 | 12,53 | 12,37 | −0,16 |
| BBCK | BBCK.DE | 30.09.2026 | 10,82 | 10,85 | +0,03 |
| IUS3 | IUS3.DE | 30.09.2026 | 5,63 | 5,35 | −0,28 |
| SMLK | USML.L | 30.09.2026 | 6,07 | 5,92 | −0,15 |
| ZPRR | R2US.L | 31.08.2026 | 6,41 | 6,72 | **+0,31** |
| RS2K | RS2K.PA | 31.08.2026 | 6,76 (EUR) | 6,72 | −0,04 |
| SC0K | SC0K.DE | 30.09.2026 | 5,97 | 5,91 | −0,06 |
| ZPRV | ZPRV.DE | 31.08.2026 | 11,26 | 11,12 | −0,14 |
| SXRG | CSUSS.MI | 30.09.2026 | 6,36 | 6,20 | −0,16 |
| QDVC | QDVC.DE | 30.09.2026 | 5,72 | 5,70 | −0,02 |
| IS3T | IS3T.DE | 30.09.2026 | 5,87 | 5,91 | +0,04 |
| GMVM | GMVM.DE | 30.09.2026 | 4,32 | 4,27 | −0,05 |
| VVGM | VVGM.DE | 30.09.2026 | 7,10 | 6,99 | −0,11 |
| IBCY | IFSU.L | 30.09.2026 | 12,74 | 12,65 | −0,09 |
| QVMP | QVMP.DE | 30.09.2026 | 14,16 | 14,05 | −0,11 |
| IBCZ | IBCZ.DE | 30.09.2026 | 12,41 | 12,42 | +0,01 |
| HWWD | HWWD.L | 31.08.2026 | 11,60 | 11,82 | +0,22 |
| 6PSA | 6PSA.DE | 30.09.2026 | 12,96 | 12,92 | −0,04 |
| SXR8 | SXR8.DE | 30.09.2026 | 13,48 | 13,42 | −0,06 |
| P500 | SPXS.L | 30.09.2026 | 13,69 | 13,66 | −0,03 |

¹ WisdomTree nennt keine 5-J-Zahl; aus den fünf rollierenden 12-Monats-Renditen des Factsheets verkettet. ² Fidelity-UK-Plattform,
Stichtag nicht genannt, Währung erschlossen (Factsheet-PDF HTTP 403) — nur eingeschränkt verwertbar; mit Stichtag 30.09. −0,17.

Spanne −0,28 bis +0,31 Pp p. a., Median −0,08. Systematisch leicht negativ: Börsenkurs gegen NAV (Spanne/Zeitversatz) und bei
ausschüttenden Fonds die fehlenden Yahoo-Zahlungen. **Auffällig (|Abw.| ≥ 0,30) nur ZPRR (+0,31):** London war am 31.08.2026
geschlossen (Feiertag), unser Endkurs ist der 28.08.; dieselbe Anteilsklasse an Xetra (ZPRR.DE, Endkurs 31.08.) ergibt 6,30 (−0,11).
HWWD (+0,22) hat dieselbe Ursache. **IUS3 (−0,28)**: knapp darunter; die bei Yahoo fehlende Zahlung vom 15.01.2026 erklärt 0,12 Pp
(mit ihr 5,47, −0,16). QDVD mit der fehlenden Zahlung 14.08.2025: 12,47 (−0,06).

## (4) Befunde für den Projektleiter

1. **EXX5.DE B-Endkurs ist ein USD-Kurs (Datenfehler mit Wirkung auf Fenster B).** Yahoo EXX5.DE 02.–23.09.2026 = EUR-Kurs × EZB-Kurs
   (z. B. 15.09.2026: 115,0361 gegen EXX5.MI 99,72; Verhältnis 1,1536, EZB 1,1539). Wirkung: B gegen SPY −0,06 → −3,24 Pp p. a., gegen
   SXR8 +0,03 → −3,17 (das Kriterium „B vorn gegen SXR8" kippt von ja auf nein). Urteil unverändert (A −8,95). Vorschlag: Kurse
   02.–23.09.2026 durch den EZB-Kurs teilen oder EXX5.MI als Gegenprobe; Quelle: Rohdateien EXX5.DE/EXX5.MI, EZB-USD.csv.
2. **P500/SPXS.L: unverbuchter Split 1:100 (15.12.2025)** — Beleg: Invesco-Mitteilung (FFB FondsSpotNews 506/2025,
   https://www.bca.de/wp-content/uploads/2025/11/FFB-FondsSpotNews_506_2025_Invesco.pdf; Hauptversammlung 23.10.2025). Yahoo hat SPXS.L
   nur ab 02.01.2014 angepasst (Kurs 303,05 → 3,02), P500.DE gar nicht (15.12.2025: 1152,70 → 11,57). Wirkung in der Kontrolle P500
   (SPXS.L): A/B richtig; rollierend gegen SXR8 88/130 → **107/130 (82,3 %)**, Median +0,14 → +0,15, schlechtester −72,29 → −0,39;
   gegen SPY 29/136 → 30/136, schlechtester −70,87 → −0,88; relativer Rückschlag −99 % → −15,5 % (SPY) bzw. −8,3 % (SXR8). Für die
   Eichung (C6/C7) heißt das: die Swap-Bauform lag gegen SXR8 in A, B **und** > 80 % der Fenster vorn.
3. **Systematisch: Yahoo führt an EUR-Notizen (Xetra, Mailand) Tage/Wochen mit dem USD-Kurs.** Keine Wirkung auf A/B außer Befund 1,
   aber auf Monatsenden und Rückschläge: BBCK schlechtester −9,33 → −7,00; SC0K schlechtester −10,00 → −9,61, Rückschlag gegen SXR8
   −65,2 → −50,7 %; ZPRV Rückschlag gegen SPY −52,3 → −47,8 %; IUS3/EXX5/6PSA/SXRG siehe (2). **SXRG/CSUSS.MI** beginnt mit 3½ Monaten
   USD-Kursen (01.07.–15.10.2009, Bruch 16.10.2009 −33,9 %, K1b greift nicht, weil kein eingefrorener Lauf vorausgeht) → Rückschlag
   gegen SPY −62 % mit Spitze 22.09.2009 künstlich. Kein Urteil ändert sich. Liste der Tage je Fonds: `kratz-g5/quervergleich2-out.json`.
4. **Fehlende Ausschüttungen (nachgewiesen, Anbieterhistorie)** — als benannte Ergänzungen in `ergaenzungen-g5.json` (41 Einträge:
   39 fehlt, 1 streichen, 1 ersetzen): SPYD.DE 9 Zahlungen 2011–2013 (+ 18.03.2019 am falschen Tag), EXX5.DE 15 Zahlungen 2008–2013,
   IUS3.DE 12 Zahlungen 2008–2013 und **15.01.2026** (in B), QDVD.DE **14.08.2025** (in B). Wirkung (Rechner mit Ergänzungen):
   SPYD 0/119 → 2/119 (SXR8 3 → 7); EXX5 2/164 → 12/164, schlechtester −13,68 → −10,57; IUS3 B −6,42 → −6,30, 27/160 → 35/160;
   QDVD B −0,56 → −0,45 (SXR8 −0,47 → −0,37). Kein Urteil ändert sich. **Verdacht ohne Beleg:** 6PSA.DE führt erst ab 2014
   Ausschüttungen (Reihe gilt ab 2009) — Invesco zeigt nur die jüngste Zahlung; Fenster mit Start 2009–2013 wären dann um bis zu
   rund 2–3 % Rendite p. a. der fehlenden Jahre zu schlecht (nicht gerechnet, keine Anbieterzahlen).
5. **Symbolwahl vor dem K1b-Schnitt:** bei FUSA (FUSA.DE, Schnitt bis 03.01.2019; FUSA.L sauber ab 27.03.2017) und GACA (GACA.DE,
   Schnitt bis 28.04.2020; GSLC.L ab 23.09.2019) wird die Reihe gewählt, die nach dem Schnitt kürzer ist (n 32 statt 53 bzw. 17 statt 23).
   Beide bleiben „zu jung"; nur Hinweis zur Regel C6 (Wahl hängt am Rohbeginn, nicht am gültigen Beginn).
6. **HWWD: Strategiewechsel 25.10.2017** (Marktkapitalisierung → Multifaktor, Quelle HSBC-Factsheet 31.08.2026,
   https://www.assetmanagement.hsbc.co.uk/api/v1/download/document/ie00bkzgb098/gb/en/factsheet). Fenster A (ab 03.01.2017) und die
   Fenster mit Start vor Nov. 2017 messen teils einen breiten Weltfonds — vergleichbar dem in B3 ausgeschlossenen HSBC-Quality-Fonds.
   Urteil „nicht verlässlich vorn" unberührt (0/86, B −1,20).
7. **USFM.L adjclose:** Yahoos adjclose ignoriert die Pence-Ausschüttungen (Abgleich B 1,38 Pp p. a.); der Hauptweg ist richtig — kein
   Handlungsbedarf, nur Erklärung der Abweichung > 0,10.
8. Kleinere Hinweise: fonds.json nennt QDVD „quartalsweise", iShares und Yahoo zeigen halbjährlich; IBCY wird bei BlackRock teils schon
   als „iShares FactorSelect MSCI USA UCITS ETF" geführt (erneuter Indexwechsel möglich); Rückschläge UCITS gegen SPY haben ihr Tal oft
   am 09.04.2025 (Zeitversatz: US-Rally nach Europa-Schluss).
