# Regel des dritten Zähllaufs der Gründe-Tafel (Auftrag Nr. 90) — festgeschrieben vor dem Zählen

Stand 04.10.2026 14:59, vor dem ersten Lauf der Einstufung. Es entsteht **keine Tafel**; nichts Bestehendes wird geändert.
Die Regeln sind die des Auftrags (§1, fest). Diese Datei hält fest, **wo** sie im Code stehen und **wie ich sie gelesen habe**,
wo der Auftrag zwei Lesarten zulässt. Bis hierher gelaufen ist nur der Universum-Schritt (Arbeitsdatei, keine Einstufung).

## Rangfolge — erster Treffer gewinnt (`t4-einstufen.js`, Funktion `urteil()`, Zeilen dieser Kopie)

| Nr. | Regel | Grund | Beleg | Zeilen |
|---|---|---|---|---|
| 0 | Umbenennung auf ein Kürzel mit Q am Ende (V8) | `insolvenz` | `q-kuerzel`, `q-kuerzel+edgar-8K-1.03` | 170–176 |
| 1 | Umbenennung (V8) | `umbenennung-ticker` | `alpaca-name_changes` | 177–189 |
| 2 | Barübernahme oder Tausch + Bar (V8) | `uebernahme` | `alpaca-cash_mergers`, `alpaca-stock_and_cash_mergers` | 190–194 |
| 3 | Aktientausch (V8) | `fusion-aktientausch` | `alpaca-stock_mergers` | 195–198 |
| 4 | 8-K 1.03 im Fenster (550 / 300 Tage) | `insolvenz` | `edgar-8K-1.03` | 199 |
| 5 | 8-K 2.01 höchstens 30 Tage am Anker + Fusionsbeleg (R-b) | `uebernahme` | `edgar-8K-2.01+prospekt` | 202–204 |
| 6 | Rücknahme (V8) | `spac-ende` / `freiwillig` | `alpaca-redemptions` | 205–209 |
| 7 | Mantel-Name + Formular 25 oder 15, kein 2.01 | `spac-ende` | `edgar-mantel+abmeldung` | 210–212 |
| 8 | wertlos ausgebucht (V8) | `zwangs-delisting` / `insolvenz` | `alpaca-worthless_removals` | 213–216 |
| 9 | V5 i — SIC 6770, letzter Kurs ≥ 8,00 $, 8-K 3.01 nach V3 | `spac-ende` | `edgar-mantel+8K-3.01` | 217–221 |
| 10 | V5 iii — ausgesetzter Wert | `ausgesetzt` | `ausgesetzt` | 222–224 |
| 11 | V2 — 8-K 3.01 nach V3, nach Wortlaut (fünf Zeilen) | `uebernahme` / `zwangs-delisting` / `freiwillig` | `edgar-8K-3.01-vollzug`, `-ruege`, `-eigener-entschluss`, `+prospekt`, `+5.01`, `edgar-8K-3.01` | 225–236 |
| 12 | V3b — frühe Rüge + 25-NSE am Anker | `zwangs-delisting` | `edgar-8K-3.01-ruege-frueh+25-NSE` | 237–243 |
| 13 | Formular 25 ohne 8-K 3.01 nach V3 (V7) | `abgemeldet-anlass-offen` | `edgar-formular25` | 244 |
| 14 | Formular 15 | `freiwillig` | `edgar-formular15` | 245 |
| 15 | nichts davon | `unbekannt` | `edgar-ohne-signal`, `massnahme-passt-nicht`, `nichts` | 246–247 |

Hilfsfunktionen in derselben Datei: `fensterV` 83–96 (V3, V3b, Fusionsbeleg 180/30), `hat501` 98–106, `endeFuer` 108–116 (V8),
`wortlautVon` / `mitWortlaut` 119–134 (V2), `ausgesetzt` 137–150 (V5 iii), `vereinige` 152–158 (V1). Die Firma (V1) bestimmt
`t4-edgar.js` (Funktion `eine()`), die Namensprobe steht in `z3.js` (`namensprobe`), die Ende-Maßnahmen je Reihe schreibt
`t4-universum.js` (`endeMassnahmen`, `rolle`), Wortlisten und Abschnittssuche stehen in `wortlaut.js` (Fassung 1 = Wortlisten des
Auftrags wörtlich). `lauf.js` fährt die Einstufung und daneben achtmal mit je einer Regel aus. `test.js`: 83 Zusicherungen, darunter
„alle acht Regeln aus = Einstufung des zweiten Laufs" und der Zeilenvergleich mit dem Original (143 neue oder geänderte Zeilen:
V1 9, V2 42, V3 13, V3b 10, V5 i 5, V5 iii 22, V7 1, V8 19, Rahmen 23; 38 Zeilen des Originals ersetzt; `fenster()`, `imFenster()`,
`ms`, `tage`, `leer`, `akz`, `emittent25` wortgleich).

## Meine Lesarten (wo der Auftrag nicht eindeutig ist — bitte prüfen)

