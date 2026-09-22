# Feld 10 `fue` — F&E-Intensität, mit nachrichtlicher Zelle `fue-marktwert` (Nr. 57, 22.09.2026)

Feld-Agent nach `AUFTRAG-VORLAGE-FELD.md` und `uebergabe/auftrag-mehrfaktor-feld-fue-2026-09-22.md`; Formel aus
`VORREGISTRIERUNG-KOMBINATION.md` §4 Zeile 10 in der Fassung mit Nachtrag §11 (1), Entscheide §9 (7) und (9). Maschine
`zelle.js` (`mehrfaktor-2026-09-22/zelle/v1`), unverändert; 92 Signaltage 2017-01-03 … 2024-08-01, Rückhaltefenster
versiegelt (`rueckhalte: false`). Alle Messzahlen stammen aus `zellen/fue-bericht.md` bzw. `zellen/fue-marktwert-bericht.md`;
die Sektor-, Grund- und Verteilungstafeln aus den Modul-Zählern, ausgewertet mit `zaehler-auswerten.js` (Aufruf im Kopf des
Skripts). Die Zelle ist kein Urteil. Simulation mit virtuellem Kapital, keine Anlageberatung.

## 1. Zelle `fue` (Signal, Gewicht 1)

**Bau** (`feld.js`): `roh.fue / roh.umsatz` aus dem jüngsten Filing (`sicht.fundamentalAm(sym, sicht.iso)`: 10-K/10-Q mit
`filed` strikt vor t, Tor 456 Tage), gleiche `qtrs`, darum ohne Jahresrate; `null` bei keiner Panelzeile, keinem Filing/Tor,
`roh.fue` null (nicht ausgewiesen), `roh.umsatz` null oder ≤ 0; ausgewiesenes `roh.fue` = 0 ist ein Wert. Nichts gekappt, nichts
transformiert. Ein `fundamentalAm` je Aufruf, keine Module. Lauf 4,8 s, RSS max 1.190 MB.

### 1.1 Nullpunkt — **bestanden** (`nullpunkt.bestanden` aus Orakel, Placebo Symbole, Zufall, Klinke)

| Kontrolle | Ergebnis | Urteil |
|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto 18,59 Pp, sd 6,10, Mittel/sd 3,05, t 29,37, n 92; Long − Short 34,40 Pp (Schranken 5 Pp / 1 / 8 / 20 Pp) | bestanden |
| Placebo Symbole (je Signaltag permutiert) | brutto −0,058 Pp, t −0,28 | bestanden |
| Zufall × 12 | Mittel brutto −0,017, netto+Kosten −0,009 Pp; \|t\| ≥ 3 in 0 Ziehungen; se je Ziehung 0,110 Pp; MDE-Boden 0,309 Pp | bestanden |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße; Positivkontrolle 2017-01-03 Kurs 1 / Bilanz 1; Leser 69.969 Zugriffe, 0 mit `filed` ≥ tag | bestanden |
| Placebo Versatz +21 (nur Diagnose, Entscheid §9 (3)) | brutto −0,164 Pp, t −0,21 — ≈ Einzelmessung, wie bei einem trägen Feld erwartet | ausgewiesen |

### 1.2 Einzelmessung (Diagnose, kein Urteil)

| Reihe | Mittel Pp | se | t | t_HH | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | −0,153 | 0,751 | −0,20 | −0,15 | 2,104 | 92 |
| Dezil oben − Universum, **netto** | −0,161 | 0,751 | −0,22 | −0,16 | 2,104 | 92 |
| Long − Short, netto (Diagnose, verlangt Leihe) | 0,266 | 0,897 | 0,30 | — | 2,514 | 92 |

