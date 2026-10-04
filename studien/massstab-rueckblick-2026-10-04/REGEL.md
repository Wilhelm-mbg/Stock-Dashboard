# REGEL — Rückblick über fünf Jahre: Momentum-Buch gegen den S&P 500 nach Kosten (Auftrag Nr. 74)

Kennung `massstab-rueckblick-2026-10-04/v1`. Diese Datei ist **vor dem Lauf** geschrieben und mit Code und Tests zusammen
committet (Siegel). Teil A ist §1 des Auftrags `uebergabe/auftrag-massstab-rueckblick-2026-10-04.md` (Fassung 2 nach Zweitleser),
**wörtlich** und unverändert. Teil B nennt die gelesenen Konstanten mit Fundstelle. Teil C hält fest, wie der Code die Stellen
liest, die §1 offen lässt — gewählt ist jeweils die Lesart, die dem Buch der App am nächsten ist, sonst die vorsichtigere
gegen das Buch. Nach dem Siegel wird an A, B und C nichts mehr geändert.

## Teil A — die Regel, wörtlich

### §1 Die Regel (vom PM am 04.10.2026 festgelegt, bevor es eine Zahl gibt — nicht ändern; was nicht geht, melden statt anpassen)

1. **Daten:** Tages-Panel v2.2 mit den verschwundenen Reihen, `studien/querschnitt-pruefstand-2026-09-13/voll-v22/`, gelesen über
   `PR.Tafel(<ordner>)` aus `pruefstand.js` (Felder `T.g`: `tag, sym, klasse, rohSchluss, bSchluss, bEroeffnung, rendite, renditeOC, umsatz` —
   `umsatz` ist Dollar-Umsatz, vom PM an AAPL geprüft: 10,2 Mrd $ am 15.09.2026). **Fenster:** 16.09.2021 (erster Panel-Handelstag ab diesem
   Datum) bis 15.09.2026 (letzter Panel-Tag) — 1.254 Handelstage; davor liegen 1.436 Panel-Tage.
2. **Das Buch wird nachgespielt, nicht nachgebaut.** Der Rückblick ruft die Funktionen der App selbst (`mfhandel.js`, in Node ladbar):
   `momentumZiel(rohMap, { nowMs })` für die Zielliste, `planeUmschichtung(ziel, buch, preise)`, `fuehreAus(buch, plan, nowMs, 20)` und
   `bewerte(buch, preise)`. **Kosten: 20 Basispunkte je Seite** — der Wert, den das Buch der App übergibt (`mfdepot.js` Zeile 158). Damit gilt
   alles, was das Buch tut, ohne dass es hier wiederholt werden muss; zur Kontrolle, was das ist: Mindestlänge 253 Tage; Stärke = Kurs vor
   21 Tagen gegen Kurs vor 252 Tagen; Korbfilter Median-Tagesumsatz ≥ 100 Mio $ über 20 Balken, vor der Rangbildung; mindestens **100**
   zulässige Werte (`Li.KORB.mindestWerte` — `Mo.STANDARD.minWerte` = 25 benutzt das Buch nicht); Zielzahl `max(5, round(Anzahl × 0,1))`;
   Positionen, die im Ziel bleiben, werden **nicht** nachjustiert; jeder Neukauf bekommt `Depotwert / Zielzahl`, bei zu wenig Bargeld
   verkleinert. Startkapital 100.000.
   - **`rohMap` am Stichtag t:** für jede **Aktienreihe** des Panels die Zeilen bis einschließlich t als
     `[Zeitstempel des Tages, bSchluss, umsatz / bSchluss]` (Kurs × Stück ist dann der Dollar-Umsatz des Panels); `nowMs` = Zeitstempel von t.
     Gebraucht werden je Reihe nur die letzten 253 Zeilen. Reihen, deren letzte Zeile mehr als 7 Kalendertage vor t liegt, wirft
     `momentumZiel` selbst hinaus — das ist die Regel des Buchs gegen eingefrorene Kurse und zugleich der Umgang mit verschwundenen Reihen.
   - **Referenzreihen gehören nicht in die `rohMap`** (Merkmal `referenz` in den Symbolangaben des Panels; SPY ist eine). SPY darf an keinem
     Stichtag im Ziel stehen — Klinke.
