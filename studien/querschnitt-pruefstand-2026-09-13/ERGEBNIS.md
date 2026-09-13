# Ergebnis — Querschnitts-Prüfstand, Teil 1

Erzeugt 2026-09-13T23:36:43.116Z von `bericht.js` aus `kontrollen.json`.
Vorregistrierung: `VORREGISTRIERUNG.md` (erster Commit, vor jeder Zahl). Konfiguration `querschnitt-pruefstand-2026-09-13/v1`.
**Teil 1 baut keine Strategie und belegt keine Kante.** Alles Simulation mit virtuellem Kapital,
keine Anlageberatung.

## Urteil

| Kontrolle | Schranke (vorab) | Ergebnis | Urteil |
|---|---|---|---|
| **Leck-Sperrklinke** | Leck-Probe meldet > 0, saubere Probe 0 | 111406 / 0 | **bestanden** |
| **Orakel** (Rendite von morgen) | ≥ 2 Pp je Periode, Mittel/sd ≥ 1, t ≥ 8 | Woche +3.252 Pp (t 26.6), Monat +3.937 Pp (t 8.8) | **GEFALLEN** |
| **Orakel**, Perioden-Fassung | ≥ 5 Pp je Woche | +8.874 Pp (t 52.9) | — |
| **Zufall** (woechentlich) | \|Mittel der 12\| < 0.1 Pp; ≤ 3 Ziehungen mit \|t\| ≥ 3 | +0.0032 Pp brutto, +0.0057 Pp netto+Kosten, 0 Ziehungen | **bestanden** |
| **Zufall** (monatlich) | \|Mittel der 12\| < 0.25 Pp; ≤ 3 Ziehungen mit \|t\| ≥ 3 | -0.0189 Pp brutto, -0.0127 Pp netto+Kosten, 0 Ziehungen | **bestanden** |
| **Momentum 12-1** (monatlich) | *kein Tor*, Erwartung positiv | brutto +1.6221 Pp (t 2.62), netto +1.6100 Pp | — |

**NICHT BESTANDEN.** 
- ORAKEL GEFALLEN: Orakel(Tag) monat Mittel/sd 0.82 < 1

## 1. Die Datentafel

| Größe | Wert |
|---|---|
| Zeilen (Handelstag × Reihe) | **9.899.585** |
| Reihen | 7300 (davon 1 Referenz) |
| Zeitraum | 2016 bis 2026-09-11 |
| letzter vollständiger Handelstag | 2026-09-11 (Nachtrag 1) |
| unvollständige Tage am Rand | 0 |
| gelesene Archivdateien | 45.107 |
| gelesene Bytes | 122.3 GB |
| geprüfte Minutenkerzen | 2.497 Mrd |
| Dateien mit fremder Quelle (nicht SIP) | **0** |
| Stempelkerzen (Form: O=H=T=C und Umsatz 0) | 0 von 2.496.832.460 geprüften |
| Stempeltage (alle regulären Kerzen Stempel) | 0 von 9.899.585 Tagen |
| Reihen-Lücken (Tag fehlt mitten in der Reihe) | 103.856 |
| ausgeschlossene Wertpapierarten | {"ETF":694,"ETN":7,"ETV":35,"FUND":16,"ETS":4,"ohne Art":1,"TEST":1,"UNIT":1} |

### Ersatzregel für den Tagesschluss, je Jahr

Der Tagesschluss ist die **Eröffnung der Kerze mit dem ET-Stempel des Kalenderschlusses** (§1.3).
Fehlt sie, greift die Ersatzregel (Schluss der letzten regulären Kerze). So oft:

| Jahr | Tageszeilen | Schluss-Ersatz | Anteil | Eröffnungs-Ersatz | Anteil |
|---|---|---|---|---|---|
| 2016 | 983.226 | 509.351 | 51.80 % | 129.317 | 13.15 % |
| 2017 | 976.411 | 481.465 | 49.31 % | 105.910 | 10.85 % |
| 2018 | 964.541 | 470.531 | 48.78 % | 93.141 | 9.66 % |
| 2019 | 943.858 | 468.906 | 49.68 % | 98.326 | 10.42 % |
| 2020 | 940.816 | 226.505 | 24.08 % | 71.081 | 7.56 % |
| 2021 | 1.059.973 | 134.435 | 12.68 % | 91.518 | 8.63 % |
| 2022 | 1.078.321 | 209.538 | 19.43 % | 146.451 | 13.58 % |
| 2023 | 962.319 | 170.548 | 17.72 % | 113.734 | 11.82 % |
| 2024 | 849.277 | 90.291 | 10.63 % | 68.202 | 8.03 % |
| 2025 | 720.431 | 35.656 | 4.95 % | 28.300 | 3.93 % |
| 2026 | 420.412 | 11.125 | 2.65 % | 7.191 | 1.71 % |
| **gesamt** | **9.899.585** | **2.808.351** | **28.37 %** | **953.171** | **9.63 %** |

