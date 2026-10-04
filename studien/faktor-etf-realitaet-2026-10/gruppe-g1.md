# Gruppe g1 — Laden, Prüfen, Rechnen, Factsheet-Stichproben

> **Hinweis des Projektleiters (Endstand):** Dieser Gruppenbericht entstand beim Laden und Prüfen, also VOR den Korrekturen nach dem Siegel (benannte Ausschüttungs-Ergänzungen C2, USD-Werte in EUR-Reihen K2, Faktor-100-Brüche K3). Die Prüfbefunde gelten; einzelne Zahlen in den Tabellen hier können davon abweichen. Maßgeblich sind `ERGEBNIS.md` und `ergebnis.json`; `gruppe-gN.json` ist mit dem Endstand neu gerechnet.


Kennung `faktor-etf-realitaet-2026-10/v1`, Datenende der Auswertung 2026-09-15. Gruppenagent g1, 05.10.2026 (Zeiten aus `date`: Laden 01:06,
Rechnen mit dem Code nach Korrektur K1b — Commit 194c1b9 — 01:09, Factsheets bis 01:29). Beschreibende Zahlen nach der gesiegelten
Regel, keine Anlageberatung.

Fonds: RSP, QUAL, SPHQ, USMV, SPLV, LRGF, GSLC, MOAT, COWZ (Auftrag), PRF, RWL, QUS (Zusatz), IVV, VOO (Kontrollen). Alle 14 Reihen
beim ersten Versuch geladen (`pruefsummen-g1.json`), kein Fehlschlag, keine Wiederholung nötig.

## 1. Ergebnisse je Fonds (aus `gruppe-g1.json`, maschinell übernommen)

| Fonds | Art | Symbol | Daten ab | Urteil (Rechner) | Abstand A Pp p. a. | Abstand B Pp p. a. | Fenster vorn/n (Anteil) | Median Pp p. a. | schlechtester Pp p. a. (Start) | Rückschlag gegen SPY (Spitze → Tal) |
|---|---|---|---|---|---|---|---|---|---|---|
| RSP | Auftrag | RSP | 2003-05-01 | nicht verlässlich vorn | −2,85 | −4,11 | 99/220 (45,0 %) | −0,48 | −5,59 (2021-05) | −30,7 % (2015-04-06 → 2026-05-14) |
| QUAL | Auftrag | QUAL | 2013-07-18 | nicht verlässlich vorn | +0,02 | −1,75 | 26/98 (26,5 %) | −0,50 | −1,87 (2021-05) | −13,4 % (2016-02-11 → 2026-05-14) |
| SPHQ | Auftrag | SPHQ | 2005-12-06 | nicht verlässlich vorn | −1,09 | −0,44 | 95/189 (50,3 %) | ±0,00 | −6,12 (2006-01) | −33,4 % (2006-05-08 → 2010-02-05) |
| USMV | Auftrag | USMV | 2011-10-20 | nicht verlässlich vorn | −3,88 | −5,51 | 24/119 (20,2 %) | −2,50 | −7,11 (2020-10) | −42,2 % (2016-07-05 → 2026-06-18) |
| SPLV | Auftrag | SPLV | 2011-05-05 | nicht verlässlich vorn | −6,09 | −7,44 | 18/124 (14,5 %) | −3,03 | −9,39 (2019-06) | −52,0 % (2016-07-05 → 2026-06-01) |
| LRGF | Auftrag | LRGF | 2015-04-30 | nicht verlässlich vorn | −4,51 | +0,90 | 13/77 (16,9 %) | −3,02 | −4,77 (2016-11) | −21,9 % (2015-09-09 → 2021-11-05) |
| GSLC | Auftrag | GSLC | 2015-09-21 | nicht verlässlich vorn | +0,04 | −1,23 | 0/72 (0,0 %) | −0,72 | −1,34 (2021-06) | −10,1 % (2015-09-24 → 2026-05-13) |
| MOAT | Auftrag | MOAT | 2012-04-25 | nicht verlässlich vorn | +1,18 | −3,69 | 79/113 (69,9 %) | +0,62 | −5,59 (2021-05) | −27,6 % (2023-02-02 → 2026-05-14) |
| COWZ | Auftrag | COWZ | 2016-12-22 | nicht verlässlich vorn | −2,47 | −0,68 | 47/57 (82,5 %) | +1,47 | −3,42 (2021-06) | −32,3 % (2022-11-07 → 2026-06-22) |
| PRF | Zusatz | PRF | 2005-12-20 | nicht verlässlich vorn | −4,78 | +0,83 | 62/189 (32,8 %) | −0,68 | −5,22 (2015-08) | −24,9 % (2009-10-14 → 2020-09-01) |
| RWL | Zusatz | RWL | 2008-03-07 | nicht verlässlich vorn | −3,84 | +1,25 | 77/162 (47,5 %) | −0,29 | −4,65 (2015-08) | −20,8 % (2015-03-31 → 2020-09-01) |
| QUS | Zusatz | QUS | 2015-04-16 | nicht verlässlich vorn | −0,98 | −1,85 | 3/77 (3,9 %) | −1,11 | −2,68 (2021-05) | −17,6 % (2020-03-17 → 2026-06-02) |
| IVV | Kontrolle | IVV | 2000-05-19 | nicht verlässlich vorn | +0,06 | +0,07 | 179/256 (69,9 %) | +0,03 | −0,18 (2015-02) | −4,2 % (2008-10-10 → 2008-11-18) |
| VOO | Kontrolle | VOO | 2010-09-09 | nicht verlässlich vorn | +0,07 | +0,06 | 82/132 (62,1 %) | +0,03 | −0,08 (2013-02) | −1,6 % (2020-03-17 → 2025-04-09) |

