# Panel v2.2 — jede lückenlose Notierung eine eigene Reihe (Auftrag Nr. 67, 03.10.2026)

**Kurz:** `voll-v22/` enthält das Panel v2.2 (Kennung `querschnitt-pruefstand-2026-09-13/panel/v2.2`): dieselben **9.904.017**
Zeilen wie v2.1, aber **7.479** statt 7.338 Reihen — an jeder der **141** Lücken > 90 Kalendertage beginnt eine neue Reihe.
**95.150** Zeilen haben die Reihe gewechselt, **0** unerklärte Unterschiede, alle Kursspalten bitgleich; die Wirkung im Universum
(Lücke im 252-Zeilen-Fenster) fällt von **1.613** auf **0** Reihen-Tage. `voll/` (v2.1) ist unverändert und bleibt die Vorgabe:
ohne die Option `--luecken` baut und liest der Code wie bisher.

## 1. Regel, wie sie gebaut ist

- **Trennung:** jede Lücke > `K.LUECKE_TRENN_TAGE` = 90 **Kalender**tage zwischen zwei aufeinanderfolgenden Tageszeilen einer Reihe
  beginnt eine neue Reihe — ohne Beleg-Bedingung, auch bei den vier belegten Fall-III-Fällen (SMCI, MINM, BTBT, BSGM).
- **Liste vor dem Bau:** `luecken-trennungen.json` (`node kuerzelwechsel.js --luecken voll/panel`), reine Funktion des v2.1-Panels,
  zweimal erzeugt bytegleich. Gegen den Trockenlauf geprüft (`test.js` Abschnitt 17, `pruefung-v22.js`): 141 Trennungen in 140
  Reihen (LEXEB zwei), 138 Basis-Kürzel, dieselben Reihen und Tage wie `luecken-kandidaten.json`; Zeilenwechsel vorab aus dem
  Trockenlauf gerechnet = **95.150**; 231 Kurzlücken (30–90 Tage) bleiben unberührt und sind in v2.2 dieselben 231.
- **Namen:** die früheste Notierung behält das Kürzel, neue Abschnitte bekommen je Basis-Kürzel die nächste freie Nummer in der
  Reihenfolge ihres ersten Tages. Eine `~2`-Reihe aus v2.1 **behält ihren Namen** (es wird weitergezählt) — so zeigt kein
  v2.1-Name in v2.2 auf Zeilen, die er vorher nicht hatte, und genau die Zeilen nach einer Lücke wechseln den Namen. Folge bei
  den sieben Kürzeln mit vorhandener `~2`-Reihe oder zwei Lücken (Zeitfolge der Abschnitte):
  AAC → AAC, **AAC~3**, AAC~2 · CPAA → CPAA, **CPAA~3**, CPAA~2 · GIG → GIG, **GIG~3**, GIG~2, **GIG~4** ·
  HYAC → HYAC, **HYAC~3**, HYAC~2, **HYAC~4** · ISRL → ISRL, **ISRL~3**, ISRL~2 · LCA → LCA, **LCA~3**, LCA~2 ·
  LEXEB → LEXEB, **LEXEB~2**, **LEXEB~3**. Bei sechs davon sind die Nummern also nicht chronologisch (siehe §7, Entscheidung 1).
- **Spalten:** erste Zeile der neuen Reihe ohne Rendite (`rendite` nicht endlich, Marke KEINE_RENDITE); die letzte Zeile vor der
  Lücke trägt LETZTER_TAG; Umsatzfenster und Klasse beginnen neu (40 Zeilen −1); Split-Sperre und Maßnahmen wie v2.1.
- **Stand je Reihe** (`voll-v22/panel/_stand.json` → `symbole`): der Abschnitt vor einer Lücke hat `lebend 0`, `ende_grund`
  `notierung-unterbrochen` (`K.ENDE_GRUND_LUECKE`, neu — steht in keiner Totalverlust-Liste, ausgebucht wird zum letzten Kurs,
  wie bei `kuerzel-neu-vergeben`) und `ende_datum` = letzter Tag vor der Lücke; der letzte Abschnitt erbt Leben und Ende-Grund der
  Grundstudie; `vorgaenger` nennt den Abschnitt davor, `luecke` die Trennstelle.
