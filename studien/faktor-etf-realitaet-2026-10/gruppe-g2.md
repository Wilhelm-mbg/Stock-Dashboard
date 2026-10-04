# Gruppe g2 – Faktor-ETF-Realitätsprobe 2026-10 (Value, Wachstum, Momentum)

> **Hinweis des Projektleiters (Endstand):** Dieser Gruppenbericht entstand beim Laden und Prüfen, also VOR den Korrekturen nach dem Siegel (benannte Ausschüttungs-Ergänzungen C2, USD-Werte in EUR-Reihen K2, Faktor-100-Brüche K3). Die Prüfbefunde gelten; einzelne Zahlen in den Tabellen hier können davon abweichen. Maßgeblich sind `ERGEBNIS.md` und `ergebnis.json`; `gruppe-gN.json` ist mit dem Endstand neu gerechnet.


Kennung `faktor-etf-realitaet-2026-10/v1`, Stand 2026-10-05. Rechner `rechnen.js` in der Fassung mit Korrektur K1b (Commit 194c1b9), Datenende 15.09.2026.
Zahlen in Tabelle 1 sind per Skript (`kratz-g2/bericht-schreiben.js`) aus `gruppe-g2.json` abgeschrieben. Abstände in Prozentpunkten p. a., Fonds minus SPY.
Beschreibende Zahlen nach vorab festgelegter Regel – keine Anlageberatung.

**Urteile:** nicht verlässlich vorn: VLUE, IWD, RPV, IWF, MTUM, QMOM, PDP, IVE*, VTV*, VUG*; verlässlich vorn: QQQ, SPMO, IVW*, SCHG*, MGK* (* = Zusatz B2).

## 1. Ergebnis je Fonds (gegen SPY, Gesamtertrag Schluss + Ausschüttungen)

| Fonds | Teil | Daten ab | Urteil | Abstand A | Abstand B | Fenster vorn/n (Anteil) | Median | schlechtester (Start) | größter Rückschlag gg. SPY |
|---|---|---|---|---|---|---|---|---|---|
| VLUE | Auftrag (B1) | 18.04.2013 | nicht verlässlich vorn | −6,65 | +4,52 | 4/101 (4,0 %) | −4,59 | −8,23 (2019-12) | −41,7 % (2014-04-04 → 2024-12-24) |
| IWD | Auftrag (B1) | 26.05.2000 | nicht verlässlich vorn | −7,47 | −0,89 | 56/256 (21,9 %) | −1,41 | −7,58 (2016-11) | −45,1 % (2007-04-02 → 2025-10-29) |
| RPV | Auftrag (B1) | 07.03.2006 | nicht verlässlich vorn | −9,66 | −0,27 | 75/186 (40,3 %) | −1,10 | −11,47 (2015-08) | −48,0 % (2007-02-27 → 2009-03-06) |
| IWF | Auftrag (B1) | 26.05.2000 | nicht verlässlich vorn | +7,33 | −1,18 | 202/256 (78,9 %) | +1,39 | −8,01 (2000-06) | −39,6 % (2000-07-17 → 2006-08-09) |
| QQQ | Auftrag (B1) | 10.03.1999 | verlässlich vorn | +10,89 | +1,34 | 228/270 (84,4 %) | +4,15 | −17,72 (2000-02) | −70,3 % (2000-03-10 → 2002-09-05) |
| MTUM | Auftrag (B1) | 18.04.2013 | nicht verlässlich vorn | +3,97 | −0,86 | 50/101 (49,5 %) | −0,13 | −5,33 (2018-05) | −29,8 % (2021-02-12 → 2023-07-26) |
| SPMO | Auftrag (B1) | 12.10.2015 | verlässlich vorn | +3,20 | +6,63 | 61/71 (85,9 %) | +2,00 | −2,46 (2018-07) | −19,4 % (2022-11-03 → 2023-07-18) |
| QMOM | Auftrag (B1) | 02.12.2015 | nicht verlässlich vorn | −0,61 | −4,82 | 21/69 (30,4 %) | −1,60 | −10,72 (2021-01) | −46,6 % (2021-02-12 → 2025-11-21) |
| PDP | Auftrag (B1) | 01.03.2007 | nicht verlässlich vorn | +0,92 | −5,38 | 41/174 (23,6 %) | −1,60 | −8,26 (2020-12) | −37,0 % (2008-06-23 → 2025-11-21) |
| IVE | Zusatz (B2) | 26.05.2000 | nicht verlässlich vorn | −6,85 | −1,11 | 45/256 (17,6 %) | −1,62 | −7,01 (2016-11) | −40,5 % (2007-05-17 → 2026-06-01) |
| VTV | Zusatz (B2) | 30.01.2004 | nicht verlässlich vorn | −6,17 | −0,14 | 19/212 (9,0 %) | −1,28 | −6,18 (2016-11) | −35,6 % (2007-05-25 → 2025-11-03) |
| IVW | Zusatz (B2) | 26.05.2000 | verlässlich vorn | +5,68 | +0,14 | 208/256 (81,3 %) | +1,00 | −5,34 (2000-06) | −29,5 % (2000-07-17 → 2007-05-15) |
| VUG | Zusatz (B2) | 30.01.2004 | nicht verlässlich vorn | +7,19 | −0,68 | 197/212 (92,9 %) | +1,52 | −0,70 (2021-02) | −21,7 % (2020-09-01 → 2023-01-05) |
| SCHG | Zusatz (B2) | 04.01.2010 | verlässlich vorn | +7,51 | +0,36 | 137/140 (97,9 %) | +2,07 | −0,15 (2011-06) | −20,8 % (2021-11-19 → 2023-01-06) |
| MGK | Zusatz (B2) | 27.12.2007 | verlässlich vorn | +8,08 | +0,38 | 161/165 (97,6 %) | +1,66 | −0,52 (2011-11) | −23,0 % (2020-09-01 → 2023-01-05) |