1. **V1, „beide Auszüge".** Der Auftrag sagt zugleich „die Polygon-CIK gilt nur, wenn der Name passt" und „trägt die Firma aus der
   Suche oder der alten Tafel den Polygon-Namen, hat aber eine andere CIK, werden beide Auszüge zusammen gelesen". Bei „nichts passt"
   (fremde Firma unter der Polygon-CIK, Muster YHOO → FieldPoint) widerspricht sich das. Gelesen: **die verworfene Polygon-CIK wird
   nie mitgelesen.** Der zweite Auszug ist immer der der Firma aus der *alten Tafel*, wenn sie den Polygon-Namen trägt und eine
   andere CIK hat als die bestimmte Firma (bestandene Polygon-CIK oder Firma der Suche). Eine neue Suche gibt es bei bestandener
   Namensprobe nicht — „Firma aus der Suche" kann dort nur die der alten Tafel sein; die 54 neuen Reihen haben keine. Findet die
   Suche bei „nichts passt" gar keine Firma, die alte Tafel aber eine mit dem Polygon-Namen, gilt diese (Weg
   `alte-tafel-polygon-name`). Name und SIC der Vereinigung kommen vom ersten Auszug.
2. **V1, kein Auszug unter der Polygon-CIK** (EDGAR kennt die CIK nicht): wie „nichts passt" behandelt.
3. **V8, Regeln 0 und 1** teilen die Art `name_changes`. Gelesen: jede Regel nimmt die dem Anker nächste Umbenennung, die *ihre*
   Bedingung erfüllt (Regel 0: Nachfolger mit Q; Regel 1: Nachfolger ≠ eigenes Kürzel) — nicht „die nächste Umbenennung
   überhaupt". Tag des Satzes wie bisher (`ex_date`, sonst `process_date`, sonst `effective_date`).
