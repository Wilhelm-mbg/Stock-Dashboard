# Regel des vierten Zähllaufs der Gründe-Tafel (Auftrag Nr. 92) — festgeschrieben vor dem Zählen

Stand 04.10.2026, vor dem Laden des Panels und vor jeder Einstufung. Es entsteht **keine Tafel und kein Panel**; nichts Bestehendes
wird geändert, `../zaehllauf3/` bleibt, wie es ist. Die Regeln sind die des Auftrags (§1, fest). Diese Datei hält fest, **wo** sie im
Code stehen und **wie ich sie gelesen habe**, wo der Auftrag zwei Lesarten zulässt. Die Wortlisten sind Fassung 2 des dritten Laufs
(`wortlaut.js` byte-gleich, `test.js` 9.3).

## Rangfolge — erster Treffer gewinnt (`t4-einstufen.js`, Funktion `urteil()`, Zeilen dieser Kopie)

| Nr. | Regel | Grund | Beleg | Zeilen | gegenüber Lauf 3 |
|---|---|---|---|---|---|
| Z | Zwilling im Archiv (V9: a, b, c) | `umbenennung-ticker` | `zwilling-im-archiv` (+ `zwilling`, `doppelt: true`) | 180–184 | neu, vor allem anderen |
| 0 | Umbenennung auf ein Insolvenz-Kürzel (E1: fünf Zeichen mit Q oder altes Kürzel + Q) | `insolvenz` | `q-kuerzel`, `q-kuerzel+edgar-8K-1.03` | 193–199 (Prüfung `qKuerzel` 105–109) | enger |
| 1 | Umbenennung | `umbenennung-ticker` | `alpaca-name_changes` | 200–212 | – |
| 2 | Barübernahme / Tausch + Bar | `uebernahme` | `alpaca-cash_mergers`, `alpaca-stock_and_cash_mergers` | 213–217 | – |
| 3 | Aktientausch | `fusion-aktientausch` | `alpaca-stock_mergers` | 218–221 | – |
| 4 | 8-K 1.03 im Fenster | `insolvenz` | `edgar-8K-1.03` | 222 | – |
| 5 | 8-K 2.01 ≤ 30 Tage + Fusionsbeleg | `uebernahme` | `edgar-8K-2.01+prospekt` | 225–227 | – |
| 6 | Rücknahme | `spac-ende` / `freiwillig` | `alpaca-redemptions` | 228–232 | – |
| 7 | Mantel-Name + Formular 25/15, kein 2.01 | `spac-ende` | `edgar-mantel+abmeldung` | 233–235 | unverändert |
| 8 | wertlos ausgebucht | `zwangs-delisting` / `insolvenz` | `alpaca-worthless_removals` | 236–239 | – |
| 9 | Mantel (E2: SIC 6770 **oder** Mantel-Name; roher Kurs ≥ 8,00 $, E7) mit 8-K 3.01 nach V3 (jeder Wortlaut) **oder** früher Rüge + 25-NSE ≤ 30 Tage am Anker | `spac-ende` | `edgar-mantel+8K-3.01` (+ `mantel_merkmal`, `mantel_weg`) | 241–250 | Mantel neu, zweite Bedingung neu |
| 10 | ausgesetzter Wert | `ausgesetzt` | `ausgesetzt` | 251–253 | – |
| 11 | 8-K 3.01 nach V3, nach Wortlaut; Rüge nur ≤ 30 Tage am Anker (E3); Zeile 5 → `abgemeldet-anlass-offen` (E4) | `uebernahme` / `zwangs-delisting` / `freiwillig` / `abgemeldet-anlass-offen` | `…-vollzug`, `…-ruege`, `…-eigener-entschluss`, `…+prospekt`, `…+5.01`, `edgar-8K-3.01-unklar` | 254–268 | E3, E4 |
| 12 | frühe Rüge 31–550 Tage vor dem Anker (die nächste) + 25-NSE ≤ 30 Tage am Anker (E3) | `zwangs-delisting` | `edgar-8K-3.01-ruege-frueh+25-NSE` | 269–276 (Liste `i301frueh4` in `fensterV` 88–103, `fruehRuege` 111–114) | Fenster 31 statt 181 Tage |
| 13 | Formular 25 ohne Abmelde-Meldung, nur ≤ 30 Tage am Anker (E5) | `abgemeldet-anlass-offen` | `edgar-formular25` | 277–278 | E5 |
| 14 | Formular 15 | `freiwillig` | `edgar-formular15` | 279 | – |
| 15 | nichts davon | `unbekannt` | `edgar-ohne-signal`, `massnahme-passt-nicht`, `nichts` | 280–281 | – |

