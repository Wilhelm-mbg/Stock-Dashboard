# Datenfundament, Phase 2a (Auftrag Nr. 86, 04.10.2026) — Lebenszeit, Kopien v2, Leser v2 gebaut; Gründe-Tafel ein zweites Mal gezählt

**Art:** Teil 1–3 sind gebaut (drei neue Dinge, nichts überschrieben), Teil 4 ist ein Trockenlauf (es gibt **keine** neue Tafel).
**Geschrieben:** dieser Ordner; auf E: genau zwei neue Ordner (`alpaca1m-ableitungen/`, `alpaca1m-bereinigt-v2/`). In `alpaca1m/` und
`alpaca1m-bereinigt/` trägt heute keine Datei ein neues Änderungsdatum (nachgesehen). Kein Abruf bei Alpaca oder Polygon; EDGAR
1.430 Anfragen über die Kopie des vorhandenen Abrufs (eine Spur, kleinster gemessener Abstand 180 ms, keine Sperre, 0 offen).
**Stände:** Manifest des Minutenarchivs 03.10.2026 21:33 UTC (Ende des Archivs 02.10.2026), Maßnahmen-Archiv 03.09.2026,
Polygon-Liste 23.08.2026, alte Kopien 06.09.2026, alte Gründe-Tafel 12.09.2026, Panel v2.2 bis 15.09.2026. Lauf: 04.10.2026 13:30–14:06.

## Kurz

| Teil | Hauptzahl | Prüfungen |
|---|---|---|
| **1** Lebenszeit aus den Minuten | 8.058 Reihen, davon **7.299** Aktienreihen, **2.249** lebend | bestanden: genau die 57 Reihen aus `t1-wechsel.json` wechseln, 0 umgekehrt; Deckel 17.09.2026; zweiter Lauf byte-gleich |
| **2** Kopien v2 | **209** Jahresdateien, 764 MB: 147 in 44 Reihen (Gruppe a), 62 von 64 veralteten 2026ern (Gruppe b) | bestanden: 6.418.178 Kerzen geändert, alle wie erwartet, 0 nach dem Ex-Tag; Gruppe b: 4.531.762 Kerzen bis zum Ende der alten Kopie bitgleich. **Ohne v2-Kopie 2026: BURU und WHLR** |
| **3** Leser v2 | `leser2.js`: 7.299 Reihen, 2.249 lebend, 0 Jahre ohne Datei (lesen.js: 562) | bestanden: 31 der 33 Reihen bis zum Ende der Rohdatei, BURU und WHLR brechen mit Meldung ab; 20 + 10 gezogene Reihen Kerze für Kerze wie `lesen.js` (9,09 Mio Kerzen) |
| **4** Gründe-Tafel, zweiter Trockenlauf | 5.050 Zeilen eingestuft, 0 offen. Von 4.996 alten Zeilen **kippen 342** (217 auf einen anderen Grund, 125 verlieren ihn), 236 heißen nur neu (R-c), 99 „unbekannt" bekommen einen Grund, 4.319 behalten ihn | Außenprüfungen gezählt (unten). **Die Totalverlust-Eigenschaft ändert sich bei 261 Reihen (+160 / −101), davon 14 mit Klasse 1–3 (+7 / −7)** — und von den sieben neuen Totalverlusten in Klasse 1–3 ist nach Durchsicht der Belege keiner einer |

