# Befund: Alpaca-Vollsammlung (Stufe Z1c) — 03.09.2026

**Rolle Bau + Berechnungen.** Auftrag PM/Wilhelm 03.09.2026: Minutenbalken für das ganze
Universum seit 2016, einschließlich der verschwundenen Werte, als dauerhaftes Rohdatenarchiv mit
abgeleiteter bereinigter Kopie. Vorgaben: „Haben ist besser als brauchen" und Skalenkonvention
**„beides"** (`wiki/entscheide.md`).

**Zustand: Werkzeug gebaut und geprüft, Testlauf gefahren und bestanden, Universum gezählt,
Vollauf NICHT gefahren** (er läuft nachts in Wilhelms Terminal, Startbefehl unten). Alles lokal
committet, nicht gepusht, keine Version, keine Release-Notiz — kein App-Code.

---

## 0. Vorbedingungen

Beide erfüllt und vor dem ersten Handgriff geprüft:

| Vorbedingung | Beleg |
|---|---|
| Z1 geliefert | `uebergabe/archiv-z1-2026-09-03.md` — Format 2, Migration ausgeführt, Nachholer gelaufen |
| Nachholer gelaufen **und repariert** | `uebergabe/nachholer-reparatur-2026-09-03.md` — Eichung MNST 2,000000 / SPGI 1,057000, Skalenabweichungen 68 → 0 |

Aus der Reparatur stammt der Satz, auf dem die ganze Ableitung steht: **keine
Alpaca-Bereinigungseinstellung entspricht Yahoo.** Yahoo bereinigt Intraday die Kurse, nicht die
Umsätze, und nicht um Dividenden. Deshalb wird `raw` gesammelt und lokal gerechnet.

---

## 1. Der Maßnahmen-Endpunkt: trägt — mit einer Lücke, die genau benannt ist

`GET /v1/corporate-actions`, zwei Abrufe, Kriterien K1–K5 **im Code vor dem Lauf**
(`probe-massnahmen.js`, Ergebnis `probe-massnahmen-ergebnis.json`).

| | Ergebnis |
|---|---|
| **K1** Endpunkt antwortet auf der Gratisstufe | ✅ HTTP 200, kein Tarif-Nein |
| **K2** MNST Split 2:1 mit Wirkung 11.08.2026 | ✅ `forward_splits`, `ex_date` 2026-08-11, `old_rate` 1, `new_rate` 2 → **Faktor 2,000** |
| **K3** SPGI Abspaltung ~01.07.2026 | ✅ `spin_offs`, `ex_date` 2026-07-01, `new_symbol` MBGL |
| **K4** Reichweite bis 2016 | ✅ AAPL-Split 4:1 am 31.08.2020, NVDA-Split 4:1 am 20.07.2021 |
| **K5** jeder Split-/Abspaltungssatz trägt Datum **und Faktor** | ❌ **GEFALLEN** — an genau einem Satz: der Abspaltung |

**K2 ist die eigentliche Nachricht.** Der Faktor 2,000 aus dem Endpunkt ist dieselbe Zahl, die
die Skalenreparatur am Vortag **unabhängig aus den Kursen** gemessen hat (Median raw/Yahoo über
48 Tage: 2,000000). Zwei Wege, ein Ergebnis — das ist die Positivkontrolle, dass die
Maßnahmentabelle und das Kursarchiv dieselbe Welt beschreiben.

**K5 ist gefallen, und zwar auf der Sache, die zählt.** Die SPGI-Abspaltung trägt
`source_rate: 1` und `new_rate: 1` — „für ein SPGI-Stück ein MBGL-Stück". Das ist ein
**Stückverhältnis, kein Kursfaktor**. Der gemessene Kursfaktor war **1,057**, und aus „1 : 1" ist
er nicht auszurechnen: er hängt am Kurs des abgespaltenen Papiers am Wirkungstag.

**Nachgefragt, ob das ein Sonderfall ist** (`probe-spinoff-form.js`, ein Abruf, sieben
Abspaltungen 2019–2026):

