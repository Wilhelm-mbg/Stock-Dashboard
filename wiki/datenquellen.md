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
