# Gründe-Tafel v2 und Panel v2.3 (Auftrag Nr. 92, Schritt 2, 04.10.2026)

Gebaut nach `uebergabe/auftrag-tafel-v2-panel-v23-2026-10-04.md`. Alles neu; alte Tafel, `voll/`, `voll-v22/`, `zaehllauf*`,
`handeintraege-v2/` unverändert; in `konfig.js` nur zusätzliche Konstanten. Kein Abruf bei irgendeiner Quelle, nichts auf E:
geschrieben oder gelesen (siehe §5, Kalender). Simulation mit virtuellem Kapital, keine Anlageberatung.

## 0. Wie gelesen wurde — Abweichung vom Muster, mit Grund

Der Rechner hatte von 18:47 bis mindestens 19:41 nur **1,1 bis 2,3 GB** freien Speicher (`FreeVirtualMemory`; Vorgabe: unter 3,5 GB
kein Panel laden; nichts Fremdes geschlossen). Statt das Panel über `PR.Tafel()` ganz zu laden (rund 1,5 GB), lesen alle Schritte
von Teil 1 und 2 die Jahresdateien **einzeln** (`tafel-v2/panel-jahresweise.js`; Spitze 224–421 MB je Prozess, gemessen).
Gerechnet wird wie die Tafel (Verhältnis = (roh Eröffnung / Faktor) / (roh Schluss / Faktor), Reihenfolge der Datei); der Beweis
ist die Gegenprobe in Teil 1: **Abschnitt, Kandidaten (gleiche Tage, Nachlauf, Urteil) und Zwilling ohne B1 in 5.050 von 5.050
Reihen gleich `zaehllauf4/z4-panel.json`**, das mit `PR.Tafel()` entstand. Der Kalender kommt aus `_stand.json` (`tage`), nicht
aus `K.kalender()` (liest `E:/…/alpaca1m/_kalender.json`); in v2.1, v2.2 und v2.3 stehen dort dieselben 2.765 Tage.

## 1. Teil 1 — Gründe-Tafel v2

`tafel-v2/verschwundene-gruende-v2.json`, Kennung `datenfundament-2026-10-04/tafel-v2/v1`, **5.050 Reihen**, Aufbau wie die alte
Tafel (`kennung`, `stand`, `n`, `zaehler`, `reihen[]` mit `reihe`, `grund`, `datum`, `letzter_balken`, `quelle`, `beleg`), dazu
`regel`, `letzter_kurs_roh`, `zwilling` / `zwilling_info`, `e6_name_passt`, `handeintrag` (Quelle, Beleg, Anmerkung, Grund nach den
Regeln), `klasse123`. Bau: `v2-panel.js` (Zwillinge mit B1) → `tafel-v2.js` (Einstufung des vierten Laufs per `require`,
unverändert, plus B1–B3). `test.js` **28 grün** (B1 fest/wandernd, Grenze 0,9e-6 / 1,1e-6, B1 ändert a und c nicht, kurze Reihe;
B2 Fall/Gegenfall/aus; B3 Fall/Gegenfall/vor dem Zwilling/aus; Gegenprobe an drei Kunstfällen; Handeintrags-Datei).

**Gegenprobe:** B1-Zusatz, B2, B3 aus → in **5.050 von 5.050** Zeilen alle Felder der Einstufung gleich `z4-gruende-neu.json`
(24 Felder, u. a. Grund, Datum, Quelle, Beleg, Regel, Firma, Signale). Ausnahme mit Absicht: `nachfolger_im_archiv` (256 Zeilen) —
die Karte dazu liest E:; das Auskunftsfeld wird aus der Zeile des vierten Laufs übernommen (1.088 Zeilen, Regel und Nachfolger
gleich), bei Zwillingen 1, bei Handeinträgen nur bei gleichem Nachfolger.

