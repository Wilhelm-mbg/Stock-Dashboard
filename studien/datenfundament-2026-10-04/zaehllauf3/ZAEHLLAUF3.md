# Gründe-Tafel — dritter Zähllauf mit verfeinerten Regeln (Auftrag Nr. 90, 04.10.2026)

**Nur gezählt. Es ist keine Tafel entstanden, kein Panel geladen, nichts Bestehendes geändert.** Simulation, keine Anlageberatung.
Regeln, Rangfolge mit Zeilennummern und meine Lesarten: `REGEL-ZAEHLLAUF3.md` (Commit 1 vor dem Zählen, Wortlisten Fassung 2 in
Commit 2 vor Prüf- und Eichprobe). Tabellen und Namenslisten: `z3-anhang.md`; Zahlen: `z3-zahlen.json`; je Zeile: `z3-gruende-neu.json`.

**Wie gerechnet.** Kopien der vier Skripte aus Nr. 86 (`t4-universum.js`, `t4-edgar.js`, `t4-einstufen.js`, `t4-auswerten.js`), dazu
`wortlaut.js`, `texte.js`, `lauf.js`, `proben.js`, `nachzaehlen.js`. Universum: dieselben **5.050** Reihen, Anker = letzter Minutentag
(Anker, letzter Kurs, jüngste Maßnahme bei allen wie im zweiten Lauf). `test.js`: 87 Zusicherungen grün, darunter „alle acht Regeln aus
= Einstufung des zweiten Laufs". EDGAR: **1.047 Anfragen** (177 für Auszüge und Suche, 870 Meldungstexte — je Meldung eine Anfrage),
2 Wiederholungen, keine Sperre, kleinster Abstand 219 ms; 0 Texte nicht zu holen.

## 1. Matrix

Grund im Ganzen (alte Tafel 4.996 Zeilen → Lauf 2 → Lauf 3, je 5.050):

| | Umben. | Übernahme | Aktientausch | Insolvenz | SPAC-Ende | Zwangs-Del. | freiwillig | abgemeldet | ausgesetzt | unbekannt |
|---|---|---|---|---|---|---|---|---|---|---|
| alte Tafel | 1.330 | 1.653 | 310 | 357 | 276 | 547 | 311 | – | – | 212 |
| Lauf 2 | 1.322 | 1.563 | 312 | 335 | 292 | 628 | 23 | 337 | – | 238 |
| **Lauf 3** | 1.327 | **1.665** | 309 | 344 | **343** | **372** | **108** | 370 | **23** | **189** |