**Das Wichtigste aus Teil 4 in zwei Sätzen:** Die drei Regeln beheben, wofür sie gedacht waren (EXPR, IDEX, MARK bekommen die richtige
Firma und den richtigen Grund; kein Vollzug mehr fern vom Anker; Formular 25 heißt nicht mehr „freiwillig"), legen aber zwei neue
Fehler frei: **die Polygon-CIK ist selbst nicht verlässlich** (bei 118 von 4.717 Zeilen führt EDGAR unter ihr eine Firma mit ganz
anderem Namen — AFAM → American Eagle Outfitters, YHOO → FieldPoint Petroleum —, bei weiteren 99 trägt die *alte* Firma den
Polygon-Namen unter einer anderen CIK), und **ohne das ferne 2.01 fällt eine Übernahme auf das 8-K 3.01 durch und wird
„Zwangs-Delisting"** (58 Zeilen; die Zielgesellschaft meldet beim Vollzug selbst ein 3.01). Vorschlag: vor der Tafel v2 drei
Zusatzregeln und ein dritter Zähllauf — er kostet keine Anfrage mehr, der Cache deckt alles.

---

## Teil 1 — Lebenszeit aus den Minuten

**Gebaut:** `lebenszeit-minuten.js` → `E:/Markt-Dashboard-Archiv/alpaca1m-ableitungen/lebenszeit-minuten.json` (2,23 MB, Kennung
`datenfundament-2026-10-04/phase2/lebenszeit-minuten/v1`). Je Reihe: Ordner, `aktie`, `erloschen`, erster und letzter Minutentag
(New Yorker Tag), Minutentage, Jahre mit Datei, Abstand zum Archivende in Handelstagen, `lebend`, letzter Tagesbalken und die
Kalendertage dazwischen. Im Kopf: Stand des Manifests, Ende des Archivs, Regel, X = 10, Kennung, Panel-Deckel. Die Datei führt alle
8.058 Reihen des Archivs (auch ETFs), die 7.299 Aktienreihen des Minuten-Lesers tragen `aktie: 1`. Der Stand der Datei ist der Stand
des Manifests — sie trägt keinen Laufstempel, deshalb ist ein zweiter Lauf byte-gleich (sha256 `756d0e92…`, zweimal gemessen).

**Prüfungen** (`teil1-zahlen.json`): 7.299 Aktienreihen ✔; 2.249 lebend ✔ (alt 2.306); lebend → abgegangen **57**, genau die Liste
aus `t1-wechsel.json` (X = 10) ✔; abgegangen → lebend **0** ✔; letzter Minutentag je Reihe wie im Trockenlauf (0 Abweichungen) ✔;
Panel-Deckel nachgerechnet: vom 02.10.2026 elf Handelstage zurück (01.10., 30.09., 29.09., 28.09., 25.09., 24.09., 23.09., 22.09.,
21.09., 18.09., **17.09.2026**) ✔. Keine Jahresdatei liegt über der Grenze zweier Träger (`unscharf: 0`) — jeder Minutentag kommt
aus dem Manifest. Tagesbalken mehr als 30 Tage hinter dem letzten Minutentag: 291 Aktienreihen, mehr als 90 Tage: 257 (beide Zahlen
des Trockenlaufs bestätigt).

## Teil 2 — Kopien v2

**Gebaut:** `kopien-v2.js` (`--zaehlen`, `--schreiben`, `--pruefen`) → `E:/Markt-Dashboard-Archiv/alpaca1m-bereinigt-v2/`, Aufbau wie
der alte Ordner, dazu `_manifest.json` und `_regel.json` (die Leseregel steht dort, wo sie gebraucht wird). Jede Datei nennt im Kopf
Quelle, Stand der Rohdatei (Kerzen, letzter Stempel, sha256 aus dem Manifest), die angewandten Sätze (`massnahmen`, bei verschobenem
Ex-Tag mit `datumQuelle`) und die verworfenen (`v2.verworfen`). Die Ableitung ist eine Kopie der Funktionen aus
`tools/alpaca-vollsammlung.js` — das Werkzeug selbst wird nicht geladen (es zieht Schlüssel-Module nach).

**Zähllauf vor dem Schreiben** (`teil2-zaehllauf.json`, 13:44, nichts geschrieben):

| | Dateien | Kerzen geändert | davon unerwartet | Bemerkung |
|---|---|---|---|---|
| Gruppe a (abgelehnte Split-Sätze) | 147 in 44 Reihen | 6.418.178 in 127 Dateien | 0 | 20 Dateien ohne Änderung (Jahre vor dem Ex-Jahr bei den fünf verschobenen Splits); 82 Dateien tragen danach gar keine Maßnahme mehr (= Rohkurs) |
| Gruppe b (veraltete 2026er) | 64, davon 62 gebaut | 0 bis zum Ende der alten Kopie | 0 | 521.834 neue Kerzen (2.934 bis 19.148 je Datei), alle bis 02.10.2026 |
| ausgenommen | 2 | — | — | BURU (Schluss 0,0727 am 17.07. → Eröffnung 1,94 am 14.09.: × 26,7), **WHLR** (Schluss 0,2294 am 21.09. → Eröffnung 2,03 am 22.09.: × 8,85) |

Größte Änderung je Datei: BHAT/2026 und SMTS/2017 +4.900 %, HK/2016 +3.295 %, MFCB/2016–2017 +1.900 %, RELV/2016 +600 %,
TRNX/2017–2019 +400 %, EBIX/2016 +200 %, SWI/2021 und WHLR/2025 +100 % (Liste aller Dateien im JSON).

**Die Sätze, nachgezählt** (Befund je Satz aus den Rohdateien neu gerechnet, 44 von 44 wie im Trockenlauf): von den 44 in den alten
Kopien angewandten Sätzen zeigen **38** keinen Sprung (± 3 Handelstage) → nicht angewandt; **5** zeigen ihn einen Handelstag nach dem
Tag im Satz → angewandt mit dem Ex-Tag auf dem Tag des Sprungs (BHAT 06.03. → 09.03.2026, HK 09.09. → 12.09.2016, RELV 03.10. →
04.10.2016, SWI 30.07. → 02.08.2021, WHLR 28.11. → 01.12.2025); **MFH** (28.02.2023, Faktor 0,9, Sprung nur am Tag davor) → nicht
angewandt. Die „41 ohne Sprung" des Auftrags sind 38 + die drei Sätze ohne Kopie (FNF, HON, INPX).

**Prüfung nach dem Schreiben** (`teil2-pruefung.json`, die geschriebenen Dateien zurückgelesen): 209 Dateien, sha256 209-mal gleich dem
Manifest, Kopf 209-mal vollständig. Gruppe a: nach dem Ex-Tag 0 Kerzen anders als in der alten Kopie; davor 6.418.178 Kerzen genau
um den Faktor des verworfenen Satzes verschieden, 0 unerwartet; Stichprobe des Auftrags (erste, mittlere, letzte Kerze je Datei,
gegen die Rohdatei nachgerechnet) 441 von 441. Gruppe b: 4.531.762 Kerzen bis zum Ende der alten Kopie, 0 anders; alle 62 reichen
bis zum Ende der Rohdatei (31 davon Aktienreihen).

**Zur Formel des Auftrags:** „jede Kerze davor = alte Kopie ÷ Faktor" gilt mit dem *Kurs*faktor. Mit dem Faktor, wie er im Kopf der
Dateien steht (`new_rate / old_rate`, die Kopie **teilt** durch ihn), ist es v2 = alte Kopie **×** Faktor (Kurse) und ÷ Faktor
(Umsatz) — so geprüft.

**Was nicht ging / was offen bleibt:** (1) **WHLR 2026** hat keine v2-Kopie — der Sprung vom 22.09.2026 sieht nach dem nächsten
Reverse-Split aus (WHLR hatte 2026 schon mindestens fünf), das Maßnahmen-Archiv endet am 03.09. Die Reihe ist damit über `leser2` für 2026 nicht
lesbar, bis der Satz da ist. (2) **Die Kopien des laufenden Jahres veralten heute Nacht wieder**: nach dem Nachlauf um 23:30 sind
die 2026er Rohdateien länger als ihre v2-Kopien (62 aus Gruppe b und BHAT aus Gruppe a, falls BHAT noch handelt). `leser2` bricht
dann für diese Dateien ab, bis `node kopien-v2.js --schreiben` wieder gelaufen ist (eine Minute). Wer das fortschreibt, ist Frage 5
des Trockenlaufs und gehört zum Nachlauf (Phase 2b).

## Teil 3 — Leser v2

**Gebaut:** `leser2.js` (Kennung `datenfundament-2026-10-04/phase2/leser2/v1`) umhüllt `lesen.js`, ohne es zu ändern: `lesen.js` fragt
Ordner und Fenster bei jedem Aufruf bei seinem Konfig-Modul ab; `leser2` stellt beides für die Dauer eines Aufrufs um und danach zurück.

- `reihen()`: wie `lesen.js`, aber `lebend` und `jahre` aus `lebenszeit-minuten.json` (dazu `lebendAlt`, erster/letzter Minutentag).
- `ladeJahr(R, jahr, opt)`: v2-Kopie, wenn es sie gibt **und** sie so weit reicht wie die Rohdatei; sonst die alte Kopie nur, wenn sie
  so weit reicht wie die Rohdatei (Manifest gegen Manifest); sonst — gibt es gar keine Kopie — die Rohdatei. Eine zu kurze Kopie:
  Fehler mit `code: 'LESER2_KOPIE_VERALTET'` und beiden Enden in der Meldung. Kein stilles Lesen, kein stilles Ausweichen.
- **Fenster:** `lesen.js` liest nur das Fenster seiner Studie (bis 31.08.2026) — über `lesen.js` allein ist das Ende der Rohdatei
  gar nicht erreichbar. `leser2` liest in der Vorgabe bis zum Ende des Archivs; `opt.fenster` setzt ein anderes,
  `leser2.FENSTER_LESEN` genau das von `lesen.js`.

**Prüfungen** (`leser2-pruefen.js` → `teil3-pruefung.json`, am echten Archiv): P1 7.299 Einträge, 2.249 lebend, 0 Jahre ohne Datei ✔.
P2 die 33 Aktienreihen: 31 liefern 2026 Kerzen bis zum 02.10.2026 aus der v2-Kopie, BURU und WHLR brechen mit der Meldung ab (die
in Teil 2 benannten Ausnahmen) ✔. P3 20 gezogene andere Reihen (Saat `leser2-andere`, 126 Jahresdateien, 4.423.482 Kerzen): im
Fenster von `lesen.js` Kerze für Kerze gleich ✔; in der Vorgabe 46.535 Kerzen mehr (01.09.–02.10.2026). P4 zusätzlich 10 gezogene
Reihen mit alter, nicht veralteter Kopie (Saat `leser2-altkopie`, 77 Jahre, 42 aus der alten Kopie, 4.671.325 Kerzen): gleich ✔.
P5 die 44 Sätze aus Gruppe a: das Ex-Jahr kommt aus v2, der Kopf nennt den Satz ✔.

**Grenzen:** (1) Ich habe die Veraltungs-Prüfung auch auf die v2-Kopie gelegt (der Auftrag nennt sie nur für die alte) — sonst wäre
ab morgen genau der Fehler wieder da, den Teil 3 abstellen soll. (2) `tageAus()` und `schlussMs()` aus `lesen.js` kennen den
Kalender nur bis 31.08.2026; Halbtage danach gälten dort als ganze Tage (bis zum 02.10.2026 gibt es keinen). `leser2.kalender()`
liefert den ganzen. (3) Der Panelbau liest über `lesen-panel.js`, nicht über `lesen.js` — `leser2` ändert am Panel nichts; die
Umstellung gehört zu Phase 2b.

## Teil 4 — Gründe-Tafel, zweiter Trockenlauf über alle Zeilen

**Wie gerechnet.** Kopien der vier Skripte aus Nr. 79 (`t4-universum.js`, `t4-edgar.js`, `t4-einstufen.js`, `t4-auswerten.js`); die
Originale sind unverändert (`../test.js` weiter grün). `test.js` hält fest, was in der Einstufung anders ist: 43 neue oder geänderte
Zeilen — R-a 1, R-b 2, R-c 5, Rahmen 36 —, 16 Zeilen des Originals ersetzt; `ms`, `tage`, `imFenster`, `leer`, `fenster`, `akz`
wortgleich mit dem Original vom 12.09. Universum: alle **5.050** nach Teil 1 nicht lebenden Aktienreihen (4.996 der alten Tafel +
54 neue, 0 alte Zeilen jetzt lebend), Anker = letzter Minutentag (285 Anker mehr als 3 Tage verschoben, wie in Nr. 79).

- **R-a:** 4.717 Reihen haben einen Polygon-Eintrag mit CIK höchstens 45 Tage am Anker → diese CIK gilt, keine Suche. 333 ohne →
  Volltextsuche wie bisher. Folgeänderung im zweiten Suchdurchgang: ein Kandidat gilt, wenn die Einstufung mit ihm einen Grund
  ergibt (im Original: irgendein Abmelde-Signal — das wäre jetzt weiter als die Einstufung selbst; zehnmal hätte das alte Kriterium
  einen Kandidaten genommen, den das neue ablehnt).
- **R-b:** eine Zeile in `urteil()`: 8-K 2.01 mit Prospekt zählt nur höchstens 30 Tage vor oder nach dem Anker.
- **R-c:** Formular 25/25-NSE ohne 8-K 3.01 → `abgemeldet-anlass-offen`, **nur von der Polygon-Firma**; von einer Firma aus der
  Volltextsuche zählt es nicht (Feld `formular25_ohne_aussenanker`: 18 Zeilen, 11 davon jetzt „unbekannt", 7 „freiwillig" über
  ein Formular 15). Formular 15 allein bleibt „freiwillig". *Lesart:* „von der Firma aus (R-a)" habe ich als „von der Polygon-CIK"
  gelesen; meint der PM „von der nach R-a bestimmten Firma, gleich auf welchem Weg", bekämen diese 18 Zeilen den neuen Grund.
- **EDGAR:** 1.430 Anfragen in 403 s statt der geschätzten 9.000 — der Cache vom 12.09. deckt 3.772 Fenster nachweislich, der aus
  Nr. 79 weitere 62; neu geholt 1.159 Auszüge (389, weil das Fenster nach dem Abruftag endet; 64 wegen der 1.000er-Grenze; 706
  fehlten) und 242 ältere Einreichungsdateien, dazu 25 Suchen. 4 Wiederholungen, keine Sperre, 0 offen.

**Matrix Grund alt (Zeile) → Grund neu (Spalte), alle 4.996 Zeilen der alten Tafel** (`t4-matrix.json`; fett = geändert):

| alt \ neu | Umben. | Übernahme | Aktientausch | Insolvenz | SPAC-Ende | Zwangs-Del. | freiwillig | abgemeldet, Anlass offen | unbekannt | Summe |
|---|---|---|---|---|---|---|---|---|---|---|
| Umbenennung | 1.317 | . | . | **1** | **1** | **9** | . | . | **2** | 1.330 |
| Übernahme | . | 1.508 | **1** | . | **4** | **58** | **2** | **24** | **56** | 1.653 |
| Aktientausch | . | . | 308 | . | **1** | **1** | . | . | . | 310 |
| Insolvenz | . | **4** | . | 321 | **1** | **12** | **1** | **6** | **12** | 357 |
| SPAC-Ende | . | . | . | . | 270 | **4** | . | . | **2** | 276 |
| Zwangs-Delisting | **1** | **15** | . | **7** | **6** | 463 | . | **24** | **31** | 547 |
| freiwillig | . | **8** | . | **1** | **5** | **20** | 19 | **236** | **22** | 311 |
| unbekannt | . | **23** | . | **4** | **4** | **21** | **1** | **46** | 113 | 212 |
| *54 neue Reihen* | 4 | 5 | 3 | 1 | . | 40 | . | 1 | . | 54 |
| **neu im Ganzen** | 1.322 | 1.563 | 312 | 335 | 292 | **628** | 23 | 337 | **238** | 5.050 |

Gleich mit gleichem Beleg 4.219, gleicher Grund mit anderem Beleg 100, „unbekannt" bekommt einen Grund 99 (113 bleiben unbekannt),
nur umbenannt durch R-c 236, **Kipp-Fälle 342** (217 auf einen anderen Grund, 125 auf „unbekannt"). Firma anders als in der alten
Zeile: 1.044 (364 beide belegt und verschieden, 679 neu belegt, 1 nicht mehr belegt).

**Die Kipp-Fälle** (`t4-kippfaelle.json`: jeder mit beiden Belegen, Ursache, Hinweisen, Zeilen in Klasse 1–3; 30 größte und 20
gezogene mit Saat `t4-kipp` in `t4-anhang.md`). Ursache: nur R-a 169, nur Anker 44, nur R-b 36, R-a + R-b 28, R-a + R-c 21, nur
R-c 20, übrige Kombinationen 24; ohne Ankerwechsel 274. Größte Ströme: Übernahme → Zwangs-Delisting **58**, Übernahme → unbekannt
**56**, Zwangs-Delisting → unbekannt 31, Übernahme → abgemeldet 24, Zwangs-Delisting → abgemeldet 24, freiwillig → unbekannt 22,
freiwillig → Zwangs-Delisting 20, Zwangs-Delisting → Übernahme 15. In Klasse 1–3 (letzte 250 Panel-Zeilen) liegen **32**
Kipp-Fälle, 20 davon verlieren den Grund — darunter DWDP, AET, RTN, DISCA, DISCK, HRS, LVLT, SNI, QVCA (alle vorher „Übernahme",
jetzt „unbekannt", weil die Polygon-CIK auf einen anderen Registranten oder eine fremde Firma zeigt) und YNDX (Anker).

**Neue Reihen (54):** Zwangs-Delisting 40, Übernahme 5, Umbenennung 4, Aktientausch 3, Insolvenz 1, abgemeldet 1
(`t4-neue-reihen.json`; in Nr. 79: 36 / 7 / 4 / 3 / 1, dazu 2 freiwillig und 1 unbekannt).

**Außenprüfung 1 — Firma gegen Polygon-CIK.** Alte Tafel: 3.477 von 3.810 stimmen, 333 widersprechen (bestätigt). Neu: 4.717 von
4.717 — **aber das ist nach R-a keine Prüfung mehr**, die Firma *ist* die Polygon-CIK. Als unabhängige Gegenprobe habe ich den
Namen verglichen, den EDGAR unter der Polygon-CIK führt (`t4-polygon-namen.json`, grober Vergleich, Leseliste statt Urteil):

| EDGAR-Name gegen Polygon-Namen | Zeilen |
|---|---|
| passt | 3.478 |
| nur ein früherer Name passt | 1.120 |
| nur das Kürzel steht bei EDGAR | 1 |
| **nichts passt** | **118** |

Nachgesehen an AFAM (Almost Family: Polygon nennt die CIK von American Eagle Outfitters; die alte Zeile hatte die richtige Firma),
YHOO (→ FieldPoint Petroleum), AET (→ „Aetna Services Inc /CT/", ein anderer Registrant als „Aetna Inc /PA/"). Dazu **99** Zeilen,
in denen die *alte* Firma den Polygon-Namen trägt, aber eine andere CIK hat (Schwester- oder Vorgänger-Registrant oder falsche
Polygon-CIK); 60 davon kippen, 48 verlieren den Grund. Von den 125 Zeilen, die den Grund verlieren: 35 mit „nichts passt", 48 mit
„alte Firma trägt den Polygon-Namen", 14 ohne Polygon-Firma. Die Liste enthält auch harmlose Fälle (BAS: Tippfehler „Basis" im
Polygon-Namen; AJAX, AGC: Umbenennung nach dem Mantel-Vollzug).

**Außenprüfung 2 — Beleg höchstens 30 Tage am Anker, je Belegart** (alt = ganze alte Tafel am alten Anker):

| Beleg | alt: ≤ 30 Tage / Zeilen | neu: ≤ 30 Tage / Zeilen | neu: > 30 Tage davor / danach |
|---|---|---|---|
| 8-K 3.01 | 255 / 546 (47 %) | **494 / 627 (79 %)** | 94 / 39 |
| 8-K 2.01 + Prospekt | 669 / 745 (90 %) | 663 / 663 (100 %, durch R-b) | 0 / 0 |
| 8-K 1.03 | 126 / 201 (63 %) | 129 / 207 (62 %) | 14 / 64 |
| Q-Kürzel + 8-K 1.03 | 107 / 107 | 105 / 106 | 1 / 0 |
| Formular 25 | 221 / 291 (76 %) | 288 / 337 (85 %) | 12 / 37 |
| Formular 15 | 1 / 13 | 7 / 18 | 5 / 6 |
| Mantel + Abmeldung | 214 / 273 (78 %) | 226 / 288 (78 %) | 4 / 58 |

**Totalverlust-Eigenschaft** (`t4-totalverlust.json`, jede Reihe namentlich mit beiden Belegen, Ursache, Hinweisen, Klasse 1–3
ja/nein). Hauptliste des Prüfstands (Insolvenz, Zwangs-Delisting): **261 Reihen ändern sich — 160 kommen hinzu, 101 fallen weg**;
220 alte Zeilen und 41 neue Reihen; **14 mit Klasse 1–3 (7 hinzu, 7 weg), 2 mit Klasse 2–3** (YHOO, SBNY). Die 160 neuen: 58
vorher „Übernahme", 25 „unbekannt", 21 „freiwillig", 10 „Umbenennung", 4 „SPAC-Ende", 1 „Aktientausch", 41 neue Reihen. **89 der
160 tragen einen Hinweis, dass der Grund nicht stimmt** (75 ein 8-K 3.01 neben einem Fusionsprospekt, 7 ein 3.01 mit Punkt 5.01
im selben 8-K, 30 einen Beleg mehr als 30 Tage vom Anker, 6 „nichts passt", 2 „alte Firma trägt den Polygon-Namen"). Die 101
wegfallenden werden: unbekannt 43, abgemeldet 30, Übernahme 19, SPAC-Ende 7, freiwillig 1, Umbenennung 1.

Die 14 mit Klasse 1–3, meine Lesart aus den Belegen (nicht aus einer zweiten Quelle geprüft):

| Reihe | Richtung | alt → neu | Lesart |
|---|---|---|---|
| YHOO | hinzu | unbekannt → Zwangs-Delisting (FieldPoint Petroleum, 3.01 vom 03.05.2017) | **falsch**: fremde Firma unter der Polygon-CIK; YHOO wurde umbenannt |
| DVMT | hinzu | unbekannt → Zwangs-Delisting (Dell Technologies, 3.01 vom 28.12.2018) | **falsch**: Umtausch der Tracking-Aktie, 3.01 beim Vollzug |
| ETP | hinzu | Übernahme (2.01 am Anker) → Zwangs-Delisting (3.01 vom 28.04.2017) | **falsch**: anderer Registrant, Beleg 18 Monate vor dem Anker |
| ESV | hinzu | Übernahme (2.01 von 04/2019) → Zwangs-Delisting (3.01 vom 21.04.2020) | **falsch**: Beleg neun Monate nach dem Reihenende (Kürzelwechsel) |
| WNR | hinzu | Übernahme (2.01 von 09/2016) → Zwangs-Delisting (3.01 vom 02.06.2017) | **falsch**: 3.01 der Zielgesellschaft beim Vollzug; das 8-K vom Vortag trägt 5.01 |
| OZRK | hinzu | Übernahme (2.01 von 06/2017) → Zwangs-Delisting (3.01 vom 26.06.2017) | **falsch**: Beleg ein Jahr vor dem Reihenende |
| JAH | hinzu | Übernahme (2.01 von 11/2015) → Zwangs-Delisting (3.01 mit 5.01 am Anker) | **falsch**: Vollzug der Übernahme |
| SBNY | weg | Insolvenz (8-K von Core Scientific) → unbekannt (Signature Bank Corp, kein Signal) | Totalverlust stand zufällig richtig und **geht verloren**; die Bank reicht nicht bei der SEC ein |
| BCR | weg | Zwangs-Delisting (3.01 am Anker) → unbekannt (Vorgänger-Registrant) | Wegfall richtig (Übernahme), Weg falsch |
| SLW | weg | Zwangs-Delisting (Neustar) → unbekannt (Wheaton Precious Metals) | richtig: fremde Firma weg; Umbenennung |
| SYMC | weg | Zwangs-Delisting (3.01 von 08/2018) → unbekannt (Nexland) | Wegfall richtig (Umbenennung), aber über eine fremde Firma |
| PF | weg | Zwangs-Delisting (Bellerophon) → Übernahme (Pinnacle Foods, 2.01 am Anker) | **richtig** |
| ESL | weg | Insolvenz (Sears Holdings) → Übernahme (Esterline, 2.01 am Anker) | **richtig** |
| SODA | weg | Zwangs-Delisting (Sisecam) → abgemeldet (SodaStream, Formular 25 am Anker) | **richtig** |

Strenge Liste (dazu „unbekannt", „freiwillig"): der neue Grund steht in keiner Liste des Prüfstands. Gezählt wie „freiwillig":
268 Änderungen (+201 / −67), 32 mit Klasse 1–3. Gezählt als kein Totalverlust: 555 (+176 / −379), 43 mit Klasse 1–3.

**Drei Gruppen, nur als Liste** (`t4-gruppen.json`, ohne Entscheid):

| Gruppe | Regel | Reihen | davon als Zwangs-Delisting gebucht | mit Klasse 1–3 |
|---|---|---|---|---|
| Mantelgesellschaften mit 8-K 3.01 | SIC 6770 laut EDGAR und ein 3.01 im Fenster | **394** | 67 (163 SPAC-Ende, 115 Umbenennung, 35 Übernahme, 11 Aktientausch) | 3 |
| freiwillige Rückzüge mit 8-K 3.01 | 3.01 und ein Formular 25 des **Emittenten** (Typ 25; 25-NSE reicht die Börse ein) | **397** | 176 (109 Umbenennung, 61 Übernahme, 28 Insolvenz) | 25 |
| ausgesetzte Werte | kein Abgang am Anker, aber Polygon-Datum oder Ende-Maßnahme mehr als 90 Tage danach | **28** (YNDX dabei) | 20 (6 unbekannt) | 2 |

Die zweite Gruppe ist weiter als ihr Name: ein Emittenten-Formular 25 neben einem 3.01 steht auch beim Börsenwechsel (daher die
109 Umbenennungen). Als Hinweis auf „kein Zwang" taugt sie für die 176 Zwangs-Delistings.

### Was der Trockenlauf zeigt

1. **R-a tauscht einen Fehler gegen einen anderen.** Die Suchmehrheit wählte Dauer-Einreicher (EXPR, IDEX, MARK, PF, ESL, SODA:
   jetzt richtig). Die Polygon-CIK ist aber selbst bei mindestens 118 Zeilen eine fremde Firma und bei bis zu 99 ein anderer
   Registrant derselben Firma; dort geht ein richtiger Grund verloren (AET, RTN, DISCA, AFAM, AIRM, APOL …) oder es entsteht ein
   falscher (YHOO). Die Außenprüfung 1 kann das nicht sehen — sie misst gegen die Quelle, die jetzt die Regel ist.
2. **R-b ist richtig, aber allein gefährlich.** Die 76 fernen Vollzüge sind weg (663 von 663 am Anker). Die Zeilen fallen danach
   auf die nächste Regel: das 8-K 3.01. Die Zielgesellschaft einer Übernahme meldet beim Vollzug selbst ein 3.01 (WNR, JAH), oft
   ohne eigenes 2.01 — das wird „Zwangs-Delisting" und damit Totalverlust. Von 627 Zeilen mit Beleg 3.01 haben 146 einen
   Fusionsprospekt im Fenster, 29 Punkt 5.01 im selben 8-K (zusammen 165), 133 liegen mehr als 30 Tage vom Anker; 366 tragen keinen
   Hinweis. Die Schwäche gab es schon in der alten Tafel (BCR), das 550-Tage-Fenster hat sie meist verdeckt.
3. **R-c wirkt wie gedacht:** 337 Zeilen „abgemeldet, Anlass offen" (236 vorher „freiwillig", 46 „unbekannt", 24
   „Zwangs-Delisting", 24 „Übernahme", 6 „Insolvenz", 1 neue Reihe), 288 davon mit dem Formular höchstens 30 Tage am Anker.
4. **Der Anker ist richtig** (3.01 am Reihenende 79 % statt 47 %), wie in Nr. 79.

### Vorschlag für die Tafel v2 — und was der PM vorher entscheiden muss

Ein **dritter Zähllauf** vor der Tafel (wieder ohne Tafel, Stunden statt Tage: alle Auszüge liegen im Cache, 0 Anfragen), mit:

- **V1 — R-a mit Namensprobe:** die Polygon-CIK gilt nur, wenn der EDGAR-Name, ein früherer Name oder das Kürzel zum Polygon-Eintrag
  passt (4.599 von 4.717). Sonst Volltextsuche wie bisher. Wo die Firma der Suche den Polygon-Namen trägt, aber eine andere CIK
  hat (99), beide Auszüge zusammen lesen. *Frage 1:* so — oder die 118 + 99 von Hand durchsehen (Leseliste liegt bei)?
- **V2 — Vollzug über das 3.01:** ein 8-K 3.01 höchstens 30 Tage am Anker **mit** Fusionsprospekt im Fenster oder mit einem 8-K
  5.01 in denselben Tagen ist „Übernahme" (Beleg „8-K 3.01 + Prospekt"), kein Zwangs-Delisting. *Frage 2:* Regel so, und ohne
  Barpreis (wie heute beim 2.01)?
- **V3 — 3.01 nur am Anker:** wie R-b eine Grenze für das 3.01 (heute 550 Tage davor bis 300 danach; 94 liegen mehr als 30 Tage
  davor, 39 danach — ESV). *Frage 3:* welche Grenze? Eine Rüge geht dem Abgang oft Monate voraus (180 Tage davor, 30 danach?).
- **V4 — Buchung des neuen Grundes:** *Frage 4:* zählt „abgemeldet, Anlass offen" in der strengen Liste wie „freiwillig" (dann
  ändert sich dort wenig) oder nicht (dann fallen 379 Reihen aus der strengen Liste)?
- **V5 — die drei Gruppen:** *Frage 5:* Mantelgesellschaften mit 3.01 (67 als Zwangs-Delisting), Emittenten-Formular 25 neben 3.01
  (176) und ausgesetzte Werte (28) — Totalverlust, letzter Kurs oder eigener Grund? (Frage 3 des Trockenlaufs, jetzt mit Zahlen.)
- **V6 — Firmen ohne SEC-Einreichungen** (SBNY): *Frage 6:* Handeintrag mit Quelle oder Bigdata-Nachlauf für die Zeilen in
  Klasse 1–3, die „unbekannt" bleiben?
- **V7 — Lesart R-c** (18 Zeilen, oben).

## Zahlen aus dem Trockenlauf, die sich nicht bestätigt haben

- „rund 9.000 EDGAR-Anfragen, bis zu zwei Stunden": **1.430 Anfragen, 403 Sekunden**.
- „die 41 Split-Sätze ohne Sprung werden nicht angewandt" (Auftrag §1): in den 147 Dateien sind es **38**; 41 zählt die drei Sätze
  ohne Kopie mit. 38 + 5 + MFH = 44 stimmt.
- „64 veraltete Kopien … BURU ist so ein Fall": dazu **WHLR** — 62 neu gebildet, nicht 63.
- Neue Reihen nach Grund: Nr. 79 zählte 36 Zwangs-Delisting / 7 Übernahme / 2 freiwillig / 1 unbekannt, mit den drei Regeln sind es
  40 / 5 / 0 / 0 (+ 1 abgemeldet). Tafel im Ganzen: Zwangs-Delisting 628 (gleich, aus anderen Zeilen), unbekannt **238** statt 200,
  Insolvenz **335** statt 345.
- „Firma gegen Polygon-CIK nicht schlechter als 3.477 von 3.810": formal 4.717 von 4.717, als Prüfung wertlos (siehe oben).
- Alles andere stimmt: 7.299, 2.306 → 2.249, 57 / 0, 291, 257, 562, 33 Aktienreihen, 97 / 64 Kopien, 147 Dateien in 44 Reihen,
  44 von 47 angewandt, 4.996 → 5.050, 285 Anker, 3.477 / 333, 255 von 546, 669 von 745.

## Dateien

| Was | Datei |
|---|---|
| Regeln, Orte, Kennungen | `p2.js` |
| Teil 1 | `lebenszeit-minuten.js`, `teil1-zahlen.json` → E: `alpaca1m-ableitungen/lebenszeit-minuten.json` (1 Datei, 2,23 MB) |
| Teil 2 | `kopien-v2.js`, `teil2-zaehllauf.json`, `teil2-schreiblauf.json`, `teil2-pruefung.json` → E: `alpaca1m-bereinigt-v2/` (209 Jahresdateien in 106 Ordnern + `_manifest.json` + `_regel.json`, 764 MB) |
| Teil 3 | `leser2.js`, `leser2-pruefen.js`, `teil3-pruefung.json` |
| Teil 4 | `t4-universum.js`, `t4-edgar.js`, `t4-einstufen.js`, `t4-panelklasse.js`, `t4-auswerten.js`; `t4-verschwundene.json`, `t4-edgar-zuordnung.json`, `t4-gruende-neu.json` (Arbeitsdatei, **keine Tafel**), `t4-zahlen.json`, `t4-matrix.json`, `t4-kippfaelle.json`, `t4-neue-reihen.json`, `t4-totalverlust.json`, `t4-gruppen.json`, `t4-polygon-namen.json`, `t4-panelklasse.json`, `t4-anhang.md` |
| Tests | `test.js` (66 Kunstfälle grün; `../test.js` aus Nr. 79 weiter 50 grün); `npx eslint` ohne Befund |

## Was nicht ging

- WHLR 2026 und BURU 2026 haben keine v2-Kopie (Regel des Auftrags); beide sind über `leser2` für 2026 nicht lesbar.
- Die Außenprüfung „Firma gegen Polygon-CIK" ist mit R-a nicht mehr unabhängig; die Namensprobe ist ein grober Ersatz.
- „Freiwillige Rückzüge mit 8-K 3.01" sind aus den Formularen nur als Obermenge erkennbar (Börsenwechsel sehen gleich aus).
- Die Lesarten zu den 14 Reihen in Klasse 1–3 stammen aus den Belegen und Allgemeinwissen, nicht aus einer zweiten Quelle.
