# Ergebnis — Querschnitts-Prüfstand, **Teil 2**

Erzeugt 2026-09-14T22:28:57.787Z von `urteil-teil2.js`.
Vorregistrierung: **`VORREGISTRIERUNG-TEIL2.md`** (erster Commit, vor jeder Zahl).
Panel `querschnitt-pruefstand-2026-09-13/panel/v1`, 9.899.585 Tageszeilen, 7300 Reihen, bis 2026-09-11.
Alles Simulation mit virtuellem Kapital, **keine Anlageberatung**.

## Urteil in drei Zeilen

| Frage | Antwort |
|---|---|
| Bildet die Maschine den bekannten Momentum-Faktor ab? | **teilweise** — ρ = 0.413 über 114 gemeinsame Monate (2017-02…2026-07) |
| Wie viele der 8 vorregistrierten Zeilen sind belegt? | **0 von 8** |
| Wurde ein Zielportfolio geschrieben? | **nein** |

## 1. Der Außen-Prüfstein — die erste Prüfung gegen eine fremde Reihe

Verglichen wird unsere monatliche Momentum-Überschussreihe (Long-Dezil − gleichgewichtetes Universum,
brutto, 114 Monate) mit Kenneth Frenchs veröffentlichtem Momentum-Faktor `Mom`.
Geprüft wird der **Gleichlauf**, nicht die Höhe: `Mom` ist ein wertgewichteter Long-Short-Faktor über
alle US-Aktien, unsere Reihe ist ein Top-Dezil gegen ein gleichgewichtetes Universum von ~220 liquiden
Werten. Die Referenzdatei liegt außerhalb des Repos und wurde nur gelesen.

| Größe | Wert |
|---|---|
| **ρ (Pearson, Versatz 0)** | **0.4132** |
| ρ (Spearman) | 0.4497 |
| Schranken (vorab) | ≥ 0,5 bestanden · 0,2–0,5 teilweise · < 0,2 Befund |
| **Urteil** | **teilweise** |
| β (unsere Reihe auf `Mom`) | 0.674 (se 0.140, t 4.8) |
| Vorzeichen gleich | 80 von 114 Monaten (70 %) |
| gemeinsamer Zeitraum | 2017-02 … 2026-07 |

**Die Zuordnung stimmt.** Die Korrelation bei Monatsversatz −1 / 0 / +1 beträgt 0.055 / 0.413 / -0.051 — das Maximum liegt wie vorhergesagt bei Versatz 0, die Periode→Monat-Regel ist also nicht verschoben.

### Je Kalenderjahr

| Jahr | gemeinsame Monate | ρ | unsere Summe (Pp) |
|---|---|---|---|
| 2017 | 11 | 0.48 | -0.5 |
| 2018 | 12 | 0.88 | +13.9 |
| 2019 | 12 | 0.47 | +11.9 |
| 2020 | 12 | -0.33 | +56.7 |
| 2021 | 12 | 0.58 | -4.2 |
| 2022 | 12 | 0.41 | +17.6 |
| 2023 | 12 | 0.27 | +4.4 |
| 2024 | 12 | 0.34 | +51.6 |
| 2025 | 12 | 0.69 | +28.9 |
| 2026 | 7 | 0.92 | +8.0 |

Neun der zehn Kalenderjahre laufen gleich. **Das eine Jahr, das nicht mitläuft, ist 2020** (ρ = -0.33).
Der Träger ist ein einzelner Monat: **2020-11**, der Momentum-Einbruch nach der Impfstoffmeldung. `Mom` ist dort stark negativ, unsere Reihe steht bei +15.87 Pp.

### Der Momentum-Einbruch 2020/21 — Vorzeichen Monat für Monat

*(Von der Referenzreihe wird hier nur das **Vorzeichen** übernommen, nie der Wert — das Repo ist öffentlich.)*

