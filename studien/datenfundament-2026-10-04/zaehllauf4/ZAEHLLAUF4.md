# Vierter Zähllauf der Gründe-Tafel (Auftrag Nr. 92) — Zwillinge, sieben Nachbesserungen, Leseliste

Stand 04.10.2026, 17:27. **Nur gezählt — keine Tafel, kein Panel.** Regel vor dem Zählen: `REGEL-ZAEHLLAUF4.md` (Commit `02ac0b5`).
Reihenfolge: `z4-panel.js` (Panel v2.2 genau einmal geladen, 17:21, 9.904.017 Zeilen) → `t4-universum.js` (E7, V9 ins Universum
des dritten Laufs) → `t4-edgar.js` (E6, 239 Reihen neu gesucht) → `lauf.js` + `texte.js` (Einstufung, 3 Texte nachgeholt) →
`t4-auswerten.js` + `nachzaehlen.js`. EDGAR: **44 Anfragen** (41 Zuordnung, 3 Texte; kleinster Abstand 222 ms, 0 Sperren).
`test.js` 77 grün, Lint sauber.

**Gegenprobe am echten Bestand:** alle Änderungen aus + Zuordnung des dritten Laufs ergibt in **5.050 von 5.050** Zeilen denselben
Grund und Beleg wie `z3-gruende-neu.json`. Jede Abweichung unten kommt also aus V9, E1–E7.

## 1. Zwillinge (V9) — `z4-zwillinge.json` (alle Paare)

| | Reihen | Klasse 1–3 | doppelte Panel-Zeilen |
|---|---|---|---|
| nur Bedingung (a) (Zwilling läuft mindestens einen Tag weiter) | **374** | 43 | 227.431 |
| (a) mit **exakt** gleichem Verhältnis (ohne Toleranz) | 299 | 35 | 191.422 |
| **a, b und c → Regel Z** | **368** | **43** | **224.051** (von 233.293 Zeilen dieser Reihen) |

- **An (b) scheitern 5:** DTC → SBDS (4/60), **FFHL → RTC (36/60), GMTX → IRON (34/60), MYOS → MDVL (42/60), THLD → MTEM (40/60)**.
  Die vier letzten sind echte Umbenennungen bzw. Fusionen mit Reverse-Split kurz vor dem Ende: der „rohe" Schluss des Nachfolgers ist
  vor dem Split ein anderer. Ihre 3.146 doppelten Zeilen bleiben damit im Panel. **An (c) scheitert 1:** ACPW → PIOI (1 Tag Nachlauf).
  Gleiches Ende: 0. Ohne Panel-Zeile: 0 Reihen (eine Reihe, AEBIV, hat einen Abschnitt ohne Zeilen; 34 Reihen haben unter drei Tage).
- Die schwächsten angenommenen Paare: 45/60 zweimal (EARS → CYTO, OPXA → ACER — genau auf der Grenze), dann 46, 47, 47.
- 75 Paare erfüllen (a) nur mit der Toleranz 1e-9 (Lesart 1): das Verhältnis wird aus bereinigten Kursen gebildet, die Abweichung ist
  Rundung; 35 davon teilen ≥ 95 % ihrer Geschichte (Beispiele ACAB → ABP, ATHN → HLGN, BOWX → WE).
- **Grund im dritten Lauf** der 368: Umbenennung 245, unbekannt 47, Übernahme 32, Zwangs-Delisting 15, abgemeldet 12, Aktientausch 9,
  freiwillig 5, Insolvenz 3 — **123 trugen einen anderen Grund als Umbenennung**, 18 standen als Totalverlust (Hauptlesart). Alte Tafel:
  41 als Totalverlust (Hauptlesart; Klasse 1–3: SLW, SYMC, UBNT), 35 weitere nur in der strengen Lesart. 182 Zwillinge sind selbst
  später abgegangen (Ketten wie A → B → C).

## 2. Matrix — `z4-matrix.json`, `z4-kippfaelle.json`

| Grund | dritter Lauf | vierter Lauf |
|---|---|---|
| Umbenennung | 1.327 | **1.456** |
| Übernahme / Aktientausch | 1.665 / 309 | 1.628 / 300 |
| SPAC-Ende | 343 | **368** |
| Insolvenz | 344 | **332** |
| Zwangs-Delisting | 372 | **280** |
| freiwillig / abgemeldet, Anlass offen / ausgesetzt | 108 / 370 / 23 | 108 / **332** / 22 |
| unbekannt | 189 | **224** |

