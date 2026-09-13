# Ergebnis — Querschnitts-Prüfstand, Teil 1 (KUNSTSATZ)

Erzeugt 2026-09-13T22:25:38.849Z von `bericht.js` aus `kontrollen-kunst.json`.
Vorregistrierung: `VORREGISTRIERUNG.md` (erster Commit, vor jeder Zahl). Konfiguration `querschnitt-pruefstand-2026-09-13/v1`.
**Teil 1 baut keine Strategie und belegt keine Kante.** Alles Simulation mit virtuellem Kapital,
keine Anlageberatung.
> **ACHTUNG: Diese Zahlen stammen vom KUNSTPANEL, nicht vom Markt.** Sie sagen etwas über den
> Prüfrahmen und nichts über die Wirklichkeit.


## Urteil

| Kontrolle | Schranke (vorab) | Ergebnis | Urteil |
|---|---|---|---|
| **Leck-Sperrklinke** | Leck-Probe meldet > 0, saubere Probe 0 | 81152 / 0 | **bestanden** |
| **Orakel** (Rendite von morgen) | ≥ 2 Pp je Periode, Mittel/sd ≥ 1, t ≥ 8 | Woche +3.147 Pp (t 62.8), Monat +3.222 Pp (t 13.4) | **bestanden** |
| **Orakel**, Perioden-Fassung | ≥ 5 Pp je Woche | +8.139 Pp (t 243.2) | — |
| **Zufall** (woechentlich) | \|Mittel der 12\| < 0.1 Pp; ≤ 3 Ziehungen mit \|t\| ≥ 3 | -0.0186 Pp brutto, -0.0176 Pp netto+Kosten, 0 Ziehungen | **bestanden** |
| **Zufall** (monatlich) | \|Mittel der 12\| < 0.25 Pp; ≤ 3 Ziehungen mit \|t\| ≥ 3 | -0.0891 Pp brutto, -0.0869 Pp netto+Kosten, 0 Ziehungen | **bestanden** |
| **Momentum 12-1** (monatlich) | *kein Tor*, Erwartung positiv | brutto +0.3811 Pp (t 1.86), netto +0.3650 Pp | — |

**Alle Kontrollen bestanden.** Der Rahmen darf in Teil 2 einen Nullbefund erzeugen.

## 1. Die Datentafel

| Größe | Wert |
|---|---|
| Zeilen (Handelstag × Reihe) | **778.745** |
| Reihen | 301 (davon 1 Referenz) |
| Zeitraum | 2016 bis 2026-06-30 |
| letzter vollständiger Handelstag | 2026-06-30 (Nachtrag 1) |
| unvollständige Tage am Rand | 0 |
| gelesene Archivdateien | 0 |
| gelesene Bytes | 0.0 GB |
| geprüfte Minutenkerzen | 0.000 Mrd |
| Dateien mit fremder Quelle (nicht SIP) | **0** |
| Stempelkerzen (Form: O=H=T=C und Umsatz 0) | 0 von 0 geprüften |
| Stempeltage (alle regulären Kerzen Stempel) | 0 von 778.745 Tagen |
| Reihen-Lücken (Tag fehlt mitten in der Reihe) | 0 |
| ausgeschlossene Wertpapierarten | {} |

### Ersatzregel für den Tagesschluss, je Jahr

Der Tagesschluss ist die **Eröffnung der Kerze mit dem ET-Stempel des Kalenderschlusses** (§1.3).
Fehlt sie, greift die Ersatzregel (Schluss der letzten regulären Kerze). So oft:

| Jahr | Tageszeilen | Schluss-Ersatz | Anteil | Eröffnungs-Ersatz | Anteil |
|---|---|---|---|---|---|
| **gesamt** | **0** | **0** | **0.00 %** | **0** | **0.00 %** |

> **Ausschüttungen sind NICHT enthalten.** Das Archiv ist `adjustment=raw`, die bereinigte Kopie wendet
> Splits und gemessene Abspaltungen an, ausdrücklich keine Dividenden. In der Hauptgröße
> (Dezil minus Universum) kürzt sich eine gleich große Ausschüttung heraus; übrig bleibt die
> **Differenz** der Dividendenrendite zwischen Dezil und Universum. Sie ist **nicht gemessen**.

## 2. Orakel — die Verrohrungsprobe

| Fassung | Frequenz | n | Universum | Dezil | Umschlag | brutto (Pp) | netto (Pp) | t | Mittel/sd |
|---|---|---|---|---|---|---|---|---|---|
| orakelTag | woche | 493 | 164 | 16 | 90.0 % | +3.147 | +3.098 | 62.8 | 2.83 |
| orakelPeriode | woche | 493 | 164 | 16 | 90.4 % | +8.139 | +8.090 | 243.2 | — |
| orakelTag | monat | 113 | 165 | 16 | 90.2 % | +3.222 | +3.174 | 13.4 | 1.25 |
| orakelPeriode | monat | 113 | 165 | 16 | 89.1 % | +17.735 | +17.687 | 119.2 | — |

