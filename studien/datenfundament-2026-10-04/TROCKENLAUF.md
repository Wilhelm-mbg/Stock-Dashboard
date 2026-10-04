# Trockenlauf Datenfundament (Auftrag Nr. 79, 04.10.2026) — gezählt und vorgeschlagen, nichts geändert

**Art:** Trockenlauf. Gelesen: Minutenarchiv (Manifest, Lebenszeit-Tafel, Kalender, rund 100 Jahresdateien für T5 und acht für T1),
Panel v2.1 und v2.2, Gründe-Tafel samt EDGAR-Cache, Bilanz-Tafel, Polygon-Liste. Geschrieben: nur dieser Ordner. Kein Panel, keine
Tafel, kein Leser und nichts auf E: wurde verändert; kein Abruf bei Alpaca; EDGAR nur über die Kopie des vorhandenen Abrufs
(680 Anfragen, eine Spur, kleinster gemessener Abstand 350 ms).

**Stände der Quellen:** Manifest des Minutenarchivs 03.10.2026 21:33 UTC (Ende des Archivs: **02.10.2026**), Lebenszeit-Tafel 03.09.2026
(Minutenfelder 06.09.), Kalender geholt 03.09., Polygon-Liste 23.08.2026 (letztes Abgangsdatum darin: **21.08.2026**), Maßnahmen-Archiv
03.09.2026, bereinigte Kopien 06.09.2026, Gründe-Tafel und ihr EDGAR-Cache 12.09.2026, Panel v2.2 bis 15.09.2026.

## Kurz

| Thema | Hauptzahl | Was sie bedeutet |
|---|---|---|
| **T1** Lebenszeit aus den Minuten | **57** Reihen wechseln von lebend zu abgegangen (X = 10 und X = 20; X = 5: 58; X = 0: 63), **0** umgekehrt | alle 57 sind belegte Abgänge (52 mit Polygon-Datum 1–4 Tage danach, 5 mit Alpaca-Maßnahme 1–2 Tage danach). Eine Lücke der nächtlichen Sammlung gibt es nicht — POWL und IESC enden am 03.09. nur in der **veralteten bereinigten Kopie**, die der Leser der Rohdatei vorzieht (33 Aktienreihen, 64 Ordner) |
| **T3** Wirkung auf das Panel | **198** Panel-Reihen bekämen einen anderen Stand (57 lebend, 142 Grund, 194 Datum); **7** davon standen in ihren letzten 250 Zeilen in Klasse 1–3 | Totalverlust-Gründe: +82 / −13 Reihen über alle, in Klasse 1–3 **+0 / −1** (SBNY — zu Unrecht, siehe T2). Dazu ein Nebenfund: 33 als lebend geführte Reihen enden im Panel am 03.09. statt am 15.09. (23 davon in Klasse 1–3) |
| **T2** Gründe-Tafel mit dem richtigen Datum | von 285 neu geankerten Zeilen **kippen 72**, 16 „unbekannt" bekommen einen Grund, 197 bleiben beim Grund (53 mit anderem Beleg); **54** Reihen kommen neu hinzu (36 Zwangs-Delisting) | der neue Anker ist richtig (8-K 3.01 liegt jetzt bei 197 von 217 Zeilen höchstens 30 Tage am Reihenende, in der alten Tafel bei 255 von 546) — aber nur **39 der 72 Kipp-Fälle** bestehen beide Außenprüfungen; die Einstufungslogik selbst hat drei Schwächen, die mit dem richtigen Anker sichtbar werden |
| **T6** Umstellung und Verlängerung | **18** Stellen in 17 Dateien tragen `voll/` fest (5 Werkzeug, 13 abgeschlossen); **517** Reihen von v2.2 bekämen keine Firma (8 davon hatten in v2.1 eine, alle 9 mit `~3`/`~4`), 0 eine andere als in v2.1; **13** Handelstage Minuten nach dem Panel-Ende für 2.249 → 2.243 Reihen | Bestandsfehler des Bilanz-Lesers, schon in v2.1: bei 14 Kürzeln mit zwei Firmen liefert er für **beide** Zeiträume Bilanzen derselben CIK (8 davon sicher zwei Emittenten: ALTS, BBBY, CIVI, CTRA, KCAC, RDUS, RSLS, TBRG) |
| **T5** Split-Sätze in den Kopien | **44** der 47 abgelehnten Sätze sind in den Kopien angewandt (32 Sprünge ≤ −50 %, 6 kleinere abwärts, 6 aufwärts bis +10.207 %); **147** Jahresdateien in 44 Reihen wären neu zu bilden | bei 41 zeigt die Rohdatei keinen Sprung (falscher Satz), bei 5–6 liegt der Sprung einen Handelstag später (echter Split, Ex-Tag um einen Tag daneben) |
| **T4** Lücken im Minuten-Leser | **179** Abschnittsanfänge in 171 Kürzeln kennt der Minuten-Leser nicht; in den je 38 Panel-Tagen danach liegen **6.616** Tage, davon **391** in Klasse 1–3 (15 Anfänge) | eine Stundenstudie mit 261 Kerzen Rückblick rechnete an diesen Tagen über zwei Firmen hinweg |

