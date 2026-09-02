# Kostenstruktur

**Kosten sind klassenspezifisch. Es gibt keine pauschale Zahl.**

## Die Kostenformel

    Gesamtkosten = K (Runde, einmalig) + F (Finanzierung je Nacht) × H (Haltedauer)

*Fundstelle: Nachtrag `384cd10`, eingearbeitet vor jedem Ertragsblick*

**Der Kern:** Längeres Halten verteilt nur die **Runde** über mehr Nächte. Die **Finanzierung
fällt jede Nacht neu an.** Deshalb rettet kein H eine zu kleine Kante.

## Je Gefäß

| Gefäß | Kosten | Quelle |
|---|---|---|
| **CFD gehebelt** | K + **0,0247 Pp je Nacht** (Capital.com 4 % p.a. + Benchmark) | `studien/vorregistrierung-2026-09-01-glockendruck-haltedauer/` |
| CFD ungehebelt (1:1) | nur K — laut Quelle finanzierungsbefreit; **reicht trotzdem nicht** | dieselbe |
| **Kassa-Aktie (echter Broker)** | ≈ **0,06 Pp konstant**, keine Übernachtfinanzierung — **Annahme.** Zwei Messungen laufen: das Alpaca-Paper (Abschnitt unten) und die **historische Spannen-Studie** (Abschnitt „Kassa-Hürde je Umsatzklasse und Jahr") | dieselbe, nachrichtliche Spalte |
| **Hebelschein** | **0,23 Pp je 3 Stunden** | `studien/signalstudie-2026-08/` — tötete alles Intraday |

## Die gemessene Runde (Stand 01.09.2026)

    20 Aktien-Runden ueber 3 Tage    Median 0,0857 %   p75 0,1103 %   max 0,2525 %

**⚠ ETIKETT: FREIGABESCHWELLE UNERFÜLLT.** *16 der 20 stammen aus EINER Minute, nur EINE
Marktlage (trend-auf) ist erfasst. Verlangt sind ≥20 Runden über ≥2 Tage UND ≥2 Marktlagen.*

**Und die Stichprobe schöpft aus dem falschen Ende:** Messbasis ausnahmslos **≥1,6 Mrd $**
Tagesumsatz (`RC_NOT_ENOUGH_MARGIN` blockte QCOM/TSLA/MU/ABBV, „Kein Markt" MS). Die
glockendruck-Auswahl liegt bei **69 Mio $ Median** — Faktor ~150 darunter.

> **Also: 0,10 % ist für die Milliarden-Klasse passend und für unsere Kandidaten-Universen
> optimistisch.** *Fundstelle: `uebergabe/kosten-angriff` bzw. Commit `6263f1b`.*

## Aktien-Gefäß Alpaca, Messung läuft seit 02.09.2026

**Eingebaut 02.09.2026, noch 0 Runden.** Die Messung startet, sobald Wilhelm den Paper-Schlüssel
in die App-Einstellungen einträgt (Verbindungstest = sein Klick, Stand dieser Zeile: offen).
Gemessen wird das, was oben als Annahme steht: **0,06 Pp je Umlauf für die Kassa-Aktie**, und zwar
NUR an Alpaca-Runden — die Capital-Reihe (CFD, 0,10 %) bleibt getrennt (`kostenBilanz` gegen
`alpacaBilanz` in `kosten.js`, Runden tragen `gefaess`).

| Was | Wie | Fundstelle |
|---|---|---|
| Runde | rund 200 $ zum Markt kaufen, sofort verkaufen; beide Fills gegen die Mitte davor; Stückzahl ganzzahlig `max(1, floor(200/mid))` | `kosten.js` `alpacaRundeKern` |
| Teilfüllung | Alpaca füllt im Paper ~10 % der Orders absichtlich teilweise — Rest storniert, Position glattgestellt, **Runde verworfen** und als „Teilfüllung" protokolliert (`MESSUNG.verworfen`) | `alpaca.js` `marktOrder`, Klinke (b) in `test-v6.js` |
| Umsatzklassen | **5–50 / 50–250 / 250–1.000 / ab 1.000 Mio $** Median-Tagesumsatz (20 Balken Schluss × Stück, Regel aus `liquide.js`), nominal, eine Stelle; Ziel **≥ 10 Runden je Klasse**; die Klasse mit den wenigsten Runden zuerst | `UMSATZ_KLASSEN` in `kosten.js`; Anforderung `studien/wiedervorlage-2026-09-02/BERICHT.md` §2.3 |
| Symbole | aus dem, was die App heute handeln würde: Momentum-Korb (`D.mfBuch.positionen`) + Intraday-Signalliste (`scanUniverse`); fehlt eine Klasse, Ergänzung aus `massive/universum-2024-09-02.json` (nur lesen), zugelassen nur, was heute in der Klasse liegt | `depot.js` Verkabelung `kandidatenAlpaca`, `kosten.js` `naechstesAlpacaSymbol` |
| Übernacht-Runde | Kauf Schlussauktion (`cls`), Verkauf Folgeeröffnung (`opg`); Fills zusätzlich gegen offiziellen Schluss/Eröffnung → `schlupfSchluss`, `schlupfEroeffnung`; nie mehr als eine offene Position; Rückfall Markt 15:58/09:31 ET mit `auktion: false`, falls der Endpunkt ablehnt (unverifiziert) | `kosten.js` `uebernachtNachsehen` |
| Protokoll je Runde | `gefaess, stueck, gegenwertUsd, umsatzMedianUsd, umsatzKlasse, anteilUmsatz, uebernacht, auktion, fillAuf, fillZu, mid, notiert, marktlage` | Store `kostenmessung` |
| Grenzen der Simulation | kein Marktimpact, keine Warteschlange, Füllung am NBBO des Gratis-Feeds `iex` — gemessen wird die **Spanne**, nicht die Tiefe | [datenquellen.md](datenquellen.md) → Broker-Schnittstellen |

Übergabe: `uebergabe/alpaca-kostenmessung-2026-09-02.md` (2.757 Zusicherungen grün, Gegenprobe je
Klinke rot, UI-Probe grün). **Ein Urteil gibt es erst mit Runden über verschiedene Tage und
Marktlagen und ≥ 10 je Klasse — bis dahin bleibt 0,06 eine Annahme.**

## Kassa-Hürde je Umsatzklasse und Jahr — aus notierten Spannen, **Lauf seit 02.09.2026**

**Schritt 0 ist bestanden:** die Alpaca-Gratisstufe führt die konsolidierte NBBO-Tafel
(`feed=sip`) zurück bis mindestens Anfang 2016 — siehe [datenquellen.md](datenquellen.md).
Gemessen wird die notierte Spanne `(ap − bp) / mid` in Pp **je Umlauf** an 55.455 gezogenen
Zeitpunkten: 4 Umsatzklassen × 11 Jahre × 3 Tageszeitfenster.
*Registrierung: `studien/vorregistrierung-2026-09-02-spannen-historisch/VORREGISTRIERUNG.md`
(Commit `4f22b14`, vor dem Bau des Werkzeugs).*

**Die Tabelle steht noch aus** — sie kommt aus `ERGEBNIS.md`, sobald der Lauf durch ist.
**Bis dahin bleibt 0,06 eine Annahme und wird nicht durchgestrichen.**

Was der Testlauf (20 Symbole, 2018, **kein Befund**) schon zeigt, und was die Tabelle
mitbringen wird:

> ### ⚠ Der Cent-Boden: „Hürde je Umsatzklasse" ist für liquide Werte eine PREISAUSSAGE
>
> Die kleinste zulässige Preisstufe ist **1 Cent**. Eine Spanne von 1 Cent ist bei Kurs K
> genau `100/K × 0,01` Pp — bei 20 $ **0,050 Pp**, bei 200 $ **0,005 Pp**. Im Testlauf lagen
> **64 % / 68 %** der Quotes der beiden liquiden Klassen auf diesem Boden; `ab1000` maß
> deshalb *breiter* als `250-1000`, weil es zufällig die billigeren Aktien enthielt
> (GE, T — Median 45,83 $ gegen 62,41 $).
>
> **Wer eine Strategie auf Werten unter 30 $ handelt, zahlt mehr als jemand, der dieselbe
> Strategie auf Werten über 150 $ handelt — bei identischer Liquidität.**
>
> Das betrifft jede Kostenannahme dieses Projekts, auch die 0,06 und auch die Paper-Messung
> unten, deren Symbolwahl heute **nur nach Umsatzklasse** schichtet und den Kurs nicht führt.
> *Fundstelle: Registrierung §9a, Übergabe
> `uebergabe/spannen-historisch-2026-09-02.md` §3.*

## Monatshaltedauer, ausgefüllt am Momentum-Korb (gemessen 02.09.2026)

63 Handelstage sind **91,5 Kalendernächte** (88–97): F·H = 0,0247 × 91,5 = **2,26 Pp je
Umlauf** — **die Finanzierung allein übersteigt die gesamte gemessene Kante (+1,54 Pp)**.
K (0,110) ist daneben Nebensache: 54 % des Korbs werden aus der Vorperiode gehalten, effektiv
0,05 Pp. Und K gilt für Mega-Caps — vom Momentum-Korb liegen **2,6 % über 1 Mrd $**, 24,5 %
über 100 Mio $, **18,2 % unter 5 Mio $** Tagesumsatz. Für die Kassa-Annahme (0,06,
10.000-$-Positionen in liquiden Werten) gilt dasselbe: für ein Fünftel des Korbs sicher nicht.
*Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-messung/ERGEBNIS.md`*

## Der Befund, der daraus folgt

Bei glockendruck: Grenzertrag **+0,007 Pp je Zusatznacht** gegen **0,0247 Pp** Finanzierung.
**Kein H bringt die Kante über die Kosten.** Und im liquiden Teil (≥1 Mrd $), wo die Kosten
messbar und niedriger wären, **stirbt der Effekt** (t 0,68).

> ### Die ~~allgemeine~~ Lehre **der Übernacht-Familie**: **Der Effekt lebt, wo er nicht handelbar ist.**
> Das erklärt, warum Übernacht-Anomalien in der Literatur existieren und trotzdem niemand
> davon lebt. **Als Filter in die Machbarkeitsprüfung übernommen.**
>
> **Eingegrenzt 02.09.2026:** Für **Monats-Momentum gilt sie nicht.** Der Korb nur aus Werten
> ≥ 100 Mio $ Tagesumsatz (Punkt-in-Zeit) trägt **+1,835 Pp je Umlauf** gegen +1,541 breit,
> gepaart +0,29 (t 0,69) — nicht schwächer, eher stärker. Die Lehre ist dort gemessen, wo
> sie steht (glockendruck, ≥ 1 Mrd $, t 0,68), und darf nicht pauschal auf Monatshaltedauer
> übertragen werden. *Fundstelle: `studien/vorregistrierung-2026-09-02-momentum-liquide/ERGEBNIS.md`*
