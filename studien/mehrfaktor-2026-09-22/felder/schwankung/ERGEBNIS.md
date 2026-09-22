# Feld `schwankung` (Nr. 3, Signal): Zelle gebaut, Nullpunkt bestanden — 22.09.2026

Auftrag Nr. 51 (`uebergabe/auftrag-mehrfaktor-feld-schwankung-2026-09-22.md`), Vorregistrierung §4 Zeile 3 mit Nachtrag §11.
Maschine `zelle.js` (Kennung `mehrfaktor-2026-09-22/zelle/v1`), Panel `querschnitt-pruefstand-2026-09-13/panel/v2` (9.904.017 Zeilen,
7.338 Reihen, bis 2026-09-15), Klassen 50-250 / 250-1000 / ab1000, **92 Signaltage 2017-01-03 … 2024-08-01**, Rückhaltefenster
ab 2024-09-01 versiegelt (24 Signaltage zurückgehalten). Alle Zahlen stammen aus `zellen/schwankung-bericht.md` und
`zellen/schwankung.json`; Abschnitt 6 ist aus der Zelle nachgerechnet und so gekennzeichnet. Lauf **2,7 s**, RSS max **1.047 MB**,
Node v24.18.0. Die Zelle ist eine Diagnose, kein Urteil. Simulation mit virtuellem Kapital, keine Anlageberatung.

## 1. Bau

- Rohgröße je Symbol am Signaltag t: **−sd(rendite)** über die 252 Panelzeilen `z, zurueck(z,1) … zurueck(z,251)`, `z = sicht.zeileAm(sym)`,
  Stichproben-sd mit Nenner 251; gedreht, die ruhigsten Reihen stehen oben. Einheit = Panel-Spalte `rendite` (Pp = 100 · (Schluss /
  Vorschluss − 1), Float32; Summen in doppelter Genauigkeit).
- `null` bei `z < 0`, bei einer fehlenden der 252 Zeilen (`zurueck < 0`) oder einer nicht endlichen Rendite im Fenster — nie 0, kein
  Ersatzwert, kein Fenster mit 251 Werten.
- Zugriffe nur `sicht.zeileAm`, `sicht.zurueck`, `sicht.felder.rendite`; Schleife fest gefenstert `k = 0 … 251`; zwei Durchläufe
  über ein lokales Feld (Mittel, dann Summe der quadrierten Abweichungen). Kein Rang, kein Dezil, keine Statistik im Modul.
- Gegenprobe vor dem Lauf (Kratzordner, Kunst-Sicht, nicht im Repo; 10 Zusicherungen grün): sd gegen die Paar-Formel
  Σᵢ<ⱼ(xᵢ−xⱼ)²/(n(n−1)) auf 1e-9; genau 252 Zeilen → Zahl, 251 Zeilen → null, NaN an der ersten Reihenzeile im Fenster → null,
  Fenster endet eine Zeile vor der NaN-Zeile → Zahl; keine Zeile am Signaltag → null.
- **Vorzeichen (Auftrag §1b):** Reihe mit sd 1,002 Pp → Rohwert −1,002, Reihe mit sd 4,008 Pp → −4,008; −1,002 > −4,008. Im Lauf:
  Umschlag des Dezils oben 14,0 % je Monat — ein träges Merkmal, wie es die Streuung über ein Jahr sein muss.

**Zähler des Moduls über alle Aufrufe der Maschine (Hauptlauf + Kontrollen: Placebo Versatz, Orakel-Lauf):** Aufrufe 139.938,
Werte 139.728, keine Zeile am Signaltag 186 (nur im Versatz-Lauf: Reihen ohne Zeile 21 Handelstage später), Fenster unvollständig 0,
Rendite nicht endlich 24 (alle im Hauptlauf = `lauf.werteNull` 24).

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
| 2024 | 100,0 % (4477/4477) | 100,0 % (1578/1578) | 100,0 % (265/265) | 100,0 % (6320/6320) |
| **alle** | 99,96 % (52397/52419) | 99,99 % (14984/14986) | 100 % (2564/2564) | **99,97 % (69945/69969)** |