**Vorschlag in zwei Sätzen:** Phase 2 baut zuerst die Lebenszeit aus dem Manifest (X = 10, neue Datei neben der alten) und repariert
die Leser-Sicht auf die bereinigten Kopien — beides ohne Urteil, in Minuten erledigt. Die Gründe-Tafel wird **nicht** einfach neu
geankert: erst ein zweiter Trockenlauf über alle 5.050 Zeilen mit drei geänderten Regeln (Polygon-CIK als Zuordnung, Vollzug nur am
Reihenende, Formular 25 allein nicht „freiwillig"), dann Tafel v2, dann das Panel v2.3.

---

## T1 — Lebenszeit aus den Minuten

**Gezählt** (`t1-lebenszeit.js`, Ergebnis `t1-zahlen.json`, `t1-reihen.json`, `t1-wechsel.json`, `t1-aussetzer.json`):
7.299 Aktienreihen; nach der alten Regel (letzter Tagesbalken ≥ 17.08.2026) 2.306 lebend. Der letzte Minutentag kommt aus dem
Manifest (größter `letzter` der Jahresdateien, als **ET-Tag** gelesen — 4.264 Dateien enden in der UTC-Stunde 0, also am Vortag).
Bei 5.040 Reihen ist er gleich dem Feld der Lebenszeit-Tafel, bei 2.259 später (das Archiv ist seit dem 06.09. gewachsen), nie früher.

| Regel | lebend | lebend → abgegangen | abgegangen → lebend | Unterschied zur nächsten Zeile |
|---|---|---|---|---|
| alt (Tagesbalken, Tafel 03.09.) | 2.306 | — | — | |
| X = 0 | 2.243 | **63** | 0 | zusätzlich AAC~2, ISRL, MATR (1 Tag), DBRG (3), GBTG (4), CSAN (10) |
| X = 5 | 2.248 | **58** | 0 | zusätzlich CSAN |
| X = 10 | 2.249 | **57** | 0 | — |
| X = 20 | 2.249 | **57** | 0 | — |

**Die 57** (Liste: `t1-wechsel.json`, 30 größte und 20 gezogene im Anhang): 42 mit Nachleben der Tagesbalken über 30 Tage (die „39"
des PM, heute 38 — siehe unten — plus CREG, NVVE, SGRP, VSTD mit Ende im Juli), 15 Abgänge aus den Wochen vor dem Tafelstand
(05.08.–02.09.2026, darunter EQR, LBRDA, LBRDK, WBS, TWO, LEG, HLX, CRNX, APGE). **52** tragen ein Polygon-Abgangsdatum 1–4 Tage nach
dem letzten Minutentag, die übrigen **5** (APGE, CRNX, HLX, LEG, TWO; Ende nach dem Stand der Polygon-Liste) eine Alpaca-Maßnahme
(Barübernahme, Aktientausch, Umbenennung) 1–2 Tage danach. Unbelegt ist keiner.

**Aussetzer in den letzten 60 Handelstagen** (letzter Minutentag 09.07.–01.10.2026, alle Aktienreihen, Regel der Klärung 2): 83 Reihen.

| Gruppe nach der Regel | Reihen | davon bisher „lebend" | Befund |
|---|---|---|---|
| Abgang (Polygon-Datum 0–15 Tage danach) | 72 | 15 | Abstand 1 Tag 31-mal, 2 Tage 16, 3 Tage 18, 4 Tage 7 |
| „Lücke der Sammlung" (kein Datum, Tagesbalken bis zuletzt) | 6 | 6 | **keine ist eine Lücke** — siehe Tabelle |
| unklar | 5 | 5 | alle fünf haben eine Alpaca-Maßnahme 1–2 Tage nach dem letzten Minutentag: Abgänge |

| Reihe | letzter Minutentag | Abstand | dafür (Lücke der Sammlung) | dagegen | Urteil |
|---|---|---|---|---|---|
| AAC~2 | 01.10. | 1 | kein Abgangsdatum | 20 Minutentage an 25 Handelstagen, 1–3 Kerzen je Tag: handelt nicht täglich | lebt, illiquide |
| ISRL | 01.10. | 1 | kein Abgangsdatum in der Nähe | 15 Minutentage seit 01.09., 1–7 Kerzen je Tag (neuer Träger des Kürzels) | lebt, illiquide |
| MATR | 01.10. | 1 | kein Abgangsdatum in der Nähe | 111 Minutentage an 188 Handelstagen, schon dreimal 5–6 Tage Pause | lebt, illiquide |
| DBRG | 29.09. | 3 | Polygon-Liste endet am 21.08. — sie kann den Abgang nicht kennen | bis zuletzt 3–5 Mio Stück je Tag, Schluss an den letzten drei Tagen genau 16,00, Yahoo endet am selben Tag; der Nachlauf fragt jede Nacht ab dem letzten Stempel, die Datei endet nach dem Lauf vom 03.10. trotzdem dort | Abgang (Übernahme) |
| GBTG | 28.09. | 4 | wie DBRG | bis zuletzt 2–5 Mio Stück je Tag bei 9,46–9,52, danach nichts; Nachlauf fragt nach | Abgang, sehr wahrscheinlich |
| CSAN | 18.09. | 10 | wie DBRG | bis zuletzt 2–4 Mio Stück je Tag, danach zehn Handelstage nichts; Nachlauf fragt nach | Abgang, sehr wahrscheinlich |

**Warum es keine Lücke der Sammlung sein kann:** der Nachlauf (`tools/alpaca-vollsammlung.js --nachholen`) fragt jede Nacht für jede
Reihe mit einer 2026er Datei (4.019) ab ihrem letzten Stempel + 1 Minute bis zum letzten abgeschlossenen Handelstag — ohne Deckel
nach hinten. Von 2.238 Reihen, die 2025 an allen 250 Tagen Minuten hatten und heute bis zum Ende laufen, haben **2.235** auch 2026
alle 189 Handelstage (zwei fehlen 1–2 Tage, eine mehr als fünf: BURU).

**POWL und IESC (Rückblick Nr. 74) sind keine Lücke der Sammlung, sondern eine veraltete Kopie.** Die Rohdatei `alpaca1m/POWL/2026.json`
läuft bis zum 02.10. (189 Minutentage wie AAPL). Der Leser nimmt aber die bereinigte Kopie, wenn es eine gibt (`lesen.js`,
`dateiPfad`), und die Kopien stammen vom 06.09. und werden nicht fortgeschrieben. Eine Kopie des laufenden Jahres gibt es für jede
Reihe mit einem Split 2026 (POWL: 3:1 am 06.04.2026). **Gezählt:** 97 bereinigte 2026er Dateien, bei **64** läuft die Rohdatei weiter;
unter den Aktienreihen **33** (`t1-leser-veraltet.json`: AGL ALIT AMCR ANAB APH APTV BKNG BYND CMCSA CRWD CVNA FDX FUBO IESC KLAC
LILAK MIDD MLI MNST MQ PANW PIPR POWL REZI RUSHA SBS SF SFBS SNEX SPGI TRI WHLR mit Leser-Ende 03.09., BURU mit 17.07.). Jeder
Leser über `lesen.js` — auch der Panelbau — sieht diese Reihen nur bis dorthin.

**Sonderfall BURU:** Polygon führt den Abgang am 20.07.2026; die Minuten enden am 17.07. bei 0,0727 $ und setzen am 14.09. bei 1,42 $
wieder ein (39 Handelstage ohne Kerze, seither 15 Minutentage mit Millionenumsatz). Nach jeder Regel X lebt die Reihe — zu Recht —,
aber über die Pause steht ein Kurssprung um das 19,5-fache, den kein Maßnahmensatz erklärt (das Maßnahmen-Archiv endet am 03.09.).
Die 90-Tage-Regel des Panels trennt nicht (59 Kalendertage).

**Zur Wahl von X — gemessen am Panel v2.2** (`t1-pausen.json`): Pausen weiterlaufender Reihen in den letzten 250 Panel-Tagen. Eine
Regel X hält eine Reihe an jedem Tag einer Pause, der mehr als X Handelstage nach ihrer letzten Zeile liegt, fälschlich für abgegangen.

| X | Pausen länger als X | Reihen | fälschlich „abgegangen" je Tag (Mittel) | davon Klasse 1–3 |
|---|---|---|---|---|
| 0 | 821 | 84 | 6,08 | 1 Pause von einem Tag |
| 1 | 311 | 50 | 2,84 | 0 |
| 3 | 75 | 26 | 1,03 | 0 |
| 5 | 39 | 19 | 0,55 | 0 |
| 10 | 8 | 8 | 0,16 | 0 |
| 20 | 2 | 2 | 0,04 | 0 |

Die neun Pausen über zehn Handelstage sind Mantelgesellschaften und Kleinstwerte ohne Klasse (OAKU 25 und 19 Tage, AREB 24, DYCQ 20,
FORL 15, ATMC 13, ALCY 12, KVAC 12, HSPO 11). Die Gegenseite: im selben Fenster enden 576 Reihen wirklich, rund 2,3 je Handelstag —
am Rand des Archivs gelten bei X also im Mittel 2,3 × X schon abgegangene Reihen noch als lebend (heute bei X = 10: DBRG, GBTG, CSAN).

**Vorschlag: X = 10 — zusammen mit einem Deckel für das Panel.** Begründung: (1) ein fälschlich „abgegangener" Wert bekommt eine Zeile
in der Gründe-Tafel mit einem Grund, der zu einer anderen Firma oder einem alten Ereignis gehört (im Trockenlauf bei X = 0 gesehen:
AAC~2, eine lebende Mantelgesellschaft, bekäme „Übernahme, Kodiak AI, 8-K vom 30.09.2025") — das ist ein falscher Inhalt, der bleibt;
ein zu spät erkannter Abgang ist nur eine fehlende Zeile, die der nächste Bau nachträgt. X = 10 senkt die erste Fehlerart auf 8 Fälle
in 250 Tagen (X = 5: 39). (2) Die zweite Fehlerart verschwindet ganz, wenn das Panel **mindestens X + 1 Handelstage vor dem Ende des
Archivs** endet (heute 13: der 15.09. gegen den 02.10.) — dann ist jede Reihe, die im Panel endet, entschieden. (3) X = 10 und X = 20
liefern heute dieselben 57; die alte Regel entsprach rund 13 Handelstagen, die Menge „lebend" ändert sich also nur um den Fehler
selbst. Wer das Panel bis an den Rand führen will, nimmt X = 5 und lebt mit 0,55 falschen Abgängen je Tag (bisher nie in Klasse 1–3).

**Zahlen des PM zu T1:** 7.299 stimmt. 257 stimmt (mit den Feldern der Lebenszeit-Tafel wie mit dem Manifest; 260, wenn man bei den
drei erloschenen Trägern AAC, CAPA, JONE den letzten Tagesbalken des Kürzels statt des Schnitts nimmt). 39 stimmt nach dem Feld der
Lebenszeit-Tafel; nach dem Manifest sind es **38**, weil BURU wieder handelt. „Für alle 39 ein Polygon-Datum 1–4 Tage danach" stimmt
(39 von 39). Nebenbefund: die zwei alten Regeln sind nicht dieselbe — `lesen.js` vergleicht mit Mitternacht UTC, `universum.js` mit
12 Uhr UTC; drei Reihen mit letztem Tagesbalken genau am 17.08. (EQR, FTRK, ISSC) sind im Leser lebend und stehen zugleich in der
Gründe-Tafel (im Panel: `lebend 1` mit Grund „umbenennung-ticker").

## T3 — Wirkung auf das Panel v2.2

**Gezählt** (`t3-panel.js` über `PR.Tafel`, Ergebnis `t3-zahlen.json`, `t3-reihen.json`; Regel: der **letzte** Abschnitt eines Kürzels
erbt Leben, Grund und Datum, Abschnitte vor einem Schnitt behalten ihren Stand; neue Zeilen aus T2 nur, wenn die Reihe bei X = 10
nicht lebt). Panel: 7.479 Reihen, 9.904.017 Zeilen, Ende 15.09.2026.

| | Panel-Reihen | davon mit Klasse 1–3 in den letzten 250 Zeilen | davon Klasse 2–3 |
|---|---|---|---|
| anderer Stand insgesamt | **198** | **7** | 2 |
| `lebend` anders (1 → 0) | 57 | 5 (EQR, WBS, LBRDK, APGE, CRNX) | 1 (WBS) |
| `ende_grund` anders | 142 | 6 | 2 (SBNY, WBS) |
| `ende_datum` anders | 194 | 6 | 2 |
| nur das Datum anders | 53 | 0 | 0 |

| Totalverlust-Grund | kommt hinzu | fällt weg | in Klasse 1–3: hinzu / weg |
|---|---|---|---|
| Hauptzahl (Insolvenz, Zwangs-Delisting) | **82** (45 neu geankerte + 37 neue Reihen) | **13** | 0 / **1** (SBNY: Insolvenz → „freiwillig") |
| streng (zusätzlich unbekannt, freiwillig) | 73 | 13 | **1** (YNDX: Umbenennung → „unbekannt") / 0 |

Das ist eine Zählung über Reihen, kein Lauf des Prüfstands: gebucht wird nur, wer im Korb liegt, und das Universum der bisherigen
Messungen sind die Klassen 2–3 mit 250 Vortagen. Dort ändern sich **zwei** Reihen: WBS (kein Grund → Übernahme, weiter letzter Kurs)
und SBNY (verlöre den Totalverlust — siehe T2: alte wie neue Zeile stützen sich auf eine fremde Firma). Die fünf Klasse-1-Reihen
sind Übernahmen, Fusionen und Umbenennungen mit letztem Kurs (EQR, LBRDK, APGE, CRNX) und YNDX.

**Nebenfund am Panelrand:** 2.306 Reihen gelten im Panel als lebend; 2.215 haben ihre letzte Zeile am 15.09., **91 davor**: 57 sind
die Abgänge aus T1, **33 die Reihen mit veralteter bereinigter Kopie** (letzte Zeile 03.09., **23 davon mit Zeilen in Klasse 1–3**:
BKNG, CMCSA, CRWD, FDX, KLAC, PANW, SPGI …), eine handelt nicht täglich. Der Prüfstand bucht eine Reihe, deren letzte Zeile vor dem
Tag liegt, als beendet zum letzten Kurs (`halte()`, Zähler `tote`) — für Halteperioden über den 04.–15.09.2026 werden diese 33 also
am 03.09. ausgebucht. Das trifft nur die letzten acht Panel-Tage, aber große Werte.

**Zahlen des PM zu T3:** 45 stimmt (lebend, letzte Zeile mehr als 30 Tage vor dem Panel-Ende, alle ohne Grund). „Keine der 39 in
Klasse 1–3" stimmt für die 38, die es heute noch sind (37 ohne Klasse, eine in Klasse 0; WORX ist als `WORX~2` der letzte Abschnitt).
Für die **57** der Regel X = 10 gilt es nicht mehr: fünf standen in Klasse 1–3 — alle mit harmlosem Grund.

## T2 — Gründe-Tafel mit dem letzten Minutentag als Anker

**Wie gerechnet:** Kopien `t2-universum.js` (Anker = letzter Minutentag, „nicht lebend" nach T1), `t2-edgar.js` (Abruf und beide
Suchdurchgänge, eine Spur, 350 ms, Kennung per `require`), `t2-einstufen.js` (die Funktionen `fenster` und `urteil` wortgleich mit dem
Original — `test.js` vergleicht den Quelltext). Eingestuft: die **285** Zeilen mit Ankerverschiebung über 3 Tage und die **60** bei
X = 0 neu hinzukommenden Reihen (bei X = 5: 55, X = 10 und 20: **54**). Ausgabe `t2-gruende-neu.json` — eine Arbeitsdatei, keine Tafel.

**Cache (Nachtrag 4.2):** der Volltext-Cache je Kürzel wurde für **keine** der 345 Zeilen wiederverwendet (0 aus dem alten Cache,
345 + 30 neu gesucht, Ablage je Kürzel **und** Fenster). Der Cache je Firma ist nicht nach Fenster gefiltert, aber auf zwei Arten
fensterabhängig: er ist ein Stand vom 12.09.2026 (Fenster, die danach enden, sehen spätere Formulare nicht), und er hält nur
`filings.recent`, die letzten rund 1.000 Einreichungen (**1.192 der 4.288** Auszüge stoßen an diese Grenze). Benutzt wurde er nur,
wo er das neue Fenster nachweislich deckt: **257** Auszüge aus dem alten Cache, **113** neu geholt (32 wegen des Abruftags, 17 wegen
der 1.000er-Grenze, 64 fehlten), dazu 161 ältere Einreichungsdateien. Zusammen 680 Anfragen, 31 Wiederholungen, 0 offen.

**Ergebnis für die 285 Zeilen** (Matrix und alle Fälle im Anhang und in `t2-matrix.json`, `t2-kippfaelle.json`):

| | Zeilen |
|---|---|
| Grund und Beleg gleich | 144 |
| Grund gleich, Beleg oder Datum anders | 53 |
| „unbekannt" bekommt einen Grund (von 21 unbekannten; 5 bleiben unbekannt) | **16** |
| Grund **kippt** auf einen anderen belegten Grund | **69** |
| Grund kippt auf „unbekannt" (VERO, YGF, YNDX) | **3** |
| Firma (CIK) anders als in der alten Zeile | 46 (bei 24 beide belegt und verschieden) |

Die großen Ströme: Übernahme → Zwangs-Delisting 15, Insolvenz → Zwangs-Delisting 10, unbekannt → Zwangs-Delisting 11, Umbenennung →
Zwangs-Delisting 8, freiwillig → Zwangs-Delisting 8, Zwangs-Delisting → Übernahme 7. Das Muster dahinter: die Aktie verlässt die
Börse nach einer Rüge (8-K 3.01) und lebt im Freiverkehr weiter; was Monate später folgt (Insolvenz, Übernahme, Umbenennung auf …Q
oder …F), stand im Fenster um den zu späten Anker. **Neue Reihen (X = 10): 54** — Zwangs-Delisting 36, Übernahme 7, Umbenennung 4,
Aktientausch 3, freiwillig 2, Insolvenz 1, unbekannt 1. Die Tafel im Ganzen ginge von 4.996 auf 5.050 Zeilen, Zwangs-Delisting von
547 auf 628, unbekannt von 212 auf 200, Insolvenz von 357 auf 345.

**Zwei Außenprüfungen** (in `t2-zahlen.json` → `pruefsteine`), weil eine Regel ohne Außenanker nur sich selbst bestätigt:

| Prüfung | alte Tafel (alle 4.996) | dieselben 285 Zeilen alt | Trockenlauf neu (339 bei X = 10) |
|---|---|---|---|
| Firma gegen die **Polygon-CIK** des Kürzels (Eintrag ≤ 45 Tage vom Anker): stimmt / widerspricht | 3.477 / **333** (8,7 %) | 216 / 22 | 290 / **12** |
| Beleg „8-K 3.01": höchstens 30 Tage vom Anker / mehr als 30 Tage davor | 255 / 212 von 546 | — | **197** / 16 von 217 |
| Beleg „8-K 2.01 + Prospekt": höchstens 30 Tage vom Anker / mehr als 30 Tage davor | 669 / 76 von 745 | — | **0 / 18** von 18 |

Gelesen: der neue Anker ist der richtige (die Rüge liegt jetzt am Reihenende), und die Firmen stimmen häufiger. Aber von den 72
Kipp-Fällen bestehen nur **39** beide Prüfungen (Firma passt zu Polygon **und** Beleg höchstens 30 Tage am Anker), von den 16 neu
begründeten 11. Die übrigen zeigen drei Schwächen der Einstufung, die es schon gab und die der richtige Anker freilegt:

1. **Der Vollzug zählt 550 Tage rückwärts.** `urteil()` nimmt ein 8-K 2.01 mit Prospekt als Übernahme, wenn es bis zu 550 Tage **vor**
   dem Anker liegt. 2.01 meldet aber auch den Vollzug des **eigenen** Börsengangs über einen Mantel und eigene Zukäufe. Alle 18
   „Übernahmen" dieser Art im Trockenlauf liegen mehr als 30 Tage vor dem Reihenende (8 mehr als 180) — die Firma stimmt dabei fast
   immer (15 von 16 mit Außenanker), falsch ist das Ereignis: MVLA (8-K/A 2.01 vom 31.03.2023 nach der Mantel-Fusion,
   Zwangs-Delisting 04/2024 — die alte Zeile war richtig), PNST, ATEK. In der alten Tafel betrifft das 76 von 745 Zeilen.
2. **Die Firma kommt aus einer Mehrheit von Suchtreffern.** Wer im Fenster am häufigsten das Kürzel erwähnt und irgendein
   Abmelde-Formular eingereicht hat, gilt als bestätigt — das erfüllen Dauer-Einreicher immer. Am deutlichsten beim Formular 25 als
   einzigem Beleg: 11 Zeilen, von den 8 mit Außenanker gehören **4 einer fremden Firma** (EXPR → JPMorgan, IDEX → iShares Trust,
   MARK → Goldman Sachs, SBNY → UBS). Das 8-K 3.01 hält dagegen: 166 von 170 stimmen. **SBNY** (Signature Bank, Klasse 2–3) zeigt den
   Fehler in beiden Tafeln: die Bank reicht nicht bei der SEC ein; die alte Zeile „Insolvenz" stützt sich auf das 8-K 1.03 von
   **Core Scientific**, die neue „freiwillig" auf ein 25-NSE der **UBS AG**. Der Totalverlust stand zufällig richtig und ginge
   zufällig verloren. Polygon führt für 4.467 der 4.996 Zeilen eine CIK am Abgangsdatum.
3. **Formular 25 ohne 8-K heißt „freiwillig"** — das 25-NSE reicht aber die **Börse** ein, auch wenn sie selbst streicht. Als
   alleiniger Beleg trägt es den Grund nicht; im Trockenlauf ist das von Schwäche 2 nicht zu trennen (dieselben Zeilen).

Die 33 nicht sauberen Kipp-Fälle: 14 mit richtiger Firma, aber Beleg fern vom Anker; 7 ohne Außenanker mit fernem Beleg; 5 ohne
Außenanker mit Beleg am Anker; 4 mit fremder Firma; 3 verlieren den Grund.

Dazu zwei Fragen an die Buchung, nicht an die Einstufung: ein 8-K 3.01 steht auch bei **freiwilligem** Rückzug (FXLV, F45 Training)
und bei Mantelgesellschaften, die Nasdaq nach 36 Monaten streicht und die zum Treuhandwert weiterlaufen (NVAC) — beide würden als
„Zwangs-Delisting" zum Totalverlust; und YNDX (Handel am 28.02.2022 ausgesetzt, 2024 als NBIS zurück) wird „unbekannt".

**Zahlen des PM zu T2:** 4.996, 285, 223, 20 und 15 stimmen alle. „39 fehlen der Tafel ganz" stimmt nach seinem Maß (0 von 39 in der
Tafel); nach der Regel X = 10 fehlen **54** (57 Wechsler, von denen die Tafel EQR, FTRK, ISSC schon führt). „Über alle Reihen des
Panels 45" stimmt.

## T6 — Umstellung und Verlängerung

**(a) Stellen mit `voll/` als fester Vorgabe** (`t6a-voll-stellen.json`; durchsucht 207 Dateien `studien/*/*.js`, 45 Treffer des
Musters, jeder angesehen: 18 lesen das Panel v2.1, 7 meinen einen eigenen Ausgabeordner namens `voll`, 20 sind Kommentar oder ein
anderes Wort). Die drei dem PM bekannten Stellen stimmen; es kommen 15 hinzu. Tabelle im Anhang. **Werkzeug, umstellen (5):**
`mehrfaktor/zelle.js` 69, `fundamental-machbarkeit/bauen.js` 386 und `test-fundamental.js` 309, `querschnitt-pruefstand/bericht.js` 17
und `test.js` 20. **Abgeschlossen, bleibt (13):** Nachrichten-Stimmung (4), GDELT-Namenskarte (1), Diagnosen und Vergleiche des
Prüfstands (8). Schon auf v2.2: Rückblick Nr. 74 und Auftrag Nr. 80. `kontrollen.js`, `kandidaten.js`, `teil3.js`, `teil4.js`
verlangen `--aus` und tragen keine Vorgabe. **Achtung bei `bauen.js`:** dort genügt der Pfad nicht — `kursAm()` sucht den Kurs unter
dem Namen der Leser-Reihe, in v2.2 liegen die Zeilen nach einer Lücke aber unter `~2`/`~3`/`~4`.

**(b) Bilanz-Leser gegen die Reihen von v2.2** (`t6b-bilanz-leser.json`): 7.478 Reihen (ohne SPY). Der Leser sucht den Namen wörtlich,
dann ohne `~2`.

| | Reihen |
|---|---|
| finden eine Firma | 6.961 |
| finden **keine** | **517** — davon hatten 509 schon in v2.1 keine, **8** verlieren sie |
| davon mit `~3` / `~4` | 7 / 2 — alle neun ohne Firma (AAC~3, CPAA~3, GIG~3, GIG~4, HYAC~3, HYAC~4, ISRL~3, LCA~3, LEXEB~3) |
| mit `~2` | 173: 153 bekommen die Firma des Basis-Kürzels, 3 eine eigene (AAC~2, CAPA~2, JONE~2), 17 keine |
| eine **andere** Firma als ihr Kürzel in v2.1 | **0** |

Der Verdacht „falsche Firma bei getrennten Abschnitten" bestätigt sich anders als gedacht: der Leser gibt in v2.2 **dieselbe** CIK wie
in v2.1 — nur war sie dort schon für einen der beiden Zeiträume falsch, weil die Zuordnung am Reihenende hängt. Von 74 Paaren
aufeinanderfolgender Abschnitte, die laut `reihen-abschnitte.json` nicht dasselbe Papier sind, bekommen **61** dieselbe CIK (32 davon
sicher verschiedene Emittenten); bei **14** liefert der Leser in **beiden** Zeiträumen Bilanzen (ALTS, BBBY, BTU, CHK, CIVI, CORZ, CRC,
CTRA, GPOR, KCAC, RDUS, RSLS, TBRG, VAL — acht davon sicher zwei Emittenten: der alte BBBY-Abschnitt bis 05/2023 bekommt 30 Filings
der späteren Beyond Inc., Radius Health 27 der späteren Radius Recycling). 22 Abschnitte widersprechen dem Polygon-Inhaber (einer mit
Filings im Abschnitt: LVNTB~2).

**(c) Minuten nach dem Panel-Ende** (`t6c-minuten-nach-panel.json`, Tabelle im Anhang): 13 Handelstage (16.09.–02.10.2026). 2.249
Aktienreihen haben Minuten über den 15.09. hinaus, 2.243 bis zum 02.10.; über den Leser sichtbar sind 33 weniger (2.216 → 2.210).
Eine Verlängerung brächte rund **29.200** Zeilen (+0,3 %). **Kosten:** der Bau kennt kein Anhängen — ein Vollbau wie v2.2 dauert
2 h 15 min bis 4 h (vier Teile, Platte E: als Engpass, 45.107 Dateien, 122,8 GB gelesen) und belegt als neuer Ordner rund 910 MB. Die
2026er Dateien allein sind 2.643 Dateien und 7,3 GB (6,3 % der Bytes; ein anhängender Bau läse sie in rund 10 Minuten je Teil, müsste
aber erst gebaut werden). **Vorher nötig:** die 64 veralteten Kopien, eine neue Lücken-Liste, die Lebenszeit aus T1 — und eine
Entscheidung zu den Maßnahmen: das Archiv endet am 03.09., Splits danach kennt es nicht.

## T5 — die abgelehnten Split-Sätze in den bereinigten Kopien (Nr. 41)

**Gezählt** (`t5-splits.js`, 93 Jahresdateien gelesen; alle 47 Sätze im Anhang und in `t5-saetze.json` mit Kurs davor/danach in Roh-
und bereinigter Datei). 47 abgelehnte Sätze; für 3 gibt es keine Kopie (FNF 02.10.2017, HON 29.06.2026, INPX 04.09.2018);
**44 sind angewandt** (die Kopie trägt vor dem Ex-Tag genau den Faktor, danach nicht mehr).

| Sprung in der Kopie am Ex-Tag | Sätze | |
|---|---|---|
| ≤ −50 % | **32** | |
| abwärts, kleiner | **6** | GSK −16 %, IHG −17 %, IR −11 %, MFGP −17 %, MNTX −49,2 %, WHLR −48,4 % |
| aufwärts | **6** | DRS +43 %, EBIX +187 %, MFCB **+10.207 %**, MFH +7,7 %, SMTS +4.612 %, TRNX +281 % |

| Zeigt die Rohdatei den Sprung? | Sätze | |
|---|---|---|
| am Ex-Tag | 0 | (deshalb abgelehnt) |
| einen Handelstag daneben | 6 | BHAT, HK, RELV, SWI, WHLR: echter Split, der Satz nennt den letzten Tag **vor** dem Split — die Kopie ist an genau einem Tag falsch; MFH (Faktor 0,9) nicht sicher |
| gar nicht (± 3 Handelstage) | **41** | falscher Satz — die Kopie ist an **allen** Tagen vor dem Ex-Tag um den Faktor falsch |

**Vorschlag:** neu zu bilden wären **147 Jahresdateien in 44 Reihen** (jede Kopie der Reihe bis zum Ex-Jahr; Liste je Satz in
`t5-saetze.json` → `kopienBisExJahrListe`). Zwei Wege, beide ohne die Rohdateien anzufassen und ohne zu überschreiben: (A) der
Kopienbau übernimmt die Split-Sperre des Panels (`K.SPLIT_SPERRE_*`) und schreibt die 147 Dateien in einen neuen Ordner
`alpaca1m-bereinigt-v2/`, der Leser bekommt den Ordner als Vorgabe für neue Studien; für die fünf verschobenen Splits wird der Ex-Tag
um einen Handelstag nach hinten gesetzt statt der Satz verworfen. (B) kein Neubau: der Leser bekommt eine Korrekturliste Reihe × Ex-Tag
und rechnet den Faktor für diese Sätze zurück (die Rückrechnung `rohFaktor` gibt es schon). (A) ist sauberer und kostet Minuten
(44 Reihen), (B) lässt E: unberührt. **Zahlen des PM:** 44 angewandt stimmt, 32 Sprünge ≤ −50 % stimmt; „7 kleinere, 5 nach oben, bis
+10.591 %" zähle ich als **6 / 6 und +10.207 %** (Schluss der letzten regulären Kerze vor und ab dem Ex-Tag; der eine Satz Unterschied
ist MFH mit +7,7 %, die Höhe bei MFCB hängt am gewählten Kurs).

## T4 — der Minuten-Leser kennt die 90-Tage-Regel nicht

**Gezählt** (aus `voll-v22/reihen-abschnitte.json` und beiden Panels, `t4-luecken.json`): 173 Kürzel mit mehr als einem Abschnitt,
182 Abschnittsanfänge nach dem ersten — **141** nach einer Lücke über 90 Tage, **38** nach einem Kürzelwechsel, 3 „zweite
Archiv-Reihen" (AAC~2, CAPA~2, JONE~2), die der Minuten-Leser als einzige selbst trennt. **Betroffen: 179 Anfänge in 171 Kürzeln.**

| | |
|---|---|
| Panel-Tage in den je ersten 38 Zeilen nach dem Schnitt | **6.616** (8 Abschnitte sind kürzer als 38 Zeilen) |
| davon in Klasse 1–3 — Klasse aus v2.1, also über die Lücke gerechnet, wie eine Studie ohne Trennung sie sah | **391** in 15 Anfängen (Klasse 2–3: 55) |
| davon in Klasse 1–3 in v2.2 | 0 — dort beginnt die Klasse nach dem Schnitt neu (40 Zeilen ohne Klasse) |
| Klasse des neuen Abschnitts an seiner 41. Zeile | ohne Klasse 120, Klasse 0: 40, Klasse 1: 8, Klasse 2: 2 (9 kürzer) |

Für eine Stundenstudie mit Umsatztor sind die 391 Tage die Obergrenze dessen, was über zwei Firmen hinweg gerechnet wurde; die
Kapitulations-Messung (Tor 50 Mio $) liegt weit darüber. **Zahl des PM:** „v2.1 trennte schon 39 Kürzelwechsel" — es sind **38**
(`_stand.json` → `kuerzelwechsel.n`, auch in PANEL-V22.md); 141 Lücken stimmt.

---

## Zahlen des PM, nachgezählt

| Behauptung | gezählt | |
|---|---|---|
| 7.299 Aktienreihen | 7.299 | stimmt |
| 257 mit Tagesbalken über 90 Tage hinter den Minuten | 257 | stimmt |
| 39 lebend trotz Minuten-Ende über 30 Tage vor dem Stichtag | 39 nach der Tafel, 38 nach dem Manifest | stimmt; BURU handelt wieder |
| 4.996 Zeilen, 285 abweichend, 223 über 90 Tage, 20 unbekannt, 15 ohne passenden Beleg | 4.996 / 285 / 223 / 20 / 15 | stimmt |
| 39 fehlen der Tafel, im Panel 45 | 39 (bei X = 10: 54) / 45 | stimmt |
| keine der 39 in Klasse 1–3 | 0 von 38 | stimmt; von den 57 bei X = 10 aber fünf |
| 141 Lücken, „39 Kürzelwechsel" | 141 / **38** | Kürzelwechsel: eins zu viel |
| 44 Split-Sätze angewandt, 32 / 7 / 5, bis +10.591 % | 44, 32 / **6 / 6**, bis **+10.207 %** | Aufteilung und Höhe weichen ab (Messweise) |
| drei Stellen mit `voll` | 18 Stellen | die drei stimmen, 15 weitere |
| POWL und IESC enden am 03.09., womöglich Lücke der Sammlung | Rohdateien laufen bis 02.10. | **keine Lücke der Sammlung**, veraltete bereinigte Kopie |
| 132 neue `~2`-Reihen bekämen die Bilanz des Basis-Kürzels, 9 mit `~3`/`~4` keine | 153 `~2` (mit den 38 aus v2.1) / 9 | stimmt in der Sache |

## Vorschlag für Phase 2

**Regel.** (R1) Lebenszeit, Reihenende und „erwartete Jahre" kommen aus dem Manifest: lebend = letzter Minutentag höchstens **10**
Handelstage vor dem Ende des Archivs; ein Panel endet mindestens 11 Handelstage vor dem Ende des Archivs. (R2) Der Leser nimmt eine
bereinigte Kopie nur, wenn sie so weit reicht wie die Rohdatei — sonst bricht er ab oder liest den Rest roh (nur zulässig, wenn seit
dem Stand der Kopie kein Split bekannt ist). (R3) Gründe-Tafel: Anker = letzter Minutentag; Firma = Polygon-CIK, wo vorhanden,
Volltextsuche nur als Rückfall; 8-K 2.01 zählt nur höchstens 30 Tage um den Anker; Formular 25/25-NSE ohne 8-K 3.01 wird
„abgemeldet, Anlass offen" statt „freiwillig" und zählt nur von der richtigen Firma.

**Neue Dateien — nichts wird überschrieben.**

| Was | Datei | Aufwand |
|---|---|---|
| Lebenszeit aus den Minuten | `E:/…/alpaca1m/_lebenszeit-minuten.json` neben der alten (je Reihe erster/letzter Minutentag, Minutentage, Jahre mit Datei, lebend, Stand des Manifests; dazu die Abweichung zum Tagesbalken als Zahl — heute 291 über 30 Tage) | Skript über das Manifest, Sekunden; nach jedem Nachlauf neu |
| Leser | neue Funktion in `lesen.js` (`reihenMinuten()` o. ä.) mit eigener Kennung; die alte bleibt für abgeschlossene Studien | klein |
| bereinigte Kopien | `E:/…/alpaca1m-bereinigt-v2/`: die 147 Dateien aus T5 und die 64 veralteten 2026er Kopien | Minuten; künftig nach dem Nachlauf |
| Gründe-Tafel | `verschwundene-gruende-v2.json`, Kennung `…/v2`, 5.050 Zeilen; alte Tafel bleibt | zweiter Trockenlauf über alle Zeilen: rund 9.000 Anfragen — im hier gefahrenen Takt (680 Anfragen in 574 s) rund zwei Stunden, mit 6 je Sekunde wie am 12.09. rund 25 Minuten |
| Panel | `voll-v23/` mit neuer Lücken-Liste, R1, Tafel v2, bis Archivende − 11 Handelstage | Vollbau 2–4 h |
| Bilanz-Leser | Zuordnung je Abschnitt aus `reihen-abschnitte.json` (früherer Abschnitt ohne bestätigte CIK → keine Bilanz) | mit Trockenlauf an den 14 Paaren |

**Prüfungen.** Kunstfälle wie in `test.js` (lebend / abgegangen / Pause am Rand; früherer Anker). Lebenszeit: 57 Wechsler, 0 umgekehrt,
Liste gegen `t1-wechsel.json`. Gründe-Tafel v2: Matrix alt → neu über alle Zeilen, jeder Kipp-Fall namentlich, Polygon-Übereinstimmung
nicht schlechter als heute (3.477 von 3.810), Beleg am Anker (3.01 und 2.01 je Anteil ≤ 30 Tage). Panel v2.3 gegen v2.2 mit
`pruefung-v22.js`: Zeilen bis 15.09. bitgleich außer den 33 Reihen mit veralteter Kopie (neue Zeilen 04.–15.09.) und den 44 Reihen
aus T5; dritter Schlüssel für `REGRESSION23_ERWARTET`.

**Reihenfolge.** 1 Lebenszeit-Datei und Leser-Regel R2 (keine Urteile, sofort) → 2 Entscheidung Maßnahmen-Abruf → 3 Kopien v2 →
4 zweiter Trockenlauf Gründe-Tafel → Abnahme durch den PM → Tafel v2 → 5 Panel v2.3 → 6 Bilanz-Zuordnung → 7 die fünf Werkzeug-Stellen
aus T6a umstellen.

**Was vorher zu entscheiden ist.**

1. **X = 10 mit Panel-Deckel** (Vorschlag) oder X = 5 ohne Deckel?
2. **Gründe-Tafel:** nur neu ankern (72 Kipp-Fälle, davon 33 nicht sauber, SBNY verliert den Totalverlust) oder erst die drei Regeln
   ändern und noch einmal zählen (Vorschlag)?
3. **Buchung:** Mantelgesellschaften mit Zwangs-Delisting und ausgesetzte Werte (YNDX) — Totalverlust, letzter Kurs oder eigener Grund?
4. **Neue Abrufe:** Maßnahmen bei Alpaca ab 04.09.2026 (für jede Verlängerung nötig) und die Polygon-Liste ab 22.08.2026 (sonst bleiben
   Abgänge wie DBRG, GBTG, CSAN ohne zweite Quelle) — beides braucht einen Auftrag, dieser Trockenlauf hat nichts abgerufen.
5. **Kopien:** Neubau in einen neuen Ordner (A) oder Korrekturliste im Leser (B)? Und wer schreibt die Kopien künftig fort?
6. **BURU** und künftige Fälle „Kürzel kommt nach dem Abgang wieder": trennen (die Pause war kürzer als 90 Tage) oder Split nachtragen?
7. **Bilanz:** frühere Abschnitte ohne bestätigte CIK ohne Bilanz lassen (so Nr. 69) — das nimmt acht Kürzeln Bilanzen, die sie heute
   von der falschen Firma bekommen.
8. Offen aus PANEL-V22 §7: Namensregel der Abschnitte (weiterzählen oder chronologisch).

## Was nicht gezählt werden konnte

- **Splits und Maßnahmen nach dem 03.09.2026:** das Maßnahmen-Archiv endet dort; ohne Abruf ist nicht zählbar, wie viele der 2.249
  weiterlaufenden Reihen seither einen Sprung tragen (BURU ist ein Verdachtsfall).
- **Abgänge nach dem 21.08.2026** haben keine zweite Quelle (Polygon-Liste endet dort): die fünf „unklaren" sind über Alpaca-Maßnahmen
  belegt, DBRG/GBTG/CSAN nur über Indizien.
- **Freiwillig oder erzwungen** bei 8-K 3.01: steht im Text der Meldung, nicht in den Formularlisten.
- **Buchungen in einem echten Prüfstand-Lauf:** T3 zählt Reihen (wie in Klärung 4 verlangt), nicht Korbmitglieder.
- **Löcher innerhalb eines Tages** im Minutenarchiv: gezählt sind Minutentage je Jahr, nicht Kerzen je Tag.
- **Kerzen und Signale an den 44 Ex-Tagen** in den Minutenstudien (Frage 1 aus Nr. 41) und die 261-Kerzen-Zählung im Minutenarchiv
  selbst (T4 zählt nach Klärung 5 in Panel-Tagen).
- **Bigdata-Funde** (HOT, TARO, PDVW, CEL) wurden nicht neu abgefragt; keine der vier Reihen ist unter den 285.

## Dateien in diesem Ordner

`gemeinsam.js` (Lesehilfen und Zählregeln), `t1-lebenszeit.js`, `t2-universum.js`, `t2-edgar.js`, `t2-einstufen.js`, `t2-auswerten.js`,
`t3-panel.js` (auch T4 und die Pausen), `t5-splits.js`, `t6-umstellung.js`, `bericht.js` (setzt dieses Papier aus `teile/` zusammen),
`test.js` (50 Prüfungen, Kunstfälle). Ergebnisse: `t1-*.json` … `t6*.json`. Nicht im Repo: `edgar/` (Cache, über die `.gitignore` dieses Ordners).
Aufruf der Reihe nach: `node t1-lebenszeit.js`, `node t2-universum.js`, `node t2-edgar.js`, `node t2-einstufen.js`,
`node t2-auswerten.js`, `node --max-old-space-size=6144 t3-panel.js`, `node --max-old-space-size=4096 t5-splits.js`,
`node --max-old-space-size=6144 t6-umstellung.js`, `node bericht.js`, `node test.js`.

---

# Anhang: die Treffer im Text

Feste Saat je Ziehung (`gemeinsam.js` → `ziehe`, Mulberry32 über den Saat-Text, Liste vorher nach Reihenname sortiert) — der PM zieht
mit demselben Aufruf dieselben Fälle.

### T1 - Wechsel lebend -> abgegangen bei X = 10: die 30 groessten (Tagesbalken am weitesten hinter den Minuten)

| Reihe | letzter Minutentag | letzter Tagesbalken | Tage dazwischen | Abgang laut Polygon | Einordnung |
|---|---|---|---|---|---|
| WINT | 2025-08-20 | 2026-08-19 | 364 | 2025-08-21 (+1) | frueher |
| XAGE | 2025-09-11 | 2026-09-02 | 356 | 2025-09-12 (+1) | frueher |
| SISI | 2025-10-06 | 2026-09-02 | 331 | 2025-10-07 (+1) | frueher |
| BINI | 2025-10-10 | 2026-09-02 | 327 | 2025-10-13 (+3) | frueher |
| CARM | 2025-10-10 | 2026-09-02 | 327 | 2025-10-13 (+3) | frueher |
| PWM | 2025-10-10 | 2026-09-02 | 327 | 2025-10-13 (+3) | frueher |
| ENFY | 2025-10-13 | 2026-09-02 | 324 | 2025-10-14 (+1) | frueher |
| CERO | 2025-10-30 | 2026-09-02 | 307 | 2025-10-31 (+1) | frueher |
| DHAI | 2025-11-06 | 2026-09-02 | 300 | 2025-11-07 (+1) | frueher |
| TAIT | 2025-12-03 | 2026-09-02 | 273 | 2025-12-04 (+1) | frueher |
| MSPR | 2025-12-19 | 2026-09-02 | 257 | 2025-12-22 (+3) | frueher |
| GLBZ | 2025-12-22 | 2026-09-02 | 254 | 2025-12-23 (+1) | frueher |
| KAVL | 2025-12-22 | 2026-09-02 | 254 | 2025-12-23 (+1) | frueher |
| TTSH | 2025-12-26 | 2026-09-02 | 250 | 2025-12-29 (+3) | frueher |
| OMCC | 2025-12-31 | 2026-09-02 | 245 | 2026-01-02 (+2) | frueher |
| BSLK | 2026-01-02 | 2026-09-02 | 243 | 2026-01-05 (+3) | frueher |
| PRPH | 2026-01-02 | 2026-09-02 | 243 | 2026-01-05 (+3) | frueher |
| PTIX | 2026-01-02 | 2026-09-02 | 243 | 2026-01-05 (+3) | frueher |
| DGLY | 2026-01-07 | 2026-09-02 | 238 | 2026-01-08 (+1) | frueher |
| SYBX | 2026-01-20 | 2026-09-02 | 225 | 2026-01-21 (+1) | frueher |
| STAI | 2026-02-09 | 2026-09-02 | 205 | 2026-02-10 (+1) | frueher |
| SSKN | 2026-02-18 | 2026-09-02 | 196 | 2026-02-19 (+1) | frueher |
| ANEB | 2026-02-27 | 2026-09-02 | 187 | 2026-03-02 (+3) | frueher |
| RBOT | 2026-03-02 | 2026-09-02 | 184 | 2026-03-04 (+2) | frueher |
| ALUR | 2026-03-06 | 2026-09-02 | 180 | 2026-03-09 (+3) | frueher |
| LYRA | 2026-03-16 | 2026-09-02 | 170 | 2026-03-17 (+1) | frueher |
| NOTE | 2026-03-25 | 2026-09-02 | 161 | 2026-03-26 (+1) | frueher |
| SBDS | 2026-04-02 | 2026-09-02 | 153 | 2026-04-06 (+4) | frueher |
| ASNS | 2026-04-09 | 2026-09-02 | 146 | 2026-04-10 (+1) | frueher |
| WORX | 2026-04-13 | 2026-09-02 | 142 | 2026-04-14 (+1) | frueher |

### T1 - dieselbe Menge: 20 zufaellig gezogene (Saat `t1-wechsel-x10`)

| Reihe | letzter Minutentag | letzter Tagesbalken | Tage dazwischen | Abgang laut Polygon | Einordnung |
|---|---|---|---|---|---|
| ZSPC | 2026-04-27 | 2026-09-02 | 128 | 2026-04-28 (+1) | frueher |
| BNBX | 2026-07-13 | 2026-09-02 | 51 | 2026-07-14 (+1) | abgang |
| SISI | 2025-10-06 | 2026-09-02 | 331 | 2025-10-07 (+1) | frueher |
| SBDS | 2026-04-02 | 2026-09-02 | 153 | 2026-04-06 (+4) | frueher |
| PMNT | 2026-06-17 | 2026-09-02 | 77 | 2026-06-18 (+1) | frueher |
| TWO | 2026-08-24 | 2026-08-24 | 0 | - | unklar |
| WBS | 2026-08-19 | 2026-08-19 | 0 | 2026-08-20 (+1) | abgang |
| LBRDK | 2026-08-19 | 2026-08-19 | 0 | 2026-08-21 (+2) | abgang |
| VSEE | 2026-08-05 | 2026-09-02 | 28 | 2026-08-06 (+1) | abgang |
| SSKN | 2026-02-18 | 2026-09-02 | 196 | 2026-02-19 (+1) | frueher |
| PWM | 2025-10-10 | 2026-09-02 | 327 | 2025-10-13 (+3) | frueher |
| STAI | 2026-02-09 | 2026-09-02 | 205 | 2026-02-10 (+1) | frueher |
| GGRP | 2026-08-19 | 2026-08-19 | 0 | 2026-08-20 (+1) | abgang |
| ISSC | 2026-08-17 | 2026-08-17 | 0 | 2026-08-18 (+1) | abgang |
| LEG | 2026-08-26 | 2026-08-26 | 0 | - | unklar |
| XAGE | 2025-09-11 | 2026-09-02 | 356 | 2025-09-12 (+1) | frueher |
| NOTE | 2026-03-25 | 2026-09-02 | 161 | 2026-03-26 (+1) | frueher |
| ALUR | 2026-03-06 | 2026-09-02 | 180 | 2026-03-09 (+3) | frueher |
| APGE | 2026-09-02 | 2026-09-02 | 0 | - | unklar |
| LBRDA | 2026-08-19 | 2026-08-19 | 0 | 2026-08-21 (+2) | abgang |

### T3 - Panel-Reihen mit anderem Stand: die 30 mit den meisten Zeilen in Klasse 1-3 (letzte 250 Zeilen)

| Panel-Reihe | letzte Panelzeile | letzter Minutentag | lebend alt -> neu | Grund alt -> neu | Datum alt -> neu | Zeilen K1-3 (letzte 250) |
|---|---|---|---|---|---|---|
| EQR | 2026-08-17 | 2026-08-17 | 1 -> 0 | umbenennung-ticker -> umbenennung-ticker | 2026-08-18 -> 2026-08-18 | 250 |
| SBNY | 2023-03-10 | 2023-03-13 | 0 -> 0 | insolvenz -> freiwillig | 2024-01-17 -> 2023-06-16 | 250 |
| WBS | 2026-08-19 | 2026-08-19 | 1 -> 0 | null -> uebernahme | null -> 2026-08-21 | 250 |
| YNDX | 2022-02-25 | 2022-02-28 | 0 -> 0 | umbenennung-ticker -> unbekannt | 2024-08-21 -> null | 250 |
| LBRDK | 2026-08-19 | 2026-08-19 | 1 -> 0 | null -> fusion-aktientausch | null -> 2026-08-20 | 240 |
| APGE | 2026-09-02 | 2026-09-02 | 1 -> 0 | null -> uebernahme | null -> 2026-09-03 | 160 |
| CRNX | 2026-08-31 | 2026-08-31 | 1 -> 0 | null -> uebernahme | null -> 2026-09-02 | 21 |
| AACB | 2026-08-19 | 2026-08-19 | 1 -> 0 | null -> uebernahme | null -> 2026-08-25 | 0 |
| AATC | 2022-12-29 | 2022-12-29 | 0 -> 0 | unbekannt -> zwangs-delisting | null -> 2022-12-21 | 0 |
| ACER | 2023-11-08 | 2023-11-08 | 0 -> 0 | uebernahme -> fusion-aktientausch | 2023-11-20 -> 2023-11-21 | 0 |
| ADTX | 2026-06-24 | 2026-06-24 | 1 -> 0 | null -> zwangs-delisting | null -> 2026-06-24 | 0 |
| ADXS | 2021-12-22 | 2021-12-22 | 0 -> 0 | freiwillig -> zwangs-delisting | 2024-05-09 -> 2021-12-22 | 0 |
| AFIB | 2024-05-08 | 2024-05-08 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2024-05-17 -> 2024-05-03 | 0 |
| AGRX | 2024-03-25 | 2024-03-25 | 0 -> 0 | uebernahme -> zwangs-delisting | 2024-08-26 -> 2024-03-25 | 0 |
| AHI | 2024-01-31 | 2024-01-31 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2025-01-10 -> 2023-11-09 | 0 |
| AIEV | 2025-04-21 | 2025-04-21 | 0 -> 0 | zwangs-delisting -> uebernahme | 2025-04-21 -> 2024-08-06 | 0 |
| ALCE | 2025-02-11 | 2025-02-11 | 0 -> 0 | zwangs-delisting -> uebernahme | 2025-02-12 -> 2024-12-12 | 0 |
| ALJJ | 2022-09-09 | 2022-09-09 | 0 -> 0 | unbekannt -> uebernahme | null -> 2022-04-14 | 0 |
| ALUR | 2026-03-06 | 2026-03-06 | 1 -> 0 | null -> zwangs-delisting | null -> 2026-03-02 | 0 |
| ANEB | 2026-02-27 | 2026-02-27 | 1 -> 0 | null -> zwangs-delisting | null -> 2026-02-06 | 0 |
| ARDS | 2023-07-18 | 2023-07-18 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2025-05-13 -> 2023-07-18 | 0 |
| AREB | 2026-05-12 | 2026-05-12 | 1 -> 0 | null -> zwangs-delisting | null -> 2026-03-27 | 0 |
| ASAP | 2023-02-01 | 2023-02-01 | 0 -> 0 | insolvenz -> zwangs-delisting | 2024-04-02 -> 2023-01-24 | 0 |
| ASNS | 2026-04-09 | 2026-04-09 | 1 -> 0 | null -> zwangs-delisting | null -> 2026-04-09 | 0 |
| ASPU | 2023-03-30 | 2023-03-30 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2025-05-23 -> 2022-10-03 | 0 |
| ATEK | 2024-12-09 | 2024-12-09 | 0 -> 0 | spac-ende -> uebernahme | 2024-12-19 -> 2023-12-14 | 0 |
| ATIP | 2024-12-03 | 2024-12-03 | 0 -> 0 | uebernahme -> zwangs-delisting | 2025-09-05 -> 2024-12-03 | 0 |
| AVHI~2 | 2024-04-08 | 2024-04-08 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2024-09-06 -> 2024-06-11 | 0 |
| AXAC | 2023-05-17 | 2023-05-17 | 0 -> 0 | unbekannt -> spac-ende | null -> 2023-05-22 | 0 |
| AXAS | 2021-08-03 | 2021-08-03 | 0 -> 0 | unbekannt -> zwangs-delisting | null -> 2021-07-30 | 0 |

### T3 - dieselbe Menge: 20 zufaellig gezogene (Saat `t3-stand`)

| Panel-Reihe | letzte Panelzeile | letzter Minutentag | lebend alt -> neu | Grund alt -> neu | Datum alt -> neu | Zeilen K1-3 (letzte 250) |
|---|---|---|---|---|---|---|
| FRZA | 2024-10-09 | 2024-10-09 | 0 -> 0 | fusion-aktientausch -> zwangs-delisting | 2024-12-12 -> 2024-10-04 | 0 |
| LIPO | 2025-06-18 | 2025-06-18 | 0 -> 0 | insolvenz -> insolvenz | 2026-07-15 -> 2026-03-31 | 0 |
| HLGN | 2023-11-07 | 2023-11-07 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2025-08-11 -> 2023-11-07 | 0 |
| ENFY | 2025-10-13 | 2025-10-13 | 1 -> 0 | null -> zwangs-delisting | null -> 2025-10-27 | 0 |
| PBLA | 2024-03-06 | 2024-03-06 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2024-04-25 -> 2024-03-07 | 0 |
| DYNT | 2024-07-08 | 2024-07-08 | 0 -> 0 | insolvenz -> zwangs-delisting | 2026-01-12 -> 2024-06-28 | 0 |
| LTCH | 2023-08-09 | 2023-08-09 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2024-03-21 -> 2023-08-09 | 0 |
| PTPI | 2025-05-21 | 2025-05-21 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2025-11-07 -> 2025-05-21 | 0 |
| DMYY | 2025-09-29 | 2025-09-29 | 0 -> 0 | umbenennung-ticker -> zwangs-delisting | 2026-03-20 -> 2025-09-29 | 0 |
| CMCSV | 2025-12-23 | 2025-12-23 | 0 -> 0 | unbekannt -> freiwillig | null -> 2026-09-14 | 0 |
| TCON | 2024-06-27 | 2024-06-27 | 0 -> 0 | umbenennung-ticker -> zwangs-delisting | 2024-12-04 -> 2024-06-12 | 0 |
| LUNA | 2025-01-06 | 2025-01-06 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2025-01-27 -> 2025-01-06 | 0 |
| BLCM | 2023-06-01 | 2023-06-01 | 0 -> 0 | umbenennung-ticker -> zwangs-delisting | 2024-03-28 -> 2023-05-30 | 0 |
| GLBZ | 2025-12-22 | 2025-12-22 | 1 -> 0 | null -> freiwillig | null -> 2025-12-22 | 0 |
| GENE | 2024-10-16 | 2024-10-16 | 0 -> 0 | zwangs-delisting -> zwangs-delisting | 2023-08-04 -> 2024-08-09 | 0 |
| CWBR | 2023-11-28 | 2023-11-28 | 0 -> 0 | uebernahme -> zwangs-delisting | 2025-01-06 -> 2023-11-27 | 0 |
| LYRA | 2026-03-16 | 2026-03-16 | 1 -> 0 | null -> zwangs-delisting | null -> 2026-03-16 | 0 |
| HOFV | 2025-06-26 | 2025-06-26 | 0 -> 0 | uebernahme -> zwangs-delisting | 2025-12-31 -> 2025-06-25 | 0 |
| ANEB | 2026-02-27 | 2026-02-27 | 1 -> 0 | null -> zwangs-delisting | null -> 2026-02-06 | 0 |
| ASAP | 2023-02-01 | 2023-02-01 | 0 -> 0 | insolvenz -> zwangs-delisting | 2024-04-02 -> 2023-01-24 | 0 |

### T2 - Matrix Grund alt (Zeile) -> Grund neu (Spalte), 285 Zeilen mit geaendertem Anker

| alt \ neu | umbenennung-ticker | uebernahme | fusion-aktientausch | insolvenz | spac-ende | zwangs-delisting | freiwillig | unbekannt | Summe |
|---|---|---|---|---|---|---|---|---|---|
| umbenennung-ticker | 6 | **1** | . | . | **1** | **8** | **1** | **2** | 19 |
| uebernahme | . | 7 | **1** | . | **1** | **15** | **2** | **1** | 27 |
| fusion-aktientausch | . | . | . | . | **1** | **1** | . | . | 2 |
| insolvenz | . | **2** | . | 33 | . | **10** | **3** | . | 48 |
| spac-ende | . | **1** | . | . | 18 | **2** | **1** | . | 22 |
| zwangs-delisting | **1** | **7** | . | **2** | . | 126 | . | . | 136 |
| freiwillig | . | . | . | . | . | **8** | 2 | . | 10 |
| unbekannt | . | **2** | . | . | **1** | **11** | **2** | 5 | 21 |

### T2 - alle 72 Kipp-Faelle (alter Grund belegt, neuer Grund ein anderer)

| Reihe | Anker alt -> neu | alt: Grund (Beleg, Datum) | alter Beleg | neu: Grund (Beleg, Datum) | neuer Beleg | Firma | neuer Beleg: Tage zum Anker / Firma zu Polygon |
|---|---|---|---|---|---|---|---|
| ACER | 2024-10-17 -> 2023-11-08 | uebernahme (edgar-8K-2.01+prospekt, 2023-11-20) | 0001193125-23-280679 (8-K 2023-11-20) | fusion-aktientausch (alpaca-stock_mergers, 2023-11-21) | alpaca-massnahmen:d7e20bed-2eb0-486f-a9b4-d6220bc28072 | Acer Therapeutics Inc. -> - | +13 / ohne Firma |
| ADXS | 2025-03-21 -> 2021-12-22 | freiwillig (edgar-formular15, 2024-05-09) | 0000929638-24-001751 (15-12G 2024-05-09) | zwangs-delisting (edgar-8K-3.01, 2021-12-22) | 0001493152-21-032280 (8-K 2021-12-22) | Ayala Pharmaceuticals, Inc. | 0 / passt |
| AGRX | 2025-03-24 -> 2024-03-25 | uebernahme (edgar-8K-2.01+prospekt, 2024-08-26) | 0001104659-24-092914 (8-K 2024-08-26) | zwangs-delisting (edgar-8K-3.01, 2024-03-25) | 0001558370-24-003854 (8-K 2024-03-25) | AGILE THERAPEUTICS INC | 0 / passt |
| AIEV | 2026-04-20 -> 2025-04-21 | zwangs-delisting (edgar-8K-3.01, 2025-04-21) | 0001213900-25-033474 (8-K 2025-04-21) | uebernahme (edgar-8K-2.01+prospekt, 2024-08-06) | 0001213900-24-065349 (8-K/A 2024-08-06) | Thunder Power Holdings, Inc. | -258 / passt |
| ALCE | 2026-02-10 -> 2025-02-11 | zwangs-delisting (edgar-8K-3.01, 2025-02-12) | 0001213900-25-012325 (8-K 2025-02-12) | uebernahme (edgar-8K-2.01+prospekt, 2024-12-12) | 0001213900-24-108423 (8-K 2024-12-12) | Aedis Energy Inc. | -61 / passt |
| ASAP | 2024-04-01 -> 2023-02-01 | insolvenz (q-kuerzel+edgar-8K-1.03, 2024-04-02) | 0001653247-24-000019 (8-K 2024-04-02) | zwangs-delisting (edgar-8K-3.01, 2023-01-24) | 0001653247-23-000013 (8-K 2023-01-24) | Waitr Holdings Inc. | -8 / passt |
| ATEK | 2025-12-08 -> 2024-12-09 | spac-ende (edgar-mantel+abmeldung, 2024-12-19) | 0000876661-24-001197 (25-NSE 2024-12-19) | uebernahme (edgar-8K-2.01+prospekt, 2023-12-14) | 0001213900-23-095519 (8-K 2023-12-14) | Athena Technology Acquisition Corp. II | -361 / passt |
| ATIP | 2025-12-02 -> 2024-12-03 | uebernahme (alpaca-cash_mergers, 2025-09-05) | alpaca-massnahmen:eec370b1-bab6-4f7a-ab88-54592c4b9864 | zwangs-delisting (edgar-8K-3.01, 2024-12-03) | 0001815849-24-000063 (8-K 2024-12-03) | ATI Physical Therapy, Inc. | 0 / passt |
| BCEL | 2025-03-21 -> 2024-03-18 | uebernahme (edgar-8K-2.01+prospekt, 2024-02-27) | 0001213900-24-017157 (8-K/A 2024-02-27) | zwangs-delisting (edgar-8K-3.01, 2024-03-11) | 0001104659-24-032973 (8-K 2024-03-11) | CERO THERAPEUTICS HOLDINGS, INC. -> Atreca, Inc. | -7 / passt |
| BHAC | 2025-06-06 -> 2024-10-09 | fusion-aktientausch (alpaca-stock_mergers, 2025-06-06) | alpaca-massnahmen:19d65c4e-3cf4-451a-aec7-0f6380676fc1 | spac-ende (edgar-mantel+abmeldung, 2025-02-12) | 0001354457-25-000091 (25-NSE 2025-02-12) | Focus Impact BH3 Acquisition Co | +126 / passt |
| BLCM | 2024-03-27 -> 2023-06-01 | umbenennung-ticker (alpaca-name_changes, 2024-03-28) | alpaca-massnahmen:019979a6-4313-4f8b-af4a-16a0c4e7706f | zwangs-delisting (edgar-8K-3.01, 2023-05-30) | 0001628280-23-020109 (8-K 2023-05-30) | BELLICUM PHARMACEUTICALS, INC | -2 / passt |
| BLPH | 2024-12-18 -> 2023-10-13 | uebernahme (alpaca-cash_mergers, 2024-12-19) | alpaca-massnahmen:93b1bf9f-c829-41ba-8cc1-6c7faa353497 | zwangs-delisting (edgar-8K-3.01, 2023-10-13) | 0001104659-23-108988 (8-K 2023-10-13) | Bellerophon Therapeutics, Inc. | 0 / passt |
| BOWN | 2026-07-14 -> 2025-07-15 | spac-ende (edgar-mantel+abmeldung, 2026-07-13) | 0001354457-26-000667 (25-NSE 2026-07-13) | zwangs-delisting (edgar-8K-3.01, 2025-07-18) | 0001641172-25-020251 (8-K 2025-07-18) | Bowen Acquisition Corp | +3 / kein Aussenanker |
| CALA | 2025-03-21 -> 2023-02-01 | freiwillig (edgar-formular25, 2025-06-23) | 0000876661-25-000457 (25-NSE 2025-06-23) | zwangs-delisting (edgar-8K-3.01, 2023-01-25) | 0001193125-23-014684 (8-K 2023-01-25) | WESCO INTERNATIONAL INC -> Calithera Biosciences, Inc. | -7 / passt |
| CAUD | 2025-08-14 -> 2024-08-15 | uebernahme (edgar-8K-2.01+prospekt, 2025-09-05) | 0001683168-25-006722 (8-K 2025-09-05) | zwangs-delisting (edgar-8K-3.01, 2024-08-15) | 0001213900-24-069733 (8-K 2024-08-15) | Collective Audience, Inc. | 0 / passt |
| CHRA | 2025-03-21 -> 2023-04-03 | freiwillig (edgar-formular25, 2025-07-01) | 0001417835-25-000128 (25-NSE 2025-07-01) | zwangs-delisting (edgar-8K-3.01, 2023-04-03) | 0001730346-23-000015 (8-K 2023-04-03) | Two Roads Shared Trust -> Charah Solutions, Inc. | 0 / passt |
| CMLS | 2026-03-04 -> 2025-05-01 | insolvenz (q-kuerzel+edgar-8K-1.03, 2026-03-05) | 0001104659-26-023855 (8-K 2026-03-05) | zwangs-delisting (edgar-8K-3.01, 2025-04-23) | 0001058623-25-000039 (8-K 2025-04-23) | CUMULUS MEDIA INC | -8 / passt |
| CNTM | 2026-04-17 -> 2025-05-07 | zwangs-delisting (edgar-8K-3.01, 2025-04-23) | 0001104659-25-038099 (8-K 2025-04-23) | uebernahme (edgar-8K-2.01+prospekt, 2024-11-21) | 0001104659-24-121588 (8-K/A 2024-11-21) | ConnectM Technology Solutions, Inc. | -167 / passt |
| CTHR | 2026-03-03 -> 2025-04-24 | insolvenz (q-kuerzel+edgar-8K-1.03, 2026-03-04) | 0001104659-26-023038 (8-K 2026-03-04) | zwangs-delisting (edgar-8K-3.01, 2025-04-22) | 0001104659-25-037514 (8-K 2025-04-22) | CHARLES & COLVARD LTD | -2 / passt |
| CWBR | 2025-03-21 -> 2023-11-28 | uebernahme (alpaca-cash_mergers, 2025-01-06) | alpaca-massnahmen:48de0a42-f8e6-476d-93e3-ae6cbcf5f203 | zwangs-delisting (edgar-8K-3.01, 2023-11-27) | 0001213900-23-090274 (8-K 2023-11-27) | CohBar, Inc. | -1 / passt |
| DMYY | 2026-03-19 -> 2025-09-29 | umbenennung-ticker (alpaca-name_changes, 2026-03-20) | alpaca-massnahmen:cb87f8ce-ccd2-4ba3-8f3d-c43a15ffe95a | zwangs-delisting (edgar-8K-3.01, 2025-09-29) | 0001829126-25-007696 (8-K 2025-09-29) | dMY Squared Technology Group, Inc. | 0 / passt |
| DYNT | 2025-07-07 -> 2024-07-08 | insolvenz (edgar-8K-1.03, 2026-01-12) | 0001062993-26-000178 (8-K 2026-01-12) | zwangs-delisting (edgar-8K-3.01, 2024-06-28) | 0001062993-24-013111 (8-K 2024-06-28) | DYNATRONICS CORP | -10 / passt |
| ECDA | 2026-03-19 -> 2026-01-15 | uebernahme (alpaca-cash_mergers, 2026-04-13) | alpaca-massnahmen:bdc2683a-3d33-4e2a-81c1-8e22711bfbe2 | zwangs-delisting (edgar-8K-3.01, 2026-01-15) | 0001437749-26-001367 (8-K 2026-01-15) | ECD Automotive Design, Inc. | 0 / passt |
| EDTX | 2023-08-31 -> 2023-07-14 | uebernahme (alpaca-cash_mergers, 2023-09-01) | alpaca-massnahmen:fbfe8ec9-b30f-4af5-b438-132638212685 | spac-ende (edgar-mantel+abmeldung, 2023-09-05) | 0001213900-23-073913 (15-12G 2023-09-05) | EdtechX Holdings Acquisition Corp. II | +53 / kein Aussenanker |
| ELIQ | 2024-05-03 -> 2024-01-16 | insolvenz (q-kuerzel, 2024-05-07) | alpaca-massnahmen:095c8c01-0d8b-4ae3-b399-531dd268c6ae | uebernahme (edgar-8K-2.01+prospekt, 2023-08-04) | 0001193125-23-203886 (8-K 2023-08-04) | Electriq Power Holdings, Inc. | -165 / passt |
| EXPR | 2024-04-19 -> 2024-03-06 | insolvenz (q-kuerzel, 2024-04-23) | alpaca-massnahmen:bded3131-68c5-414c-8df5-204ce8c6b83f | freiwillig (edgar-formular25, 2024-05-24) | 0001143362-24-000165 (25-NSE 2024-05-24) | - -> JPMORGAN CHASE & CO | +79 / WIDERSPRICHT (Express, Inc.) |
| FLDD | 2025-02-14 -> 2024-12-23 | umbenennung-ticker (alpaca-name_changes, 2025-02-19) | alpaca-massnahmen:cb0c7aa3-58c5-4ef4-ab94-e7cda95cbbf4 | zwangs-delisting (edgar-8K-3.01, 2024-12-18) | 0001213900-24-109953 (8-K 2024-12-18) | Fold Holdings, Inc. | -5 / kein Aussenanker |
| FPAY | 2025-12-19 -> 2025-10-22 | insolvenz (q-kuerzel, 2025-12-23) | alpaca-massnahmen:f157edf1-a4c0-49df-918b-50ee45ddea24 | zwangs-delisting (edgar-8K-3.01, 2025-09-24) | 0001213900-25-091201 (8-K 2025-09-24) | FlexShopper, Inc. | -28 / passt |
| FRTX | 2025-03-21 -> 2023-12-18 | uebernahme (alpaca-stock_and_cash_mergers, 2025-03-03) | alpaca-massnahmen:44bd9e64-dcbc-4dd9-b22f-b686afe4f369 | zwangs-delisting (edgar-8K-3.01, 2023-12-18) | 0001628280-23-041723 (8-K 2023-12-18) | Fresh Tracks Therapeutics, Inc. | 0 / passt |
| FRZA | 2024-12-10 -> 2024-10-09 | fusion-aktientausch (alpaca-stock_mergers, 2024-12-12) | alpaca-massnahmen:5aa9a9d9-610c-4778-8a51-b50d5d082532 | zwangs-delisting (edgar-8K-3.01, 2024-10-04) | 0001731122-24-001545 (8-K 2024-10-04) | Forza X1, Inc. | -5 / passt |
| FXLV | 2025-03-21 -> 2023-08-24 | freiwillig (edgar-formular15, 2023-11-07) | 0001193125-23-272551 (15-12G 2023-11-07) | zwangs-delisting (edgar-8K-3.01, 2023-08-14) | 0001788717-23-000050 (8-K 2023-08-14) | F45 Training Holdings Inc. | -10 / passt |
| GLST | 2025-05-13 -> 2025-03-07 | umbenennung-ticker (alpaca-name_changes, 2025-05-14) | alpaca-massnahmen:5aec2367-2a54-4c6c-81ca-7657dcc285f4 | zwangs-delisting (edgar-8K-3.01, 2025-03-11) | 0001829126-25-001706 (8-K 2025-03-11) | Global Star Acquisition Inc. | +4 / passt |
| HCVI | 2025-06-05 -> 2025-04-03 | umbenennung-ticker (alpaca-name_changes, 2025-06-06) | alpaca-massnahmen:217dfcf8-9228-4f31-83df-2ac0e1abd895 | zwangs-delisting (edgar-8K-3.01, 2025-04-03) | 0001213900-25-028619 (8-K 2025-04-03) | Red Rock Acquisition Corp. | 0 / passt |
| HGAS | 2025-06-23 -> 2024-06-24 | zwangs-delisting (edgar-8K-3.01, 2024-06-24) | 0001213900-24-055277 (8-K 2024-06-24) | uebernahme (edgar-8K-2.01+prospekt, 2023-12-28) | 0001213900-23-099273 (8-K 2023-12-28) | Global Gas Corp | -179 / passt |
| HOFV | 2026-06-25 -> 2025-06-26 | uebernahme (edgar-8K-2.01+prospekt, 2025-12-31) | 0001140361-25-047082 (8-K 2025-12-31) | zwangs-delisting (edgar-8K-3.01, 2025-06-25) | 0001213900-25-057786 (8-K 2025-06-25) | Hall of Fame Resort & Entertainment Co | -1 / kein Aussenanker |
| HSTO | 2024-11-13 -> 2023-10-04 | insolvenz (q-kuerzel, 2024-11-15) | alpaca-massnahmen:d8d3b77a-d0fd-42c7-a914-3d27634df161 | zwangs-delisting (edgar-8K-3.01, 2023-09-26) | 0000950170-23-049922 (8-K 2023-09-26) | Histogen Inc. | -8 / passt |
| IDEX | 2024-12-03 -> 2024-07-10 | insolvenz (q-kuerzel, 2024-12-05) | alpaca-massnahmen:5f2b8f79-9495-4b09-9fd9-f12ab4b67788 | freiwillig (edgar-formular25, 2024-08-13) | 0001354457-24-000562 (25-NSE 2024-08-13) | - -> iSHARES TRUST | +34 / WIDERSPRICHT (Ideanomics, Inc. Common Stock) |
| IFMK | 2025-03-21 -> 2021-11-22 | zwangs-delisting (edgar-8K-3.01, 2025-02-27) | 0001213900-25-017999 (8-K 2025-02-27) | insolvenz (edgar-8K-1.03, 2022-09-06) | 0001213900-22-054253 (8-K 2022-09-06) | Quanome Technologies, Inc. -> iFresh Inc | +288 / passt |
| KRBP | 2025-03-21 -> 2023-09-13 | insolvenz (q-kuerzel+edgar-8K-1.03, 2025-03-21) | 0001437749-25-008671 (8-K 2025-03-21) | zwangs-delisting (edgar-8K-3.01, 2023-09-13) | 0001558370-23-015711 (8-K 2023-09-13) | Kiromic Biopharma, Inc. | 0 / passt |
| LFLY | 2025-09-12 -> 2025-01-16 | umbenennung-ticker (alpaca-name_changes, 2025-09-15) | alpaca-massnahmen:fe3aee2c-475b-429b-b682-fd5a9684a5ac | zwangs-delisting (edgar-8K-3.01, 2025-01-16) | 0000950170-25-006032 (8-K 2025-01-16) | Leafly Holdings, Inc. /DE | 0 / passt |
| LPTV | 2025-08-07 -> 2024-08-08 | insolvenz (edgar-8K-1.03, 2025-10-20) | 0001493152-25-018533 (8-K 2025-10-20) | zwangs-delisting (edgar-8K-3.01, 2024-08-09) | 0001493152-24-030877 (8-K 2024-08-09) | Loop Media, Inc. | +1 / passt |
| MEOA | 2023-07-12 -> 2023-05-24 | uebernahme (alpaca-cash_mergers, 2023-08-09) | alpaca-massnahmen:7e2ffb2b-0576-46f5-b5cf-63a347ccecbe | zwangs-delisting (edgar-8K-3.01, 2023-01-27) | 0001213900-23-005700 (8-K 2023-01-27) | Minority Equality Opportunities Acquisition Inc. | -117 / kein Aussenanker |
| MVLA | 2025-03-31 -> 2024-04-01 | zwangs-delisting (edgar-8K-3.01, 2024-04-09) | 0001628280-24-015496 (8-K 2024-04-09) | uebernahme (edgar-8K-2.01+prospekt, 2023-03-31) | 0001193125-23-088291 (8-K/A 2023-03-31) | Movella Holdings Inc. | -367 / passt |
| NAVB | 2025-03-21 -> 2023-10-05 | freiwillig (edgar-formular25, 2024-01-16) | 0001143313-24-000012 (25-NSE 2024-01-16) | zwangs-delisting (edgar-8K-3.01, 2023-06-05) | 0001437749-23-016520 (8-K 2023-06-05) | NAVIDEA BIOPHARMACEUTICALS, INC. | -122 / passt |
| NOVV | 2024-11-19 -> 2024-09-13 | umbenennung-ticker (alpaca-name_changes, 2024-11-21) | alpaca-massnahmen:a280f885-3756-4bdc-9af9-1c296f4c765e | spac-ende (edgar-mantel+abmeldung, 2024-11-19) | 0001354457-24-000879 (25-NSE 2024-11-19) | Nova Vision Acquisition Corp | +67 / kein Aussenanker |
| NVAC | 2025-07-11 -> 2024-11-14 | umbenennung-ticker (alpaca-name_changes, 2025-07-14) | alpaca-massnahmen:cd9179a0-9d85-4a76-926e-7715514f29f0 | zwangs-delisting (edgar-8K-3.01, 2024-10-21) | 0001213900-24-089060 (8-K 2024-10-21) | Profusa, Inc. | -24 / passt |
| OCFT | 2025-11-19 -> 2025-10-29 | uebernahme (alpaca-cash_mergers, 2025-12-08) | alpaca-massnahmen:266d995b-4f5c-4b0b-9a96-73675c300dbc | freiwillig (edgar-formular25, 2025-11-21) | 0000876661-25-000905 (25-NSE 2025-11-21) | ONECONNECT FINANCIAL TECHNOLOGY CO., LTD. | +23 / passt |
| OPT | 2025-11-18 -> 2025-03-17 | umbenennung-ticker (alpaca-name_changes, 2025-11-20) | alpaca-massnahmen:4940bb2d-b015-4b1f-b83a-ac32f9b4e0be | freiwillig (edgar-formular25, 2025-04-10) | 0001417835-25-000073 (25-NSE 2025-04-10) | - -> Innovator ETFs Trust | +24 / kein Aussenanker |
| PNST | 2025-09-08 -> 2025-03-05 | insolvenz (q-kuerzel, 2025-09-10) | alpaca-massnahmen:6060bfc4-550b-4f63-86ec-abc86072c554 | uebernahme (edgar-8K-2.01+prospekt, 2024-01-05) | 0001104659-24-001803 (8-K 2024-01-05) | Pinstripes Holdings, Inc. | -425 / passt |
| QIWI | 2024-07-16 -> 2022-02-28 | freiwillig (edgar-formular25, 2024-09-06) | 0001354457-24-000655 (25-NSE 2024-09-06) | zwangs-delisting (edgar-8K-3.01, 2021-06-03) | 0001213900-21-030802 (8-K 2021-06-03) | QIWI -> Kismet Acquisition One Corp | -270 / kein Aussenanker |
| QVCGB | 2026-04-17 -> 2025-05-27 | insolvenz (q-kuerzel+edgar-8K-1.03, 2026-04-17) | 0001104659-26-044521 (8-K 2026-04-17) | zwangs-delisting (edgar-8K-3.01, 2025-05-16) | 0001104659-25-049822 (8-K 2025-05-16) | Old QVC Group, Inc. | -11 / passt |
| RACY | 2024-04-30 -> 2023-01-11 | spac-ende (edgar-mantel+abmeldung, 2024-06-03) | 0001354457-24-000380 (25-NSE 2024-06-03) | freiwillig (edgar-formular25, 2023-09-14) | 0000876661-23-000722 (25-NSE 2023-09-14) | Relativity Acquisition Corp -> GOLDMAN SACHS GROUP INC | +246 / kein Aussenanker |
| SBNY | 2025-03-21 -> 2023-03-13 | insolvenz (edgar-8K-1.03, 2024-01-17) | 0001193125-24-008952 (8-K 2024-01-17) | freiwillig (edgar-formular25, 2023-06-16) | 0001143362-23-000254 (25-NSE 2023-06-16) | Core Scientific, Inc./tx -> UBS AG | +95 / WIDERSPRICHT (Signature Bank) |
| SCPS | 2025-03-21 -> 2022-12-16 | freiwillig (edgar-formular25, 2025-12-29) | 0000876661-25-001018 (25-NSE 2025-12-29) | zwangs-delisting (edgar-8K-3.01, 2022-12-16) | 0001104659-22-127517 (8-K 2022-12-16) | ENERGY CO OF PARANA -> Scopus BioPharma Inc. | 0 / passt |
| SEAC | 2025-03-21 -> 2023-08-25 | spac-ende (edgar-mantel+abmeldung, 2024-05-14) | 0001354457-24-000333 (25-NSE 2024-05-14) | zwangs-delisting (edgar-8K-3.01, 2023-08-08) | 0001193125-23-205609 (8-K 2023-08-08) | Screaming Eagle Acquisition Corp. -> SEACHANGE INTERNATIONAL INC | -17 / passt |
| SING | 2025-09-09 -> 2024-09-10 | uebernahme (edgar-8K-2.01+prospekt, 2025-09-12) | 0001493152-25-013123 (8-K 2025-09-12) | zwangs-delisting (edgar-8K-3.01, 2024-08-30) | 0001104659-24-095276 (8-K 2024-08-30) | Bio Green Med Solution, Inc. | -11 / WIDERSPRICHT (SinglePoint Inc.) |
| SIOX | 2025-03-21 -> 2023-03-22 | uebernahme (edgar-8K-2.01+prospekt, 2024-02-08) | 0001213900-24-011711 (8-K 2024-02-08) | zwangs-delisting (edgar-8K-3.01, 2023-03-15) | 0001636050-23-000011 (8-K 2023-03-15) | Solidion Technology Inc. -> Sio Gene Therapies Inc. | -7 / passt |
| SPEC | 2025-08-05 -> 2024-08-06 | zwangs-delisting (edgar-8K-3.01, 2024-08-06) | 0001213900-24-065402 (8-K 2024-08-06) | uebernahme (edgar-8K-2.01+prospekt, 2023-10-27) | 0001013762-23-007283 (8-K 2023-10-27) | Spectaire Holdings Inc. | -284 / passt |
| SPGC | 2026-01-05 -> 2025-03-14 | zwangs-delisting (edgar-8K-3.01, 2026-04-09) | 0001493152-26-015826 (8-K 2026-04-09) | umbenennung-ticker (alpaca-name_changes, 2025-03-17) | alpaca-massnahmen:f91ff62c-4395-4d0c-a845-8f10a93b279b | Newton Golf Company, Inc. | +3 / passt |
| TCGL | 2026-06-12 -> 2026-01-30 | uebernahme (edgar-8K-2.01+prospekt, 2024-12-12) | 0001214659-24-020448 (8-K 2024-12-12) | zwangs-delisting (edgar-8K-3.01, 2025-12-18) | 0001214659-25-018223 (8-K 2025-12-18) | VerifyMe, Inc. | -43 / kein Aussenanker |
| TCON | 2024-12-03 -> 2024-06-27 | umbenennung-ticker (alpaca-name_changes, 2024-12-04) | alpaca-massnahmen:62ec3ba8-5576-4675-a404-66b211a08618 | zwangs-delisting (edgar-8K-3.01, 2024-06-12) | 0000950170-24-072265 (8-K 2024-06-12) | Tracon Pharmaceuticals, Inc. | -15 / passt |
| TIO | 2024-02-28 -> 2023-11-13 | umbenennung-ticker (alpaca-name_changes, 2024-03-01) | alpaca-massnahmen:123173e4-786e-47cd-b923-1f36ea23dfd5 | uebernahme (edgar-8K-2.01+prospekt, 2023-02-15) | 0001213900-23-012144 (8-K 2023-02-15) | - -> Tingo Group, Inc. | -271 / kein Aussenanker |
| TMPO | 2023-12-12 -> 2023-11-01 | insolvenz (q-kuerzel, 2023-12-14) | alpaca-massnahmen:f950797a-d2be-49ae-aee8-61aba862c1c2 | zwangs-delisting (edgar-8K-3.01, 2023-08-23) | 0001104659-23-094401 (8-K 2023-08-23) | Tempo Automation Holdings, Inc. | -70 / passt |
| UNAM | 2025-03-21 -> 2023-06-14 | zwangs-delisting (edgar-8K-3.01, 2025-05-30) | 0001641172-25-013078 (8-K 2025-05-30) | insolvenz (edgar-8K-1.03, 2023-06-12) | 0001654954-23-007910 (8-K 2023-06-12) | Iveda Solutions, Inc. -> UNICO AMERICAN CORP | -2 / passt |
| VAPO | 2024-10-17 -> 2023-12-14 | uebernahme (alpaca-cash_mergers, 2024-09-20) | alpaca-massnahmen:ea35d0e2-9716-40fe-b99a-25a13c9f1f3f | zwangs-delisting (edgar-8K-3.01, 2023-12-15) | 0000950170-23-070508 (8-K 2023-12-15) | VAPOTHERM INC | +1 / passt |
| VERO | 2026-04-08 -> 2026-02-06 | uebernahme (alpaca-cash_mergers, 2026-04-15) | alpaca-massnahmen:22b674ae-2789-4968-8976-24a2ddb26503 | unbekannt (massnahme-passt-nicht, -) | - | - | - / ohne Firma |
| VIVE | 2025-03-21 -> 2023-01-18 | freiwillig (edgar-formular15, 2023-11-07) | 0001193125-23-272551 (15-12G 2023-11-07) | zwangs-delisting (edgar-8K-3.01, 2023-01-18) | 0001437749-23-001184 (8-K 2023-01-18) | F45 Training Holdings Inc. -> VIVEVE MEDICAL, INC. | 0 / passt |
| VSTA | 2026-07-27 -> 2026-01-28 | uebernahme (alpaca-cash_mergers, 2026-08-03) | alpaca-massnahmen:4b2a77da-30b0-4902-bbcf-fe27bfc141e4 | freiwillig (edgar-formular25, 2026-01-20) | 0000950103-26-000644 (25 2026-01-20) | Vasta Platform Ltd | -8 / passt |
| VYNT | 2025-03-21 -> 2023-05-12 | uebernahme (edgar-8K-2.01+prospekt, 2024-03-01) | 0001104659-24-029661 (8-K 2024-03-01) | zwangs-delisting (edgar-8K-3.01, 2023-04-24) | 0001493152-23-013369 (8-K 2023-04-24) | HEALTHPEAK PROPERTIES, INC. -> Vyant Bio, Inc. | -18 / passt |
| YGF | 2024-03-22 -> 2024-02-08 | umbenennung-ticker (alpaca-name_changes, 2024-03-26) | alpaca-massnahmen:0310c7ad-0a45-4e5d-a9d7-3efeec3edd9a | unbekannt (massnahme-passt-nicht, -) | - | - | - / kein Aussenanker |
| YNDX | 2024-08-19 -> 2022-02-28 | umbenennung-ticker (alpaca-name_changes, 2024-08-21) | alpaca-massnahmen:5487d127-ede6-4644-a537-c8e1e18d2a4d | unbekannt (massnahme-passt-nicht, -) | - | - | - / kein Aussenanker |
| ZPTA | 2025-10-24 -> 2024-10-25 | zwangs-delisting (edgar-8K-3.01, 2024-10-18) | 0000950170-24-115639 (8-K 2024-10-18) | uebernahme (edgar-8K-2.01+prospekt, 2024-04-03) | 0001193125-24-085161 (8-K 2024-04-03) | Zapata Quantum, Inc. | -205 / passt |

### T2 - "unbekannt" bekommt einen Grund (alle 16)

| Reihe | Anker alt -> neu | alt: Grund (Beleg, Datum) | alter Beleg | neu: Grund (Beleg, Datum) | neuer Beleg | Firma | neuer Beleg: Tage zum Anker / Firma zu Polygon |
|---|---|---|---|---|---|---|---|
| AATC | 2025-03-21 -> 2022-12-29 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2022-12-21) | 0000897101-22-001055 (8-K 2022-12-21) | - -> AUTOSCOPE TECHNOLOGIES CORP | -8 / passt |
| ALJJ | 2025-03-21 -> 2022-09-09 | unbekannt (massnahme-passt-nicht, -) | - | uebernahme (edgar-8K-2.01+prospekt, 2022-04-14) | 0001564590-22-014465 (8-K 2022-04-14) | - -> ALJ REGIONAL HOLDINGS INC | -148 / passt |
| AXAC | 2025-03-21 -> 2023-05-17 | unbekannt (massnahme-passt-nicht, -) | - | spac-ende (edgar-mantel+abmeldung, 2023-05-22) | 0000876661-23-000423 (25-NSE 2023-05-22) | - -> AXIOS Sustainable Growth Acquisition Corp | +5 / passt |
| AXAS | 2025-03-21 -> 2021-08-03 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2021-07-30) | 0001437749-21-018005 (8-K 2021-07-30) | - -> ABRAXAS PETROLEUM CORP | -4 / WIDERSPRICHT (Abraxas Petroleum Corporation) |
| BKSC | 2025-03-21 -> 2023-09-14 | unbekannt (edgar-ohne-signal, -) | - | zwangs-delisting (edgar-8K-3.01, 2023-08-24) | 0000950170-23-044275 (8-K 2023-08-24) | BANK OF SOUTH CAROLINA CORP | -21 / passt |
| CMCSV | 2026-01-02 -> 2025-12-23 | unbekannt (nichts, -) | - | freiwillig (edgar-formular25, 2026-09-14) | 0001354457-26-000874 (25-NSE 2026-09-14) | - -> COMCAST CORP | +265 / passt |
| CXDC | 2025-03-21 -> 2021-10-28 | unbekannt (nichts, -) | - | zwangs-delisting (edgar-8K-3.01, 2021-10-28) | 0001493152-21-026630 (8-K 2021-10-28) | - -> China XD Plastics Co Ltd | 0 / passt |
| LMPX | 2025-03-21 -> 2022-08-24 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2022-08-12) | 0001213900-22-047389 (8-K 2022-08-12) | - -> LMP Automotive Holdings, Inc. | -12 / passt |
| MARK | 2025-03-21 -> 2024-02-13 | unbekannt (nichts, -) | - | freiwillig (edgar-formular25, 2024-05-17) | 0000876661-24-000363 (25-NSE 2024-05-17) | - -> GOLDMAN SACHS GROUP INC | +94 / WIDERSPRICHT (Remark Holdings, Inc.) |
| MTCR | 2025-03-21 -> 2023-02-08 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2023-02-01) | 0001193125-23-021568 (8-K 2023-02-01) | - -> Metacrine, Inc. | -7 / passt |
| OFED | 2025-03-21 -> 2023-07-31 | unbekannt (nichts, -) | - | zwangs-delisting (edgar-8K-3.01, 2023-07-20) | 0001387131-23-008514 (8-K 2023-07-20) | - -> Oconee Federal Financial Corp. | -11 / passt |
| ONCR | 2025-03-21 -> 2023-06-20 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2023-06-09) | 0000950170-23-027274 (8-K 2023-06-09) | - -> Oncorus, Inc. | -11 / passt |
| OTIC | 2025-03-21 -> 2022-12-22 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2022-12-22) | 0001193125-22-310711 (8-K 2022-12-22) | - -> OTONOMY, INC. | 0 / passt |
| RBCN | 2025-03-21 -> 2022-12-29 | unbekannt (nichts, -) | - | uebernahme (edgar-8K-2.01+prospekt, 2022-09-20) | 0001213900-22-057430 (8-K/A 2022-09-20) | - -> Rubicon Technology, Inc. | -100 / passt |
| SBIG | 2025-03-21 -> 2023-09-01 | unbekannt (edgar-ohne-signal, -) | - | zwangs-delisting (edgar-8K-3.01, 2023-09-05) | 0001628280-23-031294 (8-K 2023-09-05) | SpringBig Holdings, Inc. | +4 / passt |
| STAB | 2025-03-21 -> 2023-01-11 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2023-01-20) | 0001437749-23-001440 (8-K 2023-01-20) | - -> Statera Biopharma, Inc. | +9 / passt |

