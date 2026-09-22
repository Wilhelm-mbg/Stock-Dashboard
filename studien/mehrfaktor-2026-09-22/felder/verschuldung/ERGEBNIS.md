# Feld `verschuldung` (Nr. 11) — Kontrollgröße: Zelle gebaut, Nullpunkt bestanden (22.09.2026, Agent Nr. 52)

**Kontrollgröße, kein Signal; Dezil oben = am stärksten verschuldete Mitglieder.** Gewichtet nichts (Vorregistrierung §5).
Maschine `zelle.js` (`mehrfaktor-2026-09-22/zelle/v1`), unverändert; Feldmodul `feld.js` in diesem Ordner; Zellendateien
`zellen/verschuldung.json`, `zellen/verschuldung-nullpunkt.json`, `zellen/verschuldung-bericht.md` — alle Zahlen unten aus
dem Bericht der Maschine, außer den als **beschreibend** markierten Tafeln (Modul-Zähler, außerhalb der Maschine
ausgewertet, keine zweite Messung).

**Formel (§4 Zeile 11, Fassung mit Nachtrag §11):** `(roh.vermoegen − roh.eigenkapital) / roh.vermoegen` aus dem jüngsten
Filing (`sicht.fundamentalAm(sym, sicht.iso)`, filed strikt vor t, Tor 456 Tage; Bestände D0). Verhältnis, höher = stärker
verschuldet; Werte > 1 (negatives Eigenkapital) sind echte Werte. `null` bei z < 0, fundamentalAm null, `roh.vermoegen`
fehlt/≤ 0, `roh.eigenkapital` fehlt — nie 0, nichts gekappt, Finanzwerte nicht ausgeschlossen (§1a.7, §1b).

**Lauf:** `node --max-old-space-size=6144 zelle.js --feld felder/verschuldung/feld.js`, ohne `--ziel/--aus/--rueckhalte`;
Node v24.18.0; Tafel 0,68 s, Lauf 4,7 s, RSS max 1.184 MB, 69.969 Bilanzzugriffe; 92 Signaltage 2017-01-03 … 2024-08-01,
Rückhaltefenster ab 2024-09-01 versiegelt (`rueckhalte: false`).

## 1. Abdeckung (Anteil des Universums mit Wert; Bericht §2)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 81.8 % (5410/6615) | 90.5 % (1160/1282) | 93.4 % (142/152) | 83.4 % (6712/8049) |
| 2018 | 82.5 % (5608/6797) | 89.9 % (1328/1478) | 93.1 % (202/217) | 84.1 % (7138/8492) |
| 2019 | 83.3 % (5513/6615) | 92.0 % (1354/1471) | 93.3 % (222/238) | 85.2 % (7089/8324) |
| 2020 | 82.9 % (5607/6766) | 91.3 % (1762/1930) | 91.2 % (332/364) | 85.0 % (7701/9060) |
| 2021 | 81.6 % (5897/7231) | 90.0 % (2194/2437) | 87.4 % (444/508) | 83.9 % (8535/10176) |
| 2022 | 82.2 % (5846/7111) | 92.2 % (2461/2670) | 90.6 % (472/521) | 85.2 % (8779/10302) |
| 2023 | 84.0 % (5721/6807) | 93.5 % (2001/2140) | 91.6 % (274/299) | 86.5 % (7996/9246) |
| 2024 | 84.4 % (3780/4477) | 92.3 % (1457/1578) | 93.2 % (247/265) | 86.8 % (5484/6320) |
| **alle** | 82.8 % | 91.5 % | 91.1 % | 84.9 % |

Universum je Signaltag 760,5, davon mit Wert 646,0 (Bericht). Erwartet ≈ 81–94 % je Klasse (Auftrag §1): alle drei
Klassen innerhalb.