- **Auskunft statt Urteil:** `reihen-abschnitte.json` (im Repo und in `voll-v22/`): 173 Basis-Kürzel mit 355 Abschnitten
  (173 Reihenanfänge, 141 nach Lücke, 38 nach Kürzelwechsel aus v2.1, 3 zweite Archiv-Reihen); je Abschnitt Reihenname,
  erster/letzter Tag, Zeilenzahl, Fall, Beleg, „dasselbe Papier wie der Vorgänger": **ja 4 / nein 74 / unbekannt 104**
  (Fälle der Lücken: I 31, II 2, III 4, IV 104). Kein Abschnitt gelöscht, keine Zeile verloren.

## 2. Befund vor dem Bau: das Archiv ist gewachsen — v2.2 ist auf den Stand von v2.1 gedeckelt

Die 2026er Dateien auf E: wurden am 03.10. fortgeschrieben (13 Handelstage, 16.09.–02.10.). Ein Bau ohne Deckel liefert für AAPL
und SN 26 zusätzliche Zeilen und verschiebt LETZTER_TAG — die Rückwärts-Probe wäre nicht bitgleich, die Kernprüfung nicht exakt.
Darum: Option `--bis <tag>`; mit `--luecken` gilt der Stand der Liste (**2026-09-15**, letzter Tag von v2.1). Die Verlängerung des
Panels ist eine eigene Entscheidung (§7, Entscheidung 2) und braucht eine neue Liste, weil neue Lücken entstehen können.

## 3. Proben vor dem Vollbau

| Probe | Reihen | Ergebnis |
|---|---|---|
| Rückwärts-Probe: **ohne** `--luecken`, `--bis 2026-09-15` (`pruefung-v22-rueckwaerts.json`) | SN MBLY DOW CHK SMCI LEXEB STR JMG GIG HYAC AAC AAC~2 AAPL HCP | 19.220 Zeilen **bitgleich** mit `voll/`, 0 Unterschiede |
| dieselben **mit** `--luecken` (`pruefung-v22-teilmenge.json`) | wie oben | 9.231 Zeilen in 14 neuen Reihen (Soll 9.231 / 14), 14 erste Zeilen ohne Rendite, Klasse 230 + 11, Marken 14 + 14, 0 unerklärt; Wirkung 716 → 0 |
| Kunstreihe mit Lücke, Kürzelwechsel, Lücke (`test.js` Abschnitt 17) | — | 11 Prüfungen grün, Gegenprobe ohne Schnitte: +166,7 % über die Lücke |
| Sperren | — | v2.1-Aufruf auf v2.2-Teilordner, v2.2-Vereinen auf v2.1-Panel und `--luecken --aus voll` brechen ab |

## 4. Vollbau

Start 03.10. 20:40:46, vier Teile über `Win32_Process.Create` mit erzwungenem PATH, Ende der Teile 22:55:04–22:55:49
(**8.057–8.102 s je Teil, 2 h 15 min**; zusammen 32.333 Prozess-Sekunden gegen 20.333 bei v2.1), Vereinen 22:56:16–22:56:33,
Kernprüfung 5 s. Engpass war die Platte E: (anfangs acht Leser, rund 2 MB/s je Teil; ab etwa 21:40 doppelt so schnell).
Zähler: 7.300 gebaute Reihen, 45.107 Dateien, 122,8 GB, 562 fehlende Jahresdateien (wie v2.1), 1 Reihe ohne Zeilen (wie v2.1),
38 Kürzelwechsel-Trennungen, **141 Lücken-Trennungen**, 0 ungetrennte Lücken, 0 Abweichungen, 1.693 Splits angewandt, 47
abgelehnt (wie v2.1), kein FEHLER-Eintrag in den Logs. `voll-v22/` belegt 910 MB.

## 5. Kernprüfung v2.1 gegen v2.2 (`pruefung-v22.json`, bestanden)

Schlüssel (Kürzel-Basis, Tag), in beiden Panels eindeutig (0 Doppelte).

