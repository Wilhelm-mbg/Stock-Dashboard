# Feld `sue` — Gewinnüberraschung: Zelle gebaut, Nullpunkt bestanden (22.09.2026, Feld-Agent Nr. 56)

**Formel (Vorregistrierung §4 Zeile 8, Entscheid §9 (5), Nachtrag §11):** SUE = (netto D0 − netto D4) / sd(netto D0…D7), Stichproben-sd
n−1 = 7, aus `quartale.netto` des jüngsten 10-K/10-Q mit `filed` strikt vor dem Signaltag (`sicht.fundamentalAm(sym, sicht.iso)`,
Tor 456 Tage); höher = besser; `null` bei fehlendem Filing, fehlendem/nicht endlichem Quartal oder sd = 0. Nichts gekappt, nichts
transformiert. Rolle: Signal, Gewicht 1. Die Zelle ist kein Urteil; alle Zahlen unten stammen aus `zellen/sue-bericht.md` /
`zellen/sue.json` (Maschine `zelle.js`, Kennung `mehrfaktor-2026-09-22/zelle/v1`; zur Laufzeit unkommittiert geändert, Blob
`273725d8`, HEAD `1eea6cd`) oder aus den Modul-Zählern in `feld.js` (§5).

**Lauf:** `node --max-old-space-size=6144 zelle.js --feld felder/sue/feld.js` — 4,6 s (Tafel 0,65 s), RSS max 1165 MB, Node v24.18.0,
92 Signaltage 2017-01-03 … 2024-08-01, `rueckhalte: false`. Zweiter Lauf (nach Umbau der Zähler) mit identischen Zahlen.

## 1. Nullpunkt — bestanden (`nullpunkt.bestanden` = true; `bestandenMitVersatz` = false)

| Kontrolle | Ergebnis (Maschine) | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite) | Dezil − Universum brutto 18,5915 Pp, sd 6,10, Mittel/sd 3,05, t 29,37, n 92; Long − Short 34,4045 Pp | ≥ 5 Pp, Mittel/sd ≥ 1, t ≥ 8; L-S ≥ 20 Pp (20 Pp einseitig nachrichtlich: verfehlt) | bestanden |
| Placebo Symbole (je Signaltag permutiert) | brutto −0,0879 Pp, t −0,75, n 92 | \|t\| < 3 (\|Mittel\| < 0,25: ja) | bestanden |
| Zufall × 12 | Mittel brutto −0,0168, netto+Kosten −0,0093 Pp; \|t\| ≥ 3 in 0 Ziehungen; se je Ziehung 0,1104 Pp; MDE-Boden 0,3094 Pp | \|Mittel\| < 0,25 Pp, ≤ 3 Ziehungen | bestanden |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße; Positivkontrolle 2017-01-03: Kurs 1, Bilanz 1; Leser 69.969 Zugriffe, 0 mit filed ≥ tag | Positivkontrolle je 1, Leser 0 | bestanden |
| **Placebo Versatz +21 Handelstage** (nur Diagnose, Entscheid §9 (3)) | brutto **0,6100 Pp, t 3,67**, n 92 | \|t\| < 3 | **gefallen** — berichtet, nicht gedeutet; geht nicht ins Urteil |

Zum Versatz nur Zählbares: die 92 Versatz-Tage (2017-02-02 … 2024-08-30) fallen in 29 Fällen auf einen Signaltag der Studie
(+21 Handelstage ≈ erster Handelstag des Folgemonats); der Versatz-Durchlauf nutzt Filings mit `filed` bis zum Versatz-Tag, also
auch solche aus der Halteperiode (Auftrag §1b).

## 2. Einzelmessung (Diagnose, kein Urteil) — Dezil oben gegen Universum, Pp je Monat

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.1575 | 0.1694 | 0.93 | 0.96 | 0.4747 | 92 |
| Dezil oben − Universum, **netto** | 0.1353 | 0.1696 | 0.80 | 0.83 | 0.4751 | 92 |
| Long − Short, brutto (verlangt Leihe) | 0.2509 | 0.3564 | 0.71 | – | 0.9986 | 92 |
| Long − Short, netto | 0.2512 | 0.3564 | 0.71 | – | 0.9984 | 92 |

Satzform: **0,135 Pp netto bei MDE₈₀ 0,475 Pp** (t_HH 0,83 < 3) — nichts oberhalb von 0,475 Pp auflösbar; die Literatur-Obergrenze
(0,5–1 Pp Long-Short über 2–3 Monate, Bernard/Thomas 1989) liegt als Monatswert (≈ 0,17–0,5 Pp L-S, davon realistisch die Hälfte)
unter oder an dieser Auflösung. Long-Short brutto 0,25 Pp, t 0,71.

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) / davon mit Wert | 760,5 / 631,0 (83,0 %) |
| Dezil oben / unten (Mittel; Dezil = 10 % der Ausweiser) | 63,6 / 62,6 |
| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten | 0 / 0 |
| Dezil unten − Universum brutto / netto | −0,0934 / −0,1159 Pp |
| **Umschlag** Dezil / Universum je Monat | **36,6 %** / 7,9 % (Erwartung des Auftrags 40–60 %; SUE wechselt nur je Filing, also je Quartal) |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | 0,0297 / 0,0075 Pp |
| Tote im Dezil oben (Totalverlust) / Lücken | 18 (0) / 6 |
| Regime SPY über / unter EMA200, netto | 0,0582 (n 75) / 0,4754 (n 17) Pp |

