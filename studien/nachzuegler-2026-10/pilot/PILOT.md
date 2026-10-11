# Pilot Nr. 109 — 2016–2022, 168 Reihen (kein Befund)

Lauf `node lauf.js --pilot`, Tafel gesperrt (letzter Tag 2022-12-30), Laufzeit **11,0 s**. Auswahl nach Z21: je Klasse 50 nach `fnv(Name)`; die Klasse ab 1.000 Mio $ hat als Median 2017–2022 nur **18** Reihen im ganzen Panel. Diese Zahlen sind ein Trockenlauf und gehen in kein Urteil ein.

## Zählungen

| Auslöser/Richtung | Ereignisse (nach Sperrfrist, Entdeckung) |
|---|---|
| E1/auf | 4818 |
| E1/ab | 3887 |
| E2/auf | 3206 |
| E2/ab | 2056 |
| E3/auf | 614 |
| E3/ab | 528 |

B je Ereignis (nur Ereignisse mit Partner): E1/auf/V1 5,2 (3286); E1/auf/V2 4,6 (4809); E1/ab/V1 5,4 (2667); E1/ab/V2 4,7 (3868); E2/auf/V1 5,2 (2175); E2/auf/V2 4,6 (3202); E2/ab/V1 5,4 (1418); E2/ab/V2 4,7 (2049); E3/auf/V1 5,6 (405); E3/auf/V2 4,6 (614); E3/ab/V1 5,7 (359); E3/ab/V2 4,6 (528).

Topfgröße im Mittel je Klasse (5–50 / 50–250 / 250–1.000 / ab 1.000): 13,3 / 38,1 / 38,3 / 18,6 (Teilmenge). Beobachtungen echt / Placebo a / Placebo c: 450775 / 496235 / 508517.
E3: {"meldungen":5269,"ohneReaktionstag":0,"reihenMitCik":136,"tageJeReihe":5304,"ohneZeile":1980,"ohneVortag":2,"spyFehlt":0,"sdZuKurz":133,"unterSchwelle":1790,"auf":757,"ab":642}. CIK: {"reihen":7102,"tafel":6489,"gruende":499,"keine":113,"referenz":1}. Firmen: {"ciks":6174,"dateien":5846,"fehlt":328,"ohneSic":128,"meldungen":125485,"formAnders":1108,"ohneZeit":0}.
Placebo a: {"gezogen":15077,"verworfen":32}; Placebo c: {"verschoben":13813,"verworfen":1296}.

Ausgeschlossene B (über alle 384 Zellen summiert): eigene 2.02 17416, eigener Auslöser 110401. Abgänge von B (Übernahme / Insolvenz / sonstige): 122 / 0 / 5; A-Abgänge (H2) 8; Placebo b ohne Partner 0.

## Ergebnis des Trockenlaufs

| Größe | Wert |
|---|---|
| Konfigurationen mit Daten / prüfbar (≥ 30 Tage) | 384 / 384 |
| netto > 0 und t ≥ 2 | 1 (Zufall erwartet ≈ 8,7) |
| t ≤ −2 (netto) | 65 |
| Tor 1 bestanden | 0 |
| Placebo-Verstöße a / b / c | 15 / 11 / 11 |
| Kandidaten | 0 |

| beste 5 nach t (netto) | Tage | netto | t | Tor-1-Schwelle | Placebo a / b / c | später Einstieg brutto |
|---|---|---|---|---|---|---|
| E1/ab/V2/H2/h20/250-1000 | 629 | 0,724 | 2,01 | 3,689 | 0,392 / 0,335 / 0,313 | 0,728 |
| E2/ab/V2/H2/h20/250-1000 | 414 | 1,029 | 1,99 | 5,289 | 0,019 / 0,374 / 0,052 | 1,033 |
| E2/auf/V1/H1/h20/ab1000 | 590 | 0,638 | 1,70 | 3,855 | 0,868 / -0,166 / 0,643 | 0,602 |
| E2/ab/V2/H1/h20/250-1000 | 673 | 0,637 | 1,65 | 3,952 | 0,044 / 0,149 / 0,596 | 0,679 |
| E2/ab/V2/H2/h20/5-50 | 137 | 1,763 | 1,58 | 11,417 | 2,034 / -0,934 / -0,064 | 1,926 |

## Artefakt-Gegenproben (Z21)

- **Kein Blick nach vorn:** an 5 gezogenen Ereignistagen (2022-04-22, 2017-03-01, 2020-05-05, 2021-04-15, 2022-08-03) die Auslöser auf einer Kopie ohne alle Zeilen nach D neu bestimmt: **0 Abweichungen** in 707 Zeilen; V2-Listen an 3 Stichtagen ohne Daten nach c: **0 Abweichungen**.
- **Einstieg einen Tag später** (Eröffnung e+1, Ausstieg fest): über 288 Konfigurationen mit h ≥ 1 Brutto im Mittel -0,125 (Einstieg e) gegen -0,098 (e+1) Pp — nachrichtlich; ein Unterschied hieße, dass ein Teil im ersten Tag liegt.

## Technische Änderungen nach dem Piloten (Nachtrag 1 (6): nur Code)

1. V1: die H2-Summen der Ereignisse einer SIC-Gruppe werden einmal je Gruppe gerechnet statt je B (Laufzeit; Ergebnis bitgleich bis 6e-17, an diesem Piloten gegen den ersten Lauf geprüft).
2. Zähler „A-Abgang" (H2) zählte je B statt je Ereignis; jetzt je Ereignis und Haltedauer (nur Auskunft).

Keine Schwelle, kein Parameter geändert.