| Größe | Ist | Soll |
|---|---|---|
| Zeilen v2.1 / v2.2 / gemeinsam | 9.904.017 / 9.904.017 / 9.904.017 | gleich |
| Zeilen von v2.1, die in v2.2 fehlen / nur in v2.2 | 0 / 0 | 0 / 0 |
| (a) Reihenname anders (Zeilen nach einer Lücke) | **95.150** | 95.150 |
| neue Reihen mit Zeilen | **141** (Reihen mit Zeilen 7.337 → 7.478) | 141 |
| (b) `rendite` anders: erste Zeile einer neuen Reihe, in v2.1 endlich, in v2.2 nicht | 141 | 141 |
| (c) Klasse anders: Zeilen 1–40 der neuen Reihe jetzt −1 | 1.293 | — |
| (c) Klasse anders: Zeilen 41–60 (Fenster nur noch aus der eigenen Reihe) | 96 | — |
| (c) Marke KEINE_RENDITE neu / LETZTER_TAG neu | 141 / 141 | 141 / 141 |
| **unerklärte Unterschiede** | **0** | 0 |
| bitgleich (Bitmuster): kerzen, rohSchluss, rohEroeffnung, faktor, renditeOC, umsatzReg, umsatzAuktion | ja, alle Zeilen | ja |
| Lücken > 90 Tage innerhalb einer Reihe | 141 → **0** | 0 |
| Wirkung: Reihen-Tage Klasse 1–3, ≥ 250 Zeilen, Lücke im 252-Zeilen-Fenster | 1.613 → **0** | 0 |
| Reihen-Tage des Universums (dieselbe Abgrenzung, 2017–2026) | 2.221.248 → 2.219.644 (−1.604) | — |

Die Eichung des Wirkungszählers trifft den Trockenlauf (1.613 von 2.221.248); die 1.604 fehlenden Reihen-Tage sind die Zeilen, die
der Trockenlauf als „heute im Universum, nach der Trennung zunächst unreif" gezählt hatte.

## 6. Prüfzahlen vorher / nachher

| | v2.1 (`voll/`) | v2.2 (`voll-v22/`) |
|---|---|---|
| `K.REGRESSION23_ERWARTET` (Momentum 12-1 monatlich, Klassen 2–3, netto Pp/Monat) | 1.6694766839043451 (bleibt, trifft weiter exakt) | **1.6868679011460952** (zweiter Schlüssel, aus `voll-v22/kontrollen-v22.json`) |
| derselbe Wert über die Teil-3-Maschine (T3-P12, 1e-9) | 1,669476684 | 1,686867901 |
| Momentum monatlich: brutto / t netto / Tote | 1,6817 / 2,698 / 5 | 1,6991 / 2,724 / 6 |
| Momentum wöchentlich netto / t | 0,3854 / 2,449 | 0,3905 / 2,482 |
| Universum-Mitgliedsperioden (monatlich) / überbrückte Lücken | 25.267 / 25 | 25.262 / 4 |
| Orakel(Tag) monat Mittel/sd (bekannte Ausnahme) | 0,82 | 0,83 |
| Leck-Probe, gemeldete Verstöße | 111.762 | 111.744 |
| T3-P8 Dezil-Mitgliedschaften (Klassen 1/2/3) | 8.936 (5.901/2.286/749) | 8.926 (5.886/2.288/752) |
| `test.js` / `test-teil2.js` / `test-teil3.js` / `test-teil4.js` | 82/0 · 20/0 · 13/0 (2 übersprungen) · 12/0 (1 übersprungen) | 82/0 · 20/0 · 13/0 (2) · 12/0 (1) |
| Mehrfaktor `test.js`, B14 | 31/0, trifft den v2-Pin exakt | nicht umgestellt (Folgeauftrag) |