| Monat | `Mom` | unsere Reihe (Pp) | gleich |
|---|---|---|---|
| 2020-01 | + | +1.69 | ja |
| 2020-02 | - | +3.55 | **nein** |
| 2020-03 | + | +2.29 | ja |
| 2020-04 | - | +6.84 | **nein** |
| 2020-05 | + | +6.59 | ja |
| 2020-06 | - | +9.60 | **nein** |
| 2020-07 | + | +10.60 | ja |
| 2020-08 | + | +6.93 | ja |
| 2020-09 | + | -0.73 | **nein** |
| 2020-10 | - | -3.03 | ja |
| 2020-11 | - | +15.87 | **nein** |
| 2020-12 | - | -3.53 | ja |
| 2021-01 | + | +16.72 | ja |
| 2021-02 | - | -5.41 | ja |
| 2021-03 | - | -5.13 | ja |
| 2021-04 | + | -8.74 | **nein** |
| 2021-05 | + | -6.09 | **nein** |
| 2021-06 | + | +11.33 | ja |
| 2021-07 | - | -4.65 | ja |
| 2021-08 | + | +4.09 | ja |
| 2021-09 | + | -2.54 | **nein** |
| 2021-10 | + | +0.90 | ja |
| 2021-11 | + | +8.70 | ja |
| 2021-12 | - | -13.34 | ja |

Vorzeichen gleich in 16 von 24 Monaten. Für das **Kalenderjahr 2021** ist `Mom` negativ, und unsere Reihe summiert sich auf -4.16 Pp — **das Vorzeichen stimmt**.

### Diagnose: woher die Lücke zwischen 0,41 und 0,5 kommt

> **Nicht vorregistriert.** Alles in diesem Abschnitt wurde **nach** dem Urteil gerechnet und
> ändert es nicht. Es beantwortet die Anschlussfrage, die der Auftrag für den Fall „teilweise" stellt.

| unsere Größe gegen `Mom` | ρ | β |
|---|---|---|
| **Long − Universum** (die vorregistrierte Größe) | 0.413 | 0.67 |
| **Long − Short** (Diagnose, verlangt Leihe) | **0.728** | 1.65 |
| **Short − Universum** | -0.745 | -0.98 |

`Mom` **ist** ein Long-Short-Faktor. Vergleicht man Gleiches mit Gleichem, liegt die Korrelation bei
**0.73** — deutlich über der Schranke 0,5. Die Verlierer-Seite trägt dabei mehr Gleichlauf
(|ρ| = 0.75) als die Gewinner-Seite (0.41); genau sie fehlt in der vorregistrierten Größe.
Das erklärt 2020-11 mechanisch: im Momentum-Einbruch schossen die **Verlierer** hoch, und ein Long-gegen-Universum
spürt davon nur die Hälfte.

Jahres-Auslassprobe (ρ ohne das jeweilige Jahr): 2017 0.415, 2018 0.392, 2019 0.414, 2020 0.537, 2021 0.392, 2022 0.417, 2023 0.434, 2024 0.423, 2025 0.396, 2026 0.318.
Nur 2020 bewegt das Gesamt-ρ nennenswert (auf 0.537).

## 2. Die Dividendenlücke — **gemessen**, nicht geschätzt

Unsere Renditen enthalten keine Ausschüttungen. In der Hauptgröße kürzt sich eine gleich große
Ausschüttung heraus; übrig bleibt die **Differenz** der Dividendenrendite zwischen Dezil und Universum:

> `Überschuss_Kurs = Überschuss_Gesamtrendite − (Dividendenrendite_Dezil − Dividendenrendite_Universum)`

**Verfahren (offengelegt):** Bardividenden (cash_dividends, Feld rate) je Halteperiode (Datum(a) < ex_date <= Datum(aEnde)), geteilt durch den ROHkurs zur Eroeffnung von a, gleichgewichtet ueber die Mitglieder.
Quelle ist der Maßnahmen-Bestand des Archivs — dieselben Sätze, aus denen das Panel Splits und
Abspaltungen zieht; die Bardividenden darin werden beim Panelbau bewusst nicht angewandt. Gelesen wurden
701 Symboldateien mit 15.295 Bardividenden-Sätzen, **0 fehlten**.

| Lauf | Dezil (Pp/Periode) | Universum (Pp/Periode) | **Lücke** | se | t |
|---|---|---|---|---|---|
| momentum-12-1/monat | +0.0695 | +0.1439 | **-0.0744** | 0.0118 | -6.35 |
| momentum-12-1/woche | +0.0155 | +0.0329 | **-0.0174** | 0.0021 | -8.46 |
| k1-kurzfrist-umkehr/woche | +0.0245 | +0.0329 | **-0.0085** | 0.0021 | -3.96 |
| k1-kurzfrist-umkehr/monat | +0.1736 | +0.1436 | **+0.0300** | 0.0507 | +0.59 |
| k2-tiefe-volatilitaet/woche | +0.0565 | +0.0329 | **+0.0235** | 0.0111 | +2.13 |
| k2-tiefe-volatilitaet/monat | +0.1897 | +0.1436 | **+0.0461** | 0.0091 | +5.08 |
| k3-nahe-52w-hoch/woche | +0.0300 | +0.0329 | **-0.0029** | 0.0019 | -1.49 |
| k3-nahe-52w-hoch/monat | +0.1262 | +0.1436 | **-0.0174** | 0.0074 | -2.37 |
| k4-umsatzschock-richtung/woche | +0.0448 | +0.0329 | **+0.0118** | 0.0110 | +1.08 |
| k4-umsatzschock-richtung/monat | +0.1945 | +0.1436 | **+0.0509** | 0.0486 | +1.05 |

