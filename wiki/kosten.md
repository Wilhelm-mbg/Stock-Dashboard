# Kostenstruktur

**Kosten sind klassenspezifisch. Es gibt keine pauschale Zahl.**

## Die Kostenformel

    Gesamtkosten = K (Runde, einmalig) + F (Finanzierung je Nacht) × H (Haltedauer)

*Fundstelle: Nachtrag `384cd10`, eingearbeitet vor jedem Ertragsblick*

**Der Kern:** Längeres Halten verteilt nur die **Runde** über mehr Nächte. Die **Finanzierung
fällt jede Nacht neu an.** Deshalb rettet kein H eine zu kleine Kante.

**K ist klassenspezifisch, F nicht.** Für das **Kassa-Gefäß** ist K seit 03.09.2026 gemessen
und **F = 0**: 5–50 Mio $ **0,1569** · 50–250 **0,0854** · 250–1.000 **0,0647** ·
ab 1.000 **0,0449** Pp je Umlauf (Fenster `mitte`, ab 2021, Symbol-Median, Alpaca ohne
Provision). *Fundstelle: Abschnitt „Kassa-Hürde je Umsatzklasse und Jahr".*

## Je Gefäß

| Gefäß | Kosten | Quelle |
|---|---|---|
| **CFD gehebelt** | K + **0,0247 Pp je Nacht** (Capital.com 4 % p.a. + Benchmark) | `studien/vorregistrierung-2026-09-01-glockendruck-haltedauer/` |
| CFD ungehebelt (1:1) | nur K — laut Quelle finanzierungsbefreit; **reicht trotzdem nicht** | dieselbe |
| **Kassa-Aktie (echter Broker)** | ~~≈ 0,06 Pp konstant — **Annahme**~~ **GEMESSEN 03.09.2026, und es ist keine einzige Zahl:** K je Umsatzklasse (Fenster `mitte`, ab 2021) **5–50 Mio $ = 0,1569 · 50–250 = 0,0854 · 250–1.000 = 0,0647 · ab 1.000 = 0,0449 Pp**, F = 0 (keine Übernachtfinanzierung). Abschnitt „Kassa-Hürde je Umsatzklasse und Jahr". Das Alpaca-Paper misst weiter als Kontrolle (Abschnitt unten) | `studien/vorregistrierung-2026-09-02-spannen-historisch/ERGEBNIS.md` |
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

## Kassa-Hürde je Umsatzklasse und Jahr — **GEMESSEN 03.09.2026**

Notierte Spanne `(ap − bp) / mid` in Pp **je Umlauf** aus der konsolidierten NBBO-Tafel
(`feed=sip`), an **55.455 gezogenen Zeitpunkten**: 4 Umsatzklassen × 11 Jahre × 3
Tageszeitfenster, 100 Symbole je Klasse und Jahr, 5 Handelstage je Symbol.
Davon **55.067 mit gültiger Spanne (99,3 %)**, 386 „kein Quote", 2 gekreuzt, 0 Nullkurs.
*Registrierung: `studien/vorregistrierung-2026-09-02-spannen-historisch/VORREGISTRIERUNG.md`
(Commit `4f22b14`, vor dem Bau des Werkzeugs) · Ergebnis: `…/ERGEBNIS.md` · Übergabe:
`uebergabe/spannen-auswertung-2026-09-03.md`*

**Die Kontrollen, vor jeder Zahl:** Positivkontrolle AAPL 2024 `mitte` **0,0090 Pp** (Soll
< 0,02) **bestanden**; Ordnungskontrolle 5-50 > ab1000 in **allen 11 Jahren** bestanden;
Placebo vorbörslich gegen `mitte` an denselben Symbol-Tagen **Faktor 13,61** (0,6069 gegen
0,0446 Pp, n 321; Soll ≥ 2) **bestanden**.

### Das K der Kostenformel für das Kassa-Gefäß

`K + F · H` mit **F = 0** (keine Übernachtfinanzierung) und **K je Umsatzklasse** —
Symbol-Median im Fenster `mitte`, bei Alpaca ohne Provision:

| Klasse | K 2016–2020 | **K ab 2021 (maßgeblich)** | gegen Annahme 0,06 | gegen CFD 0,1247 |
|---|---|---|---|---|
| **5-50** | 0,1107 | **0,1569** | Annahme **zu optimistisch** (Faktor 2,6) | **darüber** (Faktor 1,3) |
| **50-250** | 0,0477 | **0,0854** | Annahme **zu optimistisch** (Faktor 1,4) | darunter |
| **250-1000** | 0,0289 | **0,0647** | Annahme **zu optimistisch** (Faktor 1,1) | darunter |
| **ab1000** | 0,0222 | **0,0449** | Annahme **zu pessimistisch** (Faktor 1,3) | darunter |

**Es gibt keine einzige Zahl.** Zwischen der günstigsten und der teuersten Klasse liegt ab
2021 **Faktor 3,5**. Die alte Annahme 0,06 war für drei der vier Klassen zu optimistisch und
nur für die Milliarden-Klasse zu pessimistisch.

**IBKR nachrichtlich:** auf eine 10.000-$-Position kommen 2 × max(0,35 $; 0,0035 $/Stück)
dazu — bei 50-$-Kurs **+0,014 Pp** je Umlauf; bei einer 2.000-$-Position greift das Minimum,
**+0,035 Pp**. Alpaca berechnet für US-Aktien keine Provision.

### Je Klasse × Fenster (alle Jahre gepoolt)

**Kein Bootstrap-Band** — `ERGEBNIS.md` §4 weist für diese gepoolten Zahlen keines aus.
Median-Kurs und Cent-Boden-Anteil stehen dort nur für das Fenster `mitte`.

| Klasse | eroeffnung | **mitte** | schluss | Eröffnung/Mitte | Median-Kurs (`mitte`) | am Cent-Boden (`mitte`) |
|---|---|---|---|---|---|---|
| 5-50 | 0,3543 | **0,1323** | 0,0868 | 2,68 × | 35,67 $ | 29 % |
| 50-250 | 0,1616 | **0,0658** | 0,0433 | 2,46 × | 68,47 $ | 34 % |
| 250-1000 | 0,1127 | **0,0545** | 0,0359 | 2,07 × | 110,34 $ | 34 % |
| ab1000 | 0,0789 | **0,0436** | 0,0317 | 1,81 × | 170,87 $ | 31 % |

**Das Eröffnungsfenster kostet das 1,8- bis 2,7-Fache des Mittagsfensters**, das
Schlussfenster ist das günstigste. Die vor dem Lauf hingeschriebene Erwartung war
„2–4 × breiter" (Registrierung §0.1) — sie trifft am unteren Rand zu.

### Die Hürde je Klasse und Jahr, Fenster `mitte` — mit Band und Diagnose

**Maßgeblich ist `mitte`** (10:00–15:30 ET, 330 der 390 Handelsminuten, Registrierung §8).
Band = 95-%-Perzentilband aus **1.000 Cluster-Bootstrap-Ziehungen über Symbole** (ganze
Symbole samt allen ihren Zeitpunkten). Median-Kurs und Cent-Boden-Anteil stehen daneben,
wie Registrierung §9a es verlangt — **berichtet, nicht verrechnet.**