Fenster A = 04.01.2017–15.09.2021, B = 16.09.2021–15.09.2026; rollierend = alle 5-Jahres-Fenster Monatsende zu Monatsende ab dem Monat des ersten Kurses (REGEL C3/C4).
Nötige Zahl vorn für 80 % bei den Fonds „verlässlich vorn“: QQQ 216 von 270 (hat 228), SPMO 57 von 71 (hat 61), IVW 205 von 256 (hat 208), SCHG 112 von 140 (hat 137), MGK 132 von 165 (hat 161).

## 2. Prüfbefunde je Fonds (REGEL C7, Auftrag Schritt 3 a–e3)

Gemeinsam für alle 15 Reihen: **keine Sprungpaare** (a), **keine Lücken über 7 Kalendertage** (c), keine Zeilen ohne Schluss,
keine doppelten Daten, keine Ausschüttung verschoben oder außerhalb der Reihe. An **keinem** Rand von A oder B ist der Schluss gleich
dem Vortag (e3, `randGleichVortag` überall false). **Abgleich adjclose (e): größte Differenz 0,018 Pp p. a.** (RPV, Fenster A), also bei allen Reihen
unter 0,10 Pp. Tagesbewegungen über 10 % (b) fallen bei allen Fonds in dieselben Markttage wie bei SPY (Okt. 2008, März 2020,
09.04.2025), sofern unten nichts anderes steht. Prüfskripte: Kratzordner `kratz-g2/` (aussch-pruefen.js, vergleich-anbieter.js,
jahre-vergleich.js, roll-nav-probe.js, nav-fenster.js, stale-monatsenden.js, korrektur-wirkung.js).

**Gegenprobe mit den Anbietern (d):** Die Ausschüttungshistorie jedes Fonds habe ich mit der Liste des Anbieters verglichen: Invesco-API
(QQQ, RPV, SPMO, PDP), iShares-Fondsdokument (VLUE, IWD, IWF, IVE, IVW, MTUM), Schwab-Fondsseite (SCHG, ab 12/2016) und
Alpha-Architect-Fondsseite (QMOM). Vanguard liefert nur die letzten sechs Zahlungen. Für VTV, VUG und MGK habe ich deshalb die
**Kalenderjahres-Renditen 2011–2025** mit den Marktpreis-Renditen von Vanguard verglichen; dieser Vergleich deckt eine fehlende
Zahlung als Jahresabweichung auf. Für die iShares-Fonds liegen dazu Monatsrenditen auf NAV-Basis seit Auflage vor. Kapitalgewinne
meldet Yahoo bei keinem der 15 Fonds getrennt. Laut den Anbietern zahlten **PDP und QMOM nie Kapitalgewinne**: bei Invesco sind die
KG-Felder 0 oder leer, bei Alpha Architect sind alle 15 Zahlungen „Income“. In den vorliegenden Anbieterlisten
(Invesco, iShares, Schwab ab 12/2016, Alpha Architect) stehen Kapitalgewinne nur am 13.12.2000 bei IVW, IWF und IVE. Yahoo führt sie in
der Dividende mit, die Beträge stimmen. Für Vanguard fehlt die volle Liste; die Jahresrenditen 2011–2025 zeigen außer MGK 2014 keine Lücke. Die Jahre 2004–2010 sind
für VTV, VUG und MGK gegen den Anbieter nicht geprüft.

