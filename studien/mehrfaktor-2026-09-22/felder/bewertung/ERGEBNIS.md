# Feld 5 `bewertung` (B/M) und nachrichtlich `bewertung-ep` (E/P) — Ergebnis der Feldzelle (Nr. 53, 22.09.2026)

Feld-Agent; Maschine `zelle.js` (`mehrfaktor-2026-09-22/zelle/v1`), unverändert. 92 Signaltage 2017-01-03 … 2024-08-01, Rückhaltefenster
ab 2024-09-01 versiegelt (`rueckhalte: false`). Zahlen aus `zellen/bewertung-bericht.md` und `zellen/bewertung-ep-bericht.md`; die
Tabellen in §6/§7 aus den Rohwerten der Zellen (`zellen/*.json`) und den Modul-Zählern. **Die Zelle ist kein Urteil.** Simulation mit
virtuellem Kapital, keine Anlageberatung.

## 1. Was gebaut wurde

| | Zelle 1 `bewertung` (gewichtet, Signal) | Zelle 2 `bewertung-ep` (nachrichtlich, nicht gewichtet) |
|---|---|---|
| Formel | `roh.eigenkapital / (roh.aktien × rohSchluss[z])` | `summe4q.netto / (roh.aktien × rohSchluss[z])` |
| Bilanz | ein Aufruf `sicht.fundamentalAm(sym, sicht.iso)` je Symbol: jüngstes 10-K/10-Q mit `filed` strikt vor dem Signaltag, Tor 456 Tage | dito; `summe4q.netto` ist in der Tafel `null`, sobald eines der Quartale D0…D3 fehlt |
| Kurs | `sicht.felder.rohSchluss[z]`, `z = sicht.zeileAm(sym)` — **unbereinigt** (Preisaussage) | dito |
| `null` | keine Panelzeile, kein Filing, `eigenkapital` nicht ausgewiesen, `aktien` fehlend oder ≤ 0, `rohSchluss` ≤ 0 | wie links, statt Eigenkapital `summe4q.netto` |
| Negativ | negatives Eigenkapital ist ein **Wert** (negatives B/M, unterstes Dezil) | negatives Netto ist ein Wert |
| Zähler im Modul | Null-Gründe, negative Werte, `marken.eigenkapitalFallback`, `marken.aktienFallback`, Sektor je Symbol — zählen nur, ändern keinen Wert; eine JSON-Zeile auf stderr beim Prozessende | dito mit `marken.nettoFallback` |

Nichts gekappt, nichts winsorisiert, keine Transformation, keine Sektorbereinigung (Auftrag §1a.7).

## 2. Abdeckung (Anteil des Universums mit Wert; Tabelle der Maschine)

**Zelle 1 `bewertung`**

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 75.4 % (4990/6615) | 81.5 % (1045/1282) | 93.4 % (142/152) | 76.7 % (6177/8049) |
| 2018 | 75.5 % (5131/6797) | 79.6 % (1176/1478) | 92.2 % (200/217) | 76.6 % (6507/8492) |
| 2019 | 76.0 % (5028/6615) | 82.1 % (1208/1471) | 89.5 % (213/238) | 77.5 % (6449/8324) |
| 2020 | 75.7 % (5123/6766) | 81.4 % (1571/1930) | 83.2 % (303/364) | 77.2 % (6997/9060) |
| 2021 | 75.6 % (5469/7231) | 79.4 % (1935/2437) | 84.1 % (427/508) | 77.0 % (7831/10176) |
| 2022 | 77.2 % (5492/7111) | 85.7 % (2288/2670) | 83.9 % (437/521) | 79.8 % (8217/10302) |
| 2023 | 79.1 % (5386/6807) | 88.2 % (1888/2140) | 83.6 % (250/299) | 81.4 % (7524/9246) |
| 2024 | 79.6 % (3563/4477) | 85.9 % (1356/1578) | 86.0 % (228/265) | 81.4 % (5147/6320) |
| **alle** | 76.7 % | 83.2 % | 85.8 % | 78.4 % |

Zelle 2 `bewertung-ep`: 75.1 % / 80.6 % / 84.3 % / **76.6 %** (Jahre 72.5 % 2017 … 80.2 % 2024; volle Tabelle im Bericht der Maschine).