> **Ausschüttungen sind NICHT enthalten.** Das Archiv ist `adjustment=raw`, die bereinigte Kopie wendet
> Splits und gemessene Abspaltungen an, ausdrücklich keine Dividenden. In der Hauptgröße
> (Dezil minus Universum) kürzt sich eine gleich große Ausschüttung heraus; übrig bleibt die
> **Differenz** der Dividendenrendite zwischen Dezil und Universum. Sie ist **nicht gemessen**.

## 2. Orakel — die Verrohrungsprobe

| Fassung | Frequenz | n | Universum | Dezil | Umschlag | brutto (Pp) | netto (Pp) | t | Mittel/sd |
|---|---|---|---|---|---|---|---|---|---|
| orakelTag | woche | 505 | 221 | 22 | 84.0 % | +3.252 | +3.203 | 26.6 | 1.18 |
| orakelPeriode | woche | 505 | 221 | 22 | 85.9 % | +8.874 | +8.823 | 52.9 | — |
| orakelTag | monat | 116 | 219 | 21 | 86.7 % | +3.937 | +3.889 | 8.8 | 0.82 |
| orakelPeriode | monat | 116 | 219 | 21 | 86.7 % | +19.635 | +19.588 | 26.6 | — |

Das gefallene Kriterium `t ≥ 20` (Nachtrag 4) steht der Vollständigkeit halber daneben: orakelTag/woche → gehalten, orakelTag/monat → gefallen.

## 3. Zufall — muss null sein

**woechentlich**, 12 Ziehungen, n = 505 Perioden je Ziehung.

| Ziehung | brutto (Pp) | se | t | netto (Pp) | Kosten (Pp) | Umschlag |
|---|---|---|---|---|---|---|
| 0 | +0.0036 | 0.0457 | +0.08 | -0.0498 | 0.0559 | 90.4 % |
| 1 | -0.0176 | 0.0471 | -0.38 | -0.0709 | 0.0558 | 90.2 % |
| 2 | -0.0094 | 0.0479 | -0.20 | -0.0625 | 0.0557 | 90.0 % |
| 3 | +0.0147 | 0.0468 | +0.31 | -0.0388 | 0.0560 | 90.5 % |
| 4 | +0.0456 | 0.0474 | +0.96 | -0.0080 | 0.0562 | 90.9 % |
| 5 | -0.0325 | 0.0481 | -0.68 | -0.0859 | 0.0559 | 90.5 % |
| 6 | +0.0274 | 0.0459 | +0.60 | -0.0263 | 0.0563 | 90.9 % |
| 7 | +0.0378 | 0.0450 | +0.84 | -0.0157 | 0.0560 | 90.5 % |
| 8 | -0.0003 | 0.0433 | -0.01 | -0.0538 | 0.0561 | 90.6 % |
| 9 | -0.0856 | 0.0461 | -1.86 | -0.1388 | 0.0557 | 90.1 % |
| 10 | +0.0687 | 0.0480 | +1.43 | +0.0150 | 0.0563 | 90.9 % |
| 11 | -0.0140 | 0.0476 | -0.29 | -0.0675 | 0.0560 | 90.4 % |
| **Mittel** | **+0.0032** | 0.0134 | | **+0.0057** (netto+Kosten) | | |

Schranke 0.1 Pp = **7.4 se** des Mittels. Ziehungen mit \|t\| ≥ 3: **0** von 12. Das in Nachtrag 4 **gefallene** Einzelkriterium (Pp je Ziehung) hätte 0 Ziehungen verworfen.

**monatlich**, 12 Ziehungen, n = 116 Perioden je Ziehung.

| Ziehung | brutto (Pp) | se | t | netto (Pp) | Kosten (Pp) | Umschlag |
|---|---|---|---|---|---|---|
| 0 | +0.0091 | 0.1883 | +0.05 | -0.0411 | 0.0566 | 90.8 % |
| 1 | +0.2182 | 0.2168 | +1.01 | +0.1685 | 0.0560 | 90.1 % |
| 2 | +0.0930 | 0.2199 | +0.42 | +0.0425 | 0.0568 | 91.1 % |
| 3 | +0.1553 | 0.2083 | +0.75 | +0.1046 | 0.0570 | 91.4 % |
| 4 | +0.0051 | 0.1923 | +0.03 | -0.0450 | 0.0564 | 90.8 % |
| 5 | -0.0654 | 0.1865 | -0.35 | -0.1159 | 0.0567 | 91.4 % |
| 6 | -0.0086 | 0.1888 | -0.05 | -0.0586 | 0.0563 | 91.0 % |
| 7 | -0.3997 | 0.2060 | -1.95 | -0.4498 | 0.0564 | 90.4 % |
| 8 | +0.0722 | 0.1586 | +0.46 | +0.0219 | 0.0565 | 90.7 % |
| 9 | -0.4720 | 0.1864 | -2.54 | -0.5221 | 0.0564 | 90.6 % |
| 10 | -0.0112 | 0.1966 | -0.06 | -0.0615 | 0.0565 | 90.8 % |
| 11 | +0.1767 | 0.1856 | +0.96 | +0.1268 | 0.0562 | 90.6 % |
| **Mittel** | **-0.0189** | 0.0561 | | **-0.0127** (netto+Kosten) | | |

