# Ergebnis — Querschnitts-Prüfstand, **Teil 4**: „Gedrückt, aber liefert" (18.09.2026)

Vorregistriert in `VORREGISTRIERUNG-TEIL4.md` (Commit vor jeder Zahl). Kennung `querschnitt-pruefstand-2026-09-13/teil4/v1`, Panel `querschnitt-pruefstand-2026-09-13/panel/v1` (9899585 Zeilen, 7300 Reihen, bis 2026-09-11), Fundamentaltafel `fundamentaltafel-2026-09-16/v1` (158516 Filings, 5168 CIKs, Aktualitäts-Tor 456 Tage). Universum Klassen 50-250 / 250-1000 / ab1000, monatliche Signaltage 2016-12-30 … 2026-08-31 (117 Monate), Ausführung Eröffnung t+1. Lauf 2026-09-17 23:12, 11 s. Alles Simulation mit virtuellem Kapital, Kursrenditen ohne Ausschüttungen. **Keine Anlageberatung.**

## 0. Urteil

**Test 1 (A∧B gegen A∧¬B, 120 Handelstage, gepaart je Monat): nicht belegt: nichts oberhalb von 3.32 Pp je 120 Tage (gemessen -0.84 Pp, t -0.71).**

| Regel §T4.6 | Wert | erfüllt |
|---|---:|---|
| Δ̄ netto ≥ MDE₈₀ | −0,836 Pp gegen MDE₈₀ 3,317 (Bonf 3,651) | nein |
| t_HH ≥ z_Bonf(2) = 2.2414 | t −0,71 (se HH 1,184, naiv 0,581) | nein |
| letzte 250 Tage nicht negativ | −2,334 Pp über 6 Monate (ab 2025-09-12) | nein |
| Vorhersage ≥ +2,0 Pp | −0,836 Pp | nein |
| Tore (Leck-Klinken, Placebo, Orakel, Vorprüfung) | Maschine bestanden, Auswahl bestanden, Leser bestanden, Placebo bestanden, Orakel bestanden, Vorprüfung bestanden | alle |

95-%-Intervall der Paardifferenz (HH): −3,16 … **1,48 Pp** je 120 Tage. Die aus der Literatur erwarteten 3–6 Pp liegen **oberhalb der oberen Grenze** — für gedrückte liquide US-Aktien 2017–2026 ist Fundamental-Momentum in dieser Größe ausgeschlossen, nicht nur unbelegt. Das Vorzeichen ist negativ: A∧B lief 0,84 Pp schlechter als A∧¬B (nicht signifikant).

Kein Zielportfolio (Entscheid 16.09.). Kandidatenliste `kandidaten-teil4/`: nicht geschrieben (Test 1 nicht belegt). Test 2 ist Eichung ohne Urteil (§2).

## 1. Vorprüfung des PM — reproduziert vor der ersten Ergebniszahl (§T4.8)

| Größe | PM (16.09.) | gemessen | Faktor | Grenze 1,5 |
|---|---:|---:|---:|---|
| A je Monat / Universum je Monat | 324 / 783 (41,4 %) | 324,2 / 782,6 (41,4 %) über 117 Monate | 1,001 | innerhalb |
| Paar-sd Zufallshalbierung, 120 Handelstage | 3,22 Pp | 2,95 Pp (n 111, Mittel −0,056) | 0,917 | innerhalb |
| MDE₈₀ (Faktor des PM 3.3393) naiv / überlappt ×√6 / HH gemessen, 120 Handelstage | 1 / 2.4 Pp | 0,94 / 2,29 / 1,00 Pp | — | nachrichtlich |
| Paar-sd Zufallshalbierung, 250 Handelstage | 6,80 Pp | 6,89 Pp (n 105, Mittel −0,434) | 1,013 | innerhalb |
| MDE₈₀ (Faktor des PM 3.3393) naiv / überlappt ×√12 / HH gemessen, 250 Handelstage | 2.1 / 7.3 Pp | 2,25 / 7,78 / 2,52 Pp | — | nachrichtlich |

