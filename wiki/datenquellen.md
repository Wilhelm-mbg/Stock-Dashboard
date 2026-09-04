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
