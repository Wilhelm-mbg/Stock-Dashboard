# Warum sind sie verschwunden? — Gruende der erloschenen Reihen (12.09.2026)

Kennung `verschwundene-gruende-2026-09-12/v1`. Tafel: `verschwundene-gruende.json`, 4.996 Zeilen, eine je Reihe.
Sperrklinken: `node test.js`. Rohdaten des EDGAR-Durchgangs: `edgar/` (Cache), `edgar-zuordnung.json`.

## 0. Was hier gezaehlt wird

| Groesse | Wert | Woher |
|---|---|---|
| Reihen CS/ADRC mit Balken | 7.299 | `_lebenszeit.json` + `wertpapierarten.json` |
| davon **nicht lebend** (letzter Balken vor 2026-08-17) | **4.996** | ebenda |
| Gruppe `verschwunden` in `_symbole.json` | 4.801 | `_symbole.json` |

Die beiden Zahlen sind **nicht dieselbe Menge**. Der Auftrag nennt 4.801 und die Regel
"letzter Tagesbalken vor 2026-08-17" in einem Atemzug; gemessen sind es 4.996 Reihen nach der Regel
und 4.801 nach dem Gruppen-Etikett des Archivs. Sie ueberschneiden sich zu 4.748: 53 Reihen mit dem Etikett
`verschwunden` liefern wieder Balken (wiederverwendete Kuerzel), 248 Reihen aus der Gruppe `universum` liefern keine mehr.
**Diese Tafel folgt der Regel, nicht dem Etikett** — das Etikett ist ein Sammelvermerk, die Regel eine Messung.

## 1. Zaehler je Kategorie

| Kategorie | Reihen | Anteil |
|---|---:|---:|
| `uebernahme` | 1.653 | 33,1 % |
| `fusion-aktientausch` | 310 | 6,2 % |
| `umbenennung-ticker` | 1.330 | 26,6 % |
| `insolvenz` | 357 | 7,1 % |
| `zwangs-delisting` | 547 | 10,9 % |
| `freiwillig` | 311 | 6,2 % |
| `spac-ende` | 276 | 5,5 % |
| `unbekannt` | 212 | 4,2 % |
| **Summe** | **4.996** | 100 % |

Anteil `unbekannt`: **4,2 %**.

### Belegart je Zeile

| Beleg | Zeilen |
|---|---:|
| `alpaca-name_changes` | 1.329 |
| `alpaca-cash_mergers` | 786 |
| `edgar-8K-2.01+prospekt` | 745 |
| `edgar-8K-3.01` | 546 |
| `alpaca-stock_mergers` | 310 |
| `edgar-formular25` | 291 |
| `edgar-mantel+abmeldung` | 273 |
| `edgar-8K-1.03` | 201 |
| `nichts` | 156 |
| `alpaca-stock_and_cash_mergers` | 120 |
| `q-kuerzel+edgar-8K-1.03` | 107 |
| `q-kuerzel` | 49 |
| `edgar-ohne-signal` | 38 |
| `massnahme-passt-nicht` | 18 |
| `edgar-formular15` | 13 |
| `alpaca-redemptions` | 9 |
| `bigdata` | 4 |
| `alpaca-worthless_removals` | 1 |

## 2. Zaehler je Jahr

| Jahr | `uebernahme` | `fusion-aktientausch` | `umbenennung-ticker` | `insolvenz` | `zwangs-delisting` | `freiwillig` | `spac-ende` | `unbekannt` | Summe |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2015 | 9 | — | — | — | 4 | 1 | 1 | — | 15 |
| 2016 | 94 | — | — | 15 | 43 | 35 | — | 20 | 207 |
| 2017 | 176 | — | — | 23 | 65 | 42 | 3 | 38 | 347 |
| 2018 | 168 | — | — | 20 | 58 | 37 | 2 | 40 | 325 |
| 2019 | 169 | — | 13 | 32 | 74 | 41 | 4 | 37 | 370 |
| 2020 | 97 | 27 | 112 | 42 | 29 | 15 | 2 | 10 | 334 |
| 2021 | 151 | 46 | 236 | 9 | 19 | 9 | 1 | 8 | 479 |
| 2022 | 156 | 51 | 119 | 18 | 38 | 51 | 90 | 17 | 540 |
| 2023 | 198 | 46 | 174 | 75 | 54 | 42 | 97 | 8 | 694 |
| 2024 | 140 | 48 | 242 | 68 | 97 | 17 | 36 | 4 | 652 |
| 2025 | 172 | 57 | 258 | 36 | 61 | 15 | 35 | 21 | 655 |
| 2026 | 123 | 35 | 176 | 19 | 5 | 6 | 5 | 9 | 378 |

