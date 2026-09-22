# Feld `umkehr` — Ergebnis der Zelle (Auftrag Nr. 50, 22.09.2026)

Kurzfrist-Umkehr, Nr. 2 der Feldseite. Rolle: **Kostenfrage, nicht gewichtet, wird nicht kombiniert** (Vorregistrierung §4 Zeile 2,
Fassung mit Nachtrag §11; §5). Formel: `−100 · (bSchluss[z] / bSchluss[zurueck(z, 21)] − 1)` in Pp mit `z = sicht.zeileAm(sym)`,
gedreht — die Verlierer des letzten Monats stehen oben. `null` bei fehlender Zeile am Signaltag, fehlender 21. Vorzeile, Nenner ≤ 0
oder nicht endlichem Wert; nie 0 als Ersatz. Maschine `zelle.js` (`mehrfaktor-2026-09-22/zelle/v1`), Lauf 2026-09-22 13:30 UTC,
ohne `--rueckhalte` (`rueckhalte: false`, 92 Signaltage 2017-01-03 … 2024-08-01, 24 zurückgehalten). Alle Zahlen aus
`zellen/umkehr-bericht.md` und `zellen/umkehr.json`; nur §5 (Quantile) ist aus den Rohwerten der eigenen Zelle abgelesen — kein Rang,
kein Dezil, keine Statistik. Die Zelle ist kein Urteil. Simulation mit virtuellem Kapital, keine Anlageberatung.

**Vorzeichen-Probe vor dem Lauf** (Kunst-Sicht, Kratzordner, nicht im Repo): −10 % im Monat ⇒ +10; +5 % ⇒ −5; Absturz um 50 % ⇒ +50
(und nur die 21. Vorzeile zählt, mit der 20. oder 22. käme 0); fünf Lücken (keine Zeile, Reihe zu kurz, Nenner 0, Nenner null,
Zähler NaN) ⇒ `null`; unverändert ⇒ 0 (IEEE liefert `-0`; für Rang, Mittel und JSON gleich 0). Neun Aufrufe, alle grün.

## 1. Abdeckung

**100 % in jeder Klasse und jedem Jahr**: 69.969 Symbol-Signaltage, 0 `null` (`lauf.werteNull` 0). Grund: das Universum verlangt
250 Vortage, die 21. Vorzeile ist damit immer vorhanden; kein Nenner ≤ 0, kein nicht endlicher Wert. Auffüllungen (fehlender Wert =
mittlerer Rang) im Dezil oben / unten: **0 / 0**. Bilanz nicht benutzt (`bilanzZugriffe` 0, Leser nicht geöffnet).

| Jahr | 50-250 | 250-1000 | ab1000 | gesamt |
|---|---|---|---|---|
| 2017 | 100,0 % (6615/6615) | 100,0 % (1282/1282) | 100,0 % (152/152) | 100,0 % (8049/8049) |
| 2018 | 100,0 % (6797/6797) | 100,0 % (1478/1478) | 100,0 % (217/217) | 100,0 % (8492/8492) |
| 2019 | 100,0 % (6615/6615) | 100,0 % (1471/1471) | 100,0 % (238/238) | 100,0 % (8324/8324) |
| 2020 | 100,0 % (6766/6766) | 100,0 % (1930/1930) | 100,0 % (364/364) | 100,0 % (9060/9060) |
| 2021 | 100,0 % (7231/7231) | 100,0 % (2437/2437) | 100,0 % (508/508) | 100,0 % (10176/10176) |
| 2022 | 100,0 % (7111/7111) | 100,0 % (2670/2670) | 100,0 % (521/521) | 100,0 % (10302/10302) |
| 2023 | 100,0 % (6807/6807) | 100,0 % (2140/2140) | 100,0 % (299/299) | 100,0 % (9246/9246) |
| 2024 (dünn, 8 Monate) | 100,0 % (4477/4477) | 100,0 % (1578/1578) | 100,0 % (265/265) | 100,0 % (6320/6320) |

