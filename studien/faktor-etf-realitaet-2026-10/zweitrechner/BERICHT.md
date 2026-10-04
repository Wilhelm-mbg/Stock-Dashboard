# Zweiter Rechner (REGEL C10) – Faktor-ETF-Realitätsprobe 2026-10

Stand 05.10.2026, 01:15 MESZ (aus `date`). Datenende Schluss 15.09.2026. Beschreibende Zahlen nach REGEL.md – **keine Anlageberatung**.

**Unabhängigkeit:** Code `zweit.js` nur aus `REGEL.md` (Teil A, C1–C7) und `fonds.json` geschrieben. `rechnen.js`, `laden.js`, `test.js`,
`zusammenfuehren.js`, die Gruppen-, Factsheet- und Ergebnisdateien sowie der Rohdatenordner des Hauptrechners wurden nicht geöffnet.
Eigene Rohdaten: Yahoo-Chart-Schnittstelle (query1, je ein Versuch genügte) und EZB-Datenportal, abgerufen 05.10.2026 01:11 MESZ,
abgelegt **außerhalb des Repos** in `…/scratchpad/faktor-etf/rohdaten-zweit/` (SHA-256 je Datei in `ergebnis-zweit.json` → `quellen`).
Aufruf: `node zweit.js laden` und `node zweit.js rechnen --stand <zeit>`; eslint mit der Repo-Konfiguration: 0 Befunde.

## Zahlen

Renditen Gesamtertrag (Schluss + Ausschüttungen, C2). Abstand = Rendite p. a. Fonds − SPY in Pp. A = Schluss 03.01.2017 → 15.09.2021
(1716 Tage), B = Schluss 15.09.2021 → 15.09.2026 (1826 Tage), Länge / 365,25.

| | A gesamt | A p. a. | B gesamt | B p. a. |
|---|---:|---:|---:|---:|
| **SPY** | +115,91 % | 17,80 % | +80,97 % | 12,60 % |

| Fonds (Symbol) | A Fonds | A Abstand | B Fonds | B Abstand | Fenster vorn / n | Anteil | Median | schlechtester (Start) | bester (Start) | Rückschlag gg. SPY (Spitze → Tal) | Urteil (A1) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| SPMO | +144,90 % | **+3,20** vorn | +140,88 % | **+6,63** vorn | 61 / 71 | 85,9 % | +2,00 | −2,46 (2018-07) | +10,24 (2021-06) | −19,42 % (03.11.2022 → 18.07.2023) | **verlässlich vorn** |
| SCHD | +101,31 % | −1,74 hinten | +60,89 % | −2,62 hinten | 16 / 119 | 13,4 % | −0,91 | −6,01 (2020-10) | +2,37 (2017-12) | −37,99 % (06.01.2023 → 03.11.2025) | nicht verlässlich vorn |
| XDEW (XDEW.DE, in USD) | +89,27 % | −3,26 hinten | +48,65 % | −4,35 hinten | 0 / 85 | 0,0 % | −2,93 | −5,83 (2021-05) | −0,48 (2018-02) | −34,30 % (25.08.2015 → 13.05.2026) | nicht verlässlich vorn |

Rollierende Fenster (C4): erstes / letztes Startmonat SPMO 2015-10 / 2021-08, SCHD 2011-10 / 2021-08, XDEW 2014-08 / 2021-08; **fehlend
jeweils 0**. Nicht überlappend (nachrichtlich): SPMO 2015-10 +2,62 / 2020-10 +4,33; SCHD 2011-10 −0,04 / 2016-10 −1,94; XDEW 2014-08
−2,41 / 2019-08 −3,66 Pp p. a. Rückschlag des Fonds selbst / SPY im selben Zeitraum (nachrichtlich): SPMO −30,93 % / −33,70 %, SCHD
−33,37 % / −33,70 %, XDEW −38,89 % / −33,70 % (alle Corona 2020).