3. **Zeitablauf.** Der erste **Ausführungstag** ist der 16.09.2021. **Stichtag ist immer der Panel-Handelstag vor dem Ausführungstag**
   (Zielliste aus den Schlusskursen des Stichtags), gehandelt wird zur **Eröffnung des Ausführungstags** (`preise` = `bEroeffnung` dieses Tages;
   ein Wert ohne Kurs an diesem Tag wird behandelt, wie `planeUmschichtung` es tut: nicht gekauft, eine Position ohne Kurs gehalten). Der
   nächste Ausführungstag ist der **63. Panel-Handelstag nach dem letzten ausgeführten** (so zählt `rebalanceFaellig`). Meldet `momentumZiel`
   `zuWenig`, wird nicht umgeschichtet und am nächsten Handelstag neu versucht, wie das Buch es täte; solche Tage zählen (Erwartung: 0).
   **Bewertet** wird täglich zum Schluss (`bSchluss`); fehlt einer gehaltenen Reihe an einem Tag die Zeile, gilt ihr letzter Schlusskurs
   (nie der Einstand). **Ende:** Schluss des 15.09.2026.
4. **Reihenende während des Haltens:** am ersten Panel-Handelstag nach der letzten Zeile einer gehaltenen Reihe wird die Position ausgebucht —
   Hauptregel des Prüfstands (`K.EMPFINDLICHKEIT[0]`): Ende-Grund Insolvenz oder Zwangs-Delisting → Wert 0; sonst Gutschrift zum letzten
   Schlusskurs ohne Verkaufskosten. Ende-Grund aus der Tafel (`T.endeGrund`). Nachrichtlich daneben „streng" und „milde".
5. **Gesamtertrag auf beiden Seiten — das Panel führt keine Ausschüttungen** (`VORREGISTRIERUNG.md` des Prüfstands, Zeile ≈ 107; vom PM
   geprüft). Jede Barausschüttung zählt am Ex-Tag mit dem Satz `rate / rohSchluss des Vortags`, für Buch und Maßstab **mit derselben
   Funktion** berechnet. Beim **Buch** geht sie als Bargeld ins Buch (`Stück × bSchluss des Vortags × Satz`) und wird mit der nächsten
   Umschichtung wieder angelegt — wie in einem echten Depot. Beim **Maßstab** wird sie am Ex-Tag zum Schlusskurs wieder in SPY angelegt.
   Dieser Unterschied ist gewollt und klein; in `REGEL.md` nennen. **Quelle:** eine Datei je Kürzel-Ordner,
   `E:/Markt-Dashboard-Archiv/alpaca-massnahmen/<ordner>.json` (**nur lesen**; `<ordner>` aus den Symbolangaben des Panels; Aufbau
   `{ sym, saetze: [ … ] }`, vom PM an `SPY.json` angesehen); gezählt werden Sätze mit `_art: 'cash_dividends'` (auch `special: true`), deren
   `ex_date` in der Haltezeit der Position liegt. Fehlt die Datei, gilt „keine Ausschüttung" und der Fall wird gezählt. **Berichten:** Zahl
   der gehaltenen Positionen mit und ohne Datei, Zahl der gebuchten Ausschüttungen, Ertrag aus Ausschüttungen p. a. beim Buch und bei SPY
   (Erwartung aus Teil 2 des Prüfstands: Zehntel etwa 0,8 %, SPY 1,3–1,9 % — weicht es stark ab, ist das ein Befund).
   **Nachrichtlich** daneben derselbe Vergleich als reiner Kursertrag beider Seiten.
