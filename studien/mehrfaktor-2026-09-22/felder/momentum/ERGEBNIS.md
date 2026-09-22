# Feld `momentum` — Ergebnis der Faktorzelle (Auftrag Nr. 49, 22.09.2026)

Feld-Agent baut die Zelle und prüft ihren Nullpunkt; die Zelle ist kein Urteil. Alle Zahlen stammen aus `zellen/momentum-bericht.md`
und `zellen/momentum.json` (Maschine `zelle.js`, Kennung `mehrfaktor-2026-09-22/zelle/v1`); §6 enthält zusätzlich eine
Feldabfrage der Rohwerte aus der Zelle (Quantile), die die Maschine nicht schreibt. Simulation mit virtuellem Kapital, keine
Anlageberatung.

**Maschinenstand des Laufs:** Repo `1eea6cd` plus die zu diesem Zeitpunkt **uncommittete** Änderung an `zelle.js` (Urteilsregel:
Placebo Versatz nur Diagnose, Feld `bestandenMitVersatz`; +7/−1 Zeilen gegen `85783e8`) — das ist der Stand, den Auftrag §1a.1 und
Vorregistrierung §9 (3) beschreiben. Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9.904.017 Zeilen, 7.338 Reihen, bis
2026-09-15). 92 Signaltage 2017-01-03 … 2024-08-01, Rückhaltefenster ab 2024-09-01 versiegelt (24 Signaltage), `rueckhalte: false`.

## 1. Was gebaut wurde

`felder/momentum/feld.js`: Rohgröße je Symbol am Signaltag t = `100 · (bSchluss[zurueck(z, 21)] / bSchluss[zurueck(z, 252)] − 1)`
in Pp, höher = besser (12-1-Momentum, Vorregistrierung §4 Zeile 1; wörtlich der Beispielaufruf im Kopf von `zelle.js`). Gelesen nur
über `sicht.zeileAm`, `sicht.zurueck`, `sicht.felder.bSchluss`. `null` (nie 0) bei fehlender Panelzeile, fehlender 21. oder 252.
Vorzeile, Basis ≤ 0 oder nicht endlichem Ergebnis. Keine Kappung, keine Transformation. Zähler im Modul zählen nur und schreiben
beim Prozessende auf stderr (§2).

## 2. Abdeckung (Anteil des Universums mit Wert; Tabelle der Maschine)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 99,9 % (6610/6615) | 100,0 % (1282/1282) | 100,0 % (152/152) | 99,9 % (8044/8049) |
| 2018 | 100,0 % (6794/6797) | 99,9 % (1477/1478) | 100,0 % (217/217) | 100,0 % (8488/8492) |
| 2019 | 100,0 % (6612/6615) | 100,0 % (1471/1471) | 100,0 % (238/238) | 100,0 % (8321/8324) |
| 2020 | 100,0 % (6764/6766) | 100,0 % (1930/1930) | 100,0 % (364/364) | 100,0 % (9058/9060) |
| 2021 | 99,9 % (7227/7231) | 100,0 % (2437/2437) | 100,0 % (508/508) | 100,0 % (10172/10176) |
| 2022 | 100,0 % (7108/7111) | 100,0 % (2670/2670) | 100,0 % (521/521) | 100,0 % (10299/10302) |
| 2023 | 100,0 % (6805/6807) | 100,0 % (2139/2140) | 100,0 % (299/299) | 100,0 % (9243/9246) |
| 2024 (8 Monate) | 100,0 % (4477/4477) | 100,0 % (1578/1578) | 100,0 % (265/265) | 100,0 % (6320/6320) |

Universum je Signaltag im Mittel 760,5, davon mit Wert 760,3; Auffüllungen (fehlend = mittlerer Rang) im Dezil oben / unten: 0 / 0.

**Gründe der Lücken — Zähler über alle Aufrufe der Maschine (Hauptlauf + Kontrollen), stderr des Laufs:**
`aufrufe 139.938, keineZeile 186, fehlt21 0, fehlt252 24, basisNichtPositiv 0, nichtEndlich 0, wert 139.728`.
Rechnerisch: 139.938 = 2 × 69.969 = zwei Durchgänge (Hauptlauf + Placebo Versatz) über 92 × 760,5 Symbol-Tage; die Zelle trägt im
Hauptlauf 69.945 Werte und **24 `null`** — exakt der Zähler `fehlt252`. Alle 24 Lücken des Hauptlaufs sind also **Reihen, denen die
252. Vorzeile fehlt** (das Universum verlangt 250 Vortage, die Formel braucht 252 — Reihen mit genau 250–251 Vortagen fallen in diese
Spalte). Die 186 `keineZeile` fallen damit rechnerisch in den Versatz-Durchgang (t + 21: Reihe endet vorher). Weder 21. Vorzeile
noch Basis ≤ 0 noch nicht endliche Werte kamen vor.

