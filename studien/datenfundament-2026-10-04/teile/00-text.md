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