6. **Maßstab:** SPY aus dem Panel (Referenzreihe `SPY`, dieselbe Tagesbildung wie die Aktien; vom PM geprüft: letzte Zeile 15.09.2026,
   20 Ausschüttungen im Fenster, zusammen 34,07 $). Kauf zur Eröffnung desselben ersten Ausführungstags wie das Buch, **ohne Kosten**,
   Bewertung zum Schluss. Die Gegenprobe gegen eine zweite SPY-Quelle macht der PM bei der Abnahme.
7. **Korb aus dem Panel, nicht aus der App-Liste:** das Buch der App rangiert die Werte, die die App führt; der Rückblick rangiert alle Aktien
   des Panels (mit den verschwundenen) nach derselben Funktion. Bei 100 Mio $ Umsatzschwelle ist das weitgehend dieselbe Menge — in `REGEL.md`
   in einem Satz nennen, die Zahl der zulässigen Werte und die Zielzahl je Umschichtung berichten.
8. **Hauptzahl:** Gesamtertrag des Buchs nach Kosten über das Fenster gegen den Gesamtertrag von SPY. **„Schlägt den Markt" heißt: Buch > SPY.**
   Dazu: Ertrag p. a. beider, Abstand in Pp p. a., Tabelle je Kalenderjahr, größter Rückschlag beider (auf Tagesschlüssen), Zahl der
   Umschichtungen, gezahlte Kosten, Zahl und Art der Reihenenden im Buch, mittlerer Bargeldanteil.
   **Periode** heißt hier immer: von einem Ausführungstag zum nächsten. Periodenertrag = Wert zum Schluss des Stichtags vor dem nächsten
   Ausführungstag gegen den Wert zum Schluss des Stichtags vor diesem Ausführungstag (erste Periode: gegen das Startkapital, beim Maßstab gegen
   den Kaufkurs); die letzte, angebrochene Periode endet am 15.09.2026. Je Periode: Ausführungstag, zulässige Werte, Zielzahl, Buch, SPY.
9. **Zufallsbereich (Pflicht, steht neben der Hauptzahl):** (a) *Startphase:* dieselbe Rechnung für 63 Starttage — erster Ausführungstag
   k Panel-Handelstage nach dem 16.09.2021, k = 0 … 62; Buch und Maßstab starten beide dort, Ende für alle am 15.09.2026: Minimum, Median,
   Maximum des Abstands Buch − SPY in Pp p. a. und die Zahl der Phasen mit Buch > SPY. **Die Hauptzahl ist k = 0.** (b) *Periodenstreuung*
   für k = 0: Abstand Buch − SPY je Periode — Mittel, Standardfehler (Standardabweichung / √n), 95-%-Band mit dem t-Wert für n − 1.
   Sonst nichts: keine Parametervariation, kein anderes Fenster, kein anderer Korb, keine Auswahl unter den 63 Phasen.
10. **Ein Lauf.** Reihenfolge: `REGEL.md` (dieser §1 wörtlich, dazu die gelesenen Konstanten mit Fundstelle), Code und Tests committen
   (**Siegel-Commit**), dann der Lauf, dann Ergebnis committen. Ein Fehler im Code wird benannt, behoben, der Lauf wiederholt und in
   `ergebnis.json` unter `korrekturen` vermerkt (sonst leere Liste). Ein Ergebnis, das nicht gefällt, ist kein Fehler.

## Teil B — gelesene Konstanten (Fundstelle)