**Gründe für Lücken** (Zähler über alle Aufrufe der Maschine, Hauptlauf + Placebo Versatz = 139.938 Aufrufe = 2 × 69.969 Symbol-Signaltage;
Anteile an den 30.313 Null-Rückgaben der Zelle 1): kein Filing (kein 10-K/10-Q vor t, 20-F/40-F-Filer, Reihe ohne CIK, Tor 456 Tage)
**67,0 %** · `aktien` fehlt **30,3 %** · `eigenkapital` nicht ausgewiesen 2,1 % · keine Panelzeile 0,6 % · Kurs ≤ 0: 0. Auf das Universum
bezogen: 14,5 % ohne Filing, 6,6 % ohne Aktienzahl, 0,4 % ohne Eigenkapital. Die erwartete Abdeckung (Auftrag: 78–92 % je Klasse) wird
in der kleinsten Klasse (76,7 %) unterschritten; die Differenz zur Bilanz-Abdeckung ≈ 83 % ist die fehlende Aktienzahl. Zelle 2 zusätzlich:
`summe4q.netto` fehlt bei 9,7 % der Null-Rückgaben (3.158 von 32.703).

## 3. Nullpunkt (Kontrollen der Maschine; Urteil = Orakel + Placebo Symbole + Zufall + Klinke)

| Kontrolle | `bewertung` | `bewertung-ep` | Schranke | Urteil |
|---|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto **18.5915 Pp**, sd 6.10, Mittel/sd 3.05, t 29.37; Long − Short 34.4045 Pp | identisch (feldunabhängig) | ≥ 5 Pp, Mittel/sd ≥ 1, t ≥ 8; L-S ≥ 20 Pp | bestanden / bestanden |
| Placebo Symbole (je Signaltag permutiert) | brutto −0.2341 Pp, **t −2.08** | brutto −0.0221 Pp, t −0.18 | \|t\| < 3 | bestanden / bestanden |
| Zufall × 12 | Mittel brutto −0.0168, netto+Kosten −0.0093 Pp; \|t\| ≥ 3 in 0 Ziehungen; se je Ziehung 0.1104 Pp, MDE-Boden 0.3094 Pp | identisch | \|Mittel\| < 0.25 Pp, ≤ 3 Ziehungen | bestanden / bestanden |
| Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße; Positivkontrolle 2017-01-03 Kurs 1 / Bilanz 1; Leser 69.969 Zugriffe, 0 mit filed ≥ tag | identisch | je 1 / 0 | bestanden / bestanden |
| **Nullpunkt gesamt** | | | | **bestanden / bestanden** |
| Placebo Versatz +21 (nur Diagnose, Entscheid §9 (3)) | brutto **−1.6699 Pp, t −4.41** | brutto −1.2775 Pp, t −4.06 | \|t\| < 3 | gefallen / gefallen — geht nicht ins Urteil (`bestandenMitVersatz: false`) |

**Placebo Versatz — Deutung, nicht Reparatur.** Der Versatzwert ist B/M mit dem Kurs vom 21. Handelstag nach t, also mit dem Kurs am
**Ende der Halteperiode**: ein Symbol, dessen Kurs in der Halteperiode fiel, hat am Versatztag ein höheres B/M und rückt ins Dezil oben —
das Dezil oben des Versatzes sammelt die Verlierer der Periode ein (Fehlerform „Geteilter Kurs": das Placebo teilt einen Kurs mit der
Zielgröße). Die −1,67 Pp sind darum Konstruktion, kein Befund über das Signal am Tag t, dessen Kurs außerhalb des Haltefensters
Eröffnung(a) → Eröffnung(a′) liegt. Dasselbe gilt für jede kursskalierte Zelle (`groesse`, `bewertung-ep`, `fue-marktwert`): dort ist die
Erwartung des Versatz-Placebos nicht ≈ 0, sondern negativ. Der Anteil aus der Trägheit des Buchwerts (≈ Einzelmessung, −0,19 Pp) ist
demgegenüber klein.

Placebo Symbole der Zelle 1 liegt mit t −2,08 innerhalb der Schranke, aber nicht bei null; der Mittelwert −0,23 Pp ist in der
nachrichtlichen 0,25-Pp-Schranke. Gemeldet, nicht nachgelegt.

## 4. Einzelmessung (Diagnose, kein Urteil) — Dezil oben gegen Universum, Pp je Monat