| Abspaltung | ex_date | source_rate | new_rate | Kursfaktor daraus? |
|---|---|---|---|---|
| GE → WAB | 25.02.2019 | 1 | 0,005371 | nein |
| GE → GEHC | 04.01.2023 | 1 | 0,33333 | nein |
| GE → GEV | 02.04.2024 | 1 | 0,25 | nein |
| MMM → SOLV | 01.04.2024 | 1 | 0,25 | nein |
| T → WBD | 11.04.2022 | 1 | 0,24192 | nein |
| SPGI → MBGL | 01.07.2026 | 1 | 1,0 | nein |

**Kein Sonderfall, sondern die Form.** Splits tragen einen Kursfaktor, Abspaltungen nie.

**Folge, wie im Auftrag vorgeschrieben:** ein Wert mit Abspaltung bleibt aus der bereinigten Kopie
**aus** und wird gelistet. Sein Faktor wird **nicht** aus der Rohreihe geraten — ein Sprung von
−5 % kann eine Abspaltung sein oder eine Gewinnwarnung, und die Rohreihe weiß es nicht.

> **Offene Chance, nicht umgesetzt** (wäre über den Auftrag hinaus): der Faktor **ist** aus der
> Quelle messbar, nur nicht aus dem Maßnahmen-Endpunkt. Die Skalenprobe vom 03.09. zeigt für SPGI
> `all`/`Yahoo` = 0,99753 gegen `raw`/`Yahoo` = 1,05700 und `dividend`/`raw` = 0,99776 — das
> Verhältnis `all` ÷ `dividend` isoliert Split **und** Abspaltung und ergibt 1,0572. Zwei
> Zusatzabrufe je betroffenem Wert und Fenster würden die Lücke schließen. Das ist ein Entscheid,
> kein Handgriff: er kostet einen zweiten Abruf, den Wilhelms Konvention ausdrücklich ausschließt.
> Steht als eigener Auftrag in `wiki/offene-auftraege.md`.

---

## 2. Drei Fallen, gefunden **vor** dem ersten geschriebenen Byte

Alle drei hätten still Schaden angerichtet, keine wäre beim Lesen des Codes aufgefallen.

1. **`CON` steht im eingefrorenen Universum und ist ein Windows-Gerätename.** `mkdir CON`
   schlägt fehl, gleich wie tief der Pfad liegt (ebenso `PRN`, `AUX`, `NUL`, `COM1‑9`, `LPT1‑9`).
   Der Lauf wäre irgendwo mitten in der Nacht an einem Symbol gestorben.
2. **`HIW`/`HIw`, `KW`/`Kw`, `ADSW`/`ADSw` sind je zwei verschiedene Wertpapiere.** Windows
   unterscheidet Groß- und Kleinschreibung im Dateinamen nicht — beide wären in **einem** Ordner
   gelandet, zwei Unternehmen in einer Reihe, ohne Fehlermeldung.
3. **Der Gratis-Tarif verweigert die jüngsten SIP-Daten — und zwar die ganze Anfrage.**
   `HTTP 403 "subscription does not permit querying recent SIP data"`. Nicht „die letzten Balken
   fehlen", sondern: **nichts.** Ein `end` von heute macht eine Anfrage über zehn Jahre wertlos.
   Der erste Testlauf lief in genau das hinein (10 von 10 Werten Fehler); der Nachholer war nie
   betroffen, weil er nur alte Zeiträume anfragte.

Regel gegen (1) und (2): ein Kürzel, das nicht rein aus Großbuchstaben, Ziffern und Punkten
besteht oder ein Gerätename ist, bekommt einen Kurzstempel seines **exakten** Namens angehängt
(`CON` → `CON_7679a0`, `HIw` → `HIw_…`). Weil der Stempel über die genaue Schreibweise gebildet
wird, bleibt die Abbildung auch bei reinen Schreibweise-Unterschieden eindeutig — maschinell über
alle 8.345 Werte geprüft: **0 Kollisionen**. Die vollständige Abbildung steht in
`alpaca1m/_symbole.json`; die Wahrheit steht ohnehin als `sym` im Datei-Rumpf.