**Plausibilitätsprobe:** das Universum kommt auf 1.73 % Dividendenrendite im Jahr (+0.1439 Pp × 12). Das ist genau die bekannte Größenordnung für liquide US-Aktien in diesem Zeitraum —
die Messung ist also nicht nur intern konsistent, sondern trifft auch den bekannten Außenwert.
Das Momentum-Dezil zahlt mit 0.83 % im Jahr etwa **die Hälfte** davon; das ist die erwartete Richtung
(Momentum-Gewinner sind wachstumslastig).

**Wie viel der +1,622 Pp je Monat entfallen darauf:** -0.0744 Pp je Monat, also **4.6 %**. Die Kurs-Überschussreihe **überschätzt** den
Gesamtrendite-Überschuss; nach Korrektur bleiben **1.5477 Pp je Monat** statt +1,6221.
Die Richtung ist die vorhergesagte, die Größe ist klein gegenüber dem Effekt — und sie ist jetzt eine
**Messung mit t = -6.4**, keine Annahme mehr.

Grenzen dieser Messung: fehlende Symboldateien zaehlen als keine Dividende (Zahl ausgewiesen); Sonderdividenden enthalten, Stockdividenden nicht (die stecken in der Kursbereinigung); Kapitalgewichtung driftet innerhalb der Periode nicht - dieselbe Vereinfachung wie in §2.4.

## 3. Die acht vorregistrierten Zeilen

Hauptgröße: **Long-Dezil − gleichgewichtetes Universum**, netto nach gemessenen Kosten.
Testzahl 8 vorab festgelegt, Bonferroni: kritischer Betrag **|t| ≥ 2.734**.

| # | Zeile | Ende | n | brutto (Pp) | netto (Pp) | t (Perioden) | t (Tage, HH) | Umschlag | Kosten (Pp) | Tote | Urteil |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `k1-kurzfrist-umkehr/woche` | unten | 505 | +0.2006 | +0.1508 | +1.19 | +1.21 | 84.6 % | 0.0524 | 2 | nicht belegt |
| 2 | `k1-kurzfrist-umkehr/monat` | unten | 116 | +0.2798 | +0.2329 | +0.47 | +0.46 | 85.5 % | 0.0531 | 3 | nicht belegt |
| 3 | `k2-tiefe-volatilitaet/woche` | unten | 505 | -0.1104 | -0.1176 | -1.23 | -1.35 | 15.2 % | 0.0097 | 16 | nicht belegt |
| 4 | `k2-tiefe-volatilitaet/monat` | unten | 116 | -0.3076 | -0.3219 | -0.91 | -0.92 | 32.0 % | 0.0205 | 11 | nicht belegt |
| 5 | `k3-nahe-52w-hoch/woche` | oben | 505 | -0.0353 | -0.0656 | -0.73 | -0.85 | 53.4 % | 0.0329 | 10 | nicht belegt |
| 6 | `k3-nahe-52w-hoch/monat` | oben | 116 | -0.2023 | -0.2419 | -0.75 | -0.70 | 74.4 % | 0.0458 | 9 | nicht belegt |
| 7 | `k4-umsatzschock-richtung/woche` | oben | 505 | -0.1219 | -0.1727 | -2.36 | -2.32 | 86.1 % | 0.0533 | 5 | nicht belegt |
| 8 | `k4-umsatzschock-richtung/monat` | oben | 116 | -0.3965 | -0.4461 | -1.65 | -1.53 | 89.8 % | 0.0558 | 6 | nicht belegt |

**Keine Zeile erreicht die Bonferroni-Schranke.** 6 der 8 Zeilen haben das **falsche Vorzeichen** — sie sind damit nicht „knapp verfehlt", sondern in der
registrierten Richtung widerlegt.

### Die neun Tore je Zeile