### T2 - die 30 Zeilen mit der groessten Ankerverschiebung

| Reihe | Anker alt -> neu | alt: Grund (Beleg, Datum) | alter Beleg | neu: Grund (Beleg, Datum) | neuer Beleg | Firma | neuer Beleg: Tage zum Anker / Firma zu Polygon |
|---|---|---|---|---|---|---|---|
| AXAS | 2025-03-21 -> 2021-08-03 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2021-07-30) | 0001437749-21-018005 (8-K 2021-07-30) | - -> ABRAXAS PETROLEUM CORP | -4 / WIDERSPRICHT (Abraxas Petroleum Corporation) |
| CXDC | 2025-03-21 -> 2021-10-28 | unbekannt (nichts, -) | - | zwangs-delisting (edgar-8K-3.01, 2021-10-28) | 0001493152-21-026630 (8-K 2021-10-28) | - -> China XD Plastics Co Ltd | 0 / passt |
| IFMK | 2025-03-21 -> 2021-11-22 | zwangs-delisting (edgar-8K-3.01, 2025-02-27) | 0001213900-25-017999 (8-K 2025-02-27) | insolvenz (edgar-8K-1.03, 2022-09-06) | 0001213900-22-054253 (8-K 2022-09-06) | Quanome Technologies, Inc. -> iFresh Inc | +288 / passt |
| ADXS | 2025-03-21 -> 2021-12-22 | freiwillig (edgar-formular15, 2024-05-09) | 0000929638-24-001751 (15-12G 2024-05-09) | zwangs-delisting (edgar-8K-3.01, 2021-12-22) | 0001493152-21-032280 (8-K 2021-12-22) | Ayala Pharmaceuticals, Inc. | 0 / passt |
| KLDO | 2025-03-21 -> 2022-04-14 | zwangs-delisting (edgar-8K-3.01, 2024-12-26) | 0001558370-24-016472 (8-K 2024-12-26) | zwangs-delisting (edgar-8K-3.01, 2022-04-08) | 0001193125-22-099802 (8-K 2022-04-08) | CRESCENT BIOPHARMA, INC. -> Kaleido Biosciences, Inc. | -6 / passt |
| RENO | 2025-03-21 -> 2022-06-16 | zwangs-delisting (edgar-8K-3.01, 2025-06-13) | 0001641172-25-015095 (8-K 2025-06-13) | zwangs-delisting (edgar-8K-3.01, 2022-11-16) | 0000004457-22-000110 (8-K 2022-11-16) | Dragonfly Energy Holdings Corp. -> U-Haul Holding Co /NV/ | +153 / WIDERSPRICHT (Renovare Environmental, Inc. Common Stock) |
| EVFM | 2025-03-21 -> 2022-08-10 | zwangs-delisting (edgar-8K-3.01, 2025-01-10) | 0001493152-25-001682 (8-K 2025-01-10) | zwangs-delisting (edgar-8K-3.01, 2022-08-10) | 0001618835-22-000158 (8-K 2022-08-10) | Evofem Biosciences, Inc. | 0 / passt |
| LMPX | 2025-03-21 -> 2022-08-24 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2022-08-12) | 0001213900-22-047389 (8-K 2022-08-12) | - -> LMP Automotive Holdings, Inc. | -12 / passt |
| ALJJ | 2025-03-21 -> 2022-09-09 | unbekannt (massnahme-passt-nicht, -) | - | uebernahme (edgar-8K-2.01+prospekt, 2022-04-14) | 0001564590-22-014465 (8-K 2022-04-14) | - -> ALJ REGIONAL HOLDINGS INC | -148 / passt |
| YNDX | 2024-08-19 -> 2022-02-28 | umbenennung-ticker (alpaca-name_changes, 2024-08-21) | alpaca-massnahmen:5487d127-ede6-4644-a537-c8e1e18d2a4d | unbekannt (massnahme-passt-nicht, -) | - | - | - / kein Aussenanker |
| QIWI | 2024-07-16 -> 2022-02-28 | freiwillig (edgar-formular25, 2024-09-06) | 0001354457-24-000655 (25-NSE 2024-09-06) | zwangs-delisting (edgar-8K-3.01, 2021-06-03) | 0001213900-21-030802 (8-K 2021-06-03) | QIWI -> Kismet Acquisition One Corp | -270 / kein Aussenanker |
| SCPS | 2025-03-21 -> 2022-12-16 | freiwillig (edgar-formular25, 2025-12-29) | 0000876661-25-001018 (25-NSE 2025-12-29) | zwangs-delisting (edgar-8K-3.01, 2022-12-16) | 0001104659-22-127517 (8-K 2022-12-16) | ENERGY CO OF PARANA -> Scopus BioPharma Inc. | 0 / passt |
| OTIC | 2025-03-21 -> 2022-12-22 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2022-12-22) | 0001193125-22-310711 (8-K 2022-12-22) | - -> OTONOMY, INC. | 0 / passt |
| AATC | 2025-03-21 -> 2022-12-29 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2022-12-21) | 0000897101-22-001055 (8-K 2022-12-21) | - -> AUTOSCOPE TECHNOLOGIES CORP | -8 / passt |
| RBCN | 2025-03-21 -> 2022-12-29 | unbekannt (nichts, -) | - | uebernahme (edgar-8K-2.01+prospekt, 2022-09-20) | 0001213900-22-057430 (8-K/A 2022-09-20) | - -> Rubicon Technology, Inc. | -100 / passt |
| PKBO | 2025-03-21 -> 2023-01-09 | uebernahme (edgar-8K-2.01+prospekt, 2024-11-14) | 0000950170-24-127099 (8-K 2024-11-14) | uebernahme (edgar-8K-2.01+prospekt, 2022-11-07) | 0001193125-22-279204 (8-K 2022-11-07) | Peak Bio, Inc. | -63 / passt |
| STAB | 2025-03-21 -> 2023-01-11 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2023-01-20) | 0001437749-23-001440 (8-K 2023-01-20) | - -> Statera Biopharma, Inc. | +9 / passt |
| SMIT | 2025-03-21 -> 2023-01-13 | zwangs-delisting (edgar-8K-3.01, 2024-12-26) | 0001558370-24-016472 (8-K 2024-12-26) | zwangs-delisting (edgar-8K-3.01, 2022-10-20) | 0001193805-22-001438 (8-K 2022-10-20) | CRESCENT BIOPHARMA, INC. -> SCHMITT INDUSTRIES INC | -85 / passt |
| VIVE | 2025-03-21 -> 2023-01-18 | freiwillig (edgar-formular15, 2023-11-07) | 0001193125-23-272551 (15-12G 2023-11-07) | zwangs-delisting (edgar-8K-3.01, 2023-01-18) | 0001437749-23-001184 (8-K 2023-01-18) | F45 Training Holdings Inc. -> VIVEVE MEDICAL, INC. | 0 / passt |
| CALA | 2025-03-21 -> 2023-02-01 | freiwillig (edgar-formular25, 2025-06-23) | 0000876661-25-000457 (25-NSE 2025-06-23) | zwangs-delisting (edgar-8K-3.01, 2023-01-25) | 0001193125-23-014684 (8-K 2023-01-25) | WESCO INTERNATIONAL INC -> Calithera Biosciences, Inc. | -7 / passt |
| MTCR | 2025-03-21 -> 2023-02-08 | unbekannt (massnahme-passt-nicht, -) | - | zwangs-delisting (edgar-8K-3.01, 2023-02-01) | 0001193125-23-021568 (8-K 2023-02-01) | - -> Metacrine, Inc. | -7 / passt |
| SRAX | 2025-03-21 -> 2023-03-08 | zwangs-delisting (edgar-8K-3.01, 2024-11-27) | 0001493152-24-047994 (8-K 2024-11-27) | zwangs-delisting (edgar-8K-3.01, 2023-03-08) | 0001493152-23-007017 (8-K 2023-03-08) | GT Biopharma, Inc. -> SRAX, Inc. | 0 / passt |
| SBNY | 2025-03-21 -> 2023-03-13 | insolvenz (edgar-8K-1.03, 2024-01-17) | 0001193125-24-008952 (8-K 2024-01-17) | freiwillig (edgar-formular25, 2023-06-16) | 0001143362-23-000254 (25-NSE 2023-06-16) | Core Scientific, Inc./tx -> UBS AG | +95 / WIDERSPRICHT (Signature Bank) |
| SIOX | 2025-03-21 -> 2023-03-22 | uebernahme (edgar-8K-2.01+prospekt, 2024-02-08) | 0001213900-24-011711 (8-K 2024-02-08) | zwangs-delisting (edgar-8K-3.01, 2023-03-15) | 0001636050-23-000011 (8-K 2023-03-15) | Solidion Technology Inc. -> Sio Gene Therapies Inc. | -7 / passt |
| ASPU | 2025-03-21 -> 2023-03-30 | zwangs-delisting (edgar-8K-3.01, 2025-05-23) | 0001213900-25-047391 (8-K 2025-05-23) | zwangs-delisting (edgar-8K-3.01, 2022-10-03) | 0001079973-22-001258 (8-K 2022-10-03) | Change Agents Corporation. -> ASPEN GROUP, INC. | -178 / passt |
| CHRA | 2025-03-21 -> 2023-04-03 | freiwillig (edgar-formular25, 2025-07-01) | 0001417835-25-000128 (25-NSE 2025-07-01) | zwangs-delisting (edgar-8K-3.01, 2023-04-03) | 0001730346-23-000015 (8-K 2023-04-03) | Two Roads Shared Trust -> Charah Solutions, Inc. | 0 / passt |
| VYNT | 2025-03-21 -> 2023-05-12 | uebernahme (edgar-8K-2.01+prospekt, 2024-03-01) | 0001104659-24-029661 (8-K 2024-03-01) | zwangs-delisting (edgar-8K-3.01, 2023-04-24) | 0001493152-23-013369 (8-K 2023-04-24) | HEALTHPEAK PROPERTIES, INC. -> Vyant Bio, Inc. | -18 / passt |
| AXAC | 2025-03-21 -> 2023-05-17 | unbekannt (massnahme-passt-nicht, -) | - | spac-ende (edgar-mantel+abmeldung, 2023-05-22) | 0000876661-23-000423 (25-NSE 2023-05-22) | - -> AXIOS Sustainable Growth Acquisition Corp | +5 / passt |
| KSPN | 2025-03-21 -> 2023-06-09 | zwangs-delisting (edgar-8K-3.01, 2023-12-18) | 0001140361-23-058191 (8-K 2023-12-18) | zwangs-delisting (edgar-8K-3.01, 2023-06-12) | 0001140361-23-029225 (8-K 2023-06-12) | Kaspien Holdings Inc. | +3 / passt |
| UNAM | 2025-03-21 -> 2023-06-14 | zwangs-delisting (edgar-8K-3.01, 2025-05-30) | 0001641172-25-013078 (8-K 2025-05-30) | insolvenz (edgar-8K-1.03, 2023-06-12) | 0001654954-23-007910 (8-K 2023-06-12) | Iveda Solutions, Inc. -> UNICO AMERICAN CORP | -2 / passt |