Gegen (3): jedes Abruf-Ende wird auf *jetzt minus 30 Minuten* gekappt (15 wären die Sperre, die
übrigen 15 decken die Nachkorrektur fertiger Balken). Das laufende Jahr gilt darum **nie** als
fertig und wird an einem späteren Tag neu geholt.

**Ein vierter Fund, aus dem Code selbst:** die Jahresgrenze muss die **ET**-Mitternacht sein, nicht
die UTC-Mitternacht. Mit UTC-Grenze fielen die Nachbörsen-Balken des 31.12. (ET-Abend = 1.1. UTC)
in **zwei** Jahresdateien. Doppelte Kerzen bekommt man aus einem append-only-Archiv nicht mehr
heraus, ohne alles neu zu holen.

---

## 3. Testlauf — alle Kontrollen mit Zahlen

10 Werte (MNST, SPGI, ARM, BRK.B, AAPL, MU, ORCL, **CON**, **HIw**, **AABA**), Jahr 2026; dazu
AAPL und MNST für 2025, weil im Fenster Jan–Sep 2026 **kein einziger Halbtag** liegt und die
Halbtags-Kontrolle sonst nichts geprüft hätte.

### 3.1 Balkenzahl je Tag

| Wert | Kerzen 2026 | Tage | reguläre Balken/Tag (min / Median / max) | Tage mit genau 390 |
|---|---|---|---|---|
| AAPL | 133.538 | 169 | 307 / **390** / 390 | 168/169 |
| MU | 155.700 | 169 | 307 / **390** / 390 | 168/169 |
| ORCL | 139.295 | 169 | 307 / **390** / 390 | 168/169 |
| BRK.B | 87.506 | 169 | 307 / **390** / 390 | 163/169 |
| ARM | 100.310 | 169 | 307 / **390** / 390 | 121/169 |
| MNST | 68.652 | 169 | 307 / **390** / 390 | 123/169 |
| SPGI | 68.574 | 169 | 307 / **390** / 390 | 100/169 |
| CON | 47.867 | 169 | 166 / 279 / 387 | 0/169 |

**Kein einziger Tag über der Sollzahl** (`abweichend: []` über alle 1.352 Wert-Tage). Der
Minimalwert 307 ist **derselbe Tag** bei allen — der laufende, von der Tarif-Kappung
abgeschnittene 03.09. Weniger als 390 an anderen Tagen heißt: Minuten ohne Handel liefern keinen
Balken; bei CON (Kleinwert) ist das der Normalfall, bei AAPL kommt es nicht vor.

**Halbtage (aus 2025, Kalender der Quelle):**

| Tag | Kalender | reguläre Balken AAPL | MNST |
|---|---|---|---|
| 03.07.2025 | 09:30–13:00 = 210 Min | **210** | **210** |
| 28.11.2025 | 09:30–13:00 = 210 Min | **210** | **210** |
| 24.12.2025 | 09:30–13:00 = 210 Min | **210** | **210** |
| 247 Volltage AAPL | 09:30–16:00 = 390 Min | 390 / 390 / 390, **247 von 247 genau 390** | |

Der Kalender führt über 2016–2026 **2.765 Handelstage, davon 23 Halbtage**. Die Regel ist also
nicht gegenstandslos, sie hatte im Testfenster nur keinen Fall.

### 3.2 Gegen Yahoo — und warum gegen die **5m**-Datei

Die Yahoo-Kerzen im 1m-Archiv reichen für MNST/SPGI nur bis **18.08.2026** zurück. Der
MNST-Split war am **11.08.**, die SPGI-Abspaltung am **01.07.** — die im Auftrag verlangte
Positivkontrolle „roh gegen Yahoo muss vor dem 11.08. Faktor 2 zeigen" ist auf der 1m-Datei
**nicht fahrbar**, es gibt dort keinen einzigen Yahoo-Balken von vorher. Im 5m-Archiv liegen
Yahoo-Kerzen ab **02.06.2026** (48 Tage vor dem Split, 20 vor der Abspaltung). Also werden die
eigenen Minutenbalken auf das 5m-Gitter verdichtet und dort verglichen.