**277 Zeilen** haben einen anderen Grund als im dritten Lauf (148 kippen, 82 verlieren den Grund, 47 bekommen einen). Ursache, je
Änderung einmal ausgeschaltet: **V9 121** (Klasse 1–3: 19), **E5 60**, E3 31, E2 26, E4 24, E6 16 (Klasse 1–3: 3), E1 6, nur
zusammen 8 (E5 + E6: BAS, CALL, PER, RT, TNT, WINS; V9 + E1: DMYI, TLGA). Häufigste Übergänge: abgemeldet → unbekannt 47 (E5),
unbekannt → Umbenennung 47 (V9), Übernahme → Umbenennung 32 (V9), Zwangs-Delisting → abgemeldet 28 (E4/E3), Zwangs-Delisting →
unbekannt 26 (E3), Zwangs-Delisting → SPAC-Ende 21 (E2). Gegen die alte Tafel: 3.518 gleich, 503 gleicher Grund mit anderem Beleg,
502 kippen, 130 verlieren den Grund, 120 bekommen einen, 223 freiwillig → abgemeldet, 54 neu.

## 3. Totalverlust — `z4-totalverlust.json`

| | vierter Lauf | dritter Lauf | alte Tafel | Klasse 1–3 jetzt |
|---|---|---|---|---|
| **Hauptlesart** (Insolvenz + Zwangs-Delisting) | **612** | 716 | 904 | **4**: SIVB, SAVE, NKLA, NOVA |
| **streng** (+ unbekannt, freiwillig, abgemeldet, ausgesetzt) | **1.298** | 1.406 | 1.427 | **28** (= Leseliste) |

Haupt gegen Lauf 3: 105 heraus (Umbenennung 24, abgemeldet 28, SPAC-Ende 21, unbekannt 28, freiwillig 4; Klasse 1–3: CCCX), 1 hinein
(DOM, E6). Gegen die alte Tafel: 371 heraus (Klasse 1–3: BCR, CCCX, CVC, DWA, ESL, GXP, OZON, PF, POT, SBNY, SHPG, SLW, SODA, SYMC,
UBNT), 79 hinein (keine mit Klasse 1–3). Streng gegen Lauf 3: 112 heraus (88 Umbenennung, davon Klasse 1–3 u. a. KORS, VRX, WYN, HRS,
COH, CTRP, OZRK, MHFI, DWDP), 4 hinein (BCR, BNK, SGBK, TAS — alle durch E6, Klasse 1–3: BCR).

## 4. Leseliste — `z4-leseliste.md`: **28 Zeilen** (abgemeldet 13, unbekannt 9, Insolvenz 4, ausgesetzt 2), alle mit Klasse 1–3

Die neun „unbekannt": SBNY, DISCA, DISCK, FRC, YHOO, QVCA, LGF und neu **BCR, CHL** — beide durch E6 (BCR: die Namensprobe hält
„BARD C R INC /NJ/" nicht für „CR Bard Inc."; CHL: die Suchfirma war Fannie Mae). Keine der 28 hat einen gescheiterten Zwilling.

## 5. Nachzählung der Zahlen des PM — `z4-nachzaehlung.json` (17 von 31 stimmen genau)