### T2 - 20 zufaellig gezogene Zeilen mit geaendertem Anker (Saat `t2-anker`)

| Reihe | Anker alt -> neu | alt: Grund (Beleg, Datum) | alter Beleg | neu: Grund (Beleg, Datum) | neuer Beleg | Firma | neuer Beleg: Tage zum Anker / Firma zu Polygon |
|---|---|---|---|---|---|---|---|
| RENO | 2025-03-21 -> 2022-06-16 | zwangs-delisting (edgar-8K-3.01, 2025-06-13) | 0001641172-25-015095 (8-K 2025-06-13) | zwangs-delisting (edgar-8K-3.01, 2022-11-16) | 0000004457-22-000110 (8-K 2022-11-16) | Dragonfly Energy Holdings Corp. -> U-Haul Holding Co /NV/ | +153 / WIDERSPRICHT (Renovare Environmental, Inc. Common Stock) |
| SVVC | 2025-03-21 -> 2023-10-25 | zwangs-delisting (edgar-8K-3.01, 2023-10-27) | 0001398344-23-019845 (8-K 2023-10-27) | zwangs-delisting (edgar-8K-3.01, 2023-10-27) | 0001398344-23-019845 (8-K 2023-10-27) | Firsthand Technology Value Fund, Inc. | +2 / passt |
| SOFO | 2025-03-21 -> 2023-12-04 | insolvenz (edgar-8K-1.03, 2024-03-28) | 0001437749-24-009789 (8-K 2024-03-28) | insolvenz (edgar-8K-1.03, 2024-03-22) | 0001437749-24-008887 (8-K 2024-03-22) | SONIC FOUNDRY INC | +109 / passt |
| CTHR | 2026-03-03 -> 2025-04-24 | insolvenz (q-kuerzel+edgar-8K-1.03, 2026-03-04) | 0001104659-26-023038 (8-K 2026-03-04) | zwangs-delisting (edgar-8K-3.01, 2025-04-22) | 0001104659-25-037514 (8-K 2025-04-22) | CHARLES & COLVARD LTD | -2 / passt |
| PXMD | 2025-04-30 -> 2024-05-01 | zwangs-delisting (edgar-8K-3.01, 2024-06-14) | 0001104659-24-071809 (8-K 2024-06-14) | zwangs-delisting (edgar-8K-3.01, 2024-05-01) | 0001104659-24-055841 (8-K 2024-05-01) | Kuvatris Therapeutics, Inc. | 0 / passt |
| FPAY | 2025-12-19 -> 2025-10-22 | insolvenz (q-kuerzel, 2025-12-23) | alpaca-massnahmen:f157edf1-a4c0-49df-918b-50ee45ddea24 | zwangs-delisting (edgar-8K-3.01, 2025-09-24) | 0001213900-25-091201 (8-K 2025-09-24) | FlexShopper, Inc. | -28 / passt |
| NKGN | 2026-03-03 -> 2025-03-04 | zwangs-delisting (edgar-8K-3.01, 2025-01-08) | 0001213900-25-002147 (8-K 2025-01-08) | zwangs-delisting (edgar-8K-3.01, 2025-01-08) | 0001213900-25-002147 (8-K 2025-01-08) | NKGen Biotech, Inc. | -55 / passt |
| SYRA | 2026-04-16 -> 2025-04-17 | zwangs-delisting (edgar-8K-3.01, 2024-10-21) | 0001493152-24-041772 (8-K 2024-10-21) | zwangs-delisting (edgar-8K-3.01, 2024-10-21) | 0001493152-24-041772 (8-K 2024-10-21) | Syra Health Corp | -178 / passt |
| EDTX | 2023-08-31 -> 2023-07-14 | uebernahme (alpaca-cash_mergers, 2023-09-01) | alpaca-massnahmen:fbfe8ec9-b30f-4af5-b438-132638212685 | spac-ende (edgar-mantel+abmeldung, 2023-09-05) | 0001213900-23-073913 (15-12G 2023-09-05) | EdtechX Holdings Acquisition Corp. II | +53 / kein Aussenanker |
| SALM | 2025-03-21 -> 2024-01-18 | zwangs-delisting (edgar-8K-3.01, 2023-12-29) | 0001193125-23-305906 (8-K 2023-12-29) | zwangs-delisting (edgar-8K-3.01, 2023-12-29) | 0001193125-23-305906 (8-K 2023-12-29) | SALEM MEDIA GROUP, INC. /DE/ | -20 / passt |
| CNGL | 2024-07-05 -> 2024-06-27 | spac-ende (edgar-mantel+abmeldung, 2024-07-19) | 0001354457-24-000518 (25-NSE 2024-07-19) | spac-ende (edgar-mantel+abmeldung, 2024-07-19) | 0001354457-24-000518 (25-NSE 2024-07-19) | Canna-Global Acquisition Corp | +22 / passt |
| OTRK | 2025-08-29 -> 2025-08-15 | insolvenz (q-kuerzel, 2025-09-03) | alpaca-massnahmen:1597bee7-ff03-4bd1-a4af-d6a45ad805e6 | insolvenz (q-kuerzel, 2025-09-03) | alpaca-massnahmen:1597bee7-ff03-4bd1-a4af-d6a45ad805e6 | Ontrak, Inc. | +19 / passt |
| ATEK | 2025-12-08 -> 2024-12-09 | spac-ende (edgar-mantel+abmeldung, 2024-12-19) | 0000876661-24-001197 (25-NSE 2024-12-19) | uebernahme (edgar-8K-2.01+prospekt, 2023-12-14) | 0001213900-23-095519 (8-K 2023-12-14) | Athena Technology Acquisition Corp. II | -361 / passt |
| COMS | 2025-03-21 -> 2024-01-30 | zwangs-delisting (edgar-8K-3.01, 2024-02-02) | 0001213900-24-009624 (8-K 2024-02-02) | zwangs-delisting (edgar-8K-3.01, 2024-02-02) | 0001213900-24-009624 (8-K 2024-02-02) | COMSovereign Holding Corp. | +3 / passt |
| PRST | 2025-08-06 -> 2024-08-07 | zwangs-delisting (edgar-8K-3.01, 2024-08-07) | 0001213900-24-065927 (8-K 2024-08-07) | zwangs-delisting (edgar-8K-3.01, 2024-08-07) | 0001213900-24-065927 (8-K 2024-08-07) | Presto Automation Inc. | 0 / passt |
| KLDO | 2025-03-21 -> 2022-04-14 | zwangs-delisting (edgar-8K-3.01, 2024-12-26) | 0001558370-24-016472 (8-K 2024-12-26) | zwangs-delisting (edgar-8K-3.01, 2022-04-08) | 0001193125-22-099802 (8-K 2022-04-08) | CRESCENT BIOPHARMA, INC. -> Kaleido Biosciences, Inc. | -6 / passt |
| VIRX | 2025-08-18 -> 2025-02-03 | zwangs-delisting (edgar-8K-3.01, 2025-01-31) | 0000950170-25-011792 (8-K 2025-01-31) | zwangs-delisting (edgar-8K-3.01, 2025-01-31) | 0000950170-25-011792 (8-K 2025-01-31) | Viracta Therapeutics, Inc. | -3 / passt |
| ALPP | 2025-10-16 -> 2024-10-17 | zwangs-delisting (edgar-8K-3.01, 2024-10-17) | 0001628280-24-043049 (8-K 2024-10-17) | zwangs-delisting (edgar-8K-3.01, 2024-10-17) | 0001628280-24-043049 (8-K 2024-10-17) | ALPINE 4 HOLDINGS, INC. | 0 / passt |
| ELIQ | 2024-05-03 -> 2024-01-16 | insolvenz (q-kuerzel, 2024-05-07) | alpaca-massnahmen:095c8c01-0d8b-4ae3-b399-531dd268c6ae | uebernahme (edgar-8K-2.01+prospekt, 2023-08-04) | 0001193125-23-203886 (8-K 2023-08-04) | Electriq Power Holdings, Inc. | -165 / passt |
| ASPA | 2023-11-02 -> 2023-10-25 | umbenennung-ticker (alpaca-name_changes, 2023-11-15) | alpaca-massnahmen:288fa87a-6691-422e-addf-403f74178af0 | umbenennung-ticker (alpaca-name_changes, 2023-11-15) | alpaca-massnahmen:288fa87a-6691-422e-addf-403f74178af0 | Collective Audience, Inc. | +21 / passt |