## 3. Aufschlag der Uebernahmen — und warum er klein ist

`aufschlag_pp` = (Angebotspreis − letzter Schluss im Archiv) / letzter Schluss · 100.

| Jahr | Uebernahmen mit Barpreis | Median-Aufschlag (Pp) |
|---|---:|---:|
| 2020 | 50 | 0,036 |
| 2021 | 118 | 0,029 |
| 2022 | 114 | 0,019 |
| 2023 | 166 | 0,040 |
| 2024 | 126 | 0,032 |
| 2025 | 120 | 0,014 |
| 2026 | 93 | 0,000 |
| **alle** | **787** | **0,029** |

**Das ist der wichtigste Einzelbefund dieser Tafel.** Der Aufschlag am Ende ist praktisch null:
ATVI 95,00 $ gegen 94,42 $ letzten Schluss, TWTR 54,20 gegen 53,80, VMW 142,50 gegen 142,52,
CERN 95,00 gegen 94,95. Die Praemie einer Uebernahme wird am **Ankuendigungstag** bezahlt, nicht am
Vollzugstag — bis zum letzten Handelstag ist der Kurs laengst auf das Angebot gelaufen. Wer eine
Delisting-Regel damit begruendet, dass am Ende ein Aufschlag winkt, begruendet sie mit einer Groesse,
die es nicht gibt. Was die Delisting-Ausstiege der Kanalstudie gross gemacht hat, muss vorher passiert sein.

## 4. Nachtrag zur Kanalstudie (09.09.) — Bericht, keine Neumessung

### 4a. Was die Aggregation NICHT hergibt

`ergebnis-2026-09-09/ergebnis.json` fuehrt 64 Delisting-Zellen, je Linie/Einstieg/Richtung/Ausstieg:
`nTrades, nDelist, anteil, mittelDelist, mittelAlle, delistB, mittelDelistB`. **Kein Feld traegt ein Kuerzel**
und keines einen Grund. Die Zellen lassen sich daher nicht nach Grund aufteilen — auch nicht naeherungsweise,
denn welche Reihe in welcher Zelle steckt, steht nirgends. Das ist eine Eigenschaft der Aggregation, kein
Fehler dieser Tafel; eine Aufteilung waere nur mit einer Neumessung zu haben, und die ist hier ausgeschlossen.

### 4b. Was die Tagesdateien hergeben

Ersatzweise, und als solcher gekennzeichnet: der **Endlauf** je Reihe — die Rendite der letzten 60
Balkentage vor dem letzten Balken, aus denselben Tagesdateien `tage-0..3/<REIHE>.json` (Feld `c1`), nach Grund.
Das ist kein Trade und keine Regel; es ist die Bewegung, in die ein Delisting-Ausstieg hineinlief.

| Grund | Reihen | Median Endlauf (Pp) | Mittel (Pp) |
|---|---:|---:|---:|
| `uebernahme` | 1.635 | 4,91 | 22,74 |
| `fusion-aktientausch` | 309 | 1,92 | 6,39 |
| `umbenennung-ticker` | 1.301 | -2,46 | 16,07 |
| `insolvenz` | 357 | -72,97 | -56,78 |
| `zwangs-delisting` | 544 | -21,44 | -17,69 |
| `freiwillig` | 309 | 1,30 | -1,29 |
| `spac-ende` | 273 | 4,74 | 6,06 |
| `unbekannt` | 177 | 0,63 | 44,87 |

### 4c. Die 20 groessten Endlaeufe, mit Grund