Abstand = Fonds − SPY in Prozentpunkten p. a. (Gesamtertrag Schluss + Ausschüttungen, beide in USD). Gründe des Urteils laut Rechner:

- RSP: nur 45.0 % der Fenster vorn; Fenster A hinten; Fenster B hinten (erstes/letztes Fenster 2003-05 / 2021-08, fehlend 0)
- QUAL: nur 26.5 % der Fenster vorn; Fenster B hinten (erstes/letztes Fenster 2013-07 / 2021-08, fehlend 0)
- SPHQ: nur 50.3 % der Fenster vorn; Fenster A hinten; Fenster B hinten (erstes/letztes Fenster 2005-12 / 2021-08, fehlend 0)
- USMV: nur 20.2 % der Fenster vorn; Fenster A hinten; Fenster B hinten (erstes/letztes Fenster 2011-10 / 2021-08, fehlend 0)
- SPLV: nur 14.5 % der Fenster vorn; Fenster A hinten; Fenster B hinten (erstes/letztes Fenster 2011-05 / 2021-08, fehlend 0)
- LRGF: nur 16.9 % der Fenster vorn; Fenster A hinten (erstes/letztes Fenster 2015-04 / 2021-08, fehlend 0)
- GSLC: nur 0.0 % der Fenster vorn; Fenster B hinten (erstes/letztes Fenster 2015-09 / 2021-08, fehlend 0)
- MOAT: nur 69.9 % der Fenster vorn; Fenster B hinten (erstes/letztes Fenster 2012-04 / 2021-08, fehlend 0)
- COWZ: Fenster A hinten; Fenster B hinten (erstes/letztes Fenster 2016-12 / 2021-08, fehlend 0)
- PRF: nur 32.8 % der Fenster vorn; Fenster A hinten (erstes/letztes Fenster 2005-12 / 2021-08, fehlend 0)
- RWL: nur 47.5 % der Fenster vorn; Fenster A hinten (erstes/letztes Fenster 2008-03 / 2021-08, fehlend 0)
- QUS: nur 3.9 % der Fenster vorn; Fenster A hinten; Fenster B hinten (erstes/letztes Fenster 2015-04 / 2021-08, fehlend 0)
- IVV: nur 69.9 % der Fenster vorn (erstes/letztes Fenster 2000-05 / 2021-08, fehlend 0)
- VOO: nur 62.1 % der Fenster vorn (erstes/letztes Fenster 2010-09 / 2021-08, fehlend 0)

**Kurz:** Kein Fonds der Gruppe ist „verlässlich vorn". Nicht verlässlich vorn: RSP, QUAL, SPHQ, USMV, SPLV, LRGF, GSLC, MOAT, COWZ
(Auftrag) sowie PRF, RWL, QUS (Zusatz). Zu jung: keiner (alle Reihen beginnen vor dem 03.01.2017). Bemerkenswert: COWZ liegt in 82,5 %
der rollierenden Fenster vorn, aber in A und B hinten; MOAT ist in A vorn, in B deutlich hinten; QUAL und GSLC sind in A nur um +0,02
bzw. +0,04 Pp p. a. vorn.

### Eichung der Kontrollen (REGEL C7.7)

| Kontrolle | Abstand A Pp p. a. | Abstand B Pp p. a. | Grenze | Ergebnis |
|---|---|---|---|---|
| IVV | +0,064 | +0,071 | Betrag < 0,15 in A und B | bestanden |
| VOO | +0,067 | +0,058 | Betrag < 0,15 in A und B | bestanden |

