# Kontroll-Prüfung aller drei Kanten — Befund (23.08.2026)

**Für die parallel arbeitende Sitzung.** Dieses Dokument ist eine Übergabe, kein Vortrag:
Es enthält die Zahlen, die Codestellen und die Korrekturen an bereits veröffentlichten
Werten. Wo etwas unsicher ist, steht das dabei.

Skripte im Scratchpad dieser Sitzung, nicht im Repo — sie sind Messgerüst, kein
Auslieferungsgegenstand. Die Kernrechnungen sind unten so beschrieben, dass sie sich
nachbauen lassen.

---

## 1. Worum es geht

Alle drei belegten Kanten des Projekts sind erstmals gegen eine **Kontrolle** gerechnet
worden. Die Kontrolle ist kein simulierter Kurs, sondern:

> derselbe Wert, dieselbe Tageszeit, dieselbe Haltedauer — nur an einem **anderen Tag**.
> Gemittelt über alle zulässigen Fälle, nicht als eine Ziehung.

Ohne diesen Vergleich misst man Marktdrift und nennt sie Kante. Das ist bei allen drei
Kanten in unterschiedlichem Maß passiert.

**Warum die Erwartung statt einer Ziehung:** Eine einzelne Zufallsziehung streut mit
3,84 Pp und liegt im Mittel 2,83 Pp neben der Erwartung — mehr als das gesuchte Signal
von 2,42 Pp. Wer mit einer Einmal-Ziehung kontrolliert, misst Rauschen. Genau daran ist
der erste Anlauf der Intraday-Prüfung gescheitert.

---

## 2. Ergebnisse

### 2.1 Intraday `rsi2seit` — **nicht entscheidbar**

| Haltedauer | Signal | Kontrolle | Überschuss |
|---|---:|---:|---:|
| 2 Kerzen | +0,051 | +0,010 | +0,042 |
| 8 Kerzen | +0,170 | +0,106 | **+0,065** |
| 16 Kerzen | +0,284 | +0,206 | +0,078 |
| 24 Kerzen | +0,302 | +0,309 | −0,007 |

6.509 Trades, 675 Handelstage, t über Tage geclustert.

**Rund 62 % des Rohertrags sind schlichtes Halten.** Bei 24 Kerzen verdient die
Kontrolle genauso viel wie das Signal.

### 2.2 Momentum — **nicht entscheidbar**

| Zeitraum | Überschuss je Schritt | t | MDE | n |
|---|---:|---:|---:|---:|
| Gesamt 1972–2026, netto | +1,691 Pp | 2,95 | 1,144 | 212 |
| Entdeckung 1972–2004 | +2,993 Pp | 3,51 | 1,705 | 126 |
| **Bestätigung 2005–2026, netto** | **+0,939 Pp** | **1,49** | **1,259** | **86** |

Der Bestätigungswert liegt **unter seiner eigenen Nachweisgrenze**. 95-%-Band:
−1,3 bis +9,2 Pp p. a.

Drei Zusatzbefunde:
- Ohne die **fünf besten von 86** Schritten bleibt exakt **0,00 Pp**.
- **67,8 %** des Depotertrags sind reine Poolrendite (Halten, nicht Auswählen).
- Von 108 Parameterkombinationen sind 104 positiv (breites Plateau, kein Kurvenanpassen),
  aber **keine** übersteht Bonferroni (bestes t 3,18 gegen Schwelle 3,49).
- **Rasterabhängigkeit:** Von 63 möglichen Lagen des 63-Tage-Rasters erreicht **null**
  ein t ≥ 1,96 (Median 1,15). Die gewählte Lage sitzt am günstigen Rand.
- Auch bei **null Kosten** bleibt t = 1,79 < 1,96. Das Urteil hängt nicht an der
  Kostenannahme.

### 2.3 Ergebnis-Drift — **schwach**, plus ein behobener Rückschau-Fehler

| Vergleich | Überschuss | t | MDE | n |
|---|---:|---:|---:|---:|
| Gesamtachse 1993–2025 | +6,58 Pp p. a. | 3,13 | 4,21 | 391 |
| Entdeckung 1993–2009 | +8,94 Pp p. a. | 2,51 | 7,12 | 202 |
| **Bestätigung 2010–2026** | **+4,06 Pp p. a.** | **1,92** | **4,24** | **189** |

