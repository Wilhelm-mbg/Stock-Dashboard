# Vorregistrierung: Die Kostenhürde für Kassa-Aktien aus notierten Spannen — 02.09.2026

**Geschrieben und committet, BEVOR `messen.js` gebaut oder ausgeführt wurde.**
Rolle: Berechnungen. Wilhelms Auftrag vom 02.09.2026.

Quelle: die historische Kurstafel von Alpaca (`data.alpaca.markets/v2/stocks/quotes`).
Rohdaten liegen auf `E:/Markt-Dashboard-Archiv/spannen/`, nicht im Repo.

---

## 0. Die Frage

> **Was kostet eine Kassa-Aktien-Runde wirklich — je Umsatzklasse, je Jahr, je Tageszeit?**

`wiki/kosten.md` führt **0,06 Pp je Umlauf** als *Annahme* („0,04 Spanne + 2 × Mindest-
kommission auf 10.000 $"). Diese Annahme entscheidet mit, welche der 52 gemessenen Varianten
als erledigt gelten (`studien/wiedervorlage-2026-09-02/BERICHT.md`: 18 von 52 gegen 0,06,
31 gegen die CFD-Hürde 0,1247). Sie ist nie gemessen worden. Die laufende Paper-Messung
(`kosten.js`, seit 02.09.2026) wird sie messen — mit **≥ 10 Runden je Klasse**, an *heutigen*
Kursen, an *einem* Broker, in *einer* Marktlage.

Die notierte Spanne ist dieselbe Größe, nur zehn Jahre tief und über den ganzen Querschnitt.
**Diese Studie ersetzt eine Annahme durch eine Messung, das Paper-Konto bleibt die Kontrolle.**

## 0.1 Erwartung, gegen die gemessen wird — vor dem Lauf hingeschrieben

Wer nach dem Lauf etwas anderes liest, lese diesen Absatz noch einmal.

| Klasse | erwarteter Median 2024, Mittagsfenster |
|---|---|
| ab 1.000 Mio $ | **0,005 – 0,02 Pp** |
| 250 – 1.000 | 0,02 – 0,05 |
| 50 – 250 | 0,05 – 0,15 |
| 5 – 50 | **0,3 – 1,0 Pp** |

Dazu: Eröffnungsfenster **2–4 ×** breiter als das Mittagsfenster; 2020 (Corona) der breiteste
Jahrgang; von 2016 nach 2026 fallende Spannen in allen Klassen.

**Die Folge, falls das eintrifft:** Die Annahme 0,06 ist für die Milliarden-Klasse **zu
pessimistisch** (Faktor 3–10) und für die 5–50-Mio-Klasse **zu optimistisch** (Faktor 5–15).
Beides hat Konsequenzen in entgegengesetzte Richtungen — und genau deshalb ist eine einzige
Zahl für alle Klassen die falsche Bauform. **Das ist keine Vorhersage über eine Kante,
sondern über eine Hürde; es gibt hier nichts zu bestätigen, nur etwas zu beziffern.**

---

## 1. Gesehene Zahlen — vollständig deklariert

**Aus Probe 1 (`probe.js`, 02.09.2026 18:15 UTC, von Wilhelm ausgeführt):** 8 von 8 Abrufen
mit Quotes, **keine** Tarif- oder Zugangsabweisung. Ratengrenze laut Kopfzeile **200/min**.

| Abruf | Ergebnis |
|---|---|
| AAPL 2018-03-01 09:35 ET, `sip` | 178,84 / 178,87 → **0,0168 Pp** |
| **MBUU** (6,2 Mio $ Umsatz) 2018-03-01 09:35 ET | 31,74 / 32,47 → **2,2738 Pp** |
| AAPL 2016-01-05 09:35 ET | **0,0286 / 0,0095 Pp** — die Tafel reicht bis mindestens Anfang 2016 |
| AAPL 2024-06-03 12:30 ET | **0,0103 Pp** |
| AAPL 2024-06-03 **08:00 ET** (vorbörslich) | **0,0363 / 0,0415 / 0,0466 Pp** — echte Quotes |
| AAPL 2025-08-01 12:30 ET | **0,0099 Pp** — keine Tarifverzögerung auf Historie |
| Auktionen AAPL 2018-03-01 | Schluss 175,00 (1.786.855 St.), Eröffnung 178,65 — Zusatz B trägt |

**Aus Probe 2 (`probe2.js`, 18:23 UTC) — der Abrufmodus:**

| Frage | Antwort |
|---|---|
| `sort=desc` | **trägt.** MBUU liefert damit den Quote um **14:34:33** (vor T), mit `asc` den um **14:35:18** (nach T) — 2,3046 gegen 2,2738 Pp |
| Rückblickfenster | **1 Minute reicht** schon bei MBUU; registriert werden 5 |
| MBUU 12:30 ET | **0,2417 Pp** gegen 2,3046 Pp um 09:35 — **Faktor 9,5** zwischen den Tagesfenstern |
| `limit` je Symbol? | **Nein, je Aufruf.** `symbols=AAPL,MSFT,MBUU&limit=3` gab 3× MSFT und sonst nichts → **ein Abruf je Symbol und Zeitpunkt** |
| Auktionen | **251 Tage in EINEM Abruf**, alle mit Schluss- und Eröffnungsauktion, kein `next_page_token` |
| Halbtag 2018-11-23, 15:55 ET | **HTTP 200, Quote um 15:53 ET, 0,0523 Pp** — nachbörslich, sieht aber normal aus |

**Aus dem Tagesarchiv (Planzählung, `stichprobe.js`, kein Netzabruf):**

| Größe | Wert |
|---|---|
| eingefrorenes Universum 2024-09-02 | 3.263 Werte |
| davon keine Aktie (nicht CS/ADRC, `wertpapierart.js`) | 765 |
| davon ohne Tagesreihe in `archiv1d` | 249 |
| **prüfbare Aktien** | **2.249** |
| Zeitpunkte im Plan | **55.455** |
| berührte Symbole / Kalendertage | 1.527 / 2.657 |

*(Die Planzählung stammt aus der Fassung mit handgeschriebener Halbtagsliste; nach der
Umstellung auf den Börsenkalender — §5.2 — verschieben sich die gezogenen Tage geringfügig.
Die neuen Zahlen stehen im Ergebnis.)*

### 1.1 Zwei Setzungen des Auftrags, die die Probe widerlegt hat

1. **Der Placebo des Auftrags ist faktisch falsch.** Verlangt war, 08:00 ET müsse `bp = 0`
   oder leer liefern. Die konsolidierte Tafel führt vorbörslich **echte Quotes**
   (0,0363–0,0466 Pp). Der Placebo wird deshalb umgedreht (§7) — auf eine Aussage, die die
   Quelle prüfen kann, statt eine, die sie nicht teilt.
2. **`feed=iex` ist keine Rückfallebene, sondern eine stille Falle.** Auf
   `start=2018-03-01` kamen Quotes vom **30.07.2020** zurück — falsches Jahr, **HTTP 200**,
   keine Warnung. Wer nicht auf den Zeitstempel sieht, misst 2020er Spannen und nennt sie
   2018. **Diese Studie benutzt ausschließlich `feed=sip`**, und `messen.js` schreibt zu
   jeder Zeile den gelieferten Zeitstempel `tq` mit, damit die Falle nachträglich prüfbar ist.
   *(Gehört ins Wiki, unabhängig vom Ausgang dieser Studie.)*

**Der eigene Fehler daneben, damit er nicht verlorengeht:** Probe 2 meldete für `sort=desc`
zunächst „VERFEHLT" — der Prüfsatz verglich **Zeitstempel als Zeichenketten**, und
`'…T14:35:00Z' > '…T14:35:00.001Z'`, weil `'.'` vor `'Z'` sortiert. Die Schnittstelle tat
das Richtige, die Prüfung war kaputt. In `messen.js` vergleicht die Modusprüfung numerisch.

**Aus dem Tagesarchiv (Planzählung, `stichprobe.js`, kein Netzabruf):**

| Größe | Wert |
|---|---|
| eingefrorenes Universum 2024-09-02 | 3.263 Werte |
| davon keine Aktie (nicht CS/ADRC, `wertpapierart.js`) | 765 |
| davon ohne Tagesreihe in `archiv1d` | 249 |
| **prüfbare Aktien** | **2.249** |
| Zeitpunkte im Plan | **55.455** |
| berührte Symbole / Kalendertage | 1.527 / 2.657 |

**Nicht gesehen:** jede Spanne außer den in der Probe gezeigten AAPL- und MBUU-Quotes.
Insbesondere ist keine Klassen-, Jahres- oder Fensterzelle berechnet worden.

**Was diese Messung ist:** eine **Beschreibung einer Kostengröße**, keine Prüfung einer
Kante. Es gibt keine Nullhypothese über einen Ertrag, keine Familienschwelle, kein
„bestätigt/widerlegt". Berichtet werden Lageschätzer mit Unsicherheitsband.

---

## 2. Machbarkeit — die Auflösungswand gilt hier anders

Die Auflösungswand (`wiki/aufloesungswand.md`) rechnet Signaltage gegen eine gesuchte
Kantengröße. **Hier wird keine Kante gesucht.** Die entsprechende Frage lautet: Wie genau
ist der Median einer Zelle?

Bindend ist die Zahl der **Symbole** je Zelle, nicht die der Quotes: Spannen sind innerhalb
eines Wertes hochgradig beharrlich — fünf Tage desselben Symbols sind fast eine Beobachtung.
Deshalb:

- **Unsicherheit ausschließlich als Cluster-Bootstrap über Symbole** (1.000 Ziehungen mit
  Zurücklegen aus den Symbolen der Zelle, ganze Symbole samt allen ihren Zeitpunkten),
  95-%-Perzentilband. Ein ungeclustertes Band wäre um ein Vielfaches zu eng.
- **Je Zelle wird die Zahl der ZEITPUNKTE ausgewiesen** (verschiedene Symbol-Tage), nicht nur
  die Zahl der Quotes — Lehre aus `wiki/fehlerformen.md`, „Querschnitt misst den Tag".
- **Zellen mit weniger als 10 Symbolen tragen kein Band, sondern den Vermerk „zu dünn".**
  Das trifft absehbar die Klasse *ab 1.000 Mio $* in den frühen Jahren (2016: 14 Werte,
  2017: 12) — dort ist die Ziehung ohnehin eine **Vollerhebung**, das Band beschreibt dann
  nur die Streuung zwischen den wenigen vorhandenen Werten, nicht Stichprobenfehler.

**Abbruchkriterium der Machbarkeit:** keins. Selbst eine dünne Zelle liefert eine bessere
Grundlage als die heutige Annahme, solange sie ihre Dünnheit ausweist.

---

## 3. Zielgröße

Je Quote:

    Spanne = (ap − bp) / mid × 100        in Prozentpunkten,  mid = (bp + ap) / 2

**Das ist die Kostenhürde je UMLAUF**, nicht je Seite: wer am Brief kauft und am Geld
verkauft, zahlt die volle notierte Spanne. Provision kommt additiv dazu (§7).

Je Zelle berichtet: **n (Quotes), Zeitpunkte (Symbol-Tage), Symbole, Median, p75**, dazu das
Cluster-Bootstrap-Band um den Median.

**Der Median über SYMBOLE ist der primäre Schätzer** (erst je Symbol den Median über seine
Zeitpunkte, dann den Median über die Symbole). Der rohe Median über alle Quotes wird
danebengestellt; wo beide auseinanderlaufen, dominieren einzelne Symbole, und das soll
sichtbar sein. **Vorrangregel vorab:** Wo im Text „die Hürde der Klasse" steht, ist immer
der Symbol-Median gemeint.

## 4. Zellen

- **Umsatzklasse** (4): 5–50 / 50–250 / 250–1.000 / ab 1.000 Mio $ Median-Tagesumsatz.
  Wörtlich `UMSATZ_KLASSEN` aus `kosten.js`; Berechnung wörtlich `liquide.js`
  (Median Schluss × Stück über 20 Balken, `sortiert[n >> 1]`), **Punkt-in-Zeit**.
- **Jahr** (11): 2016 … 2026.
- **Tageszeit** (3): `eroeffnung` 09:30–10:00 · `mitte` 10:00–15:30 · `schluss` 15:30–16:00 ET.

**132 Zellen.** Zusätzlich der Regimeschnitt **bis 2020 / ab 2021** getrennt ausgewiesen
(`wiki/aufloesungswand.md`: die brauchbare Abdeckung beginnt 2021; und die Übernachtdrift ist
2021 kollabiert — dieselbe Grenze).

**Klassenzuordnung: am JAHRESANKER**, dem letzten Handelstag des Vorjahres. Der Anker liegt
vor dem Jahr, aus dem gezogen wird — **kein Blick nach vorn**, und die Schichtung steht fest,
bevor irgendein Tag gezogen ist. Die Klasse am Stichtag selbst wird pro Zeile mitgeschrieben;
`auswerten.js` legt die Tabellen **zusätzlich** nach dieser Zuordnung vor. **Vorrangregel
vorab: primär ist der Jahresanker.**

---

## 5. Stichprobe

### 5.1 Abweichung vom Auftrag — gezählt, nicht stillschweigend

Der Auftrag verlangt *„je Symbol des eingefrorenen Universums 12 Handelstage je Jahr × 3
gewürfelte Minuten"*. Das sind bei 2.249 prüfbaren Aktien **890.604 Abrufe**; bei allen 3.263
Werten 1.292.148. Bei der Ratenbremse von 180 Aufrufen je Minute:

| Fassung | Abrufe | Laufzeit |
|---|---|---|
| Auftrag, alle 3.263 Werte | 1.292.148 | **119,6 h** (5,0 Tage Dauerlauf) |
| Auftrag, 2.249 Aktien | 890.604 | **82,5 h** |
| **hier registriert** | **55.455** | **5,1 h** |

**Registriert wird die geschichtete Fassung** (Faktor 16 kleiner). Begründung: Die
gesuchte Größe ist ein Lageschätzer je Zelle; deren Genauigkeit hängt an der Zahl der
**Symbole** je Zelle (§2), nicht an der Zahl der Quotes. 100 Symbole je Zelle statt aller
verfügbaren kostet Genauigkeit im Prozentbereich und Laufzeit um Faktor 16. Ein Lauf über
fünf Tage wäre zudem nicht fortsetzbar zu betreiben.

**Wenn Wilhelm die Vollfassung will, ist sie eine Zeile:** `--symbole=9999 --tage=12`.
Der Plan ist deterministisch; die geschichtete Ziehung ist eine **Teilmenge** der Vollfassung
nur in den Symbolen, nicht in den Tagen (dort werden 5 statt 12 gezogen, aus demselben
Strom — die 5 sind die ersten 5 der 12). Ein späterer Nachschlag ändert also nichts an dem,
was jetzt gemessen wird.

### 5.2 Die Ziehung (deterministisch, Saat 20260902)

1. **Rahmen A:** eingefrorenes Universum `massive/universum-2024-09-02.json` (nur lesen),
   gefiltert auf **CS/ADRC** (`studien/messmaschine/strategien/wertpapierart.js`) — keine
   ETFs, keine Hebelprodukte. Symbole ohne Eintrag in der Referenzkarte fallen still heraus;
   ihre Zahl wird ausgewiesen.
2. **Je Klasse und Jahr 100 Symbole** gewürfelt aus den am Jahresanker zulässigen; sind es
   weniger als 100, werden **alle** genommen (Vollerhebung, wird als solche vermerkt).
3. **Je Symbol 5 Handelstage**, gewürfelt aus den Tagen, an denen *dieses* Symbol im Jahr
   einen Balken hat. **Nur Tage, die die Börse um 16:00 ET schließt.** Die Halbtage
   (Handelsende 13:00) fallen heraus — dort gibt es die Fenster `mitte` und `schluss` nicht.
   Der Kalender kommt aus `/v2/calendar` (`kalender.js`), **nicht aus einer Liste im Code**:
   Probe 2 Frage E hat gezeigt, dass ein offengelassener Halbtag *nicht auffällt* — der
   Abruf um 15:55 ET liefert HTTP 200 und einen plausiblen nachbörslichen Quote (AAPL
   23.11.2018: 0,0523 Pp, fünffache Mittagsspanne). Dieselbe Bauart wie die `iex`-Falle.
   Die erste Fassung dieser Studie hatte die Liste von Hand geschrieben und führte darin
   2016-12-23 und 2026-07-02 als Halbtage — beides Vermutung ohne Fundstelle.
4. **Je Tag ein Zeitpunkt aus jedem der drei Fenster**, Minute *und Sekunde* gewürfelt —
   damit die Probe nicht auf runden Minuten sitzt, wo die Auftragslage eine andere ist.
5. Jeder Wurfstrom hat seine eigene, aus Text abgeleitete Saat (`Klasse|Jahr`,
   `Symbol|Jahr|tag`, `Symbol|Tag|Fenster`). Ein späterer Nachschlag in einer Zelle ändert
   keine andere.

**Symbole ohne Tagesumsatz zum Stichtag entfallen und werden gezählt** — getrennt nach
Grund: kein Eintrag in der Referenzkarte / keine Tagesreihe / kein Anker / unter 5 Mio $ /
weniger als 5 Handelstage im Jahr.

### 5.3 Der Abruf — welcher Quote gilt

**Der zum Zeitpunkt T gültige Quote ist der LETZTE bei oder vor T**, nicht der erste danach.
Abgerufen wird deshalb `start = T − 5 min`, `end = T`, `limit = 1`, `sort = desc`.

Das ist eine Festlegung mit Folgen, darum ausdrücklich: Wer den *ersten Quote nach T* nähme,
würde bei dünnen Werten systematisch den **Augenblick einer Kursstellung** treffen statt
eines beliebigen Augenblicks — und Kursstellungen fallen mit Aktivität zusammen. Genau die
Klasse, um die es geht, wäre dann zu schön gemessen.

Kommt in den 5 Minuten vor T kein Quote, zählt der Zeitpunkt als **„kein Quote"** — nicht als
Spanne 0, nicht als fehlender Wert, den man ersetzt. **Vor dem Lauf festgelegt:** `sort=desc`
wird beim Start **einmal geprüft**; lehnt der Endpunkt es ab, bricht `messen.js` ab, statt
still auf `asc` auszuweichen. Ein halber Lauf in zwei Abrufmodi wäre unbrauchbar.

**Ein Abruf je Symbol und Zeitpunkt.** Probe 2 Frage C hat den Sammelabruf ausgeschlossen:
`limit` gilt für den ganzen Aufruf, nicht je Symbol — bei drei Symbolen und `limit=3` kamen
drei Quotes **eines** Symbols zurück. Damit bleibt es bei 55.455 Abrufen und 5,1 Stunden;
die Alternative wären Minuten gewesen, und sie steht nicht zur Verfügung.

**Gesperrte Märkte** (`bp = ap`, „locked") zählen als **Spanne 0** und werden **nicht**
ausgeschlossen — ein Ausschluss auf die Zielgröße ist verboten (§7). Sie werden aber
**gezählt und je Zelle ausgewiesen**, weil eine Zelle voller Nullen etwas anderes bedeutet
als eine Zelle mit engen Spannen.

---

## 6. Zusätze

### Zusatz A — Momentum-Umschichtungen

Korbmitglieder je Periode aus `studien/vorregistrierung-2026-09-02-momentum-liquide/`
(Korbregel `liquide.js`, ≥ 100 Mio $, stärkste 10 %), Spanne um **15:55 ET am
Umschichtungstag**. **41 Umschichtungstage ab 2016, 2.142 Korbmitgliedschaften.**

Die Korbmitglieder stehen im Lauf-JSON nicht drin (nur `korbN`). Sie werden aus dem Archiv
**nachgebaut**; der Nachbau gilt nur als gültig, wenn er je Periode **exakt dasselbe `korbN`**
liefert wie `lauf-2026-09-01-22-52.json`. **Das ist die Positivkontrolle des Zusatzes** —
schlägt sie fehl, entfällt Zusatz A und wird als entfallen berichtet, statt mit einem anderen
Korb gerechnet zu werden.

Endpunkt: Median-Spanne des Korbs je Umschichtung, gegen die Hürde, die das Momentum-Buch
heute unterstellt.

### Zusatz B — Auktionen

`/v2/stocks/auctions` für dieselben Tage: **Schlussauktion und Folgeeröffnung**, Abstand in
Pp. Kennzahl für die Übernacht-Familie, deren Runde in `kosten.js` genau so gebaut ist
(`cls` → `opg`) und deren Kosten dort **unverifiziert** sind.

### Zusatz C — Verschwundene Werte (Überlebensverzerrung), NACHRANGIG

Der Rahmen A ist ein Universum vom 02.09.2024 und enthält per Bauart **niemanden, der vor
diesem Tag verschwunden ist**. Für 2016–2024 misst er also die Spannen der Überlebenden.
`wiki/ueberlebensverzerrung.md` führt das als den Killer des Projekts.

`Markt-Dashboard-Daten/massive/tagesdaten/` hält **1.164 verschwundene Werte** mit
Tagesbalken. Zusatz C zieht aus ihnen nach derselben Regel und berichtet die Differenz
zu Rahmen A **getrennt**. Er wird **nie in die Haupttabellen gemischt.**

**Nachrangig heißt: Zusatz C läuft erst, wenn Rahmen A vollständig durch ist.** Bleibt keine
Zeit, ist der Befund „nicht gemessen" — und die Haupttabellen tragen dann den Vermerk, dass
sie Überlebende messen.

---

## 7. Kontrollen — vorab, in derselben Blickzeile wie das Ergebnis

| Kontrolle | Soll | Wenn verfehlt |
|---|---|---|
| **Positivkontrolle** | AAPL, 2024, Fenster `mitte`: Median **< 0,02 Pp** | Werkzeug gilt als tot, **keine Zahl wird berichtet** |
| **Positivkontrolle 2 (Ordnung)** | Median `5-50` > Median `ab1000` in **jedem** der 11 Jahre | Befund, kein Abbruch — wird als Auffälligkeit berichtet |
| **Placebo (vorbörslich)** | 08:00 ET, 1 % der gezogenen Symbol-Tage: Median **mindestens doppelt** so breit wie `mitte` desselben Symbol-Tags | Werkzeug misst nicht, was es zu messen behauptet — **Befund, kein Abbruch**, aber alle Zahlen tragen den Vermerk |
| **Nachbau-Kontrolle Zusatz A** | `korbN` je Periode exakt wie im Lauf-JSON | Zusatz A entfällt |

**Die Placebo-Regel steht anders da als im Auftrag, und zwar wegen der Probe.** Der Auftrag
verlangte *„08:00 ET muss `bp = 0` oder leer liefern"*. Probe 1 Frage 6 zeigt: die
konsolidierte Tafel führt vorbörslich **echte Quotes** (AAPL 2024-06-03: 0,0363 / 0,0415 /
0,0466 Pp gegen 0,0103 Pp mittags — Faktor 3,5 bis 4,5). Die Sollaussage des Auftrags wäre
also von der Quelle sofort verletzt worden, ohne dass am Werkzeug etwas falsch ist.

**Was der Placebo statt dessen prüft:** dass das Werkzeug den Unterschied zwischen einem
dünnen und einem dichten Handelsfenster überhaupt *sieht*. Ein Werkzeug, das vorbörslich
dieselbe Spanne misst wie mittags, mittelt irgendwo, greift den falschen Zeitpunkt ab oder
liest den falschen Feed. **Die Schwelle (Faktor 2) steht hier vor dem Lauf**; der beobachtete
Faktor an AAPL ist 3,5–4,5, an einem dünnen Wert erwartungsgemäß mehr.

**Die zugehörige Nullaussage bleibt trotzdem scharf:** kommt an einem Zeitpunkt kein Quote,
**muss** er als „kein Quote" gezählt werden. Zählte ihn das Werkzeug als Spanne 0, wäre es
kaputt — `bewerten()` trennt beides, und ein Einzeltest hält es fest.

### Ausschlussregeln — VORAB, und nie auf die Zielgröße

Als **fehlend** zählen: `bp = 0`, `ap = 0`, `ap < bp` (gekreuzt), fehlendes Feld, kein Quote
im 5-Minuten-Fenster. **Kein Ausschluss nach Höhe der Spanne** — keine Ausreißerkappung,
kein Winsorisieren, keine Obergrenze. Eine Spanne von 8 % in einem 6-Mio-Wert ist die
Antwort, nicht ein Fehler. Die Zahl der fehlenden Zeitpunkte wird je Zelle ausgewiesen; ist
sie in einer Zelle **über 20 %**, trägt die Zelle einen Warnvermerk.

---

## 8. Auswertung und Entscheidungsregel

`auswerten.js` → `ERGEBNIS.md`:

1. **Tabellen je Zelle:** n, Zeitpunkte, Symbole, Median, p75, Bootstrap-Band, Fehlanteil.
2. **Die Kostenhürde je Klasse und Jahr:**
   - **Maßgeblich ist das Fenster `mitte`** (10:00–15:30 ET). Begründung, vor dem Lauf
     geschrieben: es sind 330 der 390 Handelsminuten, und es ist das Fenster, in dem die
     Intraday-Strategien der App tatsächlich einsteigen. `eroeffnung` und `schluss` stehen
     **daneben, nie statt dessen** — die Übernacht-Familie handelt im Schlussfenster und
     bekommt dort ihre eigene Hürde.
   - *Alpaca:* Median-Spanne **+ 0** (keine Provision).
   - *IBKR, nachrichtlich:* + 2 × max(0,35 $; 0,0035 $/Stück) auf eine **10.000-$-Position**
     — die Bezugsgröße der bisherigen Annahme. Die Positionsgröße steht in der Tabellen-
     überschrift, weil die Kommission bei 2.000 $ das Vierfache in Pp ausmacht.
3. **Vergleich** mit der Annahme **0,06 Pp** und der CFD-Hürde **0,1247 Pp**.
4. **Wiedervorlage der 31 gegen CFD geschlossenen Varianten**
   (`studien/wiedervorlage-2026-09-02/BERICHT.md` §1.2): Welche wären bei der Kassa-Hürde
   **ihrer Klasse** wieder offen, welche endgültig zu?

> **Zuordnungsregel, vorab:** Eine Variante wird gegen die Hürde derjenigen Klasse gehalten,
> in der das Universum liegt, auf dem sie gemessen wurde. Steht das im Protokoll nicht, wird
> die Variante gegen **alle vier** Hürden ausgewiesen und ihr Universum als **unbekannt**
> markiert. **Es wird nicht geraten, und es wird nicht die günstigste Klasse gewählt.**
> „Wieder offen" heißt: obere Grenze der Variante > Kassa-Hürde ihrer Klasse. Das ist eine
> **Größenaussage, kein Ertragsbeleg** — eine wieder offene Variante ist nicht besser
> geworden, sie ist nur nicht mehr durch die Kosten erledigt.

5. **Regimeschnitt bis 2020 / ab 2021** getrennt.
6. Zusätze A, B, C in eigenen Abschnitten.

---

## 9. Was diese Studie NICHT sagt

- **Nicht die effektiven Kosten.** Schlupf, Marktimpact, Warteschlange, Teilfüllung und
  Preisverbesserung sind nicht enthalten. Die notierte Spanne ist die **Untergrenze** dessen,
  was eine Marktorder kostet — für kleine Stückzahlen in liquiden Werten eine gute, für große
  Stückzahlen in dünnen Werten eine schlechte Näherung.
- **Nicht die Tiefe.** `bs`/`as` werden mitgeschrieben, aber die Frage „passt meine Order in
  die notierte Menge?" wird hier nicht beantwortet.
- **Nicht die Kosten des CFD-Gefäßes.** Capital.com stellt eigene Spannen; die Reihe dort
  bleibt getrennt.
- **Kein Ertragsbeleg für irgendeine Strategie.** Eine gesenkte Hürde belegt keine Kante.
- **Für 2016–2024 misst Rahmen A Überlebende.** Zusatz C beziffert das, schließt es aber
  nicht.
- **Der Vergleich mit dem Paper-Konto ist ein späterer Auftrag.** Er ist die Kontrolle
  dieser Studie, nicht ihr Bestandteil.

---

## 9a. NACHTRAG nach dem Testlauf — 02.09.2026, 18:45 UTC

**Geschrieben nach dem Testlauf (20 Symbole, Jahr 2018, 300 Quotes), vor dem Vollauf.**
Die Zahlen des Testlaufs sind damit **gesehen** und stehen hier vollständig. Der primäre
Endpunkt (§3), die Zellen (§4), die Ziehung (§5) und die Entscheidungsregel (§8) sind
**unverändert**; ergänzt wird eine Diagnose und zweimal Betriebsgröße.

### Was der Testlauf gezeigt hat

| Klasse | Symbole | Median-Kurs | Median `mitte` | **Anteil am Cent-Boden** |
|---|---|---|---|---|
| 5-50 | HPP, GLPI, KRC, CMPR, BBAR | 34,05 $ | 0,0984 | 27 % |
| 50-250 | LBRDK, PBF, FMX, RJF, AAL | 82,82 $ | 0,0554 | 24 % |
| 250-1000 | MRK, AMD, AIG, PEP, ELV | 62,41 $ | 0,0187 | **59 %** |
| ab1000 | BABA, MU, GE, T, GOOGL | 45,94 $ | **0,0315** | **63 %** |

Versatz angefragter zu geliefertem Zeitstempel: Median 1,0 s, p90 13,5 s, max 83,7 s,
**kein einziger negativer** — `sort=desc` liefert also durchweg den letzten Quote *vor* dem
Zeitpunkt. 300 von 301 gültig, 1 × „kein Quote" (der Placebo-Punkt, vorbörslich).

### Der Befund, der eine Ergänzung erzwingt: **der Cent-Boden**

`ab1000` liegt mittags **über** `250-1000` — die falsche Richtung. Der Grund ist keine
Marktbeobachtung, sondern Arithmetik: die kleinste zulässige Preisstufe ist **1 Cent**, und
eine Spanne von 1 Cent ist bei Kurs K genau `100/K × 0,01` Pp. Bei 20 $ sind das 0,050 Pp,
bei 200 $ 0,005 Pp. **Sobald ein Wert am Cent-Boden steht, misst die Spanne in Pp nur noch
seinen Kurs.** Im Testlauf trifft das auf 59 % bzw. 63 % der Quotes der beiden liquiden
Klassen zu — und `ab1000` enthielt zufällig die billigeren Aktien (GE, T).

> **Folge für die Lesart des Ergebnisses, hier vorab festgehalten:** Für die liquiden Klassen
> ist „die Hürde der Umsatzklasse" **keine Liquiditätsaussage.** Wer eine Strategie auf
> Werten unter 30 $ handelt, zahlt mehr als einer, der dieselbe Strategie auf Werten über
> 150 $ handelt — bei identischer Liquidität. Das steht so im ERGEBNIS.md, und die
> Wiedervorlage der 31 Varianten (§8) trägt den Vorbehalt.

### Drei Änderungen, jede mit Grund

1. **Neue Diagnosespalten je Zelle** (ändern keinen Endpunkt): **Median-Kurs** und **Anteil
   der Quotes am Cent-Boden** (`ap − bp = 0,01 $`). Ohne sie ist eine Zellenzahl nicht
   deutbar. Sie werden **berichtet, nicht verrechnet** — kein Wert wird nach Kurs bereinigt,
   gewichtet oder ausgeschlossen.
2. **Placebo von 1 % auf 4 %** der `mitte`-Zeitpunkte (jeder 25. statt jeder 100.). Grund:
   der Testlauf hatte **einen** Placebo-Punkt, und der lieferte vorbörslich gar keinen Quote.
   §7 verlangt n ≥ 20; bei 1 % wären es rund 185 Punkte, von denen ein großer Teil bei dünnen
   Werten ausfällt. 4 % sind rund 740 Punkte und kosten 4 Minuten Laufzeit.
3. **Acht Arbeiter statt vier.** Der Testlauf schaffte **102 Aufrufe/min**, nicht 180 — es
   bremst die Antwortzeit (~2,4 s je Abruf), nicht die Ratenbremse. Der Vollauf hätte damit
   **9,1 h statt 5,1 h** gebraucht. Die Bremse bleibt bei 180/min und ist weiterhin das
   Limit; es ändert sich nur, wie viele Abrufe gleichzeitig darauf warten.

**Was NICHT geändert wird:** Zielgröße, Zellen, Ziehung, Saat, Ausschlussregeln,
Positivkontrollen, Placebo-Schwelle (Faktor 2), Zuordnungsregel der 31 Varianten.

---

## 10. Sicherheit und Betrieb

- Der Zugang steht **ausschließlich** in Wilhelms Umgebung (`process.env`). `schluessel.js`
  ist die einzige Datei der Studie, die die beiden Umgebungsnamen nennt; jeder Text, der die
  Studie verlässt, läuft durch `verdecken()`. Eine Klinke in `test-v6.js` prüft **Struktur**
  (keine andere Datei liest `process.env`) und **Verhalten** (ein Lauf mit erfundenen Werten
  gegen einen Server, der die Kopfzeilen zurückspiegelt, darf sie nirgends hinterlassen).
- **Nur lesend** auf `massive/universum-2024-09-02.json` und `archiv1d`. Nichts gekauft,
  kein Tarif geändert, keine Kontoeinstellung berührt.
- Rohdaten auf `E:/Markt-Dashboard-Archiv/spannen/`, **nicht im Repo**. Kein `git add -A`.
- Der Lauf läuft in Wilhelms eigenem Terminal und ist **vom Chat losgelöst**; ein Chat-Ende
  beendet ihn nicht. Fortsetzbar: jede Antwort geht sofort als Zeile nach
  `<jahr>.jsonl`, beim Neustart wird übersprungen, was liegt.

---

## 9b. NACHTRAG zu Zusatz C — die Ziehung der Verschwundenen, 03.09.2026

**Geschrieben nach der Probe (`probeC.js`, Schritt 0) und BEVOR `zusatzC.js` gebaut wurde.**
Die Zahlen der Probe sind damit **gesehen** und stehen hier vollständig. §3 (Zielgröße),
§4 (Zellen), §7 (Ausschlussregeln, Placebo) und §5.3 (welcher Quote gilt) sind
**unverändert** und gelten wörtlich weiter. Neu ist der **Rahmen C** und seine Ziehung.

Zusatz C bleibt, was §6 sagt: er wird **getrennt** berichtet und **nie in die Haupttabellen
gemischt**. Er beziffert die Überlebensverzerrung, er behebt sie nicht.

### 9b.0 Gesehene Zahlen — vollständig deklariert

**Aus der Probe (`probeC.js`, 03.09.2026 09:16 UTC, von Wilhelm ausgeführt), fünf verschwundene
Werte nach der Auswahlregel unten, je ein Zeitpunkt im Fenster `mitte` aus der Mitte ihrer
Lebenszeit, `feed=sip`:**

| Wert | Klasse | Tag (Fenster `mitte`) | Versatz `tq` zum angefragten Zeitpunkt | notierte Spanne | Mittelkurs im Tagesband des Archivs | 60 Handelstage NACH dem letzten Balken |
|---|---|---|---|---|---|---|
| **NVEI** | 5-50 | 2024-10-07 | 3,5 s **vor** T | **0,0300 Pp** · am Cent-Boden | 33,375 in [33,27; 33,395] — **drin** | **kein Quote** |
| **MRO** | 50-250 | 2024-10-09 | 0,1 s vor T | **0,0356 Pp** · am Cent-Boden | 28,095 in [27,74; 28,285] — **drin** | **kein Quote** |
| **HES** | 250-1000 | 2025-02-05 | 7,1 s vor T | **0,0908 Pp** | 143,215 in [141,89; 143,85] — **drin** | **kein Quote** |
| **SAVE** | 5-50 | 2024-10-07 | 0,2 s vor T | **0,5666 Pp** · am Cent-Boden | 1,765 in [1,65; 1,88] — **drin** | **kein Quote** |
| **CTLT** | 50-250 | 2024-10-21 | 12,0 s vor T | **0,0166 Pp** · am Cent-Boden | 60,295 in [60,14; 60,4] — **drin** | **kein Quote** |
| *Kontrolle* **AAPL** | — | 2024-10-07 | 0,2 s vor T | **0,0090 Pp** | — | — |

| Frage der Probe | Antwort |
|---|---|
| Führt die Tafel verschwundene Werte? | **5 von 5** mit Quote, **HTTP 200**, keine Tarif- oder Zugangsabweisung (0 × 401/403/422) |
| Stammt der Quote aus der Lebenszeit des Wertes? | **5 von 5** — der Mittelkurs liegt in der Tagesspanne, die `tagesdaten` für genau diesen Tag führt. **Kürzel-Wiederverwendung ausgeschlossen.** |
| Handelt das Kürzel danach weiter? | **0 von 5.** 60 Handelstage nach dem letzten Balken liefert die Tafel **keinen** Quote — die Abdeckung endet mit dem Wert. |
| iex-Falle (§1.1)? | Der gelieferte Zeitstempel liegt in **allen sechs** Abrufen **vor** dem angefragten, Versatz 0,1 bis 12,0 s. Kein falsches Jahr, kein Quote nach T. |
| Läuft die Probe überhaupt? | Kontrolle AAPL am selben Tag: **0,0090 Pp**. Ein „0 von 5" wäre damit deutbar gewesen — es kam nicht. |

> **Der Nebenbefund, der sofort in die Lesart gehört: vier der fünf Quotes stehen am
> CENT-BODEN.** SAVE notiert bei 1,77 $ und liefert deshalb 0,5666 Pp — das ist die
> Bodenspanne `100/1,765 × 0,01 = 0,5666`, **auf die vierte Stelle genau**. Bei diesem Wert
> misst die Spanne in Pp **ausschließlich** seinen Kurs. Was daraus für den Vergleich folgt,
> steht in §9b.4a — und es steht dort, **bevor** gemessen wird.

**Nicht gesehen:** jede weitere Spanne eines verschwundenen Wertes. Insbesondere ist keine
Zelle von Rahmen C berechnet worden.

### 9b.1 Zwei Tatsachen aus dem Archiv, die den Rahmen zuschneiden — gezählt, nicht geschätzt

**(1) Die Verschwundenen haben Tagesbalken erst ab dem 23.08.2024.** Das ist der früheste
Balken über alle 1.164 Reihen in `Markt-Dashboard-Daten/massive/tagesdaten/` (die Sammlung
stammt aus der Gratisstufe von Massive, deren Aggregat-Fenster zwei Jahre tief ist —
`wiki/datenquellen.md`). `verschwundene.json` führt 6.921 aktienartige Kürzel; wie viele
davon einen Balken haben, hängt am Delisting-Jahr:

| Delisting-Jahr laut Liste | Einträge (CS/ADRC) | davon mit Tagesbalken |
|---|---|---|
| 2004–2022 | 3.690 | **0** |
| 2023 | 740 | 15 |
| 2024 | 609 | 225 (37 %) |
| 2025 | 558 | **540 (97 %)** |
| 2026 | 438 | **406 (93 %)** |

Ohne Tagesbalken gibt es **keine Umsatzklasse** (die Regel aus `liquide.js` braucht 20
Balken) und **keine Lebenszeit**. Die Ziehungsregel hat dort nichts, woran sie greifen kann.

> **Die Folge, hier vorab und unmissverständlich:** Zusatz C kann für **2016–2024 nichts
> messen** — also für genau die Jahre, in denen Rahmen A am stärksten Überlebende misst.
> Messbar sind **2025 und 2026**, und dort ist die Verschwundenen-Sammlung nahezu
> vollständig (97 % / 93 %). **Was Zusatz C liefert, ist damit kein Deckel über die
> Verzerrung von 2016–2024, sondern eine Messung an ihrem jüngsten Rand.** Eine
> Hochrechnung auf die frühen Jahre findet nicht statt (§9b.6).

**(2) Rahmen A und Rahmen C überschneiden sich fast nicht.** Von den 1.527 Symbolen im
Stichprobenplan von Rahmen A stehen **5** in `tagesdaten/`: AVB, EQR, WBS, LBRDA, LBRDK.
Die ersten drei führt `massive/abmeldungen.json` als **„historie-zurueckgesetzt"** — also
als Fehlalarm der Quelle, nicht als Delisting; die beiden anderen sind am 17.07.2026 wirklich
abgemeldet worden. Der Grund für die Trennschärfe steht in `stichprobe.js`: Rahmen A verlangt
eine Reihe in `archiv1d`, und von den 229 verschwundenen Werten, die im eingefrorenen
Universum stehen, haben **224 dort keine Datei**. **Die beiden Rahmen messen also verschiedene
Werte** — das ist die Voraussetzung dafür, dass ihre Differenz überhaupt etwas bedeutet.

### 9b.2 Rahmen C und die Ziehung (deterministisch, Saat 20260902 — dieselbe wie Rahmen A)

Die Regel ist **wörtlich die des §5.2**, mit **drei** Ergänzungen, jede unten begründet:

1. **Rahmen C:** die 1.164 Reihen aus `massive/tagesdaten/`, gefiltert auf **CS/ADRC**
   (`wertpapierart.js`) — dieselbe Filterregel wie Rahmen A. *(Gezählt: alle 1.164 sind
   CS oder ADRC, es fällt keiner heraus.)*
2. **Klasse je (Symbol, Jahr) am JAHRESANKER**, dem letzten Handelstag des Vorjahres,
   Median-Tagesumsatz über 20 Balken, Regel wörtlich `liquide.js` — **identisch zu §4/§5.2**.
   Kein Blick nach vorn.
3. **Je Klasse und Jahr bis zu 100 Symbole** gewürfelt; sind es weniger, werden **alle**
   genommen (Vollerhebung, wird als solche vermerkt).
4. **Je Symbol 5 Handelstage**, gewürfelt aus den Tagen, an denen *dieses* Symbol im Jahr
   einen Balken hat. **Nur volle Handelstage** aus `/v2/calendar` (`kalender.js`).
5. **Je Tag ein Zeitpunkt aus jedem der drei Fenster**, Minute *und Sekunde* gewürfelt.
6. Wurfströme wie §5.2 (`Klasse|Jahr`, `Symbol|Jahr|tag`, `Symbol|Tag|Fenster`).

**Ergänzung 1 — nur Jahre, in denen der Wert noch lebte.** Ein Symbol wird für ein Jahr nur
gezogen, wenn es am Jahresanker eine Klasse hat; die Lebenszeit kommt aus `tagesdaten`, nicht
aus dem Listendatum der Quelle. *(Begründung: `abmeldungen.json` sagt es für dieses Haus
schon — „Handelsende = letzte Kerze mit Umsatz im Tagesarchiv, NIE das Listendatum der
Schnittstelle". Die Liste kennt Fehlalarme, siehe 9b.1(2).)*

**Ergänzung 2 — 20 Handelstage Nachlauf.** Ein Tag ist nur ziehbar, wenn dem Symbol danach
noch **mindestens 20 volle Handelstage** in `tagesdaten` folgen. *(Begründung: die letzten
Wochen vor einem Delisting sind die Abwicklungsphase — Übernahmeangebot angenommen, Handel
dünn, Spanne auf dem Cent-Boden oder weit offen. Sie zu messen und „so handeln Verschwundene"
zu nennen, wäre ein Ausschluss auf die Zielgröße mit umgekehrtem Vorzeichen. Die Zahl 20 ist
das Fenster der Umsatzregel aus `liquide.js`, keine neue Setzung.)* **Was diese Ergänzung
kostet, wird ausgewiesen:** 44 Symbole in 2025 und 216 in 2026 fallen dadurch (oder wegen
zu weniger Handelstage im Jahr) heraus.

**Ergänzung 3 — die Jahre 2016–2024 entfallen**, aus dem Grund in 9b.1(1). Sie werden nicht
als leere Zellen geführt, sondern als **nicht messbar** berichtet.

### 9b.3 Die Ziehung, gezählt — vor dem ersten Abruf

| Jahr | Klasse | verfügbar (Rahmen C) | gezogen | Rahmen A verfügbar | Anteil am damaligen Universum |
|---|---|---|---|---|---|
| 2025 | 5-50 | 158 | **100** | 1.152 | **12,1 %** |
| 2025 | 50-250 | 42 | **42** (Vollerhebung) | 719 | 5,5 % |
| 2025 | 250-1000 | 4 | **4** (Vollerhebung) | 257 | 1,5 % |
| 2025 | ab1000 | 0 | 0 | 57 | 0 % |
| 2026 | 5-50 | 66 | **66** (Vollerhebung) | 990 | 6,3 % |
| 2026 | 50-250 | 23 | **23** (Vollerhebung) | 795 | 2,8 % |
| 2026 | 250-1000 | 6 | **6** (Vollerhebung) | 312 | 1,9 % |
| 2026 | ab1000 | 0 | 0 | 79 | 0 % |

Herausgefallen: **ohne Anker** 93 (2025) / 5 (2026), **unter 5 Mio $** 823 / 848,
**zu wenige ziehbare Tage** 44 / 216.

> **Die Klasse `ab1000` ist leer, und das ist ein Befund, keine Lücke.** Kein einziger der
> 1.164 verschwundenen Werte hatte am Jahresanker einen Median-Tagesumsatz über 1.000 Mio $.
> Für diese Klasse sagt Zusatz C **gar nichts** — auch nicht „kein Unterschied".

| | |
|---|---|
| Zeitpunkte (Symbole × 5 Tage × 3 Fenster) | **3.615** |
| Placebo (jeder 25. `mitte`-Zeitpunkt, wie §9a) | **49** |
| **Abrufe gesamt** | **3.664** |
| Laufzeit bei der Ratenbremse 180/min | **20 Minuten** |
| Laufzeit bei den im Hauptlauf real gemessenen 102/min | **36 Minuten** |

**Registriert wird die volle Ziehung.** Sie kostet eine halbe Stunde; eine Verkleinerung
hätte keinen Grund und wäre nur ein zweiter Freiheitsgrad. *(Zum Vergleich: Rahmen A brauchte
55.455 Abrufe und neun Stunden.)*

### 9b.4 Endpunkt und Entscheidungsregel — vor dem Lauf

**Zielgröße unverändert (§3):** `(ap − bp) / mid × 100` in Pp je Umlauf. **Primärer
Schätzer unverändert:** erst je Symbol der Median über seine Zeitpunkte, dann der Median
über die Symbole. **Unsicherheit unverändert:** Cluster-Bootstrap über Symbole,
1.000 Ziehungen, 95-%-Perzentilband, Saat 20260902. **Zellen mit weniger als 10 Symbolen
tragen kein Band, sondern den Vermerk „zu dünn"** (§2) — das trifft `250-1000` in beiden
Jahren (4 und 6 Symbole).

**Die Differenz je Zelle** wird als eigener Schätzer gebildet: in jeder der 1.000 Ziehungen
werden **beide Seiten unabhängig** neu gezogen (ganze Symbole mit Zurücklegen, Rahmen C aus
den Symbolen von Rahmen C, Rahmen A aus denen von Rahmen A), und die Differenz der beiden
Symbol-Mediane wird verteilt. Berichtet wird `Median(C) − Median(A)` mit dem
95-%-Perzentilband dieser Verteilung.

> **Entscheidungsregel, vorab:** *„Verschwundene handeln breiter als Überlebende"* gilt als
> **belegt**, wenn das Band der Differenz **die Null ausschließt** und die Differenz positiv
> ist. Schließt es die Null ein, lautet der Befund **„nicht entscheidbar"** — nicht
> „kein Unterschied". Ist die Differenz negativ und das Band schließt die Null aus, ist das
> ein **Befund in die andere Richtung** und wird als solcher berichtet.

**Primäre Zellen — vorab benannt, damit nicht hinterher die günstigste gewählt wird:**
das Fenster **`mitte`**, die Klassen **5-50** und **50-250**, die Jahre **2025 und 2026
gepoolt**. Das sind **zwei** Differenzen. Alles andere — die anderen beiden Fenster, die
Jahre einzeln, die Klasse `250-1000` — steht **nachrichtlich daneben, nie statt dessen**.
*(Grund: 12 bandfähige Zellen bei 95 % erzeugen im Mittel eine halbe falsche Ausschließung.
Wer alle zwölf ansieht und die auffälligste meldet, misst seinen eigenen Blick.)*

**Berichtsform:** `ERGEBNIS-ZUSATZ-C.md`, eigene Datei. Die Tabellen von Rahmen C stehen
**getrennt** von denen des Rahmens A; in keiner Zeile stehen beide Rahmen gemischt in einer
gemeinsamen Zahl.

### 9b.4a Der Cent-Boden trifft diesen Vergleich härter als den Hauptrahmen — vorab

Aus dem Tagesarchiv gezählt, **vor** jedem Spannenabruf: die Verschwundenen sind in der
Klasse `5-50` nicht nur dünner, sondern **billiger**.

| Klasse | Median-Kurs Rahmen C | Median-Kurs Rahmen A (`ERGEBNIS.md` §2.1) | Verhältnis |
|---|---|---|---|
| 2025 · 5-50 | **17,76 $** | 29,00 $ | **1,63 ×** |
| 2026 · 5-50 | **19,63 $** | 27,46 $ | **1,40 ×** |
| 2025 · 50-250 | 61,83 $ | 64,82 $ | 1,05 × |
| 2026 · 50-250 | 54,92 $ | 63,11 $ | 1,15 × |
| 2025 · 250-1000 | 162,24 $ | 151,54 $ | 0,93 × |
| 2026 · 250-1000 | 110,62 $ | 151,19 $ | 1,37 × |

`ERGEBNIS.md` §2.0: die kleinste Preisstufe ist 1 Cent, und eine Cent-Spanne ist bei Kurs K
genau `100/K × 0,01` Pp. **Ein Wert zu 17,76 $ hat allein deshalb eine um Faktor 1,63 breitere
Bodenspanne als einer zu 29,00 $** — ohne dass Liquidität, Sterblichkeit oder irgendetwas
anderes im Spiel wäre. In der primären Klasse `5-50` ist damit ein großer Teil einer etwaigen
Differenz **vorhersehbar Arithmetik**.

**Wie damit umgegangen wird — festgelegt, bevor gemessen wird:**

1. **Nichts wird bereinigt, gewichtet oder ausgeschlossen.** Wie in §9a: berichtet, nicht
   verrechnet.
2. **Je Zelle und Seite** stehen **Median-Kurs**, **Anteil am Cent-Boden** und die
   **Bodenspanne** `100/Median-Kurs × 0,01` in der Tabelle. Die Bodenspanne ist die
   arithmetische Untergrenze der Zelle; wer die Differenz liest, sieht daneben, wie viel
   davon schon der Kurs erklärt.
3. **Eine nachrichtliche Gegenprobe, hier vorab benannt** (damit sie nicht hinterher
   gewählt wird): dieselbe Differenz, gerechnet nur auf Symbolen, deren Median-Kurs im Band
   **10–50 $** liegt — dem Bereich, in dem beide Rahmen Masse haben. Sie steht
   **nachrichtlich daneben, nie statt dessen**, und sie ändert die primären Zellen nicht.

> **Vorrangregel:** Ist die gemessene Differenz kleiner als der Unterschied der beiden
> Bodenspannen, lautet der Befund nicht „Verschwundene handeln breiter", sondern
> **„der Unterschied ist Kurs, nicht Sterblichkeit"** — und wird so berichtet.

### 9b.5 Kontrollen — vorab, in derselben Blickzeile wie das Ergebnis

| Kontrolle | Soll | Wenn verfehlt |
|---|---|---|
| **Positivkontrolle (Rahmen A nachgerechnet)** | `auswertenC.js` rechnet beide Seiten mit **derselben** Funktion; für Rahmen A, Fenster `mitte`, ab 2021 müssen exakt die vier Mediane aus `ERGEBNIS.md` §3 herauskommen: **0,1569 · 0,0854 · 0,0647 · 0,0449** | **Abbruch, keine Zahl wird berichtet** |
| **Lebenszeit-Kontrolle** | Zu jeder Zeile wird `letzterHandelstag` mitgeschrieben; kein gemessener Zeitpunkt liegt danach, und keiner liegt in den letzten 20 Handelstagen davor | Befund, und die betroffenen Zeilen werden **ausgewiesen**, nicht still verworfen |
| **Zeitstempel-Kontrolle (iex-Falle, §1.1)** | Zu jeder Zeile wird der gelieferte Zeitstempel `tq` mitgeschrieben; der Versatz zum angefragten Zeitpunkt ist **nie negativ** und wird als Median/p90/max ausgewiesen | Befund, alle Zahlen tragen den Vermerk |
| **Placebo (vorbörslich)** | 08:00 ET, jeder 25. `mitte`-Zeitpunkt: Median **mindestens doppelt** so breit wie `mitte` derselben Symbol-Tage (Schwelle wie §7, Faktor 2) | **Befund, kein Abbruch**, aber alle Zahlen tragen den Vermerk |

**Ausschlussregeln unverändert (§7):** `bp = 0`, `ap = 0`, gekreuzt und „kein Quote" zählen
als **fehlend**; gesperrte Märkte (`bp = ap`) zählen als **Spanne 0** und werden nicht
ausgeschlossen; **kein Ausschluss nach Höhe der Spanne**. Fehlanteil über 20 % je Zelle →
Warnvermerk. **Erwartet wird hier ein deutlich höherer Fehlanteil als in Rahmen A** (0,7 %):
dünne, sterbende Werte haben öfter keinen Quote im 5-Minuten-Fenster. Das ist ein Ergebnis,
kein Fehler — und es wird je Zelle ausgewiesen, weil eine Zelle mit 30 % Ausfall etwas
anderes bedeutet als eine mit 1 %.

### 9b.6 Was Zusatz C NICHT sagen wird — vorab

- **Keine Aussage über 2016–2024.** Es gibt keine Balken (9b.1). Die Haupttabellen behalten
  für diese Jahre den Vermerk „misst Überlebende", unverändert.
- **Keine Hochrechnung auf die frühen Jahre.** Der Anteil der Verschwundenen am Universum
  (§9b.3) ist für 2025/2026 gezählt; für 2016–2024 ist er **unbekannt**, und ein für 2025
  gemessener Aufschlag wird nicht rückwärts fortgeschrieben.
- **Keine neue Hürde.** Der Abschnitt „Was das für die Hürden heißt" rechnet aus, um wie viel
  die Hürde je Klasse höher läge, wenn die Verschwundenen im Verhältnis ihres gezählten
  Anteils eingerechnet würden — als **Größenordnung**. Diese Zahl wird **nicht** in
  `wiki/kosten.md` als Hürde eingetragen und ersetzt keine Zeile der Haupttabellen.
- **Nichts über `ab1000`.** Die Klasse ist in Rahmen C leer.
- **Kein Ertragsbeleg.** Eine breitere oder engere Spanne belegt keine Kante.
- **Nicht die effektiven Kosten**, nicht die Tiefe — §9 gilt wörtlich weiter.
