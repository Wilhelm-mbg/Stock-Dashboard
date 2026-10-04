# Datenprüfung — Messung Sektor-Momentum (Yahoo, zwölf Reihen)

Kennung `sektor-momentum-messung-2026-10/datenpruefung/v1` · erzeugt 2026-10-04T22:52:47.848Z von `datenpruefung.js` (`node studien/sektor-momentum-messung-2026-10/datenpruefung.js`) · alle Zahlen in `datenpruefung.json`.
Nur Bericht (ZUSATZ §1.10): ändert keine Zahl der Messung; keine Rangfolge, kein Buch, keine Auswahl. Alles Simulation, keine Anlageberatung.

## Fazit — was für die Messung zählt

1. **Dateien heil:** 12/12 Prüfsummen wie `pruefsummen.json`; 0 Balken entfallen (§1.5), 0 doppelte Tage; Zeitstempel nur 13:30 / 14:30 UTC (= 09:30 New York, Sommer/Winter).
2. **Kalender-Klinken erfüllt:** A 1.183 (Soll 1.183), B 1.254 (Soll 1.254) Handelstage; Vortage 03.01.2017 / 15.09.2021. SPY-Kalender = Panel-v2.2-Kalender (2.690 gegen 2.690 Tage 04.01.2016–15.09.2026, 0 Abweichungen).
3. **Keine Datenlücke gegen das Buch:** 0 fehlende Fonds-Tage gegen den SPY-Kalender (ab dem ersten Tag je Fonds), 0 Zeilen ohne SPY-Tag, 0 Tage ohne `open`, 0 ohne `volume`; `volume` = 0 nur 6× (XLI 1999-01-26, XLRE 2015-10-14, XLRE 2015-11-25, XLRE 2015-11-27, XLRE 2015-12-07, XLRE 2016-01-25), davon in A/B 0.
4. **Splits sauber:** 2:1 am 05.12.2025 (XLB, XLE, XLK, XLU, XLY; Alpaca führt denselben Split bei 5 von 5) und XLF 1231:1000 am 19.09.2016 (= Abspaltung XLRE, Faktor aus Alpacas XLRE-Stückverhältnis nachgerechnet 1,2315). Kurse, Umsätze **und** Ausschüttungsbeträge sind split-bereinigt, also in derselben Einheit: Schluss Splittag/Vortag 0,991–1,007 (unbereinigt wäre 0,5), Yahoo-Betrag/Alpaca-roh vor dem Split 0,4995–0,5006, Umsatz Yahoo/Alpaca-Minuten 90 Tage vor und nach 0,989–1,018; keine Stufe in adjclose/close an einem Splittag.
5. **Ausschüttungen vollständig für A und B:** jede Yahoo-Ausschüttung hat ihre Stufe in adjclose/close (|Ist − Soll| ≤ 1,19·10^-6), keine Stufe > 10^−5 ohne Ereignis (100 Rundungsstufen ≤ 1,55·10^-6). Gegen Alpaca (ab 17.06.2016) fehlt bei Yahoo kein Satz in A oder B; nur bei Alpaca insgesamt: XLF 2016-09-19 (XLRE-Stückverhältnis, kein Bargeld). Beträge gleich bis auf Yahoos Rundung (≤ 0,00053 $) und XLF 18.03.2016 (0,081235 gegen 0,099915 $, vor A), SPY 17.12.2021 (1,633000 gegen 1,636431 $, in B).
6. **SPY-Pflichtprüfung bestanden:** (i) +115,91 % (Soll +115,95, −0,04 Pp), (ii) 215.548,40 $ (+0,01 Pp), (iii) 181.193,89 $ (0,00 Pp), (iv) 23,8670 / 34,0620 $ (+0,0014 / −0,0037 $). Yahoo führt den 15.06.2018 selbst (1,2460 $), die Ergänzung greift nicht; Ex-Tage A 18, B 20, 2017–2025 je Jahr 4.
7. **Zweite Kursquelle (Alpaca-Minuten, roh, 2016–2026):** Schlusskurse im Mittel 0,0018–0,0128 % Abweichung, Median je Reihe ≤ 0,0091 %; 9 Tage > 0,5 % (7 in A/B), dort liegt Yahoos Schluss aber in der gehandelten Minutenspanne — kein Yahoo-Schluss liegt außerhalb. **`open` ist schwächer:** an 22 Reihen-Tagen liegt Yahoos `open` außerhalb dessen, was an dem Tag gehandelt wurde, 17 davon in A/B (15 Fonds-, 2 SPY-Tage: 08.02.2017 XLF, 09.02.2017 XLF/XLI/SPY, 17.05.2017 SPY, 30.10.2017 XLB/XLE/XLK/XLP/XLRE/XLU/XLY, 03.08.2018 XLC, 07.08.2018 XLRE/XLY, 05.06.2023 XLC/XLI; bis 1,15 % neben der Spanne).
8. **Zwei Rechenwege:** Gesamtertrag aus adjclose gegen Schluss + Ausschüttungen |Δ| ≤ 0,32 Pp in A/B, ≤ 0,95 Pp über 31.12.1999–15.09.2026 — Folge des Wiederanlage-Zeitpunkts (Faktor auf den Vortagesschluss gegen Kauf zum Ex-Tag-Schluss), kein Datenfehler; die Hauptrechnung (§1.7) ist Schluss + Ausschüttungen.
9. **Nur für den Langlauf (§5, ohne Urteil):** XLI 2001:3; XLK 1999:1 2000:0 2001:0 2002:1 2003:1 2004:1 2005:1 2006:2 2007:3; XLV 1999:1 2000:1 (Zahl der Sätze je Jahr unter 4) — vor 2016 ohne zweite Quelle; ab 2016 hat jede Reihe in jedem vollen Jahr genau 4 Sätze (Sonderzahlungen ausgenommen, Abschnitt 5). XLK: 84 Sätze, weil der Fonds bis 2007 nur jährlich oder gar nicht ausschüttete, nicht wegen einer Lücke in A/B.
10. **Tages-Panel v2.2:** kein Sektor-Fonds unter den 7.479 Reihen (Art ETF ist ausgeschlossen); nur SPY als Referenzreihe. REGEL C.2 „nicht geprüft" bleibt richtig.