## 3. Nullpunkt (Kontrollen der Maschine; Urteil = Orakel + Placebo Symbole + Zufall + Klinke)

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite) | Dezil − Universum brutto **18,59 Pp**, sd 6,10, Mittel/sd 3,05, t 29,37, n 92; Long − Short **34,40 Pp** | ≥ 5 Pp horizontgleich, Mittel/sd ≥ 1, t ≥ 8; L-S ≥ 20 Pp. Nachrichtlich „20 Pp einseitig": verfehlt (18,59 < 20; bei einwandfreier Maschine erwartet, Vorregistrierung §9 (2)) | bestanden |
| Placebo Symbole (je Signaltag permutiert) | brutto 0,162 Pp, t 1,54, n 92 | \|t\| < 3; nachrichtlich \|Mittel\| < 0,25 Pp: ja | bestanden |
| Zufall × 12 | Mittel brutto −0,017, netto −0,009 Pp; \|t\| ≥ 3 in 0 von 12; se je Ziehung 0,110 Pp; MDE-Boden 0,309 Pp je Monat; Umschlag Zufallsdezil 90,3 % | \|Mittel\| < 0,25 Pp, ≤ 3 Ziehungen mit \|t\| ≥ 3 | bestanden |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße; Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1 (Soll je 1); Bilanzleser nicht benutzt (Panelfeld) | Positivkontrolle je 1, Leser 0 | bestanden |
| **Placebo Versatz +21 (nur Diagnose)** | brutto 0,921 Pp, t 1,78, n 92 | \|t\| < 3; nachrichtlich \|Mittel\| < 0,25 Pp: nein | bestanden, geht nicht ins Urteil |

**`nullpunkt.bestanden = true`** (auch `bestandenMitVersatz = true`). Placebo Versatz ≈ Einzelmessung (0,92 gegen 0,87 Pp brutto):
das Muster eines trägen Feldes (Vorregistrierung §9 (3)) — Momentum über 252 Zeilen ändert sich in 21 Tagen kaum. Berichtet, nicht
gedeutet. Der MDE-Boden 0,309 Pp ist die Auflösung eines Zufallsdezils; ein echtes Dezil streut stärker (§4: se 0,533, Faktor 4,8).

## 4. Einzelmessung (Diagnose, kein Urteil) — Dezil oben gegen Universum, Pp je Monat

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0,8655 | 0,5328 | 1,63 | 1,74 | 1,4927 | 92 |
| Dezil oben − Universum, **netto** | **0,8472** | 0,5328 | 1,60 | **1,70** | **1,4927** | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 1,2325 | 0,8445 | 1,47 | – | 2,3659 | 92 |
| Long − Short, netto | 1,2334 | 0,8444 | 1,47 | – | 2,3656 | 92 |

Satz: **0,85 Pp netto bei MDE₈₀ 1,49** (t_HH 1,70, unter der Schwelle 3 aus §9 (6)); die Messung liegt unter ihrer eigenen
Auflösung — nichts oberhalb von 1,49 Pp bei MDE₈₀ 1,49. Dezil unten − Universum brutto / netto: −0,367 / −0,386 Pp. Dezil oben /
unten im Mittel 76,5 / 75,6 Mitglieder. Tote im Dezil oben (Totalverlust) 44, Lücken 10. Signaltage unter 100 Mitgliedern: 0.
Regime (SPY über / unter EMA200), netto: 0,837 (n 75) / 0,891 (n 17) Pp.

**Umschlag** Dezil / Universum je Monat: **31,1 %** / 7,9 % (Erwartung §1b: 30–35 %, Teil 3: 32 %). **Kosten** Dezil / Universum:
0,0257 / 0,0075 Pp je Monat (Kassa-Hürde je Klasse × Umschlag); netto − brutto = −0,018 Pp.

### Jahresscheiben (Dezil oben − Universum; Kalenderjahr des Signaltags) — nur berichtet

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | 0,409 | 0,391 | 0,610 | 0,67 | 1,71 | |
| 2018 | 12 | 0,480 | 0,461 | 1,207 | 0,40 | 3,38 | |
| 2019 | 12 | 0,668 | 0,647 | 1,056 | 0,64 | 2,96 | |
| 2020 | 12 | 3,413 | 3,394 | 1,181 | 3,00 | 3,31 | Mittel ≈ MDE₈₀ |
| 2021 | 12 | 0,490 | 0,475 | 2,941 | 0,17 | 8,24 | breiteste Scheibe |
| 2022 | 12 | 0,687 | 0,672 | 1,399 | 0,50 | 3,92 | |
| 2023 | 12 | −0,232 | −0,253 | 0,781 | −0,34 | 2,19 | einzige negative |
| 2024 | 8 | 1,080 | 1,063 | 2,001 | 0,57 | 5,61 | dünn |