**IVV und VOO bestehen die Eichung** in A und B (beide rund +0,06 bis +0,07 Pp p. a. vor SPY — das entspricht dem Kostenunterschied
0,03 % gegen 0,0945 %). Das Urteil, das der Rechner für die Kontrollen ausgibt, ist nach REGEL A1 kein Urteil im Sinn der Frage. Zu den
rollierenden Fenstern der Kontrollen siehe Befund 3 unten — dort wirken Yahoo-Fehler stark.

## 2. Prüfbefunde je Fonds (REGEL C7 a–e)

### Maschinelle Prüfgrößen (aus `gruppe-g1.json`)

| Fonds | Tage | Sprungpaare | Brüche (K1) | Anfang verworfen bis | eingefroren (≥ 5) | Rand = Vortag (A/B) | Lücken > 7 T. | Ausschüttungen (KG) | verschoben/außerhalb | Splits | adjclose-Diff. A / B Pp p. a. |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RSP | 5894 | 0 | 0 | – | 0 | keiner | 0 | 93 (0) | 0/0 | 2006-04-27 4:1 | +0,014 / −0,006 |
| QUAL | 3323 | 0 | 0 | – | 0 | keiner | 0 | 52 (0) | 0/0 | – | +0,005 / +0,004 |
| SPHQ | 5238 | 0 | 0 | – | 0 | keiner | 0 | 62 (0) | 0/0 | – | +0,007 / −0,007 |
| USMV | 3759 | 0 | 0 | – | 0 | keiner | 0 | 62 (0) | 0/0 | – | +0,005 / +0,007 |
| SPLV | 3876 | 0 | 0 | – | 0 | keiner | 0 | 183 (0) | 0/0 | – | +0,008 / −0,003 |
| LRGF | 2874 | 0 | 0 | – | 0 | keiner | 0 | 47 (0) | 0/0 | – | +0,007 / +0,004 |
| GSLC | 2775 | 0 | 0 | – | 0 | keiner | 0 | 42 (0) | 0/0 | – | +0,005 / −0,005 |
| MOAT | 3631 | 0 | 0 | – | 0 | keiner | 0 | 14 (0) | 0/0 | – | +0,006 / +0,001 |
| COWZ | 2457 | 0 | 0 | – | 0 | keiner | 0 | 39 (0) | 0/0 | – | +0,019 / +0,002 |
| PRF | 5228 | 0 | 0 | – | 0 | keiner | 0 | 83 (0) | 0/0 | 2023-07-17 5:1 | +0,014 / −0,007 |
| RWL | 4673 | 0 | 0 | – | 0 | keiner | 0 | 71 (0) | 0/0 | 2008-11-06 2:1 | ±0,000 / −0,007 |
| QUS | 2884 | 0 | 0 | – | 14 | keiner | 0 | 29 (0) | 0/0 | – | +0,001 / +0,006 |
| IVV | 6632 | 0 | 0 | – | 0 | keiner | 0 | 108 (0) | 0/0 | – | +0,007 / +0,004 |
| VOO | 4041 | 0 | 0 | – | 0 | keiner | 0 | 64 (0) | 0/0 | 2013-10-24 1:2 | −0,011 / −0,004 |

Für alle 14 Reihen gilt: **keine Sprungpaare, keine Brüche (K1/K1b), kein verworfener Anfang, keine Lücke über 7 Kalendertage, kein
Fensterrand A/B mit Schluss gleich Vortag, keine Ausschüttung verschoben oder außerhalb der Reihe, Abgleich adjclose überall unter
0,02 Pp p. a.** (Grenze 0,10). Yahoo führt für keinen Fonds ein Kapitalgewinn-Ereignis; wo die Anbieter Kapitalgewinne ausweisen (IVV
13.12.2000 ST 0,0692; RWL 29.12.2014 LT 0,0379 und 29.12.2015 LT 0,02774; QUS 18.12.2015 und 15.12.2017), stecken sie im Yahoo-Dividendenbetrag (Gesamtbetrag gleich).

### b) Tagesbewegungen über 10 % (mit SPY über dieselben Kalendertage)