| Reihe | `bewertung` Mittel | se | t | t_HH | MDE₈₀ | `bewertung-ep` Mittel | se | t | t_HH | MDE₈₀ |
|---|---|---|---|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | −0.1938 | 0.3716 | −0.52 | −0.52 | 1.0410 | −0.1392 | 0.2973 | −0.47 | −0.48 | 0.8330 |
| Dezil oben − Universum, **netto** | **−0.1992** | 0.3716 | −0.54 | −0.53 | **1.0412** | **−0.1477** | 0.2974 | −0.50 | −0.50 | **0.8333** |
| Long − Short, netto (verlangt Leihe) | −0.6660 | 0.5361 | −1.25 | – | 1.5020 | −0.2422 | 0.5387 | −0.45 | – | 1.5093 |

| Größe | `bewertung` | `bewertung-ep` |
|---|---|---|
| Universum je Signaltag / davon mit Wert (Mittel) | 760.5 / 596.2 | 760.5 / 582.9 |
| Dezil oben / unten (Mittel) | 59.9 / 59.2 | 58.7 / 57.9 |
| Dezil unten − Universum brutto / netto | 0.4721 / 0.4668 Pp | 0.1017 / 0.0944 Pp |
| Umschlag Dezil / Universum je Monat | **14.4 %** / 7.9 % | 18.5 % / 7.9 % |
| Kosten Dezil / Universum je Monat | 0.0129 / 0.0075 Pp | 0.0160 / 0.0075 Pp |
| Auffüllungen im Dezil oben / unten (Summe) | 0 / 0 | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 17 (1) / 10 | 21 (1) / 10 |
| Regime SPY über / unter EMA200, netto | −0.3956 (n 75) / 0.6674 (n 17) Pp | −0.2944 (n 75) / 0.4995 (n 17) Pp |
| Letzte 250 Tage (ab 2023-08-03), netto | −0.0690 Pp (se 0.7252, MDE₈₀ 2.0317, n 12) | 0.2379 Pp (se 0.5510, MDE₈₀ 1.5437, n 12) |

Jahresscheiben netto (Dezil oben − Universum), `bewertung` | `bewertung-ep`:

| Jahr | n | netto | se | t | MDE₈₀ | | netto | se | t | MDE₈₀ |
|---|---|---|---|---|---|---|---|---|---|---|
| 2017 | 12 | −1.0267 | 0.8984 | −1.19 | 2.5168 | | −0.7000 | 0.5690 | −1.28 | 1.5942 |
| 2018 | 12 | −0.7873 | 0.5675 | −1.45 | 1.5900 | | −0.4424 | 0.4817 | −0.96 | 1.3494 |
| 2019 | 12 | −0.9714 | 0.8083 | −1.26 | 2.2645 | | −0.7682 | 0.7829 | −1.02 | 2.1933 |
| 2020 | 12 | −0.3933 | 1.9508 | −0.21 | 5.4654 | | −0.9578 | 1.4825 | −0.67 | 4.1534 |
| 2021 | 12 | 1.4234 | 1.1442 | 1.30 | 3.2057 | | 0.7963 | 0.6386 | 1.30 | 1.7890 |
| 2022 | 12 | 0.2017 | 0.6916 | 0.30 | 1.9375 | | 0.0281 | 0.8791 | 0.03 | 2.4628 |
| 2023 | 12 | 0.5694 | 0.7535 | 0.79 | 2.1111 | | 0.6959 | 0.7528 | 0.97 | 2.1091 |
| 2024 (dünn, 8) | 8 | −0.8138 | 0.8872 | −0.98 | 2.4857 | | 0.3233 | 0.6945 | 0.50 | 1.9456 |

**Satzform.** Zelle 1: **−0,20 Pp netto bei MDE₈₀ 1,04 Pp** — nichts oberhalb von 1,04 Pp bei MDE₈₀ 1,04 Pp; das Vorzeichen der Jahre
2017–2019 ist negativ, 2021–2023 positiv (die Literatur nennt 2007–2020 als tote Phase und 2021–22 als Rückkehr), keine Scheibe erreicht
ihre MDE₈₀. Zelle 2: **−0,15 Pp netto bei MDE₈₀ 0,83 Pp** — nichts oberhalb von 0,83 Pp bei MDE₈₀ 0,83 Pp. Die Literaturgröße 0,3–0,4 Pp
(Long-Short je Monat, Obergrenze; realistisch die Hälfte, davon für Dezil − Universum wieder etwa die Hälfte) liegt in beiden Zellen unter
der Auflösung der Einzelmessung.