**VLUE** (Auflage 16.04.2013 laut iShares, Daten ab 18.04.2013). b) 12.03./16.03./24.03.2020 mit SPY (−11,3/−12,7/+10,0 gegen
−9,6/−10,9/+9,1): echt. d) Quartalsweise, 54 Zahlungen (2015: 5 mit Zusatz 29.12.2015, der auch bei iShares steht; 2016: 3).
**Yahoo fehlt die Zahlung Ex 23.03.2016 über 0,433562 $ (0,70 %).** Belegt durch das iShares-Fondsdokument, Blatt Distributions.
Sie wirkt nur auf rollierende Fenster mit Start 04/2013–02/2016. Mit der Zahlung: 5 statt 4 von 101 Fenstern vorn; A und B
bleiben unberührt. Kalenderjahr 2016 gegen iShares-NAV: −1,14 Pp (die fehlende Zahlung plus Kurs/NAV). Keine Splits. e) +0,007/+0,008.
e3) Eingefroren 27.08.–05.09.2013 (7 Tage) und 10.–16.09.2013 (5 Tage), Anlaufphase. Betroffen ist das Monatsende 30.08.2013
(3 Tage alt, SPY seitdem +0,2 %), ohne Belang. NAV-Gegenprobe A/B: −6,649/+4,527 gegen Kurs-Weg −6,651/+4,516.

**IWD** (Auflage 22.05.2000, Daten ab 26.05.2000). b) 13.10./28.10.2008 und 12.03./16.03./24.03.2020 mit SPY: echt. d) Quartalsweise,
107 Zahlungen. **Yahoo führt zusätzlich am 16.12.2003 0,278 $ (0,50 %).** In der iShares-Historie fehlt diese Zahlung. Der echte
Dezember-Termin 12.12.2003 mit 0,35729 $ steht bei Yahoo ebenfalls und stimmt; es ist also eine **Phantombuchung**. Sie wirkt nur
auf Fenster mit Start bis 11/2003. Ohne sie bleibt alles gleich: 56/256 vorn, Median unverändert. Die ROC-Anteile 2006–2007 stecken
in den Gesamtbeträgen. Kalenderjahr 2003 gegen NAV: +1,01 Pp, davon 0,50 die Phantombuchung. Weitere Jahre 2001–2009 weichen um
±0,3–0,5 Pp ab; das ist Kurs gegen NAV, die Jahre heben sich gegenseitig auf. e) +0,006/+0,008. NAV-Gegenprobe A/B:
−7,477/−0,886 gegen Kurs-Weg −7,474/−0,888.

**RPV** (Auflage 01.03.2006 laut Invesco, Daten ab 07.03.2006). b) 9 Bewegungen: 09.10.2008 (−11,7 gegen SPY −7,0), 24.11.2008
(+11,1/+6,9), 23.03.2009 (+12,0/+7,2), 09.04.2009 (+10,3/+4,0; Gewinnvorwarnung von Wells Fargo, Finanzwerte stark),
09./12./13./16./24.03.2020. Alle laufen gleichgerichtet und an Krisentagen. RPV ist ein Tiefwert-Fonds mit hohem Beta und hohem
Finanzanteil, die Bewegungen sind echt; keine davon ist ein Bruch. d) Quartalsweise, 79 Zahlungen; 2020: 3, 2021: 3.
**Yahoo fehlen die Zahlungen Ex 21.09.2020 über 0,29885 $ (0,58 %) und Ex 20.09.2021 über 0,41952 $ (0,55 %).** Belegt durch die
Invesco-Ausschüttungshistorie, die ab 2008 reicht. Die Yahoo-Zahlungen 2006–2007 lassen sich gegen die Invesco-Liste nicht prüfen.
Mit den beiden Zahlungen: A −9,656 → −9,515, **B −0,271 → −0,143 (bleibt hinten)**, 75/186 unverändert. e) +0,018/−0,005.

**IWF** (Auflage 22.05.2000, Daten ab 26.05.2000). b) 13.10.2008, 16.03.2020 und 09.04.2025 mit SPY: echt. d) Quartalsweise,
108 Zahlungen. 2003: 5 und 2018: 5; der Zusatz 28.12.2018 mit 0,00625 $ steht auch bei iShares. **Phantombuchung am 16.12.2003
über 0,02325 $ (0,21 %)**, nicht in der iShares-Historie. Ohne sie: 202/256 unverändert, schlechtestes Fenster −8,014 → −8,051.
**Split 4:1 am 29.04.2026:** Schluss stetig (−0,23 % bei SPY −0,02 %). Ausschüttung je Vortagsschluss vorher 0,088 %
(17.03.2026), nachher 0,088 % (15.06.2026), also stetig. Kalenderjahre gegen NAV: 2003 +0,68 (Phantombuchung plus Kurs/NAV),
2005 −0,34, 2008 +0,26 (Kurs/NAV). e) +0,005/+0,002.