| Klasse | Jahr | Symbole | **Symbol-Median** | 95-%-Band | Median-Kurs | am Cent-Boden | „kein Quote" |
|---|---|---|---|---|---|---|---|
| 5-50 | 2016 | 100 | **0,0990** | [0,0796, 0,1166] | 38,16 $ | 33 % | 0,0 % |
| 5-50 | 2017 | 100 | **0,0898** | [0,0818, 0,1091] | 35,60 $ | 36 % | 0,0 % |
| 5-50 | 2018 | 98 | **0,1110** | [0,0903, 0,1391] | 39,34 $ | 27 % | 2,0 % |
| 5-50 | 2019 | 98 | **0,1017** | [0,0938, 0,1203] | 38,90 $ | 26 % | 2,2 % |
| 5-50 | 2020 | 100 | **0,1521** | [0,1340, 0,1666] | 31,58 $ | 25 % | 0,2 % |
| 5-50 | 2021 | 100 | **0,1572** | [0,1326, 0,1908] | 45,14 $ | 25 % | 1,0 % |
| 5-50 | 2022 | 100 | **0,1582** | [0,1332, 0,1694] | 34,22 $ | 28 % | 0,4 % |
| 5-50 | 2023 | 100 | **0,1296** | [0,1087, 0,1585] | 38,68 $ | 30 % | 0,4 % |
| 5-50 | 2024 | 100 | **0,1490** | [0,1244, 0,1739] | 36,06 $ | 31 % | 0,0 % |
| 5-50 | 2025 | 100 | **0,1769** | [0,1443, 0,2163] | 29,00 $ | 26 % | 0,0 % |
| 5-50 | 2026 | 100 | **0,1585** | [0,1328, 0,1892] | 27,46 $ | 32 % | 0,2 % |
| 50-250 | 2016 | 97 | **0,0359** | [0,0319, 0,0422] | 57,89 $ | 53 % ⚠ | 3,0 % |
| 50-250 | 2017 | 97 | **0,0367** | [0,0328, 0,0474] | 61,42 $ | 48 % | 4,0 % |
| 50-250 | 2018 | 98 | **0,0449** | [0,0373, 0,0524] | 74,72 $ | 33 % | 2,6 % |
| 50-250 | 2019 | 98 | **0,0438** | [0,0384, 0,0529] | 64,13 $ | 40 % | 2,0 % |
| 50-250 | 2020 | 99 | **0,0619** | [0,0579, 0,0796] | 58,85 $ | 34 % | 1,0 % |
| 50-250 | 2021 | 98 | **0,0687** | [0,0538, 0,0816] | 102,57 $ | 24 % | 2,2 % |
| 50-250 | 2022 | 100 | **0,0729** | [0,0652, 0,0843] | 68,84 $ | 27 % | 0,4 % |
| 50-250 | 2023 | 100 | **0,0597** | [0,0521, 0,0678] | 80,38 $ | 33 % | 0,0 % |
| 50-250 | 2024 | 100 | **0,0941** | [0,0750, 0,1076] | 78,93 $ | 27 % | 0,0 % |
| 50-250 | 2025 | 100 | **0,1025** | [0,0902, 0,1393] | 64,82 $ | 29 % | 0,0 % |
| 50-250 | 2026 | 100 | **0,1172** | [0,1028, 0,1478] | 63,11 $ | 28 % | 0,0 % |
| 250-1000 | 2016 | 98 | **0,0234** | [0,0192, 0,0248] | 71,76 $ | 63 % ⚠ | 2,0 % |
| 250-1000 | 2017 | 100 | **0,0218** | [0,0193, 0,0245] | 83,99 $ | 56 % ⚠ | 0,0 % |
| 250-1000 | 2018 | 100 | **0,0250** | [0,0229, 0,0296] | 87,55 $ | 45 % | 0,0 % |
| 250-1000 | 2019 | 100 | **0,0277** | [0,0251, 0,0346] | 111,36 $ | 37 % | 0,2 % |
| 250-1000 | 2020 | 100 | **0,0364** | [0,0330, 0,0446] | 118,28 $ | 33 % | 0,0 % |
| 250-1000 | 2021 | 100 | **0,0487** | [0,0414, 0,0635] | 132,51 $ | 24 % | 0,8 % |
| 250-1000 | 2022 | 100 | **0,0585** | [0,0484, 0,0662] | 105,75 $ | 23 % | 0,8 % |
| 250-1000 | 2023 | 100 | **0,0415** | [0,0312, 0,0537] | 115,78 $ | 33 % | 0,0 % |
| 250-1000 | 2024 | 100 | **0,0449** | [0,0378, 0,0622] | 127,28 $ | 29 % | 0,0 % |
| 250-1000 | 2025 | 100 | **0,0761** | [0,0606, 0,0911] | 151,54 $ | 15 % | 0,0 % |
| 250-1000 | 2026 | 100 | **0,0862** | [0,0719, 0,0995] | 151,19 $ | 21 % | 0,0 % |
| ab1000 | 2016 | 14 | **0,0262** | [0,0131, 0,0341] | 98,36 $ | 57 % ⚠ | 0,0 % |
| ab1000 | 2017 | 12 | **0,0203** | [0,0126, 0,0375] | 136,23 $ | 55 % ⚠ | 0,0 % |
| ab1000 | 2018 | 18 | **0,0236** | [0,0182, 0,0437] | 124,23 $ | 53 % ⚠ | 0,0 % |
| ab1000 | 2019 | 34 | **0,0215** | [0,0184, 0,0258] | 148,36 $ | 49 % | 0,0 % |
| ab1000 | 2020 | 20 | **0,0281** | [0,0183, 0,0494] | 207,46 $ | 24 % | 0,0 % |
| ab1000 | 2021 | 43 | **0,0355** | [0,0219, 0,0439] | 177,70 $ | 33 % | 0,0 % |
| ab1000 | 2022 | 54 | **0,0318** | [0,0217, 0,0382] | 118,23 $ | 39 % | 0,0 % |
| ab1000 | 2023 | 28 | **0,0198** | [0,0143, 0,0346] | 181,44 $ | 31 % | 0,0 % |
| ab1000 | 2024 | 38 | **0,0255** | [0,0162, 0,0377] | 179,14 $ | 30 % | 0,0 % |
| ab1000 | 2025 | 57 | **0,0383** | [0,0253, 0,0506] | 204,80 $ | 21 % | 0,0 % |
| ab1000 | 2026 | 79 | **0,0405** | [0,0325, 0,0470] | 226,49 $ | 14 % | 0,0 % |