Satzform: **−0,16 Pp bei MDE₈₀ 2,10 Pp** (t_HH −0,16) — nichts oberhalb von 2,10 Pp auflösbar. Die se des echten Dezils
(0,751) liegt beim 6,8-Fachen des Maschinen-Bodens (0,110 je Zufallsziehung): das Dezil ist dünn (21,5 Mitglieder) und
konzentriert (unten), genau wie in Auftrag §1b angekündigt. Kein Verbreitern, kein Auffüllen.

| Größe | Wert |
|---|---|
| Universum je Signaltag / davon mit Wert (Mittel) | 760,5 / 213,7 (28,1 %) |
| Dezil oben / unten (Mittel); Auffüllungen im Dezil oben / unten | 21,5 / 21,2; 0 / 0 |
| Dezil unten − Universum brutto / netto | −0,425 / −0,427 Pp |
| Umschlag Dezil / Universum je Monat | 17,5 % / 7,9 % (Erwartung §1b: 20–35 %) |
| Kosten Dezil / Universum je Monat | 0,0158 / 0,0075 Pp |
| Tote im Dezil oben (Totalverlust) / Lücken | 11 (0) / 5 |
| Regime SPY über / unter EMA200, netto | −0,635 (n 75) / +1,928 (n 17) Pp |

Jahresscheiben (netto, Dezil oben − Universum): 2017 +1,55 (t 1,35) · 2018 +0,75 (0,77) · 2019 +0,98 (0,78) · 2020 +3,23 (2,06,
MDE₈₀ 4,60) · 2021 −1,46 (−0,49) · 2022 −6,21 (−2,73, MDE₈₀ 6,65) · 2023 +2,20 (0,96) · 2024 −3,42 (−1,82, dünn, 8 Monate).
Letzte 250 Tage (Signaltag ≥ 2023-08-03): netto −1,54 Pp, se 1,93, t −0,84, MDE₈₀ 5,41, n 12. Die Vorzeichen wechseln mit
dem Jahr; jede Scheibe liegt unter ihrer MDE₈₀.

**Kostenfrage** (Umschlag × Hürde gegen Literatur × ½): 17,5 % Umschlag ⇒ 0,016 Pp je Monat gegen 0,25 Pp (½ von ≈ 0,5 Pp
Chan/Lakonishok/Sougiannis 2001) — die Kosten sind 6 % der halbierten Literaturzahl; das Feld ist träge.

### 1.3 Abdeckung — der halbe Bericht

**Je Klasse und Jahr** (aus dem Bericht der Maschine, Anteil des Universums mit Wert):

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 21,4 % (1415/6615) | 34,2 % (438/1282) | 57,9 % (88/152) | 24,1 % (1941/8049) |
| 2018 | 22,3 % (1513/6797) | 35,0 % (518/1478) | 64,5 % (140/217) | 25,6 % (2171/8492) |
| 2019 | 23,4 % (1546/6615) | 39,0 % (573/1471) | 68,1 % (162/238) | 27,4 % (2281/8324) |
| 2020 | 24,3 % (1643/6766) | 40,5 % (782/1930) | 54,4 % (198/364) | 29,0 % (2623/9060) |
| 2021 | 23,9 % (1730/7231) | 39,8 % (971/2437) | 52,2 % (265/508) | 29,1 % (2966/10176) |
| 2022 | 24,2 % (1718/7111) | 38,7 % (1033/2670) | 50,5 % (263/521) | 29,3 % (3014/10302) |
| 2023 | 25,0 % (1705/6807) | 41,5 % (889/2140) | 59,9 % (179/299) | 30,0 % (2773/9246) |
| 2024 | 25,4 % (1135/4477) | 36,9 % (583/1578) | 65,7 % (174/265) | 29,9 % (1892/6320) |
| **alle** | 23,7 % | 38,6 % | 57,3 % | 28,1 % |

Gegen die Erwartung 30–40 % (Anteil der Filings mit F&E) liegt die Zelle bei 28,1 % des Universums, weil 14,6 % der
Symbol-Tage gar kein Filing im Tor haben; unter den Symbol-Tagen **mit** Filing tragen 32,9 % einen Wert. Ausweiser je
Signaltag 154 … 275 (Median 224,5), Dezil oben 15 … 28 Mitglieder.

