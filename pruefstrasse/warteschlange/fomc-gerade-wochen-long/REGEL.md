# FOMC-Zyklus, gerade Wochen, long (Ideen-Agent, 18.10.2026 — Bewertung `zeit`)

Cieslak, Morse & Vissing-Jorgensen zeigen, dass die US-Aktienprämie seit 1994 **ganz in den geraden Wochen 0, 2, 4 und 6 der FOMC-Zykluszeit**
verdient wurde. Die Zykluszeit zählt in Handelstagen ab der letzten planmäßigen FOMC-Bekanntgabe, die ungeraden Wochen lagen bei null oder
darunter. Das ist ein Zweiwochentakt, den kein öffentlicher Termin trägt. Die Autoren deuten ihn als Prämie für Nachrichten aus der Fed über
informelle Kanäle, weil die Schwankung des Fed-Funds-Satzes in denselben Wochen ihre Spitzen hat. Vorrat Nr. 8 (`ideen-vorrat.md`); seit Nr. 118
gibt es die Bewertung `zeit`, die dort noch fehlte. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.

## Regel (Prosa)

1. **Termine:** die 87 planmäßigen FOMC-Bekanntgabetage 2016–2026, dieselbe Liste wie `vor-fomc-long` (federalreserve.gov; ohne
   außerplanmäßige Sitzungen, ohne die abgesagte vom 17./18.03.2020). Tag 0 = Bekanntgabetag.
2. **Fenster der Quelle:** Woche 0 = Tage −1 … 3, Woche 2 = 9 … 13, Woche 4 = 19 … 23, Woche 6 = 29 … 33 (Handelstage). Ein Fenster, das
   näher als Tag −6 an der **nächsten** Bekanntgabe beginnt, zählt die Quelle nicht (dort beginnt Woche −1 der nächsten Sitzung). Woche 7 und
   später lässt sie weg.
3. **Signal am Tag i (long), Einstieg zur Eröffnung des Folgetags:**
   - Woche 0: der übernächste Werktag nach `datum(i)` ist ein Bekanntgabetag. Das ist dieselbe Rechnung wie bei `vor-fomc-long`, nur mit fünf
     Tagen Haltedauer statt einem oder zwei.
   - Woche 2 / 4 / 6: die Reihe steht am **Handelstag 8 / 18 / 28 nach dem Bekanntgabetag**. Gezählt wird in Zeilen der Reihe, zurück bis zu
     der Zeile, deren Datum der letzte Listentag ist. Es werden nur Zeilen ≤ i gelesen. Fehlt der Reihe die Zeile des Bekanntgabetags, gibt es
     für diesen Zyklus kein Signal. Zusätzlich muss der Einstiegstag (nächster Werktag) mindestens **7 Werktage** vor der nächsten Bekanntgabe
     der Liste liegen. Das entspricht Regelzeile 2: Einstieg spätestens Tag −7.
4. **Ausstieg:** Eröffnung nach 5 Handelstagen (**H5**), das Wochenfenster der Quelle.
5. **Umsatzklassen 1–3**, long. Eine Konfiguration: `W0246-H5`.

## Parameter (alle aus der Quelle, nichts optimiert)

| Parameter | Wert | Fundstelle |
|---|---|---|
| Zyklusbeginn | Tag 0 = planmäßiger Bekanntgabetag; Woche 0 beginnt am Vortag | Arbeitspapier S. 4–5 („day −1 to 3“), Einleitung („starts on the day before a scheduled FOMC announcement day“) |
| gerade Wochen | 0, 2, 4, 6 = Tage −1…3, 9…13, 19…23, 29…33 | Arbeitspapier S. 5 |
| Ausschluss nahe der nächsten Sitzung | Fenster ab Tag −6 nicht gezählt | Arbeitspapier S. 5 („if a given day is day −6 or closer to the next meeting, the 5-day return starting on this day is not used“) |
| Haltedauer | 5 Handelstage | 5-Tage-Überschuss der Quelle (Abb. 1), Strategie B (Tab. 3: nur gerade Wochen im Markt) |
| Termine | 87 Bekanntgabetage 2016–2026 (`params.fomcTage`) | federalreserve.gov, übernommen aus `warteschlange/vor-fomc-long/` |
| Klassen | 1–3 | Auftragsregel 2 des Ideen-Agenten |
| Richtung | long | Quelle: Strategie B; Strategie D (zusätzlich short in ungeraden Wochen) bringt laut Quelle nichts |
| Bewertung | `zeit` | marktweite Kalenderregel (FORM.md §3) |
| Versatz | 5 Handelstage | Abschnitt „Versatz“ |