- RSP: 2008-10-13 +11,1 % (SPY +14,5 %); 2008-10-28 +12,0 % (SPY +11,7 %); 2020-03-12 −10,1 % (SPY −9,6 %); 2020-03-16 −12,0 % (SPY −10,9 %); 2020-03-24 +10,7 % (SPY +9,1 %)
- QUAL: 2020-03-16 −10,2 % (SPY −10,9 %); 2020-03-24 +10,4 % (SPY +9,1 %)
- SPHQ: 2008-10-13 +12,9 % (SPY +14,5 %); 2020-03-16 −10,3 % (SPY −10,9 %); 2020-03-24 +10,3 % (SPY +9,1 %)
- USMV: 2020-03-16 −10,1 % (SPY −10,9 %)
- SPLV: 2020-03-16 −12,4 % (SPY −10,9 %)
- LRGF: 2020-03-12 −10,3 % (SPY −9,6 %); 2020-03-16 −12,0 % (SPY −10,9 %)
- GSLC: 2020-03-16 −11,4 % (SPY −10,9 %)
- MOAT: keine
- COWZ: 2020-03-12 −10,1 % (SPY −9,6 %); 2020-03-16 −11,1 % (SPY −10,9 %); 2020-03-24 +10,3 % (SPY +9,1 %)
- PRF: 2008-10-13 +11,3 % (SPY +14,5 %); 2020-03-12 −10,1 % (SPY −9,6 %); 2020-03-16 −11,7 % (SPY −10,9 %)
- RWL: 2008-11-24 +10,4 % (SPY +6,9 %); 2020-03-16 −10,5 % (SPY −10,9 %)
- QUS: 2020-03-16 −11,5 % (SPY −10,9 %)
- IVV: 2008-10-13 +10,3 % (SPY +14,5 %); 2008-10-28 +11,1 % (SPY +11,7 %); 2020-03-16 −11,6 % (SPY −10,9 %)
- VOO: 2020-03-16 −11,7 % (SPY −10,9 %)

Alle Bewegungen liegen auf Markttagen (Oktober/November 2008, März 2020) mit SPY-Bewegung in gleicher Richtung und ähnlicher Größe —
echt. Größte Lücke zu SPY: RWL 24.11.2008 +10,4 % gegen SPY +6,9 % (Abstand 3,5 Pp, unter der Bruchschwelle 8 Pp; erster Handelstag
nach der Citigroup-Rettung, der umsatzgewichtete Fonds trägt mehr Finanzwerte). Nebenbefund zu SPY selbst: der SPY-Schluss am
10.10.2008 (88,50, −2,4 %, Index −1,2 %, IVV −0,4 %) macht den 13.10.2008 bei SPY zu +14,5 % (Index +11,6 %); kein Fensterrand betroffen.

### c) Datenbeginn gegen Auflage (Anbieterseite) und Lücken

| Fonds | Auflage laut Anbieter | Yahoo ab | Einordnung |
|---|---|---|---|
| RSP | 24.04.2003 (Invesco) | 01.05.2003 | 7 Tage, unauffällig |
| QUAL | 16.07.2013 (iShares) | 18.07.2013 | unauffällig |
| SPHQ | 06.12.2005 (Invesco) | 06.12.2005 | unauffällig |
| USMV | 18.10.2011 (iShares) | 20.10.2011 | unauffällig |
| SPLV | 05.05.2011 (Invesco) | 05.05.2011 | unauffällig |
| LRGF | 28.04.2015 (iShares) | 30.04.2015 | unauffällig |
| GSLC | 17.09.2015, Handel ab 21.09.2015 (GSAM) | 21.09.2015 | unauffällig |
| MOAT | 24.04.2012 (VanEck) | 25.04.2012 | unauffällig |
| COWZ | 16.12.2016 (Pacer) | 22.12.2016 | 6 Tage, unauffällig; Reihe beginnt vor dem 03.01.2017, A berechenbar |
| PRF | 19.12.2005 (Invesco) | 20.12.2005 | unauffällig |
| RWL | 19.02.2008 (Invesco) | 07.03.2008 | **17 Tage** ohne Yahoo-Kurse; kostet höchstens das Fenster ab Februar 2008 |
| QUS | 15.04.2015, Listing 16.04.2015 (SSGA) | 16.04.2015 | unauffällig |
| IVV | 15.05.2000 (iShares) | 19.05.2000 | unauffällig |
| VOO | 07.09.2010 (Vanguard) | 09.09.2010 | unauffällig |

Keine Reihe hat eine Lücke über 7 Kalendertage.

**e3) Eingefrorene Kurse:** nur **QUS**, 14 Läufe gleicher Schlusskurse vom 06.05.2015 bis 21.06.2016 (5 bis 31 Handelstage; dünner
Handel nach der Auflage). Monatsenden in einem Lauf: Mai 2015, Juli 2015, Februar, März und April 2016. Zwei der nur drei Fenster, in
denen QUS vorn liegt (Start Mai 2015 +0,28, Juli 2015 +0,08 Pp p. a.), beginnen auf einem veralteten Kurs; das dritte (April 2015,
+0,45) nicht. Am Urteil (3 von 77) ändert das nichts. Ränder von A und B sind nicht betroffen.

### d) Ausschüttungen (Prüfskript `kratz-g1/pruef-aussch.js`, Abgleich mit den Anbieterhistorien)