Zähler des Moduls **über alle Aufrufe der Maschine (Hauptlauf + Kontrollen)**: 139.938 Aufrufe, 186 ohne Zeile, 0 ohne Vorzeile,
0 Nenner ≤ 0, 0 nicht endlich, 139.752 Werte. Die 186 stammen aus dem Placebo Versatz (Lesen 21 Handelstage nach t: Symbole, die in
der Halteperiode aus dem Panel gingen); der Hauptlauf hat 0 (69.969 Aufrufe = 69.969 Werte). Orakel und Placebo Symbole rufen
`werte` nicht erneut auf.

## 2. Nullpunkt — **bestanden** (vier Kontrollen; Placebo Versatz nur Diagnose, Entscheid §9 (3))

| Kontrolle | Ergebnis | Schranke | Urteil |
|---|---|---|---|
| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto **18,59 Pp**, sd 6,10, Mittel/sd 3,05, t 29,37, n 92; Long − Short **34,40 Pp** | ≥ 5 Pp horizontgleich, Mittel/sd ≥ 1, t ≥ 8; L-S ≥ 20 Pp; nachrichtlich 20 Pp einseitig: verfehlt | bestanden |
| Placebo Symbole (je Signaltag permutiert) | brutto **0,066 Pp**, t 0,65, n 92 | \|t\| < 3 (\|Mittel\| < 0,25 Pp: ja, nachrichtlich) | bestanden |
| Zufall × 12 | Mittel brutto **−0,017**, netto + Kosten −0,009 Pp; \|t\| ≥ 3 in **0** Ziehungen; se je Ziehung 0,110 Pp; MDE-Boden 0,309 Pp; Umschlag eines Zufallsdezils 90,3 % | \|Mittel\| < 0,25 Pp, ≤ 3 Ziehungen | bestanden |
| Leck-Klinke (Kurs und Bilanz) | Hauptlauf **0** Verstöße; Positivkontrolle am 2017-01-03: Kurs 1, Bilanz 1 (Soll je 1); Leser nicht geöffnet, 0 Zugriffe | Positivkontrolle je 1, Leser 0 | bestanden |
| *Placebo Versatz +21 Handelstage (Diagnose)* | brutto **−15,08 Pp**, netto −15,14, t **−42,91**, se 0,353, n 92; Signaltage ohne Versatz 0 | \|t\| < 3 | *gefallen — erwartet* |

`nullpunkt.bestanden = true`, `bestandenMitVersatz = false` (nachrichtlich). Der Versatzwert dieses Feldes ist die Rendite des
Haltefensters selbst (Vormonatsrendite, 21 Handelstage später gelesen = die Halteperiode, gedreht): das Dezil oben sind dann die
Verlierer der Halteperiode, der Placebo ist das Orakel mit umgekehrtem Vorzeichen (−15,1 gegen +18,6 Pp; die Differenz im Betrag
kommt daher, dass der Versatz Panelzeilen von t+21 rangiert, das Orakel die Rendite Eröffnung(a) → Eröffnung(a′)). Berichtet, nicht
gedeutet, nicht repariert (Auftrag §1b).

## 3. Einzelmessung (Diagnose, kein Urteil)

| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |
|---|---|---|---|---|---|---|
| Dezil oben − Universum, brutto | 0,157 | 0,484 | 0,33 | 0,32 | 1,356 | 92 |
| Dezil oben − Universum, **netto** | **0,095** | 0,484 | 0,20 | 0,19 | **1,356** | 92 |
| Long − Short, brutto (Diagnose, verlangt Leihe) | 0,266 | 0,664 | 0,40 | – | 1,861 | 92 |
| Long − Short, netto | 0,265 | 0,664 | 0,40 | – | 1,861 | 92 |