| Größe | Wert | Fundstelle |
|---|---|---|
| Rückblick / Lücke / Halten / Anteil | 231 / 21 / 63 / 0,1 | `momentum.js` `STANDARD`, gelesen über `MH.buchKonfig()` (`mfhandel.js` Z. 29–33) |
| `Mo.STANDARD.minWerte` | 25 — vom Buch **nicht** benutzt | `mfhandel.js` Z. 49 nimmt `K.mindestWerte` |
| Korbregel | Median-Tagesumsatz ≥ 100.000.000 $ über 20 Balken, mindestens 100 zulässige Werte | `liquide.js` Z. 32–36 (`KORB`) |
| Median | `sortiert[n >> 1]` (oberer der beiden mittleren) | `liquide.js` Z. 40–43 |
| Mindestlänge | 231 + 21 + 1 = 253 Zeilen | `mfhandel.js` Z. 65 |
| Stärke | `r[i-21][1] / r[i-252][1] - 1` | `mfhandel.js` Z. 76 und 86 |
| veraltete Reihe | letzte Zeile mehr als 7 × 86.400.000 ms vor `nowMs` | `mfhandel.js` Z. 52 und 68 |
| Zielzahl | `max(5, round(Anzahl × 0,1))` | `mfhandel.js` Z. 92 |
| Kosten | 20 Basispunkte je Seite | `mfdepot.js` Z. 158: `MH.fuehreAus(d.mfBuch, plan, now, 20)` |
| nächste Umschichtung | 63 Handelstage nach `letztesRebalanceT`; gesetzt nur, wenn ausgeführt wurde | `mfhandel.js` Z. 176–181, `mfdepot.js` Z. 145 und 155–159 |
| Reihenende, Hauptregel | Totalverlust bei `insolvenz`, `zwangs-delisting` | `konfig.js` Z. 150–155 (`EMPFINDLICHKEIT[0]`); „streng" zusätzlich `unbekannt`, `freiwillig`; „milde" nie |
| Panel | Kennung `querschnitt-pruefstand-2026-09-13/panel/v2.2`, 9.904.017 Zeilen, 7.479 Reihen, davon 1 Referenzreihe (`SPY`); letzter voller Tag 2026-09-15 (Tagesindex 2689), erster Fenstertag 2021-09-16 (Tagesindex 1436); kein Kalendertag bis dahin ohne Panel-Zeilen | Struktur-Sonde des Chats vor dem Siegel (nur Aufbau, keine Erträge) |
| Ende-Gründe im Panel | ohne 2.304, `uebernahme` 1.653, `umbenennung-ticker` 1.330, `zwangs-delisting` 547, `insolvenz` 357, `freiwillig` 311, `fusion-aktientausch` 310, `spac-ende` 276, `unbekannt` 212, `notierung-unterbrochen` 141, `kuerzel-neu-vergeben` 38 | dieselbe Sonde (`stand.symbole[].ende_grund`) |
| Maßnahmen-Datei | `{ sym, stand, quelle, von, bis, saetze, anwendbar, ohneFaktor }`; Satz: `_art`, `ex_date`, `rate` (Zahl), `special` | `E:/Markt-Dashboard-Archiv/alpaca-massnahmen/SPY.json` (20 Sätze mit Ex-Tag nach dem 16.09.2021, Summe 34,0657 $) |
| Startkapital / Startphasen | 100.000 / 63 | Auftrag §1.2, §1.9 |

## Teil C — Lesarten des Codes (vor dem Lauf festgelegt)

1. **Aktienreihe** heißt: jede Reihe des Panels ohne das Merkmal `referenz` (§1.2; im Panel trägt es allein `SPY`). Schlüssel der
   `rohMap` ist der Reihenname (`reihe`); die Reihenfolge der Schlüssel ist die Reihenfolge des Panels (bei gleicher Stärke
   entscheidet sie über den Rang, wie die stabile Sortierung der App es tut).
2. **Zeitstempel des Tages** ist Mitternacht UTC des Panel-Datums; damit sind „7 Kalendertage" exakt ganze Tage.
3. **Ausschüttung im Buch:** Anspruch hat, wer die Position über die Nacht vor dem Ex-Tag hielt — ein Kauf zur Eröffnung des
   Ex-Tags zählt nicht, ein Verkauf zur Eröffnung des Ex-Tags zählt noch. Gutgeschrieben wird am Ex-Tag **nach** dem Handel
   dieses Tages; fällt der Ex-Tag auf einen Ausführungstag, steht das Geld also erst der folgenden Umschichtung
   (63 Handelstage später) zur Verfügung (in einem echten Depot kommt es Wochen später; vorsichtigere Lesart gegen das Buch). Beim Maßstab zählen
   Ex-Tage **nach** dem Kauftag. Der Unterschied Buch (Bargeld bis zur nächsten Umschichtung) gegen Maßstab (Wiederanlage
   am Ex-Tag zum Schluss) ist nach §1.5 gewollt und klein.