### T2 - die neu hinzukommenden Reihen (alle 60 bei X = 0; `lebend ab X` nennt, ab welchem X die Reihe als lebend gilt und entfaellt)

| Reihe | letzter Minutentag | lebend ab X | Grund | Beleg | Datum | Quelle | Firma |
|---|---|---|---|---|---|---|---|
| AACB | 2026-08-19 | - | uebernahme | alpaca-cash_mergers | 2026-08-25 | alpaca-massnahmen:68077bc5-9c78-4334-9f2d-414f08f7f32c | Artius II Acquisition Inc. |
| AAC~2 | 2026-10-01 | 5 | uebernahme | edgar-8K-2.01+prospekt | 2025-09-30 | 0001193125-25-225299 (8-K 2025-09-30) | Kodiak AI, Inc. |
| ADTX | 2026-06-24 | - | zwangs-delisting | edgar-8K-3.01 | 2026-06-24 | 0001213900-26-071380 (8-K 2026-06-24) | Aditxt, Inc. |
| ALUR | 2026-03-06 | - | zwangs-delisting | edgar-8K-3.01 | 2026-03-02 | 0001193125-26-084412 (8-K 2026-03-02) | ALLURION TECHNOLOGIES, INC. |
| ANEB | 2026-02-27 | - | zwangs-delisting | edgar-8K-3.01 | 2026-02-06 | 0001493152-26-005463 (8-K 2026-02-06) | Anebulo Pharmaceuticals, Inc. |
| APGE | 2026-09-02 | - | uebernahme | alpaca-cash_mergers | 2026-09-03 | alpaca-massnahmen:8f4ccf91-693d-4581-9956-adc13537e1db | Apogee Therapeutics, Inc. |
| AREB | 2026-05-12 | - | zwangs-delisting | edgar-8K-3.01 | 2026-03-27 | 0001493152-26-013122 (8-K 2026-03-27) | AMERICAN REBEL HOLDINGS INC |
| ASNS | 2026-04-09 | - | zwangs-delisting | edgar-8K-3.01 | 2026-04-09 | 0001213900-26-041856 (8-K 2026-04-09) | ACTELIS NETWORKS INC |
| BINI | 2025-10-10 | - | zwangs-delisting | edgar-8K-3.01 | 2025-10-10 | 0001829126-25-008053 (8-K 2025-10-10) | BOLLINGER INNOVATIONS, INC. |
| BNBX | 2026-07-13 | - | zwangs-delisting | edgar-8K-3.01 | 2026-07-13 | 0001104659-26-082893 (8-K 2026-07-13) | BNB PLUS CORP. |
| BSLK | 2026-01-02 | - | zwangs-delisting | edgar-8K-3.01 | 2026-01-05 | 0001841125-26-000003 (8-K 2026-01-05) | Bolt Projects Holdings, Inc. |
| CARM | 2025-10-10 | - | zwangs-delisting | edgar-8K-3.01 | 2025-10-09 | 0001104659-25-098404 (8-K 2025-10-09) | Carisma Therapeutics Inc. |
| CERO | 2025-10-30 | - | zwangs-delisting | edgar-8K-3.01 | 2025-10-30 | 0001213900-25-103661 (8-K 2025-10-30) | CERO THERAPEUTICS HOLDINGS, INC. |
| CREG | 2026-07-20 | - | zwangs-delisting | edgar-8K-3.01 | 2026-07-20 | 0001213900-26-079598 (8-K 2026-07-20) | Smart Powerr Corp. |
| CRNX | 2026-08-31 | - | uebernahme | alpaca-cash_mergers | 2026-09-02 | alpaca-massnahmen:069b9a15-c0d0-44cc-ad28-dc4ba67e4c6f | Crinetics Pharmaceuticals, Inc. |
| CSAN | 2026-09-18 | 10 | freiwillig | edgar-formular25 | 2026-09-08 | 0000950103-26-013642 (25 2026-09-08) | Cosan S.A. |
| DBRG | 2026-09-29 | 5 | uebernahme | edgar-8K-2.01+prospekt | 2026-09-30 | 0001104659-26-112148 (8-K 2026-09-30) | DigitalBridge Group, Inc. |
| DGLY | 2026-01-07 | - | umbenennung-ticker | alpaca-name_changes | 2026-01-08 | alpaca-massnahmen:7847f10c-0550-4475-8a62-1d0b66593d5e | KUSTOM ENTERTAINMENT, INC. |
| DHAI | 2025-11-06 | - | zwangs-delisting | edgar-8K-3.01 | 2025-11-06 | 0001493152-25-020954 (8-K 2025-11-06) | DIH HOLDING US, INC. |
| ENFY | 2025-10-13 | - | zwangs-delisting | edgar-8K-3.01 | 2025-10-27 | 0001213900-25-102666 (8-K 2025-10-27) | Enlightify Inc. |
| GBTG | 2026-09-28 | 5 | uebernahme | edgar-8K-2.01+prospekt | 2026-09-29 | 0001140361-26-037931 (8-K 2026-09-29) | Global Business Travel Group, Inc. |
| GGRP | 2026-08-19 | - | umbenennung-ticker | alpaca-name_changes | 2026-08-20 | alpaca-massnahmen:0c7bbec0-f904-4419-98e0-27ccff213b50 | Brightline Interactive, Inc./NV |
| GLBZ | 2025-12-22 | - | freiwillig | edgar-formular25 | 2025-12-22 | 0001552781-25-000467 (25 2025-12-22) | GLEN BURNIE BANCORP |
| HLX | 2026-09-01 | - | umbenennung-ticker | alpaca-name_changes | 2026-09-02 | alpaca-massnahmen:1930f46d-dd21-4778-b349-1c184962285d | HORNBECK OFFSHORE SERVICES, INC. |
| ISRL | 2026-10-01 | 5 | zwangs-delisting | edgar-8K-3.01 | 2026-01-13 | 0001104659-26-003402 (8-K 2026-01-13) | Israel Acquisitions Corp |
| KAVL | 2025-12-22 | - | zwangs-delisting | edgar-8K-3.01 | 2025-11-17 | 0001731122-25-001551 (8-K 2025-11-17) | Kaival Brands Innovations Group, Inc. |
| LBRDA | 2026-08-19 | - | fusion-aktientausch | alpaca-stock_mergers | 2026-08-20 | alpaca-massnahmen:e652a818-b25c-45d2-9bbc-94e0627efd2a | Liberty Broadband Corp |
| LBRDK | 2026-08-19 | - | fusion-aktientausch | alpaca-stock_mergers | 2026-08-20 | alpaca-massnahmen:bad1a3b9-d57e-4e7e-a077-06913f1cbd90 | Liberty Broadband Corp |
| LEG | 2026-08-26 | - | fusion-aktientausch | alpaca-stock_mergers | 2026-08-27 | alpaca-massnahmen:75acef18-d313-4df3-b201-253236ff418e | LEGGETT & PLATT INC |
| LYRA | 2026-03-16 | - | zwangs-delisting | edgar-8K-3.01 | 2026-03-16 | 0001193125-26-108439 (8-K 2026-03-16) | Lyra Therapeutics, Inc. |
| MAPS | 2026-04-24 | - | freiwillig | edgar-formular25 | 2026-02-23 | 0000876661-26-000158 (25-NSE 2026-02-23) | Morgan Stanley Finance LLC |
| MATR | 2026-10-01 | 5 | unbekannt | massnahme-passt-nicht | - | - | - |
| MEHA | 2026-06-15 | - | zwangs-delisting | edgar-8K-3.01 | 2026-06-15 | 0001213900-26-068518 (8-K 2026-06-15) | Functional Brands Inc. |
| MSPR | 2025-12-19 | - | zwangs-delisting | edgar-8K-3.01 | 2025-12-22 | 0001193125-25-327465 (8-K 2025-12-22) | MSP Recovery, Inc. |
| NOTE | 2026-03-25 | - | unbekannt | massnahme-passt-nicht | - | - | - |
| NVVE | 2026-07-23 | - | zwangs-delisting | edgar-8K-3.01 | 2026-07-23 | 0001836875-26-000065 (8-K 2026-07-23) | Nuvve Holding Corp. |
| OMCC | 2025-12-31 | - | zwangs-delisting | edgar-8K-3.01 | 2025-12-11 | 0001437749-25-037549 (8-K 2025-12-11) | OLD MARKET CAPITAL Corp |
| PMNT | 2026-06-17 | - | zwangs-delisting | edgar-8K-3.01 | 2026-06-12 | 0001493152-26-028535 (8-K 2026-06-12) | Perfect Moment Ltd. |
| PRPH | 2026-01-02 | - | zwangs-delisting | edgar-8K-3.01 | 2026-01-02 | 0001493152-26-000175 (8-K 2026-01-02) | ProPhase Labs, Inc. |
| PTIX | 2026-01-02 | - | zwangs-delisting | edgar-8K-3.01 | 2026-01-05 | 0001493152-26-000263 (8-K 2026-01-05) | Protagenic Therapeutics, Inc.\new |
| PWM | 2025-10-10 | - | umbenennung-ticker | alpaca-name_changes | 2025-10-13 | alpaca-massnahmen:bbb0e21e-0af6-48e8-9275-b31054f1be77 | Aurelion Inc. |
| RBOT | 2026-03-02 | - | zwangs-delisting | edgar-8K-3.01 | 2026-03-04 | 0001213900-26-023404 (8-K 2026-03-04) | Vicarious Surgical Inc. |
| RVPH | 2026-05-13 | - | zwangs-delisting | edgar-8K-3.01 | 2026-05-13 | 0001437749-26-016538 (8-K 2026-05-13) | REVIVA PHARMACEUTICALS HOLDINGS, INC. |
| SBDS | 2026-04-02 | - | zwangs-delisting | edgar-8K-3.01 | 2026-04-02 | 0001870600-26-000019 (8-K 2026-04-02) | Solo Brands, Inc. |
| SGRP | 2026-07-22 | - | zwangs-delisting | edgar-8K-3.01 | 2026-07-15 | 0001437749-26-023636 (8-K 2026-07-15) | SPAR Group, Inc. |
| SISI | 2025-10-06 | - | zwangs-delisting | edgar-8K-3.01 | 2025-10-08 | 0001493152-25-017416 (8-K 2025-10-08) | SHINECO, INC. |
| SSKN | 2026-02-18 | - | zwangs-delisting | edgar-8K-3.01 | 2026-02-11 | 0001140361-26-004822 (8-K 2026-02-11) | STRATA Skin Sciences, Inc. |
| STAI | 2026-02-09 | - | zwangs-delisting | edgar-8K-3.01 | 2026-02-10 | 0001104659-26-012229 (8-K 2026-02-10) | ScanTech AI Systems Inc. |
| STRS | 2026-08-07 | - | uebernahme | edgar-8K-2.01+prospekt | 2026-06-26 | 0000885508-26-000033 (8-K 2026-06-26) | STRATUS PROPERTIES INC |
| SYBX | 2026-01-20 | - | zwangs-delisting | edgar-8K-3.01 | 2026-01-20 | 0001193125-26-016040 (8-K 2026-01-20) | SYNLOGIC, INC. |
| TAIT | 2025-12-03 | - | insolvenz | q-kuerzel | 2025-12-04 | alpaca-massnahmen:cb84b032-134b-4098-ab8f-9098fb39de64 | EA Series Trust |
| TTSH | 2025-12-26 | - | zwangs-delisting | edgar-8K-3.01 | 2025-12-15 | 0001140361-25-045538 (8-K 2025-12-15) | TILE SHOP HOLDINGS, INC. |
| TWO | 2026-08-24 | - | uebernahme | alpaca-cash_mergers | 2026-08-26 | alpaca-massnahmen:8dfe1295-ca69-4a4c-a499-042e66690d8f | - |
| VSEE | 2026-08-05 | - | zwangs-delisting | edgar-8K-3.01 | 2026-08-04 | 0001185185-26-003262 (8-K 2026-08-04) | VSEE HEALTH, INC. |
| VSTD | 2026-07-24 | - | zwangs-delisting | edgar-8K-3.01 | 2026-07-28 | 0001493152-26-034885 (8-K 2026-07-28) | Vestand Inc. |
| WBS | 2026-08-19 | - | uebernahme | alpaca-stock_and_cash_mergers | 2026-08-21 | alpaca-massnahmen:3b89dc3f-ef15-4553-a92c-782c76098816 | WEBSTER FINANCIAL CORP |
| WINT | 2025-08-20 | - | zwangs-delisting | edgar-8K-3.01 | 2025-08-20 | 0001437749-25-027421 (8-K 2025-08-20) | WINDTREE THERAPEUTICS INC /DE/ |
| WORX | 2026-04-13 | - | zwangs-delisting | edgar-8K-3.01 | 2026-04-10 | 0001213900-26-042594 (8-K 2026-04-10) | SCWorx Corp. |
| XAGE | 2025-09-11 | - | uebernahme | edgar-8K-2.01+prospekt | 2025-01-16 | 0000950170-25-006024 (8-K 2025-01-16) | Longevity Health Holdings, Inc. |
| ZSPC | 2026-04-27 | - | zwangs-delisting | edgar-8K-3.01 | 2026-04-23 | 0001104659-26-047275 (8-K 2026-04-23) | zSpace, Inc. |