**Gefährdet etwas die Messung?** Nein: keine Datenlücke gegen das Buch, kein Splitfehler, keine fehlende Ausschüttung in A oder B, alle Klinken und die Pflichtprüfung erfüllt. Hinweise (XLF 18.03.2016, SPY 17.12.2021) liegen unter jeder Toleranz bzw. vor Fenster A. Zu benennen bleibt der `open` an 17 Reihen-Tagen in A/B (Zeile 7, Liste in Abschnitt 9): fällt ein Ausführungstag darauf, ist der Handelspreis des betroffenen Fonds um bis zu 1,15 % falsch (§1.7 handelt zum gelieferten `open`; die Rechnung bleibt dabei, der Lauf kann die Treffer zählen).

## 1. Reihen (Tagesbildung §1.5)

| Kürzel | Zeilen roh | gültig | entfallen | doppelte Tage | erster Tag | letzter Tag | Stempel UTC (Zahl) | Ausschüttungen | Splits | Prüfsumme |
|---|---|---|---|---|---|---|---|---|---|---|
| XLB | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 110 | 1 | passt |
| XLC | 2.071 | 2.071 | 0 | 0 (gleich 0, verschieden 0) | 2018-06-19 | 2026-09-15 | 13:30: 1.387, 14:30: 684 | 32 | 0 | passt |
| XLE | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 111 | 1 | passt |
| XLF | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 110 | 1 | passt |
| XLI | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 109 | 0 | passt |
| XLK | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 84 | 1 | passt |
| XLP | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 110 | 0 | passt |
| XLRE | 2.749 | 2.749 | 0 | 0 (gleich 0, verschieden 0) | 2015-10-08 | 2026-09-15 | 13:30: 1.805, 14:30: 944 | 43 | 0 | passt |
| XLU | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 111 | 1 | passt |
| XLV | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 105 | 0 | passt |
| XLY | 6.974 | 6.974 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-22 | 2026-09-15 | 13:30: 4.436, 14:30: 2.538 | 110 | 1 | passt |
| SPY | 6.989 | 6.989 | 0 | 0 (gleich 0, verschieden 0) | 1998-12-01 | 2026-09-15 | 13:30: 4.436, 14:30: 2.553 | 112 | 0 | passt |

## 2. Kalender = SPY-Tage (Klinken §1.6)

| Klinke | Ist | Soll | erfüllt |
|---|---|---|---|
| Handelstage A 04.01.2017–15.09.2021 | 1.183 | 1.183 | ja |
| Handelstage B 16.09.2021–15.09.2026 | 1.254 | 1.254 | ja |
| Handelstag vor 04.01.2017 | 03.01.2017 | 03.01.2017 | ja |
| Handelstag vor 16.09.2021 | 15.09.2021 | 15.09.2021 | ja |
| letzter Tag | 15.09.2026 | 15.09.2026 | ja |
| Tage auf Samstag/Sonntag | 0 | 0 | ja |

Gegenprobe Panel v2.2 (`_stand.json`, Feld `tage`): 2.690 Panel-Tage gegen 2.690 SPY-Tage 04.01.2016–15.09.2026; nur im Panel: keiner; nur bei SPY: keiner.

## 3. Lücken je Reihe gegen den SPY-Kalender (ab ihrem ersten Tag)

| Kürzel | ab | fehlende Tage | davon A / B | Zeilen ohne SPY-Tag | ohne open | volume null | volume 0 | Fälle in A / B |
|---|---|---|---|---|---|---|---|---|
| XLB | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| XLC | 2018-06-19 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| XLE | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| XLF | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| XLI | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 1 (1999: 1) | keine |
| XLK | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| XLP | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| XLRE | 2015-10-08 | 0 | 0 / 0 | 0 | 0 | 0 | 5 (2015: 4, 2016: 1) | keine |
| XLU | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| XLV | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| XLY | 1998-12-22 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |
| SPY | 1998-12-01 | 0 | 0 / 0 | 0 | 0 | 0 | 0 | keine |

Tage mit `volume` = 0: XLI 1999-01-26, XLRE 2015-10-14, XLRE 2015-11-25, XLRE 2015-11-27, XLRE 2015-12-07, XLRE 2016-01-25 — alle vor Fenster A; für die Rangbildung (Umsatz) ohne Belang.

## 4. Splits

| Kürzel | Tag | Verhältnis | Schluss Splittag / Vortag | Eröffnung Splittag / Vortagesschluss | Betrag Yahoo / Alpaca roh (Sätze vor dem Split) | Satz vor → nach (Median, %) | Umsatz Yahoo / Alpaca 90 T vor → nach | Minuten-Schluss mittl. \|Abw.\| vor / nach (%) | Alpaca-Maßnahme |
|---|---|---|---|---|---|---|---|---|---|
| XLB | 2025-12-05 | 2:1 | 0,9967 | 1,0024 | 0,4997 / 0,5003 / 0,5001 / 0,5001 | 0,491 → 0,443 | 1,012 → 1,010 | 0,0061 / 0,0005 | forward_splits 1→2 |
| XLE | 2025-12-05 | 2:1 | 0,9959 | 0,9983 | 0,5000 / 0,4998 / 0,4998 / 0,5002 | 0,819 → 0,716 | 1,015 → 1,017 | 0,0078 / 0,0062 | forward_splits 1→2 |
| XLF | 2016-09-19 | 1231:1000 | 1,0064 | 0,9996 | 0,6605 / 0,8117 / 0,8096 | 0,504 → 0,398 | 0,989 → 1,000 | 0,0323 / 0,0058 | keine |
| XLK | 2025-12-05 | 2:1 | 1,0073 | 1,0046 | 0,5001 / 0,5001 / 0,5006 / 0,5002 | 0,165 → 0,124 | 1,014 → 1,018 | 0,0033 / 0,0016 | forward_splits 1→2 |
| XLU | 2025-12-05 | 2:1 | 0,9906 | 1,0002 | 0,5000 / 0,5000 / 0,4996 / 0,5002 | 0,697 → 0,694 | 1,012 → 1,015 | 0,0035 / 0,0008 | forward_splits 1→2 |
| XLY | 2025-12-05 | 2:1 | 1,0055 | 1,0009 | 0,4999 / 0,5000 / 0,5000 / 0,4995 | 0,201 → 0,199 | 1,004 → 1,008 | 0,0021 / 0,0002 | forward_splits 1→2 |