Vorprüfung **bestanden**. Die HH-Spalte zeigt, was die Überlappung tatsächlich kostet: der Aufschlag ×√H des PM war eine Obergrenze (Marktfaktor fällt in der Paardifferenz heraus).

## 2. Test 1 — A∧B gegen A∧¬B, 120 Handelstage (das Urteil)

Seiten je Monat: AB 120,2 Werte, A¬B 141,2 (A gesamt 324,2, davon ohne Fundament 53,9 = 17,3 %); 111 vollständige Monate, 6 unvollständig am Ende, 0 zu klein. Brutto je Seite: AB 3,973 Pp, A¬B 4,809 Pp je 120 Tage; Kosten je Umlauf AB 0,0797, A¬B 0,0798 Pp; Tote je Monat AB 1,14, A¬B 1,72.

| Reihe  n | Δ (Pp) | se naiv | se HH | HH/naiv | t | MDE₈₀ | MDE₈₀,Bonf |
|---:|---:|---:|---:|---:|---:|---:|---:|
| Δ netto (Hauptmaß) | 111 | −0,836 | 0,581 | 1,184 | 2,04 | −0,71 | 3,317 | 3,651 |
| Δ brutto | 111 | −0,836 | 0,581 | 1,184 | 2,04 | −0,71 | 3,317 | 3,650 |
| letzte 250 Tage (netto, ab 2025-09-12) | 6 | −2,334 | 0,959 | — (n zu klein, Block) | — | — | — | — |

HH = Hansen-Hodrick, Rechteck über die Lags 1…5 auf dem Kalendermonat-Index; MDE₈₀ = 2,8016 · se_HH, MDE₈₀,Bonf = 3,0830 · se_HH (z_Bonf(2) + z₀,₈₀). Vorhersage war ≥ +2 Pp je 120 Tage.

**Jahresscheiben (Kalenderjahr des Ausführungstags):**

| Jahr | n | Δ netto (Pp) | Summe | se HH | t | MDE₈₀ | Marke |
|---|---:|---:|---:|---:|---:|---:|---|
| 2017 | 12 | −2,754 | −33,1 | 0,762 | −3,61 | 2,135 |  |
| 2018 | 12 | −0,168 | −2,0 | 0,225 | −0,74 | 0,632 |  |
| 2019 | 12 | 2,477 | 29,7 | 1,890 | 1,31 | 5,294 |  |
| 2020 | 12 | −8,343 | −100,1 | 5,012 | −1,66 | 14,042 |  |
| 2021 | 12 | −0,307 | −3,7 | 1,172 | −0,26 | 3,284 |  |
| 2022 | 12 | −1,339 | −16,1 | 1,426 | −0,94 | 3,994 |  |
| 2023 | 12 | −0,946 | −11,3 | 1,776 | −0,53 | 4,974 |  |
| 2024 | 12 | 2,338 | 28,1 | 1,052 | 2,22 | 2,948 |  |
| 2025 | 12 | 1,912 | 22,9 | 0,774 | 2,47 | 2,170 |  |
| 2026 | 3 | −2,430 | −7,3 | — | — | — | dünn |

**Klassenmix je Monat (50-250 / 250-1000 / ab1000):** Universum 562 / 185 / 35, AB 90,2 / 30,0 / 4,2, A¬B 107,1 / 34,2 / 4,6.

**Sektorsicht (nachrichtlich; Monat zählt im Sektor nur mit ≥ 5 je Seite):**