**QQQ** (Auflage 10.03.1999, Daten ab 10.03.1999). **Gerechnet nach Korrektur K1b:** die Reihe beginnt am 10.03.1999; es gilt nur
diese Zahl. b) Zehn Bewegungen über 10 %. Sechs davon fallen auf Nasdaq-Tage der Dotcom-Zeit ohne gleich große SPY-Bewegung:
07.01.2000 (+12,4/+5,8), 17.04.2000 (+11,5/+3,5), 30.05.2000 (+10,1/+3,3), 03.01.2001 (+16,8/+4,8; Zinssenkung der Fed außer der
Reihe), 18.04.2001 (+10,4/+4,0; zweite Zinssenkung außer der Reihe) und 08.05.2002 (+10,7/+3,7). Die Kurse laufen in 1/16-Schritten,
die Nachbartage zeigen keine Gegenbewegung: **echte Bewegungen des Nasdaq-100**. e2) Brüche 17.04.2000 und 03.01.2001: es ging kein
eingefrorener Lauf voraus (`eingefrorenVorher` 1), daher nach K1b nur gelistet. Beide sind echte Marktbewegungen, siehe b. d)
Ausschüttungen erst ab 24.12.2003; auch die Invesco-Liste beginnt dort. Quartalsweise, 90 Yahoo-Zahlungen gegen 89 bei Invesco.
**Yahoo fehlt Ex 21.09.2020 über 0,38824 $ (0,15 %). Zusätzlich bei Yahoo: 25.06.2010 mit 0,089 $, die Doppelbuchung der Zahlung
vom 18.06.2010, und 27.12.2011 mit 0,049 $, nicht in der Invesco-Liste. Am 18.12.2009 steht 0,073 statt 0,0776 $.** Die Zahlung
vom 27.12.2023 über 0,216 $ ist eine echte Sonderausschüttung (steht bei Invesco). Mit allen vier Korrekturen: A +10,893 → +10,933,
B unverändert, 228/270 unverändert, Median 4,146 → 4,115. **Split 2:1 am 20.03.2000:** Schluss stetig (−2,8 % bei SPY −0,5 %,
Nasdaq-Tag), vor Beginn der Ausschüttungen. e) +0,001/−0,002.

**MTUM** (Auflage 16.04.2013, Daten ab 18.04.2013). b) 16.03./24.03.2020 und 09.04.2025 mit SPY: echt. d) Quartalsweise; 54 Zahlungen
bei Yahoo, 54 bei iShares, **alle gleich**. Kalenderjahr 2019 gegen NAV: −0,31 Pp (Kurs/NAV). e) +0,003/+0,007. NAV-Gegenprobe
A/B: +3,953/−0,842 gegen Kurs-Weg +3,973/−0,858; rollierend nach NAV 50/101, kein Fenster anders entschieden.

**SPMO** (Auflage 09.10.2015 laut Invesco, Daten ab 12.10.2015). b) 16.03.2020 −15,35 % (SPY −10,94), 17.03.2020 +10,21 % (+5,40) und
09.04.2025 +11,20 % (+10,50). Alle gleichgerichtet und kein Bruch. Der 16./17.03.2020 ist auch kein Sprungpaar (Produkt 0,933): der
Momentum-Index fiel stärker, der Fonds war damals klein. d) Quartalsweise. **Yahoo fehlen Ex 18.03.2016 über 0,0493 $ (0,20 %),
Ex 21.09.2020 über 0,16846 $ (0,35 %) und Ex 20.09.2021 über 0,06993 $ (0,11 %).** Belegt durch die Invesco-Historie; dazu kommt
16.06.2017 mit Betrag 0. Mit den drei Zahlungen: A +3,201 → +3,292, B +6,629 → +6,656, 61/71 unverändert, Median 2,002 → 2,091.
**e3) Eingefroren: 42 Läufe von 01.12.2015 bis 04.10.2017**, bis zu 32 Handelstage, z. B. 25.07.–07.09.2016. Der Fonds wurde in
den ersten zwei Jahren kaum gehandelt. Die Monatsenden 11/2015–09/2017 sind oft Tage bis Wochen alt; 31.08.2016 ist 27 Handelstage alt.
Der A-Start 03.01.2017 ist ein frischer Schluss, liegt aber mit 27,00 unter dem Vortag (27,16) und dem Folgetag (27,165). Das
begünstigt A um etwa 0,6 %, also rund 0,1 Pp p. a.; A liegt mit +3,2 vorn. Rollierend: alle 25 Fenster mit Start in der illiquiden
Zeit liegen mit mindestens 0,53 Pp p. a. vorn. Die vier knappsten (Start 2016-02 bis 2016-05) haben alte Startkurse, während SPY
seitdem um −0,2 bis −1,4 % fiel; der wahre Startwert lag also eher tiefer und der Abstand eher höher. Für einen Urteilswechsel
müssten 5 Fenster kippen (61 → 56, nötig 57). Das ist nicht plausibel. e) +0,005/−0,010.

