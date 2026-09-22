# Feld 6 `ertragskraft` (+ `ertragskraft-roa` nachrichtlich) — Ergebnis des Feld-Agenten Nr. 54 (22.09.2026)

Maschine `zelle.js` (Kennung `mehrfaktor-2026-09-22/zelle/v1`), unverändert benutzt. 92 Signaltage 2017-01-03 … 2024-08-01,
Rückhaltefenster ab 2024-09-01 versiegelt (`rueckhalte: false`), Klassen 50-250 / 250-1000 / ab1000, Universum 760,5 je Signaltag.
Alle Zahlen unten stammen aus `zellen/ertragskraft-bericht.md`, `zellen/ertragskraft-roa-bericht.md` (Maschine) oder aus den
Modul-Zählern (Abschnitt 2, ausdrücklich so bezeichnet). Die Zelle ist eine Bau- und Nullpunktprüfung, kein Urteil.
Simulation mit virtuellem Kapital, keine Anlageberatung.

## 1. Was gebaut wurde

| Zelle | Datei | Rohgröße | Rolle |
|---|---|---|---|
| `ertragskraft` | `feld.js` | `((roh.umsatz − roh.umsatzkosten) × 4 / roh.qtrs) / roh.vermoegen` des jüngsten Filings (`sicht.fundamentalAm(sym, sicht.iso)`): Bruttogewinn des Filings auf Jahresrate (10-K qtrs 4 ⇒ ×1, 10-Q qtrs 1 ⇒ ×4) durch Vermögen D0; höher = besser | Signal, Gewicht 1 |
| `ertragskraft-roa` | `feld-roa.js` | `abgeleitet.roa` des jüngsten Filings (= `summe4q.netto / roh.vermoegen`, von der Tafel gebildet, nur gelesen) | nachrichtlich, nicht gewichtet |

`null` (nie 0) bei: keine Panelzeile, kein Filing, `umsatz`/`umsatzkosten`/`vermoegen` nicht ausgewiesen, `vermoegen ≤ 0`, `qtrs ∉ {1, 4}`
(bzw. `abgeleitet.roa` nicht ausgewiesen). Negativer oder exakt null Bruttogewinn ist ein Wert. Je Aufruf genau ein Bilanzzugriff mit
`tag = sicht.iso`; keine Module außer den Modul-Zählern (zählen nur, ändern keinen Wert, Ausgabe als JSON-Zeile beim Prozessende).

Aufruf wie im Auftrag (§1a.5), ohne `--ziel`/`--aus`/`--rueckhalte`, Node v24.18.0. Die gewichtete Zelle lief zweimal (zweiter Lauf
nach Erweiterung der Zähler um Sektor-Quantile); Bericht und Zellen sind bis auf den Zeitstempel identisch (Maschine deterministisch).

## 2. Abdeckung — der halbe Bericht

### 2.1 Je Klasse und Jahr (Anteil des Universums mit Wert; Bericht §2)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt `ertragskraft` | gesamt `ertragskraft-roa` |
|---|---|---|---|---|---|
| 2017 | 48,5 % (3208/6615) | 60,0 % (769/1282) | 68,4 % (104/152) | 50,7 % (4081/8049) | 79,0 % |
| 2018 | 50,2 % (3412/6797) | 59,3 % (877/1478) | 73,7 % (160/217) | 52,4 % (4449/8492) | 82,3 % |
| 2019 | 52,6 % (3481/6615) | 59,1 % (869/1471) | 76,5 % (182/238) | 54,4 % (4532/8324) | 83,9 % |
| 2020 | 53,4 % (3615/6766) | 61,1 % (1179/1930) | 67,3 % (245/364) | 55,6 % (5039/9060) | 83,2 % |
| 2021 | 51,7 % (3740/7231) | 59,7 % (1456/2437) | 64,6 % (328/508) | 54,3 % (5524/10176) | 82,6 % |
| 2022 | 51,8 % (3683/7111) | 59,1 % (1578/2670) | 67,6 % (352/521) | 54,5 % (5613/10302) | 83,7 % |
| 2023 | 53,9 % (3670/6807) | 60,4 % (1293/2140) | 72,2 % (216/299) | 56,0 % (5179/9246) | 84,8 % |
| 2024 (8 Monate) | 54,0 % (2417/4477) | 59,5 % (939/1578) | 77,0 % (204/265) | 56,3 % (3560/6320) | 85,3 % |
| **alle** | **51,9 %** | **59,8 %** | **69,9 %** | **54,3 %** (412,8 von 760,5 je Signaltag) | **83,1 %** (631,8) |

