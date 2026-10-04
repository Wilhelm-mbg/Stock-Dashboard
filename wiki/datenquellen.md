---
tags: [bauplan]
---
# Datenquellen und Fenster

**Die Fensterlage entscheidet, welche Frage überhaupt stellbar ist.** Eine gute Idee, deren
Daten außerhalb des Fensters liegen, ist unmöglich — nicht schwierig.

## Kursarchive (auf `E:/Markt-Dashboard-Archiv`, Pfad steht in `archiv1d-pfad.txt`)

| Archiv | Umfang | Fenster | Bemerkung |
|---|---|---|---|
| **archiv1d** | 2.965 Werte | **bis 1986**, ~4.665 Handelstage | der Kernbestand, mit Eröffnungskursen |
| **archiv60m** | 2.886 Werte | **730 Tage ROLLIEREND** | Quelle gibt nicht mehr her |
| 1m | 2.967 Werte | ~7 Tage | ~~Sammlung RUHT~~ **läuft** (Z0-Befund 03.09.: 1m-Lauf der App täglich, 531 Werte, `archiv1m/laeufe.log`); der Renderer-Store hält bis 70 Handelstage, siehe [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) |
| 5m / 15m | — | ~60 Tage | sammelt seit 26.08.2026 |
| **massive/** | 1.164 verschwundene Reihen | **ab 23.08.2024**, nicht früher | für [ueberlebensverzerrung.md](ueberlebensverzerrung.md) — **die Grenze ist hart**, siehe unten |

**⚠ `massive/universum-2024-09-02.json` ist EINGEFROREN und schreibgeschützt** (Original +
Kopie auf `E:`). Nie anfassen, nie neu erzeugen — sonst werden alle bisherigen
Überlebensverzerrungs-Messungen unvergleichbar. *Entscheid 31.08.2026.*

**⚠ Die verschwundenen Reihen reichen nur bis 23.08.2024 zurück — und das ist der Endzustand.**
Sie stammen aus dem Aggregat-Fenster der Gratisstufe (zwei Jahre); für die Delisting-Jahre
**2004–2022 liegen 3.690 aktienartige Kürzel ohne einen einzigen Balken**. Jede Messung, die
Verschwundene als Vergleichsgruppe braucht, ist damit auf **2025/2026** beschränkt — die
frühen Jahre sind nicht „noch nicht" gemessen, sondern **nicht mehr messbar**. Details und
Zählung: [ueberlebensverzerrung.md](ueberlebensverzerrung.md). *Gezählt 03.09.2026,
Fundstelle `studien/vorregistrierung-2026-09-02-spannen-historisch/VORREGISTRIERUNG.md` §9b.1.*

## Anbieter

**Polygon.io, seit 10/2025 „Massive"** (`api.massive.com`). **Wir sind bereits Kunde auf der
Gratisstufe.** *Fundstelle: `studien/datentarif-2026-09-01/EMPFEHLUNG.md`*

| Stufe | Preis | Rate | Tiefe | Auflösung |
|---|---|---|---|---|
| **Basic (unsere)** | **$0** | 5/Min | **2 Jahre (Aggregate)** | siehe Kasten |
| Starter | $29 | unbegrenzt | 5 Jahre | + Minutenbalken |
| Developer | $79 | unbegrenzt | 10 Jahre | + Trades |
| Advanced | $199 | unbegrenzt | 20+ Jahre | + Quotes, Flat Files, Echtzeit |

*Jahreszahlung −20 %. Monatlich kündbar. Preise abgerufen 01.09.2026.*

> ### ⭐ **DIE GRATISSTUFE KANN VIEL MEHR ALS IHRE DOKUMENTATION — empirisch getastet 01.09.2026**
> *Fundstelle: `studien/datentarif-2026-09-01/GRATIS-PRUEFUNG.md`, Commit `04298ee`*
>
> | Endpunkt | Basic liefert tatsächlich |
> |---|---|
> | **Nachrichten** | **HTTP 200 bis 2017-04-10 = 9,4 Jahre** — kein 2-Jahres-Deckel. ⚠ **Die Wand ist nicht das Fenster**, siehe Kasten unten |
> | **Minutenbalken** | **HTTP 200**, echte Balken bis ~730 Tage — entgegen „End of Day" auf der Preisseite |
> | Dividenden, unadjustierte Kurse, Splits (bis **1987**) | alle HTTP 200, **alle heute ungenutzt** |
>
> **Der 2-Jahres-Deckel gilt nur für Aggregate.** Alle 403 trugen `NOT_AUTHORIZED` mit dem
> Wortlaut **„data timeframe"** — also Zeitraum, nie „Endpunkt nicht im Tarif". *Ein HTTP 200
> mit 0 Treffern ist ein anderer Befund und wurde getrennt protokolliert.*
>
> **→ Der Hauptkaufgrund für Starter ist damit entfallen: wir haben ihn bereits für $0.**

**Beobachtungsdichte — gezählt statt geschätzt** (Saat 20260901, 30 Symbole × 20 Handelstage):

| Schicht | mit Meldung | Score ≠ 0 |
|---|---|---|
| Zufallszug aus 2.965 Archivnamen | 10,5 % | **3,0 %** |
| Großwerte (unsere 17) | 91,8 % | **56,2 %** |

**Die früher geschätzten 20,6 % waren in BEIDE Richtungen falsch.** *Folge: Ein Sentiment-
Universum muss aus **Großwerten** bestehen — der Zufallsquerschnitt reißt die Schwelle.*

> ### ⚠ **DIE WAND IST NICHT DAS FENSTER — gezählt 01.09.2026**
> *Fundstelle: `studien/vorregistrierung-2026-09-01-news-sentiment-vollkorpus/`, Nachtrag 1
> und `abdeckung.json` (233.625 Meldungen, 30 Großwerte)*
>
> Eine Wand sagt, wo die **älteste** Meldung liegt — nicht, ob dahinter genug steht. Abdeckung
> (Anteil Symbol-Tage mit einer Meldung ≤ 48 h vor Schluss):
>
> | 2017 | 2018 | 2019 | 2020 | **2021** | 2022 | 2023 | 2024 | 2025 | 2026 |
> |---|---|---|---|---|---|---|---|---|---|
> | 0,2 % | 3,7 % | 1,9 % | 7,4 % | **69,4 %** | 95,2 % | 96,6 % | 84,5 % | 72,5 % | 78,8 % |
>
> Der Übergang ist eine **Stufe**, kein Anstieg: 2021-03 **9,6 %** → 2021-04 **44,0 %** →
> 2021-05 **94,0 %**. Das ist eine Bestandsaufnahme des Anbieters, kein Marktereignis.
> AAPL — der meistbeschriebene Wert der Welt — hat **2017 genau EINE** Meldung und **2021
> dann 4.296**.
>
> **→ Nutzbares Nachrichtenfenster: ab Mai 2021, rund 1.338 Handelstage** — nicht die 2.367,
> die sich aus der Wand ergäben. **Wer eine Wand als Fenster nimmt, zählt Jahre mit, in denen
> nichts zu messen ist.**

## Weitere Quellen

- **Yahoo Finance** — Kurse der App, bis 15 Min verzögert. **Führt keine Scheine** (ISIN/WKN: 0
  Treffer). Korrigiert fertige Kerzen ~18 Min rückwirkend.
- **EDGAR** (frei) — Form 4, 8-K, DEF 14C. Bewährt: hat den GBTC/ETHE-Fall aufgeklärt.
- **Fundamentaldaten: fast keine.** Nur `stammdaten.json` (Aktienzahl, Gewinn/Aktie, Stand
  Juli 2026) — **ein einziger Stand = Look-ahead**, deshalb sind Value/Quality-Ansätze
  strukturell unmessbar.
- **Optionsdaten, Orderbuch, Tick: keine.**

## Der Schlüssel

`massive.key` im Datenordner. **Gehört in keine Ausgabe, kein Log, keinen Commit, keine URL,
die irgendwo protokolliert wird.**


## Broker-Schnittstellen für die Aktien-Kostenmessung (Recherche 02.09.2026, PM)

Gesucht war: echte Aktien (kein CFD, keine Nachtfinanzierung), US-Nebenwerte der 5–250-Mio-$-Klassen handelbar, Paper-Konto, REST-Anbindung aus Node/Electron, Zugang aus Deutschland.

| | Alpaca | Interactive Brokers | Trading 212 |
|---|---|---|---|
| Paper-Konto | weltweit nur mit E-Mail, kein Depot | ja, braucht eröffnetes Konto | „Practice"-Modus im Invest-Konto |
| Anbindung | REST + Schlüssel (Trading-API, Paper-Endpunkt getrennt) | Web-API mit OAuth 2.0 `private_key_jwt`-Registrierung, oder lokales Gateway | REST + Schlüssel aus den Einstellungen, Beta; Market/Limit/Stop live seit 2025/26 |
| Füllung im Paper | am NBBO (Spanne wird gemessen); kein Impact, keine Tiefe; **Teilfüllungen zufällig bei ~10 %** | Spanne + Buchtiefe, realistischste Simulation; kein Zugriff auf tiefes Buch | am eigenen Kurs, Realismus nicht dokumentiert |
| Provision | 0 (US-Kassa) | Tiered ~0,35 $ Minimum je Order, im Paper mitgerechnet | 0, aber 0,15 % Währungsumtausch |
| Echtkonto aus DE | **unsicher** — Länderliste nennt Deutschland nicht, „Support fragen" | ja | ja |

Ausgeschieden: Capital.com (nur CFD, 0,0247 Pp/Nacht, siehe [kosten.md](kosten.md)); lemon.markets (nur auf Einladung, deutsche Börsen); Saxo OpenAPI (Sandbox vorhanden, aber Vollkonto und Gebührenniveau, nicht geprüft); Trade Republic, Scalable, DEGIRO (keine Schnittstelle bzw. kein Paper).

### Alpaca als KURSQUELLE — historische NBBO-Tafel, gratis (**gemessen 02.09.2026**)

Nicht nur ein Handelszugang: `data.alpaca.markets/v2/stocks/quotes` liefert auf der
**Gratisstufe** die konsolidierte Spanne (`bp`/`ap`/`bs`/`as`/Börse) **zurück bis mindestens
Anfang 2016** — mit `feed=sip`, ohne Tarifabweisung, ohne Verzögerung auf Historie.
Das ist genau die Ware, für die Massive 199 $/Monat verlangt (Stufe Advanced).

| Was | Stand 02.09.2026 |
|---|---|
| Endpunkt | `/v2/stocks/quotes`, `/v2/stocks/auctions`, `/v2/calendar` |
| Fenster | **2016 bis heute**, geprüft an AAPL 05.01.2016 |
| Feed | **nur `sip`** — siehe Kasten unten |
| Ratengrenze | **200/min** (Kopfzeile `x-ratelimit-limit`) |
| `sort=desc` | trägt — der zum Zeitpunkt gültige Quote ist der **letzte davor**, und den liefert nur `desc` |
| `limit` | gilt **je Aufruf, nicht je Symbol** — ein Sammelabruf über mehrere Werte bringt nichts |
| Auktionen | **251 Tage in einem Abruf**, Schluss und Eröffnung mit Preis und Stückzahl |

*Fundstelle: `studien/vorregistrierung-2026-09-02-spannen-historisch/VORREGISTRIERUNG.md` §1
(Proben 1 und 2, Rohausgabe im Registrierungs-Commit `4f22b14`).*

> #### ⚠ `feed=iex` liefert ein FALSCHES JAHR, ohne es zu sagen
> Ein Abruf mit `start=2018-03-01T14:35:00Z&feed=iex` kam mit Quotes vom **30.07.2020**
> zurück — **HTTP 200, keine Warnung, keine leere Antwort.** Wer den gelieferten Zeitstempel
> nicht prüft, misst 2020er Spannen und nennt sie 2018.
>
> Dieselbe Bauform hat sich am selben Tag ein zweites Mal gezeigt: ein Abruf um **15:55 ET an
> einem Halbtag** (Handelsende 13:00) liefert keine Lücke, sondern einen plausiblen
> **nachbörslichen** Quote — AAPL 23.11.2018: 0,0523 Pp, das Fünffache der Mittagsspanne.
>
> **Die Lehre ist nicht „iex ist schlecht", sondern: diese Schnittstelle antwortet lieber
> irgendetwas als nichts.** Wer sie benutzt, prüft den gelieferten Zeitstempel gegen den
> angefragten und die Handelszeiten gegen `/v2/calendar` — nicht gegen eine Liste im Kopf.
> `alpaca.js` in der App fragt `feed=iex` für **Echtzeit**kurse ab; dort ist die Falle nicht
> dieselbe (es gibt kein historisches Fenster), aber die Spanne ist die des IEX allein, nicht
> die konsolidierte. Das steht so schon in [kosten.md](kosten.md), „Grenzen der Simulation".

*Quellen:* docs.alpaca.markets/us/docs/paper-trading (Füllregeln, Teilfüllungen), alpaca.markets/support/countries-alpaca-is-available, interactivebrokers.com/docs/web-api/introduction (OAuth), interactivebrokers.com/docs/tws-api/doc/notes-limitations/limitations/paper-trading, docs.trading212.com/api, community.trading212.com „Trading 212 API Update". Stand der Abfragen: 02.09.2026.

### Alpaca als BALKENQUELLE (Z1, 03.09.2026 — Probe bestanden mit Nachtrag, Nachholer gefahren)

`/v2/stocks/bars?symbols=…&timeframe=1Min|5Min|15Min&start=…&end=…&limit=10000&feed=sip&adjustment=raw`,
Zeitstempel `t` = Balkenöffnung (RFC 3339), Felder `o h l c v n vw`. Vorgesehen als Ersatz für die
verworfene CFD-Tiefe des Renderer-Stores (Entscheid 2 in [archiv-zusammenfuehrung.md](archiv-zusammenfuehrung.md) §6).
**Gemessen 03.09.2026:** die Gratisstufe liefert 1Min-SIP-Balken zurück bis 2016, `t` ist die Öffnung, Vor- und Nachbörse kommen mit, Schluss und Umsatz decken sich mit Yahoo bis auf die Skala nach Kapitalmaßnahmen (siehe „Bereinigung"). Die Probe fiel an einem von acht Kriterien (ARM 9/383 Minutenkerzen über 0,1 %), Wilhelm gab sie mit Nachtrag frei ([entscheide.md](entscheide.md)). Die Probe
`studien/archiv-zusammenfuehrung-2026-09/probe-alpaca-balken.js` prüft genau das (Kriterien im Code),
und ihr Urteil auf der Platte ist die Freigabe für `tools/alpaca-balken-holen.js` (reguläre Sitzung
laut `/v2/calendar`, iex-Wache: Balken außerhalb des angefragten Zeitraums werden verworfen, Datei gewinnt
bei gemeinsamem Stempel, Quelle `alpaca` je Kerze, 180/min, fortsetzbar). Zugang ausschließlich über
`schluessel.js` der Spannen-Studie — Klinke Block 35.

#### Verzögerung während der Sitzung, je Feed — **gemessen 04.09.2026, 16:05–16:20 MESZ** (Gratisstufe)

Nur-Lese-Probe als Windows-Aufgabe, vier Messungen im Abstand von fünf Minuten, Werte SPY/AAPL/MNST (`studien/alpaca-vollsammlung-2026-09/probe-live-verzoegerung.json`):

| Feed | `/v2/stocks/bars` 1Min | `bars/latest` | `snapshots` | Vollständigkeit |
|---|---|---|---|---|
| `sip` | **200, jüngster Balken exakt 15 min alt** (15,03 · 15,07 · 15,10 · 15,13 min) | 403 „subscription does not permit querying recent SIP data" | 403 | 75 von 75 möglichen Balken je 90-min-Fenster — konsolidiert, dieselbe Quelle wie das Archiv |
| `iex` | 200, jüngster Balken **1 min** alt | 200, 1 min | 200, Minutenbalken 1 min, letzter Handel < 10 s | **lückenhaft:** 35–52 statt 75 Balken (nur Minuten mit IEX-Umsatz), Umsatz nur IEX |
| `delayed_sip` | **400 „invalid feed"** | 200, 16 min | 200, 16 min | — |

**Folgerung für den Live-Sammler (Auftrag Nr. 4):** Ins Archiv kommen **nur SIP-Balken**, also alles, was 15 Minuten alt ist — ein Umlauf je Minute holt `start = letzter Stempel + 1 min`, bekommt alle Balken bis „jetzt − 15 min" und hängt sie an. Das Archiv läuft der Börse damit **15 Minuten** hinterher, aber vollständig und in derselben Skala wie die Vollsammlung. **IEX taugt nur für die laufende Anzeige** (Viewer: laufende Kerze, Kurs der letzten Minute), nie für das Archiv: die Lücken und der IEX-Umsatz würden Messungen verseuchen. Ob Alpaca SIP-Balken nach 15 Minuten noch nachträglich ändert (späte Meldungen), ist **nicht gemessen** — der Sammler soll die letzten 30 Minuten jedes Umlaufs erneut abfragen und Abweichungen zählen, bevor die Regel „append-only ab 15 min" als sicher gilt.

#### Bereinigung: welche Alpaca-Einstellung entspricht Yahoo? **Keine.** (gemessen 03.09.2026)

`adjustment=raw|split|dividend|all`. Gemessen an vier Fällen — MNST (Split 2:1, wirksam 11.08.2026)
und SPGI (Abspaltung, wirksam 01.07.2026), je ein Tag **vor** und einer **nach** der Maßnahme, 5Min,
72 gemeinsame Stempel je Fall, gegen die Yahoo-Kerzen derselben Stempel im Archiv
(`studien/archiv-zusammenfuehrung-2026-09/skalen-probe-alpaca.js`, Kriterien im Code **vor** dem Lauf):

| Einstellung | MNST vor | MNST nach | SPGI vor | SPGI nach | Umsatz Yahoo/Alpaca (MNST vor) |
|---|---|---|---|---|---|
| `raw` | 2,00000 | 1,00000 | 1,05700 | 1,00000 | **1,0001** |
| `split` | **1,00005** | 1,00000 | 1,05700 | 1,00000 | **0,5001** |
| `dividend` | 2,00000 | 1,00000 | 1,05463 | **0,99776** | 1,0001 |
| `all` | 1,00005 | 1,00000 | 0,99753 | **0,99776** | 0,5001 |

*(Median Alpaca/Yahoo je Tag; fett = das jeweils Entscheidende.)*

**Drei Sätze, die daraus folgen:**
1. **Yahoo bereinigt Intraday die KURSE, aber nicht die UMSÄTZE.** Vor dem MNST-Split steht Yahoos
   Kurs auf der halbierten Skala, sein Umsatz aber auf der rohen (Faktor 1,0001 gegen `raw`, 0,5001
   gegen `split`). Yahoos Intraday-Datei ist nach einem Split in sich uneinheitlich — Kurs × Umsatz
   ist dort nicht mehr der gehandelte Gegenwert. Das betrifft `dollarVolTag()` und jede Rechnung,
   die beides multipliziert, **unabhängig von Alpaca**.
2. **Yahoo bereinigt Intraday NICHT um Dividenden.** `dividend` und `all` verschieben auch den
   Kontrolltag *nach* der Maßnahme (0,99776) — sie rechnen etwas heraus, das Yahoo nie hineingerechnet
   hat.
3. **Die Abspaltung deckt keine Einstellung ab.** Yahoo rechnet sie (Faktor 1,057), `split` nicht,
   `all` überschießt (0,99753, weil die Dividendenbereinigung mitläuft).

**Konsequenz für die Yahoo-Mischdateien:** `raw` holen und mit dem **gemessenen** Faktor rechnen —
je Wert und Tag geeicht, nicht aus dieser Tabelle übernommen (`tools/alpaca-balken-holen.js
--ersetze-alpaca`, Eichung an gemeinsamen Stempeln der 5m-Datei). Für die Vollsammlung Z1c gilt
Wilhelms Entscheid „beides" unverändert: roh sammeln, bereinigte Kopie lokal ableiten
([entscheide.md](entscheide.md)).

**Wie man einen Skalenfehler findet, ohne das Netz zu fragen:** an den Quellengrenzen der Datei
selbst. Zwei benachbarte Kerzen desselben Gitters berühren sich (Eröffnung der späteren ≈ Schluss der
früheren, ein Tick Unterschied statt einer Fünf-Minuten-Bewegung); wo dort die Quelle wechselt, misst
das Verhältnis nur den Unterschied der Maßstäbe. Über 3.825 Wert-Tage: Median 0,0026 %, alle 3.757
sauberen Tage unter 0,1 %, die 68 falschen bei 2,000 bzw. 1,057 — **kein Fehlalarm**. Das *Tagesarchiv*
taugt als Vergleich nicht: es hat denselben Fehler (MNST 06.08. 47,08 gegen 07.08. 90,36).
`--pruefen` fährt diese Prüfung bei jedem Aufruf mit.

### Alpaca-Minutenarchiv (roh + bereinigt, ohne Überlebensverzerrung ab 2016)

Stufe Z1c, `tools/alpaca-vollsammlung.js`. Ein **eigenes Archiv neben den Yahoo-Dateien**, das
nicht nur enthält, was heute noch gehandelt wird. Wilhelms Entscheid „alles sammeln"
([entscheide.md](entscheide.md)) und Skalenkonvention **„beides"**.

| | |
|---|---|
| Endpunkt | `/v2/stocks/bars`, `timeframe=1Min`, `feed=sip`, `adjustment=raw`, `limit=10000` |
| Reichweite | 2016 bis heute, **alle Handelsstunden** (Vorbörse ab 04:00 ET, Nachbörse bis 20:00 ET) |
| Ablage roh | `E:/Markt-Dashboard-Archiv/alpaca1m/<ORDNER>/<JAHR>.json`, Format 2, `quellen` = `alpaca`, dazu `sitzungen` (Bereiche `regulaer`/`vor`/`nach`) und `jahr` — **append-only** |
| Ablage Maßnahmen | `alpaca-massnahmen/<ORDNER>.json` aus `/v1/corporate-actions` |
| Ablage bereinigt | `alpaca1m-bereinigt/<ORDNER>/<JAHR>.json`, **lokal abgeleitet**, kein zweiter Abruf |
| Jahresgrenze | **ET-Mitternacht**, nicht UTC — sonst fielen die Nachbörsen-Balken des 31.12. in zwei Jahresdateien |
| Ratenbremse | 170/min (die 200/min der Quelle gelten für den ganzen Zugang, `kosten.js` holt mit) |
| Fortschreibung | **Live-Sammler in der App** (seit 06.09., Nr. 4, `livesammler.js` + `main.js liveRunde`): alle 5 Min während der Sitzung (Vorbörse ab 04:16, Nachbörse bis 20:16 ET, Halbtage laut Kalender) SIP-Balken bis jetzt−16 min für **alle geführten Reihen** (`_lebenszeit.json`, letzter Tagesbalken ≤ 30 Tage vor dem Stand der Datei: 3.067 am 07.09.) + Watchlist + Positionen + Viewer-Wert, Deckel 150 Abrufe je Runde, Redundanz-Deckel 5.000 Mitglieds-Minuten je Block. **Nachlauf** `tools/alpaca-vollsammlung.js --nachholen` täglich 23:30 (Aufgabe „Markt-Dashboard Alpaca-Nachholen") für alle geführten Werte ab dem letzten Stempel bis zum letzten fertigen Handelstag. Beide schreiben über `alpacaarchiv.js` (**Anhang an Ort und Stelle** seit 23e55ae: Journal `<JAHR>.json.journal` mit den alten Bytes vor den Daten, `fsync`, Gegenlesen, Journal weg; `journalReparieren` stellt nach einem Abbruch byteidentisch her; ~156 MB statt 8 GB je Runde bei 3.067 Werten; nie überschreiben), beide teilen die Sperre `alpaca1m/_laeuft.json`. Strategien lesen weiter Yahoo (Klinke 83.16); nur der Viewer liest `alpaca1m` (5m/15m/1h verdichtet, Gitter je Sitzung). |
| Manifest | `alpaca1m/_manifest.json` und `alpaca1m-bereinigt/_manifest.json` aus `--manifest` (SHA-256, Bytes, Kerzen, erster/letzter Stempel, Quelle, Sitzungszähler je Datei); `--pruefen` vergleicht dagegen (Bytes immer, Hash mit `--hash`, ~30 min über 136 GB). Lückenliste `alpaca1m/_luecken.json` (Soll-Tage aus Kalender × Lebenszeit, fehlende Tage je Wert). Der Live-Sammler führt das Manifest **nicht** nach — der Nachlauf um 23:30 tut es. |

**Kapitalmaßnahmen: Splits ja, Abspaltungen nein** (gemessen 03.09.2026,
`studien/alpaca-vollsammlung-2026-09/probe-massnahmen.js` und `probe-spinoff-form.js`,
Kriterien im Code **vor** dem Lauf). Der Endpunkt trägt auf der **Gratisstufe** und reicht bis
2016 zurück (AAPL-Split 31.08.2020, NVDA-Split 20.07.2021). Ein **Split** trägt `old_rate` und
`new_rate`, und `new_rate/old_rate` **ist** der Kursfaktor — MNST `forward_split` ex 11.08.2026,
1 → 2, Faktor **2,000**, exakt die Zahl, die die Skalenreparatur am Vortag unabhängig aus den
Kursen gemessen hat. Eine **Abspaltung** trägt `source_rate` und `new_rate`, und das ist ein
**Stückverhältnis, kein Kursfaktor**: GE→WAB 0,005371, GE→GEHC 0,33333, GE→GEV 0,25, MMM→SOLV
0,25, T→WBD 0,24192, SPGI→MBGL 1,0. Der gemessene Kursfaktor bei SPGI war **1,057** — aus „ein
Stück je Stück" nicht ausrechenbar, er hängt am Kurs des abgespaltenen Papiers am Wirkungstag.
**Folge:** ein Wert mit Abspaltung bleibt aus der bereinigten Kopie **aus** und wird gelistet;
sein Faktor wird nicht aus der Rohreihe erraten (ein Sprung von −5 % kann eine Abspaltung sein
oder eine Gewinnwarnung).

#### Der Abspaltungs-Kursfaktor wird GEMESSEN (04.09.2026, `tools/alpaca-abspaltungsfaktor.js`)

Aus der Rohreihe ist er nicht zu erraten — aus der **Quelle** schon, nur nicht aus dem
Maßnahmen-Endpunkt. Alpaca liefert dieselben Tagesbalken in vier Bereinigungen; `adjustment=all`
rechnet Splits, Dividenden **und** Abspaltungen heraus, `adjustment=dividend` nur die Dividenden.
Das Verhältnis an denselben Stempeln isoliert also genau das, was der Endpunkt verschweigt. Das
kostet einen **zweiten Abruf**, den die Konvention „lokal ableiten" sonst ausschließt —
**Wilhelms Entscheid 03.09.2026** ([entscheide.md](entscheide.md)), die einzige Ausnahme.

**Die Richtung ist nachgerechnet, nicht übernommen.** `all` ist vor der Abspaltung **kleiner**
als `dividend`; `all ÷ dividend` ist deshalb **0,9459**, und der **Kursfaktor ist sein Kehrwert,
1,0572**. Nur so steht er in derselben Richtung wie der Split-Faktor der Quelle (MNST 1→2 gibt
2,000, und die Ableitung teilt die Kurse davor durch 2). Der Z1c-Befund nennt 1,0572 verkürzt
„das Verhältnis all ÷ dividend"; gemeint ist der Faktor, den es ergibt.

| | |
|---|---|
| Endpunkt | `/v2/stocks/bars`, `timeframe=1Day` (nicht 1Min — die Bereinigung steckt im Tageskurs) |
| Faktor | Median `dividend ÷ all` (Schluss) über die letzten **20 Handelstage vor** dem Wirkungstag |
| Streuung | (max−min)/Median über dieselben Stempel; über 0,001 → **unklar** (zweite Maßnahme im Fenster oder zu grob gerundete Kurse) |
| Kontrolle | Median **ab** dem Wirkungstag muss **1,000** sein (Band 0,999–1,001). Sonst liegt hinter der Abspaltung noch eine Maßnahme, die in den Faktor mit hineinliefe → **unklar**, es wird nichts geschrieben. Gibt es danach gar keine Balken (erloschener Wert), ist die Kontrolle nicht fahrbar — **nicht prüfbar ist nicht bestanden** |
| Sperre | liegt **am Wirkungstag** noch eine faktortragende Maßnahme (Split oder zweite Abspaltung), trägt der gemessene Faktor sie mit → **unklar** |
| Ablage | Feld `kursfaktor` in einer **neuen** Liste `gemesseneFaktoren` der Maßnahmen-Datei, mit `herkunft: "gemessen all/dividend"`, Messdatum, `n`, `streuung`. `saetze`, `anwendbar` und `ohneFaktor` bleiben unverändert — **gemessen und geliefert bleiben unterscheidbar** |
| Drossel | 20/min, ein Zehntel der Grenze; ein 429 bricht ab und nennt die Wartezeit, statt zu wiederholen (der Vollauf hängt mit 170/min am selben Zugang) |

**Zwei bindende Eichungen vor dem ersten geschriebenen Byte** — fällt eine, wird kein einziger
Faktor geschrieben: **SPGI muss 1,057 ergeben** (gemessen **1,057244** — dieselbe Zahl, die die
Skalenreparatur am Vortag unabhängig aus dem Verhältnis roher Alpaca-Kerzen zu **Yahoo**-Kerzen
gemessen hat, zwei völlig verschiedene Rechnungen), und ein Wert **ohne** Abspaltung muss
**1,000** ergeben (Placebo AAPL: exakt 1,000000, Streuung 0).

**Ergebnis (04.09.2026, 406 Abrufe): 201 Abspaltungen in 177 Werten → 109 mit gemessenem
Kursfaktor (108 Werte), 92 unklar.** Von den 109 sind **47 genau 1,000** — das ist der Normalfall
beim *abgespaltenen* Papier, das den Satz mitgeliefert bekommt: an seiner Reihe ändert die
Abspaltung den Kurs nicht. Gründe für „unklar": 37 zu wenige gemeinsame Handelstage davor,
21 Kontrolle nach der Maßnahme ≠ 1, 14 keine Balken danach (erloschen), 5 Verhältnis davor nicht
konstant, 9 zweite Maßnahme am Wirkungstag.

> ⚠ **Der Fund, der die Sperre erzwungen hat.** MHUA hat am 24.11.2025 eine Zusammenlegung
> **100:1 UND eine Abspaltung am selben Tag**. Das Verhältnis misst beide zusammen und ergab
> 0,010000 — den Faktor der Zusammenlegung. Als Abspaltungsfaktor geschrieben, hätte die
> Ableitung ihn ein **zweites** Mal angewandt, neben dem Split-Faktor der Quelle: die Kurse davor
> wären durch 0,0001 statt durch 0,01 geteilt worden. **Hundertfach daneben, und in jeder
> Zusammenfassung unauffällig.** Betroffen waren 9 von 201 Fällen (AGE, BATRK, CENTA, HON, MHUA,
> OPEN, PRPH, SNRE, XRX). Herausrechnen wäre möglich, aber ohne eigene Kontrolle — bei HON käme
> 1,908 heraus, und ob das die Abspaltung ist oder eine Split-Angabe, die die Quelle anders
> anwendet als sie sie meldet, sagt keine der beiden Zahlen. Also „unklar".
>
> `--pruefen` fährt diese Prüfung **über alles schon Geschriebene**, ohne Abruf: vier der neun
> standen bereits in den Dateien, bevor die Sperre gebaut war, und keine Messung hätte sie je
> wieder angefasst. Sie schließt außerdem den zweiten Weg, auf dem ein Faktor nachträglich falsch
> wird — reicht die Quelle später einen Split am selben Wirkungstag nach, trägt der alte Faktor
> ihn mit. Der Stand steht als `alpaca-massnahmen/_abspaltungsfaktoren-stand.json`.

**Die Kontrolle, die vorher nicht fahrbar war, besteht jetzt.** SPGI hatte keine bereinigte Kopie,
also gab es nichts gegen Yahoo zu halten. Mit dem gemessenen Faktor, auf dem 5m-Gitter über 64 Tage:
**roh/Yahoo 1,057000** an den 20 Tagen vor der Abspaltung (die Maßnahme ist real und sichtbar) —
**bereinigt/Yahoo 0 von 64 Tagen außerhalb 0,999–1,001** (Spanne 0,999769–1,000000). Der Umsatz
trägt den Faktor mit (bereinigt/roh 1,057244 an allen 123 Tagen davor), damit Kurs × Umsatz der
gehandelte Gegenwert bleibt.

**Die Ableitung** ist eine reine Funktion: Kurse ÷ Faktor, **Umsatz × Faktor**, damit Kurs ×
Umsatz der gehandelte Gegenwert bleibt. Das ist **bewusst stimmiger als Yahoo**, das Intraday die
Kurse bereinigt und die Umsätze nicht (Abschnitt oben). Mehrere Maßnahmen multiplizieren sich;
Kerzen am Wirkungstag bleiben unberührt. Dividenden werden **nicht** angewandt.

> #### ⚠ Der Gratis-Tarif verweigert die JÜNGSTEN SIP-Daten — und zwar die ganze Anfrage
> `HTTP 403 {"message":"subscription does not permit querying recent SIP data"}`. Nicht „die
> letzten Balken fehlen", sondern: der Abruf liefert **nichts**. Ein `end` von heute macht eine
> Anfrage über zehn Jahre wertlos. Der Nachholer lief nie hinein, weil er nur alte cap-Bereiche
> anfragte. Jedes Abruf-Ende wird deshalb auf *jetzt minus 30 Minuten* gekappt (15 wären die
> Sperre, die übrigen 15 decken die Nachkorrektur fertiger Balken ab). Das laufende Jahr gilt
> darum nie als fertig und wird an einem späteren Tag neu geholt.

**Drei Windows-Fallen, gefunden vor dem ersten geschriebenen Byte.** (1) **CON** steht im
eingefrorenen Universum und ist ein Gerätename — `mkdir CON` schlägt fehl, egal wie tief der Pfad
liegt (ebenso PRN, AUX, NUL, COM1‑9, LPT1‑9). (2) **HIW/HIw, KW/Kw, ADSW/ADSw** sind je zwei
verschiedene Wertpapiere, deren Ordner auf einem Dateisystem ohne Groß-/Kleinschreibung
zusammenfallen — zwei Unternehmen in einer Reihe, still. (3) Ein Kürzel, das auf einen Punkt
endet, wäre unzulässig (es gibt keines). Regel: ein Kürzel, das nicht rein aus Großbuchstaben,
Ziffern und Punkten besteht oder ein Gerätename ist, bekommt einen Kurzstempel seines **exakten**
Namens angehängt (`CON` → `CON_7679a0`). Die vollständige Abbildung steht in
`alpaca1m/_symbole.json`; die Wahrheit steht ohnehin als `sym` im Datei-Rumpf.

**Kürzel-Wiederverwendung.** Ein Kürzel, das nach dem Erlöschen seines Trägers neu vergeben wird,
liefert Balken **zweier verschiedener Unternehmen**. Die zweite Reihe wird als `<KÜRZEL>~2`
abgelegt, nie vermischt. Geschnitten wird am letzten wirklich gehandelten Tag vor dem Anker
(letzter Tagesbalken laut `massive/tagesdaten`, ersatzweise das Delisting-Datum der Liste) — und
nur, wenn zusätzlich mindestens 20 Handelstage Stille dazwischenliegen. Ohne diese zweite
Bedingung würde ein falsch geführtes Listendatum eine durchlaufende Reihe mitten entzweischneiden.

### Format des Kursarchivs (Format 2, seit Z1)

`{ sym, quelle, format: 2, felder, quellen: [{ von, bis, quelle: 'yahoo'|'alpaca'|'capital', abgeleitet? }],
spannen?, waehrung, boerse, stand, series }` — Kerze `[zeit, schluss, umsatz, hoch, tief, eroeffnung]`,
[5] nie eine Spanne. **Jede geschriebene Kerze braucht eine Quelle** (`kerzenquelle.js satz()`/
`zusammenfuehren()` werfen sonst). Dateien ohne `quellen` (Format 1) werden weiter gelesen, ihr Bestand
gilt als `yahoo` (Marke `abgeleitet: 'bestand'`). Krypto (`-USD`) liegt unter `archiv<iv>/krypto/`.
*Fundstelle: `studien/archiv-zusammenfuehrung-2026-09/Z1-BEFUND.md` §2, test-v6 Block 63 „Format 2".*

## Bigdata.com (Claude-Connector, seit 12.09.2026) — Nachschlagewerk, keine Kursquelle

Wilhelm hat den Connector [Bigdata.com](https://bigdata.com) freigeschaltet (Anbieter RavenPack). Er ist nur aus Claude-Sitzungen erreichbar, **nicht aus der App**. Freigeschaltete Inhalte laut `bigdata_help`: SEC-Meldungen, Earnings-Transkripte, Premium-Nachrichten, Stimmung je Firma, Firmen-Kalender (Earnings, Delistings ab 2025), Wirtschaftskalender, Fundamentaldaten, ESG, Fondsbestände, Knowledge Graph, offenes Web. **Abrechnung: Guthaben (Pay-as-you-go, Stand 12.09.: 1.000), jede Anfrage verbraucht Kontingent** — der PM lädt nie nach und fragt nur, was eine Studie wirklich braucht.

**Probe 12.09. (drei Anfragen):** Activision Blizzard, Delisting Oktober 2023 → sofort das 8-K vom 13.10.2023 mit Item 3.01 (Übernahme durch Microsoft, 95 $ je Aktie). Celgene, November 2019 → Nachrichten (The Fly, MT Newswires, Benzinga) mit Bedingungen der Übernahme. Whole Foods, 8-K August 2017 → **leer** (0 Treffer, 4.000 Web-Einheiten verbraucht). Historie ab ~2019 belegt, 2017 nicht — vor einer Studie mit älteren Ereignissen die Tiefe je Quellart mit einer Stichprobe prüfen.

**Wofür er taugt:** (1) Verschwundene Reihen einordnen (Übernahme / Insolvenz / stilles Delisting) — Tageskerzen-Frage, die die Kanalstudie aufgeworfen hat (Delisting-Ausstiege mit +29 Pp waren Übernahmen); (2) Ereignisdaten für „Information statt Muster" (Quartalszahlen-Termine, Übernahmeankündigungen, Indexaufnahmen) — **Momentaufnahme von heute, keine Point-in-Time-Historie**: jede Registrierung muss ausweisen, wann ein Ereignis bekannt war; (3) Stimmung als Bedingung — nur mit vorab notiertem Erwartungswert. **Wofür nicht:** Kurse (haben wir besser), Live-Signale in der App, alles, was Guthaben in Schleifen verbraucht.

### EDGAR als Quelle für Delisting-Gründe (12.09.2026)

Der Lauf der Gründe-Tafel (9.027 Anfragen, 5,7/s, alles gecacht unter `studien/verschwundene-gruende-2026-09-12/edgar/`) hat zwei Dinge festgelegt, die jede spätere EDGAR-Arbeit übernehmen sollte:

- **Kürzel → CIK NICHT über `company_tickers.json`.** Die Datei trägt den *heutigen* Besitzer eines Kürzels; bei wiederverwendeten Kürzeln zeigt sie auf die falsche Firma (AAC → Ares Acquisition Corp III statt der erloschenen Reihe). Richtig ist die **zeitgefensterte Volltextsuche** um den letzten Balken herum. Siehe [[kuerzel-wechseln-den-besitzer]] — dieselbe Falle, andere Ebene.
- **Formulare kommen später als das Ereignis.** Form 25 wird regelmäßig Wochen nach dem letzten Handelstag eingereicht; eine Prüfung „Datum ≤ letzter Balken + 30 Tage" gilt für **Ereignisse**, nicht für **Einreichungen** (dort das Laufsfenster).
- Bigdata.com wurde nur als Stichprobe auf die Unbekannten angesetzt: 9 Abfragen, **25,2 von 250 erlaubten Einheiten** (Guthaben 975,86 → 950,61). Für die Masse taugt EDGAR, weil es vollständig, kostenlos und Point-in-Time ist.

### SEC Financial Statement Data Sets (FSDS) — Bilanzdaten punkt-in-zeit (16.09.2026)

Quartalsweise ZIPs (`sub.txt`, `num.txt`, `tag.txt`, `pre.txt`) aus den XBRL-Einreichungen, kostenlos, ab 2009. Machbarkeit geprüft in `studien/fundamental-machbarkeit-2026-09-16/` (Leser `fsds-lesen.js`, Rohdaten unter `E:/Markt-Dashboard-Archiv/edgar-fsds/`). **Taugt** für die liquiden Klassen (Deckung 86–100 %). Was jede spätere Nutzung übernehmen muss:

- **Punkt-in-Zeit heißt `filed`, nicht `period`.** Zwischen Bilanzstichtag und Veröffentlichung liegen im Median 39 Tage (10-Q), 91 (10-K), 116 (20-F). Eine Kennzahl darf erst ab dem Handelstag **nach** `filed` in eine Rangfunktion — alles andere ist ein Leck.
- **FSDS rundet Stichtage aufs Monatsende** (Apple 30.03. → 31.03.). Für Renditefenster den echten Stichtag aus dem Filing nehmen oder die Rundung kennen.
- **Erste Veröffentlichung gilt.** 4,3–4,8 % der mehrfach berichteten Werte werden später anders dargestellt; die SEC-Endpunkte `frames` und `companyfacts` liefern die **späteste** Fassung und sind damit für Rückrechnungen unbrauchbar (100 von 275 Stichproben aus späteren Filings).
- **Tag-Wildwuchs:** dieselbe Größe unter verschiedenen XBRL-Tags; für Umsatz decken die fünf häufigsten 97–99 %, `SalesRevenueNet` ist tot. Zuordnungstabelle ≈ 15 Tags, Zins-Tags nur bei Finanz-SIC. Umsatzkosten nur 64–74 % gedeckt, F&E 37–93 % je Klasse.
- **Aktienzahl** aus `dei` fehlt in `num.txt`; Mehrklassenaktien nur in `segments`.
- Fehlende liquide Reihen: ADR/kanadische Werte (20-F/40-F außerhalb des Quartalsrasters) und verschwundene Reihen mit CIK-Wechsel.

### Alpaca-Maßnahmen: Split-Sätze ohne Sprung (18.09.2026)
Von 2.072 Split-Sätzen der Maßnahmendateien (`alpaca-massnahmen/<SYM>.json`) zeigen **47** am Ex-Tag keinen Sprung in der Rohreihe (Verhältnis roh_T/roh_V weniger als die Hälfte des erwarteten log-Sprungs): meist Umstrukturierungen mit Stückverhältnis ohne Kursfaktor (Abspaltung + „Split" am selben Tag wie HON 29.06.2026, Kürzel-Weitergabe wie AAN/ARNC/DLPH, Fusionsverhältnisse wie FNF, SIR). Liste in `studien/querschnitt-pruefstand-2026-09-13/panel-stand.json` → `zaehler.splitAbgelehntListe`. Das Tages-Panel (v2.1) wendet einen eigenen Split nur an, wenn die Rohreihe ihn zeigt (`splitSperre`, `SPLIT_SPERRE_MIN_LOG` 0,1 / `_ANTEIL` 0,5); die **bereinigten Kopien des Minutenarchivs haben diese Sperre nicht** und tragen 44 dieser Sätze als Sprung (offener Punkt Nr. 41). Für Renditen über Tagesgrenzen aus den Kopien gilt bis dahin: an diesen 44 Ex-Tagen ist die Kopie falsch, die Rohdatei richtig.

## Stand des Datenfundaments — Trockenlauf Nr. 79 (04.10.2026): gezählt, nichts geändert

Papier: `studien/datenfundament-2026-10-04/TROCKENLAUF.md` (`95459b8`), mit Namenslisten je Thema. Vier bekannte und zwei neue Mängel; die Korrektur ist Phase 2 (Nr. 86 in [offene-auftraege.md](offene-auftraege.md)). Stände: Minutenarchiv bis 02.10.2026, Panel v2.2 bis 15.09.2026, Maßnahmen-Archiv und bereinigte Kopien bis 03.09./06.09.2026, Polygon-Liste der Abgänge bis 21.08.2026.

| Sache | Zahl | Folge |
|---|---|---|
| Lebenszeit kommt aus Tagesbalken, die nach dem Abgang weiterlaufen | **57** als lebend geführte Aktien sind abgegangen (letzter Minutentag mehr als 10 Handelstage vor dem Archivende); 0 umgekehrt | Regel für Phase 2: lebend = letzter Minutentag höchstens 10 Handelstage vor dem Archivende. Vom PM vor der Lieferung unabhängig gezählt: dieselben Namen (bei 0 / 5 / 10 / 20 Tagen Toleranz 63 / 58 / 57 / 57). |
| **Neu:** der Leser zieht die bereinigte Kopie vor, auch wenn sie veraltet ist | **33** lebende Aktien enden im Leser am **03.09.2026**; im Panel v2.2 vom PM nachgezählt: 32 enden am 03.09. statt am 15.09., 23 davon mit Klasse 1–3 — darunter CRWD, KLAC, PANW, FDX, BKNG, CVNA, CMCSA, SPGI, APH. Die Kopien stammen vom 06.09. und werden vom nächtlichen Nachlauf nicht fortgeschrieben. | „POWL und IESC enden am 03.09." (Rückblick Nr. 74) war keine Lücke der Sammlung, sondern das; die Rohdateien laufen bis 02.10. In den Rückblicken Nr. 74/78 betrifft es die letzten acht Handelstage weniger Positionen. |
| Gründe-Tafel ankert am letzten Tagesbalken | 285 Zeilen mit falschem Anker; mit dem richtigen kippen 72 Gründe, 16 „unbekannt" bekommen einen, 54 Reihen kommen hinzu — aber nur 39 der 72 Kipp-Fälle bestehen die Außenprüfung | nicht einfach neu ankern: erst drei Regeln der Einstufung ändern (Firma über die Polygon-CIK, Vollzugsmeldung nur ±30 Tage am Anker, Formular 25 allein ist nicht „freiwillig") und noch einmal zählen |
| Wirkung auf das Panel v2.2 | 198 Reihen bekämen einen anderen Stand (57 lebend, 142 Grund, 194 Datum), 7 davon mit Klasse 1–3; Totalverlust-Gründe +82 / −13, in Klasse 1–3 +0 / −1 | die gemessenen Studien berührt es kaum |
| Falsche Split-Sätze in den bereinigten Kopien (Nr. 41) | 44 von 47 abgelehnten Sätzen sind angewandt; 147 Jahresdateien in 44 Reihen wären neu zu bilden | neue Kopien in einen neuen Ordner, nichts überschreiben |
| Minuten-Leser kennt die Abschnitte des Panels nicht | 179 Abschnittsanfänge in 171 Kürzeln; in den je 38 Panel-Tagen danach 6.616 Tage, 391 in Klasse 1–3 | eine Stundenstudie rechnete dort über zwei Firmen hinweg |
| Feste Vorgabe Panel v2.1 im Code | 18 Stellen in 17 Dateien (5 Werkzeuge umzustellen, 13 abgeschlossene Studien bleiben, wie sie gemessen wurden) | |
| **Neu:** Bilanz-Leser bei Kürzeln mit zwei Firmen | bei 14 Kürzeln bekommen beide Zeiträume die Bilanzen derselben Firma (8 sicher zwei Emittenten: ALTS, BBBY, CIVI, CTRA, KCAC, RDUS, RSLS, TBRG); 517 Reihen von v2.2 ohne Firma | frühere Abschnitte ohne bestätigte Firma bekommen künftig keine Bilanz |
| Panel-Ende | Minuten liegen für 13 Handelstage nach dem 15.09.2026 vor; Verlängerung per Vollbau 2–4 h | braucht vorher neue Maßnahmen-Daten ab 04.09.2026 (Abruf bei Alpaca — Wilhelms Entscheid) |

**Nicht zählbar ohne neue Abrufe:** Splits und Maßnahmen nach dem 03.09.2026; Abgänge nach dem 21.08.2026 (die Polygon-Liste endet dort). **Von der Abnahme unabhängig nachgezählt:** die erste und zweite Zeile; die übrigen stehen auf den Listen des Trockenlaufs und werden in Phase 2 mit geänderten Regeln ohnehin neu gezählt.

## Nachtrag der Maßnahmen und der Abgangsliste (Nr. 89, 04.10.2026) — neue Dateien, nichts überschrieben

Wilhelms Entscheid vom 04.10.2026: „Beide, wenn kostenlos". Beide Abrufe gingen ohne Kosten (`studien/datenfundament-2026-10-04/abrufe/ABRUFE.md`; Commits `787f6ee`, `4b1d73a`, `addba01`, `fa08ae8`). Die vorhandenen Werkzeuge (`alpaca-vollsammlung.js --massnahmen`, `massive-verschwundene.js`) **überschreiben** ihre Zieldateien und wurden deshalb nicht gestartet.

| Was | Wo | Inhalt |
|---|---|---|
| Maßnahmen bei Alpaca, 01.09.–03.10.2026 | `E:/Markt-Dashboard-Archiv/alpaca-massnahmen-nachtrag-2026-10/` (5.656 Kürzel-Dateien, `_nachtrag.json`, `_angekuendigt.json`; 4,2 MB) | ab 04.09.2026: 14 Splits vorwärts, 121 rückwärts, 4.046 Barausschüttungen, 33 Übernahmen, 42 Umbenennungen. Unter den 2.249 lebenden Aktienreihen nur zwei Splits: **NFE 50→1 (14.09.)** und **WHLR 9→1 (22.09.)**. |
| Liste der Börsenabgänge, Stand 04.10.2026 | `Markt-Dashboard-Daten/massive/verschwundene-2026-10-04.json` (6.948 Einträge; die alte `verschwundene.json` vom 23.08. bleibt) | 67 neue Abgänge nach dem 21.08.2026 (August 19, September 41, Oktober 7). Alle 57 „Wechsler" aus dem Trockenlauf haben jetzt ein Abgangsdatum 0 bis 15 Tage nach ihrem letzten Minutentag (vorher 52). |

**Geklärt:** BURU — Zusammenlegung 40→1 am 02.09.2026 (als BURUD), Rückbenennung am 14.09. (das war der „Kurssprung um das 19,5-fache" aus dem Trockenlauf); DBRG und GBTG — Barübernahmen zu 16,00 $ und 9,50 $; CSAN → CSANY (21.09.); APGE und CRNX — Barübernahmen; HLX → HOS.

**Zwei Eigenheiten der Quelle, wichtig für Phase 2b:** (1) Der Abruf filtert nach dem Verarbeitungstag (bei Ausschüttungen der Zahltag), nicht nach dem Ex-Tag — 2.887 schon angekündigte Sätze mit späterem Zahltag liegen deshalb gesondert in `_angekuendigt.json`. (2) **Die Quelle ändert Sätze nachträglich:** bei gleichem Kennzeichen steht für AEG (Ex-Tag 03.09.) jetzt 0,206899 $ statt 0,208684 $ und für TAC (01.09.) 0,041765 $ statt 0,0525 $ (vom PM beim Abgleich gefunden) — Ausschüttungen ausländischer Werte werden offenbar erst zum Zahltag endgültig. Der alte Ordner ist also kein endgültiger Stand; beim Zusammenführen gilt je Kennzeichen der jüngere Satz, und die geänderten Sätze werden gezählt.

**Abnahme des PM:** alter Maßnahmen-Ordner (8.348 Dateien, keine jünger als der 04.09.) und alte Liste (23.08.) unverändert; eigene Zählungen an den neuen Dateien: 4.046 Barausschüttungen, 14 Splits vorwärts, die zwei Splits bei lebenden Reihen, 67 neue Abgänge (19 / 41 / 7), 57 von 57 Wechslern — wie geliefert; Suche nach Zugangsdaten in den elf Repo-Dateien ohne Treffer, die `.cmd` holt den Zugang nur aus dem Benutzerprofil.

## Phase 2a (Nr. 86, 04.10.2026) — Lebenszeit, Kopien und Leser neu gebaut; die Gründe-Tafel ein zweites Mal nur gezählt

Bericht `studien/datenfundament-2026-10-04/phase2/PHASE2A.md` (Commits `c645241`, `367f6bf`, `b6ea61b`, `c2d87ac`). Nichts Bestehendes wurde überschrieben.

| Was | Wo | Stand |
|---|---|---|
| Lebenszeit aus den Minuten | `E:/Markt-Dashboard-Archiv/alpaca1m-ableitungen/lebenszeit-minuten.json` (Kennung `…/lebenszeit-minuten/v1`; Bau `phase2/lebenszeit-minuten.js`) | 7.299 Aktienreihen, 2.249 lebend (Regel: letzter Minutentag höchstens 10 Handelstage vor dem Archivende 02.10.2026); genau die 57 Wechsler, 0 umgekehrt; ein Panel darf frühestens am 17.09.2026 enden. Die alte `_lebenszeit.json` bleibt. |
| Bereinigte Kopien v2 | `E:/Markt-Dashboard-Archiv/alpaca1m-bereinigt-v2/` (209 Jahresdateien in 106 Ordnern, 764 MB, eigenes Manifest; Bau `phase2/kopien-v2.js`) | 147 Dateien in 44 Reihen ohne die falschen Split-Sätze (38 nicht angewandt, fünf mit berichtigtem Ex-Tag, MFH nicht angewandt) und 62 der 64 veralteten 2026er Kopien bis zum Ende der Rohdatei. **Ohne v2-Kopie für 2026: BURU und WHLR** (Split nach dem 03.09., den das alte Maßnahmen-Archiv nicht kennt — der Nachtrag aus Nr. 89 kennt beide). |
| Leser v2 | `studien/datenfundament-2026-10-04/phase2/leser2.js` (umhüllt `lesen.js`, ändert es nicht) | nimmt die Lebenszeit aus den Minuten und die v2-Kopien; eine veraltete alte Kopie wird nicht mehr still gelesen, sondern bricht mit Meldung ab. **Nach jedem nächtlichen Nachlauf veralten die 2026er v2-Kopien** — bis `kopien-v2.js --schreiben` neu gelaufen ist, bricht der Leser für diese Reihen ab (so gewollt; die Fortschreibung ist für Phase 2b offen). |

**Gründe-Tafel, zweiter Trockenlauf über alle 5.050 Zeilen (keine Tafel entstanden).** Mit dem richtigen Anker und den drei Regeln des PM kippen 342 von 4.996 Gründen (125 auf „unbekannt"), 99 „unbekannt" bekommen einen Grund, 54 Reihen kommen hinzu; die Totalverlust-Eigenschaft änderte sich bei 261 Reihen (+160 / −101), davon 14 mit Klasse 1–3 (+7 / −7). **Zwei der drei Regeln des PM tragen so nicht:** (1) die Firmenkennung aus der Polygon-Liste ist bei mindestens 118 von 4.717 Zeilen eine fremde Firma (AFAM, YHOO) und bei 99 ein anderer Registrant — „Polygon gilt" tauscht einen Fehler gegen einen anderen; (2) ohne die fernen Vollzugsmeldungen fällt eine Übernahme auf die Abmelde-Meldung der Zielgesellschaft zurück und würde „Zwangs-Delisting" (58 Zeilen) — alle sieben neuen Totalverluste in Klasse 1–3 sind nach den Belegen keine. Die dritte Regel (Formular 25 allein ist nicht „freiwillig") wirkt wie gedacht (337 Zeilen). Richtig bleibt der Anker (Rüge am Reihenende bei 79 % statt 47 % der Zeilen). **Folge:** ein dritter Zähllauf mit verfeinerten Regeln (Nr. 90), erst danach die Tafel v2.

**Abnahme des PM:** Lebenszeit-Datei gegen die eigene Zählung gehalten (dieselben 57); Kopien an drei Reihen Kerze für Kerze verglichen (CRWD und POWL 2026: jede Kerze der alten Kopie gleich, v2 reicht bis zum 02.10.; GSK 2022: v2 gleich dem Rohkurs, die alte Kopie lag vor dem Ex-Tag um den Faktor 1,25 daneben); in `alpaca1m-bereinigt/` keine Datei mit heutigem Datum; 66 Prüfungen selbst gefahren.

## Dritter Zähllauf der Gründe-Tafel (Nr. 90, 04.10.2026) — die Regeln tragen fast; und: 310 Reihen stehen doppelt im Panel

Nur gezählt, keine Tafel (`studien/datenfundament-2026-10-04/zaehllauf3/ZAEHLLAUF3.md`, `REGEL-ZAEHLLAUF3.md`; Commits `477c263` Regel vor dem Zählen, `d9ef334` Wortlisten nach der Lernprobe, `66d99b2` Zählungen). Über „Übernahme, Zwangs-Delisting oder freiwillig" entscheidet jetzt der **Wortlaut der Abmelde-Meldung** (8-K Punkt 3.01; 870 Texte bei der SEC geholt, 1.047 Anfragen, keine Sperre).

| Größe | zweiter Lauf | dritter Lauf |
|---|---|---|
| Zwangs-Delisting | 628 | **372** |
| Übernahme | 1.563 | 1.665 |
| SPAC-Ende | 292 | 343 |
| freiwillig | 23 | 108 |
| abgemeldet, Anlass offen | 337 | 370 |
| ausgesetzt (neu) | – | 23 |
| unbekannt | 238 | 189 |
| **Totalverlust in der Hauptlesart** (Insolvenz + Zwangs-Delisting) | 963 | **716** |
| … davon mit Klasse 1–3 | 19 | **5** (SIVB, SAVE, NKLA, NOVA richtig; CCCX falsch) |

**Die Wortlisten:** Prüfprobe des Chats 37 von 40; Eichprobe mit bekannter Wahrheit: 139 von 150 Übernahmen laut Alpaca lesen sich als Vollzug (2 als Rüge), 81 von 100 Insolvenz-Kürzeln als Rüge. **Leseprobe des PM** (24 andere Texte, eigene Saat): alle 22 eingestuften Texte richtig gelesen; die zwei nicht eingestuften zeigten Regel-Lücken (ein Mantel, eine Kapital-Umstellung).

**Was der PM bei der Abnahme zusätzlich gezählt hat — und was daraus für die Tafel folgt (Entscheide, erst gezählt, dann entschieden):**

| Nr. | Fund (Zahl) | Entscheid für die Tafel v2 |
|---|---|---|
| E1 | Das „Q am Ende" trifft auch gewöhnliche Kürzel: 8 von 22 Zeilen ohne Insolvenz-Meldung sind Umbenennungen (ARQ, INFQ, ARQQ, IONQ, CCAQ, ELIQ, NHIQ, TAIQ) | Insolvenz-Kürzel nur, wenn das neue Kürzel fünf Zeichen hat und auf Q endet oder genau das alte plus Q ist (alle 109 mit Insolvenz-Meldung erfüllen das) |
| E2 | 21 Zwangs-Delistings sind Mäntel um 10 $ mit anderer Kennziffer (ATEK, CHPM, OTEC, PORT …) | Mantel = Kennziffer 6770 **oder** Mantel-Name, und roher letzter Kurs ab 8 $ → SPAC-Ende |
| E3 | Eine Rüge 31 bis 180 Tage vor dem Reihenende ohne Formular der Börse ist oft nur eine Mahnung (CTRV, PHMD: später umbenannt): 42 von 50 Zeilen | eine frühe Rüge zählt nur mit dem Formular der Börse (25-NSE) höchstens 30 Tage am Reihenende |
| E4 | „Wortlaut unklar → Zwangs-Delisting" trifft 30 Zeilen, mindestens 12 davon sind Umbenennungen, Mäntel, Abwicklungen (OZM, TSRA, NRCIB, CFD …) | unklarer Wortlaut → „abgemeldet, Anlass offen" (kein Totalverlust in der Hauptlesart) |
| E5 | Formular 25 ohne Abmelde-Meldung: 61 von 370 liegen mehr als 30 Tage vom Reihenende (OZRK: ein Jahr davor) | zählt nur höchstens 30 Tage am Reihenende |
| E6 | Nach verworfener Polygon-Kennung prüft niemand den Namen der Suchfirma (SYMC → Broadcom) | dieselbe Namensprobe auch für die Suchfirma; sonst keine Firma |
| E7 | Der „letzte Kurs" der Arbeitsdatei ist **bereinigt**, nicht roh: bei 63 von 958 Zeilen weicht er um mehr als das 1,5-Fache ab (RNVA 58,9 Mrd statt 0,45 $; LFLY 283,50 statt 0,61 $) | jede Kursgrenze am **rohen letzten Minutenschluss**; die Tafel führt beide Kurse |
| **V9** | **310 abgegangene Reihen haben einen Zwilling**, der weiterlebt (siehe unten); 109 davon tragen einen anderen Grund als „Umbenennung", 14 standen im dritten Lauf als Totalverlust | Zwilling → „Umbenennung, Nachfolger im Archiv"; die alte Reihe wird im Panel v2.3 als doppelt entfernt |
| E8 | Nach V9 bleiben in Klasse 1–3: 9 der 18 „unbekannt" (DISCA, DISCK, DWDP, FRC, SBNY, YHOO, QVCA, MHFI, LGF) und die Zeilen mit „abgemeldet", „freiwillig", „ausgesetzt" | der PM liest diese Zeilen und trägt sie von Hand mit Quelle ein |

**Doppelte Vorgänger-Reihen (Fund des PM, 15:28).** Alpaca liefert unter dem **neuen** Kürzel die Geschichte des alten mit. Das Archiv hat beide gesammelt: KORS (2016–2018) und CPRI (2016–2026) tragen bis Ende 2018 dieselben Kurse. Gezählt am Tages-Panel v2.2 (Zwilling = an den drei letzten Tagen der Reihe genau gleicher roher Schluss und gleiche Eröffnung, und die andere Reihe läuft weiter): **310 Reihen, 37 davon mit Klasse 1–3, 193.581 doppelte Panel-Zeilen (2,0 %)**. In der alten Gründe-Tafel — auf ihr liefen alle Studien — standen 32 dieser weiterlebenden Firmen als Totalverlust (darunter SLW und SYMC mit Klasse 1–3), 29 weitere nur in der strengen Lesart. Beispiele: KORS → CPRI, HRS → LHX, VRX → BHC, WYN → TNL, SYMC → GEN, CTRP → TCOM, OZRK → OZK, COH → TPR, DPS → KDP. Dieselbe Dopplung steckt im Minutenarchiv (rund 4 % der Aktienreihen). **Wirkung auf den Rückblick des Momentum-Buchs** (eigener Rechner des PM, mit Regel K, die 310 Reihen aus dem Universum genommen): Korb 187, 2017–2021 Median +7,27 statt +7,32 Pp p. a. (63 von 63 vorn, wie zuvor); 2021–2026 unverändert (+8,25, 61 von 63) — der Befund steht. Für Studien auf dem breiten Markt und für jede Regel, die Verlierer kauft, ist die Wirkung nicht gemessen.

**Abnahme des PM:** die drei Commits berühren nur den neuen Ordner; `test.js` selbst gefahren (87 grün), Lint sauber; Zählung der Gründe und der Totalverlust-Liste aus `z3-gruende-neu.json` nachgerechnet (716; fünf Namen); eigene Leseprobe; die Zahlen des PM aus dem Auftrag hat der Chat nachgezählt (zwei kleine Abweichungen: 30 statt 29 verdeckte Ende-Maßnahmen, 183 / 160 statt 182 / 158). Verbrauch 458k bei 300k (Abrechnung; Chat schätzte 285k).

## Ausschüttungen und Splits aus dem Tagesabruf der App (Nr. 87, 04.10.2026)

Die App holt Splits und Ausschüttungen im selben Yahoo-Tagesabruf wie die Kurse (`&events=div,splits`, kein zusätzlicher Abruf; Bestand `mf_ereignisse`). Am 04.10.2026 live geprüft (NVDA, WMT): Yahoo nennt die Ausschüttung **in heutiger Stückelung** (NVDA vor dem Split 10:1: 0,004 statt gezahlter 0,04 $) und stempelt das Ereignis mit dem **Zeitstempel des Tagesbalkens des Ex-Tags** (265 von 265 Ausschüttungen, 15 von 16 Splits; die Ausnahme ist ein Tag ohne Handel). Zwei Eigenheiten: (1) bei ausländischen Hinterlegungsscheinen nennt Yahoo den Betrag **vor** der Quellensteuer des Heimatlands, Alpaca den Betrag danach (TSM: 1,107 gegen 0,875 $, 21 %) — die App bucht den Yahoo-Betrag, weil Buch und Maßstab beide vor Steuern gerechnet werden; (2) Yahoo meldet Abspaltungen als Split mit krummem Verhältnis (SPGI 1057 : 1000) — gebucht wird das wie ein Split, der Wert der Position bleibt dabei erhalten.

## Vierter Zähllauf der Gründe-Tafel (Nr. 92, Schritt 1, 04.10.2026) — Regeln fast reif, 33 Handeinträge, Zwillingszahl berichtigt

Nur gezählt (`studien/datenfundament-2026-10-04/zaehllauf4/ZAEHLLAUF4.md`, Commits `02ac0b5` Regel vor dem Zählen, `f97dff5` Zählungen). Mit Zwilling im Archiv (V9) und E1 bis E7: **Totalverlust in der Hauptlesart 612** (dritter Lauf 716, alte Tafel 904), davon mit Klasse 1–3 nur noch SIVB, SAVE, NKLA, NOVA; strenge Lesart 1.298 (28 mit Klasse 1–3 = die Leseliste). Gegenprobe: alle Änderungen aus ergibt den dritten Lauf in 5.050 von 5.050 Zeilen.

**Zwillinge, berichtigt.** Die Zahl des PM aus dem dritten Lauf (310, „193.581 doppelte Zeilen") war zu klein: er hatte das Verhältnis Eröffnung zu Schluss auf **exakte** Gleichheit zweier Kommazahlen geprüft; nach einer Division stimmen die letzten Stellen nicht immer. Mit Toleranz 1e-9: **368 Zeilen der Gründe-Tafel** (Zählung des Chats, 43 mit Klasse 1–3, 224.051 doppelte Panel-Zeilen) und **382 Abschnitte des Panels** (Zählung des PM). Der Unterschied ist keiner: die Tafel und das Panel zählen Verschiedenes — wechselt ein Kürzel den Besitzer (HCP: bis 2019 das heutige DOC, danach HashiCorp), meint die Zeile der Tafel den späteren Träger, der Abschnitt des Panels den früheren. **Doppelte Reihen werden deshalb am Panel entfernt, nicht über die Tafel.** Vier echte Nachfolger mit Zusammenlegung (FFHL, GMTX, MYOS, THLD) scheitern an der 60-Tage-Bedingung, weil ein Split dazwischen liegt.

**Handeinträge des PM** (`studien/datenfundament-2026-10-04/handeintraege-v2/`, `f9cc14a`): die 28 Reihen der Leseliste und fünf Mäntel um 10 $, die die Namensregel verfehlt; je Eintrag eine Quelle (`daten` = in den Dateien nachgesehen, `wissen` = Allgemeinwissen, so gekennzeichnet). Danach in der Hauptlesart **609 Totalverluste, mit Klasse 1–3 genau sechs — SIVB, SBNY, FRC, SAVE, NKLA, NOVA, alle echte Insolvenzen**; streng 1.275 (10 mit Klasse 1–3). Kein Totalverlust mehr bei China Mobile, Luckin Coffee und DiDi (Gang an eine andere Börse oder in den Freiverkehr).

**Regeln für den Bau von Tafel v2 und Panel v2.3 (Entscheide des PM nach den Zählungen):** (B1) Zwilling mit Toleranz 1e-9; die 60-Tage-Bedingung zählt einen Tag auch, wenn das Verhältnis der rohen Schlüsse über das Fenster gleich bleibt (Split dazwischen); im Panel wird jeder Abschnitt mit Zwilling als doppelt entfernt. (B2) Die Namensprobe für die Suchfirma (E6) verwarf sechs richtige Firmen (BCR, BNK, CVO, HOLI, OIIM, OTIV) — sie wird nur ein Kennzeichen, keine Verwerfung; SYMC fängt jetzt der Zwilling. (B3) Die Handeinträge gehen allen Regeln vor. (B4) Drei vollzogene Mantel-Fusionen (CLOE, LACQ, WTMA) stehen als SPAC-Ende — beides wird zum letzten Kurs gebucht, kein Eingriff. (B5) Tafel v2 und Panel v2.3 sind neue Dateien; die bisherigen bleiben, abgeschlossene Studien rechnen weiter auf ihrem Stand.

**Abnahme des PM:** die beiden Commits berühren nur den neuen Ordner; die Totalverlust-Zahlen aus `z4-gruende-neu.json` nachgezählt (612 / 4, 1.298 / 28 — gleich); die Zwillinge am Panel mit Toleranz selbst gezählt und Liste gegen Liste gehalten (Unterschiede erklärt: Schreibweise `~2`, Tafel gegen Panel, HLX am Ende des Panels); die Leseliste Zeile für Zeile gelesen; Momentum-Rückblick ohne alle Zwillinge nachgerechnet (siehe Belegstand). Verbrauch 408k bei 250k (Abrechnung; Chat schätzte 200k; dazu der am Sitzungslimit abgebrochene erste Versuch, Verbrauch nicht gemeldet), Zweitleser 95k.
