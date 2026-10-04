# Neue Abrufe für das Datenfundament (Auftrag Nr. 89, 04.10.2026)

Beide Teile gingen **ohne Kosten**: kein Kauf, kein Konto, kein Tarif, keine Einstellung bei einem Dienst. Kein bestehendes Werkzeug
wurde geändert oder gestartet, keine bestehende Datei angefasst (alter Maßnahmen-Ordner: 8.348 Dateien, jüngste Änderung 03.09.2026 22:49 UTC —
vorher und nachher gleich; `verschwundene.json` und `universum-2024-09-02.json`: Prüfsumme vorher und nachher gleich, `b-lauf.json`).
Kein Balken-Abruf. Zahlen: `a-zahlen.json`, `b-zahlen.json`; Protokolle: `a-lauf.log`, `b-lauf.log`.

## Teil A — Maßnahmen bei Alpaca, Nachtrag

**Geholt:** alle 13 Maßnahmenarten des Werkzeugs für **01.09.–03.10.2026**, ohne Symbol-Angabe, seitenweise (der Probeabruf lieferte
1.000 Sätze von 850 Kürzeln mit Folgeseite — die Abfrage je Symbol war nicht nötig). **8 Abrufe** (1 Probe + 7 Seiten), 12 Sekunden,
kein Fehler, keine Wiederholung. **6.624 Sätze**, **5.656 Dateien** `<SYM>.json` (3,4 MB) plus `_nachtrag.json` in
`E:/Markt-Dashboard-Archiv/alpaca-massnahmen-nachtrag-2026-10/`. Aufbau wie im alten Ordner (`sym`, `stand`, `quelle`, `von`, `bis`,
`saetze` mit `_art`, `anwendbar`, `ohneFaktor`), neu `abruftag` und `abrufart`. Ein Satz steht bei jedem Kürzel, das er nennt — so
lieferte es auch die Abfrage je Symbol (am alten Ordner nachgezählt, `zuordnungAlt`); deshalb 6.716 Sätze in den Dateien bei 6.624
eindeutigen. Nicht zusammengeführt (Phase 2b).

| Art | Sätze | Art | Sätze |
|---|---|---|---|
| Barausschüttungen | 6.335 | Aktientausch | 18 |
| Zusammenlegungen (Split rückwärts) | 130 | Splits vorwärts | 17 |
| Umbenennungen | 47 | Abspaltungen | 7 |
| Barübernahmen | 31 | Bezugsrechte | 6 |
| wertlos ausgebucht | 27 | Aktiendividenden 3, Tausch+Bar 2, Einheiten-Split 1 | 6 |

**Befund, der den Auftrag berührt: die Quelle filtert den Zeitraum nach `process_date`, nicht nach dem Ex-Tag.** Alle 6.624 Sätze
haben ihren Verarbeitungstag im Fenster (01.09.–02.10.), der Maßnahmentag reicht von 22.08.2025 bis 02.10.2026. Bei Barausschüttungen
ist der Verarbeitungstag fast immer der Zahltag (6.255 von 6.335 später als der Ex-Tag), bei Splits fast immer der Ex-Tag (144 von
148 gleich; 4 Zusammenlegungen später). Ein Abruf „bis gestern“ lässt deshalb Sätze aus, deren Ex-Tag im Fenster liegt und deren Zahltag später ist. Das alte
Werkzeug hatte das Problem nicht, weil es immer bis zum 31.12. fragt.

**Zusatz über den Auftrag hinaus (eine Datei, 3 Abrufe):** `_angekuendigt.json` im selben neuen Ordner — die 2.887 Sätze mit
Verarbeitungstag 04.10.–31.12.2026 (Stand heute). Davon haben **1.713 ihren Maßnahmentag bis 03.10.** (1.710 Barausschüttungen,
CETXP Aktiendividende 30.09., NSTS Barübernahme 01.10. zu 14,31, GPUS Abspaltung 15.09.) — **kein Split darunter**; 242 der
Barausschüttungen betreffen lebende Reihen. Die Dateien je Kürzel sind unverändert, wie beauftragt; ob Phase 2b den Zusatz nimmt,
entscheidet der PM. Zusammen also **11 Abrufe** in Teil A.

### Zählungen (§1.5)