Keine Zelle hat weniger als 10 Symbole (dünnste: `ab1000` 2017 mit 12 — dort ist die Ziehung
eine Vollerhebung). Keine Zelle erreicht die Warnschwelle von 20 % Fehlanteil: der höchste
Wert im ganzen Lauf ist **4,0 %** (50-250, 2017, alle drei Fenster). Der Fehlanteil ist
**nicht** in der dünnen Klasse konzentriert — Mittel über die 33 Zellen je Klasse: 5-50
**0,57 %**, 50-250 **1,39 %**, 250-1000 **0,38 %**, ab1000 **0,04 %** — und er fällt über die
Jahre von 1,25 % (2016) auf 0,02–0,03 % (ab 2024). **Es fehlt also keine dünne Klasse
systematisch;** der Ausfall trifft die mittlere Klasse in den frühen Jahren am stärksten und
ist in jeder Zelle weit unter der registrierten Warnschwelle.

> **Die scharfe Nullaussage hält:** kommt im 5-Minuten-Fenster kein Quote, zählt der
> Zeitpunkt als „kein Quote" und **nie** als Spanne 0. `bewerten(null)` liefert
> `{grund:'keinQuote'}` ganz ohne Spannenfeld; nur ein gesperrter Markt (`bp = ap`) ist
> Spanne 0 und wird getrennt als „gesperrt" gezählt (`{spanne:0, gesperrt:true}`).
> Sperrklinke `test-v6.js` Block 35.

### ⚠ Der Cent-Boden: „Hürde je Umsatzklasse" ist für liquide Werte eine PREISAUSSAGE

Die kleinste zulässige Preisstufe ist **1 Cent**. Eine Spanne von 1 Cent ist bei Kurs K genau
`100/K × 0,01` Pp — bei 20 $ **0,050 Pp**, bei 200 $ **0,005 Pp**. **Sobald ein Wert am
Cent-Boden steht, misst die Spanne in Pp nur noch seinen Kurs.**

Im Vollauf liegen **29–34 %** der `mitte`-Quotes jeder Klasse auf diesem Boden; in den frühen
Jahren der liquiden Klassen bis zu **63 %** (250-1000, 2016) bzw. **57 %** (ab1000, 2016).
Genau dort kehrt sich die Ordnung um: **2016 misst `ab1000` mit 0,0262 breiter als
`250-1000` mit 0,0234** — bei Median-Kursen von 98,36 $ gegen 71,76 $ ist das Arithmetik,
keine Marktbeobachtung. (Die registrierte Ordnungskontrolle prüft 5-50 gegen ab1000 und ist
in allen 11 Jahren erfüllt; die Umkehr zwischen den beiden liquiden Klassen fällt nicht
darunter.)