**Kostenfrage (eine Zeile):** Umschlag 36,6 % × Hürde ⇒ 0,030 Pp je Monat; Literatur ×½ ⇒ ≈ 0,08–0,25 Pp je Monat (0,5–1 Pp über
2–3 Monate, halbiert) — die Kosten liegen bei einem Achtel bis einem Drittel davon; die Auflösung (MDE₈₀ 0,475) ist die Grenze,
nicht die Hürde.

**Jahresscheiben (netto, Dezil oben − Universum; aus dem Bericht):** 2017 +0,2328 (t 0,66) · 2018 −0,5004 (t −1,71) · 2019 +0,1766
(t 0,51) · 2020 −0,0057 (t −0,01) · 2021 −0,2240 (t −0,47) · 2022 +0,0505 (t 0,09) · 2023 +0,7686 (t 1,72) · 2024 +0,8085 (t 1,21, 8
Monate, dünn); MDE₈₀ je Scheibe 0,86–1,99 Pp. **Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0,8202 Pp, se 0,4933, t 1,74,
MDE₈₀ 1,3819, n 12. Keine Scheibe erreicht ihre MDE₈₀.

## 3. Abdeckung (Anteil des Universums mit Wert; Tabelle der Maschine)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 77.5 % (5124/6615) | 84.7 % (1086/1282) | 93.4 % (142/152) | 78.9 % (6352/8049) |
| 2018 | 80.7 % (5488/6797) | 87.6 % (1295/1478) | 93.1 % (202/217) | 82.3 % (6985/8492) |
| 2019 | 82.2 % (5438/6615) | 89.5 % (1316/1471) | 92.4 % (220/238) | 83.8 % (6974/8324) |
| 2020 | 81.8 % (5536/6766) | 86.7 % (1674/1930) | 89.8 % (327/364) | 83.2 % (7537/9060) |
| 2021 | 80.3 % (5805/7231) | 87.2 % (2125/2437) | 86.4 % (439/508) | 82.2 % (8369/10176) |
| 2022 | 80.9 % (5753/7111) | 89.8 % (2397/2670) | 86.6 % (451/521) | 83.5 % (8601/10302) |
| 2023 | 82.6 % (5621/6807) | 91.4 % (1957/2140) | 90.6 % (271/299) | 84.9 % (7849/9246) |
| 2024 | 82.8 % (3706/4477) | 91.4 % (1443/1578) | 90.6 % (240/265) | 85.3 % (5389/6320) |
| **alle** | 81.0 % | 88.7 % | 89.4 % | **83.0 %** |

Die Abdeckung liegt **über** der Erwartung des Auftrags (65–80 %) und praktisch auf der Bilanz-Abdeckung (≈ 83 %): acht Quartale
fehlen nur selten, wenn überhaupt ein Filing im Tor liegt. **Gründe für Lücken** (Hauptlauf, 69.969 Aufrufe = `bilanzZugriffe` der
Maschine, `werteNull` 11.913): kein Filing im Tor (20-F/40-F-Filer, Reihen ohne CIK, Filing älter als 456 Tage) **10.195 = 14,6 %**;
eines der acht Quartale fehlt **1.718 = 2,5 %**; sd = 0 **0**; keine Panelzeile am Signaltag 0 (die Maschine ruft nur Universumsmitglieder).

## 4. Verteilung von SUE (Hauptlauf, aus `sue.json`, 58.056 Werte)

| Jahr | mit Wert | P5 | P25 | Median | P75 | P95 | min | max | \|SUE\| > 5 |
|---|---|---|---|---|---|---|---|---|---|
| 2017 | 6352 | −2,170 | −0,345 | 0,318 | 1,238 | 2,514 | −3,69 | 3,57 | 0 |
| 2018 | 6985 | −2,478 | −0,241 | 0,347 | 1,193 | 2,700 | −3,68 | 3,66 | 0 |
| 2019 | 6974 | −2,497 | −0,408 | 0,133 | 0,877 | 2,591 | −3,72 | 3,53 | 0 |
| 2020 | 7537 | −2,744 | −1,233 | −0,077 | 0,723 | 2,400 | −3,68 | 3,50 | 0 |
| 2021 | 8369 | −2,285 | −0,333 | 0,517 | 1,696 | 2,872 | −3,56 | 3,62 | 0 |
| 2022 | 8601 | −2,340 | −0,638 | 0,175 | 1,097 | 2,394 | −3,54 | 3,59 | 0 |
| 2023 | 7849 | −2,430 | −0,922 | 0,087 | 0,986 | 2,429 | −3,62 | 3,71 | 0 |
| 2024 | 5389 | −2,238 | −0,577 | 0,190 | 1,105 | 2,520 | −3,72 | 3,71 | 0 |
| alle | 58056 | −2,465 | −0,593 | 0,205 | 1,130 | 2,605 | −3,72 | 3,71 | **0** |