**(a) 01.–03.09.2026 gegen den alten Ordner.** Nach `process_date` (dem Filter der Quelle): alt 164 Sätze, im Nachtrag **163
gleich** (Satz für Satz, alle Felder), keiner mit anderem Inhalt, keiner nur im Nachtrag. Der eine fehlende (Datei `METw`) ist kein
Verlust: die alte Abfrage je Symbol unterschied Groß- und Kleinschreibung nicht und legte der Reihe `METw` die Ausschüttung von `METW`
bei; im Nachtrag steht sie bei `METW`. Nach dem Maßnahmentag: alt 240, gleich 231, **Inhalt anders 2** (AEG ex 03.09. und TAC ex
01.09.: nur `rate` — von der Quelle nachträglich geändert), **nur alt 7**: AIN, BBD, BR, HRB, ITUB, SLB (Barausschüttungen, Ex-Tag
01.–03.09., Zahltag 05.–08.10. — stehen im Zusatz) und `IBMw` (derselbe Schreibweisen-Fall wie `METw`). Dazu 815 Sätze bei Kürzeln
ohne alte Datei (außerhalb des Universums).
Nebenbefund: der alte Ordner führte schon 389 angekündigte Sätze mit Maßnahmentag 04.09.–03.10.; 227 stehen gleich im Nachtrag,
31 mit geändertem Inhalt (22-mal `rate`), 130 im Zusatz (Zahltag später), 1 unter neuer Kennung (PFLT).

**(b) Ab 04.09.2026 (Maßnahmentag, jeder Satz einmal, ganzer Markt):** Splits vorwärts **14**, rückwärts **121**, Einheiten 1;
Barausschüttungen **4.046** (mit Zusatz 5.649), Aktiendividenden 2 (3); Übernahmen **33** (bar 17, Aktientausch 14, beides 2; mit
Zusatz 34); Umbenennungen **42**; Abspaltungen 7 (8), wertlos ausgebucht 23, Bezugsrechte 3.

**(c) Lebende Aktienreihen mit Split seit 04.09.2026: 2 von 2.249.**

| Reihe | Art | Ex-Tag | Verhältnis | Kursfaktor |
|---|---|---|---|---|
| NFE | Zusammenlegung | 14.09.2026 | 50 → 1 | 0,02 |
| WHLR | Zusammenlegung | 22.09.2026 | 9 → 1 | 0,1111 |

Kein Split vorwärts, keine Aktiendividende. Sonst bei lebenden Reihen seit 04.09.: 264 Barausschüttungen, 4 Umbenennungen,
3 Abspaltungen, 2 Barübernahmen.

**(d) Die benannten Kürzel.**

| Kürzel | Was der Nachtrag sagt |
|---|---|
| BURU | Zusammenlegung 40 → 1 am 02.09.2026, dabei BURU → BURUD; Umbenennung BURUD → BURU am 14.09.2026 |
| DBRG | Barübernahme, wirksam 30.09.2026 (verarbeitet 01.10.), 16,00 je Stück; im Zusatz noch eine Barausschüttung 0,01 (ex 30.09.) |
| GBTG | Barübernahme, wirksam 29.09.2026, 9,50 je Stück |
| CSAN | Umbenennung CSAN → CSANY am 21.09.2026 |
| APGE | Barübernahme, wirksam 03.09.2026, 135,11 je Stück |
| CRNX | Barübernahme, wirksam 02.09.2026, 85,00 je Stück |
| HLX | Umbenennung HLX → HOS am 02.09.2026 |
| LEG, TWO | kein Satz im Nachtrag — ihre Maßnahme liegt vor dem Fenster im alten Ordner (LEG Aktientausch 27.08., TWO Barübernahme 26.08. zu 12) |

**Was nicht ging / Grenzen:** nichts verweigert. Sätze, die die Quelle nach dem 03.09. mit einem Verarbeitungstag **vor** dem 01.09.
nachgetragen hat, sieht der Nachtrag nicht (dafür bräuchte es den Vollabruf ab 2016). Die 31 geänderten Sätze zeigen, dass die Quelle
angekündigte Sätze nachträglich ändert — Phase 2b sollte bei gleicher Kennung den Nachtrag gewinnen lassen.

## Teil B — Liste der Börsenabgänge, neu geholt