**Gründe der 24 Lücken:** alle 24 sind der **erste Universumseintritt junger Reihen** (IPO oder Abspaltung rund ein Jahr zuvor:
SNAP 2018-03, SPOT 2019-04, CTVA 2020-06, CARR/OTIS 2021-04, LMND, ASO, BBWI/VSCO, CEG, WBD …): am Signaltag davor nicht im
Universum, am nächsten Signaltag 23 mit Wert (1 wieder außerhalb). Das Fenster reicht genau bis zur ersten Panelzeile der Reihe,
deren Rendite keinen Vorschluss hat (NaN). Kein Filing-Tor, keine zu kurze Reihe im Sinne von `zurueck < 0` (Zähler 0, siehe §7).
Universum je Signaltag im Mittel 760,5, mit Wert 760,3; Dezil oben 76,5 / unten 75,6; Auffüllungen (fehlend = mittlerer Rang) 0 / 0.

## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus `konfig.js`) — **bestanden**

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite) | Dezil − Universum brutto **18,59 Pp**, sd 6,10, Mittel/sd 3,05, t 29,37, n 92; Long-Short 34,40 Pp | ≥ 5 Pp, Mittel/sd ≥ 1, t ≥ 8; L-S ≥ 20 Pp (nachrichtlich 20 Pp einseitig: verfehlt) | bestanden |
| Placebo Symbole (je Signaltag permutiert) | brutto **−0,0502 Pp**, t −0,47, se 0,106 | \|t\| < 3 (\|Mittel\| < 0,25 Pp: ja) | bestanden |
| Zufall × 12 | Mittel brutto **−0,0168**, netto + Kosten −0,0093 Pp; \|t\| ≥ 3 in **0** Ziehungen; se je Ziehung **0,1104 Pp**; MDE-Boden **0,3094 Pp**; Umschlag 90,3 % | \|Mittel\| < 0,25 Pp, ≤ 3 Ziehungen | bestanden |
| Leck-Klinke | Hauptlauf **0** Verstöße; Positivkontrolle 2017-01-03 Kurs **1** / Bilanz **1**; Leser nicht geöffnet (0 Zugriffe) | Positivkontrolle je 1, Leser 0 | bestanden |
| Placebo Versatz +21 (nur Diagnose, Entscheid §9 (3)) | brutto **+0,0325 Pp**, t 0,08, se 0,424, Signaltage ohne Versatz 0 | \|t\| < 3 | bestanden (geht nicht ins Urteil; `bestandenMitVersatz` true) |

Der Versatzwert eines trägen Feldes liegt nahe der Einzelmessung; hier +0,03 gegen −0,25 Pp bei se 0,42 / 0,39 — beides innerhalb
des Rauschens, kein Widerspruch. Die Zufallsdezile setzen den MDE-Boden auf 0,31 Pp; das echte Dezil streut stärker (se 0,389,
Faktor 3,5 über der Zufalls-se, wie in `MACHBARKEIT.md` §7 erwartet: Faktor 2–4).

## 4. Einzelmessung (Diagnose, kein Urteil) — Dezil oben gegen Universum, Pp je Monat

| Reihe | Mittel | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | −0,2453 | 0,3889 | −0,63 | −0,63 | 1,0896 | 92 |
| Dezil oben − Universum, **netto** | **−0,2493** | 0,3890 | −0,64 | **−0,64** | **1,0897** | 92 |
| Long − Short, brutto (verlangt Leihe) | −0,8356 | 1,0641 | −0,79 | — | 2,9811 | 92 |
| Long − Short, netto | −0,8323 | 1,0641 | −0,79 | — | 2,9811 | 92 |

**−0,25 Pp netto bei MDE₈₀ 1,09 Pp (t_HH −0,64): nichts oberhalb von 1,09 Pp auflösbar**; das Vorzeichen trägt bei dieser
Auflösung keine Aussage. Long-Short −0,83 Pp bei MDE₈₀ 2,98 — das Dezil unten (die unruhigsten Reihen) lag +0,59 Pp brutto / +0,58
netto über dem Universum. Umschlag Dezil 14,0 % / Universum 7,9 % je Monat; Kosten (Kassa-Hürde je Klasse × Umschlag) 0,0116 / 0,0075
Pp je Monat. Tote im Dezil oben 17 (0 Totalverlust) / Lücken 41. Regime: SPY über EMA200 +0,157 Pp (n 75, t 0,42), unter EMA200
−2,043 Pp (n 17, t −1,70). Signaltage unter 100 Mitgliedern: 0.

**Jahresscheiben** (netto, Dezil oben − Universum):

