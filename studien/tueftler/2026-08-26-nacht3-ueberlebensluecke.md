# Nacht-Typ B — die Überlebenslücke des großen Archivs, vermessen

**Lauf:** 26.08.2026, 16:56–18:20 (dritter Tüftler-Lauf des Tages)
**Typ:** B (Datenbestand) — **kein neuer Strategie-Entwurf.** Begründung unten.
**Es wurde nichts gemessen.** Gezählt, abgefragt, gegengeprüft — keine Ertragsrechnung.

---

## Warum diese Nacht kein Entwurf

Die Warteschlange stand bei **2** offenen Entwürfen, also formal kein Stau (Schwelle 3).
Trotzdem Typ B, aus drei Gründen, die zusammen schwerer wiegen als die Regel:

1. **Beide offenen Entwürfe messen dasselbe Fenster** (Sitzungsgrenze/über Nacht) auf
   demselben Korpus. Familienweit sind das schon 4 Tests → `delta80` 0,0429 Pp. Ein
   dritter Entwurf im selben Fenster verschlechtert die Auflösung der beiden
   bestehenden, ohne selbst etwas beizutragen.
2. **Beide warten auf dieselbe, noch nicht gebaute Vorbedingung** (`ausstieg`-Schalter).
   Ein dritter Wartender erhöht nur die Länge der Schlange.
3. Der Engpass dieses Projekts ist **nicht Ideenmangel**, sondern die Auflösungswand.
   Genau daran arbeitet Typ B.

---

## Die Frage dieser Nacht

Das große Kursarchiv auf `E:` (2.965 Werte täglich, zurück bis 1986) ist die Datenbasis
beider offener Entwürfe. Es enthält **nur Werte, die es heute noch gibt**. Wie groß ist
die dadurch entstehende Lücke, und lässt sie sich schließen?

Beides war bisher geschätzt. Jetzt ist beides gezählt.

---

## Befund 1 — die Lücke ist mindestens 12,7 %, und es sind ausschließlich Verlierer

Werkzeug: `studien/tueftler/werkzeug/zaehle-ueberlebende.js`
Ausgabe: `studien/tueftler/daten/zaehlung-ueberlebende-2026-08-26.txt`

Quelle für die Verschwundenen ist die vorhandene `massive/verschwundene.json`
(Stand 23.08.2026): 6.921 Einträge, **6.896 eindeutige Kürzel**, davon 6.682 mit
Delisting-Datum.

**Untere Schranke, ohne jede Annahme.** Die Liste führt bei **0 von 6.896** Einträgen ein
Listing-Datum. Damit lässt sich nicht sagen, wie viele Werte es in einem Jahr insgesamt
gab. Gezählt wird deshalb nur, wer **in genau diesem Jahr** verschwand — wer 2015
delistet wurde, handelte 2015 mit Sicherheit und fehlt im Archiv mit Sicherheit.

| Jahr | Archiv (hochgerechnet) | verschwand in dem Jahr | Anteil am Querschnitt |
|---|---|---|---|
| 2008 | 1.552 | 134 | 7,9 % |
| 2012 | 1.853 | 150 | 7,5 % |
| 2016 | 2.140 | 232 | 9,8 % |
| 2020 | 2.573 | 363 | 12,4 % |
| 2023 | 2.930 | 740 | **20,2 %** |
| 2025 | 2.965 | 550 | 15,6 % |

**Über das Bestätigungsfenster 2008–2026: mindestens 12,7 % des Querschnitts fehlen** —
und zwar ausschließlich Werte, die es nicht geschafft haben. Die wahre Lücke ist größer,
weil die Zählung jeden ignoriert, der schon vorher lebte und erst später verschwand.

Der Trend ist steigend: von ~8 % (2008) auf ~20 % (2023). Ein Rückwärts-Querschnitt aus
dem heutigen Archiv ist für die jüngeren Jahre **stärker** verzerrt, nicht schwächer.

**Für 1986–2004 gibt es nicht einmal eine Diagnose.** Die Delisting-Daten der Quelle
reichen nur bis **29.06.2004** zurück. Der Entwurf `nachtstoss-umkehr` beginnt 1986; für
seine ersten 18 Jahre ist unbekannt, wie viele Werte fehlen.

**Schnittmenge Archiv ∩ Verschwundene: 5 Kürzel** — siehe Befund 3, die sind alle falsch.

---

## Befund 2 — Yahoo führt die Verschwundenen nicht, und liefert trotzdem Kurse