In Fünfjahresblöcken sitzt fast alles in 1995–1999 (+18,09 Pp, t = 3,19). **Seit 2000
liegt jeder Block unter seiner MDE**, 2020–2024 exakt null.

---

## 3. Der Rückschau-Fehler in `drift.js` — behoben in `259d723`

**Das ist der einzige Punkt, der Code betraf und nicht nur Zahlen.**

`reaktionstag()` schob den Einstieg auf den Folgetag, wenn die Meldung nach
US-Börsenschluss kam (`getUTCHours() >= 20`). Richtig — setzt aber voraus, dass im
Zeitstempel eine Uhrzeit steht.

Gezählt an `store/drift_termine.json` (20.559 Termine, 189 Werte):

| Stunde UTC | Anzahl | Anteil | Bedeutung |
|---|---:|---:|---|
| 04:00 / 05:00 | 12.290 | **59,8 %** | Mitternacht New York = **keine Uhrzeit** |
| ≥ 20:00 | 3.233 | 15,7 % | Regel greift |
| 10–13 | ~4.300 | ~21 % | vorbörslich, vor Schluss öffentlich |

Bei **84,3 %** der Termine kaufte das Buch zum Schluss des Meldetags — bei den 59,8 %
ohne Uhrzeit also möglicherweise **vor** der Meldung, und sammelte den
Überraschungssprung ein.

**Behebung:** Ein Stempel ohne Uhrzeit ist kein Beleg für „vorbörslich", sondern gar
keine Information. Erkannt an 04:00/05:00 UTC **mit Minute 0**; ein Stempel mit Minuten
(05:30) gilt als echte Uhrzeit. Der vorbörsliche Fall (10–13 UTC) bleibt unverändert.

Wirkung, an echten Daten nachgemessen (Ertrag Einstiegstag → Folgetag):

| | alte Regel | nach dem Fix | n |
|---|---:|---:|---:|
| ohne Uhrzeit | +0,295 % | **+0,020 %** | 12.127 |
| mit Uhrzeit | +0,084 % | +0,084 % | 8.231 |
| **Gruppenunterschied** | **+0,211 Pp** | **−0,064 Pp** | |

**Konsequenz für ausgewiesene Zahlen:** Die Rohleistung der Ergebnis-Drift fällt laut
Messung von **14,07 auf 8,38 % p. a.** Das ist gewollt — die alte Zahl benutzte
Information, die zum Kaufzeitpunkt nicht vorlag.

Neu exportiert: `Drift.stempelBilanz(termineMap)` → `{ohneUhrzeit, mitUhrzeit, anteilOhne}`.
Eine Annahme über 60 % der Daten gehört sichtbar gemacht.

---

## 4. Korrekturen an Zahlen, die schon im Umlauf waren

**Bitte diese Werte prüfen, falls sie irgendwo übernommen wurden.**

| Zahl | war | ist | Grund |
|---|---:|---:|---|
| Intraday-Überschuss | +0,114 Pp | **+0,065 Pp** | Kontrolle zog Vergleichsfälle aus Zeiträumen heran, in denen der Detektor mangels Vorlauf gar nicht rechnen darf (Start bei Kerze 60 statt 261) |
| Intraday-Rohkante | +0,172 Pp | +0,170 Pp | tagesgeclustert nachgerechnet, praktisch unverändert |
| Momentum-Rückschlag | 5.444,8 % | **54,4 %** | **kein App-Fehler.** `momentum.js:158` gibt bereits Prozent zurück; mein Prüfskript multiplizierte ein zweites Mal |

Die erste Zeile ist die wichtige: **+0,114 stand seit dem 23.08. mittags im Regelkopf**
und ist in `9a218bf` auf +0,065 korrigiert. Zwei unabhängige Nachrechnungen kommen auf
+0,065 bzw. +0,066.

---

## 5. Was die Gegenprobe korrigiert hat

Jede Messung wurde von einem unabhängigen Durchgang mit dem Auftrag geprüft, sie zu
**widerlegen**. Das hat gewirkt:

- **Erste Runde (6 Messungen): 4 gekippt.** Nicht wegen falscher Urteile, sondern wegen
  falscher tragender Zahlen — eine faktisch ungepaarte Kontrolle (nur 0,6 % der
  Kontrollfälle gehörten zum selben Wert), ein doppelter Kostenabzug, Nächte als
  Handelstagswechsel statt Kalendernächte gezählt (Faktor 1,45).