**Gründe für `null` — Modul-Zähler über alle Aufrufe der Maschine (Hauptlauf + Kontrollen), beschreibend.** 139.938
Aufrufe = 2 × 69.969 (Hauptlauf und Placebo Versatz). Davon `null` 21.187: kein Filing / Tor 456 Tage / keine CIK (über
`sicht` nicht unterscheidbar) **20.321 (95,9 %)**, Filing ohne Vermögen 574 (2,7 %), Filing ohne Eigenkapital 106 (0,5 %),
keine Panelzeile 186 (0,9 %); Vermögen ≤ 0: 0. Im Hauptlauf allein 10.535 `null` von 69.969 (15,1 %; `lauf.werteNull`).

## 2. Nullpunkt (Bericht §3; Schranken aus `konfig.js` des Prüfstands)

| Kontrolle | Ergebnis | Urteil |
|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp (Schranke ≥ 5 Pp, Mittel/sd ≥ 1, t ≥ 8, L-S ≥ 20 Pp; nachrichtlich 20 Pp einseitig: verfehlt) | bestanden |
| Placebo Symbole (je Signaltag permutiert) | brutto −0.2614 Pp, t −2.05, n 92 (\|t\| < 3; \|Mittel\| < 0.25: **nein**, nachrichtlich) | bestanden |
| Zufall × 12 | Mittel brutto −0.0168, netto+Kosten −0.0093 Pp; \|t\| ≥ 3 in 0 Ziehungen; se je Ziehung 0.1104 Pp; MDE-Boden 0.3094 Pp | bestanden |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße; Positivkontrolle 2017-01-03: Kurs 1, Bilanz 1; Leser 69.969 Zugriffe, 0 mit filed ≥ tag | bestanden |
| Placebo Versatz +21 Handelstage — **nur Diagnose** (Entscheid §9 (3)) | brutto 0.4227 Pp, t 2.66, n 92 (\|t\| < 3; \|Mittel\| < 0.25: nein, nachrichtlich) | bestanden (nicht im Urteil) |

**`nullpunkt.bestanden`: bestanden** (Orakel, Placebo Symbole, Zufall, Klinke); `bestandenMitVersatz` ebenfalls. Orakel
und Zufall hängen nicht vom Feld ab (identisch mit Größe und Kunstfeld). Das Placebo Versatz (0,42 Pp) ist ≈ die
Einzelmessung (0,42 Pp): das Feld ist träge (Persistenz der Bilanzstruktur), wie §9 (3) für träge Felder vorhersagt.
Das Placebo Symbole verfehlt die nachrichtliche Betragsschranke 0,25 Pp (−0,26 Pp, t −2,05) — ausgewiesen, nicht gedeutet.

## 3. Einzelmessung (Diagnose, kein Urteil; Bericht §1)

| Reihe | Mittel Pp | se | t | t_HH | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.4279 | 0.1571 | 2.74 | 3.13 | 0.4403 | 92 |
| Dezil oben − Universum, **netto** | 0.4249 | 0.1572 | 2.72 | 3.11 | 0.4403 | 92 |
| Long − Short, netto (verlangt Leihe) | 0.4771 | 0.4277 | 1.12 | – | 1.1983 | 92 |

**Dezil oben (die am stärksten verschuldeten Mitglieder) − Universum: +0,4249 Pp netto bei MDE₈₀ 0,4403** (t 2,72,
t_HH 3,11). Kontrollgröße, kein Signal — die Zahl ist der Kontrollwert, den die Kombination als Rang mitführt, kein Urteil;
die Literatur (Campbell/Hilscher/Szilagyi 2008) erwartet für Notlage ein negatives Vorzeichen, gemessen wird hier
Bilanzhebel, nicht Notlage. Dezil unten − Universum −0,0521 Pp netto. Dezil oben 65,1 / unten 64,2 Mitglieder (= 10 % der
Ausweiser); Auffüllungen im Dezil oben / unten 0 / 0; Tote im Dezil oben 18 (1 Totalverlust), Lücken 6; kein Signaltag
übersprungen. Umschlag Dezil 11,7 % je Monat (Universum 7,9 %), Kosten 0,0105 Pp je Monat (Universum 0,0075). Regime:
SPY über EMA200 +0,3806 Pp (n 75), darunter +0,6205 Pp (n 17).