## Beleg

- **Quelle:** Cieslak, A., Morse, A. & Vissing-Jorgensen, A., „Stock Returns over the FOMC Cycle“, *Journal of Finance* 74(5) (2019) 2201–2248,
  DOI 10.1111/jofi.12818. Gelesen habe ich den Volltext des Arbeitspapiers vom 02.10.2015:
  https://www.stern.nyu.edu/sites/default/files/assets/documents/cycle_paper_cieslak_morse_vissingjorgensen.pdf (abgerufen 2026-10-18).
  Die Zahlen stammen aus dieser Fassung (1994–2013, 160 planmäßige Sitzungen, Marktrendite von Ken French):
  - 5-Tage-Überschuss über T-Bills: **Woche 0 +0,57 %, Woche 2 +0,30 %, Woche 4 +0,42 %, Woche 6 +0,61 %**. Die ungeraden Wochen liegen bei
    Woche −1 ≈ 0, Woche 1 −0,17 %, Woche 3 −0,17 % und Woche 5 −0,12 % (S. 5).
  - Tab. 1, Regression auf Tagesdaten: **+13,6 Bp je Tag** in Woche 0 und **+10 Bp je Tag** in den Wochen 2/4/6 über den ungeraden Wochen,
    beide mit 1 % signifikant. Je Fenster sind das **+0,68 Pp bzw. +0,50 Pp**.
  - Strategie B (nur gerade Wochen): Sharpe 0,8 gegen 0,4 bei Dauerhaltung. Dieselbe Rechnung nennt CXO Advisory für 1994–2015: 11,8 % gegen
    8,3 % Überschuss p. a. brutto, rund 26 Umläufe je Jahr (https://www.cxoadvisory.com/calendar-effects/hold-stocks-only-during-fomc-even-weeks,
    abgerufen 2026-10-18).
  - Das Muster ist bei Werten mit hohem Beta stärker (S. 6, CRSP-Beta-Dezile). Es zeigt sich auch in den Teilzeiträumen und in anderen Märkten.