| Zeile | T-0 | T-1 | T-2 | T-3 | T-4 | T-5 | T-6 | T-7 | T-8 | bestanden |
|---|---|---|---|---|---|---|---|---|---|---|
| `k1-kurzfrist-umkehr/woche` | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | nein |
| `k1-kurzfrist-umkehr/monat` | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ | nein |
| `k2-tiefe-volatilitaet/woche` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | nein |
| `k2-tiefe-volatilitaet/monat` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | nein |
| `k3-nahe-52w-hoch/woche` | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | nein |
| `k3-nahe-52w-hoch/monat` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | nein |
| `k4-umsatzschock-richtung/woche` | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | nein |
| `k4-umsatzschock-richtung/monat` | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | nein |

- **T-0** Maschine (0 Leck-Verstoesse)
- **T-1** Aussen-Pruefstein nicht gefallen
- **T-2** Vorzeichen netto > 0
- **T-3** Perioden-t >= 2.734
- **T-4** Tagesreihe Hansen-Hodrick t >= 2.734
- **T-5** letzte 250 Handelstage netto > 0
- **T-6** hoechstens 3 negative Jahre und kein Jahr > 60 %
- **T-7** netto > 0 in allen drei Ausbuchungsvarianten
- **T-8** netto > 0 auch mit der Eroeffnungs-Huerde

### Die Kostenvorprüfung gegen die Messung

Die Vorprüfung (§T2.3.2) wurde **vor** der Messung hingeschrieben. Hier steht sie gegen das, was
gemessen wurde — auch dort, wo sie danebenlag.

| Zeile | Umschlag geschätzt | Umschlag **gemessen** | Faktor geschätzt | Effekt erwartet (Pp) | Effekt **gemessen** (Pp, netto) | Vorprüfung |
|---|---|---|---|---|---|---|
| `k1-kurzfrist-umkehr/woche` | 85.0 % | 84.6 % | 1.9…5.6 | +0.1…+0.3 | +0.1508 | grenzwertig |
| `k1-kurzfrist-umkehr/monat` | 90.0 % | 85.5 % | 5.3…14.1 | +0.3…+0.8 | +0.2329 | messen |
| `k2-tiefe-volatilitaet/woche` | 5.0 % | 15.2 % | 7.9…23.8 | +0.025…+0.075 | -0.1176 | messen |
| `k2-tiefe-volatilitaet/monat` | 12.0 % | 32.0 % | 13.2…39.7 | +0.1…+0.3 | -0.3219 | messen |
| `k3-nahe-52w-hoch/woche` | 10.0 % | 53.4 % | 6.3…12.7 | +0.04…+0.08 | -0.0656 | messen |
| `k3-nahe-52w-hoch/monat` | 25.0 % | 74.4 % | 9.5…19.0 | +0.15…+0.3 | -0.2419 | messen |
| `k4-umsatzschock-richtung/woche` | 85.0 % | 86.1 % | 0.6…1.1 | +0.03…+0.06 | -0.1727 | **unter der Schwelle** |
| `k4-umsatzschock-richtung/monat` | 90.0 % | 89.8 % | 1.8…4.4 | +0.1…+0.25 | -0.4461 | grenzwertig |

**Zwei Vorprüfungen waren falsch, und zwar in der Größe, die wir selbst geschätzt haben:** der Umschlag
von `k2-tiefe-volatilitaet` und `k3-nahe-52w-hoch` liegt beim **2,7- bis 5,3-fachen** der Schätzung.
Grund: an der **Dezilgrenze** ist die Ordnung viel unruhiger als in der Mitte der Verteilung — bei K3
drängen sich viele Papiere bei einem Verhältnis nahe 1, sodass kleinste Bewegungen die Grenze überqueren.
Eine Umschlagschätzung „aus der Trägheit der Größe" ist deshalb systematisch zu niedrig; richtig wäre
eine Schätzung **an der Dezilgrenze**. Das ändert die Urteile hier nicht (alle vier fallen ohnehin),
gehört aber in die nächste Vorregistrierung.

## 4. Je Zeile: Jahresscheiben, Aktualität, Regime, Empfindlichkeiten

### `k1-kurzfrist-umkehr/woche` — Rendite der letzten 5 Handelstage, gekauft wird das **untene** Ende

netto **+0.1508 Pp** je Periode (t +1.19), brutto +0.2006 Pp, n = 505, Universum 221, Dezil 22 Papiere.
Gefallene Tore: **T-3, T-4, T-6**.