Unbereinigt wäre Schluss Splittag / Vortag ≈ 1/Faktor (0,5 bzw. 0,812), der Betrag Yahoo / Alpaca-roh ≈ 1 und das Umsatzverhältnis vor dem Split halbiert. Gemessen: Kurse, Umsätze und Beträge sind rückwirkend mit demselben Faktor bereinigt; der Satz Betrag / Vortagesschluss springt nicht. adjclose/close hat an keinem Splittag eine Stufe (0).

XLF 19.09.2016: Yahoo führt die Abspaltung des Immobiliensektors (XLRE-Stücke an XLF-Halter) als Split 1231:1000. Alpaca führt am selben Tag keinen Split, sondern einen „cash_dividends"-Satz 0,139146 — das ist das Stückverhältnis: 0,139146 × XLRE-Schluss 31,91 $ = 4,4401 $ je XLF-Stück bei rohem Vortagesschluss 23,62 $ → Faktor 1,2315 (Yahoo 1,231). Die Minutenquelle trifft die XLF-Schlüsse vor dem Tag mit Faktor 1,231 (mittl. Abw. 0,0323 %). Wertwirkung damit enthalten; liegt vor Fenster A (nur Rückblick der ersten Stichtage und §5).

## 5. Ausschüttungen

### Zahl je Kalenderjahr (Ex-Tag in New York)

| Jahr | XLB | XLC | XLE | XLF | XLI | XLK | XLP | XLRE | XLU | XLV | XLY | SPY |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1998 | 0 |  | 0 | 0 | 0 | 0 | 0 |  | 0 | 0 | 0 | 1 |
| 1999 | 4 |  | 4 | 4 | 4 | **1** | 4 |  | 4 | **1** | 4 | 4 |
| 2000 | 4 |  | 4 | 4 | 4 | **0** | 4 |  | **5** | **1** | 4 | 4 |
| 2001 | 4 |  | 4 | 4 | **3** | **0** | 4 |  | 4 | 4 | 4 | 4 |
| 2002 | 4 |  | 4 | 4 | 4 | **1** | 4 |  | 4 | 4 | 4 | 4 |
| 2003 | 4 |  | 4 | 4 | 4 | **1** | 4 |  | 4 | 4 | 4 | 4 |
| 2004 | 4 |  | 4 | 4 | 4 | **1** | 4 |  | 4 | 4 | 4 | **5** |
| 2005 | 4 |  | 4 | 4 | 4 | **1** | 4 |  | 4 | 4 | 4 | 4 |
| 2006 | 4 |  | 4 | 4 | 4 | **2** | 4 |  | 4 | 4 | 4 | 4 |
| 2007 | 4 |  | 4 | 4 | 4 | **3** | 4 |  | 4 | 4 | 4 | 4 |
| 2008 | 4 |  | 4 | 4 | 4 | 4 | 4 |  | 4 | 4 | 4 | 4 |
| 2009 | 4 |  | 4 | 4 | 4 | 4 | 4 |  | 4 | 4 | 4 | 4 |
| 2010 | 4 |  | 4 | 4 | 4 | 4 | 4 |  | 4 | 4 | 4 | 4 |
| 2011 | 4 |  | 4 | 4 | 4 | 4 | 4 |  | 4 | 4 | 4 | 4 |
| 2012 | 4 |  | 4 | 4 | 4 | 4 | 4 |  | 4 | 4 | 4 | 4 |
| 2013 | 4 |  | 4 | 4 | 4 | 4 | 4 |  | 4 | 4 | 4 | 4 |
| 2014 | 4 |  | 4 | 4 | 4 | 4 | 4 |  | 4 | 4 | 4 | 4 |
| 2015 | 4 |  | 4 | 4 | 4 | 4 | 4 | 1 | 4 | 4 | 4 | 4 |
| 2016 | 4 |  | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2017 | 4 |  | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2018 | 4 | 2 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2019 | 4 | 4 | **5** | 4 | 4 | 4 | 4 | 4 | 4 | **5** | 4 | 4 |
| 2020 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2021 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2022 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2023 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2024 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2025 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 4 |
| 2026 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| Summe | 110 | 32 | 111 | 110 | 109 | 84 | 110 | 43 | 111 | 105 | 110 | 112 |

2026 bis 15.09.2026 (zwei Sätze, der September-Satz hat Ex-Tag 21.09.2026, nach Datenende). Fett: volles Jahr mit ≠ 4 Sätzen.

### Sätze = Betrag / Schluss der letzten Zeile vor dem Ex-Tag

| Kürzel | n | kleinster % | Median % | größter % |
|---|---|---|---|---|
| XLB | 110 | 0,1282 | 0,4926 | 2,5390 |
| XLC | 32 | 0,1594 | 0,2453 | 0,3475 |
| XLE | 111 | 0,2568 | 0,5119 | 2,9037 |
| XLF | 110 | 0,2097 | 0,4459 | 1,4711 |
| XLI | 109 | 0,1273 | 0,4373 | 0,9623 |
| XLK | 84 | 0,0020 | 0,3523 | 1,9460 |
| XLP | 110 | 0,1763 | 0,5950 | 1,1096 |
| XLRE | 43 | 0,5255 | 0,8188 | 1,8024 |
| XLU | 111 | 0,5369 | 0,8194 | 1,2478 |
| XLV | 105 | 0,0181 | 0,3887 | 0,6470 |
| XLY | 110 | 0,0206 | 0,2671 | 0,7542 |
| SPY | 112 | 0,2349 | 0,4371 | 0,8052 |