Das gefallene Kriterium `t ≥ 20` (Nachtrag 4) steht der Vollständigkeit halber daneben: orakelTag/woche → gehalten, orakelTag/monat → gefallen.

## 3. Zufall — muss null sein

**woechentlich**, 12 Ziehungen, n = 493 Perioden je Ziehung.

| Ziehung | brutto (Pp) | se | t | netto (Pp) | Kosten (Pp) | Umschlag |
|---|---|---|---|---|---|---|
| 0 | -0.0346 | 0.0490 | -0.71 | -0.0836 | 0.0501 | 90.1 % |
| 1 | -0.0970 | 0.0526 | -1.85 | -0.1461 | 0.0502 | 90.3 % |
| 2 | -0.0644 | 0.0533 | -1.21 | -0.1138 | 0.0504 | 90.5 % |
| 3 | -0.0252 | 0.0514 | -0.49 | -0.0744 | 0.0503 | 90.5 % |
| 4 | +0.0037 | 0.0476 | +0.08 | -0.0455 | 0.0502 | 90.5 % |
| 5 | -0.0414 | 0.0518 | -0.80 | -0.0903 | 0.0500 | 90.0 % |
| 6 | +0.0232 | 0.0499 | +0.47 | -0.0262 | 0.0504 | 90.4 % |
| 7 | +0.0365 | 0.0487 | +0.75 | -0.0127 | 0.0503 | 90.2 % |
| 8 | +0.0174 | 0.0498 | +0.35 | -0.0320 | 0.0505 | 90.4 % |
| 9 | -0.0270 | 0.0493 | -0.55 | -0.0765 | 0.0506 | 90.7 % |
| 10 | +0.0075 | 0.0502 | +0.15 | -0.0419 | 0.0505 | 90.5 % |
| 11 | -0.0223 | 0.0530 | -0.42 | -0.0715 | 0.0503 | 90.4 % |
| **Mittel** | **-0.0186** | 0.0146 | | **-0.0176** (netto+Kosten) | | |

Schranke 0.1 Pp = **6.9 se** des Mittels. Ziehungen mit \|t\| ≥ 3: **0** von 12. Das in Nachtrag 4 **gefallene** Einzelkriterium (Pp je Ziehung) hätte 0 Ziehungen verworfen.

**monatlich**, 12 Ziehungen, n = 113 Perioden je Ziehung.

| Ziehung | brutto (Pp) | se | t | netto (Pp) | Kosten (Pp) | Umschlag |
|---|---|---|---|---|---|---|
| 0 | -0.1789 | 0.1997 | -0.90 | -0.2261 | 0.0494 | 89.0 % |
| 1 | +0.2675 | 0.2272 | +1.18 | +0.2188 | 0.0508 | 91.0 % |
| 2 | -0.3668 | 0.2277 | -1.62 | -0.4152 | 0.0505 | 90.9 % |
| 3 | -0.0031 | 0.2181 | -0.01 | -0.0519 | 0.0510 | 91.4 % |
| 4 | +0.0586 | 0.2072 | +0.28 | +0.0105 | 0.0502 | 90.3 % |
| 5 | -0.0750 | 0.2124 | -0.35 | -0.1226 | 0.0497 | 89.4 % |
| 6 | -0.4530 | 0.2040 | -2.23 | -0.5013 | 0.0504 | 91.0 % |
| 7 | -0.0714 | 0.1900 | -0.38 | -0.1202 | 0.0509 | 91.4 % |
| 8 | +0.0286 | 0.2093 | +0.14 | -0.0195 | 0.0503 | 90.2 % |
| 9 | -0.0345 | 0.2264 | -0.15 | -0.0824 | 0.0499 | 90.0 % |
| 10 | -0.1319 | 0.2093 | -0.63 | -0.1791 | 0.0494 | 89.4 % |
| 11 | -0.1089 | 0.2365 | -0.46 | -0.1563 | 0.0495 | 89.3 % |
| **Mittel** | **-0.0891** | 0.0618 | | **-0.0869** (netto+Kosten) | | |

Schranke 0.25 Pp = **4.0 se** des Mittels. Ziehungen mit \|t\| ≥ 3: **0** von 12. Das in Nachtrag 4 **gefallene** Einzelkriterium (Pp je Ziehung) hätte 3 Ziehungen verworfen.

## 4. Momentum 12-1 — Erwartung positiv, **kein Tor**

