# Kapitulation V2 auf dem sauberen Archiv — Ergebnis des registrierten Laufs (Auftrag Nr. 68)

**In der behaupteten Größe zurückgewiesen: obere Grenze +0,601 < 1,107 Pp (V2 netto −0,024 Pp je Signaltag, Band [−0,649; +0,601]).** N = 528 Signaltage, se = 0,319 Pp, MDE₈₀ = 0,894 Pp, 15,9 % der Signale auf Verschwundenen, 5 Totalverlust-Buchungen.

Kennung `kapitulation-neu-2026-10-03/v1`. Eine Vorhersage, eine Messung (Testzahl 1). Jede Zahl dieser Datei steht in `lauf/*.json` und wurde von `messen.js --bericht` hierher geschrieben. Simulation mit virtuellem Kapital, keine Anlageberatung.

Tor 1 der Mühle (se ≤ 0,138 Pp): **verfehlt** (se 0,319 Pp). Tor 2: vorab verfehlt — MDE₈₀ liegt weit über jeder Kassa-Hürde; die Messung prüft die Behauptung, nicht die Hürde. Über Kosten-Tauglichkeit sagt sie nichts.

## Tore, in der Reihenfolge der Vorregistrierung §6

0. **Strategiedatei unverändert:** zeichengleich mit der Quelle im Protokoll vom 26.08.2026 (8393 Zeichen, sha256 `7339e5312dadd900…`).
1. **Vollzählung, blind:** 7299 Reihen (2306 lebend, 4993 verschwunden), 45096 Jahresdateien, 122,7 GB. V2-Signale 9104 an 715 Signaltagen; **Bestätigungsfenster 528 Signaltage** (6054 Signale) — die Schätzung der Phase 1 war 403 … 493 (sicher 154 … 683), **nicht getroffen**. Altes Fenster 187 Signaltage (3050 Signale), Rückhaltefenster 0 (0).
2. **Nullpunkt** (Zufallseinstiege an den Signaltagen gegen den Tagestopf, |t| < 2): Mittel −0,069 Pp, se 0,118, t −0,58 über 528 Signaltage (6054 Einstiege) — gehalten.
3. **Placebo ohne Kursbezug** (Streuwert aus Kürzel und Datum, gleiche Häufigkeit je Tag, |t| < 2): Mittel −0,027 Pp, se 0,132, t −0,20 über 528 Signaltage (6054 Einstiege) — gehalten.
4. **Leck-Klinke:** 20 Reihen, 322831 Kerzen und 232 Auslöser geprüft, Abweichungen 0 — gehalten.
5. **Kosten vor dem Urteil:** Hürde je Umlauf 5-50 Mio $: 0,1569 Pp · 50-250 Mio $: 0,0854 Pp · 250-1000 Mio $: 0,0647 Pp · ab1000 Mio $: 0,0449 Pp. Klassen-Mix der 6054 messbaren Signale: 250-1000 19,4 % · 5-50 5,5 % · 50-250 72,4 % · ab1000 2,7 %; mittlere Hürde 0,0843 Pp je Signal.
6. **Stufe A (se vor dem Mittel):** N = 528 Signaltage (6054 Signale), sd 6,328 Pp je Signaltag; se naiv 0,275 / Hansen-Hodrick 0,294 / Blöcke 0,319 ⇒ es gilt **0,319 Pp**; MDE₈₀ = 0,894 Pp ≤ 1,107 — Stufe B geöffnet. Auf Verschwundenen 963 Signale (15,9 %); Reihe endet in der Haltedauer: 5 als Totalverlust, 5 zum letzten Kurs gebucht. Signale ohne Topf 0, Klasse am Tag leer (ganzer Tagestopf) 0.
   **Stufe B:** netto −0,024 Pp je Signaltag, Band [−0,649; +0,601], t −0,07 (Schwelle 1,96); brutto +0,062 Pp, t +0,20.

## Nachrichtlich, ohne Urteil

Erst nach Stufe B gerechnet. Keine dieser Zeilen ist ein Test; sie ändern das Urteil nicht.