Erwartet waren 45–60 % — getroffen. ROA (83,1 %) entspricht der Bilanz-Abdeckung der Vorregistrierung (≈ 83 %): der Unterschied
von 28,8 Punkten zwischen den beiden Zellen ist fast ganz die fehlende Umsatzkosten-Zeile.

### 2.2 Gründe für Lücken (Modul-Zähler; Hauptlauf 69.969 Paare Signaltag × Symbol = 92 × 760,5, identisch mit den 69.969 Leser-Zugriffen der Klinke)

| `ertragskraft` | n | Anteil Universum | | `ertragskraft-roa` | n | Anteil |
|---|---|---|---|---|---|---|
| Wert | 37.977 | 54,3 % | | Wert | 58.130 | 83,1 % |
| `umsatzkosten` nicht ausgewiesen | 20.903 | 29,9 % | | `abgeleitet.roa` nicht ausgewiesen | 1.644 | 2,3 % |
| kein Filing (kein CIK, 20-F/40-F, Tor 456 Tage) | 10.195 | 14,6 % | | kein Filing | 10.195 | 14,6 % |
| `umsatz` nicht ausgewiesen | 891 | 1,3 % | | | | |
| `vermoegen` nicht ausgewiesen | 3 | 0,0 % | | | | |
| `vermoegen ≤ 0` / `qtrs ∉ {1,4}` / nicht endlich / keine Panelzeile | 0 / 0 / 0 / 0 | | | | | |

Der Grund-Zähler nimmt den ersten fehlenden Wert in der Reihenfolge umsatz → umsatzkosten → vermoegen; 855 der 891 „umsatz fehlt"
haben auch keine Umsatzkosten (Sektor-Zähler unten zählt Umsatzkosten-Lücken unabhängig davon: 21.758). Die Zähler-Summen je Jahr
(4.081 / 4.449 / 4.532 / 5.039 / 5.524 / 5.613 / 5.179 / 3.560) sind exakt die Zähler der Maschine in 2.1.

### 2.3 Je Sektor (`sektor` der Tafelzeile; Modul-Zähler, Hauptlauf)

| Sektor | Filings mit Wert | ohne `umsatzkosten` | Anteil ohne¹ | Anteil an allen Werten | Rohgröße p10 / p50 / p90 |
|---|---|---|---|---|---|
| Verarbeitendes Gewerbe | 19.785 | 2.256 | 10,2 % | 52,1 % | 0,117 / 0,263 / 0,515 |
| Dienstleistungen | 7.756 | 2.839 | 26,8 % | 20,4 % | 0,122 / 0,321 / 0,567 |
| Einzelhandel | 4.259 | 814 | 16,0 % | 11,2 % | 0,243 / 0,500 / 0,817 |
| Transport/Versorger/Kommunikation | 2.417 | 4.778 | 66,4 % | 6,4 % | 0,102 / 0,177 / 0,403 |
| Finanzen/Immobilien | 1.511 | 8.941 | 85,5 % | 4,0 % | 0,072 / 0,171 / 1,320 |
| Großhandel | 1.004 | 77 | 7,1 % | 2,6 % | 0,153 / 0,393 / 0,748 |
| Bergbau/Öl | 811 | 1.750 | 68,3 % | 2,1 % | 0,054 / 0,157 / 0,398 |
| Bau | 380 | 290 | 43,3 % | 1,0 % | 0,101 / 0,202 / 0,342 |
| Landwirtschaft | 54 | 0 | 0 % | 0,1 % | 0,079 / 0,170 / 0,286 |
| (ohne Sektor) | 0 | 13 | — | — | — |

¹ ohne / (ohne + mit Wert); Filings, die schon am Umsatz scheitern, fehlen im Nenner (≤ 891).