Außerhalb von `urteil()`: **E6** steht in `t4-edgar.js` (`betroffen`, `e6Probe`, Durchgang 1 und 2 in `eine()`), **E7** in
`t4-universum.js` (`main`, `letzteMinute`) und `stufeEin()` (Aufschlag, Feld `letzter_kurs_roh`), **V9** (Bedingungen a, b, c) in
`zwilling.js` (`pruefe`) und `z4-panel.js` (lädt das Panel genau einmal). Jede geänderte Zeile der Kopie trägt eine Marke
(V9 E1 E2 E3 E4 E5 E7 RAHMEN4); `test.js` 9.1 hält das fest, 9.2 prüft zwölf Hilfsfunktionen auf Wortgleichheit mit dem dritten
Lauf, 8.1 prüft „alle Änderungen aus = Einstufung des dritten Laufs" an 20 Kunstfällen. `lauf.js` fährt dieselbe Gegenprobe an allen
5.050 echten Zeilen (Zuordnung des dritten Laufs, alle Änderungen aus → Grund und Beleg wie in `z3-gruende-neu.json`).

## Meine Lesarten (wo der Auftrag nicht eindeutig ist — bitte prüfen)

1. **V9 (a), „dasselbe Verhältnis Eröffnung zu Schluss".** Das Panel führt bereinigte Kurse (`bEroeffnung`, `bSchluss` = roh ÷ Faktor);
   zwei Reihen mit verschiedenen Faktoren können im letzten Bit abweichen. Gelesen: gleich bis auf 1e-9 relativ; der rohe Schluss
   muss **exakt** gleich sein. Wie viele Paare die Toleranz brauchen, steht in `z4-panel.json` (`verhNurMitToleranz`).
2. **V9, mehrere Kandidaten.** Gilt für mehrere Reihen a, b und c, ist der Zwilling die mit den meisten gleichen Tagen unter (b), dann
   dem längsten Nachlauf, dann dem Namen. Alle Kandidaten mit (a) stehen in der Arbeitsdatei.
3. **V9, welcher Panel-Abschnitt ist „die Reihe".** 149 Ordner haben im Panel v2.2 mehrere Abschnitte (Lücken-Reihen). Gelesen: der
   Abschnitt des Ordners (oder gleichen Namens), dessen letzter Tag dem Anker (letzter Minutentag) am nächsten liegt. Klasse 1–3 bleibt
   die des dritten Laufs (`phase2/t4-panelklasse.json`, letzter Abschnitt des Ordners) — sonst wären die Zahlen nicht vergleichbar.
4. **V9 (b) und (c).** „Mindestens 75 % ihrer Tage" = aufgerundet (15 von 20, 3 von 4). „Fünf Handelstage weiter" = fünf Panel-Zeilen
   des Zwillings nach dem letzten Tag der Reihe. Eine Reihe mit weniger als drei Panel-Tagen kann (a) nicht erfüllen (gezählt).
   Datum der Zeile = letzter Panel-Tag der Reihe; Quelle `panel-v22:<Zwilling>`.
5. **E6 und E2, „Polygon-Eintrag am Anker".** Der Eintrag mit CIK nach R-a (`polygonFirma`), sonst der dem Anker nächste Eintrag
   **mit Namen, auch ohne CIK**, höchstens 45 Kalendertage davor oder danach (`Z3.polygonAmAnker`). Der Wortlaut „einen
   Polygon-Eintrag" schließt die Einträge ohne CIK nicht aus; die Zahl der so zusätzlich geprüften Reihen wird gemeldet.