### T6a - Stellen mit Panel v2.1 als fester Vorgabe

| Datei | Zeile | Urteil | Begruendung |
|---|---|---|---|
| `fundamental-machbarkeit-2026-09-16/bauen.js` | 386 | Werkzeug - umstellen, aber nicht nur der Pfad | Bau der Bilanz-Tafel: kursAm() sucht den Kurs ueber T.symIdx[Leser-Reihe]; in v2.2 liegen die Zeilen nach einer Luecke unter ~2/~3/~4 - ohne Abschnitts-Zuordnung findet der Waechter fuer diese Zeitraeume keinen Kurs |
| `fundamental-machbarkeit-2026-09-16/test-fundamental.js` | 309 | Werkzeug - mit bauen.js umstellen | Pruefung derselben Tafel |
| `gdelt-abdeckung-2026-09-19/namenskarte.js` | 26 | abgeschlossen - bleibt (bei Neulauf umstellen) | Namenskarte der GDELT-Abdeckung aus den Panel-Kuerzeln; Zeile 19 ist der eigene Ordner |
| `mehrfaktor-2026-09-22/zelle.js` | 69 | Werkzeug - umstellen | KONST.PANEL der Mehrfaktor-Maschine; die gemessene Studie (23.09.) bleibt, ein neuer Lauf braucht v2.2 und einen neuen Pin (B14 trifft heute den v2-Pin exakt) |
| `nachrichten-stimmung-machbarkeit-2026-09-19/mde-vorpruefung.js` | 34 | abgeschlossen - bleibt | Machbarkeits-Vorpruefung, abgeschlossen |
| `nachrichten-stimmung-tage-2026-09-19/messen.js` | 542 | abgeschlossen - bleibt | Nachrichten-Stimmung, gemessen 03.10.2026 auf v2.1 |
| `nachrichten-stimmung-tage-2026-09-19/test-messen.js` | 25 | abgeschlossen - bleibt | Test derselben Messung |
| `nachrichten-stimmung-tage-2026-09-19/vorpruefung.js` | 40 | abgeschlossen - bleibt | Nachrichten-Stimmung, gemessen 03.10.2026 auf v2.1 |
| `querschnitt-pruefstand-2026-09-13/bericht-teil3.js` | 27 | abgeschlossen - bleibt | liest voll/teil3/teil3-tage.json der gemessenen Teil-3-Studie |
| `querschnitt-pruefstand-2026-09-13/bericht.js` | 17 | Werkzeug - umstellen | Vorgabe --aus voll; besser: ohne Vorgabe abbrechen wie kontrollen.js/teil3.js/teil4.js |
| `querschnitt-pruefstand-2026-09-13/diagnose-placebo-teil4.js` | 10 | abgeschlossen - bleibt | Diagnose zu Teil 4 (18.09.), Vorgabe voll |
| `querschnitt-pruefstand-2026-09-13/diagnose-spruenge-teil4.js` | 10 | abgeschlossen - bleibt | Diagnose zu Teil 4, Vorgabe voll |
| `querschnitt-pruefstand-2026-09-13/luecken-trockenlauf.js` | 40 | abgeschlossen - bleibt | Trockenlauf zu v2.2, misst absichtlich v2.1 |
| `querschnitt-pruefstand-2026-09-13/luecken-trockenlauf.js` | 312 | abgeschlossen - bleibt | Trockenlauf zu v2.2, misst absichtlich v2.1 |
| `querschnitt-pruefstand-2026-09-13/pruefung-spruenge-v2.js` | 19 | abgeschlossen - bleibt | Vergleich v1 gegen v2.1 |
| `querschnitt-pruefstand-2026-09-13/pruefung-v22.js` | 31 | abgeschlossen - bleibt | Kernpruefung v2.1 gegen v2.2: voll ist hier die Vergleichsbasis |
| `querschnitt-pruefstand-2026-09-13/test.js` | 20 | Werkzeug - umstellen | Vorgabe aus: voll; die Pruefzahl REGRESSION23_ERWARTET hat schon den v2.2-Schluessel |
| `querschnitt-pruefstand-2026-09-13/vergleich-v2.js` | 13 | abgeschlossen - bleibt | Vergleich v1/v2.1, liest voll/kontrollen-v2.json |