| Jahr | n | brutto | netto | se | t | MDE₈₀ | |
|---|---|---|---|---|---|---|---|
| 2017 | 12 | −0,3341 | −0,3385 | 0,6008 | −0,59 | 1,6832 | |
| 2018 | 12 | 0,8866 | 0,8813 | 0,6428 | 1,43 | 1,8009 | |
| 2019 | 12 | −0,4344 | −0,4379 | 1,1549 | −0,40 | 3,2356 | |
| **2020** | 12 | −1,7955 | **−1,8027** | 1,4309 | −1,32 | 4,0089 | März-Schock; nur berichtet |
| 2021 | 12 | −0,2300 | −0,2330 | 1,2183 | −0,20 | 3,4131 | |
| **2022** | 12 | 1,1840 | **1,1815** | 0,8858 | 1,39 | 2,4818 | nur berichtet |
| 2023 | 12 | −1,6832 | −1,6856 | 1,4252 | −1,24 | 3,9928 | |
| 2024 | 8 | 0,7894 | 0,7850 | 0,9241 | 0,91 | 2,5891 | dünn |

2020: −1,80 Pp bei MDE₈₀ 4,01 (der Schock-Monat liegt in einer Scheibe mit se 1,43); 2022: +1,18 Pp bei MDE₈₀ 2,48. Keine Scheibe
löst etwas auf. **Letzte 250 Tage** (ab 2023-08-03): netto +0,2161 Pp bei MDE₈₀ 2,44 (se 0,871, t 0,26, n 12).

## 5. Umschlag × Hürde gegen Literatur × ½

Kosten des Dezils oben 0,0116 Pp je Monat (Umschlag 14,0 % × Klassenmix-Hürde) gegen die halbe Literaturzahl 0,25–0,35 Pp (½ von
0,5–0,7 Pp, Ang et al. 2006, Frazzini/Pedersen 2014): die Kosten sind 3–5 % davon — die Kostenfrage stellt sich für dieses Feld nicht,
die Auflösung (MDE₈₀ 1,09 Pp gegen 0,25–0,35 Pp erwartet) ist die Hürde.

## 6. Verteilung der sd im Universum (Auftrag §1b; aus `zellen/schwankung.json` nachgerechnet, Kratzordner-Skript, nur beschreibend)

sd in Pp je Symbol-Tag (Vorzeichen zurückgedreht), Quantile über alle Mitglieder mit Wert:

| Jahr | Symbol-Tage | null | 5 % | 25 % | 50 % | 75 % | 95 % |
|---|---|---|---|---|---|---|---|
| 2017 | 8049 | 5 | 0,891 | 1,179 | 1,533 | 2,068 | 3,360 |
| 2018 | 8492 | 4 | 0,947 | 1,247 | 1,553 | 2,056 | 3,204 |
| 2019 | 8324 | 3 | 1,085 | 1,465 | 1,791 | 2,407 | 3,503 |
| 2020 | 9060 | 2 | 1,271 | 2,279 | 2,878 | 3,704 | 5,475 |
| 2021 | 10176 | 4 | 1,291 | 1,881 | 2,652 | 3,640 | 6,059 |
| 2022 | 10302 | 3 | 1,227 | 1,649 | 2,151 | 3,092 | 5,246 |
| 2023 | 9246 | 3 | 1,295 | 1,712 | 2,203 | 3,053 | 4,999 |
| 2024 | 6320 | 0 | 1,103 | 1,412 | 1,815 | 2,435 | 4,123 |
| alle | 69945 | 24 | 1,074 | 1,513 | 2,047 | 2,915 | 4,865 |

Der Median steigt 2020 auf 2,88 Pp (Fenster mit März 2020) und bleibt 2021 hoch (2,65); 2017/18 lag er bei 1,53–1,55.
Ausreißer, nicht gekappt: sd > 5 Pp 3.153 Symbol-Tage (373 Symbole), > 10 Pp 195 (40), > 20 Pp 34 (7), **> 100 Pp 4 (2 Symbole):
SN 2024-05/06/07 je 732,6 Pp und CORZ 2024-08 282,6 Pp** — das verlangt eine Tagesrendite von mehreren tausend Prozent im Fenster,
eher ein Skalenfehler im Panel als Markt (siehe §7); DWAC 2022-03…06 24,5–24,7 Pp (SPAC-Phase, plausibel). Minimum 0,392 Pp
(NXPI 2018-02-01); sd < 0,6 Pp 23 Symbol-Tage aus 7 Symbolen (NXPI, MON 2017/18 — Übernahmeziele mit festgestelltem Kurs), < 0,8 Pp 302.