**QMOM** (Auflage 01.12.2015 laut Alpha Architect, Daten ab 02.12.2015). b) 16.03./24.03.2020 mit SPY. **09.03.2021 +10,22 % bei
SPY +1,43 %: ein Bruch nach den ersten 730 Tagen, daher nur gelistet.** Einordnung: **echtes Fondsereignis.** Am Tag schnellten
Wachstums- und Momentumwerte zurück (Nasdaq +3,7 %). Vorher fiel QMOM −3,8/−7,0/−7,1/−0,1/−5,1 % (02.–08.03.), danach +0,6/+6,5 %;
es gibt weder Gegenbewegung noch eingefrorenen Kurs. Der Fonds hält etwa 50 konzentrierte Momentumwerte. Der Tag liegt in Fenster A
und in rollierenden Fenstern und zählt dort als echte Rendite. d) Anfangs quartalsweise, ab 2018 jährlich im Dezember. 15 Zahlungen
bei Alpha Architect, 13 bei Yahoo. Es fehlen nur 28.12.2015 mit 0,002 $ und 21.03.2016 mit 0,003 $ (zusammen 0,02 %, ohne Wirkung).
Alle übrigen Beträge stimmen, auch die großen von 2022 (0,7294 $) und 2024 (0,9009 $); laut Anbieter sind es Erträge, keine
Kapitalgewinne. e3) Eingefroren 23.–31.12.2015, 22.–29.03.2016 und 30.10.–03.11.2017. Das Monatsende 31.12.2015 ist 5 Tage alt
(SPY seitdem −1,0 %); die Ränder A/B sind frisch. e) +0,007/−0,005.

**PDP** (Auflage 01.03.2007, Daten ab 01.03.2007). b) 13.10.2008 (+11,2/+14,5), 01.12.2008 (−10,2/−8,9) und 16.03./24.03.2020: echt.
d) Unregelmäßig: Invesco hat vierteljährliche Termine, oft mit 0 $. 44 Yahoo-Zahlungen stehen 51 Invesco-Terminen ab 21.09.2007
gegenüber. **Alle Zahlungen über 0 $ sind bei Yahoo vorhanden und gleich.** Die 7 fehlenden Termine haben 0 $ (2021 und 2026 ohne
Ausschüttung). Keine Kapitalgewinne. e) +0,001/−0,000.

**IVE** (Auflage 22.05.2000, Daten ab 26.05.2000). b) 28.10.2008 und 12.03./16.03.2020 mit SPY. d) Quartalsweise, 107 Zahlungen.
**Phantombuchung am 16.12.2003 über 0,215 $ (0,41 %).** Der echte Termin 15.12.2003 mit 0,272175 $ steht bei iShares und bei Yahoo.
Kapitalgewinn 13.12.2000 0,1472 $ ist im Yahoo-Betrag enthalten. Ohne die Phantombuchung: 45/256 unverändert. Kalenderjahre gegen
NAV: 2001/2007/2008/2009 je ±0,3–0,4 Pp, im Wechsel (Kurs/NAV). e) +0,007/+0,008. NAV-Gegenprobe A/B −6,846/−1,113 gegen Kurs-Weg
−6,846/−1,111.

**VTV** (Auflage 26.01.2004, Daten ab 30.01.2004). b) 28.10.2008 und 12.03./16.03.2020 mit SPY. d) Quartalsweise, 91 Zahlungen,
jedes volle Jahr vier. Die letzten 6 Vanguard-Zahlungen stimmen. Kalenderjahre 2011–2025 gegen die Vanguard-Marktpreis-Rendite:
**alle |Abweichung| ≤ 0,18 Pp**, also keine fehlende Zahlung. e) −0,012/+0,003.

**IVW** (Auflage 22.05.2000, Daten ab 26.05.2000). b) 28.10.2008, 16.03.2020 und 09.04.2025 mit SPY. d) Quartalsweise; 107
Zahlungen bei Yahoo, 107 bei iShares, **alle Beträge gleich**, einschließlich des Kapitalgewinns 13.12.2000. **Split 4:1 am
19.10.2020:** Schluss stetig (−1,61 % bei SPY −1,52 %). Ausschüttung je Vortagsschluss vorher 0,239 % (23.09.2020), nachher
0,231 % (14.12.2020), stetig. Die split-bereinigten iShares-Beträge sind gleich den Yahoo-Beträgen. Kalenderjahre gegen NAV: nur
2001 mit +0,39 Pp. e) +0,005/+0,002. **Gegenprobe NAV:** A/B aus iShares-NAV und Ausschüttungen ergeben +5,678/+0,143, der
Kurs-Weg +5,680/+0,144. Rollierend aus den iShares-NAV-Monatsrenditen: 208/256 vorn, **kein Fenster anders entschieden**.

**VUG** (Auflage 26.01.2004, Daten ab 30.01.2004). b) 13.10./15.10./28.10.2008, 16.03.2020 und 09.04.2025 mit SPY. d) Quartalsweise,
91 Zahlungen, jedes volle Jahr vier. **Split 6:1 am 21.04.2026:** Schluss stetig (−0,73 % bei SPY −0,65 %). Ausschüttung je
Vortagsschluss vorher 0,110 % (27.03.2026), nachher 0,111 % (26.06.2026). Vanguard zahlte am 27.03.2026 0,4778 $ je alten Anteil;
geteilt durch 6 ergibt das 0,0796 $, Yahoo hat 0,079667 $. Kalenderjahre gegen Vanguard-Marktpreis: 2019 −0,23 Pp (allein der
Kursanteil: 35,61 gegen 35,84 % NAV-Kapitalrendite), sonst ≤ 0,14. Wirkung auf A unter 0,05 Pp p. a. e) −0,002/+0,001.