4. **Regel 8** entscheidet `zwangs-delisting` / `insolvenz` weiter am 8-K 3.01 des *ganzen* Fensters („wie bisher"); V3 gilt laut
   Auftrag nur für die Regeln 9 und 11.
5. **V5 iii.** „Kein Polygon-Eintrag am Anker" = kein Eintrag *mit CIK* höchstens 45 Tage am Anker (wie R-a), auch wenn er die
   Namensprobe nicht besteht. Späterer Polygon-Eintrag = der früheste mehr als 90 Tage danach. Ende-Maßnahme = irgendeine, in der
   die Reihe abgebende Seite ist, mehr als 90 Tage danach — **ohne Obergrenze** (so steht es da; ein nach Jahren neu vergebenes
   Kürzel mit späterer Maßnahme fällt darunter, die Ausnahme des Auftrags prüft nur den Polygon-Eintrag). Die Ausnahme „Kürzel neu
   vergeben" setzt eine bestimmte Firma voraus; „Name passt" = Name oder früherer Name der Firma. Datum der Zeile: leer.
6. **V2, Zeile 4:** liegen Fusionsbeleg *und* 5.01 vor, heißt der Beleg `+prospekt`. Fusionsbeleg-Fenster am Anker (180 davor, 30
   danach), 5.01 am Tag des 3.01 (± 5 Kalendertage). `vollzug` weiter als 30 Tage vom Anker ohne Hinweis → Zeile 5 (wie die Tabelle).
7. **V3b:** *irgendein* 3.01 zwischen 550 und 181 Tagen vor dem Anker mit Klasse `ruege` (geprüft vom nächsten zum fernsten);
   Datum der Zeile = Tag des 25-NSE.
8. **V7:** „bestimmte Firma" = Firma, die die Einstufung bestätigt (starke Zuordnung oder ein Signal im Fenster), gleich über
   welchen Weg.
9. **Wortlaut-Felder der Regel 10:** Klasse des 3.01 nach V3, wenn es eines gibt, sonst leer.
10. **Eichprobe (a):** „8-K 3.01 höchstens 30 Tage am Anker" = das nach V3 nächste 3.01 liegt höchstens 30 Tage vom Anker.
11. **Texte:** je Meldung **eine** Anfrage statt zwei — die Einreichungsdatei `<Akzession>.txt`, gelesen nur bis zum Ende des ersten
    Dokuments (Hauptdokument); gespeichert nur dessen Text ohne Auszeichnung. Takt 220 ms (4,5 je Sekunde), Obergrenze 3.000 über
    alle Skripte (`edgar-anfragen.json`).
12. **Zweiter Suchdurchgang:** ein Kandidat gilt, wenn die Einstufung dieses Ordners *ohne Meldungstext* einen Grund ergibt.
13. **Bigdata-Funde vom 12.09.** bleiben wie im zweiten Lauf angerechnet (dort 1 Zeile); kein neuer Lauf (V6).
14. **Abschnittssuche (Fassung 1, vom Schreibtisch):** Überschrift = Zeilenanfang „Item N.NN" (eine Überschrift kann mehrere
    Punkte nennen); Ende = nächste Überschrift oder Unterschrift; der amtliche Titel von 3.01 („… Failure to Satisfy …; Transfer of
    Listing") wird vor der Suche entfernt, sonst wäre jeder Abschnitt Rüge und eigener Entschluss; trägt der Abschnitt weniger als
    160 Zeichen eigenen Text (gestapelte Überschriften), zählt der folgende Abschnitt mit (nie 9.01); Verweise auf einen anderen
    Punkt oder die Vorbemerkung werden mitgelesen. Wortlisten und Suche werden nach der Lernprobe **einmal** geändert (Commit 2).

## Was vor dem Zählen schon feststeht (Universum-Schritt, `z3-universum.log`)

5.050 Reihen wie im zweiten Lauf (Anker, letzter Kurs und jüngste Maßnahme bei allen gleich). Neue Polygon-Liste: **4.713** Reihen
mit Eintrag (zweiter Lauf 4.717), bei **14** ist der Eintrag ein anderer — 5 neu (APGE, CRNX, HLX, LEG, TWO), 9 entfallen, weil das
Kürzel wieder aktiv oder neu vergeben ist (AAC, AT, BCOM, CAPA, DICE, JONE, MN, OIG, PCPC). 4.039 Ende-Maßnahmen bei 2.984 Reihen
(3.380 abgebend, 659 aufnehmend, 0 fremd, 0 ohne Kennung; 3 nur im Nachtrag, 4 dort mit gleicher Kennung ersetzt).

Die Auswertung (`t4-auswerten.js`, Kopie, zählt nur) und die Nachzählung von §6 (`nachzaehlen.js`) folgen mit Commit 3.

## Nachtrag zu Commit 2 — die eine Änderung nach der Lernprobe (Fassung 2 von `wortlaut.js`, 04.10.2026)

Lernprobe: 30 Reihen der Regel 11 (505 Reihen), Saat `z3-lern`, `proben.js lern`; Auszüge in `z3-lernprobe-fassung1.txt` (vor der
Änderung) und `z3-lernprobe-fassung2.txt` / `z3-lernprobe.json` (danach). Mit Fassung 1 (Wortlisten des Auftrags wörtlich) stand die
Regel 11 bei: Rüge 274, eigener Entschluss 88, Vollzug 31, + Prospekt 19, + 5.01 5, unklar 88 (`z3-lauf-fassung1.log`).

Was die Lernprobe zeigte und was geändert wurde:

| Befund an der Lernprobe | Reihen | Änderung |
|---|---|---|
| Abschnitt nicht gefunden: „Item" und „3.01" stehen in zwei Zeilen | RBCN, BACK, YAYO, PTIX, SYRA (5 von 30) | Überschrift darf über den Zeilenwechsel gehen |
| Titel von 3.01 mit Tippfehler wird nicht entfernt und zählt als Rüge / eigener Entschluss („of Failure", „Continuing Listing", „Rule or Stand;") | ZCAR, TLR, MAMS, FULL | Titel wird mit diesen Abweichungen erkannt |
| Vollzug ohne Wort der Liste: „the Merger had closed"; „converted into the right to receive"; Abfindung über „Call Right" | CFCB, (ADGE, WNR), CVRR | Vollzug + `(merger\|acquisition\|transaction\|arrangement\|amalgamation\|business combination\|offer) (had\|has\|was\|were)? (been)? (closed\|completed)`, `converted into the right to receive`, `call right` |
| Rüge ohne Wort der Liste: „received written notice … that it would delist" | EBET | Rüge + `received … (notice\|notification\|letter\|determination\|decision) … (delist\|suspend\|cease)` **im selben Satz** (ohne diese Bindung wäre RBCN — freiwilliger Rückzug, die Börse schreibt danach wegen der Direktoren — zur Rüge geworden) |
| eigener Entschluss ohne Wort der Liste: „intends to file a Form 25", „authorized the delisting" | EQC, TLR | eigener Entschluss + `(intends?\|intention\|intent\|approved\|authorized) (to)? (voluntarily)? (delist\|the delisting\|file a form 25)` |

Die Zuordnung Klasse → Grund (Tabelle des Auftrags) ist unverändert. Offen gelassen, weil es die Tabelle trifft und nicht die
Listen: QVCGB (Rüge wegen des Mindestkurses, danach freiwilliger Rückzug mit Formular 25 des Emittenten — die Tabelle lässt die
Rüge gewinnen). Lernprobe mit Fassung 2: 30 von 30 mit Abschnitt; Rüge 15, eigener Entschluss 8, Vollzug 6, nichts 1 (FULL —
Vollzug ohne Vollzugswort, wird über Punkt 5.01 zur Übernahme). **Ab hier werden Listen und Abschnittssuche nicht mehr geändert.**
Die Prüfprobe (40 andere Reihen, Saat `z3-pruef`) und die Eichprobe werden erst nach diesem Commit gezogen und gelesen.