| Zeile | Signaltage | Signale | se (Pp) | netto (Pp) | Band | t | brutto (Pp) |
|---|---:|---:|---:|---:|---|---:|---:|
| altes Fenster, alle Reihen | 187 | 3050 | 0,284 | +0,395 | [−0,162; +0,953] | +1,39 | +0,478 |
| altes Fenster, nur lebend | 186 | 2940 | 0,284 | +0,359 | [−0,199; +0,916] | +1,26 | +0,441 |
| Bestätigungsfenster, erste Hälfte | 247 | 2308 | 0,231 | −0,399 | [−0,852; +0,055] | −1,72 | −0,310 |
| Bestätigungsfenster, zweite Hälfte | 281 | 3746 | 0,555 | +0,306 | [−0,782; +1,393] | +0,55 | +0,390 |
| gegen die Kontrolle des alten Protokolls | 528 | 6053 | 0,421 | −0,187 | [−1,012; +0,637] | −0,45 | −0,101 |
| Einstiegslücke S9 (kein Ertrag, ohne Kosten) | 528 | 6054 | 0,033 | −0,042 | [−0,107; +0,024] | −1,25 | −0,042 |
| Totalverlust auch für unbekannt/freiwillig | 528 | 6054 | 0,413 | −0,083 | [−0,893; +0,727] | −0,20 | +0,003 |
| letzter Kurs für alle | 528 | 6054 | 0,318 | −0,012 | [−0,635; +0,612] | −0,04 | +0,074 |

Totalverlust-Empfindlichkeit: streng −0,059 Pp, milde +0,012 Pp gegen die Hauptzahl (8 bzw. 0 Totalverlust-Buchungen); Urteilsform unter den beiden Regeln: „nicht entscheidbar“ / „in der behaupteten Größe zurückgewiesen“. **Das Ergebnis hängt von der Buchung der Verschwundenen ab.** Unter „streng“: se 0,413 Pp, MDE₈₀ 1,158 Pp (Schwelle 1,107), Band [−0,893; +0,727] — die Mittel selbst liegen beieinander, es wechselt die Auflösung.

Rückhaltefenster (ab 2026-08-25): 0 Signaltage, 0 Signale — kein Urteil vor 100 Signaltagen, nichts gerechnet.

## Zähler der Vollzählung

| Jahr | V2-Signale | Signaltage | auf Verschwundenen |
|---|---:|---:|---:|
| 2016 | 556 | 57 | 121 |
| 2017 | 230 | 38 | 62 |
| 2018 | 1086 | 98 | 187 |
| 2019 | 436 | 54 | 83 |
| 2020 | 1420 | 50 | 232 |
| 2021 | 531 | 49 | 65 |
| 2022 | 1196 | 129 | 130 |
| 2023 | 940 | 75 | 98 |
| 2024 | 481 | 46 | 22 |
| 2025 | 1591 | 59 | 66 |
| 2026 | 637 | 60 | 7 |

| Klasse (Mio $) | V2-Signale | Signaltage | auf Verschwundenen |
|---|---:|---:|---:|
| 250-1000 | 1895 | 438 | 87 |
| 5-50 | 447 | 234 | 94 |
| 50-250 | 6451 | 672 | 889 |
| ab1000 | 311 | 121 | 3 |

Ohne Regime (V1, nur gezählt): 16747 Signale an 2087 Tagen. Häufung im Bestätigungsfenster: im Mittel 11,47 Signale je Signaltag, Median 5, P95 37, Maximum 319. Ränder: 16 Signale an Sperrtagen und 35 in Split-Fenstern (§8) ausgeschlossen; 10 V2-Signale, deren Reihe in der Haltedauer endet (nach §7 gebucht); 0 am Archivende lebender Reihen ohne Ertrag; Klinke Umsatztor 0 Abweichungen; 562 geführte Jahresdateien fehlen auf der Platte. Tagestopf: 4707290 zulässige Kerzen an 832021 Reihentagen, ohne Ziehung.

## Dateien

`lauf/zaehlung.json` · `nullpunkt.json` · `placebo.json` · `leck-klinke.json` · `kosten.json` · `stufe-a.json` · `stufe-b.json` · `nachrichtlich.json` · `urteil.json` · `laeufe.json`; zusammengefasst in `protokoll.json`. Die Journale je Reihe (`lauf/teile/`, samt Siegel) liegen auf der Platte und sind nicht eingecheckt.