**SCHG** (Auflage 11.12.2009, **Daten erst ab 04.01.2010**). Das erste mögliche Fenster mit Start 2009-12 fehlt deshalb; ohne Belang.
b) 16.03.2020 und 09.04.2025 mit SPY. d) Quartalsweise mit Zusätzen zum Jahresende (2010, 2018, 2021, 2023 je 5). Gegen die
Schwab-Liste von 12/2016 bis 09/2026 stehen **43 von 43 Zahlungen mit gleichem Betrag** bei Yahoo, nachdem beide Splits herausgerechnet
sind. 2016 hat Yahoo nur 3 Zahlungen; **Q1 2016 fehlt vermutlich**. Belegen lässt sich das nicht, weil die Schwab-Liste erst 12/2016
beginnt. Die Lücke beträfe Fenster mit Start 2011-03 bis 2016-02, darunter die beiden knapp hinten liegenden 2011-07 (−0,014) und
2012-02 (−0,005); sie würden eher zu „vorn“ kippen. **Splits 2:1 am 11.03.2022 und 4:1 am 11.10.2024:** Schluss stetig (−2,22 % bei
SPY −1,27 %; +0,31 % bei SPY +0,60 %). Die Schwab-Rohbeträge geteilt durch 8 bzw. 4 ergeben genau die Yahoo-Beträge; die Ausschüttung
je Vortagsschluss ist stetig. Die Schwab-Seite erwähnt nur den Split 2024. Den 2:1-Split 2022 belegen die Rohbeträge (vor 03/2022
doppelt so hoch je Anteil) und das Factsheet: das 5-Jahres-Fenster 31.08.2021–31.08.2026 überspannt beide Splits und weicht nur um
+0,002 ab. e) −0,001/+0,001.

**MGK** (Auflage 17.12.2007, Daten ab 27.12.2007). b) 13.10./28.10.2008, 16.03.2020 und 09.04.2025 mit SPY. d) Quartalsweise.
**2014 hat Yahoo nur 3 Zahlungen.** Gegen Vanguard: Kalenderjahr 2014 Marktpreis 13,66 %, unser Wert 13,16 % (−0,50 Pp). **Die
Q4-2014-Zahlung fehlt bei Yahoo.** Den Betrag liefert nur eine Drittquelle (dividendhistory.net): Ex 17.12.2014, 0,3230 $ vor dem
Split 5:1. Mit der Zahlung: A und B unberührt, 161/165 unverändert, Median 1,665 → 1,747. Auffällig niedrig sind 24.12.2018 mit
0,0226 $ (0,11 %) und 25.03.2019 mit 0,0178 $ (0,07 %). Die Jahre 2018 (+0,05) und 2019 (−0,17) gegen Vanguard deuten höchstens auf
einen kleinen Fehlbetrag 2019 (Wirkung auf A unter 0,04 Pp p. a.). 2026: die Zahlung Ex 28.09.2026 über 0,0765 $ (Vanguard-API)
fehlt bei Yahoo; sie liegt nach dem Datenende und wirkt nur auf das Factsheet (−0,02). **Split 5:1 am 21.04.2026:** Schluss stetig
(−0,62 % bei SPY −0,65 %); Ausschüttung je Vortagsschluss vorher 0,088 %, nachher 0,100 %. e) −0,004/−0,001.

## 3. Factsheet-Abweichungen (REGEL C9, `factsheet-g2.json`)

Alle 15 Fonds mit Marktpreis-Angabe des Anbieters. Stichtage: iShares 30.06.2026 (Quartalsende auf der Seite), Invesco und Schwab
31.08.2026, Vanguard und Alpha Architect 30.09.2026.
**Abweichung unser − Anbieter: −0,144 bis +0,013 Pp p. a.; 13 von 15 liegen innerhalb ±0,03.** Keine erreicht |0,30|.