**Geholt:** Probeabruf HTTP 200 (1.000 Einträge, Folgeseite) — geht ohne Kosten. Danach alle **24 Seiten** im Takt des Werkzeugs
(13 s Abstand), 300 Sekunden, kein 429. **25 Abrufe.** 23.462 Ticker (alt 23.422), davon **6.948 aktienartig** (alt 6.921), in
`Markt-Dashboard-Daten/massive/verschwundene-2026-10-04.json` (1,36 MB), dieselben Felder wie das Werkzeug plus `abruftag` und
`nachtrag`. Kein Kürzel doppelt (die alte Liste führte 25 doppelt).

### Zählungen (§2.4)

**(a) Alt in Neu:** von 6.921 alten Einträgen stehen **6.881** mit demselben Kürzel und demselben Datum in der neuen Liste.
**40 Abweichungen**, keine davon ein geändertes Datum: **25** sind die Doppeleinträge der alten Liste (gleiches oder um einen Tag
versetztes Datum, neu je einmal: ANSC, BACQ, CUX, JHG, LC, LYRA, MBGLw, MDV, QIPT, AC, BLDE, BYON, GMS, GRYP, HSON, MAG …), **15**
Kürzel fehlen in der neuen Liste, weil sie wieder aktiv oder neu vergeben sind (AAC, AT, BCOM, BURU, CAPA, DICE, HOS, ISRL, JONE,
MATR, MN, OIG, PCPC, RML …) — passend zu Teil A: BURU heißt seit 14.09. wieder BURU, HLX heißt jetzt HOS.

**(b) Neue Abgänge nach dem 21.08.2026: 67** (August 19, September 41, Oktober 7; letztes Datum 02.10.2026). Keine nachgetragenen
Einträge mit älterem Datum. Liste (Tag.Monat):
NCL, SBEV 24.08. · RMAX 25.08. · FLZH, OSRH, TWO 26.08. · AIHS, CMII, LEG, NTZ, WILC 27.08. · ALOT, BBCQ, BCAR, BGI, FBRX 28.08. ·
AREN, BCAB, JAB 31.08. · CRNX, HLX, NCSM, YYGH, ZTEK 02.09. · APGE, BTOG, JFB 04.09. · BTAI, LPSN 08.09. · BRNS, CYCN, KWM 09.09. ·
GLMD, RAY 10.09. · PHGE 11.09. · ATAI 14.09. · FEED, SOBR 16.09. · ANY, RITR 17.09. · HCWC, SNYR 18.09. · CSAN 21.09. ·
BRR, HWH, NHIC 22.09. · BMB, PLTS 23.09. · AMRO, DOMO, HVII, TBPH 24.09. · FGNX, IPEX, SBXD 28.09. · RILYN 29.09. ·
AIXC, AMZE, GBTG, GETY 30.09. · DBRG, VRME 01.10. · COLA, FSEA, NSTS, THRMV, VACI 02.10.

**(c) Die benannten:** alle acht stehen darin — DBRG 01.10., GBTG 30.09., CSAN 21.09., APGE 04.09., CRNX 02.09., HLX 02.09.,
LEG 27.08., TWO 26.08.2026. Das Datum der Liste liegt 0–1 Tag nach dem Maßnahmentag bei Alpaca.

**(d) Die 57 Wechsler (X = 10):** **57 von 57** haben jetzt ein Abgangsdatum 0–15 Kalendertage nach ihrem letzten Minutentag (alte
Liste: 52). Neu belegt: APGE (+2 Tage), CRNX (+2), HLX (+1), LEG (+1), TWO (+2).

**Was nicht ging:** nichts.

## Wie es nachzufahren ist

```
studien\datenfundament-2026-10-04\abrufe\a-massnahmen-nachtrag.cmd --probe | --holen | --zusatz
node studien/datenfundament-2026-10-04/abrufe/a-massnahmen-nachtrag.js --pruefen
node studien/datenfundament-2026-10-04/abrufe/b-verschwundene-neu.js --probe | --holen | --pruefen
```

`--holen` und `--zusatz` tun nichts, wenn ihr Ergebnis schon liegt (erneut nur mit `--neu`); `--pruefen` läuft ohne Netz. Der Zugang
steht in keiner dieser Dateien: Teil A holt ihn über die `.cmd` aus dem Benutzerprofil und reicht ihn nur als Kopfzeile weiter
(`schluessel.js` der Spannen-Studie), Teil B überlässt ihn `tools/massive.js`. Ausgegeben werden nur Statuscodes und Zählungen.