| Sektor (SIC-Division) | Monate | AB / A¬B je Monat | Δ netto (Pp) | se HH | t | MDE₈₀ | Marke |
|---|---:|---:|---:|---:|---:|---:|---|
| Bergbau/Oel | 37 (74 zu klein) | 11,1 / 10,2 | −3,387 | 2,609 | −1,30 | 7,310 |  |
| Dienstleistungen | 103 (8 zu klein) | 24,0 / 22,3 | −0,255 | 1,164 | −0,22 | 3,260 |  |
| Einzelhandel | 67 (44 zu klein) | 10,4 / 12,4 | 4,261 | 2,531 | 1,68 | 7,091 |  |
| Finanzen/Immobilien | 111 (0 zu klein) | 21,3 / 24,8 | −0,839 | 1,304 | −0,64 | 3,655 |  |
| Transport/Versorger/Kommunikation | 99 (12 zu klein) | 15,9 / 18,8 | −2,266 | 2,162 | −1,05 | 6,058 |  |
| Verarbeitendes Gewerbe | 111 (0 zu klein) | 43,2 / 54,4 | 0,257 | 1,368 | 0,19 | 3,833 |  |

## 3. Test 2 — B-Quintil gegen den Pool mit Fundament, 120 Handelstage (Eichung, kein Tor)

Pool je Monat 635 Werte mit Fundament, Quintil k = 126,7; 111 Monate. Brutto: Q5 6,777 Pp, Pool 5,602 Pp je 120 Tage; Kosten je Umlauf Q5 0,0779, Pool 0,0786 Pp.

| Reihe  n | Δ (Pp) | se naiv | se HH | HH/naiv | t | MDE₈₀ | MDE₈₀,Bonf |
|---:|---:|---:|---:|---:|---:|---:|---:|
| Q5 − Pool netto (Hauptmaß) | 111 | 1,176 | 0,443 | 0,822 | 1,86 | 1,43 | 2,302 | 2,533 |
| Q5 − Pool brutto | 111 | 1,175 | 0,443 | 0,822 | 1,86 | 1,43 | 2,302 | 2,533 |
| Q1 − Pool netto (nachrichtlich) | 111 | 0,767 | 0,477 | 1,116 | 2,34 | 0,69 | 3,127 | 3,441 |
| Q5 − Q1 brutto (Long-Short, nachrichtlich) | 111 | 0,407 | 0,701 | 1,415 | 2,02 | 0,29 | 3,963 | 4,361 |
| Q5 − Q1 netto (beide Umläufe) | 111 | 0,251 | 0,701 | 1,415 | 2,02 | 0,18 | 3,963 | 4,362 |
| letzte 250 Tage (Q5 − Pool netto) | 6 | 3,017 | 2,487 | — (n zu klein, Block) | — | — | — | — |

Literatur (Novy-Marx 2015): Fundamental-Momentum ≈ 0,5–1 Pp je Monat in der Long-Short-Fassung, also ≈ 3–6 Pp je 120 Tage; Q5 − Pool ist davon etwa die Hälfte. Erwartung: positiv.

**Jahresscheiben Q5 − Pool netto:**

| Jahr | n | Δ netto (Pp) | Summe | se HH | t | MDE₈₀ | Marke |
|---|---:|---:|---:|---:|---:|---:|---|
| 2017 | 12 | 0,852 | 10,2 | 0,205 | 4,16 | 0,574 |  |
| 2018 | 12 | −0,255 | −3,1 | 1,211 | −0,21 | 3,392 |  |
| 2019 | 12 | 2,353 | 28,2 | 2,004 | 1,17 | 5,614 |  |
| 2020 | 12 | 1,675 | 20,1 | 2,180 | 0,77 | 6,106 |  |
| 2021 | 12 | −3,087 | −37,0 | 1,205 | −2,56 | 3,377 |  |
| 2022 | 12 | −0,900 | −10,8 | 0,585 | −1,54 | 1,639 |  |
| 2023 | 12 | 2,082 | 25,0 | 1,805 | 1,15 | 5,056 | Block-se |
| 2024 | 12 | 2,691 | 32,3 | 0,955 | 2,82 | 2,677 |  |
| 2025 | 12 | 3,962 | 47,5 | 1,701 | 2,33 | 4,765 |  |
| 2026 | 3 | 5,995 | 18,0 | — | — | — | dünn |

## 4. Nachrichtlich: 250 Handelstage (HH-Lags 1…11)