XDEW ist der erste UCITS-Fonds der Gruppe Gleichgewicht (IE00BLNMYC90, Auflage 10.06.2014). Für XDEW ist nur der Vergleich gegen SPY
gerechnet (Auftrag); das Urteil „nicht verlässlich vorn“ steht schon gegen SPY fest, der SXR8-Vergleich könnte es nicht mehr ändern.

## Eichungen und Kontrollen

- **SPY gegen C7.6:** A +115,91 % gegen +115,81 % (+0,10 Pp, Toleranz 0,3); B +80,97 % gegen +81,2 % (−0,23 Pp, Toleranz 0,5). Vier
  Ausschüttungen je Kalenderjahr 1993–2025, nur 2004 fünf (Sonderausschüttung 15.11.2004, außerhalb der Fenster).
- **SPY gegen ^SP500TR:** A 116,75 % (17,90 % p. a.), B 81,85 % (12,71 % p. a.) → Rückstand SPY 0,097 / 0,109 Pp p. a. (Soll 0–0,25).
- **Kontrollweg adjclose (C2), Differenz zum Hauptweg in Pp p. a.:** SPY −0,012 / −0,004; SPMO −0,005 / +0,010; SCHD −0,008 / −0,009;
  XDEW 0 / 0 (thesaurierend). Alle unter 0,10.
- **Gegenprobe mit zweitem Weg** (adjclose, lineare Suche, eigenes Skript im Rohdatenordner): gleiche Zahl der Fenster vorn (61 / 16 / 0),
  Median auf 0,02 Pp, je Fenster höchstens 0,023 Pp Unterschied.
- **Symbolwahl C6 (XDEW):** XDEW.DE beginnt 15.08.2014 = 66 Tage nach Auflage (≤ 92) → gewählt. Name in den Metadaten „Xtrackers S&P 500
  Equal Weight UCITS ETF 1C“ passt. Die anderen Kandidaten (XDEW.L USD ab 10.06.2014, XDEW.SW CHF ab 27.08.2014, XDEW.MI EUR ab
  10.06.2014) wurden geladen, aber nicht gebraucht. Umrechnung mit dem EZB-Referenzkurs USD je EUR, letzter Kurs ≤ Handelstag.
- **C7-Prüfungen:** keine Sprungpaare (C7.1) in SPY, SPMO, SCHD, XDEW.DE; keine Lücken > 7 Tage; Tagesbewegungen > 10 % nur an
  Markttagen (SPY 13.10.2008, 28.10.2008, 16.03.2020, 09.04.2025; SPMO 16./17.03.2020, 09.04.2025); keine Kapitalgewinne, keine
  verschobenen Ausschüttungen; Ausschüttung / Vortagsschluss SPY 0,23–0,81 %, SCHD 0,48–1,05 % (Split 3:1 am 11.10.2024 passt: Beträge
  von Yahoo split-bereinigt), SPMO 0,05–1,01 %.

## Lesarten (vollständig in `ergebnis-zweit.json` → `lesarten`)

Kerzen mit Schluss null/0 verworfen (XDEW.DE: 8, u. a. 24.10.2025 und 06.03.2026; keiner an einem Fensterrand oder Monatsende); doppelte
Tage: spätere Kerze bliebe (keine gefunden); Ausschüttung an Nicht-Handelstag → erster Handelstag ≥ Datum (keiner nötig); Ausschüttungen
nach dem 15.09.2026 nicht gebucht; Sprungpaare auf dem Schluss vor der Ausschüttungsbuchung, wiederholt; C3-Sollrand am Start = S;
nominale Länge ab S − 1 Tag; „vorn“ strikt; Median bei gerader Zahl = Mittel der beiden mittleren; C5 mit SPY „letzter Wert ≤ Tag“
(gleiches Kalenderdatum zählt); Stillstandskurse (Volumen 0) bleiben stehen; fehlende Ausschüttungen werden nicht ergänzt.

## Auffälligkeiten in den Daten

