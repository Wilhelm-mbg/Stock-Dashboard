# Ergebnis Zusatz C: die Spannen der verschwundenen Werte

**Registrierung:** `VORREGISTRIERUNG.md` §6 (Zusatz C) und **§9b** (die Ziehung,
Commit `30c5626`) — §9b ist geschrieben und committet worden, **bevor** `zusatzC.js`
gebaut wurde. **Schritt 0:** `probeC.js`, 5 von 5 verschwundenen Werten liefern einen
Quote aus ihrer Lebenszeit, 0 von 5 noch einen 60 Handelstage nach dem letzten Balken.
**Rohdaten:** `E:/Markt-Dashboard-Archiv/spannen` (zusatzC-2025.jsonl, zusatzC-2026.jsonl), nur gelesen.
**Hauptergebnis (Rahmen A):** `ERGEBNIS.md` — unverändert. Ausgewertet am 2026-09-03 11:11 UTC.

> **Rahmen C wird nie in die Haupttabellen gemischt** (§6). Dieser Bericht steht neben
> `ERGEBNIS.md`, nicht darin. Die Kassa-Hürden in `wiki/kosten.md` bleiben, was sie sind.

## 1. Die Kontrollen — vor jeder Zahl

### 1.1 Positivkontrolle: beide Rahmen laufen durch dieselbe Funktion

`auswertenC.js` rechnet Rahmen C und Rahmen A mit **derselben** `zelle()` aus
`auswerten.js` (per `require`, nicht nachgebaut). Der Beweis, dass sie dabei nichts
anderes tut als das Original: für Rahmen A, Fenster `mitte`, ab 2021 müssen exakt die
vier Mediane aus `ERGEBNIS.md` §3 herauskommen.

| Klasse | Soll (`ERGEBNIS.md`) | Ist (`auswertenC.js`) | |
|---|---|---|---|
| 5-50 | 0,1569 | **0,1569** | stimmt |
| 50-250 | 0,0854 | **0,0854** | stimmt |
| 250-1000 | 0,0647 | **0,0647** | stimmt |
| ab1000 | 0,0449 | **0,0449** | stimmt |

**4 von 4 Stellen stimmen — bestanden.** Ohne diese Zeile wäre jede
Differenz unten zum unbekannten Teil ein Unterschied der Werkzeuge.

### 1.2 Lebenszeit-Kontrolle: keine Abwicklungsphase

§9b.2 verlangt, dass jedem gezogenen Tag noch mindestens **20 volle Handelstage**
folgen — die letzten Wochen vor einem Delisting sind Abwicklung, nicht Handel, und sie
zu messen und „so handeln Verschwundene" zu nennen wäre ein Ausschluss auf die
Zielgröße mit umgekehrtem Vorzeichen.

| Prüfung | Soll | Ist | |
|---|---|---|---|
| Zeitpunkte nach dem letzten Handelstag | 0 | **0** | bestanden |
| Zeitpunkte in den letzten 20 Handelstagen | 0 | **0** | bestanden |

### 1.3 Zeitstempel-Kontrolle (die `iex`-Falle, §1.1)

Zu jeder Zeile steht der **gelieferte** Zeitstempel `tq` in den Rohdaten. Der Versatz
zum angefragten Zeitpunkt muss positiv sein (`sort=desc` liefert den letzten Quote
*vor* T); ein negativer Wert oder ein falsches Jahr wäre die Falle.

| Größe | Wert |
|---|---|
| Median | 3,4 s |
| p90 | 22,0 s |
| Maximum | 298,2 s |
| **negative Versätze (Quote NACH dem Zeitpunkt)** | **0** — keiner |

### 1.4 Placebo (vorbörslich 08:00 ET gegen `mitte`, dieselben Symbol-Tage)

| Größe | Soll (§7) | Ist |
|---|---|---|
| Placebo-Zeitpunkte | — | 49 (davon ohne Quote 30) |
| verwertbare Paare | n ≥ 20 | **19** |
| vorbörslich / `mitte` | **Faktor ≥ 2** | 1,5315 gegen 0,1337 → **Faktor 11,46** |
| | | **zu wenige Paare — die Kontrolle trägt nicht** |

### 1.5 Was dieser Vergleich auflösen kann — vor dem Urteil, nicht danach