| Reihe  n | Δ (Pp) | se naiv | se HH | HH/naiv | t | MDE₈₀ | MDE₈₀,Bonf |
|---:|---:|---:|---:|---:|---:|---:|---:|
| Test 1 Δ netto | 105 | −1,357 | 1,040 | 1,142 | 1,10 | −1,19 | 3,198 | 3,519 |
| Test 1 Δ brutto | 105 | −1,357 | 1,040 | 1,141 | 1,10 | −1,19 | 3,198 | 3,519 |
| Test 1 letzte 250 Tage | 0 | — | — | — | — | — | — | — |
| Test 2 Q5 − Pool netto | 105 | 1,731 | 0,884 | 2,111 | 2,39 | 0,82 | 5,914 | 6,508 |
| Test 2 Q1 − Pool netto | 105 | 1,820 | 0,783 | 1,550 | 1,98 | 1,17 | 4,343 | 4,779 |
| Test 2 Q5 − Q1 brutto | 105 | −0,089 | 1,358 | 2,683 | 1,98 | −0,03 | 7,517 | 8,272 |

105 vollständige Monate (Test 1), 12 unvollständig. Jahresscheiben Test 1, 250 Tage: 2017 −7,08 (n 12, MDE 3,16); 2018 −4,13 (n 12, MDE 2,82); 2019 9,30 (n 12, MDE 0,00); 2020 −13,34 (n 12, MDE 11,20); 2021 −0,76 (n 12, MDE 4,93); 2022 0,28 (n 12, MDE 5,04); 2023 −1,18 (n 12, MDE 0,00); 2024 4,72 (n 12, MDE 3,15); 2025 0,42 (n 9, MDE 0,00).

## 5. Kontrollen (§T4.7)

**Placebo** (B je Monat unter den A-Mitgliedern mit Fundament permutiert, 12 Ziehungen, Soll 0): Mittel brutto −0,240 Pp, netto −0,240 Pp (Schranke 0,5 Pp; se einer Ziehung 0,301, se des Mittels 0,087); Ziehungen mit |t_HH| ≥ 3: 0 von höchstens 3 ⇒ bestanden.

| Ziehung | n | brutto | netto | se HH | t HH | t naiv |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 111 | −0,343 | −0,343 | 0,329 | −1,04 | −1,03 |
| 1 | 111 | −0,374 | −0,374 | 0,263 | −1,42 | −1,18 |
| 2 | 111 | −0,292 | −0,292 | 0,293 | −1,00 | −0,96 |
| 3 | 111 | −0,119 | −0,119 | 0,335 | −0,36 | −0,32 |
| 4 | 111 | −0,210 | −0,210 | 0,274 | −0,77 | −0,58 |
| 5 | 111 | −0,372 | −0,372 | 0,330 | −1,13 | −1,14 |
| 6 | 111 | −0,523 | −0,522 | 0,289 | −1,81 | −1,70 |
| 7 | 111 | 0,512 | 0,512 | 0,348 | 1,47 | 1,69 |
| 8 | 111 | −0,559 | −0,559 | 0,243 | −2,30 | −1,70 |
| 9 | 111 | −0,092 | −0,092 | 0,262 | −0,35 | −0,33 |
| 10 | 111 | −0,126 | −0,127 | 0,400 | −0,32 | −0,40 |
| 11 | 111 | −0,377 | −0,377 | 0,246 | −1,53 | −1,13 |

**Auffälligkeit und Diagnose (nachrichtlich, `diagnose-placebo-teil4.js`):** 11 von 12 registrierten Ziehungen negativ, Mittel −0,240 Pp = 2,8 se des Mittels — nach Regel bestanden, aber zu prüfen: Bias der Maschine oder Zufall/Schiefe? 60 weitere Ziehungen mit anderer Saatfamilie: Mittel **0,060 Pp** (se 0,033, t 1,84), Median 0,066, negativ 43 %, Spanne −0,427 … 0,617; alle 72 Ziehungen zusammen 0,010 Pp. **Kein Bias** — die erste Saatfamilie war ein Zufall auf dem 1-%-Niveau. Größte Einzelrenditen unter A je Monat (Schiefe-Quelle, ±7,5 Pp je Monatsdifferenz): 2021-03 GE +674 %, 2025-12 AAOI +624 %, 2025-04 IREN +596 %, 2020-04 PENN +513 %, 2020-03 W +426 %.