**Klassenmix des Dezils oben (50-250 / 250-1000 / ab1000): aus der Zelle nicht bestimmbar.** Die Zelle trägt je Signaltag nur `tag,
ausfuehrung, ende, werte` — keine Klasse je Symbol — und der Bericht der Maschine weist die Klassenzusammensetzung des Dezils nicht
aus. Ein eigener Zugriff auf die Panel-Klasse wäre eine zweite Maschine (Vorlage §5). Befund an den PM; die Kontrollgrößen der
Kombination (Größe) messen es später. Die Abdeckung je Klasse (§2) ist davon unberührt.

## 7. Fallstricke

1. **Skalenfehler-Kandidaten im Panel:** SN (3 Signaltage 2024, sd 732,6) und CORZ (2024-08, 282,6) — eine Tagesrendite in der
   Größenordnung 10⁴ % im Fenster, der Form nach ein Sprungpaar (Fehlerform „Skalenfehler zeigen Sprungpaare"). Für das Dezil oben
   folgenlos (beide im Dezil unten), für Long-Short und jedes Panel-Feld mit Renditefenster relevant. Nicht gekappt; zur Prüfung des
   Panels an den PM.
2. **Festgestellte Kurse ganz oben:** Übernahmeziele mit laufendem Angebot (NXPI, MON 2017/18) haben sd 0,39–0,49 Pp und stehen im
   Dezil oben; ihre Folgerendite ist die Angebotsspanne, keine Schwankungsprämie. Nur berichtet, 23 Symbol-Tage.
3. **Erster Universumseintritt = null:** 24 junge Reihen (IPO/Abspaltung ein Jahr zuvor) liefern am ersten Signaltag im Universum
   keinen Wert, weil das Fenster die erste Panelzeile (Rendite NaN) erreicht; ab dem nächsten Signaltag haben sie einen Wert.
4. **Zähler, der nie feuerte:** `fensterUnvollstaendig` (`zurueck < 0`) blieb in 139.938 Aufrufen bei 0 — keine Reihe mit weniger als
   252 Zeilen war je Mitglied. Laut Haiku-Unteragent (eine Frage an `pruefstand.js`): `zurueck` liefert −1 außerhalb der Reihe und sonst
   nur Indizes derselben Reihe (Z. 84, kein Fremdwert im Fenster); die Universumsregel verlangt Position ≥ 250 in der Reihe (Z. 108),
   also mindestens 251 Zeilen — sie allein erklärt nicht, warum nie eine 251-Zeilen-Reihe, aber 24-mal eine 252-Zeilen-Reihe Mitglied
   war. Vermutung: eine weitere Universumsmarke (Qualität, 6.816 Verworfene) verlangt 252 Zeilen. Für die Werte folgenlos; als
   Beobachtung an den PM.
5. Renditen sind Kursrenditen ohne Ausschüttungen (Kopf des Berichts): Dividendenabschläge zählen als Schwankung. Einheitlich für
   alle Reihen, nur erwähnt.
6. Placebo Versatz ist bei einem trägen Feld keine Nullkontrolle (Entscheid §9 (3)); hier +0,03 Pp, ohne Aussage.

## 8. Laufzeit, RSS, Verbrauch

Tafel 0,65 s, Lauf gesamt 2,7 s (Erwartung 5–15 s unterschritten: ein Aufruf von `zurueck` je Fensterzeile, kein Präfix), RSS max
1.047 MB. Verbrauch: Werkzeugzähler 184k beim ersten Commit (15.000.000 − 14.816.434; der Zähler misst den Kontextaufbau, also die einzige verfügbare Abrechnungszahl), ≈ 190k beim zweiten; davon ≈ 60k Systemkontext beim Start. Haiku-Unteragent 39.710 zusätzlich. Budget 120k um gut die Hälfte überschritten: Leseliste (7 Runden), Bau + Gegenprobe (2), Lauf, Nachrechnen der §1b-Größen, Klärung des nie feuernden Zählers, Berichtigung dieser Zeile.

Dateien: `felder/schwankung/feld.js`, `felder/schwankung/ERGEBNIS.md`, `zellen/schwankung.json`, `zellen/schwankung-nullpunkt.json`,
`zellen/schwankung-bericht.md` (die drei aus der Maschine). Nichts an `zelle.js`, `test.js`, `pruefung/`, fremden Feldern oder Zellen.