**Die Prüfzahl bewegt sich um +0,0174 Pp je Monat — zweite, nicht dritte Nachkommastelle.** Aufgeschlüsselt aus den
Periodenreihen beider Kontrollenläufe: 10 von 115 Monaten sind anders, die Summe der Differenzen ist 2,00 Pp, davon **1,98 Pp
aus einem Monat (2022-03)**: das Universum hat dort ein Mitglied weniger (296 → 295), das Top-Dezil 5,91 → 8,03 %. Rechnerisch
fiel ein Mitglied mit −39,9 % Monatsrendite aus dem Top-Dezil. Das passt auf **DWAC** (Lücke 2018-04-04 → 2021-09-30, einzige
Reihe der Klassen 2–3 mit Lückenende im Jahr davor): in v2.1 galt die Reihe durch 179 Zeilen des alten Papiers als reif, und
ihr Momentum wurde über die Lücke gerechnet. Der Name ist aus der Liste geschlossen, nicht am Portfolio nachgesehen.
`test.js` zeigt außerdem „gewichtetes Mittel der Jahre" 0,0408 → 0,0242 — eine Zufallsziehung, die an den (verschobenen)
Reihen-Indizes hängt, keine Datenaussage.

`test.js` hat jetzt 82 Prüfungen (Abschnitt 17 neu); die Zählerklinke in `test-teil3.js`/`test-teil4.js` (T3-P11, T4-P11) ist von
71 auf 82 nachgezogen.

## 7. Was der PM entscheiden muss

1. **Namensregel bei vorhandener `~2`-Reihe:** gebaut ist „weiterzählen" (bestehende `~2` bleibt, neue Abschnitte `~3`/`~4`) —
   nur so wechseln genau die 95.150 Zeilen nach einer Lücke den Namen. Soll stattdessen streng chronologisch nummeriert werden
   (AAC~2 hieße dann AAC~3 usw.), genügt ein Umschreiben der Symboltabelle samt Neusortierung der Jahresblöcke — kein Neubau.
2. **Panel bis 02.10. verlängern?** Braucht eine neue Lücken-Liste auf dem längeren Stand und einen weiteren Vollbau (2–4 h).
3. **Umstellung der Studien auf v2.2** (nicht in diesem Auftrag): Teil 1/3/4, Kandidaten, Mehrfaktor (`KONST.PANEL`), Zielportfolio.
   Zu erwarten ist die Bewegung aus §6; wer `voll-v22` liest, bekommt v2.2 ohne weitere Schalter (`ladePanel` nimmt die Kennung
   des Standes, `REGRESSION23_ERWARTET` hat den Schlüssel).
4. **Bilanz-Zuordnung der getrennten Reihen** (nicht in diesem Auftrag): der Leser der Fundamentaltafel kennt nur `~2`
   (`teil4.js` Zeile 138 streift `/~2$/` und fällt auf das Basis-Kürzel zurück — Auskunft des Haiku-Unteragenten, nicht selbst
   gelesen). In v2.2 hieße das: die 132 neuen `~2`-Reihen bekämen still die Bilanz des Basis-Kürzels, die 9 neuen Reihen mit
   `~3`/`~4` gar keine. Bereitgelegt in `reihen-abschnitte.json` je Abschnitt: `reiheV21`, `vorgaenger`, Fall und
   Beleg, `dasselbePapierWieVorgaenger`, `derselbeEmittentWieVorgaenger` und `quellen` (Polygon-Inhaber mit `cik` nach der Lücke,
   CUSIP beidseits, Yahoo-Beginn, `name_changes`).

## 8. Dateien

Geändert: `konfig.js` (vier neue Konstanten, zweiter Schlüssel der Prüfzahl), `kuerzelwechsel.js` (Lücken-Liste, Reihentafel),
`paneldaten.js` (Bau-Modus, Schnitte, Deckel, Sperren, `ladePanel`), `test.js` (Abschnitt 17), `test-teil3.js`/`test-teil4.js`
(Zählerklinke), `.gitignore`. Neu: `luecken-trennungen.json`, `pruefung-v22.js` mit `pruefung-v22.json`,
`pruefung-v22-rueckwaerts.json`, `pruefung-v22-teilmenge.json`, `reihen-abschnitte.json`, `panelbau-v22.cmd`,
`panelbau-v22-start.ps1`, `BAU-V22-STAND.md`, dieses Papier. Nicht im Repo: `voll-v22/` (Panel, Teile, Logs, `kontrollen-v22.json`,
`suiten/`). Nicht angefasst: `voll/`, `pruefstand.js`, `statistik.js`, `kontrollen.js`, `lesen-panel.js`, E:.