1. **SPMO – vier Quartale ohne Ausschüttung bei Yahoo:** 2016-03, 2017-06, 2020-09, 2021-09 (sonst quartalsweise; 2017-03 nur 0,015 $ =
   0,05 %). Nicht gegen die Anbieterhistorie geprüft (Firecrawl ohne Guthaben, Nasdaq-API ohne Daten). Grobe Schätzung, falls es echte
   Lücken sind (Betrag wie Nachbarquartale): A etwa +0,18, B etwa +0,04 Pp p. a. **zugunsten** von SPMO – das Urteil ändert sich nicht.
2. **SPMO – Stillstandskurse 2015–2017:** 374 Tage mit Volumen 0 und unverändertem Schluss (2015: 39, 2016: 201, 2017: 134, danach keine).
   16 Startmonate der rollierenden Fenster (2015-11 bis 2017-09) beginnen mit einem bis zu 37 Tage alten Kurs (2016-08). Probe: SPY am Tag
   des letzten echten Handels statt am Monatsende → weiterhin 61 von 71 vorn, kein Fenster wechselt das Vorzeichen. Der Startkurs von
   Fenster A (03.01.2017) stammt aus einem Handel über 100 Stück.
3. **XDEW – Spitze des relativen Rückschlags ist ein Zeitversatz-Tag:** 25.08.2015 (Xetra schloss vor dem US-Einbruch am Nachmittag,
   relativer Wert springt ~4 % über die Nachbartage). Nach Regel −34,30 %; ohne diesen einen Tag wäre die Spitze der 16.12.2014 und die
   Tiefe −33,80 %. Bei einem Vergleich mit dem Hauptrechner zuerst diesen Tag prüfen.
4. **XDEW.DE – 26 Stillstandskurse**, zwei an Monatsenden (31.10.2017, 30.11.2018 → Startmonate 2017-10, 2018-11); alle Fenster liegen weit
   hinten (bester −0,48 Pp), die Zahl ändert sich dadurch nicht.
5. **SCHD – knappe Fenster:** acht Fenster liegen innerhalb ±0,2 Pp p. a. (2011-10 −0,04; 2012-03 −0,11; 2012-12 +0,11; 2014-02 −0,10;
   2016-03 +0,07; 2016-05 +0,17; 2017-02 −0,07; 2018-05 −0,19). Kleine Unterschiede im Rechenweg können die Zahl 16 um ein bis zwei
   verschieben; SPMO hat nur eines (2018-12 +0,12), XDEW keins.
6. **XDEW.MI** beginnt am 10.06.2014 mit 35,73 – genau dem USD-Kurs von XDEW.L am selben Tag, obwohl die Reihe als EUR geführt wird
   (Währungsfehler in der Frühzeit bei Yahoo). Nicht benutzt.
7. EZB-Reihe: 62 Zeilen ohne Zahlenwert (übersprungen), keine doppelten Tage.

## Nachtrag 05.10.2026 – die Fonds „verlässlich vorn“ nach vorläufigem Stand des Hauptrechners

Auftrag des Projektleiters (C10: „dazu jeder Fonds, der am Ende verlässlich vorn ist“): QQQ, IVW, SCHG, MGK gegen SPY; UCITS SXRV, EXXT,
EQQQ, LYMS, 6AQQ gegen SPY in USD **und** gegen SXR8.DE in EUR. Gleicher Code, eigene Rohdaten (`node zweit.js laden --zusatz`, 05.10.2026
01:19–01:20 MESZ; vorhandene Dateien nicht neu geladen; dazu EZB GBP und CHF). Die Einträge des Erstlaufs sind **unverändert**
(maschineller Vergleich der JSON-Teile: identisch; K1b greift bei keiner Reihe des Erstlaufs). Die neuen Einträge stehen in
`ergebnis-zweit.json` → `fonds[3…11]` (Feld `nachtrag: true`, UCITS mit `gegenSXR8` und `urteilGesamt`), SXR8 und K1b unter `nachtrag`.

**Gegen SPY (USD)** – SPY A +115,91 %, B +80,97 % wie oben; Abstände in Pp p. a.; fehlende Fenster jeweils 0; alle Fenster bis Startmonat 2021-08.