Verglichen wird **ausschließlich gegen Kerzen mit Quelle `yahoo`**: die Archivdateien enthalten
seit dem Nachholer selbst Alpaca-Kerzen. Alpaca gegen Alpaca zu halten wäre eine Tautologie, die
immer besteht.

| Wert | Vergleich | vor der Maßnahme | ab Wirkung | Urteil |
|---|---|---|---|---|
| **MNST** | **roh** / Yahoo, 5m | **2,000000** (48 Tage) | **1,000000** (16 Tage) | Positivkontrolle ✅ — der Sprung sitzt exakt auf dem 11.08. |
| **MNST** | **bereinigt** / Yahoo, 5m | **1,000000** | **1,000000** | ✅ **0 von 64 Tagen außerhalb 0,999–1,001**, größte Abweichung **1,45 · 10⁻⁸** |
| **MNST** | bereinigt / **roh**, Umsatz | **2,000000** | | ✅ Umsatz verdoppelt, wie ausgelegt |
| **SPGI** | **roh** / Yahoo, 5m | **1,057000** (20 Tage) | **1,000000** (44 Tage) | Abspaltung real und messbar ✅ |
| **SPGI** | bereinigt | — | — | **keine Kopie** (§1: kein Kursfaktor aus der Quelle) |
| ARM | roh / Yahoo, 5m | 1,000000 (70 Tage) | | ✅ |
| BRK.B | roh / Yahoo, 5m | 1,000000 (64 Tage) | | ✅ |
| AAPL / MU / ORCL | roh / Yahoo, 5m | 1,000000 (je 70 Tage) | | ✅ |

**Umsatz roh/Yahoo** (der gewöhnliche Quellenunterschied, kein Urteil): 1m 0,9996–1,0076,
5m 1,0000–1,0048. Innerhalb der 0,8–1,25, die die Balken-Probe als Band gesetzt hatte.

**Die Ableitung über Jahresgrenzen hinweg** (MNST, Split 11.08.2026):

| Datei | Kerzen | roh/bereinigt = 2 | = 1 | dazwischen |
|---|---|---|---|---|
| MNST/2025.json | 100.208 | **100.208** | 0 | **0** |
| MNST/2026.json | 68.652 | **61.285** | 7.367 | **0** |

Eine saubere Stufe, kein Verschmieren: 2025 liegt vollständig vor der Maßnahme, 2026 teilt sich
exakt am Wirkungstag.

### 3.3 Die übrigen Kontrollen

| Kontrolle | Ergebnis |
|---|---|
| Zeitstempel = Balkenöffnung | **801.442 von 801.442** auf der vollen Minute, **0 Verstöße** |
| Kein Balken außerhalb der Lebenszeit | **0 Verstöße** |
| **Placebo:** Feiertag liefert 0 reguläre Balken | **10 Feiertage** im Fenster, **0** mit regulären Balken |
| Balken an Tagen, die der Kalender nicht führt | **0** — die Sitzungsmarke `ausserhalb` kommt in der Praxis nicht vor |
| Kürzel-Wiederverwendung | AABA (delistet 07.10.2019) liefert **keine** Balken 2026 → keine `~2`-Reihe, richtig |
| Windows-Fallen im echten Lauf | CON → `alpaca1m/CON_7679a0/`, HIw eigener Ordner, beide geschrieben |

---

## 4. Sperrklinken und Gegenproben

**test-v6, Block 35 erweitert** (die Vollsammlung steht jetzt in derselben Liste wie Balken-Probe,
Skalen-Probe und Nachholer, erbt also deren vier Zusagen: Zugang nur über `schluessel.js`, keine
eigene Umgebungslesung, jede Ausgabe durch `verdecken()`, nie `feed=iex`). Neu dazu:
Schreibziele (strukturell **und** an einem echten Lauf), Ableitung, Ringverteilung,
Fortsetzbarkeit nach Abbruch, Windows-Fallen, Tarif-Kappung, Leck-Test in der Kette
(`leckDurchreiche → leckSpannen → leckZ1 → zusatzC → Maßnahmen-Probe`).