| Jahr | n | netto (Pp) | se | t |
|---|---|---|---|---|
| 2016 *(dünn)* | 1 | +0.4065 | — | — |
| 2017 | 52 | -0.1240 | 0.1789 | -0.70 |
| 2018 | 52 | +0.0087 | 0.2430 | +0.04 |
| 2019 | 52 | +0.1755 | 0.2178 | +0.81 |
| 2020 | 53 | +0.4692 | 0.6071 | +0.78 |
| 2021 | 52 | -0.2068 | 0.4869 | -0.43 |
| 2022 | 52 | +0.3813 | 0.5723 | +0.67 |
| 2023 | 52 | +0.3860 | 0.2597 | +1.50 |
| 2024 | 52 | -0.1048 | 0.3652 | -0.29 |
| 2025 | 52 | -0.0182 | 0.3850 | -0.05 |
| 2026 | 35 | +0.7139 | 0.4338 | +1.67 |

| Schnitt | n | netto (Pp) | t |
|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 51 | +0.2957 | +0.80 |
| SPY über EMA200 | 422 | +0.0157 | +0.14 |
| SPY unter EMA200 | 83 | +0.8378 | +1.71 |

| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | +0.1508 | — |
| streng (zusätzlich unbekannt + freiwillig) | +0.1375 | -0.0133 |
| milde (kein Totalverlust) | +0.1508 | +0.0000 |
| Eröffnungs-Hürde statt mittlerer Hürde | +0.0989 | -0.0519 |

se (netto): Perioden naiv 0.1264 · Tage naiv 0.02683 · Hansen-Hodrick 0.02504 · Newey-West 0.02641. Tote im gehaltenen Dezil: 2.

### `k1-kurzfrist-umkehr/monat` — Rendite der letzten 5 Handelstage, gekauft wird das **untene** Ende

netto **+0.2329 Pp** je Periode (t +0.47), brutto +0.2798 Pp, n = 116, Universum 219, Dezil 21 Papiere.
Gefallene Tore: **T-3, T-4, T-6**.

| Jahr | n | netto (Pp) | se | t |
|---|---|---|---|---|
| 2016 *(dünn)* | 1 | +2.5607 | — | — |
| 2017 | 12 | +0.1846 | 0.5986 | +0.32 |
| 2018 | 12 | -0.2919 | 0.6958 | -0.44 |
| 2019 | 12 | -0.0797 | 1.0323 | -0.08 |
| 2020 | 12 | +1.1921 | 3.1224 | +0.40 |
| 2021 | 12 | -1.8107 | 1.5700 | -1.20 |
| 2022 | 12 | -1.4107 | 1.3545 | -1.09 |
| 2023 | 12 | +1.4382 | 1.0499 | +1.43 |
| 2024 | 12 | +0.2563 | 0.7659 | +0.35 |
| 2025 | 12 | +1.2887 | 1.4154 | +0.95 |
| 2026 *(dünn)* | 7 | +2.1787 | 3.4555 | +0.68 |

| Schnitt | n | netto (Pp) | t |
|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 11 | +1.8139 | +0.88 |
| SPY über EMA200 | 96 | +0.1312 | +0.30 |
| SPY unter EMA200 | 20 | +0.7208 | +0.38 |

| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | +0.2329 | — |
| streng (zusätzlich unbekannt + freiwillig) | +0.1731 | -0.0598 |
| milde (kein Totalverlust) | +0.2329 | +0.0000 |
| Eröffnungs-Hürde statt mittlerer Hürde | +0.1842 | -0.0487 |

se (netto): Perioden naiv 0.4940 · Tage naiv 0.02377 · Hansen-Hodrick 0.02393 · Newey-West 0.02461. Tote im gehaltenen Dezil: 3.

### `k2-tiefe-volatilitaet/woche` — sd der letzten 60 Tagesrenditen, gekauft wird das **untene** Ende

netto **-0.1176 Pp** je Periode (t -1.23), brutto -0.1104 Pp, n = 505, Universum 221, Dezil 22 Papiere.
Gefallene Tore: **T-2, T-3, T-4, T-5, T-6, T-7, T-8**.