| Fonds (Symbol) | A Fonds | A Abst. | B Fonds | B Abst. | vorn / n | Anteil | Median | schlechtester (Start) | erstes Fenster | Rückschlag gg. SPY (Spitze → Tal) | Urteil |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| QQQ | +227,14 % | +10,89 | +92,01 % | +1,34 | 228 / 270 | 84,4 % | +4,15 | −17,72 (2000-02) | 1999-03 | −70,34 % (10.03.2000 → 05.09.2002) | verlässlich vorn |
| IVW | +169,38 % | +5,68 | +82,12 % | +0,14 | 208 / 256 | 81,3 % | +1,00 | −5,34 (2000-06) | 2000-05 | −29,52 % (17.07.2000 → 15.05.2007) | verlässlich vorn |
| SCHG | +188,62 % | +7,51 | +83,85 % | +0,36 | 137 / 140 | 97,9 % | +2,07 | −0,15 (2011-06) | 2010-01 | −20,82 % (19.11.2021 → 06.01.2023) | verlässlich vorn |
| MGK | +194,85 % | +8,08 | +84,07 % | +0,38 | 161 / 165 | 97,6 % | +1,66 | −0,52 (2011-11) | 2007-12 | −23,01 % (01.09.2020 → 05.01.2023) | verlässlich vorn |
| SXRV (CSNDX.SW, USD) | +221,27 % | +10,40 | +91,93 % | +1,33 | 139 / 140 | 99,3 % | +4,54 | −0,06 (2020-08) | 2010-01 | −24,09 % (01.12.2021 → 31.01.2023) | verlässlich vorn |
| EXXT (EXXT.DE) | +220,59 % | +10,34 | +90,71 % | +1,19 | 152 / 164 | 92,7 % | +3,94 | −6,86 (2008-06)¹ | 2008-01 | −45,02 % (15.07.2008 → 02.01.2009)¹ | verlässlich vorn |
| EQQQ (EQQQ.DE) | +222,98 % | +10,54 | +91,99 % | +1,34 | 150 / 164 | 91,5 % | +4,08 | −6,82 (2008-07)¹ | 2008-01 | −45,26 % (15.07.2008 → 02.01.2009)¹ | verlässlich vorn |
| LYMS (UST.PA) | +215,26 % | +9,88 | +93,50 % | +1,52 | 164 / 164 | 100 % | +3,72 | +0,09 (2020-08) | 2008-01 | −24,36 % (01.12.2021 → 06.01.2023) | verlässlich vorn |
| 6AQQ (ANX.PA) | +222,61 % | +10,51 | +93,33 % | +1,50 | 135 / 135 | 100 % | +4,67 | +0,06 (2020-08) | 2010-06 | −24,31 % (01.12.2021 → 06.01.2023) | verlässlich vorn |

**Gegen SXR8.DE (EUR, Xetra gegen Xetra)** – SXR8 ab 01.11.2010 (K1b): A +87,58 % (14,33 % p. a.), B +84,72 % (13,06 % p. a.);
Fenster 2010-11 bis 2021-08, fehlend 0. SXR8 gegen SPY in USD (C7.7, nachrichtlich): A −0,27, B −0,09 Pp p. a.

| Fonds | A Fonds | A Abst. | B Fonds | B Abst. | vorn / n | Median | schlechtester (Start) | Rückschlag gg. SXR8 (Spitze → Tal) | Urteil gg. SXR8 | Gesamt (A1) |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| SXRV | +182,17 % | +10,38 | +96,67 % | +1,43 | 130 / 130 | +4,97 | +0,28 (2020-08) | −21,66 % (19.11.2021 → 27.01.2023) | verlässlich vorn | verlässlich vorn |
| EXXT | +181,58 % | +10,32 | +95,42 % | +1,28 | 130 / 130 | +4,86 | +0,04 (2020-08) | −21,23 % (03.02.2021 → 28.12.2022) | verlässlich vorn | verlässlich vorn |
| EQQQ | +183,68 % | +10,52 | +96,73 % | +1,43 | 129 / 130 | +5,07 | −0,95 (2014-09)¹ | −35,88 % (29.08.2011 → 09.04.2013)¹ | verlässlich vorn | verlässlich vorn |
| LYMS | +176,89 % | +9,88 | +98,28 % | +1,61 | 130 / 130 | +4,43 | +0,43 (2020-08) | −20,73 % (03.02.2021 → 28.12.2022) | verlässlich vorn | verlässlich vorn |
| 6AQQ | +183,35 % | +10,49 | +98,11 % | +1,59 | 130 / 130 | +5,16 | +0,40 (2020-08) | −20,93 % (03.02.2021 → 04.01.2023) | verlässlich vorn | verlässlich vorn |