| # | Reihe | Firma | Grund | Datum | Endlauf (Pp) | letzter Kurs |
|---:|---|---|---|---|---:|---:|
| 1 | QMMM | QMMM Holdings Ltd | `unbekannt` | — | 8249,7 | 119,4000 |
| 2 | TCGL | VerifyMe, Inc. | `uebernahme` | 2024-12-12 | 3356,8 | 172,8400 |
| 3 | AGE | — | `umbenennung-ticker` | 2024-03-27 | 3070,5 | 11,1000 |
| 4 | SRM | Tron Inc. | `umbenennung-ticker` | 2025-07-17 | 3040,2 | 10,3000 |
| 5 | BBIG | Cineverse Corp. | `zwangs-delisting` | 2024-07-12 | 2744,3 | 4,7300 |
| 6 | AGLE | Spyre Therapeutics, Inc. | `umbenennung-ticker` | 2023-11-28 | 2505,2 | 12,0100 |
| 7 | MHUA | Meihua International Medical Technologies Co., Ltd. | `umbenennung-ticker` | 2025-12-09 | 1913,2 | 7,6100 |
| 8 | DTC | — | `umbenennung-ticker` | 2025-07-24 | 1821,6 | 19,6000 |
| 9 | OCTO | Eightco Holdings Inc. | `umbenennung-ticker` | 2025-09-11 | 1813,5 | 24,1100 |
| 10 | OP | — | `umbenennung-ticker` | 2025-11-17 | 1612,2 | 1,3800 |
| 11 | JNVR | DeFi Development Corp. | `umbenennung-ticker` | 2025-05-05 | 1345,2 | 79,3100 |
| 12 | EYEN | HYPERION DEFI, INC. | `umbenennung-ticker` | 2025-07-03 | 1325,1 | 15,8200 |
| 13 | KDLY | Nakamoto Inc. | `zwangs-delisting` | 2025-08-15 | 1199,0 | 24,9400 |
| 14 | RYCE | Amira Nature Foods Ltd. | `freiwillig` | 2020-12-18 | 1142,5 | 7,0200 |
| 15 | GLT | Magnera Corp | `umbenennung-ticker` | 2024-11-05 | 1138,2 | 21,0500 |
| 16 | TBRA | Tobira Therapeutics, Inc. | `uebernahme` | 2016-11-01 | 931,6 | 42,0900 |
| 17 | HUNT | Lument Finance Trust, Inc. | `freiwillig` | 2019-02-14 | 874,4 | 95,0000 |
| 18 | DNMR | Danimer Scientific, Inc. | `insolvenz` | 2025-03-18 | 841,0 | 4,1300 |
| 19 | TRXC | — | `umbenennung-ticker` | 2021-03-12 | 705,4 | 4,0800 |
| 20 | CNXA | AIRWA INC. | `umbenennung-ticker` | 2024-04-15 | 649,6 | 1,5000 |

## 5. Lauf

| Groesse | Wert |
|---|---|
| EDGAR-Anfragen | 9.027 |
| davon Fehlversuche (wiederholt) | 272 |
| Laufzeit EDGAR | 1.580 s |
| gefahrene Rate | 5,71 Anfragen/s (Obergrenze 8) |
| Bigdata-Guthaben vorher | 975,8594 |
| Bigdata-Guthaben nachher | 950,6124 |
| Bigdata verbraucht | 25,2470 von hoechstens 250 |
| Bigdata-Abfragen | 9 |

## 6. Was diese Tafel NICHT sagt

1. **`umbenennung-ticker` ist keine Aussage ueber den Aktionaer.** 1.330 Reihen tragen sie;
   bei 496 hat der Nachfolger im Archiv wieder Balken, bei 834 nicht — fast durchweg Kuerzel auf
   `-F` oder `-Y`, also der Gang in den Freiverkehr (AAMC→AAMCF, ABB→ABBNY). Das Papier blieb handelbar,
   aber das Archiv sieht es nicht mehr. Das Feld `nachfolger_im_archiv` trennt beides; eine Studie, die
   Ueberlebensverzerrung misst, muss sich entscheiden, welche der beiden Gruppen sie fortschreibt.
2. **Ein Tag traegt 77 Reihen.** Am 2025-03-21 endet das Archiv fuer 77 Reihen auf einmal — der
   naechsthaeufigste Tag hat 13. Das ist keine Firmengeschichte, das ist eine **Sammlungsgrenze** der Quelle
   (40 dieser Reihen hatten laut EDGAR ohnehin ein Zwangs-Delisting, der Rest nicht). Wer "verschwunden" als
   Ereignis liest, liest an diesem Tag eine Eigenschaft des Sammlers als Eigenschaft des Marktes.
3. **Barpreise gibt es erst ab 2020.** Von 1.653 Uebernahmen tragen 787 einen Barsatz; vor 2020 keine.
   Das Massnahmen-Archiv fuehrt `cash_mergers` erst ab dann brauchbar. `aufschlag_pp` ist also eine Aussage
   ueber 2020–2026, nicht ueber das ganze Fenster.
4. **Der Rest ist eine Stichprobe, keine Liste.** Von 212 unbekannten Reihen wurden 12 gezogen und 9
   ueber Bigdata.com abgefragt (4 aufgeloest, 4 ohne Treffer, 1 nur mit Firmennamen). Der Deckel von 250
   Einheiten war nicht die bindende Grenze — 9 Abfragen kosteten 25,2. Gebremst hat das Token-Budget.
5. **Die Kategorie ist der Mechanismus, nicht das Schicksal.** `uebernahme` sagt, dass Geld floss, nicht
   dass sich der Kauf gelohnt hat; `zwangs-delisting` sagt, dass eine Boersenregel gerissen ist, nicht warum.