- **Nach 2010 / außerhalb der Stichprobe:** Die JF-Fassung (2019) reicht bis 2016. Laut der Zusammenfassung im CFA Digest
  (https://rpc.cfainstitute.org/research/cfa-digest/2020/05/dig-v50-n5-2, abgerufen 2026-10-18) hält das Muster auch 2014–2016 nach dem ersten
  Entwurf. Einen Nachbau, der **2017–2022** abdeckt, habe ich nicht gefunden. Die Vor-FOMC-Drift, also der Kern von Woche 0, ist laut Kurov,
  Wolfe & Gilbert (2021) nach 2015 verschwunden (Belege in `../vor-fomc-long/REGEL.md`).
- **Regel 2 (Brutto-Beleg):** +0,50 bis +0,68 Pp je Umlauf liegt über dem Dreifachen jeder Kassa-Hürde der Klassen 1–3 (0,135 / 0,195 / 0,256 Pp).

## Wogegen geprüft (Regel 1)

- `register.json` und `erledigt/`: nur `donchian20-ausbruch-long`.
- Warteschlange: donchian20-ausbruch-long, grossanstieg-ohne-umsatz, hochvolumen-praemie, monatswende-long, umkehr-nach-vorzeichenserie und
  **vor-fomc-long**. Der nächste Verwandte ist vor-fomc-long: Er misst nur Tag −1 (H1) bzw. −1…0 (H2) gegen alle übrigen Tage. Hier geht es
  um den **Zweiwochentakt**. Drei der vier Fenster (Wochen 2/4/6, 116 von ≈ 170 Signaltagen) überschneiden sich nicht mit vor-fomc-long,
  das Woche-0-Fenster enthält dessen Fenster. Mit dem Parameter der Drift hat die Regel nichts zu tun. Sie ist die eigenständige Behauptung
  einer anderen Arbeit, und die Quelle weist die Wochen 2/4/6 getrennt von Woche 0 als signifikant aus.
- Den Teil **ohne Woche 0** habe ich als eigene Regel erwogen und verworfen: Er hält Regel 3 nicht ein (siehe unten). Er wäre im Protokoll
  auch nicht getrennt auszuweisen, weil ein Kandidat genau ein Signal hat.
- `vorrat/` (nur LIESMICH), `ideen-verworfen.md` bis zum 17.10. (Optionsverfallswoche, Makro-Bekanntgabetage, Monatswende, Vorfeiertag:
  andere Termine) und der Vorrat Nr. 1–17: Nr. 8 ist diese Regel, ihre Spalte „Stand“ war leer. `wiki/belegstand.md`: kein Eintrag zum
  FOMC-Zyklus. Der Zweig `origin/pruefstrasse-ergebnisse` fehlt.

## Machbarkeit vor der Auflösungswand (Regel 3)

- **Signaltage:** Gezählt mit `regel.js` über den Werktagskalender 2016-01-04 … 2022-12-30 (ohne Börsenfeiertage, also eine Näherung) und die
  echte Terminliste, Test Nr. 5: **55 (Woche 0) + 55 (Woche 2) + 54 (Woche 4) + 7 (Woche 6) = 171 Signaltage**. Woche 0 wie bei
  vor-fomc-long hat am Panelanfang eher 54. Je Signaltag feuern **alle ≈ 800 zulässigen Reihen** der Klassen 1–3 (vor-fomc-long gezählt:
  814 je Tag). Das ergibt ≈ 137.000 Trades, aber nur **171 Cluster**. Marktweit heißt Bewertung `zeit`, und die Auflösung hängt an den
  Signaltagen.
- **Größe gegen den zeitlichen Topf:** Der Topf einer Reihe besteht aus allen 5-Tage-Fenstern, die kein Signalfenster überschneiden, in der
  Praxis also die ungeraden Wochen und Woche −1: laut Quelle ≈ −0,17 / −0,17 / −0,12 / 0, gemittelt ≈ **−0,12 Pp**. Das Signal liegt
  gewichtet mit den Signaltagen bei (0,57·55 + 0,30·55 + 0,42·54 + 0,61·7)/171 ≈ **+0,44 Pp**. Behauptung gegen den Topf: **≈ +0,55 Pp je
  Fenster**, was zur Spanne aus Tab. 1 (+0,50 / +0,68) passt.
- **MDE80:** Die Tagesstreuung des gleichgewichteten liquiden US-Markts 2016–2022 beträgt 1,0–1,4 Pp (wie `monatswende-long`, `vor-fomc-long`),
  im 5-Tage-Fenster also σ ≈ 2,2–3,1 Pp. se = σ/√171 ≈ 0,17–0,24 Pp, also **MDE80 = 2,8016 × se ≈ 0,47–0,67 Pp** (H5; die Fenster derselben
  Reihe überschneiden sich nicht, Hansen-Hodrick ändert wenig). Die Unsicherheit des zeitlichen Topfs (≈ 1.000 Starttage je Reihe) ist klein.
- **Kriterium:** Die Behauptung von 0,55 Pp liegt im MDE80-Band (0,47–0,67), und MDE80 ≤ 2 × 0,55 = 1,10 ist erfüllt → **einstellbar**.
  Die eigene Erwartung (0 bis 0,4) liegt darunter. Ein Ausschluss der Quellengröße (obere 95-%-Grenze < 0,55) ist möglich, falls das Muster
  2016–2022 fehlt. Das Urteil wäre dann informativ.
- **Ohne Woche 0 (verworfen):** Signal (0,30·55 + 0,42·54 + 0,61·7)/116 ≈ 0,38 Pp. Der Topf enthielte dann die Woche-0-Fenster (≈ +0,16 Pp
  im Mittel der überschneidungsfreien Starttage −6 … 4), der Überschuss läge bei ≈ 0,22–0,25 Pp. Mit 116 Clustern ergibt das MDE80 ≈
  0,57–0,81 Pp > 2 × 0,25. Das ist nicht einstellbar.
- **Tor 1** (4 × projizierte Bestätigungs-MDE; 2023–2026 ≈ 95 Signaltage → MDE_B ≈ 0,63–0,90 → Tor ≈ 2,5–3,6 Pp) bleibt unerreichbar wie
  bei allen Kalenderregeln. Ein `belegt-Vorschlag` ist damit ausgeschlossen, das Urteil kann nur informativ ausfallen.

## Versatz

`versatzTage: 5` statt der Vorgabe 20. Die Regel hat eine **Periode von 10 Handelstagen** (Woche 0 → 2 → 4 → 6). Um 20 verschoben träfe jedes
Signal das übernächste eigene Fenster (Woche 0 → Woche 4, Woche 2 → Woche 6 oder die nächste Woche 0). Ein richtiges Messgerät sähe dann
denselben Effekt und hieße „Messgerät-Fehler“. Mit +5 Handelstagen landet jedes Fenster in der **folgenden ungeraden Woche** (−1 → 4,
9 → 14, 19 → 24, 29 → 34), also genau in der Gegenposition der Quelle (Woche 1/3/5, −0,12 bis −0,17 %). Die Fenster überschneiden sich
nicht mit dem eigenen Fenster (Abstand = Dauer 5). Ein Rest überschneidet sich mit dem Woche-0-Fenster der nächsten Sitzung, wenn Woche 4
oder 6 bei Tag −10 … −7 beginnt. Diesen Anteil weist das Protokoll aus. Gegen den Kalender geprüft habe ich das mit dem Werktagskalender in
`test.js` (Signale derselben Reihe ≥ 5 Handelstage auseinander, Woche-4/6-Einstieg ≤ Tag −7).

## Erwartung (vorab)

Richtung positiv. Überschuss gegen den zeitlichen Topf in liquiden Werten 2016–2022, H5: **0 bis +0,4 Pp je Fenster brutto**. Die
Quellengröße liegt bei ≈ +0,55, aber die Vor-FOMC-Drift ist nach 2015 verschwunden, für 2017–2022 gibt es keinen Nachbau, und der
Zeitraum enthält 2020 (eine Sitzung abgesagt, Zyklus Januar–April mit 63 Handelstagen). Erwartetes Urteil: **„nicht entscheidbar“**, ein
Ausschluss der Quellengröße ist möglich. Die verschobene Gegenprobe (+5, ungerade Wochen) sollte laut Quelle **negativ** sein. Ist sie so
groß wie das Signal, spricht das gegen den Zweiwochentakt.

## Abweichungen von der Quelle (begründet)

1. Fenster Eröffnung → Eröffnung statt Schluss(Vortag) → Schluss: Es fehlt die Nacht vor dem ersten Fenstertag, dazu kommt die Nacht nach dem
   letzten. Das ist die Bauform der Tag-Form.
2. Universum: liquide US-Aktien des Panels, gleichgewichtet (Klassen 1–3), statt Marktportfolio (wertgewichtet). Laut Quelle ist das Muster
   bei hohem Beta stärker, mit Streuung im selben Verhältnis.
3. Der Abstand zur nächsten Sitzung wird in Werktagen gerechnet, nicht in Handelstagen. Ein Feiertag dazwischen lässt in seltenen Fällen ein
   Fenster zu, das bei Tag −6 beginnt. Die Zykluszeit seit der letzten Sitzung zählt in Handelstagen (Zeilen der Reihe), wie die Quelle.
4. Zeitraum 2016–2022 statt 1994–2016. Die Quelle sagt nichts über die Zeit danach.
5. Bewertung gegen den zeitlichen Topf der Reihe (`zeit`, FORM.md §3) statt Regression gerade gegen ungerade. Der Topf besteht fast nur aus
   ungeraden Wochen, Unterschiede liegen in Woche −1 und den Randtagen.