¹ von Datenfehlern bei Yahoo bestimmt, siehe Auffälligkeiten N1/N2 – die Urteile hängen nicht daran.

**Symbolwahl C6:** SXRV.DE beginnt 07.05.2010 = 101 Tage nach Auflage → **CSNDX.SW** (SIX, USD, ab 26.01.2010 = 0 Tage). EXXT: kein
Kandidat ≤ 92 Tage → längste Historie **EXXT.DE** (ab 02.01.2008). EQQQ: keiner ≤ 92 Tage; EQQQ.DE und EQQQ.MI beginnen beide am
02.01.2008 → Gleichstand, Reihenfolge in fonds.json → **EQQQ.DE**. LYMS: keiner ≤ 92 Tage → **UST.PA** (Paris, EUR, ab 02.01.2008; LYMS.DE erst
ab 04.01.2016). 6AQQ: 6AQQ.DE erst ab 19.04.2018 → **ANX.PA** (Paris, EUR, ab 08.06.2010 = 0 Tage). Die Regionalbörsen-Symbole (.DU/.MU/.HM)
liefern nur eine einzige Kerze vom 02.10.2026. Namen in den Metadaten passen bei allen gewählten Reihen.

**Lesart K1b (übernommen, eigene Ausformung, im Code `k1b()`):** Anfang verworfen, wenn innerhalb der ersten 730 Kalendertage auf ≥ 5
unmittelbar aufeinanderfolgende gleiche Schlusskurse ein Sprung |r| > 10 % folgt, der „ungedeckt“ ist: |(1 + Sprung) / (1 + SPY-Kursbewegung
vom ersten gleichen Tag bis zum Sprungtag) − 1| > 10 %. Verworfen wird alles vor dem Sprungtag; er ist der erste Tag der Reihe. Einziger
Treffer: **SXR8.DE** – 20 gleiche Schlüsse 04.–29.10.2010, am 01.11.2010 −24,6 % bei SPY +4,2 % → 19.05.–29.10.2010 verworfen
(118 Handelstage), Reihe ab 01.11.2010. XDEW.L (36 gleiche, +13,6 %) ist durch SPY +11,3 % gedeckt und ohnehin nicht gewählt.

**Auffälligkeiten (Nachtrag)**

- **N1. EQQQ.DE – Währungs- und Fehlkurse.** 2008 offenbar in USD notiert (02.01.2008: 50,42; EQQQ.MI am selben Tag 35,14 EUR), Wechsel
  auf EUR am 02.01.2009 (−26,4 %), bis 24.08.2009 ständiges Springen zwischen beiden Niveaus, dazu Ausreißer 06.01.2011, 29.08.2011
  (+53,4 %), ein Plateau 30.09.–29.10.2014 (+27 %) und 05.06.2017. C7.1 entfernt 22 Sprungpaare, nicht aber Paare knapp außerhalb von
  [0,97; 1,03], Plateaus und Sprünge unter 15 %. Folgen: beide Rückschläge (−45,26 % gg. SPY, Tal = Währungswechsel; −35,88 % gg. SXR8,
  Spitze = Ausreißer 29.08.2011) und beide schlechtesten Fenster sind Datenfehler. Probe mit **EQQQ.MI** (gleicher Datenbeginn, kein
  Sprung > 10 %): gg. SPY 163/164, Median +4,32, schlechtester −0,09, Rückschlag −24,94 %; gg. SXR8 130/130, Rückschlag −21,40 %. Probe
  EQQQ.DE ab 25.08.2009 ohne die genannten Fehlkurse: gg. SPY 144/145, Rückschlag −24,45 %; gg. SXR8 130/130, −21,01 %. Urteil unverändert.