2020/2021 (Momentum-Einbruch der Literatur): 2020 trägt mit 3,39 Pp netto die größte Scheibe und liegt genau an ihrer MDE₈₀; 2021
zeigt den Einbruch nicht im Mittel (0,47 Pp), sondern in der Streuung (se 2,94 = das 2,5- bis 5-fache der übrigen Jahre, MDE₈₀
8,24). Keine Jahresscheibe außer 2020 erreicht ihre MDE₈₀. **Letzte 250 Tage** (Signaltag ≥ 2023-08-03): netto 0,504 Pp, se 1,358,
t 0,39, MDE₈₀ 3,81, n 12.

## 5. Kostenfrage (eine Zeile)

Umschlag 31,1 % × Kassa-Hürde = **0,0257 Pp je Monat** gegen Literatur ×½ = **0,5 Pp** (1 Pp Jegadeesh/Titman, halbiert nach
McLean/Pontiff): die Kosten sind rund ein Zwanzigstel der halbierten Literaturzahl; die Kostenfrage entscheidet bei diesem Feld nichts,
die Auflösung (MDE₈₀ 1,49 gegen 0,5 Pp erwartet) entscheidet alles.

## 6. Verteilung der Rohwerte und Fallstricke

Quantile der 69.945 Rohwerte des Hauptlaufs (Feldabfrage aus `zellen/momentum.json`, in Pp): min −97,1 · p1 −65,1 · p5 −40,5 ·
p10 −28,6 · p25 −10,7 · **Median 8,6** · p75 32,0 · p90 67,0 · p95 105,5 · p99 276,1 · max 21.872. 107 Werte (0,15 %) über
1.000 Pp bei 33 Symbolen (GME 10, MARA 8, RIOT 8, NIO 8, NVAX 8, TNDM 6, BLNK 6, SAVA 5, …). Nichts gekappt (§1a.7); der Rang
macht die Größe der Ausreißer für das Dezil unerheblich, für die Rohgröße in der Zelle nicht.

Fallstricke, gesehen, nicht repariert:

1. **`SN` 2024-06-03 / 2024-07-01 mit 20.212 / 21.872 Pp** (die zwei größten Werte). Die Formel verlangt 252 Vorzeilen, also Kurse
   ab ≈ Juni 2023; das heutige `SN` notiert erst seit Ende Juli 2023. Verdacht: die Panelreihe `SN` trägt vor dem Wechsel einen anderen
   Emittenten (Fehlerform „Kürzel wechseln den Besitzer" auf Panelebene). Für den PM zu prüfen — betrifft die Panel-Ebene, nicht diese
   Zelle; MARA/RIOT/GME/NVAX 2020–21 sind dagegen echte Vervielfacher.
2. **250 gegen 252:** das Universum lässt Reihen ab 250 Vortagen zu, die Formel braucht 252 → 24 `null` im Hauptlauf (0,03 %),
   ausschließlich aus diesem Grund. Kein Ersatzwert gesetzt; die Maschine gibt ihnen den mittleren Rang (Auffüllungen im Dezil: 0).
3. **Orakel „20 Pp einseitig" verfehlt (18,59)** — nachrichtlich, so in §9 (2) erwartet; die gültige Schranke (5 Pp + L-S 20 Pp) ist
   erfüllt und trifft den Eichwert der Kunstfelder (18,6 bei 92 Signaltagen).
4. **Placebo Versatz +21 ≈ Einzelmessung** (0,92 gegen 0,87 Pp): kein Fund, sondern die erwartete Persistenz eines 252-Zeilen-Feldes;
   nur Diagnose.
5. Alle Renditen der Maschine sind **Kursrenditen ohne Ausschüttungen** (Bericht, Kopf) — gilt für Dezil und Universum gleich.
6. Der Haltefensterwechsel des Auftrags (Eröffnung → Eröffnung statt Schluss → Schluss) ist Entscheid §9 (1), nicht Wahl der Zelle.

## 7. Laufzeit, RSS, Verbrauch

Lauf 2,7 s laut Maschine (Wand 2,9 s inkl. Start), RSS max 1.048 MB, Node v24.18.0, Aufruf exakt nach §1a.5 (ohne `--ziel`, `--aus`,
`--rueckhalte`). Verbrauch: siehe Übergabe (Pflichtzeile; Selbstschätzung, keine Abrechnungszahl verfügbar).

## 8. Was der PM entscheiden muss

- Ob der `SN`-Verdacht (Fallstrick 1) vor der Kombination auf Panelebene geprüft wird — die Zelle selbst bleibt unverändert.
- Ob die 250/252-Lücke (24 Fälle) als bekannt hingenommen wird (Auffüllung mittlerer Rang, kein Dezilmitglied) — Empfehlung: ja.
- Freigabe der Zelle für die Kombination (Runde 1b); Rückhaltefenster erst nach dem Urteil (§8 der Vorregistrierung).