> **Wer eine Strategie auf Werten unter 30 $ handelt, zahlt mehr als jemand, der dieselbe
> Strategie auf Werten über 150 $ handelt — bei identischer Liquidität.**
>
> Das betrifft jede Kostenannahme dieses Projekts, auch die Paper-Messung oben, deren
> Symbolwahl heute **nur nach Umsatzklasse** schichtet und den Kurs nicht führt.
> *Fundstelle: Registrierung §9a, `ERGEBNIS.md` §2.0.*

### Zusatz A — die Spanne an den Momentum-Umschichtungen

Korbmitglieder um **15:55 ET am Umschichtungstag**, 41 Umschichtungen ab 2016, 2.137 gültige
Quotes. Der Korb-Nachbau hat die Positivkontrolle bestanden (`korbN` **41 von 41** Perioden
exakt wie `lauf-2026-09-01-22-52.json`); ohne sie wäre Zusatz A entfallen.

| Größe | Wert |
|---|---|
| Median über alle Korbmitglieder | **0,0439 Pp** |
| Median der Perioden-Mediane | 0,0421 Pp |
| p75 | 0,0835 Pp |
| engste / breiteste Umschichtung | 0,0203 (2018-08-21) / 0,1074 (2021-02-23) Pp |

Der Trend läuft nach oben: 2016–2018 liegen die Perioden zwischen 0,0203 und 0,0421, ab 2024
zwischen 0,0416 und 0,0856 — der Korb wächst dabei von 39 auf 95 Mitglieder.

**`ERGEBNIS.md` stellt Zusatz A keiner Hürde gegenüber.** Die Registrierung §6 nennt als
Endpunkt „Median-Spanne des Korbs je Umschichtung, **gegen die Hürde, die das Momentum-Buch
heute unterstellt**"; dieser Vergleich fehlt in der Auswertung und wird hier nicht
nachgerechnet.

### Zusatz B — Auktionen: Schluss gegen Folgeeröffnung

Abstand zwischen Schlussauktion und Folgeeröffnung in Pp, über **1.519 Symbole und 15.014
Tagespaare**.

> **⚠ Das ist KEINE Kostengröße** — so steht es wörtlich in `ERGEBNIS.md` §6. Es ist die
> Größe, **gegen die** eine Übernacht-Runde (`cls` → `opg` in `kosten.js`) anläuft, also der
> übliche Übernachtsprung, nicht sein Preis. **Eine gemessene Übernacht-Hürde liefert diese
> Studie nicht.** Die Registrierung §8 gibt der Übernacht-Familie ihre Hürde im
> **Schlussfenster** (Zeile `schluss` in der Tabelle oben) — dort allerdings nur über alle
> Jahre gepoolt und ohne Band; ein Schlussfenster-Wert je Regime wird nicht ausgewiesen.

| Größe | Wert |
|---|---|
| Median Übernachtsprung | **0,486 Pp** |
| p75 | 0,989 Pp |
| engstes / breitestes Jahr | 0,275 (2017) / 0,773 (2022) Pp |

Zum Vergleich: die Kassa-Hürde im Schlussfenster liegt zwischen 0,0317 (ab1000) und 0,0868
(5-50) Pp. **Der Übernachtsprung ist 6- bis 15-mal so groß wie die Spanne, an der man ihn
kaufen müsste** — das sagt nichts über sein Vorzeichen und belegt keine Kante.

### Was diese Zahlen NICHT sagen — Registrierung §9, wörtlich

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
  nicht. **Zusatz C ist registriert, aber nicht gebaut** (1.164 verschwundene Werte in
  `massive/tagesdaten/`); Richtung der Verzerrung: zu **enge** Spannen. Bis er läuft, tragen
  die Tabellen oben diesen Vermerk.
- **Der Vergleich mit dem Paper-Konto ist ein späterer Auftrag.** Er ist die Kontrolle dieser
  Studie, nicht ihr Bestandteil.

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