**Fund über die Daten:** Der Wertevorrat ist zu 52 % Verarbeitendes Gewerbe, 20 % Dienstleistungen, 11 % Einzelhandel.
Finanzen/Immobilien (85 % ohne Umsatzkosten-Zeile), Bergbau/Öl (68 %) und Transport/Versorger/Kommunikation (66 %) fallen
überwiegend heraus und bekommen in der Kombination den mittleren Rang. Die Dezilgrenze oben liegt bei ≈ 0,59 (p90 aller Werte);
Einzelhandel (Median 0,50, p90 0,82) und Großhandel (0,39 / 0,75) liegen als ganze Sektoren nahe daran oder darüber — das Dezil oben
ist ein Handels-/Dienstleistungs-Dezil mit den oberen Rändern der Industrie, kein Querschnitt des Universums. Finanzen/Immobilien
hat mit 1.511 Werten ein schweres oberes Ende (p90 1,32: Umsatzkosten-Zeilen, die nur einen Teil der Kosten tragen).

### 2.4 10-Q (qtrs 1, ×4) gegen 10-K (qtrs 4) — Anteil je Jahr und Quantile getrennt (Modul-Zähler, Hauptlauf)

| Jahr | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 (Jan–Aug) | alle |
|---|---|---|---|---|---|---|---|---|---|
| qtrs 1 | 3.187 | 3.473 | 3.572 | 3.910 | 4.297 | 4.335 | 4.056 | 2.518 | 29.348 |
| qtrs 4 | 894 | 976 | 960 | 1.129 | 1.227 | 1.278 | 1.123 | 1.042 | 8.629 |
| Anteil qtrs 1 | 78,1 % | 78,1 % | 78,8 % | 77,6 % | 77,8 % | 77,2 % | 78,3 % | 70,7 % | **77,3 %** |

Drei von vier Werten sind ein Quartal ×4 (Nachtrag §11 (1) — bekannte Grenze). 2024 liegt tiefer, weil die acht Monate Januar bis
August die 10-K-Monate (Filings Februar/März) überproportional enthalten.

| Quantil | p1 | p5 | p10 | p25 | p50 | p75 | p90 | p95 | p99 | min | max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| qtrs 1 (n 29.348) | 0,000 | 0,082 | 0,116 | 0,176 | 0,286 | 0,432 | 0,597 | 0,738 | 1,229 | −0,341 | 3,406 |
| qtrs 4 (n 8.629) | 0,000 | 0,077 | 0,115 | 0,171 | 0,275 | 0,413 | 0,577 | 0,701 | 1,138 | −0,209 | 317.677 |

Sind die ×4-Werte breiter gestreut? **Kaum:** Quartilsabstand 0,256 gegen 0,242 (+6 %), p90 − p10 0,481 gegen 0,462 (+4 %), p99 +8 %;
die ×4-Werte liegen an jedem Quantil um 2–4 % höher. Die Saisonalität zeigt sich nicht als Streuung der Quantile. Das qtrs-4-Maximum
ist kein Saisoneffekt, sondern der Skalenfehler in Abschnitt 6.

### 2.5 Verteilung und Ausreißer (nichts gekappt; Zählung über `zellen/*.json`)

- `ertragskraft`: exakt 0 in 29 Werten (Umsatz = Umsatzkosten, meist beide 0: Vorumsatz-Firmen), negativ 370 (1,0 %; z. B. EQT
  2021-11 … 2022-02 −0,341 — Bruttoverlust, echter Wert), > 2 in 64 (CHRW 3,3–3,4 an vielen Signaltagen: Logistikmakler mit kleiner
  Bilanz — echter Wert), > 5 in genau 1: HRC 2021-12-01 = 317.677 (Abschnitt 6).
- `ertragskraft-roa`: p1/p10/p50/p90/p99 = −0,386 / −0,047 / 0,043 / 0,145 / 0,271; negativ 10.310 (17,7 %); min −3,51 (HMNY
  2017-12, 2018-01); max 49.709 (HRC, dasselbe Filing).

## 3. Nullpunkt (Kontrollen der Maschine; Urteil aus Orakel, Placebo Symbole, Zufall, Klinke — Versatz nur Diagnose, Entscheid §9 (3))