Außerhalb 0,01 %–5 %: XLK 1999-12-17 Betrag 0,0005 $ / Schluss 25,50 $ = 0,0020 %. Ex-Tage ohne Handelstag: keiner. Beträge ≤ 0: keiner. Mehrere Sätze an einem Tag: keiner. Ereignis-Stempel: 13:30 UTC (786), 14:30 UTC (361).

### Auffällige Zählungen (volle Jahre mit ≠ 4 Sätzen)

- **XLE**: 2019: 5 (2019-03-15 0,257, 2019-06-21 0,288, 2019-09-20 0,28, 2019-12-20 0,2965, 2019-12-30 0,8955)
- **XLI**: 2001: 3 (2001-03-16 0,079, 2001-06-15 0,065, 2001-09-21 0,091)
- **XLK**: 1999: 1 (1999-12-17 0,0005); 2000: 0; 2001: 0; 2002: 1 (2002-12-20 0,0205); 2003: 1 (2003-12-19 0,0705); 2004: 1 (2004-12-17 0,209); 2005: 1 (2005-12-16 0,074); 2006: 2 (2006-09-15 0,022, 2006-12-15 0,0675); 2007: 3 (2007-06-15 0,009, 2007-09-21 0,0265, 2007-12-21 0,0615)
- **XLU**: 2000: 5 (2000-03-17 0,0985, 2000-06-16 0,1105, 2000-09-15 0,1255, 2000-12-15 0,119, 2000-12-18 0,127)
- **XLV**: 1999: 1 (1999-12-20 0,176); 2000: 1 (2000-12-18 0,005); 2019: 5 (2019-03-15 0,341, 2019-06-21 0,398, 2019-09-20 0,38, 2019-12-20 0,422, 2019-12-30 0,666)
- **SPY**: 2004: 5 (2004-03-19 0,395, 2004-06-18 0,414, 2004-09-17 0,469, 2004-11-15 0,351, 2004-12-17 0,568)

Lesart: **XLK** (84 Sätze gegen ~110) zahlte 1999 einen Kleinstbetrag, 2000 und 2001 nichts, 2002–2005 je eine Dezember-Zahlung, 2006 zwei, 2007 drei und erst ab 2008 vierteljährlich — das Muster eines Fonds, dessen Dividendenerträge die Kosten anfangs kaum deckten (stetiger Übergang zu häufigeren Zahlungen, kleine Beträge), keine Lücke mitten in einer Quartalsfolge — plausibel, aber vor 2016 ohne zweite Quelle. Ab 2008 hat XLK jedes Jahr vier Sätze, ab Juni 2016 von Alpaca bestätigt. XLV 1999/2000 (je ein Satz) zeigt dasselbe Anfangsmuster. **XLI 2001** (Dezember fehlt) ist die einzige Lücke mitten in einer Quartalsfolge — nicht prüfbar (keine zweite Quelle vor 2016), nur §5 betroffen. Vier Jahre mit fünf Sätzen enthalten je eine zusätzliche Zahlung (XLE und XLV 30.12.2019 — von Alpaca bestätigt —, XLU 18.12.2000 drei Tage nach dem 15.12.2000, SPY 15.11.2004); die drei vor 2016 sind nicht gegenprüfbar, jede hat ihre Stufe in adjclose.

## 6. adjclose gegen close + Ausschüttungen

Faktor f = adjclose / close je Zeile; Stufe = relative Änderung > 10^−6 zwischen zwei Zeilen; Soll-Multiplikator f(Vortag)/f(Ex-Tag) = 1 − Betrag / close(Vortag) (CRSP).

| Kürzel | Stufen | → Ausschüttung | → Split | ohne Ereignis (größte \|Δ\|, Jahre) | davon > 10^−5 | Ausschüttungen ohne Stufe | kleinste Ausschüttungsstufe | größte \|Ist − Soll\| (Tag) |
|---|---|---|---|---|---|---|---|---|
| XLB | 119 | 110 | 0 | 9 (1,22·10^-6, 1999-2012) | 0 | 0 | 1,28·10^-3 | 6,96·10^-7 (2011-03-18) |
| XLC | 32 | 32 | 0 | 0 | 0 | 0 | 1,60·10^-3 | 4,19·10^-7 (2021-06-21) |
| XLE | 121 | 111 | 0 | 10 (1,31·10^-6, 1999-2015) | 0 | 0 | 2,57·10^-3 | 7,61·10^-7 (2001-09-21) |
| XLF | 127 | 110 | 0 | 17 (1,42·10^-6, 1999-2008) | 0 | 0 | 2,10·10^-3 | 8,34·10^-7 (2008-12-19) |
| XLI | 117 | 109 | 0 | 8 (1,25·10^-6, 2000-2009) | 0 | 0 | 1,27·10^-3 | 8,57·10^-7 (2003-06-20) |
| XLK | 94 | 84 | 0 | 10 (1,28·10^-6, 2000-2010) | 0 | 0 | 1,95·10^-5 | 8,22·10^-7 (2010-09-17) |
| XLP | 127 | 110 | 0 | 17 (1,28·10^-6, 1999-2008) | 0 | 0 | 1,77·10^-3 | 1,05·10^-6 (2006-06-16) |
| XLRE | 43 | 43 | 0 | 0 | 0 | 0 | 5,28·10^-3 | 3,33·10^-7 (2020-12-21) |
| XLU | 120 | 111 | 0 | 9 (1,31·10^-6, 1999-2005) | 0 | 0 | 5,40·10^-3 | 7,90·10^-7 (1999-03-19) |
| XLV | 107 | 105 | 0 | 2 (1,02·10^-6, 1999-2003) | 0 | 0 | 1,81·10^-4 | 7,82·10^-7 (2001-09-21) |
| XLY | 122 | 110 | 0 | 12 (1,55·10^-6, 1999-2016) | 0 | 0 | 2,06·10^-4 | 7,55·10^-7 (2003-03-21) |
| SPY | 118 | 112 | 0 | 6 (1,23·10^-6, 2000-2004) | 0 | 0 | 2,35·10^-3 | 1,19·10^-6 (2004-12-17) |