- **N2. EXXT.DE – 2008 in USD** (02.01.2008: 20,50), Wechsel auf EUR am 02.01.2009 (−26,8 % bei SPY +4,5 %); weder C7.1 (kein Rücksprung)
  noch K1b (nur ein gleicher Schluss) greifen. Folgen: alle 12 Startmonate 2008-01 bis 2008-12 liegen hinten (daher 152/164, schlechtester
  −6,86), der Rückschlag gg. SPY −45,02 % ist der Währungswechsel. Probe ab 02.01.2009: 151/152, schlechtester −0,30, Rückschlag −24,57 %.
  Gegen SXR8 (ab 2010-11) nicht betroffen. Außerdem ein Sprungpaar entfernt (24.10.2025, +17,6 / −12,7 %).
- **N3. IVW ist knapp:** 208 von 256 Fenstern vorn bei einer Schwelle von 205; 11 Fenster liegen innerhalb ±0,2 Pp (10 davon knapp vorn),
  B nur +0,14 Pp p. a. Schon vier gekippte Fenster würden das Urteil ändern – beim Abgleich zuerst hier hinsehen. SCHG (7) und MGK (5)
  haben auch knappe Fenster, aber weiten Abstand zur Schwelle.
- **N4. Ausschüttungen bei Yahoo:** fehlende Quartale wie bei SPMO – QQQ 2020-09, MGK 2014-12, SCHG 2016-03; EXXT.DE und EQQQ.DE haben
  Ausschüttungen erst ab 2014. Fehlende Ausschüttungen stellen den Fonds nur schlechter, nie besser. Einige sehr kleine Beträge liegen
  unter 0,05 % des Vortagsschlusses (QQQ 24.12.2003, IVW 21.06.2000/29.12.2010, SCHG drei, EXXT.DE sieben) – keine Fremdwährungsbeträge
  (die lägen bei rund 110 % des richtigen Betrags, nicht darunter). Splits (QQQ 2:1 2000, IVW 4:1 2020, SCHG 2:1 2022 und 4:1 2024, MGK
  5:1 am 21.04.2026) passen zu den Beträgen.
- **N5. Kleinere Datenpunkte:** CSNDX.SW Lücke 23.12.2025 → 05.01.2026 (Monatsende 12/2025 = 23.12., unter der 10-Tage-Grenze);
  UST.PA 71 Null-Kurse und 44 Stillstandskurse (zwei an Monatsenden 2008); SXR8.DE 42 Stillstandskurse (Monatsende 31.10.2017).
  QQQs Rückschlag −70,34 % und das schlechteste Fenster 2000-02 sind echte Geschichte (Dotcom), kein Datenfehler.

## Dateien

- Code: `studien/faktor-etf-realitaet-2026-10/zweitrechner/zweit.js` (`laden`, `laden --zusatz`, `rechnen --stand … --stand-nachtrag …`)
- Ergebnis: `studien/faktor-etf-realitaet-2026-10/zweitrechner/ergebnis-zweit.json` (Dezimalbrüche; `*Pp`-Felder in Prozentpunkten)
- Außerhalb des Repos (`…/scratchpad/faktor-etf/rohdaten-zweit/`): Rohantworten, `abrufprotokoll.json`, `fenster-zweit.json` (jedes
  rollierende Fenster mit Randtagen und Renditen, für den Abgleich Fenster für Fenster; `<ID>_gegenSXR8` für die UCITS), Sichtungs-,
  Gegenprobe-, K1b- und Empfindlichkeitsskripte (`empfindlichkeit.js`), Stand des Erstlaufs (`ergebnis-zweit-erstlauf.json`).