4. **Ex-Datum ohne Panel-Handelstag** wird am ersten Panel-Handelstag danach gebucht; „Vortag" ist die letzte Zeile der Reihe
   vor diesem Tag. Sätze mit `rate` ≤ 0 und Ex-Tage nach der letzten Zeile einer Reihe zählen nicht. Mehrere Sätze am selben
   Ex-Tag zählen alle (gezählt wird, wie oft das vorkommt; der größte Einzelsatz wird berichtet, nicht gefiltert).
5. **Reihenende** wird am Ausbuchungstag vor dem Handel gebucht. Ein fehlender Ende-Grund fällt unter „sonst" (letzter
   Schlusskurs) — das träfe auch den bekannten Mangel Nr. 72 (39 abgegangene Kleinwerte als lebend geführt, weit unter der
   Umsatzschwelle); steht einer im Buch, wird er gezählt und gemeldet, nicht behoben. Eine Lücke (Reihe später wieder da)
   ist kein Ende: letzter Schlusskurs, zur Umschichtung ohne Kurs gehalten.
6. **p. a.** ist geometrisch über Kalendertage / 365,25 vom ersten Ausführungstag bis zum 15.09.2026; der Abstand ist die
   Differenz der beiden p.-a.-Werte. Bei den Startphasen gilt für jede Phase ihre eigene Dauer.
7. **Ertrag aus Ausschüttungen p. a.** = p. a. mit Ausschüttungen minus p. a. als reiner Kursertrag (zweiter Nachlauf ohne
   Ausschüttungen, beide Seiten). „Streng", „milde" und der reine Kursertrag werden nur für k = 0 gerechnet.
8. **Größter Rückschlag** auf den Tagesschlüssen ab dem ersten Ausführungstag. **Kalenderjahr:** Jahresschluss gegen
   Vorjahresschluss, das erste Jahr gegen das Startkapital, das letzte bis zum 15.09.2026. **Bargeldanteil:** Mittel über die
   Tage von Bargeld / Buchwert zum Schluss. **Kosten:** Wert des Buchs zu Eröffnungskursen vor minus nach `fuehreAus`.
9. **Bewertung** über `bewerte` der App (rundet auf Cent). Der t-Wert kommt aus einer Tabelle (n − 1 = 1 … 30).
10. **Korb (§1.7):** das Buch der App rangiert die Werte, die die App führt; der Rückblick rangiert alle Aktienreihen des Panels
    (mit den verschwundenen) nach derselben Funktion.
11. **Nicht behoben, nur genannt:** eine Reihe mit Ende-Grund `umbenennung-ticker` endet im Panel als Reihe. Wird sie gehalten,
    bucht §1.4 sie zum letzten Schlusskurs aus (Bargeld bis zur nächsten Umschichtung); die Nachfolgereihe rangiert erst
    wieder, wenn sie 253 Zeilen hat. Das folgt aus §1.2 und §1.4 und wird im Ergebnis über die Zahl der Reihenenden je Grund
    sichtbar.

## Teil D — Prüfungen vor dem Lauf

`test.js` (§2 des Auftrags): Kunstpanel mit von Hand gerechneten Sollwerten (Periode, Kosten, nicht gehandelte Position,
Reihenende mit Wert 0 und letztem Kurs, angebrochene Periode, `zuWenig`), Ausschüttung im Buch und beim Maßstab, kein Blick
voraus mit Gegenprobe, Referenzreihe nie im Ziel mit Gegenprobe, die beiden Kunstfälle (SPY-gleich → Abstand = minus Kosten;
eingepflanzter Vorsprung → „schlägt: ja"), `rohMap` am echten Panel an einem Stichtag und 30 Werten.