Satzform: **0,095 Pp netto bei MDE₈₀ 1,356** — nichts oberhalb von 1,36 Pp bei MDE₈₀ 1,36 im Rechenfenster auflösbar; t_HH 0,19
gegen die Schwelle 3 (Entscheid §9 (6)). Die Literaturzahl ×½ (≈ 0,5 Pp) liegt selbst unter der MDE₈₀ — die Einzelmessung kann sie
weder zeigen noch ausschließen (Fehlerform „Die Wand hängt an der Haltedauer").

| Größe | Wert |
|---|---|
| Universum je Signaltag (Mittel) / davon mit Wert | 760,5 / 760,5 |
| Dezil oben / unten (Mittel) | 76,5 / 75,6 |
| Auffüllungen im Dezil oben / unten (Summe über 92 Signaltage) | 0 / 0 |
| Dezil unten − Universum brutto / netto | −0,108 / −0,170 Pp |
| Umschlag Dezil / Universum je Monat | **84,6 %** / 7,9 % |
| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | **0,069** / 0,007 Pp |
| Tote im Dezil oben (davon Totalverlust) / Lücken | 13 (0) / 14 |
| Signaltage unter 100 Mitgliedern | 0 |
| Regime SPY über / unter EMA200, netto | −0,280 Pp (n 75, se 0,465) / +1,750 Pp (n 17, se 1,610) |

**Jahresscheiben** (Dezil oben − Universum):

| Jahr | n | brutto | netto | se | t | MDE₈₀ |
|---|---|---|---|---|---|---|
| 2017 | 12 | 0,278 | 0,220 | 0,711 | 0,32 | 1,993 |
| 2018 | 12 | 0,096 | 0,030 | 0,501 | 0,06 | 1,404 |
| 2019 | 12 | 0,910 | 0,844 | 0,700 | 1,26 | 1,960 |
| 2020 | 12 | 0,380 | 0,316 | 2,065 | 0,16 | 5,785 |
| 2021 | 12 | −0,041 | −0,100 | 1,566 | −0,07 | 4,386 |
| 2022 | 12 | −2,059 | −2,117 | 1,561 | −1,42 | 4,373 |
| 2023 | 12 | 1,503 | 1,441 | 1,816 | 0,83 | 5,089 |
| 2024 (dünn) | 8 | 0,206 | 0,145 | 1,066 | 0,15 | 2,986 |

Keine Jahresscheibe erreicht ihre eigene MDE₈₀; die Vorzeichen wechseln (2022 −2,1, 2023 +1,4). **Letzte 250 Tage** (Signaltag ≥
2023-08-03): netto −0,272 Pp (se 0,954, t −0,30, MDE₈₀ 2,672, n 12), brutto −0,212.

## 4. Die Kostenfrage (die eine Frage dieser Zelle)

**Umschlag des Dezils 84,6 % je Monat × Kassa-Hürde je Klasse ⇒ 0,069 Pp je Monat** (Universum 7,9 % ⇒ 0,007 Pp) gegen Literatur ×½
≈ 0,5 Pp ⇒ die Kosten sind ≈ 14 % der halbierten Literaturzahl; ≈ 7 % der vollen (≈ 1 Pp, Jegadeesh 1990). Die Erwartung des Auftrags
(85–95 % Umschlag, ≈ 0,07 Pp) ist getroffen; das Umkehr-Dezil dreht etwas **weniger** um als ein Zufallsdezil (84,6 gegen 90,3 %),
das Feld hat also eine leichte Persistenz von Monat zu Monat. Brutto − netto der Einzelmessung = 0,062 Pp = Kosten Dezil − Kosten
Universum. Das Netto (0,095 Pp bei MDE₈₀ 1,36) ist Diagnose; das Feld wird nicht kombiniert.

## 5. Verteilung der Rohwerte (Quantile, gepoolt über 92 Signaltage, 69.969 Werte)

| min | P1 | P5 | P25 | Median | P75 | P95 | P99 | max | Mittel |
|---|---|---|---|---|---|---|---|---|---|
| −1068,22 | −37,91 | −19,39 | −6,60 | −0,93 | 4,90 | 15,95 | 29,20 | 88,97 | −1,28 |

- Die Größe ist nach unten unbeschränkt (ein Kurs, der sich im Monat vervielfacht, bekommt −100·(Faktor − 1)) und nach oben durch
  +100 beschränkt (Totalverlust). **46 Werte < −100** (Kurs mehr als verdoppelt), 0 Werte > +100, 79 Werte exakt 0. Extrem:
  2021-02-01 min −1068 (Kurs im Januar 2021 ×11,7; Querschnittsmittel des Tages −7,25); größter Wert 88,97 am 2022-11-01.
- Querschnittsmittel je Signaltag von −19,4 (2020-05-01, nach der April-Erholung) bis +24,1 (2020-04-01, nach dem März-Einbruch);
  für den Rang je Signaltag ist die Lage ohne Bedeutung, für Long-Short-Beträge nicht.
- Nichts gekappt, nichts winsorisiert (§1a.7). Der Rang ist ordinal; die Ausreißer ändern die Dezile nicht, nur die Skala der Rohwerte.

## 6. Fallstricke der Tafel und der Zelle

1. **Placebo Versatz = Halteperiode** (§2): gefallen mit t −42,9, erwartet, nur Diagnose. Wer diese Zelle mit einem trägen Feld
   vergleicht, muss `bestandenMitVersatz` ignorieren; das Urteil steht in `bestanden`.
2. **Geteilter Kurs / Spannenrückprall:** das Signal endet am Schluss von t, das Haltefenster beginnt zur Eröffnung von a — kein
   gemeinsamer Kurs mit der Zielgröße. Die Literaturzahl (≈ 1 Pp) ist Schluss→Schluss gemessen und enthält den Rückprall der
   Geld-Brief-Spanne (Nagel 2012: etwa die Hälfte); ein Teil davon sitzt zwischen Schluss(t) und Eröffnung(a) und ist im Fenster der
   Maschine nicht enthalten. Das ist eine Eigenschaft der Konvention (Entscheid §9 (1)), kein Fehler der Zelle.
3. **Tote im Dezil oben: 13 in 92 Monaten** (Totalverlust 0, Lücken 14) — die Verlierer des Vormonats ziehen Abgänge an; die
   Haltefunktion rechnet sie nach §3.6 Teil 1. Zum Vergleich hat das Universum je Signaltag 760 Mitglieder.
4. **Zähler des Moduls sind keine Abdeckung:** sie laufen über Hauptlauf und Placebo Versatz (139.938 Aufrufe); die 186 `null`
   liegen alle im Versatzlauf. Abdeckung der Zelle: Bericht §2 (100 %).
5. **`-0`**: die wörtliche Formel liefert bei unverändertem Kurs `-0`; Vergleich, Rang, Mittel und JSON (`0`) behandeln es als 0.
6. **Universumsfilter der Maschine** (nachrichtlich, `einzelmessung.zaehler.verworfen`): Klasse 279.743, Cent-Boden 1.010, Vortage
   1.484, Qualität 6.816, Ausführung 13 Symbol-Signaltage — alles vor dem Feld, nichts davon ist eine Lücke des Feldes.

## 7. Laufzeit, RSS, Verbrauch

- Lauf **2,56 s** (Tafel 0,62 s; Wandzeit 2,8 s), **RSS max 1047 MB**, Node v24.18.0; `zellen/` von der Maschine angelegt.
- Aufruf genau wie §1a.5: `cd studien/mehrfaktor-2026-09-22 && node --max-old-space-size=6144 zelle.js --feld felder/umkehr/feld.js`.
- Tokenverbrauch: siehe Übergabe (Pflichtzeile; Zähler des Sitzungsrahmens, nicht Selbstschätzung).
