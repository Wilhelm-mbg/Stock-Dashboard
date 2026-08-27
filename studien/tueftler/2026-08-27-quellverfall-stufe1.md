# Quellverfall der abgemeldeten Reihen — Stufe 1 (NULL Netzabrufe)

**27.08.2026 abends, Strategie-Tüftler.** Aufgabe vom PM (Punkt 3 von dreien), von mir
netzarm zugeschnitten, weil der Eröffnungskurs-Vollauf von `1d` gleichzeitig auf derselben
Leitung läuft und heute Nachmittag schon einmal an fünf Netzfehlern gestorben ist.

Werkzeug: `studien/tueftler/werkzeug/zaehle-quellverfall.js`
Rohausgaben: `studien/tueftler/daten/zaehlung-quellverfall-2026-08-27.json`,
`studien/tueftler/daten/vorrang-eroeffnungskurse-2026-08-27.json`

---

## Der Zeuge: dieselbe Quelle zu zwei Zeitpunkten

Eine zweite Datenquelle wäre hier ein Konventions-Streit gewesen (Anpassung,
Börsenzuordnung, Kürzelwechsel). Es gibt einen besseren Zeugen, und er lag schon da:

| Bestand | Abruf | Felder je Kerze |
|---|---|---|
| `massive-sicherung-2026-08-27/tagesdaten` | **23.08. ~17:21** | 5 (ohne Eröffnungskurs) |
| `massive/tagesdaten` | **27.08. ~13:41** | 6 (mit Eröffnungskurs) |

**Beides sind Vollabrufe derselben Schnittstelle, 3,8 Tage auseinander** (Abstand aus den
Abrufstempeln gerechnet, nicht angenommen). Gleiche Konventionen auf beiden Seiten — übrig
bleibt die Zeit.

**Ausgeschlossen wurden die 288 Reihen, die der Vollauf noch nicht erneuert hatte.** Eine
nicht erneuerte Datei ist bytegleich mit der Sicherung und käme als „kein Verfall" durch —
das wäre ein Nullbefund aus fehlender Messung. Erkennungsmerkmal: 6 Felder = erneuert.
**Verglichen wurden 876 Reihen.**

---

## 🔴 Befund 1 — die Wand hat sich in 3,8 Tagen NICHT bewegt

    Wanderung der Vorderkante ueber 876 Reihen:  Median 0  ·  min 0  ·  max 0

**Keine einzige Reihe hat einen einzigen Tag Historie am Vorderrand verloren.**

**Positivkontrolle, damit das kein Werkzeug-Nullbefund ist:** **84 Reihen sind an der
*Hinterkante* gewachsen** (neue Handelstage seit dem 23.08.). Der Vergleich erkennt
Veränderungen also — er findet am Vorderrand nur keine.

**Und die naheliegende Falle ausdrücklich geprüft:** Der Vollauf ist gebaut, um Kerzen zu
*behalten* — dann hätte ich unsere Zusammenführung gemessen statt der Quelle. Gegenprobe:
für **alle 879** erneuerten Dateien beginnt die Datei **exakt** bei `geliefertVon`, also
bei dem, was der heutige Abruf lieferte. **Keine Datei reicht weiter zurück als ihr eigener
frischer Abruf.** Kein Zusammenführungs-Artefakt.

### Die Wand ist eine einzige, scharfe Kante

| `geliefertVon` | Reihen |
|---|---|
| **2024-08-23** | **753** |
| 2024-08-26 | 27 |
| 2024-08-27 | 9 |
| 2024-08-28 | 6 |
| übrige | verstreut |

**789 von 882 (89,5 %) liegen an oder vor dem 27.08.2024** — sie hängen an der Wand, ihre
Historie ist nicht durch ihr eigenes Alter begrenzt, sondern durch die Quelle.

**Bemerkenswert:** unser gerechnetes 730-Tage-Fenster (`quellfensterVon`) steht bei 741
Reihen auf **2024-08-27**, die Quelle liefert aber ab **2024-08-23** — also **vier Tage
mehr, als wir ihr zutrauen.** Das ist genau der Abstand der beiden Abrufe: am 23.08. war
2024-08-23 die korrekte 730-Tage-Grenze. **Die Wand steht, wo sie am 23.08. stand.**

---

## 🔴 Befund 2 — der Verfall trifft nicht Kerzen, sondern GANZE REIHEN auf einen Schlag

Das ist die eigentliche Mechanik, und ich hatte sie am 27.08. früh falsch beschrieben.

Eine Reihe, die am Tag **D** aufgehört hat zu handeln, führt bei der Quelle nur noch das
Stück zwischen der Wand **W** und **D**. Rückt W auf D zu, schrumpft das Stück — und
**sobald W über D hinaus ist, verschwindet die Reihe vollständig.** Nicht anteilig: ganz.

Das sieht man dem Bestand schon an: **die kürzeste Reihe führt noch 21 Kerzen, der Median
262.** `AAN` etwa hat 29 Kerzen — nicht weil die Quelle etwas weggeworfen hätte, sondern
weil die Firma am 04.10.2024 aufhörte, sechs Wochen nach der Wand.

**Wann welche Reihe unerreichbar wird** *(1.164 Reihen; unterstellt, die Wand rückt 1 Tag
je Tag — siehe die Warnung darunter)*:

| Frist | Reihen unerreichbar | Anteil | **davon noch ohne Eröffnungskurs** |
|---|---|---|---|
| 7 Tage | 0 | 0 % | 0 |
| 30 Tage | 1 | 0,1 % | **1** |
| **90 Tage** | **76** | **6,5 %** | **17** |
| 180 Tage | 194 | 16,7 % | 42 |
| 365 Tage | 411 | 35,3 % | 90 |
| > 365 Tage Luft | **753** | **64,7 %** | — |

> ### ⚠ DIE WARNUNG GEHÖRT ÜBER DIE TABELLE, NICHT DARUNTER
> **Diese Fristen unterstellen, dass die Wand täglich um einen Tag rückt. Genau das hat
> Befund 1 NICHT bestätigt — in 3,8 Tagen bewegte sie sich gar nicht.**
> 3,8 Tage können „rückt nie" nicht von „rückt monatsweise" unterscheiden. Bei
> monatsweisem Nachrücken stimmen die 90- und 180-Tage-Zeilen ungefähr weiter; rückt die
> Wand gar nicht, gibt es überhaupt keine Uhr. **Die Tabelle ist der konservative Fall,
> nicht der gemessene.** → Auflösbar mit einer Handvoll frischer Abrufe (Stufe 2), sobald
> der Vollauf durch ist.

---

## 🔻 Rücknahme einer eigenen Zahl von heute früh

Mein Auftragsvorschlag D (27.08. 04:50) begründete die Eile so:

> *„Das Fenster der Quelle rollt mit 730 Tagen… **1.894 Symbol-Tage sind schon draußen,
> rund 3.917 je Woche kommen dazu, nach 90 Tagen sind es 20,6 % — dauerhaft.**"*

**Zwei Korrekturen, und die zweite wiegt schwerer als die erste:**

1. **Die Glätte stimmt nicht.** Die Zahl kam aus einem *gerechneten* Modell
   (`zaehle-randverlust.js`), nicht aus einer Beobachtung. Direkt gemessen sind es **0
   verlorene Vordertage in 3,8 Tagen über 876 Reihen.** Ein gleichmäßiges Wegrollen findet
   in den Daten keine Stütze.
2. **Die Form stimmt nicht — und das ändert, was zu tun ist.** „Symbol-Tage gehen verloren"
   beschreibt einen gleichmäßigen Abrieb über alle Reihen. Tatsächlich verlieren **65 % der
   Reihen auf Sicht eines Jahres gar nichts**, während eine Minderheit **vollständig**
   verschwindet. Daraus folgt nicht „alles schnell nachholen", sondern **„die an der Kante
   zuerst"** — und das ist eine andere Reihenfolge, keine andere Geschwindigkeit.

*Was von Vorschlag D unverändert richtig bleibt: den 1.164 Reihen fehlte der
Eröffnungskurs, die Quelle führt ihn, und das Nachholen war richtig. Nur meine Begründung
für die **Eile** war zu glatt gerechnet.*

---

## → Was daraus folgt (Vorschlag, kein Auftrag — Werkzeugcode ist nicht meine Rolle)

**Der laufende Nachlauf sollte nach verbleibender Luft sortieren, nicht alphabetisch.**
Er arbeitet erkennbar von `AACB` abwärts; die Reihen an der Kante liegen aber verstreut im
Alphabet. Liste liegt fertig:

`studien/tueftler/daten/vorrang-eroeffnungskurse-2026-08-27.json` — **276 Reihen ohne
Eröffnungskurs, sortiert nach Luft**, mit letztem Handelstag und Kerzenzahl.

Die zehn knappsten:

| Symbol | letzter Handel | Luft | Kerzen |
|---|---|---|---|
| **BFI** | 2024-09-20 | **28 Tage** | 20 |
| SGE | 2024-09-27 | 35 | 24 |
| SWN | 2024-09-30 | 38 | 26 |
| VGR | 2024-10-04 | 42 | 30 |
| VTNR | 2024-10-07 | 45 | 30 |
| TELL | 2024-10-08 | 46 | 31 |
| VIRI | 2024-10-08 | 46 | 31 |
| ADRT | 2024-10-10 | 48 | 31 |
| SQSP | 2024-10-16 | 54 | 38 |
| TCJH | 2024-10-18 | 56 | 40 |

**Der Ertrag der Umsortierung ist klein und billig:** es geht um **17 Reihen im
90-Tage-Fenster**, nicht um alle 276. Der Rest hat Jahre Luft. *Das ist ausdrücklich kein
Grund zur Hektik — es ist ein Grund für eine Sortierung.*

---

## Stufe 2, offen — und sie beantwortet die eine Frage, die Stufe 1 nicht kann

**Rückt die Wand?** Eine Handvoll frischer Abrufe (nicht 60) auf Reihen, deren
`geliefertVon` heute auf 2024-08-23 steht, sagt es sofort: liefert die Quelle in ein paar
Tagen weiter ab 2024-08-23, steht die Wand; liefert sie ab einem späteren Datum, rückt sie.

**Vom PM zurückgestellt, bis der Vollauf durch ist** — mit gutem Grund: dieselbe Leitung ist
heute schon einmal weggebrochen. *Und ein zweiter Grund, der für Warten spricht: je später
der zweite Abruf, desto länger der Hebel. Ein Abstand von einer Woche unterscheidet
„steht" von „rückt monatsweise" viel sicherer als die 3,8 Tage von heute.*