**Lesarten (bitte prüfen):** (1) B1: an den Fenstertagen mit Zeile im Zwilling zählen die ungleichen Tage mit, wenn das Verhältnis
roh C / roh D an allen ungleichen Tagen dasselbe ist ((max − min) ≤ 1e-6 · max). (2) B2: eine von E6 betroffene Reihe nimmt die
Firma ohne Verwerfung = Zuordnung des dritten Laufs (genau „ohne E6" des vierten Laufs); `e6_name_passt` false = diese CIK hat die
Namensprobe verworfen (64), true = geprüft und behalten (175). (3) B3: `regel` H, `quelle` `handeintrag-v2:daten|wissen`, `datum`
= Datum der Regeln, sonst der Anker des Eintrags; alle 33 Anker = letzter Minutentag.

**Was B1 im Datenbestand ist:** bei FFHL, GMTX, MYOS, THLD weichen die rohen Schlüsse vor dem Split nur **im letzten Bit** ab
(Verhältnis 1,0000000000000002), kein Faktor 10 — die Rundung beim Zurückrechnen der Quelle.

**Matrix vierter Lauf → v2:** 43 Zeilen mit anderem Grund. Ursache (die Änderung, ohne die der alte Grund zurückkommt):
**B3 26** (Klasse 1–3: 21), **B2 14** (1), **B1 2** (FFHL unbekannt → Umbenennung, THLD Übernahme → Umbenennung), „B2 oder B3" 1
(BCR). Gleicher Grund, anderer Beleg: B1 2 (GMTX, MYOS waren schon Umbenennung), B2 7. Zwillinge (Regel Z): 368 → **372**.

| Grund | vierter Lauf | Tafel v2 |
|---|---|---|
| Umbenennung | 1.456 | 1.466 |
| Übernahme / Aktientausch | 1.628 / 300 | 1.632 / 305 |
| SPAC-Ende | 368 | 375 |
| Insolvenz / Zwangs-Delisting | 332 / 280 | 337 / 275 |
| freiwillig / abgemeldet / ausgesetzt | 108 / 332 / 22 | 112 / 321 / 22 |
| unbekannt | 224 | 205 |

**Totalverlust** (`v2-zahlen.json`):

| | Erwartung PM (Lauf 4 + Hand) | Tafel v2 | Klasse 1–3 |
|---|---|---|---|
| **Hauptlesart** (Insolvenz + Zwangs-Delisting) | 609, Kl. 1–3: SIVB, SBNY, FRC, SAVE, NKLA, NOVA | **612** | **genau die sechs**: SIVB, SBNY, FRC, SAVE, NKLA, NOVA |
| **streng** (+ unbekannt, freiwillig, abgemeldet, ausgesetzt) | 1.275, Kl. 1–3: 10 | **1.272** | **11** (+ WP) |

Die Abweichungen, namentlich — alle aus B1/B2, nicht angeglichen:
- **Haupt +3 = B2:** heraus **DOM** (Zwangs-Delisting → unbekannt); hinein **CVO** (Insolvenz), **ERB** (Zwangs-Delisting),
  **OTIV** (Zwangs-Delisting), **VISI** (Insolvenz). VSR bleibt drin (Zwangs-Delisting → Insolvenz).
- **Streng −3:** heraus FFHL (B1), BNK, SGBK, TAS (B2); hinein **WP** (B2, Klasse 1–3: Übernahme → abgemeldet).

**Achtung B2 (Befund, kein Eingriff):** die Namensprobe hat nicht nur richtige Firmen verworfen. Unter den 14 B2-Kippfällen tragen
mindestens sieben jetzt die Meldungen einer **falschen** Firma: DOM ← ABENGOA (Lauf 4 hatte den richtigen Trust),
**ERB ← Nuwellis** (Rüge → Zwangs-Delisting), **VISI ← Weatherford** (8-K 1.03 → Insolvenz), **VSR ← RCS Capital**
(→ Insolvenz), **WP ← ProShares Trust** (Klasse 1–3), NTT ← Goldman Sachs, CHU ← SemiLEDs. Richtig zurück kamen CVO (Cenveo),
OTIV, BNK (C1 Financial), SGBK (Home BancShares); EGI, SONG, TAS nicht geprüft. Zwei der vier neuen Haupt-Totalverluste (ERB,
VISI) stehen damit auf fremden Meldungen. Alle 64 Zeilen mit `e6_name_passt: false` sind gekennzeichnet (48 davon ohne Wirkung auf
den Grund). Vorschlag für den PM: Handeinträge für die sieben, oder B2 nur bei Namensnähe.

## 2. Teil 2 — Panel v2.3 (`querschnitt-pruefstand-2026-09-13/voll-v23/`, nicht im Repo)

Kennung `querschnitt-pruefstand-2026-09-13/panel/v2.3`, abgeleitet aus `voll-v22/panel/` (Jahresdateien, nichts aus dem Archiv).

**Doppelte Abschnitte** (`doppelte-v23.js` → `doppelte-abschnitte-v23.json`, gleich `voll-v23/doppelte-abschnitte.json`):

| | gezählt | PM |
|---|---|---|
| Bedingung (a) allein | 391 (389 mit Nachlauf ≥ 1 Tag) | 388 |
| (a)–(c) ohne Split-Zusatz | 383 | 382 |
| **(a)–(c) mit B1 = entfernt** | **387** (+ FFHL, GMTX, MYOS, THLD) | – |

Der Unterschied zum PM sind drei benannte Abschnitte: **HLX** (in v2.2 `lebend`, letzte Zeile 2026-09-01, HOS trägt alle 2.681
Kurse weiter, 9 Tage Nachlauf — nach der Regel doppelt und entfernt; der PM hatte „HLX am Ende des Panels" ausgenommen) und
**BTBT / DNJR** (gegenseitig gleich, gleiches Ende, nur (a)). Rest von (a) ohne Zwilling: ACPW (1 Tag), DTC (4/60), BTBT, DNJR.
Alle 372 Tafel-Zwillinge sind am Panel doppelt; dazu 15 Abschnitte, die keine Tafel-Zeile meinen (HCP → DOC, DOW → DD,
VTIQ → NKLA, GSAH → VRT u. a., 9 enden mit Kürzelwechsel, 6 mit Lücke).

**Zeilen:** 243.134 entfernt (2,45 % von 9.904.017) → **9.660.883** Zeilen, 7.092 Reihen. Davon im Zwilling am selben Tag
exakt gleich 233.173, gleich bis auf 1e-6 (letztes Bit) 7.215, anderer Kurs 0, **ohne Zwillingstag 2.746** in 10 Abschnitten
(BPMX 833, IFON 447, ALQA 444, MNGA 348, ABAC 169 …: der Zwilling beginnt später) — diese Zeilen sind in v2.3 nicht mehr da
(`doppelte-rest-v23.json`).

**Ketten:** 387 Kanten in 362 Gruppen; 23 Gruppen mit drei und mehr Abschnitten (CLNS, CLNY~2, NSAM → DBRG; SSC, WCST, YOD →
IDEX; EDNT, XSPL → BBIG …), **keine Kette der Tiefe 2** — die Quelle hängt die Geschichte immer an das jüngste Kürzel. Die Regel
„der am längsten Laufende bleibt" ergibt in jeder Gruppe genau den einen nicht doppelten Abschnitt. 14 Abschnitte verlieren ihren
Vorgänger (`vorgaenger: null`, `vorgaenger_entfernt`: ALTM, BCAC, BIOS, CPAA, CTRA, DOW, GB, HCP, HRT, KCAC, LCA, LHC, THRX, VTIQ);
ihre erste Zeile bleibt unverändert (ohne Rendite, wo sie es war).

**Kernprüfung** (`pruefung-v23.js` → `pruefung-v23.json`): **bestanden**, Rückgabewert 0. 9.904.017 − 243.134 = 9.660.883 genau,
je Jahr und je Reihe; alle 9.660.883 Zeilen in allen zwölf Spalten bytegleich, `sym` auf denselben Namen; die Probe aus 1 auf v2.3
findet **0** doppelte Abschnitte (nur (a): die vier oben); Namen und Reihenfolge = v2.2 ohne die 387; `lebend` wie v2.2;
`ende_grund` jeder Reihe = Tafel v2 (4.678) oder Schnitt aus v2.2 (164: Lücke, Kürzelwechsel), 2.250 ohne Tafel-Zeile (alle lebend);
letzter voller Tag 2026-09-15 wie v2.2.

**Gründe, die sich ändern** (`gruende-geaendert-v23.json`, Name / alt / neu): **903 Reihen** (dazu 250 nur mit anderem Datum), 53
davon lebend. Häufigste Übergänge: freiwillig → abgemeldet 216, Zwangs-Delisting → SPAC-Ende 80, → freiwillig 72, → unbekannt 54,
→ abgemeldet 48, → Übernahme 47. Ausbuchung im Prüfstand (tote Abschnitte): Hauptlesart 904 → **579**, streng (Prüfstand: +
unbekannt, freiwillig) 1.427 → 890. Der Schlüssel in die Tafel ist der Reihenname ohne `~N` (bei eigener Archiv-Reihe wie AAC~2 der
Name) — derselbe, mit dem v2.2 die alte Tafel las: an allen 6.928 Reihen nachgeprüft. **56 lebende Abschnitte** tragen jetzt einen
Grund der Tafel v2 (v2.2: 3) — die Tafel hat Zeilen für heute lebende Kürzel (z. B. EQR, WBS, TWO); `lebend` bleibt 1, im Prüfstand
nur dann ohne Wirkung, wenn sie bis zum letzten Tag laufen. **Das tun 90 lebende Abschnitte nicht** (letzte Zeile vor dem
2026-09-15); 33 davon tragen jetzt Insolvenz/Zwangs-Delisting (ADTX, ALUR, BINI, CARM, SBDS, WINT, XAGE … — in v2.2 ohne Grund).
Der Prüfstand fragt `lebend` nicht ab (`pruefstand.js` Z. 282: Ende der Reihe → `endeGrund`): hielte ein Portfolio sie am Ende,
bucht v2.3 −100 %, v2.2 den letzten Kurs. In der Kontrollrechnung (Teil 3) ändert das nichts (Totalverlust-Tote 0 in beiden).

**Lesen:** `konfig.js` zusätzlich `PANEL_KENNUNG_V23`, `GRUENDE_DATEI_V2`, `gruendeV2()`; `PANEL_KENNUNGEN_LESBAR`, `gruende()`,
`GRUENDE_DATEI`, Pins unverändert. `PR.Tafel(aus, { panelKennung: K.PANEL_KENNUNG_V23 })` (Kalender dann aus dem Stand),
`kontrollen.js --v23`. Ohne Option bricht `ladePanel('voll-v23')` an der Kennung ab (geprüft); alle anderen Aufrufe laufen wie zuvor.

## 3. Teil 3 — Kontrollrechnung (Momentum 12-1 monatlich, Hauptlesart, netto Pp je Monat)

Dieselbe Teil-2-Zahl wie für v2.1 und v2.2 (`laeufe.momentum['monat/haupt'].netto.mittel`), gerechnet mit
`node --max-old-space-size=6144 kontrollen.js --aus voll-v23 --v23 --nur momentum --bericht voll-v23/kontrollen-v23.json`
(19:46, 8,8 GB frei, ein Prozess). Keine Studie, kein Urteil, **nicht** in `konfig.js` eingetragen.

| Panel | Gründe | netto Pp/Monat | t | brutto | Tote / davon Totalverlust |
|---|---|---|---|---|---|
| v2.1 (`voll/`, Pin in `konfig.js`) | alte Tafel | **1,6694766839043451** | – | – | – |
| v2.2 (`voll-v22/kontrollen-v22.json`) | alte Tafel | **1,6868679011460952** | 2,72 | 1,6991 | 6 / 0 |
| v2.3 (`voll-v23/kontrollen-v23.json`) | Tafel v2 | **1,6784246820489759** | 2,71 | 1,6907 | 6 / 0 |

Verschiebung v2.2 → v2.3: **−0,0084 Pp je Monat** (−0,5 %); v2.1 → v2.3: +0,0089. Wöchentlich 0,3905 → 0,3889, streng
1,7014 → 1,6854. Die Wirkung kommt hier aus den entfernten Zeilen, nicht aus den Gründen (kein Totalverlust unter den Toten).

## 4. Was nicht ging, was nicht geprüft ist

- **Panel nie ganz geladen in Teil 1/2** (Speicher, §0) — jahresweise gelesen; gleichwertig belegt durch die Gegenprobe gegen
  `z4-panel.json` (5.050/5.050) und die Kernprüfung.
- **Tests ohne Option grün und gleich** (gefahren nach 19:45 bei 8,8 GB frei, je ein Prozess): Prüfstand `test.js` 82/0,
  `test-teil2.js` 20/0 (Ausgabe zeilengleich mit `voll-v22/suiten/test2.out`), `test-teil3.js --aus voll` 13/0/2,
  `test-teil4.js` 12/0/1 — die drei Protokolle `test-lauf*.json` bis auf den Zeitstempel gleich dem Stand im Repo und danach mit
  `git show HEAD:… >` auf genau diesen Stand zurückgeschrieben (sonst stünde nur ein neuer Zeitstempel im Baum; vorher waren sie
  unverändert). Studien: Nr. 74 76/0, Nr. 78 169/0, Nr. 82 160/0, Nr. 85 80/0, Nr. 88 158 grün; Ergebnis-Drift-Machbarkeit 132 grün.
  Diese Tests lesen wie immer den Kalender (`K.kalender()`) und `test.js` §1 die Dateiliste des Archivs auf E: — nur lesen, ihr
  eigener Pfad; meine Skripte lesen nichts von E:.
- **B2 bringt falsche Firmen zurück** (§1) — nach Auftrag nicht angeglichen; der PM entscheidet.
- **Nicht geprüft:** die Firmen von EGI, SONG, TAS; ob die 11 Handeinträge mit Quelle `wissen` stimmen (übernommen, wie sie
  stehen); die 90 lebenden Abschnitte, die vor dem Panel-Ende aufhören (§2) — gezählt, nicht gelesen; die 2.746 Zeilen ohne
  Zwillingstag sind entfernt, ihre Kurse stehen nirgends sonst im Panel (gezählt, nicht bewertet).

## Für das Log

Nr. 92 Schritt 2: Gründe-Tafel v2 (5.050 Reihen, B1–B3; Gegenprobe = Lauf 4 in 5.050/5.050) — Haupt 612 mit genau SIVB, SBNY, FRC,
SAVE, NKLA, NOVA; +3 gegen die Erwartung durch B2, das u. a. ERB, VISI, VSR, WP falsche Firmen zurückgibt. Panel v2.3: 387 doppelte
Abschnitte / 243.134 Zeilen entfernt (PM 382: dazu HLX und die vier Split-Fälle), Kernprüfung bestanden; Momentum-Kontrolle
1,6695 / 1,6869 / 1,6784 Pp (v2.1 / v2.2 / v2.3). 33 „lebende" Abschnitte enden vor dem Panel-Ende mit Totalverlust-Grund.

## Commits, Verbrauch

`cb3a24d` Teil 1 (Tafel v2), `1447b34` Teil 2 (Panel v2.3, Kernprüfung, Lesen mit Option), Teil 3 und dieser Bericht im
nächsten Commit (Kalender aus dem Stand bei `--v23`, `doppelte-rest-v23.*`). Verbrauch: geschätzt rund 300k (Schätzung des Chats).