Je Fonds: Zahl je Kalenderjahr gegen das Muster, dann Zeile für Zeile gegen die Ausschüttungshistorie des Anbieters (iShares: in die
Produktseite eingebettete Tabelle; Invesco: Daten-API der Produktseite; Pacer, VanEck: Tabellen der Produktseite; GSAM:
GraphQL-Schnittstelle der Fondsseite; SSGA: Historien-XLSX; Vanguard: Jahressummen aus den SEC-Jahresberichten N-CSR). Vergleich mit
±3 Tagen und Betragsgrenze 0,5 % (Skript `kratz-g1/vergleiche-aussch.js`, `ishares-aussch.js`). Ergebnis maschinenlesbar mit allen
Quellen: `ergaenzungen-g1.json` (Nachauftrag „benannte Ergänzungen", dort Schwelle 1 %).

- **RSP** — quartalsweise, 4 je Jahr 2004–2025 (2003: 2 ab Auflage; 2026: 3 bis September). Invesco-Historie ab 20.03.2008: 75 von 75
  gleich. 2003–2007 führt Invesco nicht; Geschäftsjahressummen laut Rydex-Jahresbericht 2007 (0,16/0,36/0,40/0,50/0,58 gegen Yahoo
  0,154/0,355/0,399/0,499/0,584) gleich im Rahmen der Rundung, Einzelbeträge nicht prüfbar. Split 27.04.2006 4:1: Schluss 44,43 → 44,44
  (+0,02 %, SPY +0,48 %), Ausschüttung/Vortagsschluss vorher 0,24–0,34 %, nachher 0,20–0,35 % — stetig. **Unauffällig.**
- **QUAL** — quartalsweise; 2014 nur 3, 2016 nur 3, 2023 fünf (20.12. und 28.12., beide auch bei iShares). iShares 54 Zeilen, Yahoo
  52: **es fehlen 24.12.2014 (0,230861) und 23.03.2016 (0,317741)** — beide vor A, wirken nur in rollierenden Fenstern (26 → 29 von 98
  vorn). Rest gleich.
- **SPHQ** — 2005–2007 keine, 2008–2010 je eine (damaliges Muster), ab 2011 quartalsweise; 2016, 2020, 2021 je nur 3. Invesco ab
  19.12.2008, 64 Zeilen: **es fehlen 21.09.2020 (0,14319; in A) und 20.09.2021 (0,17302; in B)**; **15.03.2013: Yahoo 0,118 statt
  0,05915** (doppelt). März 2016 fehlt auch bei Invesco (Dezember 2015 mit 0,227 erhöht) — kein Yahoo-Fehler.
- **USMV** — quartalsweise, 2012 und 2018 mit zusätzlicher Dezember-Ausschüttung (auch bei iShares). iShares 62 = Yahoo 62, alle
  gleich. **Unauffällig.**
- **SPLV** — monatlich; 2011 ab Juni 7; 2021 nur 11. Invesco 184, Yahoo 183: **es fehlt 20.09.2021 (0,08853; in B).**
- **LRGF** — quartalsweise; 29.12.2015 kleine Zusatzausschüttung 0,008 (0,03 %, auch bei iShares), 28.12.2018 0,365 (1,30 %, auch bei
  iShares), 2016 nur 3. iShares 48, Yahoo 47: **es fehlt 23.03.2016 (0,094778)**, vor A, wirkt nur rollierend (13 von 77 unverändert).
- **GSLC** — quartalsweise; 2016 und 2020 je nur 3. GSAM-Historie (GraphQL-Schnittstelle der Fondsseite am.gs.com/services/funds)
  44 Zahlungen, Yahoo 42: **es fehlen 23.03.2016 (0,1696) und 24.06.2020 (0,2465; in A)**. Gegenprobe SEC-Jahresberichte (Financial
  Highlights, Geschäftsjahr 1.9.–31.8.): GJ 2016 0,50 und GJ 2020 1,07 laut Bericht gegen 0,326 und 0,825 bei Yahoo — die Differenzen
  sind genau diese beiden Zahlungen; GJ 2017–2019 und 2021–2025 stimmen auf ±0,005 USD.
- **MOAT** — jährlich im Dezember, 2012–2025 je eine. VanEck-Historie 14 = Yahoo 14, alle gleich, keine Kapitalgewinne. **Unauffällig.**
- **COWZ** — quartalsweise, seit 2025 anderer Rhythmus (Anfang März/Juni/September, 30.12.2025); 2019 nur 3. Pacer 40, Yahoo 39:
  **es fehlt 24.09.2019 (0,15512556; in A)**; 23.03.2023 Yahoo 0,211 statt 0,2125223 (Wirkung unter 0,001 Pp p. a.). Höchste Zahlung
  23.03.2020 mit 1,41 % des Vortagsschlusses — auch bei Pacer so.
- **PRF** — quartalsweise, 4 je Jahr 2006–2025. Invesco 83 = Yahoo 83, alle gleich (Beträge vor dem Split durch 5 geteilt). Die
  auffällig kleine Zahlung 20.03.2008 (0,0024 = 0,02 %) bestätigt Invesco (0,012 vor dem Split). Split 17.07.2023 5:1: Schluss 33,05 →
  33,07 (+0,05 %, SPY +0,35 %), Ausschüttungsrendite vorher 0,43–0,56 %, nachher 0,43–0,52 % — stetig. **Unauffällig.**
- **RWL** — quartalsweise; 2008 ab Juni 3, 2016, 2020, 2021 je nur 3. Invesco ab 02.10.2008, 73 Zeilen: **es fehlen 04.04.2016
  (0,18487; rollierend), 21.09.2020 (0,26261; in A) und 20.09.2021 (0,27189; in B).** Yahoo 26.06.2008 (0,052) liegt vor dem Beginn der
  Invesco-Liste; Jahresbericht RevenueShares 22.02.–30.06.2008: 0,10 vor dem Split = 0,05 bereinigt — gleich im Rahmen der Rundung. Split 06.11.2008 2:1: Tagesrendite −5,26 % (SPY −5,54 %); Invesco-Betrag 02.10.2008 halbiert = Yahoo —
  Split bestätigt, Beträge passen.
- **QUS** — 2015–2017 quartalsweise, 2018 Übergang (16.03., 01.06., 21.12.), ab 2019 halbjährlich (SSGA: „Distribution Frequency
  Semi-Annually"). SSGA-Historie (spdr-etf-historical-distributions.xlsx) 29 = Yahoo 29, alle gleich; Kapitalgewinne 18.12.2015 und
  15.12.2017 im Yahoo-Betrag enthalten. **Unauffällig.**
- **IVV** — quartalsweise; 2003 und 2015 und 2018 mit Zusatzzahlung im Dezember, 2016 nur 3. iShares 108, Yahoo 108, aber nicht
  dieselben: **Yahoo fehlt 23.03.2016 (1,118233)**, und **Yahoo führt am 16.12.2003 eine Zahlung von 0,388, die iShares nicht kennt**
  (iShares: nur 15.12.2003, 0,51447). Beides außerhalb A/B.
- **VOO** — quartalsweise; 2014 nur 3 (Dezember fehlt). Die Vanguard-Daten-API gibt nur die letzten sechs Zahlungen (gleich);
  Abgleich der Kalenderjahressummen je ETF-Anteil aus den Jahresberichten (N-CSR Vanguard Index Funds 2014, 2019, 2024, 2025):
  2010–2013 und 2015–2025 gleich auf 0,001 USD, **2014: 3,490 laut Bericht gegen 2,464 bei Yahoo → es fehlt 1,026 USD**; Ex-Tag aus
  dem Kursverlauf 18.12.2014 (VOO an diesem Tag 0,65 Pp unter SPY, am SPY-Ex-Tag 19.12. 0,59 Pp darüber). Dazu passt die
  Vanguard-Kalenderjahresrendite zum Marktpreis: 2014 Vanguard 13,64 %, unser 12,93 % (−0,71 Pp), alle anderen Jahre 2011–2025
  zwischen −0,15 und +0,18 Pp. Yahoo-Split 24.10.2013 „1:2" ist laut Jahresbericht ein echter Reverse-Split; Schluss 159,94 → 160,46
  (+0,33 %, SPY +0,33 %), Ausschüttungsrendite vorher 0,47–0,50 %, nachher 0,45–0,54 % — Reihe stetig.

Auffällige Häufung: **iShares 23.03.2016** fehlt bei Yahoo für IVV, QUAL, LRGF (nicht für USMV); **Invesco 21.09.2020 und 20.09.2021**
fehlen für SPHQ, RWL (2021 auch SPLV), nicht für RSP und PRF. Andere Gruppen mit iShares- oder Invesco-Fonds sollten genau diese Tage
prüfen.

### e) Abgleich adjclose

Überall unter 0,02 Pp p. a. (größte: COWZ A +0,019). Keine Klärung nötig — aber Achtung: der Abgleich kann fehlende Ausschüttungen
nicht finden, weil Yahoo adjclose aus derselben (lückenhaften) Ausschüttungsliste rechnet. Die Fehler oben fand nur der Anbieterabgleich.

## 3. Factsheet-Stichproben (REGEL C9, `factsheet-g1.json`)

| Fonds | Stichtag | Art | Anbieter 5 J. % p. a. | unser 5 J. % p. a. | Abweichung Pp | Quelle |
|---|---|---|---|---|---|---|
| RSP | 2026-08-31 | Marktpreis | 8,82 | 8,81 | −0,01 | https://www.invesco.com/us/en/financial-products/etfs/invesco-sp-500-equal-weight-etf.html |
| QUAL | 2026-06-30 | Marktpreis | 11,87 | 11,87 | ±0,00 | https://www.ishares.com/us/products/256101/ishares-msci-usa-quality-factor-etf |
| SPHQ | 2026-08-31 | Marktpreis | 12,49 | 12,41 | −0,08 | https://www.invesco.com/us/en/financial-products/etfs/invesco-sp-500-quality-etf.html |
| USMV | 2026-06-30 | Marktpreis | 7,30 | 7,30 | ±0,00 | https://www.ishares.com/us/products/239695/ishares-msci-usa-minimum-volatility-etf |
| SPLV | 2026-08-31 | Marktpreis | 5,33 | 5,30 | −0,04 | https://www.invesco.com/us/en/financial-products/etfs/invesco-sp-500-low-volatility-etf.html |
| LRGF | 2026-06-30 | Marktpreis | 13,65 | 13,64 | −0,01 | https://www.ishares.com/us/products/272824/ishares-u-s-equity-factor-etf |
| GSLC | 2026-08-31 | Marktpreis | 11,40 | 11,41 | +0,01 | https://am.gs.com/public-assets/documents/575230c8-24d6-11ef-870d-5172ed5a38e2 |
| MOAT | 2026-09-30 | Marktpreis | 8,88 | 8,89 | +0,01 | https://www.vaneck.com/us/en/investments/morningstar-wide-moat-etf-moat-fact-sheet.pdf |
| COWZ | 2026-06-30 | Marktpreis | 9,87 | 9,88 | +0,01 | https://www.paceretfs.com/products/cowz |
| PRF | 2026-08-31 | Marktpreis | 13,26 | 13,25 | −0,01 | https://www.invesco.com/us/en/financial-products/etfs/invesco-rafi-us-1000-etf.html |
| RWL | 2026-08-31 | Marktpreis | 13,75 | 13,65 | −0,10 | https://www.invesco.com/us/en/financial-products/etfs/invesco-sp-500-revenue-etf.html |
| QUS | 2026-08-31 | Marktpreis | 10,79 | 10,80 | +0,01 | https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-msci-usa-strategicfactors-etf-qus |
| IVV | 2026-06-30 | Marktpreis | 13,33 | 13,33 | ±0,00 | https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf |
| VOO | 2026-09-30 | Marktpreis | 13,76 | 13,77 | +0,01 | https://investor.vanguard.com/investment-products/etfs/profile/voo |

Spanne −0,10 bis +0,01 Pp p. a.; |Abweichung| ≥ 0,30 bei 0 von 14 Fonds. Alle 9 Auftragsfonds, alle 3 Zusatzfonds und beide Kontrollen erreicht, jeweils Marktpreis. Die drei größten
Abweichungen (RWL −0,10, SPHQ −0,08, SPLV −0,04) sind genau die Fonds, denen Yahoo die Ausschüttung vom 20.09.2021 fehlt, die im
5-Jahres-Fenster liegt — sie bestätigen den Ausschüttungsbefund. Die Gegenproben zum zweiten Stichtag (Quartalsende) stehen in den
Bemerkungen der JSON-Datei und liegen ebenfalls unter 0,10. Längere Fenster: GSLC 10 J. −0,04 (fehlende Ausschüttungen 2016/2020), QUS
10 J. +0,06 und seit Auflage +0,03 (dünner Handel 2015/16), MOAT seit Auflage 13,45 gegen 13,53 (erster Kurs gegen Auflage-NAV).

## 4. Befunde für den Projektleiter

**Befund 1 — Yahoo fehlen Ausschüttungen in den Fenstern A/B (Anbieter-Beleg).** Wirkung geschätzt mit `kratz-g1/wirkung.js` (Kopie der
Reihe mit ergänzter Ausschüttung, gleiche Rechnerfunktionen, Rechner unverändert); vollständige Ausgabe `kratz-g1/wirkung-alle.txt`,
Liste mit Quellen im Format des Nachauftrags: `ergaenzungen-g1.json` (16 Einträge: 14 „fehlt", 1 „ersetzen", 1 „streichen").

| Fonds | Ausschüttung (Ex, USD) | Fenster | Quelle | Wirkung A / B Pp p. a. | rollierend vorn vorher → nachher | Urteil |
|---|---|---|---|---|---|---|
| SPHQ | 21.09.2020 0,14319; 20.09.2021 0,17302; dazu 15.03.2013 0,05915 statt 0,118 | A, B | Invesco-API (CUSIP 46137V241) | +0,094 / +0,079 | 95 → 101 von 189 | unverändert |
| SPLV | 20.09.2021 0,08853 | B | Invesco-API (CUSIP 46138E354) | 0 / +0,030 | 18 → 18 von 124 | unverändert |
| RWL | 21.09.2020 0,26261; 20.09.2021 0,27189; dazu 04.04.2016 0,18487 | A, B | Invesco-API (CUSIP 46138G698) | +0,119 / +0,085 | 77 → 80 von 162 | unverändert |
| GSLC | 24.06.2020 0,2465; dazu 23.03.2016 0,1696 | A | GSAM-GraphQL am.gs.com/services/funds; N-CSR 2020 | +0,100 / 0 (A bleibt vorn: +0,036 → +0,136) | 0 → 1 von 72 | unverändert |
| COWZ | 24.09.2019 0,15512556 | A | Pacer-Tabelle /nc/distributions/177 | +0,132 / 0 | 47 → 47 von 57 | unverändert |

Quellen-URLs: https://dng-api.invesco.com/cache/v1/accounts/en_US/shareclasses/46137V241/distribution?idType=cusip&productType=ETF
(SPHQ; SPLV …/46138E354/…, RWL …/46138G698/…), https://www.paceretfs.com/nc/distributions/177, https://am.gs.com/services/funds
(Abfrage fundsDetail{distributions}, pvNumber PV102394, shareClassId 381430503), Gegenprobe GSLC
https://www.sec.gov/Archives/edgar/data/1479026/000119312520283570/d922234dncsr.htm und
https://www.sec.gov/Archives/edgar/data/1479026/000119312525264162/d80414dncsr.htm (Financial Highlights).
**Kein Urteil eines Auftrags- oder Zusatzfonds ändert sich.** Die Hauptzahlen ändern sich um bis zu 0,13 Pp p. a.; ob sie als benannte
Ergänzungen (REGEL C2) nachgetragen werden, entscheidet der Projektleiter.

**Befund 2 — fehlende/falsche Ausschüttungen nur in rollierenden Fenstern:** QUAL 24.12.2014 (0,230861) und 23.03.2016 (0,317741) →
26 → 29 von 98; LRGF 23.03.2016 (0,094778) → 13 von 77 unverändert; RWL 04.04.2016, SPHQ 15.03.2013 und GSLC 23.03.2016 (in Befund 1
mitgerechnet). Urteile unverändert.

**Befund 3 — Kontrollen: die rollierenden Fenster hängen an Yahoo-Fehlern.** IVV: Yahoo fehlt 23.03.2016 (1,118233, iShares) und führt
16.12.2003 eine Zahlung (0,388), die iShares nicht kennt. Korrigiert: 179 → **218 von 256 (85,2 %)**, Median +0,035 → +0,044 Pp p. a.,
A/B unverändert — die Regel ergäbe „verlässlich vorn". VOO: Yahoo fehlt die Dezember-Ausschüttung 2014 (1,026 USD = Jahressumme laut
Vanguard-Jahresbericht 3,490 minus Yahoo 2,464; Ex-Tag 18.12.2014 aus dem Kursverlauf, also nicht als Einzelzahlung vom Anbieter
belegt — in `ergaenzungen-g1.json` so vermerkt; 0,80 bis 1,25 USD ergäben dasselbe): 82 → **131 von 132 (99,2 %)** — ebenfalls
„verlässlich vorn".
Die Eichung A/B (C7.7) besteht in beiden Fällen unverändert. Folgerung für die Einordnung: ein S&P-500-Fonds mit 0,03 % Kosten liegt in
fast allen Fenstern knapp vor SPY (0,0945 %), und **einzelne fehlende Yahoo-Ausschüttungen kippen den Fensteranteil um 15 bis 37
Prozentpunkte**, wo der wahre Abstand nahe null liegt. Bei den Fonds dieser Gruppe ist der Abstand groß genug, dass das nicht greift
(Änderungen 0 bis 6 Fenster).

**Befund 4 — Hinweis an die anderen Gruppen:** die Häufung auf iShares 23.03.2016 und Invesco 21.09.2020/20.09.2021 legt nahe, diese
Tage bei allen iShares- und Invesco-Fonds der Liste (z. B. MTUM, VLUE, IWD, IWF, IVE, IVW, DGRO, HDV, IJR, IWM, IJH, IJS, DVY; SPMO,
RPV, QQQ, PDP, PKW, SPHD) gezielt nachzusehen.

**Kein Verdacht auf einen Rechenfehler im Rechner.** Alle 14 Factsheet-Abweichungen liegen unter 0,11 Pp p. a. und sind, wo über 0,02,
durch belegte Yahoo-Lücken erklärt.
