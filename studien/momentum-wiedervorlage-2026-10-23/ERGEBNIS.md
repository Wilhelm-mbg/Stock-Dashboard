# Ergebnis Nr. 122 — Momentum-Buch zur Wiedervorlage 23.11.2026 (Beobachtung, kein Beleg)

*Rückblick, ein Korb, zwei Fenster, je ein Schub. Simulation mit virtuellem Kapital, keine Anlage- und keine Steuerberatung. Annahmen in
`LIESMICH.md`, Quellen in `quellen.md`, alle Zahlen in `kosten.json`, `ergebnis.json` (rechnen.js) und `massstab.json` (massstab.js).*

## Kurzfassung
1. **Bitgleich zuerst:** die Kopie der Handelshülle mit Kosten je Handel trifft bei 20 Bp je Seite den gesiegelten Stand Nr. 96 auf das Bit
   (alle vier Läufe: Endwert, alle 63 Abstände, Median, gezahlte Kosten). Ebenso trifft der Steuerrechner Nr. 82 (Satz 0, Regel K) die Endwerte auf das Bit,
   und sein S&P-500-Fonds nach Steuer die Zahlen aus Nr. 82 (+14,83 / +10,40 % p. a.).
2. **Kosten je Rundlauf** des Korbs 187 im Rückblick (100.000 $): statt 0,40 Pp **0,17–0,18 Pp bei Ausführung zur Eröffnung** (so handelt der Rückblick)
   und **0,10–0,11 Pp im Kassa-Fenster** (Wilhelms „~0,10") — jeweils Spanne + IBKR Fixed. Bei 10.000 € steigt es durch die Mindestgebühr auf 0,31–0,50 Pp.
3. **Rückblick Korb 187, Median der 63 Startphasen gegen den S&P 500:** 2017–21 +7,27 → **+7,71** (Eröffnung) / +7,88 (Kassa) Pp p. a.;
   2021–26 +8,25 → **+8,61** / +8,72. Die neuen Kosten heben den Median um 0,4–0,6 Pp p. a.; Rückschlag (−49 / −57 %) unverändert.
4. **Maßstab Nasdaq-100 mit Dividenden (QQQ):** 2017–21 +28,72 % p. a. (S&P 500 +17,77), 2021–26 +14,03 % p. a. (S&P 500 +12,63).
   Gegen den Nasdaq-100 liegt das Buch des Korbs 187 2017–21 **hinten** (Median −2,47 Pp p. a. vor, −4,07 nach Steuer), 2021–26 **vorn**
   (Median +6,96 vor, +4,84 nach Steuer) — getragen vom Schub 2024/25.
5. **Nach Steuer** (alles verkauft, Start am ersten Tag, Eröffnung+Fixed): Buch 2017–21 +18,39 % p. a. gegen Nasdaq-ETF +24,87 % (S&P-500-ETF +14,83);
   2021–26 +16,51 % gegen +11,81 % (S&P 500 +10,40).
6. **Handelbarer Maßstab (Vorschlag, Entscheid Wilhelm):** Xtrackers Nasdaq 100 UCITS ETF 1C, IE00BMFKG444 — thesaurierend, TER 0,20 %, physisch,
   Xetra in EUR. Alternativen: iShares IE00B53SZB19 (TER 0,30 %, größter Fonds), Invesco IE00BFZXGZ54 (TER 0,30 %).

## 1. Kostenmodell je Rundlauf (kosten.js → kosten.json)

Spanne = gemessene notierte Kassa-Spanne der Umsatzklasse je Umlauf (Fenster `mitte`, ab 2021); Eröffnung = mitte × Faktor der Klasse
(2,68 / 2,46 / 2,07 / 1,81). IBKR Ireland: Fixed 0,005 $/Stück, min 1 $, max 1 %; Tiered 0,0035 $/Stück, min 0,35 $ + Börse 0,0030 + Clearing 0,0002
+ Pass-Through; beide CAT, SEC beim Verkauf. Position = Kapital / 19, Kurs = Median-Kurs der Klasse. **Schlupf:** nicht getrennt modelliert — die
gemessene Spanne ist die Füllung am Quote (ohne Marktwirkung); sie ist Wilhelms „~0,10 Pp inkl. Schlupf" für das Kassa-Fenster.

| Rundlauf in Pp | Klasse 5-50 | 50-250 | 250-1000 | ab 1000 |
|---|---|---|---|---|
| **alt** (20 Bp je Seite) | 0,400 | 0,400 | 0,400 | 0,400 |
| Spanne allein, Kassa / Eröffnung | 0,157 / 0,420 | 0,085 / 0,210 | 0,065 / 0,134 | 0,045 / 0,081 |
| **100.000 $** (Position 5.263 $), Fixed: Kassa / Eröffnung | 0,197 / 0,461 | 0,125 / 0,250 | 0,105 / 0,174 | **0,085 / 0,121** |
| 100.000 $, Tiered: Kassa / Eröffnung | 0,197 / 0,460 | 0,110 / 0,235 | 0,086 / 0,155 | 0,064 / 0,100 |
| **50.000 €** (2.949 $), Fixed: Kassa / Eröffnung | 0,227 / 0,490 | 0,155 / 0,280 | 0,135 / 0,204 | 0,115 / 0,151 |
| 50.000 €, Tiered: Kassa / Eröffnung | 0,201 / 0,464 | 0,121 / 0,245 | 0,096 / 0,166 | 0,074 / 0,111 |
| **10.000 €** (590 $), Fixed: Kassa / Eröffnung | 0,498 / 0,762 | 0,427 / 0,551 | 0,406 / 0,475 | 0,386 / 0,422 |
| 10.000 €, Tiered: Kassa / Eröffnung | 0,296 / 0,559 | 0,216 / 0,340 | 0,191 / 0,261 | 0,169 / 0,206 |

IBKR-Anteil je Rundlauf (Fixed): 0,040 Pp bei 100.000 $, 0,070 bei 50.000 €, 0,341 bei 10.000 € — bei kleinen Positionen dominiert die Mindestgebühr
von 1 $ je Order. Umtausch EUR→USD einmalig mindestens 2 $ (0,002 / 0,004 / 0,018 Pp des Kapitals), bei jedem Nachschuss wieder.

**Im Rückblick tatsächlich gezahlt** (k = 0, gezahlte Kosten × 2 / gehandeltes Volumen; die Positionen wachsen mit dem Buch, deshalb unter der Tabelle):

| Rundlauf effektiv, Pp | alt | Eröffnung+Fixed | Kassa+Fixed | Eröffnung+Tiered | Kassa+Tiered | Eröffnung+Fixed 50 k€ | Kassa+Fixed 50 k€ | Eröffnung+Fixed 10 k€ | Kassa+Fixed 10 k€ |
|---|---|---|---|---|---|---|---|---|---|
| Korb 187, 2017–21 | 0,400 | **0,180** | 0,102 | 0,174 | 0,096 | 0,199 | 0,120 | 0,391 | 0,312 |
| Korb 187, 2021–26 | 0,400 | **0,167** | 0,106 | 0,151 | 0,090 | 0,199 | 0,137 | 0,504 | 0,442 |
| breit, 2017–21 | 0,400 | 0,251 | 0,146 | 0,227 | 0,123 | 0,296 | 0,190 | 0,725 | 0,619 |
| breit, 2021–26 | 0,400 | 0,296 | 0,199 | 0,236 | 0,139 | 0,390 | 0,292 | 1,270 | 1,169 |

Klassenmix des gehandelten Volumens (Korb 187): 2017–21 50-250 26 %, 250-1000 58 %, ab 1000 17 %; 2021–26 50-250 3 %, 250-1000 69 %, ab 1000 29 %
(Klassen nominal — „187 umsatzstärkste" heißt 2017–21 nicht „Milliarden-Klasse"). Werte unter 5 Mio $: 1 Handel (Spanne der Klasse 5-50 angesetzt).

## 2. Rückblick neu (rechnen.js → ergebnis.json), Regel K, Panel v2.3, gleiche Startphasen und Gutschrift-Reihenfolge

| Lauf | Kostenlage | Abstand p. a. zum S&P 500, Start am ersten Tag | **Median der 63 Startphasen** | Min / Max | vorn (von 63) | Rückschlag | Umschichtungen je Jahr | Kosten je Jahr (Pp des Buchs) |
|---|---|---|---|---|---|---|---|---|
| **Korb 187, 2017–21** | alt 0,40 | +4,72 | **+7,27** | +0,32 / +15,43 | 63 | −49,0 % | 4,05 | 0,65 |
| | Eröffnung+Fixed | +5,20 | **+7,71** | +0,82 / +15,90 | 63 | −49,0 % | 4,05 | 0,31 |
| | Kassa+Fixed | +5,38 | **+7,88** | +1,02 / +16,09 | 63 | −48,9 % | 4,05 | 0,17 |
| | Eröffnung+Fixed, 10.000 € | +4,66 | +7,22 | +0,23 / +15,41 | 63 | −49,0 % | 4,05 | 0,68 |
| **Korb 187, 2021–26** | alt 0,40 | +7,51 | **+8,25** | −1,25 / +18,42 | 61 | −56,9 % | 4,00 | 0,54 |
| | Eröffnung+Fixed | +7,95 | **+8,61** | −0,82 / +19,06 | 62 | −56,7 % | 4,00 | 0,25 |
| | Kassa+Fixed | +8,09 | **+8,72** | −0,69 / +19,17 | 62 | −56,6 % | 4,00 | 0,16 |
| | Eröffnung+Fixed, 10.000 € | +7,08 | +8,02 | −1,50 / +18,32 | 61 | −57,2 % | 4,00 | 0,81 |
| breit, 2017–21 | alt 0,40 | +11,28 | +8,07 | −1,44 / +14,46 | 62 | −42,0 % | 4,05 | 0,60 |
| | Eröffnung+Fixed | +11,60 | +8,39 | −1,07 / +14,75 | 62 | −42,0 % | 4,05 | 0,39 |
| | Kassa+Fixed | +11,82 | +8,63 | −0,78 / +14,96 | 62 | −42,0 % | 4,05 | 0,23 |
| breit, 2021–26 | alt 0,40 | −2,22 | +1,72 | −2,83 / +8,63 | 43 | −40,3 % | 4,00 | 0,52 |
| | Eröffnung+Fixed | −2,09 | +1,88 | −2,67 / +8,82 | 43 | −40,2 % | 4,00 | 0,39 |
| | Kassa+Fixed | −1,94 | +2,12 | −2,51 / +8,64 | 44 | −40,1 % | 4,00 | 0,27 |
| | Eröffnung+Fixed, 10.000 € | −3,51 | +0,39 | −3,92 / +6,37 | 32 | −42,2 % | 4,00 | 1,70 |

Alle neun Kostenlagen (auch Tiered und 50.000 €) in `ergebnis.json`. Kosten je Kalenderjahr (Korb 187, alt / Eröffnung / Kassa, Pp des mittleren
Buchwerts): 2017 0,78/0,41/0,23 · 2018 0,75/0,37/0,20 · 2019 0,63/0,30/0,17 · 2020 0,62/0,26/0,15 · 2021 (bis 15.09.) 0,48/0,19/0,11; 2021 (ab 16.09.)
0,43/0,18/0,11 · 2022 0,63/0,31/0,21 · 2023 1,03/0,52/0,35 · 2024 0,45/0,21/0,13 · 2025 0,53/0,19/0,11 · 2026 (bis 15.09.) 0,20/0,06/0,04.

**Beobachtung.** Im Korb 187 heben die gemessenen Kosten den Median der Startphasen in beiden Fenstern um 0,4 (Eröffnung) bis 0,6 (Kassa) Pp p. a.;
das ist die Größe der Kostenersparnis (0,3–0,5 Pp des Buchs je Jahr), mit etwas Zinseszins. Die Schübe bleiben, wo sie waren (2017–21: das Jahr 2020; 2021–26: 2024/25),
der Rückschlag bleibt −49 bzw. −57 %. Bei 10.000 € Kapital frisst die Mindestgebühr die Ersparnis auf (Median 2017–21 +7,22, also unter dem alten Stand).

## 3. Maßstab Nasdaq-100 mit Dividenden, brutto und nach Steuer (massstab.js → massstab.json)

**Daten:** im Tagesarchiv `archiv1d` gibt es keine Reihe QQQ; genommen sind die rohen Minutenbalken `alpaca1m/QQQ` (Eröffnung = 09:30-Kerze,
Schluss = Eröffnung der 16:00-Kerze) und `alpaca-massnahmen/QQQ.json` (43 Ausschüttungen 2016–2026, kein Split). **Gegenprobe:** SPY auf demselben
Weg trifft den SPY-Maßstab des Panels in beiden Fenstern in allen 63 Startphasen auf 0,000 Pp p. a. — nachdem die benannte Ergänzung des Rückblicks
(`korb.js` ERGAENZUNGEN, SPY 15.06.2018, 1,2456 $) übernommen war; ohne sie lag Fenster A bei +114,57 statt +115,54 % (bis zur Position aufgeklärt).
**Fund:** `QQQ.json` führt den Satz vom 19.09.2022 (0,51856 $) **doppelt** (zwei `process_date`) — hier einmal gezählt (mit Doppelzählung stand
Fenster B bei +93,05 statt +92,71 %).

| | 2017–21 (04.01.2017–15.09.2021) | 2021–26 (16.09.2021–15.09.2026) |
|---|---|---|
| Nasdaq-100 (QQQ) mit Dividenden, brutto, Start am ersten Tag | **+227,22 % (+28,72 % p. a.)** | **+92,71 % (+14,03 % p. a.)** |
| S&P 500 (SPY) nachrichtlich | +115,54 % (+17,77 % p. a.) | +81,19 % (+12,63 % p. a.) |
| Nasdaq-100 minus S&P 500, Median der 63 Starttage | +10,19 Pp p. a. | +1,47 Pp p. a. |

**Buch Korb 187 gegen Nasdaq-100 — vor Steuern** (Buch p. a. = Abstand zum S&P 500 + S&P 500 p. a. derselben Phase):

| Fenster | Kostenlage | Buch p. a., erster Tag | Abstand zum Nasdaq-100, erster Tag | **Median der 63** | vorn (von 63) |
|---|---|---|---|---|---|
| 2017–21 | alt 0,40 | +22,49 % | −6,23 | **−2,91** | 17 |
| | Eröffnung+Fixed | +22,97 % | −5,75 | **−2,47** | 18 |
| | Kassa+Fixed | +23,15 % | −5,57 | −2,30 | 18 |
| 2021–26 | alt 0,40 | +20,14 % | +6,11 | **+6,49** | 58 |
| | Eröffnung+Fixed | +20,59 % | +6,56 | **+6,96** | 59 |
| | Kassa+Fixed | +20,72 % | +6,69 | +7,09 | 60 |

Breiter Markt gegen Nasdaq-100, Median: 2017–21 −2,24 → −1,91 (Eröffnung), 2021–26 +0,07 → +0,23.

**Nach deutscher Steuer** (Modell Nr. 82 unverändert; Lesart „alles verkauft" am Fensterende; Buch: jede Umschichtung steuerpflichtig, Aktien-Verlusttopf;
Fonds thesaurierend mit Vorabpauschale, Teilfreistellung 30 %; Nasdaq-Fonds = QQQ-Kurs mit 85 % Wiederanlage, Zusatzkosten TER Xtrackers 0,20 % − QQQ 0,20 % = 0):

| Fenster | Kostenlage (Buch) | Buch p. a., erster Tag | Nasdaq-100-ETF p. a. | S&P-500-ETF p. a. (nachr.) | **Median Abstand zum Nasdaq-ETF** | vorn gegen Nasdaq (von 63) | Median Abstand zum S&P-500-ETF | vorn gegen S&P 500 |
|---|---|---|---|---|---|---|---|---|
| 2017–21 | alt 0,40 | +18,01 % | **+24,87 %** | +14,83 % | **−4,41** | 6 | +4,91 | 60 |
| | Eröffnung+Fixed | +18,39 % | +24,87 % | +14,83 % | **−4,07** | 7 | +5,27 | 61 |
| | Kassa+Fixed | +18,53 % | +24,87 % | +14,83 % | −3,94 | 8 | +5,39 | 61 |
| 2021–26 | alt 0,40 | +16,08 % | **+11,81 %** | +10,40 % | **+4,42** | 57 | +6,02 | 60 |
| | Eröffnung+Fixed | +16,51 % | +11,81 % | +10,40 % | **+4,84** | 58 | +6,44 | 62 |
| | Kassa+Fixed | +16,63 % | +11,81 % | +10,40 % | +4,95 | 58 | +6,55 | 62 |

Gezahlte Steuer bei Start am ersten Tag (Eröffnung+Fixed, auf 100.000 $): Buch 43.321 $ / 41.055 $, Nasdaq-ETF 41.586 $ / 16.840 $, S&P-500-ETF 20.689 $ / 14.429 $
(2017–21 / 2021–26). Lesart „bleibt stehen": Buch +19,43 / +18,50 % gegen Nasdaq-ETF +28,55 / +13,76 % p. a. Breiter Markt nach Steuer, Median gegen den
Nasdaq-ETF: 2017–21 −3,77, 2021–26 −0,89 Pp p. a. (Eröffnung+Fixed).
**Näherung:** der Steuerrechner kennt einen Satz je Seite; eingesetzt ist der effektive Satz des Laufs (9,01 / 8,36 Bp Eröffnung, 5,09 / 5,29 Bp Kassa, Korb 187).
Vor Steuern liegt er damit 96 bis 352 $ über der Rechnung je Handel (≤ 0,03 Pp p. a.). Sparer-Pauschbetrag (1.000 € je Person) genannt, nicht angerechnet.

**Beobachtung.** Der Maßstab Nasdaq-100 dreht das Bild im Fenster 2017–21: dort lag der Nasdaq-100 selbst rund 10 Pp p. a. über dem S&P 500, und das
Buch des Korbs 187 liegt im Median der Startphasen dahinter (−2,5 Pp vor, −4,1 Pp nach Steuer, nur 7 von 63 Startphasen nach Steuer vorn), obwohl es den
S&P 500 in allen 63 Phasen schlägt. Im Fenster 2021–26 liegt das Buch des Korbs 187 vor dem Nasdaq-100 (Median +7,0 vor, +4,8 nach Steuer), getragen
von einem Schub 2024/25 (bis Ende 2023 lag es −36,6 % gegen +10,4 % beim S&P 500, Belegstand Nr. 78). Die Steuer-Hürde gegen einen thesaurierenden
Indexfonds liegt am Gleichstand bei rund **1,0 Pp p. a.** (Spanne 0,84–1,44; Belegstand, Realitätsprobe 04.10.); bei den hohen Erträgen hier nimmt die
Steuer dem Abstand zum Nasdaq-ETF 1,6–2,1 Pp p. a. im Median.

## 4. Handelbarer Maßstab für EU-Privatkunden bei IBKR

QQQ ist für EWR-Privatkunden ohne KID gesperrt (PRIIPs; IBKR-Wissensdatenbank). UCITS-ETFs auf den Nasdaq-100 (justETF, 23.10.2026):

| ETF | ISIN | Ertrag | TER | Fondsvolumen | Replikation | Fondswährung | Handelsplätze (Auswahl) | Kalenderjahre in EUR 2022 / 2023 / 2024 / 2025 |
|---|---|---|---|---|---|---|---|---|
| **Xtrackers Nasdaq 100 UCITS ETF 1C** | IE00BMFKG444 | thesaurierend | **0,20 %** | 2.624 Mio. € | physisch | USD | Xetra EUR (XNAS), gettex EUR, LSE USD/GBP | −28,43 / +49,25 / +33,49 / +6,67 % |
| iShares Nasdaq 100 UCITS ETF (Acc) | IE00B53SZB19 | thesaurierend | 0,30 % | 26.049 Mio. € | physisch | USD | Xetra EUR (SXRV), gettex EUR, LSE USD/GBX | −28,50 / +49,07 / +33,29 / +6,58 % |
| Invesco EQQQ Nasdaq-100 UCITS ETF Acc | IE00BFZXGZ54 | thesaurierend | 0,30 % | 4.424 Mio. € | physisch | USD | Xetra EUR (EQQB), gettex EUR, SIX USD | −28,46 / +49,10 / +33,34 / +6,59 % |
| *nachrichtlich:* Amundi Core Nasdaq-100 Swap UCITS ETF Acc | LU1829221024 | thesaurierend | 0,22 % | 6.460 Mio. € | synthetisch (Swap) | USD | Xetra EUR/USD (LYMS), gettex EUR | −28,15 / +49,55 / +33,96 / +6,42 % |

**Vorschlag nach Kosten und Steuer (Entscheid Wilhelm):** Xtrackers IE00BMFKG444 auf Xetra in EUR — niedrigste TER der physischen, thesaurierend
(Vorabpauschale statt laufender Ausschüttungsbesteuerung; alle vier sind Aktienfonds mit 30 % Teilfreistellung, steuerlich gleich). In den Kalenderjahren
liegt er 0,03–0,20 Pp über iShares und Invesco; der Swap-Fonds von Amundi lag 2022–2024 noch höher, 2025 tiefer (Spanne der vier je Jahr ≤ 0,7 Pp).
Eine **Tracking-Differenz gegen den Index** weisen die abgerufenen Seiten nicht aus (offener Punkt: Anbieterseiten). Kaufgebühr bei IBKR Deutschland
(Fixed, SmartRouting): 0,05 % des Werts, mindestens 3,00 € je Order (Seite IBKR Ireland, Abschnitt Germany).

## 5. Wiedervorlage 23.11.2026

| Zeile (Korb 187, Regel K) | 2017–21 | 2021–26 | Fundstelle |
|---|---|---|---|
| Rückblick **alt** (0,40 Pp), Median der 63 gegen S&P 500 (erster Tag) | +7,27 (+4,72) Pp p. a. | +8,25 (+7,51) Pp p. a. | Nr. 96 `momentum-korb-v23-2026-10-04/ergebnis.json` |
| Rückblick **neu**, Spanne Eröffnung + IBKR Fixed, 100.000 $ | **+7,71 (+5,20)** | **+8,61 (+7,95)** | `ergebnis.json` |
| … Spanne Kassa + IBKR Fixed | +7,88 (+5,38) | +8,72 (+8,09) | `ergebnis.json` |
| Maßstab S&P 500 (SPY) mit Ausschüttungen, erster Tag | +17,77 % p. a. | +12,63 % p. a. | Panel, Nr. 96 |
| Maßstab Nasdaq-100 (QQQ) brutto, erster Tag | +28,72 % p. a. | +14,03 % p. a. | `massstab.json` |
| Buch neu gegen Nasdaq-100 brutto, Median | −2,47 Pp p. a. | +6,96 Pp p. a. | `massstab.json` + `ergebnis.json` |
| Buch neu nach Steuer / Nasdaq-ETF nach Steuer, erster Tag | +18,39 / +24,87 % p. a. | +16,51 / +11,81 % p. a. | `massstab.json` |
| … Median Abstand nach Steuer zum Nasdaq-ETF (zum S&P-500-ETF) | −4,07 (+5,27) Pp p. a. | +4,84 (+6,44) Pp p. a. | `massstab.json` |
| Schub | ein Schub: 2020 (Periode ab 07.04.2020 +40,4 Pp) | ein Schub: 2024/25 (Periode ab 19.09.2024 +53,0 Pp) | Belegstand Nr. 78 |
| 95-%-Band des Abstands je Periode | schließt null ein (Abstand je Periode +2,06 Pp, Standardfehler 2,79; v2.2, ohne Regel K) | schließt null ein (+4,29 Pp, Standardfehler 4,94) | Belegstand Nr. 78 |
| Rang gegen 200 Zufallsbücher (gleiche Mechanik, 20 Bp) | 15 von 201 | 3 von 201 | Belegstand Nr. 100 — Urteil „nicht entscheidbar" |
| **Vorwärtstest App-Buch** | Platzhalter — siehe unten | | `lagebild.json` fehlt |

**Platzhalter Vorwärtstest (am 23.11. eintragen):** `lagebild.json` liegt nicht unter `Markt-Dashboard-Daten/`. Am 23.11. aus dem Lagebild-Export der App
(`lagebild.json`, Abschnitt `buecher`, Eintrag Momentum) übernehmen: (1) Buch seit Start in % (Feld des Buchs, „Buch +x,x %"), (2) S&P 500 seit
demselben Zeitpunkt mit Ausschüttungen, (3) Abstand in Pp, (4) Startdatum (25.08.2026) und Stichtag, (5) ob die erste Umschichtung gelaufen ist
(fällig um den 23.11.2026; der Export vom 12.10. nannte für die Kunstinstanz den 18.12.2026 — am echten Bestand prüfen), (6) gezahlte Kosten der
Umschichtung gegen die Tabelle in Abschnitt 1. Nicht aus dem Store lesen.

**Grenze (wörtlich aus dem Belegstand, Realitätsprobe 04.10.2026):** „bei einer Schwankung des Abstands von etwa 17 % im Jahr (öffentliche Momentum-Daten;
unser Rückblick 24–44 %) ist +7 Pp p. a. erst nach rund 37 Jahren von null zu trennen; nach 12 Monaten liegt auch ein Buch mit echten +7 Pp in etwa
jedem dritten Fall hinter dem S&P 500. Ein Test über Monate prüft also die **Umsetzung** (Kurse, Kosten, Ausschüttungen, Auswahl), nicht den Vorsprung
(Formel nachgerechnet)."

## Grenzen
- Je Fenster ein Schub; die 63 Startphasen teilen sich dieselben Jahre und sind kein zweiter Nachweis. Der Korb ist nicht die Liste der App.
- Spannen ab 2021 für beide Fenster (vorsichtig für 2017–21); keine Marktwirkung; Gebühren von heute für alle Jahre; Klasse nach nominalem Umsatz.
- Nach Steuer: Dollar wie Euro (kein Wechselkurs), heutiges Steuerrecht, Basiszins 2017 angenommen; Buch-Kosten im Steuerrechner als effektiver Satz.
- Nasdaq-ETF als QQQ-Kurs mit 85 % Wiederanlage modelliert, nicht die Kurse des UCITS-ETF (der Xtrackers-Fonds besteht erst seit 21.01.2021).
- Offen: Doppelsätze in `alpaca-massnahmen` (QQQ 19.09.2022) — ob der gesiegelte Rechner bei Aktien solche Sätze doppelt bucht, ist nicht geprüft
  (`R.Massnahmen` nimmt jeden Satz); ein Suchlauf über alle Dateien brach an der langsamen Platte E: ab. Tracking-Differenz der UCITS-ETFs nicht abgerufen.