6. **E6, Umfang.** Neu gesucht werden nur die betroffenen Reihen (Polygon-Eintrag am Anker und Firma aus der Volltextsuche im
   dritten Lauf); für alle anderen gilt die Zuordnung des dritten Laufs. In Durchgang 2 wird ein Kandidat, der die Namensprobe nicht
   besteht, übergangen wie einer, der keinen Grund ergibt. Die Einstufung, die über Durchgang 2 entscheidet, ist die dieses Ordners
   **ohne V9** (sonst bekäme jede Zwillings-Reihe die erste Suchfirma). Weil E3/E5 die Einstufung ändern, hätte Durchgang 2 bei
   einigen nicht betroffenen Reihen anders ausgelöst — `lauf.js` zählt sie (`durchgang2Ausloeser`), neu gesucht werden sie nicht.
7. **E2, Mantel-Name.** Teilwort ohne Groß- und Kleinschreibung, wie im Auftrag (`capital corp` trifft auch Beteiligungsgesellschaften
   — gezählt, nicht ausgenommen). Die frühe Rüge der Regel 9 ist dieselbe wie in Regel 12 (31–550 Tage; mit E3 aus 181–550) und
   setzt wie Regel 12 V3b voraus. Beleg in beiden Fällen `edgar-mantel+8K-3.01`, unterschieden durch `mantel_weg`. Regel 9 verlangt
   wie bisher eine bestätigte Firma.
8. **E3.** Nur der Wortlaut `ruege` verlässt Regel 11, wenn das 3.01 mehr als 30 Tage vor dem Anker liegt; ein ferner Vollzug bleibt
   Zeile 5, ein ferner eigener Entschluss Zeile 3 (wie im dritten Lauf). Ist das nach V3 nächste 3.01 keine Rüge, entscheidet Regel 11
   mit ihm, auch wenn es davor eine Rüge gibt (`test.js` 4.5).
9. **E5.** Geprüft wird das dem Anker nächste Formular 25/25-NSE im Fenster (wie bisher `f.f25`); liegt es mehr als 30 Tage weg, gibt
   es keines näher.
10. **E7.** Roher Kurs = `rohSchluss` der letzten Zeile des Abschnitts nach Lesart 3; ohne Panel-Zeile der Schluss der letzten
    regulären Minutenkerze am oder vor dem Anker aus `E:/Markt-Dashboard-Archiv/alpaca1m/<Ordner>/<Jahr>.json` (Jahr des Ankers, sonst
    das davor; nur lesen). „Jede Kursgrenze": die 8,00 $ der Regel 9, das Kursband und der Aufschlag gegen den Barpreis nehmen den rohen
    Kurs; ohne rohen Kurs ist eine Reihe kein Mantel. `letzter_kurs_archiv` bleibt daneben stehen.
11. **Ursachen (§2 Punkt 2).** Je Zeile wird jede der sieben Änderungen einmal ausgeschaltet; „ohne E6" heißt: Firma aus der Zuordnung
    des dritten Laufs. E7 wird zur Auskunft zusätzlich ausgeschaltet (nicht unter den sieben). Ein Kipp-Fall ohne einzelne Ursache
    heißt „zusammen".
12. **Leseliste.** „Umsatz" = Median über die letzten 20 Panel-Tage von Umsatz × rohem Schluss. EDGAR-Einreichungen = die Formulare
    des Abrufs (Liste `FORMULARE` vom 12.09.: 8-K, 25, 15, Prospekte …), nicht jedes Formular. Alpaca-Maßnahmen = alle Arten aus Archiv
    und Nachtrag mit Tag höchstens 30 Tage am Anker.
13. **EDGAR.** Nur über die Kopie des Abrufs (`t4-edgar.js`, `texte.js`); Kennung per `require`, nie ausgegeben; eine Spur, 220 ms
    Abstand (4,5 je Sekunde), Obergrenze **500** über alle Skripte dieses Ordners (`edgar-anfragen.json`); Caches des dritten und
    zweiten Laufs nur lesend, Neues in `edgar/` (in `.gitignore`).