Die **42 Zusicherungen der werkzeugeigenen Kontrolle** laufen in der Suite mit. `npm test` grün.

**Ein Fund dabei:** die alte `feed=sip`-Klinke verlangte von *jeder* Datei der Liste ein
`feed=sip`. Die Maßnahmen-Probe fragt `/v1/corporate-actions` ab — dort gibt es keinen Feed. Die
Klinke wurde an einer korrekten Datei rot: sie prüfte nicht, worum es geht. Jetzt lautet sie „wo
ein Feed gewählt wird, ist es sip — und nie iex".

**Gegenproben in isolierter Kopie** (`git archive`, nie im geteilten Arbeitsbaum —
`gegenprobe.sh`, Protokoll `gegenprobe-2026-09-03.log`): **13 Eingriffe, 13-mal rot.**

| | Eingriff | rot geworden ist |
|---|---|---|
| G1 | Umsatz wird geteilt statt malgenommen | E2/E4 (Gegenwert bleibt erhalten) |
| G2 | aus einer Abspaltung wird doch ein Faktor gemacht | D3/D5 |
| G3 | Maßnahme wirkt auf die Kerzen **danach** statt davor | E1/E3/E5 |
| G4 | Ringverteilung läuft vom ältesten Jahr aufwärts | G1/G2 |
| G5 | Ordnername ist wieder einfach das Kürzel | A3/A4/A6 |
| G6 | Abruf-Ende wird nicht mehr gekappt | K1 |
| G7 | Jahresgrenze wieder auf UTC-Mitternacht | J2/J3 |
| G8 | Lücken-Wache fällt weg | F2 |
| G9 | 5m-Verdichtung summiert den Umsatz nicht | H1 |
| G10 | Yahoo-Vergleich nimmt **alle** Kerzen (Tautologie) | Block 35 |
| G11 | Vollsammlung schreibt ins Yahoo-Archiv | Block 35 |
| G12 | abgebrochene Aufgabe wird nicht neu geholt | Block 35 |
| G13 | `verdecken()` aus der Maßnahmen-Probe ausgebaut | Leck-Test |

**Zwei Anläufe waren nötig, und das ist der Ertrag:** beim ersten Durchgang meldeten vier
Gegenproben „grün". Keine davon war eine blinde Klinke — **alle vier waren kaputte Gegenproben**:
drei scheiterten an Windows-Pfaden in `node -e` (die bekannte Falle aus `wiki/fehlerformen.md`:
`/tmp/x` ist für node `C:\tmp\x`), eine ersetzte über einen Zeilenumbruch hinweg und traf nichts.
Eine Gegenprobe, die nicht ankommt, sagt „die Klinke greift nicht" und meint „ich habe nichts
getan". Deshalb prüft `probe_t6()` jetzt **zuerst, ob der Eingriff überhaupt angekommen ist**,
bevor sie ein Urteil fällt.

---

## 5. Das Universum

*(Zahlen: siehe Abschnitt 6 — sie stammen aus der Zählung, nicht aus einer Schätzung.)*

| Gruppe | Werte | Herkunft |
|---|---|---|
| (a) eingefrorenes Universum, Aktien | **3.232** | `massive/universum-2024-09-02.json` (nur gelesen) |
| (c) die 31 ETFs | **31** | `kerzenquelle.js ETFS` |
| (b) verschwundene, aktienartig, nicht vor 2016 erloschen, ohne Doppeleinträge | **5.082** | `massive/verschwundene.json` × `wertpapierarten.json` |
| **gesamt** | **8.345** | |
| (d) Krypto | **0** | eigene Quelle, eigener Ordner, bleibt Yahoo |

**Drei Anmerkungen, die man den Zahlen nicht ansieht:**

- **Die 31 ETFs stehen sämtlich schon im eingefrorenen Universum** (31 von 31 geprüft). Gruppe (c)
  ist damit eine Kennzeichnung, keine zusätzliche Menge — die Summe wäre sonst um 31 zu hoch.
