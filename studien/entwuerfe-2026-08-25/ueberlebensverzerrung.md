# Vorregistrierung: Überlebensverzerrung beziffern

Rang 2 der Struktur-Liste vom 25.08.2026. Entwurf, geschrieben VOR jeder Messung des
Endpunkts. Alle Fallzahlen in diesem Papier sind gezählt, nicht geschätzt; der Zählbefehl
steht jeweils dabei.

Stand: 2026-08-25. Verfasser: Sitzung "Rang 2".

---

## 1. Die Frage

`messmaschine.js` schreibt in JEDES Protokoll die Entscheidung E1:

> "Das Universum ist 'alles, was heute im Archiv liegt'. Das sind Überlebende […]
> Jede positive Rohrendite ist dadurch nach oben verzerrt; die Größe der Verzerrung ist
> hier NICHT gemessen."

Diese Zeile steht seit dem ersten Lauf unter jedem Befund des Projekts. Sie ist wahr und
sie ist unbeziffert. Seit dem 24.08. liegen 1.037 Kursreihen delisteter Werte auf der
Platte; `grep -rl "verschwundene\|tagesdaten" studien/` findet keinen einzigen Treffer —
kein Messcode liest sie.

**Gefragt wird:** Um wie viele Prozentpunkte je Handelstag verschiebt sich der gemessene
Überschuss einer Tagesstrategie, wenn die im Messfenster verschwundenen Werte punkt-in-Zeit
mitlaufen?

**Nicht gefragt wird:** ob eine Strategie funktioniert. Diese Messung erzeugt keine Kante
und kann keine bestätigen.

---

## 2. Datenbasis — gezählt, nicht behauptet

### 2.1 Die delisteten Reihen

`C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/massive/`

| Größe | Zahl | Herkunft der Zahl |
|---|---:|---|
| aktienartige delistete Ticker in `verschwundene.json` | 6.921 | Feld `aktienartig`, Einträge gezählt |
| davon mit Kursdatei in `tagesdaten/` | 1.037 | `readdirSync` |
| eindeutige Symbole (25 Doppeleinträge) | 6.896 | gezählt |

Format je Kursdatei: `{ sym, name, boerse, delistet, quelle, stand, series }`,
Kerze `[ms, schluss, volumen, hoch, tief]` — **fünf** Spalten, alle 1.037 Dateien.
Archivkerze dagegen: `[ms, schluss, volumen, hoch, tief, eroeffnung]` — sechs.

### 2.2 Die Verzerrung IN der Verzerrungskorrektur — der wichtigste Abschnitt

Die 1.037 sind **keine Zufallsstichprobe der 6.921**. Gezählt:

**(a) Das Zeitfenster ist zwei Jahre breit, sonst nichts.**
Früheste Kerze über alle 1.037 Dateien: **2024-08-23**. Späteste: **2026-08-21**.
Genau 500 eindeutige Handelstage. Der Abruf lief mit zwei Jahren Rückschau ab dem
Abrufdatum (`stand` = 2026-08-23). Folge:

| `bis` (Delisting-Datum) laut `verschwundene.json` | Zahl |
|---|---:|
| vor 2024-08-23 | **5.486** |
| im Fenster 2024-08-23 … 2026-08-21 | 1.221 |
| ohne Datum | 214 |

`tagesdaten-stand.json`: 1.037 `fertig`, 468 `ohneDaten`, zusammen 1.505 überhaupt
angefragt. **5.394 der 6.921 wurden nie abgefragt.** Jedes Delisting der Jahre 2004–2023
fehlt vollständig — also die Dotcom-Nachwehen, 2008/09, der SPAC-Kater 2022/23.