Mittel 0,202; Anteil > 0: 58,7 %; Anteil |SUE| > 2: 20,0 %. **Befund zum Nenner:** |SUE| > 5 (Auftrag §1a.7) kommt **nicht vor und
kann nicht vorkommen** — D0 und D4 gehören selbst zur Stichprobe des Nenners, und für acht Werte gilt |x_i − x_j| ≤ sd·√(2·7) =
3,742·sd. Die Verteilung ist an dieser Schranke gestaucht (beobachtet −3,72 / +3,71 = D0 und D4 als die beiden Extreme, die übrigen
sechs Quartale nahe beieinander). Nichts geändert; das ist eine Eigenschaft von Entscheid §9 (5), nicht der Tafel.

## 5. Modul-Zähler (`feld.js`; zählen nur, ändern keinen Wert)

Ausgewiesen als **Zähler über alle Aufrufe der Maschine (Hauptlauf + Kontrollen)**: 139.938 Aufrufe in zwei Durchläufen (Datum
springt zurück = neuer Durchlauf), Werte 116.058 (83,0 %), kein Filing 20.321 (14,5 %), Quartal fehlt 3.373 (2,4 %), sd 0: 0, keine
Panelzeile 186 (alle im Versatz-Durchlauf), `tag ≠ sicht.iso`: 0.

| | Durchlauf 1 = Hauptlauf (92 Signaltage) | Durchlauf 2 = Placebo Versatz (92 Tage, 29 davon Signaltage) |
|---|---|---|
| Aufrufe / Werte | 69.969 / 58.056 (83,0 %) | 69.969 / 58.002 (83,1 %) |
| kein Filing / Quartal fehlt / sd 0 | 10.195 / 1.718 / 0 | 10.126 / 1.655 / 0 |
| Filings mit ≥ 1 Weg `y` (Jahr − YTD3) | **616 = 1,1 %** der genutzten Filings; 819 `y`-Quartale = 0,18 % der 8 × 58.056 | 589 = 1,0 %; 795 Quartale |
| Formen der genutzten Filings | 10-Q 44.486 · 10-K 13.403 · 10-K/A 83 · 10-Q/A 66 · 10-QT 12 · 10-KT 6 | 10-Q 44.569 · 10-K 13.272 · 10-K/A 78 · 10-Q/A 63 · 10-QT 12 · 10-KT 8 |
| Abstand `filed` → Signaltag, Kalendertage | **Median 51**, P5 4, P25 27, P75 68, P95 92, min 1, max 449 | Median 47, P25 27, P75 68, P95 92 |

Das Signal ist am Signaltag im Median 51 Tage alt (P95 92 Tage); gegenüber der 8-K-Vorabmeldung liegt es zusätzlich Wochen zurück
(Vorlage §6: zu spät, nie zu früh — ausgewiesen, nicht repariert).

## 6. Fallstricke der Tafel und der Formel

1. **Schranke des Nenners** (§4): |SUE| ≤ 3,742 by construction; Ausreißer im Sinn des Auftrags gibt es nicht.
2. **Alter des Signals**: Median 51 Tage `filed` → Signaltag; 10-K-Zeilen (23 % der genutzten Filings) tragen D0 = Q4, das erst mit
   dem Jahresbericht (≈ 60–90 Tage nach Stichtag) sichtbar wird.
3. **Berichtigte Filings** (10-K/A, 10-Q/A: 149 = 0,26 % der genutzten Filings) sind als „jüngstes Filing" nutzbar und können
   neu dargestellte Quartale tragen (FUNDAMENTALTAFEL.md §4) — nicht ausgeschlossen, nur gezählt.
4. **Wege `y`** in 1,1 % der Filings — erlaubt, gezählt, nicht ausgeschlossen.
5. **Umschlag 36,6 %** unter der Auftragserwartung (40–60 %): zwischen zwei Filings (≈ 3 Monate) ist der Wert konstant, das Dezil
   wechselt daher überwiegend an den Monaten mit neuen Quartalszahlen.
6. **Placebo Versatz gefallen** (t 3,67) — erwartet nach Auftrag §1b, nur Diagnose; `bestandenMitVersatz` = false steht in der Zelle.

## 7. Laufzeit, RSS, Verbrauch

4,6 s Lauf, RSS max 1165 MB (zwei Läufe: 5,1 s / 4,6 s, identische Zahlen). Tokenverbrauch: siehe Übergabe
(`uebergabe/mehrfaktor-feld-sue-2026-09-22.md`, Pflichtzeile). Simulation mit virtuellem Kapital, keine Anlageberatung.