**Gründe für fehlende Werte** (69.969 Symbol-Tage der Zelle, jeder einmal; Zähler des Moduls):

| Grund | Symbol-Tage | Anteil |
|---|---|---|
| F&E nicht ausgewiesen (`roh.fue` null) | 39.978 | 57,1 % |
| Wert | 19.661 | 28,1 % |
| kein Filing oder älter als das Tor (der Leser unterscheidet das nicht) | 10.195 | 14,6 % |
| Umsatz fehlt | 84 | 0,1 % |
| Umsatz ≤ 0 | 51 | 0,1 % |
| keine Panelzeile | 0 | — |

**Je Sektor** (SIC-Division der Tafelzeile; Symbol-Tage mit Filing; „Anteil" = wie viele davon F&E ausweisen und einen
Umsatz > 0 haben; „an Ausweisern" = Gewicht des Sektors unter allen Werten):

| Sektor | mit Filing | mit Wert | Anteil | an Ausweisern |
|---|---|---|---|---|
| Verarbeitendes Gewerbe (SIC 2000–3999, darin Pharma 283x und Hardware) | 22.064 | 12.772 | 57,9 % | 65,0 % |
| Dienstleistungen (7000–8999, darin Software 737x) | 10.597 | 6.023 | 56,8 % | 30,6 % |
| Finanzen/Immobilien | 10.455 | 181 | 1,7 % | 0,9 % |
| Transport/Versorger/Kommunikation | 7.198 | 279 | 3,9 % | 1,4 % |
| Einzelhandel | 5.073 | 36 | 0,7 % | 0,2 % |
| Bergbau/Öl | 2.569 | 260 | 10,1 % | 1,3 % |
| Großhandel | 1.081 | 59 | 5,5 % | 0,3 % |
| Bau | 670 | 0 | 0,0 % | 0,0 % |
| Landwirtschaft (n klein: Cannabis-Firmen mit SIC 700) | 54 | 51 | 94,4 % | 0,3 % |
| **alle mit Filing** | 59.774 | 19.661 | 32,9 % | 100 % |

95,6 % der Ausweiser sitzen in zwei Divisionen. **Je Sektor und Jahr** (Anteil mit Wert unter den Symbol-Tagen mit Filing,
in Klammern Ausweiser): Verarbeitendes Gewerbe 54,4 % (1.404) 2017 → 59,0 % (1.202) 2024, Dienstleistungen 49,4 % (447) →
62,7 % (631), Finanzen 1,0 % → 2,3 %, Transport/Versorger 3,2 % → 1,5 %, Bergbau/Öl 11,3 % → 6,7 %, Bau durchgehend 0;
alle Sektoren zusammen 28,8 % (2017) → 34,4 % (2024) — die Abdeckung wächst leicht mit der Zeit (mehr 10-Q-Filer mit
XBRL-Tag). **Je Sektor und Klasse:** Verarbeitendes Gewerbe 53,3 % / 65,0 % / 92,8 % (50-250 / 250-1000 / ab1000),
Dienstleistungen 50,2 % / 68,5 % / 76,9 %, Transport/Versorger 3,5 % / 3,7 % / 31,8 %, Bergbau/Öl 5,6 % / 25,3 % / 0 %; alle
28,4 % / 42,1 % / 62,9 %. Die vollständigen Kreuztafeln liefert `zaehler-auswerten.js`.

**Filing-Form und qtrs unter den Ausweisern:** 10-Q (qtrs 1) 76,9 %, 10-K (qtrs 4) 22,8 %, Änderungsmeldungen 10-K/A 0,2 % und
10-Q/A 0,1 %, 10-QT 3 Fälle. **Ausgewiesenes F&E = 0:** 7 Symbol-Tage, 2 Symbole (HL, LNG) — Wert 0, kein `null`.

**Zähler über alle Aufrufe der Maschine (Hauptlauf + Kontrollen):** 139.938 Aufrufe — Wert 39.276, F&E nicht ausgewiesen
79.899, kein Filing 20.321, keine Panelzeile 186, Umsatz fehlt 160, Umsatz ≤ 0 96. Davon 47.651 Aufrufe an 63 Tagen außerhalb
der Signaltage (Placebo Versatz) und 1.398 Aufrufe, deren Versatztag t + 21 auf den nächsten Signaltag fällt und deren Symbol
dort nicht Universumsmitglied ist (altes Universum unter neuem Tag) — in den Tafeln oben ausgeschlossen; Abgleich mit der Zelle
danach exakt (69.969 = 69.969, Klassen 52.419 / 14.986 / 2.564 identisch, 0 Widersprüche Wert/kein Wert).

### 1.4 Verteilung der Rohwerte und Dezil oben

| Jahr | n | Q05 | Q25 | Median | Q75 | Q95 | Max | > 1 |
|---|---|---|---|---|---|---|---|---|
| 2017 | 1.941 | 0,012 | 0,050 | 0,124 | 0,196 | 0,451 | 3.220 | 50 (2,6 %) |
| 2018 | 2.171 | 0,008 | 0,052 | 0,126 | 0,190 | 0,433 | 67,6 | 37 (1,7 %) |
| 2019 | 2.281 | 0,010 | 0,062 | 0,134 | 0,201 | 0,419 | 67,6 | 35 (1,5 %) |
| 2020 | 2.623 | 0,011 | 0,064 | 0,139 | 0,225 | 0,546 | 1.350 | 83 (3,2 %) |
| 2021 | 2.966 | 0,011 | 0,059 | 0,136 | 0,246 | 0,859 | 31.684 | 137 (4,6 %) |
| 2022 | 3.014 | 0,010 | 0,055 | 0,128 | 0,241 | 0,627 | 8.455 | 97 (3,2 %) |
| 2023 | 2.773 | 0,009 | 0,055 | 0,138 | 0,254 | 0,554 | 1.241 | 61 (2,2 %) |
| 2024 | 1.892 | 0,010 | 0,059 | 0,139 | 0,245 | 0,496 | 289 | 51 (2,7 %) |
| **alle** | 19.661 | 0,010 | 0,058 | 0,133 | 0,222 | 0,542 | 31.684 | 551 (2,8 %) |

Keine negativen Werte. F&E > Umsatz in 2,8 % der Symbol-Tage (Spitze 2021 mit 4,6 %), Maxima im Tausenderbereich (Umsatz nahe
null) — echte Werte, nichts gekappt; der Rang macht die Größe unschädlich. Die untere Grenze des Dezils oben (kleinster Rohwert
der obersten 10 % der Ausweiser, Median je Jahr) liegt bei 0,31–0,33 (2017–2019) und 0,38–0,39 (2020–2024): das Dezil beginnt
bei rund 35 % F&E-Quote. **Sektormix des Dezils oben** (nachgebildet aus den Rohwerten der Zelle als oberste 10 % der
Ausweiser je Signaltag, nur für diese Tafel — das Dezil der Messung bildet die Maschine): Verarbeitendes Gewerbe 53,7 % (unter
allen Ausweisern 65,0 %), Dienstleistungen 42,7 % (30,6 %), Finanzen/Immobilien 2,4 % (0,9 %), Transport/Versorger 1,1 %
(1,4 %); 28,0 % der Dezilmitglieder haben F&E > Umsatz. Das Dezil neigt also zu Software-Dienstleistern und zur Biotech-Ecke
des Verarbeitenden Gewerbes; ob es Biotech oder Halbleiter ist, zeigt die Division nicht — die Tafelzeile trägt `sic`, ein
Schnitt über die zweistellige SIC wäre möglich (nicht gemacht, nicht verlangt).

### 1.5 Fallstricke der Tafel

- **Kein Filing und Tor sind ein Topf:** `fundamentalAm` liefert für beides `null`; die 14,6 % lassen sich ohne den Leser
  nicht trennen.
- **10-K und 10-Q mischen sich** (23 % / 77 %): das Verhältnis ist qtrs-neutral, aber ein 10-K trägt eine Jahresquote, ein 10-Q
  eine Quartalsquote — Saisonalität der F&E-Quote ginge als Rauschen ein (nicht gemessen).
- **Änderungsmeldungen** (10-K/A, 10-Q/A, 0,3 %) zählen als jüngstes Filing; Neudarstellungen übernimmt die Tafel nicht
  (Erstwert), also ohne Rückwirkung.
- **Ausreißer** bis 31.684 (F&E gegen fast keinen Umsatz); ausgewiesene Nullen nur HL und LNG.
- **Sektorschlüssel grob** (zehn SIC-Divisionen): „Landwirtschaft" mit 94 % Abdeckung sind 54 Symbol-Tage von Cannabis-Firmen.
- **Placebo Versatz trifft in 29 von 92 Monaten den nächsten Signaltag** (t + 21 Panelzeilen = erster Handelstag des
  Folgemonats): für die Maschine folgenlos (eigene Placebo-Zelle), für Modul-Zähler eine Falle (1.398 Einträge, siehe 1.3).

### 1.6 Was der PM entscheiden muss

1. Das Feld trägt an 72 % des Universums keinen Wert; in der Kombination bekommen diese den mittleren Rang (Entscheid §9 (7)),
   das Feld bewegt den Summenrang also nur für die 28 % Ausweiser — gewollt so, aber K-P6 (Auffüllungen je Feld und Dezil) wird
   dieses Feld als Hauptquelle der Auffüllungen zeigen.
2. 95,6 % der Ausweiser liegen in zwei SIC-Divisionen; das Feld ist zur Hälfte eine Sektorzugehörigkeit. Ob das in der
   Kombination gewollt ist (Vorregistrierung nennt keinen Sektorabgleich), ist eine Frage der Registrierung, nicht dieser Zelle.
3. MDE₈₀ 2,10 Pp bei se 0,751: Die Zelle allein löst die Literaturgröße (0,5 Pp Obergrenze, realistisch 0,25) nicht auf — als
   Baustein der Kombination erwartbar, als Einzelbefund ohne Aussage.

## 2. Zelle `fue-marktwert` (nachrichtlich, nicht gewichtet, nicht kombiniert)

**Bau** (`feld-marktwert.js`): `(roh.fue × 4 / roh.qtrs) / (roh.aktien × rohSchluss[z])`, `z = sicht.zeileAm(sym)` — F&E auf
Jahresrate durch Marktwert aus Aktienzahl des Filings und **unbereinigtem** Schlusskurs am Signaltag; `null` bei `roh.fue` null,
`qtrs` ∉ {1, 4}, `roh.aktien` null oder ≤ 0, Kurs ≤ 0. Lauf 5,2 s, RSS max 1.189 MB.

**Nullpunkt: bestanden** — Orakel 18,59 Pp (t 29,37; L-S 34,40) · Placebo Symbole −0,269 Pp, t −1,18 · Zufall × 12 Mittel
−0,017 / −0,009 Pp, 0 Ziehungen mit |t| ≥ 3, se 0,110, Boden 0,309 · Klinke 0 Verstöße, Positivkontrolle 1 / 1, Leser 69.969
Zugriffe. **Placebo Versatz +21 gefallen: brutto −2,371 Pp, t −4,84** — nach Entscheid §9 (3) nur Diagnose, geht nicht ins
Urteil. Der Mechanismus ist die Fehlerform „Geteilter Kurs": am Tag t + 21 steht im Nenner der Kurs vom Ende des Haltefensters;
wer im Fenster gefallen ist, hat einen kleineren Marktwert, eine höhere Quote und landet im Dezil oben — das Placebo misst die
Halteperiode selbst, mit negativem Vorzeichen. Im Hauptlauf steht der Kurs vom Signaltag t im Nenner und das Halten beginnt zur
Eröffnung des Folgetags a — kein geteilter Kurs; was bleibt, ist die eingebaute Größen-Neigung (kleiner Marktwert ⇒ hoher Wert),
die in der Kombination die Kontrolle `groesse` trägt.

**Einzelmessung:** Dezil oben − Universum netto **+0,47 Pp bei MDE₈₀ 1,38 Pp** (se 0,492, t 0,97, t_HH 1,22, n 92; brutto
+0,485) — nichts oberhalb von 1,38 Pp auflösbar; Long − Short netto 0,574 Pp (t 0,98). Universum 760,5 / mit Wert 201,2
(26,5 %); Dezil 20,3 / 20,0, Auffüllungen 0 / 0; Umschlag 22,1 % (Kosten 0,0197 Pp); Tote 10 (1) / Lücken 4; Regime über /
unter EMA200 +0,131 (n 75) / +1,979 (n 17). Jahresscheiben netto: 2017 +0,86 · 2018 +1,27 · 2019 +0,66 · 2020 +1,67 ·
2021 +0,15 · 2022 −2,38 (t −2,38) · 2023 +3,25 · 2024 −2,77 (t −3,62, dünn); letzte 250 Tage −1,35 Pp (t −1,42, MDE₈₀ 2,78).

**Abdeckung:** 26,5 % des Universums (Klassen 22,4 % / 35,6 % / 56,8 %; Jahre 23,0 % 2017 → 29,2 % 2024); gegenüber `fue`
fehlen zusätzlich 1.275 Symbol-Tage ohne Aktienzahl (1,8 %) und 8 mit Aktienzahl ≤ 0; dafür entfällt die Umsatzbedingung.
Aktienzahl-Tag unter den Ausweisern (`marken.aktienFallback`): CommonStockSharesOutstanding 63,0 %, gewichtete Aktienzahl
basic 32,7 %, Issued 4,3 % — gut ein Drittel der Marktwerte steht auf einem Ausweichtag. Sektormix wie bei `fue` (Verarbeitendes
Gewerbe 66,1 %, Dienstleistungen 29,7 %); Dezil oben 68,7 % / 25,1 %, näher am Ausweiser-Mix als bei `fue`.

**Verteilung:** Median 0,024, Q05 0,004, Q95 0,094 (F&E-Jahresrate je Dollar Marktwert); > 1 in 0,5 % der Symbol-Tage; Maxima
411.686 (2019) und 279.389 (2018) sind Einheitenfehler von Aktienzahl oder Kurs — nichts gekappt, der Rang trägt sie oben mit.
Untere Grenze des Dezils oben 0,05–0,085 je Jahr.

**Fallen (benannt, nicht gemessen):** Split zwischen `filed` und t verzerrt den Marktwert um den Faktor (Aktienzahl alt × Kurs
neu); Rückwärts-Splits sind im Panel nicht bereinigt (Fehlerform 18.09.), `rohSchluss` ist hier bewusst der unbereinigte Kurs;
Ausweichtags der Aktienzahl (37 %); Kurs-Nenner ⇒ das Placebo Versatz kann für diese Zelle nie ≈ 0 sein.

## 3. Laufzeit, Speicher, Verbrauch

`fue` 4,8 s, RSS max 1.190 MB; `fue-marktwert` 5,2 s, RSS max 1.189 MB; Auswertung der Zähler je < 2 s. Verbrauch: siehe
Übergabe (`uebergabe/mehrfaktor-feld-fue-2026-09-22.md`, Pflichtzeile).
