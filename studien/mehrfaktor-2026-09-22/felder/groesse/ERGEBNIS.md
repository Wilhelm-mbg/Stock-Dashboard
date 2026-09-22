# Feld `groesse` (Nr. 4) — Kontrollgröße: Zelle gebaut, Nullpunkt bestanden (22.09.2026, Agent Nr. 52)

**Kontrollgröße, kein Signal; Dezil oben = größte Mitglieder.** Gewichtet nichts (Vorregistrierung §5). Maschine
`zelle.js` (`mehrfaktor-2026-09-22/zelle/v1`), unverändert; Feldmodul `feld.js` in diesem Ordner; Zellendateien
`zellen/groesse.json`, `zellen/groesse-nullpunkt.json`, `zellen/groesse-bericht.md` — alle Zahlen unten stammen aus dem
Bericht der Maschine, außer den als **beschreibend** markierten Tafeln (Modul-Zähler, außerhalb der Maschine ausgewertet,
keine zweite Messung).

**Formel (§4 Zeile 4, Fassung mit Nachtrag §11):** `ln(roh.aktien × rohSchluss[z])` — Aktienzahl des jüngsten Filings
(`sicht.fundamentalAm(sym, sicht.iso)`, filed strikt vor t, Tor 456 Tage) × **unbereinigter** Schlusskurs am Signaltag
(`rohSchluss`, Preisaussage). Einheit ln($), höher = größer. `null` bei z < 0, fundamentalAm null, `roh.aktien` fehlt/≤ 0,
`rohSchluss` fehlt/≤ 0 — nie 0, kein Ersatzwert, nichts gekappt (§1a.7).

**Lauf:** `node --max-old-space-size=6144 zelle.js --feld felder/groesse/feld.js`, ohne `--ziel/--aus/--rueckhalte`;
Node v24.18.0; Tafel 0,68 s, Lauf 5,0 s, RSS max 1.181 MB, 69.969 Bilanzzugriffe; 92 Signaltage 2017-01-03 … 2024-08-01,
Rückhaltefenster ab 2024-09-01 versiegelt (`rueckhalte: false`).

## 1. Abdeckung (Anteil des Universums mit Wert; Bericht §2)

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 75.9 % (5018/6615) | 81.5 % (1045/1282) | 93.4 % (142/152) | 77.1 % (6205/8049) |
| 2018 | 76.0 % (5167/6797) | 79.6 % (1176/1478) | 92.2 % (200/217) | 77.0 % (6543/8492) |
| 2019 | 76.5 % (5059/6615) | 82.1 % (1208/1471) | 89.5 % (213/238) | 77.8 % (6480/8324) |
| 2020 | 76.2 % (5153/6766) | 81.8 % (1579/1930) | 83.8 % (305/364) | 77.7 % (7037/9060) |
| 2021 | 76.1 % (5504/7231) | 79.5 % (1938/2437) | 84.1 % (427/508) | 77.3 % (7869/10176) |
| 2022 | 77.6 % (5518/7111) | 85.8 % (2292/2670) | 83.9 % (437/521) | 80.1 % (8247/10302) |
| 2023 | 79.5 % (5410/6807) | 88.2 % (1888/2140) | 83.6 % (250/299) | 81.6 % (7548/9246) |
| 2024 | 80.0 % (3582/4477) | 85.9 % (1356/1578) | 86.0 % (228/265) | 81.7 % (5166/6320) |
| **alle** | 77.1 % | 83.3 % | 85.9 % | 78.7 % |

Universum je Signaltag 760,5, davon mit Wert 598,9 (Bericht). Erwartet waren ≈ 78–92 % je Klasse (Auftrag §1); die
Klasse 50-250 liegt mit 77,1 % knapp darunter, ab1000 mit 85,9 % innerhalb.

**Gründe für `null` — Modul-Zähler über alle Aufrufe der Maschine (Hauptlauf + Kontrollen), beschreibend.** 139.938
Aufrufe = 2 × 69.969 (Hauptlauf und Placebo Versatz; Orakel und Placebo Symbole rufen `werte` nicht). Davon `null`
29.818: kein Filing / Tor 456 Tage / keine CIK (über `sicht` nicht unterscheidbar) **20.321 (68,2 %)**, Filing ohne
Aktienzahl **9.244 (31,0 %)**, Aktienzahl ≤ 0 67 (0,2 %), keine Panelzeile 186 (0,6 %); Kurs fehlend/≤ 0: 0. Im Hauptlauf
allein 14.874 `null` von 69.969 (21,3 %; `lauf.werteNull` der Zelle). Die fehlende Aktienzahl im vorhandenen Filing ist
der Unterschied zur Verschuldungs-Abdeckung (84,9 %).

## 2. Nullpunkt (Bericht §3; Schranken aus `konfig.js` des Prüfstands)