| Frequenz / Ausbuchung | n | Universum | Umschlag | Kosten (Pp) | brutto (Pp) | t | netto (Pp) | t | Tote |
|---|---|---|---|---|---|---|---|---|---|
| woche/haupt | 492 | 164 | 16.9 % | 0.0094 | +0.0763 | 1.48 | +0.0680 | 1.32 | 9 |
| monat/haupt | 112 | 164 | 32.5 % | 0.0182 | +0.3811 | 1.86 | +0.3650 | 1.78 | 10 |
| monat/streng | 112 | 164 | 32.5 % | 0.0182 | +0.3926 | 1.92 | +0.3766 | 1.84 | 10 |
| monat/milde | 112 | 164 | 32.5 % | 0.0182 | +0.4096 | 2.01 | +0.3936 | 1.93 | 10 |
| monat/ohneCentBoden | 112 | 293 | 29.4 % | 0.0161 | +0.3532 | 2.24 | +0.3373 | 2.14 | 15 |

### Jahresscheiben (monatlich, Hauptzahl, netto)

| Jahr | n | Mittel (Pp) | se | t | |
|---|---|---|---|---|---|
| 2017 | 12 | +0.2567 | 0.3706 | 0.72 |  |
| 2018 | 12 | +0.2734 | 0.6814 | 0.42 |  |
| 2019 | 12 | -0.7693 | 0.6105 | -1.32 |  |
| 2020 | 12 | +1.3557 | 0.5977 | 2.37 |  |
| 2021 | 12 | +1.6110 | 0.4571 | 3.68 |  |
| 2022 | 12 | -0.3475 | 0.6788 | -0.53 |  |
| 2023 | 12 | +0.3198 | 0.7910 | 0.42 |  |
| 2024 | 12 | +0.2871 | 0.7835 | 0.38 |  |
| 2025 | 12 | -0.1582 | 0.4325 | -0.38 |  |
| 2026 | 4 | +1.7349 | 1.0290 | 1.95 | zu dünn |
| **gesamt** | **112** | **+0.3650** | 0.2061 | 1.78 | Jahresscheiben addieren sich |

### Aktualität und Regime (monatlich, netto, nachrichtlich)

| Schnitt | n | Mittel (Pp) | se | t |
|---|---|---|---|---|
| letzte 250 Handelstage (ab 2025-07-01) | 10 | +0.2929 | 0.6816 | 0.45 |
| SPY über EMA200 | 17 | -0.3648 | 0.5228 | -0.72 |
| SPY unter EMA200 | 95 | +0.4956 | 0.2228 | 2.24 |

### se: Perioden gegen Tagesreihe

| Größe | se (Perioden, naiv) | se (Tage, naiv) | se (Tage, Hansen-Hodrick, Lag 21) | se (Tage, Newey-West) | Marke |
|---|---|---|---|---|---|
| brutto | 0.20615 | 0.01060 | 0.00949 | 0.01007 | — |
| netto | 0.20614 | 0.01060 | 0.00949 | 0.01007 | — |

### Empfindlichkeit gegen die Ausbuchungsregel (§3.6)

| Variante | brutto (Pp) | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | +0.3811 | +0.3650 | +0.0000 |
| streng (zusaetzlich unbekannt + freiwillig) | +0.3926 | +0.3766 | +0.0115 |
| milde (kein Totalverlust, immer letzter Kurs) | +0.4096 | +0.3936 | +0.0285 |

Empfindlichkeit gegen den **Cent-Boden** (§2.1, registrierte Variante): ohne ihn umfasst das Universum 293 statt 164 Papiere, brutto +0.3532 Pp statt +0.3811 Pp.

**Tote im gehaltenen Dezil:** 10 Fälle über 112 Perioden, davon 3 mit Totalverlust. 

## 5. Universum — was wegfällt und warum

Summiert über alle Umschichtungstage des Laufs `momentum-12-1`:

| Grund | Fälle |
|---|---|
| klasse | 722 |
| quelle | 0 |
| cent | 14.655 |
| vortage | 2.478 |
| qualitaet | 0 |
| ausfuehrung | 1 |
| rangNaN | 270 |
| **im Universum** | **18.377** |

Mindestkurs aus dem Cent-Boden: **7.73 $** (Klasse 250–1000) und **11.14 $** (ab 1000). Perioden unter 100 Papieren: 1.

## 6. Was Teil 1 **nicht** sagt

- Keine Kante ist belegt. Momentum 12-1 ist eine Verrohrungskontrolle mit Vorzeichenerwartung,
  kein Kandidat — ohne Vorregistrierung als Strategie, ohne Bonferroni, ohne Urteil.
- Die Dividendenlücke (§1.4) ist benannt, nicht gemessen.
- Long-Short steht nur als Diagnose; es verlangt Wertpapierleihe und ist im Projekt gesperrt.