Gerechnet **allein auf Rahmen A**, ohne eine Zahl des Rahmens C: `nC` Symbole spielen
die Verschwundenen, der Rest die Überlebenden. Die **Nullkontrolle** muss die Null im
Band haben (beide Hälften sind derselbe Rahmen). Die **kleinste erkennbare Wirkung**
ist der kleinste eingespritzte Aufschlag, bei dem das Band die Null gerade ausschließt.

| Klasse | Symbole C / A | Nullkontrolle | Band der Nullkontrolle | **kleinste erkennbare Wirkung** |
|---|---|---|---|---|
| **5-50** | 141 / 55 | +0,0134 | [-0,0494, +0,0505] — Null drin ✓ | **0,0550 Pp** |
| **50-250** | 51 / 138 | -0,0137 | [-0,0461, +0,0276] — Null drin ✓ | **0,0500 Pp** |

> **Wie das zu lesen ist:** ein „nicht entscheidbar" unten heißt **nicht** „kein
> Unterschied". Es heißt: der Unterschied ist kleiner als die Zahl in der letzten
> Spalte — oder es gibt ihn nicht, und der Vergleich kann die beiden Fälle nicht
> trennen. *(Diese Zeile ist nach dem Commit von §9b entstanden und steht deshalb
> nicht dort; sie ist gerechnet, bevor die erste Zahl des Rahmens C vorlag, und ändert
> keine registrierte Regel — sie sagt nur, was die registrierte Regel sehen kann.)*

## 2. Der Lauf in Zahlen

| Größe | Rahmen C (Verschwundene) | Rahmen A (Überlebende, `ERGEBNIS.md`) |
|---|---|---|
| Zeitpunkte | **3615** | 55.455 |
| davon mit gültiger Spanne | 3602 (99,6 %) | 55.067 (99,3 %) |
| „kein Quote" | 12 | 386 |
| gekreuzt (`ap < bp`) | 0 | 2 |
| Nullkurs | 1 | 0 |
| gesperrt (`bp = ap`, Spanne 0) | 2 | — |
| Placebo-Zeitpunkte | 49 | 740 |

Der Fehlanteil bleibt unter der 20-%-Schwelle aus §7. *(§9b.5 hatte für sterbende
Werte mehr erwartet als die 0,7 % des Rahmens A — der Vergleich steht in der Tabelle.)*

## 3. Rahmen C je Zelle — die Verschwundenen allein

Symbol-Median der notierten Spanne in Pp je Umlauf, Band = 95-%-Perzentilband aus
1.000 Cluster-Bootstrap-Ziehungen über Symbole. **Bodenspanne** = `100/Median-Kurs ×
0,01`, die arithmetische Untergrenze der Zelle (§9b.4a). ⚠ = weniger als 10 Symbole.