| Kontrolle | Ergebnis | Urteil |
|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18.5915 Pp, sd 6.10, Mittel/sd 3.05, t 29.37, n 92; Long − Short 34.4045 Pp (Schranke ≥ 5 Pp, Mittel/sd ≥ 1, t ≥ 8, L-S ≥ 20 Pp; nachrichtlich 20 Pp einseitig: verfehlt) | bestanden |
| Placebo Symbole (je Signaltag permutiert) | brutto 0.0945 Pp, t 0.80, n 92 (\|t\| < 3; \|Mittel\| < 0.25: ja) | bestanden |
| Zufall × 12 | Mittel brutto −0.0168, netto+Kosten −0.0093 Pp; \|t\| ≥ 3 in 0 Ziehungen; se je Ziehung 0.1104 Pp; MDE-Boden 0.3094 Pp | bestanden |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße; Positivkontrolle 2017-01-03: Kurs 1, Bilanz 1; Leser 69.969 Zugriffe, 0 mit filed ≥ tag | bestanden |
| Placebo Versatz +21 Handelstage — **nur Diagnose** (Entscheid §9 (3)) | brutto 0.6223 Pp, t 2.57, n 92 (\|t\| < 3; \|Mittel\| < 0.25: nein, nachrichtlich) | bestanden (nicht im Urteil) |

**`nullpunkt.bestanden`: bestanden** (Orakel, Placebo Symbole, Zufall, Klinke); `bestandenMitVersatz` ebenfalls. Orakel
und Zufall hängen nicht vom Feld ab (identisch mit dem Kunstfeld); das Placebo Versatz misst bei diesem trägen Feld die
Persistenz des Marktwerts, seine 0,62 Pp sind erwartungsgemäß nicht ≈ 0.

## 3. Einzelmessung (Diagnose, kein Urteil; Bericht §1)

| Reihe | Mittel Pp | se | t | t_HH | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0.0423 | 0.2447 | 0.17 | 0.24 | 0.6855 | 92 |
| Dezil oben − Universum, **netto** | 0.0455 | 0.2446 | 0.19 | 0.25 | 0.6854 | 92 |
| Long − Short, netto (verlangt Leihe) | −0.2021 | 0.7730 | −0.26 | – | 2.1656 | 92 |

**Dezil oben (die größten Mitglieder) − Universum: +0,0455 Pp netto bei MDE₈₀ 0,6854** (t_HH 0,25) — nichts oberhalb von
0,69 Pp auflösbar. Dezil unten − Universum +0,2476 Pp netto. Dezil oben 60,2 / unten 59,6 Mitglieder (= 10 % der
Ausweiser); Auffüllungen im Dezil oben / unten 0 / 0; Tote im Dezil oben 6 (1 Totalverlust), Lücken 9; kein Signaltag
übersprungen. Umschlag Dezil 6,9 % je Monat (Universum 7,9 %), Kosten 0,0044 Pp je Monat (Universum 0,0075). Regime:
SPY über EMA200 +0,3474 Pp (n 75), darunter −1,2863 Pp (n 17).

Jahresscheiben netto (Dezil oben − Universum, Pp; se; MDE₈₀): 2017 −0,3045 (0,3060; 0,8573) · 2018 +0,3719 (0,3377; 0,9461)
· 2019 −0,2008 (0,5392; 1,5107) · 2020 −0,3995 (1,2616; 3,5346) · 2021 +0,1800 (0,7635; 2,1390) · 2022 +0,0839 (0,4246;
1,1895) · 2023 +0,1784 (0,7693; 2,1554) · 2024 (8 Monate, dünn) +0,6587 (0,8122; 2,2754). Letzte 250 Tage: netto +0,4528
Pp bei MDE₈₀ 1,7931 (n 12).