| Fonds | Stichtag | Anbieter 5 J. p. a. | unser | Abw. Pp | Ursache, soweit erkennbar |
|---|---|---|---|---|---|
| VLUE | 30.06.2026 | 16,79 | 16,79 | −0,002 | Seite: Average Annual, Market Price, Quartalsende 30.06.2026 (NAV 16,81). |
| IWD | 30.06.2026 | 10,97 | 10,97 | +0,004 | Seite: Average Annual, Market Price, 30.06.2026 (NAV 10,98). |
| RPV | 31.08.2026 | 12,00 | 11,85 | −0,144 | Invesco-API marketPrice y5, Monatsende (NAV 11,983). Abweichung -0,144: Yahoo fehlt die Ausschuettung Ex 20.09.2021 0,41952 $ (0,55 %, Beleg Invesco-Ausschuettungshistorie); allein das macht ~-0,12 Pp p. a. aus. |
| IWF | 30.06.2026 | 13,51 | 13,51 | +0,002 | Seite: Market Price 30.06.2026 (NAV 13,52). Fenster enthaelt den Split 4:1 vom 29.04.2026 (Kurs stetig). |
| QQQ | 31.08.2026 | 14,20 | 14,22 | +0,013 | Invesco-API marketPrice y5 (NAV 14,213). |
| MTUM | 30.06.2026 | 15,92 | 15,92 | −0,002 | Seite: Market Price 30.06.2026 (NAV 15,94). |
| SPMO | 31.08.2026 | 19,66 | 19,63 | −0,031 | Invesco-API marketPrice y5 (NAV 19,657). Rest -0,03 = fehlende Ausschuettung Ex 20.09.2021 0,06993 $ bei Yahoo. |
| QMOM | 30.09.2026 | 8,89 | 8,88 | −0,008 | Fondsseite, Performance Month-End, QMOM MKT 5 Year (NAV 8,89). |
| PDP | 31.08.2026 | 7,53 | 7,52 | −0,012 | Invesco-API marketPrice y5 (NAV 7,512). |
| IVE | 30.06.2026 | 11,09 | 11,09 | +0,001 | Zusatzfonds. Seite: Market Price 30.06.2026 (NAV 11,11). |
| VTV | 30.09.2026 | 12,43 | 12,44 | +0,007 | Zusatzfonds. Profilseite (eingebettetes JSON), monthEnd marketPriceFundReturn fiveYrPct (NAV 12,43). |
| IVW | 30.06.2026 | 14,34 | 14,34 | −0,002 | Zusatzfonds. Seite: Market Price 30.06.2026 (NAV 14,36); unsere NAV-Nachrechnung aus dem iShares-Monatsblatt ergibt 14,36 - Stichtag eindeutig. |
| VUG | 30.09.2026 | 13,88 | 13,87 | −0,005 | Zusatzfonds. Profilseite, monthEnd marketPrice fiveYrPct (NAV 13,87). Fenster enthaelt den Split 6:1 vom 21.04.2026. |
| SCHG | 31.08.2026 | 13,26 | 13,26 | +0,002 | Zusatzfonds. Fondsseite, Monthly 08/31/2026, Market Price 5 Year (NAV 13,26); Quartal 30.06.2026: Anbieter 13,68, unser 13,681. Fenster enthaelt beide Splits (2:1 11.03.2022, 4:1 11.10.2024). |
| MGK | 30.09.2026 | 15,12 | 15,10 | −0,024 | Zusatzfonds. Profilseite, monthEnd marketPrice fiveYrPct (NAV 15,11). Rest -0,02 = Ausschuettung Ex 28.09.2026 0,0765 $ fehlt bei Yahoo (Vanguard-API). |

## 4. Befunde für den Projektleiter

0. **Nachauftrag Ausschüttungen erledigt:** Den vollständigen Abgleich jeder Zahlung gegen die Anbieterhistorie enthält
   `ergaenzungen-g2.json`. Ergebnis: 9 fehlen, 5 streichen, 29 ersetzen. 26 der 29 Ersetzungen sind Yahoo-Rundungen auf 3
   Nachkommastellen; echte Betragsfehler gibt es bei QQQ (18.12.2009) und IWF (21.06.2000, 13.09.2002). Nicht prüfbar sind VTV, VUG
   und MGK (Vanguard nennt nur die letzten 6 Zahlungen), RPV vor 03/2008 und SCHG vor 12/2016. Mit allen Ergänzungen ändert sich
   kein g2-Urteil; IVW bleibt 208/256 und B +0,144. Die Tabelle unten ist die Vorfassung (nur die wirksamen Fälle).
1. **Yahoo-Ausschüttungsfehler, belegt mit der Historie des Anbieters.** Für kein Urteil der Gruppe g2 entscheidend; nach C2 wären
   es benannte Ergänzungen:

   | Fonds | Ex-Tag | Betrag $ (Yahoo-Einheit) | Art | Quelle | Wirkung (Schätzung, korrektur-wirkung.js) |
   |---|---|---|---|---|---|
   | RPV | 21.09.2020 | 0,29885 | fehlt | Invesco-API `…/46137V258/distribution?idType=cusip&productType=ETF` | A +0,14 Pp p. a. |
   | RPV | 20.09.2021 | 0,41952 | fehlt | dito | B +0,13 Pp p. a. (−0,271 → −0,143, bleibt hinten) |
   | SPMO | 18.03.2016 / 21.09.2020 / 20.09.2021 | 0,0493 / 0,16846 / 0,06993 | fehlen | Invesco-API `…/46138E339/distribution…` | A +0,09, B +0,03 Pp p. a.; 61/71 bleibt |
   | QQQ | 21.09.2020 | 0,38824 | fehlt | Invesco-API `…/46090E103/distribution…` | A +0,04 Pp p. a. |
   | QQQ | 25.06.2010 / 27.12.2011 | 0,089 / 0,049 | zu viel (Doppel / nicht beim Anbieter) | dito | nur rollierend; 228/270 bleibt, Median −0,03 |
   | VLUE | 23.03.2016 | 0,433562 | fehlt | iShares-Fondsdokument (portfolioId 251616), Blatt Distributions | rollierend 4 → 5 von 101 vorn |
   | IWD / IWF / IVE | 16.12.2003 | 0,278 / 0,02325 / 0,215 | Phantombuchung | iShares-Fondsdokumente 239708 / 239706 / 239728 | nur Fenster mit Start ≤ 11/2003; Zahl vorn unverändert |
   | MGK | 17.12.2014 | 0,0646 (0,3230 vor Split 5:1) | fehlt | Vanguard-Jahresrendite 2014 (−0,50 Pp); Betrag nur Drittquelle dividendhistory.net | rollierend Median +0,08, 161/165 bleibt |
   | QMOM | 28.12.2015 / 21.03.2016 | 0,002 / 0,003 | fehlen | https://funds.alphaarchitect.com/qmom/ | keine |

   iShares-Fondsdokument: `https://www.blackrock.com/varnish-api/blk-one01-product-data/product-data/api/v1/get-fund-document?appType=PRODUCT_PAGE&appSubType=ISHARES&targetSite=us-ishares&locale=en_US&portfolioId=<ID>&component=fundDownload&userType=individual`.