**Umschlag × Hürde gegen Literatur ×½:** Umschlag 14,4 % je Monat (erwartet 20–40 %; der Buchwert wechselt viermal im Jahr, der Rang
träge) ⇒ Kosten 0,013 Pp je Monat gegen 0,15–0,20 Pp (Literatur ×½, Long-Short) — die Kostenfrage ist für dieses Feld klein; für E/P
0,016 Pp bei 18,5 % Umschlag.

## 5. Verteilung der Rohgröße je Jahr (Hauptlauf; Quantile über alle Symbol-Signaltage mit Wert; nichts gekappt)

**B/M (`bewertung`)** — negativ = negatives Eigenkapital:

| Jahr | Signaltage | n | mit Wert | negativ | Anteil negativ | Q5 | Q25 | Median | Q75 | Q95 | Min | Max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2017 | 12 | 8049 | 6177 | 238 | 3.9 % | 0.019 | 0.148 | 0.284 | 0.488 | 1.031 | −0.778 | 1 411 071 |
| 2018 | 12 | 8492 | 6507 | 279 | 4.3 % | 0.010 | 0.132 | 0.272 | 0.485 | 1.021 | −0.599 | 4 610 434 |
| 2019 | 12 | 8324 | 6449 | 292 | 4.5 % | 0.007 | 0.130 | 0.273 | 0.518 | 1.182 | −0.832 | 7 191 370 |
| 2020 | 12 | 9060 | 6997 | 314 | 4.5 % | 0.005 | 0.115 | 0.261 | 0.573 | 1.494 | −0.971 | 4 045 669 |
| 2021 | 12 | 10176 | 7831 | 341 | 4.4 % | 0.005 | 0.090 | 0.216 | 0.457 | 0.976 | −2.630 | 1 498 616 |
| 2022 | 12 | 10302 | 8217 | 463 | 5.6 % | −0.009 | 0.121 | 0.263 | 0.498 | 1.062 | −1.087 | 1 256 907 |
| 2023 | 12 | 9246 | 7524 | 427 | 5.7 % | −0.012 | 0.124 | 0.285 | 0.539 | 1.141 | −83.0 | 854 544 |
| 2024 | 8 | 6320 | 5147 | 278 | 5.4 % | −0.005 | 0.119 | 0.274 | 0.510 | 1.019 | −26 784 | 445 240 |
| **alle** | 92 | 69969 | 54849 | **2632** | **4.8 %** | 0.002 | 0.121 | 0.264 | 0.507 | 1.114 | −26 784 | 7 191 370 |

**E/P (`bewertung-ep`)** — negativ = negatives 4-Quartals-Netto:

| Jahr | mit Wert | negativ | Anteil negativ | Q5 | Q25 | Median | Q75 | Q95 | Min | Max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2017 | 5839 | 873 | 15.0 % | −0.078 | 0.019 | 0.039 | 0.057 | 0.106 | −190.5 | 30 603 |
| 2018 | 6363 | 869 | 13.7 % | −0.051 | 0.018 | 0.040 | 0.063 | 0.127 | −33 319 | 192 321 |
| 2019 | 6346 | 755 | 11.9 % | −0.043 | 0.021 | 0.043 | 0.071 | 0.133 | −138 265 | 1 214 420 |
| 2020 | 6849 | 1213 | 17.7 % | −0.119 | 0.012 | 0.035 | 0.062 | 0.136 | −260 826 | 25 042 |
| 2021 | 7705 | 1915 | **24.9 %** | −0.129 | 0.000 | 0.027 | 0.049 | 0.116 | −78 036 | 55 919 |
| 2022 | 8075 | 1360 | 16.8 % | −0.085 | 0.017 | 0.039 | 0.074 | 0.202 | −58.6 | 53 024 |
| 2023 | 7383 | 1327 | 18.0 % | −0.110 | 0.015 | 0.038 | 0.069 | 0.195 | −29.9 | 37 977 |
| 2024 | 5068 | 798 | 15.7 % | −0.077 | 0.016 | 0.037 | 0.063 | 0.132 | −104.4 | 47 636 |
| **alle** | 53628 | **9110** | **17.0 %** | −0.090 | 0.014 | 0.037 | 0.063 | 0.150 | −260 826 | 1 214 420 |