Schranke 0.25 Pp = **4.5 se** des Mittels. Ziehungen mit \|t\| ≥ 3: **0** von 12. Das in Nachtrag 4 **gefallene** Einzelkriterium (Pp je Ziehung) hätte 2 Ziehungen verworfen.

## 4. Momentum 12-1 — Erwartung positiv, **kein Tor**

| Frequenz / Ausbuchung | n | Universum | Umschlag | Kosten (Pp) | brutto (Pp) | t | netto (Pp) | t | Tote |
|---|---|---|---|---|---|---|---|---|---|
| woche/haupt | 504 | 221 | 14.6 % | 0.0091 | +0.3996 | 2.54 | +0.3931 | 2.50 | 6 |
| monat/haupt | 115 | 220 | 29.3 % | 0.0184 | +1.6221 | 2.62 | +1.6100 | 2.60 | 5 |
| monat/streng | 115 | 220 | 29.3 % | 0.0184 | +1.6367 | 2.65 | +1.6245 | 2.63 | 5 |
| monat/milde | 115 | 220 | 29.3 % | 0.0184 | +1.6221 | 2.62 | +1.6100 | 2.60 | 5 |
| monat/ohneCentBoden | 115 | 220 | 29.5 % | 0.0186 | +1.6069 | 2.59 | +1.5946 | 2.57 | 5 |

### Jahresscheiben (monatlich, Hauptzahl, netto)

| Jahr | n | Mittel (Pp) | se | t | |
|---|---|---|---|---|---|
| 2017 | 12 | +0.5693 | 0.9573 | 0.62 |  |
| 2018 | 12 | +0.8776 | 1.2880 | 0.71 |  |
| 2019 | 12 | +0.7675 | 1.2816 | 0.63 |  |
| 2020 | 12 | +5.9628 | 1.9181 | 3.25 |  |
| 2021 | 12 | -2.2210 | 2.0777 | -1.12 |  |
| 2022 | 12 | +1.5354 | 1.4879 | 1.08 |  |
| 2023 | 12 | +0.7972 | 1.0569 | 0.79 |  |
| 2024 | 12 | +4.9207 | 2.5279 | 2.03 |  |
| 2025 | 12 | +2.6909 | 2.3812 | 1.18 |  |
| 2026 | 7 | -0.8081 | 4.3232 | -0.20 | zu dünn |
| **gesamt** | **115** | **+1.6100** | 0.6209 | 2.60 | Jahresscheiben addieren sich |

### Aktualität und Regime (monatlich, netto, nachrichtlich)

| Schnitt | n | Mittel (Pp) | se | t |
|---|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 11 | +0.0695 | 3.2566 | 0.02 |
| SPY über EMA200 | 95 | +1.1793 | 0.7024 | 1.69 |
| SPY unter EMA200 | 20 | +3.6557 | 1.1998 | 3.13 |

### se: Perioden gegen Tagesreihe

| Größe | se (Perioden, naiv) | se (Tage, naiv) | se (Tage, Hansen-Hodrick, Lag 21) | se (Tage, Newey-West) | Marke |
|---|---|---|---|---|---|
| brutto | 0.62091 | 0.03346 | 0.03093 | 0.02973 | — |
| netto | 0.62094 | 0.03346 | 0.03093 | 0.02973 | — |

### Empfindlichkeit gegen die Ausbuchungsregel (§3.6)

| Variante | brutto (Pp) | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | +1.6221 | +1.6100 | +0.0000 |
| streng (zusaetzlich unbekannt + freiwillig) | +1.6367 | +1.6245 | +0.0146 |
| milde (kein Totalverlust, immer letzter Kurs) | +1.6221 | +1.6100 | +0.0000 |

Empfindlichkeit gegen den **Cent-Boden** (§2.1, registrierte Variante): ohne ihn umfasst das Universum 220 statt 220 Papiere, brutto +1.6069 Pp statt +1.6221 Pp.

**Tote im gehaltenen Dezil:** 5 Fälle über 115 Perioden, davon 0 mit Totalverlust. 

## 5. Universum — was wegfällt und warum

Summiert über alle Umschichtungstage des Laufs `momentum-12-1`:

| Grund | Fälle |
|---|---|
| klasse | 441.600 |
| quelle | 0 |
| cent | 91 |
| vortage | 1.410 |
| qualitaet | 919 |
| ausfuehrung | 3 |
| rangNaN | 131 |
| **im Universum** | **25.277** |

Mindestkurs aus dem Cent-Boden: **7.73 $** (Klasse 250–1000) und **11.14 $** (ab 1000). Perioden unter 100 Papieren: 1.

## 6. Was Teil 1 **nicht** sagt

- Keine Kante ist belegt. Momentum 12-1 ist eine Verrohrungskontrolle mit Vorzeichenerwartung,
  kein Kandidat — ohne Vorregistrierung als Strategie, ohne Bonferroni, ohne Urteil.
- Die Dividendenlücke (§1.4) ist benannt, nicht gemessen.
- Long-Short steht nur als Diagnose; es verlangt Wertpapierleihe und ist im Projekt gesperrt.