Jahresscheiben netto (Dezil oben − Universum, Pp; se; MDE₈₀): 2017 +0,5245 (0,4454; 1,2478) · 2018 +0,2993 (0,4505;
1,2620) · 2019 +0,4129 (0,3086; 0,8646) · 2020 +0,4335 (0,5545; 1,5534) · 2021 +0,7309 (0,5359; 1,5014) · 2022 −0,1981
(0,4468; 1,2517) · 2023 +0,4987 (0,4272; 1,1969) · 2024 (8 Monate, dünn) +0,8338 (0,2942; 0,8242). Sieben von acht
Jahresscheiben positiv, jede einzelne unter ihrer MDE₈₀. Letzte 250 Tage: netto +0,8236 Pp bei MDE₈₀ 0,7877 (t 3,06, n 12).

**Umschlag × Hürde gegen Literatur ×½:** 0,0105 Pp je Monat Kosten gegen eine Literaturzahl, die §4 nicht beziffert
(Vorzeichen negativ) — Kostenfrage stellt sich für eine Kontrollgröße nicht.

## 4. Beschreibende Tafeln aus den Modul-Zählern (außerhalb der Maschine; Signaltage der Zelle, je (Tag, Symbol) einmal)

Gegenprobe: alle 59.434 Werte der Zelle sind mit der Aufzeichnung des Moduls identisch (0 Abweichungen, 0 fehlend); die
Maschine ruft `werte` je Signaltag für ≈ 12 weitere Symbole (1.072 gesamt), die nicht in der Zelle stehen — Verhalten der
Maschine, kein Widerspruch.

**Quantile der Rohwerte:**

| Reihe | n | min | p1 | p5 | p10 | p25 | p50 | p75 | p90 | p95 | p99 | max |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| alle Signaltage | 59434 | 0.0000 | 0.1324 | 0.2697 | 0.3675 | 0.5085 | 0.6609 | 0.8071 | 0.9251 | 1.0004 | 1.3232 | 4.4710 |

Jahresmediane 0,648 (2018, 2024) … 0,678 (2020); p95 0,985 (2017) → 1,032 (2023); p99 1,27 → 1,47 (2024).

**Negatives Eigenkapital (Wert > 1) je Jahr, unter den Ausweisern** — echte Werte, nicht gekappt:

| Jahr | Ausweiser | Wert > 1 | Anteil | Wert = 1 (Eigenkapital 0) |
|---|---|---|---|---|
| 2017 | 6712 | 258 | 3.8 % | 0 |
| 2018 | 7138 | 318 | 4.5 % | 0 |
| 2019 | 7089 | 340 | 4.8 % | 0 |
| 2020 | 7701 | 385 | 5.0 % | 0 |
| 2021 | 8535 | 395 | 4.6 % | 0 |
| 2022 | 8779 | 509 | 5.8 % | 0 |
| 2023 | 7996 | 471 | 5.9 % | 0 |
| 2024 | 5484 | 307 | 5.6 % | 0 |

Gesamt 2.983 von 59.434 (5,0 %), davon Finanzwerte SIC 6000–6799 nur 113. Werte > 2 (Eigenkapital unter −Vermögen): 179
Einträge, YUM 90, DPZ 65, WING 14, NXT 3, BBIO 3, HMNY 2, NVAX 1, VRSN 1 — Rekapitalisierungen mit Schuldenrückkauf, echt.
Größter Wert DPZ 4,471 (2018-05). Kleinste: SW 0,0000 (2024-07/08 — Eigenkapital exakt gleich Vermögen, Tafel-Fallstrick,
siehe §5), MARA 2021 0,004–0,006.

**Anteil je `marken.eigenkapitalFallback`** (Code = Prioritätsindex der Tag-Liste; per Haiku-Unteragent aus `bauen.js`
Z. 173/232 bestätigt):

| Code | Tag | Anzahl | Anteil |
|---|---|---|---|
| 0 | StockholdersEquity | 54 992 | 92.5 % |
| 1 | StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest | 4 200 | 7.1 % |
| 2 | PartnersCapital | 227 | 0.4 % |
| 3 | MembersEquity | 15 | 0.0 % |