| Kontrolle | `ertragskraft` | `ertragskraft-roa` | Schranke | Urteil |
|---|---|---|---|---|
| Orakel (Rang nach künftiger Rendite) | Dezil − Universum 18,59 Pp, sd 6,10, Mittel/sd 3,05, t 29,37; Long-Short 34,40 Pp | identisch (Schlüssel der Maschine) | ≥ 5 Pp, Mittel/sd ≥ 1, t ≥ 8; L-S ≥ 20 Pp (einseitig 20 Pp: verfehlt, nachrichtlich) | bestanden / bestanden |
| Placebo Symbole (je Signaltag permutiert) | −0,256 Pp, t −1,69 | −0,109 Pp, t −0,73 | \|t\| < 3 | bestanden / bestanden |
| Zufall × 12 | Mittel brutto −0,017, netto −0,009 Pp; \|t\| ≥ 3 in 0; se je Ziehung 0,110 Pp; MDE-Boden 0,309 Pp | identisch | \|Mittel\| < 0,25 Pp, ≤ 3 Ziehungen | bestanden / bestanden |
| Klinke (Kurs und Bilanz) | Positivkontrolle Kurs 1 / Bilanz 1 (Soll je 1); Hauptlauf 0; Leser 69.969 Zugriffe, 0 mit filed ≥ Tag | identisch | je 1 / 0 | bestanden / bestanden |
| Placebo Versatz +21 (nur Diagnose) | +0,401 Pp, t 1,76 | +0,353 Pp, t 1,58 | \|t\| < 3 | ≈ Einzelmessung — träges Feld, wie erwartet |

**Nullpunkt gesamt: beide Zellen bestanden** (`nullpunkt.bestanden` der Maschine).

## 4. Einzelmessung (Diagnose, kein Urteil; Dezil oben − Universum, Pp je Monat)

| | `ertragskraft` | `ertragskraft-roa` |
|---|---|---|
| brutto / **netto** | 0,302 / **0,295 Pp** | 0,211 / **0,207 Pp** |
| se / t / t_HH (Tage) | 0,240 / 1,24 / 1,21 | 0,231 / 0,90 / 0,91 |
| **MDE₈₀** | **0,673 Pp** | **0,646 Pp** |
| Long − Short brutto (Diagnose, verlangt Leihe) | 0,850 Pp, t 1,90, MDE₈₀ 1,259 | −0,033 Pp, t −0,05 |
| Dezil unten − Universum netto | −0,555 Pp | +0,237 Pp |
| Dezilgröße oben / unten (Mittel) | 41,5 / 41,1 | 63,6 / 62,7 |
| Auffüllungen im Dezil oben / unten | 0 / 0 | 0 / 0 |
| Umschlag Dezil / Universum je Monat | 16,4 % / 7,9 % | 13,9 % / 7,9 % |
| Kosten Dezil je Monat | 0,0140 Pp | 0,0116 Pp |
| Tote im Dezil oben / Lücken | 7 (0) / 5 | 8 (0) / 9 |
| Regime SPY über / unter EMA200, netto | 0,337 (n 75) / 0,111 (n 17) | 0,319 / −0,289 |
| Letzte 250 Tage (ab 2023-08-03, n 12) | netto 0,621 Pp, se 0,653, t 0,99, MDE₈₀ 1,828 | netto 0,008 Pp, t 0,01, MDE₈₀ 1,609 |

Jahresscheiben netto (n 12, 2024 dünn n 8) — `ertragskraft`: 2017 0,446 · 2018 0,155 · 2019 0,303 · 2020 0,864 · 2021 0,119 ·
2022 −0,430 · 2023 0,433 · 2024 0,562 (t zwischen −0,58 und 1,14; MDE₈₀ je Jahr 1,1–2,8 Pp). `ertragskraft-roa`: 0,462 · 0,258 ·
0,520 · 0,059 · 0,069 · −0,749 · 0,768 · 0,297 (t −1,13 … 2,06).

**Satzform:** `ertragskraft` 0,30 Pp netto bei MDE₈₀ 0,67 Pp — nichts oberhalb von 0,67 Pp auflösbar; Long-Short 0,85 Pp bei
MDE₈₀ 1,26. `ertragskraft-roa` 0,21 Pp netto bei MDE₈₀ 0,65 Pp; Long-Short −0,03 Pp. Beide Vorzeichen sind die der Literatur, keine
der Zahlen erreicht t_HH 3.

## 5. Umschlag × Hürde gegen Literatur × ½

