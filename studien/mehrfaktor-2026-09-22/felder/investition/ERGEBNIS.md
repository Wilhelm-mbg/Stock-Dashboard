# Feld 7 `investition` — Zelle gebaut, Nullpunkt bestanden (22.09.2026, Feld-Agent Nr. 55)

Auftrag `uebergabe/auftrag-mehrfaktor-feld-investition-2026-09-22.md`; Formel aus `VORREGISTRIERUNG-KOMBINATION.md` §4 Zeile 7 in der
Fassung mit Nachtrag §11 (1). Maschine `zelle.js` (Kennung `mehrfaktor-2026-09-22/zelle/v1`, letzter Commit an der Datei `d3bfc5b`),
benutzt, nicht geändert. Alle Zahlen unten stammen aus `zellen/investition-bericht.md` / `investition.json` / `investition-nullpunkt.json`
(Maschine) oder aus `felder/investition/verteilung.js` (beschreibend, Abschnitt 6 — dort steht es dabei). Die Zelle ist eine Diagnose, kein
Urteil. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Lauf:** 92 Signaltage 2017-01-03 … 2024-08-01, Klassen 50-250 / 250-1000 / ab1000, Rückhaltefenster ab 2024-09-01 versiegelt
(`rueckhalte: false`). Tafel 0,64 s, Lauf 4,5 s, RSS max 1.165 MB (Maschinenzahlen), Node v24.18.0, 69.969 Bilanzzugriffe des Lesers.

## 1. Bau