**(b) Auch im Fenster fehlt ein Fünftel.**
1.221 Delistings im Fenster, 988 davon mit Kursdatei = **80,9 % Abdeckung**.
Von den 233 Fehlenden wurden 93 abgefragt und kamen mit 0–19 Kerzen zurück (382 der
468 `ohneDaten` mit „0 Kerzen"). Wer bei der Quelle keine Kurse mehr hat, ist typischerweise
der ausgesetzte, der insolvente, der von der Börse geworfene Wert — also **genau der,
dessen Fehlen die Verzerrung erzeugt**. Die Lücke zeigt in dieselbe Richtung wie der
Fehler, den sie messen soll.

**(c) Der Rest sind zu 65 % Werte, die das Archiv nie enthielt.**
Median-Dollarvolumen je Reihe:

| | Delistete (1.037) | Überlebende `archiv1d` im selben Fenster (2.965) |
|---|---:|---:|
| Median | **235.919 $** | **49.662.000 $** |
| 10 %-Quantil | 10.005 $ | 9.306.154 $ |
| 1 %-Quantil | — | 3.447.123 $ |
| Anteil unter 1 Mio $ | **65,4 %** | 0,2 % |
| Anteil Kurs unter 5 $ | 39,2 % | 3,1 % |

Faktor 210 im Median. Die 1.037 sind zu zwei Dritteln Nebenwerte, die im Kursarchiv
nie standen — sie „ergänzen" das Universum nicht, sie **erweitern** es. Das ist derselbe
Fehler wie am 23.08. bei den 66 CFD-Reihen: der Schaden lag nicht an der Naht, sondern
an Reihen, die der Liquiditätsfilter ohnehin ausgeworfen hätte.

**Konsequenz für den Entwurf:** Die delisteten Reihen werden auf denselben Liquiditäts-
boden gestellt, den die Überlebenden faktisch haben — **Median-Dollarvolumen ≥ 3.447.123 $
(das 1 %-Quantil der Überlebenden im selben Fenster)**. Diese Schwelle wird HIER
festgeschrieben und nicht mehr angefasst.

### 2.3 Das Universum, das wirklich gemessen wird

Filterkette, in dieser Reihenfolge, auf beide Seiten gleich:

1. Kalenderfenster 2024-08-23 … 2026-08-21 (die Überlebenden werden physisch darauf
   gestutzt — sonst vergleicht man 40 Jahre gegen 2)
2. Wertpapierart CS oder ADRC aus `wertpapierarten.json` (wie `strategien/wertpapierart.js`)
3. `reiheKaputt` unverändert aus `messmaschine.js`
4. Delistete zusätzlich: Median-Dollarvolumen ≥ 3.447.123 $, und nicht bereits im Archiv

Gezähltes Ergebnis (Fenster ab 2024-08-23, Vorlauf 21 Kerzen, Haltedauer 5):

| | Reihen | Namenstage mit möglichem Einstieg |
|---|---:|---:|
| Überlebende, gestutzt | **2.242** | **1.062.522** |
| Delistete, gefiltert | **257** | **65.194** |
| **Gewicht der Delisteten** | 10,3 % | **5,78 %** |

Von 1.037 bleiben 257. Die Aussonderung im Einzelnen: 4 stehen bereits im Archiv
(AVB, EQR, LBRDA, LBRDK — AVB und EQR sind offensichtliche Fehleinträge der Delisting-
Liste), 770 fallen am Liquiditätsboden, 3 an `reiheKaputt` (EQC −93 % an einem Tag,
**MULN mit 21.756.000 $ je Aktie** — ein F1-Treffer wie WHLR, den der bestehende Filter
von allein fängt), 3 sind für Vorlauf plus Haltedauer zu kurz. 0 fallen an der
Wertpapierart (fast alle CS, 9 ADRC).

Nutzbare Handelstage mit mindestens einem delisteten Kandidaten: **470**
(2024-09-24 … 2026-08-10), Median **149** delistete Kandidaten je Tag, Maximum 237.

### 2.4 Datenhygiene — geprüft

Geprüft an den 260 Reihen, die Wertpapierart, Liquiditätsboden und `reiheKaputt`
passieren (ohne die Längenbedingung, also drei mehr als die 257 des Messuniversums):

* nicht monotone Zeitstempel: **0**
* doppelte Zeitstempel: **0**
* Kerzen an Tagen, die der Referenzkalender (AAPL, 501 Tage im Fenster) nicht kennt: **0**
* Kerzen mit Volumen 0: **0**
* Reihen mit fehlenden Handelstagen innerhalb ihrer eigenen Spanne: **2** (CCIR 6, GSRT 4)

Zusammen 71.953 Kerzen. Kein Grund, an den Reihen selbst zu zweifeln.

### 2.5 Was die delisteten Werte tatsächlich sind — und warum das die Erwartung dreht

Gemustert an den 250 Reihen, die zusätzlich ab dem 2024-09-24 lang genug sind.
Rückgang des letzten Kurses gegen den Höchstkurs derselben Reihe im Fenster:

| p10 | Median | p90 | Anteil unter −50 % |
|---:|---:|---:|---:|
| −37,9 % | **−6,3 %** | 0,0 % | **6,8 %** |

Letzter Kurs unter 1 $: **3 von 250**. Namensmuster „Acquisition"/„Blank Check": **2 von 250**
(vor dem Liquiditätsfilter waren es 114 von 1.037 — die SPACs sitzen fast vollständig
im ausgefilterten Teil).

**Das ist der wichtigste Einzelbefund dieses Entwurfs.** Ein liquider US-Wert, der
verschwindet, verschwindet in der Regel nach OBEN oder seitwärts: er wird übernommen,
und die Prämie steht am letzten Handelstag schon im Kurs. Die Vorstellung
„Delisting = Totalverlust" gilt für den illiquiden Schwanz — und den hat das Kursarchiv
nie enthalten. Die Überlebensverzerrung des Archivs ist deshalb NICHT automatisch
positiv; ihr Vorzeichen ist offen und muss gemessen werden.

---

## 3. Die zentrale Designfrage: wie endet eine Position, die mitten in der Haltedauer verschwindet?

### 3.1 Der Befund im Code

`messmaschine.js`, Signalschleife und `baueKontrolle` laufen beide

```
for (var i = vorlauf; i < b.length - H; i++)
```

Die letzten H Kerzen einer Reihe sind **nie** Signalkerzen. Fügt man eine delistete Reihe
unverändert ein, dann steigt die Maschine in das Delisting **strukturell nie ein**. Man
hätte die delisteten Werte im Universum und trotzdem keine einzige Position, die stirbt —
die Korrektur würde genau den Teil auslassen, wegen dessen sie gebaut wurde.

### 3.2 Die Entscheidung: K1 messen, K2 rechnen

Die Verzerrung wird in zwei Anteile zerlegt, weil das Archiv den einen hergibt und den
anderen nicht:

**K1 — der Pfadanteil (WIRD GEMESSEN).**
Alle Kerzen bis zum letzten echten Handelstag. Das ist der monatelange Weg eines Werts,
der auf sein Ende zuläuft: der Absturz vor der Insolvenz ebenso wie der Sprung am Tag
der Übernahmemeldung. Er steht vollständig in den Daten. Positionen werden nur dort
eröffnet, wo H echte Kerzen folgen — die Schleifengrenze bleibt **unverändert**.

**K2 — der Schlussanteil (WIRD NICHT GEMESSEN, SONDERN BESCHRÄNKT).**
Die Rendite vom letzten Kurs bis zur Abfindung. Sie steht in KEINER Datei auf dieser
Platte. Sie wird nicht geschätzt, nicht geraten und nicht durch eine Literaturzahl
ersetzt, die ich nicht nachgeprüft habe. Sie wird als **Szenarienleiter** ausgewiesen,
mit einer Rechnung aus gezählten Größen.

**Verworfene Alternative — und warum.** Naheliegend wäre, jede delistete Reihe um H
synthetische Kerzen zum Abfindungskurs zu verlängern, damit die Schleife die
Sterbepositionen eröffnet. Das wurde geprüft und **verworfen**: `baueKontrolle` läuft über
dieselbe Schleifengrenze und nähme bis zu H Kontrolleinträge mit der Schlussrendite in
den Topf desselben Symbols auf. Bei t = −30 % und einem Topf von rund 235 Einträgen
verschiebt das den Kontrollmittelwert um −0,64 Pp (nach der 1-%-Stutzung noch ≈ −0,38 Pp)
und **hebt damit den Überschuss JEDES anderen Signals auf diesem Symbol an** — bei einem
Gewicht von 5,78 % rund +0,02 Pp auf das Tagesmittel, also in der Größenordnung der MDE
dieser Studie. Ein Artefakt aus der A-Familie, das genau wie ein Befund aussähe.
Synthetische Kerzen kämen nur mit einer zweiten Maschinenänderung in Frage
(Kontrolle bei der echten Länge abschneiden); der Aufwand steht nicht dafür, weil K2
analytisch exakt aus gezählten Größen folgt.

### 3.3 K2, die Rechnung

Das **Endfenster** sind die letzten H Kerzen jeder delisteten Reihe: die Einstiege, deren
Position das Delisting erlebt hätte. Gezählt: **1.285** Endfenster-Einstiege
(257 Reihen × 5) von 1.127.716 Namenstagen insgesamt = **0,1139 %**, also **1 von 878**.

Beitrag zum Mittel je Signal, wenn im Endfenster mit dem Faktor m gegenüber dem
Normalfall gefeuert wird (m wird im Lauf GEZÄHLT und berichtet, nicht angenommen):

| Schlussrendite t | m = 1 | m = 2 | m = 4 |
|---|---:|---:|---:|
| 0 % (Barabfindung zum Kurs) | 0,000 Pp | 0,000 Pp | 0,000 Pp |
| −10 % | −0,011 Pp | −0,023 Pp | −0,046 Pp |
| −30 % | −0,034 Pp | −0,068 Pp | −0,136 Pp |
| −55 % | −0,063 Pp | −0,125 Pp | −0,250 Pp |
| −100 % (Totalverlust) | **−0,114 Pp** | −0,228 Pp | −0,454 Pp |

Formel: `Beitrag = wE·m/(1 + wE·(m−1)) · t` mit wE = 0,001139.

Lesart: Selbst der Totalverlust ALLER 257 Werte bewegt das Mittel je Signal um −0,114 Pp,
also knapp über die Kostenhürde von 0,10 Pp — und das ist die absolute Obergrenze, die
laut Abschnitt 2.5 für höchstens 3 von 250 gemusterten Reihen überhaupt zutrifft. Bei der
für liquide Übernahmen plausiblen Barabfindung zum Kurs ist K2 exakt null.

---

## 4. Der fehlende Eröffnungskurs (C7)

Die delisteten Kerzen haben fünf Spalten. `eroeffnungKurs(bars, k)` fällt dann auf den
Schluss der Vorkerze zurück. Folgen, jede einzeln behandelt:

1. **Der Endpunkt ist nicht betroffen** — sofern die Sonde keine Ausstiegsregel hat.
   Ohne `stopNiveau` benutzt die Renditerechnung ausschließlich Schlusskurse
   (`s0 = b[i][1]`, `sH = b[i+H][1]`). **Auflage: keine der Sonden definiert `stopNiveau`.**
   Andernfalls bekäme die delistete Seite genäherte Füllpreise und die überlebende echte —
   und die gemessene Differenz enthielte die Füllnäherung statt der Überlebensverzerrung.
2. **Die S9-Lückenzahl wird auf der delisteten Seite exakt null**, per Konstruktion:
   `eroeffnungKurs(b, i+1)` liefert `b[i][1]`, also `o/c − 1 = 0`. Sie wird **je Seite
   getrennt** ausgewiesen und **nicht** zwischen den Läufen verglichen.
3. **Der C7-Anteil im Protokoll fällt von 100 % auf 94,0 %** (gezählt: 1.120.814 Kerzen
   der Überlebenden mit Eröffnungskurs gegen 71.635 delistete Kerzen ohne). Die Maschine
   wird deshalb im „mit"-Lauf C7 warnen und die Warnung ins Protokoll schreiben. Das ist
   erwartet und richtig; sie wird **nicht** abgestellt und im Bericht ausdrücklich genannt.

---

## 5. Das Messinstrument — welche bestehende Strategie? Antwort: keine

Der Auftrag lautete, eine bestehende Strategie mit und ohne delistete zu messen. Gezählt
ergibt sich, dass **keine der elf vorregistrierten Strategien das trägt**:

| Strategie | Zeitrahmen | H | warum nicht |
|---|---|---:|---|
| rsi2seit, rsi2seit-mcp | 60m | 8 | **es gibt kein 60m-Archiv der Delisteten.** `massive/` enthält nur `tagesdaten/`, Quelle `/v2/aggs 1/day` |
| kapitulation | 60m | 26 | dito |
| winkelgrad, winkelbestaetigt | 60m | 8 | dito |
| t1, t2, t3 | 60m | 1–8 | dito |
| monatswende-breit | 1d | 5 | feuert nur am Monatswechsel: rund **24 Signaltage** im 500-Tage-Fenster, Maschinenminimum ist 30 → „nicht-messbar" |
| quartalsschub-betrag | 1d | 5 | braucht Ertragstermine; `drift_termine.json` führt 189 Symbole, für delistete Werte keinen einzigen |
| momentum | 1d | 63 | H = 63 lässt bei Vorlauf 261 noch **113** delistete Reihen auf **172** Tagen; Newey-West mit 62 Lags auf einer 86-Tage-Bestätigungshälfte ist kein Standardfehler mehr |

**Das ist selbst ein Befund und gehört so berichtet: die beiden Strategien, an denen das
Projekt hängt (rsi2seit und kapitulation, die „komplementären Kanten" der Regime-Zuteilung),
lassen sich mit den vorhandenen Daten auf Überlebensverzerrung überhaupt nicht prüfen.**

Gemessen wird deshalb mit **drei eigens gebauten Tagessonden**, die den Belastungsbereich
aufspannen. Sie sind keine Handelsvorschläge; ihr einziger Zweck ist, die Verzerrung
sichtbar zu machen.

| Sonde | Regel (long, H = 5, kein Stop) | Leserfenster | erwartete Feuerrate |
|---|---|---:|---:|
| **P1 breit** | feuert auf jeder zulässigen Kerze | 1 | 100 % |
| **P2 rutsch** | 5-Tage-Rendite ≤ −10 % | 6 | ≈ 3 % |
| **P3 stärke** | 60-Tage-Rendite im obersten Zehntel der eigenen Historie | 61 | ≈ 10 % |

* **P1** misst die Verzerrung des UNIVERSUMS, unabhängig von jedem Detektor. Das ist die
  saubere, allgemeinste Antwort auf die gestellte Frage und die mit der größten Auflösung.
* **P2** ist der 1d-Zwilling der Dip-Familie (rsi2seit, kapitulation). Wer in den fallenden
  Wert kauft, kauft am ehesten den, der gleich verschwindet — das ist der Kanal, über den
  Überlebensverzerrung einer Strategie am meisten schadet. Der Befund an P2 überträgt sich
  auf rsi2seit/kapitulation **per Argument, nicht per Messung**; das steht in Abschnitt 10.
* **P3** ist der Gegenpol: wer Stärke kauft, kauft am ehesten das Übernahmeziel nach der
  Meldung. Hier ist ein Vorzeichen in die andere Richtung zu erwarten.

**Vorlauf.** Alle drei Sonden lesen höchstens 61 Kerzen zurück. Der Maschinenvorlauf von
261 Kerzen (`VERFAHREN.mindestKerzenVorlauf`) würde einer delisteten Reihe von 500 Kerzen
mehr als die Hälfte wegnehmen: mit 261 bleiben **142** Reihen auf **230** Tagen, mit 21
bleiben **257** Reihen auf **470** Tagen. Der Vorlauf wird deshalb für diese Studie auf
**21** gesetzt — **für beide Seiten gleich**, als **deklarierte Abweichung** (Abschnitt 9,
Auflage 2). Für die Überlebenden ändert das nichts (sie haben Jahrzehnte Vorlauf); es
verdoppelt allein die nutzbare Menge der Delisteten.

---

## 6. Vorab-Einteilungen

**Fenster.** 2024-08-23 … 2026-08-21, 501 Handelstage (Referenz AAPL). Beide Archive
physisch darauf gestutzt.

**Entdeckung / Bestätigung.** Der B5-Schnitt der Maschine, unverändert: erste Hälfte der
Handelstage Entdeckung, zweite Bestätigung. Bei 501 Tagen fällt der Schnitt auf Index 250,
also rund **2025-08-20**. Bestätigung ≈ **251** Tage, davon tragen rund 245 delistete
Signale (die Delisteten setzen mit dem Vorlauf am 2024-09-23 ein und enden für H = 5 am
2026-08-10).

**Was die Entdeckungshälfte liefert und was nicht.** Sie liefert genau eine Zahl:
die Streuung `sd_NW(d_t)` der Paardifferenz, und daraus MDE und delta80 der
Bestätigungshälfte. Sie liefert **kein** Vorzeichen und **keine** Kalibrierung; nach ihrem
Blick wird **nichts** an Sonden, Filtern oder Schwellen geändert.

**Zwei Archive, sonst identisch:**

* `archiv-fenster-ohne/` — 2.242 Reihen Überlebende, `bars_1d_<SYM>.json`
* `archiv-fenster-mit/`  — dieselben 2.242 **plus** 257 delistete, Format 1:1 übernommen
  (fünf Spalten bleiben fünf Spalten)

Die Symbolliste beider Archive wird **vor dem ersten Lauf** als `universum-fest.json`
festgeschrieben und im Protokoll mitgeführt. Nachträgliche Ausschlüsse sind damit
sichtbar unmöglich.

---

## 7. Endpunkte

### 7.1 Primär: die gepaarte Tagesdifferenz (K1)

Für jeden Bestätigungstag t:

```
d_t = D_t(mit) − D_t(ohne)
```

mit `D_t` = Tagesmittel des A7-Überschusses derselben Sonde, wie die Maschine ihn heute
schon rechnet (Kontrolle je Symbol × Sitzungsposition × Hälfte, Lesefenster
`[i−lese−H, i+H−1]` ausgenommen).

**Warum gepaart.** `D_t(mit)` und `D_t(ohne)` teilen alle Signale der Überlebenden. Der
gemeinsame Marktzug kürzt sich exakt heraus:
`d_t = w_t · (m_d,t − m_s,t)`. Ein ungepaarter Vergleich zweier Läufe hätte die Streuung
des Tagesmittels selbst (2,2–2,8 Pp, gemessen) im Nenner und wäre um den Faktor 30
unschärfer. Die Paarung ist nicht Bequemlichkeit, sondern die einzige Bauform, in der
diese Frage mit 251 Tagen überhaupt beantwortbar ist.

**Teststatistik.** Mittel von `d_t` über die Bestätigungstage, Standardfehler
Newey-West mit H−1 = 4 Lags (B10), wie in `statistik()`.

### 7.2 Sekundär (berichtet, nicht urteilsbildend)

* dasselbe je Signal statt je Tag (B2)
* dieselbe Differenz gegen die **Querschnittskontrolle** statt gegen A7 — sie zeigt den
  zweiten Kanal: 257 zusätzliche Werte verschieben auch den marktneutralen Vergleichstopf
* Rohrenditedifferenz ohne Kontrolle — die Zahl, die man naiv „Überlebensverzerrung" nennt
* K2-Tabelle aus Abschnitt 3.3, mit **gezähltem** m (Feuerrate im Endfenster gegen die
  Gesamtfeuerrate derselben Sonde)
* Zahl der Signale, Tage und delisteten Werte je Hälfte

---

## 8. Erwartete MDE und delta80 — mit Rechnung, vor der Entscheidungsregel

### 8.1 Woher die Streuung kommt

`sd_NW(d_t)` wurde als **Planungsgröße** direkt aus den Kursen gerechnet: tägliches
Querschnittsmittel der 5-Tage-Rendite des delisteten Korbs gegen den der Überlebenden,
gewichtet mit `w_t`, Newey-West mit 4 Lags. Drei Feuerraten, per festem
Pseudozufallsgenerator ausgedünnt:

| Feuerrate | gemessenes w | sd_NW(d_t) | NW-Faktor |
|---|---:|---:|---:|
| 100 % (alle Kerzen) | 4,30 % | 0,0737 Pp | 1,82 |
| 10 % | 4,81 % | 0,1266 Pp | 1,11 |
| 3 % | 5,88 % | 0,2660 Pp | 1,08 |

Zum Vergleich: das Tagesmittel der Überlebenden allein streut mit **2,2 Pp** (NW 4,0) —
die Paarung nimmt zwei Größenordnungen heraus. Die Zahl 2,2 deckt sich mit der aus
`monatswende-breit-2026-08-25.json` zurückgerechneten Streuung von 2,81 Pp
(se 0,1812 Pp × √241) und mit den 2,8 Pp der Auflösungswand-Rechnung vom 25.08.

**Deklaration:** Diese Planungsrechnung lief über das ganze Fenster, nicht nur über die
Entdeckungshälfte, und sie hat auch einen Mittelwert erzeugt. Der Mittelwert wurde
**nicht** verwendet, wird hier **nicht** genannt und geht **nicht** als Vorwissen in die
Studie ein — die Größe ist ohnehin eine andere (unbedingte Korbdifferenz statt
Sondenüberschuss). Verwendet wurde ausschließlich die Streuung.

### 8.2 Die Rechnung

Auf das endgültige Gewicht w = 5,78 % skaliert (Faktor w_ziel/w_gemessen je Zeile),
T = 251 Bestätigungstage, Schwelle für 3 Tests (Bonferroni, α = 0,05 zweiseitig):
|t| ≥ **2,394**, delta80-Faktor (2,394 + 0,8416) = **3,236**.

```
se      = sd_NW / √T
MDE     = 2 · se
delta80 = 3,236 · se
```

| Sonde (erwartete Rate) | sd_NW | se | **MDE** | **delta80** |
|---|---:|---:|---:|---:|
| P1 breit (100 %) | 0,0991 Pp | 0,0063 Pp | **0,0125 Pp** | **0,0202 Pp** |
| P3 stärke (10 %) | 0,1521 Pp | 0,0096 Pp | **0,0192 Pp** | **0,0311 Pp** |
| P2 rutsch (3 %) | 0,2615 Pp | 0,0165 Pp | **0,0330 Pp** | **0,0534 Pp** |

### 8.3 Die Tore

**S5 (delta80 unter der Produkthürde).** Produkthürde = **0,10 Pp** (Kostenannahme
0,10 %, am 25.08. mit 0,104 gemessen bestätigt). Alle drei delta80 liegen bei 0,020 bis
0,053 Pp, also mit Faktor 1,9 bis 5 darunter. **S5 ist bestanden.** Dieser Lauf ist nicht
blind — er ist die erste Messung dieses Projekts, deren Auflösung mit Reserve reicht,
und zwar allein wegen der Paarung.

**S4 (Entdeckung ≥ 4 × Bestätigungs-MDE) wird ERSETZT — deklarierte Abweichung.**
S4 ist ein Tor für die Kantensuche: es verhindert, dass eine Bestätigungshälfte für einen
Kandidaten verbraucht wird, der schon in der Entdeckung zu klein war. Hier ist ein Effekt
nahe null die **erwünschte** Antwort — S4 würde die Studie genau dann abwürgen, wenn sie
ihr Ergebnis liefert. An seine Stelle tritt

> **S4′:** Die Bestätigungshälfte wird geöffnet, sobald aus der Entdeckungshälfte
> `sd_NW(d_t)` je Sonde vorliegt, daraus MDE und delta80 der Bestätigungshälfte gerechnet
> und **schriftlich abgelegt** sind, und delta80 unter 0,10 Pp liegt. Liegt delta80 einer
> Sonde darüber, wird **diese Sonde** nicht bestätigt und als „blind" berichtet.

---

## 9. Entscheidungsregel — VORAB, wörtlich

Sei B = Mittel von d_t über die Bestätigungstage, se der Newey-West-Standardfehler
(4 Lags), MDE = 2·se, Schwelle = 2,394 (3 Tests), Hürde = 0,10 Pp.

Je Sonde, in dieser Reihenfolge geprüft, erste zutreffende Zeile gilt:

1. **Wenn** der Placebo-Wächter (Auflage 4) anschlägt, **dann** lautet das Urteil für alle
   drei Sonden **„ungültig — Maschine auf diesen Daten nicht bei null"**, und es wird keine
   Zahl über die Verzerrung berichtet.
2. **Wenn** die Bestätigungshälfte weniger als 30 Tage mit Signal hat oder se nicht
   berechenbar ist, **dann** „nicht-messbar".
3. **Wenn** delta80 > 0,10 Pp, **dann** „blind — diese Sonde konnte die Frage nicht
   beantworten", unabhängig vom Ergebnis.
4. **Wenn** |B| ≥ MDE **und** |B/se| ≥ 2,394, **dann** **„Verzerrung belegt"**, mit
   Vorzeichen und Größe. Zusatz: liegt |B| ≥ 0,10 Pp, dann **„Verzerrung belegt und über
   der Produkthürde"** — in diesem Fall ist jede bisherige Messung des Projekts um
   mindestens diesen Betrag falsch und der Belegstand aller Strategien wird neu bewertet.
5. **Wenn** das 95-%-Intervall B ± 1,96·se **vollständig** innerhalb ±0,10 Pp liegt,
   **dann** **„Verzerrung belegt klein: der Pfadanteil liegt unter der Produkthürde"**.
   (Äquivalenzurteil. Es kann gleichzeitig mit Zeile 4 zutreffen — dann gilt „belegt, aber
   unter der Hürde", der praktisch wichtigste Ausgang.)
6. **Sonst** „nicht entscheidbar" — das Intervall reicht über die Hürde hinaus und der
   Punktschätzer bleibt unter der MDE. Das heißt NICHT „keine Verzerrung".

**K2 bekommt kein Urteil.** Die Szenarientabelle aus 3.3 wird berichtet, mit gezähltem m
und mit dem Satz: „t ist nicht gemessen. Ein Beleg dafür wäre EDGAR (8-K Item 2.01,
DEFM14A) für alle 257 Werte und ist nicht Teil dieser Studie."

**Zusammenfassendes Urteil über die Studie** = das schlechteste Urteil von P1 (die Sonde
mit der größten Auflösung); P2 und P3 werden einzeln berichtet.

**Testzahl: 3.** Drei Sonden, je eine Variante, keine Parameterfamilie. Die Schwelle
rechnet mit 3 (|t| ≥ 2,394). Der Placebo-Wächter zählt nicht mit: er kann ein Urteil nur
zerstören, nie erzeugen. Die sekundären Endpunkte aus 7.2 zählen nicht mit: sie sind
Beschreibung und tragen kein Urteil. Sollte im Lauf eine vierte Sonde nötig werden, ist
die Studie neu vorzuregistrieren.

---

## 10. Auflagen

1. **`optionen.tagesreihe`** — additive Änderung an `messmaschine.js`: gibt je Hälfte die
   Tagesreihe `{tag, mittel, n}` des Überschusses zurück. Ohne die Option ändert sich
   nichts. Test in `test-messmaschine.js`: (a) ohne Option ist das Protokoll
   byteweise wie bisher; (b) das Mittel der zurückgegebenen Tagesreihe ist identisch mit
   `bestaetigung.ueberschuss.tagesmittel`.
2. **Vorlauf 21** — als Option, nicht als Änderung an `VERFAHREN.mindestKerzenVorlauf`.
   Der Wert steht im Protokoll. Test: ein Lauf mit Option 261 liefert dasselbe wie ohne
   Option. Beide Läufe (mit/ohne delistete) benutzen denselben Wert; ein Lauf mit
   verschiedenen Vorläufen ist ein Programmfehler und wird von der Auswertung verweigert.
3. **Kein `stopNiveau`** in keiner Sonde (Abschnitt 4).
4. **Placebo-Wächter.** Die Maschine fährt den Placebo je Hälfte ohnehin mit. Zusätzlich
   wird die **Placebo-Paardifferenz** gebildet, exakt wie d_t. Der Placebo hat keinen
   Kursbezug; seine Verzerrungsdifferenz muss null sein. **Regel: übersteigt |B_placebo|
   die MDE des Placebos, ist die Auswertung ungültig** (Zeile 1 der Entscheidungsregel) —
   dann stimmt etwas an Kontrolltopf, Fensterstutzung oder Symbolzuordnung nicht. Dieser
   Wächter ist der Grund, warum der ganze Aufbau überhaupt vertrauenswürdig sein kann.
5. **Universumsliste vorab festschreiben** (`universum-fest.json`, Abschnitt 6).
6. **Zählungen, die im Protokoll stehen müssen**, ob sie gefallen oder nicht: Reihen und
   Namenstage je Seite; Signale je Seite und Hälfte; m (Feuerrate im Endfenster gegen
   Gesamtrate); Zahl der Signale ohne Kontrolle; C7-Anteil je Lauf; S9-Lücke je Lauf.
7. **Ergebnis sofort auf die Platte**, nach
   `studien/ueberlebensverzerrung-2026-08/`, Code und Protokolle als Dateien — nicht als
   Agentenbericht (Regel vom 25.08.).
8. **Abweichungen deklarieren.** In diesem Papier bereits deklariert: S4 → S4′ (8.3);
   Vorlauf 21 statt 261 (5); Planungsstreuung über das ganze Fenster statt nur die
   Entdeckungshälfte (8.1); Liquiditätsboden als zusätzlicher, in der Maschine nicht
   vorgesehener Filter (2.2).

---

## 11. Was diese Messung NICHT sagen darf

1. **Nicht: „Die Überlebensverzerrung des Projekts beträgt X Pp."**
   Gemessen wird ein **Zeitfenster von zwei Jahren** (2024-08 bis 2026-08). Die
   Bestätigungshälfte der Messmaschine auf `archiv1d` reicht von 2006-08-14 bis heute —
   rund **20 Jahre**. Diese Studie deckt **10 %** davon ab, und zwar das Ende, in dem die
   Delistings von Übernahmen dominiert werden. Für 2008/09, wo Delisting Insolvenz hieß,
   sagt sie **nichts**. Der Satz muss lauten: „Im Fenster 2024-08 bis 2026-08 beträgt der
   Pfadanteil X Pp." Eine Übertragung auf 2006–2024 ist eine **Annahme**, keine Messung.

2. **Nicht: „Delistete Werte sind jetzt berücksichtigt."**
   Gemessen werden **257 von 6.921** aktienartigen delisteten Tickern = **3,7 %**. Von den
   1.221 Delistings im Fenster fehlen 233 (19,1 %), und zwar überproportional die ohne
   Kurse — die ausgesetzten und insolventen. Die Korrektur ist selbst
   überlebensverzerrt, in dieselbe Richtung.

3. **Nicht: „Die Verzerrung ist klein, also ist Momentum/rsi2seit/… doch belegt."**
   Der Belegstand bleibt **NULL belegte Kanten**. Eine kleine Verzerrung räumt einen
   Einwand aus; sie erzeugt keinen Beleg. Und sie ist an drei Sonden gemessen, nicht an
   diesen Strategien.

4. **Nicht: „Auch rsi2seit und kapitulation sind sauber."**
   Für 60m gibt es **keine einzige** delistete Reihe. P2 ist der 1d-Zwilling der
   Dip-Familie; die Übertragung auf 8-Kerzen-Haltedauern im Stundenraster ist ein
   **Argument**, keine Messung, und muss überall so benannt werden.

5. **Nicht: „K2 ist null."**
   K2 ist **nicht gemessen**. Berichtet wird eine Schranke unter deklarierten Szenarien.
   Dass die liquiden Delistings dieses Fensters überwiegend Übernahmen sind
   (Median-Rückgang −6,3 %, nur 6,8 % unter −50 %), macht t ≈ 0 plausibel — plausibel ist
   kein Beleg. Der Beleg wären 257 EDGAR-Nachschläge.

6. **Nicht: „Das Universum ist repräsentativ."**
   Der Liquiditätsboden von 3,45 Mio $ ist eine **Setzung**, die aus dem 1-%-Quantil der
   Überlebenden abgeleitet ist. Sie ist notwendig (sonst misst man das Hinzufügen von
   Nebenwerten statt das Fehlen von Verschwundenen) und sie ist willkürlich in der Höhe.
   Ein Empfindlichkeitslauf mit 1 Mio $ (355 statt 263 Reihen) wird **berichtet**, aber
   er trägt **kein** Urteil — sonst wäre die Schwelle ein verdeckter Mehrfachtest (B9).

7. **Nicht: „Eine Handelsentscheidung."**
   Dies ist eine Simulation mit virtuellem Kapital und keine Anlageberatung.

---

## 12. Bezug zum Fehlerkatalog

| Fehlertyp | wie er hier verhindert wird |
|---|---|
| A6/A7 | Kontrolle unverändert aus der Maschine, `leseFensterKerzen` je Sonde gesetzt |
| A9 | beide Läufe über **dieselben** Kalendertage; Archive auf dasselbe Fenster gestutzt |
| B9 | eine Variante je Sonde; der Liquiditäts-Empfindlichkeitslauf trägt kein Urteil |
| B10 | Newey-West mit 4 Lags, in `statistik()` schon vorhanden |
| C7 | kein `stopNiveau`; Eröffnungskurs geht in den Endpunkt nicht ein (Abschnitt 4) |
| F1 | `reiheKaputt` unverändert; hat MULN (21,8 Mio $/Aktie) und EQC schon gefangen |
| F2 | Kontrollausschnitt `[i−lese−H, i+H−1]` unverändert |
| F3 | 1d, Sitzungsposition konstant 0 — der Fehler kann nicht auftreten |
| SP | Placebo-Paardifferenz als **Ungültigkeitswächter**, Auflage 4 |
| „Live driftet von der Messung weg" | Symbolliste vorab festgeschrieben, im Protokoll mitgeführt |

---

## 13. Zusammenfassung in drei Sätzen

Die Überlebensverzerrung des Kursarchivs zerfällt in einen **Pfadanteil**, der in den
Daten steht und mit einer gepaarten Tagesdifferenz auf 0,013 bis 0,033 Pp genau messbar
ist (delta80 0,020–0,053 Pp, deutlich unter der Kostenhürde von 0,10 Pp), und einen
**Schlussanteil**, der auf dieser Platte nicht existiert und deshalb nur beschränkt wird
(Obergrenze −0,114 Pp bei Totalverlust aller 257 Werte, 0 bei Barabfindung zum Kurs).
Die Korrekturdaten decken **257 von 6.921** delisteten Tickern und **zwei von zwanzig
Jahren** der Bestätigungshälfte ab, und die liquide Teilmenge besteht überwiegend aus
Übernahmen (Median-Rückgang −6,3 %) statt aus Pleiten — die Studie kann deshalb
belastbar sagen, ob der Pfadanteil im Fenster 2024–2026 unter der Produkthürde liegt,
und sie kann über 2006–2024 und über die 60m-Strategien nichts sagen.