Gegen Lauf 2: 4.467 Zeilen gleich, 198 gleicher Grund mit anderem Beleg, 78 „unbekannt" bekommen einen Grund, **298 Kipp-Fälle**
(269 auf einen anderen Grund, 29 auf „unbekannt"; 16 mit Klasse 1–3). Gegen die alte Tafel: 3.876 gleich, 287 anderer Beleg, 105
bekommen einen Grund, 258 nur umbenannt (freiwillig → abgemeldet), **470 Kipp-Fälle** (388 / 82; 30 mit Klasse 1–3). Die 54 neuen
Reihen: Zwangs-Delisting 35, Übernahme 6, freiwillig 4, Umbenennung 4, Aktientausch 3, Insolvenz 1, abgemeldet 1. Beide Matrizen
vollständig in `z3-anhang.md` / `z3-matrix.json`.

## 2. Kipp-Fälle und Ursache je Regel

Größte Ströme gegen Lauf 2: Zwangs-Delisting → freiwillig **95**, → SPAC-Ende **52**, → Übernahme **50**, → unbekannt 27, →
ausgesetzt 17, → abgemeldet 15; abgemeldet → Übernahme 10; Aktientausch → Übernahme 10. Gegen die alte Tafel: Zwangs-Delisting →
freiwillig 71, → SPAC-Ende 55, → Übernahme 52, → unbekannt 43, → abgemeldet 35; Übernahme → unbekannt 28, → Zwangs-Delisting 27.

Je Regel einmal ausgeschaltet (alle anderen an) — Zeilen, die dann einen anderen Grund hätten:

| Regel | V1 | V2 | V3 | V3b | V5 i | V5 iii | V7 | V8 |
|---|---|---|---|---|---|---|---|---|
| alle 5.050 Zeilen | 79 | 142 | 42 | 8 | 52 | 23 | 35 | 29 |
| davon Kipp-Fälle gegen Lauf 2 | 19 | 139 | 35 | 0 | 52 | 17 | 9 | 27 |

4 Kipp-Fälle gegen Lauf 2 hängen an keiner einzelnen Regel (neue Polygon-Liste, Zusammenwirken). Jeder Fall mit beiden Belegen und
`ohne[Regel]`: `z3-kippfaelle.json`; 20 gezogene (Saat `z3-kipp`): `z3-anhang.md`.

## 3. Totalverlust-Eigenschaft (V4)

| Lesart | Bestand Lauf 3 (Klasse 1–3) | gegen Lauf 2: Änderungen (hinzu / weg), Klasse 1–3 | gegen alte Tafel: Änderungen (hinzu / weg), Klasse 1–3 |
|---|---|---|---|
| Haupt (Insolvenz, Zwangs-Delisting) | 716 (**5**) — Lauf 2: 963 (19) | **275** (14 / 261), Kl. 1–3: **14** (0 / 14), Kl. 2–3: 1 | **374** (93 / 281), Kl. 1–3: 14 (0 / 14) |
| streng (+ unbekannt, freiwillig, abgemeldet, ausgesetzt) | 1.406 (45) | **161** (3 / 158), Kl. 1–3: 20 (1 / 19) | **311** (145 / 166), Kl. 1–3: 30 (11 / 19) |

**Leseliste des PM — alle Reihen mit Klasse 1–3, die im dritten Lauf in der Hauptlesart Totalverlust sind: 5.** SIVB (8-K 1.03,
letzter Kurs 105,95), SAVE (Q-Kürzel + 1.03, 1,08), NKLA (Q-Kürzel + 1.03, 0,18), NOVA (Q-Kürzel, 0,22), **CCCX (Q-Kürzel, 13,66 —
falsch: der Mantel wurde in INFQ umbenannt, das Q gehört zum neuen Namen)**. Keine davon kommt aus den Regeln 9 bis 12, deshalb ohne
Auszug. Aus der Hauptlesart gefallen mit Klasse 1–3 (14): DVMT, ETP, POT, SHPG, WNR, GXP, CVC, JAH, DWA → Übernahme; YHOO, ESV →
unbekannt; OZON → ausgesetzt; OZRK → abgemeldet; UBNT → freiwillig (Börsenwechsel).

**Die 14 Reihen des zweiten Laufs:**

| Reihe | Lauf 2 | Lauf 3 (Beleg, Firma, Weg) | Totalverlust | Lesart |
|---|---|---|---|---|
| YHOO | Zwangs-Delisting (FieldPoint) | unbekannt — Polygon-CIK verworfen, Suche ohne Signal | nein | falscher Grund weg; Umbenennung fehlt → Handeintrag |
| DVMT | Zwangs-Delisting | Übernahme (3.01 Vollzug, 28.12.2018, Dell) | nein | richtig |
| ETP | Zwangs-Delisting | Übernahme (2.01 + Prospekt, 19.10.2018, zwei Auszüge) | nein | richtig |
| ESV | Zwangs-Delisting | unbekannt (Valaris, kein Signal im Fenster) | nein | falscher Grund weg; Kürzelwechsel fehlt → Handeintrag |
| WNR | Zwangs-Delisting | Übernahme (3.01 Vollzug, 02.06.2017) | nein | richtig |
| OZRK | Zwangs-Delisting | abgemeldet, Anlass offen (Formular 25 vom 26.06.2017) | nein (streng: ja) | Beleg ein Jahr vor dem Reihenende — Regel 13 hat keine Ankernähe |
| JAH | Zwangs-Delisting | Übernahme (3.01 Vollzug, 15.04.2016) | nein | richtig |
| SBNY | unbekannt | unbekannt (Signature Bank, keine SEC-Meldungen) | nein | Totalverlust fehlt weiter → Handeintrag |
| BCR | unbekannt | Übernahme (3.01 Vollzug, 29.12.2017, über die Suche) | nein | richtig, jetzt auch der Weg |
| SLW | unbekannt | unbekannt (Wheaton) | nein | Umbenennung fehlt → Handeintrag |
| SYMC | unbekannt | Übernahme (2.01 + Prospekt, 04.11.2019, **Broadcom** über den zweiten Suchdurchgang) | nein | **falsch**: fremde Firma (Käufer einer Sparte); SYMC wurde umbenannt |
| PF, ESL | Übernahme | Übernahme (2.01 + Prospekt) | nein | richtig |
| SODA | abgemeldet | abgemeldet (Formular 25) | nein | wie Lauf 2 |

## 4. Wortlaut (V2)

Regel 11: **505 Reihen.** Klasse: Rüge 333, eigener Entschluss 94, Vollzug 40, mehrdeutig 9, nichts 29. Tabellenzeilen: (1) Vollzug am
Anker → Übernahme **38**; (2) Rüge → Zwangs-Delisting **333**; (3) eigener Entschluss → freiwillig **94**; (4) Fusionsbeleg oder 5.01 →
Übernahme **10** (8 + 2); (5) sonst → Zwangs-Delisting mit `wortlaut_unklar` **30**. Über alle Regeln 9–12 (569 Zeilen): 0 Texte nicht
zu holen, **8 Abschnitte nicht gefunden** (ADYX, APEX, CHKE, GIGA, PRKR, SBSA: im Hauptdokument steht kein „3.01"; NRCIB: nur ein
Verweis; PPHI: „Ite m 3.01").

| Klasse | Reihen | mit Fusionsbeleg (180/30) | mit Formular 25 des Emittenten | 3.01 ≤ 30 Tage am Anker | unter 1 $ | 1–5 | 5–8 | 8–13 | über 13 |
|---|---|---|---|---|---|---|---|---|---|
| Vollzug | 40 | 14 | 5 | 38 | 2 | 3 | 2 | 5 | 28 |
| Rüge | 333 | 21 | **56** | 283 | 215 | 68 | 11 | 24 | 15 |
| mehrdeutig | 9 | 7 | 2 | 7 | 2 | 0 | 0 | 4 | 3 |
| eigener Entschluss | 94 | 14 | 90 | 89 | 27 | 25 | 7 | 15 | 20 |
| nichts | 29 | 3 | 9 | 27 | 10 | 9 | 3 | 3 | 4 |

Volle Kreuztabelle (Klasse × Fusionsbeleg × Emittenten-25 × Kursband): `z3-wortlaut.json`.

- **Lernprobe** (30 Reihen, Saat `z3-lern`): mit Fassung 1 fünf ohne gefundenen Abschnitt, vier mit Titel-Tippfehler falsch klassiert;
  die eine Änderung steht in `REGEL-ZAEHLLAUF3.md`. Wirkung auf Regel 11 im Ganzen: Rüge 274 → 333, eigener Entschluss 88 → 94,
  Vollzug 31 → 38, unklar 88 → 30.
- **Prüfprobe** (40 andere Reihen, Saat `z3-pruef`, nach Commit 2 gezogen; meine Lesart des Auszugs, keine zweite Quelle):
  **37 von 40** — Rüge 25 / 25, eigener Entschluss 10 / 11, Vollzug 2 / 2, mehrdeutig 0 / 1, nichts 0 / 1. Fehlgriffe: **SBSA**
  (Abschnitt nicht gefunden), **TLIS** („voluntary" stammt aus „voluntary petition under Chapter 11" → fälschlich freiwillig),
  **EQGP** (Titel ohne Artikel nicht entfernt → mehrdeutig statt Vollzug; der Grund kommt über den Fusionsbeleg trotzdem richtig
  heraus). Klasse richtig, Grund fraglich: GSVC (Rüge 114 Tage vor dem Anker, vermutlich geheilt), SALM (Rüge, danach freiwilliger
  Rückzug), AGII (Börsenwechsel).
- **Eichprobe (a)** — 150 von 991 Übernahmen laut Alpaca mit 3.01 am Anker, erwartet Vollzug: **Vollzug 139 (93 %)**, nichts 5,
  mehrdeutig 2, eigener Entschluss 2, **Rüge 2** (MGOL, FIAC: echte Rügen kurz vor dem Vollzug — die Erwartung „nie Rüge" hält nicht ganz).
- **Eichprobe (b)** — 100 von 117 Q-Kürzeln mit 3.01 nach V3, erwartet Rüge: **Rüge 81 (81 %)**, eigener Entschluss 8, nichts 7,
  mehrdeutig 4. Die 8 „eigener Entschluss" sind die Insolvenz-Sprache („voluntary petition", „voluntarily delist" im Verfahren) — in
  Regel 11 selbst trifft das nach Nachsehen **1** der 94 Zeilen (TLIS), weil das 8-K 1.03 vorher greift.

## 5. Außenprüfungen

**(a) Namensprobe.** 4.713 Reihen mit Polygon-Eintrag (neue Liste; 14 anders als im zweiten Lauf): passt 3.474, nur früherer Name
1.120, nur Kürzel 1, **nichts passt 118**. Firma jetzt: über Polygon allein 4.556, **über beide Auszüge 39**, über die Suche 341 (94
nach verworfener Polygon-CIK, 247 ohne Eintrag), keine Firma 114. Bei den 118 verworfenen findet die Suche 94-mal eine Firma, 63 davon
tragen den Polygon-Namen, 85 sind die der alten Tafel; ihr Grund: unbekannt 47 → 11. Die „99" des zweiten Laufs zerfallen in 60 mit
„nichts passt" (jetzt Suche) und 39 mit bestandener Probe (jetzt beide Auszüge; bei 23 ändert das den Grund, 5 mit Klasse 1–3).
V1 ändert den Grund von 79 Zeilen.

**(b) Beleg höchstens 30 Tage am Anker** (Lauf 3; in Klammern Lauf 2):

| Beleg | ≤ 30 Tage / Zeilen | davor / danach |
|---|---|---|
| alle 8-K 3.01 der Regel 11 | **444 / 505 (88 %)** (494 / 627, 79 %) | 61 / 0 |
| … davon Rüge | 283 / 333 | 50 / 0 |
| … Vollzug, + Prospekt, + 5.01 | 48 / 48 | – |
| … eigener Entschluss | 89 / 94 | 5 / 0 |
| Mantel + 8-K 3.01 (Regel 9) | 45 / 52 | 7 / 0 |
| 8-K 2.01 + Prospekt | 695 / 695 (663 / 663) | – |
| 8-K 1.03 | 131 / 213 (129 / 207) | 14 / 68 |
| Q-Kürzel + 8-K 1.03 | 108 / 109 (105 / 106) | 1 / 0 |
| Formular 25 (Regel 13) | 309 / 370 (288 / 337) | 14 / 47 |
| Formular 15 | 2 / 9 (7 / 18) | 3 / 4 |
| Mantel + Abmeldung (Regel 7) | 226 / 287 (226 / 288) | 3 / 58 |

**(c) V8.** 209 Reihen bekommen eine andere Ende-Maßnahme als bisher: 180 eine andere Art oder einen anderen Satz am Anker, 27 erst
jetzt eine (die jüngste lag außerhalb), 2 keine mehr, weil die Reihe nur die aufnehmende Seite war (AEBIV, SSY — beide über EDGAR
trotzdem Übernahme). Das ändert den Grund bei **29** Zeilen (Aktientausch → Übernahme 10, abgemeldet → Übernahme 5, Übernahme →
Aktientausch 4, zehn weitere Ströme mit je einer Zeile — Liste `c_v8` in `z3-zahlen.json`). 659 der 4.039 Sätze nennen die Reihe nur als aufnehmende Seite.

## 6. Die Gruppen

- **Mantelgesellschaften (Regel 9): 52**, alle im zweiten Lauf Zwangs-Delisting, 0 mit Klasse 1–3 (Wortlaut: Rüge 43). SIC 6770 mit
  3.01 nach V3: 341 Reihen, 288 davon schon über die Regeln 1–7 erledigt. Am Kurs scheitert **1**: GLST (6,56 → Zwangs-Delisting).
- **Ausgesetzte Werte (Regel 10): 23**, 2 mit Klasse 1–3 (OZON, YNDX); im zweiten Lauf 17 Zwangs-Delisting, 6 unbekannt. Namentlich mit
  Kurs, Ende-Maßnahme und Wortlaut in `z3-anhang.md`. Nicht gezählt, weil das Kürzel neu vergeben ist: 4 (CO, OPT, RACY, TFG).
- **Formular 25 des Emittenten neben einem 3.01 (V3): 383 Reihen**, 162 davon in Regel 11: freiwillig 90, Zwangs-Delisting 66,
  Übernahme 6. Zwangs-Delisting: 44 unter 1 $, 11 bei 1–5, 5 bei 5–8, 3 bei 8–13, 3 über 13 (zweiter Lauf: 175, davon 54 über 8 $).
- **Regel 12 (frühe Rüge + 25-NSE): 8** — ADAL, FSSI, HCCH, HCII, HORI, LEGA, VYGG (letzter Kurs 10,05 bis 23,31) und ORGN (0,95).
- **Handeintrag (V6): 18** mit Klasse 1–3 und „unbekannt": CTRP, DISCA, DISCK, DWDP, FRC, HRS, KORS, SBNY, SLW, VRX, WYN, YHOO, QVCA,
  ESV, SWHC, MHFI, LGF, LUK — mit Polygon-Name, Kurs und Maßnahmen-Sätzen in `z3-anhang.md`. „Unbekannt" im Ganzen: 189.

## 7. Nachzählung der Zahlen des Auftrags (§6) und aus Nr. 86 — `nachzaehlen.js`, `z3-nachzaehlung.json`

**Stimmt genau:** 627 Zeilen über 3.01 (32 / 62 / 494 / 39); alte Fassung von V2 108 (54 / 15 / 16 / 23, 36 unter 1 $); SIC 6770 mit
3.01 67 (62 / 1; CCIH, CIAN, QIWI, GLST); SPAC-Ende 283 / 6 / 1 / 2; Emittenten-25 175 (70 / 38 / 13 / 23 / 31); Rollen 1.210 abgebend
(mit BWL.A, LGF.A, LGF.B) und 2 aufnehmend; Nachtrag: nichts am Anker. Aus Nr. 86: 5.050, 4.717, Namensprobe 3.478 / 1.120 / 1 / 118,
die 99, Gruppen 394 / 397 / 28, alle Gründe des zweiten Laufs.

**Stimmt nicht ganz:** „29 Reihen, jüngste außerhalb, frühere im Fenster" — ich zähle **30** (12 / 8 / **8** Umbenennungen / 2), davon
27 als abgebende Seite (ASAP, FLDD, PKBO nur aufnehmend). **CLVR gehört nicht dazu**: seine jüngste Maßnahme liegt im Fenster, nur ist
die Reihe dort die aufnehmende Seite (zählt bei mir unter „andere"). Zwangs-Delisting darunter also KDLY, POND, THRD (+ die drei nur
aufnehmenden), abgemeldet 6 und unbekannt 2 wie genannt. „182 weitere / 158-mal" — ich zähle **183 / 160**. Der Nachtrag nennt neben
ACHL und LUNA noch **XYLO** (Barübernahme 10.09.2026).

## 8. Urteil

Die Regeln tragen: alle sieben falschen Totalverlust-Zugänge des zweiten Laufs mit Klasse 1–3 sind weg (0 neue, 14 fallen heraus),
die Hauptliste schrumpft von 963 auf 716, und die Wortlisten treffen 37 von 40 in der Prüfprobe, 93 % Vollzug und 81 % Rüge in der
Eichprobe. **Reif für die Tafel v2 sind sie noch nicht an vier Stellen:** Regel 0 bucht **5** Mantel-Umbenennungen auf ein Kürzel mit
Q als Insolvenz (CCCX → INFQ, DMYI → IONQ, CENH → ARQQ, IPOD → CCAQ, TLGA → ELIQ, letzter Kurs 6 bis 14 $; CCCX ist eine der fünf
Klasse-1–3-Reihen der Hauptliste); **7 der 8** Zeilen der Regel 12 sind Mäntel am Treuhandwert und gehören zu V5 i; die Rüge gilt ohne
Bestätigung der Abmeldung (**50** von 333 liegen mehr als 30 Tage vor dem Anker, **56** tragen ein Formular 25 des Emittenten —
GSVC, SALM, QVCGB); und Regel 13 hat keine Ankernähe (**61** von 370 Formularen liegen mehr als 30 Tage vom Anker, OZRK). Dazu bleibt
der Suchweg nach verworfener Polygon-CIK ohne Namensprobe (SYMC → Broadcom; 31 der 94 gefundenen Firmen tragen den Polygon-Namen
nicht) und die Handliste von 18 Reihen — das erste ist eine Zeile Regel, die anderen drei sind Entscheide des PM.

## Was nicht ging / Grenzen

- Nichts wurde verweigert, keine Sperre. Die Prüfprobe ist an Auszügen von 300 Zeichen gelesen, nicht an einer zweiten Quelle.
- 8 Abschnitte nicht gefunden (oben); sie laufen als „nichts" in Tabellenzeile 4 oder 5.
- Lesarten, wo der Auftrag zwei zulässt, stehen in `REGEL-ZAEHLLAUF3.md` (14 Punkte) — die wichtigste: bei „nichts passt" wird die
  verworfene Polygon-CIK nicht mitgelesen, deshalb „beide Auszüge" nur bei 39 statt 99 Reihen.
- Die Ursache je Regel ist ein Ausschalt-Vergleich; Zusammenwirken zweier Regeln zeigt er nicht.