Werkzeug: `studien/tueftler/werkzeug/pruefe-verschwundene-quelle.js`
Ablage: `studien/tueftler/daten/probe-verschwundene-quelle-2026-08-26.json`

46 verschwundene Werte, **geschichtet nach Delisting-Jahrgang** (2 je Jahr, 2004–2026),
gegen `query1.finance.yahoo.com/v8/finance/chart?range=max`:

| | |
|---|---|
| brauchbar | **1 von 46** (2,2 %) |
| leer (HTTP 404 oder 200 ohne Kerzen) | 37 |
| **fremdes Instrument unter demselben Kürzel** | **7** |
| läuft nach dem Delisting weiter | 1 |

Nach Jahrgang: **0 von 2 in jedem Jahr von 2004 bis 2025.** Der einzige Treffer ist
`AACB`, sechs Tage vor der Probe delistet und noch nicht abgeräumt.

**Der eigentliche Fund ist nicht die Leere, sondern was stattdessen kommt.** Acht Kürzel
lieferten Kerzen. Beim Nachsehen in den Metadaten:

| Kürzel | laut Liste | was Yahoo wirklich liefert |
|---|---|---|
| ICM | Internacional Ceram ADS (delistet 2004) | `MUTUALFUND`, Börse `YHD`, Währung `null`, ab 2011 |
| NOI | National Oilwell (2005) | `MUTUALFUND`, `YHD`, Währung `null`, ab 2015 |
| ABS | Albertson's (2006) | `MUTUALFUND` „3305691", `YHD`, ab 2018 |
| MUO | Pioneer Interest Shares (2007) | `MUTUALFUND` „10589", `YHD`, ab 2018 |
| ICO | International Coal Group (2011) | `MUTUALFUND`, `YHD`, ab 2014 |
| ABH | AbitibiBowater (2012) | `MUTUALFUND` „5441", `YHD`, ab 2000 |
| MHS | Medco Health Solutions (2012) | `MUTUALFUND` „Morningstar US Healthcare", `YHD` |
| AAGR | African Agriculture (2024) | **derselbe Emittent**, `EQUITY`, jetzt OTC statt NASDAQ |

**Sieben von acht sind gar keine Aktien.** Ein Nachlade-Lauf, der nur prüft „kam etwas
zurück", schreibt Fondskurse in ein Aktienarchiv — dieselbe Familie wie der Fund
*„zwei Quellen in einer Reihe"*, nur schlimmer, weil hier nicht einmal die Anlageklasse
stimmt. **Der Filter ist einfach und sicher:** `instrumentType === 'EQUITY'` verlangen und
Börse `YHD` verwerfen. Beide Merkmale liegen in derselben Antwort, die die Kurse liefert.