| Jahr | n | netto (Pp) | se | t |
|---|---|---|---|---|
| 2016 *(dünn)* | 1 | -1.1409 | — | — |
| 2017 | 52 | -0.0475 | 0.1082 | -0.44 |
| 2018 | 52 | +0.1813 | 0.2191 | +0.84 |
| 2019 | 52 | -0.1713 | 0.1742 | -0.99 |
| 2020 | 53 | -0.3202 | 0.3787 | -0.85 |
| 2021 | 52 | +0.0421 | 0.3377 | +0.13 |
| 2022 | 52 | +0.2732 | 0.4191 | +0.66 |
| 2023 | 52 | -0.3738 | 0.2490 | -1.52 |
| 2024 | 52 | -0.2017 | 0.3041 | -0.67 |
| 2025 | 52 | -0.3720 | 0.3571 | -1.05 |
| 2026 | 35 | -0.1843 | 0.3498 | -0.53 |

| Schnitt | n | netto (Pp) | t |
|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 51 | -0.3074 | -1.09 |
| SPY über EMA200 | 422 | -0.0895 | -0.97 |
| SPY unter EMA200 | 83 | -0.2603 | -0.77 |

| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | -0.1176 | — |
| streng (zusätzlich unbekannt + freiwillig) | -0.1145 | +0.0031 |
| milde (kein Totalverlust) | -0.1176 | +0.0000 |
| Eröffnungs-Hürde statt mittlerer Hürde | -0.1251 | -0.0075 |

se (netto): Perioden naiv 0.0955 · Tage naiv 0.01989 · Hansen-Hodrick 0.01797 · Newey-West 0.01915. Tote im gehaltenen Dezil: 16.

### `k2-tiefe-volatilitaet/monat` — sd der letzten 60 Tagesrenditen, gekauft wird das **untene** Ende

netto **-0.3219 Pp** je Periode (t -0.91), brutto -0.3076 Pp, n = 116, Universum 219, Dezil 21 Papiere.
Gefallene Tore: **T-2, T-3, T-4, T-5, T-6, T-7, T-8**.

| Jahr | n | netto (Pp) | se | t |
|---|---|---|---|---|
| 2016 *(dünn)* | 1 | -1.5511 | — | — |
| 2017 | 12 | -0.3482 | 0.3977 | -0.91 |
| 2018 | 12 | +1.0041 | 1.1117 | +0.94 |
| 2019 | 12 | +0.1868 | 0.8806 | +0.22 |
| 2020 | 12 | -2.0102 | 1.2583 | -1.67 |
| 2021 | 12 | +0.6179 | 1.2017 | +0.54 |
| 2022 | 12 | +0.4784 | 1.4874 | +0.34 |
| 2023 | 12 | -0.4972 | 1.0714 | -0.48 |
| 2024 | 12 | -0.6212 | 0.7543 | -0.86 |
| 2025 | 12 | -1.2737 | 1.3045 | -1.02 |
| 2026 *(dünn)* | 7 | -0.8894 | 1.9979 | -0.48 |

| Schnitt | n | netto (Pp) | t |
|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 11 | -0.9432 | -0.67 |
| SPY über EMA200 | 96 | +0.0059 | +0.02 |
| SPY unter EMA200 | 20 | -1.8951 | -1.95 |

| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | -0.3219 | — |
| streng (zusätzlich unbekannt + freiwillig) | -0.3074 | +0.0144 |
| milde (kein Totalverlust) | -0.3219 | +0.0000 |
| Eröffnungs-Hürde statt mittlerer Hürde | -0.3366 | -0.0148 |

se (netto): Perioden naiv 0.3559 · Tage naiv 0.01947 · Hansen-Hodrick 0.01812 · Newey-West 0.01779. Tote im gehaltenen Dezil: 11.

### `k3-nahe-52w-hoch/woche` — Schluss(t) / Maximum der 250 Tagesschluesse, gekauft wird das **obene** Ende

netto **-0.0656 Pp** je Periode (t -0.73), brutto -0.0353 Pp, n = 505, Universum 221, Dezil 22 Papiere.
Gefallene Tore: **T-2, T-3, T-4, T-6, T-7, T-8**.

| Jahr | n | netto (Pp) | se | t |
|---|---|---|---|---|
| 2016 *(dünn)* | 1 | -1.2143 | — | — |
| 2017 | 52 | -0.0267 | 0.1779 | -0.15 |
| 2018 | 52 | +0.0505 | 0.1863 | +0.27 |
| 2019 | 52 | -0.2568 | 0.1694 | -1.53 |
| 2020 | 53 | +0.1354 | 0.4010 | +0.34 |
| 2021 | 52 | +0.1465 | 0.2510 | +0.59 |
| 2022 | 52 | +0.0118 | 0.3994 | +0.03 |
| 2023 | 52 | -0.4428 | 0.2100 | -2.13 |
| 2024 | 52 | -0.2080 | 0.2270 | -0.93 |
| 2025 | 52 | +0.0420 | 0.3366 | +0.13 |
| 2026 | 35 | -0.1018 | 0.4406 | -0.23 |