| Zahl des PM | gezählt | |
|---|---|---|
| V9: 310 nur (a) / 37 Kl. 1–3 / 193.581 Zeilen | 374 / 43 / 227.431 (exakt ohne Toleranz 299 / 35 / 191.422) | **stimmt nicht** — 310 liegt zwischen beiden Lesarten, nicht nachvollzogen |
| V9: 308 mit b und c | 368 | stimmt nicht (Folge der Zeile oben) |
| V9: es scheitern nur DTC → SBDS (4/60) und ACPW → PIOI (1 Tag) | beide stimmen; dazu scheitern **FFHL, GMTX, MYOS, THLD** an (b) | teilweise |
| V9: schwächste echte Paare 46–53 von 60 | 45, 45, 46, 47, 47 | knapp nicht |
| V9: 109 anderer Grund / 14 Totalverlust Lauf 3 / alte Tafel 32 + 29, SLW und SYMC | 126 / 18 / 41 + 36 (Menge nur a); SLW, SYMC (+ UBNT) | Größenordnung, SLW/SYMC stimmen |
| E1: 22 ohne Insolvenz-Meldung, davon 8 Umbenennungen (ARQ … TAIQ); 109 mit Meldung erfüllen E1 | 22; dieselben 8; 109 von 109 | **stimmt** (7 gehen an Regel 1, DMYI an Regel Z) |
| E2: 21 Zwangs-Delistings sind Mäntel mit anderer Kennziffer | 15 über den Namen | stimmt nicht — siehe Urteil |
| E3: 50 frühe Rügen, 42 ohne 25-NSE | 50 / 42 | **stimmt** |
| E4: 30 Zeilen mit unklarem Wortlaut | 30 | **stimmt** |
| E5: 61 von 370 mehr als 30 Tage weg | 61 / 370 | **stimmt** |
| E6: SYMC → Broadcom | Lauf 3 Broadcom; jetzt Gen Digital (und Regel Z, Zwilling GEN) | **stimmt** |
| E7: 63 von 958 weichen um mehr als das 1,5-Fache ab | 127 von 5.049 (Teilmenge roh < 1 $: 61 von 938) | Menge 958 nicht gefunden |
| E7: RNVA 0,589 / LFLY 0,567 / CFNB 13,30 | 0,589 / 0,567 / 13,30 | **stimmt**; 30-Reihen-Probe gegen den letzten Minutenschluss: 27 innerhalb 2 %, größte Abweichung 7,4 % (ALN) |
| E7: `ohnePanelReihe` | 0 (Panelklasse); hier ebenfalls 0, eine Reihe (AEBIV) ohne Zeilen, ohne rohen Kurs | gezählt |
| E8: 18 „unbekannt" mit Kl. 1–3; nach V9 bleiben DISCA, DISCK, DWDP, FRC, SBNY, YHOO, QVCA, MHFI, LGF | 18; es bleiben 7 davon, **DWDP und MHFI** sind jetzt Zwillinge (DD, SPGI), **BCR und CHL** kommen durch E6 dazu | teilweise |

## 6. Urteil

Die Regeln sind **fast** reif für die Tafel v2: die Gegenprobe ist lückenlos, E1, E3, E4, E5 tun genau, was der PM gezählt hat, und
die Hauptlesart steht bei 612 Totalverlusten mit nur noch 4 Klasse-1–3-Fällen, die alle stimmen. Falsch sind noch drei Stellen:
**E6** verwirft mindestens 6 richtige Suchfirmen an Schwächen der Namensprobe (BCR, BNK, CVO, HOLI, OIIM, OTIV — Abkürzung,
Wortstellung, Tippfehler bei Polygon) und macht damit BCR zur „unbekannt"-Zeile der Leseliste; **V9 (b)** lässt 4 echte Nachfolger
mit Reverse-Split am Ende durch (FFHL, GMTX, MYOS, THLD; 3.146 doppelte Zeilen); **E2** verfehlt mit den fünf Namensmustern rund 6
Mäntel (AAPC, APN, ARTE, AVHI, SCVX, WYIG) und macht 3 vollzogene De-SPAC-Übernahmen (CLOE, LACQ, WTMA) zu „SPAC-Ende".
Bevor die Tafel v2 gebaut wird, sollte der PM die Zahl 310/308 gegen 374/368 klären (Gleichheit des Verhältnisses exakt oder mit
Rundung) — sie bestimmt, welche Reihen im Panel v2.3 als doppelt entfernt werden.

## Was ich gelesen habe, wo der Auftrag zwei Lesarten zulässt (siehe `REGEL-ZAEHLLAUF4.md`, 13 Punkte)

Die wichtigsten mit Zahl: Toleranz 1e-9 für das Verhältnis (75 Paare hängen daran); Polygon-Eintrag am Anker auch ohne CIK für E6
und E2 (123 der 239 E6-Reihen); Neu-Suche nur der von E6 betroffenen Reihen — bei 2 weiteren Reihen (PNRL, RACY) hätte E5 den
Auslöser von Durchgang 2 verändert, nicht neu gesucht; E2 „capital corp" trifft 2 Reihen (CLOE, RCFA — beide tatsächlich Mäntel).