2. **Gruppenübergreifend (Verdacht, von g2 nur per Scan der Rohdateien gesehen, nicht beim Anbieter geprüft):** Die
   September-Ausschüttungen der Invesco-Fonds 2020 und 2021 fehlen bei Yahoo offenbar systematisch: SPHQ, RWL, SPHD (beide Jahre),
   SPLV (09/2021; zahlt monatlich, selbst prüfen). Bei RSP, PKW und PRF sind sie vorhanden. Der Termin 20.09.2021 liegt in **Fenster
   B**. Die Phantombuchung vom 16.12.2003 steht auch bei **IVV (0,388 $, Kontrolle)**, IJH, IJS und IWM; sie wirkt nur auf
   rollierende Fenster mit Start bis 11/2003. Bereits per Nachricht gemeldet.
3. **IVW ist „verlässlich vorn“ nur knapp:** 208 von 256 Fenstern vorn bei 205 nötigen, also 3 Fenster Polster. Sieben Fenster liegen
   mit weniger als 0,15 Pp p. a. vorn, darunter 2020-03 mit 0,0096 Pp p. a., das sind nur 0,04 % Endwert-Abstand über fünf Jahre.
   Die übrigen sehr knappen: 2009-04 (0,13 %), 2018-02 (0,22 %), 2009-02 (0,23 %) und 2004-01 (0,28 %). Fenster B liegt mit
   +0,144 Pp p. a. vorn. Die Fondsseite ist doppelt bestätigt: alle Ausschüttungen gleich iShares, und die NAV-Gegenprobe ergibt
   rollierend wie in A/B dieselben Entscheidungen. Kippen müssten also SPY-Monatsendkurse um wenige Hundertstel Prozent. Das ist
   kein Datenfehler, aber ein Hinweis für die Kurzfassung: das Urteil hängt an Abständen in der Größe von Rundung und Geld-Brief-Spanne.
4. **SPMO, illiquider Anfang** (42 eingefrorene Läufe 12/2015–10/2017): Das Urteil hält (siehe 2.). Fenster mit Start bis 09/2017 stehen
   auf teils wochenalten Schlüssen.
5. **QQQ:** Es gilt nur die Rechnung nach K1b: Reihe ab 10.03.1999, **228/270 Fenster vorn (84,4 %)**, Median 4,15 Pp p. a.,
   schlechtestes Fenster −17,72 (Start 2000-02). Die Brüche 17.04.2000 und 03.01.2001 sind echte Nasdaq-100-Tage.
6. **QMOM 09.03.2021** (Bruch nach 730 Tagen, Fenster A): echtes Fondsereignis, keine Behandlung nötig.
7. **Nebenbefund SPY** (Maßstabsreihe, nicht g2): Der Yahoo-Schluss vom 06.01.2000 wirkt falsch. SPY steht dort bei −1,61 %, am
   07.01.2000 bei +5,81 %; ^SP500TR zeigt +0,12/+2,71 %. Kein Monatsende ist betroffen, also bleiben A, B und die rollierenden Fenster
   unberührt. Der Fehler verschiebt nur Tagesvergleiche, z. B. die Einordnung der QQQ-Bewegung vom 07.01.2000, und die Werte der
   relativen Rückschlagsreihe an diesen beiden Tagen.
8. **Kein Verdacht auf einen Rechenfehler** in rechnen.js. Hauptweg und adjclose stimmen auf 0,02 Pp p. a. überein. Die
   Factsheet-Werte treffen bis auf die belegten Ausschüttungslücken auf ±0,03 Pp. Die NAV-Gegenproben (iShares) treffen A/B bei IVW, IWD und IVE
   auf 0,003 Pp, bei VLUE und MTUM auf 0,02 Pp (Kurs gegen NAV).