Die Stufen ohne Ereignis sind Rundung der gelieferten Kurse (alle ≤ 1,55·10^-6, fast nur in den Jahren niedriger Kurse vor 2010); die kleinste echte Stufe (XLK 1999, Betrag 0,0005 $) liegt eine Größenordnung darüber. Jede Ausschüttung hat ihre Stufe, kein Split erzeugt eine Stufe.

### Gesamtertrag auf zwei Wegen (nur Abgleich der Rechenwege, alphabetisch, keine Rangfolge)

(a) adjclose(Ende) / adjclose(Start) − 1; (b) Schluss + Ausschüttungen, Wiederanlage am Ex-Tag zum Schluss (Stück += Stück × Betrag / close(Ex-Tag)). A: Schluss 03.01.2017 → 15.09.2021; B: 15.09.2021 → 15.09.2026; L: 31.12.1999 → 15.09.2026.

| Kürzel | A (a) % | A (b) % | A Δ Pp | B (a) % | B (b) % | B Δ Pp | L (a) % | L (b) % | L Δ Pp |
|---|---|---|---|---|---|---|---|---|---|
| XLB | 83,55 | 83,64 | −0,087 | 33,44 | 33,40 | +0,040 | 588,30 | 588,04 | +0,258 |
| XLC | – | – | – | 42,66 | 42,65 | +0,009 | – | – | – |
| XLE | −18,36 | −18,20 | −0,161 | 214,71 | 214,39 | +0,319 | 878,13 | 878,80 | −0,671 |
| XLF | 76,05 | 76,17 | −0,126 | 63,75 | 63,71 | +0,044 | 395,10 | 394,83 | +0,273 |
| XLI | 77,61 | 77,69 | −0,084 | 78,33 | 78,28 | +0,052 | 812,25 | 812,39 | −0,132 |
| XLK | 243,22 | 243,23 | −0,007 | 141,71 | 141,69 | +0,018 | 817,73 | 817,87 | −0,137 |
| XLP | 56,83 | 56,85 | −0,022 | 32,73 | 32,68 | +0,048 | 586,07 | 586,06 | +0,019 |
| XLRE | 77,87 | 77,99 | −0,118 | 7,88 | 7,84 | +0,044 | – | – | – |
| XLU | 62,74 | 62,76 | −0,020 | 41,24 | 41,14 | +0,098 | 635,85 | 634,90 | +0,948 |
| XLV | 106,23 | 106,30 | −0,061 | 36,48 | 36,45 | +0,030 | 708,01 | 707,92 | +0,086 |
| XLY | 136,87 | 136,90 | −0,029 | 25,64 | 25,62 | +0,024 | 866,26 | 866,49 | −0,228 |
| SPY | 115,81 | 115,91 | −0,102 | 80,93 | 80,97 | −0,034 | 722,95 | 723,59 | −0,635 |

SPY (a) in A = 115,81 % trifft die in Nr. 78 genannte „bereinigte Yahoo-Reihe +115,81 %". Der Unterschied (a) − (b) entsteht, weil der CRSP-Faktor die Ausschüttung zum Vortagesschluss anlegt, (b) zum Ex-Tag-Schluss.

## 7. Zweite Quelle für Ausschüttungen: Alpaca (`alpaca-massnahmen`, Nachtrag 2026-10), ab 2016