Je Jahr: Code 0 91,0 % (2017) → 93,3 % (2024). Über alle 139.938 Aufrufe: 109.871 / 8.400 / 450 / 30. Code 1 (mit
Minderheiten) hebt das Eigenkapital an und senkt die Verschuldung leicht — 7 % der Einträge, nicht korrigiert.

**Klassen- und Sektormix des Dezils oben** (Dezil nach der Rangregel der Maschine nachgebaut — nur Beschreibung;
Dezilgröße Mittel 65,1 = Maschine 65,1, min 53, max 81):

| | Ausweiser gesamt | Dezil oben |
|---|---|---|
| Klasse 50-250 / 250-1000 / ab1000 | 73.0 / 23.1 / 3.9 % | 74.7 / 23.1 / 2.2 % |
| Dienstleistungen | 17.8 % | 24.7 % |
| Verarbeitendes Gewerbe | 37.1 % | 24.0 % |
| Finanzen/Immobilien | 17.5 % | 21.9 % |
| Einzelhandel | 8.5 % | 15.8 % |
| Transport/Versorger/Kommunikation | 11.8 % | 7.5 % |
| Großhandel | 1.8 % | 4.9 % |
| Bergbau/Öl | 4.3 % | 1.3 % |
| Bau / Landwirtschaft / ohne Sektor | 1.1 / 0.1 / 0.0 % | 0 / 0 / 0 % |

**Finanzwerte SIC 6000–6799:** 17,5 % aller Ausweiser, **21,9 % des Dezils oben** (je Signaltag 10,9–31,6 %, Mittel 22,1 %;
Ausweiser-Mittel 17,4 %) — überrepräsentiert, aber nicht dominant; das Dezil oben ist vor allem Dienstleistungen,
Einzelhandel und Restaurant-/Konsum-Rekapitalisierer. Nicht ausgeschlossen (§1b).

**Alter des Filings am Signaltag** (Tage seit filed): p10 7, p25 27, p50 51, p75 68, p90 89, p99 103, max 449; über 180
Tage 18, über 365 Tage 2 — das Tor 456 greift praktisch nie.

## 5. Fallstricke der Tafel

1. **SW (Smurfit WestRock) 2024-07/08: Verschuldung exakt 0,0000** — `roh.eigenkapital` = `roh.vermoegen` im Filing des
   neuen Registranten; im Feld Größe hat dieselbe Zeile eine winzige Aktienzahl (≈ 4.000 $ „Marktwert"). Verdacht auf ein
   Vorlage-/Platzhalter-Filing des Neu-Registranten; 2 Einträge, nicht angefasst.
2. **Minderheiten-Fallback** (Code 1, 7,1 %): Eigenkapital inkl. Minderheiten ⇒ Verschuldung etwas kleiner als nach
   `StockholdersEquity`; systematisch, klein, ausgewiesen.
3. **Die Maschine schreibt keine Dezil-Mitgliederliste**; Klassen-/Sektormix (§1b) musste außerhalb nachgebaut werden —
   Hinweis an den PM (Feld `mitglieder` je Dezil in der Zelle), keine Änderung der Maschine.
4. `null`-Grund „kein Filing / Tor / keine CIK" ist über `sicht.fundamentalAm` nicht trennbar; 95,9 % aller `null` sitzen
   dort (20-F/40-F-Filer, Reihen ohne CIK).
5. Kein Kurs beteiligt: die Fehlerform „Geteilter Kurs" kann hier nicht auftreten; Splits sind für dieses Feld ohne Belang.

## 6. Laufzeit, RSS, Verbrauch

Tafel 0,68 s, Lauf 4,7 s, RSS max 1.184 MB (Vorgabe 4–6 s, ≈ 1,2 GB). Verbrauch: siehe Übergabe
`uebergabe/mehrfaktor-feld-groesse-2026-09-22.md` (eine Datei für beide Zellen).

*Simulation mit virtuellem Kapital, keine Anlageberatung.*