Die Mitte der Verteilung ist plausibel (Median B/M 0,26, E/P 0,037 ≈ KGV 27); die Ränder (B/M > 100, E/P > 100 oder < −100) sind
Tafel-Fallstricke, siehe §7 (a)/(b) — ausgewiesen, nicht entfernt.

## 6. Sektormix des Dezils oben (Feld `sektor` der Tafelzeile; Symbol-Signaltage über alle Signaltage gepoolt; Dezilregel des Maschinenkopfs auf die Rohwerte angewandt, nur für diese Tabelle)

| Sektor | B/M Dezil oben | B/M Dezil unten | E/P Dezil oben | alle mit Wert (B/M) |
|---|---:|---:|---:|---:|
| Finanzen/Immobilien | **51.3 %** | 2.0 % | 36.4 % | 18.0 % |
| Verarbeitendes Gewerbe | 23.3 % | 34.2 % | 28.0 % | 37.3 % |
| Bergbau/Öl | 10.6 % | 1.0 % | 8.7 % | 4.5 % |
| Transport/Versorger/Kommunikation | 8.2 % | 6.6 % | 10.1 % | 11.3 % |
| Dienstleistungen | 3.8 % | 36.4 % | 5.7 % | 17.2 % |
| Einzelhandel | 1.2 % | 16.8 % | 6.5 % | 8.7 % |
| Bau / Landwirtschaft / Großhandel / ohne Sektor | 1.4 % | 3.0 % | 4.7 % | 3.0 % |
| Symbol-Signaltage | 5512 | 5448 | 5395 | 54849 |

Finanzen/Immobilien im B/M-Dezil oben je Jahr: 2017 44 %, 2018 41 %, 2019 46 %, 2020 56 %, 2021 63 %, 2022 53 %, 2023 55 %, 2024 48 %.
Das Dezil oben ist zur Hälfte ein Finanz-/Immobilienkorb (Universum 18 %), das Dezil unten (negatives Buchkapital, hohe Kurs-Buch-
Vielfache) ein Dienstleistungs-/Einzelhandelskorb. Nur berichtet — keine Sektorbereinigung (§1a.7).

## 7. Fallstricke der Tafel und Grenzen (gesehen, nicht repariert)

**(a) Aktienzahl in Tausend oder Millionen statt Stück.** 21 Symbole liefern B/M > 100 an 245 Symbol-Signaltagen (0,45 % der Werte), alle
im Dezil oben — **4,4 % des Dezils oben** (245 von 5.512). Hinter jedem steht eine Aktienzahl, die um 10³ bis 10⁶ zu klein ist: KO
`aktien` 4.265 (gewichtet basic, Fallback 2), MCD 721,8 (Fallback 2; ergibt B/M −26.784 bei −4,8 Mrd $ Eigenkapital), COP 1.245.961
(Fallback 2, Tausend), PCAR 351, TEVA 1.021, CHD 242,6, MBLY 759 (alle Fallback 2), GRMN 188.565, WSM 77.137, TER 165.806, ROP 101.672,
GEN/SYMC 608.019, AM 506.847 (Bilanzbestand, Fallback 1, Tausend), DWDP/DOW `aktien` **100** und VTR 400.000 (Issued, Fallback 4). Je
Fallback: 1 → 139, 2 → 86, 4 → 20 Symbol-Signaltage. B/M > 10: 267 Symbol-Signaltage (25 Symbole); 2 < B/M ≤ 10: 416 (74 Symbole; dort
sind echte Notlagen dabei). Dieselben Zeilen erzeugen die E/P-Ränder (DWDP 1,2·10⁶) — und sie treffen **jede Marktwert-Zelle** (`groesse`,
`fue-marktwert`, `bewertung-ep`). Im Rang schadet es nur so weit, wie die 4,4 % falsche Mitglieder das Dezil verdünnen; für `groesse`
(ln Marktwert) ist es ein Wert um 7–14 ln-Einheiten daneben. Nichts korrigiert (§1a.7: Ausreißer sind Befund).

**(b) Kürzel-Zuordnung.** `X`, `MENT` und `GAS` zeigen in `_reihen.json` alle auf **CIK 83246** (SIC 6021, Geschäftsbank, 208 Mrd $
Vermögen, `aktien` 714). U.S. Steel (Kürzel X) ist CIK 1163302. `X` liegt dadurch an **allen 92 Signaltagen** mit B/M ≈ 10⁶ im Dezil oben
(E/P −2,6·10⁵). Vermutlich eine schwache Volltext-Zuordnung der Verschwundenen-Studie (FUNDAMENTALTAFEL §1: 1.003 schwache
Zuordnungen). Für den PM: `_reihen.json` an dieser Stelle prüfen.