**Orakel** (B ersetzt durch das Vorzeichen der künftigen 120-Tage-Rendite je A-Mitglied, Sicht mit Schlüssel; Gewinner 172,7 / Verlierer 142,5 je Monat, 110 Monate): Gewinner − Verlierer brutto **37,97 Pp** (sd 8,69, Mittel/sd 4,37, t_HH 18,37), netto 37,97 Pp; Schranken ≥ 20 Pp, ≥ 1, t ≥ 8 ⇒ bestanden.

**Leck-Klinke des Prüfstands:** Maschine `leckProbe` 90595 Verstöße (ungültig true) / `sauberProbe` 0 ⇒ bestanden. Eigene A/B-Auswahl ohne Schlüssel: 0 Verstöße über alle Monate; präparierte Fassung (liest t+1) am 2016-12-30: 626 Verstöße, ungültig true ⇒ bestanden.

**Leck-Klinke des Lesers:** präpariertes Filing `filed = 2024-05-06` wirft, `filed = tag − 1` liefert; Protokoll des Laufs 92191 Zugriffe, 0 mit `filed ≥ tag` (geliefert 78887, ohne Filing 13175, veraltet 19, ohne Reihe 110) ⇒ bestanden.

## 6. Anteil „ohne Fundament" je Jahr und Klasse (weder B noch ¬B)

| Jahr | Monate | Universum gesamt | 50-250 | 250-1000 | ab1000 | A gesamt | schwache CIK-Zuordnung in A |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2017 | 12 | 22,5 % | 24,1 % | 16,0 % | 6,6 % | 21,6 % | 6,7 % |
| 2018 | 12 | 18,0 % | 19,5 % | 12,9 % | 7,0 % | 18,4 % | 7,1 % |
| 2019 | 12 | 16,8 % | 18,4 % | 11,2 % | 7,6 % | 19,3 % | 7,7 % |
| 2020 | 12 | 17,4 % | 18,7 % | 13,9 % | 10,7 % | 17,6 % | 5,0 % |
| 2021 | 12 | 18,1 % | 20,1 % | 13,0 % | 14,0 % | 20,5 % | 4,3 % |
| 2022 | 12 | 17,3 % | 20,2 % | 10,5 % | 13,2 % | 18,8 % | 3,0 % |
| 2023 | 12 | 15,6 % | 18,2 % | 8,5 % | 9,3 % | 13,2 % | 2,0 % |
| 2024 | 12 | 14,9 % | 17,5 % | 8,6 % | 10,4 % | 16,0 % | 1,2 % |
| 2025 | 12 | 16,1 % | 19,6 % | 9,4 % | 10,8 % | 13,6 % | 1,1 % |
| 2026 | 9 | 15,3 % | 19,7 % | 8,5 % | 9,6 % | 11,7 % | 0,1 % |

Über alle Monate: Universum 17,2 % ohne Fundament, A 17,3 %. Darin stecken die 20-F/40-F-Filer (5–12 % der liquiden Klassen), Reihen ohne CIK, Filings jenseits des Aktualitäts-Tors (456 Tage) und Zeilen ohne vollständige 4Q-Summen.

## 7. Was die Tafel nicht weiß (§T4.9)