**Umschlag × Hürde gegen Literatur ×½:** 0,0044 Pp je Monat Kosten gegen eine Literaturzahl, die §4 für Größe nicht
beziffert (Banz 1981, „heute schwach") — Kostenfrage stellt sich für eine Kontrollgröße nicht.

## 4. Beschreibende Tafeln aus den Modul-Zählern (außerhalb der Maschine; Signaltage der Zelle, je (Tag, Symbol) einmal)

Gegenprobe: alle 55.095 Werte der Zelle sind mit der Aufzeichnung des Moduls identisch (0 Abweichungen, 0 fehlend); die
Maschine ruft `werte` je Signaltag für ≈ 11 weitere Symbole (1.005 gesamt), die nicht in der Zelle stehen — Verhalten der
Maschine (vermutlich Mitglieder, die am Ausführungstag herausfallen), kein Widerspruch.

**Quantile der Rohwerte** (ln $; darunter Marktwert in Mio $):

| Reihe | n | min | p1 | p5 | p10 | p25 | p50 | p75 | p90 | p95 | p99 | max |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| alle Signaltage | 55095 | 8.224 | 21.006 | 21.997 | 22.383 | 22.963 | 23.657 | 24.504 | 25.391 | 25.976 | 27.192 | 38.606 |
| Marktwert Mio $ | | 0.004 | 1 326 | 3 573 | 5 257 | 9 389 | 18 806 | 43 849 | 106 473 | 191 164 | 644 852 | 5,8·10¹⁰ |

Jahresmediane 23,56 (2017) … 23,74 (2024), p1 19,8–21,4, p99 26,9–27,7; die Extreme sitzen in 2017–2021 und 2024 (max
37,5–38,6), 2022/2023 max 30,0 / 28,8 (≈ 10,7 / 3,1 Bio $).

**Anteil je `marken.aktienFallback`** (Code = Prioritätsindex der Tag-Liste in `zuordnung.js`; per Haiku-Unteragent aus
`bauen.js` Z. 173/232 bestätigt — **der Auftragstext §1b (a) ist um eins verschoben**: 0 = dei-Deckblatt, **1 =
Bilanzbestand** `CommonStockSharesOutstanding`, 2 = gewichtet basic, 3 = gewichtet verwässert, 4 = Issued):

| Code | Tag | Anzahl | Anteil |
|---|---|---|---|
| 0 | EntityCommonStockSharesOutstanding (Deckblatt) | 39 | 0.1 % |
| 1 | CommonStockSharesOutstanding (Bilanzbestand) | 33 604 | 61.0 % |
| 2 | WeightedAverageNumberOfSharesOutstandingBasic | 17 128 | 31.1 % |
| 3 | WeightedAverageNumberOfDilutedSharesOutstanding | 209 | 0.4 % |
| 4 | CommonStockSharesIssued | 4 115 | 7.5 % |

Je Jahr stabil (Code 1: 59,4–62,7 %, Code 2: 28,7–33,1 %, Code 4: 7,0–8,2 %). Über alle 139.938 Aufrufe: 78 / 67.155 /
34.250 / 417 / 8.220.

**Klassenmix des Dezils oben** (Dezil nach der Rangregel der Maschine nachgebaut — nur Beschreibung; Dezilgröße Mittel
60,2 = Maschine 60,2, min 48, max 77): Klasse 50-250 2,8 % (Ausweiser 73,3 %), 250-1000 64,3 % (22,7 %), ab1000 32,9 %
(4,0 %) — 1.822 von 2.202 Ausweiser-Einträgen der Klasse ab1000 liegen im Dezil oben.

**Alter des Filings am Signaltag** (Tage seit filed): p10 7, p25 27, p50 51, p75 68, p90 89, p95 92, p99 103, max 449;
über 180 Tage 18 Einträge, über 365 Tage 2 — das Tor 456 greift praktisch nie; die Split-Exposition (§1b b) ist das
Fenster filed → t, Median 51 Tage.

## 5. Fallstricke der Tafel

1. **Skalenfehler in `roh.aktien` (Rohwert aus XBRL, unskaliert):** 321 von 55.095 Einträgen (0,58 %) tragen einen
   Marktwert unter 178 Mio $ oder über 6,5 Bio $ — beides für ein Universum ab 50 Mio $ Tagesumsatz unmöglich. Unten (289
   Einträge, 31 Symbole): **X in allen 92 Signaltagen** (≈ 5.000 $ „Marktwert": Stückzahl offenbar in Millionen gemeldet),
   COP 47, GRMN 16, KO 12, ZS 12, DWDP/DOW 11 (Issued-Fallback), VTR 9, PCAR 8, CHD 7, CYTK 7 …; Fallback-Codes 1: 168, 2:
   101, 4: 20. Oben (32 Einträge): **KMB 17** und PCG 11 (beide fast nur Code 4 Issued; KMB ≈ 5,8·10¹⁶ $), IMMU 2, SWAV, RGA.
   Folge: diese Symbole sitzen dauerhaft im falschen Dezil (X jeden Monat im Dezil unten; KMB/PCG in 28 Signaltagen im
   Dezil oben). **Nicht gekappt, nicht ausgeschlossen (§1a.7)** — Entscheid des PM, ob eine Plausibilitätsgrenze in die
   Tafel gehört (Tafel-Ebene, nicht Zelle).
2. **Auftragstext zu den Fallback-Codes** um eins verschoben (oben §4): berichtet nach der Tafel, nicht nach dem Auftrag.
3. **Split zwischen `filed` und t** (§1b b): nicht gemessen (kein Zugriff außerhalb von `sicht`); Exposition = Filing-Alter,
   Median 51 Tage; der PM prüft über die Split-Liste des Panels. Die Aktienzahl ist punkt-in-Zeit des Filings, der Kurs der
   Rohkurs am Signaltag — ein Split dazwischen verfälscht genau um den Faktor.
4. **Die Maschine schreibt keine Dezil-Mitgliederliste**; der von §1b verlangte Klassenmix musste außerhalb nachgebaut
   werden. Ein Feld `mitglieder` je Dezil in der Zelle würde das erübrigen — Hinweis an den PM, keine Änderung der Maschine.
5. `null`-Grund „kein Filing / Tor / keine CIK" ist über `sicht.fundamentalAm` nicht trennbar (ein Rückgabewert `null`).

## 6. Laufzeit, RSS, Verbrauch

Tafel 0,68 s, Lauf 5,0 s, RSS max 1.181 MB (Vorgabe 4–6 s, ≈ 1,2 GB). Verbrauch: siehe Übergabe
`uebergabe/mehrfaktor-feld-groesse-2026-09-22.md` (eine Datei für beide Zellen).

*Simulation mit virtuellem Kapital, keine Anlageberatung.*