| Klasse | Jahr | Fenster | n | Zeitpunkte | Symbole | **Symbol-Median** | roher Median | p75 | 95-%-Band | fehlend | gesperrt | Median-Kurs | am Cent-Boden | **Bodenspanne** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5-50 | 2025 | eroeffnung | 497 | 497 | 100 | **0,4395** | 0,4115 | 0,7528 | [0,3757, 0,4997] | 0,6 % | 0 | 16,96 $ | 26 % | 0,0589 |
| 5-50 | 2025 | mitte | 495 | 495 | 100 | **0,1864** | 0,1750 | 0,2857 | [0,1596, 0,2101] | 1,0 % | 0 | 16,88 $ | 43 % | 0,0592 |
| 5-50 | 2025 | schluss | 499 | 499 | 100 | **0,1229** | 0,1270 | 0,2046 | [0,1056, 0,1418] | 0,2 % | 0 | 17,05 $ | 53 % | 0,0587 |
| 5-50 | 2026 | eroeffnung | 327 | 327 | 66 | **0,3655** | 0,3503 | 0,8854 | [0,2671, 0,4652] | 0,9 % | 0 | 20,93 $ | 29 % | 0,0478 |
| 5-50 | 2026 | mitte | 329 | 329 | 66 | **0,1486** | 0,1415 | 0,2388 | [0,1142, 0,1984] | 0,3 % | 0 | 21,18 $ | 51 % | 0,0472 |
| 5-50 | 2026 | schluss | 330 | 330 | 66 | **0,0938** | 0,0930 | 0,1841 | [0,0760, 0,1294] | 0,0 % | 0 | 21,15 $ | 60 % | 0,0473 |
| 50-250 | 2025 | eroeffnung | 210 | 210 | 42 | **0,1851** | 0,2029 | 0,4633 | [0,1312, 0,3314] | 0,0 % | 0 | 58,21 $ | 21 % | 0,0172 |
| 50-250 | 2025 | mitte | 210 | 210 | 42 | **0,0834** | 0,0833 | 0,1507 | [0,0544, 0,1003] | 0,0 % | 2 | 58,38 $ | 31 % | 0,0171 |
| 50-250 | 2025 | schluss | 210 | 210 | 42 | **0,0523** | 0,0475 | 0,0919 | [0,0405, 0,0731] | 0,0 % | 0 | 58,97 $ | 41 % | 0,0170 |
| 50-250 | 2026 | eroeffnung | 115 | 115 | 23 | **0,0983** | 0,1371 | 0,4885 | [0,0264, 0,4301] | 0,0 % | 0 | 52,95 $ | 37 % | 0,0189 |
| 50-250 | 2026 | mitte | 115 | 115 | 23 | **0,0696** | 0,0696 | 0,1606 | [0,0208, 0,1146] | 0,0 % | 0 | 54,08 $ | 50 % | 0,0185 |
| 50-250 | 2026 | schluss | 115 | 115 | 23 | **0,0439** | 0,0472 | 0,0971 | [0,0198, 0,0719] | 0,0 % | 0 | 54,03 $ | 56 % | 0,0185 |
| 250-1000 | 2025 | eroeffnung | 20 | 20 | 4 | **0,1752** ⚠ | 0,1602 | 0,2244 | zu dünn | 0,0 % | 0 | 170,88 $ | 0 % | 0,0059 |
| 250-1000 | 2025 | mitte | 20 | 20 | 4 | **0,0564** ⚠ | 0,0477 | 0,0752 | zu dünn | 0,0 % | 0 | 170,50 $ | 0 % | 0,0059 |
| 250-1000 | 2025 | schluss | 20 | 20 | 4 | **0,0350** ⚠ | 0,0379 | 0,0484 | zu dünn | 0,0 % | 0 | 169,50 $ | 10 % | 0,0059 |
| 250-1000 | 2026 | eroeffnung | 30 | 30 | 6 | **0,1073** ⚠ | 0,0944 | 0,2788 | zu dünn | 0,0 % | 0 | 105,65 $ | 30 % | 0,0095 |
| 250-1000 | 2026 | mitte | 30 | 30 | 6 | **0,0328** ⚠ | 0,0328 | 0,0707 | zu dünn | 0,0 % | 0 | 106,90 $ | 37 % | 0,0094 |
| 250-1000 | 2026 | schluss | 30 | 30 | 6 | **0,0315** ⚠ | 0,0327 | 0,0433 | zu dünn | 0,0 % | 0 | 107,13 $ | 40 % | 0,0093 |

## 4. Die Differenz zu Rahmen A — der eigentliche Endpunkt

`Median(C) − Median(A)` in Pp, Band aus dem Zwei-Stichproben-Cluster-Bootstrap
(1.000 Ziehungen, beide Seiten unabhängig, ganze Symbole). **Entscheidungsregel aus
§9b.4: „Verschwundene handeln breiter" gilt als belegt, wenn das Band die Null
ausschließt und die Differenz positiv ist. Schließt es die Null ein, lautet der Befund
„nicht entscheidbar" — nicht „kein Unterschied".**

### 4.1 Die primären Zellen — in §9b.4 vorab benannt

Fenster `mitte`, Klassen **5-50** und **50-250**, Jahre **2025 und 2026 gepoolt**.
Das sind **zwei** Differenzen; alles andere steht nachrichtlich daneben.

| Klasse | Rahmen C | Rahmen A | **Differenz** | 95-%-Band | Symbole C / A | Bodenspanne C / A | Urteil |
|---|---|---|---|---|---|---|---|
| **5-50** | 0,1699 | 0,1678 | **+0,0021** | [-0,0324, +0,0412] | 141 / 196 | 0,0545 / 0,0357 | nicht entscheidbar (Band schließt die Null ein) |
| **50-250** | 0,0685 | 0,1134 | **-0,0449** | [-0,0871, -0,0123] | 51 / 189 | 0,0176 / 0,0157 | **Rahmen C enger** — Band schließt die Null aus |