- **Dividenden:** alle Reihen sind Kursrenditen ohne Ausschüttung (Teil 2: Universum 1,73 % je Jahr, Momentum-Dezil 0,83 %, Lücke −0,0744 Pp je Monat, gemessen). Für A∧B gegen A∧¬B ist die Lücke nicht gemessen (kein Archivzugriff); beide Seiten sind gedrückte Werte desselben Pools, Größenordnung nach Teil 2 ≤ 0,1 Pp je Monat (≤ 0,6 Pp je 120 Tage), Richtung offen.
- **20-F/40-F-Filer** (4.931 Filings nur gezählt) fehlen: in den liquiden Klassen 5–12 % der aktiven Reihen je Jahr — sie stehen in „ohne Fundament" (§6), nie in ¬B.
- **8-K-Vorabmeldungen:** die Quartalszahl ist meist Wochen vor dem 10-Q bekannt (10-Q Median 37 Tage nach Stichtag); die Tafel nimmt das spätere `filed` — konservativ: das Signal kommt nie zu früh, oft zu spät.
- **2016** im Vorlauf dünner (Quartalswerte vor 2014 fehlen; 2014–2015 wurden deshalb geladen); **Neudarstellungen** (251.233) nicht übernommen, erste Veröffentlichung gilt; **2026q3 fehlt** (Filings seit 01.07.2026) — betrifft nur Signaltage ohne vollständiges 120-Tage-Fenster.
- **Schwache CIK-Zuordnungen** (1.003 Reihen) wurden verwendet und gezählt (§6, letzte Spalte), nicht ausgeschlossen.

## 8. Befund am Panel (gefunden über die Placebo-Diagnose, nicht repariert): unbereinigte Reverse-Splits und Kürzel-Wechsel

Die Placebo-Diagnose zeigte als größte Einzelrendite unter A **GE +674 % (Fenster 2021-03)** — GE hat am 02.08.2021 einen Reverse-Split 1:8. Panelzeilen: 2021-07-30 roh 12,97 Faktor 1,0000 Rendite −2,5 %; 2021-08-02 roh 100,60 Faktor 1,0000 Rendite 675,6 % (Marke MASSNAHME_NAH gesetzt, Faktor 1). Ebenso XRX 1:4 am 15.06.2017: 2017-06-14 roh 6,94 Faktor 1,0000 Rendite −1,0 %; 2017-06-15 roh 27,79 Faktor 1,0000 Rendite 300,4 %. **Vorwärts-Splits sind bereinigt:** AAPL 4:1 2020-08-28 roh 499,23 Faktor 4,0000 Rendite −0,2 %; 2020-08-31 roh 128,85 Faktor 1,0000 Rendite 3,2 %; 2020-09-01 roh 134,20 Faktor 1,0000 Rendite 4,2 %; NVDA 10:1 2024-06-07 roh 1208,88 Faktor 10,0000 Rendite −0,0 %; 2024-06-10 roh 121,65 Faktor 1,0000 Rendite 0,6 %; 2024-06-11 roh 120,89 Faktor 1,0000 Rendite −0,6 %.

Sprungtage in den Klassen 50-250/250-1000/ab1000 (Tagesrendite ≥ +100 % oder ≤ −60 %): **44** über 2016–2026 (je Jahr 2016 3, 2017 2, 2018 2, 2019 3, 2020 8, 2021 13, 2022 2, 2023 3, 2024 2, 2025 2, 2026 4), davon 6 mit Maßnahmen-Marke und 3 mit Faktor ≠ 1. Darunter echte Tage (GME 2021-01-27 +138 %, VKTX, CAR, CDTX) **und** unbereinigte Kapitalmaßnahmen bzw. Kürzel-Wiederverwendungen — die größten 20:

| Tag | Kürzel | Klasse | Rendite | Faktor | Marken | Maßnahme nah |
|---|---|---:|---:|---:|---:|---|
| 2025-08-29 | BBBY | 50-250 | 12030,5 % | 1,0000 | 5 |  |
| 2021-08-02 | GE | 250-1000 | 675,6 % | 1,0000 | 13 | ja |
| 2023-08-24 | AMC | 50-250 | 633,2 % | 1,0000 | 13 | ja |
| 2020-01-27 | OVV | 50-250 | 358,6 % | 1,0000 | 7 |  |
| 2021-01-27 | AMC | 50-250 | 296,6 % | 1,0000 | 5 |  |
| 2016-07-01 | HRI | 50-250 | 198,6 % | 1,0000 | 69 |  |
| 2026-06-24 | DD | 50-250 | 195,3 % | 1,0000 | 13 | ja |
| 2026-08-19 | MRNA | 250-1000 | 177,5 % | 1,0000 | 5 |  |
| 2019-06-03 | DD | 250-1000 | 144,8 % | 1,0000 | 13 | ja |
| 2021-12-09 | HCP | 50-250 | 138,0 % | 1,0000 | 65 |  |
| 2021-01-27 | GME | 50-250 | 137,7 % | 4,0000 | 5 |  |
| 2024-02-27 | VKTX | 50-250 | 122,2 % | 1,0000 | 5 |  |
| 2026-02-11 | PANW | ab1000 | 119,7 % | 1,0000 | 13 | ja |
| 2021-11-02 | CAR | 50-250 | 108,8 % | 1,0000 | 5 |  |
| 2025-11-14 | CDTX | 50-250 | 105,4 % | 1,0000 | 5 |  |
| 2021-02-24 | GME | 250-1000 | 103,9 % | 4,0000 | 5 |  |
| 2021-06-02 | AMC | 250-1000 | 100,3 % | 1,0000 | 5 |  |
| 2021-10-13 | LLL | 50-250 | −98,7 % | 1,0000 | 67 |  |
| 2022-10-04 | BHVN | 50-250 | −94,5 % | 1,0000 | 5 |  |
| 2022-01-28 | ALR | 50-250 | −94,4 % | 1,0000 | 3 |  |

Lesart: GE 1:8 (2021), AMC 1:10 (2023), DD 1:3 (2019), OVV 1:5 (2020), HRI (Abspaltung mit 1:15, 2016), XRX 1:4 (2017) sind bekannte Reverse-Splits mit Faktor 1 im Panel; BBBY (+12.030 %, 2025), HCP (2021), LLL (2021), BHVN (2022) sehen nach einem Kürzel aus, das den Besitzer gewechselt hat (Regel „Kürzel wechseln den Besitzer"). Die Maßnahmen-Marke fängt nur 6 der 44; das Universum schließt sie nur am Signaltag aus, nicht in der Halteperiode und nicht im 12-Monats-Rückblick. **Betrifft die Panelbasis von Teil 1–3** (Momentum 12-1 sieht einen unbereinigten Reverse-Split als +300…+700 % und hält den Wert elf Monate im obersten Dezil) — Größenordnung dort nicht gemessen, gehört in den nächsten Auftrag.

**Wirkung auf Test 1 (120 Tage):** GE lag in 1 betroffenen Monat(en) auf der AB-Seite (2021-03, Δ 12,05 → 3,78 Pp ohne GE); Δ̄ netto −0,836 → **−0,911 Pp** ohne GE (t −0,71 → −0,76, MDE₈₀ 3,317 → 3,375). Empfindlichkeit ohne **alle** 44 Sprungtage (Mitglied fällt aus dem Monat, wenn sein Fenster einen Sprungtag enthält; 16 von 29011 Mitglied-Monaten): Δ̄ **−0,935 Pp** (n 111, t −0,78, MDE₈₀ 3,351). Der Sprung hat die Hypothese um 0,07 Pp begünstigt; das Urteil ändert sich nicht.

## 9. Prüfungen

`test-teil4.js`: Kunstfälle T4-P0…P8 (z_Bonf, Periodenende, A-Grenzfall exakt −10 Pp, B-Klassifikation, HH-Lags 1…5 unabhängig, Placebo-Erhalt, Orakel/Korb von Hand, Kosten je Seite, Sperrklinke) und T4-P9 (Leser-Klinke am echten Leser); T4-P10/P12 gegen diese Ergebnisdatei, T4-P11 startet `test.js`/`test-teil2.js`/`test-teil3.js`. Stand im Bericht der Übergabe.

*Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. Nur Lesezugriff auf Panel und Fundamentaltafel.*