- **Zweite Runde (4 Messungen): 2 Einstufungen korrigiert**, beide nach unten
  („widerlegt" → *unentscheidbar*, „belegt" → *schwach*).

**Ein Fund der Gegenprobe betraf meinen eigenen, bereits ausgelieferten Code:** die
Übernacht-Finanzierung zählte Handelstagswechsel statt Kalendernächte — Freitag auf
Montag war eine Nacht statt drei. Behoben in `429bb97`.

---

## 6. Was daraus für die Oberfläche folgt

Der Commit **„Belegt aus der Oberfläche"** (`a6c9f4f`) geht in die richtige Richtung.
Konkret sollte gelten:

| Kante | Auszeichnung | Zahl, die dazugehört |
|---|---|---|
| `rsi2seit` | nicht entscheidbar | +0,065 Pp Überschuss, t 1,49, MDE 0,153 |
| `kapitulation` | in Überprüfung | Signalstudie reproduziert ihn nicht |
| Momentum | nicht entscheidbar | +0,939 Pp je Schritt ab 2005, t 1,49, MDE 1,259 |
| Ergebnis-Drift | schwach | +4,06 Pp p. a. ab 2010, t 1,92, MDE 4,24 — **und die Rohleistung ist nach dem Fix niedriger** |

Bereits umgesetzt in `9a218bf`: Der Regelkopf im Strategien-Reiter liest den Belegstand
aus einer Tabelle in `depot.js` (Funktion `regelKopfAnzeigen`), und jede Regelbilanz
zeigt seit derselben Version **Ertrag, Kontrolle und Überschuss** als getrennte Spalten
(`kontrollErtrag` in `depot.js`, ab Kerze 261).

**Wichtig für die Konsistenz:** Wenn die Ergebnis-Drift-Zahlen in der Oberfläche stehen,
müssen sie nach `259d723` neu gerechnet werden. Die alten stammen aus Läufen mit dem
Rückschau-Fehler.

---

## 7. Was offen bleibt

- **Überlebensverzerrung lässt sich mit diesen Daten nicht messen.** Im Archiv liegen
  ausschließlich die 189 Werte, die es heute gibt; delistete fehlen vollständig. Alles
  dazu ist Indizienrechnung. Was sich sagen lässt: ohne die 30 größten Langfristgewinner
  fällt der Momentum-Vorsprung von 8,20 auf 3,79 Pp p. a. — aber genau dieser Effekt
  verschwindet ab 2005.
- **Auflösung, nicht Ideen, ist der Engpass.** Für Momentum bräuchte es rund die
  dreifache Zahl an Umschichtungen, um +0,94 Pp je Schritt von null zu trennen.
- **Die Spannen-Messung** (Demo-Konto, ab 24.08.) liefert den ersten echten Wert für die
  0,10-%-Kostenannahme, an der jede Hürdenzahl hängt.
- **Der Blindtest** aus `signalstudie-2026-08/HYBRID-PROTOKOLL.md` braucht Wilhelm und
  Felix, nicht eine Sitzung.

---

## 8. Methodische Punkte, die sich gelohnt haben

Für künftige Messungen in diesem Projekt:

1. **Kontrolle als Erwartung, nie als Einzelziehung.** Eine Ziehung streut mit 3,84 Pp.
2. **Die Kontrolle muss dort beginnen, wo der Detektor rechnen darf.** Start bei Kerze 60
   statt 261 verschob den Intraday-Überschuss von +0,064 auf +0,036.
3. **Haltedauer in Kerzen, nicht in Wanduhrzeit.** Zwischen der letzten Kerze eines Tages
   und der ersten des nächsten liegen 17 Stunden.
4. **Nächte in Kalendertagen, nicht in Handelstagswechseln.** Faktor 1,45.
5. **Rasterlage prüfen.** Beim Momentum erreicht keine von 63 Lagen t ≥ 1,96 — die
   gewählte sah als einzige gut aus.
6. **Bei Momentum ist die Zufallskontrolle bereits im Code:** `markt` in
   `momentum.durchlauf` ist analytisch exakt die Erwartung einer Zufallsziehung
   (größte Abweichung über 212 Schritte: 0,0). Keine zweite danebenstellen.

---

*Simulation mit virtuellem Kapital. Keine Anlageberatung.*