Umschlag 16,4 % (erwartet 20–35 %: darunter — Bilanzgrößen ändern sich viermal im Jahr, der Rang ist träge) × Kassa-Hürde im Klassenmix
= **0,014 Pp je Monat**; Literatur 0,3–0,5 Pp Long-Short × ½ = 0,15–0,25 Pp ⇒ die Kosten sind 6–9 % davon. ROA: 13,9 %, 0,012 Pp.

## 6. Fallstricke der Tafel

1. **Skalenfehler in Bestandsgrößen (ein Fall im Universum):** HRC, 10-K period 2021-09-30, filed 2021-11-12: `roh.vermoegen = 4999.1`,
   `roh.eigenkapital = 1879.7` (Millionen), während `umsatz 3.018.700.000`, `umsatzkosten 1.430.600.000`, `netto 248.500.000` in Dollar
   stehen; das Vorquartal (10-Q 2021-06-30) trägt `vermoegen 4.572.700.000`. Folge: Ertragskraft 317.677, ROA 49.709 am Signaltag
   2021-12-01 (danach verschwindet HRC aus dem Panel — Übernahme). Wirkung auf die Rangzelle: ein Mitglied des Dezils oben an einem Tag.
   Dasselbe Filing trifft jede Zelle mit `vermoegen` oder `eigenkapital` im Nenner oder Zähler (Felder 5, 7, 11, `ertragskraft-roa`);
   Marke `erstVonFrueher: 1`. Ein Tafel-Test „Bestand/Fluss-Verhältnis springt um > 10³ zwischen zwei Filings" würde solche Fälle
   finden — Sache der Tafel, nicht dieses Feldes. Nichts gekappt.
2. **Placebo Versatz trifft den nächsten Signaltag:** +21 Handelstage ist in ≈ 30 % der Fälle genau der nächste Monatserste; von 69.969
   Versatz-Aufrufen waren 20.920 Paare (Lesetag, Symbol) schon aus dem Hauptlauf bekannt. Die Versatz-Zähler (49.049 neue Paare,
   26.558 Werte, 186 „keine Zeile" = Reihen, die binnen 21 Tagen verschwinden) sind darum nur diagnostisch. Die Maschine ruft `werte`
   genau zweimal je Paar (Hauptlauf + Versatz; Orakel, Zufall und Placebo Symbole rufen es nicht).
3. **Saisonalität:** 77 % der Werte sind ein Quartal ×4 (2.4) — bekannte Grenze nach Nachtrag §11 (1), keine Glättung, keine Beschränkung
   auf 10-K.
4. **Umsatzkosten-Zeile als Sektorfilter** (2.3): die Abdeckung ist nicht zufällig über Sektoren verteilt; die Streckungsregel setzt
   Banken, Versorger und Ölfirmen auf den mittleren Rang.
5. Werte exakt 0 (29) und negativ (370) sind echte Werte und bleiben.

## 7. Laufzeit, RSS, Verbrauch

Je Zelle 5,0 s Wanduhr (Maschine: Tafel ≈ 1 s, Lauf 4,6 s), RSS max 1.180 MB, Node v24.18.0; die gewichtete Zelle lief zweimal
(identische Ergebnisse). Verbrauch laut `get_usage` (Kontextfenster dieser Sitzung beim Schreiben dieser Datei): **332.282 Token**,
davon Nachrichten 264.363, feste Anteile (Werkzeuge, Skills, Gedächtnis, System) ≈ 68.000 — das Budget von 120k ist nach dieser
Zahl deutlich überschritten; Endstand in der Übergabe.

## 8. Was der PM entscheiden muss

1. Übernahme der Zelle `ertragskraft` in die Kombination (Nullpunkt bestanden, Auffüllungen im Dezil 0) — mit der sektoralen
   Schieflage aus 2.3 als bekannter Eigenschaft, oder Rückfrage, ob ein Dezil aus Handel/Dienstleistungen das gemeinte Feld ist.
2. Skalenfehler HRC (6.1): Prüfung der Tafel auf Bestand/Fluss-Sprünge vor dem Kombinationslauf oder Ausweis als bekannte Lücke.
3. `ertragskraft-roa` bleibt nachrichtlich (Vorregistrierung §4 Zeile 6); nichts zu entscheiden.