### T6b - Abschnitte, deren Firma laut Polygon-Inhaber nicht passt (alle)

| Panel-Reihe v2.2 | Abschnitt | von | bis | CIK des Lesers | CIK laut Polygon | Filings des Lesers im Abschnitt |
|---|---|---|---|---|---|---|
| LVNTB~2 | 2 | 2017-12-29 | 2018-03-01 | 1355096 | 869614 | 1 |
| AGC~2 | 2 | 2020-12-01 | 2021-12-01 | 1027263 | 1401680 | 0 |
| ATAC~2 | 2 | 2020-12-14 | 2021-05-19 | 1742912 | 1823945 | 0 |
| BITE~2 | 2 | 2021-04-06 | 2024-06-28 | 355437 | 1831270 | 0 |
| CCV~2 | 2 | 2021-02-05 | 2023-10-16 | 856341 | 1812234 | 0 |
| CLA~2 | 2 | 2020-10-09 | 2021-03-11 | 1314414 | 1816581 | 0 |
| CLNY~2 | 2 | 2018-06-25 | 2021-06-21 | 1027263 | 1679688 | 0 |
| DNB~2 | 2 | 2020-07-01 | 2025-08-25 | 933691 | 1799208 | 0 |
| DO~2 | 2 | 2022-03-30 | 2024-09-03 | 1665650 | 949039 | 0 |
| GDP~2 | 2 | 2017-04-11 | 2021-12-22 | 756913 | 943861 | 0 |
| INST~2 | 2 | 2021-07-22 | 2024-11-12 | 1424958 | 1841804 | 0 |
| JMG~2 | 2 | 2025-12-10 | 2026-01-14 | 1292966 | 2049717 | 0 |
| JUNE~2 | 2 | 2024-04-17 | 2025-05-30 | 1665650 | 1897087 | 0 |
| MEG~2 | 2 | 2020-07-23 | 2026-05-01 | 933691 | 1643615 | 0 |
| MON~2 | 2 | 2021-03-16 | 2022-12-23 | 355437 | 1828325 | 0 |
| NES~2 | 2 | 2017-10-12 | 2022-02-23 | 892538 | 1403853 | 0 |
| OB~2 | 2 | 2021-07-23 | 2025-06-09 | 1665650 | 1454938 | 0 |
| OLO~2 | 2 | 2021-03-17 | 2025-09-11 | 1174610 | 1431695 | 0 |
| PACE~2 | 2 | 2020-11-27 | 2021-09-20 | 933691 | 1819404 | 0 |
| RICE~2 | 2 | 2020-12-14 | 2021-09-15 | 1064642 | 1823766 | 0 |
| XL~2 | 2 | 2020-12-22 | 2022-11-11 | 933691 | 1772720 | 0 |
| XM~2 | 2 | 2021-01-28 | 2023-06-27 | 933691 | 1747748 | 0 |