- **5-50:** gemessene Differenz +0,0021 Pp, Unterschied der Bodenspannen +0,0189 Pp — das Band schließt die Null ein, der Befund lautet **nicht entscheidbar**.
- **50-250:** gemessene Differenz -0,0449 Pp, Unterschied der Bodenspannen +0,0019 Pp — die Differenz ist negativ — Rahmen C handelt **enger**.

### 4.2 Alle Zellen — nachrichtlich, nie statt dessen

| Klasse | Jahr | Fenster | Rahmen C | Rahmen A | Differenz | 95-%-Band | Symbole C / A | Urteil |
|---|---|---|---|---|---|---|---|---|
| 5-50 | 2025 | eroeffnung | 0,4395 | 0,5951 | -0,1555 | [-0,3306, +0,0024] | 100 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 5-50 | 2025 | mitte | 0,1864 | 0,1769 | +0,0095 | [-0,0460, +0,0519] | 100 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 5-50 | 2025 | schluss | 0,1229 | 0,1239 | -0,0010 | [-0,0287, +0,0300] | 100 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 5-50 | 2026 | eroeffnung | 0,3655 | 0,6196 | -0,2541 | [-0,4762, -0,0308] | 66 / 100 | **Rahmen C enger** — Band schließt die Null aus |
| 5-50 | 2026 | mitte | 0,1486 | 0,1585 | -0,0100 | [-0,0545, +0,0435] | 66 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 5-50 | 2026 | schluss | 0,0938 | 0,1145 | -0,0207 | [-0,0478, +0,0115] | 66 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 50-250 | 2025 | eroeffnung | 0,1851 | 0,3171 | -0,1320 | [-0,2062, +0,0161] | 42 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 50-250 | 2025 | mitte | 0,0834 | 0,1025 | -0,0191 | [-0,0689, +0,0043] | 42 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 50-250 | 2025 | schluss | 0,0523 | 0,0614 | -0,0091 | [-0,0348, +0,0140] | 42 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 50-250 | 2026 | eroeffnung | 0,0983 | 0,3766 | -0,2782 | [-0,4077, +0,0399] | 23 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 50-250 | 2026 | mitte | 0,0696 | 0,1172 | -0,0476 | [-0,1142, +0,0006] | 23 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 50-250 | 2026 | schluss | 0,0439 | 0,0740 | -0,0301 | [-0,0574, +0,0012] | 23 / 100 | nicht entscheidbar (Band schließt die Null ein) |
| 250-1000 | 2025 | eroeffnung | 0,1752 | 0,1835 | -0,0082 | zu dünn | 4 / 100 | **zu dünn** (kein Band) |
| 250-1000 | 2025 | mitte | 0,0564 | 0,0761 | -0,0197 | zu dünn | 4 / 100 | **zu dünn** (kein Band) |
| 250-1000 | 2025 | schluss | 0,0350 | 0,0519 | -0,0169 | zu dünn | 4 / 100 | **zu dünn** (kein Band) |
| 250-1000 | 2026 | eroeffnung | 0,1073 | 0,2205 | -0,1132 | zu dünn | 6 / 100 | **zu dünn** (kein Band) |
| 250-1000 | 2026 | mitte | 0,0328 | 0,0862 | -0,0534 | zu dünn | 6 / 100 | **zu dünn** (kein Band) |
| 250-1000 | 2026 | schluss | 0,0315 | 0,0535 | -0,0219 | zu dünn | 6 / 100 | **zu dünn** (kein Band) |

## 5. Der Cent-Boden — die in §9b.4a vorab benannte Gegenprobe

Die Verschwundenen der Klasse `5-50` sind nicht nur dünner, sondern **billiger**; das
war vor dem Lauf gezählt und steht in §9b.4a. Hier dieselbe Differenz, gerechnet nur
auf Symbolen, deren **Median-Kurs im Band 10–50 $** liegt — dem Bereich, in dem beide
Rahmen Masse haben. **Nachrichtlich, nie statt dessen; die primären Zellen ändern sich nicht.**