| | |
|---|---|
| Rohgröße | `−100 · (f.roh.vermoegen / f.vermoegenVor − 1)` in Pp, `f = sicht.fundamentalAm(sym, sicht.iso)` — jüngstes 10-K/10-Q mit `filed` strikt vor dem Signaltag, Aktualitäts-Tor 456 Tage (Leser) |
| Tafelfelder | `roh.vermoegen` = Assets am Stichtag D0 (Bestand, qtrs 0); `vermoegenVor` = **Zeilenfeld** = Assets am Stichtag D4, wie zum Rang des Filings bekannt („erste Veröffentlichung gilt"). `roh.vermoegenVor` gibt es nicht (geprüft an `tafel-2023.jsonl`: Schlüssel der Zeile `…, summe4q, vermoegenVor, abgeleitet, marken`) |
| Richtung | gedreht: +30 % Vermögenswachstum → Rohwert −30; Schrumpfung → positiv, Dezil oben |
| `null` (nie 0) | keine Panelzeile am Signaltag; kein Filing; `roh.vermoegen` fehlt oder ≤ 0; `vermoegenVor` fehlt oder ≤ 0; Ergebnis nicht endlich |
| Keine Transformation | kein ×4, keine Jahresrate, keine Kappung, kein Log |

**Vorzeichenprobe** (Kunst-Sicht, vor dem Lauf, 11 Fälle grün, 0 rot): +30 % → −30,000; AAPL-Zeile 2023-02 (346,747 Mrd gegen 381,191 Mrd)
→ +9,036; Verdopplung → −100; gleich → 0 (echter Wert); kein Filing / `vermoegen` null / 0 / `vermoegenVor` fehlt / negativ /
nur `roh.vermoegenVor` gesetzt / keine Panelzeile → jeweils `null`. Der Leser wurde mit `sicht.iso` gerufen; `tag ≠ sicht.iso` trat im
Lauf 0-mal auf.

**Zähler des Moduls über alle Aufrufe der Maschine (Hauptlauf + Kontrollen: Placebo Versatz, Orakel-Lauf)** — 139.938 Aufrufe:
mit Wert 117.786 (84,2 %) · kein Filing 20.321 (14,5 %) · `vermoegenVor` fehlt 1.063 (0,76 %) · `roh.vermoegen` fehlt 574 (0,41 %) ·
keine Panelzeile 186 · `vermoegenVor` ≤ 0: 8 · `roh.vermoegen` ≤ 0: 0 · nicht endlich 0. Hauptlauf allein (Maschine): 69.969 Bilanzzugriffe,
11.044 Nullwerte (15,8 %).

## 2. Abdeckung (Anteil des Universums mit Wert; Tabelle der Maschine)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 80,2 % (5304/6615) | 89,2 % (1143/1282) | 93,4 % (142/152) | 81,9 % |
| 2018 | 81,9 % (5570/6797) | 88,8 % (1312/1478) | 93,1 % (202/217) | 83,4 % |
| 2019 | 82,7 % (5468/6615) | 90,7 % (1334/1471) | 92,4 % (220/238) | 84,4 % |
| 2020 | 82,4 % (5578/6766) | 90,2 % (1741/1930) | 90,7 % (330/364) | 84,4 % |
| 2021 | 81,0 % (5860/7231) | 89,3 % (2176/2437) | 87,2 % (443/508) | 83,3 % |
| 2022 | 81,5 % (5793/7111) | 91,4 % (2440/2670) | 90,4 % (471/521) | 84,5 % |
| 2023 | 83,4 % (5675/6807) | 93,0 % (1990/2140) | 91,6 % (274/299) | 85,9 % |
| 2024 | 84,0 % (3759/4477) | 92,3 % (1456/1578) | 92,1 % (244/265) | 86,4 % |
| **alle** | 82,0 % | 90,7 % | 90,7 % | **84,2 %** |

Erwartet waren 75–85 % (Spalte „Vermögen" 81–94 % je Klasse minus Zeilen ohne D4-Bestand): gemessen 84,2 %, der D4-Abzug kostet nur
≈ 0,8 Pp (1.063 Aufrufe). Gründe für Lücken, in dieser Reihenfolge: **kein Filing** (20-F/40-F-Filer, Reihen ohne CIK, Filings jenseits des
456-Tage-Tors) 14,5 % der Aufrufe; **D4-Bestand fehlt** 0,76 % (typisch 52/53-Wochen-Geschäftsjahre und junge Registranten ohne Vorjahr im
Bestand); **Assets fehlt** 0,41 %; keine Panelzeile 0,13 %; Bestand ≤ 0: 8 Aufrufe. Universum je Signaltag im Mittel 760,5, davon mit
Wert 640,5; Dezil oben 64,5 / unten 63,6; **Auffüllungen im Dezil oben / unten: 0 / 0** (Streckung, Entscheid §9 (7)).

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus `konfig.js`)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto **18,59 Pp**, sd 6,10, Mittel/sd 3,05, t 29,37, n 92; Long − Short **34,40 Pp** | ≥ 5 Pp horizontgleich, Mittel/sd ≥ 1, t ≥ 8; L-S ≥ 20 Pp (nachrichtlich 20 Pp einseitig: verfehlt, wie bei jeder Zelle) | **bestanden** |
| Placebo Symbole (je Signaltag permutiert) | brutto **−0,108 Pp**, t −0,87, n 92 | \|t\| < 3 (\|Mittel\| < 0,25 Pp: ja) | **bestanden** |
| Zufall × 12 | Mittel brutto **−0,017**, netto+Kosten −0,009 Pp; \|t\| ≥ 3 in **0** Ziehungen; se je Ziehung 0,110 Pp; **MDE-Boden 0,309 Pp** | \|Mittel\| < 0,25 Pp, ≤ 3 Ziehungen | **bestanden** |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf **0** Verstöße; Positivkontrolle 2017-01-03: Kurs **1**, Bilanz **1** (Soll je 1); Leser **69.969** Zugriffe, **0** mit `filed ≥ tag` | Positivkontrolle je 1, Leser 0 | **bestanden** |
| Placebo Versatz +21 (nur Diagnose, Entscheid §9 (3)) | brutto **0,031 Pp**, t 0,13, n 92 | \|t\| < 3 | bestanden (nicht im Urteil) |

**`nullpunkt.bestanden = true`** aus den vier Kontrollen Orakel, Placebo Symbole, Zufall, Klinke. Placebo Versatz liegt bei einem trägen
Bilanzfeld erwartungsgemäß nahe der Einzelmessung (0,03 gegen 0,12 Pp brutto) — Diagnose, kein Tor.

## 4. Einzelmessung (Diagnose, kein Urteil)

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0,1176 | 0,2580 | 0,46 | 0,29 | 0,7228 | 92 |
| Dezil oben − Universum, **netto** | **0,1074** | 0,2581 | 0,42 | **0,26** | **0,7230** | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | −0,0605 | 0,5346 | −0,11 | – | 1,4976 | 92 |
| Long − Short, netto | −0,0616 | 0,5346 | −0,12 | – | 1,4977 | 92 |

Satzform: **0,11 Pp netto bei MDE₈₀ 0,72** — nichts oberhalb von 0,72 Pp bei MDE₈₀ 0,72; t_HH 0,26 gegen die Schwelle 3. Das Dezil
**unten** liegt mit +0,178 / +0,169 Pp (brutto / netto) ebenfalls über dem Universum, Long − Short ist negativ: die beiden Ränder liegen
im Rechenfenster beide über der Mitte, ohne Ordnung entlang des Rangs. Die Literaturzahl (≈ 0,3 Pp L-S, Obergrenze; realistisch die
Hälfte) liegt unter der Auflösung dieser Zelle (MDE₈₀ L-S 1,50 Pp).

| Größe | Wert |
|---|---|
| Umschlag Dezil / Universum je Monat | **20,3 %** / 7,9 % (erwartet 20–35 %) |
| Kosten Dezil / Universum je Monat | **0,0176** / 0,0075 Pp |
| Dezilgröße oben / unten (Mittel) | 64,5 / 63,6 |
| Auffüllungen im Dezil oben / unten (Summe) | 0 / 0 |
| Tote im Dezil oben (Totalverlust) / Lücken | 20 (1) / 12 |
| Signaltage unter 100 Mitgliedern | 0 |
| Regime SPY über / unter EMA200, netto | −0,007 (n 75) / +0,614 (n 17) Pp |

**Jahresscheiben** (netto, Dezil oben − Universum): 2017 −0,34 (se 0,56) · 2018 −0,10 (0,42) · 2019 −0,20 (0,41) · 2020 −0,32 (0,80) ·
2021 **+2,04** (1,27, t 1,68, MDE₈₀ 3,55) · 2022 +0,38 (0,62) · 2023 −0,13 (0,67) · 2024 −0,76 (0,32, t −2,52, 8 Monate, dünn).
Sieben von acht Scheiben liegen unter ihrer MDE₈₀; die Summe hängt an 2021. **Letzte 250 Tage** (ab 2023-08-03): netto −0,35 Pp, se 0,50,
t −0,73, MDE₈₀ 1,40, n 12.

## 5. Kostenfrage (eine Zeile)

Umschlag 20,3 % × Kassa-Hürde ⇒ **0,0176 Pp je Monat** gegen Literatur × ½ = 0,15 Pp: die Kosten sind ≈ 12 % der halben Literaturzahl —
das Feld ist billig, seine Frage ist die Auflösung (MDE₈₀ 0,72 gegen 0,15), nicht der Umschlag.

## 6. Verteilung der Rohwerte und Sektormix (beschreibend, `verteilung.js`, 1,8 s)

Quantile je Jahr über alle Universumsmitglieder mit Wert (Signaltag × Symbol; Pp, negativ = Vermögenswachstum); nichts gekappt:

| Jahr | Werte | min | 5 % | 25 % | 50 % | 75 % | 95 % | max | Anteil < 0 (Wachstum) | Dezil oben: kleinster / Median Rohwert |
|---|---|---|---|---|---|---|---|---|---|---|
| 2017 | 6.589 | −1.253,8 | −65,1 | −12,3 | −4,5 | 0,7 | 12,9 | 72,9 | 72,3 % | 5,3 / 12,9 |
| 2018 | 7.084 | −38.142.545 | −64,0 | −14,0 | −5,5 | −0,5 | 11,6 | 73,1 | 77,0 % | 3,7 / 11,6 |
| 2019 | 7.022 | −945.009 | −71,8 | −16,6 | −5,3 | 0,2 | 12,3 | 72,6 | 74,0 % | 4,6 / 12,3 |
| 2020 | 7.649 | −1,26 · 10¹⁰ | −84,8 | −19,3 | −7,6 | −1,3 | 10,1 | 71,9 | 79,3 % | 3,3 / 10,0 |
| 2021 | 8.479 | −1.733.853 | −112,9 | −19,6 | −8,0 | −1,1 | 10,0 | 100,0 | 78,9 % | 4,3 / 10,0 |
| 2022 | 8.704 | −2.309.023 | −78,7 | −17,4 | −5,9 | 0,2 | 9,7 | 54,1 | 74,2 % | 4,1 / 9,7 |
| 2023 | 7.939 | −750,2 | −41,2 | −10,1 | −2,9 | 2,0 | 13,8 | 75,5 | 64,9 % | 4,8 / 13,8 |
| 2024 | 5.459 | −541,2 | −36,6 | −10,4 | −4,1 | 0,8 | 9,5 | 46,6 | 71,5 % | 4,3 / 9,2 |

Alle Jahre: 58.925 Werte, 5/25/50/75/95 % = −71,2 / −15,3 / −5,4 / +0,2 / +11,4. Unter −100 (Vermögen mehr als verdoppelt: Übernahmen,
Kapitalerhöhungen, SPAC-Abschlüsse) 1.953 Symbol-Tage, unter −1.000: 76, unter −10.000: 28; über +50 (mehr als halbiert): 98, über +99: 1.
Das Dezil oben beginnt je Jahr bei 3,3–5,3 Pp Schrumpfung, sein Median liegt bei 9–14 Pp Schrumpfung. Da die Maschine über Ränge
arbeitet, berühren die Extremwerte die Dezile nicht; sie sind Tafelbefund (Abschnitt 7).

**Dezil oben** ist hier eine **Näherung**: die Maschine legt ihre Dezil-Mitglieder nicht ab (nur `k`, `nUni`, `mitWert` je Periode), darum
rechnet `verteilung.js` die Rangregel des Berichts (§4) nach. Gegenprobe: Dezilgröße, n und m stimmen an **92 von 92** Signaltagen mit den
Zahlen der Maschine überein. Sektor = SIC-Division des jüngsten Filings der Reihe (nicht punkt-in-Zeit; für einen Mix-Bericht ausreichend),
Symbol-Tage über alle 92 Signaltage (Dezil oben 5.937, Universum mit Wert 58.925, ohne Sektor 0):

| Gruppe (Auftrag §1b) / SIC-Division | Dezil oben | Universum mit Wert | Verhältnis |
|---|---|---|---|
| **Rohstoffe** (SIC 1000–1499 Bergbau/Öl, 2911) | 10,0 % | 5,3 % | **1,88** |
| **Biotech/Pharma** (SIC 2834, 2835, 2836, 8731) | 9,9 % | 5,6 % | **1,77** |
| **Finanzwerte** (SIC 6000–6799) | 13,4 % | 17,8 % | 0,75 |
| Verarbeitendes Gewerbe (2000–3999, enthält Pharma) | 44,7 % | 37,3 % | 1,20 |
| Dienstleistungen (7000–8999) | 17,1 % | 17,3 % | 0,99 |
| Einzelhandel | 7,7 % | 8,5 % | 0,91 |
| Transport/Versorger/Kommunikation | 7,5 % | 11,9 % | 0,63 |
| Großhandel · Bau · Landwirtschaft | 1,0 · 0,4 · 0,1 % | 1,7 · 1,1 · 0,1 % | 0,58 · 0,41 · 0,55 |

Nur berichtet: Rohstoffe und Biotech/Pharma sind im Dezil oben knapp doppelt so häufig wie im Universum (Abschreibungen, Cash-Verbrauch),
Finanzwerte und Versorger seltener (Bilanzen wachsen stetig).

## 7. Fallstricke der Tafel (gesehen, nichts davon repariert)

1. **Erst-Fakten-Regel trifft neu gebildete Holdings.** `vermoegenVor` ist der zuerst veröffentlichte Assets-Wert am Stichtag D4 — bei
   Registranten, die als Hülle begannen, ist das der Bestand der Hülle: AMCR 2020-07/08 (16,4 Mrd gegen **130 $**, Rohwert −1,26 · 10¹⁰),
   TW 2020-07 (5,18 Mrd gegen **100 $**), FTI 2018-05 (28,3 Mrd gegen 74.100 $), SBNY 2022-04 (346 Mio gegen 15.000 $; die Zeile trägt SIC
   7374 und passt nicht zu einer Bank — möglicherweise eine der 1.003 schwachen Kürzelzuordnungen der Tafel, nicht geprüft). 28 Symbol-Tage
   unter −10.000. Rangharmlos (unterstes Dezil), aber jede Größenaussage über diese Rohwerte wäre falsch.
2. **Einheitenfehler in der Quelle:** HRC 2021-12 `roh.vermoegen` = **4.999,1** (Millionen als Einheiten getaggt) gegen 4,67 Mrd →
   Rohwert +100,0, **Dezil oben** an einem Signaltag. Einziger Fall über +99; die Tafel-Filter (Fremdwährung/Einheit) fangen das nicht.
3. **Echte große positive Werte sind Abschreibungen:** TDOC 2023-04/05 +75,5 (Goodwill 2022) — so vom Auftrag erwartet, kein Fehler.
4. **Neudarstellungen sind ausgeschlossen** (erste Veröffentlichung gilt): das Wachstum wird gegen den ursprünglich gemeldeten D4-Wert
   gemessen, nicht gegen die im aktuellen Filing gezeigte Vergleichsspalte. Punkt-in-Zeit richtig, aber bei Neudarstellungen ein anderer
   Wert als der, den ein Leser des aktuellen Berichts sieht.
5. **D4 als „Monatsende vier Quartale zurück"** verfehlt 52/53-Wochen-Bilanzstichtage → `vermoegenVor` fehlt in 0,76 % der Aufrufe.
6. **Tote im Dezil oben: 20** (Totalverlust-Regel) — schrumpfende Bilanzen enthalten Notlagen; das ist Teil des Feldes, nicht der Tafel,
   gehört aber neben die Jahresscheiben.
7. **Die Maschine legt keine Dezil-Mitglieder ab** — Sektormix und Dezilschwellen mussten nachgerechnet werden (Gegenprobe 92/92). Befund an
   den PM, falls die Kombination je Mitgliederlisten braucht.

## 8. Laufzeit, RSS, Verbrauch

Tafel 0,64 s, Lauf 4,5 s, RSS max 1.165 MB (Maschine; eine PowerShell-Abfrage von `PeakWorkingSet64` am Kindprozess blieb bei 42 MB stehen
und taugt nicht als Messung). `verteilung.js` 1,8 s. Tokenverbrauch: siehe Übergabe (Pflichtzeile dort).

## 9. Dateien

`felder/investition/feld.js` (Werte-Funktion), `felder/investition/verteilung.js` (Abschnitt 6), `felder/investition/ERGEBNIS.md`;
aus der Maschine: `zellen/investition.json`, `zellen/investition-nullpunkt.json`, `zellen/investition-bericht.md`.
Übergabe: `Markt-Dashboard-Daten/uebergabe/mehrfaktor-feld-investition-2026-09-22.md`.