| Schnitt | n | netto (Pp) | t |
|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 51 | +0.0266 | +0.08 |
| SPY über EMA200 | 422 | +0.0117 | +0.15 |
| SPY unter EMA200 | 83 | -0.4589 | -1.25 |

| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | -0.0656 | — |
| streng (zusätzlich unbekannt + freiwillig) | -0.0625 | +0.0031 |
| milde (kein Totalverlust) | -0.0656 | +0.0000 |
| Eröffnungs-Hürde statt mittlerer Hürde | -0.0970 | -0.0313 |

se (netto): Perioden naiv 0.0906 · Tage naiv 0.01976 · Hansen-Hodrick 0.01629 · Newey-West 0.01789. Tote im gehaltenen Dezil: 10.

### `k3-nahe-52w-hoch/monat` — Schluss(t) / Maximum der 250 Tagesschluesse, gekauft wird das **obene** Ende

netto **-0.2419 Pp** je Periode (t -0.75), brutto -0.2023 Pp, n = 116, Universum 219, Dezil 21 Papiere.
Gefallene Tore: **T-2, T-3, T-4, T-5, T-6, T-7, T-8**.

| Jahr | n | netto (Pp) | se | t |
|---|---|---|---|---|
| 2016 *(dünn)* | 1 | -0.7684 | — | — |
| 2017 | 12 | -0.9361 | 0.6650 | -1.47 |
| 2018 | 12 | +0.3060 | 0.9325 | +0.34 |
| 2019 | 12 | -0.7922 | 0.7698 | -1.07 |
| 2020 | 12 | +0.7686 | 1.5989 | +0.50 |
| 2021 | 12 | +0.2216 | 0.8057 | +0.29 |
| 2022 | 12 | +0.3228 | 1.3318 | +0.25 |
| 2023 | 12 | -0.9027 | 0.7519 | -1.25 |
| 2024 | 12 | +0.6529 | 0.6285 | +1.09 |
| 2025 | 12 | -0.6224 | 0.7794 | -0.83 |
| 2026 *(dünn)* | 7 | -2.2156 | 2.1865 | -1.09 |

| Schnitt | n | netto (Pp) | t |
|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 11 | -1.5411 | -1.15 |
| SPY über EMA200 | 96 | +0.1135 | +0.35 |
| SPY unter EMA200 | 20 | -1.9476 | -2.11 |

| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | -0.2419 | — |
| streng (zusätzlich unbekannt + freiwillig) | -0.2274 | +0.0144 |
| milde (kein Totalverlust) | -0.2419 | +0.0000 |
| Eröffnungs-Hürde statt mittlerer Hürde | -0.2824 | -0.0406 |

se (netto): Perioden naiv 0.3231 · Tage naiv 0.01924 · Hansen-Hodrick 0.01615 · Newey-West 0.01641. Tote im gehaltenen Dezil: 9.

### `k4-umsatzschock-richtung/woche` — Umsatz(t)/Median(60) x Vorzeichen der Tagesrendite, gekauft wird das **obene** Ende

netto **-0.1727 Pp** je Periode (t -2.36), brutto -0.1219 Pp, n = 505, Universum 221, Dezil 22 Papiere.
Gefallene Tore: **T-2, T-3, T-4, T-6, T-7, T-8**.

| Jahr | n | netto (Pp) | se | t |
|---|---|---|---|---|
| 2016 *(dünn)* | 1 | +0.8360 | — | — |
| 2017 | 52 | -0.1446 | 0.1395 | -1.05 |
| 2018 | 52 | -0.2199 | 0.1587 | -1.40 |
| 2019 | 52 | -0.2240 | 0.1939 | -1.17 |
| 2020 | 53 | -0.5025 | 0.3288 | -1.54 |
| 2021 | 52 | -0.3280 | 0.2439 | -1.36 |
| 2022 | 52 | -0.3366 | 0.2458 | -1.38 |
| 2023 | 52 | +0.0816 | 0.2282 | +0.36 |
| 2024 | 52 | -0.2547 | 0.1898 | -1.36 |
| 2025 | 52 | +0.1899 | 0.2415 | +0.79 |
| 2026 | 35 | +0.0820 | 0.3163 | +0.26 |