| Klasse | Rahmen C (10–50 $) | Rahmen A (10–50 $) | Differenz | 95-%-Band | Symbole C / A | Urteil |
|---|---|---|---|---|---|---|
| 5-50 | 0,1275 | 0,1294 | -0,0019 | [-0,0373, +0,0360] | 81 / 113 | nicht entscheidbar (Band schließt die Null ein) |
| 50-250 | 0,0556 | 0,0603 | -0,0046 | [-0,0290, +0,0334] | 20 / 63 | nicht entscheidbar (Band schließt die Null ein) |

## 6. Was das für die Hürden heißt — eine Größenordnung, keine neue Hürde

> **Diese Zahlen gehen NICHT nach `wiki/kosten.md`** (§9b.6). Sie beantworten eine
> einzige Frage: *um wie viel läge die Hürde höher, wenn die Verschwundenen im
> Verhältnis ihres Anteils am damaligen Universum mitgemessen worden wären?*

Gerechnet wird der **Median der Mischung** — die Symbol-Mediane beider Rahmen in einen
Topf, die des Rahmens C mit Gewicht `w`, die des Rahmens A mit `1 − w`. Das ist nicht
das gewichtete Mittel der beiden Mediane (eine andere Größe), sondern der Median der
Verteilung, die man gemessen hätte.

| Klasse | Jahr | verfügbar C | verfügbar A | **Anteil `w`** | Hürde A | Hürde gemischt | **Aufschlag** |
|---|---|---|---|---|---|---|---|
| 5-50 | 2025 | 158 | 1152 | **12,1 %** | 0,1769 | 0,1772 | **+0,0003 Pp** (1,00 ×) |
| 5-50 | 2026 | 66 | 990 | **6,3 %** | 0,1585 | 0,1585 | **-0,0000 Pp** (1,00 ×) |
| 50-250 | 2025 | 42 | 719 | **5,5 %** | 0,1025 | 0,1014 | **-0,0011 Pp** (0,99 ×) |
| 50-250 | 2026 | 23 | 795 | **2,8 %** | 0,1172 | 0,1164 | **-0,0008 Pp** (0,99 ×) |
| 250-1000 | 2025 | 4 | 257 | **1,5 %** | 0,0761 | 0,0760 | **-0,0001 Pp** (1,00 ×) |
| 250-1000 | 2026 | 6 | 312 | **1,9 %** | 0,0862 | 0,0862 | **-0,0000 Pp** (1,00 ×) |

**Wie `w` gebildet ist:** Zahl der im jeweiligen Jahr ziehbaren Symbole in Rahmen C
geteilt durch die Summe beider Rahmen. Die beiden Zählungen sind **nicht exakt
gleich definiert** — Rahmen C verlangt zusätzlich 20 Handelstage Nachlauf (§9b.2) —,
was `w` eher **zu klein** macht. Deshalb ist der Aufschlag eine Größenordnung und
keine Korrektur.

## 7. Was Zusatz C NICHT sagt — §9b.6 wörtlich

- **Keine Aussage über 2016–2024.** Die 1.164 verschwundenen Reihen haben Tagesbalken
  erst ab dem 23.08.2024; für die Delisting-Jahre 2004–2022 liegen 3.690 aktienartige
  Kürzel **ohne einen einzigen Balken**. Genau die Jahre, in denen `ERGEBNIS.md` am
  stärksten Überlebende misst, sind hier **nicht messbar**. Die Haupttabellen behalten
  ihren Vermerk unverändert.
- **Keine Hochrechnung auf die frühen Jahre.** Der Anteil `w` ist für 2025/2026 gezählt;
  für 2016–2024 ist er unbekannt und wird nicht rückwärts fortgeschrieben.
- **Keine neue Hürde.** Abschnitt 6 ist eine Größenordnung und geht nicht nach `wiki/kosten.md`.
- **Nichts über `ab1000`.** Kein einziger verschwundener Wert hatte am Jahresanker über
  1.000 Mio $ Median-Tagesumsatz — die Klasse ist in Rahmen C leer. Das ist ein Befund,
  keine Lücke, und es heißt **nicht** „kein Unterschied".
- **Kein Ertragsbeleg.** Eine breitere oder engere Spanne belegt keine Kante. Die Zahl
  der belegten handelbaren Kanten bleibt **NULL**.
- **Nicht die effektiven Kosten**, nicht die Tiefe, nicht das CFD-Gefäß — §9 gilt wörtlich weiter.