Alpaca-Sätze sind roh je damaliger Aktie; vor einem Yahoo-Split durch den Splitfaktor geteilt („umgerechnet"). Verglichen bis 15.09.2026, Toleranz 0,0005 $.

| Kürzel | erster Alpaca-Ex-Tag | Alpaca bis 15.09.2026 | davon umgerechnet | Yahoo ab 2016 | gleich | nur Yahoo | nur Alpaca | Betrag verschieden | größte \|Abw.\| $ | Alpaca nach Datenende |
|---|---|---|---|---|---|---|---|---|---|---|
| XLB | 2016-06-17 | 41 | 38 | 42 | 41 | 2016-03-18 | – | – | 0,000286 | 2026-09-21 |
| XLC | 2018-09-21 | 32 | 0 | 32 | 30 | – | – | 2019-06-21 (+0,000500), 2021-06-21 (+0,000502) | 0,000502 | 2026-09-21 |
| XLE | 2016-06-17 | 42 | 39 | 43 | 42 | 2016-03-18 | – | – | 0,000246 | 2026-09-21 |
| XLF | 2016-03-18 | 43 | 3 | 42 | 40 | – | 2016-09-19 (0,139146) | 2016-03-18 (−0,018680), 2018-09-21 (+0,000500) | 0,018680 | 2026-09-21 |
| XLI | 2016-06-17 | 41 | 0 | 42 | 41 | 2016-03-18 | – | – | 0,000469 | 2026-09-21 |
| XLK | 2016-06-17 | 41 | 38 | 42 | 41 | 2016-03-18 | – | – | 0,000495 | 2026-09-21 |
| XLP | 2016-06-17 | 41 | 0 | 42 | 41 | 2016-03-18 | – | – | 0,000494 | 2026-09-21 |
| XLRE | 2016-06-17 | 41 | 0 | 42 | 41 | 2016-03-18 | – | – | 0,000485 | 2026-09-21 |
| XLU | 2016-06-17 | 41 | 38 | 42 | 41 | 2016-03-18 | – | – | 0,000415 | 2026-09-21 |
| XLV | 2016-06-17 | 42 | 0 | 43 | 40 | 2016-03-18 | – | 2019-09-20 (+0,000500), 2021-03-22 (+0,000532) | 0,000532 | 2026-09-21 |
| XLY | 2016-06-17 | 41 | 38 | 42 | 41 | 2016-03-18 | – | – | 0,000377 | 2026-09-21 |
| SPY | 2016-06-17 | 40 | 0 | 42 | 39 | 2016-03-18, 2018-06-15 | – | 2021-12-17 (−0,003431) | 0,003431 | – |

- **Nur Yahoo 18.03.2016** bei elf Reihen: Alpacas Archiv beginnt erst mit dem Ex-Tag 17.06.2016 (XLF: 18.03.2016) — Lücke der zweiten Quelle, nicht Yahoos. SPY 15.06.2018 fehlt bei Alpaca (bekannt, Nr. 78); Yahoo führt ihn mit 1,2460 $ (Ergänzungswert 1,2456 $).
- **Abweichungen um 0,0005 $** (XLC, XLF 2018, XLV): Yahoo rundet auf drei Stellen (0,118 gegen 0,1175) — Rundung, kein Fehler.
- **XLF 2016-03-18**: Yahoo 0,081235 $, Alpaca 0,122995 $ roh / 1,231 = 0,099915 $, Δ −0,018680 $ (Satz −0,1016 Pp) — Yahoos Betrag × 1,231 = 0,100000 $ roh; welche Quelle irrt, ist offen. Liegt vor Fenster A: wirkt nur über adjclose im Rückblick der ersten Stichtage von A und in §5, um den Satzunterschied.
- **SPY 2021-12-17**: Yahoo 1,633000 $, Alpaca 1,636431 $ roh, Δ −0,003431 $ (Satz −0,0007 Pp) — wirkt im Maßstab B nur um diesen Satzunterschied (Pflichtprüfung (iv) B −0,0037 $, innerhalb 0,01 $).

## 8. SPY nach §1.9

| Prüfung | Ist | Soll | Differenz | bestanden |
|---|---|---|---|---|
| Yahoo-Satz mit Ex-Tag 15.06.2018 | 1,2460 $ | vorhanden oder ergänzt | 0,0004 $ zum Ergänzungswert | ja |
| Ex-Tage 2017 | 4 | 4 | 0 | ja |
| Ex-Tage 2018 | 4 | 4 | 0 | ja |
| Ex-Tage 2019 | 4 | 4 | 0 | ja |
| Ex-Tage 2020 | 4 | 4 | 0 | ja |
| Ex-Tage 2021 | 4 | 4 | 0 | ja |
| Ex-Tage 2022 | 4 | 4 | 0 | ja |
| Ex-Tage 2023 | 4 | 4 | 0 | ja |
| Ex-Tage 2024 | 4 | 4 | 0 | ja |
| Ex-Tage 2025 | 4 | 4 | 0 | ja |
| Ex-Tage A (04.01.2017, 15.09.2021] | 18 | 18 | 0 | ja |
| Ex-Tage B (16.09.2021, 15.09.2026] | 20 | 20 | 0 | ja |
| (i) Schluss 03.01.2017 → 15.09.2021, Wiederanlage | +115,9120 % | +115,95 % | −0,0380 Pp | ja |
| (ii) 100.000 $ Eröffnung 04.01.2017 (open 225,6200) → Schluss 15.09.2021 | 215.548,40 $ | 215.535,73 $ | +12,67 $ = +0,0127 Pp | ja |
| (iii) 100.000 $ Eröffnung 16.09.2021 (open 447,3200) → Schluss 15.09.2026 | 181.193,89 $ | 181.193,87 $ | +0,02 $ = 0,0000 Pp | ja |
| (iv) Summe je Anteil A | 23,8670 $ | 23,8656 $ | +0,0014 $ | ja |
| (iv) Summe je Anteil B | 34,0620 $ | 34,0657 $ | −0,0037 $ | ja |

Toleranz (i)–(iii) 0,30 Pp, (iv) 0,01 $. Die Reste erklären sich aus den Beträgen: A +0,0004 $ (15.06.2018: Yahoo 1,246 gegen 1,2456) plus Yahoos Rundung auf drei Stellen; B −0,0034 $ (17.12.2021: Yahoo 1,633 gegen Alpaca 1,636431). Unabhängig gerechnet (eigener Parser, eigene Schleife); adjclose ergibt für (i) 115,81 %.

## 9. Zweite Kursquelle: Alpaca-Minuten (`alpaca1m`, SIP, roh)

Tagesdateien `bars_1d_<KÜRZEL>.json` der zwölf Kürzel: `archiv1d/` keine, `such1d/` keine (dort liegen nur Nachbarn wie SPYD/SPYG/SPYV). Ersatz: das Minutenarchiv `E:/Markt-Dashboard-Archiv/alpaca1m/<KÜRZEL>/<JAHR>.json`, alle zwölf Reihen ab 2016 (XLC ab 2018). Schluss = Eroeffnung der 16:00-Kerze (NY), Rueckfall Schluss der 15:59-Kerze, sonst letzte Kerze 09:30-15:59; an den 21 NYSE-Tagen mit Schluss 13:00 Eroeffnung der 13:00-Kerze, Rueckfall 12:59-Schluss. Eroeffnung = Eroeffnung der 09:30-Kerze. Rohkurse geteilt durch die Yahoo-Splitfaktoren nach dem Tag.

| Kürzel | gemeinsame Tage | Schluss mittl. \|Abw.\| % | Median % | größte (Tag) | Tage > 0,5 % | Yahoo-Schluss außerhalb Minutenspanne | Eröffnung mittl. \|Abw.\| % | Eröffnung > 0,5 % | Yahoo-open außerhalb Minutenspanne (in A/B) | Umsatz Yahoo / Alpaca (Median) | Schluss-Quelle |
|---|---|---|---|---|---|---|---|---|---|---|---|
| XLB | 2.690 | 0,0057 | 0,0000 | −1,227 % (2016-03-21) | 3 | 0 | 0,0127 | 5 | 1 (1) | 1,001 | 16:00-Eroeffnung 2667, verkuerzt 13:00-Eroeffnung 21, 15:59-Schluss 1, letzte Kerze 1 |
| XLC | 2.071 | 0,0020 | 0,0000 | −0,268 % (2018-09-21) | 0 | 0 | 0,0130 | 2 | 2 (2) | 1,002 | letzte Kerze 5, 15:59-Schluss 34, 16:00-Eroeffnung 2014, verkuerzt 13:00-Eroeffnung 18 |
| XLE | 2.690 | 0,0077 | 0,0000 | +0,594 % (2020-03-23) | 1 | 0 | 0,0134 | 5 | 2 (1) | 1,008 | 16:00-Eroeffnung 2668, verkuerzt 13:00-Eroeffnung 21, letzte Kerze 1 |
| XLF | 2.690 | 0,0076 | 0,0000 | −0,283 % (2020-03-23) | 0 | 0 | 0,0098 | 3 | 3 (2) | 1,012 | 16:00-Eroeffnung 2668, verkuerzt 13:00-Eroeffnung 21, letzte Kerze 1 |
| XLI | 2.690 | 0,0040 | 0,0000 | +0,313 % (2016-03-16) | 0 | 0 | 0,0093 | 3 | 2 (2) | 1,001 | 16:00-Eroeffnung 2668, verkuerzt 13:00-Eroeffnung 21, letzte Kerze 1 |
| XLK | 2.690 | 0,0032 | 0,0000 | −0,167 % (2018-06-07) | 0 | 0 | 0,0078 | 1 | 1 (1) | 1,004 | 16:00-Eroeffnung 2667, verkuerzt 13:00-Eroeffnung 21, 15:59-Schluss 1, letzte Kerze 1 |
| XLP | 2.690 | 0,0037 | 0,0000 | −0,244 % (2016-04-18) | 0 | 0 | 0,0103 | 3 | 1 (1) | 1,001 | 16:00-Eroeffnung 2667, verkuerzt 13:00-Eroeffnung 21, 15:59-Schluss 1, letzte Kerze 1 |
| XLRE | 2.688 | 0,0018 | 0,0000 | −0,182 % (2019-08-12) | 0 | 0 | 0,0186 | 3 | 2 (2) | 1,001 | letzte Kerze 134, 15:59-Schluss 17, 16:00-Eroeffnung 2516, verkuerzt 13:00-Eroeffnung 21 |
| XLU | 2.690 | 0,0033 | 0,0000 | −0,449 % (2016-03-16) | 0 | 0 | 0,0095 | 4 | 1 (1) | 1,002 | 16:00-Eroeffnung 2667, verkuerzt 13:00-Eroeffnung 21, 15:59-Schluss 1, letzte Kerze 1 |
| XLV | 2.690 | 0,0054 | 0,0000 | −1,001 % (2018-11-30) | 2 | 0 | 0,0124 | 3 | 1 (0) | 1,002 | 16:00-Eroeffnung 2667, verkuerzt 13:00-Eroeffnung 21, 15:59-Schluss 1, letzte Kerze 1 |
| XLY | 2.690 | 0,0020 | 0,0000 | −0,099 % (2017-08-08) | 0 | 0 | 0,0083 | 2 | 2 (2) | 1,000 | 16:00-Eroeffnung 2667, verkuerzt 13:00-Eroeffnung 21, 15:59-Schluss 1, letzte Kerze 1 |
| SPY | 2.690 | 0,0128 | 0,0091 | −0,937 % (2025-04-09) | 3 | 0 | 0,0044 | 2 | 4 (2) | 1,121 | 16:00-Eroeffnung 2668, verkuerzt 13:00-Eroeffnung 21, letzte Kerze 1 |

**Schlusskurse mit > 0,5 % Abweichung** (Fenster in Klammern; „15:59" = Abweichung des 15:59-Schlusses als Gegenprobe; Spanne = tiefster/höchster Minutenkurs 09:30–16:00):

- XLB 2016-03-15: Yahoo 22,10, Minuten 21,84 (−1,18 %, 16:00-Eroeffnung; 15:59 −1,17 %); Spanne 21,72–22,10, Yahoo-Schluss darin
- XLB 2016-03-21: Yahoo 22,82, Minuten 22,54 (−1,23 %, 16:00-Eroeffnung; 15:59 −1,21 %); Spanne 22,38–22,82, Yahoo-Schluss darin
- XLB 2018-07-18 (A): Yahoo 29,16, Minuten 29,45 (+0,99 %, 16:00-Eroeffnung; 15:59 +1,01 %); Spanne 29,16–29,57, Yahoo-Schluss darin
- XLE 2020-03-23 (A): Yahoo 11,78, Minuten 11,86 (+0,59 %, 16:00-Eroeffnung; 15:59 −0,17 %); Spanne 11,57–12,64, Yahoo-Schluss darin
- XLV 2018-11-30 (A): Yahoo 95,87, Minuten 94,91 (−1,00 %, 16:00-Eroeffnung; 15:59 −0,99 %); Spanne 93,80–95,87, Yahoo-Schluss darin
- XLV 2020-03-20 (A): Yahoo 79,09, Minuten 78,69 (−0,51 %, 16:00-Eroeffnung; 15:59 −0,51 %); Spanne 78,64–83,81, Yahoo-Schluss darin
- SPY 2020-03-13 (A): Yahoo 269,32, Minuten 270,94 (+0,60 %, 16:00-Eroeffnung; 15:59 +0,60 %); Spanne 249,58–271,10, Yahoo-Schluss darin
- SPY 2020-03-17 (A): Yahoo 252,80, Minuten 254,44 (+0,65 %, 16:00-Eroeffnung; 15:59 +0,55 %); Spanne 237,07–256,17, Yahoo-Schluss darin
- SPY 2025-04-09 (B): Yahoo 548,62, Minuten 543,48 (−0,94 %, 16:00-Eroeffnung; 15:59 −0,96 %); Spanne 493,05–548,62, Yahoo-Schluss darin

Lesart: Yahoos Schluss liegt an jedem dieser Tage in der gehandelten Spanne, meist genau auf dem Tageshoch oder -tief — dort lag der Auktionskurs, der in der 16:00-Kerze nicht der erste Handel war. Die Abweichung kommt aus der Ableitung „Eröffnung der 16:00-Kerze", nicht aus Yahoo. Über alle 2016–2026 gemeinsamen Tage liegt **kein** Yahoo-Schluss außerhalb der Minutenspanne (0).

**Yahoo-`open` außerhalb der gehandelten Minutenspanne** (mehr als 0,05 % daneben; „= Vortag": `open` gleich Vortagesschluss, „= Tief/Hoch": Yahoo hat Tief bzw. Hoch auf diesen `open` gezogen):

| Kürzel | Tag | Fenster | Yahoo open | Minuten-Eröffnung 09:30 | Minutenspanne | Abstand zur Spanne % | Muster |
|---|---|---|---|---|---|---|---|
| XLB | 2017-10-30 | A | 29,6900 | 29,5250 | 29,3600–29,5850 | +0,355 | = Hoch |
| XLC | 2018-08-03 | A | 48,0900 | 48,8600 | 48,6500–48,9300 | −1,151 | = Tief |
| XLC | 2023-06-05 | B | 62,9200 | 62,9550 | 62,9550–63,8800 | −0,056 | = Tief |
| XLE | 2016-10-10 | – | 35,3050 | 35,6550 | 35,6200–35,9900 | −0,884 | = Vortag, = Tief |
| XLE | 2017-10-30 | A | 33,4350 | 33,7200 | 33,6551–33,9400 | −0,654 | = Tief |
| XLF | 2016-09-19 | – | 19,1800 | 19,3500 | 19,2300–19,4499 | −0,260 | = Tief |
| XLF | 2017-02-08 | A | 23,5500 | 23,4600 | 23,2800–23,4800 | +0,298 | = Vortag, = Hoch |
| XLF | 2017-02-09 | A | 23,3900 | 23,4600 | 23,4100–23,7400 | −0,085 | = Vortag |
| XLI | 2017-02-09 | A | 63,7300 | 63,8900 | 63,7900–64,3800 | −0,094 | = Vortag, = Tief |
| XLI | 2023-06-05 | B | 101,1500 | 101,0800 | 100,1100–101,0800 | +0,069 | = Hoch |
| XLK | 2017-10-30 | A | 30,9400 | 31,2800 | 31,2217–31,4600 | −0,902 | = Tief |
| XLP | 2017-10-30 | A | 53,4200 | 52,9800 | 52,6100–53,0300 | +0,735 | = Hoch |
| XLRE | 2017-10-30 | A | 32,0800 | 32,2000 | 32,1756–32,5700 | −0,297 | = Tief |
| XLRE | 2018-08-07 | A | 33,5700 | 33,4900 | 33,2100–33,4900 | +0,239 | – |
| XLU | 2017-10-30 | A | 27,3250 | 27,5100 | 27,4400–27,5850 | −0,419 | = Tief |
| XLV | 2016-11-09 | – | 68,3700 | 71,2300 | 69,2600–71,5700 | −1,285 | = Vortag, = Tief |
| XLY | 2017-10-30 | A | 45,8050 | 46,0150 | 45,8875–46,0950 | −0,180 | = Tief |
| XLY | 2018-08-07 | A | 55,9650 | 56,4200 | 56,3100–56,6475 | −0,613 | = Tief |
| SPY | 2016-08-05 | – | 216,4100 | 217,2100 | 217,0700–218,2300 | −0,304 | = Vortag, = Tief |
| SPY | 2016-11-07 | – | 208,5500 | 211,4500 | 211,3000–213,2400 | −1,302 | = Vortag, = Tief |
| SPY | 2017-02-09 | A | 229,2400 | 229,5600 | 229,5200–230,9500 | −0,122 | = Vortag, = Tief |
| SPY | 2017-05-17 | A | 240,0800 | 238,1000 | 235,7500–238,6400 | +0,603 | = Vortag, = Hoch |

Lesart: Zu diesen `open`-Werten gibt es laut Minutenarchiv an dem Tag keinen Handel; 9 von 22 sind genau der Vortagesschluss (veraltet), am 30.10.2017 trifft es 7 Fonds zugleich. Für die Messung zählt `open` nur an Ausführungstagen (Handelspreis, §1.7) und für SPY am Kauftag: 04.01.2017 und 16.09.2021 sind nicht betroffen; die Startphase k = 25 von A kauft SPY am 09.02.2017. ZUSATZ §1.7 handelt zum gelieferten `open` — kein Filter; der Lauf kann zählen, wie viele Ausführungen auf diese Tage fallen. Eröffnungsabweichungen > 0,5 % innerhalb der Spanne (Eröffnungsauktion gegen ersten SIP-Handel, Stresstage) sind kein Fehler. Umsatz: Yahoo / Alpaca-Minuten ≈ 1,00–1,01 je Fonds (SPY 1,12).

## 10. Tages-Panel v2.2

`studien/querschnitt-pruefstand-2026-09-13/voll-v22/panel/_stand.json` (`symbole`, nur Namen gelesen): 7.479 Reihen; Treffer unter den zwölf Kürzeln: SPY (Art ETF, Referenzreihe). Ausgeschlossene Arten: ETF, ETN, ETV, FUND, ETS, ohne Art, TEST, UNIT. Kein Sektor-Fonds steht im Panel; REGEL C.2 („nicht geprüft") trifft zu.

Laufzeit 7,4 s.
