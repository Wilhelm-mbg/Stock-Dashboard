# Daytrader-Sieb (Nr. 107) — Ergebnis

50 US-Aktien aus 11 Sektoren, 1m-Kerzen, reguläre Sitzung. Suche: 20 geseedete Tage 2023–2024; Bestätigung: 20 andere Tage 2025–2026, erst nach dem Siegel der Kandidatenliste und dem Nachtrag 2 geöffnet, alle 18 Tests. Werte in Pp je Handel, Mittel über **Tagesmittel**; t über Tage gebündelt (Handel minus Placebo). Netto = brutto − K der Umsatzklasse (Marktorder, Fenster „mitte"). Placebo = derselbe Wert zur selben Uhrzeit, gleiche Richtung, Mittel der anderen 19 Tage der Phase (REGEL §5; das Zufallsminuten-Placebo des Auftrags ist verzerrt und steht nur in `ergebnis.json`). Testzahl 18 (9 Setups × long/short). Regel: `REGEL.md`. Keine Anlageberatung.

| Setup | Richtung | Handel | Tage | brutto | netto | Placebo | über Placebo | t gebündelt | Sieb | Bestätigung (netto / t) |
|---|---|---|---|---|---|---|---|---|---|---|
| Schliessen der Eroeffnungsluecke (Gap-Fade) | long | 236 | 20 | 0,011 | -0,048 | 0,007 | 0,004 | 0,02 | nein | nein (-0,115 / -0,49) |
| Schliessen der Eroeffnungsluecke (Gap-Fade) | short | 111 | 20 | -0,060 | -0,120 | -0,016 | -0,044 | -0,19 | nein | nein (-0,287 / -1,04) |
| Gap-and-Go (Lueckenfortsetzung) | long | 12 | 6 | 0,615 | 0,561 | 0,268 | 0,347 | 0,69 | nein | nein (0,520 / 0,82) |
| Gap-and-Go (Lueckenfortsetzung) | short | 17 | 7 | -1,234 | -1,295 | 0,026 | -1,260 | -0,82 | nein | nein (-0,035 / -0,10) |
| Erste halbe Stunde sagt die letzte voraus | long | 408 | 20 | -0,001 | -0,063 | 0,019 | -0,020 | -0,41 | nein | nein (-0,051 / 0,26) |
| Erste halbe Stunde sagt die letzte voraus | short | 591 | 20 | -0,016 | -0,078 | -0,016 | -0,001 | -0,01 | nein | nein (-0,049 / 0,15) |
| Rest des Tages sagt die letzte halbe Stunde voraus | long | 433 | 20 | 0,001 | -0,061 | 0,018 | -0,016 | -0,32 | nein | nein (-0,057 / 0,17) |
| Rest des Tages sagt die letzte halbe Stunde voraus | short | 562 | 20 | -0,022 | -0,083 | -0,015 | -0,007 | -0,13 | nein | nein (-0,060 / -0,09) |
| Bruch von Vortageshoch/-tief | long | 267 | 20 | -0,036 | -0,098 | -0,016 | -0,020 | -0,18 | nein | nein (-0,044 / 0,38) |
| Bruch von Vortageshoch/-tief | short | 302 | 20 | 0,066 | 0,004 | -0,017 | 0,083 | 0,54 | nein | nein (-0,082 / -0,35) |
| Volumenspitze mit Fortsetzung | long | 208 | 20 | -0,017 | -0,082 | 0,010 | -0,027 | -0,53 | nein | nein (-0,088 / -0,49) |
| Volumenspitze mit Fortsetzung | short | 196 | 20 | -0,024 | -0,088 | 0,001 | -0,025 | -0,73 | nein | nein (-0,080 / -0,64) |
| Mittagsumkehr | long | 162 | 19 | 0,111 | 0,051 | 0,037 | 0,074 | 0,74 | nein | nein (0,237 / 1,60) |
| Mittagsumkehr | short | 147 | 20 | -0,189 | -0,247 | -0,057 | -0,132 | -0,88 | nein | nur Bestätigungstage (0,114 / 2,09) |
| Staerke/Schwaeche gegen SPY am Vormittag | long | 124 | 20 | 0,336 | 0,281 | 0,003 | 0,334 | 1,54 | nein | nein (-0,262 / -0,49) |
| Staerke/Schwaeche gegen SPY am Vormittag | short | 142 | 20 | -0,158 | -0,218 | -0,062 | -0,095 | -0,52 | nein | nein (-0,052 / -0,29) |
| Zehn-Uhr-Umkehr | long | 109 | 18 | -0,053 | -0,113 | 0,028 | -0,081 | -0,50 | nein | nein (-0,082 / 0,27) |
| Zehn-Uhr-Umkehr | short | 106 | 20 | -0,239 | -0,295 | -0,040 | -0,199 | -1,23 | nein | nein (-0,024 / 0,04) |

**Vielversprechend:** keiner. **Im Sieb hängen geblieben:** 0 von 18. **Nur Bestätigungstage (t ≥ 2, braucht eine dritte Stichprobe):** Mittagsumkehr short. Erwartete Zufallstreffer bei 18 Prüfungen mit t ≥ 2 einseitig: etwa 0,4 (19 Freiheitsgrade: rund 0,5). Bestätigung nach Nachtrag 2 (REGEL.md): alle 18 Tests gerechnet, Urteil netto > 0, t ≥ 2, Richtung wie Suchtage.

**Nachrichtlich — Placebo laut Auftragstext (Zufallsminuten desselben Tages):** im Sieb wären Mittagsumkehr long (t 5,01). Dieses Placebo erzeugt auf einem Zufallsweg ohne Kante |t| bis 14 (`test.js`), weil Fenster vor dem Signal die Signalbedingung tragen — kein Urteil.

**Auflösung:** MDE₈₀ von Handel − Placebo (Suchtage) 0,10 bis 4,32 Pp je Handel — die Kassa-Hürde (0,045–0,065) liegt darunter. Das Sieb fängt nur große Effekte; ein „nein" hier ist kein gemessenes Nein.

Zählung Suche: {"wertTage":1000,"ausschluss":0,"duenn":0,"ohneVortag":0,"ohneKlasse":0,"ohneKerzen":0}; Bestätigung: {"wertTage":1000,"ausschluss":0,"duenn":0,"ohneVortag":0,"ohneKlasse":0,"ohneKerzen":0}. Short braucht Leihe; die Hürde ist dort eine Untergrenze. Netto mit Einstiegsfenster-Hürde (nachrichtlich, Eröffnung 1,8–2,1 × teurer) steht in `ergebnis.json`. 20 Cluster je Phase: ein t ≥ 2 ist ein Sieb, kein Beleg.