| Schnitt | n | netto (Pp) | t |
|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 51 | +0.1857 | +0.78 |
| SPY über EMA200 | 422 | -0.1490 | -1.91 |
| SPY unter EMA200 | 83 | -0.2931 | -1.45 |

| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | -0.1727 | — |
| streng (zusätzlich unbekannt + freiwillig) | -0.1696 | +0.0031 |
| milde (kein Totalverlust) | -0.1727 | +0.0000 |
| Eröffnungs-Hürde statt mittlerer Hürde | -0.2255 | -0.0528 |

se (netto): Perioden naiv 0.0732 · Tage naiv 0.01646 · Hansen-Hodrick 0.01553 · Newey-West 0.01581. Tote im gehaltenen Dezil: 5.

### `k4-umsatzschock-richtung/monat` — Umsatz(t)/Median(60) x Vorzeichen der Tagesrendite, gekauft wird das **obene** Ende

netto **-0.4461 Pp** je Periode (t -1.65), brutto -0.3965 Pp, n = 116, Universum 219, Dezil 21 Papiere.
Gefallene Tore: **T-2, T-3, T-4, T-5, T-6, T-7, T-8**.

| Jahr | n | netto (Pp) | se | t |
|---|---|---|---|---|
| 2016 *(dünn)* | 1 | -0.7778 | — | — |
| 2017 | 12 | -0.6022 | 0.6225 | -1.01 |
| 2018 | 12 | +1.1005 | 0.6686 | +1.72 |
| 2019 | 12 | -1.2104 | 0.8896 | -1.42 |
| 2020 | 12 | -0.3626 | 0.8730 | -0.43 |
| 2021 | 12 | -2.3644 | 0.8855 | -2.79 |
| 2022 | 12 | -0.0074 | 0.6070 | -0.01 |
| 2023 | 12 | -0.3172 | 0.7298 | -0.45 |
| 2024 | 12 | +0.0180 | 0.6464 | +0.03 |
| 2025 | 12 | +0.0440 | 0.8474 | +0.05 |
| 2026 *(dünn)* | 7 | -0.9348 | 2.2427 | -0.45 |

| Schnitt | n | netto (Pp) | t |
|---|---|---|---|
| letzte 250 Handelstage (ab 2025-09-12) | 11 | -0.4989 | -0.34 |
| SPY über EMA200 | 96 | -0.4079 | -1.33 |
| SPY unter EMA200 | 20 | -0.6291 | -1.15 |

| Empfindlichkeit | netto (Pp) | Differenz zur Hauptzahl |
|---|---|---|
| Hauptzahl (Insolvenz + Zwangs-Delisting = Totalverlust) | -0.4461 | — |
| streng (zusätzlich unbekannt + freiwillig) | -0.4316 | +0.0144 |
| milde (kein Totalverlust) | -0.4461 | +0.0000 |
| Eröffnungs-Hürde statt mittlerer Hürde | -0.4973 | -0.0512 |

se (netto): Perioden naiv 0.2723 · Tage naiv 0.01461 · Hansen-Hodrick 0.01279 · Newey-West 0.01303. Tote im gehaltenen Dezil: 6.

## 5. Zielportfolio

**Es wurde keines geschrieben.** Keine der acht Zeilen besteht alle Tore — das ist das Ergebnis,
nicht ein Ausfall. Die Schnittstelle zum Mittelfrist-Depot bleibt damit leer.

## 6. Was Teil 2 **nicht** sagt

- Der Außen-Prüfstein ist **teilweise** bestanden, nicht ganz. Die vorregistrierte Größe erreicht ρ = 0.41,
  nicht 0,5. Dass die Long-Short-Diagnose auf 0.73 kommt, ist eine **nachträgliche** Erklärung und
  hebt das registrierte Urteil nicht auf.
- Aus „nicht belegt" folgt **nicht** „widerlegt" — außer für die sechs Zeilen mit falschem Vorzeichen,
  für die die registrierte Richtung tatsächlich nicht trägt.
- Momentum 12-1 bleibt **Kontext, kein Befund**: keine Vorregistrierung als Strategie, kein Tor, kein Urteil.
- Long-Short steht überall nur als **Diagnose**; es verlangt Wertpapierleihe und ist im Projekt gesperrt.