**(c) Split zwischen `filed` und t** verzerrt den Marktwert um den Split-Faktor (Aktienzahl des Filings × Kurs nach dem Split). Benannt,
nicht gemessen — der PM prüft über die Split-Liste des Panels.

**(d) Fallback-Anteile** (Zähler über alle Aufrufe, unter den 109.625 Werten der Zelle 1): `eigenkapitalFallback` 0 StockholdersEquity
92,8 % · 1 …IncludingNoncontrolling 7,1 % · 2 PartnersCapital 0,1 % · 3 MembersEquity 0,03 %. `aktienFallback` 0 Deckblatt 0,1 % · 1
Bilanzbestand 60,9 % · 2 gewichtet basic 31,2 % · 3 diluted 0,4 % · 4 Issued 7,4 %. Das Deckblatt (`dei:EntityCommonStockSharesOutstanding`)
fehlt in num.txt praktisch ganz (67 Zeilen der Tafel), die Aktienzahl ist also fast nie „zum Filing-Datum", sondern zum Bilanzstichtag oder
ein Periodenmittel. Zelle 2: `nettoFallback` 1 in 11,0 % der Werte.

**(e) Eigenkapital-Deckung.** `eigenkapital` fehlt nur bei 0,4 % des Universums (Partnerschaften/Trusts liefern über PartnersCapital/
MembersEquity) — die Lücke des Feldes ist die Aktienzahl (6,6 %), nicht das Buchkapital.

**(f) Versatztage fallen auf Signaltage.** In 29 der 92 Monate liegt t + 21 Handelstage genau auf dem nächsten Signaltag (Monate mit
21 Handelstagen); die Zähler je Aufruf-Tag mischen dort Hauptlauf und Placebo. Die Anteile sind davon unberührt (Hauptlauf-Tage und reine
Versatztage stimmen auf 0,1 Pp überein); die Zählwerte je Jahr in §5 stammen darum aus den Zellenwerten, nicht aus den Zählern.

**(g) Leseliste.** `wiki/fehlerformen.md` enthält keine Abschnitte „Messwerkzeug-Fallen" und „Bereinigte Kurse messen den Cent-Boden
falsch" (grep leer; die Namen stehen in `wiki/log.md`, `entscheide.md`, `belegstand.md`). Kein Hindernis, nur ein Hinweis für die Vorlage.

**(h) Placebo Versatz bei kursskalierten Feldern** ist konstruktionsbedingt negativ (§3) — für die Deutung der Diagnosezeile in allen
Marktwert-Zellen.

## 8. Laufzeit, RSS, Verbrauch

| | `bewertung` | `bewertung-ep` |
|---|---|---|
| Lauf | 4,6 s (Tafel ≈ 1 s) | 4,8 s |
| RSS max | 1.127 MB | 1.165 MB |
| Bilanzzugriffe (Leser) | 69.969, 0 Verstöße | 69.969, 0 Verstöße |
| Node | v24.18.0 | v24.18.0 |

Tokenverbrauch: siehe Übergabe (`uebergabe/mehrfaktor-feld-bewertung-2026-09-22.md`, Pflichtzeile).

## 9. Was der PM entscheiden muss

1. **Aktienzahl-Skala (7a)** und **Kürzel-Zuordnung X/MENT/GAS (7b)**: in der Tafel richten (bauen.js: Plausibilität `aktien × Kurs`
   gegen `vermoegen`, `_reihen.json`) und die Marktwert-Zellen neu laufen lassen — oder als bekannte Verdünnung (4,4 % des B/M-Dezils
   oben) in Runde 1b mitnehmen. Betrifft `groesse`, `bewertung`, `bewertung-ep`, `fue-marktwert`.
2. **Sektorkonzentration** (Finanzen/Immobilien 51 % des Dezils oben): §4 der Vorregistrierung sieht keine Sektorbereinigung vor — nur
   zur Kenntnis für die Deutung der Kombination.
3. **Versatz-Placebo** bei kursskalierten Feldern: die Diagnosezeile trägt dort ein negatives Vorzeichen aus der Konstruktion; falls die
   Vorlage die Erwartung „≈ 0" behält, gehört dieser Absatz als Hinweis dazu.