Der achte Fall (`AAGR`) ist kein Recycling, sondern eine echte Fortsetzung im OTC-Markt.
Verwertbar — aber ein anderes Handelssegment mit anderer Liquidität, das gehört
gekennzeichnet und nicht stillschweigend angehängt. **Meine erste Urteilsregel hat diesen
Fall falsch einsortiert** (sie sah nur „letzte Kerze weit nach dem Delisting"); die Regel
im Werkzeug ist korrigiert, der Instrumententyp schlägt jetzt die Kerzenzahl.

---

## Befund 3 — die Verschwundenen-Liste hat falsche Positive am jüngsten Rand

Fünf Kürzel stehen in beiden Listen: `AVB`, `EQR`, `LBRDA`, `LBRDK`, `WBS`, alle mit
Delisting-Datum 18.–21.08.2026 — also in den **fünf Tagen vor dem Listenabruf** (23.08.).

Gegenprobe bei Yahoo, heute:

| Kürzel | | Typ | Börse | letzte Kerze |
|---|---|---|---|---|
| AVB | AvalonBay Communities | EQUITY | NYSE | 2026-08-26 |
| EQR | Equity Residential | EQUITY | NYSE | 2026-08-26 |
| LBRDA | Liberty Broadband | EQUITY | NasdaqGS | 2026-08-26 |
| WBS | Webster Financial | EQUITY | NYSE | 2026-08-26 |

**Alle vier handeln heute an ihrer Heimatbörse.** Sie sind nicht delistet. Die Quelle
markiert Ticker bei Struktur-Ereignissen offenbar vorübergehend als inaktiv.

Von **33** Delistings im August 2026 sind damit **mindestens 5 falsch** — 15 % des
jüngsten Rands, und das ist eine untere Schranke: aufgefallen sind nur die, die auch im
Archiv liegen. **Wer die Liste ungeprüft als Ausschlussliste verwendet, wirft AvalonBay
und Equity Residential aus dem Universum** — eine Verzerrung in die Gegenrichtung.

**Regel:** Delistings der letzten ~30 Tage vor dem Listenstand sind unbestätigt und
gehören gegengeprüft, bevor sie irgendetwas ausschließen.

---

## Befund 4 — die zweite Quelle deckelt bei genau zwei Jahren

Gemessen an `api.massive.com/v2/aggs`, mit dem vorhandenen Schlüssel:

| Anfrage ab | Antwort |
|---|---|
| 2021-01-01 | HTTP 403 `NOT_AUTHORIZED` |
| 2023-11-13 | HTTP 403 |
| 2024-06-01 | HTTP 403 |
| **2024-08-25** | **HTTP 403** |
| **2024-08-27** | **HTTP 200**, 1 Kerze |
| 2024-09-03 | HTTP 200 |
| 2025-06-02 | HTTP 200 |

Meldung im Rumpf: *plan doesn't include this data timeframe*. Die Grenze liegt bei
**heute minus zwei Jahre**, auf den Tag genau, und wandert täglich mit.

**Die Positivprobe war nötig, nicht Zierde:** ohne sie hätte ich aus vier 403-Antworten
eine Zeitgrenze behauptet, wo genauso gut der Schlüssel tot sein konnte.

**Nebenfund, der jemanden angeht:** `tools/massive-tagesdaten.js` fragt fest ab
`2023-11-13` an. Die früheste erste Kerze im gesamten Bestand ist aber **2024-08-23**.
Bei einem Zeitraum, der die Grenze überlappt, antwortet die Schnittstelle **nicht** mit
403, sondern mit stillschweigend abgeschnittenen Daten. Die 1.164 abgelegten Dateien
sind also rund neun Monate kürzer, als das Werkzeug annimmt — ohne Warnung, ohne Vermerk
in der Datei. *Ein Lauf, der nichts dazulernt, sieht von außen aus wie ein gesunder Lauf.*

---

## Was daraus folgt

**Die Überlebenslücke des großen Archivs ist mit den vorhandenen Mitteln nicht
schließbar.** Nicht „mühsam", sondern nicht:

- Yahoo führt die Verschwundenen nicht (0 von 44 in den Jahrgängen 2004–2025) und
  liefert stattdessen in 7 von 46 Fällen ein Fremdinstrument.
- Die zweite Quelle reicht auf der bezahlten Stufe genau zwei Jahre zurück. Das
  Bestätigungsfenster der offenen Entwürfe beginnt 2008 bzw. 1986.
- Für 1986–2004 existiert nicht einmal die Liste, wer gefehlt hat.

**Das ist kein Grund, die beiden offenen Entwürfe zurückzuziehen** — aber es ist eine
Einschränkung, die in ihre Ergebnisse gehört, und ich trage sie in die Warteschlange ein.
Ob eine 12,7-%-Lücke aus Nicht-Überlebenden ein Übernacht-Querschnittssignal überhaupt in
eine Richtung schiebt, ist eine **Messfrage und ausdrücklich nicht meine**. Beim Momentum
hing rund die Hälfte des Vorsprungs an 30 solchen Werten (Kontrollmessung 23.08.); ob das
hier gilt, ist offen. Was feststeht: die Aussage „auf einem Universum ohne Rückschau
gemessen" darf für keinen der beiden Entwürfe fallen.

**Der einzige Weg, den die Zahlen offenlassen**, ist Geld — eine Stufe mit längerer
Historie. Das ist Wilhelms Entscheidung, nicht meine; ich lege sie als Vorschlag mit den
Zahlen in die Warteschlange, ohne Empfehlung zur Höhe.

---

## Was ich verworfen habe

- **Die Lücke aus der Liste hochrechnen** (alle Werte mit `bis` > Stichtag als „damals
  vorhanden" zählen). Ergab für 1990 eine Lücke von 92,7 % — offensichtlicher Unsinn,
  weil die SPAC-Welle 2020/21 dort mitgezählt wird. Ohne Listing-Datum ist die Zahl nicht
  zu haben; die Spalte ist aus dem Werkzeug entfernt statt mit einer Warnung versehen.
- **Yahoo-Nachladen als Auftragsvorschlag.** Naheliegend, aber nach Befund 2 würde es
  überwiegend Fremdinstrumente einsammeln.

## Eigene Fehler in diesem Lauf

1. Erste Fassung des Zählwerkzeugs meldete **mehr beschaffte Werte als es Dateien gibt**
   (1.186 gegen 1.164) — Einträge statt eindeutiger Kürzel gezählt; 25 Kürzel stehen
   mehrfach in der Liste. Korrigiert, beide Zahlen stehen jetzt bei 1.164.
2. Erste Urteilsregel der Quellenprobe hielt 8 Fälle für „Kürzel neu vergeben". Nach dem
   Nachsehen in den Metadaten sind es **7 Fremdinstrumente und 1 Segmentwechsel**.
   Korrigiert.
3. Der fest verdrahtete Archivpfad ging im Bash-Quoting verloren (`E:\M…` → `E:M…`) —
   der bekannte Fehler aus dem Katalog, in einem quoted Heredoc trotzdem aufgetreten.
   Das Werkzeug liest den Pfad jetzt aus `archiv1d-pfad.txt`.

**Firecrawl-Suchen verbraucht: 0 von 5.** Diese Nacht brauchte keine Literatur, sondern
Abfragen an die eigenen Quellen.

---

# Nachtrag 26.08. 18:40 — Befund 3 differenziert, ein Teil davon zurückgenommen

Der Projekt-Manager hat Befund 3 nachgemessen und einen Zusammenhang gefunden, den ich
nicht hatte: **dieselben fünf Kürzel hängen im Tagesarchiv zurück** (letzte Kerze 20./21.08.,
während 2.955 von 2.965 Reihen auf dem 25.08. stehen), zusammen mit fünf weiteren —
`TWO`, `WHLR`, `BSCO`, `IBDP`, `IBTE`. Der Wachhund meldete trotzdem „100 % auf Stand",
weil die Ausgabe 99,66 % rundet (`tools/archiv-wachhund.js:170,184`).

Ich habe daraufhin gefragt, was **Yahoo** für diese zehn im Fenster 16.–27.08.2026 führt.
Das trennt „Quelle hat nichts" von „Archiv holt es nicht" — zwei Ursachen, die im
Rückstand gleich aussehen.

| Kürzel | Typ | Kerzen bei Yahoo 17.–26.08. | Deutung |
|---|---|---|---|
| AVB, EQR, WBS, TWO | EQUITY | **8** (lückenlos, bis 26.08.) | **Quelle hat alles — das Archiv holt es nicht** |
| LBRDA, LBRDK | EQUITY | 4 — **nichts vom 17. bis 20.08.**, ab 21.08. wieder | echte Datenlücke, Strukturereignis |
| WHLR | EQUITY | 1 (nur 26.08.) | Sonderfall, ungeklärt |
| BSCO, IBDP, IBTE | **ETF** | 0 | keine Aktien; gehören ohnehin nicht ins Aktienuniversum |

**Was das an meinem Befund 3 ändert:**

1. **Die Kernaussage steht:** `AVB`, `EQR`, `WBS` handeln lückenlos bis heute und sind
   nicht delistet. Die Massive-Liste führt sie falsch. Das bleibt.
2. **`LBRDA`/`LBRDK` nehme ich aus dieser Gruppe heraus.** Dort gibt es eine reale
   Datenlücke vom 17. bis 20.08.; Massives Delisting-Vermerk zum 21.08. könnte ein echtes
   Strukturereignis abbilden (Liberty Broadband) statt eines Quellenfehlers. Ich hatte
   beide in einem Atemzug mit AvalonBay genannt — **das war zu grob.** Von 33
   August-Delistings sind damit **mindestens 3** belegt falsch, nicht 5.
3. **Neu, und für den Archiv-Rückstand die eigentliche Zahl:** von den zehn
   zurückhängenden Reihen sind **vier reines Nachladen** — die Kerzen liegen bei der
   Quelle bereit und werden nicht geholt. Drei weitere sind **ETFs**, die in einem
   Aktienuniversum nichts verloren haben. Der Rückstand ist also kleiner *und* anders
   verteilt, als „zehn veraltete Reihen" nahelegt.

**Eigener Fehler dabei:** die erste Abfrage lief mit einem Zeitfenster, das um genau ein
Jahr danebenlag (`period1` aus einer Konstante statt gerechnet) und lieferte
2025er-Kerzen, die plausibel aussahen. Aufgefallen nur, weil die Datumsangaben mit
ausgegeben wurden. **Zeitfenster ausrechnen und mitdrucken, nie als Konstante setzen.**
