# Datenquellen und Fenster

**Die Fensterlage entscheidet, welche Frage überhaupt stellbar ist.** Eine gute Idee, deren
Daten außerhalb des Fensters liegen, ist unmöglich — nicht schwierig.

## Kursarchive (auf `E:/Markt-Dashboard-Archiv`, Pfad steht in `archiv1d-pfad.txt`)

| Archiv | Umfang | Fenster | Bemerkung |
|---|---|---|---|
| **archiv1d** | 2.965 Werte | **bis 1986**, ~4.665 Handelstage | der Kernbestand, mit Eröffnungskursen |
| **archiv60m** | 2.886 Werte | **730 Tage ROLLIEREND** | Quelle gibt nicht mehr her |
| 1m | — | ~7 Tage | **Sammlung RUHT** (Entscheid, siehe [entscheide.md](entscheide.md)) |
| 5m / 15m | — | ~60 Tage | sammelt seit 26.08.2026 |
| **massive/** | 1.164 verschwundene Reihen | Messzeitraum | für [ueberlebensverzerrung.md](ueberlebensverzerrung.md) |

**⚠ `massive/universum-2024-09-02.json` ist EINGEFROREN und schreibgeschützt** (Original +
Kopie auf `E:`). Nie anfassen, nie neu erzeugen — sonst werden alle bisherigen
Überlebensverzerrungs-Messungen unvergleichbar. *Entscheid 31.08.2026.*

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