### T6b - Reihen ohne Firma (alle)

AAC~3 (v2.1: AAC, CIK 933691), CPAA~3 (v2.1: CPAA, CIK 1841137), GIG~3 (v2.1: GIG, CIK 2023730), GIG~4 (v2.1: GIG~2, CIK 2023730), HYAC~3 (v2.1: HYAC, CIK 1970509), HYAC~4 (v2.1: HYAC~2, CIK 1970509), LCA~3 (v2.1: LCA, CIK 1781495), LEXEB~3 (v2.1: LEXEB, CIK 1669600)

### T6c - Minuten nach dem Panel-Ende

| Handelstag | Nr. | Aktienreihen mit Minuten bis mindestens hier | davon im Leser sichtbar | Reihen, die genau hier enden |
|---|---|---|---|---|
| 2026-09-16 | 1 | 2249 | 2216 | 0 |
| 2026-09-17 | 2 | 2249 | 2216 | 0 |
| 2026-09-18 | 3 | 2249 | 2216 | 1 |
| 2026-09-21 | 4 | 2248 | 2215 | 0 |
| 2026-09-22 | 5 | 2248 | 2215 | 0 |
| 2026-09-23 | 6 | 2248 | 2215 | 0 |
| 2026-09-24 | 7 | 2248 | 2215 | 0 |
| 2026-09-25 | 8 | 2248 | 2215 | 0 |
| 2026-09-28 | 9 | 2248 | 2215 | 1 |
| 2026-09-29 | 10 | 2247 | 2214 | 1 |
| 2026-09-30 | 11 | 2246 | 2213 | 0 |
| 2026-10-01 | 12 | 2246 | 2213 | 3 |
| 2026-10-02 | 13 | 2243 | 2210 | 2243 |

### T5 - alle 47 abgelehnten Split-Saetze

| Reihe | Ex-Tag | Art | Faktor | roh davor | roh ab Ex | roh-Verhaeltnis (erwartet) | Rohdatei zeigt den Sprung | Kopie davor | Kopie ab Ex | Sprung in der Kopie | angewandt | Kopien bis Ex-Jahr |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AA | 2016-11-01 | reverse | 0.33333 | 28.725 | 22.98 | 0.8 (3) | nein | 86.1759 | 22.98 | -73.33 % | ja | 1 |
| AAN | 2020-12-01 | reverse | 0.25 | 62.92 | 18.36 | 0.2918 (4) | nein | 251.68 | 18.36 | -92.71 % | ja | 5 |
| AMPE | 2016-01-05 | reverse | 0.2 | 3.34 | 3.17 | 0.9491 (5) | nein | 5010 | 951 | -81.02 % | ja | 1 |
| ARNC | 2020-04-01 | reverse | 0.25 | 16.06 | 6.87 | 0.4278 (4) | nein | 64.24 | 6.87 | -89.31 % | ja | 5 |
| AWI | 2016-04-04 | reverse | 0.5 | 48.1 | 41.75 | 0.868 (2) | nein | 96.2 | 41.75 | -56.6 % | ja | 1 |
| BEP | 2020-07-30 | reverse | 0.25 | 54.58 | 40.38 | 0.7398 (4) | nein | 145.5467 | 26.92 | -81.5 % | ja | 5 |
| BHAT | 2026-03-06 | reverse | 0.02 | 0.0369 | 0.0351 | 0.9512 (50) | am Nachbartag (2026-03-09) | 1.845 | 0.0351 | -98.1 % | ja | 8 |
| BIP | 2020-03-31 | reverse | 0.111111 | 39.72 | 35.91 | 0.9041 (9) | nein | 238.3202 | 23.94 | -89.95 % | ja | 5 |
| CIVI | 2017-05-01 | reverse | 0.008961537082840448 | 17.75 | 17.75 | 1 (111.588) | nein | 1980.687 | 17.75 | -99.1 % | ja | 2 |
| CNX | 2017-11-29 | reverse | 0.125 | 16.15 | 13.51 | 0.8365 (8) | nein | 129.2 | 13.51 | -89.54 % | ja | 2 |
| CYH | 2016-05-02 | reverse | 0.25 | 19.07 | 15.74 | 0.8254 (4) | nein | 76.28 | 15.74 | -79.37 % | ja | 1 |
| DB | 2017-03-21 | reverse | 0.5 | 18.37 | 17.08 | 0.9298 (2) | nein | 36.74 | 17.08 | -53.51 % | ja | 2 |
| DDR | 2018-07-02 | reverse | 0.1 | 17.905 | 14.12 | 0.7886 (10) | nein | 179.05 | 14.12 | -92.11 % | ja | 3 |
| DGLY | 2025-05-07 | reverse | 0.05 | 0.0261 | 0.048 | 1.8391 (20) | nein | 52.2 | 4.8 | -90.8 % | ja | 10 |
| DLPH | 2017-12-05 | reverse | 0.33333 | 104.3 | 56.34 | 0.5402 (3) | nein | 312.9031 | 56.34 | -81.99 % | ja | 2 |
| DRS | 2022-11-23 | forward | 1.451345 | 10.06 | 9.89 | 0.9831 (0.689) | nein | 6.9315 | 9.89 | 42.68 % | ja | 7 |
| EBIX | 2016-08-02 | forward | 3 | 53.49 | 51.13 | 0.9559 (0.3333) | nein | 17.83 | 51.13 | 186.76 % | ja | 1 |
| EBS | 2016-08-01 | reverse | 0.5 | 33.3 | 30.97 | 0.93 (2) | nein | 66.6 | 30.97 | -53.5 % | ja | 1 |
| EQT | 2018-11-13 | reverse | 0.8 | 34.64 | 18.57 | 0.5361 (1.25) | nein | 43.3 | 18.57 | -57.11 % | ja | 3 |
| FNF | 2017-10-02 | reverse | 0.30663 | 47.44 | 34.3 | 0.723 (3.2613) | nein | - | - | - | keine Kopie | 0 |
| GB | 2016-03-14 | reverse | 0.333 | 37.5 | 34.07 | 0.9085 (3.003) | nein | 112.6126 | 34.07 | -69.75 % | ja | 1 |
| GSK | 2022-07-19 | reverse | 0.8 | 40.41 | 42.27 | 1.046 (1.25) | nein | 50.5125 | 42.27 | -16.32 % | ja | 7 |
| HK | 2016-09-09 | reverse | 0.02945083036616217 | 0.3056 | 0.302 | 0.9882 (33.9549) | am Nachbartag (2016-09-12) | 10.3766 | 0.302 | -97.09 % | ja | 1 |
| HON | 2026-06-29 | reverse | 0.5 | 231.3 | 227.71 | 0.9845 (2) | nein | - | - | - | keine Kopie | 0 |
| IHG | 2016-05-09 | reverse | 0.8333333333333334 | 39.28 | 39.35 | 1.0018 (1.2) | nein | 47.136 | 39.35 | -16.52 % | ja | 1 |
| INPX | 2018-09-04 | reverse | 0.333333 | 0.1449 | 0.1448 | 0.9993 (3) | nein | - | - | - | keine Kopie | 0 |
| IR | 2020-03-02 | reverse | 0.8824 | 32.76 | 32.98 | 1.0067 (1.1333) | nein | 37.126 | 32.98 | -11.17 % | ja | 4 |
| MCEP | 2020-03-24 | reverse | 0.1 | 0.0821 | 0.1891 | 2.3033 (10) | nein | 16.42 | 3.782 | -76.97 % | ja | 5 |
| MFCB | 2017-07-14 | forward | 20 | 1.7221 | 8.875 | 5.1536 (0.05) | nein | 0.0861 | 8.875 | 10207.18 % | ja | 2 |
| MFGP | 2019-04-30 | reverse | 0.8296 | 25.07 | 25.09 | 1.0008 (1.2054) | nein | 30.2194 | 25.09 | -16.97 % | ja | 3 |
| MFH | 2023-02-28 | reverse | 0.9 | 0.8147 | 0.975 | 1.1968 (1.1111) | am Nachbartag (2023-02-27) | 0.9052 | 0.975 | 7.71 % | ja | 4 |
| MNTX | 2023-06-22 | reverse | 0.5 | 5.01 | 5.09 | 1.016 (2) | nein | 10.02 | 5.09 | -49.2 % | ja | 8 |
| NVS | 2019-04-09 | reverse | 0.2 | 94.93 | 83.4 | 0.8785 (5) | nein | 474.65 | 83.4 | -82.43 % | ja | 4 |
| RELV | 2016-10-03 | reverse | 0.14285714285714285 | 0.69 | 0.94 | 1.3623 (7) | am Nachbartag (2016-10-04) | 33.81 | 6.58 | -80.54 % | ja | 1 |
| RRD | 2016-10-03 | reverse | 0.125 | 15.72 | 23.76 | 1.5115 (8) | nein | 125.76 | 23.76 | -81.11 % | ja | 1 |
| SFUN | 2019-06-12 | reverse | 0.2 | 1.16 | 1.09 | 0.9397 (5) | nein | 290 | 54.5 | -81.21 % | ja | 4 |
| SIR | 2018-12-28 | reverse | 0.502509 | 17.5 | 7.54 | 0.4309 (1.99) | nein | 34.8252 | 7.54 | -78.35 % | ja | 3 |
| SMTS | 2017-07-24 | forward | 50 | 2.6 | 2.45 | 0.9423 (0.02) | nein | 0.052 | 2.45 | 4611.54 % | ja | 1 |
| SNR | 2018-11-15 | reverse | 0.25 | 5.35 | 5.22 | 0.9757 (4) | nein | 21.4 | 5.22 | -75.61 % | ja | 3 |
| SPEC | 2022-08-26 | reverse | 0.25 | 10.15 | 10.125 | 0.9975 (4) | nein | 40.6 | 10.125 | -75.06 % | ja | 2 |
| SRC | 2018-06-01 | reverse | 0.1 | 8.76 | 7.64 | 0.8721 (10) | nein | 438 | 38.2 | -91.28 % | ja | 3 |
| SWI | 2021-07-30 | reverse | 0.5 | 11.42 | 11.23 | 0.9834 (2) | am Nachbartag (2021-08-02) | 22.84 | 11.23 | -50.83 % | ja | 5 |
| TGNA | 2017-06-01 | reverse | 0.33333 | 23.74 | 15.3 | 0.6445 (3) | nein | 71.2207 | 15.3 | -78.52 % | ja | 2 |
| TRN | 2018-11-01 | reverse | 0.333333 | 28.52 | 22.74 | 0.7973 (3) | nein | 85.5601 | 22.74 | -73.42 % | ja | 3 |
| TRNX | 2019-12-06 | forward | 5 | 1.56 | 1.19 | 0.7628 (0.2) | nein | 0.312 | 1.19 | 281.41 % | ja | 3 |
| WHLR | 2025-11-28 | reverse | 0.5 | 1.4199 | 1.465 | 1.0318 (2) | am Nachbartag (2025-12-01) | 4089.312 | 2109.6 | -48.41 % | ja | 10 |
| WRK | 2016-05-16 | reverse | 0.1666 | 42.56 | 39.65 | 0.9316 (6.0024) | nein | 255.4622 | 39.65 | -84.48 % | ja | 1 |

### T4 - die 30 Abschnittsanfaenge mit den meisten Tagen in Klasse 1-3 (Panel v2.1, ueber die Luecke gerechnet)

| Abschnitt | Beginn | erster Tag | letzter Tag davor | Luecke (Kalendertage) | Zeilen gezaehlt | davon K1-3 (v2.1) | Klasse nach Anlauf | dasselbe Papier |
|---|---|---|---|---|---|---|---|---|
| XL~2 | luecke | 2020-12-22 | 2018-09-11 | 833 | 38 | 38 | 1 | nein |
| ADT~2 | luecke | 2018-01-19 | 2016-04-29 | 630 | 38 | 38 | 0 | nein |
| DOW~2 | luecke | 2019-04-02 | 2017-08-31 | 579 | 38 | 38 | 2 | nein |
| SE~2 | luecke | 2017-10-20 | 2017-02-24 | 238 | 38 | 36 | 0 | nein |
| MBLY~2 | luecke | 2022-10-26 | 2017-08-31 | 1882 | 38 | 33 | 1 | nein |
| PX~2 | luecke | 2021-10-21 | 2018-10-30 | 1087 | 38 | 31 | -1 | unbekannt |
| LB~2 | luecke | 2024-06-28 | 2021-08-02 | 1061 | 38 | 31 | 0 | nein |
| MON~2 | luecke | 2021-03-16 | 2018-06-06 | 1014 | 38 | 31 | -1 | unbekannt |
| ANAC~2 | luecke | 2021-04-16 | 2016-06-23 | 1758 | 38 | 30 | -1 | unbekannt |
| RICE~2 | luecke | 2020-12-14 | 2017-11-10 | 1130 | 38 | 30 | -1 | unbekannt |
| ATHN~2 | luecke | 2021-05-07 | 2019-02-11 | 816 | 38 | 23 | -1 | unbekannt |
| DNB~2 | luecke | 2020-07-01 | 2019-02-07 | 510 | 38 | 18 | 0 | unbekannt |
| NIO~2 | luecke | 2018-09-12 | 2016-04-08 | 887 | 38 | 7 | 1 | nein |
| XM~2 | luecke | 2021-01-28 | 2017-09-14 | 1232 | 38 | 4 | 1 | unbekannt |
| SWI~2 | luecke | 2018-10-19 | 2016-02-04 | 988 | 38 | 3 | 0 | unbekannt |
| JMG~2 | luecke | 2025-12-10 | 2016-04-08 | 3533 | 24 | 0 | - | unbekannt |
| LINE~2 | luecke | 2024-07-25 | 2016-05-23 | 2985 | 38 | 0 | 1 | nein |
| NUTR~2 | luecke | 2025-08-15 | 2017-08-22 | 2915 | 38 | 0 | - | unbekannt |
| JUNE~2 | luecke | 2024-04-17 | 2017-06-26 | 2487 | 38 | 0 | -1 | unbekannt |
| PHH~2 | luecke | 2024-12-27 | 2018-10-03 | 2277 | 38 | 0 | -1 | unbekannt |
| AHL~2 | luecke | 2025-05-08 | 2019-02-14 | 2275 | 38 | 0 | 0 | unbekannt |
| THRX~2 | luecke | 2021-10-07 | 2016-01-08 | 2099 | 38 | 0 | -1 | unbekannt |
| STR~2 | luecke | 2022-06-06 | 2016-09-16 | 2089 | 38 | 0 | 0 | nein |
| CHAC~2 | luecke | 2025-05-19 | 2019-10-28 | 2030 | 38 | 0 | -1 | unbekannt |
| REE~2 | luecke | 2021-07-23 | 2016-02-26 | 1974 | 38 | 0 | -1 | nein |
| SYT~2 | luecke | 2023-03-31 | 2018-01-05 | 1911 | 38 | 0 | -1 | unbekannt |
| SMLR~2 | luecke | 2021-09-28 | 2016-08-10 | 1875 | 38 | 0 | 0 | unbekannt |
| CVT~2 | luecke | 2021-12-09 | 2016-11-28 | 1837 | 38 | 0 | -1 | nein |
| SWIN~2 | luecke | 2023-09-07 | 2018-10-19 | 1784 | 38 | 0 | -1 | unbekannt |
| TRTL~2 | luecke | 2021-09-09 | 2016-12-16 | 1728 | 38 | 0 | -1 | unbekannt |

### T4 - 20 zufaellig gezogene Abschnittsanfaenge (Saat `t4-luecken`)

| Abschnitt | Beginn | erster Tag | letzter Tag davor | Luecke (Kalendertage) | Zeilen gezaehlt | davon K1-3 (v2.1) | Klasse nach Anlauf | dasselbe Papier |
|---|---|---|---|---|---|---|---|---|
| PHH~2 | luecke | 2024-12-27 | 2018-10-03 | 2277 | 38 | 0 | -1 | unbekannt |
| OSIR~2 | luecke | 2018-08-01 | 2017-03-13 | 506 | 38 | 0 | -1 | unbekannt |
| INST~2 | luecke | 2021-07-22 | 2020-03-23 | 486 | 38 | 0 | -1 | unbekannt |
| BIOS~2 | kuerzelwechsel | 2022-01-28 | 2020-01-31 | - | 38 | 0 | -1 | nein |
| FI~2 | kuerzelwechsel | 2023-06-07 | 2021-10-01 | - | 38 | 0 | 2 | nein |
| WORX~2 | luecke | 2020-08-10 | 2020-04-21 | 111 | 38 | 0 | -1 | unbekannt |
| ANDA~2 | luecke | 2019-03-06 | 2018-03-15 | 356 | 38 | 0 | -1 | unbekannt |
| LCA~3 | luecke | 2019-06-06 | 2018-11-15 | 203 | 38 | 0 | -1 | unbekannt |
| ONE~2 | luecke | 2018-03-28 | 2016-08-04 | 601 | 38 | 0 | -1 | unbekannt |
| KOR~2 | luecke | 2020-08-12 | 2018-09-24 | 688 | 38 | 0 | -1 | unbekannt |
| CCV~2 | luecke | 2021-02-05 | 2017-11-09 | 1184 | 38 | 0 | 0 | unbekannt |
| GSAH~2 | kuerzelwechsel | 2020-08-20 | 2020-02-07 | - | 38 | 0 | -1 | nein |
| BWV~2 | luecke | 2022-02-18 | 2018-04-12 | 1408 | 38 | 0 | -1 | unbekannt |
| JMG~2 | luecke | 2025-12-10 | 2016-04-08 | 3533 | 24 | 0 | - | unbekannt |
| RTL~2 | kuerzelwechsel | 2022-02-15 | 2020-05-20 | - | 38 | 0 | 0 | nein |
| CTAC~2 | kuerzelwechsel | 2020-12-11 | 2020-03-05 | - | 38 | 0 | -1 | nein |
| PX~2 | luecke | 2021-10-21 | 2018-10-30 | 1087 | 38 | 31 | -1 | unbekannt |
| ISRL~3 | luecke | 2023-02-28 | 2019-10-24 | 1223 | 38 | 0 | -1 | unbekannt |
| KCAC~2 | kuerzelwechsel | 2021-04-19 | 2020-11-25 | - | 38 | 0 | -1 | nein |
| RDUS~2 | kuerzelwechsel | 2023-09-01 | 2022-08-12 | - | 38 | 0 | -1 | nein |