- **258 Werte stehen in beiden Listen**: sie waren am Stichtag 02.09.2024 im Universum und sind
  seither erloschen. Alle 258 haben ein Delisting-Datum **nach** dem Stichtag, sind also
  dieselbe Reihe und werden **einmal** gesammelt, nicht zweimal.
- **1.563 verschwundene Werte fallen vorab weg**, weil ihr Delisting-Datum vor dem 01.01.2016
  liegt — für sie kann es keine Balken ab 2016 geben. Alles andere über „seit 2016 gehandelt"
  entscheidet die Quelle selbst (Phase L), nicht die Liste.
- **184 Kürzel tragen Kleinbuchstaben** — 173 Bezugsrechte (`…w`), 8 Vorzüge (`…pX`), 3 sonstige.
  Sie sind in der Liste als CS/ADRC geführt, aber Alpaca schreibt sie anders (`HIW.W` statt
  `HIw`). Sie werden trotzdem angefragt („alles sammeln"); ein leeres Ergebnis ist dann ein
  Befund, kein Fehler.

### Schreibweisen-Abbildung

| Fall | Anzahl | Beispiel |
|---|---|---|
| Kürzel = Ordnername | 8.160 | `AAPL` → `AAPL` |
| davon mit Punkt (unverändert) | 28 | `BRK.B` → `BRK.B` — **Alpaca schreibt `BRK.B`, Yahoo `BRK-B`**; die Massive-Listen und das Archiv nutzen bereits die Punkt-Schreibweise, die Abbildung ist hier also die Identität. Die zwei übrigen Punkt-Kürzel tragen zusätzlich Kleinbuchstaben (`BBTpE.CL`) und fallen in die Zeile darunter |
| Gerätename | 1 | `CON` → `CON_7679a0` |
| Kleinbuchstaben (Kollisionsgefahr) | 184 | `HIw` → `HIw_…`, `NEEpS` → `NEEpS_f0f9c3` |
| **Kollisionen nach Abbildung** | **0** | maschinell über alle 8.345 geprüft |

---

## 6. Zählung — gezählt, nicht geschätzt

### 6.1 Phase L: die Lebenszeit kommt aus den Balken, nicht aus der Liste

**8.345 Abrufe, 0 Fehler, ~50 Minuten.** Ein Tagesbalken-Abruf je Wert (11 Jahre × 252 Tage =
2.772 Balken passen in eine Seite) sagt, ob die Quelle den Wert überhaupt führt, **in welchen
Jahren** er Balken hat — nur die werden geholt — und wo große Lücken liegen. Der Abruf spart ein
Vielfaches seiner selbst: ohne ihn würde jedes der elf Jahre jedes Werts angefragt, auch die
leeren. Statt 8.345 × 11 = 91.795 Symbol-Jahren bleiben **52.892**.

| Gruppe | angefragt | Quelle führt Balken | ohne Balken |
|---|---|---|---|
| (a) Universum, Aktien | 3.232 | **3.226** | 6 |
| (c) ETFs | 31 | **31** | 0 |
| (b) Verschwundene | 5.082 | **4.798** | 284 |
| **gesamt** | **8.345** | **8.055** | **290** |
| dazu zweite Reihen `~2` | | **3** | |

**Von den 290 leeren sind 184 die Kürzel mit Kleinbuchstaben — restlos alle.** Die Vorhersage aus
§5 ist damit gemessen: Alpaca führt Massives Schreibweise für Bezugsrechte (`AANw`) und Vorzüge
(`NEEpS`) nicht. Die übrigen 106 sind Werte, die Alpaca schlicht nicht kennt.

**Die 8.345 sind 18 weniger als die 8.363 aus der ersten Auszählung.** Die Verschwundenen-Liste
führt **18 Kürzel doppelt** — nicht als Wiederverwendung, sondern denselben Namen zweimal mit dem
Delisting-Datum um höchstens einen Tag versetzt (AC, ANSC, BACQ, BLDE, CUX, GRYP, HSON, LYRA …),
eine Unsauberkeit der Quelle. Ohne Zusammenlegen wäre jede Zählung um 18 zu hoch und jeder dieser
Werte zweimal geholt worden. Ob es doch echte Wiederverwendung ist, entscheidet der **Name**:
maschinell geprüft, **0 von 18 Paaren tragen verschiedene Namen**.

### 6.2 Kürzel-Wiederverwendung: drei Fälle, alle echt

| Kürzel | Träger bis | Stille | neu ab | Jahre Träger | Jahre `~2` |
|---|---|---|---|---|---|
| **AAC** | 06.11.2023 | 731 Handelstage | 27.08.2026 | 2016–2023 | 2026 |
| **CAPA** | 10.06.2021 | 1.358 Handelstage | 26.08.2026 | 2020–2021 | 2026 |
| **JONE** | 26.11.2018 | 2.026 Handelstage | 03.09.2026 | 2016–2018 | 2026 |

Alle drei sind Kürzel, die diesen August/September an ein **neues** Unternehmen vergeben wurden.
Ohne die Trennung hätte eine 2018 erloschene Firma die Minutenbalken einer 2026 neu notierten
Firma angehängt bekommen — und sähe damit aus, als hätte sie überlebt. Genau die Verzerrung, gegen
die diese Sammlung gebaut ist. Der Schnitt sitzt jeweils auf dem **letzten wirklich gehandelten
Tag**, nicht auf dem Listendatum (das liegt einen Tag später und trägt keinen Handel).

### 6.3 Der Umfang — aus einer Stichprobe gemessen

Die Zahl, an der alles hängt, kennt keine Liste: **Minutenbalken je Handelstag**. Sie schwankt um
mehr als das Zehnfache — AAPL hat jeden Tag alle 390 regulären Minuten plus ~400 außerbörslich,
ein erloschener Kleinwert vielleicht 30. Eine Hochrechnung aus den liquiden Werten des Testlaufs
(790/Tag) wäre um mehr als das Dreifache zu hoch, denn 5.082 der 8.345 Werte sind verschwundene
Kleinwerte.

Deshalb **gezogen statt geraten**: 60 Symbol-Jahre gleichverteilt aus genau dem Plan, der später
gefahren wird, feste Saat 20260903. Was dabei geholt wurde, ist echte Ware und bleibt liegen — die
Stichprobe ist ein Stück der Sammlung, kein Vorlauf.

| | |
|---|---|
| gezogen | 60 von 52.892 Symbol-Jahren |
| Handelstage in der Stichprobe | 13.976 |
| Kerzen in der Stichprobe | 3.390.228 |
| **Balken je Handelstag** | **242,6** |
| **Bytes je Kerze** | **46,3** |

**Hochgerechnet auf 11.985.827 Handelstage:**

| | |
|---|---|
| **Kerzen** | **2.907.461.813** (~2,9 Mrd) |
| **Abrufe** | **343.639** (52.892 Symbol-Jahre + 290.747 Seiten zu 10.000) |
| **Stunden bei 170/min** | **33,7** |
| **Bytes** | **134,6 GB** |
| Platz auf E: | 1,65 TB frei — reicht mit Faktor 12 |

Dazu einmalig Phase L (8.345 Abrufe, 0,8 h — **gefahren**) und Phase M (8.345 Abrufe, 0,8 h).
**Zusammen ~35 Stunden.** Bei 10 Stunden je Nacht sind das **vier Nächte**, bei 12 Stunden drei.

*Die frühere Schätzung im Wiki (~3 Mrd Kerzen, 150–250 GB, ~300.000 Abrufe, 2–3 Nächte) war gut
geraten — jetzt ist sie gemessen.*

**Bereits gesammelt** (Testlauf + Stichprobe, echte Ware, bleibt liegen): 70 Symbol-Jahre,
**4.480.266 Kerzen, 0,211 GB** — 0,13 % des Ziels.

---

## 7. Ablage

```
E:/Markt-Dashboard-Archiv/
  alpaca1m/                     (a) ROH, append-only, adjustment=raw
    <ORDNER>/<JAHR>.json          Format 2 + sitzungen + jahr
    _lebenszeit.json              Phase L: erster/letzter Balken, Jahre, Wiederverwendung
    _symbole.json                 Kürzel → Ordner, Gruppe
    _kalender.json                /v2/calendar 2016–2026 (2.765 Tage, 23 Halbtage)
    _fortschritt.json             erledigt / laufend, Abrufe, Fehler
    _stichprobe.json              die gemessene Hochrechnung
    _lauf.log                     Laufprotokoll mit Zeitstempel
  alpaca-massnahmen/<ORDNER>.json  (b) alle Arten, dazu anwendbar/ohneFaktor vorgerechnet
  alpaca1m-bereinigt/              (c) lokal abgeleitet, kein zweiter Abruf
    <ORDNER>/<JAHR>.json           + abgeleitet:'bereinigt', massnahmen[]
    _regel.json                    DIE LESEREGEL (siehe unten)
```

**Die Leseregel, und warum sie nötig ist:** die bereinigte Kopie existiert **nur für Symbol-Jahre,
an denen sich wirklich etwas ändert**. Eine byteidentische Zweitschrift von 150 GB wäre kein
Gewinn, sondern ein zweites Ding, das auseinanderlaufen kann. Wer bereinigte Kurse will, liest
also: *erst `alpaca1m-bereinigt/…`, und wo nichts liegt, `alpaca1m/…`*. Damit diese Regel nicht
nur in einer Übergabe steht, die in einem halben Jahr niemand mehr sucht, schreibt das Werkzeug
sie als `alpaca1m-bereinigt/_regel.json` an die Stelle, wo sie gebraucht wird — mitsamt der Liste
der Werte, die wegen einer Abspaltung **gar keine** Kopie haben.

---

## 8. Bekannte Abweichungen

1. **Der Vollauf ist nicht gefahren.** Er läuft nachts in Wilhelms Terminal oder wird vom PM
   losgelöst gestartet. Startbefehl unten.
2. **Werte mit Abspaltung haben keine bereinigte Kopie** (§1). Das ist die im Auftrag
   vorgeschriebene Behandlung, aber es heißt: die im Auftrag verlangte Yahoo-Kontrolle „auch für
   SPGI" kann für SPGI nicht bestehen — es gibt nichts zu vergleichen. Statt dessen ist gezeigt,
   dass die Abspaltung **real und exakt messbar** ist (Faktor 1,057000 über 20 Tage) und allein
   die Quelle den Faktor nicht herausgibt.
3. **Eine vierte Sitzungsmarke `ausserhalb`** — für Balken an Tagen, die der Kalender nicht als
   Handelstag führt. Der Auftrag nennt drei (`regulaer`/`vor`/`nach`). Einen solchen Balken
   `regulaer` zu nennen wäre eine Behauptung über eine Sitzung, die es nicht gab; ihn wegzuwerfen
   widerspräche „alles sammeln". Im Testlauf kam er **0-mal** vor.
4. **`satz()` in `kerzenquelle.js` baut die Hülle mit festem Feldsatz**; `sitzungen` und `jahr`
   werden danach angehängt. `kerzenquelle.js` bleibt unberührt — das ist App-Code, und dieser
   Auftrag ändert keinen. Die Quellenpflicht prüft `satz()` trotzdem mit.
5. **Die Zeitstempel-Kontrolle prüft „auf der vollen Minute", nicht „ist die Öffnung".** Dass `t`
   die Öffnung ist und nicht der Schluss, ist in der Balken-Probe vom 03.09. gemessen worden
   (390 reguläre Balken je Tag ab 09:30 ET); hier wird es vorausgesetzt und nur die Form geprüft.
6. **184 Kürzel mit Kleinbuchstaben werden voraussichtlich leer bleiben** (andere Schreibweise bei
   Alpaca). Sie werden trotzdem angefragt; wie viele wirklich leer sind, sagt Phase L.
